# @mcv/shared/import — Data Import & Validation Pipeline

**Parent Package:** @mcv/shared  
**Tier:** 2.5 (Shared Utilities)  
**Classification:** PUBLISHABLE (Phase 2: Q3 2026)  
**Last Updated:** February 8, 2026

---

## Purpose

The `import` module provides a **robust data import pipeline** for CSV, Excel, and JSON files with schema-based validation, data transformation, duplicate detection, preview/dry-run capability, row-level error reporting, and streaming support for large files. It handles everything from a simple "Import Contacts" upload to bulk data migrations of millions of records with rollback support.

**Every data import in MCV — from contact lists to product catalogs to financial transactions — flows through this module.**

Key capabilities:
- **Multi-format**: CSV, XLSX (multi-sheet), JSON, JSONL
- **Schema validation**: Zod-powered schema definitions with type coercion and custom rules
- **Preview mode**: Dry-run first N rows before committing, showing errors/warnings
- **Transformation**: Column mapping, value normalization, computed fields
- **Duplicate detection**: Configurable dedup by key fields (skip, merge, or overwrite)
- **Error handling**: Row-level errors with configurable strategies (stop, skip, collect)
- **Streaming**: Memory-efficient processing for files with millions of rows
- **Rollback**: Transaction-based imports with automatic rollback on failure
- **Progress tracking**: Real-time progress for background import jobs
- **Audit trail**: Full logging of who imported what, when, with row counts and error details

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT IMPORTERS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  importFromCsv,            // Import from CSV file/buffer
  importFromExcel,          // Import from XLSX (single or multi-sheet)
  importFromJson,           // Import from JSON/JSONL
  importFromFormat,         // Dynamic format dispatch
  detectFormat,             // Auto-detect file format from buffer/extension
} from './formats';

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA & VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  defineImportSchema,       // Define validation schema for import
  validateRow,              // Validate single row against schema
  validateImport,           // Full validation pass (no commit)
  validateHeaders,          // Validate CSV/Excel headers match schema
  coerceValue,              // Type coercion for a single value
} from './validation';

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  processImport,            // Full import: validate → transform → commit
  previewImport,            // Preview first N rows (dry-run)
  batchImport,              // Import with batched DB writes
  streamImport,             // Streaming import for large files
  rollbackImport,           // Rollback a completed import
} from './processing';

// ═══════════════════════════════════════════════════════════════════════════════
// DUPLICATE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  detectDuplicates,         // Check for duplicates in dataset
  resolveDuplicates,        // Apply resolution strategy
  DuplicateStrategy,        // Strategy enum
} from './duplicates';

// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  defineColumnMapping,      // Define source → target column mapping
  autoMapColumns,           // AI-assisted auto-mapping from headers
  suggestMapping,           // Suggest mapping based on header similarity
  applyMapping,             // Apply mapping to raw row
} from './mapping';

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND JOBS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createImportJob,          // Create background import job
  getImportJob,             // Get job status/progress
  listImportJobs,           // List jobs for user/venture
  cancelImportJob,          // Cancel running job
  retryImportJob,           // Retry failed job
  getImportErrors,          // Get error details for job
} from './jobs';

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  defineImportTemplate,     // Define reusable import template
  getImportTemplate,        // Get template by ID
  listImportTemplates,      // List templates for venture
  generateSampleFile,       // Generate sample CSV/Excel for template
} from './templates';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS & COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useImport } from './client/hooks/use-import';
export { useImportJob } from './client/hooks/use-import-job';
export { useColumnMapper } from './client/hooks/use-column-mapper';
export { ImportWizard } from './client/components/import-wizard';
export { ImportDropzone } from './client/components/import-dropzone';
export { ImportPreview } from './client/components/import-preview';
export { ImportProgress } from './client/components/import-progress';
export { ColumnMapper } from './client/components/column-mapper';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  IMPORT_FORMATS,           // ['csv', 'xlsx', 'json', 'jsonl']
  MAX_FILE_SIZE,            // 100 MB
  MAX_IMPORT_ROWS,          // 5,000,000
  MAX_PREVIEW_ROWS,         // 100
  DEFAULT_BATCH_SIZE,       // 1,000 rows per DB transaction
  MAX_ERRORS_COLLECTED,     // 10,000 (stop collecting after this)
  SUPPORTED_ENCODINGS,      // ['utf-8', 'utf-16le', 'latin1', 'ascii']
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Core
  ImportFormat,
  ImportOptions,
  ImportResult,
  ImportRow,
  ImportError,
  ImportWarning,

  // Schema
  ImportSchema,
  ImportColumn,
  ColumnType,
  ValidationRule,
  CoercionConfig,

  // Mapping
  ColumnMapping,
  MappingSuggestion,
  MappingConfig,

  // Duplicates
  DuplicateConfig,
  DuplicateResult,
  DuplicateStrategy,

  // Jobs
  ImportJob,
  ImportJobStatus,
  ImportJobProgress,

  // Templates
  ImportTemplate,

  // Processing
  ProcessOptions,
  PreviewResult,
  BatchResult,
  RollbackResult,

  // Events
  ImportEvent,
  ImportEventType,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         IMPORT PIPELINE ARCHITECTURE                              │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │                            ENTRY POINTS                                    │   │
│  │                                                                            │   │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐  │   │
│  │  │ File Upload│  │  API Endpoint│  │  Drag-Drop │  │  Migration Job   │  │   │
│  │  │ (multipart)│  │  POST /import│  │  (UI)      │  │  (background)    │  │   │
│  │  └─────┬──────┘  └──────┬───────┘  └─────┬──────┘  └────────┬─────────┘  │   │
│  │        └────────────────┴────────────────┴───────────────────┘              │   │
│  │                                │                                           │   │
│  └────────────────────────────────┼───────────────────────────────────────────┘   │
│                                   │                                               │
│  ┌────────────────────────────────▼───────────────────────────────────────────┐   │
│  │                        IMPORT PIPELINE                                     │   │
│  │                                                                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │   │
│  │  │ 1. PARSE │→ │ 2. MAP   │→ │ 3. VALID │→ │ 4. DEDUP │→ │ 5. COMMIT │  │   │
│  │  │          │  │          │  │          │  │          │  │           │  │   │
│  │  │ CSV/XLSX │  │ Column   │  │ Schema   │  │ Key-based│  │ Batched   │  │   │
│  │  │ JSON/JSONL│  │ Mapping  │  │ Type     │  │ Duplicate│  │ DB writes │  │   │
│  │  │ Detect   │  │ Auto-map │  │ Coercion │  │ Detection│  │ w/ txn    │  │   │
│  │  │ Encoding │  │ AI-assist│  │ Custom   │  │ Strategy │  │ Rollback  │  │   │
│  │  │ Headers  │  │ Transform│  │ Rules    │  │ Merge    │  │ support   │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │   │
│  │       │             │             │              │              │          │   │
│  │       ▼             ▼             ▼              ▼              ▼          │   │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │   │
│  │  │                    ERROR COLLECTOR                                   │  │   │
│  │  │  Row 5:  email — Invalid email format                               │  │   │
│  │  │  Row 12: phone — Required field missing                             │  │   │
│  │  │  Row 45: amount — Expected number, got "N/A"                        │  │   │
│  │  │  Row 89: email — Duplicate of row 3                                 │  │   │
│  │  └──────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                            │   │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │   │
│  │  │  PREVIEW MODE (dry-run) — Runs stages 1-4 without stage 5           │  │   │
│  │  │  Returns: { validRows, invalidRows, errors, warnings, sample }      │  │   │
│  │  └──────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │  JOB MANAGER (for large imports)                                           │   │
│  │                                                                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │   │
│  │  │ pending  │→ │validating│→ │importing │→ │completed │  │  failed    │  │   │
│  │  │          │  │  (pass 1)│  │  (pass 2)│  │          │  │ (rollback)│  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │   │
│  │                                    │                                       │   │
│  │                                    │   ┌───────────┐                       │   │
│  │                                    └──▶│ cancelled │                       │   │
│  │                                        └───────────┘                       │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │  STREAMING ARCHITECTURE (large files)                                      │   │
│  │                                                                            │   │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐               │   │
│  │  │ File     │──▶│ Transform│──▶│ Validate │──▶│ Batch    │               │   │
│  │  │ ReadStream│   │ Stream   │   │ Stream   │   │ Collector│               │   │
│  │  │          │   │ (map)    │   │ (filter) │   │ (1000)   │               │   │
│  │  └──────────┘   └──────────┘   └──────────┘   └────┬─────┘               │   │
│  │                                                      │                     │   │
│  │       ┌──────────────────────────────────────────────┘                     │   │
│  │       ▼                                                                    │   │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐                              │   │
│  │  │ DB       │──▶│ Progress │──▶│ Backpres │                              │   │
│  │  │ Batch    │   │ Emitter  │   │ sure Ctrl│                              │   │
│  │  │ Insert   │   │ (SSE/WS) │   │ (pause)  │                              │   │
│  │  └──────────┘   └──────────┘   └──────────┘                              │   │
│  │                                                                            │   │
│  │  Memory footprint: ~50MB regardless of file size (streaming backpressure)  │   │
│  │                                                                            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │  DATABASE LAYER                                                            │   │
│  │                                                                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ import_jobs  │  │import_records│  │import_       │  │ audit_events │  │   │
│  │  │              │  │              │  │  templates   │  │              │  │   │
│  │  │ Status,      │  │ Per-entity   │  │ Reusable     │  │ Who imported │  │   │
│  │  │ progress,    │  │ rollback log │  │ schemas &    │  │ what, when,  │  │   │
│  │  │ error sample │  │ w/ prev data │  │ mappings     │  │ row counts   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                                            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Stage Details

| Stage | Input | Output | Failure Behavior |
|-------|-------|--------|-----------------|
| **1. Parse** | Raw file buffer/stream | Array of raw row objects | Throws `IMPORT_PARSE_ERROR` — cannot proceed |
| **2. Map** | Raw row objects | Mapped row objects (target schema keys) | Unmapped columns ignored; missing columns get defaults |
| **3. Validate** | Mapped rows | Validated & coerced rows | Per-row errors collected; strategy determines flow |
| **4. Dedup** | Validated rows | Unique rows + duplicate report | Strategy-dependent: skip/merge/overwrite/error |
| **5. Commit** | Unique validated rows | Import result with IDs | Transaction rollback on batch failure |

---

## TypeScript Interfaces

### Core Types

