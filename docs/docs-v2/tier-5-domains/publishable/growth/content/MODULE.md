# @mcv/growth/content

> Content Management submodule for the MCV.ONE platform — creation, scheduling, publishing, and distribution of marketing and growth content across channels.

**Package:** `@mcv/growth/content`
**Layer:** Tier 5 — Domain Module
**Parent:** `@mcv/growth`
**Since:** 0.1.0
**Status:** Stable

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
- [Core Interfaces](#core-interfaces)
- [Database Schemas](#database-schemas)
- [Code Examples](#code-examples)
- [Error Codes](#error-codes)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)

---

## Purpose

The `@mcv/growth/content` module provides a full-lifecycle content management system designed for growth and marketing teams operating within the MCV.ONE multi-tenant platform. It solves the core problem of fragmented content workflows — where creation, review, scheduling, publishing, analytics, and localization are typically scattered across disconnected tools — by unifying them into a single, tenant-isolated, API-driven system.

### What This Module Does

1. **Content Lifecycle Management** — Manages content from initial draft through editorial review, approval, scheduled publication, and eventual archival. Every state transition is auditable, reversible, and permission-gated.

2. **Multi-Type Content Modeling** — Supports diverse content types (blog posts, landing pages, knowledge base articles, case studies, whitepapers, press releases, email templates) with type-specific schemas, validation rules, and rendering pipelines.

3. **Rich Editing Experience** — Provides a unified editor abstraction supporting both Markdown and WYSIWYG modes with media embedding, code blocks, tables, callouts, and custom component slots.

4. **Content Calendar & Scheduling** — Offers a visual calendar interface for planning publication timelines, assigning team members, managing editorial deadlines, and coordinating cross-channel launches.

5. **Multi-Channel Publishing** — Publishes content to websites (CMS), blogs, social media platforms, and email campaigns with platform-specific formatting, character limits, and media requirements.

6. **SEO Optimization** — Integrates SEO tooling for meta tag management, structured data generation, readability scoring, keyword density analysis, and internal linking suggestions.

7. **Versioning & Collaboration** — Maintains full version history with diff viewing, rollback capability, collaborative editing support, and granular change tracking.

8. **Approval Workflows** — Implements configurable review chains with role-based approvers, comment/feedback loops, escalation paths, and SLA tracking.

9. **Content Analytics** — Tracks page views, time on page, bounce rate, scroll depth, conversion attribution, and composite content scoring to measure content effectiveness.

10. **Localization** — Supports multi-language content with translation workflows, locale-specific publishing rules, RTL layout support, and translation memory integration.

11. **AI Assistance** — Leverages AI (via OpenRouter) for content suggestions, title generation, summary creation, SEO recommendations, tone analysis, and readability improvements.

### Why It Exists

Growth teams need to produce, distribute, and measure content at scale. Without a unified system, they face:

- **Context switching** between CMS, scheduling tools, analytics dashboards, and review systems
- **Inconsistent publishing** across channels due to manual formatting
- **Lost institutional knowledge** when content isn't versioned or searchable
- **Bottlenecked approvals** when review processes are ad-hoc
- **Blind optimization** when analytics aren't tied back to content decisions

This module eliminates those gaps by embedding content management directly into the MCV.ONE growth stack, inheriting the platform's multi-tenancy, permissions, audit logging, and real-time capabilities.

### Design Philosophy

- **Tenant-first** — Every query, mutation, and storage operation is scoped to the active tenant via Supabase RLS. Content never leaks across tenant boundaries.
- **Type-safe end-to-end** — From database schema (Drizzle ORM) through API layer (tRPC) to client consumption, every content operation is fully typed.
- **Event-driven** — Content lifecycle transitions emit domain events that other modules (analytics, notifications, integrations) can subscribe to.
- **AI-augmented, not AI-dependent** — AI features enhance human workflows but never replace editorial judgment. All AI suggestions require human approval.
- **Channel-agnostic core** — Content is stored in a normalized, channel-agnostic format and transformed at publish time for each target platform.

---

## Exports

### Services

| Export | Type | Description |
|--------|------|-------------|
| `ContentService` | Class | Primary service — CRUD, lifecycle, search, bulk operations |
| `ContentCalendarService` | Class | Calendar management — scheduling, timeline, assignments |
| `ContentPublishService` | Class | Multi-channel publishing — format, distribute, verify |
| `ContentVersionService` | Class | Version history — create, diff, rollback, compare |
| `ContentApprovalService` | Class | Approval workflows — submit, review, approve, reject |
| `ContentAnalyticsService` | Class | Analytics — track, aggregate, score, report |
| `ContentLocalizationService` | Class | Localization — translate, manage locales, sync |
| `ContentAIService` | Class | AI assistance — suggest, generate, optimize |
| `ContentSEOService` | Class | SEO tooling — meta, structured data, scoring |
| `ContentMediaService` | Class | Media management — upload, transform, organize |

### Router

| Export | Type | Description |
|--------|------|-------------|
| `contentRouter` | tRPC Router | Complete tRPC router for all content operations |
| `contentCalendarRouter` | tRPC Router | Calendar-specific endpoints |
| `contentPublishRouter` | tRPC Router | Publishing-specific endpoints |
| `contentAnalyticsRouter` | tRPC Router | Analytics-specific endpoints |

### Schemas (Drizzle)

| Export | Type | Description |
|--------|------|-------------|
| `contents` | Table | Core content records |
| `contentVersions` | Table | Version history entries |
| `contentTypes` | Table | Content type definitions |
| `contentCalendar` | Table | Calendar/scheduling entries |
| `publishTargets` | Table | Publishing target configurations |
| `contentApprovals` | Table | Approval workflow records |
| `contentAnalytics` | Table | Analytics event data |
| `contentTranslations` | Table | Localized content variants |
| `contentMedia` | Table | Media attachments |
| `contentTags` | Table | Tag/category associations |

### Validation (Zod)

| Export | Type | Description |
|--------|------|-------------|
| `CreateContentSchema` | Zod Schema | Validates content creation input |
| `UpdateContentSchema` | Zod Schema | Validates content update input |
| `PublishContentSchema` | Zod Schema | Validates publish operations |
| `ContentFilterSchema` | Zod Schema | Validates search/filter parameters |
| `ContentCalendarSchema` | Zod Schema | Validates calendar entry input |
| `ApprovalActionSchema` | Zod Schema | Validates approval workflow actions |
| `ContentSEOSchema` | Zod Schema | Validates SEO metadata input |
| `ContentLocaleSchema` | Zod Schema | Validates localization input |
| `AIContentRequestSchema` | Zod Schema | Validates AI generation requests |

### Types

| Export | Type | Description |
|--------|------|-------------|
| `Content` | Interface | Core content entity |
| `ContentType` | Interface | Content type definition |
| `ContentStatus` | Enum | Lifecycle states |
| `ContentCalendarEntry` | Interface | Calendar entry entity |
| `PublishTarget` | Interface | Publish target configuration |
| `ContentVersion` | Interface | Version snapshot |
| `ApprovalWorkflow` | Interface | Approval chain definition |
| `ApprovalAction` | Interface | Individual approval action |
| `ContentAnalyticsRecord` | Interface | Analytics data point |
| `ContentScore` | Interface | Composite content score |
| `LocalizedContent` | Interface | Localized content variant |
| `ContentMediaAttachment` | Interface | Media attachment entity |
| `SEOMetadata` | Interface | SEO metadata structure |
| `AIContentSuggestion` | Interface | AI-generated suggestion |
| `ContentFilter` | Interface | Search/filter parameters |
| `ContentSortField` | Enum | Available sort fields |
| `PublishResult` | Interface | Publishing operation result |
| `ContentDiff` | Interface | Version diff output |
| `EditorBlock` | Interface | Rich editor block structure |
| `ContentPermission` | Enum | Content-level permissions |

### Utilities

| Export | Type | Description |
|--------|------|-------------|
| `renderContentToHTML` | Function | Renders editor blocks to HTML |
| `renderContentToMarkdown` | Function | Renders editor blocks to Markdown |
| `renderContentToPlainText` | Function | Strips formatting for plain text |
| `calculateReadingTime` | Function | Estimates reading time from content |
| `calculateReadabilityScore` | Function | Flesch-Kincaid and other readability metrics |
| `extractKeywords` | Function | Extracts keywords from content body |
| `generateSlug` | Function | Creates URL-safe slugs from titles |
| `generateExcerpt` | Function | Auto-generates content excerpts |
| `sanitizeHTML` | Function | Sanitizes HTML for safe rendering |
| `diffContentVersions` | Function | Computes diff between two versions |
| `formatForChannel` | Function | Formats content for a specific publish channel |
| `validateSEOMetadata` | Function | Validates SEO metadata completeness |

### Constants

| Export | Type | Description |
|--------|------|-------------|
| `CONTENT_STATUSES` | Array | All valid content statuses |
| `DEFAULT_CONTENT_TYPES` | Array | Built-in content type definitions |
| `PUBLISH_CHANNELS` | Array | Supported publish channel identifiers |
| `SEO_LIMITS` | Object | Character limits for SEO fields |
| `READABILITY_THRESHOLDS` | Object | Readability score thresholds |
| `CONTENT_ERROR_CODES` | Object | All error codes for this module |
| `MAX_CONTENT_SIZE_BYTES` | Number | Maximum content body size |
| `MAX_MEDIA_SIZE_BYTES` | Number | Maximum media attachment size |
| `SUPPORTED_MEDIA_TYPES` | Array | Allowed media MIME types |
| `DEFAULT_LOCALE` | String | Default content locale (en-US) |

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐     │
│  │ Content       │  │ Calendar     │  │ Analytics              │     │
│  │ Editor UI     │  │ View UI      │  │ Dashboard UI           │     │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────────┘     │
│         │                  │                    │                     │
│  ═══════╪══════════════════╪════════════════════╪═══════════════     │
│         │           tRPC Client                 │                     │
│  ═══════╪══════════════════╪════════════════════╪═══════════════     │
└─────────┼──────────────────┼────────────────────┼───────────────────┘
          │                  │                    │
┌─────────┼──────────────────┼────────────────────┼───────────────────┐
│         ▼                  ▼                    ▼    API Layer       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐     │
│  │ contentRouter│  │ calendarRouter│  │ analyticsRouter        │     │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────────┘     │
│         │                  │                    │                     │
│  ═══════╪══════════════════╪════════════════════╪═══════════════     │
│         │         Service Layer                 │                     │
│  ═══════╪══════════════════╪════════════════════╪═══════════════     │
│         ▼                  ▼                    ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐     │
│  │ Content      │  │ Calendar     │  │ Analytics              │     │
│  │ Service      │  │ Service      │  │ Service                │     │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────────┘     │
│         │                  │                    │                     │
│         ├──────────────────┼────────────────────┤                     │
│         ▼                  ▼                    ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐     │
│  │ Version      │  │ Publish      │  │ SEO                    │     │
│  │ Service      │  │ Service      │  │ Service                │     │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────────┘     │
│         │                  │                    │                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐     │
│  │ Approval     │  │ Localization │  │ AI                     │     │
│  │ Service      │  │ Service      │  │ Service                │     │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────────┘     │
│         │                  │                    │                     │
│  ┌──────────────┐                                                    │
│  │ Media        │                                                    │
│  │ Service      │                                                    │
│  └──────┬───────┘                                                    │
│         │                                                            │
│  ═══════╪════════════════════════════════════════════════════════    │
│         │              Data Layer                                     │
│  ═══════╪════════════════════════════════════════════════════════    │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Drizzle ORM + Supabase                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │   │
│  │  │ contents │ │ versions │ │ calendar │ │analytics │        │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │   │
│  │  │ targets  │ │approvals │ │ translations│ │  media  │        │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │   │
│  │  ┌──────────┐ ┌──────────┐                                    │   │
│  │  │  tags    │ │  types   │        RLS: tenant_id scoping      │   │
│  │  └──────────┘ └──────────┘                                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────┐  ┌─────────────────────────────┐  │
│  │   Supabase Storage           │  │   OpenRouter (AI)            │  │
│  │   (Media Files)              │  │   (Content Generation)       │  │
│  └──────────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Content Lifecycle State Machine

```
                    ┌────────┐
                    │  DRAFT │◄──────────────────────────┐
                    └───┬────┘                            │
                        │                                 │
                        │ submit_for_review()             │ request_changes()
                        ▼                                 │
                   ┌─────────┐                            │
              ┌────│ REVIEW  │────────────────────────────┘
              │    └────┬────┘
              │         │
              │         │ approve()
              │         ▼
              │    ┌──────────┐
              │    │ APPROVED │
              │    └────┬─────┘
              │         │
              │         ├── publish_now() ──────┐
              │         │                        │
              │         │ schedule()              │
              │         ▼                        │
              │    ┌───────────┐                  │
              │    │ SCHEDULED │                  │
              │    └─────┬─────┘                  │
              │          │                        │
              │          │ publish_at_time()      │
              │          ▼                        ▼
              │    ┌───────────┐          ┌───────────┐
              │    │ PUBLISHED │◄─────────│ PUBLISHED │
              │    └─────┬─────┘          └───────────┘
              │          │
              │          │ unpublish()         │ archive()
              │          ▼                     ▼
              │    ┌───────────┐         ┌──────────┐
              └───►│ UNPUBLISHED│         │ ARCHIVED │
                   └───────────┘         └──────────┘
```

### Service Interaction Patterns

#### Content Creation Flow

```
Client ──► contentRouter.create()
               │
               ├─► ContentService.create()
               │       │
               │       ├─► Validate input (Zod schema)
               │       ├─► Generate slug (unique per tenant)
               │       ├─► Insert into `contents` table
               │       ├─► ContentVersionService.createInitialVersion()
               │       ├─► ContentMediaService.attachMedia() (if media present)
               │       ├─► ContentSEOService.generateDefaults()
               │       └─► Emit 'content.created' event
               │
               └─► Return Content
```

#### Publishing Flow

```
Client ──► contentPublishRouter.publish()
               │
               ├─► ContentPublishService.publish()
               │       │
               │       ├─► Verify status === 'approved' || 'scheduled'
               │       ├─► ContentSEOService.validate() — ensure SEO readiness
               │       ├─► For each PublishTarget:
               │       │       ├─► formatForChannel(content, target)
               │       │       ├─► target.adapter.publish(formattedContent)
               │       │       └─► Record publish result
               │       ├─► Update content status → 'published'
               │       ├─► ContentVersionService.createVersion('published')
               │       ├─► ContentAnalyticsService.initTracking()
               │       └─► Emit 'content.published' event
               │
               └─► Return PublishResult[]
```

#### Approval Flow

```
Client ──► contentRouter.submitForReview()
               │
               ├─► ContentApprovalService.submit()
               │       │
               │       ├─► Load workflow for content type
               │       ├─► Identify required approvers (by role/user)
               │       ├─► Create approval records (pending)
               │       ├─► Update content status → 'review'
               │       ├─► Notify approvers
               │       └─► Emit 'content.review_requested' event
               │
Approver ──► contentRouter.approve()
               │
               ├─► ContentApprovalService.approve()
               │       │
               │       ├─► Record approval decision
               │       ├─► Check: all required approvals met?
               │       │       ├─► Yes → Update status → 'approved'
               │       │       │         Emit 'content.approved' event
               │       │       └─► No  → Await remaining approvals
               │       └─► Notify content author
               │
               └─► Return ApprovalAction
```

### Event System

Content operations emit domain events that other modules can subscribe to:

| Event | Payload | Emitted When |
|-------|---------|-------------|
| `content.created` | `{ contentId, tenantId, authorId, type }` | New content created |
| `content.updated` | `{ contentId, tenantId, changes, updatedBy }` | Content body/metadata updated |
| `content.status_changed` | `{ contentId, tenantId, from, to, changedBy }` | Lifecycle status transition |
| `content.review_requested` | `{ contentId, tenantId, authorId, approvers }` | Submitted for review |
| `content.approved` | `{ contentId, tenantId, approvedBy }` | All approvals met |
| `content.rejected` | `{ contentId, tenantId, rejectedBy, reason }` | Approval rejected |
| `content.published` | `{ contentId, tenantId, channels, publishedBy }` | Published to channels |
| `content.unpublished` | `{ contentId, tenantId, unpublishedBy }` | Removed from publication |
| `content.archived` | `{ contentId, tenantId, archivedBy }` | Moved to archive |
| `content.deleted` | `{ contentId, tenantId, deletedBy }` | Soft-deleted |
| `content.version_created` | `{ contentId, tenantId, versionId, versionNumber }` | New version saved |
| `content.version_rollback` | `{ contentId, tenantId, fromVersion, toVersion }` | Rolled back to prior version |
| `content.translated` | `{ contentId, tenantId, locale, translatedBy }` | Translation added/updated |
| `content.media_attached` | `{ contentId, tenantId, mediaId, mediaType }` | Media file attached |
| `content.scheduled` | `{ contentId, tenantId, scheduledAt, channels }` | Publication scheduled |

### Multi-Tenancy

All data access is scoped by `tenant_id` through Supabase Row-Level Security (RLS):

- Every table includes a `tenant_id` column with a foreign key to the tenants table
- RLS policies enforce `tenant_id = auth.jwt() ->> 'tenant_id'` on all operations
- The Drizzle ORM query builder automatically includes tenant scoping via a shared `withTenant()` helper
- Cross-tenant content access is impossible at the database level
- Tenant-specific configurations (content types, workflows, publish targets) are isolated

```sql
-- Example RLS policy on contents table
CREATE POLICY "tenant_isolation" ON contents
  USING (tenant_id = (current_setting('app.current_tenant_id'))::uuid)
  WITH CHECK (tenant_id = (current_setting('app.current_tenant_id'))::uuid);
```

---

## Core Interfaces

### Content

The primary content entity representing a single piece of content.

```typescript
/**
 * Core content entity.
 *
 * Represents a single piece of content in the system, including its body,
 * metadata, SEO information, and lifecycle state. Content is always scoped
 * to a tenant and owned by an author.
 */
interface Content {
  /** Unique content identifier (UUID v7) */
  id: string;

  /** Tenant this content belongs to */
  tenantId: string;

  /** Content type identifier (references content_types.id) */
  typeId: string;

  /** URL-safe slug, unique per tenant */
  slug: string;

  /** Content title / headline */
  title: string;

  /** Short subtitle or deck */
  subtitle: string | null;

  /**
   * Content body as structured editor blocks.
   * Stored as JSONB for flexible rendering.
   */
  body: EditorBlock[];

  /** Plain text excerpt for previews and search */
  excerpt: string | null;

  /** Featured image URL (Supabase Storage) */
  featuredImageUrl: string | null;

  /** Featured image alt text for accessibility */
  featuredImageAlt: string | null;

  /** Current lifecycle status */
  status: ContentStatus;

  /** SEO metadata */
  seo: SEOMetadata;

  /** Author user ID */
  authorId: string;

  /** Last editor user ID (may differ from author) */
  lastEditorId: string;

  /** Current version number (1-based, increments on save) */
  currentVersionNumber: number;

  /** Estimated reading time in minutes */
  readingTimeMinutes: number;

  /** Word count */
  wordCount: number;

  /** Primary locale (BCP 47 language tag) */
  locale: string;

  /** Available translation locales */
  availableLocales: string[];

  /** Tag IDs associated with this content */
  tagIds: string[];

  /** Category ID (optional hierarchical categorization) */
  categoryId: string | null;

  /** Custom metadata (tenant-defined fields) */
  customFields: Record<string, unknown>;

  /** Whether content is pinned/featured */
  isPinned: boolean;

  /** Whether content allows comments */
  commentsEnabled: boolean;

  /** Publish date (set when first published) */
  publishedAt: string | null;

  /** Scheduled publication date (if status is 'scheduled') */
  scheduledAt: string | null;

  /** Soft delete flag */
  isDeleted: boolean;

  /** Deleted at timestamp */
  deletedAt: string | null;

  /** Created at timestamp (ISO 8601) */
  createdAt: string;

  /** Last updated timestamp (ISO 8601) */
  updatedAt: string;
}
```

### ContentStatus

```typescript
/**
 * Content lifecycle status.
 *
 * Defines the possible states of content in the publishing pipeline.
 * Transitions between states are governed by the state machine and
 * require appropriate permissions.
 */
enum ContentStatus {
  /** Initial state — content is being authored */
  DRAFT = 'draft',

  /** Submitted for editorial review */
  REVIEW = 'review',

  /** All required approvals obtained */
  APPROVED = 'approved',

  /** Publication date/time set for the future */
  SCHEDULED = 'scheduled',

  /** Live and publicly accessible */
  PUBLISHED = 'published',

  /** Previously published, now removed from public access */
  UNPUBLISHED = 'unpublished',

  /** Retained for reference but not active */
  ARCHIVED = 'archived',
}
```

### ContentType

```typescript
/**
 * Content type definition.
 *
 * Defines a category of content with its own schema, validation rules,
 * default settings, and rendering configuration. Tenants can create
 * custom content types or use the built-in defaults.
 */
interface ContentType {
  /** Unique type identifier (UUID v7) */
  id: string;

  /** Tenant ID (null for system-wide built-in types) */
  tenantId: string | null;

  /** Machine-readable type key (e.g., 'blog_post', 'landing_page') */
  key: string;

  /** Human-readable display name */
  name: string;

  /** Description of this content type */
  description: string;

  /** Icon identifier for UI */
  icon: string;

  /** Color hex for calendar/UI differentiation */
  color: string;

  /**
   * JSON Schema for custom fields specific to this type.
   * Validated on content creation and update.
   */
  customFieldsSchema: Record<string, unknown> | null;

  /** Default SEO template for this type */
  defaultSEOTemplate: Partial<SEOMetadata> | null;

  /** Default approval workflow ID for this type */
  defaultWorkflowId: string | null;

  /** Allowed publish targets for this type */
  allowedPublishTargets: string[];

  /** Whether this type supports localization */
  localizationEnabled: boolean;

  /** Whether this type supports comments */
  commentsSupported: boolean;

  /** Maximum body size in characters (null = platform default) */
  maxBodyLength: number | null;

  /** Whether this is a system built-in type */
  isBuiltIn: boolean;

  /** Sort order for UI listing */
  sortOrder: number;

  /** Active flag */
  isActive: boolean;

  /** Created at timestamp */
  createdAt: string;

  /** Updated at timestamp */
  updatedAt: string;
}
```

### EditorBlock

```typescript
/**
 * Rich editor block structure.
 *
 * Content bodies are stored as ordered arrays of EditorBlocks,
 * supporting a block-based editing paradigm similar to Notion or
 * Editor.js. Each block has a type, content, and optional metadata.
 */
interface EditorBlock {
  /** Unique block identifier within the content */
  id: string;

  /** Block type discriminator */
  type: EditorBlockType;

  /** Block content — structure varies by type */
  data: EditorBlockData;

  /** Optional child blocks (for nested structures like columns) */
  children?: EditorBlock[];

  /** Block-level metadata */
  meta?: {
    /** Text alignment */
    align?: 'left' | 'center' | 'right' | 'justify';

    /** Custom CSS class names */
    className?: string;

    /** Anchor ID for deep linking */
    anchorId?: string;

    /** Whether this block is collapsed (for toggle blocks) */
    collapsed?: boolean;
  };
}

/**
 * Supported editor block types.
 */
type EditorBlockType =
  | 'paragraph'
  | 'heading'
  | 'blockquote'
  | 'code'
  | 'image'
  | 'video'
  | 'embed'
  | 'table'
  | 'list'
  | 'checklist'
  | 'callout'
  | 'divider'
  | 'toggle'
  | 'columns'
  | 'button'
  | 'html'
  | 'toc';

/**
 * Union type for block-specific data payloads.
 */
type EditorBlockData =
  | ParagraphBlockData
  | HeadingBlockData
  | BlockquoteBlockData
  | CodeBlockData
  | ImageBlockData
  | VideoBlockData
  | EmbedBlockData
  | TableBlockData
  | ListBlockData
  | ChecklistBlockData
  | CalloutBlockData
  | DividerBlockData
  | ToggleBlockData
  | ColumnsBlockData
  | ButtonBlockData
  | HTMLBlockData
  | TOCBlockData;

/** Paragraph block: rich text content */
interface ParagraphBlockData {
  /** Rich text with inline formatting */
  text: RichTextSegment[];
}

/** Heading block: h1-h6 */
interface HeadingBlockData {
  /** Heading level (1-6) */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** Heading text segments */
  text: RichTextSegment[];
}

/** Code block with syntax highlighting */
interface CodeBlockData {
  /** Source code */
  code: string;
  /** Programming language for highlighting */
  language: string;
  /** Optional filename display */
  filename?: string;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Lines to highlight */
  highlightLines?: number[];
}

/** Image block */
interface ImageBlockData {
  /** Image URL (Supabase Storage) */
  url: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Optional caption */
  caption?: string;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
}

/** Table block */
interface TableBlockData {
  /** Whether first row is a header */
  hasHeader: boolean;
  /** Table rows, each containing cell data */
  rows: TableRow[];
}

interface TableRow {
  cells: RichTextSegment[][];
}

/** Callout block: highlighted information box */
interface CalloutBlockData {
  /** Callout style/severity */
  variant: 'info' | 'warning' | 'error' | 'success' | 'tip' | 'note';
  /** Optional icon override */
  icon?: string;
  /** Callout title */
  title?: string;
  /** Callout body text */
  text: RichTextSegment[];
}

/** Rich text segment with inline formatting */
interface RichTextSegment {
  /** Plain text content */
  text: string;
  /** Bold formatting */
  bold?: boolean;
  /** Italic formatting */
  italic?: boolean;
  /** Underline formatting */
  underline?: boolean;
  /** Strikethrough formatting */
  strikethrough?: boolean;
  /** Inline code formatting */
  code?: boolean;
  /** Hyperlink URL */
  link?: string;
  /** Text color override */
  color?: string;
  /** Background highlight color */
  highlight?: string;
}
```

### ContentCalendarEntry

```typescript
/**
 * Content calendar entry.
 *
 * Represents a scheduled slot on the content calendar, linking a piece
 * of content to a target publication date, assigned team members, and
 * publication channels.
 */
interface ContentCalendarEntry {
  /** Unique entry identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Associated content ID (null for placeholder/idea entries) */
  contentId: string | null;

  /** Calendar entry title (defaults to content title) */
  title: string;

  /** Brief description or notes */
  description: string | null;

  /** Scheduled date (ISO 8601 date) */
  scheduledDate: string;

  /** Scheduled time (ISO 8601 time, null for date-only) */
  scheduledTime: string | null;

  /** Full scheduled datetime (ISO 8601, computed from date + time + timezone) */
  scheduledAt: string | null;

  /** Timezone for scheduling (IANA timezone) */
  timezone: string;

  /** Target publish channels */
  channelIds: string[];

  /** Assigned team member user IDs */
  assigneeIds: string[];

  /** Content type ID (for filtering) */
  typeId: string | null;

  /** Calendar entry status */
  entryStatus: 'idea' | 'planned' | 'in_progress' | 'ready' | 'published' | 'cancelled';

  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'urgent';

  /** Color label for visual differentiation */
  color: string | null;

  /** Whether this is a recurring entry */
  isRecurring: boolean;

  /** Recurrence rule (RFC 5545 RRULE format) */
  recurrenceRule: string | null;

  /** Parent recurring entry ID (for generated instances) */
  parentEntryId: string | null;

  /** Created at timestamp */
  createdAt: string;

  /** Updated at timestamp */
  updatedAt: string;
}
```

### PublishTarget

```typescript
/**
 * Publish target configuration.
 *
 * Defines a destination channel where content can be published.
 * Each target includes connection credentials, formatting rules,
 * and channel-specific constraints.
 */
interface PublishTarget {
  /** Unique target identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Target channel type */
  channel: PublishChannel;

  /** Human-readable target name (e.g., "Company Blog", "Twitter Main") */
  name: string;

  /** Channel-specific configuration (encrypted at rest) */
  config: PublishTargetConfig;

  /** Whether this target is active */
  isActive: boolean;

  /** Default formatting template for this target */
  formattingTemplate: string | null;

  /** Maximum content length for this channel (characters) */
  maxLength: number | null;

  /** Supported media types for this channel */
  supportedMediaTypes: string[];

  /** Whether to auto-publish approved content */
  autoPublish: boolean;

  /** Created at timestamp */
  createdAt: string;

  /** Updated at timestamp */
  updatedAt: string;
}

/**
 * Supported publish channels.
 */
type PublishChannel =
  | 'website'
  | 'blog'
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'medium'
  | 'devto'
  | 'hashnode'
  | 'email'
  | 'newsletter'
  | 'rss'
  | 'custom_webhook';

/**
 * Channel-specific configuration.
 * Union type — actual shape depends on the channel.
 */
type PublishTargetConfig =
  | WebsitePublishConfig
  | SocialMediaPublishConfig
  | EmailPublishConfig
  | WebhookPublishConfig;

interface WebsitePublishConfig {
  /** Base URL of the website */
  baseUrl: string;
  /** API endpoint for content push */
  apiEndpoint: string;
  /** API key or token */
  apiKey: string;
  /** Content path template (e.g., '/blog/{slug}') */
  pathTemplate: string;
}

interface SocialMediaPublishConfig {
  /** OAuth access token */
  accessToken: string;
  /** OAuth refresh token */
  refreshToken: string;
  /** Platform-specific account/page ID */
  accountId: string;
  /** Whether to include featured image */
  includeImage: boolean;
  /** Hashtag strategy */
  hashtagMode: 'auto' | 'manual' | 'none';
}

interface EmailPublishConfig {
  /** Email service provider integration ID */
  providerId: string;
  /** Default sender email */
  fromEmail: string;
  /** Default sender name */
  fromName: string;
  /** Email template ID */
  templateId: string | null;
  /** Mailing list IDs */
  listIds: string[];
}

interface WebhookPublishConfig {
  /** Webhook URL */
  url: string;
  /** HTTP method */
  method: 'POST' | 'PUT';
  /** Custom headers */
  headers: Record<string, string>;
  /** Payload template (Handlebars) */
  payloadTemplate: string;
  /** Webhook secret for signature verification */
  secret: string;
}
```

### ContentVersion

```typescript
/**
 * Content version snapshot.
 *
 * Represents a point-in-time snapshot of content. Every significant
 * change creates a new version, enabling full history traversal,
 * diff comparison, and rollback.
 */
interface ContentVersion {
  /** Unique version identifier */
  id: string;

  /** Parent content ID */
  contentId: string;

  /** Tenant ID */
  tenantId: string;

  /** Sequential version number (1-based) */
  versionNumber: number;

  /** Snapshot of the content title at this version */
  title: string;

  /** Snapshot of the content body at this version */
  body: EditorBlock[];

  /** Snapshot of the excerpt */
  excerpt: string | null;

  /** Snapshot of SEO metadata */
  seo: SEOMetadata;

  /** Snapshot of custom fields */
  customFields: Record<string, unknown>;

  /** Content status at the time of versioning */
  statusAtVersion: ContentStatus;

  /** User who created this version */
  createdBy: string;

  /** Human-readable change summary */
  changeSummary: string | null;

  /** Type of change that triggered versioning */
  changeType: 'manual_save' | 'auto_save' | 'status_change' | 'publish' | 'rollback' | 'import';

  /** Size in bytes of the body snapshot */
  sizeBytes: number;

  /** Created at timestamp */
  createdAt: string;
}
```

### ContentDiff

```typescript
/**
 * Version diff output.
 *
 * Represents the differences between two content versions,
 * suitable for rendering a visual diff view.
 */
interface ContentDiff {
  /** Source version number */
  fromVersion: number;

  /** Target version number */
  toVersion: number;

  /** Title change (null if unchanged) */
  titleDiff: TextDiff | null;

  /** Body block-level changes */
  bodyDiffs: BlockDiff[];

  /** Excerpt change */
  excerptDiff: TextDiff | null;

  /** SEO metadata changes */
  seoDiffs: FieldDiff[];

  /** Custom field changes */
  customFieldDiffs: FieldDiff[];

  /** Summary statistics */
  stats: {
    totalChanges: number;
    additions: number;
    deletions: number;
    modifications: number;
  };
}

interface TextDiff {
  /** Old value */
  oldValue: string;
  /** New value */
  newValue: string;
  /** Character-level diff segments */
  segments: DiffSegment[];
}

interface DiffSegment {
  /** Segment type */
  type: 'equal' | 'insert' | 'delete';
  /** Text content */
  value: string;
}

interface BlockDiff {
  /** Block ID */
  blockId: string;
  /** Change type */
  type: 'added' | 'removed' | 'modified' | 'moved';
  /** Old block (null if added) */
  oldBlock: EditorBlock | null;
  /** New block (null if removed) */
  newBlock: EditorBlock | null;
  /** Position change if moved */
  positionChange?: { from: number; to: number };
}

interface FieldDiff {
  /** Field path (dot-notation) */
  field: string;
  /** Old value */
  oldValue: unknown;
  /** New value */
  newValue: unknown;
}
```

### ApprovalWorkflow

```typescript
/**
 * Approval workflow definition.
 *
 * Defines a multi-step review and approval chain for content.
 * Workflows can be assigned to content types or individual content pieces.
 * Steps are executed in order, with configurable approver roles and escalation.
 */
interface ApprovalWorkflow {
  /** Unique workflow identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Workflow name */
  name: string;

  /** Workflow description */
  description: string;

  /** Ordered approval steps */
  steps: ApprovalStep[];

  /** Whether all steps must complete or any single path suffices */
  mode: 'sequential' | 'parallel';

  /** Auto-approve after this duration (hours) if no response. Null = no auto-approve. */
  autoApproveAfterHours: number | null;

  /** Escalation email if approval is overdue */
  escalationContactId: string | null;

  /** Whether this workflow is active */
  isActive: boolean;

  /** Created at timestamp */
  createdAt: string;

  /** Updated at timestamp */
  updatedAt: string;
}

/**
 * Single step in an approval workflow.
 */
interface ApprovalStep {
  /** Step order (1-based) */
  order: number;

  /** Step name (e.g., "Editorial Review", "Legal Review") */
  name: string;

  /** Approver specification — who can approve this step */
  approvers: ApproverSpec;

  /** How many approvers must approve (1 = any single approver suffices) */
  requiredApprovals: number;

  /** Instructions shown to the approver */
  instructions: string | null;

  /** SLA duration in hours */
  slaHours: number | null;
}

/**
 * Specifies who can act as an approver.
 */
interface ApproverSpec {
  /** Specific user IDs */
  userIds?: string[];

  /** Role IDs — any user with these roles can approve */
  roleIds?: string[];

  /** Team IDs — any member of these teams can approve */
  teamIds?: string[];
}

/**
 * Individual approval action record.
 */
interface ApprovalAction {
  /** Unique action identifier */
  id: string;

  /** Content ID being approved */
  contentId: string;

  /** Tenant ID */
  tenantId: string;

  /** Workflow ID */
  workflowId: string;

  /** Step order number */
  stepOrder: number;

  /** Action taken */
  action: 'approve' | 'reject' | 'request_changes' | 'skip';

  /** User who took the action */
  actorId: string;

  /** Comment / feedback */
  comment: string | null;

  /** Created at timestamp */
  createdAt: string;
}
```

### ContentAnalyticsRecord

```typescript
/**
 * Content analytics data point.
 *
 * Stores aggregated analytics for content performance tracking.
 * Raw events are collected and aggregated into daily/weekly/monthly
 * summaries.
 */
interface ContentAnalyticsRecord {
  /** Unique record identifier */
  id: string;

  /** Content ID */
  contentId: string;

  /** Tenant ID */
  tenantId: string;

  /** Aggregation period start (ISO 8601 date) */
  periodStart: string;

  /** Aggregation period end (ISO 8601 date) */
  periodEnd: string;

  /** Aggregation granularity */
  granularity: 'daily' | 'weekly' | 'monthly';

  /** Total page views */
  pageViews: number;

  /** Unique visitors */
  uniqueVisitors: number;

  /** Average time on page in seconds */
  avgTimeOnPageSeconds: number;

  /** Bounce rate (0-1 decimal) */
  bounceRate: number;

  /** Average scroll depth percentage (0-100) */
  avgScrollDepth: number;

  /** Number of social shares */
  socialShares: number;

  /** Number of comments */
  commentsCount: number;

  /** Number of backlinks detected */
  backlinksCount: number;

  /** Conversion events attributed to this content */
  conversions: number;

  /** Conversion rate (0-1 decimal) */
  conversionRate: number;

  /** Revenue attributed to this content (cents) */
  revenueAttributedCents: number;

  /** Traffic sources breakdown */
  trafficSources: Record<string, number>;

  /** Device type breakdown */
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };

  /** Geographic breakdown (country code → count) */
  geoBreakdown: Record<string, number>;

  /** Created at timestamp */
  createdAt: string;
}
```

### ContentScore

```typescript
/**
 * Composite content score.
 *
 * A multi-dimensional score that rates content quality and performance
 * across several axes. Used for content prioritization, recommendations,
 * and performance dashboards.
 */
interface ContentScore {
  /** Content ID */
  contentId: string;

  /** Overall composite score (0-100) */
  overallScore: number;

  /** Individual dimension scores */
  dimensions: {
    /** SEO readiness score (0-100) */
    seo: number;

    /** Readability score (0-100, based on Flesch-Kincaid) */
    readability: number;

    /** Engagement score (0-100, based on analytics) */
    engagement: number;

    /** Conversion effectiveness (0-100) */
    conversion: number;

    /** Content freshness (0-100, decays over time) */
    freshness: number;

    /** Completeness (0-100, based on filled fields, media, etc.) */
    completeness: number;
  };

  /** Actionable improvement suggestions */
  suggestions: ContentSuggestion[];

  /** Computed at timestamp */
  computedAt: string;
}

interface ContentSuggestion {
  /** Suggestion category */
  category: 'seo' | 'readability' | 'engagement' | 'structure' | 'media' | 'localization';

  /** Severity / importance */
  severity: 'info' | 'warning' | 'critical';

  /** Human-readable suggestion */
  message: string;

  /** Estimated score improvement if implemented */
  estimatedImpact: number;
}
```

### LocalizedContent

```typescript
/**
 * Localized content variant.
 *
 * Represents a translation of content into a specific locale.
 * Translations can be at different stages of completion and
 * may diverge from the source content version.
 */
interface LocalizedContent {
  /** Unique translation identifier */
  id: string;

  /** Parent content ID (source content) */
  contentId: string;

  /** Tenant ID */
  tenantId: string;

  /** BCP 47 locale tag (e.g., 'fr-FR', 'ja', 'ar-SA') */
  locale: string;

  /** Translated title */
  title: string;

  /** Translated subtitle */
  subtitle: string | null;

  /** Translated body */
  body: EditorBlock[];

  /** Translated excerpt */
  excerpt: string | null;

  /** Translated SEO metadata */
  seo: SEOMetadata;

  /** Source content version this translation is based on */
  sourceVersionNumber: number;

  /** Translation status */
  translationStatus: 'pending' | 'in_progress' | 'review' | 'approved' | 'published';

  /** Translator user ID (null for AI translations) */
  translatorId: string | null;

  /** Reviewer user ID */
  reviewerId: string | null;

  /** Whether this was AI-translated */
  isAITranslated: boolean;

  /** Translation quality score (0-100, null if not evaluated) */
  qualityScore: number | null;

  /** Whether RTL layout is needed */
  isRTL: boolean;

  /** Translation notes */
  notes: string | null;

  /** Created at timestamp */
  createdAt: string;

  /** Updated at timestamp */
  updatedAt: string;
}
```

### SEOMetadata

```typescript
/**
 * SEO metadata structure.
 *
 * Contains all SEO-relevant metadata for a piece of content,
 * including meta tags, Open Graph, Twitter Card, and structured data.
 */
interface SEOMetadata {
  /** Meta title (recommended: 50-60 characters) */
  metaTitle: string | null;

  /** Meta description (recommended: 150-160 characters) */
  metaDescription: string | null;

  /** Focus keyword/keyphrase */
  focusKeyword: string | null;

  /** Secondary keywords */
  secondaryKeywords: string[];

  /** Canonical URL (null = auto-generated) */
  canonicalUrl: string | null;

  /** Robots directives */
  robots: {
    index: boolean;
    follow: boolean;
    noArchive?: boolean;
    noSnippet?: boolean;
  };

  /** Open Graph metadata */
  openGraph: {
    title: string | null;
    description: string | null;
    image: string | null;
    type: 'article' | 'website' | 'product' | 'profile';
  };

  /** Twitter Card metadata */
  twitterCard: {
    cardType: 'summary' | 'summary_large_image' | 'player';
    title: string | null;
    description: string | null;
    image: string | null;
  };

  /** JSON-LD structured data */
  structuredData: Record<string, unknown> | null;

  /** Internal linking suggestions (content IDs) */
  suggestedInternalLinks: string[];

  /** Readability metrics */
  readability: {
    /** Flesch-Kincaid Reading Ease (0-100, higher = easier) */
    fleschKincaid: number | null;
    /** Gunning Fog Index */
    gunningFog: number | null;
    /** Average sentence length */
    avgSentenceLength: number | null;
    /** Passive voice percentage */
    passiveVoicePercent: number | null;
  };

  /** Keyword density analysis */
  keywordDensity: Record<string, number>;
}
```

### AIContentSuggestion

```typescript
/**
 * AI-generated content suggestion.
 *
 * Represents a suggestion from the AI service, which may be a
 * title variant, body enhancement, SEO improvement, or entirely
 * new content draft.
 */
interface AIContentSuggestion {
  /** Unique suggestion identifier */
  id: string;

  /** Content ID this suggestion relates to (null for new content) */
  contentId: string | null;

  /** Type of suggestion */
  type: AIContentSuggestionType;

  /** The suggested content/text */
  suggestion: string;

  /** Structured suggestion data (type-specific) */
  data: Record<string, unknown>;

  /** Confidence score (0-1) */
  confidence: number;

  /** Reasoning explanation from the AI */
  reasoning: string;

  /** AI model used */
  model: string;

  /** Token usage */
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  /** Whether the suggestion was accepted by the user */
  accepted: boolean | null;

  /** Created at timestamp */
  createdAt: string;
}

type AIContentSuggestionType =
  | 'title_variants'
  | 'meta_description'
  | 'excerpt'
  | 'body_expansion'
  | 'body_condensation'
  | 'tone_adjustment'
  | 'seo_keywords'
  | 'internal_links'
  | 'content_outline'
  | 'full_draft'
  | 'translation'
  | 'summary'
  | 'social_post'
  | 'email_subject_line';
```

### ContentService

```typescript
/**
 * Primary content management service.
 *
 * Handles CRUD operations, lifecycle transitions, search, and bulk operations
 * for content entities. All operations are tenant-scoped and permission-checked.
 */
interface ContentService {
  // ─── CRUD ──────────────────────────────────────────────

  /**
   * Create a new content piece.
   *
   * @param input - Content creation data
   * @param ctx - Request context (tenant, user, permissions)
   * @returns The created content with initial version
   * @throws CONTENT_TYPE_NOT_FOUND if typeId is invalid
   * @throws SLUG_ALREADY_EXISTS if slug conflicts within tenant
   * @throws INSUFFICIENT_PERMISSIONS if user lacks 'content.create'
   */
  create(input: CreateContentInput, ctx: RequestContext): Promise<Content>;

  /**
   * Get content by ID.
   *
   * @param id - Content ID
   * @param ctx - Request context
   * @param options - Include related data (versions, analytics, translations)
   * @returns Content or null if not found
   */
  getById(
    id: string,
    ctx: RequestContext,
    options?: ContentGetOptions,
  ): Promise<ContentWithRelations | null>;

  /**
   * Get content by slug.
   *
   * @param slug - URL slug
   * @param ctx - Request context
   * @returns Content or null if not found
   */
  getBySlug(slug: string, ctx: RequestContext): Promise<Content | null>;

  /**
   * Update content.
   *
   * Creates a new version automatically if body or title changes.
   *
   * @param id - Content ID
   * @param input - Fields to update
   * @param ctx - Request context
   * @returns Updated content
   * @throws CONTENT_NOT_FOUND if ID doesn't exist
   * @throws CONTENT_LOCKED if content is being edited by another user
   * @throws INVALID_STATUS_TRANSITION if update violates lifecycle rules
   */
  update(id: string, input: UpdateContentInput, ctx: RequestContext): Promise<Content>;

  /**
   * Soft-delete content.
   *
   * Marks content as deleted without removing data. Can be restored
   * within the retention period.
   *
   * @param id - Content ID
   * @param ctx - Request context
   * @throws CONTENT_NOT_FOUND if ID doesn't exist
   * @throws CONTENT_IS_PUBLISHED if trying to delete published content without unpublishing first
   */
  delete(id: string, ctx: RequestContext): Promise<void>;

  /**
   * Restore soft-deleted content.
   *
   * @param id - Content ID
   * @param ctx - Request context
   * @returns Restored content
   * @throws CONTENT_NOT_FOUND if ID doesn't exist
   * @throws CONTENT_NOT_DELETED if content is not in deleted state
   */
  restore(id: string, ctx: RequestContext): Promise<Content>;

  /**
   * Permanently delete content and all associated data.
   * Requires admin permissions.
   *
   * @param id - Content ID
   * @param ctx - Request context
   * @throws INSUFFICIENT_PERMISSIONS if user lacks 'content.hard_delete'
   */
  hardDelete(id: string, ctx: RequestContext): Promise<void>;

  // ─── Search & List ─────────────────────────────────────

  /**
   * List content with filtering, sorting, and pagination.
   *
   * @param filter - Filter criteria
   * @param ctx - Request context
   * @returns Paginated content list
   */
  list(filter: ContentFilter, ctx: RequestContext): Promise<PaginatedResult<Content>>;

  /**
   * Full-text search across content titles, bodies, and excerpts.
   *
   * @param query - Search query string
   * @param filter - Additional filters
   * @param ctx - Request context
   * @returns Paginated search results with relevance scores
   */
  search(
    query: string,
    filter: ContentFilter,
    ctx: RequestContext,
  ): Promise<PaginatedResult<ContentSearchResult>>;

  // ─── Lifecycle ─────────────────────────────────────────

  /**
   * Submit content for review.
   * Transitions status: draft → review
   *
   * @param id - Content ID
   * @param ctx - Request context
   * @returns Updated content
   * @throws INVALID_STATUS_TRANSITION if content is not in draft status
   */
  submitForReview(id: string, ctx: RequestContext): Promise<Content>;

  /**
   * Archive content.
   * Transitions status: published|unpublished → archived
   *
   * @param id - Content ID
   * @param ctx - Request context
   * @returns Updated content
   */
  archive(id: string, ctx: RequestContext): Promise<Content>;

  /**
   * Unarchive content.
   * Transitions status: archived → draft
   *
   * @param id - Content ID
   * @param ctx - Request context
   * @returns Updated content
   */
  unarchive(id: string, ctx: RequestContext): Promise<Content>;

  // ─── Bulk Operations ───────────────────────────────────

  /**
   * Bulk update content status.
   *
   * @param ids - Content IDs
   * @param status - Target status
   * @param ctx - Request context
   * @returns Results for each content piece
   */
  bulkUpdateStatus(
    ids: string[],
    status: ContentStatus,
    ctx: RequestContext,
  ): Promise<BulkOperationResult[]>;

  /**
   * Bulk delete content.
   *
   * @param ids - Content IDs
   * @param ctx - Request context
   * @returns Results for each content piece
   */
  bulkDelete(ids: string[], ctx: RequestContext): Promise<BulkOperationResult[]>;

  /**
   * Bulk tag content.
   *
   * @param ids - Content IDs
   * @param tagIds - Tag IDs to add
   * @param ctx - Request context
   */
  bulkAddTags(ids: string[], tagIds: string[], ctx: RequestContext): Promise<void>;

  // ─── Locking ───────────────────────────────────────────

  /**
   * Acquire an edit lock on content.
   * Prevents concurrent editing conflicts.
   *
   * @param id - Content ID
   * @param ctx - Request context
   * @returns Lock information
   * @throws CONTENT_LOCKED if already locked by another user
   */
  acquireLock(id: string, ctx: RequestContext): Promise<ContentLock>;

  /**
   * Release an edit lock.
   *
   * @param id - Content ID
   * @param ctx - Request context
   */
  releaseLock(id: string, ctx: RequestContext): Promise<void>;

  /**
   * Refresh lock expiry (heartbeat).
   *
   * @param id - Content ID
   * @param ctx - Request context
   */
  refreshLock(id: string, ctx: RequestContext): Promise<ContentLock>;
}

interface ContentGetOptions {
  /** Include version history */
  includeVersions?: boolean;
  /** Include analytics summary */
  includeAnalytics?: boolean;
  /** Include translations */
  includeTranslations?: boolean;
  /** Include media attachments */
  includeMedia?: boolean;
  /** Include approval status */
  includeApprovals?: boolean;
  /** Include content score */
  includeScore?: boolean;
}

interface ContentWithRelations extends Content {
  versions?: ContentVersion[];
  analytics?: ContentAnalyticsRecord;
  translations?: LocalizedContent[];
  media?: ContentMediaAttachment[];
  approvals?: ApprovalAction[];
  score?: ContentScore;
  type?: ContentType;
}

interface ContentSearchResult extends Content {
  /** Search relevance score (0-1) */
  relevance: number;
  /** Highlighted title snippets */
  titleHighlights: string[];
  /** Highlighted body snippets */
  bodyHighlights: string[];
}

interface ContentLock {
  contentId: string;
  lockedBy: string;
  lockedAt: string;
  expiresAt: string;
}

interface ContentFilter {
  /** Filter by status */
  status?: ContentStatus | ContentStatus[];
  /** Filter by content type */
  typeId?: string | string[];
  /** Filter by author */
  authorId?: string;
  /** Filter by tag IDs (intersection) */
  tagIds?: string[];
  /** Filter by category */
  categoryId?: string;
  /** Filter by locale */
  locale?: string;
  /** Filter by pinned state */
  isPinned?: boolean;
  /** Filter by date range */
  createdAfter?: string;
  createdBefore?: string;
  publishedAfter?: string;
  publishedBefore?: string;
  /** Full-text search query */
  query?: string;
  /** Sort field */
  sortBy?: ContentSortField;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Pagination cursor */
  cursor?: string;
  /** Page size */
  limit?: number;
  /** Include soft-deleted content */
  includeDeleted?: boolean;
}

enum ContentSortField {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  PUBLISHED_AT = 'published_at',
  TITLE = 'title',
  WORD_COUNT = 'word_count',
  READING_TIME = 'reading_time',
  PAGE_VIEWS = 'page_views',
  SCORE = 'score',
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  cursor: string | null;
  hasMore: boolean;
}

interface BulkOperationResult {
  id: string;
  success: boolean;
  error?: string;
}
```

### ContentMediaAttachment

```typescript
/**
 * Media attachment entity.
 *
 * Represents a media file (image, video, document) attached to content.
 * Files are stored in Supabase Storage with tenant-scoped buckets.
 */
interface ContentMediaAttachment {
  /** Unique attachment identifier */
  id: string;

  /** Content ID */
  contentId: string;

  /** Tenant ID */
  tenantId: string;

  /** Original filename */
  filename: string;

  /** MIME type */
  mimeType: string;

  /** File size in bytes */
  sizeBytes: number;

  /** Supabase Storage path */
  storagePath: string;

  /** Public URL */
  publicUrl: string;

  /** Thumbnail URL (for images/videos) */
  thumbnailUrl: string | null;

  /** Alt text */
  altText: string | null;

  /** Caption */
  caption: string | null;

  /** Image dimensions (if applicable) */
  dimensions: {
    width: number;
    height: number;
  } | null;

  /** Media purpose */
  purpose: 'featured_image' | 'body_inline' | 'attachment' | 'og_image' | 'thumbnail';

  /** Sort order within the content */
  sortOrder: number;

  /** Upload user ID */
  uploadedBy: string;

  /** Created at timestamp */
  createdAt: string;
}
```

---

## Database Schemas

### contents

Primary content table storing all content pieces.

```typescript
import { pgTable, uuid, text, varchar, jsonb, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const contents = pgTable(
  'contents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    typeId: uuid('type_id').notNull().references(() => contentTypes.id),
    slug: varchar('slug', { length: 512 }).notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    body: jsonb('body').notNull().default([]),
    excerpt: text('excerpt'),
    featuredImageUrl: text('featured_image_url'),
    featuredImageAlt: text('featured_image_alt'),
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    seo: jsonb('seo').notNull().default({}),
    authorId: uuid('author_id').notNull().references(() => users.id),
    lastEditorId: uuid('last_editor_id').notNull().references(() => users.id),
    currentVersionNumber: integer('current_version_number').notNull().default(1),
    readingTimeMinutes: integer('reading_time_minutes').notNull().default(0),
    wordCount: integer('word_count').notNull().default(0),
    locale: varchar('locale', { length: 10 }).notNull().default('en-US'),
    availableLocales: jsonb('available_locales').notNull().default([]),
    tagIds: jsonb('tag_ids').notNull().default([]),
    categoryId: uuid('category_id'),
    customFields: jsonb('custom_fields').notNull().default({}),
    isPinned: boolean('is_pinned').notNull().default(false),
    commentsEnabled: boolean('comments_enabled').notNull().default(true),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    isDeleted: boolean('is_deleted').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('contents_tenant_idx').on(table.tenantId),
    tenantSlugIdx: index('contents_tenant_slug_idx').on(table.tenantId, table.slug).unique(),
    tenantStatusIdx: index('contents_tenant_status_idx').on(table.tenantId, table.status),
    tenantTypeIdx: index('contents_tenant_type_idx').on(table.tenantId, table.typeId),
    tenantAuthorIdx: index('contents_tenant_author_idx').on(table.tenantId, table.authorId),
    publishedAtIdx: index('contents_published_at_idx').on(table.publishedAt),
    scheduledAtIdx: index('contents_scheduled_at_idx').on(table.scheduledAt),
    searchIdx: index('contents_search_idx').using(
      'gin',
      sql`to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, ''))`,
    ),
  }),
);
```

### content_versions

Version history for content.

```typescript
export const contentVersions = pgTable(
  'content_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    title: text('title').notNull(),
    body: jsonb('body').notNull(),
    excerpt: text('excerpt'),
    seo: jsonb('seo').notNull().default({}),
    customFields: jsonb('custom_fields').notNull().default({}),
    statusAtVersion: varchar('status_at_version', { length: 20 }).notNull(),
    createdBy: uuid('created_by').notNull().references(() => users.id),
    changeSummary: text('change_summary'),
    changeType: varchar('change_type', { length: 20 }).notNull().default('manual_save'),
    sizeBytes: integer('size_bytes').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    contentVersionIdx: index('cv_content_version_idx')
      .on(table.contentId, table.versionNumber)
      .unique(),
    tenantIdx: index('cv_tenant_idx').on(table.tenantId),
    contentIdx: index('cv_content_idx').on(table.contentId),
  }),
);
```

### content_types

Content type definitions.

```typescript
export const contentTypes = pgTable(
  'content_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
    key: varchar('key', { length: 100 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description').notNull().default(''),
    icon: varchar('icon', { length: 50 }).notNull().default('file-text'),
    color: varchar('color', { length: 7 }).notNull().default('#6366f1'),
    customFieldsSchema: jsonb('custom_fields_schema'),
    defaultSEOTemplate: jsonb('default_seo_template'),
    defaultWorkflowId: uuid('default_workflow_id'),
    allowedPublishTargets: jsonb('allowed_publish_targets').notNull().default([]),
    localizationEnabled: boolean('localization_enabled').notNull().default(false),
    commentsSupported: boolean('comments_supported').notNull().default(true),
    maxBodyLength: integer('max_body_length'),
    isBuiltIn: boolean('is_built_in').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantKeyIdx: index('ct_tenant_key_idx').on(table.tenantId, table.key).unique(),
    builtInIdx: index('ct_built_in_idx').on(table.isBuiltIn),
  }),
);
```

### content_calendar

Content calendar / scheduling entries.

```typescript
export const contentCalendar = pgTable(
  'content_calendar',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    contentId: uuid('content_id').references(() => contents.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    scheduledDate: date('scheduled_date').notNull(),
    scheduledTime: time('scheduled_time'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
    channelIds: jsonb('channel_ids').notNull().default([]),
    assigneeIds: jsonb('assignee_ids').notNull().default([]),
    typeId: uuid('type_id').references(() => contentTypes.id),
    entryStatus: varchar('entry_status', { length: 20 }).notNull().default('idea'),
    priority: varchar('priority', { length: 10 }).notNull().default('medium'),
    color: varchar('color', { length: 7 }),
    isRecurring: boolean('is_recurring').notNull().default(false),
    recurrenceRule: text('recurrence_rule'),
    parentEntryId: uuid('parent_entry_id').references(() => contentCalendar.id, {
      onDelete: 'cascade',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantDateIdx: index('cc_tenant_date_idx').on(table.tenantId, table.scheduledDate),
    tenantStatusIdx: index('cc_tenant_status_idx').on(table.tenantId, table.entryStatus),
    contentIdx: index('cc_content_idx').on(table.contentId),
    parentIdx: index('cc_parent_idx').on(table.parentEntryId),
  }),
);
```

### publish_targets

Publishing target configurations.

```typescript
export const publishTargets = pgTable(
  'publish_targets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    channel: varchar('channel', { length: 50 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    config: jsonb('config').notNull(), // encrypted at application level
    isActive: boolean('is_active').notNull().default(true),
    formattingTemplate: text('formatting_template'),
    maxLength: integer('max_length'),
    supportedMediaTypes: jsonb('supported_media_types').notNull().default([]),
    autoPublish: boolean('auto_publish').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('pt_tenant_idx').on(table.tenantId),
    tenantChannelIdx: index('pt_tenant_channel_idx').on(table.tenantId, table.channel),
  }),
);
```

### content_approvals

Approval workflow actions and records.

```typescript
export const contentApprovals = pgTable(
  'content_approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    workflowId: uuid('workflow_id').notNull(),
    stepOrder: integer('step_order').notNull(),
    action: varchar('action', { length: 20 }).notNull(),
    actorId: uuid('actor_id').notNull().references(() => users.id),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    contentIdx: index('ca_content_idx').on(table.contentId),
    tenantIdx: index('ca_tenant_idx').on(table.tenantId),
    contentWorkflowIdx: index('ca_content_workflow_idx').on(
      table.contentId,
      table.workflowId,
      table.stepOrder,
    ),
  }),
);
```

### content_analytics

Analytics data for content performance.

```typescript
export const contentAnalytics = pgTable(
  'content_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    granularity: varchar('granularity', { length: 10 }).notNull().default('daily'),
    pageViews: integer('page_views').notNull().default(0),
    uniqueVisitors: integer('unique_visitors').notNull().default(0),
    avgTimeOnPageSeconds: integer('avg_time_on_page_seconds').notNull().default(0),
    bounceRate: real('bounce_rate').notNull().default(0),
    avgScrollDepth: real('avg_scroll_depth').notNull().default(0),
    socialShares: integer('social_shares').notNull().default(0),
    commentsCount: integer('comments_count').notNull().default(0),
    backlinksCount: integer('backlinks_count').notNull().default(0),
    conversions: integer('conversions').notNull().default(0),
    conversionRate: real('conversion_rate').notNull().default(0),
    revenueAttributedCents: integer('revenue_attributed_cents').notNull().default(0),
    trafficSources: jsonb('traffic_sources').notNull().default({}),
    deviceBreakdown: jsonb('device_breakdown').notNull().default({}),
    geoBreakdown: jsonb('geo_breakdown').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    contentPeriodIdx: index('can_content_period_idx')
      .on(table.contentId, table.periodStart, table.granularity)
      .unique(),
    tenantIdx: index('can_tenant_idx').on(table.tenantId),
    periodIdx: index('can_period_idx').on(table.periodStart, table.periodEnd),
  }),
);
```

### content_translations

Localized content translations.

```typescript
export const contentTranslations = pgTable(
  'content_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    locale: varchar('locale', { length: 10 }).notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    body: jsonb('body').notNull(),
    excerpt: text('excerpt'),
    seo: jsonb('seo').notNull().default({}),
    sourceVersionNumber: integer('source_version_number').notNull(),
    translationStatus: varchar('translation_status', { length: 20 }).notNull().default('pending'),
    translatorId: uuid('translator_id').references(() => users.id),
    reviewerId: uuid('reviewer_id').references(() => users.id),
    isAITranslated: boolean('is_ai_translated').notNull().default(false),
    qualityScore: integer('quality_score'),
    isRTL: boolean('is_rtl').notNull().default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    contentLocaleIdx: index('ctr_content_locale_idx')
      .on(table.contentId, table.locale)
      .unique(),
    tenantIdx: index('ctr_tenant_idx').on(table.tenantId),
    statusIdx: index('ctr_status_idx').on(table.translationStatus),
  }),
);
```

### content_media

Media attachments for content.

```typescript
export const contentMedia = pgTable(
  'content_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    filename: varchar('filename', { length: 500 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    storagePath: text('storage_path').notNull(),
    publicUrl: text('public_url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    altText: text('alt_text'),
    caption: text('caption'),
    dimensions: jsonb('dimensions'),
    purpose: varchar('purpose', { length: 20 }).notNull().default('body_inline'),
    sortOrder: integer('sort_order').notNull().default(0),
    uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    contentIdx: index('cm_content_idx').on(table.contentId),
    tenantIdx: index('cm_tenant_idx').on(table.tenantId),
    purposeIdx: index('cm_purpose_idx').on(table.contentId, table.purpose),
  }),
);
```

### content_tags

Tag associations for content.

```typescript
export const contentTags = pgTable(
  'content_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id').notNull(),
    tagName: varchar('tag_name', { length: 200 }).notNull(),
    tagSlug: varchar('tag_slug', { length: 200 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    contentTagIdx: index('ctg_content_tag_idx')
      .on(table.contentId, table.tagId)
      .unique(),
    tenantIdx: index('ctg_tenant_idx').on(table.tenantId),
    tagSlugIdx: index('ctg_tag_slug_idx').on(table.tenantId, table.tagSlug),
  }),
);
```

### Approval Workflows Table

```typescript
export const approvalWorkflows = pgTable(
  'approval_workflows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description').notNull().default(''),
    steps: jsonb('steps').notNull().default([]),
    mode: varchar('mode', { length: 20 }).notNull().default('sequential'),
    autoApproveAfterHours: integer('auto_approve_after_hours'),
    escalationContactId: uuid('escalation_contact_id'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index('aw_tenant_idx').on(table.tenantId),
    activeIdx: index('aw_active_idx').on(table.tenantId, table.isActive),
  }),
);
```

### RLS Policies

All tables use consistent RLS policies:

```sql
-- Enable RLS on all content tables
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;

-- Template policy (applied to each table)
CREATE POLICY "tenant_isolation_select" ON contents
  FOR SELECT USING (tenant_id = (current_setting('app.current_tenant_id'))::uuid);

CREATE POLICY "tenant_isolation_insert" ON contents
  FOR INSERT WITH CHECK (tenant_id = (current_setting('app.current_tenant_id'))::uuid);

CREATE POLICY "tenant_isolation_update" ON contents
  FOR UPDATE USING (tenant_id = (current_setting('app.current_tenant_id'))::uuid)
  WITH CHECK (tenant_id = (current_setting('app.current_tenant_id'))::uuid);

CREATE POLICY "tenant_isolation_delete" ON contents
  FOR DELETE USING (tenant_id = (current_setting('app.current_tenant_id'))::uuid);

-- Built-in content types are visible to all tenants
CREATE POLICY "builtin_types_visible" ON content_types
  FOR SELECT USING (
    tenant_id = (current_setting('app.current_tenant_id'))::uuid
    OR (is_built_in = true AND tenant_id IS NULL)
  );
```

---

## Code Examples

### Example 1: Creating Content with the ContentService

```typescript
import { ContentService } from '@mcv/growth/content';
import { createRequestContext } from '@mcv/core/context';

// Create request context with tenant and user info
const ctx = createRequestContext({
  tenantId: 'tenant_abc123',
  userId: 'user_def456',
  permissions: ['content.create', 'content.read'],
});

// Create a new blog post
const blogPost = await ContentService.create(
  {
    typeId: 'type_blog_post', // references a content_type
    title: 'How to Scale Your SaaS Growth Engine',
    subtitle: 'A data-driven approach to sustainable growth',
    body: [
      {
        id: 'block_1',
        type: 'heading',
        data: {
          level: 2,
          text: [{ text: 'Introduction' }],
        },
      },
      {
        id: 'block_2',
        type: 'paragraph',
        data: {
          text: [
            { text: 'Scaling a SaaS business requires more than just ' },
            { text: 'great product-market fit', bold: true },
            { text: '. You need a systematic approach to growth that combines ' },
            { text: 'content marketing, SEO, and data-driven optimization.' },
          ],
        },
      },
      {
        id: 'block_3',
        type: 'callout',
        data: {
          variant: 'tip',
          title: 'Key Insight',
          text: [
            {
              text: 'Companies that publish 16+ blog posts per month get 3.5x more traffic than those publishing 0-4 posts.',
            },
          ],
        },
      },
      {
        id: 'block_4',
        type: 'code',
        data: {
          language: 'typescript',
          filename: 'growth-metrics.ts',
          code: `interface GrowthMetrics {
  monthlyVisitors: number;
  conversionRate: number;
  customerAcquisitionCost: number;
  lifetimeValue: number;
}

function calculateGrowthScore(metrics: GrowthMetrics): number {
  const ratio = metrics.lifetimeValue / metrics.customerAcquisitionCost;
  return Math.min(100, ratio * 20);
}`,
          showLineNumbers: true,
        },
      },
    ],
    excerpt:
      'Learn how to build a scalable SaaS growth engine with data-driven content marketing, SEO optimization, and systematic publishing strategies.',
    tagIds: ['tag_saas', 'tag_growth', 'tag_marketing'],
    seo: {
      metaTitle: 'How to Scale Your SaaS Growth Engine | MCV Blog',
      metaDescription:
        'Discover proven strategies for scaling SaaS growth through content marketing, SEO, and data-driven optimization. Actionable insights inside.',
      focusKeyword: 'SaaS growth engine',
      secondaryKeywords: ['content marketing', 'SaaS scaling', 'growth strategy'],
      robots: { index: true, follow: true },
      openGraph: {
        title: 'How to Scale Your SaaS Growth Engine',
        description: 'A data-driven approach to sustainable SaaS growth.',
        image: null,
        type: 'article',
      },
      twitterCard: {
        cardType: 'summary_large_image',
        title: 'How to Scale Your SaaS Growth Engine',
        description: 'A data-driven approach to sustainable SaaS growth.',
        image: null,
      },
      structuredData: null,
      suggestedInternalLinks: [],
      readability: {
        fleschKincaid: null,
        gunningFog: null,
        avgSentenceLength: null,
        passiveVoicePercent: null,
      },
      keywordDensity: {},
    },
    locale: 'en-US',
    commentsEnabled: true,
    customFields: {
      targetAudience: 'SaaS founders and growth marketers',
      contentPillar: 'growth-strategy',
    },
  },
  ctx,
);

console.log(blogPost.id); // 'content_xyz789'
console.log(blogPost.status); // 'draft'
console.log(blogPost.slug); // 'how-to-scale-your-saas-growth-engine'
console.log(blogPost.currentVersionNumber); // 1
console.log(blogPost.readingTimeMinutes); // 4
console.log(blogPost.wordCount); // 127
```

### Example 2: Content Calendar Management

```typescript
import { ContentCalendarService } from '@mcv/growth/content';

// Get the content calendar for a date range
const calendar = await ContentCalendarService.getEntries(
  {
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    channelIds: ['website', 'blog', 'twitter'],
    assigneeIds: undefined, // all team members
    entryStatus: ['planned', 'in_progress', 'ready'],
  },
  ctx,
);

console.log(calendar.entries.length); // 23
console.log(calendar.entries[0]);
// {
//   id: 'cal_abc',
//   title: 'Q1 Product Update Blog Post',
//   scheduledDate: '2026-02-05',
//   scheduledTime: '09:00:00',
//   entryStatus: 'ready',
//   priority: 'high',
//   assigneeIds: ['user_1', 'user_2'],
//   channelIds: ['website', 'blog', 'twitter'],
// }

// Create a new calendar entry (idea stage)
const newEntry = await ContentCalendarService.createEntry(
  {
    title: 'Customer Success Story: Acme Corp',
    description: 'Interview-based case study about Acme Corp 3x growth',
    scheduledDate: '2026-02-15',
    scheduledTime: '10:00:00',
    timezone: 'America/New_York',
    channelIds: ['website', 'blog', 'linkedin'],
    assigneeIds: ['user_writer_1'],
    typeId: 'type_case_study',
    entryStatus: 'planned',
    priority: 'high',
    color: '#10b981', // green for case studies
  },
  ctx,
);

// Move an entry (drag-and-drop rescheduling)
await ContentCalendarService.reschedule(
  newEntry.id,
  {
    scheduledDate: '2026-02-18',
    scheduledTime: '14:00:00',
  },
  ctx,
);

// Set up recurring weekly content
const recurringEntry = await ContentCalendarService.createEntry(
  {
    title: 'Weekly Growth Newsletter',
    description: 'Curated growth insights and platform updates',
    scheduledDate: '2026-02-07',
    scheduledTime: '08:00:00',
    timezone: 'America/New_York',
    channelIds: ['email', 'newsletter'],
    assigneeIds: ['user_editor_1'],
    typeId: 'type_email_template',
    entryStatus: 'planned',
    priority: 'medium',
    isRecurring: true,
    recurrenceRule: 'FREQ=WEEKLY;BYDAY=FR;COUNT=52', // every Friday for a year
  },
  ctx,
);

console.log(recurringEntry.isRecurring); // true
```

### Example 3: Multi-Channel Publishing

```typescript
import { ContentPublishService, ContentService } from '@mcv/growth/content';

// First, ensure content is in 'approved' status
const content = await ContentService.getById('content_xyz789', ctx);
if (content?.status !== 'approved') {
  throw new Error('Content must be approved before publishing');
}

// Publish to multiple channels simultaneously
const results = await ContentPublishService.publish(
  'content_xyz789',
  {
    targetIds: ['target_website', 'target_twitter', 'target_linkedin'],
    publishAt: null, // publish immediately (null = now)
    options: {
      // Channel-specific overrides
      'target_twitter': {
        // Twitter gets a condensed version with hashtags
        customBody: null, // auto-format from content
        includeLink: true,
        hashtags: ['SaaS', 'GrowthHacking', 'ContentMarketing'],
      },
      'target_linkedin': {
        // LinkedIn gets a longer excerpt with CTA
        customExcerpt:
          'I just published a deep dive into scaling SaaS growth engines. ' +
          'Key takeaway: companies publishing 16+ posts/month see 3.5x traffic. ' +
          'Read the full article →',
        includeImage: true,
      },
    },
  },
  ctx,
);

// Check publishing results
for (const result of results) {
  console.log(`${result.targetName}: ${result.success ? '✅ Published' : '❌ Failed'}`);
  if (result.success) {
    console.log(`  URL: ${result.publishedUrl}`);
    console.log(`  External ID: ${result.externalId}`);
  } else {
    console.log(`  Error: ${result.error}`);
  }
}

// Output:
// Company Website: ✅ Published
//   URL: https://acme.com/blog/how-to-scale-your-saas-growth-engine
//   External ID: wp_post_1234
// Twitter Main: ✅ Published
//   URL: https://twitter.com/acme/status/1234567890
//   External ID: tweet_1234567890
// LinkedIn Company: ✅ Published
//   URL: https://linkedin.com/feed/update/urn:li:activity:1234567890
//   External ID: li_1234567890

// Schedule future publication
const scheduledResults = await ContentPublishService.schedule(
  'content_abc456',
  {
    targetIds: ['target_website'],
    publishAt: '2026-02-15T09:00:00-05:00', // 9 AM ET
    timezone: 'America/New_York',
  },
  ctx,
);

console.log(scheduledResults.scheduledAt); // '2026-02-15T14:00:00.000Z'
```

### Example 4: Version Management and Diffing

```typescript
import { ContentVersionService, diffContentVersions } from '@mcv/growth/content';

// List all versions of a content piece
const versions = await ContentVersionService.listVersions('content_xyz789', ctx);

console.log(versions);
// [
//   { versionNumber: 1, changeType: 'manual_save', createdAt: '2026-02-01T10:00:00Z', createdBy: 'user_1' },
//   { versionNumber: 2, changeType: 'manual_save', createdAt: '2026-02-02T14:30:00Z', createdBy: 'user_1' },
//   { versionNumber: 3, changeType: 'status_change', createdAt: '2026-02-03T09:00:00Z', createdBy: 'user_2' },
//   { versionNumber: 4, changeType: 'publish', createdAt: '2026-02-05T09:00:00Z', createdBy: 'user_1' },
// ]

// Get a specific version
const v2 = await ContentVersionService.getVersion('content_xyz789', 2, ctx);
console.log(v2.title); // 'How to Scale Your SaaS Growth Engine (Updated)'

// Compare two versions
const diff = await ContentVersionService.diff('content_xyz789', 1, 4, ctx);

console.log(diff.stats);
// { totalChanges: 7, additions: 3, deletions: 1, modifications: 3 }

console.log(diff.titleDiff);
// {
//   oldValue: 'How to Scale Your SaaS Growth Engine',
//   newValue: 'How to Scale Your SaaS Growth Engine: A Complete Guide',
//   segments: [
//     { type: 'equal', value: 'How to Scale Your SaaS Growth Engine' },
//     { type: 'insert', value: ': A Complete Guide' },
//   ]
// }

console.log(diff.bodyDiffs[0]);
// {
//   blockId: 'block_5',
//   type: 'added',
//   oldBlock: null,
//   newBlock: { id: 'block_5', type: 'image', data: { url: '...', alt: 'Growth chart' } },
// }

// Rollback to a previous version
const rolledBack = await ContentVersionService.rollback(
  'content_xyz789',
  2, // roll back to version 2
  ctx,
);

console.log(rolledBack.currentVersionNumber); // 5 (creates a new version based on v2's content)
console.log(rolledBack.title); // 'How to Scale Your SaaS Growth Engine (Updated)'
```

### Example 5: Approval Workflows

```typescript
import { ContentApprovalService, ContentService } from '@mcv/growth/content';

// Configure an approval workflow
const workflow = await ContentApprovalService.createWorkflow(
  {
    name: 'Blog Post Review',
    description: 'Two-step review: editorial then marketing lead',
    mode: 'sequential',
    steps: [
      {
        order: 1,
        name: 'Editorial Review',
        approvers: {
          roleIds: ['role_editor'],
        },
        requiredApprovals: 1,
        instructions: 'Check grammar, tone, accuracy, and brand voice compliance.',
        slaHours: 24,
      },
      {
        order: 2,
        name: 'Marketing Lead Approval',
        approvers: {
          userIds: ['user_marketing_lead'],
          roleIds: ['role_marketing_manager'],
        },
        requiredApprovals: 1,
        instructions: 'Verify alignment with campaign goals and SEO strategy.',
        slaHours: 48,
      },
    ],
    autoApproveAfterHours: 72, // auto-approve if no response in 3 days
    escalationContactId: 'user_head_of_marketing',
  },
  ctx,
);

// Submit content for review (triggers the workflow)
await ContentService.submitForReview('content_xyz789', ctx);

// Editor reviews and approves step 1
const editorCtx = createRequestContext({
  tenantId: 'tenant_abc123',
  userId: 'user_editor_1',
  permissions: ['content.approve'],
});

const approvalAction = await ContentApprovalService.approve(
  'content_xyz789',
  {
    comment: 'Well-written. Fixed a few typos. Good to go for marketing review.',
  },
  editorCtx,
);

console.log(approvalAction.action); // 'approve'
console.log(approvalAction.stepOrder); // 1

// Check approval status
const status = await ContentApprovalService.getStatus('content_xyz789', ctx);
console.log(status);
// {
//   workflowId: 'wf_abc',
//   currentStep: 2,
//   totalSteps: 2,
//   isComplete: false,
//   steps: [
//     { order: 1, name: 'Editorial Review', status: 'approved', completedAt: '...' },
//     { order: 2, name: 'Marketing Lead Approval', status: 'pending', slaDeadline: '...' },
//   ]
// }

// Marketing lead requests changes (rejects)
const marketingCtx = createRequestContext({
  tenantId: 'tenant_abc123',
  userId: 'user_marketing_lead',
  permissions: ['content.approve'],
});

await ContentApprovalService.requestChanges(
  'content_xyz789',
  {
    comment:
      'Please add a section about our Q1 product launch. ' +
      'Also, the focus keyword should be more prominent in the first paragraph.',
  },
  marketingCtx,
);

// Content goes back to 'draft' status for revisions
const updated = await ContentService.getById('content_xyz789', ctx);
console.log(updated?.status); // 'draft'
```

### Example 6: SEO Optimization and Scoring

```typescript
import { ContentSEOService } from '@mcv/growth/content';

// Analyze content for SEO
const seoAnalysis = await ContentSEOService.analyze('content_xyz789', ctx);

console.log(seoAnalysis);
// {
//   score: 72,
//   issues: [
//     {
//       severity: 'critical',
//       code: 'SEO_META_TITLE_MISSING',
//       message: 'Meta title is not set. Search engines will use the page title instead.',
//       suggestion: 'Add a meta title between 50-60 characters including your focus keyword.',
//     },
//     {
//       severity: 'warning',
//       code: 'SEO_KEYWORD_DENSITY_LOW',
//       message: 'Focus keyword "SaaS growth engine" appears only 1 time (0.5%). Aim for 1-2%.',
//       suggestion: 'Add the focus keyword 2-3 more times naturally throughout the content.',
//     },
//     {
//       severity: 'warning',
//       code: 'SEO_NO_INTERNAL_LINKS',
//       message: 'No internal links found. Internal linking improves SEO and user engagement.',
//       suggestion: 'Add 2-3 links to related content on your site.',
//     },
//     {
//       severity: 'info',
//       code: 'SEO_HEADING_STRUCTURE',
//       message: 'Content uses H2 headings but no H3 sub-headings.',
//       suggestion: 'Add H3 headings to break up long sections for better readability.',
//     },
//   ],
//   metrics: {
//     titleLength: 38,
//     metaDescriptionLength: 0,
//     focusKeywordCount: 1,
//     focusKeywordDensity: 0.005,
//     headingCount: { h1: 0, h2: 1, h3: 0, h4: 0, h5: 0, h6: 0 },
//     internalLinkCount: 0,
//     externalLinkCount: 0,
//     imageCount: 0,
//     imagesWithAlt: 0,
//     wordCount: 127,
//   },
// }

// Auto-generate SEO metadata with AI
const seoSuggestions = await ContentSEOService.generateSEOSuggestions('content_xyz789', ctx);

console.log(seoSuggestions);
// {
//   metaTitle: [
//     'Scale Your SaaS Growth Engine: Data-Driven Strategies | MCV',
//     'How to Build a Scalable SaaS Growth Engine [2026 Guide]',
//     'SaaS Growth Engine: Proven Strategies to Scale Your Business',
//   ],
//   metaDescription: [
//     'Learn how to scale your SaaS growth with data-driven content marketing. Discover strategies that companies use to get 3.5x more traffic.',
//   ],
//   focusKeywords: ['SaaS growth engine', 'SaaS growth strategy', 'scale SaaS'],
//   internalLinkSuggestions: [
//     { contentId: 'content_related_1', title: 'Content Marketing for SaaS', relevance: 0.89 },
//     { contentId: 'content_related_2', title: 'SEO Best Practices Guide', relevance: 0.76 },
//   ],
// }

// Apply an SEO suggestion
await ContentSEOService.updateSEO(
  'content_xyz789',
  {
    metaTitle: seoSuggestions.metaTitle[0],
    metaDescription: seoSuggestions.metaDescription[0],
    focusKeyword: 'SaaS growth engine',
  },
  ctx,
);

// Generate structured data (JSON-LD)
const structuredData = await ContentSEOService.generateStructuredData('content_xyz789', ctx);

console.log(structuredData);
// {
//   '@context': 'https://schema.org',
//   '@type': 'Article',
//   headline: 'How to Scale Your SaaS Growth Engine',
//   datePublished: '2026-02-05T09:00:00Z',
//   author: { '@type': 'Person', name: 'Jane Smith' },
//   publisher: { '@type': 'Organization', name: 'Acme Corp' },
//   description: 'Learn how to scale your SaaS growth...',
//   wordCount: 127,
//   ...
// }
```

### Example 7: Localization and Translation

```typescript
import { ContentLocalizationService } from '@mcv/growth/content';

// Request AI translation
const translation = await ContentLocalizationService.translateWithAI(
  'content_xyz789',
  {
    targetLocale: 'fr-FR',
    options: {
      preserveFormatting: true,
      adaptCulturalReferences: true,
      maintainSEO: true,
      glossaryId: 'glossary_tech_fr', // use domain-specific glossary
    },
  },
  ctx,
);

console.log(translation);
// {
//   id: 'trans_abc',
//   contentId: 'content_xyz789',
//   locale: 'fr-FR',
//   title: 'Comment Faire Évoluer Votre Moteur de Croissance SaaS',
//   body: [...], // translated editor blocks
//   translationStatus: 'review', // AI translations go to review by default
//   isAITranslated: true,
//   qualityScore: 87,
//   isRTL: false,
//   sourceVersionNumber: 4,
// }

// Request human review of AI translation
await ContentLocalizationService.assignReviewer(translation.id, 'user_fr_reviewer', ctx);

// Approve translation after human review
const reviewerCtx = createRequestContext({
  tenantId: 'tenant_abc123',
  userId: 'user_fr_reviewer',
  permissions: ['content.translate', 'content.approve_translation'],
});

await ContentLocalizationService.approveTranslation(
  translation.id,
  {
    qualityScore: 92,
    notes: 'Minor adjustments to idiomatic expressions. Ready for publication.',
  },
  reviewerCtx,
);

// List all translations for a content piece
const allTranslations = await ContentLocalizationService.listTranslations(
  'content_xyz789',
  ctx,
);

console.log(allTranslations);
// [
//   { locale: 'en-US', status: 'published', isSource: true },
//   { locale: 'fr-FR', status: 'approved', isAITranslated: true, qualityScore: 92 },
//   { locale: 'de-DE', status: 'in_progress', isAITranslated: false },
//   { locale: 'ja', status: 'pending', isAITranslated: false },
// ]

// Publish a specific locale
await ContentLocalizationService.publishLocale('content_xyz789', 'fr-FR', ctx);

// Check translation sync status (is source content ahead of translations?)
const syncStatus = await ContentLocalizationService.checkSyncStatus('content_xyz789', ctx);

console.log(syncStatus);
// {
//   sourceVersion: 4,
//   translations: [
//     { locale: 'fr-FR', basedOnVersion: 4, isSynced: true },
//     { locale: 'de-DE', basedOnVersion: 2, isSynced: false, changesSinceVersion: 2 },
//     { locale: 'ja', basedOnVersion: 1, isSynced: false, changesSinceVersion: 3 },
//   ]
// }
```

### Example 8: AI-Powered Content Assistance

```typescript
import { ContentAIService } from '@mcv/growth/content';

// Generate title variants
const titleSuggestions = await ContentAIService.suggestTitles(
  {
    topic: 'SaaS growth strategies for early-stage startups',
    targetAudience: 'SaaS founders and growth marketers',
    tone: 'professional yet approachable',
    count: 5,
    includeKeyword: 'SaaS growth',
  },
  ctx,
);

console.log(titleSuggestions);
// [
//   { suggestion: '10 SaaS Growth Strategies That Took Us from $0 to $1M ARR', confidence: 0.92 },
//   { suggestion: 'The Early-Stage SaaS Growth Playbook: Strategies That Actually Work', confidence: 0.89 },
//   { suggestion: 'SaaS Growth on a Budget: How Startups Can Compete with Giants', confidence: 0.85 },
//   { suggestion: 'From Zero to Traction: A SaaS Growth Framework for Founders', confidence: 0.83 },
//   { suggestion: 'The Lean SaaS Growth Guide: Maximize Impact with Minimal Resources', confidence: 0.81 },
// ]

// Generate a content outline
const outline = await ContentAIService.generateOutline(
  {
    title: titleSuggestions[0].suggestion,
    contentType: 'blog_post',
    targetWordCount: 2000,
    targetAudience: 'SaaS founders',
    focusKeyword: 'SaaS growth strategies',
    includeDataPoints: true,
  },
  ctx,
);

console.log(outline);
// {
//   sections: [
//     {
//       heading: 'Introduction',
//       level: 2,
//       points: ['Hook with relatable founder struggle', 'Preview the 10 strategies'],
//       estimatedWords: 150,
//     },
//     {
//       heading: '1. Content-Led Growth',
//       level: 2,
//       points: ['Why content marketing works for SaaS', 'HubSpot case study: 3.5x traffic'],
//       estimatedWords: 200,
//     },
//     // ... 8 more sections ...
//     {
//       heading: 'Conclusion: Building Your Growth Stack',
//       level: 2,
//       points: ['Summary of strategies', 'Prioritization framework', 'CTA'],
//       estimatedWords: 150,
//     },
//   ],
//   estimatedTotalWords: 2100,
//   suggestedTags: ['saas', 'growth', 'startup', 'marketing'],
// }

// Expand a specific section into full content
const expandedSection = await ContentAIService.expandSection(
  {
    contentId: 'content_xyz789',
    sectionHeading: 'Content-Led Growth',
    existingContent: 'Content marketing is the backbone of SaaS growth.',
    targetWords: 300,
    tone: 'data-driven and actionable',
    includeExamples: true,
  },
  ctx,
);

console.log(expandedSection.suggestion);
// Full paragraph text with data points and examples...
console.log(expandedSection.tokenUsage);
// { promptTokens: 245, completionTokens: 412, totalTokens: 657 }

// Analyze and improve content tone
const toneAnalysis = await ContentAIService.analyzeTone(
  'content_xyz789',
  {
    targetTone: 'professional yet approachable',
    checkForBias: true,
    checkForJargon: true,
  },
  ctx,
);

console.log(toneAnalysis);
// {
//   currentTone: 'formal and technical',
//   toneScore: 65, // 0-100, how well it matches target
//   issues: [
//     { text: 'leverage synergistic paradigms', issue: 'corporate jargon', suggestion: 'use combined strategies' },
//     { text: 'it is imperative that', issue: 'overly formal', suggestion: 'you should' or 'it\'s important to' },
//   ],
//   overallSuggestion: 'The content reads well but could benefit from shorter sentences and more conversational phrasing.',
// }

// Generate social media posts from existing content
const socialPosts = await ContentAIService.generateSocialPosts(
  'content_xyz789',
  {
    platforms: ['twitter', 'linkedin'],
    count: 3, // 3 variants per platform
    includeHashtags: true,
    includeEmoji: true,
  },
  ctx,
);

console.log(socialPosts.twitter[0]);
// {
//   text: '🚀 Companies publishing 16+ blog posts/month get 3.5x more traffic.\n\nHere are 10 SaaS growth strategies that took us from $0 to $1M ARR:\n\n🧵 Thread 👇',
//   characterCount: 156,
//   hashtags: ['#SaaS', '#GrowthHacking', '#StartupLife'],
// }
```

---

## Error Codes

All errors in this module follow the MCV error format: `{ code: string, message: string, details?: Record<string, unknown> }`.

| Code | HTTP Status | Message | Description |
|------|------------|---------|-------------|
| `CONTENT_NOT_FOUND` | 404 | Content not found | The specified content ID does not exist or is not accessible in the current tenant |
| `CONTENT_TYPE_NOT_FOUND` | 404 | Content type not found | The specified content type ID does not exist |
| `CONTENT_SLUG_EXISTS` | 409 | Slug already exists | A content piece with this slug already exists in the tenant |
| `CONTENT_LOCKED` | 423 | Content is locked for editing | Another user holds an edit lock on this content |
| `CONTENT_LOCK_EXPIRED` | 410 | Content lock has expired | The edit lock has expired; re-acquire before saving |
| `CONTENT_IS_PUBLISHED` | 409 | Cannot modify published content | Operation not allowed on published content (unpublish first) |
| `CONTENT_NOT_DELETED` | 409 | Content is not in deleted state | Attempted to restore content that is not soft-deleted |
| `CONTENT_BODY_TOO_LARGE` | 413 | Content body exceeds maximum size | Body exceeds `MAX_CONTENT_SIZE_BYTES` (default: 5MB) |
| `CONTENT_MEDIA_TOO_LARGE` | 413 | Media file exceeds maximum size | Upload exceeds `MAX_MEDIA_SIZE_BYTES` (default: 50MB) |
| `CONTENT_MEDIA_TYPE_UNSUPPORTED` | 415 | Unsupported media type | MIME type not in `SUPPORTED_MEDIA_TYPES` |
| `INVALID_STATUS_TRANSITION` | 422 | Invalid status transition | The requested status change violates the lifecycle state machine (e.g., draft → published without approval) |
| `APPROVAL_WORKFLOW_NOT_FOUND` | 404 | Approval workflow not found | The specified workflow ID does not exist |
| `APPROVAL_NOT_AUTHORIZED` | 403 | Not authorized to approve | User does not have the required role/permission to approve this step |
| `APPROVAL_ALREADY_ACTIONED` | 409 | Approval already actioned | This approval step has already been approved/rejected by this user |
| `APPROVAL_STEP_NOT_REACHED` | 422 | Approval step not yet reached | Attempted to approve a step that hasn't been unlocked in the sequential workflow |
| `PUBLISH_TARGET_NOT_FOUND` | 404 | Publish target not found | The specified publish target ID does not exist or is inactive |
| `PUBLISH_TARGET_UNAVAILABLE` | 503 | Publish target is unavailable | The publishing channel is temporarily unreachable |
| `PUBLISH_FORMAT_ERROR` | 422 | Content formatting error for channel | Content cannot be formatted for the target channel (e.g., exceeds character limit) |
| `PUBLISH_AUTH_FAILED` | 401 | Publishing authentication failed | OAuth token expired or credentials invalid for the publish target |
| `VERSION_NOT_FOUND` | 404 | Version not found | The specified version number does not exist for this content |
| `VERSION_ROLLBACK_FAILED` | 500 | Version rollback failed | An error occurred while rolling back to the specified version |
| `TRANSLATION_NOT_FOUND` | 404 | Translation not found | No translation exists for this content and locale |
| `TRANSLATION_LOCALE_EXISTS` | 409 | Translation for this locale already exists | A translation for the requested locale already exists |
| `TRANSLATION_LOCALE_INVALID` | 422 | Invalid locale code | The BCP 47 locale tag is not valid |
| `TRANSLATION_SOURCE_OUTDATED` | 422 | Source content has been updated | The source content has newer versions; translation base is outdated |
| `AI_SERVICE_UNAVAILABLE` | 503 | AI service is temporarily unavailable | OpenRouter API is unreachable or rate-limited |
| `AI_GENERATION_FAILED` | 500 | AI content generation failed | The AI model returned an error or invalid response |
| `AI_QUOTA_EXCEEDED` | 429 | AI usage quota exceeded | Tenant has exceeded their AI token budget for the billing period |
| `SEO_VALIDATION_FAILED` | 422 | SEO metadata validation failed | SEO fields don't meet minimum requirements for publishing |
| `CALENDAR_ENTRY_NOT_FOUND` | 404 | Calendar entry not found | The specified calendar entry ID does not exist |
| `CALENDAR_CONFLICT` | 409 | Calendar scheduling conflict | The proposed schedule conflicts with existing entries (same channel/time) |
| `CALENDAR_PAST_DATE` | 422 | Cannot schedule in the past | The scheduled date/time is in the past |
| `INSUFFICIENT_PERMISSIONS` | 403 | Insufficient permissions | User lacks the required permission for this operation |
| `TENANT_CONTENT_LIMIT_REACHED` | 429 | Tenant content limit reached | Tenant has reached their maximum content count for their plan tier |

---

## Security

### Authentication & Authorization

All content operations require authentication via Supabase Auth JWT tokens. The module enforces both **platform-level** and **content-level** permissions.

#### Platform Permissions

| Permission | Description |
|------------|-------------|
| `content.create` | Create new content |
| `content.read` | Read content (own and published) |
| `content.read_all` | Read all content regardless of author |
| `content.update` | Update own content |
| `content.update_all` | Update any content in the tenant |
| `content.delete` | Soft-delete own content |
| `content.delete_all` | Soft-delete any content |
| `content.hard_delete` | Permanently delete content (admin only) |
| `content.publish` | Publish content to channels |
| `content.unpublish` | Remove published content |
| `content.approve` | Act as an approver in workflows |
| `content.manage_workflows` | Create/edit approval workflows |
| `content.manage_types` | Create/edit content types |
| `content.manage_targets` | Configure publish targets |
| `content.translate` | Create/edit translations |
| `content.approve_translation` | Approve translations |
| `content.view_analytics` | View content analytics |
| `content.use_ai` | Use AI-powered features |
| `content.manage_calendar` | Manage calendar entries |

#### Content-Level Access Control

Beyond platform permissions, content can have individual access restrictions:

```typescript
// Content can be restricted to specific teams or users
interface ContentAccessControl {
  /** Content ID */
  contentId: string;

  /** Visibility level */
  visibility: 'public' | 'team' | 'private';

  /** Allowed team IDs (when visibility = 'team') */
  teamIds?: string[];

  /** Allowed user IDs (when visibility = 'private') */
  userIds?: string[];
}
```

### Data Protection

#### Tenant Isolation

- **Row-Level Security (RLS):** All tables enforce tenant isolation at the database level. Even if application-level checks fail, the database prevents cross-tenant data access.
- **Storage Isolation:** Media files are stored in tenant-scoped Supabase Storage buckets (`content-media/{tenant_id}/`).
- **API Scoping:** Every tRPC endpoint extracts `tenant_id` from the authenticated JWT and passes it through the request context.

#### Input Sanitization

- **HTML Sanitization:** All user-provided HTML (in rich text blocks) is sanitized using a strict allowlist (DOMPurify) before storage. Script tags, event handlers, and dangerous attributes are stripped.
- **XSS Prevention:** Content rendering uses context-aware output encoding. Raw HTML blocks are sandboxed.
- **SQL Injection:** Prevented by Drizzle ORM's parameterized queries. No raw SQL is constructed from user input.
- **Path Traversal:** Media upload filenames are sanitized and replaced with UUIDs. Original filenames are stored separately.

#### Sensitive Data Handling

- **Publish Target Credentials:** OAuth tokens and API keys in `publish_targets.config` are encrypted at the application level using AES-256-GCM before database storage. Decryption keys are stored in environment variables, never in the database.
- **AI Request Privacy:** Content sent to AI services (OpenRouter) is processed according to the platform's data processing agreement. Tenant content is not used for model training. Sensitive content can be flagged to skip AI processing entirely.
- **Audit Logging:** All content operations (create, update, delete, publish, approve) are logged in the platform audit trail with actor, timestamp, and change details.
- **Media Scanning:** Uploaded media files are scanned for malware before storage. Executable file types are rejected regardless of MIME type.

#### Rate Limiting

| Operation | Rate Limit | Window |
|-----------|-----------|--------|
| Content creation | 100/hour | Per tenant |
| Content updates | 300/hour | Per tenant |
| Publishing | 50/hour | Per tenant |
| AI suggestions | 200/hour | Per tenant |
| Media uploads | 500/hour | Per tenant |
| Search queries | 1000/hour | Per tenant |
| Version rollbacks | 20/hour | Per tenant |
| Approval actions | 100/hour | Per tenant |

#### Content Security Headers

Published content served through the platform includes security headers:

```typescript
const CONTENT_SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' https:; script-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

### Content Integrity

- **Version Checksums:** Each version snapshot includes a SHA-256 checksum of the body content. Rollback operations verify checksum integrity before applying.
- **Concurrent Edit Protection:** Edit locks prevent data loss from simultaneous editing. Locks expire after 5 minutes of inactivity and can be forcefully released by admins.
- **Publish Verification:** After publishing, the system verifies content accessibility on each target channel and reports any discrepancies.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Supabase service role key for server-side operations |
| `SUPABASE_ANON_KEY` | Yes | — | Supabase anonymous key for client-side operations |
| `CONTENT_ENCRYPTION_KEY` | Yes | — | AES-256-GCM key for encrypting publish target credentials (64-char hex) |
| `OPENROUTER_API_KEY` | No | — | OpenRouter API key for AI content features |
| `OPENROUTER_BASE_URL` | No | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `OPENROUTER_DEFAULT_MODEL` | No | `anthropic/claude-sonnet-4-20250514` | Default AI model for content generation |
| `CONTENT_MAX_BODY_SIZE_BYTES` | No | `5242880` (5MB) | Maximum content body size in bytes |
| `CONTENT_MAX_MEDIA_SIZE_BYTES` | No | `52428800` (50MB) | Maximum media file size in bytes |
| `CONTENT_DEFAULT_LOCALE` | No | `en-US` | Default locale for new content |
| `CONTENT_LOCK_TTL_SECONDS` | No | `300` (5 min) | Edit lock time-to-live in seconds |
| `CONTENT_AUTO_SAVE_INTERVAL_MS` | No | `30000` (30s) | Auto-save interval for the editor |
| `CONTENT_VERSION_RETENTION_DAYS` | No | `365` | Number of days to retain version history |
| `CONTENT_SOFT_DELETE_RETENTION_DAYS` | No | `30` | Days before soft-deleted content is eligible for hard deletion |
| `CONTENT_CDN_BASE_URL` | No | — | CDN base URL for media assets (overrides Supabase Storage URLs) |
| `CONTENT_MEDIA_BUCKET` | No | `content-media` | Supabase Storage bucket name for content media |
| `CONTENT_THUMBNAIL_WIDTH` | No | `400` | Default thumbnail width in pixels |
| `CONTENT_THUMBNAIL_QUALITY` | No | `80` | Default thumbnail JPEG quality (1-100) |
| `CONTENT_SEARCH_MIN_QUERY_LENGTH` | No | `2` | Minimum characters for search queries |
| `CONTENT_AI_MAX_TOKENS_PER_REQUEST` | No | `4096` | Maximum tokens per AI request |
| `CONTENT_AI_MONTHLY_TOKEN_BUDGET` | No | `1000000` | Monthly AI token budget per tenant |
| `CONTENT_PUBLISH_RETRY_ATTEMPTS` | No | `3` | Number of retry attempts for failed publish operations |
| `CONTENT_PUBLISH_RETRY_DELAY_MS` | No | `5000` | Delay between publish retry attempts |
| `CONTENT_ANALYTICS_AGGREGATION_CRON` | No | `0 2 * * *` | Cron schedule for analytics aggregation (default: 2 AM daily) |
| `CONTENT_SCHEDULED_PUBLISH_CRON` | No | `* * * * *` | Cron schedule for checking scheduled publications (default: every minute) |

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/core` | `workspace:*` | Platform core — auth, context, errors, events, logging |
| `@mcv/db` | `workspace:*` | Database client, Drizzle schema utilities, migration helpers |
| `@mcv/auth` | `workspace:*` | Authentication, JWT validation, permission checking |
| `@mcv/storage` | `workspace:*` | Supabase Storage abstraction for media uploads |
| `@mcv/events` | `workspace:*` | Domain event bus for publishing content lifecycle events |
| `@mcv/notifications` | `workspace:*` | Notification delivery for approval requests, publishing alerts |
| `@mcv/ai` | `workspace:*` | OpenRouter AI client abstraction |
| `@mcv/growth/shared` | `workspace:*` | Shared growth module types and utilities |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.35.0` | Type-safe ORM for database operations |
| `@trpc/server` | `^11.0.0` | Type-safe API layer |
| `zod` | `^3.23.0` | Runtime schema validation |
| `dompurify` | `^3.1.0` | HTML sanitization for rich text content |
| `jsdom` | `^24.0.0` | DOM implementation for server-side HTML sanitization |
| `diff` | `^7.0.0` | Text diffing for version comparison |
| `slugify` | `^1.6.0` | URL-safe slug generation from titles |
| `reading-time` | `^2.0.0` | Reading time estimation |
| `text-readability` | `^1.1.0` | Readability scoring (Flesch-Kincaid, Gunning Fog) |
| `rrule` | `^2.8.0` | RFC 5545 recurrence rule parsing for calendar entries |
| `date-fns` | `^3.6.0` | Date manipulation and formatting |
| `date-fns-tz` | `^3.1.0` | Timezone-aware date operations |
| `sharp` | `^0.33.0` | Image processing for thumbnails and optimization |
| `nanoid` | `^5.0.0` | Unique ID generation for editor blocks |
| `superjson` | `^2.2.0` | JSON serialization for tRPC (handles Date, BigInt, etc.) |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.45.0` | Supabase client (provided by host application) |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── content-service.test.ts
│   │   ├── content-version-service.test.ts
│   │   ├── content-publish-service.test.ts
│   │   ├── content-calendar-service.test.ts
│   │   ├── content-approval-service.test.ts
│   │   ├── content-analytics-service.test.ts
│   │   ├── content-localization-service.test.ts
│   │   ├── content-seo-service.test.ts
│   │   ├── content-ai-service.test.ts
│   │   ├── content-media-service.test.ts
│   │   ├── utils/
│   │   │   ├── render-html.test.ts
│   │   │   ├── render-markdown.test.ts
│   │   │   ├── slug-generation.test.ts
│   │   │   ├── readability.test.ts
│   │   │   ├── sanitize.test.ts
│   │   │   └── diff.test.ts
│   │   └── validation/
│   │       ├── create-content.test.ts
│   │       ├── update-content.test.ts
│   │       ├── publish-content.test.ts
│   │       └── seo-metadata.test.ts
│   ├── integration/
│   │   ├── content-crud.test.ts
│   │   ├── content-lifecycle.test.ts
│   │   ├── content-versioning.test.ts
│   │   ├── content-publishing.test.ts
│   │   ├── content-approval-flow.test.ts
│   │   ├── content-calendar.test.ts
│   │   ├── content-search.test.ts
│   │   ├── content-localization.test.ts
│   │   ├── content-analytics.test.ts
│   │   ├── content-media.test.ts
│   │   └── tenant-isolation.test.ts
│   └── e2e/
│       ├── content-full-lifecycle.test.ts
│       ├── multi-channel-publish.test.ts
│       └── collaborative-editing.test.ts
├── __fixtures__/
│   ├── content.fixtures.ts
│   ├── content-type.fixtures.ts
│   ├── editor-blocks.fixtures.ts
│   ├── seo-metadata.fixtures.ts
│   └── approval-workflow.fixtures.ts
└── __mocks__/
    ├── openrouter.mock.ts
    ├── supabase-storage.mock.ts
    └── publish-adapters.mock.ts
```

### Running Tests

```bash
# Run all tests
pnpm test --filter=@mcv/growth/content

# Run unit tests only
pnpm test:unit --filter=@mcv/growth/content

# Run integration tests (requires database)
pnpm test:integration --filter=@mcv/growth/content

# Run e2e tests
pnpm test:e2e --filter=@mcv/growth/content

# Run with coverage
pnpm test:coverage --filter=@mcv/growth/content

# Run specific test file
pnpm vitest run src/__tests__/unit/content-service.test.ts

# Run tests in watch mode
pnpm vitest watch --filter=@mcv/growth/content
```

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentService } from '../content-service';
import { createMockRequestContext, createMockDb } from '@mcv/test-utils';
import { blogPostFixture, landingPageFixture } from '../../__fixtures__/content.fixtures';

describe('ContentService', () => {
  let service: ContentService;
  let mockDb: ReturnType<typeof createMockDb>;
  let ctx: ReturnType<typeof createMockRequestContext>;

  beforeEach(() => {
    mockDb = createMockDb();
    ctx = createMockRequestContext({
      tenantId: 'tenant_test',
      userId: 'user_test',
      permissions: ['content.create', 'content.read', 'content.update', 'content.delete'],
    });
    service = new ContentService(mockDb);
  });

  describe('create()', () => {
    it('should create content with draft status', async () => {
      const input = {
        typeId: 'type_blog_post',
        title: 'Test Blog Post',
        body: blogPostFixture.body,
        locale: 'en-US',
      };

      mockDb.contentTypes.findFirst.mockResolvedValue({ id: 'type_blog_post', isActive: true });
      mockDb.contents.insert.mockResolvedValue({ ...input, id: 'content_new', status: 'draft' });

      const result = await service.create(input, ctx);

      expect(result.status).toBe('draft');
      expect(result.authorId).toBe('user_test');
      expect(result.tenantId).toBe('tenant_test');
      expect(result.currentVersionNumber).toBe(1);
    });

    it('should generate a unique slug from the title', async () => {
      const input = {
        typeId: 'type_blog_post',
        title: 'My Amazing Blog Post!',
        body: [],
        locale: 'en-US',
      };

      mockDb.contentTypes.findFirst.mockResolvedValue({ id: 'type_blog_post', isActive: true });
      mockDb.contents.findFirst.mockResolvedValue(null); // no slug conflict
      mockDb.contents.insert.mockImplementation((data) => Promise.resolve({ ...data, id: 'new' }));

      const result = await service.create(input, ctx);

      expect(result.slug).toBe('my-amazing-blog-post');
    });

    it('should append a suffix for duplicate slugs', async () => {
      const input = {
        typeId: 'type_blog_post',
        title: 'My Amazing Blog Post!',
        body: [],
        locale: 'en-US',
      };

      mockDb.contentTypes.findFirst.mockResolvedValue({ id: 'type_blog_post', isActive: true });
      // First slug check finds a conflict, second doesn't
      mockDb.contents.findFirst
        .mockResolvedValueOnce({ slug: 'my-amazing-blog-post' })
        .mockResolvedValueOnce(null);
      mockDb.contents.insert.mockImplementation((data) => Promise.resolve({ ...data, id: 'new' }));

      const result = await service.create(input, ctx);

      expect(result.slug).toBe('my-amazing-blog-post-1');
    });

    it('should throw CONTENT_TYPE_NOT_FOUND for invalid typeId', async () => {
      mockDb.contentTypes.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ typeId: 'nonexistent', title: 'Test', body: [], locale: 'en-US' }, ctx),
      ).rejects.toThrow('CONTENT_TYPE_NOT_FOUND');
    });

    it('should throw INSUFFICIENT_PERMISSIONS without content.create', async () => {
      const restrictedCtx = createMockRequestContext({
        tenantId: 'tenant_test',
        userId: 'user_test',
        permissions: ['content.read'],
      });

      await expect(
        service.create(
          { typeId: 'type_blog_post', title: 'Test', body: [], locale: 'en-US' },
          restrictedCtx,
        ),
      ).rejects.toThrow('INSUFFICIENT_PERMISSIONS');
    });

    it('should calculate reading time and word count', async () => {
      const input = {
        typeId: 'type_blog_post',
        title: 'Test',
        body: [
          {
            id: 'b1',
            type: 'paragraph' as const,
            data: { text: [{ text: 'word '.repeat(500) }] },
          },
        ],
        locale: 'en-US',
      };

      mockDb.contentTypes.findFirst.mockResolvedValue({ id: 'type_blog_post', isActive: true });
      mockDb.contents.insert.mockImplementation((data) => Promise.resolve({ ...data, id: 'new' }));

      const result = await service.create(input, ctx);

      expect(result.wordCount).toBe(500);
      expect(result.readingTimeMinutes).toBe(2); // ~250 wpm
    });
  });

  describe('submitForReview()', () => {
    it('should transition from draft to review', async () => {
      mockDb.contents.findFirst.mockResolvedValue({
        id: 'content_1',
        status: 'draft',
        authorId: 'user_test',
      });
      mockDb.contents.update.mockResolvedValue({ id: 'content_1', status: 'review' });

      const result = await service.submitForReview('content_1', ctx);

      expect(result.status).toBe('review');
    });

    it('should reject transition from published to review', async () => {
      mockDb.contents.findFirst.mockResolvedValue({
        id: 'content_1',
        status: 'published',
        authorId: 'user_test',
      });

      await expect(service.submitForReview('content_1', ctx)).rejects.toThrow(
        'INVALID_STATUS_TRANSITION',
      );
    });
  });

  describe('delete()', () => {
    it('should soft-delete content', async () => {
      mockDb.contents.findFirst.mockResolvedValue({
        id: 'content_1',
        status: 'draft',
        isDeleted: false,
      });
      mockDb.contents.update.mockResolvedValue({
        id: 'content_1',
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });

      await service.delete('content_1', ctx);

      expect(mockDb.contents.update).toHaveBeenCalledWith(
        expect.objectContaining({ isDeleted: true }),
      );
    });

    it('should reject deleting published content', async () => {
      mockDb.contents.findFirst.mockResolvedValue({
        id: 'content_1',
        status: 'published',
        isDeleted: false,
      });

      await expect(service.delete('content_1', ctx)).rejects.toThrow('CONTENT_IS_PUBLISHED');
    });
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestDatabase, seedTestData, cleanupTestDatabase } from '@mcv/test-utils/db';
import { ContentService } from '../content-service';
import { ContentVersionService } from '../content-version-service';
import { createRequestContext } from '@mcv/core/context';

describe('Content Lifecycle (Integration)', () => {
  let db: Awaited<ReturnType<typeof createTestDatabase>>;
  let contentService: ContentService;
  let versionService: ContentVersionService;
  let ctx: ReturnType<typeof createRequestContext>;

  beforeAll(async () => {
    db = await createTestDatabase();
    await seedTestData(db, {
      tenants: [{ id: 'tenant_int_test', name: 'Integration Test Tenant' }],
      users: [{ id: 'user_int_test', tenantId: 'tenant_int_test' }],
      contentTypes: [{ id: 'type_blog', tenantId: 'tenant_int_test', key: 'blog_post' }],
    });

    contentService = new ContentService(db);
    versionService = new ContentVersionService(db);
    ctx = createRequestContext({
      tenantId: 'tenant_int_test',
      userId: 'user_int_test',
      permissions: [
        'content.create',
        'content.read',
        'content.update',
        'content.delete',
        'content.publish',
      ],
    });
  });

  afterAll(async () => {
    await cleanupTestDatabase(db);
  });

  beforeEach(async () => {
    // Clean content between tests
    await db.delete(contents).where(eq(contents.tenantId, 'tenant_int_test'));
  });

  it('should complete full content lifecycle: create → review → approve → publish → archive', async () => {
    // 1. Create
    const created = await contentService.create(
      {
        typeId: 'type_blog',
        title: 'Integration Test Post',
        body: [{ id: 'b1', type: 'paragraph', data: { text: [{ text: 'Hello world.' }] } }],
        locale: 'en-US',
      },
      ctx,
    );
    expect(created.status).toBe('draft');
    expect(created.currentVersionNumber).toBe(1);

    // 2. Update (creates version 2)
    const updated = await contentService.update(
      created.id,
      { title: 'Integration Test Post (Revised)' },
      ctx,
    );
    expect(updated.currentVersionNumber).toBe(2);

    // 3. Submit for review
    const inReview = await contentService.submitForReview(created.id, ctx);
    expect(inReview.status).toBe('review');

    // 4. Verify versions
    const versions = await versionService.listVersions(created.id, ctx);
    expect(versions.length).toBeGreaterThanOrEqual(2);

    // 5. Archive
    // (In a full test, we'd go through approve → publish first)
    // Here we test the direct archive from draft (after returning from review)
  });

  it('should enforce tenant isolation', async () => {
    // Create content in tenant A
    const content = await contentService.create(
      { typeId: 'type_blog', title: 'Tenant A Content', body: [], locale: 'en-US' },
      ctx,
    );

    // Try to access from tenant B context
    const tenantBCtx = createRequestContext({
      tenantId: 'tenant_other',
      userId: 'user_other',
      permissions: ['content.read'],
    });

    const result = await contentService.getById(content.id, tenantBCtx);
    expect(result).toBeNull(); // RLS prevents access
  });

  it('should handle concurrent edit locking', async () => {
    const content = await contentService.create(
      { typeId: 'type_blog', title: 'Lock Test', body: [], locale: 'en-US' },
      ctx,
    );

    // User A acquires lock
    const lock = await contentService.acquireLock(content.id, ctx);
    expect(lock.lockedBy).toBe('user_int_test');

    // User B tries to acquire lock — should fail
    const userBCtx = createRequestContext({
      tenantId: 'tenant_int_test',
      userId: 'user_b',
      permissions: ['content.update'],
    });

    await expect(contentService.acquireLock(content.id, userBCtx)).rejects.toThrow(
      'CONTENT_LOCKED',
    );

    // User A releases lock
    await contentService.releaseLock(content.id, ctx);

    // User B can now acquire lock
    const lockB = await contentService.acquireLock(content.id, userBCtx);
    expect(lockB.lockedBy).toBe('user_b');
  });
});
```

### Coverage Targets

| Category | Minimum | Target |
|----------|---------|--------|
| Statements | 85% | 95% |
| Branches | 80% | 90% |
| Functions | 85% | 95% |
| Lines | 85% | 95% |

### Key Test Scenarios

1. **Content CRUD** — Create, read, update, soft-delete, restore, hard-delete
2. **Lifecycle State Machine** — All valid transitions, rejection of invalid transitions
3. **Slug Generation** — Unicode handling, conflict resolution, special characters
4. **Version Management** — Creation on save, diff accuracy, rollback integrity, checksum verification
5. **Approval Workflows** — Sequential and parallel modes, multi-step flows, auto-approve, escalation
6. **Multi-Channel Publishing** — Success/failure per channel, retry logic, format transformation
7. **Search** — Full-text search accuracy, filter combinations, pagination, relevance ranking
8. **Tenant Isolation** — Cross-tenant access prevention at DB level, storage isolation
9. **Concurrent Editing** — Lock acquisition, expiry, force release, heartbeat
10. **Localization** — AI translation, sync status, RTL detection, locale validation
11. **SEO Analysis** — Score calculation, issue detection, structured data generation
12. **AI Integration** — Suggestion generation, token tracking, quota enforcement, error handling
13. **Media Management** — Upload, thumbnail generation, type validation, size limits
14. **Calendar** — Date range queries, recurrence expansion, drag-and-drop rescheduling
15. **Analytics Aggregation** — Daily/weekly/monthly aggregation, score computation, attribution
16. **Error Handling** — All error codes triggered, proper HTTP status codes, meaningful messages
17. **Rate Limiting** — Per-tenant limits enforced, appropriate 429 responses
18. **Input Validation** — Zod schema enforcement, XSS prevention, SQL injection prevention

---

*Last updated: 2026-02-08*
*Module version: 0.1.0*
*Maintainer: MCV Growth Team*