# @mcv/shared/export — Data Export Engine

**Parent Package:** @mcv/shared  
**Tier:** 2.5 (Shared Utilities)  
**Classification:** PUBLISHABLE (Phase 2: Q3 2026)  
**Last Updated:** February 8, 2026

---

## Purpose

The `export` module provides a **unified data export pipeline** supporting CSV, Excel (XLSX), PDF, and JSON formats with streaming for large datasets, customizable templates, scheduled/recurring exports, compression, and audit-grade compliance logging. It handles everything from a simple "Download as CSV" button click to multi-million-row background exports delivered to S3 with emailed download links.

**Every data export in MCV — from contact lists to audit logs to financial reports — flows through this module.**

The module is architected as a five-stage pipeline: **Template Resolution → Access Control → Data Streaming → Format Rendering → Output Delivery**. Each stage is independently testable, swappable, and observable. The pipeline respects Node.js backpressure semantics, meaning a slow S3 upload will automatically pause data fetching rather than bloating memory.

Key capabilities:

- **Multi-format**: CSV, XLSX (multi-sheet, styled), PDF (templated), JSON/JSONL
- **Streaming**: Memory-efficient processing of millions of rows via async generators
- **Templates**: Reusable, venture-configurable export templates with column mapping, filtering, and styling
- **Background jobs**: Long-running exports processed as async jobs with progress tracking
- **Scheduling**: Cron-based recurring exports (daily reports, weekly summaries)
- **Compression**: Automatic ZIP packaging for multi-file exports
- **Audit trail**: Every export logged with who, what, when, and row counts for compliance
- **Access control**: Exports respect RBAC — users can only export data they can view
- **CSV injection prevention**: Automatic sanitization of formula-injection payloads
- **PII redaction**: Column-level redaction based on user role and sensitivity classification
- **Client components**: Drop-in React hooks and UI components (`ExportMenu`, `ExportButton`, `ExportDialog`)

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT EXPORTERS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  exportToCsv,              // Export data to CSV string/buffer
  exportToExcel,            // Export data to XLSX buffer (multi-sheet)
  exportToPdf,              // Export data to PDF buffer (templated)
  exportToJson,             // Export data to JSON/JSONL
  exportToFormat,           // Dynamic format dispatch
} from './formats';

// ═══════════════════════════════════════════════════════════════════════════════
// STREAMING EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createExportStream,       // Create streaming export pipeline
  streamToCsv,              // Stream data → CSV (Node.js Readable)
  streamToExcel,            // Stream data → XLSX (buffered sheets)
  streamToJsonl,            // Stream data → JSONL (line-delimited)
  pipeToStorage,            // Pipe export stream to S3/storage
} from './streaming';

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  defineExportTemplate,     // Define reusable export template
  applyTemplate,            // Execute export using template
  getTemplate,              // Get template by name/ID
  listTemplates,            // List available templates for venture
  createVentureTemplate,    // Create venture-specific template
  updateTemplate,           // Update template configuration
  deleteTemplate,           // Delete template
  cloneTemplate,            // Clone template for customization
} from './templates';

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND JOBS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createExportJob,          // Create background export job
  getExportJob,             // Get job status/progress
  listExportJobs,           // List jobs for user/venture
  cancelExportJob,          // Cancel running job
  retryExportJob,           // Retry failed job
  getExportDownloadUrl,     // Get signed download URL
  cleanupExpiredExports,    // Cron: delete expired export files
} from './jobs';

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULED EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  scheduleExport,           // Create recurring export schedule
  getSchedule,              // Get schedule by ID
  listSchedules,            // List schedules for venture
  updateSchedule,           // Update schedule config
  pauseSchedule,            // Pause scheduled export
  resumeSchedule,           // Resume paused schedule
  deleteSchedule,           // Delete schedule
  triggerScheduleNow,       // Manually trigger scheduled export
} from './scheduling';

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  defineColumn,             // Define single column config
  defineColumns,            // Define column set
  columnFromField,          // Auto-generate column from DB field
  columnsFromSchema,        // Auto-generate columns from Drizzle schema
} from './columns';

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  convertToCSV,             // Low-level CSV converter
  convertToJSON,            // Low-level JSON converter
  downloadFile,             // Browser-side file download trigger
  copyToClipboard,          // Copy export data to clipboard
} from './utils';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useExport } from './client/hooks/use-export';
export { useExportJob } from './client/hooks/use-export-job';
export { useExportTemplates } from './client/hooks/use-export-templates';
export { useCreateAuditExport } from './client/hooks/use-audit-logs';
export { useAuditExportStatus } from './client/hooks/use-audit-logs';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { ExportButton } from './client/components/export-button';
export { ExportDialog } from './client/components/export-dialog';
export { ExportJobTracker } from './client/components/export-job-tracker';
export { ExportMenu } from './client/components/export-menu';
export { AuditExportModal } from './client/components/audit-export';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  EXPORT_FORMATS,           // ['csv', 'xlsx', 'pdf', 'json', 'jsonl']
  MAX_SYNC_ROWS,            // 10,000 — above this, use background job
  MAX_EXPORT_ROWS,          // 5,000,000 — absolute maximum
  EXPORT_FILE_TTL,          // 7 days — auto-cleanup
  DEFAULT_BATCH_SIZE,       // 10,000 rows per batch
  CSV_DELIMITERS,           // comma, semicolon, tab, pipe
  EXCEL_MAX_ROWS_PER_SHEET, // 1,048,576 (Excel limit)
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Core
  ExportFormat,
  ExportOptions,
  ExportResult,
  ExportColumn,
  ColumnFormat,
  ColumnTransform,

  // Templates
  ExportTemplate,
  ExportTemplateConfig,

  // Jobs
  ExportJob,
  ExportJobStatus,
  ExportJobProgress,

  // Scheduling
  ExportSchedule,
  ExportScheduleConfig,
  ScheduleFrequency,

  // Streaming
  ExportStreamOptions,
  DataProvider,

  // Styling
  ExcelStyling,
  PdfStyling,
  PdfTemplate,
  HeaderFooter,

  // CSV
  CsvOptions,
  CsvDelimiter,

  // Audit-specific
  AuditExport,
  NewAuditExport,
  AuditExportFilters,

  // UI
  ExportMenuProps,
  ExportConfig,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                            EXPORT ENGINE ARCHITECTURE                                 │
│                                                                                       │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              ENTRY POINTS                                        │ │
│  │                                                                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│ │
│  │  │  API Routes  │  │  UI Button  │  │  Scheduled  │  │  Audit Compliance /     ││ │
│  │  │  /api/export │  │  "Export"   │  │  Cron Jobs  │  │  Legal Holds            ││ │
│  │  │  /api/audit/ │  │  ExportMenu │  │  (cron-svc) │  │  (SOC 2, GDPR, HIPAA)  ││ │
│  │  │  exports     │  │  component  │  │             │  │                         ││ │
│  │  └──────┬───────┘  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘│ │
│  │         └─────────────────┴────────────────┴─────────────────────┘              │ │
│  │                                    │                                             │ │
│  └────────────────────────────────────┼─────────────────────────────────────────────┘ │
│                                       │                                               │
│  ┌────────────────────────────────────▼──────────────────────────────────────────────┐│
│  │                           EXPORT PIPELINE (5 stages)                              ││
│  │                                                                                   ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌───────────┐││
│  │  │ 1. Template │→ │ 2. Access   │→ │  3. Data    │→ │ 4. Format│→ │ 5. Output │││
│  │  │    Resolve  │  │    Check    │  │    Stream   │  │   Render │  │   Deliver │││
│  │  │             │  │    (RBAC)   │  │   (batched) │  │          │  │           │││
│  │  │  • Columns  │  │  • Filter   │  │  • Cursor   │  │  • CSV   │  │  • Buffer │││
│  │  │  • Filters  │  │  • Redact   │  │    paging   │  │  • XLSX  │  │  • Stream │││
│  │  │  • Sorting  │  │  • PII mask │  │  • Transform│  │  • PDF   │  │  • S3/R2  │││
│  │  │  • Format   │  │  • Sensitive│  │  • Enrich   │  │  • JSON  │  │  • Email  │││
│  │  │  • Styling  │  │    fields   │  │  • Validate │  │  • JSONL │  │  • ZIP    │││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘  └───────────┘││
│  │                                                                                   ││
│  └───────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐│
│  │                   JOB MANAGER (for exports > MAX_SYNC_ROWS)                       ││
│  │                                                                                   ││
│  │  Request                                                                          ││
│  │    │                                                                              ││
│  │    ▼                                                                              ││
│  │  ┌──────────┐    ┌──────────────┐    ┌───────────┐    ┌────────────────────────┐  ││
│  │  │ pending  │───▶│ processing   │───▶│ completed │    │  Progress Tracker      │  ││
│  │  │          │    │ (worker pool)│    │ (S3 URL)  │    │                        │  ││
│  │  │ Queued   │    │              │    │           │    │  ┌──────────────────┐  │  ││
│  │  │ in DB    │    │ Streaming    │    │ Signed    │    │  │ ████████░░░ 78%  │  │  ││
│  │  │          │    │ pipeline     │    │ download  │    │  │ 780K / 1M rows   │  │  ││
│  │  │          │    │ running      │    │ URL ready │    │  │ ETA: 45 seconds  │  │  ││
│  │  └──────────┘    └──────┬───────┘    └───────────┘    │  └──────────────────┘  │  ││
│  │                         │                              └────────────────────────┘  ││
│  │                    ┌────▼─────┐                                                    ││
│  │                    │  failed  │  ← retryable with exponential backoff              ││
│  │                    │          │                                                    ││
│  │                    └──────────┘                                                    ││
│  │                                                                                   ││
│  │  Also: expired (auto-cleanup after EXPORT_FILE_TTL), cancelled (user-initiated)   ││
│  └───────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐│
│  │                    SCHEDULING ENGINE                                               ││
│  │                                                                                   ││
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────────────┐││
│  │  │  Schedule Config │  │  Cron Trigger     │  │  Delivery                        │││
│  │  │                  │  │                   │  │                                  │││
│  │  │  • Frequency     │→ │  • daily          │→ │  • Create ExportJob              │││
│  │  │  • Day/Time      │  │  • weekly         │  │  • Process via pipeline          │││
│  │  │  • Timezone      │  │  • biweekly       │  │  • Upload to S3                  │││
│  │  │  • Template ref  │  │  • monthly        │  │  • Email download link           │││
│  │  │  • Recipients    │  │  • quarterly      │  │  • Update next_run_at            │││
│  │  └──────────────────┘  └──────────────────┘  └──────────────────────────────────┘││
│  └───────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐│
│  │                    STORAGE & DELIVERY LAYER                                        ││
│  │                                                                                   ││
│  │  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────────────────────┐   ││
│  │  │  S3 / R2 Storage │  │  Signed URLs      │  │  Email Delivery              │   ││
│  │  │  (7-day expiry)  │  │  (1-hour expiry)  │  │  (download link)             │   ││
│  │  │                  │  │                   │  │                              │   ││
│  │  │  Bucket:         │  │  Pre-signed GET   │  │  Via @mcv/email              │   ││
│  │  │  exports/        │  │  with content-    │  │  Includes: filename, size,   │   ││
│  │  │  {ventureId}/    │  │  disposition:     │  │  row count, expiry date      │   ││
│  │  │  {timestamp}/    │  │  attachment       │  │                              │   ││
│  │  │  {filename}      │  │                   │  │                              │   ││
│  │  └──────────────────┘  └───────────────────┘  └──────────────────────────────┘   ││
│  └───────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐│
│  │                    DATABASE LAYER                                                  ││
│  │                                                                                   ││
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐   ││
│  │  │  audit_exports   │  │ export_templates  │  │  export_schedules            │   ││
│  │  │                  │  │                   │  │                              │   ││
│  │  │  Job tracking,   │  │  Reusable column  │  │  Cron-based recurring        │   ││
│  │  │  status, progress│  │  definitions,     │  │  exports with frequency,     │   ││
│  │  │  file URL, expiry│  │  filters, styling │  │  timezone, recipients        │   ││
│  │  └──────────────────┘  └──────────────────┘  └──────────────────────────────┘   ││
│  └───────────────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Synchronous Export (< 10,000 rows)

