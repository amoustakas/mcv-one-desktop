# @mcv/growth/social

> **Social Media Management** — Multi-platform publishing, engagement monitoring, social listening, analytics, influencer management, and social commerce for the MCV.ONE platform.

```
Package:   @mcv/growth/social
Domain:    growth
Tier:      5 (Domain Module)
Depends:   @mcv/core, @mcv/db, @mcv/auth, @mcv/storage, @mcv/queue, @mcv/growth/analytics
Status:    Stable
Version:   1.x
```

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

`@mcv/growth/social` is the unified social media management layer for MCV.ONE tenants. It abstracts away the complexity of managing multiple social media platforms behind a single, consistent API surface. Whether a tenant operates a personal brand with a single Twitter account or an agency managing hundreds of client profiles across six platforms, this module provides the orchestration, scheduling, analytics, and engagement tools required to operate at scale.

### What This Module Does

- **Publishes content** across Twitter/X, Instagram, Facebook, LinkedIn, TikTok, and YouTube from a unified composer interface, handling per-platform media requirements, character limits, and API idiosyncrasies
- **Schedules posts** via calendar-based workflows with AI-driven optimal-time suggestions, queue management, and bulk import from CSV
- **Monitors engagement** through a unified inbox that aggregates mentions, comments, direct messages, and replies from all connected accounts with sentiment analysis and auto-tagging
- **Listens to social signals** by tracking brand mentions, hashtags, competitor activity, trending topics, and keyword alerts across public social data
- **Tracks analytics** including follower growth, engagement rates, reach/impressions, best-performing content, and audience demographics with cross-platform normalization
- **Manages user-generated content** with discovery, rights management, curation, and re-sharing workflows
- **Coordinates influencer relationships** from discovery through campaign management, performance tracking, and payment processing
- **Enables social commerce** via shoppable posts, product tagging, social storefront links, and conversion attribution from social channels
- **Aggregates social proof** including review collection, testimonial management, social proof widgets, and trust badge generation
- **Supports team collaboration** with multi-user access controls, approval workflows, brand voice guidelines enforcement, and shared content libraries

### What This Module Does NOT Do

- Does not handle ad buying or paid social campaigns (see `@mcv/growth/ads`)
- Does not process payments directly (delegates to `@mcv/billing`)
- Does not provide email or SMS marketing (see `@mcv/growth/email`, `@mcv/growth/sms`)
- Does not handle CRM contact management (see `@mcv/growth/crm`)
- Does not generate content from scratch (see `@mcv/ai/content` for AI content generation)
- Does not store media files directly (delegates to `@mcv/storage`)

### Design Philosophy

1. **Platform-agnostic composition** — Authors compose once; the module handles per-platform adaptation (media resizing, text truncation, hashtag strategies, link handling)
2. **Queue-first publishing** — All posts flow through a durable queue with retry semantics, ensuring no published content is lost even during platform API outages
3. **Tenant isolation by default** — Every query, every webhook, every analytics roll-up is scoped to a tenant via Supabase RLS. Cross-tenant data access is architecturally impossible.
4. **Real-time where it matters** — Engagement items stream via Supabase Realtime subscriptions; analytics are batched hourly
5. **Composable services** — Each capability (publishing, listening, analytics, influencers) is an independent service that can be used standalone or composed into higher-level workflows

---

## Exports

### Services

```typescript
export { SocialService }            from './services/social.service';
export { PublishService }           from './services/publish.service';
export { ScheduleService }         from './services/schedule.service';
export { EngagementService }       from './services/engagement.service';
export { ListeningService }        from './services/listening.service';
export { SocialAnalyticsService }  from './services/analytics.service';
export { InfluencerService }       from './services/influencer.service';
export { UGCService }              from './services/ugc.service';
export { SocialCommerceService }   from './services/commerce.service';
export { SocialProofService }      from './services/proof.service';
export { ContentLibraryService }   from './services/content-library.service';
export { ApprovalService }         from './services/approval.service';
```

### tRPC Routers

```typescript
export { socialRouter }            from './routers/social.router';
export { publishRouter }           from './routers/publish.router';
export { scheduleRouter }          from './routers/schedule.router';
export { engagementRouter }        from './routers/engagement.router';
export { listeningRouter }         from './routers/listening.router';
export { socialAnalyticsRouter }   from './routers/analytics.router';
export { influencerRouter }        from './routers/influencer.router';
export { ugcRouter }               from './routers/ugc.router';
export { socialCommerceRouter }    from './routers/commerce.router';
export { socialProofRouter }       from './routers/proof.router';
```

### Platform Adapters

```typescript
export { TwitterAdapter }          from './adapters/twitter.adapter';
export { InstagramAdapter }        from './adapters/instagram.adapter';
export { FacebookAdapter }         from './adapters/facebook.adapter';
export { LinkedInAdapter }         from './adapters/linkedin.adapter';
export { TikTokAdapter }           from './adapters/tiktok.adapter';
export { YouTubeAdapter }          from './adapters/youtube.adapter';
export { PlatformAdapterFactory }  from './adapters/factory';
```

### Types & Interfaces

```typescript
export type {
  SocialPost,
  SocialAccount,
  SocialPlatform,
  EngagementItem,
  EngagementType,
  SocialListener,
  ListenerMention,
  SocialAnalytics,
  AnalyticsPeriod,
  InfluencerProfile,
  InfluencerCampaign,
  UGCItem,
  UGCRightsStatus,
  ShoppablePost,
  SocialProofWidget,
  ContentLibraryItem,
  ApprovalRequest,
  ApprovalStatus,
  PostStatus,
  PublishResult,
  ScheduleSlot,
  OptimalTimeSlot,
  BrandVoiceConfig,
  SentimentScore,
  PlatformMetrics,
  AudienceDemographic,
  CompetitorProfile,
  TrendingTopic,
  PostComposerInput,
  BulkScheduleInput,
  MediaAttachment,
  PlatformCapability,
} from './types';
```

### Database Schemas

```typescript
export {
  socialAccounts,
  socialPosts,
  postSchedule,
  engagementItems,
  socialListeners,
  listenerMentions,
  influencers,
  influencerCampaigns,
  ugcItems,
  socialAnalytics,
  contentLibrary,
  approvalRequests,
  socialProofWidgets,
  shoppablePosts,
  brandVoiceConfigs,
} from './schemas';
```

### Hooks (React)

```typescript
export { useSocialAccounts }       from './hooks/use-social-accounts';
export { useSocialPosts }          from './hooks/use-social-posts';
export { useScheduleCalendar }     from './hooks/use-schedule-calendar';
export { useEngagementInbox }      from './hooks/use-engagement-inbox';
export { useSocialAnalytics }      from './hooks/use-social-analytics';
export { useInfluencers }          from './hooks/use-influencers';
export { useUGCFeed }              from './hooks/use-ugc-feed';
export { useContentLibrary }       from './hooks/use-content-library';
export { useApprovalQueue }        from './hooks/use-approval-queue';
export { useSocialListening }      from './hooks/use-social-listening';
```

### Constants & Enums

```typescript
export {
  SOCIAL_PLATFORMS,
  POST_STATUSES,
  ENGAGEMENT_TYPES,
  SENTIMENT_LABELS,
  UGC_RIGHTS_STATUSES,
  APPROVAL_STATUSES,
  PLATFORM_LIMITS,
  DEFAULT_OPTIMAL_TIMES,
  ANALYTICS_PERIODS,
} from './constants';
```

---

## Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client (Next.js)                         │
│   Composer UI │ Calendar │ Inbox │ Analytics │ Influencer Dash   │
└──────────┬───────────────────────────────────────────────────────┘
           │ tRPC
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      tRPC Router Layer                           │
│  socialRouter │ publishRouter │ engagementRouter │ analyticsR.   │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Service Layer                              │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Publish      │  │ Schedule     │  │ Engagement             │  │
│  │ Service      │  │ Service      │  │ Service                │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────────┘  │
│         │                 │                    │                  │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌────────┴───────────────┐  │
│  │ Listening    │  │ Analytics    │  │ Influencer             │  │
│  │ Service      │  │ Service      │  │ Service                │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────────┘  │
│         │                 │                    │                  │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌────────┴───────────────┐  │
│  │ UGC          │  │ Commerce     │  │ Social Proof           │  │
│  │ Service      │  │ Service      │  │ Service                │  │
│  └──────────────┘  └──────────────┘  └────────────────────────┘  │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Platform Adapter Layer                         │
│                                                                  │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Twitter  │ │ Instagram │ │ Facebook │ │ LinkedIn │          │
│  │ Adapter  │ │ Adapter   │ │ Adapter  │ │ Adapter  │          │
│  └────┬─────┘ └─────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       │             │            │             │                │
│  ┌────┴─────┐ ┌─────┴─────┐                                    │
│  │ TikTok   │ │ YouTube   │                                    │
│  │ Adapter  │ │ Adapter   │                                    │
│  └──────────┘ └───────────┘                                    │
└──────────┬───────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Infrastructure Layer                         │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Supabase    │  │ @mcv/queue   │  │ @mcv/storage           │  │
│  │ PostgreSQL  │  │ (BullMQ)     │  │ (S3/R2)                │  │
│  │ + RLS       │  │              │  │                        │  │
│  └─────────────┘  └──────────────┘  └────────────────────────┘  │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Supabase    │  │ Redis        │  │ Platform APIs          │  │
│  │ Realtime    │  │ (Rate Limit) │  │ (Twitter, Meta, etc.)  │  │
│  └─────────────┘  └──────────────┘  └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Publish Pipeline

The publish pipeline is the critical path for getting content from the composer UI onto social platforms. It is designed for durability (no lost posts), idempotency (safe retries), and observability (every state transition is tracked).

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PUBLISH PIPELINE                              │
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐   │
│  │ Compose  │───▶│ Validate │───▶│ Schedule │───▶│ Queue        │   │
│  │          │    │ & Adapt  │    │ or       │    │ (BullMQ)     │   │
│  │ • Text   │    │          │    │ Publish  │    │              │   │
│  │ • Media  │    │ • Limits │    │ Now      │    │ • Retry 3x   │   │
│  │ • Tags   │    │ • Media  │    │          │    │ • Exp. back. │   │
│  │ • Links  │    │ • A11y   │    │          │    │ • DLQ        │   │
│  └──────────┘    └──────────┘    └──────────┘    └──────┬───────┘   │
│                                                         │           │
│                                                         ▼           │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐   │
│  │ Track    │◀───│ Confirm  │◀───│ Publish  │◀───│ Adapter      │   │
│  │ Result   │    │ Posted   │    │ via      │    │ Dispatch     │   │
│  │          │    │          │    │ Platform │    │              │   │
│  │ • Post ID│    │ • URL    │    │ API      │    │ • Platform   │   │
│  │ • Status │    │ • Metrics│    │          │    │   selection  │   │
│  │ • Error  │    │ • Time   │    │          │    │ • Token mgmt │   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Pipeline stages in detail:**

1. **Compose** — User creates a post in the unified composer. Text, media attachments, hashtags, mentions, and link previews are captured. Per-platform overrides can be specified (e.g., different text for Twitter vs. LinkedIn).

2. **Validate & Adapt** — Each target platform's constraints are checked:
   - Character limits (Twitter: 280, LinkedIn: 3000, etc.)
   - Media format/dimension requirements (Instagram square, TikTok vertical)
   - Link handling (Twitter auto-shortens, LinkedIn allows full URLs)
   - Hashtag limits and strategies
   - Alt text and accessibility compliance

3. **Schedule or Publish Now** — If scheduling is requested, the post is stored in `post_schedule` with the target timestamp. A cron job picks up due posts. If "publish now," the post proceeds directly to the queue.

4. **Queue (BullMQ)** — The post enters a durable job queue with:
   - 3 retry attempts with exponential backoff (1s, 10s, 60s)
   - Dead-letter queue for permanently failed posts
   - Per-platform rate limiting via Redis sliding windows
   - Idempotency keys to prevent duplicate posts on retry

5. **Adapter Dispatch** — The `PlatformAdapterFactory` selects the correct adapter based on the target platform. The adapter handles OAuth token refresh, API-specific request formatting, and media uploads.

6. **Publish via Platform API** — The adapter makes the actual API call. Platform-specific responses are normalized into a `PublishResult`.

7. **Confirm Posted** — The platform-assigned post ID, URL, and initial metrics are recorded. The `social_posts` record transitions to `published` status.

8. **Track Result** — The publish result is stored, analytics tracking begins, and any post-publish webhooks (e.g., notifying team members) are fired.

### Engagement Inbox Architecture

The engagement inbox aggregates interactions from all connected social accounts into a single, queryable feed. This is implemented as a combination of webhook receivers (push) and periodic polling (pull) depending on platform capabilities.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ENGAGEMENT INBOX                                 │
│                                                                      │
│   Platform Webhooks              Polling Workers                     │
│   ┌──────────────┐              ┌──────────────┐                    │
│   │ Twitter      │              │ Instagram    │                    │
│   │ Account      │              │ Comment      │                    │
│   │ Activity API │              │ Poller       │                    │
│   └──────┬───────┘              └──────┬───────┘                    │
│          │                             │                            │
│   ┌──────┴───────┐              ┌──────┴───────┐                    │
│   │ Facebook     │              │ TikTok       │                    │
│   │ Webhook      │              │ Comment      │                    │
│   │ Receiver     │              │ Poller       │                    │
│   └──────┬───────┘              └──────┬───────┘                    │
│          │                             │                            │
│          ▼                             ▼                            │
│   ┌────────────────────────────────────────────────────────┐       │
│   │              Ingestion Pipeline                         │       │
│   │                                                        │       │
│   │  1. Deduplicate (platform_id + type)                   │       │
│   │  2. Normalize to EngagementItem                        │       │
│   │  3. Run Sentiment Analysis (AI)                        │       │
│   │  4. Auto-tag (spam, question, complaint, praise)       │       │
│   │  5. Match to Social Listener rules                     │       │
│   │  6. Store in engagement_items                          │       │
│   │  7. Emit Realtime event                                │       │
│   └────────────────────────────┬───────────────────────────┘       │
│                                │                                    │
│                                ▼                                    │
│   ┌────────────────────────────────────────────────────────┐       │
│   │              Unified Inbox UI                           │       │
│   │                                                        │       │
│   │  • Filter by platform, account, sentiment, tag         │       │
│   │  • Reply inline (routed back through adapter)          │       │
│   │  • Assign to team members                              │       │
│   │  • Apply response templates                            │       │
│   │  • Mark as resolved / archive                          │       │
│   │  • Realtime updates via Supabase subscriptions         │       │
│   └────────────────────────────────────────────────────────┘       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Social Listening Architecture

