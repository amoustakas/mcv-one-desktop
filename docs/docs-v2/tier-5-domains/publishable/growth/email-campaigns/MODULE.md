# @mcv/growth/email-campaigns

> **Domain:** Growth · **Tier:** 5 (Domain Modules) · **Status:** Stable
> **Since:** 0.14.0 · **Updated:** 2026-02-08

Full-lifecycle email marketing platform powering campaign creation, subscriber management, automation flows, deliverability optimization, and revenue-attributed analytics for the MCV.ONE ecosystem.

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

`@mcv/growth/email-campaigns` is the centralized email marketing engine for MCV.ONE. It handles every stage of the email lifecycle — from drag-and-drop template design and audience segmentation through send-time-optimized delivery, real-time event tracking, and revenue attribution. The module integrates deeply with `@mcv/growth/cdp` for audience data, `@mcv/growth/analytics` for conversion tracking, and `@mcv/commerce` for transactional messaging.

### What This Module Does

1. **Campaign Builder** — Visual drag-and-drop email builder with a block-based architecture, raw HTML editing, a curated template library, and dynamic content blocks that render per-recipient at send time.

2. **List Management** — First-class subscriber list CRUD with segments pulled from the CDP, tagging, suppression lists (global and per-campaign), bounce management with automatic category detection (hard/soft/complaint), and full unsubscribe lifecycle handling including preference centers.

3. **Send Engine** — High-throughput batch sending with per-recipient timezone optimization, configurable throttling, domain warm-up scheduling for new IPs/domains, and automatic retry with exponential backoff for transient failures.

4. **Automation Flows** — Visual flow builder for trigger-based email sequences: welcome series, abandoned cart recovery, post-purchase follow-up, win-back/re-engagement, birthday/anniversary, and custom event-triggered flows.

5. **Personalization** — Merge tags (Handlebars syntax), conditional content blocks with boolean logic, AI-powered product recommendations, dynamic image URLs, and per-recipient content variants.

6. **A/B Testing** — Multi-variant testing for subject lines, sender names, email content, and send times. Configurable sample sizes, statistical significance thresholds, and automatic winner selection with full-list rollout.

7. **Deliverability** — Guided SPF/DKIM/DMARC setup wizard, dedicated IP management, sender reputation monitoring with alerting, inbox placement testing via seed lists, and feedback loop (FBL) processing.

8. **Analytics** — Real-time open/click/conversion tracking, revenue-per-email attribution, click heat maps, device and client breakdown, engagement scoring, and cohort-based trend analysis.

9. **Compliance** — Built-in CAN-SPAM, CASL, and GDPR compliance enforcement. Automatic unsubscribe link injection, physical address requirement validation, preference center generation, and consent audit trails.

10. **Transactional + Marketing Separation** — Separate sending domains and IP pools for transactional messages (receipts, password resets, order confirmations) vs. marketing campaigns, ensuring transactional deliverability is never impacted by marketing reputation.

### Why It Exists

Email remains the highest-ROI marketing channel. This module provides enterprise-grade email infrastructure without the vendor lock-in of standalone ESPs, while maintaining deep integration with MCV.ONE's CDP, commerce, and analytics layers. Every email sent is a first-party data event that feeds back into the unified customer profile.

### Design Principles

- **Deliverability First** — Every architectural decision prioritizes inbox placement. Warm-up schedules, reputation monitoring, and authentication are not afterthoughts.
- **Privacy by Design** — GDPR consent tracking, automatic suppression enforcement, and cryptographic unsubscribe tokens are baked into the data model.
- **Provider Agnostic** — The send engine abstracts over Resend, SendGrid, and Amazon SES via a unified adapter interface. Switch providers without changing a line of campaign logic.
- **Event-Driven** — Every email interaction (send, delivery, open, click, bounce, complaint, unsubscribe) emits a Redpanda event consumable by any downstream service.
- **Multi-Tenant Isolation** — Row-level security ensures tenants never see each other's campaigns, lists, or analytics. Dedicated IP pools and sending domains are tenant-scoped.

---

## Exports

```typescript
// === Primary Service ===
export { EmailCampaignService } from './services/email-campaign.service';
export { createEmailCampaignRouter } from './routers/email-campaign.router';

// === Campaign Builder ===
export { CampaignBuilder } from './services/campaign-builder.service';
export { TemplateEngine } from './services/template-engine.service';
export { BlockRegistry } from './services/block-registry.service';
export { TemplateLibrary } from './services/template-library.service';

// === List Management ===
export { ListManager } from './services/list-manager.service';
export { SegmentSync } from './services/segment-sync.service';
export { SuppressionManager } from './services/suppression-manager.service';
export { BounceProcessor } from './services/bounce-processor.service';
export { UnsubscribeHandler } from './services/unsubscribe-handler.service';

// === Send Engine ===
export { SendEngine } from './services/send-engine.service';
export { SendTimeOptimizer } from './services/send-time-optimizer.service';
export { ThrottleController } from './services/throttle-controller.service';
export { WarmupScheduler } from './services/warmup-scheduler.service';
export { RetryManager } from './services/retry-manager.service';

// === Automation ===
export { AutomationEngine } from './services/automation-engine.service';
export { FlowBuilder } from './services/flow-builder.service';
export { TriggerEvaluator } from './services/trigger-evaluator.service';
export { StepExecutor } from './services/step-executor.service';

// === Personalization ===
export { PersonalizationEngine } from './services/personalization-engine.service';
export { MergeTagResolver } from './services/merge-tag-resolver.service';
export { ConditionalRenderer } from './services/conditional-renderer.service';
export { ProductRecommender } from './services/product-recommender.service';

// === A/B Testing ===
export { ABTestManager } from './services/ab-test-manager.service';
export { VariantAllocator } from './services/variant-allocator.service';
export { SignificanceCalculator } from './services/significance-calculator.service';

// === Deliverability ===
export { DeliverabilityMonitor } from './services/deliverability-monitor.service';
export { AuthenticationWizard } from './services/authentication-wizard.service';
export { ReputationTracker } from './services/reputation-tracker.service';
export { InboxPlacementTester } from './services/inbox-placement-tester.service';
export { FeedbackLoopProcessor } from './services/feedback-loop-processor.service';

// === Analytics ===
export { EmailAnalytics } from './services/email-analytics.service';
export { ClickHeatmapGenerator } from './services/click-heatmap-generator.service';
export { RevenueAttributor } from './services/revenue-attributor.service';
export { EngagementScorer } from './services/engagement-scorer.service';

// === Compliance ===
export { ComplianceEnforcer } from './services/compliance-enforcer.service';
export { PreferenceCenterBuilder } from './services/preference-center-builder.service';
export { ConsentAuditor } from './services/consent-auditor.service';

// === Provider Adapters ===
export { ResendAdapter } from './adapters/resend.adapter';
export { SendGridAdapter } from './adapters/sendgrid.adapter';
export { SESAdapter } from './adapters/ses.adapter';
export { EmailProviderAdapter } from './adapters/provider.interface';

// === Webhook Handlers ===
export { WebhookRouter } from './webhooks/webhook.router';
export { ResendWebhookHandler } from './webhooks/resend.handler';
export { SendGridWebhookHandler } from './webhooks/sendgrid.handler';
export { SESWebhookHandler } from './webhooks/ses.handler';

// === Types ===
export type {
  Campaign,
  CampaignStatus,
  CampaignType,
  EmailTemplate,
  TemplateBlock,
  BlockType,
  SubscriberList,
  Subscriber,
  SubscriberStatus,
  AutomationFlow,
  AutomationStep,
  AutomationTrigger,
  AutomationAction,
  EmailSend,
  EmailEvent,
  EmailEventType,
  ABTest,
  ABTestVariant,
  ABTestMetric,
  SuppressionEntry,
  SuppressionReason,
  SendOptions,
  SendResult,
  DeliverabilityReport,
  ReputationScore,
  InboxPlacementResult,
  CampaignAnalytics,
  EmailHeatmap,
  EngagementScore,
  ComplianceCheck,
  ComplianceViolation,
  PreferenceCenter,
  ConsentRecord,
  WarmupSchedule,
  WarmupPhase,
  ThrottleConfig,
  PersonalizationContext,
  MergeTag,
  ConditionalBlock,
  DynamicImage,
  ProductRecommendation,
} from './types';

// === Schemas (Drizzle) ===
export {
  emailCampaigns,
  emailTemplates,
  subscriberLists,
  listSubscribers,
  automationFlows,
  automationSteps,
  emailSends,
  emailEvents,
  emailAbTests,
  suppressionList,
} from './schemas';

// === Constants ===
export {
  EMAIL_CAMPAIGN_ERRORS,
  DEFAULT_THROTTLE_LIMITS,
  WARMUP_PRESETS,
  BLOCK_TYPES,
  AUTOMATION_TRIGGERS,
  EVENT_TOPICS,
} from './constants';
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Email Campaigns Module                          │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │   Campaign    │  │   Template   │  │     List     │                 │
│  │   Builder     │  │   Engine     │  │   Manager    │                 │
│  │              │  │              │  │              │                 │
│  │ • Create     │  │ • Blocks     │  │ • CRUD       │                 │
│  │ • Schedule   │  │ • HTML       │  │ • Segments   │                 │
│  │ • A/B Test   │  │ • Preview    │  │ • Tags       │                 │
│  │ • Archive    │  │ • Library    │  │ • Suppress   │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                 │                 │                          │
│         ▼                 ▼                 ▼                          │
│  ┌────────────────────────────────────────────────────┐                │
│  │              Personalization Engine                 │                │
│  │                                                    │                │
│  │  Merge Tags → Conditional Blocks → Dynamic Images  │                │
│  │         → Product Recommendations                  │                │
│  └────────────────────────┬───────────────────────────┘                │
│                           │                                            │
│                           ▼                                            │
│  ┌────────────────────────────────────────────────────┐                │
│  │                   Send Engine                       │                │
│  │                                                    │                │
│  │  ┌──────────┐  ┌───────────┐  ┌────────────────┐  │                │
│  │  │ Throttle │  │ Send Time │  │    Warmup      │  │                │
│  │  │ Control  │  │ Optimizer │  │   Scheduler    │  │                │
│  │  └────┬─────┘  └─────┬─────┘  └───────┬────────┘  │                │
│  │       └──────────────┼────────────────┘            │                │
│  │                      ▼                              │                │
│  │         ┌────────────────────────┐                  │                │
│  │         │   Provider Adapters    │                  │                │
│  │         │                        │                  │                │
│  │         │  Resend │ SendGrid │   │                  │                │
│  │         │         │ SES      │   │                  │                │
│  │         └────────────────────────┘                  │                │
│  └────────────────────────┬───────────────────────────┘                │
│                           │                                            │
│                           ▼                                            │
│  ┌────────────────────────────────────────────────────┐                │
│  │              Event Processing Pipeline              │                │
│  │                                                    │                │
│  │  Webhooks → Normalize → Redpanda → Consumers       │                │
│  │                                                    │                │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────────────┐  │                │
│  │  │ Bounce  │ │ Analytics│ │  Deliverability    │  │                │
│  │  │ Process │ │ Agg.     │ │  Monitor           │  │                │
│  │  └─────────┘ └──────────┘ └────────────────────┘  │                │
│  └────────────────────────────────────────────────────┘                │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │  Automation   │  │ Compliance   │  │  Analytics   │                 │
│  │  Engine       │  │ Enforcer     │  │  Dashboard   │                 │
│  │              │  │              │  │              │                 │
│  │ • Triggers   │  │ • CAN-SPAM   │  │ • Opens      │                 │
│  │ • Steps      │  │ • GDPR       │  │ • Clicks     │                 │
│  │ • Delays     │  │ • CASL       │  │ • Revenue    │                 │
│  │ • Branches   │  │ • Audit      │  │ • Heatmaps   │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Campaign Lifecycle

```
1. BUILD                    2. TARGET                  3. PERSONALIZE
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│ Select template │        │ Choose list(s)  │        │ Resolve merge   │
│ or build from   │───────▶│ Apply segments  │───────▶│ tags per        │
│ scratch via     │        │ Apply tags      │        │ recipient       │
│ block editor    │        │ Exclude supp.   │        │ Render cond.    │
│                 │        │ lists           │        │ blocks          │
└─────────────────┘        └─────────────────┘        └────────┬────────┘
                                                               │
4. VALIDATE                 5. SEND                    6. TRACK
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│ Compliance      │        │ Throttle per    │        │ Delivery        │
│ check: unsub    │◀───────│ warm-up phase   │◀───────│ webhooks from   │
│ link, address,  │        │ Send-time opt.  │        │ ESP provider    │
│ consent valid   │        │ Provider route  │        │                 │
│                 │────────▶│ Retry on fail   │───────▶│ Events →        │
└─────────────────┘        └─────────────────┘        │ Redpanda →      │
                                                      │ Analytics       │
                                                      └─────────────────┘
```

### Automation Flow Execution

```
┌─────────────────────────────────────────────────────────────┐
│                    Automation Engine                         │
│                                                             │
│  Trigger Event                                              │
│  (e.g., "user.signed_up")                                  │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                │
│  │ Step 1  │    │ Step 2  │    │ Step 3  │                │
│  │ Send    │──▶│ Wait    │──▶│ Branch  │                │
│  │ Welcome │    │ 3 days  │    │ Opened? │                │
│  │ Email   │    │         │    │  Y / N  │                │
│  └─────────┘    └─────────┘    └────┬────┘                │
│                                  ┌──┴──┐                   │
│                                  │     │                   │
│                               ┌──▼──┐ ┌▼─────┐            │
│                               │Yes  │ │ No   │            │
│                               │Send │ │ Send │            │
│                               │Offer│ │Re-   │            │
│                               │     │ │engage│            │
│                               └─────┘ └──────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Provider Adapter Architecture

The send engine uses a strategy pattern to abstract email service providers:

```
┌──────────────────────────────────────────────────┐
│              EmailProviderAdapter                 │
│                  (Interface)                      │
│                                                  │
│  send(message: EmailMessage): Promise<SendResult>│
│  sendBatch(msgs: EmailMessage[]): Promise<...>   │
│  getQuota(): Promise<QuotaInfo>                  │
│  validateDomain(domain: string): Promise<...>    │
│  getEvents(since: Date): Promise<EmailEvent[]>   │
└──────────────────┬───────────────────────────────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
┌──────▼──┐  ┌────▼────┐  ┌───▼──────┐
│ Resend  │  │SendGrid │  │ AWS SES  │
│ Adapter │  │ Adapter │  │ Adapter  │
│         │  │         │  │          │
│ REST API│  │ REST API│  │ AWS SDK  │
└─────────┘  └─────────┘  └──────────┘
```

### Event Pipeline

Every email interaction flows through a unified event pipeline:

```
ESP Webhook ──▶ Webhook Router ──▶ Event Normalizer ──▶ Redpanda Topic
                                                            │
                    ┌───────────────────────────────────────┘
                    │
          ┌────────┼────────┬────────────┬─────────────┐
          │        │        │            │             │
          ▼        ▼        ▼            ▼             ▼
      Analytics  Bounce   Engagement  Automation   CDP Profile
      Aggregator Processor Scorer     Trigger Eval  Updater
```

**Event Topics (Redpanda):**

| Topic | Description |
|-------|-------------|
| `email.send.requested` | Campaign send initiated |
| `email.send.completed` | Individual email dispatched to ESP |
| `email.delivered` | ESP confirmed delivery to recipient MTA |
| `email.opened` | Tracking pixel loaded (with privacy caveats) |
| `email.clicked` | Link in email clicked |
| `email.bounced.soft` | Temporary delivery failure |
| `email.bounced.hard` | Permanent delivery failure |
| `email.complained` | Recipient marked as spam (FBL) |
| `email.unsubscribed` | Recipient clicked unsubscribe |
| `email.converted` | Attribution window conversion detected |

---

## Core Interfaces

### Campaign

```typescript
/**
 * Represents an email campaign — the top-level entity for a marketing
 * or transactional email send.
 */
interface Campaign {
  /** UUID primary key */
  id: string;

  /** Tenant ID for multi-tenant isolation */
  tenantId: string;

  /** Human-readable campaign name (internal, not shown to recipients) */
  name: string;

  /** Subject line (supports merge tags: {{first_name}}) */
  subject: string;

  /** Preview text shown in inbox alongside subject */
  previewText: string | null;

  /** Sender display name */
  fromName: string;

  /** Sender email address (must be verified domain) */
  fromEmail: string;

  /** Reply-to email address (can differ from fromEmail) */
  replyTo: string | null;

  /** Campaign type discriminator */
  type: CampaignType;

  /** Current lifecycle status */
  status: CampaignStatus;

  /** Reference to the email template used */
  templateId: string;

  /** Compiled HTML content (snapshot at send time) */
  compiledHtml: string | null;

  /** Plain-text fallback content */
  plainText: string | null;

  /** Target subscriber list IDs */
  listIds: string[];

  /** CDP segment IDs to include */
  segmentIds: string[];

  /** Suppression list IDs to exclude */
  suppressionListIds: string[];

  /** Tag-based targeting (include subscribers with any of these tags) */
  includeTags: string[];

  /** Tag-based exclusion (exclude subscribers with any of these tags) */
  excludeTags: string[];

  /** Scheduled send time (null = immediate when status transitions to 'sending') */
  scheduledAt: Date | null;

  /** Whether to use send-time optimization per recipient timezone */
  sendTimeOptimization: boolean;

  /** Preferred send window (hour range in recipient's local time) */
  sendWindow: { startHour: number; endHour: number } | null;

  /** A/B test configuration (null if not an A/B test) */
  abTestId: string | null;

  /** Provider to use (null = use tenant default) */
  providerId: string | null;

  /** IP pool to use (null = shared pool) */
  ipPoolId: string | null;

  /** Custom tracking parameters appended to all links */
  utmParams: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  } | null;

  /** Custom headers to include in the email */
  customHeaders: Record<string, string>;

  /** Metadata / arbitrary key-value pairs */
  metadata: Record<string, unknown>;

  /** Total recipients at send time */
  recipientCount: number;

  /** Timestamp when the campaign was actually sent */
  sentAt: Date | null;

  /** User who created the campaign */
  createdBy: string;

  /** Standard timestamps */
  createdAt: Date;
  updatedAt: Date;

  /** Soft delete */
  deletedAt: Date | null;
}

type CampaignType =
  | 'marketing'        // Standard marketing campaign
  | 'transactional'    // Receipts, password resets, etc.
  | 'automated'        // Triggered by automation flow
  | 'ab_test'          // A/B test campaign
  | 'rss'              // RSS-to-email digest
  | 'reengagement';    // Win-back campaign

type CampaignStatus =
  | 'draft'            // Being composed
  | 'scheduled'        // Approved and waiting for send time
  | 'sending'          // Currently being dispatched
  | 'sent'             // All emails dispatched
  | 'paused'           // Manually paused during send
  | 'cancelled'        // Cancelled before completion
  | 'archived';        // Completed and archived
```

