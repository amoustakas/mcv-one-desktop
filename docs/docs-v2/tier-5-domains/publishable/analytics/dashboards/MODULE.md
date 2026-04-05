# @mcv/analytics/dashboards

> **Tier 5 Domain Module — Publishable**
> Dashboard builder, visualization engine, and real-time operational intelligence platform.

**Package:** `@mcv/analytics/dashboards`
**Tier:** 5 (Application Domain)
**Visibility:** Publishable
**Owner:** Analytics Platform Team
**Since:** 0.18.0

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
- [Core Interfaces](#core-interfaces)
- [Database Schemas](#database-schemas)
- [Widget Library](#widget-library)
- [Data Binding System](#data-binding-system)
- [Real-Time Updates](#real-time-updates)
- [Dashboard Builder](#dashboard-builder)
- [Filter System](#filter-system)
- [Template Engine](#template-engine)
- [Sharing & Embedding](#sharing--embedding)
- [Scheduling & Snapshots](#scheduling--snapshots)
- [Responsive Layout](#responsive-layout)
- [Permissions Model](#permissions-model)
- [Code Examples](#code-examples)
- [Error Codes](#error-codes)
- [Security Considerations](#security-considerations)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)
- [Changelog](#changelog)

---

## Purpose

The `@mcv/analytics/dashboards` module is the consortium's central visualization and operational intelligence platform. It provides a fully interactive, drag-and-drop dashboard builder that enables every role — from executives monitoring portfolio-wide KPIs to engineers tracking deployment pipelines — to compose, share, and schedule rich data visualizations without writing code. Dashboards are the primary surface through which MCV stakeholders consume metrics, trends, and real-time operational data produced by the broader analytics subsystem.

At its core, the module manages the full lifecycle of dashboards: creation via a visual builder or programmatic API, layout and widget configuration, data binding to upstream metric sources (including custom queries, aggregated metrics from `@mcv/analytics/metrics`, and arbitrary API endpoints), real-time data streaming for live operational views, and distribution through sharing links, embedded iframes, PDF exports, and scheduled email snapshots. Every dashboard is multi-tenant by design — each venture maintains its own dashboard namespace while consortium-level dashboards provide cross-venture aggregation for executive oversight.

The architecture separates concerns cleanly: the **Builder UI** handles user interactions and layout manipulation, the **Layout Engine** manages responsive grid positioning and widget sizing, the **Data Layer** orchestrates data fetching, caching, and real-time subscriptions, and the **Widget Renderer** maps data to visual components from the extensive widget library (line charts, bar charts, pie charts, area charts, scatter plots, KPI cards, data tables, geographic maps, funnels, heatmaps, and more). This separation enables server-side rendering for PDF/email snapshots, headless testing, and future extensibility through custom widget plugins.

---

## Exports

```typescript
// === Primary Services ===
export { DashboardService } from './services/dashboard.service';
export { WidgetService } from './services/widget.service';
export { DataBindingService } from './services/data-binding.service';
export { DashboardFilterService } from './services/filter.service';
export { DashboardShareService } from './services/share.service';
export { DashboardScheduleService } from './services/schedule.service';
export { DashboardTemplateService } from './services/template.service';
export { DashboardSnapshotService } from './services/snapshot.service';
export { WidgetRendererService } from './services/widget-renderer.service';
export { DashboardPermissionService } from './services/permission.service';

// === React Components ===
export { DashboardBuilder } from './components/DashboardBuilder';
export { DashboardViewer } from './components/DashboardViewer';
export { DashboardGrid } from './components/DashboardGrid';
export { WidgetContainer } from './components/WidgetContainer';
export { WidgetToolbox } from './components/WidgetToolbox';
export { FilterBar } from './components/FilterBar';
export { DashboardHeader } from './components/DashboardHeader';
export { ShareDialog } from './components/ShareDialog';
export { ScheduleDialog } from './components/ScheduleDialog';
export { TemplateGallery } from './components/TemplateGallery';
export { DashboardEmbed } from './components/DashboardEmbed';

// === Widget Components ===
export { LineChartWidget } from './widgets/LineChartWidget';
export { BarChartWidget } from './widgets/BarChartWidget';
export { PieChartWidget } from './widgets/PieChartWidget';
export { AreaChartWidget } from './widgets/AreaChartWidget';
export { ScatterPlotWidget } from './widgets/ScatterPlotWidget';
export { KpiCardWidget } from './widgets/KpiCardWidget';
export { DataTableWidget } from './widgets/DataTableWidget';
export { MapWidget } from './widgets/MapWidget';
export { FunnelWidget } from './widgets/FunnelWidget';
export { HeatmapWidget } from './widgets/HeatmapWidget';
export { GaugeWidget } from './widgets/GaugeWidget';
export { SparklineWidget } from './widgets/SparklineWidget';
export { TextWidget } from './widgets/TextWidget';
export { ImageWidget } from './widgets/ImageWidget';

// === Hooks ===
export { useDashboard } from './hooks/useDashboard';
export { useWidget } from './hooks/useWidget';
export { useDashboardFilters } from './hooks/useDashboardFilters';
export { useWidgetData } from './hooks/useWidgetData';
export { useRealTimeWidget } from './hooks/useRealTimeWidget';
export { useDashboardPermissions } from './hooks/useDashboardPermissions';
export { useDashboardBuilder } from './hooks/useDashboardBuilder';
export { useWidgetDrag } from './hooks/useWidgetDrag';
export { useDashboardTemplates } from './hooks/useDashboardTemplates';

// === Core Types ===
export type {
  Dashboard,
  DashboardId,
  DashboardStatus,
  DashboardVisibility,
  DashboardMeta,
  CreateDashboardInput,
  UpdateDashboardInput,
} from './types/dashboard.types';

export type {
  Widget,
  WidgetId,
  WidgetType,
  WidgetConfig,
  WidgetPosition,
  WidgetSize,
  CreateWidgetInput,
  UpdateWidgetInput,
} from './types/widget.types';

export type {
  DataSource,
  DataSourceId,
  DataSourceType,
  DataSourceConfig,
  DataSourceQuery,
  DataBinding,
  DataBindingField,
} from './types/data-source.types';

export type {
  DashboardFilter,
  FilterId,
  FilterType,
  FilterValue,
  FilterConfig,
  GlobalFilterSet,
  CrossWidgetFilter,
} from './types/filter.types';

export type {
  DashboardTemplate,
  TemplateId,
  TemplateCategory,
  TemplateConfig,
} from './types/template.types';

export type {
  DashboardShare,
  ShareId,
  ShareType,
  SharePermission,
  EmbedConfig,
} from './types/share.types';

export type {
  DashboardSchedule,
  ScheduleId,
  ScheduleFrequency,
  ScheduleRecipient,
  SnapshotFormat,
} from './types/schedule.types';

export type {
  DashboardPermission,
  PermissionLevel,
  PermissionGrant,
} from './types/permission.types';

// === Schemas (Drizzle ORM) ===
export {
  dashboards,
  widgets,
  widgetDataSources,
  dashboardShares,
  dashboardSchedules,
  dashboardTemplates,
  dashboardFilters,
  dashboardPermissions,
  widgetSnapshots,
} from './schemas';

// === Error Classes ===
export {
  DashboardError,
  DashboardNotFoundError,
  WidgetNotFoundError,
  DataSourceConnectionError,
  DashboardPermissionError,
  WidgetRenderError,
  FilterValidationError,
  TemplateNotFoundError,
  ScheduleConfigError,
  ShareTokenExpiredError,
  SnapshotGenerationError,
  DashboardLimitExceededError,
  WidgetDataTimeoutError,
  InvalidLayoutError,
} from './errors';

// === Constants ===
export {
  WIDGET_TYPES,
  CHART_COLOR_PALETTES,
  DEFAULT_GRID_COLS,
  DEFAULT_GRID_ROW_HEIGHT,
  MAX_WIDGETS_PER_DASHBOARD,
  MAX_DASHBOARDS_PER_VENTURE,
  SNAPSHOT_FORMATS,
  FILTER_TYPES,
  SCHEDULE_FREQUENCIES,
  PERMISSION_LEVELS,
  TEMPLATE_CATEGORIES,
} from './constants';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       DASHBOARD PLATFORM                                │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       BUILDER UI LAYER                            │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌───────────┐  │  │
│  │  │ Dashboard   │  │  Widget     │  │ Filter   │  │ Template  │  │  │
│  │  │ Builder     │  │  Toolbox    │  │ Bar      │  │ Gallery   │  │  │
│  │  │ (DnD Grid)  │  │ (Library)   │  │          │  │           │  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └────┬─────┘  └─────┬─────┘  │  │
│  │         │                │               │              │         │  │
│  └─────────┼────────────────┼───────────────┼──────────────┼─────────┘  │
│            │                │               │              │            │
│  ┌─────────▼────────────────▼───────────────▼──────────────▼─────────┐  │
│  │                      LAYOUT ENGINE                                │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐│  │
│  │  │ Grid        │  │  Responsive  │  │  Collision   │  │ Widget ││  │
│  │  │ Manager     │  │  Breakpoint  │  │  Detection   │  │ Sizing ││  │
│  │  │ (react-     │  │  Handler     │  │  & Auto-     │  │ Rules  ││  │
│  │  │  grid-      │  │              │  │  Arrange     │  │        ││  │
│  │  │  layout)    │  │              │  │              │  │        ││  │
│  │  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └───┬────┘│  │
│  │         │                │                  │              │      │  │
│  └─────────┼────────────────┼──────────────────┼──────────────┼──────┘  │
│            │                │                  │              │         │
│  ┌─────────▼────────────────▼──────────────────▼──────────────▼──────┐  │
│  │                       DATA LAYER                                  │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐│  │
│  │  │ Data        │  │  Query       │  │  Real-Time   │  │ Cache  ││  │
│  │  │ Binding     │  │  Executor    │  │  Subscription│  │ Manager││  │
│  │  │ Resolver    │  │  (metrics,   │  │  (Supabase   │  │ (TTL + ││  │
│  │  │             │  │   SQL, API)  │  │   Realtime)  │  │  LRU)  ││  │
│  │  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └───┬────┘│  │
│  │         │                │                  │              │      │  │
│  └─────────┼────────────────┼──────────────────┼──────────────┼──────┘  │
│            │                │                  │              │         │
│  ┌─────────▼────────────────▼──────────────────▼──────────────▼──────┐  │
│  │                    WIDGET RENDERER                                │  │
│  │                                                                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ │  │
│  │  │  Charts  │ │  KPI     │ │  Tables  │ │  Maps  │ │ Special  │ │  │
│  │  │ (Nivo /  │ │  Cards   │ │ (Tanstack│ │(Mapbox)│ │ (Funnel, │ │  │
│  │  │ Recharts)│ │          │ │  Table)  │ │        │ │ Heatmap, │ │  │
│  │  │          │ │          │ │          │ │        │ │  Gauge)  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘ └──────────┘ │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                 PERSISTENCE & DISTRIBUTION                        │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  ┌───────────┐ │  │
│  │  │ Supabase    │  │ Snapshot    │  │ Share &   │  │ Schedule  │ │  │
│  │  │ Database    │  │ Generator   │  │ Embed     │  │ Runner    │ │  │
│  │  │ (Postgres)  │  │ (Puppeteer) │  │ Service   │  │ (Cron)    │ │  │
│  │  └─────────────┘  └─────────────┘  └───────────┘  └───────────┘ │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Interaction          Data Resolution             Rendering
─────────────────         ─────────────────           ──────────────

1. Builder/Viewer    ──►  2. Filter Service     ──►  5. Widget Renderer
   opens dashboard           resolves global          receives typed
                             + widget filters         data payloads

                        3. Data Binding Service ──►  6. Chart/Table/Map
                           resolves each widget's     component renders
                           data source config         with Recharts/Nivo

                        4. Query Executor       ──►  7. Real-time sub
                           fetches from metrics       pushes incremental
                           API, SQL, or REST          updates to widgets
```

### Multi-Tenant Data Isolation

```
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│   Venture A        │    │   Venture B        │    │   Consortium       │
│   Dashboards       │    │   Dashboards       │    │   Dashboards       │
│                    │    │                    │    │                    │
│  ┌──────────────┐  │    │  ┌──────────────┐  │    │  ┌──────────────┐  │
│  │ Sales Dash   │  │    │  │ Ops Dash     │  │    │  │ Portfolio    │  │
│  │ Marketing    │  │    │  │ Finance      │  │    │  │ Overview     │  │
│  │ Engineering  │  │    │  │ Growth       │  │    │  │ Cross-venture│  │
│  └──────┬───────┘  │    │  └──────┬───────┘  │    │  └──────┬───────┘  │
│         │          │    │         │          │    │         │          │
│  ┌──────▼───────┐  │    │  ┌──────▼───────┐  │    │  ┌──────▼───────┐  │
│  │ Venture A    │  │    │  │ Venture B    │  │    │  │ All Ventures │  │
│  │ Metrics Only │  │    │  │ Metrics Only │  │    │  │ Aggregated   │  │
│  └──────────────┘  │    │  └──────────────┘  │    │  └──────────────┘  │
└────────────────────┘    └────────────────────┘    └────────────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                   ┌──────────────▼──────────────┐
                   │   Supabase Postgres          │
                   │   (Row-Level Security)       │
                   │   venture_id scoped          │
                   └─────────────────────────────┘
```

---

## Core Interfaces

### DashboardService

The primary service for dashboard CRUD operations, orchestrating creation, updates, deletion, duplication, and retrieval of dashboards with their associated widgets.

```typescript
import { type TRPCContext } from '@mcv/trpc';

interface DashboardService {
  /**
   * Create a new dashboard within a venture.
   * Initializes an empty grid layout with default configuration.
   */
  create(
    ctx: TRPCContext,
    input: CreateDashboardInput,
  ): Promise<Dashboard>;

  /**
   * Retrieve a dashboard by ID, including all widgets and their configs.
   * Respects RLS — caller must have read access.
   */
  getById(
    ctx: TRPCContext,
    dashboardId: DashboardId,
  ): Promise<Dashboard | null>;

  /**
   * List dashboards accessible to the current user within a venture.
   * Includes dashboards owned by the user, shared with them, and
   * public dashboards within the venture.
   */
  list(
    ctx: TRPCContext,
    input: ListDashboardsInput,
  ): Promise<PaginatedResult<DashboardSummary>>;

  /**
   * Update dashboard metadata (title, description, tags, settings).
   * Does NOT update widget positions — use WidgetService for that.
   */
  update(
    ctx: TRPCContext,
    dashboardId: DashboardId,
    input: UpdateDashboardInput,
  ): Promise<Dashboard>;

  /**
   * Soft-delete a dashboard. Moves to trash for 30 days.
   * All associated widgets, shares, and schedules are deactivated.
   */
  delete(
    ctx: TRPCContext,
    dashboardId: DashboardId,
  ): Promise<void>;

  /**
   * Duplicate a dashboard including all widgets and their configurations.
   * Data source bindings are preserved; shares and schedules are NOT copied.
   */
  duplicate(
    ctx: TRPCContext,
    dashboardId: DashboardId,
    input: DuplicateDashboardInput,
  ): Promise<Dashboard>;

  /**
   * Create a dashboard from a template, pre-populating widgets
   * and layout according to the template definition.
   */
  createFromTemplate(
    ctx: TRPCContext,
    templateId: TemplateId,
    input: CreateFromTemplateInput,
  ): Promise<Dashboard>;

  /**
   * Update the full layout of a dashboard (all widget positions/sizes).
   * Validates layout constraints and collision rules.
   */
  updateLayout(
    ctx: TRPCContext,
    dashboardId: DashboardId,
    layout: WidgetPosition[],
  ): Promise<Dashboard>;

  /**
   * Archive a dashboard. Hidden from default lists but accessible
   * via direct link or archive view.
   */
  archive(ctx: TRPCContext, dashboardId: DashboardId): Promise<void>;

  /**
   * Restore an archived or soft-deleted dashboard.
   */
  restore(ctx: TRPCContext, dashboardId: DashboardId): Promise<Dashboard>;

  /**
   * Star/favorite a dashboard for the current user.
   */
  toggleFavorite(
    ctx: TRPCContext,
    dashboardId: DashboardId,
  ): Promise<{ favorited: boolean }>;

  /**
   * Get recently viewed dashboards for the current user.
   */
  getRecent(ctx: TRPCContext, limit?: number): Promise<DashboardSummary[]>;
}
```

### Dashboard

```typescript
interface Dashboard {
  /** Unique dashboard identifier (ULID) */
  id: DashboardId;

  /** Owning venture ID — null for consortium-level dashboards */
  ventureId: string | null;

  /** User who created this dashboard */
  createdBy: string;

  /** Dashboard title (max 200 chars) */
  title: string;

  /** Optional description (max 2000 chars) */
  description: string | null;

  /** URL-safe slug for shareable links */
  slug: string;

  /** Dashboard status */
  status: DashboardStatus;

  /** Visibility level */
  visibility: DashboardVisibility;

  /** Ordered list of widgets on this dashboard */
  widgets: Widget[];

  /** Active global filters */
  filters: DashboardFilter[];

  /** Grid layout settings */
  gridConfig: GridConfig;

  /** Dashboard-level settings */
  settings: DashboardSettings;

  /** Tags for organization and search */
  tags: string[];

  /** Dashboard thumbnail URL (auto-generated from snapshot) */
  thumbnailUrl: string | null;

  /** Metadata */
  meta: DashboardMeta;

  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  deletedAt: Date | null;
}

type DashboardId = string & { readonly __brand: 'DashboardId' };

type DashboardStatus = 'draft' | 'published' | 'archived' | 'deleted';

type DashboardVisibility =
  | 'private'       // Only creator and explicit shares
  | 'venture'       // All members of the owning venture
  | 'consortium'    // All consortium members
  | 'public';       // Anyone with the link (for embeds)

interface DashboardMeta {
  version: number;
  lastViewedAt: Date | null;
  viewCount: number;
  favoriteCount: number;
  widgetCount: number;
}

interface GridConfig {
  /** Number of columns in the grid (default: 12) */
  cols: number;
  /** Row height in pixels (default: 80) */
  rowHeight: number;
  /** Margin between widgets [horizontal, vertical] in pixels */
  margin: [number, number];
  /** Container padding [horizontal, vertical] in pixels */
  containerPadding: [number, number];
  /** Whether widgets can be compacted vertically */
  compactType: 'vertical' | 'horizontal' | null;
  /** Whether layout is locked (no drag/resize) */
  isLocked: boolean;
}

interface DashboardSettings {
  /** Auto-refresh interval in seconds (0 = disabled) */
  autoRefreshInterval: number;
  /** Theme override (null = inherit from user/system) */
  theme: 'light' | 'dark' | 'system' | null;
  /** Color palette for charts */
  colorPalette: string;
  /** Whether to show the filter bar */
  showFilterBar: boolean;
  /** Whether to show widget borders */
  showWidgetBorders: boolean;
  /** Default date range for new filters */
  defaultDateRange: DateRangePreset;
  /** Enable/disable real-time updates globally */
  realTimeEnabled: boolean;
  /** Background color override */
  backgroundColor: string | null;
}

type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'this_year'
  | 'last_year'
  | 'custom';

interface CreateDashboardInput {
  ventureId?: string | null;
  title: string;
  description?: string;
  visibility?: DashboardVisibility;
  gridConfig?: Partial<GridConfig>;
  settings?: Partial<DashboardSettings>;
  tags?: string[];
}

interface UpdateDashboardInput {
  title?: string;
  description?: string | null;
  visibility?: DashboardVisibility;
  gridConfig?: Partial<GridConfig>;
  settings?: Partial<DashboardSettings>;
  tags?: string[];
  status?: DashboardStatus;
}

interface ListDashboardsInput {
  ventureId?: string | null;
  status?: DashboardStatus[];
  visibility?: DashboardVisibility[];
  tags?: string[];
  search?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  favoritesOnly?: boolean;
}

interface DashboardSummary {
  id: DashboardId;
  ventureId: string | null;
  title: string;
  description: string | null;
  slug: string;
  status: DashboardStatus;
  visibility: DashboardVisibility;
  widgetCount: number;
  thumbnailUrl: string | null;
  tags: string[];
  isFavorited: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Widget

```typescript
interface Widget {
  /** Unique widget identifier (ULID) */
  id: WidgetId;
  /** Parent dashboard ID */
  dashboardId: DashboardId;
  /** Widget type determines the renderer */
  type: WidgetType;
  /** Display title shown in widget header */
  title: string;
  /** Optional subtitle or description */
  subtitle: string | null;
  /** Position and size on the grid */
  position: WidgetPosition;
  /** Type-specific configuration */
  config: WidgetConfig;
  /** Data source binding(s) */
  dataSources: DataBinding[];
  /** Widget-level filter overrides */
  filterOverrides: WidgetFilterOverride[];
  /** Visual styling overrides */
  style: WidgetStyle;
  /** Whether this widget subscribes to real-time updates */
  realTimeEnabled: boolean;
  /** Display order within the dashboard (for accessibility) */
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

type WidgetId = string & { readonly __brand: 'WidgetId' };

type WidgetType =
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'area_chart'
  | 'scatter_plot'
  | 'kpi_card'
  | 'data_table'
  | 'map'
  | 'funnel'
  | 'heatmap'
  | 'gauge'
  | 'sparkline'
  | 'text'
  | 'image'
  | 'custom';

interface WidgetPosition {
  /** Widget ID (used by react-grid-layout) */
  i: string;
  /** Column position (0-indexed) */
  x: number;
  /** Row position (0-indexed) */
  y: number;
  /** Width in grid units */
  w: number;
  /** Height in grid units */
  h: number;
  /** Minimum width */
  minW?: number;
  /** Minimum height */
  minH?: number;
  /** Maximum width */
  maxW?: number;
  /** Maximum height */
  maxH?: number;
  /** Whether this widget is static (cannot be moved/resized) */
  static?: boolean;
}

interface WidgetStyle {
  backgroundColor?: string;
  borderColor?: string;
  showHeader: boolean;
  headerBackgroundColor?: string;
  padding: number;
  borderRadius: number;
  shadow: 'none' | 'sm' | 'md' | 'lg';
  opacity: number;
}

interface WidgetFilterOverride {
  filterId: FilterId;
  overrideValue: FilterValue | null;
  ignored: boolean;
}
```

### WidgetConfig

Discriminated union of type-specific widget configurations:

```typescript
type WidgetConfig =
  | LineChartConfig
  | BarChartConfig
  | PieChartConfig
  | AreaChartConfig
  | ScatterPlotConfig
  | KpiCardConfig
  | DataTableConfig
  | MapConfig
  | FunnelConfig
  | HeatmapConfig
  | GaugeConfig
  | SparklineConfig
  | TextConfig
  | ImageConfig
  | CustomWidgetConfig;

// --- Chart Configs ---

interface LineChartConfig {
  type: 'line_chart';
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  series: SeriesConfig[];
  showDots: boolean;
  curve: 'linear' | 'monotone' | 'step' | 'natural';
  showArea: boolean;
  zoomable: boolean;
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'left' | 'right';
  showTooltip: boolean;
  showGrid: boolean;
  yAxisDomain?: [number | 'auto', number | 'auto'];
  annotations: ChartAnnotation[];
}

interface BarChartConfig {
  type: 'bar_chart';
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  series: SeriesConfig[];
  layout: 'grouped' | 'stacked' | 'percentage';
  horizontal: boolean;
  borderRadius: number;
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'left' | 'right';
  showTooltip: boolean;
  showGrid: boolean;
  showValues: boolean;
  annotations: ChartAnnotation[];
}

interface PieChartConfig {
  type: 'pie_chart';
  categoryField: string;
  valueField: string;
  innerRadius: number;
  padAngle: number;
  showLabels: boolean;
  labelType: 'value' | 'percent' | 'name';
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'left' | 'right';
  showTooltip: boolean;
  sortByValue: boolean;
  maxSlices: number;
}

interface AreaChartConfig {
  type: 'area_chart';
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  series: SeriesConfig[];
  stacked: boolean;
  curve: 'linear' | 'monotone' | 'step' | 'natural';
  fillOpacity: number;
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'left' | 'right';
  showTooltip: boolean;
  showGrid: boolean;
  annotations: ChartAnnotation[];
}

interface ScatterPlotConfig {
  type: 'scatter_plot';
  xAxis: AxisConfig;
  yAxis: AxisConfig;
  xField: string;
  yField: string;
  sizeField?: string;
  colorField?: string;
  showTrendLine: boolean;
  trendLineType: 'linear' | 'polynomial' | 'logarithmic';
  showLegend: boolean;
  showTooltip: boolean;
  showGrid: boolean;
  markerSize: number;
}

// --- Card & Table Configs ---

interface KpiCardConfig {
  type: 'kpi_card';
  valueField: string;
  format: KpiFormat;
  prefix: string;
  suffix: string;
  decimals: number;
  comparisonField: string | null;
  comparisonType: 'previous_period' | 'same_period_last_year' | 'custom' | null;
  trendDirection: 'up_is_good' | 'down_is_good' | 'neutral';
  showSparkline: boolean;
  sparklineField: string | null;
  icon: string | null;
  targetValue: number | null;
  showTarget: boolean;
}

type KpiFormat = 'number' | 'currency' | 'percent' | 'duration' | 'compact';

interface DataTableConfig {
  type: 'data_table';
  columns: TableColumnConfig[];
  paginated: boolean;
  pageSize: number;
  sortable: boolean;
  defaultSort: { field: string; direction: 'asc' | 'desc' } | null;
  filterable: boolean;
  selectable: boolean;
  resizable: boolean;
  showRowNumbers: boolean;
  exportable: boolean;
  rowStyles: ConditionalStyle[];
  dense: boolean;
  textOverflow: 'wrap' | 'truncate' | 'ellipsis';
}

interface TableColumnConfig {
  field: string;
  header: string;
  width?: number;
  minWidth?: number;
  align: 'left' | 'center' | 'right';
  format?: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'boolean' | 'link';
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  cellStyles?: ConditionalStyle[];
}

// --- Specialized Configs ---

interface MapConfig {
  type: 'map';
  mapStyle: 'streets' | 'satellite' | 'light' | 'dark' | 'outdoors';
  center: [number, number];
  zoom: number;
  latField: string;
  lngField: string;
  labelField: string | null;
  valueField: string | null;
  markerType: 'point' | 'heatmap' | 'cluster';
  showControls: boolean;
  showLegend: boolean;
}

interface FunnelConfig {
  type: 'funnel';
  stageField: string;
  valueField: string;
  showConversionRates: boolean;
  showPercentages: boolean;
  direction: 'vertical' | 'horizontal';
  colorScheme: 'sequential' | 'diverging' | 'custom';
  showLabels: boolean;
}

interface HeatmapConfig {
  type: 'heatmap';
  xField: string;
  yField: string;
  valueField: string;
  colorScale: 'sequential' | 'diverging';
  minColor: string;
  maxColor: string;
  showValues: boolean;
  showXLabels: boolean;
  showYLabels: boolean;
}

interface GaugeConfig {
  type: 'gauge';
  valueField: string;
  minValue: number;
  maxValue: number;
  zones: GaugeZone[];
  showValue: boolean;
  format: KpiFormat;
  prefix: string;
  suffix: string;
  style: 'needle' | 'fill' | 'arc';
}

interface GaugeZone {
  from: number;
  to: number;
  color: string;
  label?: string;
}

interface SparklineConfig {
  type: 'sparkline';
  valueField: string;
  curve: 'linear' | 'monotone' | 'step';
  showArea: boolean;
  color: string;
  height: number;
}

interface TextConfig {
  type: 'text';
  content: string;
  align: 'left' | 'center' | 'right';
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
}

interface ImageConfig {
  type: 'image';
  src: string;
  alt: string;
  fit: 'cover' | 'contain' | 'fill';
  linkUrl: string | null;
}

interface CustomWidgetConfig {
  type: 'custom';
  componentId: string;
  props: Record<string, unknown>;
}

// --- Shared Sub-types ---

interface AxisConfig {
  field: string;
  label: string;
  type: 'category' | 'number' | 'time';
  format?: string;
  tickCount?: number;
  tickRotation?: number;
}

interface SeriesConfig {
  field: string;
  label: string;
  color?: string;
  type?: 'solid' | 'dashed' | 'dotted';
  yAxisId?: 'left' | 'right';
}

interface ChartAnnotation {
  type: 'line' | 'band';
  axis: 'x' | 'y';
  value: number;
  endValue?: number;
  label: string;
  color: string;
  dashStyle?: 'solid' | 'dashed';
}

interface ConditionalStyle {
  condition: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'contains';
    value: unknown;
    endValue?: unknown;
  };
  style: {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
    icon?: string;
  };
}
```

### DataSource

```typescript
interface DataSource {
  id: DataSourceId;
  name: string;
  type: DataSourceType;
  config: DataSourceConfig;
  schema: DataFieldSchema[];
  cacheTtl: number;
  supportsRealTime: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type DataSourceId = string & { readonly __brand: 'DataSourceId' };

type DataSourceType =
  | 'metric'       // @mcv/analytics/metrics metric query
  | 'sql'          // Raw SQL query (read-only, parameterized)
  | 'api'          // REST API endpoint
  | 'supabase'     // Direct Supabase table/view query
  | 'static';      // Static/inline data

type DataSourceConfig =
  | MetricDataSourceConfig
  | SqlDataSourceConfig
  | ApiDataSourceConfig
  | SupabaseDataSourceConfig
  | StaticDataSourceConfig;

interface MetricDataSourceConfig {
  type: 'metric';
  metricKey: string;
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'last';
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  groupBy?: string[];
  where?: Record<string, unknown>;
}

interface SqlDataSourceConfig {
  type: 'sql';
  query: string;
  parameters: SqlParameter[];
  timeoutMs: number;
  maxRows: number;
}

interface SqlParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  binding:
    | { type: 'filter'; filterId: FilterId }
    | { type: 'static'; value: unknown };
}

interface ApiDataSourceConfig {
  type: 'api';
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  dataPath: string;
  auth: 'none' | 'bearer' | 'api_key';
  authCredentialId?: string;
  pollInterval?: number;
}

interface SupabaseDataSourceConfig {
  type: 'supabase';
  table: string;
  select: string;
  filters?: SupabaseFilter[];
  orderBy?: { column: string; ascending: boolean }[];
  limit?: number;
  realtimeEnabled?: boolean;
}

interface SupabaseFilter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
  value: unknown;
  filterBinding?: FilterId;
}

interface StaticDataSourceConfig {
  type: 'static';
  data: Record<string, unknown>[];
}

interface DataBinding {
  id: string;
  dataSourceId: DataSourceId;
  role: 'primary' | 'comparison' | 'target' | 'auxiliary';
  fieldMappings: DataBindingField[];
  transforms?: DataTransform[];
}

interface DataBindingField {
  sourceField: string;
  targetField: string;
  coerce?: 'string' | 'number' | 'date' | 'boolean';
}

interface DataTransform {
  type: 'filter' | 'sort' | 'limit' | 'aggregate' | 'compute' | 'pivot';
  config: Record<string, unknown>;
}

interface DataFieldSchema {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object' | 'array';
  nullable: boolean;
  description?: string;
}
```

### DashboardFilter

```typescript
interface DashboardFilter {
  id: FilterId;
  dashboardId: DashboardId;
  type: FilterType;
  label: string;
  config: FilterConfig;
  value: FilterValue;
  defaultValue: FilterValue;
  displayOrder: number;
  required: boolean;
  isGlobal: boolean;
  targetWidgetIds: WidgetId[];
  createdAt: Date;
  updatedAt: Date;
}

type FilterId = string & { readonly __brand: 'FilterId' };

type FilterType =
  | 'date_range'
  | 'single_select'
  | 'multi_select'
  | 'text'
  | 'number_range'
  | 'venture'
  | 'department'
  | 'user'
  | 'boolean'
  | 'custom';

type FilterValue =
  | DateRangeValue
  | SingleSelectValue
  | MultiSelectValue
  | TextValue
  | NumberRangeValue
  | BooleanValue
  | null;

interface DateRangeValue {
  type: 'date_range';
  preset: DateRangePreset | null;
  startDate: string;
  endDate: string;
  timezone: string;
}

interface SingleSelectValue {
  type: 'single_select';
  selected: string | null;
}

interface MultiSelectValue {
  type: 'multi_select';
  selected: string[];
}

interface TextValue {
  type: 'text';
  value: string;
}

interface NumberRangeValue {
  type: 'number_range';
  min: number | null;
  max: number | null;
}

interface BooleanValue {
  type: 'boolean';
  value: boolean;
}

interface CrossWidgetFilter {
  sourceWidgetId: WidgetId;
  trigger: 'click' | 'select';
  sourceField: string;
  targets: {
    widgetId: WidgetId;
    targetField: string;
  }[];
}
```

### DashboardTemplate

```typescript
interface DashboardTemplate {
  id: TemplateId;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnailUrl: string;
  previewUrls: string[];
  isSystem: boolean;
  ventureId: string | null;
  config: TemplateConfig;
  variables: TemplateVariable[];
  tags: string[];
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

type TemplateId = string & { readonly __brand: 'TemplateId' };

type TemplateCategory =
  | 'executive'
  | 'sales'
  | 'marketing'
  | 'engineering'
  | 'finance'
  | 'operations'
  | 'hr'
  | 'product'
  | 'customer_success'
  | 'custom';

interface TemplateConfig {
  gridConfig: GridConfig;
  settings: DashboardSettings;
  widgets: TemplateWidgetConfig[];
  filters: Omit<DashboardFilter, 'id' | 'dashboardId' | 'createdAt' | 'updatedAt'>[];
}

interface TemplateWidgetConfig {
  refKey: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  position: Omit<WidgetPosition, 'i'>;
  config: WidgetConfig;
  style?: Partial<WidgetStyle>;
  realTimeEnabled?: boolean;
  dataSourceTemplate: DataSourceTemplate;
}

interface DataSourceTemplate {
  type: DataSourceType;
  config: Record<string, unknown>;
  fieldMappings: DataBindingField[];
}

interface TemplateVariable {
  key: string;
  label: string;
  type: 'string' | 'number' | 'venture' | 'metric_key';
  defaultValue?: string;
  required: boolean;
  description?: string;
}
```

### DashboardShare & DashboardSchedule

```typescript
interface DashboardShare {
  id: ShareId;
  dashboardId: DashboardId;
  type: ShareType;
  targetId: string | null;
  permission: SharePermission;
  token: string | null;
  expiresAt: Date | null;
  embedConfig: EmbedConfig | null;
  passwordHash: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

type ShareId = string & { readonly __brand: 'ShareId' };
type ShareType = 'user' | 'team' | 'venture' | 'link' | 'embed';
type SharePermission = 'view' | 'edit' | 'admin';

interface EmbedConfig {
  allowedDomains: string[];
  showTitle: boolean;
  showFilters: boolean;
  showWidgetHeaders: boolean;
  customClass?: string;
  width: number | null;
  height: number | null;
  theme: 'light' | 'dark' | 'system';
}

interface DashboardSchedule {
  id: ScheduleId;
  dashboardId: DashboardId;
  name: string;
  cronExpression: string;
  timezone: string;
  frequency: ScheduleFrequency;
  format: SnapshotFormat;
  recipients: ScheduleRecipient[];
  filterValues: Record<FilterId, FilterValue>;
  subjectTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
  lastRunAt: Date | null;
  lastRunStatus: 'success' | 'failure' | 'skipped' | null;
  nextRunAt: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

type ScheduleId = string & { readonly __brand: 'ScheduleId' };

type ScheduleFrequency =
  | { type: 'daily'; time: string }
  | { type: 'weekly'; day: number; time: string }
  | { type: 'monthly'; dayOfMonth: number; time: string }
  | { type: 'custom'; cronExpression: string };

type SnapshotFormat = 'pdf' | 'png' | 'html';

interface ScheduleRecipient {
  type: 'user' | 'email' | 'team' | 'webhook';
  target: string;
  formatOverride?: SnapshotFormat;
}
```

---

## Database Schemas

### dashboards

```typescript
import { pgTable, text, timestamp, integer, jsonb, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ulid } from '@mcv/ids';

export const dashboardStatusEnum = pgEnum('dashboard_status', [
  'draft', 'published', 'archived', 'deleted',
]);

export const dashboardVisibilityEnum = pgEnum('dashboard_visibility', [
  'private', 'venture', 'consortium', 'public',
]);

export const dashboards = pgTable(
  'analytics_dashboards',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),

    ventureId: text('venture_id').references(() => ventures.id, {
      onDelete: 'cascade',
    }),

    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),

    title: text('title').notNull(),
    description: text('description'),
    slug: text('slug').notNull(),

    status: dashboardStatusEnum('status').notNull().default('draft'),
    visibility: dashboardVisibilityEnum('visibility').notNull().default('private'),

    gridConfig: jsonb('grid_config').notNull().$type<GridConfig>().default({
      cols: 12,
      rowHeight: 80,
      margin: [16, 16],
      containerPadding: [16, 16],
      compactType: 'vertical',
      isLocked: false,
    }),

    settings: jsonb('settings').notNull().$type<DashboardSettings>().default({
      autoRefreshInterval: 0,
      theme: null,
      colorPalette: 'default',
      showFilterBar: true,
      showWidgetBorders: true,
      defaultDateRange: 'last_30_days',
      realTimeEnabled: false,
      backgroundColor: null,
    }),

    tags: jsonb('tags').notNull().$type<string[]>().default([]),
    thumbnailUrl: text('thumbnail_url'),

    version: integer('version').notNull().default(1),
    viewCount: integer('view_count').notNull().default(0),
    favoriteCount: integer('favorite_count').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    ventureIdx: index('idx_dashboards_venture').on(table.ventureId),
    createdByIdx: index('idx_dashboards_created_by').on(table.createdBy),
    statusIdx: index('idx_dashboards_status').on(table.status),
    slugUniqueIdx: uniqueIndex('idx_dashboards_slug_unique').on(
      table.ventureId, table.slug,
    ),
    tagsIdx: index('idx_dashboards_tags').using('gin', table.tags),
    deletedAtIdx: index('idx_dashboards_deleted_at').on(table.deletedAt),
    searchIdx: index('idx_dashboards_search').using(
      'gin',
      sql`to_tsvector('english', ${table.title} || ' ' || coalesce(${table.description}, ''))`,
    ),
  }),
);
```

### widgets

```typescript
export const widgetTypeEnum = pgEnum('widget_type', [
  'line_chart', 'bar_chart', 'pie_chart', 'area_chart', 'scatter_plot',
  'kpi_card', 'data_table', 'map', 'funnel', 'heatmap',
  'gauge', 'sparkline', 'text', 'image', 'custom',
]);

export const widgets = pgTable(
  'analytics_widgets',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),

    dashboardId: text('dashboard_id')
      .notNull()
      .references(() => dashboards.id, { onDelete: 'cascade' }),

    type: widgetTypeEnum('type').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),

    position: jsonb('position').notNull().$type<WidgetPosition>(),
    config: jsonb('config').notNull().$type<WidgetConfig>(),
    style: jsonb('style').notNull().$type<WidgetStyle>().default({
      showHeader: true,
      padding: 16,
      borderRadius: 8,
      shadow: 'sm',
      opacity: 1,
    }),

    filterOverrides: jsonb('filter_overrides')
      .notNull()
      .$type<WidgetFilterOverride[]>()
      .default([]),

    realTimeEnabled: integer('real_time_enabled').notNull().default(0),
    displayOrder: integer('display_order').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    dashboardIdx: index('idx_widgets_dashboard').on(table.dashboardId),
    typeIdx: index('idx_widgets_type').on(table.type),
    dashboardOrderIdx: index('idx_widgets_dashboard_order').on(
      table.dashboardId, table.displayOrder,
    ),
  }),
);
```

### widget_data_sources

```typescript
export const dataSourceTypeEnum = pgEnum('data_source_type', [
  'metric', 'sql', 'api', 'supabase', 'static',
]);

export const dataBindingRoleEnum = pgEnum('data_binding_role', [
  'primary', 'comparison', 'target', 'auxiliary',
]);

export const widgetDataSources = pgTable(
  'analytics_widget_data_sources',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),

    widgetId: text('widget_id')
      .notNull()
      .references(() => widgets.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    type: dataSourceTypeEnum('type').notNull(),

    config: jsonb('config').notNull().$type<DataSourceConfig>(),
    schema: jsonb('schema').notNull().$type<DataFieldSchema[]>().default([]),

    role: dataBindingRoleEnum('role').notNull().default('primary'),
    fieldMappings: jsonb('field_mappings')
      .notNull()
      .$type<DataBindingField[]>()
      .default([]),

    transforms: jsonb('transforms').$type<DataTransform[]>(),

    cacheTtl: integer('cache_ttl').notNull().default(300),
    supportsRealTime: integer('supports_real_time').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    widgetIdx: index('idx_wds_widget').on(table.widgetId),
    typeIdx: index('idx_wds_type').on(table.type),
  }),
);
```

### dashboard_shares

```typescript
export const shareTypeEnum = pgEnum('share_type', [
  'user', 'team', 'venture', 'link', 'embed',
]);

export const sharePermissionEnum = pgEnum('share_permission', [
  'view', 'edit', 'admin',
]);

export const dashboardShares = pgTable(
  'analytics_dashboard_shares',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),

    dashboardId: text('dashboard_id')
      .notNull()
      .references(() => dashboards.id, { onDelete: 'cascade' }),

    type: shareTypeEnum('type').notNull(),
    targetId: text('target_id'),
    permission: sharePermissionEnum('permission').notNull().default('view'),

    token: text('token'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    embedConfig: jsonb('embed_config').$type<EmbedConfig>(),
    passwordHash: text('password_hash'),

    isActive: integer('is_active').notNull().default(1),

    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    dashboardIdx: index('idx_shares_dashboard').on(table.dashboardId),
    tokenIdx: uniqueIndex('idx_shares_token').on(table.token),
    targetIdx: index('idx_shares_target').on(table.type, table.targetId),
    activeIdx: index('idx_shares_active').on(table.dashboardId, table.isActive),
  }),
);
```

### dashboard_schedules

```typescript
export const snapshotFormatEnum = pgEnum('snapshot_format', ['pdf', 'png', 'html']);

export const scheduleRunStatusEnum = pgEnum('schedule_run_status', [
  'success', 'failure', 'skipped',
]);

export const dashboardSchedules = pgTable(
  'analytics_dashboard_schedules',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),

    dashboardId: text('dashboard_id')
      .notNull()
      .references(() => dashboards.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    cronExpression: text('cron_expression').notNull(),
    timezone: text('timezone').notNull().default('UTC'),
    frequency: jsonb('frequency').notNull().$type<ScheduleFrequency>(),
    format: snapshotFormatEnum('format').notNull().default('pdf'),

    recipients: jsonb('recipients')
      .notNull()
      .$type<ScheduleRecipient[]>()
      .default([]),

    filterValues: jsonb('filter_values')
      .notNull()
      .$type<Record<string, FilterValue>>()
      .default({}),

    subjectTemplate: text('subject_template')
      .notNull()
      .default('Dashboard Report: {{dashboardTitle}}'),

    bodyTemplate: text('body_template')
      .notNull()
      .default('Please find the latest snapshot for **{{dashboardTitle}}**.'),

    isActive: integer('is_active').notNull().default(1),

    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    lastRunStatus: scheduleRunStatusEnum('last_run_status'),
    lastRunError: text('last_run_error'),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull(),

    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    dashboardIdx: index('idx_schedules_dashboard').on(table.dashboardId),
    nextRunIdx: index('idx_schedules_next_run').on(table.nextRunAt),
    activeIdx: index('idx_schedules_active').on(table.isActive, table.nextRunAt),
  }),
);
```

### dashboard_templates

```typescript
export const templateCategoryEnum = pgEnum('template_category', [
  'executive', 'sales', 'marketing', 'engineering', 'finance',
  'operations', 'hr', 'product', 'customer_success', 'custom',
]);

export const dashboardTemplates = pgTable(
  'analytics_dashboard_templates',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),

    name: text('name').notNull(),
    description: text('description').notNull(),
    category: templateCategoryEnum('category').notNull(),

    thumbnailUrl: text('thumbnail_url').notNull(),
    previewUrls: jsonb('preview_urls').notNull().$type<string[]>().default([]),

    isSystem: integer('is_system').notNull().default(0),
    ventureId: text('venture_id').references(() => ventures.id, {
      onDelete: 'cascade',
    }),

    config: jsonb('config').notNull().$type<TemplateConfig>(),
    variables: jsonb('variables').notNull().$type<TemplateVariable[]>().default([]),

    tags: jsonb('tags').notNull().$type<string[]>().default([]),
    useCount: integer('use_count').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index('idx_templates_category').on(table.category),
    systemIdx: index('idx_templates_system').on(table.isSystem),
    ventureIdx: index('idx_templates_venture').on(table.ventureId),
    useCountIdx: index('idx_templates_use_count').on(table.useCount),
    tagsIdx: index('idx_templates_tags').using('gin', table.tags),
  }),
);
```

### dashboard_filters

```typescript
export const filterTypeEnum = pgEnum('filter_type', [
  'date_range', 'single_select', 'multi_select', 'text',
  'number_range', 'venture', 'department', 'user', 'boolean', 'custom',
]);

export const dashboardFilters = pgTable(
  'analytics_dashboard_filters',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),

    dashboardId: text('dashboard_id')
      .notNull()
      .references(() => dashboards.id, { onDelete: 'cascade' }),

    type: filterTypeEnum('type').notNull(),
    label: text('label').notNull(),

    config: jsonb('config').notNull().$type<FilterConfig>(),
    value: jsonb('value').$type<FilterValue>(),
    defaultValue: jsonb('default_value').$type<FilterValue>(),

    displayOrder: integer('display_order').notNull().default(0),
    required: integer('required').notNull().default(0),
    isGlobal: integer('is_global').notNull().default(1),
    targetWidgetIds: jsonb('target_widget_ids')
      .notNull()
      .$type<string[]>()
      .default([]),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    dashboardIdx: index('idx_filters_dashboard').on(table.dashboardId),
    dashboardOrderIdx: index('idx_filters_dashboard_order').on(
      table.dashboardId, table.displayOrder,
    ),
  }),
);
```

### dashboard_permissions

```typescript
export const permissionLevelEnum = pgEnum('permission_level', [
  'viewer', 'editor', 'admin', 'owner',
]);

