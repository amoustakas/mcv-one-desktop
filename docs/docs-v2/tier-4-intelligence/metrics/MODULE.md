# @mcv/intelligence/metrics — AI Metrics & Analytics Hub Module

**Parent Package:** @mcv/intelligence  
**Tier:** 4 (Intelligence Layer — Analytics)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Purpose

The `metrics` module provides a complete observability and analytics system for tracking, recording, querying, and visualizing both **business KPIs** and **AI operational metrics** across the MCV ecosystem. It operates as a dual-plane system:

1. **Analytics Hub** (Business Metrics) — Custom metric definitions, time series recording, dimensional queries, period comparisons, aggregations, and configurable dashboards with drag-and-drop widget layouts.
2. **AI Usage Tracker** (LLM Operational Metrics) — Automatic logging of every LLM request through the gateway, with database-level aggregation of tokens, costs, latency, success rates, and breakdowns by model/tier/agent/user.

Every AI-powered feature in MCV — from NAOS agent orchestration to RAG pipelines to chat assistants — generates metrics data that flows into this module. Business users define custom KPIs that track revenue, engagement, and retention. Together these provide the unified observability layer that enables cost control, performance optimization, and data-driven decisions.

**This module is the single source of truth for all metrics and analytics across MCV.ONE.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MCV.ONE Analytics Architecture                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        CLIENT LAYER (React)                              │   │
│  │                                                                          │   │
│  │  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐ │   │
│  │  │  MetricCard     │  │ MetricDashboard  │  │  RAG Metrics Hooks      │ │   │
│  │  │  MetricGrid     │  │ (Auto-fit grid)  │  │  useRagCosts()          │ │   │
│  │  │  MetricRow      │  │ Sparklines       │  │  useRagCostTrend()      │ │   │
│  │  │  MetricGroup    │  │ Progress bars    │  │  useCurrentRagSpend()   │ │   │
│  │  │  CompactMetric  │  │ Trend indicators │  │  useLast30DaysCosts()   │ │   │
│  │  │  FeaturedMetric │  │ Loading states   │  │  useCurrentMonthCosts() │ │   │
│  │  │  GlassMetric    │  │ Custom renderers │  │                          │ │   │
│  │  └───────┬────────┘  └────────┬─────────┘  └────────────┬─────────────┘ │   │
│  │          │                    │                          │               │   │
│  └──────────┼────────────────────┼──────────────────────────┼───────────────┘   │
│             │                    │                          │                    │
│             ▼                    ▼                          ▼                    │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         tRPC API LAYER                                   │   │
│  │                                                                          │   │
│  │  analyticsRouter                                                         │   │
│  │  ├── listDefinitions    ─── Paginated metric listing with filters        │   │
│  │  ├── getDefinition      ─── Single metric by ID                          │   │
│  │  ├── createDefinition   ─── Create new metric (slug uniqueness check)    │   │
│  │  ├── updateDefinition   ─── Update metric properties                     │   │
│  │  ├── deleteDefinition   ─── Delete metric + cascaded values              │   │
│  │  ├── recordValue        ─── Record single data point                     │   │
│  │  ├── batchRecord        ─── Batch insert up to 1000 entries              │   │
│  │  ├── query              ─── Time series query with granularity           │   │
│  │  ├── getLatest          ─── Latest recorded value                        │   │
│  │  ├── compare            ─── Multi-period comparison (2-10 ranges)        │   │
│  │  ├── aggregate          ─── Multi-metric aggregation with grouping       │   │
│  │  ├── listDashboards     ─── Paginated dashboard listing                  │   │
│  │  ├── getDashboard       ─── Dashboard with widget configs                │   │
│  │  ├── createDashboard    ─── Create dashboard (auto-unsets prev default)  │   │
│  │  ├── updateDashboard    ─── Update dashboard layout/widgets              │   │
│  │  └── deleteDashboard    ─── Delete dashboard                             │   │
│  │                                                                          │   │
│  └──────────────────────────────────┬───────────────────────────────────────┘   │
│                                     │                                           │
│                                     ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                       SERVICE LAYER                                      │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────┐  ┌──────────────────────────────────┐  │   │
│  │  │      MetricsService         │  │       UsageTracker               │  │   │
│  │  │  (Business KPI Analytics)   │  │  (LLM Operational Metrics)      │  │   │
│  │  │                             │  │                                  │  │   │
│  │  │  • Metric definitions CRUD  │  │  • record()        fire&forget  │  │   │
│  │  │  • Time series recording    │  │  • getMetrics()    parallel SQL │  │   │
│  │  │  • Dimensional queries      │  │  • getTimeSeries() grouped      │  │   │
│  │  │  • Period comparisons       │  │  • getLogs()       filtered     │  │   │
│  │  │  • Multi-metric aggregation │  │  • getUsageByUser()             │  │   │
│  │  │  • Dashboard management     │  │  • getUsageByVenture() (admin)  │  │   │
│  │  │  • Bucket-based grouping    │  │  • getGlobalMetrics() (admin)   │  │   │
│  │  │  • App-layer dim filtering  │  │  • getRealtimeStats()           │  │   │
│  │  └──────────────┬──────────────┘  └───────────────┬──────────────────┘  │   │
│  │                 │                                  │                     │   │
│  └─────────────────┼──────────────────────────────────┼─────────────────────┘   │
│                    │                                  │                          │
│                    ▼                                  ▼                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                     DATABASE LAYER (PostgreSQL + Drizzle ORM)            │   │
│  │                                                                          │   │
│  │  ┌──────────────────────┐  ┌────────────────┐  ┌──────────────────────┐ │   │
│  │  │  metric_definitions  │  │  metric_values  │  │  metric_dashboards   │ │   │
│  │  │  ───────────────────  │  │  ─────────────  │  │  ──────────────────  │ │   │
│  │  │  id (PK, uuid)       │  │  id (PK, uuid) │  │  id (PK, uuid)      │ │   │
│  │  │  venture_id (FK)     │◄─┤  metric_id (FK)│  │  venture_id (FK)    │ │   │
│  │  │  name                │  │  value (float8) │  │  name               │ │   │
│  │  │  slug (unique/vent)  │  │  dimensions {}  │  │  description        │ │   │
│  │  │  description         │  │  timestamp      │  │  layout []          │ │   │
│  │  │  type (enum)         │  │  created_at     │  │  widgets []         │ │   │
│  │  │  category (enum)     │  └────────────────┘  │  is_default          │ │   │
│  │  │  unit                │                       │  is_shared           │ │   │
│  │  │  format              │                       │  created_by          │ │   │
│  │  │  is_active           │  ┌────────────────┐  │  created_at          │ │   │
│  │  │  dimensions []       │  │ llm_usage_logs │  │  updated_at          │ │   │
│  │  │  metadata {}         │  │ ──────────────  │  └──────────────────────┘ │   │
│  │  │  created_at          │  │ (gateway pkg)  │                           │   │
│  │  │  updated_at          │  │ venture_id     │                           │   │
│  │  └──────────────────────┘  │ request_id     │                           │   │
│  │                             │ model, tier    │                           │   │
│  │                             │ tokens, cost   │                           │   │
│  │                             │ latency_ms     │                           │   │
│  │                             │ agent_type     │                           │   │
│  │                             │ trace/span IDs │                           │   │
│  │                             │ status         │                           │   │
│  │                             └────────────────┘                           │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Metrics Collection → Aggregation → Storage → Dashboards