### EmailTemplate

```typescript
/**
 * Email template with block-based structure for the visual editor.
 */
interface EmailTemplate {
  /** UUID primary key */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Template name */
  name: string;

  /** Description / notes */
  description: string | null;

  /** Category for organization (e.g., 'promotional', 'transactional', 'newsletter') */
  category: string;

  /** Tags for filtering */
  tags: string[];

  /** Whether this is a system template (not editable by tenant) */
  isSystem: boolean;

  /** Whether this template is available in the template library */
  isPublished: boolean;

  /** Block-based content structure for the visual editor */
  blocks: TemplateBlock[];

  /** Raw HTML source (for HTML editor mode) */
  htmlSource: string;

  /** Compiled HTML with merge tag placeholders */
  compiledHtml: string;

  /** Plain-text version */
  plainText: string;

  /** Design settings (colors, fonts, layout) */
  designSettings: TemplateDesignSettings;

  /** Thumbnail preview URL */
  thumbnailUrl: string | null;

  /** Version number (incremented on each save) */
  version: number;

  /** Parent template ID (for variants / forks) */
  parentTemplateId: string | null;

  /** User who last edited */
  lastEditedBy: string;

  /** Standard timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateBlock {
  /** Unique block ID within the template */
  id: string;

  /** Block type discriminator */
  type: BlockType;

  /** Sort order within parent */
  order: number;

  /** Block-specific content (varies by type) */
  content: Record<string, unknown>;

  /** Block-level styling overrides */
  styles: Record<string, string>;

  /** Conditional rendering rules */
  conditions: ConditionalRule[] | null;

  /** Nested blocks (for layout blocks like columns) */
  children: TemplateBlock[] | null;
}

type BlockType =
  | 'header'
  | 'text'
  | 'image'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'columns'        // 2-4 column layout
  | 'product'        // Product card with image, name, price
  | 'product_grid'   // Grid of product cards
  | 'social'         // Social media icon links
  | 'footer'         // Footer with unsubscribe, address
  | 'menu'           // Navigation menu
  | 'video'          // Video thumbnail with play button
  | 'countdown'      // Countdown timer (rendered as animated GIF)
  | 'html'           // Raw HTML block
  | 'dynamic'        // Server-rendered dynamic content
  | 'conditional';   // Shows/hides based on merge data

interface TemplateDesignSettings {
  /** Background color for the email body */
  backgroundColor: string;

  /** Content area background color */
  contentBackgroundColor: string;

  /** Content area width in pixels */
  contentWidth: number;

  /** Default font family */
  fontFamily: string;

  /** Default font size */
  fontSize: string;

  /** Default text color */
  textColor: string;

  /** Default link color */
  linkColor: string;

  /** Default heading color */
  headingColor: string;

  /** Default button styles */
  buttonDefaults: {
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
    padding: string;
  };

  /** Border radius for content blocks */
  blockBorderRadius: string;

  /** Spacing between blocks */
  blockSpacing: string;
}
```

### SubscriberList

```typescript
/**
 * A named collection of email subscribers.
 * Lists can be populated manually, via CSV import, or synced from CDP segments.
 */
interface SubscriberList {
  /** UUID primary key */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** List name */
  name: string;

  /** Description */
  description: string | null;

  /** Whether this list requires double opt-in */
  doubleOptIn: boolean;

  /** Welcome email template ID (sent on subscription) */
  welcomeTemplateId: string | null;

  /** CDP segment ID this list syncs from (null = manual list) */
  cdpSegmentId: string | null;

  /** Sync frequency for CDP-linked lists */
  syncFrequency: 'realtime' | 'hourly' | 'daily' | null;

  /** Last sync timestamp */
  lastSyncAt: Date | null;

  /** Total subscriber count (denormalized for performance) */
  subscriberCount: number;

  /** Active (non-unsubscribed, non-bounced) subscriber count */
  activeCount: number;

  /** Tags applied to all subscribers in this list */
  defaultTags: string[];

  /** Custom fields schema for this list */
  customFields: CustomFieldDefinition[];

  /** Standard timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface Subscriber {
  /** UUID primary key */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Email address (unique per tenant) */
  email: string;

  /** First name */
  firstName: string | null;

  /** Last name */
  lastName: string | null;

  /** Subscriber status */
  status: SubscriberStatus;

  /** Source of acquisition */
  source: string;

  /** Tags for segmentation */
  tags: string[];

  /** Custom field values */
  customFields: Record<string, unknown>;

  /** IANA timezone (for send-time optimization) */
  timezone: string | null;

  /** Preferred language (ISO 639-1) */
  language: string | null;

  /** Engagement score (0-100, computed by EngagementScorer) */
  engagementScore: number;

  /** Last engagement timestamp */
  lastEngagedAt: Date | null;

  /** IP address at signup (for geo-location) */
  signupIp: string | null;

  /** CDP profile ID link */
  cdpProfileId: string | null;

  /** Consent record */
  consentGrantedAt: Date | null;
  consentSource: string | null;
  consentIp: string | null;

  /** Double opt-in confirmation */
  confirmedAt: Date | null;

  /** Unsubscribe details */
  unsubscribedAt: Date | null;
  unsubscribeReason: string | null;

  /** Bounce tracking */
  bounceCount: number;
  lastBounceAt: Date | null;
  lastBounceType: 'soft' | 'hard' | null;

  /** Complaint tracking */
  complaintAt: Date | null;

  /** Standard timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type SubscriberStatus =
  | 'pending'         // Awaiting double opt-in confirmation
  | 'active'          // Confirmed and receiving emails
  | 'unsubscribed'    // Opted out
  | 'bounced'         // Hard bounced (permanent)
  | 'complained'      // Marked as spam via FBL
  | 'cleaned';        // Removed by list hygiene

interface CustomFieldDefinition {
  /** Field key (slug) */
  key: string;

  /** Display label */
  label: string;

  /** Field type */
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';

  /** Required on signup forms */
  required: boolean;

  /** Default value */
  defaultValue: unknown;

  /** Options for 'select' type */
  options: string[] | null;
}
```

### AutomationFlow

```typescript
/**
 * An automation flow is a directed acyclic graph of steps triggered by
 * an event or condition. Each step can send an email, wait, branch, or
 * update subscriber data.
 */
interface AutomationFlow {
  /** UUID primary key */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Flow name */
  name: string;

  /** Description */
  description: string | null;

  /** Flow status */
  status: 'draft' | 'active' | 'paused' | 'archived';

  /** Trigger that starts this flow */
  trigger: AutomationTrigger;

  /** Entry conditions (additional filters beyond the trigger) */
  entryConditions: ConditionalRule[];

  /** Re-entry policy */
  reentryPolicy: 'allow' | 'deny' | 'allow_after_exit';

  /** Maximum entries per subscriber (0 = unlimited) */
  maxEntriesPerSubscriber: number;

  /** Goal event (if reached, subscriber exits the flow as "converted") */
  goalEvent: string | null;

  /** Steps in the flow (ordered, with branching via nextStepIds) */
  steps: AutomationStep[];

  /** Total subscribers currently in this flow */
  activeSubscriberCount: number;

  /** Total subscribers who completed the flow */
  completedCount: number;

  /** Total subscribers who met the goal */
  convertedCount: number;

  /** Analytics summary */
  analytics: {
    totalEntered: number;
    totalExited: number;
    totalConverted: number;
    averageDurationMs: number;
  };

  /** User who created */
  createdBy: string;

  /** Standard timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface AutomationTrigger {
  /** Trigger type */
  type: AutomationTriggerType;

  /** Event name (for event-based triggers) */
  eventName: string | null;

  /** Event filters (e.g., { "product.category": "shoes" }) */
  eventFilters: Record<string, unknown> | null;

  /** Schedule (for time-based triggers like birthday) */
  schedule: {
    field: string;          // Subscriber field (e.g., 'customFields.birthday')
    offsetDays: number;     // Days before/after (negative = before)
    sendTime: string;       // HH:MM in subscriber timezone
  } | null;

  /** Segment entry (for segment-based triggers) */
  segmentId: string | null;

  /** List subscription (for list-based triggers) */
  listId: string | null;
}

type AutomationTriggerType =
  | 'event'              // Custom event from CDP/app
  | 'list_subscribe'     // Subscriber added to list
  | 'list_unsubscribe'   // Subscriber removed from list
  | 'segment_enter'      // Subscriber enters CDP segment
  | 'segment_exit'       // Subscriber exits CDP segment
  | 'tag_added'          // Tag applied to subscriber
  | 'date_field'         // Date-based (birthday, anniversary)
  | 'email_opened'       // Opened a specific campaign
  | 'email_clicked'      // Clicked in a specific campaign
  | 'email_not_opened'   // Did NOT open within time window
  | 'manual';            // Manually triggered via API

interface AutomationStep {
  /** UUID step ID */
  id: string;

  /** Step type */
  type: AutomationStepType;

  /** Display name */
  name: string;

  /** Position in visual editor (for rendering) */
  position: { x: number; y: number };

  /** Step configuration (varies by type) */
  config: AutomationStepConfig;

  /** Next step IDs (single for linear, multiple for branches) */
  nextStepIds: string[];

  /** Step-level analytics */
  analytics: {
    entered: number;
    completed: number;
    failed: number;
  };
}

type AutomationStepType =
  | 'send_email'        // Send an email
  | 'wait_duration'     // Wait for a fixed duration
  | 'wait_until'        // Wait until a specific date/time
  | 'wait_event'        // Wait for an event (with timeout)
  | 'branch'            // Conditional branch (if/else)
  | 'ab_split'          // Random split for testing
  | 'update_subscriber' // Update subscriber fields/tags
  | 'add_to_list'       // Add subscriber to another list
  | 'remove_from_list'  // Remove subscriber from a list
  | 'webhook'           // Call external webhook
  | 'goal_check'        // Check if goal has been met
  | 'exit';             // End the flow

type AutomationStepConfig =
  | SendEmailConfig
  | WaitDurationConfig
  | WaitUntilConfig
  | WaitEventConfig
  | BranchConfig
  | ABSplitConfig
  | UpdateSubscriberConfig
  | ListActionConfig
  | WebhookConfig
  | GoalCheckConfig
  | ExitConfig;

interface SendEmailConfig {
  type: 'send_email';
  templateId: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  /** Skip if subscriber hasn't engaged in N days */
  engagementThreshold: number | null;
}

interface WaitDurationConfig {
  type: 'wait_duration';
  duration: {
    value: number;
    unit: 'minutes' | 'hours' | 'days' | 'weeks';
  };
}

interface WaitUntilConfig {
  type: 'wait_until';
  /** ISO date-time or merge tag reference */
  dateTime: string;
}

interface WaitEventConfig {
  type: 'wait_event';
  eventName: string;
  eventFilters: Record<string, unknown> | null;
  timeout: {
    value: number;
    unit: 'hours' | 'days' | 'weeks';
  };
  /** Step to go to on timeout (instead of default next) */
  timeoutStepId: string | null;
}

interface BranchConfig {
  type: 'branch';
  conditions: Array<{
    rules: ConditionalRule[];
    nextStepId: string;
  }>;
  /** Fallback step if no conditions match */
  elseStepId: string;
}

interface ABSplitConfig {
  type: 'ab_split';
  variants: Array<{
    name: string;
    percentage: number;
    nextStepId: string;
  }>;
}
```

### EmailAnalytics

```typescript
/**
 * Analytics data for a campaign or automation step.
 */
interface EmailAnalytics {
  /** Campaign or step ID */
  entityId: string;

  /** Entity type */
  entityType: 'campaign' | 'automation_step';

  /** Time range for this analytics snapshot */
  timeRange: {
    start: Date;
    end: Date;
  };

  /** Delivery metrics */
  delivery: {
    /** Total emails queued for sending */
    queued: number;
    /** Successfully sent to ESP */
    sent: number;
    /** Confirmed delivered by ESP */
    delivered: number;
    /** Delivery rate (delivered / sent) */
    deliveryRate: number;
    /** Soft bounces */
    softBounces: number;
    /** Hard bounces */
    hardBounces: number;
    /** Bounce rate ((soft + hard) / sent) */
    bounceRate: number;
    /** Spam complaints */
    complaints: number;
    /** Complaint rate (complaints / delivered) */
    complaintRate: number;
  };

  /** Engagement metrics */
  engagement: {
    /** Unique opens */
    uniqueOpens: number;
    /** Total opens (including re-opens) */
    totalOpens: number;
    /** Open rate (unique opens / delivered) */
    openRate: number;
    /** Unique clicks */
    uniqueClicks: number;
    /** Total clicks */
    totalClicks: number;
    /** Click rate (unique clicks / delivered) */
    clickRate: number;
    /** Click-to-open rate (unique clicks / unique opens) */
    clickToOpenRate: number;
    /** Unsubscribes from this email */
    unsubscribes: number;
    /** Unsubscribe rate (unsubscribes / delivered) */
    unsubscribeRate: number;
  };

  /** Conversion metrics */
  conversion: {
    /** Total conversions attributed to this email */
    conversions: number;
    /** Conversion rate (conversions / unique clicks) */
    conversionRate: number;
    /** Total revenue attributed */
    revenue: number;
    /** Revenue per email (revenue / delivered) */
    revenuePerEmail: number;
    /** Average order value from email conversions */
    averageOrderValue: number;
  };

  /** Link-level click data */
  linkClicks: Array<{
    url: string;
    uniqueClicks: number;
    totalClicks: number;
    /** Position in the email (for heatmap) */
    position: { x: number; y: number; width: number; height: number } | null;
  }>;

  /** Device breakdown */
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
    unknown: number;
  };

  /** Email client breakdown */
  emailClients: Array<{
    client: string;    // e.g., 'Gmail', 'Apple Mail', 'Outlook'
    count: number;
    percentage: number;
  }>;

  /** Geographic breakdown */
  geoBreakdown: Array<{
    country: string;
    region: string | null;
    count: number;
  }>;

  /** Hourly engagement timeline */
  timeline: Array<{
    hour: Date;
    opens: number;
    clicks: number;
    unsubscribes: number;
  }>;
}

interface EmailHeatmap {
  /** Campaign ID */
  campaignId: string;

  /** Base HTML for overlay rendering */
  baseHtml: string;

  /** Click zones with intensity */
  zones: Array<{
    /** CSS selector or position coordinates */
    selector: string;
    position: { x: number; y: number; width: number; height: number };
    /** Click count */
    clicks: number;
    /** Relative intensity (0-1) */
    intensity: number;
    /** The URL this zone links to */
    href: string;
  }>;

  /** Generated at timestamp */
  generatedAt: Date;
}
```

### DeliverabilityMonitor

```typescript
/**
 * Monitors and reports on email deliverability health.
 */
interface DeliverabilityMonitor {
  /** Check authentication records for a domain */
  checkAuthentication(domain: string): Promise<AuthenticationStatus>;

  /** Get current reputation score for a sending domain/IP */
  getReputation(domainOrIp: string): Promise<ReputationScore>;

  /** Run an inbox placement test */
  runInboxPlacementTest(
    campaignId: string,
    seedListId: string
  ): Promise<InboxPlacementResult>;

  /** Get deliverability report for a time range */
  getReport(params: {
    tenantId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<DeliverabilityReport>;

  /** Get blocklist status for IPs */
  checkBlocklists(ips: string[]): Promise<BlocklistStatus[]>;
}

interface AuthenticationStatus {
  domain: string;
  spf: {
    status: 'pass' | 'fail' | 'missing';
    record: string | null;
    issues: string[];
  };
  dkim: {
    status: 'pass' | 'fail' | 'missing';
    selector: string | null;
    keyLength: number | null;
    issues: string[];
  };
  dmarc: {
    status: 'pass' | 'fail' | 'missing';
    policy: 'none' | 'quarantine' | 'reject' | null;
    record: string | null;
    issues: string[];
  };
  bimi: {
    status: 'pass' | 'fail' | 'missing';
    logoUrl: string | null;
  };
  overallScore: number; // 0-100
  recommendations: string[];
}

interface ReputationScore {
  /** Domain or IP being scored */
  entity: string;

  /** Overall reputation score (0-100) */
  score: number;

  /** Reputation tier */
  tier: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

  /** Component scores */
  components: {
    /** Bounce rate impact */
    bounceScore: number;
    /** Complaint rate impact */
    complaintScore: number;
    /** Engagement impact (opens, clicks) */
    engagementScore: number;
    /** Blocklist presence impact */
    blocklistScore: number;
    /** Authentication impact */
    authenticationScore: number;
    /** Volume consistency impact */
    volumeScore: number;
  };

  /** Historical trend (last 30 days, daily) */
  trend: Array<{
    date: Date;
    score: number;
  }>;

  /** Active alerts */
  alerts: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
    detectedAt: Date;
  }>;

  /** Last updated */
  updatedAt: Date;
}

interface InboxPlacementResult {
  /** Test ID */
  testId: string;

  /** Campaign used for the test */
  campaignId: string;

  /** Overall inbox placement rate */
  inboxRate: number;

  /** Results by provider */
  providers: Array<{
    provider: string;    // e.g., 'Gmail', 'Outlook', 'Yahoo'
    inbox: number;       // Count landed in inbox
    spam: number;        // Count landed in spam
    missing: number;     // Count not received
    tabs: string | null; // Gmail tab (primary, promotions, etc.)
  }>;

  /** Test timestamp */
  testedAt: Date;
}

interface DeliverabilityReport {
  /** Report time range */
  timeRange: { start: Date; end: Date };

  /** Overall health score (0-100) */
  healthScore: number;

  /** Key metrics summary */
  metrics: {
    totalSent: number;
    deliveryRate: number;
    bounceRate: number;
    complaintRate: number;
    unsubscribeRate: number;
    inboxPlacementRate: number | null;
  };

  /** Domain-level breakdown */
  domainBreakdown: Array<{
    domain: string;
    sent: number;
    delivered: number;
    bounced: number;
    complained: number;
    reputation: ReputationScore;
  }>;

  /** ISP-level breakdown */
  ispBreakdown: Array<{
    isp: string;
    sent: number;
    deliveryRate: number;
    openRate: number;
    issues: string[];
  }>;

  /** Recommendations */
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    message: string;
    action: string;
  }>;
}
```

