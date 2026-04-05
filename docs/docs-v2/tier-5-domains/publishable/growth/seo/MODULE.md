# @mcv/growth/seo

> Search engine optimization toolkit for the MCV.ONE platform — technical auditing, keyword tracking, sitemap generation, on-page optimization, structured data, internal linking, page speed monitoring, competitor analysis, and automated SEO reporting across all venture websites.

**Package:** `@mcv/growth/seo`
**Layer:** Tier 5 — Domain Module (Growth)
**Since:** 0.12.0
**Status:** Production
**Maintainer:** MCV Growth Team

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
- [Changelog](#changelog)

---

## Purpose

Every venture launched on MCV.ONE needs organic search visibility. Without it, paid channels bear the entire burden of acquisition and the unit economics never converge. `@mcv/growth/seo` exists to provide a unified, multi-tenant SEO platform that handles the full lifecycle of search optimization — from crawling and auditing a site's technical health, through tracking keyword rankings and analyzing competitors, to generating structured data and producing actionable reports that content teams and engineers can act on immediately.

### Why This Module Exists

1. **Fragmented tooling is expensive.** Commercial SEO suites (Ahrefs, SEMrush, Screaming Frog) charge per-seat, per-domain, or per-crawl. When you operate dozens of venture websites, the costs compound into six figures annually. This module internalizes the critical capabilities.

2. **SEO data belongs in the platform graph.** Keyword rankings, page speed metrics, and audit results are more powerful when they live alongside content, analytics, and campaign data. A CMS editor can see on-page scores inline. A growth engineer can correlate ranking changes with deploy events. A reporting dashboard can blend SEO data with revenue attribution.

3. **Multi-site SEO demands coordination.** Ventures under the MCV umbrella can cross-link strategically, share keyword research, avoid cannibalization, and leverage domain authority collectively. No off-the-shelf tool understands the portfolio topology.

4. **Automation reduces drift.** SEO is not a one-time project — it's continuous hygiene. Automated crawls, daily rank checks, weekly reports, and real-time structured data generation keep every site healthy without constant manual intervention.

### What It Does

| Capability | Description |
|---|---|
| **Technical SEO Audit** | Crawl site pages via Puppeteer, detect broken links, missing meta tags, slow pages, redirect chains, duplicate content, canonical issues, and more. Every issue gets a severity score and remediation suggestion. |
| **Keyword Tracking** | Monitor keyword rankings across Google and Bing, track daily position changes, detect SERP feature appearances (featured snippets, PAA, local pack), and compare against competitors. |
| **Sitemap Generation** | Auto-generate XML sitemaps with configurable priority and changefreq rules, support for image sitemaps, news sitemaps, and video sitemaps. Submit to Google Search Console and Bing Webmaster Tools. |
| **On-Page Optimization** | Score meta titles and descriptions against best practices, analyze heading structure (H1–H6 hierarchy), measure keyword density, compute Flesch readability scores, and evaluate content length. |
| **Schema / Structured Data** | Generate JSON-LD for products, articles, FAQ pages, breadcrumbs, organization, local business, events, and recipes. Validate against Google's structured data guidelines. |
| **Internal Linking** | Build a link graph of the entire site, detect orphan pages with no inbound links, optimize anchor text distribution, and model link equity flow using PageRank-style algorithms. |
| **Page Speed** | Track Core Web Vitals (LCP, FID/INP, CLS) over time, integrate with Lighthouse for detailed audits, and generate performance recommendations prioritized by impact. |
| **Competitor Analysis** | Compare domain authority estimates, identify keyword gaps (terms competitors rank for that you don't), and analyze backlink profile differences. |
| **SEO Reporting** | Produce automated weekly and monthly reports with ranking trends, traffic impact estimates, issue summaries, and prioritized action items. Deliver via email, Slack, or dashboard. |
| **Multi-Site Management** | Manage SEO across all venture websites from a single interface, share keyword universes, identify cross-site link opportunities, and prevent keyword cannibalization. |

### What It Does NOT Do

- **Link building outreach.** This module analyzes backlink profiles but does not send outreach emails or manage link building campaigns. See `@mcv/growth/outreach` for that.
- **Content generation.** On-page analysis provides recommendations, but actual content creation belongs in `@mcv/content/editor` and `@mcv/ai/writer`.
- **Paid search management.** Google Ads and Bing Ads are handled by `@mcv/growth/ads`.
- **Social media SEO.** Social signals and social metadata (Open Graph, Twitter Cards) are handled by `@mcv/growth/social`.

---

## Exports

```typescript
// ── Primary Service ──────────────────────────────────────────────
export { SEOService }              from './service';
export { createSEORouter }         from './router';

// ── Technical Audit ──────────────────────────────────────────────
export { SEOAuditor }              from './audit/auditor';
export { Crawler }                 from './audit/crawler';
export { IssueDetector }           from './audit/issue-detector';
export { AuditScheduler }          from './audit/scheduler';

// ── Keyword Tracking ─────────────────────────────────────────────
export { KeywordTracker }          from './keywords/tracker';
export { RankChecker }             from './keywords/rank-checker';
export { SERPAnalyzer }            from './keywords/serp-analyzer';
export { KeywordResearch }         from './keywords/research';

// ── Sitemap ──────────────────────────────────────────────────────
export { SitemapGenerator }        from './sitemap/generator';
export { SitemapSubmitter }        from './sitemap/submitter';
export { SitemapValidator }        from './sitemap/validator';

// ── On-Page ──────────────────────────────────────────────────────
export { OnPageAnalyzer }          from './on-page/analyzer';
export { MetaScorer }              from './on-page/meta-scorer';
export { HeadingAnalyzer }         from './on-page/heading-analyzer';
export { ReadabilityScorer }       from './on-page/readability';
export { KeywordDensityChecker }   from './on-page/keyword-density';

// ── Structured Data ──────────────────────────────────────────────
export { StructuredDataGenerator } from './structured-data/generator';
export { SchemaValidator }         from './structured-data/validator';
export { JSONLDBuilder }           from './structured-data/jsonld-builder';

// ── Internal Linking ─────────────────────────────────────────────
export { InternalLinkGraph }       from './linking/graph';
export { OrphanDetector }          from './linking/orphan-detector';
export { LinkEquityModel }         from './linking/equity-model';
export { AnchorTextAnalyzer }      from './linking/anchor-analyzer';

// ── Page Speed ───────────────────────────────────────────────────
export { PageSpeedTracker }        from './speed/tracker';
export { LighthouseRunner }        from './speed/lighthouse';
export { CoreWebVitals }           from './speed/core-web-vitals';
export { SpeedRecommender }        from './speed/recommender';

// ── Competitor Analysis ──────────────────────────────────────────
export { CompetitorAnalyzer }      from './competitors/analyzer';
export { KeywordGapFinder }        from './competitors/keyword-gap';
export { BacklinkComparer }        from './competitors/backlink-comparer';
export { DomainAuthorityEstimator } from './competitors/domain-authority';

// ── Reporting ────────────────────────────────────────────────────
export { SEOReporter }             from './reports/reporter';
export { ReportScheduler }         from './reports/scheduler';
export { ReportRenderer }          from './reports/renderer';
export { TrendAnalyzer }           from './reports/trend-analyzer';

// ── Multi-Site ───────────────────────────────────────────────────
export { MultiSiteManager }        from './multi-site/manager';
export { CannibalizationDetector } from './multi-site/cannibalization';
export { CrossSiteLinker }         from './multi-site/cross-site-linker';

// ── Types ────────────────────────────────────────────────────────
export type {
  // Audit
  SEOAuditConfig,
  SEOAuditResult,
  AuditIssue,
  AuditIssueSeverity,
  AuditIssueCategory,
  CrawlResult,
  CrawlPage,
  CrawlOptions,

  // Keywords
  Keyword,
  KeywordRanking,
  KeywordGroup,
  SERPFeature,
  SERPResult,
  RankingHistory,
  KeywordDifficulty,

  // Sitemap
  SitemapConfig,
  SitemapEntry,
  SitemapType,
  SitemapSubmissionResult,
  ImageSitemapEntry,
  NewsSitemapEntry,

  // On-Page
  OnPageScore,
  MetaAnalysis,
  HeadingStructure,
  ReadabilityResult,
  KeywordDensityResult,
  ContentLengthAssessment,

  // Structured Data
  StructuredDataConfig,
  SchemaType,
  JSONLDOutput,
  ValidationResult,

  // Linking
  LinkNode,
  LinkEdge,
  LinkGraph,
  OrphanPage,
  LinkEquityScore,
  AnchorTextProfile,

  // Speed
  CoreWebVitalsMetrics,
  LighthouseReport,
  SpeedRecommendation,
  PerformanceTrend,

  // Competitors
  Competitor,
  KeywordGap,
  BacklinkProfile,
  DomainAuthorityScore,
  CompetitorComparison,

  // Reports
  SEOReportConfig,
  SEOReportData,
  ReportFrequency,
  RankingTrend,
  TrafficImpact,
  ActionItem,

  // Multi-Site
  SiteConfig,
  CannibalizationResult,
  CrossSiteLinkOpportunity,
  SharedKeywordUniverse,
} from './types';

// ── Schemas (Drizzle) ────────────────────────────────────────────
export {
  seoAudits,
  auditIssues,
  keywords,
  keywordRankings,
  sitemaps,
  onPageScores,
  structuredData,
  internalLinks,
  pageSpeedMetrics,
  seoReports,
  competitors,
  competitorKeywords,
  keywordGroups,
  crawlSessions,
  sitemapEntries,
  linkEquitySnapshots,
} from './schema';
```

---

## Architecture

### High-Level Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Schedule   │────▶│    Crawl     │────▶│   Analyze    │────▶│  Recommend  │
│   (Cron)     │     │  (Puppeteer) │     │  (Detectors) │     │  (Actions)  │
└─────────────┘     └─────────────┘     └──────────────┘     └─────────────┘
       │                   │                    │                    │
       │                   ▼                    ▼                    ▼
       │            ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
       │            │  Page Data   │     │   Issues &   │     │   Reports   │
       │            │  Repository  │     │   Scores     │     │   & Alerts  │
       │            └─────────────┘     └──────────────┘     └─────────────┘
       │                                                           │
       ▼                                                           ▼
┌─────────────┐                                            ┌─────────────┐
│   Keyword   │                                            │  Dashboard  │
│   Tracking  │                                            │   / Email   │
└─────────────┘                                            └─────────────┘
```

### Pipeline Stages

**Stage 1: Schedule & Trigger**

Audits can be triggered on a recurring schedule (daily, weekly, monthly), manually via the dashboard, or automatically on deploy events. The `AuditScheduler` maintains a priority queue of sites ordered by staleness — sites that haven't been audited recently get crawled first.

```
Trigger Sources:
  ├── Cron schedule (configurable per site)
  ├── Manual trigger (dashboard / API)
  ├── Deploy webhook (CI/CD integration)
  └── Alert threshold (e.g., rank drop > 5 positions)
```

**Stage 2: Crawl**

The `Crawler` uses Puppeteer in headless Chrome to navigate every discoverable page on a site. It respects `robots.txt`, follows internal links, records HTTP status codes, measures response times, captures rendered HTML (for JavaScript-heavy sites), and extracts all metadata.

```
Crawler Pipeline:
  URL Queue → Fetch → Render (if JS) → Extract → Store
       ↑                                    │
       └────── Discovered Internal Links ───┘
```

Key crawl parameters:
- **Max pages:** Configurable limit (default: 10,000)
- **Concurrency:** Parallel browser tabs (default: 5)
- **Depth:** Maximum link depth from seed URL (default: unlimited)
- **Rate limit:** Delay between requests (default: 200ms)
- **JS rendering:** Toggle Puppeteer rendering vs. raw HTTP (default: enabled)
- **User agent:** Configurable (default: MCVBot/1.0)
- **Timeout:** Per-page timeout (default: 30s)

**Stage 3: Analyze**

After crawling, the `IssueDetector` runs a battery of checks against each page's data. Detectors are pluggable — each implements a common interface and returns zero or more issues with severity scores.

```
Detector Registry:
  ├── BrokenLinkDetector        — 404s, 5xx, timeout links
  ├── MissingMetaDetector       — No title, no description, no canonical
  ├── DuplicateContentDetector  — Similar content across pages (simhash)
  ├── RedirectChainDetector     — Chains > 2 hops, redirect loops
  ├── SlowPageDetector          — TTFB > threshold, total load > threshold
  ├── MobileUsabilityDetector   — Viewport, tap targets, font size
  ├── ImageOptimizationDetector — Missing alt text, oversized images, no lazy load
  ├── SecurityDetector          — Mixed content, missing HTTPS, HSTS
  ├── CanonicalDetector         — Conflicting canonicals, self-referencing issues
  ├── HreflangDetector          — Missing/invalid hreflang tags
  ├── OpenGraphDetector         — Missing OG tags for social sharing
  ├── SchemaDetector            — Invalid or missing structured data
  ├── HeadingDetector           — Multiple H1s, skipped levels
  ├── InternalLinkDetector      — Orphan pages, excessive links per page
  └── IndexabilityDetector      — Noindex conflicts, robots.txt blocks
```

**Stage 4: Recommend**

Issues are aggregated, deduplicated, and prioritized into actionable recommendations. Each recommendation includes an estimated impact score (based on traffic to affected pages and issue severity), implementation difficulty, and specific remediation steps.

```
Recommendation Engine:
  Issues → Deduplicate → Prioritize (impact × ease) → Group → Format
```

### Subsystem Architecture

#### Keyword Tracking Subsystem

```
┌───────────────┐     ┌──────────────┐     ┌───────────────┐
│  Keyword Pool  │────▶│  Rank Check  │────▶│   Store &     │
│  (per site)    │     │  (GSC + API) │     │   Diff        │
└───────────────┘     └──────────────┘     └───────────────┘
                              │                     │
                              ▼                     ▼
                       ┌──────────────┐     ┌───────────────┐
                       │ SERP Feature │     │  Alert if     │
                       │ Detection    │     │  drop > N     │
                       └──────────────┘     └───────────────┘
```

Keywords are organized into groups (branded, non-branded, long-tail, competitor terms). The `RankChecker` queries Google Search Console API for impression and click data, and optionally uses third-party SERP APIs for real-time position checks. Rankings are stored daily, and the system generates alerts when a keyword drops more than a configurable threshold.

#### Sitemap Subsystem

```
┌───────────────┐     ┌──────────────┐     ┌───────────────┐
│  Page Registry │────▶│  Rule Engine │────▶│  XML Builder  │
│  (from crawl)  │     │  (priority/  │     │  (streaming)  │
│                │     │   changefreq)│     │               │
└───────────────┘     └──────────────┘     └───────────────┘
                                                   │
                              ┌─────────────────────┤
                              ▼                     ▼
                       ┌──────────────┐     ┌───────────────┐
                       │   Validate   │     │   Submit to   │
                       │   (XSD)      │     │   GSC / Bing  │
                       └──────────────┘     └───────────────┘
```

The sitemap generator pulls from the crawl's page registry, applies configurable priority and changefreq rules (e.g., blog posts get `weekly`, product pages get `daily`), and produces standards-compliant XML. It supports sitemap index files for large sites (>50,000 URLs), image sitemaps, news sitemaps, and video sitemaps.

#### Page Speed Subsystem

```
┌───────────────┐     ┌──────────────┐     ┌───────────────┐
│  URL Sample    │────▶│  Lighthouse  │────▶│  CWV Extract  │
│  (stratified)  │     │  (headless)  │     │  & Store      │
└───────────────┘     └──────────────┘     └───────────────┘
                                                   │
                                                   ▼
                                           ┌───────────────┐
                                           │  Trend &      │
                                           │  Recommend    │
                                           └───────────────┘
```

Page speed is measured by running Lighthouse audits against a stratified sample of URLs (homepage, top traffic pages, category pages, random sample). Core Web Vitals (LCP, FID/INP, CLS) are extracted and stored as time-series data for trend analysis.

#### Internal Linking Subsystem

```
┌───────────────┐     ┌──────────────┐     ┌───────────────┐
│  Crawl Links   │────▶│  Build Graph │────▶│  PageRank     │
│  (href, anchor)│     │  (adjacency) │     │  Simulation   │
└───────────────┘     └──────────────┘     └───────────────┘
       │                                          │
       ▼                                          ▼
┌───────────────┐                         ┌───────────────┐
│  Orphan        │                         │  Equity       │
│  Detection     │                         │  Distribution │
└───────────────┘                         └───────────────┘
```

The internal linking subsystem constructs a directed graph of all internal links discovered during the crawl. It runs a simplified PageRank algorithm to model link equity flow, identifies orphan pages (pages with zero inbound internal links), and recommends anchor text improvements.

### Data Flow

```
┌─────────┐   webhook    ┌──────────┐   crawl    ┌──────────┐
│  CI/CD  │────────────▶│  tRPC    │───────────▶│ Puppeteer │
│  Deploy │              │  Router  │            │  Crawler  │
└─────────┘              └──────────┘            └──────────┘
                              │                       │
                         ┌────┴────┐            ┌─────┴──────┐
                         │ Keyword │            │  Page Data  │
                         │ Tracker │            │  (HTML/meta)│
                         └────┬────┘            └─────┬──────┘
                              │                       │
                              ▼                       ▼
                    ┌──────────────────────────────────────┐
                    │         Supabase PostgreSQL            │
                    │  ┌────────────┐  ┌─────────────────┐ │
                    │  │  keywords  │  │   seo_audits    │ │
                    │  │  rankings  │  │   audit_issues  │ │
                    │  │  groups    │  │   crawl_sessions│ │
                    │  └────────────┘  └─────────────────┘ │
                    │  ┌────────────┐  ┌─────────────────┐ │
                    │  │  sitemaps  │  │  on_page_scores │ │
                    │  │  entries   │  │  structured_data│ │
                    │  └────────────┘  └─────────────────┘ │
                    │  ┌────────────┐  ┌─────────────────┐ │
                    │  │  internal  │  │  page_speed     │ │
                    │  │  links     │  │  metrics        │ │
                    │  └────────────┘  └─────────────────┘ │
                    │  ┌────────────┐  ┌─────────────────┐ │
                    │  │  seo       │  │  competitors    │ │
                    │  │  reports   │  │  comp_keywords  │ │
                    │  └────────────┘  └─────────────────┘ │
                    └──────────────────────────────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │   Dashboard   │
                              │   / Reports   │
                              │   / Alerts    │
                              └───────────────┘
```

### Multi-Tenancy

All data is scoped by `tenant_id` (the venture/organization) and `site_id` (the specific website). Row-Level Security (RLS) policies in Supabase ensure that:

1. Users can only see SEO data for sites belonging to their tenant.
2. Service-role operations (crawlers, rank checkers) bypass RLS but always include tenant context.
3. Cross-tenant queries (for the multi-site manager) require explicit portfolio-level permissions.

```sql
-- Example RLS policy
CREATE POLICY "tenant_isolation" ON seo_audits
  USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

### Queue & Job Architecture

SEO operations are often long-running (a full-site crawl can take hours). The module uses a job queue pattern:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Job Queue   │────▶│   Workers    │────▶│  Results DB  │
│  (pg-boss)   │     │  (pooled)    │     │  (Supabase)  │
└──────────────┘     └──────────────┘     └──────────────┘
       ▲                                         │
       │              Progress Events             │
       └──────────────────────────────────────────┘
```

Job types:
- `seo.crawl` — Full or incremental site crawl
- `seo.audit` — Run issue detectors on crawl data
- `seo.rank-check` — Daily keyword rank check
- `seo.lighthouse` — Lighthouse audit for a URL batch
- `seo.sitemap-generate` — Regenerate sitemaps
- `seo.sitemap-submit` — Submit sitemaps to search engines
- `seo.report-generate` — Generate weekly/monthly report
- `seo.competitor-analyze` — Run competitor analysis

---

## Core Interfaces

### SEOService

The primary entry point for all SEO operations. Composes the subsystem services and provides a unified API.

```typescript
interface SEOService {
  // ── Audit ────────────────────────────────────────────────────
  /** Start a new SEO audit for a site. Returns audit ID for tracking. */
  startAudit(siteId: string, config?: SEOAuditConfig): Promise<{ auditId: string; jobId: string }>;

  /** Get audit status (pending, crawling, analyzing, complete, failed). */
  getAuditStatus(auditId: string): Promise<AuditStatus>;

  /** Get completed audit results with issues. */
  getAuditResult(auditId: string): Promise<SEOAuditResult>;

  /** List audit history for a site. */
  listAudits(siteId: string, opts?: PaginationOpts): Promise<Paginated<SEOAuditSummary>>;

  /** Compare two audits to see what improved or regressed. */
  compareAudits(auditId1: string, auditId2: string): Promise<AuditComparison>;

  // ── Keywords ─────────────────────────────────────────────────
  /** Add keywords to track for a site. */
  addKeywords(siteId: string, keywords: NewKeyword[]): Promise<Keyword[]>;

  /** Remove keywords from tracking. */
  removeKeywords(keywordIds: string[]): Promise<void>;

  /** Get current rankings for tracked keywords. */
  getRankings(siteId: string, opts?: RankingQueryOpts): Promise<KeywordRanking[]>;

  /** Get ranking history for a keyword over time. */
  getRankingHistory(keywordId: string, range: DateRange): Promise<RankingHistory>;

  /** Get keyword groups for a site. */
  getKeywordGroups(siteId: string): Promise<KeywordGroup[]>;

  /** Discover keyword suggestions based on seed terms. */
  suggestKeywords(siteId: string, seeds: string[]): Promise<KeywordSuggestion[]>;

  // ── Sitemap ──────────────────────────────────────────────────
  /** Generate a sitemap for a site. */
  generateSitemap(siteId: string, config?: SitemapConfig): Promise<SitemapResult>;

  /** Submit sitemap to search engines. */
  submitSitemap(siteId: string, sitemapUrl: string): Promise<SitemapSubmissionResult>;

  /** Get sitemap generation history. */
  listSitemaps(siteId: string): Promise<SitemapRecord[]>;

  /** Validate an existing sitemap URL. */
  validateSitemap(url: string): Promise<SitemapValidation>;

  // ── On-Page ──────────────────────────────────────────────────
  /** Analyze a single page for on-page SEO factors. */
  analyzePage(url: string, targetKeyword?: string): Promise<OnPageScore>;

  /** Batch analyze multiple pages. */
  analyzePages(siteId: string, urls: string[], targetKeywords?: Map<string, string>): Promise<OnPageScore[]>;

  /** Get on-page scores for a site, sorted by score (ascending = worst first). */
  getOnPageScores(siteId: string, opts?: PaginationOpts & { sortDir?: 'asc' | 'desc' }): Promise<Paginated<OnPageScore>>;

  // ── Structured Data ──────────────────────────────────────────
  /** Generate JSON-LD for a page based on its content and type. */
  generateStructuredData(url: string, schemaType: SchemaType, data: Record<string, unknown>): Promise<JSONLDOutput>;

  /** Validate existing structured data on a page. */
  validateStructuredData(url: string): Promise<ValidationResult[]>;

  /** Get structured data coverage report for a site. */
  getStructuredDataCoverage(siteId: string): Promise<StructuredDataCoverage>;

  // ── Internal Linking ─────────────────────────────────────────
  /** Build or refresh the internal link graph for a site. */
  buildLinkGraph(siteId: string): Promise<LinkGraphSummary>;

  /** Get orphan pages (no inbound internal links). */
  getOrphanPages(siteId: string): Promise<OrphanPage[]>;

  /** Get link equity distribution across pages. */
  getLinkEquity(siteId: string): Promise<LinkEquityScore[]>;

  /** Get suggested internal links for a page. */
  suggestInternalLinks(siteId: string, pageUrl: string): Promise<InternalLinkSuggestion[]>;

  // ── Page Speed ───────────────────────────────────────────────
  /** Run Lighthouse audit for specific URLs. */
  runSpeedAudit(siteId: string, urls?: string[]): Promise<{ jobId: string }>;

  /** Get Core Web Vitals for a site. */
  getCoreWebVitals(siteId: string, range?: DateRange): Promise<CoreWebVitalsMetrics[]>;

  /** Get speed recommendations for a site. */
  getSpeedRecommendations(siteId: string): Promise<SpeedRecommendation[]>;

  /** Get page speed trends over time. */
  getSpeedTrends(siteId: string, range: DateRange): Promise<PerformanceTrend>;

  // ── Competitors ──────────────────────────────────────────────
  /** Add a competitor domain to track. */
  addCompetitor(siteId: string, domain: string): Promise<Competitor>;

  /** Remove a competitor. */
  removeCompetitor(competitorId: string): Promise<void>;

  /** Get keyword gap analysis. */
  getKeywordGaps(siteId: string, competitorId?: string): Promise<KeywordGap[]>;

  /** Compare domain metrics against competitors. */
  compareWithCompetitors(siteId: string): Promise<CompetitorComparison>;

  // ── Reporting ────────────────────────────────────────────────
  /** Generate an SEO report on demand. */
  generateReport(siteId: string, config?: SEOReportConfig): Promise<SEOReportData>;

  /** Schedule recurring reports. */
  scheduleReport(siteId: string, config: SEOReportConfig & { frequency: ReportFrequency }): Promise<ReportScheduleRecord>;

  /** List generated reports for a site. */
  listReports(siteId: string, opts?: PaginationOpts): Promise<Paginated<SEOReportSummary>>;

  /** Get a specific report. */
  getReport(reportId: string): Promise<SEOReportData>;

  // ── Multi-Site ───────────────────────────────────────────────
  /** Get portfolio-level SEO overview. */
  getPortfolioOverview(tenantId: string): Promise<PortfolioSEOOverview>;

  /** Detect keyword cannibalization across sites. */
  detectCannibalization(tenantId: string): Promise<CannibalizationResult[]>;

  /** Find cross-site linking opportunities. */
  findCrossSiteLinks(tenantId: string): Promise<CrossSiteLinkOpportunity[]>;
}
```

### SEOAuditConfig

```typescript
interface SEOAuditConfig {
  /** Seed URLs to start crawling from. Defaults to site homepage. */
  seedUrls?: string[];

  /** Maximum number of pages to crawl. */
  maxPages?: number;                         // default: 10_000

  /** Maximum crawl depth from seed URLs. */
  maxDepth?: number;                         // default: Infinity

  /** Number of concurrent browser tabs. */
  concurrency?: number;                      // default: 5

  /** Delay between requests in milliseconds. */
  requestDelay?: number;                     // default: 200

  /** Whether to render JavaScript (uses Puppeteer). */
  renderJs?: boolean;                        // default: true

  /** Custom user agent string. */
  userAgent?: string;                        // default: 'MCVBot/1.0'

  /** Per-page timeout in milliseconds. */
  pageTimeout?: number;                      // default: 30_000

  /** Whether to respect robots.txt. */
  respectRobotsTxt?: boolean;                // default: true

  /** URL patterns to exclude from crawl. */
  excludePatterns?: string[];

  /** URL patterns to include (if set, only these are crawled). */
  includePatterns?: string[];

  /** Which detectors to run (all by default). */
  detectors?: AuditIssueCategory[];

  /** Custom thresholds for detectors. */
  thresholds?: Partial<AuditThresholds>;

  /** Whether to perform an incremental crawl (only changed pages). */
  incremental?: boolean;                     // default: false

  /** Previous audit ID for incremental comparison. */
  baseAuditId?: string;

  /** HTTP authentication credentials if site is behind auth. */
  auth?: { username: string; password: string };

  /** Custom headers to send with every request. */
  headers?: Record<string, string>;
}
```

### SEOAuditResult

```typescript
interface SEOAuditResult {
  id: string;
  siteId: string;
  tenantId: string;
  status: 'pending' | 'crawling' | 'analyzing' | 'complete' | 'failed';

  /** Crawl statistics. */
  crawlStats: {
    pagesDiscovered: number;
    pagesCrawled: number;
    pagesErrored: number;
    totalTimeMs: number;
    avgResponseTimeMs: number;
    bytesDownloaded: number;
  };

  /** Issue summary by severity. */
  issueSummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };

  /** Issue summary by category. */
  issuesByCategory: Record<AuditIssueCategory, number>;

  /** Overall health score (0-100). */
  healthScore: number;

  /** All detected issues. */
  issues: AuditIssue[];

  /** Comparison with previous audit (if available). */
  comparison?: {
    previousAuditId: string;
    healthScoreDelta: number;
    newIssues: number;
    resolvedIssues: number;
    unchangedIssues: number;
  };

  createdAt: Date;
  completedAt?: Date;
}
```

### AuditIssue

```typescript
interface AuditIssue {
  id: string;
  auditId: string;
  category: AuditIssueCategory;
  severity: AuditIssueSeverity;
  title: string;
  description: string;
  affectedUrl: string;
  affectedElement?: string;

  /** Machine-readable issue code (e.g., 'MISSING_META_TITLE'). */
  code: string;

  /** Estimated traffic impact (0-100). */
  impactScore: number;

  /** How easy this is to fix (1=trivial, 5=complex). */
  fixDifficulty: 1 | 2 | 3 | 4 | 5;

  /** Specific remediation instructions. */
  remediation: string;

  /** Link to documentation explaining this issue. */
  helpUrl?: string;

  /** Additional context data (varies by issue type). */
  details?: Record<string, unknown>;

  /** Whether this issue was present in the previous audit. */
  isNew?: boolean;
}

type AuditIssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

type AuditIssueCategory =
  | 'broken_links'
  | 'missing_meta'
  | 'duplicate_content'
  | 'redirect_chains'
  | 'slow_pages'
  | 'mobile_usability'
  | 'image_optimization'
  | 'security'
  | 'canonical'
  | 'hreflang'
  | 'open_graph'
  | 'structured_data'
  | 'heading_structure'
  | 'internal_linking'
  | 'indexability';
```

### KeywordTracker

```typescript
interface KeywordTracker {
  /** Add keywords to the tracking pool. */
  addKeywords(siteId: string, keywords: NewKeyword[]): Promise<Keyword[]>;

  /** Remove keywords from tracking. */
  removeKeywords(keywordIds: string[]): Promise<void>;

  /** Update keyword metadata (group, target URL, etc.). */
  updateKeyword(keywordId: string, updates: Partial<KeywordUpdate>): Promise<Keyword>;

  /** Get all tracked keywords for a site. */
  getKeywords(siteId: string, opts?: KeywordFilterOpts): Promise<Keyword[]>;

  /** Check current rankings for all keywords (triggers background job). */
  checkRankings(siteId: string): Promise<{ jobId: string }>;

  /** Get latest ranking snapshot for a site. */
  getLatestRankings(siteId: string): Promise<KeywordRanking[]>;

  /** Get ranking history over time for a keyword. */
  getRankingHistory(keywordId: string, range: DateRange): Promise<RankingDataPoint[]>;

  /** Get ranking distribution (positions 1-3, 4-10, 11-20, 21-50, 50+). */
  getRankingDistribution(siteId: string): Promise<RankingDistribution>;

  /** Detect SERP features for tracked keywords. */
  detectSERPFeatures(siteId: string): Promise<SERPFeatureReport>;

  /** Create or update keyword groups. */
  manageGroups(siteId: string, groups: KeywordGroupInput[]): Promise<KeywordGroup[]>;
}

interface Keyword {
  id: string;
  siteId: string;
  tenantId: string;
  term: string;
  searchEngine: 'google' | 'bing' | 'both';
  locale: string;                            // e.g., 'en-US'
  device: 'desktop' | 'mobile' | 'both';
  groupId?: string;
  targetUrl?: string;
  monthlyVolume?: number;
  difficulty?: number;                       // 0-100
  cpc?: number;
  currentPosition?: number;
  previousPosition?: number;
  bestPosition?: number;
  bestPositionDate?: Date;
  serpFeatures?: SERPFeature[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface KeywordRanking {
  keywordId: string;
  term: string;
  position: number | null;                   // null = not ranking
  previousPosition: number | null;
  change: number;                            // positive = improved
  url: string | null;                        // ranking URL
  searchEngine: 'google' | 'bing';
  device: 'desktop' | 'mobile';
  serpFeatures: SERPFeature[];
  checkedAt: Date;
}

type SERPFeature =
  | 'featured_snippet'
  | 'people_also_ask'
  | 'local_pack'
  | 'knowledge_panel'
  | 'image_pack'
  | 'video_carousel'
  | 'top_stories'
  | 'shopping_results'
  | 'site_links'
  | 'faq_rich_result'
  | 'review_stars'
  | 'breadcrumbs';
```

### OnPageAnalysis

```typescript
interface OnPageAnalyzer {
  /** Run full on-page analysis for a URL. */
  analyze(url: string, targetKeyword?: string): Promise<OnPageScore>;

  /** Batch analyze multiple URLs. */
  batchAnalyze(urls: string[], keywordMap?: Map<string, string>): Promise<OnPageScore[]>;

  /** Get just the meta tag analysis. */
  analyzeMeta(url: string): Promise<MetaAnalysis>;

  /** Get just the heading structure. */
  analyzeHeadings(url: string): Promise<HeadingStructure>;

  /** Get readability score. */
  analyzeReadability(url: string): Promise<ReadabilityResult>;

  /** Get keyword density analysis. */
  analyzeKeywordDensity(url: string, keyword: string): Promise<KeywordDensityResult>;
}

interface OnPageScore {
  url: string;
  siteId: string;
  overallScore: number;                      // 0-100

  meta: MetaAnalysis;
  headings: HeadingStructure;
  readability: ReadabilityResult;
  keywordDensity?: KeywordDensityResult;
  contentLength: ContentLengthAssessment;
  images: ImageAnalysis;
  links: PageLinkAnalysis;

  recommendations: OnPageRecommendation[];
  analyzedAt: Date;
}

interface MetaAnalysis {
  title: {
    value: string | null;
    length: number;
    score: number;                           // 0-100
    issues: string[];
  };
  description: {
    value: string | null;
    length: number;
    score: number;
    issues: string[];
  };
  canonical: {
    value: string | null;
    isSelfReferencing: boolean;
    issues: string[];
  };
  robots: {
    value: string | null;
    isIndexable: boolean;
    isFollowable: boolean;
  };
  openGraph: {
    title: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
    completeness: number;                    // 0-100
  };
}

interface HeadingStructure {
  h1Count: number;
  h1Values: string[];
  hierarchy: HeadingNode[];
  issues: string[];
  score: number;                             // 0-100
}

interface HeadingNode {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  children: HeadingNode[];
}

interface ReadabilityResult {
  fleschReadingEase: number;                 // 0-100
  fleschKincaidGrade: number;
  gunningFogIndex: number;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  score: number;                             // 0-100 (our normalized score)
  level: 'very_easy' | 'easy' | 'moderate' | 'difficult' | 'very_difficult';
}

interface KeywordDensityResult {
  keyword: string;
  occurrences: number;
  density: number;                           // percentage
  inTitle: boolean;
  inH1: boolean;
  inFirstParagraph: boolean;
  inMetaDescription: boolean;
  inUrl: boolean;
  prominenceScore: number;                   // 0-100
  recommendation: 'too_low' | 'optimal' | 'too_high';
}

interface ContentLengthAssessment {
  wordCount: number;
  characterCount: number;
  assessment: 'thin' | 'short' | 'adequate' | 'comprehensive' | 'excessive';
  recommendedMin: number;
  recommendedMax: number;
  score: number;
}
```

### StructuredDataGenerator

```typescript
interface StructuredDataGenerator {
  /** Generate JSON-LD for a given schema type. */
  generate(type: SchemaType, data: Record<string, unknown>): JSONLDOutput;

  /** Generate article schema. */
  article(data: ArticleSchemaInput): JSONLDOutput;

  /** Generate product schema. */
  product(data: ProductSchemaInput): JSONLDOutput;

  /** Generate FAQ schema. */
  faq(data: FAQSchemaInput): JSONLDOutput;

  /** Generate breadcrumb schema. */
  breadcrumbs(data: BreadcrumbSchemaInput): JSONLDOutput;

  /** Generate organization schema. */
  organization(data: OrganizationSchemaInput): JSONLDOutput;

  /** Generate local business schema. */
  localBusiness(data: LocalBusinessSchemaInput): JSONLDOutput;

  /** Generate event schema. */
  event(data: EventSchemaInput): JSONLDOutput;

  /** Generate recipe schema. */
  recipe(data: RecipeSchemaInput): JSONLDOutput;

  /** Generate how-to schema. */
  howTo(data: HowToSchemaInput): JSONLDOutput;

  /** Validate generated JSON-LD against Google's requirements. */
  validate(jsonld: JSONLDOutput): ValidationResult;
}

type SchemaType =
  | 'Article'
  | 'BlogPosting'
  | 'Product'
  | 'FAQPage'
  | 'BreadcrumbList'
  | 'Organization'
  | 'LocalBusiness'
  | 'Event'
  | 'Recipe'
  | 'HowTo'
  | 'WebSite'
  | 'WebPage'
  | 'Person'
  | 'VideoObject'
  | 'ItemList'
  | 'Review'
  | 'AggregateRating'
  | 'SoftwareApplication';

interface JSONLDOutput {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: unknown;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
  googleRequirement: boolean;              // whether this is required by Google specifically
}
```

### InternalLinkGraph

```typescript
interface InternalLinkGraph {
  /** Build the link graph from crawl data. */
  build(siteId: string): Promise<LinkGraphSummary>;

  /** Get the full graph (nodes + edges). */
  getGraph(siteId: string): Promise<LinkGraph>;

  /** Get orphan pages (no inbound links). */
  getOrphanPages(siteId: string): Promise<OrphanPage[]>;

  /** Get link equity distribution. */
  getEquityDistribution(siteId: string): Promise<LinkEquityScore[]>;

  /** Suggest internal links for a specific page. */
  suggestLinks(siteId: string, pageUrl: string, maxSuggestions?: number): Promise<InternalLinkSuggestion[]>;

  /** Get anchor text profile for the site. */
  getAnchorTextProfile(siteId: string): Promise<AnchorTextProfile>;

  /** Get pages with the most/least inbound links. */
  getTopPages(siteId: string, opts: { sort: 'most' | 'least'; limit: number }): Promise<LinkNodeSummary[]>;
}

interface LinkGraph {
  nodes: LinkNode[];
  edges: LinkEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgInboundLinks: number;
    avgOutboundLinks: number;
    maxInboundLinks: number;
    orphanCount: number;
    density: number;                         // edges / (nodes * (nodes - 1))
  };
}

interface LinkNode {
  url: string;
  pageTitle: string;
  inboundCount: number;
  outboundCount: number;
  equityScore: number;                       // PageRank-derived, 0-100
  depth: number;                             // clicks from homepage
  isOrphan: boolean;
}

interface LinkEdge {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  isNofollow: boolean;
  context: 'navigation' | 'content' | 'footer' | 'sidebar';
}

interface InternalLinkSuggestion {
  fromUrl: string;
  toUrl: string;
  suggestedAnchorText: string;
  relevanceScore: number;                    // 0-100
  reason: string;                            // why this link makes sense
}
```

### PageSpeedReport

```typescript
interface PageSpeedTracker {
  /** Run Lighthouse audit for URLs. */
  runAudit(siteId: string, urls?: string[]): Promise<{ jobId: string }>;

  /** Get latest Core Web Vitals. */
  getLatestVitals(siteId: string): Promise<CoreWebVitalsMetrics>;

  /** Get vitals history over time. */
  getVitalsHistory(siteId: string, range: DateRange): Promise<CoreWebVitalsHistory>;

  /** Get speed recommendations. */
  getRecommendations(siteId: string): Promise<SpeedRecommendation[]>;

  /** Get performance trends with statistical analysis. */
  getTrends(siteId: string, range: DateRange): Promise<PerformanceTrend>;
}

interface CoreWebVitalsMetrics {
  siteId: string;
  url?: string;                              // specific page or site-wide aggregate

  lcp: {                                     // Largest Contentful Paint
    value: number;                           // milliseconds
    rating: 'good' | 'needs_improvement' | 'poor';
    p75: number;                             // 75th percentile
  };

  fid: {                                     // First Input Delay (legacy)
    value: number;                           // milliseconds
    rating: 'good' | 'needs_improvement' | 'poor';
    p75: number;
  };

  inp: {                                     // Interaction to Next Paint
    value: number;                           // milliseconds
    rating: 'good' | 'needs_improvement' | 'poor';
    p75: number;
  };

  cls: {                                     // Cumulative Layout Shift
    value: number;                           // unitless
    rating: 'good' | 'needs_improvement' | 'poor';
    p75: number;
  };

  ttfb: {                                   // Time to First Byte
    value: number;
    rating: 'good' | 'needs_improvement' | 'poor';
  };

  performanceScore: number;                  // 0-100 (Lighthouse)
  measuredAt: Date;
}

interface SpeedRecommendation {
  id: string;
  category: 'images' | 'javascript' | 'css' | 'fonts' | 'server' | 'caching' | 'layout' | 'third_party';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedSavingsMs?: number;
  estimatedSavingsBytes?: number;
  affectedUrls: string[];
  implementation: string;                    // specific implementation guidance
}
```

### SEOReport

```typescript
interface SEOReporter {
  /** Generate a report on demand. */
  generate(siteId: string, config?: SEOReportConfig): Promise<SEOReportData>;

  /** Schedule recurring report generation. */
  schedule(siteId: string, config: SEOReportScheduleConfig): Promise<ReportScheduleRecord>;

  /** List scheduled reports. */
  listSchedules(siteId: string): Promise<ReportScheduleRecord[]>;

  /** Cancel a scheduled report. */
  cancelSchedule(scheduleId: string): Promise<void>;

  /** Render a report as HTML or PDF. */
  render(reportId: string, format: 'html' | 'pdf'): Promise<Buffer>;
}

interface SEOReportConfig {
  /** Report type. */
  type: 'weekly' | 'monthly' | 'quarterly' | 'custom';

  /** Date range for the report. */
  dateRange?: DateRange;

  /** Sections to include. */
  sections?: ReportSection[];

  /** Whether to include competitor comparison. */
  includeCompetitors?: boolean;

  /** Whether to include page speed data. */
  includePageSpeed?: boolean;

  /** Maximum number of issues to detail. */
  maxIssueDetails?: number;

  /** Report delivery method. */
  delivery?: {
    email?: string[];
    slack?: { channelId: string };
    webhook?: { url: string };
  };
}

type ReportSection =
  | 'executive_summary'
  | 'health_score'
  | 'ranking_changes'
  | 'traffic_impact'
  | 'technical_issues'
  | 'on_page_scores'
  | 'page_speed'
  | 'competitor_analysis'
  | 'structured_data'
  | 'internal_linking'
  | 'action_items';

interface SEOReportData {
  id: string;
  siteId: string;
  tenantId: string;
  type: string;
  dateRange: DateRange;
  generatedAt: Date;

  executiveSummary: {
    healthScore: number;
    healthScoreChange: number;
    totalKeywordsTracked: number;
    keywordsInTop10: number;
    keywordsInTop10Change: number;
    estimatedOrganicTraffic: number;
    trafficChange: number;
    criticalIssues: number;
    criticalIssuesChange: number;
    topWins: string[];
    topConcerns: string[];
  };

  rankingChanges: {
    improved: KeywordRankingChange[];
    declined: KeywordRankingChange[];
    newRankings: KeywordRankingChange[];
    lostRankings: KeywordRankingChange[];
    distribution: RankingDistribution;
    distributionChange: RankingDistribution;
  };

  technicalHealth: {
    currentScore: number;
    previousScore: number;
    issueBreakdown: Record<AuditIssueSeverity, number>;
    topIssues: AuditIssue[];
    resolvedSinceLastReport: number;
    newSinceLastReport: number;
  };

  pageSpeed: {
    avgLCP: number;
    avgFID: number;
    avgCLS: number;
    avgPerformanceScore: number;
    trends: { date: string; lcp: number; fid: number; cls: number }[];
    slowestPages: { url: string; lcp: number; performanceScore: number }[];
  };

  actionItems: ActionItem[];
}

interface ActionItem {
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  category: string;
  estimatedImpact: string;
  estimatedEffort: string;
  affectedPages: number;
  details?: string;
}
```

### Competitor

```typescript
interface CompetitorAnalyzer {
  /** Add a competitor to monitor. */
  addCompetitor(siteId: string, domain: string, label?: string): Promise<Competitor>;

  /** Remove a competitor. */
  removeCompetitor(competitorId: string): Promise<void>;

  /** List competitors for a site. */
  listCompetitors(siteId: string): Promise<Competitor[]>;

  /** Run full competitor analysis. */
  analyze(siteId: string): Promise<CompetitorComparison>;

  /** Get keyword gap analysis. */
  getKeywordGaps(siteId: string, competitorId?: string): Promise<KeywordGap[]>;

  /** Get estimated domain authority. */
  getDomainAuthority(domain: string): Promise<DomainAuthorityScore>;
}

interface Competitor {
  id: string;
  siteId: string;
  tenantId: string;
  domain: string;
  label?: string;
  estimatedAuthority?: number;
  estimatedTraffic?: number;
  keywordsTracked: number;
  lastAnalyzedAt?: Date;
  createdAt: Date;
}

interface KeywordGap {
  keyword: string;
  yourPosition: number | null;
  competitorPosition: number;
  competitorDomain: string;
  monthlyVolume: number;
  difficulty: number;
  opportunity: 'easy_win' | 'worth_pursuing' | 'long_term' | 'low_priority';
}

interface CompetitorComparison {
  siteId: string;
  analyzedAt: Date;
  yourDomain: {
    domain: string;
    estimatedAuthority: number;
    keywordsInTop10: number;
    keywordsInTop100: number;
    estimatedTraffic: number;
  };
  competitors: {
    domain: string;
    label?: string;
    estimatedAuthority: number;
    keywordsInTop10: number;
    keywordsInTop100: number;
    estimatedTraffic: number;
    sharedKeywords: number;
    uniqueKeywords: number;
  }[];
  keywordGaps: KeywordGap[];
  strengths: string[];
  weaknesses: string[];
}
```

### MultiSiteManager

```typescript
interface MultiSiteManager {
  /** Get portfolio overview across all sites. */
  getOverview(tenantId: string): Promise<PortfolioSEOOverview>;

  /** Detect keyword cannibalization across sites. */
  detectCannibalization(tenantId: string): Promise<CannibalizationResult[]>;

  /** Find cross-site link opportunities. */
  findCrossSiteLinks(tenantId: string): Promise<CrossSiteLinkOpportunity[]>;

  /** Get shared keyword universe. */
  getSharedKeywordUniverse(tenantId: string): Promise<SharedKeywordUniverse>;

  /** Assign keyword ownership to prevent cannibalization. */
  assignKeywordOwnership(assignments: KeywordOwnershipAssignment[]): Promise<void>;
}

interface PortfolioSEOOverview {
  tenantId: string;
  sites: {
    siteId: string;
    domain: string;
    healthScore: number;
    keywordsInTop10: number;
    estimatedTraffic: number;
    lastAuditDate: Date;
    criticalIssues: number;
  }[];
  aggregated: {
    totalSites: number;
    avgHealthScore: number;
    totalKeywordsTracked: number;
    totalKeywordsInTop10: number;
    totalEstimatedTraffic: number;
    totalCriticalIssues: number;
    cannibalizationCount: number;
    crossSiteOpportunities: number;
  };
}

interface CannibalizationResult {
  keyword: string;
  sites: {
    siteId: string;
    domain: string;
    url: string;
    position: number | null;
  }[];
  recommendation: string;
  severity: 'high' | 'medium' | 'low';
}

interface CrossSiteLinkOpportunity {
  fromSite: { siteId: string; domain: string; pageUrl: string; pageTitle: string };
  toSite: { siteId: string; domain: string; pageUrl: string; pageTitle: string };
  suggestedAnchorText: string;
  relevanceScore: number;
  reason: string;
}
```

---

## Database Schemas

### seo_audits

Stores audit run metadata and summary results.

```typescript
import { pgTable, uuid, text, integer, real, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const auditStatusEnum = pgEnum('audit_status', [
  'pending',
  'crawling',
  'analyzing',
  'complete',
  'failed',
]);

export const seoAudits = pgTable('seo_audits', {
  id:          uuid('id').defaultRandom().primaryKey(),
  siteId:      uuid('site_id').notNull().references(() => sites.id),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id),
  status:      auditStatusEnum('status').notNull().default('pending'),
  config:      jsonb('config').$type<SEOAuditConfig>(),

  // Crawl stats
  pagesDiscovered:   integer('pages_discovered').default(0),
  pagesCrawled:      integer('pages_crawled').default(0),
  pagesErrored:      integer('pages_errored').default(0),
  totalTimeMs:       integer('total_time_ms'),
  avgResponseTimeMs: real('avg_response_time_ms'),
  bytesDownloaded:   integer('bytes_downloaded').default(0),

  // Issue summary
  criticalCount:   integer('critical_count').default(0),
  highCount:       integer('high_count').default(0),
  mediumCount:     integer('medium_count').default(0),
  lowCount:        integer('low_count').default(0),
  infoCount:       integer('info_count').default(0),

  // Overall score
  healthScore:     real('health_score'),

  // Comparison
  previousAuditId: uuid('previous_audit_id'),
  healthScoreDelta: real('health_score_delta'),

  // Error info (if failed)
  errorMessage:    text('error_message'),

  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt:     timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  siteIdx:     index('seo_audits_site_idx').on(table.siteId),
  tenantIdx:   index('seo_audits_tenant_idx').on(table.tenantId),
  statusIdx:   index('seo_audits_status_idx').on(table.status),
  createdIdx:  index('seo_audits_created_idx').on(table.createdAt),
}));
```

### audit_issues

Individual issues detected during an audit.

```typescript
export const auditIssueSeverityEnum = pgEnum('audit_issue_severity', [
  'critical', 'high', 'medium', 'low', 'info',
]);

export const auditIssueCategoryEnum = pgEnum('audit_issue_category', [
  'broken_links', 'missing_meta', 'duplicate_content', 'redirect_chains',
  'slow_pages', 'mobile_usability', 'image_optimization', 'security',
  'canonical', 'hreflang', 'open_graph', 'structured_data',
  'heading_structure', 'internal_linking', 'indexability',
]);

export const auditIssues = pgTable('audit_issues', {
  id:            uuid('id').defaultRandom().primaryKey(),
  auditId:       uuid('audit_id').notNull().references(() => seoAudits.id, { onDelete: 'cascade' }),
  siteId:        uuid('site_id').notNull().references(() => sites.id),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  category:      auditIssueCategoryEnum('category').notNull(),
  severity:      auditIssueSeverityEnum('severity').notNull(),
  code:          text('code').notNull(),
  title:         text('title').notNull(),
  description:   text('description').notNull(),
  affectedUrl:   text('affected_url').notNull(),
  affectedElement: text('affected_element'),
  impactScore:   real('impact_score').notNull(),
  fixDifficulty: integer('fix_difficulty').notNull(),
  remediation:   text('remediation').notNull(),
  helpUrl:       text('help_url'),
  details:       jsonb('details'),
  isNew:         boolean('is_new').default(true),
  resolvedAt:    timestamp('resolved_at', { withTimezone: true }),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  auditIdx:      index('audit_issues_audit_idx').on(table.auditId),
  siteIdx:       index('audit_issues_site_idx').on(table.siteId),
  severityIdx:   index('audit_issues_severity_idx').on(table.severity),
  categoryIdx:   index('audit_issues_category_idx').on(table.category),
  codeIdx:       index('audit_issues_code_idx').on(table.code),
  urlIdx:        index('audit_issues_url_idx').on(table.affectedUrl),
}));
```

### keywords

Tracked keywords for SEO monitoring.

```typescript
export const searchEngineEnum = pgEnum('search_engine', ['google', 'bing', 'both']);
export const deviceTypeEnum = pgEnum('device_type', ['desktop', 'mobile', 'both']);

