# @mcv/growth/website

> Website Builder & CMS — Visual page building, headless content management, blog engine, multi-site support, and static site generation for venture marketing sites, landing pages, and microsites.

**Domain:** `growth` · **Submodule:** `website`
**Package:** `@mcv/growth/website`
**Since:** 0.1.0
**Status:** Stable
**Tier:** 5 (Domain Module)

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

`@mcv/growth/website` is the Website Builder & CMS submodule of the MCV.ONE platform. It provides everything a venture needs to create, manage, publish, and optimize marketing websites — from single landing pages to full multi-language, multi-site content ecosystems.

### What It Does

1. **Visual Page Building** — A drag-and-drop page builder with a rich component library (hero sections, feature grids, pricing tables, testimonials, FAQ accordions, CTA blocks, and more). Founders and marketers can assemble professional pages without writing code.

2. **Headless CMS** — Structured content types with a rich text editor, media library, content versioning, and scheduled publishing. Content is API-first, enabling consumption by the built-in renderer, mobile apps, or third-party frontends.

3. **Blog Engine** — Full-featured blogging with categories, tags, author profiles, RSS feed generation, comment systems, and related post suggestions. Designed for content marketing at scale.

4. **Multi-Site Management** — Run multiple websites per venture with shared component libraries, centralized domain management, and automatic SSL provisioning via Let's Encrypt or Cloudflare.

5. **Forms & Lead Capture** — Build contact forms, lead capture flows, multi-step wizards, and surveys with conditional logic, file uploads, and spam protection (reCAPTCHA v3, honeypot fields).

6. **Navigation & Layout** — Menu builder with mega menu support, header/footer customization, breadcrumb generation, and responsive mobile navigation patterns.

7. **SEO & Open Graph** — Automatic meta tag generation, XML sitemap creation, robots.txt management, canonical URL enforcement, Open Graph tags, Twitter Cards, and JSON-LD structured data.

8. **Analytics & Experimentation** — Built-in page analytics (views, unique visitors, scroll depth, heatmaps), conversion tracking, and A/B testing for pages, components, and CTAs.

9. **Performance Optimization** — Static site generation (SSG) with incremental builds, CDN deployment (Vercel/Cloudflare), automatic image optimization (WebP/AVIF), lazy loading, and Core Web Vitals monitoring.

10. **Internationalization** — Multi-language sites with locale-based routing, `hreflang` tag generation, RTL layout support, and a translation management workflow.

### Why It Exists

Every venture needs a web presence. Most founders either spend weeks fighting with WordPress, overpay for a Webflow subscription, or hand-code a Next.js site they'll never maintain. `@mcv/growth/website` collapses the website creation lifecycle into the MCV.ONE platform — sharing the same auth, billing, analytics, and team infrastructure the venture already uses.

The module is designed to:

- **Accelerate launch** — Pre-built themes and components get a professional site live in hours, not weeks.
- **Enable non-technical users** — The visual builder means marketers, founders, and content writers can iterate without developer involvement.
- **Scale with the venture** — From a single landing page at pre-seed to a multi-language content hub at Series B, the same platform grows with the company.
- **Integrate deeply** — Website analytics flow into `@mcv/growth/analytics`, form submissions feed into `@mcv/growth/crm`, and blog content powers `@mcv/growth/email` newsletters.

### Design Principles

| Principle | Implementation |
|---|---|
| **Content-first** | Headless CMS architecture — content is stored structured, rendered anywhere |
| **Performance by default** | SSG, CDN deployment, image optimization — fast sites without configuration |
| **Multi-tenant isolation** | Every site is scoped to a venture via RLS; no data leakage between tenants |
| **Composable** | Pages are trees of components; components are reusable across pages and sites |
| **SEO-native** | Meta tags, sitemaps, structured data, and canonical URLs are automatic, not afterthoughts |
| **Progressive enhancement** | Sites work without JavaScript; interactivity is layered on top |
| **API-first** | Every operation is available via tRPC; the visual builder is just one consumer |

---

## Exports

### Services

```typescript
import {
  // Core services
  WebsiteService,           // Main orchestrator — site CRUD, publishing, deployment
  PageService,              // Page management — create, edit, version, publish
  PageBuilderService,       // Visual builder operations — component tree manipulation
  ComponentService,         // Component library — registration, rendering, variants
  ThemeService,             // Theme management — apply, customize, export
  BlogService,              // Blog engine — posts, categories, tags, RSS
  FormService,              // Form builder — create, validate, submit, export
  NavigationService,        // Navigation — menus, headers, footers, breadcrumbs
  MediaService,             // Media library — upload, optimize, transform, CDN
  DomainService,            // Domain management — DNS, SSL, verification
  DeploymentService,        // Build & deploy — SSG, CDN push, cache invalidation
  SEOService,               // SEO — meta tags, sitemaps, structured data
  AnalyticsService,         // Page analytics — views, heatmaps, scroll depth
  ABTestService,            // A/B testing — experiments, variants, statistical analysis
  I18nService,              // Internationalization — locales, translations, routing
} from '@mcv/growth/website';
```

### Router

```typescript
import {
  websiteRouter,            // tRPC router — all website endpoints
} from '@mcv/growth/website/router';
```

### Schemas (Drizzle ORM)

```typescript
import {
  // Database table definitions
  sites,
  pages,
  pageComponents,
  pageVersions,
  themes,
  themeCustomizations,
  blogPosts,
  blogCategories,
  blogTags,
  blogPostTags,
  blogComments,
  forms,
  formFields,
  formSubmissions,
  navigationMenus,
  navigationItems,
  mediaAssets,
  siteDomains,
  siteLocales,
  translations,
  abTests,
  abTestVariants,
  pageAnalytics,
  componentTemplates,
} from '@mcv/growth/website/schema';
```

### Validators (Zod)

```typescript
import {
  // Input validators
  CreateSiteInput,
  UpdateSiteInput,
  CreatePageInput,
  UpdatePageInput,
  PublishPageInput,
  CreateComponentInput,
  UpdateComponentTreeInput,
  CreateBlogPostInput,
  UpdateBlogPostInput,
  CreateFormInput,
  SubmitFormInput,
  CreateNavigationInput,
  UploadMediaInput,
  AddDomainInput,
  CreateABTestInput,
  CreateTranslationInput,
  // Query validators
  ListSitesQuery,
  ListPagesQuery,
  ListBlogPostsQuery,
  ListMediaQuery,
  AnalyticsQuery,
  SearchContentQuery,
} from '@mcv/growth/website/validators';
```

### Types

```typescript
import type {
  // Core types
  Site,
  SiteConfig,
  SiteStatus,
  Page,
  PageVersion,
  PageStatus,
  Component,
  ComponentType,
  ComponentProps,
  ComponentTree,
  Theme,
  ThemeConfig,
  ThemeColors,
  ThemeFonts,
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogComment,
  BlogPostStatus,
  Form,
  FormField,
  FormFieldType,
  FormSubmission,
  FormValidationRule,
  Navigation,
  NavigationItem,
  NavigationType,
  MediaAsset,
  MediaTransform,
  MediaType,
  Domain,
  DomainStatus,
  SSLStatus,
  Deployment,
  DeploymentStatus,
  BuildConfig,
  SEOConfig,
  OpenGraphData,
  StructuredData,
  ABTest,
  ABTestVariant,
  ABTestResult,
  Locale,
  Translation,
  TranslationStatus,
  PageAnalyticsData,
  HeatmapData,
  ScrollDepthData,
  // Enums
  ComponentCategory,
  PageLayout,
  FormAction,
  NavigationPosition,
  ImageFormat,
} from '@mcv/growth/website/types';
```

### Hooks (React)

```typescript
import {
  // Site hooks
  useSite,
  useSites,
  useCreateSite,
  useUpdateSite,
  useDeleteSite,
  // Page hooks
  usePage,
  usePages,
  useCreatePage,
  useUpdatePage,
  usePublishPage,
  useRevertPage,
  // Builder hooks
  usePageBuilder,
  useComponentTree,
  useDragAndDrop,
  useComponentLibrary,
  // Blog hooks
  useBlogPost,
  useBlogPosts,
  useCreateBlogPost,
  useUpdateBlogPost,
  usePublishBlogPost,
  useBlogCategories,
  useBlogTags,
  // Form hooks
  useForm,
  useForms,
  useCreateForm,
  useFormSubmissions,
  useFormBuilder,
  // Navigation hooks
  useNavigation,
  useNavigations,
  useMenuBuilder,
  // Media hooks
  useMedia,
  useMediaLibrary,
  useUploadMedia,
  useMediaPicker,
  // Theme hooks
  useTheme,
  useThemes,
  useThemeCustomizer,
  // Domain hooks
  useDomains,
  useAddDomain,
  useVerifyDomain,
  // Analytics hooks
  usePageAnalytics,
  useHeatmap,
  useScrollDepth,
  useABTest,
  useABTests,
  // SEO hooks
  useSEO,
  useSitemap,
  // I18n hooks
  useLocales,
  useTranslations,
  useCurrentLocale,
  // Deployment hooks
  useDeployment,
  useDeployments,
  useTriggerDeploy,
} from '@mcv/growth/website/hooks';
```

### Components (React)

```typescript
import {
  // Page Builder UI
  PageBuilderCanvas,        // Main builder canvas with drag-and-drop
  ComponentPalette,         // Sidebar component palette
  ComponentConfigurator,    // Property editor for selected component
  PagePreview,              // Live page preview (desktop/tablet/mobile)
  VersionTimeline,          // Page version history timeline
  // Renderers
  PageRenderer,             // Renders a page from component tree
  ComponentRenderer,        // Renders individual components
  BlogPostRenderer,         // Renders blog post with layout
  // Media
  MediaLibraryDialog,       // Media library browser/picker
  ImageCropper,             // Image crop/resize tool
  MediaUploader,            // Drag-and-drop upload zone
  // Forms
  FormRenderer,             // Renders a form definition into HTML
  FormBuilderUI,            // Visual form builder
  // Navigation
  NavigationRenderer,       // Renders navigation menus
  MenuBuilderUI,            // Visual menu editor
  BreadcrumbRenderer,       // Renders breadcrumbs from page hierarchy
  // Theme
  ThemeCustomizer,          // Theme color/font/spacing customizer
  ThemePicker,              // Theme selection gallery
  // SEO
  SEOPanel,                 // SEO configuration panel
  SEOPreview,               // Google/social preview
  // Analytics
  AnalyticsDashboard,       // Page analytics overview
  HeatmapOverlay,           // Heatmap visualization overlay
  ABTestDashboard,          // A/B test results dashboard
  // Content
  RichTextEditor,           // WYSIWYG content editor
  ContentScheduler,         // Publish scheduling calendar
  // Blocks (page components)
  HeroBlock,
  FeaturesBlock,
  PricingBlock,
  TestimonialsBlock,
  FAQBlock,
  CTABlock,
  GalleryBlock,
  StatsBlock,
  TeamBlock,
  LogoCloudBlock,
  FooterBlock,
  HeaderBlock,
  ContactBlock,
  NewsletterBlock,
  VideoBlock,
  TimelineBlock,
  ComparisonBlock,
  IntegrationsBlock,
} from '@mcv/growth/website/components';
```

### Utilities

```typescript
import {
  // URL/slug utilities
  generateSlug,             // Generate URL slug from title
  resolvePageUrl,           // Resolve full URL for a page
  buildSitemap,             // Generate XML sitemap from pages
  buildRobotsTxt,           // Generate robots.txt from config
  // SEO utilities
  generateMetaTags,         // Generate meta tag HTML from page data
  generateOpenGraph,        // Generate OG tags from page/post
  generateStructuredData,   // Generate JSON-LD structured data
  generateHreflangTags,     // Generate hreflang tags for locale variants
  // Image utilities
  optimizeImage,            // Optimize image (resize, format, quality)
  generateSrcSet,           // Generate responsive srcset
  getImageDimensions,       // Get image width/height
  generateBlurHash,         // Generate blur hash placeholder
  // Component utilities
  serializeComponentTree,   // Serialize component tree to JSON
  deserializeComponentTree, // Deserialize JSON to component tree
  validateComponentTree,    // Validate component tree structure
  flattenComponentTree,     // Flatten tree to array
  findComponentById,        // Find component in tree by ID
  // Build utilities
  renderPageToHtml,         // Server-render page to static HTML
  generateStaticPaths,      // Generate all static paths for SSG
  buildSiteBundle,          // Build complete site bundle
  // Analytics utilities
  trackPageView,            // Track a page view event
  calculateScrollDepth,     // Calculate scroll depth percentage
  generateHeatmapData,     // Aggregate click data into heatmap
  // Form utilities
  validateFormSubmission,   // Validate form data against field rules
  exportSubmissionsCsv,     // Export form submissions to CSV
  // RSS
  generateRSSFeed,          // Generate RSS/Atom feed from blog posts
} from '@mcv/growth/website/utils';
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          @mcv/growth/website                            │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Page Builder │  │  Blog Engine │  │ Form Builder │  │   Media    │ │
│  │   Service     │  │   Service    │  │  Service     │  │  Service   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                 │                  │                 │        │
│  ┌──────▼─────────────────▼──────────────────▼─────────────────▼──────┐ │
│  │                     WebsiteService (Orchestrator)                   │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────┐ │ │
│  │  │  Navigation  │ │   Theme     │ │     SEO      │ │    I18n    │ │ │
│  │  │   Service    │ │  Service    │ │   Service    │ │  Service   │ │ │
│  │  └─────────────┘ └─────────────┘ └──────────────┘ └────────────┘ │ │
│  └────────────────────────────┬───────────────────────────────────────┘ │
│                               │                                         │
│  ┌────────────────────────────▼───────────────────────────────────────┐ │
│  │                    Deployment Pipeline                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │ │
│  │  │  Build    │→ │ Optimize │→ │  Deploy  │→ │ Cache Invalidate │  │ │
│  │  │  (SSG)   │  │ (Images) │  │  (CDN)   │  │   (Purge)        │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Analytics & Experimentation                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │ │
│  │  │  Page Views   │  │  Heatmaps    │  │  A/B Testing Engine    │  │ │
│  │  │  & Scrolling  │  │  & Clicks    │  │  & Statistical Tests   │  │ │
│  │  └──────────────┘  └──────────────┘  └────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Data Layer (Supabase)                            │ │
│  │  PostgreSQL + RLS │ Storage (media) │ Realtime (builder collab)   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Page Build → Render → Deploy Pipeline

The website module follows a **build-time optimization** philosophy. Pages are authored in a visual builder, stored as component trees, rendered to static HTML at build time, and deployed to a global CDN. This ensures maximum performance with minimal runtime overhead.

#### Phase 1: Authoring

```
User Action (Visual Builder)
       │
       ▼
┌─────────────────┐
│ Component Tree   │  Pages are trees of components, each with typed props.
│ Manipulation     │  The builder provides drag-and-drop, inline editing,
│                  │  responsive breakpoints, and live preview.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auto-Save &      │  Every edit creates a version. Versions are immutable
│ Versioning       │  snapshots. Users can compare, revert, or branch.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Draft Storage    │  Drafts stored in `pages` table with status='draft'.
│ (Supabase PG)   │  Component trees in `page_components` as JSONB.
└─────────────────┘
```

#### Phase 2: Publishing

```
Publish Action
       │
       ▼
┌─────────────────┐
│ Validation       │  Validate component tree integrity, required fields,
│                  │  SEO completeness, accessibility checks.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Version Freeze   │  Create a published version snapshot. The page
│                  │  status changes to 'published'. Previous published
│                  │  version is archived.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SEO Generation   │  Auto-generate meta tags, Open Graph data,
│                  │  structured data (JSON-LD), update sitemap.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Trigger    │  Queue a build job for the site. Incremental
│                  │  builds only rebuild changed pages.
└─────────────────┘
```

#### Phase 3: Build (SSG)

```
Build Job
       │
       ▼
┌─────────────────┐
│ Page Resolution  │  Resolve all pages, their component trees,
│                  │  blog posts, navigation, and locale variants.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Component        │  Render each component tree to React elements,
│ Rendering        │  then to static HTML with embedded styles.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Asset            │  Process all images: resize, convert to WebP/AVIF,
│ Optimization     │  generate blur hash placeholders, create srcset
│                  │  variants, minify CSS/JS.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Bundle           │  Assemble HTML, CSS, JS, images, fonts into a
│ Assembly         │  deployable bundle with content hashes for
│                  │  cache-busting.
└─────────────────┘
```

#### Phase 4: Deployment

```
Deploy Job
       │
       ▼