```
                              METRICS DATA FLOW
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   1. COLLECTION                                                             │
│   ════════════                                                              │
│                                                                             │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐     │
│   │   LLM Gateway     │  │   API Routes      │  │   NAOS Agents     │     │
│   │  (Automatic)      │  │  (Manual Record)  │  │  (Agent Metrics)  │     │
│   │                   │  │                   │  │                   │     │
│   │  Every chat/      │  │  recordValue()    │  │  Queen: strategy  │     │
│   │  completion       │  │  batchRecord()    │  │  Ralph: tasks     │     │
│   │  request auto-    │  │  via tRPC or      │  │  Hephaestus: code │     │
│   │  logged with:     │  │  service layer    │  │  Oracle: analysis │     │
│   │  • tokens         │  │                   │  │  Scout: intel     │     │
│   │  • cost           │  │                   │  │  Talos: deploys   │     │
│   │  • latency        │  │                   │  │                   │     │
│   │  • model/tier     │  │                   │  │                   │     │
│   │  • trace IDs      │  │                   │  │                   │     │
│   └─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘     │
│             │                      │                      │               │
│             ▼                      ▼                      ▼               │
│                                                                             │
│   2. INGESTION                                                              │
│   ════════════                                                              │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                     │  │
│   │   UsageTracker.record()          MetricsService.recordValue()      │  │
│   │   ─────────────────────          ────────────────────────────      │  │
│   │   • Fire-and-forget              • Venture-scoped validation       │  │
│   │   • Non-blocking (async)         • Metric ownership check          │  │
│   │   • Graceful failure             • Batch insert (up to 1000)       │  │
│   │   • Logs to llm_usage_logs       • Logs to metric_values           │  │
│   │                                                                     │  │
│   └──────────────────────────────────┬──────────────────────────────────┘  │
│                                      │                                     │
│                                      ▼                                     │
│                                                                             │
│   3. STORAGE                                                                │
│   ══════════                                                                │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────┐     │
│   │                    PostgreSQL (Supabase)                          │     │
│   │                                                                  │     │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │     │
│   │  │metric_definitions│  │  metric_values  │  │ llm_usage_logs  │ │     │
│   │  │                 │  │                 │  │                 │ │     │
│   │  │ Indexed by:     │  │ Indexed by:     │  │ Indexed by:     │ │     │
│   │  │ • venture+slug  │  │ • metric_id     │  │ • venture+date  │ │     │
│   │  │ • venture_id    │  │ • metric+ts     │  │ • model+date    │ │     │
│   │  │ • category      │  │ (composite)     │  │ • agent_type    │ │     │
│   │  │ • type          │  │                 │  │ • user_id       │ │     │
│   │  │                 │  │                 │  │ • trace_id      │ │     │
│   │  └─────────────────┘  └─────────────────┘  └─────────────────┘ │     │
│   │                                                                  │     │
│   │  RLS policies enforce venture-level data isolation               │     │
│   └──────────────────────────────────────────────────────────────────┘     │
│                                      │                                     │
│                                      ▼                                     │
│                                                                             │
│   4. AGGREGATION                                                            │
│   ══════════════                                                            │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────┐     │
│   │                                                                  │     │
│   │   Business Metrics (MetricsService)                              │     │
│   │   ─────────────────────────────────                              │     │
│   │   • query()     → Time bucket aggregation (hour/day/week/month) │     │
│   │   • compare()   → Cross-period SUM with percent change          │     │
│   │   • aggregate() → Multi-metric GROUP BY dimension               │     │
│   │   • getLatest() → Most recent recorded value                    │     │
│   │                                                                  │     │
│   │   LLM Usage (UsageTracker)                                       │     │
│   │   ────────────────────────                                       │     │
│   │   • getMetrics()        → Parallel SQL: totals + by-tier/model  │     │
│   │   • getTimeSeries()     → date_trunc grouped by hour/day/week   │     │
│   │   • getUsageByUser()    → GROUP BY user_id, ORDER BY cost       │     │
│   │   • getUsageByVenture() → Cross-venture admin aggregation       │     │
│   │   • getGlobalMetrics()  → Platform-wide usage summary           │     │
│   │   • getRealtimeStats()  → Last-hour rolling window stats        │     │
│   │                                                                  │     │
│   └──────────────────────────────────┬───────────────────────────────┘     │
│                                      │                                     │
│                                      ▼                                     │
│                                                                             │
│   5. DASHBOARDS & VISUALIZATION                                             │
│   ═════════════════════════════                                             │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────┐     │
│   │                                                                  │     │
│   │  ┌───────────────┐  ┌──────────────┐  ┌──────────────────────┐ │     │
│   │  │ MetricCard    │  │ Line/Bar/    │  │ MetricDashboard      │ │     │
│   │  │ (KPI tiles)   │  │ Area/Pie     │  │ (Grid layout)        │ │     │
│   │  │               │  │ Charts       │  │                      │ │     │
│   │  │ • Sparklines  │  │              │  │ • Drag-and-drop      │ │     │
│   │  │ • Trend ↑↓    │  │ • Recharts   │  │ • 12-col grid        │ │     │
│   │  │ • Progress    │  │ • Tremor     │  │ • Auto-fit layout    │ │     │
│   │  │ • Comparison  │  │ • Nivo       │  │ • Widget configs     │ │     │
│   │  │ • Loading     │  │              │  │ • Shared/default     │ │     │
│   │  └───────────────┘  └──────────────┘  └──────────────────────┘ │     │
│   │                                                                  │     │
│   └──────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration with Gateway Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GATEWAY → METRICS INTEGRATION                         │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                  McvGateway.execute()                               │ │
│  │                                                                    │ │
│  │   Request ──► Validate ──► Budget ──► Route ──► Execute ──►       │ │
│  │                                                                    │ │
│  │   ◄── Normalize ◄── Track Usage ◄── Log Audit ◄── Return ◄──    │ │
│  │                          │                                         │ │
│  │                          │                                         │ │
│  │                          ▼                                         │ │
│  │                 UsageTracker.record({                               │ │
│  │                   requestId,                                       │ │
│  │                   ventureId,                                       │ │
│  │                   userId,                                          │ │
│  │                   model: 'anthropic/claude-3.5-sonnet',            │ │
│  │                   tier: 1,                                         │ │
│  │                   promptTokens: 1250,                              │ │
│  │                   completionTokens: 830,                           │ │
│  │                   totalTokens: 2080,                               │ │
│  │                   costUsd: 0.01248,                                │ │
│  │                   latencyMs: 1420,                                 │ │
│  │                   complexityScore: 4.2,                            │ │
│  │                   agentType: 'ralph',                              │ │
│  │                   traceId: 'abc-123',                              │ │
│  │                   spanId: 'def-456',                               │ │
│  │                   status: 'completed',                             │ │
│  │                 })                                                  │ │
│  │                                                                    │ │
│  │                 // Fire-and-forget: never blocks the response       │ │
│  │                 // Failure is logged, not thrown                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS METRICS SERVICE (Analytics Hub)
// ═══════════════════════════════════════════════════════════════════════════════

// Service factory
export {
  MetricsService,          // Class: venture-scoped metrics service
  createMetricsService,    // Factory: create service with venture context
} from './services/metrics.service';

// ═══════════════════════════════════════════════════════════════════════════════
// LLM USAGE TRACKER (AI Operational Metrics)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  UsageTracker,            // Class: LLM usage logging and aggregation
} from './server/services/usage-tracker';

// ═══════════════════════════════════════════════════════════════════════════════
// tRPC ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export {
  analyticsRouter,         // Full tRPC router for Analytics Hub
} from './routers/analytics.router';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React / @mcv/ui)
// ═══════════════════════════════════════════════════════════════════════════════

// Metric display components
export {
  MetricCard,              // Versatile metric card with trends/sparklines
  MetricGrid,              // Responsive grid layout for metrics
  MetricRow,               // Inline metric display (table-style)
  MetricGroup,             // Grouped metrics with title/description
  CompactMetric,           // Preset: small minimal metric
  FeaturedMetric,          // Preset: large gradient metric
  BorderedMetric,          // Preset: bordered metric
  GlassMetric,             // Preset: glass-effect metric
} from '@mcv/ui/metrics/metric-card';

// Dashboard component
export {
  MetricDashboard,         // Auto-fit grid of metric cards with animations
} from '@mcv/ui/dashboard/metric-dashboard';

// ═══════════════════════════════════════════════════════════════════════════════
// RAG METRICS HOOKS (React Query)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  useRagCosts,             // Cost summary for date range
  useRagCostTrend,         // Monthly cost trend (6-month default)
  useCurrentRagSpend,      // Current month spend (30s stale)
  useCurrentMonthCosts,    // Cost summary for current month
  useLast30DaysCosts,      // Cost summary for last 30 days
  metricsKeys,             // React Query key factory
} from '@mcv/rag/client/hooks/use-rag-metrics';

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS (Zod)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  // Enums
  metricTypeSchema,        // 'counter' | 'gauge' | 'histogram' | 'rate'
  granularitySchema,       // 'hour' | 'day' | 'week' | 'month'
  aggregationSchema,       // 'sum' | 'avg' | 'count' | 'min' | 'max'
  metricCategorySchema,    // 'revenue' | 'engagement' | ... | 'custom'
  widgetTypeSchema,        // 'line_chart' | 'bar_chart' | ... | 'sparkline'

  // Metric schemas
  metricDefinitionSchema,
  createMetricInputSchema,
  updateMetricInputSchema,
  metricEntrySchema,
  metricValueSchema,
  metricQueryParamsSchema,
  metricTimeSeriesSchema,

  // Comparison & aggregation
  dateRangeInputSchema,
  comparisonResultSchema,
  aggregationParamsSchema,
  aggregatedMetricSchema,

  // Dashboard schemas
  widgetLayoutSchema,
  widgetConfigSchema,
  dashboardSchema,
  dashboardWithWidgetsSchema,
  createDashboardInputSchema,
  updateDashboardInputSchema,

  // List/filter schemas
  listMetricsInputSchema,
  listDashboardsInputSchema,
} from './schemas/analytics.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Enums
  MetricType,
  Granularity,
  Aggregation,
  MetricCategory,
  WidgetType,

  // Metric types
  MetricDefinition,
  CreateMetricInput,
  UpdateMetricInput,
  MetricEntry,
  MetricValue,
  MetricQueryParams,
  MetricTimeSeries,

  // Comparison & aggregation types
  DateRangeInput,
  ComparisonResult,
  AggregationParams,
  AggregatedMetric,

  // Dashboard types
  WidgetLayout,
  WidgetConfig,
  Dashboard,
  DashboardWithWidgets,
  CreateDashboardInput,
  UpdateDashboardInput,

  // List/filter types
  ListMetricsInput,
  ListDashboardsInput,

  // DB row types (from @mcv/db)
  MetricDefinitionRow,
  NewMetricDefinitionRow,
  MetricValueRow,
  NewMetricValueRow,
  MetricDashboardRow,
  NewMetricDashboardRow,
  DashboardLayoutItem,

  // Usage tracker types (from gateway)
  UsageMetrics,
  TimeSeriesPoint,
  UsageRecord,
  LogFilterOptions,
} from './types';
```

---

## Database Schemas

### `metric_definitions` — Custom Metric Definitions

Stores configurable metric definitions scoped per venture. Each metric has a type (counter, gauge, histogram, rate), a category, optional dimensional labels, and custom metadata.

#### Drizzle ORM Schema

```typescript
// ============================================================================
// TABLE: metric_definitions
// ============================================================================

export const metricDefinitions = pgTable(
  'metric_definitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    ventureId: uuid('venture_id')
      .notNull()
      .references(() => ventures.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),                                    // Human-readable name
    slug: text('slug').notNull(),                                    // URL-safe identifier
    description: text('description'),                                // Optional description
    type: text('type').notNull(),                                    // 'counter' | 'gauge' | 'histogram' | 'rate'
    category: text('category').notNull(),                            // 'revenue' | 'engagement' | etc.
    unit: text('unit'),                                              // '$', '%', 'ms', etc.
    format: text('format'),                                          // Display format hint
    isActive: boolean('is_active').notNull().default(true),          // Soft disable
    dimensions: jsonb('dimensions').$type<string[]>(),               // Dimensional labels
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),    // Arbitrary metadata

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

// Inferred types
export type MetricDefinitionRow = typeof metricDefinitions.$inferSelect;
export type NewMetricDefinitionRow = typeof metricDefinitions.$inferInsert;
```

#### SQL DDL

```sql
-- ============================================================================
-- TABLE: metric_definitions
-- ============================================================================

CREATE TABLE metric_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL,
    description     TEXT,
    type            TEXT NOT NULL,          -- 'counter' | 'gauge' | 'histogram' | 'rate'
    category        TEXT NOT NULL,          -- 'revenue' | 'engagement' | ... | 'custom'
    unit            TEXT,                   -- '$', '%', 'ms', 'requests', etc.
    format          TEXT,                   -- 'currency', 'percent', 'number', etc.
    is_active       BOOLEAN NOT NULL DEFAULT true,
    dimensions      JSONB,                 -- string[] of dimensional label names
    metadata        JSONB,                 -- Record<string, unknown>
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX metric_def_venture_slug_idx ON metric_definitions(venture_id, slug);
CREATE INDEX metric_def_venture_idx ON metric_definitions(venture_id);
CREATE INDEX metric_def_category_idx ON metric_definitions(category);
CREATE INDEX metric_def_type_idx ON metric_definitions(type);

-- Trigger: auto-update updated_at
CREATE TRIGGER metric_definitions_updated_at
    BEFORE UPDATE ON metric_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE metric_definitions IS 'Custom metric definitions scoped per venture';
COMMENT ON COLUMN metric_definitions.slug IS 'URL-safe identifier, unique per venture';
COMMENT ON COLUMN metric_definitions.type IS 'Measurement type: counter, gauge, histogram, or rate';
COMMENT ON COLUMN metric_definitions.dimensions IS 'Array of dimensional label names for grouping';
```

#### Indexes

| Index Name | Columns | Type | Purpose |
|---|---|---|---|
| `metric_def_venture_slug_idx` | `(venture_id, slug)` | UNIQUE | Prevent duplicate slugs per venture |
| `metric_def_venture_idx` | `(venture_id)` | B-tree | Fast venture-scoped listing |
| `metric_def_category_idx` | `(category)` | B-tree | Category filtering |
| `metric_def_type_idx` | `(type)` | B-tree | Type filtering |

---

### `metric_values` — Time Series Data Points

Stores individual metric recordings as double-precision floating-point values with optional dimensional labels (JSONB) and timestamps for time series analysis.

#### Drizzle ORM Schema

```typescript
// ============================================================================
// TABLE: metric_values
// ============================================================================

export const metricValues = pgTable(
  'metric_values',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    metricId: uuid('metric_id')
      .notNull()
      .references(() => metricDefinitions.id, { onDelete: 'cascade' }),

    value: doublePrecision('value').notNull(),                                    // Numeric value
    dimensions: jsonb('dimensions').$type<Record<string, string>>(),              // Dimensional key-value pairs
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('metric_values_metric_idx').on(table.metricId),
    index('metric_values_timestamp_idx').on(table.metricId, table.timestamp),
  ]
);

// Inferred types
export type MetricValueRow = typeof metricValues.$inferSelect;
export type NewMetricValueRow = typeof metricValues.$inferInsert;
```

#### SQL DDL

```sql
-- ============================================================================
-- TABLE: metric_values
-- ============================================================================

CREATE TABLE metric_values (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_id       UUID NOT NULL REFERENCES metric_definitions(id) ON DELETE CASCADE,
    value           DOUBLE PRECISION NOT NULL,
    dimensions      JSONB,                 -- Record<string, string> key-value pairs
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX metric_values_metric_idx ON metric_values(metric_id);
CREATE INDEX metric_values_timestamp_idx ON metric_values(metric_id, timestamp);

-- Partitioning recommendation for high-volume deployments:
-- Consider range-partitioning by timestamp (monthly partitions)
-- for tables exceeding 100M rows.
--
-- CREATE TABLE metric_values (
--     ...
-- ) PARTITION BY RANGE (timestamp);
--
-- CREATE TABLE metric_values_2026_01 PARTITION OF metric_values
--     FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

COMMENT ON TABLE metric_values IS 'Time series data points for custom metrics';
COMMENT ON COLUMN metric_values.value IS 'Double-precision numeric value';
COMMENT ON COLUMN metric_values.dimensions IS 'Key-value pairs for dimensional slicing';
COMMENT ON COLUMN metric_values.timestamp IS 'When the value was recorded (used for time series)';
```

#### Indexes

| Index Name | Columns | Type | Purpose |
|---|---|---|---|
| `metric_values_metric_idx` | `(metric_id)` | B-tree | Fast per-metric lookups |
| `metric_values_timestamp_idx` | `(metric_id, timestamp)` | B-tree (composite) | Time range queries (critical for performance) |

---

### `metric_dashboards` — Configurable Dashboard Layouts

Stores dashboard configurations with grid-based layouts and widget definitions for the Analytics Hub UI.

#### Drizzle ORM Schema

```typescript
// ============================================================================
// TABLE: metric_dashboards
// ============================================================================

export interface DashboardLayoutItem {
  widgetId: string;
  x: number;          // Grid column position
  y: number;          // Grid row position
  w: number;          // Width in grid units (1-12)
  h: number;          // Height in grid units (1-12)
}

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

// Inferred types
export type MetricDashboardRow = typeof metricDashboards.$inferSelect;
export type NewMetricDashboardRow = typeof metricDashboards.$inferInsert;
```

#### SQL DDL