Social listening operates as a background system that continuously scans for relevant mentions, keywords, and trends. It separates from the engagement inbox because it tracks mentions that may not be directed at the tenant's accounts — competitor mentions, industry keywords, hashtag trends, etc.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SOCIAL LISTENING                                  │
│                                                                      │
│   ┌───────────────────────────────────────────────────────────┐     │
│   │                 Listener Configuration                     │     │
│   │                                                           │     │
│   │  • Brand keywords (e.g., "mcv.one", "@mcv_one")          │     │
│   │  • Competitor handles and keywords                        │     │
│   │  • Industry hashtags (#saas, #nocode)                     │     │
│   │  • Custom keyword combinations (boolean logic)            │     │
│   │  • Sentiment filters (alert on negative only)             │     │
│   │  • Volume thresholds (alert on spikes)                    │     │
│   └───────────────────────┬───────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│   ┌───────────────────────────────────────────────────────────┐     │
│   │                 Scanning Workers                           │     │
│   │                                                           │     │
│   │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────────┐  │     │
│   │  │ Twitter  │ │ Reddit    │ │ News     │ │ Web        │  │     │
│   │  │ Search   │ │ Search    │ │ API      │ │ Mentions   │  │     │
│   │  │ API      │ │ API       │ │          │ │            │  │     │
│   │  └────┬─────┘ └─────┬─────┘ └────┬─────┘ └─────┬──────┘  │     │
│   │       └──────────────┴────────────┴──────────────┘        │     │
│   └───────────────────────┬───────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│   ┌───────────────────────────────────────────────────────────┐     │
│   │                 Processing Pipeline                        │     │
│   │                                                           │     │
│   │  1. Deduplicate mentions                                  │     │
│   │  2. Classify sentiment                                    │     │
│   │  3. Extract entities (people, brands, products)           │     │
│   │  4. Calculate reach/influence score                       │     │
│   │  5. Check alert rules → trigger notifications             │     │
│   │  6. Store in listener_mentions                            │     │
│   │  7. Update trend aggregates                               │     │
│   └───────────────────────────────────────────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Analytics Pipeline

Analytics data flows through a multi-stage pipeline that normalizes platform-specific metrics into a unified schema:

```
Platform APIs (hourly pull)
        │
        ▼
┌─────────────────────┐
│  Raw Metrics Store   │  ← Per-platform, per-post metrics snapshots
│  (social_analytics)  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Normalization       │  ← Map platform terms to unified vocab
│  Engine              │     (impressions, reach, engagements)
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Aggregation         │  ← Roll up by hour, day, week, month
│  Workers             │     per-account and cross-account
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Analytics API       │  ← tRPC endpoints for dashboard queries
│  (cached w/ Redis)   │
└─────────────────────┘
```

---

## Core Interfaces

### SocialPlatform

```typescript
/**
 * Supported social media platforms.
 */
type SocialPlatform =
  | 'twitter'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'youtube';
```

### SocialAccount

```typescript
/**
 * A connected social media account belonging to a tenant.
 * Each account holds OAuth credentials and platform-specific metadata.
 */
interface SocialAccount {
  /** Unique identifier (UUID). */
  id: string;

  /** Tenant that owns this account. */
  tenantId: string;

  /** User who connected this account. */
  connectedBy: string;

  /** Social platform identifier. */
  platform: SocialPlatform;

  /** Platform-assigned account/user ID. */
  platformAccountId: string;

  /** Display name on the platform (e.g., "@mcv_one"). */
  platformUsername: string;

  /** Display name / profile name. */
  displayName: string;

  /** Profile avatar URL. */
  avatarUrl: string | null;

  /** Profile bio / description. */
  bio: string | null;

  /** Current follower count (cached, updated hourly). */
  followerCount: number;

  /** Current following count (cached, updated hourly). */
  followingCount: number;

  /** Whether the account is verified on the platform. */
  isVerified: boolean;

  /** OAuth access token (encrypted at rest). */
  accessToken: string;

  /** OAuth refresh token (encrypted at rest). */
  refreshToken: string | null;

  /** Token expiration timestamp. */
  tokenExpiresAt: Date | null;

  /** OAuth scopes granted by the user. */
  scopes: string[];

  /** Platform-specific metadata (page ID, channel ID, etc.). */
  platformMeta: Record<string, unknown>;

  /** Whether the account is active and can be used for publishing. */
  isActive: boolean;

  /** Last time data was successfully synced from the platform. */
  lastSyncAt: Date | null;

  /** Reason for deactivation, if applicable. */
  deactivationReason: string | null;

  createdAt: Date;
  updatedAt: Date;
}
```

### SocialPost

```typescript
/**
 * Status lifecycle of a social post.
 */
type PostStatus =
  | 'draft'           // Created but not finalized
  | 'pending_approval' // Awaiting team approval
  | 'approved'        // Approved, ready to schedule/publish
  | 'rejected'        // Rejected by approver
  | 'scheduled'       // Queued for future publication
  | 'publishing'      // Currently being published via platform API
  | 'published'       // Successfully published
  | 'failed'          // Publication failed after all retries
  | 'deleted';        // Soft-deleted

/**
 * A social media post, either composed directly or scheduled.
 * A single SocialPost can target multiple platforms; each target
 * generates a separate platform-specific publish job.
 */
interface SocialPost {
  /** Unique identifier (UUID). */
  id: string;

  /** Tenant that owns this post. */
  tenantId: string;

  /** User who created the post. */
  createdBy: string;

  /** Current status. */
  status: PostStatus;

  /**
   * The canonical post content (primary text).
   * Platform-specific overrides are in `platformOverrides`.
   */
  content: string;

  /**
   * Per-platform text overrides.
   * Key = SocialPlatform, Value = override text.
   * If a platform key is absent, `content` is used.
   */
  platformOverrides: Partial<Record<SocialPlatform, string>>;

  /** Media attachments (images, videos, GIFs). */
  media: MediaAttachment[];

  /** Target social accounts to publish to. */
  targetAccountIds: string[];

  /** Hashtags to include. */
  hashtags: string[];

  /** User/account mentions. */
  mentions: string[];

  /** Link to include in the post. */
  link: string | null;

  /** Link preview override (title, description, image). */
  linkPreview: {
    title?: string;
    description?: string;
    imageUrl?: string;
  } | null;

  /** UTM parameters to append to links. */
  utmParams: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  } | null;

  /** First comment / auto-reply (used on Instagram, LinkedIn). */
  firstComment: string | null;

  /** Geographic targeting (platform-dependent). */
  geoTargeting: {
    countries?: string[];
    languages?: string[];
  } | null;

  /** Whether this post is part of a thread (Twitter) or carousel (Instagram). */
  isThread: boolean;

  /** Thread/carousel items if isThread is true. */
  threadItems: Array<{
    content: string;
    media: MediaAttachment[];
  }>;

  /** Content library item this post was created from, if any. */
  contentLibraryItemId: string | null;

  /** Campaign tag for grouping and analytics. */
  campaignTag: string | null;

  /** Labels/tags for organization. */
  labels: string[];

  /** Notes visible only to team members. */
  internalNotes: string | null;

  /** Schedule information (null if published immediately). */
  scheduledFor: Date | null;

  /** Actual publish timestamp. */
  publishedAt: Date | null;

  /** Per-platform publish results. */
  publishResults: Record<string, PublishResult>;

  /** Approval tracking. */
  approvalId: string | null;

  createdAt: Date;
  updatedAt: Date;
}
```

### MediaAttachment

```typescript
/**
 * A media file attached to a social post.
 */
interface MediaAttachment {
  /** Unique identifier. */
  id: string;

  /** Storage URL (via @mcv/storage). */
  url: string;

  /** MIME type (image/jpeg, video/mp4, image/gif, etc.). */
  mimeType: string;

  /** File size in bytes. */
  sizeBytes: number;

  /** Width in pixels (images/video). */
  width: number | null;

  /** Height in pixels (images/video). */
  height: number | null;

  /** Duration in seconds (video/audio). */
  durationSeconds: number | null;

  /** Thumbnail URL (for videos). */
  thumbnailUrl: string | null;

  /** Alt text for accessibility. */
  altText: string | null;

  /**
   * Platform-specific media variants (auto-generated).
   * E.g., Instagram square crop, TikTok vertical format.
   */
  variants: Record<SocialPlatform, {
    url: string;
    width: number;
    height: number;
    mimeType: string;
  }>;

  /** Display order within the post. */
  sortOrder: number;
}
```

### PublishResult

```typescript
/**
 * The outcome of publishing a post to a single platform.
 */
interface PublishResult {
  /** Target platform. */
  platform: SocialPlatform;

  /** Target account ID. */
  accountId: string;

  /** Whether the publish was successful. */
  success: boolean;

  /** Platform-assigned post/tweet/video ID. */
  platformPostId: string | null;

  /** Direct URL to the published post. */
  postUrl: string | null;

  /** Error message if failed. */
  error: string | null;

  /** Error code from the platform API. */
  platformErrorCode: string | null;

  /** Number of retry attempts made. */
  retryCount: number;

  /** Timestamp of the publish attempt. */
  publishedAt: Date | null;

  /** Raw API response (stored for debugging, not exposed to clients). */
  rawResponse: Record<string, unknown> | null;
}
```

### EngagementItem

```typescript
/**
 * Types of engagement that can appear in the unified inbox.
 */
type EngagementType =
  | 'mention'       // Someone mentioned the account
  | 'comment'       // Comment on a post
  | 'reply'         // Reply to a post/tweet
  | 'dm'            // Direct message
  | 'like'          // Like/favorite (high-value only)
  | 'repost'        // Retweet/share
  | 'follow'        // New follower
  | 'review'        // Review on Facebook/Google
  | 'story_mention' // Story mention (Instagram)
  | 'tag';          // Tagged in a post

/**
 * Sentiment classification for engagement items.
 */
type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'mixed';

/**
 * A single engagement item from any connected social account.
 * This is the normalized representation used in the unified inbox.
 */
interface EngagementItem {
  /** Unique identifier (UUID). */
  id: string;

  /** Tenant that owns this item. */
  tenantId: string;

  /** Social account that received this engagement. */
  accountId: string;

  /** Platform the engagement came from. */
  platform: SocialPlatform;

  /** Type of engagement. */
  type: EngagementType;

  /** Platform-assigned ID for this engagement. */
  platformEngagementId: string;

  /** The person who engaged (their platform username). */
  authorUsername: string;

  /** The person's display name. */
  authorDisplayName: string;

  /** The person's avatar URL. */
  authorAvatarUrl: string | null;

  /** The person's follower count (if available). */
  authorFollowerCount: number | null;

  /** Whether the author is verified on the platform. */
  authorIsVerified: boolean;

  /** The text content of the engagement (comment text, DM text, etc.). */
  content: string | null;

  /** Media attached to the engagement (images in DMs, etc.). */
  media: Array<{
    url: string;
    mimeType: string;
  }>;

  /** The SocialPost this engagement is related to (if applicable). */
  relatedPostId: string | null;

  /** Platform ID of the parent content (tweet being replied to, etc.). */
  platformParentId: string | null;

  /** Direct URL to this engagement on the platform. */
  engagementUrl: string | null;

  /** AI-classified sentiment. */
  sentiment: SentimentLabel;

  /** Sentiment confidence score (0.0 - 1.0). */
  sentimentScore: number;

  /** Auto-generated tags (e.g., 'question', 'complaint', 'praise', 'spam'). */
  autoTags: string[];

  /** Manually assigned tags by team members. */
  manualTags: string[];

  /** Team member this item is assigned to. */
  assignedTo: string | null;

  /** Whether this item has been read. */
  isRead: boolean;

  /** Whether this item has been resolved/archived. */
  isResolved: boolean;

  /** Whether a reply has been sent. */
  isReplied: boolean;

  /** ID of the reply engagement item, if replied. */
  replyItemId: string | null;

  /** Priority level (auto-calculated from sentiment + author influence). */
  priority: 'low' | 'medium' | 'high' | 'urgent';

  /** Timestamp when this engagement occurred on the platform. */
  occurredAt: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

### SocialListener

```typescript
/**
 * A social listening rule that monitors for specific keywords,
 * hashtags, mentions, or other signals across platforms.
 */
interface SocialListener {
  /** Unique identifier (UUID). */
  id: string;

  /** Tenant that owns this listener. */
  tenantId: string;

  /** Human-readable name for this listener. */
  name: string;

  /** Description of what this listener tracks. */
  description: string | null;

  /**
   * Listener type determines the scanning strategy:
   * - 'keyword' — Track keyword/phrase mentions
   * - 'hashtag' — Track hashtag usage
   * - 'competitor' — Track competitor accounts/keywords
   * - 'brand' — Track brand mentions (includes fuzzy matching)
   * - 'industry' — Track industry terms and trends
   */
  type: 'keyword' | 'hashtag' | 'competitor' | 'brand' | 'industry';

  /** Keywords or phrases to track. Supports boolean logic (AND, OR, NOT). */
  keywords: string[];

  /** Hashtags to track (without #). */
  hashtags: string[];

  /** Platform account handles to monitor (for competitor tracking). */
  trackedHandles: string[];

  /** Which platforms to scan. Empty array means all platforms. */
  platforms: SocialPlatform[];

  /** Language filter. Empty means all languages. */
  languages: string[];

  /** Geographic filter (ISO country codes). */
  countries: string[];

  /** Minimum follower count for results (filter out low-influence noise). */
  minFollowerCount: number;

  /** Sentiment filter — only capture mentions matching these sentiments. */
  sentimentFilter: SentimentLabel[];

  /** Whether to send real-time alerts for matches. */
  alertEnabled: boolean;

  /** Alert channels (email, in-app, slack, webhook). */
  alertChannels: Array<{
    type: 'email' | 'in_app' | 'slack' | 'webhook';
    target: string; // Email address, Slack channel, webhook URL
  }>;

  /** Volume spike alert — notify if mention volume exceeds this per hour. */
  volumeSpikeThreshold: number | null;

  /** Whether this listener is active. */
  isActive: boolean;

  /** Last time this listener was scanned. */
  lastScanAt: Date | null;

  /** Total mentions captured by this listener. */
  totalMentions: number;

  createdAt: Date;
  updatedAt: Date;
}
```

### ListenerMention

```typescript
/**
 * A single mention captured by a social listener.
 */
interface ListenerMention {
  /** Unique identifier (UUID). */
  id: string;

  /** Tenant that owns this mention. */
  tenantId: string;

  /** The listener that captured this mention. */
  listenerId: string;

  /** Platform where the mention was found. */
  platform: SocialPlatform | 'reddit' | 'news' | 'web';

  /** Platform-assigned ID for the source content. */
  platformContentId: string;

  /** URL to the source content. */
  sourceUrl: string;

  /** Author's username/handle. */
  authorUsername: string;

  /** Author's display name. */
  authorDisplayName: string;

  /** Author's follower/subscriber count. */
  authorFollowerCount: number | null;

  /** The text content of the mention. */
  content: string;

  /** Keywords from the listener that matched. */
  matchedKeywords: string[];

  /** AI-classified sentiment. */
  sentiment: SentimentLabel;

  /** Sentiment confidence score (0.0 - 1.0). */
  sentimentScore: number;

  /** Estimated reach of this mention (followers × engagement rate). */
  estimatedReach: number | null;

  /** Engagement metrics on the mention itself (likes, shares, replies). */
  engagementMetrics: {
    likes: number;
    shares: number;
    comments: number;
  };

  /** Extracted entities (people, brands, products mentioned). */
  entities: Array<{
    type: 'person' | 'brand' | 'product' | 'location';
    name: string;
    confidence: number;
  }>;

  /** Whether this mention has been reviewed by a team member. */
  isReviewed: boolean;

  /** Whether this mention triggered an alert. */
  alertTriggered: boolean;

  /** Timestamp when the mention was posted on the platform. */
  mentionedAt: Date;

  createdAt: Date;
}
```

### SocialAnalytics

```typescript
/**
 * Time period for analytics aggregation.
 */
type AnalyticsPeriod = '1h' | '1d' | '7d' | '30d' | '90d' | '1y' | 'custom';

/**
 * Aggregated analytics for a social account over a time period.
 */
interface SocialAnalytics {
  /** Unique identifier (UUID). */
  id: string;

  /** Tenant that owns this analytics record. */
  tenantId: string;

  /** Social account these analytics are for. */
  accountId: string;

  /** Platform. */
  platform: SocialPlatform;

  /** Start of the analytics period. */
  periodStart: Date;

  /** End of the analytics period. */
  periodEnd: Date;

  /** Granularity of this record (hourly snapshot, daily rollup, etc.). */
  granularity: 'hour' | 'day' | 'week' | 'month';

  /** Follower count at end of period. */
  followerCount: number;

  /** Net follower change during period. */
  followerChange: number;

  /** Following count at end of period. */
  followingCount: number;

  /** Number of posts published during period. */
  postsPublished: number;

  /** Total impressions across all posts. */
  impressions: number;

  /** Total reach (unique viewers). */
  reach: number;

  /** Total engagements (likes + comments + shares + saves). */
  engagements: number;

  /** Engagement rate (engagements / impressions). */
  engagementRate: number;

  /** Breakdown of engagement types. */
  engagementBreakdown: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    videoViews: number;
    profileVisits: number;
  };

  /** Link clicks from posts. */
  linkClicks: number;

  /** Click-through rate (clicks / impressions). */
  clickThroughRate: number;

  /** Average engagement per post. */
  avgEngagementPerPost: number;

  /** Best performing post ID during this period. */
  topPostId: string | null;

  /** Audience demographics snapshot. */
  demographics: AudienceDemographic | null;

  /** Best posting times derived from this period's data. */
  optimalPostingTimes: OptimalTimeSlot[];

  /** Top performing hashtags. */
  topHashtags: Array<{
    hashtag: string;
    uses: number;
    avgEngagement: number;
  }>;

  /** Content type performance breakdown. */
  contentTypePerformance: Array<{
    type: 'text' | 'image' | 'video' | 'carousel' | 'story' | 'reel';
    posts: number;
    avgEngagement: number;
    avgReach: number;
  }>;

  createdAt: Date;
}
```

### AudienceDemographic

```typescript
/**
 * Audience demographics for a social account.
 */
