# @mcv/analytics — Package Specification
## Tier 5: PUBLISHABLE Domains

**Package:** `@mcv/analytics`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/analytics` provides a comprehensive analytics and business intelligence platform for ventures. It encompasses custom metrics and KPI tracking, interactive dashboards, conversion funnels, cohort analysis, AI-powered insights, and scheduled report generation. Built for multi-tenant SaaS with real-time streaming capabilities and historical data warehousing.

**Key Capabilities:**
- Custom metrics and KPI definitions with real-time computation
- Interactive dashboard builder with drag-and-drop widgets
- Conversion funnel visualization and optimization
- Cohort analysis for retention and LTV tracking
- AI-powered insights and anomaly detection
- Scheduled and ad-hoc report generation with multiple export formats

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VENTURE APPLICATIONS                               │
│                                                                              │
│  @mcv/commerce  @mcv/engagement  @mcv/growth  @mcv/people  @mcv/finance     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ events & data
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/analytics                                  │
│                                                                              │
│  ┌───────────┐ ┌────────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  metrics  │ │ dashboards │ │  funnels  │ │ cohorts  │ │   insights   │  │
│  └───────────┘ └────────────┘ └───────────┘ └──────────┘ └──────────────┘  │
│                                                                              │
│                          ┌──────────────┐                                    │
│                          │   reports    │                                    │
│                          └──────────────┘                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ depends on
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│     @mcv/kernel  |  @mcv/events  |  @mcv/storage  |  @mcv/ai                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **metrics** | Custom KPI definitions, calculations, and thresholds | `Metric`, `MetricValue`, `KPITracker`, `MetricAggregator` |
| **dashboards** | Interactive dashboard builder with widgets | `Dashboard`, `Widget`, `DashboardBuilder`, `WidgetRenderer` |
| **funnels** | Conversion funnel tracking and visualization | `Funnel`, `FunnelStep`, `FunnelAnalyzer`, `ConversionTracker` |
| **cohorts** | User cohort analysis for retention and behavior | `Cohort`, `CohortAnalysis`, `RetentionMatrix`, `LTVCalculator` |
| **insights** | AI-powered anomaly detection and recommendations | `Insight`, `AnomalyDetector`, `TrendAnalyzer`, `RecommendationEngine` |
| **reports** | Scheduled and ad-hoc report generation | `Report`, `ReportTemplate`, `ReportScheduler`, `ReportExporter` |

---

## Module: metrics

### Purpose

Defines custom metrics and KPIs with flexible calculation methods, aggregation rules, thresholds, and alerting capabilities. Supports real-time and historical metric computation.

### Core Concepts

**Metric Types:**
- **Counter:** Monotonically increasing values (e.g., total signups, page views)
- **Gauge:** Point-in-time measurements (e.g., active users, cart value)
- **Histogram:** Distribution of values (e.g., response times, order values)
- **Rate:** Calculated rates over time windows (e.g., conversion rate, churn rate)
- **Derived:** Computed from other metrics (e.g., ARPU = revenue / users)

**Aggregation Methods:**
- Sum, Count, Average, Min, Max
- Percentiles (P50, P90, P95, P99)
- Distinct Count
- Weighted Average
- Moving Average (SMA, EMA)

### Database Schema

```typescript
// @mcv/analytics/metrics/schema.ts
import { pgTable, uuid, text, numeric, timestamp, pgEnum, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const metricTypeEnum = pgEnum('metric_type', [
  'counter', 'gauge', 'histogram', 'rate', 'derived'
]);

export const aggregationMethodEnum = pgEnum('aggregation_method', [
  'sum', 'count', 'avg', 'min', 'max', 'distinct_count',
  'p50', 'p90', 'p95', 'p99', 'weighted_avg', 'sma', 'ema'
]);

export const granularityEnum = pgEnum('granularity', [
  'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'
]);

export const metricDefinitions = pgTable('analytics_metric_definitions', {
  ...baseColumns,
  
  // Identity
  slug: text('slug').notNull(),                      // e.g., "monthly_active_users"
  name: text('name').notNull(),                      // e.g., "Monthly Active Users"
  description: text('description'),
  category: text('category'),                         // e.g., "engagement", "revenue"
  
  // Type and calculation
  type: metricTypeEnum('type').notNull(),
  aggregation: aggregationMethodEnum('aggregation').default('sum'),
  
  // For derived metrics
  formula: text('formula'),                           // e.g., "revenue / active_users"
  dependsOn: text('depends_on').array(),             // Metric slugs this depends on
  
  // Data source
  eventType: text('event_type'),                     // Event to listen for
  valueField: text('value_field'),                   // Field in event to extract
  filterConditions: jsonb('filter_conditions'),       // Filter events
  /*
    filterConditions: {
      "user.type": { "eq": "paid" },
      "event.source": { "in": ["web", "mobile"] }
    }
  */
  
  // Grouping
  dimensions: text('dimensions').array(),             // ["country", "platform", "plan"]
  
  // Thresholds and alerts
  thresholds: jsonb('thresholds'),
  /*
    thresholds: {
      warning: { operator: "lt", value: 1000 },
      critical: { operator: "lt", value: 500 },
      target: { operator: "gte", value: 5000 }
    }
  */
  
  // Display
  unit: text('unit'),                                 // "users", "USD", "%", "ms"
  format: text('format'),                             // "number", "currency", "percent", "duration"
  precision: integer('precision').default(2),
  color: text('color'),
  icon: text('icon'),
  
  // Settings
  isActive: boolean('is_active').default(true),
  isSystem: boolean('is_system').default(false),
  retentionDays: integer('retention_days').default(365),
  
  // Caching
  cacheTtlSeconds: integer('cache_ttl_seconds').default(300),
}, (table) => ({
  slugIdx: index('metric_def_slug_idx').on(table.ventureId, table.slug),
  categoryIdx: index('metric_def_category_idx').on(table.ventureId, table.category),
}));

export const metricValues = pgTable('analytics_metric_values', {
  ...baseColumns,
  
  metricId: uuid('metric_id').references(() => metricDefinitions.id).notNull(),
  
  // Time bucketing
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  granularity: granularityEnum('granularity').notNull(),
  
  // Dimension values
  dimensionValues: jsonb('dimension_values'),         // { country: "US", platform: "web" }
  
  // Aggregated values
  value: numeric('value', { precision: 20, scale: 6 }).notNull(),
  count: integer('count').default(1),
  
  // For histograms
  min: numeric('min', { precision: 20, scale: 6 }),
  max: numeric('max', { precision: 20, scale: 6 }),
  sum: numeric('sum', { precision: 20, scale: 6 }),
  sumSquares: numeric('sum_squares', { precision: 30, scale: 6 }),
  buckets: jsonb('buckets'),                          // Histogram buckets
  
  // Computation metadata
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow(),
  isPartial: boolean('is_partial').default(false),
}, (table) => ({
  timeIdx: index('metric_values_time_idx').on(table.metricId, table.timestamp, table.granularity),
  lookupIdx: index('metric_values_lookup_idx').on(table.ventureId, table.metricId, table.granularity, table.timestamp),
}));

export const metricAlerts = pgTable('analytics_metric_alerts', {
  ...baseColumns,
  
  metricId: uuid('metric_id').references(() => metricDefinitions.id).notNull(),
  
  // Alert definition
  name: text('name').notNull(),
  condition: jsonb('condition').notNull(),
  /*
    condition: {
      type: "threshold",
      operator: "lt",
      value: 100,
      window: "1h",
      consecutiveBreaches: 3
    }
  */
  
  // Notification channels
  channels: jsonb('channels').notNull(),
  /*
    channels: [
      { type: "email", recipients: ["team@example.com"] },
      { type: "slack", webhook: "https://..." },
      { type: "pagerduty", serviceKey: "..." }
    ]
  */
  
  // State
  isActive: boolean('is_active').default(true),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  lastResolvedAt: timestamp('last_resolved_at', { withTimezone: true }),
  currentState: text('current_state').default('ok'), // ok, warning, critical
  
  // Snooze
  snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),
  
  // Settings
  cooldownMinutes: integer('cooldown_minutes').default(60),
  notifyOnResolve: boolean('notify_on_resolve').default(true),
});

export const metricAlertEvents = pgTable('analytics_metric_alert_events', {
  ...baseColumns,
  
  alertId: uuid('alert_id').references(() => metricAlerts.id).notNull(),
  
  eventType: text('event_type').notNull(),            // triggered, resolved, snoozed, acknowledged
  previousState: text('previous_state'),
  newState: text('new_state'),
  
  metricValue: numeric('metric_value', { precision: 20, scale: 6 }),
  thresholdValue: numeric('threshold_value', { precision: 20, scale: 6 }),
  
  notificationsSent: jsonb('notifications_sent'),
  acknowledgedBy: uuid('acknowledged_by'),
  notes: text('notes'),
});
```

### Service Implementation

```typescript
// @mcv/analytics/metrics/service.ts
import { db } from '@mcv/kernel';
import { eq, and, sql, between, desc, gte, lte, inArray } from 'drizzle-orm';
import { metricDefinitions, metricValues, metricAlerts } from './schema';
import { MCVError, ErrorCode } from '@mcv/kernel/errors';
import { getContext } from '@mcv/kernel/context';
import { redis } from '@mcv/kernel/redis';
import { eventBus } from '@mcv/events';
import Decimal from 'decimal.js';

export interface CreateMetricInput {
  slug: string;
  name: string;
  description?: string;
  category?: string;
  type: 'counter' | 'gauge' | 'histogram' | 'rate' | 'derived';
  aggregation?: string;
  formula?: string;
  dependsOn?: string[];
  eventType?: string;
  valueField?: string;
  filterConditions?: Record<string, any>;
  dimensions?: string[];
  thresholds?: Record<string, any>;
  unit?: string;
  format?: string;
}

export interface MetricQueryOptions {
  metricId?: string;
  slug?: string;
  startDate: Date;
  endDate: Date;
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  dimensions?: Record<string, string>;
  compareToStart?: Date;
  compareToEnd?: Date;
}

export interface MetricResult {
  metric: typeof metricDefinitions.$inferSelect;
  current: {
    value: number;
    trend: number;
    trendDirection: 'up' | 'down' | 'flat';
    timeSeries: Array<{ timestamp: Date; value: number }>;
  };
  comparison?: {
    value: number;
    percentChange: number;
    timeSeries: Array<{ timestamp: Date; value: number }>;
  };
  byDimension?: Record<string, Array<{ key: string; value: number }>>;
  status: 'ok' | 'warning' | 'critical';
}

export class MetricsService {
  
  /**
   * Create a new metric definition
   */
  async createMetric(input: CreateMetricInput) {
    const ctx = getContext();
    
    // Validate slug uniqueness
    const existing = await db.query.metricDefinitions.findFirst({
      where: and(
        eq(metricDefinitions.ventureId, ctx.venture.id),
        eq(metricDefinitions.slug, input.slug)
      ),
    });
    
    if (existing) {
      throw new MCVError('Metric with this slug already exists', ErrorCode.ALREADY_EXISTS);
    }
    
    // Validate derived metric formula
    if (input.type === 'derived' && input.formula) {
      await this.validateFormula(input.formula, input.dependsOn || []);
    }
    
    const [metric] = await db.insert(metricDefinitions).values({
      ventureId: ctx.venture.id,
      slug: input.slug,
      name: input.name,
      description: input.description,
      category: input.category,
      type: input.type,
      aggregation: input.aggregation as any ?? 'sum',
      formula: input.formula,
      dependsOn: input.dependsOn,
      eventType: input.eventType,
      valueField: input.valueField,
      filterConditions: input.filterConditions,
      dimensions: input.dimensions,
      thresholds: input.thresholds,
      unit: input.unit,
      format: input.format,
      createdBy: ctx.user?.id,
    }).returning();
    
    // Register event listener if event-based metric
    if (input.eventType) {
      await this.registerEventListener(metric);
    }
    
    return metric;
  }

  /**
   * Query metric values with aggregation
   */
  async queryMetric(options: MetricQueryOptions): Promise<MetricResult> {
    const ctx = getContext();
    
    // Get metric definition
    const metric = await db.query.metricDefinitions.findFirst({
      where: and(
        eq(metricDefinitions.ventureId, ctx.venture.id),
        options.metricId 
          ? eq(metricDefinitions.id, options.metricId)
          : eq(metricDefinitions.slug, options.slug!)
      ),
    });
    
    if (!metric) {
      throw new MCVError('Metric not found', ErrorCode.NOT_FOUND);
    }
    
    // Check cache first
    const cacheKey = this.getCacheKey(metric.id, options);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Query current period
    const currentValues = await this.getMetricTimeSeries(
      metric.id,
      options.startDate,
      options.endDate,
      options.granularity,
      options.dimensions
    );
    
    // Calculate current total and trend
    const currentTotal = this.aggregateValues(currentValues, metric.aggregation!);
    const trend = this.calculateTrend(currentValues);
    
    // Query comparison period if specified
    let comparison: MetricResult['comparison'];
    if (options.compareToStart && options.compareToEnd) {
      const comparisonValues = await this.getMetricTimeSeries(
        metric.id,
        options.compareToStart,
        options.compareToEnd,
        options.granularity,
        options.dimensions
      );
      
      const comparisonTotal = this.aggregateValues(comparisonValues, metric.aggregation!);
      const percentChange = comparisonTotal !== 0 
        ? ((currentTotal - comparisonTotal) / comparisonTotal) * 100 
        : 0;
      
      comparison = {
        value: comparisonTotal,
        percentChange,
        timeSeries: comparisonValues,
      };
    }
    
    // Query by dimension if metric has dimensions
    let byDimension: MetricResult['byDimension'];
    if (metric.dimensions?.length) {
      byDimension = await this.getMetricByDimensions(
        metric.id,
        options.startDate,
        options.endDate,
        metric.dimensions
      );
    }
    
    // Determine status based on thresholds
    const status = this.evaluateThresholds(currentTotal, metric.thresholds);
    
    const result: MetricResult = {
      metric,
      current: {
        value: currentTotal,
        trend,
        trendDirection: trend > 0.01 ? 'up' : trend < -0.01 ? 'down' : 'flat',
        timeSeries: currentValues,
      },
      comparison,
      byDimension,
      status,
    };
    
    // Cache result
    await redis.setex(cacheKey, metric.cacheTtlSeconds ?? 300, JSON.stringify(result));
    
    return result;
  }

  /**
   * Record a metric value (for real-time tracking)
   */
  async recordValue(
    metricSlug: string, 
    value: number, 
    dimensions?: Record<string, string>,
    timestamp?: Date
  ) {
    const ctx = getContext();
    
    const metric = await db.query.metricDefinitions.findFirst({
      where: and(
        eq(metricDefinitions.ventureId, ctx.venture.id),
        eq(metricDefinitions.slug, metricSlug)
      ),
    });
    
    if (!metric) {
      throw new MCVError('Metric not found', ErrorCode.NOT_FOUND);
    }
    
    const ts = timestamp ?? new Date();
    const granularities: Array<'minute' | 'hour' | 'day' | 'week' | 'month'> = 
      ['minute', 'hour', 'day', 'week', 'month'];
    
    // Insert or update values at each granularity level
    await Promise.all(granularities.map(async (granularity) => {
      const bucketTimestamp = this.getBucketTimestamp(ts, granularity);
      
      // Upsert the metric value
      await db.execute(sql`
        INSERT INTO analytics_metric_values (
          id, venture_id, metric_id, timestamp, granularity, 
          dimension_values, value, count, sum, min, max, created_at
        ) VALUES (
          gen_random_uuid(),
          ${ctx.venture.id},
          ${metric.id},
          ${bucketTimestamp},
          ${granularity},
          ${dimensions ? JSON.stringify(dimensions) : null}::jsonb,
          ${value},
          1,
          ${value},
          ${value},
          ${value},
          NOW()
        )
        ON CONFLICT (venture_id, metric_id, timestamp, granularity, dimension_values)
        DO UPDATE SET
          value = CASE 
            WHEN ${metric.type} = 'gauge' THEN ${value}
            ELSE analytics_metric_values.value + ${value}
          END,
          count = analytics_metric_values.count + 1,
          sum = analytics_metric_values.sum + ${value},
          min = LEAST(analytics_metric_values.min, ${value}),
          max = GREATEST(analytics_metric_values.max, ${value}),
          computed_at = NOW()
      `);
    }));
    
    // Invalidate cache
    await this.invalidateMetricCache(metric.id);
    
    // Check alerts
    await this.checkAlerts(metric, value);
  }

