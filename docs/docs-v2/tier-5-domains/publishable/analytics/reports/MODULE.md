# @mcv/analytics/reports

> **Tier 5 Domain** · Publishable · Analytics Reports  
> Build, schedule, and distribute business reports across ventures.

---

## Purpose

The **reports** module provides a comprehensive report generation and distribution platform for the MCV ecosystem. It enables venture operators, analysts, and executives to build rich, data-driven reports using a visual builder, schedule them for automatic generation, and distribute them across multiple channels — email, Slack, Teams, embedded dashboards, and shared links.

Reports pull data from multiple sources — internal metrics pipelines, raw SQL queries, external APIs, and spreadsheet uploads — and render them into professional, white-labeled documents in PDF, Excel, CSV, PowerPoint, and HTML formats. The module supports parameterized reports with dynamic date ranges, venture scoping, and department filtering, enabling a single template to serve many contexts.

Key capabilities:

- **Visual report builder** with drag-and-drop sections, charts, tables, KPIs, and text blocks
- **Pre-built templates** for common business needs (monthly business review, weekly ops, quarterly board)
- **Automated scheduling** with daily, weekly, monthly, and custom cron-based generation
- **Multi-channel distribution** via email (PDF attachments), shared links, dashboard embeds, and Slack/Teams delivery
- **Parameterized reports** with dynamic variables for date ranges, ventures, departments, and custom filters
- **Version control** for both report templates and generated outputs
- **White-labeling** with venture-specific branding, logos, color schemes, and headers/footers
- **Collaboration** with inline comments, annotations, and external stakeholder sharing
- **Export flexibility** supporting PDF, Excel, CSV, PowerPoint, and HTML output formats

---

## Exports

```typescript
// === Core Service ===
export { ReportService }             from './services/report.service';
export { ReportBuilderService }      from './services/report-builder.service';
export { ReportSchedulerService }    from './services/report-scheduler.service';
export { ReportDistributionService } from './services/report-distribution.service';
export { ReportExportService }       from './services/report-export.service';
export { ReportTemplateService }     from './services/report-template.service';
export { ReportVersioningService }   from './services/report-versioning.service';
export { ReportDataSourceService }   from './services/report-datasource.service';

// === tRPC Router ===
export { reportsRouter }            from './router';

// === Types ===
export type { Report }              from './types';
export type { ReportTemplate }      from './types';
export type { ReportSchedule }      from './types';
export type { ReportSection }       from './types';
export type { ReportExport }        from './types';
export type { ReportVersion }       from './types';
export type { ReportDataSource }    from './types';
export type { ReportDistribution }  from './types';
export type { ReportComment }       from './types';
export type { ReportParameter }     from './types';
export type { ReportBranding }      from './types';
export type { ReportConfig }        from './types';
export type { SectionType }         from './types';
export type { ExportFormat }        from './types';
export type { ScheduleFrequency }   from './types';
export type { DistributionChannel } from './types';
export type { DataSourceType }      from './types';

// === Schemas ===
export { reportSchema }             from './schemas';
export { reportTemplateSchema }     from './schemas';
export { reportScheduleSchema }     from './schemas';
export { reportSectionSchema }      from './schemas';
export { reportExportSchema }       from './schemas';
export { reportParameterSchema }    from './schemas';
export { reportBrandingSchema }     from './schemas';

// === Utilities ===
export { renderReport }             from './utils/render';
export { resolveParameters }        from './utils/parameters';
export { buildReportPdf }           from './utils/pdf';
export { buildReportExcel }         from './utils/excel';
export { buildReportCsv }           from './utils/csv';
export { buildReportPptx }          from './utils/pptx';
export { buildReportHtml }          from './utils/html';
export { validateDataSource }       from './utils/datasource';
export { applyBranding }            from './utils/branding';

// === Constants ===
export { REPORT_ERRORS }            from './constants';
export { REPORT_DEFAULTS }          from './constants';
export { REPORT_LIMITS }            from './constants';
export { SECTION_TYPES }            from './constants';
export { EXPORT_FORMATS }           from './constants';
export { SCHEDULE_FREQUENCIES }     from './constants';
export { DISTRIBUTION_CHANNELS }    from './constants';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                     │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ Report Builder│  │ Report Viewer│  │  Scheduler   │                   │
│  │    (React)    │  │   (React)    │  │    UI        │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
│         │                  │                  │                           │
│         └──────────────────┼──────────────────┘                          │
│                            │                                             │
│                     tRPC / WebSocket                                     │
└────────────────────────────┼─────────────────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────────────┐
│                      SERVICE LAYER                                       │
│                            │                                             │
│  ┌─────────────────────────▼─────────────────────────────────┐           │
│  │                    ReportService                           │           │
│  │                 (Orchestration Layer)                       │           │
│  └──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬───┘           │
│     │      │      │      │      │      │      │      │               │
│  ┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐         │
│  │Build││Templ││Sched││Distr││Exprt││Versn││Data ││Brand│         │
│  │er   ││ate  ││uler ││ibtn ││     ││ing  ││Src  ││ing  │         │
│  └──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘         │
│     │      │      │      │      │      │      │      │               │
└─────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────────────┘
      │      │      │      │      │      │      │      │
┌─────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼───────────────┐
│     │    DATA & RENDERING LAYER                │      │               │
│     │      │      │      │      │      │      │      │               │
│  ┌──▼──────▼──────▼──────▼──────▼──────▼──────▼──────▼──┐           │
│  │              Supabase PostgreSQL                       │           │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │           │
│  │  │ reports  │ │templates │ │schedules │ │ exports  │ │           │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │           │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │           │
│  │  │ sections │ │ versions │ │datasource│ │ comments │ │           │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │           │
│  └───────────────────────────────────────────────────────┘           │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │              Rendering Engines                           │         │
│  │  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐           │         │
│  │  │Puppete│  │ExcelJS│  │ pptx  │  │  CSV  │           │         │
│  │  │er/PDF │  │       │  │genjs  │  │Parser │           │         │
│  │  └───────┘  └───────┘  └───────┘  └───────┘           │         │
│  └─────────────────────────────────────────────────────────┘         │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │              External Integrations                       │         │
│  │  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐           │         │
│  │  │ Email │  │ Slack │  │ Teams │  │  S3   │           │         │
│  │  │(SMTP) │  │ API   │  │Webhook│  │Storage│           │         │
│  │  └───────┘  └───────┘  └───────┘  └───────┘           │         │
│  └─────────────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Template  │────▶│  Resolve   │────▶│  Fetch     │────▶│  Render    │
│  Selection │     │  Params    │     │  Data      │     │  Sections  │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
                                                               │
┌────────────┐     ┌────────────┐     ┌────────────┐          │
│ Distribute │◀────│  Store     │◀────│  Export    │◀─────────┘
│            │     │  Version   │     │  Format    │
└────────────┘     └────────────┘     └────────────┘
```

### Scheduling Pipeline

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│  Cron      │────▶│  Check     │────▶│  Generate  │────▶│  Distribute│
│  Trigger   │     │  Schedule  │     │  Report    │     │  & Notify  │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
      │                  │                  │                    │
      │                  ▼                  ▼                    ▼
      │            ┌──────────┐      ┌──────────┐        ┌──────────┐
      │            │Skip if   │      │Retry on  │        │Log       │
      │            │paused    │      │failure   │        │delivery  │
      │            └──────────┘      └──────────┘        └──────────┘
      │
      ▼
 ┌──────────┐
 │Lock to   │
 │prevent   │
 │duplicate │
 └──────────┘
```

---

## Core Interfaces

### ReportService

The primary orchestration layer for all report operations.

```typescript
import { TRPCError } from '@trpc/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * ReportService — Orchestration layer for report CRUD,
 * generation, scheduling, and distribution.
 */
export class ReportService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly builder: ReportBuilderService,
    private readonly scheduler: ReportSchedulerService,
    private readonly distribution: ReportDistributionService,
    private readonly exporter: ReportExportService,
    private readonly templates: ReportTemplateService,
    private readonly versioning: ReportVersioningService,
    private readonly dataSources: ReportDataSourceService,
  ) {}

  // ── Report CRUD ──────────────────────────────────────────────

  /**
   * Create a new report from scratch or from a template.
   */
  async createReport(input: CreateReportInput): Promise<Report> {
    const { ventureId, templateId, name, description, parameters, branding } = input;

    // If template-based, clone template structure
    let sections: ReportSectionInput[] = [];
    if (templateId) {
      const template = await this.templates.getTemplate(templateId);
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: REPORT_ERRORS.TEMPLATE_NOT_FOUND,
        });
      }
      sections = template.sections.map(s => ({
        ...s,
        id: undefined, // Will be auto-generated
      }));
    }

    const { data: report, error } = await this.db
      .from('reports')
      .insert({
        venture_id: ventureId,
        template_id: templateId ?? null,
        name,
        description: description ?? null,
        status: 'draft',
        parameters: parameters ?? {},
        branding: branding ?? null,
        created_by: input.userId,
      })
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: REPORT_ERRORS.CREATE_FAILED,
        cause: error,
      });
    }

    // Create sections if from template
    if (sections.length > 0) {
      await this.builder.createSections(report.id, sections);
    }

    // Create initial version
    await this.versioning.createVersion(report.id, {
      version: 1,
      snapshot: { sections, parameters: parameters ?? {} },
      createdBy: input.userId,
    });

    return this.mapReport(report);
  }

  /**
   * Get a report by ID with all sections and metadata.
   */
  async getReport(reportId: string, ventureId: string): Promise<Report> {
    const { data, error } = await this.db
      .from('reports')
      .select(`
        *,
        sections:report_sections(*, data_source:report_data_sources(*)),
        schedule:report_schedules(*),
        branding_config:report_brandings(*),
        exports:report_exports(id, format, status, created_at, file_url)
      `)
      .eq('id', reportId)
      .eq('venture_id', ventureId)
      .single();

    if (error || !data) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: REPORT_ERRORS.REPORT_NOT_FOUND,
      });
    }

    return this.mapReport(data);
  }

  /**
   * List reports for a venture with filtering and pagination.
   */
  async listReports(input: ListReportsInput): Promise<PaginatedResult<Report>> {
    const {
      ventureId,
      status,
      templateId,
      createdBy,
      search,
      sortBy = 'updated_at',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = input;

    let query = this.db
      .from('reports')
      .select('*, sections:report_sections(count)', { count: 'exact' })
      .eq('venture_id', ventureId);

    if (status) query = query.eq('status', status);
    if (templateId) query = query.eq('template_id', templateId);
    if (createdBy) query = query.eq('created_by', createdBy);
    if (search) query = query.ilike('name', `%${search}%`);

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: REPORT_ERRORS.LIST_FAILED,
        cause: error,
      });
    }

    return {
      items: (data ?? []).map(this.mapReport),
      total: count ?? 0,
      page,
      limit,
      hasMore: (count ?? 0) > page * limit,
    };
  }

  /**
   * Update report metadata (name, description, parameters, status).
   */
  async updateReport(reportId: string, input: UpdateReportInput): Promise<Report> {
    const { ventureId, name, description, parameters, status, branding } = input;

    const existing = await this.getReport(reportId, ventureId);

    // Validate status transitions
    if (status && !this.isValidStatusTransition(existing.status, status)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: REPORT_ERRORS.INVALID_STATUS_TRANSITION,
      });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (parameters !== undefined) updates.parameters = parameters;
    if (status !== undefined) updates.status = status;
    if (branding !== undefined) updates.branding = branding;

    const { data, error } = await this.db
      .from('reports')
      .update(updates)
      .eq('id', reportId)
      .eq('venture_id', ventureId)
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: REPORT_ERRORS.UPDATE_FAILED,
        cause: error,
      });
    }

    return this.mapReport(data);
  }

  /**
   * Delete a report and all associated data.
   */
  async deleteReport(reportId: string, ventureId: string): Promise<void> {
    // Cascade deletes handle sections, exports, versions, comments
    const { error } = await this.db
      .from('reports')
      .delete()
      .eq('id', reportId)
      .eq('venture_id', ventureId);

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: REPORT_ERRORS.DELETE_FAILED,
        cause: error,
      });
    }

    // Clean up stored exports from S3/storage
    await this.exporter.cleanupExports(reportId);
  }

  /**
   * Duplicate an existing report (deep clone of sections + config).
   */
  async duplicateReport(reportId: string, ventureId: string, userId: string): Promise<Report> {
    const existing = await this.getReport(reportId, ventureId);

    return this.createReport({
      ventureId,
      name: `${existing.name} (Copy)`,
      description: existing.description,
      templateId: existing.templateId ?? undefined,
      parameters: existing.parameters,
      branding: existing.branding,
      userId,
    });
  }

  // ── Report Generation ────────────────────────────────────────

  /**
   * Generate a report — resolve parameters, fetch data, render sections,
   * export to requested format, and optionally distribute.
   */
  async generateReport(input: GenerateReportInput): Promise<ReportExport> {
    const {
      reportId,
      ventureId,
      format = 'pdf',
      parameters,
      distribute = false,
      userId,
    } = input;

    const report = await this.getReport(reportId, ventureId);

    if (report.status === 'archived') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: REPORT_ERRORS.REPORT_ARCHIVED,
      });
    }

    // 1. Resolve parameters (merge defaults + overrides)
    const resolvedParams = resolveParameters(
      report.parameters,
      parameters ?? {},
    );

    // 2. Fetch data for all sections
    const sectionData = await Promise.all(
      report.sections.map(async (section) => {
        if (!section.dataSource) return { sectionId: section.id, data: null };
        const data = await this.dataSources.fetchData(
          section.dataSource,
          resolvedParams,
        );
        return { sectionId: section.id, data };
      }),
    );

    // 3. Build section map
    const dataMap = new Map(
      sectionData.map(sd => [sd.sectionId, sd.data]),
    );

    // 4. Render to HTML (intermediate step for PDF/HTML)
    const renderedHtml = await renderReport(report, dataMap, resolvedParams);

    // 5. Export to requested format
    const exportResult = await this.exporter.export({
      reportId: report.id,
      ventureId,
      html: renderedHtml,
      format,
      branding: report.branding,
      sections: report.sections,
      sectionData: dataMap,
      parameters: resolvedParams,
    });

    // 6. Create version snapshot of generated output
    await this.versioning.createVersion(report.id, {
      version: await this.versioning.getNextVersion(report.id),
      snapshot: {
        parameters: resolvedParams,
        exportId: exportResult.id,
        generatedAt: new Date().toISOString(),
      },
      createdBy: userId,
    });

    // 7. Distribute if requested
    if (distribute && report.schedule?.distributions) {
      await this.distribution.distribute({
        reportId: report.id,
        exportId: exportResult.id,
        fileUrl: exportResult.fileUrl,
        format,
        reportName: report.name,
        distributions: report.schedule.distributions,
        branding: report.branding,
      });
    }

    return exportResult;
  }

  // ── Helpers ──────────────────────────────────────────────────

  private isValidStatusTransition(from: ReportStatus, to: ReportStatus): boolean {
    const transitions: Record<ReportStatus, ReportStatus[]> = {
      draft: ['active', 'archived'],
      active: ['draft', 'archived'],
      archived: ['draft'],
    };
    return transitions[from]?.includes(to) ?? false;
  }

  private mapReport(row: Record<string, unknown>): Report {
    return {
      id: row.id as string,
      ventureId: row.venture_id as string,
      templateId: row.template_id as string | null,
      name: row.name as string,
      description: row.description as string | null,
      status: row.status as ReportStatus,
      parameters: row.parameters as Record<string, ReportParameter>,
      branding: row.branding as ReportBranding | null,
      sections: Array.isArray(row.sections)
        ? row.sections.map(this.mapSection)
        : [],
      schedule: row.schedule ? this.mapSchedule(row.schedule) : null,
      createdBy: row.created_by as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapSection(row: Record<string, unknown>): ReportSection {
    return {
      id: row.id as string,
      reportId: row.report_id as string,
      type: row.type as SectionType,
      title: row.title as string | null,
      config: row.config as Record<string, unknown>,
      order: row.order as number,
      dataSource: row.data_source as ReportDataSource | null,
    };
  }

  private mapSchedule(row: unknown): ReportSchedule {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      reportId: r.report_id as string,
      frequency: r.frequency as ScheduleFrequency,
      cronExpression: r.cron_expression as string | null,
      timezone: r.timezone as string,
      nextRunAt: r.next_run_at as string,
      lastRunAt: r.last_run_at as string | null,
      enabled: r.enabled as boolean,
      parameters: r.parameters as Record<string, unknown>,
      distributions: Array.isArray(r.distributions) ? r.distributions : [],
      format: r.format as ExportFormat,
    };
  }
}
```

### Report

```typescript
/**
 * Core report entity — represents a configured report
 * with sections, parameters, and optional scheduling.
 */