```
User clicks "Export as CSV"
  │
  ▼
ExportMenu.handleExport('csv')
  │
  ├─ convertToCSV(data, columns)      ← in-browser conversion
  │    ├─ Resolve column headers
  │    ├─ Apply accessor functions
  │    ├─ Escape quotes/commas
  │    └─ Join rows with delimiter
  │
  ├─ downloadFile(csv, filename, mimeType)
  │    ├─ new Blob([content])
  │    ├─ URL.createObjectURL(blob)
  │    ├─ Inject <a> element, click()
  │    └─ URL.revokeObjectURL()
  │
  └─ Done (sub-second for typical datasets)
```

### Asynchronous Export (> 10,000 rows)

```
User requests large export
  │
  ▼
POST /api/export → createExportJob()
  │
  ├─ Insert audit_exports row (status: 'pending')
  │
  ├─ Return job ID immediately → UI shows progress tracker
  │
  ▼
Worker picks up job → processExport(jobId)
  │
  ├─ Set status: 'processing', progress: 10%
  │
  ├─ Build query conditions from filters
  │    ├─ Date range (gte/lte)
  │    ├─ Venture scope
  │    ├─ Category/action filters
  │    ├─ Actor filters
  │    ├─ Resource type filters
  │    ├─ Result filter (success/failure/all)
  │    └─ Sensitive-only flag
  │
  ├─ Fetch data (cursor-based pagination for streaming)
  │    └─ progress: 30% → 60%
  │
  ├─ Render to format (CSV via papaparse, JSON via JSON.stringify)
  │    └─ progress: 60% → 80%
  │
  ├─ Upload to storage / generate download URL
  │    └─ progress: 80% → 100%
  │
  ├─ Set status: 'completed', fileUrl, fileSizeBytes, completedAt
  │
  └─ (optional) Send email notification with download link
```

---

## TypeScript Interfaces

### Core Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT & COLUMN TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Supported export output formats */
type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json' | 'jsonl';

/** UI-level export format (includes clipboard and print) */
type UIExportFormat = 'csv' | 'json' | 'pdf' | 'excel' | 'clipboard' | 'print';

/** Core export options — passed to every export function */
interface ExportOptions<T = Record<string, unknown>> {
  /** Output format */
  format: ExportFormat;

  /** Column definitions controlling what fields are exported and how */
  columns: ExportColumn[];

  /** Data array (for synchronous in-memory exports) */
  data?: T[];

  /** Async data provider (for streaming exports of large datasets) */
  dataProvider?: DataProvider<T>;

  /** Filename without extension (auto-appended based on format) */
  filename?: string;

  /** Filter criteria applied server-side before data retrieval */
  filters?: Record<string, unknown>;

  /** Sort configuration — applied before export */
  sort?: { field: string; direction: 'asc' | 'desc' }[];

  /** Maximum rows to export (capped at MAX_EXPORT_ROWS = 5,000,000) */
  limit?: number;

  /** Whether to include column headers as first row (default: true) */
  includeHeaders?: boolean;

  /** IANA timezone for date/datetime formatting (e.g., 'America/Toronto') */
  timezone?: string;

  /** BCP 47 locale for number/date formatting (e.g., 'en-CA') */
  locale?: string;

  /** Compress output to ZIP (useful for multi-file or large exports) */
  compress?: boolean;

  /** CSV-specific options */
  csv?: CsvOptions;

  /** Excel-specific options */
  excel?: ExcelStyling;

  /** PDF-specific options */
  pdf?: PdfStyling;

  /** Custom data transformer applied to each row before formatting */
  transform?: (data: Record<string, unknown>[]) => Record<string, unknown>[];
}

/** Result returned after export completes */
interface ExportResult {
  /** Export format used */
  format: ExportFormat;

  /** File buffer (synchronous exports) */
  buffer?: Buffer;

  /** Storage URL (asynchronous/background exports) */
  url?: string;

  /** Generated filename with extension */
  filename: string;

  /** MIME type of the output file */
  mimeType: string;

  /** File size in bytes */
  sizeBytes: number;

  /** Row statistics */
  totalRows: number;
  exportedRows: number;
  skippedRows: number;

  /** Processing duration in milliseconds */
  durationMs: number;
}

/** Single column definition for export */
interface ExportColumn {
  /** Data field key — supports dot notation for nested access: 'customer.name' */
  key: string;

  /** Display header text in the exported file */
  header: string;

  /** Column format — controls how values are displayed */
  format?: ColumnFormat;

  /** Custom value transformer — runs per-cell, receives (value, fullRow) */
  transform?: ColumnTransform;

  /** Column width in characters (Excel) or points (PDF) */
  width?: number;

  /** Text alignment within the column */
  align?: 'left' | 'center' | 'right';

  /** Whether to include this column in export (for UI toggle support) */
  visible?: boolean;

  /** Sort order for column arrangement (lower = left) */
  sortOrder?: number;

  /** PII sensitivity level — triggers redaction for lower-privilege users */
  piiLevel?: 'none' | 'low' | 'medium' | 'high';

  /** Roles that see redacted values instead of real data */
  redactFor?: string[];

  /** Redaction pattern — e.g., '***-**-{{last4}}' for SSN partial masking */
  redactWith?: string;

  /** Column accessor function (UI component variant) */
  accessor?: (row: Record<string, unknown>) => unknown;
}

/** Built-in column format types */
type ColumnFormat =
  | 'string'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'datetime'
  | 'time'
  | 'boolean'
  | 'email'
  | 'phone'
  | 'url'
  | { type: 'custom'; pattern: string };

/** Column value transformer function */
type ColumnTransform = (value: unknown, row: Record<string, unknown>) => unknown;
```

### CSV Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CSV CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Supported CSV field delimiters */
type CsvDelimiter = ',' | ';' | '\t' | '|';

/** CSV-specific export options */
interface CsvOptions {
  /** Field delimiter (default: ',') */
  delimiter?: CsvDelimiter;

  /** Line ending style (default: '\r\n' for Excel compatibility) */
  lineEnding?: '\n' | '\r\n';

  /** Quote character wrapping fields with special chars (default: '"') */
  quote?: string;

  /** Escape character for quotes within fields (default: '"') */
  escape?: string;

  /** Include BOM (Byte Order Mark) for Excel UTF-8 compatibility (default: true) */
  bom?: boolean;

  /** Output encoding */
  encoding?: 'utf-8' | 'utf-16le' | 'ascii' | 'latin1';

  /** String representation of null/undefined values (default: '') */
  nullValue?: string;
}
```

### Excel Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXCEL (XLSX) CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Excel workbook styling and configuration */
interface ExcelStyling {
  /** Sheet configurations for multi-sheet workbooks */
  sheets?: ExcelSheet[];

  /** Bold header row text (default: true) */
  headerBold?: boolean;

  /** Header row background color as hex (e.g., '#1a1a2e') */
  headerBackground?: string;

  /** Header row text color as hex (e.g., '#ffffff') */
  headerColor?: string;

  /** Enable alternating row background colors (default: false) */
  alternateRows?: boolean;

  /** Alternate row background color as hex (e.g., '#f5f5f5') */
  alternateColor?: string;

  /** Freeze the header row so it stays visible during scroll (default: true) */
  freezeHeader?: boolean;

  /** Add auto-filter dropdowns to header columns (default: true) */
  autoFilter?: boolean;

  /** Auto-calculate column widths based on content (default: true) */
  autoWidth?: boolean;

  /** Password-protect the workbook (prevents editing, not viewing) */
  password?: string;
}

/** Single sheet within a multi-sheet Excel workbook */
interface ExcelSheet {
  /** Sheet tab name (max 31 characters, no special chars) */
  name: string;

  /** Data rows for this sheet */
  data: Record<string, unknown>[];

  /** Column definitions for this sheet */
  columns: ExportColumn[];

  /** Per-sheet styling overrides */
  styling?: ExcelStyling;
}
```

### PDF Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// PDF CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/** PDF document styling and layout */
interface PdfStyling {
  /** Page size (default: 'A4') */
  pageSize?: 'A4' | 'letter' | 'legal' | 'A3';

  /** Page orientation (default: 'portrait') */
  orientation?: 'portrait' | 'landscape';

  /** Page margins in inches */
  margins?: { top: number; right: number; bottom: number; left: number };

  /** Header configuration (appears on every page) */
  header?: HeaderFooter;

  /** Footer configuration (appears on every page) */
  footer?: HeaderFooter;

  /** Company logo URL (rendered top-left or as specified) */
  logo?: string;

  /** Document title displayed above the data table */
  title?: string;

  /** Subtitle/description below the title */
  subtitle?: string;

  /** Font family name (default: 'Helvetica') */
  fontFamily?: string;

  /** Base font size in points (default: 10) */
  fontSize?: number;

  /** Draw borders around table cells (default: true) */
  tableBorders?: boolean;

  /** Alternate row striping for readability (default: true) */
  tableStriped?: boolean;

  /** Diagonal watermark text overlaid on every page (e.g., 'CONFIDENTIAL') */
  watermark?: string;
}

/** Header or footer section with left/center/right zones */
interface HeaderFooter {
  /** Left-aligned text */
  left?: string;

  /** Center-aligned text */
  center?: string;

  /** Right-aligned text */
  right?: string;

  /**
   * Template with variable interpolation:
   * - {{date}}    → Current date
   * - {{page}}    → Current page number
   * - {{pages}}   → Total page count
   * - {{venture}} → Venture name
   */
  template?: string;
}
```