```typescript
type ImportFormat = 'csv' | 'xlsx' | 'json' | 'jsonl';

interface ImportOptions<T = Record<string, unknown>> {
  /** File buffer or readable stream */
  file: Buffer | NodeJS.ReadableStream;
  /** File format (auto-detected if not specified) */
  format?: ImportFormat;
  /** Validation schema */
  schema: ImportSchema;
  /** Column mapping (source headers → schema fields) */
  mapping?: ColumnMapping;
  /** Error handling strategy */
  onError?: 'stop' | 'skip' | 'collect';
  /** Row callback (called for each valid row) */
  onRow?: (row: T, index: number) => Promise<void>;
  /** Progress callback */
  onProgress?: (progress: ImportJobProgress) => void;
  /** Maximum rows to import */
  limit?: number;
  /** Skip N header rows */
  skipRows?: number;
  /** Sheet name or index (for XLSX) */
  sheet?: string | number;
  /** Duplicate detection config */
  duplicates?: DuplicateConfig;
  /** CSV-specific options */
  csv?: CsvParseOptions;
  /** Whether to wrap in transaction */
  transactional?: boolean;
  /** Batch size for DB writes */
  batchSize?: number;
  /** Dry-run (validate only, don't commit) */
  dryRun?: boolean;
  /** Venture context */
  ventureId?: string;
  /** User performing import */
  userId?: string;
}

interface ImportResult {
  /** Total rows processed */
  totalRows: number;
  /** Successfully imported rows */
  successCount: number;
  /** Failed rows */
  failedCount: number;
  /** Skipped rows (duplicates, etc.) */
  skippedCount: number;
  /** Row-level errors */
  errors: ImportError[];
  /** Warnings (non-fatal issues) */
  warnings: ImportWarning[];
  /** Duplicate statistics */
  duplicates: DuplicateResult;
  /** Import ID for rollback */
  importId?: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Whether import was dry-run */
  dryRun: boolean;
}

interface ImportError {
  /** 1-indexed row number in source file */
  row: number;
  /** Column name where error occurred */
  column: string;
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** The invalid value */
  value?: unknown;
  /** Expected type/format */
  expected?: string;
}

interface ImportWarning {
  row: number;
  column: string;
  message: string;
  code: string;
  value?: unknown;
  /** Auto-corrected value (if coercion applied) */
  correctedValue?: unknown;
}

interface ImportRow<T = Record<string, unknown>> {
  /** 1-indexed row number from source file */
  index: number;
  /** Raw data before transformation */
  raw: Record<string, unknown>;
  /** Transformed & validated data */
  data: T;
  /** Whether row passed validation */
  valid: boolean;
  /** Row-level errors */
  errors: ImportError[];
  /** Row-level warnings */
  warnings: ImportWarning[];
}
```

### CSV Parse Options

```typescript
interface CsvParseOptions {
  /** Column delimiter (default: auto-detect, falls back to ',') */
  delimiter?: ',' | ';' | '\t' | '|';
  /** Quote character (default: '"') */
  quote?: string;
  /** Escape character (default: '"') */
  escape?: string;
  /** Line terminator (default: auto-detect) */
  newline?: '\n' | '\r\n' | '\r';
  /** File encoding (default: auto-detect via BOM or chardet) */
  encoding?: 'utf-8' | 'utf-16le' | 'latin1' | 'ascii';
  /** Whether first row is headers (default: true) */
  hasHeaders?: boolean;
  /** Custom header names (if hasHeaders is false) */
  headers?: string[];
  /** Trim field values (default: true) */
  trim?: boolean;
  /** Skip empty lines (default: true) */
  skipEmptyLines?: boolean;
  /** Comment character — lines starting with this are skipped */
  comment?: string;
  /** Maximum field size in bytes (default: 1MB — prevents memory bombs) */
  maxFieldSize?: number;
}
```

### Schema Types

```typescript
interface ImportSchema {
  /** Column definitions */
  columns: ImportColumn[];
  /** Custom row-level validation */
  validateRow?: (row: Record<string, unknown>) => ValidationResult;
  /** Strict mode: reject rows with unknown columns */
  strict?: boolean;
}

interface ImportColumn {
  /** Column name (matches schema field) */
  name: string;
  /** Display label for UI */
  label?: string;
  /** Data type */
  type: ColumnType;
  /** Whether field is required */
  required?: boolean;
  /** Default value when missing */
  default?: unknown;
  /** Allowed values (for enum type) */
  values?: string[];
  /** Regex pattern for validation */
  pattern?: RegExp;
  /** Min/max for numbers */
  min?: number;
  max?: number;
  /** Min/max length for strings */
  minLength?: number;
  maxLength?: number;
  /** Value transformer */
  transform?: (value: unknown, row: Record<string, unknown>) => unknown;
  /** Custom validation function */
  validate?: (value: unknown, row: Record<string, unknown>) => string | null;
  /** Whether to trim whitespace */
  trim?: boolean;
  /** Aliases (alternative column headers that map to this field) */
  aliases?: string[];
  /** Description for sample file generation */
  description?: string;
  /** Example value for sample file */
  example?: string;
}

type ColumnType =
  | 'string'
  | 'number'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'phone'
  | 'url'
  | 'uuid'
  | 'enum'
  | 'json'
  | 'currency'      // Parsed as integer cents
  | 'percentage';   // Parsed as decimal (0-1)

interface ValidationResult {
  valid: boolean;
  errors?: Array<{ column: string; message: string; code: string }>;
}

interface CoercionConfig {
  /** How to parse dates (default: 'auto') */
  dateFormat?: 'auto' | 'iso' | 'us' | 'eu' | string;
  /** Timezone for date parsing (default: 'UTC') */
  timezone?: string;
  /** How to parse booleans */
  booleanTrueValues?: string[];   // Default: ['true', '1', 'yes', 'y', 'on']
  booleanFalseValues?: string[];  // Default: ['false', '0', 'no', 'n', 'off']
  /** Currency symbol to strip (default: auto-detect) */
  currencySymbol?: string;
  /** Decimal separator (default: auto-detect '.'/','  ) */
  decimalSeparator?: '.' | ',';
  /** Thousands separator (default: auto-detect) */
  thousandsSeparator?: ',' | '.' | ' ' | '';
  /** Phone number normalization country (default: 'US') */
  phoneCountry?: string;
}
```

### Duplicate Detection Types

```typescript
type DuplicateStrategy = 'skip' | 'overwrite' | 'merge' | 'error';

interface DuplicateConfig {
  /** Fields to use as duplicate key */
  keys: string[];
  /** Strategy when duplicate found */
  strategy: DuplicateStrategy;
  /** Check against existing DB records (not just within file) */
  checkExisting?: boolean;
  /** For 'merge' strategy: fields to merge (others keep existing) */
  mergeFields?: string[];
  /** Case-insensitive comparison */
  caseInsensitive?: boolean;
}

interface DuplicateResult {
  /** Total duplicates found */
  total: number;
  /** Duplicates within the import file */
  inFile: number;
  /** Duplicates against existing DB records */
  inDatabase: number;
  /** How they were resolved */
  skipped: number;
  overwritten: number;
  merged: number;
}
```

### Column Mapping Types

```typescript
interface ColumnMapping {
  /** Source header → target schema field */
  fields: Record<string, string>;
  /** Unmapped source columns (ignored) */
  unmapped?: string[];
  /** Target fields with no source (will use defaults) */
  missing?: string[];
}

interface MappingSuggestion {
  sourceHeader: string;
  suggestedField: string;
  confidence: number;        // 0-1
  reason: string;            // 'exact_match', 'fuzzy_match', 'alias_match', 'ai_suggestion'
}

interface MappingConfig {
  /** Column field mappings */
  mapping: ColumnMapping;
  /** Value transformers per column */
  transforms?: Record<string, (value: unknown) => unknown>;
  /** Computed fields (derived from other columns) */
  computed?: Record<string, (row: Record<string, unknown>) => unknown>;
  /** Columns to exclude from import */
  exclude?: string[];
}
```

### Job Types

```typescript
type ImportJobStatus =
  | 'pending'
  | 'validating'
  | 'importing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rolling_back';

interface ImportJob {
  id: string;
  ventureId: string;
  userId: string;
  entityType: string;           // 'contacts', 'products', etc.
  status: ImportJobStatus;
  progress: number;             // 0-100
  phase: 'validation' | 'import';
  totalRows?: number;
  processedRows?: number;
  successCount?: number;
  failedCount?: number;
  skippedCount?: number;
  errorSampleUrl?: string;      // Download URL for full error report
  fileUrl?: string;             // Original uploaded file
  fileName?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
  importId?: string;            // For rollback reference
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

interface ImportJobProgress {
  phase: 'parsing' | 'validating' | 'importing' | 'finalizing';
  processedRows: number;
  totalRows?: number;
  percentage?: number;
  currentBatch: number;
  totalBatches?: number;
  errorsCollected: number;
  elapsedMs: number;
  estimatedRemainingMs?: number;
}
```

### Preview Types

```typescript
interface PreviewResult {
  /** Detected file format */
  format: ImportFormat;
  /** Detected encoding */
  encoding: string;
  /** Source headers from file */
  headers: string[];
  /** Suggested column mapping */
  suggestedMapping: MappingSuggestion[];
  /** Total rows detected (estimated for large files) */
  totalRows: number;
  /** Preview rows (validated) */
  rows: PreviewRow[];
  /** Validation summary */
  validCount: number;
  invalidCount: number;
  /** Errors found in preview */
  errors: ImportError[];
  /** Warnings found in preview */
  warnings: ImportWarning[];
  /** Duplicate summary (within preview) */
  duplicates: DuplicateResult;
}

interface PreviewRow {
  index: number;
  data: Record<string, unknown>;
  valid: boolean;
  errors: ImportError[];
  warnings: ImportWarning[];
}
```

### Template Types

```typescript
interface ImportTemplate {
  id: string;
  ventureId: string;
  /** Template name (e.g., 'Contact Import', 'Product Catalog') */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Entity type this template targets */
  entityType: string;
  /** Schema definition */
  schema: ImportSchema;
  /** Default column mapping */
  defaultMapping?: ColumnMapping;
  /** Default duplicate detection config */
  defaultDuplicates?: DuplicateConfig;
  /** Default CSV options */
  defaultCsvOptions?: CsvParseOptions;
  /** Coercion configuration */
  coercion?: CoercionConfig;
  /** Whether template is active */
  active: boolean;
  /** Who created it */
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GenerateSampleOptions {
  /** Output format */
  format: 'csv' | 'xlsx';
  /** Number of sample rows to generate */
  rows?: number;        // Default: 5
  /** Include example values from schema */
  includeExamples?: boolean;  // Default: true
  /** Include column descriptions as comments */
  includeDescriptions?: boolean;  // Default: true
}
```

### Rollback Types

```typescript
interface RollbackResult {
  /** Import job that was rolled back */
  importJobId: string;
  /** Total records rolled back */
  rolledBack: number;
  /** Records that could not be rolled back (already modified since import) */
  skipped: number;
  /** Errors during rollback */
  errors: Array<{ entityId: string; reason: string }>;
  /** Duration in milliseconds */
  durationMs: number;
}

interface BatchResult {
  /** Batch number (1-indexed) */
  batchNumber: number;
  /** Rows processed in this batch */
  rowCount: number;
  /** Successfully committed */
  successCount: number;
  /** Failed in this batch */
  failedCount: number;
  /** Batch duration in milliseconds */
  durationMs: number;
}
```

