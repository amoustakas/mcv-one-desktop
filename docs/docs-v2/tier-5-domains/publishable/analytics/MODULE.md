# @mcv/analytics — Analytics Domain Module

**Parent Package:** @mcv/analytics  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Purpose

The `analytics` module provides a comprehensive analytics and business intelligence platform for ventures operating within the MCV ecosystem. It encompasses six tightly integrated submodules — **metrics**, **dashboards**, **funnels**, **cohorts**, **insights**, and **reports** — that together form a complete data-to-decision pipeline. From raw event ingestion and metric computation to interactive visualizations, AI-powered anomaly detection, and scheduled report delivery, this module equips every venture with enterprise-grade analytics out of the box.

**This is the single source of truth for all business intelligence operations across all MCV ventures.**

### Key Capabilities

- **Custom metrics and KPI definitions** with real-time computation and historical aggregation
- **Interactive dashboard builder** with drag-and-drop widgets, 11 chart types, and sharing
- **Conversion funnel tracking** with step-by-step analysis, drop-off detection, and A/B testing
- **Cohort analysis** for retention tracking, behavioral segmentation, and lifetime value (LTV)
- **AI-powered insights** including anomaly detection, trend analysis, correlations, and predictions
- **Scheduled and ad-hoc report generation** with PDF, Excel, CSV, HTML, and JSON export

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// METRICS API
// ═══════════════════════════════════════════════════════════════════════════════

// Core metric operations
export {
  MetricsService,            // Main metrics service class
  createMetricsService,      // Factory with venture context
} from './server/services/metrics-service';

export {
  createMetric,              // Define a new metric / KPI
  queryMetric,               // Query time-series values
  recordValue,               // Record a single metric value
  batchRecord,               // Batch-record up to 1000 values
  getLatest,                 // Get most recent value
  compareMetric,             // Compare across date ranges
  aggregateMetrics,          // Multi-metric aggregation
  streamMetrics,             // Real-time metric stream (Redis pub/sub)
  getTopMovers,              // Metrics with largest period-over-period changes
} from './server/services/metrics-service';

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARDS API
// ═══════════════════════════════════════════════════════════════════════════════

export {
  DashboardService,          // Dashboard CRUD + rendering
  createDashboard,           // Create a new dashboard
  getDashboardWithData,      // Fetch dashboard with all widget data
  addWidget,                 // Add widget to dashboard
  updateWidgetPositions,     // Batch-update widget grid positions
  duplicateDashboard,        // Clone a dashboard
  shareDashboard,            // Share with users/teams/public
  createSnapshot,            // Capture point-in-time snapshot
} from './server/services/dashboard-service';

// ═══════════════════════════════════════════════════════════════════════════════
// FUNNELS API
// ═══════════════════════════════════════════════════════════════════════════════

export {
  FunnelService,             // Funnel CRUD + analysis
  createFunnel,              // Define funnel with ordered steps
  trackFunnelProgress,       // Track user entering/progressing
  analyzeFunnel,             // Full funnel performance analysis
  getDropoffAnalysis,        // AI-powered drop-off insights
} from './server/services/funnel-service';

// ═══════════════════════════════════════════════════════════════════════════════
// COHORTS API
// ═══════════════════════════════════════════════════════════════════════════════

export {
  CohortService,             // Cohort definition + computation
  createCohortDefinition,    // Define cohort criteria
  computeCohorts,            // Run cohort computation
  getRetentionMatrix,        // Retention matrix for visualization
  calculateLTV,              // Lifetime value by cohort
  compareCohorts,            // Side-by-side cohort comparison
  predictChurnRisk,          // ML-powered churn prediction
} from './server/services/cohort-service';

// ═══════════════════════════════════════════════════════════════════════════════
// INSIGHTS API
// ═══════════════════════════════════════════════════════════════════════════════

export {
  InsightsService,           // Insight generation + management
  getInsightsFeed,           // Prioritized insight feed
  detectAnomalies,           // Z-score / ML anomaly detection
  analyzeTrends,             // Linear regression trend analysis
  findCorrelations,          // Pearson correlation across metrics
  createInsight,             // Manually create an insight
  updateInsightStatus,       // Mark viewed/acknowledged/resolved/dismissed
  runScheduledAnalysis,      // Cron: batch anomaly + trend detection
} from './server/services/insights-service';

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS API
// ═══════════════════════════════════════════════════════════════════════════════

export {
  ReportService,             // Template + schedule + generation
  createReportTemplate,      // Define report template
  generateReport,            // One-shot report generation
  scheduleReport,            // Set up recurring schedule
  runScheduledReport,        // Execute a scheduled report
  getReportHistory,          // List generated reports
} from './server/services/report-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useMetricQuery } from './client/hooks/use-metric-query';
export { useMetricStream } from './client/hooks/use-metric-stream';
export { useDashboard } from './client/hooks/use-dashboard';
export { useDashboardBuilder } from './client/hooks/use-dashboard-builder';
export { useFunnelAnalysis } from './client/hooks/use-funnel-analysis';
export { useRetentionMatrix } from './client/hooks/use-retention-matrix';
export { useInsightsFeed } from './client/hooks/use-insights-feed';
export { useReportGenerator } from './client/hooks/use-report-generator';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { MetricCard } from './client/components/metric-card';
export { MetricSparkline } from './client/components/metric-sparkline';
export { DashboardGrid } from './client/components/dashboard-grid';
export { DashboardBuilder } from './client/components/dashboard-builder';
export { WidgetRenderer } from './client/components/widget-renderer';
export { FunnelChart } from './client/components/funnel-chart';
export { RetentionHeatmap } from './client/components/retention-heatmap';
export { CohortTable } from './client/components/cohort-table';
export { InsightCard } from './client/components/insight-card';
export { InsightsFeed } from './client/components/insights-feed';
export { ReportViewer } from './client/components/report-viewer';
export { ChartWidget } from './client/components/chart-widget';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  METRIC_TYPES,
  AGGREGATION_METHODS,
  GRANULARITIES,
  METRIC_CATEGORIES,
  WIDGET_TYPES,
  CHART_TYPES,
  INSIGHT_TYPES,
  INSIGHT_PRIORITIES,
  REPORT_FORMATS,
  REPORT_FREQUENCIES,
  DEFAULT_CACHE_TTL,
  DEFAULT_RETENTION_DAYS,
  MAX_BATCH_SIZE,
  MAX_DASHBOARD_WIDGETS,
  MAX_FUNNEL_STEPS,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Metric types
  MetricDefinition,
  MetricValue,
  MetricType,
  MetricCategory,
  Granularity,
  Aggregation,
  MetricQueryParams,
  MetricTimeSeries,
  MetricResult,
  MetricEntry,
  ComparisonResult,
  AggregatedMetric,
  CreateMetricInput,
  UpdateMetricInput,

  // Dashboard types
  Dashboard,
  DashboardWithWidgets,
  DashboardWidget,
  DashboardLayoutItem,
  WidgetType,
  ChartType,
  WidgetConfig,
  WidgetLayout,
  CreateDashboardInput,
  UpdateDashboardInput,
  DashboardVisibility,
  DashboardWithData,

  // Funnel types
  Funnel,
  FunnelStep,
  FunnelConversion,
  FunnelAnalysis,
  FunnelDropoffReason,
  CreateFunnelInput,

  // Cohort types
  CohortDefinition,
  Cohort,
  CohortRetention,
  CohortMember,
  RetentionMatrix,
  CohortComparison,
  CreateCohortDefinitionInput,

  // Insight types
  Insight,
  InsightRule,
  AnomalyDetectionResult,
  TrendAnalysis,
  InsightFilters,

  // Report types
  ReportTemplate,
  ReportSchedule,
  GeneratedReport,
  CreateReportTemplateInput,
  GenerateReportInput,
  ScheduleReportInput,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            ANALYTICS DOMAIN ARCHITECTURE                                 │
│                                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              DATA SOURCES                                         │   │
│  │                                                                                   │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐   │   │
│  │  │ @mcv/events    │  │ @mcv/commerce  │  │ @mcv/growth    │  │  @mcv/people │   │   │
│  │  │ Event bus      │  │ Transactions   │  │ Campaign data  │  │  User actions│   │   │
│  │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘  └──────┬───────┘   │   │
│  │          │                   │                    │                  │            │   │
│  │          └───────────────────┴────────────────────┴──────────────────┘            │   │
│  │                                        │                                          │   │
│  └────────────────────────────────────────┼──────────────────────────────────────────┘   │
│                                           ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│  │                        ① DATA COLLECTION LAYER                                    │   │
│  │                                                                                   │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │   │
│  │  │  recordValue()  │  │  batchRecord()  │  │ trackProgress() │                  │   │
│  │  │  Single metric  │  │  Up to 1000/req │  │ Funnel events   │                  │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                  │   │
│  │           │                    │                     │                            │   │
│  └───────────┼────────────────────┼─────────────────────┼────────────────────────────┘   │
│              │                    │                     │                                 │
│              ▼                    ▼                     ▼                                 │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│  │                        ② STORAGE & AGGREGATION LAYER                              │   │
│  │                                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                        PostgreSQL (Drizzle ORM)                             │   │   │
│  │  │                                                                            │   │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  │   │   │
│  │  │  │   metric_    │  │   metric_    │  │   metric_   │  │  analytics_  │  │   │   │
│  │  │  │ definitions  │  │   values     │  │ dashboards  │  │   funnels    │  │   │   │
│  │  │  └──────────────┘  └──────────────┘  └─────────────┘  └──────────────┘  │   │   │
│  │  │                                                                            │   │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  │   │   │
│  │  │  │  analytics_  │  │  analytics_  │  │ analytics_  │  │  analytics_  │  │   │   │
│  │  │  │   cohorts    │  │   insights   │  │  reports    │  │ alert_events │  │   │   │
│  │  │  └──────────────┘  └──────────────┘  └─────────────┘  └──────────────┘  │   │   │
│  │  │                                                                            │   │   │
│  │  └────────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                   │   │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                          Redis Cache Layer                                  │   │   │
│  │  │                                                                             │   │   │
│  │  │  • Metric value caching (configurable TTL per metric, default 5 min)       │   │   │
│  │  │  • Real-time metric streaming via pub/sub                                   │   │   │
│  │  │  • Dashboard widget data cache                                              │   │   │
│  │  │  • Rate limiting counters                                                   │   │   │
│  │  └────────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                   │   │
│  └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                           │                                              │
│                                           ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│  │                        ③ QUERY & ANALYSIS LAYER                                   │   │
│  │                                                                                   │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐                  │   │
│  │  │  Time Series    │  │  Aggregation    │  │  Comparison      │                  │   │
│  │  │  query()        │  │  aggregate()    │  │  compare()       │                  │   │
│  │  │                 │  │                 │  │                  │                  │   │
│  │  │  • Granularity  │  │  • sum/avg/     │  │  • Period vs     │                  │   │
│  │  │    bucketing    │  │    min/max/cnt  │  │    period        │                  │   │
│  │  │  • Dimension    │  │  • Group by     │  │  • Absolute &    │                  │   │
│  │  │    filtering    │  │    dimension    │  │    % change      │                  │   │
│  │  └─────────────────┘  └─────────────────┘  └──────────────────┘                  │   │
│  │                                                                                   │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐                  │   │
│  │  │  Funnel         │  │  Cohort         │  │  Correlation     │                  │   │
│  │  │  analyze()      │  │  retention()    │  │  findCorr()      │                  │   │
│  │  │                 │  │                 │  │                  │                  │   │
│  │  │  • Step conv.   │  │  • Retention    │  │  • Pearson r     │                  │   │
│  │  │  • Drop-off     │  │    matrix       │  │  • Lagged corr   │                  │   │
│  │  │  • Segments     │  │  • LTV calc     │  │  • Multi-metric  │                  │   │
│  │  └─────────────────┘  └─────────────────┘  └──────────────────┘                  │   │
│  │                                                                                   │   │
│  └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                           │                                              │
│                                           ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│  │                        ④ INTELLIGENCE LAYER                                       │   │
│  │                                                                                   │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐                  │   │
│  │  │  Anomaly        │  │  Trend          │  │  AI Insights     │                  │   │
│  │  │  Detection      │  │  Analysis       │  │  Engine          │                  │   │
│  │  │                 │  │                 │  │                  │                  │   │
│  │  │  • Z-score      │  │  • Linear reg   │  │  • @mcv/ai       │                  │   │
│  │  │  • Isolation    │  │  • R² conf.     │  │    integration   │                  │   │
│  │  │    forest       │  │  • Projections  │  │  • Auto-recs     │                  │   │
│  │  │  • Prophet      │  │  • Seasonality  │  │  • Impact est.   │                  │   │
│  │  └─────────────────┘  └─────────────────┘  └──────────────────┘                  │   │
│  │                                                                                   │   │
│  └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                           │                                              │
│                                           ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│  │                        ⑤ VISUALIZATION & DELIVERY LAYER                           │   │
│  │                                                                                   │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐                  │   │
│  │  │  Dashboards     │  │  Reports        │  │  Alerts          │                  │   │
│  │  │                 │  │                 │  │                  │                  │   │
│  │  │  • 12-col grid  │  │  • PDF/Excel/   │  │  • Email         │                  │   │
│  │  │  • 11 chart     │  │    CSV/HTML/    │  │  • Slack          │                  │   │
│  │  │    types        │  │    JSON         │  │  • PagerDuty      │                  │   │
│  │  │  • Real-time    │  │  • Scheduled    │  │  • Webhook        │                  │   │
│  │  │    refresh      │  │  • Email/Slack  │  │  • Cooldown       │                  │   │
│  │  │  • Sharing      │  │    delivery     │  │  • Snooze         │                  │   │
│  │  └─────────────────┘  └─────────────────┘  └──────────────────┘                  │   │
│  │                                                                                   │   │
│  └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