export const keywords = pgTable('keywords', {
  id:            uuid('id').defaultRandom().primaryKey(),
  siteId:        uuid('site_id').notNull().references(() => sites.id),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  term:          text('term').notNull(),
  searchEngine:  searchEngineEnum('search_engine').notNull().default('google'),
  locale:        text('locale').notNull().default('en-US'),
  device:        deviceTypeEnum('device').notNull().default('desktop'),
  groupId:       uuid('group_id').references(() => keywordGroups.id),
  targetUrl:     text('target_url'),
  monthlyVolume: integer('monthly_volume'),
  difficulty:    real('difficulty'),
  cpc:           real('cpc'),
  tags:          text('tags').array(),
  isActive:      boolean('is_active').default(true),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdx:       index('keywords_site_idx').on(table.siteId),
  tenantIdx:     index('keywords_tenant_idx').on(table.tenantId),
  termIdx:       index('keywords_term_idx').on(table.term),
  groupIdx:      index('keywords_group_idx').on(table.groupId),
  unique:        uniqueIndex('keywords_unique').on(table.siteId, table.term, table.searchEngine, table.locale, table.device),
}));
```

### keyword_rankings

Daily ranking snapshots for tracked keywords.

```typescript
export const keywordRankings = pgTable('keyword_rankings', {
  id:            uuid('id').defaultRandom().primaryKey(),
  keywordId:     uuid('keyword_id').notNull().references(() => keywords.id, { onDelete: 'cascade' }),
  siteId:        uuid('site_id').notNull().references(() => sites.id),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  position:      integer('position'),                     // null = not ranking
  previousPosition: integer('previous_position'),
  change:        integer('change').default(0),
  url:           text('url'),                             // the URL that's ranking
  searchEngine:  searchEngineEnum('search_engine').notNull(),
  device:        text('device').notNull(),
  serpFeatures:  jsonb('serp_features').$type<SERPFeature[]>().default([]),
  checkedAt:     timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  keywordIdx:    index('keyword_rankings_keyword_idx').on(table.keywordId),
  siteIdx:       index('keyword_rankings_site_idx').on(table.siteId),
  dateIdx:       index('keyword_rankings_date_idx').on(table.checkedAt),
  // Unique per keyword per day per engine/device
  unique:        uniqueIndex('keyword_rankings_unique').on(
    table.keywordId, table.searchEngine, table.device,
    sql`date_trunc('day', ${table.checkedAt})`
  ),
}));
```

### sitemaps

Sitemap generation records.

```typescript
export const sitemapTypeEnum = pgEnum('sitemap_type', [
  'standard', 'image', 'news', 'video', 'index',
]);