### Job & Scheduling Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT JOB TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Export job lifecycle states */
type ExportJobStatus =
  | 'pending'      // Queued, waiting for worker
  | 'processing'   // Worker is actively generating the export
  | 'completed'    // Done — file available for download
  | 'failed'       // Error occurred during processing
  | 'expired'      // File TTL elapsed, auto-deleted from storage
  | 'cancelled';   // User or admin cancelled the job

/** Export job record — tracks a single background export */
interface ExportJob {
  /** Unique job identifier (UUID) */
  id: string;

  /** Venture scope */
  ventureId: string;

  /** User who initiated the export */
  requestedBy: string;

  /** Output format */
  format: ExportFormat;

  /** Current job status */
  status: ExportJobStatus;

  /** Progress percentage (0–100) */
  progress: number;

  /** Total records matching the query (set during processing) */
  totalRecords?: number;

  /** Records processed so far */
  processedRecords?: number;

  /** S3/R2 download URL (set on completion) */
  fileUrl?: string;

  /** Output file size in bytes */
  fileSizeBytes?: number;

  /** Error message if status is 'failed' */
  errorMessage?: string;

  /** When the export file will be auto-deleted */
  expiresAt?: Date;

  /** Job creation timestamp */
  createdAt: Date;

  /** Job completion timestamp */
  completedAt?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULING TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Supported schedule frequencies */
type ScheduleFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

/** Recurring export schedule */
interface ExportSchedule {
  /** Unique schedule identifier (UUID) */
  id: string;

  /** Venture scope */
  ventureId: string;

  /** Human-readable schedule name */
  name: string;

  /** Template to execute on each run */
  templateId: string;

  /** How often to run */
  frequency: ScheduleFrequency;

  /** Day of week for weekly schedules (0 = Sunday, 6 = Saturday) */
  dayOfWeek?: number;

  /** Day of month for monthly schedules (1–31) */
  dayOfMonth?: number;

  /** Time of day in HH:MM format (venture timezone) */
  time: string;

  /** IANA timezone for scheduling (e.g., 'America/Toronto') */
  timezone: string;

  /** Email addresses to receive the export download link */
  recipients: string[];

  /** Output format for the scheduled export */
  format: ExportFormat;

  /** Whether the schedule is active */
  enabled: boolean;

  /** Timestamp of last successful execution */
  lastRunAt?: Date;

  /** Computed next execution timestamp */
  nextRunAt?: Date;

  /** Schedule creation timestamp */
  createdAt: Date;
}
```

### Template Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT TEMPLATE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/** Reusable export template — saves column/filter/styling configuration */
interface ExportTemplate {
  /** Unique template identifier (UUID) */
  id: string;

  /** Venture scope — null means global (available to all ventures) */
  ventureId?: string;

  /** Template name (unique per venture) */
  name: string;

  /** Human-readable description */
  description?: string;

  /** Entity type this template exports (e.g., 'contacts', 'orders', 'invoices', 'audit_logs') */
  entityType: string;

  /** Default export format */
  format: ExportFormat;

  /** Column definitions */
  columns: ExportColumn[];

  /** Default filter criteria */
  filters?: Record<string, unknown>;

  /** Default sort configuration */
  sort?: { field: string; direction: 'asc' | 'desc' }[];

  /** Format-specific styling (Excel or PDF) */
  styling?: ExcelStyling | PdfStyling;

  /** Whether this is the default template for its entity type */
  isDefault?: boolean;

  /** Template creator user ID */
  createdBy?: string;

  /** Creation timestamp */
  createdAt: Date;

  /** Last modification timestamp */
  updatedAt: Date;
}
```

### Streaming Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// STREAMING & DATA PROVIDER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Async data provider for streaming exports.
 * Implementations yield batches of rows via an async generator,
 * allowing memory-efficient export of arbitrarily large datasets.
 */
interface DataProvider<T = Record<string, unknown>> {
  /** Async generator yielding batches of rows */
  getData(): AsyncGenerator<T[], void, void>;

  /** Optional: return total count for progress calculation */
  getTotalCount?(): Promise<number>;
}

/** Options for creating a streaming export */
interface ExportStreamOptions<T = Record<string, unknown>> {
  /** Output format */
  format: ExportFormat;

  /** Column definitions */
  columns: ExportColumn[];

  /** Data provider yielding batches */
  dataProvider: DataProvider<T>;

  /** Rows per batch (default: DEFAULT_BATCH_SIZE = 10,000) */
  batchSize?: number;

  /** Progress callback — called after each batch */
  onProgress?: (progress: ExportJobProgress) => void;
}

/** Progress information emitted during streaming exports */
interface ExportJobProgress {
  /** Total rows processed so far */
  processedRows: number;

  /** Total rows expected (if getTotalCount() is implemented) */
  totalRows?: number;

  /** Completion percentage (0–100) */
  percentage?: number;

  /** Bytes written to the output stream so far */
  bytesWritten: number;

  /** Elapsed time since export started (ms) */
  elapsedMs: number;

  /** Estimated time remaining (ms) — computed from throughput rate */
  estimatedRemainingMs?: number;
}
```

### Audit Export Filter Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT EXPORT FILTER TYPES (from @mcv/db schema)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Filter criteria for audit log exports.
 * Stored as JSONB in the audit_exports.filters column.
 */
interface AuditExportFilters {
  /** Filter by audit categories (e.g., 'auth', 'data_access', 'admin') */
  categories?: string[];

  /** Filter by specific actions (e.g., 'user.login', 'record.delete') */
  actions?: string[];

  /** Filter by actor user IDs */
  actorIds?: string[];

  /** Filter by resource types (e.g., 'user', 'venture', 'contact') */
  resourceTypes?: string[];

  /** Filter by event types */
  eventTypes?: string[];

  /** Filter by result outcome */
  resultFilter?: 'success' | 'failure' | 'all';

  /** Only include sensitive operations */
  sensitiveOnly?: boolean;

  /** Full-text search query */
  searchQuery?: string;
}
```

### UI Component Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════════════════

/** Configuration for a single export format option in the UI menu */
interface ExportConfig {
  /** Export format identifier */
  format: UIExportFormat;

  /** Display label (e.g., 'Export as CSV') */
  label: string;

  /** Icon element to display */
  icon: ReactNode;

  /** Whether this format option is enabled */
  enabled?: boolean;

  /** Description shown below the label */
  description?: string;
}

/** Props for the ExportMenu dropdown component */
interface ExportMenuProps {
  /** Data rows to export */
  data: Record<string, any>[];

  /** Column definitions for header mapping and value access */
  columns?: { id: string; header: string; accessor?: (row: any) => any }[];

  /** Which export formats to show (default: ['csv', 'json', 'clipboard']) */
  formats?: UIExportFormat[];

  /** Custom format configurations (overrides defaults) */
  customFormats?: ExportConfig[];

  /** Custom export handler — called instead of built-in implementation */
  onExport?: (format: UIExportFormat, options: ExportOptions) => Promise<void> | void;

  /** Default options applied to every export */
  defaultOptions?: ExportOptions;

  /** Button visual variant */
  variant?: 'default' | 'outline' | 'ghost';

  /** Button size */
  size?: 'sm' | 'default' | 'lg';

  /** Button label text */
  label?: string;

  /** Show the label text (vs icon-only) */
  showLabel?: boolean;

  /** Dropdown menu alignment */
  align?: 'start' | 'center' | 'end';

  /** Disabled state (also auto-disabled when data is empty) */
  disabled?: boolean;