External Dependencies:
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  @mcv/kernel  │  @mcv/events  │  @mcv/storage  │  @mcv/ai  │  @mcv/comms  │  @mcv/db   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Key Tables | Primary Operations |
|--------|---------|------------|-------------------|
| **metrics** | Custom KPI definitions, computation, thresholds, alerting | `metric_definitions`, `metric_values`, `analytics_metric_alerts` | Define, record, query, compare, aggregate |
| **dashboards** | Interactive grid-based dashboard builder with widgets | `metric_dashboards`, `analytics_dashboards`, `analytics_dashboard_widgets` | Create, add widgets, render, share, snapshot |
| **funnels** | Conversion funnel tracking with step-by-step analysis | `analytics_funnels`, `analytics_funnel_steps`, `analytics_funnel_conversions` | Define, track, analyze, detect drop-offs |
| **cohorts** | User cohort analysis for retention and LTV | `analytics_cohort_definitions`, `analytics_cohorts`, `analytics_cohort_retention` | Define, compute, retention matrix, LTV, churn prediction |
| **insights** | AI-powered anomaly detection, trends, and recommendations | `analytics_insights`, `analytics_insight_rules`, `analytics_anomaly_models` | Feed, detect anomalies, analyze trends, find correlations |
| **reports** | Scheduled and ad-hoc multi-format report generation | `analytics_report_templates`, `analytics_report_schedules`, `analytics_generated_reports` | Create template, generate, schedule, deliver |

---

## Module: metrics

### Purpose

Defines custom metrics and KPIs with flexible calculation methods, multi-granularity aggregation, dimensional breakdowns, threshold-based alerting, and real-time streaming. Supports five metric types: **counter**, **gauge**, **histogram**, **rate**, and **derived** (computed from other metrics via formula).

### Metric Types

| Type | Behavior | Example | Default Aggregation |
|------|----------|---------|-------------------|
| **counter** | Monotonically increasing; values are summed into buckets | Total signups, page views | `sum` |
| **gauge** | Point-in-time measurement; latest value overwrites | Active users, cart value | Last value |
| **histogram** | Distribution tracking; records min/max/sum/count | Response times, order values | `avg` |
| **rate** | Calculated ratio over time windows | Conversion rate, churn rate | `avg` |
| **derived** | Formula computed from other metrics | ARPU = revenue / users | Depends on formula |

### Aggregation Methods

| Method | Description | SQL Equivalent |
|--------|-------------|---------------|
| `sum` | Sum of all values in bucket | `SUM(value)` |
| `count` | Number of data points | `COUNT(*)` |
| `avg` | Arithmetic mean | `AVG(value)` |
| `min` | Minimum value | `MIN(value)` |
| `max` | Maximum value | `MAX(value)` |
| `distinct_count` | Count of unique values | `COUNT(DISTINCT value)` |
| `p50` / `p90` / `p95` / `p99` | Percentile calculations | `PERCENTILE_CONT(0.5)` |
| `weighted_avg` | Weighted average | Custom |
| `sma` / `ema` | Simple / Exponential moving average | Custom |

### Granularity Levels

Time-series data is bucketed at multiple granularity levels simultaneously for fast querying at any zoom:

```
minute → hour → day → week → month → quarter → year
```

When recording a value, the system upserts into **all** granularity levels at once, maintaining pre-aggregated rollups:

```sql
-- Gauge: latest value replaces
-- Counter: value is accumulated
INSERT INTO analytics_metric_values (...)
ON CONFLICT (venture_id, metric_id, timestamp, granularity, dimension_values)
DO UPDATE SET
  value = CASE
    WHEN type = 'gauge' THEN $new_value
    ELSE analytics_metric_values.value + $new_value
  END,
  count = analytics_metric_values.count + 1,
  min = LEAST(analytics_metric_values.min, $new_value),
  max = GREATEST(analytics_metric_values.max, $new_value)
```

### Database Schema (Implemented)

The following schema is the **production implementation** from `packages/db/src/schema/metrics.ts`:

```typescript
// packages/db/src/schema/metrics.ts — PRODUCTION SCHEMA

export const metricDefinitions = pgTable(
  'metric_definitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    ventureId: uuid('venture_id')
      .notNull()
      .references(() => ventures.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    type: text('type').notNull(),                     // 'counter' | 'gauge' | 'histogram' | 'rate'
    category: text('category').notNull(),             // 'revenue' | 'engagement' | 'acquisition' | ...
    unit: text('unit'),                               // 'users', 'USD', '%', 'ms'
    format: text('format'),                           // 'number', 'currency', 'percent', 'duration'
    isActive: boolean('is_active').notNull().default(true),
    dimensions: jsonb('dimensions').$type<string[]>(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('metric_def_venture_slug_idx').on(table.ventureId, table.slug),
    index('metric_def_venture_idx').on(table.ventureId),
    index('metric_def_category_idx').on(table.category),
    index('metric_def_type_idx').on(table.type),
  ]
);

export const metricValues = pgTable(
  'metric_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    metricId: uuid('metric_id')
      .notNull()
      .references(() => metricDefinitions.id, { onDelete: 'cascade' }),

    value: doublePrecision('value').notNull(),
    dimensions: jsonb('dimensions').$type<Record<string, string>>(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('metric_values_metric_idx').on(table.metricId),
    index('metric_values_timestamp_idx').on(table.metricId, table.timestamp),
  ]
);

export const metricDashboards = pgTable(
  'metric_dashboards',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    ventureId: uuid('venture_id')
      .notNull()
      .references(() => ventures.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    description: text('description'),
    layout: jsonb('layout').$type<DashboardLayoutItem[]>().notNull().default([]),
    widgets: jsonb('widgets').$type<unknown[]>().notNull().default([]),
    isDefault: boolean('is_default').notNull().default(false),
    isShared: boolean('is_shared').notNull().default(false),
    createdBy: uuid('created_by').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('metric_dashboards_venture_idx').on(table.ventureId),
  ]
);
```

**Inferred TypeScript Types:**

```typescript
export type MetricDefinitionRow = typeof metricDefinitions.$inferSelect;
export type NewMetricDefinitionRow = typeof metricDefinitions.$inferInsert;
export type MetricValueRow = typeof metricValues.$inferSelect;
export type NewMetricValueRow = typeof metricValues.$inferInsert;
export type MetricDashboardRow = typeof metricDashboards.$inferSelect;
export type NewMetricDashboardRow = typeof metricDashboards.$inferInsert;
```

**Relations:**

```typescript
export const metricDefinitionsRelations = relations(metricDefinitions, ({ one, many }) => ({
  venture: one(ventures, {
    fields: [metricDefinitions.ventureId],
    references: [ventures.id],
  }),
  values: many(metricValues),
}));

export const metricValuesRelations = relations(metricValues, ({ one }) => ({
  metric: one(metricDefinitions, {
    fields: [metricValues.metricId],
    references: [metricDefinitions.id],
  }),
}));

export const metricDashboardsRelations = relations(metricDashboards, ({ one }) => ({
  venture: one(ventures, {
    fields: [metricDashboards.ventureId],
    references: [ventures.id],
  }),
}));
```

### Extended Schema (Spec — Phase 2)

The full spec extends the production schema with additional tables for alerts, alert events, and multi-granularity pre-aggregation:

```typescript
// Future: analytics_metric_alerts
export const metricAlerts = pgTable('analytics_metric_alerts', {
  ...baseColumns,
  metricId: uuid('metric_id').references(() => metricDefinitions.id).notNull(),
  name: text('name').notNull(),
  condition: jsonb('condition').notNull(),         // { type, operator, value, window, consecutiveBreaches }
  channels: jsonb('channels').notNull(),           // [{ type: 'email', recipients: [...] }, ...]
  isActive: boolean('is_active').default(true),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  currentState: text('current_state').default('ok'),  // ok | warning | critical
  snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),
  cooldownMinutes: integer('cooldown_minutes').default(60),
  notifyOnResolve: boolean('notify_on_resolve').default(true),
});

// Future: analytics_metric_alert_events
export const metricAlertEvents = pgTable('analytics_metric_alert_events', {
  ...baseColumns,
  alertId: uuid('alert_id').references(() => metricAlerts.id).notNull(),
  eventType: text('event_type').notNull(),         // triggered | resolved | snoozed | acknowledged
  previousState: text('previous_state'),
  newState: text('new_state'),
  metricValue: numeric('metric_value', { precision: 20, scale: 6 }),
  thresholdValue: numeric('threshold_value', { precision: 20, scale: 6 }),
  notificationsSent: jsonb('notifications_sent'),
  acknowledgedBy: uuid('acknowledged_by'),
  notes: text('notes'),
});
```

### Validation Schemas (Zod)

From `packages/api/src/schemas/analytics.schema.ts`:

```typescript
// Metric types
export const metricTypeSchema = z.enum(['counter', 'gauge', 'histogram', 'rate']);
export const granularitySchema = z.enum(['hour', 'day', 'week', 'month']);
export const aggregationSchema = z.enum(['sum', 'avg', 'count', 'min', 'max']);
export const metricCategorySchema = z.enum([
  'revenue', 'engagement', 'acquisition', 'retention',
  'performance', 'operational', 'custom',
]);

// Create metric input
export const createMetricInputSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100)
    .regex(/^[a-z0-9_-]+$/, 'Slug must be lowercase alphanumeric with hyphens/underscores'),
  description: z.string().max(1000).optional(),
  type: metricTypeSchema,
  category: metricCategorySchema,
  unit: z.string().max(50).optional(),
  format: z.string().max(50).optional(),
  dimensions: z.array(z.string().max(100)).max(20).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Record a single value
export const metricEntrySchema = z.object({
  metricId: uuidSchema,
  value: z.number(),
  dimensions: z.record(z.string(), z.string()).optional(),
  timestamp: z.coerce.date().optional(),
});

// Time-series query
export const metricQueryParamsSchema = z.object({
  metricId: uuidSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  granularity: granularitySchema.default('day'),
  dimensions: z.record(z.string(), z.string()).optional(),
  aggregation: aggregationSchema.default('sum'),
});

// Multi-metric aggregation
export const aggregationParamsSchema = z.object({
  metricIds: z.array(uuidSchema).min(1).max(50),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  aggregation: aggregationSchema.default('sum'),
  groupBy: z.string().optional(),
});
```

### Service Implementation

The `MetricsService` class (from `packages/api/src/services/metrics.service.ts`) is a venture-scoped service that enforces tenant isolation on every operation:

```typescript
export class MetricsService {
  private db: typeof db;
  private ventureId: string;

  constructor(ventureId: string, dbInstance?: typeof db) {
    this.ventureId = ventureId;
    this.db = dbInstance ?? db;
  }

  // ── Query time-series ──────────────────────────────────────────────
  async query(params: MetricQueryParams): Promise<MetricTimeSeries> {
    // 1. Verify metric belongs to this venture
    // 2. Fetch raw values in date range
    // 3. Apply dimension filters (jsonb, app-layer)
    // 4. Group into granularity buckets via getBucketKey()
    // 5. Aggregate each bucket (sum/avg/count/min/max)
    // 6. Compute summary statistics (min, max, avg, total)
    // 7. Return { metric, points[], summary }
  }

  // ── Time bucketing ─────────────────────────────────────────────────
  private getBucketKey(timestamp: Date, granularity: string): string {
    const d = new Date(timestamp);
    switch (granularity) {
      case 'hour':  d.setMinutes(0, 0, 0);         return d.toISOString();
      case 'day':   d.setHours(0, 0, 0, 0);        return d.toISOString();
      case 'week':  /* truncate to week start */    return d.toISOString();
      case 'month': d.setDate(1); d.setHours(0,0,0,0); return d.toISOString();
      default:      d.setHours(0, 0, 0, 0);        return d.toISOString();
    }
  }

  // ── Aggregation engine ─────────────────────────────────────────────
  private aggregateValues(values: number[], aggregation: string): number {
    if (values.length === 0) return 0;
    switch (aggregation) {
      case 'sum':   return values.reduce((a, b) => a + b, 0);
      case 'avg':   return values.reduce((a, b) => a + b, 0) / values.length;
      case 'count': return values.length;
      case 'min':   return Math.min(...values);
      case 'max':   return Math.max(...values);
      default:      return values.reduce((a, b) => a + b, 0);
    }
  }
}

export function createMetricsService(ventureId: string): MetricsService {
  return new MetricsService(ventureId);
}
```

### Key Metric Operations

| Operation | Method | Input | Output |
|-----------|--------|-------|--------|
| List definitions | `listDefinitions()` | category?, type?, isActive?, search? | `PaginatedResponse<MetricDefinition>` |
| Create definition | `createDefinition()` | name, slug, type, category, ... | `MetricDefinition` |
| Update definition | `updateDefinition()` | id, partial fields | `MetricDefinition` |
| Delete definition | `deleteDefinition()` | id | `void` (cascades values) |
| Record value | `recordValue()` | metricId, value, dimensions?, timestamp? | `void` |
| Batch record | `batchRecord()` | entries[] (max 1000) | `void` |
| Query time series | `query()` | metricId, startDate, endDate, granularity | `MetricTimeSeries` |
| Get latest | `getLatest()` | metricId | `MetricValue \| null` |
| Compare periods | `compare()` | metricId, periods[] (2-10) | `ComparisonResult` |
| Aggregate | `aggregate()` | metricIds[], dateRange, aggregation | `AggregatedMetric[]` |
| Stream real-time | `streamMetrics()` | slugs[], callback | Unsubscribe function |
| Top movers | `getTopMovers()` | limit?, category?, direction? | Change analysis[] |

---

## Module: dashboards

### Purpose

Interactive dashboard builder with a 12-column grid layout system, drag-and-drop widget positioning, 11 chart types, configurable data sources, sharing/permissions, scheduled snapshots, and annotations. Dashboards support real-time data refresh, multiple visibility levels (private/team/venture/public), and password protection for public links.

### Widget Types

| Type | Description | Best For |
|------|-------------|----------|
| `metric` | Single KPI value with comparison | Revenue, active users |
| `chart` | Multi-series visualization (line/bar/area/pie/donut/scatter/heatmap/treemap/sankey/radar/gauge) | Time series, distributions |
| `table` | Tabular data with sorting/filtering | Detailed breakdowns |
| `funnel` | Embedded funnel visualization | Conversion flows |
| `cohort` | Retention heatmap | Cohort retention |
| `map` | Geographic distribution | Regional analytics |
| `leaderboard` | Ranked list with bars | Top N items |
| `text` | Rich text annotation | Notes, context |
| `image` | Static image embed | Logos, diagrams |
| `iframe` | External content embed | Third-party tools |
| `countdown` | Timer to target date | Launch dates, deadlines |

### Chart Types

```
line  │  bar  │  area  │  pie  │  donut  │  scatter
heatmap  │  treemap  │  sankey  │  radar  │  gauge
```

### Dashboard Visibility Levels

```
private  →  Only the owner can view
team     →  All members of the specified team
venture  →  All members of the venture
public   →  Anyone with the link (optional password)
```

### Database Schema (Spec)

```typescript
export const dashboards = pgTable('analytics_dashboards', {
  ...baseColumns,
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').notNull(),
  teamId: uuid('team_id'),
  visibility: dashboardVisibilityEnum('visibility').default('private'),
  sharedWith: jsonb('shared_with'),                   // { users: [], teams: [], editors: [] }
  publicSlug: text('public_slug').unique(),
  password: text('password'),                         // Hashed, for public dashboards
  layout: jsonb('layout'),                            // { columns: 12, rowHeight: 50, breakpoints: {...} }
  theme: text('theme').default('light'),
  refreshInterval: integer('refresh_interval_seconds'),
  timezone: text('timezone'),
  dateRange: jsonb('date_range'),                     // Default: { type: 'relative', value: 'last_7_days' }
  filters: jsonb('filters'),                          // Global filters applied to all widgets
  isDefault: boolean('is_default').default(false),
  isArchived: boolean('is_archived').default(false),
  viewCount: integer('view_count').default(0),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
});

export const dashboardWidgets = pgTable('analytics_dashboard_widgets', {
  ...baseColumns,
  dashboardId: uuid('dashboard_id').references(() => dashboards.id, { onDelete: 'cascade' }),
  title: text('title'),
  subtitle: text('subtitle'),
  type: widgetTypeEnum('type').notNull(),
  chartType: chartTypeEnum('chart_type'),
  position: jsonb('position').notNull(),              // { x, y, w, h, minW, minH, maxW, maxH }
  dataSource: jsonb('data_source').notNull(),         // { type: 'metric'|'query'|'api', metricId?, ... }
  options: jsonb('options'),                          // { showLegend, stacked, colors, xAxis, yAxis, ... }
  filters: jsonb('filters'),                          // Widget-specific filter overrides
  comparison: jsonb('comparison'),                    // { enabled, type: 'previous_period', showDelta }
  drilldown: jsonb('drilldown'),                      // { enabled, dimensions[], link }
  displayOrder: integer('display_order').default(0),
  isVisible: boolean('is_visible').default(true),
  cacheTtlSeconds: integer('cache_ttl_seconds'),
});

export const dashboardSnapshots = pgTable('analytics_dashboard_snapshots', {
  ...baseColumns,
  dashboardId: uuid('dashboard_id').references(() => dashboards.id),
  name: text('name').notNull(),
  snapshotData: jsonb('snapshot_data').notNull(),     // Full dashboard+widget data at point-in-time
  thumbnailUrl: text('thumbnail_url'),
  isScheduled: boolean('is_scheduled').default(false),
  scheduleConfig: jsonb('schedule_config'),           // { frequency, dayOfWeek, hour, timezone }
  deliveryConfig: jsonb('delivery_config'),           // { email: {...}, slack: {...} }
});

export const dashboardAnnotations = pgTable('analytics_dashboard_annotations', {
  ...baseColumns,
  dashboardId: uuid('dashboard_id').references(() => dashboards.id),
  widgetId: uuid('widget_id').references(() => dashboardWidgets.id),
  title: text('title').notNull(),
  description: text('description'),
  annotationType: text('annotation_type').default('note'),  // note | event | milestone | alert
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  endTimestamp: timestamp('end_timestamp', { withTimezone: true }),
  color: text('color'),
  showOnChart: boolean('show_on_chart').default(true),
});
```

### Dashboard Data Resolution

When rendering a dashboard, the service resolves the date range from widget/dashboard configuration using intelligent defaults:

| Relative Range | Start | End |
|---------------|-------|-----|
| `today` | Midnight today | Now |
| `yesterday` | Midnight yesterday | 23:59:59 yesterday |
| `last_7_days` | Now − 7d | Now |
| `last_30_days` | Now − 30d | Now |
| `this_month` | 1st of month | Now |
| `last_month` | 1st of prev month | Last day of prev month |
| `this_year` | Jan 1 | Now |

**Auto-granularity selection** based on date range width:

| Range Width | Granularity |
|-------------|-------------|
| ≤ 1 day | `hour` |
| ≤ 7 days | `hour` |
| ≤ 90 days | `day` |
| ≤ 365 days | `week` |
| > 365 days | `month` |

### Key Dashboard Operations

| Operation | Method | Description |
|-----------|--------|-------------|
| Create | `create()` | New dashboard with default grid layout |
| Get with data | `getWithData()` | Fetch dashboard + all widget data (parallel) |
| Add widget | `addWidget()` | Insert widget with position/dataSource/options |
| Update positions | `updateWidgetPositions()` | Batch drag-and-drop position update |
| Duplicate | `duplicate()` | Deep-clone dashboard + all widgets (transaction) |
| Share | `share()` | Set visibility, share with users/teams, generate public slug |
| Snapshot | `createSnapshot()` | Capture full point-in-time data for scheduled delivery |

---

## Module: funnels

### Purpose

Conversion funnel tracking and visualization with ordered step-by-step analysis, drop-off detection, time constraints between steps, A/B test variant tracking, attribution modeling, and AI-powered drop-off reason analysis. Funnels answer the question: *"Where and why are users failing to convert?"*

### Funnel Concepts

**Completion Types:**
- `ordered` — Steps must be completed in sequence (strict funnel)
- `any` — Steps can be completed in any order
- `all` — All steps must be completed, order doesn't matter

**Conversion Window:** Maximum time (in hours) between entering the funnel and final conversion. Default: 168 hours (7 days).

**Attribution Models:** `first_touch`, `last_touch`, `linear`, `time_decay`

### Database Schema (Spec)

```typescript
export const funnels = pgTable('analytics_funnels', {
  ...baseColumns,
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  category: text('category'),
  status: funnelStatusEnum('status').default('draft'),    // draft | active | paused | archived
  completionType: stepCompletionEnum('completion_type').default('ordered'),
  conversionWindow: integer('conversion_window_hours').default(168),
  attributionModel: text('attribution_model').default('first_touch'),
  ownerId: uuid('owner_id'),
  // Cached aggregate stats
  totalEntered: integer('total_entered').default(0),
  totalConverted: integer('total_converted').default(0),
  overallConversionRate: numeric('overall_conversion_rate', { precision: 10, scale: 4 }),
  avgTimeToConvert: integer('avg_time_to_convert_seconds'),
  lastAnalyzedAt: timestamp('last_analyzed_at', { withTimezone: true }),
});

export const funnelSteps = pgTable('analytics_funnel_steps', {
  ...baseColumns,
  funnelId: uuid('funnel_id').references(() => funnels.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  eventType: text('event_type').notNull(),           // e.g., 'page_view', 'button_click'
  eventFilters: jsonb('event_filters'),              // { "page": { "eq": "/signup" } }
  stepOrder: integer('step_order').notNull(),
  isRequired: boolean('is_required').default(true),
  maxSecondsFromPrevious: integer('max_seconds_from_previous'),
  // Cached stats
  enteredCount: integer('entered_count').default(0),
  completedCount: integer('completed_count').default(0),
  conversionRate: numeric('conversion_rate', { precision: 10, scale: 4 }),
  dropOffRate: numeric('drop_off_rate', { precision: 10, scale: 4 }),
  avgTimeToComplete: integer('avg_time_to_complete_seconds'),
  // A/B test variants
  variants: jsonb('variants'),                       // [{ id, name, filters }]
});

export const funnelConversions = pgTable('analytics_funnel_conversions', {
  ...baseColumns,
  funnelId: uuid('funnel_id').references(() => funnels.id),
  userId: uuid('user_id'),
  anonymousId: text('anonymous_id'),
  sessionId: text('session_id'),
  enteredAt: timestamp('entered_at', { withTimezone: true }).notNull(),
  convertedAt: timestamp('converted_at', { withTimezone: true }),
  currentStepOrder: integer('current_step_order').default(1),
  completedSteps: integer('completed_steps').array(),
  stepTimestamps: jsonb('step_timestamps'),          // { step_id: ISO timestamp }
  isConverted: boolean('is_converted').default(false),
  isAbandoned: boolean('is_abandoned').default(false),
  abandonedAtStep: integer('abandoned_at_step'),
  // Attribution
  source: text('source'),
  medium: text('medium'),
  campaign: text('campaign'),
  // Context
  device: text('device'),
  browser: text('browser'),
  country: text('country'),
  variantId: text('variant_id'),
  conversionValue: numeric('conversion_value', { precision: 19, scale: 4 }),
  properties: jsonb('properties'),
});

export const funnelDropoffReasons = pgTable('analytics_funnel_dropoff_reasons', {
  ...baseColumns,
  funnelId: uuid('funnel_id').references(() => funnels.id),
  stepId: uuid('step_id').references(() => funnelSteps.id),
  reason: text('reason').notNull(),
  category: text('category'),                        // ux | technical | pricing | etc.
  frequency: integer('frequency').default(0),
  percentage: numeric('percentage', { precision: 5, scale: 2 }),
  isAiDetected: boolean('is_ai_detected').default(false),
  confidence: numeric('confidence', { precision: 5, scale: 4 }),
  recommendations: jsonb('recommendations'),
});
```

