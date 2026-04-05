# @mcv/growth — Growth & Marketing Automation Module

**Parent Package:** `@mcv/growth`
**Tier:** 5 (Domain — Publishable)
**Classification:** PUBLISHABLE
**Version:** 1.0.0
**Last Updated:** February 9, 2026

---

## Purpose

The `growth` module is a comprehensive growth and marketing automation platform that powers every customer-acquisition and engagement workflow within MCV ventures. It unifies 13 interconnected submodules — **ads, affiliates, attribution, content, creative, education, email-campaigns, marketing, referrals, seo, sms, social, and website** — into a cohesive system that orchestrates multi-channel campaigns, tracks attribution across touchpoints, manages affiliate and referral programs, automates email and SMS outreach, schedules social media, optimizes SEO, hosts educational content via an LMS, and builds landing pages.

**This is the single entry point for all growth, marketing, and customer-acquisition operations across the MCV ecosystem.**

### Why This Module Exists

Modern ventures operate across dozens of channels — paid ads, organic search, email, SMS, social media, affiliates, referrals, content marketing, and educational funnels. Without a unified platform, data becomes fragmented, attribution is impossible, and marketing spend is wasted. `@mcv/growth` solves this by providing:

- **Unified Customer Profiles** — A single view merging identity, behavioural, and web3 data across all touchpoints
- **Multi-Channel Orchestration** — Campaign management spanning email, SMS, push, social, and in-app channels
- **Full-Funnel Attribution** — Multi-touch attribution models that connect ad spend to revenue
- **Automated Workflows** — Visual journey builders, drip sequences, and event-triggered automations
- **Revenue Programmes** — Affiliate and referral systems with multi-tier commissions and fraud detection
- **Content Pipeline** — From ideation through creation, scheduling, and performance tracking
- **Web3-Native Features** — Wallet-based segmentation, NFT certificate rewards, token-gated content

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// MARKETING — Core Infrastructure
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SegmentService,            // Create and manage audience segments
  EventTrackingService,      // Track marketing events across channels
  PersonalizationService,    // Serve personalized content by audience
  ABTestService,             // A/B and multivariate testing engine
  segmentService,            // Singleton segment service instance
  eventTrackingService,      // Singleton event tracking instance
  personalizationService,    // Singleton personalization instance
  abTestService,             // Singleton A/B test instance
} from './marketing/service';

// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGNS — Multi-Channel Orchestration
// ═══════════════════════════════════════════════════════════════════════════════

export {
  CampaignService,           // Create, schedule, send campaigns
  AutomationService,         // Build & run automation workflows
  campaignService,           // Singleton campaign instance
  automationService,         // Singleton automation instance
} from './campaigns/service';

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL CAMPAIGNS — Email Marketing
// ═══════════════════════════════════════════════════════════════════════════════

export {
  EmailTemplateService,      // MJML template management & rendering
  EmailSubscriberService,    // Subscription lifecycle, bounces, opt-in
  emailTemplateService,      // Singleton template instance
  emailSubscriberService,    // Singleton subscriber instance
} from './email-campaigns/service';

// ═══════════════════════════════════════════════════════════════════════════════
// SMS — Messaging & Compliance
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SMSService,                // Send SMS/MMS, manage conversations
  smsService,                // Singleton SMS instance
} from './sms/service';

// ═══════════════════════════════════════════════════════════════════════════════
// AFFILIATES — Partner Program Management
// ═══════════════════════════════════════════════════════════════════════════════

export {
  AffiliateService,          // Programme setup, commissions, payouts
  affiliateService,          // Singleton affiliate instance
} from './affiliates/service';

// ═══════════════════════════════════════════════════════════════════════════════
// REFERRALS — Customer Referral Programmes
// ═══════════════════════════════════════════════════════════════════════════════

export {
  ReferralService,           // Referral codes, rewards, tracking
  referralService,           // Singleton referral instance
} from './referrals/service';

// ═══════════════════════════════════════════════════════════════════════════════
// ATTRIBUTION — Multi-Touch Attribution
// ═══════════════════════════════════════════════════════════════════════════════

export {
  AttributionService,        // Touchpoint tracking & model computation
  attributionService,        // Singleton attribution instance
} from './attribution/service';

// ═══════════════════════════════════════════════════════════════════════════════
// ADS — Advertising Platform Integrations
// ═══════════════════════════════════════════════════════════════════════════════

export {
  AdManagerService,          // Connect accounts, sync campaigns & insights
  adManagerService,          // Singleton ad manager instance
} from './ads/service';

// ═══════════════════════════════════════════════════════════════════════════════
// SEO — Search Engine Optimization
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SEOService,                // Site audits, keyword tracking, backlinks
  seoService,                // Singleton SEO instance
} from './seo/service';

// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL — Social Media Management
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SocialConnectorService,    // Connect accounts, publish, schedule
  socialConnectorService,    // Singleton social connector instance
} from './social/service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT — Content Marketing Pipeline
// ═══════════════════════════════════════════════════════════════════════════════

export {
  ContentService,            // Calendar, briefs, workflow management
  contentService,            // Singleton content instance
} from './content/service';

// ═══════════════════════════════════════════════════════════════════════════════
// CREATIVE — Asset & Brand Management
// ═══════════════════════════════════════════════════════════════════════════════

export {
  CreativeService,           // Brand voices, assets, DAM
  creativeService,           // Singleton creative instance
} from './creative/service';

// ═══════════════════════════════════════════════════════════════════════════════
// EDUCATION — Learning Management System
// ═══════════════════════════════════════════════════════════════════════════════

export {
  EducationService,          // Courses, lessons, enrolments, certificates
  educationService,          // Singleton education instance
} from './education/service';

// ═══════════════════════════════════════════════════════════════════════════════
// WEBSITE — Landing Page & Site Builder
// ═══════════════════════════════════════════════════════════════════════════════

export {
  WebsiteService,            // Pages, blocks, forms, domains
  websiteService,            // Singleton website instance
} from './website/service';

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS — Unified Marketing Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

export {
  MarketingAnalyticsService, // Dashboard metrics, timeline, performance
  marketingAnalyticsService, // Singleton analytics instance
} from './analytics/service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useCampaigns } from './client/hooks/use-campaigns';
export { useSegments } from './client/hooks/use-segments';
export { useEmailTemplates } from './client/hooks/use-email-templates';
export { useSocialAccounts } from './client/hooks/use-social-accounts';
export { useAdAccounts } from './client/hooks/use-ad-accounts';
export { useAffiliates } from './client/hooks/use-affiliates';
export { useReferrals } from './client/hooks/use-referrals';
export { useAttribution } from './client/hooks/use-attribution';
export { useContentCalendar } from './client/hooks/use-content-calendar';
export { useCreativeAssets } from './client/hooks/use-creative-assets';
export { useSEODashboard } from './client/hooks/use-seo-dashboard';
export { useMarketingDashboard } from './client/hooks/use-marketing-dashboard';
export { useEducation } from './client/hooks/use-education';
export { useWebsiteBuilder } from './client/hooks/use-website-builder';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { CampaignBuilder } from './client/components/campaign-builder';
export { SegmentBuilder } from './client/components/segment-builder';
export { JourneyCanvas } from './client/components/journey-canvas';
export { EmailEditor } from './client/components/email-editor';
export { SMSComposer } from './client/components/sms-composer';
export { SocialScheduler } from './client/components/social-scheduler';
export { SocialInbox } from './client/components/social-inbox';
export { AdDashboard } from './client/components/ad-dashboard';
export { AffiliateDashboard } from './client/components/affiliate-dashboard';
export { ReferralWidget } from './client/components/referral-widget';
export { AttributionReport } from './client/components/attribution-report';
export { ContentCalendarView } from './client/components/content-calendar-view';
export { CreativeLibrary } from './client/components/creative-library';
export { SEOAuditPanel } from './client/components/seo-audit-panel';
export { MarketingDashboard } from './client/components/marketing-dashboard';
export { CoursePlayer } from './client/components/course-player';
export { WebsiteEditor } from './client/components/website-editor';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  CAMPAIGN_STATUSES,
  MARKETING_CHANNELS,
  AD_PROVIDERS,
  SOCIAL_PROVIDERS,
  SMS_PROVIDERS,
  ATTRIBUTION_MODELS,
  SEGMENT_OPERATORS,
  EMAIL_CATEGORIES,
  BOUNCE_TYPES,
  COMMISSION_TYPES,
  REFERRAL_REWARD_TYPES,
  SEO_AUDIT_RULES,
  EDUCATION_DIFFICULTY_LEVELS,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Marketing core
  Segment, CreateSegmentInput, SegmentCondition,
  Audience, CreateAudienceInput,
  MarketingEvent,
  PersonalizationVariation, PersonalizationResult,
  ABTest, ABTestVariant, ABTestResults,

  // Campaign types
  Campaign, CampaignSettings, CampaignMessage,
  Automation, AutomationStep, AutomationTrigger,
  Journey, JourneyCanvas, JourneyNode, JourneyEdge,
  TriggerCondition, DynamicContentBlock,

  // Email types
  EmailTemplate, EmailSubscriber, EmailList, EmailBounce,
  EmailSendingDomain,

  // SMS types
  SMSMessage, SMSTemplate, SMSPhoneNumber,
  SMSOptOut, SMSConversation,

  // Affiliate types
  AffiliateProgram, Affiliate, AffiliateLink,
  AffiliateClick, AffiliateCommission, AffiliatePayout,
  CommissionTier,

  // Referral types
  ReferralProgram, ReferralCode, Referral, ReferralReward,

  // Attribution types
  AttributionModel, TouchPoint, Conversion,
  AttributionModelConfig, AttributionResult,

  // Ad types
  AdAccount, AdCampaign, AdInsight,
  AdProvider, AdAccountStatus, AdCampaignStatus,

  // SEO types
  SEOAudit, Keyword, Backlink, SiteHealth,

  // Social types
  SocialAccount, SocialPost, SocialPostExecution,
  SocialInteraction, SocialProvider, SocialPostStatus,

  // Content types
  ContentBrief, ContentAsset, BrandVoice,

  // Education types
  Course, Lesson, EducationModule, Enrollment,

  // Website types
  Site, Page, Block, Form, Domain,

  // Analytics types
  DashboardMetrics, TimelineDataPoint,
  CampaignPerformance, SocialMetrics,

  // CRM/Profile types
  GrowthProfile, GrowthSegment, GrowthSegmentMember,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            @mcv/growth — GROWTH & MARKETING PLATFORM                      │