export const permissionSubjectTypeEnum = pgEnum('permission_subject_type', [
  'user', 'team', 'role',
]);

export const dashboardPermissions = pgTable(
  'analytics_dashboard_permissions',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),

    dashboardId: text('dashboard_id')
      .notNull()
      .references(() => dashboards.id, { onDelete: 'cascade' }),

    subjectType: permissionSubjectTypeEnum('subject_type').notNull(),
    subjectId: text('subject_id').notNull(),
    level: permissionLevelEnum('level').notNull(),

    widgetRestrictions: jsonb('widget_restrictions')
      .notNull()
      .$type<WidgetPermission[]>()
      .default([]),

    grantedBy: text('granted_by')
      .notNull()
      .references(() => users.id),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    dashboardIdx: index('idx_perms_dashboard').on(table.dashboardId),
    subjectIdx: index('idx_perms_subject').on(table.subjectType, table.subjectId),
    uniqueGrant: uniqueIndex('idx_perms_unique_grant').on(
      table.dashboardId, table.subjectType, table.subjectId,
    ),
  }),
);
```

### widget_snapshots

```typescript
export const widgetSnapshots = pgTable(
  'analytics_widget_snapshots',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),

    dashboardId: text('dashboard_id')
      .notNull()
      .references(() => dashboards.id, { onDelete: 'cascade' }),

    scheduleId: text('schedule_id')
      .references(() => dashboardSchedules.id, { onDelete: 'set null' }),

    format: snapshotFormatEnum('format').notNull(),
    fileUrl: text('file_url').notNull(),
    fileSize: integer('file_size').notNull(),

    filterValues: jsonb('filter_values')
      .notNull()
      .$type<Record<string, FilterValue>>()
      .default({}),

    generationTimeMs: integer('generation_time_ms').notNull(),
    widgetCount: integer('widget_count').notNull(),
    errorCount: integer('error_count').notNull().default(0),
    errors: jsonb('errors').$type<{ widgetId: string; error: string }[]>(),

    createdBy: text('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => ({
    dashboardIdx: index('idx_snapshots_dashboard').on(table.dashboardId),
    scheduleIdx: index('idx_snapshots_schedule').on(table.scheduleId),
    createdAtIdx: index('idx_snapshots_created_at').on(table.createdAt),
    expiresIdx: index('idx_snapshots_expires').on(table.expiresAt),
  }),
);
```

---

## Widget Library

### Widget Type Reference

| Widget Type | Library | Min Size | Default Size | Real-Time | Description |
|---|---|---|---|---|---|
| `line_chart` | Recharts | 3×2 | 6×3 | ✅ | Time series, trends, multi-line comparisons |
| `bar_chart` | Recharts | 3×2 | 6×3 | ✅ | Categorical comparisons, stacked, grouped |
| `pie_chart` | Nivo | 3×3 | 4×4 | ✅ | Proportional data, donut charts |
| `area_chart` | Recharts | 3×2 | 6×3 | ✅ | Stacked area, stream graphs |
| `scatter_plot` | Recharts | 4×3 | 6×4 | ❌ | Correlation analysis, distributions |
| `kpi_card` | Custom | 2×1 | 3×2 | ✅ | Single metric with trend, sparkline, target |
| `data_table` | TanStack | 4×3 | 8×4 | ✅ | Tabular data, sortable, filterable |
| `map` | Mapbox GL | 4×3 | 6×4 | ✅ | Geographic markers, heatmaps, clusters |
| `funnel` | Nivo | 3×3 | 4×4 | ❌ | Conversion funnels, pipeline stages |
| `heatmap` | Nivo | 4×3 | 6×4 | ❌ | Two-dimensional categorical mapping |
| `gauge` | Custom | 2×2 | 3×3 | ✅ | Progress toward goal, threshold zones |
| `sparkline` | Recharts | 2×1 | 3×1 | ✅ | Compact inline trend visualization |
| `text` | @mcv/ui | 2×1 | 4×2 | ❌ | Markdown annotations, headings |
| `image` | Native | 2×2 | 4×3 | ❌ | Static images, logos, diagrams |
| `custom` | Plugin | 2×2 | 4×3 | Varies | Venture-specific custom widgets |

### Widget Component API

Every widget follows a consistent props contract:

```typescript
interface WidgetComponentProps<TConfig extends WidgetConfig> {
  widget: Widget;
  config: TConfig;
  data: Record<string, unknown>[];
  isLoading: boolean;
  error: string | null;
  activeFilters: DashboardFilter[];
  onInteraction?: (event: WidgetInteractionEvent) => void;
  width: number;
  height: number;
  isEditing: boolean;
  colorPalette: string[];
}