export interface Report {
  /** Unique report identifier (UUID) */
  id: string;

  /** Venture this report belongs to */
  ventureId: string;

  /** Source template ID, if created from a template */
  templateId: string | null;

  /** Display name */
  name: string;

  /** Human-readable description */
  description: string | null;

  /** Current status: draft | active | archived */
  status: ReportStatus;

  /** Parameter definitions and default values */
  parameters: Record<string, ReportParameter>;

  /** White-label branding configuration */
  branding: ReportBranding | null;

  /** Ordered list of report sections */
  sections: ReportSection[];

  /** Attached schedule (null if not scheduled) */
  schedule: ReportSchedule | null;

  /** User who created the report */
  createdBy: string;

  /** ISO 8601 timestamps */
  createdAt: string;
  updatedAt: string;
}

export type ReportStatus = 'draft' | 'active' | 'archived';

/**
 * Paginated result wrapper used across list endpoints.
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

### ReportTemplate

```typescript
/**
 * ReportTemplate — Pre-built or user-created report blueprints.
 * Templates define a default section layout, parameters, and branding
 * that are cloned when a new report is created from the template.
 */
export interface ReportTemplate {
  /** Unique template identifier */
  id: string;

  /** Venture scope (null = global/system template) */
  ventureId: string | null;

  /** Template display name */
  name: string;

  /** Description of what the template provides */
  description: string;

  /** Category: monthly_review | weekly_ops | quarterly_board | custom */
  category: TemplateCategory;

  /** Ordered section definitions (cloned into new reports) */
  sections: TemplateSectionDefinition[];

  /** Default parameters the template expects */
  parameters: Record<string, ReportParameter>;

  /** Default branding (can be overridden per report) */
  branding: ReportBranding | null;

  /** Preview thumbnail URL */
  thumbnailUrl: string | null;

  /** Whether this is a system-provided template */
  isSystem: boolean;

  /** Number of reports created from this template */
  usageCount: number;

  /** ISO 8601 timestamps */
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory =
  | 'monthly_review'
  | 'weekly_ops'
  | 'quarterly_board'
  | 'financial'
  | 'marketing'
  | 'engineering'
  | 'custom';

export interface TemplateSectionDefinition {
  /** Section type */
  type: SectionType;

  /** Default title */
  title: string | null;

  /** Section-specific configuration */
  config: Record<string, unknown>;

  /** Display order */
  order: number;

  /** Attached data source definition (if applicable) */
  dataSource: DataSourceDefinition | null;
}

export interface DataSourceDefinition {
  /** Source type */
  type: DataSourceType;

  /** Query, endpoint URL, or metric identifier */
  source: string;

  /** Additional config (headers, auth, transformations) */
  config: Record<string, unknown>;
}
```

### ReportSchedule

```typescript
/**
 * ReportSchedule — Defines when a report auto-generates and
 * how the output is distributed. Supports standard frequencies
 * and custom cron expressions.
 */
export interface ReportSchedule {
  /** Unique schedule identifier */
  id: string;

  /** Report this schedule belongs to */
  reportId: string;

  /** Frequency preset: daily | weekly | monthly | quarterly | custom */
  frequency: ScheduleFrequency;

  /** Custom cron expression (required when frequency = 'custom') */
  cronExpression: string | null;

  /** IANA timezone for schedule evaluation */
  timezone: string;

  /** Next scheduled generation time (ISO 8601) */
  nextRunAt: string;

  /** Last generation time (null if never run) */
  lastRunAt: string | null;

  /** Whether the schedule is active */
  enabled: boolean;

  /** Parameter overrides for scheduled runs */
  parameters: Record<string, unknown>;

  /** Distribution targets */
  distributions: ReportDistribution[];

  /** Export format for scheduled output */
  format: ExportFormat;

  /** Maximum retry attempts on failure */
  maxRetries: number;

  /** Current consecutive failure count */
  failureCount: number;

  /** Last error message (null if last run succeeded) */
  lastError: string | null;
}

export type ScheduleFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'annually'
  | 'custom';

export interface ScheduleRunLog {
  /** Run identifier */
  id: string;

  /** Schedule that triggered the run */
  scheduleId: string;

  /** Run status */
  status: 'success' | 'failed' | 'skipped';

  /** Start and end times */
  startedAt: string;
  completedAt: string | null;

  /** Generated export ID (null on failure) */
  exportId: string | null;

  /** Error details on failure */
  error: string | null;

  /** Distribution results */
  distributionResults: DistributionResult[];

  /** Execution duration in milliseconds */
  durationMs: number;
}
```

### ReportSection

```typescript
/**
 * ReportSection — An individual block within a report.
 * Sections are ordered and typed, each with its own configuration
 * and optional data source.
 */
export interface ReportSection {
  /** Unique section identifier */
  id: string;

  /** Parent report ID */
  reportId: string;

  /** Section type determines rendering behavior */
  type: SectionType;

  /** Section title (null for spacers/dividers) */
  title: string | null;

  /** Section-specific configuration (chart options, table columns, etc.) */
  config: SectionConfig;

  /** Display order (0-based, ascending) */
  order: number;

  /** Data source that feeds this section */
  dataSource: ReportDataSource | null;

  /** Visibility: always | conditional */
  visibility: 'always' | 'conditional';

  /** Condition expression for conditional visibility */
  visibilityCondition: string | null;

  /** Page break before this section */
  pageBreakBefore: boolean;
}

export type SectionType =
  | 'kpi_card'
  | 'chart_bar'
  | 'chart_line'
  | 'chart_pie'
  | 'chart_area'
  | 'chart_scatter'
  | 'chart_funnel'
  | 'table'
  | 'text'
  | 'image'
  | 'divider'
  | 'spacer'
  | 'header'
  | 'summary'
  | 'metric_grid'
  | 'comparison'
  | 'heatmap';

/**
 * Union config type — each section type has specific config fields.
 */
export type SectionConfig =
  | KpiCardConfig
  | ChartConfig
  | TableConfig
  | TextConfig
  | ImageConfig
  | DividerConfig
  | SpacerConfig
  | HeaderConfig
  | SummaryConfig
  | MetricGridConfig
  | ComparisonConfig
  | HeatmapConfig;

export interface KpiCardConfig {
  /** Metric identifier or expression */
  metric: string;
  /** Display label */
  label: string;
  /** Number format (decimal places, currency, percentage) */
  format: NumberFormat;
  /** Comparison period for trend indicator */
  comparisonPeriod: 'previous_period' | 'year_over_year' | 'none';
  /** Target value for progress indicator */
  target: number | null;
  /** Color theme */
  colorScheme: 'auto' | 'green' | 'blue' | 'red' | 'neutral';
}

export interface ChartConfig {
  /** Chart-specific type (used for shared chart rendering) */
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'funnel';
  /** X-axis field */
  xAxis: string;
  /** Y-axis field(s) */
  yAxis: string[];
  /** Series grouping field */
  groupBy: string | null;
  /** Chart dimensions */
  width: number;
  height: number;
  /** Whether to show legend */
  showLegend: boolean;
  /** Whether to show data labels */
  showLabels: boolean;
  /** Color palette override */
  colors: string[] | null;
  /** Axis labels */
  xAxisLabel: string | null;
  yAxisLabel: string | null;
  /** Stacked mode for bar/area charts */
  stacked: boolean;
}

export interface TableConfig {
  /** Column definitions */
  columns: TableColumnDef[];
  /** Row limit (null = show all) */
  rowLimit: number | null;
  /** Enable sorting */
  sortable: boolean;
  /** Default sort column and direction */
  defaultSort: { column: string; direction: 'asc' | 'desc' } | null;
  /** Striped rows */
  striped: boolean;
  /** Show row numbers */
  showRowNumbers: boolean;
  /** Summary row configuration */
  summaryRow: SummaryRowConfig | null;
}

export interface TableColumnDef {
  /** Field key in data */
  field: string;
  /** Display header */
  header: string;
  /** Column width */
  width: string | null;
  /** Value format */
  format: NumberFormat | DateFormat | null;
  /** Text alignment */
  align: 'left' | 'center' | 'right';
  /** Conditional formatting rules */
  conditionalFormat: ConditionalFormatRule[] | null;
}

export interface TextConfig {
  /** Rich text content (HTML or Markdown) */
  content: string;
  /** Content format */
  contentType: 'html' | 'markdown';
  /** Whether to resolve parameter tokens in content */
  resolveParameters: boolean;
}

export interface ImageConfig {
  /** Image URL or data source reference */
  src: string;
  /** Alt text */
  alt: string;
  /** Display width */
  width: string;
  /** Display height */
  height: string | null;
  /** Alignment */
  align: 'left' | 'center' | 'right';
}

export interface DividerConfig {
  /** Divider style */
  style: 'solid' | 'dashed' | 'dotted';
  /** Divider color */
  color: string;
  /** Margin above and below */
  margin: number;
}

export interface SpacerConfig {
  /** Height in pixels */
  height: number;
}

export interface HeaderConfig {
  /** Heading level */
  level: 1 | 2 | 3 | 4;
  /** Heading text */
  text: string;
  /** Subtitle text */
  subtitle: string | null;
}

export interface SummaryConfig {
  /** Metrics to display in summary */
  metrics: SummaryMetric[];
  /** Layout: grid | inline */
  layout: 'grid' | 'inline';
  /** Columns in grid layout */
  columns: number;
}

export interface SummaryMetric {
  label: string;
  metric: string;
  format: NumberFormat;
  icon: string | null;
}

export interface MetricGridConfig {
  /** Metric definitions */
  metrics: MetricGridItem[];
  /** Grid columns */
  columns: 2 | 3 | 4;
}

export interface MetricGridItem {
  label: string;
  metric: string;
  format: NumberFormat;
  sparkline: boolean;
  trend: boolean;
}

export interface ComparisonConfig {
  /** Metrics to compare */
  metrics: string[];
  /** Periods to compare */
  periods: string[];
  /** Display as table or chart */
  display: 'table' | 'chart';
}

export interface HeatmapConfig {
  /** X-axis field */
  xField: string;
  /** Y-axis field */
  yField: string;
  /** Value field */
  valueField: string;
  /** Color scale */
  colorScale: 'green' | 'blue' | 'red' | 'diverging';
}

export interface NumberFormat {
  type: 'number' | 'currency' | 'percentage' | 'compact';
  decimals: number;
  currency: string | null;
  locale: string | null;
}

export interface DateFormat {
  type: 'date';
  pattern: string; // e.g., 'YYYY-MM-DD', 'MMM D, YYYY'
}

export interface ConditionalFormatRule {
  condition: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between';
  value: number | [number, number];
  style: {
    color: string | null;
    backgroundColor: string | null;
    fontWeight: 'normal' | 'bold' | null;
  };
}

export interface SummaryRowConfig {
  label: string;
  aggregations: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count'>;
}
```

### ReportExport

```typescript
/**
 * ReportExport — Represents a generated report output file.
 * Each generation creates a new export record with storage reference.
 */
export interface ReportExport {
  /** Unique export identifier */
  id: string;

  /** Source report ID */
  reportId: string;

  /** Venture ID */
  ventureId: string;

  /** Export format */
  format: ExportFormat;

  /** Current generation status */
  status: ExportStatus;

  /** Stored file URL (S3, Supabase Storage, etc.) */
  fileUrl: string | null;

  /** File size in bytes */
  fileSizeBytes: number | null;

  /** Page count (PDF only) */
  pageCount: number | null;

  /** Parameters used for this generation */
  parameters: Record<string, unknown>;

  /** Branding applied */
  branding: ReportBranding | null;

  /** User or schedule that triggered generation */
  generatedBy: string;

  /** Whether this was triggered by a schedule */
  isScheduled: boolean;

  /** Schedule ID if triggered by schedule */
  scheduleId: string | null;

  /** Generation timing */
  startedAt: string;
  completedAt: string | null;

  /** Generation duration in milliseconds */
  durationMs: number | null;

  /** Error message if generation failed */
  error: string | null;

  /** Expiration time for auto-cleanup */
  expiresAt: string | null;
}

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'pptx' | 'html';

export type ExportStatus =
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'expired';
```

### ReportParameter

```typescript
/**
 * ReportParameter — Defines a dynamic parameter that can be
 * passed at generation time to customize report output.
 */
export interface ReportParameter {
  /** Parameter key (used in templates and queries) */
  key: string;

  /** Display label */
  label: string;

  /** Parameter type */
  type: ParameterType;

  /** Default value */
  defaultValue: unknown;

  /** Whether the parameter is required */
  required: boolean;

  /** Description shown in UI */
  description: string | null;

  /** Validation rules */
  validation: ParameterValidation | null;

  /** Options for select/multi-select types */
  options: ParameterOption[] | null;

  /** Dynamic options source (e.g., venture list endpoint) */
  optionsSource: string | null;
}

export type ParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'date_range'
  | 'select'
  | 'multi_select'
  | 'venture'
  | 'department';

export interface ParameterOption {
  value: string;
  label: string;
}

export interface ParameterValidation {
  min: number | null;
  max: number | null;
  pattern: string | null;
  message: string | null;
}
```

### ReportBranding

```typescript
/**
 * ReportBranding — White-label configuration for venture-branded reports.
 * Applied during rendering and export.
 */
export interface ReportBranding {
  /** Venture logo URL */
  logoUrl: string | null;

  /** Logo placement: header | footer | both */
  logoPlacement: 'header' | 'footer' | 'both';

  /** Logo dimensions */
  logoWidth: number;
  logoHeight: number;

  /** Primary brand color (hex) */
  primaryColor: string;

  /** Secondary brand color (hex) */
  secondaryColor: string;

  /** Accent color for highlights (hex) */
  accentColor: string;

  /** Background color (hex) */
  backgroundColor: string;

  /** Text color (hex) */
  textColor: string;

  /** Font family for headings */
  headingFont: string;

  /** Font family for body text */
  bodyFont: string;

  /** Custom header content (HTML) */
  headerHtml: string | null;

  /** Custom footer content (HTML) */
  footerHtml: string | null;

  /** Footer text (simple alternative to footerHtml) */
  footerText: string | null;

  /** Show page numbers */
  showPageNumbers: boolean;

  /** Page number format */
  pageNumberFormat: 'numeric' | 'of_total'; // e.g., "3" or "3 of 10"