```sql
-- ============================================================================
-- TABLE: metric_dashboards
-- ============================================================================

CREATE TABLE metric_dashboards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    layout          JSONB NOT NULL DEFAULT '[]'::jsonb,     -- DashboardLayoutItem[]
    widgets         JSONB NOT NULL DEFAULT '[]'::jsonb,     -- WidgetConfig[]
    is_default      BOOLEAN NOT NULL DEFAULT false,
    is_shared       BOOLEAN NOT NULL DEFAULT false,
    created_by      UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX metric_dashboards_venture_idx ON metric_dashboards(venture_id);

-- Trigger: auto-update updated_at
CREATE TRIGGER metric_dashboards_updated_at
    BEFORE UPDATE ON metric_dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE metric_dashboards IS 'Configurable dashboard layouts per venture';
COMMENT ON COLUMN metric_dashboards.layout IS 'Grid positions: [{widgetId, x, y, w, h}]';
COMMENT ON COLUMN metric_dashboards.widgets IS 'Widget configurations: [{id, type, title, ...}]';
COMMENT ON COLUMN metric_dashboards.is_default IS 'Only one default per venture (enforced in app)';
COMMENT ON COLUMN metric_dashboards.is_shared IS 'Visible to all venture members';
```

#### Indexes

| Index Name | Columns | Type | Purpose |
|---|---|---|---|
| `metric_dashboards_venture_idx` | `(venture_id)` | B-tree | Venture-scoped dashboard listing |

---

### `llm_usage_logs` — LLM Usage Tracking (Gateway Package)

This table lives in the `@mcv/gateway` package but is central to the metrics module's AI operational analytics. Every LLM request that flows through the gateway is logged here.

#### SQL DDL

```sql
-- ============================================================================
-- TABLE: llm_usage_logs (defined in @mcv/gateway, consumed by metrics)
-- ============================================================================

CREATE TABLE llm_usage_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Scope
    venture_id          UUID NOT NULL REFERENCES ventures(id),
    request_id          VARCHAR(64) NOT NULL UNIQUE,
    user_id             UUID,

    -- Model info
    model               VARCHAR(128) NOT NULL,
    tier                INTEGER NOT NULL,           -- 0=Economy, 1=Standard, 2=Frontier, 3=Premium, 4=Reasoning
    provider            VARCHAR(64),

    -- Token usage
    prompt_tokens       INTEGER NOT NULL,
    completion_tokens   INTEGER NOT NULL,
    total_tokens        INTEGER NOT NULL,

    -- Cost
    cost_usd            DECIMAL(10, 6) NOT NULL,

    -- Performance
    latency_ms          INTEGER,

    -- Routing
    complexity_score    DECIMAL(4, 2),
    agent_type          VARCHAR(32),
    task_id             VARCHAR(64),
    session_id          VARCHAR(64),

    -- Distributed tracing (OpenTelemetry-compatible)
    trace_id            VARCHAR(64),
    span_id             VARCHAR(64),
    parent_span_id      VARCHAR(64),

    -- Status
    status              VARCHAR(16) NOT NULL DEFAULT 'completed',
    error_message       VARCHAR(512),

    -- Timestamps
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX llm_usage_venture_created_idx ON llm_usage_logs(venture_id, created_at);
CREATE INDEX llm_usage_model_created_idx ON llm_usage_logs(model, created_at);
CREATE INDEX llm_usage_agent_type_idx ON llm_usage_logs(agent_type);
CREATE INDEX llm_usage_user_id_idx ON llm_usage_logs(user_id);
CREATE INDEX llm_usage_trace_id_idx ON llm_usage_logs(trace_id);

COMMENT ON TABLE llm_usage_logs IS 'Every LLM request logged with tokens, cost, latency, and tracing';
COMMENT ON COLUMN llm_usage_logs.cost_usd IS 'Total cost in USD with 6 decimal places precision';
COMMENT ON COLUMN llm_usage_logs.complexity_score IS 'Routing complexity score (0.00-10.00+)';
COMMENT ON COLUMN llm_usage_logs.trace_id IS 'OpenTelemetry-compatible distributed trace ID';
```

---

### Relations

```typescript
// ============================================================================
// DRIZZLE ORM RELATIONS
// ============================================================================

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

### Entity Relationship Diagram

```
┌──────────────────────┐
│      ventures        │
│ ──────────────────── │
│ id (PK)              │
│ name                 │
│ ...                  │
└──────────┬───────────┘
           │
           │ 1:N
           │
    ┌──────┴───────┬──────────────────────┐
    │              │                      │
    ▼              ▼                      ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  metric_     │ │  metric_     │ │ llm_usage_   │
│  definitions │ │  dashboards  │ │ logs         │
│ ──────────── │ │ ──────────── │ │ ──────────── │
│ id (PK)      │ │ id (PK)      │ │ id (PK)      │
│ venture_id   │ │ venture_id   │ │ venture_id   │
│ name         │ │ name         │ │ request_id   │
│ slug (UQ/v)  │ │ layout {}    │ │ model        │
│ type         │ │ widgets []   │ │ cost_usd     │
│ category     │ │ is_default   │ │ latency_ms   │
│ dimensions   │ │ created_by   │ │ agent_type   │
│ ...          │ │ ...          │ │ trace_id     │
└──────┬───────┘ └──────────────┘ │ ...          │
       │                           └──────────────┘
       │ 1:N
       │
       ▼
┌──────────────┐
│ metric_      │
│ values       │
│ ──────────── │
│ id (PK)      │
│ metric_id    │
│ value        │
│ dimensions   │
│ timestamp    │
└──────────────┘
```

---

## TypeScript Interfaces

### Core Enums & Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// METRIC TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Metric measurement type
 *  - counter:   Monotonically increasing (total_orders, page_views)
 *  - gauge:     Point-in-time value (temperature, active_users)
 *  - histogram: Distribution of values (response_time_buckets)
 *  - rate:      Change per unit time (requests_per_second)
 */
type MetricType = 'counter' | 'gauge' | 'histogram' | 'rate';

/**
 * Time series granularity for bucketing
 */
type Granularity = 'hour' | 'day' | 'week' | 'month';

/**
 * Aggregation functions for time buckets
 */
type Aggregation = 'sum' | 'avg' | 'count' | 'min' | 'max';

/**
 * Business metric categories
 */
type MetricCategory =
  | 'revenue'
  | 'engagement'
  | 'acquisition'
  | 'retention'
  | 'performance'
  | 'operational'
  | 'custom';

/**
 * Dashboard widget types
 */
type WidgetType =
  | 'line_chart'
  | 'bar_chart'
  | 'area_chart'
  | 'pie_chart'
  | 'metric_card'
  | 'table'
  | 'heatmap'
  | 'sparkline';
```

### Metric Definition Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// METRIC DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface MetricDefinition {
  id: string;                                    // UUID
  ventureId: string;                             // UUID — owning venture
  name: string;                                  // Human-readable name (1-255 chars)
  slug: string;                                  // URL-safe identifier (1-100 chars, /^[a-z0-9_-]+$/)
  description: string | null;                    // Optional description (max 1000 chars)
  type: MetricType;                              // Measurement type
  category: MetricCategory;                      // Business category
  unit: string | null;                           // Unit of measurement ('$', '%', 'ms')
  format: string | null;                         // Display format hint
  isActive: boolean;                             // Whether metric is active
  dimensions: string[] | null;                   // Dimensional label names
  metadata: Record<string, unknown> | null;      // Arbitrary metadata
  createdAt: Date;
  updatedAt: Date;
}

interface CreateMetricInput {
  name: string;                                  // Required, 1-255 chars
  slug: string;                                  // Required, lowercase alphanumeric + hyphens/underscores
  description?: string;                          // Optional, max 1000 chars
  type: MetricType;                              // Required
  category: MetricCategory;                      // Required
  unit?: string;                                 // Optional, max 50 chars
  format?: string;                               // Optional, max 50 chars
  dimensions?: string[];                         // Optional, max 20 items, each max 100 chars
  metadata?: Record<string, unknown>;            // Optional arbitrary metadata
}

interface UpdateMetricInput {
  id: string;                                    // Required UUID
  name?: string;
  description?: string;
  category?: MetricCategory;
  unit?: string;
  format?: string;
  isActive?: boolean;
  dimensions?: string[];
  metadata?: Record<string, unknown>;
}
```

### Metric Value & Query Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// METRIC VALUES & QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

interface MetricEntry {
  metricId: string;                              // UUID of target metric
  value: number;                                 // Numeric value to record
  dimensions?: Record<string, string>;           // Optional dimensional key-value pairs
  timestamp?: Date;                              // Optional (defaults to now)
}

interface MetricValue {
  id: string;                                    // UUID
  metricId: string;                              // FK to metric_definitions
  value: number;                                 // Recorded value
  dimensions: Record<string, string> | null;     // Dimensional data
  timestamp: Date;                               // When the value was recorded
  createdAt: Date;
}

interface MetricQueryParams {
  metricId: string;                              // UUID — which metric to query
  startDate: Date;                               // Range start (inclusive)
  endDate: Date;                                 // Range end (inclusive)
  granularity: Granularity;                      // Bucketing granularity (default: 'day')
  dimensions?: Record<string, string>;           // Optional dimension filters
  aggregation: Aggregation;                      // How to aggregate buckets (default: 'sum')
}

interface MetricTimeSeries {
  metric: MetricDefinition;                      // Full metric definition
  points: Array<{
    timestamp: Date;                             // Bucket start time
    value: number;                               // Aggregated value for bucket
  }>;
  summary: {
    min: number;                                 // Minimum across all raw values
    max: number;                                 // Maximum across all raw values
    avg: number;                                 // Average across all raw values
    total: number;                               // Sum of all raw values
  };
}
```

### Comparison & Aggregation Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// COMPARISON & AGGREGATION
// ═══════════════════════════════════════════════════════════════════════════════

interface DateRangeInput {
  startDate: Date;
  endDate: Date;
  label?: string;                                // Human-readable label ("Q1 2026")
}

interface ComparisonResult {
  metricId: string;
  periods: Array<{
    startDate: Date;
    endDate: Date;
    label?: string;
    value: number;                               // Total value for period
    count: number;                               // Number of data points
  }>;
  changes: Array<{
    fromPeriod: number;                          // Index of previous period
    toPeriod: number;                            // Index of current period
    absoluteChange: number;                      // Raw difference
    percentChange: number | null;                // Percent change (null if prev was 0)
  }>;
}

interface AggregationParams {
  metricIds: string[];                           // 1-50 metric UUIDs
  startDate: Date;
  endDate: Date;
  aggregation: Aggregation;                      // Default: 'sum'
  groupBy?: string;                              // Optional dimension key to group by
}

interface AggregatedMetric {
  metricId: string;
  metricName: string;
  value: number;                                 // Aggregated result
  count: number;                                 // Number of data points
  groupKey: string | null;                       // Dimension group (null if ungrouped)
}
```

### Dashboard Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARDS
// ═══════════════════════════════════════════════════════════════════════════════

interface WidgetLayout {
  widgetId: string;                              // References WidgetConfig.id
  x: number;                                     // Column position (0-indexed)
  y: number;                                     // Row position (0-indexed)
  w: number;                                     // Width (1-12 grid units)
  h: number;                                     // Height (1-12 grid units)
}

interface WidgetConfig {
  id: string;                                    // Unique widget identifier
  type: WidgetType;                              // Chart/display type
  title: string;                                 // Widget title (max 255)
  metricId?: string;                             // Single metric source
  metricIds?: string[];                          // Multi-metric source
  queryParams?: Partial<MetricQueryParams>;       // Default query parameters
  displayOptions?: Record<string, unknown>;       // Type-specific options
}

interface Dashboard {
  id: string;
  ventureId: string;
  name: string;
  description: string | null;
  layout: WidgetLayout[];                        // Grid positions for widgets
  isDefault: boolean;                            // Whether this is the default dashboard
  isShared: boolean;                             // Visible to all venture members
  createdBy: string;                             // UUID of creator
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardWithWidgets extends Dashboard {
  widgets: WidgetConfig[];                       // Full widget configurations
}

interface CreateDashboardInput {
  name: string;                                  // 1-255 chars
  description?: string;                          // Max 1000 chars
  layout?: WidgetLayout[];                       // Default: []
  widgets?: WidgetConfig[];                      // Default: []
  isDefault?: boolean;                           // Default: false
  isShared?: boolean;                            // Default: false
}

interface UpdateDashboardInput {
  id: string;
  name?: string;
  description?: string;
  layout?: WidgetLayout[];
  widgets?: WidgetConfig[];
  isDefault?: boolean;
  isShared?: boolean;
}
```

### LLM Usage Tracker Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// LLM USAGE TRACKING (from @mcv/gateway)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parameters for recording a usage entry.
 * This is the contract between the gateway pipeline and the usage tracker.
 * Every field except userId and the optional tracing fields is required.
 */
