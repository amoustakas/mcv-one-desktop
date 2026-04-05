# @mcv/analytics — API Reference
## Tier 5: PUBLISHABLE Domains

**Package:** `@mcv/analytics`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Service Methods — Cohorts](#service-methods--cohorts)
3. [Service Methods — Dashboards](#service-methods--dashboards)
4. [Service Methods — Funnels](#service-methods--funnels)
5. [Service Methods — Insights](#service-methods--insights)
6. [Service Methods — Metrics](#service-methods--metrics)
7. [Service Methods — Reports](#service-methods--reports)
8. [Types](#types)
9. [Schemas (Zod)](#schemas-zod)
10. [Events](#events)
11. [Errors](#errors)
12. [Configuration](#configuration)

---

## API Overview

The `@mcv/analytics` package exposes its functionality through six service classes, each scoped to a venture context. All services enforce multi-tenant isolation — every operation is automatically filtered by `ventureId`.

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      @mcv/analytics API                          │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  MetricsService   │  │ DashboardService  │                    │
│  │  createMetric()   │  │ createDashboard() │                    │
│  │  queryMetric()    │  │ addWidget()       │                    │
│  │  getTimeSeries()  │  │ getDashboard()    │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  FunnelService    │  │  CohortService    │                    │
│  │  createFunnel()   │  │  createCohort()   │                    │
│  │  analyzeFunnel()  │  │  analyzeCohort()  │                    │
│  │  getConversion()  │  │  getRetention()   │                    │
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ InsightsService   │  │  ReportService    │                    │
│  │ getInsights()     │  │  createReport()   │                    │
│  │ getAnomalies()    │  │  scheduleReport() │                    │
│  │ generateSummary() │  │  generateReport() │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### Import Patterns

```typescript
// ── Server-Side Services ──────────────────────────────────────
import {
  // Metrics
  MetricsService,
  createMetricsService,
  createMetric,
  queryMetric,
  recordValue,
  batchRecord,
  getLatest,
  compareMetric,
  aggregateMetrics,
  streamMetrics,
  getTopMovers,

  // Dashboards
  DashboardService,
  createDashboard,
  getDashboardWithData,
  addWidget,
  updateWidgetPositions,
  duplicateDashboard,
  shareDashboard,
  createSnapshot,

  // Funnels
  FunnelService,
  createFunnel,
  trackFunnelProgress,
  analyzeFunnel,
  getDropoffAnalysis,

  // Cohorts
  CohortService,
  createCohortDefinition,
  computeCohorts,
  getRetentionMatrix,
  calculateLTV,
  compareCohorts,
  predictChurnRisk,

  // Insights
  InsightsService,
  getInsightsFeed,
  detectAnomalies,
  analyzeTrends,
  findCorrelations,
  createInsight,
  updateInsightStatus,
  runScheduledAnalysis,

  // Reports
  ReportService,
  createReportTemplate,
  generateReport,
  scheduleReport,
  runScheduledReport,
  getReportHistory,
} from '@mcv/analytics';

// ── Client-Side Hooks ─────────────────────────────────────────
import {
  useMetricQuery,
  useMetricStream,
  useDashboard,
  useDashboardBuilder,
  useFunnelAnalysis,
  useRetentionMatrix,
  useInsightsFeed,
  useReportGenerator,
} from '@mcv/analytics';

// ── Client-Side Components ────────────────────────────────────
import {
  MetricCard,
  MetricSparkline,
  DashboardGrid,
  DashboardBuilder,
  WidgetRenderer,
  ChartWidget,
  FunnelChart,
  RetentionHeatmap,
  CohortTable,
  InsightCard,
  InsightsFeed,
  ReportViewer,
} from '@mcv/analytics';

// ── Constants ─────────────────────────────────────────────────
import {
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
} from '@mcv/analytics';
```

### Service Instantiation

All services are venture-scoped. Create instances using factory functions or constructors:

```typescript
// Factory function (preferred)
const metricsService = createMetricsService(ventureId);

// Direct construction
const dashboardService = new DashboardService(ventureId);
const funnelService = new FunnelService(ventureId);
const cohortService = new CohortService(ventureId);
const insightsService = new InsightsService(ventureId);
const reportService = new ReportService(ventureId);

// With custom DB instance (testing)
const testService = new MetricsService(ventureId, mockDb);
```

---

## Service Methods — Cohorts

### `CohortService`

The `CohortService` provides user cohort analysis for retention tracking, behavioral segmentation, lifetime value calculation, and churn prediction.

---

### `createCohort()`

Creates a new cohort definition with criteria for user grouping and retention tracking.

**Signature:**
```typescript
async createCohortDefinition(input: CreateCohortDefinitionInput): Promise<CohortDefinition>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | ✅ | Human-readable cohort name (1–255 chars) |
| `slug` | `string` | ✅ | URL-safe identifier (lowercase, hyphens, underscores) |
| `description` | `string` | ❌ | Optional description (max 1000 chars) |
| `type` | `CohortType` | ✅ | `'acquisition'` \| `'behavioral'` \| `'revenue'` \| `'custom'` |
| `period` | `CohortPeriod` | ❌ | `'day'` \| `'week'` \| `'month'` \| `'quarter'` \| `'year'` (default: `'month'`) |
| `criteria` | `CohortCriteria` | ✅ | JSON criteria for user selection (see below) |
| `retentionEvent` | `string` | ✅ | Event type that counts as "retained" (e.g., `'session.started'`) |
| `retentionFilters` | `Record<string, any>` | ❌ | Additional filters on the retention event |
| `revenueEvent` | `string` | ❌ | Event type for LTV tracking (e.g., `'purchase.completed'`) |
| `revenueField` | `string` | ❌ | Field name containing revenue value (e.g., `'amount'`) |
| `lookbackPeriods` | `number` | ❌ | Number of periods to compute (default: 12) |

**Criteria Format by Type:**
```typescript
// Acquisition cohort
{ event: 'user.created', filters: { source: { in: ['organic', 'referral'] } } }

// Behavioral cohort
{ event: 'purchase.completed', within_days: 7, count: { gte: 1 } }

// Revenue cohort
{ event: 'purchase.completed', revenue: { gte: 100 } }

// Custom cohort
{ events: ['page.viewed', 'feature.used'], all_required: true, within_days: 30 }
```

**Returns:** `Promise<CohortDefinition>`

**Example:**
```typescript
const cohortService = new CohortService(ventureId);

const definition = await cohortService.createCohortDefinition({
  name: 'Monthly Signups',
  slug: 'monthly-signups',
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
```

**Errors:** `COHORT_NOT_FOUND` (if venture invalid), `METRIC_SLUG_EXISTS` (duplicate slug)

---

### `analyzeCohort()`

Runs full cohort computation, grouping users by period and calculating retention for each period offset.

**Signature:**
```typescript
async computeCohorts(definitionId: string): Promise<ComputeCohortsResult>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `definitionId` | `string` (UUID) | ✅ | Cohort definition ID |

**Returns:** `Promise<ComputeCohortsResult>`

```typescript
interface ComputeCohortsResult {
  definitionId: string;
  cohortsComputed: number;      // Number of period-based cohorts generated
  totalUsers: number;           // Total users across all cohorts
  computeTimeMs: number;        // Processing time in milliseconds
  cohorts: Cohort[];            // Array of computed cohort instances
}
```

**Behavior:**
1. Fetches the cohort definition and its criteria
2. Queries the event store for users matching the criteria
3. Groups users into period buckets (day/week/month/quarter/year)
4. For each cohort period, checks the retention event at each subsequent period offset
5. Populates `analytics_cohorts`, `analytics_cohort_retention`, and `analytics_cohort_members`
6. Calculates LTV at 30/60/90/180/365 day horizons

**Example:**
```typescript
const result = await cohortService.computeCohorts(definition.id);
console.log(`Computed ${result.cohortsComputed} cohorts with ${result.totalUsers} total users`);
```

**Errors:** `COHORT_NOT_FOUND`, `COHORT_COMPUTE_FAILED`, `INSUFFICIENT_DATA`

---

### `getRetention()`

Returns the retention matrix for a cohort definition, formatted for heatmap visualization.

**Signature:**
```typescript
async getRetentionMatrix(
  definitionId: string,
  options?: RetentionMatrixOptions
): Promise<RetentionMatrix>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `definitionId` | `string` (UUID) | ✅ | Cohort definition ID |
| `options.startDate` | `Date` | ❌ | Filter cohorts starting from this date |
| `options.endDate` | `Date` | ❌ | Filter cohorts ending at this date |
| `options.limit` | `number` | ❌ | Max number of cohort periods to return (default: 12) |

**Returns:** `Promise<RetentionMatrix>`

```typescript
interface RetentionMatrix {
  cohorts: Array<{
    label: string;           // e.g., "Jan 2026"
    startDate: Date;
    size: number;            // Users in cohort
    retention: number[];     // [100, 85, 72, 65, ...] — % retained per period
    revenue: number[];       // Revenue at each period offset
  }>;
  periods: string[];          // ["Month 0", "Month 1", "Month 2", ...]
  averageRetention: number[]; // Average retention across all cohorts per period
}
```

**Example:**
```typescript
const matrix = await cohortService.getRetentionMatrix(definition.id, {
  startDate: new Date('2025-03-01'),
  endDate: new Date('2026-02-01'),
  limit: 12,
});

for (const cohort of matrix.cohorts) {
  const retStr = cohort.retention.map(r => `${r.toFixed(0)}%`).join('  ');
  console.log(`${cohort.label} (n=${cohort.size}): ${retStr}`);
}
```

**Errors:** `COHORT_NOT_FOUND`, `INSUFFICIENT_DATA`

---

### Additional Cohort Methods

#### `calculateLTV(definitionId, options)`

```typescript
async calculateLTV(
  definitionId: string,
  options?: { days?: number[] }  // Default: [30, 60, 90, 180, 365]
): Promise<CohortLTV[]>
```

Returns lifetime value at multiple horizons for each cohort in the definition. Each `CohortLTV` includes `cohort` label, `size`, and `ltv_N` values per horizon.

#### `compareCohorts(definitionIds)`

```typescript
async compareCohorts(definitionIds: string[]): Promise<CohortComparison>
```

Side-by-side comparison of retention, revenue, and LTV across multiple cohort definitions.

#### `predictChurnRisk(cohortId)`

```typescript
async predictChurnRisk(cohortId: string): Promise<ChurnPrediction[]>
```

Returns a 0–100 risk score per active member with risk factors and recommendations.

```typescript
interface ChurnPrediction {
  userId: string;
  riskScore: number;           // 0 (low) to 100 (high)
  riskFactors: string[];       // e.g., ["Inactive for over 30 days", "Single purchase only"]
  recommendations: string[];   // e.g., ["Send re-engagement email campaign"]
}
```

---

## Service Methods — Dashboards

### `DashboardService`

The `DashboardService` manages interactive dashboard creation, widget configuration, layout management, sharing, and data resolution.

---

### `createDashboard()`

Creates a new dashboard with default grid layout configuration.

**Signature:**
```typescript
async create(input: CreateDashboardInput, userId: string): Promise<Dashboard>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | ✅ | Dashboard name (1–255 chars) |
| `slug` | `string` | ❌ | URL-safe identifier (auto-generated from name if omitted) |
| `description` | `string` | ❌ | Optional description |
| `visibility` | `DashboardVisibility` | ❌ | `'private'` \| `'team'` \| `'venture'` \| `'public'` (default: `'private'`) |
| `teamId` | `string` | ❌ | Team ID for team-level visibility |
| `layout` | `DashboardLayoutItem[]` | ❌ | Initial widget positions on the 12-column grid |
| `widgets` | `WidgetConfig[]` | ❌ | Initial widget configurations |
| `theme` | `string` | ❌ | `'light'` \| `'dark'` (default: `'light'`) |
| `refreshInterval` | `number` | ❌ | Auto-refresh interval in seconds |
| `timezone` | `string` | ❌ | Dashboard timezone (e.g., `'America/New_York'`) |
| `dateRange` | `DateRangeConfig` | ❌ | Default date range (default: `{ type: 'relative', value: 'last_7_days' }`) |
| `filters` | `Record<string, any>` | ❌ | Global filters applied to all widgets |
| `isDefault` | `boolean` | ❌ | Set as venture's default dashboard |
| `userId` | `string` | ✅ | Creator's user ID (second parameter) |

**Returns:** `Promise<Dashboard>`

**Example:**
```typescript
const dashboardService = new DashboardService(ventureId);

const dashboard = await dashboardService.create({
  name: 'Executive Overview',
  description: 'Key business metrics at a glance',
  visibility: 'venture',
  isDefault: true,
  dateRange: { type: 'relative', value: 'last_30_days' },
}, userId);
```

**Errors:** `DASHBOARD_ACCESS_DENIED` (insufficient permissions)

---

### `addWidget()`

Adds a new widget to an existing dashboard with position, data source, and display options.

**Signature:**
```typescript
async addWidget(dashboardId: string, widget: AddWidgetInput): Promise<DashboardWidget>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dashboardId` | `string` (UUID) | ✅ | Target dashboard ID |
| `widget.title` | `string` | ❌ | Widget title |
| `widget.subtitle` | `string` | ❌ | Widget subtitle |
| `widget.type` | `WidgetType` | ✅ | Widget type (see widget types table) |
| `widget.chartType` | `ChartType` | ❌ | Chart type (required if type is `'chart'`) |
| `widget.position` | `WidgetPosition` | ✅ | Grid position `{ x, y, w, h }` |
| `widget.dataSource` | `WidgetDataSource` | ✅ | Data source configuration |
| `widget.options` | `WidgetOptions` | ❌ | Display options (legend, colors, axes, stacking) |
| `widget.filters` | `Record<string, any>` | ❌ | Widget-specific filter overrides |
| `widget.comparison` | `ComparisonConfig` | ❌ | Period comparison settings |
| `widget.drilldown` | `DrilldownConfig` | ❌ | Drilldown dimensions and links |
| `widget.cacheTtlSeconds` | `number` | ❌ | Custom cache TTL for this widget |

**Widget Data Source:**
```typescript
interface WidgetDataSource {
  type: 'metric' | 'query' | 'api';
  metricId?: string;           // For metric-backed widgets
  metricIds?: string[];        // For multi-metric widgets
  queryParams?: {
    granularity?: Granularity;
    aggregation?: Aggregation;
    dimensions?: Record<string, string>;
  };
  apiUrl?: string;             // For external API data sources
}
```

**Returns:** `Promise<DashboardWidget>`

**Example:**
```typescript
const widget = await dashboardService.addWidget(dashboard.id, {
  title: 'Revenue Trend',
  type: 'chart',
  chartType: 'line',
  position: { x: 0, y: 0, w: 8, h: 4 },
  dataSource: {
    type: 'metric',
    metricId: revenueMetricId,
    queryParams: { granularity: 'day', aggregation: 'sum' },
  },
  options: { showLegend: true, stacked: false, fill: true },
  comparison: { enabled: true, type: 'previous_period', showDelta: true },
});
```

**Errors:** `DASHBOARD_NOT_FOUND`, `DASHBOARD_EDIT_DENIED`, `METRIC_NOT_FOUND`

---

### `getDashboard()`

Fetches a dashboard with all widget configurations and resolved data for rendering.

**Signature:**
```typescript
async getWithData(dashboardId: string, userId: string): Promise<DashboardWithData>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dashboardId` | `string` (UUID) | ✅ | Dashboard ID |
| `userId` | `string` | ✅ | Requesting user ID (for access control) |

**Returns:** `Promise<DashboardWithData>`

```typescript
interface DashboardWithData {
  dashboard: Dashboard;
  widgets: Array<{
    widget: DashboardWidget;
    data: WidgetData;           // Resolved metric data for the widget
    cached: boolean;            // Whether data came from cache
    resolvedAt: Date;           // When the data was fetched/cached
  }>;
  metadata: {
    renderTimeMs: number;       // Total dashboard render time
    cacheHitRate: number;       // % of widgets served from cache
    dateRange: { start: Date; end: Date };
  };
}
```

**Behavior:**
1. Validates user has view access based on dashboard visibility
2. Resolves date range (relative → absolute) using dashboard timezone
3. Fetches all widget data in parallel via `Promise.all()`
4. Each widget checks Redis cache first, falls back to service query
5. Increments dashboard `viewCount` and updates `lastViewedAt`
6. Emits `analytics.dashboard.viewed` audit event

**Example:**
```typescript
const dashboardData = await dashboardService.getWithData(dashboard.id, userId);
console.log(`Rendered in ${dashboardData.metadata.renderTimeMs}ms`);
console.log(`Cache hit rate: ${(dashboardData.metadata.cacheHitRate * 100).toFixed(0)}%`);
```

**Errors:** `DASHBOARD_NOT_FOUND`, `DASHBOARD_ACCESS_DENIED`

---

### Additional Dashboard Methods

#### `updateWidgetPositions(dashboardId, positions)`

```typescript
async updateWidgetPositions(
  dashboardId: string,
  positions: Array<{ widgetId: string; position: WidgetPosition }>
): Promise<void>
```

Batch-updates widget grid positions after drag-and-drop. Atomic transaction ensures consistency.

#### `duplicateDashboard(dashboardId, newName, userId)`

```typescript
async duplicate(dashboardId: string, newName: string, userId: string): Promise<Dashboard>
```

Deep-clones a dashboard including all widgets. New dashboard is always `private` initially.

#### `shareDashboard(dashboardId, sharing)`

```typescript
async share(
  dashboardId: string,
  sharing: { visibility: DashboardVisibility; users?: string[]; teams?: string[]; editors?: string[]; password?: string }
): Promise<Dashboard>
```

Updates dashboard visibility and sharing settings. Generates `publicSlug` for public dashboards.

#### `createSnapshot(dashboardId, options)`

```typescript
async createSnapshot(
  dashboardId: string,
  options?: { name?: string; delivery?: DeliveryConfig }
): Promise<DashboardSnapshot>
```

Captures a point-in-time snapshot of all widget data. Optionally delivers via email/Slack.

---

## Service Methods — Funnels

### `FunnelService`

The `FunnelService` manages conversion funnel definitions, user progress tracking, and performance analysis.

---

### `createFunnel()`

Creates a new conversion funnel with ordered steps.

**Signature:**
```typescript
async create(input: CreateFunnelInput): Promise<{ funnel: Funnel; steps: FunnelStep[] }>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | ✅ | Funnel name (1–255 chars) |
| `slug` | `string` | ✅ | URL-safe identifier |
| `description` | `string` | ❌ | Optional description |
| `category` | `string` | ❌ | Funnel category (e.g., `'commerce'`, `'onboarding'`) |
| `completionType` | `StepCompletionType` | ❌ | `'ordered'` \| `'any'` \| `'all'` (default: `'ordered'`) |
| `conversionWindow` | `number` | ❌ | Max hours from entry to conversion (default: 168 / 7 days) |
| `attributionModel` | `string` | ❌ | `'first_touch'` \| `'last_touch'` \| `'linear'` \| `'time_decay'` |
| `steps` | `CreateFunnelStepInput[]` | ✅ | Array of funnel step definitions (min 2, max 20) |

**Step Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | ✅ | Step name (e.g., "Added to Cart") |
| `eventType` | `string` | ✅ | Event type to match (e.g., `'cart.item_added'`) |
| `eventFilters` | `Record<string, any>` | ❌ | Additional event property filters |
| `isRequired` | `boolean` | ❌ | Whether step is required for completion (default: `true`) |
| `maxSecondsFromPrevious` | `number` | ❌ | Time constraint from previous step |
| `variants` | `FunnelStepVariant[]` | ❌ | A/B test variant definitions |

**Returns:** `Promise<{ funnel: Funnel; steps: FunnelStep[] }>`

**Example:**
```typescript
const funnelService = new FunnelService(ventureId);

const { funnel, steps } = await funnelService.create({
  name: 'Checkout Funnel',
  slug: 'checkout',
  category: 'commerce',
  completionType: 'ordered',
  conversionWindow: 72,
  steps: [
    { name: 'Product Viewed', eventType: 'product.viewed' },
    { name: 'Added to Cart', eventType: 'cart.item_added' },
    { name: 'Checkout Started', eventType: 'checkout.started' },
    { name: 'Payment Entered', eventType: 'checkout.payment_entered',
      maxSecondsFromPrevious: 600 },
    { name: 'Purchase Complete', eventType: 'purchase.completed' },
  ],
});
```

**Errors:** `BATCH_TOO_LARGE` (> 20 steps)

---

### `analyzeFunnel()`

Performs full step-by-step funnel performance analysis over a date range.

**Signature:**
```typescript
async analyze(
  funnelId: string,
  options?: FunnelAnalysisOptions
): Promise<FunnelAnalysis>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `funnelId` | `string` (UUID) | ✅ | Funnel ID |
| `options.startDate` | `Date` | ❌ | Analysis start date (default: 30 days ago) |
| `options.endDate` | `Date` | ❌ | Analysis end date (default: now) |
| `options.segments` | `string[]` | ❌ | Dimensions to segment by (e.g., `['source', 'device']`) |
| `options.variantId` | `string` | ❌ | Filter to specific A/B variant |

**Returns:** `Promise<FunnelAnalysis>`

```typescript
interface FunnelAnalysis {
  funnel: Funnel;
  steps: Array<{
    step: FunnelStep;
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
```

**Example:**
```typescript
const analysis = await funnelService.analyze(funnel.id, {
  startDate: new Date('2026-01-08'),
  endDate: new Date('2026-02-08'),
  segments: ['source', 'device', 'country'],
});

console.log(`Overall conversion: ${analysis.overall.overallConversionRate.toFixed(1)}%`);
console.log(`Bottleneck: ${analysis.overall.bottleneckStep}`);
```

**Errors:** `FUNNEL_NOT_FOUND`, `FUNNEL_INACTIVE`, `INVALID_DATE_RANGE`, `INSUFFICIENT_DATA`

---

### `getConversion()`

Tracks a user progressing through a funnel step and returns the current conversion record.

**Signature:**
```typescript
async trackProgress(
  funnelId: string,
  eventType: string,
  eventProperties: Record<string, any>,
  context: FunnelTrackingContext
): Promise<FunnelConversion>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `funnelId` | `string` (UUID) | ✅ | Funnel ID |
| `eventType` | `string` | ✅ | Event type being tracked (e.g., `'cart.item_added'`) |
| `eventProperties` | `Record<string, any>` | ✅ | Event-specific properties |
| `context.userId` | `string` | ❌ | Authenticated user ID |
| `context.anonymousId` | `string` | ❌ | Anonymous tracking ID (one of userId or anonymousId required) |
| `context.sessionId` | `string` | ❌ | Session identifier |
| `context.source` | `string` | ❌ | Traffic source |
| `context.medium` | `string` | ❌ | Traffic medium |
| `context.campaign` | `string` | ❌ | Campaign name |
| `context.device` | `string` | ❌ | Device type |
| `context.browser` | `string` | ❌ | Browser name |
| `context.country` | `string` | ❌ | Country code |
| `context.variantId` | `string` | ❌ | A/B test variant ID |

**Returns:** `Promise<FunnelConversion>`

**Behavior:**
1. Matches `eventType` to a funnel step
2. Finds or creates a conversion record for the user
3. Verifies step ordering (for `ordered` funnels)
4. Checks `maxSecondsFromPrevious` time constraint
5. Updates `completedSteps[]` and `stepTimestamps`
6. Increments step-level counters
7. Marks `isConverted = true` if final step completed

**Example:**
```typescript
const conversion = await funnelService.trackProgress(
  funnel.id,
  'cart.item_added',
  { productId: 'prod_123', quantity: 1 },
  { userId: 'user_456', sessionId: 'sess_789', device: 'mobile' }
);

console.log(`Current step: ${conversion.currentStepOrder}`);
console.log(`Converted: ${conversion.isConverted}`);
```

**Errors:** `FUNNEL_NOT_FOUND`, `FUNNEL_INACTIVE`, `FUNNEL_STEP_ORDER`, `FUNNEL_TIME_CONSTRAINT`

---

### Additional Funnel Methods

#### `getDropoffAnalysis(funnelId, options)`

```typescript
async getDropoffAnalysis(
  funnelId: string,
  options?: { startDate?: Date; endDate?: Date }
): Promise<DropoffAnalysis>
```

Returns AI-powered drop-off analysis with categorized reasons (UX, technical, pricing), confidence scores, and actionable recommendations per step.

---

## Service Methods — Insights

### `InsightsService`

The `InsightsService` provides AI-powered analytics intelligence — anomaly detection, trend analysis, correlation discovery, and a prioritized insight feed.

---

### `getInsights()`

Retrieves the prioritized insight feed with filtering and pagination.

**Signature:**
```typescript
async getInsightsFeed(filters?: InsightFilters): Promise<PaginatedResponse<Insight>>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filters.types` | `InsightType[]` | ❌ | Filter by insight type |
| `filters.priorities` | `InsightPriority[]` | ❌ | Filter by priority level |
| `filters.status` | `InsightStatus` | ❌ | Filter by lifecycle status |
| `filters.metricId` | `string` | ❌ | Filter by linked metric |
| `filters.dashboardId` | `string` | ❌ | Filter by linked dashboard |
| `filters.startDate` | `Date` | ❌ | Filter by creation date (from) |
| `filters.endDate` | `Date` | ❌ | Filter by creation date (to) |
| `filters.page` | `number` | ❌ | Page number (default: 1) |
| `filters.pageSize` | `number` | ❌ | Items per page (default: 20, max: 100) |

**Returns:** `Promise<PaginatedResponse<Insight>>`

```typescript
interface Insight {
  id: string;
  ventureId: string;
  type: InsightType;
  priority: InsightPriority;
  status: InsightStatus;
  title: string;
  summary: string;
  details?: string;
  metricId?: string;
  dashboardId?: string;
  funnelId?: string;
  cohortId?: string;
  data: Record<string, any>;              // Type-specific analysis payload
  confidence?: number;                     // 0.0 to 1.0
  modelVersion?: string;
  recommendations?: Array<{ action: string; priority: string }>;
  estimatedImpact?: { metric: string; value: number; unit: string; timeframe: string };
  // Lifecycle timestamps
  viewedAt?: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  dismissedAt?: Date;
  dismissReason?: string;
  wasHelpful?: boolean;
  feedback?: string;
  expiresAt?: Date;
  createdAt: Date;
}
```

**Example:**
```typescript
const insightsService = new InsightsService(ventureId);

const feed = await insightsService.getInsightsFeed({
  priorities: ['critical', 'high'],
  status: 'new',
  limit: 10,
});

for (const insight of feed.items) {
  console.log(`[${insight.priority.toUpperCase()}] ${insight.title}`);
  console.log(`  ${insight.summary}`);
}
```

**Errors:** `INVALID_DATE_RANGE`

---

### `getAnomalies()`

Runs anomaly detection on a specific metric using Z-score analysis.

**Signature:**
```typescript
async detectAnomalies(
  metricId: string,
  options?: AnomalyDetectionOptions
): Promise<AnomalyDetectionResult | null>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metricId` | `string` (UUID) | ✅ | Metric to analyze |
| `options.lookbackDays` | `number` | ❌ | Historical data window (default: 90) |
| `options.sensitivity` | `number` | ❌ | Detection sensitivity 0.0–1.0 (default: 0.95) |
| `options.minConfidence` | `number` | ❌ | Minimum confidence to report (default: 0.80) |

**Returns:** `Promise<AnomalyDetectionResult | null>` — `null` if no anomaly detected

```typescript
interface AnomalyDetectionResult {
  metricId: string;
  metricName: string;
  expected: number;            // Expected value based on historical mean
  actual: number;              // Actual latest value
  deviation: number;           // Percentage deviation from expected
  direction: 'above' | 'below';
  zScore: number;              // Standard deviations from mean
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;          // 0.0 to 1.0
  historicalMean: number;
  historicalStdDev: number;
  dataPointsAnalyzed: number;
}
```

**Example:**
```typescript
const anomaly = await insightsService.detectAnomalies(revenueMetricId);

if (anomaly) {
  console.log(`ANOMALY: ${anomaly.metricName}`);
  console.log(`Expected: $${anomaly.expected.toFixed(0)}, Actual: $${anomaly.actual.toFixed(0)}`);
  console.log(`Deviation: ${anomaly.deviation.toFixed(1)}% ${anomaly.direction}`);
  console.log(`Severity: ${anomaly.severity} (z=${anomaly.zScore.toFixed(2)})`);
}
```

**Errors:** `METRIC_NOT_FOUND`, `INSUFFICIENT_DATA` (< 30 data points)

---

### `generateSummary()`

Generates an AI-powered natural language summary combining trend analysis, correlation discovery, and projections.

**Signature:**
```typescript
async analyzeTrends(
  metricId: string,
  days?: number
): Promise<TrendAnalysis>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metricId` | `string` (UUID) | ✅ | Metric to analyze |
| `days` | `number` | ❌ | Lookback window in days (default: 30) |

**Returns:** `Promise<TrendAnalysis>`

```typescript
interface TrendAnalysis {
  metricId: string;
  metricName: string;
  direction: 'up' | 'down' | 'stable';
  strength: number;             // R² coefficient of determination (0.0–1.0)
  slope: number;                // Rate of change per day
  intercept: number;
  percentChange: number;        // Total % change over the period
  dataPointsAnalyzed: number;
  projections: Array<{
    period: string;             // "7d", "14d", "30d"
    value: number;
    confidence: {
      low: number;              // Lower bound (95% CI)
      high: number;             // Upper bound (95% CI)
    };
  }>;
  seasonality?: {
    detected: boolean;
    pattern?: string;           // "weekly", "monthly"
    strength?: number;          // 0.0–1.0
  };
}
```

**Example:**
```typescript
const trend = await insightsService.analyzeTrends(signupsMetricId, 30);

console.log(`Direction: ${trend.direction} (strength: ${trend.strength.toFixed(2)})`);
for (const proj of trend.projections) {
  console.log(`  Next ${proj.period}: ${proj.value.toFixed(0)} [${proj.confidence.low.toFixed(0)}–${proj.confidence.high.toFixed(0)}]`);
}
```

**Errors:** `METRIC_NOT_FOUND`, `INSUFFICIENT_DATA`

---

### Additional Insight Methods

#### `findCorrelations(metricId, options)`

```typescript
async findCorrelations(
  metricId: string,
  options?: { minCorrelation?: number; lags?: number[] }
): Promise<CorrelationResult[]>
```

Discovers correlated metrics using Pearson r with configurable lag support. Returns metric pairs with |r| > threshold.

```typescript
interface CorrelationResult {
  metricId: string;
  metricName: string;
  correlation: number;         // Pearson r (-1.0 to 1.0)
  lag: number;                 // Days of lag
  relationship: 'positive' | 'negative';
}
```

#### `createInsight(input)`

```typescript
async createInsight(input: CreateInsightInput): Promise<Insight>
```

Manually creates an insight record (for rule-based or custom insight generation).

#### `updateInsightStatus(insightId, update)`

```typescript
async updateInsightStatus(
  insightId: string,
  update: { status: InsightStatus; userId: string; feedback?: string; wasHelpful?: boolean; dismissReason?: string }
): Promise<Insight>
```

Transitions an insight through its lifecycle (new → viewed → acknowledged → resolved/dismissed).

#### `runScheduledAnalysis()`

```typescript
async runScheduledAnalysis(): Promise<ScheduledAnalysisResult>
```

Cron target: runs batch anomaly detection and trend analysis for all active metrics. Returns counts of anomalies, trends, and correlations discovered.

---

## Service Methods — Metrics

### `MetricsService`

The `MetricsService` is the foundational data layer for the analytics domain, providing metric definition management, value recording, time-series querying, and real-time streaming.

---

### `defineMetric()`

Creates a new metric definition with type, category, dimensions, and formatting rules.

**Signature:**
```typescript
async createDefinition(input: CreateMetricInput): Promise<MetricDefinition>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | ✅ | Human-readable name (1–255 chars) |
| `slug` | `string` | ✅ | URL-safe identifier (`/^[a-z0-9_-]+$/`, 1–100 chars) |
| `description` | `string` | ❌ | Optional description (max 1000 chars) |
| `type` | `MetricType` | ✅ | `'counter'` \| `'gauge'` \| `'histogram'` \| `'rate'` |
| `category` | `MetricCategory` | ✅ | `'revenue'` \| `'engagement'` \| `'acquisition'` \| `'retention'` \| `'performance'` \| `'operational'` \| `'custom'` |
| `unit` | `string` | ❌ | Unit label (e.g., `'USD'`, `'users'`, `'%'`, `'ms'`) |
| `format` | `string` | ❌ | Display format: `'number'` \| `'currency'` \| `'percent'` \| `'duration'` |
| `dimensions` | `string[]` | ❌ | Allowed dimension keys (max 20) |
| `metadata` | `Record<string, unknown>` | ❌ | Arbitrary metadata (target, alert threshold, etc.) |

**Returns:** `Promise<MetricDefinition>`

**Example:**
```typescript
const metricsService = createMetricsService(ventureId);

const metric = await metricsService.createDefinition({
  name: 'Monthly Recurring Revenue',
  slug: 'mrr',
  type: 'gauge',
  category: 'revenue',
  unit: 'USD',
  format: 'currency',
  dimensions: ['plan', 'region'],
  metadata: { target: 50000, alertThreshold: 40000 },
});
```

**Errors:** `METRIC_SLUG_EXISTS` (slug already taken in this venture)

---

### `queryMetric()`

Queries time-series data for a metric with granularity bucketing, dimension filtering, and aggregation.

**Signature:**
```typescript
async query(params: MetricQueryParams): Promise<MetricTimeSeries>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metricId` | `string` (UUID) | ✅ | Metric definition ID |
| `startDate` | `Date` | ✅ | Query start date |
| `endDate` | `Date` | ✅ | Query end date |
| `granularity` | `Granularity` | ❌ | `'hour'` \| `'day'` \| `'week'` \| `'month'` (default: `'day'`) |
| `dimensions` | `Record<string, string>` | ❌ | Dimension value filters |
| `aggregation` | `Aggregation` | ❌ | `'sum'` \| `'avg'` \| `'count'` \| `'min'` \| `'max'` (default: `'sum'`) |

**Returns:** `Promise<MetricTimeSeries>`

```typescript
interface MetricTimeSeries {
  metric: MetricDefinition;
  points: Array<{
    timestamp: Date;
    value: number;
    count: number;
  }>;
  summary: {
    min: number;
    max: number;
    avg: number;
    total: number;
    dataPoints: number;
  };
}
```

**Example:**
```typescript
const timeSeries = await metricsService.query({
  metricId: revenueMetricId,
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
  granularity: 'day',
  aggregation: 'sum',
  dimensions: { region: 'us-east' },
});

console.log(`Points: ${timeSeries.points.length}`);
console.log(`Total: $${timeSeries.summary.total}`);
```

**Errors:** `METRIC_NOT_FOUND`, `INVALID_DATE_RANGE`

---

### `getTimeSeries()`

Alias for real-time metric streaming via Redis pub/sub.

**Signature:**
```typescript
async streamMetrics(
  slugs: string[],
  callback: (updates: Record<string, number>) => void
): Promise<() => void>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slugs` | `string[]` | ✅ | Metric slugs to subscribe to |
| `callback` | `Function` | ✅ | Callback invoked on each update |

**Returns:** `Promise<() => void>` — Unsubscribe function

**Example:**
```typescript
const unsubscribe = await metricsService.streamMetrics(
  ['mrr', 'active_users', 'orders_per_minute'],
  (updates) => {
    for (const [slug, value] of Object.entries(updates)) {
      console.log(`[LIVE] ${slug}: ${value}`);
    }
  }
);

// Cleanup
unsubscribe();
```

---

### Additional Metrics Methods

#### `recordValue(metricId, value, dimensions?, timestamp?)`

```typescript
async recordValue(
  metricId: string,
  value: number,
  dimensions?: Record<string, string>,
  timestamp?: Date
): Promise<void>
```

Records a single metric value. Validates metric belongs to venture, inserts raw value, upserts pre-aggregated granularity buckets, and publishes to Redis pub/sub.

**Errors:** `METRIC_NOT_FOUND`, `METRIC_VALUE_INVALID`

#### `batchRecord(entries)`

```typescript
async batchRecord(entries: MetricEntry[]): Promise<void>
```

Batch-records up to 1,000 metric values in a single statement. Validates all metric IDs before inserting.

```typescript
interface MetricEntry {
  metricId: string;
  value: number;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}
```

**Errors:** `BATCH_TOO_LARGE` (> 1000), `BATCH_METRIC_MISMATCH`, `METRIC_VALUE_INVALID`

#### `getLatest(metricId)`

```typescript
async getLatest(metricId: string): Promise<MetricValue | null>
```

Returns the most recent value for a metric. Cached in Redis with 30s TTL.

#### `compareMetric(metricId, periods)`

```typescript
async compare(
  metricId: string,
  periods: Array<{ startDate: Date; endDate: Date; label: string }>
): Promise<ComparisonResult>
```

Multi-period comparison (2–10 periods) with absolute and percentage change calculations.

```typescript
interface ComparisonResult {
  periods: Array<{ label: string; value: number; count: number }>;
  changes: Array<{
    fromPeriod: number;
    toPeriod: number;
    absoluteChange: number;
    percentChange: number | null;
  }>;
}
```

#### `aggregateMetrics(params)`

```typescript
async aggregate(params: AggregationParams): Promise<AggregatedMetric[]>
```

Multi-metric aggregation with optional group-by dimension.

```typescript
interface AggregationParams {
  metricIds: string[];         // 1–50 metric IDs
  startDate: Date;
  endDate: Date;
  aggregation: Aggregation;
  groupBy?: string;            // Dimension to group by
}
```

#### `getTopMovers(options)`

```typescript
async getTopMovers(options?: {
  limit?: number;
  category?: MetricCategory;
  direction?: 'up' | 'down' | 'both';
}): Promise<TopMover[]>
```

Returns metrics with the largest period-over-period changes.

---

## Service Methods — Reports

### `ReportService`

The `ReportService` manages report templates, schedules, and generation with multi-format export and automated delivery.

---

### `createReport()`

Creates a new report template definition.

**Signature:**
```typescript
async createTemplate(input: CreateReportTemplateInput): Promise<ReportTemplate>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | ✅ | Template name (1–255 chars) |
| `slug` | `string` | ✅ | URL-safe identifier |
| `description` | `string` | ❌ | Optional description |
| `type` | `ReportType` | ✅ | `'dashboard_snapshot'` \| `'metric_summary'` \| `'funnel_analysis'` \| `'cohort_analysis'` \| `'custom_query'` \| `'executive_summary'` |
| `config` | `ReportConfig` | ✅ | Type-specific configuration (see below) |
| `layout` | `ReportLayout` | ❌ | Page layout settings |
| `branding` | `ReportBranding` | ❌ | Branding customization |
| `defaultFormats` | `ReportFormat[]` | ❌ | Default export formats (default: `['pdf']`) |

**Config by Report Type:**
```typescript
// metric_summary
{ metricIds: string[], comparison: { enabled: boolean, type: 'previous_period' }, includeSparklines: boolean }

// funnel_analysis
{ funnelId: string, segments: string[], includeDropoffAnalysis: boolean }

// cohort_analysis
{ cohortDefinitionId: string, includeRetentionMatrix: boolean, includeLTV: boolean }

// dashboard_snapshot
{ dashboardId: string }

// executive_summary
{ metricIds: string[], comparison: { enabled: true, type: 'previous_period' },
  includeFunnelSummary: boolean, includeTopInsights: boolean }

// custom_query
{ query: string, parameters: Record<string, any> }  // Read-only SQL
```

**Layout Options:**
```typescript
interface ReportLayout {
  orientation: 'portrait' | 'landscape';
  pageSize: 'A4' | 'Letter' | 'Legal';
  margins: { top: number; right: number; bottom: number; left: number };
  header: { logo: boolean; title: boolean; dateRange: boolean };
  footer: { pageNumbers: boolean; generatedAt: boolean };
}
```

**Branding Options:**
```typescript
interface ReportBranding {
  logo?: string;              // URL to logo image
  primaryColor?: string;      // Hex color (e.g., '#4f46e5')
  fontFamily?: string;        // Font family (e.g., 'Inter')
}
```

**Returns:** `Promise<ReportTemplate>`

**Example:**
```typescript
const reportService = new ReportService(ventureId);

const template = await reportService.createTemplate({
  name: 'Weekly Executive Summary',
  slug: 'weekly-executive',
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
    logo: 'https://cdn.venture.com/logo.svg',
    primaryColor: '#4f46e5',
    fontFamily: 'Inter',
  },
  defaultFormats: ['pdf', 'excel'],
});
```

**Errors:** `METRIC_NOT_FOUND` (if referenced metrics don't exist)

---

### `scheduleReport()`

Creates a recurring report schedule with automated delivery.

**Signature:**
```typescript
async scheduleReport(input: ScheduleReportInput): Promise<ReportSchedule>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `templateId` | `string` (UUID) | ✅ | Report template ID |
| `name` | `string` | ✅ | Schedule name (e.g., "Monday Morning Report") |
| `frequency` | `ReportFrequency` | ✅ | `'once'` \| `'daily'` \| `'weekly'` \| `'biweekly'` \| `'monthly'` \| `'quarterly'` \| `'yearly'` |
| `scheduleConfig` | `ScheduleConfig` | ✅ | Timing configuration |
| `dateRangeConfig` | `DateRangeConfig` | ❌ | How to calculate the report's date range |
| `formats` | `ReportFormat[]` | ❌ | Output formats (default: template's defaultFormats) |
| `delivery` | `DeliveryConfig` | ✅ | Delivery channel configuration |
| `isActive` | `boolean` | ❌ | Whether schedule is active (default: `true`) |

**Schedule Config:**
```typescript
interface ScheduleConfig {
  dayOfWeek?: number;    // 0 (Sun) – 6 (Sat), for weekly/biweekly
  dayOfMonth?: number;   // 1–31, for monthly/quarterly/yearly
  month?: number;        // 1–12, for yearly
  hour: number;          // 0–23
  minute: number;        // 0–59
  timezone: string;      // IANA timezone (e.g., 'America/New_York')
}
```

**Delivery Config:**
```typescript
interface DeliveryConfig {
  email?: {
    recipients: string[];
    subject?: string;            // Supports {{dateRange}} placeholder
    body?: string;
  };
  slack?: {
    channelId: string;
    message?: string;
  };
  storage?: {
    enabled: boolean;
    path?: string;               // Supports {{year}}, {{month}} placeholders
  };
}
```

**Returns:** `Promise<ReportSchedule>`

**Example:**
```typescript
const schedule = await reportService.scheduleReport({
  templateId: template.id,
  name: 'Monday Morning Report',
  frequency: 'weekly',
  scheduleConfig: {
    dayOfWeek: 1,
    hour: 9,
    minute: 0,
    timezone: 'America/New_York',
  },
  dateRangeConfig: { type: 'previous_period' },
  formats: ['pdf'],
  delivery: {
    email: {
      recipients: ['ceo@venture.com', 'vp-product@venture.com'],
      subject: 'Weekly Analytics Report - {{dateRange}}',
    },
    storage: { enabled: true, path: '/reports/{{year}}/{{month}}/' },
  },
});

console.log(`Next run: ${schedule.nextRunAt}`);
```

**Errors:** `REPORT_TEMPLATE_NOT_FOUND`

---

### `generateReport()`

Generates a one-shot report from a template for a specific date range.

**Signature:**
```typescript
async generateReport(input: GenerateReportInput): Promise<GeneratedReport[]>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `templateId` | `string` (UUID) | ✅ | Report template ID |
| `dateRange` | `{ start: Date; end: Date }` | ✅ | Report date range |
| `formats` | `ReportFormat[]` | ❌ | Output formats (default: template's defaultFormats) |
| `generatedBy` | `string` | ❌ | User ID of the requester |

**Returns:** `Promise<GeneratedReport[]>` — One entry per requested format

```typescript
interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  generatedAt: Date;
  generatedBy?: string;
  generationTimeMs: number;
  format: ReportFormat;
  fileUrl: string;
  fileSize: number;
  status: 'generated' | 'delivered' | 'failed' | 'expired';
  deliveryStatus?: Record<string, any>;
  expiresAt: Date;
}
```

**Example:**
```typescript
const reports = await reportService.generateReport({
  templateId: template.id,
  dateRange: {
    start: new Date('2026-01-01'),
    end: new Date('2026-01-31'),
  },
  formats: ['pdf', 'csv', 'json'],
});

for (const report of reports) {
  console.log(`${report.format}: ${report.fileUrl} (${(report.fileSize / 1024).toFixed(1)} KB)`);
}
```

**Errors:** `REPORT_TEMPLATE_NOT_FOUND`, `REPORT_GENERATION_FAILED`, `REPORT_TOO_LARGE`, `INVALID_DATE_RANGE`

---

### Additional Report Methods

#### `runScheduledReport(scheduleId)`

```typescript
async runScheduledReport(scheduleId: string): Promise<GeneratedReport[]>
```

Executes a specific schedule immediately (cron target). Calculates date range from schedule config, generates report, delivers, and updates schedule tracking fields.

#### `getReportHistory(options)`

```typescript
async getReportHistory(options?: {
  templateId?: string;
  scheduleId?: string;
  format?: ReportFormat;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<GeneratedReport>>
```

Paginated list of previously generated reports with filtering.

---

## Types

### Core Type Definitions

```typescript
// ═══════════════════════════════════════════════════════════
// METRIC TYPES
// ═══════════════════════════════════════════════════════════

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'rate';

export type MetricCategory =
  | 'revenue' | 'engagement' | 'acquisition' | 'retention'
  | 'performance' | 'operational' | 'custom';

export type Granularity = 'hour' | 'day' | 'week' | 'month';

export type Aggregation = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface MetricDefinition {
  id: string;
  ventureId: string;
  name: string;
  slug: string;
  description?: string;
  type: MetricType;
  category: MetricCategory;
  unit?: string;
  format?: string;
  isActive: boolean;
  dimensions?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetricValue {
  id: string;
  metricId: string;
  value: number;
  dimensions?: Record<string, string>;
  timestamp: Date;
  createdAt: Date;
}

export interface MetricEntry {
  metricId: string;
  value: number;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export interface MetricQueryParams {
  metricId: string;
  startDate: Date;
  endDate: Date;
  granularity?: Granularity;
  dimensions?: Record<string, string>;
  aggregation?: Aggregation;
}

export interface MetricTimeSeries {
  metric: MetricDefinition;
  points: Array<{ timestamp: Date; value: number; count: number }>;
  summary: { min: number; max: number; avg: number; total: number; dataPoints: number };
}

export interface MetricResult {
  value: number;
  count: number;
  timestamp: Date;
}

export interface ComparisonResult {
  periods: Array<{ label: string; value: number; count: number }>;
  changes: Array<{
    fromPeriod: number;
    toPeriod: number;
    absoluteChange: number;
    percentChange: number | null;
  }>;
}

export interface AggregatedMetric {
  metricId: string;
  metricName: string;
  value: number;
  count: number;
  groupBy?: string;
  groupValue?: string;
}

export type CreateMetricInput = Omit<MetricDefinition, 'id' | 'ventureId' | 'isActive' | 'createdAt' | 'updatedAt'>;
export type UpdateMetricInput = Partial<CreateMetricInput>;

// ═══════════════════════════════════════════════════════════
// DASHBOARD TYPES
// ═══════════════════════════════════════════════════════════

export type DashboardVisibility = 'private' | 'team' | 'venture' | 'public';

export type WidgetType =
  | 'metric' | 'chart' | 'table' | 'funnel' | 'cohort'
  | 'map' | 'leaderboard' | 'text' | 'image' | 'iframe' | 'countdown';

export type ChartType =
  | 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'scatter'
  | 'heatmap' | 'treemap' | 'sankey' | 'radar' | 'gauge';

export interface Dashboard {
  id: string;
  ventureId: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  teamId?: string;
  visibility: DashboardVisibility;
  sharedWith?: { users: string[]; teams: string[]; editors: string[] };
  publicSlug?: string;
  layout?: Record<string, any>;
  theme: string;
  refreshInterval?: number;
  timezone?: string;
  dateRange?: Record<string, any>;
  filters?: Record<string, any>;
  isDefault: boolean;
  isArchived: boolean;
  viewCount: number;
  lastViewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  title?: string;
  subtitle?: string;
  type: WidgetType;
  chartType?: ChartType;
  position: { x: number; y: number; w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number };
  dataSource: { type: string; metricId?: string; metricIds?: string[]; queryParams?: Record<string, any> };
  options?: Record<string, any>;
  filters?: Record<string, any>;
  comparison?: Record<string, any>;
  drilldown?: Record<string, any>;
  displayOrder: number;
  isVisible: boolean;
  cacheTtlSeconds?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWithData {
  dashboard: Dashboard;
  widgets: Array<{ widget: DashboardWidget; data: any; cached: boolean; resolvedAt: Date }>;
  metadata: { renderTimeMs: number; cacheHitRate: number; dateRange: { start: Date; end: Date } };
}

export type CreateDashboardInput = Omit<Dashboard, 'id' | 'ventureId' | 'ownerId' | 'viewCount' | 'lastViewedAt' | 'isArchived' | 'createdAt' | 'updatedAt'>;

// ═══════════════════════════════════════════════════════════
// FUNNEL TYPES
// ═══════════════════════════════════════════════════════════

export type StepCompletionType = 'ordered' | 'any' | 'all';

export interface Funnel {
  id: string;
  ventureId: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  completionType: StepCompletionType;
  conversionWindow: number;    // Hours
  attributionModel: string;
  ownerId?: string;
  totalEntered: number;
  totalConverted: number;
  overallConversionRate?: number;
  avgTimeToConvert?: number;
  lastAnalyzedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelStep {
  id: string;
  funnelId: string;
  name: string;
  eventType: string;
  eventFilters?: Record<string, any>;
  stepOrder: number;
  isRequired: boolean;
  maxSecondsFromPrevious?: number;
  enteredCount: number;
  completedCount: number;
  conversionRate?: number;
  dropOffRate?: number;
  avgTimeToComplete?: number;
  variants?: Array<{ id: string; name: string; filters: Record<string, any> }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelConversion {
  id: string;
  funnelId: string;
  userId?: string;
  anonymousId?: string;
  sessionId?: string;
  enteredAt: Date;
  convertedAt?: Date;
  currentStepOrder: number;
  completedSteps: number[];
  stepTimestamps: Record<string, string>;
  isConverted: boolean;
  isAbandoned: boolean;
  abandonedAtStep?: number;
  source?: string;
  medium?: string;
  campaign?: string;
  device?: string;
  browser?: string;
  country?: string;
  variantId?: string;
  conversionValue?: number;
  properties?: Record<string, any>;
  createdAt: Date;
}

export interface FunnelAnalysis {
  funnel: Funnel;
  steps: Array<{
    step: FunnelStep;
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
  trends: { daily: Array<{ date: string; entered: number; converted: number; rate: number }> };
  segments: Record<string, { entered: number; converted: number; rate: number }>;
}

export type CreateFunnelInput = {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  completionType?: StepCompletionType;
  conversionWindow?: number;
  attributionModel?: string;
  steps: Array<{
    name: string;
    eventType: string;
    eventFilters?: Record<string, any>;
    isRequired?: boolean;
    maxSecondsFromPrevious?: number;
    variants?: Array<{ id: string; name: string; filters: Record<string, any> }>;
  }>;
};

// ═══════════════════════════════════════════════════════════
// COHORT TYPES
// ═══════════════════════════════════════════════════════════

export type CohortType = 'acquisition' | 'behavioral' | 'revenue' | 'custom';
export type CohortPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface CohortDefinition {
  id: string;
  ventureId: string;
  name: string;
  slug: string;
  description?: string;
  type: CohortType;
  period: CohortPeriod;
  criteria: Record<string, any>;
  retentionEvent: string;
  retentionFilters?: Record<string, any>;
  revenueEvent?: string;
  revenueField?: string;
  isActive: boolean;
  lookbackPeriods: number;
  lastComputedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cohort {
  id: string;
  definitionId: string;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  userCount: number;
  totalRevenue: number;
  avgRevenue: number;
  ltv30?: number;
  ltv60?: number;
  ltv90?: number;
  ltv180?: number;
  ltv365?: number;
  churnedCount: number;
  churnRate?: number;
  createdAt: Date;
}

export interface CohortRetention {
  id: string;
  cohortId: string;
  periodOffset: number;
  periodLabel?: string;
  retainedCount: number;
  retentionRate?: number;
  activeCount: number;
  revenue: number;
  payingUsers: number;
  arpu?: number;
}

export interface RetentionMatrix {
  cohorts: Array<{
    label: string;
    startDate: Date;
    size: number;
    retention: number[];
    revenue: number[];
  }>;
  periods: string[];
  averageRetention: number[];
}

export type CreateCohortDefinitionInput = Omit<CohortDefinition, 'id' | 'ventureId' | 'isActive' | 'lastComputedAt' | 'createdAt' | 'updatedAt'>;

// ═══════════════════════════════════════════════════════════
// INSIGHT TYPES
// ═══════════════════════════════════════════════════════════

export type InsightType =
  | 'anomaly' | 'trend' | 'correlation' | 'prediction'
  | 'recommendation' | 'alert' | 'milestone' | 'comparison';

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

export type InsightStatus = 'new' | 'viewed' | 'acknowledged' | 'resolved' | 'dismissed';

export interface Insight {
  id: string;
  ventureId: string;
  type: InsightType;
  priority: InsightPriority;
  status: InsightStatus;
  title: string;
  summary: string;
  details?: string;
  metricId?: string;
  dashboardId?: string;
  funnelId?: string;
  cohortId?: string;
  data: Record<string, any>;
  confidence?: number;
  modelVersion?: string;
  recommendations?: Array<{ action: string; priority: string }>;
  estimatedImpact?: { metric: string; value: number; unit: string; timeframe: string };
  viewedAt?: Date;
  viewedBy?: string;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  dismissedAt?: Date;
  dismissedBy?: string;
  dismissReason?: string;
  wasHelpful?: boolean;
  feedback?: string;
  expiresAt?: Date;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsightFilters {
  types?: InsightType[];
  priorities?: InsightPriority[];
  status?: InsightStatus;
  metricId?: string;
  dashboardId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface AnomalyDetectionResult {
  metricId: string;
  metricName: string;
  expected: number;
  actual: number;
  deviation: number;
  direction: 'above' | 'below';
  zScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  historicalMean: number;
  historicalStdDev: number;
  dataPointsAnalyzed: number;
}

export interface TrendAnalysis {
  metricId: string;
  metricName: string;
  direction: 'up' | 'down' | 'stable';
  strength: number;
  slope: number;
  intercept: number;
  percentChange: number;
  dataPointsAnalyzed: number;
  projections: Array<{
    period: string;
    value: number;
    confidence: { low: number; high: number };
  }>;
  seasonality?: { detected: boolean; pattern?: string; strength?: number };
}

// ═══════════════════════════════════════════════════════════
// REPORT TYPES
// ═══════════════════════════════════════════════════════════

export type ReportType =
  | 'dashboard_snapshot' | 'metric_summary' | 'funnel_analysis'
  | 'cohort_analysis' | 'custom_query' | 'executive_summary';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'html' | 'json';

export type ReportFrequency =
  | 'once' | 'daily' | 'weekly' | 'biweekly'
  | 'monthly' | 'quarterly' | 'yearly';

export interface ReportTemplate {
  id: string;
  ventureId: string;
  name: string;
  slug: string;
  description?: string;
  type: ReportType;
  config: Record<string, any>;
  layout?: Record<string, any>;
  branding?: Record<string, any>;
  defaultFormats: ReportFormat[];
  ownerId?: string;
  isSystem: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSchedule {
  id: string;
  ventureId: string;
  templateId: string;
  name: string;
  frequency: ReportFrequency;
  scheduleConfig: Record<string, any>;
  dateRangeConfig?: Record<string, any>;
  formats: ReportFormat[];
  delivery: Record<string, any>;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastRunStatus?: string;
  lastRunError?: string;
  consecutiveFailures: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  scheduleId?: string;
  name: string;
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  generatedAt: Date;
  generatedBy?: string;
  generationTimeMs: number;
  format: ReportFormat;
  fileUrl?: string;
  fileSize?: number;
  dataSnapshot?: Record<string, any>;
  status: 'generated' | 'delivered' | 'failed' | 'expired';
  deliveryStatus?: Record<string, any>;
  expiresAt?: Date;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════
// COMMON TYPES
// ═══════════════════════════════════════════════════════════

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

---

## Schemas (Zod)

All input validation is performed using Zod schemas. These schemas are the source of truth for API input shapes.

### Metric Schemas

```typescript
import { z } from 'zod';

export const metricTypeSchema = z.enum(['counter', 'gauge', 'histogram', 'rate']);
export const granularitySchema = z.enum(['hour', 'day', 'week', 'month']);
export const aggregationSchema = z.enum(['sum', 'avg', 'count', 'min', 'max']);
export const metricCategorySchema = z.enum([
  'revenue', 'engagement', 'acquisition', 'retention',
  'performance', 'operational', 'custom',
]);

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

export const metricEntrySchema = z.object({
  metricId: z.string().uuid(),
  value: z.number().finite(),
  dimensions: z.record(z.string(), z.string()).optional(),
  timestamp: z.coerce.date().optional(),
});

export const metricQueryParamsSchema = z.object({
  metricId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  granularity: granularitySchema.default('day'),
  dimensions: z.record(z.string(), z.string()).optional(),
  aggregation: aggregationSchema.default('sum'),
});

export const aggregationParamsSchema = z.object({
  metricIds: z.array(z.string().uuid()).min(1).max(50),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  aggregation: aggregationSchema.default('sum'),
  groupBy: z.string().optional(),
});

export const batchRecordSchema = z.object({
  entries: z.array(metricEntrySchema).min(1).max(1000),
});

export const comparePeriodsSchema = z.object({
  metricId: z.string().uuid(),
  periods: z.array(z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    label: z.string().min(1).max(100),
  })).min(2).max(10),
});
```

### Dashboard Schemas

```typescript
export const dashboardVisibilitySchema = z.enum(['private', 'team', 'venture', 'public']);
export const widgetTypeSchema = z.enum([
  'metric', 'chart', 'table', 'funnel', 'cohort',
  'map', 'leaderboard', 'text', 'image', 'iframe', 'countdown',
]);
export const chartTypeSchema = z.enum([
  'line', 'bar', 'area', 'pie', 'donut', 'scatter',
  'heatmap', 'treemap', 'sankey', 'radar', 'gauge',
]);

export const widgetPositionSchema = z.object({
  x: z.number().int().min(0).max(11),
  y: z.number().int().min(0),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1),
  minW: z.number().int().optional(),
  minH: z.number().int().optional(),
  maxW: z.number().int().optional(),
  maxH: z.number().int().optional(),
});

export const createDashboardSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/).optional(),
  description: z.string().max(1000).optional(),
  visibility: dashboardVisibilitySchema.default('private'),
  teamId: z.string().uuid().optional(),
  theme: z.enum(['light', 'dark']).default('light'),
  refreshInterval: z.number().int().positive().optional(),
  timezone: z.string().optional(),
  dateRange: z.record(z.string(), z.unknown()).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  isDefault: z.boolean().default(false),
});

export const addWidgetSchema = z.object({
  title: z.string().max(255).optional(),
  subtitle: z.string().max(255).optional(),
  type: widgetTypeSchema,
  chartType: chartTypeSchema.optional(),
  position: widgetPositionSchema,
  dataSource: z.object({
    type: z.enum(['metric', 'query', 'api']),
    metricId: z.string().uuid().optional(),
    metricIds: z.array(z.string().uuid()).optional(),
    queryParams: z.record(z.string(), z.unknown()).optional(),
    apiUrl: z.string().url().optional(),
  }),
  options: z.record(z.string(), z.unknown()).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  comparison: z.record(z.string(), z.unknown()).optional(),
  drilldown: z.record(z.string(), z.unknown()).optional(),
  cacheTtlSeconds: z.number().int().positive().optional(),
});
```

### Funnel Schemas

```typescript
export const stepCompletionTypeSchema = z.enum(['ordered', 'any', 'all']);

export const createFunnelSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  completionType: stepCompletionTypeSchema.default('ordered'),
  conversionWindow: z.number().int().positive().default(168),
  attributionModel: z.enum(['first_touch', 'last_touch', 'linear', 'time_decay']).default('first_touch'),
  steps: z.array(z.object({
    name: z.string().min(1).max(255),
    eventType: z.string().min(1).max(255),
    eventFilters: z.record(z.string(), z.unknown()).optional(),
    isRequired: z.boolean().default(true),
    maxSecondsFromPrevious: z.number().int().positive().optional(),
    variants: z.array(z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      filters: z.record(z.string(), z.unknown()),
    })).optional(),
  })).min(2).max(20),
});
```

### Cohort Schemas

```typescript
export const cohortTypeSchema = z.enum(['acquisition', 'behavioral', 'revenue', 'custom']);
export const cohortPeriodSchema = z.enum(['day', 'week', 'month', 'quarter', 'year']);

export const createCohortDefinitionSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/),
  description: z.string().max(1000).optional(),
  type: cohortTypeSchema,
  period: cohortPeriodSchema.default('month'),
  criteria: z.record(z.string(), z.unknown()),
  retentionEvent: z.string().min(1).max(255),
  retentionFilters: z.record(z.string(), z.unknown()).optional(),
  revenueEvent: z.string().max(255).optional(),
  revenueField: z.string().max(100).optional(),
  lookbackPeriods: z.number().int().min(1).max(52).default(12),
});
```

### Insight Schemas

```typescript
export const insightTypeSchema = z.enum([
  'anomaly', 'trend', 'correlation', 'prediction',
  'recommendation', 'alert', 'milestone', 'comparison',
]);
export const insightPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export const insightStatusSchema = z.enum(['new', 'viewed', 'acknowledged', 'resolved', 'dismissed']);

export const insightFiltersSchema = z.object({
  types: z.array(insightTypeSchema).optional(),
  priorities: z.array(insightPrioritySchema).optional(),
  status: insightStatusSchema.optional(),
  metricId: z.string().uuid().optional(),
  dashboardId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const updateInsightStatusSchema = z.object({
  insightId: z.string().uuid(),
  status: insightStatusSchema,
  userId: z.string().uuid(),
  feedback: z.string().max(1000).optional(),
  wasHelpful: z.boolean().optional(),
  dismissReason: z.string().max(500).optional(),
});
```

### Report Schemas

```typescript
export const reportTypeSchema = z.enum([
  'dashboard_snapshot', 'metric_summary', 'funnel_analysis',
  'cohort_analysis', 'custom_query', 'executive_summary',
]);
export const reportFormatSchema = z.enum(['pdf', 'excel', 'csv', 'html', 'json']);
export const reportFrequencySchema = z.enum([
  'once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly',
]);

export const createReportTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9_-]+$/),
  description: z.string().max(1000).optional(),
  type: reportTypeSchema,
  config: z.record(z.string(), z.unknown()),
  layout: z.record(z.string(), z.unknown()).optional(),
  branding: z.record(z.string(), z.unknown()).optional(),
  defaultFormats: z.array(reportFormatSchema).default(['pdf']),
});

export const scheduleReportSchema = z.object({
  templateId: z.string().uuid(),
  name: z.string().min(1).max(255),
  frequency: reportFrequencySchema,
  scheduleConfig: z.object({
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    month: z.number().int().min(1).max(12).optional(),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
    timezone: z.string(),
  }),
  dateRangeConfig: z.record(z.string(), z.unknown()).optional(),
  formats: z.array(reportFormatSchema).optional(),
  delivery: z.object({
    email: z.object({
      recipients: z.array(z.string().email()).min(1),
      subject: z.string().max(500).optional(),
      body: z.string().max(5000).optional(),
    }).optional(),
    slack: z.object({
      channelId: z.string(),
      message: z.string().max(2000).optional(),
    }).optional(),
    storage: z.object({
      enabled: z.boolean(),
      path: z.string().max(500).optional(),
    }).optional(),
  }),
  isActive: z.boolean().default(true),
});

export const generateReportSchema = z.object({
  templateId: z.string().uuid(),
  dateRange: z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  }),
  formats: z.array(reportFormatSchema).optional(),
  generatedBy: z.string().uuid().optional(),
});
```

---

## Events

### Emitted Events (Audit)

All analytics operations emit structured audit events to the `@mcv/events` bus:

| Event | Payload | Trigger |
|-------|---------|---------|
| `analytics.metric.created` | `{ ventureId, metricId, slug, type, category }` | Metric definition created |
| `analytics.metric.updated` | `{ ventureId, metricId, fields[] }` | Metric definition updated |
| `analytics.metric.deleted` | `{ ventureId, metricId, slug }` | Metric definition deleted |
| `analytics.metric.value_recorded` | `{ ventureId, metricId, value, dimensions }` | Single value recorded |
| `analytics.metric.batch_recorded` | `{ ventureId, count, metricIds[] }` | Batch values recorded |
| `analytics.metric.queried` | `{ ventureId, metricId, granularity, latencyMs }` | Time-series query executed |
| `analytics.dashboard.created` | `{ ventureId, dashboardId, name }` | Dashboard created |
| `analytics.dashboard.updated` | `{ ventureId, dashboardId, fields[] }` | Dashboard updated |
| `analytics.dashboard.deleted` | `{ ventureId, dashboardId }` | Dashboard deleted |
| `analytics.dashboard.shared` | `{ ventureId, dashboardId, visibility }` | Sharing settings changed |
| `analytics.dashboard.viewed` | `{ ventureId, dashboardId, userId, renderTimeMs }` | Dashboard loaded |
| `analytics.dashboard.snapshot` | `{ ventureId, dashboardId, snapshotId }` | Snapshot captured |
| `analytics.funnel.created` | `{ ventureId, funnelId, name, stepCount }` | Funnel created |
| `analytics.funnel.progress` | `{ ventureId, funnelId, userId, stepOrder }` | User progressed in funnel |
| `analytics.funnel.converted` | `{ ventureId, funnelId, userId, timeToConvert }` | User completed funnel |
| `analytics.funnel.analyzed` | `{ ventureId, funnelId, conversionRate }` | Analysis computed |
| `analytics.cohort.created` | `{ ventureId, definitionId, type, period }` | Cohort definition created |
| `analytics.cohort.computed` | `{ ventureId, definitionId, cohortsCount, totalUsers }` | Cohort data refreshed |
| `analytics.insight.generated` | `{ ventureId, insightId, type, priority, metricId }` | AI insight created |
| `analytics.insight.viewed` | `{ ventureId, insightId, userId }` | Insight marked viewed |
| `analytics.insight.acknowledged` | `{ ventureId, insightId, userId }` | Insight acknowledged |
| `analytics.insight.resolved` | `{ ventureId, insightId, userId }` | Insight resolved |
| `analytics.insight.dismissed` | `{ ventureId, insightId, userId, reason }` | Insight dismissed |
| `analytics.alert.triggered` | `{ ventureId, alertId, metricId, severity, value }` | Alert threshold breached |
| `analytics.alert.resolved` | `{ ventureId, alertId, metricId }` | Alert returned to normal |
| `analytics.alert.snoozed` | `{ ventureId, alertId, userId, until }` | Alert snoozed |
| `analytics.report.template_created` | `{ ventureId, templateId, type }` | Template defined |
| `analytics.report.generated` | `{ ventureId, reportId, format, sizeBytes, timeMs }` | Report file generated |
| `analytics.report.delivered` | `{ ventureId, reportId, channel, recipients }` | Report delivered |
| `analytics.report.delivery_failed` | `{ ventureId, reportId, channel, error }` | Delivery failed |
| `analytics.report.scheduled` | `{ ventureId, scheduleId, frequency, nextRunAt }` | Schedule created/updated |

### Consumed Events

| Source | Event | Handler |
|--------|-------|---------|
| `@mcv/commerce` | `purchase.completed` | Record `total_revenue` metric + funnel progress |
| `@mcv/commerce` | `order.created` | Record `orders_count` metric |
| `@mcv/commerce` | `subscription.renewed` | Record `mrr` metric |
| `@mcv/people` | `user.created` | Record `signups` metric + cohort membership |
| `@mcv/people` | `session.started` | Record `active_sessions` metric + cohort retention |
| `@mcv/people` | `profile.updated` | Refresh cohort membership |
| `@mcv/growth` | `campaign.impression` | Record `impressions` metric |
| `@mcv/growth` | `campaign.click` | Record `clicks` metric |
| `@mcv/growth` | `experiment.assigned` | Funnel variant assignment |
| `@mcv/engagement` | `content.viewed` | Record `page_views` metric |
| `@mcv/engagement` | `feature.used` | Record `feature_usage` metric |
| Any domain | `*` | Match against active funnel step event types |

---

## Errors

### Error Code Reference

| Code | HTTP | tRPC Code | Description | Recovery |
|------|------|-----------|-------------|----------|
| `METRIC_NOT_FOUND` | 404 | `NOT_FOUND` | Metric definition not found or belongs to another venture | Verify metric ID and venture context |
| `METRIC_SLUG_EXISTS` | 409 | `CONFLICT` | Metric slug already exists in this venture | Choose a unique slug |
| `METRIC_VALUE_INVALID` | 400 | `BAD_REQUEST` | Value is NaN, Infinity, or out of range | Validate number before sending |
| `BATCH_TOO_LARGE` | 400 | `BAD_REQUEST` | Batch exceeds 1,000 entries | Split into multiple batches |
| `BATCH_METRIC_MISMATCH` | 404 | `NOT_FOUND` | One or more metric IDs in batch are invalid | Verify all metric IDs |
| `DASHBOARD_NOT_FOUND` | 404 | `NOT_FOUND` | Dashboard does not exist | Verify dashboard ID |
| `DASHBOARD_ACCESS_DENIED` | 403 | `FORBIDDEN` | User lacks view permission | Check visibility and sharing |
| `DASHBOARD_EDIT_DENIED` | 403 | `FORBIDDEN` | User is not owner or editor | Request edit access |
| `FUNNEL_NOT_FOUND` | 404 | `NOT_FOUND` | Funnel does not exist | Verify funnel ID |
| `FUNNEL_INACTIVE` | 400 | `BAD_REQUEST` | Funnel status is not 'active' | Activate the funnel first |
| `FUNNEL_STEP_ORDER` | 400 | `BAD_REQUEST` | Event received out of step order | Events must match expected sequence |
| `FUNNEL_TIME_CONSTRAINT` | 400 | `BAD_REQUEST` | Step time constraint violated | User exceeded step time limit |
| `COHORT_NOT_FOUND` | 404 | `NOT_FOUND` | Cohort definition does not exist | Verify definition ID |
| `COHORT_COMPUTE_FAILED` | 500 | `INTERNAL_SERVER_ERROR` | Cohort computation error | Check event store connectivity |
| `INSIGHT_NOT_FOUND` | 404 | `NOT_FOUND` | Insight does not exist | Verify insight ID |
| `INSIGHT_EXPIRED` | 410 | `NOT_FOUND` | Insight past its `expiresAt` | Request fresh analysis |
| `REPORT_TEMPLATE_NOT_FOUND` | 404 | `NOT_FOUND` | Report template does not exist | Verify template ID |
| `REPORT_GENERATION_FAILED` | 500 | `INTERNAL_SERVER_ERROR` | Report rendering failed | Check template config and data |
| `REPORT_DELIVERY_FAILED` | 500 | `INTERNAL_SERVER_ERROR` | Email/Slack delivery failed | Check delivery credentials |
| `REPORT_TOO_LARGE` | 413 | `PAYLOAD_TOO_LARGE` | Report exceeds size limit | Narrow date range or reduce data |
| `INSUFFICIENT_DATA` | 400 | `BAD_REQUEST` | Less than 30 data points for analysis | Wait for more data collection |
| `INVALID_DATE_RANGE` | 400 | `BAD_REQUEST` | Start date is after end date | Fix date ordering |
| `QUERY_RATE_LIMITED` | 429 | `TOO_MANY_REQUESTS` | Too many queries in time window | Back off and retry |

### Error Response Format

```typescript
// tRPC error shape
{
  error: {
    code: 'NOT_FOUND',
    message: 'Metric definition not found',
    data: {
      code: 'METRIC_NOT_FOUND',
      httpStatus: 404,
      path: 'analytics.getDefinition',
      metricId: '550e8400-e29b-41d4-a716-446655440000',
    }
  }
}
```

---

## Configuration

### Environment Variables

```bash
# ═══════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════
DATABASE_URL=postgresql://user:pass@host:5432/mcv
DATABASE_POOL_SIZE=20                                  # Connection pool size

# ═══════════════════════════════════════════════════════════
# REDIS (Caching & Real-Time)
# ═══════════════════════════════════════════════════════════
REDIS_URL=redis://host:6379/0
ANALYTICS_CACHE_TTL=300                                # Default metric cache TTL (seconds)
ANALYTICS_DASHBOARD_CACHE_TTL=60                       # Dashboard widget cache TTL (seconds)

# ═══════════════════════════════════════════════════════════
# METRICS
# ═══════════════════════════════════════════════════════════
ANALYTICS_MAX_BATCH_SIZE=1000                          # Max entries per batchRecord()
ANALYTICS_DEFAULT_RETENTION_DAYS=365                   # Default value retention
ANALYTICS_MAX_DIMENSIONS=20                            # Max dimensions per metric
ANALYTICS_MIN_ANOMALY_DATAPOINTS=30                    # Min data points for anomaly detection

# ═══════════════════════════════════════════════════════════
# DASHBOARDS
# ═══════════════════════════════════════════════════════════
ANALYTICS_MAX_DASHBOARD_WIDGETS=50                     # Max widgets per dashboard
ANALYTICS_DEFAULT_REFRESH_INTERVAL=300                 # Default auto-refresh (seconds)
ANALYTICS_MAX_PUBLIC_DASHBOARDS=10                     # Max public dashboards per venture

# ═══════════════════════════════════════════════════════════
# FUNNELS
# ═══════════════════════════════════════════════════════════
ANALYTICS_MAX_FUNNEL_STEPS=20                          # Max steps per funnel
ANALYTICS_DEFAULT_CONVERSION_WINDOW=168                # Default conversion window (hours)
ANALYTICS_FUNNEL_ABANDONMENT_TIMEOUT=72                # Hours before marking abandoned

# ═══════════════════════════════════════════════════════════
# COHORTS
# ═══════════════════════════════════════════════════════════
ANALYTICS_DEFAULT_LOOKBACK_PERIODS=12                  # Default periods to compute
ANALYTICS_MAX_COHORT_MEMBERS=100000                    # Max members per cohort
ANALYTICS_CHURN_INACTIVE_DAYS=30                       # Days inactive = churned

# ═══════════════════════════════════════════════════════════
# INSIGHTS
# ═══════════════════════════════════════════════════════════
ANALYTICS_ANOMALY_SENSITIVITY=0.95                     # Detection sensitivity (0.0–1.0)
ANALYTICS_ANOMALY_MIN_CONFIDENCE=0.80                  # Min confidence to report
ANALYTICS_INSIGHT_EXPIRY_DAYS=7                        # Days before auto-expiry
ANALYTICS_INSIGHT_COOLDOWN_MINUTES=60                  # Min time between duplicates
ANALYTICS_CORRELATION_THRESHOLD=0.5                    # Min |r| for correlation reporting

# ═══════════════════════════════════════════════════════════
# REPORTS
# ═══════════════════════════════════════════════════════════
ANALYTICS_REPORT_STORAGE_PATH=/reports                 # Base storage path
ANALYTICS_REPORT_EXPIRY_DAYS=90                        # Days before report expiry
ANALYTICS_MAX_REPORT_SIZE_MB=50                        # Max report file size
ANALYTICS_REPORT_CONCURRENT_GENERATIONS=5              # Max concurrent generations

# ═══════════════════════════════════════════════════════════
# CRON SCHEDULES
# ═══════════════════════════════════════════════════════════
ANALYTICS_INSIGHT_CRON="0 */6 * * *"                   # Insight analysis every 6h
ANALYTICS_COHORT_COMPUTE_CRON="0 2 * * *"              # Cohort recompute daily at 2 AM
ANALYTICS_RETENTION_CLEANUP_CRON="0 3 1 * *"           # Cleanup monthly at 3 AM
ANALYTICS_REPORT_SCHEDULER_CRON="* * * * *"            # Check for due reports every minute
```

### Constants

```typescript
// ── Metric Types ──────────────────────────────────────────
export const METRIC_TYPES = ['counter', 'gauge', 'histogram', 'rate'] as const;
export const AGGREGATION_METHODS = ['sum', 'avg', 'count', 'min', 'max', 'distinct_count', 'p50', 'p90', 'p95', 'p99', 'weighted_avg', 'sma', 'ema'] as const;
export const GRANULARITIES = ['minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'] as const;
export const METRIC_CATEGORIES = ['revenue', 'engagement', 'acquisition', 'retention', 'performance', 'operational', 'custom'] as const;

// ── Widget & Chart Types ──────────────────────────────────
export const WIDGET_TYPES = ['metric', 'chart', 'table', 'funnel', 'cohort', 'map', 'leaderboard', 'text', 'image', 'iframe', 'countdown'] as const;
export const CHART_TYPES = ['line', 'bar', 'area', 'pie', 'donut', 'scatter', 'heatmap', 'treemap', 'sankey', 'radar', 'gauge'] as const;

// ── Insight Types ─────────────────────────────────────────
export const INSIGHT_TYPES = ['anomaly', 'trend', 'correlation', 'prediction', 'recommendation', 'alert', 'milestone', 'comparison'] as const;
export const INSIGHT_PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;

// ── Report Types ──────────────────────────────────────────
export const REPORT_FORMATS = ['pdf', 'excel', 'csv', 'html', 'json'] as const;
export const REPORT_FREQUENCIES = ['once', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] as const;

// ── Limits & Defaults ─────────────────────────────────────
export const DEFAULT_CACHE_TTL = 300;              // 5 minutes
export const DEFAULT_RETENTION_DAYS = 365;         // 1 year
export const MAX_BATCH_SIZE = 1000;                // Per batchRecord() call
export const MAX_DASHBOARD_WIDGETS = 50;           // Per dashboard
export const MAX_FUNNEL_STEPS = 20;                // Per funnel
export const MAX_COHORT_MEMBERS = 100000;          // Per cohort
export const MAX_METRIC_DIMENSIONS = 20;           // Per metric definition
export const MAX_COMPARISON_PERIODS = 10;          // Per compare() call
export const MAX_AGGREGATION_METRICS = 50;         // Per aggregate() call
export const DEFAULT_CONVERSION_WINDOW = 168;      // 7 days in hours
export const DEFAULT_LOOKBACK_PERIODS = 12;        // Cohort periods
export const DEFAULT_INSIGHT_EXPIRY_DAYS = 7;      // Insight TTL
export const DEFAULT_REPORT_EXPIRY_DAYS = 90;      // Report file TTL
```

---

*@mcv/analytics — Analytics & Business Intelligence Domain*