  /** Cover page configuration */
  coverPage: CoverPageConfig | null;

  /** Table of contents */
  showTableOfContents: boolean;

  /** Custom CSS overrides */
  customCss: string | null;
}

export interface CoverPageConfig {
  /** Show cover page */
  enabled: boolean;
  /** Cover title (default: report name) */
  title: string | null;
  /** Cover subtitle */
  subtitle: string | null;
  /** Cover background image URL */
  backgroundImageUrl: string | null;
  /** Date display format */
  dateFormat: string;
  /** Show generation date */
  showDate: boolean;
  /** Show prepared-by info */
  showPreparedBy: boolean;
}
```

### ReportDistribution

```typescript
/**
 * ReportDistribution — Defines a delivery channel for generated reports.
 * Multiple distributions can be attached to a schedule.
 */
export interface ReportDistribution {
  /** Unique distribution identifier */
  id: string;

  /** Distribution channel type */
  channel: DistributionChannel;

  /** Channel-specific configuration */
  config: DistributionConfig;

  /** Whether this distribution is active */
  enabled: boolean;
}

export type DistributionChannel =
  | 'email'
  | 'slack'
  | 'teams'
  | 'webhook'
  | 'shared_link'
  | 'dashboard_embed';

export type DistributionConfig =
  | EmailDistributionConfig
  | SlackDistributionConfig
  | TeamsDistributionConfig
  | WebhookDistributionConfig
  | SharedLinkConfig
  | DashboardEmbedConfig;

export interface EmailDistributionConfig {
  /** Recipient email addresses */
  recipients: string[];
  /** CC addresses */
  cc: string[];
  /** BCC addresses */
  bcc: string[];
  /** Email subject (supports parameter tokens) */
  subject: string;
  /** Email body (supports parameter tokens) */
  body: string;
  /** Whether to attach the report file */
  attachReport: boolean;
  /** Whether to include inline preview */
  includePreview: boolean;
  /** Reply-to address */
  replyTo: string | null;
}

export interface SlackDistributionConfig {
  /** Slack workspace ID */
  workspaceId: string;
  /** Slack channel ID */
  channelId: string;
  /** Message text (supports parameter tokens) */
  message: string;
  /** Whether to upload file to channel */
  uploadFile: boolean;
  /** Whether to include a preview snippet */
  includeSnippet: boolean;
  /** Thread timestamp to reply to (null = new message) */
  threadTs: string | null;
}

export interface TeamsDistributionConfig {
  /** Teams webhook URL */
  webhookUrl: string;
  /** Card title */
  title: string;
  /** Card body */
  body: string;
  /** Whether to include download link */
  includeDownloadLink: boolean;
}

export interface WebhookDistributionConfig {
  /** Webhook endpoint URL */
  url: string;
  /** HTTP method */
  method: 'POST' | 'PUT';
  /** Custom headers */
  headers: Record<string, string>;
  /** Whether to include file as base64 in payload */
  includeFile: boolean;
  /** Authentication type */
  auth: WebhookAuth | null;
}

export interface WebhookAuth {
  type: 'bearer' | 'basic' | 'api_key';
  token: string | null;
  username: string | null;
  password: string | null;
  headerName: string | null;
}

export interface SharedLinkConfig {
  /** Link expiration (ISO 8601 duration, e.g., P30D) */
  expiresIn: string | null;
  /** Password protection */
  password: string | null;
  /** Allow download */
  allowDownload: boolean;
  /** Require authentication */
  requireAuth: boolean;
}

export interface DashboardEmbedConfig {
  /** Target dashboard ID */
  dashboardId: string;
  /** Widget position */
  position: { x: number; y: number; w: number; h: number };
  /** Auto-refresh interval (seconds, null = manual) */
  refreshInterval: number | null;
}

export interface DistributionResult {
  /** Distribution ID */
  distributionId: string;
  /** Channel type */
  channel: DistributionChannel;
  /** Delivery status */
  status: 'delivered' | 'failed' | 'skipped';
  /** Error message on failure */
  error: string | null;
  /** Delivery timestamp */
  deliveredAt: string | null;
  /** Channel-specific metadata (message ID, thread URL, etc.) */
  metadata: Record<string, unknown>;
}
```

### ReportComment

```typescript
/**
 * ReportComment — Inline comments and annotations on reports.
 * Supports threading and section-level targeting.
 */
export interface ReportComment {
  /** Comment identifier */
  id: string;

  /** Report this comment belongs to */
  reportId: string;

  /** Section ID (null = report-level comment) */
  sectionId: string | null;

  /** Parent comment ID for threading */
  parentId: string | null;

  /** Comment author user ID */
  authorId: string;

  /** Comment text (supports Markdown) */
  content: string;

  /** Whether the comment is resolved */
  resolved: boolean;

  /** Resolved by user ID */
  resolvedBy: string | null;

  /** ISO 8601 timestamps */
  createdAt: string;
  updatedAt: string;
}
```

### ReportVersion

```typescript
/**
 * ReportVersion — Version history entry for a report template
 * or generated output.
 */
export interface ReportVersion {
  /** Version identifier */
  id: string;

  /** Report this version belongs to */
  reportId: string;

  /** Sequential version number */
  version: number;

  /** Snapshot of report state at this version */
  snapshot: Record<string, unknown>;

  /** Change description */
  changeDescription: string | null;

  /** User who created this version */
  createdBy: string;

  /** ISO 8601 timestamp */
  createdAt: string;
}
```

### ReportDataSource

```typescript
/**
 * ReportDataSource — Defines where a section pulls its data from.
 * Supports metrics queries, raw SQL, external APIs, and uploaded spreadsheets.
 */
export interface ReportDataSource {
  /** Data source identifier */
  id: string;

  /** Section this data source feeds */
  sectionId: string;

  /** Source type */
  type: DataSourceType;

  /** Source identifier (metric ID, query, URL, or file reference) */
  source: string;

  /** Additional configuration */
  config: DataSourceConfig;

  /** Data transformation pipeline */
  transformations: DataTransformation[];

  /** Cache TTL in seconds (0 = no cache) */
  cacheTtlSeconds: number;

  /** Last successful fetch timestamp */
  lastFetchedAt: string | null;

  /** Last fetch error */
  lastError: string | null;
}

export type DataSourceType =
  | 'metric'
  | 'query'
  | 'api'
  | 'spreadsheet'
  | 'static';

export type DataSourceConfig =
  | MetricDataSourceConfig
  | QueryDataSourceConfig
  | ApiDataSourceConfig
  | SpreadsheetDataSourceConfig
  | StaticDataSourceConfig;

export interface MetricDataSourceConfig {
  /** Metric identifier from @mcv/analytics/metrics */
  metricId: string;
  /** Aggregation period */
  period: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  /** Aggregation function */
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'last';
  /** Filter expressions */
  filters: MetricFilter[];
}

export interface MetricFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';
  value: unknown;
}

export interface QueryDataSourceConfig {
  /** Raw SQL query (parameterized, uses $1, $2 syntax) */
  query: string;
  /** Parameter mapping: key → report parameter key */
  parameterMapping: Record<string, string>;
  /** Connection identifier (for multi-DB setups) */
  connectionId: string | null;
  /** Query timeout in seconds */
  timeoutSeconds: number;
  /** Maximum rows to return */
  maxRows: number;
}

export interface ApiDataSourceConfig {
  /** API endpoint URL (supports parameter tokens) */
  url: string;
  /** HTTP method */
  method: 'GET' | 'POST';
  /** Request headers */
  headers: Record<string, string>;
  /** Request body template (POST only) */
  body: string | null;
  /** Authentication configuration */
  auth: ApiAuth | null;
  /** JSON path to extract data from response */
  dataPath: string;
  /** Request timeout in seconds */
  timeoutSeconds: number;
}

export interface ApiAuth {
  type: 'bearer' | 'basic' | 'api_key' | 'oauth2';
  /** Token or credential reference (stored encrypted) */
  credentialRef: string;
}

export interface SpreadsheetDataSourceConfig {
  /** Uploaded file reference (Supabase Storage path) */
  fileRef: string;
  /** Sheet name (Excel only) */
  sheetName: string | null;
  /** Header row index (0-based) */
  headerRow: number;
  /** Data start row */
  dataStartRow: number;
  /** Column mapping */
  columnMapping: Record<string, string>;
}

export interface StaticDataSourceConfig {
  /** Static data inline */
  data: Record<string, unknown>[];
}

export interface DataTransformation {
  /** Transformation type */
  type: 'filter' | 'sort' | 'group' | 'aggregate' | 'calculate' | 'rename' | 'limit';
  /** Transformation-specific configuration */
  config: Record<string, unknown>;
  /** Order of application */
  order: number;
}
```

---

## Database Schemas

### `reports` table

```sql
CREATE TABLE reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id    UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  template_id   UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'active', 'archived')),
  parameters    JSONB NOT NULL DEFAULT '{}',
  branding      JSONB,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Indexes
  CONSTRAINT reports_name_venture_unique UNIQUE (venture_id, name)
);