  /** Additional CSS classes */
  className?: string;
}
```

---

## Database Schema

### audit_exports Table (Drizzle ORM)

```typescript
import {
  pgTable, uuid, text, timestamp, integer, jsonb, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { ventures } from './ventures';

export const auditExports = pgTable(
  'audit_exports',
  {
    // ═══════════════════════════════════════════════════════════════════════
    // PRIMARY KEY
    // ═══════════════════════════════════════════════════════════════════════

    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════
    // SCOPE & OWNERSHIP
    // ═══════════════════════════════════════════════════════════════════════

    // User who initiated the export request
    requestedBy: uuid('requested_by')
      .references(() => users.id, { onDelete: 'set null' })
      .notNull(),

    // Venture scope (null = platform-wide export, admin only)
    ventureId: uuid('venture_id')
      .references(() => ventures.id, { onDelete: 'cascade' }),

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    // Output format
    format: text('format', {
      enum: ['csv', 'json', 'pdf', 'xlsx'],
    }).notNull(),

    // Filter criteria (stored as JSONB for flexible querying)
    filters: jsonb('filters').$type<AuditExportFilters>(),

    // ═══════════════════════════════════════════════════════════════════════
    // DATE RANGE
    // ═══════════════════════════════════════════════════════════════════════

    // Inclusive date boundaries for the exported data
    dateFrom: timestamp('date_from', { withTimezone: true }).notNull(),
    dateTo: timestamp('date_to', { withTimezone: true }).notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // STATUS TRACKING
    // ═══════════════════════════════════════════════════════════════════════

    // Job lifecycle status
    status: text('status', {
      enum: ['pending', 'processing', 'completed', 'failed', 'expired'],
    }).notNull().default('pending'),

    // Progress percentage (0–100), updated during processing
    progress: integer('progress').default(0),

    // ═══════════════════════════════════════════════════════════════════════
    // RESULTS
    // ═══════════════════════════════════════════════════════════════════════

    // Total records matching the query
    totalRecords: integer('total_records'),

    // Download URL (S3 signed URL or API endpoint)
    fileUrl: text('file_url'),

    // Output file size for display and quota tracking
    fileSizeBytes: integer('file_size_bytes'),

    // Error details when status = 'failed'
    errorMessage: text('error_message'),

    // ═══════════════════════════════════════════════════════════════════════
    // EXPIRY
    // ═══════════════════════════════════════════════════════════════════════

    // Auto-cleanup timestamp (default: 7 days from creation)
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    // ═══════════════════════════════════════════════════════════════════════
    // TIMESTAMPS
    // ═══════════════════════════════════════════════════════════════════════

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('audit_exports_requested_by_idx').on(table.requestedBy),
    index('audit_exports_venture_idx').on(table.ventureId),
    index('audit_exports_status_idx').on(table.status),
  ]
);

// ═══════════════════════════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const auditExportsRelations = relations(auditExports, ({ one }) => ({
  requestedByUser: one(users, {
    fields: [auditExports.requestedBy],
    references: [users.id],
  }),
  venture: one(ventures, {
    fields: [auditExports.ventureId],
    references: [ventures.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// INFERRED TYPES (auto-generated from schema)
// ═══════════════════════════════════════════════════════════════════════════════

export type AuditExport = typeof auditExports.$inferSelect;
export type NewAuditExport = typeof auditExports.$inferInsert;
```

### export_templates Table

```typescript
export const exportTemplates = pgTable(
  'export_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Venture scope (null = global template available to all ventures)
    ventureId: uuid('venture_id')
      .references(() => ventures.id, { onDelete: 'cascade' }),

    // ═══════════════════════════════════════════════════════════════════════
    // TEMPLATE IDENTITY
    // ═══════════════════════════════════════════════════════════════════════

    name: text('name').notNull(),
    description: text('description'),

    // Entity type this template applies to
    entityType: text('entity_type').notNull(), // 'contacts', 'orders', 'invoices', 'audit_logs', etc.

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT CONFIGURATION (stored as JSONB)
    // ═══════════════════════════════════════════════════════════════════════

    format: text('format').notNull(),          // 'csv', 'xlsx', 'pdf', 'json'
    columns: jsonb('columns').notNull(),       // ExportColumn[]
    filters: jsonb('filters'),                 // Record<string, unknown>
    sort: jsonb('sort'),                       // { field, direction }[]
    styling: jsonb('styling'),                 // ExcelStyling | PdfStyling

    // ═══════════════════════════════════════════════════════════════════════
    // FLAGS
    // ═══════════════════════════════════════════════════════════════════════

    isDefault: boolean('is_default').default(false),

    // ═══════════════════════════════════════════════════════════════════════
    // TRACKING
    // ═══════════════════════════════════════════════════════════════════════

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('export_templates_venture_name_unique').on(table.ventureId, table.name),
    index('export_templates_entity_type_idx').on(table.entityType),
  ]
);
```

### export_schedules Table

```typescript
export const exportSchedules = pgTable(
  'export_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Venture scope (required — schedules are always venture-scoped)
    ventureId: uuid('venture_id')
      .references(() => ventures.id, { onDelete: 'cascade' })
      .notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // SCHEDULE IDENTITY
    // ═══════════════════════════════════════════════════════════════════════

    name: text('name').notNull(),

    // Template to execute on each trigger
    templateId: uuid('template_id')
      .references(() => exportTemplates.id)
      .notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // TIMING CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    frequency: text('frequency', {
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'],
    }).notNull(),

    dayOfWeek: integer('day_of_week'),    // 0-6 for weekly/biweekly
    dayOfMonth: integer('day_of_month'),  // 1-31 for monthly/quarterly
    time: text('time').notNull(),         // HH:MM in venture timezone
    timezone: text('timezone').notNull().default('UTC'),

    // ═══════════════════════════════════════════════════════════════════════
    // DELIVERY
    // ═══════════════════════════════════════════════════════════════════════

    recipients: jsonb('recipients').notNull(),   // string[] of email addresses
    format: text('format').notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════

    enabled: boolean('enabled').default(true),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }),

    // ═══════════════════════════════════════════════════════════════════════
    // TRACKING
    // ═══════════════════════════════════════════════════════════════════════

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('export_schedules_next_run_idx').on(table.nextRunAt),
    index('export_schedules_venture_idx').on(table.ventureId),
  ]
);
```

### SQL Equivalent (for reference)

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- audit_exports — Background export job tracking
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE audit_exports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by    UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  venture_id      UUID REFERENCES ventures(id) ON DELETE CASCADE,
  format          TEXT NOT NULL CHECK (format IN ('csv', 'json', 'pdf', 'xlsx')),
  filters         JSONB,
  date_from       TIMESTAMPTZ NOT NULL,
  date_to         TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  progress        INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  total_records   INTEGER,
  file_url        TEXT,
  file_size_bytes INTEGER,
  error_message   TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX audit_exports_requested_by_idx ON audit_exports(requested_by);
CREATE INDEX audit_exports_venture_idx ON audit_exports(venture_id);
CREATE INDEX audit_exports_status_idx ON audit_exports(status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- export_templates — Reusable export configurations
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE export_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID REFERENCES ventures(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  entity_type     TEXT NOT NULL,
  format          TEXT NOT NULL,
  columns         JSONB NOT NULL,
  filters         JSONB,
  sort            JSONB,
  styling         JSONB,
  is_default      BOOLEAN DEFAULT FALSE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(venture_id, name)
);

CREATE INDEX export_templates_entity_type_idx ON export_templates(entity_type);

-- ═══════════════════════════════════════════════════════════════════════════════
-- export_schedules — Cron-based recurring exports
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE export_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  template_id     UUID NOT NULL REFERENCES export_templates(id),
  frequency       TEXT NOT NULL CHECK (frequency IN ('daily','weekly','biweekly','monthly','quarterly')),
  day_of_week     INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month    INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  time            TEXT NOT NULL,
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  recipients      JSONB NOT NULL,
  format          TEXT NOT NULL,
  enabled         BOOLEAN DEFAULT TRUE,
  last_run_at     TIMESTAMPTZ,
  next_run_at     TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX export_schedules_next_run_idx ON export_schedules(next_run_at) WHERE enabled = TRUE;
CREATE INDEX export_schedules_venture_idx ON export_schedules(venture_id);
```

---

## Code Examples

### Example 1: Simple CSV Export (Server-Side)

```typescript
import { exportToCsv } from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// Export contact list to CSV with typed columns
// ═══════════════════════════════════════════════════════════════════════════════

const result = await exportToCsv({
  data: contacts,
  columns: [
    { key: 'id', header: 'Contact ID' },
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName', header: 'Last Name' },
    { key: 'email', header: 'Email', format: 'email' },
    { key: 'phone', header: 'Phone', format: 'phone' },
    { key: 'createdAt', header: 'Created', format: 'date' },
  ],
  csv: {
    delimiter: ',',
    bom: true,            // UTF-8 BOM for Excel compatibility
    encoding: 'utf-8',
    lineEnding: '\r\n',   // Windows-style for Excel
  },
});

// Send as HTTP download response
res.setHeader('Content-Type', 'text/csv; charset=utf-8');
res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
res.send(result.buffer);

// result = {
//   format: 'csv',
//   filename: 'contacts-2026-02-08.csv',
//   mimeType: 'text/csv',
//   sizeBytes: 245891,
//   totalRows: 5000,
//   exportedRows: 5000,
//   skippedRows: 0,
//   durationMs: 342,
// }
```

### Example 2: Multi-Sheet Excel Export with Styling

```typescript
import { exportToExcel } from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// Generate a styled multi-sheet XLSX workbook
// ═══════════════════════════════════════════════════════════════════════════════

const xlsx = await exportToExcel({
  sheets: [
    {
      name: 'Orders',
      data: orders,
      columns: [
        { key: 'id', header: 'Order #', width: 15 },
        { key: 'customer.name', header: 'Customer', width: 25 },
        { key: 'total', header: 'Total', format: 'currency', align: 'right', width: 12 },
        { key: 'status', header: 'Status', width: 12 },
        { key: 'createdAt', header: 'Date', format: 'datetime', width: 20 },
      ],
    },
    {
      name: 'Summary',
      data: [
        { metric: 'Total Orders', value: orders.length },
        { metric: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}` },
        { metric: 'Average Order', value: `$${avgOrder.toFixed(2)}` },
        { metric: 'Largest Order', value: `$${maxOrder.toFixed(2)}` },
        { metric: 'Date Range', value: `${dateFrom} — ${dateTo}` },
      ],
      columns: [
        { key: 'metric', header: 'Metric', width: 20 },
        { key: 'value', header: 'Value', width: 25 },
      ],
    },
  ],
  excel: {
    headerBold: true,
    headerBackground: '#1a1a2e',
    headerColor: '#ffffff',
    alternateRows: true,
    alternateColor: '#f8f9fa',
    freezeHeader: true,
    autoFilter: true,
    autoWidth: true,
  },
});

// xlsx.buffer contains the XLSX binary
// xlsx.mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
```

### Example 3: Streaming Large Dataset to S3

```typescript
import { createExportStream, pipeToStorage } from '@mcv/shared/export';
import { db, contacts, gt, asc, sql } from '@mcv/db';

// ═══════════════════════════════════════════════════════════════════════════════
// Stream 2 million contacts to S3 with constant ~150 MB memory usage
// ═══════════════════════════════════════════════════════════════════════════════

const stream = createExportStream({
  format: 'csv',
  columns: contactColumns,
  batchSize: 25_000,
  dataProvider: {
    // Cursor-based pagination — never loads full dataset into memory
    async *getData() {
      let cursor: string | undefined;
      while (true) {
        const batch = await db.query.contacts.findMany({
          where: cursor ? gt(contacts.id, cursor) : undefined,
          limit: 25_000,
          orderBy: asc(contacts.id),
        });
        if (batch.length === 0) break;
        yield batch;
        cursor = batch[batch.length - 1].id;
      }
    },

    // Optional total count for progress percentage calculation
    async getTotalCount() {
      const [{ count }] = await db
        .select({ count: sql`count(*)::int` })
        .from(contacts);
      return count;
    },
  },
  onProgress: (p) => {
    // Update job progress in DB for frontend polling
    console.log(
      `${p.percentage?.toFixed(1)}% — ` +
      `${p.processedRows.toLocaleString()} / ${p.totalRows?.toLocaleString()} rows — ` +
      `${(p.bytesWritten / 1024 / 1024).toFixed(1)} MB written — ` +
      `ETA: ${Math.round((p.estimatedRemainingMs ?? 0) / 1000)}s`
    );
  },
});

// Pipe directly to S3 — stream backpressure prevents memory bloat
const { url, sizeBytes } = await pipeToStorage(stream, {
  bucket: 'exports',
  key: `ventures/${ventureId}/contacts-${Date.now()}.csv`,
  expiresIn: 7 * 24 * 60 * 60, // 7-day signed URL
  contentDisposition: `attachment; filename="contacts-export.csv"`,
});