export const sitemaps = pgTable('sitemaps', {
  id:            uuid('id').defaultRandom().primaryKey(),
  siteId:        uuid('site_id').notNull().references(() => sites.id),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  type:          sitemapTypeEnum('type').notNull().default('standard'),
  url:           text('url').notNull(),
  urlCount:      integer('url_count').notNull(),
  config:        jsonb('config').$type<SitemapConfig>(),
  lastSubmitted: timestamp('last_submitted', { withTimezone: true }),
  submissionResults: jsonb('submission_results').$type<SitemapSubmissionResult[]>(),
  isActive:      boolean('is_active').default(true),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdx:       index('sitemaps_site_idx').on(table.siteId),
  tenantIdx:     index('sitemaps_tenant_idx').on(table.tenantId),
}));
```

### on_page_scores

On-page SEO analysis results for individual pages.

```typescript
export const onPageScores = pgTable('on_page_scores', {
  id:              uuid('id').defaultRandom().primaryKey(),
  siteId:          uuid('site_id').notNull().references(() => sites.id),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  url:             text('url').notNull(),
  overallScore:    real('overall_score').notNull(),
  metaScore:       real('meta_score'),
  headingScore:    real('heading_score'),
  readabilityScore: real('readability_score'),
  keywordScore:    real('keyword_score'),
  contentScore:    real('content_score'),
  targetKeyword:   text('target_keyword'),

  // Detailed analysis stored as JSON
  metaAnalysis:    jsonb('meta_analysis').$type<MetaAnalysis>(),
  headingStructure: jsonb('heading_structure').$type<HeadingStructure>(),
  readabilityResult: jsonb('readability_result').$type<ReadabilityResult>(),
  keywordDensity:  jsonb('keyword_density').$type<KeywordDensityResult>(),
  contentLength:   jsonb('content_length').$type<ContentLengthAssessment>(),
  recommendations: jsonb('recommendations').$type<OnPageRecommendation[]>(),

  analyzedAt:      timestamp('analyzed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdx:         index('on_page_scores_site_idx').on(table.siteId),
  urlIdx:          index('on_page_scores_url_idx').on(table.url),
  scoreIdx:        index('on_page_scores_score_idx').on(table.overallScore),
}));
```

### structured_data

Structured data / JSON-LD records for pages.

```typescript
export const structuredData = pgTable('structured_data', {
  id:            uuid('id').defaultRandom().primaryKey(),
  siteId:        uuid('site_id').notNull().references(() => sites.id),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  url:           text('url').notNull(),
  schemaType:    text('schema_type').notNull(),
  jsonld:        jsonb('jsonld').notNull().$type<JSONLDOutput>(),
  isValid:       boolean('is_valid').default(true),
  validationErrors: jsonb('validation_errors').$type<ValidationError[]>(),
  isAutoGenerated: boolean('is_auto_generated').default(false),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdx:       index('structured_data_site_idx').on(table.siteId),
  urlIdx:        index('structured_data_url_idx').on(table.url),
  typeIdx:       index('structured_data_type_idx').on(table.schemaType),
}));
```

### internal_links

Internal link graph edges.

```typescript
export const linkContextEnum = pgEnum('link_context', [
  'navigation', 'content', 'footer', 'sidebar',
]);