interface WidgetInteractionEvent {
  type: 'click' | 'select' | 'hover' | 'zoom';
  widgetId: WidgetId;
  dataPoints: Record<string, unknown>[];
  field: string;
  value: unknown;
}
```

---

## Data Binding System

### DataBindingService

```typescript
interface DataBindingService {
  /**
   * Resolve all data bindings for a widget, applying current filter values.
   */
  resolveWidgetData(
    ctx: TRPCContext,
    widget: Widget,
    filters: DashboardFilter[],
  ): Promise<ResolvedWidgetData>;

  /**
   * Resolve data for all widgets on a dashboard in parallel.
   * Deduplicates identical data source queries automatically.
   */
  resolveDashboardData(
    ctx: TRPCContext,
    dashboard: Dashboard,
  ): Promise<Map<WidgetId, ResolvedWidgetData>>;

  /**
   * Preview data for a data source configuration (used in builder).
   */
  previewData(
    ctx: TRPCContext,
    config: DataSourceConfig,
    limit?: number,
  ): Promise<{ data: Record<string, unknown>[]; schema: DataFieldSchema[] }>;

  /**
   * Validate a data binding configuration.
   */
  validateBinding(
    ctx: TRPCContext,
    binding: CreateDataBindingInput,
  ): Promise<ValidationResult>;