  /**
   * Create a real-time dashboard stream
   */
  async streamMetrics(
    metricSlugs: string[], 
    callback: (updates: Record<string, number>) => void
  ) {
    const ctx = getContext();
    
    // Subscribe to Redis pub/sub for real-time updates
    const channel = `metrics:${ctx.venture.id}`;
    
    const subscriber = redis.duplicate();
    await subscriber.subscribe(channel);
    
    subscriber.on('message', (_channel, message) => {
      const update = JSON.parse(message);
      if (metricSlugs.includes(update.slug)) {
        callback({ [update.slug]: update.value });
      }
    });
    
    return () => subscriber.unsubscribe(channel);
  }

  /**
   * Get top movers (metrics with largest changes)
   */
  async getTopMovers(options: {
    limit?: number;
    category?: string;
    direction?: 'up' | 'down' | 'both';
    period?: 'day' | 'week' | 'month';
  }) {
    const ctx = getContext();
    
    const period = options.period ?? 'day';
    const now = new Date();
    let startDate: Date;
    let compareStart: Date;
    let compareEnd: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        compareStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        compareEnd = startDate;
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        compareStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        compareEnd = startDate;
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        compareStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        compareEnd = startDate;
        break;
    }
    
    // Get all metrics
    const metrics = await db.query.metricDefinitions.findMany({
      where: and(
        eq(metricDefinitions.ventureId, ctx.venture.id),
        eq(metricDefinitions.isActive, true),
        options.category ? eq(metricDefinitions.category, options.category) : undefined
      ),
    });
    
    // Calculate changes for each metric
    const changes = await Promise.all(metrics.map(async (metric) => {
      const result = await this.queryMetric({
        metricId: metric.id,
        startDate,
        endDate: now,
        granularity: period === 'day' ? 'hour' : 'day',
        compareToStart: compareStart,
        compareToEnd: compareEnd,
      });
      
      return {
        metric,
        currentValue: result.current.value,
        previousValue: result.comparison?.value ?? 0,
        percentChange: result.comparison?.percentChange ?? 0,
        absoluteChange: result.current.value - (result.comparison?.value ?? 0),
      };
    }));
    
    // Sort by absolute percent change and filter by direction
    const sorted = changes
      .filter(c => {
        if (options.direction === 'up') return c.percentChange > 0;
        if (options.direction === 'down') return c.percentChange < 0;
        return true;
      })
      .sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
      .slice(0, options.limit ?? 10);
    
