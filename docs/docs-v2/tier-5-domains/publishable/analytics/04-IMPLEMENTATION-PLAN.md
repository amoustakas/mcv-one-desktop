# @mcv/analytics — Implementation Plan

**Package:** `@mcv/analytics`
**Tier:** 5 (Domain Layer — Publishable)
**Classification:** PUBLISHABLE
**Submodules:** metrics, dashboards, funnels, cohorts, insights, reports
**Last Updated:** February 9, 2026

---

## 1. Overview

The `@mcv/analytics` package implements a comprehensive **Analytics & Business Intelligence** platform for the MCV.ONE ecosystem. It provides the complete data-to-decision pipeline: from raw metric ingestion and time-series storage to interactive dashboards, conversion funnel analysis, cohort retention tracking, AI-powered anomaly detection, and scheduled multi-format report generation.

Every MCV venture gets enterprise-grade analytics out of the box — no external BI tools required. The module is designed as a publishable package, meaning it can be extracted and used by any Supabase/PostgreSQL project outside the MCV consortium.

### Key Deliverables

- **Custom metric engine** supporting 5 metric types with 12 aggregation methods and 7 granularity levels
- **Interactive dashboard builder** with 12-column grid, 11 chart types, sharing, and real-time refresh
- **Conversion funnel tracker** with step-by-step analysis, drop-off detection, and segment breakdowns
- **Cohort analysis engine** with retention matrices, LTV calculation, and churn prediction
- **AI insights engine** with anomaly detection (Z-score, Isolation Forest), trend analysis, and correlations
- **Report generator** with PDF, Excel, CSV, HTML, JSON export and scheduled email/Slack delivery

### Success Metrics

| Metric | Target |
|--------|--------|
| Metric recording latency (p99) | < 100ms |
| Dashboard load time (10 widgets) | < 2 seconds |
| Funnel analysis query (1M events) | < 5 seconds |
| Cohort retention computation (100K users) | < 30 seconds |
| Anomaly detection batch run | < 2 minutes |
| Report generation (PDF, 20 pages) | < 10 seconds |

---

## 2. Prerequisites

### Infrastructure Dependencies

| Dependency | Purpose | Required By |
|-----------|---------|-------------|
| `@mcv/kernel` | Auth context, tenant isolation, error framework | Phase 1 |
| `@mcv/db` | Drizzle ORM, connection pooling, migrations | Phase 1 |
| `@mcv/events` | Event bus for metric ingestion triggers | Phase 1 |
| `@mcv/storage` | File storage for generated reports | Phase 2 |
| `@mcv/ai` | ML models for anomaly detection, predictions | Phase 3 |
| `@mcv/comms` | Email/Slack delivery for reports and alerts | Phase 2 |
| PostgreSQL 15+ | Primary data store with RLS | Phase 1 |
| Redis 7+ | Metric caching, pub/sub streaming, rate limiting | Phase 1 |

### Team Requirements

| Role | Count | Phases |
|------|-------|--------|
| Senior Backend Engineer | 2 | All phases |
| Frontend Engineer | 1 | Phase 2–4 |
| Data Engineer | 1 | Phase 1–3 |
| ML Engineer | 0.5 | Phase 3 |
| QA Engineer | 1 | All phases |

### Pre-Implementation Checklist

- [ ] Supabase project provisioned with RLS policies for `analytics_*` tables
- [ ] Redis cluster configured with dedicated keyspace for analytics caching
- [ ] `@mcv/events` integration verified (can consume domain events)
- [ ] Drizzle migration pipeline tested
- [ ] Venture IDs finalized for multi-tenant metric isolation
- [ ] Chart rendering library selected (Recharts or Victory for React components)
- [ ] PDF generation library selected (Puppeteer or @react-pdf/renderer)

---

## 3. Phase 1 — Foundation (Weeks 1–6)

**Goal:** Establish metric definitions, time-series storage with multi-granularity rollups, and basic query capabilities. By end of Phase 1, ventures can define custom metrics, record values, and query time-series data at any granularity.

### 3.1 Database Schema & Migrations

**Duration:** Weeks 1–2
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Create Drizzle schema for `metric_definitions` with venture isolation
- [ ] Create schema for `metric_values` with time-series optimized storage
- [ ] Create schema for `analytics_dashboards` and `analytics_dashboard_widgets`
- [ ] Create schema for `analytics_funnels`, `analytics_funnel_steps`, `analytics_funnel_conversions`
- [ ] Create schema for `analytics_cohort_definitions`, `analytics_cohorts`, `analytics_cohort_retention`
- [ ] Create schema for `analytics_insights`, `analytics_insight_rules`, `analytics_anomaly_models`
- [ ] Create schema for `analytics_report_templates`, `analytics_report_schedules`, `analytics_generated_reports`
- [ ] Create schema for `analytics_metric_alerts` and `analytics_alert_events`
- [ ] Implement RLS policies: ventures can only access their own analytics data
- [ ] Create composite indexes for time-series queries (metric_id + timestamp + granularity)
- [ ] Create indexes for dimensional breakdowns (metric_id + dimension_values)
- [ ] Write migration scripts with rollback support

