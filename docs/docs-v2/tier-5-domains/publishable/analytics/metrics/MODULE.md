# @mcv/analytics/metrics

> **Tier 5 — Domain Module (Publishable)**
> Core metrics engine powering all analytics dashboards across the MCV platform.

---

## Purpose

The **metrics** module is the central nervous system of MCV's analytics infrastructure. It provides a unified framework for defining, computing, storing, querying, and governing business metrics across every venture in the portfolio. Rather than having each venture or department maintain ad-hoc metric calculations scattered across spreadsheets, backend services, and dashboard tools, `@mcv/analytics/metrics` consolidates all metric logic into a single, authoritative engine. When a leadership team asks "What's our MRR?", the answer comes from here — computed consistently, stored efficiently, and governed by clear ownership and access rules.

At its core, the module solves three hard problems simultaneously. First, **metric definition and computation**: business metrics like MRR, churn rate, CAC, LTV, NPS, DAU/MAU, and conversion rates are formally defined with precise computation logic, data source bindings, and refresh schedules. Metrics can be atomic (computed directly from raw events or financial records) or derived (computed from other metrics, like LTV = ARPU / churn rate). Second, **time-series storage and aggregation**: every computed metric value is stored with temporal granularity (minute through month) and dimensional tags (venture, department, product, channel, geography), enabling fast historical queries, trend analysis, and cross-venture benchmarking. Third, **governance and freshness**: every metric has an owner, visibility rules, computation freshness tracking, and goal/threshold alerting — ensuring that stale or unauthorized data never reaches a dashboard.

The module integrates deeply with `@mcv/cdp` for behavioral event streams, `@mcv/finance` for revenue and billing data, and `@mcv/engagement` for user activity signals. It exposes both a programmatic TypeScript API for service-to-service consumption and a query interface optimized for dashboard rendering. All data is stored in Supabase PostgreSQL with the TimescaleDB extension for efficient time-series operations, and the entire system is multi-tenant by design — each venture maintains isolated metric namespaces while global cross-venture metrics enable portfolio-level reporting.

---

## Exports

```typescript
// @mcv/analytics/metrics — public API

// ── Core Service ─────────────────────────────────────────────
export { MetricService }              from './services/metric-service';
export { MetricComputeEngine }        from './services/compute-engine';
export { TimeSeriesStore }            from './services/time-series-store';
export { GoalTracker }                from './services/goal-tracker';
export { MetricCatalog }              from './services/metric-catalog';
export { MetricAggregator }           from './services/metric-aggregator';
export { BenchmarkService }           from './services/benchmark-service';
export { FreshnessMonitor }           from './services/freshness-monitor';
export { MetricPermissions }          from './services/metric-permissions';
export { DerivedMetricResolver }      from './services/derived-metric-resolver';

// ── Types & Interfaces ──────────────────────────────────────
export type {
  MetricDefinition,
  MetricValue,
  MetricSnapshot,
  TimeSeriesQuery,
  TimeSeriesResult,
  GoalConfig,
  GoalProgress,
  GoalAlert,
  AggregationRule,
  AggregationResult,
  DerivedMetricFormula,
  MetricCatalogEntry,
  MetricFreshness,
  MetricPermissionRule,
  BenchmarkComparison,
  BenchmarkDataset,
  ComputationJob,
  ComputationResult,
  MetricDimension,
  MetricTag,
  MetricGranularity,
  MetricCategory,
  MetricOwnership,
  MetricDataSource,
  MetricFilter,
  MetricSortOrder,
  MetricThreshold,
  MetricAlert,
  MetricAlertChannel,
  MetricHistoryOptions,
  MetricExportFormat,
} from './types';

// ── Enums ───────────────────────────────────────────────────
export {
  Granularity,
  MetricType,
  MetricStatus,
  ComputationMode,
  AggregationFunction,
  GoalDirection,
  AlertSeverity,
  FreshnessLevel,
  PermissionLevel,
  MetricCategoryEnum,
} from './enums';

// ── Schema (Drizzle ORM) ────────────────────────────────────
export {
  metricDefinitions,
  metricValues,
  metricGoals,
  metricComputations,
  metricCatalog,
  metricPermissions,
  metricBenchmarks,
  metricDependencies,
  metricAlerts,
  metricAuditLog,
} from './schema';

// ── Utilities ───────────────────────────────────────────────
export { createMetricService }        from './factory';
export { metricDefaults }             from './defaults';
export { validateMetricDefinition }   from './validators';
export { formatMetricValue }          from './formatters';
export { parseMetricExpression }      from './expression-parser';
export { buildTimeSeriesQuery }       from './query-builder';

// ── Hooks (React — dashboard consumption) ───────────────────
export { useMetric }                  from './hooks/use-metric';
export { useMetricHistory }           from './hooks/use-metric-history';
export { useGoalProgress }            from './hooks/use-goal-progress';
export { useMetricCatalog }           from './hooks/use-metric-catalog';
export { useLiveMetric }              from './hooks/use-live-metric';

// ── Constants ───────────────────────────────────────────────
export {
  STANDARD_METRICS,
  DEFAULT_GRANULARITIES,
  FRESHNESS_THRESHOLDS,
  MAX_QUERY_RANGE_DAYS,
  COMPUTATION_TIMEOUT_MS,
  METRIC_VALUE_PRECISION,
} from './constants';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA SOURCES                                       │
│                                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │  @mcv/cdp    │   │ @mcv/finance │   │ @mcv/engage  │   │  External APIs   │ │
│  │  (events)    │   │  (revenue)   │   │  (activity)  │   │  (benchmarks)    │ │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘ │
│         │                  │                   │                    │           │
└─────────┼──────────────────┼───────────────────┼────────────────────┼───────────┘
          │                  │                   │                    │
          ▼                  ▼                   ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         METRIC DEFINITION LAYER                                 │
│                                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │ Metric Catalog   │  │ Metric Validator  │  │ Expression Parser            │   │
│  │ (definitions,    │  │ (schema checks,   │  │ (derived metric formulas,    │   │
│  │  ownership,      │  │  data source      │  │  dependency resolution,      │   │
│  │  categories)     │  │  validation)      │  │  circular detection)         │   │
│  └────────┬────────┘  └────────┬─────────┘  └──────────────┬───────────────┘   │
│           │                    │                            │                   │
└───────────┼────────────────────┼────────────────────────────┼───────────────────┘
            │                    │                            │
            ▼                    ▼                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        COMPUTATION ENGINE                                       │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        MetricComputeEngine                              │    │
│  │                                                                         │    │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐     │    │
│  │   │  Real-time    │  │  Batch        │  │  Derived Metric          │     │    │
│  │   │  Pipeline     │  │  Scheduler    │  │  Resolver                │     │    │
│  │   │  (streaming   │  │  (cron-based  │  │  (topological sort,      │     │    │
│  │   │   aggregation │  │   full        │  │   formula evaluation,    │     │    │
│  │   │   windows)    │  │   recompute)  │  │   cascading refresh)     │     │    │
│  │   └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘     │    │
│  │          │                 │                        │                    │    │
│  └──────────┼─────────────────┼────────────────────────┼────────────────────┘    │
│             │                 │                        │                         │
└─────────────┼─────────────────┼────────────────────────┼─────────────────────────┘
              │                 │                        │
              ▼                 ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       TIME-SERIES STORE                                         │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │              Supabase PostgreSQL + TimescaleDB                          │    │
│  │                                                                         │    │
│  │   ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐   │    │
│  │   │ metric_values  │  │ Continuous      │  │ Compression &          │   │    │
│  │   │ (hypertable,   │  │ Aggregates      │  │ Retention Policies     │   │    │
│  │   │  partitioned   │  │ (auto rollup    │  │ (minute→7d, hour→90d, │   │    │
│  │   │  by time)      │  │  minute→hour    │  │  day→5y, month→∞)     │   │    │
│  │   │                │  │  →day→month)    │  │                        │   │    │
│  │   └────────────────┘  └────────────────┘  └────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└────────────────────────────────┬────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          QUERY & GOVERNANCE LAYER                               │
│                                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Aggregator   │  │ Goal Tracker │  │  Freshness   │  │   Permissions      │  │
│  │  (rollup by   │  │ (targets,    │  │  Monitor     │  │   (role-based,     │  │
│  │   dimension,  │  │  progress,   │  │  (staleness  │  │    metric-level    │  │
│  │   cross-      │  │  alerts)     │  │   detection, │  │    access control) │  │
│  │   venture)    │  │              │  │   SLA)       │  │                    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘  │
│         │                 │                  │                   │              │
└─────────┼─────────────────┼──────────────────┼───────────────────┼──────────────┘
          │                 │                  │                   │
          ▼                 ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CONSUMERS                                             │
│                                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Dashboards   │  │  Reports     │  │  Alerts      │  │  External APIs   │   │
│  │  (React hooks │  │  (scheduled  │  │  (Slack,     │  │  (investor       │   │
│  │   real-time)  │  │   PDF/CSV)   │  │   email,     │  │   portal,        │   │
│  │              │  │              │  │   webhook)   │  │   partner feeds)  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### MetricDefinition

The foundational type describing what a metric is, how it's computed, and who owns it.

```typescript
/**
 * Complete definition of a business metric.
 * This is the "blueprint" — it describes what the metric is and how to compute it,
 * but does not contain any actual values.
 */
interface MetricDefinition {
  /** Unique identifier (e.g., 'mrr', 'churn_rate', 'dau') */
  id: string;

  /** Venture-scoped ID. Null for global/cross-venture metrics. */
  ventureId: string | null;

  /** Human-readable name (e.g., 'Monthly Recurring Revenue') */
  name: string;

  /** Detailed description of what this metric measures and why it matters */
  description: string;

  /** Short description for catalog listings */
  shortDescription: string;

  /** Category for organization */
  category: MetricCategory;

  /** The type of metric (counter, gauge, rate, ratio, currency, percentage, score) */
  type: MetricType;

  /** Unit of measurement (e.g., 'USD', 'users', 'percent', 'score') */
  unit: string;

  /** Number of decimal places for display */
  precision: number;

  /** How this metric is computed */
  computationMode: ComputationMode;

  /**
   * For atomic metrics: SQL query or computation function reference.
   * For derived metrics: expression formula (e.g., 'arpu / churn_rate').
   */
  computation: MetricComputation;

  /** Data sources this metric reads from */
  dataSources: MetricDataSource[];

  /** For derived metrics: IDs of metrics this depends on */
  dependencies: string[];

  /** Supported granularities for this metric */
  granularities: Granularity[];

  /** Default granularity when none specified */
  defaultGranularity: Granularity;

  /** Dimensions this metric can be sliced by */
  dimensions: MetricDimension[];

  /** Tags for searchability */
  tags: MetricTag[];

  /** Who owns this metric definition */
  ownership: MetricOwnership;

  /** Access control rules */
  permissions: MetricPermissionRule[];

  /** Freshness requirements */
  freshness: {
    /** Maximum acceptable age of computed values */
    maxStalenessMs: number;
    /** Computation schedule (cron expression) */
    schedule: string;
    /** Whether real-time streaming computation is enabled */
    realtime: boolean;
  };

  /** Display configuration for dashboards */
  display: {
    /** Preferred chart type */
    chartType: 'line' | 'bar' | 'area' | 'gauge' | 'number' | 'sparkline';
    /** Color scheme */
    color: string;
    /** Whether higher is better (for goal tracking) */
    higherIsBetter: boolean;
    /** Format string (e.g., '$#,##0.00') */
    formatPattern: string;
  };

  /** Whether this metric is active */
  status: MetricStatus;

  /** Schema version for migration compatibility */
  version: number;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  lastComputedAt: Date | null;
}

/** How a metric is computed */
interface MetricComputation {
  /** 'query' for SQL-based, 'function' for code-based, 'expression' for derived */
  kind: 'query' | 'function' | 'expression';

  /**
   * For 'query': a parameterized SQL template.
   * For 'function': fully qualified function reference (module:functionName).
   * For 'expression': formula string (e.g., 'metric:arpu / metric:churn_rate').
   */
  source: string;

  /** Parameters injected into the computation */
  parameters: Record<string, unknown>;

  /** Timeout for computation */
  timeoutMs: number;

  /** Retry configuration */
  retry: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/** Data source binding for a metric */
interface MetricDataSource {
  /** Source module (e.g., '@mcv/cdp', '@mcv/finance') */
  module: string;

  /** Specific table or event type */
  entity: string;

  /** How data is consumed: 'pull' (query on compute) or 'push' (streaming) */
  mode: 'pull' | 'push';

  /** Filter to apply when reading from this source */
  filter?: Record<string, unknown>;
}
```

### MetricValue

```typescript
/**
 * A single computed metric value at a point in time.
 * This is what gets stored in the time-series database.
 */
interface MetricValue {
  /** Reference to the metric definition */
  metricId: string;

  /** Venture this value belongs to (null for global metrics) */
  ventureId: string | null;

  /** The computed numeric value */
  value: number;

  /** Previous value (for delta computation) */
  previousValue: number | null;

  /** Absolute change from previous period */
  delta: number | null;

  /** Percentage change from previous period */
  deltaPercent: number | null;

  /** Start of the time bucket */
  timestamp: Date;

  /** End of the time bucket */
  timestampEnd: Date;

  /** Granularity of this value */
  granularity: Granularity;