export const internalLinks = pgTable('internal_links', {
  id:            uuid('id').defaultRandom().primaryKey(),
  siteId:        uuid('site_id').notNull().references(() => sites.id),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  sourceUrl:     text('source_url').notNull(),
  targetUrl:     text('target_url').notNull(),
  anchorText:    text('anchor_text'),
  isNofollow:    boolean('is_nofollow').default(false),
  context:       linkContextEnum('context').default('content'),
  crawlSessionId: uuid('crawl_session_id'),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdx:       index('internal_links_site_idx').on(table.siteId),
  sourceIdx:     index('internal_links_source_idx').on(table.sourceUrl),
  targetIdx:     index('internal_links_target_idx').on(table.targetUrl),
  unique:        uniqueIndex('internal_links_unique').on(table.siteId, table.sourceUrl, table.targetUrl),
}));
```

### page_speed_metrics

Core Web Vitals and Lighthouse metrics over time.

```typescript
export const pageSpeedMetrics = pgTable('page_speed_metrics', {
  id:               uuid('id').defaultRandom().primaryKey(),
  siteId:           uuid('site_id').notNull().references(() => sites.id),
  tenantId:         uuid('tenant_id').notNull().references(() => tenants.id),
  url:              text('url').notNull(),

  // Core Web Vitals
  lcpMs:            real('lcp_ms'),
  lcpRating:        text('lcp_rating'),
  fidMs:            real('fid_ms'),
  fidRating:        text('fid_rating'),
  inpMs:            real('inp_ms'),
  inpRating:        text('inp_rating'),
  clsValue:         real('cls_value'),
  clsRating:        text('cls_rating'),
  ttfbMs:           real('ttfb_ms'),
  ttfbRating:       text('ttfb_rating'),

  // Lighthouse scores
  performanceScore: real('performance_score'),
  accessibilityScore: real('accessibility_score'),
  bestPracticesScore: real('best_practices_score'),
  seoScore:         real('seo_score'),

  // Full Lighthouse report (if stored)
  lighthouseReport: jsonb('lighthouse_report'),

  device:           text('device').notNull().default('mobile'),
  measuredAt:       timestamp('measured_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdx:          index('page_speed_site_idx').on(table.siteId),
  urlIdx:           index('page_speed_url_idx').on(table.url),
  dateIdx:          index('page_speed_date_idx').on(table.measuredAt),
}));
```

### seo_reports

Generated SEO reports.

```typescript
export const reportFrequencyEnum = pgEnum('report_frequency', [
  'weekly', 'monthly', 'quarterly', 'custom',
]);

export const seoReports = pgTable('seo_reports', {
  id:            uuid('id').defaultRandom().primaryKey(),
  siteId:        uuid('site_id').notNull().references(() => sites.id),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  type:          reportFrequencyEnum('type').notNull(),
  dateRangeStart: timestamp('date_range_start', { withTimezone: true }).notNull(),
  dateRangeEnd:  timestamp('date_range_end', { withTimezone: true }).notNull(),
  config:        jsonb('config').$type<SEOReportConfig>(),
  data:          jsonb('data').notNull().$type<SEOReportData>(),
  htmlUrl:       text('html_url'),
  pdfUrl:        text('pdf_url'),
  deliveredTo:   jsonb('delivered_to').$type<string[]>(),
  generatedAt:   timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdx:       index('seo_reports_site_idx').on(table.siteId),
  tenantIdx:     index('seo_reports_tenant_idx').on(table.tenantId),
  dateIdx:       index('seo_reports_date_idx').on(table.generatedAt),
}));
```

### competitors

Competitor domains tracked for comparison.

```typescript
export const competitors = pgTable('competitors', {
  id:               uuid('id').defaultRandom().primaryKey(),
  siteId:           uuid('site_id').notNull().references(() => sites.id),
  tenantId:         uuid('tenant_id').notNull().references(() => tenants.id),
  domain:           text('domain').notNull(),
  label:            text('label'),
  estimatedAuthority: real('estimated_authority'),
  estimatedTraffic: integer('estimated_traffic'),
  lastAnalyzedAt:   timestamp('last_analyzed_at', { withTimezone: true }),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdx:          index('competitors_site_idx').on(table.siteId),
  unique:           uniqueIndex('competitors_unique').on(table.siteId, table.domain),
}));
```

### Additional Supporting Tables

```typescript
// Keyword groups for organizing tracked keywords
export const keywordGroups = pgTable('keyword_groups', {
  id:          uuid('id').defaultRandom().primaryKey(),
  siteId:      uuid('site_id').notNull().references(() => sites.id),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id),
  name:        text('name').notNull(),
  description: text('description'),
  color:       text('color'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdx:     index('keyword_groups_site_idx').on(table.siteId),
  unique:      uniqueIndex('keyword_groups_unique').on(table.siteId, table.name),
}));

// Crawl sessions for tracking individual crawl runs
export const crawlSessions = pgTable('crawl_sessions', {
  id:            uuid('id').defaultRandom().primaryKey(),
  auditId:       uuid('audit_id').notNull().references(() => seoAudits.id, { onDelete: 'cascade' }),
  siteId:        uuid('site_id').notNull().references(() => sites.id),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  status:        text('status').notNull().default('running'),
  seedUrls:      jsonb('seed_urls').$type<string[]>(),
  pagesVisited:  integer('pages_visited').default(0),
  pagesQueued:   integer('pages_queued').default(0),
  currentUrl:    text('current_url'),
  startedAt:     timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt:   timestamp('completed_at', { withTimezone: true }),
});

// Competitor keyword tracking
export const competitorKeywords = pgTable('competitor_keywords', {
  id:            uuid('id').defaultRandom().primaryKey(),
  competitorId:  uuid('competitor_id').notNull().references(() => competitors.id, { onDelete: 'cascade' }),
  siteId:        uuid('site_id').notNull().references(() => sites.id),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  term:          text('term').notNull(),
  position:      integer('position'),
  url:           text('url'),
  monthlyVolume: integer('monthly_volume'),
  checkedAt:     timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
});