```typescript
// Example: Metric value storage with multi-granularity rollups
import { pgTable, uuid, text, doublePrecision, timestamp, jsonb, index, uniqueIndex, boolean } from 'drizzle-orm/pg-core';

export const metricDefinitions = pgTable('metric_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'counter' | 'gauge' | 'histogram' | 'rate' | 'derived'
  category: text('category').notNull(),
  unit: text('unit'),
  format: text('format'), // 'number' | 'currency' | 'percent' | 'duration'
  isActive: boolean('is_active').default(true).notNull(),
  dimensions: jsonb('dimensions').$type<string[]>(),
  aggregation: text('aggregation').default('sum'),
  formula: text('formula'), // for derived metrics
  thresholds: jsonb('thresholds').$type<{ warning?: number; critical?: number }>(),
  cacheTtlMs: doublePrecision('cache_ttl_ms').default(300000),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('metric_def_venture_slug_idx').on(table.ventureId, table.slug),
  index('metric_def_venture_idx').on(table.ventureId),
  index('metric_def_category_idx').on(table.category),
]);

export const metricValues = pgTable('analytics_metric_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  metricId: uuid('metric_id').notNull(),
  ventureId: uuid('venture_id').notNull(),
  granularity: text('granularity').notNull(), // 'minute'|'hour'|'day'|'week'|'month'|'quarter'|'year'
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  value: doublePrecision('value').notNull(),
  count: doublePrecision('count').default(1),
  min: doublePrecision('min'),
  max: doublePrecision('max'),
  sum: doublePrecision('sum'),
  dimensionValues: jsonb('dimension_values').$type<Record<string, string>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('mv_dedup_idx').on(table.metricId, table.granularity, table.timestamp, table.dimensionValues),
  index('mv_timeseries_idx').on(table.metricId, table.granularity, table.timestamp),
  index('mv_venture_idx').on(table.ventureId),
]);
```

### 3.2 Metric Definition & Recording

**Duration:** Weeks 2–4
**Owner:** Senior Backend Engineer + Data Engineer

#### Tasks

- [ ] Implement `MetricsService` with full CRUD for metric definitions
- [ ] Implement `createMetric()` with Zod validation for all 5 metric types
- [ ] Implement `recordValue()` — record a single metric data point
- [ ] Implement multi-granularity upsert: on record, upsert into minute/hour/day/week/month/quarter/year buckets simultaneously
- [ ] Implement counter logic: accumulate value via `SET value = value + $new` on conflict
- [ ] Implement gauge logic: overwrite with latest value on conflict
- [ ] Implement histogram logic: update min/max/sum/count on conflict
- [ ] Implement `batchRecord()` — record up to 1000 values in a single transaction
- [ ] Implement Redis caching for latest metric values with configurable TTL per metric
- [ ] Implement `getLatest()` — fetch most recent value (cache-first)
- [ ] Implement event-driven metric recording: subscribe to `@mcv/events` topics and auto-record
- [ ] Create metric slug validation (unique per venture, URL-safe format)
- [ ] Implement metric archival (deactivate metrics, retain historical data)

```typescript
// Example: Recording a metric value with multi-granularity rollup
export async function recordValue(
  ventureId: string,
  metricSlug: string,
  value: number,
  dimensions?: Record<string, string>,
  timestamp?: Date,
): Promise<void> {
  const metric = await getMetricBySlug(ventureId, metricSlug);
  if (!metric) throw new NotFoundError(`Metric ${metricSlug} not found`);

  const ts = timestamp ?? new Date();
  const granularities = ['minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'] as const;

  await db.transaction(async (tx) => {
    for (const granularity of granularities) {
      const bucketTs = truncateToGranularity(ts, granularity);

      await tx.insert(metricValues).values({
        metricId: metric.id,
        ventureId,
        granularity,
        timestamp: bucketTs,
        value,
        count: 1,
        min: value,
        max: value,
        sum: value,
        dimensionValues: dimensions ?? {},
      }).onConflictDoUpdate({
        target: [metricValues.metricId, metricValues.granularity, metricValues.timestamp, metricValues.dimensionValues],
        set: metric.type === 'gauge' ? {
          value,
          count: sql`${metricValues.count} + 1`,
          min: sql`LEAST(${metricValues.min}, ${value})`,
          max: sql`GREATEST(${metricValues.max}, ${value})`,
        } : {
          value: sql`${metricValues.value} + ${value}`,
          count: sql`${metricValues.count} + 1`,
          min: sql`LEAST(${metricValues.min}, ${value})`,
          max: sql`GREATEST(${metricValues.max}, ${value})`,
          sum: sql`${metricValues.sum} + ${value}`,
        },
      });
    }
  });

  // Update Redis cache
  const cacheKey = `analytics:latest:${ventureId}:${metricSlug}`;
  await redis.set(cacheKey, JSON.stringify({ value, timestamp: ts.toISOString() }), 'PX', metric.cacheTtlMs);

  // Publish real-time update
  await redis.publish(`analytics:stream:${ventureId}`, JSON.stringify({
    metric: metricSlug, value, timestamp: ts.toISOString(), dimensions,
  }));
}
```