│                                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                               ENTRY POINTS                                           │ │
│  │                                                                                      │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌──────────┐│ │
│  │  │ Admin UI    │  │ Public API  │  │  Webhooks   │  │  Cron Jobs   │  │ Widgets  ││ │
│  │  │ Dashboard   │  │ /api/growth │  │  Providers  │  │  Scheduled   │  │ Embedded ││ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  └─────┬────┘│ │
│  │         └─────────────────┴────────────────┴────────────────┴────────────────┘     │ │
│  │                                         │                                          │ │
│  └─────────────────────────────────────────┼──────────────────────────────────────────┘ │
│                                            │                                            │
│  ┌─────────────────────────────────────────▼──────────────────────────────────────────┐ │
│  │                          tRPC ROUTER LAYER (marketing.router.ts)                    │ │
│  │                                                                                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │ │
│  │  │ social.*     │  │  ads.*       │  │ creative.*   │  │ analytics.*  │           │ │
│  │  │ listAccounts │  │ listAccounts │  │ listAssets   │  │ getDashboard │           │ │
│  │  │ connect      │  │ connect      │  │ createAsset  │  │ getTimeline  │           │ │
│  │  │ postContent  │  │ createCamp   │  │ brandVoices  │  │ getCampaigns │           │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘           │ │
│  └─────────────────────────────────────────┬──────────────────────────────────────────┘ │
│                                            │                                            │
│  ┌─────────────────────────────────────────▼──────────────────────────────────────────┐ │
│  │                          SERVICE LAYER (13 Submodules)                               │ │
│  │                                                                                      │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │ │
│  │  │ marketing  │ │ campaigns  │ │   email    │ │    sms     │ │ affiliates │       │ │
│  │  │            │ │            │ │ campaigns  │ │            │ │            │       │ │
│  │  │ Segments   │ │ Orchestr.  │ │ Templates  │ │ A2P 10DLC  │ │ Multi-tier │       │ │
│  │  │ Audiences  │ │ Journeys   │ │ Subscribers│ │ Opt-outs   │ │ Commissions│       │ │
│  │  │ Events     │ │ Automations│ │ Bounces    │ │ Threads    │ │ Payouts    │       │ │
│  │  │ A/B Tests  │ │ BullMQ     │ │ DKIM/SPF   │ │ Compliance │ │ Fraud Det. │       │ │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘       │ │
│  │                                                                                      │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │ │
│  │  │ referrals  │ │attribution │ │    ads     │ │    seo     │ │   social   │       │ │
│  │  │            │ │            │ │            │ │            │ │            │       │ │
│  │  │ Viral Loop │ │ Multi-touch│ │ Google Ads │ │ Crawl/Audit│ │ 6 Platforms│       │ │
│  │  │ Rewards    │ │ Models     │ │ Meta Ads   │ │ Keywords   │ │ Scheduling │       │ │
│  │  │ Codes      │ │ Time Decay │ │ TikTok Ads │ │ Backlinks  │ │ Inbox      │       │ │
│  │  │ Tracking   │ │ ROI Calc   │ │ LinkedIn   │ │ Rankings   │ │ Analytics  │       │ │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘       │ │
│  │                                                                                      │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐                                      │ │
│  │  │  content   │ │  creative  │ │ education  │  ┌────────────┐                      │ │
│  │  │            │ │            │ │            │  │  website   │                      │ │
│  │  │ Calendar   │ │ Brand Voice│ │ Courses    │  │            │                      │ │
│  │  │ Briefs     │ │ DAM Assets │ │ Modules    │  │ Pages      │                      │ │
│  │  │ Workflow   │ │ Embeddings │ │ Lessons    │  │ Blocks     │                      │ │
│  │  │ Pipeline   │ │ AI Prompts │ │ NFT Certs  │  │ Forms      │                      │ │
│  │  └────────────┘ └────────────┘ └────────────┘  └────────────┘                      │ │
│  └──────────────────────────────────────────────────────────────────────────────────────┘ │
│                                            │                                              │
│                 ┌──────────────────────────┼──────────────────────────┐                   │
│                 │                          │                          │                   │
│                 ▼                          ▼                          ▼                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │  @mcv/comms         │  │  @mcv/storage        │  │  @mcv/analytics     │              │
│  │                     │  │                      │  │                     │              │
│  │  Email (SendGrid)   │  │  Files & Assets      │  │  Event Ingestion    │              │
│  │  SMS (Twilio)       │  │  CDN Delivery        │  │  Funnel Tracking    │              │
│  │  Push Notifications │  │  Signed URLs         │  │  Real-Time Streams  │              │
│  └─────────────────────┘  └──────────────────────┘  └─────────────────────┘              │
│                 │                          │                          │                   │
│                 ▼                          ▼                          ▼                   │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            DATABASE LAYER (PostgreSQL)                              │   │
│  │                                                                                    │   │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐                   │   │
│  │  │  growth schema   │ │ marketing schema │ │ education schema │                   │   │
│  │  │                  │ │                  │ │                  │                   │   │
│  │  │ profiles         │ │ campaigns        │ │ courses          │                   │   │
│  │  │ segments         │ │ messages         │ │ modules          │                   │   │
│  │  │ segment_members  │ │ sequences        │ │ lessons          │                   │   │
│  │  └──────────────────┘ └──────────────────┘ │ enrollments      │                   │   │
│  │                                             └──────────────────┘                   │   │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐                   │   │
│  │  │ public tables    │ │ public tables    │ │ public tables    │                   │   │
│  │  │                  │ │                  │ │                  │                   │   │
│  │  │ ad_accounts      │ │ social_accounts  │ │ brand_voices     │                   │   │
│  │  │ ad_campaigns     │ │ social_posts     │ │ content_assets   │                   │   │
│  │  │ ad_insights      │ │ social_executs   │ │ content_briefs   │                   │   │
│  │  │                  │ │ social_interact  │ │                  │                   │   │
│  │  └──────────────────┘ └──────────────────┘ └──────────────────┘                   │   │
│  │                                                                                    │   │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐ │   │
│  │  │  growth_* spec tables (from 01-PACKAGE-SPEC.md)                               │ │   │
│  │  │                                                                               │ │   │
│  │  │  segments · audiences · marketing_events · personalization_rules · ab_tests   │ │   │
│  │  │  campaigns · campaign_messages · campaign_recipients · automations            │ │   │
│  │  │  email_templates · email_domains · email_subscribers · email_lists            │ │   │
│  │  │  sms_phone_numbers · sms_templates · sms_messages · sms_opt_outs             │ │   │
│  │  │  affiliate_programs · affiliates · affiliate_links · affiliate_commissions    │ │   │
│  │  │  referral_programs · referral_codes · referrals · referral_rewards            │ │   │
│  │  │  attribution_models · touchpoints · conversions · channel_performance         │ │   │
│  │  └──────────────────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                                    │   │
│  └────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                           │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         EXTERNAL PROVIDER INTEGRATIONS                               │   │
│  │                                                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ Google   │ │ Meta     │ │ TikTok   │ │ LinkedIn │ │ Twitter  │ │ SendGrid │   │   │
│  │  │ Ads API  │ │ Ads API  │ │ Ads API  │ │ Ads API  │ │ Ads API  │ │ Email    │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │                                                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ Twilio   │ │ Facebook │ │Instagram │ │ YouTube  │ │ OpenAI   │ │ Mux      │   │   │
│  │  │ SMS/MMS  │ │ Graph    │ │ Graph    │ │ Data API │ │ Embedds  │ │ Video    │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │                                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow — Campaign Send Pipeline

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Create  │────▶│ Resolve  │────▶│  Queue   │────▶│  Send    │────▶│  Track   │
│ Campaign │     │ Audience │     │ Messages │     │ via Comms│     │ Events   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │                │
     │  campaign_id   │  contact_ids   │  BullMQ jobs   │  provider_id   │  webhooks
     │  audience_id   │  suppression   │  throttling    │  delivery      │  opens/clicks
     │  messages[]    │  dedup check   │  rate limits   │  status        │  conversions
     │                │                │                │                │
     ▼                ▼                ▼                ▼                ▼
  campaigns      segments/       campaign_         @mcv/comms       campaign_
  table          audiences       recipients        (SendGrid,       recipients
                                 (queued)          Twilio)          (delivered)
```

### Data Flow — Attribution Pipeline

```
   Touchpoint 1          Touchpoint 2          Touchpoint 3         Conversion
  ┌──────────┐          ┌──────────┐          ┌──────────┐       ┌──────────┐
  │ Google Ad│────────▶ │  Email   │────────▶ │  Social  │─────▶ │ Purchase │
  │ Click    │          │  Open    │          │  Click   │       │ Event    │
  └──────────┘          └──────────┘          └──────────┘       └──────────┘
       │                     │                     │                   │
       ▼                     ▼                     ▼                   ▼
  touchpoints           touchpoints           touchpoints         conversions
  table                 table                 table               table
       │                     │                     │                   │
       └─────────────────────┴─────────────────────┴───────────────────┘
                                       │
                                       ▼
                            ┌──────────────────┐
                            │  Attribution     │
                            │  Model Engine    │
                            │                  │
                            │  first_touch: 40%│
                            │  linear: 33% ea  │
                            │  last_touch: 100%│
                            │  time_decay: var │
                            │  position: U-shp │
                            └──────────────────┘
                                       │
                                       ▼
                            ┌──────────────────┐
                            │ channel_performa │
                            │ nce (ROI/ROAS)   │
                            └──────────────────┘
