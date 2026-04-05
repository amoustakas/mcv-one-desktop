# @mcv/shared/templates — Template Engine Module

**Parent Package:** @mcv/shared  
**Tier:** 2.5 (Shared Business Utilities)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Purpose

The `templates` module provides a unified template engine for generating emails, documents, notifications, SMS messages, and Slack messages across the MCV ecosystem. It handles variable interpolation via Handlebars syntax, conditional logic, iteration, partials, helper functions, template inheritance through layouts, safe auto-escaping, preview rendering with sample data, and full version history tracking.

**Every outbound communication in MCV — from welcome emails to PDF invoices to push notifications — is rendered through this engine.**

### Why a Unified Template Engine?

Without this module, each MCV venture would implement its own ad-hoc string concatenation for emails, notifications, and documents. This leads to XSS vulnerabilities, inconsistent formatting, no version history, and duplicated rendering logic across services. The templates module solves all of this:

1. **Single rendering pipeline** — One engine for all output formats (email, SMS, Slack, PDF, push)
2. **Safe by default** — Auto-escaping prevents XSS; sandbox prevents code execution
3. **Version history** — Every edit creates an immutable version; rollback to any point
4. **Multi-tenant isolation** — Templates are scoped per-venture; no cross-contamination
5. **Locale-aware** — Same template slug resolves to locale-specific content automatically
6. **Admin UI integration** — React components for visual editing with live preview
7. **Performance** — Pre-compilation, caching, and batch rendering for high-volume sends

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  render,                    // Synchronous template render
  renderAsync,               // Async render (partials, helpers)
  compile,                   // Pre-compile template for reuse
  renderEmail,               // Render email (subject + html + text)
  renderDocument,            // Render document template
  renderNotification,        // Render notification template
  renderSms,                 // Render SMS template
  renderSlack,               // Render Slack block kit template
} from './server/services/render-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createTemplate,            // Create new template
  updateTemplate,            // Update template content
  getTemplate,               // Get template by ID or slug
  listTemplates,             // List templates with filters
  deleteTemplate,            // Soft-delete template
  duplicateTemplate,         // Clone template
  getTemplateVersion,        // Get specific version
  listTemplateVersions,      // List version history
  restoreTemplateVersion,    // Restore previous version
} from './server/services/template-service';

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUTS & PARTIALS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createLayout,              // Create base layout
  getLayout,                 // Get layout by ID
  listLayouts,               // List available layouts
  updateLayout,              // Update layout content
  deleteLayout,              // Soft-delete layout
  registerPartial,           // Register reusable partial
  getPartial,                // Get partial by name
  listPartials,              // List registered partials
  updatePartial,             // Update partial content
  deletePartial,             // Remove partial
} from './server/services/layout-service';

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  registerHelper,            // Register custom helper function
  unregisterHelper,          // Remove helper
  listHelpers,               // List registered helpers
  getHelper,                 // Get helper by name
  BUILT_IN_HELPERS,          // Default helpers (date, currency, etc.)
} from './server/services/helper-service';

// ═══════════════════════════════════════════════════════════════════════════════
// PREVIEW & TESTING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  preview,                   // Render template with sample data
  getSampleData,             // Get sample data for template type
  validateTemplate,          // Validate template syntax
  extractVariables,          // Extract variables from template body
  diffVersions,              // Diff two template versions
} from './server/services/preview-service';

// ═══════════════════════════════════════════════════════════════════════════════
// MJML (Email)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  compileMjml,               // Compile MJML to responsive HTML
  validateMjml,              // Validate MJML syntax
  mjmlToText,                // Convert MJML to plain text fallback
} from './server/services/mjml-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useTemplateEditor } from './client/hooks/use-template-editor';
export { useTemplatePreview } from './client/hooks/use-template-preview';
export { useTemplateList } from './client/hooks/use-template-list';
export { useTemplateVersions } from './client/hooks/use-template-versions';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { TemplateEditor } from './client/components/template-editor';
export { TemplatePreview } from './client/components/template-preview';
export { TemplatePicker } from './client/components/template-picker';
export { VariableInspector } from './client/components/variable-inspector';
export { VersionHistory } from './client/components/version-history';
export { TemplateDiffView } from './client/components/template-diff-view';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  TEMPLATE_TYPES,
  MAX_TEMPLATE_SIZE,
  MAX_VARIABLE_DEPTH,
  MAX_PARTIALS_PER_TEMPLATE,
  MAX_HELPERS_PER_TEMPLATE,
  MAX_LOOP_ITERATIONS,
  MAX_RENDER_TIME_MS,
  DEFAULT_LOCALE,
  SUPPORTED_FORMATS,
  SMS_SEGMENT_SIZE,
  SMS_UNICODE_SEGMENT_SIZE,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Template,
  TemplateType,
  TemplateVariable,
  TemplateVersion,
  TemplateFilter,
  RenderContext,
  RenderResult,
  RenderOptions,
  CompiledTemplate,
  Layout,
  Partial,
  HelperFunction,
  HelperDefinition,
  HelperCategory,
  TemplateValidation,
  ValidationError,
  PreviewResult,
  PreviewOptions,
  EmailRenderResult,
  SmsRenderResult,
  NotificationRenderResult,
  DocumentRenderResult,
  SlackRenderResult,
  SlackBlock,
  VersionDiff,
  TemplateCreateInput,
  TemplateUpdateInput,
  LayoutCreateInput,
  PartialCreateInput,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           TEMPLATE ENGINE ARCHITECTURE                                │
│                                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            CONSUMERS                                           │   │
│  │                                                                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │  Email Send  │  │  PDF Export  │  │ Notifications│  │  SMS/Slack   │      │   │
│  │  │ (connectors) │  │  (export)    │  │  (fabric)    │  │ (connectors) │      │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │   │
│  │         │                 │                 │                  │               │   │
│  │  ┌──────┴───────┐  ┌─────┴────────┐  ┌─────┴────────┐  ┌─────┴────────┐     │   │
│  │  │  Admin UI    │  │  Cron Jobs   │  │ NAOS Agents  │  │  Webhooks    │     │   │
│  │  │ (template    │  │ (scheduled   │  │ (AI-driven   │  │ (event-      │     │   │
│  │  │  editor)     │  │  digests)    │  │  messages)   │  │  triggered)  │     │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │   │
│  │         │                 │                 │                  │               │   │
│  │         └─────────────────┴─────────────────┴──────────────────┘               │   │
│  │                                    │                                           │   │
│  └────────────────────────────────────┼───────────────────────────────────────────┘   │
│                                       │                                               │
│  ┌────────────────────────────────────▼───────────────────────────────────────────┐   │
│  │                         RENDER PIPELINE                                         │   │
│  │                                                                                 │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │   │
│  │  │   1.      │  │   2.      │  │   3.      │  │   4.      │  │   5.      │   │   │
│  │  │ Resolve   │─▶│ Validate  │─▶│ Compile   │─▶│ Inject    │─▶│ Execute   │   │   │
│  │  │ Template  │  │ Variables │  │ Handlebars│  │ Helpers & │  │ Template  │   │   │
│  │  │           │  │           │  │           │  │ Partials  │  │           │   │   │
│  │  │ • By slug │  │ • Type    │  │ • Parse   │  │ • Built-in│  │ • Render  │   │   │
│  │  │ • By ID   │  │ • Required│  │ • Cache   │  │ • Custom  │  │ • Escape  │   │   │
│  │  │ • Inline  │  │ • Depth   │  │ • AST     │  │ • Partials│  │ • Iterate │   │   │
│  │  │ • Locale  │  │ • Format  │  │ • Optimize│  │ • Layouts │  │ • Output  │   │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └─────┬─────┘   │   │
│  │                                                                     │          │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌────▼──────┐   │   │
│  │  │  10.      │  │   9.      │  │   8.      │  │   7.      │  │   6.      │   │   │
│  │  │  Return   │◀─│  Audit    │◀─│ Sanitize  │◀─│ Localize  │◀─│ Post-     │   │   │
│  │  │  Result   │  │  Log      │  │ Output    │  │ Content   │  │ Process   │   │   │
│  │  │           │  │           │  │           │  │           │  │           │   │   │
│  │  │ • HTML    │  │ • Event   │  │ • Strip   │  │ • i18n    │  │ • MJML    │   │   │
│  │  │ • Text    │  │ • Metrics │  │   unsafe  │  │ • Dates   │  │ • Inline  │   │   │
│  │  │ • Blocks  │  │ • Trace   │  │ • Validate│  │ • Numbers │  │   CSS     │   │   │
│  │  │ • Subject │  │ • Timing  │  │   output  │  │ • Currency│  │ • Minify  │   │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘   │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         TEMPLATE RESOLUTION                                      │   │
│  │                                                                                  │   │
│  │  Request: renderEmail('order-confirmation', { ventureId, locale: 'es-ES', ... })│   │
│  │                                                                                  │   │
│  │  Resolution Chain:                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │ 1. Exact match: venture + slug + type + locale (es-ES)                  │    │   │
│  │  │    → Found? Use it.                                                     │    │   │
│  │  │                                                                         │    │   │
│  │  │ 2. Language fallback: venture + slug + type + language (es)             │    │   │
│  │  │    → Found? Use it.                                                     │    │   │
│  │  │                                                                         │    │   │
│  │  │ 3. Default locale: venture + slug + type + DEFAULT_LOCALE (en-US)      │    │   │
│  │  │    → Found? Use it.                                                     │    │   │
│  │  │                                                                         │    │   │
│  │  │ 4. Global default: system + slug + type + DEFAULT_LOCALE               │    │   │
│  │  │    → Found? Use it.                                                     │    │   │
│  │  │                                                                         │    │   │
│  │  │ 5. Not found → throw TEMPLATE_NOT_FOUND error                          │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         STORAGE LAYER                                            │   │
│  │                                                                                  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │   │
│  │  │    templates    │  │     layouts     │  │    partials     │                 │   │
│  │  │                 │  │                 │  │                 │                 │   │
│  │  │ Per-venture     │  │ Base layouts    │  │ Reusable        │                 │   │
│  │  │ templates with  │  │ with {{> @con- │  │ template        │                 │   │
│  │  │ version history │  │ tent}} blocks   │  │ fragments       │                 │   │
│  │  │ & locale keys   │  │ for inheritance │  │ (headers, etc.) │                 │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                 │   │
│  │           │                    │                     │                           │   │
│  │  ┌────────▼────────────────────▼─────────────────────▼────────┐                 │   │
│  │  │                  template_versions                          │                 │   │
│  │  │                                                            │                 │   │
│  │  │  Immutable version history for every template edit.         │                 │   │
│  │  │  Supports rollback to any previous version.                 │                 │   │
│  │  │  Stores full body snapshot (not diffs) for instant restore. │                 │   │
│  │  └────────────────────────────────────────────────────────────┘                 │   │
│  │                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         CACHE LAYER                                              │   │
│  │                                                                                  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │   │
│  │  │  Compiled TPL   │  │  Layout Cache   │  │  MJML Cache     │                 │   │
│  │  │  Cache          │  │                 │  │                 │                 │   │
│  │  │  In-memory LRU  │  │  Resolved       │  │  MJML → HTML    │                 │   │
│  │  │  Handlebars AST │  │  layouts with   │  │  compilation    │                 │   │
│  │  │  per venture    │  │  merged partials│  │  results cached │                 │   │
│  │  │  TTL: 1 hour    │  │  TTL: 1 hour   │  │  TTL: 24 hours  │                 │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │   │
│  │                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Template Types

| Type | Purpose | Output Format | Typical Use | Size Awareness |
|------|---------|---------------|-------------|----------------|
| `email` | Transactional & marketing emails | HTML + plain text | Welcome, receipts, invoices, password reset | MJML responsive, inline CSS |
| `notification` | In-app / push notifications | Title + body + data payload | Alerts, reminders, updates, order status | Title ≤65 chars, body ≤240 chars |
| `document` | Printable documents | HTML (PDF-ready) | Invoices, contracts, reports, statements | Page breaks, print CSS |
| `sms` | SMS messages | Plain text (segment-aware) | Verification codes, alerts, confirmations | GSM-7: 160 chars, Unicode: 70 chars |
| `slack` | Slack messages | Block Kit JSON | Reports, notifications, dashboards | Block Kit structure validation |