### ABTest

```typescript
/**
 * A/B test configuration and results for email campaigns.
 */
interface ABTest {
  /** UUID primary key */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Parent campaign ID */
  campaignId: string;

  /** Test name */
  name: string;

  /** What is being tested */
  testType: ABTestType;

  /** Test status */
  status: 'draft' | 'running' | 'completed' | 'cancelled';

  /** Variants */
  variants: ABTestVariant[];

  /** Metric to determine the winner */
  winnerMetric: ABTestMetric;

  /** Sample size as percentage of total list (e.g., 20 = 20%) */
  sampleSizePercent: number;

  /** Minimum sample size per variant before evaluation */
  minSamplePerVariant: number;

  /** Statistical confidence threshold (e.g., 0.95 = 95%) */
  confidenceThreshold: number;

  /** Duration to wait before selecting winner */
  testDuration: {
    value: number;
    unit: 'hours' | 'days';
  };

  /** Whether to automatically send the winner to remaining list */
  autoSelectWinner: boolean;

  /** Winning variant ID (set when test completes) */
  winnerVariantId: string | null;

  /** Statistical confidence achieved */
  achievedConfidence: number | null;

  /** Timestamps */
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ABTestVariant {
  /** Variant ID */
  id: string;

  /** Variant label (e.g., 'A', 'B', 'C') */
  label: string;

  /** Variant name / description */
  name: string;

  /** Traffic allocation percentage */
  percentage: number;

  /** Variant-specific overrides (depends on testType) */
  overrides: {
    subject?: string;
    previewText?: string;
    fromName?: string;
    templateId?: string;
    sendTime?: Date;
    content?: Record<string, unknown>;
  };

  /** Results for this variant */
  results: {
    sent: number;
    delivered: number;
    opens: number;
    clicks: number;
    conversions: number;
    revenue: number;
    unsubscribes: number;
    bounces: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    revenuePerEmail: number;
  } | null;
}

type ABTestType =
  | 'subject_line'
  | 'preview_text'
  | 'from_name'
  | 'content'
  | 'send_time'
  | 'template';

type ABTestMetric =
  | 'open_rate'
  | 'click_rate'
  | 'click_to_open_rate'
  | 'conversion_rate'
  | 'revenue';
```

### EmailCampaignService

```typescript
/**
 * Primary service interface for the email campaigns module.
 * Orchestrates campaign CRUD, sending, and analytics.
 */
interface EmailCampaignService {
  // === Campaign CRUD ===

  /** Create a new campaign */
  createCampaign(input: CreateCampaignInput): Promise<Campaign>;

  /** Get a campaign by ID */
  getCampaign(id: string): Promise<Campaign>;

  /** List campaigns with filtering and pagination */
  listCampaigns(params: ListCampaignsParams): Promise<PaginatedResult<Campaign>>;

  /** Update a draft campaign */
  updateCampaign(id: string, input: UpdateCampaignInput): Promise<Campaign>;

  /** Duplicate a campaign */
  duplicateCampaign(id: string): Promise<Campaign>;

  /** Delete a campaign (soft delete) */
  deleteCampaign(id: string): Promise<void>;

  /** Archive a completed campaign */
  archiveCampaign(id: string): Promise<void>;

  // === Campaign Actions ===

  /** Schedule a campaign for future send */
  scheduleCampaign(id: string, sendAt: Date): Promise<Campaign>;

  /** Send a campaign immediately */
  sendCampaign(id: string): Promise<Campaign>;

  /** Pause a sending campaign */
  pauseCampaign(id: string): Promise<Campaign>;

  /** Resume a paused campaign */
  resumeCampaign(id: string): Promise<Campaign>;

  /** Cancel a scheduled or sending campaign */
  cancelCampaign(id: string): Promise<Campaign>;

  /** Send a test/preview email */
  sendTestEmail(campaignId: string, recipientEmail: string): Promise<void>;

  /** Preview rendered HTML for a specific subscriber */
  previewForSubscriber(campaignId: string, subscriberId: string): Promise<{
    subject: string;
    html: string;
    plainText: string;
  }>;

  // === Templates ===

  /** Create a new template */
  createTemplate(input: CreateTemplateInput): Promise<EmailTemplate>;

  /** Get a template by ID */
  getTemplate(id: string): Promise<EmailTemplate>;

  /** List templates */
  listTemplates(params: ListTemplatesParams): Promise<PaginatedResult<EmailTemplate>>;

  /** Update a template */
  updateTemplate(id: string, input: UpdateTemplateInput): Promise<EmailTemplate>;

  /** Delete a template */
  deleteTemplate(id: string): Promise<void>;

  /** Duplicate a template */
  duplicateTemplate(id: string): Promise<EmailTemplate>;

  /** Compile template blocks to HTML */
  compileTemplate(templateId: string): Promise<{ html: string; plainText: string }>;

  // === Lists ===

  /** Create a subscriber list */
  createList(input: CreateListInput): Promise<SubscriberList>;

  /** Get a list by ID */
  getList(id: string): Promise<SubscriberList>;

  /** List subscriber lists */
  listLists(params: ListListsParams): Promise<PaginatedResult<SubscriberList>>;

  /** Add subscriber to a list */
  addSubscriber(listId: string, input: AddSubscriberInput): Promise<Subscriber>;

  /** Bulk import subscribers */
  importSubscribers(
    listId: string,
    input: ImportSubscribersInput
  ): Promise<ImportResult>;

  /** Remove subscriber from a list */
  removeSubscriber(listId: string, subscriberId: string): Promise<void>;

  /** Unsubscribe (global or list-level) */
  unsubscribe(token: string): Promise<{ email: string; listId: string | null }>;

  // === Automation ===

  /** Create an automation flow */
  createAutomation(input: CreateAutomationInput): Promise<AutomationFlow>;

  /** Activate an automation flow */
  activateAutomation(id: string): Promise<AutomationFlow>;

  /** Pause an automation flow */
  pauseAutomation(id: string): Promise<AutomationFlow>;

  /** Get automation analytics */
  getAutomationAnalytics(id: string): Promise<AutomationAnalytics>;

  // === A/B Testing ===

  /** Create an A/B test for a campaign */
  createABTest(campaignId: string, input: CreateABTestInput): Promise<ABTest>;

  /** Get A/B test results */
  getABTestResults(testId: string): Promise<ABTest>;

  /** Manually select A/B test winner */
  selectWinner(testId: string, variantId: string): Promise<ABTest>;

  // === Analytics ===

  /** Get campaign analytics */
  getCampaignAnalytics(campaignId: string): Promise<EmailAnalytics>;

  /** Get click heatmap for a campaign */
  getHeatmap(campaignId: string): Promise<EmailHeatmap>;

  /** Get aggregate analytics across campaigns */
  getAggregateAnalytics(params: AggregateAnalyticsParams): Promise<AggregateAnalytics>;

  // === Deliverability ===

  /** Get deliverability report */
  getDeliverabilityReport(params: DeliverabilityReportParams): Promise<DeliverabilityReport>;

  /** Check domain authentication */
  checkDomainAuth(domain: string): Promise<AuthenticationStatus>;

  /** Get sender reputation */
  getSenderReputation(domainOrIp: string): Promise<ReputationScore>;
}
```

---

## Database Schemas

### email_campaigns

```typescript
import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { tenantId, timestamps, softDelete } from '@mcv/database/shared';

export const campaignTypeEnum = pgEnum('campaign_type', [
  'marketing',
  'transactional',
  'automated',
  'ab_test',
  'rss',
  'reengagement',
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'sending',
  'sent',
  'paused',
  'cancelled',
  'archived',
]);

export const emailCampaigns = pgTable('email_campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),

  name: text('name').notNull(),
  subject: text('subject').notNull(),
  previewText: text('preview_text'),
  fromName: text('from_name').notNull(),
  fromEmail: text('from_email').notNull(),
  replyTo: text('reply_to'),

  type: campaignTypeEnum('type').notNull().default('marketing'),
  status: campaignStatusEnum('status').notNull().default('draft'),

  templateId: uuid('template_id')
    .notNull()
    .references(() => emailTemplates.id),

  compiledHtml: text('compiled_html'),
  plainText: text('plain_text'),

  listIds: uuid('list_ids').array().notNull().default([]),
  segmentIds: uuid('segment_ids').array().default([]),
  suppressionListIds: uuid('suppression_list_ids').array().default([]),

  includeTags: text('include_tags').array().default([]),
  excludeTags: text('exclude_tags').array().default([]),

  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sendTimeOptimization: boolean('send_time_optimization').notNull().default(false),
  sendWindow: jsonb('send_window').$type<{ startHour: number; endHour: number }>(),

  abTestId: uuid('ab_test_id'),

  providerId: text('provider_id'),
  ipPoolId: text('ip_pool_id'),

  utmParams: jsonb('utm_params').$type<Record<string, string>>(),
  customHeaders: jsonb('custom_headers').$type<Record<string, string>>().default({}),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

  recipientCount: integer('recipient_count').notNull().default(0),
  sentAt: timestamp('sent_at', { withTimezone: true }),

  createdBy: uuid('created_by').notNull(),
  ...timestamps(),
  ...softDelete(),
}, (table) => ({
  // RLS policy enforced at database level
  // Indexes for common query patterns
  tenantStatusIdx: index('idx_email_campaigns_tenant_status')
    .on(table.tenantId, table.status),
  scheduledIdx: index('idx_email_campaigns_scheduled')
    .on(table.scheduledAt)
    .where(sql`status = 'scheduled'`),
  typeIdx: index('idx_email_campaigns_type')
    .on(table.tenantId, table.type),
}));
```

### email_templates

```typescript
export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),

  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull().default('general'),
  tags: text('tags').array().default([]),

  isSystem: boolean('is_system').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(false),

  blocks: jsonb('blocks').$type<TemplateBlock[]>().notNull().default([]),
  htmlSource: text('html_source').notNull().default(''),
  compiledHtml: text('compiled_html').notNull().default(''),
  plainText: text('plain_text').notNull().default(''),

  designSettings: jsonb('design_settings').$type<TemplateDesignSettings>().notNull().default({
    backgroundColor: '#f4f4f4',
    contentBackgroundColor: '#ffffff',
    contentWidth: 600,
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '16px',
    textColor: '#333333',
    linkColor: '#0066cc',
    headingColor: '#222222',
    buttonDefaults: {
      backgroundColor: '#0066cc',
      textColor: '#ffffff',
      borderRadius: '4px',
      padding: '12px 24px',
    },
    blockBorderRadius: '0px',
    blockSpacing: '16px',
  }),

  thumbnailUrl: text('thumbnail_url'),
  version: integer('version').notNull().default(1),
  parentTemplateId: uuid('parent_template_id'),

  lastEditedBy: uuid('last_edited_by').notNull(),
  ...timestamps(),
}, (table) => ({
  tenantCategoryIdx: index('idx_email_templates_tenant_category')
    .on(table.tenantId, table.category),
  publishedIdx: index('idx_email_templates_published')
    .on(table.tenantId, table.isPublished),
}));
```

### subscriber_lists

```typescript
export const subscriberLists = pgTable('subscriber_lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),

  name: text('name').notNull(),
  description: text('description'),

  doubleOptIn: boolean('double_opt_in').notNull().default(true),
  welcomeTemplateId: uuid('welcome_template_id'),

  cdpSegmentId: uuid('cdp_segment_id'),
  syncFrequency: text('sync_frequency').$type<'realtime' | 'hourly' | 'daily'>(),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),

  subscriberCount: integer('subscriber_count').notNull().default(0),
  activeCount: integer('active_count').notNull().default(0),

  defaultTags: text('default_tags').array().default([]),
  customFields: jsonb('custom_fields').$type<CustomFieldDefinition[]>().default([]),

  ...timestamps(),
}, (table) => ({
  tenantNameIdx: index('idx_subscriber_lists_tenant_name')
    .on(table.tenantId, table.name),
}));
```

### list_subscribers

```typescript
export const subscriberStatusEnum = pgEnum('subscriber_status', [
  'pending',
  'active',
  'unsubscribed',
  'bounced',
  'complained',
  'cleaned',
]);

export const listSubscribers = pgTable('list_subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),

  listId: uuid('list_id')
    .notNull()
    .references(() => subscriberLists.id, { onDelete: 'cascade' }),

  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),

  status: subscriberStatusEnum('status').notNull().default('pending'),
  source: text('source').notNull().default('manual'),

  tags: text('tags').array().default([]),
  customFields: jsonb('custom_fields').$type<Record<string, unknown>>().default({}),

  timezone: text('timezone'),
  language: text('language'),

  engagementScore: integer('engagement_score').notNull().default(50),
  lastEngagedAt: timestamp('last_engaged_at', { withTimezone: true }),

  signupIp: text('signup_ip'),
  cdpProfileId: uuid('cdp_profile_id'),

  consentGrantedAt: timestamp('consent_granted_at', { withTimezone: true }),
  consentSource: text('consent_source'),
  consentIp: text('consent_ip'),

  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),

  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  unsubscribeReason: text('unsubscribe_reason'),

  bounceCount: integer('bounce_count').notNull().default(0),
  lastBounceAt: timestamp('last_bounce_at', { withTimezone: true }),
  lastBounceType: text('last_bounce_type').$type<'soft' | 'hard'>(),

  complaintAt: timestamp('complaint_at', { withTimezone: true }),

  ...timestamps(),
}, (table) => ({
  // Unique email per list per tenant
  uniqueEmailPerList: uniqueIndex('uq_list_subscribers_email_list')
    .on(table.tenantId, table.listId, table.email),

  // Fast lookup by email across lists
  emailIdx: index('idx_list_subscribers_email')
    .on(table.tenantId, table.email),

  // Status-based queries
  statusIdx: index('idx_list_subscribers_status')
    .on(table.listId, table.status),

  // Engagement scoring queries
  engagementIdx: index('idx_list_subscribers_engagement')
    .on(table.listId, table.engagementScore),

  // Tag-based queries (GIN index for array containment)
  tagsIdx: index('idx_list_subscribers_tags')
    .on(table.tags)
    .using('gin'),
}));
```

### automation_flows

```typescript
export const automationFlowStatusEnum = pgEnum('automation_flow_status', [
  'draft',
  'active',
  'paused',
  'archived',
]);

export const automationFlows = pgTable('automation_flows', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),

  name: text('name').notNull(),
  description: text('description'),

  status: automationFlowStatusEnum('status').notNull().default('draft'),

  trigger: jsonb('trigger').$type<AutomationTrigger>().notNull(),
  entryConditions: jsonb('entry_conditions').$type<ConditionalRule[]>().default([]),

  reentryPolicy: text('reentry_policy')
    .$type<'allow' | 'deny' | 'allow_after_exit'>()
    .notNull()
    .default('deny'),
  maxEntriesPerSubscriber: integer('max_entries_per_subscriber').notNull().default(1),

  goalEvent: text('goal_event'),

  activeSubscriberCount: integer('active_subscriber_count').notNull().default(0),
  completedCount: integer('completed_count').notNull().default(0),
  convertedCount: integer('converted_count').notNull().default(0),

  analytics: jsonb('analytics').$type<{
    totalEntered: number;
    totalExited: number;
    totalConverted: number;
    averageDurationMs: number;
  }>().default({
    totalEntered: 0,
    totalExited: 0,
    totalConverted: 0,
    averageDurationMs: 0,
  }),

  createdBy: uuid('created_by').notNull(),
  ...timestamps(),
}, (table) => ({
  tenantStatusIdx: index('idx_automation_flows_tenant_status')
    .on(table.tenantId, table.status),
}));
```

### automation_steps

```typescript
export const automationStepTypeEnum = pgEnum('automation_step_type', [
  'send_email',
  'wait_duration',
  'wait_until',
  'wait_event',
  'branch',
  'ab_split',
  'update_subscriber',
  'add_to_list',
  'remove_from_list',
  'webhook',
  'goal_check',
  'exit',
]);

export const automationSteps = pgTable('automation_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),

  flowId: uuid('flow_id')
    .notNull()
    .references(() => automationFlows.id, { onDelete: 'cascade' }),

  type: automationStepTypeEnum('type').notNull(),
  name: text('name').notNull(),

  position: jsonb('position').$type<{ x: number; y: number }>().notNull(),
  config: jsonb('config').$type<AutomationStepConfig>().notNull(),
  nextStepIds: uuid('next_step_ids').array().default([]),

  analytics: jsonb('analytics').$type<{
    entered: number;
    completed: number;
    failed: number;
  }>().default({ entered: 0, completed: 0, failed: 0 }),

  ...timestamps(),
}, (table) => ({
  flowIdx: index('idx_automation_steps_flow')
    .on(table.flowId),
}));
```

### email_sends