// Link equity snapshots for tracking equity distribution over time
export const linkEquitySnapshots = pgTable('link_equity_snapshots', {
  id:            uuid('id').defaultRandom().primaryKey(),
  siteId:        uuid('site_id').notNull().references(() => sites.id),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  url:           text('url').notNull(),
  equityScore:   real('equity_score').notNull(),
  inboundCount:  integer('inbound_count').notNull(),
  outboundCount: integer('outbound_count').notNull(),
  depth:         integer('depth'),
  calculatedAt:  timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siteIdx:       index('link_equity_site_idx').on(table.siteId),
  urlIdx:        index('link_equity_url_idx').on(table.url),
  dateIdx:       index('link_equity_date_idx').on(table.calculatedAt),
}));

// Sitemap individual entries (for large sitemaps, stored separately)
export const sitemapEntries = pgTable('sitemap_entries', {
  id:            uuid('id').defaultRandom().primaryKey(),
  sitemapId:     uuid('sitemap_id').notNull().references(() => sitemaps.id, { onDelete: 'cascade' }),
  url:           text('url').notNull(),
  lastmod:       timestamp('lastmod', { withTimezone: true }),
  changefreq:    text('changefreq'),
  priority:      real('priority'),
  images:        jsonb('images').$type<ImageSitemapEntry[]>(),
  news:          jsonb('news').$type<NewsSitemapEntry>(),
});
```

### Row-Level Security Policies

```sql
-- ═══════════════════════════════════════════════════════════════
-- RLS Policies for all SEO tables
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitemaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE on_page_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE structured_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_speed_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_equity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitemap_entries ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy (applied to all tables)
-- Example for seo_audits; replicate for all tables
CREATE POLICY "seo_audits_tenant_isolation"
  ON seo_audits
  FOR ALL
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "audit_issues_tenant_isolation"
  ON audit_issues
  FOR ALL
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "keywords_tenant_isolation"
  ON keywords
  FOR ALL
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ... (same pattern for all remaining tables)

-- Service role bypass for background workers
CREATE POLICY "service_role_bypass"
  ON seo_audits
  FOR ALL
  TO service_role
  USING (true);

-- Portfolio-level access for multi-site management
CREATE POLICY "portfolio_access"
  ON seo_audits
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM portfolio_access
      WHERE user_id = auth.uid()
      AND permission = 'seo_read'
    )
  );
```

---

## Code Examples

### Example 1: Running a Full Site Audit

```typescript
import { SEOService } from '@mcv/growth/seo';

const seo = new SEOService({ db, crawler, gsc });

// Start an audit with custom configuration
const { auditId, jobId } = await seo.startAudit('site_abc123', {
  maxPages: 5000,
  concurrency: 8,
  renderJs: true,
  requestDelay: 100,
  excludePatterns: ['/admin/*', '/api/*', '*.pdf'],
  detectors: [
    'broken_links',
    'missing_meta',
    'duplicate_content',
    'redirect_chains',
    'slow_pages',
    'image_optimization',
    'heading_structure',
    'indexability',
  ],
  thresholds: {
    slowPageMs: 3000,           // pages slower than 3s are flagged
    maxRedirectHops: 2,         // redirect chains longer than 2 hops
    minTitleLength: 30,
    maxTitleLength: 60,
    minDescriptionLength: 120,
    maxDescriptionLength: 160,
  },
});

console.log(`Audit started: ${auditId}, Job: ${jobId}`);

// Poll for status (in practice, use webhooks or subscriptions)
let status = await seo.getAuditStatus(auditId);
while (status.status !== 'complete' && status.status !== 'failed') {
  await new Promise(resolve => setTimeout(resolve, 5000));
  status = await seo.getAuditStatus(auditId);
  console.log(`Status: ${status.status}, Pages crawled: ${status.pagesCrawled}`);
}

// Get results
const result = await seo.getAuditResult(auditId);

console.log(`Health Score: ${result.healthScore}/100`);
console.log(`Issues found: ${result.issueSummary.total}`);
console.log(`  Critical: ${result.issueSummary.critical}`);
console.log(`  High: ${result.issueSummary.high}`);
console.log(`  Medium: ${result.issueSummary.medium}`);

// Get critical issues with remediation instructions
const criticalIssues = result.issues.filter(i => i.severity === 'critical');
for (const issue of criticalIssues) {
  console.log(`\n[${issue.code}] ${issue.title}`);
  console.log(`  URL: ${issue.affectedUrl}`);
  console.log(`  Fix: ${issue.remediation}`);
  console.log(`  Impact: ${issue.impactScore}/100`);
  console.log(`  Difficulty: ${issue.fixDifficulty}/5`);
}
```

### Example 2: Keyword Tracking and Rank Monitoring

```typescript
import { SEOService } from '@mcv/growth/seo';

const seo = new SEOService({ db, gsc });

// Add keywords to track
const keywords = await seo.addKeywords('site_abc123', [
  {
    term: 'best project management software',
    searchEngine: 'google',
    locale: 'en-US',
    device: 'both',
    targetUrl: 'https://example.com/features',
    tags: ['non-branded', 'high-intent'],
  },
  {
    term: 'project management tools comparison',
    searchEngine: 'both',
    locale: 'en-US',
    device: 'desktop',
    tags: ['non-branded', 'comparison'],
  },
  {
    term: 'example app pricing',
    searchEngine: 'google',
    locale: 'en-US',
    device: 'both',
    tags: ['branded'],
  },
]);

// Organize keywords into groups
await seo.getKeywordTracker().manageGroups('site_abc123', [
  { name: 'Branded', description: 'Brand name keywords', color: '#4CAF50' },
  { name: 'High Intent', description: 'Bottom-of-funnel terms', color: '#FF9800' },
  { name: 'Competitor', description: 'Competitor brand terms', color: '#F44336' },
]);

// Get current rankings
const rankings = await seo.getRankings('site_abc123', {
  sortBy: 'position',
  sortDir: 'asc',
  device: 'desktop',
});

for (const ranking of rankings) {
  const direction = ranking.change > 0 ? '↑' : ranking.change < 0 ? '↓' : '→';
  console.log(
    `#${ranking.position ?? 'NR'} ${direction}${Math.abs(ranking.change)} ` +
    `"${ranking.term}" → ${ranking.url ?? 'not ranking'}`
  );
}

// Get ranking history for a specific keyword
const history = await seo.getRankingHistory(keywords[0].id, {
  start: new Date('2025-01-01'),
  end: new Date('2025-02-01'),
});

console.log(`\nRanking history for "${keywords[0].term}":`);
for (const point of history) {
  console.log(`  ${point.date.toISOString().slice(0, 10)}: #${point.position ?? 'NR'}`);
}

// Get SERP feature detection
const serpReport = await seo.getKeywordTracker().detectSERPFeatures('site_abc123');
for (const [keyword, features] of Object.entries(serpReport.features)) {
  if (features.length > 0) {
    console.log(`"${keyword}": ${features.join(', ')}`);
  }
}
```

### Example 3: Generating and Submitting Sitemaps

```typescript
import { SEOService } from '@mcv/growth/seo';

const seo = new SEOService({ db, crawler, gsc });

// Generate a standard sitemap with custom rules
const result = await seo.generateSitemap('site_abc123', {
  type: 'standard',
  baseUrl: 'https://example.com',

  // Priority rules based on URL patterns
  priorityRules: [
    { pattern: '/$',        priority: 1.0 },       // homepage
    { pattern: '/features', priority: 0.9 },        // features pages
    { pattern: '/pricing',  priority: 0.9 },        // pricing
    { pattern: '/blog/*',   priority: 0.7 },        // blog posts
    { pattern: '/docs/*',   priority: 0.6 },        // documentation
    { pattern: '/legal/*',  priority: 0.2 },        // legal pages
  ],

  // Change frequency rules
  changefreqRules: [
    { pattern: '/blog/*',   changefreq: 'weekly' },
    { pattern: '/docs/*',   changefreq: 'monthly' },
    { pattern: '/pricing',  changefreq: 'monthly' },
    { pattern: '/*',        changefreq: 'weekly' },  // default
  ],

  // Exclude patterns
  excludePatterns: [
    '/admin/*',
    '/api/*',
    '/internal/*',
    '*.json',
  ],

  // Generate image sitemap alongside
  includeImages: true,

  // Maximum URLs per sitemap file (creates index if exceeded)
  maxUrlsPerSitemap: 50000,
});

console.log(`Sitemap generated: ${result.url}`);
console.log(`Total URLs: ${result.urlCount}`);
console.log(`Files created: ${result.files.length}`);

// Validate the generated sitemap
const validation = await seo.validateSitemap(result.url);
if (!validation.valid) {
  console.warn('Sitemap validation issues:', validation.errors);
}

// Submit to search engines
const submission = await seo.submitSitemap('site_abc123', result.url);
console.log(`Google submission: ${submission.google.status}`);
console.log(`Bing submission: ${submission.bing.status}`);

// Generate a news sitemap for recent articles
const newsSitemap = await seo.generateSitemap('site_abc123', {
  type: 'news',
  baseUrl: 'https://example.com',
  news: {
    publicationName: 'Example Blog',
    language: 'en',
    maxAge: 48,                              // hours — Google News requires < 48h
  },
});

console.log(`News sitemap: ${newsSitemap.url} (${newsSitemap.urlCount} articles)`);
```

### Example 4: On-Page SEO Analysis

```typescript
import { SEOService } from '@mcv/growth/seo';

const seo = new SEOService({ db, crawler });

// Analyze a single page targeting a specific keyword
const score = await seo.analyzePage(
  'https://example.com/blog/project-management-guide',
  'project management guide'
);

console.log(`Overall Score: ${score.overallScore}/100`);
console.log();

// Meta analysis
console.log('META TAGS:');
console.log(`  Title: "${score.meta.title.value}" (${score.meta.title.length} chars, score: ${score.meta.title.score})`);
if (score.meta.title.issues.length > 0) {
  score.meta.title.issues.forEach(i => console.log(`    ⚠ ${i}`));
}
console.log(`  Description: "${score.meta.description.value?.slice(0, 50)}..." (${score.meta.description.length} chars, score: ${score.meta.description.score})`);
console.log(`  Canonical: ${score.meta.canonical.value}`);
console.log(`  OG Completeness: ${score.meta.openGraph.completeness}%`);
console.log();

// Heading structure
console.log('HEADINGS:');
console.log(`  H1 count: ${score.headings.h1Count}`);
console.log(`  H1: "${score.headings.h1Values[0]}"`);
console.log(`  Structure score: ${score.headings.score}`);
if (score.headings.issues.length > 0) {
  score.headings.issues.forEach(i => console.log(`    ⚠ ${i}`));
}
console.log();

// Readability
console.log('READABILITY:');
console.log(`  Flesch Reading Ease: ${score.readability.fleschReadingEase}`);
console.log(`  Grade Level: ${score.readability.fleschKincaidGrade}`);
console.log(`  Level: ${score.readability.level}`);
console.log(`  Word Count: ${score.readability.wordCount}`);
console.log();

// Keyword density
if (score.keywordDensity) {
  console.log('KEYWORD DENSITY:');
  console.log(`  Keyword: "${score.keywordDensity.keyword}"`);
  console.log(`  Density: ${score.keywordDensity.density.toFixed(2)}%`);
  console.log(`  In title: ${score.keywordDensity.inTitle ? '✓' : '✗'}`);
  console.log(`  In H1: ${score.keywordDensity.inH1 ? '✓' : '✗'}`);
  console.log(`  In first paragraph: ${score.keywordDensity.inFirstParagraph ? '✓' : '✗'}`);
  console.log(`  In meta description: ${score.keywordDensity.inMetaDescription ? '✓' : '✗'}`);
  console.log(`  In URL: ${score.keywordDensity.inUrl ? '✓' : '✗'}`);
  console.log(`  Recommendation: ${score.keywordDensity.recommendation}`);
}
console.log();

// Recommendations
console.log('RECOMMENDATIONS:');
for (const rec of score.recommendations) {
  console.log(`  [${rec.priority}] ${rec.title}`);
  console.log(`    ${rec.description}`);
}
```

### Example 5: Structured Data Generation

```typescript
import { StructuredDataGenerator } from '@mcv/growth/seo';

const sdg = new StructuredDataGenerator();

// Generate Article schema
const articleSchema = sdg.article({
  headline: 'The Complete Guide to Project Management in 2025',
  description: 'Learn everything about project management methodologies, tools, and best practices.',
  author: {
    name: 'Jane Smith',
    url: 'https://example.com/team/jane-smith',
  },
  publisher: {
    name: 'Example Blog',
    logo: 'https://example.com/logo.png',
  },
  datePublished: '2025-01-15T08:00:00Z',
  dateModified: '2025-02-01T12:00:00Z',
  image: 'https://example.com/images/pm-guide.jpg',
  url: 'https://example.com/blog/project-management-guide',
  wordCount: 5200,
});

console.log(JSON.stringify(articleSchema, null, 2));
// Output:
// {
//   "@context": "https://schema.org",
//   "@type": "Article",
//   "headline": "The Complete Guide to Project Management in 2025",
//   "description": "Learn everything about project management...",
//   "author": { "@type": "Person", "name": "Jane Smith", "url": "..." },
//   "publisher": { "@type": "Organization", "name": "Example Blog", "logo": { ... } },
//   "datePublished": "2025-01-15T08:00:00Z",
//   "dateModified": "2025-02-01T12:00:00Z",
//   "image": "https://example.com/images/pm-guide.jpg",
//   "mainEntityOfPage": { "@type": "WebPage", "@id": "https://example.com/blog/..." },
//   "wordCount": 5200
// }

// Generate FAQ schema
const faqSchema = sdg.faq({
  questions: [
    {
      question: 'What is project management?',
      answer: 'Project management is the application of knowledge, skills, tools, and techniques to project activities to meet project requirements.',
    },
    {
      question: 'What are the most popular project management methodologies?',
      answer: 'The most popular methodologies include Agile, Scrum, Kanban, Waterfall, and Lean.',
    },
    {
      question: 'How do I choose the right project management tool?',
      answer: 'Consider your team size, budget, required integrations, and methodology preference when choosing a tool.',
    },
  ],
});

// Generate Product schema
const productSchema = sdg.product({
  name: 'Example Project Manager Pro',
  description: 'Professional project management software for teams.',
  image: 'https://example.com/images/product.jpg',
  brand: 'Example',
  sku: 'EPM-PRO-2025',
  offers: {
    price: 29.99,
    currency: 'USD',
    availability: 'InStock',
    priceValidUntil: '2025-12-31',
    url: 'https://example.com/pricing',
  },
  aggregateRating: {
    ratingValue: 4.7,
    reviewCount: 1250,
    bestRating: 5,
  },
});

// Generate Breadcrumb schema
const breadcrumbSchema = sdg.breadcrumbs({
  items: [
    { name: 'Home', url: 'https://example.com' },
    { name: 'Blog', url: 'https://example.com/blog' },
    { name: 'Project Management', url: 'https://example.com/blog/category/pm' },
    { name: 'The Complete Guide to PM in 2025' },
  ],
});

// Validate all generated schemas
for (const schema of [articleSchema, faqSchema, productSchema, breadcrumbSchema]) {
  const validation = sdg.validate(schema);
  if (!validation.valid) {
    console.error(`Validation errors for ${schema['@type']}:`, validation.errors);
  } else {
    console.log(`✓ ${schema['@type']} schema is valid`);
  }
}
```

### Example 6: Internal Link Graph Analysis

```typescript
import { SEOService } from '@mcv/growth/seo';

const seo = new SEOService({ db, crawler });