### Funnel Analysis Output

The `analyze()` method returns a comprehensive `FunnelAnalysis` object:

```typescript
interface FunnelAnalysis {
  funnel: Funnel;
  steps: Array<{
    step: FunnelStep;
    entered: number;                    // Users who reached this step
    completed: number;                  // Users who completed this step
    conversionRate: number;             // % of previous step's users
    dropOffRate: number;                // 100 - conversionRate
    avgTimeSeconds: number;             // Average time to complete
    byVariant?: Record<string, {        // A/B test breakdown
      entered: number;
      completed: number;
      conversionRate: number;
    }>;
  }>;
  overall: {
    totalEntered: number;
    totalConverted: number;
    overallConversionRate: number;       // End-to-end conversion %
    avgTimeToConvert: number;
    bottleneckStep: string;              // Step with lowest conversion
    biggestDropoff: {
      step: string;
      rate: number;
    };
  };
  trends: {
    daily: Array<{
      date: string;
      entered: number;
      converted: number;
      rate: number;
    }>;
  };
  segments: Record<string, {            // e.g., "source:organic"
    entered: number;
    converted: number;
    rate: number;
  }>;
}
```

### Key Funnel Operations

| Operation | Method | Description |
|-----------|--------|-------------|
| Create funnel | `create()` | Define funnel + steps in a single transaction |
| Track progress | `trackProgress()` | Record user entering/advancing through funnel |
| Analyze | `analyze()` | Full step-by-step performance analysis |
| Drop-off analysis | `getDropoffAnalysis()` | Patterns + AI-powered reasons for abandonment |

---

## Module: cohorts

### Purpose

User cohort analysis for retention tracking, behavioral segmentation, lifetime value (LTV) calculation, and churn prediction. Supports four cohort types: **acquisition** (by signup date), **behavioral** (by action patterns), **revenue** (by purchase behavior), and **custom** (arbitrary criteria). The retention matrix visualization is the signature output.

### Cohort Types

| Type | Grouping Criteria | Example |
|------|------------------|---------|
| **acquisition** | Users grouped by when they signed up | "Jan 2026 signups" |
| **behavioral** | Users grouped by actions within a window | "Users who purchased within 7 days" |
| **revenue** | Users grouped by spending patterns | "Users with LTV > $100" |
| **custom** | Arbitrary event-based criteria | "Users from organic + mobile" |

### Database Schema (Spec)

```typescript
export const cohortDefinitions = pgTable('analytics_cohort_definitions', {
  ...baseColumns,
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  type: cohortTypeEnum('type').notNull(),             // acquisition | behavioral | revenue | custom
  period: cohortPeriodEnum('period').default('month'), // day | week | month | quarter | year
  criteria: jsonb('criteria').notNull(),
  /*  Acquisition: { event: "user.created", filters: { "source": { "in": ["organic"] } } }
      Behavioral:  { event: "purchase.completed", within_days: 7, count: { "gte": 1 } }  */
  retentionEvent: text('retention_event').notNull(),   // Event that counts as "retained"
  retentionFilters: jsonb('retention_filters'),
  revenueEvent: text('revenue_event'),                 // For LTV tracking
  revenueField: text('revenue_field'),                 // e.g., "amount"
  isActive: boolean('is_active').default(true),
  lookbackPeriods: integer('lookback_periods').default(12),
  lastComputedAt: timestamp('last_computed_at', { withTimezone: true }),
});

export const cohorts = pgTable('analytics_cohorts', {
  ...baseColumns,
  definitionId: uuid('definition_id').references(() => cohortDefinitions.id),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  periodLabel: text('period_label').notNull(),        // "Jan 2026", "Week 5 2026"
  userCount: integer('user_count').default(0),
  totalRevenue: numeric('total_revenue', { precision: 19, scale: 4 }).default('0'),
  avgRevenue: numeric('avg_revenue', { precision: 19, scale: 4 }).default('0'),
  // LTV at different horizons
  ltv30:  numeric('ltv_30',  { precision: 19, scale: 4 }),
  ltv60:  numeric('ltv_60',  { precision: 19, scale: 4 }),
  ltv90:  numeric('ltv_90',  { precision: 19, scale: 4 }),
  ltv180: numeric('ltv_180', { precision: 19, scale: 4 }),
  ltv365: numeric('ltv_365', { precision: 19, scale: 4 }),
  churnedCount: integer('churned_count').default(0),
  churnRate: numeric('churn_rate', { precision: 5, scale: 2 }),
});

export const cohortRetention = pgTable('analytics_cohort_retention', {
  ...baseColumns,
  cohortId: uuid('cohort_id').references(() => cohorts.id),
  periodOffset: integer('period_offset').notNull(),   // 0 = cohort period, 1 = first after, ...
  periodLabel: text('period_label'),                   // "Week 1", "Month 2"
  retainedCount: integer('retained_count').default(0),
  retentionRate: numeric('retention_rate', { precision: 5, scale: 2 }),
  activeCount: integer('active_count').default(0),
  revenue: numeric('revenue', { precision: 19, scale: 4 }).default('0'),
  payingUsers: integer('paying_users').default(0),
  arpu: numeric('arpu', { precision: 19, scale: 4 }),
});

export const cohortMembers = pgTable('analytics_cohort_members', {
  ...baseColumns,
  cohortId: uuid('cohort_id').references(() => cohorts.id),
  userId: uuid('user_id').notNull(),
  entryDate: timestamp('entry_date', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').default(true),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  isChurned: boolean('is_churned').default(false),
  churnedAt: timestamp('churned_at', { withTimezone: true }),
  totalRevenue: numeric('total_revenue', { precision: 19, scale: 4 }).default('0'),
  transactionCount: integer('transaction_count').default(0),
  segments: text('segments').array(),
});
```

### Retention Matrix

The `getRetentionMatrix()` method returns data structured for heatmap visualization:

```typescript
interface RetentionMatrix {
  cohorts: Array<{
    label: string;           // "Jan 2026"
    startDate: Date;
    size: number;            // Users in cohort
    retention: number[];     // [100, 85, 72, 65, ...] — % retained at each period
    revenue: number[];       // Revenue at each period
  }>;
  periods: string[];          // ["Month 0", "Month 1", "Month 2", ...]
  averageRetention: number[]; // Average retention across all cohorts per period
}
```

**Visualization (conceptual):**

```
              Month 0   Month 1   Month 2   Month 3   Month 4   Month 5
Jan 2026     ████ 100%  ██░ 85%  ██░ 72%  █░░ 65%  █░░ 58%  █░░ 52%
Feb 2026     ████ 100%  ██░ 88%  ██░ 75%  █░░ 68%  █░░ 61%
Mar 2026     ████ 100%  ██░ 82%  ██░ 70%  █░░ 63%
Apr 2026     ████ 100%  ██░ 86%  ██░ 74%
May 2026     ████ 100%  ██░ 84%
Jun 2026     ████ 100%
─────────────────────────────────────────────────────────────────────
Average      ████ 100%  ██░ 85%  ██░ 73%  █░░ 65%  █░░ 60%  █░░ 52%
```

### Churn Prediction

The `predictChurnRisk()` method calculates a 0-100 risk score for each active cohort member:

| Risk Factor | Score Impact | Threshold |
|-------------|-------------|-----------|
| Inactive > 30 days | +40 | High risk |
| Inactive 14-30 days | +20 | Medium risk |
| No purchases | +30 | Revenue risk |
| Single purchase only | +15 | Low engagement |
| Not a power user | +10 | Engagement risk |

### Key Cohort Operations

| Operation | Method | Description |
|-----------|--------|-------------|
| Create definition | `createDefinition()` | Define cohort criteria + triggers initial compute |
| Compute cohorts | `computeCohorts()` | Run/refresh all cohort data for a definition |
| Retention matrix | `getRetentionMatrix()` | Heatmap-ready retention data |
| Calculate LTV | `calculateLTV()` | LTV at 30/60/90/180/365 day horizons |
| Compare cohorts | `compareCohorts()` | Side-by-side retention/revenue/LTV comparison |
| Predict churn | `predictChurnRisk()` | ML-powered churn risk per member |

---

## Module: insights

### Purpose

AI-powered analytics intelligence that automatically detects anomalies, analyzes trends, discovers correlations between metrics, generates predictions, and provides actionable recommendations. Insights are prioritized and delivered through a feed interface with lifecycle management (new → viewed → acknowledged → resolved/dismissed).

### Insight Types

| Type | Description | Trigger |
|------|-------------|---------|
| `anomaly` | Metric value significantly deviates from expected | Z-score > 2σ or ML model |
| `trend` | Sustained directional change in a metric | Linear regression R² > 0.7 |
| `correlation` | Two metrics are significantly correlated | \|Pearson r\| > 0.5 |
| `prediction` | Projected future values with confidence intervals | Time-series forecasting |
| `recommendation` | Actionable suggestion based on data patterns | Rule-based + AI |
| `alert` | Threshold breach on a metric | Configured alert rules |
| `milestone` | Metric reached a significant level | Target threshold crossed |
| `comparison` | Notable difference between segments or periods | Automated comparison |

### Insight Priority Levels

| Priority | Criteria | Notification |
|----------|----------|-------------|
| `critical` | Z-score > 4σ; revenue drop > 50% | Immediate (PagerDuty + email) |
| `high` | Z-score > 3σ; major trend shift | Email + Slack |
| `medium` | Z-score > 2.5σ; moderate trend | In-app feed |
| `low` | Z-score > 2σ; minor patterns | In-app feed only |

### Insight Lifecycle

```
new  →  viewed  →  acknowledged  →  resolved
                                  └→ dismissed (with reason)
```

Each transition records the user and timestamp for audit purposes.

### Database Schema (Spec)

```typescript
export const insights = pgTable('analytics_insights', {
  ...baseColumns,
  type: insightTypeEnum('type').notNull(),
  priority: insightPriorityEnum('priority').default('medium'),
  status: insightStatusEnum('status').default('new'),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  details: text('details'),
  // Linked entities
  metricId: uuid('metric_id'),
  dashboardId: uuid('dashboard_id'),
  funnelId: uuid('funnel_id'),
  cohortId: uuid('cohort_id'),
  // Analysis data
  data: jsonb('data'),                               // Type-specific payload (see below)
  confidence: numeric('confidence', { precision: 5, scale: 4 }),
  modelVersion: text('model_version'),
  recommendations: jsonb('recommendations'),          // [{ action, priority }]
  estimatedImpact: jsonb('estimated_impact'),         // { metric, value, unit, timeframe }
  // Lifecycle tracking
  viewedAt: timestamp('viewed_at', { withTimezone: true }),
  viewedBy: uuid('viewed_by'),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  acknowledgedBy: uuid('acknowledged_by'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by'),
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
  dismissedBy: uuid('dismissed_by'),
  dismissReason: text('dismiss_reason'),
  wasHelpful: boolean('was_helpful'),
  feedback: text('feedback'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isRecurring: boolean('is_recurring').default(false),
});

export const insightRules = pgTable('analytics_insight_rules', {
  ...baseColumns,
  name: text('name').notNull(),
  insightType: insightTypeEnum('insight_type').notNull(),
  triggerConditions: jsonb('trigger_conditions').notNull(),
  /*  { type: "metric_deviation", metric: "daily_revenue",
        threshold: { type: "percentage", value: 20 }, window: "1d" }  */
  priorityRules: jsonb('priority_rules'),
  titleTemplate: text('title_template').notNull(),
  summaryTemplate: text('summary_template').notNull(),
  isActive: boolean('is_active').default(true),
  cooldownMinutes: integer('cooldown_minutes').default(60),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
});

export const anomalyModels = pgTable('analytics_anomaly_models', {
  ...baseColumns,
  metricId: uuid('metric_id').notNull(),
  modelType: text('model_type').notNull(),           // prophet | isolation_forest | lstm
  modelState: jsonb('model_state'),                  // Serialized model parameters
  lastTrainedAt: timestamp('last_trained_at', { withTimezone: true }),
  trainingDataPoints: integer('training_data_points'),
  maeScore: numeric('mae_score', { precision: 10, scale: 6 }),
  rmseScore: numeric('rmse_score', { precision: 10, scale: 6 }),
  sensitivity: numeric('sensitivity', { precision: 3, scale: 2 }).default('0.95'),
  minConfidence: numeric('min_confidence', { precision: 3, scale: 2 }).default('0.80'),
});
```

### Anomaly Detection

The system uses a multi-strategy approach:

1. **Z-Score** (immediate, production): Simple statistical deviation from rolling mean
2. **Prophet** (planned): Facebook's time-series decomposition for seasonal data
3. **Isolation Forest** (planned): Unsupervised ML for multivariate anomalies
4. **LSTM** (planned): Deep learning for complex temporal patterns

Current production implementation:

```typescript
// Z-score anomaly detection
const nums = values.map(v => Number(v.value));
const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
const stdDev = Math.sqrt(
  nums.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / nums.length
);

const latestValue = nums[nums.length - 1];
const zScore = (latestValue - mean) / stdDev;

// Severity classification
const severity =
  Math.abs(zScore) > 4   ? 'critical' :
  Math.abs(zScore) > 3   ? 'high' :
  Math.abs(zScore) > 2.5 ? 'medium' :
  'low';
```

### Trend Analysis

Uses ordinary least squares (OLS) linear regression with R² confidence scoring:

```typescript
// Linear regression for trend direction and strength
const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
const intercept = (sumY - slope * sumX) / n;

// R² (coefficient of determination) for confidence
const r2 = 1 - (ssResidual / ssTotal);

// Projections with confidence intervals (±1.96 std error)
const projections = [7, 14, 30].map(daysAhead => ({
  period: `${daysAhead}d`,
  value: Math.max(0, slope * (n + daysAhead) + intercept),
  confidence: {
    low: Math.max(0, projected - 1.96 * stdError),
    high: projected + 1.96 * stdError,
  },
}));
```

### Correlation Discovery

Pearson correlation coefficient with lag support:

```typescript
// Find correlated metrics (|r| > 0.5) with lag 0, 1, 3, 7 days
for (const lag of [0, 1, 3, 7]) {
  const r = pearsonCorrelation(sourceValues, targetValues, lag);
  if (Math.abs(r) > 0.5) {
    correlations.push({
      metricId: metric.id,
      metricName: metric.name,
      correlation: r,
      lag,
      relationship: r > 0 ? 'positive' : 'negative',
    });
  }
}
```

### Key Insight Operations

| Operation | Method | Description |
|-----------|--------|-------------|
| Get feed | `getInsightsFeed()` | Priority-sorted insights with filters |
| Detect anomalies | `detectAnomalies()` | Z-score analysis for a single metric |
| Analyze trends | `analyzeTrends()` | Linear regression + projections |
| Find correlations | `findCorrelations()` | Pearson r across all metrics with lag |
| Create insight | `createInsight()` | Manually create an insight record |
| Update status | `updateInsightStatus()` | Transition lifecycle + record feedback |
| Run scheduled | `runScheduledAnalysis()` | Cron: batch all metrics for anomalies + trends |

---

## Module: reports

### Purpose

Scheduled and ad-hoc report generation engine with customizable templates, multiple export formats (PDF, Excel, CSV, HTML, JSON), email/Slack delivery, and retention policies. Reports can be generated from dashboard snapshots, metric summaries, funnel analyses, cohort analyses, or custom SQL queries.

### Report Types

| Type | Data Source | Use Case |
|------|-------------|----------|
| `dashboard_snapshot` | Full dashboard with widget data | Weekly team review |
| `metric_summary` | Multiple metrics with comparisons | Executive KPI summary |
| `funnel_analysis` | Funnel step-by-step breakdown | Conversion optimization |
| `cohort_analysis` | Retention matrix + LTV | Investor reporting |
| `custom_query` | Arbitrary SQL queries | Ad-hoc analysis |
| `executive_summary` | Cross-module highlights | C-level reporting |

### Report Formats

| Format | MIME Type | Library |
|--------|-----------|---------|
| `pdf` | `application/pdf` | Puppeteer / Playwright |
| `excel` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | ExcelJS |
| `csv` | `text/csv` | Native |
| `html` | `text/html` | Template engine |
| `json` | `application/json` | Native |

### Schedule Frequencies

```
once  │  daily  │  weekly  │  biweekly  │  monthly  │  quarterly  │  yearly
```

### Database Schema (Spec)

```typescript
export const reportTemplates = pgTable('analytics_report_templates', {
  ...baseColumns,
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  type: reportTypeEnum('type').notNull(),
  config: jsonb('config').notNull(),                  // Type-specific configuration
  layout: jsonb('layout'),                            // { orientation, pageSize, margins, header, footer }
  branding: jsonb('branding'),                        // { logo, primaryColor, fontFamily }
  defaultFormats: text('default_formats').array().default(['pdf']),
  ownerId: uuid('owner_id'),
  isSystem: boolean('is_system').default(false),
  isPublic: boolean('is_public').default(false),
});

export const reportSchedules = pgTable('analytics_report_schedules', {
  ...baseColumns,
  templateId: uuid('template_id').references(() => reportTemplates.id),
  name: text('name').notNull(),
  frequency: reportFrequencyEnum('frequency').notNull(),
  scheduleConfig: jsonb('schedule_config').notNull(), // { dayOfWeek, dayOfMonth, hour, minute, timezone }
  dateRangeConfig: jsonb('date_range_config'),        // { type: "previous_period" | "rolling", days? }
  formats: text('formats').array().default(['pdf']),
  delivery: jsonb('delivery').notNull(),              // { email?: {}, slack?: {}, storage?: {} }
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
  name: text('name').notNull(),
  dateRangeStart: timestamp('date_range_start', { withTimezone: true }),
  dateRangeEnd: timestamp('date_range_end', { withTimezone: true }),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow(),
  generatedBy: uuid('generated_by'),
  generationTimeMs: integer('generation_time_ms'),
  format: reportFormatEnum('format').notNull(),
  fileUrl: text('file_url'),
  fileSize: integer('file_size'),
  dataSnapshot: jsonb('data_snapshot'),               // For regeneration
  status: text('status').default('generated'),        // generated | delivered | failed | expired
  deliveryStatus: jsonb('delivery_status'),           // { email: { sent, sentAt }, slack: { ... } }
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});
```

### Report Generation Pipeline

```
Template + Date Range → Gather Data → Render Format → Upload to Storage → Deliver
                           │                │                │               │
                    dashboardService    PDF/Excel/CSV    @mcv/storage    @mcv/comms
                    metricsService     rendering engine                  (email/Slack)
                    funnelService
```

### Schedule Execution

When a scheduled report fires:

1. Calculate date range from `dateRangeConfig` (previous period or rolling window)
2. Generate report using the linked template
3. Upload rendered files to `@mcv/storage`
4. Deliver via configured channels (email, Slack, storage)
5. Update schedule: `lastRunAt`, `nextRunAt`, `lastRunStatus`
6. On failure: increment `consecutiveFailures`, store error message

**Next run calculation** respects day-of-week, day-of-month, hour, minute, and timezone.

### Key Report Operations

| Operation | Method | Description |
|-----------|--------|-------------|
| Create template | `createTemplate()` | Define report structure + branding |
| Generate report | `generateReport()` | One-shot generation from template |
| Schedule report | `scheduleReport()` | Set up recurring report delivery |
| Run scheduled | `runScheduledReport()` | Execute a specific schedule (cron target) |
| Get history | `getReportHistory()` | List generated reports with filters |

---

## API Surface (tRPC Router)

The analytics router (from `packages/api/src/routers/analytics.router.ts`) exposes the following procedures:

### Metric Definitions

| Procedure | Type | Input | Description |
|-----------|------|-------|-------------|
| `listDefinitions` | Query | `{ page?, pageSize?, category?, type?, isActive?, search? }` | Paginated metric list |
| `getDefinition` | Query | `{ id }` | Single metric by ID |
| `createDefinition` | Mutation | `CreateMetricInput` | Create new metric (slug uniqueness enforced) |
| `updateDefinition` | Mutation | `{ id, ...partial fields }` | Update metric fields |
| `deleteDefinition` | Mutation | `{ id }` | Delete metric (cascades values) |

### Metric Values

| Procedure | Type | Input | Description |
|-----------|------|-------|-------------|
| `recordValue` | Mutation | `{ metricId, value, dimensions?, timestamp? }` | Record single value |
| `batchRecord` | Mutation | `{ entries[1..1000] }` | Batch insert (validates all metric IDs) |

### Querying

| Procedure | Type | Input | Description |
|-----------|------|-------|-------------|
| `query` | Query | `{ metricId, startDate, endDate, granularity, dimensions?, aggregation }` | Time-series query |
| `getLatest` | Query | `{ metricId }` | Most recent value |
| `compare` | Query | `{ metricId, periods[2..10] }` | Multi-period comparison |
| `aggregate` | Query | `{ metricIds[1..50], startDate, endDate, aggregation, groupBy? }` | Multi-metric aggregation |

### Dashboards

| Procedure | Type | Input | Description |
|-----------|------|-------|-------------|
| `listDashboards` | Query | `{ page?, pageSize?, isShared?, search? }` | Paginated dashboard list |
| `getDashboard` | Query | `{ id }` | Dashboard with widget configs |
| `createDashboard` | Mutation | `CreateDashboardInput` | Create dashboard |
| `updateDashboard` | Mutation | `{ id, ...partial fields }` | Update dashboard |
| `deleteDashboard` | Mutation | `{ id }` | Delete dashboard |

---

## Usage Examples

### Example 1: Define and Record a Metric

```typescript
import { createMetricsService } from '@mcv/analytics';

// ═══════════════════════════════════════════════════════════════════════════════
// Create a revenue metric definition
// ═══════════════════════════════════════════════════════════════════════════════

const metrics = createMetricsService(ventureId);

const revenueMetric = await metrics.createDefinition({
  name: 'Monthly Recurring Revenue',
  slug: 'mrr',
  type: 'gauge',
  category: 'revenue',
  unit: 'USD',
  format: 'currency',
  dimensions: ['plan', 'region'],
  metadata: { target: 50000, alertThreshold: 40000 },
});

console.log(`Created metric: ${revenueMetric.slug} (${revenueMetric.id})`);
// Created metric: mrr (550e8400-e29b-41d4-a716-446655440000)
```

### Example 2: Record Metric Values with Dimensions

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Record values with dimensional breakdowns
// ═══════════════════════════════════════════════════════════════════════════════

const metrics = createMetricsService(ventureId);

// Single value
await metrics.recordValue(
  revenueMetric.id,
  15000,
  { plan: 'pro', region: 'us-east' },
  new Date('2026-02-01')
);

// Batch record (up to 1000 per call)
await metrics.batchRecord([
  { metricId: revenueMetric.id, value: 15000, dimensions: { plan: 'pro', region: 'us-east' } },
  { metricId: revenueMetric.id, value: 8500, dimensions: { plan: 'starter', region: 'us-east' } },
  { metricId: revenueMetric.id, value: 12000, dimensions: { plan: 'pro', region: 'eu-west' } },
  { metricId: revenueMetric.id, value: 4500, dimensions: { plan: 'starter', region: 'eu-west' } },
]);

console.log('Recorded 5 metric values with dimensional breakdowns');
```

### Example 3: Query Time-Series Data

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Query MRR over the last 30 days with daily granularity
// ═══════════════════════════════════════════════════════════════════════════════

const metrics = createMetricsService(ventureId);

const timeSeries = await metrics.query({
  metricId: revenueMetric.id,
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
  granularity: 'day',
  aggregation: 'sum',
  dimensions: { region: 'us-east' },  // Filter to US East only
});

console.log(`Metric: ${timeSeries.metric.name}`);
console.log(`Points: ${timeSeries.points.length}`);
console.log(`Summary: min=$${timeSeries.summary.min}, max=$${timeSeries.summary.max}`);
console.log(`         avg=$${timeSeries.summary.avg.toFixed(2)}, total=$${timeSeries.summary.total}`);

// Metric: Monthly Recurring Revenue
// Points: 31
// Summary: min=$18500, max=$27000
// avg=$23250.00, total=$720750
```

### Example 4: Compare Periods

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Compare this month vs last month vs same month last year
// ═══════════════════════════════════════════════════════════════════════════════