### Template Type Resolution Rules

```
email       → Requires: subject, body (HTML). Optional: bodyPlain, bodyMjml, layoutId.
notification → Requires: body. Optional: subject (used as title), metadata.data.
document    → Requires: body (HTML). Optional: layoutId (for headers/footers).
sms         → Requires: body (plain text). Enforced: no HTML, segment counting.
slack       → Requires: body (Block Kit JSON template). Validated against Slack schema.
```

---

## Core Interfaces

### Template

```typescript
interface Template {
  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════

  /** UUID primary key */
  id: UUID;

  /** Owning venture — templates are always venture-scoped */
  ventureId: VentureID;

  /** Template type determines rendering pipeline and validation rules */
  type: TemplateType;

  /** Human-readable display name (e.g., "Order Confirmation Email") */
  name: string;

  /** URL-safe unique identifier per venture+type+locale (e.g., "order-confirmation") */
  slug: string;

  /** Optional description for admin UI */
  description?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  /** Email subject line template (Handlebars-enabled) */
  subject?: string;

  /** Primary template body (Handlebars syntax) */
  body: string;

  /** Plain text fallback (emails, SMS) */
  bodyPlain?: string;

  /** MJML source for responsive email rendering (compiled to body on save) */
  bodyMjml?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  /** BCP 47 locale tag (e.g., 'en-US', 'fr-CA', 'es-ES') */
  locale: string;

  /** Declared variables with types, defaults, and sample values */
  variables: TemplateVariable[];

  /** Names of helpers this template requires (validated on save) */
  helpers: string[];

  /** Base layout UUID for template inheritance (null = standalone) */
  layoutId?: UUID;

  /** Tags for organization and filtering (e.g., ['transactional', 'onboarding']) */
  tags: string[];

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS & VERSION
  // ═══════════════════════════════════════════════════════════════════════════

  /** Current version number (auto-incremented on update) */
  version: number;

  /** Whether this template is available for rendering */
  isActive: boolean;

  /** Default template for this type+locale combination */
  isDefault: boolean;

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT
  // ═══════════════════════════════════════════════════════════════════════════

  /** User who created this template */
  createdBy: UserID;

  /** User who last modified this template */
  updatedBy: UserID;

  /** Creation timestamp */
  createdAt: ISOTimestamp;

  /** Last modification timestamp */
  updatedAt: ISOTimestamp;

  /** Soft delete timestamp (null = active) */
  deletedAt: ISOTimestamp | null;

  /** Arbitrary metadata for venture-specific extensions */
  metadata: Record<string, unknown>;
}

type TemplateType = 'email' | 'notification' | 'document' | 'sms' | 'slack';
```

### TemplateVariable

```typescript
interface TemplateVariable {
  /** Dot-notation path (e.g., 'customer.name', 'items', 'order.total') */
  name: string;

  /** Data type for validation and sample data generation */
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

  /** Whether rendering should fail if this variable is missing */
  required: boolean;

  /** Default value if not provided (used in non-strict mode) */
  defaultValue?: unknown;

  /** Human-readable description for the admin UI */
  description: string;

  /** Sample value for preview rendering */
  sampleValue?: unknown;

  /** For array types: the shape of each array element */
  itemSchema?: TemplateVariable[];

  /** For object types: nested property definitions */
  properties?: TemplateVariable[];

  /** Validation pattern (regex) for string types */
  pattern?: string;

  /** Minimum value (number) or length (string/array) */
  min?: number;

  /** Maximum value (number) or length (string/array) */
  max?: number;
}
```

### RenderContext

```typescript
interface RenderContext {
  /** Venture scope for template resolution */
  ventureId: VentureID;

  /** BCP 47 locale for template resolution and helper formatting */
  locale: string;

  /** Data variables to inject into the template */
  variables: Record<string, unknown>;

  /** Additional helpers beyond built-ins (venture-specific) */
  helpers?: Record<string, HelperFunction>;

  /** Additional partials beyond registered ones */
  partials?: Record<string, string>;

  /** Override the template's configured layoutId */
  layout?: string | UUID;

  /** HTML-escape variable output (default: true) */
  escapeHtml?: boolean;

  /** Throw on missing required variables (default: false) */
  strictMode?: boolean;

  /** Maximum render time in milliseconds (default: 5000) */
  timeoutMs?: number;

  /** Trace ID for distributed tracing */
  traceId?: string;

  /** User ID for audit attribution */
  userId?: string;
}

interface RenderOptions {
  /** Skip MJML compilation (return raw Handlebars output) */
  skipMjml?: boolean;

  /** Skip CSS inlining for email templates */
  skipInlineCss?: boolean;

  /** Include render timing metadata in result */
  includeTiming?: boolean;

  /** Minify HTML output */
  minify?: boolean;

  /** Generate plain text from HTML (auto-strip tags) */
  autoPlainText?: boolean;
}
```

### RenderResult

```typescript
interface RenderResult {
  /** Rendered HTML content */
  html: string;

  /** Plain text version (auto-generated or from bodyPlain) */
  text?: string;

  /** Rendered subject line (emails) */
  subject?: string;

  /** Additional metadata from template */
  metadata?: Record<string, unknown>;

  /** Time spent rendering in milliseconds */
  renderTimeMs: number;

  /** Warnings generated during rendering (missing optional vars, etc.) */
  warnings: RenderWarning[];

  /** Template version that was rendered */
  templateVersion: number;

  /** Template ID that was resolved */
  templateId: UUID;

  /** Locale that was actually used (may differ from requested due to fallback) */
  resolvedLocale: string;
}

interface RenderWarning {
  /** Warning code (e.g., 'MISSING_VARIABLE', 'DEPRECATED_HELPER') */
  code: string;

  /** Human-readable warning message */
  message: string;

  /** Line number in template where warning occurred (if applicable) */
  line?: number;

  /** Column number in template */
  column?: number;
}

interface EmailRenderResult extends RenderResult {
  /** Rendered email subject (always present for email type) */
  subject: string;

  /** Full responsive HTML (MJML-compiled if applicable) */
  html: string;

  /** Plain text version for email clients that prefer it */
  text: string;

  /** Sender address override from template metadata */
  from?: string;

  /** Reply-to address override from template metadata */
  replyTo?: string;

  /** Pre-computed email size in bytes */
  sizeBytes: number;
}

interface SmsRenderResult {
  /** Rendered SMS text */
  text: string;

  /** Number of SMS segments required */
  segments: number;

  /** Total character count */
  charCount: number;

  /** Encoding used: 'gsm7' (160 chars/segment) or 'ucs2' (70 chars/segment) */
  encoding: 'gsm7' | 'ucs2';

  /** Whether message exceeds recommended length */
  isLong: boolean;

  /** Render time in milliseconds */
  renderTimeMs: number;

  /** Warnings */
  warnings: RenderWarning[];
}

interface NotificationRenderResult {
  /** Notification title (short, ≤65 chars recommended) */
  title: string;

  /** Notification body text */
  body: string;

  /** Structured data payload for deep linking and actions */
  data: Record<string, unknown>;

  /** Badge count (iOS) */
  badge?: number;

  /** Sound name */
  sound?: string;

  /** Category for actionable notifications */
  category?: string;

  /** Render time in milliseconds */
  renderTimeMs: number;

  /** Warnings */
  warnings: RenderWarning[];
}

interface DocumentRenderResult extends RenderResult {
  /** Print-ready HTML with @page CSS rules */
  html: string;

  /** Document title from metadata */
  title?: string;

  /** Page size (e.g., 'A4', 'Letter') */
  pageSize: string;

  /** Page orientation */
  orientation: 'portrait' | 'landscape';
}

interface SlackRenderResult {
  /** Slack Block Kit blocks array */
  blocks: SlackBlock[];

  /** Fallback text for notifications */
  text: string;

  /** Thread timestamp for reply (if applicable) */
  threadTs?: string;

  /** Render time in milliseconds */
  renderTimeMs: number;

  /** Warnings */
  warnings: RenderWarning[];
}
```

### Layout

```typescript
interface Layout {
  /** UUID primary key */
  id: UUID;

  /** Owning venture */
  ventureId: VentureID;

  /** Display name (e.g., "Default Email Layout") */
  name: string;

  /** Unique slug per venture+type (e.g., "default-email") */
  slug: string;

  /**
   * Layout body with content insertion point.
   * Use {{> @content}} to mark where the child template body renders.
   * Supports all Handlebars syntax including helpers, partials, conditionals.
   */
  body: string;

  /** Template type this layout applies to */
  type: TemplateType;

  /** Locale for this layout */
  locale: string;

  /** Whether this is the default layout for the type+locale */
  isDefault: boolean;

  /** Description for admin UI */
  description?: string;

  /** Soft-delete timestamp */
  deletedAt: ISOTimestamp | null;

  /** Audit timestamps */
  createdBy: UserID;
  updatedBy: UserID;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}
```

### HelperFunction & HelperDefinition

```typescript
/** A Handlebars helper function — must be a pure function with no side effects */
type HelperFunction = (...args: unknown[]) => string;

interface HelperDefinition {
  /** Helper name used in templates (e.g., 'formatDate', 'uppercase') */
  name: string;

  /** Human-readable description */
  description: string;

  /** Category for organization in the admin UI */
  category: HelperCategory;

  /** The actual helper implementation */
  fn: HelperFunction;

  /** Usage examples shown in the admin UI */
  examples: HelperExample[];

  /** Whether this is a block helper ({{#helper}}...{{/helper}}) */
  isBlock: boolean;

  /** Parameter definitions for documentation */
  params: HelperParam[];
}

type HelperCategory = 'date' | 'number' | 'string' | 'logic' | 'format' | 'custom';

interface HelperExample {
  /** Template syntax example */
  template: string;
  /** Input data for the example */
  data: Record<string, unknown>;
  /** Expected output */
  output: string;
}

interface HelperParam {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: string;
  /** Whether required */
  required: boolean;
  /** Description */
  description: string;
}
```

### TemplateVersion

```typescript
interface TemplateVersion {
  /** UUID primary key */
  id: UUID;

  /** Parent template */
  templateId: UUID;

  /** Version number (monotonically increasing) */
  version: number;

  /** Full template body snapshot at this version */
  body: string;

  /** Subject at this version (emails) */
  subject?: string;

  /** Plain text body at this version */
  bodyPlain?: string;

  /** MJML source at this version */
  bodyMjml?: string;

  /** Variables declaration at this version */
  variables?: TemplateVariable[];

  /** User who made this change */
  changedBy: UserID;

  /** Human-readable note about the change */
  changeNote?: string;

  /** Immutable creation timestamp */
  createdAt: ISOTimestamp;
}

interface VersionDiff {
  /** Older version number */
  fromVersion: number;

  /** Newer version number */
  toVersion: number;

  /** Unified diff of body content */
  bodyDiff: string;

  /** Unified diff of subject (if changed) */
  subjectDiff?: string;

  /** Added variables */
  addedVariables: string[];

  /** Removed variables */
  removedVariables: string[];

  /** Changed by user */
  changedBy: UserID;

  /** Change note */
  changeNote?: string;
}
```

### TemplateValidation

```typescript
interface TemplateValidation {
  /** Whether the template is syntactically valid */
  valid: boolean;

  /** Syntax and semantic errors */
  errors: ValidationError[];

  /** Non-blocking warnings */
  warnings: ValidationWarning[];

  /** Extracted variables from the template body */
  extractedVariables: string[];

  /** Referenced helpers in the template */
  referencedHelpers: string[];

  /** Referenced partials in the template */
  referencedPartials: string[];

  /** Estimated render complexity (low/medium/high) */
  complexity: 'low' | 'medium' | 'high';
}

interface ValidationError {
  /** Error code */
  code: string;

  /** Human-readable message */
  message: string;

  /** Line number */
  line: number;

  /** Column number */
  column: number;

  /** Severity */
  severity: 'error' | 'warning';

  /** Suggested fix */
  suggestion?: string;
}
```

### Filter & Input Types