  /** Dimensional breakdown (e.g., { department: 'engineering', channel: 'organic' }) */
  dimensions: Record<string, string>;

  /** Number of raw data points aggregated into this value */
  sampleCount: number;

  /** Statistical metadata */
  stats: {
    min: number | null;
    max: number | null;
    avg: number | null;
    median: number | null;
    p95: number | null;
    p99: number | null;
    stddev: number | null;
  } | null;

  /** ID of the computation job that produced this value */
  computationId: string;

  /** Data quality indicator */
  quality: 'complete' | 'partial' | 'estimated' | 'stale';

  /** When this value was computed */
  computedAt: Date;
}

/**
 * A snapshot of the current state of a metric — used for "big number" displays.
 */
interface MetricSnapshot {
  metricId: string;
  ventureId: string | null;
  name: string;
  currentValue: number;
  previousValue: number;
  delta: number;
  deltaPercent: number;
  trend: 'up' | 'down' | 'flat';
  trendIsPositive: boolean;
  unit: string;
  formattedValue: string;
  formattedDelta: string;
  granularity: Granularity;
  computedAt: Date;
  freshness: FreshnessLevel;
  sparkline: number[];  // Last N values for mini chart
}
```

### TimeSeriesQuery

```typescript
/**
 * Query specification for retrieving time-series metric data.
 * Designed to be expressive enough for complex dashboard queries
 * while remaining efficient for the TimescaleDB backend.
 */
interface TimeSeriesQuery {
  /** Metric(s) to query — single ID or array for multi-metric charts */
  metricIds: string | string[];

  /** Venture scope — null means global/cross-venture */
  ventureId: string | null;

  /** Time range */
  timeRange: {
    start: Date;
    end: Date;
  };

  /** Desired granularity for results */
  granularity: Granularity;

  /** Dimensional filters (only return values matching these dimensions) */
  filters?: MetricFilter[];

  /** Group results by these dimensions */
  groupBy?: string[];

  /** Aggregation function when grouping */
  aggregation?: AggregationFunction;

  /** Fill strategy for missing time buckets */
  fillPolicy: 'none' | 'zero' | 'null' | 'previous' | 'interpolate';

  /** Sort order */
  orderBy: 'time_asc' | 'time_desc' | 'value_asc' | 'value_desc';

  /** Pagination */
  limit?: number;
  offset?: number;

  /** Whether to include statistical metadata */
  includeStats: boolean;

  /** Whether to compute deltas between consecutive points */
  includeDeltas: boolean;

  /** Compare against a previous period */
  comparison?: {
    /** 'previous_period' shifts back by the query range; 'year_over_year' shifts back 365 days */
    type: 'previous_period' | 'year_over_year' | 'custom';
    /** For 'custom' type: explicit comparison range */
    customRange?: { start: Date; end: Date };
  };
}

/** Result of a time-series query */
interface TimeSeriesResult {
  /** The metric(s) queried */
  metricIds: string[];

  /** The actual granularity returned (may differ from requested if data unavailable) */
  granularity: Granularity;

  /** Total number of data points (before pagination) */
  totalPoints: number;

  /** The time-series data */
  series: TimeSeriesDataPoint[];

  /** Comparison series (if comparison was requested) */
  comparisonSeries?: TimeSeriesDataPoint[];

  /** Summary statistics across the entire result set */
  summary: {
    min: number;
    max: number;
    avg: number;
    sum: number;
    count: number;
    first: number;
    last: number;
    change: number;
    changePercent: number;
  };

  /** Query performance metadata */
  meta: {
    queryTimeMs: number;
    fromCache: boolean;
    dataQuality: 'complete' | 'partial' | 'degraded';
    freshnessLevel: FreshnessLevel;
    lastComputedAt: Date;
  };
}

/** Single point in a time-series result */
interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  delta?: number;
  deltaPercent?: number;
  dimensions?: Record<string, string>;
  quality: 'complete' | 'partial' | 'estimated' | 'stale';
  stats?: {
    min: number;
    max: number;
    avg: number;
    sampleCount: number;
  };
}
```

### GoalConfig

```typescript
/**
 * Configuration for tracking a metric against a target.
 * Goals enable automated progress tracking and threshold alerts.
 */
interface GoalConfig {
  /** Unique goal ID */
  id: string;

  /** The metric being tracked */
  metricId: string;

  /** Venture this goal belongs to */
  ventureId: string;

  /** Human-readable goal name (e.g., 'Q1 2026 MRR Target') */
  name: string;

  /** Detailed description */
  description: string;

  /** Target value */
  targetValue: number;

  /** Starting value (baseline when goal was set) */
  baselineValue: number;

  /** Direction: are we trying to go up or down? */
  direction: GoalDirection;

  /** Time period for the goal */
  period: {
    start: Date;
    end: Date;
  };

  /** Milestones along the way */
  milestones: GoalMilestone[];

  /** Alert thresholds */
  thresholds: MetricThreshold[];

  /** Who should be alerted */
  alertChannels: MetricAlertChannel[];

  /** Dimensional scope (e.g., only track for department='sales') */
  dimensionFilter?: Record<string, string>;

  /** Whether the goal is active */
  active: boolean;

  /** Who created this goal */
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** A milestone within a goal */
interface GoalMilestone {
  /** Milestone name (e.g., '50% of target') */
  name: string;
  /** Target value for this milestone */
  value: number;
  /** Expected date to reach this milestone */
  expectedDate: Date;
  /** Whether this milestone has been reached */
  reached: boolean;
  /** Actual date reached (if applicable) */
  reachedAt: Date | null;
}

/** Progress report for a goal */
interface GoalProgress {
  goalId: string;
  metricId: string;
  goalName: string;
  targetValue: number;
  currentValue: number;
  baselineValue: number;
  progressPercent: number;
  remainingValue: number;
  daysRemaining: number;
  daysElapsed: number;
  requiredDailyRate: number;
  actualDailyRate: number;
  onTrack: boolean;
  projectedValue: number;
  projectedDate: Date | null;
  trend: 'accelerating' | 'steady' | 'decelerating' | 'stalled';
  milestones: (GoalMilestone & { progressPercent: number })[];
  alerts: GoalAlert[];
}

/** Alert triggered by goal threshold breach */
interface GoalAlert {
  id: string;
  goalId: string;
  severity: AlertSeverity;
  message: string;
  threshold: MetricThreshold;
  currentValue: number;
  triggeredAt: Date;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  resolved: boolean;
  resolvedAt: Date | null;
}
```

### AggregationRule

```typescript
/**
 * Rules for rolling up metrics across dimensions.
 * Used for cross-venture portfolio views and departmental summaries.
 */
interface AggregationRule {
  /** Unique rule ID */
  id: string;

  /** Name of this aggregation (e.g., 'Portfolio MRR') */
  name: string;

  /** Source metric to aggregate */
  sourceMetricId: string;

  /** Target metric where aggregated result is stored */
  targetMetricId: string;

  /** Dimensions to aggregate across */
  aggregateDimensions: string[];

  /** Dimensions to preserve (group by) */
  preserveDimensions: string[];

  /** Aggregation function */
  function: AggregationFunction;

  /** Optional weight metric for weighted averages */
  weightMetricId?: string;

  /** Filter to apply before aggregation */
  filter?: MetricFilter[];

  /** Venture IDs to include (null = all) */
  ventureIds: string[] | null;

  /** Whether to exclude ventures with incomplete data */
  requireComplete: boolean;

  /** Schedule for running this aggregation */
  schedule: string;

  /** Whether this rule is active */
  active: boolean;
}

/** Result of an aggregation operation */
interface AggregationResult {
  ruleId: string;
  targetMetricId: string;
  value: number;
  contributingVentures: number;
  totalVentures: number;
  completeness: number;  // 0-1, fraction of ventures with data
  breakdown: {
    ventureId: string;
    ventureName: string;
    value: number;
    weight: number;
    contribution: number;  // percentage of total
  }[];
  computedAt: Date;
}
```

### MetricService

```typescript
/**
 * Primary service interface for all metric operations.
 * This is the main entry point for consuming code.
 */
interface MetricService {
  // ── Definition Management ──────────────────────────────
  defineMetric(definition: Omit<MetricDefinition, 'id' | 'createdAt' | 'updatedAt' | 'lastComputedAt' | 'version'>): Promise<MetricDefinition>;
  getMetric(metricId: string, ventureId?: string): Promise<MetricDefinition | null>;
  updateMetric(metricId: string, updates: Partial<MetricDefinition>): Promise<MetricDefinition>;
  deprecateMetric(metricId: string, replacementId?: string): Promise<void>;
  listMetrics(options?: MetricListOptions): Promise<PaginatedResult<MetricDefinition>>;

  // ── Computation ────────────────────────────────────────
  compute(metricId: string, options?: ComputeOptions): Promise<ComputationResult>;
  computeBatch(metricIds: string[], options?: ComputeOptions): Promise<ComputationResult[]>;
  recompute(metricId: string, timeRange: { start: Date; end: Date }): Promise<ComputationResult>;
  scheduleComputation(metricId: string, schedule: string): Promise<void>;
  cancelComputation(computationId: string): Promise<void>;

  // ── Querying ───────────────────────────────────────────
  query(query: TimeSeriesQuery): Promise<TimeSeriesResult>;
  getSnapshot(metricId: string, ventureId?: string): Promise<MetricSnapshot>;
  getSnapshots(metricIds: string[], ventureId?: string): Promise<MetricSnapshot[]>;
  getCurrentValue(metricId: string, ventureId?: string): Promise<number | null>;