```typescript
export const emailSendStatusEnum = pgEnum('email_send_status', [
  'queued',
  'sending',
  'sent',
  'delivered',
  'bounced',
  'failed',
  'suppressed',
]);

export const emailSends = pgTable('email_sends', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),

  campaignId: uuid('campaign_id')
    .references(() => emailCampaigns.id),
  automationFlowId: uuid('automation_flow_id')
    .references(() => automationFlows.id),
  automationStepId: uuid('automation_step_id')
    .references(() => automationSteps.id),

  subscriberId: uuid('subscriber_id')
    .notNull()
    .references(() => listSubscribers.id),
  recipientEmail: text('recipient_email').notNull(),

  status: emailSendStatusEnum('status').notNull().default('queued'),

  /** Provider message ID for tracking */
  providerMessageId: text('provider_message_id'),
  provider: text('provider'), // 'resend', 'sendgrid', 'ses'

  /** Rendered subject (after merge tag resolution) */
  renderedSubject: text('rendered_subject'),

  /** A/B test variant ID if applicable */
  abTestVariantId: uuid('ab_test_variant_id'),

  /** Scheduled send time (for STO) */
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),

  /** Actual send timestamp */
  sentAt: timestamp('sent_at', { withTimezone: true }),

  /** Delivery timestamp from ESP */
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),

  /** First open timestamp */
  firstOpenedAt: timestamp('first_opened_at', { withTimezone: true }),

  /** First click timestamp */
  firstClickedAt: timestamp('first_clicked_at', { withTimezone: true }),

  /** Open count */
  openCount: integer('open_count').notNull().default(0),

  /** Click count */
  clickCount: integer('click_count').notNull().default(0),

  /** Bounce info */
  bounceType: text('bounce_type').$type<'soft' | 'hard'>(),
  bounceCode: text('bounce_code'),
  bounceMessage: text('bounce_message'),

  /** Unsubscribe from this send */
  unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),

  /** Complaint from this send */
  complainedAt: timestamp('complained_at', { withTimezone: true }),

  /** Error details for failed sends */
  errorCode: text('error_code'),
  errorMessage: text('error_message'),

  /** Retry count */
  retryCount: integer('retry_count').notNull().default(0),
  lastRetryAt: timestamp('last_retry_at', { withTimezone: true }),

  ...timestamps(),
}, (table) => ({
  campaignIdx: index('idx_email_sends_campaign')
    .on(table.campaignId),
  subscriberIdx: index('idx_email_sends_subscriber')
    .on(table.subscriberId),
  statusIdx: index('idx_email_sends_status')
    .on(table.campaignId, table.status),
  providerMsgIdx: uniqueIndex('uq_email_sends_provider_msg')
    .on(table.provider, table.providerMessageId),
  scheduledIdx: index('idx_email_sends_scheduled')
    .on(table.scheduledFor)
    .where(sql`status = 'queued'`),
}));
```

### email_events

```typescript
export const emailEventTypeEnum = pgEnum('email_event_type', [
  'queued',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced_soft',
  'bounced_hard',
  'complained',
  'unsubscribed',
  'converted',
  'dropped',
  'deferred',
]);

export const emailEvents = pgTable('email_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),

  sendId: uuid('send_id')
    .notNull()
    .references(() => emailSends.id),
  campaignId: uuid('campaign_id')
    .references(() => emailCampaigns.id),

  eventType: emailEventTypeEnum('event_type').notNull(),

  /** Timestamp from the ESP (not when we received it) */
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),

  /** Raw event data from ESP webhook */
  rawPayload: jsonb('raw_payload').$type<Record<string, unknown>>(),

  /** Parsed event details */
  details: jsonb('details').$type<{
    /** For clicks: the URL clicked */
    url?: string;
    /** For opens: user agent string */
    userAgent?: string;
    /** For opens: device type */
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    /** For opens: email client */
    emailClient?: string;
    /** For bounces: bounce category */
    bounceCategory?: string;
    /** For bounces: diagnostic code */
    diagnosticCode?: string;
    /** For conversions: order ID */
    orderId?: string;
    /** For conversions: revenue amount */
    revenue?: number;
    /** IP address */
    ip?: string;
    /** Geo location */
    geo?: { country: string; region: string; city: string };
  }>(),

  /** Provider that reported this event */
  provider: text('provider'),

  /** Provider's event ID for deduplication */
  providerEventId: text('provider_event_id'),

  ...timestamps(),
}, (table) => ({
  sendIdx: index('idx_email_events_send')
    .on(table.sendId),
  campaignTypeIdx: index('idx_email_events_campaign_type')
    .on(table.campaignId, table.eventType),
  occurredIdx: index('idx_email_events_occurred')
    .on(table.occurredAt),
  // Deduplication index
  providerDedup: uniqueIndex('uq_email_events_provider_dedup')
    .on(table.provider, table.providerEventId),
}));
```

### email_ab_tests

```typescript
export const abTestStatusEnum = pgEnum('ab_test_status', [
  'draft',
  'running',
  'completed',
  'cancelled',
]);

export const emailAbTests = pgTable('email_ab_tests', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),

  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => emailCampaigns.id),

  name: text('name').notNull(),
  testType: text('test_type').$type<ABTestType>().notNull(),
  status: abTestStatusEnum('status').notNull().default('draft'),

  variants: jsonb('variants').$type<ABTestVariant[]>().notNull(),
  winnerMetric: text('winner_metric').$type<ABTestMetric>().notNull().default('open_rate'),

  sampleSizePercent: integer('sample_size_percent').notNull().default(20),
  minSamplePerVariant: integer('min_sample_per_variant').notNull().default(100),
  confidenceThreshold: integer('confidence_threshold').notNull().default(95),

  testDuration: jsonb('test_duration').$type<{
    value: number;
    unit: 'hours' | 'days';
  }>().notNull().default({ value: 4, unit: 'hours' }),

  autoSelectWinner: boolean('auto_select_winner').notNull().default(true),
  winnerVariantId: uuid('winner_variant_id'),
  achievedConfidence: integer('achieved_confidence'),

  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  ...timestamps(),
}, (table) => ({
  campaignIdx: index('idx_email_ab_tests_campaign')
    .on(table.campaignId),
}));
```

### suppression_list

```typescript
export const suppressionReasonEnum = pgEnum('suppression_reason', [
  'hard_bounce',
  'complaint',
  'unsubscribe',
  'manual',
  'list_hygiene',
  'role_address',
  'invalid_format',
  'disposable_domain',
]);

export const suppressionList = pgTable('suppression_list', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: tenantId(),

  email: text('email').notNull(),
  reason: suppressionReasonEnum('reason').notNull(),

  /** Source that triggered the suppression */
  source: text('source').notNull(), // e.g., 'bounce_processor', 'manual', 'import'

  /** Campaign that triggered (if applicable) */
  sourceCampaignId: uuid('source_campaign_id')
    .references(() => emailCampaigns.id),

  /** Additional context */
  details: text('details'),

  /** Whether this is a global suppression (across all lists) */
  isGlobal: boolean('is_global').notNull().default(true),

  /** Specific list ID if list-level suppression */
  listId: uuid('list_id')
    .references(() => subscriberLists.id),

  /** When the suppression expires (null = permanent) */
  expiresAt: timestamp('expires_at', { withTimezone: true }),

  ...timestamps(),
}, (table) => ({
  // Fast lookup by email for send-time suppression checks
  emailIdx: uniqueIndex('uq_suppression_list_email')
    .on(table.tenantId, table.email)
    .where(sql`is_global = true`),

  // List-level suppression lookup
  listEmailIdx: uniqueIndex('uq_suppression_list_list_email')
    .on(table.tenantId, table.listId, table.email)
    .where(sql`is_global = false`),

  reasonIdx: index('idx_suppression_list_reason')
    .on(table.tenantId, table.reason),
}));
```

### Row-Level Security

All tables enforce tenant isolation via RLS policies:

```sql
-- Example RLS policy for email_campaigns
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON email_campaigns
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_insert ON email_campaigns
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Repeated for all email_* tables
-- Service role bypasses RLS for cross-tenant operations (analytics aggregation)
```

---

## Code Examples

### Example 1: Create and Send a Campaign

```typescript
import { EmailCampaignService } from '@mcv/growth/email-campaigns';

const emailService = container.resolve(EmailCampaignService);

// 1. Create the campaign
const campaign = await emailService.createCampaign({
  name: 'February Flash Sale',
  subject: '⚡ {{first_name}}, 50% off everything — today only!',
  previewText: 'Our biggest sale of the year. Don\'t miss out.',
  fromName: 'Sarah at Acme',
  fromEmail: 'sarah@marketing.acme.com',
  replyTo: 'support@acme.com',
  type: 'marketing',
  templateId: 'tmpl_flash_sale_2026',
  listIds: ['list_all_customers'],
  segmentIds: ['seg_engaged_30d'],
  suppressionListIds: ['supp_recent_purchasers'],
  excludeTags: ['vip'], // VIPs get a different campaign
  sendTimeOptimization: true,
  sendWindow: { startHour: 9, endHour: 12 },
  utmParams: {
    source: 'email',
    medium: 'campaign',
    campaign: 'feb-flash-sale-2026',
  },
});

console.log(`Campaign created: ${campaign.id}, status: ${campaign.status}`);
// → Campaign created: cmp_abc123, status: draft

// 2. Send a test email first
await emailService.sendTestEmail(campaign.id, 'sarah@acme.com');

// 3. Preview for a specific subscriber
const preview = await emailService.previewForSubscriber(
  campaign.id,
  'sub_jane_doe'
);
console.log(`Subject: ${preview.subject}`);
// → Subject: ⚡ Jane, 50% off everything — today only!

// 4. Schedule the campaign
const scheduled = await emailService.scheduleCampaign(
  campaign.id,
  new Date('2026-02-14T09:00:00-05:00')
);
console.log(`Scheduled for: ${scheduled.scheduledAt}`);
// → Scheduled for: 2026-02-14T14:00:00.000Z

// 5. Check analytics after sending
const analytics = await emailService.getCampaignAnalytics(campaign.id);
console.log(`
  Delivered: ${analytics.delivery.delivered}
  Open Rate: ${(analytics.engagement.openRate * 100).toFixed(1)}%
  Click Rate: ${(analytics.engagement.clickRate * 100).toFixed(1)}%
  Revenue: $${analytics.conversion.revenue.toFixed(2)}
`);
```

### Example 2: Build an Email Template with Blocks

```typescript
import { CampaignBuilder, TemplateEngine } from '@mcv/growth/email-campaigns';

const builder = container.resolve(CampaignBuilder);
const engine = container.resolve(TemplateEngine);

// Create a template using the block-based builder
const template = await builder.createTemplate({
  name: 'Product Launch Announcement',
  category: 'promotional',
  tags: ['product-launch', 'announcement'],
  designSettings: {
    backgroundColor: '#f8f9fa',
    contentBackgroundColor: '#ffffff',
    contentWidth: 600,
    fontFamily: "'Inter', Arial, sans-serif",
    fontSize: '16px',
    textColor: '#1a1a2e',
    linkColor: '#4361ee',
    headingColor: '#0f0e17',
    buttonDefaults: {
      backgroundColor: '#4361ee',
      textColor: '#ffffff',
      borderRadius: '8px',
      padding: '14px 28px',
    },
    blockBorderRadius: '8px',
    blockSpacing: '20px',
  },
  blocks: [
    {
      id: 'hero',
      type: 'image',
      order: 0,
      content: {
        src: '{{hero_image_url}}',
        alt: 'Introducing {{product_name}}',
        href: '{{product_url}}',
        width: 600,
      },
      styles: {},
      conditions: null,
      children: null,
    },
    {
      id: 'headline',
      type: 'text',
      order: 1,
      content: {
        html: '<h1 style="text-align: center;">Introducing {{product_name}} 🚀</h1>',
      },
      styles: { padding: '24px 40px 0' },
      conditions: null,
      children: null,
    },
    {
      id: 'body',
      type: 'text',
      order: 2,
      content: {
        html: `
          <p>Hi {{first_name|default:"there"}},</p>
          <p>We're thrilled to announce <strong>{{product_name}}</strong> — 
          {{product_tagline}}.</p>
          <p>{{product_description}}</p>
        `,
      },
      styles: { padding: '16px 40px' },
      conditions: null,
      children: null,
    },
    {
      id: 'cta',
      type: 'button',
      order: 3,
      content: {
        text: 'Shop Now →',
        href: '{{product_url}}?utm_source=email&utm_medium=launch',
        align: 'center',
      },
      styles: {},
      conditions: null,
      children: null,
    },
    {
      id: 'early_access',
      type: 'conditional',
      order: 4,
      content: {
        html: `
          <div style="background: #f0f4ff; border-radius: 8px; padding: 20px; text-align: center;">
            <p><strong>🎉 Early Access Exclusive</strong></p>
            <p>As a VIP member, enjoy <strong>20% off</strong> with code: 
            <code>EARLY20</code></p>
          </div>
        `,
      },
      styles: { padding: '0 40px 16px' },
      conditions: [{
        field: 'tags',
        operator: 'contains',
        value: 'vip',
      }],
      children: null,
    },
    {
      id: 'footer',
      type: 'footer',
      order: 5,
      content: {
        companyName: '{{company_name}}',
        address: '{{company_address}}',
        unsubscribeText: 'Unsubscribe from these emails',
        preferencesText: 'Update your preferences',
        socialLinks: [
          { platform: 'twitter', url: 'https://twitter.com/acme' },
          { platform: 'instagram', url: 'https://instagram.com/acme' },
        ],
      },
      styles: {},
      conditions: null,
      children: null,
    },
  ],
});

// Compile the template to HTML
const { html, plainText } = await engine.compile(template.id);
console.log(`Compiled HTML: ${html.length} chars, Plain text: ${plainText.length} chars`);
```

### Example 3: Manage Subscriber Lists and Import

```typescript
import { ListManager } from '@mcv/growth/email-campaigns';

const listManager = container.resolve(ListManager);

// Create a new subscriber list with custom fields
const list = await listManager.createList({
  name: 'Newsletter Subscribers',
  description: 'Weekly product updates and industry insights',
  doubleOptIn: true,
  welcomeTemplateId: 'tmpl_welcome_newsletter',
  customFields: [
    {
      key: 'company',
      label: 'Company Name',
      type: 'text',
      required: false,
      defaultValue: null,
      options: null,
    },
    {
      key: 'role',
      label: 'Job Role',
      type: 'select',
      required: false,
      defaultValue: null,
      options: ['Engineer', 'Designer', 'Manager', 'Executive', 'Other'],
    },
    {
      key: 'interests',
      label: 'Interests',
      type: 'text',
      required: false,
      defaultValue: null,
      options: null,
    },
  ],
  defaultTags: ['newsletter'],
});

// Add a single subscriber
const subscriber = await listManager.addSubscriber(list.id, {
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  source: 'website_signup',
  tags: ['tech', 'early-adopter'],
  customFields: {
    company: 'Acme Corp',
    role: 'Engineer',
    interests: 'AI, Cloud',
  },
  timezone: 'America/New_York',
  language: 'en',
  consentSource: 'signup_form_v3',
});
console.log(`Subscriber ${subscriber.email} status: ${subscriber.status}`);
// → Subscriber jane@example.com status: pending (awaiting double opt-in)

// Bulk import subscribers from CSV
const importResult = await listManager.importSubscribers(list.id, {
  format: 'csv',
  data: Buffer.from(csvContent),
  mapping: {
    email: 'Email Address',
    firstName: 'First Name',
    lastName: 'Last Name',
    'customFields.company': 'Company',
    'customFields.role': 'Role',
  },
  defaultTags: ['imported', 'q1-2026'],
  skipDuplicates: true,
  updateExisting: false,
  consentSource: 'csv_import_feb2026',
});

console.log(`Import results:
  Total rows: ${importResult.totalRows}
  Imported: ${importResult.imported}
  Skipped (duplicate): ${importResult.skippedDuplicate}
  Skipped (invalid): ${importResult.skippedInvalid}
  Skipped (suppressed): ${importResult.skippedSuppressed}
  Errors: ${importResult.errors.length}
`);

// Sync list with CDP segment
await listManager.linkToCdpSegment(list.id, {
  segmentId: 'seg_active_users_30d',
  syncFrequency: 'daily',
  syncMode: 'additive', // Only add new matches, don't remove
});
```

### Example 4: Build an Automation Flow (Welcome Series)