  /**
   * Subscribe to real-time data updates for a widget.
   */
  subscribe(
    ctx: TRPCContext,
    widget: Widget,
    filters: DashboardFilter[],
    onData: (data: ResolvedWidgetData) => void,
    onError: (error: Error) => void,
  ): () => void;

  /** Invalidate cached data for a data source. */
  invalidateCache(dataSourceId: DataSourceId): Promise<void>;

  /** Invalidate all cached data for a dashboard. */
  invalidateDashboardCache(dashboardId: DashboardId): Promise<void>;
}

interface ResolvedWidgetData {
  primary: Record<string, unknown>[];
  comparison?: Record<string, unknown>[];
  target?: Record<string, unknown>[];
  auxiliary?: Record<string, Record<string, unknown>[]>;
  meta: {
    fetchedAt: Date;
    cachedUntil: Date | null;
    rowCount: number;
    queryTimeMs: number;
    fromCache: boolean;
  };
}

interface ValidationResult {
  valid: boolean;
  errors: { field: string; message: string; code: string }[];
  warnings: { field: string; message: string }[];
}
```

---

## Real-Time Updates

Real-time updates are powered by Supabase Realtime subscriptions and provide live data streaming to operational dashboards.

```
┌────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Supabase      │────►│  Realtime        │────►│  Widget        │
│  Database      │     │  Subscription    │     │  Renderer      │
│  (INSERT/      │     │  Manager         │     │  (re-renders   │
│   UPDATE/      │     │  (per-widget     │     │   with new     │
│   DELETE)      │     │   subscriptions) │     │   data)        │
└────────────────┘     └──────────────────┘     └────────────────┘
                              │
                       ┌──────▼──────┐
                       │  Update     │
                       │  Throttler  │
                       │  (debounce  │
                       │   & batch)  │
                       └─────────────┘