  // ── Goals ──────────────────────────────────────────────
  setGoal(config: Omit<GoalConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<GoalConfig>;
  getGoalProgress(goalId: string): Promise<GoalProgress>;
  listGoals(ventureId: string, options?: GoalListOptions): Promise<GoalConfig[]>;
  updateGoal(goalId: string, updates: Partial<GoalConfig>): Promise<GoalConfig>;
  archiveGoal(goalId: string): Promise<void>;

  // ── Aggregation ────────────────────────────────────────
  aggregate(rule: AggregationRule): Promise<AggregationResult>;
  createAggregationRule(rule: Omit<AggregationRule, 'id'>): Promise<AggregationRule>;
  runAggregation(ruleId: string): Promise<AggregationResult>;

  // ── Catalog ────────────────────────────────────────────
  searchCatalog(query: string, options?: CatalogSearchOptions): Promise<MetricCatalogEntry[]>;
  getCatalogEntry(metricId: string): Promise<MetricCatalogEntry>;
  browseCatalog(category?: MetricCategory): Promise<MetricCatalogEntry[]>;

  // ── Freshness ──────────────────────────────────────────
  checkFreshness(metricId: string): Promise<MetricFreshness>;
  checkAllFreshness(ventureId?: string): Promise<MetricFreshness[]>;
  getStaleMetrics(ventureId?: string): Promise<MetricFreshness[]>;

  // ── Permissions ────────────────────────────────────────
  checkAccess(userId: string, metricId: string, level: PermissionLevel): Promise<boolean>;
  grantAccess(rule: MetricPermissionRule): Promise<void>;
  revokeAccess(ruleId: string): Promise<void>;
  getAccessibleMetrics(userId: string, level: PermissionLevel): Promise<string[]>;

  // ── Benchmarking ───────────────────────────────────────
  compareBenchmark(metricId: string, ventureId: string, benchmarkDatasetId: string): Promise<BenchmarkComparison>;
  compareVentures(metricId: string, ventureIds: string[], timeRange: { start: Date; end: Date }): Promise<VentureComparison>;

  // ── Export ─────────────────────────────────────────────
  exportTimeSeries(query: TimeSeriesQuery, format: MetricExportFormat): Promise<Buffer>;
}
```

---

## Enums

```typescript
/** Time granularity for metric storage and queries */
enum Granularity {
  MINUTE  = 'minute',
  HOUR    = 'hour',
  DAY     = 'day',
  WEEK    = 'week',
  MONTH   = 'month',
  QUARTER = 'quarter',
  YEAR    = 'year',
}

/** What kind of value a metric represents */
enum MetricType {
  /** Monotonically increasing count (e.g., total signups) */
  COUNTER    = 'counter',
  /** Point-in-time value that can go up or down (e.g., active users) */
  GAUGE      = 'gauge',
  /** Value per unit time (e.g., signups per day) */
  RATE       = 'rate',
  /** Ratio of two values (e.g., conversion rate) */
  RATIO      = 'ratio',
  /** Monetary amount (e.g., MRR) */
  CURRENCY   = 'currency',
  /** Percentage (0-100) */
  PERCENTAGE = 'percentage',
  /** Arbitrary score (e.g., NPS -100 to 100) */
  SCORE      = 'score',
  /** Duration in milliseconds */
  DURATION   = 'duration',
}

/** Lifecycle status of a metric definition */
enum MetricStatus {
  DRAFT      = 'draft',
  ACTIVE     = 'active',
  DEPRECATED = 'deprecated',
  ARCHIVED   = 'archived',
}

/** How a metric's values are generated */
enum ComputationMode {
  /** Computed by running a SQL query against source data */
  QUERY      = 'query',
  /** Computed by a registered function */
  FUNCTION   = 'function',
  /** Derived from other metrics via formula */
  DERIVED    = 'derived',
  /** Pushed from an external system */
  EXTERNAL   = 'external',
  /** Computed from a real-time streaming pipeline */
  STREAMING  = 'streaming',
}

/** Standard aggregation functions */
enum AggregationFunction {
  SUM              = 'sum',
  AVG              = 'avg',
  WEIGHTED_AVG     = 'weighted_avg',
  MIN              = 'min',
  MAX              = 'max',
  COUNT            = 'count',
  MEDIAN           = 'median',
  PERCENTILE_95    = 'p95',
  PERCENTILE_99    = 'p99',
  FIRST            = 'first',
  LAST             = 'last',
  COUNT_DISTINCT   = 'count_distinct',
}

/** Direction for goal tracking */
enum GoalDirection {
  /** We want this metric to increase (e.g., MRR) */
  INCREASE = 'increase',
  /** We want this metric to decrease (e.g., churn rate) */
  DECREASE = 'decrease',
  /** We want this metric to stay within a range */
  MAINTAIN = 'maintain',
}

/** Severity levels for metric alerts */
enum AlertSeverity {
  INFO     = 'info',
  WARNING  = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

/** How fresh is the metric data */
enum FreshnessLevel {
  /** Computed within the expected schedule */
  FRESH = 'fresh',
  /** Slightly behind schedule but within tolerance */
  STALE = 'stale',
  /** Significantly behind schedule */
  VERY_STALE = 'very_stale',
  /** No recent computation at all */
  UNKNOWN = 'unknown',
}

/** Permission levels for metric access */
enum PermissionLevel {
  /** Can see the metric exists in the catalog */
  DISCOVER = 'discover',
  /** Can read metric values */
  READ     = 'read',
  /** Can modify metric definition */
  WRITE    = 'write',
  /** Can manage permissions and delete */
  ADMIN    = 'admin',
}

/** Metric categories for catalog organization */
enum MetricCategoryEnum {
  REVENUE       = 'revenue',
  GROWTH        = 'growth',
  ENGAGEMENT    = 'engagement',
  RETENTION     = 'retention',
  ACQUISITION   = 'acquisition',
  SATISFACTION  = 'satisfaction',
  OPERATIONAL   = 'operational',
  FINANCIAL     = 'financial',
  PRODUCT       = 'product',
  MARKETING     = 'marketing',
  SALES         = 'sales',
  SUPPORT       = 'support',
  ENGINEERING   = 'engineering',
  CUSTOM        = 'custom',
}
```

---

## Database Schemas

All schemas use Drizzle ORM and target Supabase PostgreSQL with TimescaleDB.

### metric_definitions

```typescript
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const metricTypeEnum = pgEnum('metric_type', [
  'counter', 'gauge', 'rate', 'ratio', 'currency', 'percentage', 'score', 'duration',
]);

export const metricStatusEnum = pgEnum('metric_status', [
  'draft', 'active', 'deprecated', 'archived',
]);

export const computationModeEnum = pgEnum('computation_mode', [
  'query', 'function', 'derived', 'external', 'streaming',
]);

/**
 * Core metric definitions table.
 * Each row is a metric "blueprint" — the schema of what a metric is.
 */
export const metricDefinitions = pgTable('metric_definitions', {
  /** Unique metric identifier (e.g., 'mrr', 'churn_rate') */
  id: varchar('id', { length: 128 }).primaryKey(),

  /** Venture scope — null for global metrics */
  ventureId: varchar('venture_id', { length: 64 }),

  /** Human-readable name */
  name: varchar('name', { length: 256 }).notNull(),

  /** Full description */
  description: text('description').notNull(),

  /** Short description for catalog cards */
  shortDescription: varchar('short_description', { length: 512 }),

  /** Organizational category */
  category: varchar('category', { length: 64 }).notNull(),

  /** Type of metric value */
  type: metricTypeEnum('type').notNull(),

  /** Unit of measurement */
  unit: varchar('unit', { length: 32 }).notNull(),

  /** Display precision (decimal places) */
  precision: integer('precision').notNull().default(2),

  /** How this metric is computed */
  computationMode: computationModeEnum('computation_mode').notNull(),

  /** Computation configuration (SQL, function ref, or expression) */
  computation: jsonb('computation').notNull().$type<{
    kind: 'query' | 'function' | 'expression';
    source: string;
    parameters: Record<string, unknown>;
    timeoutMs: number;
    retry: { maxAttempts: number; backoffMs: number };
  }>(),

  /** Data source bindings */
  dataSources: jsonb('data_sources').notNull().$type<{
    module: string;
    entity: string;
    mode: 'pull' | 'push';
    filter?: Record<string, unknown>;
  }[]>().default([]),

  /** IDs of metrics this depends on (for derived metrics) */
  dependencies: jsonb('dependencies').notNull().$type<string[]>().default([]),

  /** Supported granularities */
  granularities: jsonb('granularities').notNull().$type<string[]>().default(['day', 'week', 'month']),

  /** Default granularity */
  defaultGranularity: varchar('default_granularity', { length: 16 }).notNull().default('day'),

  /** Dimensions this metric supports */
  dimensions: jsonb('dimensions').notNull().$type<{
    name: string;
    description: string;
    values?: string[];
  }[]>().default([]),

  /** Searchable tags */
  tags: jsonb('tags').notNull().$type<string[]>().default([]),

  /** Ownership information */
  ownership: jsonb('ownership').notNull().$type<{
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    team: string;
    department: string;
  }>(),

  /** Freshness configuration */
  freshness: jsonb('freshness').notNull().$type<{
    maxStalenessMs: number;
    schedule: string;
    realtime: boolean;
  }>(),

  /** Dashboard display configuration */
  display: jsonb('display').notNull().$type<{
    chartType: string;
    color: string;
    higherIsBetter: boolean;
    formatPattern: string;
  }>(),

  /** Lifecycle status */
  status: metricStatusEnum('status').notNull().default('draft'),

  /** Schema version */
  version: integer('version').notNull().default(1),

  /** If deprecated, points to the replacement metric */
  replacedBy: varchar('replaced_by', { length: 128 }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastComputedAt: timestamp('last_computed_at', { withTimezone: true }),
}, (table) => ({
  ventureIdx: index('metric_def_venture_idx').on(table.ventureId),
  categoryIdx: index('metric_def_category_idx').on(table.category),
  statusIdx: index('metric_def_status_idx').on(table.status),
  ventureNameUniq: uniqueIndex('metric_def_venture_name_uniq').on(table.ventureId, table.name),
  tagsIdx: index('metric_def_tags_idx').using('gin', table.tags),
}));
```

### metric_values

```typescript
/**
 * Time-series metric values.
 * This is a TimescaleDB hypertable, partitioned by timestamp.
 * Each row is a single computed value for a metric at a point in time.
 *
 * IMPORTANT: After table creation, run:
 *   SELECT create_hypertable('metric_values', 'timestamp');
 * And set up continuous aggregates for automatic rollup.
 */
export const metricValues = pgTable('metric_values', {
  /** Auto-generated row ID */
  id: varchar('id', { length: 64 }).primaryKey(),

  /** Reference to metric definition */
  metricId: varchar('metric_id', { length: 128 }).notNull(),

  /** Venture scope */
  ventureId: varchar('venture_id', { length: 64 }),

  /** The computed numeric value */
  value: numeric('value', { precision: 20, scale: 6 }).notNull(),

  /** Previous period value (for delta computation) */
  previousValue: numeric('previous_value', { precision: 20, scale: 6 }),

  /** Start of the time bucket */
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),

  /** End of the time bucket */
  timestampEnd: timestamp('timestamp_end', { withTimezone: true }).notNull(),

  /** Granularity of this data point */
  granularity: varchar('granularity', { length: 16 }).notNull(),

  /** Dimensional breakdown (JSONB for flexible schema) */
  dimensions: jsonb('dimensions').notNull().$type<Record<string, string>>().default({}),

  /** Number of raw events/records aggregated */
  sampleCount: integer('sample_count').notNull().default(1),

  /** Statistical metadata */
  stats: jsonb('stats').$type<{
    min: number;
    max: number;
    avg: number;
    median: number | null;
    p95: number | null;
    p99: number | null;
    stddev: number | null;
  }>(),

  /** ID of the computation job that created this value */
  computationId: varchar('computation_id', { length: 64 }),

  /** Data quality indicator */
  quality: varchar('quality', { length: 16 }).notNull().default('complete'),

  /** When this value was computed */
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  /** Primary lookup: metric + time range */
  metricTimeIdx: index('mv_metric_time_idx').on(table.metricId, table.timestamp),
  /** Venture + metric + time for tenant-scoped queries */
  ventureMetricTimeIdx: index('mv_venture_metric_time_idx').on(table.ventureId, table.metricId, table.timestamp),
  /** Granularity filter */
  granularityIdx: index('mv_granularity_idx').on(table.granularity),
  /** Dimensional queries */
  dimensionsIdx: index('mv_dimensions_idx').using('gin', table.dimensions),
  /** Quality filter for data health dashboards */
  qualityIdx: index('mv_quality_idx').on(table.quality),
}));

/*
 * TimescaleDB setup (run as migration):
 *
 * -- Convert to hypertable
 * SELECT create_hypertable('metric_values', 'timestamp',
 *   chunk_time_interval => INTERVAL '1 day',
 *   if_not_exists => TRUE
 * );
 *
 * -- Enable compression after 7 days
 * ALTER TABLE metric_values SET (
 *   timescaledb.compress,
 *   timescaledb.compress_segmentby = 'metric_id, venture_id, granularity',
 *   timescaledb.compress_orderby = 'timestamp DESC'
 * );
 * SELECT add_compression_policy('metric_values', INTERVAL '7 days');
 *
 * -- Retention policies
 * SELECT add_retention_policy('metric_values', INTERVAL '5 years');
 *
 * -- Continuous aggregate: minute → hour
 * CREATE MATERIALIZED VIEW metric_values_hourly
 * WITH (timescaledb.continuous) AS
 * SELECT
 *   metric_id,
 *   venture_id,
 *   time_bucket('1 hour', timestamp) AS timestamp,
 *   AVG(value::float) AS value,
 *   SUM(sample_count) AS sample_count,
 *   MIN(value::float) AS min_value,
 *   MAX(value::float) AS max_value,
 *   COUNT(*) AS point_count
 * FROM metric_values
 * WHERE granularity = 'minute'
 * GROUP BY metric_id, venture_id, time_bucket('1 hour', timestamp)
 * WITH NO DATA;
 *
 * SELECT add_continuous_aggregate_policy('metric_values_hourly',
 *   start_offset => INTERVAL '3 hours',
 *   end_offset   => INTERVAL '1 hour',
 *   schedule_interval => INTERVAL '1 hour'
 * );
 *
 * -- Continuous aggregate: hour → day
 * CREATE MATERIALIZED VIEW metric_values_daily
 * WITH (timescaledb.continuous) AS
 * SELECT
 *   metric_id,
 *   venture_id,
 *   time_bucket('1 day', timestamp) AS timestamp,
 *   AVG(value) AS value,
 *   SUM(sample_count) AS sample_count,
 *   MIN(min_value) AS min_value,
 *   MAX(max_value) AS max_value,
 *   SUM(point_count) AS point_count
 * FROM metric_values_hourly
 * GROUP BY metric_id, venture_id, time_bucket('1 day', timestamp)
 * WITH NO DATA;
 *
 * SELECT add_continuous_aggregate_policy('metric_values_daily',
 *   start_offset => INTERVAL '3 days',
 *   end_offset   => INTERVAL '1 day',
 *   schedule_interval => INTERVAL '1 day'
 * );
 */
```

### metric_goals

```typescript
export const goalDirectionEnum = pgEnum('goal_direction', [
  'increase', 'decrease', 'maintain',
]);

/**
 * Metric goals and targets.
 * Tracks progress toward business objectives.
 */
export const metricGoals = pgTable('metric_goals', {
  id: varchar('id', { length: 64 }).primaryKey(),

  /** The metric being tracked */
  metricId: varchar('metric_id', { length: 128 }).notNull(),

  /** Venture this goal belongs to */
  ventureId: varchar('venture_id', { length: 64 }).notNull(),

  /** Goal name */
  name: varchar('name', { length: 256 }).notNull(),

  /** Detailed description */
  description: text('description'),

  /** Target value to achieve */
  targetValue: numeric('target_value', { precision: 20, scale: 6 }).notNull(),

  /** Baseline value when goal was set */
  baselineValue: numeric('baseline_value', { precision: 20, scale: 6 }).notNull(),

  /** Direction of improvement */
  direction: goalDirectionEnum('direction').notNull(),

  /** Goal period start */
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),

  /** Goal period end */
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),

  /** Milestones configuration */
  milestones: jsonb('milestones').notNull().$type<{
    name: string;
    value: number;
    expectedDate: string;
    reached: boolean;
    reachedAt: string | null;
  }[]>().default([]),

  /** Alert threshold configuration */
  thresholds: jsonb('thresholds').notNull().$type<{
    name: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between';
    value: number;
    upperValue?: number;
    severity: string;
    message: string;
  }[]>().default([]),

  /** Alert channels */
  alertChannels: jsonb('alert_channels').notNull().$type<{
    type: 'email' | 'slack' | 'webhook' | 'in_app';
    target: string;
    severityFilter?: string[];
  }[]>().default([]),

  /** Dimensional scope filter */
  dimensionFilter: jsonb('dimension_filter').$type<Record<string, string>>(),

  /** Whether the goal is active */
  active: boolean('active').notNull().default(true),