```

---

## Submodule Overview

| # | Submodule | Purpose | Key Tables | Key Services |
|---|-----------|---------|------------|--------------|
| 1 | **marketing** | Core segmentation, events, A/B testing, personalization | `growth_segments`, `growth_audiences`, `growth_marketing_events`, `growth_ab_tests` | `SegmentService`, `EventTrackingService`, `PersonalizationService`, `ABTestService` |
| 2 | **campaigns** | Multi-channel campaign orchestration & automations | `growth_campaigns`, `growth_campaign_messages`, `growth_campaign_recipients`, `growth_automations` | `CampaignService`, `AutomationService` |
| 3 | **email-campaigns** | Email templates, subscribers, domains, bounces | `growth_email_templates`, `growth_email_subscribers`, `growth_email_lists`, `growth_email_domains` | `EmailTemplateService`, `EmailSubscriberService` |
| 4 | **sms** | SMS/MMS messaging, A2P compliance, conversations | `growth_sms_phone_numbers`, `growth_sms_messages`, `growth_sms_opt_outs`, `growth_sms_conversations` | `SMSService` |
| 5 | **affiliates** | Multi-tier affiliate programmes, commissions, payouts | `growth_affiliate_programs`, `growth_affiliates`, `growth_affiliate_links`, `growth_affiliate_commissions` | `AffiliateService` |
| 6 | **referrals** | Customer referral programmes, codes, rewards | `growth_referral_programs`, `growth_referral_codes`, `growth_referrals`, `growth_referral_rewards` | `ReferralService` |
| 7 | **attribution** | Multi-touch attribution models, conversion tracking | `growth_attribution_models`, `growth_touchpoints`, `growth_conversions` | `AttributionService` |
| 8 | **ads** | Ad platform integrations (Google, Meta, TikTok, LinkedIn, Twitter) | `ad_accounts`, `ad_campaigns`, `ad_insights` | `AdManagerService` |
| 9 | **seo** | Site audits, keyword tracking, backlink monitoring | `growth_seo_audits`, `growth_keywords`, `growth_backlinks` | `SEOService` |
| 10 | **social** | Multi-platform social media management & inbox | `social_accounts`, `social_posts`, `social_post_executions`, `social_interactions` | `SocialConnectorService` |
| 11 | **content** | Content marketing calendar, briefs, workflow pipeline | `content_briefs`, `content_assets`, `brand_voices` | `ContentService`, `CreativeService` |
| 12 | **creative** | Brand voice management, digital asset library | `brand_voices`, `content_assets` | `CreativeService` |
| 13 | **education** | LMS with courses, modules, lessons, NFT certificates | `education.courses`, `education.modules`, `education.lessons`, `education.enrollments` | `EducationService` |

---

## Submodule 1: marketing — Core Infrastructure

### Purpose

Core marketing infrastructure providing audience segmentation, event tracking, personalization engine, and A/B testing capabilities that power all other growth modules. Every campaign, email, SMS, and social post relies on segments and audiences defined here.

### Core Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SEGMENT
// ═══════════════════════════════════════════════════════════════════════════════

interface Segment {
  id: string;
  ventureId: string;
  name: string;
  description?: string;
  type: 'static' | 'dynamic' | 'predictive';

  /** Dynamic segment conditions */
  conditions?: SegmentCondition[];

  /** Static segment member IDs */
  memberIds?: string[];

  /** Predictive model reference */
  modelId?: string;
  predictionThreshold?: number;

  memberCount: number;
  lastCalculatedAt?: Date;
  isActive: boolean;
  usedInCampaigns: number;
}

interface SegmentCondition {
  field: string;
  operator:
    | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
    | 'contains' | 'not_contains'
    | 'starts_with' | 'ends_with'
    | 'in' | 'not_in'
    | 'within' | 'before' | 'after'
    | 'is_set' | 'is_not_set';
  value: string | number | boolean | string[];
  logicalOperator?: 'AND' | 'OR';
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIENCE
// ═══════════════════════════════════════════════════════════════════════════════

interface Audience {
  id: string;
  ventureId: string;
  name: string;
  description?: string;

  /** Segment inclusion/exclusion */
  includeSegmentIds: string[];
  excludeSegmentIds: string[];

  additionalFilters?: SegmentCondition[];
  suppressionListId?: string;
  globalSuppression: boolean;

  estimatedSize: number;
  lastEstimatedAt?: Date;
  preferredChannels: string[];
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETING EVENT
// ═══════════════════════════════════════════════════════════════════════════════

interface MarketingEvent {
  id: string;
  ventureId: string;
  eventName: string;
  eventCategory?: string;  // pageview, click, conversion, custom

  contactId?: string;
  anonymousId?: string;
  sessionId?: string;

  channel?: string;         // web, email, sms, push, social
  source?: string;
  medium?: string;
  campaign?: string;

  properties?: Record<string, unknown>;

  // UTM parameters
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;

  // Device / Location
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  country?: string;
  region?: string;
  city?: string;

  // Page context
  pageUrl?: string;
  pageTitle?: string;
  pagePath?: string;

  occurredAt: Date;
  processedAt?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// A/B TEST
// ═══════════════════════════════════════════════════════════════════════════════

interface ABTest {
  id: string;
  ventureId: string;
  name: string;
  description?: string;
  hypothesis?: string;

  testType: string;           // page, component, email, campaign
  targetId?: string;

  variants: ABTestVariant[];
  controlVariantId?: string;
  trafficPercentage: number;  // 0-100

  primaryGoal: string;        // conversion, revenue, engagement
  primaryGoalEvent?: string;
  secondaryGoals?: string[];

  confidenceLevel: number;    // default: 95
  minimumSampleSize?: number;

  startDate?: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';

  winnerVariantId?: string;
  results?: ABTestResults;
}

interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
  weight: number;
  content: Record<string, unknown>;
  impressions: number;
  conversions: number;
  revenue?: number;
}

interface ABTestResults {
  winner?: string;
  confidence: number;
  lift: number;
  pValue: number;
  sampleSize: number;
  duration: number;           // days
  variantStats: Record<string, {
    impressions: number;
    conversions: number;
    conversionRate: number;
    revenue?: number;
    revenuePerVisitor?: number;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

interface PersonalizationVariation {
  id: string;
  name?: string;
  weight: number;
  content: Record<string, unknown>;
  impressions?: number;
  conversions?: number;
}

interface PersonalizationResult {
  ruleId: string;
  variationId: string;
  content: Record<string, unknown>;
}
```

### Service API

```typescript
class SegmentService {
  create(input: CreateSegmentInput): Promise<Segment>;
  recalculateSegment(segmentId: string): Promise<number>;
  isContactInSegment(contactId: string, segmentId: string): Promise<boolean>;
  getSegmentMembers(segmentId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ members: Contact[]; total: number }>;
}

class EventTrackingService {
  track(event: Partial<MarketingEvent>): Promise<void>;
  identify(anonymousId: string, contactId: string): Promise<void>;
  getContactEvents(contactId: string, options?: {
    limit?: number;
    eventNames?: string[];
  }): Promise<MarketingEvent[]>;
}

class PersonalizationService {
  getPersonalization(
    contactId: string | null,
    targetType: string,
    targetId?: string,
    context?: Record<string, unknown>,
  ): Promise<PersonalizationResult | null>;
  trackConversion(ruleId: string, variationId: string): Promise<void>;
}

class ABTestService {
  create(input: CreateABTestInput): Promise<ABTest>;
  start(testId: string): Promise<ABTest>;
  getVariant(testId: string, visitorId: string): Promise<ABTestVariant | null>;
  trackConversion(testId: string, visitorId: string, revenue?: number): Promise<void>;
  calculateResults(testId: string): Promise<ABTestResults>;
}
```

---

## Submodule 2: campaigns — Multi-Channel Orchestration

### Purpose

Multi-channel campaign orchestration supporting one-time blasts, drip sequences, triggered automations, and visual customer journey builders. Uses BullMQ for queue-based delivery with throttling and rate limiting.

### Core Interfaces

```typescript
interface Campaign {
  id: string;
  ventureId: string;
  name: string;
  description?: string;
  type: 'one_time' | 'recurring' | 'triggered' | 'journey';
  status: 'draft' | 'scheduled' | 'sending' | 'active' | 'paused' | 'completed' | 'archived';

  audienceId?: string;
  segmentId?: string;
  estimatedReach?: number;
  channels: string[];           // email, sms, push, in_app

  scheduledAt?: Date;
  sendingStartedAt?: Date;
  completedAt?: Date;

  // Recurring
  recurrenceRule?: string;      // RRULE format

  // Triggered
  triggerEvent?: string;
  triggerConditions?: TriggerCondition[];
  triggerDelay?: number;        // minutes

  // Goals & budget
  conversionGoal?: string;
  budgetAmount?: number;
  spentAmount?: number;

  // Aggregate stats
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  convertedCount: number;
  unsubscribedCount: number;
  bouncedCount: number;
  revenue: number;

  settings?: CampaignSettings;
  tags?: string[];
}

interface CampaignSettings {
  sendingWindow?: {
    enabled: boolean;
    timezone: string;
    days: number[];           // 0-6 (Sun-Sat)
    startHour: number;
    endHour: number;
  };
  throttle?: {
    enabled: boolean;
    maxPerHour: number;
    maxPerDay: number;
  };
  deduplication?: {
    enabled: boolean;
    withinDays: number;
  };
  unsubscribeLink?: boolean;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

interface AutomationStep {
  id: string;
  type: 'action' | 'condition' | 'delay' | 'split' | 'goal';
  name?: string;

  action?: {
    type: 'send_email' | 'send_sms' | 'send_push' | 'update_contact'
        | 'add_tag' | 'remove_tag' | 'webhook'
        | 'add_to_segment' | 'remove_from_segment';
    config: Record<string, unknown>;
  };

  condition?: {
    rules: SegmentCondition[];
    yesStepId: string;
    noStepId: string;
  };

  delay?: {
    type: 'fixed' | 'until_time' | 'until_date_field';
    duration?: number;
    unit?: 'minutes' | 'hours' | 'days' | 'weeks';
    time?: string;
    dateField?: string;
  };

  split?: {
    type: 'random' | 'conditional';
    branches: Array<{
      id: string;
      name: string;
      weight?: number;
      conditions?: SegmentCondition[];
      nextStepId: string;
    }>;
  };

  goal?: {
    event: string;
    conditions?: Record<string, unknown>;
    timeout?: number;
    achievedStepId?: string;
    timeoutStepId?: string;
  };

  nextStepId?: string;
  position?: { x: number; y: number };
}
```

### Service API

```typescript
class CampaignService {
  create(input: CreateCampaignInput): Promise<Campaign>;
  schedule(campaignId: string, scheduledAt: Date): Promise<Campaign>;
  sendNow(campaignId: string): Promise<Campaign>;
  pause(campaignId: string): Promise<Campaign>;
  resume(campaignId: string): Promise<Campaign>;
  trackEvent(
    recipientId: string,
    event: 'delivered' | 'opened' | 'clicked' | 'converted' | 'unsubscribed' | 'bounced' | 'complained',
    metadata?: Record<string, unknown>,
  ): Promise<void>;
  getAnalytics(campaignId: string): Promise<CampaignAnalytics>;
}

class AutomationService {
  create(input: CreateAutomationInput): Promise<Automation>;
  activate(automationId: string): Promise<Automation>;
  enroll(automationId: string, contactId: string, triggerEvent?: unknown): Promise<AutomationEnrollment>;
  processStep(enrollmentId: string, stepId: string): Promise<void>;
}
```

---

## Submodule 3: email-campaigns — Email Marketing

### Purpose

Full-featured email marketing with MJML-based template management, rich drag-and-drop content editor, deliverability tools (DKIM, SPF, DMARC verification), subscriber lifecycle management, double opt-in, bounce handling, and engagement analytics.

### Core Interfaces

```typescript
interface EmailTemplate {
  id: string;
  ventureId: string;
  name: string;
  description?: string;

  subject?: string;
  preheaderText?: string;
  bodyHtml?: string;
  bodyText?: string;
  bodyJson?: any;             // Drag-drop editor JSON

  category?: string;          // promotional, transactional, newsletter, welcome
  tags?: string[];
  isSystem: boolean;
  isPublic: boolean;
  version: number;
  usedCount: number;
}

interface EmailSubscriber {
  id: string;
  ventureId: string;
  email: string;
  contactId?: string;
  status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'complained';
  listIds: string[];

  preferences?: {
    frequency?: 'daily' | 'weekly' | 'monthly';
    categories?: string[];
    formats?: ('html' | 'text')[];
  };

  // Engagement metrics
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  lastEmailSentAt?: Date;
  lastEmailOpenedAt?: Date;
  lastEmailClickedAt?: Date;

  subscribedAt?: Date;
  unsubscribedAt?: Date;
  confirmedAt?: Date;
  source?: string;
}

interface EmailSendingDomain {
  id: string;
  ventureId: string;
  domain: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  dkimRecords?: Record<string, unknown>;
  spfVerified: boolean;
  dmarcVerified: boolean;
  reputationScore?: number;
  bounceRate?: number;
  complaintRate?: number;
  isDefault: boolean;
  isActive: boolean;
}
```