const comparison = await metrics.compare(revenueMetric.id, [
  { startDate: new Date('2025-02-01'), endDate: new Date('2025-02-28'), label: 'Feb 2025' },
  { startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31'), label: 'Jan 2026' },
  { startDate: new Date('2026-02-01'), endDate: new Date('2026-02-28'), label: 'Feb 2026' },
]);

for (const period of comparison.periods) {
  console.log(`${period.label}: $${period.value.toLocaleString()} (${period.count} data points)`);
}

for (const change of comparison.changes) {
  const from = comparison.periods[change.fromPeriod].label;
  const to = comparison.periods[change.toPeriod].label;
  const pct = change.percentChange?.toFixed(1) ?? 'N/A';
  console.log(`${from} → ${to}: ${change.absoluteChange > 0 ? '+' : ''}$${change.absoluteChange} (${pct}%)`);
}

// Feb 2025: $520,000 (28 data points)
// Jan 2026: $720,750 (31 data points)
// Feb 2026: $695,400 (28 data points)
// Feb 2025 → Jan 2026: +$200,750 (38.6%)
// Jan 2026 → Feb 2026: -$25,350 (-3.5%)
```

### Example 5: Build a Dashboard with Widgets

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Create an executive dashboard with multiple widget types
// ═══════════════════════════════════════════════════════════════════════════════

const metrics = createMetricsService(ventureId);

const dashboard = await metrics.createDashboard({
  name: 'Executive Overview',
  description: 'Key business metrics at a glance',
  isDefault: true,
  isShared: true,
  layout: [
    { widgetId: 'w1', x: 0,  y: 0, w: 3, h: 2 },   // MRR card
    { widgetId: 'w2', x: 3,  y: 0, w: 3, h: 2 },   // Active users card
    { widgetId: 'w3', x: 6,  y: 0, w: 3, h: 2 },   // Churn rate card
    { widgetId: 'w4', x: 9,  y: 0, w: 3, h: 2 },   // NPS card
    { widgetId: 'w5', x: 0,  y: 2, w: 8, h: 4 },   // Revenue chart (wide)
    { widgetId: 'w6', x: 8,  y: 2, w: 4, h: 4 },   // Revenue by plan (pie)
  ],
  widgets: [
    {
      id: 'w1',
      type: 'metric_card',
      title: 'MRR',
      metricId: mrrMetricId,
      displayOptions: { format: 'currency', comparison: 'previous_month' },
    },
    {
      id: 'w5',
      type: 'line_chart',
      title: 'Revenue Trend',
      metricId: revenueMetricId,
      queryParams: { granularity: 'day' },
      displayOptions: { showLegend: true, fill: true },
    },
    {
      id: 'w6',
      type: 'pie_chart',
      title: 'Revenue by Plan',
      metricId: revenueMetricId,
      queryParams: { aggregation: 'sum' },
      displayOptions: { groupBy: 'plan' },
    },
  ],
}, userId);

console.log(`Dashboard "${dashboard.name}" created with ID: ${dashboard.id}`);
```

### Example 6: Define and Analyze a Conversion Funnel

```typescript
import { FunnelService } from '@mcv/analytics';

// ═══════════════════════════════════════════════════════════════════════════════
// Create an e-commerce checkout funnel
// ═══════════════════════════════════════════════════════════════════════════════

const funnelService = new FunnelService();

const { funnel, steps } = await funnelService.create({
  name: 'Checkout Funnel',
  description: 'Track users from product view to purchase completion',
  category: 'commerce',
  completionType: 'ordered',
  conversionWindow: 72,  // 3 days
  steps: [
    { name: 'Product Viewed',    eventType: 'product.viewed' },
    { name: 'Added to Cart',     eventType: 'cart.item_added' },
    { name: 'Checkout Started',  eventType: 'checkout.started' },
    { name: 'Payment Entered',   eventType: 'checkout.payment_entered',
      maxSecondsFromPrevious: 600 },   // Must happen within 10 min
    { name: 'Purchase Complete', eventType: 'purchase.completed' },
  ],
});

// Analyze last 30 days
const analysis = await funnelService.analyze(funnel.id, {
  startDate: new Date('2026-01-08'),
  endDate: new Date('2026-02-08'),
  segments: ['source', 'device', 'country'],
});

console.log(`Overall conversion: ${analysis.overall.overallConversionRate.toFixed(1)}%`);
console.log(`Bottleneck: ${analysis.overall.bottleneckStep}`);
console.log(`Biggest drop-off: ${analysis.overall.biggestDropoff.step} (${analysis.overall.biggestDropoff.rate.toFixed(1)}%)`);

for (const step of analysis.steps) {
  console.log(`  ${step.step.name}: ${step.entered} → ${step.completed} (${step.conversionRate.toFixed(1)}%)`);
}

// Overall conversion: 3.2%
// Bottleneck: Payment Entered
// Biggest drop-off: Payment Entered (42.8%)
//   Product Viewed: 50000 → 50000 (100.0%)
//   Added to Cart: 50000 → 12500 (25.0%)
//   Checkout Started: 12500 → 5000 (40.0%)
//   Payment Entered: 5000 → 2860 (57.2%)
//   Purchase Complete: 2860 → 1600 (55.9%)
```

### Example 7: Track Funnel Progress in Real Time

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Track a user progressing through the checkout funnel
// ═══════════════════════════════════════════════════════════════════════════════

// User views a product
await funnelService.trackProgress(funnel.id, 'product.viewed', {
  productId: 'prod_123',
  category: 'electronics',
}, {
  userId: 'user_456',
  sessionId: 'sess_789',
  source: 'google',
  medium: 'cpc',
  campaign: 'spring_sale',
  device: 'mobile',
  browser: 'safari',
  country: 'US',
});

// User adds to cart (advances to step 2)
await funnelService.trackProgress(funnel.id, 'cart.item_added', {
  productId: 'prod_123',
  quantity: 1,
}, {
  userId: 'user_456',
  sessionId: 'sess_789',
});

// System automatically:
// 1. Finds the active conversion record for user_456
// 2. Verifies step ordering (ordered funnel)
// 3. Checks time constraints
// 4. Updates completedSteps and stepTimestamps
// 5. Increments step-level counters
```

### Example 8: Cohort Retention Analysis

```typescript
import { CohortService } from '@mcv/analytics';

// ═══════════════════════════════════════════════════════════════════════════════
// Define an acquisition cohort and get the retention matrix
// ═══════════════════════════════════════════════════════════════════════════════

const cohortService = new CohortService();

const definition = await cohortService.createDefinition({
  name: 'Monthly Signups',
  type: 'acquisition',
  period: 'month',
  criteria: {
    event: 'user.created',
    filters: { source: { in: ['organic', 'referral', 'paid'] } },
  },
  retentionEvent: 'session.started',
  revenueEvent: 'purchase.completed',
  revenueField: 'amount',
  lookbackPeriods: 12,
});

// Get retention matrix for heatmap
const matrix = await cohortService.getRetentionMatrix(definition.id, {
  startDate: new Date('2025-03-01'),
  endDate: new Date('2026-02-01'),
  limit: 12,
});

console.log(`Cohorts: ${matrix.cohorts.length}`);
console.log(`Periods: ${matrix.periods.join(', ')}`);

for (const cohort of matrix.cohorts) {
  const retentionStr = cohort.retention.map(r => `${r.toFixed(0)}%`).join(' → ');
  console.log(`${cohort.label} (n=${cohort.size}): ${retentionStr}`);
}

console.log(`Average retention: ${matrix.averageRetention.map(r => `${r.toFixed(1)}%`).join(', ')}`);

// Cohorts: 12
// Periods: Month 0, Month 1, Month 2, ...
// Mar 2025 (n=1200): 100% → 78% → 65% → 58% → 52% → 48% → 45% → 43% → 41% → 40% → 39% → 38%
// Apr 2025 (n=1350): 100% → 82% → 68% → 61% → 55% → 50% → 47% → 44% → 42% → 40% → 39%
// ...
```

### Example 9: LTV Calculation by Cohort

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Calculate LTV at multiple horizons
// ═══════════════════════════════════════════════════════════════════════════════

const ltvData = await cohortService.calculateLTV(definition.id, {
  days: [30, 60, 90, 180, 365],
});

for (const cohort of ltvData) {
  console.log(`${cohort.cohort} (n=${cohort.size}):`);
  console.log(`  LTV-30:  $${cohort.ltv_30.toFixed(2)}`);
  console.log(`  LTV-90:  $${cohort.ltv_90.toFixed(2)}`);
  console.log(`  LTV-365: $${cohort.ltv_365.toFixed(2)}`);
}

// Jan 2026 (n=1500):
//   LTV-30:  $12.50
//   LTV-90:  $28.75
//   LTV-365: $85.20
```

### Example 10: Churn Risk Prediction

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Predict churn risk for a cohort's active members
// ═══════════════════════════════════════════════════════════════════════════════

const churnRisks = await cohortService.predictChurnRisk(cohortId);

const highRisk = churnRisks.filter(u => u.riskScore > 60);
console.log(`High-risk users: ${highRisk.length} / ${churnRisks.length}`);

for (const user of highRisk.slice(0, 5)) {
  console.log(`  User ${user.userId}: risk=${user.riskScore}%`);
  console.log(`    Factors: ${user.riskFactors.join(', ')}`);
  console.log(`    Actions: ${user.recommendations.join('; ')}`);
}

// High-risk users: 142 / 1200
//   User user_789: risk=70%
//     Factors: Inactive for over 30 days, Single purchase only
//     Actions: Send re-engagement email campaign; Send personalized product recommendations
```

### Example 11: Anomaly Detection and Insights Feed

```typescript
import { InsightsService } from '@mcv/analytics';

// ═══════════════════════════════════════════════════════════════════════════════
// Detect anomalies and retrieve the insights feed
// ═══════════════════════════════════════════════════════════════════════════════

const insightsService = new InsightsService();

// Run anomaly detection on revenue metric
const anomaly = await insightsService.detectAnomalies(revenueMetricId);

if (anomaly) {
  console.log(`ANOMALY DETECTED in revenue:`);
  console.log(`  Expected: $${anomaly.expected.toFixed(0)}`);
  console.log(`  Actual:   $${anomaly.actual.toFixed(0)}`);
  console.log(`  Deviation: ${anomaly.deviation.toFixed(1)}% ${anomaly.direction}`);
  console.log(`  Severity:  ${anomaly.severity}`);
  console.log(`  Confidence: ${(anomaly.confidence * 100).toFixed(0)}%`);
}

// Get all unresolved insights, sorted by priority
const feed = await insightsService.getInsightsFeed({
  priorities: ['critical', 'high'],
  status: 'new',
  limit: 10,
});

for (const insight of feed) {
  console.log(`[${insight.priority.toUpperCase()}] ${insight.title}`);
  console.log(`  ${insight.summary}`);
  if (insight.recommendations) {
    for (const rec of insight.recommendations as any[]) {
      console.log(`  → ${rec.action} (${rec.priority})`);
    }
  }
}

// ANOMALY DETECTED in revenue:
//   Expected: $24,000
//   Actual:   $16,800
//   Deviation: -30.0% below
//   Severity:  high
//   Confidence: 92%
//
// [HIGH] Drop detected in Monthly Recurring Revenue
//   Monthly Recurring Revenue is 30.0% below expected value
//   → Investigate potential issues causing the drop (high)
//   → Check for technical problems or service disruptions (medium)
```

### Example 12: Trend Analysis with Projections

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Analyze 30-day trend and generate projections
// ═══════════════════════════════════════════════════════════════════════════════

const trend = await insightsService.analyzeTrends(signupsMetricId, 30);

console.log(`Direction: ${trend.direction} (strength: ${trend.strength.toFixed(2)})`);
console.log(`Period change: ${trend.percentChange > 0 ? '+' : ''}${trend.percentChange.toFixed(1)}%`);

for (const proj of trend.projections) {
  console.log(`  Next ${proj.period}: ${proj.value.toFixed(0)} [${proj.confidence.low.toFixed(0)} – ${proj.confidence.high.toFixed(0)}]`);
}

if (trend.seasonality?.detected) {
  console.log(`Seasonality: ${trend.seasonality.pattern} (strength: ${trend.seasonality.strength.toFixed(2)})`);
}

// Direction: up (strength: 0.87)
// Period change: +25.3%
//   Next 7d: 1,520 [1,380 – 1,660]
//   Next 14d: 1,680 [1,490 – 1,870]
//   Next 30d: 2,010 [1,700 – 2,320]
// Seasonality: weekly (strength: 0.65)
```

### Example 13: Create and Schedule a Report

```typescript
import { ReportService } from '@mcv/analytics';

// ═══════════════════════════════════════════════════════════════════════════════
// Create a weekly executive report template and schedule it
// ═══════════════════════════════════════════════════════════════════════════════

const reportService = new ReportService();

// Define the template
const template = await reportService.createTemplate({
  name: 'Weekly Executive Summary',
  description: 'Key metrics, funnel performance, and AI insights',
  type: 'executive_summary',
  config: {
    metricIds: [mrrMetricId, dauMetricId, churnMetricId, npsMetricId],
    comparison: { enabled: true, type: 'previous_period' },
    includeSparklines: true,
    includeFunnelSummary: true,
    includeTopInsights: true,
  },
  layout: {
    orientation: 'portrait',
    pageSize: 'A4',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    header: { logo: true, title: true, dateRange: true },
    footer: { pageNumbers: true, generatedAt: true },
  },
  branding: {
    logo: 'https://cdn.myventure.com/logo.svg',
    primaryColor: '#4f46e5',
    fontFamily: 'Inter',
  },
  defaultFormats: ['pdf', 'excel'],
});

// Schedule weekly delivery
const schedule = await reportService.scheduleReport({
  templateId: template.id,
  name: 'Monday Morning Report',
  frequency: 'weekly',
  scheduleConfig: {
    dayOfWeek: 1,     // Monday
    hour: 9,          // 9 AM
    minute: 0,
    timezone: 'America/New_York',
  },
  dateRangeConfig: {
    type: 'previous_period',  // Previous week's data
  },
  formats: ['pdf'],
  delivery: {
    email: {
      recipients: ['ceo@venture.com', 'cto@venture.com', 'vp-product@venture.com'],
      subject: 'Weekly Analytics Report — {{dateRange}}',
    },
    storage: {
      enabled: true,
      path: '/reports/{{year}}/{{month}}/',
    },
  },
});

console.log(`Report scheduled: next run at ${schedule.nextRunAt}`);
```

### Example 14: Generate an Ad-Hoc Report

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Generate a one-off report for a specific date range
// ═══════════════════════════════════════════════════════════════════════════════

const reports = await reportService.generateReport({
  templateId: template.id,
  dateRange: {
    start: new Date('2026-01-01'),
    end: new Date('2026-01-31'),
  },
  formats: ['pdf', 'csv', 'json'],
});

for (const report of reports) {
  console.log(`Generated: ${report.name}`);
  console.log(`  Format: ${report.format}`);
  console.log(`  Size: ${(report.fileSize / 1024).toFixed(1)} KB`);
  console.log(`  URL: ${report.fileUrl}`);
  console.log(`  Time: ${report.generationTimeMs}ms`);
}

// Generated: Weekly Executive Summary — 1/1/2026 to 1/31/2026
//   Format: pdf
//   Size: 245.3 KB
//   URL: https://storage.mcv.one/reports/venture-id/weekly-exec/1707350400.pdf
//   Time: 3420ms
```

### Example 15: Real-Time Metric Streaming

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Stream real-time metric updates for a live dashboard
// ═══════════════════════════════════════════════════════════════════════════════

const metricsService = new MetricsService();

const unsubscribe = await metricsService.streamMetrics(
  ['mrr', 'active_users', 'orders_per_minute'],
  (updates) => {
    for (const [slug, value] of Object.entries(updates)) {
      console.log(`[LIVE] ${slug}: ${value}`);
      // Push to WebSocket clients
      wsServer.broadcast(JSON.stringify({ type: 'metric_update', slug, value }));
    }
  }
);

// Later: clean up subscription
// unsubscribe();
```

---

## Integration Points

| System | Direction | Method | Data Flow |
|--------|-----------|--------|-----------|
| `@mcv/kernel` | Import | Direct | Database connection, context, error codes, base columns |
| `@mcv/db` | Import | Direct | Drizzle schema definitions, query builder |
| `@mcv/events` | Consume | Event bus | Metric event listeners, funnel step triggers |
| `@mcv/storage` | Produce | Service call | Report file uploads (PDF, Excel, CSV) |
| `@mcv/ai` | Consume | Service call | AI-powered insight generation, drop-off analysis |
| `@mcv/comms` | Produce | Service call | Report delivery (email), alert notifications |
| `@mcv/identity` | Consume | Service call | User lookup for dashboard sharing, cohort members |
| `@mcv/commerce` | Consume | Event bus | Revenue events, transaction data |
| `@mcv/growth` | Consume | Event bus | Campaign attribution, experiment data |
| `@mcv/people` | Consume | Event bus | User actions, session events |

### Event Consumption

The analytics module listens to domain events for automatic metric computation:

```typescript
// Event-driven metric updates (registered per metric definition)
eventBus.on('purchase.completed', async (event) => {
  await metricsService.recordValue('total_revenue', event.amount, {
    plan: event.plan,
    country: event.country,
  });
});

eventBus.on('user.created', async (event) => {
  await metricsService.recordValue('signups', 1, {
    source: event.source,
    medium: event.medium,
  });
});

eventBus.on('session.started', async (event) => {
  await metricsService.recordValue('active_sessions', 1, {
    platform: event.platform,
    device: event.device,
  });
});
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 |
|-----------|--------|-----|
| Record single value | < 5ms | < 15ms |
| Batch record (1000) | < 100ms | < 250ms |
| Time-series query (30 days, daily) | < 50ms | < 150ms |
| Time-series query (365 days, daily) | < 200ms | < 500ms |
| Dashboard render (6 widgets) | < 300ms | < 800ms |
| Funnel analysis (30 days) | < 500ms | < 1.5s |
| Cohort retention matrix (12 months) | < 1s | < 3s |
| Anomaly detection (single metric) | < 200ms | < 500ms |
| Report generation (PDF) | < 5s | < 15s |
| Insight feed query | < 50ms | < 150ms |

### Throughput

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| Values recorded/minute | 1,000 | 50,000+ |
| Queries/minute | 200 | 2,000+ |
| Dashboards served/minute | 50 | 500+ |
| Reports generated/hour | 10 | 100+ |

### Optimization Strategies

1. **Multi-granularity pre-aggregation** — Write to minute/hour/day/week/month buckets on ingest; queries read pre-aggregated data
2. **Redis caching** — Configurable TTL per metric (default 5 min); dashboard widget caching; invalidation on write
3. **Batch insert** — Up to 1000 values per `batchRecord()` call with single INSERT statement
4. **Time-series table partitioning** — Partition `metric_values` by month for efficient range scans
5. **Dimension filtering in app layer** — JSONB dimension filters applied after index-narrowed fetch for flexibility
6. **Parallel widget data fetch** — Dashboard widgets load data concurrently via `Promise.all()`
7. **Connection pooling** — Drizzle ORM with PgPool for efficient database connection reuse
8. **Materialized views** — Common aggregation queries (daily totals, weekly rollups) precomputed

### Index Strategy

```sql
-- Metric definitions: venture+slug lookup (unique)
CREATE UNIQUE INDEX metric_def_venture_slug_idx ON metric_definitions (venture_id, slug);
CREATE INDEX metric_def_venture_idx ON metric_definitions (venture_id);
CREATE INDEX metric_def_category_idx ON metric_definitions (category);
CREATE INDEX metric_def_type_idx ON metric_definitions (type);

-- Metric values: time-series queries (primary access pattern)
CREATE INDEX metric_values_metric_idx ON metric_values (metric_id);
CREATE INDEX metric_values_timestamp_idx ON metric_values (metric_id, timestamp);

-- Extended (Phase 2): multi-granularity lookup
CREATE INDEX metric_values_time_idx ON analytics_metric_values (metric_id, timestamp, granularity);
CREATE INDEX metric_values_lookup_idx ON analytics_metric_values (venture_id, metric_id, granularity, timestamp);

-- Dashboards
CREATE INDEX metric_dashboards_venture_idx ON metric_dashboards (venture_id);

-- Funnels
CREATE INDEX funnel_conv_funnel_idx ON analytics_funnel_conversions (funnel_id, entered_at);
CREATE INDEX funnel_conv_user_idx ON analytics_funnel_conversions (user_id, funnel_id);

-- Cohorts
CREATE INDEX cohort_period_idx ON analytics_cohorts (definition_id, period_start);
CREATE INDEX cohort_retention_idx ON analytics_cohort_retention (cohort_id, period_offset);
CREATE INDEX cohort_member_user_idx ON analytics_cohort_members (user_id);

-- Insights
CREATE INDEX insight_type_idx ON analytics_insights (venture_id, type, status);
CREATE INDEX insight_priority_idx ON analytics_insights (venture_id, priority, status);
```

---

## Security Considerations

### Tenant Isolation

Every query is scoped by `ventureId`. The `MetricsService` constructor takes `ventureId` as a required parameter and enforces it on all operations:

```typescript
// Every service method filters by ventureId
const conditions = [eq(metricDefinitions.ventureId, this.ventureId)];
```

**No cross-venture data leakage is possible** — metrics, dashboards, funnels, cohorts, insights, and reports are all venture-scoped at the service layer and database level (FK to `ventures.id` with `ON DELETE CASCADE`).

### Access Control

| Resource | Read | Write | Delete | Share |
|----------|------|-------|--------|-------|
| Metric definitions | Venture member | Venture admin | Venture admin | N/A |
| Metric values | Venture member | Venture member | Cascade only | N/A |
| Dashboards | Based on visibility | Owner + editors | Owner only | Owner only |
| Funnels | Venture member | Venture admin | Venture admin | N/A |
| Cohorts | Venture member | System (computed) | Venture admin | N/A |
| Insights | Venture member | System (generated) | Auto-expire | N/A |
| Reports | Venture member | Venture member | Owner + admin | Owner only |

### Dashboard Visibility

```
private  →  checkAccess: ownerId === userId
team     →  checkAccess: user is member of teamId
venture  →  checkAccess: user is member of ventureId
public   →  checkAccess: always allowed (optional password check)
```

### Data Privacy

- **PII in dimensions**: Dimension values may contain PII (e.g., user IDs, emails). Apply PII filtering policies.
- **Custom query safety**: The `custom_query` report type must sanitize SQL to prevent injection. Read-only execution context.
- **Public dashboards**: Password-protected; hashed passwords stored.
- **Report files**: Stored in `@mcv/storage` with venture-scoped paths; pre-signed URLs with TTL.

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `analytics.metric.created` | admin | New metric definition created |
| `analytics.metric.updated` | admin | Metric definition updated |
| `analytics.metric.deleted` | admin | Metric definition deleted (cascades values) |
| `analytics.metric.value_recorded` | system | Metric value(s) recorded |
| `analytics.metric.batch_recorded` | system | Batch of values recorded |
| `analytics.metric.queried` | system | Time-series query executed |
| `analytics.dashboard.created` | admin | New dashboard created |
| `analytics.dashboard.updated` | admin | Dashboard layout/widgets updated |
| `analytics.dashboard.deleted` | admin | Dashboard deleted |
| `analytics.dashboard.shared` | admin | Dashboard sharing settings changed |
| `analytics.dashboard.viewed` | system | Dashboard loaded (increments view count) |
| `analytics.dashboard.snapshot` | system | Dashboard snapshot captured |
| `analytics.funnel.created` | admin | New funnel with steps created |
| `analytics.funnel.progress` | system | User progressed through funnel step |
| `analytics.funnel.converted` | system | User completed funnel |
| `analytics.funnel.analyzed` | system | Funnel analysis computed |
| `analytics.cohort.created` | admin | Cohort definition created |
| `analytics.cohort.computed` | system | Cohort data refreshed |
| `analytics.insight.generated` | system | AI insight created (anomaly/trend/correlation) |
| `analytics.insight.viewed` | system | Insight marked as viewed |
| `analytics.insight.acknowledged` | system | Insight acknowledged by user |
| `analytics.insight.resolved` | system | Insight resolved |
| `analytics.insight.dismissed` | system | Insight dismissed (with reason) |
| `analytics.alert.triggered` | system | Metric alert threshold breached |
| `analytics.alert.resolved` | system | Alert condition returned to normal |
| `analytics.alert.snoozed` | admin | Alert snoozed by user |
| `analytics.report.template_created` | admin | Report template defined |
| `analytics.report.generated` | system | Report file generated |
| `analytics.report.delivered` | system | Report delivered via email/Slack |
| `analytics.report.delivery_failed` | system | Report delivery failed |
| `analytics.report.scheduled` | admin | Report schedule created/updated |

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════════════════════

DATABASE_URL=postgresql://user:pass@host:5432/mcv     # Primary PostgreSQL connection
DATABASE_POOL_SIZE=20                                  # Connection pool size

# ═══════════════════════════════════════════════════════════════════════════════
# REDIS (Caching & Real-Time)
# ═══════════════════════════════════════════════════════════════════════════════

REDIS_URL=redis://host:6379/0                          # Redis connection for caching
ANALYTICS_CACHE_TTL=300                                # Default metric cache TTL (seconds)
ANALYTICS_DASHBOARD_CACHE_TTL=60                       # Dashboard widget cache TTL (seconds)

# ═══════════════════════════════════════════════════════════════════════════════
# METRICS
# ═══════════════════════════════════════════════════════════════════════════════

ANALYTICS_MAX_BATCH_SIZE=1000                          # Max entries per batchRecord()
ANALYTICS_DEFAULT_RETENTION_DAYS=365                   # Default metric value retention
ANALYTICS_MAX_DIMENSIONS=20                            # Max dimensions per metric
ANALYTICS_MIN_ANOMALY_DATAPOINTS=30                    # Min data points for anomaly detection

# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARDS
# ═══════════════════════════════════════════════════════════════════════════════

ANALYTICS_MAX_DASHBOARD_WIDGETS=50                     # Max widgets per dashboard
ANALYTICS_DEFAULT_REFRESH_INTERVAL=300                 # Default auto-refresh (seconds)
ANALYTICS_MAX_PUBLIC_DASHBOARDS=10                     # Max public dashboards per venture

# ═══════════════════════════════════════════════════════════════════════════════
# FUNNELS
# ═══════════════════════════════════════════════════════════════════════════════

ANALYTICS_MAX_FUNNEL_STEPS=20                          # Max steps per funnel
ANALYTICS_DEFAULT_CONVERSION_WINDOW=168                # Default conversion window (hours)
ANALYTICS_FUNNEL_ABANDONMENT_TIMEOUT=72                # Hours before marking abandoned

# ═══════════════════════════════════════════════════════════════════════════════
# COHORTS
# ═══════════════════════════════════════════════════════════════════════════════

ANALYTICS_DEFAULT_LOOKBACK_PERIODS=12                  # Default cohort periods to compute
ANALYTICS_MAX_COHORT_MEMBERS=100000                    # Max tracked members per cohort
ANALYTICS_CHURN_INACTIVE_DAYS=30                       # Days of inactivity = churned

# ═══════════════════════════════════════════════════════════════════════════════
# INSIGHTS
# ═══════════════════════════════════════════════════════════════════════════════

ANALYTICS_ANOMALY_SENSITIVITY=0.95                     # Anomaly detection sensitivity
ANALYTICS_ANOMALY_MIN_CONFIDENCE=0.80                  # Minimum confidence to report
ANALYTICS_INSIGHT_EXPIRY_DAYS=7                        # Days before insight auto-expires
ANALYTICS_INSIGHT_COOLDOWN_MINUTES=60                  # Min time between duplicate insights
ANALYTICS_CORRELATION_THRESHOLD=0.5                    # Min |r| for correlation reporting

# ═══════════════════════════════════════════════════════════════════════════════
# REPORTS
# ═══════════════════════════════════════════════════════════════════════════════

ANALYTICS_REPORT_STORAGE_PATH=/reports                 # Base path in @mcv/storage
ANALYTICS_REPORT_EXPIRY_DAYS=90                        # Days before generated reports expire
ANALYTICS_MAX_REPORT_SIZE_MB=50                        # Max report file size
ANALYTICS_REPORT_CONCURRENT_GENERATIONS=5              # Max concurrent report generations

# ═══════════════════════════════════════════════════════════════════════════════
# CRON SCHEDULES
# ═══════════════════════════════════════════════════════════════════════════════

ANALYTICS_INSIGHT_CRON="0 */6 * * *"                   # Run insight analysis every 6 hours
ANALYTICS_COHORT_COMPUTE_CRON="0 2 * * *"              # Recompute cohorts daily at 2 AM
ANALYTICS_RETENTION_CLEANUP_CRON="0 3 1 * *"           # Cleanup expired data monthly
ANALYTICS_REPORT_SCHEDULER_CRON="* * * * *"            # Check for due report schedules every minute
```

---

## Error Codes

| Code | HTTP | tRPC Code | Description | Recovery |
|------|------|-----------|-------------|----------|
| `METRIC_NOT_FOUND` | 404 | `NOT_FOUND` | Metric definition does not exist or belongs to another venture | Verify metric ID and venture |
| `METRIC_SLUG_EXISTS` | 409 | `CONFLICT` | Metric with this slug already exists in the venture | Use a unique slug |
| `METRIC_VALUE_INVALID` | 400 | `BAD_REQUEST` | Value is NaN, Infinity, or out of range | Validate number before sending |
| `BATCH_TOO_LARGE` | 400 | `BAD_REQUEST` | Batch exceeds 1000 entries | Split into multiple batches |
| `BATCH_METRIC_MISMATCH` | 404 | `NOT_FOUND` | One or more metric IDs in batch are invalid | Verify all metric IDs |
| `DASHBOARD_NOT_FOUND` | 404 | `NOT_FOUND` | Dashboard does not exist | Verify dashboard ID |
| `DASHBOARD_ACCESS_DENIED` | 403 | `FORBIDDEN` | User lacks permission to view/edit dashboard | Check visibility and sharing settings |
| `DASHBOARD_EDIT_DENIED` | 403 | `FORBIDDEN` | User is not owner or editor of dashboard | Request edit access |
| `FUNNEL_NOT_FOUND` | 404 | `NOT_FOUND` | Funnel does not exist | Verify funnel ID |
| `FUNNEL_INACTIVE` | 400 | `BAD_REQUEST` | Funnel status is not 'active' | Activate the funnel first |
| `FUNNEL_STEP_ORDER` | 400 | `BAD_REQUEST` | Event received out of funnel step order | Events must match expected step sequence |
| `FUNNEL_TIME_CONSTRAINT` | 400 | `BAD_REQUEST` | Step time constraint violated | User took too long between steps |
| `COHORT_NOT_FOUND` | 404 | `NOT_FOUND` | Cohort definition does not exist | Verify definition ID |
| `COHORT_COMPUTE_FAILED` | 500 | `INTERNAL_SERVER_ERROR` | Cohort computation encountered an error | Check event store connectivity |
| `INSIGHT_NOT_FOUND` | 404 | `NOT_FOUND` | Insight does not exist | Verify insight ID |
| `INSIGHT_EXPIRED` | 410 | `NOT_FOUND` | Insight has expired past its `expiresAt` | Request fresh analysis |
| `REPORT_TEMPLATE_NOT_FOUND` | 404 | `NOT_FOUND` | Report template does not exist | Verify template ID |
| `REPORT_GENERATION_FAILED` | 500 | `INTERNAL_SERVER_ERROR` | Report rendering failed | Check template config and data availability |
| `REPORT_DELIVERY_FAILED` | 500 | `INTERNAL_SERVER_ERROR` | Email/Slack delivery failed | Check delivery configuration and credentials |
| `REPORT_TOO_LARGE` | 413 | `PAYLOAD_TOO_LARGE` | Generated report exceeds size limit | Narrow the date range or reduce included data |
| `INSUFFICIENT_DATA` | 400 | `BAD_REQUEST` | Not enough data points for analysis (< 30) | Wait for more data collection |
| `INVALID_DATE_RANGE` | 400 | `BAD_REQUEST` | Start date is after end date | Fix date ordering |
| `QUERY_RATE_LIMITED` | 429 | `TOO_MANY_REQUESTS` | Too many queries in time window | Back off and retry |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | ^0.29.x | Database ORM for PostgreSQL |
| `@trpc/server` | ^10.x | Type-safe API router |
| `zod` | ^3.x | Input/output validation schemas |
| `ioredis` | ^5.x | Metric caching, pub/sub streaming, rate limiting |
| `decimal.js` | ^10.x | Precise numeric calculations (currency, percentages) |
| `date-fns` | ^3.x | Date manipulation, period calculations, formatting |
| `uuid` | ^9.x | Widget ID and request ID generation |
| `puppeteer` | ^22.x | PDF report rendering (headless Chrome) |
| `exceljs` | ^4.x | Excel (.xlsx) report generation |
| `pg` | ^8.x | PostgreSQL driver (via Drizzle) |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | ^1.x | Unit and integration testing |
| `@testing-library/react` | ^14.x | Component testing |
| `msw` | ^2.x | API mocking for tests |
| `@faker-js/faker` | ^8.x | Test data generation |

---

## Testing Notes

### Unit Testing

```typescript
import { MetricsService } from '@mcv/analytics';
import { describe, it, expect, beforeEach } from 'vitest';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService('test-venture-id', mockDb);
  });

  describe('createDefinition', () => {
    it('should create a metric with unique slug', async () => {
      const metric = await service.createDefinition({
        name: 'Daily Active Users',
        slug: 'dau',
        type: 'gauge',
        category: 'engagement',
      });

      expect(metric.slug).toBe('dau');
      expect(metric.type).toBe('gauge');
      expect(metric.isActive).toBe(true);
    });

    it('should reject duplicate slugs within same venture', async () => {
      await service.createDefinition({
        name: 'DAU', slug: 'dau', type: 'gauge', category: 'engagement',
      });

      await expect(
        service.createDefinition({
          name: 'DAU Copy', slug: 'dau', type: 'gauge', category: 'engagement',
        })
      ).rejects.toThrow('Metric with slug "dau" already exists');
    });
  });

  describe('query', () => {
    it('should return time-series with correct granularity buckets', async () => {
      // Setup: insert 48 hourly values
      const result = await service.query({
        metricId: metricId,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-02'),
        granularity: 'hour',
        aggregation: 'sum',
      });

      expect(result.points).toHaveLength(24); // One point per hour
      expect(result.summary.total).toBeGreaterThan(0);
      expect(result.summary.min).toBeLessThanOrEqual(result.summary.max);
    });

    it('should filter by dimensions', async () => {
      const result = await service.query({
        metricId: metricId,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
        granularity: 'day',
        dimensions: { region: 'us-east' },
      });

      // All returned points should only include us-east data
      expect(result.points.length).toBeGreaterThan(0);
    });
  });

  describe('compare', () => {
    it('should calculate absolute and percent changes between periods', async () => {
      const result = await service.compare(metricId, [
        { startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31'), label: 'Jan' },
        { startDate: new Date('2026-02-01'), endDate: new Date('2026-02-28'), label: 'Feb' },
      ]);

      expect(result.periods).toHaveLength(2);
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].fromPeriod).toBe(0);
      expect(result.changes[0].toPeriod).toBe(1);
      expect(typeof result.changes[0].absoluteChange).toBe('number');
    });
  });

  describe('aggregateValues', () => {
    it('should correctly compute sum aggregation', () => {
      const result = service['aggregateValues']([10, 20, 30], 'sum');
      expect(result).toBe(60);
    });

    it('should correctly compute avg aggregation', () => {
      const result = service['aggregateValues']([10, 20, 30], 'avg');
      expect(result).toBe(20);
    });

    it('should return 0 for empty arrays', () => {
      const result = service['aggregateValues']([], 'sum');
      expect(result).toBe(0);
    });
  });
});
```

### Integration Testing

```typescript
describe('Analytics E2E', () => {
  it('should record a value and query it back', async () => {
    const service = createMetricsService('test-venture');

    // Create metric
    const metric = await service.createDefinition({
      name: 'Test Signups',
      slug: 'test-signups',
      type: 'counter',
      category: 'acquisition',
    });

    // Record values
    await service.recordValue(metric.id, 5);
    await service.recordValue(metric.id, 10);
    await service.recordValue(metric.id, 3);

    // Query
    const result = await service.query({
      metricId: metric.id,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(),
      granularity: 'day',
      aggregation: 'sum',
    });

    expect(result.summary.total).toBe(18);
    expect(result.points.length).toBeGreaterThanOrEqual(1);
  });

  it('should create a dashboard with widgets and fetch data', async () => {
    const service = createMetricsService('test-venture');

    const dashboard = await service.createDashboard({
      name: 'Test Dashboard',
      layout: [{ widgetId: 'w1', x: 0, y: 0, w: 6, h: 3 }],
      widgets: [{
        id: 'w1',
        type: 'line_chart',
        title: 'Signups',
        metricId: metricId,
      }],
    }, userId);

    expect(dashboard.name).toBe('Test Dashboard');

    const fetched = await service.getDashboard(dashboard.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.widgets).toHaveLength(1);
  });

  it('should enforce venture isolation', async () => {
    const serviceA = createMetricsService('venture-a');
    const serviceB = createMetricsService('venture-b');

    const metric = await serviceA.createDefinition({
      name: 'Secret Metric', slug: 'secret', type: 'counter', category: 'custom',
    });

    // Venture B should not be able to access Venture A's metric
    const result = await serviceB.getDefinition(metric.id);
    expect(result).toBeNull();
  });

  it('should batch-validate all metric IDs before inserting', async () => {
    const service = createMetricsService('test-venture');

    await expect(
      service.batchRecord([
        { metricId: validMetricId, value: 10 },
        { metricId: 'non-existent-id', value: 20 },
      ])
    ).rejects.toThrow('Metric definition not found');
  });
});
```

---

*@mcv/analytics — Comprehensive Analytics & Business Intelligence Module*