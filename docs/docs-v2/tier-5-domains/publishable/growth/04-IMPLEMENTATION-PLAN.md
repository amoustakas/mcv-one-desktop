# @mcv/growth — Implementation Plan

**Package:** `@mcv/growth`
**Tier:** 5 (Domain — Publishable)
**Classification:** PUBLISHABLE
**Document:** 04-IMPLEMENTATION-PLAN.md
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1 — Foundation](#phase-1--foundation-weeks-14)
4. [Phase 2 — Core](#phase-2--core-weeks-58)
5. [Phase 3 — Advanced](#phase-3--advanced-weeks-912)
6. [Phase 4 — Polish & Hardening](#phase-4--polish--hardening-weeks-1314)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risk Matrix](#risk-matrix)
10. [Timeline & Milestones](#timeline--milestones)

---

## Overview

`@mcv/growth` is the comprehensive growth and marketing automation platform powering every customer-acquisition and engagement workflow across the MCV.ONE ecosystem. It unifies **13 interconnected submodules** — ads, affiliates, attribution, content, creative, education, email-campaigns, marketing, referrals, seo, sms, social, and website — into a cohesive system that orchestrates multi-channel campaigns, tracks attribution across touchpoints, manages affiliate and referral programs, automates email and SMS outreach, schedules social media, optimizes SEO, hosts educational content, and builds landing pages.

### Implementation Goals

- **Unified Customer Profiles** — Single view merging identity, behavioural, and web3 data across all touchpoints
- **Multi-Channel Orchestration** — Campaign management spanning email, SMS, push, social, and in-app channels
- **Full-Funnel Attribution** — Multi-touch attribution models connecting ad spend to revenue
- **Automated Workflows** — Visual journey builders, drip sequences, and event-triggered automations
- **Revenue Programmes** — Affiliate and referral systems with multi-tier commissions and fraud detection
- **Content Pipeline** — From ideation through creation, scheduling, and performance tracking
- **Web3-Native Features** — Wallet-based segmentation, NFT certificate rewards, token-gated content

### Submodule Summary

| # | Submodule | Core Responsibility |
|---|-----------|-------------------|
| 1 | `marketing` | Segmentation, events, A/B testing, personalization |
| 2 | `campaigns` | Multi-channel orchestration & automations |
| 3 | `email-campaigns` | MJML templates, subscribers, domains, bounces |
| 4 | `sms` | SMS/MMS messaging, A2P compliance |
| 5 | `affiliates` | Multi-tier affiliate programmes, commissions |
| 6 | `referrals` | Customer referral programmes, codes, rewards |
| 7 | `attribution` | Multi-touch attribution models |
| 8 | `ads` | Google, Meta, TikTok, LinkedIn, Twitter integrations |
| 9 | `seo` | Site audits, keyword tracking, backlinks |
| 10 | `social` | Multi-platform social media management |
| 11 | `content` | Content marketing calendar, briefs, workflows |
| 12 | `creative` | Brand voice, DAM, AI asset generation |
| 13 | `education` | LMS courses, lessons, NFT certificates |
| 14 | `website` | Landing pages, blocks, forms, domains |

---

## Prerequisites

### Infrastructure Dependencies

| Dependency | Purpose | Version |
|-----------|---------|---------|
| `@mcv/kernel` | Database context, base columns, multi-tenancy | ≥1.0.0 |
| `@mcv/auth` | Authentication, RBAC, RLS policies | ≥1.0.0 |
| `@mcv/comms` | Email (SendGrid), SMS (Twilio), push notifications | ≥1.0.0 |
| `@mcv/storage` | File storage, CDN, signed URLs | ≥1.0.0 |
| `@mcv/analytics` | Event ingestion, funnel tracking, real-time streams | ≥1.0.0 |
| `@mcv/fabric` | Event bus (Redpanda/Kafka), audit trail | ≥1.0.0 |
| Supabase/PostgreSQL | Primary data store with RLS | 15+ |
| Drizzle ORM | Schema definitions, migrations, queries | ≥0.29.0 |
| Redis | Caching, rate limiting, session state | ≥7.0 |
| BullMQ | Job queues, campaign send pipelines | ≥4.0.0 |
| Zod | Runtime schema validation | ≥3.22.0 |

### External Provider Accounts

| Provider | Submodule | Purpose |
|---------|-----------|---------|
| SendGrid | email-campaigns | Email delivery, DKIM/SPF, bounce handling |
| Twilio | sms | SMS/MMS, A2P 10DLC compliance |
| Google Ads API | ads | Campaign sync, bid management, insights |
| Meta Ads API | ads | Facebook/Instagram campaign management |
| TikTok Marketing API | ads | TikTok ad management |
| LinkedIn Marketing API | ads | LinkedIn campaign management |
| Twitter Ads API | ads | Twitter campaign management |
| Facebook Graph API | social | Facebook page management |
| Instagram Graph API | social | Instagram content publishing |
| YouTube Data API | social | YouTube channel management |
| OpenAI | creative, content | AI content generation, embeddings |
| Mux | education | Video hosting & streaming |

### Team & Skills

- 2–3 Backend engineers (Node.js, PostgreSQL, Drizzle ORM, BullMQ)
- 1–2 Frontend engineers (React, TanStack Query, MJML)
- 1 Integration specialist (third-party APIs, OAuth flows)
- 1 QA engineer (end-to-end testing, compliance validation)

---

## Phase 1 — Foundation (Weeks 1–4)

### Objective

Build the foundational content management, email campaign, and basic SEO infrastructure. Establish the database schema, core services, and the marketing backbone that all other submodules depend on.

### 1.1 — Database Schema & Migrations

**Duration:** Week 1
**Submodules:** marketing, email-campaigns, content, seo

```typescript
// Example: Growth segment schema (Drizzle ORM)
import { pgTable, text, uuid, jsonb, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const growthSegments = pgTable('growth_segments', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  conditions: jsonb('conditions').notNull().$type<SegmentCondition[]>(),
  isStatic: boolean('is_static').default(false),
  memberCount: integer('member_count').default(0),
  lastComputedAt: timestamp('last_computed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// RLS Policy: Tenant isolation
// CREATE POLICY growth_segments_tenant ON growth_segments
//   USING (venture_id = current_setting('app.venture_id')::text);
```

**Tasks:**
- [ ] Create all Phase 1 Drizzle schema definitions (segments, audiences, marketing_events, ab_tests)
- [ ] Create email schema (email_templates, email_subscribers, email_lists, email_domains, email_bounces)
- [ ] Create content schema (content_briefs, content_assets, brand_voices)
- [ ] Create SEO schema (seo_audits, keywords, backlinks, site_health)
- [ ] Generate and test migrations against Supabase
- [ ] Apply RLS policies for multi-tenant isolation on all tables
- [ ] Seed development data for each venture

### 1.2 — Content CMS (content, creative)

**Duration:** Weeks 1–2
**Services:** `ContentService`, `CreativeService`

```typescript
// Content service — calendar, briefs, workflow management
export class ContentService {
  async createBrief(input: CreateBriefInput): Promise<ContentBrief> {
    const validated = createBriefSchema.parse(input);
    const brief = await this.db.insert(contentBriefs).values({
      ventureId: validated.ventureId,
      title: validated.title,
      topic: validated.topic,
      targetKeywords: validated.targetKeywords,
      status: 'draft',
      assigneeId: validated.assigneeId,
      dueDate: validated.dueDate,
      outline: validated.outline,
    }).returning();

    await this.eventBus.emit('growth.content.brief_created', {
      briefId: brief[0].id,
      ventureId: validated.ventureId,
    });

    return brief[0];
  }

  async advanceWorkflow(briefId: string, action: WorkflowAction): Promise<ContentBrief> {
    // draft → writing → review → approved → published
    const brief = await this.getBrief(briefId);
    const nextStatus = this.resolveNextStatus(brief.status, action);

    return this.db.update(contentBriefs)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(contentBriefs.id, briefId))
      .returning();
  }

  async getCalendar(ventureId: string, range: DateRange): Promise<CalendarEntry[]> {
    return this.db.select()
      .from(contentBriefs)
      .where(and(
        eq(contentBriefs.ventureId, ventureId),
        gte(contentBriefs.dueDate, range.start),
        lte(contentBriefs.dueDate, range.end),
      ))
      .orderBy(asc(contentBriefs.dueDate));
  }
}
```

**Tasks:**
- [ ] Implement `ContentService` with CRUD for briefs, calendar, and workflow pipeline
- [ ] Implement `CreativeService` with brand voice management and DAM (Digital Asset Management)
- [ ] Build content calendar view component (`ContentCalendarView`)
- [ ] Build creative library component (`CreativeLibrary`)
- [ ] Integrate with `@mcv/storage` for asset upload/CDN delivery
- [ ] Add OpenAI integration for brand voice embedding generation
- [ ] Write Zod validation schemas for all content inputs
- [ ] Unit tests for workflow state machine transitions

### 1.3 — Email Campaigns (email-campaigns)

**Duration:** Weeks 2–3
**Services:** `EmailTemplateService`, `EmailSubscriberService`

```typescript
// Email template service with MJML rendering
export class EmailTemplateService {
  async createTemplate(input: CreateTemplateInput): Promise<EmailTemplate> {
    const validated = createTemplateSchema.parse(input);

    // Compile MJML to HTML for preview
    const { html, errors } = mjml2html(validated.mjmlContent);
    if (errors.length > 0) {
      throw new ValidationError('Invalid MJML template', errors);
    }

    return this.db.insert(emailTemplates).values({
      ventureId: validated.ventureId,
      name: validated.name,
      subject: validated.subject,
      mjmlContent: validated.mjmlContent,
      htmlContent: html,
      category: validated.category,
      variables: validated.variables, // {{ firstName }}, {{ companyName }}, etc.
    }).returning();
  }

  async renderTemplate(templateId: string, variables: Record<string, string>): Promise<string> {
    const template = await this.getTemplate(templateId);
    let html = template.htmlContent;

    for (const [key, value] of Object.entries(variables)) {
      html = html.replaceAll(`{{ ${key} }}`, escapeHtml(value));
    }

    return html;
  }
}
```

**Tasks:**
- [ ] Implement `EmailTemplateService` with MJML compilation and variable rendering
- [ ] Implement `EmailSubscriberService` with subscription lifecycle management
- [ ] Build list management (create, import CSV, segment-based sync)
- [ ] Implement email domain verification (DKIM/SPF/DMARC)
- [ ] Build bounce handling webhook consumer (SendGrid events)
- [ ] Build `EmailEditor` component with MJML live preview
- [ ] Implement double opt-in flow for GDPR compliance
- [ ] Integrate with `@mcv/comms` SendGrid adapter
- [ ] Add suppression list management (unsubscribes, complaints, bounces)

### 1.4 — Basic SEO (seo)

**Duration:** Weeks 3–4
**Services:** `SEOService`

```typescript
// SEO service — site audits, keyword tracking, backlinks
export class SEOService {
  async runAudit(input: RunAuditInput): Promise<SEOAudit> {
    const validated = runAuditSchema.parse(input);

    const audit = await this.db.insert(seoAudits).values({
      ventureId: validated.ventureId,
      siteUrl: validated.siteUrl,
      status: 'running',
    }).returning();

    // Queue the crawl job
    await this.crawlQueue.add('seo-crawl', {
      auditId: audit[0].id,
      siteUrl: validated.siteUrl,
      maxPages: validated.maxPages ?? 500,
      rules: SEO_AUDIT_RULES,
    });

    return audit[0];
  }

  async trackKeyword(input: TrackKeywordInput): Promise<Keyword> {
    const validated = trackKeywordSchema.parse(input);
    return this.db.insert(keywords).values({
      ventureId: validated.ventureId,
      keyword: validated.keyword,
      targetUrl: validated.targetUrl,
      searchEngine: validated.searchEngine ?? 'google',
      location: validated.location ?? 'US',
    }).returning();
  }

  async getKeywordRankings(ventureId: string): Promise<KeywordRanking[]> {
    return this.db.select()
      .from(keywords)
      .leftJoin(keywordRankings, eq(keywords.id, keywordRankings.keywordId))
      .where(eq(keywords.ventureId, ventureId))
      .orderBy(desc(keywordRankings.checkedAt));
  }
}
```

**Tasks:**
- [ ] Implement `SEOService` with site audit engine (crawl, analyze, score)
- [ ] Build keyword tracking with rank checking (Google SERP API integration)
- [ ] Implement backlink monitoring and discovery
- [ ] Build site health scoring algorithm (performance, accessibility, SEO, best practices)
- [ ] Build `SEOAuditPanel` component with issue categorization
- [ ] Build keyword tracking dashboard with historical rank charts
- [ ] Implement automated daily rank checking via cron jobs
- [ ] Write audit rule engine (title length, meta description, H1 usage, image alt text, etc.)

### 1.5 — Marketing Core (marketing)

**Duration:** Weeks 2–4
**Services:** `SegmentService`, `EventTrackingService`, `PersonalizationService`, `ABTestService`

**Tasks:**
- [ ] Implement `SegmentService` with dynamic and static segment creation
- [ ] Build segment condition evaluator (property, event, behaviour-based rules)
- [ ] Implement `EventTrackingService` for ingesting marketing events from all channels
- [ ] Build `PersonalizationService` with audience-based content variation
- [ ] Implement `ABTestService` with statistical significance calculation
- [ ] Build `SegmentBuilder` component with visual condition builder
- [ ] Emit events to `@mcv/fabric` for cross-domain consumption
- [ ] Implement segment membership recomputation (background job via BullMQ)
- [ ] Add Redis caching for segment membership lookups (hot path)

### Phase 1 Deliverables

| Deliverable | Status |
|------------|--------|
| Database schema for 4 submodules (marketing, email, content, seo) | ⬜ |
| Content CMS with calendar, briefs, and workflow pipeline | ⬜ |
| Email campaign system with MJML templates and subscriber management | ⬜ |
| SEO audit engine with keyword tracking | ⬜ |
| Marketing core with segments, events, and A/B testing | ⬜ |
| RLS policies and multi-tenant isolation | ⬜ |
| React components: ContentCalendar, EmailEditor, SEOAuditPanel, SegmentBuilder | ⬜ |
| Unit tests with ≥80% coverage | ⬜ |

---

## Phase 2 — Core (Weeks 5–8)

### Objective

Build the core revenue-generating submodules: advertising integrations, social media management, referral and affiliate programmes, multi-touch attribution, SMS messaging, and campaign orchestration engine.

### 2.1 — Advertising Platform Integrations (ads)

**Duration:** Weeks 5–6
**Services:** `AdManagerService`

```typescript
// Ad manager service — multi-platform ad account management
export class AdManagerService {
  async connectAccount(input: ConnectAdAccountInput): Promise<AdAccount> {
    const validated = connectAdAccountSchema.parse(input);
    const provider = this.getProvider(validated.provider); // google | meta | tiktok | linkedin | twitter

    // OAuth flow → store encrypted tokens
    const credentials = await provider.exchangeCode(validated.authCode);

    const account = await this.db.insert(adAccounts).values({
      ventureId: validated.ventureId,
      provider: validated.provider,
      externalAccountId: credentials.accountId,
      name: credentials.accountName,
      credentials: await this.encrypt(credentials),
      status: 'active',
    }).returning();

    // Initial campaign sync
    await this.syncQueue.add('ad-sync', {
      accountId: account[0].id,
      provider: validated.provider,
    });

    return account[0];
  }

  async syncCampaigns(accountId: string): Promise<AdCampaign[]> {
    const account = await this.getAccount(accountId);
    const provider = this.getProvider(account.provider);
    const credentials = await this.decrypt(account.credentials);

    const externalCampaigns = await provider.listCampaigns(credentials);

    return this.db.transaction(async (tx) => {
      const synced: AdCampaign[] = [];
      for (const ext of externalCampaigns) {
        const campaign = await tx.insert(adCampaigns)
          .values({
            accountId: account.id,
            ventureId: account.ventureId,
            externalCampaignId: ext.id,
            name: ext.name,
            status: ext.status,
            budget: ext.budget,
            spend: ext.spend,
          })
          .onConflictDoUpdate({
            target: [adCampaigns.accountId, adCampaigns.externalCampaignId],
            set: { name: ext.name, status: ext.status, budget: ext.budget, spend: ext.spend },
          })
          .returning();
        synced.push(campaign[0]);
      }
      return synced;
    });
  }

  async getInsights(campaignId: string, dateRange: DateRange): Promise<AdInsight[]> {
    return this.db.select()
      .from(adInsights)
      .where(and(
        eq(adInsights.campaignId, campaignId),
        gte(adInsights.date, dateRange.start),
        lte(adInsights.date, dateRange.end),
      ))
      .orderBy(asc(adInsights.date));
  }
}
```

**Tasks:**
- [ ] Implement Google Ads API adapter (OAuth, campaign CRUD, insights)
- [ ] Implement Meta Ads API adapter (Facebook & Instagram)
- [ ] Implement TikTok Marketing API adapter
- [ ] Implement LinkedIn Marketing API adapter
- [ ] Implement Twitter Ads API adapter
- [ ] Build unified `AdManagerService` with provider abstraction
- [ ] Implement encrypted credential storage for OAuth tokens
- [ ] Build automated campaign sync (hourly via BullMQ cron)
- [ ] Build insight aggregation pipeline (daily metrics pull)
- [ ] Build `AdDashboard` component with cross-platform metrics
- [ ] Add spend alert system (budget thresholds, anomaly detection)

### 2.2 — Social Media Management (social)

**Duration:** Weeks 5–6
**Services:** `SocialConnectorService`

**Tasks:**
- [ ] Implement `SocialConnectorService` with 6-platform support (Facebook, Instagram, Twitter, LinkedIn, YouTube, TikTok)
- [ ] Build OAuth connection flow for each platform
- [ ] Implement post scheduling with timezone-aware delivery
- [ ] Build multi-platform publishing (compose once, publish to many)
- [ ] Implement social inbox for comment/DM management
- [ ] Build engagement analytics aggregation
- [ ] Build `SocialScheduler` component with calendar view
- [ ] Build `SocialInbox` component with unified thread view
- [ ] Implement media upload with platform-specific format validation
- [ ] Add rate limiting per platform API quota

### 2.3 — Referral & Affiliate Programs (referrals, affiliates)

**Duration:** Weeks 6–7
**Services:** `ReferralService`, `AffiliateService`

```typescript
// Referral service — viral loop engine
export class ReferralService {
  async createProgram(input: CreateReferralProgramInput): Promise<ReferralProgram> {
    const validated = createProgramSchema.parse(input);
    return this.db.insert(referralPrograms).values({
      ventureId: validated.ventureId,
      name: validated.name,
      rewardType: validated.rewardType, // 'points' | 'discount' | 'credit' | 'token'
      referrerReward: validated.referrerReward,
      refereeReward: validated.refereeReward,
      maxRewardsPerReferrer: validated.maxRewardsPerReferrer,
      qualificationEvent: validated.qualificationEvent, // e.g., 'first_purchase'
      status: 'active',
    }).returning();
  }

  async generateCode(userId: string, programId: string): Promise<ReferralCode> {
    const code = this.generateUniqueCode(); // e.g., "EDGE-A3X9"
    return this.db.insert(referralCodes).values({
      programId,
      userId,
      code,
      usageCount: 0,
    }).returning();
  }

  async trackReferral(code: string, refereeId: string): Promise<Referral> {
    const referralCode = await this.getCodeByValue(code);
    if (!referralCode) throw new NotFoundError('Invalid referral code');

    // Prevent self-referral
    if (referralCode.userId === refereeId) {
      throw new ValidationError('Cannot refer yourself');
    }

    // Check for duplicate referral
    const existing = await this.db.select()
      .from(referrals)
      .where(and(
        eq(referrals.codeId, referralCode.id),
        eq(referrals.refereeId, refereeId),
      ));
    if (existing.length > 0) throw new ValidationError('Already referred');

    return this.db.insert(referrals).values({
      programId: referralCode.programId,
      codeId: referralCode.id,
      referrerId: referralCode.userId,
      refereeId,
      status: 'pending', // → 'qualified' when event fires
    }).returning();
  }
}
```

**Tasks:**
- [ ] Implement `ReferralService` with program creation, code generation, and tracking
- [ ] Build referral qualification engine (event-based reward triggering)
- [ ] Implement fraud detection for referrals (IP, device fingerprint, velocity)
- [ ] Implement `AffiliateService` with multi-tier commission structures
- [ ] Build affiliate link tracking with click-through attribution
- [ ] Implement commission calculation engine (flat, percentage, tiered)
- [ ] Build automated payout scheduling with minimum thresholds
- [ ] Build `ReferralWidget` embeddable component
- [ ] Build `AffiliateDashboard` component with earnings, clicks, conversions
- [ ] Add Redpanda event consumers for qualification triggers

### 2.4 — Multi-Touch Attribution (attribution)

**Duration:** Weeks 7–8
**Services:** `AttributionService`

```typescript
// Attribution service — multi-touch model computation
export class AttributionService {
  async recordTouchpoint(input: RecordTouchpointInput): Promise<TouchPoint> {
    const validated = touchpointSchema.parse(input);
    return this.db.insert(touchpoints).values({
      ventureId: validated.ventureId,
      userId: validated.userId,
      channel: validated.channel,
      source: validated.source,
      medium: validated.medium,
      campaign: validated.campaign,
      referrer: validated.referrer,
      timestamp: validated.timestamp ?? new Date(),
    }).returning();
  }

  async computeAttribution(
    conversionId: string,
    modelType: AttributionModelType,
  ): Promise<AttributionResult[]> {
    const conversion = await this.getConversion(conversionId);
    const touchpointList = await this.getTouchpointsForUser(
      conversion.userId,
      conversion.ventureId,
      { before: conversion.convertedAt },
    );

    switch (modelType) {
      case 'first_touch':
        return [{ touchpointId: touchpointList[0].id, credit: 1.0 }];
      case 'last_touch':
        return [{ touchpointId: touchpointList[touchpointList.length - 1].id, credit: 1.0 }];
      case 'linear':
        const equalCredit = 1.0 / touchpointList.length;
        return touchpointList.map(tp => ({ touchpointId: tp.id, credit: equalCredit }));
      case 'time_decay':
        return this.computeTimeDecay(touchpointList, conversion.convertedAt);
      case 'position_based':
        return this.computePositionBased(touchpointList); // 40-20-40 U-shape
      default:
        throw new ValidationError(`Unknown model: ${modelType}`);
    }
  }
}
```

**Tasks:**
- [ ] Implement `AttributionService` with 5 attribution models
- [ ] Build touchpoint ingestion pipeline (pixel tracking, UTM parsing, referrer extraction)
- [ ] Implement conversion event tracking with touchpoint association
- [ ] Build channel performance aggregation (ROI, ROAS per channel)
- [ ] Build `AttributionReport` component with model comparison view
- [ ] Implement custom attribution model configuration
- [ ] Add real-time touchpoint streaming via Redpanda
- [ ] Build attribution window configuration (7-day, 30-day, 90-day lookback)

### 2.5 — Campaign Orchestration (campaigns)

**Duration:** Weeks 7–8
**Services:** `CampaignService`, `AutomationService`

**Tasks:**
- [ ] Implement `CampaignService` with multi-channel send pipeline
- [ ] Build campaign audience resolution (segment → contact list → dedup → suppression)
- [ ] Implement BullMQ-based send queue with throttling and rate limiting
- [ ] Build `AutomationService` with trigger-based workflow execution
- [ ] Implement journey canvas data model (nodes, edges, conditions)
- [ ] Build `CampaignBuilder` component with audience, content, and schedule steps
- [ ] Build `JourneyCanvas` visual automation builder
- [ ] Implement webhook delivery tracking (opens, clicks, bounces, conversions)
- [ ] Add A/B testing for campaign messages (subject lines, content variants)

### 2.6 — SMS Messaging (sms)

**Duration:** Week 8
**Services:** `SMSService`

**Tasks:**
- [ ] Implement `SMSService` with Twilio integration via `@mcv/comms`
- [ ] Build A2P 10DLC compliance flow (brand registration, campaign registration)
- [ ] Implement opt-out management (STOP keyword handling)
- [ ] Build SMS template management with variable substitution
- [ ] Build `SMSComposer` component with character count and segment preview
- [ ] Implement two-way SMS conversation threading
- [ ] Add SMS analytics (delivery rate, opt-out rate, response rate)

### Phase 2 Deliverables

| Deliverable | Status |
|------------|--------|
| 5 ad platform integrations with unified dashboard | ⬜ |
| Social media management for 6 platforms | ⬜ |
| Referral programme engine with fraud detection | ⬜ |
| Affiliate programme with multi-tier commissions | ⬜ |
| Multi-touch attribution with 5 models | ⬜ |
| Campaign orchestration with BullMQ pipeline | ⬜ |
| SMS messaging with A2P compliance | ⬜ |
| React components: AdDashboard, SocialScheduler, ReferralWidget, AttributionReport | ⬜ |

---

## Phase 3 — Advanced (Weeks 9–12)

### Objective

Implement AI-powered features, predictive attribution, automated campaign optimization, the education LMS, the website builder, and cross-venture growth insights.

### 3.1 — AI Content Generation (content, creative)

**Duration:** Weeks 9–10

```typescript
// AI-powered content generation
export class AIContentService {
  async generateBlogPost(input: GenerateContentInput): Promise<GeneratedContent> {
    const validated = generateContentSchema.parse(input);
    const brandVoice = await this.creativeService.getBrandVoice(validated.ventureId);

    const prompt = this.buildPrompt({
      topic: validated.topic,
      keywords: validated.targetKeywords,
      tone: brandVoice.tone,
      audience: validated.targetAudience,
      length: validated.wordCount,
      format: validated.format, // blog, social, email, ad copy
    });

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: brandVoice.systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: validated.wordCount * 2,
    });

    const content = completion.choices[0].message.content;

    // Auto-generate SEO metadata
    const seoMeta = await this.generateSEOMeta(content, validated.targetKeywords);

    return {
      content,
      seoMeta,
      wordCount: content.split(/\s+/).length,
      readabilityScore: this.calculateReadability(content),
      keywordDensity: this.calculateKeywordDensity(content, validated.targetKeywords),
    };
  }

  async generateSocialVariants(
    content: string,
    platforms: SocialPlatform[],
  ): Promise<Record<SocialPlatform, string>> {
    const variants: Record<string, string> = {};
    for (const platform of platforms) {
      const charLimit = PLATFORM_CHAR_LIMITS[platform];
      variants[platform] = await this.summarizeForPlatform(content, platform, charLimit);
    }
    return variants as Record<SocialPlatform, string>;
  }
}
```

**Tasks:**
- [ ] Implement AI content generation service with OpenAI integration
- [ ] Build brand voice training from existing content (embedding-based)
- [ ] Implement multi-format generation (blog, social, email, ad copy, video script)
- [ ] Build SEO-optimized content generation with keyword targeting
- [ ] Implement content scoring (readability, keyword density, SEO score)
- [ ] Build social platform content adaptation (auto-resize for each platform)
- [ ] Add human-in-the-loop review workflow
- [ ] Implement content performance prediction based on historical data

### 3.2 — Predictive Attribution (attribution)

**Duration:** Weeks 10–11

**Tasks:**
- [ ] Build ML-powered attribution model using historical conversion data
- [ ] Implement Markov chain attribution (data-driven model)
- [ ] Build budget optimization recommendations based on attribution insights
- [ ] Implement predictive conversion scoring (likelihood to convert per channel)
- [ ] Build channel mix modelling (optimal budget allocation)
- [ ] Add real-time attribution dashboard with predicted ROI
- [ ] Implement attribution model A/B testing (compare model accuracy)

### 3.3 — Automated Campaign Optimization

**Duration:** Weeks 10–11

```typescript
// Campaign auto-optimization engine
export class CampaignOptimizer {
  async optimizeSendTime(campaignId: string): Promise<OptimalSendTime> {
    const campaign = await this.campaignService.getCampaign(campaignId);
    const segmentMembers = await this.segmentService.getMembers(campaign.segmentId);

    // Analyze historical open/click patterns per timezone
    const engagementPatterns = await this.analyticsService.getEngagementPatterns(
      segmentMembers.map(m => m.userId),
      campaign.channel,
    );

    // Compute optimal send window per timezone bucket
    const optimalWindows = this.computeOptimalWindows(engagementPatterns);

    return {
      campaignId,
      windows: optimalWindows,
      expectedLift: this.estimateLift(engagementPatterns, optimalWindows),
    };
  }

  async autoOptimizeSubject(campaignId: string): Promise<SubjectOptimization> {
    const campaign = await this.campaignService.getCampaign(campaignId);

    // Generate subject line variants using AI
    const variants = await this.aiService.generateSubjectVariants(
      campaign.messages[0].subject,
      5, // number of variants
    );

    // Set up automated A/B test
    const abTest = await this.abTestService.create({
      campaignId,
      variants: variants.map(v => ({
        subject: v,
        percentage: 10, // 10% each to test
      })),
      winnerPercentage: 50, // send remaining 50% to winner
      metric: 'open_rate',
      durationHours: 4, // evaluate after 4 hours
    });

    return { abTest, variants };
  }
}
```

**Tasks:**
- [ ] Build send-time optimization engine (per-user optimal send windows)
- [ ] Implement subject line auto-optimization with AI-generated variants
- [ ] Build automated A/B test winner selection and rollout
- [ ] Implement campaign fatigue detection (frequency capping per user)
- [ ] Build smart segmentation recommendations (look-alike audiences)
- [ ] Implement campaign performance prediction before send
- [ ] Add automated budget reallocation for ad campaigns

### 3.4 — Cross-Venture Growth Insights

**Duration:** Weeks 11–12

**Tasks:**
- [ ] Build unified growth dashboard aggregating metrics across all 9 ventures
- [ ] Implement cross-venture audience overlap analysis
- [ ] Build venture comparison metrics (CAC, LTV, conversion rates)
- [ ] Implement cross-pollination recommendations (promote venture B to venture A users)
- [ ] Build unified customer journey mapping across ventures
- [ ] Add cohort analysis with venture-level segmentation
- [ ] Implement growth anomaly detection and alerting
- [ ] Build `MarketingDashboard` component with cross-venture views

### 3.5 — Education LMS (education)

**Duration:** Weeks 11–12
**Services:** `EducationService`

**Tasks:**
- [ ] Implement `EducationService` with course, module, and lesson management
- [ ] Build video hosting integration (Mux for adaptive streaming)
- [ ] Implement enrollment tracking with progress persistence
- [ ] Build quiz engine with multiple question types
- [ ] Implement NFT certificate generation on course completion
- [ ] Build `CoursePlayer` component with video player, quiz, and progress
- [ ] Add learning path recommendations based on user behaviour
- [ ] Implement instructor analytics (enrollment, completion, ratings)

### 3.6 — Website Builder (website)

**Duration:** Weeks 11–12
**Services:** `WebsiteService`

**Tasks:**
- [ ] Implement `WebsiteService` with page, block, and form management
- [ ] Build drag-and-drop page builder with reusable block components
- [ ] Implement custom domain mapping with SSL certificate provisioning
- [ ] Build form integration (connect to segments, trigger automations)
- [ ] Implement page versioning and A/B testing
- [ ] Build `WebsiteEditor` component with live preview
- [ ] Add SEO metadata management per page
- [ ] Implement analytics tracking (page views, form conversions, heatmaps)

### Phase 3 Deliverables

| Deliverable | Status |
|------------|--------|
| AI content generation with brand voice training | ⬜ |
| Predictive attribution with ML models | ⬜ |
| Automated campaign optimization (send time, subject, budget) | ⬜ |
| Cross-venture growth insights dashboard | ⬜ |
| Education LMS with NFT certificates | ⬜ |
| Website builder with drag-and-drop editor | ⬜ |

---

## Phase 4 — Polish & Hardening (Weeks 13–14)

### Objective

Performance optimization, security hardening, documentation, and production readiness.

### 4.1 — Performance Optimization

**Tasks:**
- [ ] Optimize segment computation (batch processing, incremental updates)
- [ ] Add Redis caching for hot-path queries (dashboard metrics, segment membership)
- [ ] Implement database query optimization (EXPLAIN ANALYZE, index tuning)
- [ ] Add connection pooling configuration (PgBouncer)
- [ ] Implement campaign send pipeline benchmarking (target: 100K emails/hour)
- [ ] Add CDN caching for creative assets and email images
- [ ] Optimize social media sync with incremental delta updates
- [ ] Add BullMQ dashboard for queue monitoring

### 4.2 — Security Hardening

**Tasks:**
- [ ] Audit all RLS policies for proper tenant isolation
- [ ] Implement rate limiting on all public API endpoints
- [ ] Add input sanitization for user-generated content (XSS prevention)
- [ ] Encrypt all OAuth tokens and API keys at rest
- [ ] Implement audit logging for all admin actions
- [ ] Add GDPR compliance features (data export, right to deletion, consent management)
- [ ] Implement webhook signature verification for all providers
- [ ] Add CSRF protection for form submissions
- [ ] Security review of email template rendering (prevent injection)

### 4.3 — Documentation & DevEx

**Tasks:**
- [ ] Write API documentation for all tRPC routes
- [ ] Create integration guides for each ad/social provider
- [ ] Document campaign workflow best practices
- [ ] Write troubleshooting guides for common issues
- [ ] Create developer onboarding guide with local setup instructions
- [ ] Document all event types emitted to `@mcv/fabric`
- [ ] Add JSDoc comments for all public service methods

### 4.4 — Monitoring & Observability

**Tasks:**
- [ ] Add structured logging for all services (campaign sends, ad syncs, errors)
- [ ] Implement health check endpoints for all background workers
- [ ] Add Prometheus metrics (campaign throughput, queue depth, error rates)
- [ ] Configure alerts for: bounce rate spikes, ad account disconnections, queue backlogs
- [ ] Implement campaign delivery reporting (sent, delivered, opened, clicked, bounced)
- [ ] Add provider status monitoring (SendGrid, Twilio, ad platform health)

---

## Testing Strategy

### Unit Tests

| Area | Target Coverage | Key Test Scenarios |
|------|---------------|--------------------|
| Segment condition evaluator | 95% | Complex AND/OR conditions, nested rules, edge cases |
| Attribution model computation | 95% | All 5 models, edge cases (single touchpoint, 100+ touchpoints) |
| Email template rendering | 90% | Variable substitution, MJML compilation, XSS prevention |
| Referral fraud detection | 90% | Self-referral, duplicate, velocity, IP clustering |
| Commission calculation | 95% | Flat, percentage, tiered, multi-level |
| Campaign send pipeline | 90% | Audience resolution, suppression, throttling, retries |

### Integration Tests

```typescript
// Example: Campaign send pipeline integration test
describe('CampaignService.send', () => {
  it('should resolve audience, suppress bounces, and queue messages', async () => {
    // Setup
    const segment = await createTestSegment({ memberCount: 100 });
    const template = await createTestEmailTemplate();
    const campaign = await campaignService.create({
      ventureId: TEST_VENTURE_ID,
      name: 'Test Campaign',
      channel: 'email',
      segmentId: segment.id,
      templateId: template.id,
    });

    // Add some bounced addresses to suppression list
    await addBouncedEmails(['bounced@example.com', 'invalid@test.com']);

    // Execute
    const result = await campaignService.send(campaign.id);

    // Assert
    expect(result.totalRecipients).toBe(100);
    expect(result.suppressed).toBeGreaterThanOrEqual(2);
    expect(result.queued).toBeLessThanOrEqual(98);

    // Verify BullMQ jobs were created
    const jobs = await emailSendQueue.getJobs(['waiting']);
    expect(jobs.length).toBe(result.queued);
  });
});
```

### End-to-End Tests

- [ ] Full campaign lifecycle: create → schedule → send → track opens/clicks → report
- [ ] Referral flow: generate code → share → signup → qualify → reward distribution
- [ ] Affiliate flow: signup → get links → clicks → conversion → commission → payout
- [ ] SEO audit: submit URL → crawl → analyze → generate report → track fixes
- [ ] Social media: connect account → compose post → schedule → publish → track engagement

### Load Tests

- [ ] Campaign send pipeline: 100,000 messages/hour sustained throughput
- [ ] Event ingestion: 10,000 marketing events/second peak
- [ ] Segment computation: 1M member segments in < 30 seconds
- [ ] Ad sync: 1,000 campaigns across 5 providers in < 5 minutes

---

## Acceptance Criteria

### Phase 1 (Foundation)

- [ ] Content CMS supports creating, editing, and publishing briefs with a 5-status workflow
- [ ] Email template editor renders MJML in real-time with variable preview
- [ ] Email subscriber management supports import (CSV), double opt-in, and suppression
- [ ] SEO audit engine crawls up to 500 pages and produces actionable issue reports
- [ ] Keyword tracking updates daily with historical rank history
- [ ] Segment builder supports property, event, and behaviour-based conditions
- [ ] All tables have RLS policies enforcing `venture_id` isolation
- [ ] All inputs validated with Zod schemas (no raw data reaches the database)

### Phase 2 (Core)

- [ ] At least 3 ad platforms connected and syncing campaigns/insights daily
- [ ] Social media scheduling works for at least 4 platforms with timezone support
- [ ] Referral programme generates codes, tracks signups, and distributes rewards
- [ ] Affiliate programme calculates commissions with multi-tier support
- [ ] Attribution engine computes all 5 models with matching results to manual calculation
- [ ] Campaign pipeline sends 10,000+ emails without errors in a test run
- [ ] SMS messaging sends/receives with opt-out compliance

### Phase 3 (Advanced)

- [ ] AI generates blog posts matching brand voice with ≥80% editor approval rate
- [ ] Predictive attribution provides actionable channel recommendations
- [ ] Send-time optimization improves open rate by ≥5% in A/B test
- [ ] Cross-venture dashboard loads within 3 seconds for all ventures
- [ ] Education course completion triggers NFT certificate minting
- [ ] Website builder produces pages with ≥90 Lighthouse performance score

### Phase 4 (Polish)

- [ ] All services have structured logging and health checks
- [ ] No P0 security issues in penetration test
- [ ] API documentation covers 100% of public endpoints
- [ ] Campaign send pipeline sustains 100K emails/hour under load test

---

## Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Ad platform API rate limits** | High | Medium | Implement exponential backoff, request budgeting, and credential rotation across multiple app IDs |
| **Email deliverability issues** | Medium | High | Dedicated IP warmup plan, DKIM/SPF/DMARC setup, bounce handling, SendGrid reputation monitoring |
| **Social platform API deprecation** | Medium | Medium | Abstract provider interface, maintain compatibility layers, monitor platform developer changelogs |
| **GDPR compliance gaps** | Low | Critical | Legal review of data flows, implement consent management, right-to-deletion pipeline, DPA with providers |
| **Attribution data accuracy** | Medium | High | Cross-validate with platform-reported conversions, implement data quality monitoring, reconciliation |
| **Campaign send pipeline failure** | Low | Critical | Idempotent job processing, dead-letter queues, automatic retries, manual re-send capability |
| **AI content quality** | Medium | Medium | Human review workflow, brand voice fine-tuning, content scoring thresholds, editor approval gates |
| **Third-party provider downtime** | Medium | Medium | Circuit breakers, fallback providers (Postmark for email, Vonage for SMS), queue-based retry |
| **Data volume scaling** | Medium | High | Partition large tables (touchpoints, events), implement data archival, optimize indexes, read replicas |
| **Multi-tenant data leakage** | Low | Critical | Mandatory RLS on all tables, automated RLS policy testing, penetration testing, audit logging |

---

## Timeline & Milestones

```
Week  1  ┃  2  ┃  3  ┃  4  ┃  5  ┃  6  ┃  7  ┃  8  ┃  9  ┃  10 ┃  11 ┃  12 ┃  13 ┃  14
━━━━━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━╋━━━━━
DB Schema ██                                                                              
Content   ██████████                                                                       
Email     ░░░░░██████████                                                                  
SEO       ░░░░░░░░░░██████████                                                             
Marketing ░░░░░██████████████████                                                          
Ads       ░░░░░░░░░░░░░░░░░░░░██████████                                                  
Social    ░░░░░░░░░░░░░░░░░░░░██████████                                                  
Referrals ░░░░░░░░░░░░░░░░░░░░░░░░░██████████                                             
Affiliates░░░░░░░░░░░░░░░░░░░░░░░░░██████████                                             
Attribution░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                                       
Campaigns ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                                        
SMS       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░█████                                       
AI Content░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                              
Predict.  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                        
Optimize  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                        
X-Venture ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                   
Education ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                   
Website   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████                   
Polish    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████         
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ▲           ▲                     ▲                     ▲              ▲
          M1          M2                    M3                    M4             M5

M1 (Week 1):  Schema complete, migrations applied
M2 (Week 4):  Phase 1 complete — Content, Email, SEO, Marketing core operational
M3 (Week 8):  Phase 2 complete — Ads, Social, Referrals, Attribution, Campaigns live
M4 (Week 12): Phase 3 complete — AI, Predictive, Education, Website builder
M5 (Week 14): Phase 4 complete — Production ready, all tests passing
```

### Key Milestones

| Milestone | Date | Criteria |
|-----------|------|----------|
| **M1 — Schema Ready** | Week 1 | All Drizzle schemas defined, migrations passing, RLS applied |
| **M2 — Foundation Live** | Week 4 | Content CMS, email campaigns, SEO, and marketing core operational |
| **M3 — Core Revenue** | Week 8 | Ad integrations, social management, referrals, affiliates, attribution, campaigns live |
| **M4 — AI & Advanced** | Week 12 | AI content, predictive attribution, optimization, education, website builder |
| **M5 — Production Ready** | Week 14 | Performance validated, security audited, documentation complete |

### Dependencies Between Phases

```
Phase 1 (Foundation)
  ├── marketing core (segments, events) → Required by Phase 2 campaigns
  ├── email-campaigns (templates, subscribers) → Required by Phase 2 campaigns
  └── content (CMS) → Required by Phase 3 AI content

Phase 2 (Core)
  ├── ads (insights) → Required by Phase 3 predictive attribution
  ├── campaigns (send pipeline) → Required by Phase 3 optimization
  └── attribution (touchpoints) → Required by Phase 3 predictive models

Phase 3 (Advanced)
  └── All AI/ML features → Require historical data from Phase 1 & 2
```

---

*@mcv/growth — Growth & Marketing Domain*
