# @mcv/growth — API Reference

## Tier 5: PUBLISHABLE Domains

**Package:** `@mcv/growth`
**Classification:** PUBLISHABLE
**Version:** 1.0.0
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Service Methods — ads](#ads-submodule)
3. [Service Methods — affiliates](#affiliates-submodule)
4. [Service Methods — attribution](#attribution-submodule)
5. [Service Methods — content](#content-submodule)
6. [Service Methods — creative](#creative-submodule)
7. [Service Methods — education](#education-submodule)
8. [Service Methods — email-campaigns](#email-campaigns-submodule)
9. [Service Methods — marketing](#marketing-submodule)
10. [Service Methods — referrals](#referrals-submodule)
11. [Service Methods — seo](#seo-submodule)
12. [Service Methods — sms](#sms-submodule)
13. [Service Methods — social](#social-submodule)
14. [Service Methods — website](#website-submodule)
15. [Service Methods — analytics](#analytics-submodule)
16. [Types](#types)
17. [Schemas](#schemas)
18. [Events](#events)
19. [Errors](#errors)
20. [Config](#config)

---

## API Overview

### Import Pattern

All growth services and types are exported from the package root:

```typescript
// Service singletons (server-side)
import {
  segmentService,
  eventTrackingService,
  personalizationService,
  abTestService,
  campaignService,
  automationService,
  emailTemplateService,
  emailSubscriberService,
  smsService,
  affiliateService,
  referralService,
  attributionService,
  adManagerService,
  seoService,
  socialConnectorService,
  contentService,
  creativeService,
  educationService,
  websiteService,
  marketingAnalyticsService,
} from '@mcv/growth';

// React hooks (client-side)
import {
  useCampaigns,
  useSegments,
  useEmailTemplates,
  useSocialAccounts,
  useAdAccounts,
  useAffiliates,
  useReferrals,
  useAttribution,
  useContentCalendar,
  useCreativeAssets,
  useSEODashboard,
  useMarketingDashboard,
  useEducation,
  useWebsiteBuilder,
} from '@mcv/growth';

// React components (client-side)
import {
  CampaignBuilder,
  SegmentBuilder,
  JourneyCanvas,
  EmailEditor,
  SMSComposer,
  SocialScheduler,
  SocialInbox,
  AdDashboard,
  AffiliateDashboard,
  ReferralWidget,
  AttributionReport,
  ContentCalendarView,
  CreativeLibrary,
  SEOAuditPanel,
  MarketingDashboard,
  CoursePlayer,
  WebsiteEditor,
} from '@mcv/growth';
```

### Authentication Context

All service methods operate within an authenticated context provided by `@mcv/kernel`. The current user's session and venture ID are automatically resolved from `getContext()`:

```typescript
// Automatic context resolution inside services
const ctx = getContext();
// ctx.venture.id — current venture (tenant) ID
// ctx.user?.id — current authenticated user ID
// ctx.session — full session object
```

### tRPC Router

The growth domain exposes a tRPC router at `marketing.*` with the following namespaces:

```typescript
const marketingRouter = router({
  social:    router({ listAccounts, connectAccount, postContent }),
  ads:       router({ listAccounts, connectAccount, createCampaign }),
  creative:  router({ listAssets, createAsset, listBrandVoices, generateBrief }),
  analytics: router({ getDashboard }),
});
```

All procedures use `protectedProcedure` and require an authenticated session with venture context.

---

## ads Submodule

### `AdManagerService`

Singleton: `adManagerService`

#### `connectAccount(input)`

Connect an advertising platform account via OAuth.

```typescript
async connectAccount(input: ConnectAdAccountInput): Promise<AdAccount>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | `'facebook_ads' \| 'google_ads' \| 'tiktok_ads' \| 'linkedin_ads' \| 'twitter_ads'` | Yes | Ad platform provider |
| `externalAccountId` | `string` | Yes | Provider's account identifier |
| `name` | `string` | Yes | Display name for the account |
| `accessToken` | `string` | Yes | OAuth access token (encrypted before storage) |
| `refreshToken` | `string` | No | OAuth refresh token |
| `currency` | `string` | No | Account currency (default: `USD`) |
| `timezone` | `string` | No | Account timezone (default: `UTC`) |

**Returns:** `AdAccount` — The connected account record.

**Errors:** `GROWTH_AD_ACCOUNT_DUPLICATE` (409) if account already connected.

---

#### `disconnectAccount(accountId)`

Disconnect an ad account and remove stored credentials.

```typescript
async disconnectAccount(accountId: string): Promise<void>
```

---

#### `listAccounts()`

List all connected ad accounts for the current venture.

```typescript
async listAccounts(): Promise<AdAccount[]>
```

---

#### `syncCampaigns(accountId)`

Manually trigger campaign synchronisation from the provider.

```typescript
async syncCampaigns(accountId: string): Promise<{ synced: number }>
```

---

#### `syncInsights(accountId, dateRange?)`

Pull daily insight data for all campaigns in an ad account.

```typescript
async syncInsights(
  accountId: string,
  dateRange?: { startDate: Date; endDate: Date }
): Promise<{ synced: number }>
```

---

#### `getCampaigns(accountId, options?)`

List campaigns for an ad account with optional filtering.

```typescript
async getCampaigns(
  accountId: string,
  options?: {
    status?: AdCampaignStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{ campaigns: AdCampaign[]; total: number }>
```

---

#### `getInsights(campaignId, dateRange)`

Get daily insights for a specific ad campaign.

```typescript
async getInsights(
  campaignId: string,
  dateRange: { startDate: Date; endDate: Date }
): Promise<AdInsight[]>
```

---

#### `getCrossplatformROAS(dateRange?)`

Calculate aggregate ROAS across all connected ad platforms.

```typescript
async getCrossplatformROAS(
  dateRange?: { startDate: Date; endDate: Date }
): Promise<{
  totalSpend: number;
  totalRevenue: number;
  overallROAS: number;
  byProvider: Record<string, { spend: number; revenue: number; roas: number }>;
}>
```

---

## affiliates Submodule

### `AffiliateService`

Singleton: `affiliateService`

#### `createProgram(input)`

Create a new affiliate programme.

```typescript
async createProgram(input: CreateAffiliateProgramInput): Promise<AffiliateProgram>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Programme name |
| `slug` | `string` | Yes | URL-friendly slug |
| `commissionType` | `'percentage' \| 'fixed' \| 'tiered'` | Yes | Commission structure type |
| `defaultCommissionRate` | `number` | No | Default percentage rate |
| `defaultCommissionAmount` | `number` | No | Default fixed amount |
| `tiers` | `CommissionTier[]` | No | Tiered commission brackets |
| `multiLevel` | `boolean` | No | Enable multi-level (MLM) commissions |
| `maxLevels` | `number` | No | Maximum MLM depth (default: 1) |
| `levelRates` | `number[]` | No | Commission rates per level `[L1%, L2%, ...]` |
| `cookieDuration` | `number` | No | Cookie duration in days (default: 30) |
| `minimumPayout` | `number` | No | Minimum balance for payout (default: 50) |
| `payoutFrequency` | `'weekly' \| 'bi_weekly' \| 'monthly'` | No | Payout schedule |
| `payoutDelay` | `number` | No | Hold period in days (default: 30) |
| `requireApproval` | `boolean` | No | Require manual approval (default: true) |

**Returns:** `AffiliateProgram`

---

#### `registerAffiliate(input)`

Register a new affiliate in a programme.

```typescript
async registerAffiliate(input: RegisterAffiliateInput): Promise<Affiliate>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `programId` | `string` | Yes | Programme to join |
| `email` | `string` | Yes | Affiliate's email |
| `name` | `string` | No | Affiliate's name |
| `affiliateCode` | `string` | Yes | Unique tracking code |
| `parentAffiliateId` | `string` | No | MLM parent (for multi-level) |
| `payoutMethod` | `string` | No | Payment method preference |
| `payoutDetails` | `object` | No | Payment details (encrypted) |

---

#### `approveAffiliate(affiliateId)`

Approve a pending affiliate application.

```typescript
async approveAffiliate(affiliateId: string): Promise<Affiliate>
```

---

#### `recordCommission(input)`

Record a commission for an affiliate sale.

```typescript
async recordCommission(input: RecordCommissionInput): Promise<AffiliateCommission>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `affiliateId` | `string` | Yes | Affiliate who earned the commission |
| `programId` | `string` | Yes | Programme the commission belongs to |
| `type` | `'sale' \| 'subscription' \| 'renewal' \| 'refund'` | Yes | Commission type |
| `orderId` | `string` | No | Associated order ID |
| `orderAmount` | `number` | Yes | Order value |
| `commissionRate` | `number` | No | Override rate |
| `commissionAmount` | `number` | Yes | Calculated commission amount |

---

#### `createLink(affiliateId, input)`

Create a tracking link for an affiliate.

```typescript
async createLink(
  affiliateId: string,
  input: { name?: string; destinationUrl: string; utmSource?: string; utmMedium?: string; utmCampaign?: string }
): Promise<AffiliateLink>
```

---

#### `trackClick(linkShortCode, visitorData)`

Record a click on an affiliate link.

```typescript
async trackClick(
  linkShortCode: string,
  visitorData: { visitorId: string; ipAddress?: string; userAgent?: string; referrer?: string }
): Promise<void>
```

---

#### `processPayouts(programId)`

Process pending payouts for all eligible affiliates.

```typescript
async processPayouts(programId: string): Promise<AffiliatePayout[]>
```

---

## attribution Submodule

### `AttributionService`

Singleton: `attributionService`

#### `createModel(input)`

Create a new attribution model configuration.

```typescript
async createModel(input: CreateAttributionModelInput): Promise<AttributionModel>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Model name |
| `type` | `'first_touch' \| 'last_touch' \| 'linear' \| 'time_decay' \| 'position_based' \| 'custom'` | Yes | Attribution model type |
| `config` | `AttributionModelConfig` | No | Model-specific configuration |
| `lookbackDays` | `number` | No | Lookback window (default: 30) |
| `conversionEvents` | `string[]` | No | Events that count as conversions |
| `isDefault` | `boolean` | No | Set as default model |

---

#### `recordTouchpoint(input)`

Record a marketing touchpoint for a contact.

```typescript
async recordTouchpoint(input: RecordTouchpointInput): Promise<TouchPoint>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contactId` | `string` | Yes | Contact who was touched |
| `channel` | `string` | Yes | Marketing channel (google, email, social, etc.) |
| `source` | `string` | No | Traffic source |
| `medium` | `string` | No | Traffic medium |
| `campaign` | `string` | No | Campaign name |
| `sessionId` | `string` | No | Session identifier |
| `eventName` | `string` | No | Associated event |

---

#### `recordConversion(input)`

Record a conversion and compute attribution across all active models.

```typescript
async recordConversion(input: RecordConversionInput): Promise<Conversion>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contactId` | `string` | Yes | Converting contact |
| `conversionEvent` | `string` | Yes | Event name (e.g., `purchase`) |
| `conversionValue` | `number` | No | Monetary value |
| `currency` | `string` | No | Currency code |
| `orderId` | `string` | No | Associated order |

**Returns:** `Conversion` with `attributionResults` populated for each active model.

---

#### `getChannelPerformance(dateRange?, modelId?)`

Get attributed performance metrics per marketing channel.

```typescript
async getChannelPerformance(
  dateRange?: { startDate: Date; endDate: Date },
  modelId?: string
): Promise<ChannelPerformance[]>
```

---

## content Submodule

### `ContentService`

Singleton: `contentService`

#### `createBrief(input)`

Create a new content brief in the pipeline.

```typescript
async createBrief(input: CreateContentBriefInput): Promise<ContentBrief>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | `string` | Yes | Brief title |
| `brandVoiceId` | `string` | No | Brand voice for AI generation |
| `targetAudience` | `string` | No | Target audience description |
| `goal` | `string` | No | Content goal |
| `platform` | `string` | No | Target platform (blog, instagram, etc.) |
| `content` | `any` | No | Initial content (rich text or structured) |

---

#### `updateBriefStatus(briefId, status)`

Move a content brief through the workflow pipeline.

```typescript
async updateBriefStatus(
  briefId: string,
  status: 'idea' | 'draft' | 'in_review' | 'ready' | 'scheduled' | 'published' | 'archived'
): Promise<ContentBrief>
```

---

#### `getCalendar(dateRange)`

Get the content calendar for a date range.

```typescript
async getCalendar(dateRange: { startDate: Date; endDate: Date }): Promise<ContentBrief[]>
```

---

#### `generateBrief(input)`

AI-generate a content brief using a brand voice.

```typescript
async generateBrief(input: {
  voiceId: string;
  topic: string;
  platform: string;
}): Promise<ContentBrief>
```

---

## creative Submodule

### `CreativeService`

Singleton: `creativeService`

#### `createAsset(input)`

Upload a creative asset to the digital asset library.

```typescript
async createAsset(input: CreateAssetInput): Promise<ContentAsset>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fileId` | `string` | Yes | Reference to `@mcv/storage` file |
| `name` | `string` | Yes | Asset display name |
| `type` | `'image' \| 'video' \| 'document' \| 'audio' \| 'font' \| 'other'` | Yes | Asset type |
| `description` | `string` | No | Asset description |
| `tags` | `string[]` | No | Searchable tags |
| `folderPath` | `string` | No | Folder hierarchy path (default: `/`) |

---

#### `listAssets(options?)`

List assets with filtering and semantic search.

```typescript
async listAssets(options?: {
  type?: string;
  tag?: string;
  search?: string;
  folderPath?: string;
  limit?: number;
  offset?: number;
}): Promise<{ assets: ContentAsset[]; total: number }>
```

---

#### `semanticSearch(query, limit?)`

Search assets using vector similarity.

```typescript
async semanticSearch(query: string, limit?: number): Promise<ContentAsset[]>
```

---

#### `createBrandVoice(input)`

Create a new brand voice definition.

```typescript
async createBrandVoice(input: CreateBrandVoiceInput): Promise<BrandVoice>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Voice name |
| `tone` | `string` | Yes | Tone description (e.g., "Professional, Friendly") |
| `style` | `string` | Yes | Style description (e.g., "Concise, Action-oriented") |
| `systemPrompt` | `string` | Yes | LLM instruction prompt |
| `keywords` | `string[]` | No | Brand keywords |
| `examples` | `Array<{input: string; output: string}>` | No | Input/output example pairs |
| `isDefault` | `boolean` | No | Set as default voice |

---

#### `listBrandVoices()`

List all brand voices for the current venture.

```typescript
async listBrandVoices(): Promise<BrandVoice[]>
```

---

## education Submodule

### `EducationService`

Singleton: `educationService`

#### `createCourse(input)`

Create a new educational course.

```typescript
async createCourse(input: CreateCourseInput): Promise<Course>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | `string` | Yes | Course title |
| `slug` | `string` | Yes | URL-friendly slug |
| `description` | `string` | No | Course description |
| `difficulty` | `'beginner' \| 'intermediate' \| 'advanced'` | No | Difficulty level |
| `xpReward` | `number` | No | XP points on completion |
| `nftCertificationId` | `string` | No | NFT collection for certificates |
| `tags` | `string[]` | No | Course tags |

---

#### `addModule(courseId, input)`

Add a module (section) to a course.

```typescript
async addModule(courseId: string, input: { title: string; orderIndex: number }): Promise<EducationModule>
```

---

#### `addLesson(moduleId, input)`

Add a lesson to a module.

```typescript
async addLesson(moduleId: string, input: CreateLessonInput): Promise<Lesson>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | `string` | Yes | Lesson title |
| `contentType` | `'video' \| 'article' \| 'quiz'` | Yes | Content type |
| `videoProviderId` | `string` | No | Mux video ID (for video lessons) |
| `articleBody` | `string` | No | Rich text content (for articles) |
| `quizConfig` | `object` | No | Quiz questions and settings |
| `durationSeconds` | `number` | No | Estimated duration |
| `orderIndex` | `number` | Yes | Display order |

---

#### `enrol(userId, courseId)`

Enrol a user in a course.

```typescript
async enrol(userId: string, courseId: string): Promise<Enrollment>
```

**Errors:** `GROWTH_EDUCATION_ALREADY_ENROLLED` (409)

---

#### `completeLesson(userId, courseId, lessonId)`

Mark a lesson as completed and update progress.

```typescript
async completeLesson(
  userId: string,
  courseId: string,
  lessonId: string
): Promise<{ progressPercent: number; isCompleted: boolean }>
```

---

#### `publishCourse(courseId)`

Publish a course (makes it available to learners).

```typescript
async publishCourse(courseId: string): Promise<Course>
```

---

#### `getEnrollment(userId, courseId)`

Get a user's enrollment and progress for a course.

```typescript
async getEnrollment(userId: string, courseId: string): Promise<Enrollment | null>
```

---

## email-campaigns Submodule

### `EmailTemplateService`

Singleton: `emailTemplateService`

#### `create(input)`

Create a new email template.

```typescript
async create(input: CreateEmailTemplateInput): Promise<EmailTemplate>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Template name |
| `description` | `string` | No | Template description |
| `subject` | `string` | No | Email subject line (supports `{{merge_tags}}`) |
| `preheaderText` | `string` | No | Email preheader text |
| `bodyHtml` | `string` | No | Raw HTML body |
| `bodyText` | `string` | No | Plain text body |
| `bodyJson` | `object` | No | Drag-and-drop editor JSON (compiled to MJML → HTML) |
| `category` | `string` | No | Template category (promotional, transactional, etc.) |
| `tags` | `string[]` | No | Searchable tags |

---

#### `render(templateId, data)`

Render a template with personalisation data.

```typescript
async render(
  templateId: string,
  data: Record<string, unknown>
): Promise<{ subject: string; bodyHtml: string; bodyText: string }>
```

**Example:**

```typescript
const rendered = await emailTemplateService.render('tmpl-uuid', {
  firstName: 'Alice',
  orderId: 'ORD-001',
  trackingUrl: 'https://acme.com/track/ORD-001',
});
// rendered.subject → "Order #ORD-001 Confirmed"
// rendered.bodyHtml → compiled MJML with values substituted
```

---

#### `preview(templateId, sampleData?)`

Preview a template with sample data.

```typescript
async preview(
  templateId: string,
  sampleData?: Record<string, unknown>
): Promise<{ subject: string; bodyHtml: string; bodyText: string; previewText: string }>
```

---

### `EmailSubscriberService`

Singleton: `emailSubscriberService`

#### `subscribe(input)`

Subscribe an email address to mailing lists.

```typescript
async subscribe(input: SubscribeInput): Promise<EmailSubscriber>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | `string` | Yes | Email address |
| `listIds` | `string[]` | Yes | Lists to subscribe to |
| `contactId` | `string` | No | Associated CRM contact |
| `source` | `string` | No | Signup source (website_footer, api, etc.) |
| `signupIp` | `string` | No | IP address at signup |
| `consentText` | `string` | No | Consent text shown at signup |

---

#### `unsubscribe(email, reason?, listIds?)`

Unsubscribe an email from specific lists or globally.

```typescript
async unsubscribe(email: string, reason?: string, listIds?: string[]): Promise<void>
```

---

#### `handleBounce(input)`

Process an email bounce event.

```typescript
async handleBounce(input: HandleBounceInput): Promise<void>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | `string` | Yes | Bounced email address |
| `bounceType` | `'hard' \| 'soft' \| 'complaint'` | Yes | Bounce type |
| `bounceSubtype` | `string` | No | Bounce subtype (invalid, blocked, etc.) |
| `diagnosticCode` | `string` | No | SMTP diagnostic code |
| `campaignId` | `string` | No | Campaign that triggered the bounce |

---

#### `confirmSubscription(token)`

Confirm a double opt-in subscription.

```typescript
async confirmSubscription(token: string): Promise<EmailSubscriber>
```

---

## marketing Submodule

### `SegmentService`

Singleton: `segmentService`

#### `create(input)`

Create a new audience segment.

```typescript
async create(input: CreateSegmentInput): Promise<Segment>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Segment name |
| `description` | `string` | No | Segment description |
| `type` | `'static' \| 'dynamic' \| 'predictive'` | No | Segment type (default: `dynamic`) |
| `conditions` | `SegmentCondition[]` | No | Dynamic segment conditions |
| `memberIds` | `string[]` | No | Static segment member IDs |
| `modelId` | `string` | No | Predictive model reference |
| `predictionThreshold` | `number` | No | Predictive model threshold |

---

#### `recalculateSegment(segmentId)`

Recalculate membership for a dynamic segment.

```typescript
async recalculateSegment(segmentId: string): Promise<number>
```

**Returns:** Updated member count.

---

#### `isContactInSegment(contactId, segmentId)`

Check if a contact belongs to a segment.

```typescript
async isContactInSegment(contactId: string, segmentId: string): Promise<boolean>
```

---

#### `getSegmentMembers(segmentId, options?)`

Get all members of a segment with pagination.

```typescript
async getSegmentMembers(
  segmentId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ members: Contact[]; total: number }>
```

---

### `EventTrackingService`

Singleton: `eventTrackingService`

#### `track(event)`

Track a marketing event.

```typescript
async track(event: Partial<MarketingEvent>): Promise<void>
```

**Parameters (key fields):**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventName` | `string` | Yes | Event name (e.g., `page_view`, `purchase`) |
| `eventCategory` | `string` | No | Category (pageview, click, conversion, custom) |
| `contactId` | `string` | No | Known contact ID |
| `anonymousId` | `string` | No | Anonymous visitor ID |
| `channel` | `string` | No | Channel (web, email, sms, push, social) |
| `utmSource` | `string` | No | UTM source parameter |
| `utmMedium` | `string` | No | UTM medium parameter |
| `utmCampaign` | `string` | No | UTM campaign parameter |
| `properties` | `Record<string, unknown>` | No | Custom event properties |
| `pageUrl` | `string` | No | Page URL context |

---

#### `identify(anonymousId, contactId)`

Link anonymous events to a known contact.

```typescript
async identify(anonymousId: string, contactId: string): Promise<void>
```

---

#### `getContactEvents(contactId, options?)`

Get the event stream for a contact.

```typescript
async getContactEvents(
  contactId: string,
  options?: { limit?: number; eventNames?: string[] }
): Promise<MarketingEvent[]>
```

---

### `PersonalizationService`

Singleton: `personalizationService`

#### `getPersonalization(contactId, targetType, targetId?, context?)`

Get personalised content for a visitor.

```typescript
async getPersonalization(
  contactId: string | null,
  targetType: string,
  targetId?: string,
  context?: Record<string, unknown>
): Promise<PersonalizationResult | null>
```

**Returns:** `{ ruleId, variationId, content }` or `null` if no matching rules.

---

#### `trackConversion(ruleId, variationId)`

Track a personalisation conversion.

```typescript
async trackConversion(ruleId: string, variationId: string): Promise<void>
```

---

### `ABTestService`

Singleton: `abTestService`

#### `create(input)`

Create a new A/B test.

```typescript
async create(input: CreateABTestInput): Promise<ABTest>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Test name |
| `hypothesis` | `string` | No | Test hypothesis |
| `testType` | `string` | Yes | Test type (page, component, email, campaign) |
| `targetId` | `string` | No | Target element ID |
| `variants` | `ABTestVariant[]` | Yes | Test variants with weights and content |
| `controlVariantId` | `string` | No | Control variant identifier |
| `primaryGoal` | `string` | Yes | Primary goal (conversion, revenue, engagement) |
| `confidenceLevel` | `number` | No | Required confidence % (default: 95) |
| `minimumSampleSize` | `number` | No | Minimum samples before concluding |

---

#### `start(testId)`

Start a running A/B test.

```typescript
async start(testId: string): Promise<ABTest>
```

---

#### `getVariant(testId, visitorId)`

Get the assigned variant for a visitor (deterministic hash-based).

```typescript
async getVariant(testId: string, visitorId: string): Promise<ABTestVariant | null>
```

---

#### `trackConversion(testId, visitorId, revenue?)`

Track a test conversion for a visitor.

```typescript
async trackConversion(testId: string, visitorId: string, revenue?: number): Promise<void>
```

---

#### `calculateResults(testId)`

Calculate statistical significance and determine winner.

```typescript
async calculateResults(testId: string): Promise<ABTestResults>
```

**Returns:** `{ winner, confidence, lift, pValue, sampleSize, duration, variantStats }`

---

### `CampaignService`

Singleton: `campaignService`

#### `create(input)`

Create a new multi-channel campaign.

```typescript
async create(input: CreateCampaignInput): Promise<Campaign>
```

**Parameters (key fields):**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Campaign name |
| `type` | `'one_time' \| 'recurring' \| 'triggered' \| 'journey'` | No | Campaign type |
| `audienceId` | `string` | No | Target audience |
| `segmentId` | `string` | No | Target segment |
| `channels` | `string[]` | No | Channels: email, sms, push, in_app |
| `messages` | `CampaignMessageInput[]` | No | Per-channel message content |
| `settings` | `CampaignSettings` | No | Throttle, window, dedup settings |
| `budgetAmount` | `number` | No | Campaign budget |
| `tags` | `string[]` | No | Campaign tags |

---

#### `schedule(campaignId, scheduledAt)`

Schedule a campaign for future sending.

```typescript
async schedule(campaignId: string, scheduledAt: Date): Promise<Campaign>
```

---

#### `sendNow(campaignId)`

Send a campaign immediately.

```typescript
async sendNow(campaignId: string): Promise<Campaign>
```

---

#### `pause(campaignId)` / `resume(campaignId)`

Pause or resume a running campaign.

```typescript
async pause(campaignId: string): Promise<Campaign>
async resume(campaignId: string): Promise<Campaign>
```

---

#### `trackEvent(recipientId, event, metadata?)`

Track a delivery event for a campaign recipient.

```typescript
async trackEvent(
  recipientId: string,
  event: 'delivered' | 'opened' | 'clicked' | 'converted' | 'unsubscribed' | 'bounced' | 'complained',
  metadata?: Record<string, unknown>
): Promise<void>
```

---

#### `getAnalytics(campaignId)`

Get comprehensive campaign analytics.

```typescript
async getAnalytics(campaignId: string): Promise<CampaignAnalytics>
```

**Returns:**

```typescript
{
  overview: {
    recipientCount: number;
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    clickedCount: number;
    convertedCount: number;
    unsubscribedCount: number;
    bouncedCount: number;
    revenue: number;
  };
  rates: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    unsubscribeRate: number;
    bounceRate: number;
  };
  linkClicks: Array<{ link: string; clicks: number }>;
  engagement: Array<{ hour: Date; delivered: number; opened: number; clicked: number }>;
}
```

---

### `AutomationService`

Singleton: `automationService`

#### `create(input)`

Create an automation workflow.

```typescript
async create(input: CreateAutomationInput): Promise<Automation>
```

**Parameters (key fields):**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Automation name |
| `triggerType` | `'event' \| 'schedule' \| 'segment_entry' \| 'segment_exit' \| 'date_field'` | Yes | What triggers enrollment |
| `triggerConfig` | `AutomationTrigger` | No | Trigger-specific configuration |
| `steps` | `AutomationStep[]` | Yes | Workflow step definitions |
| `allowReentry` | `boolean` | No | Allow re-enrollment |
| `goalEvent` | `string` | No | Goal event to track |

---

#### `activate(automationId)`

Activate an automation (start accepting enrollments).

```typescript
async activate(automationId: string): Promise<Automation>
```

---

#### `enroll(automationId, contactId, triggerEvent?)`

Manually enrol a contact in an automation.

```typescript
async enroll(
  automationId: string,
  contactId: string,
  triggerEvent?: unknown
): Promise<AutomationEnrollment>
```

---

#### `processStep(enrollmentId, stepId)`

Process an automation step for an enrollment.

```typescript
async processStep(enrollmentId: string, stepId: string): Promise<void>
```

---

## referrals Submodule

### `ReferralService`

Singleton: `referralService`

#### `createProgram(input)`

Create a referral programme with dual-sided rewards.

```typescript
async createProgram(input: CreateReferralProgramInput): Promise<ReferralProgram>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | Yes | Programme name |
| `referrerReward` | `ReferralReward` | Yes | Reward for the referrer |
| `refereeReward` | `ReferralReward` | No | Reward for the referee |
| `requiredAction` | `'signup' \| 'purchase' \| 'subscription'` | No | Action to qualify referral |
| `minimumPurchase` | `number` | No | Minimum purchase amount |
| `maxRewardsPerReferrer` | `number` | No | Max rewards per referrer |
| `referralLinkExpiry` | `number` | No | Link expiry in days |
| `rewardExpiry` | `number` | No | Reward expiry in days |

---

#### `generateCode(input)`

Generate a unique referral code for a user.

```typescript
async generateCode(input: {
  programId: string;
  referrerId: string;
  referrerType: 'contact' | 'user';
}): Promise<ReferralCode>
```

---

#### `trackReferral(input)`

Track when a referee uses a referral code.

```typescript
async trackReferral(input: TrackReferralInput): Promise<Referral>
```

---

#### `qualifyReferral(referralId, qualificationData)`

Qualify a referral and trigger reward distribution.

```typescript
async qualifyReferral(
  referralId: string,
  qualificationData: { action: string; data: Record<string, unknown> }
): Promise<Referral>
```

---

## seo Submodule

### `SEOService`

Singleton: `seoService`

#### `startAudit(siteUrl)`

Start an SEO audit for a website.

```typescript
async startAudit(siteUrl: string): Promise<SEOAudit>
```

---

#### `getAudit(auditId)`

Get audit results.

```typescript
async getAudit(auditId: string): Promise<SEOAudit>
```

---

#### `trackKeyword(input)`

Add a keyword to track.

```typescript
async trackKeyword(input: {
  keyword: string;
  searchEngine?: 'google' | 'bing';
  location?: string;
  device?: 'desktop' | 'mobile';
}): Promise<Keyword>
```

---

#### `getKeywordRankings(options?)`

Get tracked keyword rankings with position changes.

```typescript
async getKeywordRankings(options?: {
  searchEngine?: string;
  limit?: number;
}): Promise<Keyword[]>
```

---

#### `getBacklinks(options?)`

Get discovered backlinks.

```typescript
async getBacklinks(options?: {
  isActive?: boolean;
  isDoFollow?: boolean;
  limit?: number;
}): Promise<Backlink[]>
```

---

#### `getSiteHealth()`

Get aggregate site health metrics.

```typescript
async getSiteHealth(): Promise<SiteHealth>
```

---

## sms Submodule

### `SMSService`

Singleton: `smsService`

#### `send(input)`

Send an SMS/MMS message.

```typescript
async send(input: SendSMSInput): Promise<SMSMessage>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `toNumber` | `string` | Yes | Recipient phone number (E.164 format) |
| `body` | `string` | Yes | Message body |
| `fromNumberId` | `string` | No | Specific sending number (uses default if omitted) |
| `mediaUrls` | `string[]` | No | MMS media URLs |
| `campaignId` | `string` | No | Associated campaign |
| `contactId` | `string` | No | Associated contact |

**Errors:** `GROWTH_SMS_OPT_OUT` (400), `GROWTH_SMS_RATE_LIMITED` (429)

---

#### `sendBulk(inputs)`

Send SMS to multiple recipients with rate limiting.

```typescript
async sendBulk(inputs: SendSMSInput[]): Promise<{ sent: number; failed: number }>
```

---

#### `handleInbound(input)`

Process an inbound SMS message.

```typescript
async handleInbound(input: InboundSMSInput): Promise<void>
```

---

#### `checkOptOut(phoneNumber)`

Check if a phone number has opted out.

```typescript
async checkOptOut(phoneNumber: string): Promise<boolean>
```

---

#### `getConversations(options?)`

List SMS conversations.

```typescript
async getConversations(options?: {
  status?: 'open' | 'closed' | 'archived';
  contactId?: string;
  limit?: number;
}): Promise<SMSConversation[]>
```

---

#### `getConversationMessages(conversationId, options?)`

Get messages in a conversation thread.

```typescript
async getConversationMessages(
  conversationId: string,
  options?: { limit?: number; before?: Date }
): Promise<SMSMessage[]>
```

---

## social Submodule

### `SocialConnectorService`

Singleton: `socialConnectorService`

#### `connectAccount(input)`

Connect a social media account via OAuth.

```typescript
async connectAccount(input: ConnectSocialAccountInput): Promise<SocialAccount>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `provider` | `'facebook' \| 'instagram' \| 'twitter' \| 'linkedin' \| 'tiktok' \| 'youtube'` | Yes | Social platform |
| `providerAccountId` | `string` | Yes | Platform account ID |
| `name` | `string` | Yes | Account name |
| `accessToken` | `string` | Yes | OAuth token (encrypted before storage) |
| `refreshToken` | `string` | No | Refresh token |
| `username` | `string` | No | Account username/handle |
| `profilePictureUrl` | `string` | No | Avatar URL |
| `tokenExpiresAt` | `string` | No | Token expiry datetime |

---

#### `listAccounts()`

List all connected social accounts.

```typescript
async listAccounts(): Promise<SocialAccount[]>
```

---

#### `createPost(input)`

Create a social media post (draft, scheduled, or immediate).

```typescript
async createPost(input: CreateSocialPostInput): Promise<SocialPost>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | `string` | Yes | Post text content |
| `accountIds` | `string[]` | Yes | Target accounts for multi-account publishing |
| `mediaUrls` | `string[]` | No | Media attachments |
| `scheduledAt` | `Date` | No | Schedule for future publishing |
| `platformOptions` | `object` | No | Platform-specific settings |

---

#### `publishPost(postId)`

Publish a draft post immediately.

```typescript
async publishPost(postId: string): Promise<SocialPost>
```

---

#### `getInteractions(options?)`

Get social interactions (unified inbox).

```typescript
async getInteractions(options?: {
  accountId?: string;
  type?: 'comment' | 'mention' | 'dm';
  isRead?: boolean;
  limit?: number;
}): Promise<SocialInteraction[]>
```

---

#### `replyToInteraction(interactionId, content)`

Reply to a social interaction.

```typescript
async replyToInteraction(interactionId: string, content: string): Promise<void>
```

---

## website Submodule

### `WebsiteService`

Singleton: `websiteService`

#### `createSite(input)`

Create a new website/landing page site.

```typescript
async createSite(input: CreateSiteInput): Promise<Site>
```

---

#### `createPage(siteId, input)`

Create a page within a site.

```typescript
async createPage(siteId: string, input: CreatePageInput): Promise<Page>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | `string` | Yes | Page title |
| `path` | `string` | Yes | URL path (e.g., `/about`) |
| `blocks` | `Block[]` | No | Block tree (JSON structure) |
| `metaTags` | `object` | No | SEO meta tags |

---

#### `updateBlocks(pageId, blocks)`

Update the block tree for a page.

```typescript
async updateBlocks(pageId: string, blocks: Block[]): Promise<Page>
```

---

#### `createForm(siteId, input)`

Create a form for data collection.

```typescript
async createForm(siteId: string, input: CreateFormInput): Promise<Form>
```

---

#### `submitForm(formId, data, metadata?)`

Process a form submission.

```typescript
async submitForm(
  formId: string,
  data: Record<string, unknown>,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<void>
```

---

#### `mapDomain(siteId, domain)`

Map a custom domain to a site.

```typescript
async mapDomain(siteId: string, domain: string): Promise<Domain>
```

---

#### `publishSite(siteId)` / `unpublishSite(siteId)`

Publish or unpublish a site.

```typescript
async publishSite(siteId: string): Promise<Site>
async unpublishSite(siteId: string): Promise<Site>
```

---

## analytics Submodule

### `MarketingAnalyticsService`

Singleton: `marketingAnalyticsService`

#### `getDashboardMetrics(ventureId)`

Get unified marketing dashboard metrics.

```typescript
async getDashboardMetrics(ventureId: string): Promise<DashboardMetrics>
```

**Returns:**

```typescript
{
  activeCampaigns: number;   // Currently active ad campaigns
  totalSpend: number;        // Total ad spend in period
  impressions: number;       // Total impressions
  clicks: number;            // Total clicks
  conversions: number;       // Total conversions
  socialEngagement: number;  // Social reply rate (%)
  scheduledPosts: number;    // Pending social posts
}
```

---

#### `getTimelineData(ventureId, days?)`

Get daily timeline data for charts.

```typescript
async getTimelineData(
  ventureId: string,
  days?: number
): Promise<TimelineDataPoint[]>
```

**Returns:** Array of `{ date, spend, revenue, impressions, clicks, conversions }`

---

#### `getCampaignPerformance(ventureId)`

Get performance breakdown per ad campaign.

```typescript
async getCampaignPerformance(ventureId: string): Promise<CampaignPerformance[]>
```

---

#### `getSocialMetrics(ventureId)`

Get social media metrics summary.

```typescript
async getSocialMetrics(ventureId: string): Promise<SocialMetrics>
```

**Returns:**

```typescript
{
  totalAccounts: number;
  activeAccounts: number;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
  totalInteractions: number;
  unreadInteractions: number;
}
```

---

## Types

### Core Marketing Types

```typescript
// Segment condition for dynamic segments and audience filters
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

// Campaign settings
interface CampaignSettings {
  sendingWindow?: {
    enabled: boolean;
    timezone: string;
    days: number[];         // 0-6 (Sun-Sat)
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

// Automation step (for workflow builder)
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
  condition?: { rules: SegmentCondition[]; yesStepId: string; noStepId: string };
  delay?: { type: 'fixed' | 'until_time' | 'until_date_field'; duration?: number; unit?: string };
  split?: { type: 'random' | 'conditional'; branches: Array<{ id: string; weight?: number; nextStepId: string }> };
  goal?: { event: string; timeout?: number; achievedStepId?: string; timeoutStepId?: string };
  nextStepId?: string;
  position?: { x: number; y: number };
}

// Attribution model configuration
interface AttributionModelConfig {
  halfLifeDays?: number;        // Time decay model
  firstTouchWeight?: number;    // Position-based (e.g., 0.4)
  lastTouchWeight?: number;     // Position-based (e.g., 0.4)
  middleTouchWeight?: number;   // Position-based (e.g., 0.2)
  channelWeights?: Record<string, number>;  // Custom model
}

// Referral reward definition
interface ReferralReward {
  type: 'discount_percent' | 'discount_fixed' | 'credit' | 'free_product' | 'free_month' | 'points';
  value: number;
  currency?: string;
  productId?: string;
  maxValue?: number;
  oneTimeUse?: boolean;
}

// Commission tier (affiliate programmes)
interface CommissionTier {
  minRevenue?: number;
  maxRevenue?: number;
  minReferrals?: number;
  maxReferrals?: number;
  rate?: number;
  amount?: number;
}

// A/B test variant
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

// A/B test results
interface ABTestResults {
  winner?: string;
  confidence: number;
  lift: number;
  pValue: number;
  sampleSize: number;
  duration: number;
  variantStats: Record<string, {
    impressions: number;
    conversions: number;
    conversionRate: number;
    revenue?: number;
    revenuePerVisitor?: number;
  }>;
}

// Journey canvas (visual builder)
interface JourneyCanvas {
  nodes: JourneyNode[];
  edges: JourneyEdge[];
  settings: Record<string, unknown>;
}

interface JourneyNode {
  id: string;
  type: 'entry' | 'action' | 'condition' | 'delay' | 'split' | 'goal' | 'exit';
  position: { x: number; y: number };
  data: AutomationStep;
}

interface JourneyEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

// Personalisation result
interface PersonalizationResult {
  ruleId: string;
  variationId: string;
  content: Record<string, unknown>;
}

// Growth CRM profile
interface GrowthProfile {
  id: string;
  primaryWalletAddress?: string;
  primaryEmail?: string;
  ltvUsd: number;
  ltvEdge: number;
  engagementScore: number;
  churnRiskScore?: number;
  lifecycleStage: string;
  lastActiveAt?: Date;
  tags: string[];
  customAttributes: Record<string, unknown>;
}
```

### Provider Enums

```typescript
type AdProvider = 'facebook_ads' | 'google_ads' | 'tiktok_ads' | 'linkedin_ads' | 'twitter_ads';
type AdAccountStatus = 'active' | 'disabled' | 'payment_failed' | 'review_pending';
type AdCampaignStatus = 'active' | 'paused' | 'archived' | 'completed';

type SocialProvider = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';
type SocialPostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
type SocialAccountStatus = 'active' | 'disconnected' | 'expired' | 'error';

type SMSProvider = 'twilio' | 'bandwidth' | 'vonage';
type SMSNumberType = 'local' | 'toll_free' | 'short_code';
```

---

## Schemas

### Zod Validation Schemas (tRPC Input)

```typescript
// Social account connection
const connectSocialAccountSchema = z.object({
  provider: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube']),
  providerAccountId: z.string(),
  name: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  username: z.string().optional(),
  profilePictureUrl: z.string().optional(),
  tokenExpiresAt: z.string().optional(),
});

// Social post creation
const createSocialPostSchema = z.object({
  accountId: z.string(),
  content: z.string(),
  mediaUrls: z.array(z.string()).optional(),
  scheduledAt: z.string().optional(),
});

// Ad account connection
const connectAdAccountSchema = z.object({
  provider: z.enum(['facebook_ads', 'google_ads', 'tiktok_ads', 'linkedin_ads', 'twitter_ads']),
  externalAccountId: z.string(),
  name: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
});

// Ad campaign creation
const createAdCampaignSchema = z.object({
  adAccountId: z.string(),
  name: z.string(),
  objective: z.string(),
  dailyBudget: z.number().optional(),
  status: z.enum(['active', 'paused']).optional(),
});

// Creative asset creation
const createAssetSchema = z.object({
  fileId: z.string(),
  name: z.string(),
  type: z.enum(['image', 'video', 'document', 'audio', 'font', 'other']),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Creative asset listing
const listAssetsSchema = z.object({
  type: z.enum(['image', 'video', 'document', 'audio', 'font', 'other']).optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

// Content brief generation
const generateBriefSchema = z.object({
  voiceId: z.string(),
  topic: z.string(),
  platform: z.string(),
});

// Segment condition
const segmentConditionSchema = z.object({
  field: z.string(),
  operator: z.enum([
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'contains', 'not_contains', 'starts_with', 'ends_with',
    'in', 'not_in', 'within', 'before', 'after',
    'is_set', 'is_not_set',
  ]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  logicalOperator: z.enum(['AND', 'OR']).optional(),
});
```

---

## Events

### Audit Events

All significant growth operations emit structured audit events via `@mcv/kernel/audit`:

| Event | Description | Payload |
|-------|-------------|---------|
| `growth.segment.created` | Segment created | `{ segmentId, name, type, conditions }` |
| `growth.segment.recalculated` | Segment membership refreshed | `{ segmentId, previousCount, newCount }` |
| `growth.campaign.created` | Campaign created | `{ campaignId, name, type, channels }` |
| `growth.campaign.scheduled` | Campaign scheduled for send | `{ campaignId, scheduledAt }` |
| `growth.campaign.sent` | Campaign send started | `{ campaignId, recipientCount }` |
| `growth.campaign.paused` | Campaign paused | `{ campaignId, reason }` |
| `growth.campaign.completed` | Campaign finished | `{ campaignId, stats }` |
| `growth.automation.activated` | Automation activated | `{ automationId, triggerType }` |
| `growth.automation.enrolled` | Contact enrolled | `{ automationId, contactId }` |
| `growth.email.subscribed` | Email subscribed | `{ email, listIds, source }` |
| `growth.email.unsubscribed` | Email unsubscribed | `{ email, reason, listIds }` |
| `growth.email.bounced` | Email bounced | `{ email, bounceType, campaignId }` |
| `growth.sms.sent` | SMS sent | `{ messageId, toNumber, segments }` |
| `growth.sms.opted_out` | SMS opt-out | `{ phoneNumber, source }` |
| `growth.affiliate.registered` | Affiliate signed up | `{ affiliateId, programId, email }` |
| `growth.affiliate.approved` | Affiliate approved | `{ affiliateId, approvedBy }` |
| `growth.affiliate.commission` | Commission recorded | `{ commissionId, amount, type }` |
| `growth.affiliate.payout` | Payout initiated | `{ payoutId, affiliateId, amount }` |
| `growth.referral.created` | Referral tracked | `{ referralId, referrerId, refereeId }` |
| `growth.referral.rewarded` | Reward issued | `{ referralId, rewardType, value }` |
| `growth.attribution.conversion` | Conversion attributed | `{ conversionId, modelId, channels }` |
| `growth.ad.account_connected` | Ad account linked | `{ adAccountId, provider }` |
| `growth.ad.synced` | Ad data synced | `{ adAccountId, campaignsCount }` |
| `growth.social.account_connected` | Social account linked | `{ accountId, provider }` |
| `growth.social.post_published` | Post published | `{ postId, accountIds }` |
| `growth.social.post_failed` | Post failed | `{ postId, error }` |
| `growth.creative.asset_created` | Asset created | `{ assetId, type, name }` |
| `growth.creative.voice_created` | Brand voice created | `{ voiceId, name }` |
| `growth.education.course_published` | Course published | `{ courseId, title }` |
| `growth.education.enrolled` | User enrolled | `{ userId, courseId }` |
| `growth.education.completed` | Course completed | `{ userId, courseId, xpAwarded }` |
| `growth.abtest.started` | A/B test started | `{ testId, variants }` |
| `growth.abtest.completed` | A/B test concluded | `{ testId, winner, confidence }` |

### Redpanda/Kafka Topics

| Topic | Producer | Consumer |
|-------|----------|----------|
| `growth.events` | EventTrackingService | Attribution, Analytics |
| `growth.campaign.status` | CampaignService | Analytics dashboard |
| `growth.email.events` | Webhook handler | EmailSubscriberService |
| `growth.sms.events` | Webhook handler | SMSService |
| `growth.social.interactions` | Polling job | Social inbox |
| `growth.attribution.conversions` | Attribution engine | Analytics |

---

## Errors

### Error Code Reference

| Code | HTTP | Description |
|------|------|-------------|
| `GROWTH_SEGMENT_NOT_FOUND` | 404 | Segment does not exist |
| `GROWTH_SEGMENT_INVALID_CONDITIONS` | 400 | Malformed segment conditions |
| `GROWTH_AUDIENCE_NOT_FOUND` | 404 | Audience does not exist |
| `GROWTH_CAMPAIGN_NOT_FOUND` | 404 | Campaign does not exist |
| `GROWTH_CAMPAIGN_INVALID_STATUS` | 400 | Status prevents the requested operation |
| `GROWTH_CAMPAIGN_NO_MESSAGES` | 400 | Campaign has no messages configured |
| `GROWTH_CAMPAIGN_NO_AUDIENCE` | 400 | No audience or segment configured |
| `GROWTH_TEMPLATE_NOT_FOUND` | 404 | Email template not found |
| `GROWTH_TEMPLATE_RENDER_ERROR` | 500 | Template rendering failed |
| `GROWTH_SUBSCRIBER_ALREADY_EXISTS` | 409 | Email already subscribed |
| `GROWTH_SUBSCRIBER_SUPPRESSED` | 400 | Email is on suppression list |
| `GROWTH_SMS_OPT_OUT` | 400 | Phone number has opted out |
| `GROWTH_SMS_RATE_LIMITED` | 429 | Number send limit exceeded |
| `GROWTH_AFFILIATE_NOT_FOUND` | 404 | Affiliate not found |
| `GROWTH_AFFILIATE_SUSPENDED` | 403 | Affiliate is suspended |
| `GROWTH_AFFILIATE_DUPLICATE` | 409 | Affiliate code already exists |
| `GROWTH_REFERRAL_EXPIRED` | 400 | Referral code has expired |
| `GROWTH_REFERRAL_LIMIT_REACHED` | 400 | Max rewards per referrer reached |
| `GROWTH_ATTRIBUTION_NO_TOUCHPOINTS` | 400 | No touchpoints in lookback window |
| `GROWTH_AD_ACCOUNT_DISCONNECTED` | 400 | Ad account OAuth expired |
| `GROWTH_AD_ACCOUNT_DUPLICATE` | 409 | Ad account already connected |
| `GROWTH_AD_SYNC_FAILED` | 500 | Provider API sync error |
| `GROWTH_SOCIAL_TOKEN_EXPIRED` | 401 | Social account token expired |
| `GROWTH_SOCIAL_PUBLISH_FAILED` | 500 | Post publishing failed |
| `GROWTH_SEO_CRAWL_FAILED` | 500 | Site crawl failed |
| `GROWTH_EDUCATION_ALREADY_ENROLLED` | 409 | User already enrolled |
| `GROWTH_EDUCATION_COURSE_NOT_FOUND` | 404 | Course not found |
| `GROWTH_ABTEST_NOT_RUNNING` | 400 | Test not in running state |
| `GROWTH_AUTOMATION_ALREADY_ENROLLED` | 409 | Contact already in automation |
| `GROWTH_WEBSITE_DOMAIN_TAKEN` | 409 | Domain already mapped |

### Error Response Format

All errors follow the `@mcv/kernel` standard error format:

```typescript
{
  code: 'GROWTH_CAMPAIGN_NOT_FOUND',
  message: 'Campaign with ID "abc-123" does not exist',
  statusCode: 404,
  details?: {
    campaignId: 'abc-123',
    ventureId: 'venture-xyz',
  }
}
```

---

## Config

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROWTH_DB_URL` | Yes | — | PostgreSQL connection string |
| `GROWTH_REDIS_URL` | Yes | — | Redis URL for BullMQ and caching |
| `GROWTH_ENCRYPTION_KEY` | Yes | — | AES-256 key for token encryption |
| `GROWTH_WEBHOOK_SECRET` | Yes | — | HMAC secret for webhook verification |
| `SENDGRID_API_KEY` | Yes | — | SendGrid API key for email delivery |
| `TWILIO_ACCOUNT_SID` | Yes | — | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Yes | — | Twilio auth token |
| `TWILIO_DEFAULT_FROM` | No | — | Default Twilio phone number |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | No | — | Google Ads API developer token |
| `GOOGLE_ADS_CLIENT_ID` | No | — | Google Ads OAuth client ID |
| `GOOGLE_ADS_CLIENT_SECRET` | No | — | Google Ads OAuth client secret |
| `META_ADS_APP_ID` | No | — | Meta Ads app ID |
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
| `MUX_TOKEN_ID` | No | — | Mux video token ID |
| `MUX_TOKEN_SECRET` | No | — | Mux video token secret |
| `GROWTH_EVENT_BATCH_SIZE` | No | `1000` | Batch size for event ingestion |
| `GROWTH_CAMPAIGN_THROTTLE_MAX` | No | `10000` | Max messages/hour per campaign |
| `GROWTH_SEO_CRAWL_CONCURRENCY` | No | `5` | Concurrent SEO page crawls |
| `GROWTH_AD_SYNC_INTERVAL_MINUTES` | No | `360` | Ad insight sync interval (6h default) |
| `GROWTH_SOCIAL_POLL_INTERVAL_SECONDS` | No | `60` | Social interaction polling interval |
| `GROWTH_ATTRIBUTION_LOOKBACK_DAYS` | No | `30` | Default attribution lookback window |

### Constants

```typescript
// Campaign statuses
export const CAMPAIGN_STATUSES = ['draft', 'scheduled', 'sending', 'active', 'paused', 'completed', 'archived'] as const;

// Marketing channels
export const MARKETING_CHANNELS = ['email', 'sms', 'push', 'in_app', 'social', 'web'] as const;

// Ad providers
export const AD_PROVIDERS = ['facebook_ads', 'google_ads', 'tiktok_ads', 'linkedin_ads', 'twitter_ads'] as const;

// Social providers
export const SOCIAL_PROVIDERS = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'] as const;

// SMS providers
export const SMS_PROVIDERS = ['twilio', 'bandwidth', 'vonage'] as const;

// Attribution models
export const ATTRIBUTION_MODELS = ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based', 'custom'] as const;

// Segment condition operators
export const SEGMENT_OPERATORS = [
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
  'contains', 'not_contains', 'starts_with', 'ends_with',
  'in', 'not_in', 'within', 'before', 'after',
  'is_set', 'is_not_set',
] as const;

// Email categories
export const EMAIL_CATEGORIES = ['promotional', 'transactional', 'newsletter', 'welcome', 'drip'] as const;

// Bounce types
export const BOUNCE_TYPES = ['hard', 'soft', 'complaint'] as const;

// Commission types
export const COMMISSION_TYPES = ['percentage', 'fixed', 'tiered'] as const;

// Referral reward types
export const REFERRAL_REWARD_TYPES = ['discount_percent', 'discount_fixed', 'credit', 'free_product', 'free_month', 'points'] as const;

// SEO audit rules
export const SEO_AUDIT_RULES = [
  'missing_title', 'missing_meta_description', 'missing_h1',
  'duplicate_title', 'duplicate_meta', 'broken_links',
  'slow_page', 'missing_alt_text', 'no_https',
  'missing_canonical', 'orphan_page', 'redirect_chain',
] as const;

// Education difficulty levels
export const EDUCATION_DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
```

---

*@mcv/growth — Growth & Marketing Domain*