  /** Last time progress was checked */
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }),

  /** Current progress percentage (cached) */
  currentProgress: numeric('current_progress', { precision: 5, scale: 2 }),

  createdBy: varchar('created_by', { length: 64 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('mg_venture_idx').on(table.ventureId),
  metricIdx: index('mg_metric_idx').on(table.metricId),
  activeIdx: index('mg_active_idx').on(table.active),
  periodIdx: index('mg_period_idx').on(table.periodStart, table.periodEnd),
}));
```

### metric_computations

```typescript
export const computationStatusEnum = pgEnum('computation_status', [
  'pending', 'running', 'completed', 'failed', 'cancelled', 'timeout',
]);

/**
 * Computation job tracking.
 * Every metric computation (batch or streaming) creates a record here
 * for auditability and debugging.
 */
export const metricComputations = pgTable('metric_computations', {
  /** Unique computation job ID */
  id: varchar('id', { length: 64 }).primaryKey(),

  /** The metric being computed */
  metricId: varchar('metric_id', { length: 128 }).notNull(),

  /** Venture scope */
  ventureId: varchar('venture_id', { length: 64 }),

  /** Job status */
  status: computationStatusEnum('status').notNull().default('pending'),

  /** Computation mode used */
  mode: computationModeEnum('mode').notNull(),

  /** Time range being computed */
  rangeStart: timestamp('range_start', { withTimezone: true }).notNull(),
  rangeEnd: timestamp('range_end', { withTimezone: true }).notNull(),

  /** Granularity being computed */
  granularity: varchar('granularity', { length: 16 }).notNull(),

  /** Number of data points produced */
  pointsProduced: integer('points_produced').default(0),

  /** Number of source records processed */
  recordsProcessed: integer('records_processed').default(0),

  /** Execution time in milliseconds */
  durationMs: integer('duration_ms'),

  /** Error details if failed */
  error: jsonb('error').$type<{
    code: string;
    message: string;
    stack?: string;
    retryable: boolean;
  }>(),

  /** Retry information */
  attempt: integer('attempt').notNull().default(1),
  maxAttempts: integer('max_attempts').notNull().default(3),

  /** Trigger: 'schedule', 'manual', 'dependency', 'backfill' */
  trigger: varchar('trigger', { length: 32 }).notNull(),

  /** Who/what triggered the computation */
  triggeredBy: varchar('triggered_by', { length: 128 }),

  /** Computation metadata (query plan, intermediate results, etc.) */
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  metricIdx: index('mc_metric_idx').on(table.metricId),
  statusIdx: index('mc_status_idx').on(table.status),
  createdIdx: index('mc_created_idx').on(table.createdAt),
  triggerIdx: index('mc_trigger_idx').on(table.trigger),
}));
```

### metric_catalog

```typescript
/**
 * Searchable metric catalog.
 * Denormalized view of metric definitions optimized for discovery.
 * Includes usage statistics and popularity rankings.
 */
export const metricCatalog = pgTable('metric_catalog', {
  /** Metric ID (FK to metric_definitions) */
  metricId: varchar('metric_id', { length: 128 }).primaryKey(),

  /** Venture scope */
  ventureId: varchar('venture_id', { length: 64 }),

  /** Display name */
  name: varchar('name', { length: 256 }).notNull(),

  /** Short description */
  shortDescription: varchar('short_description', { length: 512 }),

  /** Full description */
  description: text('description').notNull(),

  /** Category */
  category: varchar('category', { length: 64 }).notNull(),

  /** Metric type */
  type: varchar('type', { length: 32 }).notNull(),

  /** Unit */
  unit: varchar('unit', { length: 32 }).notNull(),

  /** Tags for search */
  tags: jsonb('tags').notNull().$type<string[]>().default([]),

  /** Owner information */
  ownerName: varchar('owner_name', { length: 256 }),
  ownerTeam: varchar('owner_team', { length: 128 }),

  /** Status */
  status: varchar('status', { length: 32 }).notNull(),

  /** How many dashboards use this metric */
  dashboardCount: integer('dashboard_count').notNull().default(0),

  /** How many goals reference this metric */
  goalCount: integer('goal_count').notNull().default(0),

  /** How many times this metric has been queried (last 30 days) */
  queryCount30d: integer('query_count_30d').notNull().default(0),

  /** Popularity score (computed from usage) */
  popularityScore: numeric('popularity_score', { precision: 5, scale: 2 }).notNull().default('0'),

  /** Full-text search vector */
  searchVector: text('search_vector'),

  /** Current freshness level */
  freshnessLevel: varchar('freshness_level', { length: 16 }),

  /** Last computed timestamp */
  lastComputedAt: timestamp('last_computed_at', { withTimezone: true }),

  /** Whether this metric has current data */
  hasData: boolean('has_data').notNull().default(false),

  /** Related metric IDs */
  relatedMetrics: jsonb('related_metrics').$type<string[]>().default([]),

  /** Replacement metric (if deprecated) */
  replacedBy: varchar('replaced_by', { length: 128 }),

  /** When the catalog entry was last refreshed */
  refreshedAt: timestamp('refreshed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('mcat_venture_idx').on(table.ventureId),
  categoryIdx: index('mcat_category_idx').on(table.category),
  statusIdx: index('mcat_status_idx').on(table.status),
  popularityIdx: index('mcat_popularity_idx').on(table.popularityScore),
  tagsIdx: index('mcat_tags_idx').using('gin', table.tags),
  /** Full-text search index (run as migration):
   * CREATE INDEX mcat_search_idx ON metric_catalog
   *   USING GIN (to_tsvector('english', name || ' ' || coalesce(short_description, '') || ' ' || description));
   */
}));
```

### metric_permissions

```typescript
export const permissionLevelEnum = pgEnum('permission_level', [
  'discover', 'read', 'write', 'admin',
]);

/**
 * Metric-level access control.
 * Controls who can see, query, and modify specific metrics.
 * Revenue metrics can be restricted to leadership, for example.
 */
export const metricPermissions = pgTable('metric_permissions', {
  id: varchar('id', { length: 64 }).primaryKey(),

  /** Metric this permission applies to (null = all metrics in scope) */
  metricId: varchar('metric_id', { length: 128 }),

  /** Category-level permission (null = specific metric) */
  category: varchar('category', { length: 64 }),

  /** Venture scope */
  ventureId: varchar('venture_id', { length: 64 }),

  /** User or role this permission is for */
  subjectType: varchar('subject_type', { length: 16 }).notNull(), // 'user' | 'role' | 'team'
  subjectId: varchar('subject_id', { length: 128 }).notNull(),

  /** Permission level granted */
  level: permissionLevelEnum('level').notNull(),

  /** Whether this is a deny rule (overrides grants) */
  deny: boolean('deny').notNull().default(false),

  /** Conditions for the permission */
  conditions: jsonb('conditions').$type<{
    dimensions?: Record<string, string[]>;  // Only allow access for specific dimension values
    ipAllowlist?: string[];
    timeRestriction?: { start: string; end: string };
  }>(),

  /** Who granted this permission */
  grantedBy: varchar('granted_by', { length: 128 }).notNull(),

  /** Expiration (null = permanent) */
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  metricIdx: index('mp_metric_idx').on(table.metricId),
  subjectIdx: index('mp_subject_idx').on(table.subjectType, table.subjectId),
  ventureIdx: index('mp_venture_idx').on(table.ventureId),
  categoryIdx: index('mp_category_idx').on(table.category),
}));
```

### Additional Schemas

```typescript
/**
 * Metric dependency graph.
 * Tracks which derived metrics depend on which source metrics
 * for cascading computation and circular dependency detection.
 */
export const metricDependencies = pgTable('metric_dependencies', {
  /** The derived metric */
  metricId: varchar('metric_id', { length: 128 }).notNull(),

  /** The metric it depends on */
  dependsOn: varchar('depends_on', { length: 128 }).notNull(),

  /** How the dependency is used in the formula */
  usage: varchar('usage', { length: 32 }).notNull().default('direct'), // 'direct' | 'transitive'

  /** Depth in the dependency tree (1 = direct) */
  depth: integer('depth').notNull().default(1),
}, (table) => ({
  pk: uniqueIndex('md_pk').on(table.metricId, table.dependsOn),
  dependsOnIdx: index('md_depends_on_idx').on(table.dependsOn),
}));

/**
 * Benchmark datasets for cross-venture and industry comparisons.
 */
export const metricBenchmarks = pgTable('metric_benchmarks', {
  id: varchar('id', { length: 64 }).primaryKey(),

  /** Benchmark dataset name (e.g., 'SaaS Industry Q1 2026') */
  name: varchar('name', { length: 256 }).notNull(),

  /** Source of benchmark data */
  source: varchar('source', { length: 256 }).notNull(),

  /** Metric this benchmark applies to */
  metricId: varchar('metric_id', { length: 128 }).notNull(),

  /** Percentile breakdowns */
  percentiles: jsonb('percentiles').notNull().$type<{
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  }>(),

  /** Industry/vertical this benchmark applies to */
  industry: varchar('industry', { length: 128 }),

  /** Company stage (e.g., 'seed', 'series_a', 'growth') */
  stage: varchar('stage', { length: 64 }),

  /** Time period the benchmark covers */
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),

  /** Additional metadata */
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  metricIdx: index('mb_metric_idx').on(table.metricId),
  industryIdx: index('mb_industry_idx').on(table.industry),
  stageIdx: index('mb_stage_idx').on(table.stage),
}));

/**
 * Metric alerts log.
 * Records every alert triggered by goal thresholds or freshness issues.
 */
export const metricAlerts = pgTable('metric_alerts', {
  id: varchar('id', { length: 64 }).primaryKey(),

  /** Related goal (null for freshness alerts) */
  goalId: varchar('goal_id', { length: 64 }),

  /** Related metric */
  metricId: varchar('metric_id', { length: 128 }).notNull(),

  /** Venture */
  ventureId: varchar('venture_id', { length: 64 }),

  /** Alert type */
  alertType: varchar('alert_type', { length: 32 }).notNull(), // 'threshold' | 'freshness' | 'anomaly' | 'goal_risk'

  /** Severity */
  severity: varchar('severity', { length: 16 }).notNull(),

  /** Alert message */
  message: text('message').notNull(),

  /** The value that triggered the alert */
  triggerValue: numeric('trigger_value', { precision: 20, scale: 6 }),

  /** Threshold that was breached */
  thresholdConfig: jsonb('threshold_config').$type<Record<string, unknown>>(),

  /** Channels this alert was sent to */
  sentTo: jsonb('sent_to').$type<string[]>().default([]),

  /** Delivery status per channel */
  deliveryStatus: jsonb('delivery_status').$type<Record<string, 'sent' | 'failed' | 'pending'>>(),

  /** Acknowledged */
  acknowledged: boolean('acknowledged').notNull().default(false),
  acknowledgedBy: varchar('acknowledged_by', { length: 128 }),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),

  /** Resolved */
  resolved: boolean('resolved').notNull().default(false),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: varchar('resolved_by', { length: 128 }),
  resolveNote: text('resolve_note'),

  triggeredAt: timestamp('triggered_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  metricIdx: index('ma_metric_idx').on(table.metricId),
  goalIdx: index('ma_goal_idx').on(table.goalId),
  severityIdx: index('ma_severity_idx').on(table.severity),
  acknowledgedIdx: index('ma_ack_idx').on(table.acknowledged),
  triggeredIdx: index('ma_triggered_idx').on(table.triggeredAt),
}));

/**
 * Audit log for metric operations.
 * Tracks who did what, when, and why — for compliance and debugging.
 */
export const metricAuditLog = pgTable('metric_audit_log', {
  id: varchar('id', { length: 64 }).primaryKey(),

  /** What happened */
  action: varchar('action', { length: 64 }).notNull(), // 'define', 'update', 'compute', 'delete', 'grant', 'revoke', 'goal_set', 'goal_update'

  /** What entity was affected */
  entityType: varchar('entity_type', { length: 32 }).notNull(), // 'metric', 'goal', 'permission', 'rule'
  entityId: varchar('entity_id', { length: 128 }).notNull(),

  /** Venture */
  ventureId: varchar('venture_id', { length: 64 }),

  /** Who performed the action */
  actorId: varchar('actor_id', { length: 128 }).notNull(),
  actorType: varchar('actor_type', { length: 16 }).notNull(), // 'user' | 'system' | 'cron'

  /** Before/after state for changes */
  before: jsonb('before').$type<Record<string, unknown>>(),
  after: jsonb('after').$type<Record<string, unknown>>(),

  /** Additional context */
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  /** IP address (for user actions) */
  ipAddress: varchar('ip_address', { length: 45 }),

  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  entityIdx: index('mal_entity_idx').on(table.entityType, table.entityId),
  actorIdx: index('mal_actor_idx').on(table.actorId),
  actionIdx: index('mal_action_idx').on(table.action),
  timestampIdx: index('mal_timestamp_idx').on(table.timestamp),
}));
```

---

## Code Examples

### 1. Define a Business Metric

```typescript
import { createMetricService } from '@mcv/analytics/metrics';
import { MetricType, ComputationMode, Granularity, MetricCategoryEnum } from '@mcv/analytics/metrics';

const metrics = createMetricService({ supabaseUrl, supabaseKey });