```typescript
import { AutomationEngine, FlowBuilder } from '@mcv/growth/email-campaigns';

const automationEngine = container.resolve(AutomationEngine);
const flowBuilder = container.resolve(FlowBuilder);

// Create a welcome series automation
const flow = await flowBuilder.createFlow({
  name: 'Welcome Series — New Subscribers',
  description: 'Onboard new newsletter subscribers with a 5-email welcome series',
  trigger: {
    type: 'list_subscribe',
    listId: 'list_newsletter',
    eventName: null,
    eventFilters: null,
    schedule: null,
    segmentId: null,
  },
  entryConditions: [
    { field: 'status', operator: 'equals', value: 'active' },
  ],
  reentryPolicy: 'deny',
  maxEntriesPerSubscriber: 1,
  goalEvent: 'purchase.completed',
  steps: [
    // Step 1: Send welcome email immediately
    {
      id: 'step_welcome',
      type: 'send_email',
      name: 'Welcome Email',
      position: { x: 250, y: 100 },
      config: {
        type: 'send_email',
        templateId: 'tmpl_welcome_1',
        subject: 'Welcome to {{company_name}}, {{first_name}}! 👋',
        fromName: 'Team at {{company_name}}',
        fromEmail: 'hello@acme.com',
        replyTo: 'hello@acme.com',
        engagementThreshold: null,
      },
      nextStepIds: ['step_wait_2d'],
      analytics: { entered: 0, completed: 0, failed: 0 },
    },

    // Step 2: Wait 2 days
    {
      id: 'step_wait_2d',
      type: 'wait_duration',
      name: 'Wait 2 days',
      position: { x: 250, y: 200 },
      config: {
        type: 'wait_duration',
        duration: { value: 2, unit: 'days' },
      },
      nextStepIds: ['step_check_opened'],
      analytics: { entered: 0, completed: 0, failed: 0 },
    },

    // Step 3: Branch based on whether they opened the welcome email
    {
      id: 'step_check_opened',
      type: 'branch',
      name: 'Opened Welcome?',
      position: { x: 250, y: 300 },
      config: {
        type: 'branch',
        conditions: [
          {
            rules: [{ field: 'lastEmail.opened', operator: 'equals', value: true }],
            nextStepId: 'step_tips',
          },
        ],
        elseStepId: 'step_reminder',
      },
      nextStepIds: ['step_tips', 'step_reminder'],
      analytics: { entered: 0, completed: 0, failed: 0 },
    },

    // Step 3a: They opened → send tips email
    {
      id: 'step_tips',
      type: 'send_email',
      name: 'Getting Started Tips',
      position: { x: 100, y: 400 },
      config: {
        type: 'send_email',
        templateId: 'tmpl_welcome_2_tips',
        subject: '5 tips to get the most out of {{product_name}}',
        fromName: 'Team at {{company_name}}',
        fromEmail: 'hello@acme.com',
        replyTo: null,
        engagementThreshold: null,
      },
      nextStepIds: ['step_wait_3d'],
      analytics: { entered: 0, completed: 0, failed: 0 },
    },

    // Step 3b: They didn't open → send reminder
    {
      id: 'step_reminder',
      type: 'send_email',
      name: 'Reminder Email',
      position: { x: 400, y: 400 },
      config: {
        type: 'send_email',
        templateId: 'tmpl_welcome_2_reminder',
        subject: 'Did you see this, {{first_name}}?',
        fromName: 'Team at {{company_name}}',
        fromEmail: 'hello@acme.com',
        replyTo: null,
        engagementThreshold: null,
      },
      nextStepIds: ['step_wait_3d'],
      analytics: { entered: 0, completed: 0, failed: 0 },
    },

    // Step 4: Wait 3 more days
    {
      id: 'step_wait_3d',
      type: 'wait_duration',
      name: 'Wait 3 days',
      position: { x: 250, y: 500 },
      config: {
        type: 'wait_duration',
        duration: { value: 3, unit: 'days' },
      },
      nextStepIds: ['step_goal_check'],
      analytics: { entered: 0, completed: 0, failed: 0 },
    },

    // Step 5: Check if goal (purchase) was met
    {
      id: 'step_goal_check',
      type: 'goal_check',
      name: 'Made a Purchase?',
      position: { x: 250, y: 600 },
      config: {
        type: 'goal_check',
      },
      nextStepIds: ['step_case_study', 'step_exit_converted'],
      analytics: { entered: 0, completed: 0, failed: 0 },
    },

    // Step 6: No purchase yet → social proof email
    {
      id: 'step_case_study',
      type: 'send_email',
      name: 'Customer Success Story',
      position: { x: 100, y: 700 },
      config: {
        type: 'send_email',
        templateId: 'tmpl_welcome_3_social_proof',
        subject: 'How {{case_study_company}} achieved {{case_study_result}}',
        fromName: 'Team at {{company_name}}',
        fromEmail: 'hello@acme.com',
        replyTo: null,
        engagementThreshold: 30, // Skip if engagement score < 30
      },
      nextStepIds: ['step_exit'],
      analytics: { entered: 0, completed: 0, failed: 0 },
    },

    // Exit steps
    {
      id: 'step_exit',
      type: 'exit',
      name: 'Flow Complete',
      position: { x: 100, y: 800 },
      config: { type: 'exit' } as ExitConfig,
      nextStepIds: [],
      analytics: { entered: 0, completed: 0, failed: 0 },
    },
    {
      id: 'step_exit_converted',
      type: 'exit',
      name: 'Converted — Exit',
      position: { x: 400, y: 700 },
      config: { type: 'exit' } as ExitConfig,
      nextStepIds: [],
      analytics: { entered: 0, completed: 0, failed: 0 },
    },
  ],
});

// Activate the flow
const activated = await automationEngine.activate(flow.id);
console.log(`Automation "${activated.name}" is now ${activated.status}`);
// → Automation "Welcome Series — New Subscribers" is now active
```

### Example 5: A/B Test a Campaign

```typescript
import { ABTestManager, EmailCampaignService } from '@mcv/growth/email-campaigns';

const abTestManager = container.resolve(ABTestManager);
const emailService = container.resolve(EmailCampaignService);

// Create a campaign with A/B test on subject lines
const campaign = await emailService.createCampaign({
  name: 'Spring Collection Launch',
  subject: '', // Will be set per variant
  previewText: 'New arrivals are here',
  fromName: 'Acme Fashion',
  fromEmail: 'style@acme.com',
  type: 'ab_test',
  templateId: 'tmpl_spring_collection',
  listIds: ['list_fashion_subscribers'],
});

// Configure the A/B test
const abTest = await abTestManager.create({
  campaignId: campaign.id,
  name: 'Subject Line Test — Spring Launch',
  testType: 'subject_line',
  variants: [
    {
      id: 'var_a',
      label: 'A',
      name: 'Emoji + Urgency',
      percentage: 25,
      overrides: {
        subject: '🌸 Spring is here! New collection just dropped — shop now',
      },
      results: null,
    },
    {
      id: 'var_b',
      label: 'B',
      name: 'Personalized + Curiosity',
      percentage: 25,
      overrides: {
        subject: '{{first_name}}, you\'ll love what we\'ve been working on...',
      },
      results: null,
    },
    {
      id: 'var_c',
      label: 'C',
      name: 'Direct + Discount',
      percentage: 25,
      overrides: {
        subject: 'New Spring Collection — 15% off for the first 48 hours',
      },
      results: null,
    },
    {
      id: 'var_d',
      label: 'D',
      name: 'Social Proof',
      percentage: 25,
      overrides: {
        subject: '2,847 people are already shopping our new spring line',
      },
      results: null,
    },
  ],
  winnerMetric: 'click_rate',
  sampleSizePercent: 30, // Test on 30% of the list
  minSamplePerVariant: 250,
  confidenceThreshold: 0.95,
  testDuration: { value: 6, unit: 'hours' },
  autoSelectWinner: true,
});

console.log(`A/B test "${abTest.name}" created with ${abTest.variants.length} variants`);

// Send the campaign (A/B test starts automatically)
await emailService.sendCampaign(campaign.id);

// Check results later
const results = await abTestManager.getResults(abTest.id);
if (results.status === 'completed') {
  const winner = results.variants.find(v => v.id === results.winnerVariantId);
  console.log(`
    Winner: Variant ${winner!.label} — "${winner!.name}"
    Subject: "${winner!.overrides.subject}"
    Click Rate: ${(winner!.results!.clickRate * 100).toFixed(2)}%
    Confidence: ${results.achievedConfidence}%
    
    Remaining ${100 - results.sampleSizePercent}% of list sent with winning variant.
  `);
}
```

### Example 6: Configure Deliverability Monitoring

```typescript
import {
  DeliverabilityMonitor,
  AuthenticationWizard,
  WarmupScheduler,
} from '@mcv/growth/email-campaigns';

const monitor = container.resolve(DeliverabilityMonitor);
const authWizard = container.resolve(AuthenticationWizard);
const warmup = container.resolve(WarmupScheduler);

// Step 1: Check domain authentication
const authStatus = await monitor.checkAuthentication('marketing.acme.com');
console.log(`Domain Authentication Score: ${authStatus.overallScore}/100`);
console.log(`SPF: ${authStatus.spf.status}`);
console.log(`DKIM: ${authStatus.dkim.status} (${authStatus.dkim.keyLength}-bit)`);
console.log(`DMARC: ${authStatus.dmarc.status} (policy: ${authStatus.dmarc.policy})`);

if (authStatus.recommendations.length > 0) {
  console.log('Recommendations:');
  authStatus.recommendations.forEach(r => console.log(`  - ${r}`));
}

// Step 2: Get DNS records to configure (if needed)
if (authStatus.dkim.status !== 'pass') {
  const dkimRecords = await authWizard.getDkimRecords('marketing.acme.com');
  console.log('Add these DNS records:');
  dkimRecords.forEach(record => {
    console.log(`  ${record.type} ${record.name} → ${record.value}`);
  });
}

// Step 3: Set up a warm-up schedule for a new dedicated IP
const warmupSchedule = await warmup.createSchedule({
  ipAddress: '198.51.100.42',
  domain: 'marketing.acme.com',
  targetDailyVolume: 100_000,
  startDate: new Date('2026-02-15'),
  preset: 'conservative', // 30-day ramp
});

console.log('Warm-up Schedule:');
warmupSchedule.phases.forEach(phase => {
  console.log(`  Day ${phase.day}: ${phase.dailyLimit} emails/day (${phase.percentage}%)`);
});
// → Day 1: 200 emails/day (0.2%)
// → Day 5: 1,000 emails/day (1%)
// → Day 10: 5,000 emails/day (5%)
// → Day 15: 15,000 emails/day (15%)
// → Day 20: 40,000 emails/day (40%)
// → Day 25: 70,000 emails/day (70%)
// → Day 30: 100,000 emails/day (100%)

// Step 4: Check reputation
const reputation = await monitor.getReputation('marketing.acme.com');
console.log(`
  Reputation: ${reputation.score}/100 (${reputation.tier})
  Bounce Score: ${reputation.components.bounceScore}/100
  Complaint Score: ${reputation.components.complaintScore}/100
  Engagement: ${reputation.components.engagementScore}/100
`);

if (reputation.alerts.length > 0) {
  console.log('Active Alerts:');
  reputation.alerts.forEach(alert => {
    console.log(`  [${alert.severity}] ${alert.message}`);
  });
}

// Step 5: Run inbox placement test
const placementTest = await monitor.runInboxPlacementTest(
  'cmp_spring_test',
  'seed_list_global'
);

console.log(`Inbox Placement Rate: ${(placementTest.inboxRate * 100).toFixed(1)}%`);
placementTest.providers.forEach(p => {
  const total = p.inbox + p.spam + p.missing;
  console.log(`  ${p.provider}: ${p.inbox}/${total} inbox, ${p.spam} spam${
    p.tabs ? ` (${p.tabs} tab)` : ''
  }`);
});

// Step 6: Check blocklists
const blocklistStatus = await monitor.checkBlocklists([
  '198.51.100.42',
  '198.51.100.43',
]);
blocklistStatus.forEach(status => {
  if (status.listed) {
    console.log(`⚠️ ${status.ip} is listed on: ${status.blocklists.join(', ')}`);
  } else {
    console.log(`✅ ${status.ip} is clean`);
  }
});
```

### Example 7: Handle Webhooks and Process Events

```typescript
import { WebhookRouter, BounceProcessor, EngagementScorer } from '@mcv/growth/email-campaigns';

// Webhook handler registration (in your HTTP server setup)
const webhookRouter = container.resolve(WebhookRouter);

// Resend webhook endpoint
app.post('/webhooks/email/resend', async (req, res) => {
  const signature = req.headers['svix-signature'] as string;
  const timestamp = req.headers['svix-timestamp'] as string;
  const messageId = req.headers['svix-id'] as string;

  try {
    await webhookRouter.handleResend({
      signature,
      timestamp,
      messageId,
      body: req.body,
    });
    res.status(200).json({ received: true });
  } catch (error) {
    if (error.code === 'WEBHOOK_SIGNATURE_INVALID') {
      res.status(401).json({ error: 'Invalid signature' });
    } else {
      res.status(500).json({ error: 'Processing failed' });
    }
  }
});

// SendGrid webhook endpoint (Event Webhook)
app.post('/webhooks/email/sendgrid', async (req, res) => {
  const signature = req.headers['x-twilio-email-event-webhook-signature'] as string;
  const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'] as string;

  try {
    await webhookRouter.handleSendGrid({
      signature,
      timestamp,
      events: req.body, // SendGrid sends array of events
    });
    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({ error: 'Processing failed' });
  }
});

// ─── Event Consumers ───

// Bounce processor — automatically handles bounce events
const bounceProcessor = container.resolve(BounceProcessor);

// Consumer runs continuously, processing events from Redpanda
bounceProcessor.onBounce(async (event) => {
  console.log(`Bounce: ${event.recipientEmail} — ${event.bounceType}`);

  if (event.bounceType === 'hard') {
    // Hard bounce: subscriber is automatically suppressed globally
    console.log(`Hard bounce for ${event.recipientEmail} — suppressed globally`);
  } else {
    // Soft bounce: tracked, subscriber suppressed after 3 consecutive
    console.log(`Soft bounce #${event.bounceCount} for ${event.recipientEmail}`);
    if (event.bounceCount >= 3) {
      console.log(`3 consecutive soft bounces — converting to hard bounce`);
    }
  }
});

// Engagement scorer — updates subscriber engagement scores
const scorer = container.resolve(EngagementScorer);

scorer.onEngagement(async (event) => {
  // Recalculate engagement score based on recency, frequency, and type
  const newScore = await scorer.recalculate(event.subscriberId);
  console.log(`Updated engagement score for ${event.subscriberId}: ${newScore}`);
});
```

### Example 8: Compliance and Preference Center

```typescript
import {
  ComplianceEnforcer,
  PreferenceCenterBuilder,
  ConsentAuditor,
  UnsubscribeHandler,
} from '@mcv/growth/email-campaigns';

const compliance = container.resolve(ComplianceEnforcer);
const prefCenter = container.resolve(PreferenceCenterBuilder);
const consent = container.resolve(ConsentAuditor);
const unsubHandler = container.resolve(UnsubscribeHandler);

// 1. Pre-send compliance check
const check = await compliance.validateCampaign('cmp_spring_promo');
if (!check.passed) {
  console.log('Compliance violations:');
  check.violations.forEach(v => {
    console.log(`  [${v.severity}] ${v.rule}: ${v.message}`);
    console.log(`    Fix: ${v.remediation}`);
  });
  // Example output:
  //   [error] CAN-SPAM-PHYSICAL-ADDRESS: Missing physical mailing address in footer
  //     Fix: Add a physical address block to your email template footer
  //   [warning] GDPR-CONSENT-AGE: 142 recipients lack consent records
  //     Fix: Re-confirm consent or move to suppression list
  throw new Error('Campaign failed compliance check');
}

// 2. Build a preference center
const preferences = await prefCenter.build({
  tenantId: 'tenant_acme',
  branding: {
    logoUrl: 'https://acme.com/logo.png',
    primaryColor: '#4361ee',
    companyName: 'Acme Corp',
  },
  categories: [
    {
      id: 'product_updates',
      name: 'Product Updates',
      description: 'New features, improvements, and releases',
      defaultOptIn: true,
    },
    {
      id: 'promotions',
      name: 'Promotions & Offers',
      description: 'Sales, discounts, and special offers',
      defaultOptIn: true,
    },
    {
      id: 'newsletter',
      name: 'Weekly Newsletter',
      description: 'Industry insights and tips',
      defaultOptIn: false,
    },
    {
      id: 'events',
      name: 'Events & Webinars',
      description: 'Upcoming events and webinar invitations',
      defaultOptIn: false,
    },
  ],
  frequencyOptions: [
    { id: 'realtime', label: 'As they happen' },
    { id: 'daily', label: 'Daily digest' },
    { id: 'weekly', label: 'Weekly digest' },
  ],
  allowUnsubscribeAll: true,
  gdprFields: {
    showDataExportRequest: true,
    showDataDeletionRequest: true,
    showConsentHistory: true,
  },
});
console.log(`Preference center URL: ${preferences.url}`);
// → https://preferences.acme.com/p/abc123

// 3. Handle one-click unsubscribe (RFC 8058 / List-Unsubscribe-Post)
app.post('/unsubscribe', async (req, res) => {
  const { token } = req.body;
  try {
    const result = await unsubHandler.processOneClick(token);
    console.log(`Unsubscribed: ${result.email} from ${result.scope}`);
    res.status(200).send('You have been unsubscribed.');
  } catch (error) {
    if (error.code === 'UNSUBSCRIBE_TOKEN_INVALID') {
      res.status(400).send('Invalid unsubscribe link.');
    } else if (error.code === 'UNSUBSCRIBE_TOKEN_EXPIRED') {
      res.status(410).send('This link has expired.');
    } else {
      res.status(500).send('An error occurred.');
    }
  }
});

// 4. Audit consent records for a subscriber
const auditTrail = await consent.getAuditTrail({
  email: 'jane@example.com',
  tenantId: 'tenant_acme',
});

console.log(`Consent audit trail for jane@example.com:`);
auditTrail.records.forEach(record => {
  console.log(`  ${record.timestamp.toISOString()} — ${record.action}`);
  console.log(`    Source: ${record.source}`);
  console.log(`    IP: ${record.ip}`);
  console.log(`    Lists: ${record.listIds.join(', ')}`);
  if (record.proof) {
    console.log(`    Proof: ${record.proof}`);
  }
});
// Example output:
//   2026-01-15T10:30:00Z — consent_granted
//     Source: signup_form_v3
//     IP: 203.0.113.42
//     Lists: list_newsletter
//     Proof: form_submission_id:fs_abc123
//   2026-02-01T14:20:00Z — preferences_updated
//     Source: preference_center
//     IP: 203.0.113.42
//     Lists: list_newsletter, list_promotions

// 5. GDPR data export
const exportData = await consent.exportSubscriberData({
  email: 'jane@example.com',
  tenantId: 'tenant_acme',
});