### Service API

```typescript
class EmailTemplateService {
  create(input: CreateEmailTemplateInput): Promise<EmailTemplate>;
  render(templateId: string, data: Record<string, unknown>): Promise<{
    subject: string;
    bodyHtml: string;
    bodyText: string;
  }>;
  preview(templateId: string, sampleData?: Record<string, unknown>): Promise<{
    subject: string;
    bodyHtml: string;
    bodyText: string;
    previewText: string;
  }>;
}

class EmailSubscriberService {
  subscribe(input: {
    email: string;
    listIds: string[];
    contactId?: string;
    source?: string;
    signupIp?: string;
    consentText?: string;
  }): Promise<EmailSubscriber>;
  unsubscribe(email: string, reason?: string, listIds?: string[]): Promise<void>;
  handleBounce(input: {
    email: string;
    bounceType: 'hard' | 'soft' | 'complaint';
    bounceSubtype?: string;
    diagnosticCode?: string;
    campaignId?: string;
  }): Promise<void>;
  confirmSubscription(token: string): Promise<EmailSubscriber>;
}
```

---

## Submodule 4: sms — SMS/MMS Messaging

### Purpose

SMS/MMS messaging with A2P 10DLC carrier compliance, phone number management, opt-out handling, conversation threading, and rate limiting per number.

### Core Interfaces

```typescript
interface SMSPhoneNumber {
  id: string;
  ventureId: string;
  phoneNumber: string;
  friendlyName?: string;
  provider: 'twilio' | 'bandwidth' | 'vonage';
  numberType: 'local' | 'toll_free' | 'short_code';
  country: string;
  canSms: boolean;
  canMms: boolean;
  canVoice: boolean;
  campaignId?: string;        // A2P 10DLC campaign
  brandId?: string;           // A2P 10DLC brand
  registrationStatus?: string;
  isDefault: boolean;
  isActive: boolean;
  dailyLimit?: number;
  monthlyLimit?: number;
}

interface SMSMessage {
  id: string;
  ventureId: string;
  fromNumber: string;
  toNumber: string;
  body: string;
  mediaUrls?: string[];
  numSegments: number;
  direction: 'outbound' | 'inbound';
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  errorCode?: string;
  errorMessage?: string;
  providerMessageId?: string;
  contactId?: string;
  campaignId?: string;
  cost?: number;
  conversationId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
}

interface SMSConversation {
  id: string;
  ventureId: string;
  fromNumber: string;
  toNumber: string;
  contactId?: string;
  status: 'open' | 'closed' | 'archived';
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  inboundCount: number;
  outboundCount: number;
  assignedTo?: string;
}
```

---

## Submodule 5: affiliates — Partner Programme Management

### Purpose

Complete affiliate programme management with multi-tier commissions, custom commission overrides, link tracking with geo-data, automated payout processing, and fraud detection scoring.

### Core Interfaces

```typescript
interface AffiliateProgram {
  id: string;
  ventureId: string;
  name: string;
  slug: string;
  commissionType: 'percentage' | 'fixed' | 'tiered';
  defaultCommissionRate?: number;
  defaultCommissionAmount?: number;
  tiers?: CommissionTier[];

  // Multi-level marketing
  multiLevel: boolean;
  maxLevels: number;
  levelRates?: number[];      // [10, 5, 2] = L1:10%, L2:5%, L3:2%

  cookieDuration: number;     // days
  attributionModel: 'first_click' | 'last_click' | 'linear';
  minimumPayout: number;
  payoutFrequency: 'weekly' | 'bi_weekly' | 'monthly';
  payoutDelay: number;        // days hold period

  requireApproval: boolean;
  isActive: boolean;
}

interface CommissionTier {
  minRevenue?: number;
  maxRevenue?: number;
  minReferrals?: number;
  maxReferrals?: number;
  rate?: number;
  amount?: number;
}

interface Affiliate {
  id: string;
  programId: string;
  email: string;
  name?: string;
  affiliateCode: string;
  customCommissionRate?: number;
  parentAffiliateId?: string;  // MLM parent
  level: number;
  status: 'pending' | 'approved' | 'active' | 'suspended' | 'rejected';
  payoutMethod?: string;

  // Lifetime stats
  totalClicks: number;
  totalReferrals: number;
  totalRevenue: number;
  totalCommissions: number;
  totalPaid: number;
  pendingBalance: number;
  availableBalance: number;
  fraudScore: number;
}

interface AffiliateCommission {
  id: string;
  affiliateId: string;
  programId: string;
  type: 'sale' | 'subscription' | 'renewal' | 'refund';
  level: number;
  orderAmount: number;
  commissionRate?: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'declined' | 'refunded';
  availableAt?: Date;
  payoutId?: string;
}
```

---

## Submodule 6: referrals — Customer Referral Programmes

### Purpose

Customer referral programmes with viral mechanics, dual-sided rewards (referrer + referee), referral code tracking, and automated reward distribution via coupons, credits, or free products.

### Core Interfaces

```typescript
interface ReferralProgram {
  id: string;
  ventureId: string;
  name: string;
  referrerReward: ReferralReward;
  refereeReward?: ReferralReward;
  requiredAction: 'signup' | 'purchase' | 'subscription';
  minimumPurchase?: number;
  maxRewardsPerReferrer?: number;
  referralLinkExpiry?: number;  // days
  rewardExpiry?: number;        // days
  isActive: boolean;
  totalReferrals: number;
  successfulReferrals: number;
}

interface ReferralReward {
  type: 'discount_percent' | 'discount_fixed' | 'credit' | 'free_product' | 'free_month' | 'points';
  value: number;
  currency?: string;
  productId?: string;
  maxValue?: number;
  oneTimeUse?: boolean;
}

interface Referral {
  id: string;
  programId: string;
  codeId: string;
  referrerId: string;
  refereeId: string;
  status: 'pending' | 'qualified' | 'rewarded' | 'expired' | 'cancelled';
  qualificationAction?: string;
  qualifiedAt?: Date;
  rewardedAt?: Date;
}
```

---

## Submodule 7: attribution — Multi-Touch Attribution

### Purpose

Multi-touch marketing attribution with configurable models (first-touch, last-touch, linear, time-decay, position-based, custom), touchpoint tracking, conversion mapping, and channel ROI analysis.

### Core Interfaces

```typescript
interface AttributionModel {
  id: string;
  ventureId: string;
  name: string;
  type: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'custom';
  config?: AttributionModelConfig;
  lookbackDays: number;       // default: 30
  conversionEvents: string[];
  isDefault: boolean;
  isActive: boolean;
}

interface AttributionModelConfig {
  // Time decay
  halfLifeDays?: number;

  // Position-based
  firstTouchWeight?: number;  // e.g., 0.4
  lastTouchWeight?: number;   // e.g., 0.4
  middleTouchWeight?: number; // e.g., 0.2 (split among middle)

  // Custom weights by channel
  channelWeights?: Record<string, number>;
}

interface TouchPoint {
  id: string;
  ventureId: string;
  contactId: string;
  channel: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landingPage?: string;
  sessionId?: string;
  timestamp: Date;
  eventName?: string;
  eventData?: Record<string, unknown>;
}

interface Conversion {
  id: string;
  ventureId: string;
  contactId: string;
  conversionEvent: string;
  conversionValue?: number;
  currency?: string;
  orderId?: string;
  touchpoints: TouchPoint[];
  attributionResults: Record<string, AttributionResult>;
  convertedAt: Date;
}

interface AttributionResult {
  modelId: string;
  modelType: string;
  channelCredits: Record<string, {
    credit: number;         // 0-1
    value: number;          // attributed dollar value
    touchpointId: string;
  }>;
}
```

---

## Submodule 8: ads — Advertising Platform Integrations

### Purpose

Unified advertising management across Google Ads, Meta Ads, TikTok Ads, LinkedIn Ads, and Twitter Ads. Provides account connection via OAuth, campaign sync, daily insight aggregation, and cross-platform ROAS analysis.

### Database Schema (from `ad-manager.ts`)

```typescript
// Ad providers & status enums
const adProviders = ['facebook_ads', 'google_ads', 'tiktok_ads', 'linkedin_ads', 'twitter_ads'] as const;
const adAccountStatus = ['active', 'disabled', 'payment_failed', 'review_pending'] as const;
const adCampaignStatus = ['active', 'paused', 'archived', 'completed'] as const;

// ── ad_accounts ─────────────────────────────────────────────────────────────
// Stores OAuth credentials and sync state per ad platform
const adAccounts = pgTable('ad_accounts', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  ventureId:           uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  provider:            text('provider', { enum: adProviders }).notNull(),
  externalAccountId:   text('external_account_id').notNull(),
  name:                text('name').notNull(),
  currency:            text('currency').default('USD'),
  timezone:            text('timezone').default('UTC'),
  status:              text('status', { enum: adAccountStatus }).notNull().default('active'),
  accessToken:         text('access_token').notNull(),       // Encrypted at rest
  refreshToken:        text('refresh_token'),
  metadata:            jsonb('metadata').default({}),
  lastSyncAt:          timestamp('last_sync_at', { withTimezone: true }),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Indexes: idx_ad_accounts_venture, idx_ad_accounts_external (unique: provider + externalAccountId)

// ── ad_campaigns ────────────────────────────────────────────────────────────
// Mirrored from provider — synced daily via cron
const adCampaigns = pgTable('ad_campaigns', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  adAccountId:         uuid('ad_account_id').notNull().references(() => adAccounts.id, { onDelete: 'cascade' }),
  externalCampaignId:  text('external_campaign_id').notNull(),
  name:                text('name').notNull(),
  status:              text('status', { enum: adCampaignStatus }).notNull().default('active'),
  objective:           text('objective'),          // awareness, conversion, traffic
  buyingType:          text('buying_type'),        // auction, reserved
  dailyBudget:         decimal('daily_budget', { precision: 15, scale: 2 }),
  lifetimeBudget:      decimal('lifetime_budget', { precision: 15, scale: 2 }),
  startTime:           timestamp('start_time', { withTimezone: true }),
  endTime:             timestamp('end_time', { withTimezone: true }),
  lastSyncedAt:        timestamp('last_synced_at', { withTimezone: true }),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Indexes: idx_ad_campaigns_account, idx_ad_campaigns_external (unique: adAccountId + externalCampaignId)

// ── ad_insights ─────────────────────────────────────────────────────────────
// Daily aggregated metrics per campaign
const adInsights = pgTable('ad_insights', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  adCampaignId:        uuid('ad_campaign_id').notNull().references(() => adCampaigns.id, { onDelete: 'cascade' }),
  date:                timestamp('date', { mode: 'date' }).notNull(),
  impressions:         integer('impressions').default(0),
  clicks:              integer('clicks').default(0),
  spend:               decimal('spend', { precision: 15, scale: 2 }).default('0'),
  conversions:         integer('conversions').default(0),
  conversionValue:     decimal('conversion_value', { precision: 15, scale: 2 }).default('0'),
  reach:               integer('reach').default(0),
  frequency:           decimal('frequency', { precision: 5, scale: 2 }),
  ctr:                 decimal('ctr', { precision: 5, scale: 2 }),
  cpc:                 decimal('cpc', { precision: 10, scale: 2 }),
  cpm:                 decimal('cpm', { precision: 10, scale: 2 }),
  cpp:                 decimal('cpp', { precision: 10, scale: 2 }),
  roas:                decimal('roas', { precision: 8, scale: 2 }),
  rawJson:             jsonb('raw_json'),          // Full provider response
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
// Indexes: idx_ad_insights_campaign, idx_ad_insights_unique (campaignId + date), idx_ad_insights_date
```