### 3.3 Time-Series Query Engine

**Duration:** Weeks 4–6
**Owner:** Senior Backend Engineer

#### Tasks

- [ ] Implement `queryMetric()` with flexible time range, granularity, and dimension filtering
- [ ] Implement automatic granularity selection based on time range:
  - Range < 6 hours → minute granularity
  - Range < 7 days → hourly granularity
  - Range < 90 days → daily granularity
  - Range < 2 years → weekly/monthly granularity
  - Range > 2 years → quarterly/yearly granularity
- [ ] Implement `compareMetric()` — compare metric across two date ranges (absolute + % change)
- [ ] Implement `aggregateMetrics()` — multi-metric aggregation with GROUP BY dimensions
- [ ] Implement `getTopMovers()` — metrics with largest period-over-period change
- [ ] Implement derived metric computation (formulas referencing other metrics)
- [ ] Implement `streamMetrics()` — real-time metric updates via Redis pub/sub
- [ ] Implement query result caching with automatic invalidation on new records
- [ ] Create React hooks: `useMetricQuery`, `useMetricStream`
- [ ] Create React components: `MetricCard`, `MetricSparkline`
- [ ] Implement percentile calculations (p50, p90, p95, p99) for histogram metrics
- [ ] Implement moving average calculations (SMA, EMA) for trend smoothing

```typescript
// Example: Time-series query with auto-granularity
export async function queryMetric(params: MetricQueryParams): Promise<MetricTimeSeries> {
  const { ventureId, metricSlug, startDate, endDate, granularity, dimensions } = params;

  const metric = await getMetricBySlug(ventureId, metricSlug);
  const effectiveGranularity = granularity ?? autoSelectGranularity(startDate, endDate);

  const conditions = [
    eq(metricValues.metricId, metric.id),
    eq(metricValues.granularity, effectiveGranularity),
    gte(metricValues.timestamp, startDate),
    lte(metricValues.timestamp, endDate),
  ];

  if (dimensions) {
    for (const [key, value] of Object.entries(dimensions)) {
      conditions.push(sql`${metricValues.dimensionValues} ->> ${key} = ${value}`);
    }
  }

  const rows = await db.select({
    timestamp: metricValues.timestamp,
    value: metricValues.value,
    count: metricValues.count,
    min: metricValues.min,
    max: metricValues.max,
  })
    .from(metricValues)
    .where(and(...conditions))
    .orderBy(asc(metricValues.timestamp));

  return {
    metric: metric.slug,
    granularity: effectiveGranularity,
    startDate,
    endDate,
    dataPoints: rows,
    summary: {
      total: rows.reduce((sum, r) => sum + r.value, 0),
      average: rows.reduce((sum, r) => sum + r.value, 0) / rows.length,
      min: Math.min(...rows.map(r => r.min ?? r.value)),
      max: Math.max(...rows.map(r => r.max ?? r.value)),
      dataPointCount: rows.length,
    },
  };
}
```

### 3.4 Phase 1 Acceptance Criteria

| Criterion | Validation Method |
|-----------|-------------------|
| Metric definition CRUD works for all 5 types | Integration test |
| `recordValue()` upserts into all 7 granularity levels atomically | Unit test |
| Counter metrics accumulate correctly on conflict | Unit test |
| Gauge metrics overwrite to latest value | Unit test |
| Batch recording of 1000 values completes in < 500ms | Performance test |
| Time-series query returns correct data at all granularities | Integration test |
| Auto-granularity selects appropriate level for given range | Unit test |
| `compareMetric()` returns correct absolute and % change | Unit test |
| Redis cache returns latest value within configured TTL | Integration test |
| Real-time streaming delivers metric updates within 100ms | Performance test |
| RLS prevents cross-venture metric access | Security test |

---

## 4. Phase 2 — Core Features (Weeks 7–14)

**Goal:** Build interactive dashboards, conversion funnels, cohort analysis, and report generation. By end of Phase 2, users can build dashboards, analyze conversion funnels, track retention cohorts, and generate multi-format reports.

### 4.1 Dashboard Builder

**Duration:** Weeks 7–9
**Owner:** Frontend Engineer + Senior Backend Engineer

#### Tasks

- [ ] Implement `DashboardService` with CRUD for dashboards
- [ ] Implement `createDashboard()` with 12-column grid layout system
- [ ] Implement `addWidget()` — add metric widgets to dashboard with chart configuration
- [ ] Support 11 chart types: line, bar, area, pie, donut, scatter, heatmap, table, number, gauge, sparkline
- [ ] Implement `updateWidgetPositions()` — batch drag-and-drop repositioning
- [ ] Implement `getDashboardWithData()` — fetch dashboard with all widget data pre-loaded
- [ ] Implement dashboard sharing: private, team, venture-wide, public (read-only link)
- [ ] Implement `duplicateDashboard()` — clone with all widgets and configurations
- [ ] Implement `createSnapshot()` — point-in-time dashboard snapshot for historical comparison
- [ ] Implement auto-refresh: configurable refresh interval per dashboard (30s, 1m, 5m, 15m)
- [ ] Implement dashboard templates: pre-built layouts for common use cases (SaaS, e-commerce, growth)
- [ ] Create React components: `DashboardGrid`, `DashboardBuilder`, `WidgetRenderer`, `ChartWidget`
- [ ] Create React hook: `useDashboard`, `useDashboardBuilder`
- [ ] Implement responsive layout: dashboards render correctly on mobile and tablet