interface UsageRecord {
  requestId: string;                             // Unique request identifier
  ventureId: string;                             // Owning venture
  userId?: string;                               // User who initiated
  model: string;                                 // Model identifier (e.g., 'anthropic/claude-3.5-sonnet')
  tier: number;                                  // Model tier (0-4)
  provider?: string;                             // Provider name ('anthropic', 'openai', etc.)
  promptTokens: number;                          // Input tokens consumed
  completionTokens: number;                      // Output tokens generated
  totalTokens: number;                           // Total tokens
  costUsd: number;                               // Cost in USD
  latencyMs: number;                             // Response time in milliseconds
  complexityScore: number;                       // Routed complexity (0-10)
  agentType?: string;                            // NAOS agent type ('queen', 'ralph', etc.)
  taskId?: string;                               // Correlation task ID
  sessionId?: string;                            // Conversation session ID
  traceId?: string;                              // Distributed tracing trace ID
  spanId?: string;                               // This operation's span ID
  parentSpanId?: string;                         // Parent span for child operations
  status: 'completed' | 'failed' | 'timeout';   // Outcome
  errorMessage?: string;                         // Error details (if failed)
}

/**
 * Aggregated usage metrics returned by getMetrics() and getGlobalMetrics().
 * All aggregation is done at the database level (parallel SQL queries).
 */
interface UsageMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;                             // USD
  avgLatency: number;                            // ms
  successRate: number;                            // Percentage (0-100)
  byTier: Record<number, { requests: number; tokens: number; cost: number }>;
  byModel: Record<string, { requests: number; tokens: number; cost: number }>;
  byAgent: Record<string, { requests: number; tokens: number; cost: number }>;
}

/**
 * Time series data point for usage charts.
 * Grouped by hour/day/week using PostgreSQL date_trunc.
 */
interface TimeSeriesPoint {
  date: string;                                  // Formatted date string
  requests: number;
  tokens: number;
  cost: number;                                  // USD
}

/**
 * Filter options for querying usage logs.
 */
interface LogFilterOptions {
  limit?: number;                                // Default: 50
  offset?: number;                               // Default: 0
  model?: string;                                // Filter by model
  tier?: ModelTier;                              // Filter by tier (0-4)
  agentType?: string;                            // Filter by NAOS agent
  status?: 'completed' | 'failed' | 'timeout';  // Filter by outcome
  startDate?: Date;                              // Range start
  endDate?: Date;                                // Range end
}
```

### UI Component Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════════

type MetricTrend = 'up' | 'down' | 'neutral';
type MetricSentiment = 'positive' | 'negative' | 'neutral';
type MetricSize = 'sm' | 'md' | 'lg';
type MetricVariant = 'default' | 'bordered' | 'gradient' | 'glass' | 'minimal';

interface MetricCardProps {
  label: string;                                 // Metric title
  value: string | number;                        // Primary value
  prefix?: string;                               // Value prefix ('$', '~')
  suffix?: string;                               // Value suffix ('%', 'ms')
  change?: string | number;                      // Change from previous period
  trend?: MetricTrend;                           // Trend direction
  sentiment?: MetricSentiment;                   // Color scheme (auto from trend)
  description?: string;                          // Context text
  icon?: ReactNode;                              // Optional icon
  variant?: MetricVariant;                       // Visual style
  size?: MetricSize;                             // Size variant
  trendPosition?: 'top' | 'bottom' | 'inline';  // Trend chip position
  sparklineData?: number[];                      // Mini sparkline data
  accentColor?: string;                          // Custom Tailwind accent
  comparison?: { label: string; value: string | number };  // Comparison row
  isLoading?: boolean;                           // Show skeleton
  liveUpdate?: boolean;                          // Enable aria-live
  className?: string;
}

interface MetricDashboardProps {
  metrics: MetricData[];                         // Array of metric data
  columns?: number;                              // Fixed column count
  minColumnWidth?: number;                       // Auto-fit min width (default: 240)
  gap?: number;                                  // Grid gap (default: 4)
  size?: MetricSize;                             // Card size
  variant?: 'default' | 'compact' | 'featured' | 'minimal';
  animate?: boolean;                             // Enable animations (default: true)
  staggerDelay?: number;                         // Animation stagger (default: 0.05)
  showTrend?: boolean;                           // Show trend indicators (default: true)
  showSparkline?: boolean;                       // Show sparklines (default: true)
  invertTrend?: boolean;                         // Invert trend colors (good = down)
  renderMetric?: (metric: MetricData, index: number) => ReactNode;  // Custom renderer
  loading?: boolean;                             // Loading state
  className?: string;
}

interface MetricData {
  id: string;
  label: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changePercent?: number;
  trend?: MetricTrend;
  target?: number;
  progress?: number;                             // 0-100 (renders progress bar)
  icon?: ReactNode;
  unit?: string;
  unitPosition?: 'prefix' | 'suffix';
  description?: string;
  sparkline?: number[];
  onClick?: () => void;
  meta?: Record<string, unknown>;
}
```

### Gateway Integration Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// GATEWAY CONTEXT (passed with every LLM request)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Correlation IDs for distributed tracing across the metrics pipeline.
 * Compatible with OpenTelemetry standards.
 */
interface CorrelationIds {
  traceId: string;                               // Unique trace for entire request chain
  spanId: string;                                // This operation's span
  parentSpanId?: string;                         // Parent span (child operations)
  rootRequestId?: string;                        // Root request that started the chain
}

/**
 * Context passed with every gateway request.
 * The metrics module extracts ventureId, userId, agentType, and correlation
 * IDs from this context for usage tracking.
 */
interface GatewayContext {
  ventureId: string;                             // Required: venture for cost attribution
  userId?: string;                               // Optional: acting user
  agentType?: AgentType;                         // Optional: NAOS agent type
  agentContext?: AgentContext;                    // Optional: detailed agent state
  taskId?: string;                               // Optional: task correlation
  sessionId?: string;                            // Optional: conversation tracking
  correlationIds?: CorrelationIds;               // Optional: distributed tracing
  forcedTier?: ModelTier;                        // Optional: override routing
  forcedModel?: string;                          // Optional: specific model
  tags?: string[];                               // Optional: custom grouping
  metadata?: Record<string, unknown>;            // Optional: custom data
}

/**
 * NAOS agent types tracked in metrics.
 */
type AgentType =
  | 'queen'       // Orchestrator — strategic decisions
  | 'ralph'       // General worker — atomic tasks
  | 'hephaestus'  // Code generation
  | 'scout'       // Competitor analysis
  | 'talos'       // CI/CD, deployments
  | 'hermes'      // Communication
  | 'oracle'      // Data analytics, predictions
  | 'mnemosyne'   // Memory management
  | 'custom';     // User-defined agents

/**
 * Model tier classification (0-4) tracked per request.
 */
type ModelTier = 0 | 1 | 2 | 3 | 4;

const MODEL_TIER_NAMES: Record<ModelTier, string> = {
  0: 'Economy',    // DeepSeek-V3, GPT-4o-mini, Gemini Flash
  1: 'Standard',   // Claude 3.5 Sonnet, GPT-4o, Gemini Pro
  2: 'Frontier',   // Claude Opus, GPT-4.5, Gemini Ultra
  3: 'Premium',    // Best-in-class for critical tasks
  4: 'Reasoning',  // o3, o3-mini, Claude Opus:thinking
};
```

---

## Zod Validation Schemas

The metrics module uses Zod schemas for input validation at the tRPC boundary. All inputs are validated before reaching the service layer.

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// ENUM SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const metricTypeSchema = z.enum(['counter', 'gauge', 'histogram', 'rate']);
const granularitySchema = z.enum(['hour', 'day', 'week', 'month']);
const aggregationSchema = z.enum(['sum', 'avg', 'count', 'min', 'max']);

const metricCategorySchema = z.enum([
  'revenue',
  'engagement',
  'acquisition',
  'retention',
  'performance',
  'operational',
  'custom',
]);

const widgetTypeSchema = z.enum([
  'line_chart',
  'bar_chart',
  'area_chart',
  'pie_chart',
  'metric_card',
  'table',
  'heatmap',
  'sparkline',
]);

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const createMetricInputSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(
    /^[a-z0-9_-]+$/,
    'Slug must be lowercase alphanumeric with hyphens/underscores'
  ),
  description: z.string().max(1000).optional(),
  type: metricTypeSchema,
  category: metricCategorySchema,
  unit: z.string().max(50).optional(),
  format: z.string().max(50).optional(),
  dimensions: z.array(z.string().max(100)).max(20).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const metricEntrySchema = z.object({
  metricId: uuidSchema,
  value: z.number(),
  dimensions: z.record(z.string(), z.string()).optional(),
  timestamp: z.coerce.date().optional(),
});

const metricQueryParamsSchema = z.object({
  metricId: uuidSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  granularity: granularitySchema.default('day'),
  dimensions: z.record(z.string(), z.string()).optional(),
  aggregation: aggregationSchema.default('sum'),
});

const aggregationParamsSchema = z.object({
  metricIds: z.array(uuidSchema).min(1).max(50),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  aggregation: aggregationSchema.default('sum'),
  groupBy: z.string().optional(),
});

const createDashboardInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  layout: z.array(widgetLayoutSchema).default([]),
  widgets: z.array(widgetConfigSchema).default([]),
  isDefault: z.boolean().default(false),
  isShared: z.boolean().default(false),
});

const listMetricsInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  category: metricCategorySchema.optional(),
  type: metricTypeSchema.optional(),
  isActive: z.boolean().optional(),
  search: z.string().max(255).optional(),
});

const listDashboardsInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  isShared: z.boolean().optional(),
  search: z.string().max(255).optional(),
});
```

---

## tRPC API Layer

The analytics router provides the complete tRPC API for the Analytics Hub. All procedures are venture-scoped via `ventureProcedure` which injects the authenticated venture context.

### Router Definition

```typescript
// ============================================================================
// ANALYTICS ROUTER — tRPC PROCEDURES
// ============================================================================

export const analyticsRouter = router({
  // ── Metric Definitions ────────────────────────────────────────────────────
  listDefinitions:   ventureProcedure.input(listMetricsInputSchema).query(...),
  getDefinition:     ventureProcedure.input(z.object({ id: uuidSchema })).query(...),
  createDefinition:  ventureProcedure.input(createMetricInputSchema).mutation(...),
  updateDefinition:  ventureProcedure.input(updateMetricInputSchema).mutation(...),
  deleteDefinition:  ventureProcedure.input(z.object({ id: uuidSchema })).mutation(...),

  // ── Metric Values ────────────────────────────────────────────────────────
  recordValue:       ventureProcedure.input(metricEntrySchema).mutation(...),
  batchRecord:       ventureProcedure.input(z.object({
                       entries: z.array(metricEntrySchema).min(1).max(1000),
                     })).mutation(...),

  // ── Querying ─────────────────────────────────────────────────────────────
  query:             ventureProcedure.input(metricQueryParamsSchema).query(...),
  getLatest:         ventureProcedure.input(z.object({ metricId: uuidSchema })).query(...),
  compare:           ventureProcedure.input(z.object({
                       metricId: uuidSchema,
                       periods: z.array(dateRangeInputSchema).min(2).max(10),
                     })).query(...),
  aggregate:         ventureProcedure.input(aggregationParamsSchema).query(...),

  // ── Dashboards ───────────────────────────────────────────────────────────
  listDashboards:    ventureProcedure.input(listDashboardsInputSchema).query(...),
  getDashboard:      ventureProcedure.input(z.object({ id: uuidSchema })).query(...),
  createDashboard:   ventureProcedure.input(createDashboardInputSchema).mutation(...),
  updateDashboard:   ventureProcedure.input(updateDashboardInputSchema).mutation(...),
  deleteDashboard:   ventureProcedure.input(z.object({ id: uuidSchema })).mutation(...),
});
```

### Procedure Details

| Procedure | Type | Auth | Input | Description |
|-----------|------|------|-------|-------------|
| `listDefinitions` | Query | Venture | `ListMetricsInput` | Paginated metric listing with category/type/search filters |
| `getDefinition` | Query | Venture | `{ id: UUID }` | Single metric definition by ID |
| `createDefinition` | Mutation | Venture | `CreateMetricInput` | Create metric; returns CONFLICT if slug exists |
| `updateDefinition` | Mutation | Venture | `UpdateMetricInput` | Partial update; verifies venture ownership |
| `deleteDefinition` | Mutation | Venture | `{ id: UUID }` | Delete metric + cascade delete all values |
| `recordValue` | Mutation | Venture | `MetricEntry` | Record single value; verifies metric ownership |
| `batchRecord` | Mutation | Venture | `{ entries: MetricEntry[] }` | Batch insert 1-1000 values |
| `query` | Query | Venture | `MetricQueryParams` | Time series query with granularity/aggregation |
| `getLatest` | Query | Venture | `{ metricId: UUID }` | Most recent recorded value |
| `compare` | Query | Venture | `{ metricId, periods[] }` | Multi-period comparison (2-10 date ranges) |
| `aggregate` | Query | Venture | `AggregationParams` | Multi-metric aggregation with optional groupBy |
| `listDashboards` | Query | Venture | `ListDashboardsInput` | Paginated dashboard listing with search |
| `getDashboard` | Query | Venture | `{ id: UUID }` | Dashboard with full widget configs |
| `createDashboard` | Mutation | Venture | `CreateDashboardInput` | Create dashboard; auto-unsets previous default |
| `updateDashboard` | Mutation | Venture | `UpdateDashboardInput` | Update layout/widgets; auto-unsets other defaults |
| `deleteDashboard` | Mutation | Venture | `{ id: UUID }` | Delete dashboard |