    return sorted;
  }

  private async getMetricTimeSeries(
    metricId: string,
    startDate: Date,
    endDate: Date,
    granularity: string,
    dimensions?: Record<string, string>
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const ctx = getContext();
    
    let query = db.select({
      timestamp: metricValues.timestamp,
      value: metricValues.value,
    })
    .from(metricValues)
    .where(and(
      eq(metricValues.ventureId, ctx.venture.id),
      eq(metricValues.metricId, metricId),
      eq(metricValues.granularity, granularity as any),
      gte(metricValues.timestamp, startDate),
      lte(metricValues.timestamp, endDate),
      dimensions 
        ? sql`dimension_values @> ${JSON.stringify(dimensions)}::jsonb` 
        : undefined
    ))
    .orderBy(metricValues.timestamp);
    
    const results = await query;
    return results.map(r => ({
      timestamp: r.timestamp,
      value: Number(r.value),
    }));
  }

  private async getMetricByDimensions(
    metricId: string,
    startDate: Date,
    endDate: Date,
    dimensions: string[]
  ): Promise<Record<string, Array<{ key: string; value: number }>>> {
    const ctx = getContext();
    const result: Record<string, Array<{ key: string; value: number }>> = {};
    
    for (const dimension of dimensions) {
      const data = await db.execute(sql`
        SELECT 
          dimension_values->>${dimension} as dimension_key,
          SUM(value::numeric) as total_value
        FROM analytics_metric_values
        WHERE venture_id = ${ctx.venture.id}
          AND metric_id = ${metricId}
          AND timestamp >= ${startDate}
          AND timestamp <= ${endDate}
          AND dimension_values ? ${dimension}
        GROUP BY dimension_values->>${dimension}
        ORDER BY total_value DESC
        LIMIT 10
      `);
      
      result[dimension] = data.rows.map((r: any) => ({
        key: r.dimension_key,
        value: Number(r.total_value),
      }));
    }
    
    return result;
  }

  private aggregateValues(
    values: Array<{ value: number }>, 
    method: string
  ): number {
    if (values.length === 0) return 0;
    
    const nums = values.map(v => v.value);
    
    switch (method) {
      case 'sum':
        return nums.reduce((a, b) => a + b, 0);
      case 'count':
        return nums.length;
      case 'avg':
        return nums.reduce((a, b) => a + b, 0) / nums.length;
      case 'min':
        return Math.min(...nums);
      case 'max':
        return Math.max(...nums);
      case 'distinct_count':
        return new Set(nums).size;
      default:
        return nums[nums.length - 1] ?? 0; // Latest value for gauges
    }
  }

  private calculateTrend(values: Array<{ timestamp: Date; value: number }>): number {
    if (values.length < 2) return 0;
    
    // Simple linear regression for trend
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    values.forEach((v, i) => {
      sumX += i;
      sumY += v.value;
      sumXY += i * v.value;
      sumX2 += i * i;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;
    
    return avgY !== 0 ? slope / avgY : 0;
  }

  private evaluateThresholds(
    value: number, 
    thresholds: any
  ): 'ok' | 'warning' | 'critical' {
    if (!thresholds) return 'ok';
    
    const evaluate = (threshold: { operator: string; value: number }) => {
      switch (threshold.operator) {
        case 'lt': return value < threshold.value;
        case 'lte': return value <= threshold.value;
        case 'gt': return value > threshold.value;
        case 'gte': return value >= threshold.value;
        case 'eq': return value === threshold.value;
        default: return false;
      }
    };
    
    if (thresholds.critical && evaluate(thresholds.critical)) return 'critical';
    if (thresholds.warning && evaluate(thresholds.warning)) return 'warning';
    return 'ok';
  }

  private getBucketTimestamp(date: Date, granularity: string): Date {
    const d = new Date(date);
    
    switch (granularity) {
      case 'minute':
        d.setSeconds(0, 0);
        break;
      case 'hour':
        d.setMinutes(0, 0, 0);
        break;
      case 'day':
        d.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        break;
      case 'month':
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        break;
    }
    
    return d;
  }

  private getCacheKey(metricId: string, options: MetricQueryOptions): string {
    const ctx = getContext();
    return `metric:${ctx.venture.id}:${metricId}:${options.granularity}:${options.startDate.toISOString()}:${options.endDate.toISOString()}`;
  }

  private async invalidateMetricCache(metricId: string) {
    const ctx = getContext();
    const pattern = `metric:${ctx.venture.id}:${metricId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  private async validateFormula(formula: string, dependsOn: string[]) {
    // Validate formula syntax and dependencies
    // TODO: Implement formula parser and validator
  }

  private async registerEventListener(metric: typeof metricDefinitions.$inferSelect) {
    // Register listener with event bus
    // TODO: Implement event listener registration
  }

  private async checkAlerts(metric: typeof metricDefinitions.$inferSelect, value: number) {
    // Check if any alerts should trigger
    // TODO: Implement alert checking
  }
}

export const metricsService = new MetricsService();
```

---

## Module: dashboards

### Purpose

Interactive dashboard builder with drag-and-drop widgets, multiple visualization types, sharing capabilities, and real-time data refresh.

### Database Schema

```typescript
// @mcv/analytics/dashboards/schema.ts
import { pgTable, uuid, text, timestamp, pgEnum, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const dashboardVisibilityEnum = pgEnum('dashboard_visibility', [
  'private', 'team', 'venture', 'public'
]);

export const widgetTypeEnum = pgEnum('widget_type', [
  'metric', 'chart', 'table', 'funnel', 'cohort', 'map', 
  'leaderboard', 'text', 'image', 'iframe', 'countdown'
]);

export const chartTypeEnum = pgEnum('chart_type', [
  'line', 'bar', 'area', 'pie', 'donut', 'scatter', 
  'heatmap', 'treemap', 'sankey', 'radar', 'gauge'
]);

export const dashboards = pgTable('analytics_dashboards', {
  ...baseColumns,
  
  // Identity
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  
  // Ownership
  ownerId: uuid('owner_id').notNull(),
  teamId: uuid('team_id'),
  
  // Visibility
  visibility: dashboardVisibilityEnum('visibility').default('private'),
  sharedWith: jsonb('shared_with'),                   // Array of user/team IDs
  publicSlug: text('public_slug').unique(),          // For public dashboards
  password: text('password'),                         // Optional password protection
  
  // Layout
  layout: jsonb('layout'),                            // Grid layout configuration
  /*
    layout: {
      columns: 12,
      rowHeight: 50,
      breakpoints: { lg: 1200, md: 996, sm: 768 }
    }
  */
  
  // Appearance
  theme: text('theme').default('light'),
  backgroundColor: text('background_color'),
  headerImage: text('header_image'),
  logo: text('logo'),
  
  // Settings
  refreshInterval: integer('refresh_interval_seconds'),
  timezone: text('timezone'),
  dateRange: jsonb('date_range'),                     // Default date range
  filters: jsonb('filters'),                          // Global filters
  
  // Status
  isDefault: boolean('is_default').default(false),
  isArchived: boolean('is_archived').default(false),
  isFavorite: boolean('is_favorite').default(false),
  
  // Analytics
  viewCount: integer('view_count').default(0),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
}, (table) => ({
  slugIdx: index('dashboard_slug_idx').on(table.ventureId, table.slug),
  ownerIdx: index('dashboard_owner_idx').on(table.ownerId),
}));

export const dashboardWidgets = pgTable('analytics_dashboard_widgets', {
  ...baseColumns,
  
  dashboardId: uuid('dashboard_id').references(() => dashboards.id, { onDelete: 'cascade' }).notNull(),
  
  // Identity
  title: text('title'),
  subtitle: text('subtitle'),
  
  // Type
  type: widgetTypeEnum('type').notNull(),
  chartType: chartTypeEnum('chart_type'),
  
  // Position and size (grid-based)
  position: jsonb('position').notNull(),
  /*
    position: {
      x: 0, y: 0, w: 4, h: 3,
      minW: 2, minH: 2, maxW: 12, maxH: 10
    }
  */
  
  // Data configuration
  dataSource: jsonb('data_source').notNull(),
  /*
    dataSource: {
      type: "metric",
      metricId: "uuid",
      // OR
      type: "query",
      query: "SELECT ...",
      // OR
      type: "api",
      endpoint: "/api/...",
      params: {}
    }
  */
  
  // Visualization options
  options: jsonb('options'),
  /*
    options: {
      showLegend: true,
      stacked: false,
      colors: ["#4f46e5", "#10b981"],
      xAxis: { label: "Date" },
      yAxis: { label: "Value", format: "currency" }
    }
  */
  
  // Filters specific to this widget
  filters: jsonb('filters'),
  
  // Comparison
  comparison: jsonb('comparison'),
  /*
    comparison: {
      enabled: true,
      type: "previous_period",
      showDelta: true
    }
  */
  
  // Drill-down configuration
  drilldown: jsonb('drilldown'),
  /*
    drilldown: {
      enabled: true,
      dimensions: ["country", "city"],
      link: "/analytics/detail?dimension=$dimension"
    }
  */
  
  // Display options
  displayOrder: integer('display_order').default(0),
  isVisible: boolean('is_visible').default(true),
  
  // Caching
  cacheTtlSeconds: integer('cache_ttl_seconds'),
  lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
});

export const dashboardSnapshots = pgTable('analytics_dashboard_snapshots', {
  ...baseColumns,
  
  dashboardId: uuid('dashboard_id').references(() => dashboards.id).notNull(),
  
  name: text('name').notNull(),
  description: text('description'),
  
  // Snapshot data
  snapshotData: jsonb('snapshot_data').notNull(),     // Full dashboard data at time of snapshot
  thumbnailUrl: text('thumbnail_url'),
  
  // Scheduling
  isScheduled: boolean('is_scheduled').default(false),
  scheduleConfig: jsonb('schedule_config'),
  /*
    scheduleConfig: {
      frequency: "weekly",
      dayOfWeek: 1,
      hour: 9,
      timezone: "America/New_York"
    }
  */
  
  // Delivery
  deliveryConfig: jsonb('delivery_config'),
  /*
    deliveryConfig: {
      email: { recipients: ["..."], subject: "Weekly Report" },
      slack: { channel: "#reports" }
    }
  */
});

export const dashboardAnnotations = pgTable('analytics_dashboard_annotations', {
  ...baseColumns,
  
  dashboardId: uuid('dashboard_id').references(() => dashboards.id).notNull(),
  widgetId: uuid('widget_id').references(() => dashboardWidgets.id),
  
  // Annotation details
  title: text('title').notNull(),
  description: text('description'),
  annotationType: text('annotation_type').default('note'), // note, event, milestone, alert
  
  // Timing
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  endTimestamp: timestamp('end_timestamp', { withTimezone: true }), // For range annotations
  
  // Display
  color: text('color'),
  icon: text('icon'),
  showOnChart: boolean('show_on_chart').default(true),
});
```

### Service Implementation

```typescript
// @mcv/analytics/dashboards/service.ts
import { db } from '@mcv/kernel';
import { eq, and, sql, or, isNull, desc } from 'drizzle-orm';
import { dashboards, dashboardWidgets, dashboardSnapshots } from './schema';
import { MCVError, ErrorCode } from '@mcv/kernel/errors';
import { getContext } from '@mcv/kernel/context';
import { metricsService } from '../metrics/service';
import { slugify } from '@mcv/kernel/utils';

export interface CreateDashboardInput {
  name: string;
  description?: string;
  visibility?: 'private' | 'team' | 'venture' | 'public';
  teamId?: string;
  theme?: string;
  layout?: Record<string, any>;
  refreshInterval?: number;
  dateRange?: Record<string, any>;
}

export interface CreateWidgetInput {
  dashboardId: string;
  title?: string;
  subtitle?: string;
  type: string;
  chartType?: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  dataSource: {
    type: 'metric' | 'query' | 'api';
    metricId?: string;
    query?: string;
    endpoint?: string;
    params?: Record<string, any>;
  };
  options?: Record<string, any>;
  filters?: Record<string, any>;
}

export interface DashboardWithData {
  dashboard: typeof dashboards.$inferSelect;
  widgets: Array<typeof dashboardWidgets.$inferSelect & { data: any }>;
}

export class DashboardService {
  
  /**
   * Create a new dashboard
   */
  async create(input: CreateDashboardInput) {
    const ctx = getContext();
    
    const slug = slugify(input.name);
    
    // Ensure unique slug
    const existing = await db.query.dashboards.findFirst({
      where: and(
        eq(dashboards.ventureId, ctx.venture.id),
        eq(dashboards.slug, slug)
      ),
    });
    
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;
    
    const [dashboard] = await db.insert(dashboards).values({
      ventureId: ctx.venture.id,
      name: input.name,
      slug: finalSlug,
      description: input.description,
      ownerId: ctx.user!.id,
      teamId: input.teamId,
      visibility: input.visibility as any ?? 'private',
      theme: input.theme ?? 'light',
      layout: input.layout ?? {
        columns: 12,
        rowHeight: 50,
        breakpoints: { lg: 1200, md: 996, sm: 768 },
      },
      refreshInterval: input.refreshInterval,
      dateRange: input.dateRange ?? {
        type: 'relative',
        value: 'last_7_days',
      },
      createdBy: ctx.user?.id,
    }).returning();
    
    return dashboard;
  }

  /**
   * Get dashboard with all widget data
   */
  async getWithData(
    dashboardId: string, 
    options?: { 
      startDate?: Date; 
      endDate?: Date;
      filters?: Record<string, any>;
    }
  ): Promise<DashboardWithData> {
    const ctx = getContext();
    
    const dashboard = await db.query.dashboards.findFirst({
      where: and(
        eq(dashboards.id, dashboardId),
        or(
          eq(dashboards.ventureId, ctx.venture.id),
          eq(dashboards.visibility, 'public')
        )
      ),
      with: {
        widgets: {
          where: eq(dashboardWidgets.isVisible, true),
          orderBy: dashboardWidgets.displayOrder,
        },
      },
    });
    
    if (!dashboard) {
      throw new MCVError('Dashboard not found', ErrorCode.NOT_FOUND);
    }
    
    // Check access
    await this.checkAccess(dashboard, ctx.user?.id);
    
    // Determine date range
    const dateRange = this.resolveDateRange(
      options?.startDate,
      options?.endDate,
      dashboard.dateRange
    );
    
    // Fetch data for each widget in parallel
    const widgetsWithData = await Promise.all(
      dashboard.widgets.map(async (widget) => {
        try {
          const data = await this.getWidgetData(widget, dateRange, options?.filters);
          return { ...widget, data };
        } catch (error) {
          return { ...widget, data: null, error: (error as Error).message };
        }
      })
    );
    
    // Update view count
    await db.update(dashboards)
      .set({
        viewCount: sql`view_count + 1`,
        lastViewedAt: new Date(),
      })
      .where(eq(dashboards.id, dashboardId));
    
    return {
      dashboard,
      widgets: widgetsWithData,
    };
  }

  /**
   * Add a widget to a dashboard
   */
  async addWidget(input: CreateWidgetInput) {
    const ctx = getContext();
    
    // Verify dashboard ownership
    const dashboard = await db.query.dashboards.findFirst({
      where: and(
        eq(dashboards.id, input.dashboardId),
        eq(dashboards.ventureId, ctx.venture.id),
        eq(dashboards.ownerId, ctx.user!.id)
      ),
    });
    
    if (!dashboard) {
      throw new MCVError('Dashboard not found or access denied', ErrorCode.NOT_FOUND);
    }
    
    const [widget] = await db.insert(dashboardWidgets).values({
      ventureId: ctx.venture.id,
      dashboardId: input.dashboardId,
      title: input.title,
      subtitle: input.subtitle,
      type: input.type as any,
      chartType: input.chartType as any,
      position: input.position,
      dataSource: input.dataSource,
      options: input.options,
      filters: input.filters,
      createdBy: ctx.user?.id,
    }).returning();
    
    return widget;
  }

  /**
   * Update widget positions (batch update for drag-and-drop)
   */
  async updateWidgetPositions(
    dashboardId: string, 
    positions: Array<{ widgetId: string; position: { x: number; y: number; w: number; h: number } }>
  ) {
    const ctx = getContext();
    
    // Verify dashboard ownership
    const dashboard = await db.query.dashboards.findFirst({
      where: and(
        eq(dashboards.id, dashboardId),
        eq(dashboards.ventureId, ctx.venture.id)
      ),
    });
    
    if (!dashboard) {
      throw new MCVError('Dashboard not found', ErrorCode.NOT_FOUND);
    }
    
    await this.checkEditAccess(dashboard, ctx.user!.id);
    
    // Batch update positions
    await Promise.all(positions.map(async ({ widgetId, position }) => {
      await db.update(dashboardWidgets)
        .set({ position, updatedAt: new Date() })
        .where(and(
          eq(dashboardWidgets.id, widgetId),
          eq(dashboardWidgets.dashboardId, dashboardId)
        ));
    }));
    
    return true;
  }

  /**
   * Duplicate a dashboard
   */
  async duplicate(dashboardId: string, newName?: string) {
    const ctx = getContext();
    
    const original = await db.query.dashboards.findFirst({
      where: and(
        eq(dashboards.id, dashboardId),
        eq(dashboards.ventureId, ctx.venture.id)
      ),
      with: { widgets: true },
    });
    
    if (!original) {
      throw new MCVError('Dashboard not found', ErrorCode.NOT_FOUND);
    }
    
    return db.transaction(async (tx) => {
      // Create new dashboard
      const [newDashboard] = await tx.insert(dashboards).values({
        ...original,
        id: undefined,
        name: newName ?? `${original.name} (Copy)`,
        slug: `${original.slug}-copy-${Date.now()}`,
        ownerId: ctx.user!.id,
        visibility: 'private',
        publicSlug: null,
        viewCount: 0,
        isDefault: false,
        createdAt: new Date(),
        createdBy: ctx.user?.id,
      }).returning();
      
      // Copy widgets
      if (original.widgets.length > 0) {
        await tx.insert(dashboardWidgets).values(
          original.widgets.map(w => ({
            ...w,
            id: undefined,
            dashboardId: newDashboard.id,
            createdAt: new Date(),
            createdBy: ctx.user?.id,
          }))
        );
      }
      
      return newDashboard;
    });
  }

  /**
   * Create a snapshot for scheduled delivery
   */
  async createSnapshot(dashboardId: string, options?: {
    name?: string;
    description?: string;
    scheduleConfig?: Record<string, any>;
    deliveryConfig?: Record<string, any>;
  }) {
    const ctx = getContext();
    
    const dashboardData = await this.getWithData(dashboardId);
    
    const [snapshot] = await db.insert(dashboardSnapshots).values({
      ventureId: ctx.venture.id,
      dashboardId,
      name: options?.name ?? `Snapshot ${new Date().toISOString()}`,
      description: options?.description,
      snapshotData: dashboardData,
      isScheduled: !!options?.scheduleConfig,
      scheduleConfig: options?.scheduleConfig,
      deliveryConfig: options?.deliveryConfig,
      createdBy: ctx.user?.id,
    }).returning();
    
    return snapshot;
  }

  /**
   * Share dashboard with users/teams
   */
  async share(dashboardId: string, shareWith: {
    userIds?: string[];
    teamIds?: string[];
    visibility?: 'private' | 'team' | 'venture' | 'public';
    password?: string;
  }) {
    const ctx = getContext();
    
    const dashboard = await db.query.dashboards.findFirst({
      where: and(
        eq(dashboards.id, dashboardId),
        eq(dashboards.ownerId, ctx.user!.id)
      ),
    });
    
    if (!dashboard) {
      throw new MCVError('Dashboard not found or access denied', ErrorCode.NOT_FOUND);
    }
    
    const updates: Partial<typeof dashboards.$inferInsert> = {};
    
    if (shareWith.visibility) {
      updates.visibility = shareWith.visibility as any;
    }
    
    if (shareWith.userIds || shareWith.teamIds) {
      updates.sharedWith = {
        users: shareWith.userIds ?? (dashboard.sharedWith as any)?.users ?? [],
        teams: shareWith.teamIds ?? (dashboard.sharedWith as any)?.teams ?? [],
      };
    }
    
    if (shareWith.visibility === 'public') {
      updates.publicSlug = dashboard.publicSlug ?? `${dashboard.slug}-${Date.now().toString(36)}`;
    }
    
    if (shareWith.password !== undefined) {
      updates.password = shareWith.password; // Should be hashed
    }
    
    const [updated] = await db.update(dashboards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dashboards.id, dashboardId))
      .returning();
    
    return updated;
  }

  private async getWidgetData(
    widget: typeof dashboardWidgets.$inferSelect,
    dateRange: { start: Date; end: Date },
    filters?: Record<string, any>
  ) {
    const dataSource = widget.dataSource as any;
    
    switch (dataSource.type) {
      case 'metric':
        return metricsService.queryMetric({
          metricId: dataSource.metricId,
          startDate: dateRange.start,
          endDate: dateRange.end,
          granularity: this.determineGranularity(dateRange.start, dateRange.end),
          dimensions: filters,
        });
      
      case 'query':
        // Execute custom SQL query (with safety checks)
        // TODO: Implement query execution
        return null;
      
      case 'api':
        // Fetch from external API
        // TODO: Implement API fetching
        return null;
      
      default:
        return null;
    }
  }

  private resolveDateRange(
    startDate?: Date,
    endDate?: Date,
    defaultRange?: any
  ): { start: Date; end: Date } {
    if (startDate && endDate) {
      return { start: startDate, end: endDate };
    }
    
    const now = new Date();
    
    if (defaultRange?.type === 'relative') {
      switch (defaultRange.value) {
        case 'today':
          return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date() };
        case 'yesterday':
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          return { 
            start: new Date(yesterday.setHours(0, 0, 0, 0)), 
            end: new Date(yesterday.setHours(23, 59, 59, 999)) 
          };
        case 'last_7_days':
          return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: new Date() };
        case 'last_30_days':
          return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: new Date() };
        case 'this_month':
          return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date() };
        case 'last_month':
          return { 
            start: new Date(now.getFullYear(), now.getMonth() - 1, 1), 
            end: new Date(now.getFullYear(), now.getMonth(), 0) 
          };
        case 'this_year':
          return { start: new Date(now.getFullYear(), 0, 1), end: new Date() };
        default:
          return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: new Date() };
      }
    }
    
    return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: new Date() };
  }

  private determineGranularity(start: Date, end: Date): 'minute' | 'hour' | 'day' | 'week' | 'month' {
    const diffDays = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    
    if (diffDays <= 1) return 'hour';
    if (diffDays <= 7) return 'hour';
    if (diffDays <= 90) return 'day';
    if (diffDays <= 365) return 'week';
    return 'month';
  }

  private async checkAccess(dashboard: any, userId?: string) {
    if (dashboard.visibility === 'public') return;
    if (dashboard.ownerId === userId) return;
    
    const ctx = getContext();
    if (dashboard.ventureId === ctx.venture.id) {
      if (dashboard.visibility === 'venture') return;
      if (dashboard.visibility === 'team' && dashboard.teamId) {
        // Check team membership
        // TODO: Implement team check
      }
    }
    
    const sharedWith = dashboard.sharedWith as any;
    if (sharedWith?.users?.includes(userId)) return;
    
    throw new MCVError('Access denied', ErrorCode.FORBIDDEN);
  }

  private async checkEditAccess(dashboard: any, userId: string) {
    if (dashboard.ownerId === userId) return;
    
    const sharedWith = dashboard.sharedWith as any;
    if (sharedWith?.editors?.includes(userId)) return;
    
    throw new MCVError('Edit access denied', ErrorCode.FORBIDDEN);
  }
}

export const dashboardService = new DashboardService();
```

---

## Module: funnels

### Purpose

Conversion funnel tracking and visualization with step-by-step analysis, drop-off detection, A/B test integration, and optimization recommendations.

### Database Schema

```typescript
// @mcv/analytics/funnels/schema.ts
import { pgTable, uuid, text, timestamp, pgEnum, boolean, integer, numeric, jsonb, index } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const funnelStatusEnum = pgEnum('funnel_status', [
  'draft', 'active', 'paused', 'archived'
]);

export const stepCompletionEnum = pgEnum('step_completion', [
  'any', 'all', 'ordered'
]);

export const funnels = pgTable('analytics_funnels', {
  ...baseColumns,
  
  // Identity
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  category: text('category'),
  
  // Configuration
  status: funnelStatusEnum('status').default('draft'),
  completionType: stepCompletionEnum('completion_type').default('ordered'),
  
  // Time constraints
  conversionWindow: integer('conversion_window_hours').default(168), // 7 days
  
  // Attribution
  attributionModel: text('attribution_model').default('first_touch'),
  
  // Ownership
  ownerId: uuid('owner_id'),
  teamId: uuid('team_id'),
  
  // Stats (cached)
  totalEntered: integer('total_entered').default(0),
  totalConverted: integer('total_converted').default(0),
  overallConversionRate: numeric('overall_conversion_rate', { precision: 10, scale: 4 }),
  avgTimeToConvert: integer('avg_time_to_convert_seconds'),
  
  // Last analyzed
  lastAnalyzedAt: timestamp('last_analyzed_at', { withTimezone: true }),
}, (table) => ({
  slugIdx: index('funnel_slug_idx').on(table.ventureId, table.slug),
}));

export const funnelSteps = pgTable('analytics_funnel_steps', {
  ...baseColumns,
  
  funnelId: uuid('funnel_id').references(() => funnels.id, { onDelete: 'cascade' }).notNull(),
  
  // Identity
  name: text('name').notNull(),
  description: text('description'),
  
  // Event definition
  eventType: text('event_type').notNull(),           // e.g., "page_view", "button_click"
  eventFilters: jsonb('event_filters'),
  /*
    eventFilters: {
      "page": { "eq": "/signup" },
      "button_id": { "in": ["cta-1", "cta-2"] }
    }
  */
  
  // Position
  stepOrder: integer('step_order').notNull(),
  isRequired: boolean('is_required').default(true),
  
  // Time constraint
  maxSecondsFromPrevious: integer('max_seconds_from_previous'),
  
  // Stats (cached)
  enteredCount: integer('entered_count').default(0),
  completedCount: integer('completed_count').default(0),
  conversionRate: numeric('conversion_rate', { precision: 10, scale: 4 }),
  dropOffRate: numeric('drop_off_rate', { precision: 10, scale: 4 }),
  avgTimeToComplete: integer('avg_time_to_complete_seconds'),
  
  // A/B Testing
  variants: jsonb('variants'),
  /*
    variants: [
      { id: "control", name: "Control", filters: {...} },
      { id: "variant_a", name: "New CTA", filters: {...} }
    ]
  */
});

export const funnelConversions = pgTable('analytics_funnel_conversions', {
  ...baseColumns,
  
  funnelId: uuid('funnel_id').references(() => funnels.id).notNull(),
  
  // User tracking
  userId: uuid('user_id'),
  anonymousId: text('anonymous_id'),
  sessionId: text('session_id'),
  
  // Journey
  enteredAt: timestamp('entered_at', { withTimezone: true }).notNull(),
  convertedAt: timestamp('converted_at', { withTimezone: true }),
  exitedAt: timestamp('exited_at', { withTimezone: true }),
  
  // Step progress
  currentStepOrder: integer('current_step_order').default(1),
  completedSteps: integer('completed_steps').array(),
  stepTimestamps: jsonb('step_timestamps'),           // { step_id: timestamp }
  
  // Status
  isConverted: boolean('is_converted').default(false),
  isAbandoned: boolean('is_abandoned').default(false),
  abandonedAtStep: integer('abandoned_at_step'),
  
  // Attribution
  source: text('source'),
  medium: text('medium'),
  campaign: text('campaign'),
  referrer: text('referrer'),
  
  // Context
  device: text('device'),
  browser: text('browser'),
  country: text('country'),
  
  // A/B test variant
  variantId: text('variant_id'),
  
  // Value (for revenue funnels)
  conversionValue: numeric('conversion_value', { precision: 19, scale: 4 }),
  
  // Custom properties
  properties: jsonb('properties'),
}, (table) => ({
  funnelIdx: index('funnel_conv_funnel_idx').on(table.funnelId, table.enteredAt),
  userIdx: index('funnel_conv_user_idx').on(table.userId, table.funnelId),
}));

export const funnelDropoffReasons = pgTable('analytics_funnel_dropoff_reasons', {
  ...baseColumns,
  
  funnelId: uuid('funnel_id').references(() => funnels.id).notNull(),
  stepId: uuid('step_id').references(() => funnelSteps.id).notNull(),
  
  // Reason analysis
  reason: text('reason').notNull(),
  category: text('category'),                         // ux, technical, pricing, etc.
  frequency: integer('frequency').default(0),
  percentage: numeric('percentage', { precision: 5, scale: 2 }),
  
  // AI-detected
  isAiDetected: boolean('is_ai_detected').default(false),
  confidence: numeric('confidence', { precision: 5, scale: 4 }),
  
  // Recommendations
  recommendations: jsonb('recommendations'),
});
```

### Service Implementation

```typescript
// @mcv/analytics/funnels/service.ts
import { db } from '@mcv/kernel';
import { eq, and, sql, gte, lte, desc, isNull, or } from 'drizzle-orm';
import { funnels, funnelSteps, funnelConversions, funnelDropoffReasons } from './schema';
import { MCVError, ErrorCode } from '@mcv/kernel/errors';
import { getContext } from '@mcv/kernel/context';

export interface CreateFunnelInput {
  name: string;
  description?: string;
  category?: string;
  completionType?: 'any' | 'all' | 'ordered';
  conversionWindow?: number;
  steps: Array<{
    name: string;
    description?: string;
    eventType: string;
    eventFilters?: Record<string, any>;
    isRequired?: boolean;
    maxSecondsFromPrevious?: number;
  }>;
}

export interface FunnelAnalysis {
  funnel: typeof funnels.$inferSelect;
  steps: Array<{
    step: typeof funnelSteps.$inferSelect;
    entered: number;
    completed: number;
    conversionRate: number;
    dropOffRate: number;
    avgTimeSeconds: number;
    byVariant?: Record<string, { entered: number; completed: number; conversionRate: number }>;
  }>;
  overall: {
    totalEntered: number;
    totalConverted: number;
    overallConversionRate: number;
    avgTimeToConvert: number;
    bottleneckStep: string;
    biggestDropoff: { step: string; rate: number };
  };
  trends: {
    daily: Array<{ date: string; entered: number; converted: number; rate: number }>;
  };
  segments: Record<string, { entered: number; converted: number; rate: number }>;
}

export class FunnelService {
  
  /**
   * Create a new funnel with steps
   */
  async create(input: CreateFunnelInput) {
    const ctx = getContext();
    
    return db.transaction(async (tx) => {
      // Create funnel
      const [funnel] = await tx.insert(funnels).values({
        ventureId: ctx.venture.id,
        name: input.name,
        slug: input.name.toLowerCase().replace(/\s+/g, '-'),
        description: input.description,
        category: input.category,
        completionType: input.completionType as any ?? 'ordered',
        conversionWindow: input.conversionWindow ?? 168,
        ownerId: ctx.user?.id,
        createdBy: ctx.user?.id,
      }).returning();
      
      // Create steps
      const steps = await Promise.all(
        input.steps.map(async (step, index) => {
          const [created] = await tx.insert(funnelSteps).values({
            ventureId: ctx.venture.id,
            funnelId: funnel.id,
            name: step.name,
            description: step.description,
            eventType: step.eventType,
            eventFilters: step.eventFilters,
            stepOrder: index + 1,
            isRequired: step.isRequired ?? true,
            maxSecondsFromPrevious: step.maxSecondsFromPrevious,
            createdBy: ctx.user?.id,
          }).returning();
          return created;
        })
      );
      
      return { funnel, steps };
    });
  }

  /**
   * Track a user entering or progressing through a funnel
   */
  async trackProgress(
    funnelId: string,
    eventType: string,
    eventProperties: Record<string, any>,
    userContext: {
      userId?: string;
      anonymousId?: string;
      sessionId?: string;
      source?: string;
      medium?: string;
      campaign?: string;
      device?: string;
      browser?: string;
      country?: string;
    }
  ) {
    const ctx = getContext();
    
    // Get funnel with steps
    const funnel = await db.query.funnels.findFirst({
      where: and(
        eq(funnels.id, funnelId),
        eq(funnels.ventureId, ctx.venture.id),
        eq(funnels.status, 'active')
      ),
      with: {
        steps: { orderBy: (s, { asc }) => asc(s.stepOrder) },
      },
    });
    
    if (!funnel) return null;
    
    // Find matching step
    const matchingStep = funnel.steps.find(step => {
      if (step.eventType !== eventType) return false;
      
      // Check event filters
      if (step.eventFilters) {
        return this.matchesFilters(eventProperties, step.eventFilters as any);
      }
      
      return true;
    });
    
    if (!matchingStep) return null;
    
    // Find or create conversion record
    const identifier = userContext.userId ?? userContext.anonymousId;
    if (!identifier) return null;
    
    let conversion = await db.query.funnelConversions.findFirst({
      where: and(
        eq(funnelConversions.funnelId, funnelId),
        or(
          userContext.userId ? eq(funnelConversions.userId, userContext.userId) : undefined,
          userContext.anonymousId ? eq(funnelConversions.anonymousId, userContext.anonymousId) : undefined
        ),
        eq(funnelConversions.isConverted, false),
        eq(funnelConversions.isAbandoned, false),
        // Within conversion window
        gte(funnelConversions.enteredAt, new Date(Date.now() - funnel.conversionWindow! * 60 * 60 * 1000))
      ),
    });
    
    const now = new Date();
    
    if (!conversion && matchingStep.stepOrder === 1) {
      // User entering funnel for the first time
      const [created] = await db.insert(funnelConversions).values({
        ventureId: ctx.venture.id,
        funnelId,
        userId: userContext.userId,
        anonymousId: userContext.anonymousId,
        sessionId: userContext.sessionId,
        enteredAt: now,
        currentStepOrder: 1,
        completedSteps: [matchingStep.id],
        stepTimestamps: { [matchingStep.id]: now.toISOString() },
        source: userContext.source,
        medium: userContext.medium,
        campaign: userContext.campaign,
        device: userContext.device,
        browser: userContext.browser,
        country: userContext.country,
        createdBy: ctx.user?.id,
      }).returning();
      
      // Update funnel stats
      await db.update(funnels)
        .set({ totalEntered: sql`total_entered + 1` })
        .where(eq(funnels.id, funnelId));
      
      // Update step stats
      await db.update(funnelSteps)
        .set({ enteredCount: sql`entered_count + 1`, completedCount: sql`completed_count + 1` })
        .where(eq(funnelSteps.id, matchingStep.id));
      
      return created;
    }
    
    if (conversion) {
      // Check if this is the next expected step (for ordered funnels)
      const completedSteps = conversion.completedSteps ?? [];
      
      if (funnel.completionType === 'ordered') {
        const expectedStepOrder = conversion.currentStepOrder! + 1;
        if (matchingStep.stepOrder !== expectedStepOrder) {
          // Out of order - for strict funnels, this would be ignored
          // For relaxed funnels, we might allow it
          return null;
        }
      }
      
      // Check time constraint
      if (matchingStep.maxSecondsFromPrevious) {
        const lastTimestamp = Object.values(conversion.stepTimestamps as Record<string, string>)
          .sort()
          .pop();
        if (lastTimestamp) {
          const elapsed = (now.getTime() - new Date(lastTimestamp).getTime()) / 1000;
          if (elapsed > matchingStep.maxSecondsFromPrevious) {
            // Time constraint violated
            return null;
          }
        }
      }
      
      // Update conversion progress
      const newCompletedSteps = [...completedSteps, matchingStep.id];
      const newStepTimestamps = {
        ...(conversion.stepTimestamps as Record<string, string>),
        [matchingStep.id]: now.toISOString(),
      };
      
      const isLastStep = matchingStep.stepOrder === funnel.steps.length;
      
      const [updated] = await db.update(funnelConversions)
        .set({
          currentStepOrder: matchingStep.stepOrder,
          completedSteps: newCompletedSteps,
          stepTimestamps: newStepTimestamps,
          isConverted: isLastStep,
          convertedAt: isLastStep ? now : undefined,
          updatedAt: now,
        })
        .where(eq(funnelConversions.id, conversion.id))
        .returning();
      
      // Update step stats
      await db.update(funnelSteps)
        .set({ 
          enteredCount: sql`entered_count + 1`, 
          completedCount: sql`completed_count + 1` 
        })
        .where(eq(funnelSteps.id, matchingStep.id));
      
      if (isLastStep) {
        // Update funnel conversion stats
        await db.update(funnels)
          .set({ totalConverted: sql`total_converted + 1` })
          .where(eq(funnels.id, funnelId));
      }
      
      return updated;
    }
    
    return null;
  }

  /**
   * Analyze funnel performance
   */
  async analyze(
    funnelId: string, 
    options: {
      startDate: Date;
      endDate: Date;
      segments?: string[];
      compareVariants?: boolean;
    }
  ): Promise<FunnelAnalysis> {
    const ctx = getContext();
    
    const funnel = await db.query.funnels.findFirst({
      where: and(
        eq(funnels.id, funnelId),
        eq(funnels.ventureId, ctx.venture.id)
      ),
      with: {
        steps: { orderBy: (s, { asc }) => asc(s.stepOrder) },
      },
    });
    
    if (!funnel) {
      throw new MCVError('Funnel not found', ErrorCode.NOT_FOUND);
    }
    
    // Get conversions in date range
    const conversions = await db.query.funnelConversions.findMany({
      where: and(
        eq(funnelConversions.funnelId, funnelId),
        gte(funnelConversions.enteredAt, options.startDate),
        lte(funnelConversions.enteredAt, options.endDate)
      ),
    });
    
    // Calculate step-by-step metrics
    const stepMetrics = funnel.steps.map(step => {
      const enteredThisStep = conversions.filter(c => {
        const steps = c.completedSteps as string[];
        return steps?.includes(step.id) || c.currentStepOrder! >= step.stepOrder;
      });
      
      const completedThisStep = conversions.filter(c => {
        const steps = c.completedSteps as string[];
        return steps?.includes(step.id);
      });
      
      const previousStep = funnel.steps.find(s => s.stepOrder === step.stepOrder - 1);
      const enteredPrevious = previousStep 
        ? conversions.filter(c => (c.completedSteps as string[])?.includes(previousStep.id)).length
        : conversions.length;
      
      const conversionRate = enteredPrevious > 0 
        ? (completedThisStep.length / enteredPrevious) * 100 
        : 0;
      
      const dropOffRate = 100 - conversionRate;
      
      // Calculate average time
      const times = completedThisStep.map(c => {
        const timestamps = c.stepTimestamps as Record<string, string>;
        const thisTime = timestamps[step.id];
        const prevTime = previousStep ? timestamps[previousStep.id] : c.enteredAt.toISOString();
        
        if (thisTime && prevTime) {
          return (new Date(thisTime).getTime() - new Date(prevTime).getTime()) / 1000;
        }
        return 0;
      }).filter(t => t > 0);
      
      const avgTimeSeconds = times.length > 0 
        ? times.reduce((a, b) => a + b, 0) / times.length 
        : 0;
      
      return {
        step,
        entered: enteredThisStep.length,
        completed: completedThisStep.length,
        conversionRate,
        dropOffRate,
        avgTimeSeconds,
      };
    });
    
    // Calculate overall metrics
    const totalEntered = conversions.length;
    const totalConverted = conversions.filter(c => c.isConverted).length;
    const overallConversionRate = totalEntered > 0 ? (totalConverted / totalEntered) * 100 : 0;
    
    // Find bottleneck (step with lowest conversion rate)
    const bottleneck = stepMetrics.reduce((min, curr) => 
      curr.conversionRate < min.conversionRate ? curr : min
    , stepMetrics[0]);
    
    // Find biggest dropoff
    const biggestDropoff = stepMetrics.reduce((max, curr) =>
      curr.dropOffRate > max.dropOffRate ? curr : max
    , stepMetrics[0]);
    
    // Calculate average time to convert
    const convertedConversions = conversions.filter(c => c.isConverted && c.convertedAt);
    const avgTimeToConvert = convertedConversions.length > 0
      ? convertedConversions.reduce((sum, c) => 
          sum + (c.convertedAt!.getTime() - c.enteredAt.getTime()) / 1000, 0
        ) / convertedConversions.length
      : 0;
    
    // Calculate daily trends
    const dailyTrends = this.calculateDailyTrends(conversions, options.startDate, options.endDate);
    
    // Calculate segments
    const segments = this.calculateSegments(conversions, options.segments ?? ['source', 'device', 'country']);
    
    // Update funnel with latest stats
    await db.update(funnels)
      .set({
        lastAnalyzedAt: new Date(),
        overallConversionRate: overallConversionRate.toString(),
        avgTimeToConvert: Math.round(avgTimeToConvert),
      })
      .where(eq(funnels.id, funnelId));
    
    return {
      funnel,
      steps: stepMetrics,
      overall: {
        totalEntered,
        totalConverted,
        overallConversionRate,
        avgTimeToConvert,
        bottleneckStep: bottleneck.step.name,
        biggestDropoff: { step: biggestDropoff.step.name, rate: biggestDropoff.dropOffRate },
      },
      trends: { daily: dailyTrends },
      segments,
    };
  }

  /**
   * Get drop-off analysis with AI-powered insights
   */
  async getDropoffAnalysis(funnelId: string, stepId: string) {
    const ctx = getContext();
    
    // Get users who dropped off at this step
    const dropoffs = await db.query.funnelConversions.findMany({
      where: and(
        eq(funnelConversions.funnelId, funnelId),
        eq(funnelConversions.abandonedAtStep, 
          db.select({ order: funnelSteps.stepOrder })
            .from(funnelSteps)
            .where(eq(funnelSteps.id, stepId))
            .limit(1)
        )
      ),
      limit: 1000,
    });
    
    // Analyze patterns
    const patterns = {
      bySource: this.groupAndCount(dropoffs, 'source'),
      byDevice: this.groupAndCount(dropoffs, 'device'),
      byCountry: this.groupAndCount(dropoffs, 'country'),
      byTimeOfDay: this.groupByTimeOfDay(dropoffs),
      avgTimeBeforeDropoff: this.calculateAvgTimeBeforeDropoff(dropoffs, stepId),
    };
    
    // Get or generate AI insights
    let reasons = await db.query.funnelDropoffReasons.findMany({
      where: and(
        eq(funnelDropoffReasons.funnelId, funnelId),
        eq(funnelDropoffReasons.stepId, stepId)
      ),
      orderBy: desc(funnelDropoffReasons.frequency),
    });
    
    if (reasons.length === 0) {
      // Generate AI-powered insights
      reasons = await this.generateDropoffInsights(funnelId, stepId, dropoffs, patterns);
    }
    
    return {
      totalDropoffs: dropoffs.length,
      patterns,
      reasons,
    };
  }

  private matchesFilters(properties: Record<string, any>, filters: Record<string, any>): boolean {
    for (const [key, condition] of Object.entries(filters)) {
      const value = properties[key];
      
      if (typeof condition === 'object') {
        if (condition.eq !== undefined && value !== condition.eq) return false;
        if (condition.in !== undefined && !condition.in.includes(value)) return false;
        if (condition.contains !== undefined && !String(value).includes(condition.contains)) return false;
        if (condition.gt !== undefined && value <= condition.gt) return false;
        if (condition.lt !== undefined && value >= condition.lt) return false;
      } else if (value !== condition) {
        return false;
      }
    }
    
    return true;
  }

  private calculateDailyTrends(
    conversions: any[],
    startDate: Date,
    endDate: Date
  ): Array<{ date: string; entered: number; converted: number; rate: number }> {
    const days = new Map<string, { entered: number; converted: number }>();
    
    // Initialize all days
    const current = new Date(startDate);
    while (current <= endDate) {
      days.set(current.toISOString().split('T')[0], { entered: 0, converted: 0 });
      current.setDate(current.getDate() + 1);
    }
    
    // Count conversions by day
    conversions.forEach(c => {
      const day = c.enteredAt.toISOString().split('T')[0];
      const data = days.get(day);
      if (data) {
        data.entered++;
        if (c.isConverted) data.converted++;
      }
    });
    
    return Array.from(days.entries()).map(([date, data]) => ({
      date,
      entered: data.entered,
      converted: data.converted,
      rate: data.entered > 0 ? (data.converted / data.entered) * 100 : 0,
    }));
  }

  private calculateSegments(
    conversions: any[],
    segmentKeys: string[]
  ): Record<string, { entered: number; converted: number; rate: number }> {
    const segments: Record<string, { entered: number; converted: number; rate: number }> = {};
    
    segmentKeys.forEach(key => {
      const grouped = new Map<string, { entered: number; converted: number }>();
      
      conversions.forEach(c => {
        const value = c[key] || 'unknown';
        const data = grouped.get(value) || { entered: 0, converted: 0 };
        data.entered++;
        if (c.isConverted) data.converted++;
        grouped.set(value, data);
      });
      
      grouped.forEach((data, value) => {
        segments[`${key}:${value}`] = {
          ...data,
          rate: data.entered > 0 ? (data.converted / data.entered) * 100 : 0,
        };
      });
    });
    
    return segments;
  }

  private groupAndCount(items: any[], key: string): Record<string, number> {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const value = item[key] || 'unknown';
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  }

  private groupByTimeOfDay(conversions: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    conversions.forEach(c => {
      const hour = c.enteredAt.getHours();
      const bucket = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      counts[bucket] = (counts[bucket] || 0) + 1;
    });
    return counts;
  }

  private calculateAvgTimeBeforeDropoff(conversions: any[], stepId: string): number {
    const times = conversions.map(c => {
      const timestamps = c.stepTimestamps as Record<string, string>;
      // Calculate time from entry to last recorded step
      if (timestamps && Object.keys(timestamps).length > 0) {
        const lastTime = Object.values(timestamps).sort().pop();
        if (lastTime) {
          return (new Date(lastTime).getTime() - c.enteredAt.getTime()) / 1000;
        }
      }
      return 0;
    }).filter(t => t > 0);
    
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  private async generateDropoffInsights(
    funnelId: string,
    stepId: string,
    dropoffs: any[],
    patterns: any
  ): Promise<any[]> {
    // TODO: Implement AI-powered insight generation
    // This would use the patterns to identify likely causes
    return [];
  }
}

export const funnelService = new FunnelService();
```

---

## Module: cohorts

### Purpose

User cohort analysis for retention tracking, behavioral segmentation, and lifetime value calculation.

### Database Schema

```typescript
// @mcv/analytics/cohorts/schema.ts
import { pgTable, uuid, text, timestamp, pgEnum, boolean, integer, numeric, jsonb, index } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const cohortTypeEnum = pgEnum('cohort_type', [
  'acquisition', 'behavioral', 'revenue', 'custom'
]);

export const cohortPeriodEnum = pgEnum('cohort_period', [
  'day', 'week', 'month', 'quarter', 'year'
]);

export const cohortDefinitions = pgTable('analytics_cohort_definitions', {
  ...baseColumns,
  
  // Identity
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  
  // Type
  type: cohortTypeEnum('type').notNull(),
  period: cohortPeriodEnum('period').default('month'),
  
  // Cohort criteria
  criteria: jsonb('criteria').notNull(),
  /*
    For acquisition cohorts:
    {
      event: "user.created",
      filters: { "source": { "in": ["organic", "referral"] } }
    }
    
    For behavioral cohorts:
    {
      event: "purchase.completed",
      within_days: 7,
      count: { "gte": 1 }
    }
  */
  
  // Retention tracking
  retentionEvent: text('retention_event').notNull(),   // e.g., "session.started", "purchase.completed"
  retentionFilters: jsonb('retention_filters'),
  
  // LTV calculation
  revenueEvent: text('revenue_event'),                 // e.g., "purchase.completed"
  revenueField: text('revenue_field'),                 // e.g., "amount"
  
  // Display
  color: text('color'),
  
  // Settings
  isActive: boolean('is_active').default(true),
  lookbackPeriods: integer('lookback_periods').default(12),
  
  // Cache
  lastComputedAt: timestamp('last_computed_at', { withTimezone: true }),
}, (table) => ({
  slugIdx: index('cohort_def_slug_idx').on(table.ventureId, table.slug),
}));

export const cohorts = pgTable('analytics_cohorts', {
  ...baseColumns,
  
  definitionId: uuid('definition_id').references(() => cohortDefinitions.id).notNull(),
  
  // Cohort period
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  periodLabel: text('period_label').notNull(),         // e.g., "Jan 2026", "Week 5 2026"
  
  // Size
  userCount: integer('user_count').default(0),
  
  // Metrics
  totalRevenue: numeric('total_revenue', { precision: 19, scale: 4 }).default('0'),
  avgRevenue: numeric('avg_revenue', { precision: 19, scale: 4 }).default('0'),
  medianRevenue: numeric('median_revenue', { precision: 19, scale: 4 }),
  
  // LTV
  ltv30: numeric('ltv_30', { precision: 19, scale: 4 }),
  ltv60: numeric('ltv_60', { precision: 19, scale: 4 }),
  ltv90: numeric('ltv_90', { precision: 19, scale: 4 }),
  ltv180: numeric('ltv_180', { precision: 19, scale: 4 }),
  ltv365: numeric('ltv_365', { precision: 19, scale: 4 }),
  
  // Churn
  churnedCount: integer('churned_count').default(0),
  churnRate: numeric('churn_rate', { precision: 5, scale: 2 }),
}, (table) => ({
  periodIdx: index('cohort_period_idx').on(table.definitionId, table.periodStart),
}));

export const cohortRetention = pgTable('analytics_cohort_retention', {
  ...baseColumns,
  
  cohortId: uuid('cohort_id').references(() => cohorts.id).notNull(),
  
  // Period offset (0 = cohort period, 1 = first period after, etc.)
  periodOffset: integer('period_offset').notNull(),
  periodLabel: text('period_label'),                   // e.g., "Week 1", "Month 2"
  
  // Retention metrics
  retainedCount: integer('retained_count').default(0),
  retentionRate: numeric('retention_rate', { precision: 5, scale: 2 }),
  
  // Activity metrics
  activeCount: integer('active_count').default(0),
  activityRate: numeric('activity_rate', { precision: 5, scale: 2 }),
  avgActionsPerUser: numeric('avg_actions_per_user', { precision: 10, scale: 2 }),
  
  // Revenue metrics
  revenue: numeric('revenue', { precision: 19, scale: 4 }).default('0'),
  payingUsers: integer('paying_users').default(0),
  arpu: numeric('arpu', { precision: 19, scale: 4 }),
}, (table) => ({
  cohortOffsetIdx: index('cohort_retention_idx').on(table.cohortId, table.periodOffset),
}));

export const cohortMembers = pgTable('analytics_cohort_members', {
  ...baseColumns,
  
  cohortId: uuid('cohort_id').references(() => cohorts.id).notNull(),
  userId: uuid('user_id').notNull(),
  
  // Entry data
  entryDate: timestamp('entry_date', { withTimezone: true }).notNull(),
  entryEvent: jsonb('entry_event'),
  
  // User state
  isActive: boolean('is_active').default(true),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  isChurned: boolean('is_churned').default(false),
  churnedAt: timestamp('churned_at', { withTimezone: true }),
  
  // Revenue
  totalRevenue: numeric('total_revenue', { precision: 19, scale: 4 }).default('0'),
  transactionCount: integer('transaction_count').default(0),
  
  // Segments
  segments: text('segments').array(),
}, (table) => ({
  userIdx: index('cohort_member_user_idx').on(table.userId),
}));
```

### Service Implementation

```typescript
// @mcv/analytics/cohorts/service.ts
import { db } from '@mcv/kernel';
import { eq, and, sql, gte, lte, desc, inArray } from 'drizzle-orm';
import { cohortDefinitions, cohorts, cohortRetention, cohortMembers } from './schema';
import { MCVError, ErrorCode } from '@mcv/kernel/errors';
import { getContext } from '@mcv/kernel/context';

export interface CreateCohortDefinitionInput {
  name: string;
  description?: string;
  type: 'acquisition' | 'behavioral' | 'revenue' | 'custom';
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  criteria: {
    event: string;
    filters?: Record<string, any>;
    within_days?: number;
    count?: { gte?: number; lte?: number };
  };
  retentionEvent: string;
  retentionFilters?: Record<string, any>;
  revenueEvent?: string;
  revenueField?: string;
  lookbackPeriods?: number;
}

export interface RetentionMatrix {
  cohorts: Array<{
    label: string;
    startDate: Date;
    size: number;
    retention: number[];   // Retention rate for each period
    revenue: number[];     // Revenue for each period
  }>;
  periods: string[];       // Period labels
  averageRetention: number[];  // Average across all cohorts
}

export interface CohortComparison {
  cohortA: { label: string; data: any };
  cohortB: { label: string; data: any };
  differences: {
    retentionDiff: number[];
    revenueDiff: number[];
    ltvDiff: number;
  };
  insights: string[];
}

export class CohortService {
  
  /**
   * Create a cohort definition
   */
  async createDefinition(input: CreateCohortDefinitionInput) {
    const ctx = getContext();
    
    const [definition] = await db.insert(cohortDefinitions).values({
      ventureId: ctx.venture.id,
      name: input.name,
      slug: input.name.toLowerCase().replace(/\s+/g, '-'),
      description: input.description,
      type: input.type as any,
      period: input.period as any ?? 'month',
      criteria: input.criteria,
      retentionEvent: input.retentionEvent,
      retentionFilters: input.retentionFilters,
      revenueEvent: input.revenueEvent,
      revenueField: input.revenueField,
      lookbackPeriods: input.lookbackPeriods ?? 12,
      createdBy: ctx.user?.id,
    }).returning();
    
    // Trigger initial computation
    await this.computeCohorts(definition.id);
    
    return definition;
  }

  /**
   * Compute/refresh cohort data
   */
  async computeCohorts(definitionId: string) {
    const ctx = getContext();
    
    const definition = await db.query.cohortDefinitions.findFirst({
      where: and(
        eq(cohortDefinitions.id, definitionId),
        eq(cohortDefinitions.ventureId, ctx.venture.id)
      ),
    });
    
    if (!definition) {
      throw new MCVError('Cohort definition not found', ErrorCode.NOT_FOUND);
    }
    
    const periods = this.generatePeriods(definition.period!, definition.lookbackPeriods!);
    
    for (const period of periods) {
      // Find users matching cohort criteria in this period
      const users = await this.findCohortUsers(definition, period);
      
      if (users.length === 0) continue;
      
      // Create or update cohort
      const [cohort] = await db.insert(cohorts).values({
        ventureId: ctx.venture.id,
        definitionId,
        periodStart: period.start,
        periodEnd: period.end,
        periodLabel: period.label,
        userCount: users.length,
        createdBy: ctx.user?.id,
      })
      .onConflictDoUpdate({
        target: [cohorts.definitionId, cohorts.periodStart],
        set: {
          userCount: users.length,
          updatedAt: new Date(),
        },
      })
      .returning();
      
      // Add cohort members
      await this.updateCohortMembers(cohort.id, users);
      
      // Compute retention for each subsequent period
      await this.computeRetention(cohort, definition, period);
      
      // Compute revenue metrics
      if (definition.revenueEvent) {
        await this.computeRevenue(cohort, definition);
      }
    }
    
    // Update last computed time
    await db.update(cohortDefinitions)
      .set({ lastComputedAt: new Date() })
      .where(eq(cohortDefinitions.id, definitionId));
  }

  /**
   * Get retention matrix for visualization
   */
  async getRetentionMatrix(
    definitionId: string,
    options?: { startDate?: Date; endDate?: Date; limit?: number }
  ): Promise<RetentionMatrix> {
    const ctx = getContext();
    
    const definition = await db.query.cohortDefinitions.findFirst({
      where: and(
        eq(cohortDefinitions.id, definitionId),
        eq(cohortDefinitions.ventureId, ctx.venture.id)
      ),
    });
    
    if (!definition) {
      throw new MCVError('Cohort definition not found', ErrorCode.NOT_FOUND);
    }
    
    // Get cohorts with retention data
    const cohortData = await db.query.cohorts.findMany({
      where: and(
        eq(cohorts.definitionId, definitionId),
        options?.startDate ? gte(cohorts.periodStart, options.startDate) : undefined,
        options?.endDate ? lte(cohorts.periodStart, options.endDate) : undefined
      ),
      with: {
        retention: {
          orderBy: (r, { asc }) => asc(r.periodOffset),
        },
      },
      orderBy: desc(cohorts.periodStart),
      limit: options?.limit ?? 12,
    });
    
    // Build matrix
    const maxPeriods = Math.max(...cohortData.map(c => c.retention.length));
    const periods = Array.from({ length: maxPeriods }, (_, i) => 
      this.getPeriodLabel(definition.period!, i)
    );
    
    const matrixCohorts = cohortData.reverse().map(c => ({
      label: c.periodLabel,
      startDate: c.periodStart,
      size: c.userCount!,
      retention: c.retention.map(r => Number(r.retentionRate ?? 0)),
      revenue: c.retention.map(r => Number(r.revenue ?? 0)),
    }));
    
    // Calculate average retention per period
    const averageRetention = periods.map((_, periodIdx) => {
      const values = matrixCohorts
        .map(c => c.retention[periodIdx])
        .filter(v => v !== undefined);
      
      return values.length > 0 
        ? values.reduce((a, b) => a + b, 0) / values.length 
        : 0;
    });
    
    return {
      cohorts: matrixCohorts,
      periods,
      averageRetention,
    };
  }

  /**
   * Calculate LTV by cohort
   */
  async calculateLTV(
    definitionId: string,
    options?: { days?: number[] }
  ) {
    const ctx = getContext();
    
    const ltvDays = options?.days ?? [30, 60, 90, 180, 365];
    
    const cohortData = await db.query.cohorts.findMany({
      where: eq(cohorts.definitionId, definitionId),
      with: {
        members: true,
      },
      orderBy: desc(cohorts.periodStart),
      limit: 12,
    });
    
    return Promise.all(cohortData.map(async (cohort) => {
      const ltvValues: Record<string, number> = {};
      
      for (const days of ltvDays) {
        const cutoffDate = new Date(cohort.periodStart.getTime() + days * 24 * 60 * 60 * 1000);
        
        // Sum revenue up to cutoff date
        const totalRevenue = cohort.members
          .filter(m => m.entryDate <= cutoffDate)
          .reduce((sum, m) => sum + Number(m.totalRevenue ?? 0), 0);
        
        ltvValues[`ltv_${days}`] = cohort.userCount! > 0 
          ? totalRevenue / cohort.userCount! 
          : 0;
      }
      
      return {
        cohort: cohort.periodLabel,
        size: cohort.userCount,
        ...ltvValues,
      };
    }));
  }

  /**
   * Compare two cohorts
   */
  async compareCohorts(
    cohortIdA: string, 
    cohortIdB: string
  ): Promise<CohortComparison> {
    const ctx = getContext();
    
    const [cohortA, cohortB] = await Promise.all([
      db.query.cohorts.findFirst({
        where: and(
          eq(cohorts.id, cohortIdA),
          eq(cohorts.ventureId, ctx.venture.id)
        ),
        with: { retention: true },
      }),
      db.query.cohorts.findFirst({
        where: and(
          eq(cohorts.id, cohortIdB),
          eq(cohorts.ventureId, ctx.venture.id)
        ),
        with: { retention: true },
      }),
    ]);
    
    if (!cohortA || !cohortB) {
      throw new MCVError('One or both cohorts not found', ErrorCode.NOT_FOUND);
    }
    
    const maxPeriods = Math.max(cohortA.retention.length, cohortB.retention.length);
    
    const retentionDiff = Array.from({ length: maxPeriods }, (_, i) => {
      const rateA = Number(cohortA.retention[i]?.retentionRate ?? 0);
      const rateB = Number(cohortB.retention[i]?.retentionRate ?? 0);
      return rateA - rateB;
    });
    
    const revenueDiff = Array.from({ length: maxPeriods }, (_, i) => {
      const revA = Number(cohortA.retention[i]?.revenue ?? 0);
      const revB = Number(cohortB.retention[i]?.revenue ?? 0);
      return revA - revB;
    });
    
    const ltvDiffA = Number(cohortA.ltv90 ?? 0);
    const ltvDiffB = Number(cohortB.ltv90 ?? 0);
    
    const insights = this.generateComparisonInsights(cohortA, cohortB, retentionDiff);
    
    return {
      cohortA: { label: cohortA.periodLabel, data: cohortA },
      cohortB: { label: cohortB.periodLabel, data: cohortB },
      differences: {
        retentionDiff,
        revenueDiff,
        ltvDiff: ltvDiffA - ltvDiffB,
      },
      insights,
    };
  }

  /**
   * Predict churn risk for cohort members
   */
  async predictChurnRisk(cohortId: string): Promise<Array<{
    userId: string;
    riskScore: number;
    riskFactors: string[];
    recommendations: string[];
  }>> {
    const ctx = getContext();
    
    const members = await db.query.cohortMembers.findMany({
      where: and(
        eq(cohortMembers.cohortId, cohortId),
        eq(cohortMembers.isChurned, false)
      ),
    });
    
    return Promise.all(members.map(async (member) => {
      // Calculate risk score based on activity patterns
      const daysSinceActive = member.lastActiveAt 
        ? (Date.now() - member.lastActiveAt.getTime()) / (24 * 60 * 60 * 1000)
        : 999;
      
      const riskFactors: string[] = [];
      let riskScore = 0;
      
      // Inactivity risk
      if (daysSinceActive > 30) {
        riskScore += 40;
        riskFactors.push('Inactive for over 30 days');
      } else if (daysSinceActive > 14) {
        riskScore += 20;
        riskFactors.push('Declining activity');
      }
      
      // Revenue risk
      if (Number(member.totalRevenue ?? 0) === 0) {
        riskScore += 30;
        riskFactors.push('No purchases');
      } else if (member.transactionCount! < 2) {
        riskScore += 15;
        riskFactors.push('Single purchase only');
      }
      
      // Engagement risk (based on segments)
      if (!(member.segments ?? []).includes('power_user')) {
        riskScore += 10;
      }
      
      const recommendations = this.getChurnRecommendations(riskFactors);
      
      return {
        userId: member.userId,
        riskScore: Math.min(100, riskScore),
        riskFactors,
        recommendations,
      };
    }));
  }

  private generatePeriods(
    period: string, 
    count: number
  ): Array<{ start: Date; end: Date; label: string }> {
    const periods: Array<{ start: Date; end: Date; label: string }> = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      let start: Date, end: Date, label: string;
      
      switch (period) {
        case 'day':
          start = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          start.setHours(0, 0, 0, 0);
          end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
          label = start.toISOString().split('T')[0];
          break;
        
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);
          start = weekStart;
          end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
          label = `Week ${Math.ceil((start.getMonth() * 30 + start.getDate()) / 7)} ${start.getFullYear()}`;
          break;
        
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth() - i, 1);
          end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
          label = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          break;
        
        case 'quarter':
          const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - i * 3, 1);
          start = qStart;
          end = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0, 23, 59, 59);
          label = `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
          break;
        
        default:
          start = new Date(now.getFullYear() - i, 0, 1);
          end = new Date(now.getFullYear() - i, 11, 31, 23, 59, 59);
          label = start.getFullYear().toString();
      }
      
      periods.push({ start, end, label });
    }
    
    return periods;
  }

  private async findCohortUsers(definition: any, period: any): Promise<string[]> {
    const ctx = getContext();
    
    // Query event store for users matching criteria
    // This would integrate with @mcv/events
    // TODO: Implement event query
    
    return [];
  }

  private async updateCohortMembers(cohortId: string, userIds: string[]) {
    const ctx = getContext();
    
    // Upsert cohort members
    for (const userId of userIds) {
      await db.insert(cohortMembers)
        .values({
          ventureId: ctx.venture.id,
          cohortId,
          userId,
          entryDate: new Date(),
          createdBy: ctx.user?.id,
        })
        .onConflictDoNothing();
    }
  }

  private async computeRetention(cohort: any, definition: any, period: any) {
    const ctx = getContext();
    
    const memberIds = await db.query.cohortMembers.findMany({
      where: eq(cohortMembers.cohortId, cohort.id),
      columns: { userId: true },
    });
    
    // For each subsequent period, check retention
    for (let offset = 0; offset < definition.lookbackPeriods; offset++) {
      const periodStart = this.addPeriod(period.end, definition.period, offset);
      const periodEnd = this.addPeriod(periodStart, definition.period, 1);
      
      if (periodEnd > new Date()) break;
      
      // Count users who performed retention event in this period
      // TODO: Query event store
      const retainedCount = 0;
      const retentionRate = cohort.userCount > 0 
        ? (retainedCount / cohort.userCount) * 100 
        : 0;
      
      await db.insert(cohortRetention)
        .values({
          ventureId: ctx.venture.id,
          cohortId: cohort.id,
          periodOffset: offset,
          periodLabel: this.getPeriodLabel(definition.period, offset),
          retainedCount,
          retentionRate: retentionRate.toString(),
          createdBy: ctx.user?.id,
        })
        .onConflictDoUpdate({
          target: [cohortRetention.cohortId, cohortRetention.periodOffset],
          set: {
            retainedCount,
            retentionRate: retentionRate.toString(),
            updatedAt: new Date(),
          },
        });
    }
  }

  private async computeRevenue(cohort: any, definition: any) {
    // Calculate LTV metrics
    // TODO: Implement revenue computation
  }

  private addPeriod(date: Date, period: string, count: number): Date {
    const result = new Date(date);
    
    switch (period) {
      case 'day':
        result.setDate(result.getDate() + count);
        break;
      case 'week':
        result.setDate(result.getDate() + count * 7);
        break;
      case 'month':
        result.setMonth(result.getMonth() + count);
        break;
      case 'quarter':
        result.setMonth(result.getMonth() + count * 3);
        break;
      case 'year':
        result.setFullYear(result.getFullYear() + count);
        break;
    }
    
    return result;
  }

  private getPeriodLabel(period: string, offset: number): string {
    switch (period) {
      case 'day': return `Day ${offset}`;
      case 'week': return `Week ${offset}`;
      case 'month': return `Month ${offset}`;
      case 'quarter': return `Quarter ${offset}`;
      case 'year': return `Year ${offset}`;
      default: return `Period ${offset}`;
    }
  }

  private generateComparisonInsights(cohortA: any, cohortB: any, retentionDiff: number[]): string[] {
    const insights: string[] = [];
    
    // Size comparison
    if (cohortA.userCount > cohortB.userCount * 1.2) {
      insights.push(`${cohortA.periodLabel} had ${Math.round((cohortA.userCount / cohortB.userCount - 1) * 100)}% more users`);
    }
    
    // Retention comparison
    const avgDiff = retentionDiff.reduce((a, b) => a + b, 0) / retentionDiff.length;
    if (avgDiff > 5) {
      insights.push(`${cohortA.periodLabel} shows ${avgDiff.toFixed(1)}% better average retention`);
    } else if (avgDiff < -5) {
      insights.push(`${cohortB.periodLabel} shows ${Math.abs(avgDiff).toFixed(1)}% better average retention`);
    }
    
    return insights;
  }

  private getChurnRecommendations(riskFactors: string[]): string[] {
    const recommendations: string[] = [];
    
    if (riskFactors.includes('Inactive for over 30 days')) {
      recommendations.push('Send re-engagement email campaign');
      recommendations.push('Offer discount or incentive');
    }
    
    if (riskFactors.includes('No purchases')) {
      recommendations.push('Highlight popular products');
      recommendations.push('Offer first-purchase discount');
    }
    
    if (riskFactors.includes('Single purchase only')) {
      recommendations.push('Send personalized product recommendations');
      recommendations.push('Create loyalty program incentive');
    }
    
    return recommendations;
  }
}

