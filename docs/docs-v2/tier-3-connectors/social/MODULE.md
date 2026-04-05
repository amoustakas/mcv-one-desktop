# @mcv/connectors/social — Module Specification

**Module:** `@mcv/connectors/social`  
**Classification:** PUBLISHABLE  
**Version:** 1.0.0  
**Tier:** 3 — Connector  
**Last Updated:** February 8, 2026

---

## Table of Contents

1. [Purpose](#purpose)
2. [Exports](#exports)
3. [Architecture](#architecture)
4. [Providers](#providers)
5. [Dependencies](#dependencies)
6. [Configuration Reference](#configuration-reference)
7. [Database Schema](#database-schema)
8. [TypeScript Interfaces](#typescript-interfaces)
9. [Service Implementation](#service-implementation)
10. [Post Service](#post-service)
11. [Content Adaptation Service](#content-adaptation-service)
12. [Media Processing Pipeline](#media-processing-pipeline)
13. [Inbox Service](#inbox-service)
14. [Analytics Service](#analytics-service)
15. [Rate Limiting Service](#rate-limiting-service)
16. [Provider Health Monitor](#provider-health-monitor)
17. [Queue & Scheduler Integration](#queue--scheduler-integration)
18. [API (tRPC Router)](#api-trpc-router)
19. [Client Hooks (React)](#client-hooks-react)
20. [Client Components (React)](#client-components-react)
21. [Code Examples](#code-examples)
22. [Webhook Handlers](#webhook-handlers)
23. [Provider-Specific Quirks & Gotchas](#provider-specific-quirks--gotchas)
24. [Security Considerations](#security-considerations)
25. [Performance Considerations](#performance-considerations)
26. [Platform Content Limits](#platform-content-limits)
27. [Audit Events](#audit-events)
28. [Error Codes](#error-codes)
29. [Monitoring & Observability](#monitoring--observability)
30. [Testing Strategy](#testing-strategy)
31. [Migration & Setup Guide](#migration--setup-guide)
32. [Related Modules](#related-modules)
33. [Changelog](#changelog)

---

## Purpose

Unified social media management layer supporting Twitter/X, Facebook, Instagram, LinkedIn, TikTok, and YouTube. Provides:

- **Multi-account connection** via `@mcv/connectors/oauth` for all providers
- **Scheduled multi-platform posting** with per-platform content adaptation
- **Engagement inbox** — unified view of comments, mentions, and DMs across all platforms
- **Cross-posting** with provider-specific media and formatting optimization
- **Analytics aggregation** — follower counts, engagement rates, reach metrics
- **Webhook receivers** for real-time interaction ingestion
- **Rate limiting** — per-provider, per-account rate consumption tracking
- **Content adaptation** — automatic text truncation, hashtag optimization, and format transformation per platform
- **Media pipeline** — image resizing, format conversion, and validation per-platform requirements
- **Provider health monitoring** — track API availability, latency, and degradation

Enables ventures to manage their entire social presence from a single API, eliminating the need for platform-specific tooling.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// Core account lifecycle
export {
  socialAccountService,     // Singleton account service
  SocialAccountService,     // Class for custom instantiation
} from './server/services/account.service';

export {
  initiateConnection,       // Start OAuth flow for provider
  completeConnection,       // Handle OAuth callback, create account
  disconnect,               // Disconnect account (soft delete)
  reconnect,                // Re-initiate OAuth for expired account
  refreshTokens,            // Manually trigger token refresh
  listAccounts,             // List venture's connected accounts
  getAccount,               // Get single account details
  deleteAccount,            // Hard-delete account and all data
} from './server/services/account.service';

// ═══════════════════════════════════════════════════════════════════════════════
// POST MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  postService,              // Singleton post service
  PostService,              // Class for custom instantiation
} from './server/services/post.service';

export {
  createPost,               // Create draft or scheduled post
  updatePost,               // Update draft/scheduled post
  deletePost,               // Delete post (only draft/scheduled)
  publishPost,              // Publish immediately to all targets
  retryPost,                // Retry failed post executions
  cancelScheduledPost,      // Cancel a scheduled post
  getPost,                  // Get single post with executions
  listPosts,                // List posts with filtering/pagination
  processScheduledPosts,    // Scheduler entry point (cron)
} from './server/services/post.service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT ADAPTATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  contentAdaptationService, // Singleton adaptation service
  ContentAdaptationService, // Class for custom instantiation
} from './server/services/content-adaptation.service';

export {
  adaptContent,             // Adapt content for specific provider
  adaptForAll,              // Adapt content for all target providers
  validateContent,          // Validate content meets platform rules
  extractHashtags,          // Extract hashtags from content
  optimizeHashtags,         // Optimize hashtag placement per platform
  truncateWithEllipsis,     // Smart truncation with word boundaries
  splitIntoThread,          // Split long content into thread parts
  generateAltText,          // AI-generated alt text for media (via gateway)
} from './server/services/content-adaptation.service';

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  mediaProcessingService,   // Singleton media service
  MediaProcessingService,   // Class for custom instantiation
} from './server/services/media-processing.service';

export {
  processMediaForProvider,  // Resize/convert for specific provider
  processMediaForAll,       // Process media for all target providers
  validateMedia,            // Validate media type, size, dimensions
  generateThumbnail,        // Generate thumbnail for video
  getMediaMetadata,         // Extract dimensions, duration, codec
  optimizeImage,            // Compress/optimize image
} from './server/services/media-processing.service';

// ═══════════════════════════════════════════════════════════════════════════════
// INBOX / INTERACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  inboxService,             // Singleton inbox service
  InboxService,             // Class for custom instantiation
} from './server/services/inbox.service';

export {
  syncInteractions,         // Sync interactions from all accounts
  syncAccountInteractions,  // Sync from specific account
  getInbox,                 // Fetch inbox with filtering/pagination
  getInteraction,           // Get single interaction
  reply,                    // Reply to interaction on native platform
  markRead,                 // Mark interactions as read
  markUnread,               // Mark interactions as unread
  archive,                  // Archive interactions
  getUnreadCount,           // Get unread count per account
  searchInteractions,       // Full-text search across interactions
} from './server/services/inbox.service';

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  analyticsService,         // Singleton analytics service
  SocialAnalyticsService,   // Class for custom instantiation
} from './server/services/analytics.service';

export {
  getDashboard,             // Aggregated dashboard metrics
  getPostAnalytics,         // Per-post analytics from providers
  getAccountAnalytics,      // Per-account follower/engagement stats
  getEngagementTimeline,    // Engagement over time (charting)
  getTopPosts,              // Best performing posts
  getBestPostingTimes,      // Optimal posting times analysis
  exportAnalytics,          // Export analytics as CSV/JSON
} from './server/services/analytics.service';

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  rateLimitService,         // Singleton rate limit service
  RateLimitService,         // Class for custom instantiation
} from './server/services/rate-limit.service';

export {
  checkRateLimit,           // Check if action is within limits
  consumeRateLimit,         // Consume rate limit quota
  getRateLimitStatus,       // Get current usage for account/provider
  resetRateLimit,           // Reset rate limit counters
  getRetryAfter,            // Get retry-after delay for rate limited account
} from './server/services/rate-limit.service';

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER HEALTH
// ═══════════════════════════════════════════════════════════════════════════════

export {
  providerHealthService,    // Singleton health service
  ProviderHealthService,    // Class for custom instantiation
} from './server/services/provider-health.service';

export {
  getProviderHealth,        // Get health status for provider
  getAllProviderHealth,     // Get health for all providers
  reportProviderError,      // Report API error
  reportProviderSuccess,    // Report successful API call
  isProviderHealthy,        // Boolean health check
} from './server/services/provider-health.service';

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOK HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  handleMetaWebhook,        // Facebook/Instagram webhook handler
  verifyMetaWebhook,        // Meta webhook verification
  handleTwitterWebhook,     // Twitter Account Activity handler
  verifyTwitterWebhook,     // Twitter CRC validation
  handleLinkedInWebhook,    // LinkedIn webhook handler
  handleTikTokWebhook,     // TikTok webhook handler
  registerWebhooks,         // Register webhooks for account
  unregisterWebhooks,       // Unregister webhooks on disconnect
} from './server/webhooks';

// ═══════════════════════════════════════════════════════════════════════════════
// tRPC ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export { socialRouter } from './server/router';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useSocialAccounts } from './client/hooks/use-social-accounts';
export { useSocialPosts } from './client/hooks/use-social-posts';
export { useCreatePost } from './client/hooks/use-create-post';
export { usePublishPost } from './client/hooks/use-publish-post';
export { useSocialInbox } from './client/hooks/use-social-inbox';
export { useInboxReply } from './client/hooks/use-inbox-reply';
export { useSocialDashboard } from './client/hooks/use-social-dashboard';
export { usePostAnalytics } from './client/hooks/use-post-analytics';
export { useConnectAccount } from './client/hooks/use-connect-account';
export { useContentPreview } from './client/hooks/use-content-preview';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { PostComposer } from './client/components/post-composer';
export { PostScheduler } from './client/components/post-scheduler';
export { PostPreview } from './client/components/post-preview';
export { PlatformSelector } from './client/components/platform-selector';
export { SocialInbox } from './client/components/social-inbox';
export { InteractionThread } from './client/components/interaction-thread';
export { AccountConnector } from './client/components/account-connector';
export { AccountList } from './client/components/account-list';
export { SocialDashboard } from './client/components/social-dashboard';
export { EngagementChart } from './client/components/engagement-chart';
export { PostCalendar } from './client/components/post-calendar';
export { ContentAdaptationPreview } from './client/components/content-adaptation-preview';
export { MediaUploader } from './client/components/media-uploader';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SOCIAL_PROVIDERS,          // List of all supported providers
  PROVIDER_SCOPES,           // OAuth scopes per provider
  CONTENT_LIMITS,            // Text/media limits per platform
  MEDIA_CONSTRAINTS,         // Image/video requirements per platform
  RATE_LIMITS,               // API rate limits per provider
  SUPPORTED_MEDIA_TYPES,     // Accepted MIME types per platform
  WEBHOOK_EVENTS,            // Webhook event types per provider
  DEFAULT_SCHEDULER_INTERVAL,// 60000ms
  DEFAULT_SYNC_INTERVAL,     // 300000ms
  MAX_ACCOUNTS_PER_VENTURE,  // 25
  MAX_MEDIA_SIZE_MB,         // 50
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Provider types
  SocialProvider,
  SocialPostStatus,
  SocialAccountStatus,

  // Entity types (from schema)
  SocialAccount,
  NewSocialAccount,
  SocialPost,
  NewSocialPost,
  SocialPostExecution,
  SocialInteraction,
  SocialConnectionConfig,

  // Service types
  CreatePostOptions,
  UpdatePostOptions,
  PlatformPostOptions,
  SocialProfile,
  InboxFilters,
  SocialAnalytics,
  PostAnalytics,
  AccountAnalytics,
  EngagementTimeline,

  // Content adaptation types
  ContentAdaptationResult,
  ContentValidationResult,
  ContentValidationError,
  ThreadPart,
  HashtagOptimization,

  // Media types
  MediaProcessingResult,
  MediaValidationResult,
  MediaMetadata,
  MediaConstraints,
  PlatformMediaRequirements,

  // Rate limit types
  RateLimitStatus,
  RateLimitConfig,
  RateLimitBucket,

  // Provider health types
  ProviderHealthStatus,
  ProviderHealthReport,

  // Webhook types
  WebhookEvent,
  WebhookPayload,
  MetaWebhookEntry,
  TwitterWebhookEvent,

  // Dashboard types
  SocialDashboardData,
  PostStats,
  InteractionStats,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          @mcv/connectors/social                                  │
│                                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ AccountService  │  │ PostService    │  │ InboxService   │  │ Analytics    │  │
│  │                 │  │                │  │                │  │ Service      │  │
│  │ • connect       │  │ • create       │  │ • fetch        │  │ • followers  │  │
│  │ • disconnect    │  │ • schedule     │  │ • reply        │  │ • engagement │  │
│  │ • refresh       │  │ • publish      │  │ • markRead     │  │ • reach      │  │
│  │ • list          │  │ • crosspost    │  │ • archive      │  │ • topPosts   │  │
│  └───────┬─────────┘  └───────┬────────┘  └───────┬────────┘  └──────┬───────┘  │
│          │                    │                    │                  │          │
│  ┌───────┴────────────────────┴────────────────────┴──────────────────┴───────┐  │
│  │                       Service Support Layer                                │  │
│  │                                                                            │  │
│  │  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐    │  │
│  │  │ Content        │  │ Media Processing │  │ Rate Limiting           │    │  │
│  │  │ Adaptation     │  │                  │  │                         │    │  │
│  │  │ • truncate     │  │ • resize         │  │ • per-provider tracking │    │  │
│  │  │ • thread split │  │ • convert        │  │ • per-account buckets   │    │  │
│  │  │ • hashtag opt  │  │ • validate       │  │ • backoff calculation   │    │  │
│  │  │ • alt text gen │  │ • thumbnail      │  │ • retry scheduling      │    │  │
│  │  └────────────────┘  └──────────────────┘  └─────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                       Provider Adapter Layer                               │   │
│  │                                                                            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐        │   │
│  │  │ Twitter  │ │ Facebook │ │Instagram │ │ LinkedIn │ │ TikTok  │        │   │
│  │  │ /X API   │ │ Graph    │ │ Graph    │ │ API v2   │ │ API     │        │   │
│  │  │ v2       │ │ v18.0    │ │ v18.0    │ │          │ │         │        │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘        │   │
│  │                                                                            │   │
│  │  ┌──────────┐ ┌────────────────────────────────────────────────┐          │   │
│  │  │ YouTube  │ │ Provider Health Monitor                        │          │   │
│  │  │ Data     │ │ • circuit breaker per provider                 │          │   │
│  │  │ API v3   │ │ • latency tracking • degradation detection     │          │   │
│  │  └──────────┘ └────────────────────────────────────────────────┘          │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │        Scheduler (via @mcv/queue)        │  │      Webhook Receivers       │  │
│  │                                          │  │                              │  │
│  │  • Cron post publishing                  │  │  • Facebook/IG webhooks      │  │
│  │  • Token refresh jobs                    │  │  • Twitter Account Activity  │  │
│  │  • Interaction sync polling              │  │  • LinkedIn webhooks         │  │
│  │  • Analytics aggregation                 │  │  • TikTok webhooks           │  │
│  │  • Rate limit window resets              │  │  • YouTube push notifications│  │
│  └─────────────────────────────────────────┘  └──────────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │                   @mcv/connectors/oauth (Token Layer)                     │    │
│  │  Handles all OAuth flows, token storage, refresh, and revocation          │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                ┌───────────────────────┼───────────────────────┐
                │                       │                       │
         Twitter API v2          Meta Graph API          LinkedIn API
         TikTok API              YouTube Data API v3
```

### Data Flow: Cross-Platform Post Publishing Pipeline

```
User creates post via PostComposer (React)
        │
        ▼
┌──────────────────┐
│ tRPC createPost  │
│ (validation)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────────────────────────┐
│  socialPosts      │────▶│ Content Adaptation Service            │
│  (DB record)      │     │                                      │
│  status: draft    │     │  For each target account:            │
│  or scheduled     │     │  1. Detect provider from accountId   │
└──────────────────┘     │  2. Validate content length          │
                          │  3. Adapt text (truncate, hashtags)  │
                          │  4. Adapt media (resize, convert)    │
                          └─────────────┬────────────────────────┘
                                        │
                          ┌─────────────┼─────────────────────────┐
                          │             │                         │
                          ▼             ▼                         ▼
                    ┌──────────┐ ┌──────────────┐ ┌────────────────┐
                    │ Rate     │ │ Media        │ │ Provider       │
                    │ Limit    │ │ Processing   │ │ Health Check   │
                    │ Check    │ │ Pipeline     │ │                │
                    │          │ │              │ │ Is provider    │
                    │ Within   │ │ • resize     │ │ healthy?       │
                    │ quota?   │ │ • compress   │ │ • latency ok?  │
                    └────┬─────┘ │ • convert    │ │ • error rate?  │
                         │       └──────┬───────┘ └───────┬────────┘
                         │              │                 │
                         └──────────────┼─────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
              ┌──────────┐      ┌──────────┐        ┌──────────┐
              │ Twitter   │      │ Facebook │        │ LinkedIn │
              │ execution │      │ execution│        │ execution│
              │           │      │          │        │          │
              │ tweet()   │      │ /feed    │        │ /ugcPosts│
              └─────┬─────┘      └─────┬────┘        └─────┬────┘
                    │                  │                    │
                    ▼                  ▼                    ▼
              socialPostExecutions (per-account status)
              ┌──────────────────────────────────────────────┐
              │ postId | accountId | status    | externalId   │
              │ abc    | tw-1      | published | 183920...    │
              │ abc    | fb-2      | published | 581928...    │
              │ abc    | li-3      | failed    | null         │
              └──────────────────────────────────────────────┘
                    │
                    ▼
              ┌──────────────────────────────────────────────┐
              │ Domain Events                                 │
              │                                               │
              │ social.post.published { postId, success }     │
              │ social.post.failed    { postId, errors }      │
              │ social.execution.published { executionId }    │
              │ social.execution.failed    { executionId }    │
              └──────────────────────────────────────────────┘
```

### Data Flow: Webhook → Inbox

```
External Platform (Twitter, Facebook, etc.)
        │
        │ HTTP POST (signed payload)
        ▼
┌──────────────────────────────────┐
│ Webhook Endpoint                  │
│ /api/webhooks/:provider           │
│                                   │
│ 1. Verify signature (HMAC-SHA256) │
│ 2. Parse event type               │
│ 3. Resolve account from payload   │
│ 4. Respond 200 OK immediately     │
└────────────┬─────────────────────┘
             │
             ▼ (async processing)
┌──────────────────────────────────┐
│ Interaction Ingestion             │
│                                   │
│ 1. Normalize to SocialInteraction │
│ 2. Deduplicate via unique index   │
│ 3. Insert to DB                   │
│ 4. Emit domain event              │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ social.interaction.received       │
│ { ventureId, accountId, type }    │
│                                   │
│ Consumers:                        │
│ • Real-time inbox push (WS)      │
│ • AI auto-reply (NAOS agents)    │
│ • Notification to venture team    │
└──────────────────────────────────┘
```

### Data Flow: Scheduled Post Processing

```
┌──────────────────────────────────────────────────────────────────┐
│ @mcv/queue Scheduler — runs every 60 seconds                     │
│                                                                   │
│  SELECT * FROM social_posts                                       │
│  WHERE status = 'scheduled'                                       │
│  AND scheduled_at <= NOW()                                        │
│  ORDER BY scheduled_at ASC                                        │
│  LIMIT 50                                                         │
│  FOR UPDATE SKIP LOCKED  ← prevents duplicate processing         │
│                                                                   │
│  For each due post:                                               │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ 1. Lock post (status → 'publishing')                     │    │
│  │ 2. For each execution record:                            │    │
│  │    a. Check account status (active?)                     │    │
│  │    b. Check rate limit quota                             │    │
│  │    c. Check provider health                              │    │
│  │    d. Adapt content for provider                         │    │
│  │    e. Process media for provider                         │    │
│  │    f. Call provider API                                  │    │
│  │    g. Update execution status                            │    │
│  │ 3. Update post status (published/failed/partial)         │    │
│  │ 4. Emit domain events                                    │    │
│  │ 5. Log audit trail                                       │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Providers

| Provider | API | Post Types | Interactions | Analytics |
|----------|-----|------------|-------------|-----------|
| **Twitter/X** | v2 + OAuth 2.0 PKCE | Tweets, threads, polls, media | Mentions, DMs, replies | Impressions, engagement |
| **Facebook** | Graph API v18.0 | Page posts, stories, reels | Comments, reactions, messages | Reach, engagement, page views |
| **Instagram** | Graph API v18.0 | Feed posts, stories, reels, carousels | Comments, mentions | Reach, impressions, saves |
| **LinkedIn** | v2 API | Articles, posts, images | Comments, reactions | Impressions, clicks, engagement |
| **TikTok** | Content Posting API | Video posts | Comments | Views, likes, shares |
| **YouTube** | Data API v3 | Video uploads | Comments | Views, subscribers, watch time |

### Provider Feature Matrix

| Feature | Twitter | Facebook | Instagram | LinkedIn | TikTok | YouTube |
|---------|---------|----------|-----------|----------|--------|---------|
| Text posts | ✅ | ✅ | ❌ (needs media) | ✅ | ❌ (video only) | ❌ (video only) |
| Image posts | ✅ (4 max) | ✅ (30 max) | ✅ (1 feed) | ✅ (9 max) | ❌ | ❌ |
| Video posts | ✅ (1 max) | ✅ | ✅ (reels) | ✅ | ✅ | ✅ |
| Carousels | ❌ | ❌ | ✅ (10 max) | ❌ | ❌ | ❌ |
| Stories | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Polls | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Threads | ✅ (native) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Link previews | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Mentions | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| DMs | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Webhooks | ✅ (AAA) | ✅ | ✅ | ✅ | ✅ | ✅ (push) |
| Real-time | ✅ | ✅ | ✅ | Polling | Polling | Polling |
| Token refresh | ✅ | ✅ (60d long-lived) | ✅ (60d) | ✅ (60d) | ✅ | ✅ |
| Rate limit header | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `twitter-api-v2` | `^1.15.x` | Twitter/X API client with full v2 support |
| `drizzle-orm` | `^0.30.x` | Type-safe database ORM |
| `@mcv/db` | `workspace:*` | Database connection and shared schema |
| `@mcv/connectors/oauth` | `workspace:*` | OAuth token management and refresh |
| `@mcv/secrets` | `workspace:*` | Token encryption/decryption vault |
| `@mcv/audit` | `workspace:*` | Audit event logging |
| `@mcv/events` | `workspace:*` | Domain event bus for cross-module integration |
| `@mcv/queue` | `workspace:*` | Scheduled post publishing and background jobs |
| `@mcv/storage` | `workspace:*` | Media upload/download with CDN integration |
| `@mcv/intelligence/gateway` | `workspace:*` | AI-powered alt text generation, content suggestions |
| `zod` | `^3.22.x` | Input validation schemas |
| `sharp` | `^0.33.x` | Image resizing, format conversion, compression |
| `fluent-ffmpeg` | `^2.1.x` | Video thumbnail generation, format validation |
| `ioredis` | `^5.3.x` | Rate limit counters and provider health cache |

---

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TWITTER_CLIENT_ID` | No | — | Twitter OAuth 2.0 client ID |
| `TWITTER_CLIENT_SECRET` | No | — | Twitter OAuth 2.0 client secret |
| `TWITTER_BEARER_TOKEN` | No | — | Twitter app-only bearer token (for read-only operations) |
| `TWITTER_AAA_ENV_NAME` | No | `production` | Twitter Account Activity API environment name |
| `META_APP_ID` | No | — | Facebook/Instagram app ID |
| `META_APP_SECRET` | No | — | Facebook/Instagram app secret |
| `META_WEBHOOK_VERIFY_TOKEN` | No | — | Meta webhook verification token (user-defined) |
| `LINKEDIN_CLIENT_ID` | No | — | LinkedIn OAuth client ID |
| `LINKEDIN_CLIENT_SECRET` | No | — | LinkedIn OAuth client secret |
| `TIKTOK_CLIENT_KEY` | No | — | TikTok app client key |
| `TIKTOK_CLIENT_SECRET` | No | — | TikTok app client secret |
| `YOUTUBE_API_KEY` | No | — | YouTube Data API key (for read-only operations) |
| `YOUTUBE_CLIENT_ID` | No | — | YouTube OAuth client ID |
| `YOUTUBE_CLIENT_SECRET` | No | — | YouTube OAuth client secret |
| `SOCIAL_WEBHOOK_BASE_URL` | Yes | — | Base URL for webhook callbacks (must be HTTPS, public) |
| `SOCIAL_POST_SCHEDULER_INTERVAL` | No | `60000` | Scheduler polling interval (ms) |
| `SOCIAL_INTERACTION_SYNC_INTERVAL` | No | `300000` | Interaction sync interval (5 min default) |
| `SOCIAL_ANALYTICS_AGGREGATION_INTERVAL` | No | `3600000` | Analytics aggregation interval (1h default) |
| `SOCIAL_TOKEN_REFRESH_BUFFER_HOURS` | No | `24` | Hours before expiry to trigger refresh |
| `SOCIAL_MAX_MEDIA_SIZE_MB` | No | `50` | Max media upload size in MB |
| `SOCIAL_MAX_ACCOUNTS_PER_VENTURE` | No | `25` | Max connected accounts per venture |
| `SOCIAL_MAX_SCHEDULED_POSTS` | No | `500` | Max scheduled posts per venture |
| `SOCIAL_REDIS_URL` | No | `redis://localhost:6379` | Redis for rate limit counters |
| `SOCIAL_ENABLE_AI_ALT_TEXT` | No | `false` | Enable AI-generated alt text for media |
| `SOCIAL_ENABLE_CONTENT_SUGGESTIONS` | No | `false` | Enable AI content improvement suggestions |

### Module Configuration Object

```typescript
// @mcv/connectors/social/config.ts

export interface SocialModuleConfig {
  /**
   * Providers to enable. Providers without credentials are automatically disabled.
   */
  enabledProviders: SocialProvider[];

  /**
   * Webhook configuration.
   */
  webhooks: {
    /** Public base URL for webhook endpoints */
    baseUrl: string;
    /** Secret for HMAC signature verification (per provider) */
    secrets: Partial<Record<SocialProvider, string>>;
    /** Timeout for webhook processing before returning 200 */
    processingTimeoutMs: number;
  };

  /**
   * Scheduler configuration.
   */
  scheduler: {
    /** How often to check for due scheduled posts */
    pollIntervalMs: number;
    /** Max posts to process per scheduler tick */
    batchSize: number;
    /** Whether to use FOR UPDATE SKIP LOCKED for multi-instance safety */
    useAdvisoryLocks: boolean;
  };

  /**
   * Content adaptation defaults.
   */
  contentAdaptation: {
    /** Auto-truncate content exceeding platform limits */
    autoTruncate: boolean;
    /** Add platform-specific hashtag optimization */
    optimizeHashtags: boolean;
    /** Generate AI alt text for images without it */
    aiAltText: boolean;
    /** Suggest content improvements via AI */
    contentSuggestions: boolean;
  };

  /**
   * Media processing defaults.
   */
  media: {
    /** Max file size in bytes */
    maxFileSizeBytes: number;
    /** Image quality for JPEG compression (1-100) */
    imageQuality: number;
    /** Whether to strip EXIF data from images */
    stripExif: boolean;
    /** Generate WebP variants for web display */
    generateWebP: boolean;
  };

  /**
   * Rate limiting strategy.
   */
  rateLimiting: {
    /** Redis URL for distributed rate limiting */
    redisUrl: string;
    /** Safety margin — use only X% of provider's actual limit */
    safetyMarginPercent: number;
    /** Default backoff base in ms for rate-limited retries */
    backoffBaseMs: number;
    /** Max retry attempts for rate-limited operations */
    maxRetries: number;
  };
}

export const DEFAULT_CONFIG: SocialModuleConfig = {
  enabledProviders: ['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'],
  webhooks: {
    baseUrl: process.env.SOCIAL_WEBHOOK_BASE_URL ?? '',
    secrets: {},
    processingTimeoutMs: 5000,
  },
  scheduler: {
    pollIntervalMs: 60_000,
    batchSize: 50,
    useAdvisoryLocks: true,
  },
  contentAdaptation: {
    autoTruncate: true,
    optimizeHashtags: true,
    aiAltText: false,
    contentSuggestions: false,
  },
  media: {
    maxFileSizeBytes: 50 * 1024 * 1024, // 50MB
    imageQuality: 85,
    stripExif: true,
    generateWebP: false,
  },
  rateLimiting: {
    redisUrl: process.env.SOCIAL_REDIS_URL ?? 'redis://localhost:6379',
    safetyMarginPercent: 80,
    backoffBaseMs: 1000,
    maxRetries: 3,
  },
};
```

---

## Database Schema

### Actual Schema (from `packages/db/src/schema/social.ts`)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export const socialProviders = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube'] as const;
export type SocialProvider = (typeof socialProviders)[number];

export const socialPostStatus = ['draft', 'scheduled', 'publishing', 'published', 'failed', 'partial'] as const;
export type SocialPostStatus = (typeof socialPostStatus)[number];

export const socialAccountStatus = ['active', 'disconnected', 'expired', 'error', 'rate_limited'] as const;
export type SocialAccountStatus = (typeof socialAccountStatus)[number];

export const socialInteractionType = ['comment', 'mention', 'dm', 'reply', 'reaction', 'story_mention'] as const;
export type SocialInteractionType = (typeof socialInteractionType)[number];

// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL ACCOUNTS — connected provider accounts per venture
// ═══════════════════════════════════════════════════════════════════════════════

export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: socialProviders }).notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  name: text('name').notNull(),
  username: text('username'),
  profilePictureUrl: text('profile_picture_url'),
  profileUrl: text('profile_url'),
  accessToken: text('access_token').notNull(),   // Encrypted via @mcv/secrets
  refreshToken: text('refresh_token'),            // Encrypted via @mcv/secrets
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  scopes: jsonb('scopes').$type<string[]>().default([]),
  status: text('status', { enum: socialAccountStatus }).notNull().default('active'),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  lastErrorAt: timestamp('last_error_at', { withTimezone: true }),
  lastErrorMessage: text('last_error_message'),
  consecutiveErrors: integer('consecutive_errors').default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_social_accounts_venture').on(table.ventureId),
  uniqueIndex('idx_social_accounts_provider_id').on(table.provider, table.providerAccountId),
  index('idx_social_accounts_status').on(table.ventureId, table.status),
  index('idx_social_accounts_token_expiry').on(table.tokenExpiresAt),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL POSTS — cross-platform content
// ═══════════════════════════════════════════════════════════════════════════════

export const socialPosts = pgTable('social_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  content: text('content'),
  mediaUrls: jsonb('media_urls').$type<string[]>().default([]),
  mediaMetadata: jsonb('media_metadata').$type<MediaMetadataRecord[]>().default([]),
  accountIds: jsonb('account_ids').$type<string[]>().notNull().default([]),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  status: text('status', { enum: socialPostStatus }).notNull().default('draft'),
  error: text('error'),
  platformOptions: jsonb('platform_options').$type<Record<string, unknown>>().default({}),
  adaptedContent: jsonb('adapted_content').$type<Record<SocialProvider, string>>(),
  tags: jsonb('tags').$type<string[]>().default([]),
  campaignId: uuid('campaign_id'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_social_posts_venture').on(table.ventureId),
  index('idx_social_posts_status').on(table.status),
  index('idx_social_posts_scheduled').on(table.scheduledAt),
  index('idx_social_posts_campaign').on(table.campaignId),
  index('idx_social_posts_venture_status').on(table.ventureId, table.status),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL POST EXECUTIONS — per-account publish status
// ═══════════════════════════════════════════════════════════════════════════════

export const socialPostExecutions = pgTable('social_post_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => socialPosts.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: socialProviders }).notNull(),
  externalPostId: text('external_post_id'),
  externalPostUrl: text('external_post_url'),
  adaptedContent: text('adapted_content'),
  status: text('status', { enum: socialPostStatus }).notNull().default('draft'),
  error: text('error'),
  errorCode: text('error_code'),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  providerMetadata: jsonb('provider_metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_social_post_executions_unique').on(table.postId, table.accountId),
  index('idx_social_post_executions_account').on(table.accountId),
  index('idx_social_post_executions_status').on(table.status),
  index('idx_social_post_executions_retry').on(table.nextRetryAt),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL INTERACTIONS — comments, mentions, DMs
// ═══════════════════════════════════════════════════════════════════════════════

export const socialInteractions = pgTable('social_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: socialProviders }).notNull(),
  externalId: text('external_id').notNull(),
  externalPostId: text('external_post_id'),
  parentInteractionId: uuid('parent_interaction_id'),
  type: text('type', { enum: socialInteractionType }).notNull(),
  content: text('content'),
  authorExternalId: text('author_external_id'),
  authorName: text('author_name'),
  authorHandle: text('author_handle'),
  authorAvatarUrl: text('author_avatar_url'),
  authorProfileUrl: text('author_profile_url'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  isRead: boolean('is_read').default(false),
  isReplied: boolean('is_replied').default(false),
  isArchived: boolean('is_archived').default(false),
  sentiment: text('sentiment'),   // 'positive' | 'negative' | 'neutral' (AI-derived)
  language: text('language'),     // ISO 639-1 code
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_social_interactions_venture').on(table.ventureId),
  index('idx_social_interactions_account').on(table.accountId),
  uniqueIndex('idx_social_interactions_external').on(table.accountId, table.externalId),
  index('idx_social_interactions_venture_unread').on(table.ventureId, table.isRead),
  index('idx_social_interactions_type').on(table.ventureId, table.type),
  index('idx_social_interactions_occurred').on(table.ventureId, table.occurredAt),
  index('idx_social_interactions_parent').on(table.parentInteractionId),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL ANALYTICS SNAPSHOTS — periodic metrics capture
// ═══════════════════════════════════════════════════════════════════════════════

export const socialAnalyticsSnapshots = pgTable('social_analytics_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow().notNull(),
  followers: integer('followers'),
  following: integer('following'),
  postsCount: integer('posts_count'),
  engagementRate: real('engagement_rate'),
  impressions: integer('impressions'),
  reach: integer('reach'),
  profileViews: integer('profile_views'),
  websiteClicks: integer('website_clicks'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
}, (table) => [
  index('idx_social_analytics_account').on(table.accountId),
  index('idx_social_analytics_captured').on(table.accountId, table.capturedAt),
]);

// ═══════════════════════════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const socialAccountsRelations = relations(socialAccounts, ({ one, many }) => ({
  venture: one(ventures, { fields: [socialAccounts.ventureId], references: [ventures.id] }),
  executions: many(socialPostExecutions),
  interactions: many(socialInteractions),
  analyticsSnapshots: many(socialAnalyticsSnapshots),
}));

export const socialPostsRelations = relations(socialPosts, ({ one, many }) => ({
  venture: one(ventures, { fields: [socialPosts.ventureId], references: [ventures.id] }),
  executions: many(socialPostExecutions),
  creator: one(users, { fields: [socialPosts.createdBy], references: [users.id] }),
}));

export const socialPostExecutionsRelations = relations(socialPostExecutions, ({ one }) => ({
  post: one(socialPosts, { fields: [socialPostExecutions.postId], references: [socialPosts.id] }),
  account: one(socialAccounts, { fields: [socialPostExecutions.accountId], references: [socialAccounts.id] }),
}));

export const socialInteractionsRelations = relations(socialInteractions, ({ one, many }) => ({
  venture: one(ventures, { fields: [socialInteractions.ventureId], references: [ventures.id] }),
  account: one(socialAccounts, { fields: [socialInteractions.accountId], references: [socialAccounts.id] }),
  parent: one(socialInteractions, {
    fields: [socialInteractions.parentInteractionId],
    references: [socialInteractions.id],
    relationName: 'interactionThread',
  }),
  replies: many(socialInteractions, { relationName: 'interactionThread' }),
}));

export const socialAnalyticsSnapshotsRelations = relations(socialAnalyticsSnapshots, ({ one }) => ({
  account: one(socialAccounts, {
    fields: [socialAnalyticsSnapshots.accountId],
    references: [socialAccounts.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type NewSocialAccount = typeof socialAccounts.$inferInsert;
export type SocialPost = typeof socialPosts.$inferSelect;
export type NewSocialPost = typeof socialPosts.$inferInsert;
export type SocialPostExecution = typeof socialPostExecutions.$inferSelect;
export type SocialInteraction = typeof socialInteractions.$inferSelect;
export type SocialAnalyticsSnapshot = typeof socialAnalyticsSnapshots.$inferSelect;

export type SocialConnectionConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
};

type MediaMetadataRecord = {
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationMs?: number;
  sizeBytes: number;
  altText?: string;
};
```

### Entity Relationship Diagram

```
┌──────────────────┐
│    ventures       │
│    ────────       │
│    id (PK)        │
└────────┬─────────┘
         │
    ┌────┴─────────────────────────────┐
    │                                  │
    ▼                                  ▼
┌──────────────────┐         ┌──────────────────┐
│ social_accounts   │         │ social_posts      │
│                   │         │                   │
│ PK: id            │         │ PK: id            │
│ FK: ventureId     │         │ FK: ventureId     │
│ FK: createdBy     │         │ FK: createdBy     │
│ UK: provider +    │         │                   │
│     providerAcct  │         │ content           │
│                   │         │ mediaUrls[]       │
│ provider          │         │ accountIds[]      │
│ name, username    │         │ scheduledAt       │
│ accessToken (enc) │         │ publishedAt       │
│ refreshToken(enc) │         │ status            │
│ tokenExpiresAt    │         │ platformOptions   │
│ status            │         │ adaptedContent    │
│ lastSyncAt        │         │ tags[]            │
│ consecutiveErrors │         │ campaignId        │
└──────┬───────────┘         └────────┬──────────┘
       │                              │
       │    ┌─────────────────────────┤
       │    │                         │
       │    ▼                         │
       │  ┌───────────────────────┐   │
       ├─▶│ social_post_executions│◄──┘
       │  │                       │
       │  │ PK: id                │
       │  │ FK: postId            │
       │  │ FK: accountId         │
       │  │ UK: postId+accountId  │
       │  │                       │
       │  │ provider              │
       │  │ externalPostId        │
       │  │ externalPostUrl       │
       │  │ adaptedContent        │
       │  │ status                │
       │  │ retryCount            │
       │  │ nextRetryAt           │
       │  │ publishedAt           │
       │  └───────────────────────┘
       │
       ▼
┌───────────────────────┐    ┌──────────────────────────┐
│ social_interactions    │    │ social_analytics_         │
│                        │    │ snapshots                 │
│ PK: id                 │    │                           │
│ FK: ventureId          │    │ PK: id                    │
│ FK: accountId          │    │ FK: accountId             │
│ UK: accountId+externalId    │                           │
│                        │    │ capturedAt                │
│ provider               │    │ followers                 │
│ externalId             │    │ following                 │
│ externalPostId         │    │ postsCount                │
│ parentInteractionId    │    │ engagementRate            │
│ type (comment/mention/ │    │ impressions               │
│       dm/reply/        │    │ reach                     │
│       reaction/        │    │ profileViews              │
│       story_mention)   │    │ websiteClicks             │
│ content                │    └──────────────────────────┘
│ authorName/Handle      │
│ isRead/isReplied       │
│ isArchived             │
│ sentiment              │
│ language               │
└────────────────────────┘
```

---

## TypeScript Interfaces

```typescript
// @mcv/connectors/social/types.ts

// ═══════════════════════════════════════════════════════════════════════════════
// POST CREATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreatePostOptions {
  ventureId: string;
  content: string;
  mediaUrls?: string[];
  mediaMetadata?: MediaMetadataInput[];
  accountIds: string[];
  scheduledAt?: Date;
  platformOptions?: PlatformPostOptions;
  tags?: string[];
  campaignId?: string;
  userId: string;
}

export interface UpdatePostOptions {
  postId: string;
  ventureId: string;
  content?: string;
  mediaUrls?: string[];
  accountIds?: string[];
  scheduledAt?: Date | null;
  platformOptions?: PlatformPostOptions;
  tags?: string[];
  userId: string;
}

export interface MediaMetadataInput {
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationMs?: number;
  sizeBytes: number;
  altText?: string;
}

export interface PlatformPostOptions {
  twitter?: {
    replyToId?: string;
    quoteTweetId?: string;
    pollOptions?: string[];
    pollDuration?: number;         // minutes, default 1440
    threadMode?: boolean;          // auto-split long content into thread
    threadSeparator?: string;      // custom thread split marker
    superFollowersOnly?: boolean;
  };
  facebook?: {
    linkUrl?: string;
    targeting?: {
      geoLocations?: { countries: string[] };
      ageMin?: number;
      ageMax?: number;
    };
    publishAsStory?: boolean;
    backdateTime?: Date;
    scheduledPublishTime?: Date;
  };
  instagram?: {
    caption?: string;              // Override content as caption
    location?: string;
    locationId?: string;
    carouselItems?: string[];
    publishAsReel?: boolean;
    coverUrl?: string;             // Reel cover image
    shareToFeed?: boolean;         // Share reel to feed
    collaborators?: string[];      // Collab post @handles
  };
  linkedin?: {
    visibility?: 'PUBLIC' | 'CONNECTIONS';
    articleUrl?: string;
    articleTitle?: string;
    articleDescription?: string;
    companyPageId?: string;        // Post as company instead of person
  };
  tiktok?: {
    privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
    disableComment?: boolean;
    disableDuet?: boolean;
    disableStitch?: boolean;
    videoCoverTimestampMs?: number;
    brandContentToggle?: boolean;
    brandOrganicToggle?: boolean;
  };
  youtube?: {
    title: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
    privacyStatus?: 'public' | 'unlisted' | 'private';
    madeForKids?: boolean;
    playlistIds?: string[];
    thumbnailUrl?: string;
    language?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE & ACCOUNT
// ═══════════════════════════════════════════════════════════════════════════════

export interface SocialProfile {
  id: string;
  name: string;
  username: string | null;
  pictureUrl: string | null;
  profileUrl: string | null;
  followerCount?: number;
  followingCount?: number;
  bio?: string;
  isVerified?: boolean;
}

export interface AccountAnalytics {
  accountId: string;
  provider: SocialProvider;
  followers: number;
  following: number;
  postsCount: number;
  engagementRate: number;
  followerGrowth: number;          // delta since last snapshot
  followerGrowthPercent: number;
  impressions: number;
  reach: number;
  profileViews: number;
  websiteClicks: number;
  period: { start: Date; end: Date };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INBOX
// ═══════════════════════════════════════════════════════════════════════════════

export interface InboxFilters {
  accountId?: string;
  accountIds?: string[];
  provider?: SocialProvider;
  type?: SocialInteractionType | SocialInteractionType[];
  unreadOnly?: boolean;
  isArchived?: boolean;
  sentiment?: 'positive' | 'negative' | 'neutral';
  search?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'occurredAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface InboxStats {
  total: number;
  unread: number;
  byType: Record<SocialInteractionType, number>;
  byProvider: Record<SocialProvider, number>;
  bySentiment: { positive: number; negative: number; neutral: number; unknown: number };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

export interface SocialAnalytics {
  followers: number;
  following: number;
  postsCount: number;
  engagementRate: number;
  impressions: number;
  reach: number;
  period: { start: Date; end: Date };
}

export interface PostAnalytics {
  externalPostId: string;
  provider: SocialProvider;
  impressions: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  saves: number;
  reachEstimate: number;
  videoViews?: number;
  videoWatchTimeMs?: number;
  fetchedAt: Date;
}

export interface EngagementTimeline {
  dataPoints: Array<{
    date: string;             // ISO date string
    impressions: number;
    engagements: number;
    followers: number;
    posts: number;
  }>;
  period: { start: Date; end: Date };
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface TopPost {
  postId: string;
  externalPostId: string;
  provider: SocialProvider;
  accountName: string;
  content: string;
  publishedAt: Date;
  impressions: number;
  engagements: number;
  engagementRate: number;
  externalUrl: string;
}

export interface BestPostingTime {
  dayOfWeek: number;           // 0=Sunday, 6=Saturday
  hour: number;                // 0-23
  avgEngagement: number;
  avgImpressions: number;
  sampleSize: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT ADAPTATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface ContentAdaptationResult {
  provider: SocialProvider;
  originalContent: string;
  adaptedContent: string;
  truncated: boolean;
  characterCount: number;
  characterLimit: number;
  warnings: ContentValidationWarning[];
  hashtags: string[];
  mentions: string[];
}

export interface ContentValidationResult {
  isValid: boolean;
  errors: ContentValidationError[];
  warnings: ContentValidationWarning[];
}

export interface ContentValidationError {
  code: string;
  message: string;
  provider: SocialProvider;
  field: string;
}

export interface ContentValidationWarning {
  code: string;
  message: string;
  provider: SocialProvider;
  suggestion?: string;
}

export interface ThreadPart {
  index: number;
  content: string;
  characterCount: number;
  isFirst: boolean;
  isLast: boolean;
  continuationIndicator: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

export interface MediaProcessingResult {
  provider: SocialProvider;
  originalUrl: string;
  processedUrl: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  wasResized: boolean;
  wasConverted: boolean;
  wasCompressed: boolean;
}

export interface MediaValidationResult {
  isValid: boolean;
  errors: Array<{
    code: string;
    message: string;
    provider: SocialProvider;
    constraint: string;
    actual: string | number;
    limit: string | number;
  }>;
}

export interface MediaMetadata {
  width: number;
  height: number;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number;        // video only
  codec?: string;             // video only
  bitrate?: number;           // video only
  fps?: number;               // video only
  hasAudio?: boolean;         // video only
  orientation?: number;       // EXIF orientation
}

export interface PlatformMediaRequirements {
  provider: SocialProvider;
  images: {
    maxCount: number;
    maxSizeBytes: number;
    maxWidth: number;
    maxHeight: number;
    minWidth: number;
    minHeight: number;
    aspectRatioRange: { min: number; max: number };
    supportedFormats: string[];
    recommendedSize: { width: number; height: number };
  };
  videos: {
    maxCount: number;
    maxSizeBytes: number;
    maxDurationMs: number;
    minDurationMs: number;
    maxWidth: number;
    maxHeight: number;
    supportedFormats: string[];
    maxBitrate: number;
    recommendedSize: { width: number; height: number };
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════════════

export interface RateLimitStatus {
  provider: SocialProvider;
  accountId: string;
  endpoint: string;
  remaining: number;
  limit: number;
  resetsAt: Date;
  isLimited: boolean;
}

export interface RateLimitConfig {
  provider: SocialProvider;
  endpoints: Record<string, {
    limit: number;
    windowMs: number;
    description: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER HEALTH
// ═══════════════════════════════════════════════════════════════════════════════

export interface ProviderHealthStatus {
  provider: SocialProvider;
  isHealthy: boolean;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  errorRate: number;              // 0.0 - 1.0
  lastSuccessAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorMessage: string | null;
  consecutiveErrors: number;
  checkedAt: Date;
}

export interface ProviderHealthReport {
  providers: ProviderHealthStatus[];
  overallHealthy: boolean;
  generatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOK
// ═══════════════════════════════════════════════════════════════════════════════

export interface WebhookEvent {
  provider: SocialProvider;
  eventType: string;
  accountId: string;
  payload: unknown;
  receivedAt: Date;
  signature: string;
  isVerified: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export interface SocialDashboardData {
  posts: PostStats;
  interactions: InteractionStats;
  accounts: Array<Omit<SocialAccount, 'accessToken' | 'refreshToken'>>;
  topPosts: TopPost[];
  engagementTimeline: EngagementTimeline;
  bestPostingTimes: BestPostingTime[];
  providerHealth: ProviderHealthReport;
}

export interface PostStats {
  totalPosts: number;
  published: number;
  scheduled: number;
  draft: number;
  failed: number;
  publishedThisPeriod: number;
  avgEngagementRate: number;
}

export interface InteractionStats {
  totalInteractions: number;
  unread: number;
  comments: number;
  mentions: number;
  dms: number;
  replies: number;
  reactions: number;
  avgResponseTimeMs: number;       // average time to reply
  responseRate: number;            // % of interactions replied to
}
```

---

## Service Implementation

### Account Service

```typescript
// @mcv/connectors/social/services/account.service.ts
import { db, eq, and, lt } from '@mcv/db';
import { socialAccounts } from '../schema';
import { oauthService } from '@mcv/connectors/oauth';
import { SecretManagerService } from '@mcv/secrets';
import { auditLog } from '@mcv/audit';
import { eventBus } from '@mcv/events';
import type { SocialProvider, SocialProfile } from '../types';

const PROVIDER_SCOPES: Record<SocialProvider, string[]> = {
  twitter:   ['tweet.read', 'tweet.write', 'users.read', 'dm.read', 'dm.write', 'offline.access'],
  facebook:  ['pages_manage_posts', 'pages_read_engagement', 'pages_messaging', 'pages_read_user_content'],
  instagram: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_comments', 'instagram_manage_insights'],
  linkedin:  ['w_member_social', 'r_liteprofile', 'r_emailaddress', 'w_organization_social'],
  tiktok:    ['video.publish', 'video.list', 'user.info.basic'],
  youtube:   ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
};

export class SocialAccountService {
  private secretManager: SecretManagerService;

  constructor() {
    this.secretManager = new SecretManagerService();
  }

  /**
   * Initiate OAuth connection for a social provider.
   *
   * Maps platform-specific providers to their OAuth provider:
   * - instagram → meta (Facebook & Instagram share the same OAuth flow)
   * - All others → direct provider name
   *
   * @param ventureId - Target venture UUID
   * @param provider - Social platform to connect
   * @param userId - User initiating the connection
   * @returns Authorization URL to redirect the user to, and state for CSRF protection
   */
  async initiateConnection(
    ventureId: string,
    provider: SocialProvider,
    userId: string
  ): Promise<{ authorizationUrl: string; state: string }> {
    // Enforce account limits
    const existingCount = await db.query.socialAccounts.findMany({
      where: eq(socialAccounts.ventureId, ventureId),
    });
    if (existingCount.length >= (parseInt(process.env.SOCIAL_MAX_ACCOUNTS_PER_VENTURE ?? '25'))) {
      throw new Error('MAX_ACCOUNTS_REACHED');
    }

    const oauthProvider = provider === 'instagram' ? 'meta' : provider;
    const scopes = PROVIDER_SCOPES[provider];

    const result = await oauthService.getAuthorizationUrl(ventureId, oauthProvider, {
      scopes,
      userId,
      metadata: { socialProvider: provider },
    });

    await auditLog({
      ventureId, action: 'social.connection_initiated',
      resourceType: 'social_account', userId,
      details: { provider },
    });

    return { authorizationUrl: result.url, state: result.state };
  }

  /**
   * Complete OAuth callback, fetch profile, create/update account record.
   *
   * Handles reconnection gracefully — if the same provider+providerAccountId
   * already exists for this venture, tokens are updated and status is restored
   * to 'active'.
   *
   * @param ventureId - Target venture UUID
   * @param provider - Social platform being connected
   * @param code - OAuth authorization code from callback
   * @param state - OAuth state for CSRF verification
   * @param userId - User completing the connection
   * @returns Created or updated account ID
   */
  async completeConnection(
    ventureId: string,
    provider: SocialProvider,
    code: string,
    state: string,
    userId: string
  ): Promise<{ accountId: string; isReconnection: boolean }> {
    const oauthProvider = provider === 'instagram' ? 'meta' : provider;

    const tokenResult = await oauthService.exchangeCodeForTokens(
      ventureId, oauthProvider, code, state
    );

    const profile = await this.fetchProviderProfile(provider, tokenResult);

    // Encrypt tokens for storage — never store plaintext
    const encryptedAccessToken = await this.secretManager.encrypt(tokenResult.accessToken);
    const encryptedRefreshToken = tokenResult.refreshToken
      ? await this.secretManager.encrypt(tokenResult.refreshToken) : null;

    // Upsert: reconnecting an existing account updates tokens
    const existing = await db.query.socialAccounts.findFirst({
      where: and(
        eq(socialAccounts.ventureId, ventureId),
        eq(socialAccounts.provider, provider),
        eq(socialAccounts.providerAccountId, profile.id),
      ),
    });

    let accountId: string;
    let isReconnection = false;

    if (existing) {
      await db.update(socialAccounts).set({
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: tokenResult.expiresAt,
        scopes: PROVIDER_SCOPES[provider],
        name: profile.name,
        username: profile.username,
        profilePictureUrl: profile.pictureUrl,
        profileUrl: profile.profileUrl,
        status: 'active',
        consecutiveErrors: 0,
        lastErrorAt: null,
        lastErrorMessage: null,
        updatedAt: new Date(),
      }).where(eq(socialAccounts.id, existing.id));
      accountId = existing.id;
      isReconnection = true;
    } else {
      const [account] = await db.insert(socialAccounts).values({
        ventureId, provider,
        providerAccountId: profile.id,
        name: profile.name,
        username: profile.username,
        profilePictureUrl: profile.pictureUrl,
        profileUrl: profile.profileUrl,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: tokenResult.expiresAt,
        scopes: PROVIDER_SCOPES[provider],
        status: 'active',
        createdBy: userId,
      }).returning();
      accountId = account.id;
    }

    await auditLog({
      ventureId, action: 'social.account_connected',
      resourceType: 'social_account', resourceId: accountId,
      userId, details: { provider, username: profile.username, isReconnection },
    });

    await eventBus.publish('social.account.connected', {
      ventureId, accountId, provider, username: profile.username, isReconnection,
    });

    return { accountId, isReconnection };
  }

  /**
   * Disconnect a social account (soft delete — marks as disconnected).
   * Revokes OAuth tokens at the provider level when possible.
   */
  async disconnect(ventureId: string, accountId: string, userId: string): Promise<void> {
    const account = await db.query.socialAccounts.findFirst({
      where: and(eq(socialAccounts.id, accountId), eq(socialAccounts.ventureId, ventureId)),
    });
    if (!account) throw new Error('ACCOUNT_NOT_FOUND');

    // Attempt to revoke token at provider (best-effort)
    try {
      const accessToken = await this.secretManager.decrypt(account.accessToken);
      await this.revokeProviderToken(account.provider as SocialProvider, accessToken);
    } catch {
      // Token revocation is best-effort — continue with disconnect
    }

    await db.update(socialAccounts)
      .set({ status: 'disconnected', updatedAt: new Date() })
      .where(eq(socialAccounts.id, accountId));

    await auditLog({
      ventureId, action: 'social.account_disconnected',
      resourceType: 'social_account', resourceId: accountId, userId,
      details: { provider: account.provider },
    });

    await eventBus.publish('social.account.disconnected', {
      ventureId, accountId, provider: account.provider,
    });
  }

  /**
   * Hard-delete account and cascade all related data.
   * Only available to venture admins.
   */
  async deleteAccount(ventureId: string, accountId: string, userId: string): Promise<void> {
    await this.disconnect(ventureId, accountId, userId);

    // Cascade delete handled by FK constraints (onDelete: 'cascade')
    await db.delete(socialAccounts)
      .where(and(eq(socialAccounts.id, accountId), eq(socialAccounts.ventureId, ventureId)));

    await auditLog({
      ventureId, action: 'social.account_deleted',
      resourceType: 'social_account', resourceId: accountId, userId,
    });
  }

  /**
   * Refresh expired tokens for an account.
   * Called by the token refresh scheduler and on-demand when token errors occur.
   *
   * Updates consecutiveErrors on failure; marks account as 'expired' after
   * 5 consecutive refresh failures.
   */
  async refreshTokens(accountId: string): Promise<void> {
    const account = await db.query.socialAccounts.findFirst({
      where: eq(socialAccounts.id, accountId),
    });
    if (!account) throw new Error('ACCOUNT_NOT_FOUND');
    if (!account.refreshToken) throw new Error('NO_REFRESH_TOKEN');

    try {
      const decryptedRefresh = await this.secretManager.decrypt(account.refreshToken);
      const oauthProvider = account.provider === 'instagram' ? 'meta' : account.provider;

      const newTokens = await oauthService.refreshAccessToken(oauthProvider, decryptedRefresh);

      const encryptedAccess = await this.secretManager.encrypt(newTokens.accessToken);
      const encryptedRefresh = newTokens.refreshToken
        ? await this.secretManager.encrypt(newTokens.refreshToken) : account.refreshToken;

      await db.update(socialAccounts).set({
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: newTokens.expiresAt,
        status: 'active',
        consecutiveErrors: 0,
        updatedAt: new Date(),
      }).where(eq(socialAccounts.id, accountId));

      await auditLog({
        ventureId: account.ventureId, action: 'social.account_token_refreshed',
        resourceType: 'social_account', resourceId: accountId,
        details: { provider: account.provider },
      });
    } catch (error) {
      const newErrorCount = (account.consecutiveErrors ?? 0) + 1;
      const newStatus = newErrorCount >= 5 ? 'expired' : account.status;

      await db.update(socialAccounts).set({
        consecutiveErrors: newErrorCount,
        lastErrorAt: new Date(),
        lastErrorMessage: (error as Error).message,
        status: newStatus as any,
        updatedAt: new Date(),
      }).where(eq(socialAccounts.id, accountId));

      await auditLog({
        ventureId: account.ventureId, action: 'social.account_token_expired',
        resourceType: 'social_account', resourceId: accountId,
        details: { provider: account.provider, error: (error as Error).message, consecutiveErrors: newErrorCount },
      });

      if (newStatus === 'expired') {
        await eventBus.publish('social.account.expired', {
          ventureId: account.ventureId, accountId, provider: account.provider,
        });
      }

      throw error;
    }
  }

  /**
   * Batch-refresh all tokens expiring within the buffer window.
   * Called by the cron scheduler (every 6 hours recommended).
   */
  async refreshExpiringTokens(): Promise<{ refreshed: number; failed: number }> {
    const bufferHours = parseInt(process.env.SOCIAL_TOKEN_REFRESH_BUFFER_HOURS ?? '24');
    const bufferDate = new Date(Date.now() + bufferHours * 60 * 60 * 1000);

    const expiring = await db.query.socialAccounts.findMany({
      where: and(
        eq(socialAccounts.status, 'active'),
        lt(socialAccounts.tokenExpiresAt, bufferDate),
      ),
    });

    let refreshed = 0;
    let failed = 0;

    for (const account of expiring) {
      try {
        await this.refreshTokens(account.id);
        refreshed++;
      } catch {
        failed++;
      }
    }

    return { refreshed, failed };
  }

  // ─── PROVIDER PROFILE FETCHING ──────────────────────────────────────────────

  private async fetchProviderProfile(
    provider: SocialProvider, tokenResult: any
  ): Promise<SocialProfile> {
    switch (provider) {
      case 'twitter':
        return {
          id: tokenResult.userInfo?.id,
          name: tokenResult.userInfo?.name,
          username: `@${tokenResult.userInfo?.username}`,
          pictureUrl: tokenResult.userInfo?.profile_image_url,
          profileUrl: `https://x.com/${tokenResult.userInfo?.username}`,
          followerCount: tokenResult.userInfo?.public_metrics?.followers_count,
          isVerified: tokenResult.userInfo?.verified,
        };
      case 'facebook':
        return {
          id: tokenResult.userInfo?.id,
          name: tokenResult.userInfo?.name,
          username: tokenResult.userInfo?.username ?? null,
          pictureUrl: tokenResult.userInfo?.picture?.data?.url ?? tokenResult.userInfo?.picture,
          profileUrl: `https://facebook.com/${tokenResult.userInfo?.id}`,
        };
      case 'instagram':
        return {
          id: tokenResult.userInfo?.id,
          name: tokenResult.userInfo?.name,
          username: `@${tokenResult.userInfo?.username}`,
          pictureUrl: tokenResult.userInfo?.profile_picture_url,
          profileUrl: `https://instagram.com/${tokenResult.userInfo?.username}`,
          followerCount: tokenResult.userInfo?.followers_count,
        };
      case 'linkedin':
        return {
          id: tokenResult.userInfo?.sub,
          name: tokenResult.userInfo?.name,
          username: null,
          pictureUrl: tokenResult.userInfo?.picture,
          profileUrl: `https://linkedin.com/in/${tokenResult.userInfo?.vanityName}`,
        };
      case 'tiktok':
        return {
          id: tokenResult.userInfo?.open_id,
          name: tokenResult.userInfo?.display_name,
          username: `@${tokenResult.userInfo?.username}`,
          pictureUrl: tokenResult.userInfo?.avatar_url,
          profileUrl: `https://tiktok.com/@${tokenResult.userInfo?.username}`,
          followerCount: tokenResult.userInfo?.follower_count,
        };
      case 'youtube':
        return {
          id: tokenResult.userInfo?.id,
          name: tokenResult.userInfo?.snippet?.title,
          username: tokenResult.userInfo?.snippet?.customUrl ?? null,
          pictureUrl: tokenResult.userInfo?.snippet?.thumbnails?.default?.url,
          profileUrl: `https://youtube.com/${tokenResult.userInfo?.snippet?.customUrl ?? `channel/${tokenResult.userInfo?.id}`}`,
        };
      default:
        return {
          id: tokenResult.userInfo?.id,
          name: tokenResult.userInfo?.name ?? 'Unknown',
          username: null, pictureUrl: null, profileUrl: null,
        };
    }
  }

  /**
   * Best-effort token revocation at the provider level.
   */
  private async revokeProviderToken(provider: SocialProvider, accessToken: string): Promise<void> {
    switch (provider) {
      case 'twitter': {
        const { TwitterApi } = await import('twitter-api-v2');
        const client = new TwitterApi(accessToken);
        await client.revokeOAuth2Token(accessToken, 'access_token');
        break;
      }
      case 'facebook':
      case 'instagram': {
        await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`, {
          method: 'DELETE',
        });
        break;
      }
      // LinkedIn, TikTok, YouTube: no standardized revocation endpoint via API
    }
  }
}

export const socialAccountService = new SocialAccountService();
```

---

## Post Service

```typescript
// @mcv/connectors/social/services/post.service.ts
import { db, eq, and, lte, sql } from '@mcv/db';
import { socialPosts, socialPostExecutions, socialAccounts } from '../schema';
import { SecretManagerService } from '@mcv/secrets';
import { auditLog } from '@mcv/audit';
import { eventBus } from '@mcv/events';
import { contentAdaptationService } from './content-adaptation.service';
import { mediaProcessingService } from './media-processing.service';
import { rateLimitService } from './rate-limit.service';
import { providerHealthService } from './provider-health.service';
import type { SocialProvider, SocialAccount, SocialPost, CreatePostOptions, UpdatePostOptions } from '../types';

export class PostService {
  private secretManager: SecretManagerService;

  constructor() {
    this.secretManager = new SecretManagerService();
  }

  /**
   * Create a post (draft or scheduled). Creates execution records per target account.
   *
   * If scheduledAt is provided, the post enters 'scheduled' state and will be
   * published by the cron scheduler when the time arrives.
   *
   * Content is validated against all target platforms on creation. Invalid
   * content produces warnings but does not block creation (adaptation happens
   * at publish time).
   */
  async createPost(options: CreatePostOptions): Promise<{ postId: string; warnings: string[] }> {
    const status = options.scheduledAt ? 'scheduled' : 'draft';

    // Validate all target accounts exist and are active
    const accounts = await this.resolveAndValidateAccounts(options.ventureId, options.accountIds);

    // Pre-validate content for each provider (non-blocking, returns warnings)
    const warnings: string[] = [];
    for (const account of accounts) {
      const validation = contentAdaptationService.validateContent(
        options.content, account.provider as SocialProvider
      );
      for (const warn of validation.warnings) {
        warnings.push(`${account.provider}: ${warn.message}`);
      }
    }

    const [post] = await db.insert(socialPosts).values({
      ventureId: options.ventureId,
      content: options.content,
      mediaUrls: options.mediaUrls ?? [],
      accountIds: options.accountIds,
      scheduledAt: options.scheduledAt,
      status,
      platformOptions: options.platformOptions ?? {},
      tags: options.tags ?? [],
      campaignId: options.campaignId,
      createdBy: options.userId,
    }).returning();

    // Create per-account execution records
    for (const account of accounts) {
      await db.insert(socialPostExecutions).values({
        postId: post.id,
        accountId: account.id,
        provider: account.provider,
        status: 'draft',
      });
    }

    await auditLog({
      ventureId: options.ventureId, action: 'social.post_created',
      resourceType: 'social_post', resourceId: post.id,
      userId: options.userId,
      details: { accountCount: options.accountIds.length, status, scheduledAt: options.scheduledAt },
    });

    await eventBus.publish('social.post.created', {
      ventureId: options.ventureId, postId: post.id, status,
    });

    return { postId: post.id, warnings };
  }

  /**
   * Update a draft or scheduled post. Only modifiable before publishing.
   */
  async updatePost(options: UpdatePostOptions): Promise<void> {
    const post = await db.query.socialPosts.findFirst({
      where: and(eq(socialPosts.id, options.postId), eq(socialPosts.ventureId, options.ventureId)),
    });
    if (!post) throw new Error('POST_NOT_FOUND');
    if (post.status === 'published' || post.status === 'publishing') {
      throw new Error('POST_ALREADY_PUBLISHED');
    }

    const updates: Partial<SocialPost> = { updatedAt: new Date() };
    if (options.content !== undefined) updates.content = options.content;
    if (options.mediaUrls !== undefined) updates.mediaUrls = options.mediaUrls;
    if (options.scheduledAt !== undefined) {
      updates.scheduledAt = options.scheduledAt;
      updates.status = options.scheduledAt ? 'scheduled' : 'draft';
    }
    if (options.platformOptions !== undefined) updates.platformOptions = options.platformOptions;
    if (options.tags !== undefined) updates.tags = options.tags;

    await db.update(socialPosts).set(updates).where(eq(socialPosts.id, options.postId));

    // If accountIds changed, reconcile execution records
    if (options.accountIds) {
      const accounts = await this.resolveAndValidateAccounts(options.ventureId, options.accountIds);

      // Delete executions for removed accounts
      const existingExecs = await db.query.socialPostExecutions.findMany({
        where: eq(socialPostExecutions.postId, options.postId),
      });
      for (const exec of existingExecs) {
        if (!options.accountIds.includes(exec.accountId)) {
          await db.delete(socialPostExecutions).where(eq(socialPostExecutions.id, exec.id));
        }
      }
      // Add executions for new accounts
      const existingAccountIds = existingExecs.map(e => e.accountId);
      for (const account of accounts) {
        if (!existingAccountIds.includes(account.id)) {
          await db.insert(socialPostExecutions).values({
            postId: options.postId, accountId: account.id, provider: account.provider, status: 'draft',
          });
        }
      }
      await db.update(socialPosts)
        .set({ accountIds: options.accountIds })
        .where(eq(socialPosts.id, options.postId));
    }

    await auditLog({
      ventureId: options.ventureId, action: 'social.post_updated',
      resourceType: 'social_post', resourceId: options.postId, userId: options.userId,
    });
  }

  /**
   * Publish a post immediately to all target accounts.
   * Each account publishes independently — partial success is possible.
   *
   * Publishing pipeline per execution:
   * 1. Check account status (active?)
   * 2. Check provider health (degraded/down?)
   * 3. Check rate limit quota (within limits?)
   * 4. Adapt content for provider (truncate, hashtags, etc.)
   * 5. Process media for provider (resize, convert)
   * 6. Call provider API
   * 7. Update execution status
   * 8. Consume rate limit quota
   * 9. Report provider health
   */
  async publishPost(ventureId: string, postId: string): Promise<{
    published: number; failed: number; errors: string[];
  }> {
    const post = await db.query.socialPosts.findFirst({
      where: and(eq(socialPosts.id, postId), eq(socialPosts.ventureId, ventureId)),
    });
    if (!post) throw new Error('POST_NOT_FOUND');
    if (post.status === 'published') throw new Error('POST_ALREADY_PUBLISHED');

    // Lock the post
    await db.update(socialPosts)
      .set({ status: 'publishing', updatedAt: new Date() })
      .where(eq(socialPosts.id, postId));

    const executions = await db.query.socialPostExecutions.findMany({
      where: and(
        eq(socialPostExecutions.postId, postId),
        eq(socialPostExecutions.status, 'draft'),
      ),
    });

    let published = 0;
    let failed = 0;
    const errors: string[] = [];

    // Publish to all accounts concurrently
    const results = await Promise.allSettled(
      executions.map(exec => this.publishExecution(exec, post))
    );

    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'fulfilled') {
        published++;
      } else {
        failed++;
        const reason = (results[i] as PromiseRejectedResult).reason;
        errors.push(`${executions[i].provider}: ${reason.message}`);
      }
    }

    // Determine overall post status
    let postStatus: string;
    if (published === executions.length) {
      postStatus = 'published';
    } else if (published === 0) {
      postStatus = 'failed';
    } else {
      postStatus = 'partial';
    }

    await db.update(socialPosts).set({
      status: postStatus as any,
      publishedAt: published > 0 ? new Date() : undefined,
      error: errors.length > 0 ? errors.join('; ') : null,
      updatedAt: new Date(),
    }).where(eq(socialPosts.id, postId));

    await auditLog({
      ventureId, action: 'social.post_published',
      resourceType: 'social_post', resourceId: postId,
      details: { published, failed, errors },
    });

    await eventBus.publish('social.post.published', {
      ventureId, postId, published, failed, status: postStatus,
    });

    return { published, failed, errors };
  }

  /**
   * Retry failed executions for a post.
   */
  async retryPost(ventureId: string, postId: string): Promise<{ retried: number }> {
    const failedExecs = await db.query.socialPostExecutions.findMany({
      where: and(
        eq(socialPostExecutions.postId, postId),
        eq(socialPostExecutions.status, 'failed'),
      ),
    });

    const post = await db.query.socialPosts.findFirst({
      where: and(eq(socialPosts.id, postId), eq(socialPosts.ventureId, ventureId)),
    });
    if (!post) throw new Error('POST_NOT_FOUND');

    let retried = 0;
    for (const exec of failedExecs) {
      if ((exec.retryCount ?? 0) >= (exec.maxRetries ?? 3)) continue;

      try {
        await this.publishExecution(exec, post);
        retried++;
      } catch {
        // Already handled inside publishExecution
      }
    }

    return { retried };
  }

  /**
   * Process scheduled posts (called by cron scheduler).
   * Uses FOR UPDATE SKIP LOCKED to prevent duplicate processing
   * in multi-instance deployments.
   */
  async processScheduledPosts(): Promise<{ processed: number; failed: number }> {
    const duePosts = await db.execute(sql`
      SELECT * FROM social_posts
      WHERE status = 'scheduled'
      AND scheduled_at <= NOW()
      ORDER BY scheduled_at ASC
      LIMIT 50
      FOR UPDATE SKIP LOCKED
    `);

    let processed = 0;
    let failed = 0;

    for (const post of duePosts.rows as any[]) {
      try {
        await this.publishPost(post.venture_id, post.id);
        processed++;
      } catch (error) {
        failed++;
        await db.update(socialPosts)
          .set({ status: 'failed', error: (error as Error).message, updatedAt: new Date() })
          .where(eq(socialPosts.id, post.id));
      }
    }

    return { processed, failed };
  }

  // ─── PRIVATE: EXECUTION PUBLISHING ──────────────────────────────────────────

  private async publishExecution(
    execution: typeof socialPostExecutions.$inferSelect,
    post: typeof socialPosts.$inferSelect,
  ): Promise<void> {
    const account = await db.query.socialAccounts.findFirst({
      where: eq(socialAccounts.id, execution.accountId),
    });
    if (!account || account.status !== 'active') {
      await this.updateExecutionFailed(execution.id, 'ACCOUNT_NOT_ACTIVE', 'Account not active');
      throw new Error('Account not active');
    }

    const provider = account.provider as SocialProvider;

    // Check provider health
    if (!providerHealthService.isProviderHealthy(provider)) {
      await this.updateExecutionFailed(execution.id, 'PROVIDER_UNHEALTHY', 'Provider is degraded or down');
      throw new Error('Provider is degraded or down');
    }

    // Check rate limit
    const rateLimitOk = await rateLimitService.checkRateLimit(provider, account.id, 'post.create');
    if (!rateLimitOk) {
      const retryAfter = await rateLimitService.getRetryAfter(provider, account.id, 'post.create');
      await db.update(socialPostExecutions).set({
        nextRetryAt: retryAfter,
        retryCount: sql`retry_count + 1`,
        updatedAt: new Date(),
      }).where(eq(socialPostExecutions.id, execution.id));
      throw new Error('PROVIDER_RATE_LIMITED');
    }

    try {
      // Adapt content for this provider
      const adapted = contentAdaptationService.adaptContent(post.content ?? '', provider);
      const adaptedText = adapted.adaptedContent;

      // Decrypt access token
      const accessToken = await this.secretManager.decrypt(account.accessToken);

      // Call provider API
      const { externalId, externalUrl } = await this.publishToProvider(
        provider, accessToken, account, post, adaptedText
      );

      // Update execution as published
      await db.update(socialPostExecutions).set({
        status: 'published',
        externalPostId: externalId,
        externalPostUrl: externalUrl,
        adaptedContent: adaptedText,
        publishedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(socialPostExecutions.id, execution.id));

      // Consume rate limit and report health
      await rateLimitService.consumeRateLimit(provider, account.id, 'post.create');
      providerHealthService.reportProviderSuccess(provider);

    } catch (error) {
      const retryCount = (execution.retryCount ?? 0) + 1;
      const maxRetries = execution.maxRetries ?? 3;

      await db.update(socialPostExecutions).set({
        status: 'failed',
        error: (error as Error).message,
        errorCode: this.classifyError(error as Error),
        retryCount,
        nextRetryAt: retryCount < maxRetries
          ? new Date(Date.now() + Math.pow(2, retryCount) * 1000) : null,
        updatedAt: new Date(),
      }).where(eq(socialPostExecutions.id, execution.id));

      providerHealthService.reportProviderError(provider, (error as Error).message);
      throw error;
    }
  }

  // ─── PROVIDER ADAPTERS ──────────────────────────────────────────────────────

  private async publishToProvider(
    provider: SocialProvider,
    accessToken: string,
    account: SocialAccount,
    post: SocialPost,
    adaptedContent: string,
  ): Promise<{ externalId: string; externalUrl: string }> {
    switch (provider) {
      case 'twitter':   return this.publishToTwitter(accessToken, post, adaptedContent);
      case 'facebook':  return this.publishToFacebook(accessToken, account.providerAccountId, post, adaptedContent);
      case 'instagram': return this.publishToInstagram(accessToken, account.providerAccountId, post, adaptedContent);
      case 'linkedin':  return this.publishToLinkedIn(accessToken, account.providerAccountId, post, adaptedContent);
      case 'tiktok':    return this.publishToTikTok(accessToken, account.providerAccountId, post, adaptedContent);
      case 'youtube':   return this.publishToYouTube(accessToken, account.providerAccountId, post, adaptedContent);
      default: throw new Error(`Provider ${provider} not yet implemented`);
    }
  }

  private async publishToTwitter(
    accessToken: string, post: SocialPost, adaptedContent: string
  ): Promise<{ externalId: string; externalUrl: string }> {
    const { TwitterApi } = await import('twitter-api-v2');
    const client = new TwitterApi(accessToken);
    const options = post.platformOptions as any;

    // Handle thread mode — split long content into multiple tweets
    if (options?.twitter?.threadMode && adaptedContent.length > 280) {
      const parts = contentAdaptationService.splitIntoThread(adaptedContent, 280);
      let previousId: string | undefined;
      let firstId: string | undefined;

      for (const part of parts) {
        const params: any = { text: part.content };
        if (previousId) {
          params.reply = { in_reply_to_tweet_id: previousId };
        }
        const result = await client.v2.tweet(params);
        previousId = result.data.id;
        if (!firstId) firstId = result.data.id;
      }

      return {
        externalId: firstId!,
        externalUrl: `https://x.com/i/status/${firstId}`,
      };
    }

    // Single tweet
    const params: any = { text: adaptedContent };

    if (post.mediaUrls && post.mediaUrls.length > 0) {
      const mediaIds: string[] = [];
      for (const url of post.mediaUrls.slice(0, 4)) {
        const mediaId = await client.v1.uploadMedia(url);
        mediaIds.push(mediaId);
      }
      params.media = { media_ids: mediaIds };
    }

    if (options?.twitter?.pollOptions) {
      params.poll = {
        options: options.twitter.pollOptions,
        duration_minutes: options.twitter.pollDuration ?? 1440,
      };
    }

    if (options?.twitter?.replyToId) {
      params.reply = { in_reply_to_tweet_id: options.twitter.replyToId };
    }

    if (options?.twitter?.quoteTweetId) {
      params.quote_tweet_id = options.twitter.quoteTweetId;
    }

    const result = await client.v2.tweet(params);
    return {
      externalId: result.data.id,
      externalUrl: `https://x.com/i/status/${result.data.id}`,
    };
  }

  private async publishToFacebook(
    accessToken: string, pageId: string, post: SocialPost, adaptedContent: string
  ): Promise<{ externalId: string; externalUrl: string }> {
    const options = post.platformOptions as any;

    if (post.mediaUrls && post.mediaUrls.length > 0) {
      if (post.mediaUrls.length === 1) {
        const photoUrl = `https://graph.facebook.com/v18.0/${pageId}/photos`;
        const response = await fetch(photoUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: post.mediaUrls[0], caption: adaptedContent, access_token: accessToken,
          }),
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return {
          externalId: data.id,
          externalUrl: `https://facebook.com/${data.id}`,
        };
      }

      // Multiple photos: upload individually, then create multi-photo post
      const photoIds: string[] = [];
      for (const url of post.mediaUrls) {
        const resp = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url, published: false, access_token: accessToken,
          }),
        });
        const photoData = await resp.json();
        if (photoData.error) throw new Error(photoData.error.message);
        photoIds.push(photoData.id);
      }

      const feedBody: any = {
        message: adaptedContent,
        access_token: accessToken,
      };
      photoIds.forEach((id, i) => {
        feedBody[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
      });

      const feedResp = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedBody),
      });
      const feedData = await feedResp.json();
      if (feedData.error) throw new Error(feedData.error.message);
      return {
        externalId: feedData.id,
        externalUrl: `https://facebook.com/${feedData.id}`,
      };
    }

    // Text-only post
    const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    const params: any = { message: adaptedContent, access_token: accessToken };
    if (options?.facebook?.linkUrl) params.link = options.facebook.linkUrl;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return {
      externalId: data.id,
      externalUrl: `https://facebook.com/${data.id}`,
    };
  }

  private async publishToInstagram(
    accessToken: string, igUserId: string, post: SocialPost, adaptedContent: string
  ): Promise<{ externalId: string; externalUrl: string }> {
    const options = post.platformOptions as any;
    const containerUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`;

    if (!post.mediaUrls || post.mediaUrls.length === 0) {
      throw new Error('Instagram requires at least one media item');
    }

    let containerId: string;

    if (post.mediaUrls.length === 1) {
      // Single image/video post
      const containerParams: any = {
        caption: adaptedContent,
        access_token: accessToken,
      };

      if (options?.instagram?.publishAsReel) {
        containerParams.media_type = 'REELS';
        containerParams.video_url = post.mediaUrls[0];
        if (options.instagram.coverUrl) {
          containerParams.cover_url = options.instagram.coverUrl;
        }
        if (options.instagram.shareToFeed !== false) {
          containerParams.share_to_feed = true;
        }
      } else {
        containerParams.image_url = post.mediaUrls[0];
      }

      if (options?.instagram?.locationId) {
        containerParams.location_id = options.instagram.locationId;
      }
      if (options?.instagram?.collaborators) {
        containerParams.collaborators = options.instagram.collaborators;
      }

      const resp = await fetch(containerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerParams),
      });
      const container = await resp.json();
      if (container.error) throw new Error(container.error.message);
      containerId = container.id;

    } else {
      // Carousel post (up to 10 items)
      const children: string[] = [];
      for (const url of post.mediaUrls.slice(0, 10)) {
        const childResp = await fetch(containerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: url, is_carousel_item: true, access_token: accessToken,
          }),
        });
        const child = await childResp.json();
        if (child.error) throw new Error(child.error.message);
        children.push(child.id);
      }

      const carouselResp = await fetch(containerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          caption: adaptedContent,
          children: children.join(','),
          access_token: accessToken,
        }),
      });
      const carousel = await carouselResp.json();
      if (carousel.error) throw new Error(carousel.error.message);
      containerId = carousel.id;
    }

    // Wait for container to be ready (Instagram processing is async)
    await this.waitForInstagramContainer(igUserId, containerId, accessToken);

    // Publish
    const publishResp = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
      }
    );
    const published = await publishResp.json();
    if (published.error) throw new Error(published.error.message);

    return {
      externalId: published.id,
      externalUrl: `https://instagram.com/p/${published.id}`,
    };
  }

  /**
   * Instagram media containers are processed asynchronously.
   * Poll until the container status is FINISHED (or timeout after 60s).
   */
  private async waitForInstagramContainer(
    igUserId: string, containerId: string, accessToken: string,
    maxWaitMs: number = 60_000
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const resp = await fetch(
        `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${accessToken}`
      );
      const data = await resp.json();
      if (data.status_code === 'FINISHED') return;
      if (data.status_code === 'ERROR') {
        throw new Error(`Instagram container processing failed: ${data.status_code}`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Instagram container processing timed out');
  }

  private async publishToLinkedIn(
    accessToken: string, personUrn: string, post: SocialPost, adaptedContent: string
  ): Promise<{ externalId: string; externalUrl: string }> {
    const options = post.platformOptions as any;
    const visibility = options?.linkedin?.visibility ?? 'PUBLIC';
    const authorUrn = options?.linkedin?.companyPageId
      ? `urn:li:organization:${options.linkedin.companyPageId}`
      : `urn:li:person:${personUrn}`;

    let shareMediaCategory = 'NONE';
    const media: any[] = [];

    // Upload media to LinkedIn if present
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      shareMediaCategory = 'IMAGE';
      for (const url of post.mediaUrls.slice(0, 9)) {
        // LinkedIn requires registering upload first, then uploading binary
        const registerResp = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: authorUrn,
              serviceRelationships: [{
                relationshipType: 'OWNER',
                identifier: 'urn:li:userGeneratedContent',
              }],
            },
          }),
        });
        const registerData = await registerResp.json();
        const asset = registerData.value?.asset;
        const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;

        if (uploadUrl) {
          // Download image and upload to LinkedIn
          const imageResp = await fetch(url);
          const imageBuffer = await imageResp.arrayBuffer();
          await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/octet-stream',
            },
            body: imageBuffer,
          });
          media.push({
            status: 'READY',
            description: { text: '' },
            media: asset,
            title: { text: '' },
          });
        }
      }
    }

    // Handle article link
    if (options?.linkedin?.articleUrl) {
      shareMediaCategory = 'ARTICLE';
      media.push({
        status: 'READY',
        originalUrl: options.linkedin.articleUrl,
        title: { text: options.linkedin.articleTitle ?? '' },
        description: { text: options.linkedin.articleDescription ?? '' },
      });
    }

    const body: any = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: adaptedContent },
          shareMediaCategory,
          media: media.length > 0 ? media : undefined,
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': visibility },
    };

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (data.status >= 400) throw new Error(data.message ?? 'LinkedIn API error');

    const postUrn = data.id ?? response.headers.get('x-restli-id');
    return {
      externalId: postUrn,
      externalUrl: `https://linkedin.com/feed/update/${postUrn}`,
    };
  }

  private async publishToTikTok(
    accessToken: string, openId: string, post: SocialPost, adaptedContent: string
  ): Promise<{ externalId: string; externalUrl: string }> {
    const options = post.platformOptions as any;

    if (!post.mediaUrls || post.mediaUrls.length === 0) {
      throw new Error('TikTok requires a video');
    }

    // Step 1: Initialize upload
    const initResp = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: adaptedContent,
          privacy_level: options?.tiktok?.privacyLevel ?? 'PUBLIC_TO_EVERYONE',
          disable_comment: options?.tiktok?.disableComment ?? false,
          disable_duet: options?.tiktok?.disableDuet ?? false,
          disable_stitch: options?.tiktok?.disableStitch ?? false,
          brand_content_toggle: options?.tiktok?.brandContentToggle ?? false,
          brand_organic_toggle: options?.tiktok?.brandOrganicToggle ?? false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: post.mediaUrls[0],
        },
      }),
    });
    const initData = await initResp.json();
    if (initData.error?.code !== 'ok') throw new Error(initData.error?.message ?? 'TikTok upload init failed');

    return {
      externalId: initData.data?.publish_id ?? 'pending',
      externalUrl: `https://tiktok.com/@${openId}`,
    };
  }

  private async publishToYouTube(
    accessToken: string, channelId: string, post: SocialPost, adaptedContent: string
  ): Promise<{ externalId: string; externalUrl: string }> {
    const options = post.platformOptions as any;

    if (!post.mediaUrls || post.mediaUrls.length === 0) {
      throw new Error('YouTube requires a video');
    }

    // Step 1: Create video resource
    const videoResp = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type':