```

### useRealTimeWidget Hook

```typescript
function useRealTimeWidget(
  widget: Widget,
  filters: DashboardFilter[],
  options?: {
    /** Throttle updates to avoid excessive re-renders (ms) */
    throttleMs?: number;       // default: 1000
    /** Buffer updates and batch apply */
    batchUpdates?: boolean;    // default: true
    /** Pause when widget is not visible */
    pauseWhenHidden?: boolean; // default: true
  },
): {
  data: ResolvedWidgetData | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'active' | 'paused' | 'error' | 'closed';
  lastUpdateAt: Date | null;
  updateCount: number;
  error: Error | null;
  refresh: () => Promise<void>;
  pause: () => void;
  resume: () => void;
};
```

---

## Dashboard Builder

### useDashboardBuilder Hook

```typescript
function useDashboardBuilder(dashboardId: DashboardId): {
  // Dashboard state
  dashboard: Dashboard | null;
  isLoading: boolean;
  error: Error | null;

  // Edit state
  isDirty: boolean;
  undoStack: DashboardSnapshot[];
  redoStack: DashboardSnapshot[];

  // Widget operations
  addWidget: (input: CreateWidgetInput) => Promise<Widget>;
  updateWidget: (widgetId: WidgetId, input: UpdateWidgetInput) => Promise<void>;
  removeWidget: (widgetId: WidgetId) => Promise<void>;
  duplicateWidget: (widgetId: WidgetId) => Promise<Widget>;
  moveWidget: (widgetId: WidgetId, position: Partial<WidgetPosition>) => void;
  resizeWidget: (widgetId: WidgetId, size: { w: number; h: number }) => void;

  // Layout operations
  updateLayout: (layout: WidgetPosition[]) => void;
  autoArrange: () => void;
  toggleLock: () => void;

  // Data binding operations
  bindDataSource: (widgetId: WidgetId, binding: CreateDataBindingInput) => Promise<void>;
  updateDataBinding: (widgetId: WidgetId, bindingId: string, updates: Partial<CreateDataBindingInput>) => Promise<void>;
  removeDataBinding: (widgetId: WidgetId, bindingId: string) => Promise<void>;
  previewData: (config: DataSourceConfig) => Promise<Record<string, unknown>[]>;

  // Filter operations
  addFilter: (filter: Omit<DashboardFilter, 'id' | 'dashboardId' | 'createdAt' | 'updatedAt'>) => Promise<DashboardFilter>;
  updateFilter: (filterId: FilterId, updates: Partial<DashboardFilter>) => Promise<void>;
  removeFilter: (filterId: FilterId) => Promise<void>;

  // Dashboard operations
  save: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  discardChanges: () => void;
  updateSettings: (settings: Partial<DashboardSettings>) => void;
  updateGridConfig: (config: Partial<GridConfig>) => void;

  // Preview mode
  isPreviewMode: boolean;
  togglePreview: () => void;
};
```

---

## Filter System

### Filter Resolution Priority

```
1. Global dashboard filters (applied to all widgets)
           │
           ▼
2. Widget-specific filter bindings (per data source)
           │
           ▼
3. Widget filter overrides (ignore or override global values)
           │
           ▼
4. Cross-widget filters (dynamic filters from user interaction)
           │
           ▼
5. Final resolved filter values → passed to query executor
```

### useDashboardFilters Hook

```typescript
function useDashboardFilters(dashboardId: DashboardId): {
  filters: DashboardFilter[];
  values: Record<FilterId, FilterValue>;
  setValue: (filterId: FilterId, value: FilterValue) => void;
  setValues: (values: Record<FilterId, FilterValue>) => void;
  reset: () => void;
  isDirty: boolean;
  crossWidgetState: Record<WidgetId, WidgetInteractionEvent | null>;
  setCrossWidgetFilter: (event: WidgetInteractionEvent | null) => void;
  clearCrossWidgetFilters: () => void;
};
```

---

## Template Engine

### Built-in Templates

| Template | Category | Widgets | Description |
|---|---|---|---|
| Executive Overview | `executive` | 8 | Portfolio KPIs, revenue trend, venture comparison |
| Sales Pipeline | `sales` | 7 | Pipeline funnel, deals by stage, win rate |
| Marketing Performance | `marketing` | 9 | Campaign ROI, channel attribution, conversions |
| Engineering Velocity | `engineering` | 6 | Sprint velocity, bug rate, deploy frequency |
| Financial Summary | `finance` | 7 | P&L summary, cash flow, burn rate, runway |
| Operations Monitor | `operations` | 8 | System uptime, response times, error rates |
| HR Dashboard | `hr` | 6 | Headcount, hiring pipeline, attrition |
| Product Analytics | `product` | 8 | DAU/MAU, feature adoption, retention cohorts |
| Customer Success | `customer_success` | 7 | NPS, churn risk, support tickets, health scores |

### DashboardTemplateService

```typescript
interface DashboardTemplateService {
  /** List available templates (system + venture-specific). */
  list(ctx: TRPCContext, input?: ListTemplatesInput): Promise<DashboardTemplate[]>;

  /** Get a template by ID. */
  getById(ctx: TRPCContext, templateId: TemplateId): Promise<DashboardTemplate | null>;

  /** Create a custom template from an existing dashboard. */
  createFromDashboard(
    ctx: TRPCContext,
    dashboardId: DashboardId,
    input: CreateTemplateInput,
  ): Promise<DashboardTemplate>;

  /** Instantiate a template — create a new dashboard from it. */
  instantiate(
    ctx: TRPCContext,
    templateId: TemplateId,
    input: CreateFromTemplateInput,
  ): Promise<Dashboard>;

  /** Preview a template with sample data. */
  preview(
    ctx: TRPCContext,
    templateId: TemplateId,
    variables?: Record<string, string>,
  ): Promise<{ dashboard: Dashboard; sampleData: Map<WidgetId, Record<string, unknown>[]> }>;

  /** Update a custom template. */
  update(ctx: TRPCContext, templateId: TemplateId, input: UpdateTemplateInput): Promise<DashboardTemplate>;

  /** Delete a custom template (system templates cannot be deleted). */
  delete(ctx: TRPCContext, templateId: TemplateId): Promise<void>;
}
```

---

## Sharing & Embedding

### DashboardShareService

```typescript
interface DashboardShareService {
  /** Share a dashboard with a specific user. */
  shareWithUser(
    ctx: TRPCContext,
    dashboardId: DashboardId,
    userId: string,
    permission: SharePermission,
  ): Promise<DashboardShare>;

  /** Share a dashboard with a team. */
  shareWithTeam(
    ctx: TRPCContext,
    dashboardId: DashboardId,
    teamId: string,
    permission: SharePermission,
  ): Promise<DashboardShare>;

  /** Create a shareable link with optional expiry and password. */
  createShareLink(
    ctx: TRPCContext,
    dashboardId: DashboardId,
    options?: {
      permission?: SharePermission;
      expiresIn?: number;
      password?: string;
    },
  ): Promise<{ share: DashboardShare; url: string }>;

  /** Create an embeddable iframe configuration. */
  createEmbed(
    ctx: TRPCContext,
    dashboardId: DashboardId,
    embedConfig: EmbedConfig,
    options?: { expiresIn?: number },
  ): Promise<{ share: DashboardShare; embedUrl: string; iframeSnippet: string }>;

  /** List all shares for a dashboard. */
  listShares(ctx: TRPCContext, dashboardId: DashboardId): Promise<DashboardShare[]>;

  /** Revoke a share. */
  revokeShare(ctx: TRPCContext, shareId: ShareId): Promise<void>;

  /** Validate a share token and return the dashboard if valid. */
  validateToken(
    token: string,
    password?: string,
  ): Promise<{ dashboard: Dashboard; permission: SharePermission } | null>;

  /** Export dashboard to PDF. */
  exportPdf(
    ctx: TRPCContext,
    dashboardId: DashboardId,
    options?: ExportPdfOptions,
  ): Promise<{ url: string; fileSize: number }>;
}

interface ExportPdfOptions {
  paperSize: 'a4' | 'letter' | 'a3';
  orientation: 'portrait' | 'landscape';
  includeTitlePage: boolean;
  includeFilterSummary: boolean;
  filterValues?: Record<FilterId, FilterValue>;
  quality: 'draft' | 'standard' | 'high';
}
```

---

## Scheduling & Snapshots

### DashboardScheduleService

```typescript
interface DashboardScheduleService {
  /** Create a new schedule for a dashboard. */
  create(
    ctx: TRPCContext,
    dashboardId: DashboardId,
    input: CreateScheduleInput,
  ): Promise<DashboardSchedule>;

  /** Update a schedule. */
  update(ctx: TRPCContext, scheduleId: ScheduleId, input: UpdateScheduleInput): Promise<DashboardSchedule>;

  /** Delete a schedule. */
  delete(ctx: TRPCContext, scheduleId: ScheduleId): Promise<void>;

  /** List schedules for a dashboard. */
  listByDashboard(ctx: TRPCContext, dashboardId: DashboardId): Promise<DashboardSchedule[]>;

  /** Activate or deactivate a schedule. */
  setActive(ctx: TRPCContext, scheduleId: ScheduleId, isActive: boolean): Promise<DashboardSchedule>;

  /** Manually trigger a schedule (send snapshot now). */
  triggerNow(ctx: TRPCContext, scheduleId: ScheduleId): Promise<{ snapshotId: string; deliveredTo: number }>;

  /** Get schedule run history. */
  getRunHistory(ctx: TRPCContext, scheduleId: ScheduleId, limit?: number): Promise<ScheduleRunRecord[]>;

  /** Process all due schedules (called by cron worker). @internal */
  processDueSchedules(): Promise<ProcessSchedulesResult>;
}