// Build the internal link graph (uses latest crawl data)
const summary = await seo.buildLinkGraph('site_abc123');
console.log(`Link graph built: ${summary.totalNodes} pages, ${summary.totalEdges} links`);
console.log(`Average inbound links: ${summary.avgInboundLinks.toFixed(1)}`);
console.log(`Orphan pages: ${summary.orphanCount}`);
console.log(`Graph density: ${(summary.density * 100).toFixed(2)}%`);

// Find orphan pages — these need internal links pointing to them
const orphans = await seo.getOrphanPages('site_abc123');
console.log(`\nOrphan pages (${orphans.length}):`);
for (const orphan of orphans.slice(0, 10)) {
  console.log(`  ${orphan.url}`);
  console.log(`    Title: ${orphan.pageTitle}`);
  console.log(`    Depth from homepage: ${orphan.depth}`);
  console.log(`    Outbound links: ${orphan.outboundCount}`);
}

// Get link equity distribution (PageRank-style)
const equity = await seo.getLinkEquity('site_abc123');
console.log('\nTop pages by link equity:');
for (const page of equity.slice(0, 10)) {
  console.log(`  ${page.equityScore.toFixed(1)} — ${page.url} (${page.inboundCount} inbound)`);
}

// Get internal link suggestions for a specific page
const suggestions = await seo.suggestInternalLinks('site_abc123', 'https://example.com/blog/new-post');
console.log('\nSuggested internal links for /blog/new-post:');
for (const suggestion of suggestions) {
  console.log(`  → ${suggestion.toUrl}`);
  console.log(`    Anchor: "${suggestion.suggestedAnchorText}"`);
  console.log(`    Relevance: ${suggestion.relevanceScore}/100`);
  console.log(`    Reason: ${suggestion.reason}`);
}
```

### Example 7: Core Web Vitals Monitoring

```typescript
import { SEOService } from '@mcv/growth/seo';

const seo = new SEOService({ db, lighthouse });

// Run Lighthouse audit for key pages
const { jobId } = await seo.runSpeedAudit('site_abc123', [
  'https://example.com',
  'https://example.com/pricing',
  'https://example.com/features',
  'https://example.com/blog',
  'https://example.com/signup',
]);

console.log(`Speed audit started: ${jobId}`);

// Get latest Core Web Vitals (site-wide aggregate)
const vitals = await seo.getCoreWebVitals('site_abc123');

console.log('Core Web Vitals:');
console.log(`  LCP:  ${vitals.lcp.value}ms (${vitals.lcp.rating}) — p75: ${vitals.lcp.p75}ms`);
console.log(`  FID:  ${vitals.fid.value}ms (${vitals.fid.rating}) — p75: ${vitals.fid.p75}ms`);
console.log(`  INP:  ${vitals.inp.value}ms (${vitals.inp.rating}) — p75: ${vitals.inp.p75}ms`);
console.log(`  CLS:  ${vitals.cls.value} (${vitals.cls.rating}) — p75: ${vitals.cls.p75}`);
console.log(`  TTFB: ${vitals.ttfb.value}ms (${vitals.ttfb.rating})`);
console.log(`  Performance Score: ${vitals.performanceScore}/100`);

// Get speed recommendations sorted by impact
const recommendations = await seo.getSpeedRecommendations('site_abc123');

console.log('\nSpeed Recommendations:');
for (const rec of recommendations) {
  console.log(`\n  [${rec.impact.toUpperCase()}] ${rec.title}`);
  console.log(`  Category: ${rec.category}`);
  console.log(`  ${rec.description}`);
  if (rec.estimatedSavingsMs) {
    console.log(`  Estimated savings: ${rec.estimatedSavingsMs}ms`);
  }
  if (rec.estimatedSavingsBytes) {
    console.log(`  Estimated savings: ${(rec.estimatedSavingsBytes / 1024).toFixed(0)} KB`);
  }
  console.log(`  Affected pages: ${rec.affectedUrls.length}`);
  console.log(`  How to fix: ${rec.implementation}`);
}

// Get trends over the last 30 days
const trends = await seo.getSpeedTrends('site_abc123', {
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  end: new Date(),
});

console.log('\nPerformance trend (last 30 days):');
console.log(`  LCP trend: ${trends.lcp.direction} (${trends.lcp.changePercent.toFixed(1)}%)`);
console.log(`  CLS trend: ${trends.cls.direction} (${trends.cls.changePercent.toFixed(1)}%)`);
console.log(`  Score trend: ${trends.performance.direction} (${trends.performance.changePercent.toFixed(1)}%)`);
```

### Example 8: Automated Weekly SEO Report with Competitor Analysis

```typescript
import { SEOService } from '@mcv/growth/seo';

const seo = new SEOService({ db, crawler, gsc, lighthouse });

// Add competitors to track
await seo.addCompetitor('site_abc123', 'competitor1.com');
await seo.addCompetitor('site_abc123', 'competitor2.com');
await seo.addCompetitor('site_abc123', 'competitor3.io');

// Generate a comprehensive weekly report
const report = await seo.generateReport('site_abc123', {
  type: 'weekly',
  sections: [
    'executive_summary',
    'ranking_changes',
    'traffic_impact',
    'technical_issues',
    'page_speed',
    'competitor_analysis',
    'action_items',
  ],
  includeCompetitors: true,
  includePageSpeed: true,
  maxIssueDetails: 20,
});

// Executive summary
const es = report.executiveSummary;
console.log('═══ WEEKLY SEO REPORT ═══');
console.log(`Health Score: ${es.healthScore}/100 (${es.healthScoreChange > 0 ? '+' : ''}${es.healthScoreChange})`);
console.log(`Keywords in Top 10: ${es.keywordsInTop10} (${es.keywordsInTop10Change > 0 ? '+' : ''}${es.keywordsInTop10Change})`);
console.log(`Est. Organic Traffic: ${es.estimatedOrganicTraffic.toLocaleString()} (${es.trafficChange > 0 ? '+' : ''}${es.trafficChange.toFixed(1)}%)`);
console.log(`Critical Issues: ${es.criticalIssues} (${es.criticalIssuesChange > 0 ? '+' : ''}${es.criticalIssuesChange})`);

console.log('\nTop Wins:');
es.topWins.forEach(w => console.log(`  ✓ ${w}`));
console.log('\nTop Concerns:');
es.topConcerns.forEach(c => console.log(`  ⚠ ${c}`));

// Ranking changes
console.log('\n── Ranking Changes ──');
console.log(`Improved: ${report.rankingChanges.improved.length}`);
for (const kw of report.rankingChanges.improved.slice(0, 5)) {
  console.log(`  ↑ "${kw.term}" #${kw.previousPosition} → #${kw.currentPosition} (+${kw.change})`);
}
console.log(`Declined: ${report.rankingChanges.declined.length}`);
for (const kw of report.rankingChanges.declined.slice(0, 5)) {
  console.log(`  ↓ "${kw.term}" #${kw.previousPosition} → #${kw.currentPosition} (${kw.change})`);
}

// Action items
console.log('\n── Action Items ──');
for (const action of report.actionItems) {
  console.log(`  [${action.priority.toUpperCase()}] ${action.title}`);
  console.log(`    Impact: ${action.estimatedImpact} | Effort: ${action.estimatedEffort}`);
  console.log(`    ${action.description}`);
}

// Schedule recurring weekly reports
await seo.scheduleReport('site_abc123', {
  type: 'weekly',
  frequency: 'weekly',
  sections: [
    'executive_summary',
    'ranking_changes',
    'technical_issues',
    'action_items',
  ],
  includeCompetitors: true,
  delivery: {
    email: ['seo-team@example.com', 'cto@example.com'],
    slack: { channelId: 'C_SEO_REPORTS' },
  },
});

// Get keyword gap analysis against competitors
const gaps = await seo.getKeywordGaps('site_abc123');
console.log('\n── Keyword Gap Analysis ──');
const easyWins = gaps.filter(g => g.opportunity === 'easy_win');
console.log(`Easy wins (${easyWins.length}):`);
for (const gap of easyWins.slice(0, 10)) {
  console.log(
    `  "${gap.keyword}" — Competitor #${gap.competitorPosition} (${gap.competitorDomain}), ` +
    `You: ${gap.yourPosition ? `#${gap.yourPosition}` : 'NR'}, ` +
    `Vol: ${gap.monthlyVolume}/mo`
  );
}

// Compare domain metrics
const comparison = await seo.compareWithCompetitors('site_abc123');
console.log('\n── Competitor Comparison ──');
console.log(`Your domain: ${comparison.yourDomain.domain}`);
console.log(`  Authority: ${comparison.yourDomain.estimatedAuthority}`);
console.log(`  Keywords in top 10: ${comparison.yourDomain.keywordsInTop10}`);
for (const comp of comparison.competitors) {
  console.log(`${comp.domain}:`);
  console.log(`  Authority: ${comp.estimatedAuthority}`);
  console.log(`  Keywords in top 10: ${comp.keywordsInTop10}`);
  console.log(`  Shared keywords: ${comp.sharedKeywords}`);
  console.log(`  Unique keywords: ${comp.uniqueKeywords}`);
}
```

---

## Error Codes

All errors thrown by `@mcv/growth/seo` extend `SEOError` and include a machine-readable `code` field, a human-readable `message`, and optional `details` for additional context.

```typescript
import { SEOError } from '@mcv/growth/seo';

try {
  await seo.startAudit(siteId);
} catch (err) {
  if (err instanceof SEOError) {
    console.error(`[${err.code}] ${err.message}`);
    console.error('Details:', err.details);
  }
}
```

| Code | HTTP | Description |
|---|---|---|
| `SEO_SITE_NOT_FOUND` | 404 | The specified site ID does not exist or is not accessible to the current tenant. |
| `SEO_AUDIT_NOT_FOUND` | 404 | The specified audit ID does not exist. |
| `SEO_AUDIT_IN_PROGRESS` | 409 | An audit is already running for this site. Wait for completion or cancel the existing audit before starting a new one. |
| `SEO_AUDIT_FAILED` | 500 | The audit failed due to an internal error. Check `errorMessage` on the audit result for details. |
| `SEO_CRAWL_BLOCKED` | 403 | The crawler was blocked by the target site's `robots.txt` or returned a 403 Forbidden response. Verify `respectRobotsTxt` config and site access. |
| `SEO_CRAWL_TIMEOUT` | 408 | The crawl exceeded the configured timeout. Reduce `maxPages` or increase `pageTimeout`. |
| `SEO_CRAWL_DNS_ERROR` | 502 | DNS resolution failed for the target domain. Verify the domain is correct and accessible. |
| `SEO_CRAWL_SSL_ERROR` | 502 | SSL/TLS handshake failed. The site may have an invalid or expired certificate. |
| `SEO_KEYWORD_NOT_FOUND` | 404 | The specified keyword ID does not exist. |
| `SEO_KEYWORD_DUPLICATE` | 409 | A keyword with the same term, search engine, locale, and device already exists for this site. |
| `SEO_KEYWORD_LIMIT_EXCEEDED` | 429 | The site has reached its keyword tracking limit. Upgrade plan or remove unused keywords. |
| `SEO_RANK_CHECK_QUOTA` | 429 | The daily rank check quota has been exceeded. Checks will resume tomorrow, or upgrade the API plan. |
| `SEO_RANK_CHECK_FAILED` | 502 | The rank checking service returned an error. This may be transient; retry later. |
| `SEO_SITEMAP_GENERATION_FAILED` | 500 | Sitemap generation failed. Check that the site has been crawled recently. |
| `SEO_SITEMAP_VALIDATION_FAILED` | 422 | The generated sitemap failed XML/XSD validation. Review `errors` for specific issues. |
| `SEO_SITEMAP_SUBMISSION_FAILED` | 502 | Sitemap submission to a search engine failed. Check API credentials and connectivity. |
| `SEO_STRUCTURED_DATA_INVALID` | 422 | The provided data does not meet the schema requirements for the specified type. |
| `SEO_LIGHTHOUSE_UNAVAILABLE` | 503 | The Lighthouse service is not available. It may be overloaded or not configured. |
| `SEO_LIGHTHOUSE_TIMEOUT` | 408 | The Lighthouse audit timed out for the given URL. The page may be too complex or slow. |
| `SEO_REPORT_NOT_FOUND` | 404 | The specified report ID does not exist. |
| `SEO_REPORT_GENERATION_FAILED` | 500 | Report generation failed due to insufficient data. Ensure the site has recent audit and ranking data. |
| `SEO_COMPETITOR_NOT_FOUND` | 404 | The specified competitor ID does not exist. |
| `SEO_COMPETITOR_LIMIT_EXCEEDED` | 429 | Maximum number of competitors reached for this site. Remove unused competitors before adding new ones. |
| `SEO_GSC_AUTH_FAILED` | 401 | Google Search Console authentication failed. Re-authorize the GSC connection in settings. |
| `SEO_GSC_PROPERTY_NOT_FOUND` | 404 | The specified GSC property does not exist or the service account lacks access. |
| `SEO_GSC_QUOTA_EXCEEDED` | 429 | Google Search Console API quota exceeded. Requests will be retried automatically. |
| `SEO_TENANT_UNAUTHORIZED` | 403 | The current user does not have permission to access SEO data for this tenant/site. |
| `SEO_INVALID_CONFIG` | 400 | The provided configuration is invalid. Check `details` for specific validation errors. |
| `SEO_INVALID_URL` | 400 | The provided URL is not a valid HTTP/HTTPS URL. |
| `SEO_INVALID_DATE_RANGE` | 400 | The provided date range is invalid (start must be before end, range must not exceed limits). |

### Error Hierarchy

```typescript
class SEOError extends Error {
  code: string;
  httpStatus: number;
  details?: Record<string, unknown>;
}

class SEONotFoundError extends SEOError {
  httpStatus = 404;
}

class SEOConflictError extends SEOError {
  httpStatus = 409;
}

class SEOValidationError extends SEOError {
  httpStatus = 400;
  validationErrors: { field: string; message: string }[];
}

class SEOQuotaError extends SEOError {
  httpStatus = 429;
  retryAfter?: Date;
}

class SEOExternalServiceError extends SEOError {
  httpStatus = 502;
  service: 'gsc' | 'lighthouse' | 'serp_api' | 'bing_webmaster';
  originalError?: Error;
}
```

---

## Security

### Authentication & Authorization

All SEO API endpoints require authentication via Supabase JWT. The JWT must include a `tenant_id` claim that matches the site's tenant ownership.

```typescript
// tRPC middleware for SEO routes
const seoAuthMiddleware = t.middleware(async ({ ctx, next }) => {
  // Verify user is authenticated
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  // Verify tenant access
  const tenantId = ctx.session.user.tenantId;
  if (!tenantId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'No tenant context. SEO operations require tenant membership.',
    });
  }

  return next({
    ctx: { ...ctx, tenantId },
  });
});