export const cohortService = new CohortService();
```

---

## Module: insights

### Purpose

AI-powered analytics insights including anomaly detection, trend analysis, automated recommendations, and predictive analytics.

### Database Schema

```typescript
// @mcv/analytics/insights/schema.ts
import { pgTable, uuid, text, timestamp, pgEnum, boolean, integer, numeric, jsonb, index } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const insightTypeEnum = pgEnum('insight_type', [
  'anomaly', 'trend', 'correlation', 'prediction', 
  'recommendation', 'alert', 'milestone', 'comparison'
]);

export const insightPriorityEnum = pgEnum('insight_priority', [
  'low', 'medium', 'high', 'critical'
]);

export const insightStatusEnum = pgEnum('insight_status', [
  'new', 'viewed', 'acknowledged', 'resolved', 'dismissed'
]);

export const insights = pgTable('analytics_insights', {
  ...baseColumns,
  
  // Type
  type: insightTypeEnum('type').notNull(),
  priority: insightPriorityEnum('priority').default('medium'),
  status: insightStatusEnum('status').default('new'),
  
  // Content
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  details: text('details'),
  
  // Related entities
  metricId: uuid('metric_id'),
  dashboardId: uuid('dashboard_id'),
  funnelId: uuid('funnel_id'),
  cohortId: uuid('cohort_id'),
  
  // Data
  data: jsonb('data'),
  /*
    For anomaly:
    {
      metric: "daily_revenue",
      expected: 50000,
      actual: 35000,
      deviation: -30,
      confidence: 0.95
    }
    
    For trend:
    {
      metric: "signups",
      direction: "up",
      percentChange: 25,
      period: "7d",
      projection: { next7d: 1500, next30d: 7000 }
    }
  */
  
  // AI confidence
  confidence: numeric('confidence', { precision: 5, scale: 4 }),
  modelVersion: text('model_version'),
  
  // Recommendations
  recommendations: jsonb('recommendations'),
  /*
    [
      { action: "Investigate traffic sources", priority: "high" },
      { action: "Check for technical issues", priority: "medium" }
    ]
  */
  
  // Impact estimation
  estimatedImpact: jsonb('estimated_impact'),
  /*
    {
      metric: "revenue",
      value: -15000,
      unit: "USD",
      timeframe: "weekly"
    }
  */
  
  // User interaction
  viewedAt: timestamp('viewed_at', { withTimezone: true }),
  viewedBy: uuid('viewed_by'),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  acknowledgedBy: uuid('acknowledged_by'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by'),
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
  dismissedBy: uuid('dismissed_by'),
  dismissReason: text('dismiss_reason'),
  
  // Feedback
  wasHelpful: boolean('was_helpful'),
  feedback: text('feedback'),
  
  // Scheduling
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isRecurring: boolean('is_recurring').default(false),
  recurringPattern: text('recurring_pattern'),
}, (table) => ({
  typeIdx: index('insight_type_idx').on(table.ventureId, table.type, table.status),
  priorityIdx: index('insight_priority_idx').on(table.ventureId, table.priority, table.status),
}));

export const insightRules = pgTable('analytics_insight_rules', {
  ...baseColumns,
  
  name: text('name').notNull(),
  description: text('description'),
  
  // Type of insight to generate
  insightType: insightTypeEnum('insight_type').notNull(),
  
  // Trigger conditions
  triggerConditions: jsonb('trigger_conditions').notNull(),
  /*
    {
      type: "metric_deviation",
      metric: "daily_revenue",
      threshold: { type: "percentage", value: 20 },
      window: "1d",
      minDataPoints: 30
    }
  */
  
  // Priority calculation
  priorityRules: jsonb('priority_rules'),
  /*
    {
      critical: { deviation: ">50" },
      high: { deviation: ">30" },
      medium: { deviation: ">20" }
    }
  */
  
  // Template for generated insight
  titleTemplate: text('title_template').notNull(),
  summaryTemplate: text('summary_template').notNull(),
  recommendationTemplates: jsonb('recommendation_templates'),
  
  // Settings
  isActive: boolean('is_active').default(true),
  cooldownMinutes: integer('cooldown_minutes').default(60),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
});

export const anomalyModels = pgTable('analytics_anomaly_models', {
  ...baseColumns,
  
  metricId: uuid('metric_id').notNull(),
  
  // Model type
  modelType: text('model_type').notNull(),  // prophet, isolation_forest, lstm
  
  // Model state
  modelState: jsonb('model_state'),          // Serialized model parameters
  
  // Training
  lastTrainedAt: timestamp('last_trained_at', { withTimezone: true }),
  trainingDataPoints: integer('training_data_points'),
  trainingPeriodDays: integer('training_period_days'),
  
  // Performance
  maeScore: numeric('mae_score', { precision: 10, scale: 6 }),
  rmseScore: numeric('rmse_score', { precision: 10, scale: 6 }),
  
  // Settings
  sensitivity: numeric('sensitivity', { precision: 3, scale: 2 }).default('0.95'),
  minConfidence: numeric('min_confidence', { precision: 3, scale: 2 }).default('0.80'),
});
```

### Service Implementation

```typescript
// @mcv/analytics/insights/service.ts
import { db } from '@mcv/kernel';
import { eq, and, sql, desc, or, isNull, gte, inArray } from 'drizzle-orm';
import { insights, insightRules, anomalyModels } from './schema';
import { metricValues, metricDefinitions } from '../metrics/schema';
import { MCVError, ErrorCode } from '@mcv/kernel/errors';
import { getContext } from '@mcv/kernel/context';
import { aiService } from '@mcv/ai';

export interface InsightFilters {
  types?: string[];
  priorities?: string[];
  status?: string;
  metricId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  actual: number;
  expected: number;
  deviation: number;
  confidence: number;
  direction: 'above' | 'below';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  strength: number;  // 0-1
  percentChange: number;
  projections: Array<{
    period: string;
    value: number;
    confidence: { low: number; high: number };
  }>;
  seasonality?: {
    detected: boolean;
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    strength: number;
  };
}

export class InsightsService {
  
  /**
   * Get insights feed for the venture
   */
  async getInsightsFeed(filters?: InsightFilters) {
    const ctx = getContext();
    
    const conditions = [
      eq(insights.ventureId, ctx.venture.id),
      or(isNull(insights.expiresAt), gte(insights.expiresAt, new Date())),
    ];
    
    if (filters?.types?.length) {
      conditions.push(inArray(insights.type, filters.types as any[]));
    }
    
    if (filters?.priorities?.length) {
      conditions.push(inArray(insights.priority, filters.priorities as any[]));
    }
    
    if (filters?.status) {
      conditions.push(eq(insights.status, filters.status as any));
    } else {
      conditions.push(inArray(insights.status, ['new', 'viewed', 'acknowledged']));
    }
    
    if (filters?.metricId) {
      conditions.push(eq(insights.metricId, filters.metricId));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(insights.createdAt, filters.startDate));
    }
    
    const results = await db.query.insights.findMany({
      where: and(...conditions),
      orderBy: [
        sql`CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
        desc(insights.createdAt),
      ],
      limit: filters?.limit ?? 50,
    });
    
    return results;
  }

  /**
   * Detect anomalies in a metric
   */
  async detectAnomalies(metricId: string): Promise<AnomalyDetectionResult | null> {
    const ctx = getContext();
    
    const metric = await db.query.metricDefinitions.findFirst({
      where: and(
        eq(metricDefinitions.id, metricId),
        eq(metricDefinitions.ventureId, ctx.venture.id)
      ),
    });
    
    if (!metric) {
      throw new MCVError('Metric not found', ErrorCode.NOT_FOUND);
    }
    
    // Get or create anomaly model
    let model = await db.query.anomalyModels.findFirst({
      where: eq(anomalyModels.metricId, metricId),
    });
    
    // Get recent data
    const now = new Date();
    const historicalStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const values = await db.query.metricValues.findMany({
      where: and(
        eq(metricValues.metricId, metricId),
        eq(metricValues.granularity, 'day'),
        gte(metricValues.timestamp, historicalStart)
      ),
      orderBy: metricValues.timestamp,
    });
    
    if (values.length < 30) {
      return null; // Not enough data
    }
    
    // Calculate statistics
    const nums = values.map(v => Number(v.value));
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const stdDev = Math.sqrt(
      nums.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / nums.length
    );
    
    // Get latest value
    const latestValue = nums[nums.length - 1];
    const zScore = (latestValue - mean) / stdDev;
    
    // Determine if anomaly (using simple z-score for now)
    // TODO: Use more sophisticated models (Prophet, Isolation Forest, etc.)
    const isAnomaly = Math.abs(zScore) > 2;
    
    if (!isAnomaly) {
      return null;
    }
    
    const deviation = ((latestValue - mean) / mean) * 100;
    const severity = Math.abs(zScore) > 4 ? 'critical' 
      : Math.abs(zScore) > 3 ? 'high'
      : Math.abs(zScore) > 2.5 ? 'medium'
      : 'low';
    
    // Generate insight
    const result: AnomalyDetectionResult = {
      isAnomaly: true,
      actual: latestValue,
      expected: mean,
      deviation,
      confidence: Math.min(0.99, 0.5 + Math.abs(zScore) / 10),
      direction: latestValue > mean ? 'above' : 'below',
      severity,
    };
    
    // Create insight record
    await this.createInsight({
      type: 'anomaly',
      priority: severity,
      title: `${deviation > 0 ? 'Spike' : 'Drop'} detected in ${metric.name}`,
      summary: `${metric.name} is ${Math.abs(deviation).toFixed(1)}% ${deviation > 0 ? 'above' : 'below'} expected value`,
      metricId,
      data: result,
      confidence: result.confidence,
      recommendations: this.generateAnomalyRecommendations(metric, result),
    });
    
    return result;
  }

  /**
   * Analyze trends in a metric
   */
  async analyzeTrends(metricId: string, days: number = 30): Promise<TrendAnalysis> {
    const ctx = getContext();
    
    const metric = await db.query.metricDefinitions.findFirst({
      where: and(
        eq(metricDefinitions.id, metricId),
        eq(metricDefinitions.ventureId, ctx.venture.id)
      ),
    });
    
    if (!metric) {
      throw new MCVError('Metric not found', ErrorCode.NOT_FOUND);
    }
    
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const values = await db.query.metricValues.findMany({
      where: and(
        eq(metricValues.metricId, metricId),
        eq(metricValues.granularity, 'day'),
        gte(metricValues.timestamp, startDate)
      ),
      orderBy: metricValues.timestamp,
    });
    
    if (values.length < 7) {
      return {
        direction: 'stable',
        strength: 0,
        percentChange: 0,
        projections: [],
      };
    }
    
    const nums = values.map(v => Number(v.value));
    
    // Linear regression for trend
    const n = nums.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    nums.forEach((y, x) => {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R² for confidence
    const yMean = sumY / n;
    let ssTotal = 0, ssResidual = 0;
    
    nums.forEach((y, x) => {
      const predicted = slope * x + intercept;
      ssTotal += Math.pow(y - yMean, 2);
      ssResidual += Math.pow(y - predicted, 2);
    });
    
    const r2 = 1 - (ssResidual / ssTotal);
    
    // Calculate percent change
    const firstWeekAvg = nums.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
    const lastWeekAvg = nums.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const percentChange = firstWeekAvg !== 0 
      ? ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100 
      : 0;
    
    // Determine direction and strength
    const normalizedSlope = yMean !== 0 ? slope / yMean : 0;
    const direction: 'up' | 'down' | 'stable' = 
      normalizedSlope > 0.01 ? 'up' : 
      normalizedSlope < -0.01 ? 'down' : 
      'stable';
    
    // Generate projections
    const projections = [7, 14, 30].map(daysAhead => {
      const projectedValue = slope * (n + daysAhead) + intercept;
      const stdError = Math.sqrt(ssResidual / (n - 2));
      
      return {
        period: `${daysAhead}d`,
        value: Math.max(0, projectedValue),
        confidence: {
          low: Math.max(0, projectedValue - 1.96 * stdError),
          high: projectedValue + 1.96 * stdError,
        },
      };
    });
    
    // Detect seasonality (simplified weekly pattern detection)
    const weeklyPattern = this.detectWeeklySeasonality(values);
    
    return {
      direction,
      strength: Math.abs(r2),
      percentChange,
      projections,
      seasonality: weeklyPattern,
    };
  }

  /**
   * Find correlations between metrics
   */
  async findCorrelations(metricId: string): Promise<Array<{
    metricId: string;
    metricName: string;
    correlation: number;
    lag: number;
    relationship: 'positive' | 'negative';
  }>> {
    const ctx = getContext();
    
    // Get all metrics for the venture
    const allMetrics = await db.query.metricDefinitions.findMany({
      where: and(
        eq(metricDefinitions.ventureId, ctx.venture.id),
        eq(metricDefinitions.isActive, true)
      ),
    });
    
    const sourceValues = await this.getMetricTimeSeries(metricId, 90);
    if (sourceValues.length < 30) return [];
    
    const correlations: Array<{
      metricId: string;
      metricName: string;
      correlation: number;
      lag: number;
      relationship: 'positive' | 'negative';
    }> = [];
    
    for (const metric of allMetrics) {
      if (metric.id === metricId) continue;
      
      const targetValues = await this.getMetricTimeSeries(metric.id, 90);
      if (targetValues.length < 30) continue;
      
      // Calculate correlation with different lags
      for (const lag of [0, 1, 3, 7]) {
        const corr = this.pearsonCorrelation(sourceValues, targetValues, lag);
        
        if (Math.abs(corr) > 0.5) {
          correlations.push({
            metricId: metric.id,
            metricName: metric.name,
            correlation: corr,
            lag,
            relationship: corr > 0 ? 'positive' : 'negative',
          });
          break; // Use strongest lag
        }
      }
    }
    
    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  /**
   * Create a new insight
   */
  async createInsight(input: {
    type: string;
    priority: string;
    title: string;
    summary: string;
    metricId?: string;
    dashboardId?: string;
    funnelId?: string;
    cohortId?: string;
    data?: any;
    confidence?: number;
    recommendations?: any[];
    estimatedImpact?: any;
  }) {
    const ctx = getContext();
    
    const [insight] = await db.insert(insights).values({
      ventureId: ctx.venture.id,
      type: input.type as any,
      priority: input.priority as any,
      title: input.title,
      summary: input.summary,
      metricId: input.metricId,
      dashboardId: input.dashboardId,
      funnelId: input.funnelId,
      cohortId: input.cohortId,
      data: input.data,
      confidence: input.confidence?.toString(),
      recommendations: input.recommendations,
      estimatedImpact: input.estimatedImpact,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdBy: ctx.user?.id,
    }).returning();
    
    return insight;
  }

  /**
   * Mark insight as viewed/acknowledged/resolved
   */
  async updateInsightStatus(
    insightId: string, 
    status: 'viewed' | 'acknowledged' | 'resolved' | 'dismissed',
    feedback?: { wasHelpful?: boolean; reason?: string }
  ) {
    const ctx = getContext();
    
    const updates: any = {
      status,
      updatedAt: new Date(),
    };
    
    switch (status) {
      case 'viewed':
        updates.viewedAt = new Date();
        updates.viewedBy = ctx.user?.id;
        break;
      case 'acknowledged':
        updates.acknowledgedAt = new Date();
        updates.acknowledgedBy = ctx.user?.id;
        break;
      case 'resolved':
        updates.resolvedAt = new Date();
        updates.resolvedBy = ctx.user?.id;
        break;
      case 'dismissed':
        updates.dismissedAt = new Date();
        updates.dismissedBy = ctx.user?.id;
        updates.dismissReason = feedback?.reason;
        break;
    }
    
    if (feedback?.wasHelpful !== undefined) {
      updates.wasHelpful = feedback.wasHelpful;
    }
    
    const [updated] = await db.update(insights)
      .set(updates)
      .where(and(
        eq(insights.id, insightId),
        eq(insights.ventureId, ctx.venture.id)
      ))
      .returning();
    
    return updated;
  }

  /**
   * Run scheduled insight generation
   */
  async runScheduledAnalysis() {
    const ctx = getContext();
    
    // Get all active metrics
    const metrics = await db.query.metricDefinitions.findMany({
      where: and(
        eq(metricDefinitions.ventureId, ctx.venture.id),
        eq(metricDefinitions.isActive, true)
      ),
    });
    
    const results = {
      anomalies: 0,
      trends: 0,
      correlations: 0,
    };
    
    for (const metric of metrics) {
      // Check for anomalies
      const anomaly = await this.detectAnomalies(metric.id);
      if (anomaly) results.anomalies++;
      
      // Analyze trends
      const trend = await this.analyzeTrends(metric.id);
      if (trend.direction !== 'stable' && trend.strength > 0.7) {
        await this.createInsight({
          type: 'trend',
          priority: trend.strength > 0.9 ? 'high' : 'medium',
          title: `${metric.name} is trending ${trend.direction}`,
          summary: `${metric.name} has ${trend.direction === 'up' ? 'increased' : 'decreased'} by ${Math.abs(trend.percentChange).toFixed(1)}% over the last 30 days`,
          metricId: metric.id,
          data: trend,
          confidence: trend.strength,
        });
        results.trends++;
      }
    }
    
    return results;
  }

  private async getMetricTimeSeries(metricId: string, days: number): Promise<number[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const values = await db.query.metricValues.findMany({
      where: and(
        eq(metricValues.metricId, metricId),
        eq(metricValues.granularity, 'day'),
        gte(metricValues.timestamp, startDate)
      ),
      orderBy: metricValues.timestamp,
    });
    
    return values.map(v => Number(v.value));
  }

  private pearsonCorrelation(x: number[], y: number[], lag: number = 0): number {
    const n = Math.min(x.length, y.length - lag);
    if (n < 10) return 0;
    
    const xSlice = x.slice(0, n);
    const ySlice = y.slice(lag, lag + n);
    
    const xMean = xSlice.reduce((a, b) => a + b, 0) / n;
    const yMean = ySlice.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let xVar = 0;
    let yVar = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = xSlice[i] - xMean;
      const yDiff = ySlice[i] - yMean;
      numerator += xDiff * yDiff;
      xVar += xDiff * xDiff;
      yVar += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(xVar * yVar);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private detectWeeklySeasonality(values: any[]): {
    detected: boolean;
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    strength: number;
  } | undefined {
    if (values.length < 28) return undefined;
    
    // Simple check: compare variance on each day of week
    const byDayOfWeek: number[][] = [[], [], [], [], [], [], []];
    
    values.forEach(v => {
      const day = v.timestamp.getDay();
      byDayOfWeek[day].push(Number(v.value));
    });
    
    const dayAverages = byDayOfWeek.map(days => 
      days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : 0
    );
    
    const overallMean = dayAverages.reduce((a, b) => a + b, 0) / 7;
    const variance = dayAverages.reduce((v, avg) => v + Math.pow(avg - overallMean, 2), 0) / 7;
    const coeffOfVar = Math.sqrt(variance) / overallMean;
    
    return {
      detected: coeffOfVar > 0.1,
      pattern: 'weekly',
      strength: Math.min(1, coeffOfVar * 2),
    };
  }

  private generateAnomalyRecommendations(metric: any, result: AnomalyDetectionResult): any[] {
    const recommendations = [];
    
    if (result.direction === 'below') {
      recommendations.push({
        action: 'Investigate potential issues causing the drop',
        priority: 'high',
      });
      recommendations.push({
        action: 'Check for technical problems or service disruptions',
        priority: 'medium',
      });
    } else {
      recommendations.push({
        action: 'Identify the source of the increase',
        priority: 'medium',
      });
      recommendations.push({
        action: 'Verify data quality and rule out anomalies',
        priority: 'medium',
      });
    }
    
    recommendations.push({
      action: `Set up an alert for ${metric.name} threshold`,
      priority: 'low',
    });
    
    return recommendations;
  }
}

export const insightsService = new InsightsService();
```

---

## Module: reports

### Purpose

Scheduled and ad-hoc report generation with multiple export formats, email delivery, and custom templates.

### Database Schema

```typescript
// @mcv/analytics/reports/schema.ts
import { pgTable, uuid, text, timestamp, pgEnum, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { baseColumns } from '@mcv/kernel/db';

export const reportTypeEnum = pgEnum('report_type', [
  'dashboard_snapshot', 'metric_summary', 'funnel_analysis',
  'cohort_analysis', 'custom_query', 'executive_summary'
]);

export const reportFormatEnum = pgEnum('report_format', [
  'pdf', 'excel', 'csv', 'html', 'json'
]);

export const reportFrequencyEnum = pgEnum('report_frequency', [
  'once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'
]);

export const reportTemplates = pgTable('analytics_report_templates', {
  ...baseColumns,
  
  // Identity
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  
  // Type
  type: reportTypeEnum('type').notNull(),
  
  // Content configuration
  config: jsonb('config').notNull(),
  /*
    For dashboard_snapshot:
    {
      dashboardId: "uuid",
      dateRange: { type: "relative", value: "last_7_days" },
      includeCharts: true,
      includeData: true
    }
    
    For metric_summary:
    {
      metricIds: ["uuid1", "uuid2"],
      comparison: { enabled: true, type: "previous_period" },
      groupBy: ["day"],
      includeSparklines: true
    }
    
    For custom_query:
    {
      queries: [
        { name: "Active Users", query: "SELECT ..." },
        { name: "Revenue", query: "SELECT ..." }
      ],
      visualizations: [...]
    }
  */
  
  // Layout
  layout: jsonb('layout'),
  /*
    {
      orientation: "portrait",
      pageSize: "A4",
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      header: { logo: true, title: true, dateRange: true },
      footer: { pageNumbers: true, generatedAt: true }
    }
  */
  
  // Branding
  branding: jsonb('branding'),
  /*
    {
      logo: "https://...",
      primaryColor: "#4f46e5",
      fontFamily: "Inter"
    }
  */
  
  // Default formats
  defaultFormats: text('default_formats').array().default(['pdf']),
  
  // Ownership
  ownerId: uuid('owner_id'),
  isSystem: boolean('is_system').default(false),
  isPublic: boolean('is_public').default(false),
}, (table) => ({
  slugIdx: index('report_template_slug_idx').on(table.ventureId, table.slug),
}));

export const reportSchedules = pgTable('analytics_report_schedules', {
  ...baseColumns,
  
  templateId: uuid('template_id').references(() => reportTemplates.id).notNull(),
  
  // Name for this schedule
  name: text('name').notNull(),
  
  // Schedule
  frequency: reportFrequencyEnum('frequency').notNull(),
  scheduleConfig: jsonb('schedule_config').notNull(),
  /*
    {
      dayOfWeek: 1,  // Monday
      dayOfMonth: 1,
      hour: 9,
      minute: 0,
      timezone: "America/New_York"
    }
  */
  
  // Date range for the report
  dateRangeConfig: jsonb('date_range_config'),
  /*
    {
      type: "previous_period",  // Report on previous week/month
      // OR
      type: "rolling",
      days: 30
    }
  */
  
  // Output formats
  formats: text('formats').array().default(['pdf']),
  
  // Delivery
  delivery: jsonb('delivery').notNull(),
  /*
    {
      email: {
        recipients: ["team@example.com"],
        subject: "Weekly Analytics Report",
        body: "Please find attached...",
        attachReport: true
      },
      slack: {
        channel: "#reports",
        message: "Weekly report is ready"
      },
      storage: {
        enabled: true,
        path: "/reports/{year}/{month}/"
      }
    }
  */
  
  // State
  isActive: boolean('is_active').default(true),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  lastRunStatus: text('last_run_status'),
  lastRunError: text('last_run_error'),
  consecutiveFailures: integer('consecutive_failures').default(0),
});

export const generatedReports = pgTable('analytics_generated_reports', {
  ...baseColumns,
  
  templateId: uuid('template_id').references(() => reportTemplates.id),
  scheduleId: uuid('schedule_id').references(() => reportSchedules.id),
  
  // Report info
  name: text('name').notNull(),
  description: text('description'),
  
  // Date range covered
  dateRangeStart: timestamp('date_range_start', { withTimezone: true }),
  dateRangeEnd: timestamp('date_range_end', { withTimezone: true }),
  
  // Generation
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow(),
  generatedBy: uuid('generated_by'),
  generationTimeMs: integer('generation_time_ms'),
  
  // Output
  format: reportFormatEnum('format').notNull(),
  fileUrl: text('file_url'),
  fileSize: integer('file_size'),
  
  // Data snapshot (for regeneration)
  dataSnapshot: jsonb('data_snapshot'),
  
  // Status
  status: text('status').default('generated'),  // generated, delivered, failed, expired
  
  // Delivery tracking
  deliveryStatus: jsonb('delivery_status'),
  /*
    {
      email: { sent: true, sentAt: "...", recipients: [...] },
      slack: { sent: true, sentAt: "..." }
    }
  */
  
  // Expiration
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
  templateIdx: index('generated_report_template_idx').on(table.templateId, table.generatedAt),
  scheduleIdx: index('generated_report_schedule_idx').on(table.scheduleId, table.generatedAt),
}));
```

### Service Implementation

```typescript
// @mcv/analytics/reports/service.ts
import { db } from '@mcv/kernel';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { reportTemplates, reportSchedules, generatedReports } from './schema';
import { MCVError, ErrorCode } from '@mcv/kernel/errors';
import { getContext } from '@mcv/kernel/context';
import { dashboardService } from '../dashboards/service';
import { metricsService } from '../metrics/service';
import { storageService } from '@mcv/storage';
import { emailService } from '@mcv/comms';

export interface CreateReportTemplateInput {
  name: string;
  description?: string;
  type: string;
  config: Record<string, any>;
  layout?: Record<string, any>;
  branding?: Record<string, any>;
  defaultFormats?: string[];
}

export interface GenerateReportInput {
  templateId: string;
  dateRange?: { start: Date; end: Date };
  formats?: string[];
  parameters?: Record<string, any>;
}

export interface ScheduleReportInput {
  templateId: string;
  name: string;
  frequency: string;
  scheduleConfig: {
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour: number;
    minute?: number;
    timezone: string;
  };
  dateRangeConfig?: Record<string, any>;
  formats?: string[];
  delivery: {
    email?: {
      recipients: string[];
      subject: string;
      body?: string;
    };
    slack?: {
      channel: string;
      message?: string;
    };
    storage?: {
      enabled: boolean;
      path?: string;
    };
  };
}

export class ReportService {
  
  /**
   * Create a report template
   */
  async createTemplate(input: CreateReportTemplateInput) {
    const ctx = getContext();
    
    const [template] = await db.insert(reportTemplates).values({
      ventureId: ctx.venture.id,
      name: input.name,
      slug: input.name.toLowerCase().replace(/\s+/g, '-'),
      description: input.description,
      type: input.type as any,
      config: input.config,
      layout: input.layout ?? {
        orientation: 'portrait',
        pageSize: 'A4',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
      },
      branding: input.branding,
      defaultFormats: input.defaultFormats ?? ['pdf'],
      ownerId: ctx.user?.id,
      createdBy: ctx.user?.id,
    }).returning();
    
    return template;
  }

  /**
   * Generate a report from a template
   */
  async generateReport(input: GenerateReportInput) {
    const ctx = getContext();
    
    const template = await db.query.reportTemplates.findFirst({
      where: and(
        eq(reportTemplates.id, input.templateId),
        eq(reportTemplates.ventureId, ctx.venture.id)
      ),
    });
    
    if (!template) {
      throw new MCVError('Report template not found', ErrorCode.NOT_FOUND);
    }
    
    const startTime = Date.now();
    const dateRange = input.dateRange ?? this.getDefaultDateRange(template.config as any);
    const formats = input.formats ?? template.defaultFormats ?? ['pdf'];
    
    // Gather data based on report type
    const data = await this.gatherReportData(template, dateRange, input.parameters);
    
    // Generate each format
    const generatedFiles: Array<{ format: string; url: string; size: number }> = [];
    
    for (const format of formats) {
      const file = await this.renderReport(template, data, format as any, dateRange);
      generatedFiles.push(file);
    }
    
    // Store report records
    const reports = await Promise.all(generatedFiles.map(async (file) => {
      const [report] = await db.insert(generatedReports).values({
        ventureId: ctx.venture.id,
        templateId: template.id,
        name: `${template.name} - ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`,
        dateRangeStart: dateRange.start,
        dateRangeEnd: dateRange.end,
        generatedBy: ctx.user?.id,
        generationTimeMs: Date.now() - startTime,
        format: file.format as any,
        fileUrl: file.url,
        fileSize: file.size,
        dataSnapshot: data,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        createdBy: ctx.user?.id,
      }).returning();
      
      return report;
    }));
    
    return reports;
  }

  /**
   * Schedule a recurring report
   */
  async scheduleReport(input: ScheduleReportInput) {
    const ctx = getContext();
    
    const template = await db.query.reportTemplates.findFirst({
      where: and(
        eq(reportTemplates.id, input.templateId),
        eq(reportTemplates.ventureId, ctx.venture.id)
      ),
    });
    
    if (!template) {
      throw new MCVError('Report template not found', ErrorCode.NOT_FOUND);
    }
    
    const nextRunAt = this.calculateNextRun(input.frequency, input.scheduleConfig);
    
    const [schedule] = await db.insert(reportSchedules).values({
      ventureId: ctx.venture.id,
      templateId: input.templateId,
      name: input.name,
      frequency: input.frequency as any,
      scheduleConfig: input.scheduleConfig,
      dateRangeConfig: input.dateRangeConfig,
      formats: input.formats ?? template.defaultFormats ?? ['pdf'],
      delivery: input.delivery,
      nextRunAt,
      createdBy: ctx.user?.id,
    }).returning();
    
    return schedule;
  }

  /**
   * Run a scheduled report
   */
  async runScheduledReport(scheduleId: string) {
    const ctx = getContext();
    
    const schedule = await db.query.reportSchedules.findFirst({
      where: eq(reportSchedules.id, scheduleId),
      with: { template: true },
    });
    
    if (!schedule) {
      throw new MCVError('Report schedule not found', ErrorCode.NOT_FOUND);
    }
    
    try {
      // Calculate date range based on config
      const dateRange = this.calculateDateRange(
        schedule.frequency, 
        schedule.dateRangeConfig as any
      );
      
      // Generate report
      const reports = await this.generateReport({
        templateId: schedule.templateId,
        dateRange,
        formats: schedule.formats ?? ['pdf'],
      });
      
      // Deliver report
      await this.deliverReports(reports, schedule.delivery as any);
      
      // Update schedule
      const nextRunAt = this.calculateNextRun(
        schedule.frequency, 
        schedule.scheduleConfig as any
      );
      
      await db.update(reportSchedules)
        .set({
          lastRunAt: new Date(),
          nextRunAt,
          lastRunStatus: 'success',
          lastRunError: null,
          consecutiveFailures: 0,
          updatedAt: new Date(),
        })
        .where(eq(reportSchedules.id, scheduleId));
      
      return reports;
    } catch (error) {
      // Update schedule with error
      await db.update(reportSchedules)
        .set({
          lastRunAt: new Date(),
          lastRunStatus: 'failed',
          lastRunError: (error as Error).message,
          consecutiveFailures: sql`consecutive_failures + 1`,
          updatedAt: new Date(),
        })
        .where(eq(reportSchedules.id, scheduleId));
      
      throw error;
    }
  }

  /**
   * Get report history
   */
  async getReportHistory(options?: {
    templateId?: string;
    scheduleId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const ctx = getContext();
    
    const conditions = [eq(generatedReports.ventureId, ctx.venture.id)];
    
    if (options?.templateId) {
      conditions.push(eq(generatedReports.templateId, options.templateId));
    }
    
    if (options?.scheduleId) {
      conditions.push(eq(generatedReports.scheduleId, options.scheduleId));
    }
    
    if (options?.startDate) {
      conditions.push(gte(generatedReports.generatedAt, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(generatedReports.generatedAt, options.endDate));
    }
    
    return db.query.generatedReports.findMany({
      where: and(...conditions),
      with: { template: true },
      orderBy: desc(generatedReports.generatedAt),
      limit: options?.limit ?? 50,
    });
  }

  private async gatherReportData(
    template: any,
    dateRange: { start: Date; end: Date },
    parameters?: Record<string, any>
  ) {
    const config = template.config as any;
    
    switch (template.type) {
      case 'dashboard_snapshot':
        return dashboardService.getWithData(config.dashboardId, {
          startDate: dateRange.start,
          endDate: dateRange.end,
        });
      
      case 'metric_summary':
        return Promise.all(config.metricIds.map(async (metricId: string) => {
          return metricsService.queryMetric({
            metricId,
            startDate: dateRange.start,
            endDate: dateRange.end,
            granularity: config.groupBy?.[0] ?? 'day',
          });
        }));
      
      case 'custom_query':
        // Execute custom queries
        // TODO: Implement safe query execution
        return [];
      
      default:
        return {};
    }
  }

  private async renderReport(
    template: any,
    data: any,
    format: 'pdf' | 'excel' | 'csv' | 'html' | 'json',
    dateRange: { start: Date; end: Date }
  ): Promise<{ format: string; url: string; size: number }> {
    const ctx = getContext();
    const layout = template.layout as any;
    const branding = template.branding as any;
    
    let content: Buffer;
    let mimeType: string;
    let extension: string;
    
    switch (format) {
      case 'pdf':
        content = await this.renderPdf(template, data, layout, branding);
        mimeType = 'application/pdf';
        extension = 'pdf';
        break;
      
      case 'excel':
        content = await this.renderExcel(template, data);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;
      
      case 'csv':
        content = Buffer.from(await this.renderCsv(data));
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      
      case 'html':
        content = Buffer.from(await this.renderHtml(template, data, branding));
        mimeType = 'text/html';
        extension = 'html';
        break;
      
      case 'json':
        content = Buffer.from(JSON.stringify(data, null, 2));
        mimeType = 'application/json';
        extension = 'json';
        break;
      
      default:
        throw new MCVError(`Unsupported format: ${format}`, ErrorCode.VALIDATION_ERROR);
    }
    
    // Upload to storage
    const filename = `reports/${ctx.venture.id}/${template.slug}/${Date.now()}.${extension}`;
    const url = await storageService.upload(content, filename, mimeType);
    
    return {
      format,
      url,
      size: content.length,
    };
  }

  private async renderPdf(
    template: any, 
    data: any, 
    layout: any, 
    branding: any
  ): Promise<Buffer> {
    // TODO: Implement PDF rendering using puppeteer or similar
    // This would generate a PDF from the HTML template
    return Buffer.from('');
  }

  private async renderExcel(template: any, data: any): Promise<Buffer> {
    // TODO: Implement Excel rendering using xlsx or exceljs
    return Buffer.from('');
  }

  private async renderCsv(data: any): Promise<string> {
    // Simple CSV conversion
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).join(','));
      return [headers, ...rows].join('\n');
    }
    return '';
  }

  private async renderHtml(template: any, data: any, branding: any): Promise<string> {
    // TODO: Implement HTML template rendering
    return `<!DOCTYPE html><html><body><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
  }

  private async deliverReports(reports: any[], delivery: any) {
    const deliveryStatus: Record<string, any> = {};
    
    if (delivery.email?.recipients?.length) {
      try {
        await emailService.send({
          to: delivery.email.recipients,
          subject: delivery.email.subject,
          body: delivery.email.body ?? 'Please find your report attached.',
          attachments: reports.map(r => ({
            filename: `report.${r.format}`,
            url: r.fileUrl,
          })),
        });
        deliveryStatus.email = { sent: true, sentAt: new Date() };
      } catch (error) {
        deliveryStatus.email = { sent: false, error: (error as Error).message };
      }
    }
    
    if (delivery.slack?.channel) {
      // TODO: Implement Slack delivery
      deliveryStatus.slack = { sent: false, error: 'Not implemented' };
    }
    
    // Update delivery status
    for (const report of reports) {
      await db.update(generatedReports)
        .set({
          deliveryStatus,
          status: Object.values(deliveryStatus).every((s: any) => s.sent) 
            ? 'delivered' 
            : 'generated',
          updatedAt: new Date(),
        })
        .where(eq(generatedReports.id, report.id));
    }
  }

  private getDefaultDateRange(config: any): { start: Date; end: Date } {
    const end = new Date();
    let start: Date;
    
    switch (config.dateRange?.value) {
      case 'today':
        start = new Date(end);
        start.setHours(0, 0, 0, 0);
        break;
      case 'last_7_days':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_30_days':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'this_month':
        start = new Date(end.getFullYear(), end.getMonth(), 1);
        break;
      case 'last_month':
        start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
        end.setDate(0); // Last day of previous month
        break;
      default:
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    return { start, end };
  }

  private calculateDateRange(
    frequency: string, 
    config: any
  ): { start: Date; end: Date } {
    const end = new Date();
    let start: Date;
    
    if (config?.type === 'rolling') {
      start = new Date(end.getTime() - (config.days ?? 30) * 24 * 60 * 60 * 1000);
    } else {
      // Previous period
      switch (frequency) {
        case 'daily':
          start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
          end.setTime(start.getTime() + 24 * 60 * 60 * 1000 - 1);
          break;
        case 'weekly':
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
          start.setDate(start.getDate() - start.getDay());
          end.setTime(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
          break;
        case 'monthly':
          start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
          end.setTime(new Date(end.getFullYear(), end.getMonth(), 0).getTime());
          break;
        default:
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }
    
    return { start, end };
  }

  private calculateNextRun(frequency: string, config: any): Date {
    const now = new Date();
    const next = new Date(now);
    
    next.setHours(config.hour ?? 9, config.minute ?? 0, 0, 0);
    
    switch (frequency) {
      case 'daily':
        if (next <= now) next.setDate(next.getDate() + 1);
        break;
      
      case 'weekly':
        next.setDate(next.getDate() + ((config.dayOfWeek ?? 1) - next.getDay() + 7) % 7);
        if (next <= now) next.setDate(next.getDate() + 7);
        break;
      
      case 'monthly':
        next.setDate(config.dayOfMonth ?? 1);
        if (next <= now) next.setMonth(next.getMonth() + 1);
        break;
      
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        next.setMonth(quarter * 3 + 3, config.dayOfMonth ?? 1);
        if (next <= now) next.setMonth(next.getMonth() + 3);
        break;
      
      default:
        next.setDate(next.getDate() + 1);
    }
    
    return next;
  }
}

export const reportService = new ReportService();
```

---

## API Surface

### tRPC Router

```typescript
// @mcv/analytics/router.ts
import { router, protectedProcedure } from '@mcv/kernel/trpc';
import { z } from 'zod';
import { metricsService } from './metrics/service';
import { dashboardService } from './dashboards/service';
import { funnelService } from './funnels/service';
import { cohortService } from './cohorts/service';
import { insightsService } from './insights/service';
import { reportService } from './reports/service';

export const analyticsRouter = router({
  // Metrics
  metrics: router({
    create: protectedProcedure
      .input(z.object({
        slug: z.string(),
        name: z.string(),
        type: z.enum(['counter', 'gauge', 'histogram', 'rate', 'derived']),
        // ... additional fields
      }))
      .mutation(({ input }) => metricsService.createMetric(input)),
    
    query: protectedProcedure
      .input(z.object({
        metricId: z.string().optional(),
        slug: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        granularity: z.enum(['minute', 'hour', 'day', 'week', 'month', 'quarter', 'year']),
        dimensions: z.record(z.string()).optional(),
      }))
      .query(({ input }) => metricsService.queryMetric(input)),
    
    record: protectedProcedure
      .input(z.object({
        metricSlug: z.string(),
        value: z.number(),
        dimensions: z.record(z.string()).optional(),
        timestamp: z.date().optional(),
      }))
      .mutation(({ input }) => metricsService.recordValue(
        input.metricSlug, input.value, input.dimensions, input.timestamp
      )),
    
    topMovers: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        category: z.string().optional(),
        direction: z.enum(['up', 'down', 'both']).optional(),
        period: z.enum(['day', 'week', 'month']).optional(),
      }))
      .query(({ input }) => metricsService.getTopMovers(input)),
  }),

  // Dashboards
  dashboards: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        visibility: z.enum(['private', 'team', 'venture', 'public']).optional(),
        // ... additional fields
      }))
      .mutation(({ input }) => dashboardService.create(input)),
    
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => dashboardService.getWithData(input.id)),
    
    addWidget: protectedProcedure
      .input(z.object({
        dashboardId: z.string(),
        type: z.string(),
        position: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
        dataSource: z.object({
          type: z.enum(['metric', 'query', 'api']),
          metricId: z.string().optional(),
          query: z.string().optional(),
        }),
        // ... additional fields
      }))
      .mutation(({ input }) => dashboardService.addWidget(input)),
    
    share: protectedProcedure
      .input(z.object({
        dashboardId: z.string(),
        userIds: z.array(z.string()).optional(),
        teamIds: z.array(z.string()).optional(),
        visibility: z.enum(['private', 'team', 'venture', 'public']).optional(),
      }))
      .mutation(({ input }) => dashboardService.share(input.dashboardId, input)),
  }),

  // Funnels
  funnels: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        steps: z.array(z.object({
          name: z.string(),
          eventType: z.string(),
          eventFilters: z.record(z.any()).optional(),
        })),
        // ... additional fields
      }))
      .mutation(({ input }) => funnelService.create(input)),
    
    analyze: protectedProcedure
      .input(z.object({
        funnelId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        segments: z.array(z.string()).optional(),
      }))
      .query(({ input }) => funnelService.analyze(input.funnelId, input)),
    
    getDropoffAnalysis: protectedProcedure
      .input(z.object({ funnelId: z.string(), stepId: z.string() }))
      .query(({ input }) => funnelService.getDropoffAnalysis(input.funnelId, input.stepId)),
  }),

  // Cohorts
  cohorts: router({
    createDefinition: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(['acquisition', 'behavioral', 'revenue', 'custom']),
        criteria: z.object({
          event: z.string(),
          filters: z.record(z.any()).optional(),
        }),
        retentionEvent: z.string(),
        // ... additional fields
      }))
      .mutation(({ input }) => cohortService.createDefinition(input)),
    
    getRetentionMatrix: protectedProcedure
      .input(z.object({
        definitionId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional(),
      }))
      .query(({ input }) => cohortService.getRetentionMatrix(input.definitionId, input)),
    
    calculateLTV: protectedProcedure
      .input(z.object({
        definitionId: z.string(),
        days: z.array(z.number()).optional(),
      }))
      .query(({ input }) => cohortService.calculateLTV(input.definitionId, input)),
    
    compareCohorts: protectedProcedure
      .input(z.object({ cohortIdA: z.string(), cohortIdB: z.string() }))
      .query(({ input }) => cohortService.compareCohorts(input.cohortIdA, input.cohortIdB)),
    
    predictChurnRisk: protectedProcedure
      .input(z.object({ cohortId: z.string() }))
      .query(({ input }) => cohortService.predictChurnRisk(input.cohortId)),
  }),

  // Insights
  insights: router({
    feed: protectedProcedure
      .input(z.object({
        types: z.array(z.string()).optional(),
        priorities: z.array(z.string()).optional(),
        status: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(({ input }) => insightsService.getInsightsFeed(input)),
    
    detectAnomalies: protectedProcedure
      .input(z.object({ metricId: z.string() }))
      .mutation(({ input }) => insightsService.detectAnomalies(input.metricId)),
    
    analyzeTrends: protectedProcedure
      .input(z.object({ metricId: z.string(), days: z.number().optional() }))
      .query(({ input }) => insightsService.analyzeTrends(input.metricId, input.days)),
    
    findCorrelations: protectedProcedure
      .input(z.object({ metricId: z.string() }))
      .query(({ input }) => insightsService.findCorrelations(input.metricId)),
    
    updateStatus: protectedProcedure
      .input(z.object({
        insightId: z.string(),
        status: z.enum(['viewed', 'acknowledged', 'resolved', 'dismissed']),
        feedback: z.object({
          wasHelpful: z.boolean().optional(),
          reason: z.string().optional(),
        }).optional(),
      }))
      .mutation(({ input }) => insightsService.updateInsightStatus(
        input.insightId, input.status, input.feedback
      )),
  }),

  // Reports
  reports: router({
    createTemplate: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(['dashboard_snapshot', 'metric_summary', 'funnel_analysis', 
                      'cohort_analysis', 'custom_query', 'executive_summary']),
        config: z.record(z.any()),
        // ... additional fields
      }))
      .mutation(({ input }) => reportService.createTemplate(input)),
    
    generate: protectedProcedure
      .input(z.object({
        templateId: z.string(),
        dateRange: z.object({ start: z.date(), end: z.date() }).optional(),
        formats: z.array(z.string()).optional(),
      }))
      .mutation(({ input }) => reportService.generateReport(input)),
    
    schedule: protectedProcedure
      .input(z.object({
        templateId: z.string(),
        name: z.string(),
        frequency: z.enum(['once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
        scheduleConfig: z.object({
          hour: z.number(),
          minute: z.number().optional(),
          timezone: z.string(),
          dayOfWeek: z.number().optional(),
          dayOfMonth: z.number().optional(),
        }),
        delivery: z.object({
          email: z.object({
            recipients: z.array(z.string()),
            subject: z.string(),
          }).optional(),
        }),
      }))
      .mutation(({ input }) => reportService.scheduleReport(input)),
    
    history: protectedProcedure
      .input(z.object({
        templateId: z.string().optional(),
        scheduleId: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(({ input }) => reportService.getReportHistory(input)),
  }),
});
```

---

## Integration Points

| System | Method | Data Flow |
|--------|--------|-----------|
| `@mcv/kernel` | Direct import | Database, context, errors |
| `@mcv/events` | Service call | Event consumption for metrics |
| `@mcv/storage` | Service call | Report file storage |
| `@mcv/ai` | Service call | AI-powered insights |
| `@mcv/comms` | Service call | Report delivery via email |
| `@mcv/identity` | Service call | User lookup for sharing |

---

## Security and Performance

- **Tenant Isolation**: All queries filtered by `ventureId`
- **Role-Based Access**: Dashboard and report sharing respects RBAC
- **Query Performance**: Materialized views for common aggregations
- **Time-Series Optimization**: Partitioned tables by timestamp
- **Caching Strategy**: Redis caching with configurable TTL per metric
- **Rate Limiting**: Query rate limits to prevent abuse
- **Data Retention**: Configurable retention policies per metric type