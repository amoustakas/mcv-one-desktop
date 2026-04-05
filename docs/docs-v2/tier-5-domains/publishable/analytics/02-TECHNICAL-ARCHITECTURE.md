# @mcv/analytics — Technical Architecture
## Tier 5: PUBLISHABLE Domains

**Package:** `@mcv/analytics`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
   - [cohorts — User Cohort Analysis & Retention Tracking](#submodule-cohorts)
   - [dashboards — Configurable Analytics Dashboards with Widgets](#submodule-dashboards)
   - [funnels — Conversion Funnel Definition & Analysis](#submodule-funnels)
   - [insights — AI-Powered Automatic Insights & Anomaly Detection](#submodule-insights)
   - [metrics — Metric Definitions, Calculations & Time-Series Storage](#submodule-metrics)
   - [reports — Scheduled & Ad-Hoc Report Generation](#submodule-reports)
4. [Data Models (Drizzle ORM)](#data-models)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance](#performance)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Observability](#observability)
11. [Security](#security)

---

## Architecture Overview

`@mcv/analytics` is the centralized business intelligence and analytics platform for the MCV.ONE ecosystem. It provides a complete data-to-decision pipeline that ingests events from every venture, computes and stores metrics at multiple granularity levels, and surfaces actionable intelligence through dashboards, funnel analysis, cohort tracking, AI-driven insights, and automated reporting.

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Multi-Tenant by Default** | Every table, service, and query is scoped by `ventureId`. There is no pathway to access cross-venture data unless explicitly aggregated by a superadmin service. |
| **Event-Driven Ingestion** | Raw events from `@mcv/events` (backed by Redpanda/Kafka) are the primary data source. Analytics listens, transforms, and records. |
| **Pre-Aggregation at Write Time** | Metric values are simultaneously written to multiple granularity buckets (minute through year) so reads never need to scan raw data. |
| **AI-Augmented Intelligence** | The insights engine leverages `@mcv/ai` (OpenRouter) for anomaly detection, trend analysis, correlation discovery, and automated recommendations. |
| **Cache-First Reads** | Redis caches time-series query results, dashboard widget data, and real-time metric streams to minimize database load. |
| **Composable Visualization** | Dashboards compose from independent widgets, each with its own data source, chart type, and cache policy, assembled on a 12-column responsive grid. |
| **Scheduled Automation** | Cron-driven processes handle cohort recomputation, insight generation, alert evaluation, report delivery, and data retention cleanup. |
| **Format-Agnostic Reporting** | Reports render to PDF (Puppeteer), Excel (ExcelJS), CSV, HTML, and JSON — each format produced by a pluggable renderer. |

### Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| **Runtime** | Next.js 15 (App Router) | Server components, API routes, SSR |
| **Build** | Turborepo | Monorepo orchestration, cached builds |
| **Database** | PostgreSQL via Supabase | Primary data store with RLS |
| **ORM** | Drizzle ORM | Type-safe schema, queries, migrations |
| **Validation** | Zod | Runtime input/output schema validation |
| **Cache** | Redis (ioredis) | Metric caching, pub/sub streaming, rate limiting |
| **Events** | Redpanda / Kafka | Event bus for cross-domain data ingestion |
| **AI** | OpenRouter (via `@mcv/ai`) | Insight generation, anomaly classification, NL summaries |
| **PDF** | Puppeteer / Playwright | Headless Chrome for PDF report rendering |
| **Excel** | ExcelJS | `.xlsx` report generation with charts |
| **API** | tRPC | Type-safe procedure calls, batching, subscriptions |
| **Math** | decimal.js | Precise currency/percentage calculations |
| **Dates** | date-fns | Period calculations, timezone handling, bucket alignment |

### Architectural Layers

The analytics domain is organized into five horizontal layers, each with clear responsibilities:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VISUALIZATION & DELIVERY LAYER                       │
│                                                                             │
│  Dashboards (12-col grid, 11 chart types, real-time refresh, sharing)       │
│  Reports (PDF/Excel/CSV/HTML/JSON, scheduled delivery, email/Slack)         │
│  Alerts (email, Slack, PagerDuty, webhook, cooldown, snooze)                │
│  React Components (MetricCard, DashboardGrid, FunnelChart, InsightsFeed...) │
├─────────────────────────────────────────────────────────────────────────────┤
│                        INTELLIGENCE LAYER                                   │
│                                                                             │
│  Anomaly Detection (Z-score, Isolation Forest, Prophet, LSTM)               │
│  Trend Analysis (OLS linear regression, R² confidence, projections)         │
│  Correlation Discovery (Pearson r, lag support 0/1/3/7 days)                │
│  AI Insights Engine (@mcv/ai integration, recommendations, impact est.)     │
├─────────────────────────────────────────────────────────────────────────────┤
│                        QUERY & ANALYSIS LAYER                               │
│                                                                             │
│  Time-Series Queries (granularity bucketing, dimension filtering)            │
│  Aggregation Engine (sum/avg/min/max/count/percentiles/SMA/EMA)             │
│  Period Comparison (absolute + percentage change, 2-10 periods)             │
│  Funnel Analysis (step conversion, drop-off, segments, A/B variants)        │
│  Cohort Retention (retention matrix, LTV calculation, churn prediction)     │
├─────────────────────────────────────────────────────────────────────────────┤
│                        STORAGE & AGGREGATION LAYER                          │
│                                                                             │
│  PostgreSQL (Drizzle ORM) — 20+ tables across 6 submodules                  │
│  Multi-Granularity Pre-Aggregation (minute → year, upsert on write)         │
│  Redis Cache (metric values, dashboard widgets, real-time pub/sub)           │
│  Table Partitioning (metric_values partitioned by month)                    │
│  Materialized Views (daily totals, weekly rollups)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                        DATA COLLECTION LAYER                                │
│                                                                             │
│  recordValue() — single metric value recording                              │
│  batchRecord() — bulk insert up to 1,000 values per call                    │
│  trackProgress() — funnel step event tracking                               │
│  Event Bus Listeners — automatic metric updates from domain events          │
│  Cron Jobs — scheduled cohort computation, insight analysis, cleanup        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## System Diagram

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         EXTERNAL DATA SOURCES                               ║
║                                                                             ║
║  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       ║
║  │ @mcv/events  │  │@mcv/commerce│  │ @mcv/growth  │  │ @mcv/people  │       ║
║  │ (Redpanda)   │  │ Transactions│  │ Campaigns    │  │ User Actions │       ║
║  └──────┬───────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       ║
║         │                 │                 │                 │              ║
║         └────────────┬────┴─────────────────┴────────┬───────┘              ║
║                      │    Event Bus (Redpanda)       │                      ║
║                      ▼                               ▼                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║   ┌─── DATA COLLECTION LAYER ──────────────────────────────────────────┐    ║
║   │                                                                     │    ║
║   │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐           │    ║
║   │  │ recordValue() │  │ batchRecord()│  │trackProgress() │           │    ║
║   │  │ Single metric │  │ ≤1000/call   │  │ Funnel events  │           │    ║
║   │  └──────┬────────┘  └──────┬───────┘  └───────┬────────┘           │    ║
║   │         │                  │                   │                    │    ║
║   │         ▼                  ▼                   ▼                    │    ║
║   │  ┌─────────────────────────────────────────────────────────┐       │    ║
║   │  │  Multi-Granularity Pre-Aggregation Engine               │       │    ║
║   │  │  (minute | hour | day | week | month | quarter | year)  │       │    ║
║   │  └──────────────────────────┬──────────────────────────────┘       │    ║
║   └─────────────────────────────┼──────────────────────────────────────┘    ║
║                                 │                                           ║
║   ┌─── STORAGE LAYER ──────────┼──────────────────────────────────────┐    ║
║   │                             ▼                                      │    ║
║   │  ┌─────────────────────────────────────────────────────────┐      │    ║
║   │  │              PostgreSQL (Drizzle ORM + RLS)              │      │    ║
║   │  │                                                          │      │    ║
║   │  │  ┌────────────────┐  ┌────────────────┐                 │      │    ║
║   │  │  │metric_          │  │metric_values    │  (partitioned  │      │    ║
║   │  │  │definitions      │  │(time-series)    │   by month)    │      │    ║
║   │  │  └────────────────┘  └────────────────┘                 │      │    ║
║   │  │  ┌────────────────┐  ┌────────────────┐                 │      │    ║
║   │  │  │analytics_       │  │analytics_       │                │      │    ║
║   │  │  │dashboards       │  │dashboard_widgets│                │      │    ║
║   │  │  └────────────────┘  └────────────────┘                 │      │    ║
║   │  │  ┌────────────────┐  ┌────────────────┐                 │      │    ║
║   │  │  │analytics_       │  │analytics_funnel_│                │      │    ║
║   │  │  │funnels          │  │conversions      │                │      │    ║
║   │  │  └────────────────┘  └────────────────┘                 │      │    ║
║   │  │  ┌────────────────┐  ┌────────────────┐                 │      │    ║
║   │  │  │analytics_cohort_│  │analytics_cohort_│                │      │    ║
║   │  │  │definitions      │  │retention        │                │      │    ║
║   │  │  └────────────────┘  └────────────────┘                 │      │    ║
║   │  │  ┌────────────────┐  ┌────────────────┐                 │      │    ║
║   │  │  │analytics_       │  │analytics_report_│                │      │    ║
║   │  │  │insights         │  │templates        │                │      │    ║
║   │  │  └────────────────┘  └────────────────┘                 │      │    ║
║   │  └─────────────────────────────────────────────────────────┘      │    ║
║   │                                                                    │    ║
║   │  ┌─────────────────────────────────────────────────────────┐      │    ║
║   │  │              Redis Cache Layer                           │      │    ║
║   │  │                                                          │      │    ║
║   │  │  • Metric value caching (TTL per metric, default 5m)    │      │    ║
║   │  │  • Real-time metric streaming (pub/sub channels)        │      │    ║
║   │  │  • Dashboard widget data cache (TTL 60s)                │      │    ║
║   │  │  • Rate limiting counters (sliding window)              │      │    ║
║   │  │  • Insight deduplication (cooldown tracking)            │      │    ║
║   │  └─────────────────────────────────────────────────────────┘      │    ║
║   └────────────────────────────────────────────────────────────────────┘    ║
║                                 │                                           ║
║   ┌─── QUERY & ANALYSIS LAYER ─┼──────────────────────────────────────┐    ║
║   │                             ▼                                      │    ║
║   │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐           │    ║
║   │  │ Time Series  │  │ Aggregation  │  │  Period         │           │    ║
║   │  │ query()      │  │ aggregate()  │  │  compare()      │           │    ║
║   │  │              │  │              │  │                  │           │    ║
║   │  │ Granularity  │  │ sum/avg/min  │  │ Absolute &      │           │    ║
║   │  │  bucketing   │  │  max/count/  │  │  % change       │           │    ║
║   │  │ Dimension    │  │  percentiles │  │ 2-10 periods    │           │    ║
║   │  │  filtering   │  │  SMA / EMA   │  │                  │           │    ║
║   │  └─────────────┘  └──────────────┘  └────────────────┘           │    ║
║   │                                                                    │    ║
║   │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐           │    ║
║   │  │ Funnel       │  │ Cohort       │  │ Correlation     │           │    ║
║   │  │ analyze()    │  │ retention()  │  │ findCorr()      │           │    ║
║   │  │              │  │              │  │                  │           │    ║
║   │  │ Step conv.   │  │ Retention    │  │ Pearson r       │           │    ║
║   │  │ Drop-off     │  │  matrix      │  │ Lagged corr     │           │    ║
║   │  │ Segments     │  │ LTV calc     │  │ Multi-metric    │           │    ║
║   │  └─────────────┘  └──────────────┘  └────────────────┘           │    ║
║   └────────────────────────────────────────────────────────────────────┘    ║
║                                 │                                           ║
║   ┌─── INTELLIGENCE LAYER ─────┼──────────────────────────────────────┐    ║
║   │                             ▼                                      │    ║
║   │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐           │    ║
║   │  │ Anomaly      │  │ Trend        │  │ AI Insights     │           │    ║
║   │  │ Detection    │  │ Analysis     │  │ Engine          │           │    ║
║   │  │              │  │              │  │                  │           │    ║
║   │  │ Z-score      │  │ Linear reg   │  │ @mcv/ai         │           │    ║
║   │  │ Isolation    │  │ R² conf.     │  │  integration    │           │    ║
║   │  │  forest      │  │ Projections  │  │ Auto-recs       │           │    ║
║   │  │ Prophet      │  │ Seasonality  │  │ Impact est.     │           │    ║
║   │  └─────────────┘  └──────────────┘  └────────────────┘           │    ║
║   └────────────────────────────────────────────────────────────────────┘    ║
║                                 │                                           ║
║   ┌─── VISUALIZATION & DELIVERY┼──────────────────────────────────────┐    ║
║   │                             ▼                                      │    ║
║   │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐           │    ║
║   │  │ Dashboards   │  │ Reports      │  │ Alerts          │           │    ║
║   │  │              │  │              │  │                  │           │    ║
║   │  │ 12-col grid  │  │ PDF/Excel/   │  │ Email / Slack   │           │    ║
║   │  │ 11 chart     │  │  CSV/HTML/   │  │ PagerDuty       │           │    ║
║   │  │  types       │  │  JSON        │  │ Webhook          │           │    ║
║   │  │ Real-time    │  │ Scheduled    │  │ Cooldown/Snooze  │           │    ║
║   │  │  refresh     │  │ Email/Slack  │  │                  │           │    ║
║   │  │ Sharing      │  │  delivery    │  │                  │           │    ║
║   │  └─────────────┘  └──────────────┘  └────────────────┘           │    ║
║   └────────────────────────────────────────────────────────────────────┘    ║
║                                                                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                         EXTERNAL DEPENDENCIES                               ║
║                                                                             ║
║  @mcv/kernel │ @mcv/events │ @mcv/storage │ @mcv/ai │ @mcv/comms │ @mcv/db ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Request Lifecycle

A typical analytics request flows through the following stages:

```
Client Request
    │
    ▼
┌──────────────┐
│  tRPC Router  │  ← Input validation (Zod schemas)
│  (analytics)  │  ← Authentication check (Supabase session)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Service      │  ← Venture-scoped constructor: new MetricsService(ventureId)
│  Layer        │  ← Business logic, authorization checks
└──────┬───────┘
       │
       ├──── Cache Hit? ──▶ Redis ──▶ Return cached result
       │
       ▼
┌──────────────┐
│  Drizzle ORM  │  ← Type-safe queries with venture_id filter
│  (PostgreSQL)  │  ← Connection pooling via PgPool
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Post-Process │  ← Aggregation, bucketing, dimension filtering
│  & Cache      │  ← Write result to Redis with configured TTL
└──────┬───────┘
       │
       ▼
  Response to Client
```

---

## Module Architecture

The `@mcv/analytics` package is composed of six submodules, each encapsulating a distinct analytical capability. All submodules share common infrastructure: venture-scoped database access, Zod validation, Redis caching, and event bus integration.

### Directory Structure

```
packages/analytics/
├── src/
│   ├── server/
│   │   ├── services/
│   │   │   ├── metrics-service.ts        # MetricsService — metric CRUD, recording, querying
│   │   │   ├── dashboard-service.ts      # DashboardService — dashboard + widget management
│   │   │   ├── funnel-service.ts         # FunnelService — funnel tracking + analysis
│   │   │   ├── cohort-service.ts         # CohortService — cohort computation + retention
│   │   │   ├── insights-service.ts       # InsightsService — anomaly + trend + correlation
│   │   │   └── report-service.ts         # ReportService — template + schedule + generation
│   │   ├── routers/
│   │   │   └── analytics.router.ts       # tRPC router combining all submodule procedures
│   │   ├── cron/
│   │   │   ├── insight-analysis.ts       # Every 6h: batch anomaly + trend detection
│   │   │   ├── cohort-compute.ts         # Daily 2AM: recompute all active cohort definitions
│   │   │   ├── retention-cleanup.ts      # Monthly: purge expired metric values + reports
│   │   │   └── report-scheduler.ts       # Every minute: check + execute due report schedules
│   │   └── lib/
│   │       ├── aggregation.ts            # Aggregation engine (sum/avg/min/max/percentiles/SMA/EMA)
│   │       ├── bucketing.ts              # Time-series granularity bucketing (minute → year)
│   │       ├── anomaly.ts                # Z-score + ML anomaly detection algorithms
│   │       ├── regression.ts             # OLS linear regression + R² + projections
│   │       ├── correlation.ts            # Pearson r with lag support
│   │       ├── churn-model.ts            # Churn risk scoring model
│   │       └── formatters/
│   │           ├── pdf-renderer.ts       # Puppeteer-based PDF generation
│   │           ├── excel-renderer.ts     # ExcelJS-based .xlsx generation
│   │           ├── csv-renderer.ts       # CSV rendering with proper escaping
│   │           ├── html-renderer.ts      # HTML template rendering
│   │           └── json-renderer.ts      # Structured JSON output
│   ├── client/
│   │   ├── hooks/
│   │   │   ├── use-metric-query.ts       # React Query hook for metric time-series
│   │   │   ├── use-metric-stream.ts      # Real-time metric subscription hook
│   │   │   ├── use-dashboard.ts          # Dashboard data fetching + caching
│   │   │   ├── use-dashboard-builder.ts  # Dashboard editing state management
│   │   │   ├── use-funnel-analysis.ts    # Funnel analysis data hook
│   │   │   ├── use-retention-matrix.ts   # Cohort retention data hook
│   │   │   ├── use-insights-feed.ts      # Paginated insight feed hook
│   │   │   └── use-report-generator.ts   # Report generation + download hook
│   │   └── components/
│   │       ├── metric-card.tsx           # Single KPI display with comparison
│   │       ├── metric-sparkline.tsx      # Inline sparkline chart
│   │       ├── dashboard-grid.tsx        # 12-column responsive grid layout
│   │       ├── dashboard-builder.tsx     # Drag-and-drop dashboard editor
│   │       ├── widget-renderer.tsx       # Dynamic widget type renderer
│   │       ├── chart-widget.tsx          # Multi-series chart (11 types)
│   │       ├── funnel-chart.tsx          # Funnel visualization
│   │       ├── retention-heatmap.tsx     # Cohort retention heatmap
│   │       ├── cohort-table.tsx          # Tabular cohort data
│   │       ├── insight-card.tsx          # Individual insight display
│   │       ├── insights-feed.tsx         # Paginated insight list
│   │       └── report-viewer.tsx         # Report preview + download
│   ├── constants.ts                      # Enums, defaults, limits
│   ├── types.ts                          # All TypeScript type definitions
│   └── index.ts                          # Package entry point (barrel exports)
├── drizzle/
│   └── migrations/                       # Drizzle migration files
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

<a id="submodule-cohorts"></a>
### Submodule: cohorts — User Cohort Analysis & Retention Tracking

#### Purpose

The cohorts submodule groups users into time-bounded segments based on acquisition date, behavioral patterns, revenue thresholds, or custom criteria. It computes retention matrices that show what percentage of each cohort returns over successive periods, calculates lifetime value (LTV) at multiple horizons, and provides ML-powered churn risk scoring.

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       CohortService                              │
│                                                                  │
│  createDefinition()  ─────▶  Store cohort criteria in            │
│                               analytics_cohort_definitions       │
│                               + trigger initial computeCohorts() │
│                                                                  │
│  computeCohorts()    ─────▶  1. Identify users matching criteria │
│                               2. Group by period (day/week/month)│
│                               3. Populate analytics_cohorts      │
│                               4. Populate analytics_cohort_      │
│                                  members                         │
│                               5. For each cohort × period:       │
│                                  compute retained users          │
│                               6. Write analytics_cohort_         │
│                                  retention rows                  │
│                                                                  │
│  getRetentionMatrix() ───▶  Read cohort_retention rows,         │
│                              assemble heatmap-ready matrix       │
│                                                                  │
│  calculateLTV()      ─────▶  Sum revenue per cohort at          │
│                               30/60/90/180/365 day horizons      │
│                                                                  │
│  compareCohorts()    ─────▶  Side-by-side retention + LTV       │
│                               comparison across definitions      │
│                                                                  │
│  predictChurnRisk()  ─────▶  Score 0-100 per active member      │
│                               using weighted risk factors:       │
│                               inactive >30d (+40), 14-30d (+20) │
│                               no purchases (+30), single (+15)  │
│                               not power user (+10)               │
└─────────────────────────────────────────────────────────────────┘
```

#### Cohort Types

| Type | Grouping Criteria | Example |
|------|------------------|---------|
| `acquisition` | Users grouped by signup date | "Jan 2026 signups" |
| `behavioral` | Users grouped by action patterns within a time window | "Users who purchased within 7 days" |
| `revenue` | Users grouped by spending behavior | "Users with LTV > $100" |
| `custom` | Arbitrary event-based criteria | "Users from organic + mobile" |

#### Cohort Period Options

| Period | Bucket Width | Typical Use Case |
|--------|-------------|-----------------|
| `day` | 1 day | Short-term activation tracking |
| `week` | 7 days | Weekly product engagement |
| `month` | Calendar month | Standard retention analysis |
| `quarter` | 3 months | Investor reporting |
| `year` | 12 months | Long-term LTV analysis |

#### Retention Matrix Output

The `getRetentionMatrix()` method returns data structured for heatmap visualization:

```typescript
interface RetentionMatrix {
  cohorts: Array<{
    label: string;           // "Jan 2026"
    startDate: Date;
    size: number;            // Users in cohort
    retention: number[];     // [100, 85, 72, 65, ...] — % retained at each period
    revenue: number[];       // Revenue at each period offset
  }>;
  periods: string[];          // ["Month 0", "Month 1", "Month 2", ...]
  averageRetention: number[]; // Average retention across all cohorts per period
}
```

#### Churn Risk Model

The `predictChurnRisk()` method calculates a composite 0–100 risk score for each active cohort member by evaluating weighted risk factors:

| Risk Factor | Score Impact | Threshold |
|-------------|-------------|-----------|
| Inactive > 30 days | +40 | High risk |
| Inactive 14–30 days | +20 | Medium risk |
| No purchases | +30 | Revenue risk |
| Single purchase only | +15 | Low engagement |
| Not a power user (below median activity) | +10 | Engagement risk |

Members with a composite score above 60 are classified as **high risk** and flagged for re-engagement campaigns via `@mcv/growth`.

#### Cron Integration

| Schedule | Job | Description |
|----------|-----|-------------|
| Daily 2:00 AM | `cohort-compute` | Recompute all active cohort definitions |
| Monthly 1st at 3:00 AM | `retention-cleanup` | Purge expired cohort member records |

#### Tables

- `analytics_cohort_definitions` — Criteria, retention event, revenue event, period configuration
- `analytics_cohorts` — Computed cohort instances with aggregate stats (user count, revenue, LTV horizons, churn rate)
- `analytics_cohort_retention` — Per-period retention data (retained count, rate, revenue, ARPU)
- `analytics_cohort_members` — Individual user membership with activity and revenue tracking

---

<a id="submodule-dashboards"></a>
### Submodule: dashboards — Configurable Analytics Dashboards with Widgets

#### Purpose

The dashboards submodule provides an interactive, configurable dashboard builder with a 12-column responsive grid layout system, drag-and-drop widget positioning, 11 chart types, configurable data sources, sharing and permissions, scheduled snapshots, and annotation overlays. Dashboards support real-time data refresh, multiple visibility levels, and password-protected public links.

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DashboardService                              │
│                                                                      │
│  create()          ───▶  New dashboard + default grid config         │
│  getWithData()     ───▶  Fetch dashboard + resolve all widget data   │
│                           (parallel via Promise.all)                  │
│  addWidget()       ───▶  Insert widget with position + dataSource    │
│  updatePositions() ───▶  Batch drag-and-drop position update         │
│  duplicate()       ───▶  Deep-clone dashboard + widgets (txn)        │
│  share()           ───▶  Set visibility, generate public slug        │
│  createSnapshot()  ───▶  Capture full point-in-time data snapshot    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
               ┌──────────────────────────────────────┐
               │        Widget Data Resolution         │
               │                                       │
               │  For each widget in dashboard:        │
               │   1. Resolve date range               │
               │      (relative → absolute dates)      │
               │   2. Select auto-granularity           │
               │      based on range width              │
               │   3. Check Redis cache                 │
               │   4. Query MetricsService if miss      │
               │   5. Cache result with TTL             │
               │   6. Return widget + data              │
               └──────────────────────────────────────┘
```

#### Widget Types

| Type | Description | Configuration |
|------|-------------|--------------|
| `metric` | Single KPI value with sparkline and comparison | `metricId`, `comparison: 'previous_period'` |
| `chart` | Multi-series visualization (11 chart types) | `metricId`, `chartType`, `series[]` |
| `table` | Tabular data with sorting, filtering, pagination | `metricIds[]`, `columns[]`, `sortBy` |
| `funnel` | Embedded funnel visualization | `funnelId`, `dateRange` |
| `cohort` | Retention heatmap | `cohortDefinitionId`, `periods` |
| `map` | Geographic distribution map | `metricId`, `dimension: 'country'` |
| `leaderboard` | Ranked list with horizontal bars | `metricId`, `dimension`, `limit` |
| `text` | Rich text annotation | `content` (markdown) |
| `image` | Static image embed | `url`, `alt` |
| `iframe` | External content embed | `src`, `sandbox` |
| `countdown` | Timer to target date | `targetDate`, `label` |

#### Chart Types

```
line │ bar │ area │ pie │ donut │ scatter │ heatmap │ treemap │ sankey │ radar │ gauge
```

#### Grid System

The dashboard uses a **12-column responsive grid** with configurable row height:

```typescript
interface WidgetPosition {
  x: number;      // Column start (0-11)
  y: number;      // Row start
  w: number;      // Width in columns (1-12)
  h: number;      // Height in row units
  minW?: number;  // Minimum width
  minH?: number;  // Minimum height
  maxW?: number;  // Maximum width
  maxH?: number;  // Maximum height
}

interface DashboardLayout {
  columns: 12;               // Fixed 12-column grid
  rowHeight: 50;             // Pixels per row unit
  breakpoints: {
    lg: 1200,                // Desktop
    md: 996,                 // Tablet landscape
    sm: 768,                 // Tablet portrait
    xs: 480,                 // Mobile
  };
}
```

#### Visibility & Sharing Model

| Level | Access Rule | Implementation |
|-------|-----------|----------------|
| `private` | `ownerId === userId` | Default for all new dashboards |
| `team` | User is member of `teamId` | Requires `@mcv/identity` team lookup |
| `venture` | User is member of `ventureId` | Standard venture membership check |
| `public` | Anyone with link | Optional `password` (bcrypt hashed) |

Additional sharing granularity via `sharedWith`:
```typescript
interface SharedWith {
  users: string[];    // User IDs with view access
  teams: string[];    // Team IDs with view access
  editors: string[];  // User IDs with edit access
}
```

#### Auto-Granularity Selection

Based on the date range width, the system automatically selects the optimal time-series granularity:

| Range Width | Auto Granularity |
|-------------|-----------------|
| ≤ 1 day | `hour` |
| ≤ 7 days | `hour` |
| ≤ 90 days | `day` |
| ≤ 365 days | `week` |
| > 365 days | `month` |

#### Dashboard Snapshots

Snapshots capture the complete state of a dashboard at a point in time, including all widget data. They can be:

- **Manual** — Triggered by a user for archival
- **Scheduled** — Captured on a recurring schedule (daily, weekly, monthly)
- **Delivered** — Sent via email or Slack as PDF/image attachments

#### Tables

- `analytics_dashboards` — Dashboard metadata, layout, visibility, sharing, theme, filters
- `analytics_dashboard_widgets` — Widget type, position, data source, chart options, filters, drilldown config
- `analytics_dashboard_snapshots` — Point-in-time data captures with delivery configuration
- `analytics_dashboard_annotations` — Timeline annotations overlaid on chart widgets

---

<a id="submodule-funnels"></a>
### Submodule: funnels — Conversion Funnel Definition & Analysis

#### Purpose

The funnels submodule tracks user progression through ordered (or unordered) conversion steps, measures step-by-step conversion rates, identifies bottlenecks and drop-off points, supports A/B test variant tracking, and provides AI-powered drop-off reason analysis. Funnels answer the critical question: *"Where and why are users failing to convert?"*

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FunnelService                                │
│                                                                      │
│  create()            ───▶  Define funnel + ordered steps (txn)       │
│                                                                      │
│  trackProgress()     ───▶  1. Match event to funnel step             │
│                             2. Find/create conversion record          │
│                             3. Verify step ordering (if ordered)      │
│                             4. Check time constraints                 │
│                             5. Update completedSteps[]                │
│                             6. Increment step-level counters          │
│                             7. Mark converted if final step           │
│                                                                      │
│  analyze()           ───▶  1. Aggregate step-level stats             │
│                             2. Calculate conversion & drop-off rates  │
│                             3. Identify bottleneck step               │
│                             4. Compute daily trend data               │
│                             5. Segment by source/device/country       │
│                             6. Break down by A/B variant              │
│                                                                      │
│  getDropoffAnalysis()───▶  1. Pattern analysis at each step          │
│                             2. AI-powered reason categorization       │
│                                (UX, technical, pricing, etc.)         │
│                             3. Confidence scores per reason           │
│                             4. Actionable recommendations             │
└─────────────────────────────────────────────────────────────────────┘
```

#### Completion Types

| Type | Behavior | Use Case |
|------|----------|----------|
| `ordered` | Steps must be completed in strict sequence | Traditional sales/checkout funnel |
| `any` | Steps can be completed in any order | Feature adoption tracking |
| `all` | All steps must be completed regardless of order | Onboarding checklist |

#### Conversion Window

Each funnel has a configurable `conversionWindow` (default: 168 hours / 7 days) that defines the maximum allowed time between a user entering the funnel (first step) and reaching the final step. Conversions exceeding this window are marked as abandoned.

#### A/B Testing Support

Each funnel step supports variant definitions:

```typescript
interface FunnelStepVariant {
  id: string;           // "variant_a", "variant_b"
  name: string;         // "Original Checkout", "Simplified Checkout"
  filters: Record<string, any>;  // Event property filters for this variant
}
```

The `analyze()` method returns per-variant breakdowns at each step, enabling statistical comparison of conversion rates between variants.

#### Attribution Models

| Model | Description | Best For |
|-------|-------------|----------|
| `first_touch` | Credit goes to the first interaction source | Top-of-funnel campaigns |
| `last_touch` | Credit goes to the last interaction before conversion | Closing channels |
| `linear` | Credit distributed equally across all touchpoints | Balanced analysis |
| `time_decay` | More credit to touchpoints closer to conversion | Recency-focused |

#### Analysis Output

```typescript
interface FunnelAnalysis {
  funnel: Funnel;
  steps: Array<{
    step: FunnelStep;
    entered: number;
    completed: number;
    conversionRate: number;      // % of previous step's users
    dropOffRate: number;         // 100 - conversionRate
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
```

#### Tables

- `analytics_funnels` — Funnel metadata, completion type, conversion window, cached aggregate stats
- `analytics_funnel_steps` — Ordered steps with event type, filters, time constraints, variant config
- `analytics_funnel_conversions` — Individual user conversion records with step timestamps, attribution
- `analytics_funnel_dropoff_reasons` — AI-detected and manual drop-off reason catalog

---

<a id="submodule-insights"></a>
### Submodule: insights — AI-Powered Automatic Insights & Anomaly Detection

#### Purpose

The insights submodule automatically detects anomalies in metric data, analyzes directional trends, discovers correlations between metrics, generates forecasting projections, and delivers actionable recommendations through a prioritized feed with full lifecycle management. It integrates with `@mcv/ai` (OpenRouter) for natural language summaries and `@mcv/comms` for alert delivery.

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          InsightsService                                 │
│                                                                          │
│  ┌──────────────── Scheduled Analysis (Cron: every 6h) ──────────────┐  │
│  │                                                                    │  │
│  │  For each active metric:                                           │  │
│  │   1. detectAnomalies()  ───▶  Z-score deviation analysis           │  │
│  │                               • Fetch last 90 days of data         │  │
│  │                               • Calculate rolling mean + stddev    │  │
│  │                               • Compare latest value to expected   │  │
│  │                               • Classify severity (critical/high/  │  │
│  │                                 medium/low) by Z-score threshold   │  │
│  │                               • Create insight if deviation > 2σ   │  │
│  │                                                                    │  │
│  │   2. analyzeTrends()    ───▶  OLS linear regression                │  │
│  │                               • Compute slope + intercept          │  │
│  │                               • Calculate R² confidence            │  │
│  │                               • Generate 7/14/30 day projections   │  │
│  │                               • Detect seasonality patterns        │  │
│  │                               • Create insight if R² > 0.7         │  │
│  │                                                                    │  │
│  │   3. findCorrelations() ───▶  Pearson correlation                  │  │
│  │                               • Compare against all other metrics  │  │
│  │                               • Test lags: 0, 1, 3, 7 days        │  │
│  │                               • Report if |r| > 0.5               │  │
│  │                               • Classify positive/negative         │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  getInsightsFeed()  ───▶  Priority-sorted, filtered, paginated feed     │
│  updateInsightStatus() ──▶  Lifecycle: new → viewed → ack → resolved    │
│  createInsight()    ───▶  Manual insight creation (for rule-based)       │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Insight Types

| Type | Description | Trigger |
|------|-------------|---------|
| `anomaly` | Metric value significantly deviates from expected | Z-score > 2σ or ML model detection |
| `trend` | Sustained directional change in a metric | Linear regression R² > 0.7 |
| `correlation` | Two metrics are significantly correlated | \|Pearson r\| > 0.5 |
| `prediction` | Projected future values with confidence intervals | Time-series forecasting model |
| `recommendation` | Actionable suggestion based on data patterns | Rule-based + AI analysis |
| `alert` | Threshold breach on a configured metric alert | Alert rule condition met |
| `milestone` | Metric reached a significant level | Target threshold crossed |
| `comparison` | Notable difference between segments or periods | Automated comparison engine |

#### Priority Classification

| Priority | Z-Score Threshold | Business Impact | Notification Channel |
|----------|------------------|-----------------|---------------------|
| `critical` | > 4σ | Revenue drop > 50% | Immediate: PagerDuty + email |
| `high` | > 3σ | Major trend shift | Email + Slack |
| `medium` | > 2.5σ | Moderate pattern | In-app feed |
| `low` | > 2σ | Minor variation | In-app feed only |

#### Insight Lifecycle

```
new  ──▶  viewed  ──▶  acknowledged  ──▶  resolved
                                          │
                                          └──▶  dismissed (with reason + feedback)
```

Each transition records `userId` and `timestamp` for audit. The `wasHelpful` boolean and `feedback` text provide a feedback loop to improve insight quality over time.

#### Anomaly Detection Strategies

| Strategy | Status | Approach | Best For |
|----------|--------|----------|----------|
| **Z-Score** | ✅ Production | Statistical deviation from rolling mean/stddev | Simple, immediate detection |
| **Prophet** | 🔮 Planned | Facebook's time-series decomposition | Seasonal data with trends |
| **Isolation Forest** | 🔮 Planned | Unsupervised ML for multivariate anomalies | Complex multi-metric patterns |
| **LSTM** | 🔮 Planned | Deep learning temporal pattern recognition | Non-linear temporal dependencies |

#### Trend Analysis Engine

Uses Ordinary Least Squares (OLS) linear regression:

```
slope = (n × ΣXY - ΣX × ΣY) / (n × ΣX² - (ΣX)²)
intercept = (ΣY - slope × ΣX) / n
R² = 1 - (SS_residual / SS_total)

Projections at +7d, +14d, +30d with ±1.96σ confidence intervals
```

Trend direction classified as `up`, `down`, or `stable` based on slope significance and R² threshold.

#### Correlation Discovery

Pearson correlation coefficient computed for all metric pairs with lag support:

- **Lag 0** — Simultaneous correlation
- **Lag 1** — 1-day lead/lag relationship
- **Lag 3** — 3-day lead/lag relationship
- **Lag 7** — Weekly lead/lag relationship

Only correlations with |r| > 0.5 are reported. Each correlation is classified as `positive` or `negative`.

#### Tables

- `analytics_insights` — Insight records with type, priority, lifecycle, linked entities, recommendations
- `analytics_insight_rules` — Configurable trigger rules for automated insight generation
- `analytics_anomaly_models` — Persisted ML model state for anomaly detectors (per metric)

---

<a id="submodule-metrics"></a>
### Submodule: metrics — Metric Definitions, Calculations & Time-Series Storage

#### Purpose

The metrics submodule is the foundational data layer for the entire analytics domain. It provides custom KPI definitions with flexible calculation methods, five metric types (counter, gauge, histogram, rate, derived), multi-granularity time-series storage with pre-aggregation at write time, dimensional breakdowns, threshold-based alerting, and real-time streaming via Redis pub/sub.

#### Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          MetricsService                                   │
│                        (venture-scoped)                                   │
│                                                                           │
│  ┌─── Definition Management ──────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │  createDefinition()  → Validate Zod schema, check slug uniqueness  │  │
│  │  updateDefinition()  → Partial update with audit trail              │  │
│  │  deleteDefinition()  → CASCADE delete all metric_values             │  │
│  │  listDefinitions()   → Paginated, filterable by category/type       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─── Value Recording ────────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │  recordValue()   → Single value insert + multi-granularity upsert  │  │
│  │  batchRecord()   → Bulk insert ≤1000 values (validates all IDs)    │  │
│  │                                                                     │  │
│  │  Write Path:                                                        │  │
│  │   1. Validate metricId belongs to this venture                     │  │
│  │   2. Insert raw value into metric_values                           │  │
│  │   3. Upsert pre-aggregated buckets at each granularity level:     │  │
│  │      minute | hour | day | week | month | quarter | year           │  │
│  │   4. Publish to Redis pub/sub channel for real-time subscribers    │  │
│  │   5. Invalidate relevant Redis cache entries                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─── Querying ───────────────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │  query()          → Time-series with granularity bucketing          │  │
│  │  getLatest()      → Most recent value for a metric                  │  │
│  │  compare()        → Multi-period comparison (2-10 periods)          │  │
│  │  aggregate()      → Multi-metric aggregation with group-by          │  │
│  │  getTopMovers()   → Metrics with largest period-over-period changes │  │
│  │                                                                     │  │
│  │  Read Path:                                                         │  │
│  │   1. Check Redis cache (keyed by metricId+range+granularity)       │  │
│  │   2. If miss: query pre-aggregated bucket for requested granularity│  │
│  │   3. Apply dimension filters (JSONB, app-layer filtering)          │  │
│  │   4. Compute summary statistics (min, max, avg, total)             │  │
│  │   5. Cache result in Redis with configured TTL                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌─── Real-Time Streaming ────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │  streamMetrics()  → Subscribe to Redis pub/sub by metric slug       │  │
│  │                     Returns unsubscribe function                    │  │
│  │                     Used for live dashboard widgets                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Metric Types

| Type | Behavior | Example | Default Aggregation |
|------|----------|---------|-------------------|
| `counter` | Monotonically increasing; values summed into buckets | Total signups, page views | `sum` |
| `gauge` | Point-in-time measurement; latest value overwrites | Active users, cart value | Last value |
| `histogram` | Distribution tracking; records min/max/sum/count | Response times, order values | `avg` |
| `rate` | Calculated ratio over time windows | Conversion rate, churn rate | `avg` |
| `derived` | Formula computed from other metrics | ARPU = revenue / users | Depends on formula |

#### Aggregation Methods

| Method | SQL Equivalent | Description |
|--------|---------------|-------------|
| `sum` | `SUM(value)` | Sum of all values in bucket |
| `count` | `COUNT(*)` | Number of data points |
| `avg` | `AVG(value)` | Arithmetic mean |
| `min` | `MIN(value)` | Minimum value |
| `max` | `MAX(value)` | Maximum value |
| `distinct_count` | `COUNT(DISTINCT value)` | Unique value count |
| `p50` / `p90` / `p95` / `p99` | `PERCENTILE_CONT(x)` | Percentile calculations |
| `weighted_avg` | Custom | Weighted average |
| `sma` / `ema` | Custom | Simple / Exponential moving average |

#### Granularity Levels

Time-series data is simultaneously bucketed at all granularity levels for fast reads at any zoom:

```
minute  →  hour  →  day  →  week  →  month  →  quarter  →  year
```

The multi-granularity write uses an upsert strategy:

```sql
INSERT INTO analytics_metric_values (venture_id, metric_id, timestamp, granularity, value, count, min, max)
ON CONFLICT (venture_id, metric_id, timestamp, granularity, dimension_values)
DO UPDATE SET
  value = CASE
    WHEN type = 'gauge' THEN $new_value            -- Latest value wins
    ELSE analytics_metric_values.value + $new_value -- Accumulate
  END,
  count = analytics_metric_values.count + 1,
  min = LEAST(analytics_metric_values.min, $new_value),
  max = GREATEST(analytics_metric_values.max, $new_value)
```

#### Tables

- `metric_definitions` — Metric name, slug, type, category, unit, format, dimensions, metadata (production)
- `metric_values` — Raw time-series values with dimensions (production)
- `metric_dashboards` — Legacy dashboard storage (production, being migrated to `analytics_dashboards`)
- `analytics_metric_alerts` — Alert rule definitions with conditions, channels, cooldown (Phase 2)
- `analytics_metric_alert_events` — Alert event log: triggered, resolved, snoozed, acknowledged (Phase 2)

---

<a id="submodule-reports"></a>
### Submodule: reports — Scheduled & Ad-Hoc Report Generation

#### Purpose

The reports submodule provides a template-based report generation engine supporting six report types, five export formats, scheduled delivery via email and Slack, retention policies, and branded layout customization. Reports can pull data from any combination of the other five submodules.

#### Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          ReportService                                    │
│                                                                           │
│  createTemplate()   ───▶  Define report structure + branding              │
│                            Store in analytics_report_templates             │
│                                                                           │
│  generateReport()   ───▶  One-shot report generation pipeline:            │
│                            1. Load template + resolve date range           │
│                            2. Gather data from relevant services           │
│                               (MetricsService, FunnelService, etc.)       │
│                            3. Render to requested format(s)               │
│                               ├── PDF  (Puppeteer → headless Chrome)      │
│                               ├── Excel (ExcelJS → .xlsx with charts)     │
│                               ├── CSV  (native streaming renderer)        │
│                               ├── HTML (template engine → styled HTML)    │
│                               └── JSON (structured data output)           │
│                            4. Upload to @mcv/storage                      │
│                            5. Record in analytics_generated_reports        │
│                                                                           │
│  scheduleReport()   ───▶  Create recurring schedule:                      │
│                            • Frequency: once/daily/weekly/biweekly/       │
│                              monthly/quarterly/yearly                      │
│                            • Day, hour, minute, timezone config            │
│                            • Delivery: email + Slack + storage             │
│                                                                           │
│  runScheduledReport()──▶  Cron target (every minute check):               │
│                            1. Find schedules where nextRunAt ≤ now        │
│                            2. Calculate date range from config             │
│                            3. Call generateReport()                        │
│                            4. Deliver via @mcv/comms (email/Slack)        │
│                            5. Update lastRunAt, compute nextRunAt         │
│                            6. On failure: increment consecutiveFailures   │
│                                                                           │
│  getReportHistory() ───▶  Paginated list of generated reports             │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Report Types

| Type | Data Source | Description |
|------|-------------|-------------|
| `dashboard_snapshot` | Full dashboard with widget data | Captures dashboard state for distribution |
| `metric_summary` | Multiple metrics with comparisons | KPI overview with period-over-period changes |
| `funnel_analysis` | Funnel step-by-step breakdown | Conversion analysis with bottleneck identification |
| `cohort_analysis` | Retention matrix + LTV data | Retention and revenue cohort analysis |
| `custom_query` | Arbitrary SQL queries (read-only) | Ad-hoc data exploration |
| `executive_summary` | Cross-module highlights | High-level overview pulling from all submodules |

#### Export Formats

| Format | MIME Type | Renderer | Library |
|--------|-----------|----------|---------|
| `pdf` | `application/pdf` | `pdf-renderer.ts` | Puppeteer / Playwright |
| `excel` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `excel-renderer.ts` | ExcelJS |
| `csv` | `text/csv` | `csv-renderer.ts` | Native (streaming) |
| `html` | `text/html` | `html-renderer.ts` | Template engine |
| `json` | `application/json` | `json-renderer.ts` | Native (structured) |

#### Schedule Frequencies

| Frequency | Description | Config Required |
|-----------|-------------|-----------------|
| `once` | Single execution | `executionDate` |
| `daily` | Every day | `hour`, `minute`, `timezone` |
| `weekly` | Every week | `dayOfWeek`, `hour`, `minute`, `timezone` |
| `biweekly` | Every two weeks | `dayOfWeek`, `hour`, `minute`, `timezone` |
| `monthly` | Every month | `dayOfMonth`, `hour`, `minute`, `timezone` |
| `quarterly` | Every 3 months | `dayOfMonth`, `hour`, `minute`, `timezone` |
| `yearly` | Every year | `month`, `dayOfMonth`, `hour`, `minute`, `timezone` |

#### Report Generation Pipeline

```
Template + Date Range
       │
       ▼
┌──────────────┐
│ Gather Data   │ ← MetricsService, DashboardService, FunnelService,
│               │   CohortService, InsightsService (parallel fetch)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Render Format │ ← PDF (Puppeteer), Excel (ExcelJS), CSV, HTML, JSON
│               │   Branding applied: logo, colors, fonts, header/footer
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Upload to     │ ← @mcv/storage with venture-scoped path
│ Storage       │   /reports/{ventureId}/{year}/{month}/{filename}
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Deliver       │ ← @mcv/comms: email with attachment, Slack message
│               │   Pre-signed download URL (TTL: 7 days)
└──────┬───────┘
       │
       ▼
  Record in analytics_generated_reports
```

#### Failure Handling

When a scheduled report fails:
1. `lastRunStatus` set to `'failed'`
2. `lastRunError` populated with error message
3. `consecutiveFailures` incremented
4. After 3 consecutive failures: schedule is auto-paused, admin notified
5. `nextRunAt` still calculated (for when schedule is resumed)

#### Tables

- `analytics_report_templates` — Template structure, type, config, layout, branding
- `analytics_report_schedules` — Frequency, schedule config, delivery config, run tracking
- `analytics_generated_reports` — Generated file records with URL, size, status, delivery status

---

## Data Models

All data models are implemented using **Drizzle ORM** with PostgreSQL. Every table includes venture-scoped isolation via `ventureId` foreign key and follows the `baseColumns` pattern from `@mcv/kernel` for consistent `id`, `createdAt`, `updatedAt` fields.

### Entity-Relationship Overview

```
┌─────────────────────┐        ┌─────────────────────┐
│   ventures          │        │  metric_definitions  │
│   (from @mcv/kernel)│◄───────│  (name, slug, type,  │
│                     │ 1    * │   category, unit,    │
└─────────────────────┘        │   dimensions)        │
         │                     └──────────┬───────────┘
         │                                │ 1
         │                                │
         │                     ┌──────────▼───────────┐
         │                     │   metric_values       │
         │                     │   (value, dimensions, │
         │                     │    timestamp)         │
         │                     └──────────────────────┘
         │
         │  1                  ┌──────────────────────┐
         ├─────────────────────│ analytics_dashboards  │
         │                   * │ (name, visibility,    │
         │                     │  layout, filters)     │
         │                     └──────────┬───────────┘
         │                                │ 1
         │                     ┌──────────▼───────────┐
         │                     │ analytics_dashboard_  │
         │                     │ widgets               │
         │                     │ (type, position,      │
         │                     │  dataSource, options) │
         │                     └──────────────────────┘
         │
         │  1                  ┌──────────────────────┐
         ├─────────────────────│ analytics_funnels     │
         │                   * │ (name, completionType,│
         │                     │  conversionWindow)    │
         │                     └──────────┬───────────┘
         │                                │ 1
         │                     ┌──────────▼───────────┐
         │                     │ analytics_funnel_     │
         │                     │ steps                 │
         │                     │ (eventType, stepOrder,│
         │                     │  variants)            │
         │                     └──────────┬───────────┘
         │                                │ 1
         │                     ┌──────────▼───────────┐
         │                     │ analytics_funnel_     │
         │                     │ conversions           │
         │                     │ (userId, currentStep, │
         │                     │  isConverted)         │
         │                     └──────────────────────┘
         │
         │  1                  ┌──────────────────────┐
         ├─────────────────────│ analytics_cohort_     │
         │                   * │ definitions           │
         │                     │ (type, criteria,      │
         │                     │  retentionEvent)      │
         │                     └──────────┬───────────┘
         │                                │ 1
         │                     ┌──────────▼───────────┐
         │                     │ analytics_cohorts     │
         │                     │ (periodStart, userCnt,│
         │                     │  LTV, churnRate)      │
         │                     └──────────┬───────────┘
         │                          1     │       1
         │                     ┌──────────▼──┐ ┌──▼──────────────┐
         │                     │ analytics_   │ │ analytics_cohort│
         │                     │ cohort_      │ │ _members        │
         │                     │ retention    │ │ (userId, isChurn│
         │                     │ (periodOffs, │ │  ed, revenue)   │
         │                     │  retRate)    │ └─────────────────┘
         │                     └─────────────┘
         │
         │  1                  ┌──────────────────────┐
         ├─────────────────────│ analytics_insights    │
         │                   * │ (type, priority,      │
         │                     │  status, data)        │
         │                     └──────────────────────┘
         │
         │  1                  ┌──────────────────────┐
         ├─────────────────────│ analytics_report_     │
         │                   * │ templates             │
         │                     │ (type, config,        │
         │                     │  layout, branding)    │
         │                     └──────────┬───────────┘
         │                                │ 1
         │                     ┌──────────▼───────────┐
         │                     │ analytics_report_     │
         │                     │ schedules             │
         │                     │ (frequency, delivery, │
         │                     │  nextRunAt)           │
         │                     └──────────┬───────────┘
         │                                │ 1
         │                     ┌──────────▼───────────┐
         │                     │ analytics_generated_  │
         │                     │ reports               │
         │                     │ (format, fileUrl,     │
         │                     │  status)              │
         │                     └──────────────────────┘
```

### Core Tables — Production Schema

#### metric_definitions

```typescript
export const metricDefinitions = pgTable('metric_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  type: text('type').notNull(),           // 'counter' | 'gauge' | 'histogram' | 'rate'
  category: text('category').notNull(),   // 'revenue' | 'engagement' | 'acquisition' | ...
  unit: text('unit'),                     // 'users', 'USD', '%', 'ms'
  format: text('format'),                 // 'number', 'currency', 'percent', 'duration'
  isActive: boolean('is_active').notNull().default(true),
  dimensions: jsonb('dimensions').$type<string[]>(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('metric_def_venture_slug_idx').on(table.ventureId, table.slug),
  index('metric_def_venture_idx').on(table.ventureId),
  index('metric_def_category_idx').on(table.category),
  index('metric_def_type_idx').on(table.type),
]);
```

#### metric_values

```typescript
export const metricValues = pgTable('metric_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  metricId: uuid('metric_id').notNull().references(() => metricDefinitions.id, { onDelete: 'cascade' }),
  value: doublePrecision('value').notNull(),
  dimensions: jsonb('dimensions').$type<Record<string, string>>(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('metric_values_metric_idx').on(table.metricId),
  index('metric_values_timestamp_idx').on(table.metricId, table.timestamp),
]);
```

#### metric_dashboards (legacy)

```typescript
export const metricDashboards = pgTable('metric_dashboards', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  layout: jsonb('layout').$type<DashboardLayoutItem[]>().notNull().default([]),
  widgets: jsonb('widgets').$type<unknown[]>().notNull().default([]),
  isDefault: boolean('is_default').notNull().default(false),
  isShared: boolean('is_shared').notNull().default(false),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('metric_dashboards_venture_idx').on(table.ventureId),
]);
```

### Extended Tables — Spec Schema (Phase 2+)

All extended tables follow the `baseColumns` pattern and include full Drizzle ORM definitions as documented in the MODULE.md specification. Key extended tables include:

- **`analytics_metric_alerts`** — Alert rule definitions with condition JSONB, channel configuration, cooldown, snooze
- **`analytics_metric_alert_events`** — Alert event audit log (triggered, resolved, snoozed, acknowledged)
- **`analytics_dashboards`** — Full-featured dashboard with visibility, sharing, theme, refresh, annotations
- **`analytics_dashboard_widgets`** — Widget position, type, chart type, data source, options, drilldown
- **`analytics_dashboard_snapshots`** — Point-in-time captures with scheduled delivery config
- **`analytics_dashboard_annotations`** — Timeline annotations (note, event, milestone, alert)
- **`analytics_funnels`** — Funnel metadata with completion type, conversion window, cached stats
- **`analytics_funnel_steps`** — Ordered steps with event filters, time constraints, A/B variants
- **`analytics_funnel_conversions`** — Individual conversion records with step timestamps, attribution
- **`analytics_funnel_dropoff_reasons`** — AI-detected and manual drop-off reasons
- **`analytics_cohort_definitions`** — Cohort criteria, retention event, revenue event, period config
- **`analytics_cohorts`** — Computed cohort instances with aggregate stats and LTV horizons
- **`analytics_cohort_retention`** — Per-period retention data (retained count, rate, revenue, ARPU)
- **`analytics_cohort_members`** — Individual user membership with activity and revenue tracking
- **`analytics_insights`** — Insight records with full lifecycle, linked entities, AI analysis
- **`analytics_insight_rules`** — Configurable trigger rules for automated insight generation
- **`analytics_anomaly_models`** — Persisted ML model state per metric
- **`analytics_report_templates`** — Report structure, type, config, layout, branding
- **`analytics_report_schedules`** — Recurring schedule with delivery config and run tracking
- **`analytics_generated_reports`** — Generated file records with URL, size, delivery status

### Index Strategy

```sql
-- ═══════════════════════════════════════════════════════════
-- METRICS
-- ═══════════════════════════════════════════════════════════
CREATE UNIQUE INDEX metric_def_venture_slug_idx ON metric_definitions (venture_id, slug);
CREATE INDEX metric_def_venture_idx ON metric_definitions (venture_id);
CREATE INDEX metric_def_category_idx ON metric_definitions (category);
CREATE INDEX metric_def_type_idx ON metric_definitions (type);
CREATE INDEX metric_values_metric_idx ON metric_values (metric_id);
CREATE INDEX metric_values_timestamp_idx ON metric_values (metric_id, timestamp);

-- Phase 2: Multi-granularity lookup
CREATE INDEX metric_values_time_idx ON analytics_metric_values (metric_id, timestamp, granularity);
CREATE INDEX metric_values_lookup_idx ON analytics_metric_values (venture_id, metric_id, granularity, timestamp);

-- ═══════════════════════════════════════════════════════════
-- DASHBOARDS
-- ═══════════════════════════════════════════════════════════
CREATE INDEX metric_dashboards_venture_idx ON metric_dashboards (venture_id);
CREATE INDEX dashboard_owner_idx ON analytics_dashboards (venture_id, owner_id);
CREATE INDEX dashboard_visibility_idx ON analytics_dashboards (venture_id, visibility);

-- ═══════════════════════════════════════════════════════════
-- FUNNELS
-- ═══════════════════════════════════════════════════════════
CREATE INDEX funnel_conv_funnel_idx ON analytics_funnel_conversions (funnel_id, entered_at);
CREATE INDEX funnel_conv_user_idx ON analytics_funnel_conversions (user_id, funnel_id);
CREATE INDEX funnel_step_order_idx ON analytics_funnel_steps (funnel_id, step_order);

-- ═══════════════════════════════════════════════════════════
-- COHORTS
-- ═══════════════════════════════════════════════════════════
CREATE INDEX cohort_period_idx ON analytics_cohorts (definition_id, period_start);
CREATE INDEX cohort_retention_idx ON analytics_cohort_retention (cohort_id, period_offset);
CREATE INDEX cohort_member_user_idx ON analytics_cohort_members (user_id);
CREATE INDEX cohort_member_cohort_idx ON analytics_cohort_members (cohort_id, is_active);

-- ═══════════════════════════════════════════════════════════
-- INSIGHTS
-- ═══════════════════════════════════════════════════════════
CREATE INDEX insight_type_idx ON analytics_insights (venture_id, type, status);
CREATE INDEX insight_priority_idx ON analytics_insights (venture_id, priority, status);
CREATE INDEX insight_metric_idx ON analytics_insights (metric_id);
CREATE INDEX insight_created_idx ON analytics_insights (venture_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- REPORTS
-- ═══════════════════════════════════════════════════════════
CREATE INDEX report_template_venture_idx ON analytics_report_templates (venture_id);
CREATE INDEX report_schedule_next_idx ON analytics_report_schedules (next_run_at, is_active);
CREATE INDEX generated_report_template_idx ON analytics_generated_reports (template_id, generated_at DESC);
```

### Drizzle Relations

```typescript
// Metric definitions → values (one-to-many)
export const metricDefinitionsRelations = relations(metricDefinitions, ({ one, many }) => ({
  venture: one(ventures, {
    fields: [metricDefinitions.ventureId],
    references: [ventures.id],
  }),
  values: many(metricValues),
  alerts: many(metricAlerts),
}));

// Metric values → definition (many-to-one)
export const metricValuesRelations = relations(metricValues, ({ one }) => ({
  metric: one(metricDefinitions, {
    fields: [metricValues.metricId],
    references: [metricDefinitions.id],
  }),
}));

// Dashboard → widgets (one-to-many)
export const dashboardRelations = relations(dashboards, ({ one, many }) => ({
  venture: one(ventures, { fields: [dashboards.ventureId], references: [ventures.id] }),
  widgets: many(dashboardWidgets),
  snapshots: many(dashboardSnapshots),
  annotations: many(dashboardAnnotations),
}));

// Widget → dashboard (many-to-one)
export const dashboardWidgetRelations = relations(dashboardWidgets, ({ one }) => ({
  dashboard: one(dashboards, { fields: [dashboardWidgets.dashboardId], references: [dashboards.id] }),
}));

// Funnel → steps → conversions (hierarchical)
export const funnelRelations = relations(funnels, ({ one, many }) => ({
  venture: one(ventures, { fields: [funnels.ventureId], references: [ventures.id] }),
  steps: many(funnelSteps),
  conversions: many(funnelConversions),
  dropoffReasons: many(funnelDropoffReasons),
}));

// Cohort definition → cohorts → retention + members
export const cohortDefinitionRelations = relations(cohortDefinitions, ({ one, many }) => ({
  venture: one(ventures, { fields: [cohortDefinitions.ventureId], references: [ventures.id] }),
  cohorts: many(cohorts),
}));

export const cohortRelations = relations(cohorts, ({ one, many }) => ({
  definition: one(cohortDefinitions, { fields: [cohorts.definitionId], references: [cohortDefinitions.id] }),
  retention: many(cohortRetention),
  members: many(cohortMembers),
}));

// Report template → schedules → generated reports
export const reportTemplateRelations = relations(reportTemplates, ({ one, many }) => ({
  venture: one(ventures, { fields: [reportTemplates.ventureId], references: [ventures.id] }),
  schedules: many(reportSchedules),
  generatedReports: many(generatedReports),
}));

export const reportScheduleRelations = relations(reportSchedules, ({ one, many }) => ({
  template: one(reportTemplates, { fields: [reportSchedules.templateId], references: [reportTemplates.id] }),
  generatedReports: many(generatedReports),
}));
```

---

## Data Flow & Events

### Inbound Event Flow

The analytics domain consumes events from across the MCV ecosystem via the Redpanda/Kafka event bus:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INBOUND EVENT FLOW                               │
│                                                                          │
│  @mcv/commerce ──▶ purchase.completed ──▶ recordValue('total_revenue')  │
│                    order.created        ──▶ recordValue('orders_count')  │
│                    subscription.renewed ──▶ recordValue('mrr')          │
│                                                                          │
│  @mcv/people   ──▶ user.created        ──▶ recordValue('signups')      │
│                    session.started      ──▶ recordValue('active_sessions')│
│                    profile.updated      ──▶ cohort membership refresh   │
│                                                                          │
│  @mcv/growth   ──▶ campaign.impression ──▶ recordValue('impressions')  │
│                    campaign.click       ──▶ recordValue('clicks')       │
│                    experiment.assigned  ──▶ funnel variant assignment   │
│                                                                          │
│  @mcv/engagement─▶ content.viewed      ──▶ recordValue('page_views')   │
│                    feature.used         ──▶ recordValue('feature_usage')│
│                    notification.clicked ──▶ recordValue('notif_ctr')    │
│                                                                          │
│  Any domain    ──▶ *.event             ──▶ trackFunnelProgress()       │
│                                            (matched against active      │
│                                             funnel step event types)    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Event Listener Registration

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

### Outbound Events (Audit)

The analytics domain emits audit events for every significant operation:

| Event | Category | Trigger |
|-------|----------|---------|
| `analytics.metric.created` | admin | Metric definition created |
| `analytics.metric.value_recorded` | system | Metric value(s) recorded |
| `analytics.metric.batch_recorded` | system | Batch of values recorded |
| `analytics.metric.queried` | system | Time-series query executed |
| `analytics.dashboard.created` | admin | Dashboard created |
| `analytics.dashboard.shared` | admin | Dashboard sharing changed |
| `analytics.dashboard.viewed` | system | Dashboard loaded |
| `analytics.funnel.created` | admin | Funnel created |
| `analytics.funnel.progress` | system | User progressed through funnel step |
| `analytics.funnel.converted` | system | User completed funnel |
| `analytics.cohort.created` | admin | Cohort definition created |
| `analytics.cohort.computed` | system | Cohort data refreshed |
| `analytics.insight.generated` | system | AI insight created |
| `analytics.insight.resolved` | system | Insight resolved by user |
| `analytics.alert.triggered` | system | Metric alert threshold breached |
| `analytics.alert.resolved` | system | Alert returned to normal |
| `analytics.report.generated` | system | Report file generated |
| `analytics.report.delivered` | system | Report delivered via channel |
| `analytics.report.delivery_failed` | system | Report delivery failed |

### Real-Time Streaming

The metrics submodule supports real-time streaming via Redis pub/sub:

```
Metric Value Recorded
       │
       ▼
  Redis PUBLISH analytics:metrics:{ventureId}:{metricSlug}
       │
       ▼
  All subscribers receive update instantly
       │
       ▼
  ┌────────────┐  ┌──────────────┐  ┌──────────────┐
  │ Dashboard   │  │ Alert Engine │  │ WebSocket    │
  │ Live Widget │  │ (threshold   │  │ Clients      │
  │ Refresh     │  │  check)      │  │ (via Next.js)│
  └────────────┘  └──────────────┘  └──────────────┘
```

---

## Integration Points

### Dependency Map

```
                    ┌─────────────┐
                    │ @mcv/kernel  │ ← Database, context, errors, base columns
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  @mcv/db    │ ← Drizzle schema, query builder, migrations
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐    │     ┌──────▼──────┐
       │ @mcv/events  │    │     │ @mcv/storage │ ← Report file uploads
       │ (Redpanda)   │    │     └─────────────┘
       └──────┬──────┘    │
              │            │
              │     ┌──────▼──────┐
              │     │@mcv/analytics│ ← THIS PACKAGE
              │     └──────┬──────┘
              │            │
       ┌──────┴──────┐    │     ┌─────────────┐
       │  @mcv/ai     │◄───┘     │ @mcv/comms  │ ← Email, Slack delivery
       │ (OpenRouter)  │         └─────────────┘
       └─────────────┘
```

### Integration Details

| System | Direction | Method | Data Flow |
|--------|-----------|--------|-----------|
| `@mcv/kernel` | Import | Direct | Database connection, context provider, error codes, base schema columns |
| `@mcv/db` | Import | Direct | Drizzle schema definitions, query builder, migration framework |
| `@mcv/events` | Consume | Event bus | Metric event listeners, funnel step triggers, automatic recording |
| `@mcv/storage` | Produce | Service call | Report file uploads (PDF, Excel, CSV), dashboard snapshot images |
| `@mcv/ai` | Consume | Service call | AI-powered insight generation, anomaly classification, NL summaries, drop-off analysis |
| `@mcv/comms` | Produce | Service call | Report delivery (email with attachments), alert notifications (Slack, PagerDuty) |
| `@mcv/identity` | Consume | Service call | User lookup for dashboard sharing, cohort member resolution |
| `@mcv/commerce` | Consume | Event bus | Revenue events, transaction data, subscription metrics |
| `@mcv/growth` | Consume | Event bus | Campaign attribution data, A/B experiment assignments |
| `@mcv/people` | Consume | Event bus | User actions, session events, profile updates |
| `@mcv/engagement` | Consume | Event bus | Content interactions, feature usage, notification metrics |
| `@mcv/cdp` | Consume | Service call | User segment definitions for cohort criteria, audience targeting |
| `@mcv/intelligence` | Consume | Service call | ML model outputs for advanced anomaly detection and predictions |

### Cross-Venture Analytics (Superadmin)

For consortium-level analytics (e.g., benchmarking across all 9 ventures), a separate `SuperAdminAnalyticsService` aggregates data across venture boundaries. This service:

1. Requires superadmin authentication
2. Uses read-only database connections
3. Anonymizes venture-specific data when producing benchmarks
4. Powers the MCV.ONE executive dashboard

---

## Performance

### Latency Targets

| Operation | Target (P50) | P99 Limit | Strategy |
|-----------|-------------|-----------|----------|
| Record single value | < 5ms | < 15ms | Direct INSERT + async granularity upsert |
| Batch record (1000) | < 100ms | < 250ms | Single INSERT statement with prepared values |
| Time-series query (30 days, daily) | < 50ms | < 150ms | Pre-aggregated day-level buckets + Redis cache |
| Time-series query (365 days, daily) | < 200ms | < 500ms | Pre-aggregated buckets + index on (metric_id, timestamp) |
| Dashboard render (6 widgets) | < 300ms | < 800ms | Parallel widget data fetch via `Promise.all()` |
| Funnel analysis (30 days) | < 500ms | < 1.5s | Indexed by (funnel_id, entered_at) + cached stats |
| Cohort retention matrix (12 months) | < 1s | < 3s | Pre-computed retention rows + indexed by (cohort_id, period_offset) |
| Anomaly detection (single metric) | < 200ms | < 500ms | Rolling 90-day window with cached mean/stddev |
| Report generation (PDF) | < 5s | < 15s | Puppeteer warm pool + parallel data fetch |
| Insight feed query | < 50ms | < 150ms | Indexed by (venture_id, priority, status) |

### Throughput Targets

| Metric | Small Deployment | Enterprise (per venture) |
|--------|------------------|------------------------|
| Values recorded per minute | 1,000 | 50,000+ |
| Queries per minute | 200 | 2,000+ |
| Dashboards served per minute | 50 | 500+ |
| Reports generated per hour | 10 | 100+ |
| Insights processed per cycle | 100 metrics | 10,000+ metrics |

### Optimization Strategies

#### 1. Multi-Granularity Pre-Aggregation

The most critical optimization. On every `recordValue()` call, the system upserts pre-aggregated buckets at all granularity levels:

```
Write: 1 value → upserts into minute, hour, day, week, month, quarter, year buckets
Read:  SELECT directly from the requested granularity bucket (no aggregation needed)
```

This converts O(n) read-time aggregation into O(1) lookups at the cost of 7× write amplification (which is acceptable given the write volumes).

#### 2. Redis Caching Layer

```
┌────────────────────────────────────────────────────────────────┐
│                    Redis Cache Strategy                          │
│                                                                 │
│  Key Pattern                           TTL        Invalidation  │
│  ──────────────────────────────────── ───────── ──────────────  │
│  analytics:metric:{id}:{range}:{gran}  5 min     On recordValue│
│  analytics:dashboard:{id}:widget:{wid} 60 sec    On widget edit│
│  analytics:latest:{metricId}           30 sec    On recordValue│
│  analytics:insight:feed:{ventureId}    2 min     On new insight│
│  analytics:rate:{ventureId}:{userId}   Sliding   N/A           │
└────────────────────────────────────────────────────────────────┘
```

#### 3. Batch Insert Optimization

The `batchRecord()` method uses a single prepared INSERT statement for up to 1,000 values:

```sql
INSERT INTO metric_values (id, metric_id, value, dimensions, timestamp)
VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ...
-- Up to 1000 rows in a single statement
```

#### 4. Table Partitioning

The `metric_values` table is partitioned by month for efficient range scans and data retention cleanup:

```sql
CREATE TABLE metric_values (
  -- columns...
) PARTITION BY RANGE (timestamp);

CREATE TABLE metric_values_2026_01 PARTITION OF metric_values
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE metric_values_2026_02 PARTITION OF metric_values
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- Auto-created by cron job for upcoming months
```

#### 5. Parallel Widget Data Resolution

Dashboard rendering fetches all widget data concurrently:

```typescript
const widgetDataPromises = dashboard.widgets.map(async (widget) => {
  const cacheKey = `analytics:dashboard:${dashboard.id}:widget:${widget.id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return { widget, data: JSON.parse(cached) };

  const data = await resolveWidgetData(widget);
  await redis.setex(cacheKey, 60, JSON.stringify(data));
  return { widget, data };
});

const widgetsWithData = await Promise.all(widgetDataPromises);
```

#### 6. Connection Pooling

Drizzle ORM configured with PgPool for efficient connection reuse:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DATABASE_POOL_SIZE || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

#### 7. Materialized Views

Common aggregation queries are pre-computed as materialized views:

```sql
-- Daily metric totals (refreshed by cron every 15 minutes)
CREATE MATERIALIZED VIEW mv_daily_metric_totals AS
SELECT
  metric_id,
  date_trunc('day', timestamp) AS day,
  SUM(value) AS total,
  AVG(value) AS average,
  COUNT(*) AS data_points
FROM metric_values
WHERE timestamp > NOW() - INTERVAL '90 days'
GROUP BY metric_id, date_trunc('day', timestamp);

CREATE UNIQUE INDEX mv_daily_totals_idx ON mv_daily_metric_totals (metric_id, day);

-- Refresh command (run via cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_metric_totals;
```

---

## Scalability

### Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCALING ARCHITECTURE                           │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │ API Server 1  │   │ API Server 2  │   │ API Server N  │        │
│  │ (Next.js)     │   │ (Next.js)     │   │ (Next.js)     │        │
│  └──────┬────────┘   └──────┬────────┘   └──────┬────────┘        │
│         │                   │                    │               │
│         └──────────┬────────┴────────┬───────────┘               │
│                    │                 │                            │
│         ┌──────────▼──────┐  ┌──────▼──────────┐                │
│         │  PostgreSQL      │  │  Redis Cluster   │                │
│         │  (read replicas) │  │  (3-node)        │                │
│         └─────────────────┘  └─────────────────┘                │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │ Worker 1      │   │ Worker 2      │   │ Worker N      │        │
│  │ (Insights)    │   │ (Reports)     │   │ (Cohorts)     │        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Scaling Dimensions

| Dimension | Strategy | Threshold |
|-----------|----------|-----------|
| **Read traffic** | PostgreSQL read replicas + Redis cache | > 2,000 queries/min |
| **Write throughput** | Batch inserts, write-ahead buffering, partitioning | > 50,000 values/min |
| **Compute (insights)** | Dedicated worker nodes with job queue | > 10,000 metrics per analysis cycle |
| **Report generation** | Worker pool with concurrency limit (5 default) | > 100 reports/hour |
| **Dashboard concurrency** | Redis cache + CDN for public dashboards | > 500 concurrent viewers |
| **Data retention** | Monthly partition drop, configurable retention per metric | > 1 year of data |

### Data Retention & Cleanup

| Granularity | Default Retention | Configurable |
|-------------|------------------|--------------|
| `minute` | 7 days | Yes |
| `hour` | 90 days | Yes |
| `day` | 365 days | Yes |
| `week` | 3 years | Yes |
| `month` | Forever | Yes |
| `quarter` | Forever | No |
| `year` | Forever | No |

The monthly `retention-cleanup` cron job drops expired partitions and deletes expired report files from storage.

### Multi-Region Considerations

For global deployments:
1. **Read replicas** per region for low-latency dashboard serving
2. **Write routing** to primary region, async replication
3. **Redis** per region for cache locality
4. **CDN** for public dashboard assets and report downloads
5. **Event bus** (Redpanda) with cross-region replication for ingestion

---

## Error Handling

### Error Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ERROR HANDLING LAYERS                         │
│                                                                  │
│  ┌── Client Layer ────────────────────────────────────────────┐ │
│  │  React Error Boundaries → Fallback UI per widget/section   │ │
│  │  tRPC error hooks → Toast notifications + retry logic      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌── Router Layer ────────────────────────────────────────────┐ │
│  │  Zod validation → TRPCError(BAD_REQUEST) with field errors │ │
│  │  Auth check → TRPCError(UNAUTHORIZED / FORBIDDEN)          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌── Service Layer ───────────────────────────────────────────┐ │
│  │  Business logic errors → Domain-specific error codes       │ │
│  │  Venture isolation check → FORBIDDEN if cross-venture      │ │
│  │  Resource not found → NOT_FOUND with entity context        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌── Infrastructure Layer ────────────────────────────────────┐ │
│  │  Database errors → Retry with backoff (connection issues)  │ │
│  │  Redis errors → Graceful degradation (skip cache)          │ │
│  │  External service errors → Circuit breaker pattern         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Error Codes

| Code | HTTP | tRPC Code | Description |
|------|------|-----------|-------------|
| `METRIC_NOT_FOUND` | 404 | `NOT_FOUND` | Metric definition does not exist or belongs to another venture |
| `METRIC_SLUG_EXISTS` | 409 | `CONFLICT` | Metric slug already taken in this venture |
| `METRIC_VALUE_INVALID` | 400 | `BAD_REQUEST` | Value is NaN, Infinity, or out of range |
| `BATCH_TOO_LARGE` | 400 | `BAD_REQUEST` | Batch exceeds 1,000 entries |
| `BATCH_METRIC_MISMATCH` | 404 | `NOT_FOUND` | One or more metric IDs in batch invalid |
| `DASHBOARD_NOT_FOUND` | 404 | `NOT_FOUND` | Dashboard does not exist |
| `DASHBOARD_ACCESS_DENIED` | 403 | `FORBIDDEN` | User lacks permission to view/edit |
| `DASHBOARD_EDIT_DENIED` | 403 | `FORBIDDEN` | User is not owner or editor |
| `FUNNEL_NOT_FOUND` | 404 | `NOT_FOUND` | Funnel does not exist |
| `FUNNEL_INACTIVE` | 400 | `BAD_REQUEST` | Funnel status is not 'active' |
| `FUNNEL_STEP_ORDER` | 400 | `BAD_REQUEST` | Event received out of step order |
| `FUNNEL_TIME_CONSTRAINT` | 400 | `BAD_REQUEST` | Step time constraint violated |
| `COHORT_NOT_FOUND` | 404 | `NOT_FOUND` | Cohort definition not found |
| `COHORT_COMPUTE_FAILED` | 500 | `INTERNAL_SERVER_ERROR` | Computation error |
| `INSIGHT_NOT_FOUND` | 404 | `NOT_FOUND` | Insight does not exist |
| `INSIGHT_EXPIRED` | 410 | `NOT_FOUND` | Insight past its expiry |
| `REPORT_TEMPLATE_NOT_FOUND` | 404 | `NOT_FOUND` | Report template not found |
| `REPORT_GENERATION_FAILED` | 500 | `INTERNAL_SERVER_ERROR` | Report rendering failed |
| `REPORT_DELIVERY_FAILED` | 500 | `INTERNAL_SERVER_ERROR` | Email/Slack delivery failed |
| `REPORT_TOO_LARGE` | 413 | `PAYLOAD_TOO_LARGE` | Report exceeds size limit |
| `INSUFFICIENT_DATA` | 400 | `BAD_REQUEST` | < 30 data points for analysis |
| `INVALID_DATE_RANGE` | 400 | `BAD_REQUEST` | Start date after end date |
| `QUERY_RATE_LIMITED` | 429 | `TOO_MANY_REQUESTS` | Rate limit exceeded |

### Graceful Degradation

| Failure | Impact | Degradation |
|---------|--------|-------------|
| Redis unavailable | Cache miss | All queries hit PostgreSQL directly; higher latency but functional |
| AI service unavailable | No AI insights | Insights engine falls back to statistical-only analysis (Z-score, regression) |
| Report rendering failure | No PDF/Excel | Return HTML/JSON format as fallback; queue for retry |
| Event bus disconnection | No real-time ingestion | Buffer events locally; replay on reconnection |
| Read replica lag | Stale data | Serve with staleness indicator; critical queries routed to primary |

### Retry Strategy

| Operation | Max Retries | Backoff | Circuit Breaker |
|-----------|------------|---------|-----------------|
| Database write | 3 | Exponential (100ms, 200ms, 400ms) | After 10 failures in 60s |
| Redis operation | 2 | Fixed 50ms | After 5 failures in 30s |
| AI service call | 2 | Exponential (500ms, 1s) | After 3 failures in 120s |
| Report delivery | 3 | Exponential (1s, 5s, 30s) | After 3 consecutive failures |
| Event bus publish | 5 | Exponential (100ms → 1.6s) | After 20 failures in 60s |

---

## Observability

### Structured Logging

All analytics operations emit structured JSON logs:

```typescript
logger.info('metric.value.recorded', {
  ventureId: this.ventureId,
  metricId: metric.id,
  metricSlug: metric.slug,
  value: entry.value,
  dimensions: entry.dimensions,
  timestamp: entry.timestamp,
  latencyMs: Date.now() - startTime,
});

logger.warn('insight.anomaly.detected', {
  ventureId: this.ventureId,
  metricId: metric.id,
  metricSlug: metric.slug,
  severity: 'high',
  zScore: 3.2,
  expectedValue: 24000,
  actualValue: 16800,
  deviationPercent: -30.0,
});

logger.error('report.generation.failed', {
  ventureId: this.ventureId,
  templateId: template.id,
  format: 'pdf',
  error: error.message,
  stack: error.stack,
  generationTimeMs: Date.now() - startTime,
});
```

### Metrics (Application-Level)

The analytics domain itself is instrumented with application metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `analytics.values.recorded` | Counter | Total metric values recorded |
| `analytics.values.recorded.batch_size` | Histogram | Batch sizes for batchRecord() |
| `analytics.queries.executed` | Counter | Total time-series queries |
| `analytics.queries.latency_ms` | Histogram | Query execution time |
| `analytics.cache.hit_rate` | Gauge | Redis cache hit percentage |
| `analytics.dashboard.renders` | Counter | Dashboard render count |
| `analytics.dashboard.render_latency_ms` | Histogram | Dashboard render time |
| `analytics.funnel.events.tracked` | Counter | Funnel progress events |
| `analytics.cohort.compute_latency_ms` | Histogram | Cohort computation time |
| `analytics.insights.generated` | Counter | Insights created (by type) |
| `analytics.reports.generated` | Counter | Reports generated (by format) |
| `analytics.reports.delivery.failures` | Counter | Report delivery failures |
| `analytics.errors` | Counter | Error count by code |

### Health Checks

```typescript
// Health check endpoint: /api/analytics/health
export async function healthCheck(): Promise<HealthStatus> {
  const checks = await Promise.allSettled([
    // Database connectivity
    db.execute(sql`SELECT 1`).then(() => ({ name: 'database', status: 'healthy' })),

    // Redis connectivity
    redis.ping().then(() => ({ name: 'redis', status: 'healthy' })),

    // Recent metric writes (last 5 minutes)
    db.select({ count: count() })
      .from(metricValues)
      .where(gt(metricValues.createdAt, new Date(Date.now() - 300000)))
      .then(([r]) => ({
        name: 'metric_ingestion',
        status: r.count > 0 ? 'healthy' : 'degraded',
        detail: `${r.count} values in last 5m`,
      })),

    // Insight analysis recency
    db.select({ max: max(insights.createdAt) })
      .from(insights)
      .then(([r]) => ({
        name: 'insight_analysis',
        status: r.max && (Date.now() - r.max.getTime()) < 86400000 ? 'healthy' : 'degraded',
      })),
  ]);

  return {
    status: checks.every(c => c.status === 'fulfilled' && c.value.status === 'healthy')
      ? 'healthy' : 'degraded',
    checks: checks.map(c => c.status === 'fulfilled' ? c.value : { status: 'unhealthy' }),
    timestamp: new Date().toISOString(),
  };
}
```

### Alerting Rules

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| Metric ingestion stalled | 0 values recorded in 15 min | Critical | PagerDuty |
| Query latency spike | P99 > 500ms for 5 min | High | Slack |
| Cache hit rate drop | Hit rate < 70% for 10 min | Medium | Slack |
| Report generation failure | 3 consecutive failures | High | Email + Slack |
| Insight analysis overdue | Last run > 12h ago | Medium | Slack |
| Database connection pool exhausted | Available connections < 2 | Critical | PagerDuty |

---

## Security

### Multi-Tenant Isolation

Every service in the analytics domain enforces venture-level isolation:

```typescript
export class MetricsService {
  private ventureId: string;

  constructor(ventureId: string) {
    this.ventureId = ventureId;
  }

  async query(params: MetricQueryParams): Promise<MetricTimeSeries> {
    // ALWAYS filter by ventureId — no exceptions
    const conditions = [
      eq(metricDefinitions.ventureId, this.ventureId),
      eq(metricValues.metricId, params.metricId),
    ];
    // ... rest of query
  }
}
```

**Isolation guarantees:**
- Every table has a `ventureId` column with a foreign key to `ventures.id` (`ON DELETE CASCADE`)
- Every service constructor requires `ventureId` — there is no default
- Row-Level Security (RLS) policies in Supabase provide an additional database-level enforcement layer
- Cross-venture access is impossible through the standard service layer

### Access Control Matrix

| Resource | Read | Write | Delete | Share |
|----------|------|-------|--------|-------|
| Metric definitions | Venture member | Venture admin | Venture admin | N/A |
| Metric values | Venture member | Venture member | Cascade only | N/A |
| Dashboards | Based on visibility | Owner + editors | Owner only | Owner only |
| Funnels | Venture member | Venture admin | Venture admin | N/A |
| Cohorts | Venture member | System (computed) | Venture admin | N/A |
| Insights | Venture member | System (generated) | Auto-expire | N/A |
| Reports | Venture member | Venture member | Owner + admin | Owner only |

### Dashboard Access Control

```typescript
async function checkDashboardAccess(
  dashboard: Dashboard,
  userId: string,
  action: 'view' | 'edit' | 'delete' | 'share'
): Promise<boolean> {
  // Owner has full access
  if (dashboard.ownerId === userId) return true;

  switch (action) {
    case 'view':
      switch (dashboard.visibility) {
        case 'private':  return false;
        case 'team':     return isTeamMember(userId, dashboard.teamId);
        case 'venture':  return isVentureMember(userId, dashboard.ventureId);
        case 'public':   return true; // Password check handled separately
      }
    case 'edit':
      return dashboard.sharedWith?.editors?.includes(userId) ?? false;
    case 'delete':
    case 'share':
      return false; // Owner only
  }
}
```

### Data Privacy

| Concern | Mitigation |
|---------|-----------|
| **PII in dimensions** | Dimension values may contain user IDs or other PII; ventures configure PII filtering policies |
| **Custom query SQL injection** | `custom_query` report type executes in read-only context with statement-level sanitization |
| **Public dashboard exposure** | Password-protected (bcrypt); no sensitive data displayed without explicit configuration |
| **Report file access** | Stored in `@mcv/storage` with venture-scoped paths; pre-signed URLs with 7-day TTL |
| **Real-time streaming** | Redis pub/sub channels scoped by ventureId; no cross-venture subscription possible |
| **Audit trail** | Every data access and modification emits an audit event for compliance |

### Rate Limiting

```typescript
// Rate limiting via Redis sliding window
const rateLimiter = {
  // Query rate limit: 200/min per venture
  queries: { window: 60, limit: 200, key: 'analytics:rate:query:{ventureId}' },

  // Write rate limit: 10,000/min per venture
  writes: { window: 60, limit: 10000, key: 'analytics:rate:write:{ventureId}' },

  // Report generation: 10/hour per venture
  reports: { window: 3600, limit: 10, key: 'analytics:rate:report:{ventureId}' },

  // Dashboard view: 100/min per user
  views: { window: 60, limit: 100, key: 'analytics:rate:view:{userId}' },
};
```

### Environment Variables

All sensitive configuration is managed via environment variables with no defaults for credentials:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/mcv
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://host:6379/0
ANALYTICS_CACHE_TTL=300
ANALYTICS_DASHBOARD_CACHE_TTL=60

# Limits
ANALYTICS_MAX_BATCH_SIZE=1000
ANALYTICS_MAX_DASHBOARD_WIDGETS=50
ANALYTICS_MAX_FUNNEL_STEPS=20
ANALYTICS_MAX_COHORT_MEMBERS=100000
ANALYTICS_MAX_REPORT_SIZE_MB=50
ANALYTICS_REPORT_CONCURRENT_GENERATIONS=5

# Insight Tuning
ANALYTICS_ANOMALY_SENSITIVITY=0.95
ANALYTICS_ANOMALY_MIN_CONFIDENCE=0.80
ANALYTICS_INSIGHT_EXPIRY_DAYS=7
ANALYTICS_CORRELATION_THRESHOLD=0.5

# Retention
ANALYTICS_DEFAULT_RETENTION_DAYS=365
ANALYTICS_REPORT_EXPIRY_DAYS=90

# Cron Schedules
ANALYTICS_INSIGHT_CRON="0 */6 * * *"
ANALYTICS_COHORT_COMPUTE_CRON="0 2 * * *"
ANALYTICS_RETENTION_CLEANUP_CRON="0 3 1 * *"
ANALYTICS_REPORT_SCHEDULER_CRON="* * * * *"
```

---

*@mcv/analytics — Analytics & Business Intelligence Domain*