// Define Monthly Recurring Revenue (MRR)
const mrr = await metrics.defineMetric({
  name: 'Monthly Recurring Revenue',
  ventureId: 'venture_acme',
  description: `
    Total recurring revenue normalized to a monthly amount.
    Includes all active subscriptions, excludes one-time charges and credits.
    Calculated as sum of (subscription_price × quantity) for all active subscriptions
    at the end of each period.
  `,
  shortDescription: 'Total normalized monthly recurring subscription revenue',
  category: MetricCategoryEnum.REVENUE,
  type: MetricType.CURRENCY,
  unit: 'USD',
  precision: 2,
  computationMode: ComputationMode.QUERY,
  computation: {
    kind: 'query',
    source: `
      SELECT
        SUM(
          CASE
            WHEN s.billing_interval = 'monthly' THEN s.price * s.quantity
            WHEN s.billing_interval = 'yearly'  THEN (s.price * s.quantity) / 12.0
            WHEN s.billing_interval = 'weekly'  THEN (s.price * s.quantity) * 4.33
            ELSE 0
          END
        ) AS value,
        COUNT(DISTINCT s.customer_id) AS sample_count
      FROM subscriptions s
      WHERE s.venture_id = :ventureId
        AND s.status = 'active'
        AND s.current_period_start <= :timestamp
        AND (s.cancelled_at IS NULL OR s.cancelled_at > :timestamp)
    `,
    parameters: {},
    timeoutMs: 30_000,
    retry: { maxAttempts: 3, backoffMs: 1000 },
  },
  dataSources: [
    {
      module: '@mcv/finance',
      entity: 'subscriptions',
      mode: 'pull',
    },
  ],
  dependencies: [],
  granularities: [Granularity.DAY, Granularity.WEEK, Granularity.MONTH],
  defaultGranularity: Granularity.MONTH,
  dimensions: [
    { name: 'plan', description: 'Subscription plan name' },
    { name: 'channel', description: 'Acquisition channel' },
    { name: 'segment', description: 'Customer segment (SMB, mid-market, enterprise)' },
  ],
  tags: ['revenue', 'saas', 'subscription', 'financial', 'kpi'],
  ownership: {
    ownerId: 'user_cfo_jane',
    ownerName: 'Jane Smith',
    ownerEmail: 'jane@acme.ventures',
    team: 'Finance',
    department: 'Finance',
  },
  permissions: [
    {
      subjectType: 'role',
      subjectId: 'leadership',
      level: 'read',
      deny: false,
    },
    {
      subjectType: 'role',
      subjectId: 'finance_team',
      level: 'write',
      deny: false,
    },
  ],
  freshness: {
    maxStalenessMs: 4 * 60 * 60 * 1000, // 4 hours
    schedule: '0 */4 * * *',              // every 4 hours
    realtime: false,
  },
  display: {
    chartType: 'area',
    color: '#10B981',
    higherIsBetter: true,
    formatPattern: '$#,##0.00',
  },
  status: 'active',
});

console.log(`Defined metric: ${mrr.id} (${mrr.name})`);
// → Defined metric: mrr (Monthly Recurring Revenue)
```

### 2. Compute Metrics (Real-Time and Batch)

```typescript
import { createMetricService } from '@mcv/analytics/metrics';

const metrics = createMetricService({ supabaseUrl, supabaseKey });

// ── Single metric computation ────────────────────────────
const result = await metrics.compute('mrr', {
  ventureId: 'venture_acme',
  granularity: Granularity.DAY,
  timeRange: {
    start: new Date('2026-02-01'),
    end: new Date('2026-02-08'),
  },
  // Force recomputation even if fresh data exists
  force: false,
});

console.log(`Computed ${result.pointsProduced} data points in ${result.durationMs}ms`);
console.log(`Records processed: ${result.recordsProcessed}`);
console.log(`Status: ${result.status}`);
// → Computed 7 data points in 1234ms
// → Records processed: 15420
// → Status: completed

// ── Batch computation for multiple metrics ───────────────
const batchResults = await metrics.computeBatch(
  ['mrr', 'churn_rate', 'dau', 'nps', 'conversion_rate'],
  {
    ventureId: 'venture_acme',
    granularity: Granularity.DAY,
    timeRange: {
      start: new Date('2026-02-01'),
      end: new Date('2026-02-08'),
    },
    // Compute in parallel where there are no dependencies
    parallel: true,
    // Respect dependency ordering (derived metrics compute after sources)
    resolveDependencies: true,
  }
);

for (const r of batchResults) {
  console.log(`${r.metricId}: ${r.status} (${r.pointsProduced} points, ${r.durationMs}ms)`);
}
// → mrr: completed (7 points, 1234ms)
// → churn_rate: completed (7 points, 890ms)
// → dau: completed (7 points, 456ms)
// → nps: completed (7 points, 678ms)
// → conversion_rate: completed (7 points, 345ms)

// ── Historical backfill / recomputation ──────────────────
const backfill = await metrics.recompute('mrr', {
  start: new Date('2025-01-01'),
  end: new Date('2026-01-01'),
});

console.log(`Backfilled ${backfill.pointsProduced} points for MRR`);
// → Backfilled 365 points for MRR

// ── Schedule automatic computation ──────────────────────
await metrics.scheduleComputation('mrr', '0 */4 * * *'); // Every 4 hours
await metrics.scheduleComputation('dau', '5 0 * * *');   // Daily at 00:05
await metrics.scheduleComputation('nps', '0 9 * * 1');   // Weekly Monday 9am
```

### 3. Query Time-Series Data

```typescript
import { createMetricService, Granularity, buildTimeSeriesQuery } from '@mcv/analytics/metrics';

const metrics = createMetricService({ supabaseUrl, supabaseKey });

// ── Basic time-series query ──────────────────────────────
const mrrHistory = await metrics.query({
  metricIds: 'mrr',
  ventureId: 'venture_acme',
  timeRange: {
    start: new Date('2025-08-01'),
    end: new Date('2026-02-08'),
  },
  granularity: Granularity.MONTH,
  fillPolicy: 'previous',
  orderBy: 'time_asc',
  includeStats: false,
  includeDeltas: true,
});

console.log(`MRR over last 6 months:`);
for (const point of mrrHistory.series) {
  const delta = point.deltaPercent !== undefined
    ? ` (${point.deltaPercent > 0 ? '+' : ''}${point.deltaPercent.toFixed(1)}%)`
    : '';
  console.log(`  ${point.timestamp.toISOString().slice(0, 7)}: $${point.value.toLocaleString()}${delta}`);
}
// → MRR over last 6 months:
// →   2025-08: $142,500 (+3.2%)
// →   2025-09: $148,300 (+4.1%)
// →   2025-10: $151,200 (+2.0%)
// →   2025-11: $159,800 (+5.7%)
// →   2025-12: $163,400 (+2.3%)
// →   2026-01: $171,200 (+4.8%)

console.log(`Summary: min=$${mrrHistory.summary.min}, max=$${mrrHistory.summary.max}, growth=${mrrHistory.summary.changePercent.toFixed(1)}%`);

// ── Multi-metric query with comparison ───────────────────
const dashboardData = await metrics.query({
  metricIds: ['mrr', 'arr', 'churn_rate'],
  ventureId: 'venture_acme',
  timeRange: {
    start: new Date('2026-01-01'),
    end: new Date('2026-02-08'),
  },
  granularity: Granularity.DAY,
  fillPolicy: 'previous',
  orderBy: 'time_asc',
  includeStats: true,
  includeDeltas: true,
  comparison: {
    type: 'previous_period', // Compare against Dec 1 - Jan 8
  },
});

console.log(`Query took ${dashboardData.meta.queryTimeMs}ms (cached: ${dashboardData.meta.fromCache})`);

// ── Dimensional breakdown ────────────────────────────────
const mrrByPlan = await metrics.query({
  metricIds: 'mrr',
  ventureId: 'venture_acme',
  timeRange: {
    start: new Date('2026-01-01'),
    end: new Date('2026-02-01'),
  },
  granularity: Granularity.MONTH,
  groupBy: ['plan'],
  aggregation: AggregationFunction.SUM,
  fillPolicy: 'zero',
  orderBy: 'value_desc',
  includeStats: false,
  includeDeltas: false,
});

for (const point of mrrByPlan.series) {
  console.log(`  ${point.dimensions?.plan}: $${point.value.toLocaleString()}`);
}
// →   enterprise: $89,400
// →   professional: $52,100
// →   starter: $29,700

// ── Quick snapshot for dashboard header ──────────────────
const snapshot = await metrics.getSnapshot('mrr', 'venture_acme');

console.log(`${snapshot.name}: ${snapshot.formattedValue}`);
console.log(`Change: ${snapshot.formattedDelta} (${snapshot.trend} ${snapshot.trendIsPositive ? '✅' : '⚠️'})`);
console.log(`Freshness: ${snapshot.freshness}`);
// → Monthly Recurring Revenue: $171,200.00
// → Change: +$7,800.00 (up ✅)
// → Freshness: fresh

// ── Bulk snapshots for dashboard grid ────────────────────
const allSnapshots = await metrics.getSnapshots(
  ['mrr', 'arr', 'churn_rate', 'cac', 'ltv', 'nps', 'dau', 'mau', 'conversion_rate'],
  'venture_acme'
);

for (const s of allSnapshots) {
  const emoji = s.trendIsPositive ? '📈' : '📉';
  console.log(`${emoji} ${s.name}: ${s.formattedValue} (${s.formattedDelta})`);
}
```

### 4. Set Goals and Track Progress

```typescript
import { createMetricService, GoalDirection, AlertSeverity } from '@mcv/analytics/metrics';

const metrics = createMetricService({ supabaseUrl, supabaseKey });

// ── Set an MRR growth goal ───────────────────────────────
const mrrGoal = await metrics.setGoal({
  metricId: 'mrr',
  ventureId: 'venture_acme',
  name: 'Q1 2026 MRR Target',
  description: 'Grow MRR from $171K to $220K by end of Q1 2026',
  targetValue: 220_000,
  baselineValue: 171_200,
  direction: GoalDirection.INCREASE,
  period: {
    start: new Date('2026-01-01'),
    end: new Date('2026-03-31'),
  },
  milestones: [
    {
      name: 'January target',
      value: 185_000,
      expectedDate: new Date('2026-01-31'),
      reached: false,
      reachedAt: null,
    },
    {
      name: 'February target',
      value: 200_000,
      expectedDate: new Date('2026-02-28'),
      reached: false,
      reachedAt: null,
    },
    {
      name: 'March target',
      value: 220_000,
      expectedDate: new Date('2026-03-31'),
      reached: false,
      reachedAt: null,
    },
  ],
  thresholds: [
    {
      name: 'Below pace',
      operator: 'lt',
      value: 0.8, // Less than 80% of expected progress
      severity: AlertSeverity.WARNING,
      message: 'MRR growth is below 80% of target pace',
    },
    {
      name: 'Significantly behind',
      operator: 'lt',
      value: 0.6, // Less than 60% of expected progress
      severity: AlertSeverity.CRITICAL,
      message: 'MRR growth is significantly behind target — intervention needed',
    },
    {
      name: 'Goal at risk',
      operator: 'lt',
      value: 0.4,
      severity: AlertSeverity.EMERGENCY,
      message: 'MRR goal is at serious risk of being missed',
    },
  ],
  alertChannels: [
    { type: 'slack', target: '#revenue-alerts', severityFilter: ['warning', 'critical', 'emergency'] },
    { type: 'email', target: 'leadership@acme.ventures', severityFilter: ['critical', 'emergency'] },
    { type: 'in_app', target: 'venture_acme_leadership' },
  ],
  active: true,
  createdBy: 'user_ceo_bob',
});

console.log(`Goal created: ${mrrGoal.id}`);

// ── Check progress ───────────────────────────────────────
const progress = await metrics.getGoalProgress(mrrGoal.id);

console.log(`
  Goal: ${progress.goalName}
  Current: $${progress.currentValue.toLocaleString()} / $${progress.targetValue.toLocaleString()}
  Progress: ${progress.progressPercent.toFixed(1)}%
  Days remaining: ${progress.daysRemaining}
  On track: ${progress.onTrack ? '✅ Yes' : '⚠️ No'}
  Trend: ${progress.trend}
  Projected value at deadline: $${progress.projectedValue.toLocaleString()}
  Required daily rate: $${progress.requiredDailyRate.toFixed(0)}/day
  Actual daily rate: $${progress.actualDailyRate.toFixed(0)}/day
`);

// Check milestone progress
for (const milestone of progress.milestones) {
  const status = milestone.reached ? '✅' : `${milestone.progressPercent.toFixed(0)}%`;
  console.log(`  ${milestone.name}: ${status}`);
}

// ── Set a churn reduction goal ───────────────────────────
const churnGoal = await metrics.setGoal({
  metricId: 'churn_rate',
  ventureId: 'venture_acme',
  name: 'Reduce Monthly Churn to 3%',
  description: 'Bring monthly churn rate down from 5.2% to 3% or below',
  targetValue: 3.0,
  baselineValue: 5.2,
  direction: GoalDirection.DECREASE,
  period: {
    start: new Date('2026-01-01'),
    end: new Date('2026-06-30'),
  },
  milestones: [
    { name: 'Under 5%', value: 5.0, expectedDate: new Date('2026-02-28'), reached: false, reachedAt: null },
    { name: 'Under 4%', value: 4.0, expectedDate: new Date('2026-04-30'), reached: false, reachedAt: null },
    { name: 'Target: 3%', value: 3.0, expectedDate: new Date('2026-06-30'), reached: false, reachedAt: null },
  ],
  thresholds: [
    { name: 'Churn spike', operator: 'gt', value: 7.0, severity: AlertSeverity.CRITICAL, message: 'Churn rate spiked above 7%!' },
  ],
  alertChannels: [
    { type: 'slack', target: '#product-health' },
    { type: 'email', target: 'product@acme.ventures', severityFilter: ['critical'] },
  ],
  active: true,
  createdBy: 'user_cpo_alice',
});