┌─────────────────┐
│ CDN Upload       │  Upload bundle to Vercel/Cloudflare. Assets go to
│                  │  edge storage with immutable cache headers.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ DNS/SSL Check    │  Verify custom domains are configured. Provision
│                  │  or renew SSL certificates as needed.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cache            │  Invalidate CDN cache for changed pages.
│ Invalidation     │  Stale-while-revalidate for non-critical paths.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Health Check     │  Verify deployment is live. Check Core Web Vitals.
│                  │  Report status back to the dashboard.
└─────────────────┘
```

### Component Tree Model

Pages are represented as trees of components. Each component has a type, props, styles, and optional children:

```
Page
├── HeaderBlock (props: { logo, navItems, cta })
├── HeroBlock (props: { title, subtitle, image, cta })
├── FeaturesBlock (props: { features: [...] })
│   ├── FeatureCard (props: { icon, title, description })
│   ├── FeatureCard (props: { icon, title, description })
│   └── FeatureCard (props: { icon, title, description })
├── TestimonialsBlock (props: { testimonials: [...] })
├── PricingBlock (props: { plans: [...] })
├── FAQBlock (props: { items: [...] })
├── CTABlock (props: { title, description, button })
└── FooterBlock (props: { links, social, copyright })
```

This tree structure enables:
- **Visual editing** — Each node is selectable, configurable, and draggable
- **Incremental rendering** — Only changed subtrees need re-rendering
- **Variant testing** — Swap subtrees for A/B test variants
- **Localization** — Override props per locale without duplicating structure
- **Version diffing** — Compare trees structurally to show what changed

### Multi-Tenant Data Flow

```
Request → Auth (Supabase JWT) → Venture ID extraction → RLS enforcement
                                                              │
                                    ┌─────────────────────────┤
                                    │                         │
                              venture_id = 'abc'        venture_id = 'xyz'
                              sees only their sites     sees only their sites
                              pages, posts, media       pages, posts, media
```

Every table in the website module includes a `venture_id` column with Row-Level Security policies. This ensures complete data isolation without application-level filtering.

### Integration Points

```
@mcv/growth/website
       │
       ├──→ @mcv/growth/analytics     (page view events, conversion funnels)
       ├──→ @mcv/growth/crm           (form submissions → leads)
       ├──→ @mcv/growth/email          (blog post → newsletter content)
       ├──→ @mcv/growth/social         (blog post → social sharing)
       ├──→ @mcv/growth/seo            (site audit, keyword tracking)
       ├──→ @mcv/core/storage          (media assets via Supabase Storage)
       ├──→ @mcv/core/auth             (user authentication, team roles)
       ├──→ @mcv/core/billing          (plan limits: sites, pages, bandwidth)
       └──→ @mcv/core/notifications    (deploy status, form submission alerts)
```

---

## Core Interfaces

### Site

```typescript
/**
 * Represents a website within a venture. A venture can have multiple sites
 * (e.g., main marketing site, blog, docs, landing pages).
 */
interface Site {
  /** Unique site identifier (ULID) */
  id: string;

  /** Owning venture ID */
  ventureId: string;

  /** Human-readable site name */
  name: string;

  /** URL-safe slug (used as subdomain on *.mcv.site) */
  slug: string;

  /** Site description */
  description: string | null;

  /** Active theme ID */
  themeId: string | null;

  /** Site-wide configuration */
  config: SiteConfig;

  /** Site status */
  status: SiteStatus;

  /** Default locale code (e.g., 'en-US') */
  defaultLocale: string;

  /** Enabled locale codes */
  enabledLocales: string[];

  /** Favicon URL */
  faviconUrl: string | null;

  /** Social sharing image URL (default OG image) */
  socialImageUrl: string | null;

  /** Custom CSS (injected into all pages) */
  customCss: string | null;

  /** Custom JS (injected into all pages) */
  customJs: string | null;

  /** Custom <head> HTML */
  customHead: string | null;

  /** Google Analytics measurement ID */
  gaId: string | null;

  /** Google Tag Manager container ID */
  gtmId: string | null;

  /** Last deployment timestamp */
  lastDeployedAt: string | null;

  /** Last deployment status */
  lastDeployStatus: DeploymentStatus | null;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;

  /** Soft delete timestamp */
  deletedAt: string | null;
}

/** Site-wide configuration */
interface SiteConfig {
  /** Base URL (e.g., 'https://acme.com') */
  baseUrl: string | null;

  /** Site title (used in <title> suffix) */
  title: string;

  /** Site tagline / description */
  tagline: string | null;

  /** Default page layout */
  defaultLayout: PageLayout;

  /** Enable blog engine */
  blogEnabled: boolean;

  /** Blog URL prefix (e.g., '/blog') */
  blogPrefix: string;

  /** Posts per page in blog listing */
  blogPostsPerPage: number;

  /** Enable comments on blog posts */
  commentsEnabled: boolean;

  /** Comment moderation mode */
  commentModeration: 'none' | 'pre' | 'post';

  /** Enable RSS feed */
  rssEnabled: boolean;

  /** 404 page ID (custom not-found page) */
  notFoundPageId: string | null;

  /** Redirect rules */
  redirects: RedirectRule[];

  /** Custom HTTP headers */
  customHeaders: Record<string, string>;

  /** Enable password protection */
  passwordProtected: boolean;

  /** Password hash (bcrypt) if protected */
  passwordHash: string | null;

  /** Build configuration */
  build: BuildConfig;

  /** SEO defaults */
  seo: SEOConfig;
}

/** Build configuration for SSG */
interface BuildConfig {
  /** Build framework ('nextjs' | 'astro' | 'static') */
  framework: 'nextjs' | 'astro' | 'static';

  /** Output directory */
  outputDir: string;

  /** Enable incremental builds */
  incrementalBuilds: boolean;

  /** Image optimization settings */
  imageOptimization: {
    enabled: boolean;
    formats: ImageFormat[];
    quality: number;
    maxWidth: number;
    generateBlurHash: boolean;
  };

  /** Minification settings */
  minify: {
    html: boolean;
    css: boolean;
    js: boolean;
  };

  /** Cache-control max-age for static assets (seconds) */
  assetCacheMaxAge: number;

  /** Cache-control max-age for HTML pages (seconds) */
  pageCacheMaxAge: number;
}

/** SEO configuration defaults */
interface SEOConfig {
  /** Default title template (e.g., '%s | Acme Corp') */
  titleTemplate: string;

  /** Default meta description */
  defaultDescription: string | null;

  /** Default OG image URL */
  defaultOgImage: string | null;

  /** Twitter card type */
  twitterCardType: 'summary' | 'summary_large_image';

  /** Twitter handle (e.g., '@acmecorp') */
  twitterHandle: string | null;

  /** Enable auto-sitemap generation */
  sitemapEnabled: boolean;

  /** Robots.txt configuration */
  robots: {
    allowAll: boolean;
    disallowPaths: string[];
    customRules: string | null;
  };

  /** Enable JSON-LD structured data */
  structuredDataEnabled: boolean;

  /** Organization structured data */
  organization: {
    name: string;
    logo: string | null;
    url: string | null;
    sameAs: string[];
  } | null;
}

type SiteStatus = 'active' | 'archived' | 'suspended';
type DeploymentStatus = 'queued' | 'building' | 'deploying' | 'deployed' | 'failed' | 'cancelled';
type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png';
```

### Page

```typescript
/**
 * Represents a single page within a site. Pages contain a tree of
 * components and metadata for SEO, routing, and publishing.
 */
interface Page {
  /** Unique page identifier (ULID) */
  id: string;

  /** Parent site ID */
  siteId: string;

  /** Venture ID (denormalized for RLS) */
  ventureId: string;

  /** Page title */
  title: string;

  /** URL slug (e.g., 'about-us') */
  slug: string;

  /** Full path (e.g., '/about-us' or '/blog/my-post') */
  path: string;

  /** Page description (for SEO) */
  description: string | null;

  /** Page layout */
  layout: PageLayout;

  /** Page status */
  status: PageStatus;

  /** Component tree root (references page_components) */
  componentTreeId: string | null;

  /** Current published version ID */
  publishedVersionId: string | null;

  /** Current draft version ID */
  draftVersionId: string | null;

  /** SEO overrides (override site defaults) */
  seo: PageSEO | null;

  /** Open Graph overrides */
  openGraph: OpenGraphData | null;

  /** Featured image URL */
  featuredImage: string | null;

  /** Parent page ID (for hierarchy/breadcrumbs) */
  parentId: string | null;

  /** Sort order within parent */
  sortOrder: number;

  /** Locale code (null = default locale) */
  locale: string | null;

  /** ID of the canonical (default locale) page */
  canonicalPageId: string | null;

  /** Scheduled publish timestamp */
  scheduledAt: string | null;

  /** Published timestamp */
  publishedAt: string | null;

  /** Author user ID */
  authorId: string | null;

  /** Allow indexing by search engines */
  indexable: boolean;

  /** Page-level custom CSS */
  customCss: string | null;

  /** Page-level custom JS */
  customJs: string | null;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;

  /** Soft delete timestamp */
  deletedAt: string | null;
}

/** Per-page SEO overrides */
interface PageSEO {
  /** Meta title (overrides page title) */
  title: string | null;

  /** Meta description */
  description: string | null;

  /** Canonical URL (override auto-generated) */
  canonicalUrl: string | null;

  /** Focus keyword for SEO scoring */
  focusKeyword: string | null;

  /** Additional meta tags */
  metaTags: Array<{ name: string; content: string }>;

  /** noindex flag */
  noIndex: boolean;

  /** nofollow flag */
  noFollow: boolean;
}

/** Open Graph data */
interface OpenGraphData {
  title: string | null;
  description: string | null;
  image: string | null;
  type: 'website' | 'article' | 'product';
  locale: string | null;
  siteName: string | null;
}

type PageStatus = 'draft' | 'published' | 'scheduled' | 'archived';
type PageLayout = 'default' | 'full-width' | 'sidebar-left' | 'sidebar-right' | 'landing' | 'blog-post' | 'blank';
```

### Component

```typescript
/**
 * Represents a single component instance within a page's component tree.
 * Components are the building blocks of pages.
 */
interface Component {
  /** Unique component instance ID (ULID) */
  id: string;

  /** Page ID this component belongs to */
  pageId: string;

  /** Component type identifier (e.g., 'hero', 'features', 'cta') */
  type: ComponentType;

  /** Component display name (for builder UI) */
  name: string;

  /** Component props (type-specific) */
  props: ComponentProps;

  /** Responsive style overrides */
  styles: ComponentStyles;

  /** Child component IDs (ordered) */
  children: string[];

  /** Parent component ID (null for root) */
  parentId: string | null;

  /** Sort order within parent */
  sortOrder: number;

  /** Visibility flag */
  visible: boolean;

  /** Responsive visibility */
  responsiveVisibility: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };

  /** Lock component from editing */
  locked: boolean;

  /** A/B test variant ID (null if not in a test) */
  abTestVariantId: string | null;

  /** Locale-specific prop overrides */
  localeOverrides: Record<string, Partial<ComponentProps>>;

  /** Animation configuration */
  animation: ComponentAnimation | null;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

/** Component style configuration with responsive breakpoints */
interface ComponentStyles {
  /** Desktop styles (≥1024px) */
  desktop: CSSProperties;

  /** Tablet styles (≥768px) */
  tablet: Partial<CSSProperties>;

  /** Mobile styles (<768px) */
  mobile: Partial<CSSProperties>;

  /** Custom CSS class names */
  className: string | null;

  /** Custom inline CSS */
  customCss: string | null;
}

/** Component animation configuration */
interface ComponentAnimation {
  /** Animation type */
  type: 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'zoom-in' | 'bounce' | 'none';

  /** Duration in milliseconds */
  duration: number;

  /** Delay in milliseconds */
  delay: number;

  /** Easing function */
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';

  /** Trigger */
  trigger: 'on-load' | 'on-scroll' | 'on-hover';
}

/**
 * Component type registry. Each type maps to a renderer and a prop schema.
 */
type ComponentType =
  // Layout
  | 'section'
  | 'container'
  | 'grid'
  | 'columns'
  | 'spacer'
  | 'divider'
  // Content
  | 'heading'
  | 'text'
  | 'rich-text'
  | 'image'
  | 'video'
  | 'embed'
  | 'code-block'
  | 'icon'
  | 'button'
  | 'link'
  | 'badge'
  // Blocks
  | 'hero'
  | 'features'
  | 'pricing'
  | 'testimonials'
  | 'faq'
  | 'cta'
  | 'gallery'
  | 'stats'
  | 'team'
  | 'logo-cloud'
  | 'comparison'
  | 'timeline'
  | 'integrations'
  | 'newsletter'
  | 'contact'
  // Navigation
  | 'header'
  | 'footer'
  | 'breadcrumbs'
  | 'sidebar'
  | 'tabs'
  | 'accordion'
  // Blog
  | 'blog-list'
  | 'blog-card'
  | 'blog-post-content'
  | 'author-bio'
  | 'related-posts'
  | 'category-list'
  | 'tag-cloud'
  // Forms
  | 'form'
  | 'form-field'
  // Custom
  | 'html'
  | 'custom';

/** Component category for palette organization */
type ComponentCategory =
  | 'layout'
  | 'content'
  | 'blocks'
  | 'navigation'
  | 'blog'
  | 'forms'
  | 'custom';

/** Union type for all component prop shapes */
type ComponentProps = HeroProps | FeaturesProps | PricingProps | TestimonialsProps |
  FAQProps | CTAProps | GalleryProps | TextProps | ImageProps | ButtonProps |
  HeadingProps | FormProps | Record<string, unknown>;
```

### Theme

```typescript
/**
 * Represents a visual theme that can be applied to a site.
 * Themes define colors, fonts, spacing, and component styling defaults.
 */
interface Theme {
  /** Unique theme identifier (ULID) */
  id: string;

  /** Theme name */
  name: string;

  /** Theme description */
  description: string | null;

  /** Theme category/industry */
  category: ThemeCategory;

  /** Preview image URL */
  previewUrl: string | null;

  /** Whether this is a system-provided theme */
  isSystem: boolean;

  /** Venture ID (null for system themes) */
  ventureId: string | null;

  /** Theme configuration */
  config: ThemeConfig;

  /** Base theme ID (for theme inheritance) */
  parentThemeId: string | null;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

/** Theme configuration */
interface ThemeConfig {
  /** Color palette */
  colors: ThemeColors;

  /** Dark mode colors (null = auto-derive) */
  darkColors: ThemeColors | null;

  /** Typography */
  fonts: ThemeFonts;

  /** Spacing scale (in px) */
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
  };

  /** Border radius scale (in px) */
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };

  /** Shadow presets */
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };

  /** Container max-width (in px) */
  containerMaxWidth: number;

  /** Enable dark mode toggle */
  darkModeEnabled: boolean;

  /** Default dark mode preference */
  darkModeDefault: 'light' | 'dark' | 'system';

  /** Component-specific style overrides */
  componentOverrides: Record<ComponentType, Partial<CSSProperties>>;

  /** Custom CSS variables */
  cssVariables: Record<string, string>;
}

/** Theme color palette */
interface ThemeColors {
  /** Primary brand color */
  primary: string;
  /** Primary color hover variant */
  primaryHover: string;
  /** Secondary brand color */
  secondary: string;
  /** Secondary color hover variant */
  secondaryHover: string;
  /** Accent color */
  accent: string;
  /** Background color */
  background: string;
  /** Surface/card background color */
  surface: string;
  /** Primary text color */
  text: string;
  /** Secondary/muted text color */
  textMuted: string;
  /** Border color */
  border: string;
  /** Success color */
  success: string;
  /** Warning color */
  warning: string;
  /** Error/danger color */
  error: string;
  /** Info color */
  info: string;
}

/** Theme font configuration */
interface ThemeFonts {
  /** Heading font family */
  heading: string;
  /** Body text font family */
  body: string;
  /** Monospace font family */
  mono: string;
  /** Font size scale (in rem) */
  sizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  /** Font weight values */
  weights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  /** Line height values */
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  /** Google Fonts URLs to load */
  googleFontsUrl: string | null;
}

type ThemeCategory =
  | 'saas'
  | 'ecommerce'
  | 'agency'
  | 'portfolio'
  | 'blog'
  | 'startup'
  | 'corporate'
  | 'nonprofit'
  | 'education'
  | 'healthcare'
  | 'restaurant'
  | 'real-estate'
  | 'custom';
```

### BlogPost

```typescript
/**
 * Represents a blog post. Blog posts are a specialized content type
 * with author, categories, tags, and comment support.
 */
interface BlogPost {
  /** Unique blog post identifier (ULID) */
  id: string;

  /** Parent site ID */
  siteId: string;

  /** Venture ID (denormalized for RLS) */
  ventureId: string;

  /** Post title */
  title: string;

  /** URL slug */
  slug: string;

  /** Post excerpt (plain text summary) */
  excerpt: string | null;

  /** Post content (rich text as JSON — TipTap/ProseMirror format) */
  content: Record<string, unknown>;

  /** Post content as plain text (for search indexing) */
  contentPlainText: string;

  /** Featured image URL */
  featuredImage: string | null;

  /** Featured image alt text */
  featuredImageAlt: string | null;

  /** Post status */
  status: BlogPostStatus;

  /** Author user ID */
  authorId: string;

  /** Author display name (denormalized) */
  authorName: string;

  /** Author avatar URL (denormalized) */
  authorAvatar: string | null;

  /** Author bio (short) */
  authorBio: string | null;

  /** Category ID */
  categoryId: string | null;

  /** Tag IDs */
  tagIds: string[];

  /** Estimated reading time (minutes) */
  readingTime: number;

  /** Word count */
  wordCount: number;

  /** SEO overrides */
  seo: PageSEO | null;

  /** Open Graph overrides */
  openGraph: OpenGraphData | null;

  /** Locale code */
  locale: string | null;

  /** Canonical post ID (for translations) */
  canonicalPostId: string | null;

  /** Allow comments */
  commentsEnabled: boolean;

  /** Comment count (denormalized) */
  commentCount: number;

  /** View count (denormalized) */
  viewCount: number;

  /** Scheduled publish timestamp */
  scheduledAt: string | null;