### Event Types

```typescript
type ImportEventType =
  | 'import.started'
  | 'import.progress'
  | 'import.completed'
  | 'import.failed'
  | 'import.cancelled'
  | 'import.rollback.started'
  | 'import.rollback.completed'
  | 'import.rollback.failed'
  | 'import.preview.completed'
  | 'import.batch.completed'
  | 'import.batch.failed'
  | 'import.duplicate.detected'
  | 'import.validation.error';

interface ImportEvent {
  type: ImportEventType;
  /** ISO timestamp */
  timestamp: string;
  /** Import job ID */
  jobId: string;
  /** Venture context */
  ventureId: string;
  /** User who triggered the import */
  userId: string;
  /** Event-specific payload */
  payload: Record<string, unknown>;
}
```

---

## Database Schema

### Import Jobs Table

```sql
CREATE TABLE import_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Import configuration
  entity_type     TEXT NOT NULL,
  format          TEXT NOT NULL CHECK (format IN ('csv', 'xlsx', 'json', 'jsonl')),
  file_name       TEXT,
  file_size_bytes INTEGER,
  file_url        TEXT,               -- S3 URL of uploaded file

  -- Schema & mapping
  schema_config   JSONB,              -- ImportSchema serialized
  mapping_config  JSONB,              -- ColumnMapping serialized
  duplicate_config JSONB,             -- DuplicateConfig serialized
  coercion_config JSONB,              -- CoercionConfig serialized

  -- Status tracking
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','validating','importing',
                         'completed','failed','cancelled','rolling_back')),
  progress        INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  phase           TEXT DEFAULT 'validation',

  -- Results
  total_rows      INTEGER,
  success_count   INTEGER DEFAULT 0,
  failed_count    INTEGER DEFAULT 0,
  skipped_count   INTEGER DEFAULT 0,
  error_count     INTEGER DEFAULT 0,
  error_sample    JSONB,              -- First 100 errors (ImportError[])
  error_report_url TEXT,              -- Full error CSV download URL (S3)
  import_id       TEXT,               -- Rollback reference (UUID)
  warning_count   INTEGER DEFAULT 0,

  -- Error info (for job-level failures)
  error_message   TEXT,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,

  -- Metadata
  template_id     UUID REFERENCES import_templates(id),
  metadata        JSONB               -- Arbitrary user-defined metadata
);

-- Performance indexes
CREATE INDEX import_jobs_venture_idx ON import_jobs(venture_id);
CREATE INDEX import_jobs_user_idx ON import_jobs(user_id);
CREATE INDEX import_jobs_status_idx ON import_jobs(status);
CREATE INDEX import_jobs_entity_type_idx ON import_jobs(venture_id, entity_type);
CREATE INDEX import_jobs_created_idx ON import_jobs(created_at DESC);
```

### Import Records Table (Rollback Ledger)

```sql
CREATE TABLE import_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id   UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,

  -- What was imported
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,          -- ID of created/updated record
  action          TEXT NOT NULL CHECK (action IN ('created', 'updated', 'merged')),

  -- Rollback data
  previous_data   JSONB,                  -- Previous state (for update/merge rollback)
  imported_data   JSONB NOT NULL,         -- What was written

  -- Source reference
  source_row      INTEGER,                -- Row number in source file (1-indexed)

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Rollback tracking
  rolled_back     BOOLEAN DEFAULT false,
  rolled_back_at  TIMESTAMPTZ
);

-- Performance indexes
CREATE INDEX import_records_job_idx ON import_records(import_job_id);
CREATE INDEX import_records_entity_idx ON import_records(entity_type, entity_id);
CREATE INDEX import_records_venture_idx ON import_records(venture_id);
CREATE INDEX import_records_rollback_idx ON import_records(import_job_id)
  WHERE rolled_back = false;
```

### Import Templates Table

```sql
CREATE TABLE import_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,

  -- Template identity
  name            TEXT NOT NULL,
  description     TEXT,
  entity_type     TEXT NOT NULL,

  -- Configuration (stored as JSONB for flexibility)
  schema_config   JSONB NOT NULL,         -- ImportSchema
  mapping_config  JSONB,                  -- Default ColumnMapping
  duplicate_config JSONB,                 -- Default DuplicateConfig
  csv_options     JSONB,                  -- Default CsvParseOptions
  coercion_config JSONB,                  -- Default CoercionConfig

  -- Status
  active          BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Uniqueness: one template per name per venture
  UNIQUE (venture_id, name)
);

CREATE INDEX import_templates_venture_idx ON import_templates(venture_id);
CREATE INDEX import_templates_entity_idx ON import_templates(venture_id, entity_type);
```

### Drizzle ORM Schema (TypeScript)

```typescript
import { pgTable, uuid, text, integer, boolean, jsonb, timestamp,
         index, uniqueIndex } from 'drizzle-orm/pg-core';

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT JOBS
// ═══════════════════════════════════════════════════════════════════════════════

export const importJobs = pgTable('import_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }).notNull(),

  // Configuration
  entityType: text('entity_type').notNull(),
  format: text('format').notNull(),
  fileName: text('file_name'),
  fileSizeBytes: integer('file_size_bytes'),
  fileUrl: text('file_url'),

  // Schema & mapping (JSONB)
  schemaConfig: jsonb('schema_config'),
  mappingConfig: jsonb('mapping_config'),
  duplicateConfig: jsonb('duplicate_config'),
  coercionConfig: jsonb('coercion_config'),

  // Status
  status: text('status').notNull().default('pending'),
  progress: integer('progress').default(0),
  phase: text('phase').default('validation'),

  // Results
  totalRows: integer('total_rows'),
  successCount: integer('success_count').default(0),
  failedCount: integer('failed_count').default(0),
  skippedCount: integer('skipped_count').default(0),
  errorCount: integer('error_count').default(0),
  warningCount: integer('warning_count').default(0),
  errorSample: jsonb('error_sample'),
  errorReportUrl: text('error_report_url'),
  importId: text('import_id'),

  // Error
  errorMessage: text('error_message'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),

  // References
  templateId: uuid('template_id').references(() => importTemplates.id),
  metadata: jsonb('metadata'),
}, (table) => [
  index('import_jobs_venture_idx').on(table.ventureId),
  index('import_jobs_user_idx').on(table.userId),
  index('import_jobs_status_idx').on(table.status),
  index('import_jobs_entity_type_idx').on(table.ventureId, table.entityType),
  index('import_jobs_created_idx').on(table.createdAt),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT RECORDS (rollback ledger)
// ═══════════════════════════════════════════════════════════════════════════════

export const importRecords = pgTable('import_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  importJobId: uuid('import_job_id').references(() => importJobs.id, { onDelete: 'cascade' }).notNull(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),

  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  action: text('action').notNull(),    // 'created' | 'updated' | 'merged'

  previousData: jsonb('previous_data'),
  importedData: jsonb('imported_data').notNull(),
  sourceRow: integer('source_row'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  rolledBack: boolean('rolled_back').default(false),
  rolledBackAt: timestamp('rolled_back_at', { withTimezone: true }),
}, (table) => [
  index('import_records_job_idx').on(table.importJobId),
  index('import_records_entity_idx').on(table.entityType, table.entityId),
  index('import_records_venture_idx').on(table.ventureId),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export const importTemplates = pgTable('import_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),

  name: text('name').notNull(),
  description: text('description'),
  entityType: text('entity_type').notNull(),

  schemaConfig: jsonb('schema_config').notNull(),
  mappingConfig: jsonb('mapping_config'),
  duplicateConfig: jsonb('duplicate_config'),
  csvOptions: jsonb('csv_options'),
  coercionConfig: jsonb('coercion_config'),

  active: boolean('active').notNull().default(true),
  createdBy: uuid('created_by').references(() => users.id).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('import_templates_venture_idx').on(table.ventureId),
  index('import_templates_entity_idx').on(table.ventureId, table.entityType),
  uniqueIndex('import_templates_name_unique').on(table.ventureId, table.name),
]);
```

---

## Usage Examples

### Example 1: Simple Contact CSV Import

```typescript
import { processImport, defineImportSchema } from '@mcv/shared/import';

// ═══════════════════════════════════════════════════════════════════════════════
// Define a schema for contact imports
// ═══════════════════════════════════════════════════════════════════════════════

const contactSchema = defineImportSchema({
  columns: [
    { name: 'firstName', type: 'string', required: true, label: 'First Name' },
    { name: 'lastName',  type: 'string', required: true, label: 'Last Name' },
    { name: 'email',     type: 'email',  required: true, label: 'Email Address' },
    { name: 'phone',     type: 'phone',  required: false, label: 'Phone Number' },
    { name: 'company',   type: 'string', required: false, label: 'Company' },
    {
      name: 'role',
      type: 'enum',
      values: ['admin', 'member', 'viewer'],
      default: 'member',
      label: 'Role',
    },
  ],
});

// ═══════════════════════════════════════════════════════════════════════════════
// Run the import
// ═══════════════════════════════════════════════════════════════════════════════

const fileBuffer = await fs.readFile('/uploads/contacts.csv');

const result = await processImport({
  file: fileBuffer,
  format: 'csv',
  schema: contactSchema,
  onError: 'collect',         // Don't stop on errors — collect them all
  batchSize: 500,
  transactional: true,
  ventureId: 'venture-uuid',
  userId: 'user-uuid',
});

console.log(`Imported: ${result.successCount}/${result.totalRows} contacts`);
console.log(`Errors: ${result.failedCount}`);
console.log(`Duration: ${result.durationMs}ms`);

if (result.errors.length > 0) {
  console.log('First 5 errors:');
  for (const err of result.errors.slice(0, 5)) {
    console.log(`  Row ${err.row}: ${err.column} — ${err.message} (value: ${err.value})`);
  }
}
```

### Example 2: Preview Before Importing

```typescript
import { previewImport, processImport } from '@mcv/shared/import';

// ═══════════════════════════════════════════════════════════════════════════════
// Step 1: Preview the file (validate first 100 rows without committing)
// ═══════════════════════════════════════════════════════════════════════════════

const preview = await previewImport({
  file: uploadBuffer,
  schema: productSchema,
  csv: { delimiter: ';' },    // European CSV with semicolons
});

console.log(`Format: ${preview.format}, Encoding: ${preview.encoding}`);
console.log(`Headers: ${preview.headers.join(', ')}`);
console.log(`Total rows (estimated): ${preview.totalRows}`);
console.log(`Valid: ${preview.validCount}, Invalid: ${preview.invalidCount}`);

// Show suggested column mapping
for (const suggestion of preview.suggestedMapping) {
  console.log(
    `  "${suggestion.sourceHeader}" → ${suggestion.suggestedField}` +
    ` (${(suggestion.confidence * 100).toFixed(0)}% — ${suggestion.reason})`
  );
}

// Show first error
if (preview.errors.length > 0) {
  const err = preview.errors[0];
  console.log(`First error: Row ${err.row}, ${err.column}: ${err.message}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Step 2: User confirms — proceed with full import