// ── List all active goals ────────────────────────────────
const activeGoals = await metrics.listGoals('venture_acme', { active: true });
console.log(`Active goals: ${activeGoals.length}`);
```

### 5. Aggregate Metrics Across Ventures

```typescript
import { createMetricService, AggregationFunction } from '@mcv/analytics/metrics';

const metrics = createMetricService({ supabaseUrl, supabaseKey });

// ── Create a portfolio-level MRR aggregation rule ────────
const portfolioMrr = await metrics.createAggregationRule({
  name: 'Portfolio Total MRR',
  sourceMetricId: 'mrr',
  targetMetricId: 'portfolio_mrr',
  aggregateDimensions: ['venture'],
  preserveDimensions: [],
  function: AggregationFunction.SUM,
  ventureIds: null, // All ventures
  requireComplete: false,
  filter: [],
  schedule: '0 */6 * * *', // Every 6 hours
  active: true,
});

// ── Run the aggregation ──────────────────────────────────
const result = await metrics.runAggregation(portfolioMrr.id);

console.log(`Portfolio MRR: $${result.value.toLocaleString()}`);
console.log(`Contributing ventures: ${result.contributingVentures}/${result.totalVentures}`);
console.log(`Data completeness: ${(result.completeness * 100).toFixed(0)}%`);
console.log(`\nBreakdown:`);

for (const v of result.breakdown.sort((a, b) => b.value - a.value)) {
  const bar = '█'.repeat(Math.round(v.contribution / 2));
  console.log(`  ${v.ventureName.padEnd(20)} $${v.value.toLocaleString().padStart(12)} ${bar} ${v.contribution.toFixed(1)}%`);
}
// → Portfolio MRR: $892,400
// → Contributing ventures: 8/8
// → Data completeness: 100%
// →
// → Breakdown:
// →   Venture Alpha        $   245,000 █████████████ 27.5%
// →   Venture Bravo        $   198,300 ██████████ 22.2%
// →   Venture Charlie      $   171,200 █████████ 19.2%
// →   Venture Delta        $   112,500 ██████ 12.6%
// →   Venture Echo         $    78,400 ████ 8.8%
// →   Venture Foxtrot      $    45,200 ██ 5.1%
// →   Venture Golf         $    28,100 █ 3.1%
// →   Venture Hotel        $    13,700 █ 1.5%

// ── Cross-venture comparison ─────────────────────────────
const comparison = await metrics.compareVentures(
  'churn_rate',
  ['venture_alpha', 'venture_bravo', 'venture_charlie', 'venture_delta'],
  {
    start: new Date('2025-08-01'),
    end: new Date('2026-02-08'),
  }
);

console.log('Churn Rate Comparison (6 months):');
for (const v of comparison.ventures) {
  console.log(`  ${v.name}: ${v.current.toFixed(1)}% (was ${v.start.toFixed(1)}%, trend: ${v.trend})`);
}

// ── Weighted average NPS across ventures ─────────────────
const portfolioNps = await metrics.createAggregationRule({
  name: 'Portfolio Weighted NPS',
  sourceMetricId: 'nps',
  targetMetricId: 'portfolio_nps',
  aggregateDimensions: ['venture'],
  preserveDimensions: [],
  function: AggregationFunction.WEIGHTED_AVG,
  weightMetricId: 'mau', // Weight by monthly active users
  ventureIds: null,
  requireComplete: true, // Only compute if all ventures have data
  filter: [],
  schedule: '0 10 * * 1', // Weekly Monday 10am
  active: true,
});
```

### 6. Define Derived Metrics

```typescript
import { createMetricService, ComputationMode, MetricType, Granularity } from '@mcv/analytics/metrics';

const metrics = createMetricService({ supabaseUrl, supabaseKey });

// ── LTV (computed from ARPU and churn rate) ──────────────
const ltv = await metrics.defineMetric({
  name: 'Customer Lifetime Value',
  ventureId: 'venture_acme',
  description: `
    Estimated total revenue from an average customer over their lifetime.
    Computed as ARPU / monthly churn rate.
    This is a simplified LTV model suitable for subscription businesses
    with relatively stable churn rates.
  `,
  shortDescription: 'Estimated total revenue per customer lifetime',
  category: MetricCategoryEnum.FINANCIAL,
  type: MetricType.CURRENCY,
  unit: 'USD',
  precision: 2,
  computationMode: ComputationMode.DERIVED,
  computation: {
    kind: 'expression',
    source: 'metric:arpu / (metric:churn_rate / 100)',
    parameters: {},
    timeoutMs: 10_000,
    retry: { maxAttempts: 2, backoffMs: 500 },
  },
  dataSources: [],
  dependencies: ['arpu', 'churn_rate'],
  granularities: [Granularity.MONTH],
  defaultGranularity: Granularity.MONTH,
  dimensions: [],
  tags: ['ltv', 'lifetime-value', 'unit-economics', 'derived'],
  ownership: {
    ownerId: 'user_cfo_jane',
    ownerName: 'Jane Smith',
    ownerEmail: 'jane@acme.ventures',
    team: 'Finance',
    department: 'Finance',
  },
  permissions: [
    { subjectType: 'role', subjectId: 'leadership', level: 'read', deny: false },
  ],
  freshness: {
    maxStalenessMs: 24 * 60 * 60 * 1000, // 24 hours
    schedule: '0 2 * * *',                 // Daily at 2am (after ARPU and churn compute)
    realtime: false,
  },
  display: {
    chartType: 'line',
    color: '#6366F1',
    higherIsBetter: true,
    formatPattern: '$#,##0',
  },
  status: 'active',
});

// ── LTV:CAC Ratio (derived from derived metrics) ────────
const ltvCacRatio = await metrics.defineMetric({
  name: 'LTV:CAC Ratio',
  ventureId: 'venture_acme',
  description: 'Ratio of customer lifetime value to customer acquisition cost. A healthy SaaS business targets 3:1 or better.',
  shortDescription: 'Lifetime value to acquisition cost ratio',
  category: MetricCategoryEnum.FINANCIAL,
  type: MetricType.RATIO,
  unit: 'x',
  precision: 1,
  computationMode: ComputationMode.DERIVED,
  computation: {
    kind: 'expression',
    source: 'metric:ltv / metric:cac',
    parameters: {},
    timeoutMs: 10_000,
    retry: { maxAttempts: 2, backoffMs: 500 },
  },
  dataSources: [],
  dependencies: ['ltv', 'cac'],
  granularities: [Granularity.MONTH],
  defaultGranularity: Granularity.MONTH,
  dimensions: [],
  tags: ['ltv-cac', 'unit-economics', 'derived', 'health-check'],
  ownership: {
    ownerId: 'user_cfo_jane',
    ownerName: 'Jane Smith',
    ownerEmail: 'jane@acme.ventures',
    team: 'Finance',
    department: 'Finance',
  },
  permissions: [
    { subjectType: 'role', subjectId: 'leadership', level: 'read', deny: false },
  ],
  freshness: {
    maxStalenessMs: 24 * 60 * 60 * 1000,
    schedule: '0 3 * * *',                 // After LTV and CAC have computed
    realtime: false,
  },
  display: {
    chartType: 'gauge',
    color: '#F59E0B',
    higherIsBetter: true,
    formatPattern: '#0.0x',
  },
  status: 'active',
});

// ── Net Revenue Retention (complex expression) ──────────
const nrr = await metrics.defineMetric({
  name: 'Net Revenue Retention',
  ventureId: 'venture_acme',
  description: `
    Percentage of recurring revenue retained from existing customers, including
    expansion and contraction. NRR > 100% means growth from existing customers
    alone (without new customer acquisition).
    
    Formula: (Starting MRR + Expansion - Contraction - Churn) / Starting MRR × 100
  `,
  shortDescription: 'Revenue retained from existing customers including expansion',
  category: MetricCategoryEnum.RETENTION,
  type: MetricType.PERCENTAGE,
  unit: 'percent',
  precision: 1,
  computationMode: ComputationMode.DERIVED,
  computation: {
    kind: 'expression',
    source: '((metric:mrr_start + metric:expansion_mrr - metric:contraction_mrr - metric:churned_mrr) / metric:mrr_start) * 100',
    parameters: {},
    timeoutMs: 15_000,
    retry: { maxAttempts: 3, backoffMs: 1000 },
  },
  dataSources: [],
  dependencies: ['mrr_start', 'expansion_mrr', 'contraction_mrr', 'churned_mrr'],
  granularities: [Granularity.MONTH, Granularity.QUARTER],
  defaultGranularity: Granularity.MONTH,
  dimensions: [
    { name: 'segment', description: 'Customer segment' },
    { name: 'plan', description: 'Original plan tier' },
  ],
  tags: ['nrr', 'retention', 'expansion', 'health-check'],
  ownership: {
    ownerId: 'user_cro_sarah',
    ownerName: 'Sarah Johnson',
    ownerEmail: 'sarah@acme.ventures',
    team: 'Revenue',
    department: 'Sales',
  },
  permissions: [
    { subjectType: 'role', subjectId: 'leadership', level: 'read', deny: false },
    { subjectType: 'team', subjectId: 'revenue_ops', level: 'read', deny: false },
  ],
  freshness: {
    maxStalenessMs: 24 * 60 * 60 * 1000,
    schedule: '0 4 1 * *', // Monthly on the 1st at 4am
    realtime: false,
  },
  display: {
    chartType: 'line',
    color: '#8B5CF6',
    higherIsBetter: true,
    formatPattern: '#0.0%',
  },
  status: 'active',
});
```

### 7. Search the Metric Catalog

```typescript
import { createMetricService } from '@mcv/analytics/metrics';

const metrics = createMetricService({ supabaseUrl, supabaseKey });

// ── Full-text search ─────────────────────────────────────
const results = await metrics.searchCatalog('revenue recurring', {
  ventureId: 'venture_acme',
  categories: ['revenue', 'financial'],
  status: ['active'],
  limit: 10,
});

for (const entry of results) {
  console.log(`${entry.name} (${entry.metricId})`);
  console.log(`  ${entry.shortDescription}`);
  console.log(`  Category: ${entry.category} | Owner: ${entry.ownerName} | Queries (30d): ${entry.queryCount30d}`);
  console.log(`  Freshness: ${entry.freshnessLevel} | Last computed: ${entry.lastComputedAt?.toISOString()}`);
  console.log();
}

// ── Browse by category ───────────────────────────────────
const revenueMetrics = await metrics.browseCatalog(MetricCategoryEnum.REVENUE);
console.log(`Revenue metrics: ${revenueMetrics.length}`);

// ── Get detailed catalog entry ───────────────────────────
const mrrEntry = await metrics.getCatalogEntry('mrr');
console.log(`Used in ${mrrEntry.dashboardCount} dashboards, ${mrrEntry.goalCount} goals`);
console.log(`Related metrics: ${mrrEntry.relatedMetrics.join(', ')}`);
```

### 8. Monitor Data Freshness

```typescript
import { createMetricService, FreshnessLevel } from '@mcv/analytics/metrics';

const metrics = createMetricService({ supabaseUrl, supabaseKey });

// ── Check freshness for a specific metric ────────────────
const freshness = await metrics.checkFreshness('mrr');

console.log(`Metric: ${freshness.metricId}`);
console.log(`Level: ${freshness.level}`);
console.log(`Last computed: ${freshness.lastComputedAt?.toISOString()}`);
console.log(`Age: ${freshness.ageMs}ms`);
console.log(`Max staleness: ${freshness.maxStalenessMs}ms`);
console.log(`Overdue by: ${freshness.overdueMs}ms`);
console.log(`Next scheduled: ${freshness.nextScheduledAt?.toISOString()}`);

// ── Get all stale metrics ────────────────────────────────
const stale = await metrics.getStaleMetrics('venture_acme');

if (stale.length > 0) {
  console.log(`⚠️ ${stale.length} stale metrics detected:`);
  for (const s of stale) {
    const ageHours = Math.round(s.ageMs / (60 * 60 * 1000));
    console.log(`  ${s.metricId}: ${s.level} (${ageHours}h old, max ${s.maxStalenessMs / (60 * 60 * 1000)}h)`);
  }
} else {
  console.log('✅ All metrics are fresh');
}

// ── Full freshness report ────────────────────────────────
const allFreshness = await metrics.checkAllFreshness('venture_acme');
const grouped = {
  fresh: allFreshness.filter(f => f.level === FreshnessLevel.FRESH),
  stale: allFreshness.filter(f => f.level === FreshnessLevel.STALE),
  veryStale: allFreshness.filter(f => f.level === FreshnessLevel.VERY_STALE),
  unknown: allFreshness.filter(f => f.level === FreshnessLevel.UNKNOWN),
};