```typescript
// Example: Dashboard with widget layout
const saasOverviewDashboard: CreateDashboardInput = {
  name: 'SaaS Overview',
  description: 'Key SaaS metrics at a glance',
  visibility: 'venture',
  refreshIntervalMs: 60_000,
  widgets: [
    {
      type: 'number',
      title: 'MRR',
      metricSlug: 'monthly_recurring_revenue',
      layout: { x: 0, y: 0, w: 3, h: 2 },
      config: { format: 'currency', comparisonPeriod: 'previous_month' },
    },
    {
      type: 'line',
      title: 'Revenue Trend',
      metricSlug: 'revenue',
      layout: { x: 3, y: 0, w: 6, h: 4 },
      config: {
        granularity: 'day',
        timeRange: { days: 30 },
        showTrend: true,
        showForecast: false,
      },
    },
    {
      type: 'bar',
      title: 'Signups by Source',
      metricSlug: 'signups',
      layout: { x: 9, y: 0, w: 3, h: 4 },
      config: {
        dimension: 'source',
        granularity: 'week',
        timeRange: { days: 28 },
        stacked: true,
      },
    },
    {
      type: 'gauge',
      title: 'Churn Rate',
      metricSlug: 'churn_rate',
      layout: { x: 0, y: 2, w: 3, h: 2 },
      config: {
        format: 'percent',
        thresholds: { green: 0.03, yellow: 0.05, red: 0.08 },
      },
    },
  ],
};
```

### 4.2 Conversion Funnel Tracking

**Duration:** Weeks 9–11
**Owner:** Senior Backend Engineer + Data Engineer

#### Tasks

- [ ] Implement `FunnelService` with `createFunnel()`, `trackFunnelProgress()`, `analyzeFunnel()`
- [ ] Implement funnel step definition with ordered sequence and optional conditions
- [ ] Implement `trackFunnelProgress()` — record user entering/completing funnel steps
- [ ] Implement step-by-step conversion rate calculation
- [ ] Implement `analyzeFunnel()` returning:
  - Total entries, completions, overall conversion rate
  - Per-step conversion rate, drop-off count, drop-off rate
  - Average time between steps
  - Segment breakdown (conversion by user segment)
- [ ] Implement `getDropoffAnalysis()` — AI-powered analysis of why users drop off
- [ ] Implement time-windowed funnel analysis (sessions within X minutes count as one pass)
- [ ] Implement funnel comparison: compare conversion rates across date ranges or segments
- [ ] Implement A/B test funnel variant tracking
- [ ] Create React components: `FunnelChart` (horizontal funnel visualization)
- [ ] Create React hook: `useFunnelAnalysis`
- [ ] Support maximum 20 steps per funnel (MAX_FUNNEL_STEPS constant)

```typescript
// Example: Funnel definition and analysis
const onboardingFunnel: CreateFunnelInput = {
  name: 'User Onboarding',
  description: 'Track new user activation flow',
  steps: [
    { name: 'Signed Up', eventName: 'user_registered', order: 1 },
    { name: 'Email Verified', eventName: 'email_verified', order: 2 },
    { name: 'Profile Completed', eventName: 'profile_completed', order: 3 },
    { name: 'First Action', eventName: 'first_core_action', order: 4 },
    { name: 'Invited Friend', eventName: 'invite_sent', order: 5 },
  ],
  timeWindowMinutes: 10080, // 7 days
};

// Analysis result
const analysis: FunnelAnalysis = {
  funnelId: 'onboarding-v1',
  dateRange: { start: '2026-01-01', end: '2026-01-31' },
  totalEntries: 10000,
  totalCompletions: 1200,
  overallConversionRate: 0.12,
  steps: [
    { name: 'Signed Up', entered: 10000, completed: 10000, rate: 1.00, dropOff: 0, avgTimeToNextMs: 120000 },
    { name: 'Email Verified', entered: 10000, completed: 7500, rate: 0.75, dropOff: 2500, avgTimeToNextMs: 300000 },
    { name: 'Profile Completed', entered: 7500, completed: 4500, rate: 0.60, dropOff: 3000, avgTimeToNextMs: 600000 },
    { name: 'First Action', entered: 4500, completed: 2000, rate: 0.44, dropOff: 2500, avgTimeToNextMs: 1800000 },
    { name: 'Invited Friend', entered: 2000, completed: 1200, rate: 0.60, dropOff: 800, avgTimeToNextMs: null },
  ],
};
```

### 4.3 Cohort Analysis

**Duration:** Weeks 11–13
**Owner:** Data Engineer + Senior Backend Engineer