  /** Published timestamp */
  publishedAt: string | null;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;

  /** Soft delete timestamp */
  deletedAt: string | null;
}

type BlogPostStatus = 'draft' | 'review' | 'published' | 'scheduled' | 'archived';

/** Blog category */
interface BlogCategory {
  id: string;
  siteId: string;
  ventureId: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Blog tag */
interface BlogTag {
  id: string;
  siteId: string;
  ventureId: string;
  name: string;
  slug: string;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Blog comment */
interface BlogComment {
  id: string;
  postId: string;
  siteId: string;
  ventureId: string;
  authorName: string;
  authorEmail: string;
  authorUrl: string | null;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  parentCommentId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Form

```typescript
/**
 * Represents a form definition. Forms can be embedded in pages
 * or used standalone for lead capture, contact, surveys, etc.
 */
interface Form {
  /** Unique form identifier (ULID) */
  id: string;

  /** Parent site ID */
  siteId: string;

  /** Venture ID (denormalized for RLS) */
  ventureId: string;

  /** Form name (internal) */
  name: string;

  /** Form title (displayed to users) */
  title: string | null;

  /** Form description */
  description: string | null;

  /** Form fields (ordered) */
  fields: FormField[];

  /** Form configuration */
  config: FormConfig;

  /** Submission count */
  submissionCount: number;

  /** Form status */
  status: 'active' | 'paused' | 'archived';

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

/** Form field definition */
interface FormField {
  /** Unique field ID within the form */
  id: string;

  /** Field type */
  type: FormFieldType;

  /** Field label */
  label: string;

  /** Field name (for submission data key) */
  name: string;

  /** Placeholder text */
  placeholder: string | null;

  /** Help text / description */
  helpText: string | null;

  /** Default value */
  defaultValue: string | null;

  /** Required field */
  required: boolean;

  /** Validation rules */
  validation: FormValidationRule[];

  /** Options (for select, radio, checkbox) */
  options: Array<{
    label: string;
    value: string;
  }> | null;

  /** Conditional display logic */
  conditionalLogic: ConditionalLogic | null;

  /** Field width ('full' | 'half' | 'third') */
  width: 'full' | 'half' | 'third';

  /** Sort order */
  sortOrder: number;

  /** Field-level custom CSS class */
  className: string | null;
}

type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'url'
  | 'textarea'
  | 'select'
  | 'multi-select'
  | 'radio'
  | 'checkbox'
  | 'toggle'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'color'
  | 'range'
  | 'rating'
  | 'hidden'
  | 'heading'
  | 'paragraph'
  | 'divider'
  | 'page-break';

/** Form validation rule */
interface FormValidationRule {
  type: 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'url' | 'phone' | 'custom';
  value: string | number;
  message: string;
}

/** Conditional display logic for a field */
interface ConditionalLogic {
  /** Show or hide when condition is met */
  action: 'show' | 'hide';

  /** Logic operator for multiple conditions */
  operator: 'and' | 'or';

  /** Conditions */
  conditions: Array<{
    fieldId: string;
    comparison: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than' | 'is-empty' | 'is-not-empty';
    value: string;
  }>;
}

/** Form configuration */
interface FormConfig {
  /** Submit button text */
  submitButtonText: string;

  /** Submit button style */
  submitButtonStyle: 'primary' | 'secondary' | 'outline';

  /** Success message (after submission) */
  successMessage: string;

  /** Redirect URL after submission (null = show message) */
  redirectUrl: string | null;

  /** Email notifications on submission */
  notifications: Array<{
    to: string;
    subject: string;
    includeSubmission: boolean;
  }>;

  /** Spam protection */
  spamProtection: {
    enabled: boolean;
    type: 'recaptcha-v3' | 'hcaptcha' | 'honeypot' | 'none';
    siteKey: string | null;
  };

  /** Rate limiting */
  rateLimit: {
    enabled: boolean;
    maxSubmissions: number;
    windowMinutes: number;
  };

  /** File upload settings */
  fileUpload: {
    enabled: boolean;
    maxFileSizeMb: number;
    allowedTypes: string[];
    maxFiles: number;
  };

  /** Multi-step form configuration */
  multiStep: {
    enabled: boolean;
    steps: Array<{
      title: string;
      description: string | null;
      fieldIds: string[];
    }>;
    showProgressBar: boolean;
    allowBackNavigation: boolean;
  };

  /** Store submissions in database */
  storeSubmissions: boolean;

  /** Webhook URL for submission forwarding */
  webhookUrl: string | null;

  /** CRM integration (push to @mcv/growth/crm) */
  crmIntegration: {
    enabled: boolean;
    pipelineId: string | null;
    fieldMapping: Record<string, string>;
  };
}

/** Form submission record */
interface FormSubmission {
  id: string;
  formId: string;
  siteId: string;
  ventureId: string;
  data: Record<string, unknown>;
  files: Array<{
    fieldName: string;
    fileName: string;
    fileUrl: string;
    fileSizeByte: number;
    mimeType: string;
  }>;
  metadata: {
    ipAddress: string | null;
    userAgent: string | null;
    referrer: string | null;
    pageUrl: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
  };
  status: 'new' | 'read' | 'replied' | 'archived' | 'spam';
  createdAt: string;
}
```

### Navigation

```typescript
/**
 * Represents a navigation menu that can be assigned to a site's
 * header, footer, sidebar, or any custom position.
 */
interface Navigation {
  /** Unique navigation identifier (ULID) */
  id: string;

  /** Parent site ID */
  siteId: string;

  /** Venture ID (denormalized for RLS) */
  ventureId: string;

  /** Navigation name (internal identifier) */
  name: string;

  /** Display position */
  position: NavigationPosition;

  /** Navigation items (tree structure) */
  items: NavigationItem[];

  /** Navigation style */
  style: NavigationStyle;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

/** Navigation item (supports nesting for dropdowns/mega menus) */
interface NavigationItem {
  /** Unique item ID */
  id: string;

  /** Display label */
  label: string;

  /** Link URL or path */
  url: string | null;

  /** Target page ID (internal link) */
  pageId: string | null;

  /** Link target ('_self' | '_blank') */
  target: '_self' | '_blank';

  /** Icon identifier */
  icon: string | null;

  /** Badge text (e.g., 'New', 'Beta') */
  badge: string | null;

  /** Badge color */
  badgeColor: string | null;

  /** Child items (for dropdowns) */
  children: NavigationItem[];

  /** Item visibility */
  visible: boolean;

  /** Description (for mega menus) */
  description: string | null;

  /** Image URL (for mega menus) */
  image: string | null;

  /** Sort order */
  sortOrder: number;

  /** Highlight/emphasize this item */
  highlighted: boolean;
}

/** Navigation style options */
interface NavigationStyle {
  /** Menu type */
  type: 'horizontal' | 'vertical' | 'mega' | 'hamburger';

  /** Sticky navigation */
  sticky: boolean;

  /** Transparent background (overlay on hero) */
  transparent: boolean;

  /** Show logo */
  showLogo: boolean;

  /** Show search */
  showSearch: boolean;

  /** Show CTA button */
  showCta: boolean;

  /** CTA button text */
  ctaText: string | null;

  /** CTA button URL */
  ctaUrl: string | null;

  /** Mobile breakpoint (in px) */
  mobileBreakpoint: number;

  /** Mobile menu style */
  mobileStyle: 'slide' | 'overlay' | 'dropdown';
}

type NavigationPosition = 'header' | 'footer' | 'sidebar' | 'mobile' | 'custom';
```

### MediaAsset

```typescript
/**
 * Represents a media file (image, video, document) stored in the
 * venture's media library.
 */
interface MediaAsset {
  /** Unique asset identifier (ULID) */
  id: string;

  /** Parent site ID (null = shared across sites) */
  siteId: string | null;

  /** Venture ID */
  ventureId: string;

  /** Original filename */
  fileName: string;

  /** Storage path in Supabase Storage */
  storagePath: string;

  /** Public URL */
  publicUrl: string;

  /** MIME type */
  mimeType: string;

  /** File size in bytes */
  fileSizeBytes: number;

  /** Media type classification */
  type: MediaType;

  /** Alt text (for images) */
  altText: string | null;

  /** Caption */
  caption: string | null;

  /** Image width (px, null for non-images) */
  width: number | null;

  /** Image height (px, null for non-images) */
  height: number | null;

  /** BlurHash placeholder (for images) */
  blurHash: string | null;

  /** Dominant color (hex) */
  dominantColor: string | null;

  /** Optimized variants */
  variants: MediaVariant[];

  /** User-assigned tags for organization */
  tags: string[];

  /** Folder path for organization */
  folder: string | null;

  /** Uploader user ID */
  uploadedBy: string;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

/** Optimized variant of a media asset */
interface MediaVariant {
  /** Variant label (e.g., 'thumbnail', 'medium', 'large', 'webp', 'avif') */
  label: string;

  /** Storage path */
  storagePath: string;

  /** Public URL */
  publicUrl: string;

  /** Width (px) */
  width: number;

  /** Height (px) */
  height: number;

  /** Format */
  format: ImageFormat;

  /** File size in bytes */
  fileSizeBytes: number;
}

type MediaType = 'image' | 'video' | 'audio' | 'document' | 'font' | 'other';

/** Image transformation parameters */
interface MediaTransform {
  /** Target width */
  width?: number;

  /** Target height */
  height?: number;

  /** Resize mode */
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

  /** Output format */
  format?: ImageFormat;

  /** Quality (1-100) */
  quality?: number;

  /** Blur amount (1-100) */
  blur?: number;

  /** Crop gravity/position */
  gravity?: 'center' | 'north' | 'south' | 'east' | 'west' | 'smart';
}
```

### WebsiteService

```typescript
/**
 * Main orchestrator service for the website module. Coordinates
 * between all sub-services and manages the site lifecycle.
 */
interface WebsiteService {
  // ── Site Management ──────────────────────────────────────────────────
  
  /** Create a new site for a venture */
  createSite(input: CreateSiteInput): Promise<Site>;

  /** Get a site by ID */
  getSite(siteId: string): Promise<Site>;

  /** List all sites for a venture */
  listSites(ventureId: string, query?: ListSitesQuery): Promise<PaginatedResult<Site>>;

  /** Update site configuration */
  updateSite(siteId: string, input: UpdateSiteInput): Promise<Site>;

  /** Delete a site (soft delete) */
  deleteSite(siteId: string): Promise<void>;

  /** Duplicate a site (clone all pages, components, config) */
  duplicateSite(siteId: string, newName: string): Promise<Site>;

  // ── Publishing & Deployment ──────────────────────────────────────────

  /** Trigger a full site build and deployment */
  deploySite(siteId: string): Promise<Deployment>;

  /** Get deployment status */
  getDeployment(deploymentId: string): Promise<Deployment>;

  /** List deployments for a site */
  listDeployments(siteId: string, query?: PaginationQuery): Promise<PaginatedResult<Deployment>>;

  /** Cancel a queued or in-progress deployment */
  cancelDeployment(deploymentId: string): Promise<void>;

  /** Rollback to a previous deployment */
  rollbackDeployment(siteId: string, deploymentId: string): Promise<Deployment>;

  /** Trigger incremental build for specific pages */
  deployPages(siteId: string, pageIds: string[]): Promise<Deployment>;

  // ── Domain Management ────────────────────────────────────────────────

  /** Add a custom domain to a site */
  addDomain(siteId: string, domain: string): Promise<Domain>;

  /** Verify domain DNS configuration */
  verifyDomain(domainId: string): Promise<Domain>;

  /** Remove a custom domain */
  removeDomain(domainId: string): Promise<void>;

  /** Provision or renew SSL certificate */
  provisionSSL(domainId: string): Promise<Domain>;

  /** Set primary domain */
  setPrimaryDomain(siteId: string, domainId: string): Promise<void>;

  // ── Analytics ────────────────────────────────────────────────────────

  /** Get site-wide analytics summary */
  getSiteAnalytics(siteId: string, query: AnalyticsQuery): Promise<SiteAnalyticsSummary>;

  /** Get page-level analytics */
  getPageAnalytics(pageId: string, query: AnalyticsQuery): Promise<PageAnalyticsData>;

  /** Get Core Web Vitals for a site */
  getCoreWebVitals(siteId: string): Promise<CoreWebVitals>;

  // ── Import / Export ──────────────────────────────────────────────────

  /** Export site as a portable bundle */
  exportSite(siteId: string): Promise<{ url: string; expiresAt: string }>;

  /** Import site from a bundle */
  importSite(ventureId: string, bundleUrl: string): Promise<Site>;

  /** Export site as static HTML/CSS/JS */
  exportStaticSite(siteId: string): Promise<{ url: string; expiresAt: string }>;
}
```

### PageVersion

```typescript
/**
 * Represents an immutable snapshot of a page at a point in time.
 * Every publish creates a new version. Versions enable rollback,
 * comparison, and audit trails.
 */
interface PageVersion {
  /** Unique version identifier (ULID) */
  id: string;

  /** Page ID */
  pageId: string;

  /** Version number (auto-incrementing per page) */
  versionNumber: number;

  /** Snapshot of the component tree (deep clone) */
  componentTree: ComponentTreeSnapshot;

  /** Snapshot of page metadata */
  metadata: {
    title: string;
    description: string | null;
    seo: PageSEO | null;
    openGraph: OpenGraphData | null;
    layout: PageLayout;
  };

  /** Version label (e.g., 'v1.0', 'Pre-launch') */
  label: string | null;

  /** Change description */
  changeDescription: string | null;

  /** User who created this version */
  createdBy: string;

  /** Whether this version is/was published */
  isPublished: boolean;

  /** Published timestamp (null if never published) */
  publishedAt: string | null;

  /** Created timestamp */
  createdAt: string;
}

/** Serialized component tree for versioning */
interface ComponentTreeSnapshot {
  /** Root component */
  root: ComponentSnapshot;
}

interface ComponentSnapshot {
  id: string;
  type: ComponentType;
  name: string;
  props: ComponentProps;
  styles: ComponentStyles;
  children: ComponentSnapshot[];
  visible: boolean;
  responsiveVisibility: { desktop: boolean; tablet: boolean; mobile: boolean };
}
```

### ABTest

```typescript
/**
 * Represents an A/B test experiment. Tests can target entire pages
 * or individual components within a page.
 */
interface ABTest {
  /** Unique test identifier (ULID) */
  id: string;

  /** Parent site ID */
  siteId: string;

  /** Venture ID */
  ventureId: string;

  /** Test name */
  name: string;

  /** Test description */
  description: string | null;

  /** Test type */
  type: 'page' | 'component';

  /** Target page ID */
  pageId: string;

  /** Target component ID (for component-level tests) */
  componentId: string | null;

  /** Test variants */
  variants: ABTestVariant[];

  /** Test status */
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';

  /** Goal metric */
  goal: {
    type: 'click' | 'form-submission' | 'page-view' | 'scroll-depth' | 'time-on-page' | 'custom';
    targetSelector: string | null;
    targetUrl: string | null;
    customEventName: string | null;
  };

  /** Minimum sample size per variant */
  minSampleSize: number;

  /** Statistical confidence level (e.g., 0.95) */
  confidenceLevel: number;

  /** Test results (populated when completed) */
  results: ABTestResult | null;

  /** Started timestamp */
  startedAt: string | null;

  /** Completed timestamp */
  completedAt: string | null;

  /** Created timestamp */
  createdAt: string;

  /** Updated timestamp */
  updatedAt: string;
}

/** A/B test variant */
interface ABTestVariant {
  id: string;
  name: string;
  description: string | null;
  /** Traffic allocation percentage (0-100) */
  trafficPercent: number;
  /** Whether this is the control variant */
  isControl: boolean;
  /** Page version ID (for page-level tests) */
  pageVersionId: string | null;
  /** Component override props (for component-level tests) */
  componentOverrides: Partial<ComponentProps> | null;
  /** Impressions count */
  impressions: number;
  /** Conversions count */
  conversions: number;
  /** Conversion rate */
  conversionRate: number;
}

/** A/B test statistical results */
interface ABTestResult {
  /** Winning variant ID (null if inconclusive) */
  winnerId: string | null;
  /** Whether the test reached statistical significance */
  isSignificant: boolean;
  /** Observed confidence level */
  observedConfidence: number;
  /** Per-variant stats */
  variantStats: Array<{
    variantId: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
    improvementOverControl: number | null;
    pValue: number | null;
    confidenceInterval: { lower: number; upper: number } | null;
  }>;
  /** Duration of the test (days) */
  durationDays: number;
}
```

### Deployment

```typescript
/**
 * Represents a site deployment record. Tracks build progress,
 * output artifacts, and deployment status.
 */
interface Deployment {
  /** Unique deployment identifier (ULID) */
  id: string;

  /** Site ID */
  siteId: string;

  /** Venture ID */
  ventureId: string;

  /** Deployment status */
  status: DeploymentStatus;

  /** Deployment type */
  type: 'full' | 'incremental' | 'rollback';

  /** Page IDs included (null = all pages) */
  pageIds: string[] | null;

  /** Build log output */
  buildLog: string | null;

  /** Build duration in milliseconds */
  buildDurationMs: number | null;

  /** Output bundle URL */
  bundleUrl: string | null;

  /** Number of pages built */
  pagesBuilt: number | null;

  /** Number of assets optimized */
  assetsOptimized: number | null;

  /** Total bundle size in bytes */
  bundleSizeBytes: number | null;

  /** Deployment URL (live URL) */
  deploymentUrl: string | null;

  /** Error message (if failed) */
  errorMessage: string | null;

  /** Triggered by user ID */
  triggeredBy: string;

  /** Started timestamp */
  startedAt: string | null;

  /** Completed timestamp */
  completedAt: string | null;

  /** Created timestamp */
  createdAt: string;
}
```

---

## Database Schemas

### sites

```sql
CREATE TABLE sites (
  id              TEXT PRIMARY KEY DEFAULT generate_ulid(),
  venture_id      TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT,
  theme_id        TEXT REFERENCES themes(id) ON DELETE SET NULL,
  config          JSONB NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'archived', 'suspended')),
  default_locale  TEXT NOT NULL DEFAULT 'en-US',
  enabled_locales TEXT[] NOT NULL DEFAULT ARRAY['en-US'],
  favicon_url     TEXT,
  social_image_url TEXT,
  custom_css      TEXT,
  custom_js       TEXT,
  custom_head     TEXT,
  ga_id           TEXT,
  gtm_id          TEXT,
  last_deployed_at TIMESTAMPTZ,
  last_deploy_status TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,

  UNIQUE (venture_id, slug)
);

-- RLS policy: users can only access sites belonging to their venture
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY sites_venture_isolation ON sites
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_sites_venture_id ON sites(venture_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_slug ON sites(venture_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_status ON sites(venture_id, status) WHERE deleted_at IS NULL;
```

### pages

```sql
CREATE TABLE pages (
  id                  TEXT PRIMARY KEY DEFAULT generate_ulid(),
  site_id             TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  venture_id          TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  slug                TEXT NOT NULL,
  path                TEXT NOT NULL,
  description         TEXT,
  layout              TEXT NOT NULL DEFAULT 'default'
                        CHECK (layout IN ('default', 'full-width', 'sidebar-left',
                          'sidebar-right', 'landing', 'blog-post', 'blank')),
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  component_tree_id   TEXT,
  published_version_id TEXT REFERENCES page_versions(id),
  draft_version_id    TEXT REFERENCES page_versions(id),
  seo                 JSONB,
  open_graph          JSONB,
  featured_image      TEXT,
  parent_id           TEXT REFERENCES pages(id) ON DELETE SET NULL,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  locale              TEXT,
  canonical_page_id   TEXT REFERENCES pages(id) ON DELETE SET NULL,
  scheduled_at        TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  author_id           TEXT,
  indexable           BOOLEAN NOT NULL DEFAULT true,
  custom_css          TEXT,
  custom_js           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ,

  UNIQUE (site_id, path, locale)
);

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY pages_venture_isolation ON pages
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_pages_site_id ON pages(site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_path ON pages(site_id, path) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_status ON pages(site_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_parent ON pages(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_locale ON pages(site_id, locale) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_scheduled ON pages(scheduled_at) WHERE status = 'scheduled' AND deleted_at IS NULL;
```

### page_components

```sql
CREATE TABLE page_components (
  id                    TEXT PRIMARY KEY DEFAULT generate_ulid(),
  page_id               TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL,
  name                  TEXT NOT NULL DEFAULT '',
  props                 JSONB NOT NULL DEFAULT '{}',
  styles                JSONB NOT NULL DEFAULT '{}',
  children              TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  parent_id             TEXT REFERENCES page_components(id) ON DELETE CASCADE,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  visible               BOOLEAN NOT NULL DEFAULT true,
  responsive_visibility JSONB NOT NULL DEFAULT '{"desktop":true,"tablet":true,"mobile":true}',
  locked                BOOLEAN NOT NULL DEFAULT false,
  ab_test_variant_id    TEXT,
  locale_overrides      JSONB NOT NULL DEFAULT '{}',
  animation             JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE page_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_components_via_pages ON page_components
  USING (page_id IN (
    SELECT id FROM pages WHERE venture_id = current_setting('app.current_venture_id')::TEXT
  ));

CREATE INDEX idx_page_components_page ON page_components(page_id);
CREATE INDEX idx_page_components_parent ON page_components(parent_id);
CREATE INDEX idx_page_components_type ON page_components(page_id, type);
```

### page_versions

```sql
CREATE TABLE page_versions (
  id                TEXT PRIMARY KEY DEFAULT generate_ulid(),
  page_id           TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  version_number    INTEGER NOT NULL,
  component_tree    JSONB NOT NULL,
  metadata          JSONB NOT NULL,
  label             TEXT,
  change_description TEXT,
  created_by        TEXT NOT NULL,
  is_published      BOOLEAN NOT NULL DEFAULT false,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (page_id, version_number)
);

ALTER TABLE page_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_versions_via_pages ON page_versions
  USING (page_id IN (
    SELECT id FROM pages WHERE venture_id = current_setting('app.current_venture_id')::TEXT
  ));

CREATE INDEX idx_page_versions_page ON page_versions(page_id);
CREATE INDEX idx_page_versions_published ON page_versions(page_id) WHERE is_published = true;
```

### themes

```sql
CREATE TABLE themes (
  id              TEXT PRIMARY KEY DEFAULT generate_ulid(),
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL DEFAULT 'custom'
                    CHECK (category IN ('saas', 'ecommerce', 'agency', 'portfolio',
                      'blog', 'startup', 'corporate', 'nonprofit', 'education',
                      'healthcare', 'restaurant', 'real-estate', 'custom')),
  preview_url     TEXT,
  is_system       BOOLEAN NOT NULL DEFAULT false,
  venture_id      TEXT REFERENCES ventures(id) ON DELETE CASCADE,
  config          JSONB NOT NULL DEFAULT '{}',
  parent_theme_id TEXT REFERENCES themes(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY themes_access ON themes
  USING (
    is_system = true OR
    venture_id = current_setting('app.current_venture_id')::TEXT
  );

CREATE INDEX idx_themes_venture ON themes(venture_id);
CREATE INDEX idx_themes_category ON themes(category);
CREATE INDEX idx_themes_system ON themes(is_system) WHERE is_system = true;
```

### blog_posts

```sql
CREATE TABLE blog_posts (
  id                TEXT PRIMARY KEY DEFAULT generate_ulid(),
  site_id           TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  venture_id        TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  excerpt           TEXT,
  content           JSONB NOT NULL DEFAULT '{}',
  content_plain_text TEXT NOT NULL DEFAULT '',
  featured_image    TEXT,
  featured_image_alt TEXT,
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'review', 'published', 'scheduled', 'archived')),
  author_id         TEXT NOT NULL,
  author_name       TEXT NOT NULL,
  author_avatar     TEXT,
  author_bio        TEXT,
  category_id       TEXT REFERENCES blog_categories(id) ON DELETE SET NULL,
  reading_time      INTEGER NOT NULL DEFAULT 0,
  word_count        INTEGER NOT NULL DEFAULT 0,
  seo               JSONB,
  open_graph        JSONB,
  locale            TEXT,
  canonical_post_id TEXT REFERENCES blog_posts(id) ON DELETE SET NULL,
  comments_enabled  BOOLEAN NOT NULL DEFAULT true,
  comment_count     INTEGER NOT NULL DEFAULT 0,
  view_count        INTEGER NOT NULL DEFAULT 0,
  scheduled_at      TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,

  UNIQUE (site_id, slug, locale)
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY blog_posts_venture_isolation ON blog_posts
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_blog_posts_site ON blog_posts(site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_blog_posts_status ON blog_posts(site_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_blog_posts_published ON blog_posts(site_id, published_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_blog_posts_scheduled ON blog_posts(scheduled_at)
  WHERE status = 'scheduled' AND deleted_at IS NULL;
CREATE INDEX idx_blog_posts_fts ON blog_posts USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_plain_text, ''))
);
```

### blog_categories

```sql
CREATE TABLE blog_categories (
  id          TEXT PRIMARY KEY DEFAULT generate_ulid(),
  site_id     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  venture_id  TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  description TEXT,
  parent_id   TEXT REFERENCES blog_categories(id) ON DELETE SET NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  post_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (site_id, slug)
);

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY blog_categories_venture ON blog_categories
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_blog_categories_site ON blog_categories(site_id);
```

### blog_tags

```sql
CREATE TABLE blog_tags (
  id         TEXT PRIMARY KEY DEFAULT generate_ulid(),
  site_id    TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (site_id, slug)
);

ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY blog_tags_venture ON blog_tags
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_blog_tags_site ON blog_tags(site_id);
```

### blog_post_tags

```sql
CREATE TABLE blog_post_tags (
  post_id TEXT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_blog_post_tags_tag ON blog_post_tags(tag_id);
```

### blog_comments

```sql
CREATE TABLE blog_comments (
  id                TEXT PRIMARY KEY DEFAULT generate_ulid(),
  post_id           TEXT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  site_id           TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  venture_id        TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  author_name       TEXT NOT NULL,
  author_email      TEXT NOT NULL,
  author_url        TEXT,
  content           TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'spam', 'rejected')),
  parent_comment_id TEXT REFERENCES blog_comments(id) ON DELETE CASCADE,
  ip_address        INET,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY blog_comments_venture ON blog_comments
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_status ON blog_comments(post_id, status);
CREATE INDEX idx_blog_comments_parent ON blog_comments(parent_comment_id);
```

### forms

```sql
CREATE TABLE forms (
  id               TEXT PRIMARY KEY DEFAULT generate_ulid(),
  site_id          TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  venture_id       TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  title            TEXT,
  description      TEXT,
  fields           JSONB NOT NULL DEFAULT '[]',
  config           JSONB NOT NULL DEFAULT '{}',
  submission_count INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'paused', 'archived')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY forms_venture ON forms
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_forms_site ON forms(site_id);
CREATE INDEX idx_forms_status ON forms(site_id, status);
```

### form_submissions

```sql
CREATE TABLE form_submissions (
  id         TEXT PRIMARY KEY DEFAULT generate_ulid(),
  form_id    TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  site_id    TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  data       JSONB NOT NULL DEFAULT '{}',
  files      JSONB NOT NULL DEFAULT '[]',
  metadata   JSONB NOT NULL DEFAULT '{}',
  status     TEXT NOT NULL DEFAULT 'new'
               CHECK (status IN ('new', 'read', 'replied', 'archived', 'spam')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY form_submissions_venture ON form_submissions
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(form_id, status);
CREATE INDEX idx_form_submissions_created ON form_submissions(form_id, created_at DESC);
```

### navigation_menus

```sql
CREATE TABLE navigation_menus (
  id         TEXT PRIMARY KEY DEFAULT generate_ulid(),
  site_id    TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  position   TEXT NOT NULL DEFAULT 'header'
               CHECK (position IN ('header', 'footer', 'sidebar', 'mobile', 'custom')),
  items      JSONB NOT NULL DEFAULT '[]',
  style      JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE navigation_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY navigation_menus_venture ON navigation_menus
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_navigation_menus_site ON navigation_menus(site_id);
CREATE INDEX idx_navigation_menus_position ON navigation_menus(site_id, position);
```

### media_assets

```sql
CREATE TABLE media_assets (
  id              TEXT PRIMARY KEY DEFAULT generate_ulid(),
  site_id         TEXT REFERENCES sites(id) ON DELETE SET NULL,
  venture_id      TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  public_url      TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'other'
                    CHECK (type IN ('image', 'video', 'audio', 'document', 'font', 'other')),
  alt_text        TEXT,
  caption         TEXT,
  width           INTEGER,
  height          INTEGER,
  blur_hash       TEXT,
  dominant_color  TEXT,
  variants        JSONB NOT NULL DEFAULT '[]',
  tags            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  folder          TEXT,
  uploaded_by     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_assets_venture ON media_assets
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_media_assets_venture ON media_assets(venture_id);
CREATE INDEX idx_media_assets_site ON media_assets(site_id);
CREATE INDEX idx_media_assets_type ON media_assets(venture_id, type);
CREATE INDEX idx_media_assets_folder ON media_assets(venture_id, folder);
CREATE INDEX idx_media_assets_tags ON media_assets USING gin(tags);
```

### site_domains

```sql
CREATE TABLE site_domains (
  id           TEXT PRIMARY KEY DEFAULT generate_ulid(),
  site_id      TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  venture_id   TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  domain       TEXT NOT NULL UNIQUE,
  is_primary   BOOLEAN NOT NULL DEFAULT false,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'verifying', 'active', 'failed', 'expired')),
  ssl_status   TEXT NOT NULL DEFAULT 'none'
                 CHECK (ssl_status IN ('none', 'provisioning', 'active', 'expired', 'failed')),
  ssl_expires_at TIMESTAMPTZ,
  verification_type TEXT DEFAULT 'cname'
                      CHECK (verification_type IN ('cname', 'txt', 'http')),
  verification_token TEXT,
  verified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE site_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_domains_venture ON site_domains
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_site_domains_site ON site_domains(site_id);
CREATE INDEX idx_site_domains_domain ON site_domains(domain);
CREATE INDEX idx_site_domains_ssl ON site_domains(ssl_expires_at)
  WHERE ssl_status = 'active';
```

### site_locales

```sql
CREATE TABLE site_locales (
  id          TEXT PRIMARY KEY DEFAULT generate_ulid(),
  site_id     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  venture_id  TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  locale_code TEXT NOT NULL,
  name        TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  is_rtl      BOOLEAN NOT NULL DEFAULT false,
  enabled     BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (site_id, locale_code)
);

ALTER TABLE site_locales ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_locales_venture ON site_locales
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_site_locales_site ON site_locales(site_id);
```

### translations

```sql
CREATE TABLE translations (
  id          TEXT PRIMARY KEY DEFAULT generate_ulid(),
  site_id     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  venture_id  TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  locale_code TEXT NOT NULL,
  namespace   TEXT NOT NULL DEFAULT 'common',
  key         TEXT NOT NULL,
  value       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'review', 'approved', 'published')),
  translated_by TEXT,
  approved_by TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (site_id, locale_code, namespace, key)
);

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY translations_venture ON translations
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_translations_site_locale ON translations(site_id, locale_code);
CREATE INDEX idx_translations_namespace ON translations(site_id, locale_code, namespace);
CREATE INDEX idx_translations_status ON translations(site_id, status);
```

### ab_tests

```sql
CREATE TABLE ab_tests (
  id               TEXT PRIMARY KEY DEFAULT generate_ulid(),
  site_id          TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  venture_id       TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  type             TEXT NOT NULL DEFAULT 'page'
                     CHECK (type IN ('page', 'component')),
  page_id          TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  component_id     TEXT,
  variants         JSONB NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived')),
  goal             JSONB NOT NULL DEFAULT '{}',
  min_sample_size  INTEGER NOT NULL DEFAULT 1000,
  confidence_level NUMERIC(3,2) NOT NULL DEFAULT 0.95,
  results          JSONB,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY ab_tests_venture ON ab_tests
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_ab_tests_site ON ab_tests(site_id);
CREATE INDEX idx_ab_tests_page ON ab_tests(page_id);
CREATE INDEX idx_ab_tests_status ON ab_tests(site_id, status);
```

### page_analytics

```sql
CREATE TABLE page_analytics (
  id          TEXT PRIMARY KEY DEFAULT generate_ulid(),
  page_id     TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  site_id     TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  venture_id  TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  views       INTEGER NOT NULL DEFAULT 0,
  unique_views INTEGER NOT NULL DEFAULT 0,
  avg_time_on_page_ms INTEGER DEFAULT 0,
  bounce_rate NUMERIC(5,4) DEFAULT 0,
  scroll_depth_avg NUMERIC(5,2) DEFAULT 0,
  click_data  JSONB DEFAULT '[]',
  referrers   JSONB DEFAULT '{}',
  devices     JSONB DEFAULT '{}',
  countries   JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (page_id, date)
);

ALTER TABLE page_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_analytics_venture ON page_analytics
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);

CREATE INDEX idx_page_analytics_page_date ON page_analytics(page_id, date DESC);
CREATE INDEX idx_page_analytics_site_date ON page_analytics(site_id, date DESC);
```

### component_templates

```sql
CREATE TABLE component_templates (
  id          TEXT PRIMARY KEY DEFAULT generate_ulid(),
  venture_id  TEXT REFERENCES ventures(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'custom',
  props       JSONB NOT NULL DEFAULT '{}',
  styles      JSONB NOT NULL DEFAULT '{}',
  children    JSONB DEFAULT '[]',
  preview_url TEXT,
  is_system   BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE component_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY component_templates_access ON component_templates
  USING (
    is_system = true OR
    venture_id = current_setting('app.current_venture_id')::TEXT
  );

CREATE INDEX idx_component_templates_venture ON component_templates(venture_id);
CREATE INDEX idx_component_templates_type ON component_templates(type);
CREATE INDEX idx_component_templates_category ON component_templates(category);
```

---

## Code Examples

### Example 1: Creating a Site and Adding Pages

```typescript
import { WebsiteService, PageService, PageBuilderService } from '@mcv/growth/website';

/**
 * Create a new marketing site for a venture with a landing page
 * and an about page.
 */
async function createMarketingSite(ventureId: string, userId: string) {
  const websiteService = new WebsiteService();
  const pageService = new PageService();
  const pageBuilder = new PageBuilderService();

  // 1. Create the site
  const site = await websiteService.createSite({
    ventureId,
    name: 'Acme Corp Marketing',
    slug: 'acme-corp',
    description: 'Main marketing website for Acme Corp',
    config: {
      title: 'Acme Corp',
      tagline: 'Building the future of widgets',
      baseUrl: 'https://acme.com',
      defaultLayout: 'default',
      blogEnabled: true,
      blogPrefix: '/blog',
      blogPostsPerPage: 12,
      commentsEnabled: true,
      commentModeration: 'pre',
      rssEnabled: true,
      build: {
        framework: 'nextjs',
        outputDir: '_site',
        incrementalBuilds: true,
        imageOptimization: {
          enabled: true,
          formats: ['webp', 'avif'],
          quality: 85,
          maxWidth: 2048,
          generateBlurHash: true,
        },
        minify: { html: true, css: true, js: true },
        assetCacheMaxAge: 31536000,  // 1 year
        pageCacheMaxAge: 3600,       // 1 hour
      },
      seo: {
        titleTemplate: '%s | Acme Corp',
        defaultDescription: 'Acme Corp — the world leader in widget technology.',
        twitterCardType: 'summary_large_image',
        twitterHandle: '@acmecorp',
        sitemapEnabled: true,
        structuredDataEnabled: true,
        robots: { allowAll: true, disallowPaths: ['/admin', '/preview'], customRules: null },
        organization: {
          name: 'Acme Corp',
          logo: 'https://acme.com/logo.png',
          url: 'https://acme.com',
          sameAs: [
            'https://twitter.com/acmecorp',
            'https://linkedin.com/company/acme-corp',
          ],
        },
        defaultOgImage: null,
      },
      notFoundPageId: null,
      redirects: [],
      customHeaders: {},
      passwordProtected: false,
      passwordHash: null,
    },
  });

  console.log(`Created site: ${site.id} (${site.slug})`);

  // 2. Create the landing page
  const landingPage = await pageService.createPage({
    siteId: site.id,
    title: 'Home',
    slug: '',
    path: '/',
    layout: 'landing',
    authorId: userId,
  });

  // 3. Build the landing page component tree
  await pageBuilder.buildPage(landingPage.id, [
    {
      type: 'hero',
      name: 'Main Hero',
      props: {
        title: 'Build Better Widgets, Faster',
        subtitle: 'Acme Corp provides enterprise-grade widget infrastructure for teams of all sizes.',
        ctaText: 'Get Started Free',
        ctaUrl: '/signup',
        secondaryCtaText: 'Watch Demo',
        secondaryCtaUrl: '/demo',
        backgroundImage: 'https://acme.com/hero-bg.jpg',
        alignment: 'center',
        size: 'large',
      },
    },
    {
      type: 'logo-cloud',
      name: 'Trusted By',
      props: {
        title: 'Trusted by industry leaders',
        logos: [
          { src: '/logos/stripe.svg', alt: 'Stripe', url: null },
          { src: '/logos/vercel.svg', alt: 'Vercel', url: null },
          { src: '/logos/notion.svg', alt: 'Notion', url: null },
          { src: '/logos/linear.svg', alt: 'Linear', url: null },
        ],
        variant: 'grayscale',
      },
    },
    {
      type: 'features',
      name: 'Key Features',
      props: {
        title: 'Everything you need',
        subtitle: 'A complete toolkit for modern widget development.',
        layout: 'grid-3',
        features: [
          {
            icon: 'zap',
            title: 'Lightning Fast',
            description: 'Sub-millisecond response times with our edge-optimized infrastructure.',
          },
          {
            icon: 'shield',
            title: 'Enterprise Security',
            description: 'SOC 2 Type II certified with end-to-end encryption.',
          },
          {
            icon: 'code',
            title: 'Developer First',
            description: 'Beautiful APIs, comprehensive SDKs, and extensive documentation.',
          },
        ],
      },
    },
    {
      type: 'cta',
      name: 'Bottom CTA',
      props: {
        title: 'Ready to get started?',
        description: 'Join 10,000+ teams already using Acme Corp.',
        ctaText: 'Start Free Trial',
        ctaUrl: '/signup',
        variant: 'gradient',
      },
    },
  ]);

  // 4. Create an about page
  const aboutPage = await pageService.createPage({
    siteId: site.id,
    title: 'About Us',
    slug: 'about',
    path: '/about',
    layout: 'default',
    authorId: userId,
    description: 'Learn about the Acme Corp team and mission.',
  });

  // 5. Publish both pages
  await pageService.publishPage(landingPage.id, {
    createdBy: userId,
    changeDescription: 'Initial launch',
  });

  await pageService.publishPage(aboutPage.id, {
    createdBy: userId,
    changeDescription: 'Initial launch',
  });

  // 6. Deploy the site
  const deployment = await websiteService.deploySite(site.id);
  console.log(`Deployment queued: ${deployment.id} (status: ${deployment.status})`);

  return { site, landingPage, aboutPage, deployment };
}
```

### Example 2: Blog Post Management

```typescript
import { BlogService } from '@mcv/growth/website';

/**
 * Create and manage blog content — categories, posts, and RSS.
 */
async function manageBlogContent(siteId: string, authorId: string) {
  const blog = new BlogService();

  // 1. Create categories
  const engineeringCategory = await blog.createCategory({
    siteId,
    name: 'Engineering',
    slug: 'engineering',
    description: 'Technical deep-dives and engineering updates',
  });

  const productCategory = await blog.createCategory({
    siteId,
    name: 'Product',
    slug: 'product',
    description: 'Product announcements and updates',
  });

  // 2. Create tags
  const tags = await Promise.all([
    blog.createTag({ siteId, name: 'TypeScript', slug: 'typescript' }),
    blog.createTag({ siteId, name: 'Performance', slug: 'performance' }),
    blog.createTag({ siteId, name: 'Launch', slug: 'launch' }),
  ]);

  // 3. Create a blog post
  const post = await blog.createPost({
    siteId,
    title: 'How We Reduced API Latency by 90%',
    slug: 'reduced-api-latency-90-percent',
    excerpt: 'A deep dive into the architectural changes that brought our p99 latency from 500ms to 50ms.',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'The Problem' }],
        },
        {
          type: 'paragraph',
          content: [{
            type: 'text',
            text: 'When we started scaling to 10,000+ requests per second, our API latency began creeping up...',
          }],
        },
        // ... more TipTap/ProseMirror content nodes
      ],
    },
    featuredImage: 'https://acme.com/blog/latency-hero.jpg',
    featuredImageAlt: 'Graph showing latency reduction over time',
    authorId,
    categoryId: engineeringCategory.id,
    tagIds: [tags[0].id, tags[1].id],  // TypeScript, Performance
    commentsEnabled: true,
    seo: {
      title: 'How We Reduced API Latency by 90% — Engineering Blog',
      description: 'Learn the architectural techniques we used to cut p99 latency from 500ms to 50ms.',
      focusKeyword: 'API latency optimization',
      noIndex: false,
      noFollow: false,
      canonicalUrl: null,
      metaTags: [],
    },
  });

  console.log(`Draft post created: ${post.id} (${post.readingTime} min read, ${post.wordCount} words)`);

  // 4. Publish the post
  const publishedPost = await blog.publishPost(post.id);
  console.log(`Post published at: ${publishedPost.publishedAt}`);

  // 5. Schedule a future post
  const scheduledPost = await blog.createPost({
    siteId,
    title: 'Announcing Acme Corp 2.0',
    slug: 'announcing-acme-corp-2',
    excerpt: 'The biggest update in our history is here.',
    content: { type: 'doc', content: [] },
    authorId,
    categoryId: productCategory.id,
    tagIds: [tags[2].id],  // Launch
    scheduledAt: '2026-03-01T09:00:00Z',
  });

  console.log(`Post scheduled for: ${scheduledPost.scheduledAt}`);

  // 6. List published posts with pagination
  const publishedPosts = await blog.listPosts({
    siteId,
    status: 'published',
    page: 1,
    perPage: 10,
    orderBy: 'publishedAt',
    orderDir: 'desc',
  });

  console.log(`Found ${publishedPosts.total} published posts`);

  // 7. Generate RSS feed
  const rssFeed = await blog.generateRSSFeed(siteId, {
    title: 'Acme Corp Blog',
    description: 'Engineering and product updates from Acme Corp',
    link: 'https://acme.com/blog',
    language: 'en-US',
    maxItems: 20,
  });

  console.log(`RSS feed generated: ${rssFeed.length} bytes`);

  // 8. Search posts (full-text)
  const searchResults = await blog.searchPosts({
    siteId,
    query: 'latency optimization',
    status: 'published',
  });

  console.log(`Search found ${searchResults.total} results`);

  return { post, scheduledPost, publishedPosts };
}
```

### Example 3: Form Builder with Conditional Logic

```typescript
import { FormService } from '@mcv/growth/website';

/**
 * Create a multi-step contact form with conditional logic,
 * file uploads, and CRM integration.
 */
async function createContactForm(siteId: string) {
  const formService = new FormService();

  const form = await formService.createForm({
    siteId,
    name: 'enterprise-contact',
    title: 'Contact Our Sales Team',
    description: 'Tell us about your project and we\'ll get back to you within 24 hours.',
    fields: [
      // Step 1: Basic Info
      {
        id: 'first_name',
        type: 'text',
        label: 'First Name',
        name: 'firstName',
        placeholder: 'John',
        required: true,
        validation: [
          { type: 'minLength', value: 2, message: 'Name must be at least 2 characters' },
        ],
        width: 'half',
        sortOrder: 0,
        helpText: null,
        defaultValue: null,
        options: null,
        conditionalLogic: null,
        className: null,
      },
      {
        id: 'last_name',
        type: 'text',
        label: 'Last Name',
        name: 'lastName',
        placeholder: 'Doe',
        required: true,
        validation: [
          { type: 'minLength', value: 2, message: 'Name must be at least 2 characters' },
        ],
        width: 'half',
        sortOrder: 1,
        helpText: null,
        defaultValue: null,
        options: null,
        conditionalLogic: null,
        className: null,
      },
      {
        id: 'email',
        type: 'email',
        label: 'Work Email',
        name: 'email',
        placeholder: 'john@company.com',
        required: true,
        validation: [
          { type: 'email', value: '', message: 'Please enter a valid email address' },
        ],
        width: 'full',
        sortOrder: 2,
        helpText: 'We\'ll use this to respond to your inquiry',
        defaultValue: null,
        options: null,
        conditionalLogic: null,
        className: null,
      },
      {
        id: 'company',
        type: 'text',
        label: 'Company',
        name: 'company',
        placeholder: 'Acme Inc.',
        required: true,
        validation: [],
        width: 'half',
        sortOrder: 3,
        helpText: null,
        defaultValue: null,
        options: null,
        conditionalLogic: null,
        className: null,
      },
      {
        id: 'company_size',
        type: 'select',
        label: 'Company Size',
        name: 'companySize',
        placeholder: 'Select...',
        required: true,
        validation: [],
        options: [
          { label: '1-10 employees', value: '1-10' },
          { label: '11-50 employees', value: '11-50' },
          { label: '51-200 employees', value: '51-200' },
          { label: '201-1000 employees', value: '201-1000' },
          { label: '1000+ employees', value: '1000+' },
        ],
        width: 'half',
        sortOrder: 4,
        helpText: null,
        defaultValue: null,
        conditionalLogic: null,
        className: null,
      },
      // Step 2: Project Details
      {
        id: 'interest',
        type: 'radio',
        label: 'What are you interested in?',
        name: 'interest',
        required: true,
        validation: [],
        options: [
          { label: 'New implementation', value: 'new' },
          { label: 'Migration from another platform', value: 'migration' },
          { label: 'Enterprise plan upgrade', value: 'upgrade' },
          { label: 'Partnership / integration', value: 'partnership' },
          { label: 'Other', value: 'other' },
        ],
        width: 'full',
        sortOrder: 5,
        placeholder: null,
        helpText: null,
        defaultValue: null,
        conditionalLogic: null,
        className: null,
      },
      {
        id: 'current_platform',
        type: 'text',
        label: 'Current Platform',
        name: 'currentPlatform',
        placeholder: 'e.g., WordPress, Webflow, custom',
        required: false,
        validation: [],
        width: 'full',
        sortOrder: 6,
        helpText: 'Tell us what you\'re migrating from',
        defaultValue: null,
        options: null,
        conditionalLogic: {
          action: 'show',
          operator: 'and',
          conditions: [
            { fieldId: 'interest', comparison: 'equals', value: 'migration' },
          ],
        },
        className: null,
      },
      {
        id: 'other_interest',
        type: 'textarea',
        label: 'Please describe',
        name: 'otherInterest',
        placeholder: 'Tell us more...',
        required: true,
        validation: [
          { type: 'minLength', value: 10, message: 'Please provide more details' },
        ],
        width: 'full',
        sortOrder: 7,
        helpText: null,
        defaultValue: null,
        options: null,
        conditionalLogic: {
          action: 'show',
          operator: 'and',
          conditions: [
            { fieldId: 'interest', comparison: 'equals', value: 'other' },
          ],
        },
        className: null,
      },
      // Step 3: Additional Info
      {
        id: 'budget',
        type: 'select',
        label: 'Budget Range',
        name: 'budget',
        required: false,
        validation: [],
        options: [
          { label: 'Under $5,000', value: '<5k' },
          { label: '$5,000 - $25,000', value: '5k-25k' },
          { label: '$25,000 - $100,000', value: '25k-100k' },
          { label: '$100,000+', value: '100k+' },
          { label: 'Not sure yet', value: 'unsure' },
        ],
        width: 'half',
        sortOrder: 8,
        placeholder: 'Select...',
        helpText: null,
        defaultValue: null,
        conditionalLogic: null,
        className: null,
      },
      {
        id: 'timeline',
        type: 'select',
        label: 'Timeline',
        name: 'timeline',
        required: false,
        validation: [],
        options: [
          { label: 'ASAP', value: 'asap' },
          { label: '1-3 months', value: '1-3m' },
          { label: '3-6 months', value: '3-6m' },
          { label: '6+ months', value: '6m+' },
          { label: 'Just exploring', value: 'exploring' },
        ],
        width: 'half',
        sortOrder: 9,
        placeholder: 'Select...',
        helpText: null,
        defaultValue: null,
        conditionalLogic: null,
        className: null,
      },
      {
        id: 'message',
        type: 'textarea',
        label: 'Message',
        name: 'message',
        placeholder: 'Tell us about your project, goals, and any questions...',
        required: false,
        validation: [
          { type: 'maxLength', value: 5000, message: 'Message too long (max 5000 characters)' },
        ],
        width: 'full',
        sortOrder: 10,
        helpText: null,
        defaultValue: null,
        options: null,
        conditionalLogic: null,
        className: null,
      },
      {
        id: 'attachment',
        type: 'file',
        label: 'Attach a file (optional)',
        name: 'attachment',
        required: false,
        validation: [],
        width: 'full',
        sortOrder: 11,
        placeholder: null,
        helpText: 'PDF, DOC, or images up to 10MB',
        defaultValue: null,
        options: null,
        conditionalLogic: null,
        className: null,
      },
    ],
    config: {
      submitButtonText: 'Send Message',
      submitButtonStyle: 'primary',
      successMessage: 'Thank you! We\'ll be in touch within 24 hours.',
      redirectUrl: null,
      notifications: [
        {
          to: 'sales@acme.com',
          subject: 'New Enterprise Contact: {{firstName}} {{lastName}} from {{company}}',
          includeSubmission: true,
        },
      ],
      spamProtection: {
        enabled: true,
        type: 'recaptcha-v3',
        siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
      },
      rateLimit: {
        enabled: true,
        maxSubmissions: 5,
        windowMinutes: 60,
      },
      fileUpload: {
        enabled: true,
        maxFileSizeMb: 10,
        allowedTypes: ['application/pdf', 'application/msword', 'image/png', 'image/jpeg'],
        maxFiles: 3,
      },
      multiStep: {
        enabled: true,
        steps: [
          {
            title: 'Your Info',
            description: 'Basic contact information',
            fieldIds: ['first_name', 'last_name', 'email', 'company', 'company_size'],
          },
          {
            title: 'Your Project',
            description: 'Tell us what you need',
            fieldIds: ['interest', 'current_platform', 'other_interest'],
          },
          {
            title: 'Details',
            description: 'Budget, timeline, and additional context',
            fieldIds: ['budget', 'timeline', 'message', 'attachment'],
          },
        ],
        showProgressBar: true,
        allowBackNavigation: true,
      },
      storeSubmissions: true,
      webhookUrl: 'https://hooks.acme.com/form-submissions',
      crmIntegration: {
        enabled: true,
        pipelineId: 'pipeline_enterprise_sales',
        fieldMapping: {
          firstName: 'contact.first_name',
          lastName: 'contact.last_name',
          email: 'contact.email',
          company: 'company.name',
          companySize: 'company.size',
          interest: 'deal.interest',
          budget: 'deal.budget',
          timeline: 'deal.timeline',
        },
      },
    },
  });

  console.log(`Form created: ${form.id} (${form.fields.length} fields, ${form.config.multiStep.steps.length} steps)`);

  return form;
}
```

### Example 4: Theme Customization

```typescript
import { ThemeService } from '@mcv/growth/website';

/**
 * Apply and customize a theme for a site.
 */
async function customizeTheme(siteId: string) {
  const themeService = new ThemeService();

  // 1. List available system themes
  const systemThemes = await themeService.listThemes({
    isSystem: true,
    category: 'saas',
  });

  console.log(`Found ${systemThemes.length} SaaS themes`);

  // 2. Fork a system theme for customization
  const customTheme = await themeService.forkTheme(systemThemes[0].id, {
    name: 'Acme SaaS Theme',
    description: 'Customized SaaS theme for Acme Corp',
  });

  // 3. Customize colors, fonts, and spacing
  const updatedTheme = await themeService.updateTheme(customTheme.id, {
    config: {
      colors: {
        primary: '#6366F1',        // Indigo
        primaryHover: '#4F46E5',
        secondary: '#EC4899',      // Pink
        secondaryHover: '#DB2777',
        accent: '#F59E0B',         // Amber
        background: '#FFFFFF',
        surface: '#F8FAFC',
        text: '#0F172A',
        textMuted: '#64748B',
        border: '#E2E8F0',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      darkColors: {
        primary: '#818CF8',
        primaryHover: '#6366F1',
        secondary: '#F472B6',
        secondaryHover: '#EC4899',
        accent: '#FBBF24',
        background: '#0F172A',
        surface: '#1E293B',
        text: '#F8FAFC',
        textMuted: '#94A3B8',
        border: '#334155',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        info: '#60A5FA',
      },
      fonts: {
        heading: 'Cal Sans',
        body: 'Inter',
        mono: 'JetBrains Mono',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
          '5xl': '3rem',
        },
        weights: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        lineHeights: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75,
        },
        googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
      },
      spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48 },
      borderRadius: { sm: 4, md: 8, lg: 12, full: 9999 },
      shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px -1px rgba(0,0,0,0.1)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
        xl: '0 20px 25px -5px rgba(0,0,0,0.1)',
      },
      containerMaxWidth: 1280,
      darkModeEnabled: true,
      darkModeDefault: 'system',
      componentOverrides: {},
      cssVariables: {
        '--header-height': '72px',
        '--sidebar-width': '280px',
      },
    },
  });

  // 4. Apply theme to the site
  await themeService.applyTheme(siteId, updatedTheme.id);

  console.log(`Theme "${updatedTheme.name}" applied to site`);

  // 5. Export theme as JSON (for sharing/backup)
  const exported = await themeService.exportTheme(updatedTheme.id);
  console.log(`Theme exported: ${JSON.stringify(exported).length} bytes`);

  return updatedTheme;
}
```

### Example 5: Media Library with Image Optimization

```typescript
import { MediaService } from '@mcv/growth/website';
import { generateSrcSet, generateBlurHash } from '@mcv/growth/website/utils';

/**
 * Upload, optimize, and manage media assets.
 */
async function manageMedia(ventureId: string, siteId: string, userId: string) {
  const media = new MediaService();

  // 1. Upload an image with automatic optimization
  const heroImage = await media.uploadImage({
    ventureId,
    siteId,
    file: heroImageBuffer,  // Buffer from file upload
    fileName: 'hero-background.jpg',
    altText: 'Mountain landscape at sunset',
    folder: 'hero-images',
    tags: ['hero', 'landscape', 'homepage'],
    uploadedBy: userId,
    optimize: {
      // Generate multiple variants for responsive images
      variants: [
        { label: 'thumbnail', width: 200, height: 150, format: 'webp', quality: 80 },
        { label: 'small', width: 640, height: 480, format: 'webp', quality: 85 },
        { label: 'medium', width: 1280, height: 960, format: 'webp', quality: 85 },
        { label: 'large', width: 1920, height: 1440, format: 'webp', quality: 85 },
        { label: 'avif-medium', width: 1280, height: 960, format: 'avif', quality: 75 },
        { label: 'avif-large', width: 1920, height: 1440, format: 'avif', quality: 75 },
      ],
      generateBlurHash: true,
      extractDominantColor: true,
    },
  });

  console.log(`Uploaded: ${heroImage.id}`);
  console.log(`  Original: ${heroImage.publicUrl} (${heroImage.fileSizeBytes} bytes)`);
  console.log(`  Dimensions: ${heroImage.width}x${heroImage.height}`);
  console.log(`  BlurHash: ${heroImage.blurHash}`);
  console.log(`  Dominant color: ${heroImage.dominantColor}`);
  console.log(`  Variants: ${heroImage.variants.length}`);

  // 2. Generate responsive srcset for HTML
  const srcSet = generateSrcSet(heroImage, {
    formats: ['avif', 'webp'],
    sizes: '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw',
  });

  console.log('srcSet:', srcSet);
  // Output:
  // <picture>
  //   <source type="image/avif" srcset="...avif-medium 1280w, ...avif-large 1920w" sizes="..." />
  //   <source type="image/webp" srcset="...small 640w, ...medium 1280w, ...large 1920w" sizes="..." />
  //   <img src="...medium" alt="Mountain landscape at sunset" width="1280" height="960" loading="lazy" />
  // </picture>

  // 3. Browse media library
  const images = await media.listAssets({
    ventureId,
    siteId,
    type: 'image',
    folder: 'hero-images',
    page: 1,
    perPage: 20,
    orderBy: 'createdAt',
    orderDir: 'desc',
  });

  console.log(`Media library: ${images.total} images in 'hero-images' folder`);

  // 4. Transform an existing image on-the-fly
  const transformed = await media.getTransformedUrl(heroImage.id, {
    width: 800,
    height: 600,
    fit: 'cover',
    format: 'webp',
    quality: 80,
    gravity: 'smart',
  });

  console.log(`Transformed URL: ${transformed.url}`);

  // 5. Organize with folders and tags
  await media.moveToFolder(heroImage.id, 'homepage/hero');
  await media.updateTags(heroImage.id, ['hero', 'homepage', 'featured', '2026']);

  // 6. Bulk operations
  const allUploads = await media.listAssets({
    ventureId,
    tags: ['unused'],
    olderThan: '2025-01-01',
  });

  if (allUploads.total > 0) {
    const deleteIds = allUploads.items.map(a => a.id);
    await media.bulkDelete(deleteIds);
    console.log(`Cleaned up ${deleteIds.length} unused media assets`);
  }

  return heroImage;
}
```

### Example 6: Navigation and Menu Building

```typescript
import { NavigationService } from '@mcv/growth/website';

/**
 * Create header navigation with mega menu and mobile responsive menu.
 */
async function buildNavigation(siteId: string) {
  const nav = new NavigationService();

  // 1. Create header navigation with mega menu
  const headerNav = await nav.createNavigation({
    siteId,
    name: 'Main Header',
    position: 'header',
    items: [
      {
        id: 'nav-product',
        label: 'Product',
        url: null,
        pageId: null,
        target: '_self',
        icon: null,
        badge: null,
        badgeColor: null,
        visible: true,
        highlighted: false,
        description: null,
        image: null,
        sortOrder: 0,
        children: [
          {
            id: 'nav-features',
            label: 'Features',
            url: '/features',
            pageId: null,
            target: '_self',
            icon: 'star',
            badge: null,
            badgeColor: null,
            visible: true,
            highlighted: false,
            description: 'Explore all product features',
            image: '/nav/features-preview.jpg',
            sortOrder: 0,
            children: [],
          },
          {
            id: 'nav-pricing',
            label: 'Pricing',
            url: '/pricing',
            pageId: null,
            target: '_self',
            icon: 'credit-card',
            badge: null,
            badgeColor: null,
            visible: true,
            highlighted: false,
            description: 'Simple, transparent pricing',
            image: null,
            sortOrder: 1,
            children: [],
          },
          {
            id: 'nav-integrations',
            label: 'Integrations',
            url: '/integrations',
            pageId: null,
            target: '_self',
            icon: 'puzzle',
            badge: 'New',
            badgeColor: '#10B981',
            visible: true,
            highlighted: false,
            description: 'Connect with 100+ tools',
            image: null,
            sortOrder: 2,
            children: [],
          },
        ],
      },
      {
        id: 'nav-resources',
        label: 'Resources',
        url: null,
        pageId: null,
        target: '_self',
        icon: null,
        badge: null,
        badgeColor: null,
        visible: true,
        highlighted: false,
        description: null,
        image: null,
        sortOrder: 1,
        children: [
          {
            id: 'nav-blog',
            label: 'Blog',
            url: '/blog',
            pageId: null,
            target: '_self',
            icon: 'pen',
            badge: null,
            badgeColor: null,
            visible: true,
            highlighted: false,
            description: 'Latest articles and updates',
            image: null,
            sortOrder: 0,
            children: [],
          },
          {
            id: 'nav-docs',
            label: 'Documentation',
            url: 'https://docs.acme.com',
            pageId: null,
            target: '_blank',
            icon: 'book',
            badge: null,
            badgeColor: null,
            visible: true,
            highlighted: false,
            description: 'API docs, guides, and tutorials',
            image: null,
            sortOrder: 1,
            children: [],
          },
        ],
      },
      {
        id: 'nav-about',
        label: 'About',
        url: '/about',
        pageId: null,
        target: '_self',
        icon: null,
        badge: null,
        badgeColor: null,
        visible: true,
        highlighted: false,
        description: null,
        image: null,
        sortOrder: 2,
        children: [],
      },
    ],
    style: {
      type: 'mega',
      sticky: true,
      transparent: false,
      showLogo: true,
      showSearch: true,
      showCta: true,
      ctaText: 'Get Started',
      ctaUrl: '/signup',
      mobileBreakpoint: 768,
      mobileStyle: 'slide',
    },
  });

  console.log(`Header nav created: ${headerNav.id} (${headerNav.items.length} top-level items)`);

  // 2. Create footer navigation
  const footerNav = await nav.createNavigation({
    siteId,
    name: 'Footer',
    position: 'footer',
    items: [
      {
        id: 'footer-product',
        label: 'Product',
        url: null,
        pageId: null,
        target: '_self',
        icon: null,
        badge: null,
        badgeColor: null,
        visible: true,
        highlighted: false,
        description: null,
        image: null,
        sortOrder: 0,
        children: [
          { id: 'f-features', label: 'Features', url: '/features', pageId: null, target: '_self', icon: null, badge: null, badgeColor: null, visible: true, highlighted: false, description: null, image: null, sortOrder: 0, children: [] },
          { id: 'f-pricing', label: 'Pricing', url: '/pricing', pageId: null, target: '_self', icon: null, badge: null, badgeColor: null, visible: true, highlighted: false, description: null, image: null, sortOrder: 1, children: [] },
          { id: 'f-changelog', label: 'Changelog', url: '/changelog', pageId: null, target: '_self', icon: null, badge: null, badgeColor: null, visible: true, highlighted: false, description: null, image: null, sortOrder: 2, children: [] },
        ],
      },
      {
        id: 'footer-company',
        label: 'Company',
        url: null,
        pageId: null,
        target: '_self',
        icon: null,
        badge: null,
        badgeColor: null,
        visible: true,
        highlighted: false,
        description: null,
        image: null,
        sortOrder: 1,
        children: [
          { id: 'f-about', label: 'About', url: '/about', pageId: null, target: '_self', icon: null, badge: null, badgeColor: null, visible: true, highlighted: false, description: null, image: null, sortOrder: 0, children: [] },
          { id: 'f-careers', label: 'Careers', url: '/careers', pageId: null, target: '_self', icon: null, badge: null, badgeColor: null, visible: true, highlighted: false, description: null, image: null, sortOrder: 1, children: [] },
          { id: 'f-contact', label: 'Contact', url: '/contact', pageId: null, target: '_self', icon: null, badge: null, badgeColor: null, visible: true, highlighted: false, description: null, image: null, sortOrder: 2, children: [] },
        ],
      },
      {
        id: 'footer-legal',
        label: 'Legal',
        url: null,
        pageId: null,
        target: '_self',
        icon: null,
        badge: null,
        badgeColor: null,
        visible: true,
        highlighted: false,
        description: null,
        image: null,
        sortOrder: 2,
        children: [
          { id: 'f-privacy', label: 'Privacy Policy', url: '/privacy', pageId: null, target: '_self', icon: null, badge: null, badgeColor: null, visible: true, highlighted: false, description: null, image: null, sortOrder: 0, children: [] },
          { id: 'f-terms', label: 'Terms of Service', url: '/terms', pageId: null, target: '_self', icon: null, badge: null, badgeColor: null, visible: true, highlighted: false, description: null, image: null, sortOrder: 1, children: [] },
        ],
      },
    ],
    style: {
      type: 'vertical',
      sticky: false,
      transparent: false,
      showLogo: true,
      showSearch: false,
      showCta: false,
      ctaText: null,
      ctaUrl: null,
      mobileBreakpoint: 768,
      mobileStyle: 'dropdown',
    },
  });

  console.log(`Footer nav created: ${footerNav.id}`);

  return { headerNav, footerNav };
}
```

### Example 7: A/B Testing a CTA Component

```typescript
import { ABTestService, PageBuilderService } from '@mcv/growth/website';

/**
 * Set up an A/B test comparing two CTA variants on a landing page.
 */
async function runCTAExperiment(siteId: string, pageId: string, ctaComponentId: string) {
  const abTest = new ABTestService();

  // 1. Create the A/B test
  const test = await abTest.createTest({
    siteId,
    name: 'Homepage CTA — Button Text & Color',
    description: 'Testing whether action-oriented CTA text and a green button outperforms the current blue "Get Started".',
    type: 'component',
    pageId,
    componentId: ctaComponentId,
    variants: [
      {
        name: 'Control (Current)',
        description: 'Blue "Get Started" button',
        trafficPercent: 50,
        isControl: true,
        componentOverrides: null,  // No overrides — use existing component props
      },
      {
        name: 'Variant A — Action CTA',
        description: 'Green "Start Building Free" button',
        trafficPercent: 50,
        isControl: false,
        componentOverrides: {
          ctaText: 'Start Building Free',
          ctaStyle: 'success',      // Maps to green in the theme
          ctaSize: 'large',
          subtitle: 'No credit card required. Free for up to 3 projects.',
        },
      },
    ],
    goal: {
      type: 'click',
      targetSelector: '[data-cta="primary"]',
      targetUrl: null,
      customEventName: null,
    },
    minSampleSize: 500,
    confidenceLevel: 0.95,
  });

  console.log(`A/B test created: ${test.id} (${test.variants.length} variants)`);

  // 2. Start the test
  const runningTest = await abTest.startTest(test.id);
  console.log(`Test started at: ${runningTest.startedAt}`);

  // 3. Check results (after sufficient traffic)
  const results = await abTest.getResults(test.id);

  if (results) {
    console.log(`Test results after ${results.durationDays} days:`);
    console.log(`  Significant: ${results.isSignificant}`);
    console.log(`  Confidence: ${(results.observedConfidence * 100).toFixed(1)}%`);

    for (const variant of results.variantStats) {
      console.log(`  Variant ${variant.variantId}:`);
      console.log(`    Impressions: ${variant.impressions}`);
      console.log(`    Conversions: ${variant.conversions}`);
      console.log(`    Rate: ${(variant.conversionRate * 100).toFixed(2)}%`);
      if (variant.improvementOverControl !== null) {
        console.log(`    Improvement: ${(variant.improvementOverControl * 100).toFixed(1)}%`);
      }
    }

    if (results.winnerId) {
      console.log(`\n  Winner: ${results.winnerId}`);

      // 4. Apply the winning variant permanently
      await abTest.applyWinner(test.id, results.winnerId);
      console.log('  Winner applied — test completed');
    }
  }

  return test;
}
```

### Example 8: Multi-Language Site with Translation Management

```typescript
import { I18nService, PageService, SEOService } from '@mcv/growth/website';
import { generateHreflangTags } from '@mcv/growth/website/utils';

/**
 * Configure a multi-language site with locale routing,
 * translations, and hreflang SEO tags.
 */
async function setupMultiLanguageSite(siteId: string) {
  const i18n = new I18nService();
  const pageService = new PageService();
  const seo = new SEOService();

  // 1. Configure locales
  await i18n.addLocale(siteId, {
    localeCode: 'en-US',
    name: 'English (US)',
    isDefault: true,
    isRtl: false,
  });

  await i18n.addLocale(siteId, {
    localeCode: 'fr-FR',
    name: 'Français',
    isDefault: false,
    isRtl: false,
  });

  await i18n.addLocale(siteId, {
    localeCode: 'ar-SA',
    name: 'العربية',
    isDefault: false,
    isRtl: true,  // Right-to-left
  });

  await i18n.addLocale(siteId, {
    localeCode: 'ja-JP',
    name: '日本語',
    isDefault: false,
    isRtl: false,
  });

  console.log('Locales configured: en-US (default), fr-FR, ar-SA, ja-JP');

  // 2. Add shared translations (navigation, UI, common strings)
  await i18n.bulkSetTranslations(siteId, 'fr-FR', 'common', {
    'nav.home': 'Accueil',
    'nav.about': 'À propos',
    'nav.features': 'Fonctionnalités',
    'nav.pricing': 'Tarifs',
    'nav.blog': 'Blog',
    'nav.contact': 'Contact',
    'cta.get_started': 'Commencer',
    'cta.learn_more': 'En savoir plus',
    'cta.sign_up': 'S\'inscrire',
    'footer.copyright': '© 2026 Acme Corp. Tous droits réservés.',
    'footer.privacy': 'Politique de confidentialité',
    'footer.terms': 'Conditions d\'utilisation',
    'blog.read_more': 'Lire la suite',
    'blog.published_on': 'Publié le',
    'blog.by_author': 'Par',
    'form.required': 'Ce champ est obligatoire',
    'form.submit': 'Envoyer',
    'form.success': 'Merci ! Votre message a été envoyé.',
  });

  await i18n.bulkSetTranslations(siteId, 'ar-SA', 'common', {
    'nav.home': 'الرئيسية',
    'nav.about': 'من نحن',
    'nav.features': 'المميزات',
    'nav.pricing': 'الأسعار',
    'nav.blog': 'المدونة',
    'nav.contact': 'اتصل بنا',
    'cta.get_started': 'ابدأ الآن',
    'cta.learn_more': 'اعرف المزيد',
    'cta.sign_up': 'إنشاء حساب',
  });

  console.log('Common translations added for fr-FR and ar-SA');

  // 3. Create locale-specific page variants
  const homePage = await pageService.getPageByPath(siteId, '/');

  // Create French variant of the homepage
  const frHomePage = await pageService.createLocaleVariant(homePage.id, {
    locale: 'fr-FR',
    title: 'Accueil',
    slug: '',
    path: '/fr',
    description: 'Le leader mondial de la technologie de widgets.',
    seo: {
      title: 'Acme Corp — Technologie de widgets de pointe',
      description: 'Acme Corp fournit une infrastructure de widgets de qualité entreprise.',
      focusKeyword: 'technologie widgets',
      noIndex: false,
      noFollow: false,
      canonicalUrl: null,
      metaTags: [],
    },
  });

  // Create Arabic variant (RTL)
  const arHomePage = await pageService.createLocaleVariant(homePage.id, {
    locale: 'ar-SA',
    title: 'الرئيسية',
    slug: '',
    path: '/ar',
    description: 'الشركة الرائدة عالمياً في تقنية الأدوات.',
  });

  console.log(`Created locale variants: fr (${frHomePage.id}), ar (${arHomePage.id})`);

  // 4. Override component props for specific locales
  await pageService.setLocaleOverrides(homePage.id, 'fr-FR', {
    'hero-component-id': {
      title: 'Construisez de meilleurs widgets, plus rapidement',
      subtitle: 'Acme Corp fournit une infrastructure de widgets pour les équipes de toutes tailles.',
      ctaText: 'Commencer gratuitement',
    },
  });

  // 5. Generate hreflang tags for SEO
  const hreflangTags = generateHreflangTags({
    defaultLocale: 'en-US',
    variants: [
      { locale: 'en-US', url: 'https://acme.com/' },
      { locale: 'fr-FR', url: 'https://acme.com/fr/' },
      { locale: 'ar-SA', url: 'https://acme.com/ar/' },
      { locale: 'ja-JP', url: 'https://acme.com/ja/' },
    ],
  });

  console.log('Generated hreflang tags:');
  console.log(hreflangTags);
  // Output:
  // <link rel="alternate" hreflang="en-US" href="https://acme.com/" />
  // <link rel="alternate" hreflang="fr-FR" href="https://acme.com/fr/" />
  // <link rel="alternate" hreflang="ar-SA" href="https://acme.com/ar/" />
  // <link rel="alternate" hreflang="ja-JP" href="https://acme.com/ja/" />
  // <link rel="alternate" hreflang="x-default" href="https://acme.com/" />

  // 6. Get translation status overview
  const translationStatus = await i18n.getTranslationStatus(siteId);

  for (const locale of translationStatus) {
    console.log(`${locale.localeCode}: ${locale.translated}/${locale.total} (${locale.percentComplete}%)`);
  }

  return { frHomePage, arHomePage };
}
```

---

## Error Codes

All errors in `@mcv/growth/website` follow the MCV error convention with the `WEBSITE_` prefix.

| Code | HTTP | Description | Resolution |
|---|---|---|---|
| `WEBSITE_SITE_NOT_FOUND` | 404 | Site with the specified ID does not exist or is not accessible to the current venture. | Verify the site ID and ensure the user has access to the venture. |
| `WEBSITE_SITE_SLUG_TAKEN` | 409 | A site with this slug already exists in the venture. | Choose a different slug or update the existing site. |
| `WEBSITE_SITE_LIMIT_EXCEEDED` | 403 | The venture's plan does not allow creating more sites. | Upgrade the venture's plan or delete unused sites. |
| `WEBSITE_SITE_SUSPENDED` | 403 | The site is suspended and cannot be modified or deployed. | Contact support or resolve the suspension reason. |
| `WEBSITE_PAGE_NOT_FOUND` | 404 | Page with the specified ID does not exist within the site. | Verify the page ID. Pages that have been soft-deleted return this error. |
| `WEBSITE_PAGE_PATH_CONFLICT` | 409 | Another page already uses this path within the same site and locale. | Choose a different slug/path. |
| `WEBSITE_PAGE_PUBLISH_FAILED` | 422 | Page cannot be published due to validation errors (missing required fields, invalid component tree). | Check the validation errors in the response and fix the page content. |
| `WEBSITE_PAGE_SCHEDULED_PAST` | 422 | The scheduled publish time is in the past. | Set a future timestamp for scheduled publishing. |
| `WEBSITE_COMPONENT_INVALID` | 422 | Component type is unknown or props do not match the expected schema. | Check the component type and ensure props match the type's schema. |
| `WEBSITE_COMPONENT_TREE_INVALID` | 422 | Component tree structure is invalid (circular references, orphaned nodes, depth exceeded). | Validate the tree structure. Max depth is 10 levels. |
| `WEBSITE_COMPONENT_TREE_TOO_DEEP` | 422 | Component nesting exceeds the maximum allowed depth (10 levels). | Flatten the component structure or reduce nesting. |
| `WEBSITE_THEME_NOT_FOUND` | 404 | Theme with the specified ID does not exist. | Verify the theme ID. System themes are accessible to all ventures. |
| `WEBSITE_THEME_SYSTEM_IMMUTABLE` | 403 | System-provided themes cannot be modified. Fork the theme instead. | Use `ThemeService.forkTheme()` to create a mutable copy. |
| `WEBSITE_BLOG_POST_NOT_FOUND` | 404 | Blog post with the specified ID does not exist. | Verify the post ID. |
| `WEBSITE_BLOG_SLUG_TAKEN` | 409 | A blog post with this slug already exists in the same site and locale. | Choose a different slug. |
| `WEBSITE_BLOG_CATEGORY_NOT_FOUND` | 404 | Blog category with the specified ID does not exist. | Verify the category ID or create the category first. |
| `WEBSITE_FORM_NOT_FOUND` | 404 | Form with the specified ID does not exist. | Verify the form ID. |
| `WEBSITE_FORM_SUBMISSION_INVALID` | 422 | Form submission data failed validation against the form field definitions. | Check the validation errors and ensure all required fields are provided with valid values. |
| `WEBSITE_FORM_RATE_LIMITED` | 429 | Too many form submissions from this IP address within the rate limit window. | Wait for the rate limit window to expire before retrying. |
| `WEBSITE_FORM_SPAM_DETECTED` | 403 | The submission was flagged as spam by the spam protection mechanism (reCAPTCHA score too low, honeypot triggered). | Verify the reCAPTCHA token or ensure the submission is from a legitimate user. |
| `WEBSITE_FORM_FILE_TOO_LARGE` | 413 | Uploaded file exceeds the maximum allowed file size. | Reduce the file size or increase the form's `maxFileSizeMb` setting. |
| `WEBSITE_FORM_FILE_TYPE_INVALID` | 415 | Uploaded file type is not in the form's allowed types list. | Upload a file with an allowed MIME type. |
| `WEBSITE_MEDIA_NOT_FOUND` | 404 | Media asset with the specified ID does not exist. | Verify the asset ID. |
| `WEBSITE_MEDIA_UPLOAD_FAILED` | 500 | Failed to upload media to Supabase Storage. | Retry the upload. Check storage quotas and connectivity. |
| `WEBSITE_MEDIA_QUOTA_EXCEEDED` | 403 | The venture has exceeded its media storage quota. | Delete unused media assets or upgrade the plan. |
| `WEBSITE_MEDIA_FORMAT_UNSUPPORTED` | 415 | The uploaded media format is not supported. | Upload a supported format (JPEG, PNG, WebP, AVIF, GIF, SVG, MP4, PDF). |
| `WEBSITE_DOMAIN_NOT_FOUND` | 404 | Domain record with the specified ID does not exist. | Verify the domain ID. |
| `WEBSITE_DOMAIN_ALREADY_REGISTERED` | 409 | This domain is already registered to another site (possibly in a different venture). | Remove the domain from the other site first, or use a different domain. |
| `WEBSITE_DOMAIN_VERIFICATION_FAILED` | 422 | Domain DNS verification failed. The required CNAME or TXT record was not found. | Add the required DNS record and wait for propagation (up to 48 hours). |
| `WEBSITE_SSL_PROVISIONING_FAILED` | 500 | SSL certificate provisioning failed. | Ensure the domain's DNS is correctly pointed. Retry after DNS propagation. |
| `WEBSITE_DEPLOYMENT_NOT_FOUND` | 404 | Deployment record with the specified ID does not exist. | Verify the deployment ID. |
| `WEBSITE_DEPLOYMENT_IN_PROGRESS` | 409 | A deployment is already in progress for this site. Only one deployment runs at a time. | Wait for the current deployment to complete or cancel it. |
| `WEBSITE_BUILD_FAILED` | 500 | The SSG build process failed. Check the build log for details. | Review the `buildLog` field in the deployment for specific errors. |
| `WEBSITE_ABTEST_NOT_FOUND` | 404 | A/B test with the specified ID does not exist. | Verify the test ID. |
| `WEBSITE_ABTEST_ALREADY_RUNNING` | 409 | Cannot modify an A/B test that is currently running. Pause it first. | Call `ABTestService.pauseTest()` before making changes. |
| `WEBSITE_ABTEST_INVALID_TRAFFIC` | 422 | A/B test variant traffic percentages do not sum to 100%. | Adjust variant `trafficPercent` values to total exactly 100. |
| `WEBSITE_NAVIGATION_NOT_FOUND` | 404 | Navigation menu with the specified ID does not exist. | Verify the navigation ID. |
| `WEBSITE_LOCALE_NOT_FOUND` | 404 | The specified locale is not enabled for this site. | Enable the locale via `I18nService.addLocale()` first. |
| `WEBSITE_LOCALE_DEFAULT_REQUIRED` | 422 | Cannot remove or disable the default locale. | Set a different locale as default before removing this one. |
| `WEBSITE_TRANSLATION_NOT_FOUND` | 404 | Translation key does not exist for the specified locale and namespace. | Create the translation first or check the key spelling. |
| `WEBSITE_VERSION_NOT_FOUND` | 404 | Page version with the specified ID or number does not exist. | Verify the version ID or number. |
| `WEBSITE_UNAUTHORIZED` | 401 | Authentication required. No valid JWT provided. | Include a valid Supabase JWT in the request. |
| `WEBSITE_FORBIDDEN` | 403 | The authenticated user does not have permission for this operation. | Check the user's role within the venture. |

---

## Security

### Multi-Tenant Isolation

All website data is strictly isolated per venture using Supabase Row-Level Security (RLS):

```sql
-- Every query automatically filters by the current venture
-- Set via Supabase JWT custom claims or session variable
SET app.current_venture_id = 'venture_abc123';

-- RLS policies enforce this on every table
CREATE POLICY sites_venture_isolation ON sites
  USING (venture_id = current_setting('app.current_venture_id')::TEXT);
```

**Guarantees:**
- A venture can never read, write, or modify another venture's sites, pages, media, or forms
- Even direct SQL queries through the Supabase client respect RLS boundaries
- `venture_id` is denormalized onto child tables to avoid expensive joins in RLS checks
- Service-role operations (background jobs, deployments) use explicit venture scoping

### Authentication & Authorization

```typescript
// Role-based access within a venture
type WebsiteRole = 'owner' | 'admin' | 'editor' | 'author' | 'viewer';

const permissions: Record<WebsiteRole, string[]> = {
  owner:  ['*'],  // Full access
  admin:  ['site.manage', 'page.manage', 'page.publish', 'blog.manage', 'blog.publish',
           'form.manage', 'media.manage', 'theme.manage', 'domain.manage', 'nav.manage',
           'analytics.view', 'abtest.manage', 'deploy.trigger', 'settings.manage'],
  editor: ['page.manage', 'page.publish', 'blog.manage', 'blog.publish',
           'form.manage', 'media.manage', 'nav.manage', 'analytics.view'],
  author: ['page.create', 'page.edit-own', 'blog.create', 'blog.edit-own',
           'media.upload', 'analytics.view-own'],
  viewer: ['page.view', 'blog.view', 'form.view-submissions', 'analytics.view'],
};
```

### Content Security

| Concern | Mitigation |
|---|---|
| **XSS in custom HTML/CSS/JS** | Custom code is sandboxed in iframes. User-generated rich text is sanitized with DOMPurify. Script injection in component props is prevented via schema validation. |
| **XSS in form submissions** | All form submission data is stored as-is but sanitized on output. Submission display in the admin UI uses strict escaping. |
| **CSRF on form submissions** | Public forms use reCAPTCHA v3 or hCaptcha. Admin API routes require valid JWT. |
| **Media upload attacks** | File type validation via magic bytes (not just MIME type). Image re-encoding strips EXIF metadata and potential exploits. Max file size enforced server-side. SVG sanitization removes `<script>` and event handlers. |
| **Domain hijacking** | Domain ownership verified via DNS TXT/CNAME records before activation. Verification tokens are cryptographically random and expire after 72 hours. |
| **Path traversal** | Page paths are validated against a strict slug pattern (`/^[a-z0-9][a-z0-9-/]*$/`). No filesystem paths are exposed. All media served via Supabase Storage signed URLs or CDN. |
| **Brute force (forms)** | Configurable rate limiting per form per IP. Global rate limiting via API gateway. Honeypot fields for bot detection. |
| **Comment spam** | Comments require moderation (configurable). Akismet-compatible spam detection. Rate limiting per IP/email. |
| **Data exfiltration** | Form submission exports (CSV) require `form.manage` permission. Media downloads respect venture-level access controls. Analytics data is aggregate-only (no PII). |

### Deployment Security

```
Build Pipeline Security:
├── Build runs in isolated containers (no network access to databases)
├── Secrets (API keys, credentials) are never embedded in static output
├── Build artifacts are content-hashed and integrity-verified before CDN push
├── CDN purge requires authenticated API call with deployment token
├── Preview URLs are time-limited and require authentication
└── Production deployments require 'deploy.trigger' permission
```

### Content Sanitization Pipeline

```typescript
// All user-provided content passes through sanitization before storage

// 1. Rich text content (blog posts, page content)
const sanitizedContent = sanitizeRichText(rawContent, {
  allowedTags: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
    'a', 'strong', 'em', 'code', 'pre', 'blockquote', 'img', 'table',
    'thead', 'tbody', 'tr', 'th', 'td', 'br', 'hr', 'span', 'div',
    'figure', 'figcaption', 'video', 'source'],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    video: ['src', 'controls', 'width', 'height'],
    source: ['src', 'type'],
    '*': ['class', 'id', 'style'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  stripScripts: true,
  stripStyles: false,  // Allow inline styles but sanitize values
});

// 2. Custom CSS — scoped to site container
const scopedCss = scopeCustomCss(rawCss, `[data-site="${siteId}"]`);

// 3. Custom JS — wrapped in try/catch, no access to admin APIs
const wrappedJs = wrapCustomJs(rawJs, { sandbox: true, timeout: 5000 });
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Supabase service role key (for server-side operations) |
| `SUPABASE_ANON_KEY` | Yes | — | Supabase anonymous key (for client-side operations) |
| `WEBSITE_STORAGE_BUCKET` | No | `website-media` | Supabase Storage bucket name for media assets |
| `WEBSITE_CDN_PROVIDER` | No | `vercel` | CDN deployment provider (`vercel` or `cloudflare`) |
| `WEBSITE_VERCEL_TOKEN` | Cond. | — | Vercel API token (required if CDN provider is `vercel`) |
| `WEBSITE_VERCEL_TEAM_ID` | No | — | Vercel team/org ID |
| `WEBSITE_CLOUDFLARE_TOKEN` | Cond. | — | Cloudflare API token (required if CDN provider is `cloudflare`) |
| `WEBSITE_CLOUDFLARE_ZONE_ID` | Cond. | — | Cloudflare zone ID for domain management |
| `WEBSITE_CLOUDFLARE_ACCOUNT_ID` | Cond. | — | Cloudflare account ID |
| `WEBSITE_DEFAULT_DOMAIN` | No | `mcv.site` | Default subdomain suffix for sites (e.g., `my-site.mcv.site`) |
| `WEBSITE_RECAPTCHA_SECRET_KEY` | No | — | Google reCAPTCHA v3 secret key for form spam protection |
| `WEBSITE_HCAPTCHA_SECRET_KEY` | No | — | hCaptcha secret key (alternative to reCAPTCHA) |
| `WEBSITE_IMAGE_PROCESSING_URL` | No | — | External image processing service URL (e.g., Imgix, Cloudinary). Falls back to built-in Sharp processing. |
| `WEBSITE_MAX_SITES_PER_VENTURE` | No | `10` | Default max number of sites per venture (overridable per plan) |
| `WEBSITE_MAX_PAGES_PER_SITE` | No | `100` | Default max number of pages per site (overridable per plan) |
| `WEBSITE_MAX_MEDIA_SIZE_MB` | No | `50` | Maximum single file upload size in MB |
| `WEBSITE_MAX_STORAGE_GB` | No | `5` | Default media storage quota per venture in GB |
| `WEBSITE_BUILD_TIMEOUT_MS` | No | `300000` | Maximum build duration (5 minutes default) |
| `WEBSITE_BUILD_CONCURRENCY` | No | `2` | Maximum concurrent builds across all sites |
| `WEBSITE_ANALYTICS_RETENTION_DAYS` | No | `365` | How long to retain granular page analytics data |
| `WEBSITE_PREVIEW_SECRET` | No | (auto-generated) | Secret token for draft page preview URLs |
| `WEBSITE_WEBHOOK_SIGNING_SECRET` | No | — | Secret used to sign outbound webhook payloads (form submissions, deploy events) |
| `WEBSITE_AKISMET_KEY` | No | — | Akismet API key for blog comment spam detection |
| `WEBSITE_GOOGLE_FONTS_API_KEY` | No | — | Google Fonts API key for font enumeration in the theme customizer |
| `WEBSITE_SMTP_HOST` | No | — | SMTP server for form notification emails (falls back to `@mcv/core/email`) |
| `WEBSITE_SMTP_PORT` | No | `587` | SMTP port |
| `WEBSITE_SMTP_USER` | No | — | SMTP username |
| `WEBSITE_SMTP_PASSWORD` | No | — | SMTP password |
| `WEBSITE_SMTP_FROM` | No | `noreply@mcv.one` | From address for form notification emails |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---|---|
| `@mcv/core/auth` | User authentication, JWT validation, venture membership verification |
| `@mcv/core/db` | Supabase client, Drizzle ORM setup, connection pooling, RLS context |
| `@mcv/core/storage` | Supabase Storage client for media uploads, signed URLs, CDN integration |
| `@mcv/core/billing` | Plan limit enforcement (site count, page count, storage quotas, bandwidth) |
| `@mcv/core/notifications` | Push notifications for deployment status, form submission alerts |
| `@mcv/core/queue` | Background job queue for builds, deployments, image processing, scheduled publishing |
| `@mcv/core/errors` | Standardized error types and error code conventions |
| `@mcv/core/validators` | Shared Zod schemas (pagination, IDs, common patterns) |
| `@mcv/growth/analytics` | Page view event forwarding, conversion funnel tracking |
| `@mcv/growth/crm` | Form submission → CRM lead/contact creation |
| `@mcv/growth/email` | Newsletter integration (blog post → email content) |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.30` | SQL query builder and ORM for PostgreSQL |
| `@trpc/server` | `^10.45` | Type-safe API router |
| `zod` | `^3.22` | Runtime input validation and type inference |
| `sharp` | `^0.33` | Server-side image processing (resize, format conversion, blur hash) |
| `blurhash` | `^2.0` | BlurHash placeholder generation for images |
| `@tiptap/core` | `^2.2` | Rich text editor framework (ProseMirror-based) |
| `@tiptap/starter-kit` | `^2.2` | Standard editor extensions (bold, italic, lists, etc.) |
| `dompurify` | `^3.0` | HTML sanitization for user-generated content |
| `slugify` | `^1.6` | URL slug generation from titles |
| `feed` | `^4.2` | RSS/Atom feed generation |
| `xml2js` | `^0.6` | XML parsing for sitemap generation |
| `cssbeautify` | `^0.3` | CSS formatting for theme export |
| `postcss` | `^8.4` | CSS scoping and transformation for custom styles |
| `terser` | `^5.27` | JavaScript minification for build output |
| `html-minifier-terser` | `^7.2` | HTML minification for build output |
| `jsdom` | `^24.0` | Server-side DOM for component rendering and HTML generation |
| `simple-statistics` | `^7.8` | Statistical analysis for A/B test results (t-test, confidence intervals) |
| `ua-parser-js` | `^1.0` | User-agent parsing for analytics device breakdown |
| `geoip-lite` | `^1.4` | IP geolocation for analytics country breakdown |
| `sanitize-html` | `^2.12` | Additional HTML sanitization layer for comments and form data |
| `dayjs` | `^1.11` | Date/time manipulation for scheduling, analytics date ranges |

### Peer Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | `^18.2` | UI component rendering |
| `react-dom` | `^18.2` | DOM rendering for page builder, previews, and admin UI |
| `next` | `^14.1` | SSG framework for static site builds |
| `@supabase/supabase-js` | `^2.39` | Supabase client SDK |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── services/
│   │   ├── website-service.test.ts          # WebsiteService unit tests
│   │   ├── page-service.test.ts             # PageService unit tests
│   │   ├── page-builder-service.test.ts     # PageBuilderService unit tests
│   │   ├── blog-service.test.ts             # BlogService unit tests
│   │   ├── form-service.test.ts             # FormService unit tests
│   │   ├── media-service.test.ts            # MediaService unit tests
│   │   ├── theme-service.test.ts            # ThemeService unit tests
│   │   ├── navigation-service.test.ts       # NavigationService unit tests
│   │   ├── domain-service.test.ts           # DomainService unit tests
│   │   ├── deployment-service.test.ts       # DeploymentService unit tests
│   │   ├── seo-service.test.ts              # SEOService unit tests
│   │   ├── analytics-service.test.ts        # AnalyticsService unit tests
│   │   ├── abtest-service.test.ts           # ABTestService unit tests
│   │   └── i18n-service.test.ts             # I18nService unit tests
│   ├── utils/
│   │   ├── slug.test.ts                     # Slug generation tests
│   │   ├── sitemap.test.ts                  # Sitemap generation tests
│   │   ├── seo.test.ts                      # Meta tag / OG / structured data tests
│   │   ├── image.test.ts                    # Image optimization utility tests
│   │   ├── component-tree.test.ts           # Component tree manipulation tests
│   │   ├── form-validation.test.ts          # Form validation logic tests
│   │   ├── rss.test.ts                      # RSS feed generation tests
│   │   └── sanitization.test.ts             # Content sanitization tests
│   ├── integration/
│   │   ├── site-lifecycle.test.ts           # Create → configure → deploy → delete
│   │   ├── page-publishing.test.ts          # Draft → publish → version → revert
│   │   ├── blog-workflow.test.ts            # Create → schedule → publish → RSS
│   │   ├── form-submission.test.ts          # Submit → validate → store → notify
│   │   ├── media-pipeline.test.ts           # Upload → optimize → serve → delete
│   │   ├── theme-application.test.ts        # Apply → customize → preview → build
│   │   ├── domain-setup.test.ts             # Add → verify → SSL → activate
│   │   ├── abtest-lifecycle.test.ts         # Create → start → track → complete
│   │   ├── i18n-workflow.test.ts            # Add locale → translate → build → serve
│   │   └── multi-tenant.test.ts             # RLS isolation verification
│   └── e2e/
│       ├── page-builder.test.ts             # Full page builder workflow
│       ├── site-deployment.test.ts          # Build and deploy flow
│       └── form-public-submit.test.ts       # Public form submission flow
```

### Running Tests

```bash
# Run all website module tests
pnpm test --filter=@mcv/growth/website

# Run specific test suite
pnpm test --filter=@mcv/growth/website -- --grep "PageService"

# Run integration tests only (requires test database)
pnpm test:integration --filter=@mcv/growth/website

# Run e2e tests (requires running services)
pnpm test:e2e --filter=@mcv/growth/website

# Run with coverage
pnpm test:coverage --filter=@mcv/growth/website
```

### Unit Test Examples

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PageService } from '../services/page-service';
import { createMockDb, createMockVenture, createMockSite } from '@mcv/core/testing';

describe('PageService', () => {
  let pageService: PageService;
  let mockDb: ReturnType<typeof createMockDb>;
  let site: ReturnType<typeof createMockSite>;

  beforeEach(() => {
    mockDb = createMockDb();
    site = createMockSite({ ventureId: 'venture_1' });
    pageService = new PageService(mockDb);
  });

  describe('createPage', () => {
    it('should create a page with auto-generated path from slug', async () => {
      const page = await pageService.createPage({
        siteId: site.id,
        title: 'About Us',
        slug: 'about-us',
        layout: 'default',
        authorId: 'user_1',
      });

      expect(page.title).toBe('About Us');
      expect(page.slug).toBe('about-us');
      expect(page.path).toBe('/about-us');
      expect(page.status).toBe('draft');
      expect(page.layout).toBe('default');
    });

    it('should generate slug from title if not provided', async () => {
      const page = await pageService.createPage({
        siteId: site.id,
        title: 'Our Amazing Features & Benefits!',
        layout: 'default',
        authorId: 'user_1',
      });

      expect(page.slug).toBe('our-amazing-features-benefits');
      expect(page.path).toBe('/our-amazing-features-benefits');
    });

    it('should reject duplicate paths within the same site and locale', async () => {
      await pageService.createPage({
        siteId: site.id,
        title: 'About',
        slug: 'about',
        layout: 'default',
        authorId: 'user_1',
      });

      await expect(
        pageService.createPage({
          siteId: site.id,
          title: 'About (Duplicate)',
          slug: 'about',
          layout: 'default',
          authorId: 'user_1',
        })
      ).rejects.toThrow('WEBSITE_PAGE_PATH_CONFLICT');
    });

    it('should allow same slug in different locales', async () => {
      const enPage = await pageService.createPage({
        siteId: site.id,
        title: 'About',
        slug: 'about',
        layout: 'default',
        authorId: 'user_1',
        locale: 'en-US',
      });

      const frPage = await pageService.createPage({
        siteId: site.id,
        title: 'À propos',
        slug: 'about',
        layout: 'default',
        authorId: 'user_1',
        locale: 'fr-FR',
        canonicalPageId: enPage.id,
      });

      expect(enPage.path).toBe('/about');
      expect(frPage.path).toBe('/about');
      expect(frPage.locale).toBe('fr-FR');
      expect(frPage.canonicalPageId).toBe(enPage.id);
    });
  });

  describe('publishPage', () => {
    it('should create a version snapshot and update status', async () => {
      const page = await pageService.createPage({
        siteId: site.id,
        title: 'Test Page',
        slug: 'test',
        layout: 'default',
        authorId: 'user_1',
      });

      const published = await pageService.publishPage(page.id, {
        createdBy: 'user_1',
        changeDescription: 'Initial publish',
      });

      expect(published.status).toBe('published');
      expect(published.publishedAt).toBeDefined();
      expect(published.publishedVersionId).toBeDefined();
    });

    it('should increment version number on each publish', async () => {
      const page = await pageService.createPage({
        siteId: site.id,
        title: 'Test Page',
        slug: 'test',
        layout: 'default',
        authorId: 'user_1',
      });

      await pageService.publishPage(page.id, {
        createdBy: 'user_1',
        changeDescription: 'v1',
      });

      await pageService.updatePage(page.id, { title: 'Updated Page' });

      const republished = await pageService.publishPage(page.id, {
        createdBy: 'user_1',
        changeDescription: 'v2',
      });

      const versions = await pageService.listVersions(page.id);
      expect(versions).toHaveLength(2);
      expect(versions[0].versionNumber).toBe(1);
      expect(versions[1].versionNumber).toBe(2);
    });
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext, cleanupTestContext } from '@mcv/core/testing';
import { WebsiteService, PageService, BlogService, DeploymentService } from '../index';

describe('Site Lifecycle Integration', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;
  let websiteService: WebsiteService;
  let pageService: PageService;
  let blogService: BlogService;
  let deploymentService: DeploymentService;

  beforeAll(async () => {
    ctx = await createTestContext({
      modules: ['@mcv/growth/website'],
      seed: true,
    });
    websiteService = new WebsiteService(ctx.db);
    pageService = new PageService(ctx.db);
    blogService = new BlogService(ctx.db);
    deploymentService = new DeploymentService(ctx.db);
  });

  afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  it('should create a site, add pages and posts, then deploy', async () => {
    // Create site
    const site = await websiteService.createSite({
      ventureId: ctx.venture.id,
      name: 'Integration Test Site',
      slug: 'integration-test',
      config: {
        title: 'Test Site',
        tagline: 'For integration testing',
        baseUrl: null,
        defaultLayout: 'default',
        blogEnabled: true,
        blogPrefix: '/blog',
        blogPostsPerPage: 10,
        commentsEnabled: false,
        commentModeration: 'none',
        rssEnabled: true,
        notFoundPageId: null,
        redirects: [],
        customHeaders: {},
        passwordProtected: false,
        passwordHash: null,
        build: {
          framework: 'static',
          outputDir: '_site',
          incrementalBuilds: false,
          imageOptimization: { enabled: false, formats: ['webp'], quality: 85, maxWidth: 2048, generateBlurHash: false },
          minify: { html: true, css: true, js: true },
          assetCacheMaxAge: 86400,
          pageCacheMaxAge: 3600,
        },
        seo: {
          titleTemplate: '%s | Test',
          defaultDescription: 'Test site',
          defaultOgImage: null,
          twitterCardType: 'summary',
          twitterHandle: null,
          sitemapEnabled: true,
          robots: { allowAll: true, disallowPaths: [], customRules: null },
          structuredDataEnabled: false,
          organization: null,
        },
      },
    });

    expect(site.id).toBeDefined();
    expect(site.status).toBe('active');

    // Create pages
    const homePage = await pageService.createPage({
      siteId: site.id,
      title: 'Home',
      slug: '',
      path: '/',
      layout: 'landing',
      authorId: ctx.user.id,
    });

    const aboutPage = await pageService.createPage({
      siteId: site.id,
      title: 'About',
      slug: 'about',
      path: '/about',
      layout: 'default',
      authorId: ctx.user.id,
    });

    // Publish pages
    await pageService.publishPage(homePage.id, { createdBy: ctx.user.id, changeDescription: 'Launch' });
    await pageService.publishPage(aboutPage.id, { createdBy: ctx.user.id, changeDescription: 'Launch' });

    // Create blog post
    const post = await blogService.createPost({
      siteId: site.id,
      title: 'First Post',
      slug: 'first-post',
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world!' }] }] },
      authorId: ctx.user.id,
    });

    await blogService.publishPost(post.id);

    // Verify deployment
    const deployment = await websiteService.deploySite(site.id);
    expect(deployment.status).toBe('queued');
    expect(deployment.type).toBe('full');

    // Wait for build (in test, this is synchronous)
    const completedDeployment = await deploymentService.waitForCompletion(deployment.id, { timeoutMs: 30000 });
    expect(completedDeployment.status).toBe('deployed');
    expect(completedDeployment.pagesBuilt).toBe(3);  // home + about + blog post

    // Verify the site is queryable
    const sites = await websiteService.listSites(ctx.venture.id);
    expect(sites.items).toHaveLength(1);
    expect(sites.items[0].lastDeployStatus).toBe('deployed');

    // Clean up
    await websiteService.deleteSite(site.id);
    const deleted = await websiteService.getSite(site.id).catch(() => null);
    expect(deleted).toBeNull();
  });

  it('should enforce multi-tenant isolation', async () => {
    // Create site in venture A
    const siteA = await websiteService.createSite({
      ventureId: ctx.venture.id,
      name: 'Venture A Site',
      slug: 'venture-a',
      config: { /* minimal config */ } as any,
    });

    // Switch to venture B context
    const ventureB = await ctx.createVenture('Venture B');

    // Venture B should not see venture A's site
    const sitesB = await websiteService.listSites(ventureB.id);
    expect(sitesB.items).toHaveLength(0);

    // Direct ID access should fail
    await expect(
      websiteService.getSite(siteA.id)  // with venture B context
    ).rejects.toThrow('WEBSITE_SITE_NOT_FOUND');

    // Clean up
    await ctx.switchVenture(ctx.venture.id);
    await websiteService.deleteSite(siteA.id);
  });
});
```

### Test Utilities

```typescript
// @mcv/growth/website/testing — exported test helpers

import {
  createMockSite,
  createMockPage,
  createMockComponent,
  createMockBlogPost,
  createMockForm,
  createMockNavigation,
  createMockMediaAsset,
  createMockTheme,
  createMockDeployment,
  createMockABTest,
  createMockFormSubmission,
  createMockComponentTree,
  buildMockPageWithComponents,
} from '@mcv/growth/website/testing';

// Example: Create a mock page with a full component tree
const mockPage = buildMockPageWithComponents({
  siteId: 'site_1',
  title: 'Test Landing Page',
  components: [
    { type: 'hero', props: { title: 'Test Hero', subtitle: 'Subtitle' } },
    {
      type: 'features',
      props: { title: 'Features', features: [] },
      children: [
        { type: 'text', props: { content: 'Feature 1' } },
        { type: 'text', props: { content: 'Feature 2' } },
      ],
    },
    { type: 'cta', props: { title: 'CTA', ctaText: 'Click Me' } },
  ],
});
```

### Coverage Requirements

| Area | Minimum Coverage | Notes |
|---|---|---|
| Services | 90% | Core business logic — high coverage essential |
| Utilities | 95% | Pure functions — easy to test, critical for correctness |
| Validators | 95% | Input validation — cover all edge cases |
| Router/API | 80% | tRPC routes — test auth, input validation, error cases |
| Components | 70% | React components — snapshot + interaction tests |
| Integration | N/A | Focus on critical paths (site lifecycle, publishing, deployment) |
| E2E | N/A | Smoke tests for page builder and public-facing features |

---

*This document is auto-generated from the `@mcv/growth/website` module source. Last updated: 2026-02-09.*