```typescript
interface TemplateFilter {
  /** Filter by venture */
  ventureId: VentureID;

  /** Filter by type */
  type?: TemplateType;

  /** Filter by locale */
  locale?: string;

  /** Filter by active status */
  isActive?: boolean;

  /** Filter by tag */
  tags?: string[];

  /** Text search across name, slug, description */
  search?: string;

  /** Pagination offset */
  offset?: number;

  /** Pagination limit (default: 50, max: 200) */
  limit?: number;

  /** Sort field */
  sortBy?: 'name' | 'updatedAt' | 'createdAt' | 'type';

  /** Sort direction */
  sortDir?: 'asc' | 'desc';

  /** Include soft-deleted templates */
  includeDeleted?: boolean;
}

interface TemplateCreateInput {
  ventureId: VentureID;
  type: TemplateType;
  name: string;
  slug: string;
  description?: string;
  subject?: string;
  body: string;
  bodyPlain?: string;
  bodyMjml?: string;
  locale?: string;                  // Default: 'en-US'
  variables?: TemplateVariable[];
  helpers?: string[];
  layoutId?: UUID;
  tags?: string[];
  isActive?: boolean;               // Default: true
  isDefault?: boolean;              // Default: false
  metadata?: Record<string, unknown>;
  createdBy: UserID;
}

interface TemplateUpdateInput {
  name?: string;
  description?: string;
  subject?: string;
  body?: string;
  bodyPlain?: string;
  bodyMjml?: string;
  variables?: TemplateVariable[];
  helpers?: string[];
  layoutId?: UUID | null;           // null to remove layout
  tags?: string[];
  isActive?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
  updatedBy: UserID;
  changeNote?: string;              // Stored in version history
}
```

---

## Database Schema

### templates Table

```typescript
export const templates = pgTable('templates', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  // Owning venture — all templates are venture-scoped
  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // Template type determines rendering pipeline and validation
  type: varchar('type', { length: 32 }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════

  // Human-readable name for the admin UI
  name: varchar('name', { length: 256 }).notNull(),

  // URL-safe slug unique per venture+type+locale (e.g., 'order-confirmation')
  slug: varchar('slug', { length: 256 }).notNull(),

  // Optional long-form description
  description: text('description'),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  // Email subject line (Handlebars-enabled)
  subject: varchar('subject', { length: 1024 }),

  // Primary template body (Handlebars syntax)
  body: text('body').notNull(),

  // Plain text fallback for emails and SMS
  bodyPlain: text('body_plain'),

  // MJML source for responsive email rendering
  bodyMjml: text('body_mjml'),

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA & CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  // BCP 47 locale tag (e.g., 'en-US', 'fr-CA')
  locale: varchar('locale', { length: 16 }).notNull().default('en-US'),

  // Declared template variables as JSON array of TemplateVariable
  variables: jsonb('variables').notNull().default('[]'),

  // Required helper names as JSON string array
  helpers: jsonb('helpers').notNull().default('[]'),

  // Base layout reference for template inheritance
  layoutId: uuid('layout_id').references(() => layouts.id),

  // Organization tags as JSON string array
  tags: jsonb('tags').notNull().default('[]'),

  // ═══════════════════════════════════════════════════════════════════════════
  // VERSION & STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  // Current version number (auto-incremented on every update)
  version: integer('version').notNull().default(1),

  // Whether this template is available for rendering
  isActive: boolean('is_active').notNull().default(true),

  // Default template for this type+locale combination
  isDefault: boolean('is_default').notNull().default(false),

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT
  // ═══════════════════════════════════════════════════════════════════════════

  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),

  // Arbitrary metadata for venture-specific extensions
  metadata: jsonb('metadata').notNull().default('{}'),
}, (table) => [
  // Unique constraint: one template per venture+slug+type+locale
  uniqueIndex('templates_venture_slug_type_locale').on(
    table.ventureId, table.slug, table.type, table.locale
  ),
  // Fast lookup by venture and type (list templates page)
  index('templates_venture_type_idx').on(table.ventureId, table.type),
  // Fast lookup by venture and active status
  index('templates_venture_active_idx').on(table.ventureId, table.isActive),
  // Full-text search on name and description
  index('templates_name_search_idx').on(table.name),
  // Soft-delete filtering
  index('templates_deleted_at_idx').on(table.deletedAt),
]);
```

### template_versions Table

```typescript
export const templateVersions = pgTable('template_versions', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  // Parent template reference (cascade delete when template is hard-deleted)
  templateId: uuid('template_id')
    .references(() => templates.id, { onDelete: 'cascade' })
    .notNull(),

  // Monotonically increasing version number
  version: integer('version').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT SNAPSHOT (full copy, not diff — enables instant restore)
  // ═══════════════════════════════════════════════════════════════════════════

  // Full template body at this version
  body: text('body').notNull(),

  // Subject at this version
  subject: varchar('subject', { length: 1024 }),

  // Plain text body at this version
  bodyPlain: text('body_plain'),

  // MJML source at this version
  bodyMjml: text('body_mjml'),

  // Variables at this version (enables diffing variable declarations)
  variables: jsonb('variables'),

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANGE METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  // User who made this change
  changedBy: uuid('changed_by').notNull(),

  // Human-readable note about the change
  changeNote: text('change_note'),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMP
  // ═══════════════════════════════════════════════════════════════════════════

  // Immutable creation timestamp (versions are never updated)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Fast version history lookup by template
  index('template_versions_template_idx').on(table.templateId),
  // Unique version per template
  uniqueIndex('template_versions_unique').on(table.templateId, table.version),
  // Lookup by who made changes
  index('template_versions_changed_by_idx').on(table.changedBy),
]);
```

### layouts Table

```typescript
export const layouts = pgTable('layouts', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════

  name: varchar('name', { length: 256 }).notNull(),
  slug: varchar('slug', { length: 256 }).notNull(),
  description: text('description'),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  // Layout body with {{> @content}} insertion point
  body: text('body').notNull(),

  // Template type this layout applies to
  type: varchar('type', { length: 32 }).notNull(),

  // Locale
  locale: varchar('locale', { length: 16 }).notNull().default('en-US'),

  // Whether this is the default layout for the type+locale
  isDefault: boolean('is_default').notNull().default(false),

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT
  // ═══════════════════════════════════════════════════════════════════════════

  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('layouts_venture_slug_type_locale').on(
    table.ventureId, table.slug, table.type, table.locale
  ),
  index('layouts_venture_type_idx').on(table.ventureId, table.type),
]);
```

### partials Table

```typescript
export const partials = pgTable('partials', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════

  // Unique name used in templates via {{> partial-name}}
  name: varchar('name', { length: 128 }).notNull(),

  // Human-readable description
  description: text('description'),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  // Handlebars template fragment
  body: text('body').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT
  // ═══════════════════════════════════════════════════════════════════════════

  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('partials_venture_name').on(table.ventureId, table.name),
]);
```

---

## Built-in Helpers

### Date Helpers

| Helper | Syntax | Input | Output |
|--------|--------|-------|--------|
| `formatDate` | `{{formatDate date "MMM d, yyyy"}}` | `2026-02-08T14:30:00Z` | `Feb 8, 2026` |
| `formatTime` | `{{formatTime date "h:mm a"}}` | `2026-02-08T14:30:00Z` | `2:30 PM` |
| `formatDateTime` | `{{formatDateTime date "full"}}` | `2026-02-08T14:30:00Z` | `February 8, 2026 at 2:30 PM` |
| `relativeDate` | `{{relativeDate date}}` | `2026-02-08T12:30:00Z` | `2 hours ago` |
| `dayOfWeek` | `{{dayOfWeek date}}` | `2026-02-08T14:30:00Z` | `Sunday` |
| `isFuture` | `{{#isFuture date}}...{{/isFuture}}` | (boolean block) | conditional |
| `isPast` | `{{#isPast date}}...{{/isPast}}` | (boolean block) | conditional |
| `dateDiff` | `{{dateDiff start end "days"}}` | two dates | `14` |

### Number Helpers

| Helper | Syntax | Input | Output |
|--------|--------|-------|--------|
| `formatCurrency` | `{{formatCurrency amount "USD"}}` | `1999` (cents) | `$19.99` |
| `formatNumber` | `{{formatNumber value 2}}` | `1234.5` | `1,234.50` |
| `formatPercent` | `{{formatPercent value 1}}` | `0.856` | `85.6%` |
| `formatBytes` | `{{formatBytes size}}` | `1536000` | `1.46 MB` |
| `ordinal` | `{{ordinal n}}` | `3` | `3rd` |
| `toFixed` | `{{toFixed value 2}}` | `3.14159` | `3.14` |
| `abs` | `{{abs value}}` | `-42` | `42` |

### String Helpers

| Helper | Syntax | Input | Output |
|--------|--------|-------|--------|
| `uppercase` | `{{uppercase name}}` | `john` | `JOHN` |
| `lowercase` | `{{lowercase name}}` | `JOHN` | `john` |
| `capitalize` | `{{capitalize name}}` | `john doe` | `John Doe` |
| `capitalizeFirst` | `{{capitalizeFirst text}}` | `hello world` | `Hello world` |
| `truncate` | `{{truncate text 50 "..."}}` | long string | `Lorem ipsum dolor sit...` |
| `pluralize` | `{{pluralize count "item" "items"}}` | `5` | `5 items` |
| `padStart` | `{{padStart id 6 "0"}}` | `42` | `000042` |
| `replace` | `{{replace text "old" "new"}}` | string | replaced string |
| `initials` | `{{initials name}}` | `John Doe` | `JD` |
| `slugify` | `{{slugify text}}` | `Hello World!` | `hello-world` |

### Logic Helpers (Block)

| Helper | Syntax | Description |
|--------|--------|-------------|
| `ifEqual` | `{{#ifEqual a b}}...{{else}}...{{/ifEqual}}` | Equality comparison |
| `ifNotEqual` | `{{#ifNotEqual a b}}...{{/ifNotEqual}}` | Inequality comparison |
| `ifGt` | `{{#ifGt a b}}...{{/ifGt}}` | Greater than |
| `ifLt` | `{{#ifLt a b}}...{{/ifLt}}` | Less than |
| `ifGte` | `{{#ifGte a b}}...{{/ifGte}}` | Greater than or equal |
| `ifLte` | `{{#ifLte a b}}...{{/ifLte}}` | Less than or equal |
| `ifIn` | `{{#ifIn value array}}...{{/ifIn}}` | Value in array |
| `ifAny` | `{{#ifAny a b c}}...{{/ifAny}}` | Any truthy |
| `ifAll` | `{{#ifAll a b c}}...{{/ifAll}}` | All truthy |
| `ifNone` | `{{#ifNone a b c}}...{{/ifNone}}` | None truthy |
| `unless` | `{{#unless value}}...{{/unless}}` | Inverse if (built-in) |
| `switch` | `{{#switch value}}{{#case "a"}}...{{/case}}{{/switch}}` | Switch/case |

### Format Helpers

| Helper | Syntax | Description |
|--------|--------|-------------|
| `json` | `{{json object}}` | JSON.stringify with indentation |
| `stripHtml` | `{{stripHtml htmlContent}}` | Remove HTML tags |
| `nl2br` | `{{nl2br text}}` | Newlines to `<br>` tags |
| `urlencode` | `{{urlencode text}}` | URL-encode string |
| `base64` | `{{base64 text}}` | Base64-encode string |
| `markdown` | `{{{markdown text}}}` | Markdown to HTML (triple-stache to avoid double-escape) |
| `highlight` | `{{{highlight text query}}}` | Wrap matching text in `<mark>` |

---

## Usage Examples

### Example 1: Simple Template Rendering

```typescript
import { render } from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// Basic variable interpolation
// ═══════════════════════════════════════════════════════════════════════════════

const result = render('Hello, {{name}}! Welcome to {{venture.name}}.', {
  name: 'Sarah',
  venture: { name: 'Acme Corp' },
});
// → "Hello, Sarah! Welcome to Acme Corp."

// Nested properties with dot notation
const nested = render('{{order.customer.address.city}}', {
  order: { customer: { address: { city: 'Montreal' } } },
});
// → "Montreal"
```

### Example 2: Compile and Reuse Templates (Batch Rendering)