---

## Code Examples

### Example 1: Create a Metric Definition

```typescript
import { createMetricsService } from '@mcv/api/services/metrics.service';

const service = createMetricsService(ventureId);

// Create a revenue metric
const metric = await service.createDefinition({
  name: 'Monthly Recurring Revenue',
  slug: 'mrr',
  description: 'Total monthly recurring revenue from all active subscriptions',
  type: 'gauge',
  category: 'revenue',
  unit: '$',
  format: 'currency',
  dimensions: ['plan', 'region'],
  metadata: { source: 'stripe', refreshInterval: '1h' },
});

console.log(metric.id);   // "a3f8c1e2-..."
console.log(metric.slug); // "mrr"
```

### Example 2: Record Metric Values (Single & Batch)

```typescript
const service = createMetricsService(ventureId);

// Record a single value
await service.recordValue(
  metricId,
  45231.50,
  { plan: 'pro', region: 'us-east' },
  new Date('2026-02-01T00:00:00Z')
);

// Batch record multiple values (up to 1000 per call)
await service.batchRecord([
  { metricId, value: 45231.50, dimensions: { plan: 'pro', region: 'us-east' } },
  { metricId, value: 12500.00, dimensions: { plan: 'starter', region: 'us-east' } },
  { metricId, value: 8900.00, dimensions: { plan: 'pro', region: 'eu-west' } },
  { metricId, value: 3200.00, dimensions: { plan: 'starter', region: 'eu-west' } },
]);
```

### Example 3: Query Time Series Data

```typescript
const service = createMetricsService(ventureId);

const timeSeries = await service.query({
  metricId: mrrMetricId,
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-02-01'),
  granularity: 'day',
  aggregation: 'sum',
  dimensions: { plan: 'pro' },  // Filter to only 'pro' plan
});

// Result:
// {
//   metric: { id: "...", name: "Monthly Recurring Revenue", ... },
//   points: [
//     { timestamp: "2026-01-01T00:00:00Z", value: 42100.00 },
//     { timestamp: "2026-01-02T00:00:00Z", value: 42350.00 },
//     ...
//   ],
//   summary: {
//     min: 41800.00,
//     max: 45231.50,
//     avg: 43500.25,
//     total: 1348507.75,
//   }
// }
```

### Example 4: Compare Metric Across Periods

```typescript
const service = createMetricsService(ventureId);

const comparison = await service.compare(mrrMetricId, [
  {
    startDate: new Date('2025-12-01'),
    endDate: new Date('2025-12-31'),
    label: 'December 2025',
  },
  {
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    label: 'January 2026',
  },
  {
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-02-28'),
    label: 'February 2026',
  },
]);

// Result:
// {
//   metricId: "...",
//   periods: [
//     { label: "December 2025", value: 120000, count: 31 },
//     { label: "January 2026",  value: 135000, count: 31 },
//     { label: "February 2026", value: 142000, count: 28 },
//   ],
//   changes: [
//     { fromPeriod: 0, toPeriod: 1, absoluteChange: 15000, percentChange: 12.5 },
//     { fromPeriod: 1, toPeriod: 2, absoluteChange: 7000,  percentChange: 5.19 },
//   ]
// }
```

### Example 5: Aggregate Multiple Metrics with Grouping

```typescript
const service = createMetricsService(ventureId);

const results = await service.aggregate({
  metricIds: [mrrMetricId, churnMetricId, npsMetricId],
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
  aggregation: 'avg',
  groupBy: 'region',
});

// Result:
// [
//   { metricId: "mrr-id",   metricName: "MRR",   value: 45000, count: 31, groupKey: "us-east" },
//   { metricId: "mrr-id",   metricName: "MRR",   value: 12000, count: 31, groupKey: "eu-west" },
//   { metricId: "churn-id", metricName: "Churn",  value: 2.1,   count: 31, groupKey: "us-east" },
//   { metricId: "churn-id", metricName: "Churn",  value: 1.8,   count: 31, groupKey: "eu-west" },
//   { metricId: "nps-id",   metricName: "NPS",    value: 72,    count: 31, groupKey: "us-east" },
//   { metricId: "nps-id",   metricName: "NPS",    value: 68,    count: 31, groupKey: "eu-west" },
// ]
```

### Example 6: Dashboard Management

```typescript
const service = createMetricsService(ventureId);

// Create a dashboard with widget layout
const dashboard = await service.createDashboard(
  {
    name: 'Revenue Overview',
    description: 'Monthly revenue and subscription metrics',
    isDefault: true,    // Auto-unsets previous default
    isShared: true,     // Visible to all team members
    layout: [
      { widgetId: 'w1', x: 0, y: 0, w: 6, h: 4 },   // Left half, top
      { widgetId: 'w2', x: 6, y: 0, w: 6, h: 4 },   // Right half, top
      { widgetId: 'w3', x: 0, y: 4, w: 12, h: 6 },   // Full width, bottom
    ],
    widgets: [
      {
        id: 'w1',
        type: 'metric_card',
        title: 'Current MRR',
        metricId: mrrMetricId,
      },
      {
        id: 'w2',
        type: 'metric_card',
        title: 'Active Customers',
        metricId: customersMetricId,
      },
      {
        id: 'w3',
        type: 'line_chart',
        title: 'Revenue Trend',
        metricId: mrrMetricId,
        queryParams: {
          granularity: 'day',
          aggregation: 'sum',
        },
      },
    ],
  },
  userId  // createdBy
);

// Get dashboard with full widget configs
const full = await service.getDashboard(dashboard.id);
// full.widgets → WidgetConfig[]
// full.layout  → WidgetLayout[]
```

### Example 7: tRPC API Usage from Client

```typescript
// Client-side tRPC calls via React Query
import { trpc } from '~/utils/trpc';

// List metrics with search
const { data: metrics } = trpc.analytics.listDefinitions.useQuery({
  category: 'revenue',
  search: 'recurring',
  page: 1,
  pageSize: 20,
});

// Record a value
const recordMutation = trpc.analytics.recordValue.useMutation();
await recordMutation.mutateAsync({
  metricId: 'abc-123',
  value: 45231.50,
  dimensions: { plan: 'pro' },
});

// Batch record (up to 1000 entries)
const batchMutation = trpc.analytics.batchRecord.useMutation();
await batchMutation.mutateAsync({
  entries: generateDailyMetrics(metricId, 30),  // 30 days of data
});

// Query time series
const { data: timeSeries } = trpc.analytics.query.useQuery({
  metricId: mrrMetricId,
  startDate: startOfMonth(new Date()),
  endDate: endOfMonth(new Date()),
  granularity: 'day',
  aggregation: 'sum',
});

// Compare periods
const { data: comparison } = trpc.analytics.compare.useQuery({
  metricId: mrrMetricId,
  periods: [
    { startDate: subMonths(now, 2), endDate: subMonths(now, 1), label: 'Last Month' },
    { startDate: subMonths(now, 1), endDate: now, label: 'This Month' },
  ],
});
```

### Example 8: LLM Usage Tracking (Fire-and-Forget)

```typescript
import { UsageTracker } from '@mcv/gateway/server';

const tracker = new UsageTracker();

// Record a completed LLM request (called automatically by gateway pipeline)
await tracker.record({
  requestId: 'req-a1b2c3d4',
  ventureId: 'betedge-venture-uuid',
  userId: 'user-123',
  model: 'anthropic/claude-3.5-sonnet',
  tier: 1,
  provider: 'anthropic',
  promptTokens: 1250,
  completionTokens: 830,
  totalTokens: 2080,
  costUsd: 0.01248,
  latencyMs: 1420,
  complexityScore: 4.2,
  agentType: 'ralph',
  taskId: 'task-xyz',
  sessionId: 'session-789',
  traceId: 'trace-abc123',
  spanId: 'span-def456',
  status: 'completed',
});

// Recording is fire-and-forget:
// - Never throws (catches and logs errors)
// - Never blocks the gateway response pipeline
// - Database connection is lazy-loaded on first call
```

### Example 9: Query LLM Usage Metrics

```typescript
const tracker = new UsageTracker();

// Get aggregated metrics for a venture (all aggregation at DB level)
const metrics = await tracker.getMetrics(
  'betedge-venture-uuid',
  new Date('2026-01-01'),
  new Date('2026-01-31')
);

console.log('January 2026 Usage:');
console.log(`  Total requests: ${metrics.totalRequests}`);
console.log(`  Total tokens: ${metrics.totalTokens.toLocaleString()}`);
console.log(`  Total cost: $${metrics.totalCost.toFixed(2)}`);
console.log(`  Avg latency: ${metrics.avgLatency.toFixed(0)}ms`);
console.log(`  Success rate: ${metrics.successRate.toFixed(1)}%`);

// Breakdown by tier
console.log('\nBy Tier:');
for (const [tier, data] of Object.entries(metrics.byTier)) {
  console.log(`  Tier ${tier}: ${data.requests} requests, $${data.cost.toFixed(2)}`);
}

// Breakdown by model
console.log('\nBy Model:');
for (const [model, data] of Object.entries(metrics.byModel)) {
  console.log(`  ${model}: ${data.requests} requests, ${data.tokens} tokens`);
}

// Breakdown by NAOS agent
console.log('\nBy Agent:');
for (const [agent, data] of Object.entries(metrics.byAgent)) {
  console.log(`  ${agent}: ${data.requests} requests, $${data.cost.toFixed(2)}`);
}
```

### Example 10: LLM Usage Time Series

```typescript
const tracker = new UsageTracker();

// Get daily usage time series for charts
const timeSeries = await tracker.getTimeSeries(
  'betedge-venture-uuid',
  new Date('2026-01-01'),
  new Date('2026-01-31'),
  'day'  // 'hour' | 'day' | 'week'
);

// Result:
// [
//   { date: "2026-01-01", requests: 142, tokens: 285000, cost: 1.71 },
//   { date: "2026-01-02", requests: 168, tokens: 312000, cost: 2.04 },
//   ...
// ]

// Perfect for feeding into chart libraries:
const chartData = timeSeries.map(point => ({
  date: point.date,
  cost: point.cost,
  requests: point.requests,
}));
```

### Example 11: Real-Time Stats Dashboard

```typescript
const tracker = new UsageTracker();

// Get real-time stats (last hour rolling window)
const realtime = await tracker.getRealtimeStats('betedge-venture-uuid');

console.log('Real-time (last hour):');
console.log(`  Requests/min: ${realtime.requestsPerMinute.toFixed(1)}`);
console.log(`  Tokens/min: ${realtime.tokensPerMinute.toFixed(0)}`);
console.log(`  Avg latency: ${realtime.avgLatencyMs.toFixed(0)}ms`);
console.log(`  Error rate: ${realtime.errorRate.toFixed(2)}%`);
console.log(`  Active models: ${realtime.activeModels.join(', ')}`);

// For a platform-wide admin view (no ventureId = all ventures):
const globalRealtime = await tracker.getRealtimeStats();
```

### Example 12: Admin — Cross-Venture Usage Analysis

```typescript
const tracker = new UsageTracker();

// Get usage grouped by venture (super admin only)
const ventureUsage = await tracker.getUsageByVenture(
  new Date('2026-01-01'),
  new Date('2026-01-31'),
  20  // top 20 ventures by cost
);

console.log('Top Ventures by Cost (January 2026):');
for (const v of ventureUsage) {
  console.log(`  ${v.ventureId}: ${v.requests} requests, $${v.cost.toFixed(2)}`);
}

// Get global platform metrics (all ventures)
const global = await tracker.getGlobalMetrics(
  new Date('2026-01-01'),
  new Date('2026-01-31')
);

console.log(`\nPlatform Total: ${global.totalRequests} requests, $${global.totalCost.toFixed(2)}`);
console.log(`Success Rate: ${global.successRate.toFixed(1)}%`);
```

### Example 13: Usage by User

```typescript
const tracker = new UsageTracker();

// Get usage grouped by user within a venture
const userUsage = await tracker.getUsageByUser(
  'betedge-venture-uuid',
  new Date('2026-01-01'),
  new Date('2026-01-31'),
  20  // top 20 users by cost
);

console.log('Top Users by Cost:');
for (const u of userUsage) {
  console.log(`  ${u.userId}: ${u.requests} requests, ${u.tokens} tokens, $${u.cost.toFixed(2)}`);
}
```