// ═══════════════════════════════════════════════════════════════════════════════

if (userConfirmed) {
  const result = await processImport({
    file: uploadBuffer,
    schema: productSchema,
    mapping: userAdjustedMapping,   // User may have corrected the mapping
    onError: 'skip',
    ventureId: 'venture-uuid',
    userId: 'user-uuid',
  });
}
```

### Example 3: Excel Multi-Sheet Import

```typescript
import { importFromExcel, defineImportSchema } from '@mcv/shared/import';

// ═══════════════════════════════════════════════════════════════════════════════
// Import from a specific sheet in an Excel workbook
// ═══════════════════════════════════════════════════════════════════════════════

const orderSchema = defineImportSchema({
  columns: [
    { name: 'orderId',    type: 'string',   required: true },
    { name: 'customer',   type: 'string',   required: true },
    { name: 'amount',     type: 'currency', required: true },
    { name: 'orderDate',  type: 'date',     required: true },
    { name: 'status',     type: 'enum',     values: ['pending', 'shipped', 'delivered', 'cancelled'] },
    { name: 'notes',      type: 'string',   maxLength: 500 },
  ],
});

// Import the "Orders Q4" sheet
const result = await importFromExcel({
  file: excelBuffer,
  schema: orderSchema,
  sheet: 'Orders Q4',        // Sheet name (or 0-indexed number)
  skipRows: 2,               // Skip title rows before headers
  onError: 'collect',
  duplicates: {
    keys: ['orderId'],
    strategy: 'skip',        // Skip duplicate order IDs
    checkExisting: true,     // Also check against DB
  },
  ventureId: 'venture-uuid',
  userId: 'user-uuid',
});

console.log(`Orders imported: ${result.successCount}`);
console.log(`Duplicates skipped: ${result.duplicates.skipped}`);
```

### Example 4: Column Mapping with AI-Assisted Suggestions

```typescript
import { autoMapColumns, defineColumnMapping, processImport } from '@mcv/shared/import';

// ═══════════════════════════════════════════════════════════════════════════════
// Auto-detect mapping from messy headers
// ═══════════════════════════════════════════════════════════════════════════════

// Source file headers: ['Full Name', 'E-Mail Address', 'Tel.', 'Org', 'Title']
// Target schema fields: ['firstName', 'lastName', 'email', 'phone', 'company', 'role']

const suggestions = await autoMapColumns({
  sourceHeaders: ['Full Name', 'E-Mail Address', 'Tel.', 'Org', 'Title'],
  schema: contactSchema,
});

// Returns:
// [
//   { sourceHeader: 'Full Name',        suggestedField: 'firstName', confidence: 0.7, reason: 'fuzzy_match' },
//   { sourceHeader: 'E-Mail Address',   suggestedField: 'email',     confidence: 0.95, reason: 'alias_match' },
//   { sourceHeader: 'Tel.',             suggestedField: 'phone',     confidence: 0.85, reason: 'ai_suggestion' },
//   { sourceHeader: 'Org',             suggestedField: 'company',   confidence: 0.8,  reason: 'ai_suggestion' },
//   { sourceHeader: 'Title',           suggestedField: 'role',      confidence: 0.3,  reason: 'fuzzy_match' },
// ]

// User reviews and adjusts, then create final mapping:
const mapping = defineColumnMapping({
  fields: {
    'Full Name': 'firstName',       // Will need a transform to split
    'E-Mail Address': 'email',
    'Tel.': 'phone',
    'Org': 'company',
    // 'Title' intentionally unmapped — not the same as 'role'
  },
});

const result = await processImport({
  file: csvBuffer,
  schema: contactSchema,
  mapping,
  onError: 'collect',
  ventureId: 'venture-uuid',
  userId: 'user-uuid',
});
```

### Example 5: Streaming Large File Import

```typescript
import { streamImport, defineImportSchema } from '@mcv/shared/import';
import { createReadStream } from 'fs';

// ═══════════════════════════════════════════════════════════════════════════════
// Stream-process a 2GB CSV file with 5M rows — constant ~50MB memory
// ═══════════════════════════════════════════════════════════════════════════════

const transactionSchema = defineImportSchema({
  columns: [
    { name: 'txId',        type: 'string',   required: true },
    { name: 'date',        type: 'datetime', required: true },
    { name: 'amount',      type: 'currency', required: true },
    { name: 'currency',    type: 'enum',     values: ['USD', 'EUR', 'GBP', 'CAD'], required: true },
    { name: 'description', type: 'string',   maxLength: 255 },
    { name: 'category',    type: 'string' },
    { name: 'accountId',   type: 'uuid',     required: true },
  ],
});

const fileStream = createReadStream('/data/transactions-2024.csv');

const result = await streamImport({
  file: fileStream,
  format: 'csv',
  schema: transactionSchema,
  batchSize: 2000,           // Write 2000 rows per DB transaction
  onError: 'skip',           // Skip bad rows, don't stop
  transactional: false,      // Per-batch transactions (not one giant txn)
  onProgress: (progress) => {
    // Real-time progress updates (emitted every batch)
    console.log(
      `Phase: ${progress.phase} | ` +
      `${progress.processedRows}/${progress.totalRows ?? '?'} rows | ` +
      `${progress.percentage?.toFixed(1) ?? '?'}% | ` +
      `Errors: ${progress.errorsCollected} | ` +
      `ETA: ${progress.estimatedRemainingMs ? Math.round(progress.estimatedRemainingMs / 1000) + 's' : '?'}`
    );
  },
  duplicates: {
    keys: ['txId'],
    strategy: 'skip',
    checkExisting: true,
  },
  ventureId: 'venture-uuid',
  userId: 'user-uuid',
});

console.log(`\nCompleted in ${(result.durationMs / 1000).toFixed(1)}s`);
console.log(`Success: ${result.successCount.toLocaleString()}`);
console.log(`Failed: ${result.failedCount.toLocaleString()}`);
console.log(`Skipped (dupes): ${result.skippedCount.toLocaleString()}`);
```

### Example 6: Background Import Job with Progress Tracking

```typescript
import { createImportJob, getImportJob, cancelImportJob } from '@mcv/shared/import';

// ═══════════════════════════════════════════════════════════════════════════════
// Create a background job for large imports (returns immediately)
// ═══════════════════════════════════════════════════════════════════════════════

const job = await createImportJob({
  file: uploadedFileBuffer,
  format: 'xlsx',
  schema: productSchema,
  entityType: 'products',
  duplicates: {
    keys: ['sku'],
    strategy: 'overwrite',
    checkExisting: true,
  },
  ventureId: 'venture-uuid',
  userId: 'user-uuid',
});

console.log(`Job created: ${job.id} (status: ${job.status})`);
// Output: "Job created: abc-123 (status: pending)"

// ═══════════════════════════════════════════════════════════════════════════════
// Poll for progress (or use WebSocket/SSE for real-time updates)
// ═══════════════════════════════════════════════════════════════════════════════

const checkProgress = async () => {
  const status = await getImportJob(job.id);

  console.log(`Status: ${status.status} | Progress: ${status.progress}%`);
  console.log(`Phase: ${status.phase}`);
  console.log(`Rows: ${status.processedRows ?? 0}/${status.totalRows ?? '?'}`);
  console.log(`Success: ${status.successCount}, Failed: ${status.failedCount}`);

  if (status.status === 'completed') {
    console.log(`\nImport complete! ${status.successCount} products imported.`);
    if (status.errorReportUrl) {
      console.log(`Error report: ${status.errorReportUrl}`);
    }
    return true;
  }

  if (status.status === 'failed') {
    console.error(`Import failed: ${status.errorMessage}`);
    return true;
  }

  return false; // Still running
};

// ═══════════════════════════════════════════════════════════════════════════════
// Cancel a running job
// ═══════════════════════════════════════════════════════════════════════════════

await cancelImportJob(job.id);
// Gracefully stops after current batch; already-imported rows remain.
```

### Example 7: Duplicate Detection with Merge Strategy

```typescript
import { processImport } from '@mcv/shared/import';

// ═══════════════════════════════════════════════════════════════════════════════
// Merge duplicates: keep existing data, fill in blanks from import
// ═══════════════════════════════════════════════════════════════════════════════

const result = await processImport({
  file: csvBuffer,
  schema: contactSchema,
  duplicates: {
    keys: ['email'],                  // Match on email address
    strategy: 'merge',                // Merge, don't overwrite
    checkExisting: true,              // Check DB, not just within file
    mergeFields: ['phone', 'company', 'role'],  // Only merge these fields
    caseInsensitive: true,            // john@ACME.com = john@acme.com
  },
  onError: 'collect',
  ventureId: 'venture-uuid',
  userId: 'user-uuid',
});

console.log('Duplicate resolution:');
console.log(`  In file: ${result.duplicates.inFile}`);
console.log(`  In database: ${result.duplicates.inDatabase}`);
console.log(`  Merged: ${result.duplicates.merged}`);
console.log(`  Skipped: ${result.duplicates.skipped}`);
console.log(`  Overwritten: ${result.duplicates.overwritten}`);
```

### Example 8: Import with Custom Transformations

```typescript
import { processImport, defineImportSchema, defineColumnMapping } from '@mcv/shared/import';

// ═══════════════════════════════════════════════════════════════════════════════
// Define schema with transformers and custom validators
// ═══════════════════════════════════════════════════════════════════════════════

const employeeSchema = defineImportSchema({
  columns: [
    {
      name: 'fullName',
      type: 'string',
      required: true,
      // Split "John Doe" into firstName/lastName downstream
      transform: (val) => String(val).trim(),
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      transform: (val) => String(val).toLowerCase().trim(),
    },
    {
      name: 'salary',
      type: 'currency',
      required: true,
      min: 30000,
      max: 500000,
    },
    {
      name: 'department',
      type: 'enum',
      values: ['engineering', 'marketing', 'sales', 'hr', 'finance', 'ops'],
      // Normalize common variations
      transform: (val) => String(val).toLowerCase().replace(/&/g, 'and').trim(),
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      // Custom validator: can't start in the future
      validate: (val) => {
        const date = new Date(val as string);
        return date > new Date() ? 'Start date cannot be in the future' : null;
      },
    },
    {
      name: 'employeeId',
      type: 'string',
      required: true,
      pattern: /^EMP-\d{6}$/,   // Must match EMP-XXXXXX
    },
  ],
  // Cross-field validation
  validateRow: (row) => {
    if (row.department === 'engineering' && (row.salary as number) < 50000) {
      return {
        valid: false,
        errors: [{ column: 'salary', message: 'Engineering salary must be ≥ $50,000', code: 'SALARY_TOO_LOW' }],
      };
    }
    return { valid: true };
  },
});