// Site-level permission check
const siteAccessMiddleware = t.middleware(async ({ ctx, input, next }) => {
  const siteId = (input as any).siteId;
  if (siteId) {
    const site = await db.query.sites.findFirst({
      where: and(
        eq(sites.id, siteId),
        eq(sites.tenantId, ctx.tenantId),
      ),
    });
    if (!site) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Site not found' });
    }
  }
  return next({ ctx });
});
```

### Permission Model

| Permission | Description | Roles |
|---|---|---|
| `seo:read` | View audit results, rankings, reports | Viewer, Editor, Admin |
| `seo:write` | Start audits, add keywords, manage competitors | Editor, Admin |
| `seo:admin` | Schedule reports, configure crawl settings, manage quotas | Admin |
| `seo:portfolio` | Cross-site management, cannibalization detection | Portfolio Admin |

### Crawler Security

The Puppeteer-based crawler implements several security measures:

1. **Sandboxed Browser:** Puppeteer runs with `--no-sandbox` disabled by default. In production, it runs in a dedicated container with limited network access.

2. **Domain Restriction:** The crawler only follows links within the configured site domain(s). External links are recorded but not followed.

3. **robots.txt Compliance:** The crawler respects `robots.txt` by default. This can be overridden for auditing purposes, but the override is logged.

4. **Rate Limiting:** Built-in rate limiting prevents the crawler from overwhelming target servers. The default delay of 200ms between requests can be adjusted.

5. **Authentication Isolation:** If crawl authentication credentials are provided, they are stored encrypted and never logged. Puppeteer sessions are destroyed after each crawl.

6. **Resource Limits:** Each crawl job has CPU and memory limits enforced at the container level. Runaway crawls are automatically terminated.

```typescript
// Crawler security configuration
const crawlerSecurityConfig = {
  // Puppeteer launch options
  browser: {
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-zygote',
      '--disable-extensions',
    ],
    headless: 'new',
  },

  // Network restrictions
  network: {
    allowedProtocols: ['http:', 'https:'],
    blockedHosts: [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '169.254.169.254',      // AWS metadata
      '10.0.0.0/8',           // private ranges
      '172.16.0.0/12',
      '192.168.0.0/16',
    ],
    maxRedirects: 5,
    timeout: 30_000,
  },

  // Resource limits
  limits: {
    maxPagesPerCrawl: 50_000,
    maxBytesPerPage: 10 * 1024 * 1024,  // 10 MB
    maxTotalBytes: 5 * 1024 * 1024 * 1024,  // 5 GB
    maxCrawlDuration: 4 * 60 * 60 * 1000,   // 4 hours
  },
};
```

### Data Protection

1. **Credential Encryption:** GSC API keys, crawl authentication credentials, and webhook secrets are encrypted at rest using AES-256-GCM.

2. **PII Scrubbing:** Crawled page content is analyzed for PII (emails, phone numbers) and scrubbed before storage. Only metadata and issue data are retained.

3. **Data Retention:** Crawl data, ranking history, and audit results follow configurable retention policies (default: 12 months for rankings, 6 months for crawl data, 24 months for reports).

4. **Audit Logging:** All SEO operations (audit starts, keyword changes, report generation) are logged with user context for compliance.

```typescript
// Data retention configuration
const retentionConfig = {
  crawlData: '6 months',
  rankingHistory: '12 months',
  auditResults: '12 months',
  pageSpeedMetrics: '12 months',
  reports: '24 months',
  internalLinkGraphs: '3 months',
  competitorData: '12 months',
};
```

### API Rate Limiting

SEO API endpoints are rate-limited per tenant to prevent abuse and ensure fair resource allocation.

| Endpoint Category | Rate Limit | Window |
|---|---|---|
| Read operations (get audit, rankings, reports) | 100 req/min | Per tenant |
| Write operations (start audit, add keywords) | 20 req/min | Per tenant |
| Crawl triggers | 5 req/hour | Per site |
| Rank checks | 10 req/hour | Per site |
| Report generation | 10 req/hour | Per tenant |
| Sitemap generation | 5 req/hour | Per site |
| Lighthouse audits | 20 req/hour | Per tenant |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string. |
| `SUPABASE_URL` | Yes | — | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Service role key for bypassing RLS in background workers. |
| `SEO_GOOGLE_SEARCH_CONSOLE_CREDENTIALS` | Yes* | — | Google Search Console service account JSON key (base64-encoded). Required for keyword tracking and sitemap submission. |
| `SEO_BING_WEBMASTER_API_KEY` | No | — | Bing Webmaster Tools API key for Bing sitemap submission and rank checking. |
| `SEO_SERP_API_KEY` | No | — | Third-party SERP API key (e.g., SerpApi, ValueSERP) for real-time position checks. |
| `SEO_SERP_API_PROVIDER` | No | `serpapi` | SERP API provider: `serpapi`, `valueserp`, `dataforseo`. |
| `SEO_CRAWLER_USER_AGENT` | No | `MCVBot/1.0` | User agent string for the crawler. |
| `SEO_CRAWLER_MAX_CONCURRENCY` | No | `5` | Maximum concurrent browser tabs for crawling. |
| `SEO_CRAWLER_DEFAULT_DELAY_MS` | No | `200` | Default delay between crawl requests in milliseconds. |
| `SEO_CRAWLER_MAX_PAGES` | No | `10000` | Default maximum pages per crawl. |
| `SEO_PUPPETEER_EXECUTABLE_PATH` | No | — | Custom Chromium/Chrome executable path for Puppeteer. Uses bundled Chromium if not set. |
| `SEO_PUPPETEER_WS_ENDPOINT` | No | — | Remote Puppeteer WebSocket endpoint (e.g., for Browserless). Overrides local Puppeteer. |
| `SEO_LIGHTHOUSE_ENDPOINT` | No | — | Remote Lighthouse service URL. If not set, runs Lighthouse locally. |
| `SEO_JOB_QUEUE_SCHEMA` | No | `seo_jobs` | PostgreSQL schema for the pg-boss job queue. |
| `SEO_KEYWORD_LIMIT_PER_SITE` | No | `500` | Maximum keywords per site. |
| `SEO_COMPETITOR_LIMIT_PER_SITE` | No | `10` | Maximum competitors per site. |
| `SEO_REPORT_STORAGE_BUCKET` | No | `seo-reports` | Supabase Storage bucket for generated report PDFs/HTML. |
| `SEO_ENCRYPTION_KEY` | Yes | — | AES-256 encryption key for storing sensitive credentials (GSC tokens, crawl auth). |
| `SEO_RANK_CHECK_CRON` | No | `0 6 * * *` | Cron schedule for daily rank checks (default: 6 AM UTC). |
| `SEO_AUDIT_CRON` | No | `0 2 * * 0` | Cron schedule for automated audits (default: 2 AM UTC, Sundays). |
| `SEO_REPORT_CRON` | No | `0 8 * * 1` | Cron schedule for weekly reports (default: 8 AM UTC, Mondays). |
| `SEO_SITEMAP_AUTO_SUBMIT` | No | `true` | Whether to auto-submit sitemaps after generation. |
| `SEO_WEBHOOK_SECRET` | No | — | Secret for validating incoming deploy webhooks. |
| `SEO_SLACK_WEBHOOK_URL` | No | — | Slack webhook URL for alert notifications. |
| `SEO_ALERT_EMAIL_FROM` | No | `seo@mcv.one` | From address for SEO alert emails. |
| `SEO_DATA_RETENTION_MONTHS` | No | `12` | Default data retention period in months. |

### Configuration Example

```bash
# .env.local
DATABASE_URL=postgresql://postgres:password@db.example.supabase.co:5432/postgres
SUPABASE_URL=https://example.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Search Console (base64-encoded service account JSON)
SEO_GOOGLE_SEARCH_CONSOLE_CREDENTIALS=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Ii...

# SERP API
SEO_SERP_API_KEY=abc123def456
SEO_SERP_API_PROVIDER=serpapi