interface AudienceDemographic {
  /** Gender distribution. */
  gender: Array<{
    label: string;
    percentage: number;
  }>;

  /** Age range distribution. */
  ageRanges: Array<{
    range: string;   // e.g., "18-24", "25-34"
    percentage: number;
  }>;

  /** Top countries. */
  countries: Array<{
    code: string;    // ISO 3166 alpha-2
    name: string;
    percentage: number;
  }>;

  /** Top cities. */
  cities: Array<{
    name: string;
    country: string;
    percentage: number;
  }>;

  /** Language distribution. */
  languages: Array<{
    code: string;    // ISO 639-1
    name: string;
    percentage: number;
  }>;

  /** Active hours (UTC). */
  activeHours: Array<{
    hour: number;    // 0-23
    dayOfWeek: number; // 0-6 (Sun-Sat)
    activityLevel: number; // 0.0 - 1.0
  }>;
}
```

### OptimalTimeSlot

```typescript
/**
 * A recommended time slot for publishing based on historical engagement data.
 */
interface OptimalTimeSlot {
  /** Day of week (0 = Sunday, 6 = Saturday). */
  dayOfWeek: number;

  /** Hour in UTC (0-23). */
  hourUtc: number;

  /** Confidence score (0.0 - 1.0) based on data volume. */
  confidence: number;

  /** Expected engagement rate at this time. */
  expectedEngagementRate: number;

  /** Platform this recommendation is for. */
  platform: SocialPlatform;

  /** Number of historical data points used. */
  dataPoints: number;
}
```

### InfluencerProfile

```typescript
/**
 * An influencer tracked by the tenant for potential or active partnerships.
 */
interface InfluencerProfile {
  /** Unique identifier (UUID). */
  id: string;

  /** Tenant that manages this influencer relationship. */
  tenantId: string;

  /** Influencer's full name. */
  name: string;

  /** Influencer's email (for outreach). */
  email: string | null;

  /** Profile photo URL. */
  avatarUrl: string | null;

  /** Short bio / description. */
  bio: string | null;

  /** Primary niche/category (e.g., "tech", "fashion", "fitness"). */
  niche: string;

  /** Sub-niches / specialties. */
  subNiches: string[];

  /** Social platform profiles. */
  socialProfiles: Array<{
    platform: SocialPlatform;
    username: string;
    profileUrl: string;
    followerCount: number;
    engagementRate: number;
    isVerified: boolean;
    lastUpdated: Date;
  }>;

  /** Total reach across all platforms. */
  totalReach: number;

  /** Average engagement rate across platforms. */
  avgEngagementRate: number;

  /**
   * Tier classification based on follower count:
   * - nano: < 10K
   * - micro: 10K - 100K
   * - mid: 100K - 500K
   * - macro: 500K - 1M
   * - mega: > 1M
   */
  tier: 'nano' | 'micro' | 'mid' | 'macro' | 'mega';

  /** Audience demographics (if available from platform). */
  audienceDemographics: AudienceDemographic | null;

  /** Content quality score (AI-assessed, 0.0 - 1.0). */
  contentQualityScore: number | null;

  /** Brand safety score (AI-assessed, 0.0 - 1.0). */
  brandSafetyScore: number | null;

  /** Estimated cost per post (in cents). */
  estimatedCostPerPost: number | null;

  /** Relationship status with tenant. */
  relationshipStatus:
    | 'discovered'        // Found via search/scanning
    | 'outreach_pending'  // Outreach message sent
    | 'in_conversation'   // Active discussion
    | 'contracted'        // Active partnership
    | 'completed'         // Past partnership
    | 'declined'          // Declined collaboration
    | 'blacklisted';      // Do not contact

  /** Internal notes about this influencer. */
  notes: string | null;

  /** Tags for organization. */
  tags: string[];

  /** Number of campaigns this influencer has participated in. */
  campaignCount: number;

  /** Total amount paid to this influencer (in cents). */
  totalPaid: number;

  /** Average ROI across campaigns (revenue / cost). */
  avgROI: number | null;

  /** Last time outreach was attempted. */
  lastOutreachAt: Date | null;

  /** Last time the influencer responded. */
  lastResponseAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
```

### InfluencerCampaign

```typescript
/**
 * An influencer marketing campaign linking influencers to deliverables and outcomes.
 */
interface InfluencerCampaign {
  /** Unique identifier (UUID). */
  id: string;

  /** Tenant that owns this campaign. */
  tenantId: string;

  /** Campaign name. */
  name: string;

  /** Campaign description / brief. */
  description: string;

  /** Campaign start date. */
  startDate: Date;

  /** Campaign end date. */
  endDate: Date;

  /** Total campaign budget (in cents). */
  budget: number;

  /** Amount spent so far (in cents). */
  spent: number;

  /** Campaign status. */
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

  /** Campaign goals. */
  goals: Array<{
    type: 'awareness' | 'engagement' | 'traffic' | 'conversions' | 'content';
    target: number;
    current: number;
    metric: string; // e.g., "impressions", "clicks", "signups"
  }>;

  /** Influencers participating in this campaign. */
  participants: Array<{
    influencerId: string;
    status: 'invited' | 'accepted' | 'declined' | 'completed';
    agreedRate: number; // In cents
    deliverables: Array<{
      type: 'post' | 'story' | 'reel' | 'video' | 'review' | 'thread';
      platform: SocialPlatform;
      quantity: number;
      delivered: number;
      platformPostIds: string[];
    }>;
    totalPaid: number;
    performance: {
      impressions: number;
      engagements: number;
      clicks: number;
      conversions: number;
    };
  }>;

  /** Campaign-level UTM parameters. */
  utmParams: {
    source: string;
    medium: string;
    campaign: string;
  };

  /** Required hashtags for posts. */
  requiredHashtags: string[];

  /** Required disclosure text (e.g., "#ad", "#sponsored"). */
  disclosureText: string;

  /** Tracking links for conversion attribution. */
  trackingLinks: Array<{
    url: string;
    shortUrl: string;
    influencerId: string;
    clicks: number;
    conversions: number;
  }>;

  /** Content guidelines / brief document URL. */
  briefUrl: string | null;

  /** Campaign tags for organization. */
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}
```

### UGCItem

```typescript
/**
 * Rights management status for user-generated content.
 */
type UGCRightsStatus =
  | 'pending'        // Rights request not yet sent
  | 'requested'      // Rights request sent to creator
  | 'approved'       // Creator approved usage
  | 'denied'         // Creator denied usage
  | 'expired';       // Approval expired

/**
 * A piece of user-generated content discovered on social media.
 */
interface UGCItem {
  /** Unique identifier (UUID). */
  id: string;

  /** Tenant that tracks this UGC. */
  tenantId: string;

  /** Platform where the UGC was found. */
  platform: SocialPlatform;

  /** Platform-assigned content ID. */
  platformContentId: string;

  /** URL to the original content. */
  sourceUrl: string;

  /** Content type. */
  contentType: 'image' | 'video' | 'text' | 'story' | 'reel' | 'carousel';

  /** Text content / caption. */
  caption: string | null;

  /** Media URLs. */
  mediaUrls: string[];

  /** Cached media URLs in tenant's storage (after rights approval). */
  cachedMediaUrls: string[];

  /** Creator's username. */
  creatorUsername: string;

  /** Creator's display name. */
  creatorDisplayName: string;

  /** Creator's follower count. */
  creatorFollowerCount: number | null;

  /** Creator's profile URL. */
  creatorProfileUrl: string;

  /** Engagement metrics on the original content. */
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    views: number | null;
  };

  /** How this UGC was discovered. */
  discoveryMethod: 'hashtag' | 'mention' | 'tag' | 'search' | 'manual';

  /** The search term / hashtag / mention that led to discovery. */
  discoverySource: string;

  /** Content quality score (AI-assessed, 0.0 - 1.0). */
  qualityScore: number | null;

  /** Relevance score to the brand (AI-assessed, 0.0 - 1.0). */
  relevanceScore: number | null;

  /** Brand safety assessment. */
  brandSafe: boolean;

  /** Rights management status. */
  rightsStatus: UGCRightsStatus;

  /** Date rights were requested. */
  rightsRequestedAt: Date | null;

  /** Date rights were approved/denied. */
  rightsRespondedAt: Date | null;

  /** Rights approval expiry date. */
  rightsExpiresAt: Date | null;

  /** Message sent to request rights. */
  rightsRequestMessage: string | null;

  /** Whether this UGC has been re-shared by the tenant. */
  isReshared: boolean;

  /** Social post ID if reshared. */
  resharedPostId: string | null;

  /** Whether this UGC is starred/favorited. */
  isStarred: boolean;

  /** Tags for organization. */
  tags: string[];

  /** Internal notes. */
  notes: string | null;