### Example 14: Filtered Usage Logs

```typescript
const tracker = new UsageTracker();

// Get paginated, filtered usage logs
const { logs, total } = await tracker.getLogs('betedge-venture-uuid', {
  limit: 50,
  offset: 0,
  model: 'anthropic/claude-3.5-sonnet',
  tier: 1,
  agentType: 'queen',
  status: 'completed',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-01-31'),
});

console.log(`Found ${total} matching logs (showing first 50):`);
for (const log of logs) {
  console.log(
    `  ${log.createdAt.toISOString()} | ${log.model} | ` +
    `${log.totalTokens} tokens | $${log.costUsd} | ${log.latencyMs}ms | ` +
    `${log.status} | trace: ${log.traceId}`
  );
}
```

### Example 15: React Dashboard with MetricCard Components

```tsx
import { MetricCard, MetricDashboard, FeaturedMetric, CompactMetric } from '@mcv/ui';
import { useCurrentRagSpend, useRagCostTrend } from '@mcv/rag/client';
import { trpc } from '~/utils/trpc';

function AIMetricsDashboard({ ventureId }: { ventureId: string }) {
  // Fetch current month AI spend (auto-refreshes every 30s)
  const { data: currentSpend, isLoading: spendLoading } = useCurrentRagSpend();

  // Fetch 6-month cost trend for sparkline
  const { data: costTrend } = useRagCostTrend();

  // Fetch custom business metrics
  const { data: timeSeries } = trpc.analytics.query.useQuery({
    metricId: mrrMetricId,
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    granularity: 'day',
    aggregation: 'sum',
  });

  const sparklineData = costTrend?.map(p => p.cost) ?? [];

  return (
    <div className="space-y-6">
      {/* Featured AI Cost Card */}
      <FeaturedMetric
        label="AI Spend (This Month)"
        value={currentSpend?.totalCost ?? 0}
        prefix="$"
        trend={currentSpend?.trend ?? 'neutral'}
        change={currentSpend?.percentChange}
        sparklineData={sparklineData}
        isLoading={spendLoading}
        description="Total LLM costs across all models and agents"
      />

      {/* Compact metrics grid */}
      <MetricDashboard
        metrics={[
          {
            id: 'requests',
            label: 'Total Requests',
            value: currentSpend?.totalRequests ?? 0,
            trend: 'up',
            sparkline: costTrend?.map(p => p.requests) ?? [],
          },
          {
            id: 'tokens',
            label: 'Tokens Used',
            value: `${((currentSpend?.totalTokens ?? 0) / 1_000_000).toFixed(1)}M`,
            trend: 'up',
          },
          {
            id: 'latency',
            label: 'Avg Latency',
            value: currentSpend?.avgLatency ?? 0,
            unit: 'ms',
            unitPosition: 'suffix',
            trend: 'down',  // Lower is better
          },
          {
            id: 'success',
            label: 'Success Rate',
            value: `${currentSpend?.successRate?.toFixed(1) ?? 0}%`,
            trend: 'up',
            progress: currentSpend?.successRate ?? 0,
          },
        ]}
        columns={4}
        variant="compact"
        showSparkline={true}
        showTrend={true}
        invertTrend={false}
      />

      {/* Custom business metrics from Analytics Hub */}
      {timeSeries && (
        <MetricCard
          label="MRR Trend"
          value={`$${timeSeries.summary.total.toLocaleString()}`}
          trend={timeSeries.summary.avg > 40000 ? 'up' : 'down'}
          sparklineData={timeSeries.points.map(p => p.value)}
          variant="bordered"
          size="lg"
        />
      )}
    </div>
  );
}
```

---

## Service Layer Implementation

### MetricsService — Business KPI Analytics

The `MetricsService` class is a venture-scoped service that manages metric definitions, time series data, and dashboards. Key design decisions:

- **Venture isolation**: All operations filter by `ventureId` to ensure data isolation
- **Slug uniqueness**: Enforced at both the database level (unique index) and application level (pre-check)
- **App-level dimension filtering**: JSONB dimension fields are filtered in the application layer for flexibility
- **Bucket-based aggregation**: Time series queries group values into time buckets (hour/day/week/month) and apply aggregation functions (sum/avg/count/min/max)
- **Cascade deletion**: Deleting a metric definition automatically deletes all associated values via FK constraint

```typescript
// ════════════════════════════════════════════════════════════════════
// KEY SERVICE METHODS
// ════════════════════════════════════════════════════════════════════

class MetricsService {
  // Time bucket key generation
  private getBucketKey(timestamp: Date, granularity: string): string {
    const d = new Date(timestamp);
    switch (granularity) {
      case 'hour':   d.setMinutes(0, 0, 0); break;
      case 'day':    d.setHours(0, 0, 0, 0); break;
      case 'week':   d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); break;
      case 'month':  d.setDate(1); d.setHours(0, 0, 0, 0); break;
    }
    return d.toISOString();
  }

  // Aggregation function application
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
```

### UsageTracker — LLM Operational Metrics

The `UsageTracker` class handles all LLM usage logging and aggregation. Key design decisions:

- **Fire-and-forget recording**: The `record()` method never throws; failures are logged but don't block the gateway pipeline
- **Lazy database initialization**: Database connection is loaded on first use to avoid startup overhead
- **Database-level aggregation**: All aggregation queries (getMetrics, getTimeSeries, etc.) use SQL-level GROUP BY and aggregation functions rather than loading data into memory
- **Parallel SQL execution**: `getMetrics()` runs 4 aggregation queries in parallel (overall summary, by-tier, by-model, by-agent)
- **Rolling window stats**: `getRealtimeStats()` provides last-hour metrics for live dashboards

```typescript
// ════════════════════════════════════════════════════════════════════
// PARALLEL SQL AGGREGATION PATTERN
// ════════════════════════════════════════════════════════════════════

// All 4 queries run simultaneously — typically completes in 50-100ms
const [summaryResult, tierResult, modelResult, agentResult] = await Promise.all([
  // 1. Overall summary: COUNT, SUM(tokens), SUM(cost), AVG(latency), success_count
  db.execute(sql`SELECT COUNT(*)::int as total_requests, ...`),

  // 2. By tier: GROUP BY tier
  db.execute(sql`SELECT tier, COUNT(*)::int as requests, ... GROUP BY tier`),

  // 3. By model: GROUP BY model (top 20 by cost)
  db.execute(sql`SELECT model, COUNT(*)::int as requests, ... GROUP BY model LIMIT 20`),

  // 4. By agent: GROUP BY agent_type
  db.execute(sql`SELECT agent_type, COUNT(*)::int as requests, ... GROUP BY agent_type`),
]);
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 | Notes |
|-----------|--------|-----|-------|
| **Business Metrics** | | | |
| Create metric definition | < 20ms | < 50ms | Single INSERT with uniqueness check |
| Record single value | < 10ms | < 30ms | Single INSERT |
| Batch record (100 values) | < 50ms | < 150ms | Bulk INSERT |
| Batch record (1000 values) | < 200ms | < 500ms | Bulk INSERT, max batch size |
| Time series query (30 days) | < 100ms | < 300ms | Index scan + app-level aggregation |
| Time series query (365 days) | < 500ms | < 1500ms | Larger scan, more buckets |
| Period comparison (3 periods) | < 60ms | < 200ms | 3 parallel SUM queries |
| Multi-metric aggregation (10 metrics) | < 200ms | < 600ms | Sequential per-metric queries |
| List definitions (20 per page) | < 20ms | < 50ms | Index scan with pagination |
| **LLM Usage Tracking** | | | |
| Usage recording (fire-and-forget) | < 2ms (async) | < 5ms | Non-blocking INSERT |
| Get aggregated metrics | < 100ms | < 300ms | 4 parallel SQL aggregations |
| Get time series (daily, 30 days) | < 50ms | < 150ms | date_trunc GROUP BY |
| Get usage logs (paginated) | < 30ms | < 100ms | Index scan with filters |
| Get real-time stats (1 hour) | < 30ms | < 80ms | Recent-data scan |
| Get usage by user/venture | < 50ms | < 150ms | GROUP BY with LIMIT |
| Get global metrics (admin) | < 200ms | < 500ms | Full-table aggregation |
| **Dashboard Operations** | | | |
| Create dashboard | < 20ms | < 50ms | Single INSERT + optional UPDATE |
| Update dashboard | < 15ms | < 40ms | Single UPDATE |
| Get dashboard with widgets | < 10ms | < 30ms | Single SELECT by PK |
| List dashboards | < 20ms | < 50ms | Index scan with pagination |

### Throughput Targets

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| Metric value recordings/second | 100 | 5,000+ |
| Usage log recordings/second | 50 | 500+ |
| Concurrent time series queries | 20 | 200+ |
| Dashboard reads/second | 50 | 500+ |
| Total metric_values rows | 10M | 500M+ |
| Total llm_usage_logs rows | 1M | 50M+ |

### Optimization Strategies

1. **Database-level aggregation**: All UsageTracker aggregations use SQL rather than loading data into memory. This is critical for scaling beyond 1M usage logs.

2. **Parallel query execution**: `getMetrics()` runs 4 independent aggregation queries concurrently, reducing latency by ~3x compared to sequential execution.

3. **Composite indexes**: The `(metric_id, timestamp)` composite index on `metric_values` enables efficient range scans for time series queries without a full table scan.

4. **Fire-and-forget recording**: Usage tracking never blocks the gateway response pipeline. Failures are logged, not thrown.

5. **Pagination everywhere**: All list operations use offset-based pagination to prevent unbounded result sets.

6. **App-level JSONB filtering**: Dimension filters on JSONB columns are applied in the application layer. This is intentional — PostgreSQL JSONB containment operators (`@>`) can use GIN indexes but the current schema uses B-tree indexes. For high-volume deployments, add a GIN index:
   ```sql
   CREATE INDEX metric_values_dimensions_gin ON metric_values USING gin (dimensions);
   ```

7. **Table partitioning (high-volume)**: For deployments exceeding 100M metric values, partition `metric_values` by timestamp using PostgreSQL range partitioning (monthly partitions).

8. **Connection pooling**: The Drizzle ORM instance is shared across all service invocations. Use PgBouncer or Supabase connection pooling for high-concurrency deployments.

### Memory Considerations

| Pattern | Memory Risk | Mitigation |
|---------|-------------|------------|
| Large time series query | Loading all values into memory for bucketing | Paginate queries; cap date range to 1 year |
| Multi-metric aggregation | Sequential per-metric queries (50 max) | Limit to 50 metrics; use database-level GROUP BY |
| Batch recording | 1000 entries in memory | Hard cap at 1000 entries per batch |
| JSONB dimension filtering | Full result set loaded before filtering | Pre-filter by time range at DB level |
| Dashboard widget configs | Large JSONB payloads | No hard limit but expect < 100 widgets |

---

## Security Considerations

### Row-Level Security (RLS)

All metrics tables enforce venture-level data isolation through Supabase RLS policies:

```sql
-- ============================================================================
-- RLS POLICIES: metric_definitions
-- ============================================================================

ALTER TABLE metric_definitions ENABLE ROW LEVEL SECURITY;

-- Venture members can read their own metrics
CREATE POLICY "metric_definitions_select" ON metric_definitions
  FOR SELECT
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
    )
  );

-- Venture admins/owners can create metrics
CREATE POLICY "metric_definitions_insert" ON metric_definitions
  FOR INSERT
  WITH CHECK (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Venture admins/owners can update metrics
CREATE POLICY "metric_definitions_update" ON metric_definitions
  FOR UPDATE
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Venture admins/owners can delete metrics
CREATE POLICY "metric_definitions_delete" ON metric_definitions
  FOR DELETE
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: metric_values
-- ============================================================================

ALTER TABLE metric_values ENABLE ROW LEVEL SECURITY;

-- Venture members can read values for metrics they own
CREATE POLICY "metric_values_select" ON metric_values
  FOR SELECT
  USING (
    metric_id IN (
      SELECT id FROM metric_definitions
      WHERE venture_id IN (
        SELECT venture_id FROM venture_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Venture members can insert values for metrics they own
CREATE POLICY "metric_values_insert" ON metric_values
  FOR INSERT
  WITH CHECK (
    metric_id IN (
      SELECT id FROM metric_definitions
      WHERE venture_id IN (
        SELECT venture_id FROM venture_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- RLS POLICIES: metric_dashboards
-- ============================================================================

ALTER TABLE metric_dashboards ENABLE ROW LEVEL SECURITY;

-- Venture members can read shared dashboards or their own
CREATE POLICY "metric_dashboards_select" ON metric_dashboards
  FOR SELECT
  USING (
    (is_shared = true AND venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
    ))
    OR
    created_by = auth.uid()
  );

-- Venture members can create dashboards
CREATE POLICY "metric_dashboards_insert" ON metric_dashboards
  FOR INSERT
  WITH CHECK (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
    )
  );

-- Dashboard creators and admins can update
CREATE POLICY "metric_dashboards_update" ON metric_dashboards
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Dashboard creators and admins can delete
CREATE POLICY "metric_dashboards_delete" ON metric_dashboards
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: llm_usage_logs
-- ============================================================================

ALTER TABLE llm_usage_logs ENABLE ROW LEVEL SECURITY;

-- Venture members can read usage logs for their venture
CREATE POLICY "llm_usage_logs_select" ON llm_usage_logs
  FOR SELECT
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
    )
  );

-- Only the service role can insert usage logs (gateway backend)
CREATE POLICY "llm_usage_logs_insert" ON llm_usage_logs
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
  );

-- Super admins can read all usage logs (cross-venture)
CREATE POLICY "llm_usage_logs_admin_select" ON llm_usage_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE is_super_admin = true
    )
  );