CREATE INDEX idx_reports_venture_id ON reports(venture_id);
CREATE INDEX idx_reports_template_id ON reports(template_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_by ON reports(created_by);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_name_search ON reports USING gin(name gin_trgm_ops);

-- Auto-update updated_at
CREATE TRIGGER set_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### `report_templates` table

```sql
CREATE TABLE report_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id    UUID REFERENCES ventures(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'custom'
                  CHECK (category IN (
                    'monthly_review', 'weekly_ops', 'quarterly_board',
                    'financial', 'marketing', 'engineering', 'custom'
                  )),
  sections      JSONB NOT NULL DEFAULT '[]',
  parameters    JSONB NOT NULL DEFAULT '{}',
  branding      JSONB,
  thumbnail_url TEXT,
  is_system     BOOLEAN NOT NULL DEFAULT false,
  usage_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_templates_venture ON report_templates(venture_id);
CREATE INDEX idx_report_templates_category ON report_templates(category);
CREATE INDEX idx_report_templates_is_system ON report_templates(is_system);
CREATE INDEX idx_report_templates_usage ON report_templates(usage_count DESC);
```

### `report_sections` table

```sql
CREATE TABLE report_sections (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id            UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  type                 TEXT NOT NULL
                         CHECK (type IN (
                           'kpi_card', 'chart_bar', 'chart_line', 'chart_pie',
                           'chart_area', 'chart_scatter', 'chart_funnel',
                           'table', 'text', 'image', 'divider', 'spacer',
                           'header', 'summary', 'metric_grid', 'comparison',
                           'heatmap'
                         )),
  title                TEXT,
  config               JSONB NOT NULL DEFAULT '{}',
  "order"              INTEGER NOT NULL DEFAULT 0,
  visibility           TEXT NOT NULL DEFAULT 'always'
                         CHECK (visibility IN ('always', 'conditional')),
  visibility_condition TEXT,
  page_break_before    BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_sections_report ON report_sections(report_id);
CREATE INDEX idx_report_sections_order ON report_sections(report_id, "order");
CREATE INDEX idx_report_sections_type ON report_sections(type);
```

### `report_data_sources` table

```sql
CREATE TABLE report_data_sources (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id       UUID NOT NULL REFERENCES report_sections(id) ON DELETE CASCADE,
  type             TEXT NOT NULL
                     CHECK (type IN ('metric', 'query', 'api', 'spreadsheet', 'static')),
  source           TEXT NOT NULL,
  config           JSONB NOT NULL DEFAULT '{}',
  transformations  JSONB NOT NULL DEFAULT '[]',
  cache_ttl_seconds INTEGER NOT NULL DEFAULT 300,
  last_fetched_at  TIMESTAMPTZ,
  last_error       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT report_data_sources_section_unique UNIQUE (section_id)
);

CREATE INDEX idx_report_data_sources_section ON report_data_sources(section_id);
CREATE INDEX idx_report_data_sources_type ON report_data_sources(type);
```

### `report_schedules` table

```sql
CREATE TABLE report_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  frequency       TEXT NOT NULL
                    CHECK (frequency IN (
                      'daily', 'weekly', 'biweekly', 'monthly',
                      'quarterly', 'annually', 'custom'
                    )),
  cron_expression TEXT,
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  next_run_at     TIMESTAMPTZ NOT NULL,
  last_run_at     TIMESTAMPTZ,
  enabled         BOOLEAN NOT NULL DEFAULT true,
  parameters      JSONB NOT NULL DEFAULT '{}',
  distributions   JSONB NOT NULL DEFAULT '[]',
  format          TEXT NOT NULL DEFAULT 'pdf'
                    CHECK (format IN ('pdf', 'excel', 'csv', 'pptx', 'html')),
  max_retries     INTEGER NOT NULL DEFAULT 3,
  failure_count   INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT report_schedules_report_unique UNIQUE (report_id)
);

CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run_at)
  WHERE enabled = true;
CREATE INDEX idx_report_schedules_enabled ON report_schedules(enabled);
```

### `report_exports` table

```sql
CREATE TABLE report_exports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  format          TEXT NOT NULL
                    CHECK (format IN ('pdf', 'excel', 'csv', 'pptx', 'html')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'generating', 'completed', 'failed', 'expired')),
  file_url        TEXT,
  file_size_bytes BIGINT,
  page_count      INTEGER,
  parameters      JSONB NOT NULL DEFAULT '{}',
  branding        JSONB,
  generated_by    UUID NOT NULL REFERENCES users(id),
  is_scheduled    BOOLEAN NOT NULL DEFAULT false,
  schedule_id     UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  duration_ms     INTEGER,
  error           TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_exports_report ON report_exports(report_id);
CREATE INDEX idx_report_exports_venture ON report_exports(venture_id);
CREATE INDEX idx_report_exports_status ON report_exports(status);
CREATE INDEX idx_report_exports_created ON report_exports(created_at DESC);
CREATE INDEX idx_report_exports_expires ON report_exports(expires_at)
  WHERE expires_at IS NOT NULL AND status = 'completed';
CREATE INDEX idx_report_exports_schedule ON report_exports(schedule_id)
  WHERE schedule_id IS NOT NULL;
```

### `report_versions` table

```sql
CREATE TABLE report_versions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id          UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  version            INTEGER NOT NULL,
  snapshot           JSONB NOT NULL,
  change_description TEXT,
  created_by         UUID NOT NULL REFERENCES users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT report_versions_unique UNIQUE (report_id, version)
);

CREATE INDEX idx_report_versions_report ON report_versions(report_id);
CREATE INDEX idx_report_versions_number ON report_versions(report_id, version DESC);
```

### `report_comments` table

```sql
CREATE TABLE report_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  section_id  UUID REFERENCES report_sections(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES report_comments(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  resolved    BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_comments_report ON report_comments(report_id);
CREATE INDEX idx_report_comments_section ON report_comments(section_id);
CREATE INDEX idx_report_comments_parent ON report_comments(parent_id);
CREATE INDEX idx_report_comments_resolved ON report_comments(report_id, resolved);
```

### `report_schedule_runs` table

```sql
CREATE TABLE report_schedule_runs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id           UUID NOT NULL REFERENCES report_schedules(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'running'
                          CHECK (status IN ('running', 'success', 'failed', 'skipped')),
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at          TIMESTAMPTZ,
  export_id             UUID REFERENCES report_exports(id) ON DELETE SET NULL,
  error                 TEXT,
  distribution_results  JSONB NOT NULL DEFAULT '[]',
  duration_ms           INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedule_runs_schedule ON report_schedule_runs(schedule_id);
CREATE INDEX idx_schedule_runs_status ON report_schedule_runs(status);
CREATE INDEX idx_schedule_runs_started ON report_schedule_runs(started_at DESC);
```

### `report_shared_links` table

```sql
CREATE TABLE report_shared_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id   UUID NOT NULL REFERENCES report_exports(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  password    TEXT, -- bcrypt hash
  allow_download BOOLEAN NOT NULL DEFAULT true,
  require_auth   BOOLEAN NOT NULL DEFAULT false,
  expires_at  TIMESTAMPTZ,
  view_count  INTEGER NOT NULL DEFAULT 0,
  max_views   INTEGER, -- null = unlimited
  created_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_shared_links_token ON report_shared_links(token);
CREATE INDEX idx_shared_links_export ON report_shared_links(export_id);
CREATE INDEX idx_shared_links_expires ON report_shared_links(expires_at)
  WHERE expires_at IS NOT NULL;
```

### `report_brandings` table

```sql
CREATE TABLE report_brandings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id         UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  is_default         BOOLEAN NOT NULL DEFAULT false,
  logo_url           TEXT,
  logo_placement     TEXT NOT NULL DEFAULT 'header'
                       CHECK (logo_placement IN ('header', 'footer', 'both')),
  logo_width         INTEGER NOT NULL DEFAULT 150,
  logo_height        INTEGER NOT NULL DEFAULT 50,
  primary_color      TEXT NOT NULL DEFAULT '#1a1a2e',
  secondary_color    TEXT NOT NULL DEFAULT '#16213e',
  accent_color       TEXT NOT NULL DEFAULT '#0f3460',
  background_color   TEXT NOT NULL DEFAULT '#ffffff',
  text_color         TEXT NOT NULL DEFAULT '#1a1a2e',
  heading_font       TEXT NOT NULL DEFAULT 'Inter',
  body_font          TEXT NOT NULL DEFAULT 'Inter',
  header_html        TEXT,
  footer_html        TEXT,
  footer_text        TEXT,
  show_page_numbers  BOOLEAN NOT NULL DEFAULT true,
  page_number_format TEXT NOT NULL DEFAULT 'of_total'
                       CHECK (page_number_format IN ('numeric', 'of_total')),
  cover_page         JSONB,
  show_toc           BOOLEAN NOT NULL DEFAULT false,
  custom_css         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_brandings_venture ON report_brandings(venture_id);
CREATE UNIQUE INDEX idx_report_brandings_default
  ON report_brandings(venture_id) WHERE is_default = true;
```

---

## Code Examples

### 1. Creating a Report from a Template

```typescript
import { ReportService } from '@mcv/analytics/reports';

// Create a monthly business review from a template
const report = await reportService.createReport({
  ventureId: 'venture_abc123',
  templateId: 'tmpl_monthly_review',
  name: 'January 2026 Business Review',
  description: 'Monthly review of key business metrics for January 2026',
  parameters: {
    date_range: {
      key: 'date_range',
      label: 'Report Period',
      type: 'date_range',
      defaultValue: {
        start: '2026-01-01',
        end: '2026-01-31',
      },
      required: true,
      description: 'The time period covered by this report',
      validation: null,
      options: null,
      optionsSource: null,
    },
    venture: {
      key: 'venture',
      label: 'Venture',
      type: 'venture',
      defaultValue: 'venture_abc123',
      required: true,
      description: 'The venture to report on',
      validation: null,
      options: null,
      optionsSource: '/api/ventures/list',
    },
  },
  userId: 'user_xyz789',
});

console.log(`Created report: ${report.id} with ${report.sections.length} sections`);
```

### 2. Building a Report with the Visual Builder

```typescript
import { ReportBuilderService } from '@mcv/analytics/reports';

const builder = new ReportBuilderService(db);

// Add a header section
await builder.addSection(report.id, {
  type: 'header',
  title: null,
  config: {
    level: 1,
    text: 'Monthly Business Review',
    subtitle: '{{date_range.start}} - {{date_range.end}}',
  },
  order: 0,
});

// Add KPI cards row
await builder.addSection(report.id, {
  type: 'metric_grid',
  title: 'Key Metrics',
  config: {
    metrics: [
      {
        label: 'Revenue',
        metric: 'total_revenue',
        format: { type: 'currency', decimals: 0, currency: 'USD', locale: 'en-US' },
        sparkline: true,
        trend: true,
      },
      {
        label: 'Active Users',
        metric: 'active_users',
        format: { type: 'compact', decimals: 1, currency: null, locale: null },
        sparkline: true,
        trend: true,
      },
      {
        label: 'Conversion Rate',
        metric: 'conversion_rate',
        format: { type: 'percentage', decimals: 1, currency: null, locale: null },
        sparkline: false,
        trend: true,
      },
      {
        label: 'Churn Rate',
        metric: 'churn_rate',
        format: { type: 'percentage', decimals: 2, currency: null, locale: null },
        sparkline: false,
        trend: true,
      },
    ],
    columns: 4,
  } satisfies MetricGridConfig,
  order: 1,
  dataSource: {
    type: 'metric',
    source: 'venture_kpis',
    config: {
      metricId: 'venture_kpis',
      period: 'month',
      aggregation: 'last',
      filters: [{ field: 'venture_id', operator: 'eq', value: '{{venture}}' }],
    },
  },
});

// Add revenue trend chart
await builder.addSection(report.id, {
  type: 'chart_line',
  title: 'Revenue Trend',
  config: {
    chartType: 'line',
    xAxis: 'date',
    yAxis: ['revenue', 'target'],
    groupBy: null,
    width: 800,
    height: 400,
    showLegend: true,
    showLabels: false,
    colors: ['#0f3460', '#e94560'],
    xAxisLabel: 'Date',
    yAxisLabel: 'Revenue ($)',
    stacked: false,
  } satisfies ChartConfig,
  order: 2,
  dataSource: {
    type: 'query',
    source: 'revenue_by_day',
    config: {
      query: `
        SELECT date, revenue, target
        FROM daily_revenue
        WHERE venture_id = $1
          AND date BETWEEN $2 AND $3
        ORDER BY date
      `,
      parameterMapping: {
        '$1': 'venture',
        '$2': 'date_range.start',
        '$3': 'date_range.end',
      },
      connectionId: null,
      timeoutSeconds: 30,
      maxRows: 366,
    },
  },
});

// Add a data table section
await builder.addSection(report.id, {
  type: 'table',
  title: 'Top Products by Revenue',
  config: {
    columns: [
      { field: 'product_name', header: 'Product', width: '40%', format: null, align: 'left', conditionalFormat: null },
      { field: 'units_sold', header: 'Units', width: '15%', format: { type: 'number', decimals: 0, currency: null, locale: null }, align: 'right', conditionalFormat: null },
      {
        field: 'revenue',
        header: 'Revenue',
        width: '20%',
        format: { type: 'currency', decimals: 2, currency: 'USD', locale: 'en-US' },
        align: 'right',
        conditionalFormat: [
          { condition: 'gte', value: 100000, style: { color: '#16a34a', backgroundColor: null, fontWeight: 'bold' } },
        ],
      },
      {
        field: 'growth',
        header: 'MoM Growth',
        width: '15%',
        format: { type: 'percentage', decimals: 1, currency: null, locale: null },
        align: 'right',
        conditionalFormat: [
          { condition: 'lt', value: 0, style: { color: '#dc2626', backgroundColor: null, fontWeight: null } },
          { condition: 'gte', value: 0, style: { color: '#16a34a', backgroundColor: null, fontWeight: null } },
        ],
      },
    ],
    rowLimit: 20,
    sortable: true,
    defaultSort: { column: 'revenue', direction: 'desc' },
    striped: true,
    showRowNumbers: true,
    summaryRow: {
      label: 'Total',
      aggregations: { units_sold: 'sum', revenue: 'sum' },
    },
  } satisfies TableConfig,
  order: 3,
  pageBreakBefore: true,
});

// Reorder sections
await builder.reorderSections(report.id, [
  { sectionId: 'section_header', order: 0 },
  { sectionId: 'section_kpis', order: 1 },
  { sectionId: 'section_chart', order: 2 },
  { sectionId: 'section_table', order: 3 },
]);
```

### 3. Scheduling Automated Report Generation

```typescript
import { ReportSchedulerService } from '@mcv/analytics/reports';

const scheduler = new ReportSchedulerService(db);

// Schedule weekly ops report every Monday at 8 AM EST
const schedule = await scheduler.createSchedule({
  reportId: report.id,
  frequency: 'weekly',
  cronExpression: null, // Auto-generated from frequency
  timezone: 'America/New_York',
  parameters: {
    date_range: {
      // Dynamic: always use "last 7 days" relative to run time
      start: '{{relative:-7d}}',
      end: '{{relative:now}}',
    },
  },
  format: 'pdf',
  distributions: [
    {
      id: 'dist_email',
      channel: 'email',
      config: {
        recipients: ['team-leads@venture.com', 'ops@venture.com'],
        cc: ['ceo@venture.com'],
        bcc: [],
        subject: 'Weekly Ops Report — {{date_range.start}} to {{date_range.end}}',
        body: 'Hi team,\n\nPlease find attached the weekly operations report.\n\nBest,\nReporting System',
        attachReport: true,
        includePreview: true,
        replyTo: 'reports@venture.com',
      },
      enabled: true,
    },
    {
      id: 'dist_slack',
      channel: 'slack',
      config: {
        workspaceId: 'T0123456789',
        channelId: 'C9876543210',
        message: ':chart_with_upwards_trend: Weekly Ops Report is ready! Key highlights inside.',
        uploadFile: true,
        includeSnippet: true,
        threadTs: null,
      },
      enabled: true,
    },
  ],
  maxRetries: 3,
});

console.log(`Schedule created. Next run: ${schedule.nextRunAt}`);
```

### 4. Generating and Exporting a Report

```typescript
import { ReportService } from '@mcv/analytics/reports';

// Generate a PDF report with custom parameters
const exportResult = await reportService.generateReport({
  reportId: 'rpt_abc123',
  ventureId: 'venture_abc123',
  format: 'pdf',
  parameters: {
    date_range: {
      start: '2026-01-01',
      end: '2026-01-31',
    },
    department: 'engineering',
  },
  distribute: false,
  userId: 'user_xyz789',
});

console.log(`Export ${exportResult.id}: ${exportResult.status}`);
console.log(`File: ${exportResult.fileUrl}`);
console.log(`Size: ${exportResult.fileSizeBytes} bytes`);
console.log(`Pages: ${exportResult.pageCount}`);
console.log(`Duration: ${exportResult.durationMs}ms`);

// Generate same report in Excel format
const excelExport = await reportService.generateReport({
  reportId: 'rpt_abc123',
  ventureId: 'venture_abc123',
  format: 'excel',
  parameters: {
    date_range: { start: '2026-01-01', end: '2026-01-31' },
  },
  distribute: false,
  userId: 'user_xyz789',
});
```

### 5. PDF Generation with Puppeteer

```typescript
import puppeteer from 'puppeteer';
import { applyBranding } from '@mcv/analytics/reports';

/**
 * Generate a PDF from rendered HTML using Puppeteer.
 * Applies branding (headers, footers, page numbers) during rendering.
 */
export async function buildReportPdf(input: {
  html: string;
  branding: ReportBranding | null;
  reportName: string;
}): Promise<{ buffer: Buffer; pageCount: number }> {
  const { html, branding, reportName } = input;

  // Apply branding to HTML
  const brandedHtml = branding ? applyBranding(html, branding) : html;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();

    // Set content and wait for all resources to load
    await page.setContent(brandedHtml, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30_000,
    });

    // Wait for any chart rendering (e.g., Chart.js, D3)
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        if (document.querySelector('[data-chart-loading]')) {
          const observer = new MutationObserver(() => {
            if (!document.querySelector('[data-chart-loading]')) {
              observer.disconnect();
              resolve();
            }
          });
          observer.observe(document.body, { subtree: true, attributes: true });
        } else {
          resolve();
        }
      });
    });

    // Build header/footer templates
    const headerTemplate = branding?.headerHtml ?? buildDefaultHeader(branding);
    const footerTemplate = branding?.footerHtml ?? buildDefaultFooter(branding);

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: {
        top: branding?.headerHtml ? '80px' : '60px',
        bottom: branding?.footerHtml ? '80px' : '60px',
        left: '40px',
        right: '40px',
      },
      preferCSSPageSize: false,
      timeout: 60_000,
    });

    // Get page count by re-reading the PDF
    const pageCount = await getPageCount(pdfBuffer);

    return {
      buffer: Buffer.from(pdfBuffer),
      pageCount,
    };
  } finally {
    await browser.close();
  }
}

function buildDefaultHeader(branding: ReportBranding | null): string {
  if (!branding) return '<div></div>';

  const logo = branding.logoUrl && ['header', 'both'].includes(branding.logoPlacement)
    ? `<img src="${branding.logoUrl}" style="height: ${branding.logoHeight}px; width: auto;" />`
    : '';

  return `
    <div style="width: 100%; padding: 10px 40px; font-size: 10px;
                font-family: ${branding.bodyFont}, sans-serif;
                color: ${branding.textColor}; border-bottom: 1px solid #e5e7eb;
                display: flex; justify-content: space-between; align-items: center;">
      <div>${logo}</div>
      <div style="opacity: 0.6;"><span class="date"></span></div>
    </div>
  `;
}

function buildDefaultFooter(branding: ReportBranding | null): string {
  const text = branding?.footerText ?? '';
  const pageNumbers = branding?.showPageNumbers !== false;
  const format = branding?.pageNumberFormat ?? 'of_total';

  const pageDisplay = pageNumbers
    ? format === 'of_total'
      ? '<span class="pageNumber"></span> of <span class="totalPages"></span>'
      : '<span class="pageNumber"></span>'
    : '';

  return `
    <div style="width: 100%; padding: 10px 40px; font-size: 9px;
                font-family: ${branding?.bodyFont ?? 'Inter'}, sans-serif;
                color: ${branding?.textColor ?? '#666'}; border-top: 1px solid #e5e7eb;
                display: flex; justify-content: space-between; align-items: center;">
      <div style="opacity: 0.6;">${text}</div>
      <div>${pageDisplay}</div>
    </div>
  `;
}

async function getPageCount(pdfBuffer: Uint8Array): Promise<number> {
  // Simple regex-based page count from PDF structure
  const text = Buffer.from(pdfBuffer).toString('latin1');
  const matches = text.match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 1;
}
```

### 6. Distribution Service — Multi-Channel Delivery

```typescript
import { Resend } from 'resend';

/**
 * ReportDistributionService — Handles delivering generated reports
 * across email, Slack, Teams, webhooks, and shared links.
 */
export class ReportDistributionService {
  private readonly email: Resend;

  constructor(
    private readonly db: SupabaseClient,
    private readonly storage: StorageService,
  ) {
    this.email = new Resend(process.env.RESEND_API_KEY);
  }

  /**
   * Distribute a generated report export to all configured channels.
   */
  async distribute(input: {
    reportId: string;
    exportId: string;
    fileUrl: string;
    format: ExportFormat;
    reportName: string;
    distributions: ReportDistribution[];
    branding: ReportBranding | null;
  }): Promise<DistributionResult[]> {
    const results: DistributionResult[] = [];

    for (const dist of input.distributions) {
      if (!dist.enabled) {
        results.push({
          distributionId: dist.id,
          channel: dist.channel,
          status: 'skipped',
          error: 'Distribution disabled',
          deliveredAt: null,
          metadata: {},
        });
        continue;
      }

      try {
        const result = await this.deliverToChannel(dist, input);
        results.push(result);
      } catch (error) {
        results.push({
          distributionId: dist.id,
          channel: dist.channel,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          deliveredAt: null,
          metadata: {},
        });
      }
    }

    return results;
  }

  private async deliverToChannel(
    dist: ReportDistribution,
    input: { fileUrl: string; format: ExportFormat; reportName: string; branding: ReportBranding | null },
  ): Promise<DistributionResult> {
    switch (dist.channel) {
      case 'email':
        return this.deliverEmail(dist, input);
      case 'slack':
        return this.deliverSlack(dist, input);
      case 'teams':
        return this.deliverTeams(dist, input);
      case 'webhook':
        return this.deliverWebhook(dist, input);
      case 'shared_link':
        return this.createSharedLink(dist, input);
      default:
        throw new Error(`Unsupported distribution channel: ${dist.channel}`);
    }
  }

  private async deliverEmail(
    dist: ReportDistribution,
    input: { fileUrl: string; format: ExportFormat; reportName: string },
  ): Promise<DistributionResult> {
    const config = dist.config as EmailDistributionConfig;

    // Download the file for attachment
    const fileBuffer = await this.storage.download(input.fileUrl);
    const mimeTypes: Record<ExportFormat, string> = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      html: 'text/html',
    };

    const extensions: Record<ExportFormat, string> = {
      pdf: 'pdf',
      excel: 'xlsx',
      csv: 'csv',
      pptx: 'pptx',
      html: 'html',
    };

    const attachments = config.attachReport
      ? [{
          filename: `${input.reportName}.${extensions[input.format]}`,
          content: fileBuffer,
          contentType: mimeTypes[input.format],
        }]
      : [];

    const { data, error } = await this.email.emails.send({
      from: process.env.REPORT_EMAIL_FROM ?? 'reports@mcv.app',
      to: config.recipients,
      cc: config.cc.length > 0 ? config.cc : undefined,
      bcc: config.bcc.length > 0 ? config.bcc : undefined,
      replyTo: config.replyTo ?? undefined,
      subject: config.subject,
      html: config.body.replace(/\n/g, '<br>'),
      attachments,
    });

    if (error) throw new Error(error.message);

    return {
      distributionId: dist.id,
      channel: 'email',
      status: 'delivered',
      error: null,
      deliveredAt: new Date().toISOString(),
      metadata: { emailId: data?.id, recipients: config.recipients },
    };
  }

  private async deliverSlack(
    dist: ReportDistribution,
    input: { fileUrl: string; format: ExportFormat; reportName: string },
  ): Promise<DistributionResult> {
    const config = dist.config as SlackDistributionConfig;

    // Post message to Slack channel
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: config.channelId,
        text: config.message,
        thread_ts: config.threadTs ?? undefined,
      }),
    });

    const result = await response.json() as { ok: boolean; ts?: string; error?: string };
    if (!result.ok) throw new Error(`Slack API error: ${result.error}`);

    // Upload file if configured
    if (config.uploadFile) {
      const fileBuffer = await this.storage.download(input.fileUrl);
      const formData = new FormData();
      formData.append('channels', config.channelId);
      formData.append('thread_ts', config.threadTs ?? result.ts ?? '');
      formData.append('title', input.reportName);
      formData.append('file', new Blob([fileBuffer]), `${input.reportName}.pdf`);

      await fetch('https://slack.com/api/files.upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}` },
        body: formData,
      });
    }

    return {
      distributionId: dist.id,
      channel: 'slack',
      status: 'delivered',
      error: null,
      deliveredAt: new Date().toISOString(),
      metadata: { messageTs: result.ts, channelId: config.channelId },
    };
  }

  private async deliverTeams(
    dist: ReportDistribution,
    input: { fileUrl: string; reportName: string },
  ): Promise<DistributionResult> {
    const config = dist.config as TeamsDistributionConfig;

    const card = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      summary: config.title,
      themeColor: '0f3460',
      title: config.title,
      sections: [{
        text: config.body,
        ...(config.includeDownloadLink && {
          potentialAction: [{
            '@type': 'OpenUri',
            name: 'Download Report',
            targets: [{ os: 'default', uri: input.fileUrl }],
          }],
        }),
      }],
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      throw new Error(`Teams webhook failed: ${response.status} ${response.statusText}`);
    }

    return {
      distributionId: dist.id,
      channel: 'teams',
      status: 'delivered',
      error: null,
      deliveredAt: new Date().toISOString(),
      metadata: { webhookStatus: response.status },
    };
  }

  private async deliverWebhook(
    dist: ReportDistribution,
    input: { fileUrl: string; format: ExportFormat; reportName: string },
  ): Promise<DistributionResult> {
    const config = dist.config as WebhookDistributionConfig;

    const payload: Record<string, unknown> = {
      reportName: input.reportName,
      format: input.format,
      fileUrl: input.fileUrl,
      generatedAt: new Date().toISOString(),
    };

    if (config.includeFile) {
      const fileBuffer = await this.storage.download(input.fileUrl);
      payload.fileBase64 = fileBuffer.toString('base64');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (config.auth) {
      switch (config.auth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${config.auth.token}`;
          break;
        case 'basic':
          headers['Authorization'] = `Basic ${Buffer.from(`${config.auth.username}:${config.auth.password}`).toString('base64')}`;
          break;
        case 'api_key':
          headers[config.auth.headerName ?? 'X-API-Key'] = config.auth.token ?? '';
          break;
      }
    }

    const response = await fetch(config.url, {
      method: config.method,
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    return {
      distributionId: dist.id,
      channel: 'webhook',
      status: 'delivered',
      error: null,
      deliveredAt: new Date().toISOString(),
      metadata: { statusCode: response.status },
    };
  }

  private async createSharedLink(
    dist: ReportDistribution,
    input: { fileUrl: string },
  ): Promise<DistributionResult> {
    const config = dist.config as SharedLinkConfig;
    const token = crypto.randomUUID().replace(/-/g, '');

    const { data, error } = await this.db
      .from('report_shared_links')
      .insert({
        export_id: input.fileUrl, // Will be resolved to export ID
        token,
        password: config.password ? await hashPassword(config.password) : null,
        allow_download: config.allowDownload,
        require_auth: config.requireAuth,
        expires_at: config.expiresIn ? calculateExpiry(config.expiresIn) : null,
        created_by: 'system',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create shared link: ${error.message}`);

    const shareUrl = `${process.env.APP_URL}/reports/shared/${token}`;

    return {
      distributionId: dist.id,
      channel: 'shared_link',
      status: 'delivered',
      error: null,
      deliveredAt: new Date().toISOString(),
      metadata: { shareUrl, token, expiresAt: data.expires_at },
    };
  }
}
```

### 7. Parameterized Report Resolution

```typescript
/**
 * Resolve report parameters — merges template defaults with
 * user-provided overrides and evaluates dynamic expressions.
 */
export function resolveParameters(
  definitions: Record<string, ReportParameter>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, param] of Object.entries(definitions)) {
    const value = overrides[key] ?? param.defaultValue;

    // Validate required parameters
    if (param.required && (value === null || value === undefined)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Required parameter '${key}' is missing`,
      });
    }

    // Resolve dynamic expressions
    resolved[key] = resolveDynamicValue(value, param.type);
  }

  // Include any extra overrides not in definitions (passthrough)
  for (const [key, value] of Object.entries(overrides)) {
    if (!(key in resolved)) {
      resolved[key] = value;
    }
  }

  return resolved;
}

/**
 * Resolve dynamic value expressions like {{relative:-7d}}, {{relative:now}},
 * {{today}}, {{start_of_month}}, etc.
 */
function resolveDynamicValue(value: unknown, type: ParameterType): unknown {
  if (typeof value !== 'string') {
    // Recurse into objects (e.g., date_range = { start, end })
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      const resolved: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        resolved[k] = resolveDynamicValue(v, type);
      }
      return resolved;
    }
    return value;
  }

  const now = new Date();

  // {{relative:<offset>}} — e.g., {{relative:-7d}}, {{relative:-1m}}, {{relative:now}}
  const relativeMatch = value.match(/^\{\{relative:(.*)\}\}$/);
  if (relativeMatch) {
    const expr = relativeMatch[1];
    if (expr === 'now') return now.toISOString().split('T')[0];
    return applyRelativeOffset(now, expr);
  }

  // {{today}}, {{yesterday}}, {{start_of_month}}, etc.
  const tokens: Record<string, () => string> = {
    '{{today}}': () => now.toISOString().split('T')[0],
    '{{yesterday}}': () => {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    },
    '{{start_of_month}}': () => {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return d.toISOString().split('T')[0];
    },
    '{{end_of_month}}': () => {
      const d = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return d.toISOString().split('T')[0];
    },
    '{{start_of_quarter}}': () => {
      const quarter = Math.floor(now.getMonth() / 3);
      const d = new Date(now.getFullYear(), quarter * 3, 1);
      return d.toISOString().split('T')[0];
    },
    '{{start_of_year}}': () => `${now.getFullYear()}-01-01`,
  };

  const tokenFn = tokens[value];
  if (tokenFn) return tokenFn();

  return value;
}

function applyRelativeOffset(base: Date, expr: string): string {
  const match = expr.match(/^([+-]?\d+)([dmwyq])$/);
  if (!match) return base.toISOString().split('T')[0];

  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const result = new Date(base);

  switch (unit) {
    case 'd': result.setDate(result.getDate() + amount); break;
    case 'w': result.setDate(result.getDate() + amount * 7); break;
    case 'm': result.setMonth(result.getMonth() + amount); break;
    case 'q': result.setMonth(result.getMonth() + amount * 3); break;
    case 'y': result.setFullYear(result.getFullYear() + amount); break;
  }

  return result.toISOString().split('T')[0];
}
```

### 8. Report Template Service

```typescript
/**
 * ReportTemplateService — Manages report templates including
 * system-provided and venture-specific templates.
 */
export class ReportTemplateService {
  constructor(private readonly db: SupabaseClient) {}

  /**
   * List available templates for a venture.
   * Returns system templates + venture-specific templates.
   */
  async listTemplates(input: {
    ventureId: string;
    category?: TemplateCategory;
    search?: string;
  }): Promise<ReportTemplate[]> {
    let query = this.db
      .from('report_templates')
      .select('*')
      .or(`venture_id.eq.${input.ventureId},is_system.eq.true`);

    if (input.category) query = query.eq('category', input.category);
    if (input.search) query = query.ilike('name', `%${input.search}%`);

    query = query.order('is_system', { ascending: false })
                 .order('usage_count', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: REPORT_ERRORS.TEMPLATE_LIST_FAILED,
        cause: error,
      });
    }

    return (data ?? []).map(this.mapTemplate);
  }

  /**
   * Get a single template by ID.
   */
  async getTemplate(templateId: string): Promise<ReportTemplate | null> {
    const { data, error } = await this.db
      .from('report_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error || !data) return null;
    return this.mapTemplate(data);
  }

  /**
   * Create a custom template from an existing report.
   */
  async createFromReport(input: {
    reportId: string;
    ventureId: string;
    name: string;
    description: string;
    category: TemplateCategory;
  }): Promise<ReportTemplate> {
    // Fetch the report with its sections
    const { data: report } = await this.db
      .from('reports')
      .select('*, sections:report_sections(*, data_source:report_data_sources(*))')
      .eq('id', input.reportId)
      .single();

    if (!report) {
      throw new TRPCError({ code: 'NOT_FOUND', message: REPORT_ERRORS.REPORT_NOT_FOUND });
    }

    const sections = (report.sections ?? []).map((s: Record<string, unknown>) => ({
      type: s.type,
      title: s.title,
      config: s.config,
      order: s.order,
      dataSource: s.data_source ? {
        type: (s.data_source as Record<string, unknown>).type,
        source: (s.data_source as Record<string, unknown>).source,
        config: (s.data_source as Record<string, unknown>).config,
      } : null,
    }));

    const { data, error } = await this.db
      .from('report_templates')
      .insert({
        venture_id: input.ventureId,
        name: input.name,
        description: input.description,
        category: input.category,
        sections,
        parameters: report.parameters,
        branding: report.branding,
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: REPORT_ERRORS.TEMPLATE_CREATE_FAILED,
        cause: error,
      });
    }

    return this.mapTemplate(data);
  }

  /**
   * Increment usage count when a report is created from this template.
   */
  async incrementUsage(templateId: string): Promise<void> {
    await this.db.rpc('increment_template_usage', { template_id: templateId });
  }

  /**
   * Seed system templates (run during migration).
   */
  async seedSystemTemplates(): Promise<void> {
    const systemTemplates = [
      {
        name: 'Monthly Business Review',
        description: 'Comprehensive monthly overview of key business metrics, revenue, growth, and operational highlights.',
        category: 'monthly_review',
        sections: [
          { type: 'header', title: null, config: { level: 1, text: 'Monthly Business Review', subtitle: '{{date_range.start}} — {{date_range.end}}' }, order: 0, dataSource: null },
          { type: 'metric_grid', title: 'Key Performance Indicators', config: { columns: 4, metrics: [] }, order: 1, dataSource: null },
          { type: 'chart_line', title: 'Revenue Trend', config: { chartType: 'line', xAxis: 'date', yAxis: ['revenue'], groupBy: null, width: 800, height: 350, showLegend: true, showLabels: false, colors: null, xAxisLabel: null, yAxisLabel: 'Revenue', stacked: false }, order: 2, dataSource: null },
          { type: 'chart_bar', title: 'Revenue by Product', config: { chartType: 'bar', xAxis: 'product', yAxis: ['revenue'], groupBy: null, width: 800, height: 350, showLegend: false, showLabels: true, colors: null, xAxisLabel: null, yAxisLabel: 'Revenue', stacked: false }, order: 3, dataSource: null },
          { type: 'table', title: 'Top Customers', config: { columns: [], rowLimit: 10, sortable: true, defaultSort: null, striped: true, showRowNumbers: true, summaryRow: null }, order: 4, dataSource: null },
          { type: 'text', title: 'Notes & Commentary', config: { content: '*Add your commentary here...*', contentType: 'markdown', resolveParameters: false }, order: 5, dataSource: null },
        ],
        parameters: {
          date_range: { key: 'date_range', label: 'Report Period', type: 'date_range', defaultValue: { start: '{{start_of_month}}', end: '{{today}}' }, required: true, description: 'The month to report on', validation: null, options: null, optionsSource: null },
          venture: { key: 'venture', label: 'Venture', type: 'venture', defaultValue: null, required: true, description: 'Target venture', validation: null, options: null, optionsSource: null },
        },
      },
      {
        name: 'Weekly Operations Report',
        description: 'Weekly overview of operational metrics, incidents, deployment activity, and team performance.',
        category: 'weekly_ops',
        sections: [
          { type: 'header', title: null, config: { level: 1, text: 'Weekly Ops Report', subtitle: 'Week of {{date_range.start}}' }, order: 0, dataSource: null },
          { type: 'summary', title: 'Week at a Glance', config: { metrics: [], layout: 'grid', columns: 3 }, order: 1, dataSource: null },
          { type: 'chart_area', title: 'Request Volume', config: { chartType: 'area', xAxis: 'hour', yAxis: ['requests'], groupBy: 'day', width: 800, height: 300, showLegend: true, showLabels: false, colors: null, xAxisLabel: null, yAxisLabel: 'Requests', stacked: true }, order: 2, dataSource: null },
          { type: 'table', title: 'Incidents', config: { columns: [], rowLimit: null, sortable: true, defaultSort: null, striped: true, showRowNumbers: false, summaryRow: null }, order: 3, dataSource: null },
          { type: 'table', title: 'Deployments', config: { columns: [], rowLimit: null, sortable: true, defaultSort: null, striped: true, showRowNumbers: false, summaryRow: null }, order: 4, dataSource: null },
        ],
        parameters: {
          date_range: { key: 'date_range', label: 'Week', type: 'date_range', defaultValue: { start: '{{relative:-7d}}', end: '{{today}}' }, required: true, description: 'The week to report on', validation: null, options: null, optionsSource: null },
        },
      },
      {
        name: 'Quarterly Board Report',
        description: 'Executive-level quarterly report for board members covering financials, growth, product, and strategy.',
        category: 'quarterly_board',
        sections: [
          { type: 'header', title: null, config: { level: 1, text: 'Board Report — Q{{quarter}} {{year}}', subtitle: null }, order: 0, dataSource: null },
          { type: 'text', title: 'Executive Summary', config: { content: '', contentType: 'markdown', resolveParameters: false }, order: 1, dataSource: null },
          { type: 'metric_grid', title: 'Financial Highlights', config: { columns: 3, metrics: [] }, order: 2, dataSource: null },
          { type: 'chart_bar', title: 'Revenue by Quarter', config: { chartType: 'bar', xAxis: 'quarter', yAxis: ['revenue', 'target'], groupBy: null, width: 800, height: 350, showLegend: true, showLabels: true, colors: null, xAxisLabel: null, yAxisLabel: 'Revenue', stacked: false }, order: 3, dataSource: null },
          { type: 'comparison', title: 'Quarter-over-Quarter', config: { metrics: [], periods: [], display: 'table' }, order: 4, dataSource: null },
          { type: 'table', title: 'Key Initiatives', config: { columns: [], rowLimit: null, sortable: false, defaultSort: null, striped: false, showRowNumbers: false, summaryRow: null }, order: 5, dataSource: null },
          { type: 'text', title: 'Outlook & Strategy', config: { content: '', contentType: 'markdown', resolveParameters: false }, order: 6, dataSource: null },
        ],
        parameters: {
          quarter: { key: 'quarter', label: 'Quarter', type: 'select', defaultValue: null, required: true, description: 'Fiscal quarter', validation: null, options: [{ value: '1', label: 'Q1' }, { value: '2', label: 'Q2' }, { value: '3', label: 'Q3' }, { value: '4', label: 'Q4' }], optionsSource: null },
          year: { key: 'year', label: 'Year', type: 'number', defaultValue: 2026, required: true, description: 'Fiscal year', validation: { min: 2020, max: 2050, pattern: null, message: null }, options: null, optionsSource: null },
        },
      },
    ];

    for (const template of systemTemplates) {
      await this.db
        .from('report_templates')
        .upsert(
          { ...template, is_system: true, venture_id: null },
          { onConflict: 'name' },
        );
    }
  }

  private mapTemplate(row: Record<string, unknown>): ReportTemplate {
    return {
      id: row.id as string,
      ventureId: row.venture_id as string | null,
      name: row.name as string,
      description: row.description as string,
      category: row.category as TemplateCategory,
      sections: row.sections as TemplateSectionDefinition[],
      parameters: row.parameters as Record<string, ReportParameter>,
      branding: row.branding as ReportBranding | null,
      thumbnailUrl: row.thumbnail_url as string | null,
      isSystem: row.is_system as boolean,
      usageCount: row.usage_count as number,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
```

### 9. Report Versioning Service

```typescript
/**
 * ReportVersioningService — Tracks version history for
 * report templates and generated outputs.
 */
export class ReportVersioningService {
  constructor(private readonly db: SupabaseClient) {}

  /**
   * Create a new version snapshot.
   */
  async createVersion(
    reportId: string,
    input: {
      version: number;
      snapshot: Record<string, unknown>;
      changeDescription?: string;
      createdBy: string;
    },
  ): Promise<ReportVersion> {
    const { data, error } = await this.db
      .from('report_versions')
      .insert({
        report_id: reportId,
        version: input.version,
        snapshot: input.snapshot,
        change_description: input.changeDescription ?? null,
        created_by: input.createdBy,
      })
      .select()
      .single();

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: REPORT_ERRORS.VERSION_CREATE_FAILED,
        cause: error,
      });
    }

    return {
      id: data.id,
      reportId: data.report_id,
      version: data.version,
      snapshot: data.snapshot,
      changeDescription: data.change_description,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }

  /**
   * Get all versions for a report (newest first).
   */
  async listVersions(reportId: string): Promise<ReportVersion[]> {
    const { data, error } = await this.db
      .from('report_versions')
      .select('*')
      .eq('report_id', reportId)
      .order('version', { ascending: false });

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: REPORT_ERRORS.VERSION_LIST_FAILED,
        cause: error,
      });
    }

    return (data ?? []).map(row => ({
      id: row.id,
      reportId: row.report_id,
      version: row.version,
      snapshot: row.snapshot,
      changeDescription: row.change_description,
      createdBy: row.created_by,
      createdAt: row.created_at,
    }));
  }

  /**
   * Restore a report to a specific version.
   */
  async restoreVersion(reportId: string, version: number, userId: string): Promise<void> {
    const targetVersion = await this.getVersion(reportId, version);
    if (!targetVersion) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: REPORT_ERRORS.VERSION_NOT_FOUND,
      });
    }

    // Apply snapshot to current report
    const snapshot = targetVersion.snapshot as {
      sections?: ReportSectionInput[];
      parameters?: Record<string, ReportParameter>;
    };

    if (snapshot.sections) {
      // Delete current sections and recreate from snapshot
      await this.db
        .from('report_sections')
        .delete()
        .eq('report_id', reportId);

      for (const section of snapshot.sections) {
        await this.db
          .from('report_sections')
          .insert({ ...section, report_id: reportId });
      }
    }

    if (snapshot.parameters) {
      await this.db
        .from('reports')
        .update({ parameters: snapshot.parameters })
        .eq('id', reportId);
    }

    // Create a new version recording the restore
    const nextVersion = await this.getNextVersion(reportId);
    await this.createVersion(reportId, {
      version: nextVersion,
      snapshot: targetVersion.snapshot,
      changeDescription: `Restored from version ${version}`,
      createdBy: userId,
    });
  }

  /**
   * Compare two versions and return a diff summary.
   */
  async compareVersions(
    reportId: string,
    versionA: number,
    versionB: number,
  ): Promise<VersionDiff> {
    const [a, b] = await Promise.all([
      this.getVersion(reportId, versionA),
      this.getVersion(reportId, versionB),
    ]);

    if (!a || !b) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: REPORT_ERRORS.VERSION_NOT_FOUND,
      });
    }

    return {
      versionA: a.version,
      versionB: b.version,
      changes: computeJsonDiff(a.snapshot, b.snapshot),
    };
  }

  async getNextVersion(reportId: string): Promise<number> {
    const { data } = await this.db
      .from('report_versions')
      .select('version')
      .eq('report_id', reportId)
      .order('version', { ascending: false })
      .limit(1);

    return (data?.[0]?.version ?? 0) + 1;
  }

  private async getVersion(reportId: string, version: number): Promise<ReportVersion | null> {
    const { data } = await this.db
      .from('report_versions')
      .select('*')
      .eq('report_id', reportId)
      .eq('version', version)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      reportId: data.report_id,
      version: data.version,
      snapshot: data.snapshot,
      changeDescription: data.change_description,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }
}

export interface VersionDiff {
  versionA: number;
  versionB: number;
  changes: DiffEntry[];
}

export interface DiffEntry {
  path: string;
  type: 'added' | 'removed' | 'changed';
  oldValue?: unknown;
  newValue?: unknown;
}
```

### 10. tRPC Router

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '@mcv/trpc';
import { ReportService } from './services/report.service';
import {
  reportSchema,
  reportTemplateSchema,
  reportScheduleSchema,
  reportParameterSchema,
  reportBrandingSchema,
} from './schemas';

export const reportsRouter = router({
  // ── Reports ────────────────────────────────────────────────

  create: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      templateId: z.string().uuid().optional(),
      name: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      parameters: z.record(reportParameterSchema).optional(),
      branding: reportBrandingSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.reportService.createReport({
        ...input,
        userId: ctx.user.id,
      });
    }),

  get: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      ventureId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.reportService.getReport(input.reportId, input.ventureId);
    }),

  list: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      status: z.enum(['draft', 'active', 'archived']).optional(),
      templateId: z.string().uuid().optional(),
      search: z.string().optional(),
      sortBy: z.enum(['name', 'created_at', 'updated_at']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      page: z.number().int().min(1).optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.reportService.listReports({
        ...input,
        createdBy: undefined,
      });
    }),

  update: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      ventureId: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional(),
      parameters: z.record(reportParameterSchema).optional(),
      status: z.enum(['draft', 'active', 'archived']).optional(),
      branding: reportBrandingSchema.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.reportService.updateReport(input.reportId, input);
    }),

  delete: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      ventureId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.reportService.deleteReport(input.reportId, input.ventureId);
    }),

  duplicate: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      ventureId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.reportService.duplicateReport(
        input.reportId,
        input.ventureId,
        ctx.user.id,
      );
    }),

  // ── Generation ─────────────────────────────────────────────

  generate: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      ventureId: z.string().uuid(),
      format: z.enum(['pdf', 'excel', 'csv', 'pptx', 'html']).optional(),
      parameters: z.record(z.unknown()).optional(),
      distribute: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.reportService.generateReport({
        ...input,
        userId: ctx.user.id,
      });
    }),

  // ── Sections ───────────────────────────────────────────────

  addSection: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      type: z.enum([
        'kpi_card', 'chart_bar', 'chart_line', 'chart_pie', 'chart_area',
        'chart_scatter', 'chart_funnel', 'table', 'text', 'image',
        'divider', 'spacer', 'header', 'summary', 'metric_grid',
        'comparison', 'heatmap',
      ]),
      title: z.string().optional(),
      config: z.record(z.unknown()),
      order: z.number().int().min(0),
      dataSource: z.object({
        type: z.enum(['metric', 'query', 'api', 'spreadsheet', 'static']),
        source: z.string(),
        config: z.record(z.unknown()),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.builderService.addSection(input.reportId, input);
    }),

  updateSection: protectedProcedure
    .input(z.object({
      sectionId: z.string().uuid(),
      title: z.string().optional(),
      config: z.record(z.unknown()).optional(),
      order: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.builderService.updateSection(input.sectionId, input);
    }),

  deleteSection: protectedProcedure
    .input(z.object({ sectionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.builderService.deleteSection(input.sectionId);
    }),

  reorderSections: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      sections: z.array(z.object({
        sectionId: z.string().uuid(),
        order: z.number().int().min(0),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.builderService.reorderSections(input.reportId, input.sections);
    }),

  // ── Templates ──────────────────────────────────────────────

  listTemplates: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      category: z.enum([
        'monthly_review', 'weekly_ops', 'quarterly_board',
        'financial', 'marketing', 'engineering', 'custom',
      ]).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.templateService.listTemplates(input);
    }),

  getTemplate: protectedProcedure
    .input(z.object({ templateId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.templateService.getTemplate(input.templateId);
    }),

  createTemplateFromReport: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      ventureId: z.string().uuid(),
      name: z.string().min(1).max(200),
      description: z.string().max(2000),
      category: z.enum([
        'monthly_review', 'weekly_ops', 'quarterly_board',
        'financial', 'marketing', 'engineering', 'custom',
      ]),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.templateService.createFromReport(input);
    }),

  // ── Scheduling ─────────────────────────────────────────────

  createSchedule: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually', 'custom']),
      cronExpression: z.string().optional(),
      timezone: z.string().default('UTC'),
      parameters: z.record(z.unknown()).optional(),
      format: z.enum(['pdf', 'excel', 'csv', 'pptx', 'html']).default('pdf'),
      distributions: z.array(z.object({
        channel: z.enum(['email', 'slack', 'teams', 'webhook', 'shared_link', 'dashboard_embed']),
        config: z.record(z.unknown()),
        enabled: z.boolean().default(true),
      })),
      maxRetries: z.number().int().min(0).max(10).default(3),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.schedulerService.createSchedule(input);
    }),

  updateSchedule: protectedProcedure
    .input(z.object({
      scheduleId: z.string().uuid(),
      enabled: z.boolean().optional(),
      frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually', 'custom']).optional(),
      cronExpression: z.string().optional(),
      timezone: z.string().optional(),
      parameters: z.record(z.unknown()).optional(),
      format: z.enum(['pdf', 'excel', 'csv', 'pptx', 'html']).optional(),
      distributions: z.array(z.object({
        channel: z.enum(['email', 'slack', 'teams', 'webhook', 'shared_link', 'dashboard_embed']),
        config: z.record(z.unknown()),
        enabled: z.boolean().default(true),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.schedulerService.updateSchedule(input.scheduleId, input);
    }),

  deleteSchedule: protectedProcedure
    .input(z.object({ scheduleId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.schedulerService.deleteSchedule(input.scheduleId);
    }),

  // ── Versions ───────────────────────────────────────────────

  listVersions: protectedProcedure
    .input(z.object({ reportId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.versioningService.listVersions(input.reportId);
    }),

  restoreVersion: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      version: z.number().int().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.versioningService.restoreVersion(
        input.reportId,
        input.version,
        ctx.user.id,
      );
    }),

  compareVersions: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      versionA: z.number().int().min(1),
      versionB: z.number().int().min(1),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.versioningService.compareVersions(
        input.reportId,
        input.versionA,
        input.versionB,
      );
    }),

  // ── Comments ───────────────────────────────────────────────

  addComment: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      sectionId: z.string().uuid().optional(),
      parentId: z.string().uuid().optional(),
      content: z.string().min(1).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.db
        .from('report_comments')
        .insert({
          report_id: input.reportId,
          section_id: input.sectionId ?? null,
          parent_id: input.parentId ?? null,
          author_id: ctx.user.id,
          content: input.content,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  listComments: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      sectionId: z.string().uuid().optional(),
      resolved: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      let query = ctx.db
        .from('report_comments')
        .select('*')
        .eq('report_id', input.reportId)
        .order('created_at', { ascending: true });

      if (input.sectionId) query = query.eq('section_id', input.sectionId);
      if (input.resolved !== undefined) query = query.eq('resolved', input.resolved);

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),

  resolveComment: protectedProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.db
        .from('report_comments')
        .update({ resolved: true, resolved_by: ctx.user.id })
        .eq('id', input.commentId);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }),

  // ── Exports ────────────────────────────────────────────────

  listExports: protectedProcedure
    .input(z.object({
      reportId: z.string().uuid(),
      ventureId: z.string().uuid(),
      status: z.enum(['pending', 'generating', 'completed', 'failed', 'expired']).optional(),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      let query = ctx.db
        .from('report_exports')
        .select('*')
        .eq('report_id', input.reportId)
        .eq('venture_id', input.ventureId)
        .order('created_at', { ascending: false })
        .limit(input.limit);

      if (input.status) query = query.eq('status', input.status);

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),

  // ── Shared Links ───────────────────────────────────────────

  createSharedLink: protectedProcedure
    .input(z.object({
      exportId: z.string().uuid(),
      expiresIn: z.string().optional(),
      password: z.string().optional(),
      allowDownload: z.boolean().default(true),
      requireAuth: z.boolean().default(false),
      maxViews: z.number().int().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const token = crypto.randomUUID().replace(/-/g, '');
      const { data, error } = await ctx.db
        .from('report_shared_links')
        .insert({
          export_id: input.exportId,
          token,
          password: input.password ? await hashPassword(input.password) : null,
          allow_download: input.allowDownload,
          require_auth: input.requireAuth,
          expires_at: input.expiresIn ? calculateExpiry(input.expiresIn) : null,
          max_views: input.maxViews ?? null,
          created_by: ctx.user.id,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return {
        ...data,
        shareUrl: `${process.env.APP_URL}/reports/shared/${token}`,
      };
    }),

  // ── Branding ───────────────────────────────────────────────

  listBrandings: protectedProcedure
    .input(z.object({ ventureId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.db
        .from('report_brandings')
        .select('*')
        .eq('venture_id', input.ventureId)
        .order('is_default', { ascending: false });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),

  upsertBranding: protectedProcedure
    .input(z.object({
      ventureId: z.string().uuid(),
      name: z.string().min(1).max(100),
      isDefault: z.boolean().default(false),
      branding: reportBrandingSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      // If setting as default, unset existing default
      if (input.isDefault) {
        await ctx.db
          .from('report_brandings')
          .update({ is_default: false })
          .eq('venture_id', input.ventureId)
          .eq('is_default', true);
      }

      const { data, error } = await ctx.db
        .from('report_brandings')
        .upsert({
          venture_id: input.ventureId,
          name: input.name,
          is_default: input.isDefault,
          ...input.branding,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),
});
```

---

## Error Codes

| Code | Constant | Message | HTTP |
|------|----------|---------|------|
| `RPT_001` | `REPORT_NOT_FOUND` | Report not found or access denied | 404 |
| `RPT_002` | `REPORT_ARCHIVED` | Cannot modify or generate an archived report | 400 |
| `RPT_003` | `CREATE_FAILED` | Failed to create report | 500 |
| `RPT_004` | `UPDATE_FAILED` | Failed to update report | 500 |
| `RPT_005` | `DELETE_FAILED` | Failed to delete report | 500 |
| `RPT_006` | `LIST_FAILED` | Failed to list reports | 500 |
| `RPT_007` | `INVALID_STATUS_TRANSITION` | Invalid report status transition | 400 |
| `RPT_008` | `TEMPLATE_NOT_FOUND` | Report template not found | 404 |
| `RPT_009` | `TEMPLATE_LIST_FAILED` | Failed to list report templates | 500 |
| `RPT_010` | `TEMPLATE_CREATE_FAILED` | Failed to create report template | 500 |
| `RPT_011` | `SECTION_NOT_FOUND` | Report section not found | 404 |
| `RPT_012` | `SECTION_LIMIT_EXCEEDED` | Maximum sections per report exceeded (limit: 50) | 400 |
| `RPT_013` | `SECTION_ORDER_CONFLICT` | Section order conflict — duplicate order values | 400 |
| `RPT_014` | `SCHEDULE_NOT_FOUND` | Report schedule not found | 404 |
| `RPT_015` | `SCHEDULE_EXISTS` | A schedule already exists for this report | 409 |
| `RPT_016` | `SCHEDULE_CRON_INVALID` | Invalid cron expression | 400 |
| `RPT_017` | `EXPORT_FAILED` | Report generation/export failed | 500 |
| `RPT_018` | `EXPORT_TIMEOUT` | Report generation timed out (>60s) | 408 |
| `RPT_019` | `EXPORT_NOT_FOUND` | Export record not found | 404 |
| `RPT_020` | `EXPORT_EXPIRED` | Export file has expired and been cleaned up | 410 |
| `RPT_021` | `DATASOURCE_FETCH_FAILED` | Failed to fetch data from data source | 500 |
| `RPT_022` | `DATASOURCE_TIMEOUT` | Data source query timed out | 408 |
| `RPT_023` | `DATASOURCE_INVALID_QUERY` | Invalid or disallowed SQL query | 400 |
| `RPT_024` | `PARAMETER_MISSING` | Required report parameter is missing | 400 |
| `RPT_025` | `PARAMETER_INVALID` | Report parameter failed validation | 400 |
| `RPT_026` | `DISTRIBUTION_FAILED` | Failed to distribute report to one or more channels | 500 |
| `RPT_027` | `DISTRIBUTION_CHANNEL_UNSUPPORTED` | Unsupported distribution channel | 400 |
| `RPT_028` | `SHARED_LINK_EXPIRED` | Shared link has expired | 410 |
| `RPT_029` | `SHARED_LINK_MAX_VIEWS` | Shared link has reached maximum view count | 403 |
| `RPT_030` | `SHARED_LINK_PASSWORD_REQUIRED` | Password is required to view this report | 401 |
| `RPT_031` | `SHARED_LINK_PASSWORD_INCORRECT` | Incorrect shared link password | 403 |
| `RPT_032` | `VERSION_NOT_FOUND` | Report version not found | 404 |
| `RPT_033` | `VERSION_CREATE_FAILED` | Failed to create report version | 500 |
| `RPT_034` | `VERSION_LIST_FAILED` | Failed to list report versions | 500 |
| `RPT_035` | `BRANDING_NOT_FOUND` | Branding configuration not found | 404 |
| `RPT_036` | `BRANDING_LOGO_UPLOAD_FAILED` | Failed to upload branding logo | 500 |
| `RPT_037` | `PDF_RENDER_FAILED` | Puppeteer PDF rendering failed | 500 |
| `RPT_038` | `CONCURRENT_GENERATION` | Report is already being generated | 409 |
| `RPT_039` | `QUOTA_EXCEEDED` | Report generation quota exceeded for this venture | 429 |
| `RPT_040` | `COMMENT_NOT_FOUND` | Report comment not found | 404 |

```typescript
export const REPORT_ERRORS = {
  REPORT_NOT_FOUND: 'RPT_001: Report not found or access denied',
  REPORT_ARCHIVED: 'RPT_002: Cannot modify or generate an archived report',
  CREATE_FAILED: 'RPT_003: Failed to create report',
  UPDATE_FAILED: 'RPT_004: Failed to update report',
  DELETE_FAILED: 'RPT_005: Failed to delete report',
  LIST_FAILED: 'RPT_006: Failed to list reports',
  INVALID_STATUS_TRANSITION: 'RPT_007: Invalid report status transition',
  TEMPLATE_NOT_FOUND: 'RPT_008: Report template not found',
  TEMPLATE_LIST_FAILED: 'RPT_009: Failed to list report templates',
  TEMPLATE_CREATE_FAILED: 'RPT_010: Failed to create report template',
  SECTION_NOT_FOUND: 'RPT_011: Report section not found',
  SECTION_LIMIT_EXCEEDED: 'RPT_012: Maximum sections per report exceeded',
  SECTION_ORDER_CONFLICT: 'RPT_013: Section order conflict',
  SCHEDULE_NOT_FOUND: 'RPT_014: Report schedule not found',
  SCHEDULE_EXISTS: 'RPT_015: A schedule already exists for this report',
  SCHEDULE_CRON_INVALID: 'RPT_016: Invalid cron expression',
  EXPORT_FAILED: 'RPT_017: Report generation/export failed',
  EXPORT_TIMEOUT: 'RPT_018: Report generation timed out',
  EXPORT_NOT_FOUND: 'RPT_019: Export record not found',
  EXPORT_EXPIRED: 'RPT_020: Export file has expired',
  DATASOURCE_FETCH_FAILED: 'RPT_021: Failed to fetch data from data source',
  DATASOURCE_TIMEOUT: 'RPT_022: Data source query timed out',
  DATASOURCE_INVALID_QUERY: 'RPT_023: Invalid or disallowed SQL query',
  PARAMETER_MISSING: 'RPT_024: Required report parameter is missing',
  PARAMETER_INVALID: 'RPT_025: Report parameter failed validation',
  DISTRIBUTION_FAILED: 'RPT_026: Failed to distribute report',
  DISTRIBUTION_CHANNEL_UNSUPPORTED: 'RPT_027: Unsupported distribution channel',
  SHARED_LINK_EXPIRED: 'RPT_028: Shared link has expired',
  SHARED_LINK_MAX_VIEWS: 'RPT_029: Shared link has reached maximum view count',
  SHARED_LINK_PASSWORD_REQUIRED: 'RPT_030: Password required to view this report',
  SHARED_LINK_PASSWORD_INCORRECT: 'RPT_031: Incorrect shared link password',
  VERSION_NOT_FOUND: 'RPT_032: Report version not found',
  VERSION_CREATE_FAILED: 'RPT_033: Failed to create report version',
  VERSION_LIST_FAILED: 'RPT_034: Failed to list report versions',
  BRANDING_NOT_FOUND: 'RPT_035: Branding configuration not found',
  BRANDING_LOGO_UPLOAD_FAILED: 'RPT_036: Failed to upload branding logo',
  PDF_RENDER_FAILED: 'RPT_037: Puppeteer PDF rendering failed',
  CONCURRENT_GENERATION: 'RPT_038: Report is already being generated',
  QUOTA_EXCEEDED: 'RPT_039: Report generation quota exceeded',
  COMMENT_NOT_FOUND: 'RPT_040: Report comment not found',
} as const;
```

---

## Security

### Access Control

Reports operate under venture-scoped access control. All queries are filtered by `venture_id` to enforce multi-tenant isolation.

```typescript
/**
 * Row-Level Security (RLS) policies for reports tables.
 */

-- Users can only access reports in their ventures
CREATE POLICY reports_venture_isolation ON reports
  FOR ALL USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
    )
  );

-- Report exports scoped to venture
CREATE POLICY exports_venture_isolation ON report_exports
  FOR ALL USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
    )
  );

-- Comments: authors can edit/delete their own
CREATE POLICY comments_author_edit ON report_comments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY comments_author_delete ON report_comments
  FOR DELETE USING (author_id = auth.uid());

-- Shared links: only creators or venture members can manage
CREATE POLICY shared_links_manage ON report_shared_links
  FOR ALL USING (
    created_by = auth.uid() OR
    export_id IN (
      SELECT id FROM report_exports
      WHERE venture_id IN (
        SELECT venture_id FROM venture_members
        WHERE user_id = auth.uid()
      )
    )
  );
```

### SQL Injection Prevention

Raw SQL queries in `query` data sources are parameterized. The system enforces:

```typescript
/**
 * Validate and sanitize SQL queries for report data sources.
 * Only SELECT statements are allowed — no DDL, DML, or DCL.
 */
export function validateSqlQuery(query: string): void {
  const normalized = query.trim().toLowerCase();

  // Must start with SELECT or WITH (CTE)
  if (!normalized.startsWith('select') && !normalized.startsWith('with')) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: REPORT_ERRORS.DATASOURCE_INVALID_QUERY,
    });
  }

  // Forbidden keywords
  const forbidden = [
    'insert', 'update', 'delete', 'drop', 'alter', 'create',
    'truncate', 'grant', 'revoke', 'exec', 'execute',
    'pg_sleep', 'pg_terminate', 'pg_cancel',
  ];

  for (const keyword of forbidden) {
    // Match as whole word (not inside identifiers)
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(normalized)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `${REPORT_ERRORS.DATASOURCE_INVALID_QUERY}: '${keyword}' is not allowed`,
      });
    }
  }

  // Enforce statement terminator limit (no multi-statement)
  if ((query.match(/;/g) || []).length > 1) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${REPORT_ERRORS.DATASOURCE_INVALID_QUERY}: Multi-statement queries not allowed`,
    });
  }
}
```

### Data Encryption

- **Credentials**: API keys, OAuth tokens, and webhook secrets stored in `report_data_sources.config` and `report_distributions.config` are encrypted at rest using AES-256-GCM via Supabase Vault.
- **Shared link passwords**: Stored as bcrypt hashes (cost factor 12).
- **Export files**: Stored in Supabase Storage with private bucket ACLs. Signed URLs generated on access with short expiry (15 minutes).

### Rate Limiting

```typescript
export const REPORT_LIMITS = {
  /** Maximum reports per venture */
  MAX_REPORTS_PER_VENTURE: 500,
  /** Maximum sections per report */
  MAX_SECTIONS_PER_REPORT: 50,
  /** Maximum concurrent report generations per venture */
  MAX_CONCURRENT_GENERATIONS: 3,
  /** Maximum report generation time (milliseconds) */
  MAX_GENERATION_TIME_MS: 120_000,
  /** Maximum data source query rows */
  MAX_QUERY_ROWS: 50_000,
  /** Maximum data source query timeout (seconds) */
  MAX_QUERY_TIMEOUT_SECONDS: 60,
  /** Maximum export file size (bytes) — 50 MB */
  MAX_EXPORT_FILE_SIZE: 50 * 1024 * 1024,
  /** Export retention period (days) */
  EXPORT_RETENTION_DAYS: 90,
  /** Maximum scheduled reports per venture */
  MAX_SCHEDULED_REPORTS: 50,
  /** Maximum distributions per schedule */
  MAX_DISTRIBUTIONS_PER_SCHEDULE: 10,
  /** Maximum shared links per export */
  MAX_SHARED_LINKS_PER_EXPORT: 20,
  /** Rate limit: report generations per hour per venture */
  GENERATION_RATE_LIMIT_HOURLY: 30,
  /** Rate limit: API data source calls per minute */
  API_DATASOURCE_RATE_LIMIT_PER_MIN: 60,
} as const;
```

### Audit Logging

All report operations are logged for audit trails:

```typescript
interface ReportAuditEvent {
  eventType:
    | 'report.created'
    | 'report.updated'
    | 'report.deleted'
    | 'report.generated'
    | 'report.distributed'
    | 'report.shared'
    | 'report.version_restored'
    | 'schedule.created'
    | 'schedule.updated'
    | 'schedule.deleted'
    | 'schedule.triggered'
    | 'shared_link.accessed'
    | 'shared_link.downloaded';
  reportId: string;
  ventureId: string;
  userId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  timestamp: string;
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Supabase service role key for server-side operations |
| `SUPABASE_STORAGE_BUCKET` | No | `report-exports` | Storage bucket for generated report files |
| `REPORT_EMAIL_FROM` | No | `reports@mcv.app` | Sender email address for report distribution |
| `RESEND_API_KEY` | Yes* | — | Resend API key for email delivery (*required if email distribution is used) |
| `SLACK_BOT_TOKEN` | Yes* | — | Slack bot token (*required if Slack distribution is used) |
| `PUPPETEER_EXECUTABLE_PATH` | No | (bundled) | Custom Chromium/Chrome executable path for PDF rendering |
| `PUPPETEER_ARGS` | No | `--no-sandbox` | Additional Puppeteer launch arguments (comma-separated) |
| `APP_URL` | Yes | — | Application base URL (used for shared links) |
| `REPORT_GENERATION_TIMEOUT_MS` | No | `120000` | Maximum time for report generation |
| `REPORT_EXPORT_RETENTION_DAYS` | No | `90` | Days to retain generated exports before cleanup |
| `REPORT_MAX_CONCURRENT_GENERATIONS` | No | `3` | Max concurrent generations per venture |
| `REPORT_GENERATION_RATE_LIMIT` | No | `30` | Max generations per hour per venture |
| `REPORT_QUERY_TIMEOUT_SECONDS` | No | `60` | SQL query timeout for query data sources |
| `REPORT_QUERY_MAX_ROWS` | No | `50000` | Maximum rows returned from query data sources |
| `ENCRYPTION_KEY` | Yes | — | AES-256 key for encrypting stored credentials |
| `REDIS_URL` | No | — | Redis URL for generation queue and distributed locks |
| `REPORT_CRON_ENABLED` | No | `true` | Enable/disable the schedule cron worker |
| `REPORT_CRON_INTERVAL_MS` | No | `60000` | Schedule check interval (milliseconds) |

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.39` | Database client and storage access |
| `@trpc/server` | `^10.45` | API router definitions |
| `zod` | `^3.22` | Input validation and schema definitions |
| `puppeteer` | `^22.0` | Headless Chrome for PDF/HTML rendering |
| `exceljs` | `^4.4` | Excel (XLSX) file generation |
| `pptxgenjs` | `^3.12` | PowerPoint (PPTX) file generation |
| `csv-stringify` | `^6.4` | CSV file generation |
| `resend` | `^3.0` | Email delivery for report distribution |
| `cron-parser` | `^4.9` | Cron expression parsing and next-run calculation |
| `bcryptjs` | `^2.4` | Password hashing for shared links |
| `ioredis` | `^5.3` | Redis client for generation queue and locks |
| `date-fns` | `^3.3` | Date manipulation for parameter resolution |
| `date-fns-tz` | `^2.0` | Timezone-aware date operations for scheduling |
| `handlebars` | `^4.7` | Template rendering for email bodies and text sections |
| `sanitize-html` | `^2.11` | HTML sanitization for user-provided content |
| `uuid` | `^9.0` | UUID generation for tokens and identifiers |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | `^1.2` | Test runner |
| `@testing-library/react` | `^14.1` | Component testing for builder UI |
| `msw` | `^2.1` | API mocking for integration tests |
| `testcontainers` | `^10.4` | PostgreSQL containers for DB tests |
| `faker` | `^8.4` | Test data generation |
| `supertest` | `^6.3` | HTTP integration testing |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/analytics/metrics` | `workspace:*` | Metric data source integration |
| `@mcv/analytics/dashboards` | `workspace:*` | Dashboard embed distribution |
| `@mcv/core/auth` | `workspace:*` | Authentication and authorization |
| `@mcv/core/storage` | `workspace:*` | File storage abstraction |
| `@mcv/core/audit` | `workspace:*` | Audit logging |

---

## Testing

### Test Structure

```
reports/
├── __tests__/
│   ├── unit/
│   │   ├── report.service.test.ts
│   │   ├── report-builder.service.test.ts
│   │   ├── report-scheduler.service.test.ts
│   │   ├── report-distribution.service.test.ts
│   │   ├── report-export.service.test.ts
│   │   ├── report-template.service.test.ts
│   │   ├── report-versioning.service.test.ts
│   │   ├── parameters.test.ts
│   │   ├── sql-validation.test.ts
│   │   └── branding.test.ts
│   ├── integration/
│   │   ├── report-crud.test.ts
│   │   ├── report-generation.test.ts
│   │   ├── report-scheduling.test.ts
│   │   ├── report-distribution.test.ts
│   │   ├── shared-links.test.ts
│   │   └── versioning.test.ts
│   └── fixtures/
│       ├── reports.ts
│       ├── templates.ts
│       ├── sections.ts
│       └── exports.ts
```

### Unit Test Example — Parameter Resolution

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveParameters, resolveDynamicValue } from '../utils/parameters';
import type { ReportParameter } from '../types';

describe('resolveParameters', () => {
  const baseDefinitions: Record<string, ReportParameter> = {
    date_range: {
      key: 'date_range',
      label: 'Date Range',
      type: 'date_range',
      defaultValue: { start: '2026-01-01', end: '2026-01-31' },
      required: true,
      description: null,
      validation: null,
      options: null,
      optionsSource: null,
    },
    venture: {
      key: 'venture',
      label: 'Venture',
      type: 'venture',
      defaultValue: 'default_venture',
      required: false,
      description: null,
      validation: null,
      options: null,
      optionsSource: null,
    },
  };

  it('should use defaults when no overrides provided', () => {
    const result = resolveParameters(baseDefinitions, {});
    expect(result.date_range).toEqual({ start: '2026-01-01', end: '2026-01-31' });
    expect(result.venture).toBe('default_venture');
  });

  it('should override defaults with provided values', () => {
    const result = resolveParameters(baseDefinitions, {
      venture: 'custom_venture',
    });
    expect(result.venture).toBe('custom_venture');
  });

  it('should throw on missing required parameter with no default', () => {
    const defs = {
      required_field: {
        ...baseDefinitions.venture,
        key: 'required_field',
        required: true,
        defaultValue: null,
      },
    };
    expect(() => resolveParameters(defs, {})).toThrow(/required/i);
  });

  it('should resolve {{today}} token', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-08'));

    const defs: Record<string, ReportParameter> = {
      date: {
        key: 'date',
        label: 'Date',
        type: 'date',
        defaultValue: '{{today}}',
        required: true,
        description: null,
        validation: null,
        options: null,
        optionsSource: null,
      },
    };

    const result = resolveParameters(defs, {});
    expect(result.date).toBe('2026-02-08');

    vi.useRealTimers();
  });

  it('should resolve {{relative:-7d}} token', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-08'));

    const defs: Record<string, ReportParameter> = {
      start: {
        key: 'start',
        label: 'Start',
        type: 'date',
        defaultValue: '{{relative:-7d}}',
        required: true,
        description: null,
        validation: null,
        options: null,
        optionsSource: null,
      },
    };

    const result = resolveParameters(defs, {});
    expect(result.start).toBe('2026-02-01');

    vi.useRealTimers();
  });

  it('should resolve nested date_range with dynamic tokens', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-08'));

    const defs: Record<string, ReportParameter> = {
      date_range: {
        key: 'date_range',
        label: 'Range',
        type: 'date_range',
        defaultValue: {
          start: '{{start_of_month}}',
          end: '{{today}}',
        },
        required: true,
        description: null,
        validation: null,
        options: null,
        optionsSource: null,
      },
    };

    const result = resolveParameters(defs, {});
    expect(result.date_range).toEqual({
      start: '2026-02-01',
      end: '2026-02-08',
    });

    vi.useRealTimers();
  });

  it('should pass through extra overrides not in definitions', () => {
    const result = resolveParameters(baseDefinitions, {
      extra_param: 'hello',
    });
    expect(result.extra_param).toBe('hello');
  });
});
```

### Unit Test Example — SQL Validation

```typescript
import { describe, it, expect } from 'vitest';
import { validateSqlQuery } from '../utils/datasource';

describe('validateSqlQuery', () => {
  it('should accept valid SELECT queries', () => {
    expect(() => validateSqlQuery('SELECT * FROM metrics WHERE venture_id = $1')).not.toThrow();
    expect(() => validateSqlQuery('SELECT count(*) FROM events')).not.toThrow();
  });

  it('should accept CTE queries', () => {
    expect(() => validateSqlQuery(`
      WITH monthly AS (
        SELECT date_trunc('month', created_at) as month, count(*)
        FROM orders GROUP BY 1
      )
      SELECT * FROM monthly ORDER BY month
    `)).not.toThrow();
  });

  it('should reject INSERT statements', () => {
    expect(() => validateSqlQuery('INSERT INTO reports (name) VALUES ($1)')).toThrow(/not allowed/);
  });

  it('should reject UPDATE statements', () => {
    expect(() => validateSqlQuery('UPDATE reports SET name = $1 WHERE id = $2')).toThrow(/not allowed/);
  });

  it('should reject DELETE statements', () => {
    expect(() => validateSqlQuery('DELETE FROM reports WHERE id = $1')).toThrow(/not allowed/);
  });

  it('should reject DROP statements', () => {
    expect(() => validateSqlQuery('DROP TABLE reports')).toThrow(/not allowed/);
  });

  it('should reject pg_sleep injection attempts', () => {
    expect(() => validateSqlQuery("SELECT * FROM reports WHERE id = '1'; SELECT pg_sleep(10)")).toThrow();
  });

  it('should reject multi-statement queries', () => {
    expect(() => validateSqlQuery('SELECT 1; SELECT 2;')).toThrow(/multi-statement/i);
  });
});
```

### Integration Test Example — Report Generation

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { ReportService } from '../services/report.service';
import { setupTestDatabase, teardownTestDatabase } from './helpers/db';
import { createTestReport, createTestSections } from './fixtures/reports';

describe('Report Generation (Integration)', () => {
  let db: ReturnType<typeof createClient>;
  let service: ReportService;
  let testReportId: string;
  let testVentureId: string;

  beforeAll(async () => {
    db = await setupTestDatabase();
    service = new ReportService(db, /* ...dependencies... */);

    // Create test data
    testVentureId = 'test-venture-001';
    const report = await service.createReport({
      ventureId: testVentureId,
      name: 'Integration Test Report',
      description: 'Test report for integration testing',
      userId: 'test-user-001',
    });
    testReportId = report.id;

    // Add sections with static data sources
    await createTestSections(db, testReportId);
  });

  afterAll(async () => {
    await teardownTestDatabase(db);
  });

  it('should generate a PDF report', async () => {
    const result = await service.generateReport({
      reportId: testReportId,
      ventureId: testVentureId,
      format: 'pdf',
      parameters: {},
      distribute: false,
      userId: 'test-user-001',
    });

    expect(result.status).toBe('completed');
    expect(result.format).toBe('pdf');
    expect(result.fileUrl).toBeTruthy();
    expect(result.fileSizeBytes).toBeGreaterThan(0);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.durationMs).toBeGreaterThan(0);
    expect(result.error).toBeNull();
  });

  it('should generate an Excel report', async () => {
    const result = await service.generateReport({
      reportId: testReportId,
      ventureId: testVentureId,
      format: 'excel',
      parameters: {},
      distribute: false,
      userId: 'test-user-001',
    });

    expect(result.status).toBe('completed');
    expect(result.format).toBe('excel');
    expect(result.fileUrl).toMatch(/\.xlsx$/);
  });

  it('should generate a CSV report', async () => {
    const result = await service.generateReport({
      reportId: testReportId,
      ventureId: testVentureId,
      format: 'csv',
      parameters: {},
      distribute: false,
      userId: 'test-user-001',
    });

    expect(result.status).toBe('completed');
    expect(result.format).toBe('csv');
  });

  it('should reject generation for archived reports', async () => {
    await service.updateReport(testReportId, {
      ventureId: testVentureId,
      status: 'archived',
    });

    await expect(
      service.generateReport({
        reportId: testReportId,
        ventureId: testVentureId,
        format: 'pdf',
        parameters: {},
        distribute: false,
        userId: 'test-user-001',
      }),
    ).rejects.toThrow(/archived/i);

    // Restore for subsequent tests
    await service.updateReport(testReportId, {
      ventureId: testVentureId,
      status: 'draft',
    });
  });

  it('should create a version on each generation', async () => {
    const versionsBefore = await service.versioning.listVersions(testReportId);

    await service.generateReport({
      reportId: testReportId,
      ventureId: testVentureId,
      format: 'pdf',
      parameters: {},
      distribute: false,
      userId: 'test-user-001',
    });

    const versionsAfter = await service.versioning.listVersions(testReportId);
    expect(versionsAfter.length).toBe(versionsBefore.length + 1);
  });

  it('should generate with parameter overrides', async () => {
    const result = await service.generateReport({
      reportId: testReportId,
      ventureId: testVentureId,
      format: 'html',
      parameters: {
        date_range: { start: '2026-01-01', end: '2026-01-15' },
      },
      distribute: false,
      userId: 'test-user-001',
    });

    expect(result.status).toBe('completed');
    expect(result.parameters).toEqual(
      expect.objectContaining({
        date_range: { start: '2026-01-01', end: '2026-01-15' },
      }),
    );
  });
});
```

### Integration Test Example — Scheduling

```typescript
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { ReportSchedulerService } from '../services/report-scheduler.service';