  /** Date the UGC was originally posted on the platform. */
  postedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

### SocialService (Façade)

```typescript
/**
 * Primary façade service for social media management.
 * Composes specialized services into a unified API.
 */
interface SocialService {
  // --- Account Management ---

  /** Connect a new social account via OAuth flow. */
  connectAccount(input: {
    tenantId: string;
    platform: SocialPlatform;
    oauthCode: string;
    redirectUri: string;
  }): Promise<SocialAccount>;

  /** Disconnect a social account (revokes tokens, deactivates). */
  disconnectAccount(tenantId: string, accountId: string): Promise<void>;

  /** List all connected accounts for a tenant. */
  listAccounts(tenantId: string, filters?: {
    platform?: SocialPlatform;
    isActive?: boolean;
  }): Promise<SocialAccount[]>;

  /** Refresh OAuth tokens for an account. */
  refreshAccountTokens(accountId: string): Promise<void>;

  /** Sync account metadata (follower count, bio, etc.) from platform. */
  syncAccountMetadata(accountId: string): Promise<SocialAccount>;

  // --- Publishing ---

  /** Create a new post (draft or immediate publish). */
  createPost(input: PostComposerInput): Promise<SocialPost>;

  /** Update a draft or scheduled post. */
  updatePost(postId: string, input: Partial<PostComposerInput>): Promise<SocialPost>;

  /** Publish a post immediately. */
  publishNow(postId: string): Promise<SocialPost>;

  /** Schedule a post for future publication. */
  schedulePost(postId: string, scheduledFor: Date): Promise<SocialPost>;

  /** Cancel a scheduled post. */
  cancelScheduledPost(postId: string): Promise<SocialPost>;

  /** Delete a post (soft delete from system, optionally delete from platform). */
  deletePost(postId: string, deleteFromPlatform?: boolean): Promise<void>;

  /** Get a post by ID. */
  getPost(tenantId: string, postId: string): Promise<SocialPost | null>;

  /** List posts with filtering and pagination. */
  listPosts(tenantId: string, filters?: {
    status?: PostStatus | PostStatus[];
    accountIds?: string[];
    platforms?: SocialPlatform[];
    campaignTag?: string;
    labels?: string[];
    dateRange?: { from: Date; to: Date };
    search?: string;
  }, pagination?: {
    cursor?: string;
    limit?: number;
  }): Promise<{ posts: SocialPost[]; nextCursor: string | null }>;

  /** Bulk schedule posts from CSV. */
  bulkSchedule(tenantId: string, input: BulkScheduleInput): Promise<{
    created: number;
    errors: Array<{ row: number; error: string }>;
  }>;

  // --- Engagement ---

  /** Get the unified engagement inbox. */
  getEngagementInbox(tenantId: string, filters?: {
    accountIds?: string[];
    platforms?: SocialPlatform[];
    types?: EngagementType[];
    sentiment?: SentimentLabel[];
    isRead?: boolean;
    isResolved?: boolean;
    assignedTo?: string;
    priority?: string[];
    dateRange?: { from: Date; to: Date };
    search?: string;
  }, pagination?: {
    cursor?: string;
    limit?: number;
  }): Promise<{ items: EngagementItem[]; nextCursor: string | null; unreadCount: number }>;

  /** Reply to an engagement item (sends reply via platform API). */
  replyToEngagement(itemId: string, reply: {
    content: string;
    media?: MediaAttachment[];
  }): Promise<EngagementItem>;

  /** Assign an engagement item to a team member. */
  assignEngagement(itemId: string, userId: string): Promise<void>;

  /** Mark engagement items as read. */
  markAsRead(itemIds: string[]): Promise<void>;

  /** Resolve/archive engagement items. */
  resolveEngagement(itemIds: string[]): Promise<void>;

  /** Apply tags to engagement items. */
  tagEngagement(itemIds: string[], tags: string[]): Promise<void>;

  // --- Listening ---

  /** Create a social listener. */
  createListener(input: Omit<SocialListener, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'lastScanAt' | 'totalMentions'>): Promise<SocialListener>;

  /** Update a listener configuration. */
  updateListener(listenerId: string, input: Partial<SocialListener>): Promise<SocialListener>;

  /** Delete a listener. */
  deleteListener(listenerId: string): Promise<void>;

  /** List listeners for a tenant. */
  listListeners(tenantId: string): Promise<SocialListener[]>;

  /** Get mentions captured by a listener. */
  getListenerMentions(listenerId: string, filters?: {
    sentiment?: SentimentLabel[];
    platforms?: string[];
    dateRange?: { from: Date; to: Date };
    minReach?: number;
  }, pagination?: {
    cursor?: string;
    limit?: number;
  }): Promise<{ mentions: ListenerMention[]; nextCursor: string | null }>;

  /** Get trending topics related to tenant's listeners. */
  getTrendingTopics(tenantId: string, options?: {
    platforms?: SocialPlatform[];
    timeRange?: '1h' | '6h' | '24h' | '7d';
  }): Promise<TrendingTopic[]>;

  // --- Analytics ---

  /** Get analytics for a specific account. */
  getAccountAnalytics(accountId: string, period: AnalyticsPeriod, options?: {
    customStart?: Date;
    customEnd?: Date;
  }): Promise<SocialAnalytics>;

  /** Get cross-account analytics summary for a tenant. */
  getTenantAnalyticsSummary(tenantId: string, period: AnalyticsPeriod): Promise<{
    totalFollowers: number;
    followerChange: number;
    totalImpressions: number;
    totalEngagements: number;
    avgEngagementRate: number;
    postsPublished: number;
    topPlatform: SocialPlatform;
    byPlatform: Record<SocialPlatform, SocialAnalytics>;
  }>;

  /** Get the best performing posts across accounts. */
  getTopPosts(tenantId: string, period: AnalyticsPeriod, options?: {
    limit?: number;
    sortBy?: 'engagements' | 'reach' | 'clicks';
    platform?: SocialPlatform;
  }): Promise<Array<SocialPost & { metrics: PlatformMetrics }>>;

  /** Get optimal posting times based on historical data. */
  getOptimalPostingTimes(accountId: string): Promise<OptimalTimeSlot[]>;

  /** Get audience demographics for an account. */
  getAudienceDemographics(accountId: string): Promise<AudienceDemographic>;

  /** Get competitor benchmarks (if competitor tracking is set up). */
  getCompetitorBenchmarks(tenantId: string): Promise<CompetitorProfile[]>;

  // --- Influencer Management ---

  /** Search / discover influencers. */
  searchInfluencers(tenantId: string, criteria: {
    niche?: string;
    platforms?: SocialPlatform[];
    tier?: InfluencerProfile['tier'];
    minFollowers?: number;
    maxFollowers?: number;
    minEngagementRate?: number;
    location?: string;
    keywords?: string[];
  }, pagination?: {
    cursor?: string;
    limit?: number;
  }): Promise<{ influencers: InfluencerProfile[]; nextCursor: string | null }>;

  /** Add an influencer to the tenant's roster. */
  addInfluencer(input: Omit<InfluencerProfile, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'campaignCount' | 'totalPaid' | 'avgROI'>): Promise<InfluencerProfile>;

  /** Create an influencer campaign. */
  createCampaign(input: Omit<InfluencerCampaign, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'spent'>): Promise<InfluencerCampaign>;

  /** Track influencer campaign performance. */
  getCampaignPerformance(campaignId: string): Promise<InfluencerCampaign>;

  // --- UGC ---

  /** Search for UGC across platforms. */
  discoverUGC(tenantId: string, criteria: {
    hashtags?: string[];
    mentions?: string[];
    keywords?: string[];
    platforms?: SocialPlatform[];
    minEngagement?: number;
    contentType?: UGCItem['contentType'];
  }): Promise<UGCItem[]>;

  /** Request usage rights from a UGC creator. */
  requestUGCRights(ugcItemId: string, message: string): Promise<UGCItem>;

  /** Reshare approved UGC to tenant's social accounts. */
  reshareUGC(ugcItemId: string, targetAccountIds: string[], caption?: string): Promise<SocialPost>;

  // --- Social Commerce ---

  /** Create a shoppable post linking products. */
  createShoppablePost(postId: string, products: Array<{
    productId: string;
    tagPosition?: { x: number; y: number };
  }>): Promise<ShoppablePost>;

  /** Get conversion tracking data for social posts. */
  getSocialConversions(tenantId: string, period: AnalyticsPeriod): Promise<{
    totalConversions: number;
    totalRevenue: number;
    byPlatform: Record<SocialPlatform, { conversions: number; revenue: number }>;
    byPost: Array<{ postId: string; conversions: number; revenue: number }>;
  }>;

  // --- Social Proof ---

  /** Aggregate reviews from connected platforms. */
  aggregateReviews(tenantId: string): Promise<{
    avgRating: number;
    totalReviews: number;
    byPlatform: Record<string, { avgRating: number; count: number }>;
    recent: Array<{ platform: string; author: string; rating: number; text: string; date: Date }>;
  }>;

  /** Create a social proof widget for embedding. */
  createProofWidget(tenantId: string, config: {
    type: 'reviews' | 'testimonials' | 'social_count' | 'trust_badges';
    style: Record<string, unknown>;
    platforms: string[];
  }): Promise<SocialProofWidget>;

  // --- Team Collaboration ---

  /** Submit a post for approval. */
  submitForApproval(postId: string, approverIds: string[]): Promise<ApprovalRequest>;

  /** Approve or reject a post. */
  reviewApproval(approvalId: string, decision: {
    status: 'approved' | 'rejected';
    feedback?: string;
  }): Promise<ApprovalRequest>;

  /** Get pending approvals for a user. */
  getPendingApprovals(userId: string): Promise<ApprovalRequest[]>;

  /** Save/update brand voice guidelines. */
  saveBrandVoice(tenantId: string, config: BrandVoiceConfig): Promise<void>;

  /** Check content against brand voice guidelines (AI-powered). */
  checkBrandVoice(tenantId: string, content: string): Promise<{
    isCompliant: boolean;
    issues: Array<{ type: string; description: string; suggestion: string }>;
    score: number;
  }>;
}
```

### PostComposerInput

```typescript
/**
 * Input for creating or updating a social post from the composer UI.
 */
interface PostComposerInput {
  /** Tenant ID. */
  tenantId: string;

  /** Creator user ID. */
  createdBy: string;

  /** Primary text content. */
  content: string;

  /** Per-platform text overrides. */
  platformOverrides?: Partial<Record<SocialPlatform, string>>;

  /** Media attachments. */
  media?: Array<{
    fileId: string;     // @mcv/storage file ID
    altText?: string;
    sortOrder?: number;
  }>;

  /** Target account IDs to publish to. */
  targetAccountIds: string[];

  /** Hashtags (without #). */
  hashtags?: string[];

  /** Mentions (without @). */
  mentions?: string[];

  /** Link URL. */
  link?: string;

  /** UTM parameters. */
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };

  /** First comment text. */
  firstComment?: string;

  /** Whether to publish as a thread (Twitter) or carousel. */
  isThread?: boolean;

  /** Thread/carousel items. */
  threadItems?: Array<{
    content: string;
    media?: Array<{ fileId: string; altText?: string }>;
  }>;

  /** Campaign tag. */
  campaignTag?: string;

  /** Labels. */
  labels?: string[];

  /** Internal notes. */
  internalNotes?: string;

  /** Schedule time (omit for draft or immediate publish). */
  scheduledFor?: Date;

  /** Publish immediately upon creation. */
  publishNow?: boolean;

  /** Submit for approval upon creation. */
  submitForApproval?: boolean;

  /** Approver user IDs (required if submitForApproval is true). */
  approverIds?: string[];
}
```

### BulkScheduleInput

```typescript
/**
 * Input for bulk scheduling posts from CSV or structured data.
 */
interface BulkScheduleInput {
  /** CSV file ID from @mcv/storage, or inline data. */
  csvFileId?: string;

  /** Inline row data (alternative to CSV). */
  rows?: Array<{
    content: string;
    scheduledFor: string; // ISO 8601
    platforms: SocialPlatform[];
    accountIds: string[];
    hashtags?: string;    // Comma-separated
    link?: string;
    mediaFileIds?: string; // Comma-separated storage IDs
    campaignTag?: string;
  }>;

  /** Default target account IDs (used if row doesn't specify). */
  defaultAccountIds?: string[];

  /** Default campaign tag. */
  defaultCampaignTag?: string;

  /** Whether to validate only (dry run). */
  dryRun?: boolean;

  /** Time zone for interpreting schedule times. */
  timezone?: string;
}
```

### BrandVoiceConfig

```typescript
/**
 * Brand voice guidelines configuration for AI-powered content checking.
 */
interface BrandVoiceConfig {
  /** Tenant ID. */
  tenantId: string;

  /** Brand voice description (free text). */
  voiceDescription: string;

  /** Tone attributes (e.g., "professional", "friendly", "witty"). */
  toneAttributes: string[];

  /** Words/phrases to always use. */
  preferredTerms: string[];

  /** Words/phrases to never use. */
  avoidTerms: string[];

  /** Example posts that exemplify the brand voice. */
  examplePosts: Array<{
    content: string;
    platform: SocialPlatform;
    whyGood: string;
  }>;

  /** Emoji usage guidelines. */
  emojiGuidelines: 'liberal' | 'moderate' | 'minimal' | 'none';

  /** Hashtag strategy. */
  hashtagGuidelines: {
    maxPerPost: number;
    brandedHashtags: string[];
    avoidHashtags: string[];
  };

  /** Platform-specific voice adjustments. */
  platformAdjustments: Partial<Record<SocialPlatform, {
    toneShift?: string;
    lengthGuideline?: string;
    additionalRules?: string[];
  }>>;
}
```

### PlatformAdapter (Interface)

```typescript
/**
 * Interface that all platform adapters must implement.
 * Each adapter handles the specifics of one social media platform's API.
 */
interface PlatformAdapter {
  /** Platform identifier. */
  readonly platform: SocialPlatform;

  /** Platform-specific content limits. */
  readonly limits: PlatformCapability;

  /** Publish a post to the platform. */
  publish(account: SocialAccount, post: SocialPost): Promise<PublishResult>;

  /** Delete a published post from the platform. */
  deletePost(account: SocialAccount, platformPostId: string): Promise<void>;

  /** Upload media to the platform (some require pre-upload). */
  uploadMedia(account: SocialAccount, media: MediaAttachment): Promise<{
    platformMediaId: string;
    url: string;
  }>;

  /** Fetch engagement items since a given timestamp. */
  fetchEngagement(account: SocialAccount, since: Date, types: EngagementType[]): Promise<EngagementItem[]>;

  /** Send a reply to an engagement item. */
  sendReply(account: SocialAccount, item: EngagementItem, content: string): Promise<string>;

  /** Fetch analytics for the account. */
  fetchAnalytics(account: SocialAccount, startDate: Date, endDate: Date): Promise<Partial<SocialAnalytics>>;

  /** Fetch audience demographics. */
  fetchDemographics(account: SocialAccount): Promise<AudienceDemographic | null>;

  /** Fetch the account's current profile metadata. */
  fetchProfile(account: SocialAccount): Promise<Partial<SocialAccount>>;

  /** Refresh the OAuth access token. */
  refreshToken(account: SocialAccount): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  }>;

  /** Validate that the account's tokens are still valid. */
  validateConnection(account: SocialAccount): Promise<boolean>;

  /** Search for content on the platform (for UGC discovery, listening). */
  searchContent(account: SocialAccount, query: string, options?: {
    since?: Date;
    maxResults?: number;
  }): Promise<Array<{
    platformContentId: string;
    authorUsername: string;
    content: string;
    mediaUrls: string[];
    metrics: { likes: number; comments: number; shares: number };
    postedAt: Date;
    url: string;
  }>>;
}
```

### PlatformCapability

```typescript
/**
 * Describes the capabilities and limits of a social media platform.
 */
interface PlatformCapability {
  /** Platform identifier. */
  platform: SocialPlatform;

  /** Maximum text length. */
  maxTextLength: number;

  /** Maximum media attachments per post. */
  maxMediaPerPost: number;

  /** Supported media types. */
  supportedMediaTypes: string[];

  /** Maximum image dimensions. */
  maxImageDimensions: { width: number; height: number };

  /** Maximum video duration in seconds. */
  maxVideoDuration: number;

  /** Maximum file size in bytes per media item. */
  maxFileSizeBytes: number;

  /** Whether the platform supports thread/carousel posts. */
  supportsThreads: boolean;

  /** Whether the platform supports first-comment. */
  supportsFirstComment: boolean;

  /** Whether the platform supports scheduling natively. */
  supportsNativeScheduling: boolean;

  /** Whether the platform supports stories. */
  supportsStories: boolean;

  /** Whether the platform supports shoppable/product tags. */
  supportsProductTags: boolean;

  /** Whether the platform supports alt text on media. */
  supportsAltText: boolean;

  /** Whether the platform supports geographic targeting. */
  supportsGeoTargeting: boolean;

  /** API rate limits. */
  rateLimits: {
    postsPerHour: number;
    postsPerDay: number;
    requestsPerMinute: number;
  };

  /** Recommended aspect ratios for media. */
  recommendedAspectRatios: Array<{
    label: string;
    width: number;
    height: number;
  }>;
}
```

### ShoppablePost

```typescript
/**
 * A social post with product tags for social commerce.
 */
interface ShoppablePost {
  /** Unique identifier (UUID). */
  id: string;

  /** Tenant that owns this shoppable post. */
  tenantId: string;

  /** Linked social post ID. */
  postId: string;

  /** Products tagged in this post. */
  products: Array<{
    /** Product ID from the commerce module. */
    productId: string;

    /** Product name. */
    productName: string;

    /** Product price (in cents). */
    price: number;

    /** Currency code (ISO 4217). */
    currency: string;

    /** Direct link to the product page. */
    productUrl: string;

    /** Tag position on image (normalized 0.0 - 1.0). */
    tagPosition: { x: number; y: number } | null;
  }>;

  /** Storefront link (landing page with all tagged products). */
  storefrontUrl: string;

  /** Conversion tracking. */
  conversions: {
    clicks: number;
    addToCarts: number;
    purchases: number;
    revenue: number; // In cents
  };

  createdAt: Date;
  updatedAt: Date;
}
```

### SocialProofWidget

```typescript
/**
 * An embeddable social proof widget.
 */
interface SocialProofWidget {
  /** Unique identifier (UUID). */
  id: string;

  /** Tenant that owns this widget. */
  tenantId: string;

  /** Widget type. */
  type: 'reviews' | 'testimonials' | 'social_count' | 'trust_badges';

  /** Widget name/label. */
  name: string;

  /** Widget configuration. */
  config: {
    /** Platforms to pull data from. */
    platforms: string[];

    /** Visual style configuration. */
    style: {
      theme: 'light' | 'dark' | 'auto';
      primaryColor: string;
      borderRadius: number;
      showAvatars: boolean;
      showDates: boolean;
      showPlatformIcons: boolean;
      maxItems: number;
      layout: 'grid' | 'carousel' | 'list' | 'marquee';
    };

    /** Filter criteria. */
    filters: {
      minRating?: number;
      maxAge?: number; // Days
      sentiment?: SentimentLabel[];
    };

    /** Auto-update interval in minutes. */
    refreshInterval: number;
  };

  /** Generated embed code (HTML/JS snippet). */
  embedCode: string;

  /** Embed script URL. */
  embedScriptUrl: string;

  /** Whether the widget is active. */
  isActive: boolean;

  /** View count (how many times the widget has been loaded). */
  viewCount: number;

  /** Click count (interactions with the widget). */
  clickCount: number;

  createdAt: Date;
  updatedAt: Date;
}
```

### ApprovalRequest

```typescript
/**
 * Status of an approval request.
 */
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

/**
 * An approval request for a social post, requiring review before publishing.
 */
interface ApprovalRequest {
  /** Unique identifier (UUID). */
  id: string;

  /** Tenant ID. */
  tenantId: string;

  /** Social post ID being reviewed. */
  postId: string;

  /** User who submitted the post for approval. */
  submittedBy: string;

  /** Users who need to approve. */
  approvers: Array<{
    userId: string;
    status: ApprovalStatus;
    feedback: string | null;
    respondedAt: Date | null;
  }>;

  /** Overall approval status (approved only if all approvers approve). */
  overallStatus: ApprovalStatus;

  /** Whether any single approval is sufficient (vs. all required). */
  requireAll: boolean;

  /** Expiry time for the approval request. */
  expiresAt: Date | null;

  /** Timestamp of submission. */
  submittedAt: Date;

  /** Timestamp of final resolution. */
  resolvedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
```

### ContentLibraryItem

```typescript
/**
 * A reusable content template stored in the team's content library.
 */
interface ContentLibraryItem {
  /** Unique identifier (UUID). */
  id: string;

  /** Tenant that owns this item. */
  tenantId: string;

  /** Item name / title. */
  name: string;

  /** Description of when/how to use this content. */
  description: string | null;

  /** Content text (may include placeholders like {{product_name}}). */
  content: string;

  /** Per-platform variants. */
  platformVariants: Partial<Record<SocialPlatform, string>>;

  /** Associated media (storage file IDs). */
  mediaFileIds: string[];

  /** Suggested hashtags. */
  hashtags: string[];

  /** Category for organization. */
  category: string;

  /** Tags for filtering. */
  tags: string[];

  /** Number of times this item has been used to create a post. */
  usageCount: number;

  /** Performance score based on posts created from this template. */
  performanceScore: number | null;

  /** User who created this item. */
  createdBy: string;

  /** Whether this item is archived. */
  isArchived: boolean;

  createdAt: Date;
  updatedAt: Date;
}
```

---

## Database Schemas

All tables use Supabase PostgreSQL with Row-Level Security (RLS) policies that enforce tenant isolation. Every table includes `tenant_id` as a mandatory column, and RLS policies ensure that queries can only access rows matching the authenticated user's tenant.

### social_accounts

```typescript
import { pgTable, uuid, text, boolean, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  connectedBy: uuid('connected_by').notNull().references(() => users.id),
  platform: text('platform').notNull(), // 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube'
  platformAccountId: text('platform_account_id').notNull(),
  platformUsername: text('platform_username').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  followerCount: integer('follower_count').notNull().default(0),
  followingCount: integer('following_count').notNull().default(0),
  isVerified: boolean('is_verified').notNull().default(false),
  accessToken: text('access_token').notNull(), // Encrypted at rest via Supabase Vault
  refreshToken: text('refresh_token'),          // Encrypted at rest
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  scopes: jsonb('scopes').notNull().default([]),
  platformMeta: jsonb('platform_meta').notNull().default({}),
  isActive: boolean('is_active').notNull().default(true),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  deactivationReason: text('deactivation_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantPlatformIdx: index('idx_social_accounts_tenant_platform').on(table.tenantId, table.platform),
  platformAccountIdx: uniqueIndex('idx_social_accounts_platform_account').on(table.tenantId, table.platform, table.platformAccountId),
}));
```

**RLS Policy:**
```sql
CREATE POLICY "social_accounts_tenant_isolation" ON social_accounts
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### social_posts

```typescript
export const socialPosts = pgTable('social_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  status: text('status').notNull().default('draft'),
  content: text('content').notNull(),
  platformOverrides: jsonb('platform_overrides').notNull().default({}),
  media: jsonb('media').notNull().default([]),
  targetAccountIds: jsonb('target_account_ids').notNull().default([]),
  hashtags: jsonb('hashtags').notNull().default([]),
  mentions: jsonb('mentions').notNull().default([]),
  link: text('link'),
  linkPreview: jsonb('link_preview'),
  utmParams: jsonb('utm_params'),
  firstComment: text('first_comment'),
  geoTargeting: jsonb('geo_targeting'),
  isThread: boolean('is_thread').notNull().default(false),
  threadItems: jsonb('thread_items').notNull().default([]),
  contentLibraryItemId: uuid('content_library_item_id'),
  campaignTag: text('campaign_tag'),
  labels: jsonb('labels').notNull().default([]),
  internalNotes: text('internal_notes'),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  publishResults: jsonb('publish_results').notNull().default({}),
  approvalId: uuid('approval_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantStatusIdx: index('idx_social_posts_tenant_status').on(table.tenantId, table.status),
  tenantScheduledIdx: index('idx_social_posts_tenant_scheduled').on(table.tenantId, table.scheduledFor),
  tenantCampaignIdx: index('idx_social_posts_tenant_campaign').on(table.tenantId, table.campaignTag),
  tenantCreatedIdx: index('idx_social_posts_tenant_created').on(table.tenantId, table.createdAt),
}));
```

### post_schedule

```typescript
export const postSchedule = pgTable('post_schedule', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => socialPosts.id, { onDelete: 'cascade' }),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  status: text('status').notNull().default('pending'), // 'pending' | 'processing' | 'published' | 'failed' | 'cancelled'
  retryCount: integer('retry_count').notNull().default(0),
  lastError: text('last_error'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pendingScheduleIdx: index('idx_post_schedule_pending').on(table.status, table.scheduledFor),
  tenantScheduleIdx: index('idx_post_schedule_tenant').on(table.tenantId, table.scheduledFor),
}));
```

### engagement_items

```typescript
export const engagementItems = pgTable('engagement_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  type: text('type').notNull(),
  platformEngagementId: text('platform_engagement_id').notNull(),
  authorUsername: text('author_username').notNull(),
  authorDisplayName: text('author_display_name').notNull(),
  authorAvatarUrl: text('author_avatar_url'),
  authorFollowerCount: integer('author_follower_count'),
  authorIsVerified: boolean('author_is_verified').notNull().default(false),
  content: text('content'),
  media: jsonb('media').notNull().default([]),
  relatedPostId: uuid('related_post_id'),
  platformParentId: text('platform_parent_id'),
  engagementUrl: text('engagement_url'),
  sentiment: text('sentiment').notNull().default('neutral'),
  sentimentScore: real('sentiment_score').notNull().default(0.5),
  autoTags: jsonb('auto_tags').notNull().default([]),
  manualTags: jsonb('manual_tags').notNull().default([]),
  assignedTo: uuid('assigned_to'),
  isRead: boolean('is_read').notNull().default(false),
  isResolved: boolean('is_resolved').notNull().default(false),
  isReplied: boolean('is_replied').notNull().default(false),
  replyItemId: uuid('reply_item_id'),
  priority: text('priority').notNull().default('medium'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantInboxIdx: index('idx_engagement_tenant_inbox').on(table.tenantId, table.isResolved, table.occurredAt),
  tenantPlatformIdx: index('idx_engagement_tenant_platform').on(table.tenantId, table.platform),
  tenantSentimentIdx: index('idx_engagement_tenant_sentiment').on(table.tenantId, table.sentiment),
  platformDedupeIdx: uniqueIndex('idx_engagement_platform_dedupe').on(table.accountId, table.platformEngagementId),
  tenantAssignedIdx: index('idx_engagement_tenant_assigned').on(table.tenantId, table.assignedTo, table.isResolved),
}));
```

### social_listeners

```typescript
export const socialListeners = pgTable('social_listeners', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'keyword' | 'hashtag' | 'competitor' | 'brand' | 'industry'
  keywords: jsonb('keywords').notNull().default([]),
  hashtags: jsonb('hashtags').notNull().default([]),
  trackedHandles: jsonb('tracked_handles').notNull().default([]),
  platforms: jsonb('platforms').notNull().default([]),
  languages: jsonb('languages').notNull().default([]),
  countries: jsonb('countries').notNull().default([]),
  minFollowerCount: integer('min_follower_count').notNull().default(0),
  sentimentFilter: jsonb('sentiment_filter').notNull().default([]),
  alertEnabled: boolean('alert_enabled').notNull().default(false),
  alertChannels: jsonb('alert_channels').notNull().default([]),
  volumeSpikeThreshold: integer('volume_spike_threshold'),
  isActive: boolean('is_active').notNull().default(true),
  lastScanAt: timestamp('last_scan_at', { withTimezone: true }),
  totalMentions: integer('total_mentions').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantActiveIdx: index('idx_listeners_tenant_active').on(table.tenantId, table.isActive),
}));
```

### listener_mentions

```typescript
export const listenerMentions = pgTable('listener_mentions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  listenerId: uuid('listener_id').notNull().references(() => socialListeners.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  platformContentId: text('platform_content_id').notNull(),
  sourceUrl: text('source_url').notNull(),
  authorUsername: text('author_username').notNull(),
  authorDisplayName: text('author_display_name').notNull(),
  authorFollowerCount: integer('author_follower_count'),
  content: text('content').notNull(),
  matchedKeywords: jsonb('matched_keywords').notNull().default([]),
  sentiment: text('sentiment').notNull().default('neutral'),
  sentimentScore: real('sentiment_score').notNull().default(0.5),
  estimatedReach: integer('estimated_reach'),
  engagementMetrics: jsonb('engagement_metrics').notNull().default({ likes: 0, shares: 0, comments: 0 }),
  entities: jsonb('entities').notNull().default([]),
  isReviewed: boolean('is_reviewed').notNull().default(false),
  alertTriggered: boolean('alert_triggered').notNull().default(false),
  mentionedAt: timestamp('mentioned_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantListenerIdx: index('idx_mentions_tenant_listener').on(table.tenantId, table.listenerId, table.mentionedAt),
  platformDedupeIdx: uniqueIndex('idx_mentions_platform_dedupe').on(table.listenerId, table.platformContentId),
  tenantSentimentIdx: index('idx_mentions_tenant_sentiment').on(table.tenantId, table.sentiment),
}));
```

### influencers

```typescript
export const influencers = pgTable('influencers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  niche: text('niche').notNull(),
  subNiches: jsonb('sub_niches').notNull().default([]),
  socialProfiles: jsonb('social_profiles').notNull().default([]),
  totalReach: integer('total_reach').notNull().default(0),
  avgEngagementRate: real('avg_engagement_rate').notNull().default(0),
  tier: text('tier').notNull().default('nano'),
  audienceDemographics: jsonb('audience_demographics'),
  contentQualityScore: real('content_quality_score'),
  brandSafetyScore: real('brand_safety_score'),
  estimatedCostPerPost: integer('estimated_cost_per_post'),
  relationshipStatus: text('relationship_status').notNull().default('discovered'),
  notes: text('notes'),
  tags: jsonb('tags').notNull().default([]),
  campaignCount: integer('campaign_count').notNull().default(0),
  totalPaid: integer('total_paid').notNull().default(0),
  avgROI: real('avg_roi'),
  lastOutreachAt: timestamp('last_outreach_at', { withTimezone: true }),
  lastResponseAt: timestamp('last_response_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantNicheIdx: index('idx_influencers_tenant_niche').on(table.tenantId, table.niche),
  tenantTierIdx: index('idx_influencers_tenant_tier').on(table.tenantId, table.tier),
  tenantStatusIdx: index('idx_influencers_tenant_status').on(table.tenantId, table.relationshipStatus),
}));
```

### influencer_campaigns

```typescript
export const influencerCampaigns = pgTable('influencer_campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  budget: integer('budget').notNull(),
  spent: integer('spent').notNull().default(0),
  status: text('status').notNull().default('draft'),
  goals: jsonb('goals').notNull().default([]),
  participants: jsonb('participants').notNull().default([]),
  utmParams: jsonb('utm_params').notNull().default({}),
  requiredHashtags: jsonb('required_hashtags').notNull().default([]),
  disclosureText: text('disclosure_text').notNull().default('#ad'),
  trackingLinks: jsonb('tracking_links').notNull().default([]),
  briefUrl: text('brief_url'),
  tags: jsonb('tags').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantStatusIdx: index('idx_campaigns_tenant_status').on(table.tenantId, table.status),
  tenantDateIdx: index('idx_campaigns_tenant_date').on(table.tenantId, table.startDate),
}));
```

### ugc_items

```typescript
export const ugcItems = pgTable('ugc_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  platformContentId: text('platform_content_id').notNull(),
  sourceUrl: text('source_url').notNull(),
  contentType: text('content_type').notNull(),
  caption: text('caption'),
  mediaUrls: jsonb('media_urls').notNull().default([]),
  cachedMediaUrls: jsonb('cached_media_urls').notNull().default([]),
  creatorUsername: text('creator_username').notNull(),
  creatorDisplayName: text('creator_display_name').notNull(),
  creatorFollowerCount: integer('creator_follower_count'),
  creatorProfileUrl: text('creator_profile_url').notNull(),
  metrics: jsonb('metrics').notNull().default({ likes: 0, comments: 0, shares: 0, views: null }),
  discoveryMethod: text('discovery_method').notNull(),
  discoverySource: text('discovery_source').notNull(),
  qualityScore: real('quality_score'),
  relevanceScore: real('relevance_score'),
  brandSafe: boolean('brand_safe').notNull().default(true),
  rightsStatus: text('rights_status').notNull().default('pending'),
  rightsRequestedAt: timestamp('rights_requested_at', { withTimezone: true }),
  rightsRespondedAt: timestamp('rights_responded_at', { withTimezone: true }),
  rightsExpiresAt: timestamp('rights_expires_at', { withTimezone: true }),
  rightsRequestMessage: text('rights_request_message'),
  isReshared: boolean('is_reshared').notNull().default(false),
  resharedPostId: uuid('reshared_post_id'),
  isStarred: boolean('is_starred').notNull().default(false),
  tags: jsonb('tags').notNull().default([]),
  notes: text('notes'),
  postedAt: timestamp('posted_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantRightsIdx: index('idx_ugc_tenant_rights').on(table.tenantId, table.rightsStatus),
  tenantPlatformIdx: index('idx_ugc_tenant_platform').on(table.tenantId, table.platform),
  platformDedupeIdx: uniqueIndex('idx_ugc_platform_dedupe').on(table.tenantId, table.platform, table.platformContentId),
}));
```

### social_analytics

```typescript
export const socialAnalytics = pgTable('social_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  granularity: text('granularity').notNull(), // 'hour' | 'day' | 'week' | 'month'
  followerCount: integer('follower_count').notNull().default(0),
  followerChange: integer('follower_change').notNull().default(0),
  followingCount: integer('following_count').notNull().default(0),
  postsPublished: integer('posts_published').notNull().default(0),
  impressions: integer('impressions').notNull().default(0),
  reach: integer('reach').notNull().default(0),
  engagements: integer('engagements').notNull().default(0),
  engagementRate: real('engagement_rate').notNull().default(0),
  engagementBreakdown: jsonb('engagement_breakdown').notNull().default({
    likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, videoViews: 0, profileVisits: 0,
  }),
  linkClicks: integer('link_clicks').notNull().default(0),
  clickThroughRate: real('click_through_rate').notNull().default(0),
  avgEngagementPerPost: real('avg_engagement_per_post').notNull().default(0),
  topPostId: uuid('top_post_id'),
  demographics: jsonb('demographics'),
  optimalPostingTimes: jsonb('optimal_posting_times').notNull().default([]),
  topHashtags: jsonb('top_hashtags').notNull().default([]),
  contentTypePerformance: jsonb('content_type_performance').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  accountPeriodIdx: uniqueIndex('idx_analytics_account_period').on(table.accountId, table.granularity, table.periodStart),
  tenantPeriodIdx: index('idx_analytics_tenant_period').on(table.tenantId, table.periodStart),
  tenantPlatformPeriodIdx: index('idx_analytics_tenant_platform_period').on(table.tenantId, table.platform, table.periodStart),
}));
```

### content_library

```typescript
export const contentLibrary = pgTable('content_library', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  content: text('content').notNull(),
  platformVariants: jsonb('platform_variants').notNull().default({}),
  mediaFileIds: jsonb('media_file_ids').notNull().default([]),
  hashtags: jsonb('hashtags').notNull().default([]),
  category: text('category').notNull().default('general'),
  tags: jsonb('tags').notNull().default([]),
  usageCount: integer('usage_count').notNull().default(0),
  performanceScore: real('performance_score'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantCategoryIdx: index('idx_content_library_tenant_category').on(table.tenantId, table.category),
  tenantArchivedIdx: index('idx_content_library_tenant_archived').on(table.tenantId, table.isArchived),
}));
```

### approval_requests

```typescript
export const approvalRequests = pgTable('approval_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => socialPosts.id, { onDelete: 'cascade' }),
  submittedBy: uuid('submitted_by').notNull().references(() => users.id),
  approvers: jsonb('approvers').notNull().default([]),
  overallStatus: text('overall_status').notNull().default('pending'),
  requireAll: boolean('require_all').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantStatusIdx: index('idx_approvals_tenant_status').on(table.tenantId, table.overallStatus),
  postIdx: index('idx_approvals_post').on(table.postId),
}));
```

### Additional Tables

```typescript
export const shoppablePosts = pgTable('shoppable_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => socialPosts.id, { onDelete: 'cascade' }),
  products: jsonb('products').notNull().default([]),
  storefrontUrl: text('storefront_url').notNull(),
  conversions: jsonb('conversions').notNull().default({ clicks: 0, addToCarts: 0, purchases: 0, revenue: 0 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_shoppable_posts_tenant').on(table.tenantId),
  postIdx: uniqueIndex('idx_shoppable_posts_post').on(table.postId),
}));