const result = await processImport({
  file: csvBuffer,
  schema: employeeSchema,
  onError: 'collect',
  ventureId: 'venture-uuid',
  userId: 'user-uuid',
});
```

### Example 9: Reusable Import Template

```typescript
import { defineImportTemplate, generateSampleFile, processImport } from '@mcv/shared/import';

// ═══════════════════════════════════════════════════════════════════════════════
// Create a reusable template for product catalog imports
// ═══════════════════════════════════════════════════════════════════════════════

const template = await defineImportTemplate({
  name: 'Product Catalog',
  description: 'Standard product import with SKU, price, and inventory',
  entityType: 'products',
  ventureId: 'venture-uuid',
  schema: {
    columns: [
      { name: 'sku',         type: 'string',   required: true, example: 'SKU-001',     description: 'Unique product SKU' },
      { name: 'name',        type: 'string',   required: true, example: 'Widget Pro',  description: 'Product display name' },
      { name: 'price',       type: 'currency', required: true, example: '$29.99',      description: 'Price in USD (cents)' },
      { name: 'quantity',    type: 'integer',   required: true, example: '100',         description: 'Current stock quantity', min: 0 },
      { name: 'category',    type: 'string',   required: false, example: 'Electronics', description: 'Product category' },
      { name: 'description', type: 'string',   required: false, maxLength: 1000,        description: 'Product description' },
      { name: 'weight',      type: 'decimal',  required: false, example: '1.5',         description: 'Weight in kg' },
      { name: 'active',      type: 'boolean',  required: false, default: true,          description: 'Whether product is active' },
    ],
  },
  defaultDuplicates: {
    keys: ['sku'],
    strategy: 'overwrite',
    checkExisting: true,
  },
  createdBy: 'admin-user-uuid',
});

// ═══════════════════════════════════════════════════════════════════════════════
// Generate a sample CSV for users to fill out
// ═══════════════════════════════════════════════════════════════════════════════

const sampleCsv = await generateSampleFile(template.id, {
  format: 'csv',
  rows: 3,
  includeExamples: true,
  includeDescriptions: true,
});

// Returns a Buffer with:
// # sku: Unique product SKU
// # name: Product display name
// # price: Price in USD (cents)
// # quantity: Current stock quantity
// # category: Product category
// # description: Product description
// # weight: Weight in kg
// # active: Whether product is active
// sku,name,price,quantity,category,description,weight,active
// SKU-001,Widget Pro,$29.99,100,Electronics,,1.5,true
// SKU-002,Widget Pro,$29.99,100,Electronics,,1.5,true
// SKU-003,Widget Pro,$29.99,100,Electronics,,1.5,true

// ═══════════════════════════════════════════════════════════════════════════════
// Import using the template (schema & defaults pre-configured)
// ═══════════════════════════════════════════════════════════════════════════════

const result = await processImport({
  file: userUpload,
  templateId: template.id,      // Uses template's schema, mapping, and dedup config
  onError: 'collect',
  ventureId: 'venture-uuid',
  userId: 'user-uuid',
});
```

### Example 10: Rollback a Completed Import

```typescript
import { rollbackImport, getImportJob } from '@mcv/shared/import';

// ═══════════════════════════════════════════════════════════════════════════════
// Undo an import — restore all records to their pre-import state
// ═══════════════════════════════════════════════════════════════════════════════

const job = await getImportJob('job-uuid');

if (job.status !== 'completed') {
  throw new Error('Can only rollback completed imports');
}

const rollback = await rollbackImport(job.importId!, {
  ventureId: 'venture-uuid',
  userId: 'admin-user-uuid',   // Who authorized the rollback
});

console.log(`Rollback complete:`);
console.log(`  Records restored: ${rollback.rolledBack}`);
console.log(`  Skipped (modified since import): ${rollback.skipped}`);
console.log(`  Duration: ${rollback.durationMs}ms`);

if (rollback.errors.length > 0) {
  console.log(`  Errors:`);
  for (const err of rollback.errors) {
    console.log(`    Entity ${err.entityId}: ${err.reason}`);
  }
}

// Records with action='created' are deleted.
// Records with action='updated' or 'merged' are restored to previous_data.
// Records modified AFTER import (detected via updated_at) are skipped to prevent data loss.
```

### Example 11: Import with JSON/JSONL Format

```typescript
import { importFromJson, defineImportSchema } from '@mcv/shared/import';

// ═══════════════════════════════════════════════════════════════════════════════
// Import from JSONL (one JSON object per line — ideal for streaming)
// ═══════════════════════════════════════════════════════════════════════════════

// File contents (events.jsonl):
// {"event":"pageview","timestamp":"2024-01-15T10:30:00Z","userId":"u123","page":"/pricing"}
// {"event":"click","timestamp":"2024-01-15T10:30:05Z","userId":"u123","element":"signup-btn"}
// {"event":"signup","timestamp":"2024-01-15T10:30:30Z","userId":"u123","plan":"pro"}

const eventSchema = defineImportSchema({
  columns: [
    { name: 'event',     type: 'enum',     values: ['pageview', 'click', 'signup', 'purchase'], required: true },
    { name: 'timestamp', type: 'datetime', required: true },
    { name: 'userId',    type: 'string',   required: true },
    { name: 'page',      type: 'url',      required: false },
    { name: 'element',   type: 'string',   required: false },
    { name: 'plan',      type: 'string',   required: false },
  ],
  strict: false,   // Allow extra fields (they'll be preserved in metadata)
});

const result = await importFromJson({
  file: jsonlBuffer,
  format: 'jsonl',
  schema: eventSchema,
  onError: 'skip',
  batchSize: 5000,
  ventureId: 'venture-uuid',
  userId: 'user-uuid',
});

console.log(`Events imported: ${result.successCount}`);
```

### Example 12: Import Wizard (React Client)

```tsx
import { ImportWizard } from '@mcv/shared/import/client';

// ═══════════════════════════════════════════════════════════════════════════════
// Full-featured import wizard with drag-drop, preview, mapping, and progress
// ═══════════════════════════════════════════════════════════════════════════════

function ContactImportPage({ ventureId }: { ventureId: string }) {
  return (
    <ImportWizard
      ventureId={ventureId}
      entityType="contacts"
      templateId="contact-template-uuid"  // Optional: pre-configured template
      allowedFormats={['csv', 'xlsx']}
      maxFileSize={50 * 1024 * 1024}      // 50MB limit
      onComplete={(result) => {
        toast.success(
          `Imported ${result.successCount} contacts` +
          (result.failedCount > 0 ? ` (${result.failedCount} errors)` : '')
        );
        router.push('/contacts');
      }}
      onError={(error) => {
        toast.error(`Import failed: ${error.message}`);
      }}
      steps={[
        'upload',     // File upload with drag-drop
        'mapping',    // Column mapping (with AI suggestions)
        'preview',    // Preview first 100 rows
        'configure',  // Duplicate strategy, error handling
        'import',     // Progress bar with real-time status
        'summary',    // Results summary with error download
      ]}
    />
  );
}
```

### Example 13: useImport Hook for Custom UI

```tsx
import { useImport, useColumnMapper } from '@mcv/shared/import/client';

// ═══════════════════════════════════════════════════════════════════════════════
// Build a custom import UI with hooks
// ═══════════════════════════════════════════════════════════════════════════════