### Core Interfaces

```typescript
interface AdAccount {
  id: string;
  ventureId: string;
  provider: AdProvider;
  externalAccountId: string;
  name: string;
  currency: string;
  timezone: string;
  status: AdAccountStatus;
  lastSyncAt?: Date;
}

interface AdInsight {
  id: string;
  adCampaignId: string;
  date: Date;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  conversionValue: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
}
```

---

## Submodule 9: seo — Search Engine Optimization

### Purpose

SEO auditing and optimization tools including automated site crawls, technical SEO health checks, keyword tracking with SERP position monitoring, backlink monitoring, and on-page optimization recommendations.

### Core Interfaces

```typescript
interface SEOAudit {
  id: string;
  ventureId: string;
  siteUrl: string;
  status: 'pending' | 'crawling' | 'analysing' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;

  // Results
  healthScore: number;        // 0-100
  pagesScanned: number;
  issuesFound: number;
  criticalIssues: number;
  warnings: number;
  notices: number;

  issues: SEOIssue[];
  recommendations: SEORecommendation[];
}

interface SEOIssue {
  id: string;
  severity: 'critical' | 'warning' | 'notice';
  category: 'technical' | 'content' | 'performance' | 'mobile' | 'security';
  rule: string;
  description: string;
  affectedPages: string[];
  howToFix: string;
}

interface Keyword {
  id: string;
  ventureId: string;
  keyword: string;
  searchVolume?: number;
  difficulty?: number;        // 0-100
  currentPosition?: number;
  previousPosition?: number;
  positionChange?: number;
  searchEngine: 'google' | 'bing';
  location?: string;
  device?: 'desktop' | 'mobile';
  trackedSince: Date;
  lastCheckedAt?: Date;
}

interface Backlink {
  id: string;
  ventureId: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText?: string;
  domainAuthority?: number;
  isDoFollow: boolean;
  isActive: boolean;
  firstSeenAt: Date;
  lastSeenAt: Date;
}
```

---

## Submodule 10: social — Social Media Management

### Purpose

Multi-platform social media management supporting Facebook, Instagram, Twitter/X, LinkedIn, TikTok, and YouTube. Provides account connection via OAuth, post scheduling, multi-account publishing, unified social inbox, and per-account analytics.

### Database Schema (from `social.ts`)

```typescript
// Social providers and status enums
const socialProviders = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'] as const;
const socialPostStatus = ['draft', 'scheduled', 'published', 'failed'] as const;
const socialAccountStatus = ['active', 'disconnected', 'expired', 'error'] as const;

// ── social_accounts ─────────────────────────────────────────────────────────
const socialAccounts = pgTable('social_accounts', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  ventureId:           uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  provider:            text('provider', { enum: socialProviders }).notNull(),
  providerAccountId:   text('provider_account_id').notNull(),
  name:                text('name').notNull(),
  username:            text('username'),
  profilePictureUrl:   text('profile_picture_url'),
  profileUrl:          text('profile_url'),
  accessToken:         text('access_token').notNull(),       // Encrypted
  refreshToken:        text('refresh_token'),
  tokenExpiresAt:      timestamp('token_expires_at', { withTimezone: true }),
  status:              text('status', { enum: socialAccountStatus }).notNull().default('active'),
  metadata:            jsonb('metadata').default({}),        // Follower count, etc.
  createdBy:           uuid('created_by').references(() => users.id),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Indexes: idx_social_accounts_venture, idx_social_accounts_provider_id (unique), idx_social_accounts_status

// ── social_posts ────────────────────────────────────────────────────────────
const socialPosts = pgTable('social_posts', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  ventureId:           uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  content:             text('content'),
  mediaUrls:           jsonb('media_urls').default([]),
  accountIds:          jsonb('account_ids').notNull().default([]),   // Multi-account
  scheduledAt:         timestamp('scheduled_at', { withTimezone: true }),
  publishedAt:         timestamp('published_at', { withTimezone: true }),
  status:              text('status', { enum: socialPostStatus }).notNull().default('draft'),
  error:               text('error'),
  platformOptions:     jsonb('platform_options').default({}),
  createdBy:           uuid('created_by').references(() => users.id),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Indexes: idx_social_posts_venture, idx_social_posts_status, idx_social_posts_scheduled

// ── social_post_executions ──────────────────────────────────────────────────
// Tracks per-account publish status for multi-account posts
const socialPostExecutions = pgTable('social_post_executions', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  postId:              uuid('post_id').notNull().references(() => socialPosts.id, { onDelete: 'cascade' }),
  accountId:           uuid('account_id').notNull().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  externalPostId:      text('external_post_id'),
  status:              text('status', { enum: socialPostStatus }).notNull().default('draft'),
  error:               text('error'),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Indexes: idx_social_post_executions_unique (postId + accountId), idx_social_post_executions_account

// ── social_interactions ─────────────────────────────────────────────────────
// Unified inbox: comments, mentions, DMs
const socialInteractions = pgTable('social_interactions', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  ventureId:           uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  accountId:           uuid('account_id').notNull().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  externalId:          text('external_id').notNull(),
  externalPostId:      text('external_post_id'),
  type:                text('type').notNull(),              // comment, mention, dm
  content:             text('content'),
  authorName:          text('author_name'),
  authorHandle:        text('author_handle'),
  authorAvatarUrl:     text('author_avatar_url'),
  occurredAt:          timestamp('occurred_at', { withTimezone: true }).notNull(),
  isRead:              boolean('is_read').default(false),
  isReplied:           boolean('is_replied').default(false),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
// Indexes: idx_social_interactions_venture, idx_social_interactions_account, idx_social_interactions_external (unique)
```

---

## Submodule 11: content — Content Marketing Pipeline

### Purpose

Content marketing calendar and workflow management. Provides a Kanban-style pipeline from ideation to publication, with content brief generation powered by brand voices.

### Core Interfaces

```typescript
interface ContentBrief {
  id: string;
  ventureId: string;
  title: string;
  status: 'idea' | 'draft' | 'in_review' | 'ready' | 'scheduled' | 'published' | 'archived';
  brandVoiceId?: string;
  targetAudience?: string;
  goal?: string;
  platform?: string;
  content?: any;              // Rich text or structured content
  createdBy?: string;
}
```

---

## Submodule 12: creative — Asset & Brand Management

### Purpose

Digital asset management (DAM) and brand voice system. Manages creative assets with semantic search via embeddings, tracks usage across marketing channels, and maintains brand voice guidelines used by AI content generation.

### Database Schema (from `creative.ts`)

```typescript
// Asset types
const assetType = ['image', 'video', 'document', 'audio', 'font', 'other'] as const;

// ── brand_voices ────────────────────────────────────────────────────────────
// LLM-powered brand voice definitions for content generation
const brandVoices = pgTable('brand_voices', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  ventureId:           uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  name:                text('name').notNull(),
  description:         text('description'),
  tone:                text('tone').notNull(),              // e.g. "Professional, Friendly"
  style:               text('style').notNull(),             // e.g. "Concise, Action-oriented"
  keywords:            jsonb('keywords').default([]),
  systemPrompt:        text('system_prompt').notNull(),     // LLM instruction for voice
  examples:            jsonb('examples').default([]),       // [{input, output}]
  isDefault:           boolean('is_default').default(false),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Index: idx_brand_voices_venture

// ── content_assets ──────────────────────────────────────────────────────────
// Marketing assets extending core file storage with metadata
const contentAssets = pgTable('content_assets', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  ventureId:           uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  fileId:              uuid('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
  name:                text('name').notNull(),
  type:                text('type', { enum: assetType }).notNull(),
  folderPath:          text('folder_path').default('/'),
  tags:                jsonb('tags').default([]),
  description:         text('description'),
  embedding:           jsonb('embedding'),                  // Vector for semantic search
  usageCount:          integer('usage_count').default(0),
  createdBy:           uuid('created_by').references(() => users.id),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Indexes: idx_content_assets_venture, idx_content_assets_type, idx_content_assets_tags
```

---

## Submodule 13: education — Learning Management System

### Purpose

Learning management system (LMS) for venture-branded educational content. Supports courses with nested modules and lessons (video, article, quiz), progress tracking per user, and NFT-based certification on completion with XP rewards.

### Database Schema (from `growth-education.ts`)

```typescript
// Difficulty and content type enums
const educationDifficultyEnum = pgEnum('education_difficulty', ['beginner', 'intermediate', 'advanced']);
const educationContentTypeEnum = pgEnum('education_content_type', ['video', 'article', 'quiz']);

// ── education.courses ───────────────────────────────────────────────────────
const educationCourses = educationSchema.table('courses', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  ventureId:           uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }),
  title:               text('title').notNull(),
  slug:                text('slug').notNull(),
  description:         text('description'),
  difficulty:          educationDifficultyEnum('difficulty').default('beginner'),
  isPublished:         boolean('is_published').default(false),
  xpReward:            integer('xp_reward').default(0),
  nftCertificationId:  uuid('nft_certification_id').references(() => nftCollections.id),
  thumbnailUrl:        text('thumbnail_url'),
  tags:                text('tags').array(),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Index: idx_education_courses_slug_venture (unique: slug + ventureId)

// ── education.modules ───────────────────────────────────────────────────────
const educationModules = educationSchema.table('modules', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  courseId:            uuid('course_id').references(() => educationCourses.id, { onDelete: 'cascade' }),
  title:               text('title').notNull(),
  orderIndex:          integer('order_index').notNull(),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Index: idx_education_modules_course

// ── education.lessons ───────────────────────────────────────────────────────
const educationLessons = educationSchema.table('lessons', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  moduleId:            uuid('module_id').references(() => educationModules.id, { onDelete: 'cascade' }),
  title:               text('title').notNull(),
  contentType:         educationContentTypeEnum('content_type').notNull(),
  videoProviderId:     text('video_provider_id'),
  articleBody:         text('article_body'),
  quizConfig:          jsonb('quiz_config').default({}),
  durationSeconds:     integer('duration_seconds'),
  orderIndex:          integer('order_index').notNull(),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Index: idx_education_lessons_module

// ── education.enrollments ───────────────────────────────────────────────────
const educationEnrollments = educationSchema.table('enrollments', {
  userId:              uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId:            uuid('course_id').notNull().references(() => educationCourses.id, { onDelete: 'cascade' }),
  progressPercent:     decimal('progress_percent', { precision: 5, scale: 2 }).default('0'),
  isCompleted:         boolean('is_completed').default(false),
  completedAt:         timestamp('completed_at', { withTimezone: true }),
  completedLessonIds:  uuid('completed_lesson_ids').array().default([]),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Index: idx_education_enrollments_user_course (unique: userId + courseId)
```