# Crawler settings
SEO_CRAWLER_USER_AGENT=MCVBot/1.0 (+https://mcv.one/bot)
SEO_CRAWLER_MAX_CONCURRENCY=8
SEO_CRAWLER_DEFAULT_DELAY_MS=150

# Remote Puppeteer (optional — for Browserless.io)
SEO_PUPPETEER_WS_ENDPOINT=wss://chrome.browserless.io?token=xxx

# Security
SEO_ENCRYPTION_KEY=a1b2c3d4e5f6...  # 32-byte hex string

# Scheduling
SEO_RANK_CHECK_CRON=0 6 * * *
SEO_AUDIT_CRON=0 2 * * 0
SEO_REPORT_CRON=0 8 * * 1
```

---

## Dependencies

### Required (Peer Dependencies)

| Package | Version | Purpose |
|---|---|---|
| `@mcv/core` | `^0.12.0` | Core platform utilities, error classes, logging |
| `@mcv/db` | `^0.12.0` | Supabase client, Drizzle schema utilities, RLS helpers |
| `@mcv/auth` | `^0.12.0` | Authentication context, tenant resolution |
| `@mcv/jobs` | `^0.12.0` | Job queue (pg-boss wrapper), scheduling |
| `drizzle-orm` | `^0.30.0` | ORM for PostgreSQL queries and schema definition |
| `@trpc/server` | `^10.0.0` | tRPC router and procedure definitions |

### Required (Direct Dependencies)

| Package | Version | Purpose |
|---|---|---|
| `puppeteer` | `^22.0.0` | Headless Chrome for site crawling and JS rendering |
| `puppeteer-core` | `^22.0.0` | Core Puppeteer (used with remote browsers) |
| `lighthouse` | `^12.0.0` | Google Lighthouse for page speed audits |
| `robots-parser` | `^3.0.0` | Parsing and respecting robots.txt files |
| `xml2js` | `^0.6.0` | XML parsing for sitemap validation |
| `xmlbuilder2` | `^3.0.0` | XML building for sitemap generation |
| `cheerio` | `^1.0.0` | HTML parsing for on-page analysis |
| `simhash-js` | `^1.0.0` | Simhash for duplicate content detection |
| `natural` | `^7.0.0` | NLP utilities for readability scoring (syllable count, etc.) |
| `googleapis` | `^130.0.0` | Google Search Console API client |
| `zod` | `^3.22.0` | Input validation for API endpoints |
| `pg-boss` | `^9.0.0` | PostgreSQL-based job queue |
| `p-limit` | `^5.0.0` | Concurrency limiter for parallel operations |
| `date-fns` | `^3.0.0` | Date manipulation for ranking history and reports |

### Optional Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@anthropic-ai/sdk` | `^0.20.0` | AI-powered content recommendations (optional) |
| `puppeteer-extra` | `^3.3.0` | Stealth plugin for evading bot detection |
| `puppeteer-extra-plugin-stealth` | `^2.11.0` | Stealth mode for Puppeteer |
| `@sparticuz/chromium` | `^121.0.0` | Chromium binary for AWS Lambda deployment |
| `pdfkit` | `^0.14.0` | PDF generation for exported reports |
| `handlebars` | `^4.7.0` | HTML template rendering for reports |
| `nodemailer` | `^6.9.0` | Email delivery for scheduled reports |
| `@slack/webhook` | `^7.0.0` | Slack notification delivery |

### Internal Dependencies

| Package | Purpose |
|---|---|
| `@mcv/growth/analytics` | Traffic data for impact estimation in reports |
| `@mcv/content/cms` | Content metadata for on-page analysis |
| `@mcv/infra/storage` | File storage for sitemaps and reports |
| `@mcv/notifications` | Notification delivery for alerts |

### Dependency Graph

```
@mcv/growth/seo
├── @mcv/core
├── @mcv/db
│   └── drizzle-orm
├── @mcv/auth
├── @mcv/jobs
│   └── pg-boss
├── puppeteer
├── lighthouse
├── googleapis
├── cheerio
├── xmlbuilder2
├── robots-parser
├── natural
├── simhash-js
├── zod
├── p-limit
└── date-fns
```

---

## Testing

### Test Structure

```
tests/
├── unit/
│   ├── audit/
│   │   ├── auditor.test.ts
│   │   ├── crawler.test.ts
│   │   ├── issue-detector.test.ts
│   │   └── detectors/
│   │       ├── broken-link.test.ts
│   │       ├── missing-meta.test.ts
│   │       ├── duplicate-content.test.ts
│   │       ├── redirect-chain.test.ts
│   │       ├── slow-page.test.ts
│   │       ├── heading-structure.test.ts
│   │       ├── image-optimization.test.ts
│   │       └── indexability.test.ts
│   ├── keywords/
│   │   ├── tracker.test.ts
│   │   ├── rank-checker.test.ts
│   │   └── serp-analyzer.test.ts
│   ├── sitemap/
│   │   ├── generator.test.ts
│   │   ├── submitter.test.ts
│   │   └── validator.test.ts
│   ├── on-page/
│   │   ├── analyzer.test.ts
│   │   ├── meta-scorer.test.ts
│   │   ├── heading-analyzer.test.ts
│   │   ├── readability.test.ts
│   │   └── keyword-density.test.ts
│   ├── structured-data/
│   │   ├── generator.test.ts
│   │   ├── validator.test.ts
│   │   └── schemas/
│   │       ├── article.test.ts
│   │       ├── product.test.ts
│   │       ├── faq.test.ts
│   │       └── breadcrumbs.test.ts
│   ├── linking/
│   │   ├── graph.test.ts
│   │   ├── orphan-detector.test.ts
│   │   ├── equity-model.test.ts
│   │   └── anchor-analyzer.test.ts
│   ├── speed/
│   │   ├── tracker.test.ts
│   │   ├── lighthouse.test.ts
│   │   ├── core-web-vitals.test.ts
│   │   └── recommender.test.ts
│   ├── competitors/
│   │   ├── analyzer.test.ts
│   │   ├── keyword-gap.test.ts
│   │   └── domain-authority.test.ts
│   ├── reports/
│   │   ├── reporter.test.ts
│   │   ├── renderer.test.ts
│   │   └── trend-analyzer.test.ts
│   └── multi-site/
│       ├── manager.test.ts
│       ├── cannibalization.test.ts
│       └── cross-site-linker.test.ts
├── integration/
│   ├── audit-pipeline.test.ts
│   ├── keyword-tracking.test.ts
│   ├── sitemap-generation.test.ts
│   ├── report-generation.test.ts
│   ├── gsc-integration.test.ts
│   └── multi-site.test.ts
├── e2e/
│   ├── full-audit-flow.test.ts
│   ├── keyword-lifecycle.test.ts
│   └── report-delivery.test.ts
└── fixtures/
    ├── html/
    │   ├── well-optimized-page.html
    │   ├── missing-meta-page.html
    │   ├── duplicate-content-a.html
    │   ├── duplicate-content-b.html
    │   ├── broken-links-page.html
    │   ├── slow-page.html
    │   ├── redirect-chain.html
    │   └── complex-heading-structure.html
    ├── sitemaps/
    │   ├── valid-sitemap.xml
    │   ├── invalid-sitemap.xml
    │   ├── sitemap-index.xml
    │   └── image-sitemap.xml
    ├── structured-data/
    │   ├── valid-article.json
    │   ├── valid-product.json
    │   ├── invalid-faq.json
    │   └── valid-breadcrumbs.json
    ├── crawl-data/
    │   ├── small-site.json
    │   ├── large-site.json
    │   └── site-with-issues.json
    └── lighthouse/
        ├── good-report.json
        ├── poor-report.json
        └── average-report.json
```

### Running Tests

```bash
# Run all SEO module tests
pnpm test --filter @mcv/growth/seo

# Run unit tests only
pnpm test --filter @mcv/growth/seo -- --testPathPattern=unit

# Run integration tests (requires database)
pnpm test --filter @mcv/growth/seo -- --testPathPattern=integration

# Run e2e tests (requires all services)
pnpm test --filter @mcv/growth/seo -- --testPathPattern=e2e

# Run tests for a specific subsystem
pnpm test --filter @mcv/growth/seo -- --testPathPattern=unit/audit
pnpm test --filter @mcv/growth/seo -- --testPathPattern=unit/keywords
pnpm test --filter @mcv/growth/seo -- --testPathPattern=unit/on-page

# Run with coverage
pnpm test --filter @mcv/growth/seo -- --coverage

# Run in watch mode during development
pnpm test --filter @mcv/growth/seo -- --watch
```

### Unit Test Examples

```typescript
// tests/unit/audit/detectors/broken-link.test.ts
import { describe, it, expect } from 'vitest';
import { BrokenLinkDetector } from '../../../../src/audit/detectors/broken-link';

describe('BrokenLinkDetector', () => {
  const detector = new BrokenLinkDetector();

  it('should detect 404 links as critical issues', () => {
    const page = {
      url: 'https://example.com/page',
      links: [
        { url: 'https://example.com/missing', statusCode: 404, anchorText: 'Click here' },
        { url: 'https://example.com/ok', statusCode: 200, anchorText: 'Works' },
      ],
    };

    const issues = detector.detect(page);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: 'BROKEN_LINK_404',
      severity: 'critical',
      category: 'broken_links',
      affectedUrl: 'https://example.com/page',
      details: {
        brokenUrl: 'https://example.com/missing',
        statusCode: 404,
        anchorText: 'Click here',
      },
    });
  });

  it('should detect 5xx links as high severity', () => {
    const page = {
      url: 'https://example.com/page',
      links: [
        { url: 'https://example.com/error', statusCode: 500, anchorText: 'Server error' },
      ],
    };

    const issues = detector.detect(page);

    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('high');
    expect(issues[0].code).toBe('BROKEN_LINK_5XX');
  });

  it('should detect timeout links as medium severity', () => {
    const page = {
      url: 'https://example.com/page',
      links: [
        { url: 'https://example.com/slow', statusCode: null, timedOut: true, anchorText: 'Slow' },
      ],
    };

    const issues = detector.detect(page);

    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('medium');
    expect(issues[0].code).toBe('BROKEN_LINK_TIMEOUT');
  });

  it('should ignore external links when configured', () => {
    const detector = new BrokenLinkDetector({ checkExternal: false });
    const page = {
      url: 'https://example.com/page',
      links: [
        { url: 'https://other-site.com/missing', statusCode: 404, anchorText: 'External' },
      ],
    };

    const issues = detector.detect(page);
    expect(issues).toHaveLength(0);
  });

  it('should return empty array for pages with no broken links', () => {
    const page = {
      url: 'https://example.com/page',
      links: [
        { url: 'https://example.com/a', statusCode: 200 },
        { url: 'https://example.com/b', statusCode: 301 },
        { url: 'https://example.com/c', statusCode: 200 },
      ],
    };

    const issues = detector.detect(page);
    expect(issues).toHaveLength(0);
  });
});

// tests/unit/on-page/meta-scorer.test.ts
import { describe, it, expect } from 'vitest';
import { MetaScorer } from '../../../../src/on-page/meta-scorer';

describe('MetaScorer', () => {
  const scorer = new MetaScorer();

  describe('title scoring', () => {
    it('should give 100 for a perfect title', () => {
      const result = scorer.scoreTitle('Best Project Management Software | Example App');
      expect(result.score).toBe(100);
      expect(result.issues).toHaveLength(0);
    });

    it('should penalize titles that are too short', () => {
      const result = scorer.scoreTitle('Hi');
      expect(result.score).toBeLessThan(50);
      expect(result.issues).toContain('Title is too short (2 chars). Aim for 30-60 characters.');
    });

    it('should penalize titles that are too long', () => {
      const result = scorer.scoreTitle('A'.repeat(80));
      expect(result.score).toBeLessThan(80);
      expect(result.issues).toContain('Title is too long (80 chars). Google typically displays 50-60 characters.');
    });

    it('should flag missing titles', () => {
      const result = scorer.scoreTitle(null);
      expect(result.score).toBe(0);
      expect(result.issues).toContain('Page is missing a title tag.');
    });

    it('should warn about duplicate pipe separators', () => {
      const result = scorer.scoreTitle('Page | Category | Brand | Site');
      expect(result.issues).toContain('Title contains multiple separators, which may dilute focus.');
    });
  });

  describe('description scoring', () => {
    it('should give 100 for an optimal-length description', () => {
      const desc = 'Learn how to manage projects effectively with our comprehensive guide. ' +
        'Covers methodologies, tools, best practices, and team collaboration strategies.';
      const result = scorer.scoreDescription(desc);
      expect(result.score).toBeGreaterThanOrEqual(90);
    });

    it('should penalize descriptions under 120 characters', () => {
      const result = scorer.scoreDescription('Short description.');
      expect(result.score).toBeLessThan(60);
      expect(result.issues).toContain('Description is too short (18 chars). Aim for 120-160 characters.');
    });

    it('should penalize descriptions over 160 characters', () => {
      const result = scorer.scoreDescription('A'.repeat(200));
      expect(result.score).toBeLessThan(80);
    });
  });
});

// tests/unit/structured-data/generator.test.ts
import { describe, it, expect } from 'vitest';
import { StructuredDataGenerator } from '../../../../src/structured-data/generator';

describe('StructuredDataGenerator', () => {
  const sdg = new StructuredDataGenerator();

  describe('article', () => {
    it('should generate valid Article JSON-LD', () => {
      const result = sdg.article({
        headline: 'Test Article',
        description: 'A test article for validation.',
        author: { name: 'Jane Doe' },
        publisher: { name: 'Test Pub', logo: 'https://example.com/logo.png' },
        datePublished: '2025-01-01T00:00:00Z',
        image: 'https://example.com/image.jpg',
      });

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('Article');
      expect(result.headline).toBe('Test Article');
      expect(result.author).toMatchObject({ '@type': 'Person', name: 'Jane Doe' });
      expect(result.publisher).toMatchObject({
        '@type': 'Organization',
        name: 'Test Pub',
        logo: expect.objectContaining({ '@type': 'ImageObject' }),
      });
    });

    it('should pass validation for complete article schema', () => {
      const result = sdg.article({
        headline: 'Test Article',
        description: 'Description here.',
        author: { name: 'Jane Doe' },
        publisher: { name: 'Test Pub', logo: 'https://example.com/logo.png' },
        datePublished: '2025-01-01T00:00:00Z',
        image: 'https://example.com/image.jpg',
      });

      const validation = sdg.validate(result);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('faq', () => {
    it('should generate valid FAQPage JSON-LD', () => {
      const result = sdg.faq({
        questions: [
          { question: 'What is SEO?', answer: 'Search engine optimization.' },
          { question: 'Why is SEO important?', answer: 'It drives organic traffic.' },
        ],
      });

      expect(result['@type']).toBe('FAQPage');
      expect(result.mainEntity).toHaveLength(2);
      expect(result.mainEntity[0]).toMatchObject({
        '@type': 'Question',
        name: 'What is SEO?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Search engine optimization.',
        },
      });
    });
  });

  describe('breadcrumbs', () => {
    it('should generate BreadcrumbList with correct positions', () => {
      const result = sdg.breadcrumbs({
        items: [
          { name: 'Home', url: 'https://example.com' },
          { name: 'Blog', url: 'https://example.com/blog' },
          { name: 'Current Post' },
        ],
      });

      expect(result['@type']).toBe('BreadcrumbList');
      expect(result.itemListElement).toHaveLength(3);
      expect(result.itemListElement[0].position).toBe(1);
      expect(result.itemListElement[1].position).toBe(2);
      expect(result.itemListElement[2].position).toBe(3);
    });
  });
});

// tests/unit/linking/equity-model.test.ts
import { describe, it, expect } from 'vitest';
import { LinkEquityModel } from '../../../../src/linking/equity-model';

describe('LinkEquityModel', () => {
  const model = new LinkEquityModel({ dampingFactor: 0.85, iterations: 50 });

  it('should compute higher equity for pages with more inbound links', () => {
    const graph = {
      nodes: ['A', 'B', 'C', 'D'],
      edges: [
        { source: 'A', target: 'B' },
        { source: 'A', target: 'C' },
        { source: 'B', target: 'C' },
        { source: 'D', target: 'C' },
      ],
    };

    const scores = model.compute(graph);

    // C has the most inbound links (from A, B, D)
    expect(scores.get('C')).toBeGreaterThan(scores.get('A')!);
    expect(scores.get('C')).toBeGreaterThan(scores.get('B')!);
    expect(scores.get('C')).toBeGreaterThan(scores.get('D')!);
  });

  it('should handle self-referencing links gracefully', () => {
    const graph = {
      nodes: ['A', 'B'],
      edges: [
        { source: 'A', target: 'A' },  // self-reference
        { source: 'A', target: 'B' },
      ],
    };

    const scores = model.compute(graph);
    expect(scores.get('A')).toBeDefined();
    expect(scores.get('B')).toBeDefined();
    expect(Number.isFinite(scores.get('A'))).toBe(true);
  });

  it('should identify orphan nodes with zero equity flow', () => {
    const graph = {
      nodes: ['A', 'B', 'C'],         // C is orphan — no inbound
      edges: [
        { source: 'A', target: 'B' },
        { source: 'C', target: 'A' },
      ],
    };

    const scores = model.compute(graph);
    // C only gives equity, receives very little back
    expect(scores.get('C')).toBeLessThan(scores.get('B')!);
  });

  it('should converge within configured iterations', () => {
    const graph = {
      nodes: Array.from({ length: 100 }, (_, i) => `P${i}`),
      edges: Array.from({ length: 100 }, (_, i) => ({
        source: `P${i}`,
        target: `P${(i + 1) % 100}`,
      })),
    };

    const scores = model.compute(graph);
    const values = [...scores.values()];

    // In a circular graph, all scores should be roughly equal
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    for (const v of values) {
      expect(Math.abs(v - avg)).toBeLessThan(0.01);
    }
  });
});
```

### Integration Test Example

```typescript
// tests/integration/audit-pipeline.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase, seedTestData, destroyTestDatabase } from '../helpers/db';
import { SEOService } from '../../src/service';
import { MockCrawler } from '../mocks/crawler';
import { loadFixture } from '../helpers/fixtures';

describe('Audit Pipeline Integration', () => {
  let db: TestDatabase;
  let seo: SEOService;
  let mockCrawler: MockCrawler;

  beforeAll(async () => {
    db = await createTestDatabase();
    await seedTestData(db, {
      tenant: { id: 'tenant_1', name: 'Test Tenant' },
      site: { id: 'site_1', tenantId: 'tenant_1', domain: 'example.com' },
    });

    mockCrawler = new MockCrawler();
    mockCrawler.loadFixture(loadFixture('crawl-data/site-with-issues.json'));

    seo = new SEOService({
      db: db.client,
      crawler: mockCrawler,
      gsc: null,                           // not needed for audit tests
    });
  });

  afterAll(async () => {
    await destroyTestDatabase(db);
  });

  it('should complete a full audit pipeline', async () => {
    // Start the audit
    const { auditId } = await seo.startAudit('site_1', {
      maxPages: 100,
      renderJs: false,
    });

    expect(auditId).toBeTruthy();

    // Wait for completion (in tests, runs synchronously with mock crawler)
    const result = await seo.getAuditResult(auditId);

    expect(result.status).toBe('complete');
    expect(result.crawlStats.pagesCrawled).toBeGreaterThan(0);
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeLessThanOrEqual(100);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('should detect known issues from fixture data', async () => {
    const { auditId } = await seo.startAudit('site_1', { maxPages: 100 });
    const result = await seo.getAuditResult(auditId);

    // The fixture contains a page with missing meta title
    const missingMeta = result.issues.filter(i => i.code === 'MISSING_META_TITLE');
    expect(missingMeta.length).toBeGreaterThan(0);

    // The fixture contains broken links
    const brokenLinks = result.issues.filter(i => i.category === 'broken_links');
    expect(brokenLinks.length).toBeGreaterThan(0);

    // Every issue should have remediation instructions
    for (const issue of result.issues) {
      expect(issue.remediation).toBeTruthy();
      expect(issue.remediation.length).toBeGreaterThan(20);
    }
  });

  it('should compare audits and detect improvements', async () => {
    // Run first audit
    const { auditId: firstAuditId } = await seo.startAudit('site_1', { maxPages: 100 });

    // Modify fixture to simulate fixing some issues
    mockCrawler.loadFixture(loadFixture('crawl-data/small-site.json'));  // fewer issues

    // Run second audit
    const { auditId: secondAuditId } = await seo.startAudit('site_1', {
      maxPages: 100,
      baseAuditId: firstAuditId,
    });

    const comparison = await seo.compareAudits(firstAuditId, secondAuditId);

    expect(comparison.healthScoreDelta).toBeGreaterThanOrEqual(0);
    expect(comparison.resolvedIssues).toBeGreaterThan(0);
  });

  it('should persist audit results to database', async () => {
    const { auditId } = await seo.startAudit('site_1', { maxPages: 50 });

    // Verify data was persisted
    const auditRow = await db.client.query.seoAudits.findFirst({
      where: eq(seoAudits.id, auditId),
    });

    expect(auditRow).toBeTruthy();
    expect(auditRow!.status).toBe('complete');
    expect(auditRow!.siteId).toBe('site_1');
    expect(auditRow!.tenantId).toBe('tenant_1');

    // Verify issues were persisted
    const issueRows = await db.client.query.auditIssues.findMany({
      where: eq(auditIssues.auditId, auditId),
    });

    expect(issueRows.length).toBeGreaterThan(0);
  });
});
```

### Test Coverage Requirements

| Subsystem | Minimum Coverage | Critical Paths |
|---|---|---|
| `audit/` | 90% | Crawler loop, all detectors, severity scoring |
| `keywords/` | 85% | Rank checking, SERP feature detection, group management |
| `sitemap/` | 90% | XML generation, validation, submission, sitemap index |
| `on-page/` | 90% | Meta scoring, readability, keyword density, heading analysis |
| `structured-data/` | 95% | All schema types, validation, edge cases |
| `linking/` | 85% | Graph construction, PageRank, orphan detection |
| `speed/` | 80% | Lighthouse integration, CWV extraction, trend analysis |
| `competitors/` | 80% | Keyword gaps, domain authority estimation |
| `reports/` | 85% | Data aggregation, rendering, delivery |
| `multi-site/` | 80% | Cannibalization detection, cross-site linking |

### Mocking Strategy

```typescript
// Mock factories for testing

// Mock Puppeteer browser for crawler tests
export function createMockBrowser(): MockBrowser {
  return {
    newPage: vi.fn(() => createMockPage()),
    close: vi.fn(),
    isConnected: vi.fn(() => true),
  };
}

export function createMockPage(): MockPage {
  return {
    goto: vi.fn().mockResolvedValue({ status: () => 200 }),
    content: vi.fn().mockResolvedValue('<html><head><title>Test</title></head><body></body></html>'),
    evaluate: vi.fn(),
    close: vi.fn(),
    setUserAgent: vi.fn(),
    setViewport: vi.fn(),
    waitForSelector: vi.fn(),
    $$eval: vi.fn().mockResolvedValue([]),
    $eval: vi.fn(),
    url: vi.fn(() => 'https://example.com'),
    metrics: vi.fn().mockResolvedValue({ Timestamp: Date.now() }),
  };
}

// Mock Google Search Console client
export function createMockGSC(): MockGSC {
  return {
    searchanalytics: {
      query: vi.fn().mockResolvedValue({
        data: {
          rows: [
            {
              keys: ['test keyword'],
              position: 5.2,
              clicks: 150,
              impressions: 3000,
              ctr: 0.05,
            },
          ],
        },
      }),
    },
    sitemaps: {
      submit: vi.fn().mockResolvedValue({}),
      list: vi.fn().mockResolvedValue({ data: { sitemap: [] } }),
    },
  };
}

// Mock Lighthouse runner
export function createMockLighthouse(): MockLighthouse {
  return {
    run: vi.fn().mockResolvedValue({
      lhr: {
        categories: {
          performance: { score: 0.85 },
          accessibility: { score: 0.92 },
          'best-practices': { score: 0.88 },
          seo: { score: 0.95 },
        },
        audits: {
          'largest-contentful-paint': { numericValue: 2100 },
          'first-input-delay': { numericValue: 50 },
          'cumulative-layout-shift': { numericValue: 0.05 },
          'server-response-time': { numericValue: 350 },
          'interactive': { numericValue: 3200 },
        },
      },
    }),
  };
}
```

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| `0.16.0` | 2026-02-01 | Added INP (Interaction to Next Paint) tracking alongside FID; multi-site cannibalization detection |
| `0.15.0` | 2025-12-15 | Competitor analysis subsystem: keyword gaps, domain authority estimation, backlink comparison |
| `0.14.0` | 2025-11-01 | Internal linking subsystem: link graph, orphan detection, PageRank equity model, anchor text analysis |
| `0.13.0` | 2025-09-15 | Structured data generator with validation; support for Article, Product, FAQ, Breadcrumbs, Organization schemas |
| `0.12.0` | 2025-08-01 | Initial release: technical audit, keyword tracking, sitemap generation, on-page analysis, page speed, reporting |

---

*This document is auto-generated from source and updated on each release. For the latest version, see the [source repository](https://github.com/mcv-one/mcv/tree/main/packages/growth/seo).*