// Returns all stored data for the subscriber:
// - Profile information
// - Consent records
// - Email send history
// - Engagement data
// - Tags and segments
// - Custom fields
console.log(`Export contains ${exportData.records} records (${exportData.sizeBytes} bytes)`);
```

---

## Error Codes

All errors follow the MCV error convention with the `EMAIL_` prefix and include machine-readable codes, human-readable messages, and suggested remediation.

| Code | HTTP | Description | Remediation |
|------|------|-------------|-------------|
| `EMAIL_CAMPAIGN_NOT_FOUND` | 404 | Campaign ID does not exist or is not accessible | Verify the campaign ID and tenant context |
| `EMAIL_CAMPAIGN_NOT_DRAFT` | 409 | Operation requires campaign to be in draft status | Duplicate the campaign to create a new draft |
| `EMAIL_CAMPAIGN_ALREADY_SENT` | 409 | Cannot modify a campaign that has already been sent | Create a new campaign instead |
| `EMAIL_CAMPAIGN_NO_RECIPIENTS` | 422 | Campaign has no valid recipients after suppression filtering | Check list membership, segment criteria, and suppression lists |
| `EMAIL_CAMPAIGN_SEND_IN_PROGRESS` | 409 | Campaign is currently being sent and cannot be modified | Wait for send to complete or pause the campaign |
| `EMAIL_TEMPLATE_NOT_FOUND` | 404 | Template ID does not exist | Verify template ID; it may have been deleted |
| `EMAIL_TEMPLATE_COMPILE_ERROR` | 422 | Template contains invalid blocks or Handlebars syntax | Check template blocks for unclosed tags or invalid merge tags |
| `EMAIL_TEMPLATE_SYSTEM_READONLY` | 403 | Cannot modify a system template | Duplicate the system template to create an editable copy |
| `EMAIL_LIST_NOT_FOUND` | 404 | Subscriber list ID does not exist | Verify the list ID and tenant context |
| `EMAIL_SUBSCRIBER_NOT_FOUND` | 404 | Subscriber ID does not exist in the specified list | Verify subscriber ID and list membership |
| `EMAIL_SUBSCRIBER_DUPLICATE` | 409 | Email address already exists in this list | Use `updateExisting` flag or skip duplicates |
| `EMAIL_SUBSCRIBER_SUPPRESSED` | 409 | Email address is on the global suppression list | Remove from suppression list if the suppression was in error |
| `EMAIL_SUBSCRIBER_INVALID_EMAIL` | 422 | Email address format is invalid | Validate email format before submission |
| `EMAIL_AUTOMATION_NOT_FOUND` | 404 | Automation flow ID does not exist | Verify the automation ID |
| `EMAIL_AUTOMATION_INVALID_FLOW` | 422 | Flow graph has errors (cycles, orphan steps, missing connections) | Use the flow validator to identify and fix structural issues |
| `EMAIL_AUTOMATION_ALREADY_ACTIVE` | 409 | Cannot edit an active automation | Pause the automation before making changes |
| `EMAIL_ABTEST_NOT_FOUND` | 404 | A/B test ID does not exist | Verify the test ID |
| `EMAIL_ABTEST_INVALID_SPLIT` | 422 | Variant percentages do not sum to 100 | Adjust variant percentages to total 100% |
| `EMAIL_ABTEST_INSUFFICIENT_SAMPLE` | 422 | Sample size too small for statistical significance | Increase sample size or reduce number of variants |
| `EMAIL_ABTEST_ALREADY_COMPLETED` | 409 | A/B test has already selected a winner | Create a new test for further experimentation |
| `EMAIL_PROVIDER_ERROR` | 502 | Email service provider returned an error | Check provider status page; retry may succeed |
| `EMAIL_PROVIDER_QUOTA_EXCEEDED` | 429 | Sending quota exceeded for the current period | Wait for quota reset or upgrade provider plan |
| `EMAIL_PROVIDER_RATE_LIMITED` | 429 | Provider rate limit hit | Sending will resume automatically after backoff |
| `EMAIL_DOMAIN_NOT_VERIFIED` | 403 | Sending domain has not been verified with the provider | Complete domain verification (SPF/DKIM) in provider settings |
| `EMAIL_DOMAIN_AUTH_INCOMPLETE` | 422 | SPF, DKIM, or DMARC not fully configured | Run authentication wizard to get required DNS records |
| `EMAIL_WARMUP_LIMIT_EXCEEDED` | 429 | Exceeded daily send limit for warm-up phase | Wait for next warm-up phase or adjust the schedule |
| `EMAIL_COMPLIANCE_VIOLATION` | 422 | Campaign fails compliance checks | Run compliance validator and fix reported violations |
| `EMAIL_UNSUBSCRIBE_TOKEN_INVALID` | 400 | Unsubscribe token is malformed or tampered with | Generate a new unsubscribe link |
| `EMAIL_UNSUBSCRIBE_TOKEN_EXPIRED` | 410 | Unsubscribe token has expired | Generate a new unsubscribe link; subscriber can use preference center |
| `EMAIL_WEBHOOK_SIGNATURE_INVALID` | 401 | Webhook signature verification failed | Check webhook signing secret configuration |
| `EMAIL_IMPORT_FORMAT_ERROR` | 422 | Import file format is invalid or cannot be parsed | Verify CSV format, encoding (UTF-8), and column mapping |
| `EMAIL_IMPORT_TOO_LARGE` | 413 | Import file exceeds maximum allowed size | Split import into smaller batches (max 100k rows per import) |
| `EMAIL_CONSENT_MISSING` | 422 | Subscriber lacks required consent for this send type | Obtain consent before sending; move to double opt-in |
| `EMAIL_PERSONALIZATION_ERROR` | 422 | Merge tag or conditional block failed to render | Check merge tag syntax and available data fields |
| `EMAIL_HEATMAP_NOT_READY` | 404 | Not enough click data to generate a heatmap | Wait for more engagement data (minimum 100 clicks) |

### Error Response Format

```typescript
{
  "error": {
    "code": "EMAIL_CAMPAIGN_NO_RECIPIENTS",
    "message": "Campaign has no valid recipients after applying suppression lists and segment filters",
    "details": {
      "campaignId": "cmp_abc123",
      "totalInLists": 15420,
      "suppressed": 892,
      "invalidStatus": 3201,
      "segmentFiltered": 11327,
      "remaining": 0
    },
    "remediation": "Check list membership, segment criteria, and suppression lists. Consider broadening your segment or using a different list.",
    "docUrl": "https://docs.mcv.one/email-campaigns/errors#no-recipients"
  }
}
```

---

## Security

### Authentication & Authorization

| Operation | Required Permission | Notes |
|-----------|-------------------|-------|
| Create campaign | `email:campaign:create` | Requires verified sending domain |
| Send campaign | `email:campaign:send` | Additional approval required for first send on new domain |
| View analytics | `email:analytics:read` | Tenant-scoped; no cross-tenant access |
| Manage lists | `email:list:manage` | Includes add/remove subscribers |
| Import subscribers | `email:list:import` | Rate-limited; requires consent source |
| Manage automations | `email:automation:manage` | Flow changes require re-validation |
| View deliverability | `email:deliverability:read` | Domain/IP stats scoped to tenant |
| Manage suppression | `email:suppression:manage` | Audit logged; removals require justification |
| Access preference center | Public | Token-authenticated, no login required |
| Process webhooks | Service-level | Signature-verified, IP allowlisted |

### Data Protection

- **Tenant Isolation**: All database tables enforce row-level security (RLS). Every query runs in a tenant context set via `SET app.current_tenant_id`.
- **Email Encryption at Rest**: Subscriber email addresses are stored encrypted using AES-256-GCM with tenant-scoped keys. The encryption key is derived from the tenant's master key via HKDF.
- **PII Minimization**: Click tracking URLs use opaque tokens, not subscriber IDs. Open tracking pixels use per-send tokens.
- **Consent Audit Trail**: Every consent grant, revocation, and update is immutably logged with timestamp, source, and IP address.
- **Unsubscribe Tokens**: Cryptographically signed (HMAC-SHA256) and time-limited. Contain no PII — resolve to subscriber ID only server-side.
- **Webhook Verification**: All inbound webhooks are verified against provider-specific signatures (HMAC for SendGrid, Svix for Resend, SNS for SES).
- **IP Allowlisting**: Webhook endpoints only accept requests from known provider IP ranges.
- **Rate Limiting**: API endpoints are rate-limited per tenant per endpoint: 100 req/min for reads, 30 req/min for writes, 5 req/min for sends.

### Sensitive Data Handling

```typescript
// Email addresses are encrypted at rest
const encryptedEmail = await tenantCrypto.encrypt(
  subscriberEmail,
  { purpose: 'subscriber_email', tenantId }
);

// Lookup uses a deterministic hash for indexing
const emailHash = await tenantCrypto.deterministicHash(
  subscriberEmail,
  { purpose: 'email_lookup', tenantId }
);

// Unsubscribe tokens are signed and time-limited
const unsubToken = jwt.sign(
  { sid: subscriberId, lid: listId, scope: 'unsubscribe' },
  UNSUBSCRIBE_SECRET,
  { expiresIn: '90d', algorithm: 'HS256' }
);

// Click tracking tokens are opaque
const clickToken = crypto.randomBytes(16).toString('base64url');
await redis.set(`click:${clickToken}`, JSON.stringify({
  sendId,
  url: originalUrl,
  subscriberId,
}), 'EX', 90 * 24 * 3600);
```

### GDPR Compliance

| GDPR Right | Implementation |
|------------|---------------|
| Right to Access | `ConsentAuditor.exportSubscriberData()` generates
---

## Error Codes

All error codes in the email campaigns module follow the `EML_XXX` convention and are defined in `src/errors/email-campaign-errors.ts`.

| Code | Name | HTTP | Description | Resolution |
|------|------|------|-------------|------------|
| `EML_001` | `INVALID_TEMPLATE` | 400 | Email template is malformed or contains invalid syntax | Check template HTML/MJML syntax, ensure all variables are properly closed, validate with `templateValidator.check()` |
| `EML_002` | `TEMPLATE_NOT_FOUND` | 404 | Referenced template ID does not exist or has been deleted | Verify template ID, check if template was archived, ensure correct tenant context |
| `EML_003` | `LIST_NOT_FOUND` | 404 | Subscriber list does not exist in the current tenant | Confirm list ID, check tenant isolation, verify list was not deleted |
| `EML_004` | `LIST_EMPTY` | 400 | Target subscriber list contains no active subscribers | Add subscribers to list, check segment filters, verify suppression rules are not filtering all recipients |
| `EML_005` | `SEND_LIMIT_EXCEEDED` | 429 | Tenant has exceeded their daily/hourly sending quota | Wait for quota reset, upgrade plan for higher limits, or contact support for temporary increase |
| `EML_006` | `DOMAIN_NOT_VERIFIED` | 403 | Sending domain has not been verified via DNS records | Add required SPF/DKIM/DMARC DNS records, wait for propagation, trigger re-verification |
| `EML_007` | `SUPPRESSED_RECIPIENT` | 400 | Recipient is on the suppression list (bounced, complained, or unsubscribed) | Remove from send list; do not attempt to override suppression — this protects deliverability |
| `EML_008` | `BOUNCE_THRESHOLD_EXCEEDED` | 403 | Campaign bounce rate exceeds the configured threshold (default: 5%) | Clean subscriber list, remove invalid addresses, verify list acquisition source |
| `EML_009` | `SPAM_COMPLAINT_THRESHOLD` | 403 | Spam complaint rate exceeds threshold (default: 0.1%) | Review email content, verify opt-in process, check sending frequency, review unsubscribe placement |
| `EML_010` | `AUTOMATION_LOOP_DETECTED` | 400 | Automation flow contains a circular trigger dependency | Review automation flow graph, break circular references, add loop guards |
| `EML_011` | `INVALID_SENDER_ADDRESS` | 400 | From address is not a verified sender identity | Register sender identity, verify email address, or use a verified domain |
| `EML_012` | `CAMPAIGN_ALREADY_SENT` | 409 | Attempting to modify or resend an already-dispatched campaign | Create a new campaign for resending, use duplicate feature |
| `EML_013` | `CAMPAIGN_NOT_FOUND` | 404 | Campaign ID does not exist in the current tenant context | Verify campaign ID, check tenant context, confirm campaign was not deleted |
| `EML_014` | `INVALID_SCHEDULE_TIME` | 400 | Scheduled send time is in the past or exceeds maximum future window | Set schedule time to at least 5 minutes in the future and within 90 days |
| `EML_015` | `SEGMENT_EVALUATION_FAILED` | 500 | Dynamic segment query failed to evaluate | Check segment filter syntax, verify referenced fields exist, review query complexity |
| `EML_016` | `TEMPLATE_VARIABLE_MISSING` | 400 | Required merge variable not found in subscriber data | Ensure all `{{variable}}` references have corresponding data fields, provide defaults |
| `EML_017` | `ESP_CONNECTION_FAILED` | 502 | Unable to connect to the configured email service provider | Check ESP API credentials, verify network connectivity, check ESP status page |
| `EML_018` | `ESP_RATE_LIMITED` | 429 | Email service provider returned a rate limit response | Implement exponential backoff, reduce sending concurrency, check ESP plan limits |
| `EML_019` | `WEBHOOK_VALIDATION_FAILED` | 401 | Inbound webhook signature verification failed | Check webhook signing secret, verify request is from legitimate ESP, check for replay attacks |
| `EML_020` | `AB_TEST_INVALID_CONFIG` | 400 | A/B test configuration is invalid (e.g., variants don't sum to 100%) | Ensure variant percentages sum to 100%, provide at least 2 variants, set valid winner criteria |
| `EML_021` | `AB_TEST_INSUFFICIENT_SAMPLE` | 400 | A/B test sample size is too small for statistical significance | Increase test audience size (minimum 1,000 per variant recommended), extend test duration |
| `EML_022` | `UNSUBSCRIBE_TOKEN_INVALID` | 400 | One-click unsubscribe token is expired, malformed, or already used | Generate a new unsubscribe link; tokens expire after 90 days |
| `EML_023` | `ATTACHMENT_TOO_LARGE` | 400 | Email attachment exceeds maximum allowed size (default: 10MB) | Reduce attachment size, use hosted link instead, compress files |
| `EML_024` | `CONTENT_POLICY_VIOLATION` | 403 | Email content flagged by content policy scanner (phishing, malware links, etc.) | Review flagged content, remove suspicious links, ensure compliance with acceptable use policy |
| `EML_025` | `TENANT_SUSPENDED` | 403 | Tenant email sending privileges have been suspended | Contact support; suspension typically due to repeated policy violations or abuse reports |
| `EML_026` | `INVALID_REPLY_TO` | 400 | Reply-to address format is invalid or domain is not authorized | Provide valid email format, use authorized domain |
| `EML_027` | `DUPLICATE_SUBSCRIBER` | 409 | Subscriber email already exists in the target list | Use upsert operation, or update existing subscriber instead of inserting |
| `EML_028` | `IMPORT_FORMAT_ERROR` | 400 | Subscriber import file format is invalid (CSV/JSON parse error) | Check file encoding (UTF-8), verify column headers, ensure valid CSV/JSON structure |
| `EML_029` | `AUTOMATION_TRIGGER_CONFLICT` | 409 | Multiple automations triggered for the same event with conflicting actions | Set automation priorities, add mutual exclusion rules, review trigger conditions |
| `EML_030` | `DELIVERABILITY_SCORE_LOW` | 400 | Pre-send deliverability check scored below minimum threshold | Improve subject line, reduce spam trigger words, verify authentication records, warm up sending domain |

### Error Response Format

```json
{
  "error": {
    "code": "EML_005",
    "name": "SEND_LIMIT_EXCEEDED",
    "message": "Tenant has exceeded the daily sending quota of 10,000 emails",
    "details": {
      "currentUsage": 10000,
      "dailyLimit": 10000,
      "resetsAt": "2025-01-16T00:00:00Z",
      "planTier": "growth"
    },
    "timestamp": "2025-01-15T23:45:12Z",
    "requestId": "req_abc123"
  }
}
```

### Error Handling Patterns

```typescript
import { EmailCampaignError, EML_CODES } from "@mcv/growth/email-campaigns";

// Catching specific error codes
try {
  await campaignRouter.send({ campaignId, listId });
} catch (error) {
  if (error instanceof EmailCampaignError) {
    switch (error.code) {
      case EML_CODES.SEND_LIMIT_EXCEEDED:
        // Queue for retry after quota reset
        await retryQueue.schedule(error.details.resetsAt, { campaignId, listId });
        break;
      case EML_CODES.SUPPRESSED_RECIPIENT:
        // Log and skip — never override suppression
        logger.warn("Suppressed recipient skipped", { email: error.details.email });
        break;
      case EML_CODES.ESP_RATE_LIMITED:
        // Exponential backoff retry
        await retryWithBackoff(() => campaignRouter.send({ campaignId, listId }));
        break;
      case EML_CODES.BOUNCE_THRESHOLD_EXCEEDED:
        // Pause campaign and alert
        await campaignRouter.pause({ campaignId });
        await alertService.notify("bounce_threshold", { campaignId, rate: error.details.bounceRate });
        break;
      default:
        throw error;
    }
  }
}
```

---

## Security

### Email Authentication (SPF/DKIM/DMARC)

The email campaigns module enforces strict email authentication to protect deliverability and prevent spoofing.

#### SPF (Sender Policy Framework)

```text
# Required DNS TXT record for sending domain
v=spf1 include:_spf.resend.com include:amazonses.com include:sendgrid.net ~all
```

- All sending domains **must** have valid SPF records before verification
- SPF record validation runs during domain verification (`domainRouter.verify`)
- Maximum of 10 DNS lookups enforced per SPF evaluation
- Soft fail (`~all`) recommended over hard fail (`-all`) during initial setup

#### DKIM (DomainKeys Identified Mail)

```text
# DKIM CNAME records (auto-generated per domain)
resend._domainkey.example.com → CNAME → [provider-specific-value]
```

- 2048-bit DKIM keys generated automatically during domain setup
- DKIM signing applied to all outbound emails — no exceptions
- Key rotation supported via `domainRouter.rotateDkimKeys` (recommended every 6 months)
- Signing domain must match the `From` header domain

#### DMARC (Domain-based Message Authentication)

```text
# Recommended DMARC record
_dmarc.example.com TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com; pct=100"
```

- DMARC policy checked during domain verification
- Minimum policy of `p=none` required; `p=quarantine` or `p=reject` recommended
- Aggregate reports (`rua`) configurable per tenant
- DMARC alignment mode: relaxed by default, strict available via config

### API Key Management

```typescript
// API keys are scoped per tenant and per ESP
interface EspApiKeyConfig {
  tenantId: string;
  provider: "resend" | "sendgrid" | "ses";
  apiKey: string;          // Encrypted at rest (AES-256-GCM)
  encryptedAt: Date;
  rotatedAt: Date | null;
  expiresAt: Date | null;  // Optional expiry for auto-rotation
  scopes: string[];        // e.g., ["send", "templates", "webhooks"]
}
```

- **Encryption at rest**: All ESP API keys encrypted using AES-256-GCM with tenant-specific encryption keys
- **Key rotation**: Automated rotation supported; alerts generated 30 days before expiry
- **Scope restrictions**: API keys are scoped to minimum required permissions
- **Audit logging**: All key access, rotation, and usage logged to `email_api_key_audit_log`
- **No plaintext storage**: Keys are never stored in plaintext; decrypted only in memory during use
- **Environment isolation**: Separate API keys for development, staging, and production

### List Access Controls

```sql
-- Row-Level Security on subscriber lists
CREATE POLICY "tenant_list_isolation" ON email_subscriber_lists
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Role-based list access
CREATE POLICY "list_role_access" ON email_subscriber_lists
  USING (
    EXISTS (
      SELECT 1 FROM email_list_permissions
      WHERE list_id = email_subscriber_lists.id
        AND user_id = current_setting('app.current_user_id')::uuid
        AND permission IN ('read', 'write', 'admin')
    )
  );