export const socialProofWidgets = pgTable('social_proof_widgets', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  name: text('name').notNull(),
  config: jsonb('config').notNull().default({}),
  embedCode: text('embed_code').notNull(),
  embedScriptUrl: text('embed_script_url').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  viewCount: integer('view_count').notNull().default(0),
  clickCount: integer('click_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_social_proof_widgets_tenant').on(table.tenantId),
}));

export const brandVoiceConfigs = pgTable('brand_voice_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }).unique(),
  voiceDescription: text('voice_description').notNull(),
  toneAttributes: jsonb('tone_attributes').notNull().default([]),
  preferredTerms: jsonb('preferred_terms').notNull().default([]),
  avoidTerms: jsonb('avoid_terms').notNull().default([]),
  examplePosts: jsonb('example_posts').notNull().default([]),
  emojiGuidelines: text('emoji_guidelines').notNull().default('moderate'),
  hashtagGuidelines: jsonb('hashtag_guidelines').notNull().default({ maxPerPost: 5, brandedHashtags: [], avoidHashtags: [] }),
  platformAdjustments: jsonb('platform_adjustments').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## Code Examples

### Example 1: Connect a Social Account via OAuth

```typescript
import { SocialService } from '@mcv/growth/social';

// After user completes OAuth flow and we receive the authorization code
const account = await socialService.connectAccount({
  tenantId: ctx.tenantId,
  platform: 'twitter',
  oauthCode: 'abc123_oauth_code_from_twitter',
  redirectUri: 'https://app.mcv.one/social/callback/twitter',
});

console.log(`Connected @${account.platformUsername} (${account.followerCount} followers)`);
// → Connected @mcv_one (12,450 followers)

// The account is immediately available for publishing
const accounts = await socialService.listAccounts(ctx.tenantId, {
  platform: 'twitter',
  isActive: true,
});
console.log(`${accounts.length} active Twitter accounts`);
```

**What happens under the hood:**

1. The `TwitterAdapter` exchanges the OAuth code for access + refresh tokens
2. Tokens are encrypted via Supabase Vault before storage
3. Profile metadata (username, avatar, follower count) is fetched and cached
4. A background job is queued to perform initial analytics sync
5. Webhook subscriptions are set up for real-time engagement (platform-dependent)

### Example 2: Compose and Publish a Multi-Platform Post

```typescript
import { SocialService } from '@mcv/growth/social';

// Create a post targeting Twitter and LinkedIn with platform-specific text
const post = await socialService.createPost({
  tenantId: ctx.tenantId,
  createdBy: ctx.userId,
  content: 'Excited to announce our new feature! 🚀 Check it out at mcv.one/new',
  platformOverrides: {
    twitter: '🚀 New feature alert! Check it out → mcv.one/new #SaaS #NoCode',
    linkedin: `I'm thrilled to share that we've just launched a game-changing new feature at MCV.ONE.\n\nThis has been months in the making, and I can't wait for you to try it.\n\nLearn more: mcv.one/new\n\n#SaaS #ProductLaunch #NoCode`,
  },
  targetAccountIds: [twitterAccountId, linkedinAccountId],
  media: [
    {
      fileId: 'storage-file-id-123',
      altText: 'Screenshot of the new feature dashboard',
      sortOrder: 0,
    },
  ],
  hashtags: ['SaaS', 'NoCode', 'ProductLaunch'],
  link: 'https://mcv.one/new',
  utmParams: {
    source: 'social',
    medium: 'organic',
    campaign: 'feature-launch-2026',
  },
  firstComment: 'Thread: Here are 5 things you can do with this feature 👇',
  campaignTag: 'feature-launch-2026',
  labels: ['announcement', 'product'],
  publishNow: true,
});

