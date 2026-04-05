# @mcv/growth — Technical Architecture

## Tier 5: PUBLISHABLE Domains

**Package:** `@mcv/growth`
**Classification:** PUBLISHABLE
**Version:** 1.0.0
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
   - [ads — Ad Campaign Management](#ads--ad-campaign-management-across-platforms)
   - [affiliates — Affiliate Program Management](#affiliates--affiliate-program-and-commission-tracking)
   - [attribution — Multi-Touch Attribution](#attribution--multi-touch-attribution-modeling)
   - [content — CMS & Content Management](#content--cms-and-content-management)
   - [creative — Creative Asset Management](#creative--creative-asset-management-and-ab-testing)
   - [education — Educational Content & Courses](#education--educational-content-and-courses)
   - [email-campaigns — Email Marketing Automation](#email-campaigns--email-marketing-automation)
   - [marketing — Campaign Orchestration Core](#marketing--campaign-orchestration-and-automation)
   - [referrals — Referral Program Management](#referrals--referral-program-management)
   - [seo — SEO Tools & Optimization](#seo--seo-tools-and-optimization)
   - [sms — SMS Marketing Campaigns](#sms--sms-marketing-campaigns)
   - [social — Social Media Management](#social--social-media-management)
   - [website — Website & Landing Page Builder](#website--websitelanding-page-builder)
4. [Data Models](#data-models)
5. [Data Flow](#data-flow)
6. [Integration Points](#integration-points)
7. [Performance](#performance)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Observability](#observability)
11. [Security](#security)

---

## Architecture Overview

`@mcv/growth` is the largest domain package in the MCV ecosystem, unifying **13 interconnected submodules** into a comprehensive growth and marketing automation platform. It serves as the single entry point for all customer acquisition, engagement, retention, and revenue-programme operations across the MCV 9-venture consortium.

### Design Principles

| Principle | Application |
|-----------|-------------|
| **Single Entry Point** | All growth operations flow through `@mcv/growth`'s unified exports — no direct submodule imports needed |
| **Event-Driven Architecture** | Marketing events, campaign sends, attribution touchpoints, and social interactions propagate through Redpanda/Kafka and BullMQ |
| **Multi-Tenancy via RLS** | Every table includes `ventureId`; Supabase Row-Level Security guarantees isolation between ventures |
| **Queue-Based Delivery** | Campaign sends, SMS dispatch, social publishing, and ad syncs all use BullMQ for rate limiting, retries, and back-pressure |
| **Provider Abstraction** | External services (SendGrid, Twilio, Google Ads, Meta, TikTok, etc.) are abstracted behind unified service interfaces |
| **AI-Augmented** | Brand voice management, content brief generation, creative optimisation, and predictive segmentation leverage OpenRouter AI |
| **Web3-Native** | Wallet-based segmentation, NFT certificate rewards, token-gated content, and EDGE token-denominated LTV tracking |

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Next.js 15 (App Router) | Server Components, API routes, RSC streaming |
| **Monorepo** | Turborepo | Build orchestration, task caching, dependency graph |
| **Database** | PostgreSQL (Supabase) | Primary data store with RLS policies |
| **ORM** | Drizzle ORM | Type-safe schema definitions, migrations, queries |
| **Validation** | Zod | Runtime schema validation for all inputs |
| **Queue** | BullMQ (Redis-backed) | Job queues for campaign sends, automation steps, syncs |
| **Streaming** | Redpanda/Kafka | Event streaming for marketing events, attribution |
| **Cache** | Redis | Query caching, session data, rate limiting counters |
| **AI** | OpenRouter | Content generation, brand voice, predictive models |
| **Email** | SendGrid | Transactional and marketing email delivery |
| **SMS** | Twilio | SMS/MMS messaging with A2P 10DLC compliance |
| **Video** | Mux | Education video hosting and streaming |
| **API Layer** | tRPC | End-to-end type-safe API procedures |

### Package Boundaries

```
@mcv/growth (this package)
├── Owns: All growth/marketing business logic
├── Owns: 50+ database tables across 3 schemas (growth, marketing, education)
├── Owns: 13 submodule service layers
├── Owns: All React hooks and UI components for growth features
├── Depends on: @mcv/kernel (auth, db, crypto, audit)
├── Depends on: @mcv/comms (email/SMS/push delivery)
├── Depends on: @mcv/storage (file uploads, CDN, signed URLs)
├── Depends on: @mcv/analytics (event ingestion, funnel tracking)
├── Depends on: @mcv/nexus (CRM contacts for audience resolution)
└── Consumed by: All 9 venture applications
```

---

## System Diagram

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     @mcv/growth — GROWTH & MARKETING PLATFORM                   │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                            ENTRY POINTS                                   │  │
│  │                                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │ Admin UI │  │Public API│  │ Webhooks │  │ Cron Jobs│  │ Widgets  │  │  │
│  │  │Dashboard │  │/api/grow │  │Providers │  │Scheduled │  │Embedded  │  │  │
│  │  └─────┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │  │
│  │        └─────────────┼─────────────┼─────────────┼─────────────┘        │  │
│  └──────────────────────┼─────────────┼─────────────┼──────────────────────┘  │
│                         │             │             │                          │
│  ┌──────────────────────┼─────────────┼─────────────┼──────────────────────┐  │
│  │              tRPC ROUTER LAYER (marketing.router.ts)                     │  │
│  │                                                                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │  │
│  │  │ social.*   │  │ ads.*      │  │ creative.* │  │ analytics.*│        │  │
│  │  │ listAccts  │  │ listAccts  │  │ listAssets │  │ getDashbrd │        │  │
│  │  │ connect    │  │ connect    │  │ createAsst │  │ getTimelne │        │  │
│  │  │ postContent│  │ createCamp │  │ brandVoice │  │ getCampaign│        │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │  │
│  └─────────────────────────────┬────────────────────────────────────────────┘  │
│                                │                                               │
│  ┌─────────────────────────────┼───────────────────────────────────────────┐   │
│  │                    SERVICE LAYER (13 Submodules)                         │   │
│  │                                                                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │   │
│  │  │marketing │ │campaigns │ │  email   │ │   sms    │ │affiliates│     │   │
│  │  │          │ │          │ │campaigns │ │          │ │          │     │   │
│  │  │Segments  │ │Orchestr. │ │Templates │ │A2P 10DLC │ │Multi-tier│     │   │
│  │  │Audiences │ │Journeys  │ │Subscrib. │ │Opt-outs  │ │Commissns │     │   │
│  │  │Events    │ │Automate  │ │Bounces   │ │Threads   │ │Payouts   │     │   │
│  │  │A/B Tests │ │BullMQ    │ │DKIM/SPF  │ │Compliance│ │Fraud Det.│     │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │   │
│  │                                                                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │   │
│  │  │referrals │ │attributn │ │   ads    │ │   seo    │ │  social  │     │   │
│  │  │          │ │          │ │          │ │          │ │          │     │   │
│  │  │Viral Loop│ │Multi-tch │ │Google Ads│ │Crawl/Aud │ │6 Platfrm │     │   │
│  │  │Rewards   │ │Models    │ │Meta Ads  │ │Keywords  │ │Scheduling│     │   │
│  │  │Codes     │ │Time Decay│ │TikTok Ads│ │Backlinks │ │Inbox     │     │   │
│  │  │Tracking  │ │ROI Calc  │ │LinkedIn  │ │Rankings  │ │Analytics │     │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │   │
│  │                                                                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │   │
│  │  │ content  │ │ creative │ │education │ │ website  │                   │   │
│  │  │          │ │          │ │          │ │          │                   │   │
│  │  │Calendar  │ │Brand Voic│ │Courses   │ │Pages     │                   │   │
│  │  │Briefs    │ │DAM Assets│ │Modules   │ │Blocks    │                   │   │
│  │  │Workflow  │ │Embeddings│ │Lessons   │ │Forms     │                   │   │
│  │  │Pipeline  │ │AI Prompts│ │NFT Certs │ │Domains   │                   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                   │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                │                                               │
│             ┌──────────────────┼──────────────────┐                            │
│             │                  │                   │                            │
│  ┌──────────┴──────────┐ ┌────┴──────────────┐ ┌──┴──────────────────┐        │
│  │  @mcv/comms         │ │ @mcv/storage      │ │ @mcv/analytics      │        │
│  │  Email (SendGrid)   │ │ Files & Assets    │ │ Event Ingestion     │        │
│  │  SMS (Twilio)       │ │ CDN Delivery      │ │ Funnel Tracking     │        │
│  │  Push Notifications │ │ Signed URLs       │ │ Real-Time Streams   │        │
│  └─────────────────────┘ └───────────────────┘ └─────────────────────┘        │
│                                │                                               │
│  ┌─────────────────────────────┼───────────────────────────────────────────┐   │
│  │                   DATABASE LAYER (PostgreSQL + Supabase)                 │   │
│  │                                                                          │   │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐               │   │
│  │  │ growth schema  │ │marketing schema│ │education schema│               │   │
│  │  │ profiles       │ │ campaigns      │ │ courses        │               │   │
│  │  │ segments       │ │ messages       │ │ modules        │               │   │
│  │  │ segment_members│ │ sequences      │ │ lessons        │               │   │
│  │  └────────────────┘ └────────────────┘ │ enrollments    │               │   │
│  │                                         └────────────────┘               │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐    │   │
│  │  │  growth_* tables                                                  │    │   │
│  │  │                                                                   │    │   │
│  │  │  segments ▪ audiences ▪ marketing_events ▪ personalization_rules  │    │   │
│  │  │  ab_tests ▪ campaigns ▪ campaign_messages ▪ campaign_recipients   │    │   │
│  │  │  automations ▪ automation_enrollments ▪ journeys ▪ suppression   │    │   │
│  │  │  email_templates ▪ email_domains ▪ email_subscribers ▪ lists     │    │   │
│  │  │  sms_phone_numbers ▪ sms_messages ▪ sms_opt_outs ▪ conversations│    │   │
│  │  │  affiliate_programs ▪ affiliates ▪ affiliate_links ▪ clicks     │    │   │
│  │  │  affiliate_commissions ▪ affiliate_payouts                       │    │   │
│  │  │  referral_programs ▪ referral_codes ▪ referrals ▪ rewards       │    │   │
│  │  │  attribution_models ▪ touchpoints ▪ conversions ▪ channel_perf  │    │   │
│  │  │  seo_audits ▪ keywords ▪ backlinks                              │    │   │
│  │  │  ad_accounts ▪ ad_campaigns ▪ ad_insights                       │    │   │
│  │  │  social_accounts ▪ social_posts ▪ social_executions ▪ interactns│    │   │
│  │  │  brand_voices ▪ content_assets ▪ content_briefs                 │    │   │
│  │  │  sites ▪ pages ▪ blocks ▪ forms ▪ domains                       │    │   │
│  │  └──────────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                   EXTERNAL PROVIDER INTEGRATIONS                         │   │
│  │                                                                          │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │   │
│  │  │ Google │ │  Meta  │ │ TikTok │ │LinkedIn│ │Twitter │ │SendGrid│    │   │
│  │  │Ads API │ │Ads API │ │Ads API │ │Ads API │ │Ads API │ │ Email  │    │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │   │
│  │  │ Twilio │ │Facebook│ │Instagr.│ │YouTube │ │OpenAI/ │ │  Mux   │    │   │
│  │  │SMS/MMS │ │ Graph  │ │ Graph  │ │Data API│ │OpenRtr │ │ Video  │    │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow Architecture

```
Client Request
     │
     ▼
┌─────────────┐
│  Next.js    │  App Router / API Route
│  Server     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  tRPC       │  Type-safe procedure resolution
│  Router     │  Auth check via protectedProcedure
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Service    │  Business logic in submodule services
│  Layer      │  Context-aware (ventureId, userId)
└──────┬──────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌─────────────┐                    ┌─────────────┐
│  Drizzle    │                    │  BullMQ     │
│  ORM        │                    │  Queue      │
│  (sync ops) │                    │  (async ops)│
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       ▼                                  ▼
┌─────────────┐                    ┌─────────────┐
│ PostgreSQL  │                    │  Workers    │
│ + RLS       │                    │  Pool       │
└─────────────┘                    └──────┬──────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │ @mcv/comms  │
                                   │ SendGrid    │
                                   │ Twilio      │
                                   └─────────────┘
```

---

## Module Architecture

### Module Dependency Graph

```
                    ┌──────────────────────┐
                    │      marketing       │  ◄── Core Infrastructure
                    │  Segments, Audiences │
                    │  Events, A/B Tests   │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                 │
              ▼                ▼                 ▼
     ┌────────────┐  ┌────────────┐    ┌────────────┐
     │  campaigns │  │attribution │    │  analytics  │
     │Orchestrate │  │ Touchpoints│    │  Dashboard  │
     │ Journeys   │  │ Models     │    │  Timeline   │
     └──────┬─────┘  └──────┬─────┘    └─────────────┘
            │               │
   ┌────────┼───────┐       │
   │        │       │       │
   ▼        ▼       ▼       ▼
┌──────┐┌──────┐┌──────┐┌──────┐
│email ││ sms  ││social││ ads  │
│camps ││      ││      ││      │
└──────┘└──────┘└──────┘└──────┘

  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │affiliates│  │ referrals│  │   seo    │
  └──────────┘  └──────────┘  └──────────┘

  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ content  │  │ creative │  │education │
  └──────────┘  └──────────┘  └──────────┘

  ┌──────────┐
  │ website  │
  └──────────┘
```

### Submodule Summary Table

| # | Submodule | Purpose | Key Services | Key Tables |
|---|-----------|---------|-------------|------------|
| 1 | **ads** | Ad campaign management across Google, Meta, TikTok, LinkedIn, Twitter | `AdManagerService` | `ad_accounts`, `ad_campaigns`, `ad_insights` |
| 2 | **affiliates** | Affiliate programme with multi-tier commissions, payouts, fraud detection | `AffiliateService` | `growth_affiliate_programs`, `growth_affiliates`, `growth_affiliate_links`, `growth_affiliate_commissions`, `growth_affiliate_payouts` |
| 3 | **attribution** | Multi-touch attribution with configurable models and ROI analysis | `AttributionService` | `growth_attribution_models`, `growth_touchpoints`, `growth_conversions`, `growth_channel_performance` |
| 4 | **content** | Content calendar, briefs, and workflow pipeline management | `ContentService` | `content_briefs`, `content_assets` |
| 5 | **creative** | Brand voice management and DAM with semantic search | `CreativeService` | `brand_voices`, `content_assets` |
| 6 | **education** | LMS with courses, modules, lessons, NFT certificates | `EducationService` | `education.courses`, `education.modules`, `education.lessons`, `education.enrollments` |
| 7 | **email-campaigns** | MJML templates, subscriber lifecycle, deliverability, bounces | `EmailTemplateService`, `EmailSubscriberService` | `growth_email_templates`, `growth_email_subscribers`, `growth_email_lists`, `growth_email_domains` |
| 8 | **marketing** | Core segmentation, event tracking, A/B testing, personalisation | `SegmentService`, `EventTrackingService`, `PersonalizationService`, `ABTestService` | `growth_segments`, `growth_audiences`, `growth_marketing_events`, `growth_ab_tests`, `growth_personalization_rules` |
| 9 | **referrals** | Referral programmes with dual-sided rewards and viral mechanics | `ReferralService` | `growth_referral_programs`, `growth_referral_codes`, `growth_referrals`, `growth_referral_rewards` |
| 10 | **seo** | Site audits, keyword tracking, backlink monitoring, SERP positions | `SEOService` | `growth_seo_audits`, `growth_keywords`, `growth_backlinks` |
| 11 | **sms** | SMS/MMS with A2P 10DLC compliance, opt-out handling, conversations | `SMSService` | `growth_sms_phone_numbers`, `growth_sms_messages`, `growth_sms_opt_outs`, `growth_sms_conversations` |
| 12 | **social** | Multi-platform social management: scheduling, inbox, analytics | `SocialConnectorService` | `social_accounts`, `social_posts`, `social_post_executions`, `social_interactions` |
| 13 | **website** | Landing page and site builder with drag-drop blocks | `WebsiteService` | `growth_sites`, `growth_pages`, `growth_blocks`, `growth_forms`, `growth_domains` |

---

### ads — Ad Campaign Management Across Platforms

#### Responsibility

Unified advertising management across five major ad platforms: Google Ads, Meta Ads, TikTok Ads, LinkedIn Ads, and Twitter Ads. Manages OAuth-based account connections, daily campaign synchronisation, insight aggregation, and cross-platform ROAS analysis.

#### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  AdManagerService                     │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐        │
│  │ connectAcc│  │ syncCamps │  │ syncInsght│        │
│  │ OAuth flow│  │ Pull data │  │ Daily agg │        │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘        │
│        │              │              │               │
│        ▼              ▼              ▼               │
│  ┌─────────────────────────────────────────────┐     │
│  │         Provider Adapter Layer               │     │
│  │                                              │     │
│  │  ┌────────┐ ┌────────┐ ┌────────┐          │     │
│  │  │ Google │ │  Meta  │ │ TikTok │          │     │
│  │  │Adapter │ │Adapter │ │Adapter │          │     │
│  │  └────────┘ └────────┘ └────────┘          │     │
│  │  ┌────────┐ ┌────────┐                     │     │
│  │  │LinkedIn│ │Twitter │                     │     │
│  │  │Adapter │ │Adapter │                     │     │
│  │  └────────┘ └────────┘                     │     │
│  └─────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

#### Key Design Decisions

- **Mirror, don't create**: Ad campaigns are created on the provider platform and synced into MCV. This avoids the complexity of multi-provider campaign creation APIs and respects each platform's native workflow.
- **Daily insight aggregation**: A BullMQ cron job (`growth:ad-sync`) runs every 6 hours, pulling campaign metadata and daily insights from each connected account.
- **OAuth token encryption**: Access tokens and refresh tokens are encrypted with AES-256-GCM before storage using `@mcv/kernel/crypto`. Tokens are decrypted only at the moment of API calls.
- **Unified metrics**: Despite different metric schemas across providers, all insights are normalised into a common `ad_insights` row with standard fields: impressions, clicks, spend, conversions, conversionValue, reach, CTR, CPC, CPM, ROAS. Raw provider JSON is preserved in `rawJson` for provider-specific analysis.

#### Data Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `ad_accounts` | OAuth-connected ad platform accounts | `provider`, `externalAccountId`, `accessToken` (encrypted), `status`, `lastSyncAt` |
| `ad_campaigns` | Mirrored campaigns from provider platforms | `adAccountId`, `externalCampaignId`, `objective`, `dailyBudget`, `status` |
| `ad_insights` | Daily aggregated metrics per campaign | `adCampaignId`, `date`, `impressions`, `clicks`, `spend`, `conversions`, `roas` |

#### BullMQ Queues

| Queue | Job | Schedule | Purpose |
|-------|-----|----------|---------|
| `growth:ad-sync` | `sync-campaigns` | Every 6h | Pull campaign data from each provider |
| `growth:ad-sync` | `sync-insights` | Every 6h | Pull daily insight rows per campaign |

---

### affiliates — Affiliate Program and Commission Tracking

#### Responsibility

Complete affiliate programme lifecycle management: programme creation with configurable commission structures (percentage, fixed, tiered), multi-level marketing (MLM) support up to N levels, affiliate registration with approval workflows, link generation with click tracking, commission recording and approval, automated payout processing, and fraud detection scoring.

#### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   AffiliateService                        │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Programme    │  │  Affiliate   │  │  Commission  │    │
│  │  Management   │  │  Registration│  │  Engine      │    │
│  │              │  │  & Approval  │  │              │    │
│  │ • Tiers      │  │ • MLM tree   │  │ • Record     │    │
│  │ • Cookie dur │  │ • Fraud score│  │ • Approve    │    │
│  │ • Payout cfg │  │ • Status mgmt│  │ • Cascade    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │             │
│         ▼                 ▼                 ▼             │
│  ┌──────────────────────────────────────────────────┐     │
│  │              Link Tracking Engine                 │     │
│  │                                                   │     │
│  │  Click → Cookie Set → Session Track → Conversion  │     │
│  │    │         │             │              │        │     │
│  │    ▼         ▼             ▼              ▼        │     │
│  │  clicks   visitor_id    sessions     commissions   │     │
│  │  table    cookie        table         table        │     │
│  └──────────────────────────────────────────────────┘     │
│                           │                               │
│  ┌──────────────────────────────────────────────────┐     │
│  │              Payout Processor                     │     │
│  │                                                   │     │
│  │  Aggregate approved commissions → Generate payout │     │
│  │  → Process via PayPal/Bank → Update balances      │     │
│  └──────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
```

#### Key Design Decisions

- **Multi-level commission cascading**: When a sale is attributed to an affiliate, the commission engine walks up the `parentAffiliateId` chain (up to `maxLevels`) and creates commission records at each level using the `levelRates` array.
- **Fraud detection**: A `fraudScore` (0–100) is maintained per affiliate, computed from signals like unusual click patterns, geographic anomalies, self-referral detection, and conversion velocity. Affiliates exceeding the threshold are auto-suspended.
- **Payout hold period**: Commissions have a configurable `payoutDelay` (default 30 days) to account for refund windows. Only commissions past this hold period move to `availableBalance`.
- **Attribution models**: Each programme can use `first_click`, `last_click`, or `linear` attribution for cookie-based conversion tracking.

#### Data Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `growth_affiliate_programs` | Programme configuration | `commissionType`, `tiers`, `multiLevel`, `maxLevels`, `levelRates`, `cookieDuration`, `payoutFrequency` |
| `growth_affiliates` | Registered affiliates | `programId`, `affiliateCode`, `parentAffiliateId`, `level`, `status`, `fraudScore`, `availableBalance` |
| `growth_affiliate_links` | Tracking links per affiliate | `affiliateId`, `destinationUrl`, `shortCode`, `clickCount`, `conversionCount` |
| `growth_affiliate_clicks` | Individual click events | `affiliateLinkId`, `visitorId`, `ipAddress`, `deviceType`, `country`, `converted` |
| `growth_affiliate_commissions` | Commission records | `affiliateId`, `type`, `level`, `orderAmount`, `commissionAmount`, `status`, `payoutId` |
| `growth_affiliate_payouts` | Payout batches | `affiliateId`, `amount`, `netAmount`, `payoutMethod`, `status` |

---

### attribution — Multi-Touch Attribution Modeling

#### Responsibility

Tracks customer touchpoints across all marketing channels and computes attribution credit using configurable models: first-touch, last-touch, linear, time-decay, position-based, and custom weighted models. Connects ad spend to revenue for ROI/ROAS analysis per channel.

#### Architecture

```
Touchpoint 1         Touchpoint 2         Touchpoint 3        Conversion
┌──────────┐         ┌──────────┐         ┌──────────┐       ┌──────────┐
│ Google Ad│────────►│  Email   │────────►│  Social  │──────►│ Purchase │
│  Click   │         │  Open    │         │  Click   │       │  Event   │
└──────────┘         └──────────┘         └──────────┘       └──────────┘
     │                    │                    │                   │
     ▼                    ▼                    ▼                   ▼
 touchpoints          touchpoints          touchpoints        conversions
     │                    │                    │                   │
     └────────────────────┴────────────────────┴───────────────────┘
                                    │
                                    ▼
                       ┌────────────────────────┐
                       │   Attribution Engine    │
                       │                         │
                       │  first_touch → 100%:T1  │
                       │  last_touch  → 100%:T3  │
                       │  linear      → 33% each │
                       │  time_decay  → variable  │
                       │  position    → 40/20/40  │
                       │  custom      → weighted   │
                       └────────────┬───────────┘
                                    │
                                    ▼
                       ┌────────────────────────┐
                       │  channel_performance    │
                       │  (ROI/ROAS per channel) │
                       └────────────────────────┘
```

#### Key Design Decisions

- **Lookback window**: Configurable per model (default 30 days). Only touchpoints within the lookback window preceding a conversion are included in attribution.
- **Time-decay half-life**: For time-decay models, a `halfLifeDays` parameter controls how quickly credit diminishes. A touchpoint's credit is `2^(-days_before_conversion / halfLifeDays)`.
- **Position-based weighting**: Configurable `firstTouchWeight`, `lastTouchWeight`, and `middleTouchWeight` (split among all middle touchpoints). Default is 40/40/20.
- **Async computation**: Attribution calculations are triggered asynchronously when a conversion event is recorded. The `EventTrackingService` queues attribution processing to avoid blocking the event ingestion pipeline.
- **Multi-model comparison**: Multiple attribution models can be active simultaneously, allowing marketers to compare credit allocation across models.

#### Data Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `growth_attribution_models` | Model configuration | `type`, `config`, `lookbackDays`, `conversionEvents`, `isDefault` |
| `growth_touchpoints` | Individual marketing touchpoints | `contactId`, `channel`, `source`, `medium`, `campaign`, `sessionId`, `timestamp` |
| `growth_conversions` | Conversion events with attribution | `contactId`, `conversionEvent`, `conversionValue`, `touchpoints`, `attributionResults` |
| `growth_channel_performance` | Aggregated channel ROI metrics | `channel`, `attributedRevenue`, `spend`, `roas`, `conversions` |

---

### content — CMS and Content Management

#### Responsibility

Content marketing calendar and workflow management providing a Kanban-style pipeline from ideation through creation, review, scheduling, and publication. Integrates with the creative submodule for brand voice–powered AI content brief generation.

#### Architecture

```
┌──────────────────────────────────────────────────┐
│                 ContentService                     │
├──────────────────────────────────────────────────┤
│                                                    │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │  Content   │  │ Workflow  │  │ Calendar  │    │
│  │  Briefs    │  │ Pipeline  │  │ Scheduler │    │
│  │            │  │           │  │           │    │
│  │ AI-powered │  │ idea →    │  │ Monthly/  │    │
│  │ generation │  │ draft →   │  │ weekly    │    │
│  │ via brand  │  │ review →  │  │ views     │    │
│  │ voice      │  │ ready →   │  │           │    │
│  │            │  │ scheduled │  │ Drag-drop │    │
│  │            │  │ → publish │  │ reschedulr│    │
│  └───────────┘  └───────────┘  └───────────┘    │
│        │                                          │
│        ▼                                          │
│  ┌────────────────────────────────────────────┐   │
│  │  CreativeService (brand_voices integration) │   │
│  │  AI brief generation via OpenRouter         │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

#### Key Design Decisions

- **Kanban workflow states**: Content items progress through `idea → draft → in_review → ready → scheduled → published → archived`. State transitions emit events for automation triggers.
- **Brand voice integration**: Content briefs are generated using the `brand_voices` system prompt, ensuring AI-generated content matches the venture's tone and style.
- **Platform targeting**: Each content brief can target a specific platform (blog, instagram, twitter, linkedin, etc.) with platform-appropriate formatting guidelines baked into the AI prompt.
- **Collaboration**: Multiple team members can be assigned to content items with reviewer/approver roles tracked in the workflow.

#### Data Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `content_briefs` | Content items in the pipeline | `title`, `status`, `brandVoiceId`, `targetAudience`, `goal`, `platform`, `content` |
| `content_assets` | Published or referenced assets | `fileId`, `name`, `type`, `tags`, `embedding`, `usageCount` |

---

### creative — Creative Asset Management and A/B Testing

#### Responsibility

Digital asset management (DAM) system and brand voice registry. Manages creative assets with semantic search via vector embeddings, tracks asset usage across marketing channels, and maintains brand voice definitions used by AI content generation across the entire growth module.

#### Architecture

```
┌──────────────────────────────────────────────────────┐
│                   CreativeService                      │
├──────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────────────────┐  ┌─────────────────────┐    │
│  │   Brand Voice        │  │   Asset Library      │    │
│  │   Management         │  │   (DAM)              │    │
│  │                      │  │                      │    │
│  │ • System prompts     │  │ • Upload & organise  │    │
│  │ • Tone & style       │  │ • Folder hierarchy   │    │
│  │ • Example pairs      │  │ • Tag management     │    │
│  │ • Default voice      │  │ • Vector embeddings  │    │
│  │ • AI brief gen       │  │ • Semantic search    │    │
│  │                      │  │ • Usage tracking     │    │
│  └─────────┬────────────┘  └─────────┬────────────┘    │
│            │                         │                  │
│            ▼                         ▼                  │
│  ┌─────────────────────┐  ┌─────────────────────┐    │
│  │  OpenRouter AI       │  │  @mcv/storage        │    │
│  │  Content generation  │  │  File storage + CDN  │    │
│  └─────────────────────┘  └─────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

#### Key Design Decisions

- **Semantic search**: Each asset stores a vector `embedding` (generated via OpenAI/OpenRouter) enabling similarity-based search: "find images similar to our spring campaign hero banner."
- **Brand voice as system prompt**: Each `brand_voice` record contains a complete LLM system prompt, along with `tone`, `style`, `keywords`, and input/output example pairs. This ensures consistent AI-generated content across all submodules.
- **Usage tracking**: `usageCount` is incremented whenever an asset is referenced in a campaign, social post, or email template, providing insights into which assets perform best.
- **File abstraction**: Assets reference `@mcv/storage` file IDs, decoupling the DAM metadata from the actual file storage layer.

#### Data Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `brand_voices` | LLM-powered brand voice definitions | `name`, `tone`, `style`, `systemPrompt`, `examples`, `isDefault` |
| `content_assets` | Creative assets with metadata & embeddings | `fileId`, `name`, `type`, `folderPath`, `tags`, `embedding`, `usageCount` |

---

### education — Educational Content and Courses

#### Responsibility

Learning management system (LMS) for venture-branded educational content. Supports structured courses with nested modules and lessons (video, article, quiz), per-user progress tracking, XP rewards, and NFT-based certification on course completion.

#### Architecture

```
┌──────────────────────────────────────────────────────┐
│                  EducationService                      │
├──────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Course      │  │  Progress   │  │  Certificate │  │
│  │  Management  │  │  Tracking   │  │  Engine      │  │
│  │             │  │             │  │             │  │
│  │ Courses     │  │ Enrollment  │  │ XP Reward   │  │
│  │  └─Modules  │  │ Lesson done │  │ NFT Mint    │  │
│  │    └─Lessons│  │ % calculate │  │ On-chain    │  │
│  │      video  │  │ Completion  │  │ certificate │  │
│  │      article│  │             │  │             │  │
│  │      quiz   │  │             │  │             │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│        │                                │             │
│        ▼                                ▼             │
│  ┌──────────────┐              ┌──────────────┐      │
│  │  Mux Video   │              │ NFT Service  │      │
│  │  Streaming   │              │ (Web3)       │      │
│  └──────────────┘              └──────────────┘      │
└──────────────────────────────────────────────────────┘
```

#### Key Design Decisions

- **Separate schema**: Education uses a dedicated `education` PostgreSQL schema to maintain clean separation from the main growth tables.
- **Content types**: Three lesson types — `video` (Mux-hosted), `article` (rich text), `quiz` (JSON config with questions, options, passing score) — cover the spectrum of educational content.
- **Progress as percentage**: `progressPercent` is calculated from `completedLessonIds.length / totalLessons * 100`. Stored as decimal(5,2) for precision.
- **NFT certificates**: On course completion, an NFT from the linked `nftCertificationId` collection is minted to the user's wallet. This integrates with `@mcv/web3` for on-chain operations.
- **XP rewards**: Completing a course awards `xpReward` points to the user's profile, feeding into the gamification system.

#### Data Tables (education schema)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `education.courses` | Course definitions | `title`, `slug`, `difficulty`, `isPublished`, `xpReward`, `nftCertificationId` |
| `education.modules` | Course modules (sections) | `courseId`, `title`, `orderIndex` |
| `education.lessons` | Individual lessons | `moduleId`, `title`, `contentType`, `videoProviderId`, `articleBody`, `quizConfig`, `orderIndex` |
| `education.enrollments` | Per-user enrollment & progress | `userId`, `courseId`, `progressPercent`, `isCompleted`, `completedLessonIds` |

---

### email-campaigns — Email Marketing Automation

#### Responsibility

Full-featured email marketing: MJML-based template management with drag-and-drop editor, deliverability infrastructure (DKIM, SPF, DMARC verification), subscriber lifecycle management with double opt-in, bounce and complaint handling, engagement analytics, and suppression list management.

#### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              email-campaigns Submodule                         │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────┐  ┌──────────────────────┐          │
│  │ EmailTemplateService │  │ EmailSubscriberService│          │
│  │                      │  │                       │          │
│  │ • create()           │  │ • subscribe()         │          │
│  │ • render(data)       │  │ • unsubscribe()       │          │
│  │ • preview(sample)    │  │ • handleBounce()      │          │
│  │                      │  │ • confirmSubscription()│          │
│  └──────────┬───────────┘  └──────────┬────────────┘          │
│             │                         │                        │
│             ▼                         ▼                        │
│  ┌──────────────────────┐  ┌──────────────────────┐          │
│  │  MJML Compiler       │  │  Suppression Engine   │          │
│  │                      │  │                       │          │
│  │  JSON → MJML → HTML  │  │  Hard bounce → clean  │          │
│  │  + plaintext gen     │  │  Complaint → suppress  │          │
│  │  + merge tag subst   │  │  Unsubscribe → global  │          │
│  └──────────────────────┘  └──────────────────────┘          │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Deliverability Layer                      │    │
│  │                                                       │    │
│  │  DKIM Records → SPF Verification → DMARC Check       │    │
│  │  Reputation Score → Bounce Rate → Complaint Rate      │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

#### Key Design Decisions

- **MJML compilation pipeline**: Templates can be authored in a drag-and-drop JSON format, which is converted to MJML, then compiled to responsive HTML. The compiled HTML is cached (`growth:email:template:{id}:v{version}`) for 24 hours.
- **Double opt-in**: Lists can optionally require email confirmation. A `confirmationToken` is generated and sent to the subscriber; only after clicking the confirmation link does the subscriber status move to `subscribed`.
- **Bounce handling**: Hard bounces immediately set subscriber status to `cleaned` and add the email to the global suppression list. Soft bounces are tracked but don't immediately suppress. Complaints move status to `complained`.
- **Merge tags**: `{{variableName}}` syntax is replaced at render time with personalisation data. Supports nested object paths.

#### Data Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `growth_email_templates` | Email template definitions | `subject`, `bodyHtml`, `bodyJson`, `category`, `version`, `usedCount` |
| `growth_email_domains` | Sending domain configuration | `domain`, `verificationStatus`, `dkimRecords`, `spfVerified`, `dmarcVerified`, `reputationScore` |
| `growth_email_subscribers` | Subscriber records | `email`, `status`, `listIds`, `preferences`, `emailsSent`, `emailsOpened`, `confirmedAt` |
| `growth_email_lists` | Mailing lists | `name`, `type`, `subscriberCount`, `requireDoubleOptIn`, `welcomeTemplateId` |
| `growth_email_bounces` | Bounce records | `email`, `bounceType`, `bounceSubtype`, `diagnosticCode`, `campaignId` |

---

### marketing — Campaign Orchestration and Automation

#### Responsibility

Core marketing infrastructure providing four foundational capabilities that every other submodule depends on: (1) audience segmentation with static, dynamic, and predictive segment types; (2) marketing event tracking across all channels with UTM attribution; (3) content personalisation engine with weighted variation selection; (4) A/B and multivariate testing with statistical significance calculation.

Additionally, the campaigns layer within marketing provides multi-channel campaign orchestration (one-time, recurring, triggered, journey), drip sequences, visual customer journey builders, and BullMQ-based message queuing with throttling.

#### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     marketing Submodule                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  SegmentService  │  │EventTrackingServ│  │PersonalizationS.│     │
│  │                  │  │                  │  │                  │     │
│  │ create()         │  │ track()          │  │ getPersonalzn() │     │
│  │ recalculate()    │  │ identify()       │  │ trackConversion()│     │
│  │ isContactIn()    │  │ getContactEvents│  │ evaluateRule()   │     │
│  │ getMembers()     │  │                  │  │ selectVariation()│     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  ABTestService   │  │ CampaignService │  │AutomationService│     │
│  │                  │  │                  │  │                  │     │
│  │ create()         │  │ create()         │  │ create()         │     │
│  │ start()          │  │ schedule()       │  │ activate()       │     │
│  │ getVariant()     │  │ sendNow()        │  │ enroll()         │     │
│  │ trackConversion()│  │ pause() / resume│  │ processStep()    │     │
│  │ calcResults()    │  │ trackEvent()     │  │                  │     │
│  │                  │  │ getAnalytics()   │  │                  │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │                    BullMQ Queue Layer                         │     │
│  │                                                              │     │
│  │  growth:campaign-send   → send-campaign, send-message        │     │
│  │  growth:automation-proc → process-step                       │     │
│  │                                                              │     │
│  │  Rate limiting: maxPerHour, maxPerDay per campaign           │     │
│  │  Sending windows: timezone-aware day/hour restrictions       │     │
│  │  Deduplication: within configurable day window               │     │
│  └─────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Key Design Decisions

- **Segment types**: Three segment types serve different use cases — `static` (manually curated member lists), `dynamic` (SQL conditions re-evaluated on demand), `predictive` (ML model reference with threshold). Dynamic segments are recalculated via a BullMQ cron hourly.
- **Deterministic A/B test assignment**: Visitor assignment to test variants uses a hash of the `visitorId` modulo the variant count, ensuring the same visitor always sees the same variant without server-side state.
- **Statistical significance**: A simplified z-test calculation determines p-value and confidence. Tests auto-conclude when the configured `confidenceLevel` is reached.
- **Campaign send pipeline**: `sendNow()` → resolve audience → create `campaign_recipients` → fan out to individual `send-message` jobs → deliver via `@mcv/comms` → track delivery events via provider webhooks.
- **Automation step processor**: Each automation enrollment is a state machine. Steps are processed sequentially by BullMQ workers, with delays scheduled as delayed jobs. Condition and split steps branch the flow.
- **Journey canvas**: Visual journey builder stores the flow as a `JourneyCanvas` JSON structure with `nodes` (typed steps) and `edges` (connections), compatible with React Flow rendering.

#### Data Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `growth_segments` | Audience segments | `name`, `type`, `conditions`, `memberIds`, `memberCount` |
| `growth_audiences` | Composite audiences (include/exclude segments) | `includeSegmentIds`, `excludeSegmentIds`, `suppressionListId` |
| `growth_marketing_events` | Marketing event stream | `eventName`, `contactId`, `channel`, `utmSource`, `properties`, `occurredAt` |
| `growth_personalization_rules` | Personalisation rules | `audienceId`, `variations`, `targetType`, `priority` |
| `growth_ab_tests` | A/B test configurations | `testType`, `variants`, `controlVariantId`, `primaryGoal`, `confidenceLevel`, `results` |
| `growth_campaigns` | Campaign definitions | `type`, `status`, `audienceId`, `channels`, `scheduledAt`, `settings`, stats fields |
| `growth_campaign_messages` | Per-channel message content | `campaignId`, `channel`, `subject`, `bodyHtml`, `templateId`, `dynamicContent` |
| `growth_campaign_recipients` | Per-recipient delivery tracking | `campaignId`, `contactId`, `status`, `deliveredAt`, `openedAt`, `clickedAt` |
| `growth_automations` | Automation workflow definitions | `triggerType`, `triggerConfig`, `steps`, `status`, `enrolledCount` |
| `growth_automation_enrollments` | Per-contact automation state | `automationId`, `contactId`, `currentStepId`, `status`, `stepHistory` |
| `growth_journeys` | Visual journey definitions | `canvas` (nodes + edges), `entryType`, `status` |
| `growth_suppression_lists` | Suppression lists | `type`, `channel`, `entryCount` |
| `growth_suppression_entries` | Suppression list entries | `listId`, `identifier`, `identifierType`, `reasonCode` |

---

### referrals — Referral Program Management

#### Responsibility

Customer referral programmes with viral mechanics, dual-sided rewards (referrer and referee), referral code generation and tracking, qualification workflows triggered by user actions (signup, purchase, subscription), and automated reward distribution via coupons, credits, free products, or points.

#### Architecture

```
┌───────────────────────────────────────────────────┐
│                 ReferralService                     │
├───────────────────────────────────────────────────┤
│                                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ Programme   │  │  Code      │  │  Reward    │  │
│  │ Setup       │  │ Generation │  │  Engine    │  │
│  │            │  │            │  │            │  │
│  │ Dual-sided │  │ Unique gen │  │ Qualify    │  │
│  │ rewards    │  │ Link track │  │ Auto-dist  │  │
│  │ Limits     │  │ Click/share│  │ Coupon gen │  │
│  │ Expiry     │  │ counters   │  │ Credit add │  │
│  └────────────┘  └────────────┘  └────────────┘  │
│                                                     │
│        Referral Flow:                               │
│                                                     │
│  Referrer shares code ──► Referee clicks link       │
│       │                         │                   │
│       ▼                         ▼                   │
│  Track share event        Track signup/purchase     │
│       │                         │                   │
│       ▼                         ▼                   │
│  Pending referral ──► Qualify (action met) ──►      │
│                       Issue rewards to both          │
└───────────────────────────────────────────────────┘
```

#### Key Design Decisions

- **Dual-sided rewards**: Both referrer and referee can receive independent reward configurations. The referrer might get account credit while the referee gets a percentage discount.
- **Reward types**: Six reward types — `discount_percent`, `discount_fixed`, `credit`, `free_product`, `free_month`, `points` — cover common referral incentive patterns.
- **Rate limiting**: `maxRewardsPerReferrer` and `maxRewardsPerDay` prevent abuse. `referralLinkExpiry` ensures old links don't generate indefinite rewards.
- **Qualification workflow**: Referrals are `pending` until the referee completes the `requiredAction` (signup, purchase, subscription). Once qualified, the reward engine issues rewards to both parties.

#### Data Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `growth_referral_programs` | Programme configuration | `referrerReward`, `refereeReward`, `requiredAction`, `maxRewardsPerReferrer` |
| `growth_referral_codes` | Per-user referral codes | `programId`, `referrerId`, `code`, `clickCount`, `conversionCount` |
| `growth_referrals` | Individual referral records | `codeId`, `referrerId`, `refereeId`, `status`, `qualifiedAt`, `rewardedAt` |
| `growth_referral_rewards` | Issued rewards | `referralId`, `recipientId`, `rewardType`, `rewardValue`, `status`, `couponCode` |

---

### seo — SEO Tools and Optimization

#### Responsibility

SEO auditing and optimization toolset: automated site crawls with technical SEO health checks, keyword tracking with SERP position monitoring, backlink monitoring with domain authority scoring, and on-page optimization recommendations categorised by severity.

#### Architecture

```
┌───────────────────────────────────────────────────────┐
│                     SEOService                         │
├───────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  Site Auditor │  │  Keyword     │  │  Backlink    ││
│  │               │  │  Tracker     │  │  Monitor     ││
│  │ Crawl pages   │  │ SERP check   │  │ Discover new ││
│  │ Technical SEO │  │ Volume data  │  │ Track lost   ││
│  │ Health score  │  │ Difficulty   │  │ Domain auth  ││
│  │ Issue catalog │  │ Position Δ   │  │ DoFollow/NoF ││
│  │ Recommend.    │  │              │  │              ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘│
│         │                 │                 │          │
│         ▼                 ▼                 ▼          │
│  ┌──────────────────────────────────────────────┐     │
│  │         BullMQ: growth:seo-audit              │     │
│  │         crawl-page jobs (concurrency: 5)      │     │
│  └──────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────┘
```

#### Key Design Decisions

- **Concurrent crawling**: SEO audits use a BullMQ queue (`growth:seo-audit`) with configurable concurrency (default 5 simultaneous pages) to avoid overwhelming target sites.
- **Issue severity levels**: Three levels — `critical` (broken, blocking indexing), `warning` (suboptimal, impacts ranking), `notice` (suggestions for improvement).
- **Issue categories**: Five categories — `technical` (crawlability, redirects, status codes), `content` (thin content, duplicates, missing meta), `performance` (page speed, Core Web Vitals), `mobile` (responsive, viewport), `security` (HTTPS, mixed content).
- **Position tracking**: Keywords are checked periodically against Google and Bing SERPs. `positionChange` tracks movement since last check.
- **Health score**: A 0–100 composite score weighted across issue categories: critical issues have 10x the weight of notices.

#### Data Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `growth_seo_audits` | Audit results | `siteUrl`, `status`, `healthScore`, `pagesScanned`, `criticalIssues`, `issues`, `recommendations` |
| `growth_keywords` | Tracked keywords | `keyword`, `searchVolume`, `difficulty`, `currentPosition`, `positionChange`, `searchEngine` |
| `growth_backlinks` | Discovered backlinks | `sourceUrl`, `targetUrl`, `anchorText`, `domainAuthority`, `isDoFollow`, `isActive` |

---

### sms — SMS Marketing Campaigns

#### Responsibility

SMS/MMS messaging with carrier-compliant delivery: A2P 10DLC registration for US numbers, phone number management across providers (Twilio, Bandwidth, Vonage), STOP keyword opt-out processing, conversation threading for two-way messaging, rate limiting per number, and cost tracking.

#### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      SMSService                           │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Number       │  │  Message     │  │  Compliance  │   │
│  │  Management   │  │  Sending     │  │  Engine      │   │
│  │              │  │              │  │              │   │
│  │ Provision    │  │ Send SMS/MMS │  │ STOP keyword │   │
│  │ A2P 10DLC   │  │ Queue-based  │  │ Opt-out list │   │
│  │ Rate limits  │  │ Rate limited │  │ Time windows │   │
│  │ Daily caps   │  │ Status track │  │ DNC check    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                           │                               │
│  ┌──────────────┐  ┌─────┴────────┐  ┌──────────────┐   │
│  │ Conversation │  │  Provider    │  │  Webhook     │   │
│  │  Threading   │  │  Adapter     │  │  Handler     │   │
│  │             │  │             │  │             │   │
│  │ Inbox-style │  │ Twilio      │  │ Delivery    │   │
│  │ 2-way chat  │  │ Bandwidth   │  │ status      │   │
│  │ Assignment  │  │ Vonage      │  │ Inbound msg │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────┘
```

#### Key Design Decisions

- **A2P 10DLC compliance**: US phone numbers must be registered with carrier-approved brands and campaigns. The `campaignId` and `brandId` fields on `sms_phone_numbers` track registration status.
- **STOP keyword processing**: Inbound messages containing `STOP`, `UNSUBSCRIBE`, `QUIT`, `CANCEL`, or `END` automatically create opt-out records and send a confirmation reply.
- **Rate limiting**: Per-number `dailyLimit` and `monthlyLimit` prevent carrier throttling. `sentToday` and `sentThisMonth` counters are maintained in Redis with daily/monthly resets.
- **Conversation threading**: Two-way SMS conversations are grouped by `(fromNumber, toNumber)` pair into `sms_conversations` records with message previews, counts, and assignment to team members.
- **Cost tracking**: Each message records its `cost` from the provider callback, enabling spend analysis per campaign or conversation.

#### Data Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `growth_sms_phone_numbers` | Managed phone numbers | `phoneNumber`, `provider`, `numberType`, `campaignId`, `brandId`, `dailyLimit` |
| `growth_sms_templates` | SMS message templates | `body`, `mediaUrls`, `category`, `carrierApproved` |
| `growth_sms_messages` | Individual message records | `fromNumber`, `toNumber`, `body`, `direction`, `status`, `cost`, `conversationId` |
| `growth_sms_opt_outs` | Opt-out records | `phoneNumber`, `type`, `source`, `optedOutAt` |
| `growth_sms_conversations` | Conversation threads | `fromNumber`, `toNumber`, `contactId`, `status`, `lastMessagePreview`, `assignedTo` |

---

### social — Social Media Management

#### Responsibility

Multi-platform social media management supporting six platforms: Facebook, Instagram, Twitter/X, LinkedIn, TikTok, and YouTube. Provides OAuth account connection, post scheduling with multi-account publishing, per-execution tracking, unified social inbox (comments, mentions, DMs), and per-account analytics.

#### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                SocialConnectorService                      │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Account      │  │  Publishing  │  │  Inbox       │   │
│  │  Connection   │  │  Engine      │  │  (Unified)   │   │
│  │              │  │              │  │              │   │
│  │ OAuth flow   │  │ Draft → Sched│  │ Comments     │   │
│  │ Token refresh│  │ → Published  │  │ Mentions     │   │
│  │ Status check │  │ Multi-account│  │ DMs          │   │
│  │ 6 platforms  │  │ Per-exec trk │  │ Read/Reply   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                           │                               │
│  ┌──────────────────────────────────────────────────┐    │
│  │      Platform Adapter Layer                       │    │
│  │                                                   │    │
│  │  ┌─────────┐┌─────────┐┌─────────┐             │    │
│  │  │Facebook ││Instagram││Twitter/ ││             │    │
│  │  │Graph API││Graph API││   X    ││             │    │
│  │  └─────────┘└─────────┘└─────────┘             │    │
│  │  ┌─────────┐┌─────────┐┌─────────┐             │    │
│  │  │LinkedIn ││ TikTok  ││YouTube  ││             │    │
│  │  │  API    ││  API    ││Data API ││             │    │
│  │  └─────────┘└─────────┘└─────────┘             │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │      BullMQ: growth:social-publish                │    │
│  │      publish-post → per-account execution         │    │
│  │                                                   │    │
│  │      Polling: social interactions every 60s       │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

#### Key Design Decisions

- **Multi-account posts**: A single `social_posts` record can target multiple `accountIds`. For each account, a `social_post_executions` record tracks the individual publish status and `externalPostId` returned by the platform.
- **Scheduled publishing**: Posts with `scheduledAt` are picked up by a BullMQ polling job that checks for posts due within the next interval. The `±10s accuracy` target is achieved by a 60-second polling interval with catch-up logic.
- **Unified inbox**: The `social_interactions` table aggregates comments, mentions, and DMs from all connected accounts. A polling job checks each account at configurable intervals (default 60s) for new interactions.
- **Platform-specific options**: The `platformOptions` JSON field on posts allows platform-specific configuration (e.g., Instagram carousel settings, Twitter thread mode, LinkedIn article publishing).
- **Token refresh**: OAuth tokens with expiry are tracked via `tokenExpiresAt`. A background job proactively refreshes tokens before they expire.

#### Data Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `social_accounts` | Connected social accounts | `provider`, `providerAccountId`, `accessToken` (encrypted), `status`, `metadata` |
| `social_posts` | Post drafts and scheduled content | `content`, `mediaUrls`, `accountIds`, `scheduledAt`, `status`, `platformOptions` |
| `social_post_executions` | Per-account publish tracking | `postId`, `accountId`, `externalPostId`, `status`, `error` |
| `social_interactions` | Unified inbox entries | `accountId`, `type`, `content`, `authorName`, `isRead`, `isReplied` |

---

### website — Website/Landing Page Builder

#### Responsibility

Website and landing page builder with drag-and-drop block editor. Supports multi-page sites, reusable block components, form builders with submission tracking, custom domain mapping, and A/B testing of page variants through the marketing submodule.

#### Architecture

```
┌───────────────────────────────────────────────────────┐
│                   WebsiteService                       │
├───────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  Site         │  │  Page/Block  │  │  Form        ││
│  │  Management   │  │  Editor      │  │  Builder     ││
│  │              │  │              │  │              ││
│  │ Create sites │  │ Drag-drop   │  │ Field config ││
│  │ Domain map   │  │ Block tree  │  │ Submissions  ││
│  │ SSL certs    │  │ Templates   │  │ Notifications││
│  │ Publish/     │  │ Responsive  │  │ Integrations ││
│  │ Unpublish    │  │ preview     │  │              ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │         Block Component System               │       │
│  │                                              │       │
│  │  hero │ text │ image │ gallery │ video      │       │
│  │  cta  │ form │ pricing │ testimonial │ FAQ  │       │
│  │  header │ footer │ social │ map │ custom    │       │
│  └─────────────────────────────────────────────┘       │
└───────────────────────────────────────────────────────┘
```

#### Key Design Decisions

- **Block-based architecture**: Pages are composed of typed blocks (hero, text, image, CTA, form, etc.) stored as a JSON tree. Each block has a `type`, `props` (configuration), and optional `children` array for nesting.
- **Domain management**: Custom domains are mapped via CNAME records. SSL certificates are provisioned automatically. Each site can have multiple domain aliases.
- **Form submissions**: Forms collect structured data and trigger configurable actions: email notification, webhook, automation enrollment, or CRM contact creation.
- **A/B testing integration**: Page variants can be tested through the marketing A/B test system by creating multiple page versions and routing traffic via the `ABTestService`.
- **SEO integration**: Each page has configurable meta tags, Open Graph data, and structured data. The SEO submodule can audit the site's pages for optimization opportunities.

#### Data Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `growth_sites` | Site definitions | `name`, `slug`, `defaultDomainId`, `isPublished`, `settings` |
| `growth_pages` | Individual pages | `siteId`, `title`, `path`, `blocks` (JSON tree), `metaTags`, `isPublished` |
| `growth_blocks` | Reusable block templates | `type`, `name`, `props`, `isGlobal` |
| `growth_forms` | Form definitions | `siteId`, `name`, `fields`, `submitAction`, `notificationEmail` |
| `growth_form_submissions` | Form submission data | `formId`, `data`, `ipAddress`, `submittedAt` |
| `growth_domains` | Custom domain mappings | `siteId`, `domain`, `sslStatus`, `isVerified`, `isPrimary` |

---

## Data Models

### Database Schema Overview

`@mcv/growth` manages **50+ database tables** organised across three PostgreSQL schemas:

| Schema | Purpose | Table Count | Key Tables |
|--------|---------|-------------|------------|
| `growth` | Customer profiles and CRM | 3 | `profiles`, `segments`, `segment_members` |
| `education` | LMS data | 4 | `courses`, `modules`, `lessons`, `enrollments` |
| `public` | All marketing operations | 45+ | campaigns, email, SMS, ads, social, affiliate, referral, attribution, SEO, content, creative, website |

### Entity Relationship Summary

```
                         ┌─────────────┐
                         │  ventures   │
                         │  (tenant)   │
                         └──────┬──────┘
                                │ ventureId (RLS)
           ┌────────────────────┼────────────────────┐
           │                    │                     │
    ┌──────┴──────┐     ┌──────┴──────┐      ┌──────┴──────┐
    │  segments   │     │  campaigns  │      │ ad_accounts │
    │  audiences  │     │  messages   │      │ ad_campaigns│
    │  events     │     │  recipients │      │ ad_insights │
    └──────┬──────┘     │  automations│      └─────────────┘
           │            └──────┬──────┘
           │                   │
    ┌──────┴──────┐     ┌──────┴──────┐
    │ ab_tests    │     │ email_*     │
    │ personal.   │     │ sms_*       │
    │ suppression │     │ social_*    │
    └─────────────┘     └─────────────┘

    ┌─────────────┐     ┌─────────────┐
    │ affiliate_* │     │ referral_*  │
    │ programs    │     │ programs    │
    │ affiliates  │     │ codes       │
    │ links       │     │ referrals   │
    │ commissions │     │ rewards     │
    │ payouts     │     └─────────────┘
    └─────────────┘

    ┌─────────────┐     ┌─────────────┐
    │attribution_ │     │  seo_*      │
    │ models      │     │  audits     │
    │ touchpoints │     │  keywords   │
    │ conversions │     │  backlinks  │
    └─────────────┘     └─────────────┘

    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │ brand_voices│     │ education.* │     │  website_*  │
    │ content_*   │     │  courses    │     │  sites      │
    │ assets      │     │  modules    │     │  pages      │
    │ briefs      │     │  lessons    │     │  blocks     │
    └─────────────┘     │  enrollments│     │  forms      │
                        └─────────────┘     │  domains    │
                                            └─────────────┘
```

### Core Drizzle ORM Patterns

All tables follow a standard base pattern provided by `@mcv/kernel/db`:

```typescript
// Base columns present on every table
const baseColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
};
```

#### Growth CRM Profile Schema

The unified customer profile merges identity, behavioural, and Web3 data:

```typescript
const growthProfiles = growthSchema.table('profiles', {
  id:                    uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  primaryWalletAddress:  text('primary_wallet_address'),
  primaryEmail:          text('primary_email'),
  ltvUsd:                decimal('ltv_usd', { precision: 15, scale: 2 }).default('0'),
  ltvEdge:               decimal('ltv_edge', { precision: 20, scale: 4 }).default('0'),
  engagementScore:       integer('engagement_score').default(0),
  churnRiskScore:        decimal('churn_risk_score', { precision: 3, scale: 2 }),
  lifecycleStage:        text('lifecycle_stage').default('visitor'),
  lastActiveAt:          timestamp('last_active_at', { withTimezone: true }),
  tags:                  text('tags').array().default([]),
  customAttributes:      jsonb('custom_attributes').default({}),
});
```

Key design points:
- **Dual LTV tracking**: Both fiat (`ltvUsd`) and token (`ltvEdge`) lifetime values are tracked, reflecting the Web3-native nature of MCV ventures.
- **Engagement scoring**: A composite `engagementScore` (0–100) is computed from recency, frequency, and monetary signals.
- **Churn prediction**: `churnRiskScore` is updated by the predictive segmentation pipeline.
- **Lifecycle stages**: `visitor → lead → customer → advocate → churned` lifecycle progression.

---

## Data Flow

### Campaign Send Pipeline

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Create  │────►│ Resolve  │────►│  Queue   │────►│  Send    │────►│  Track   │
│ Campaign │     │ Audience │     │ Messages │     │ via Comms│     │ Events   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │                │
     │  campaign_id   │  contact_ids   │  BullMQ jobs   │  provider_id   │  webhooks
     │  audience_id   │  suppression   │  throttling    │  delivery      │  opens/clicks
     │  messages[]    │  dedup check   │  rate limits   │  status        │  conversions
```

**Step-by-step:**

1. **Create Campaign** — User defines campaign with audience, channels, messages, and settings.
2. **Resolve Audience** — Audience segments are evaluated. Suppression lists and deduplication rules filter contacts. Result: list of qualified contacts per channel.
3. **Queue Messages** — `campaign_recipients` records are created in batches (1000/batch). Individual `send-message` jobs are enqueued to BullMQ with campaign throttle settings.
4. **Send via Comms** — BullMQ workers pull jobs, resolve message templates with personalisation data, and deliver via `@mcv/comms` (SendGrid for email, Twilio for SMS).
5. **Track Events** — Provider webhooks report delivery, opens, clicks, bounces, complaints. The `trackEvent()` method updates `campaign_recipients` and aggregates campaign stats.

### Attribution Pipeline

```
   Touchpoint 1          Touchpoint 2          Touchpoint 3         Conversion
  ┌──────────┐          ┌──────────┐          ┌──────────┐       ┌──────────┐
  │ Google Ad│─────────►│  Email   │─────────►│  Social  │──────►│ Purchase │
  │  Click   │          │  Open    │          │  Click   │       │  Event   │
  └──────────┘          └──────────┘          └──────────┘       └──────────┘
       │                     │                     │                   │
       ▼                     ▼                     ▼                   ▼
   touchpoints           touchpoints           touchpoints         conversions
       │                     │                     │                   │
       └─────────────────────┴─────────────────────┴───────────────────┘
                                       │
                                       ▼
                            ┌────────────────────┐
                            │  Attribution Engine │
                            │                     │
                            │  first_touch: 100%  │
                            │  linear: 33% each   │
                            │  time_decay: variable│
                            │  position: 40/20/40 │
                            └──────────┬──────────┘
                                       │
                                       ▼
                            ┌────────────────────┐
                            │ channel_performance │
                            │ (ROI/ROAS analysis) │
                            └────────────────────┘
```

### Social Publishing Pipeline

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────────┐
│  Draft   │───►│ Schedule │───►│   Publish    │───►│   Track      │
│  Post    │    │ (BullMQ) │    │  Per-Account  │    │  Engagements │
└──────────┘    └──────────┘    └──────────────┘    └──────────────┘
     │               │                │                    │
     │  content      │  delayed job   │  social_post_     │  social_
     │  media_urls   │  scheduled_at  │  executions       │  interactions
     │  account_ids  │               │  per platform     │  polling
```

### Automation Enrollment Flow

```
Trigger Event ──► Match Active Automations ──► Check Entry Conditions
                                                      │
                                                      ▼
                                               Create Enrollment
                                                      │
                                                      ▼
                                            ┌─────────────────┐
                                            │  Process Step    │
                                            │                  │
                                            │  action → exec   │
                                            │  delay → schedule│
                                            │  condition → eval│
                                            │  split → branch  │
                                            │  goal → monitor  │
                                            └────────┬────────┘
                                                     │
                                              nextStepId?
                                                     │
                                          ┌──────────┴──────────┐
                                          │ Yes                 │ No
                                          ▼                     ▼
                                    Queue next step      Complete enrollment
```

---

## Integration Points

### Internal Package Dependencies

| Package | Integration | Direction | Data Exchanged |
|---------|-------------|-----------|----------------|
| **@mcv/kernel** | Auth, DB, Crypto, Audit | Inbound | Session context, venture context, encryption keys, audit trail |
| **@mcv/comms** | Email/SMS/Push delivery | Outbound | Campaign messages, subscriber data, delivery requests |
| **@mcv/storage** | File storage and CDN | Outbound | Creative assets, email images, social media uploads |
| **@mcv/analytics** | Event ingestion, funnels | Bidirectional | Marketing events → analytics; funnel data → attribution |
| **@mcv/nexus** (CRM) | Contact resolution | Inbound | Contact profiles for audience resolution, segment membership |
| **@mcv/web3** | NFT certificates | Outbound | Certificate minting on course completion |

### External Provider Integrations

| Provider | Submodule | Integration Type | Purpose |
|----------|-----------|-----------------|---------|
| **Google Ads** | ads | OAuth + REST API | Campaign sync, insight aggregation |
| **Meta Ads** | ads | OAuth + REST API | Facebook/Instagram ad campaign management |
| **TikTok Ads** | ads | OAuth + REST API | TikTok ad campaign sync |
| **LinkedIn Ads** | ads | OAuth + REST API | LinkedIn campaign management |
| **Twitter Ads** | ads | OAuth + REST API | Twitter/X ad campaigns |
| **SendGrid** | email-campaigns | REST API + Webhooks | Email delivery, bounce/complaint callbacks |
| **Twilio** | sms | REST API + Webhooks | SMS/MMS delivery, inbound message receipt |
| **Facebook Graph** | social | OAuth + REST API | Page publishing, comments, messaging |
| **Instagram Graph** | social | OAuth + REST API | Post publishing, story creation |
| **Twitter/X API** | social | OAuth + REST API | Tweet publishing, mentions, DMs |
| **LinkedIn API** | social | OAuth + REST API | Post publishing, analytics |
| **TikTok API** | social | OAuth + REST API | Video publishing |
| **YouTube Data** | social | OAuth + REST API | Video publishing, analytics |
| **OpenRouter** | creative, content | REST API | AI content generation, brand voice briefs |
| **Mux** | education | REST API | Video hosting and streaming |

### Webhook Ingestion

```
Provider Webhook ──► /api/webhooks/growth/{provider}
                            │
                     ┌──────┴───────┐
                     │ HMAC Verify  │  (GROWTH_WEBHOOK_SECRET)
                     └──────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
         Email Events  SMS Events   Social Events
         (delivered,   (delivered,  (new comment,
          opened,       failed,     new mention,
          clicked,      inbound)    new DM)
          bounced,
          complained)
```

### Event Bus (Redpanda/Kafka)

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `growth.events` | EventTrackingService | Attribution, Analytics | Marketing event stream |
| `growth.campaign.status` | CampaignService | Analytics dashboard | Campaign lifecycle events |
| `growth.email.events` | Webhook handler | EmailSubscriberService | Bounce, complaint, delivery events |
| `growth.sms.events` | Webhook handler | SMSService | SMS delivery and inbound events |
| `growth.social.interactions` | Polling job | Social inbox | New comments, mentions, DMs |
| `growth.attribution.conversions` | Attribution engine | Analytics | Attributed conversion results |

---

## Performance

### Database Indexing Strategy

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `growth_marketing_events` | `(ventureId, contactId)` | B-tree | Fast event lookups per contact |
| `growth_marketing_events` | `(eventName, occurredAt)` | B-tree | Time-series queries for analytics |
| `growth_marketing_events` | `(sessionId)` | B-tree | Session reconstruction |
| `growth_campaigns` | `(ventureId, status)` | B-tree | Active campaign queries |
| `growth_campaigns` | `(scheduledAt)` | B-tree | Campaign scheduler polling |
| `growth_campaign_recipients` | `(campaignId, status)` | B-tree | Delivery tracking |
| `growth_campaign_recipients` | `(contactId)` | B-tree | Contact campaign history |
| `ad_insights` | `(adCampaignId, date)` | Unique | Upsert daily insights |
| `ad_insights` | `(date)` | B-tree | Date-range aggregations |
| `social_posts` | `(ventureId, scheduledAt)` | B-tree | Scheduled post polling |
| `social_interactions` | `(accountId, externalId)` | Unique | Dedup incoming interactions |
| `growth_affiliate_clicks` | `(visitorId)` | B-tree | Attribution cookie lookups |
| `growth_email_subscribers` | `(ventureId, email)` | B-tree | Subscriber dedup |
| `education.enrollments` | `(userId, courseId)` | Unique | Single enrollment per user |
| `growth_touchpoints` | `(contactId, timestamp)` | B-tree | Touchpoint chain lookups |
| `growth_sms_opt_outs` | `(phoneNumber)` | B-tree | Opt-out checks before send |

### Caching Strategy

| Cache Key Pattern | TTL | Purpose |
|-------------------|-----|---------|
| `growth:campaign:{id}:stats` | 60s | Campaign stats for dashboard reads (updated on every webhook) |
| `growth:segment:{id}:count` | 300s | Segment member counts (recalculated hourly) |
| `growth:ad:dashboard:{ventureId}` | 900s | Ad insights dashboard aggregation |
| `growth:social:metrics:{ventureId}` | 300s | Social media metrics |
| `growth:email:template:{id}:v{ver}` | 86400s | Compiled email template HTML |
| `growth:personalization:{ventureId}` | 300s | Active personalisation rules |
| `growth:sms:optout:{phone}` | 3600s | SMS opt-out status check |
| `growth:affiliate:fraud:{id}` | 600s | Affiliate fraud score |

### Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Campaign send throughput | 100k emails/hour | BullMQ worker pool + partitioned queue |
| Event ingestion | 10k events/sec | Batch inserts, write-ahead buffer |
| Segment recalculation | < 30s for 1M contacts | Materialised query with incremental refresh |
| Ad insight sync | < 5 min for all accounts | Parallel provider API calls, daily cron |
| Social post scheduling | ±10s accuracy | Polling interval with catch-up logic |
| Attribution computation | < 2s per conversion | Cached touchpoint chains, pre-indexed |
| Email template render | < 50ms | MJML compilation cached, merge tag substitution |
| API response (p95) | < 200ms | Redis caching, connection pooling, RLS-optimised queries |
| Dashboard load | < 1s | Pre-aggregated metrics, CDN-cached static assets |

---

## Scalability

### Horizontal Scaling

| Component | Scaling Strategy |
|-----------|-----------------|
| **Campaign workers** | BullMQ workers scale horizontally — add more worker processes to increase send throughput. Jobs are distributed via Redis-backed atomic dequeue. |
| **Event ingestion** | Redpanda partitioned by `ventureId` — consumer groups scale per partition. Batch inserts into PostgreSQL via write-ahead buffer. |
| **Social publishing** | One BullMQ worker per social account. Accounts are distributed across worker processes for parallel publishing. |
| **SEO crawling** | Configurable concurrency (`GROWTH_SEO_CRAWL_CONCURRENCY`). Workers can be added to the `growth:seo-audit` queue as needed. |
| **Ad sync** | Parallel provider API calls. Each account is processed independently. Sync interval is configurable. |

### Data Partitioning

| Strategy | Application |
|----------|-------------|
| **Venture isolation (RLS)** | Every table includes `ventureId`; Supabase RLS policies enforce tenant isolation at the database level. |
| **Time-based partitioning** | `growth_marketing_events` and `growth_affiliate_clicks` can be partitioned by month for high-volume ventures. |
| **Queue partitioning** | Campaign sends are partitioned by priority (high/normal/low). Each priority has its own BullMQ queue segment. |

### Capacity Planning

| Resource | Per-Venture Estimate | 9-Venture Total |
|----------|---------------------|-----------------|
| Marketing events/month | 1M–10M | 9M–90M |
| Email sends/month | 100k–1M | 900k–9M |
| SMS sends/month | 10k–100k | 90k–900k |
| Social posts/month | 100–500 | 900–4500 |
| Ad accounts | 2–5 | 18–45 |
| Affiliate links | 100–1000 | 900–9000 |
| Database size (projected Y1) | 5–50 GB | 45–450 GB |

---

## Error Handling

### Error Code Taxonomy

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `GROWTH_SEGMENT_NOT_FOUND` | 404 | Segment does not exist | Verify segment ID |
| `GROWTH_SEGMENT_INVALID_CONDITIONS` | 400 | Segment conditions malformed | Check field names and operators |
| `GROWTH_AUDIENCE_NOT_FOUND` | 404 | Audience does not exist | Verify audience ID |
| `GROWTH_CAMPAIGN_NOT_FOUND` | 404 | Campaign does not exist | Verify campaign ID |
| `GROWTH_CAMPAIGN_INVALID_STATUS` | 400 | Campaign status prevents operation | Check current status before action |
| `GROWTH_CAMPAIGN_NO_MESSAGES` | 400 | Campaign has no messages | Add at least one message |
| `GROWTH_CAMPAIGN_NO_AUDIENCE` | 400 | No audience configured | Set audienceId or segmentId |
| `GROWTH_TEMPLATE_NOT_FOUND` | 404 | Email template not found | Verify template ID |
| `GROWTH_TEMPLATE_RENDER_ERROR` | 500 | Template rendering failed | Check merge tag syntax |
| `GROWTH_SUBSCRIBER_ALREADY_EXISTS` | 409 | Email already subscribed | Update existing subscriber |
| `GROWTH_SUBSCRIBER_SUPPRESSED` | 400 | Email is on suppression list | Contact customer support |
| `GROWTH_SMS_OPT_OUT` | 400 | Phone number has opted out | Cannot send to opted-out numbers |
| `GROWTH_SMS_RATE_LIMITED` | 429 | Number daily/monthly limit reached | Wait for limit reset or use another number |
| `GROWTH_AFFILIATE_NOT_FOUND` | 404 | Affiliate not found | Verify affiliate ID |
| `GROWTH_AFFILIATE_SUSPENDED` | 403 | Affiliate is suspended | Review fraud score, contact admin |
| `GROWTH_REFERRAL_EXPIRED` | 400 | Referral code has expired | Generate a new code |
| `GROWTH_REFERRAL_LIMIT_REACHED` | 400 | Max rewards per referrer reached | Programme limit exceeded |
| `GROWTH_ATTRIBUTION_NO_TOUCHPOINTS` | 400 | No touchpoints in lookback window | Extend lookback or check tracking |
| `GROWTH_AD_ACCOUNT_DISCONNECTED` | 400 | Ad account OAuth expired | Re-authenticate the account |
| `GROWTH_AD_SYNC_FAILED` | 500 | Provider API sync error | Check provider status, retry |
| `GROWTH_SOCIAL_TOKEN_EXPIRED` | 401 | Social account token expired | Re-authenticate via OAuth |
| `GROWTH_SOCIAL_PUBLISH_FAILED` | 500 | Post publishing failed | Check platform status, retry |
| `GROWTH_SEO_CRAWL_FAILED` | 500 | Site crawl failed | Check site accessibility |
| `GROWTH_EDUCATION_ALREADY_ENROLLED` | 409 | User already enrolled in course | Check existing enrollment |
| `GROWTH_ABTEST_NOT_RUNNING` | 400 | Test is not in running state | Start the test first |
| `GROWTH_AUTOMATION_ALREADY_ENROLLED` | 409 | Contact already in automation | Enable re-entry or check status |

### Error Handling Patterns

```typescript
// Service-level error handling with typed errors
import { NotFoundError, ValidationError, ConflictError } from '@mcv/kernel';

class CampaignService {
  async schedule(campaignId: string, scheduledAt: Date): Promise<Campaign> {
    const campaign = await this.getById(campaignId);
    
    // Validation errors for business rule violations
    if (campaign.status !== 'draft') {
      throw new ValidationError('Only draft campaigns can be scheduled');
    }
    
    // Not found errors for missing dependencies
    const messages = await this.getMessages(campaignId);
    if (messages.length === 0) {
      throw new ValidationError('Campaign must have at least one message');
    }
    
    // Proceed with scheduling...
  }
}

// BullMQ worker error handling with retries
const campaignWorker = new Worker('campaign-send', async (job) => {
  try {
    await campaignService.processSend(job.data.campaignId);
  } catch (error) {
    if (error instanceof ProviderError && error.retryable) {
      throw error; // BullMQ will retry based on backoff config
    }
    // Non-retryable: log and move to failed
    logger.error('Campaign send failed permanently', { error, jobId: job.id });
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 10,
  limiter: { max: 100, duration: 1000 }, // 100 jobs/sec
  settings: {
    backoffStrategy: (attemptsMade) => Math.min(attemptsMade * 1000, 30000),
  },
});
```

### Retry Strategy

| Operation | Max Retries | Backoff | Dead Letter |
|-----------|-------------|---------|-------------|
| Campaign message send | 3 | Exponential (1s, 5s, 30s) | Failed recipients table |
| Ad insight sync | 5 | Linear (60s intervals) | Alert + manual retry |
| Social post publish | 3 | Exponential (5s, 30s, 5min) | Mark as failed |
| SMS delivery | 2 | Linear (30s) | Mark as undelivered |
| Webhook processing | 3 | Exponential (1s, 5s, 30s) | Dead letter queue |
| SEO page crawl | 2 | Linear (10s) | Skip page, note in audit |

---

## Observability

### Audit Events

All significant operations emit audit events via `@mcv/kernel/audit`:

| Event | Trigger | Data |
|-------|---------|------|
| `growth.segment.created` | New segment created | `{ segmentId, name, type, conditions }` |
| `growth.segment.recalculated` | Segment membership refreshed | `{ segmentId, previousCount, newCount }` |
| `growth.campaign.created` | Campaign created | `{ campaignId, name, type, channels }` |
| `growth.campaign.scheduled` | Campaign scheduled | `{ campaignId, scheduledAt }` |
| `growth.campaign.sent` | Campaign send initiated | `{ campaignId, recipientCount }` |
| `growth.campaign.paused` | Campaign paused | `{ campaignId, reason }` |
| `growth.campaign.completed` | Campaign finished sending | `{ campaignId, stats }` |
| `growth.automation.activated` | Automation went live | `{ automationId, triggerType }` |
| `growth.automation.enrolled` | Contact enrolled | `{ automationId, contactId }` |
| `growth.email.subscribed` | Email subscription | `{ email, listIds, source }` |
| `growth.email.unsubscribed` | Email unsubscription | `{ email, reason, listIds }` |
| `growth.email.bounced` | Email bounced | `{ email, bounceType, campaignId }` |
| `growth.sms.sent` | SMS sent | `{ messageId, toNumber, segments }` |
| `growth.sms.opted_out` | SMS opt-out received | `{ phoneNumber, source }` |
| `growth.affiliate.registered` | Affiliate signed up | `{ affiliateId, programId, email }` |
| `growth.affiliate.approved` | Affiliate approved | `{ affiliateId, approvedBy }` |
| `growth.affiliate.commission` | Commission recorded | `{ commissionId, amount, type }` |
| `growth.affiliate.payout` | Payout initiated | `{ payoutId, affiliateId, amount }` |
| `growth.referral.created` | Referral tracked | `{ referralId, referrerId, refereeId }` |
| `growth.referral.rewarded` | Referral reward issued | `{ referralId, rewardType, value }` |
| `growth.attribution.conversion` | Conversion attributed | `{ conversionId, modelId, channels }` |
| `growth.ad.account_connected` | Ad account linked | `{ adAccountId, provider }` |
| `growth.ad.synced` | Ad data synced | `{ adAccountId, campaignsCount }` |
| `growth.social.account_connected` | Social account linked | `{ accountId, provider, username }` |
| `growth.social.post_published` | Social post published | `{ postId, accountIds, platform }` |
| `growth.social.post_failed` | Social post failed | `{ postId, accountId, error }` |
| `growth.creative.asset_created` | Asset uploaded to DAM | `{ assetId, type, name }` |
| `growth.creative.voice_created` | Brand voice created | `{ voiceId, name }` |
| `growth.education.course_published` | Course published | `{ courseId, title }` |
| `growth.education.enrolled` | User enrolled in course | `{ userId, courseId }` |
| `growth.education.completed` | User completed course | `{ userId, courseId, xpAwarded }` |
| `growth.abtest.started` | A/B test started | `{ testId, variants, trafficPct }` |
| `growth.abtest.completed` | A/B test concluded | `{ testId, winner, confidence }` |

### Metrics & Monitoring

| Metric | Type | Labels | Alert Threshold |
|--------|------|--------|-----------------|
| `growth_campaign_send_total` | Counter | `venture`, `channel`, `status` | — |
| `growth_campaign_send_latency` | Histogram | `venture`, `channel` | p95 > 30s |
| `growth_event_ingestion_rate` | Gauge | `venture` | < 100/min (low traffic alert) |
| `growth_queue_depth` | Gauge | `queue_name` | > 10,000 (backlog alert) |
| `growth_queue_failed_jobs` | Counter | `queue_name` | > 100/hour |
| `growth_email_bounce_rate` | Gauge | `venture`, `domain` | > 5% |
| `growth_email_complaint_rate` | Gauge | `venture`, `domain` | > 0.1% |
| `growth_sms_delivery_rate` | Gauge | `venture` | < 95% |
| `growth_ad_sync_duration` | Histogram | `provider` | > 300s |
| `growth_social_publish_failures` | Counter | `provider` | > 5/hour |
| `growth_affiliate_fraud_score` | Gauge | `affiliate_id` | > 80 |
| `growth_attribution_compute_time` | Histogram | `model_type` | > 5s |

### Structured Logging

```typescript
// All growth operations use structured logging with consistent context
import { logger } from '@mcv/kernel/logger';

logger.info('Campaign send initiated', {
  module: 'growth',
  submodule: 'campaigns',
  operation: 'sendNow',
  campaignId: campaign.id,
  ventureId: ctx.venture.id,
  recipientCount: recipients.length,
  channels: campaign.channels,
});

logger.error('Social post publish failed', {
  module: 'growth',
  submodule: 'social',
  operation: 'publishPost',
  postId: post.id,
  accountId: account.id,
  provider: account.provider,
  error: error.message,
  stack: error.stack,
});
```

---

## Security

### Authentication & Authorisation

All growth operations enforce a three-layer security model:

1. **Authenticated session** — Every tRPC procedure uses `protectedProcedure`, requiring a valid user session.
2. **Venture context** — `ctx.session.ventureId` must be set. All queries are scoped to the current venture.
3. **Row-Level Security** — Supabase RLS policies on every table ensure data isolation even if application-level checks fail.

```typescript
// Example: all tRPC procedures enforce auth
const marketingRouter = router({
  ads: router({
    connectAccount: protectedProcedure
      .input(z.object({ /* validated schema */ }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.session?.ventureId) throw new Error('No venture context');
        // Service call scoped to venture...
      }),
  }),
});
```

### Data Protection

| Data Type | Protection Method |
|-----------|-------------------|
| Ad platform access tokens | AES-256-GCM encryption at rest via `@mcv/kernel/crypto` |
| Social account OAuth tokens | AES-256-GCM encryption at rest |
| Affiliate payout details | AES-256-GCM encryption at rest |
| Subscriber email addresses | Indexed with HMAC for lookup, stored plaintext for delivery |
| IP addresses (marketing events) | Retained 90 days, then hashed |
| SMS opt-out numbers | Stored in compliance-protected suppression list |
| Visitor tracking data | Anonymised after 365 days per GDPR retention policy |

### Token Encryption Pattern

```typescript
import { encrypt, decrypt } from '@mcv/kernel/crypto';

// On account connection — encrypt tokens before storage
const encryptedAccess = await encrypt(input.accessToken, ventureEncryptionKey);
const encryptedRefresh = input.refreshToken
  ? await encrypt(input.refreshToken, ventureEncryptionKey)
  : null;

await db.insert(socialAccounts).values({
  ...input,
  accessToken: encryptedAccess,
  refreshToken: encryptedRefresh,
});

// On API call — decrypt tokens for provider requests
const account = await db.query.socialAccounts.findFirst({ where: ... });
const accessToken = await decrypt(account.accessToken, ventureEncryptionKey);
```

### Webhook Verification

```typescript
import { createHmac } from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

### Compliance Framework

| Regulation | Implementation |
|------------|----------------|
| **CAN-SPAM** | Mandatory unsubscribe links in every marketing email, physical address inclusion |
| **GDPR** | Double opt-in support, consent text recording, data deletion capability, 365-day anonymisation |
| **TCPA** | SMS STOP keyword processing, time-of-day sending windows, DNC list checking |
| **A2P 10DLC** | Phone number registration with brand and campaign IDs for US carrier compliance |
| **CCPA** | Data deletion support, suppression list management, do-not-sell flags |
| **Cookie Consent** | Attribution cookie duration configurable per programme, consent-gated tracking |

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROWTH_DB_URL` | Yes | — | PostgreSQL connection string |
| `GROWTH_REDIS_URL` | Yes | — | Redis URL for BullMQ and caching |
| `GROWTH_ENCRYPTION_KEY` | Yes | — | AES-256 key for token encryption |
| `GROWTH_WEBHOOK_SECRET` | Yes | — | HMAC secret for webhook verification |
| `SENDGRID_API_KEY` | Yes | — | SendGrid API key |
| `TWILIO_ACCOUNT_SID` | Yes | — | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Yes | — | Twilio auth token |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | No | — | Google Ads API developer token |
| `META_ADS_APP_ID` | No | — | Meta Ads app ID |
| `TIKTOK_ADS_APP_ID` | No | — | TikTok Ads app ID |
| `LINKEDIN_ADS_CLIENT_ID` | No | — | LinkedIn Ads OAuth client ID |
| `FACEBOOK_APP_ID` | No | — | Facebook Graph API app ID |
| `TWITTER_API_KEY` | No | — | Twitter/X API key |
| `YOUTUBE_API_KEY` | No | — | YouTube Data API key |
| `MUX_TOKEN_ID` | No | — | Mux video token ID |
| `MUX_TOKEN_SECRET` | No | — | Mux video token secret |
| `GROWTH_EVENT_BATCH_SIZE` | No | `1000` | Batch size for event ingestion |
| `GROWTH_CAMPAIGN_THROTTLE_MAX` | No | `10000` | Max messages/hour per campaign |
| `GROWTH_SEO_CRAWL_CONCURRENCY` | No | `5` | Concurrent SEO page crawls |
| `GROWTH_AD_SYNC_INTERVAL_MINUTES` | No | `360` | Ad insight sync interval |
| `GROWTH_SOCIAL_POLL_INTERVAL_SECONDS` | No | `60` | Social interaction poll interval |
| `GROWTH_ATTRIBUTION_LOOKBACK_DAYS` | No | `30` | Default attribution lookback |

---

*@mcv/growth — Growth & Marketing Domain*