---

## Growth CRM Profile Schema (from `growth-crm.ts`)

The growth schema maintains a unified customer profile that merges identity, behavioural, and Web3 data:

```typescript
// ── growth.profiles ─────────────────────────────────────────────────────────
// Unified customer view combining identity, behavioral and web3 data
const growthProfiles = growthSchema.table('profiles', {
  id:                  uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  primaryWalletAddress: text('primary_wallet_address'),
  primaryEmail:        text('primary_email'),
  ltvUsd:              decimal('ltv_usd', { precision: 15, scale: 2 }).default('0'),
  ltvEdge:             decimal('ltv_edge', { precision: 20, scale: 4 }).default('0'),
  engagementScore:     integer('engagement_score').default(0),
  churnRiskScore:      decimal('churn_risk_score', { precision: 3, scale: 2 }),
  lifecycleStage:      text('lifecycle_stage').default('visitor'),
  lastActiveAt:        timestamp('last_active_at', { withTimezone: true }),
  tags:                text('tags').array().default([]),
  customAttributes:    jsonb('custom_attributes').default({}),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Indexes: idx_growth_profiles_wallet, idx_growth_profiles_email, idx_growth_profiles_score

// ── growth.segments ─────────────────────────────────────────────────────────
const growthSegments = growthSchema.table('segments', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  ventureId:           uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }),
  name:                text('name').notNull(),
  description:         text('description'),
  queryDefinition:     jsonb('query_definition').notNull().default({}),
  isDynamic:           boolean('is_dynamic').default(true),
  isActive:            boolean('is_active').default(true),
  createdAt:           timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Index: idx_growth_segments_venture

// ── growth.segment_members ──────────────────────────────────────────────────
const growthSegmentMembers = growthSchema.table('segment_members', {
  segmentId:           uuid('segment_id').references(() => growthSegments.id, { onDelete: 'cascade' }),
  profileId:           uuid('profile_id').references(() => growthProfiles.id, { onDelete: 'cascade' }),
  addedAt:             timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
});
// Indexes: idx_growth_segment_members_profile, idx_growth_segment_members_added
```

---

## Marketing Analytics Service (from `marketing-analytics.service.ts`)

Aggregates metrics from ad campaigns, social posts, and social interactions into a unified dashboard:

```typescript
interface DashboardMetrics {
  activeCampaigns: number;
  totalSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  socialEngagement: number;   // Reply rate as percentage
  scheduledPosts: number;
}

interface TimelineDataPoint {
  date: string;               // YYYY-MM-DD
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface CampaignPerformance {
  id: string;
  name: string;
  status: AdCampaignStatus;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
}

interface SocialMetrics {
  totalAccounts: number;
  activeAccounts: number;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
  totalInteractions: number;
  unreadInteractions: number;
}

class MarketingAnalyticsService {
  getDashboardMetrics(ventureId: string): Promise<DashboardMetrics>;
  getTimelineData(ventureId: string, days?: number): Promise<TimelineDataPoint[]>;
  getCampaignPerformance(ventureId: string): Promise<CampaignPerformance[]>;
  getSocialMetrics(ventureId: string): Promise<SocialMetrics>;
}
```

---

## tRPC Router (from `marketing.router.ts`)

The marketing router exposes the following procedures:

```typescript
const marketingRouter = router({
  social: router({
    listAccounts:    protectedProcedure.query(...)  ,
    connectAccount:  protectedProcedure.input(z.object({
      provider: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube']),
      providerAccountId: z.string(),
      name: z.string(),
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      username: z.string().optional(),
      profilePictureUrl: z.string().optional(),
      tokenExpiresAt: z.string().optional(),
    })).mutation(...),
    postContent:     protectedProcedure.input(z.object({
      accountId: z.string(),
      content: z.string(),
      mediaUrls: z.array(z.string()).optional(),
      scheduledAt: z.string().optional(),
    })).mutation(...),
  }),

  ads: router({
    listAccounts:    protectedProcedure.query(...),
    connectAccount:  protectedProcedure.input(z.object({
      provider: z.enum(['facebook_ads', 'google_ads', 'tiktok_ads', 'linkedin_ads', 'twitter_ads']),
      externalAccountId: z.string(),
      name: z.string(),
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      currency: z.string().optional(),
      timezone: z.string().optional(),
    })).mutation(...),
    createCampaign:  protectedProcedure.input(z.object({
      adAccountId: z.string(),
      name: z.string(),
      objective: z.string(),
      dailyBudget: z.number().optional(),
      status: z.enum(['active', 'paused']).optional(),
    })).mutation(...),
  }),

  creative: router({
    listAssets:      protectedProcedure.input(z.object({
      type: z.enum(['image', 'video', 'document', 'audio', 'font', 'other']).optional(),
      tag: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    })).query(...),
    createAsset:     protectedProcedure.input(z.object({
      fileId: z.string(),
      name: z.string(),
      type: z.enum(['image', 'video', 'document', 'audio', 'font', 'other']),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })).mutation(...),
    listBrandVoices: protectedProcedure.query(...),
    generateBrief:   protectedProcedure.input(z.object({
      voiceId: z.string(),
      topic: z.string(),
      platform: z.string(),
    })).mutation(...),
  }),

  analytics: router({
    getDashboard:    protectedProcedure.query(...),
  }),
});
```

---

## Code Examples

### Example 1: Create a Dynamic Segment

```typescript
import { segmentService } from '@mcv/growth';

const vipSegment = await segmentService.create({
  name: 'VIP Customers',
  description: 'High-value customers with recent activity',
  type: 'dynamic',
  conditions: [
    { field: 'totalSpent', operator: 'gte', value: 500 },
    { field: 'lastPurchaseDate', operator: 'within', value: '30d' },
    { field: 'tags', operator: 'contains', value: 'vip' },
  ],
});

console.log(`Segment created: ${vipSegment.id}, members: ${vipSegment.memberCount}`);
```

### Example 2: Track Marketing Events and Identify Visitors

```typescript
import { eventTrackingService } from '@mcv/growth';

// Track anonymous pageview
await eventTrackingService.track({
  eventName: 'page_view',
  eventCategory: 'pageview',
  anonymousId: 'anon-abc-123',
  sessionId: 'sess-xyz',
  channel: 'web',
  pageUrl: 'https://venture.com/products',
  pageTitle: 'Products',
  utmSource: 'google',
  utmMedium: 'cpc',
  utmCampaign: 'spring-sale',
  occurredAt: new Date(),
});

// Later: identify the visitor after signup
await eventTrackingService.identify('anon-abc-123', 'contact-uuid-456');

// Retrieve contact's event stream
const events = await eventTrackingService.getContactEvents('contact-uuid-456', {
  limit: 50,
  eventNames: ['page_view', 'purchase'],
});
```

### Example 3: Run an A/B Test

```typescript
import { abTestService } from '@mcv/growth';

// Create test
const test = await abTestService.create({
  name: 'Hero CTA Test',
  hypothesis: 'Green CTA will increase signups by 15%',
  testType: 'component',
  targetId: 'hero-cta-button',
  variants: [
    { id: 'control', name: 'Blue CTA', weight: 50, content: { color: 'blue', text: 'Get Started' }, impressions: 0, conversions: 0 },
    { id: 'variant-a', name: 'Green CTA', weight: 50, content: { color: 'green', text: 'Start Free' }, impressions: 0, conversions: 0 },
  ],
  controlVariantId: 'control',
  primaryGoal: 'conversion',
  primaryGoalEvent: 'signup_completed',
  confidenceLevel: 95,
  minimumSampleSize: 1000,
});

// Start test
await abTestService.start(test.id);

// Get variant for a visitor (deterministic by visitor ID)
const variant = await abTestService.getVariant(test.id, 'visitor-789');
// Returns { id: 'variant-a', content: { color: 'green', text: 'Start Free' }, ... }

// Track conversion
await abTestService.trackConversion(test.id, 'visitor-789', 49.99);

// Calculate results
const results = await abTestService.calculateResults(test.id);
console.log(`Winner: ${results.winner}, Confidence: ${results.confidence}%, Lift: ${results.lift}%`);
```

### Example 4: Create and Send a Multi-Channel Campaign

```typescript
import { campaignService } from '@mcv/growth';

const campaign = await campaignService.create({
  name: 'Spring Sale 2026',
  description: 'Seasonal promotion across email + SMS',
  type: 'one_time',
  audienceId: 'aud-active-shoppers',
  channels: ['email', 'sms'],
  settings: {
    sendingWindow: {
      enabled: true,
      timezone: 'America/New_York',
      days: [1, 2, 3, 4, 5],     // Mon-Fri
      startHour: 9,
      endHour: 17,
    },
    throttle: {
      enabled: true,
      maxPerHour: 10000,
      maxPerDay: 50000,
    },
    trackOpens: true,
    trackClicks: true,
    unsubscribeLink: true,
  },
  budgetAmount: 5000,
  budgetCurrency: 'USD',
  conversionGoal: 'Purchase',
  conversionGoalEvent: 'order.completed',
  messages: [
    {
      channel: 'email',
      subject: '🌸 Spring Sale — 30% Off Everything!',
      fromName: 'Acme Store',
      fromEmail: 'deals@acme.com',
      bodyHtml: '<h1>Spring Sale</h1><p>Hello {{firstName}}! Enjoy 30% off.</p>',
      bodyText: 'Spring Sale! Hello {{firstName}}! Enjoy 30% off.',
    },
    {
      channel: 'sms',
      subject: null,
      bodyText: '🌸 {{firstName}}, spring sale is live! 30% off at acme.com/sale',
    },
  ],
  tags: ['seasonal', 'promotion'],
});

// Schedule for tomorrow at 10am
const scheduledDate = new Date();
scheduledDate.setDate(scheduledDate.getDate() + 1);
scheduledDate.setHours(10, 0, 0, 0);

await campaignService.schedule(campaign.id, scheduledDate);
```