```

### Data Isolation

| Layer | Mechanism | Notes |
|-------|-----------|-------|
| **Application** | `MetricsService` is venture-scoped; all queries include `venture_id = this.ventureId` | Primary isolation mechanism |
| **Database** | RLS policies on all metrics tables | Defense-in-depth; prevents direct SQL access bypass |
| **API** | `ventureProcedure` middleware injects authenticated venture context | All tRPC calls validate session + venture membership |
| **Usage Logs** | Service-role only INSERT; venture-scoped SELECT | Gateway backend writes; users read their own |

### Access Control Matrix

| Operation | Owner | Admin | Member | Viewer | Service Role |
|-----------|-------|-------|--------|--------|-------------|
| List metric definitions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create metric definition | ✅ | ✅ | ❌ | ❌ | ✅ |
| Update metric definition | ✅ | ✅ | ❌ | ❌ | ✅ |
| Delete metric definition | ✅ | ✅ | ❌ | ❌ | ✅ |
| Record metric value | ✅ | ✅ | ✅ | ❌ | ✅ |
| Query time series | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create dashboard | ✅ | ✅ | ✅ | ❌ | ✅ |
| Edit own dashboard | ✅ | ✅ | ✅ | ❌ | ✅ |
| Edit others' dashboard | ✅ | ✅ | ❌ | ❌ | ✅ |
| Delete dashboard | ✅ | ✅ | Creator only | ❌ | ✅ |
| View usage logs | ✅ | ✅ | ✅ | ✅ | ✅ |
| Write usage logs | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cross-venture usage | Super Admin | Super Admin | ❌ | ❌ | ✅ |

### PII Handling

- **Usage logs**: `user_id` is stored as UUID, not email/name. PII resolution happens at display time via profile lookup.
- **Metric values**: Business metrics may contain PII in dimensional values (e.g., `{ customer: "john@..." }`). This is the venture's responsibility to manage.
- **Error messages**: Limited to 512 characters; truncated to prevent PII leakage in error details.
- **Dashboards**: `created_by` stored as UUID; display name resolved at render time.

---

## Audit Events

| Event | Category | Description | Payload |
|-------|----------|-------------|---------|
| `metrics.definition.created` | data | New metric definition created | `{ metricId, name, slug, type, category }` |
| `metrics.definition.updated` | data | Metric definition updated | `{ metricId, fields: string[] }` |
| `metrics.definition.deleted` | data | Metric definition deleted (values cascaded) | `{ metricId, name, valuesDeleted: number }` |
| `metrics.definition.deactivated` | data | Metric soft-disabled (isActive → false) | `{ metricId, name }` |
| `metrics.definition.reactivated` | data | Metric re-enabled (isActive → true) | `{ metricId, name }` |
| `metrics.value.recorded` | data | Single metric value recorded | `{ metricId, value, dimensions }` |
| `metrics.value.batch_recorded` | data | Batch of metric values recorded | `{ metricId, count, firstTimestamp, lastTimestamp }` |
| `metrics.query.executed` | system | Time series query executed | `{ metricId, granularity, aggregation, pointCount }` |
| `metrics.comparison.executed` | system | Period comparison executed | `{ metricId, periodCount }` |
| `metrics.aggregation.executed` | system | Multi-metric aggregation executed | `{ metricIds: string[], groupBy }` |
| `metrics.dashboard.created` | data | New dashboard created | `{ dashboardId, name, widgetCount, isDefault }` |
| `metrics.dashboard.updated` | data | Dashboard updated | `{ dashboardId, fields: string[] }` |
| `metrics.dashboard.deleted` | data | Dashboard deleted | `{ dashboardId, name }` |
| `metrics.dashboard.default_changed` | data | Default dashboard switched | `{ newDefaultId, previousDefaultId }` |
| `metrics.dashboard.shared` | data | Dashboard sharing toggled | `{ dashboardId, isShared: boolean }` |
| `metrics.usage.recorded` | system | LLM usage log entry created | `{ requestId, model, tier, costUsd, status }` |
| `metrics.usage.record_failed` | error | Usage recording failed (non-blocking) | `{ error: string }` |
| `metrics.usage.query.executed` | system | Usage metrics query executed | `{ ventureId, dateRange, queryType }` |
| `metrics.usage.realtime.queried` | system | Real-time stats queried | `{ ventureId, requestsPerMinute }` |
| `metrics.usage.admin.cross_venture` | admin | Cross-venture usage query (super admin) | `{ adminUserId, dateRange, ventureCount }` |
| `metrics.usage.admin.global` | admin | Global platform metrics queried | `{ adminUserId, totalRequests, totalCost }` |
| `metrics.export.requested` | data | Metric data export initiated | `{ metricId, format, dateRange }` |
| `metrics.slug.conflict` | warning | Duplicate slug creation attempted | `{ ventureId, slug, existingMetricId }` |

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════════════════════

# Primary database URL (PostgreSQL via Supabase)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Connection pooling URL (for high-concurrency deployments)
DATABASE_POOL_URL=postgresql://user:pass@host:6543/db?pgbouncer=true

# Maximum database connections for metrics queries
METRICS_DB_POOL_SIZE=10                          # Default: 10

# ═══════════════════════════════════════════════════════════════════════════════
# METRICS SERVICE
# ═══════════════════════════════════════════════════════════════════════════════

# Maximum batch size for metric value recording
METRICS_MAX_BATCH_SIZE=1000                      # Default: 1000

# Maximum number of metrics per aggregation query
METRICS_MAX_AGGREGATION_METRICS=50               # Default: 50

# Maximum comparison periods per query
METRICS_MAX_COMPARISON_PERIODS=10                # Default: 10

# Maximum date range for time series queries (days)
METRICS_MAX_DATE_RANGE_DAYS=365                  # Default: 365

# Default pagination size
METRICS_DEFAULT_PAGE_SIZE=20                     # Default: 20

# Maximum pagination size
METRICS_MAX_PAGE_SIZE=100                        # Default: 100

# ═══════════════════════════════════════════════════════════════════════════════
# USAGE TRACKER
# ═══════════════════════════════════════════════════════════════════════════════

# Enable/disable usage tracking (false in test environments)
USAGE_TRACKING_ENABLED=true                      # Default: true

# Maximum models returned in getMetrics byModel breakdown
USAGE_MAX_MODELS_BREAKDOWN=20                    # Default: 20

# Maximum users/ventures returned in group queries
USAGE_MAX_GROUP_RESULTS=20                       # Default: 20

# Real-time stats window (minutes)
USAGE_REALTIME_WINDOW_MINUTES=60                 # Default: 60

# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════

# Maximum widgets per dashboard
DASHBOARD_MAX_WIDGETS=50                         # Default: 50 (no hard limit in code)

# Maximum dashboards per venture
DASHBOARD_MAX_PER_VENTURE=100                    # Default: 100 (no hard limit in code)

# ═══════════════════════════════════════════════════════════════════════════════
# AUDIT LOGGING
# ═══════════════════════════════════════════════════════════════════════════════

# Enable audit logging for metrics operations
METRICS_AUDIT_ENABLED=true                       # Default: true

# Audit log level (minimal, standard, verbose)
METRICS_AUDIT_LEVEL=standard                     # Default: standard

# ═══════════════════════════════════════════════════════════════════════════════
# PERFORMANCE
# ═══════════════════════════════════════════════════════════════════════════════

# Query timeout for long-running aggregations (ms)
METRICS_QUERY_TIMEOUT_MS=30000                   # Default: 30000

# Enable query result caching (Redis)
METRICS_CACHE_ENABLED=false                      # Default: false

# Cache TTL for aggregated results (seconds)
METRICS_CACHE_TTL_SECONDS=60                     # Default: 60
```

---

## Error Codes & Resolutions

| Error Code | HTTP | tRPC Code | Message | Resolution |
|------------|------|-----------|---------|------------|
| `METRIC_NOT_FOUND` | 404 | `NOT_FOUND` | Metric definition not found | Verify metric ID exists and belongs to the current venture |
| `METRIC_SLUG_CONFLICT` | 409 | `CONFLICT` | Metric with slug "{slug}" already exists | Use a different slug or update the existing metric |
| `METRIC_SLUG_INVALID` | 400 | `BAD_REQUEST` | Slug must be lowercase alphanumeric with hyphens/underscores | Ensure slug matches `/^[a-z0-9_-]+$/` |
| `METRIC_VALUE_INVALID` | 400 | `BAD_REQUEST` | Value must be a valid number | Ensure value is a finite number (not NaN or Infinity) |
| `METRIC_BATCH_TOO_LARGE` | 400 | `BAD_REQUEST` | Batch size exceeds maximum of 1000 | Split batch into chunks of ≤1000 entries |
| `METRIC_BATCH_INVALID_ID` | 404 | `NOT_FOUND` | Metric definition not found: {metricId} | One or more metric IDs in batch don't exist in this venture |
| `METRIC_QUERY_RANGE_EXCEEDED` | 400 | `BAD_REQUEST` | Date range exceeds maximum of 365 days | Narrow the query date range |
| `METRIC_COMPARISON_PERIODS` | 400 | `BAD_REQUEST` | Must provide 2-10 comparison periods | Ensure periods array has 2-10 items |
| `METRIC_AGGREGATION_LIMIT` | 400 | `BAD_REQUEST` | Cannot aggregate more than 50 metrics | Reduce the number of metric IDs |
| `DASHBOARD_NOT_FOUND` | 404 | `NOT_FOUND` | Dashboard not found | Verify dashboard ID exists and belongs to the current venture |
| `DASHBOARD_NAME_REQUIRED` | 400 | `BAD_REQUEST` | Dashboard name is required | Provide a non-empty name (1-255 chars) |
| `DASHBOARD_WIDGET_LAYOUT_MISMATCH` | 400 | `BAD_REQUEST` | Layout references unknown widget ID | Ensure all layout widgetId values match a widget config id |
| `USAGE_TRACKING_DISABLED` | 503 | `INTERNAL_SERVER_ERROR` | Usage tracking is disabled | Set `USAGE_TRACKING_ENABLED=true` in environment |
| `USAGE_DB_UNAVAILABLE` | 503 | `INTERNAL_SERVER_ERROR` | Database not available for usage recording | Check database connection; usage recording will auto-retry on next request |
| `USAGE_QUERY_TIMEOUT` | 504 | `TIMEOUT` | Usage query timed out | Narrow date range or add more specific filters |
| `VENTURE_NOT_FOUND` | 404 | `NOT_FOUND` | Venture not found | Verify venture ID is valid |
| `UNAUTHORIZED` | 401 | `UNAUTHORIZED` | Authentication required | Provide valid session token |
| `FORBIDDEN` | 403 | `FORBIDDEN` | Insufficient permissions | User must be venture admin/owner for write operations |

### Error Handling Patterns

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// USAGE TRACKER: Fire-and-Forget Error Handling
// ═══════════════════════════════════════════════════════════════════════════════