```

- **Tenant isolation**: RLS enforces strict tenant boundaries — no cross-tenant list access
- **Role-based access**: List-level permissions (`read`, `write`, `admin`) beyond tenant membership
- **Subscriber PII**: Access to subscriber personal data requires explicit `pii:read` scope
- **Export restrictions**: List exports require `admin` permission and generate audit log entries
- **Bulk operations**: Bulk delete/update operations require confirmation token and `admin` role

### Unsubscribe Compliance

- **CAN-SPAM Act**: All emails include physical mailing address and functional unsubscribe link
- **GDPR**: One-click unsubscribe header (`List-Unsubscribe-Post`) included in all marketing emails
- **CCPA**: Honor "Do Not Sell" requests; subscriber data deletion within 45 days
- **CASL**: Express consent tracking with timestamp and source for Canadian recipients
- **One-click unsubscribe**: RFC 8058 compliant `List-Unsubscribe-Post` header on every email
- **Processing time**: Unsubscribe requests processed within 1 second; maximum legal requirement is 10 business days
- **Global suppression**: Unsubscribed addresses added to global suppression list across all tenant lists
- **Preference center**: Optional granular unsubscribe (per-list vs. global) via hosted preference page

```typescript
// Unsubscribe header automatically injected
const unsubscribeHeaders = {
  "List-Unsubscribe": `<mailto:unsub@${domain}?subject=unsubscribe>, <${unsubscribeUrl}>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
};
```

### PII Handling

- **Data minimization**: Only collect subscriber fields required for sending and personalization
- **Encryption in transit**: All API communications over TLS 1.2+ (TLS 1.3 preferred)
- **Encryption at rest**: Subscriber PII encrypted at the database level via Supabase column encryption
- **Data retention**: Configurable retention policies; default 24-month activity retention, 36-month subscriber retention
- **Right to erasure**: `subscriberRouter.gdprDelete` permanently removes all subscriber PII and associated activity
- **Data portability**: `subscriberRouter.export` generates machine-readable subscriber data (JSON/CSV)
- **Access logging**: All PII field access logged with user ID, timestamp, and purpose
- **Anonymization**: Analytics and reporting use anonymized/aggregated data where possible

### Rate Limiting

```typescript
// Rate limit configuration per tenant tier
const rateLimits: Record<PlanTier, RateLimitConfig> = {
  free: {
    emailsPerHour: 100,
    emailsPerDay: 500,
    apiCallsPerMinute: 30,
    campaignsPerDay: 5,
    automationsActive: 3,
    listsMax: 10,
    subscribersMax: 2_500,
  },
  starter: {
    emailsPerHour: 1_000,
    emailsPerDay: 10_000,
    apiCallsPerMinute: 120,
    campaignsPerDay: 20,
    automationsActive: 10,
    listsMax: 50,
    subscribersMax: 25_000,
  },
  growth: {
    emailsPerHour: 10_000,
    emailsPerDay: 100_000,
    apiCallsPerMinute: 300,
    campaignsPerDay: 50,
    automationsActive: 50,
    listsMax: 200,
    subscribersMax: 250_000,
  },
  enterprise: {
    emailsPerHour: 100_000,
    emailsPerDay: 1_000_000,
    apiCallsPerMinute: 1_000,
    campaignsPerDay: 200,
    automationsActive: 500,
    listsMax: 1_000,
    subscribersMax: 5_000_000,
  },
};
```

- **Sliding window**: Rate limits use sliding window counters (Redis-backed) for accurate throttling
- **Burst allowance**: Up to 2x burst for 5-minute windows to accommodate campaign launches
- **Graceful degradation**: When approaching limits, sending is throttled rather than hard-blocked
- **Per-ESP limits**: Separate rate limits per ESP provider to respect provider-specific quotas
- **Webhook rate limits**: Inbound webhook processing limited to 1,000 events/second per tenant

### Bounce & Complaint Thresholds

| Metric | Warning Threshold | Action Threshold | Action Taken |
|--------|-------------------|------------------|--------------|
| Hard bounce rate | 3% | 5% | Campaign paused, list cleaning required |
| Soft bounce rate | 8% | 15% | Campaign throttled, retry with backoff |
| Spam complaint rate | 0.05% | 0.1% | Campaign paused, content review required |
| Unsubscribe rate | 2% | 5% | Warning notification, frequency review suggested |
| Invalid address rate | 5% | 10% | Import rejected, list source audit required |

- **Automatic monitoring**: Bounce and complaint rates calculated in real-time during campaign sends
- **Progressive enforcement**: Warning → throttle → pause → suspend escalation path
- **Recovery process**: Suspended tenants must complete list hygiene checklist and content review
- **ESP feedback loops**: Automatic processing of ISP feedback loop reports (AOL, Yahoo, Outlook, Gmail)
- **Suppression sync**: Bounced and complained addresses synced to global suppression within 60 seconds

---

## Environment Variables

All environment variables for the email campaigns module are prefixed with `EMAIL_` or use ESP-specific prefixes. Required variables are marked with ✅.

### ESP Credentials

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_PRIMARY_ESP` | ✅ | `resend` | Primary email service provider (`resend`, `sendgrid`, `ses`) |
| `EMAIL_FALLBACK_ESP` | | `null` | Fallback ESP for failover (activated on primary failure) |
| `RESEND_API_KEY` | ✅* | — | Resend API key (*required if Resend is primary/fallback ESP) |
| `SENDGRID_API_KEY` | ✅* | — | SendGrid API key (*required if SendGrid is primary/fallback ESP) |
| `AWS_SES_ACCESS_KEY_ID` | ✅* | — | AWS SES access key (*required if SES is primary/fallback ESP) |
| `AWS_SES_SECRET_ACCESS_KEY` | ✅* | — | AWS SES secret key (*required if SES is primary/fallback ESP) |
| `AWS_SES_REGION` | | `us-east-1` | AWS SES region for API calls |
| `EMAIL_ESP_TIMEOUT_MS` | | `30000` | Timeout for ESP API calls in milliseconds |
| `EMAIL_ESP_RETRY_ATTEMPTS` | | `3` | Number of retry attempts on ESP transient failures |
| `EMAIL_ESP_RETRY_BACKOFF_MS` | | `1000` | Base backoff interval for ESP retries (exponential) |

### Sending Limits

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_DEFAULT_DAILY_LIMIT` | | `10000` | Default daily sending limit per tenant |
| `EMAIL_DEFAULT_HOURLY_LIMIT` | | `1000` | Default hourly sending limit per tenant |
| `EMAIL_GLOBAL_DAILY_LIMIT` | | `1000000` | Global daily sending limit across all tenants |
| `EMAIL_BATCH_SIZE` | | `100` | Number of emails per batch in campaign sends |
| `EMAIL_BATCH_DELAY_MS` | | `500` | Delay between batches to avoid ESP rate limits |
| `EMAIL_CONCURRENCY_LIMIT` | | `10` | Maximum concurrent ESP API calls per campaign |
| `EMAIL_MAX_RECIPIENTS_PER_CAMPAIGN` | | `500000` | Maximum recipients per single campaign send |

### Domain Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_DEFAULT_FROM_NAME` | ✅ | — | Default sender name (e.g., "Acme Inc") |
| `EMAIL_DEFAULT_FROM_ADDRESS` | ✅ | — | Default sender email address |
| `EMAIL_DEFAULT_REPLY_TO` | | `null` | Default reply-to address (falls back to from address) |
| `EMAIL_BOUNCE_ADDRESS` | | `null` | Return-path address for bounce handling |
| `EMAIL_DOMAIN_VERIFICATION_TTL` | | `86400` | TTL in seconds for domain verification cache |
| `EMAIL_CUSTOM_TRACKING_DOMAIN` | | `null` | Custom domain for tracking links (e.g., `track.example.com`) |

### Tracking Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_TRACKING_ENABLED` | | `true` | Enable open and click tracking globally |
| `EMAIL_OPEN_TRACKING` | | `true` | Enable open tracking (tracking pixel) |
| `EMAIL_CLICK_TRACKING` | | `true` | Enable click tracking (link wrapping) |
| `EMAIL_TRACKING_WEBHOOK_URL` | | `null` | Webhook URL for real-time tracking event delivery |
| `EMAIL_TRACKING_PIXEL_URL` | | Auto-generated | Custom URL for tracking pixel endpoint |
| `EMAIL_LINK_TRACKING_URL` | | Auto-generated | Custom URL for click tracking redirect endpoint |
| `EMAIL_UNSUBSCRIBE_URL` | ✅ | — | Base URL for unsubscribe/preference center pages |

### Automation Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_AUTOMATION_ENABLED` | | `true` | Enable automation flow processing |
| `EMAIL_AUTOMATION_POLL_INTERVAL_MS` | | `5000` | Polling interval for automation trigger evaluation |
| `EMAIL_AUTOMATION_MAX_QUEUE_SIZE` | | `100000` | Maximum pending automation actions in queue |
| `EMAIL_AUTOMATION_MAX_DEPTH` | | `20` | Maximum automation flow depth (loop protection) |
| `EMAIL_AUTOMATION_COOLDOWN_MS` | | `3600000` | Minimum time between automation emails to same recipient (1 hour default) |
| `EMAIL_AUTOMATION_WORKER_COUNT` | | `4` | Number of automation worker processes |

### Deliverability

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_BOUNCE_THRESHOLD_PERCENT` | | `5` | Hard bounce rate threshold to pause campaigns |
| `EMAIL_COMPLAINT_THRESHOLD_PERCENT` | | `0.1` | Spam complaint rate threshold to pause campaigns |
| `EMAIL_WARMUP_ENABLED` | | `false` | Enable IP/domain warmup schedule for new senders |
| `EMAIL_WARMUP_DAILY_INCREMENT` | | `100` | Daily sending volume increment during warmup |
| `EMAIL_WARMUP_MAX_DAYS` | | `30` | Maximum warmup period in days |
| `EMAIL_SUPPRESSION_SYNC_INTERVAL_MS` | | `60000` | Interval for syncing suppression list from ESP |
| `EMAIL_FEEDBACK_LOOP_ENABLED` | | `true` | Enable ISP feedback loop processing |

### Infrastructure

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_QUEUE_PROVIDER` | | `database` | Queue backend (`database`, `redis`, `bullmq`) |
| `EMAIL_QUEUE_REDIS_URL` | ✅* | — | Redis URL for queue (*required if queue provider is redis/bullmq) |
| `EMAIL_WEBHOOK_SECRET` | ✅ | — | Shared secret for validating inbound ESP webhooks |
| `EMAIL_ENCRYPTION_KEY` | ✅ | — | AES-256 key for encrypting API keys and sensitive data at rest |
| `EMAIL_LOG_LEVEL` | | `info` | Logging level (`debug`, `info`, `warn`, `error`) |
| `EMAIL_METRICS_ENABLED` | | `true` | Enable Prometheus/OpenTelemetry metrics export |

### Example `.env` Configuration

```bash
# Primary ESP
EMAIL_PRIMARY_ESP=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Fallback ESP
EMAIL_FALLBACK_ESP=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sender Identity
EMAIL_DEFAULT_FROM_NAME="Acme Inc"
EMAIL_DEFAULT_FROM_ADDRESS=hello@acme.com
EMAIL_DEFAULT_REPLY_TO=support@acme.com

# Sending Limits
EMAIL_DEFAULT_DAILY_LIMIT=50000
EMAIL_DEFAULT_HOURLY_LIMIT=5000
EMAIL_BATCH_SIZE=200
EMAIL_CONCURRENCY_LIMIT=20

# Tracking
EMAIL_TRACKING_ENABLED=true
EMAIL_CUSTOM_TRACKING_DOMAIN=track.acme.com
EMAIL_UNSUBSCRIBE_URL=https://acme.com/email/preferences

# Automation
EMAIL_AUTOMATION_ENABLED=true
EMAIL_AUTOMATION_WORKER_COUNT=4
EMAIL_AUTOMATION_COOLDOWN_MS=3600000

# Deliverability
EMAIL_BOUNCE_THRESHOLD_PERCENT=5
EMAIL_COMPLAINT_THRESHOLD_PERCENT=0.1
EMAIL_WARMUP_ENABLED=true

# Infrastructure
EMAIL_QUEUE_PROVIDER=bullmq
EMAIL_QUEUE_REDIS_URL=redis://localhost:6379/2
EMAIL_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
EMAIL_ENCRYPTION_KEY=enc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_LOG_LEVEL=info
```

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/core` | `workspace:*` | Core utilities, error handling, tenant context, and shared types |
| `@mcv/auth` | `workspace:*` | Authentication, authorization, user session management, and RBAC |
| `@mcv/database` | `workspace:*` | Drizzle ORM schema definitions, migrations, connection pooling, and query helpers |
| `@mcv/queue` | `workspace:*` | Job queue abstraction (BullMQ/database-backed) for async campaign processing |
| `@mcv/storage` | `workspace:*` | File storage for email attachments, template assets, and import files |
| `@mcv/analytics` | `workspace:*` | Event tracking, metrics pipeline, and reporting aggregation |
| `@mcv/notifications` | `workspace:*` | Internal notification delivery for campaign alerts, threshold warnings, and system events |
| `@mcv/billing` | `workspace:*` | Plan tier resolution, usage metering, sending quota enforcement |
| `@mcv/tenants` | `workspace:*` | Multi-tenant context management, tenant settings, and feature flags |
| `@mcv/webhooks` | `workspace:*` | Webhook ingestion framework, signature verification, and event routing |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `resend` | `^4.1.0` | Resend ESP SDK — primary transactional and marketing email delivery |
| `@sendgrid/mail` | `^8.1.0` | SendGrid ESP SDK — fallback email delivery and legacy migration support |
| `@aws-sdk/client-ses` | `^3.700.0` | AWS SES SDK — high-volume email delivery and dedicated IP management |
| `nodemailer` | `^6.9.0` | SMTP email transport — used for local development and custom SMTP relay |
| `mjml` | `^4.15.0` | MJML-to-HTML compiler for responsive email template rendering |
| `juice` | `^11.0.0` | CSS inlining engine — converts external/embedded CSS to inline styles for email client compatibility |
| `html-to-text` | `^9.0.0` | HTML-to-plaintext converter for automatic plain-text email part generation |
| `handlebars` | `^4.7.0` | Template engine for merge variable interpolation (`{{firstName}}`, `{{company}}`, etc.) |
| `sanitize-html` | `^2.13.0` | HTML sanitizer for user-generated email content and template injection prevention |
| `csv-parse` | `^5.6.0` | CSV parser for subscriber list imports with streaming support |
| `zod` | `^3.23.0` | Runtime schema validation for API inputs, template variables, and webhook payloads |
| `ioredis` | `^5.4.0` | Redis client for rate limiting counters, sending queue, and caching |
| `bullmq` | `^5.30.0` | Job queue for campaign send orchestration, automation flows, and scheduled sends |
| `cron-parser` | `^4.9.0` | Cron expression parser for recurring automation schedules |
| `luxon` | `^3.5.0` | Date/time handling for timezone-aware scheduling and send-time optimization |
| `p-limit` | `^6.1.0` | Concurrency limiter for controlling parallel ESP API calls during batch sends |
| `nanoid` | `^5.0.0` | Unique ID generation for tracking tokens, unsubscribe tokens, and campaign slugs |
| `dompurify` | `^3.2.0` | DOM sanitization for template preview rendering in browser context |
| `jsdom` | `^25.0.0` | Server-side DOM implementation for template rendering and link rewriting |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | `^2.1.0` | Test runner for unit and integration tests |
| `@testing-library/react` | `^16.0.0` | Component testing for template builder UI |
| `msw` | `^2.6.0` | API mocking for ESP integration tests |
| `@faker-js/faker` | `^9.3.0` | Test data generation for subscribers, campaigns, and templates |
| `mailparser` | `^3.7.0` | Email parsing for integration test assertions (MIME, headers, content) |
| `smtp-server` | `^3.13.0` | Local SMTP server for end-to-end send flow testing |
| `testcontainers` | `^10.15.0` | Docker container management for PostgreSQL and Redis in integration tests |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── templates/
│   │   │   ├── template-renderer.test.ts
│   │   │   ├── mjml-compiler.test.ts
│   │   │   ├── css-inliner.test.ts
│   │   │   ├── variable-interpolation.test.ts
│   │   │   └── template-validator.test.ts
│   │   ├── lists/
│   │   │   ├── list-service.test.ts
│   │   │   ├── segment-evaluator.test.ts
│   │   │   ├── subscriber-import.test.ts
│   │   │   ├── suppression-list.test.ts
│   │   │   └── duplicate-detection.test.ts
│   │   ├── campaigns/
│   │   │   ├── campaign-builder.test.ts
│   │   │   ├── campaign-scheduler.test.ts
│   │   │   ├── ab-test-engine.test.ts
│   │   │   ├── send-orchestrator.test.ts
│   │   │   └── content-validator.test.ts
│   │   ├── automation/
│   │   │   ├── trigger-evaluator.test.ts
│   │   │   ├── flow-executor.test.ts
│   │   │   ├── loop-detector.test.ts
│   │   │   ├── delay-calculator.test.ts
│   │   │   └── condition-resolver.test.ts
│   │   └── deliverability/
│   │       ├── bounce-processor.test.ts
│   │       ├── complaint-handler.test.ts
│   │       ├── warmup-scheduler.test.ts
│   │       └── reputation-scorer.test.ts
│   ├── integration/
│   │   ├── send-flow.test.ts
│   │   ├── webhook-handling.test.ts
│   │   ├── esp-failover.test.ts
│   │   ├── automation-pipeline.test.ts
│   │   ├── subscriber-lifecycle.test.ts
│   │   ├── campaign-analytics.test.ts
│   │   └── multi-tenant-isolation.test.ts
│   └── e2e/
│       ├── campaign-send-e2e.test.ts
│       ├── automation-flow-e2e.test.ts
│       └── unsubscribe-flow-e2e.test.ts
```

### Unit Tests

#### Template Rendering

```typescript
describe("TemplateRenderer", () => {
  it("should compile MJML to responsive HTML", async () => {
    const mjmlTemplate = `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Hello {{firstName}}</mj-text>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `;

    const result = await templateRenderer.render(mjmlTemplate, {
      firstName: "Alice",
    });

    expect(result.html).toContain("Hello Alice");
    expect(result.html).toContain("<!doctype html>");
    expect(result.html).toContain("@media");  // Responsive styles present
    expect(result.errors).toHaveLength(0);
  });

  it("should inline CSS for email client compatibility", async () => {
    const html = `
      <style>.header { color: red; font-size: 24px; }</style>
      <div class="header">Welcome</div>
    `;

    const result = await templateRenderer.inlineCss(html);

    expect(result).toContain('style="color: red; font-size: 24px;"');
    expect(result).not.toContain("<style>");
  });

  it("should generate plain-text version from HTML", async () => {
    const html = "<h1>Welcome</h1><p>Click <a href='https://example.com'>here</a></p>";

    const plainText = await templateRenderer.toPlainText(html);

    expect(plainText).toContain("Welcome");
    expect(plainText).toContain("Click here [https://example.com]");
  });

  it("should reject templates with dangerous content", async () => {
    const maliciousTemplate = `<script>alert('xss')</script><mj-text>Hello</mj-text>`;

    await expect(templateRenderer.validate(maliciousTemplate))
      .rejects.toThrow(EmailCampaignError);
  });

  it("should handle missing merge variables with defaults", async () => {
    const template = "Hello {{firstName|default:Subscriber}}, welcome to {{company}}!";

    const result = await templateRenderer.interpolate(template, { company: "Acme" });

    expect(result).toBe("Hello Subscriber, welcome to Acme!");
  });
});
```

#### List Segmentation

```typescript
describe("SegmentEvaluator", () => {
  it("should filter subscribers by tag inclusion", async () => {
    const segment: SegmentDefinition = {
      operator: "AND",
      conditions: [
        { field: "tags", operator: "contains", value: "premium" },
        { field: "status", operator: "equals", value: "active" },
      ],
    };

    const subscribers = await segmentEvaluator.evaluate(segment, listId);

    expect(subscribers).toHaveLength(150);
    subscribers.forEach((sub) => {
      expect(sub.tags).toContain("premium");
      expect(sub.status).toBe("active");
    });
  });

  it("should support nested OR/AND conditions", async () => {
    const segment: SegmentDefinition = {
      operator: "OR",
      conditions: [
        {
          operator: "AND",
          conditions: [
            { field: "country", operator: "equals", value: "US" },
            { field: "lastActivityAt", operator: "after", value: "2024-06-01" },
          ],
        },
        {
          operator: "AND",
          conditions: [
            { field: "country", operator: "equals", value: "CA" },
            { field: "plan", operator: "in", value: ["growth", "enterprise"] },
          ],
        },
      ],
    };

    const subscribers = await segmentEvaluator.evaluate(segment, listId);

    subscribers.forEach((sub) => {
      const isUSActive = sub.country === "US" && sub.lastActivityAt > new Date("2024-06-01");
      const isCAGrowth = sub.country === "CA" && ["growth", "enterprise"].includes(sub.plan);
      expect(isUSActive || isCAGrowth).toBe(true);
    });
  });

  it("should exclude suppressed recipients from segment results", async () => {
    const segment: SegmentDefinition = {
      operator: "AND",
      conditions: [{ field: "status", operator: "equals", value: "active" }],
    };

    // Add a subscriber to suppression list
    await suppressionList.add(listId, "bounced@example.com", "hard_bounce");

    const subscribers = await segmentEvaluator.evaluate(segment, listId);

    expect(subscribers.map((s) => s.email)).not.toContain("bounced@example.com");
  });

  it("should handle engagement-based segmentation", async () => {
    const segment: SegmentDefinition = {
      operator: "AND",
      conditions: [
        { field: "emailsOpened30d", operator: "greaterThan", value: 3 },
        { field: "lastClickAt", operator: "after", value: "relative:-7d" },
      ],
    };

    const subscribers = await segmentEvaluator.evaluate(segment, listId);

    subscribers.forEach((sub) => {
      expect(sub.emailsOpened30d).toBeGreaterThan(3);
    });
  });
});
```

#### Automation Triggers

```typescript
describe("AutomationTriggerEvaluator", () => {
  it("should fire welcome email on subscriber signup", async () => {
    const automation = createAutomation({
      trigger: { type: "subscriber_added", listId },
      actions: [
        { type: "send_email", templateId: "welcome-email", delay: 0 },
      ],
    });

    const event = { type: "subscriber_added", listId, subscriberId: "sub_123" };
    const result = await triggerEvaluator.evaluate(automation, event);

    expect(result.shouldFire).toBe(true);
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0].type).toBe("send_email");
  });

  it("should detect and prevent automation loops", async () => {
    const automation = createAutomation({
      trigger: { type: "email_opened", campaignId: "camp_A" },
      actions: [
        { type: "send_email", templateId: "followup", delay: 3600 },
        { type: "add_to_list", listId: "list_B" },  // list_B triggers another automation that sends camp_A
      ],
    });

    await expect(loopDetector.validate(automation))
      .rejects.toThrow("EML_010");
  });

  it("should respect automation cooldown periods", async () => {
    const subscriberId = "sub_123";

    // First trigger — should fire
    const result1 = await triggerEvaluator.evaluate(automation, event);
    expect(result1.shouldFire).toBe(true);

    // Second trigger within cooldown — should skip
    const result2 = await triggerEvaluator.evaluate(automation, event);
    expect(result2.shouldFire).toBe(false);
    expect(result2.reason).toBe("cooldown_active");
  });

  it("should evaluate conditional branches in flows", async () => {
    const automation = createAutomation({
      trigger: { type: "email_sent", campaignId: "camp_welcome" },
      actions: [
        { type: "wait", delay: 86400 }, // Wait 24 hours
        {
          type: "condition",
          check: { field: "email_opened", campaignId: "camp_welcome" },
          trueBranch: [{ type: "send_email", templateId: "engaged-followup" }],
          falseBranch: [{ type: "send_email", templateId: "re-engagement" }],
        },
      ],
    });

    // Subscriber opened the email
    const openedResult = await flowExecutor.execute(automation, {
      subscriberId: "sub_opened",
      context: { emailOpened: true },
    });
    expect(openedResult.executedActions[1].templateId).toBe("engaged-followup");

    // Subscriber did not open
    const notOpenedResult = await flowExecutor.execute(automation, {
      subscriberId: "sub_not_opened",
      context: { emailOpened: false },
    });
    expect(notOpenedResult.executedActions[1].templateId).toBe("re-engagement");
  });
});
```

### Integration Tests

#### Send Flow

```typescript
describe("Campaign Send Flow (Integration)", () => {
  let testDb: TestDatabase;
  let testRedis: TestRedis;
  let mockSmtp: MockSmtpServer;

  beforeAll(async () => {
    testDb = await TestDatabase.create();
    testRedis = await TestRedis.create();
    mockSmtp = await MockSmtpServer.start(2525);
  });

  afterAll(async () => {
    await testDb.cleanup();
    await testRedis.cleanup();
    await mockSmtp.stop();
  });

  it("should send campaign to all active subscribers", async () => {
    // Seed test data
    const tenantId = await testDb.createTenant("test-tenant");
    const listId = await testDb.createList(tenantId, "Test List");
    await testDb.createSubscribers(listId, 100);
    const templateId = await testDb.createTemplate(tenantId, {
      subject: "Hello {{firstName}}",
      body: "<p>Welcome, {{firstName}}!</p>",
    });

    // Create and send campaign
    const campaignId = await campaignService.create({
      tenantId,
      name: "Test Campaign",
      templateId,
      listId,
    });
    await campaignService.send(campaignId);

    // Wait for async processing
    await waitFor(() => mockSmtp.receivedEmails.length === 100, { timeout: 30000 });

    // Assertions
    expect(mockSmtp.receivedEmails).toHaveLength(100);
    expect(mockSmtp.receivedEmails[0].headers["list-unsubscribe"]).toBeDefined();
    expect(mockSmtp.receivedEmails[0].html).toContain("Welcome,");

    // Verify campaign status updated
    const campaign = await campaignService.get(campaignId);
    expect(campaign.status).toBe("sent");
    expect(campaign.stats.delivered).toBe(100);
    expect(campaign.stats.failed).toBe(0);
  });

  it("should handle ESP failover during send", async () => {
    // Configure primary ESP to fail
    mockEsp.primary.setFailureRate(1.0); // 100% failure
    mockEsp.fallback.setFailureRate(0.0); // 0% failure

    const campaignId = await campaignService.create({ tenantId, templateId, listId });
    await campaignService.send(campaignId);

    await waitFor(() => mockEsp.fallback.sentCount > 0, { timeout: 15000 });

    expect(mockEsp.primary.attemptCount).toBeGreaterThan(0);
    expect(mockEsp.fallback.sentCount).toBe(100);

    const campaign = await campaignService.get(campaignId);
    expect(campaign.stats.delivered).toBe(100);
    expect(campaign.metadata.espUsed).toBe("fallback");
  });
});
```

#### Webhook Handling

```typescript
describe("ESP Webhook Handling (Integration)", () => {
  it("should process bounce webhook and update subscriber status", async () => {
    const webhookPayload = {
      type: "email.bounced",
      data: {
        email_id: "msg_123",
        to: "invalid@example.com",
        bounce_type: "hard",
        reason: "550 User not found",
        timestamp: "2025-01-15T10:30:00Z",
      },
    };

    const signature = generateWebhookSignature(webhookPayload, WEBHOOK_SECRET);

    const response = await request(app)
      .post("/api/webhooks/email/resend")
      .set("x-webhook-signature", signature)
      .send(webhookPayload);

    expect(response.status).toBe(200);

    // Verify subscriber updated
    const subscriber = await subscriberService.getByEmail("invalid@example.com");
    expect(subscriber.status).toBe("bounced");
    expect(subscriber.bounceCount).toBe(1);

    // Verify suppression list updated
    const isSuppressed = await suppressionList.check("invalid@example.com");
    expect(isSuppressed).toBe(true);
  });

  it("should reject webhook with invalid signature", async () => {
    const response = await request(app)
      .post("/api/webhooks/email/resend")
      .set("x-webhook-signature", "invalid-signature")
      .send({ type: "email.delivered", data: {} });

    expect(response.status).toBe(401);
  });

  it("should process complaint webhook and suppress recipient", async () => {
    const webhookPayload = {
      type: "email.complained",
      data: {
        email_id: "msg_456",
        to: "complainer@example.com",
        feedback_type: "abuse",
        timestamp: "2025-01-15T11:00:00Z",
      },
    };

    const signature = generateWebhookSignature(webhookPayload, WEBHOOK_SECRET);

    await request(app)
      .post("/api/webhooks/email/resend")
      .set("x-webhook-signature", signature)
      .send(webhookPayload);

    // Verify global suppression
    const isSuppressed = await suppressionList.check("complainer@example.com");
    expect(isSuppressed).toBe(true);
    expect(await suppressionList.getReason("complainer@example.com")).toBe("spam_complaint");

    // Verify complaint rate tracking
    const stats = await deliverabilityService.getStats(tenantId);
    expect(stats.complaintRate).toBeGreaterThan(0);
  });
});
```

### Deliverability Tests

```typescript
describe("Deliverability Monitoring", () => {
  it("should pause campaign when bounce threshold exceeded", async () => {
    // Simulate bounces exceeding 5% threshold
    for (let i = 0; i < 60; i++) {
      await webhookProcessor.processBounce({
        campaignId,
        email: `bounce${i}@invalid.com`,
        type: "hard",
      });
    }

    const campaign = await campaignService.get(campaignId);
    expect(campaign.status).toBe("paused");
    expect(campaign.pauseReason).toBe("bounce_threshold_exceeded");

    // Verify alert was sent
    const alerts = await alertService.getRecent(tenantId);
    expect(alerts[0].type).toBe("bounce_threshold");
  });

  it("should calculate sender reputation score correctly", async () => {
    const score = await reputationScorer.calculate(tenantId, {
      deliveryRate: 0.98,
      bounceRate: 0.01,
      complaintRate: 0.001,
      openRate: 0.25,
      unsubscribeRate: 0.005,
      spamTrapHits: 0,
    });

    expect(score.overall).toBeGreaterThanOrEqual(85);
    expect(score.grade).toBe("A");
    expect(score.recommendations).toHaveLength(0);
  });

  it("should enforce warmup schedule for new domains", async () => {
    await domainService.addDomain(tenantId, "new-domain.com");

    // Day 1: Should limit to warmup increment
    const day1Limit = await warmupScheduler.getDailyLimit("new-domain.com", 1);
    expect(day1Limit).toBe(100);

    // Day 15: Should be ramping up
    const day15Limit = await warmupScheduler.getDailyLimit("new-domain.com", 15);
    expect(day15Limit).toBeGreaterThan(1000);

    // Day 31: Warmup complete, full limits
    const day31Limit = await warmupScheduler.getDailyLimit("new-domain.com", 31);
    expect(day31Limit).toBe(Infinity); // No warmup restriction
  });
});
```

### Multi-Tenant Isolation Tests

```typescript
describe("Multi-Tenant Isolation", () => {
  it("should prevent cross-tenant list access", async () => {
    const tenantA = await testDb.createTenant("tenant-a");
    const tenantB = await testDb.createTenant("tenant-b");
    const listA = await testDb.createList(tenantA, "Tenant A List");

    // Attempt to access Tenant A's list from Tenant B context
    await setTenantContext(tenantB);

    await expect(listService.get(listA))
      .rejects.toThrow("EML_003"); // LIST_NOT_FOUND due to RLS
  });

  it("should isolate campaign analytics between tenants", async () => {
    const tenantA = await testDb.createTenant("tenant-a");
    const tenantB = await testDb.createTenant("tenant-b");

    await testDb.createCampaignWithStats(tenantA, { sent: 1000, opened: 250 });
    await testDb.createCampaignWithStats(tenantB, { sent: 5000, opened: 1500 });

    await setTenantContext(tenantA);
    const statsA = await analyticsService.getOverview();
    expect(statsA.totalSent).toBe(1000);
    expect(statsA.totalOpened).toBe(250);

    await setTenantContext(tenantB);
    const statsB = await analyticsService.getOverview();
    expect(statsB.totalSent).toBe(5000);
    expect(statsB.totalOpened).toBe(1500);
  });

  it("should enforce tenant-specific rate limits independently", async () => {
    const tenantA = await testDb.createTenant("tenant-a");
    const tenantB = await testDb.createTenant("tenant-b");

    // Exhaust Tenant A's limit
    await setTenantContext(tenantA);
    for (let i = 0; i < 500; i++) {
      await rateLimiter.consume(tenantA, "email_send");
    }

    // Tenant A should be rate limited
    await expect(rateLimiter.consume(tenantA, "email_send"))
      .rejects.toThrow("EML_005");

    // Tenant B should still have quota
    await setTenantContext(tenantB);
    await expect(rateLimiter.consume(tenantB, "email_send"))
      .resolves.not.toThrow();
  });
});
```

### Coverage Targets

| Category | Target | Current | Notes |
|----------|--------|---------|-------|
| **Overall** | ≥ 85% | — | Combined line coverage across all test suites |
| **Unit Tests** | ≥ 90% | — | Core business logic: template rendering, segmentation, automation |
| **Integration Tests** | ≥ 80% | — | ESP interactions, webhook processing, send pipeline |
| **E2E Tests** | ≥ 70% | — | Critical user flows: campaign creation → send → tracking → reporting |
| **Branch Coverage** | ≥ 80% | — | Conditional logic in automation flows, segment evaluation, error handling |
| **Error Paths** | ≥ 85% | — | All error codes must have at least one test exercising them |

### Running Tests

```bash
# Run all email campaign tests
pnpm test --filter=@mcv/growth-email-campaigns

# Run unit tests only
pnpm test --filter=@mcv/growth-email-campaigns -- --testPathPattern=unit

# Run integration tests (requires Docker for PostgreSQL + Redis)
pnpm test:integration --filter=@mcv/growth-email-campaigns

# Run E2E tests
pnpm test:e2e --filter=@mcv/growth-email-campaigns

# Run with coverage report
pnpm test:coverage --filter=@mcv/growth-email-campaigns

# Run specific test file
pnpm vitest run src/__tests__/unit/templates/template-renderer.test.ts

# Watch mode for development
pnpm vitest watch src/__tests__/unit/
```

### Test Fixtures & Factories

```typescript
// Test factories for consistent test data generation
import { createTestFactory } from "@mcv/testing";

export const emailTestFactory = createTestFactory({
  subscriber: {
    default: {
      email: () => faker.internet.email(),
      firstName: () => faker.person.firstName(),
      lastName: () => faker.person.lastName(),
      status: "active",
      tags: [],
      metadata: {},
      createdAt: () => new Date(),
    },
    bounced: {
      status: "bounced",
      bounceCount: 1,
      lastBounceAt: () => new Date(),
    },
    unsubscribed: {
      status: "unsubscribed",
      unsubscribedAt: () => new Date(),
    },
  },
  campaign: {
    default: {
      name: () => faker.commerce.productName() + " Campaign",
      subject: () => faker.lorem.sentence(),
      status: "draft",
      scheduledAt: null,
    },
    scheduled: {
      status: "scheduled",
      scheduledAt: () => addHours(new Date(), 2),
    },
    sent: {
      status: "sent",
      sentAt: () => subHours(new Date(), 1),
    },
  },
  template: {
    default: {
      name: () => faker.commerce.productName() + " Template",
      subject: "Hello {{firstName}}",
      mjml: "<mjml><mj-body><mj-section><mj-column><mj-text>Hello {{firstName}}</mj-text></mj-column></mj-section></mj-body></mjml>",
    },
  },
});
```