### Example 5: Build an Automation Workflow

```typescript
import { automationService } from '@mcv/growth';

const welcomeAutomation = await automationService.create({
  name: 'Welcome Series',
  description: 'Onboarding drip for new signups',
  triggerType: 'event',
  triggerConfig: { event: 'user.signup' },
  allowReentry: false,
  steps: [
    {
      id: 'step-1',
      type: 'action',
      name: 'Send Welcome Email',
      action: {
        type: 'send_email',
        config: { templateId: 'tmpl-welcome', fromEmail: 'hello@acme.com' },
      },
      nextStepId: 'step-2',
    },
    {
      id: 'step-2',
      type: 'delay',
      name: 'Wait 2 Days',
      delay: { type: 'fixed', duration: 2, unit: 'days' },
      nextStepId: 'step-3',
    },
    {
      id: 'step-3',
      type: 'condition',
      name: 'Opened Welcome?',
      condition: {
        rules: [{ field: 'emailOpened', operator: 'eq', value: true }],
        yesStepId: 'step-4a',
        noStepId: 'step-4b',
      },
    },
    {
      id: 'step-4a',
      type: 'action',
      name: 'Send Product Tips',
      action: {
        type: 'send_email',
        config: { templateId: 'tmpl-tips' },
      },
    },
    {
      id: 'step-4b',
      type: 'action',
      name: 'Re-Send Welcome (SMS)',
      action: {
        type: 'send_sms',
        config: { body: 'Hey {{firstName}}! Did you see our welcome email?' },
      },
    },
  ],
  goalEvent: 'first_purchase',
  goalTimeoutDays: 14,
});

// Activate the automation
await automationService.activate(welcomeAutomation.id);

// Enroll a new contact
await automationService.enroll(welcomeAutomation.id, 'contact-new-user-123', {
  event: 'user.signup',
  email: 'jane@example.com',
});
```

### Example 6: Email Template Rendering with Merge Tags

```typescript
import { emailTemplateService } from '@mcv/growth';

// Create a template with MJML JSON
const template = await emailTemplateService.create({
  name: 'Order Confirmation',
  category: 'transactional',
  subject: 'Order #{{orderId}} Confirmed',
  preheaderText: 'Thank you for your purchase!',
  bodyJson: {
    sections: [
      {
        columns: [{
          blocks: [
            { type: 'image', src: '{{logoUrl}}' },
            { type: 'text', content: '<h2>Thank you, {{firstName}}!</h2><p>Your order #{{orderId}} is confirmed.</p>' },
            { type: 'button', href: '{{trackingUrl}}', text: 'Track Order' },
          ],
        }],
      },
    ],
  },
});

// Render with real data
const rendered = await emailTemplateService.render(template.id, {
  firstName: 'Alice',
  orderId: 'ORD-2026-001',
  logoUrl: 'https://cdn.acme.com/logo.png',
  trackingUrl: 'https://acme.com/track/ORD-2026-001',
});

// rendered.subject → "Order #ORD-2026-001 Confirmed"
// rendered.bodyHtml → compiled MJML → responsive HTML
```

### Example 7: Email Subscription Lifecycle

```typescript
import { emailSubscriberService } from '@mcv/growth';

// Subscribe with double opt-in
const subscriber = await emailSubscriberService.subscribe({
  email: 'bob@example.com',
  listIds: ['list-newsletter', 'list-promotions'],
  source: 'website_footer',
  signupIp: '198.51.100.1',
  consentText: 'I agree to receive marketing emails',
});

// Confirm double opt-in (from email link)
const confirmed = await emailSubscriberService.confirmSubscription('token-abc-123');

// Handle a hard bounce
await emailSubscriberService.handleBounce({
  email: 'invalid@example.com',
  bounceType: 'hard',
  bounceSubtype: 'invalid',
  diagnosticCode: '550 5.1.1 User unknown',
  campaignId: 'camp-spring-sale',
});

// Unsubscribe from specific list
await emailSubscriberService.unsubscribe('bob@example.com', 'Too many emails', ['list-promotions']);
```

### Example 8: Connect Social Accounts and Publish

```typescript
import { trpc } from '@/utils/trpc';

// Connect Instagram account
await trpc.marketing.social.connectAccount.mutate({
  provider: 'instagram',
  providerAccountId: 'ig-123456',
  name: 'Acme Official',
  accessToken: 'encrypted-token-here',
  refreshToken: 'refresh-token',
  username: '@acme_official',
  profilePictureUrl: 'https://cdn.instagram.com/acme.jpg',
  tokenExpiresAt: '2026-12-31T23:59:59Z',
});

// Schedule a post for next week
await trpc.marketing.social.postContent.mutate({
  accountId: 'social-acc-uuid',
  content: '🚀 Big announcement coming Monday! Stay tuned. #acme',
  mediaUrls: ['https://cdn.acme.com/teaser.jpg'],
  scheduledAt: '2026-02-15T14:00:00Z',
});

// List connected accounts
const accounts = await trpc.marketing.social.listAccounts.query();
```

### Example 9: Connect Ad Platform and Create Campaign

```typescript
import { trpc } from '@/utils/trpc';

// Connect Google Ads account
await trpc.marketing.ads.connectAccount.mutate({
  provider: 'google_ads',
  externalAccountId: '123-456-7890',
  name: 'Acme Google Ads',
  accessToken: 'encrypted-oauth-token',
  refreshToken: 'refresh-token',
  currency: 'USD',
  timezone: 'America/New_York',
});

// Create an ad campaign
const adCampaign = await trpc.marketing.ads.createCampaign.mutate({
  adAccountId: 'ad-acc-uuid',
  name: 'Spring Conversion Campaign',
  objective: 'conversion',
  dailyBudget: 150,
  status: 'paused',
});
```

### Example 10: Marketing Analytics Dashboard

```typescript
import { marketingAnalyticsService } from '@mcv/growth';

// Fetch unified dashboard metrics (last 30 days)
const metrics = await marketingAnalyticsService.getDashboardMetrics('venture-uuid');
// → { activeCampaigns: 5, totalSpend: 12340.50, impressions: 890000,
//     clicks: 23400, conversions: 1560, socialEngagement: 67.3, scheduledPosts: 12 }

// Get daily timeline data for charts
const timeline = await marketingAnalyticsService.getTimelineData('venture-uuid', 30);
// → [{ date: '2026-01-10', spend: 410.20, revenue: 1823.50, impressions: 29400, ... }, ...]

// Campaign performance breakdown
const campaigns = await marketingAnalyticsService.getCampaignPerformance('venture-uuid');
// → [{ id: '...', name: 'Spring Sale', status: 'active', spend: 5230, roas: 3.5, ctr: 2.8, ... }, ...]

// Social media metrics
const social = await marketingAnalyticsService.getSocialMetrics('venture-uuid');
// → { totalAccounts: 4, activeAccounts: 3, publishedPosts: 156, unreadInteractions: 23, ... }
```

### Example 11: Affiliate Programme Setup

```typescript
import { affiliateService } from '@mcv/growth';

// Create a tiered affiliate programme
const programme = await affiliateService.createProgram({
  name: 'Acme Partners',
  slug: 'acme-partners',
  commissionType: 'tiered',
  tiers: [
    { minRevenue: 0, maxRevenue: 1000, rate: 10 },
    { minRevenue: 1000, maxRevenue: 5000, rate: 15 },
    { minRevenue: 5000, rate: 20 },
  ],
  multiLevel: true,
  maxLevels: 3,
  levelRates: [10, 5, 2],              // L1: 10%, L2: 5%, L3: 2%
  cookieDuration: 30,
  minimumPayout: 50,
  payoutFrequency: 'monthly',
  payoutDelay: 30,
  requireApproval: true,
});

// Register an affiliate
const affiliate = await affiliateService.registerAffiliate({
  programId: programme.id,
  email: 'partner@example.com',
  name: 'Jane Partner',
  affiliateCode: 'JANE2026',
  payoutMethod: 'paypal',
  payoutDetails: { email: 'partner@example.com' },
});

// Record a commission on sale
await affiliateService.recordCommission({
  affiliateId: affiliate.id,
  programId: programme.id,
  type: 'sale',
  orderId: 'order-uuid-789',
  orderAmount: 299.99,
  commissionRate: 15,
  commissionAmount: 44.99,
});
```

### Example 12: Referral Programme with Dual Rewards

```typescript
import { referralService } from '@mcv/growth';

// Create a referral programme
const programme = await referralService.createProgram({
  name: 'Refer a Friend',
  referrerReward: {
    type: 'credit',
    value: 25,
    currency: 'USD',
  },
  refereeReward: {
    type: 'discount_percent',
    value: 20,
    maxValue: 50,
    oneTimeUse: true,
  },
  requiredAction: 'purchase',
  minimumPurchase: 30,
  maxRewardsPerReferrer: 10,
  referralLinkExpiry: 60,
});

// Generate a referral code for a user
const code = await referralService.generateCode({
  programId: programme.id,
  referrerId: 'user-alice-123',
  referrerType: 'user',
});
// → { code: 'ALICE-XY7K', ... }

// Track a referral (when referee signs up via code)
const referral = await referralService.trackReferral({
  programId: programme.id,
  codeId: code.id,
  referrerId: 'user-alice-123',
  refereeId: 'user-bob-456',
  refereeEmail: 'bob@example.com',
});

// Qualify and reward (after purchase)
await referralService.qualifyReferral(referral.id, {
  action: 'purchase',
  data: { orderId: 'order-uuid', amount: 89.99 },
});
```

### Example 13: Creative Asset Management

```typescript
import { trpc } from '@/utils/trpc';

// Upload a creative asset
const asset = await trpc.marketing.creative.createAsset.mutate({
  fileId: 'file-uuid-from-storage',
  name: 'Spring Banner 1200x628',
  type: 'image',
  description: 'Spring sale hero banner for social ads',
  tags: ['spring-2026', 'banner', 'social-ads'],
});

// List assets filtered by type and tag
const images = await trpc.marketing.creative.listAssets.query({
  type: 'image',
  tag: 'spring-2026',
  limit: 20,
});

// Generate a content brief using brand voice
const brief = await trpc.marketing.creative.generateBrief.mutate({
  voiceId: 'voice-professional',
  topic: 'Spring Collection Launch',
  platform: 'instagram',
});
```

### Example 14: Education — Course Enrolment and Progress