describe('Report Scheduling (Integration)', () => {
  let scheduler: ReportSchedulerService;

  beforeAll(async () => {
    scheduler = new ReportSchedulerService(db);
  });

  it('should create a weekly schedule', async () => {
    const schedule = await scheduler.createSchedule({
      reportId: testReportId,
      frequency: 'weekly',
      timezone: 'America/New_York',
      parameters: {},
      format: 'pdf',
      distributions: [],
      maxRetries: 3,
    });

    expect(schedule.frequency).toBe('weekly');
    expect(schedule.enabled).toBe(true);
    expect(schedule.nextRunAt).toBeTruthy();
    expect(schedule.failureCount).toBe(0);
  });

  it('should prevent duplicate schedules', async () => {
    await expect(
      scheduler.createSchedule({
        reportId: testReportId,
        frequency: 'daily',
        timezone: 'UTC',
        parameters: {},
        format: 'pdf',
        distributions: [],
        maxRetries: 3,
      }),
    ).rejects.toThrow(/already exists/i);
  });

  it('should process due schedules', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T08:00:00Z'));

    // Force schedule to be due
    await db
      .from('report_schedules')
      .update({ next_run_at: '2026-03-01T07:00:00Z' })
      .eq('report_id', testReportId);

    const processed = await scheduler.processDueSchedules();
    expect(processed).toBeGreaterThan(0);

    vi.useRealTimers();
  });
});
```

### Running Tests

```bash
# Run all report tests
pnpm vitest run --project analytics-reports