console.log(`Post ${post.id} status: ${post.status}`);
// → Post abc-123 status: publishing

// Check results after publishing completes
const published = await socialService.getPost(ctx.tenantId, post.id);
for (const [accountId, result] of Object.entries(published.publishResults)) {
  console.log(`${result.platform}: ${result.success ? result.postUrl : result.error}`);
}
// → twitter: https://twitter.com/mcv_one/status/123456789
// → linkedin: https://linkedin.com/feed/update/urn:li:activity:987654321
```

### Example 3: Schedule Posts with Optimal Time Suggestions

```typescript
import { SocialService, ScheduleService } from '@mcv/growth/social';

// Get AI-recommended optimal times for a specific account
const optimalTimes = await socialService.getOptimalPostingTimes(twitterAccountId);

console.log('Best times to post on Twitter:');
for (const slot of optimalTimes.slice(0, 5)) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  console.log(
    `  ${days[slot.dayOfWeek]} ${slot.hourUtc}:00 UTC — ` +
    `Expected engagement: ${(slot.expectedEngagementRate * 100).toFixed(1)}% ` +
    `(confidence: ${(slot.confidence * 100).toFixed(0)}%, ${slot.dataPoints} data points)`
  );
}
// → Best times to post on Twitter:
// →   Tue 14:00 UTC — Expected engagement: 4.2% (confidence: 92%, 156 data points)
// →   Wed 17:00 UTC — Expected engagement: 3.8% (confidence: 88%, 142 data points)
// →   Thu 13:00 UTC — Expected engagement: 3.6% (confidence: 85%, 138 data points)

// Schedule a post for the best time
const nextTuesday = getNextDayOfWeek(2); // Helper to get next Tuesday
const scheduledTime = new Date(nextTuesday);
scheduledTime.setUTCHours(14, 0, 0, 0);

const post = await socialService.createPost({
  tenantId: ctx.tenantId,
  createdBy: ctx.userId,
  content: 'Weekly tip: Always test your social posts on mobile before publishing! 📱',
  targetAccountIds: [twitterAccountId],
  scheduledFor: scheduledTime,
  campaignTag: 'weekly-tips',
});

console.log(`Post scheduled for ${post.scheduledFor?.toISOString()}`);
// → Post scheduled for 2026-02-10T14:00:00.000Z
```

### Example 4: Bulk Schedule from CSV

```typescript
import { SocialService } from '@mcv/growth/social';

// Bulk schedule posts from structured data (could also use CSV file)
const result = await socialService.bulkSchedule(ctx.tenantId, {
  rows: [
    {
      content: 'Monday motivation: Start your week strong! 💪',
      scheduledFor: '2026-02-09T14:00:00Z',
      platforms: ['twitter', 'instagram'],
      accountIds: [twitterAccountId, instagramAccountId],
      hashtags: 'MondayMotivation,StartupLife',
      campaignTag: 'weekly-content',
    },
    {
      content: 'Tech Tuesday: 3 tools every founder should know about',
      scheduledFor: '2026-02-10T15:00:00Z',
      platforms: ['twitter', 'linkedin'],
      accountIds: [twitterAccountId, linkedinAccountId],
      hashtags: 'TechTuesday,FounderTools',
      link: 'https://mcv.one/blog/founder-tools',
      campaignTag: 'weekly-content',
    },
    {
      content: 'Behind the scenes: Our team working on the next big update 🔧',
      scheduledFor: '2026-02-12T17:00:00Z',
      platforms: ['instagram', 'tiktok'],
      accountIds: [instagramAccountId, tiktokAccountId],
      mediaFileIds: 'storage-bts-video-001',
      campaignTag: 'weekly-content',
    },
  ],
  defaultAccountIds: [twitterAccountId],
  defaultCampaignTag: 'weekly-content',
  timezone: 'America/Toronto',
});

console.log(`Created ${result.created} scheduled posts`);
if (result.errors.length > 0) {
  for (const err of result.errors) {
    console.error(`Row ${err.row}: ${err.error}`);
  }
}
// → Created 3 scheduled posts
```

### Example 5: Monitor Engagement Inbox with Real-Time Updates

```typescript
import { EngagementService, useEngagementInbox } from '@mcv/growth/social';
import { createClient } from '@supabase/supabase-js';

// Server-side: Fetch engagement inbox
const inbox = await socialService.getEngagementInbox(ctx.tenantId, {
  isResolved: false,
  sentiment: ['negative', 'mixed'],
  priority: ['high', 'urgent'],
}, {
  limit: 20,
});

console.log(`${inbox.unreadCount} unread items, ${inbox.items.length} shown`);

for (const item of inbox.items) {
  console.log(
    `[${item.priority.toUpperCase()}] ${item.platform} ${item.type} from @${item.authorUsername}: ` +
    `"${item.content?.slice(0, 80)}..." (sentiment: ${item.sentiment})`
  );
}

// Reply to a high-priority item
const negativeComment = inbox.items.find(i => i.sentiment === 'negative' && i.type === 'comment');
if (negativeComment) {
  await socialService.replyToEngagement(negativeComment.id, {
    content: "We're sorry to hear about your experience. Could you DM us the details so we can help? 🙏",
  });
  await socialService.resolveEngagement([negativeComment.id]);
}

// Client-side: Real-time inbox with React hook
function EngagementInboxComponent() {
  const { items, unreadCount, isLoading, markAsRead, reply } = useEngagementInbox({
    filters: { isResolved: false },
    realtime: true, // Subscribe to Supabase Realtime for live updates
  });

  return (
    <div>
      <h2>Inbox ({unreadCount} unread)</h2>
      {items.map(item => (
        <EngagementCard
          key={item.id}
          item={item}
          onRead={() => markAsRead([item.id])}
          onReply={(text) => reply(item.id, { content: text })}
        />
      ))}
    </div>
  );
}
```

### Example 6: Social Listening and Trend Detection

```typescript
import { SocialService } from '@mcv/growth/social';

// Create a brand listener
const brandListener = await socialService.createListener({
  name: 'Brand Mentions',
  description: 'Track all mentions of MCV.ONE across platforms',
  type: 'brand',
  keywords: ['mcv.one', 'mcv one', 'MCV ONE', 'mcvone'],
  hashtags: ['mcvone', 'mcv'],
  trackedHandles: [],
  platforms: ['twitter', 'linkedin'],
  languages: ['en'],
  countries: [],
  minFollowerCount: 100,
  sentimentFilter: [],
  alertEnabled: true,
  alertChannels: [
    { type: 'in_app', target: 'social-team' },
    { type: 'slack', target: '#social-alerts' },
    { type: 'email', target: 'social@mcv.one' },
  ],
  volumeSpikeThreshold: 50, // Alert if > 50 mentions/hour
  isActive: true,
});

// Create a competitor listener
const competitorListener = await socialService.createListener({
  name: 'Competitor Tracking',
  description: 'Monitor competitor mentions and activity',
  type: 'competitor',
  keywords: ['competitorA', 'competitorB'],
  hashtags: [],
  trackedHandles: ['@competitorA', '@competitorB'],
  platforms: ['twitter', 'linkedin'],
  languages: [],
  countries: [],
  minFollowerCount: 0,
  sentimentFilter: ['negative'], // Only capture negative mentions of competitors
  alertEnabled: true,
  alertChannels: [
    { type: 'in_app', target: 'growth-team' },
  ],
  volumeSpikeThreshold: null,
  isActive: true,
});

// Fetch recent mentions
const mentions = await socialService.getListenerMentions(brandListener.id, {
  sentiment: ['positive'],
  minReach: 1000,
}, { limit: 10 });

for (const mention of mentions.mentions) {
  console.log(
    `@${mention.authorUsername} (${mention.authorFollowerCount} followers): ` +
    `"${mention.content.slice(0, 100)}..." — Reach: ~${mention.estimatedReach}`
  );
}

// Get trending topics
const trends = await socialService.getTrendingTopics(ctx.tenantId, {
  platforms: ['twitter'],
  timeRange: '24h',
});

console.log('Trending in your space:');
for (const trend of trends.slice(0, 5)) {
  console.log(`  ${trend.topic}: ${trend.volume} mentions (${trend.sentimentBreakdown})`);
}
```

### Example 7: Influencer Campaign Management

```typescript
import { SocialService } from '@mcv/growth/social';

// Discover influencers in the SaaS niche
const discovery = await socialService.searchInfluencers(ctx.tenantId, {
  niche: 'tech',
  platforms: ['twitter', 'youtube'],
  tier: 'micro', // 10K-100K followers
  minEngagementRate: 0.03, // At least 3% engagement
  keywords: ['SaaS', 'productivity', 'no-code'],
});

console.log(`Found ${discovery.influencers.length} matching influencers`);

// Add a promising influencer to our roster
const influencer = await socialService.addInfluencer({
  name: 'Sarah Tech Reviews',
  email: 'sarah@techreviews.com',
  avatarUrl: 'https://example.com/sarah.jpg',
  bio: 'Tech reviewer and SaaS enthusiast. 50K subscribers on YouTube.',
  niche: 'tech',
  subNiches: ['SaaS', 'productivity', 'no-code'],
  socialProfiles: [
    {
      platform: 'twitter',
      username: 'sarahtechreviews',
      profileUrl: 'https://twitter.com/sarahtechreviews',
      followerCount: 28000,
      engagementRate: 0.042,
      isVerified: false,
      lastUpdated: new Date(),
    },
    {
      platform: 'youtube',
      username: 'SarahTechReviews',
      profileUrl: 'https://youtube.com/@SarahTechReviews',
      followerCount: 52000,
      engagementRate: 0.065,
      isVerified: false,
      lastUpdated: new Date(),
    },
  ],
  totalReach: 80000,
  avgEngagementRate: 0.054,
  tier: 'micro',
  audienceDemographics: null,
  contentQualityScore: 0.82,
  brandSafetyScore: 0.95,
  estimatedCostPerPost: 50000, // $500 in cents
  relationshipStatus: 'discovered',
  notes: 'Found via SaaS keyword search. Strong YouTube presence.',
  tags: ['saas', 'youtube', 'micro'],
  lastOutreachAt: null,
  lastResponseAt: null,
});

// Create an influencer campaign
const campaign = await socialService.createCampaign({
  name: 'Q1 2026 Product Launch',
  description: 'Promote new feature launch with micro-influencers in the SaaS space',
  startDate: new Date('2026-02-15'),
  endDate: new Date('2026-03-15'),
  budget: 500000, // $5,000 in cents
  status: 'draft',
  goals: [
    { type: 'awareness', target: 100000, current: 0, metric: 'impressions' },
    { type: 'traffic', target: 2000, current: 0, metric: 'clicks' },
    { type: 'conversions', target: 50, current: 0, metric: 'signups' },
  ],
  participants: [
    {
      influencerId: influencer.id,
      status: 'invited',
      agreedRate: 50000,
      deliverables: [
        { type: 'video', platform: 'youtube', quantity: 1, delivered: 0, platformPostIds: [] },
        { type: 'thread', platform: 'twitter', quantity: 2, delivered: 0, platformPostIds: [] },
      ],
      totalPaid: 0,
      performance: { impressions: 0, engagements: 0, clicks: 0, conversions: 0 },
    },
  ],
  utmParams: {
    source: 'influencer',
    medium: 'social',
    campaign: 'q1-2026-launch',
  },
  requiredHashtags: ['mcvone', 'ProductLaunch'],
  disclosureText: '#ad #sponsored',
  trackingLinks: [
    {
      url: 'https://mcv.one/new?ref=sarah',
      shortUrl: 'https://mcv.link/sarah',
      influencerId: influencer.id,
      clicks: 0,
      conversions: 0,
    },
  ],
  briefUrl: 'https://storage.mcv.one/briefs/q1-launch-brief.pdf',
  tags: ['q1-2026', 'product-launch'],
});

console.log(`Campaign "${campaign.name}" created (budget: $${campaign.budget / 100})`);
// → Campaign "Q1 2026 Product Launch" created (budget: $5000)
```

### Example 8: UGC Discovery and Rights Management

```typescript
import { SocialService } from '@mcv/growth/social';

// Discover user-generated content mentioning our brand
const ugcItems = await socialService.discoverUGC(ctx.tenantId, {
  hashtags: ['mcvone', 'builtWithMCV'],
  mentions: ['mcv_one'],
  platforms: ['instagram', 'twitter', 'tiktok'],
  minEngagement: 50,
  contentType: 'image',
});

console.log(`Discovered ${ugcItems.length} UGC items`);

// Filter for high-quality, brand-safe content
const topUGC = ugcItems
  .filter(item => item.brandSafe && (item.qualityScore ?? 0) > 0.7)
  .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
  .slice(0, 10);

for (const item of topUGC) {
  console.log(
    `@${item.creatorUsername} on ${item.platform}: ` +
    `"${item.caption?.slice(0, 60)}..." ` +
    `(${item.metrics.likes} likes, quality: ${item.qualityScore})`
  );
}