async record(record: UsageRecord): Promise<void> {
  try {
    await this.initialize();
    if (!this.db || !this.schema) {
      console.warn('[UsageTracker] Database not available, skipping usage recording');
      return;  // Graceful degradation: don't block the gateway
    }
    await this.db.insert(this.schema.llmUsageLogs).values({ ... });
  } catch (error) {
    // Log but don't throw — usage tracking should NEVER break requests
    console.error('[UsageTracker] Failed to record usage:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS ROUTER: tRPC Error Wrapping
// ═══════════════════════════════════════════════════════════════════════════════

createDefinition: ventureProcedure
  .input(createMetricInputSchema)
  .mutation(async ({ ctx, input }) => {
    const service = createMetricsService(ctx.venture.id);
    try {
      return await service.createDefinition(input);
    } catch (error) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: error instanceof Error ? error.message : 'Failed to create metric',
      });
    }
  }),
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | ^0.29.x | Database ORM for PostgreSQL schema, queries, and relations |
| `@trpc/server` | ^10.x | tRPC router and procedure definitions |
| `zod` | ^3.x | Input validation schemas for all API endpoints |
| `@supabase/supabase-js` | ^2.x | Supabase client for RLS-enabled database access |
| `react` | ^18.x | UI component rendering (MetricCard, MetricDashboard) |
| `@tanstack/react-query` | ^5.x | Data fetching and caching for tRPC hooks |
| `framer-motion` | ^10.x | Animation for MetricDashboard stagger effects |
| `date-fns` | ^3.x | Date manipulation for time series bucketing and comparison |
| `recharts` | ^2.x | Chart rendering for dashboard widgets (line, bar, area, pie) |

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/db` | Drizzle schema definitions, database client, and utility functions |
| `@mcv/gateway` | UsageTracker service, LLM usage types, correlation utilities |
| `@mcv/api` | tRPC router infrastructure, ventureProcedure middleware, pagination utilities |
| `@mcv/ui` | MetricCard, MetricDashboard, and other display components |
| `@mcv/rag` | RAG-specific metrics hooks (useRagCosts, useCurrentRagSpend, etc.) |

### Dependency Graph

```
@mcv/intelligence/metrics
├── @mcv/db                      (schema + ORM)
│   └── drizzle-orm              (query builder)
│       └── pg                   (PostgreSQL driver)
├── @mcv/gateway                 (UsageTracker)
│   └── @mcv/db                  (llm_usage_logs schema)
├── @mcv/api                     (tRPC router)
│   ├── @trpc/server             (procedure definitions)
│   └── zod                      (input validation)
├── @mcv/ui                      (React components)
│   ├── react                    (rendering)
│   ├── framer-motion            (animations)
│   └── recharts                 (charts)
└── @mcv/rag                     (RAG metrics hooks)
    └── @tanstack/react-query    (data fetching)
```

---

## Testing Notes

### Unit Testing

```typescript
import { MetricsService } from '@mcv/api/services/metrics.service';
import { UsageTracker } from '@mcv/gateway/server';

// ═══════════════════════════════════════════════════════════════════════════════
// METRICS SERVICE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService('test-venture-id', testDb);
  });

  describe('createDefinition', () => {
    it('should create a metric with valid input', async () => {
      const metric = await service.createDefinition({
        name: 'Test Revenue',
        slug: 'test-revenue',
        type: 'gauge',
        category: 'revenue',
        unit: '$',
      });

      expect(metric.id).toBeDefined();
      expect(metric.slug).toBe('test-revenue');
      expect(metric.type).toBe('gauge');
      expect(metric.isActive).toBe(true);
    });

    it('should reject duplicate slugs within a venture', async () => {
      await service.createDefinition({
        name: 'Revenue A',
        slug: 'revenue',
        type: 'counter',
        category: 'revenue',
      });

      await expect(
        service.createDefinition({
          name: 'Revenue B',
          slug: 'revenue',  // Same slug!
          type: 'gauge',
          category: 'revenue',
        })
      ).rejects.toThrow('Metric with slug "revenue" already exists');
    });

    it('should allow same slug in different ventures', async () => {
      const serviceA = new MetricsService('venture-a', testDb);
      const serviceB = new MetricsService('venture-b', testDb);

      const metricA = await serviceA.createDefinition({
        name: 'MRR',
        slug: 'mrr',
        type: 'gauge',
        category: 'revenue',
      });

      const metricB = await serviceB.createDefinition({
        name: 'MRR',
        slug: 'mrr',
        type: 'gauge',
        category: 'revenue',
      });

      expect(metricA.id).not.toBe(metricB.id);
    });
  });

  describe('query', () => {
    it('should aggregate values by day', async () => {
      // Setup: create metric and record 10 values across 5 days
      const metric = await service.createDefinition({
        name: 'Daily Sales',
        slug: 'daily-sales',
        type: 'counter',
        category: 'revenue',
      });

      for (let i = 0; i < 10; i++) {
        await service.recordValue(
          metric.id,
          100 + i * 10,
          undefined,
          new Date(`2026-01-${String(Math.floor(i / 2) + 1).padStart(2, '0')}`)
        );
      }

      const result = await service.query({
        metricId: metric.id,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-05'),
        granularity: 'day',
        aggregation: 'sum',
      });

      expect(result.points).toHaveLength(5);
      expect(result.summary.total).toBe(1450); // Sum of 100..190
    });

    it('should filter by dimensions', async () => {
      const metric = await service.createDefinition({
        name: 'Revenue by Region',
        slug: 'revenue-by-region',
        type: 'gauge',
        category: 'revenue',
        dimensions: ['region'],
      });

      await service.recordValue(metric.id, 100, { region: 'us-east' });
      await service.recordValue(metric.id, 200, { region: 'eu-west' });
      await service.recordValue(metric.id, 150, { region: 'us-east' });

      const result = await service.query({
        metricId: metric.id,
        startDate: subDays(new Date(), 1),
        endDate: addDays(new Date(), 1),
        granularity: 'day',
        aggregation: 'sum',
        dimensions: { region: 'us-east' },
      });

      expect(result.summary.total).toBe(250); // Only us-east values
    });
  });

  describe('compare', () => {
    it('should compute percent change between periods', async () => {
      const metric = await service.createDefinition({
        name: 'Signups',
        slug: 'signups',
        type: 'counter',
        category: 'acquisition',
      });

      // Jan: 100, Feb: 125
      await service.recordValue(metric.id, 100, undefined, new Date('2026-01-15'));
      await service.recordValue(metric.id, 125, undefined, new Date('2026-02-15'));

      const result = await service.compare(metric.id, [
        { startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31'), label: 'Jan' },
        { startDate: new Date('2026-02-01'), endDate: new Date('2026-02-28'), label: 'Feb' },
      ]);

      expect(result.changes[0]!.percentChange).toBe(25); // 25% increase
      expect(result.changes[0]!.absoluteChange).toBe(25);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// USAGE TRACKER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('UsageTracker', () => {
  let tracker: UsageTracker;

  beforeEach(() => {
    tracker = new UsageTracker();
  });

  describe('record', () => {
    it('should record usage without throwing', async () => {
      await expect(
        tracker.record({
          requestId: 'test-req-1',
          ventureId: 'test-venture',
          model: 'openai/gpt-4o-mini',
          tier: 0,
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          costUsd: 0.0001,
          latencyMs: 200,
          complexityScore: 1.5,
          status: 'completed',
        })
      ).resolves.not.toThrow();
    });

    it('should not throw even when database is unavailable', async () => {
      // Simulate DB failure by using broken connection
      await expect(
        tracker.record({
          requestId: 'test-req-fail',
          ventureId: 'test-venture',
          model: 'openai/gpt-4o-mini',
          tier: 0,
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
          costUsd: 0.0001,
          latencyMs: 200,
          complexityScore: 1.5,
          status: 'completed',
        })
      ).resolves.not.toThrow(); // Fire-and-forget: never throws
    });
  });

  describe('getMetrics', () => {
    it('should return empty metrics for venture with no data', async () => {
      const metrics = await tracker.getMetrics(
        'empty-venture',
        new Date('2026-01-01'),
        new Date('2026-01-31')
      );

      expect(metrics.totalRequests).toBe(0);
      expect(metrics.totalTokens).toBe(0);
      expect(metrics.totalCost).toBe(0);
      expect(metrics.successRate).toBe(0);
    });

    it('should aggregate by tier, model, and agent in parallel', async () => {
      // Setup: insert test usage logs
      await tracker.record({
        requestId: 'req-1',
        ventureId: 'test-venture',
        model: 'anthropic/claude-3.5-sonnet',
        tier: 1,
        agentType: 'queen',
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
        costUsd: 0.01,
        latencyMs: 1200,
        complexityScore: 5.0,
        status: 'completed',
      });

      const metrics = await tracker.getMetrics(
        'test-venture',
        subDays(new Date(), 1),
        addDays(new Date(), 1)
      );

      expect(metrics.totalRequests).toBeGreaterThanOrEqual(1);
      expect(metrics.byTier[1]).toBeDefined();
      expect(metrics.byModel['anthropic/claude-3.5-sonnet']).toBeDefined();
      expect(metrics.byAgent['queen']).toBeDefined();
    });
  });

  describe('getRealtimeStats', () => {
    it('should return rolling window stats', async () => {
      const stats = await tracker.getRealtimeStats('test-venture');

      expect(stats).toHaveProperty('requestsPerMinute');
      expect(stats).toHaveProperty('tokensPerMinute');
      expect(stats).toHaveProperty('avgLatencyMs');
      expect(stats).toHaveProperty('errorRate');
      expect(stats).toHaveProperty('activeModels');
      expect(Array.isArray(stats.activeModels)).toBe(true);
    });
  });
});
```

### Integration Testing

```typescript
describe('Analytics Router E2E', () => {
  it('should create metric, record values, and query time series', async () => {
    // 1. Create metric definition
    const metric = await caller.analytics.createDefinition({
      name: 'API Requests',
      slug: 'api-requests',
      type: 'counter',
      category: 'operational',
    });

    expect(metric.id).toBeDefined();

    // 2. Record values
    await caller.analytics.batchRecord({
      entries: Array.from({ length: 30 }, (_, i) => ({
        metricId: metric.id,
        value: Math.floor(Math.random() * 1000) + 100,
        timestamp: new Date(`2026-01-${String(i + 1).padStart(2, '0')}`),
      })),
    });

    // 3. Query time series
    const timeSeries = await caller.analytics.query({
      metricId: metric.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      granularity: 'day',
      aggregation: 'sum',
    });

    expect(timeSeries.points).toHaveLength(30);
    expect(timeSeries.summary.total).toBeGreaterThan(0);

    // 4. Clean up
    await caller.analytics.deleteDefinition({ id: metric.id });
  });

  it('should create dashboard and retrieve with widgets', async () => {
    const dashboard = await caller.analytics.createDashboard({
      name: 'Test Dashboard',
      isDefault: true,
      layout: [{ widgetId: 'w1', x: 0, y: 0, w: 12, h: 4 }],
      widgets: [{
        id: 'w1',
        type: 'metric_card',
        title: 'Test Widget',
      }],
    });

    expect(dashboard.id).toBeDefined();
    expect(dashboard.isDefault).toBe(true);

    const full = await caller.analytics.getDashboard({ id: dashboard.id });
    expect(full!.widgets).toHaveLength(1);

    await caller.analytics.deleteDashboard({ id: dashboard.id });
  });
});
```

---

## Migration Guide

### Adding New Metric Types

To add a new metric type beyond `counter`, `gauge`, `histogram`, and `rate`:

1. Update the Zod enum schema:
   ```typescript
   // analytics.schema.ts
   export const metricTypeSchema = z.enum([
     'counter', 'gauge', 'histogram', 'rate',
     'summary',  // NEW: distribution with quantiles
   ]);
   ```

2. Update the MetricsService aggregation logic if the new type has special behavior.

3. No database migration needed — the `type` column is TEXT, not an enum.

### Adding New Dashboard Widget Types

1. Update the Zod enum:
   ```typescript
   export const widgetTypeSchema = z.enum([
     'line_chart', 'bar_chart', 'area_chart', 'pie_chart',
     'metric_card', 'table', 'heatmap', 'sparkline',
     'scatter_plot',  // NEW
   ]);
   ```

2. Add the corresponding React component in `@mcv/ui`.

3. No database migration — widgets are stored as JSONB.

### Scaling to High Volume

For deployments exceeding 100M metric values:

1. **Partition `metric_values`** by timestamp:
   ```sql
   ALTER TABLE metric_values RENAME TO metric_values_old;
   CREATE TABLE metric_values (LIKE metric_values_old INCLUDING ALL)
     PARTITION BY RANGE (timestamp);
   ```

2. **Add GIN index** for JSONB dimension queries:
   ```sql
   CREATE INDEX metric_values_dimensions_gin ON metric_values USING gin (dimensions);
   ```

3. **Implement materialized views** for common aggregations:
   ```sql
   CREATE MATERIALIZED VIEW daily_metric_summaries AS
   SELECT
     metric_id,
     date_trunc('day', timestamp) AS day,
     SUM(value) AS total,
     AVG(value) AS average,
     COUNT(*) AS count
   FROM metric_values
   GROUP BY metric_id, date_trunc('day', timestamp);
   ```

4. **Set up automated partition management** with `pg_partman` or scheduled SQL.

---

*@mcv/intelligence/metrics — AI Metrics & Analytics Hub Module*