#### Tasks

- [ ] Implement `CohortService` with `createCohortDefinition()`, `computeCohorts()`, `getRetentionMatrix()`
- [ ] Implement cohort definition by:
  - Registration date (monthly/weekly cohorts)
  - First action date
  - Custom event (e.g., first purchase)
  - Trait value at time of cohorting
- [ ] Implement `computeCohorts()` — assign users to cohorts and compute retention
- [ ] Implement `getRetentionMatrix()` — N×M matrix of cohort × period retention rates
- [ ] Implement `calculateLTV()` — lifetime value by cohort with configurable revenue metric
- [ ] Implement `compareCohorts()` — side-by-side comparison of two or more cohorts
- [ ] Implement `predictChurnRisk()` — ML-powered churn prediction using retention patterns
- [ ] Implement rolling cohort computation (recompute on schedule)
- [ ] Create React components: `RetentionHeatmap` (color-coded retention matrix), `CohortTable`
- [ ] Create React hook: `useRetentionMatrix`
- [ ] Implement cohort export (CSV/JSON for external analysis)

```typescript
// Example: Retention matrix computation
export async function getRetentionMatrix(
  ventureId: string,
  definitionId: string,
  periods: number = 12,
): Promise<RetentionMatrix> {
  const definition = await getCohortDefinition(ventureId, definitionId);
  const cohorts = await db.select()
    .from(analyticsCohorts)
    .where(and(
      eq(analyticsCohorts.ventureId, ventureId),
      eq(analyticsCohorts.definitionId, definitionId),
    ))
    .orderBy(desc(analyticsCohorts.cohortDate));

  const matrix: RetentionMatrix = {
    cohorts: [],
    periods: Array.from({ length: periods }, (_, i) => `Period ${i}`),
  };

  for (const cohort of cohorts) {
    const retention = await db.select()
      .from(analyticsCohortRetention)
      .where(eq(analyticsCohortRetention.cohortId, cohort.id))
      .orderBy(asc(analyticsCohortRetention.periodIndex));

    matrix.cohorts.push({
      date: cohort.cohortDate,
      size: cohort.memberCount,
      retention: retention.map(r => ({
        period: r.periodIndex,
        activeUsers: r.activeCount,
        rate: r.retentionRate,
      })),
    });
  }

  return matrix;
}
```

### 4.4 Report Generation

**Duration:** Weeks 13–14
**Owner:** Senior Backend Engineer + Frontend Engineer

#### Tasks

- [ ] Implement `ReportService` with template CRUD and generation
- [ ] Implement `createReportTemplate()` — define report structure with metric sections
- [ ] Implement `generateReport()` with output formats: PDF, Excel, CSV, HTML, JSON
- [ ] Implement PDF generation using Puppeteer (render HTML template → PDF)
- [ ] Implement Excel generation using ExcelJS (multi-sheet workbooks with charts)
- [ ] Implement CSV export for raw data sections
- [ ] Implement `scheduleReport()` — recurring generation on daily/weekly/monthly/quarterly schedule
- [ ] Implement `runScheduledReport()` — cron-triggered report execution
- [ ] Implement report delivery: email attachment, Slack upload, S3 storage with download link
- [ ] Implement report history: track all generated reports with metadata and download links
- [ ] Implement report parameters: date range, venture filter, dimension filters
- [ ] Create React components: `ReportViewer`
- [ ] Create React hook: `useReportGenerator`
- [ ] Implement built-in report templates: Executive Summary, Marketing Performance, Revenue Analysis

### 4.5 Phase 2 Acceptance Criteria

| Criterion | Validation Method |
|-----------|-------------------|
| Dashboard with 10 widgets loads in < 2 seconds | Performance test |
| Drag-and-drop widget repositioning persists correctly | E2E test |
| Dashboard sharing generates valid public link | Integration test |
| Funnel analysis computes correct per-step conversion rates | Unit test (golden dataset) |
| Funnel time-window correctly groups sessions | Integration test |
| Drop-off analysis identifies correct bottleneck step | Integration test |
| Retention matrix matches manually computed values | Unit test (golden dataset) |
| LTV calculation matches expected values for known cohorts | Unit test |
| PDF report generates with correct metrics and formatting | Snapshot test |
| Excel report has multiple sheets with chart objects | Integration test |
| Scheduled report fires at configured interval | Cron test |
| Email delivery includes report attachment | E2E test |

---

## 5. Phase 3 — Advanced Features (Weeks 15–22)

**Goal:** Add AI-powered insights, anomaly detection, predictive analytics, and cross-venture benchmarking. This phase transforms the analytics platform from descriptive to prescriptive intelligence.

### 5.1 AI-Powered Insights Engine

**Duration:** Weeks 15–17
**Owner:** ML Engineer + Senior Backend Engineer

#### Tasks