function CustomImportUI({ ventureId }: { ventureId: string }) {
  const {
    upload,
    preview,
    startImport,
    cancel,
    isUploading,
    isImporting,
    previewData,
    importResult,
    progress,
    error,
  } = useImport({
    ventureId,
    entityType: 'products',
    schema: productSchema,
  });

  const {
    suggestions,
    mapping,
    setMapping,
    unmappedColumns,
    missingFields,
  } = useColumnMapper({
    sourceHeaders: previewData?.headers ?? [],
    schema: productSchema,
  });

  return (
    <div className="space-y-6">
      {/* Step 1: Upload */}
      <ImportDropzone
        onDrop={(file) => upload(file)}
        isLoading={isUploading}
        accept=".csv,.xlsx"
      />

      {/* Step 2: Column mapping */}
      {previewData && (
        <ColumnMapper
          suggestions={suggestions}
          mapping={mapping}
          onMappingChange={setMapping}
          unmapped={unmappedColumns}
          missing={missingFields}
        />
      )}

      {/* Step 3: Preview */}
      {previewData && (
        <ImportPreview
          rows={previewData.rows}
          errors={previewData.errors}
          warnings={previewData.warnings}
          validCount={previewData.validCount}
          invalidCount={previewData.invalidCount}
        />
      )}

      {/* Step 4: Import */}
      {isImporting && (
        <ImportProgress
          phase={progress?.phase ?? 'parsing'}
          percentage={progress?.percentage ?? 0}
          processedRows={progress?.processedRows ?? 0}
          totalRows={progress?.totalRows}
          errorsCollected={progress?.errorsCollected ?? 0}
          estimatedRemainingMs={progress?.estimatedRemainingMs}
          onCancel={cancel}
        />
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => preview()} disabled={!previewData}>
          Preview
        </Button>
        <Button onClick={() => startImport(mapping)} disabled={isImporting || !mapping}>
          Import
        </Button>
      </div>

      {/* Results */}
      {importResult && (
        <div className="p-4 border rounded-lg">
          <h3>Import Complete</h3>
          <p>Success: {importResult.successCount}</p>
          <p>Failed: {importResult.failedCount}</p>
          <p>Skipped: {importResult.skippedCount}</p>
          <p>Duration: {(importResult.durationMs / 1000).toFixed(1)}s</p>
        </div>
      )}
    </div>
  );
}
```

### Example 14: Retry Failed Import Job

```typescript
import { retryImportJob, getImportErrors } from '@mcv/shared/import';

// ═══════════════════════════════════════════════════════════════════════════════
// Get detailed errors from a failed job, then retry
// ═══════════════════════════════════════════════════════════════════════════════

const errors = await getImportErrors('failed-job-uuid', {
  limit: 50,
  offset: 0,
});

console.log(`Total errors: ${errors.total}`);
for (const err of errors.items) {
  console.log(`  Row ${err.row}: [${err.column}] ${err.message} — value: "${err.value}"`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Retry with adjusted settings (e.g., looser validation)
// ═══════════════════════════════════════════════════════════════════════════════

const retriedJob = await retryImportJob('failed-job-uuid', {
  onError: 'skip',           // Was 'stop', now skip bad rows
  batchSize: 500,            // Smaller batches for stability
});

console.log(`Retry job created: ${retriedJob.id}`);
```

### Example 15: Format Auto-Detection

```typescript
import { detectFormat, importFromFormat } from '@mcv/shared/import';

// ═══════════════════════════════════════════════════════════════════════════════
// Auto-detect format from file buffer (magic bytes + extension)
// ═══════════════════════════════════════════════════════════════════════════════

const format = detectFormat(fileBuffer, fileName);
// Checks: XLSX magic bytes (PK\x03\x04), BOM for encoding, extension fallback

console.log(`Detected format: ${format.format}`);     // 'csv' | 'xlsx' | 'json' | 'jsonl'
console.log(`Detected encoding: ${format.encoding}`);  // 'utf-8' | 'utf-16le' | etc.
console.log(`Confidence: ${format.confidence}`);        // 0-1

// ═══════════════════════════════════════════════════════════════════════════════
// Import with auto-detection (no format specified)
// ═══════════════════════════════════════════════════════════════════════════════

const result = await importFromFormat({
  file: unknownFileBuffer,
  // format: not specified — auto-detected
  schema: contactSchema,
  onError: 'collect',
  ventureId: 'venture-uuid',
  userId: 'user-uuid',
});
```

---

## Type Coercion Rules

The import pipeline applies automatic type coercion to convert raw string values from CSV/Excel into typed values:

| Column Type | Input Examples | Coerced Output | Notes |
|-------------|---------------|----------------|-------|
| `string` | `"  hello  "` | `"hello"` | Trimmed (if `trim: true`) |
| `number` | `"1,234.56"`, `"1.234,56"` | `1234.56` | Auto-detects decimal separator |
| `integer` | `"42"`, `"42.0"`, `"42.9"` | `42` | Truncates decimals |
| `decimal` | `"3.14159"` | `3.14159` | Preserves precision |
| `boolean` | `"yes"`, `"1"`, `"true"`, `"Y"` | `true` | Case-insensitive, configurable values |
| `boolean` | `"no"`, `"0"`, `"false"`, `"N"` | `false` | Configurable via `CoercionConfig` |
| `date` | `"2024-01-15"`, `"01/15/2024"`, `"15.01.2024"` | `"2024-01-15"` | ISO 8601 output |
| `datetime` | `"2024-01-15 10:30"`, `"Jan 15, 2024 10:30 AM"` | `"2024-01-15T10:30:00Z"` | ISO 8601 with timezone |
| `email` | `"  John@ACME.COM  "` | `"john@acme.com"` | Lowercased, trimmed, validated |
| `phone` | `"(555) 123-4567"`, `"+1-555-123-4567"` | `"+15551234567"` | E.164 format |
| `url` | `"example.com"` | `"https://example.com"` | Adds protocol if missing |
| `currency` | `"$1,234.56"`, `"1234.56 USD"`, `"€1.234,56"` | `123456` | Integer cents, symbol stripped |
| `percentage` | `"45%"`, `"0.45"`, `"45"` | `0.45` | Decimal (0-1) |
| `uuid` | `"abc-123-..."` | `"abc-123-..."` | Validated format only |
| `enum` | `"Active"` | `"active"` | Case-insensitive match against `values` |
| `json` | `'{"key":"val"}'` | `{ key: "val" }` | Parsed JSON object |

---

## Error Handling Strategies

### `onError: 'stop'` (Default)

Stops processing at the first error. Transaction rolls back. Best for critical imports where data integrity is paramount.

```
Row 1: ✓ Valid → committed
Row 2: ✓ Valid → committed
Row 3: ✗ Error → STOP, rollback rows 1-2
Result: 0 imported, 1 error
```

### `onError: 'skip'`

Skips invalid rows and continues processing. Valid rows are committed. Best for tolerant bulk imports.

```
Row 1: ✓ Valid → committed
Row 2: ✓ Valid → committed
Row 3: ✗ Error → skipped
Row 4: ✓ Valid → committed
Result: 3 imported, 1 skipped
```

### `onError: 'collect'`

Like `skip`, but collects all errors for reporting. Valid rows are committed, errors returned in result. Best for imports where you need a full error report.

```
Row 1: ✓ Valid → committed
Row 2: ✗ Error → collected
Row 3: ✓ Valid → committed
Row 4: ✗ Error → collected
Result: 2 imported, 2 errors (with full error details)
```

**Error collection limit:** Maximum `MAX_ERRORS_COLLECTED` (10,000) errors are collected. After that, errors are still counted but details are not stored (to prevent memory exhaustion).

---

## Performance Considerations

### Throughput Targets

| Operation | Small File (<1K rows) | Medium (1K-100K) | Large (100K-5M) |
|-----------|----------------------|-------------------|-----------------|
| Parse CSV | < 50ms | < 500ms | < 10s |
| Parse XLSX | < 200ms | < 2s | < 30s |
| Validate (per row) | < 0.1ms | < 0.1ms | < 0.1ms |
| Batch write (1000 rows) | < 100ms | < 100ms | < 100ms |
| Full pipeline | < 500ms | < 5s | < 5min |
| Preview (100 rows) | < 200ms | < 200ms | < 500ms |

### Memory Usage

| Mode | Memory Profile | Use Case |
|------|---------------|----------|
| **Buffer mode** | Full file in memory (~1x file size) | Files < 50MB |
| **Streaming mode** | ~50MB constant regardless of file size | Files 50MB-2GB+ |
| **Preview mode** | ~10MB (only first 100 rows + headers) | Any file size |

### Optimization Strategies

1. **Streaming by default** — Files over 50MB automatically use streaming mode
2. **Batched writes** — Rows are committed in configurable batches (default 1,000) to prevent long-running transactions
3. **Backpressure control** — Stream pauses when DB write queue is full, preventing memory spikes
4. **Index-deferred inserts** — For large imports, database indexes are deferred until after all batches complete
5. **Parallel validation** — CPU-bound validation runs on worker threads for files > 100K rows
6. **Lazy XLSX parsing** — Only the requested sheet is parsed; unused sheets are skipped entirely
7. **Header-only preview** — Format detection reads only the first 8KB of the file
8. **Error sampling** — Only first 100 errors stored in job record; full report written to S3 as CSV

### Database Considerations

```sql
-- For large imports, consider temporary index disable:
-- (Handled automatically when batchSize > 10,000)

-- Before import:
ALTER INDEX contacts_email_idx SET (fastupdate = off);

-- After import:
ALTER INDEX contacts_email_idx SET (fastupdate = on);
REINDEX INDEX contacts_email_idx;

-- Partitioned tables benefit from bulk loading:
-- Import module detects partitioned tables and routes inserts to correct partition
```

---

## Security Considerations

### File Validation

- **Magic byte verification** — File content is validated against declared format (prevents `.csv` file containing executable code)
- **File size limits** — Configurable max file size (default: 100MB, hard max: 2GB)
- **Row count limits** — Maximum 5,000,000 rows per import (configurable via `MAX_IMPORT_ROWS`)
- **Field size limits** — Individual field values capped at 1MB (prevents memory bombs from malformed CSV)
- **Encoding detection** — BOM-aware encoding detection; rejects files with invalid byte sequences
- **Formula injection prevention** — CSV fields starting with `=`, `+`, `-`, `@`, `\t`, `\r` are escaped to prevent Excel formula injection in error reports

### Data Privacy

- **Venture isolation** — All imports are scoped to a venture; cross-venture data access is impossible
- **No raw file retention** — Uploaded files are deleted after processing (configurable retention period)
- **PII awareness** — Import schemas can mark columns as PII; these are excluded from error samples and audit logs
- **Encrypted storage** — Import files stored in S3 with server-side encryption (AES-256)
- **Audit trail** — Every import is logged with who, what, when, row counts, and error summary

### Access Control

- **Permission required** — `import:create` permission needed to start imports
- **Rollback permission** — `import:rollback` permission required (separate from create)
- **Template management** — `import:template:manage` permission for creating/editing templates
- **Admin view** — `import:admin` permission to view all venture imports (not just own)
- **File download** — Error report URLs are pre-signed with 1-hour expiry

### Input Sanitization

```typescript
// All imported values are sanitized before DB insertion:
// 1. SQL injection: handled by parameterized queries (Drizzle ORM)
// 2. XSS: string values are HTML-escaped for UI display
// 3. Path traversal: file names are sanitized (alphanumeric + safe chars only)
// 4. JSON injection: JSONB fields are validated before storage
// 5. Null bytes: stripped from all string values
```

---

## Audit Events

| Event | Category | Description | Payload |
|-------|----------|-------------|---------|
| `import.job.created` | data | New import job created | `{ jobId, entityType, format, fileName, fileSizeBytes }` |
| `import.job.started` | data | Import processing began | `{ jobId, totalRows }` |
| `import.job.completed` | data | Import finished successfully | `{ jobId, successCount, failedCount, skippedCount, durationMs }` |
| `import.job.failed` | data | Import failed with error | `{ jobId, errorMessage, processedRows }` |
| `import.job.cancelled` | data | Import cancelled by user | `{ jobId, processedRows, cancelledBy }` |
| `import.rollback.started` | data | Rollback initiated | `{ jobId, importId, initiatedBy }` |
| `import.rollback.completed` | data | Rollback finished | `{ jobId, rolledBack, skipped }` |
| `import.rollback.failed` | data | Rollback failed | `{ jobId, errorMessage }` |
| `import.template.created` | admin | Import template created | `{ templateId, name, entityType }` |
| `import.template.updated` | admin | Import template modified | `{ templateId, name, changes }` |
| `import.template.deleted` | admin | Import template deleted | `{ templateId, name }` |
| `import.file.uploaded` | data | File uploaded for import | `{ fileName, fileSizeBytes, format }` |
| `import.file.deleted` | system | Uploaded file cleaned up | `{ fileName, fileUrl, retentionDays }` |
| `import.validation.summary` | data | Validation pass completed | `{ jobId, validRows, invalidRows, errorCount }` |
| `import.duplicate.summary` | data | Duplicate detection results | `{ jobId, inFile, inDatabase, strategy, resolved }` |

### Audit Event Structure

```typescript
// All import audit events follow the @mcv/audit event structure:
interface ImportAuditEvent {
  id: string;                    // Unique event ID
  ventureId: string;             // Venture scope
  userId: string;                // Acting user
  action: string;                // e.g., 'import.job.completed'
  category: 'data' | 'admin' | 'system';
  resource: {
    type: 'import_job' | 'import_template';
    id: string;                  // Resource ID
  };
  payload: Record<string, unknown>;  // Event-specific data
  ipAddress?: string;            // User's IP
  userAgent?: string;            // Browser/client info
  timestamp: string;             // ISO 8601
}
```

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# FILE HANDLING
# ═══════════════════════════════════════════════════════════════════════════════

# Maximum upload file size in bytes (default: 104857600 = 100MB)
IMPORT_MAX_FILE_SIZE=104857600

# Maximum rows per import (default: 5000000)
IMPORT_MAX_ROWS=5000000

# Maximum preview rows (default: 100)
IMPORT_MAX_PREVIEW_ROWS=100

# Supported file encodings (comma-separated, default: utf-8,utf-16le,latin1,ascii)
IMPORT_SUPPORTED_ENCODINGS=utf-8,utf-16le,latin1,ascii

# ═══════════════════════════════════════════════════════════════════════════════
# PROCESSING
# ═══════════════════════════════════════════════════════════════════════════════

# Default batch size for DB writes (default: 1000)
IMPORT_DEFAULT_BATCH_SIZE=1000

# Maximum errors to collect before stopping collection (default: 10000)
IMPORT_MAX_ERRORS=10000

# Threshold for auto-switching to streaming mode in bytes (default: 52428800 = 50MB)
IMPORT_STREAM_THRESHOLD=52428800

# Worker thread count for parallel validation (default: 4)
IMPORT_WORKER_THREADS=4

# Row count threshold for enabling parallel validation (default: 100000)
IMPORT_PARALLEL_THRESHOLD=100000

# ═══════════════════════════════════════════════════════════════════════════════
# STORAGE
# ═══════════════════════════════════════════════════════════════════════════════

# S3 bucket for uploaded import files
IMPORT_S3_BUCKET=mcv-imports

# S3 prefix for import files (default: imports/)
IMPORT_S3_PREFIX=imports/

# File retention period in days before cleanup (default: 30)
IMPORT_FILE_RETENTION_DAYS=30

# S3 bucket for error reports
IMPORT_ERROR_REPORT_BUCKET=mcv-imports

# Pre-signed URL expiry for error report downloads in seconds (default: 3600)
IMPORT_ERROR_REPORT_URL_EXPIRY=3600

# ═══════════════════════════════════════════════════════════════════════════════
# BACKGROUND JOBS
# ═══════════════════════════════════════════════════════════════════════════════

# Job polling interval in milliseconds (default: 1000)
IMPORT_JOB_POLL_INTERVAL=1000

# Maximum concurrent import jobs per venture (default: 3)
IMPORT_MAX_CONCURRENT_JOBS=3

# Job timeout in milliseconds (default: 3600000 = 1 hour)
IMPORT_JOB_TIMEOUT=3600000

# Stale job cleanup interval cron (default: every 6 hours)
IMPORT_CLEANUP_CRON="0 */6 * * *"

# ═══════════════════════════════════════════════════════════════════════════════
# AI-ASSISTED MAPPING
# ═══════════════════════════════════════════════════════════════════════════════

# Enable AI-powered column mapping suggestions (default: true)
IMPORT_AI_MAPPING_ENABLED=true

# Minimum confidence for auto-accepting AI mapping suggestion (default: 0.9)
IMPORT_AI_MAPPING_AUTO_ACCEPT_THRESHOLD=0.9

# Maximum headers to send to AI for mapping (default: 50)
IMPORT_AI_MAPPING_MAX_HEADERS=50
```

---

## Error Codes

### Parse Errors (IMPORT_PARSE_*)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `IMPORT_PARSE_ERROR` | Failed to parse file | Malformed file content | Check file format and encoding |
| `IMPORT_PARSE_ENCODING` | Unsupported file encoding | Encoding not in supported list | Convert file to UTF-8 |
| `IMPORT_PARSE_FORMAT` | Unable to detect file format | No magic bytes, wrong extension | Specify format explicitly |
| `IMPORT_PARSE_HEADERS` | No headers found in file | Empty file or missing header row | Add header row or specify `hasHeaders: false` |
| `IMPORT_PARSE_SHEET` | Sheet not found in workbook | Specified sheet name/index doesn't exist | Check sheet name/index |
| `IMPORT_PARSE_EMPTY` | File contains no data rows | Headers present but no data | Check file content |
| `IMPORT_PARSE_TOO_LARGE` | File exceeds maximum size | File > `MAX_FILE_SIZE` | Split into smaller files or increase limit |
| `IMPORT_PARSE_TOO_MANY_ROWS` | Row count exceeds maximum | Rows > `MAX_IMPORT_ROWS` | Split into smaller files or increase limit |
| `IMPORT_PARSE_FIELD_SIZE` | Field exceeds maximum size | Single field > `maxFieldSize` | Truncate field values |

### Validation Errors (IMPORT_VALID_*)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `IMPORT_VALID_REQUIRED` | Required field is missing | Column has `required: true` but value is empty/null | Provide value or make optional |
| `IMPORT_VALID_TYPE` | Invalid type | Value doesn't match expected `ColumnType` | Fix value format |
| `IMPORT_VALID_PATTERN` | Value doesn't match pattern | RegExp validation failed | Match expected pattern |
| `IMPORT_VALID_MIN` | Value below minimum | Number < `min` | Increase value |
| `IMPORT_VALID_MAX` | Value above maximum | Number > `max` | Decrease value |
| `IMPORT_VALID_MIN_LENGTH` | Value too short | String length < `minLength` | Lengthen value |
| `IMPORT_VALID_MAX_LENGTH` | Value too long | String length > `maxLength` | Truncate value |
| `IMPORT_VALID_ENUM` | Invalid enum value | Value not in `values` array | Use allowed value |
| `IMPORT_VALID_EMAIL` | Invalid email format | Email validation failed | Fix email address |
| `IMPORT_VALID_PHONE` | Invalid phone number | Phone parsing/validation failed | Use valid phone format |
| `IMPORT_VALID_URL` | Invalid URL format | URL validation failed | Fix URL format |
| `IMPORT_VALID_UUID` | Invalid UUID format | UUID regex validation failed | Use valid UUID |
| `IMPORT_VALID_DATE` | Invalid date format | Date parsing failed | Use recognizable date format |
| `IMPORT_VALID_JSON` | Invalid JSON | JSON.parse() failed | Fix JSON syntax |
| `IMPORT_VALID_CUSTOM` | Custom validation failed | `validate` function returned error | Fix according to custom rule |
| `IMPORT_VALID_ROW` | Row-level validation failed | `validateRow` returned errors | Fix cross-field issues |
| `IMPORT_VALID_UNKNOWN_COL` | Unknown column (strict mode) | Column not in schema, `strict: true` | Remove column or add to schema |

### Duplicate Errors (IMPORT_DUP_*)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `IMPORT_DUP_IN_FILE` | Duplicate within import file | Same key appears multiple times | Remove duplicate rows |
| `IMPORT_DUP_IN_DB` | Duplicate of existing record | Key matches existing DB record | Change strategy or update key |
| `IMPORT_DUP_MERGE_FAIL` | Failed to merge duplicate | Merge conflict on required field | Resolve merge conflict |

### Job Errors (IMPORT_JOB_*)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `IMPORT_JOB_NOT_FOUND` | Import job not found | Invalid job ID | Check job ID |
| `IMPORT_JOB_ALREADY_RUNNING` | Job is already running | Attempted to start running job | Wait for completion |
| `IMPORT_JOB_CANCELLED` | Job was cancelled | User cancelled the job | Retry if needed |
| `IMPORT_JOB_TIMEOUT` | Job timed out | Exceeded `IMPORT_JOB_TIMEOUT` | Increase timeout or split file |
| `IMPORT_JOB_MAX_CONCURRENT` | Too many concurrent jobs | Venture hit `IMPORT_MAX_CONCURRENT_JOBS` | Wait for existing jobs |
| `IMPORT_JOB_RETRY_INVALID` | Cannot retry this job | Job not in failed state | Only failed jobs can be retried |

### Rollback Errors (IMPORT_ROLLBACK_*)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `IMPORT_ROLLBACK_NOT_FOUND` | Import not found for rollback | Invalid import ID | Check import ID |
| `IMPORT_ROLLBACK_ALREADY` | Import already rolled back | Rollback was already performed | No action needed |
| `IMPORT_ROLLBACK_MODIFIED` | Record modified since import | Entity was updated after import | Manual intervention required |
| `IMPORT_ROLLBACK_PARTIAL` | Partial rollback completed | Some records couldn't be rolled back | Review skipped records |

### Permission Errors (IMPORT_AUTH_*)

| Code | Message | Cause | Resolution |
|------|---------|-------|------------|
| `IMPORT_AUTH_DENIED` | Import permission denied | Missing `import:create` permission | Grant permission |
| `IMPORT_AUTH_ROLLBACK_DENIED` | Rollback permission denied | Missing `import:rollback` permission | Grant permission |
| `IMPORT_AUTH_TEMPLATE_DENIED` | Template management denied | Missing `import:template:manage` permission | Grant permission |
| `IMPORT_AUTH_VENTURE` | Venture access denied | User doesn't belong to venture | Check venture membership |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `papaparse` | ^5.x | CSV parsing with streaming support, delimiter auto-detection |
| `exceljs` | ^4.x | XLSX reading/writing with streaming WorkbookReader |
| `chardet` | ^2.x | Character encoding auto-detection |
| `zod` | ^3.x | Schema validation and type coercion |
| `drizzle-orm` | ^0.29.x | Database ORM for job/record/template tables |
| `@aws-sdk/client-s3` | ^3.x | File upload/download for import files and error reports |
| `@aws-sdk/s3-request-presigner` | ^3.x | Pre-signed URL generation for error report downloads |
| `uuid` | ^9.x | Import ID and job ID generation |
| `libphonenumber-js` | ^1.x | Phone number parsing and E.164 normalization |
| `date-fns` | ^3.x | Date parsing and formatting with locale support |
| `fast-levenshtein` | ^3.x | Fuzzy string matching for column mapping suggestions |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.x | Client hooks and components |
| `@mcv/audit` | workspace | Audit event emission |
| `@mcv/storage` | workspace | S3 file upload/download |
| `@mcv/realtime` | workspace | WebSocket progress updates |
| `@mcv/intelligence/gateway` | workspace | AI-assisted column mapping |

---

## Testing Notes

### Unit Testing

```typescript
import { defineImportSchema, validateRow, coerceValue, detectFormat } from '@mcv/shared/import';

// ═══════════════════════════════════════════════════════════════════════════════
// Schema & Validation Tests
// ═══════════════════════════════════════════════════════════════════════════════

describe('defineImportSchema', () => {
  it('should create schema with column definitions', () => {
    const schema = defineImportSchema({
      columns: [
        { name: 'email', type: 'email', required: true },
        { name: 'age', type: 'integer', min: 0, max: 150 },
      ],
    });

    expect(schema.columns).toHaveLength(2);
    expect(schema.columns[0].required).toBe(true);
  });
});

describe('validateRow', () => {
  const schema = defineImportSchema({
    columns: [
      { name: 'email', type: 'email', required: true },
      { name: 'name', type: 'string', required: true, minLength: 2 },
      { name: 'age', type: 'integer', min: 0, max: 150 },
    ],
  });

  it('should pass valid rows', () => {
    const result = validateRow(
      { email: 'john@example.com', name: 'John', age: '30' },
      schema,
      1
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid email', () => {
    const result = validateRow(
      { email: 'not-an-email', name: 'John', age: '30' },
      schema,
      1
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('IMPORT_VALID_EMAIL');
  });

  it('should reject missing required fields', () => {
    const result = validateRow(
      { email: 'john@example.com', name: '', age: '30' },
      schema,
      1
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('IMPORT_VALID_REQUIRED');
  });

  it('should enforce min/max on numbers', () => {
    const result = validateRow(
      { email: 'john@example.com', name: 'John', age: '-5' },
      schema,
      1
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('IMPORT_VALID_MIN');
  });
});

describe('coerceValue', () => {
  it('should coerce currency strings to cents', () => {
    expect(coerceValue('$1,234.56', 'currency')).toBe(123456);
    expect(coerceValue('€1.234,56', 'currency', { decimalSeparator: ',' })).toBe(123456);
  });

  it('should coerce percentage strings to decimals', () => {
    expect(coerceValue('45%', 'percentage')).toBe(0.45);
    expect(coerceValue('0.45', 'percentage')).toBe(0.45);
  });

  it('should coerce boolean strings', () => {
    expect(coerceValue('yes', 'boolean')).toBe(true);
    expect(coerceValue('0', 'boolean')).toBe(false);
    expect(coerceValue('TRUE', 'boolean')).toBe(true);
  });

  it('should normalize phone numbers to E.164', () => {
    expect(coerceValue('(555) 123-4567', 'phone')).toBe('+15551234567');
    expect(coerceValue('+44 20 7946 0958', 'phone', { phoneCountry: 'GB' })).toBe('+442079460958');
  });

  it('should parse dates in multiple formats', () => {
    expect(coerceValue('01/15/2024', 'date')).toBe('2024-01-15');
    expect(coerceValue('15.01.2024', 'date', { dateFormat: 'eu' })).toBe('2024-01-15');
    expect(coerceValue('2024-01-15', 'date')).toBe('2024-01-15');
  });
});

describe('detectFormat', () => {
  it('should detect CSV from content', () => {
    const csv = Buffer.from('name,email\nJohn,john@example.com\n');
    expect(detectFormat(csv, 'data.csv').format).toBe('csv');
  });

  it('should detect XLSX from magic bytes', () => {
    const xlsx = Buffer.from([0x50, 0x4B, 0x03, 0x04]); // PK\x03\x04
    expect(detectFormat(xlsx, 'data.xlsx').format).toBe('xlsx');
  });

  it('should detect JSON from content', () => {
    const json = Buffer.from('[{"name":"John"}]');
    expect(detectFormat(json, 'data.json').format).toBe('json');
  });

  it('should detect JSONL from content', () => {
    const jsonl = Buffer.from('{"name":"John"}\n{"name":"Jane"}\n');
    expect(detectFormat(jsonl, 'data.jsonl').format).toBe('jsonl');
  });
});
```

### Integration Testing

```typescript
import { processImport, previewImport, rollbackImport, createImportJob, getImportJob } from '@mcv/shared/import';

describe('Import Pipeline E2E', () => {
  it('should import CSV file and produce correct results', async () => {
    const csv = Buffer.from(
      'email,name,age\n' +
      'john@example.com,John,30\n' +
      'jane@example.com,Jane,25\n' +
      'invalid-email,Bob,28\n'
    );

    const schema = defineImportSchema({
      columns: [
        { name: 'email', type: 'email', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'age', type: 'integer' },
      ],
    });

    const result = await processImport({
      file: csv,
      format: 'csv',
      schema,
      onError: 'collect',
      ventureId: testVentureId,
      userId: testUserId,
    });

    expect(result.totalRows).toBe(3);
    expect(result.successCount).toBe(2);
    expect(result.failedCount).toBe(1);
    expect(result.errors[0].row).toBe(3);
    expect(result.errors[0].code).toBe('IMPORT_VALID_EMAIL');
    expect(result.importId).toBeTruthy();
    expect(result.durationMs).toBeGreaterThan(0);
  });

  it('should preview without committing data', async () => {
    const preview = await previewImport({
      file: csvBuffer,
      schema: contactSchema,
    });

    expect(preview.format).toBe('csv');
    expect(preview.headers).toEqual(['email', 'name', 'age']);
    expect(preview.rows.length).toBeLessThanOrEqual(100);
    expect(preview.suggestedMapping.length).toBeGreaterThan(0);

    // Verify no data was committed
    const dbCount = await db.select({ count: sql`count(*)` }).from(contacts);
    expect(dbCount[0].count).toBe(0);
  });

  it('should rollback a completed import', async () => {
    // Import
    const result = await processImport({
      file: csvBuffer,
      schema: contactSchema,
      onError: 'skip',
      ventureId: testVentureId,
      userId: testUserId,
    });
    expect(result.successCount).toBeGreaterThan(0);

    // Rollback
    const rollback = await rollbackImport(result.importId!);
    expect(rollback.rolledBack).toBe(result.successCount);
    expect(rollback.skipped).toBe(0);

    // Verify data was removed
    const dbCount = await db.select({ count: sql`count(*)` }).from(contacts);
    expect(dbCount[0].count).toBe(0);
  });

  it('should handle duplicate detection correctly', async () => {
    // Import initial data
    await processImport({
      file: csvWithContacts,
      schema: contactSchema,
      ventureId: testVentureId,
      userId: testUserId,
    });

    // Import again with dedup
    const result = await processImport({
      file: csvWithContacts,
      schema: contactSchema,
      duplicates: {
        keys: ['email'],
        strategy: 'skip',
        checkExisting: true,
        caseInsensitive: true,
      },
      ventureId: testVentureId,
      userId: testUserId,
    });

    expect(result.skippedCount).toBe(result.totalRows);
    expect(result.duplicates.inDatabase).toBe(result.totalRows);
  });

  it('should run background import job to completion', async () => {
    const job = await createImportJob({
      file: largeCsvBuffer,
      format: 'csv',
      schema: contactSchema,
      entityType: 'contacts',
      ventureId: testVentureId,
      userId: testUserId,
    });

    expect(job.status).toBe('pending');

    // Wait for completion (with timeout)
    let status: ImportJob;
    const timeout = Date.now() + 30000;
    do {
      await new Promise((r) => setTimeout(r, 500));
      status = await getImportJob(job.id);
    } while (!['completed', 'failed'].includes(status.status) && Date.now() < timeout);

    expect(status.status).toBe('completed');
    expect(status.successCount).toBeGreaterThan(0);
    expect(status.progress).toBe(100);
  });
});
```

---

## File Structure

```
packages/shared/src/import/
├── index.ts                    # Re-exports everything
├── constants.ts                # MAX_FILE_SIZE, IMPORT_FORMATS, etc.
├── types.ts                    # All TypeScript interfaces & types
│
├── formats/
│   ├── index.ts                # Format exports
│   ├── csv-parser.ts           # CSV parsing with papaparse
│   ├── excel-parser.ts         # XLSX parsing with exceljs
│   ├── json-parser.ts          # JSON/JSONL parsing
│   ├── format-detector.ts      # Magic byte + extension detection
│   └── encoding-detector.ts    # BOM + chardet encoding detection
│
├── validation/
│   ├── index.ts                # Validation exports
│   ├── schema.ts               # defineImportSchema
│   ├── row-validator.ts        # validateRow, validateHeaders
│   ├── coercion.ts             # Type coercion engine
│   └── rules/
│       ├── email.ts            # Email validation
│       ├── phone.ts            # Phone validation + E.164
│       ├── date.ts             # Date parsing (multi-format)
│       ├── currency.ts         # Currency string → cents
│       └── url.ts              # URL validation + normalization
│
├── mapping/
│   ├── index.ts                # Mapping exports
│   ├── column-mapper.ts        # defineColumnMapping, applyMapping
│   ├── auto-mapper.ts          # autoMapColumns (fuzzy + AI)
│   └── suggestions.ts         # suggestMapping (Levenshtein + alias)
│
├── duplicates/
│   ├── index.ts                # Duplicate exports
│   ├── detector.ts             # detectDuplicates (in-file + DB)
│   └── resolver.ts             # resolveDuplicates (skip/merge/overwrite)
│
├── processing/
│   ├── index.ts                # Processing exports
│   ├── pipeline.ts             # processImport (main orchestrator)
│   ├── preview.ts              # previewImport
│   ├── batch-writer.ts         # batchImport (batched DB writes)
│   ├── stream-processor.ts     # streamImport (backpressure-controlled)
│   ├── rollback.ts             # rollbackImport
│   └── error-collector.ts      # Error collection with limits
│
├── jobs/
│   ├── index.ts                # Job exports
│   ├── job-manager.ts          # createImportJob, getImportJob, etc.
│   ├── job-worker.ts           # Background job processor
│   └── job-cleanup.ts          # Stale job cleanup cron
│
├── templates/
│   ├── index.ts                # Template exports
│   ├── template-manager.ts     # CRUD for import templates
│   └── sample-generator.ts     # generateSampleFile
│
├── client/
│   ├── hooks/
│   │   ├── use-import.ts       # Main import hook
│   │   ├── use-import-job.ts   # Job polling hook
│   │   └── use-column-mapper.ts # Column mapping hook
│   └── components/
│       ├── import-wizard.tsx    # Full wizard component
│       ├── import-dropzone.tsx  # File upload dropzone
│       ├── import-preview.tsx   # Preview table
│       ├── import-progress.tsx  # Progress bar
│       └── column-mapper.tsx    # Column mapping UI
│
└── __tests__/
    ├── validation.test.ts      # Schema & coercion tests
    ├── csv-parser.test.ts      # CSV parsing tests
    ├── excel-parser.test.ts    # XLSX parsing tests
    ├── duplicates.test.ts      # Duplicate detection tests
    ├── pipeline.test.ts        # Full pipeline integration tests
    ├── rollback.test.ts        # Rollback tests
    ├── jobs.test.ts            # Background job tests
    ├── mapping.test.ts         # Column mapping tests
    └── fixtures/
        ├── contacts.csv        # Test CSV files
        ├── products.xlsx       # Test Excel files
        ├── events.jsonl        # Test JSONL files
        └── malformed.csv       # Edge case test files
```

---

## Related Modules

| Module | Relationship | Description |
|--------|-------------|-------------|
| `@mcv/audit` | Consumer | Emits audit events for all import operations |
| `@mcv/storage` | Consumer | Uploads import files and error reports to S3 |
| `@mcv/realtime` | Consumer | Pushes progress updates via WebSocket |
| `@mcv/intelligence/gateway` | Consumer | AI-assisted column mapping suggestions |
| `@mcv/shared/export` | Sibling | Export counterpart — uses same schemas for round-trip |
| `@mcv/tenants` | Consumer | Venture context for multi-tenant isolation |
| `@mcv/permissions` | Consumer | Permission checks for import operations |
| `@mcv/notifications` | Consumer | Sends notifications on job completion/failure |

---

## Migration Path

### Phase 1 (Current): MCV-Internal
- Full feature set available within MCV admin and venture apps
- Templates pre-configured for common entity types (contacts, products, transactions)
- Background jobs for files > 10K rows

### Phase 2 (Q3 2026): PUBLISHABLE
- Standalone `@mcv/import` npm package
- Framework-agnostic core (no React dependency for server-side)
- Plugin system for custom formats (TSV, XML, etc.)
- Webhook callbacks for job status changes
- OpenAPI spec for import API endpoints

---

*@mcv/shared/import — Data Import & Validation Pipeline*