console.log(`Upload complete: ${(sizeBytes / 1024 / 1024).toFixed(1)} MB → ${url}`);
```

### Example 4: PDF Report with Branding

```typescript
import { exportToPdf } from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// Generate a branded PDF invoice report
// ═══════════════════════════════════════════════════════════════════════════════

const pdf = await exportToPdf({
  data: invoices,
  columns: [
    { key: 'number', header: 'Invoice #', width: 80, align: 'left' },
    { key: 'customer.name', header: 'Customer', width: 150 },
    { key: 'issuedAt', header: 'Issue Date', format: 'date', width: 80 },
    { key: 'dueAt', header: 'Due Date', format: 'date', width: 80 },
    { key: 'total', header: 'Amount', format: 'currency', align: 'right', width: 80 },
    { key: 'status', header: 'Status', width: 70 },
  ],
  pdf: {
    pageSize: 'A4',
    orientation: 'landscape',
    title: 'Invoice Report — Q4 2025',
    subtitle: `Generated ${new Date().toLocaleDateString('en-CA')} • ${invoices.length} invoices`,
    logo: venture.logoUrl,
    fontFamily: 'Inter',
    fontSize: 9,
    header: {
      left: venture.name,
      right: '{{date}}',
    },
    footer: {
      center: 'Page {{page}} of {{pages}}',
      right: 'CONFIDENTIAL',
    },
    tableBorders: true,
    tableStriped: true,
    watermark: 'DRAFT',
    margins: { top: 1, right: 0.75, bottom: 1, left: 0.75 },
  },
});

// pdf.buffer = Buffer<...>  (PDF binary)
// pdf.mimeType = 'application/pdf'
// pdf.sizeBytes = 482301
```

### Example 5: Background Export Job with Progress Tracking

```typescript
import {
  createExportJob,
  getExportJob,
  getExportDownloadUrl,
} from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// Create a background export for a large dataset
// ═══════════════════════════════════════════════════════════════════════════════

// Step 1: Create the job (returns immediately)
const job = await createExportJob({
  ventureId: ctx.ventureId,
  requestedBy: ctx.userId,
  format: 'xlsx',
  entityType: 'contacts',
  filters: {
    status: 'active',
    createdAfter: '2025-01-01',
    tags: ['marketing', 'newsletter'],
  },
  columns: contactColumns,
  notifyEmail: ctx.userEmail,   // Email when done
});

console.log(`Job created: ${job.id}, status: ${job.status}`);
// → "Job created: exp_abc123, status: pending"

// Step 2: Poll for progress (or wait for WebSocket / email notification)
const poll = setInterval(async () => {
  const updated = await getExportJob(job.id);
  console.log(`Status: ${updated.status}, Progress: ${updated.progress}%`);

  if (updated.status === 'completed') {
    clearInterval(poll);

    // Step 3: Get signed download URL (valid for 1 hour)
    const url = await getExportDownloadUrl(job.id);
    console.log(`Download: ${url}`);
    console.log(`Size: ${(updated.fileSizeBytes! / 1024 / 1024).toFixed(1)} MB`);
    console.log(`Records: ${updated.totalRecords?.toLocaleString()}`);
  }

  if (updated.status === 'failed') {
    clearInterval(poll);
    console.error(`Export failed: ${updated.errorMessage}`);
  }
}, 2000);
```

### Example 6: Scheduled Recurring Export

```typescript
import { scheduleExport, listSchedules, triggerScheduleNow } from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// Weekly sales report — runs every Monday at 8 AM Eastern
// ═══════════════════════════════════════════════════════════════════════════════

const schedule = await scheduleExport({
  ventureId: ctx.ventureId,
  name: 'Weekly Sales Report',
  templateId: salesReportTemplate.id,
  frequency: 'weekly',
  dayOfWeek: 1,                              // Monday
  time: '08:00',
  timezone: 'America/Toronto',
  format: 'xlsx',
  recipients: ['sales@acme.com', 'cfo@acme.com'],
});

console.log(`Schedule created: ${schedule.id}`);
console.log(`Next run: ${schedule.nextRunAt?.toISOString()}`);
// → "Next run: 2026-02-10T13:00:00.000Z" (Monday 8 AM ET = 1 PM UTC)

// List all active schedules for a venture
const schedules = await listSchedules(ctx.ventureId);
for (const s of schedules) {
  console.log(`${s.name} — ${s.frequency} — next: ${s.nextRunAt} — ${s.enabled ? 'active' : 'paused'}`);
}

// Manually trigger a scheduled export (useful for testing)
await triggerScheduleNow(schedule.id);
```

### Example 7: Export Templates — Define, Clone, Apply

```typescript
import {
  defineExportTemplate,
  cloneTemplate,
  applyTemplate,
} from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// Define a reusable export template
// ═══════════════════════════════════════════════════════════════════════════════

const template = await defineExportTemplate({
  ventureId: ctx.ventureId,
  name: 'Contact Export — Marketing',
  description: 'Active contacts with marketing tags, sorted by last activity',
  entityType: 'contacts',
  format: 'csv',
  columns: [
    { key: 'email', header: 'Email', format: 'email' },
    { key: 'firstName', header: 'First Name' },
    { key: 'lastName', header: 'Last Name' },
    { key: 'tags', header: 'Tags', transform: (v) => (v as string[]).join('; ') },
    { key: 'lastActivityAt', header: 'Last Active', format: 'date' },
    { key: 'source', header: 'Source' },
  ],
  filters: {
    status: 'active',
    tags: { contains: 'marketing' },
  },
  sort: [{ field: 'lastActivityAt', direction: 'desc' }],
});

// Clone and customize for a different team
const salesTemplate = await cloneTemplate(template.id, {
  name: 'Contact Export — Sales',
  description: 'Active contacts with sales-related tags',
  filters: {
    status: 'active',
    tags: { contains: 'sales' },
  },
});

// Execute template with additional runtime filters
const result = await applyTemplate(template.id, {
  additionalFilters: {
    createdAfter: '2025-06-01',
    region: 'NA',
  },
  limit: 50_000,
  format: 'xlsx',   // Override template's default CSV format
});
```

### Example 8: Custom Column Transforms

```typescript
import { exportToCsv } from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// Computed columns, nested accessors, and cross-column calculations
// ═══════════════════════════════════════════════════════════════════════════════