interface CreateScheduleInput {
  name: string;
  frequency: ScheduleFrequency;
  timezone?: string;
  format?: SnapshotFormat;
  recipients: ScheduleRecipient[];
  filterValues?: Record<FilterId, FilterValue>;
  subjectTemplate?: string;
  bodyTemplate?: string;
}

interface ScheduleRunRecord {
  id: string;
  scheduleId: ScheduleId;
  status: 'success' | 'failure' | 'skipped';
  snapshotId: string | null;
  recipientsDelivered: number;
  recipientsFailed: number;
  error: string | null;
  durationMs: number;
  runAt: Date;
}

interface ProcessSchedulesResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: { scheduleId: ScheduleId; error: string }[];
}
```

### DashboardSnapshotService

```typescript
interface DashboardSnapshotService {
  /** Generate a snapshot (server-side render via Puppeteer). */
  generate(
    ctx: TRPCContext,
    dashboardId: DashboardId,
    options: GenerateSnapshotOptions,
  ): Promise<SnapshotResult>;

  /** Get a previously generated snapshot. */
  getById(ctx: TRPCContext, snapshotId: string): Promise<SnapshotRecord | null>;

  /** List snapshots for a dashboard. */
  listByDashboard(ctx: TRPCContext, dashboardId: DashboardId, limit?: number): Promise<SnapshotRecord[]>;

  /** Delete expired snapshots (cleanup job). @internal */
  cleanupExpired(): Promise<{ deleted: number }>;
}

interface GenerateSnapshotOptions {
  format: SnapshotFormat;
  filterValues?: Record<FilterId, FilterValue>;
  viewportWidth?: number;   // default: 1440
  viewportHeight?: number;  // default: 900
  waitForData?: boolean;
  maxWaitMs?: number;
  pdfOptions?: ExportPdfOptions;
  expiresIn?: number;
}

interface SnapshotResult {
  id: string;
  fileUrl: string;
  fileSize: number;
  format: SnapshotFormat;
  generationTimeMs: number;
  widgetCount: number;
  errorCount: number;
  errors: { widgetId: string; error: string }[];
}
```

---

## Responsive Layout

### Breakpoints

```typescript
const RESPONSIVE_BREAKPOINTS = {
  xl: 1440,   // Large desktop
  lg: 1200,   // Desktop
  md: 996,    // Small desktop / landscape tablet
  sm: 768,    // Tablet
  xs: 480,    // Mobile
  xxs: 0,     // Small mobile
} as const;

const COLUMNS_BY_BREAKPOINT = {
  xl: 12, lg: 12, md: 8, sm: 6, xs: 4, xxs: 2,
} as const;
```

### Layout Adaptation

```
Desktop (12 cols)         Tablet (6 cols)          Mobile (2 cols)
─────────────────         ──────────────           ──────────────

┌────┬────┬────┐         ┌────────┬────┐          ┌──────────┐
│ KPI│ KPI│ KPI│         │  KPI   │KPI │          │   KPI    │
├────┴────┴────┤         ├────────┴────┤          ├──────────┤
│              │         │    KPI      │          │   KPI    │
│  Line Chart  │         ├─────────────┤          ├──────────┤
│              │         │             │          │   KPI    │
├────────┬─────┤         │ Line Chart  │          ├──────────┤
│  Pie   │Table│         │             │          │  Line    │
│  Chart │     │         ├──────┬──────┤          │  Chart   │
│        │     │         │ Pie  │Table │          ├──────────┤
└────────┴─────┘         └──────┴──────┘          │Pie Chart │
                                                  ├──────────┤
                                                  │  Table   │
                                                  └──────────┘
```

---

## Permissions Model

### Permission Hierarchy

```
Owner
  └── Admin
       └── Editor
            └── Viewer
```

| Level | View | Edit Widgets | Edit Settings | Share | Delete | Manage Perms |
|-------|------|-------------|---------------|-------|--------|-------------|
| Viewer | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Editor | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### DashboardPermissionService

```typescript
interface DashboardPermissionService {
  /** Grant permission to a user, team, or role. */
  grant(ctx: TRPCContext, dashboardId: DashboardId, grant: PermissionGrant): Promise<DashboardPermission>;

  /** Revoke permission. */
  revoke(ctx: TRPCContext, permissionId: string): Promise<void>;

  /** Update permission level. */
  update(ctx: TRPCContext, permissionId: string, level: PermissionLevel): Promise<DashboardPermission>;

  /** List all permission grants for a dashboard. */
  listGrants(ctx: TRPCContext, dashboardId: DashboardId): Promise<DashboardPermission[]>;

  /** Resolve effective permissions for a user (considers user, team, role grants). */
  resolveEffective(ctx: TRPCContext, dashboardId: DashboardId, userId: string): Promise<EffectivePermissions>;

  /** Check if a user can perform a specific action. */
  can(ctx: TRPCContext, dashboardId: DashboardId, userId: string, action: DashboardAction): Promise<boolean>;
}

type DashboardAction = 'view' | 'edit' | 'share' | 'delete' | 'manage_permissions';

interface EffectivePermissions {
  dashboardId: DashboardId;
  userId: string;
  level: PermissionLevel;
  canView: boolean;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
  canManagePermissions: boolean;
  widgetVisibility: Record<WidgetId, { visible: boolean; dataAccess: boolean }>;
}

interface PermissionGrant {
  subjectType: 'user' | 'team' | 'role';
  subjectId: string;
  level: PermissionLevel;
  widgetRestrictions?: WidgetPermission[];
}

interface WidgetPermission {
  widgetId: WidgetId;
  visible: boolean;
  dataAccess: boolean;
}
```

---

## Code Examples

### Example 1: Create a Dashboard

```typescript
import { DashboardService } from '@mcv/analytics/dashboards';

const dashboardService = new DashboardService(supabase);

// Create a new sales dashboard for a venture
const dashboard = await dashboardService.create(ctx, {
  ventureId: 'venture_01HX9K3M2N',
  title: 'Q1 2026 Sales Dashboard',
  description: 'Track sales performance, pipeline health, and revenue targets for Q1.',
  visibility: 'venture',
  settings: {
    autoRefreshInterval: 300, // 5 minutes
    colorPalette: 'ocean',
    defaultDateRange: 'this_quarter',
    showFilterBar: true,
    showWidgetBorders: true,
    realTimeEnabled: false,
    theme: null,
    backgroundColor: null,
  },
  tags: ['sales', 'q1-2026', 'revenue'],
});

console.log(`Dashboard created: ${dashboard.id} — ${dashboard.slug}`);
// Dashboard created: 01HXA8B2C3D4E5F6G7 — q1-2026-sales-dashboard
```

### Example 2: Add Widgets to a Dashboard

```typescript
import { WidgetService } from '@mcv/analytics/dashboards';

const widgetService = new WidgetService(supabase);

// Add a KPI card for total revenue
const revenueKpi = await widgetService.create(ctx, {
  dashboardId: dashboard.id,
  type: 'kpi_card',
  title: 'Total Revenue',
  position: { x: 0, y: 0, w: 3, h: 2 },
  config: {
    type: 'kpi_card',
    valueField: 'total_revenue',
    format: 'currency',
    prefix: '$',
    suffix: '',
    decimals: 0,
    comparisonField: 'prev_quarter_revenue',
    comparisonType: 'previous_period',
    trendDirection: 'up_is_good',
    showSparkline: true,
    sparklineField: 'daily_revenue',
    icon: 'dollar-sign',
    targetValue: 500000,
    showTarget: true,
  },
});

// Add a line chart for revenue over time
const revenueChart = await widgetService.create(ctx, {
  dashboardId: dashboard.id,
  type: 'line_chart',
  title: 'Revenue Trend',
  subtitle: 'Daily revenue with 7-day moving average',
  position: { x: 0, y: 2, w: 8, h: 4 },
  config: {
    type: 'line_chart',
    xAxis: { field: 'date', label: 'Date', type: 'time', format: 'MMM dd' },
    yAxis: { field: 'revenue', label: 'Revenue ($)', type: 'number' },
    series: [
      { field: 'daily_revenue', label: 'Daily Revenue', color: '#3B82F6' },
      { field: 'moving_avg_7d', label: '7-Day Average', color: '#10B981', type: 'dashed' },
    ],
    showDots: false,
    curve: 'monotone',
    showArea: false,
    zoomable: true,
    showLegend: true,
    legendPosition: 'top',
    showTooltip: true,
    showGrid: true,
    annotations: [
      {
        type: 'line',
        axis: 'y',
        value: 16666,
        label: 'Daily Target ($16,666)',
        color: '#EF4444',
        dashStyle: 'dashed',
      },
    ],
  },
});

// Add a pipeline funnel
const funnelWidget = await widgetService.create(ctx, {
  dashboardId: dashboard.id,
  type: 'funnel',
  title: 'Sales Pipeline',
  position: { x: 8, y: 2, w: 4, h: 4 },
  config: {
    type: 'funnel',
    stageField: 'stage',
    valueField: 'deal_count',
    showConversionRates: true,
    showPercentages: true,
    direction: 'vertical',
    colorScheme: 'sequential',
    showLabels: true,
  },
});

console.log(`Added ${3} widgets to dashboard`);
```

### Example 3: Bind Data Sources to Widgets

```typescript
import { DataBindingService } from '@mcv/analytics/dashboards';

const dataBindingService = new DataBindingService(supabase);

// Bind the KPI card to a metric
await dataBindingService.bindToWidget(ctx, revenueKpi.id, {
  name: 'Revenue Metric',
  type: 'metric',
  role: 'primary',
  config: {
    type: 'metric',
    metricKey: 'sales.revenue.total',
    aggregation: 'sum',
    granularity: 'day',
    groupBy: [],
    where: { venture_id: dashboard.ventureId },
  },
  fieldMappings: [
    { sourceField: 'value', targetField: 'total_revenue' },
    { sourceField: 'previous_value', targetField: 'prev_quarter_revenue' },
    { sourceField: 'timeseries', targetField: 'daily_revenue' },
  ],
  cacheTtl: 300,
});

// Bind the line chart to a SQL query
await dataBindingService.bindToWidget(ctx, revenueChart.id, {
  name: 'Daily Revenue Query',
  type: 'sql',
  role: 'primary',
  config: {
    type: 'sql',
    query: `
      SELECT
        date_trunc('day', closed_at) AS date,
        SUM(amount) AS daily_revenue,
        AVG(SUM(amount)) OVER (ORDER BY date_trunc('day', closed_at) ROWS 6 PRECEDING) AS moving_avg_7d
      FROM deals
      WHERE venture_id = $1
        AND closed_at BETWEEN $2 AND $3
        AND status = 'won'
      GROUP BY date_trunc('day', closed_at)
      ORDER BY date
    `,
    parameters: [
      { name: 'venture_id', type: 'string', binding: { type: 'static', value: dashboard.ventureId } },
      { name: 'start_date', type: 'date', binding: { type: 'filter', filterId: dateFilter.id } },
      { name: 'end_date', type: 'date', binding: { type: 'filter', filterId: dateFilter.id } },
    ],
    timeoutMs: 10000,
    maxRows: 1000,
  },
  fieldMappings: [
    { sourceField: 'date', targetField: 'date', coerce: 'date' },
    { sourceField: 'daily_revenue', targetField: 'daily_revenue', coerce: 'number' },
    { sourceField: 'moving_avg_7d', targetField: 'moving_avg_7d', coerce: 'number' },
  ],
  cacheTtl: 600,
});

// Bind the funnel to a Supabase view
await dataBindingService.bindToWidget(ctx, funnelWidget.id, {
  name: 'Pipeline Stages',
  type: 'supabase',
  role: 'primary',
  config: {
    type: 'supabase',
    table: 'vw_pipeline_stages',
    select: 'stage, deal_count, total_value',
    filters: [
      { column: 'venture_id', operator: 'eq', value: dashboard.ventureId },
    ],
    orderBy: [{ column: 'stage_order', ascending: true }],
  },
  fieldMappings: [
    { sourceField: 'stage', targetField: 'stage' },
    { sourceField: 'deal_count', targetField: 'deal_count', coerce: 'number' },
  ],
  cacheTtl: 300,
});
```

### Example 4: Apply Filters and Cross-Widget Filtering

```typescript
import { DashboardFilterService, useDashboardFilters } from '@mcv/analytics/dashboards';

const filterService = new DashboardFilterService(supabase);

// Add a date range filter
const dateFilter = await filterService.addFilter(ctx, dashboard.id, {
  type: 'date_range',
  label: 'Date Range',
  config: {
    type: 'date_range',
    allowedPresets: ['today', 'last_7_days', 'last_30_days', 'this_month', 'this_quarter', 'custom'],
    allowCustom: true,
    showTimezone: false,
  },
  defaultValue: {
    type: 'date_range',
    preset: 'this_quarter',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    timezone: 'America/New_York',
  },
  isGlobal: true,
  required: true,
  displayOrder: 0,
});