// Request usage rights from the top creator
const bestUGC = topUGC[0];
const withRights = await socialService.requestUGCRights(
  bestUGC.id,
  `Hi @${bestUGC.creatorUsername}! 👋 We love your post about MCV.ONE! ` +
  `Would you be okay with us resharing it on our official channels? ` +
  `We'll credit you of course! Reply YES to grant permission. 🙏`
);

console.log(`Rights request sent. Status: ${withRights.rightsStatus}`);
// → Rights request sent. Status: requested

// Later, after creator approves...
// Reshare approved UGC to our Instagram and Twitter accounts
if (withRights.rightsStatus === 'approved') {
  const resharedPost = await socialService.reshareUGC(
    withRights.id,
    [instagramAccountId, twitterAccountId],
    `Love seeing what our community builds! 🎉 Amazing work by @${withRights.creatorUsername}. ` +
    `#mcvone #community #UGC`
  );

  console.log(`Reshared as post ${resharedPost.id}`);
}
```

---

## Error Codes

All errors from `@mcv/growth/social` follow the MCV error convention with the `SOCIAL_` prefix. Errors are thrown as `McvError` instances with machine-readable codes.

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `SOCIAL_ACCOUNT_NOT_FOUND` | 404 | The specified social account does not exist or is not accessible by the current tenant. | Verify the account ID and tenant context. |
| `SOCIAL_ACCOUNT_INACTIVE` | 400 | The target social account is deactivated and cannot be used for publishing. | Reactivate the account or choose a different one. |
| `SOCIAL_ACCOUNT_DUPLICATE` | 409 | This platform account is already connected to the tenant. | Use the existing connection or disconnect first. |
| `SOCIAL_TOKEN_EXPIRED` | 401 | OAuth token has expired and automatic refresh failed. | User must re-authenticate via OAuth flow. |
| `SOCIAL_TOKEN_REVOKED` | 401 | OAuth access was revoked by the user on the platform side. | User must re-authorize the application on the platform. |
| `SOCIAL_INSUFFICIENT_SCOPES` | 403 | The connected account does not have the required OAuth scopes for this operation. | Reconnect with additional scopes. |
| `SOCIAL_POST_NOT_FOUND` | 404 | The specified post does not exist or is not accessible. | Verify the post ID and tenant context. |
| `SOCIAL_POST_ALREADY_PUBLISHED` | 400 | Cannot modify a post that has already been published. | Create a new post instead. |
| `SOCIAL_POST_CONTENT_EMPTY` | 400 | Post content is empty. At least text or media is required. | Add content text or media attachments. |
| `SOCIAL_POST_TEXT_TOO_LONG` | 400 | Post text exceeds the platform's character limit. | Shorten the text or use platform overrides. |
| `SOCIAL_POST_MEDIA_INVALID` | 400 | Media attachment is invalid (unsupported format, too large, wrong dimensions). | Check media against platform requirements. |
| `SOCIAL_POST_MEDIA_LIMIT` | 400 | Too many media attachments for the target platform. | Reduce the number of attachments. |
| `SOCIAL_POST_SCHEDULE_PAST` | 400 | Cannot schedule a post for a time in the past. | Choose a future date/time. |
| `SOCIAL_PUBLISH_FAILED` | 502 | The platform API rejected the publish request after all retries. | Check the error detail for platform-specific reason. |
| `SOCIAL_PUBLISH_RATE_LIMITED` | 429 | Publishing rate limit reached for this account/platform. | Wait and retry, or schedule for later. |
| `SOCIAL_PUBLISH_DUPLICATE` | 409 | Duplicate content detected — the same content was recently published to this account. | Modify the content or wait before reposting. |
| `SOCIAL_ENGAGEMENT_NOT_FOUND` | 404 | The specified engagement item does not exist. | Verify the engagement item ID. |
| `SOCIAL_REPLY_FAILED` | 502 | Failed to send reply via the platform API. | Check platform status and retry. |
| `SOCIAL_LISTENER_NOT_FOUND` | 404 | The specified social listener does not exist. | Verify the listener ID. |
| `SOCIAL_LISTENER_LIMIT_REACHED` | 403 | Maximum number of listeners reached for this tenant's plan. | Upgrade plan or delete unused listeners. |
| `SOCIAL_LISTENER_KEYWORD_INVALID` | 400 | Listener keyword contains invalid characters or is too short. | Use alphanumeric keywords of at least 2 characters. |
| `SOCIAL_ANALYTICS_NO_DATA` | 404 | No analytics data available for the specified account/period. | Ensure the account has been active and data has been synced. |
| `SOCIAL_ANALYTICS_PERIOD_INVALID` | 400 | Invalid analytics period or date range. | Use a supported period or valid date range. |
| `SOCIAL_INFLUENCER_NOT_FOUND` | 404 | The specified influencer does not exist in the tenant's roster. | Add the influencer first or verify the ID. |
| `SOCIAL_CAMPAIGN_NOT_FOUND` | 404 | The specified influencer campaign does not exist. | Verify the campaign ID. |
| `SOCIAL_CAMPAIGN_BUDGET_EXCEEDED` | 400 | Payment would exceed the campaign budget. | Increase the budget or reduce the payment amount. |
| `SOCIAL_UGC_NOT_FOUND` | 404 | The specified UGC item does not exist. | Verify the UGC item ID. |
| `SOCIAL_UGC_RIGHTS_NOT_APPROVED` | 403 | Cannot reshare UGC without approved rights. | Request and obtain rights approval first. |
| `SOCIAL_UGC_RIGHTS_EXPIRED` | 403 | Usage rights for this UGC have expired. | Request renewed rights from the creator. |
| `SOCIAL_APPROVAL_NOT_FOUND` | 404 | The specified approval request does not exist. | Verify the approval ID. |
| `SOCIAL_APPROVAL_ALREADY_DECIDED` | 400 | This approval has already been approved or rejected. | No further action needed. |
| `SOCIAL_APPROVAL_EXPIRED` | 400 | The approval request has expired. | Submit a new approval request. |
| `SOCIAL_BRAND_VOICE_NOT_CONFIGURED` | 404 | Brand voice guidelines have not been set up for this tenant. | Configure brand voice via saveBrandVoice(). |
| `SOCIAL_PLATFORM_UNAVAILABLE` | 503 | The target platform's API is currently unreachable. | Check platform status and retry later. |
| `SOCIAL_PLATFORM_NOT_SUPPORTED` | 400 | The specified platform is not supported by this operation. | Check supported platforms for this feature. |
| `SOCIAL_CSV_PARSE_ERROR` | 400 | Failed to parse the uploaded CSV file for bulk scheduling. | Check CSV format: content, scheduledFor, platforms columns required. |
| `SOCIAL_WEBHOOK_VERIFICATION_FAILED` | 401 | Platform webhook signature verification failed. | Ensure webhook secret is correctly configured. |
| `SOCIAL_COMMERCE_PRODUCT_NOT_FOUND` | 404 | Tagged product does not exist in the commerce catalog. | Verify the product ID exists in @mcv/commerce. |
| `SOCIAL_PROOF_WIDGET_LIMIT` | 403 | Maximum number of social proof widgets reached for this plan. | Upgrade plan or delete unused widgets. |
| `SOCIAL_CONTENT_LIBRARY_NOT_FOUND` | 404 | The specified content library item does not exist. | Verify the item ID. |

---

## Security

### Authentication & Authorization

All operations require valid authentication via `@mcv/auth`. The module enforces the following access control model:

```typescript
/**
 * Social module permission matrix.
 * Permissions are checked via @mcv/auth RBAC middleware.
 */
const SOCIAL_PERMISSIONS = {
  // Account management
  'social:accounts:connect':      ['owner', 'admin'],
  'social:accounts:disconnect':   ['owner', 'admin'],
  'social:accounts:view':         ['owner', 'admin', 'editor', 'viewer'],

  // Publishing
  'social:posts:create':          ['owner', 'admin', 'editor'],
  'social:posts:publish':         ['owner', 'admin', 'editor'],
  'social:posts:schedule':        ['owner', 'admin', 'editor'],
  'social:posts:delete':          ['owner', 'admin'],
  'social:posts:view':            ['owner', 'admin', 'editor', 'viewer'],
  'social:posts:bulk_schedule':   ['owner', 'admin'],

  // Engagement
  'social:engagement:view':       ['owner', 'admin', 'editor', 'viewer'],
  'social:engagement:reply':      ['owner', 'admin', 'editor'],
  'social:engagement:assign':     ['owner', 'admin'],
  'social:engagement:resolve':    ['owner', 'admin', 'editor'],

  // Listening
  'social:listeners:create':      ['owner', 'admin'],
  'social:listeners:view':        ['owner', 'admin', 'editor', 'viewer'],
  'social:listeners:delete':      ['owner', 'admin'],

  // Analytics
  'social:analytics:view':        ['owner', 'admin', 'editor', 'viewer'],
  'social:analytics:export':      ['owner', 'admin'],

  // Influencers
  'social:influencers:manage':    ['owner', 'admin'],
  'social:influencers:view':      ['owner', 'admin', 'editor', 'viewer'],
  'social:campaigns:manage':      ['owner', 'admin'],

  // UGC
  'social:ugc:manage':            ['owner', 'admin', 'editor'],
  'social:ugc:view':              ['owner', 'admin', 'editor', 'viewer'],

  // Approvals
  'social:approvals:submit':      ['owner', 'admin', 'editor'],
  'social:approvals:review':      ['owner', 'admin'],

  // Brand Voice
  'social:brand_voice:configure': ['owner', 'admin'],
  'social:brand_voice:check':     ['owner', 'admin', 'editor'],

  // Commerce
  'social:commerce:manage':       ['owner', 'admin'],
  'social:commerce:view':         ['owner', 'admin', 'editor', 'viewer'],

  // Social Proof
  'social:proof:manage':          ['owner', 'admin'],
  'social:proof:view':            ['owner', 'admin', 'editor', 'viewer'],
} as const;
```

### Tenant Isolation

Every database table includes `tenant_id` with RLS policies. The module **never** constructs queries that bypass tenant isolation:

```sql
-- All tables follow this pattern
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON social_posts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

Cross-tenant operations are architecturally impossible — even internal services receive the tenant context from the authenticated session and pass it through RLS.

### OAuth Token Security

- **Encryption at rest** — All OAuth access tokens and refresh tokens are encrypted using Supabase Vault (`pgsodium`) before storage. Tokens are decrypted only in-memory during API calls.
- **Token rotation** — Refresh tokens are rotated on every use (where the platform supports it). Old refresh tokens are invalidated.
- **Minimal scopes** — Each platform adapter requests only the minimum OAuth scopes required for the connected features.
- **Token validation** — Background jobs periodically validate tokens and alert users when re-authentication is needed.
- **Secure deletion** — When an account is disconnected, tokens are securely zeroed out before the row is deleted.

### Webhook Security

Platform webhooks are verified using platform-specific signature verification:

```typescript
// Twitter webhook signature verification
function verifyTwitterWebhook(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', process.env.TWITTER_CONSUMER_SECRET!);
  hmac.update(payload);
  const expectedSignature = `sha256=${hmac.digest('base64')}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Facebook/Instagram webhook verification