const result = await exportToCsv({
  data: deals,
  columns: [
    { key: 'name', header: 'Deal Name' },

    // Transform: cents → dollars
    {
      key: 'value',
      header: 'Deal Value',
      format: 'currency',
      transform: (v) => ((v as number) / 100).toFixed(2),
    },

    // Format: percentage with symbol
    {
      key: 'probability',
      header: 'Close Probability',
      format: 'percentage',
    },

    // Computed column: cross-field calculation
    {
      key: 'expectedRevenue',
      header: 'Expected Revenue',
      transform: (_, row) => {
        const value = (row.value as number) / 100;
        const prob = (row.probability as number) / 100;
        return `$${(value * prob).toFixed(2)}`;
      },
    },

    // Nested object flattening
    {
      key: 'assignee',
      header: 'Assigned To',
      transform: (v) => {
        const user = v as { firstName: string; lastName: string };
        return `${user.firstName} ${user.lastName}`;
      },
    },

    // Array → delimited string
    {
      key: 'tags',
      header: 'Tags',
      transform: (v) => (v as string[]).join(', '),
    },

    // Boolean → human-readable
    {
      key: 'isHighPriority',
      header: 'Priority',
      transform: (v) => (v ? 'High' : 'Normal'),
    },

    // Date → relative display
    {
      key: 'expectedCloseDate',
      header: 'Days Until Close',
      transform: (v) => {
        const days = Math.ceil(
          ((v as Date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return days > 0 ? `${days} days` : 'Overdue';
      },
    },
  ],
});
```

### Example 9: Auto-Generate Columns from Drizzle Schema

```typescript
import { columnsFromSchema, exportToCsv } from '@mcv/shared/export';
import { contacts } from '@mcv/db';

// ═══════════════════════════════════════════════════════════════════════════════
// Derive export columns directly from DB schema — zero manual mapping
// ═══════════════════════════════════════════════════════════════════════════════

const columns = columnsFromSchema(contacts, {
  // Exclude internal/system fields
  exclude: ['deletedAt', 'metadata', 'searchVector', 'updatedAt'],

  // Override auto-generated headers and formats
  overrides: {
    email: { header: 'Email Address', format: 'email' },
    createdAt: { header: 'Signup Date', format: 'date' },
    phone: { header: 'Phone Number', format: 'phone' },
    id: { header: 'Contact ID', sortOrder: 0 },   // Force to first column
  },

  // Column name → header transformation (default: camelCase → Title Case)
  headerTransform: 'titleCase',
});

// Auto-generated columns:
// [
//   { key: 'id', header: 'Contact ID', format: 'string', sortOrder: 0 },
//   { key: 'firstName', header: 'First Name', format: 'string' },
//   { key: 'lastName', header: 'Last Name', format: 'string' },
//   { key: 'email', header: 'Email Address', format: 'email' },
//   { key: 'phone', header: 'Phone Number', format: 'phone' },
//   { key: 'createdAt', header: 'Signup Date', format: 'date' },
//   ...
// ]

const result = await exportToCsv({ data: allContacts, columns });
```

### Example 10: Audit Log Export (Compliance)

```typescript
import { createExportRequest, processExport, getExportContent } from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// SOC 2 / GDPR compliance audit log export
// The export itself is recorded as an audit event
// ═══════════════════════════════════════════════════════════════════════════════

// Step 1: Create export request
const exportRecord = await createExportRequest(
  ctx.userId,                    // requestedBy
  ctx.ventureId,                 // ventureId
  'csv',                         // format
  new Date('2025-01-01'),        // dateFrom
  new Date('2025-12-31'),        // dateTo
  {
    categories: ['auth', 'data_access', 'admin'],
    resultFilter: 'all',
    sensitiveOnly: false,
  }
);

// Step 2: Process the export (runs synchronously or in background worker)
await processExport(exportRecord.id);

// Step 3: Download the result
const content = await getExportContent(exportRecord.id, ctx.userId);
if (content) {
  console.log(`File: ${content.filename}`);
  console.log(`Type: ${content.mimeType}`);
  console.log(`Size: ${content.content.length} chars`);
}

// The CSV includes these columns (auto-generated from audit log schema):
// ID, Timestamp, Event Type, Category, Action, Result,
// Actor ID, Actor Email, Actor Name,
// Resource Type, Resource ID, Resource Name,
// IP Address, User Agent, Duration (ms),
// Sensitive, Error Code, Error Message
```

### Example 11: React ExportMenu Component

```tsx
import { ExportMenu } from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// Drop-in export dropdown for any data table
// ═══════════════════════════════════════════════════════════════════════════════

function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const columns = [
    { id: 'email', header: 'Email' },
    { id: 'name', header: 'Name', accessor: (r: Contact) => `${r.firstName} ${r.lastName}` },
    { id: 'status', header: 'Status' },
    { id: 'createdAt', header: 'Created', accessor: (r: Contact) => r.createdAt.toLocaleDateString() },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Contacts ({contacts.length})</h2>
        <ExportMenu
          data={contacts}
          columns={columns}
          formats={['csv', 'json', 'clipboard']}
          defaultOptions={{ filename: 'contacts' }}
          variant="outline"
          size="sm"
        />
      </div>

      <DataTable data={contacts} columns={columns} />
    </div>
  );
}
```

### Example 12: React Audit Export Modal

```tsx
import { AuditExportModal } from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// Full export modal with format selection, date range, and progress tracking
// ═══════════════════════════════════════════════════════════════════════════════

function AuditLogPage() {
  const [exportOpen, setExportOpen] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({
    categories: ['auth'],
    resultFilter: 'failure',
  });

  return (
    <div>
      <Button onPress={() => setExportOpen(true)}>
        <Download className="h-4 w-4 mr-2" />
        Export Audit Logs
      </Button>

      <AuditExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        filters={filters}
      />
      {/*
        Modal flow:
        1. User selects format (CSV / JSON)
        2. User picks date range (default: last 30 days)
        3. Active filters are applied automatically
        4. Click "Export" → createExportRequest + processExport
        5. Progress bar shows 0% → 100%
        6. "Download" button appears on completion
        7. Shows record count and file size chips
        8. Error state with message on failure
      */}
    </div>
  );
}
```

### Example 13: useExport Hook for Custom UI

```tsx
import { useExport, useExportJob } from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// Custom export UI with the useExport hook
// ═══════════════════════════════════════════════════════════════════════════════

function CustomExportPanel({ entityType, filters }: Props) {
  const { exportData, loading, progress, error } = useExport();
  const [jobId, setJobId] = useState<string | null>(null);
  const { data: jobStatus } = useExportJob(jobId);

  const handleExport = async (format: ExportFormat) => {
    const result = await exportData({
      format,
      entityType,
      filters,
    });

    if (result.jobId) {
      // Large dataset — background job created
      setJobId(result.jobId);
    } else {
      // Small dataset — downloaded immediately
      console.log(`Downloaded: ${result.filename}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => handleExport('csv')} disabled={loading}>CSV</Button>
        <Button onClick={() => handleExport('xlsx')} disabled={loading}>Excel</Button>
        <Button onClick={() => handleExport('pdf')} disabled={loading}>PDF</Button>
      </div>

      {loading && (
        <Progress value={progress} label={`Exporting... ${progress}%`} />
      )}

      {jobStatus?.status === 'completed' && (
        <Alert variant="success">
          Export complete! {jobStatus.totalRecords?.toLocaleString()} records
          ({(jobStatus.fileSizeBytes! / 1024).toFixed(0)} KB)
          <Button onClick={() => window.open(jobStatus.fileUrl!)}>Download</Button>
        </Alert>
      )}

      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
```

### Example 14: Compressed Multi-File Export

```typescript
import { exportToFormat } from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// Export multiple entity types as a single ZIP archive
// ═══════════════════════════════════════════════════════════════════════════════

const result = await exportToFormat({
  format: 'xlsx',
  compress: true,                     // Output as ZIP containing XLSX
  filename: 'venture-data-export',
  sheets: [
    { name: 'Contacts', data: contacts, columns: contactColumns },
    { name: 'Orders', data: orders, columns: orderColumns },
    { name: 'Invoices', data: invoices, columns: invoiceColumns },
    { name: 'Payments', data: payments, columns: paymentColumns },
  ],
  excel: {
    headerBold: true,
    freezeHeader: true,
    autoFilter: true,
  },
});

// result.mimeType = 'application/zip'
// result.filename = 'venture-data-export.zip'
// result.sizeBytes = 8_234_521
```

### Example 15: PII-Aware Export with Role-Based Redaction

```typescript
import { exportToCsv } from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// Sensitive columns are automatically redacted based on user role
// ═══════════════════════════════════════════════════════════════════════════════

const result = await exportToCsv({
  data: customers,
  columns: [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email', format: 'email' },

    // SSN: only admins see the full value
    {
      key: 'ssn',
      header: 'SSN',
      piiLevel: 'high',
      redactFor: ['viewer', 'editor'],         // Redacted for these roles
      redactWith: '***-**-{{last4}}',           // Shows: ***-**-1234
    },

    // Phone: partially redacted for non-managers
    {
      key: 'phone',
      header: 'Phone',
      piiLevel: 'medium',
      redactFor: ['viewer'],
      redactWith: '(***) ***-{{last4}}',        // Shows: (***) ***-5678
    },

    // Payment info: fully redacted
    {
      key: 'creditCardLast4',
      header: 'Card (Last 4)',
      piiLevel: 'high',
      redactFor: ['viewer', 'editor', 'manager'],
      redactWith: '••••',
    },
  ],
  // userRole is injected from the auth context
  // The export engine checks each column's redactFor array against the user's role
});
```

---

## Server-Side Implementation Details

### Export Processing Pipeline

The `processExport()` function implements the core server-side pipeline:

```typescript
// Simplified flow from packages/audit/src/server/services/export-service.ts

export async function processExport(exportId: string): Promise<void> {
  // 1. Fetch the export request record from DB
  const exportRecord = await db.select().from(auditExports).where(eq(auditExports.id, exportId));

  // 2. Update status: pending → processing (progress: 10%)
  await db.update(auditExports).set({ status: 'processing', progress: 10 });

  try {
    // 3. Build dynamic query conditions from filters
    const conditions = [
      gte(auditLogs.timestamp, exportRecord.dateFrom),
      lte(auditLogs.timestamp, exportRecord.dateTo),
    ];

    // Apply optional filters (categories, actions, actors, resource types, etc.)
    if (filters?.categories?.length)    conditions.push(inArray(auditLogs.category, filters.categories));
    if (filters?.actions?.length)       conditions.push(inArray(auditLogs.action, filters.actions));
    if (filters?.actorIds?.length)      conditions.push(inArray(auditLogs.actorId, filters.actorIds));
    if (filters?.resourceTypes?.length) conditions.push(inArray(auditLogs.resourceType, filters.resourceTypes));
    if (filters?.resultFilter === 'success') conditions.push(eq(auditLogs.result, 'success'));
    if (filters?.resultFilter === 'failure') conditions.push(eq(auditLogs.result, 'failure'));
    if (filters?.sensitiveOnly)         conditions.push(eq(auditLogs.isSensitive, true));

    // 4. Fetch data (progress: 30%)
    const logs = await db.select().from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.timestamp));

    // 5. Update total count (progress: 60%)
    await db.update(auditExports).set({ progress: 60, totalRecords: logs.length });

    // 6. Render to format
    let fileContent: string;
    switch (exportRecord.format) {
      case 'csv':  fileContent = generateCsv(logs); break;   // via papaparse
      case 'json': fileContent = generateJson(logs); break;  // via JSON.stringify
      default: throw new Error(`Unsupported format: ${exportRecord.format}`);
    }

    // 7. Generate download URL (progress: 80%)
    const fileUrl = `/api/audit/exports/${exportId}/download`;

    // 8. Mark completed (progress: 100%)
    await db.update(auditExports).set({
      status: 'completed',
      progress: 100,
      fileUrl,
      fileSizeBytes: Buffer.byteLength(fileContent, 'utf8'),
      completedAt: new Date(),
    });
  } catch (error) {
    // Mark failed with error message
    await db.update(auditExports).set({
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
```

### CSV Generation (via papaparse)

```typescript
// CSV rendering with category/action label resolution

function generateCsv(logs: AuditLog[]): string {
  const data = logs.map((log) => ({
    'ID':              log.id,
    'Timestamp':       log.timestamp.toISOString(),
    'Event Type':      log.eventType,
    'Category':        AUDIT_CATEGORIES[log.category]?.label ?? log.category,
    'Action':          AUDIT_ACTIONS[log.action]?.label ?? log.action,
    'Result':          log.result,
    'Actor ID':        log.actorId ?? '',
    'Actor Email':     log.actorEmail ?? '',
    'Actor Name':      log.actorDisplayName ?? '',
    'Resource Type':   log.resourceType ?? '',
    'Resource ID':     log.resourceId ?? '',
    'Resource Name':   log.resourceName ?? '',
    'IP Address':      log.ipAddress ?? '',
    'User Agent':      log.userAgent ?? '',
    'Duration (ms)':   log.durationMs ?? '',
    'Sensitive':       log.isSensitive ? 'Yes' : 'No',
    'Error Code':      log.errorCode ?? '',
    'Error Message':   log.errorMessage ?? '',
  }));

  return Papa.unparse(data);  // Uses papaparse for proper escaping
}
```

### Client-Side CSV Conversion

```typescript
// Browser-side CSV conversion with proper escaping (from @mcv/ui ExportMenu)

function convertToCSV(
  data: Record<string, any>[],
  columns?: ColumnDef[],
  includeHeaders = true
): string {
  if (data.length === 0) return '';

  const cols = columns || Object.keys(data[0]!).map((key) => ({ id: key, header: key }));
  const rows: string[][] = [];

  if (includeHeaders) {
    rows.push(cols.map((col) => col.header));
  }

  data.forEach((row) => {
    const values = cols.map((col) => {
      const value = col.accessor ? col.accessor(row) : row[col.id];
      const stringValue = String(value ?? '');

      // Escape: wrap in quotes if contains comma, newline, or quote
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    rows.push(values);
  });

  return rows.map((row) => row.join(',')).join('\n');
}
```

---

## Performance Considerations

### Memory Management Strategy

| Export Size | Strategy | Memory Usage | Latency |
|-------------|----------|-------------|---------|
| < 10,000 rows | Synchronous (in-memory) | ~50–200 MB | < 1s |
| 10K – 100K rows | Auto-batched streaming | ~100 MB constant | 5–30s |
| 100K – 1M rows | Background job + streaming | ~150 MB constant | 1–5 min |
| 1M – 5M rows | Background job + cursor paging | ~150 MB constant | 5–20 min |
| > 5M rows | **Rejected** (MAX_EXPORT_ROWS) | N/A | N/A |

### Streaming Pipeline Backpressure

The export stream respects Node.js stream backpressure semantics. If the output destination (S3 upload, HTTP response) is slower than data generation, the pipeline automatically pauses the data provider's async generator:

```
DataProvider.getData() → Transform → Format Render → Output
      ↑                                                │
      └──── pause signal (highWaterMark reached) ──────┘
```

This means a 2M-row export consumes the same ~150 MB regardless of whether the output is a fast local disk or a slow network upload.

### Format-Specific Recommendations

| Format | Max Practical Size | Streamable? | Batch Size | Notes |
|--------|-------------------|-------------|------------|-------|
| **CSV** | 5M rows | ✅ Yes | 25,000 | Most efficient — streamable, minimal overhead |
| **JSONL** | 5M rows | ✅ Yes | 25,000 | Line-delimited — fully streamable |
| **JSON** | 500K rows | ⚠️ Partial | 25,000 | Needs array wrapping — stream + buffer end |
| **XLSX** | 1M rows/sheet | ❌ No | 10,000 | Must buffer entire workbook in memory |
| **PDF** | 50K rows | ❌ No | 5,000 | Layout calculation + render overhead |

### Excel Hard Limits

- **1,048,576** rows per sheet (Excel specification limit)
- Datasets exceeding this are auto-split across multiple sheets (`Sheet1`, `Sheet2`, etc.)
- Excel files are **not streamable** — the entire workbook must be in memory during generation
- For datasets > 100K rows, **CSV is strongly recommended** over XLSX
- Memory limit enforced by `EXCEL_MAX_MEMORY_MB` (default: 512 MB)

### Latency Targets

| Operation | Target | P99 |
|-----------|--------|-----|
| Sync CSV export (1K rows) | < 100ms | < 500ms |
| Sync CSV export (10K rows) | < 500ms | < 2s |
| Background job creation | < 50ms | < 200ms |
| Job status query | < 10ms | < 50ms |
| Signed URL generation | < 100ms | < 500ms |
| Template resolution | < 5ms | < 20ms |

---

## Security Considerations

### Access Control

All exports flow through the RBAC permission system before any data is fetched:

```
Export Request → Check user permissions:
  1. export:read          — Can the user export at all?
  2. export:{entityType}  — Can they export this entity type?
  3. export:sensitive      — Can they export sensitive/PII fields?
  4. venture:{ventureId}  — Do they have access to this venture's data?
  5. Column-level check   — Redact PII columns based on role
```

- All exports query with the user's permission context — **users can only export data they can already view**
- Columns with `piiLevel: 'high'` require explicit `export:sensitive` permission
- Export of sensitive fields triggers an additional audit event (`export.sensitive_fields`)

### CSV Injection Prevention

CSV files opened in Excel can execute formulas. The export engine automatically sanitizes dangerous payloads:

```typescript
// AUTOMATIC — applied to all CSV output

// Input:  =CMD('calc')
// Output: '=CMD('calc')     ← Prefixed with single quote, harmless

// Input:  +HYPERLINK("http://evil.com")
// Output: '+HYPERLINK("http://evil.com")

// Characters that trigger sanitization: = + - @ | %
// The leading quote is invisible in Excel but prevents formula execution
```

### Data Leak Prevention (DLP)

| Protection | Trigger | Action |
|-----------|---------|--------|
| Large export alert | Export > 50K rows | Notify admin via email |
| Sensitive field alert | Export includes PII columns | Audit event + admin notification |
| File encryption | All S3-stored exports | AES-256 encryption at rest |
| Signed URL expiry | Download URL generated | 1-hour expiry, single-use optional |
| File auto-deletion | Export file age > TTL | Cron job deletes after 7 days |
| Ownership verification | Download request | Verify requesting user === requestedBy |

### Input Sanitization

- **SQL injection**: All filters are parameterized through Drizzle ORM — no raw SQL interpolation
- **XSS prevention**: HTML stripped from all text content in PDF exports
- **Path traversal**: Filenames are sanitized — `../`, `\`, and control characters are stripped
- **Size limits**: `MAX_EXPORT_ROWS` (5M) and `EXCEL_MAX_MEMORY_MB` (512) prevent resource exhaustion

---

## Audit Events

Every export operation generates audit trail events for compliance monitoring:

| Event | Category | Description | Payload |
|-------|----------|-------------|---------|
| `export.started` | data_export | Export job initiated | `{ format, entityType, rowEstimate, userId, ventureId }` |
| `export.completed` | data_export | Export finished successfully | `{ jobId, format, totalRows, sizeBytes, durationMs }` |
| `export.failed` | data_export | Export processing failed | `{ jobId, error, processedRows, stackTrace }` |
| `export.downloaded` | data_export | Export file downloaded by user | `{ jobId, userId, ipAddress, userAgent }` |
| `export.expired` | data_export | Export file auto-deleted (TTL) | `{ jobId, fileUrl, age }` |
| `export.cancelled` | data_export | Export cancelled by user/admin | `{ jobId, cancelledBy, reason }` |
| `export.scheduled.created` | scheduling | Recurring export schedule created | `{ scheduleId, frequency, recipients, templateId }` |
| `export.scheduled.updated` | scheduling | Schedule configuration changed | `{ scheduleId, changes }` |
| `export.scheduled.triggered` | scheduling | Scheduled export executed | `{ scheduleId, jobId, triggerType }` |
| `export.scheduled.paused` | scheduling | Schedule paused | `{ scheduleId, pausedBy }` |
| `export.template.created` | configuration | Export template created | `{ templateId, entityType, ventureId }` |
| `export.template.updated` | configuration | Template modified | `{ templateId, changes }` |
| `export.template.deleted` | configuration | Template removed | `{ templateId, deletedBy }` |
| `export.large_dataset` | dlp | Export exceeds DLP threshold | `{ userId, entityType, rowCount, threshold }` |
| `export.sensitive_fields` | dlp | Export includes PII columns | `{ userId, columns, entityType, piiLevels }` |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPORT_STORAGE_BUCKET` | `exports` | S3/R2 bucket name for export file storage |
| `EXPORT_STORAGE_REGION` | `us-east-1` | S3/R2 storage region |
| `EXPORT_STORAGE_ENDPOINT` | — | Custom S3-compatible endpoint (for R2, MinIO) |
| `EXPORT_FILE_TTL_DAYS` | `7` | Days before export files are auto-deleted |
| `EXPORT_DOWNLOAD_URL_TTL_SEC` | `3600` | Signed download URL expiry (seconds) |
| `EXPORT_MAX_SYNC_ROWS` | `10000` | Max rows for synchronous (in-request) export |
| `EXPORT_MAX_TOTAL_ROWS` | `5000000` | Absolute maximum rows per export |
| `EXPORT_BATCH_SIZE` | `10000` | Default streaming batch size (rows per chunk) |
| `EXPORT_WORKER_CONCURRENCY` | `3` | Max concurrent background export workers |
| `EXPORT_LARGE_DATASET_THRESHOLD` | `50000` | Row count that triggers DLP alert |
| `EXPORT_NOTIFICATION_EMAIL` | — | Admin email for large export DLP alerts |
| `PDF_RENDERER` | `puppeteer` | PDF rendering engine (`puppeteer` or `playwright`) |
| `EXCEL_MAX_MEMORY_MB` | `512` | Max memory allocation for Excel generation |
| `EXPORT_ENABLE_SCHEDULING` | `true` | Enable/disable scheduled export feature |
| `EXPORT_SCHEDULE_CRON` | `*/5 * * * *` | How often to check for due scheduled exports |
| `EXPORT_CLEANUP_CRON` | `0 3 * * *` | Cron schedule for expired file cleanup (3 AM) |

---

## Error Codes

| Code | HTTP | Message | Resolution |
|------|------|---------|------------|
| `EXPORT_FORMAT_UNSUPPORTED` | 400 | Unsupported export format | Use: `csv`, `xlsx`, `pdf`, `json`, or `jsonl` |
| `EXPORT_TOO_MANY_ROWS` | 400 | Export exceeds maximum row limit (5M) | Add filters or reduce date range |
| `EXPORT_COLUMN_NOT_FOUND` | 400 | Column key not found in data schema | Verify column `key` matches data field names |
| `EXPORT_INVALID_DATE_RANGE` | 400 | dateFrom must be before dateTo | Swap the date range boundaries |
| `EXPORT_TEMPLATE_NOT_FOUND` | 404 | Export template not found | Verify template ID exists for this venture |
| `EXPORT_JOB_NOT_FOUND` | 404 | Export job not found | Verify job ID; may have expired |
| `EXPORT_JOB_EXPIRED` | 410 | Export file has expired and been deleted | Re-run the export to generate a new file |
| `EXPORT_JOB_CANCELLED` | 409 | Export was cancelled | Create a new export job |
| `EXPORT_PERMISSION_DENIED` | 403 | User lacks export permission | Check RBAC: requires `export:read` permission |
| `EXPORT_SENSITIVE_DENIED` | 403 | Cannot export sensitive/PII fields | Requires `export:sensitive` permission |
| `EXPORT_VENTURE_DENIED` | 403 | User lacks access to this venture | Verify venture membership |
| `EXPORT_STORAGE_ERROR` | 500 | Failed to upload export file to storage | Check S3/R2 bucket config and credentials |
| `EXPORT_SCHEDULE_CONFLICT` | 409 | Schedule name already exists for venture | Use a unique schedule name |
| `EXPORT_EXCEL_TOO_LARGE` | 413 | Excel file exceeds memory limit | Use CSV for large datasets; increase `EXCEL_MAX_MEMORY_MB` |
| `EXPORT_PDF_RENDER_ERROR` | 500 | PDF rendering failed | Check PDF template syntax and data format |
| `EXPORT_CSV_ENCODING_ERROR` | 400 | Invalid encoding specified | Use: `utf-8`, `utf-16le`, `ascii`, or `latin1` |
| `EXPORT_PROCESSING_ERROR` | 500 | Unexpected error during export processing | Check logs; may be transient — retry the export |
| `DATABASE_NOT_INITIALIZED` | 503 | Database connection not available | Ensure DB is initialized before calling export services |

---

## Dependencies

### Internal Dependencies

| Package | Usage | Required? |
|---------|-------|-----------|
| `@mcv/db` | Schema types (`auditExports`, `auditLogs`), Drizzle query builder, relations | ✅ Required |
| `@mcv/storage` | S3/R2 file upload, signed URL generation, file deletion | ✅ Required |
| `@mcv/audit` | Logging export audit events (`export.started`, `export.completed`, etc.) | ✅ Required |
| `@mcv/permissions` | RBAC check for `export:read`, `export:sensitive`, venture access | ✅ Required |
| `@mcv/email` | Sending download links for completed background/scheduled exports | ⚠️ Optional |
| `@mcv/shared/calculations` | Currency/number/percentage formatting in exported values | ⚠️ Optional |
| `@mcv/shared/templates` | PDF template rendering (header/footer/watermark) | ⚠️ Optional |
| `@mcv/ui` | `ExportMenu` component (also standalone in `@mcv/ui/table`) | ⚠️ UI only |

### External Dependencies

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| `papaparse` | `^5.4` | CSV generation and parsing (server-side, used in export-service) | 24 KB |
| `exceljs` | `^4.4` | XLSX workbook generation with styling, formulas, and multi-sheet | 180 KB |
| `csv-stringify` | `^6.4` | Streaming CSV generation (Node.js Writable stream) | 12 KB |
| `puppeteer-core` | `^22.0` | PDF rendering from HTML templates | Server only |
| `archiver` | `^6.0` | ZIP compression for multi-file exports | 45 KB |
| `zod` | `^3.22` | Input validation for export options, filters, templates | 14 KB |
| `@radix-ui/react-dropdown-menu` | `^2.0` | ExportMenu dropdown primitive (client-side) | 8 KB |
| `framer-motion` | `^11.0` | ExportMenu animation (client-side) | Tree-shaken |
| `lucide-react` | `^0.400` | Export format icons (Download, FileSpreadsheet, etc.) | Tree-shaken |
| `date-fns` | `^3.0` | Date calculations for scheduling and default date ranges | Tree-shaken |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | `^18.0 \|\| ^19.0` | Client hooks and components (optional — server-side works without React) |
| `@heroui/react` | `^2.0` | AuditExportModal UI primitives (Modal, Button, Input, Progress, Chip) |

---

## Testing Notes

### Unit Tests

```typescript
import { convertToCSV, convertToJSON } from '@mcv/shared/export';

// ═══════════════════════════════════════════════════════════════════════════════
// CSV conversion
// ═══════════════════════════════════════════════════════════════════════════════

describe('convertToCSV', () => {
  it('should convert data with headers', () => {
    const data = [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
    ];
    const csv = convertToCSV(data);
    expect(csv).toBe('name,email\nAlice,alice@example.com\nBob,bob@example.com');
  });

  it('should escape fields with commas', () => {
    const data = [{ name: 'Doe, John', city: 'Toronto' }];
    const csv = convertToCSV(data);
    expect(csv).toContain('"Doe, John"');
  });

  it('should escape fields with quotes', () => {
    const data = [{ name: 'Say "hello"', city: 'NYC' }];
    const csv = convertToCSV(data);
    expect(csv).toContain('"Say ""hello"""');
  });

  it('should handle empty data', () => {
    expect(convertToCSV([])).toBe('');
  });

  it('should use custom columns with accessors', () => {
    const data = [{ firstName: 'Alice', lastName: 'Smith' }];
    const columns = [{
      id: 'fullName',
      header: 'Full Name',
      accessor: (r: any) => `${r.firstName} ${r.lastName}`,
    }];
    const csv = convertToCSV(data, columns);
    expect(csv).toBe('Full Name\nAlice Smith');
  });

  it('should prevent CSV injection', () => {
    const data = [{ formula: '=CMD("calc")' }];
    const csv = convertToCSV(data);
    // Should be sanitized — no raw formula execution
    expect(csv).not.toMatch(/^=CMD/m);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Export job lifecycle
// ═══════════════════════════════════════════════════════════════════════════════

describe('createExportRequest', () => {
  it('should create a pending export job', async () => {
    const job = await createExportRequest(
      'user-123',
      'venture-456',
      'csv',
      new Date('2025-01-01'),
      new Date('2025-12-31')
    );

    expect(job.status).toBe('pending');
    expect(job.progress).toBe(0);
    expect(job.format).toBe('csv');
    expect(job.expiresAt).toBeDefined();
    expect(job.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
  });

  it('should throw when DB is not initialized', async () => {
    // Mock db = null
    await expect(
      createExportRequest('user', null, 'csv', new Date(), new Date())
    ).rejects.toThrow('Database not initialized');
  });
});

describe('processExport', () => {
  it('should process CSV export to completion', async () => {
    const job = await createExportRequest('user-123', 'venture-456', 'csv', dateFrom, dateTo);
    await processExport(job.id);

    const updated = await getExportStatus(job.id);
    expect(updated?.status).toBe('completed');
    expect(updated?.progress).toBe(100);
    expect(updated?.totalRecords).toBeGreaterThan(0);
    expect(updated?.fileSizeBytes).toBeGreaterThan(0);
    expect(updated?.completedAt).toBeDefined();
  });

  it('should mark export as failed on error', async () => {
    const job = await createExportRequest('user-123', 'venture-456', 'xlsx', dateFrom, dateTo);
    // XLSX not yet implemented in processExport → will fail
    await expect(processExport(job.id)).rejects.toThrow('Unsupported format');

    const updated = await getExportStatus(job.id);
    expect(updated?.status).toBe('failed');
    expect(updated?.errorMessage).toContain('Unsupported format');
  });
});
```

### Integration Tests

```typescript
describe('Export E2E', () => {
  it('should create, process, and download a CSV export', async () => {
    // 1. Create export request
    const job = await createExportRequest(
      testUserId,
      testVentureId,
      'csv',
      subDays(new Date(), 30),
      new Date(),
      { categories: ['auth'] }
    );
    expect(job.status).toBe('pending');

    // 2. Process the export
    await processExport(job.id);
    const processed = await getExportStatus(job.id);
    expect(processed?.status).toBe('completed');

    // 3. Download the content
    const content = await getExportContent(job.id, testUserId);
    expect(content).not.toBeNull();
    expect(content!.mimeType).toBe('text/csv');
    expect(content!.filename).toContain('audit-export');

    // 4. Verify CSV structure
    const lines = content!.content.split('\n');
    expect(lines[0]).toContain('ID');
    expect(lines[0]).toContain('Timestamp');
    expect(lines[0]).toContain('Category');
    expect(lines.length).toBeGreaterThan(1); // Header + at least 1 data row
  });

  it('should enforce ownership on download', async () => {
    const job = await createExportRequest(testUserId, testVentureId, 'csv', dateFrom, dateTo);
    await processExport(job.id);

    // Different user should not be able to download
    const content = await getExportContent(job.id, 'different-user-id');
    expect(content).toBeNull();
  });

  it('should list exports for user', async () => {
    await createExportRequest(testUserId, testVentureId, 'csv', dateFrom, dateTo);
    await createExportRequest(testUserId, testVentureId, 'json', dateFrom, dateTo);

    const exports = await listUserExports(testUserId, testVentureId);
    expect(exports.length).toBeGreaterThanOrEqual(2);
    expect(exports[0]!.createdAt.getTime()).toBeGreaterThanOrEqual(exports[1]!.createdAt.getTime());
  });
});
```

### Component Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportMenu } from '@mcv/shared/export';

describe('ExportMenu', () => {
  const mockData = [
    { name: 'Alice', email: 'alice@test.com' },
    { name: 'Bob', email: 'bob@test.com' },
  ];

  it('should render export button', () => {
    render(<ExportMenu data={mockData} />);
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should be disabled when data is empty', () => {
    render(<ExportMenu data={[]} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show row count in menu header', async () => {
    render(<ExportMenu data={mockData} />);
    fireEvent.click(screen.getByText('Export'));
    expect(screen.getByText('Export 2 rows')).toBeInTheDocument();
  });

  it('should call onExport handler with format', async () => {
    const onExport = vi.fn();
    render(<ExportMenu data={mockData} onExport={onExport} formats={['csv']} />);
    fireEvent.click(screen.getByText('Export'));
    fireEvent.click(screen.getByText('Export as CSV'));
    expect(onExport).toHaveBeenCalledWith('csv', expect.any(Object));
  });
});
```

---

## Migration Guide

### From Direct CSV Generation

If you're currently using `Papa.unparse()` or manual CSV string building:

```typescript
// ❌ Before: manual CSV
import Papa from 'papaparse';
const csv = Papa.unparse(data);
res.setHeader('Content-Type', 'text/csv');
res.send(csv);

// ✅ After: unified export pipeline
import { exportToCsv } from '@mcv/shared/export';
const result = await exportToCsv({
  data,
  columns: columnDefs,
  csv: { bom: true },
});
// result includes: buffer, filename, mimeType, sizeBytes, totalRows, durationMs
res.setHeader('Content-Type', result.mimeType);
res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
res.send(result.buffer);
```

### From Ad-Hoc Export Buttons

```tsx
// ❌ Before: custom export button in every page
<button onClick={() => {
  const csv = data.map(r => `${r.name},${r.email}`).join('\n');
  downloadBlob(csv, 'export.csv');
}}>Download CSV</button>

// ✅ After: reusable ExportMenu component
<ExportMenu
  data={data}
  columns={[{ id: 'name', header: 'Name' }, { id: 'email', header: 'Email' }]}
  formats={['csv', 'json', 'clipboard']}
/>
```

---

## Roadmap

| Phase | Feature | Target | Status |
|-------|---------|--------|--------|
| **Phase 1** | CSV + JSON export, background jobs, audit log export | Q1 2026 | ✅ Complete |
| **Phase 1** | ExportMenu UI component, AuditExportModal | Q1 2026 | ✅ Complete |
| **Phase 2** | XLSX multi-sheet with ExcelJS styling | Q2 2026 | 🔄 In Progress |
| **Phase 2** | PDF export with Puppeteer rendering | Q2 2026 | 🔄 In Progress |
| **Phase 2** | Streaming pipeline with S3 upload | Q2 2026 | 📋 Planned |
| **Phase 2** | Export templates (CRUD + apply) | Q3 2026 | 📋 Planned |
| **Phase 3** | Scheduled recurring exports | Q3 2026 | 📋 Planned |
| **Phase 3** | PII-aware column redaction | Q3 2026 | 📋 Planned |
| **Phase 3** | Auto-columns from Drizzle schema | Q4 2026 | 📋 Planned |
| **Publishable** | Public NPM release as standalone package | Q3 2026 | 📋 Planned |

---

*@mcv/shared/export — Data Export Engine for the MCV.ONE Agentic Operating System*