// Add a sales rep filter
const repFilter = await filterService.addFilter(ctx, dashboard.id, {
  type: 'multi_select',
  label: 'Sales Rep',
  config: {
    type: 'multi_select',
    searchable: true,
    placeholder: 'All Sales Reps',
    optionsSource: {
      dataSourceId: salesRepDataSource.id,
      labelField: 'full_name',
      valueField: 'user_id',
    },
  },
  defaultValue: { type: 'multi_select', selected: [] },
  isGlobal: true,
  required: false,
  displayOrder: 1,
});

// In a React component — using the filter hook
function SalesDashboard({ dashboardId }: { dashboardId: DashboardId }) {
  const { filters, values, setValue, reset, isDirty } = useDashboardFilters(dashboardId);

  const handleDateChange = (preset: DateRangePreset) => {
    const dateFilter = filters.find(f => f.type === 'date_range');
    if (dateFilter) {
      setValue(dateFilter.id, {
        type: 'date_range',
        preset,
        startDate: calculateStartDate(preset),
        endDate: calculateEndDate(preset),
        timezone: 'America/New_York',
      });
    }
  };

  return (
    <DashboardViewer dashboardId={dashboardId}>
      <FilterBar
        filters={filters}
        values={values}
        onFilterChange={setValue}
        onReset={reset}
        showResetButton={isDirty}
      />
    </DashboardViewer>
  );
}
```

### Example 5: Schedule a Dashboard Snapshot

```typescript
import { DashboardScheduleService } from '@mcv/analytics/dashboards';

const scheduleService = new DashboardScheduleService(supabase);

// Schedule a weekly PDF report every Monday at 9 AM
const schedule = await scheduleService.create(ctx, dashboard.id, {
  name: 'Weekly Sales Report',
  frequency: { type: 'weekly', day: 1, time: '09:00' }, // Monday 9 AM
  timezone: 'America/New_York',
  format: 'pdf',
  recipients: [
    { type: 'user', target: 'user_vp_sales' },
    { type: 'team', target: 'team_sales_leadership' },
    { type: 'email', target: 'board@example.com' },
    {
      type: 'webhook',
      target: 'https://example.com/webhook/slack-placeholder',
    },
  ],
  filterValues: {
    [dateFilter.id]: {
      type: 'date_range',
      preset: 'last_7_days',
      startDate: '', // auto-calculated
      endDate: '',   // auto-calculated
      timezone: 'America/New_York',
    },
  },
  subjectTemplate: 'Weekly Sales Report — {{dashboardTitle}} ({{dateRange}})',
  bodyTemplate: `
## Weekly Sales Report

Hi team,

Please find attached the weekly sales performance report for **{{dateRange}}**.

Key highlights will be visible in the attached dashboard snapshot.

Best,
Analytics Platform
  `.trim(),
});

console.log(`Schedule created: ${schedule.id}, next run: ${schedule.nextRunAt}`);

// Trigger an immediate send for testing
const result = await scheduleService.triggerNow(ctx, schedule.id);
console.log(`Snapshot sent to ${result.deliveredTo} recipients`);
```

### Example 6: Create a Dashboard from a Template

```typescript
import { DashboardTemplateService } from '@mcv/analytics/dashboards';

const templateService = new DashboardTemplateService(supabase);

// List available templates
const templates = await templateService.list(ctx, {
  category: 'executive',
  includeSystem: true,
});

// Preview a template before creating
const preview = await templateService.preview(ctx, templates[0].id, {
  ventureId: 'venture_01HX9K3M2N',
});

// Instantiate the "Executive Overview" template
const execDashboard = await templateService.instantiate(ctx, templates[0].id, {
  ventureId: 'venture_01HX9K3M2N',
  title: 'Acme Corp — Executive Overview',
  variables: {
    ventureId: 'venture_01HX9K3M2N',
    currencySymbol: '$',
    fiscalYearStart: '2026-01-01',
  },
});

console.log(`Created dashboard from template with ${execDashboard.widgets.length} widgets`);
```

### Example 7: Share and Embed a Dashboard

```typescript
import { DashboardShareService } from '@mcv/analytics/dashboards';

const shareService = new DashboardShareService(supabase);

// Share with a team
await shareService.shareWithTeam(ctx, dashboard.id, 'team_marketing', 'view');

// Create a password-protected shareable link (expires in 7 days)
const { url } = await shareService.createShareLink(ctx, dashboard.id, {
  permission: 'view',
  expiresIn: 7 * 24 * 60 * 60, // 7 days
  password: 'Q1-sales-2026',
});
console.log(`Share link: ${url}`);

// Create an embeddable version for the investor portal
const { embedUrl, iframeSnippet } = await shareService.createEmbed(ctx, dashboard.id, {
  allowedDomains: ['portal.acmecorp.com', 'investors.mcv.dev'],
  showTitle: true,
  showFilters: false,
  showWidgetHeaders: true,
  width: null,
  height: 800,
  theme: 'light',
});

console.log(`Embed URL: ${embedUrl}`);
console.log(`Iframe snippet:\n${iframeSnippet}`);
// <iframe src="https://app.mcv.dev/embed/dash_abc123?token=..." width="100%" height="800" ...></iframe>

// Export to PDF
const pdf = await shareService.exportPdf(ctx, dashboard.id, {
  paperSize: 'a4',
  orientation: 'landscape',
  includeTitlePage: true,
  includeFilterSummary: true,
  quality: 'high',
});
console.log(`PDF exported: ${pdf.url} (${(pdf.fileSize / 1024).toFixed(0)} KB)`);
```

### Example 8: Real-Time Operational Dashboard

```typescript
import { useDashboard, useRealTimeWidget, DashboardViewer } from '@mcv/analytics/dashboards';

function OperationsDashboard({ dashboardId }: { dashboardId: DashboardId }) {
  const { dashboard, isLoading } = useDashboard(dashboardId);

  if (isLoading || !dashboard) return <LoadingSpinner />;

  return (
    <DashboardViewer
      dashboard={dashboard}
      mode="live"
      realTimeEnabled
    >
      {dashboard.widgets.map((widget) => (
        <LiveWidget key={widget.id} widget={widget} />
      ))}
    </DashboardViewer>
  );
}

