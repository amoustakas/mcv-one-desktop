# @mcv/growth/creative

> Creative Asset Management — Design templates, asset libraries, brand guidelines enforcement, creative workflows, dynamic creative generation, and AI-powered content creation for the MCV.ONE platform.

**Package:** `@mcv/growth/creative`
**Layer:** Tier 5 — Domain Module (Growth)
**Runtime:** Node.js ≥ 20, Edge-compatible core
**Database:** Supabase PostgreSQL + Supabase Storage
**ORM:** Drizzle ORM with multi-tenant RLS
**API:** tRPC v11 routers
**Since:** 0.1.0

---

## Table of Contents

1. [Purpose](#purpose)
2. [Exports](#exports)
3. [Architecture](#architecture)
4. [Core Interfaces](#core-interfaces)
5. [Database Schemas](#database-schemas)
6. [Code Examples](#code-examples)
7. [Error Codes](#error-codes)
8. [Security](#security)
9. [Environment Variables](#environment-variables)
10. [Dependencies](#dependencies)
11. [Testing](#testing)

---

## Purpose

The `@mcv/growth/creative` module is the centralized creative asset management system for the MCV.ONE platform. It provides a comprehensive suite of tools for managing the entire creative lifecycle — from initial brief through design, review, approval, and publication — while enforcing brand consistency, tracking asset performance, and leveraging AI for content generation.

### Why This Module Exists

Marketing teams face a persistent set of challenges:

- **Asset chaos** — Creative files scattered across Google Drive, Dropbox, Slack threads, and email attachments. No single source of truth for the latest approved version of a logo, template, or brand asset.
- **Brand inconsistency** — Without automated enforcement, off-brand creatives slip through — wrong colors, outdated logos, inconsistent typography. Every manual review is a bottleneck.
- **Workflow friction** — The brief → design → review → approval pipeline lives in spreadsheets, email threads, and verbal agreements. Stakeholders lose track of where a creative stands.
- **Platform fragmentation** — A single campaign asset needs 15+ format variations across Instagram Stories, Facebook Feed, LinkedIn, email headers, display ads, and more. Manual resizing is tedious and error-prone.
- **Creative fatigue** — Running the same creative too long degrades performance. Teams lack data to know when to refresh, and generating fresh variants is slow.
- **Rights landmines** — Stock photo licenses expire, model releases have geographic restrictions, font licenses limit usage. A single oversight can trigger legal liability.

This module solves all of these by providing:

1. **A centralized asset library** with tagging, search, collections, and version history — backed by Supabase Storage with CDN delivery.
2. **A template engine** that supports variable substitution, conditional logic, and platform-aware rendering — so a single template can produce dozens of format-correct outputs.
3. **Automated brand compliance** that checks every creative against defined brand guidelines before it enters the approval pipeline.
4. **Structured creative workflows** with configurable stages, role-based assignments, inline annotations, and audit trails.
5. **Dynamic creative generation** that produces personalized, data-driven creative variants at scale — for A/B testing, audience segmentation, and programmatic advertising.
6. **AI-powered content creation** via OpenRouter integration — image generation, headline variations, copy writing, and visual suggestions.
7. **Asset performance tracking** that correlates creative assets with campaign metrics, detects fatigue, and recommends refreshes.
8. **Rights management** with license tracking, expiration alerts, usage rights enforcement, and attribution automation.

### Design Philosophy

- **Template-first** — Templates are first-class citizens, not afterthoughts. Every creative should start from a template for consistency and scalability.
- **Brand as code** — Brand guidelines are machine-readable rules, not PDF documents. Compliance is automated, not aspirational.
- **Platform-aware** — The system understands platform specifications natively. When you create for "Instagram Story," it knows the dimensions, safe zones, file format requirements, and duration limits.
- **Performance-linked** — Creative assets are connected to campaign performance data. The system can answer "which creative performed best?" and "is this creative fatigued?"
- **Rights-safe** — Every asset carries rights metadata. The system prevents usage of expired or restricted assets and automates attribution.
- **AI-augmented** — AI assists at every stage — generating initial concepts, writing copy variations, suggesting visual improvements — but humans remain in control of approvals.
- **Multi-tenant** — All operations are tenant-scoped via PostgreSQL RLS. Creative assets, templates, and brand guidelines are isolated per organization.

---

## Exports

```typescript
// === Primary Service ===
export { CreativeService } from './service';
export type { CreativeServiceConfig } from './service';

// === Asset Library ===
export { AssetLibrary } from './assets/library';
export { AssetUploader } from './assets/uploader';
export { AssetSearch } from './assets/search';
export { AssetCollections } from './assets/collections';
export { AssetVersioning } from './assets/versioning';
export type {
  Asset,
  AssetMetadata,
  AssetTag,
  AssetCollection,
  AssetVersion,
  AssetUploadOptions,
  AssetSearchQuery,
  AssetSearchResult,
  AssetFilter,
  AssetSort,
  AssetType,
  AssetStatus,
  AssetMimeType,
} from './assets/types';

// === Template Engine ===
export { TemplateEngine } from './templates/engine';
export { TemplateRenderer } from './templates/renderer';
export { TemplateVariableResolver } from './templates/variables';
export { TemplatePlatformAdapter } from './templates/platform-adapter';
export type {
  Template,
  TemplateVariable,
  TemplateVariableType,
  TemplateLayer,
  TemplateRenderOptions,
  TemplateRenderResult,
  TemplatePlatformSpec,
  TemplateCategory,
} from './templates/types';

// === Brand Guidelines ===
export { BrandGuidelineEngine } from './brand/engine';
export { BrandComplianceChecker } from './brand/compliance';
export { BrandColorValidator } from './brand/color-validator';
export { BrandTypographyValidator } from './brand/typography-validator';
export { BrandLogoValidator } from './brand/logo-validator';
export type {
  BrandGuideline,
  BrandColorPalette,
  BrandColor,
  BrandTypographyRule,
  BrandLogoRule,
  BrandToneOfVoice,
  BrandComplianceResult,
  BrandComplianceViolation,
  BrandComplianceSeverity,
} from './brand/types';

// === Creative Workflows ===
export { CreativeWorkflowEngine } from './workflows/engine';
export { WorkflowStepExecutor } from './workflows/step-executor';
export { WorkflowNotifier } from './workflows/notifier';
export type {
  CreativeWorkflow,
  WorkflowStep,
  WorkflowStepType,
  WorkflowStepStatus,
  WorkflowTransition,
  WorkflowComment,
  WorkflowAnnotation,
  WorkflowAssignment,
  CreativeBrief,
  CreativeBriefStatus,
} from './workflows/types';

// === Dynamic Creative ===
export { DynamicCreativeEngine } from './dynamic/engine';
export { PersonalizationEngine } from './dynamic/personalization';
export { VariantGenerator } from './dynamic/variant-generator';
export type {
  DynamicCreative,
  DynamicCreativeRule,
  PersonalizationContext,
  PersonalizationVariable,
  CreativeVariant,
  VariantGenerationConfig,
} from './dynamic/types';

// === Format Adaptation ===
export { FormatAdapter } from './formats/adapter';
export { PlatformRegistry } from './formats/platform-registry';
export { ImageResizer } from './formats/image-resizer';
export { VideoAdapter } from './formats/video-adapter';
export type {
  FormatAdaptation,
  PlatformFormat,
  PlatformSpec,
  ResizeStrategy,
  CropStrategy,
  AdaptationResult,
  SupportedPlatform,
} from './formats/types';

// === Asset Performance ===
export { AssetPerformanceTracker } from './performance/tracker';
export { CreativeFatigueDetector } from './performance/fatigue-detector';
export { RefreshRecommender } from './performance/refresh-recommender';
export type {
  AssetPerformance,
  PerformanceMetric,
  PerformanceTimeSeries,
  FatigueSignal,
  FatigueLevel,
  RefreshRecommendation,
  PerformanceAggregation,
} from './performance/types';

// === Rights Management ===
export { RightsManager } from './rights/manager';
export { LicenseTracker } from './rights/license-tracker';
export { ExpirationMonitor } from './rights/expiration-monitor';
export { AttributionGenerator } from './rights/attribution-generator';
export type {
  RightsRecord,
  LicenseType,
  LicenseTerms,
  UsageRight,
  UsageRestriction,
  ModelRelease,
  AttributionRequirement,
  RightsExpirationAlert,
} from './rights/types';

// === Collaboration ===
export { CollaborationHub } from './collaboration/hub';
export { CommentEngine } from './collaboration/comments';
export { TaskAssigner } from './collaboration/tasks';
export { BriefManager } from './collaboration/briefs';
export type {
  CollaborationSession,
  CreativeComment,
  CommentThread,
  CreativeTask,
  TaskStatus,
  TaskPriority,
  Mention,
} from './collaboration/types';

// === AI Generation ===
export { AICreativeGenerator } from './ai/generator';
export { AIImageGenerator } from './ai/image-generator';
export { AICopyWriter } from './ai/copy-writer';
export { AIVisualSuggester } from './ai/visual-suggester';
export type {
  AIGenerationRequest,
  AIGenerationResult,
  AIImagePrompt,
  AICopyPrompt,
  AICopyVariation,
  AIVisualSuggestion,
  AIModelConfig,
} from './ai/types';

// === Database Schema ===
export {
  assetsTable,
  assetTagsTable,
  templatesTable,
  templateVariablesTable,
  brandGuidelinesTable,
  creativeWorkflowsTable,
  workflowStepsTable,
  dynamicCreativesTable,
  formatAdaptationsTable,
  assetPerformanceTable,
  rightsRecordsTable,
  creativeBriefsTable,
} from './schema';

// === tRPC Router ===
export { creativeRouter } from './router';
export type { CreativeRouter } from './router';

// === Constants ===
export {
  SUPPORTED_PLATFORMS,
  PLATFORM_SPECS,
  DEFAULT_IMAGE_FORMATS,
  MAX_ASSET_SIZE_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
  BRAND_COMPLIANCE_THRESHOLDS,
  CREATIVE_WORKFLOW_STAGES,
  FATIGUE_DETECTION_WINDOWS,
  AI_GENERATION_LIMITS,
} from './constants';

// === Errors ===
export {
  CreativeError,
  AssetNotFoundError,
  AssetUploadError,
  AssetTooLargeError,
  AssetFormatUnsupportedError,
  TemplateNotFoundError,
  TemplateRenderError,
  TemplateVariableMissingError,
  BrandComplianceError,
  BrandGuidelineNotFoundError,
  WorkflowNotFoundError,
  WorkflowTransitionError,
  WorkflowStepNotFoundError,
  WorkflowPermissionError,
  DynamicCreativeError,
  FormatAdaptationError,
  UnsupportedPlatformError,
  RightsExpiredError,
  RightsRestrictionError,
  LicenseNotFoundError,
  AIGenerationError,
  AIQuotaExceededError,
  CollaborationError,
  CreativeBriefError,
  AssetVersionConflictError,
  TenantIsolationError,
} from './errors';
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CreativeService                              │
│                   (Orchestration & Facade)                           │
├─────────┬──────────┬───────────┬──────────┬────────────┬────────────┤
│  Asset  │ Template │   Brand   │ Workflow │  Dynamic   │     AI     │
│ Library │  Engine  │ Guidelines│  Engine  │  Creative  │ Generation │
├─────────┴──────────┴───────────┴──────────┴────────────┴────────────┤
│                        Format Adapter                                │
│              (Platform-Aware Resize & Transform)                     │
├──────────────────┬──────────────────┬───────────────────────────────┤
│   Performance    │      Rights      │        Collaboration          │
│    Tracker       │     Manager      │            Hub                │
├──────────────────┴──────────────────┴───────────────────────────────┤
│                    Shared Infrastructure                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Supabase │  │  Supabase │  │  Sharp   │  │   OpenRouter     │   │
│  │PostgreSQL│  │  Storage  │  │  (Image) │  │   (AI Models)    │   │
│  │  + RLS   │  │  + CDN    │  │Processing│  │                  │   │
│  └──────────┘  └───────────┘  └──────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Architecture

#### CreativeService (Orchestration Layer)

The `CreativeService` is the primary entry point. It orchestrates interactions between all subsystems and provides a unified API surface. It does not implement business logic directly — it delegates to specialized engines and managers.

```
CreativeService
├── AssetLibrary           → CRUD, search, collections, versioning
├── TemplateEngine         → Template management, rendering, variables
├── BrandGuidelineEngine   → Guideline CRUD, compliance checking
├── CreativeWorkflowEngine → Workflow lifecycle, transitions, notifications
├── DynamicCreativeEngine  → Rule-based personalization, variant generation
├── FormatAdapter          → Platform-aware resize/transform
├── AssetPerformanceTracker → Metrics ingestion, fatigue detection
├── RightsManager          → License tracking, expiration monitoring
├── CollaborationHub       → Comments, tasks, mentions, briefs
└── AICreativeGenerator    → Image generation, copywriting, suggestions
```

#### Data Flow: Brief to Published Creative

```
                    ┌──────────────┐
                    │ Creative Brief│
                    │  (Input)     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  AI Generate │ (optional)
                    │  Suggestions │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Template   │
                    │   Selection  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Variable   │
                    │  Population  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Render     │
                    │   Creative   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │    Brand     │
                    │  Compliance  │──── Violations? → Back to Design
                    │    Check     │
                    └──────┬───────┘
                           │ Pass
                    ┌──────▼───────┐
                    │   Format     │
                    │  Adaptation  │ → Instagram, Facebook, LinkedIn, etc.
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Review &   │
                    │   Approval   │──── Rejected? → Back to Design
                    │  Workflow    │
                    └──────┬───────┘
                           │ Approved
                    ┌──────▼───────┐
                    │   Rights     │
                    │  Validation  │──── Expired? → Block publish
                    └──────┬───────┘
                           │ Valid
                    ┌──────▼───────┐
                    │   Publish    │
                    │   to CDN     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Performance │
                    │   Tracking   │
                    └──────────────┘
```

#### Storage Architecture

The module uses a two-tier storage strategy:

1. **Supabase PostgreSQL** — Metadata, relationships, workflow state, performance metrics, search indices. All tables use multi-tenant RLS with `tenant_id` scoping.

2. **Supabase Storage** — Binary asset files (images, videos, fonts, design files). Organized in tenant-scoped buckets with CDN delivery.

```
Storage Bucket Structure:
creative-assets/
├── {tenant_id}/
│   ├── assets/
│   │   ├── images/
│   │   │   ├── {asset_id}/
│   │   │   │   ├── original.{ext}
│   │   │   │   ├── thumbnail.webp
│   │   │   │   ├── preview.webp
│   │   │   │   └── versions/
│   │   │   │       ├── v1.{ext}
│   │   │   │       └── v2.{ext}
│   │   ├── videos/
│   │   ├── logos/
│   │   ├── fonts/
│   │   └── documents/
│   ├── templates/
│   │   ├── {template_id}/
│   │   │   ├── definition.json
│   │   │   ├── preview.webp
│   │   │   └── layers/
│   ├── renders/
│   │   ├── {render_id}.{ext}
│   │   └── adaptations/
│   │       ├── instagram-story.{ext}
│   │       ├── facebook-feed.{ext}
│   │       └── linkedin-post.{ext}
│   └── ai-generated/
│       ├── {generation_id}/
│       │   ├── output.{ext}
│       │   └── metadata.json
```

#### Template Rendering Pipeline

```
Template Definition (JSON)
│
├── Layers (ordered z-index)
│   ├── Background Layer
│   │   └── Color / Gradient / Image
│   ├── Image Layers
│   │   └── Source (asset ref or dynamic)
│   ├── Text Layers
│   │   └── Content (static or variable)
│   ├── Shape Layers
│   │   └── SVG paths, rectangles, circles
│   └── Logo Layers
│       └── Brand logo with placement rules
│
├── Variables (substitution points)
│   ├── {{headline}} → Text content
│   ├── {{product_image}} → Image asset
│   ├── {{cta_text}} → Call-to-action text
│   ├── {{brand_color}} → Color from palette
│   └── {{price}} → Dynamic data
│
├── Platform Constraints
│   ├── Dimensions (width × height)
│   ├── Safe zones (text-safe area)
│   ├── File format (JPEG, PNG, WebP, MP4)
│   ├── Max file size
│   └── Duration (for video/animated)
│
└── Render Output
    ├── Sharp (image processing)
    ├── Format conversion
    ├── Quality optimization
    └── CDN upload
```

#### Multi-Tenant Isolation

Every database table includes a `tenant_id` column with RLS policies enforcing tenant isolation. The module never queries without tenant context.

```sql
-- Example RLS policy (applied to all creative tables)
CREATE POLICY "tenant_isolation" ON assets
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

The `CreativeService` constructor requires a tenant context:

```typescript
const creative = new CreativeService({
  tenantId: 'org_abc123',
  supabase: supabaseClient,
  storage: storageClient,
  openRouter: openRouterClient, // optional, for AI features
});
```

---

## Core Interfaces

### Asset

```typescript
/**
 * Represents a creative asset stored in the asset library.
 * Assets are immutable once finalized — changes create new versions.
 */
interface Asset {
  /** Unique asset identifier (ULID) */
  id: string;

  /** Tenant (organization) this asset belongs to */
  tenantId: string;

  /** Human-readable name */
  name: string;

  /** Optional description */
  description: string | null;

  /** Asset type classification */
  type: AssetType;

  /** MIME type of the original file */
  mimeType: string;

  /** File size in bytes */
  fileSizeBytes: number;

  /** Storage path in Supabase Storage */
  storagePath: string;

  /** CDN URL for the asset */
  cdnUrl: string;

  /** Thumbnail URL (generated on upload) */
  thumbnailUrl: string | null;

  /** Preview URL (medium resolution) */
  previewUrl: string | null;

  /** Image/video dimensions */
  dimensions: AssetDimensions | null;

  /** Duration in seconds (for video/audio assets) */
  durationSeconds: number | null;

  /** Current version number */
  version: number;

  /** Asset lifecycle status */
  status: AssetStatus;

  /** Extracted metadata (EXIF, color profile, etc.) */
  metadata: AssetMetadata;

  /** Tags for organization and search */
  tags: AssetTag[];

  /** Collection memberships */
  collectionIds: string[];

  /** Associated rights record */
  rightsRecordId: string | null;

  /** Hash of the original file (SHA-256) */
  fileHash: string;

  /** Color palette extracted from the asset */
  extractedColors: string[] | null;

  /** AI-generated description of the asset */
  aiDescription: string | null;

  /** User who uploaded this asset */
  uploadedBy: string;

  /** Timestamp of creation */
  createdAt: Date;

  /** Timestamp of last update */
  updatedAt: Date;

  /** Soft delete timestamp */
  deletedAt: Date | null;
}

/** Classification of asset types */
type AssetType =
  | 'image'
  | 'video'
  | 'audio'
  | 'logo'
  | 'font'
  | 'icon'
  | 'illustration'
  | 'photograph'
  | 'animation'
  | 'document'
  | 'design_file'
  | 'brand_asset'
  | 'other';

/** Asset lifecycle statuses */
type AssetStatus =
  | 'uploading'
  | 'processing'
  | 'active'
  | 'archived'
  | 'deleted'
  | 'quarantined'; // flagged for rights issues

/** Physical dimensions of visual assets */
interface AssetDimensions {
  width: number;
  height: number;
  aspectRatio: string; // e.g., "16:9", "1:1", "9:16"
  unit: 'px' | 'in' | 'cm' | 'mm';
  dpi: number | null;
}

/** Extended metadata extracted from asset files */
interface AssetMetadata {
  /** EXIF data for photographs */
  exif?: Record<string, unknown>;

  /** Color space (sRGB, Adobe RGB, CMYK, etc.) */
  colorSpace?: string;

  /** Color profile name */
  colorProfile?: string;

  /** Has alpha/transparency channel */
  hasAlpha?: boolean;

  /** Is animated (GIF, APNG, animated WebP) */
  isAnimated?: boolean;

  /** Frame count for animated assets */
  frameCount?: number;

  /** Video codec */
  videoCodec?: string;

  /** Audio codec */
  audioCodec?: string;

  /** Bitrate in kbps */
  bitrate?: number;

  /** Font family name (for font assets) */
  fontFamily?: string;

  /** Font weight (for font assets) */
  fontWeight?: number;

  /** Font style (for font assets) */
  fontStyle?: 'normal' | 'italic' | 'oblique';

  /** Custom metadata key-value pairs */
  custom?: Record<string, string>;
}

/** Tag associated with an asset */
interface AssetTag {
  id: string;
  name: string;
  category: string | null; // e.g., "campaign", "season", "product"
  color: string | null;    // hex color for UI display
}
```

### Template

```typescript
/**
 * A design template that can be rendered with variable substitution.
 * Templates define the visual structure; variables provide the content.
 */
interface Template {
  /** Unique template identifier */
  id: string;

  /** Tenant this template belongs to */
  tenantId: string;

  /** Template name */
  name: string;

  /** Description of the template's purpose */
  description: string | null;

  /** Category for organization */
  category: TemplateCategory;

  /** Sub-category (e.g., "product-launch", "sale", "announcement") */
  subCategory: string | null;

  /** Target platforms this template is designed for */
  targetPlatforms: SupportedPlatform[];

  /** Base dimensions (before platform adaptation) */
  baseDimensions: {
    width: number;
    height: number;
  };

  /** Ordered layers that compose the template */
  layers: TemplateLayer[];

  /** Variables that can be substituted during rendering */
  variables: TemplateVariable[];

  /** Brand guideline ID this template adheres to */
  brandGuidelineId: string | null;

  /** Preview image URL */
  previewUrl: string | null;

  /** Template version */
  version: number;

  /** Is this a system-provided template or user-created */
  isSystem: boolean;

  /** Is this template publicly available in the marketplace */
  isPublic: boolean;

  /** Usage count (how many times rendered) */
  usageCount: number;

  /** Average performance score of creatives made from this template */
  avgPerformanceScore: number | null;

  /** Template status */
  status: 'draft' | 'active' | 'archived' | 'deprecated';

  /** User who created this template */
  createdBy: string;

  createdAt: Date;
  updatedAt: Date;
}

/** Categories for organizing templates */
type TemplateCategory =
  | 'social_post'
  | 'social_story'
  | 'social_reel'
  | 'display_ad'
  | 'search_ad'
  | 'email_header'
  | 'email_body'
  | 'banner'
  | 'landing_page_hero'
  | 'blog_header'
  | 'presentation'
  | 'infographic'
  | 'logo_lockup'
  | 'business_card'
  | 'flyer'
  | 'poster'
  | 'video_thumbnail'
  | 'og_image'
  | 'favicon'
  | 'custom';

/** A single layer in a template */
interface TemplateLayer {
  /** Layer identifier (unique within template) */
  id: string;

  /** Layer type */
  type: 'background' | 'image' | 'text' | 'shape' | 'logo' | 'group';

  /** Display name */
  name: string;

  /** Z-index ordering */
  zIndex: number;

  /** Whether this layer is visible */
  visible: boolean;

  /** Whether this layer is locked (not editable) */
  locked: boolean;

  /** Opacity (0-1) */
  opacity: number;

  /** Position and size */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number; // degrees
  };

  /** Blend mode */
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';

  /** Type-specific properties */
  properties: TemplateLayerProperties;

  /** Effects applied to this layer */
  effects: LayerEffect[];

  /** Whether this layer's content is driven by a variable */
  variableBinding: string | null; // variable name
}

/** Type-specific properties for template layers */
type TemplateLayerProperties =
  | BackgroundLayerProps
  | ImageLayerProps
  | TextLayerProps
  | ShapeLayerProps
  | LogoLayerProps
  | GroupLayerProps;

interface BackgroundLayerProps {
  type: 'background';
  fill: ColorFill | GradientFill | ImageFill;
}

interface ImageLayerProps {
  type: 'image';
  assetId: string | null; // reference to asset library
  src: string | null;     // direct URL fallback
  fit: 'cover' | 'contain' | 'fill' | 'none';
  cropArea: { x: number; y: number; width: number; height: number } | null;
  borderRadius: number;
  border: BorderSpec | null;
}

interface TextLayerProps {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  color: string; // hex
  textAlign: 'left' | 'center' | 'right' | 'justify';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  letterSpacing: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  maxLines: number | null;
  overflow: 'visible' | 'hidden' | 'ellipsis';
  textShadow: TextShadowSpec | null;
  padding: PaddingSpec;
}

interface ShapeLayerProps {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'ellipse' | 'polygon' | 'path';
  fill: ColorFill | GradientFill | null;
  stroke: StrokeSpec | null;
  borderRadius: number;
  svgPath: string | null; // for custom paths
}

interface LogoLayerProps {
  type: 'logo';
  logoAssetId: string;
  variant: 'primary' | 'secondary' | 'monochrome' | 'reversed';
  minClearSpace: number; // px
  maxScale: number;      // maximum scale factor
}

interface GroupLayerProps {
  type: 'group';
  childLayerIds: string[];
  clipContent: boolean;
}

/** Visual effects applied to layers */
interface LayerEffect {
  type: 'shadow' | 'blur' | 'glow' | 'outline' | 'color_overlay';
  enabled: boolean;
  properties: Record<string, unknown>;
}

/** Color fill specification */
interface ColorFill {
  type: 'solid';
  color: string; // hex with alpha: #RRGGBBAA
}

/** Gradient fill specification */
interface GradientFill {
  type: 'linear' | 'radial';
  stops: Array<{ position: number; color: string }>;
  angle: number; // for linear gradients
}

/** Image fill specification */
interface ImageFill {
  type: 'image';
  assetId: string;
  fit: 'cover' | 'contain' | 'fill' | 'tile';
}

/** Template variable definition */
interface TemplateVariable {
  /** Variable name (used in {{name}} syntax) */
  name: string;

  /** Human-readable label */
  label: string;

  /** Description / help text */
  description: string | null;

  /** Variable data type */
  type: TemplateVariableType;

  /** Default value */
  defaultValue: string | null;

  /** Is this variable required for rendering */
  required: boolean;

  /** Validation rules */
  validation: VariableValidation | null;

  /** For enum types, the allowed values */
  allowedValues: string[] | null;

  /** Group name for organizing variables in UI */
  group: string | null;

  /** Display order within group */
  order: number;
}

type TemplateVariableType =
  | 'text'
  | 'long_text'
  | 'number'
  | 'color'
  | 'image'      // asset ID or URL
  | 'boolean'
  | 'enum'
  | 'date'
  | 'url'
  | 'font'
  | 'json';

interface VariableValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string; // regex
  message?: string; // custom error message
}
```

### BrandGuideline

```typescript
/**
 * Machine-readable brand guidelines that enable automated compliance checking.
 * A tenant can have multiple brand guidelines (e.g., per product line or sub-brand).
 */
interface BrandGuideline {
  /** Unique identifier */
  id: string;

  /** Tenant this guideline belongs to */
  tenantId: string;

  /** Brand or sub-brand name */
  name: string;

  /** Description */
  description: string | null;

  /** Color palette definitions */
  colorPalette: BrandColorPalette;

  /** Typography rules */
  typography: BrandTypographyRule[];

  /** Logo usage rules */
  logoRules: BrandLogoRule[];

  /** Tone of voice guidelines */
  toneOfVoice: BrandToneOfVoice | null;

  /** Imagery style guidelines */
  imageryStyle: BrandImageryStyle | null;

  /** Minimum contrast ratio (WCAG compliance) */
  minContrastRatio: number; // default: 4.5 (AA)

  /** Forbidden elements (competitor logos, certain phrases, etc.) */
  forbiddenElements: ForbiddenElement[];

  /** Is this the default/primary brand guideline */
  isPrimary: boolean;

  /** Guideline version */
  version: number;

  /** Status */
  status: 'draft' | 'active' | 'archived';

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Brand color palette with named colors and usage rules */
interface BrandColorPalette {
  /** Primary brand colors */
  primary: BrandColor[];

  /** Secondary / accent colors */
  secondary: BrandColor[];

  /** Neutral colors */
  neutrals: BrandColor[];

  /** Background colors */
  backgrounds: BrandColor[];

  /** Text colors */
  text: BrandColor[];

  /** Colors that must never be used */
  forbidden: string[]; // hex values

  /** Maximum number of colors in a single creative */
  maxColorsPerCreative: number | null;

  /** Required color combinations (e.g., "primary must appear with secondary") */
  requiredCombinations: ColorCombinationRule[];
}

/** A single brand color definition */
interface BrandColor {
  /** Color name (e.g., "Brand Blue", "Sunset Orange") */
  name: string;

  /** Hex value */
  hex: string;

  /** RGB components */
  rgb: { r: number; g: number; b: number };

  /** HSL components */
  hsl: { h: number; s: number; l: number };

  /** CMYK components (for print) */
  cmyk: { c: number; m: number; y: number; k: number } | null;

  /** Pantone reference */
  pantone: string | null;

  /** Allowed tolerance for color matching (delta E) */
  tolerance: number; // default: 3.0

  /** Usage context restrictions */
  usageContext: ('background' | 'text' | 'accent' | 'cta' | 'border' | 'icon')[];
}

/** Typography rules for the brand */
interface BrandTypographyRule {
  /** Rule name (e.g., "Heading", "Body", "Caption") */
  name: string;

  /** Context where this rule applies */
  context: 'heading' | 'subheading' | 'body' | 'caption' | 'cta' | 'legal' | 'all';

  /** Allowed font families (in preference order) */
  allowedFontFamilies: string[];

  /** Fallback system fonts */
  fallbackFonts: string[];

  /** Font size range */
  fontSize: {
    min: number;
    max: number;
    preferred: number;
    unit: 'px' | 'pt' | 'rem';
  };

  /** Allowed font weights */
  allowedWeights: number[];

  /** Line height range */
  lineHeight: {
    min: number;
    max: number;
    preferred: number;
  };

  /** Letter spacing range */
  letterSpacing: {
    min: number;
    max: number;
    preferred: number;
    unit: 'px' | 'em';
  };

  /** Allowed text transforms */
  allowedTransforms: ('none' | 'uppercase' | 'lowercase' | 'capitalize')[];

  /** Maximum line length (characters) for readability */
  maxLineLength: number | null;
}

/** Logo usage rules */
interface BrandLogoRule {
  /** Logo variant identifier */
  variant: 'primary' | 'secondary' | 'monochrome' | 'reversed' | 'icon_only';

  /** Logo asset ID in the library */
  assetId: string;

  /** Minimum clear space (as percentage of logo height) */
  minClearSpacePercent: number;

  /** Minimum size in pixels */
  minSizePx: { width: number; height: number };

  /** Maximum size in pixels (null = no limit) */
  maxSizePx: { width: number; height: number } | null;

  /** Allowed background colors */
  allowedBackgrounds: string[]; // hex values, or 'any'

  /** Forbidden background colors */
  forbiddenBackgrounds: string[];

  /** Can the logo be rotated? */
  allowRotation: boolean;

  /** Can the logo be cropped? */
  allowCropping: boolean;

  /** Can the logo have effects applied (shadow, glow, etc.)? */
  allowEffects: boolean;

  /** Can the logo colors be changed? */
  allowRecoloring: boolean;
}

/** Tone of voice guidelines for copy */
interface BrandToneOfVoice {
  /** Overall tone descriptors */
  toneDescriptors: string[]; // e.g., ["professional", "friendly", "confident"]

  /** Words and phrases to use */
  preferredVocabulary: string[];

  /** Words and phrases to avoid */
  avoidVocabulary: string[];

  /** Writing style rules */
  styleRules: string[];

  /** Examples of on-brand copy */
  examples: Array<{
    context: string;
    good: string;
    bad: string;
  }>;

  /** Maximum reading level (Flesch-Kincaid grade) */
  maxReadingLevel: number | null;
}

/** Imagery style guidelines */
interface BrandImageryStyle {
  /** Preferred photography style */
  photographyStyle: string[]; // e.g., ["natural lighting", "candid", "diverse subjects"]

  /** Preferred illustration style */
  illustrationStyle: string[]; // e.g., ["flat", "line art", "isometric"]

  /** Color grading preferences */
  colorGrading: string[]; // e.g., ["warm tones", "high contrast"]

  /** Forbidden imagery themes */
  forbiddenThemes: string[];

  /** Required image attributes */
  requiredAttributes: string[]; // e.g., ["diverse representation", "real people"]
}

/** Elements that are explicitly forbidden in brand creatives */
interface ForbiddenElement {
  type: 'color' | 'font' | 'phrase' | 'image_theme' | 'competitor_reference';
  value: string;
  reason: string;
}

/** Rules for required color combinations */
interface ColorCombinationRule {
  description: string;
  ifColor: string;      // hex
  thenRequire: string;  // hex
  context: string;      // where this rule applies
}

/** Result of a brand compliance check */
interface BrandComplianceResult {
  /** Overall compliance status */
  compliant: boolean;

  /** Compliance score (0-100) */
  score: number;

  /** Individual violations found */
  violations: BrandComplianceViolation[];

  /** Warnings (non-blocking but recommended fixes) */
  warnings: BrandComplianceViolation[];

  /** Timestamp of the check */
  checkedAt: Date;

  /** Brand guideline used for checking */
  guidelineId: string;

  /** Asset or creative that was checked */
  targetId: string;
  targetType: 'asset' | 'template_render' | 'dynamic_creative';
}

/** A single compliance violation */
interface BrandComplianceViolation {
  /** Violation code (maps to error codes) */
  code: string;

  /** Severity level */
  severity: BrandComplianceSeverity;

  /** Human-readable description */
  message: string;

  /** Which layer/element is in violation */
  location: string;

  /** The violating value */
  actual: string;

  /** What was expected */
  expected: string;

  /** Suggested fix */
  suggestion: string | null;

  /** Can this be auto-fixed? */
  autoFixable: boolean;
}

type BrandComplianceSeverity = 'error' | 'warning' | 'info';
```

### CreativeWorkflow

```typescript
/**
 * A workflow that guides a creative asset through the brief → design → review → approval → publish pipeline.
 */
interface CreativeWorkflow {
  /** Unique workflow identifier */
  id: string;

  /** Tenant */
  tenantId: string;

  /** Workflow name */
  name: string;

  /** Description */
  description: string | null;

  /** Associated creative brief */
  briefId: string;

  /** The asset(s) being worked on */
  assetIds: string[];

  /** Template used (if any) */
  templateId: string | null;

  /** Current workflow status */
  status: WorkflowStatus;

  /** Current step in the workflow */
  currentStepId: string;

  /** All steps in this workflow */
  steps: WorkflowStep[];

  /** Priority level */
  priority: 'low' | 'normal' | 'high' | 'urgent';

  /** Deadline */
  deadline: Date | null;

  /** Users assigned to this workflow */
  assignees: WorkflowAssignment[];

  /** Comment threads */
  comments: WorkflowComment[];

  /** Visual annotations on the creative */
  annotations: WorkflowAnnotation[];

  /** Number of revision rounds */
  revisionCount: number;

  /** Maximum allowed revisions (null = unlimited) */
  maxRevisions: number | null;

  /** Workflow initiator */
  createdBy: string;

  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

type WorkflowStatus =
  | 'draft'
  | 'briefing'
  | 'in_design'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'published'
  | 'cancelled'
  | 'on_hold';

/** A single step in the workflow pipeline */
interface WorkflowStep {
  id: string;
  workflowId: string;
  name: string;
  type: WorkflowStepType;
  status: WorkflowStepStatus;
  order: number;

  /** Who is responsible for this step */
  assigneeId: string | null;

  /** Role that can complete this step */
  requiredRole: string | null;

  /** Step-specific configuration */
  config: WorkflowStepConfig;

  /** When this step was started */
  startedAt: Date | null;

  /** When this step was completed */
  completedAt: Date | null;

  /** Duration limit for this step (hours) */
  timeoutHours: number | null;

  /** Result/outcome of this step */
  result: WorkflowStepResult | null;
}

type WorkflowStepType =
  | 'brief_submission'
  | 'brief_approval'
  | 'design'
  | 'internal_review'
  | 'client_review'
  | 'brand_compliance_check'
  | 'legal_review'
  | 'final_approval'
  | 'format_adaptation'
  | 'publish';

type WorkflowStepStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'skipped'
  | 'failed'
  | 'blocked';

interface WorkflowStepConfig {
  /** Minimum number of approvals needed (for review steps) */
  minApprovals?: number;

  /** Auto-advance after brand compliance passes */
  autoAdvanceOnCompliance?: boolean;

  /** Platforms to generate adaptations for */
  targetPlatforms?: SupportedPlatform[];

  /** Require all assignees to approve (vs. any one) */
  requireUnanimous?: boolean;

  /** Custom validation function name */
  customValidator?: string;
}

interface WorkflowStepResult {
  status: 'approved' | 'rejected' | 'completed';
  notes: string | null;
  decidedBy: string;
  decidedAt: Date;
}

/** Comment on a workflow */
interface WorkflowComment {
  id: string;
  workflowId: string;
  stepId: string | null;
  authorId: string;
  authorName: string;
  content: string;
  mentions: Mention[];
  attachmentIds: string[];
  parentCommentId: string | null; // for threaded replies
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** Visual annotation on a creative asset */
interface WorkflowAnnotation {
  id: string;
  workflowId: string;
  assetId: string;
  authorId: string;

  /** Annotation position on the creative */
  position: {
    x: number;      // percentage (0-100)
    y: number;      // percentage (0-100)
    width: number;  // percentage
    height: number; // percentage
  };

  /** Annotation content */
  content: string;

  /** Annotation type */
  type: 'comment' | 'change_request' | 'approval' | 'question';

  /** Is this resolved? */
  resolved: boolean;

  /** Who resolved it */
  resolvedBy: string | null;

  createdAt: Date;
}

/** User assignment to a workflow */
interface WorkflowAssignment {
  userId: string;
  userName: string;
  role: 'designer' | 'reviewer' | 'approver' | 'requester' | 'observer';
  assignedAt: Date;
  assignedBy: string;
}

/** A mention of a user in a comment */
interface Mention {
  userId: string;
  userName: string;
  position: { start: number; end: number }; // character positions in content
}

/** A creative brief that initiates a workflow */
interface CreativeBrief {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  objectives: string[];
  targetAudience: string;
  keyMessages: string[];
  callToAction: string | null;
  platforms: SupportedPlatform[];
  dimensions: Array<{ width: number; height: number; label: string }>;
  brandGuidelineId: string | null;
  referenceAssetIds: string[];
  toneOfVoice: string | null;
  deadline: Date | null;
  budget: { amount: number; currency: string } | null;
  status: CreativeBriefStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

type CreativeBriefStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
```

### DynamicCreative

```typescript
/**
 * Dynamic creative configuration for data-driven content generation.
 * Produces personalized creative variants based on audience data and rules.
 */
interface DynamicCreative {
  /** Unique identifier */
  id: string;

  /** Tenant */
  tenantId: string;

  /** Name */
  name: string;

  /** Description */
  description: string | null;

  /** Base template to generate variants from */
  templateId: string;

  /** Rules that determine content variations */
  rules: DynamicCreativeRule[];

  /** Variables available for personalization */
  personalizationVariables: PersonalizationVariable[];

  /** Maximum number of variants to generate */
  maxVariants: number;

  /** Generated variants */
  variants: CreativeVariant[];

  /** Performance optimization strategy */
  optimizationStrategy: 'none' | 'ctr' | 'conversion' | 'engagement' | 'custom';

  /** Status */
  status: 'draft' | 'generating' | 'active' | 'paused' | 'completed';

  /** Campaign this dynamic creative is associated with */
  campaignId: string | null;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Rule for determining content variations */
interface DynamicCreativeRule {
  /** Rule identifier */
  id: string;

  /** Rule name */
  name: string;

  /** Variable this rule controls */
  targetVariable: string;

  /** Condition for applying this rule */
  condition: RuleCondition;

  /** Value to use when condition is met */
  value: string;

  /** Priority (higher = checked first) */
  priority: number;

  /** Is this rule active? */
  enabled: boolean;
}

/** Condition for a dynamic creative rule */
interface RuleCondition {
  type: 'audience_segment' | 'geo' | 'device' | 'time' | 'weather' | 'custom';
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'gt' | 'lt' | 'between';
  field: string;
  value: string | string[] | number;
}

/** A variable available for personalization */
interface PersonalizationVariable {
  name: string;
  label: string;
  type: 'text' | 'image' | 'color' | 'number' | 'url';
  source: 'rule' | 'data_feed' | 'api' | 'static';
  defaultValue: string;
  variants: Array<{
    value: string;
    label: string;
    condition: string | null; // human-readable condition description
  }>;
}

/** A generated creative variant */
interface CreativeVariant {
  id: string;
  dynamicCreativeId: string;
  name: string;
  variableValues: Record<string, string>;
  renderedAssetId: string | null;
  previewUrl: string | null;
  performanceMetrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
  } | null;
  status: 'pending' | 'rendered' | 'active' | 'paused' | 'retired';
  createdAt: Date;
}
```

### FormatAdapter

```typescript
/**
 * Platform-aware format adaptation for creative assets.
 * Handles resizing, cropping, format conversion, and safe zone enforcement.
 */
interface FormatAdaptation {
  /** Unique identifier */
  id: string;

  /** Source asset ID */
  sourceAssetId: string;

  /** Target platform */
  platform: SupportedPlatform;

  /** Target format specification */
  platformFormat: PlatformFormat;

  /** Resize strategy used */
  resizeStrategy: ResizeStrategy;

  /** Crop strategy used */
  cropStrategy: CropStrategy;

  /** Resulting asset ID (in asset library) */
  resultAssetId: string;

  /** Result file size in bytes */
  resultFileSizeBytes: number;

  /** Quality score (0-100) indicating how well the adaptation preserves the original */
  qualityScore: number;

  /** Any warnings about the adaptation */
  warnings: string[];

  /** Was manual adjustment needed? */
  needsManualReview: boolean;

  createdAt: Date;
}

/** Supported social/advertising platforms */
type SupportedPlatform =
  | 'instagram_feed'
  | 'instagram_story'
  | 'instagram_reel'
  | 'instagram_carousel'
  | 'facebook_feed'
  | 'facebook_story'
  | 'facebook_cover'
  | 'facebook_ad'
  | 'twitter_post'
  | 'twitter_header'
  | 'linkedin_post'
  | 'linkedin_cover'
  | 'linkedin_ad'
  | 'tiktok_video'
  | 'youtube_thumbnail'
  | 'youtube_banner'
  | 'pinterest_pin'
  | 'pinterest_ad'
  | 'snapchat_ad'
  | 'google_display_responsive'
  | 'google_display_banner'
  | 'google_display_leaderboard'
  | 'google_display_skyscraper'
  | 'email_header'
  | 'email_banner'
  | 'og_image'
  | 'whatsapp_status'
  | 'custom';

/** Platform format specification */
interface PlatformFormat {
  platform: SupportedPlatform;
  name: string;
  dimensions: { width: number; height: number };
  aspectRatio: string;
  safeZone: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  maxFileSizeBytes: number;
  allowedFormats: ('jpeg' | 'png' | 'webp' | 'gif' | 'mp4' | 'mov')[];
  preferredFormat: 'jpeg' | 'png' | 'webp' | 'gif' | 'mp4';
  maxDurationSeconds: number | null; // for video
  minDurationSeconds: number | null; // for video
  notes: string | null;
}

/** Strategy for resizing assets */
type ResizeStrategy =
  | 'fit'         // Scale to fit within bounds, may add padding
  | 'fill'        // Scale to fill bounds, may crop
  | 'stretch'     // Stretch to exact dimensions (distorts)
  | 'smart_crop'  // AI-powered smart cropping
  | 'center_crop' // Center-based cropping
  | 'custom';     // User-defined crop area

/** Strategy for cropping when content doesn't fit */
type CropStrategy =
  | 'center'       // Crop from center
  | 'top'          // Preserve top
  | 'bottom'       // Preserve bottom
  | 'left'         // Preserve left
  | 'right'        // Preserve right
  | 'smart'        // AI-powered: detect faces/subjects, preserve key content
  | 'attention'    // Sharp's attention-based cropping
  | 'entropy';     // Sharp's entropy-based cropping
```

### AssetPerformance

```typescript
/**
 * Performance tracking for creative assets across campaigns.
 * Links creative assets to campaign metrics for optimization.
 */
interface AssetPerformance {
  /** Unique record identifier */
  id: string;

  /** Tenant */
  tenantId: string;

  /** Asset being tracked */
  assetId: string;

  /** Campaign this performance data relates to */
  campaignId: string | null;

  /** Ad group / ad set */
  adGroupId: string | null;

  /** Platform where the asset is running */
  platform: SupportedPlatform;

  /** Time period for these metrics */
  period: {
    start: Date;
    end: Date;
    granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
  };

  /** Core performance metrics */
  metrics: PerformanceMetric;

  /** Fatigue signal analysis */
  fatigueSignals: FatigueSignal[];

  /** Current fatigue level */
  fatigueLevel: FatigueLevel;

  /** Refresh recommendation */
  refreshRecommendation: RefreshRecommendation | null;

  /** Benchmark comparison */
  benchmarkComparison: {
    vsAccountAvg: number;   // percentage above/below account average
    vsCategoryAvg: number;  // percentage above/below category average
    percentile: number;     // percentile rank (0-100)
  } | null;

  updatedAt: Date;
}

/** Core performance metrics */
interface PerformanceMetric {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;

  /** Calculated metrics */
  ctr: number;                // click-through rate
  conversionRate: number;     // conversion rate
  cpc: number;                // cost per click
  cpa: number;                // cost per acquisition
  roas: number;               // return on ad spend
  engagementRate: number;     // engagement rate (likes + comments + shares / impressions)

  /** Engagement breakdown */
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    videoViews: number;
    videoCompletions: number;
    profileVisits: number;
    websiteClicks: number;
  };

  /** Quality score (platform-provided) */
  qualityScore: number | null;

  /** Relevance score (platform-provided) */
  relevanceScore: number | null;
}

/** Time series data point for performance trending */
interface PerformanceTimeSeries {
  timestamp: Date;
  metric: string;
  value: number;
}

/** Signal indicating creative fatigue */
interface FatigueSignal {
  type: 'ctr_decline' | 'cpc_increase' | 'frequency_high' | 'engagement_drop' | 'conversion_decline';
  severity: 'low' | 'medium' | 'high';
  currentValue: number;
  baselineValue: number;
  changePercent: number;
  detectedAt: Date;
  description: string;
}

/** Creative fatigue classification */
type FatigueLevel =
  | 'fresh'       // No fatigue signals
  | 'warming'     // Early signs of fatigue
  | 'fatigued'    // Clear fatigue, should consider refresh
  | 'exhausted';  // Severe fatigue, immediate refresh recommended

/** Recommendation for creative refresh */
interface RefreshRecommendation {
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  suggestedActions: string[];
  estimatedImpact: string;
  alternativeAssetIds: string[]; // existing assets that could replace this one
  generatedAt: Date;
}
```

### RightsRecord

```typescript
/**
 * Rights and licensing information for creative assets.
 * Tracks licenses, usage permissions, restrictions, and expiration.
 */
interface RightsRecord {
  /** Unique identifier */
  id: string;

  /** Tenant */
  tenantId: string;

  /** Asset this rights record applies to */
  assetId: string;

  /** License type */
  licenseType: LicenseType;

  /** License terms */
  terms: LicenseTerms;

  /** Usage rights granted */
  usageRights: UsageRight[];

  /** Usage restrictions */
  restrictions: UsageRestriction[];

  /** Model releases (for photographs with recognizable people) */
  modelReleases: ModelRelease[];

  /** Attribution requirements */
  attribution: AttributionRequirement | null;

  /** Source of the asset */
  source: AssetSource;

  /** Purchase/license reference number */
  licenseReferenceNumber: string | null;

  /** Purchase cost */
  cost: { amount: number; currency: string } | null;

  /** License start date */
  validFrom: Date;

  /** License expiration date (null = perpetual) */
  validUntil: Date | null;

  /** Is the license currently valid? */
  isValid: boolean;

  /** Days until expiration (null = perpetual) */
  daysUntilExpiration: number | null;

  /** Has expiration warning been sent? */
  expirationWarned: boolean;

  /** Notes */
  notes: string | null;

  /** Supporting documents (contract scans, release forms, etc.) */
  documentAssetIds: string[];

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Types of content licenses */
type LicenseType =
  | 'royalty_free'
  | 'rights_managed'
  | 'editorial_only'
  | 'creative_commons'
  | 'public_domain'
  | 'custom'
  | 'owned'           // original/proprietary content
  | 'ai_generated'
  | 'user_generated'
  | 'stock_standard'
  | 'stock_extended';

/** License terms and conditions */
interface LicenseTerms {
  /** Maximum number of impressions / views */
  maxImpressions: number | null;

  /** Maximum print run */
  maxPrintRun: number | null;

  /** Geographic restrictions */
  geoRestrictions: {
    type: 'allowed' | 'blocked';
    regions: string[]; // ISO 3166 country codes
  } | null;

  /** Platform restrictions */
  platformRestrictions: {
    type: 'allowed' | 'blocked';
    platforms: SupportedPlatform[];
  } | null;

  /** Industry restrictions */
  industryRestrictions: {
    type: 'allowed' | 'blocked';
    industries: string[];
  } | null;

  /** Can be used for commercial purposes? */
  commercial: boolean;

  /** Can be modified/edited? */
  modification: boolean;

  /** Can be sublicensed to third parties? */
  sublicensing: boolean;

  /** Must credit the original creator? */
  attributionRequired: boolean;

  /** Is exclusive use? */
  exclusive: boolean;

  /** Can be used in merchandise? */
  merchandiseUse: boolean;

  /** Can be used in sensitive contexts (political, adult, medical)? */
  sensitiveUseAllowed: boolean;
}

/** A specific usage right granted */
interface UsageRight {
  type: 'digital' | 'print' | 'broadcast' | 'social' | 'web' | 'mobile' | 'ooh' | 'all';
  description: string;
  limitations: string | null;
}

/** A specific usage restriction */
interface UsageRestriction {
  type: 'geo' | 'platform' | 'duration' | 'industry' | 'context' | 'modification';
  description: string;
  enforceable: boolean; // can the system automatically enforce this?
}

/** Model release information for photographs */
interface ModelRelease {
  id: string;
  modelName: string;
  releaseDate: Date;
  releaseDocumentId: string | null; // scanned release form
  restrictions: string[];
  expirationDate: Date | null;
  isMinor: boolean;
  guardianName: string | null; // if minor
}

/** Attribution requirements for an asset */
interface AttributionRequirement {
  /** Required attribution text */
  text: string;

  /** Creator/author name */
  authorName: string;

  /** URL to link to */
  url: string | null;

  /** Where attribution must appear */
  placement: 'in_creative' | 'caption' | 'credits' | 'any';

  /** Minimum font size for in-creative attribution */
  minFontSize: number | null;
}

/** Source of an asset */
interface AssetSource {
  type: 'stock' | 'original' | 'ai_generated' | 'user_upload' | 'agency' | 'partner';
  provider: string | null; // e.g., "Shutterstock", "Getty", "Unsplash"
  originalId: string | null; // ID in the source system
  originalUrl: string | null;
  creator: string | null;
  creatorUrl: string | null;
}
```

### CreativeService

```typescript
/**
 * Primary facade for all creative asset management operations.
 * Orchestrates interactions between all subsystems.
 */
interface CreativeService {
  // === Asset Library ===
  uploadAsset(file: File | Buffer, options: AssetUploadOptions): Promise<Asset>;
  getAsset(assetId: string): Promise<Asset>;
  listAssets(query: AssetSearchQuery): Promise<PaginatedResult<Asset>>;
  searchAssets(query: string, filters?: AssetFilter): Promise<AssetSearchResult>;
  updateAsset(assetId: string, updates: Partial<Asset>): Promise<Asset>;
  deleteAsset(assetId: string, permanent?: boolean): Promise<void>;
  createAssetVersion(assetId: string, file: File | Buffer): Promise<AssetVersion>;
  getAssetVersions(assetId: string): Promise<AssetVersion[]>;
  restoreAssetVersion(assetId: string, version: number): Promise<Asset>;
  tagAsset(assetId: string, tags: string[]): Promise<Asset>;
  untagAsset(assetId: string, tags: string[]): Promise<Asset>;
  createCollection(name: string, description?: string): Promise<AssetCollection>;
  addToCollection(collectionId: string, assetIds: string[]): Promise<void>;
  removeFromCollection(collectionId: string, assetIds: string[]): Promise<void>;
  getCollections(): Promise<AssetCollection[]>;

  // === Template Engine ===
  createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template>;
  getTemplate(templateId: string): Promise<Template>;
  listTemplates(filters?: { category?: TemplateCategory; platform?: SupportedPlatform }): Promise<Template[]>;
  updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template>;
  deleteTemplate(templateId: string): Promise<void>;
  renderTemplate(templateId: string, variables: Record<string, string>, options?: TemplateRenderOptions): Promise<TemplateRenderResult>;
  previewTemplate(templateId: string, variables: Record<string, string>): Promise<string>; // preview URL
  cloneTemplate(templateId: string, name: string): Promise<Template>;

  // === Brand Guidelines ===
  createBrandGuideline(guideline: Omit<BrandGuideline, 'id' | 'createdAt' | 'updatedAt'>): Promise<BrandGuideline>;
  getBrandGuideline(guidelineId: string): Promise<BrandGuideline>;
  listBrandGuidelines(): Promise<BrandGuideline[]>;
  updateBrandGuideline(guidelineId: string, updates: Partial<BrandGuideline>): Promise<BrandGuideline>;
  deleteBrandGuideline(guidelineId: string): Promise<void>;
  checkBrandCompliance(assetId: string, guidelineId: string): Promise<BrandComplianceResult>;
  autoFixBrandViolations(assetId: string, guidelineId: string): Promise<{ fixed: number; remaining: number }>;

  // === Creative Workflows ===
  createWorkflow(brief: CreativeBrief, config?: WorkflowConfig): Promise<CreativeWorkflow>;
  getWorkflow(workflowId: string): Promise<CreativeWorkflow>;
  listWorkflows(filters?: WorkflowFilter): Promise<PaginatedResult<CreativeWorkflow>>;
  advanceWorkflow(workflowId: string, stepResult: WorkflowStepResult): Promise<CreativeWorkflow>;
  rejectWorkflowStep(workflowId: string, stepId: string, reason: string): Promise<CreativeWorkflow>;
  addWorkflowComment(workflowId: string, comment: Omit<WorkflowComment, 'id' | 'createdAt'>): Promise<WorkflowComment>;
  addWorkflowAnnotation(workflowId: string, annotation: Omit<WorkflowAnnotation, 'id' | 'createdAt'>): Promise<WorkflowAnnotation>;
  resolveAnnotation(workflowId: string, annotationId: string): Promise<void>;
  assignWorkflowStep(workflowId: string, stepId: string, userId: string): Promise<void>;

  // === Dynamic Creative ===
  createDynamicCreative(config: Omit<DynamicCreative, 'id' | 'variants' | 'createdAt' | 'updatedAt'>): Promise<DynamicCreative>;
  getDynamicCreative(dynamicCreativeId: string): Promise<DynamicCreative>;
  generateVariants(dynamicCreativeId: string, config?: VariantGenerationConfig): Promise<CreativeVariant[]>;
  personalizeCreative(templateId: string, context: PersonalizationContext): Promise<TemplateRenderResult>;
  getVariantPerformance(dynamicCreativeId: string): Promise<CreativeVariant[]>;
  optimizeVariants(dynamicCreativeId: string): Promise<{ promoted: string[]; paused: string[] }>;

  // === Format Adaptation ===
  adaptForPlatform(assetId: string, platform: SupportedPlatform, options?: AdaptationOptions): Promise<FormatAdaptation>;
  adaptForMultiplePlatforms(assetId: string, platforms: SupportedPlatform[]): Promise<FormatAdaptation[]>;
  getPlatformSpec(platform: SupportedPlatform): PlatformFormat;
  listSupportedPlatforms(): PlatformFormat[];

  // === Asset Performance ===
  recordPerformance(assetId: string, metrics: PerformanceMetric, context: PerformanceContext): Promise<AssetPerformance>;
  getPerformance(assetId: string, timeRange?: TimeRange): Promise<AssetPerformance[]>;
  getPerformanceTimeSeries(assetId: string, metric: string, timeRange: TimeRange): Promise<PerformanceTimeSeries[]>;
  detectFatigue(assetId: string): Promise<{ level: FatigueLevel; signals: FatigueSignal[] }>;
  getRefreshRecommendations(campaignId?: string): Promise<RefreshRecommendation[]>;
  getTopPerformingAssets(limit?: number, metric?: string): Promise<Asset[]>;

  // === Rights Management ===
  createRightsRecord(record: Omit<RightsRecord, 'id' | 'isValid' | 'daysUntilExpiration' | 'createdAt' | 'updatedAt'>): Promise<RightsRecord>;
  getRightsRecord(recordId: string): Promise<RightsRecord>;
  getRightsForAsset(assetId: string): Promise<RightsRecord | null>;
  updateRightsRecord(recordId: string, updates: Partial<RightsRecord>): Promise<RightsRecord>;
  validateUsageRights(assetId: string, intendedUse: UsageIntent): Promise<RightsValidationResult>;
  getExpiringRights(withinDays: number): Promise<RightsExpirationAlert[]>;
  generateAttribution(assetIds: string[]): Promise<string>;

  // === AI Generation ===
  generateImage(prompt: AIImagePrompt): Promise<AIGenerationResult>;
  generateCopy(prompt: AICopyPrompt): Promise<AICopyVariation[]>;
  generateHeadlineVariations(headline: string, count?: number): Promise<string[]>;
  suggestVisualImprovements(assetId: string): Promise<AIVisualSuggestion[]>;
  generateCreativeFromBrief(briefId: string): Promise<AIGenerationResult>;

  // === Collaboration ===
  createBrief(brief: Omit<CreativeBrief, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<CreativeBrief>;
  getBrief(briefId: string): Promise<CreativeBrief>;
  listBriefs(filters?: BriefFilter): Promise<PaginatedResult<CreativeBrief>>;
  updateBrief(briefId: string, updates: Partial<CreativeBrief>): Promise<CreativeBrief>;
  addComment(targetType: 'asset' | 'workflow' | 'brief', targetId: string, content: string, mentions?: string[]): Promise<CreativeComment>;
  getComments(targetType: 'asset' | 'workflow' | 'brief', targetId: string): Promise<CommentThread[]>;
  createTask(task: Omit<CreativeTask, 'id' | 'createdAt'>): Promise<CreativeTask>;
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<CreativeTask>;
}

/** Configuration for CreativeService initialization */
interface CreativeServiceConfig {
  /** Tenant identifier (required) */
  tenantId: string;

  /** Supabase client (authenticated) */
  supabase: SupabaseClient;

  /** Supabase Storage client */
  storage: StorageClient;

  /** OpenRouter client for AI features (optional) */
  openRouter?: OpenRouterClient;

  /** Sharp instance configuration */
  sharpConfig?: {
    /** Concurrency limit for image processing */
    concurrency?: number;
    /** Cache size in MB */
    cacheSize?: number;
  };

  /** Default brand guideline ID to use */
  defaultBrandGuidelineId?: string;

  /** Enable automatic brand compliance checking */
  autoBrandCheck?: boolean;

  /** Enable automatic thumbnail generation on upload */
  autoThumbnail?: boolean;

  /** Thumbnail dimensions */
  thumbnailDimensions?: { width: number; height: number };

  /** Preview dimensions */
  previewDimensions?: { width: number; height: number };

  /** Maximum upload size in bytes */
  maxUploadSizeBytes?: number;

  /** Allowed MIME types for upload */
  allowedMimeTypes?: string[];

  /** CDN base URL */
  cdnBaseUrl?: string;

  /** Webhook URL for workflow notifications */
  webhookUrl?: string;
}
```

---

## Database Schemas

### assets

```typescript
import { pgTable, uuid, text, varchar, integer, bigint, jsonb, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const assetsTable = pgTable('creative_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // AssetType enum
  mimeType: varchar('mime_type', { length: 255 }).notNull(),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
  storagePath: text('storage_path').notNull(),
  cdnUrl: text('cdn_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  previewUrl: text('preview_url'),
  dimensions: jsonb('dimensions'), // AssetDimensions
  durationSeconds: integer('duration_seconds'),
  version: integer('version').notNull().default(1),
  status: varchar('status', { length: 30 }).notNull().default('processing'),
  metadata: jsonb('metadata').notNull().default({}), // AssetMetadata
  fileHash: varchar('file_hash', { length: 64 }).notNull(),
  extractedColors: jsonb('extracted_colors'), // string[]
  aiDescription: text('ai_description'),
  uploadedBy: uuid('uploaded_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('idx_creative_assets_tenant').on(table.tenantId),
  typeIdx: index('idx_creative_assets_type').on(table.tenantId, table.type),
  statusIdx: index('idx_creative_assets_status').on(table.tenantId, table.status),
  hashIdx: index('idx_creative_assets_hash').on(table.tenantId, table.fileHash),
  nameSearch: index('idx_creative_assets_name_search').using('gin', table.name),
  createdIdx: index('idx_creative_assets_created').on(table.tenantId, table.createdAt),
  uploadedByIdx: index('idx_creative_assets_uploaded_by').on(table.tenantId, table.uploadedBy),
}));
```

### asset_tags

```typescript
export const assetTagsTable = pgTable('creative_asset_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  assetId: uuid('asset_id').notNull().references(() => assetsTable.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 100 }),
  color: varchar('color', { length: 7 }), // hex
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  assetIdx: index('idx_creative_asset_tags_asset').on(table.assetId),
  tenantNameIdx: index('idx_creative_asset_tags_name').on(table.tenantId, table.name),
  uniqueTag: uniqueIndex('idx_creative_asset_tags_unique').on(table.assetId, table.name),
}));
```

### templates

```typescript
export const templatesTable = pgTable('creative_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(),
  subCategory: varchar('sub_category', { length: 100 }),
  targetPlatforms: jsonb('target_platforms').notNull().default([]), // SupportedPlatform[]
  baseDimensions: jsonb('base_dimensions').notNull(), // { width, height }
  layers: jsonb('layers').notNull().default([]), // TemplateLayer[]
  brandGuidelineId: uuid('brand_guideline_id').references(() => brandGuidelinesTable.id),
  previewUrl: text('preview_url'),
  version: integer('version').notNull().default(1),
  isSystem: integer('is_system').notNull().default(0), // boolean via int
  isPublic: integer('is_public').notNull().default(0),
  usageCount: integer('usage_count').notNull().default(0),
  avgPerformanceScore: integer('avg_performance_score'),
  status: varchar('status', { length: 30 }).notNull().default('draft'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_creative_templates_tenant').on(table.tenantId),
  categoryIdx: index('idx_creative_templates_category').on(table.tenantId, table.category),
  statusIdx: index('idx_creative_templates_status').on(table.tenantId, table.status),
  usageIdx: index('idx_creative_templates_usage').on(table.tenantId, table.usageCount),
}));
```

### template_variables

```typescript
export const templateVariablesTable = pgTable('creative_template_variables', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  templateId: uuid('template_id').notNull().references(() => templatesTable.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 30 }).notNull(), // TemplateVariableType
  defaultValue: text('default_value'),
  required: integer('required').notNull().default(1), // boolean via int
  validation: jsonb('validation'), // VariableValidation
  allowedValues: jsonb('allowed_values'), // string[]
  group: varchar('group', { length: 100 }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  templateIdx: index('idx_creative_template_vars_template').on(table.templateId),
  uniqueVar: uniqueIndex('idx_creative_template_vars_unique').on(table.templateId, table.name),
}));
```

### brand_guidelines

```typescript
export const brandGuidelinesTable = pgTable('creative_brand_guidelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  colorPalette: jsonb('color_palette').notNull(), // BrandColorPalette
  typography: jsonb('typography').notNull().default([]), // BrandTypographyRule[]
  logoRules: jsonb('logo_rules').notNull().default([]), // BrandLogoRule[]
  toneOfVoice: jsonb('tone_of_voice'), // BrandToneOfVoice
  imageryStyle: jsonb('imagery_style'), // BrandImageryStyle
  minContrastRatio: integer('min_contrast_ratio').notNull().default(45), // 4.5 * 10 for int storage
  forbiddenElements: jsonb('forbidden_elements').notNull().default([]), // ForbiddenElement[]
  isPrimary: integer('is_primary').notNull().default(0),
  version: integer('version').notNull().default(1),
  status: varchar('status', { length: 30 }).notNull().default('draft'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_creative_brand_guidelines_tenant').on(table.tenantId),
  primaryIdx: index('idx_creative_brand_guidelines_primary').on(table.tenantId, table.isPrimary),
}));
```

### creative_workflows

```typescript
export const creativeWorkflowsTable = pgTable('creative_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),
  briefId: uuid('brief_id').notNull().references(() => creativeBriefsTable.id),
  assetIds: jsonb('asset_ids').notNull().default([]), // string[]
  templateId: uuid('template_id').references(() => templatesTable.id),
  status: varchar('status', { length: 30 }).notNull().default('draft'),
  currentStepId: uuid('current_step_id'),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'),
  deadline: timestamp('deadline', { withTimezone: true }),
  assignees: jsonb('assignees').notNull().default([]), // WorkflowAssignment[]
  revisionCount: integer('revision_count').notNull().default(0),
  maxRevisions: integer('max_revisions'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('idx_creative_workflows_tenant').on(table.tenantId),
  statusIdx: index('idx_creative_workflows_status').on(table.tenantId, table.status),
  briefIdx: index('idx_creative_workflows_brief').on(table.briefId),
  deadlineIdx: index('idx_creative_workflows_deadline').on(table.tenantId, table.deadline),
  priorityIdx: index('idx_creative_workflows_priority').on(table.tenantId, table.priority),
}));
```

### workflow_steps

```typescript
export const workflowStepsTable = pgTable('creative_workflow_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  workflowId: uuid('workflow_id').notNull().references(() => creativeWorkflowsTable.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // WorkflowStepType
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  sortOrder: integer('sort_order').notNull(),
  assigneeId: uuid('assignee_id'),
  requiredRole: varchar('required_role', { length: 50 }),
  config: jsonb('config').notNull().default({}), // WorkflowStepConfig
  result: jsonb('result'), // WorkflowStepResult
  timeoutHours: integer('timeout_hours'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  workflowIdx: index('idx_creative_workflow_steps_workflow').on(table.workflowId),
  statusIdx: index('idx_creative_workflow_steps_status').on(table.workflowId, table.status),
  assigneeIdx: index('idx_creative_workflow_steps_assignee').on(table.assigneeId),
}));
```

### dynamic_creatives

```typescript
export const dynamicCreativesTable = pgTable('creative_dynamic_creatives', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),
  templateId: uuid('template_id').notNull().references(() => templatesTable.id),
  rules: jsonb('rules').notNull().default([]), // DynamicCreativeRule[]
  personalizationVariables: jsonb('personalization_variables').notNull().default([]), // PersonalizationVariable[]
  maxVariants: integer('max_variants').notNull().default(10),
  variants: jsonb('variants').notNull().default([]), // CreativeVariant[]
  optimizationStrategy: varchar('optimization_strategy', { length: 30 }).notNull().default('none'),
  status: varchar('status', { length: 30 }).notNull().default('draft'),
  campaignId: uuid('campaign_id'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_creative_dynamic_tenant').on(table.tenantId),
  templateIdx: index('idx_creative_dynamic_template').on(table.templateId),
  campaignIdx: index('idx_creative_dynamic_campaign').on(table.campaignId),
  statusIdx: index('idx_creative_dynamic_status').on(table.tenantId, table.status),
}));
```

### format_adaptations

```typescript
export const formatAdaptationsTable = pgTable('creative_format_adaptations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  sourceAssetId: uuid('source_asset_id').notNull().references(() => assetsTable.id),
  platform: varchar('platform', { length: 50 }).notNull(), // SupportedPlatform
  platformFormat: jsonb('platform_format').notNull(), // PlatformFormat
  resizeStrategy: varchar('resize_strategy', { length: 30 }).notNull(),
  cropStrategy: varchar('crop_strategy', { length: 30 }).notNull(),
  resultAssetId: uuid('result_asset_id').notNull().references(() => assetsTable.id),
  resultFileSizeBytes: bigint('result_file_size_bytes', { mode: 'number' }).notNull(),
  qualityScore: integer('quality_score').notNull(),
  warnings: jsonb('warnings').notNull().default([]), // string[]
  needsManualReview: integer('needs_manual_review').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  sourceIdx: index('idx_creative_format_source').on(table.sourceAssetId),
  platformIdx: index('idx_creative_format_platform').on(table.tenantId, table.platform),
}));
```

### asset_performance

```typescript
export const assetPerformanceTable = pgTable('creative_asset_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  assetId: uuid('asset_id').notNull().references(() => assetsTable.id),
  campaignId: uuid('campaign_id'),
  adGroupId: uuid('ad_group_id'),
  platform: varchar('platform', { length: 50 }).notNull(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  granularity: varchar('granularity', { length: 20 }).notNull().default('daily'),
  metrics: jsonb('metrics').notNull(), // PerformanceMetric
  fatigueSignals: jsonb('fatigue_signals').notNull().default([]), // FatigueSignal[]
  fatigueLevel: varchar('fatigue_level', { length: 20 }).notNull().default('fresh'),
  refreshRecommendation: jsonb('refresh_recommendation'), // RefreshRecommendation
  benchmarkComparison: jsonb('benchmark_comparison'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  assetIdx: index('idx_creative_perf_asset').on(table.assetId),
  campaignIdx: index('idx_creative_perf_campaign').on(table.campaignId),
  platformIdx: index('idx_creative_perf_platform').on(table.tenantId, table.platform),
  periodIdx: index('idx_creative_perf_period').on(table.assetId, table.periodStart, table.periodEnd),
  fatigueIdx: index('idx_creative_perf_fatigue').on(table.tenantId, table.fatigueLevel),
}));
```

### rights_records

```typescript
export const rightsRecordsTable = pgTable('creative_rights_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  assetId: uuid('asset_id').notNull().references(() => assetsTable.id),
  licenseType: varchar('license_type', { length: 50 }).notNull(),
  terms: jsonb('terms').notNull(), // LicenseTerms
  usageRights: jsonb('usage_rights').notNull().default([]), // UsageRight[]
  restrictions: jsonb('restrictions').notNull().default([]), // UsageRestriction[]
  modelReleases: jsonb('model_releases').notNull().default([]), // ModelRelease[]
  attribution: jsonb('attribution'), // AttributionRequirement
  source: jsonb('source').notNull(), // AssetSource
  licenseReferenceNumber: varchar('license_reference_number', { length: 255 }),
  cost: jsonb('cost'), // { amount, currency }
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  expirationWarned: integer('expiration_warned').notNull().default(0),
  notes: text('notes'),
  documentAssetIds: jsonb('document_asset_ids').notNull().default([]), // string[]
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  assetIdx: index('idx_creative_rights_asset').on(table.assetId),
  tenantIdx: index('idx_creative_rights_tenant').on(table.tenantId),
  expirationIdx: index('idx_creative_rights_expiration').on(table.tenantId, table.validUntil),
  licenseTypeIdx: index('idx_creative_rights_license_type').on(table.tenantId, table.licenseType),
}));
```

### creative_briefs

```typescript
export const creativeBriefsTable = pgTable('creative_briefs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  objectives: jsonb('objectives').notNull().default([]), // string[]
  targetAudience: text('target_audience').notNull(),
  keyMessages: jsonb('key_messages').notNull().default([]), // string[]
  callToAction: varchar('call_to_action', { length: 255 }),
  platforms: jsonb('platforms').notNull().default([]), // SupportedPlatform[]
  dimensions: jsonb('dimensions').notNull().default([]), // Array<{ width, height, label }>
  brandGuidelineId: uuid('brand_guideline_id').references(() => brandGuidelinesTable.id),
  referenceAssetIds: jsonb('reference_asset_ids').notNull().default([]), // string[]
  toneOfVoice: text('tone_of_voice'),
  deadline: timestamp('deadline', { withTimezone: true }),
  budget: jsonb('budget'), // { amount, currency }
  status: varchar('status', { length: 30 }).notNull().default('draft'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_creative_briefs_tenant').on(table.tenantId),
  statusIdx: index('idx_creative_briefs_status').on(table.tenantId, table.status),
  deadlineIdx: index('idx_creative_briefs_deadline').on(table.tenantId, table.deadline),
}));
```

### RLS Policies

All tables above share a common RLS policy pattern:

```sql
-- Enable RLS on all creative tables
ALTER TABLE creative_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_asset_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_template_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_brand_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_dynamic_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_format_adaptations ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_asset_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_rights_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_briefs ENABLE ROW LEVEL SECURITY;

-- Standard tenant isolation policy (repeated for each table)
CREATE POLICY "creative_assets_tenant_isolation" ON creative_assets
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Read-only policy for system templates
CREATE POLICY "creative_templates_system_read" ON creative_templates
  FOR SELECT
  USING (is_system = 1 OR tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Service role bypass for background jobs
CREATE POLICY "creative_service_role_bypass" ON creative_assets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## Code Examples

### Example 1: Upload and Organize Assets

```typescript
import { CreativeService } from '@mcv/growth/creative';
import { createSupabaseClient } from '@mcv/infra/supabase';

// Initialize the creative service
const supabase = createSupabaseClient({ tenantId: 'org_abc123' });
const creative = new CreativeService({
  tenantId: 'org_abc123',
  supabase,
  storage: supabase.storage,
  autoThumbnail: true,
  thumbnailDimensions: { width: 300, height: 300 },
  previewDimensions: { width: 1200, height: 1200 },
  maxUploadSizeBytes: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/quicktime', 'video/webm',
    'font/ttf', 'font/otf', 'font/woff', 'font/woff2',
    'application/pdf',
  ],
});

// Upload a product photograph
const heroImage = await creative.uploadAsset(productPhotoBuffer, {
  name: 'Summer Collection Hero Shot',
  type: 'photograph',
  description: 'Main hero image for Summer 2026 collection campaign',
  tags: ['summer-2026', 'hero', 'product', 'lifestyle'],
  metadata: {
    custom: {
      photographer: 'Jane Smith',
      shootDate: '2026-01-15',
      location: 'Miami Beach, FL',
    },
  },
});

console.log(`Uploaded: ${heroImage.name}`);
console.log(`CDN URL: ${heroImage.cdnUrl}`);
console.log(`Thumbnail: ${heroImage.thumbnailUrl}`);
console.log(`Dimensions: ${heroImage.dimensions?.width}x${heroImage.dimensions?.height}`);
console.log(`Extracted colors: ${heroImage.extractedColors?.join(', ')}`);

// Upload brand logo variants
const primaryLogo = await creative.uploadAsset(primaryLogoBuffer, {
  name: 'Brand Logo - Primary',
  type: 'logo',
  tags: ['brand', 'logo', 'primary'],
});

const monoLogo = await creative.uploadAsset(monoLogoBuffer, {
  name: 'Brand Logo - Monochrome',
  type: 'logo',
  tags: ['brand', 'logo', 'monochrome'],
});

// Create a collection for the campaign
const collection = await creative.createCollection(
  'Summer 2026 Campaign',
  'All creative assets for the Summer 2026 product launch campaign'
);

// Add assets to the collection
await creative.addToCollection(collection.id, [
  heroImage.id,
  primaryLogo.id,
  monoLogo.id,
]);

// Search assets with filters
const searchResults = await creative.searchAssets('summer hero', {
  type: ['photograph', 'image'],
  status: 'active',
  tags: ['summer-2026'],
  uploadedAfter: new Date('2026-01-01'),
  sortBy: 'relevance',
});

console.log(`Found ${searchResults.total} matching assets`);

// Tag assets in bulk
for (const asset of searchResults.items) {
  await creative.tagAsset(asset.id, ['campaign-approved', 'q2-2026']);
}

// Create a new version of an asset
const updatedHero = await creative.createAssetVersion(
  heroImage.id,
  retouchedPhotoBuffer
);
console.log(`New version: v${updatedHero.version}`);

// List all versions
const versions = await creative.getAssetVersions(heroImage.id);
console.log(`${versions.length} versions available`);

// Restore a previous version if needed
const restored = await creative.restoreAssetVersion(heroImage.id, 1);
```

### Example 2: Template Creation and Rendering

```typescript
import { CreativeService, type Template, type TemplateLayer } from '@mcv/growth/creative';

// Create a social media post template
const template = await creative.createTemplate({
  tenantId: 'org_abc123',
  name: 'Product Launch - Social Post',
  description: 'Template for product launch announcements on social media',
  category: 'social_post',
  subCategory: 'product-launch',
  targetPlatforms: ['instagram_feed', 'facebook_feed', 'linkedin_post'],
  baseDimensions: { width: 1080, height: 1080 },
  layers: [
    // Background layer
    {
      id: 'bg',
      type: 'background',
      name: 'Background',
      zIndex: 0,
      visible: true,
      locked: false,
      opacity: 1,
      bounds: { x: 0, y: 0, width: 1080, height: 1080, rotation: 0 },
      blendMode: 'normal',
      properties: {
        type: 'background',
        fill: { type: 'solid', color: '{{background_color}}' },
      },
      effects: [],
      variableBinding: 'background_color',
    },
    // Product image layer
    {
      id: 'product',
      type: 'image',
      name: 'Product Image',
      zIndex: 1,
      visible: true,
      locked: false,
      opacity: 1,
      bounds: { x: 90, y: 120, width: 900, height: 600, rotation: 0 },
      blendMode: 'normal',
      properties: {
        type: 'image',
        assetId: null,
        src: null,
        fit: 'contain',
        cropArea: null,
        borderRadius: 24,
        border: null,
      },
      effects: [
        {
          type: 'shadow',
          enabled: true,
          properties: { offsetX: 0, offsetY: 8, blur: 24, color: '#00000020' },
        },
      ],
      variableBinding: 'product_image',
    },
    // Headline text layer
    {
      id: 'headline',
      type: 'text',
      name: 'Headline',
      zIndex: 2,
      visible: true,
      locked: false,
      opacity: 1,
      bounds: { x: 90, y: 760, width: 900, height: 120, rotation: 0 },
      blendMode: 'normal',
      properties: {
        type: 'text',
        content: '{{headline}}',
        fontFamily: 'Inter',
        fontSize: 48,
        fontWeight: 700,
        fontStyle: 'normal',
        color: '{{text_color}}',
        textAlign: 'left',
        verticalAlign: 'top',
        lineHeight: 1.2,
        letterSpacing: -0.5,
        textTransform: 'none',
        maxLines: 2,
        overflow: 'ellipsis',
        textShadow: null,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      },
      effects: [],
      variableBinding: 'headline',
    },
    // CTA text layer
    {
      id: 'cta',
      type: 'text',
      name: 'Call to Action',
      zIndex: 3,
      visible: true,
      locked: false,
      opacity: 1,
      bounds: { x: 90, y: 910, width: 400, height: 60, rotation: 0 },
      blendMode: 'normal',
      properties: {
        type: 'text',
        content: '{{cta_text}}',
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: 600,
        fontStyle: 'normal',
        color: '{{cta_color}}',
        textAlign: 'left',
        verticalAlign: 'middle',
        lineHeight: 1.4,
        letterSpacing: 0,
        textTransform: 'uppercase',
        maxLines: 1,
        overflow: 'hidden',
        textShadow: null,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      },
      effects: [],
      variableBinding: 'cta_text',
    },
    // Logo layer
    {
      id: 'logo',
      type: 'logo',
      name: 'Brand Logo',
      zIndex: 4,
      visible: true,
      locked: true,
      opacity: 1,
      bounds: { x: 880, y: 920, width: 120, height: 40, rotation: 0 },
      blendMode: 'normal',
      properties: {
        type: 'logo',
        logoAssetId: primaryLogo.id,
        variant: 'primary',
        minClearSpace: 16,
        maxScale: 1.5,
      },
      effects: [],
      variableBinding: null,
    },
  ],
  variables: [
    {
      name: 'headline',
      label: 'Headline',
      description: 'Main headline text (max 60 characters)',
      type: 'text',
      defaultValue: 'Introducing Our Latest Collection',
      required: true,
      validation: { maxLength: 60, message: 'Headline must be 60 characters or fewer' },
      allowedValues: null,
      group: 'Content',
      order: 1,
    },
    {
      name: 'product_image',
      label: 'Product Image',
      description: 'Main product image (asset ID)',
      type: 'image',
      defaultValue: null,
      required: true,
      validation: null,
      allowedValues: null,
      group: 'Content',
      order: 2,
    },
    {
      name: 'cta_text',
      label: 'Call to Action',
      description: 'CTA button text',
      type: 'text',
      defaultValue: 'Shop Now',
      required: true,
      validation: { maxLength: 20 },
      allowedValues: null,
      group: 'Content',
      order: 3,
    },
    {
      name: 'background_color',
      label: 'Background Color',
      description: 'Background color (hex)',
      type: 'color',
      defaultValue: '#F8F9FA',
      required: false,
      validation: null,
      allowedValues: null,
      group: 'Style',
      order: 4,
    },
    {
      name: 'text_color',
      label: 'Text Color',
      description: 'Headline text color (hex)',
      type: 'color',
      defaultValue: '#1A1A2E',
      required: false,
      validation: null,
      allowedValues: null,
      group: 'Style',
      order: 5,
    },
    {
      name: 'cta_color',
      label: 'CTA Color',
      description: 'CTA text color (hex)',
      type: 'color',
      defaultValue: '#E63946',
      required: false,
      validation: null,
      allowedValues: null,
      group: 'Style',
      order: 6,
    },
  ],
  brandGuidelineId: null,
  previewUrl: null,
  version: 1,
  isSystem: false,
  isPublic: false,
  usageCount: 0,
  avgPerformanceScore: null,
  status: 'active',
  createdBy: 'user_designer01',
});

// Render the template with variables
const rendered = await creative.renderTemplate(template.id, {
  headline: 'Summer Vibes Collection',
  product_image: heroImage.id,
  cta_text: 'Shop Now',
  background_color: '#FFF8E7',
  text_color: '#2D3436',
  cta_color: '#E17055',
}, {
  format: 'png',
  quality: 95,
  platform: 'instagram_feed',
});

console.log(`Rendered asset ID: ${rendered.assetId}`);
console.log(`File size: ${(rendered.fileSizeBytes / 1024).toFixed(1)} KB`);
console.log(`CDN URL: ${rendered.cdnUrl}`);

// Preview the template with different variables (returns a URL without saving)
const previewUrl = await creative.previewTemplate(template.id, {
  headline: 'New Arrivals Are Here',
  product_image: heroImage.id,
  cta_text: 'Explore',
});
```

### Example 3: Brand Guidelines and Compliance Checking

```typescript
import { CreativeService, type BrandGuideline, type BrandComplianceResult } from '@mcv/growth/creative';

// Create brand guidelines
const brandGuideline = await creative.createBrandGuideline({
  tenantId: 'org_abc123',
  name: 'Acme Corp Brand Guidelines v3',
  description: 'Official brand guidelines for all Acme Corp marketing materials',
  colorPalette: {
    primary: [
      {
        name: 'Acme Blue',
        hex: '#1A56DB',
        rgb: { r: 26, g: 86, b: 219 },
        hsl: { h: 221, s: 79, l: 48 },
        cmyk: { c: 88, m: 61, y: 0, k: 14 },
        pantone: 'PMS 2728 C',
        tolerance: 3.0,
        usageContext: ['background', 'cta', 'accent'],
      },
      {
        name: 'Acme Navy',
        hex: '#0F172A',
        rgb: { r: 15, g: 23, b: 42 },
        hsl: { h: 222, s: 47, l: 11 },
        cmyk: null,
        pantone: null,
        tolerance: 2.0,
        usageContext: ['text', 'background'],
      },
    ],
    secondary: [
      {
        name: 'Coral',
        hex: '#E63946',
        rgb: { r: 230, g: 57, b: 70 },
        hsl: { h: 355, s: 78, l: 56 },
        cmyk: null,
        pantone: null,
        tolerance: 5.0,
        usageContext: ['accent', 'cta'],
      },
      {
        name: 'Mint',
        hex: '#2EC4B6',
        rgb: { r: 46, g: 196, b: 182 },
        hsl: { h: 174, s: 62, l: 47 },
        cmyk: null,
        pantone: null,
        tolerance: 5.0,
        usageContext: ['accent', 'background'],
      },
    ],
    neutrals: [
      {
        name: 'Slate 50',
        hex: '#F8FAFC',
        rgb: { r: 248, g: 250, b: 252 },
        hsl: { h: 210, s: 40, l: 98 },
        cmyk: null,
        pantone: null,
        tolerance: 5.0,
        usageContext: ['background'],
      },
      {
        name: 'Slate 700',
        hex: '#334155',
        rgb: { r: 51, g: 65, b: 85 },
        hsl: { h: 215, s: 25, l: 27 },
        cmyk: null,
        pantone: null,
        tolerance: 3.0,
        usageContext: ['text'],
      },
    ],
    backgrounds: [],
    text: [],
    forbidden: ['#FF0000', '#00FF00', '#FFFF00'], // Pure RGB primaries look cheap
    maxColorsPerCreative: 5,
    requiredCombinations: [
      {
        description: 'Coral CTA must appear on Acme Blue or Navy background',
        ifColor: '#E63946',
        thenRequire: '#1A56DB',
        context: 'cta_on_background',
      },
    ],
  },
  typography: [
    {
      name: 'Heading',
      context: 'heading',
      allowedFontFamilies: ['Inter', 'Plus Jakarta Sans'],
      fallbackFonts: ['system-ui', 'sans-serif'],
      fontSize: { min: 28, max: 72, preferred: 48, unit: 'px' },
      allowedWeights: [600, 700, 800],
      lineHeight: { min: 1.1, max: 1.3, preferred: 1.2 },
      letterSpacing: { min: -1, max: 0, preferred: -0.5, unit: 'px' },
      allowedTransforms: ['none', 'uppercase'],
      maxLineLength: 40,
    },
    {
      name: 'Body',
      context: 'body',
      allowedFontFamilies: ['Inter', 'Plus Jakarta Sans'],
      fallbackFonts: ['system-ui', 'sans-serif'],
      fontSize: { min: 14, max: 24, preferred: 16, unit: 'px' },
      allowedWeights: [400, 500],
      lineHeight: { min: 1.4, max: 1.8, preferred: 1.6 },
      letterSpacing: { min: 0, max: 0.5, preferred: 0, unit: 'px' },
      allowedTransforms: ['none'],
      maxLineLength: 80,
    },
    {
      name: 'CTA',
      context: 'cta',
      allowedFontFamilies: ['Inter'],
      fallbackFonts: ['system-ui', 'sans-serif'],
      fontSize: { min: 14, max: 28, preferred: 18, unit: 'px' },
      allowedWeights: [600, 700],
      lineHeight: { min: 1.2, max: 1.4, preferred: 1.3 },
      letterSpacing: { min: 0, max: 2, preferred: 1, unit: 'px' },
      allowedTransforms: ['uppercase'],
      maxLineLength: 25,
    },
  ],
  logoRules: [
    {
      variant: 'primary',
      assetId: primaryLogo.id,
      minClearSpacePercent: 25,
      minSizePx: { width: 80, height: 28 },
      maxSizePx: null,
      allowedBackgrounds: ['#FFFFFF', '#F8FAFC', '#0F172A', '#1A56DB'],
      forbiddenBackgrounds: ['#E63946', '#FF0000'],
      allowRotation: false,
      allowCropping: false,
      allowEffects: false,
      allowRecoloring: false,
    },
    {
      variant: 'monochrome',
      assetId: monoLogo.id,
      minClearSpacePercent: 25,
      minSizePx: { width: 60, height: 20 },
      maxSizePx: null,
      allowedBackgrounds: ['#FFFFFF', '#F8FAFC', '#0F172A'],
      forbiddenBackgrounds: [],
      allowRotation: false,
      allowCropping: false,
      allowEffects: false,
      allowRecoloring: true,
    },
  ],
  toneOfVoice: {
    toneDescriptors: ['confident', 'approachable', 'innovative', 'clear'],
    preferredVocabulary: [
      'discover', 'explore', 'transform', 'elevate', 'empower',
      'seamless', 'effortless', 'intelligent', 'modern', 'premium',
    ],
    avoidVocabulary: [
      'cheap', 'best ever', 'guaranteed', 'revolutionary',
      'synergy', 'leverage', 'disrupt', 'game-changing',
    ],
    styleRules: [
      'Use active voice',
      'Keep sentences under 20 words',
      'Avoid jargon and buzzwords',
      'Address the reader directly with "you"',
      'Lead with benefits, not features',
    ],
    examples: [
      {
        context: 'Product headline',
        good: 'Design that works as hard as you do',
        bad: 'Revolutionary game-changing product!!!',
      },
      {
        context: 'CTA',
        good: 'Start your free trial',
        bad: 'Click here now!!! Limited time offer!!!',
      },
    ],
    maxReadingLevel: 8,
  },
  imageryStyle: {
    photographyStyle: ['natural lighting', 'candid moments', 'diverse subjects', 'modern settings'],
    illustrationStyle: ['flat design', 'clean lines', 'brand color palette only'],
    colorGrading: ['warm undertones', 'slightly desaturated', 'consistent across sets'],
    forbiddenThemes: ['violence', 'exclusion', 'environmental damage'],
    requiredAttributes: ['diverse representation', 'authentic emotion', 'modern context'],
  },
  minContrastRatio: 4.5,
  forbiddenElements: [
    {
      type: 'font',
      value: 'Comic Sans MS',
      reason: 'Unprofessional and off-brand',
    },
    {
      type: 'phrase',
      value: 'best in class',
      reason: 'Unsubstantiated claim',
    },
    {
      type: 'competitor_reference',
      value: 'competitor-logo-pattern',
      reason: 'No competitor references in our materials',
    },
  ],
  isPrimary: true,
  version: 3,
  status: 'active',
  createdBy: 'user_brand_manager01',
});

// Check brand compliance on a rendered creative
const complianceResult: BrandComplianceResult = await creative.checkBrandCompliance(
  rendered.assetId,
  brandGuideline.id
);

console.log(`Brand compliant: ${complianceResult.compliant}`);
console.log(`Compliance score: ${complianceResult.score}/100`);

if (!complianceResult.compliant) {
  console.log('\nViolations:');
  for (const violation of complianceResult.violations) {
    console.log(`  [${violation.severity}] ${violation.message}`);
    console.log(`    Location: ${violation.location}`);
    console.log(`    Actual: ${violation.actual}`);
    console.log(`    Expected: ${violation.expected}`);
    if (violation.suggestion) {
      console.log(`    Suggestion: ${violation.suggestion}`);
    }
    if (violation.autoFixable) {
      console.log(`    ✅ Can be auto-fixed`);
    }
  }

  // Auto-fix what we can
  const fixResult = await creative.autoFixBrandViolations(
    rendered.assetId,
    brandGuideline.id
  );
  console.log(`\nAuto-fixed ${fixResult.fixed} violations, ${fixResult.remaining} require manual attention`);
}
```

### Example 4: Creative Workflow Pipeline

```typescript
import { CreativeService, type CreativeBrief, type CreativeWorkflow } from '@mcv/growth/creative';

// Step 1: Create a creative brief
const brief = await creative.createBrief({
  tenantId: 'org_abc123',
  title: 'Summer 2026 Product Launch Campaign',
  description: `Create a multi-platform campaign for the Summer 2026 collection launch.
    The campaign should emphasize the new sustainable materials and vibrant color palette.
    Target demographics: Millennials and Gen Z, urban professionals.`,
  objectives: [
    'Drive awareness of new Summer 2026 collection',
    'Highlight sustainability features',
    'Generate pre-orders through social channels',
    'Achieve 3% CTR on paid social ads',
  ],
  targetAudience: 'Millennials and Gen Z (25-40), urban professionals, sustainability-conscious consumers',
  keyMessages: [
    'Sustainable materials, zero compromises on style',
    'Designed for the modern urban lifestyle',
    'Premium quality at accessible prices',
  ],
  callToAction: 'Pre-order Now — Free Shipping',
  platforms: ['instagram_feed', 'instagram_story', 'facebook_feed', 'linkedin_post'],
  dimensions: [
    { width: 1080, height: 1080, label: 'Square (Feed)' },
    { width: 1080, height: 1920, label: 'Story/Vertical' },
    { width: 1200, height: 628, label: 'Landscape (Facebook/LinkedIn)' },
  ],
  brandGuidelineId: brandGuideline.id,
  referenceAssetIds: [heroImage.id],
  toneOfVoice: 'Confident, approachable, sustainability-forward',
  deadline: new Date('2026-03-01'),
  budget: { amount: 5000, currency: 'USD' },
  createdBy: 'user_marketing_lead01',
});

// Step 2: Create a workflow from the brief
const workflow = await creative.createWorkflow(brief, {
  steps: [
    { name: 'Brief Approval', type: 'brief_approval', requiredRole: 'marketing_lead', timeoutHours: 24 },
    { name: 'Design', type: 'design', requiredRole: 'designer', timeoutHours: 72 },
    { name: 'Brand Compliance', type: 'brand_compliance_check', config: { autoAdvanceOnCompliance: true } },
    { name: 'Internal Review', type: 'internal_review', config: { minApprovals: 2 } },
    { name: 'Client Review', type: 'client_review', config: { minApprovals: 1 } },
    { name: 'Format Adaptation', type: 'format_adaptation', config: { targetPlatforms: brief.platforms } },
    { name: 'Final Approval', type: 'final_approval', requiredRole: 'marketing_lead' },
    { name: 'Publish', type: 'publish' },
  ],
  maxRevisions: 3,
  notifyOnTransition: true,
});

console.log(`Workflow created: ${workflow.id}`);
console.log(`Status: ${workflow.status}`);
console.log(`Steps: ${workflow.steps.length}`);
console.log(`Current step: ${workflow.steps.find(s => s.id === workflow.currentStepId)?.name}`);

// Step 3: Approve the brief
const afterBriefApproval = await creative.advanceWorkflow(workflow.id, {
  status: 'approved',
  notes: 'Brief looks great. Proceed with design.',
  decidedBy: 'user_marketing_lead01',
  decidedAt: new Date(),
});
console.log(`Workflow advanced to: ${afterBriefApproval.status}`); // 'in_design'

// Step 4: Designer uploads the creative and advances
// (after design work is done)
const designedAsset = await creative.uploadAsset(designFileBuffer, {
  name: 'Summer 2026 - Instagram Feed - v1',
  type: 'image',
  tags: ['summer-2026', 'instagram', 'feed', 'draft'],
});

// Add the asset to the workflow
await creative.advanceWorkflow(workflow.id, {
  status: 'completed',
  notes: 'Design complete. Ready for review.',
  decidedBy: 'user_designer01',
  decidedAt: new Date(),
});

// Step 5: Add review comments with annotations
await creative.addWorkflowComment(workflow.id, {
  workflowId: workflow.id,
  stepId: workflow.currentStepId,
  authorId: 'user_reviewer01',
  authorName: 'Sarah Chen',
  content: 'Love the overall direction! A few tweaks needed — see annotations.',
  mentions: [],
  attachmentIds: [],
  parentCommentId: null,
  updatedAt: new Date(),
  deletedAt: null,
});

// Add visual annotations on the creative
await creative.addWorkflowAnnotation(workflow.id, {
  workflowId: workflow.id,
  assetId: designedAsset.id,
  authorId: 'user_reviewer01',
  position: { x: 45, y: 82, width: 30, height: 8 },
  content: 'CTA text feels small. Can we bump to 28px?',
  type: 'change_request',
  resolved: false,
  resolvedBy: null,
});

// Step 6: Reject for changes
const afterReject = await creative.rejectWorkflowStep(
  workflow.id,
  workflow.currentStepId,
  'Minor revisions needed — see annotations above.'
);
console.log(`Status: ${afterReject.status}`); // 'changes_requested'
console.log(`Revision count: ${afterReject.revisionCount}`); // 1

// Step 7: After designer makes changes, resolve annotations and resubmit
await creative.resolveAnnotation(workflow.id, 'annotation_id_here');

// Continue through remaining steps until published...
```

### Example 5: Dynamic Creative and Personalization

```typescript
import { CreativeService, type DynamicCreative, type CreativeVariant } from '@mcv/growth/creative';

// Create a dynamic creative configuration
const dynamicCreative = await creative.createDynamicCreative({
  tenantId: 'org_abc123',
  name: 'Summer 2026 - Personalized Feed Ads',
  description: 'Dynamic creative that adapts headline, image, and CTA based on audience segment',
  templateId: template.id,
  rules: [
    // Rule 1: Different headline for sustainability-focused audience
    {
      id: 'rule_headline_eco',
      name: 'Eco-conscious headline',
      targetVariable: 'headline',
      condition: {
        type: 'audience_segment',
        operator: 'equals',
        field: 'segment',
        value: 'eco_conscious',
      },
      value: 'Sustainable Style, Effortless Wear',
      priority: 10,
      enabled: true,
    },
    // Rule 2: Different headline for fashion-forward audience
    {
      id: 'rule_headline_fashion',
      name: 'Fashion-forward headline',
      targetVariable: 'headline',
      condition: {
        type: 'audience_segment',
        operator: 'equals',
        field: 'segment',
        value: 'fashion_forward',
      },
      value: 'The Collection Everyone Will Be Wearing',
      priority: 10,
      enabled: true,
    },
    // Rule 3: Different CTA for retargeting audience
    {
      id: 'rule_cta_retarget',
      name: 'Retargeting CTA',
      targetVariable: 'cta_text',
      condition: {
        type: 'audience_segment',
        operator: 'equals',
        field: 'segment',
        value: 'retargeting',
      },
      value: 'Complete Your Order',
      priority: 20,
      enabled: true,
    },
    // Rule 4: Geo-based background color
    {
      id: 'rule_bg_warm',
      name: 'Warm climate background',
      targetVariable: 'background_color',
      condition: {
        type: 'geo',
        operator: 'in',
        field: 'climate_zone',
        value: ['tropical', 'subtropical'],
      },
      value: '#FFF8E7',
      priority: 5,
      enabled: true,
    },
    // Rule 5: Cool climate background
    {
      id: 'rule_bg_cool',
      name: 'Cool climate background',
      targetVariable: 'background_color',
      condition: {
        type: 'geo',
        operator: 'in',
        field: 'climate_zone',
        value: ['temperate', 'continental'],
      },
      value: '#E8F4FD',
      priority: 5,
      enabled: true,
    },
  ],
  personalizationVariables: [
    {
      name: 'headline',
      label: 'Headline',
      type: 'text',
      source: 'rule',
      defaultValue: 'Summer Vibes Collection',
      variants: [
        { value: 'Sustainable Style, Effortless Wear', label: 'Eco-conscious', condition: 'Eco-conscious segment' },
        { value: 'The Collection Everyone Will Be Wearing', label: 'Fashion-forward', condition: 'Fashion-forward segment' },
        { value: 'Summer Vibes Collection', label: 'Default', condition: null },
      ],
    },
    {
      name: 'cta_text',
      label: 'Call to Action',
      type: 'text',
      source: 'rule',
      defaultValue: 'Shop Now',
      variants: [
        { value: 'Complete Your Order', label: 'Retargeting', condition: 'Retargeting segment' },
        { value: 'Pre-order Now', label: 'Pre-launch', condition: 'Pre-launch period' },
        { value: 'Shop Now', label: 'Default', condition: null },
      ],
    },
    {
      name: 'background_color',
      label: 'Background Color',
      type: 'color',
      source: 'rule',
      defaultValue: '#F8F9FA',
      variants: [
        { value: '#FFF8E7', label: 'Warm', condition: 'Tropical/subtropical regions' },
        { value: '#E8F4FD', label: 'Cool', condition: 'Temperate/continental regions' },
        { value: '#F8F9FA', label: 'Neutral', condition: null },
      ],
    },
  ],
  maxVariants: 12,
  optimizationStrategy: 'ctr',
  status: 'draft',
  campaignId: 'campaign_summer2026',
  createdBy: 'user_marketing_lead01',
});

// Generate all variant combinations
const variants: CreativeVariant[] = await creative.generateVariants(dynamicCreative.id, {
  generateAll: true,
  renderImmediately: true,
  format: 'png',
  quality: 90,
});

console.log(`Generated ${variants.length} variants:`);
for (const variant of variants) {
  console.log(`  ${variant.name}: ${JSON.stringify(variant.variableValues)}`);
  console.log(`    Preview: ${variant.previewUrl}`);
}

// Personalize a creative for a specific user context
const personalized = await creative.personalizeCreative(template.id, {
  audienceSegment: 'eco_conscious',
  geo: { country: 'US', state: 'CA', climateZone: 'subtropical' },
  device: 'mobile',
  timeOfDay: 'morning',
  userData: {
    firstName: 'Alex',
    previousPurchases: 3,
  },
});

console.log(`Personalized creative URL: ${personalized.cdnUrl}`);

// After campaign runs, check variant performance
const variantPerformance = await creative.getVariantPerformance(dynamicCreative.id);
for (const v of variantPerformance) {
  if (v.performanceMetrics) {
    console.log(`${v.name}: CTR ${(v.performanceMetrics.ctr * 100).toFixed(2)}%, ` +
                `Conv ${(v.performanceMetrics.conversionRate * 100).toFixed(2)}%`);
  }
}

// Optimize: promote top performers, pause underperformers
const optimization = await creative.optimizeVariants(dynamicCreative.id);
console.log(`Promoted: ${optimization.promoted.length} variants`);
console.log(`Paused: ${optimization.paused.length} variants`);
```

### Example 6: Format Adaptation for Multiple Platforms

```typescript
import { CreativeService, type FormatAdaptation, type PlatformFormat } from '@mcv/growth/creative';

// List all supported platform formats
const platforms = creative.listSupportedPlatforms();
console.log(`${platforms.length} platform formats supported:`);
for (const p of platforms) {
  console.log(`  ${p.platform}: ${p.dimensions.width}×${p.dimensions.height} (${p.aspectRatio})`);
}

// Get specs for a specific platform
const igStorySpec: PlatformFormat = creative.getPlatformSpec('instagram_story');
console.log(`Instagram Story: ${igStorySpec.dimensions.width}×${igStorySpec.dimensions.height}`);
console.log(`  Safe zone: T${igStorySpec.safeZone.top} R${igStorySpec.safeZone.right} B${igStorySpec.safeZone.bottom} L${igStorySpec.safeZone.left}`);
console.log(`  Max file size: ${(igStorySpec.maxFileSizeBytes / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Allowed formats: ${igStorySpec.allowedFormats.join(', ')}`);

// Adapt a single asset for one platform
const igFeedAdaptation: FormatAdaptation = await creative.adaptForPlatform(
  heroImage.id,
  'instagram_feed',
  {
    resizeStrategy: 'smart_crop',
    cropStrategy: 'attention',
    outputFormat: 'jpeg',
    quality: 85,
    preserveText: true, // AI-aware: don't crop over text regions
  }
);

console.log(`Adapted for Instagram Feed:`);
console.log(`  Result asset: ${igFeedAdaptation.resultAssetId}`);
console.log(`  Quality score: ${igFeedAdaptation.qualityScore}/100`);
console.log(`  File size: ${(igFeedAdaptation.resultFileSizeBytes / 1024).toFixed(1)} KB`);
if (igFeedAdaptation.warnings.length > 0) {
  console.log(`  Warnings: ${igFeedAdaptation.warnings.join('; ')}`);
}
if (igFeedAdaptation.needsManualReview) {
  console.log(`  ⚠️ Manual review recommended`);
}

// Adapt for multiple platforms at once
const allAdaptations: FormatAdaptation[] = await creative.adaptForMultiplePlatforms(
  heroImage.id,
  [
    'instagram_feed',
    'instagram_story',
    'facebook_feed',
    'facebook_story',
    'linkedin_post',
    'twitter_post',
    'youtube_thumbnail',
    'email_header',
    'og_image',
  ]
);

console.log(`\nGenerated ${allAdaptations.length} platform adaptations:`);
for (const adaptation of allAdaptations) {
  const status = adaptation.needsManualReview ? '⚠️' : '✅';
  console.log(`  ${status} ${adaptation.platform}: ` +
              `${adaptation.qualityScore}/100 quality, ` +
              `${(adaptation.resultFileSizeBytes / 1024).toFixed(0)} KB`);
}

// Find adaptations that need manual review
const needsReview = allAdaptations.filter(a => a.needsManualReview);
if (needsReview.length > 0) {
  console.log(`\n${needsReview.length} adaptations need manual review:`);
  for (const a of needsReview) {
    console.log(`  ${a.platform}: ${a.warnings.join('; ')}`);
  }
}
```

### Example 7: Asset Performance Tracking and Fatigue Detection

```typescript
import { CreativeService, type AssetPerformance, type FatigueLevel } from '@mcv/growth/creative';

// Record performance data (typically called by campaign sync jobs)
await creative.recordPerformance(heroImage.id, {
  impressions: 145200,
  clicks: 4356,
  conversions: 218,
  spend: 1250.00,
  revenue: 8720.00,
  ctr: 0.03,
  conversionRate: 0.05,
  cpc: 0.287,
  cpa: 5.73,
  roas: 6.976,
  engagementRate: 0.045,
  engagement: {
    likes: 3200,
    comments: 180,
    shares: 420,
    saves: 890,
    videoViews: 0,
    videoCompletions: 0,
    profileVisits: 320,
    websiteClicks: 4356,
  },
  qualityScore: 8,
  relevanceScore: 7,
}, {
  campaignId: 'campaign_summer2026',
  adGroupId: 'adgroup_ig_feed',
  platform: 'instagram_feed',
  period: {
    start: new Date('2026-02-01'),
    end: new Date('2026-02-07'),
    granularity: 'daily',
  },
});

// Get performance for an asset over time
const performance = await creative.getPerformance(heroImage.id, {
  start: new Date('2026-01-15'),
  end: new Date('2026-02-09'),
});

console.log(`Performance records: ${performance.length}`);
for (const p of performance) {
  console.log(`  ${p.platform} (${p.period.start.toISOString().slice(0, 10)}): ` +
              `CTR ${(p.metrics.ctr * 100).toFixed(2)}%, ROAS ${p.metrics.roas.toFixed(2)}x`);
}

// Get time series for a specific metric (for charting)
const ctrTimeSeries = await creative.getPerformanceTimeSeries(
  heroImage.id,
  'ctr',
  { start: new Date('2026-01-15'), end: new Date('2026-02-09') }
);

console.log('\nCTR over time:');
for (const point of ctrTimeSeries) {
  const bar = '█'.repeat(Math.round(point.value * 1000));
  console.log(`  ${point.timestamp.toISOString().slice(0, 10)}: ${bar} ${(point.value * 100).toFixed(2)}%`);
}

// Detect creative fatigue
const fatigue = await creative.detectFatigue(heroImage.id);
console.log(`\nFatigue level: ${fatigue.level}`);

if (fatigue.signals.length > 0) {
  console.log('Fatigue signals:');
  for (const signal of fatigue.signals) {
    console.log(`  [${signal.severity}] ${signal.type}: ${signal.description}`);
    console.log(`    Baseline: ${signal.baselineValue} → Current: ${signal.currentValue} (${signal.changePercent > 0 ? '+' : ''}${signal.changePercent.toFixed(1)}%)`);
  }
}

// Get refresh recommendations across a campaign
const recommendations = await creative.getRefreshRecommendations('campaign_summer2026');
console.log(`\n${recommendations.length} refresh recommendations:`);
for (const rec of recommendations) {
  console.log(`  [${rec.urgency}] ${rec.reason}`);
  console.log(`    Actions: ${rec.suggestedActions.join('; ')}`);
  console.log(`    Impact: ${rec.estimatedImpact}`);
  if (rec.alternativeAssetIds.length > 0) {
    console.log(`    Alternatives: ${rec.alternativeAssetIds.length} existing assets available`);
  }
}

// Get top-performing assets
const topPerformers = await creative.getTopPerformingAssets(5, 'roas');
console.log('\nTop 5 assets by ROAS:');
for (const asset of topPerformers) {
  console.log(`  ${asset.name} (${asset.id})`);
}
```

### Example 8: AI-Powered Creative Generation

```typescript
import { CreativeService, type AIGenerationResult, type AICopyVariation } from '@mcv/growth/creative';

// Initialize with OpenRouter for AI features
const creativeWithAI = new CreativeService({
  tenantId: 'org_abc123',
  supabase,
  storage: supabase.storage,
  openRouter: openRouterClient,
});

// Generate an image from a text prompt
const aiImage: AIGenerationResult = await creativeWithAI.generateImage({
  prompt: 'A flat-lay product photography setup with sustainable fashion items on a light wooden surface, warm natural lighting, minimalist aesthetic, shot from above, soft shadows',
  negativePrompt: 'text, watermark, logo, cluttered, dark, artificial lighting',
  style: 'photographic',
  dimensions: { width: 1080, height: 1080 },
  model: 'stability/stable-diffusion-xl',
  count: 4, // generate 4 variations
  seed: null, // random
});

console.log(`Generated ${aiImage.outputs.length} images:`);
for (const output of aiImage.outputs) {
  console.log(`  ${output.cdnUrl} (${output.confidenceScore}/100 confidence)`);
}

// Save the best AI-generated image to the asset library
const bestOutput = aiImage.outputs.sort((a, b) => b.confidenceScore - a.confidenceScore)[0];
const aiAsset = await creativeWithAI.uploadAsset(bestOutput.buffer, {
  name: 'AI Generated - Summer Product Flat Lay',
  type: 'image',
  tags: ['ai-generated', 'summer-2026', 'flat-lay', 'product'],
  metadata: {
    custom: {
      aiModel: 'stability/stable-diffusion-xl',
      aiPrompt: aiImage.prompt,
      aiSeed: String(bestOutput.seed),
    },
  },
});

// Generate copy variations for ad headlines
const headlineVariations: string[] = await creativeWithAI.generateHeadlineVariations(
  'Summer Vibes Collection — Shop Now',
  8 // generate 8 variations
);

console.log('\nHeadline variations:');
for (const [i, headline] of headlineVariations.entries()) {
  console.log(`  ${i + 1}. ${headline}`);
}
// Output:
//   1. Your Summer, Elevated — Discover the Collection
//   2. Sustainable Summer Style Starts Here
//   3. Where Comfort Meets Coastal Cool
//   4. The Summer Edit: New Arrivals Are Here
//   5. Effortless Summer. Premium Materials.
//   6. Made for Sun-Soaked Days Ahead
//   7. This Summer's Must-Have Collection
//   8. Sun, Style, Sustainability — All In One

// Generate full ad copy with multiple components
const adCopy: AICopyVariation[] = await creativeWithAI.generateCopy({
  objective: 'Drive pre-orders for the Summer 2026 collection',
  targetAudience: 'Millennials and Gen Z, sustainability-conscious, urban professionals',
  product: 'Sustainable fashion collection — organic cotton, recycled materials, modern designs',
  tone: 'confident, approachable, sustainability-forward',
  platform: 'instagram_feed',
  components: ['headline', 'body', 'cta'],
  constraints: {
    headline: { maxLength: 40 },
    body: { maxLength: 125 },
    cta: { maxLength: 20 },
  },
  count: 5,
  brandGuidelineId: brandGuideline.id, // enforce tone of voice
});

console.log('\nAd copy variations:');
for (const variation of adCopy) {
  console.log(`\n  Variation ${variation.index}:`);
  console.log(`    Headline: ${variation.components.headline}`);
  console.log(`    Body: ${variation.components.body}`);
  console.log(`    CTA: ${variation.components.cta}`);
  console.log(`    Tone match: ${variation.toneMatchScore}/100`);
}

// Get AI suggestions for improving an existing creative
const suggestions = await creativeWithAI.suggestVisualImprovements(designedAsset.id);
console.log(`\n${suggestions.length} visual improvement suggestions:`);
for (const suggestion of suggestions) {
  console.log(`  [${suggestion.category}] ${suggestion.description}`);
  console.log(`    Impact: ${suggestion.estimatedImpact}`);
  console.log(`    Effort: ${suggestion.effort}`);
  if (suggestion.exampleUrl) {
    console.log(`    Example: ${suggestion.exampleUrl}`);
  }
}

// Generate a complete creative from a brief using AI
const aiCreative = await creativeWithAI.generateCreativeFromBrief(brief.id);
console.log(`\nAI-generated creative from brief:`);
console.log(`  Asset: ${aiCreative.assetId}`);
console.log(`  Template used: ${aiCreative.templateId}`);
console.log(`  Variables: ${JSON.stringify(aiCreative.variableValues)}`);
console.log(`  CDN URL: ${aiCreative.cdnUrl}`);
console.log(`  Confidence: ${aiCreative.confidenceScore}/100`);
```

---

## Error Codes

All errors in this module extend the base `CreativeError` class and include a machine-readable `code`, a human-readable `message`, and optional `details` with contextual data.

```typescript
class CreativeError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, statusCode: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'CreativeError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
```

### Asset Errors

| Code | HTTP | Class | Description |
|------|------|-------|-------------|
| `ASSET_NOT_FOUND` | 404 | `AssetNotFoundError` | The requested asset does not exist or has been deleted. |
| `ASSET_UPLOAD_FAILED` | 500 | `AssetUploadError` | File upload to Supabase Storage failed. Check storage permissions and bucket configuration. |
| `ASSET_TOO_LARGE` | 413 | `AssetTooLargeError` | File exceeds the maximum upload size (`maxUploadSizeBytes`). Default limit: 50 MB. |
| `ASSET_FORMAT_UNSUPPORTED` | 415 | `AssetFormatUnsupportedError` | The file MIME type is not in the allowed list. Check `allowedMimeTypes` configuration. |
| `ASSET_VERSION_CONFLICT` | 409 | `AssetVersionConflictError` | Concurrent version creation detected. Retry with the latest version number. |
| `ASSET_PROCESSING_FAILED` | 500 | `AssetProcessingError` | Thumbnail generation, metadata extraction, or color extraction failed during post-upload processing. |
| `ASSET_HASH_DUPLICATE` | 409 | `AssetDuplicateError` | An asset with the same file hash already exists in this tenant. Returns the existing asset ID in `details`. |

### Template Errors

| Code | HTTP | Class | Description |
|------|------|-------|-------------|
| `TEMPLATE_NOT_FOUND` | 404 | `TemplateNotFoundError` | The requested template does not exist or is not accessible to this tenant. |
| `TEMPLATE_RENDER_FAILED` | 500 | `TemplateRenderError` | Template rendering failed. Common causes: missing fonts, corrupted layer data, or Sharp processing errors. |
| `TEMPLATE_VARIABLE_MISSING` | 400 | `TemplateVariableMissingError` | A required template variable was not provided. The `details` field lists missing variable names. |
| `TEMPLATE_VARIABLE_INVALID` | 400 | `TemplateVariableInvalidError` | A template variable failed validation. The `details` field includes the variable name, provided value, and validation rule. |
| `TEMPLATE_LAYER_INVALID` | 400 | `TemplateLayerInvalidError` | A template layer definition is malformed. Check layer type, bounds, and properties. |

### Brand Compliance Errors

| Code | HTTP | Class | Description |
|------|------|-------|-------------|
| `BRAND_COMPLIANCE_FAILED` | 422 | `BrandComplianceError` | The creative failed brand compliance checks. The `details` field contains the full `BrandComplianceResult`. |
| `BRAND_GUIDELINE_NOT_FOUND` | 404 | `BrandGuidelineNotFoundError` | The requested brand guideline does not exist or is not accessible to this tenant. |
| `BRAND_COLOR_VIOLATION` | 422 | `BrandColorViolationError` | A color used in the creative is not in the brand palette or exceeds the tolerance threshold. |
| `BRAND_TYPOGRAPHY_VIOLATION` | 422 | `BrandTypographyViolationError` | A text element violates typography rules (wrong font, size out of range, forbidden transform). |
| `BRAND_LOGO_VIOLATION` | 422 | `BrandLogoViolationError` | Logo usage violates brand rules (insufficient clear space, wrong background, rotation, etc.). |

### Workflow Errors

| Code | HTTP | Class | Description |
|------|------|-------|-------------|
| `WORKFLOW_NOT_FOUND` | 404 | `WorkflowNotFoundError` | The requested workflow does not exist or is not accessible to this tenant. |
| `WORKFLOW_TRANSITION_INVALID` | 400 | `WorkflowTransitionError` | The requested state transition is not valid for the current workflow step. The `details` field lists valid transitions. |
| `WORKFLOW_STEP_NOT_FOUND` | 404 | `WorkflowStepNotFoundError` | The specified workflow step does not exist within this workflow. |
| `WORKFLOW_PERMISSION_DENIED` | 403 | `WorkflowPermissionError` | The current user does not have the required role to perform this action on this workflow step. |
| `WORKFLOW_MAX_REVISIONS` | 400 | `WorkflowMaxRevisionsError` | The maximum number of revision rounds has been reached. The workflow must be approved or cancelled. |
| `WORKFLOW_DEADLINE_PASSED` | 400 | `WorkflowDeadlineError` | The workflow deadline has passed. Extend the deadline or escalate. |

### Dynamic Creative Errors

| Code | HTTP | Class | Description |
|------|------|-------|-------------|
| `DYNAMIC_CREATIVE_ERROR` | 500 | `DynamicCreativeError` | Dynamic creative generation failed. Check rule definitions and template compatibility. |
| `DYNAMIC_VARIANT_LIMIT` | 400 | `DynamicVariantLimitError` | The requested number of variants exceeds `maxVariants`. Increase the limit or reduce rule combinations. |
| `PERSONALIZATION_CONTEXT_INVALID` | 400 | `PersonalizationContextError` | The personalization context is missing required fields or contains invalid values. |

### Format Adaptation Errors

| Code | HTTP | Class | Description |
|------|------|-------|-------------|
| `FORMAT_ADAPTATION_FAILED` | 500 | `FormatAdaptationError` | Resize or format conversion failed. Common causes: corrupted source, unsupported codec, or insufficient memory for large images. |
| `PLATFORM_UNSUPPORTED` | 400 | `UnsupportedPlatformError` | The specified platform is not in the supported platforms list. Use `listSupportedPlatforms()` to see available platforms. |
| `FORMAT_SIZE_EXCEEDED` | 400 | `FormatSizeExceededError` | The adapted asset exceeds the platform's maximum file size even at minimum quality. Consider reducing source dimensions. |

### Rights Management Errors

| Code | HTTP | Class | Description |
|------|------|-------|-------------|
| `RIGHTS_EXPIRED` | 403 | `RightsExpiredError` | The license for this asset has expired. The `details` field includes the expiration date and license reference. |
| `RIGHTS_RESTRICTION_VIOLATED` | 403 | `RightsRestrictionError` | The intended usage violates a license restriction (geo, platform, industry, or context restriction). |
| `LICENSE_NOT_FOUND` | 404 | `LicenseNotFoundError` | No rights record exists for this asset. Upload a rights record before using the asset in campaigns. |
| `RIGHTS_USAGE_EXCEEDED` | 403 | `RightsUsageExceededError` | The asset has exceeded its maximum allowed impressions or print run as defined in the license terms. |

### AI Generation Errors

| Code | HTTP | Class | Description |
|------|------|-------|-------------|
| `AI_GENERATION_FAILED` | 500 | `AIGenerationError` | AI content generation failed. Check OpenRouter connectivity and model availability. |
| `AI_QUOTA_EXCEEDED` | 429 | `AIQuotaExceededError` | AI generation quota has been exceeded for this billing period. Upgrade plan or wait for quota reset. |
| `AI_CONTENT_POLICY` | 400 | `AIContentPolicyError` | The prompt or generated content was rejected by the AI model's content policy. Revise the prompt. |
| `AI_MODEL_UNAVAILABLE` | 503 | `AIModelUnavailableError` | The requested AI model is temporarily unavailable. Try a different model or retry later. |

### System Errors

| Code | HTTP | Class | Description |
|------|------|-------|-------------|
| `TENANT_ISOLATION_VIOLATION` | 403 | `TenantIsolationError` | An operation attempted to access resources belonging to a different tenant. This is a critical security event and is logged. |
| `COLLABORATION_ERROR` | 500 | `CollaborationError` | A collaboration operation (comment, task, mention) failed due to an internal error. |
| `CREATIVE_BRIEF_INVALID` | 400 | `CreativeBriefError` | The creative brief is missing required fields or contains invalid data. |
| `STORAGE_QUOTA_EXCEEDED` | 507 | `StorageQuotaExceededError` | The tenant has exceeded their storage quota. Delete unused assets or upgrade the plan. |
| `CONCURRENT_EDIT_CONFLICT` | 409 | `ConcurrentEditError` | Two users attempted to edit the same resource simultaneously. The `details` field includes the conflicting version. |

---

## Security

### Authentication & Authorization

All `@mcv/growth/creative` operations require an authenticated Supabase session. The module does not handle authentication directly — it relies on the authenticated `SupabaseClient` passed during initialization.

```typescript
// The supabase client MUST be authenticated before passing to CreativeService
const supabase = createSupabaseClient({
  tenantId: 'org_abc123',
  accessToken: session.access_token,  // JWT from auth flow
});

const creative = new CreativeService({
  tenantId: 'org_abc123',
  supabase,
  storage: supabase.storage,
});
```

### Multi-Tenant Isolation

Tenant isolation is the foundational security property of this module. It is enforced at three layers:

1. **Application Layer** — Every method on `CreativeService` includes `tenant_id` in all queries. The `tenantId` is set at construction time and cannot be changed.

2. **Database Layer** — PostgreSQL RLS policies on every table ensure that even if the application layer has a bug, the database prevents cross-tenant data access. RLS is enabled in "force" mode — queries without the tenant context setting return zero rows.

3. **Storage Layer** — Supabase Storage policies restrict bucket access to the authenticated tenant. Storage paths are prefixed with `{tenant_id}/` and policies enforce this prefix.

```typescript
// The service sets the tenant context on every database call
private async withTenantContext<T>(fn: () => Promise<T>): Promise<T> {
  await this.db.execute(
    sql`SELECT set_config('app.current_tenant_id', ${this.tenantId}, true)`
  );
  return fn();
}
```

### Input Validation

All inputs are validated using Zod schemas before reaching the database:

- **File uploads** — MIME type verification (magic bytes, not just extension), file size limits, virus scanning integration point
- **Template variables** — Type checking, length limits, pattern matching, allowed values
- **Brand colors** — Hex format validation, RGB range validation
- **Workflow transitions** — State machine validation (only valid transitions allowed)
- **AI prompts** — Content policy pre-screening, length limits, prompt injection mitigation

```typescript
// Example: Asset upload validation
const assetUploadSchema = z.object({
  name: z.string().min(1).max(500),
  type: z.enum(['image', 'video', 'audio', 'logo', 'font', /* ... */]),
  description: z.string().max(5000).nullable().optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
  metadata: z.object({
    custom: z.record(z.string().max(1000)).optional(),
  }).optional(),
});
```

### File Security

- **MIME Type Verification** — Files are verified by reading magic bytes, not trusting the `Content-Type` header or file extension.
- **File Size Limits** — Configurable per-tenant and per-asset-type. Default: 50 MB for images, 500 MB for videos.
- **SVG Sanitization** — SVG uploads are sanitized to remove embedded scripts, `<script>` tags, event handlers, and external resource references.
- **Image Processing Isolation** — Sharp operations run with memory limits and timeouts to prevent DoS via maliciously crafted images (e.g., decompression bombs).
- **Content Hashing** — SHA-256 hash computed on upload for integrity verification and deduplication.

```typescript
// SVG sanitization example
import DOMPurify from 'isomorphic-dompurify';

function sanitizeSvg(svgContent: string): string {
  return DOMPurify.sanitize(svgContent, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'style'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover'],
  });
}
```

### Rights Enforcement

The rights management system actively prevents usage of restricted or expired assets:

- **Pre-publish Check** — Before any asset is published or used in a campaign, rights are validated automatically.
- **Expiration Monitoring** — Background job checks for expiring licenses daily. Alerts are sent 30, 14, and 7 days before expiration.
- **Usage Restriction Enforcement** — Geographic, platform, and industry restrictions are checked against the intended usage context.
- **Quarantine** — Assets with expired or violated rights are automatically quarantined (`status: 'quarantined'`) and blocked from new usage.

### Storage Security

- **Signed URLs** — All CDN URLs are signed with time-limited tokens (default: 1 hour). No public bucket access.
- **Encryption at Rest** — Supabase Storage uses AES-256 encryption for all stored files.
- **Encryption in Transit** — All API and CDN communication uses TLS 1.3.
- **Access Logging** — All asset downloads are logged with timestamp, user, IP, and asset ID.

### AI Safety

- **Prompt Sanitization** — AI prompts are sanitized to prevent injection attacks.
- **Content Filtering** — AI-generated content is checked against content policies before being saved.
- **Human Review Required** — AI-generated content is always flagged for human review before publishing.
- **Audit Trail** — All AI generation requests are logged with the prompt, model, parameters, and output.
- **Rate Limiting** — AI generation is rate-limited per tenant per hour to prevent abuse and cost overruns.

### Audit Logging

All mutation operations are logged to an audit trail:

```typescript
interface CreativeAuditEntry {
  id: string;
  tenantId: string;
  userId: string;
  action: string;           // e.g., 'asset.upload', 'workflow.advance', 'brand.check'
  resourceType: string;     // e.g., 'asset', 'template', 'workflow'
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | ✅ | — | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | — | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | Supabase service role key (for background jobs) |
| `CREATIVE_STORAGE_BUCKET` | ❌ | `creative-assets` | Supabase Storage bucket name for creative assets |
| `CREATIVE_CDN_BASE_URL` | ❌ | Supabase Storage URL | CDN base URL for asset delivery. Override for custom CDN (e.g., Cloudflare). |
| `CREATIVE_MAX_UPLOAD_SIZE_MB` | ❌ | `50` | Maximum file upload size in megabytes |
| `CREATIVE_MAX_VIDEO_SIZE_MB` | ❌ | `500` | Maximum video upload size in megabytes |
| `CREATIVE_THUMBNAIL_WIDTH` | ❌ | `300` | Thumbnail generation width in pixels |
| `CREATIVE_THUMBNAIL_HEIGHT` | ❌ | `300` | Thumbnail generation height in pixels |
| `CREATIVE_PREVIEW_WIDTH` | ❌ | `1200` | Preview image width in pixels |
| `CREATIVE_PREVIEW_HEIGHT` | ❌ | `1200` | Preview image height in pixels |
| `CREATIVE_SIGNED_URL_EXPIRY_SECONDS` | ❌ | `3600` | Expiry duration for signed CDN URLs |
| `CREATIVE_AUTO_BRAND_CHECK` | ❌ | `true` | Automatically run brand compliance on template renders |
| `CREATIVE_AUTO_THUMBNAIL` | ❌ | `true` | Automatically generate thumbnails on asset upload |
| `CREATIVE_SHARP_CONCURRENCY` | ❌ | `2` | Sharp image processing concurrency limit |
| `CREATIVE_SHARP_CACHE_MB` | ❌ | `256` | Sharp cache size in megabytes |
| `OPENROUTER_API_KEY` | ❌ | — | OpenRouter API key for AI generation features. AI features disabled if not set. |
| `OPENROUTER_BASE_URL` | ❌ | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `CREATIVE_AI_IMAGE_MODEL` | ❌ | `stability/stable-diffusion-xl` | Default AI model for image generation |
| `CREATIVE_AI_TEXT_MODEL` | ❌ | `anthropic/claude-3.5-sonnet` | Default AI model for text/copy generation |
| `CREATIVE_AI_MAX_REQUESTS_PER_HOUR` | ❌ | `100` | Rate limit for AI generation requests per tenant per hour |
| `CREATIVE_AI_MAX_IMAGES_PER_REQUEST` | ❌ | `4` | Maximum number of images per AI generation request |
| `CREATIVE_RIGHTS_EXPIRY_WARN_DAYS` | ❌ | `30` | Days before license expiration to send first warning |
| `CREATIVE_RIGHTS_AUTO_QUARANTINE` | ❌ | `true` | Automatically quarantine assets with expired rights |
| `CREATIVE_WEBHOOK_URL` | ❌ | — | Webhook URL for workflow notifications (step transitions, approvals, etc.) |
| `CREATIVE_WEBHOOK_SECRET` | ❌ | — | HMAC secret for signing webhook payloads |
| `CREATIVE_FATIGUE_CHECK_INTERVAL_HOURS` | ❌ | `24` | How often to run fatigue detection on active campaign assets |
| `CREATIVE_PERFORMANCE_RETENTION_DAYS` | ❌ | `365` | How long to retain daily performance data before aggregation |

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.45.0` | Supabase client for database and storage operations |
| `drizzle-orm` | `^0.33.0` | Type-safe ORM for PostgreSQL query building |
| `sharp` | `^0.33.0` | High-performance image processing (resize, crop, format conversion, thumbnail generation) |
| `zod` | `^3.23.0` | Runtime schema validation for inputs, API payloads, and configuration |
| `@trpc/server` | `^11.0.0` | tRPC server for type-safe API router definition |
| `color` | `^4.2.0` | Color manipulation, conversion (hex, RGB, HSL, CMYK), and delta E comparison for brand compliance |
| `ulid` | `^2.3.0` | ULID generation for sortable, unique identifiers |
| `mime-types` | `^2.1.0` | MIME type detection and file extension mapping |
| `file-type` | `^19.0.0` | Magic byte-based file type detection (security — don't trust extensions) |
| `isomorphic-dompurify` | `^2.12.0` | SVG sanitization to prevent XSS and script injection in uploaded SVG assets |
| `openai` | `^4.50.0` | OpenAI-compatible client used for OpenRouter API calls (AI generation features) |
| `pino` | `^9.0.0` | Structured logging for audit trails and error reporting |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/infra/supabase` | `workspace:*` | MCV Supabase infrastructure (client factory, RLS helpers, tenant context) |
| `@mcv/infra/openrouter` | `workspace:*` | MCV OpenRouter client wrapper (model routing, rate limiting, cost tracking) |
| `@mcv/shared/types` | `workspace:*` | Shared MCV types (tenant, user, pagination, timestamps) |
| `@mcv/shared/errors` | `workspace:*` | Base error classes and error handling utilities |
| `@mcv/shared/validation` | `workspace:*` | Shared Zod schemas and validation helpers |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | `^2.0.0` | Test runner |
| `@testing-library/jest-dom` | `^6.4.0` | DOM testing utilities (for rendered creative assertions) |
| `msw` | `^2.3.0` | Mock Service Worker for API mocking (Supabase, OpenRouter) |
| `@faker-js/faker` | `^8.4.0` | Fake data generation for tests |
| `pixelmatch` | `^6.0.0` | Pixel-level image comparison for visual regression testing of template renders |
| `pngjs` | `^7.0.0` | PNG encoding/decoding for image comparison tests |
| `testcontainers` | `^10.9.0` | PostgreSQL containers for integration tests with real RLS policies |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── assets/
│   │   │   ├── library.test.ts
│   │   │   ├── uploader.test.ts
│   │   │   ├── search.test.ts
│   │   │   ├── collections.test.ts
│   │   │   └── versioning.test.ts
│   │   ├── templates/
│   │   │   ├── engine.test.ts
│   │   │   ├── renderer.test.ts
│   │   │   ├── variables.test.ts
│   │   │   └── platform-adapter.test.ts
│   │   ├── brand/
│   │   │   ├── compliance.test.ts
│   │   │   ├── color-validator.test.ts
│   │   │   ├── typography-validator.test.ts
│   │   │   └── logo-validator.test.ts
│   │   ├── workflows/
│   │   │   ├── engine.test.ts
│   │   │   ├── step-executor.test.ts
│   │   │   └── notifier.test.ts
│   │   ├── dynamic/
│   │   │   ├── engine.test.ts
│   │   │   ├── personalization.test.ts
│   │   │   └── variant-generator.test.ts
│   │   ├── formats/
│   │   │   ├── adapter.test.ts
│   │   │   ├── platform-registry.test.ts
│   │   │   └── image-resizer.test.ts
│   │   ├── performance/
│   │   │   ├── tracker.test.ts
│   │   │   ├── fatigue-detector.test.ts
│   │   │   └── refresh-recommender.test.ts
│   │   ├── rights/
│   │   │   ├── manager.test.ts
│   │   │   ├── license-tracker.test.ts
│   │   │   └── expiration-monitor.test.ts
│   │   └── ai/
│   │       ├── generator.test.ts
│   │       ├── image-generator.test.ts
│   │       └── copy-writer.test.ts
│   ├── integration/
│   │   ├── service.test.ts
│   │   ├── workflow-pipeline.test.ts
│   │   ├── brand-compliance-pipeline.test.ts
│   │   ├── dynamic-creative-pipeline.test.ts
│   │   ├── format-adaptation-pipeline.test.ts
│   │   ├── rights-enforcement.test.ts
│   │   └── multi-tenant-isolation.test.ts
│   ├── visual/
│   │   ├── template-render.visual.test.ts
│   │   └── format-adaptation.visual.test.ts
│   └── fixtures/
│       ├── images/
│       │   ├── test-photo-1080x1080.jpg
│       │   ├── test-photo-1920x1080.jpg
│       │   ├── test-logo-transparent.png
│       │   ├── test-svg-with-script.svg
│       │   └── test-animated.gif
│       ├── templates/
│       │   ├── social-post-template.json
│       │   └── email-header-template.json
│       ├── brand-guidelines/
│       │   └── test-brand-guideline.json
│       └── factories/
│           ├── asset.factory.ts
│           ├── template.factory.ts
│           ├── brand-guideline.factory.ts
│           ├── workflow.factory.ts
│           └── rights-record.factory.ts
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests (requires Docker for PostgreSQL)
pnpm test:integration

# Run visual regression tests
pnpm test:visual

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run a specific test file
pnpm test src/__tests__/unit/brand/compliance.test.ts
```

### Unit Test Example: Brand Color Compliance

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { BrandColorValidator } from '../../brand/color-validator';
import { createTestBrandGuideline } from '../fixtures/factories/brand-guideline.factory';

describe('BrandColorValidator', () => {
  let validator: BrandColorValidator;
  let guideline: BrandGuideline;

  beforeEach(() => {
    guideline = createTestBrandGuideline({
      colorPalette: {
        primary: [
          { name: 'Brand Blue', hex: '#1A56DB', tolerance: 3.0, usageContext: ['background', 'cta'] },
          { name: 'Brand Navy', hex: '#0F172A', tolerance: 2.0, usageContext: ['text'] },
        ],
        secondary: [
          { name: 'Coral', hex: '#E63946', tolerance: 5.0, usageContext: ['accent', 'cta'] },
        ],
        neutrals: [],
        backgrounds: [],
        text: [],
        forbidden: ['#FF0000', '#00FF00'],
        maxColorsPerCreative: 4,
        requiredCombinations: [],
      },
    });
    validator = new BrandColorValidator(guideline);
  });

  describe('validateColor', () => {
    it('should pass for exact brand colors', () => {
      const result = validator.validateColor('#1A56DB', 'background');
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should pass for colors within tolerance', () => {
      // #1B57DC is very close to #1A56DB (delta E < 3.0)
      const result = validator.validateColor('#1B57DC', 'background');
      expect(result.valid).toBe(true);
    });

    it('should fail for colors outside tolerance', () => {
      const result = validator.validateColor('#FF6B35', 'background');
      expect(result.valid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe('BRAND_COLOR_VIOLATION');
      expect(result.violations[0].severity).toBe('error');
    });

    it('should fail for forbidden colors', () => {
      const result = validator.validateColor('#FF0000', 'accent');
      expect(result.valid).toBe(false);
      expect(result.violations[0].message).toContain('forbidden');
    });

    it('should fail for colors used in wrong context', () => {
      // Brand Navy is only allowed for 'text' context, not 'cta'
      const result = validator.validateColor('#0F172A', 'cta');
      expect(result.valid).toBe(false);
      expect(result.violations[0].code).toBe('BRAND_COLOR_VIOLATION');
      expect(result.violations[0].message).toContain('usage context');
    });

    it('should warn when approaching color limit', () => {
      const result = validator.validateColorSet([
        '#1A56DB', '#0F172A', '#E63946', '#F8FAFC',
      ]);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);

      // 5th color should trigger an error (max is 4)
      const overLimit = validator.validateColorSet([
        '#1A56DB', '#0F172A', '#E63946', '#F8FAFC', '#334155',
      ]);
      expect(overLimit.valid).toBe(false);
      expect(overLimit.violations[0].code).toBe('BRAND_COLOR_VIOLATION');
      expect(overLimit.violations[0].message).toContain('maximum');
    });
  });

  describe('validateContrastRatio', () => {
    it('should pass for sufficient contrast (WCAG AA)', () => {
      // White text on Brand Navy: contrast ratio ~17:1
      const result = validator.validateContrastRatio('#FFFFFF', '#0F172A');
      expect(result.valid).toBe(true);
      expect(result.ratio).toBeGreaterThan(4.5);
    });

    it('should fail for insufficient contrast', () => {
      // Light gray on white: contrast ratio ~1.4:1
      const result = validator.validateContrastRatio('#CCCCCC', '#FFFFFF');
      expect(result.valid).toBe(false);
      expect(result.ratio).toBeLessThan(4.5);
      expect(result.violation?.code).toBe('BRAND_COLOR_VIOLATION');
    });
  });
});
```

### Integration Test Example: Workflow Pipeline

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CreativeService } from '../../service';
import { setupTestDatabase, teardownTestDatabase, createTestTenant } from '../helpers/database';
import { createTestAsset, createTestTemplate, createTestBrandGuideline } from '../fixtures/factories';

describe('Creative Workflow Pipeline (Integration)', () => {
  let db: TestDatabase;
  let creative: CreativeService;
  let tenantId: string;

  beforeAll(async () => {
    db = await setupTestDatabase();
    tenantId = await createTestTenant(db);
    creative = new CreativeService({
      tenantId,
      supabase: db.supabaseClient,
      storage: db.storageClient,
      autoBrandCheck: true,
    });
  });

  afterAll(async () => {
    await teardownTestDatabase(db);
  });

  it('should complete a full brief → design → review → approval → publish pipeline', async () => {
    // Setup: create assets and guidelines
    const guideline = await createTestBrandGuideline(creative);
    const template = await createTestTemplate(creative);
    const heroAsset = await createTestAsset(creative);

    // 1. Create brief
    const brief = await creative.createBrief({
      tenantId,
      title: 'Integration Test Campaign',
      description: 'Test the full workflow pipeline',
      objectives: ['Test objective'],
      targetAudience: 'Test audience',
      keyMessages: ['Test message'],
      callToAction: 'Test CTA',
      platforms: ['instagram_feed'],
      dimensions: [{ width: 1080, height: 1080, label: 'Square' }],
      brandGuidelineId: guideline.id,
      referenceAssetIds: [heroAsset.id],
      toneOfVoice: null,
      deadline: null,
      budget: null,
      createdBy: 'test_user_01',
    });
    expect(brief.status).toBe('draft');

    // 2. Create workflow
    const workflow = await creative.createWorkflow(brief);
    expect(workflow.status).toBe('draft');
    expect(workflow.steps.length).toBeGreaterThan(0);

    // 3. Advance through each step
    let current = workflow;

    // Brief approval
    current = await creative.advanceWorkflow(current.id, {
      status: 'approved',
      notes: 'Approved',
      decidedBy: 'test_user_01',
      decidedAt: new Date(),
    });
    expect(current.status).toBe('in_design');

    // Design complete
    current = await creative.advanceWorkflow(current.id, {
      status: 'completed',
      notes: 'Design done',
      decidedBy: 'test_user_02',
      decidedAt: new Date(),
    });

    // Brand compliance should auto-advance if passing
    // Internal review
    current = await creative.advanceWorkflow(current.id, {
      status: 'approved',
      notes: 'Looks good',
      decidedBy: 'test_user_03',
      decidedAt: new Date(),
    });

    // Final approval
    current = await creative.advanceWorkflow(current.id, {
      status: 'approved',
      notes: 'Ship it',
      decidedBy: 'test_user_01',
      decidedAt: new Date(),
    });

    expect(current.status).toBe('published');
    expect(current.completedAt).not.toBeNull();
  });

  it('should enforce revision limits', async () => {
    const brief = await creative.createBrief({
      tenantId,
      title: 'Revision Limit Test',
      description: 'Test max revision enforcement',
      objectives: [],
      targetAudience: 'Test',
      keyMessages: [],
      callToAction: null,
      platforms: ['instagram_feed'],
      dimensions: [{ width: 1080, height: 1080, label: 'Square' }],
      brandGuidelineId: null,
      referenceAssetIds: [],
      toneOfVoice: null,
      deadline: null,
      budget: null,
      createdBy: 'test_user_01',
    });

    const workflow = await creative.createWorkflow(brief, { maxRevisions: 2 });

    // Advance to review then reject twice
    let current = await creative.advanceWorkflow(workflow.id, {
      status: 'approved', notes: '', decidedBy: 'test_user_01', decidedAt: new Date(),
    });

    // First rejection
    current = await creative.rejectWorkflowStep(current.id, current.currentStepId, 'Needs work');
    expect(current.revisionCount).toBe(1);

    // Advance back to review
    current = await creative.advanceWorkflow(current.id, {
      status: 'completed', notes: '', decidedBy: 'test_user_02', decidedAt: new Date(),
    });

    // Second rejection
    current = await creative.rejectWorkflowStep(current.id, current.currentStepId, 'Still needs work');
    expect(current.revisionCount).toBe(2);

    // Advance back and try third rejection — should fail
    current = await creative.advanceWorkflow(current.id, {
      status: 'completed', notes: '', decidedBy: 'test_user_02', decidedAt: new Date(),
    });

    await expect(
      creative.rejectWorkflowStep(current.id, current.currentStepId, 'One more time')
    ).rejects.toThrow('WORKFLOW_MAX_REVISIONS');
  });
});
```

### Multi-Tenant Isolation Test

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CreativeService } from '../../service';
import { setupTestDatabase, createTestTenant } from '../helpers/database';

describe('Multi-Tenant Isolation', () => {
  let db: TestDatabase;
  let tenantA: string;
  let tenantB: string;
  let creativeA: CreativeService;
  let creativeB: CreativeService;

  beforeAll(async () => {
    db = await setupTestDatabase();
    tenantA = await createTestTenant(db, 'Tenant A');
    tenantB = await createTestTenant(db, 'Tenant B');

    creativeA = new CreativeService({
      tenantId: tenantA,
      supabase: db.supabaseClientForTenant(tenantA),
      storage: db.storageClient,
    });

    creativeB = new CreativeService({
      tenantId: tenantB,
      supabase: db.supabaseClientForTenant(tenantB),
      storage: db.storageClient,
    });
  });

  afterAll(async () => {
    await db.teardown();
  });

  it('should not allow Tenant B to access Tenant A assets', async () => {
    // Tenant A uploads an asset
    const assetA = await creativeA.uploadAsset(testImageBuffer, {
      name: 'Tenant A Secret Asset',
      type: 'image',
    });

    // Tenant B should not be able to find it
    await expect(creativeB.getAsset(assetA.id)).rejects.toThrow('ASSET_NOT_FOUND');

    // Tenant B search should return zero results
    const searchB = await creativeB.searchAssets('Tenant A Secret');
    expect(searchB.total).toBe(0);
  });

  it('should not allow Tenant B to access Tenant A templates', async () => {
    const templateA = await creativeA.createTemplate({
      tenantId: tenantA,
      name: 'Tenant A Template',
      category: 'social_post',
      baseDimensions: { width: 1080, height: 1080 },
      layers: [],
      variables: [],
      status: 'active',
      createdBy: 'user_a',
      // ... other required fields
    });

    await expect(creativeB.getTemplate(templateA.id)).rejects.toThrow('TEMPLATE_NOT_FOUND');
  });

  it('should not allow Tenant B to access Tenant A workflows', async () => {
    const briefA = await creativeA.createBrief({
      tenantId: tenantA,
      title: 'Tenant A Brief',
      description: 'Secret brief',
      objectives: [],
      targetAudience: 'Test',
      keyMessages: [],
      platforms: ['instagram_feed'],
      dimensions: [],
      createdBy: 'user_a',
      // ... other required fields
    });

    await expect(creativeB.getBrief(briefA.id)).rejects.toThrow();
  });

  it('should isolate brand guidelines between tenants', async () => {
    const guidelineA = await creativeA.createBrandGuideline({
      tenantId: tenantA,
      name: 'Tenant A Brand',
      colorPalette: { primary: [], secondary: [], neutrals: [], backgrounds: [], text: [], forbidden: [], maxColorsPerCreative: null, requiredCombinations: [] },
      typography: [],
      logoRules: [],
      toneOfVoice: null,
      imageryStyle: null,
      minContrastRatio: 4.5,
      forbiddenElements: [],
      isPrimary: true,
      version: 1,
      status: 'active',
      createdBy: 'user_a',
    });

    const guidelinesB = await creativeB.listBrandGuidelines();
    expect(guidelinesB.find(g => g.id === guidelineA.id)).toBeUndefined();
  });
});
```

### Visual Regression Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { TemplateRenderer } from '../../templates/renderer';

describe('Template Rendering (Visual)', () => {
  const renderer = new TemplateRenderer({ sharpConcurrency: 1 });

  it('should render social post template matching baseline', async () => {
    const template = JSON.parse(
      readFileSync('src/__tests__/fixtures/templates/social-post-template.json', 'utf-8')
    );

    const rendered = await renderer.render(template, {
      headline: 'Test Headline',
      product_image: 'src/__tests__/fixtures/images/test-photo-1080x1080.jpg',
      cta_text: 'Shop Now',
      background_color: '#F8F9FA',
      text_color: '#1A1A2E',
      cta_color: '#E63946',
    }, { format: 'png', quality: 100 });

    // Load baseline image
    const baseline = PNG.sync.read(
      readFileSync('src/__tests__/fixtures/baselines/social-post-baseline.png')
    );
    const actual = PNG.sync.read(rendered.buffer);
    const diff = new PNG({ width: baseline.width, height: baseline.height });

    const mismatchedPixels = pixelmatch(
      baseline.data,
      actual.data,
      diff.data,
      baseline.width,
      baseline.height,
      { threshold: 0.1 }
    );

    const totalPixels = baseline.width * baseline.height;
    const mismatchPercent = (mismatchedPixels / totalPixels) * 100;

    // Allow up to 0.5% pixel difference (anti-aliasing, font rendering variations)
    expect(mismatchPercent).toBeLessThan(0.5);
  });

  it('should correctly apply platform safe zones for Instagram Story', async () => {
    const template = JSON.parse(
      readFileSync('src/__tests__/fixtures/templates/social-post-template.json', 'utf-8')
    );

    const rendered = await renderer.render(template, {
      headline: 'Safe Zone Test',
      product_image: 'src/__tests__/fixtures/images/test-photo-1080x1080.jpg',
      cta_text: 'Test CTA',
    }, { format: 'png', platform: 'instagram_story' });

    // Verify output dimensions match Instagram Story spec
    const metadata = await sharp(rendered.buffer).metadata();
    expect(metadata.width).toBe(1080);
    expect(metadata.height).toBe(1920);
  });
});
```

### Test Factories

```typescript
// src/__tests__/fixtures/factories/asset.factory.ts
import { faker } from '@faker-js/faker';
import type { Asset, AssetType, AssetStatus } from '../../../assets/types';

export function createTestAssetData(overrides: Partial<Asset> = {}): Omit<Asset, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    tenantId: overrides.tenantId ?? faker.string.uuid(),
    name: overrides.name ?? faker.commerce.productName() + ' - ' + faker.word.adjective(),
    description: overrides.description ?? faker.lorem.sentence(),
    type: overrides.type ?? faker.helpers.arrayElement<AssetType>(['image', 'photograph', 'logo', 'illustration']),
    mimeType: overrides.mimeType ?? 'image/jpeg',
    fileSizeBytes: overrides.fileSizeBytes ?? faker.number.int({ min: 50000, max: 5000000 }),
    storagePath: overrides.storagePath ?? `assets/images/${faker.string.uuid()}/original.jpg`,
    cdnUrl: overrides.cdnUrl ?? faker.internet.url() + '/assets/' + faker.string.uuid() + '.jpg',
    thumbnailUrl: overrides.thumbnailUrl ?? faker.internet.url() + '/thumbs/' + faker.string.uuid() + '.webp',
    previewUrl: overrides.previewUrl ?? faker.internet.url() + '/previews/' + faker.string.uuid() + '.webp',
    dimensions: overrides.dimensions ?? {
      width: 1080,
      height: 1080,
      aspectRatio: '1:1',
      unit: 'px' as const,
      dpi: 72,
    },
    durationSeconds: overrides.durationSeconds ?? null,
    version: overrides.version ?? 1,
    status: overrides.status ?? 'active',
    metadata: overrides.metadata ?? {},
    tags: overrides.tags ?? [
      { id: faker.string.uuid(), name: faker.word.noun(), category: null, color: null },
    ],
    collectionIds: overrides.collectionIds ?? [],
    rightsRecordId: overrides.rightsRecordId ?? null,
    fileHash: overrides.fileHash ?? faker.string.hexadecimal({ length: 64 }),
    extractedColors: overrides.extractedColors ?? [faker.color.rgb(), faker.color.rgb(), faker.color.rgb()],
    aiDescription: overrides.aiDescription ?? null,
    uploadedBy: overrides.uploadedBy ?? faker.string.uuid(),
    deletedAt: overrides.deletedAt ?? null,
  };
}
```

### Coverage Requirements

| Area | Minimum Coverage |
|------|-----------------|
| **Unit Tests** | 85% line coverage, 80% branch coverage |
| **Integration Tests** | All critical paths (workflow pipeline, brand compliance, rights enforcement) |
| **Visual Tests** | Template rendering for all `TemplateCategory` types |
| **Security Tests** | Multi-tenant isolation, SVG sanitization, file type verification |
| **Error Handling** | Every error code has at least one test triggering it |

---

*Last updated: 2026-02-09*
*Module version: 0.1.0*
*Maintainer: Growth Team*