console.log(`Freshness Report:`);
console.log(`  ✅ Fresh: ${grouped.fresh.length}`);
console.log(`  ⚠️ Stale: ${grouped.stale.length}`);
console.log(`  🔴 Very stale: ${grouped.veryStale.length}`);
console.log(`  ❓ Unknown: ${grouped.unknown.length}`);
```

---

## Error Codes

All errors thrown by the metrics module extend `MetricError` and include a machine-readable code, human-readable message, and contextual metadata.

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `METRIC_NOT_FOUND` | Metric Not Found | 404 | The requested metric ID does not exist in the definition store. Ensure the metric has been defined before querying or computing. |
| `METRIC_ALREADY_EXISTS` | Duplicate Metric | 409 | A metric with this ID (or name within the same venture) already exists. Use `updateMetric` to modify existing definitions. |
| `METRIC_COMPUTATION_FAILED` | Computation Failed | 500 | The metric computation query or function threw an error. Check the `ComputationResult.error` field for details including the original SQL error or function exception. |
| `METRIC_COMPUTATION_TIMEOUT` | Computation Timeout | 504 | The computation exceeded its configured `timeoutMs`. Consider optimizing the query, reducing the time range, or increasing the timeout. |
| `METRIC_CIRCULAR_DEPENDENCY` | Circular Dependency | 400 | A derived metric's dependency graph contains a cycle (e.g., A depends on B, B depends on A). Restructure the dependency chain or create an intermediate metric. |
| `METRIC_DEPENDENCY_NOT_FOUND` | Missing Dependency | 400 | A derived metric references a dependency metric that doesn't exist. Define all source metrics before defining derived metrics. |
| `METRIC_STALE_DEPENDENCY` | Stale Dependency | 422 | A derived metric cannot be computed because one or more of its dependencies has stale data. Recompute the dependencies first. |
| `METRIC_INVALID_EXPRESSION` | Invalid Expression | 400 | The derived metric formula could not be parsed. Check syntax — valid tokens are `metric:<id>`, numeric literals, and operators `+`, `-`, `*`, `/`, `(`, `)`. |
| `METRIC_QUERY_RANGE_EXCEEDED` | Query Range Exceeded | 400 | The requested time range exceeds `MAX_QUERY_RANGE_DAYS` (default: 730 days). Narrow the range or use a coarser granularity. |
| `METRIC_INVALID_GRANULARITY` | Invalid Granularity | 400 | The requested granularity is not supported by this metric. Check the `MetricDefinition.granularities` field for valid options. |
| `METRIC_PERMISSION_DENIED` | Permission Denied | 403 | The authenticated user does not have the required permission level for this metric. Contact the metric owner to request access. |
| `METRIC_GOAL_NOT_FOUND` | Goal Not Found | 404 | The requested goal ID does not exist. |
| `METRIC_GOAL_PERIOD_INVALID` | Invalid Goal Period | 400 | The goal's start date is after its end date, or the period overlaps with an existing active goal for the same metric. |
| `METRIC_AGGREGATION_INCOMPLETE` | Incomplete Aggregation | 422 | The aggregation rule has `requireComplete: true` but not all ventures have data for the requested period. Set `requireComplete: false` or ensure all ventures have computed data. |
| `METRIC_BENCHMARK_NOT_FOUND` | Benchmark Not Found | 404 | The requested benchmark dataset ID does not exist or has no data for the specified metric. |
| `METRIC_EXPORT_TOO_LARGE` | Export Too Large | 413 | The export query would produce more rows than the configured limit. Narrow the time range, reduce dimensions, or use pagination. |
| `METRIC_INVALID_DEFINITION` | Invalid Definition | 400 | The metric definition failed validation. The error `details` field contains specific validation failures (missing required fields, invalid computation config, etc.). |
| `METRIC_VENTURE_NOT_FOUND` | Venture Not Found | 404 | The specified `ventureId` does not exist in the system. |
| `METRIC_RATE_LIMITED` | Rate Limited | 429 | Too many metric queries in a short period. Implement caching on the client side or increase the rate limit for this consumer. |

```typescript
import { MetricError } from '@mcv/analytics/metrics';

try {
  const result = await metrics.query({
    metricIds: 'mrr',
    ventureId: 'venture_acme',
    timeRange: {
      start: new Date('2020-01-01'),
      end: new Date('2026-12-31'),
    },
    granularity: Granularity.DAY,
    fillPolicy: 'none',
    orderBy: 'time_asc',
    includeStats: false,
    includeDeltas: false,
  });
} catch (error) {
  if (error instanceof MetricError) {
    switch (error.code) {
      case 'METRIC_QUERY_RANGE_EXCEEDED':
        console.error(`Query range too large: ${error.message}`);
        console.error(`Max allowed: ${error.metadata.maxDays} days, requested: ${error.metadata.requestedDays} days`);
        break;
      case 'METRIC_PERMISSION_DENIED':
        console.error(`Access denied: ${error.message}`);
        console.error(`Required level: ${error.metadata.requiredLevel}, your level: ${error.metadata.currentLevel}`);
        break;
      case 'METRIC_NOT_FOUND':
        console.error(`Metric not found: ${error.metadata.metricId}`);
        break;
      default:
        console.error(`Metric error [${error.code}]: ${error.message}`);
    }
  }
  throw error;
}
```

---

## Security

### Access Control Model

Metric permissions use a **layered access control** model that combines role-based access with metric-level and category-level rules:

1. **Platform-level**: Super admins can access all metrics across all ventures.
2. **Venture-level**: Venture members can discover metrics within their venture. Read/write access depends on role.
3. **Category-level**: Entire categories can be restricted (e.g., `revenue` category → leadership only).
4. **Metric-level**: Individual metrics can have specific permission overrides.
5. **Dimension-level**: Access can be scoped to specific dimension values (e.g., "can only see metrics for department=marketing").

**Deny rules take precedence over grants.** A deny at any level blocks access regardless of grants elsewhere.

```typescript
// Example: Restrict all revenue metrics to leadership and finance
await metrics.grantAccess({
  metricId: null,
  category: MetricCategoryEnum.REVENUE,
  ventureId: 'venture_acme',
  subjectType: 'role',
  subjectId: 'leadership',
  level: PermissionLevel.READ,
  deny: false,
  grantedBy: 'user_admin',
});

await metrics.grantAccess({
  metricId: null,
  category: MetricCategoryEnum.REVENUE,
  ventureId: 'venture_acme',
  subjectType: 'team',
  subjectId: 'finance_team',
  level: PermissionLevel.WRITE,
  deny: false,
  grantedBy: 'user_admin',
});

// Block a specific user from seeing a sensitive metric
await metrics.grantAccess({
  metricId: 'burn_rate',
  category: null,
  ventureId: 'venture_acme',
  subjectType: 'user',
  subjectId: 'user_contractor_dave',
  level: PermissionLevel.READ,
  deny: true, // Deny rule
  grantedBy: 'user_admin',
  conditions: null,
  expiresAt: new Date('2026-06-30'), // Temporary deny
});
```

### Row-Level Security (RLS)

All metric tables use Supabase RLS policies to enforce tenant isolation at the database level:

```sql
-- Venture isolation: users can only see metrics for their venture(s)
CREATE POLICY "venture_isolation" ON metric_values
  FOR SELECT
  USING (
    venture_id IS NULL  -- Global metrics visible to all
    OR venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
    )
  );

-- Metric-level permissions: check the permissions table
CREATE POLICY "metric_permissions" ON metric_values
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM metric_permissions mp
      WHERE mp.metric_id = metric_values.metric_id
        AND mp.subject_id IN (
          SELECT role_id FROM user_roles WHERE user_id = auth.uid()
          UNION
          SELECT team_id FROM team_members WHERE user_id = auth.uid()
          UNION
          SELECT auth.uid()::text
        )
        AND mp.level IN ('read', 'write', 'admin')
        AND mp.deny = false
        AND (mp.expires_at IS NULL OR mp.expires_at > now())
    )
    -- No explicit permission entry means fall through to venture-level defaults
    OR NOT EXISTS (
      SELECT 1 FROM metric_permissions mp
      WHERE mp.metric_id = metric_values.metric_id
    )
  );
```

### Audit Trail

All metric operations are logged to `metric_audit_log`:
- Metric definition changes (create, update, deprecate, archive)
- Permission grants and revocations
- Goal creation and modifications
- Manual computation triggers
- Export operations

Audit logs are immutable and retained for 7 years for compliance.

### Data Classification

Metrics are tagged with data sensitivity levels that flow through to all access checks:

| Level | Examples | Access |
|-------|----------|--------|
| `public` | DAU, MAU, page views | All venture members |
| `internal` | Conversion rate, NPS | Team members + leadership |
| `confidential` | MRR, ARR, churn rate | Leadership + finance |
| `restricted` | Burn rate, runway, CAC | C-suite + board only |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `METRICS_DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string (must have TimescaleDB extension) |
| `METRICS_SUPABASE_URL` | Yes | — | Supabase project URL for RLS-enabled queries |
| `METRICS_SUPABASE_SERVICE_KEY` | Yes | — | Supabase service role key (for server-side computation, bypasses RLS) |
| `METRICS_SUPABASE_ANON_KEY` | Yes | — | Supabase anon key (for client-side queries, respects RLS) |
| `METRICS_REDIS_URL` | No | — | Redis connection for computation queue and caching. If not set, falls back to in-memory queue (not recommended for production). |
| `METRICS_COMPUTATION_CONCURRENCY` | No | `4` | Maximum concurrent computation jobs |
| `METRICS_COMPUTATION_TIMEOUT_MS` | No | `60000` | Default computation timeout in milliseconds |
| `METRICS_QUERY_CACHE_TTL_MS` | No | `300000` | Query result cache TTL (5 minutes default) |
| `METRICS_MAX_QUERY_RANGE_DAYS` | No | `730` | Maximum queryable time range in days |
| `METRICS_FRESHNESS_CHECK_INTERVAL_MS` | No | `300000` | How often to run freshness checks (5 minutes default) |
| `METRICS_ALERT_SLACK_WEBHOOK` | No | — | Slack webhook URL for metric alerts |
| `METRICS_ALERT_EMAIL_FROM` | No | `metrics@mcv.platform` | From address for email alerts |
| `METRICS_TIMESCALEDB_CHUNK_INTERVAL` | No | `1 day` | TimescaleDB chunk time interval for the hypertable |
| `METRICS_COMPRESSION_AGE_DAYS` | No | `7` | Compress data older than N days |
| `METRICS_RETENTION_DAYS` | No | `1825` | Retain data for N days (5 years default) |
| `METRICS_BENCHMARK_API_KEY` | No | — | API key for external benchmark data providers |
| `METRICS_LOG_LEVEL` | No | `info` | Logging verbosity: `debug`, `info`, `warn`, `error` |

---

## Dependencies

### Internal Dependencies