# Run unit tests only
pnpm vitest run --project analytics-reports --dir __tests__/unit

# Run integration tests only (requires database)
pnpm vitest run --project analytics-reports --dir __tests__/integration

# Run with coverage
pnpm vitest run --project analytics-reports --coverage

# Watch mode
pnpm vitest --project analytics-reports
```

---

## Defaults & Constants

```typescript
export const REPORT_DEFAULTS = {
  /** Default export format */
  EXPORT_FORMAT: 'pdf' as ExportFormat,
  /** Default schedule timezone */
  TIMEZONE: 'UTC',
  /** Default page size for PDF */
  PDF_PAGE_SIZE: 'A4',
  /** Default branding colors */
  PRIMARY_COLOR: '#1a1a2e',
  SECONDARY_COLOR: '#16213e',
  ACCENT_COLOR: '#0f3460',
  BACKGROUND_COLOR: '#ffffff',
  TEXT_COLOR: '#1a1a2e',
  /** Default fonts */
  HEADING_FONT: 'Inter',
  BODY_FONT: 'Inter',
  /** Default schedule retry delay (milliseconds) */
  RETRY_DELAY_MS: 300_000, // 5 minutes
  /** Default cache TTL for data sources (seconds) */
  DATASOURCE_CACHE_TTL: 300,
} as const;

export const SECTION_TYPES = [
  'kpi_card', 'chart_bar', 'chart_line', 'chart_pie', 'chart_area',
  'chart_scatter', 'chart_funnel', 'table', 'text', 'image',
  'divider', 'spacer', 'header', 'summary', 'metric_grid',
  'comparison', 'heatmap',
] as const;

export const EXPORT_FORMATS = ['pdf', 'excel', 'csv', 'pptx', 'html'] as const;

export const SCHEDULE_FREQUENCIES = [
  'daily', 'weekly', 'biweekly', 'monthly',
  'quarterly', 'annually', 'custom',
] as const;

export const DISTRIBUTION_CHANNELS = [
  'email', 'slack', 'teams', 'webhook',
  'shared_link', 'dashboard_embed',
] as const;
```

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/analytics/metrics` | Data source for metric-type sections |
| `@mcv/analytics/dashboards` | Embed reports in dashboards; dashboard data available as report data source |
| `@mcv/core/auth` | Authentication, authorization, and venture membership checks |
| `@mcv/core/storage` | File storage for exports, branding assets, and spreadsheet uploads |
| `@mcv/core/audit` | Audit logging for all report operations |
| `@mcv/core/notifications` | Notification delivery for scheduled report events |