- [ ] Implement `InsightsService` with automated insight generation
- [ ] Implement `getInsightsFeed()` — prioritized feed of auto-generated insights
- [ ] Implement insight types: anomaly, trend_change, correlation, prediction, recommendation
- [ ] Implement insight lifecycle: new → viewed → acknowledged → resolved/dismissed
- [ ] Implement insight deduplication (don't generate same insight twice in 24 hours)
- [ ] Implement insight prioritization scoring based on:
  - Metric importance (revenue > engagement > vanity)
  - Magnitude of change (larger = more important)
  - Affected user count
  - Recency
- [ ] Create React components: `InsightCard`, `InsightsFeed`
- [ ] Create React hook: `useInsightsFeed`
- [ ] Implement insight notifications: email/Slack/push for critical insights
- [ ] Implement insight feedback loop (was this insight useful? → improves future ranking)

```typescript
// Example: Insight generation and prioritization
interface Insight {
  id: string;
  ventureId: string;
  type: 'anomaly' | 'trend_change' | 'correlation' | 'prediction' | 'recommendation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metricSlug: string;
  evidence: {
    currentValue: number;
    expectedValue: number;
    deviation: number;
    confidence: number;
  };
  suggestedActions: string[];
  status: 'new' | 'viewed' | 'acknowledged' | 'resolved' | 'dismissed';
  createdAt: Date;
}

// Auto-generated insight example:
const insight: Insight = {
  id: 'ins_abc123',
  ventureId: 'betedge',
  type: 'anomaly',
  priority: 'critical',
  title: 'Signups dropped 45% below expected',
  description: 'Daily signups fell to 234 vs expected 425 (3.2σ below mean). ' +
    'This is the largest single-day drop in 90 days.',
  metricSlug: 'daily_signups',
  evidence: {
    currentValue: 234,
    expectedValue: 425,
    deviation: -3.2,
    confidence: 0.98,
  },
  suggestedActions: [
    'Check ad campaign status — spend may have decreased',
    'Verify signup flow is working (no 500 errors)',
    'Review landing page changes in last 24h',
  ],
  status: 'new',
  createdAt: new Date(),
};
```

### 5.2 Anomaly Detection

**Duration:** Weeks 17–19
**Owner:** ML Engineer + Data Engineer

#### Tasks

- [ ] Implement Z-score anomaly detection for individual metrics
  - Configurable window size (default: 30 days)
  - Configurable threshold (default: 2.5σ)
  - Seasonal adjustment (day-of-week normalization)
- [ ] Implement Isolation Forest model for multi-dimensional anomaly detection
  - Detects anomalies across multiple correlated metrics simultaneously
  - Automatic feature engineering from metric values
- [ ] Implement Prophet-based forecasting for trend-aware anomaly detection
  - Handles seasonality, holidays, and trend changes
  - Generates expected value ± confidence interval
- [ ] Implement `detectAnomalies()` — run anomaly detection for a specific metric
- [ ] Implement `runScheduledAnalysis()` — batch anomaly detection across all active metrics
- [ ] Implement anomaly alert routing: create insight → notify stakeholders
- [ ] Implement alert cooldown: suppress repeated alerts for the same anomaly (configurable window)
- [ ] Implement alert snooze: temporarily suppress alerts for a metric
- [ ] Implement anomaly model auto-tuning (adjust thresholds based on false-positive feedback)
- [ ] Create anomaly visualization: overlay expected range on metric charts

```typescript
// Example: Z-score anomaly detection with seasonal adjustment
export async function detectAnomalies(
  ventureId: string,
  metricSlug: string,
  options: { windowDays?: number; threshold?: number; adjustForDayOfWeek?: boolean } = {},
): Promise<AnomalyDetectionResult[]> {
  const { windowDays = 30, threshold = 2.5, adjustForDayOfWeek = true } = options;

  const values = await queryMetric({
    ventureId,
    metricSlug,
    startDate: subDays(new Date(), windowDays + 7), // extra week for context
    endDate: new Date(),
    granularity: 'day',
  });

  const anomalies: AnomalyDetectionResult[] = [];

  // Group by day-of-week for seasonal adjustment
  const byDow = adjustForDayOfWeek
    ? groupByDayOfWeek(values.dataPoints)
    : { all: values.dataPoints };

  for (const [group, points] of Object.entries(byDow)) {
    const mean = points.reduce((s, p) => s + p.value, 0) / points.length;
    const stdDev = Math.sqrt(
      points.reduce((s, p) => s + (p.value - mean) ** 2, 0) / points.length,
    );

    // Check last 7 days for anomalies
    const recentPoints = points.filter(p => isAfter(p.timestamp, subDays(new Date(), 7)));
    for (const point of recentPoints) {
      const zScore = stdDev > 0 ? (point.value - mean) / stdDev : 0;
      if (Math.abs(zScore) > threshold) {
        anomalies.push({
          timestamp: point.timestamp,
          value: point.value,
          expectedValue: mean,
          zScore,
          severity: Math.abs(zScore) > 4 ? 'critical' : Math.abs(zScore) > 3 ? 'high' : 'medium',
          direction: zScore > 0 ? 'above' : 'below',
        });
      }
    }
  }

  return anomalies;
}
```

### 5.3 Predictive Analytics

**Duration:** Weeks 19–20
**Owner:** ML Engineer

#### Tasks

- [ ] Implement `analyzeTrends()` — linear regression trend analysis with R² confidence
- [ ] Implement trend projection: forecast metric values for next N periods
- [ ] Implement seasonality detection: identify weekly/monthly/quarterly patterns
- [ ] Implement `findCorrelations()` — Pearson correlation across all metric pairs
- [ ] Implement lagged correlation: detect metrics that lead/follow other metrics
- [ ] Implement churn prediction model using retention cohort data
- [ ] Implement revenue forecasting based on historical trends and seasonality
- [ ] Implement goal tracking: "at current trend, will we hit target by date X?"
- [ ] Wire predictions into dashboard widgets (forecast overlay on charts)
- [ ] Create prediction confidence intervals (80% and 95% bands)

### 5.4 Cross-Venture Benchmarking

**Duration:** Weeks 20–22
**Owner:** Senior Backend Engineer + Data Engineer

#### Tasks

- [ ] Implement cross-venture metric aggregation (consortium-level KPIs)
- [ ] Implement venture ranking by metric (e.g., top ventures by growth rate)
- [ ] Implement anonymized benchmarking (compare venture against consortium average without revealing individual venture data)
- [ ] Implement benchmark dashboards with drill-down capability
- [ ] Implement cross-venture funnel comparison (same funnel definition, different ventures)
- [ ] Implement cross-venture cohort comparison (retention across ventures)
- [ ] Create consortium-level executive dashboard template
- [ ] Implement data access controls: only consortium admins see cross-venture data
- [ ] Implement benchmark alerts: notify when a venture significantly underperforms

### 5.5 Phase 3 Acceptance Criteria

| Criterion | Validation Method |
|-----------|-------------------|
| Insight feed generates 5+ insights per day for active ventures | Monitoring |
| Anomaly detection identifies known anomalies in historical data | Backtesting |
| Z-score detection has < 5% false positive rate | Backtesting |
| Isolation Forest catches multi-metric anomalies Z-score misses | Comparative test |
| Trend analysis R² > 0.7 for stable metrics | Statistical validation |
| Revenue forecast within 15% of actual for 30-day window | Backtesting |
| Cross-venture benchmarks compute correctly with RLS | Integration test |
| Consortium dashboard aggregates all 9 ventures | E2E test |
| Alert cooldown prevents duplicate notifications | Integration test |
| Prediction confidence intervals contain actual values 80%+ of time | Statistical test |

---

## 6. Phase 4 — Polish & Hardening (Weeks 23–26)

**Goal:** Production hardening, performance optimization, comprehensive documentation, and operational readiness.

### 6.1 Performance Optimization

- [ ] Implement query plan analysis for top-20 dashboard queries
- [ ] Create materialized views for common aggregations (daily/weekly rollups)
- [ ] Implement query batching for dashboards (single DB round-trip for all widgets)
- [ ] Optimize retention matrix computation with pre-aggregated cohort tables
- [ ] Implement tiered storage: hot data (90 days) in primary tables, cold data in archive tables
- [ ] Add connection pooling optimization for concurrent dashboard loads
- [ ] Implement progressive dashboard loading (render cached data, then refresh)
- [ ] Benchmark: sustain 100 concurrent dashboard viewers with < 3s load time

### 6.2 Observability & Monitoring

- [ ] Instrument all services with OpenTelemetry tracing
- [ ] Create Grafana dashboards: query latency, cache hit rates, report generation times
- [ ] Set up PagerDuty alerts: metric recording lag, insight generation failures, report delivery failures
- [ ] Implement health check endpoints for all analytics services
- [ ] Create operational runbooks for common issues
- [ ] Implement usage analytics: track which dashboards/reports are most used

### 6.3 Documentation & Developer Experience

- [ ] Write metric definition cookbook (common metric patterns by industry)
- [ ] Create dashboard template gallery with screenshots
- [ ] Write funnel analysis best practices guide
- [ ] Create cohort analysis tutorial with real-world examples
- [ ] Document anomaly detection algorithms with tuning guide
- [ ] Write report template authoring guide
- [ ] Create API reference with OpenAPI/Swagger specification
- [ ] Write integration guide for external ventures (publishable package)

### 6.4 Security & Compliance

- [ ] Penetration test all API endpoints
- [ ] Validate RLS policy coverage for all analytics tables
- [ ] Implement API rate limiting per venture
- [ ] Validate that public dashboard links don't leak sensitive data
- [ ] Implement data retention policies (auto-archive data older than configurable threshold)
- [ ] Ensure exported reports respect venture data boundaries

### 6.5 Phase 4 Acceptance Criteria

| Criterion | Validation Method |
|-----------|-------------------|
| Dashboard with 10 widgets loads in < 2s at 100 concurrent users | Load test |
| All API endpoints traced in OpenTelemetry | Trace inspection |
| PagerDuty fires within 60s of threshold breach | Chaos test |
| API reference covers all public methods | Doc review |
| RLS blocks cross-venture analytics access | Automated security scan |
| Data retention auto-archives data older than 2 years | Integration test |
| Published package installs cleanly in standalone project | Package test |

---

## 7. Testing Strategy

### Unit Tests

| Area | Coverage Target | Key Test Cases |
|------|-----------------|----------------|
| Metric recording | 100% | All 5 types, conflict behavior, batch, null dimensions |
| Time-series queries | 95% | All granularities, dimension filtering, derived metrics |
| Funnel analysis | 95% | Step conversion, time windows, empty funnels |
| Cohort computation | 95% | Retention matrix, LTV calculation, edge cases |
| Anomaly detection | 90% | Z-score thresholds, seasonal adjustment, edge cases |
| Report generation | 90% | All 5 formats, template rendering, parameter injection |

### Integration Tests

| Scenario | Description |
|----------|-------------|
| Record → Query pipeline | Record values, verify query returns correct time-series |
| Dashboard lifecycle | Create dashboard, add widgets, render with data |
| Funnel flow | Create funnel, track events, analyze results |
| Cohort lifecycle | Define cohort, compute members, generate retention matrix |
| Report delivery | Generate PDF, deliver via email, verify attachment |
| Anomaly → Insight pipeline | Inject anomalous data, verify insight auto-generated |
| Cross-venture aggregation | Record metrics for 3 ventures, verify consortium rollup |

### Performance Tests

| Test | Target | Tool |
|------|--------|------|
| Metric recording throughput | 10K records/sec | k6 |
| Dashboard load (10 widgets) | < 2s | k6 |
| Funnel analysis (1M events) | < 5s | Custom benchmark |
| Retention matrix (100K users, 12 months) | < 30s | Custom benchmark |
| Report generation (PDF, 20 pages) | < 10s | Custom benchmark |
| Anomaly batch (500 metrics) | < 2 min | Custom benchmark |

---

## 8. Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Time-series query performance at scale** | Medium | High | Pre-aggregated rollups; materialized views; tiered storage; query optimization |
| **Dashboard load time with many widgets** | Medium | Medium | Parallel widget queries; progressive loading; aggressive caching |
| **Anomaly detection false positives** | High | Medium | Tunable thresholds; seasonal adjustment; feedback loop; alert cooldown |
| **Report generation memory pressure** | Medium | Medium | Stream-based PDF generation; row-limit caps; async generation with queuing |
| **Cross-venture data leaks** | Low | Critical | RLS on every table; automated security tests; audit logging |
| **ML model drift in predictions** | Medium | Medium | Scheduled retraining; model monitoring; fallback to statistical methods |
| **Redis cache inconsistency** | Medium | Low | TTL-based expiry; cache invalidation on write; graceful degradation |
| **Funnel attribution complexity** | Medium | Medium | Clear session windowing rules; documented attribution model; user-configurable |
| **Schema migration complexity** | Low | Medium | Tested rollback scripts; staging validation; backward-compatible changes |
| **Concurrent dashboard editing conflicts** | Low | Low | Optimistic locking; last-write-wins with conflict notification |

---

## 9. Timeline Summary

```
Week  1-2   ████ Schema & Migrations
Week  2-4   ████ Metric Definition & Recording
Week  4-6   ████ Time-Series Query Engine
            ────── Phase 1 Gate Review ──────
Week  7-9   ██████ Dashboard Builder
Week  9-11  ████ Conversion Funnel Tracking
Week 11-13  ████ Cohort Analysis
Week 13-14  ██ Report Generation
            ────── Phase 2 Gate Review ──────
Week 15-17  ██████ AI Insights Engine
Week 17-19  ████ Anomaly Detection
Week 19-20  ██ Predictive Analytics
Week 20-22  ████ Cross-Venture Benchmarking
            ────── Phase 3 Gate Review ──────
Week 23-24  ████ Performance & Observability
Week 24-25  ████ Documentation & DX
Week 25-26  ██ Security & Compliance
            ────── Phase 4 Final Review ──────
```

**Total Duration:** 26 weeks (6.5 months)

### Phase Gate Reviews

| Gate | Week | Go/No-Go Criteria |
|------|------|-------------------|
| Phase 1 → 2 | Week 6 | Metrics defined, values recording, queries returning correct data |
| Phase 2 → 3 | Week 14 | Dashboards rendering, funnels analyzing, cohorts computing, reports generating |
| Phase 3 → 4 | Week 22 | Insights generating, anomalies detecting, benchmarks computing |
| Production Release | Week 26 | All acceptance criteria met, security audit passed, docs complete |

### Dependencies & Critical Path

```
Schema (P1) → Metrics (P1) → Queries (P1) → Dashboards (P2)
Metrics (P1) → Funnels (P2) → Cohorts (P2)
Metrics (P1) → Anomaly Detection (P3) → AI Insights (P3)
Cohorts (P2) → Predictive Analytics (P3)
Dashboards (P2) → Cross-Venture Benchmarking (P3)
Queries (P1) → Reports (P2)
```

The critical path runs: **Schema → Metrics → Queries → Dashboards → Cross-Venture Benchmarking → Polish**.

---

*@mcv/analytics — Analytics & Business Intelligence Domain*