| Module | Usage |
|--------|-------|
| `@mcv/cdp` | Behavioral event streams — page views, signups, conversions, feature usage. Primary data source for engagement and acquisition metrics (DAU, MAU, conversion rate). |
| `@mcv/finance` | Revenue and billing data — subscriptions, invoices, payments, refunds. Primary data source for financial metrics (MRR, ARR, ARPU, churn rate, CAC). |
| `@mcv/engagement` | User activity signals — session data, feature adoption, retention cohorts. Data source for engagement and retention metrics (NPS, feature adoption rate). |
| `@mcv/auth` | Authentication context for permission checks. Provides `userId`, `roles`, `ventureIds` for access control evaluation. |
| `@mcv/tenancy` | Multi-tenant context. Provides venture metadata, tenant isolation utilities, and cross-venture query scoping. |
| `@mcv/notifications` | Alert delivery — sends goal threshold alerts and freshness warnings via Slack, email, and in-app channels. |
| `@mcv/jobs` | Job scheduling and queue management for batch computation. Provides cron scheduling, retry logic, and concurrency control. |
| `@mcv/audit` | Platform-wide audit logging. Metric audit events are forwarded here for centralized compliance reporting. |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.x` | ORM for PostgreSQL schema definition, queries, and migrations |
| `@supabase/supabase-js` | `^2.x` | Supabase client for RLS-respecting queries and real-time subscriptions |
| `pg` | `^8.x` | PostgreSQL driver for direct database connections (computation engine) |
| `ioredis` | `^5.x` | Redis client for computation queues and query caching |
| `cron-parser` | `^4.x` | Parsing cron expressions for computation schedules |
| `mathjs` | `^12.x` | Expression parsing and evaluation for derived metric formulas |
| `zod` | `^3.x` | Runtime validation of metric definitions, queries, and configurations |
| `date-fns` | `^3.x` | Date manipulation for time bucketing, period calculations, and comparisons |
| `nanoid` | `^5.x` | ID generation for computations, goals, alerts, and audit records |
| `pino` | `^8.x` | Structured logging for computation jobs and service operations |

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { MetricComputeEngine } from '@mcv/analytics/metrics';
import { DerivedMetricResolver } from '@mcv/analytics/metrics';

describe('MetricComputeEngine', () => {
  it('should compute a simple counter metric from query', async () => {
    const engine = new MetricComputeEngine({
      db: mockDb,
      redis: mockRedis,
    });

    const result = await engine.compute({
      metricId: 'total_signups',
      ventureId: 'venture_test',
      granularity: 'day',
      timeRange: { start: new Date('2026-01-01'), end: new Date('2026-01-02') },
    });

    expect(result.status).toBe('completed');
    expect(result.pointsProduced).toBe(1);
    expect(result.durationMs).toBeGreaterThan(0);
  });

  it('should handle computation timeouts gracefully', async () => {
    const engine = new MetricComputeEngine({
      db: mockSlowDb, // Simulates a slow query
      redis: mockRedis,
    });

    const result = await engine.compute({
      metricId: 'complex_metric',
      ventureId: 'venture_test',
      granularity: 'day',
      timeRange: { start: new Date('2026-01-01'), end: new Date('2026-01-02') },
      timeoutMs: 100, // Very short timeout
    });

    expect(result.status).toBe('timeout');
    expect(result.error?.code).toBe('METRIC_COMPUTATION_TIMEOUT');
    expect(result.error?.retryable).toBe(true);
  });

  it('should retry failed computations up to maxAttempts', async () => {
    const querySpy = vi.fn()
      .mockRejectedValueOnce(new Error('Connection reset'))
      .mockRejectedValueOnce(new Error('Connection reset'))
      .mockResolvedValueOnce({ rows: [{ value: 42 }] });

    const engine = new MetricComputeEngine({ db: { query: querySpy }, redis: mockRedis });

    const result = await engine.compute({
      metricId: 'flaky_metric',
      ventureId: 'venture_test',
      granularity: 'day',
      timeRange: { start: new Date('2026-01-01'), end: new Date('2026-01-02') },
    });

    expect(result.status).toBe('completed');
    expect(result.attempt).toBe(3);
    expect(querySpy).toHaveBeenCalledTimes(3);
  });
});

describe('DerivedMetricResolver', () => {
  it('should resolve a simple two-metric formula', async () => {
    const resolver = new DerivedMetricResolver({ metricStore: mockMetricStore });

    // Set up: ARPU = 50, churn_rate = 5
    mockMetricStore.getValue.mockImplementation((id: string) => {
      if (id === 'arpu') return 50;
      if (id === 'churn_rate') return 5;
      return null;
    });

    const value = await resolver.resolve('metric:arpu / (metric:churn_rate / 100)');
    expect(value).toBe(1000); // LTV = 50 / 0.05 = 1000
  });

  it('should detect circular dependencies', async () => {
    const resolver = new DerivedMetricResolver({ metricStore: mockMetricStore });

    // A depends on B, B depends on A
    mockMetricStore.getDependencies.mockImplementation((id: string) => {
      if (id === 'metric_a') return ['metric_b'];
      if (id === 'metric_b') return ['metric_a'];
      return [];
    });

    await expect(resolver.checkDependencies('metric_a'))
      .rejects.toThrow('METRIC_CIRCULAR_DEPENDENCY');
  });

  it('should compute in topological order', async () => {
    const resolver = new DerivedMetricResolver({ metricStore: mockMetricStore });
    const computeOrder: string[] = [];

    // LTV:CAC depends on LTV and CAC
    // LTV depends on ARPU and churn_rate
    mockMetricStore.getDependencies.mockImplementation((id: string) => {
      if (id === 'ltv_cac_ratio') return ['ltv', 'cac'];
      if (id === 'ltv') return ['arpu', 'churn_rate'];
      return [];
    });

    const order = await resolver.getComputeOrder('ltv_cac_ratio');
    expect(order).toEqual(['arpu', 'churn_rate', 'cac', 'ltv', 'ltv_cac_ratio']);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMetricService } from '@mcv/analytics/metrics';
import { setupTestDatabase, teardownTestDatabase } from '@mcv/testing';

describe('MetricService Integration', () => {
  let metrics: MetricService;
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await setupTestDatabase({
      extensions: ['timescaledb'],
      migrations: ['@mcv/analytics/metrics'],
    });
    metrics = createMetricService({
      supabaseUrl: testDb.url,
      supabaseKey: testDb.serviceKey,
    });
  });

  afterAll(async () => {
    await teardownTestDatabase(testDb);
  });

  it('should define a metric and retrieve it', async () => {
    const definition = await metrics.defineMetric({
      name: 'Test Metric',
      ventureId: 'test_venture',
      description: 'A test metric',
      shortDescription: 'Test',
      category: 'custom',
      type: MetricType.GAUGE,
      unit: 'count',
      precision: 0,
      computationMode: ComputationMode.QUERY,
      computation: {
        kind: 'query',
        source: 'SELECT COUNT(*) as value FROM users WHERE venture_id = :ventureId',
        parameters: {},
        timeoutMs: 5000,
        retry: { maxAttempts: 1, backoffMs: 0 },
      },
      dataSources: [{ module: '@mcv/auth', entity: 'users', mode: 'pull' }],
      dependencies: [],
      granularities: ['day'],
      defaultGranularity: 'day',
      dimensions: [],
      tags: ['test'],
      ownership: {
        ownerId: 'test_user',
        ownerName: 'Test User',
        ownerEmail: 'test@test.com',
        team: 'Testing',
        department: 'Engineering',
      },
      permissions: [],
      freshness: { maxStalenessMs: 86400000, schedule: '0 0 * * *', realtime: false },
      display: { chartType: 'number', color: '#000', higherIsBetter: true, formatPattern: '#,##0' },
      status: 'active',
    });

    expect(definition.id).toBeDefined();
    expect(definition.name).toBe('Test Metric');

    const retrieved = await metrics.getMetric(definition.id, 'test_venture');
    expect(retrieved).not.toBeNull();
    expect(retrieved!.name).toBe('Test Metric');
  });

  it('should compute a metric and store time-series values', async () => {
    const result = await metrics.compute('test_metric', {
      ventureId: 'test_venture',
      granularity: 'day',
      timeRange: {
        start: new Date('2026-01-01'),
        end: new Date('2026-01-08'),
      },
    });

    expect(result.status).toBe('completed');
    expect(result.pointsProduced).toBeGreaterThan(0);

    // Query back the values
    const series = await metrics.query({
      metricIds: 'test_metric',
      ventureId: 'test_venture',
      timeRange: {
        start: new Date('2026-01-01'),
        end: new Date('2026-01-08'),
      },
      granularity: Granularity.DAY,
      fillPolicy: 'none',
      orderBy: 'time_asc',
      includeStats: false,
      includeDeltas: false,
    });

    expect(series.series.length).toBe(result.pointsProduced);
  });

  it('should enforce metric permissions', async () => {
    // Grant read access only to leadership
    await metrics.grantAccess({
      metricId: 'test_metric',
      category: null,
      ventureId: 'test_venture',
      subjectType: 'role',
      subjectId: 'leadership',
      level: PermissionLevel.READ,
      deny: false,
      grantedBy: 'admin',
    });

    // Leadership user can access
    const canAccess = await metrics.checkAccess('leadership_user', 'test_metric', PermissionLevel.READ);
    expect(canAccess).toBe(true);

    // Regular user cannot access
    const cannotAccess = await metrics.checkAccess('regular_user', 'test_metric', PermissionLevel.READ);
    expect(cannotAccess).toBe(false);
  });

  it('should track goal progress correctly', async () => {
    const goal = await metrics.setGoal({
      metricId: 'test_metric',
      ventureId: 'test_venture',
      name: 'Test Goal',
      description: 'A test goal',
      targetValue: 100,
      baselineValue: 50,
      direction: GoalDirection.INCREASE,
      period: {
        start: new Date('2026-01-01'),
        end: new Date('2026-03-31'),
      },
      milestones: [],
      thresholds: [],
      alertChannels: [],
      active: true,
      createdBy: 'test_user',
    });

    const progress = await metrics.getGoalProgress(goal.id);
    expect(progress.targetValue).toBe(100);
    expect(progress.baselineValue).toBe(50);
    expect(progress.progressPercent).toBeGreaterThanOrEqual(0);
  });

  it('should handle cross-venture aggregation', async () => {
    const rule = await metrics.createAggregationRule({
      name: 'Test Aggregation',
      sourceMetricId: 'test_metric',
      targetMetricId: 'test_metric_aggregate',
      aggregateDimensions: ['venture'],
      preserveDimensions: [],
      function: AggregationFunction.SUM,
      ventureIds: ['test_venture_1', 'test_venture_2'],
      requireComplete: false,
      filter: [],
      schedule: '0 0 * * *',
      active: true,
    });

    const result = await metrics.runAggregation(rule.id);
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.contributingVentures).toBeLessThanOrEqual(2);
  });
});
```

### Testing Checklist

- [ ] Unit tests for all computation modes (query, function, derived, external, streaming)
- [ ] Unit tests for expression parser (valid formulas, invalid syntax, edge cases)
- [ ] Unit tests for circular dependency detection
- [ ] Unit tests for topological sort of metric dependencies
- [ ] Unit tests for time bucketing across all granularities
- [ ] Unit tests for fill policies (none, zero, null, previous, interpolate)
- [ ] Unit tests for all aggregation functions
- [ ] Unit tests for permission evaluation (grants, denies, cascading)
- [ ] Unit tests for freshness level calculation
- [ ] Unit tests for goal progress computation (on-track, behind, ahead)
- [ ] Unit tests for metric value formatting
- [ ] Integration tests with TimescaleDB hypertable
- [ ] Integration tests for continuous aggregates
- [ ] Integration tests for compression and retention policies
- [ ] Integration tests for RLS policies
- [ ] Integration tests for concurrent computation jobs
- [ ] Integration tests for metric catalog full-text search
- [ ] Load tests for time-series query performance (10K+ data points)
- [ ] Load tests for concurrent metric computation (50+ parallel jobs)
- [ ] E2E tests for define → compute → query → display pipeline
- [ ] E2E tests for goal creation → progress tracking → alert delivery

---

## Standard Metric Library

The module ships with pre-defined templates for common business metrics. These can be instantiated per venture with a single call:

| Metric ID | Name | Type | Category | Formula / Source |
|-----------|------|------|----------|-----------------|
| `mrr` | Monthly Recurring Revenue | Currency | Revenue | Sum of normalized monthly subscription amounts |
| `arr` | Annual Recurring Revenue | Currency | Revenue | MRR × 12 |
| `arpu` | Average Revenue Per User | Currency | Revenue | MRR / active subscribers |
| `churn_rate` | Monthly Churn Rate | Percentage | Retention | Churned customers / start-of-month customers × 100 |
| `revenue_churn` | Revenue Churn Rate | Percentage | Retention | Churned MRR / start-of-month MRR × 100 |
| `nrr` | Net Revenue Retention | Percentage | Retention | (Start MRR + Expansion - Contraction - Churn) / Start MRR × 100 |
| `ltv` | Customer Lifetime Value | Currency | Financial | ARPU / churn rate |
| `cac` | Customer Acquisition Cost | Currency | Acquisition | Total acquisition spend / new customers |
| `ltv_cac_ratio` | LTV:CAC Ratio | Ratio | Financial | LTV / CAC |
| `dau` | Daily Active Users | Gauge | Engagement | Unique users with activity in last 24h |
| `mau` | Monthly Active Users | Gauge | Engagement | Unique users with activity in last 30d |
| `dau_mau_ratio` | DAU/MAU Ratio (Stickiness) | Ratio | Engagement | DAU / MAU |
| `nps` | Net Promoter Score | Score | Satisfaction | % Promoters - % Detractors |
| `conversion_rate` | Conversion Rate | Percentage | Acquisition | Conversions / visitors × 100 |
| `payback_period` | CAC Payback Period | Gauge | Financial | CAC / (ARPU × gross margin) |
| `burn_rate` | Monthly Burn Rate | Currency | Financial | Total monthly expenses - revenue |
| `runway` | Runway (Months) | Gauge | Financial | Cash balance / burn rate |

```typescript
import { createMetricService, STANDARD_METRICS } from '@mcv/analytics/metrics';

const metrics = createMetricService({ supabaseUrl, supabaseKey });

// Instantiate all standard SaaS metrics for a new venture
for (const template of STANDARD_METRICS) {
  await metrics.defineMetric({
    ...template,
    ventureId: 'venture_new',
    ownership: {
      ownerId: 'user_admin',
      ownerName: 'Admin',
      ownerEmail: 'admin@new.ventures',
      team: 'Operations',
      department: 'Operations',
    },
  });
}

console.log(`Provisioned ${STANDARD_METRICS.length} standard metrics for venture_new`);
```

---

## Performance Considerations

### TimescaleDB Optimization

- **Hypertable chunking**: `metric_values` is partitioned into daily chunks. Queries that span fewer chunks are significantly faster.
- **Continuous aggregates**: Minute-level data is automatically rolled up to hourly and daily views, avoiding expensive on-the-fly aggregation.
- **Compression**: Data older than 7 days is compressed at ~10:1 ratio, reducing storage costs while maintaining query speed.
- **Retention**: Minute-level data is retained for 7 days, hourly for 90 days, daily for 5 years, monthly indefinitely.

### Query Caching

- Recent snapshots are cached in Redis with a 5-minute TTL (configurable via `METRICS_QUERY_CACHE_TTL_MS`).
- Time-series queries for completed periods (e.g., last month) are cached longer since the data won't change.
- Cache is invalidated when new computation results are stored.

### Computation Scheduling

- Metrics are computed in dependency order (topological sort) to ensure derived metrics always have fresh source data.
- Independent metrics are computed in parallel (up to `METRICS_COMPUTATION_CONCURRENCY` concurrent jobs).
- Backfill operations are rate-limited to avoid overwhelming the database.

---

*Last updated: 2026-02-08*