function LiveWidget({ widget }: { widget: Widget }) {
  const {
    data,
    isConnected,
    connectionStatus,
    lastUpdateAt,
    updateCount,
    error,
  } = useRealTimeWidget(widget, [], {
    throttleMs: 2000,
    batchUpdates: true,
    pauseWhenHidden: true,
  });

  return (
    <WidgetContainer
      widget={widget}
      data={data}
      isLoading={!data && !error}
      error={error?.message ?? null}
    >
      <div className="absolute top-1 right-1 flex items-center gap-1 text-xs">
        <span className={`h-2 w-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span className="text-muted-foreground">
          {connectionStatus === 'active'
            ? `Live · ${updateCount} updates`
            : connectionStatus}
        </span>
      </div>
    </WidgetContainer>
  );
}
```

---

## Error Codes

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `DASH_NOT_FOUND` | DashboardNotFoundError | 404 | Dashboard does not exist or has been deleted |
| `DASH_PERMISSION_DENIED` | DashboardPermissionError | 403 | User lacks required permission level for the action |
| `DASH_LIMIT_EXCEEDED` | DashboardLimitExceededError | 429 | Venture has reached maximum dashboard count (default: 100) |
| `WIDGET_NOT_FOUND` | WidgetNotFoundError | 404 | Widget does not exist on the specified dashboard |
| `WIDGET_LIMIT_EXCEEDED` | DashboardLimitExceededError | 429 | Dashboard has reached maximum widget count (default: 50) |
| `WIDGET_RENDER_FAILED` | WidgetRenderError | 500 | Widget component failed to render (bad config or data shape) |
| `WIDGET_DATA_TIMEOUT` | WidgetDataTimeoutError | 504 | Data source query exceeded timeout threshold |
| `DATASOURCE_CONNECTION_FAILED` | DataSourceConnectionError | 502 | Could not connect to the configured data source (API, SQL) |
| `DATASOURCE_QUERY_FAILED` | DataSourceConnectionError | 500 | Data source query returned an error (bad SQL, auth failure) |
| `FILTER_VALIDATION_FAILED` | FilterValidationError | 400 | Filter value does not match filter type or constraints |
| `TEMPLATE_NOT_FOUND` | TemplateNotFoundError | 404 | Dashboard template does not exist or is not accessible |
| `TEMPLATE_VARIABLE_MISSING` | TemplateNotFoundError | 400 | Required template variable was not provided |
| `SCHEDULE_CONFIG_INVALID` | ScheduleConfigError | 400 | Invalid cron expression, no recipients, or bad format |
| `SHARE_TOKEN_EXPIRED` | ShareTokenExpiredError | 401 | Share link or embed token has expired |
| `SHARE_PASSWORD_REQUIRED` | ShareTokenExpiredError | 401 | Share requires a password and none was provided |
| `SHARE_PASSWORD_INCORRECT` | ShareTokenExpiredError | 401 | Provided share password is incorrect |
| `SNAPSHOT_GENERATION_FAILED` | SnapshotGenerationError | 500 | Server-side rendering failed (Puppeteer error, timeout) |
| `SNAPSHOT_TOO_LARGE` | SnapshotGenerationError | 413 | Generated snapshot exceeds maximum file size (50 MB) |
| `LAYOUT_INVALID` | InvalidLayoutError | 400 | Widget positions overlap, exceed grid bounds, or violate size constraints |
| `LAYOUT_COLLISION` | InvalidLayoutError | 400 | Widget placement would cause an unresolvable overlap |
| `EMBED_DOMAIN_NOT_ALLOWED` | DashboardPermissionError | 403 | Requesting domain is not in the embed's allowed domains list |
| `REALTIME_CONNECTION_FAILED` | DataSourceConnectionError | 503 | Could not establish Supabase Realtime WebSocket connection |

### Error Response Format

```typescript
interface DashboardErrorResponse {
  code: string;
  message: string;
  details?: {
    dashboardId?: string;
    widgetId?: string;
    dataSourceId?: string;
    field?: string;
    constraint?: string;
  };
  timestamp: string;
  requestId: string;
}

// Example error:
{
  "code": "WIDGET_DATA_TIMEOUT",
  "message": "Data source query timed out after 10000ms",
  "details": {
    "widgetId": "01HXB3C4D5E6F7G8H9",
    "dataSourceId": "01HXB3C4D5E6F7G8I0",
    "constraint": "timeoutMs: 10000"
  },
  "timestamp": "2026-02-08T22:04:00.000Z",
  "requestId": "req_abc123"
}
```

---

## Security Considerations

### Data Access Control

- **Row-Level Security (RLS):** All dashboard tables use Supabase RLS policies scoped to `venture_id`. Consortium dashboards use a separate policy for users with the `consortium_admin` role.
- **SQL Query Sandboxing:** SQL data source queries execute through a read-only connection pool with a restricted role (`analytics_reader`). Queries are parameterized — no string interpolation. DDL, DML (INSERT/UPDATE/DELETE), and system catalog access are blocked at the database role level.
- **API Data Source Authentication:** Credentials for API data sources are stored in the encrypted secrets table (`@mcv/secrets`), never in the widget configuration. The dashboard service resolves credentials at query time via reference ID.
- **Widget-Level Permissions:** Dashboard admins can restrict specific widgets to specific users/teams. Restricted widgets render a placeholder for unauthorized viewers rather than leaking data.

### Sharing Security

- **Share Tokens:** Generated using `crypto.randomUUID()` + HMAC signature. Tokens are hashed (SHA-256) before storage. Raw tokens are only returned once at creation time.
- **Embed Domain Allowlisting:** Embed iframes include `X-Frame-Options` and CSP `frame-ancestors` headers matching the configured `allowedDomains`. Requests from unlisted domains are rejected with `EMBED_DOMAIN_NOT_ALLOWED`.
- **Password-Protected Shares:** Passwords are hashed with bcrypt (cost factor 12) before storage. Rate limiting applies to password validation endpoints (5 attempts per minute per token).
- **Token Expiry:** All share tokens support optional TTL. Expired tokens return `SHARE_TOKEN_EXPIRED`. The cleanup job runs hourly to deactivate expired shares.

### Snapshot Security

- **Server-Side Rendering:** Snapshots are generated in an isolated Puppeteer instance with `--no-sandbox` disabled (sandboxed mode). The rendering environment has no access to user sessions — it authenticates via a short-lived service token scoped to the specific dashboard.
- **File Storage:** Generated snapshots are stored in the private R2 bucket with pre-signed URLs that expire after 24 hours (configurable). Snapshots auto-delete after the configured retention period (default: 90 days).

### Input Validation

- Dashboard titles: max 200 characters, stripped of HTML
- Descriptions: max 2000 characters, Markdown only
- Tags: max 20 tags, max 50 characters each, alphanumeric + hyphens
- SQL queries: max 10,000 characters, parsed and validated before execution
- Widget configs: validated against type-specific Zod schemas

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DASHBOARD_MAX_PER_VENTURE` | No | `100` | Maximum dashboards per venture |
| `DASHBOARD_MAX_WIDGETS` | No | `50` | Maximum widgets per dashboard |
| `DASHBOARD_SNAPSHOT_BUCKET` | Yes | — | R2/S3 bucket name for snapshot storage |
| `DASHBOARD_SNAPSHOT_MAX_SIZE_MB` | No | `50` | Maximum snapshot file size in MB |
| `DASHBOARD_SNAPSHOT_RETENTION_DAYS` | No | `90` | Snapshot auto-delete after N days |
| `DASHBOARD_SNAPSHOT_PUPPETEER_URL` | No | `http://localhost:3001` | Puppeteer service endpoint |
| `DASHBOARD_CACHE_TTL_DEFAULT` | No | `300` | Default data source cache TTL in seconds |
| `DASHBOARD_CACHE_MAX_ENTRIES` | No | `1000` | Maximum LRU cache entries per process |
| `DASHBOARD_REALTIME_THROTTLE_MS` | No | `1000` | Default real-time update throttle |
| `DASHBOARD_SQL_TIMEOUT_MS` | No | `10000` | Default SQL query timeout |
| `DASHBOARD_SQL_MAX_ROWS` | No | `10000` | Maximum rows from SQL queries |
| `DASHBOARD_API_TIMEOUT_MS` | No | `15000` | Default API data source timeout |
| `DASHBOARD_SHARE_TOKEN_HMAC_SECRET` | Yes | — | HMAC secret for share token signing |
| `DASHBOARD_SHARE_MAX_PASSWORD_ATTEMPTS` | No | `5` | Rate limit for share password attempts |
| `DASHBOARD_EMBED_DEFAULT_THEME` | No | `light` | Default theme for embedded dashboards |
| `MAPBOX_ACCESS_TOKEN` | No | — | Mapbox token for map widgets |
| `DASHBOARD_SCHEDULE_WORKER_ENABLED` | No | `false` | Enable the schedule processing worker |
| `DASHBOARD_SCHEDULE_WORKER_INTERVAL_MS` | No | `60000` | Schedule worker polling interval |
| `DASHBOARD_EMAIL_FROM` | No | `analytics@mcv.dev` | From address for scheduled emails |

---

## Dependencies

### Internal

| Package | Purpose |
|---|---|
| `@mcv/analytics/metrics` | Metric data source queries, aggregation |
| `@mcv/ui` | Design system components (buttons, dialogs, inputs) |
| `@mcv/auth` | Authentication context, user/team resolution |
| `@mcv/db` | Supabase client, Drizzle ORM utilities |
| `@mcv/secrets` | Encrypted credential storage for API data sources |
| `@mcv/ids` | ULID generation |
| `@mcv/trpc` | tRPC context and router definitions |
| `@mcv/email` | Email delivery for scheduled snapshots |
| `@mcv/storage` | R2/S3 file storage for snapshots |
| `@mcv/permissions` | Role resolution, team membership queries |

### External

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.0.0 | UI framework |
| `react-grid-layout` | ^1.4.0 | Drag-and-drop grid layout |
| `recharts` | ^2.12.0 | Line, bar, area, scatter, sparkline charts |
| `@nivo/pie` | ^0.87.0 | Pie/donut charts |
| `@nivo/funnel` | ^0.87.0 | Funnel charts |
| `@nivo/heatmap` | ^0.87.0 | Heatmap visualizations |
| `@tanstack/react-table` | ^8.0.0 | Data table component |
| `mapbox-gl` | ^3.0.0 | Geographic map widgets |
| `@supabase/supabase-js` | ^2.39.0 | Database client + Realtime subscriptions |
| `puppeteer` | ^22.0.0 | Server-side snapshot generation |
| `zod` | ^3.22.0 | Config validation schemas |
| `croner` | ^8.0.0 | Cron expression parsing for schedules |
| `date-fns` | ^3.0.0 | Date range calculations |
| `slugify` | ^1.6.0 | URL-safe slug generation |
| `dnd-kit` | ^6.1.0 | Drag-and-drop primitives for widget toolbox |

---

## Testing

### Unit Tests

```typescript
describe('DashboardService', () => {
  it('creates a dashboard with default grid config', async () => {
    const dashboard = await dashboardService.create(ctx, {
      ventureId: 'venture_test',
      title: 'Test Dashboard',
    });

    expect(dashboard.gridConfig.cols).toBe(12);
    expect(dashboard.gridConfig.rowHeight).toBe(80);
    expect(dashboard.status).toBe('draft');
    expect(dashboard.visibility).toBe('private');
    expect(dashboard.widgets).toHaveLength(0);
  });

  it('enforces dashboard limit per venture', async () => {
    // Create 100 dashboards (the limit)
    for (let i = 0; i < 100; i++) {
      await dashboardService.create(ctx, {
        ventureId: 'venture_limit_test',
        title: `Dashboard ${i}`,
      });
    }

    await expect(
      dashboardService.create(ctx, {
        ventureId: 'venture_limit_test',
        title: 'One Too Many',
      }),
    ).rejects.toThrow(DashboardLimitExceededError);
  });

  it('soft-deletes and restores a dashboard', async () => {
    const dashboard = await dashboardService.create(ctx, {
      ventureId: 'venture_test',
      title: 'Delete Me',
    });

    await dashboardService.delete(ctx, dashboard.id);
    const deleted = await dashboardService.getById(ctx, dashboard.id);
    expect(deleted?.status).toBe('deleted');
    expect(deleted?.deletedAt).not.toBeNull();

    const restored = await dashboardService.restore(ctx, dashboard.id);
    expect(restored.status).toBe('draft');
    expect(restored.deletedAt).toBeNull();
  });
});

describe('WidgetConfig validation', () => {
  it('validates line chart config', () => {
    const validConfig: LineChartConfig = {
      type: 'line_chart',
      xAxis: { field: 'date', label: 'Date', type: 'time' },
      yAxis: { field: 'value', label: 'Value', type: 'number' },
      series: [{ field: 'revenue', label: 'Revenue' }],
      showDots: true,
      curve: 'monotone',
      showArea: false,
      zoomable: false,
      showLegend: true,
      legendPosition: 'bottom',
      showTooltip: true,
      showGrid: true,
      annotations: [],
    };

    expect(lineChartConfigSchema.safeParse(validConfig).success).toBe(true);
  });

  it('rejects invalid widget type in config', () => {
    const invalidConfig = { type: 'nonexistent_chart' };
    expect(widgetConfigSchema.safeParse(invalidConfig).success).toBe(false);
  });

  it('rejects KPI card with invalid format', () => {
    const badKpi = {
      type: 'kpi_card',
      valueField: 'revenue',
      format: 'invalid_format',
    };
    expect(kpiCardConfigSchema.safeParse(badKpi).success).toBe(false);
  });
});

describe('DataBindingService', () => {
  it('resolves metric data source with filters', async () => {
    const widget = createTestWidget('kpi_card', {
      dataSources: [{
        id: 'ds_1',
        dataSourceId: 'metric_revenue' as DataSourceId,
        role: 'primary',
        fieldMappings: [
          { sourceField: 'value', targetField: 'total_revenue' },
        ],
      }],
    });

    const filters: DashboardFilter[] = [
      createDateRangeFilter('last_30_days'),
    ];

    const data = await dataBindingService.resolveWidgetData(ctx, widget, filters);

    expect(data.primary).toBeDefined();
    expect(data.primary.length).toBeGreaterThan(0);
    expect(data.meta.fromCache).toBe(false);
  });

  it('caches repeated identical queries', async () => {
    const widget = createTestWidget('line_chart');

    const first = await dataBindingService.resolveWidgetData(ctx, widget, []);
    const second = await dataBindingService.resolveWidgetData(ctx, widget, []);

    expect(first.meta.fromCache).toBe(false);
    expect(second.meta.fromCache).toBe(true);
  });
});

describe('DashboardPermissionService', () => {
  it('resolves effective permissions across user and team grants', async () => {
    // User has viewer access directly, but their team has editor access
    await permissionService.grant(ctx, dashboard.id, {
      subjectType: 'user',
      subjectId: 'user_123',
      level: 'viewer',
    });
    await permissionService.grant(ctx, dashboard.id, {
      subjectType: 'team',
      subjectId: 'team_eng',
      level: 'editor',
    });

    // User is a member of team_eng
    const effective = await permissionService.resolveEffective(
      ctx, dashboard.id, 'user_123',
    );

    // Should get the highest level (editor > viewer)
    expect(effective.level).toBe('editor');
    expect(effective.canEdit).toBe(true);
    expect(effective.canShare).toBe(false);
  });
});

describe('DashboardShareService', () => {
  it('validates share tokens correctly', async () => {
    const { share, url } = await shareService.createShareLink(ctx, dashboard.id, {
      permission: 'view',
      expiresIn: 3600,
    });

    const token = new URL(url).searchParams.get('token')!;
    const result = await shareService.validateToken(token);

    expect(result).not.toBeNull();
    expect(result!.permission).toBe('view');
    expect(result!.dashboard.id).toBe(dashboard.id);
  });

  it('rejects expired share tokens', async () => {
    const { share } = await shareService.createShareLink(ctx, dashboard.id, {
      permission: 'view',
      expiresIn: -1, // already expired
    });

    const result = await shareService.validateToken(share.token!);
    expect(result).toBeNull();
  });
});
```

### Integration Tests

```typescript
describe('Dashboard E2E', () => {
  it('creates dashboard from template and generates snapshot', async () => {
    // 1. Create from template
    const dashboard = await templateService.instantiate(ctx, execTemplateId, {
      ventureId: testVentureId,
      title: 'Integration Test Dashboard',
      variables: { ventureId: testVentureId },
    });

    expect(dashboard.widgets.length).toBeGreaterThan(0);

    // 2. Verify all widgets have data bindings
    for (const widget of dashboard.widgets) {
      expect(widget.dataSources.length).toBeGreaterThan(0);
    }

    // 3. Resolve all widget data
    const data = await dataBindingService.resolveDashboardData(ctx, dashboard);
    expect(data.size).toBe(dashboard.widgets.length);

    // 4. Generate a snapshot
    const snapshot = await snapshotService.generate(ctx, dashboard.id, {
      format: 'png',
      waitForData: true,
      maxWaitMs: 30000,
    });

    expect(snapshot.fileUrl).toBeTruthy();
    expect(snapshot.errorCount).toBe(0);
    expect(snapshot.generationTimeMs).toBeLessThan(30000);
  });
});
```

### Testing Utilities

```typescript
import { createTestDashboard, createTestWidget, createTestFilter } from '@mcv/analytics/dashboards/testing';

// Create a test dashboard with pre-configured widgets
const { dashboard, widgets } = await createTestDashboard(ctx, {
  ventureId: 'venture_test',
  widgetCount: 5,
  withFilters: true,
  withDataSources: true,
});

// Create an isolated test widget with mock data
const widget = createTestWidget('bar_chart', {
  mockData: [
    { category: 'A', value: 100 },
    { category: 'B', value: 200 },
    { category: 'C', value: 150 },
  ],
});
```

### Test Coverage Requirements

| Area | Min Coverage | Notes |
|------|-------------|-------|
| DashboardService | 90% | CRUD, permissions, soft-delete |
| WidgetService | 85% | CRUD, positioning, config validation |
| DataBindingService | 85% | All source types, caching, error handling |
| FilterService | 80% | All filter types, resolution priority |
| ShareService | 90% | Token generation, validation, expiry, passwords |
| ScheduleService | 80% | Cron parsing, processing, delivery |
| SnapshotService | 75% | Generation (mocked Puppeteer), cleanup |
| PermissionService | 90% | Grant resolution, hierarchy, widget-level |
| Widget Components | 70% | Render with data, loading, error states |
| Hooks | 75% | State management, subscription lifecycle |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.18.0 | 2025-10-15 | Initial release — dashboard CRUD, basic widget library (line, bar, pie, KPI) |
| 0.19.0 | 2025-11-01 | Added data table widget, filter system, global date range filter |
| 0.20.0 | 2025-11-15 | Template engine, 5 built-in templates (exec, sales, marketing, eng, finance) |
| 0.21.0 | 2025-12-01 | Sharing system (user, team, link), PDF export |
| 0.22.0 | 2025-12-15 | Scheduling & snapshots, email delivery |
| 0.23.0 | 2026-01-05 | Real-time updates via Supabase Realtime |
| 0.24.0 | 2026-01-20 | Embed support, domain allowlisting, iframe component |
| 0.25.0 | 2026-02-01 | Map widget (Mapbox GL), funnel, heatmap, gauge, sparkline |
| 0.25.1 | 2026-02-05 | Cross-widget filtering, widget-level permissions |
| 0.26.0 | 2026-02-08 | Responsive breakpoints, mobile layout, 4 new templates (ops, HR, product, CS) |