```typescript
import { educationService } from '@mcv/growth';

// Create a course
const course = await educationService.createCourse({
  title: 'DeFi Fundamentals',
  slug: 'defi-fundamentals',
  description: 'Learn the basics of decentralized finance',
  difficulty: 'beginner',
  xpReward: 500,
  nftCertificationId: 'nft-collection-defi-cert',
  tags: ['defi', 'web3', 'beginner'],
});

// Add a module with lessons
const module = await educationService.addModule(course.id, {
  title: 'What is DeFi?',
  orderIndex: 0,
});

await educationService.addLesson(module.id, {
  title: 'Introduction to Decentralized Finance',
  contentType: 'video',
  videoProviderId: 'mux-video-id-123',
  durationSeconds: 600,
  orderIndex: 0,
});

await educationService.addLesson(module.id, {
  title: 'DeFi vs TradFi Quiz',
  contentType: 'quiz',
  quizConfig: {
    questions: [
      {
        question: 'What does DeFi stand for?',
        options: ['Decentralized Finance', 'Digital Finance', 'Direct Finance'],
        correct: 0,
      },
    ],
    passingScore: 80,
  },
  orderIndex: 1,
});

// Enrol a user
await educationService.enrol('user-uuid-789', course.id);

// Record lesson completion
await educationService.completeLesson('user-uuid-789', course.id, 'lesson-uuid-1');
// → { progressPercent: 50.00, isCompleted: false }
```

### Example 15: Personalization with A/B Variations

```typescript
import { personalizationService } from '@mcv/growth';

// Get personalized content for a visitor
const personalization = await personalizationService.getPersonalization(
  'contact-uuid-123',     // contactId (null for anonymous)
  'page',                 // targetType
  'homepage-hero',        // targetId
  {                       // context
    device: 'mobile',
    country: 'US',
    referrer: 'google.com',
    isReturningVisitor: true,
  },
);

if (personalization) {
  console.log('Variation:', personalization.variationId);
  console.log('Content:', personalization.content);
  // → { headline: 'Welcome back!', ctaText: 'Continue Shopping', heroImage: '...' }

  // Track conversion when user takes action
  await personalizationService.trackConversion(
    personalization.ruleId,
    personalization.variationId,
  );
}
```

---

## Performance Considerations

### Database Indexing Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| `growth_marketing_events` | `(ventureId, contactId)` | Fast event lookups per contact |
| `growth_marketing_events` | `(eventName, occurredAt)` | Time-series queries for analytics |
| `growth_marketing_events` | `(sessionId)` | Session reconstruction |
| `growth_campaigns` | `(ventureId, status)` | Active campaign queries |
| `growth_campaigns` | `(scheduledAt)` | Campaign scheduler polling |
| `growth_campaign_recipients` | `(campaignId, status)` | Delivery tracking |
| `growth_campaign_recipients` | `(contactId)` | Contact campaign history |
| `ad_insights` | `(adCampaignId, date)` UNIQUE | Upsert daily insights |
| `ad_insights` | `(date)` | Date-range aggregations |
| `social_posts` | `(ventureId, scheduledAt)` | Scheduled post polling |
| `social_interactions` | `(accountId, externalId)` UNIQUE | Dedup incoming interactions |
| `growth_affiliate_clicks` | `(visitorId)` | Attribution cookie lookups |
| `growth_email_subscribers` | `(ventureId, email)` | Subscriber dedup |
| `education.enrollments` | `(userId, courseId)` UNIQUE | Single enrolment per user |

### Scaling Guidelines

| Metric | Target | Strategy |
|--------|--------|----------|
| Campaign send throughput | 100k emails/hour | BullMQ worker pool + partitioned queue |
| Event ingestion | 10k events/sec | Batch inserts, write-ahead buffer |
| Segment recalculation | < 30s for 1M contacts | Materialized query with incremental refresh |
| Ad insight sync | < 5 min for all accounts | Parallel provider API calls, daily cron |
| Social post scheduling | ±10s accuracy | Polling interval with catch-up logic |
| Attribution computation | < 2s per conversion | Cached touchpoint chains, pre-indexed |
| Email template render | < 50ms | MJML compilation cached, merge tag substitution |

### Caching Strategy

```typescript
// Campaign stats — updated on every webhook, cached 60s for dashboard reads
// Cache key pattern: growth:campaign:{campaignId}:stats
const CAMPAIGN_STATS_TTL = 60;

// Segment member counts — recalculated hourly, cached for 5 min
const SEGMENT_COUNT_TTL = 300;

// Ad insights dashboard — aggregated daily, cached for 15 min
const AD_INSIGHTS_TTL = 900;

// Social metrics — computed on-demand, cached 5 min
const SOCIAL_METRICS_TTL = 300;

// Email template compiled HTML — cached until template is updated
// Cache key: growth:email:template:{templateId}:v{version}
const TEMPLATE_CACHE_TTL = 86400;   // 24h

// Personalisation rules — cached per venture, invalidated on rule change
const PERSONALIZATION_CACHE_TTL = 300;
```

### Queue Architecture (BullMQ)

```
growth:campaign-send        — Campaign message dispatch (partitioned by priority)
  ├── send-campaign         — Resolve audience → create recipients → fan out
  └── send-message          — Send single message via @mcv/comms

growth:automation-process   — Automation step execution
  └── process-step          — Evaluate step → execute action → schedule next

growth:ad-sync              — Ad platform sync
  ├── sync-campaigns        — Pull campaign data from provider API
  └── sync-insights         — Pull daily insights data

growth:social-publish       — Social post publishing
  └── publish-post          — Publish to each target account

growth:seo-audit            — SEO site crawl and analysis
  └── crawl-page            — Crawl + analyse individual page
```

---

## Security

### Authentication & Authorisation

All growth operations require:
1. **Authenticated session** — Valid user session via `protectedProcedure`
2. **Venture context** — `ctx.session.ventureId` must be set
3. **Role-based access** — Campaign management requires `marketing:manage` permission

```typescript
// All tRPC procedures enforce auth
const marketingRouter = router({
  ads: router({
    connectAccount: protectedProcedure  // ← Requires authenticated session
      .input(z.object({...}))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.session?.ventureId) throw new Error('No venture context');
        // ...
      }),
  }),
});
```

### Data Protection

| Data Type | Protection Method |
|-----------|-------------------|
| Ad platform access tokens | AES-256-GCM encryption at rest |
| Social account tokens | AES-256-GCM encryption at rest |
| Affiliate payout details | AES-256-GCM encryption at rest |
| Subscriber email addresses | Indexed with HMAC for lookup, stored plaintext for delivery |
| IP addresses (events) | Retained 90 days, then hashed |
| SMS opt-out numbers | Stored in compliance-protected suppression list |
| Visitor tracking data | Anonymized after 365 days per GDPR retention policy |

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

### Compliance Features

- **CAN-SPAM / GDPR** — Mandatory unsubscribe links, double opt-in support, consent tracking
- **TCPA** — SMS opt-out handling (`STOP` keyword processing), time-of-day sending windows
- **A2P 10DLC** — Phone number registration with brand and campaign IDs
- **CCPA** — Data deletion support, suppression list management
- **Cookie Consent** — Attribution cookie duration configurable per programme
- **Data Retention** — Configurable retention policies per event type

---

## Audit Events

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
| `growth.ad.synced` | Ad data synced | `{ adAccountId, campaignsCount, insightsCount }` |
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

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROWTH_DB_URL` | Yes | — | PostgreSQL connection string for growth schemas |
| `GROWTH_REDIS_URL` | Yes | — | Redis URL for BullMQ queues and caching |
| `SENDGRID_API_KEY` | Yes | — | SendGrid API key for email delivery |
| `TWILIO_ACCOUNT_SID` | Yes | — | Twilio account SID for SMS |
| `TWILIO_AUTH_TOKEN` | Yes | — | Twilio auth token |
| `TWILIO_DEFAULT_FROM` | No | — | Default Twilio phone number |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | No | — | Google Ads API developer token |
| `GOOGLE_ADS_CLIENT_ID` | No | — | Google Ads OAuth client ID |
| `GOOGLE_ADS_CLIENT_SECRET` | No | — | Google Ads OAuth client secret |
| `META_ADS_APP_ID` | No | — | Meta (Facebook) Ads app ID |
| `META_ADS_APP_SECRET` | No | — | Meta Ads app secret |
| `TIKTOK_ADS_APP_ID` | No | — | TikTok Ads app ID |
| `TIKTOK_ADS_APP_SECRET` | No | — | TikTok Ads app secret |
| `LINKEDIN_ADS_CLIENT_ID` | No | — | LinkedIn Ads OAuth client ID |
| `LINKEDIN_ADS_CLIENT_SECRET` | No | — | LinkedIn Ads OAuth client secret |
| `FACEBOOK_APP_ID` | No | — | Facebook Graph API app ID |
| `FACEBOOK_APP_SECRET` | No | — | Facebook Graph API app secret |
| `INSTAGRAM_APP_ID` | No | — | Instagram Graph API app ID |
| `INSTAGRAM_APP_SECRET` | No | — | Instagram Graph API app secret |
| `TWITTER_API_KEY` | No | — | Twitter/X API key |
| `TWITTER_API_SECRET` | No | — | Twitter/X API secret |
| `LINKEDIN_CLIENT_ID` | No | — | LinkedIn social OAuth client ID |
| `LINKEDIN_CLIENT_SECRET` | No | — | LinkedIn social OAuth client secret |
| `TIKTOK_CLIENT_KEY` | No | — | TikTok social client key |
| `YOUTUBE_API_KEY` | No | — | YouTube Data API key |
| `GROWTH_ENCRYPTION_KEY` | Yes | — | AES-256 key for token encryption at rest |
| `GROWTH_WEBHOOK_SECRET` | Yes | — | HMAC secret for provider webhook verification |
| `GROWTH_EVENT_BATCH_SIZE` | No | `1000` | Batch size for event ingestion |
| `GROWTH_CAMPAIGN_THROTTLE_MAX` | No | `10000` | Max messages per hour per campaign |
| `GROWTH_SEO_CRAWL_CONCURRENCY` | No | `5` | Concurrent page crawls for SEO audits |
| `GROWTH_AD_SYNC_INTERVAL_MINUTES` | No | `360` | Ad insight sync interval (default: 6h) |
| `GROWTH_SOCIAL_POLL_INTERVAL_SECONDS` | No | `60` | Social interaction polling interval |
| `GROWTH_ATTRIBUTION_LOOKBACK_DAYS` | No | `30` | Default attribution lookback window |
| `MUX_TOKEN_ID` | No | — | Mux video token ID for education videos |
| `MUX_TOKEN_SECRET` | No | — | Mux video token secret |

---

## Error Codes

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `GROWTH_SEGMENT_NOT_FOUND` | 404 | Segment does not exist | Verify segment ID |
| `GROWTH_SEGMENT_INVALID_CONDITIONS` | 400 | Segment conditions are malformed | Check condition field names and operators |
| `GROWTH_AUDIENCE_NOT_FOUND` | 404 | Audience does not exist | Verify audience ID |
| `GROWTH_CAMPAIGN_