```typescript
import { compile } from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// Pre-compile for bulk rendering (e.g., batch email sends)
// Compilation cost is paid once; rendering is O(variables) per call.
// ═══════════════════════════════════════════════════════════════════════════════

const template = compile(`
  <h1>Order #{{order.id}}</h1>
  <p>Thank you, {{customer.name}}!</p>

  <table>
    <thead>
      <tr><th>Item</th><th>Price</th><th>Qty</th></tr>
    </thead>
    <tbody>
    {{#each items}}
      <tr>
        <td>{{this.name}}</td>
        <td>{{formatCurrency this.price "USD"}}</td>
        <td>×{{this.quantity}}</td>
      </tr>
    {{/each}}
    </tbody>
  </table>

  <strong>Total: {{formatCurrency total "USD"}}</strong>
`);

// Render for each customer — compilation cost paid once
const results: string[] = [];
for (const order of orders) {
  const html = template({
    order,
    customer: order.customer,
    items: order.items,
    total: order.total,
  });
  results.push(html);
}

// For 10,000 orders: ~2ms compile + ~0.5ms × 10,000 = ~5 seconds total
// vs. ~5ms × 10,000 = ~50 seconds without pre-compilation
```

### Example 3: Email Template with MJML

```typescript
import { renderEmail, compileMjml } from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// Responsive email with MJML layout
// The engine: resolves template → compiles Handlebars → renders variables →
// compiles MJML → inlines CSS → generates plain text fallback
// ═══════════════════════════════════════════════════════════════════════════════

const email = await renderEmail('order-confirmation', {
  ventureId: 'acme-venture-uuid',
  locale: 'en-US',
  variables: {
    customer: { name: 'Sarah', email: 'sarah@example.com' },
    order: { id: 'ORD-2026-001', date: new Date() },
    items: [
      { name: 'Premium Widget', price: 4999, quantity: 2 },
      { name: 'Basic Gadget', price: 1999, quantity: 1 },
    ],
    total: 11997,
    trackingUrl: 'https://acme.com/track/ABC123',
  },
});

// email.subject     → "Order #ORD-2026-001 Confirmed"
// email.html        → Responsive HTML (MJML compiled, CSS inlined)
// email.text        → "Order #ORD-2026-001 Confirmed\n\nHi Sarah..."
// email.sizeBytes   → 12480
// email.renderTimeMs → 45
// email.warnings    → []

// Direct MJML compilation (for custom pipelines)
const mjmlResult = compileMjml(`
  <mjml>
    <mj-body>
      <mj-section>
        <mj-column>
          <mj-text>Hello {{name}}</mj-text>
          <mj-button href="{{actionUrl}}">Get Started</mj-button>
        </mj-column>
      </mj-section>
    </mj-body>
  </mjml>
`);
// mjmlResult.html → Full responsive HTML with media queries
// mjmlResult.errors → [] (MJML validation errors if any)
```

### Example 4: Conditional Logic & Loops

```typescript
import { render } from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// Complex conditionals with nested loops and helpers
// ═══════════════════════════════════════════════════════════════════════════════

const template = `
  <h1>Welcome, {{user.name}}!</h1>

  {{#if user.isPremium}}
    <div class="premium-badge">⭐ Premium Member since {{formatDate user.premiumSince "MMM yyyy"}}</div>
    <p>You have access to {{user.premiumFeatures.length}} exclusive features:</p>
    <ul>
      {{#each user.premiumFeatures}}
        <li>{{this}}</li>
      {{/each}}
    </ul>
  {{else}}
    <p>Upgrade to Premium for exclusive benefits!</p>
    <a href="{{upgradeUrl}}">Upgrade Now — {{formatCurrency upgradeCost "USD"}}/month</a>
  {{/if}}

  <h2>Your Recent Orders</h2>
  {{#if orders.length}}
    {{#each orders}}
      <div class="order">
        <span>#{{this.id}}</span>
        <span>{{formatDate this.date "MMM d"}}</span>
        <span>{{formatCurrency this.total "USD"}}</span>
        {{#ifEqual this.status "shipped"}}
          <span class="badge-green">🚚 Shipped</span>
        {{else}}
          {{#ifEqual this.status "delivered"}}
            <span class="badge-blue">✅ Delivered</span>
          {{else}}
            <span class="badge-gray">{{capitalize this.status}}</span>
          {{/ifEqual}}
        {{/ifEqual}}
      </div>
    {{/each}}

    <p class="summary">
      {{pluralize orders.length "order" "orders"}} totaling
      {{formatCurrency orderTotal "USD"}}
    </p>
  {{else}}
    <p>No orders yet. <a href="{{shopUrl}}">Start shopping!</a></p>
  {{/if}}

  <footer>
    <p>This email was sent on {{formatDateTime now "full"}}.</p>
  </footer>
`;

const html = render(template, data);
```

### Example 5: Template Management (Full CRUD Lifecycle)

```typescript
import {
  createTemplate,
  updateTemplate,
  getTemplate,
  listTemplates,
  deleteTemplate,
  duplicateTemplate,
} from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// Create a new email template
// ═══════════════════════════════════════════════════════════════════════════════

const template = await createTemplate({
  ventureId: 'acme-venture-uuid',
  type: 'email',
  name: 'Password Reset',
  slug: 'password-reset',
  subject: 'Reset your {{venture.name}} password',
  body: `
    <h1>Password Reset</h1>
    <p>Hi {{user.name}},</p>
    <p>Click the link below to reset your password:</p>
    <a href="{{resetUrl}}">Reset Password</a>
    <p>This link expires in {{expiresIn}} minutes.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `,
  bodyPlain: `Hi {{user.name}},\n\nReset your password: {{resetUrl}}\n\nExpires in {{expiresIn}} minutes.`,
  variables: [
    { name: 'user.name', type: 'string', required: true, description: 'User display name',
      sampleValue: 'Sarah Connor' },
    { name: 'resetUrl', type: 'string', required: true, description: 'Password reset URL',
      sampleValue: 'https://acme.com/reset/abc123' },
    { name: 'expiresIn', type: 'number', required: false, defaultValue: 60,
      description: 'Minutes until expiry', sampleValue: 60 },
    { name: 'venture.name', type: 'string', required: true, description: 'Venture name',
      sampleValue: 'Acme Corp' },
  ],
  tags: ['transactional', 'auth'],
  locale: 'en-US',
  createdBy: 'admin-user-uuid',
});

// template.id → 'uuid-...'
// template.version → 1
// template.isActive → true

// ═══════════════════════════════════════════════════════════════════════════════
// List templates with filters and pagination
// ═══════════════════════════════════════════════════════════════════════════════

const emailTemplates = await listTemplates({
  ventureId: 'acme-venture-uuid',
  type: 'email',
  isActive: true,
  tags: ['transactional'],
  search: 'password',
  sortBy: 'updatedAt',
  sortDir: 'desc',
  limit: 20,
  offset: 0,
});
// emailTemplates.items → [Template, ...]
// emailTemplates.total → 47
// emailTemplates.hasMore → true

// ═══════════════════════════════════════════════════════════════════════════════
// Get template by slug (most common pattern for rendering)
// ═══════════════════════════════════════════════════════════════════════════════

const tpl = await getTemplate({
  ventureId: 'acme-venture-uuid',
  slug: 'password-reset',
  type: 'email',
  locale: 'en-US',
});

// ═══════════════════════════════════════════════════════════════════════════════
// Duplicate a template (e.g., for a new locale)
// ═══════════════════════════════════════════════════════════════════════════════

const frenchVersion = await duplicateTemplate(template.id, {
  slug: 'password-reset',
  locale: 'fr-CA',
  name: 'Réinitialisation du mot de passe',
  createdBy: 'admin-user-uuid',
});

// ═══════════════════════════════════════════════════════════════════════════════
// Soft-delete a template (recoverable)
// ═══════════════════════════════════════════════════════════════════════════════

await deleteTemplate(template.id, { deletedBy: 'admin-user-uuid' });
// Sets deletedAt timestamp; template no longer resolves for rendering
// Can be restored by clearing deletedAt
```

### Example 6: Template Versioning & Rollback

```typescript
import {
  updateTemplate,
  listTemplateVersions,
  getTemplateVersion,
  restoreTemplateVersion,
  diffVersions,
} from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// Every update creates an immutable version snapshot
// ═══════════════════════════════════════════════════════════════════════════════

// Version 1 → created above
// Version 2:
await updateTemplate('template-uuid', {
  body: '<h1>Password Reset Request</h1><p>Hi {{user.name}},</p>...',
  changeNote: 'Redesigned header to match new brand guidelines',
  updatedBy: 'designer-user-uuid',
});

// Version 3:
await updateTemplate('template-uuid', {
  body: '<h1>Reset Your Password</h1><p>Hello {{user.name}},</p>...',
  subject: '🔒 Reset your {{venture.name}} password',
  changeNote: 'Added lock emoji to subject, changed greeting',
  updatedBy: 'marketing-user-uuid',
});

// ═══════════════════════════════════════════════════════════════════════════════
// Browse version history
// ═══════════════════════════════════════════════════════════════════════════════

const versions = await listTemplateVersions('template-uuid');
// [
//   { version: 3, changedBy: 'marketing-...', changeNote: 'Added lock emoji...', createdAt: '...' },
//   { version: 2, changedBy: 'designer-...', changeNote: 'Redesigned header...', createdAt: '...' },
//   { version: 1, changedBy: 'admin-...', changeNote: null, createdAt: '...' },
// ]

// ═══════════════════════════════════════════════════════════════════════════════
// Diff two versions
// ═══════════════════════════════════════════════════════════════════════════════

const diff = await diffVersions('template-uuid', 1, 3);
// diff.bodyDiff → unified diff string
// diff.subjectDiff → subject change diff
// diff.addedVariables → []
// diff.removedVariables → []

// ═══════════════════════════════════════════════════════════════════════════════
// Rollback to any previous version (creates version 4 with v1's content)
// ═══════════════════════════════════════════════════════════════════════════════

await restoreTemplateVersion('template-uuid', 1, {
  restoredBy: 'admin-user-uuid',
  changeNote: 'Rolled back to v1 — emoji in subject caused rendering issues',
});
// Template is now at version 4 with version 1's content
```

### Example 7: Layouts and Partials (Template Inheritance)

```typescript
import { createLayout, registerPartial, render, renderEmail } from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// Create a base email layout — all emails inherit this wrapper
// {{> @content}} is where the child template body renders
// ═══════════════════════════════════════════════════════════════════════════════

await createLayout({
  ventureId: 'acme-venture-uuid',
  name: 'Default Email Layout',
  slug: 'default-email',
  type: 'email',
  locale: 'en-US',
  isDefault: true,
  body: `
    <!DOCTYPE html>
    <html lang="{{locale}}">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .footer { color: #999; font-size: 12px; margin-top: 40px; }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <img src="{{venture.logoUrl}}" alt="{{venture.name}}" height="40" />
        </header>

        <main>
          {{> @content}}
        </main>

        <footer class="footer">
          <p>© {{formatDate now "yyyy"}} {{venture.name}} · {{venture.address}}</p>
          {{#if unsubscribeUrl}}
            <p><a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe</a></p>
          {{/if}}
        </footer>
      </div>
    </body>
    </html>
  `,
  createdBy: 'admin-user-uuid',
});

// ═══════════════════════════════════════════════════════════════════════════════
// Register reusable partials — shared fragments across templates
// ═══════════════════════════════════════════════════════════════════════════════

await registerPartial({
  ventureId: 'acme-venture-uuid',
  name: 'address-block',
  description: 'Formatted mailing address',
  body: `
    <div class="address" style="line-height: 1.6;">
      {{#if address.name}}<strong>{{address.name}}</strong><br>{{/if}}
      <span>{{address.street}}</span><br>
      {{#if address.unit}}<span>{{address.unit}}</span><br>{{/if}}
      <span>{{address.city}}, {{address.state}} {{address.zip}}</span><br>
      <span>{{address.country}}</span>
    </div>
  `,
  createdBy: 'admin-user-uuid',
});

await registerPartial({
  ventureId: 'acme-venture-uuid',
  name: 'order-items-table',
  description: 'Line items table for orders/invoices',
  body: `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #eee;">
          <th style="text-align: left; padding: 8px;">Item</th>
          <th style="text-align: right; padding: 8px;">Qty</th>
          <th style="text-align: right; padding: 8px;">Price</th>
          <th style="text-align: right; padding: 8px;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 8px;">{{this.name}}</td>
          <td style="text-align: right; padding: 8px;">{{this.quantity}}</td>
          <td style="text-align: right; padding: 8px;">{{formatCurrency this.price currency}}</td>
          <td style="text-align: right; padding: 8px;">
            {{formatCurrency (multiply this.price this.quantity) currency}}
          </td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  `,
  createdBy: 'admin-user-uuid',
});

// ═══════════════════════════════════════════════════════════════════════════════
// Use partials in template — the layout wraps automatically
// ═══════════════════════════════════════════════════════════════════════════════

// When rendering, the engine:
// 1. Loads the template body
// 2. Wraps in layout (replacing {{> @content}})
// 3. Resolves {{> address-block}} and {{> order-items-table}} partials
// 4. Compiles and renders the merged template
const email = await renderEmail('shipping-confirmation', {
  ventureId: 'acme-venture-uuid',
  locale: 'en-US',
  variables: {
    customer: { name: 'Sarah' },
    shippingAddress: { name: 'Sarah Connor', street: '123 Main St', city: 'Montreal', state: 'QC', zip: 'H2X 1Y4', country: 'Canada' },
    items: [{ name: 'Premium Widget', quantity: 2, price: 4999 }],
    currency: 'CAD',
    trackingNumber: 'CA123456789',
    venture: { name: 'Acme Corp', logoUrl: 'https://acme.com/logo.png', address: '456 Oak St, Toronto' },
  },
});
```

### Example 8: Custom Helpers

```typescript
import { registerHelper, render, listHelpers } from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// Register venture-specific helpers
// Helpers MUST be pure functions — no side effects, no I/O, no state mutation
// ═══════════════════════════════════════════════════════════════════════════════

registerHelper({
  name: 'statusBadge',
  description: 'Renders an HTML status badge with appropriate color',
  category: 'format',
  isBlock: false,
  params: [
    { name: 'status', type: 'string', required: true, description: 'Status value' },
  ],
  examples: [
    { template: '{{statusBadge "active"}}', data: {}, output: '<span class="badge badge-green">active</span>' },
  ],
  fn: (status: string) => {
    const colors: Record<string, string> = {
      active: 'green', pending: 'yellow', cancelled: 'red',
      shipped: 'blue', delivered: 'green', failed: 'red',
    };
    const color = colors[status] ?? 'gray';
    return `<span class="badge badge-${color}">${status}</span>`;
  },
});

registerHelper({
  name: 'starRating',
  description: 'Renders star rating as emoji/HTML',
  category: 'format',
  isBlock: false,
  params: [
    { name: 'rating', type: 'number', required: true, description: 'Rating 0-5' },
  ],
  examples: [
    { template: '{{starRating 4}}', data: {}, output: '★★★★☆' },
  ],
  fn: (rating: number) => {
    const full = Math.floor(Math.min(5, Math.max(0, rating)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  },
});

registerHelper({
  name: 'timeAgo',
  description: 'Formats a timestamp as relative time (compact)',
  category: 'date',
  isBlock: false,
  params: [
    { name: 'date', type: 'date', required: true, description: 'Date to format' },
  ],
  examples: [],
  fn: (date: Date | string) => {
    const d = new Date(date);
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// Use custom helpers in templates
// ═══════════════════════════════════════════════════════════════════════════════

const html = render(`
  <p>Status: {{statusBadge order.status}}</p>
  <p>Rating: {{starRating product.rating}} ({{product.reviewCount}} reviews)</p>
  <p>Last active: {{timeAgo user.lastSeen}}</p>
`, {
  order: { status: 'shipped' },
  product: { rating: 4, reviewCount: 128 },
  user: { lastSeen: new Date(Date.now() - 7200000) },
});

// List all registered helpers
const allHelpers = listHelpers();
// → [{ name: 'formatDate', category: 'date', ... }, { name: 'statusBadge', category: 'format', ... }, ...]
```

### Example 9: SMS Templates (Segment-Aware)

```typescript
import { renderSms } from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// SMS rendering is character-aware and handles GSM-7 vs Unicode encoding
//
// GSM-7 encoding: 160 chars per segment (standard ASCII + some symbols)
// UCS-2 encoding: 70 chars per segment (Unicode — emoji, CJK, etc.)
//
// Multi-segment: GSM-7 = 153 chars/segment, UCS-2 = 67 chars/segment
// (7 chars per segment used for concatenation header)
// ═══════════════════════════════════════════════════════════════════════════════

// Simple verification code
const sms = await renderSms('verification-code', {
  ventureId: 'acme-venture-uuid',
  locale: 'en-US',
  variables: {
    code: '482931',
    appName: 'Acme',
    expiresMin: 10,
  },
});
// sms.text     → "Your Acme code is 482931. Expires in 10 min."
// sms.segments → 1
// sms.charCount → 47
// sms.encoding → 'gsm7'
// sms.isLong   → false

// With emoji (forces UCS-2)
const smsEmoji = await renderSms('order-shipped', {
  ventureId: 'acme-venture-uuid',
  locale: 'en-US',
  variables: {
    orderId: 'ORD-001',
    trackingUrl: 'https://acme.co/t/ABC',
  },
});
// sms.text     → "📦 Your order ORD-001 has shipped! Track it: https://acme.co/t/ABC"
// sms.encoding → 'ucs2' (emoji forces Unicode)
// sms.segments → 1
// sms.charCount → 65

// Long SMS (multi-segment warning)
const smsLong = await renderSms('appointment-reminder', {
  ventureId: 'acme-venture-uuid',
  locale: 'en-US',
  variables: {
    name: 'Sarah',
    appointment: { date: 'Feb 10', time: '2:30 PM', doctor: 'Dr. Smith', location: '123 Medical Center Blvd, Suite 400, Montreal, QC H2X 1Y4' },
  },
});
// sms.segments → 2
// sms.isLong   → true
// sms.warnings → [{ code: 'SMS_MULTI_SEGMENT', message: 'SMS requires 2 segments (193 chars)' }]
```

### Example 10: Slack Block Kit Templates

```typescript
import { renderSlack } from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// Slack Block Kit template — renders JSON structure, not HTML
// Template body is a JSON template with Handlebars interpolation
// ═══════════════════════════════════════════════════════════════════════════════

const slack = await renderSlack('daily-report', {
  ventureId: 'acme-venture-uuid',
  variables: {
    date: new Date(),
    metrics: {
      revenue: 1542000,
      orders: 142,
      newCustomers: 28,
      conversionRate: 0.034,
    },
    topProducts: [
      { name: 'Premium Widget', sold: 45, revenue: 224955 },
      { name: 'Basic Gadget', sold: 38, revenue: 75962 },
      { name: 'Super Tool', sold: 22, revenue: 65978 },
    ],
    comparedToYesterday: {
      revenue: 0.12,    // +12%
      orders: -0.05,    // -5%
    },
  },
});

// slack.blocks → [
//   { type: 'header', text: { type: 'plain_text', text: '📊 Daily Report — Feb 8, 2026' } },
//   { type: 'section', fields: [
//     { type: 'mrkdwn', text: '*Revenue*\n$15,420.00 ↑12%' },
//     { type: 'mrkdwn', text: '*Orders*\n142 ↓5%' },
//     { type: 'mrkdwn', text: '*New Customers*\n28' },
//     { type: 'mrkdwn', text: '*Conversion*\n3.4%' },
//   ]},
//   { type: 'divider' },
//   { type: 'section', text: { type: 'mrkdwn', text: '*Top Products*\n1. Premium Widget (45 sold)\n...' }},
// ]
// slack.text → "Daily Report — Feb 8, 2026: $15,420.00 revenue, 142 orders"
```

### Example 11: Template Preview with Validation

```typescript
import { preview, getSampleData, validateTemplate, extractVariables } from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// Step 1: Validate template syntax before saving
// ═══════════════════════════════════════════════════════════════════════════════

const validation = validateTemplate(`
  <h1>Hello, {{user.name}}!</h1>
  {{#if user.isPremium}}
    <p>Premium since {{formatDate user.premiumSince "MMM yyyy"}}</p>
  {{/if}}
  {{#each orders}}
    <p>{{this.id}} — {{formatCurrency this.total "USD"}}</p>
  {{/each}}
`);

console.log(validation.valid);               // true
console.log(validation.extractedVariables);  // ['user.name', 'user.isPremium', 'user.premiumSince', 'orders']
console.log(validation.referencedHelpers);   // ['formatDate', 'formatCurrency']
console.log(validation.referencedPartials);  // []
console.log(validation.complexity);          // 'medium'

// Invalid template:
const badValidation = validateTemplate('{{#if}}missing close and args');
console.log(badValidation.valid);    // false
console.log(badValidation.errors);   // [{ code: 'SYNTAX_ERROR', message: '...', line: 1, column: 1 }]

// ═══════════════════════════════════════════════════════════════════════════════
// Step 2: Extract variables for admin UI (Variable Inspector component)
// ═══════════════════════════════════════════════════════════════════════════════

const vars = extractVariables('Hello {{user.name}}, order #{{order.id}} total: {{formatCurrency order.total "USD"}}');
// ['user.name', 'order.id', 'order.total']

// ═══════════════════════════════════════════════════════════════════════════════
// Step 3: Generate sample data from variable declarations
// ═══════════════════════════════════════════════════════════════════════════════

const sampleData = getSampleData([
  { name: 'user.name', type: 'string', required: true, description: '', sampleValue: 'Jane Doe' },
  { name: 'order.id', type: 'string', required: true, description: '', sampleValue: 'ORD-001' },
  { name: 'order.total', type: 'number', required: true, description: '', sampleValue: 9999 },
]);
// { user: { name: 'Jane Doe' }, order: { id: 'ORD-001', total: 9999 } }

// ═══════════════════════════════════════════════════════════════════════════════
// Step 4: Render preview with sample or override data
// ═══════════════════════════════════════════════════════════════════════════════

const previewResult = await preview({
  templateId: 'template-uuid',
  overrideVariables: { user: { name: 'Preview Admin' } }, // Merge with sample data
});

// previewResult.html       → Rendered HTML
// previewResult.warnings   → ["Variable 'loyaltyPoints' not provided, using default"]
// previewResult.renderTimeMs → 12
```

### Example 12: Notification Templates

```typescript
import { renderNotification } from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// Push / in-app notification rendering with structured data payload
// ═══════════════════════════════════════════════════════════════════════════════

const notification = await renderNotification('order-shipped', {
  ventureId: 'acme-venture-uuid',
  locale: 'en-US',
  variables: {
    order: { id: 'ORD-001' },
    trackingNumber: 'CA123456789',
    carrier: 'FedEx',
    estimatedDelivery: new Date('2026-02-12'),
    items: [
      { name: 'Premium Widget', quantity: 2 },
    ],
  },
});

// notification.title    → "Your order has shipped! 📦"
// notification.body     → "Order #ORD-001 is on its way via FedEx. Arriving Feb 12."
// notification.data     → {
//   orderId: 'ORD-001',
//   action: 'track',
//   deepLink: 'acme://orders/ORD-001/tracking',
//   trackingNumber: 'CA123456789',
//   carrier: 'FedEx',
// }
// notification.badge    → 1
// notification.sound    → 'default'
// notification.category → 'order_update'
```

### Example 13: Document Template for PDF

```typescript
import { renderDocument } from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// Invoice template — print-ready HTML with page break support
// Pass the result to @mcv/shared/export for PDF generation
// ═══════════════════════════════════════════════════════════════════════════════

const doc = await renderDocument('invoice', {
  ventureId: 'acme-venture-uuid',
  locale: 'en-US',
  variables: {
    invoice: {
      number: 'INV-2026-0042',
      date: new Date(),
      dueDate: new Date('2026-03-08'),
      paymentTerms: 'Net 30',
    },
    company: {
      name: 'Acme Corp',
      address: '123 Main St, New York, NY 10001',
      taxId: 'US-123456789',
      logoUrl: 'https://acme.com/logo.png',
    },
    customer: {
      name: 'TechStart Inc',
      address: '456 Oak Ave, San Francisco, CA 94102',
      email: 'billing@techstart.com',
    },
    items: [
      { description: 'Consulting Services — January 2026', quantity: 40, unit: 'hours', rate: 15000, amount: 60000 },
      { description: 'Software License — Enterprise Plan', quantity: 1, unit: 'license', rate: 49900, amount: 49900 },
      { description: 'Cloud Hosting — February 2026', quantity: 1, unit: 'month', rate: 9900, amount: 9900 },
    ],
    subtotal: 119800,
    taxRate: 0.13,
    tax: 15574,
    total: 135374,
    currency: 'USD',
    notes: 'Thank you for your business! Payment via wire transfer preferred.',
  },
});

// doc.html        → Print-ready HTML with @page CSS, page breaks, tables
// doc.title       → "Invoice INV-2026-0042"
// doc.pageSize    → "Letter"
// doc.orientation → "portrait"
// doc.renderTimeMs → 18

// Generate PDF:
// import { generatePdf } from '@mcv/shared/export';
// const pdf = await generatePdf(doc.html, { pageSize: doc.pageSize });
```

### Example 14: Localized Templates with Fallback Chain

```typescript
import { renderEmail } from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// The engine resolves locale-specific templates with intelligent fallback:
//
// Request locale: 'fr-CA'
// Resolution: fr-CA → fr → en-US → system default → TEMPLATE_NOT_FOUND
// ═══════════════════════════════════════════════════════════════════════════════

// English (exact match: en-US template exists)
const emailEn = await renderEmail('welcome', {
  ventureId: 'acme-venture-uuid',
  locale: 'en-US',
  variables: { user: { name: 'John' }, venture: { name: 'Acme Corp' } },
});
// email.subject → "Welcome to Acme Corp!"
// email.resolvedLocale → 'en-US'

// Spanish (exact match: es-ES template exists)
const emailEs = await renderEmail('welcome', {
  ventureId: 'acme-venture-uuid',
  locale: 'es-ES',
  variables: { user: { name: 'Juan' }, venture: { name: 'Acme Corp' } },
});
// email.subject → "¡Bienvenido a Acme Corp!"
// email.resolvedLocale → 'es-ES'

// French Canadian (no fr-CA template → falls back to fr → falls back to en-US)
const emailFr = await renderEmail('welcome', {
  ventureId: 'acme-venture-uuid',
  locale: 'fr-CA',
  variables: { user: { name: 'Jean' }, venture: { name: 'Acme Corp' } },
});
// email.subject → "Welcome to Acme Corp!" (fell back to en-US)
// email.resolvedLocale → 'en-US'
// email.warnings → [{ code: 'LOCALE_FALLBACK', message: "No template for 'fr-CA' or 'fr'; using 'en-US'" }]
```

### Example 15: React Template Editor with Live Preview

```tsx
import {
  TemplateEditor,
  TemplatePreview,
  VariableInspector,
  VersionHistory,
  TemplateDiffView,
} from '@mcv/shared/templates/client';
import {
  useTemplateEditor,
  useTemplatePreview,
  useTemplateVersions,
} from '@mcv/shared/templates/client';

// ═══════════════════════════════════════════════════════════════════════════════
// Full-featured admin template editor with live preview, variable inspection,
// and version history — all powered by client hooks
// ═══════════════════════════════════════════════════════════════════════════════

function TemplateEditorPage({ templateId }: { templateId: string }) {
  const {
    template,
    isDirty,
    save,
    isSaving,
    error: saveError,
    updateField,
  } = useTemplateEditor(templateId);

  const {
    preview,
    isLoading: previewLoading,
    refresh: refreshPreview,
    sampleData,
    updateSampleData,
  } = useTemplatePreview(templateId);

  const {
    versions,
    selectedVersion,
    selectVersion,
    diff,
    restore,
    isRestoring,
  } = useTemplateVersions(templateId);

  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'history'>('edit');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-xl font-bold">{template.name}</h1>
          <p className="text-sm text-muted-foreground">
            v{template.version} · {template.type} · {template.locale}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshPreview} disabled={previewLoading}>
            Preview
          </Button>
          <Button onClick={save} disabled={!isDirty || isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="history">History ({versions.length})</TabsTrigger>
        </TabsList>

        {/* Editor Tab — split pane with code editor + variable inspector */}
        <TabsContent value="edit" className="flex-1 grid grid-cols-3 gap-4 p-4">
          <div className="col-span-2">
            <TemplateEditor
              template={template}
              onChange={updateField}
              onSave={save}
            />
          </div>
          <div>
            <VariableInspector
              variables={template.variables}
              extractedVariables={preview?.extractedVariables}
              onUpdate={(vars) => updateField('variables', vars)}
            />
          </div>
        </TabsContent>

        {/* Preview Tab — rendered output with device frames */}
        <TabsContent value="preview" className="flex-1 p-4">
          <TemplatePreview
            html={preview?.html}
            text={preview?.text}
            subject={preview?.subject}
            isLoading={previewLoading}
            warnings={preview?.warnings}
            renderTimeMs={preview?.renderTimeMs}
            sampleData={sampleData}
            onSampleDataChange={updateSampleData}
          />
        </TabsContent>

        {/* History Tab — version timeline with diff viewer */}
        <TabsContent value="history" className="flex-1 grid grid-cols-2 gap-4 p-4">
          <VersionHistory
            versions={versions}
            selected={selectedVersion}
            onSelect={selectVersion}
            onRestore={restore}
            isRestoring={isRestoring}
          />
          <TemplateDiffView diff={diff} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 | Notes |
|-----------|--------|-----|-------|
| Simple render (cached template) | < 2ms | < 5ms | Pre-compiled Handlebars, no I/O |
| Simple render (uncached) | < 5ms | < 15ms | Includes compilation |
| Compiled template render | < 1ms | < 3ms | Fastest path — template already AST |
| Email render (with MJML) | < 50ms | < 150ms | MJML compilation is the bottleneck |
| Email render (MJML cached) | < 10ms | < 30ms | MJML output cached separately |
| Template fetch (cache hit) | < 3ms | < 10ms | In-memory LRU cache |
| Template fetch (DB) | < 20ms | < 50ms | PostgreSQL with index |
| Preview render | < 50ms | < 150ms | Includes sample data generation |
| Template validation | < 10ms | < 25ms | AST parse + variable extraction |
| Variable extraction | < 5ms | < 10ms | AST traversal only |
| SMS render | < 2ms | < 5ms | No HTML processing |
| Slack render | < 5ms | < 15ms | JSON template + validation |

### Throughput

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| Renders per second (simple) | 5,000 | 50,000+ |
| Renders per second (email+MJML) | 100 | 1,000+ |
| Renders per second (compiled) | 10,000 | 100,000+ |
| Concurrent template edits | 20 | 200+ |
| Template versions per template | Unlimited | Unlimited (pruning recommended >1000) |

### Caching Strategy

| Cache Layer | Storage | TTL | Invalidation | Max Size |
|-------------|---------|-----|-------------|----------|
| Compiled templates (AST) | In-memory LRU | 1 hour | On template update | 500 entries |
| Layout resolution | In-memory LRU | 1 hour | On layout update | 100 entries |
| Partial registry | In-memory LRU | 30 min | On partial update | 200 entries |
| MJML → HTML compilation | In-memory LRU | 24 hours | On MJML source change | 200 entries |
| Template DB lookups | In-memory LRU | 5 min | On any template mutation | 1000 entries |
| Sample data | In-memory | 5 min | On variable change | 100 entries |

### Optimization Strategies

1. **Pre-compilation** — Compile templates to Handlebars AST on save (not on render). The compiled AST is cached and reused across all renders. This eliminates the parse step for production traffic.

2. **MJML pre-compilation** — MJML → HTML compilation is expensive (~50-100ms). Cache the compiled HTML and only recompile when the MJML source changes. For templates without MJML, this step is skipped entirely.

3. **Partial inlining** — When caching a compiled template, pre-resolve and inline all `{{> partial-name}}` references. This eliminates partial lookup overhead at render time.

4. **Batch rendering** — Use `compile()` to pre-compile once, then render many. For a 10,000-recipient email campaign, this saves ~5ms × 10,000 = ~50 seconds of compilation overhead.

5. **Template size limits** — Enforce 1 MB max body size to prevent memory pressure during compilation. Templates exceeding this should be refactored into layouts + partials.

6. **Variable depth limits** — Maximum 10 levels of nesting (e.g., `a.b.c.d.e.f.g.h.i.j`) to prevent stack overflow during recursive resolution.

7. **Loop iteration limits** — Maximum 10,000 iterations per `{{#each}}` block to prevent runaway rendering on malformed data.

### Resource Limits

| Resource | Limit | Configurable | Env Var |
|----------|-------|-------------|---------|
| Max template body size | 1 MB | Yes | `TEMPLATE_MAX_SIZE_BYTES` |
| Max variable nesting depth | 10 levels | Yes | `TEMPLATE_MAX_NESTING_DEPTH` |
| Max partials per template | 50 | Yes | `TEMPLATE_MAX_PARTIALS` |
| Max helpers per template | 100 | Yes | `TEMPLATE_MAX_HELPERS` |
| Max loop iterations | 10,000 | Yes | `TEMPLATE_MAX_LOOP_ITERATIONS` |
| Max render time | 5 seconds | Yes | `TEMPLATE_MAX_RENDER_TIME_MS` |
| Max subject length | 1,024 chars | No | — |
| Max slug length | 256 chars | No | — |
| Max template name length | 256 chars | No | — |
| Max versions per template | Unlimited | Recommended: prune >1000 | — |

---

## Security Considerations

### Template Sandbox

The template engine operates in a strict sandbox environment:

- **No code execution** — Templates cannot execute arbitrary JavaScript. Handlebars is a logic-less template language; the only "logic" is `{{#if}}`, `{{#each}}`, `{{#unless}}`, and registered helpers.
- **No prototype access** — Handlebars is configured with `allowProtoPropertiesByDefault: false` and `allowProtoMethodsByDefault: false` to prevent prototype pollution attacks.
- **Auto-escaping** — All `{{variable}}` output is HTML-escaped by default. Only `{{{triple-stache}}}` bypasses escaping, and its use is flagged during validation.
- **Safe helpers** — All built-in helpers are pure functions with no side effects, no I/O, no network access. Custom helpers are validated to be pure functions.
- **No file access** — Templates cannot read the filesystem, environment variables, or make network requests.
- **No eval** — Template compilation does not use `eval()`, `new Function()`, or any dynamic code execution.
- **Loop limits** — Maximum iteration count (default: 10,000) prevents infinite loops and DoS via large datasets.
- **Render timeout** — Maximum render time (default: 5s) kills long-running renders.
- **Size limits** — Template body size is capped (default: 1MB) to prevent memory exhaustion.

### XSS Prevention

```typescript
// Auto-escaped (default) — safe for untrusted user data
render('Hello, {{name}}', { name: '<script>alert("xss")</script>' });
// → "Hello, &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"

// HTML entities are properly escaped
render('{{text}}', { text: '"><img src=x onerror=alert(1)>' });
// → "&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"

// Triple-stache bypasses escaping — USE WITH CAUTION
// Only for trusted, pre-sanitized HTML content
render('Content: {{{trustedHtml}}}', { trustedHtml: '<b>Bold</b>' });
// → "Content: <b>Bold</b>"

// Validation warns about triple-stache usage
const validation = validateTemplate('{{{userInput}}}');
// validation.warnings → [{ code: 'UNESCAPED_VARIABLE', message: 'Variable "userInput" is unescaped...' }]
```

### Input Validation

| What | Validation | On |
|------|-----------|-----|
| Template body | Handlebars syntax validation + AST parse | Create/Update |
| Variable names | Regex: `[a-zA-Z_][a-zA-Z0-9_.]*` | Create/Update |
| Variable depth | Max 10 levels of dot notation | Create/Update |
| Helper references | Validated against registered helper registry | Create/Update |
| Partial references | Validated against registered partial registry | Create/Update |
| Layout references | Validated for existence in venture scope | Create/Update |
| Slug format | Regex: `[a-z0-9][a-z0-9-]*[a-z0-9]` | Create/Update |
| MJML syntax | MJML validator (configurable: strict/soft/skip) | Create/Update |
| Rendered output | Sanitize-html post-processing (optional) | Render |
| Template size | Max 1 MB body | Create/Update |

### Multi-Tenant Isolation

- Templates are **always scoped to a venture** — there is no global template namespace
- A venture cannot read, render, or modify another venture's templates
- The `ventureId` is required in every query and enforced at the database level via composite indexes
- Layouts and partials are also venture-scoped
- Custom helpers can be registered per-venture (venture-specific helpers are isolated)

### Content Security

- **No JavaScript in email templates** — Email clients strip `<script>` tags anyway, but the engine also strips them during post-processing
- **CSS inlining** — External stylesheets are inlined to prevent CORS issues and tracking via CSS
- **Image validation** — Optional: validate that `<img>` src attributes reference allowed domains
- **Link validation** — Optional: validate that `<a>` href attributes don't contain `javascript:` URIs

---

## Error Codes

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `TEMPLATE_NOT_FOUND` | 404 | Template not found for the given venture+slug+type+locale | Check slug, type, and locale. Verify template exists and is active. |
| `TEMPLATE_INACTIVE` | 410 | Template exists but is deactivated | Re-activate the template via `updateTemplate({ isActive: true })`. |
| `TEMPLATE_DELETED` | 410 | Template has been soft-deleted | Restore the template or create a new one. |
| `TEMPLATE_SYNTAX_ERROR` | 400 | Handlebars syntax error in template body | Fix the syntax error. Use `validateTemplate()` for details. |
| `TEMPLATE_RENDER_TIMEOUT` | 408 | Template rendering exceeded maximum time | Simplify template, reduce data size, or increase `TEMPLATE_MAX_RENDER_TIME_MS`. |
| `TEMPLATE_SIZE_EXCEEDED` | 413 | Template body exceeds maximum size | Refactor into layout + partials, or increase `TEMPLATE_MAX_SIZE_BYTES`. |
| `TEMPLATE_DUPLICATE_SLUG` | 409 | Slug already exists for this venture+type+locale | Choose a different slug. |
| `VARIABLE_REQUIRED` | 400 | Required variable not provided in render context | Provide the missing variable. Only thrown in strict mode. |
| `VARIABLE_TYPE_MISMATCH` | 400 | Variable type doesn't match declaration | Provide the correct type (e.g., number instead of string). |
| `VARIABLE_DEPTH_EXCEEDED` | 400 | Variable nesting exceeds maximum depth | Flatten data structure or increase `TEMPLATE_MAX_NESTING_DEPTH`. |
| `LOOP_LIMIT_EXCEEDED` | 400 | `{{#each}}` iteration count exceeds limit | Reduce array size or increase `TEMPLATE_MAX_LOOP_ITERATIONS`. |
| `HELPER_NOT_FOUND` | 400 | Referenced helper is not registered | Register the helper or remove the reference. |
| `PARTIAL_NOT_FOUND` | 400 | Referenced partial is not registered | Register the partial or remove the reference. |
| `LAYOUT_NOT_FOUND` | 404 | Referenced layout does not exist | Create the layout or remove the layoutId. |
| `LAYOUT_MISSING_CONTENT` | 400 | Layout body missing `{{> @content}}` placeholder | Add `{{> @content}}` to the layout body. |
| `MJML_COMPILATION_ERROR` | 400 | MJML source failed to compile | Fix MJML syntax. Use `validateMjml()` for details. |
| `MJML_VALIDATION_ERROR` | 400 | MJML source has validation warnings (strict mode) | Fix MJML warnings or set `MJML_VALIDATION_LEVEL=soft`. |
| `VERSION_NOT_FOUND` | 404 | Requested version does not exist | Check version number. Use `listTemplateVersions()` for available versions. |
| `INVALID_LOCALE` | 400 | Locale string is not a valid BCP 47 tag | Use a valid locale (e.g., 'en-US', 'fr-CA', 'es-ES'). |
| `SLUG_INVALID_FORMAT` | 400 | Slug contains invalid characters | Use lowercase alphanumeric + hyphens only. |
| `VENTURE_REQUIRED` | 400 | ventureId is missing from the request | Provide a valid ventureId in the render context. |

---

## Audit Events

| Event | Category | Description | Payload |
|-------|----------|-------------|---------|
| `template.created` | content | New template created | `{ templateId, ventureId, type, slug, locale, createdBy }` |
| `template.updated` | content | Template content modified | `{ templateId, version, fields, changeNote, updatedBy }` |
| `template.deleted` | content | Template soft-deleted | `{ templateId, deletedBy }` |
| `template.restored` | content | Template restored from deletion | `{ templateId, restoredBy }` |
| `template.version.restored` | content | Previous version restored | `{ templateId, fromVersion, toVersion, restoredBy }` |
| `template.duplicated` | content | Template cloned | `{ sourceId, newId, newSlug, newLocale, createdBy }` |
| `template.activated` | content | Template activated | `{ templateId, activatedBy }` |
| `template.deactivated` | content | Template deactivated | `{ templateId, deactivatedBy }` |
| `template.rendered` | system | Template rendered (sampled at 1%) | `{ templateId, type, locale, renderTimeMs, ventureId }` |
| `template.render_failed` | error | Template render failed | `{ templateId, errorCode, errorMessage, ventureId }` |
| `template.validated` | system | Template syntax validated | `{ templateId, valid, errorCount, warningCount }` |
| `template.previewed` | system | Template preview rendered | `{ templateId, userId }` |
| `template.layout.created` | content | New layout created | `{ layoutId, ventureId, type, slug, createdBy }` |
| `template.layout.updated` | content | Layout content modified | `{ layoutId, updatedBy }` |
| `template.layout.deleted` | content | Layout soft-deleted | `{ layoutId, deletedBy }` |
| `template.partial.created` | content | New partial registered | `{ partialId, ventureId, name, createdBy }` |
| `template.partial.updated` | content | Partial content modified | `{ partialId, updatedBy }` |
| `template.partial.deleted` | content | Partial removed | `{ partialId, deletedBy }` |
| `template.helper.registered` | system | Custom helper registered | `{ name, category, ventureId }` |
| `template.helper.removed` | system | Custom helper unregistered | `{ name, ventureId }` |

### Audit Sampling

The `template.rendered` event is high-volume (every outbound email, notification, SMS generates one). To prevent audit log bloat:

- **Default**: Sampled at 1% of renders (configurable via `TEMPLATE_AUDIT_RENDER_SAMPLE_RATE`)
- **Errors**: Always logged (100% — `template.render_failed`)
- **Admin actions**: Always logged (100% — create, update, delete, restore)
- **Preview renders**: Always logged (low volume, useful for tracking editor usage)

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# TEMPLATE ENGINE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Maximum template body size in bytes (default: 1 MB)
TEMPLATE_MAX_SIZE_BYTES=1048576

# Maximum render execution time in milliseconds (default: 5000)
TEMPLATE_MAX_RENDER_TIME_MS=5000

# Maximum iterations per {{#each}} block (default: 10000)
TEMPLATE_MAX_LOOP_ITERATIONS=10000

# Maximum variable nesting depth (default: 10)
TEMPLATE_MAX_NESTING_DEPTH=10

# Maximum partials per template (default: 50)
TEMPLATE_MAX_PARTIALS=50

# Maximum helpers per template (default: 100)
TEMPLATE_MAX_HELPERS=100

# Throw on missing required variables (default: false)
# When false, missing variables render as empty string with a warning
TEMPLATE_STRICT_MODE=false

# Default locale for new templates and fallback resolution (default: en-US)
TEMPLATE_DEFAULT_LOCALE=en-US

# ═══════════════════════════════════════════════════════════════════════════════
# MJML CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Preserve HTML comments in compiled output (default: false)
MJML_KEEP_COMMENTS=false

# Minify MJML output HTML (default: true)
MJML_MINIFY=true

# MJML validation level: strict | soft | skip (default: soft)
# strict = fail on any warning; soft = warn but compile; skip = no validation
MJML_VALIDATION_LEVEL=soft

# ═══════════════════════════════════════════════════════════════════════════════
# CACHING
# ═══════════════════════════════════════════════════════════════════════════════

# Compiled template AST cache TTL in seconds (default: 3600 = 1 hour)
TEMPLATE_CACHE_TTL=3600

# Layout resolution cache TTL in seconds (default: 3600 = 1 hour)
TEMPLATE_LAYOUT_CACHE_TTL=3600

# Partial registry cache TTL in seconds (default: 1800 = 30 minutes)
TEMPLATE_PARTIAL_CACHE_TTL=1800

# MJML compilation cache TTL in seconds (default: 86400 = 24 hours)
TEMPLATE_MJML_CACHE_TTL=86400

# Template DB lookup cache TTL in seconds (default: 300 = 5 minutes)
TEMPLATE_DB_CACHE_TTL=300

# Maximum compiled template cache entries (default: 500)
TEMPLATE_CACHE_MAX_SIZE=500

# ═══════════════════════════════════════════════════════════════════════════════
# PREVIEW
# ═══════════════════════════════════════════════════════════════════════════════

# Enable template preview endpoint (default: true)
TEMPLATE_PREVIEW_ENABLED=true

# Default locale for preview rendering (default: en-US)
TEMPLATE_PREVIEW_SAMPLE_LOCALE=en-US

# ═══════════════════════════════════════════════════════════════════════════════
# AUDIT
# ═══════════════════════════════════════════════════════════════════════════════

# Sample rate for template.rendered audit events (0.0 to 1.0, default: 0.01 = 1%)
TEMPLATE_AUDIT_RENDER_SAMPLE_RATE=0.01
```

---

## Dependencies

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| handlebars | ^4.7.x | Template compilation and rendering engine |
| mjml | ^4.15.x | Responsive email HTML generation from MJML markup |
| sanitize-html | ^2.x | HTML sanitization for post-render output safety |
| juice | ^10.x | CSS inlining for email compatibility |
| drizzle-orm | ^0.29.x | Database ORM for template storage |
| zod | ^3.x | Input validation for template CRUD operations |
| diff | ^5.x | Unified diff generation for version comparison |

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/kernel` | UUID generation, timestamps, base types (VentureID, UserID, ISOTimestamp) |
| `@mcv/fabric/events` | Audit event emission (template.created, template.rendered, etc.) |
| `@mcv/shared/localization` | Locale-aware formatting helpers (dates, numbers, currencies) |
| `@mcv/shared/validation` | Zod schema definitions shared across modules |

### Dependency Flow

```
@mcv/kernel (Tier 0)
    ↑
@mcv/fabric/events (Tier 1)
    ↑
@mcv/shared/localization (Tier 2.5)
    ↑
@mcv/shared/templates (Tier 2.5)  ← YOU ARE HERE
    ↑
@mcv/connectors/email (Tier 3)   — uses renderEmail
@mcv/connectors/sms (Tier 3)     — uses renderSms
@mcv/connectors/slack (Tier 3)   — uses renderSlack
@mcv/shared/export (Tier 2.5)    — uses renderDocument for PDF
@mcv/shared/notifications (Tier 2.5) — uses renderNotification
```

---

## Testing Notes

### Unit Testing

```typescript
import {
  render,
  compile,
  validateTemplate,
  extractVariables,
  registerHelper,
} from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// RENDERING TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Template Rendering', () => {
  it('should interpolate simple variables', () => {
    expect(render('Hello, {{name}}!', { name: 'World' })).toBe('Hello, World!');
  });

  it('should resolve nested dot-notation variables', () => {
    const result = render('{{user.address.city}}', {
      user: { address: { city: 'Montreal' } },
    });
    expect(result).toBe('Montreal');
  });

  it('should HTML-escape by default', () => {
    const result = render('{{value}}', { value: '<script>alert("xss")</script>' });
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('should allow unescaped output with triple-stache', () => {
    const result = render('{{{html}}}', { html: '<b>Bold</b>' });
    expect(result).toBe('<b>Bold</b>');
  });

  it('should handle missing variables gracefully in non-strict mode', () => {
    const result = render('Hello, {{name}}!', {});
    expect(result).toBe('Hello, !');
  });

  it('should throw on missing required variables in strict mode', () => {
    expect(() => render('{{name}}', {}, { strictMode: true }))
      .toThrow('VARIABLE_REQUIRED');
  });

  it('should support conditionals', () => {
    const tpl = '{{#if active}}Yes{{else}}No{{/if}}';
    expect(render(tpl, { active: true })).toBe('Yes');
    expect(render(tpl, { active: false })).toBe('No');
  });

  it('should support loops with @index', () => {
    const tpl = '{{#each items}}{{@index}}:{{this}},{{/each}}';
    expect(render(tpl, { items: ['a', 'b', 'c'] })).toBe('0:a,1:b,2:c,');
  });

  it('should enforce loop iteration limits', () => {
    const hugeArray = new Array(20000).fill('x');
    expect(() => render('{{#each items}}{{this}}{{/each}}', { items: hugeArray }))
      .toThrow('LOOP_LIMIT_EXCEEDED');
  });

  it('should enforce render timeout', async () => {
    // A deeply nested template that takes too long
    await expect(
      renderAsync(deeplyNestedTemplate, data, { timeoutMs: 100 })
    ).rejects.toThrow('TEMPLATE_RENDER_TIMEOUT');
  });

  it('should support built-in helpers', () => {
    expect(render('{{formatCurrency 1999 "USD"}}', {})).toBe('$19.99');
    expect(render('{{uppercase "hello"}}', {})).toBe('HELLO');
    expect(render('{{pluralize 5 "item" "items"}}', {})).toBe('5 items');
    expect(render('{{pluralize 1 "item" "items"}}', {})).toBe('1 item');
  });

  it('should support custom helpers', () => {
    registerHelper({
      name: 'testDouble',
      description: 'Doubles a number',
      category: 'number',
      isBlock: false,
      params: [],
      examples: [],
      fn: (n: number) => String(n * 2),
    });

    expect(render('{{testDouble 5}}', {})).toBe('10');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPILATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Template Compilation', () => {
  it('should compile template for reuse', () => {
    const fn = compile('Hello, {{name}}!');
    expect(fn({ name: 'Alice' })).toBe('Hello, Alice!');
    expect(fn({ name: 'Bob' })).toBe('Hello, Bob!');
  });

  it('should be faster on subsequent renders', () => {
    const template = '{{#each items}}{{this.name}}: {{formatCurrency this.price "USD"}}{{/each}}';
    const data = { items: Array.from({ length: 100 }, (_, i) => ({ name: `Item ${i}`, price: i * 100 })) };

    // Uncached render
    const start1 = performance.now();
    render(template, data);
    const uncachedMs = performance.now() - start1;

    // Compiled render
    const fn = compile(template);
    const start2 = performance.now();
    fn(data);
    const compiledMs = performance.now() - start2;

    expect(compiledMs).toBeLessThan(uncachedMs);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Template Validation', () => {
  it('should accept valid templates', () => {
    const result = validateTemplate('Hello, {{name}}!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject unclosed block helpers', () => {
    const result = validateTemplate('{{#if active}}missing close');
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('SYNTAX_ERROR');
  });

  it('should reject mismatched block helpers', () => {
    const result = validateTemplate('{{#if active}}content{{/each}}');
    expect(result.valid).toBe(false);
  });

  it('should extract variables', () => {
    const result = validateTemplate('{{user.name}} - {{order.total}}');
    expect(result.extractedVariables).toEqual(
      expect.arrayContaining(['user.name', 'order.total'])
    );
  });

  it('should detect referenced helpers', () => {
    const result = validateTemplate('{{formatCurrency total "USD"}}');
    expect(result.referencedHelpers).toContain('formatCurrency');
  });

  it('should warn about unescaped variables', () => {
    const result = validateTemplate('{{{userContent}}}');
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'UNESCAPED_VARIABLE' }),
      ])
    );
  });

  it('should report complexity level', () => {
    // Simple template
    const simple = validateTemplate('Hello, {{name}}!');
    expect(simple.complexity).toBe('low');

    // Complex template with loops and conditionals
    const complex = validateTemplate(`
      {{#each items}}
        {{#if this.active}}
          {{#each this.subItems}}
            {{formatCurrency this.price "USD"}}
          {{/each}}
        {{/if}}
      {{/each}}
    `);
    expect(complex.complexity).toBe('high');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VARIABLE EXTRACTION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Variable Extraction', () => {
  it('should extract simple variables', () => {
    const vars = extractVariables('{{name}} is {{age}} years old');
    expect(vars).toEqual(['name', 'age']);
  });

  it('should extract nested variables', () => {
    const vars = extractVariables('{{user.name}} lives in {{user.address.city}}');
    expect(vars).toEqual(['user.name', 'user.address.city']);
  });

  it('should extract variables from conditionals', () => {
    const vars = extractVariables('{{#if active}}{{name}}{{/if}}');
    expect(vars).toEqual(expect.arrayContaining(['active', 'name']));
  });

  it('should extract loop variables', () => {
    const vars = extractVariables('{{#each orders}}{{this.id}}{{/each}}');
    expect(vars).toEqual(expect.arrayContaining(['orders']));
  });

  it('should not include helper names as variables', () => {
    const vars = extractVariables('{{formatDate createdAt "MMM d"}}');
    expect(vars).toContain('createdAt');
    expect(vars).not.toContain('formatDate');
  });
});
```

### Integration Testing

```typescript
import {
  createTemplate,
  updateTemplate,
  getTemplate,
  renderEmail,
  renderSms,
  renderNotification,
  listTemplateVersions,
  restoreTemplateVersion,
  createLayout,
  registerPartial,
  preview,
} from '@mcv/shared/templates';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE CRUD + RENDERING INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Template CRUD Integration', () => {
  const ventureId = 'test-venture-uuid';

  it('should create, render, update, and version a template', async () => {
    // Create
    const template = await createTemplate({
      ventureId,
      type: 'email',
      name: 'Test Email',
      slug: 'test-email',
      subject: 'Hello {{name}}',
      body: '<p>Welcome, {{name}}!</p>',
      variables: [
        { name: 'name', type: 'string', required: true, description: 'User name' },
      ],
      createdBy: 'test-user',
    });

    expect(template.id).toBeDefined();
    expect(template.version).toBe(1);

    // Render
    const email = await renderEmail('test-email', {
      ventureId,
      locale: 'en-US',
      variables: { name: 'Alice' },
    });

    expect(email.subject).toBe('Hello Alice');
    expect(email.html).toContain('Welcome, Alice!');
    expect(email.text).toContain('Welcome, Alice!');

    // Update (creates version 2)
    await updateTemplate(template.id, {
      body: '<p>Welcome aboard, {{name}}! 🎉</p>',
      changeNote: 'Added emoji',
      updatedBy: 'test-user',
    });

    // Verify version history
    const versions = await listTemplateVersions(template.id);
    expect(versions).toHaveLength(2);
    expect(versions[0].version).toBe(2);

    // Render updated version
    const email2 = await renderEmail('test-email', {
      ventureId,
      locale: 'en-US',
      variables: { name: 'Bob' },
    });
    expect(email2.html).toContain('Welcome aboard, Bob! 🎉');

    // Rollback to version 1
    await restoreTemplateVersion(template.id, 1, {
      restoredBy: 'test-user',
      changeNote: 'Rollback — emoji not rendering in Outlook',
    });

    // Verify rollback
    const restored = await getTemplate({ ventureId, slug: 'test-email', type: 'email' });
    expect(restored.version).toBe(3); // New version created from v1 content
    expect(restored.body).toContain('Welcome, {{name}}!');
    expect(restored.body).not.toContain('🎉');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT + PARTIAL INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Layout and Partial Integration', () => {
  const ventureId = 'test-venture-uuid';

  it('should wrap template in layout and resolve partials', async () => {
    // Create layout
    await createLayout({
      ventureId,
      name: 'Test Layout',
      slug: 'test-layout',
      type: 'email',
      isDefault: true,
      body: '<html><body><header>HEADER</header>{{> @content}}<footer>FOOTER</footer></body></html>',
      createdBy: 'test-user',
    });

    // Register partial
    await registerPartial({
      ventureId,
      name: 'greeting',
      body: '<p class="greeting">Hello, {{name}}!</p>',
      createdBy: 'test-user',
    });

    // Create template using partial
    await createTemplate({
      ventureId,
      type: 'email',
      name: 'Layout Test',
      slug: 'layout-test',
      subject: 'Test',
      body: '{{> greeting name=user.name}}<p>Content here.</p>',
      variables: [
        { name: 'user.name', type: 'string', required: true, description: 'Name' },
      ],
      createdBy: 'test-user',
    });

    // Render — should use default layout and resolve partial
    const email = await renderEmail('layout-test', {
      ventureId,
      locale: 'en-US',
      variables: { user: { name: 'Charlie' } },
    });

    expect(email.html).toContain('HEADER');
    expect(email.html).toContain('Hello, Charlie!');
    expect(email.html).toContain('Content here.');
    expect(email.html).toContain('FOOTER');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOCALE FALLBACK INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Locale Fallback', () => {
  const ventureId = 'test-venture-uuid';

  it('should fall back from specific locale to default', async () => {
    // Create only en-US template
    await createTemplate({
      ventureId,
      type: 'email',
      name: 'Welcome',
      slug: 'welcome',
      subject: 'Welcome!',
      body: '<p>Welcome, {{name}}!</p>',
      locale: 'en-US',
      createdBy: 'test-user',
    });

    // Request fr-CA (doesn't exist)
    const email = await renderEmail('welcome', {
      ventureId,
      locale: 'fr-CA',
      variables: { name: 'Jean' },
    });

    // Should fall back to en-US
    expect(email.resolvedLocale).toBe('en-US');
    expect(email.html).toContain('Welcome, Jean!');
    expect(email.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'LOCALE_FALLBACK' }),
      ])
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SMS SEGMENT CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('SMS Rendering', () => {
  it('should calculate GSM-7 segments correctly', async () => {
    const sms = await renderSms('test-sms', {
      ventureId: 'test-venture-uuid',
      locale: 'en-US',
      variables: { code: '123456' },
    });

    expect(sms.encoding).toBe('gsm7');
    expect(sms.segments).toBe(1);
  });

  it('should detect Unicode and calculate UCS-2 segments', async () => {
    const sms = await renderSms('emoji-sms', {
      ventureId: 'test-venture-uuid',
      locale: 'en-US',
      variables: { emoji: '🎉' },
    });

    expect(sms.encoding).toBe('ucs2');
  });

  it('should warn on multi-segment messages', async () => {
    const sms = await renderSms('long-sms', {
      ventureId: 'test-venture-uuid',
      locale: 'en-US',
      variables: { content: 'A'.repeat(200) },
    });

    expect(sms.segments).toBeGreaterThan(1);
    expect(sms.isLong).toBe(true);
    expect(sms.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SMS_MULTI_SEGMENT' }),
      ])
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PREVIEW INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Template Preview', () => {
  it('should render preview with sample data', async () => {
    const previewResult = await preview({
      templateId: 'template-uuid',
    });

    expect(previewResult.html).toBeTruthy();
    expect(previewResult.renderTimeMs).toBeGreaterThan(0);
  });

  it('should merge override variables with sample data', async () => {
    const previewResult = await preview({
      templateId: 'template-uuid',
      overrideVariables: { user: { name: 'Custom Name' } },
    });

    expect(previewResult.html).toContain('Custom Name');
  });
});
```

---

## API Routes

The templates module exposes the following tRPC routes (consumed by the admin UI):

| Route | Method | Description |
|-------|--------|-------------|
| `templates.list` | query | List templates with filters and pagination |
| `templates.get` | query | Get template by ID |
| `templates.getBySlug` | query | Get template by slug+type+locale |
| `templates.create` | mutation | Create new template |
| `templates.update` | mutation | Update template (creates version) |
| `templates.delete` | mutation | Soft-delete template |
| `templates.duplicate` | mutation | Clone template |
| `templates.activate` | mutation | Activate template |
| `templates.deactivate` | mutation | Deactivate template |
| `templates.versions.list` | query | List version history |
| `templates.versions.get` | query | Get specific version |
| `templates.versions.restore` | mutation | Restore previous version |
| `templates.versions.diff` | query | Diff two versions |
| `templates.preview` | mutation | Render preview with data |
| `templates.validate` | mutation | Validate template syntax |
| `templates.extractVariables` | query | Extract variables from body |
| `layouts.list` | query | List layouts |
| `layouts.get` | query | Get layout by ID |
| `layouts.create` | mutation | Create layout |
| `layouts.update` | mutation | Update layout |
| `layouts.delete` | mutation | Soft-delete layout |
| `partials.list` | query | List partials |
| `partials.get` | query | Get partial by name |
| `partials.create` | mutation | Register partial |
| `partials.update` | mutation | Update partial |
| `partials.delete` | mutation | Remove partial |
| `helpers.list` | query | List registered helpers |

---

*@mcv/shared/templates — Unified Template Engine for MCV.ONE*