function verifyMetaWebhook(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', process.env.META_APP_SECRET!);
  hmac.update(payload);
  const expectedSignature = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Content Security

- **Brand safety scanning** — AI-powered content scanning prevents publishing posts that may violate brand safety guidelines
- **Profanity filtering** — Optional profanity filter for engagement replies
- **Link validation** — All links in posts are validated against known phishing/malware databases before publishing
- **Media scanning** — Uploaded media is scanned for NSFW content via `@mcv/ai/moderation` before attachment

### Rate Limiting

- **Per-platform rate limiting** — Each platform adapter enforces the platform's API rate limits via Redis sliding windows
- **Per-tenant rate limiting** — Tenants are rate-limited based on their subscription plan to prevent abuse
- **Publish throttling** — Rapid publishing to the same account is throttled to avoid platform shadowbanning

```typescript
// Rate limit configuration per platform
const PLATFORM_RATE_LIMITS: Record<SocialPlatform, RateLimitConfig> = {
  twitter: {
    postsPerHour: 50,
    postsPerDay: 300,
    requestsPerMinute: 300,
    publishCooldownSeconds: 30,
  },
  instagram: {
    postsPerHour: 25,
    postsPerDay: 100,
    requestsPerMinute: 200,
    publishCooldownSeconds: 60,
  },
  facebook: {
    postsPerHour: 50,
    postsPerDay: 250,
    requestsPerMinute: 200,
    publishCooldownSeconds: 30,
  },
  linkedin: {
    postsPerHour: 20,
    postsPerDay: 100,
    requestsPerMinute: 100,
    publishCooldownSeconds: 60,
  },
  tiktok: {
    postsPerHour: 10,
    postsPerDay: 50,
    requestsPerMinute: 100,
    publishCooldownSeconds: 120,
  },
  youtube: {
    postsPerHour: 6,
    postsPerDay: 50,
    requestsPerMinute: 60,
    publishCooldownSeconds: 300,
  },
};
```

### Audit Logging

All significant actions are logged to the audit trail:

- Account connections / disconnections
- Post creation, publishing, deletion
- Engagement replies sent
- Listener creation / modification
- Influencer roster changes
- UGC rights requests
- Approval decisions
- Brand voice configuration changes

```typescript
// Every mutating operation logs an audit event
await auditLog.record({
  tenantId: ctx.tenantId,
  userId: ctx.userId,
  action: 'social.post.published',
  resourceType: 'social_post',
  resourceId: post.id,
  metadata: {
    platforms: post.targetAccountIds,
    status: 'published',
    campaignTag: post.campaignTag,
  },
});
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SOCIAL_ENCRYPTION_KEY` | ✅ | — | 256-bit key for OAuth token encryption (Supabase Vault integration). |
| `TWITTER_CLIENT_ID` | ✅* | — | Twitter/X OAuth 2.0 client ID. Required if Twitter is enabled. |
| `TWITTER_CLIENT_SECRET` | ✅* | — | Twitter/X OAuth 2.0 client secret. |
| `TWITTER_BEARER_TOKEN` | ✅* | — | Twitter/X API v2 bearer token for app-only auth (search, listening). |
| `TWITTER_WEBHOOK_SECRET` | ✅* | — | Secret for verifying Twitter Account Activity API webhooks. |
| `META_APP_ID` | ✅* | — | Meta (Facebook/Instagram) App ID. Required if Meta platforms are enabled. |
| `META_APP_SECRET` | ✅* | — | Meta App Secret for OAuth and webhook verification. |
| `META_WEBHOOK_VERIFY_TOKEN` | ✅* | — | Token for Meta webhook URL verification challenge. |
| `LINKEDIN_CLIENT_ID` | ✅* | — | LinkedIn OAuth client ID. Required if LinkedIn is enabled. |
| `LINKEDIN_CLIENT_SECRET` | ✅* | — | LinkedIn OAuth client secret. |
| `TIKTOK_CLIENT_KEY` | ✅* | — | TikTok for Developers client key. Required if TikTok is enabled. |
| `TIKTOK_CLIENT_SECRET` | ✅* | — | TikTok client secret. |
| `YOUTUBE_CLIENT_ID` | ✅* | — | YouTube Data API OAuth client ID. Required if YouTube is enabled. |
| `YOUTUBE_CLIENT_SECRET` | ✅* | — | YouTube Data API OAuth client secret. |
| `YOUTUBE_API_KEY` | ✅* | — | YouTube Data API key for public data access. |
| `SOCIAL_REDIS_URL` | ✅ | — | Redis URL for rate limiting, caching, and queue management. |
| `SOCIAL_QUEUE_PREFIX` | ❌ | `social` | BullMQ queue name prefix. |
| `SOCIAL_PUBLISH_MAX_RETRIES` | ❌ | `3` | Maximum retry attempts for failed publish jobs. |
| `SOCIAL_PUBLISH_RETRY_DELAY_MS` | ❌ | `1000` | Initial retry delay in milliseconds (exponential backoff). |
| `SOCIAL_SCHEDULE_CRON` | ❌ | `*/1 * * * *` | Cron expression for the post schedule worker (checks every minute). |
| `SOCIAL_ENGAGEMENT_POLL_INTERVAL_MS` | ❌ | `60000` | Polling interval for platforms without webhook support. |
| `SOCIAL_ANALYTICS_SYNC_CRON` | ❌ | `0 * * * *` | Cron expression for analytics sync (hourly by default). |
| `SOCIAL_LISTENING_SCAN_CRON` | ❌ | `*/5 * * * *` | Cron expression for social listening scans (every 5 minutes). |
| `SOCIAL_SENTIMENT_MODEL` | ❌ | `default` | AI model to use for sentiment analysis (`default`, `advanced`). |
| `SOCIAL_WEBHOOK_BASE_URL` | ✅ | — | Base URL for receiving platform webhooks (e.g., `https://api.mcv.one/webhooks/social`). |
| `SOCIAL_OAUTH_CALLBACK_BASE_URL` | ✅ | — | Base URL for OAuth callbacks (e.g., `https://app.mcv.one/social/callback`). |
| `SOCIAL_MEDIA_PROXY_URL` | ❌ | — | URL prefix for proxying social media images (privacy/caching). |
| `SOCIAL_MAX_LISTENERS_PER_TENANT` | ❌ | `10` | Maximum social listeners per tenant (adjustable per plan). |
| `SOCIAL_MAX_ACCOUNTS_PER_TENANT` | ❌ | `25` | Maximum connected accounts per tenant (adjustable per plan). |
| `SOCIAL_DLQ_ALERT_WEBHOOK` | ❌ | — | Webhook URL to notify when publish jobs land in the dead-letter queue. |

> *Variables marked ✅* are required only if the corresponding platform is enabled. At least one platform must be configured.

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/core` | Error types, logging, base utilities, tenant context |
| `@mcv/db` | Supabase client, Drizzle ORM, database connection management |
| `@mcv/auth` | Authentication, RBAC permission checks, session management |
| `@mcv/storage` | Media file storage (S3/R2), signed URL generation |
| `@mcv/queue` | BullMQ queue management, job scheduling, DLQ handling |
| `@mcv/ai/moderation` | Content moderation, NSFW detection for media |
| `@mcv/ai/nlp` | Sentiment analysis, entity extraction, brand voice checking |
| `@mcv/growth/analytics` | Cross-module analytics aggregation, UTM tracking |
| `@mcv/billing` | Plan limits enforcement, feature gating |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `twitter-api-v2` | `^1.17.0` | Twitter/X API v2 client |
| `instagram-private-api` | — | Not used; Meta Graph API used instead |
| `@googleapis/youtube` | `^14.0.0` | YouTube Data API v3 client |
| `drizzle-orm` | `^0.36.0` | ORM for PostgreSQL schema and queries |
| `bullmq` | `^5.0.0` | Durable job queue for publish pipeline |
| `ioredis` | `^5.4.0` | Redis client for rate limiting and caching |
| `zod` | `^3.23.0` | Runtime input validation for tRPC procedures |
| `date-fns` | `^4.0.0` | Date manipulation for scheduling and analytics |
| `date-fns-tz` | `^3.2.0` | Timezone handling for schedule display |
| `csv-parse` | `^5.5.0` | CSV parsing for bulk schedule import |
| `sharp` | `^0.33.0` | Image resizing/cropping for platform-specific media variants |
| `node-fetch` | `^3.3.0` | HTTP client for platform API calls (where SDK unavailable) |
| `p-queue` | `^8.0.0` | Concurrency-limited promise queue for rate-limited API calls |
| `p-retry` | `^6.2.0` | Promise retry with exponential backoff |
| `crypto` | (Node.js built-in) | Webhook signature verification, token encryption |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.45.0` | Supabase client (Realtime subscriptions, Vault) |
| `@trpc/server` | `^11.0.0` | tRPC router definitions |
| `react` | `^19.0.0` | React hooks (optional, for client-side usage) |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── publish.service.test.ts
│   │   │   ├── schedule.service.test.ts
│   │   │   ├── engagement.service.test.ts
│   │   │   ├── listening.service.test.ts
│   │   │   ├── analytics.service.test.ts
│   │   │   ├── influencer.service.test.ts
│   │   │   ├── ugc.service.test.ts
│   │   │   ├── commerce.service.test.ts
│   │   │   ├── proof.service.test.ts
│   │   │   └── approval.service.test.ts
│   │   ├── adapters/
│   │   │   ├── twitter.adapter.test.ts
│   │   │   ├── instagram.adapter.test.ts
│   │   │   ├── facebook.adapter.test.ts
│   │   │   ├── linkedin.adapter.test.ts
│   │   │   ├── tiktok.adapter.test.ts
│   │   │   └── youtube.adapter.test.ts
│   │   └── utils/
│   │       ├── content-validator.test.ts
│   │       ├── media-transformer.test.ts
│   │       ├── sentiment-analyzer.test.ts
│   │       └── optimal-time.test.ts
│   ├── integration/
│   │   ├── publish-pipeline.test.ts
│   │   ├── engagement-inbox.test.ts
│   │   ├── schedule-worker.test.ts
│   │   ├── listening-scanner.test.ts
│   │   ├── analytics-sync.test.ts
│   │   ├── approval-workflow.test.ts
│   │   └── webhook-handlers.test.ts
│   └── e2e/
│       ├── social-account-lifecycle.test.ts
│       ├── post-publish-flow.test.ts
│       ├── engagement-reply-flow.test.ts
│       └── influencer-campaign-flow.test.ts
```

### Running Tests

```bash
# All social module tests
pnpm test --filter=@mcv/growth/social

# Unit tests only
pnpm test --filter=@mcv/growth/social -- --testPathPattern=unit

# Integration tests (requires running Supabase + Redis)
pnpm test --filter=@mcv/growth/social -- --testPathPattern=integration

# E2E tests (requires platform API sandbox credentials)
pnpm test:e2e --filter=@mcv/growth/social

# Coverage report
pnpm test --filter=@mcv/growth/social -- --coverage

# Watch mode during development
pnpm test --filter=@mcv/growth/social -- --watch
```

### Unit Test Example: Publish Service

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublishService } from '../services/publish.service';
import { PlatformAdapterFactory } from '../adapters/factory';
import { createMockContext } from '@mcv/test-utils';

describe('PublishService', () => {
  let publishService: PublishService;
  let mockAdapterFactory: PlatformAdapterFactory;
  let mockTwitterAdapter: any;

  beforeEach(() => {
    mockTwitterAdapter = {
      platform: 'twitter',
      limits: {
        maxTextLength: 280,
        maxMediaPerPost: 4,
        supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
        supportsThreads: true,
        supportsFirstComment: false,
      },
      publish: vi.fn(),
      uploadMedia: vi.fn(),
      validateConnection: vi.fn().mockResolvedValue(true),
    };

    mockAdapterFactory = {
      getAdapter: vi.fn().mockReturnValue(mockTwitterAdapter),
    } as any;

    publishService = new PublishService({
      adapterFactory: mockAdapterFactory,
      db: createMockContext().db,
      queue: createMockContext().queue,
      storage: createMockContext().storage,
    });
  });

  describe('validatePost', () => {
    it('should reject posts exceeding platform character limit', async () => {
      const longText = 'a'.repeat(281);

      await expect(
        publishService.validatePost({
          content: longText,
          targetAccountIds: ['acc-1'],
          platforms: ['twitter'],
        })
      ).rejects.toThrow('SOCIAL_POST_TEXT_TOO_LONG');
    });

    it('should accept posts within character limit', async () => {
      const validText = 'Hello, world! 🚀';

      const result = await publishService.validatePost({
        content: validText,
        targetAccountIds: ['acc-1'],
        platforms: ['twitter'],
      });

      expect(result.valid).toBe(true);
    });

    it('should use platform overrides for validation', async () => {
      const result = await publishService.validatePost({
        content: 'a'.repeat(300), // Over Twitter limit
        platformOverrides: {
          twitter: 'Short tweet version', // Within limit
        },
        targetAccountIds: ['acc-1'],
        platforms: ['twitter'],
      });

      expect(result.valid).toBe(true);
    });

    it('should validate media attachments against platform limits', async () => {
      await expect(
        publishService.validatePost({
          content: 'Check out these photos!',
          media: [
            { fileId: '1' }, { fileId: '2' }, { fileId: '3' },
            { fileId: '4' }, { fileId: '5' }, // 5 > max 4 for Twitter
          ],
          targetAccountIds: ['acc-1'],
          platforms: ['twitter'],
        })
      ).rejects.toThrow('SOCIAL_POST_MEDIA_LIMIT');
    });

    it('should reject empty posts', async () => {
      await expect(
        publishService.validatePost({
          content: '',
          media: [],
          targetAccountIds: ['acc-1'],
          platforms: ['twitter'],
        })
      ).rejects.toThrow('SOCIAL_POST_CONTENT_EMPTY');
    });
  });

  describe('publishPost', () => {
    it('should publish successfully and return platform post ID', async () => {
      mockTwitterAdapter.publish.mockResolvedValue({
        success: true,
        platform: 'twitter',
        platformPostId: '123456789',
        postUrl: 'https://twitter.com/mcv_one/status/123456789',
        retryCount: 0,
        publishedAt: new Date(),
      });

      const result = await publishService.publishPost(
        createMockSocialPost({ content: 'Test post' }),
        createMockSocialAccount({ platform: 'twitter' })
      );

      expect(result.success).toBe(true);
      expect(result.platformPostId).toBe('123456789');
      expect(mockTwitterAdapter.publish).toHaveBeenCalledOnce();
    });

    it('should handle publish failures gracefully', async () => {
      mockTwitterAdapter.publish.mockRejectedValue(
        new Error('Twitter API rate limit exceeded')
      );

      const result = await publishService.publishPost(
        createMockSocialPost({ content: 'Test post' }),
        createMockSocialAccount({ platform: 'twitter' })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit');
    });
  });
});
```

### Integration Test Example: Engagement Inbox

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { EngagementService } from '../services/engagement.service';
import { setupTestDatabase, teardownTestDatabase, seedTestTenant } from '@mcv/test-utils';

describe('EngagementService (Integration)', () => {
  let engagementService: EngagementService;
  let tenantId: string;
  let accountId: string;

  beforeAll(async () => {
    const db = await setupTestDatabase();
    const { tenant, account } = await seedTestTenant(db, {
      platform: 'twitter',
      withEngagementItems: 50,
    });
    tenantId = tenant.id;
    accountId = account.id;
    engagementService = new EngagementService({ db });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should return paginated engagement items filtered by sentiment', async () => {
    const result = await engagementService.getInbox(tenantId, {
      sentiment: ['negative'],
      isResolved: false,
    }, { limit: 10 });

    expect(result.items.length).toBeLessThanOrEqual(10);
    expect(result.items.every(i => i.sentiment === 'negative')).toBe(true);
    expect(result.items.every(i => i.tenantId === tenantId)).toBe(true);
  });

  it('should correctly count unread items', async () => {
    const result = await engagementService.getInbox(tenantId, {
      isResolved: false,
    });

    expect(result.unreadCount).toBeGreaterThan(0);
    expect(typeof result.unreadCount).toBe('number');
  });

  it('should mark items as read without affecting other tenants', async () => {
    const result = await engagementService.getInbox(tenantId, { isRead: false });
    const itemIds = result.items.slice(0, 3).map(i => i.id);

    await engagementService.markAsRead(itemIds);

    const updated = await engagementService.getInbox(tenantId, { isRead: false });
    expect(updated.unreadCount).toBe(result.unreadCount - 3);

    // Verify items are now read
    for (const id of itemIds) {
      const item = await engagementService.getById(tenantId, id);
      expect(item?.isRead).toBe(true);
    }
  });

  it('should enforce tenant isolation', async () => {
    const otherTenantResult = await engagementService.getInbox('other-tenant-id', {});
    expect(otherTenantResult.items.length).toBe(0);
    expect(otherTenantResult.unreadCount).toBe(0);
  });
});
```

### Integration Test Example: Publish Pipeline

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PublishService } from '../services/publish.service';
import { ScheduleService } from '../services/schedule.service';
import { setupTestDatabase, setupTestQueue, teardownTestDatabase } from '@mcv/test-utils';

describe('Publish Pipeline (Integration)', () => {
  let publishService: PublishService;
  let scheduleService: ScheduleService;
  let tenantId: string;

  beforeAll(async () => {
    const db = await setupTestDatabase();
    const queue = await setupTestQueue();
    // ... service initialization
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should process a scheduled post at the correct time', async () => {
    const scheduledTime = new Date(Date.now() + 2000); // 2 seconds from now

    const post = await publishService.createPost({
      tenantId,
      createdBy: 'user-1',
      content: 'Scheduled test post',
      targetAccountIds: ['acc-1'],
      scheduledFor: scheduledTime,
    });

    expect(post.status).toBe('scheduled');

    // Wait for schedule worker to process
    await new Promise(resolve => setTimeout(resolve, 3000));

    const updated = await publishService.getPost(tenantId, post.id);
    expect(updated?.status).toBeOneOf(['publishing', 'published']);
  });

  it('should handle publish retries with exponential backoff', async () => {
    // Configure adapter to fail twice then succeed
    let attempts = 0;
    mockAdapter.publish.mockImplementation(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary API failure');
      }
      return {
        success: true,
        platformPostId: 'retry-success-123',
        postUrl: 'https://twitter.com/status/retry-success-123',
      };
    });

    const post = await publishService.createPost({
      tenantId,
      createdBy: 'user-1',
      content: 'Retry test post',
      targetAccountIds: ['acc-1'],
      publishNow: true,
    });

    // Wait for retries to complete
    await new Promise(resolve => setTimeout(resolve, 15000));

    const result = await publishService.getPost(tenantId, post.id);
    expect(result?.status).toBe('published');
    expect(attempts).toBe(3);
  });

  it('should move permanently failed posts to DLQ', async () => {
    mockAdapter.publish.mockRejectedValue(new Error('Permanent failure'));

    const post = await publishService.createPost({
      tenantId,
      createdBy: 'user-1',
      content: 'DLQ test post',
      targetAccountIds: ['acc-1'],
      publishNow: true,
    });

    // Wait for all retries to exhaust
    await new Promise(resolve => setTimeout(resolve, 30000));

    const result = await publishService.getPost(tenantId, post.id);
    expect(result?.status).toBe('failed');
  });
});
```

### Test Utilities

The module provides test helpers for other modules that need to mock social functionality:

```typescript
import { createMockSocialService, createMockSocialAccount, createMockSocialPost } from '@mcv/growth/social/test-utils';

// Create a mock SocialService with sensible defaults
const mockSocial = createMockSocialService();

// Create mock data objects
const account = createMockSocialAccount({
  platform: 'twitter',
  platformUsername: 'test_account',
  followerCount: 5000,
});

const post = createMockSocialPost({
  content: 'Test post content',
  status: 'published',
  targetAccountIds: [account.id],
});
```

### Coverage Requirements

| Category | Minimum Coverage |
|----------|-----------------|
| Services (unit) | 90% |
| Adapters (unit) | 85% |
| Utilities (unit) | 95% |
| Integration tests | 80% |
| Overall | 85% |

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## Related Modules

- [`@mcv/growth/analytics`](../analytics/MODULE.md) — Cross-channel analytics and UTM tracking
- [`@mcv/growth/email`](../email/MODULE.md) — Email marketing and automation
- [`@mcv/growth/ads`](../ads/MODULE.md) — Paid advertising management
- [`@mcv/growth/crm`](../crm/MODULE.md) — Contact and relationship management
- [`@mcv/ai/content`](../../ai/content/MODULE.md) — AI-powered content generation
- [`@mcv/ai/moderation`](../../ai/moderation/MODULE.md) — Content moderation and safety
- [`@mcv/storage`](../../infra/storage/MODULE.md) — File storage for media assets
- [`@mcv/queue`](../../infra/queue/MODULE.md) — Job queue infrastructure