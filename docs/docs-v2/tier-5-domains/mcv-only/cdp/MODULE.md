# @mcv/cdp — Customer Data Platform Module

**Parent Package:** @mcv/cdp  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** INTERNAL (MCV-Only — Never Published)  
**Last Updated:** February 9, 2026

---

## Purpose

The `cdp` module is the **unified Customer Data Platform** for the entire MCV.ONE ecosystem — a vertically integrated system for collecting behavioral events, resolving cross-platform identities, building 360° customer profiles, computing and managing traits, constructing dynamic audience segments, and synchronizing data to external activation destinations. It spans all 9 MCV ventures, providing a single source of truth for customer intelligence.

**Every customer interaction across every venture — web, mobile, blockchain, email, support, commerce, gaming — flows through this platform.**

The CDP replaces fragmented, per-venture customer databases with a centralized identity layer that enables:

- **Cross-venture identity resolution** — A user who bets on BetEdge, stakes on FutureState, and shops on SerpSpace is recognized as one person
- **Real-time segmentation** — Dynamic audience building based on behavior, traits, and ML predictions
- **Privacy-first architecture** — GDPR/CCPA compliance built into every layer: suppression, consent, PII hashing
- **Activation at scale** — One-click sync to Facebook Ads, Google Ads, Klaviyo, Snowflake, and custom webhooks
- **AI-powered enrichment** — Trait computation via event aggregation, ML models, and third-party enrichment

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// PROFILES — Unified 360° Customer Profiles
// ═══════════════════════════════════════════════════════════════════════════════

// Core operations
export {
  ProfileService,            // Create, read, update, merge, suppress profiles
  ProfileMerger,             // Deterministic & probabilistic merge engine
  ProfileResolver,           // Resolve identifiers → profile
} from './profiles/service';

// Profile queries
export {
  getProfile,                // Get single profile with computed traits
  searchProfiles,            // Multi-criteria profile search
  getProfileTimeline,        // Activity timeline for a profile
  getProfileSegments,        // All segments a profile belongs to
  suppressProfile,           // GDPR: suppress and anonymize
} from './profiles/queries';

// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY GRAPH — Cross-Platform Identity Resolution
// ═══════════════════════════════════════════════════════════════════════════════

export {
  IdentityGraph,             // Graph of identifiers → profiles
  IdentityResolver,          // Resolve multiple identifiers to one profile
  AliasManager,              // Manage email/phone/device/wallet aliases
} from './identity-graph/service';

// Resolution operations
export {
  resolve,                   // Resolve identifiers to profile ID
  linkIdentities,            // Link co-occurring identifiers
  associateWithProfile,      // Bind identifiers to a profile
  getProfileGraph,           // Get full identity graph for a profile
  triggerMerge,              // Request profile merge
} from './identity-graph/resolver';

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTS — Behavioral Event Tracking & Storage
// ═══════════════════════════════════════════════════════════════════════════════

export {
  EventCollector,            // Track individual and batch events
  EventStore,                // Query and aggregate events
  EventProcessor,            // Process events for downstream consumption
} from './events/service';

// Event operations
export {
  track,                     // Track a single event
  trackBatch,                // Track multiple events in batch
  identify,                  // Identify user (merge anonymous → identified)
  page,                      // Track page view
  screen,                    // Track mobile screen view
  group,                     // Associate profile with a group/org
  alias,                     // Create identity alias
  queryEvents,               // Query events with filtering
  getEventMetrics,           // Aggregated event metrics
} from './events/collector';

// ═══════════════════════════════════════════════════════════════════════════════
// TRAITS — Computed & Manual Trait Management
// ═══════════════════════════════════════════════════════════════════════════════

export {
  TraitEngine,               // Define, compute, and manage traits
  TraitComputer,             // Execute trait computation rules
  TraitStore,                // Read/write trait values
} from './traits/engine';

// Trait operations
export {
  defineTrait,               // Define a new trait with computation rules
  setTrait,                  // Set manual trait value
  setTraits,                 // Bulk set traits
  getTraits,                 // Get all traits for a profile
  computeTraits,             // Force-compute all computed traits
  runBatchComputation,       // Batch compute a trait across all profiles
} from './traits/operations';

// ═══════════════════════════════════════════════════════════════════════════════
// SEGMENTS — Dynamic Audience Segmentation
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SegmentBuilder,            // Create and configure segments
  SegmentEvaluator,          // Evaluate segment rules against profiles
  MembershipEngine,          // Manage segment membership lifecycle
} from './segments/service';

// Segment operations
export {
  createSegment,             // Create dynamic/static/ML segment
  updateRules,               // Update segment rules
  computeSegment,            // Full segment recomputation
  estimateSize,              // Estimate segment size without full compute
  isMember,                  // Check single profile membership
  getProfileSegments,        // Get all segments for a profile
  addToSegment,              // Manually add profiles (static only)
  removeFromSegment,         // Manually remove profiles (static only)
} from './segments/operations';

// ═══════════════════════════════════════════════════════════════════════════════
// SYNC — External Destination Synchronization
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SyncOrchestrator,          // Orchestrate sync jobs across destinations
  DestinationManager,        // CRUD for destination configurations
  SyncJob,                   // Individual sync job execution
} from './sync/orchestrator';

// Sync operations
export {
  triggerSync,               // Trigger a sync job
  testDestination,           // Test destination connectivity
  createDestination,         // Register new destination
  updateDestination,         // Update destination config
  createSyncConfig,          // Link segment → destination
  getSyncHistory,            // Get sync job history
} from './sync/operations';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useProfile } from './client/hooks/use-profile';
export { useProfileSearch } from './client/hooks/use-profile-search';
export { useProfileTimeline } from './client/hooks/use-profile-timeline';
export { useIdentityGraph } from './client/hooks/use-identity-graph';
export { useEventStream } from './client/hooks/use-event-stream';
export { useEventMetrics } from './client/hooks/use-event-metrics';
export { useTraitEditor } from './client/hooks/use-trait-editor';
export { useSegmentBuilder } from './client/hooks/use-segment-builder';
export { useSegmentMembers } from './client/hooks/use-segment-members';
export { useSyncDashboard } from './client/hooks/use-sync-dashboard';
export { useDestinations } from './client/hooks/use-destinations';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { ProfileCard } from './client/components/profile-card';
export { ProfileDetail } from './client/components/profile-detail';
export { ProfileTimeline } from './client/components/profile-timeline';
export { ProfileMergeDialog } from './client/components/profile-merge-dialog';
export { IdentityGraphVisualization } from './client/components/identity-graph-viz';
export { EventFeed } from './client/components/event-feed';
export { EventExplorer } from './client/components/event-explorer';
export { EventMetricsChart } from './client/components/event-metrics-chart';
export { TraitDefinitionForm } from './client/components/trait-definition-form';
export { TraitValueEditor } from './client/components/trait-value-editor';
export { SegmentBuilderUI } from './client/components/segment-builder-ui';
export { SegmentRuleEditor } from './client/components/segment-rule-editor';
export { SegmentSizeEstimator } from './client/components/segment-size-estimator';
export { SyncDashboard } from './client/components/sync-dashboard';
export { DestinationConfigForm } from './client/components/destination-config-form';
export { SyncJobHistory } from './client/components/sync-job-history';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  PROFILE_STATUSES,
  PROFILE_TYPES,
  IDENTITY_TYPES,
  EVENT_CATEGORIES,
  TRAIT_TYPES,
  TRAIT_SOURCES,
  SEGMENT_TYPES,
  SEGMENT_STATUSES,
  DESTINATION_TYPES,
  SYNC_MODES,
  MERGE_STRATEGIES,
  DEFAULT_BATCH_SIZE,
  DEFAULT_COMPUTATION_DEBOUNCE_MS,
  TRAIT_TRIGGER_EVENTS,
  MAX_EVENTS_PER_BATCH,
  MAX_SEGMENT_RULES_DEPTH,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Profile types
  Profile,
  ProfileWithDetails,
  ProfileSearchCriteria,
  ProfileSearchResult,
  CreateProfileInput,
  ProfileStatus,
  ProfileType,
  MergeLog,
  MergeConflictResolution,

  // Identity types
  IdentityNode,
  IdentityEdge,
  IdentityGraphView,
  IdentityResolutionInput,
  ResolutionResult,
  IdentitySource,
  ResolutionRule,

  // Event types
  CDPEvent,
  TrackEventInput,
  EventContext,
  EventDefinition,
  EventMetricRow,
  EventCategory,

  // Trait types
  TraitDefinition,
  TraitValue,
  ComputationRule,
  ComputationJobResult,
  TraitType,
  TraitSource,
  ValidationRule,

  // Segment types
  Segment,
  SegmentRules,
  SegmentCondition,
  SegmentMembership,
  ComputationResult,
  SegmentType,
  SegmentStatus,

  // Sync types
  Destination,
  DestinationConfig,
  SyncConfig,
  SyncJobRecord,
  SyncError,
  FieldMapping,
  DestinationAdapter,
  DestinationType,
  SyncStatus,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATA SOURCES                                           │
│                                                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Web SDKs │ │  Mobile  │ │  Server  │ │Blockchain│ │  Email   │ │ Support / CRM    │  │
│  │ (JS/TS)  │ │ (iOS/And)│ │  (Node)  │ │ (Events) │ │ Webhooks │ │ (HubSpot, etc.)  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘  │
│       │             │            │             │            │                │             │
│       └─────────────┴────────────┴─────────────┴────────────┴────────────────┘             │
│                                          │                                                 │
│                                   HTTP / WebSocket                                         │
│                                          │                                                 │
└──────────────────────────────────────────┼─────────────────────────────────────────────────┘
                                           │
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                    @mcv/cdp                                               │
│                                                                                           │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          1. EVENT INGESTION LAYER                                   │   │
│  │                                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                     │   │
│  │  │  EventCollector  │  │  EventProcessor │  │  EventStore     │                     │   │
│  │  │                 │  │                 │  │                 │                     │   │
│  │  │ • track()       │  │ • validate      │  │ • partitioned   │                     │   │
│  │  │ • trackBatch()  │─▶│ • deduplicate   │─▶│   by date       │                     │   │
│  │  │ • identify()    │  │ • enrich context│  │ • indexed by    │                     │   │
│  │  │ • page()        │  │ • route to      │  │   profile +     │                     │   │
│  │  │ • screen()      │  │   identity      │  │   venture       │                     │   │
│  │  └─────────────────┘  └────────┬────────┘  └─────────────────┘                     │   │
│  │                                │                                                    │   │
│  └────────────────────────────────┼────────────────────────────────────────────────────┘   │
│                                   │                                                        │
│                                   ▼                                                        │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                      2. IDENTITY RESOLUTION LAYER                                   │   │
│  │                                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                     │   │
│  │  │  IdentityGraph  │  │IdentityResolver │  │  AliasManager   │                     │   │
│  │  │                 │  │                 │  │                 │                     │   │
│  │  │ • nodes (email, │  │ • deterministic │  │ • add/remove    │                     │   │
│  │  │   phone, wallet,│  │   matching      │  │   aliases       │                     │   │
│  │  │   device, user) │  │ • probabilistic │  │ • verify        │                     │   │
│  │  │ • edges (co-    │  │   scoring       │  │ • hash values   │                     │   │
│  │  │   occurrence)   │  │ • merge trigger │  │ • cross-venture │                     │   │
│  │  └────────┬────────┘  └────────┬────────┘  └─────────────────┘                     │   │
│  │           │                    │                                                    │   │
│  └───────────┼────────────────────┼────────────────────────────────────────────────────┘   │
│              │                    │                                                        │
│              ▼                    ▼                                                        │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                      3. PROFILE UNIFICATION LAYER                                   │   │
│  │                                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                     │   │
│  │  │ ProfileService  │  │  ProfileMerger  │  │ ProfileResolver │                     │   │
│  │  │                 │  │                 │  │                 │                     │   │
│  │  │ • upsert        │  │ • conflict      │  │ • resolve by    │                     │   │
│  │  │ • get 360° view │  │   resolution    │  │   email/phone/  │                     │   │
│  │  │ • search        │  │ • field merging │  │   wallet/device │                     │   │
│  │  │ • timeline      │  │ • LTV rollup    │  │ • rank profiles │                     │   │
│  │  │ • suppress/GDPR │  │ • rollback      │  │ • confidence    │                     │   │
│  │  └────────┬────────┘  └─────────────────┘  └─────────────────┘                     │   │
│  │           │                                                                         │   │
│  └───────────┼─────────────────────────────────────────────────────────────────────────┘   │
│              │                                                                             │
│              ├──────────────────────────────┐                                              │
│              ▼                              ▼                                              │
│  ┌───────────────────────────┐  ┌───────────────────────────┐                              │
│  │  4. TRAIT ENGINE          │  │  5. SEGMENTATION ENGINE   │                              │
│  │                           │  │                           │                              │
│  │  ┌─────────────────────┐  │  │  ┌─────────────────────┐  │                              │
│  │  │  TraitEngine        │  │  │  │  SegmentBuilder     │  │                              │
│  │  │                     │  │  │  │                     │  │                              │
│  │  │  • defineTrait()    │  │  │  │  • createSegment()  │  │                              │
│  │  │  • setTrait()       │  │  │  │  • updateRules()    │  │                              │
│  │  │  • computeTraits()  │  │  │  │  • estimateSize()   │  │                              │
│  │  │  • batchCompute()   │  │  │  │  • computeSegment() │  │                              │
│  │  └─────────────────────┘  │  │  └─────────────────────┘  │                              │
│  │                           │  │                           │                              │
│  │  Sources:                 │  │  Types:                   │                              │
│  │  • Computed (from events) │  │  • Dynamic (rule-based)   │                              │
│  │  • Manual (API set)       │  │  • Static (curated list)  │                              │
│  │  • ML (model predictions) │  │  • ML (lookalike)         │                              │
│  │  • Enrichment (3rd party) │  │                           │                              │
│  │  • Imported (bulk)        │  │  Rules:                   │                              │
│  │                           │  │  • Trait conditions       │                              │
│  │  Computations:            │  │  • Event conditions       │                              │
│  │  • aggregate (count/sum)  │  │  • Segment inclusion      │                              │
│  │  • window (last N days)   │  │  • Nested AND/OR          │                              │
│  │  • recency (days since)   │  │                           │                              │
│  │  • frequency (active days)│  │                           │                              │
│  └───────────────────────────┘  └─────────────┬─────────────┘                              │
│                                               │                                            │
│                                               ▼                                            │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         6. SYNC / ACTIVATION LAYER                                  │   │
│  │                                                                                     │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                     │   │
│  │  │SyncOrchestrator │  │DestinationMgr   │  │  SyncJob        │                     │   │
│  │  │                 │  │                 │  │                 │                     │   │
│  │  │ • trigger()     │  │ • CRUD          │  │ • batch process │                     │   │
│  │  │ • schedule      │  │ • test()        │  │ • field mapping │                     │   │
│  │  │ • monitor       │  │ • adapters      │  │ • transforms    │                     │   │
│  │  └────────┬────────┘  └─────────────────┘  │ • error retry   │                     │   │
│  │           │                                 └─────────────────┘                     │   │
│  │           │                                                                         │   │
│  │           ▼                                                                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ Facebook │ │ Google   │ │ TikTok   │ │ Klaviyo  │ │Snowflake │ │ Webhook  │   │   │
│  │  │ Ads      │ │ Ads      │ │ Ads      │ │ / Braze  │ │/ BigQuery│ │ / Custom │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │                                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                            │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           │ powers
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  @mcv/marketing │ @mcv/agentic-os │ @mcv/commerce │ @mcv/compliance │ @mcv/analytics     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Pipeline

```
                  INGEST              RESOLVE              UNIFY
               ┌──────────┐      ┌──────────────┐     ┌──────────┐
  track() ────▶│  Validate │─────▶│   Identity   │────▶│  Profile  │
  identify()──▶│  Dedup    │     │   Graph      │    │  Merger   │
  page() ─────▶│  Enrich   │     │   Resolution │    │  360° View│
               └──────────┘      └──────────────┘     └────┬─────┘
                                                           │
                    ┌──────────────────────────────────────┤
                    │                                      │
                    ▼                                      ▼
              ┌──────────┐                          ┌──────────┐
              │  Trait    │                          │ Segment  │
              │  Engine   │ ◀─── triggers ──────── │ Evaluator│
              │  Compute  │                          │ Membership│
              └──────────┘                          └────┬─────┘
                                                         │
                                                         ▼
                                                   ┌──────────┐
                                                   │   Sync    │
                                                   │Orchestrate│
                                                   │ Activate  │
                                                   └──────────┘
```

---

## Submodule: profiles

### Purpose

The profiles submodule maintains unified 360° customer profiles that aggregate data from all touchpoints across all ventures. Each profile represents a single human (or anonymous device) with consolidated identity aliases, behavioral traits, engagement metrics, and lifetime value tracking.

### Database Schema

```typescript
// @mcv/cdp/profiles/schema.ts
import {
  pgTable, text, jsonb, timestamp, boolean, integer,
  numeric, index, uniqueIndex, pgEnum,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { ventures } from '@mcv/portfolio/schema';
import { users } from '@mcv/kernel/identity/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export const profileStatusEnum = pgEnum('profile_status', [
  'active',       // Normal operating state
  'merged',       // Merged into another profile (soft-deleted)
  'suppressed',   // GDPR/privacy suppression — PII cleared
  'deleted',      // Hard deletion requested
]);

export const profileTypeEnum = pgEnum('profile_type', [
  'identified',   // Has authenticated user account
  'anonymous',    // Cookie/device only — no PII
  'lead',         // Has email but no account
  'prospect',     // Enriched lead with additional data
]);

// ═══════════════════════════════════════════════════════════════════════════════
// CORE PROFILE TABLE
// ═══════════════════════════════════════════════════════════════════════════════

export const profiles = pgTable('cdp_profile', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),

  // Link to auth user (if identified)
  userId: text('user_id').references(() => users.id),

  // Profile classification
  type: profileTypeEnum('type').default('anonymous').notNull(),
  status: profileStatusEnum('status').default('active').notNull(),

  // Canonical identifiers (normalized, deduplicated)
  canonicalEmail: text('canonical_email'),
  canonicalPhone: text('canonical_phone'),

  // Display info (denormalized for performance)
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),

  // Location (from last known context)
  country: text('country'),
  region: text('region'),
  city: text('city'),
  timezone: text('timezone'),

  // Engagement metrics (computed, updated on each event)
  firstSeenAt: timestamp('first_seen_at'),
  lastSeenAt: timestamp('last_seen_at'),
  lastActiveAt: timestamp('last_active_at'),
  totalEvents: integer('total_events').default(0),
  totalSessions: integer('total_sessions').default(0),

  // Lifetime value (computed, updated on revenue events)
  ltvAmount: numeric('ltv_amount', { precision: 20, scale: 4 }).default('0'),
  ltvCurrency: text('ltv_currency').default('USD'),

  // External IDs for sync destinations
  externalIds: jsonb('external_ids').$type<Record<string, string>>().default({}),

  // All traits materialized for fast JSONB queries in segmentation
  traits: jsonb('traits').$type<Record<string, unknown>>().default({}),

  // Merge tracking
  mergedIntoId: text('merged_into_id'),
  mergedAt: timestamp('merged_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  ventureIdx: index('profile_venture_idx').on(t.ventureId),
  userIdx: index('profile_user_idx').on(t.userId),
  emailIdx: index('profile_email_idx').on(t.canonicalEmail),
  phoneIdx: index('profile_phone_idx').on(t.canonicalPhone),
  statusIdx: index('profile_status_idx').on(t.status),
  lastSeenIdx: index('profile_last_seen_idx').on(t.lastSeenAt),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE ALIASES — All known identifiers for a profile
// ═══════════════════════════════════════════════════════════════════════════════

export const profileAliases = pgTable('cdp_profile_alias', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),

  type: text('type').notNull(),           // 'email', 'phone', 'device_id', 'wallet', 'cookie', 'user_id'
  value: text('value').notNull(),
  valueHash: text('value_hash').notNull(), // SHA-256 for fast indexed lookups

  // Verification
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at'),
  verificationMethod: text('verification_method'),

  // Source tracking
  source: text('source').notNull(),       // 'web', 'mobile', 'api', 'import'
  sourceId: text('source_id'),            // Session/event that created it

  // Confidence score (0.0 – 1.0)
  confidence: numeric('confidence', { precision: 5, scale: 4 }).default('1.0'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  profileIdx: index('alias_profile_idx').on(t.profileId),
  typeValueIdx: uniqueIndex('alias_type_value_idx').on(t.type, t.valueHash),
  valueHashIdx: index('alias_value_hash_idx').on(t.valueHash),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE MERGE HISTORY — Audit trail for all merges
// ═══════════════════════════════════════════════════════════════════════════════

export const profileMerges = pgTable('cdp_profile_merge', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),

  // Winner (survives)
  primaryProfileId: text('primary_profile_id').references(() => profiles.id).notNull(),
  // Loser (merged into winner)
  secondaryProfileId: text('secondary_profile_id').references(() => profiles.id).notNull(),

  reason: text('reason').notNull(),       // 'email_match', 'phone_match', 'wallet_match', 'manual'
  confidence: numeric('confidence', { precision: 5, scale: 4 }),
  triggeredBy: text('triggered_by'),      // 'system', user ID, or agent ID

  // Full audit trail of merge decisions
  mergeLog: jsonb('merge_log').$type<MergeLog>(),

  // Rollback support
  isReversible: boolean('is_reversible').default(true),
  reversedAt: timestamp('reversed_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  primaryIdx: index('merge_primary_idx').on(t.primaryProfileId),
  secondaryIdx: index('merge_secondary_idx').on(t.secondaryProfileId),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE TIMELINE — Aggregated activity feed
// ═══════════════════════════════════════════════════════════════════════════════

export const profileTimeline = pgTable('cdp_profile_timeline', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),

  activityType: text('activity_type').notNull(), // 'page_view', 'purchase', 'email_open', etc.
  title: text('title').notNull(),
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  eventId: text('event_id'),

  occurredAt: timestamp('occurred_at').notNull(),
}, (t) => ({
  profileTimeIdx: index('timeline_profile_time_idx').on(t.profileId, t.occurredAt),
}));
```

### Core Interfaces

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Profile Types
// ═══════════════════════════════════════════════════════════════════════════════

interface Profile {
  id: string;
  ventureId: string;
  userId: string | null;
  type: 'identified' | 'anonymous' | 'lead' | 'prospect';
  status: 'active' | 'merged' | 'suppressed' | 'deleted';
  canonicalEmail: string | null;
  canonicalPhone: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
  lastActiveAt: Date | null;
  totalEvents: number;
  totalSessions: number;
  ltvAmount: string;
  ltvCurrency: string;
  externalIds: Record<string, string>;
  traits: Record<string, unknown>;
  mergedIntoId: string | null;
  mergedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfileWithDetails extends Profile {
  aliases: ProfileAlias[];
  computedTraits: Record<string, unknown>;
  segments: Segment[];
}

interface CreateProfileInput {
  ventureId: string;
  type?: 'identified' | 'anonymous' | 'lead' | 'prospect';
  userId?: string;
  email?: string;
  phone?: string;
  displayName?: string;
  traits?: Record<string, unknown>;
  source: string;
}

interface ProfileSearchCriteria {
  ventureId: string;
  email?: string;
  phone?: string;
  userId?: string;
  deviceId?: string;
  walletAddress?: string;
  traits?: Record<string, unknown>;
  segmentId?: string;
  lastSeenAfter?: Date;
  lastSeenBefore?: Date;
  limit?: number;
  offset?: number;
}

interface ProfileSearchResult {
  profiles: Profile[];
  total: number;
  hasMore: boolean;
}

interface MergeLog {
  fieldsFromPrimary: string[];
  fieldsFromSecondary: string[];
  conflictsResolved: Array<{
    field: string;
    primaryValue: unknown;
    secondaryValue: unknown;
    chosenValue: unknown;
    resolution: 'primary' | 'secondary' | 'merged' | 'newest';
  }>;
  aliasesMoved: number;
  eventsMoved: number;
}
```

### ProfileService

```typescript
export class ProfileService {
  private identityGraph: IdentityGraph;
  private traitEngine: TraitEngine;
  private eventBus: EventBus;

  constructor(deps: {
    identityGraph: IdentityGraph;
    traitEngine: TraitEngine;
    eventBus: EventBus;
  });

  /** Create or retrieve a profile. Handles identity resolution automatically. */
  async upsertProfile(input: CreateProfileInput): Promise<Profile>;

  /** Get profile by ID with full trait resolution and computed traits. */
  async getProfile(profileId: string): Promise<ProfileWithDetails | null>;

  /** Multi-criteria search with JSONB trait filtering. */
  async searchProfiles(criteria: ProfileSearchCriteria): Promise<ProfileSearchResult>;

  /** Update profile traits and metadata (partial merge). */
  async updateProfile(profileId: string, updates: {
    displayName?: string;
    traits?: Record<string, unknown>;
    externalIds?: Record<string, string>;
  }): Promise<Profile>;

  /** Add an alias (identifier) to a profile. Triggers merge if alias exists on another profile. */
  async addAlias(profileId: string, type: string, value: string, source: string): Promise<void>;

  /** Merge two profiles. Primary survives, secondary marked as merged. */
  async mergeProfiles(
    primaryId: string,
    secondaryId: string,
    reason: string,
    triggeredBy: string,
  ): Promise<Profile>;

  /** Suppress a profile (GDPR/privacy). Clears all PII and deletes aliases. */
  async suppressProfile(profileId: string, reason: string): Promise<void>;

  /** Get activity timeline for a profile. */
  async getTimeline(profileId: string, options: {
    limit?: number;
    before?: Date;
  }): Promise<TimelineEntry[]>;
}
```

---

## Submodule: identity-graph

### Purpose

The identity-graph submodule handles cross-platform identity resolution. It maintains a directed graph of identifier nodes (email, phone, device ID, wallet address, social IDs, advertising IDs) connected by co-occurrence edges, and resolves them to unified profiles. This is the core algorithm that enables a single person to be recognized across all MCV ventures and touchpoints.

### Database Schema

```typescript
// @mcv/cdp/identity-graph/schema.ts

export const identityTypeEnum = pgEnum('identity_type', [
  'email',
  'phone',
  'user_id',
  'device_id',
  'cookie',
  'wallet',        // Blockchain wallet address
  'social',        // facebook_id, google_id, etc.
  'advertising',   // GAID, IDFA
  'custom',        // Venture-specific identifiers
]);

// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY NODES — Each known identifier
// ═══════════════════════════════════════════════════════════════════════════════

export const identityNodes = pgTable('cdp_identity_node', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),

  // The identifier
  type: identityTypeEnum('type').notNull(),
  value: text('value').notNull(),
  valueHash: text('value_hash').notNull(),     // SHA-256 for indexed lookups

  // Resolved profile (null until resolved)
  profileId: text('profile_id').references(() => profiles.id),

  // Occurrence tracking
  firstSeenAt: timestamp('first_seen_at').defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  occurrenceCount: integer('occurrence_count').default(1),

  // Source provenance
  sources: jsonb('sources').$type<IdentitySource[]>().default([]),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  ventureTypeValueIdx: uniqueIndex('identity_venture_type_value_idx')
    .on(t.ventureId, t.type, t.valueHash),
  profileIdx: index('identity_profile_idx').on(t.profileId),
  valueHashIdx: index('identity_value_hash_idx').on(t.valueHash),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY EDGES — Co-occurrence links between nodes
// ═══════════════════════════════════════════════════════════════════════════════

export const identityEdges = pgTable('cdp_identity_edge', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),

  sourceNodeId: text('source_node_id').references(() => identityNodes.id).notNull(),
  targetNodeId: text('target_node_id').references(() => identityNodes.id).notNull(),

  // Edge weight (incremented on each co-occurrence)
  strength: integer('strength').default(1),

  // Confidence score (0.0 – 1.0)
  confidence: numeric('confidence', { precision: 5, scale: 4 }).default('1.0'),

  // Link provenance
  linkType: text('link_type').notNull(),    // 'same_session', 'same_event', 'explicit', 'inferred'

  firstLinkedAt: timestamp('first_linked_at').defaultNow().notNull(),
  lastLinkedAt: timestamp('last_linked_at').defaultNow().notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  sourceIdx: index('edge_source_idx').on(t.sourceNodeId),
  targetIdx: index('edge_target_idx').on(t.targetNodeId),
  uniqueEdgeIdx: uniqueIndex('edge_unique_idx').on(t.sourceNodeId, t.targetNodeId),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// RESOLUTION RULES — Configurable per-venture merge policies
// ═══════════════════════════════════════════════════════════════════════════════

export const resolutionRules = pgTable('cdp_resolution_rule', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),

  name: text('name').notNull(),
  description: text('description'),
  priority: integer('priority').default(100),       // Higher = evaluated first

  // Conditions
  identityTypes: jsonb('identity_types').$type<string[]>().notNull(),
  minConfidence: numeric('min_confidence', { precision: 5, scale: 4 }).default('0.8'),
  minOccurrences: integer('min_occurrences').default(1),

  // Actions
  action: text('action').notNull(),                 // 'merge', 'link', 'ignore'
  requiresReview: boolean('requires_review').default(false),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Core Interfaces

```typescript
interface IdentityResolutionInput {
  ventureId: string;
  email?: string;
  phone?: string;
  userId?: string;
  deviceId?: string;
  walletAddress?: string;
  sessionId?: string;
  customIds?: Record<string, string>;
}

interface ResolutionResult {
  profileId: string | null;
  confidence: number;
  matchedIdentities: Array<{ type: string; value: string }>;
  isNewProfile: boolean;
}

interface IdentityGraphView {
  profileId: string;
  nodes: Array<{
    id: string;
    type: string;
    value: string;
    firstSeen: Date;
    lastSeen: Date;
    occurrences: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    strength: number;
    confidence: number;
    linkType: string;
  }>;
}

interface IdentitySource {
  type: 'web' | 'mobile' | 'api' | 'import' | 'enrichment';
  name: string;
  timestamp: string;
  eventId?: string;
  sessionId?: string;
}
```

### IdentityGraph Service

```typescript
export class IdentityGraph {
  private eventBus: EventBus;

  constructor(eventBus: EventBus);

  /**
   * Resolve one or more identifiers to a single profile.
   *
   * Algorithm:
   * 1. Collect all identifiers from input
   * 2. Hash and find matching nodes in cdp_identity_node
   * 3. Collect profile IDs associated with matching nodes
   * 4. If 0 profiles → return null (new profile needed)
   * 5. If 1 profile → return it
   * 6. If N profiles → check resolution rules for auto-merge
   * 7. Return highest-confidence profile
   */
  async resolve(input: IdentityResolutionInput): Promise<ResolutionResult>;

  /** Link co-occurring identifiers (e.g., email + device in same session). */
  async linkIdentities(
    ventureId: string,
    identifiers: Array<{ type: string; value: string }>,
    linkType: string,
  ): Promise<void>;

  /** Associate identifiers with a resolved profile. */
  async associateWithProfile(
    ventureId: string,
    profileId: string,
    identifiers: Array<{ type: string; value: string }>,
  ): Promise<void>;

  /** Get the complete identity graph visualization for a profile. */
  async getProfileGraph(profileId: string): Promise<IdentityGraphView>;

  /** Trigger a merge between two profiles (emits event for ProfileMerger). */
  async triggerMerge(primaryId: string, secondaryId: string, reason: string): Promise<void>;
}
```

### Resolution Algorithm

```
┌─────────────────────────────────────────────────────────────────────┐
│                    IDENTITY RESOLUTION FLOW                         │
│                                                                     │
│  Input: { email: "j@x.com", deviceId: "abc123", wallet: "0x..." } │
│                                                                     │
│  1. Hash all identifiers:                                           │
│     email   → SHA256("j@x.com")    → node_A                       │
│     device  → SHA256("abc123")     → node_B                       │
│     wallet  → SHA256("0x...")      → node_C                       │
│                                                                     │
│  2. Find existing nodes in cdp_identity_node:                       │
│     node_A → profile_1  (confidence: 1.0)                          │
│     node_B → profile_1  (confidence: 0.9)                          │
│     node_C → profile_2  (confidence: 1.0)                          │
│                                                                     │
│  3. Unique profiles: { profile_1, profile_2 }                       │
│                                                                     │
│  4. Check resolution rules:                                         │
│     Rule "email_wallet_merge" → action: merge                       │
│     ✓ identity types [email, wallet] present                        │
│     ✓ confidence ≥ 0.8                                              │
│                                                                     │
│  5. Auto-merge: profile_1 (winner) ← profile_2 (loser)             │
│     Winner = profile with most events                               │
│                                                                     │
│  Result: { profileId: profile_1, confidence: 1.0 }                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Submodule: events

### Purpose

The events submodule handles high-volume behavioral event ingestion, storage, and querying. It captures every meaningful customer interaction — page views, product actions, purchases, support tickets, blockchain transactions — and associates them with profiles via the identity graph.

### Database Schema

```typescript
// @mcv/cdp/events/schema.ts

export const eventCategoryEnum = pgEnum('event_category', [
  'page',       // Page/screen view
  'track',      // Custom event
  'identify',   // Identity event
  'screen',     // Mobile screen view
  'group',      // Group association
  'alias',      // Identity alias
]);

// ═══════════════════════════════════════════════════════════════════════════════
// RAW EVENTS — High-volume, partitioned by date
// ═══════════════════════════════════════════════════════════════════════════════

export const events = pgTable('cdp_event', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),

  // Profile association
  profileId: text('profile_id').references(() => profiles.id),
  anonymousId: text('anonymous_id'),           // Pre-identification device/session

  // Event classification
  category: eventCategoryEnum('category').notNull(),
  name: text('name').notNull(),                // 'Page Viewed', 'Product Added', 'Order Completed'

  // Event payload
  properties: jsonb('properties').$type<Record<string, unknown>>().default({}),

  // Rich context (device, browser, location, campaign, session)
  context: jsonb('context').$type<EventContext>().default({}),

  // Timing
  timestamp: timestamp('timestamp').notNull(),          // When it happened (client clock)
  receivedAt: timestamp('received_at').defaultNow().notNull(),  // When server received it
  sentAt: timestamp('sent_at'),                         // When client sent it

  // Source
  source: text('source').notNull(),            // 'web', 'mobile', 'server', 'import'
  sourceId: text('source_id'),                 // SDK instance ID

  // Deduplication
  messageId: text('message_id').unique(),

  // Revenue tracking (extracted from properties)
  revenue: numeric('revenue', { precision: 20, scale: 4 }),
  currency: text('currency'),

  // Schema version
  version: integer('version').default(1),
}, (t) => ({
  ventureTimeIdx: index('event_venture_time_idx').on(t.ventureId, t.timestamp),
  profileTimeIdx: index('event_profile_time_idx').on(t.profileId, t.timestamp),
  nameIdx: index('event_name_idx').on(t.name),
  anonymousIdx: index('event_anonymous_idx').on(t.anonymousId),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT DEFINITIONS — Schema registry for event types
// ═══════════════════════════════════════════════════════════════════════════════

export const eventDefinitions = pgTable('cdp_event_definition', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),

  category: eventCategoryEnum('category').notNull(),
  name: text('name').notNull(),
  description: text('description'),

  // JSON Schema for properties validation
  propertiesSchema: jsonb('properties_schema').$type<JSONSchema>(),

  // Usage tracking
  status: text('status').default('active'),    // 'active', 'deprecated', 'draft'
  totalCount: integer('total_count').default(0),
  lastSeenAt: timestamp('last_seen_at'),

  tags: jsonb('tags').$type<string[]>().default([]),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  ventureCategoryNameIdx: uniqueIndex('event_def_venture_category_name_idx')
    .on(t.ventureId, t.category, t.name),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT METRICS — Pre-aggregated for dashboard performance
// ═══════════════════════════════════════════════════════════════════════════════

export const eventMetrics = pgTable('cdp_event_metric', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),

  // Aggregation window
  windowStart: timestamp('window_start').notNull(),
  windowEnd: timestamp('window_end').notNull(),
  granularity: text('granularity').notNull(),  // 'hour', 'day', 'week', 'month'

  // Dimensions
  eventName: text('event_name').notNull(),
  source: text('source'),

  // Metrics
  eventCount: integer('event_count').default(0),
  uniqueProfiles: integer('unique_profiles').default(0),
  totalRevenue: numeric('total_revenue', { precision: 20, scale: 4 }),

  // Custom aggregates (e.g., avg cart value)
  propertyAggregates: jsonb('property_aggregates').$type<Record<string, number>>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  ventureWindowIdx: index('metric_venture_window_idx')
    .on(t.ventureId, t.granularity, t.windowStart),
  eventNameIdx: index('metric_event_name_idx').on(t.eventName),
}));
```

### EventContext

```typescript
interface EventContext {
  // Device information
  device?: {
    id?: string;
    manufacturer?: string;
    model?: string;
    type?: 'mobile' | 'tablet' | 'desktop';
  };
  // Operating system
  os?: {
    name?: string;           // 'iOS', 'Android', 'Windows', 'macOS'
    version?: string;
  };
  // Browser
  browser?: {
    name?: string;           // 'Chrome', 'Safari', 'Firefox'
    version?: string;
  };
  // Geolocation (from IP or GPS)
  location?: {
    ip?: string;
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  // Page context (web events)
  page?: {
    url?: string;
    path?: string;
    title?: string;
    referrer?: string;
  };
  // UTM campaign parameters
  campaign?: {
    source?: string;         // 'google', 'facebook', 'twitter'
    medium?: string;         // 'cpc', 'email', 'organic'
    name?: string;           // 'spring_sale_2026'
    term?: string;
    content?: string;
  };
  // Session
  sessionId?: string;
  // Extensible
  [key: string]: unknown;
}
```

### EventCollector

```typescript
export class EventCollector {
  private identityGraph: IdentityGraph;
  private traitEngine: TraitEngine;
  private eventBus: EventBus;

  constructor(deps: {
    identityGraph: IdentityGraph;
    traitEngine: TraitEngine;
    eventBus: EventBus;
  });

  /**
   * Track a single event.
   *
   * Pipeline:
   * 1. Resolve profile via identity graph
   * 2. Insert event into cdp_event (partitioned)
   * 3. Link co-occurring identifiers in identity graph
   * 4. Update profile stats (lastSeen, totalEvents, LTV)
   * 5. Trigger trait computation if event is a trait trigger
   * 6. Emit cdp.event.tracked for downstream processing
   */
  async track(input: TrackEventInput): Promise<{
    eventId: string;
    profileId: string | null;
  }>;

  /** Track multiple events in a single transaction. */
  async trackBatch(inputs: TrackEventInput[]): Promise<void>;

  /**
   * Identify a user — merge anonymous device with authenticated account.
   *
   * 1. Resolve or create profile for userId
   * 2. Link anonymousId → userId in identity graph
   * 3. Backfill: update all previous anonymous events to this profile
   * 4. Track identify event
   */
  async identify(input: {
    ventureId: string;
    userId: string;
    anonymousId?: string;
    traits?: Record<string, unknown>;
    context?: EventContext;
    source: string;
  }): Promise<{ profileId: string }>;

  /** Track page view with automatic URL/path/title extraction. */
  async page(input: {
    ventureId: string;
    profileId?: string;
    anonymousId?: string;
    name?: string;
    properties?: Record<string, unknown>;
    context?: EventContext;
    source: string;
  }): Promise<{ eventId: string }>;

  /** Query events with multi-dimensional filtering. */
  async queryEvents(params: {
    ventureId: string;
    profileId?: string;
    eventName?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ events: CDPEvent[]; total: number }>;

  /** Get pre-aggregated event metrics for dashboards. */
  async getMetrics(params: {
    ventureId: string;
    eventName?: string;
    granularity: 'hour' | 'day' | 'week' | 'month';
    startDate: Date;
    endDate: Date;
  }): Promise<EventMetricRow[]>;
}
```

---

## Submodule: traits

### Purpose

The traits submodule manages both **computed** traits (derived automatically from event data) and **manual** traits (set explicitly via API or import). Traits are the building blocks for segmentation — every segment rule evaluates against profile traits. The trait engine supports aggregate computations, time-windowed calculations, recency tracking, frequency analysis, ML predictions, and third-party enrichment.

### Database Schema

```typescript
// @mcv/cdp/traits/schema.ts

export const traitTypeEnum = pgEnum('trait_type', [
  'string',
  'number',
  'boolean',
  'date',
  'array',
  'object',
]);

export const traitSourceEnum = pgEnum('trait_source', [
  'computed',     // Derived from events via computation rules
  'manual',       // Set explicitly via API
  'imported',     // Bulk CSV/JSON import
  'enrichment',   // Third-party data enrichment (Clearbit, etc.)
  'ml',           // ML model prediction (churn risk, propensity, etc.)
]);

// ═══════════════════════════════════════════════════════════════════════════════
// TRAIT DEFINITIONS — Schema for available traits per venture
// ═══════════════════════════════════════════════════════════════════════════════

export const traitDefinitions = pgTable('cdp_trait_definition', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),

  // Identification
  key: text('key').notNull(),              // 'lifetime_value', 'churn_risk', 'favorite_sport'
  name: text('name').notNull(),            // Human-readable name
  description: text('description'),
  category: text('category'),             // 'demographics', 'behavior', 'predictive', 'financial'

  // Data type
  type: traitTypeEnum('type').notNull(),

  // Source type
  source: traitSourceEnum('source').notNull(),

  // For computed traits: the computation rule
  computationRule: jsonb('computation_rule').$type<ComputationRule>(),

  // For ML traits: model reference
  mlModelId: text('ml_model_id'),

  // Default value when trait is not set
  defaultValue: jsonb('default_value'),

  // Validation constraints
  validationRules: jsonb('validation_rules').$type<ValidationRule[]>(),

  // Privacy classification
  isPii: boolean('is_pii').default(false),
  isExportable: boolean('is_exportable').default(true),

  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  ventureKeyIdx: uniqueIndex('trait_def_venture_key_idx').on(t.ventureId, t.key),
  categoryIdx: index('trait_def_category_idx').on(t.category),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// TRAIT VALUES — Per-profile trait values
// ═══════════════════════════════════════════════════════════════════════════════

export const traitValues = pgTable('cdp_trait_value', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  traitDefinitionId: text('trait_definition_id').references(() => traitDefinitions.id).notNull(),

  // The actual value (JSONB for any type)
  value: jsonb('value'),

  // Provenance
  source: traitSourceEnum('source').notNull(),
  sourceDetails: jsonb('source_details').$type<SourceDetails>(),

  // Confidence (for ML predictions: 0.0 – 1.0)
  confidence: numeric('confidence', { precision: 5, scale: 4 }),

  // Lifecycle
  computedAt: timestamp('computed_at'),
  expiresAt: timestamp('expires_at'),

  // Optimistic locking
  version: integer('version').default(1),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  profileTraitIdx: uniqueIndex('trait_value_profile_trait_idx')
    .on(t.profileId, t.traitDefinitionId),
  traitDefIdx: index('trait_value_trait_def_idx').on(t.traitDefinitionId),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// TRAIT COMPUTATION JOBS — Batch computation tracking
// ═══════════════════════════════════════════════════════════════════════════════

export const traitComputationJobs = pgTable('cdp_trait_computation_job', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),

  traitDefinitionId: text('trait_definition_id').references(() => traitDefinitions.id).notNull(),
  profileId: text('profile_id').references(() => profiles.id), // null = all profiles

  triggeredBy: text('triggered_by').notNull(),     // 'event', 'schedule', 'manual'
  triggerEventName: text('trigger_event_name'),

  status: text('status').default('pending'),       // 'pending', 'running', 'completed', 'failed'

  profilesProcessed: integer('profiles_processed').default(0),
  profilesUpdated: integer('profiles_updated').default(0),
  error: text('error'),

  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Computation Rules

```typescript
interface ComputationRule {
  type: 'aggregate' | 'window' | 'recency' | 'frequency' | 'custom';

  // For aggregate — count, sum, avg, min, max over event properties
  eventName?: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'first' | 'last';
  propertyPath?: string;

  // For window — count/sum within last N days
  windowDays?: number;

  // For recency — days/hours since last occurrence of an event
  sinceEvent?: string;
  unit?: 'days' | 'hours' | 'minutes';

  // For custom SQL
  sql?: string;

  // Optional filters on event properties
  eventFilters?: Array<{
    property: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
    value: unknown;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE COMPUTATION RULES
// ═══════════════════════════════════════════════════════════════════════════════

// Total number of orders
const totalOrders: ComputationRule = {
  type: 'aggregate',
  eventName: 'Order Completed',
  aggregation: 'count',
};

// Total revenue (sum of revenue property across all Order Completed events)
const lifetimeRevenue: ComputationRule = {
  type: 'aggregate',
  eventName: 'Order Completed',
  aggregation: 'sum',
  propertyPath: 'revenue',
};

// Average order value
const avgOrderValue: ComputationRule = {
  type: 'aggregate',
  eventName: 'Order Completed',
  aggregation: 'avg',
  propertyPath: 'revenue',
};

// Events in last 30 days
const recentActivity: ComputationRule = {
  type: 'window',
  windowDays: 30,
};

// Days since last purchase
const daysSinceLastPurchase: ComputationRule = {
  type: 'recency',
  sinceEvent: 'Order Completed',
  unit: 'days',
};

// Active days in last 30 days
const engagementFrequency: ComputationRule = {
  type: 'frequency',
  windowDays: 30,
};
```

### TraitEngine

```typescript
export class TraitEngine {
  private eventBus: EventBus;

  constructor(eventBus: EventBus);

  /** Define a new trait with optional computation rule. */
  async defineTrait(input: {
    ventureId: string;
    key: string;
    name: string;
    description?: string;
    category?: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    source: 'computed' | 'manual' | 'enrichment' | 'ml';
    computationRule?: ComputationRule;
    defaultValue?: unknown;
    isPii?: boolean;
  }): Promise<TraitDefinition>;

  /** Set a manual trait value for a profile (upsert). */
  async setTrait(
    profileId: string,
    key: string,
    value: unknown,
    source?: 'manual' | 'imported' | 'enrichment',
  ): Promise<void>;

  /** Set multiple traits at once. */
  async setTraits(
    profileId: string,
    traits: Record<string, unknown>,
    source?: 'manual' | 'imported' | 'enrichment',
  ): Promise<void>;

  /** Get all traits for a profile (merged stored + computed). */
  async getTraits(profileId: string): Promise<Record<string, unknown>>;

  /**
   * Compute all computed traits for a profile.
   * Executes each computation rule against the profile's event history.
   */
  async computeTraits(profileId: string): Promise<Record<string, unknown>>;

  /**
   * Queue trait computation with debouncing (5s default).
   * Multiple rapid events for the same profile are coalesced.
   */
  async queueComputation(profileId: string, triggerEvent: string): Promise<void>;

  /**
   * Run batch computation for a trait across all profiles in a venture.
   * Used for scheduled nightly recomputations.
   */
  async runBatchComputation(
    ventureId: string,
    traitKey: string,
  ): Promise<ComputationJobResult>;
}
```

---

## Submodule: segments

### Purpose

The segments submodule enables dynamic audience building based on profile traits, event history, and nested boolean logic. Segments power marketing campaigns, ad targeting, content personalization, and analytics. They support three types: **dynamic** (rule-based, recomputed on schedule), **static** (manually curated lists), and **ML** (lookalike/predictive audiences).

### Database Schema

```typescript
// @mcv/cdp/segments/schema.ts

export const segmentTypeEnum = pgEnum('segment_type', [
  'dynamic',    // Computed from rules against profile traits/events
  'static',     // Manually curated membership list
  'ml',         // ML-based lookalike or predictive audience
]);

export const segmentStatusEnum = pgEnum('segment_status', [
  'draft',       // Rules defined but not yet computed
  'computing',   // Computation in progress
  'active',      // Computed and available for use
  'paused',      // Temporarily disabled
  'archived',    // Soft-deleted
]);

// ═══════════════════════════════════════════════════════════════════════════════
// SEGMENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const segments = pgTable('cdp_segment', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),

  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),

  type: segmentTypeEnum('type').default('dynamic').notNull(),
  status: segmentStatusEnum('status').default('draft').notNull(),

  // Rules (for dynamic segments)
  rules: jsonb('rules').$type<SegmentRules>(),

  // For ML segments
  seedSegmentId: text('seed_segment_id'),
  mlModelId: text('ml_model_id'),
  similarityThreshold: numeric('similarity_threshold', { precision: 5, scale: 4 }),

  // Size tracking
  estimatedSize: integer('estimated_size'),
  lastComputedSize: integer('last_computed_size'),
  lastComputedAt: timestamp('last_computed_at'),

  // Sync configuration
  syncEnabled: boolean('sync_enabled').default(false),
  syncDestinations: jsonb('sync_destinations').$type<string[]>().default([]),

  tags: jsonb('tags').$type<string[]>().default([]),
  createdBy: text('created_by'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  ventureSlugIdx: uniqueIndex('segment_venture_slug_idx').on(t.ventureId, t.slug),
  statusIdx: index('segment_status_idx').on(t.status),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// SEGMENT MEMBERSHIP — Cached membership for performance
// ═══════════════════════════════════════════════════════════════════════════════

export const segmentMemberships = pgTable('cdp_segment_membership', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),

  segmentId: text('segment_id').references(() => segments.id).notNull(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),

  // Entry tracking
  enteredAt: timestamp('entered_at').defaultNow().notNull(),
  entryReason: text('entry_reason'),      // 'rule_match', 'manual', 'ml_prediction'

  // For ML segments: prediction score
  score: numeric('score', { precision: 5, scale: 4 }),

  // Exit tracking
  exitedAt: timestamp('exited_at'),
  exitReason: text('exit_reason'),        // 'rule_no_longer_match', 'manual_removal'

  // Version for incremental computation
  snapshotVersion: integer('snapshot_version').default(1),
}, (t) => ({
  segmentProfileIdx: uniqueIndex('membership_segment_profile_idx')
    .on(t.segmentId, t.profileId),
  profileIdx: index('membership_profile_idx').on(t.profileId),
  enteredIdx: index('membership_entered_idx').on(t.enteredAt),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// SEGMENT COMPUTATION HISTORY — Audit trail for recomputations
// ═══════════════════════════════════════════════════════════════════════════════

export const segmentComputations = pgTable('cdp_segment_computation', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  segmentId: text('segment_id').references(() => segments.id).notNull(),

  status: text('status').default('running'),
  previousSize: integer('previous_size'),
  newSize: integer('new_size'),
  added: integer('added'),
  removed: integer('removed'),

  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),

  error: text('error'),
});
```

### Segment Rules DSL

```typescript
interface SegmentRules {
  operator: 'and' | 'or';
  conditions: SegmentCondition[];
}

interface SegmentCondition {
  type: 'trait' | 'event' | 'segment' | 'computed';

  // For trait conditions
  traitKey?: string;

  // For event conditions
  eventName?: string;
  timeframe?: { value: number; unit: 'days' | 'hours' | 'minutes' };

  // For segment inclusion/exclusion
  segmentId?: string;

  // Comparison operator
  operator:
    | 'eq' | 'ne'
    | 'gt' | 'gte' | 'lt' | 'lte'
    | 'contains' | 'not_contains'
    | 'exists' | 'not_exists'
    | 'in' | 'not_in';
  value?: unknown;

  // For nested conditions (unlimited depth)
  conditions?: SegmentCondition[];
  nestedOperator?: 'and' | 'or';
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE SEGMENT RULES
// ═══════════════════════════════════════════════════════════════════════════════

// "High-value BetEdge users who haven't bet in 30 days"
const churnRiskHighValue: SegmentRules = {
  operator: 'and',
  conditions: [
    { type: 'trait', traitKey: 'lifetime_value', operator: 'gte', value: 1000 },
    { type: 'trait', traitKey: 'days_since_last_bet', operator: 'gte', value: 30 },
    { type: 'trait', traitKey: 'total_bets', operator: 'gte', value: 10 },
  ],
};

// "New users from organic search who viewed pricing"
const pricingIntentNewUsers: SegmentRules = {
  operator: 'and',
  conditions: [
    { type: 'trait', traitKey: 'days_since_signup', operator: 'lte', value: 7 },
    {
      type: 'event',
      eventName: 'Page Viewed',
      timeframe: { value: 7, unit: 'days' },
      operator: 'exists',
    },
    { type: 'trait', traitKey: 'utm_source', operator: 'eq', value: 'google' },
    { type: 'trait', traitKey: 'utm_medium', operator: 'eq', value: 'organic' },
  ],
};
```

### SegmentService

```typescript
export class SegmentService {
  private eventBus: EventBus;

  constructor(eventBus: EventBus);

  /** Create a new segment definition. */
  async createSegment(input: CreateSegmentInput): Promise<Segment>;

  /** Update segment rules (marks segment as 'draft' for recomputation). */
  async updateRules(segmentId: string, rules: SegmentRules): Promise<Segment>;

  /** Estimate segment size via COUNT(*) without materializing membership. */
  async estimateSize(segmentId: string): Promise<number>;

  /**
   * Full segment recomputation:
   * 1. Build SQL WHERE clause from rules
   * 2. Query all matching profiles
   * 3. Diff against current membership
   * 4. Insert new members, mark exited members
   * 5. Update segment stats
   * 6. Emit cdp.segment.computed event
   */
  async computeSegment(segmentId: string): Promise<ComputationResult>;

  /** Check if a single profile is in a segment (real-time for dynamic). */
  async isMember(segmentId: string, profileId: string): Promise<boolean>;

  /** Get all segments a profile belongs to. */
  async getProfileSegments(profileId: string): Promise<Segment[]>;

  /** Add profiles to a static segment manually. */
  async addToSegment(segmentId: string, profileIds: string[]): Promise<number>;

  /** Remove profiles from a static segment. */
  async removeFromSegment(segmentId: string, profileIds: string[]): Promise<number>;
}
```

---

## Submodule: sync

### Purpose

The sync submodule handles outbound synchronization of CDP audience data to external activation destinations. It manages destination configurations, field mapping, data transformation (hashing for ad platforms, E.164 for phone numbers), batched delivery, and retry logic. Syncs can be triggered manually, on a schedule, or in real-time when segment membership changes.

### Database Schema

```typescript
// @mcv/cdp/sync/schema.ts

export const destinationTypeEnum = pgEnum('destination_type', [
  'facebook_ads',
  'google_ads',
  'tiktok_ads',
  'klaviyo',
  'mailchimp',
  'braze',
  'hubspot',
  'salesforce',
  'snowflake',
  'bigquery',
  'webhook',
  'custom',
]);

export const syncStatusEnum = pgEnum('sync_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'partial',      // Some records succeeded, some failed
]);

// ═══════════════════════════════════════════════════════════════════════════════
// DESTINATIONS — External platform configurations
// ═══════════════════════════════════════════════════════════════════════════════

export const destinations = pgTable('cdp_destination', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),

  name: text('name').notNull(),
  type: destinationTypeEnum('type').notNull(),

  // Platform-specific configuration
  config: jsonb('config').$type<DestinationConfig>().notNull(),

  // Encrypted credentials (API keys, tokens, etc.)
  credentials: jsonb('credentials').$type<Record<string, string>>(),

  // Field mapping rules
  fieldMappings: jsonb('field_mappings').$type<FieldMapping[]>().default([]),

  // Status
  isActive: boolean('is_active').default(true),
  lastTestedAt: timestamp('last_tested_at'),
  lastTestResult: text('last_test_result'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// SYNC CONFIGS — Segment → Destination bindings
// ═══════════════════════════════════════════════════════════════════════════════

export const syncConfigs = pgTable('cdp_sync_config', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),

  segmentId: text('segment_id').references(() => segments.id).notNull(),
  destinationId: text('destination_id').references(() => destinations.id).notNull(),

  // Sync mode
  mode: text('mode').default('incremental'),   // 'full' or 'incremental'

  // Schedule
  scheduleType: text('schedule_type').default('manual'),  // 'manual', 'realtime', 'scheduled'
  cronExpression: text('cron_expression'),

  // Trait selection
  includeTraits: jsonb('include_traits').$type<string[]>(),
  excludeTraits: jsonb('exclude_traits').$type<string[]>(),

  isActive: boolean('is_active').default(true),
  lastSyncAt: timestamp('last_sync_at'),
  lastSyncStatus: syncStatusEnum('last_sync_status'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  segmentDestIdx: uniqueIndex('sync_segment_dest_idx')
    .on(t.segmentId, t.destinationId),
}));

// ═══════════════════════════════════════════════════════════════════════════════
// SYNC JOBS — Execution history
// ═══════════════════════════════════════════════════════════════════════════════

export const syncJobs = pgTable('cdp_sync_job', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  syncConfigId: text('sync_config_id').references(() => syncConfigs.id).notNull(),

  status: syncStatusEnum('status').default('pending').notNull(),
  triggeredBy: text('triggered_by').notNull(),     // 'schedule', 'manual', 'realtime'

  // Progress tracking
  totalRecords: integer('total_records'),
  processedRecords: integer('processed_records').default(0),
  successfulRecords: integer('successful_records').default(0),
  failedRecords: integer('failed_records').default(0),

  // Error details
  errors: jsonb('errors').$type<SyncError[]>().default([]),

  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  configStatusIdx: index('sync_job_config_status_idx').on(t.syncConfigId, t.status),
  createdAtIdx: index('sync_job_created_idx').on(t.createdAt),
}));
```

### Sync Interfaces

```typescript
interface DestinationConfig {
  // For ad platforms
  accountId?: string;
  audienceId?: string;

  // For email platforms
  listId?: string;

  // For data warehouses
  dataset?: string;
  table?: string;

  // For webhooks
  url?: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;

  // Common settings
  batchSize?: number;
  retryAttempts?: number;
}

interface FieldMapping {
  sourceField: string;         // CDP trait key or profile field
  destField: string;           // Destination field name
  transform?: 'hash' | 'lowercase' | 'uppercase' | 'phone_e164';
}

interface SyncError {
  profileId: string;
  error: string;
  timestamp: string;
}

interface DestinationAdapter {
  test(destination: Destination): Promise<void>;
  sync(destination: Destination, records: Record<string, unknown>[]): Promise<void>;
}
```

### SyncOrchestrator

```typescript
export class SyncOrchestrator {
  private adapters: Map<string, DestinationAdapter>;
  private eventBus: EventBus;

  constructor(eventBus: EventBus);

  /**
   * Trigger a sync job for a segment → destination configuration.
   *
   * Pipeline:
   * 1. Load sync config with segment and destination
   * 2. Get destination adapter
   * 3. Create sync job record
   * 4. Query segment members with profile data
   * 5. Transform profiles via field mappings
   * 6. Batch-send to destination adapter
   * 7. Track progress, handle failures with per-record retry
   * 8. Update sync config with last sync status
   * 9. Emit cdp.sync.completed event
   */
  async triggerSync(
    syncConfigId: string,
    triggeredBy: 'schedule' | 'manual' | 'realtime',
  ): Promise<SyncJobRecord>;

  /** Test a destination connection (adapter.test()). */
  async testDestination(destinationId: string): Promise<{
    success: boolean;
    message: string;
  }>;
}
```

---

## Usage Examples

### Example 1: Track Events and Identify Users

```typescript
import { EventCollector } from '@mcv/cdp';

const collector = new EventCollector({ identityGraph, traitEngine, eventBus });

// ═══════════════════════════════════════════════════════════════════════════════
// Track an anonymous page view
// ═══════════════════════════════════════════════════════════════════════════════

const { eventId } = await collector.page({
  ventureId: 'betedge-venture-uuid',
  anonymousId: 'device-abc-123',
  name: 'Odds Page',
  properties: {
    sport: 'basketball',
    league: 'NBA',
  },
  context: {
    page: {
      url: 'https://betedge.io/odds/nba',
      path: '/odds/nba',
      title: 'NBA Odds - BetEdge',
    },
    device: { type: 'mobile', manufacturer: 'Apple', model: 'iPhone 15' },
    location: { country: 'US', region: 'NY', city: 'New York' },
    campaign: { source: 'google', medium: 'cpc', name: 'nba_playoffs_2026' },
  },
  source: 'web',
});

// ═══════════════════════════════════════════════════════════════════════════════
// User signs in — merge anonymous with identified
// ═══════════════════════════════════════════════════════════════════════════════

const { profileId } = await collector.identify({
  ventureId: 'betedge-venture-uuid',
  userId: 'user-7x9k2',
  anonymousId: 'device-abc-123',        // Links this device to the user
  traits: {
    email: 'jordan@example.com',
    name: 'Jordan Smith',
    plan: 'premium',
  },
  source: 'web',
});

// All previous anonymous events are now attributed to this profile
console.log(`Identified: ${profileId}`);
```

### Example 2: Track Revenue Events

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Track a purchase (auto-updates LTV on profile)
// ═══════════════════════════════════════════════════════════════════════════════

await collector.track({
  ventureId: 'betedge-venture-uuid',
  profileId: 'profile-xyz',
  category: 'track',
  name: 'Bet Placed',
  properties: {
    betId: 'bet-123',
    sport: 'basketball',
    league: 'NBA',
    matchup: 'Lakers vs Celtics',
    betType: 'moneyline',
    odds: -150,
    revenue: 50.00,               // Wager amount → feeds LTV
    currency: 'USD',
  },
  source: 'web',
});

// ═══════════════════════════════════════════════════════════════════════════════
// Track an e-commerce purchase (SerpSpace)
// ═══════════════════════════════════════════════════════════════════════════════

await collector.track({
  ventureId: 'serpspace-venture-uuid',
  profileId: 'profile-abc',
  category: 'track',
  name: 'Order Completed',
  properties: {
    orderId: 'order-456',
    revenue: 299.99,
    currency: 'USD',
    products: [
      { id: 'seo-audit', name: 'SEO Audit Package', price: 149.99, quantity: 1 },
      { id: 'backlinks-50', name: '50 Backlinks Bundle', price: 150.00, quantity: 1 },
    ],
    coupon: 'LAUNCH20',
    discount: 60.00,
  },
  source: 'web',
});
```

### Example 3: Profile Resolution and 360° View

```typescript
import { ProfileService, IdentityGraph } from '@mcv/cdp';

const profileService = new ProfileService({ identityGraph, traitEngine, eventBus });

// ═══════════════════════════════════════════════════════════════════════════════
// Upsert a profile — auto-resolves identity
// ═══════════════════════════════════════════════════════════════════════════════

const profile = await profileService.upsertProfile({
  ventureId: 'futurestate-venture-uuid',
  email: 'alex@dao.finance',
  userId: 'user-fs-99',
  displayName: 'Alex Chen',
  traits: {
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD47',
    stakingTier: 'platinum',
    totalStaked: 50000,
  },
  source: 'api',
});

// ═══════════════════════════════════════════════════════════════════════════════
// Get full 360° profile with computed traits
// ═══════════════════════════════════════════════════════════════════════════════

const fullProfile = await profileService.getProfile(profile.id);

console.log('Profile:', fullProfile.displayName);
console.log('Type:', fullProfile.type);                    // 'identified'
console.log('LTV:', fullProfile.ltvAmount);                // '50000.0000'
console.log('Total Events:', fullProfile.totalEvents);     // 347
console.log('Last Seen:', fullProfile.lastSeenAt);         // 2026-02-08T...
console.log('Traits:', fullProfile.traits);
// {
//   walletAddress: '0x742d...',
//   stakingTier: 'platinum',
//   totalStaked: 50000,
//   lifetime_value: 50000,            ← computed
//   days_since_last_stake: 3,         ← computed
//   avg_stake_amount: 5000,           ← computed
//   churn_risk: 0.12,                 ← ML prediction
// }

console.log('Aliases:', fullProfile.aliases);
// [
//   { type: 'email', value: 'alex@dao.finance', isVerified: true },
//   { type: 'user_id', value: 'user-fs-99' },
//   { type: 'wallet', value: '0x742d35Cc...' },
//   { type: 'device_id', value: 'iphone-14-xyz' },
// ]
```

### Example 4: Identity Graph Exploration

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Get the full identity graph for a profile
// ═══════════════════════════════════════════════════════════════════════════════

const graph = await identityGraph.getProfileGraph('profile-xyz');

console.log('Nodes:', graph.nodes.length);
// [
//   { type: 'email', value: 'jordan@...', occurrences: 45 },
//   { type: 'user_id', value: 'user-7x9k2', occurrences: 120 },
//   { type: 'device_id', value: 'iphone-abc', occurrences: 89 },
//   { type: 'device_id', value: 'macbook-def', occurrences: 31 },
//   { type: 'wallet', value: '0xABC...', occurrences: 12 },
//   { type: 'cookie', value: 'ga_12345', occurrences: 200 },
// ]

console.log('Edges:', graph.edges.length);
// [
//   { source: 'email', target: 'user_id', strength: 45, linkType: 'same_event' },
//   { source: 'user_id', target: 'iphone-abc', strength: 89, linkType: 'same_session' },
//   { source: 'user_id', target: 'macbook-def', strength: 31, linkType: 'same_session' },
//   { source: 'email', target: 'wallet', strength: 12, linkType: 'explicit' },
// ]
```

### Example 5: Profile Merge

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Merge two profiles (e.g., customer service found duplicate)
// ═══════════════════════════════════════════════════════════════════════════════

const mergedProfile = await profileService.mergeProfiles(
  'profile-primary-123',    // Winner — keeps ID
  'profile-secondary-456',  // Loser — marked as 'merged'
  'manual',                 // Reason
  'admin-user-id',          // Who triggered it
);

console.log('Merged profile:', mergedProfile.id);  // profile-primary-123
console.log('Total events:', mergedProfile.totalEvents);  // Combined from both
console.log('LTV:', mergedProfile.ltvAmount);              // Summed
console.log('First seen:', mergedProfile.firstSeenAt);     // Earliest of both

// The secondary profile now has:
// status: 'merged', mergedIntoId: 'profile-primary-123'
// All aliases moved to primary profile
```

### Example 6: Define and Compute Traits

```typescript
import { TraitEngine } from '@mcv/cdp';

const traitEngine = new TraitEngine(eventBus);

// ═══════════════════════════════════════════════════════════════════════════════
// Define computed traits for BetEdge
// ═══════════════════════════════════════════════════════════════════════════════

await traitEngine.defineTrait({
  ventureId: 'betedge-venture-uuid',
  key: 'total_bets',
  name: 'Total Bets Placed',
  category: 'behavior',
  type: 'number',
  source: 'computed',
  computationRule: {
    type: 'aggregate',
    eventName: 'Bet Placed',
    aggregation: 'count',
  },
});

await traitEngine.defineTrait({
  ventureId: 'betedge-venture-uuid',
  key: 'total_wagered',
  name: 'Total Amount Wagered',
  category: 'financial',
  type: 'number',
  source: 'computed',
  computationRule: {
    type: 'aggregate',
    eventName: 'Bet Placed',
    aggregation: 'sum',
    propertyPath: 'revenue',
  },
});

await traitEngine.defineTrait({
  ventureId: 'betedge-venture-uuid',
  key: 'days_since_last_bet',
  name: 'Days Since Last Bet',
  category: 'behavior',
  type: 'number',
  source: 'computed',
  computationRule: {
    type: 'recency',
    sinceEvent: 'Bet Placed',
    unit: 'days',
  },
});

await traitEngine.defineTrait({
  ventureId: 'betedge-venture-uuid',
  key: 'active_days_30d',
  name: 'Active Days (Last 30)',
  category: 'behavior',
  type: 'number',
  source: 'computed',
  computationRule: {
    type: 'frequency',
    windowDays: 30,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// Set manual traits
// ═══════════════════════════════════════════════════════════════════════════════

await traitEngine.setTraits('profile-xyz', {
  preferred_sport: 'basketball',
  favorite_team: 'Lakers',
  vip_status: 'gold',
  signup_source: 'referral',
}, 'manual');

// ═══════════════════════════════════════════════════════════════════════════════
// Force-compute all traits for a profile
// ═══════════════════════════════════════════════════════════════════════════════

const computed = await traitEngine.computeTraits('profile-xyz');
console.log(computed);
// {
//   total_bets: 156,
//   total_wagered: 12450.00,
//   days_since_last_bet: 2,
//   active_days_30d: 18,
// }
```

### Example 7: Batch Trait Computation

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Nightly batch: recompute 'total_wagered' for all BetEdge profiles
// ═══════════════════════════════════════════════════════════════════════════════

const result = await traitEngine.runBatchComputation(
  'betedge-venture-uuid',
  'total_wagered',
);

console.log(`Job ID: ${result.jobId}`);
console.log(`Profiles processed: ${result.processed}`);  // 125,000
console.log(`Profiles updated: ${result.updated}`);       // 48,200
```

### Example 8: Build and Compute Segments

```typescript
import { SegmentService } from '@mcv/cdp';

const segmentService = new SegmentService(eventBus);

// ═══════════════════════════════════════════════════════════════════════════════
// Create a "High-Value Churning" segment
// ═══════════════════════════════════════════════════════════════════════════════

const segment = await segmentService.createSegment({
  ventureId: 'betedge-venture-uuid',
  name: 'High-Value Churn Risk',
  slug: 'high-value-churn-risk',
  description: 'Users with LTV > $500 who haven\'t placed a bet in 30+ days',
  type: 'dynamic',
  rules: {
    operator: 'and',
    conditions: [
      { type: 'trait', traitKey: 'lifetime_value', operator: 'gte', value: 500 },
      { type: 'trait', traitKey: 'days_since_last_bet', operator: 'gte', value: 30 },
      { type: 'trait', traitKey: 'total_bets', operator: 'gte', value: 5 },
    ],
  },
  tags: ['retention', 'high-value', 'churn'],
});

// ═══════════════════════════════════════════════════════════════════════════════
// Estimate size before full computation
// ═══════════════════════════════════════════════════════════════════════════════

const estimated = await segmentService.estimateSize(segment.id);
console.log(`Estimated size: ${estimated} profiles`);  // ~2,340

// ═══════════════════════════════════════════════════════════════════════════════
// Full computation — materializes membership
// ═══════════════════════════════════════════════════════════════════════════════

const result = await segmentService.computeSegment(segment.id);
console.log(`Segment computed: ${result.total} members`);
console.log(`Added: ${result.added}, Removed: ${result.removed}`);
```

### Example 9: Complex Nested Segment Rules

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// "Engaged mobile users from paid campaigns who purchased in last 7 days"
// ═══════════════════════════════════════════════════════════════════════════════

await segmentService.createSegment({
  ventureId: 'serpspace-venture-uuid',
  name: 'Mobile Paid Converters (7d)',
  slug: 'mobile-paid-converters-7d',
  type: 'dynamic',
  rules: {
    operator: 'and',
    conditions: [
      // Device is mobile
      { type: 'trait', traitKey: 'last_device_type', operator: 'eq', value: 'mobile' },
      // From paid campaign
      {
        type: 'trait',
        traitKey: 'utm_medium',
        operator: 'in',
        value: ['cpc', 'paid_social', 'display'],
      },
      // Purchased in last 7 days
      {
        type: 'event',
        eventName: 'Order Completed',
        timeframe: { value: 7, unit: 'days' },
        operator: 'exists',
      },
      // Active at least 3 days in last 30
      { type: 'trait', traitKey: 'active_days_30d', operator: 'gte', value: 3 },
    ],
  },
});
```

### Example 10: Profile Search with Trait Filtering

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Search for high-value crypto users in Canada
// ═══════════════════════════════════════════════════════════════════════════════

const results = await profileService.searchProfiles({
  ventureId: 'futurestate-venture-uuid',
  traits: {
    stakingTier: 'platinum',
    country: 'CA',
  },
  lastSeenAfter: new Date('2026-01-01'),
  limit: 50,
  offset: 0,
});

console.log(`Found ${results.total} profiles`);
for (const profile of results.profiles) {
  console.log(`  ${profile.displayName} — LTV: $${profile.ltvAmount}`);
}
```

### Example 11: GDPR Profile Suppression

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Right to be forgotten — suppress all PII
// ═══════════════════════════════════════════════════════════════════════════════

await profileService.suppressProfile('profile-gdpr-request', 'GDPR erasure request #4521');

// After suppression:
// - canonicalEmail: null
// - canonicalPhone: null
// - displayName: '[Suppressed]'
// - traits: {}
// - externalIds: {}
// - All aliases DELETED
// - Status: 'suppressed'
// - Events are kept but profile link is anonymized
```

### Example 12: Configure and Test Destinations

```typescript
import { SyncOrchestrator } from '@mcv/cdp';

const syncOrchestrator = new SyncOrchestrator(eventBus);

// ═══════════════════════════════════════════════════════════════════════════════
// Create a Facebook Custom Audiences destination
// ═══════════════════════════════════════════════════════════════════════════════

const destination = await db.insert(destinations).values({
  ventureId: 'betedge-venture-uuid',
  name: 'BetEdge Facebook Ads',
  type: 'facebook_ads',
  config: {
    accountId: 'act_123456789',
    audienceId: '12345678901234',
    batchSize: 500,
    retryAttempts: 3,
  },
  credentials: {
    accessToken: encrypt('EAAGm0PX4ZCps...'),  // Encrypted at rest
  },
  fieldMappings: [
    { sourceField: 'canonicalEmail', destField: 'email', transform: 'hash' },
    { sourceField: 'canonicalPhone', destField: 'phone', transform: 'phone_e164' },
    { sourceField: 'traits.first_name', destField: 'fn', transform: 'lowercase' },
    { sourceField: 'traits.last_name', destField: 'ln', transform: 'lowercase' },
    { sourceField: 'country', destField: 'country' },
  ],
}).returning().then(r => r[0]);

// ═══════════════════════════════════════════════════════════════════════════════
// Test the connection
// ═══════════════════════════════════════════════════════════════════════════════

const testResult = await syncOrchestrator.testDestination(destination.id);
console.log(`Test: ${testResult.success ? '✓' : '✗'} — ${testResult.message}`);
```

### Example 13: Trigger Segment Sync

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Create sync config: "High-Value Churn Risk" → Facebook Ads
// ═══════════════════════════════════════════════════════════════════════════════

const syncConfig = await db.insert(syncConfigs).values({
  segmentId: 'segment-churn-risk-id',
  destinationId: destination.id,
  mode: 'incremental',
  scheduleType: 'scheduled',
  cronExpression: '0 6 * * *',     // Daily at 6 AM
  includeTraits: ['lifetime_value', 'total_bets', 'preferred_sport'],
}).returning().then(r => r[0]);

// ═══════════════════════════════════════════════════════════════════════════════
// Trigger manual sync
// ═══════════════════════════════════════════════════════════════════════════════

const job = await syncOrchestrator.triggerSync(syncConfig.id, 'manual');

console.log(`Sync job started: ${job.id}`);
console.log(`Status: ${job.status}`);

// Poll for completion
const completed = await pollJobStatus(job.id);
console.log(`Synced ${completed.successfulRecords}/${completed.totalRecords} records`);
console.log(`Failed: ${completed.failedRecords}`);
```

### Example 14: Webhook Destination Sync

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Sync segment data to a custom webhook (data warehouse ETL)
// ═══════════════════════════════════════════════════════════════════════════════

const webhookDest = await db.insert(destinations).values({
  ventureId: 'betedge-venture-uuid',
  name: 'Data Warehouse Webhook',
  type: 'webhook',
  config: {
    url: 'https://etl.internal.mcv.one/cdp/ingest',
    method: 'POST',
    headers: { 'X-API-Key': 'wh-secret-key' },
    batchSize: 1000,
    retryAttempts: 5,
  },
  fieldMappings: [
    { sourceField: 'id', destField: 'profile_id' },
    { sourceField: 'canonicalEmail', destField: 'email', transform: 'hash' },
    { sourceField: 'traits', destField: 'traits' },
    { sourceField: 'ltvAmount', destField: 'ltv' },
    { sourceField: 'totalEvents', destField: 'event_count' },
    { sourceField: 'lastSeenAt', destField: 'last_active' },
  ],
}).returning().then(r => r[0]);
```

### Example 15: Event Metrics Dashboard Query

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Query event metrics for an analytics dashboard
// ═══════════════════════════════════════════════════════════════════════════════

const metrics = await collector.getMetrics({
  ventureId: 'betedge-venture-uuid',
  eventName: 'Bet Placed',
  granularity: 'day',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-02-08'),
});

for (const row of metrics) {
  console.log(`${row.windowStart.toISOString().split('T')[0]}: ` +
    `${row.eventCount} bets by ${row.uniqueProfiles} users, ` +
    `$${row.totalRevenue} wagered`);
}

// Output:
// 2026-01-01: 3,421 bets by 1,204 users, $171,050.00 wagered
// 2026-01-02: 2,890 bets by 1,102 users, $144,500.00 wagered
// ...
// 2026-02-08: 4,105 bets by 1,567 users, $205,250.00 wagered

// ═══════════════════════════════════════════════════════════════════════════════
// Query cross-venture event summary
// ═══════════════════════════════════════════════════════════════════════════════

const allVentureMetrics = await Promise.all(
  MCV_VENTURES.map(v =>
    collector.getMetrics({
      ventureId: v.id,
      granularity: 'month',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-02-01'),
    })
  )
);

const totalEvents = allVentureMetrics.flat().reduce((sum, m) => sum + m.eventCount, 0);
console.log(`Total events across all ventures in Jan 2026: ${totalEvents.toLocaleString()}`);
```

---

## Cross-Venture Data Flow

The CDP is designed to handle the 9 MCV ventures with complete data isolation via `ventureId` scoping, while enabling cross-venture insights at the portfolio level.

### Venture-Specific Event Taxonomy

| Venture | Key Events | Revenue Properties |
|---------|-----------|-------------------|
| **BetEdge** | Bet Placed, Bet Won, Bet Lost, Deposit Made, Withdrawal Requested | wager, payout, deposit |
| **SerpSpace** | Order Completed, Subscription Started, Tool Used, Report Generated | revenue, mrr |
| **FutureState** | Token Staked, Token Unstaked, Proposal Voted, Governance Participated | stakeAmount, reward |
| **FullGain** | Grant Applied, Grant Approved, Milestone Completed, Report Submitted | grantAmount, disbursement |
| **StreamFi** | Stream Started, Content Published, Tip Received, Subscription Created | tipAmount, subRevenue |
| **JACKED** | Workout Logged, Challenge Joined, Achievement Unlocked, Purchase Made | purchaseAmount |
| **SkyBeam** | Campaign Created, Ad Launched, Report Viewed, Budget Allocated | adSpend, roi |
| **Nexarion** | API Call Made, Model Deployed, Dataset Uploaded, Job Completed | usageFee |
| **MCV Admin** | User Invited, Venture Created, Report Generated, Config Changed | — |

---

## Database Table Summary

| Table | Description | Est. Rows | Partitioning |
|-------|-------------|-----------|-------------|
| `cdp_profile` | Unified customer profiles | 1M+ | By venture |
| `cdp_profile_alias` | Email/phone/device/wallet identifiers | 3M+ | — |
| `cdp_profile_merge` | Merge audit trail | 50K+ | — |
| `cdp_profile_timeline` | Aggregated activity feed | 10M+ | By date |
| `cdp_identity_node` | Identity graph nodes | 5M+ | — |
| `cdp_identity_edge` | Identity graph co-occurrence edges | 10M+ | — |
| `cdp_resolution_rule` | Per-venture merge policies | 100+ | — |
| `cdp_event` | Raw behavioral events | 100M+ | **By date (monthly)** |
| `cdp_event_definition` | Event schema registry | 500+ | — |
| `cdp_event_metric` | Pre-aggregated metrics | 1M+ | By granularity |
| `cdp_trait_definition` | Trait schema definitions | 500+ | — |
| `cdp_trait_value` | Per-profile trait values | 5M+ | — |
| `cdp_trait_computation_job` | Batch computation history | 10K+ | — |
| `cdp_segment` | Segment definitions | 500+ | — |
| `cdp_segment_membership` | Profile ↔ segment membership | 20M+ | — |
| `cdp_segment_computation` | Segment computation audit trail | 10K+ | — |
| `cdp_destination` | External destination configs | 100+ | — |
| `cdp_sync_config` | Segment → destination bindings | 200+ | — |
| `cdp_sync_job` | Sync execution history | 50K+ | By date |

### Partitioning Strategy

```sql
-- Events table: range partition by month for query performance
CREATE TABLE cdp_event (
  id TEXT PRIMARY KEY,
  venture_id TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  ...
) PARTITION BY RANGE (timestamp);

-- Monthly partitions (auto-created by pg_partman or cron)
CREATE TABLE cdp_event_2026_01 PARTITION OF cdp_event
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE cdp_event_2026_02 PARTITION OF cdp_event
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Archive old partitions to cold storage after 12 months
-- Retention: 3 months hot (SSD), 12 months warm (HDD), archive to S3
```

---

## Relationship to Entity Graph

The CDP integrates with the MCV entity graph system (see `entity-graph.ts`) by registering profiles as entity nodes:

```typescript
// When a CDP profile is created, register it as an entity node
await db.insert(entityNodes).values({
  entityType: 'contact',         // Maps to entity graph's 'contact' type
  entityId: profile.id,          // The CDP profile ID
  ventureId: profile.ventureId,
  displayName: profile.displayName ?? 'Anonymous',
  status: profile.status,
  metadata: {
    type: profile.type,
    email: profile.canonicalEmail,
    ltvAmount: profile.ltvAmount,
  },
  importance: profile.ltvAmount > 10000 ? 'high' : 'medium',
  lastActivityAt: profile.lastSeenAt,
});

// Create relationships to ventures, deals, etc.
await db.insert(entityRelationships).values({
  sourceNodeId: profileNodeId,
  targetNodeId: ventureNodeId,
  relationshipType: 'part_of',
  strength: 1.0,
  direction: 'unidirectional',
});
```

This enables:
- Cross-entity queries: "Show all deals related to profiles in segment X"
- Entity timeline: CDP events appear in the universal activity feed
- AI insights: NAOS agents can reason about customer relationships
- Bridge tables: Tasks, documents, and RAG stores can link to CDP profiles

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 |
|-----------|--------|-----|
| `track()` — single event | < 50ms | < 150ms |
| `trackBatch()` — 100 events | < 500ms | < 1.5s |
| `identify()` — with backfill | < 200ms | < 800ms |
| `resolve()` — identity resolution | < 30ms | < 100ms |
| `getProfile()` — with traits | < 50ms | < 200ms |
| `searchProfiles()` — 50 results | < 100ms | < 500ms |
| `computeTraits()` — single profile | < 200ms | < 1s |
| `estimateSize()` — segment count | < 100ms | < 500ms |
| `computeSegment()` — 100K profiles | < 30s | < 120s |
| `isMember()` — real-time check | < 20ms | < 50ms |
| `triggerSync()` — job start | < 100ms | < 200ms |
| Sync execution — 10K records | < 60s | < 300s |

### Throughput

| Metric | Development | Production |
|--------|------------|------------|
| Events/second (ingestion) | 100 | 10,000+ |
| Events/day (all ventures) | 100K | 10M+ |
| Concurrent profile lookups | 50 | 1,000+ |
| Segment computations/hour | 10 | 100+ |
| Sync records/minute | 1,000 | 50,000+ |

### Optimization Strategies

1. **Event partitioning** — Monthly range partitions on `cdp_event` for efficient time-range queries and automatic pruning
2. **Trait materialization** — Computed traits are denormalized into `profiles.traits` JSONB for O(1) segment evaluation
3. **Identity hash index** — SHA-256 value hashes on `cdp_identity_node` for constant-time lookups without exposing PII
4. **Batch event processing** — Events are queued and batch-inserted in transactions for throughput
5. **Debounced trait computation** — 5-second debounce prevents redundant computations during event bursts
6. **Incremental segment computation** — Only diffs (added/removed) are processed, not full recomputation
7. **Pre-aggregated metrics** — `cdp_event_metric` stores hourly/daily/weekly/monthly rollups for dashboard queries
8. **Connection pooling** — Shared Drizzle connection pool across all CDP submodules
9. **Index coverage** — Composite indexes on (venture_id, timestamp) and (profile_id, timestamp) cover 90% of queries
10. **Segment membership caching** — Materialized membership in `cdp_segment_membership` avoids repeated rule evaluation

### Scaling Notes

```
Small (< 100K profiles, < 1M events/month):
  → Single Postgres instance, no partitioning needed
  → All computations synchronous

Medium (100K–1M profiles, 10M events/month):
  → Postgres with table partitioning on events
  → Async trait computation via job queue
  → Redis for identity resolution cache

Large (1M+ profiles, 100M+ events/month):
  → Postgres with read replicas for queries
  → ClickHouse for event analytics (OLAP)
  → Redis cluster for identity cache + segment cache
  → Dedicated worker processes for batch computation
  → Consider Kafka for event ingestion pipeline
```

---

## Security Considerations

### Data Privacy

- **GDPR/CCPA compliance**: Built-in `suppressProfile()` clears all PII and emits audit event
- **PII hashing**: All identity values are stored as SHA-256 hashes for indexed lookups; raw values stored separately with encryption-at-rest
- **Consent tracking**: Profiles can have consent flags in traits (e.g., `marketing_consent: true`)
- **Data minimization**: Only collect what's needed; event properties are schema-validated
- **Right to erasure**: Profile suppression deletes aliases, clears traits, and anonymizes events
- **Data retention**: Configurable per-venture retention policies with automatic partition pruning

### Access Control

- **Venture isolation**: All queries are scoped by `ventureId`; cross-venture access requires explicit admin permission
- **Row-Level Security (RLS)**: Postgres RLS policies on all CDP tables enforce venture isolation at the database level
- **API authorization**: All tRPC routes require authenticated sessions with venture membership
- **Admin operations**: Merge, suppress, and batch operations require elevated permissions
- **Sync credentials**: Destination credentials encrypted at rest with venture-specific encryption keys

### Identity Security

- **Value hashing**: Identity values (emails, phones, wallets) hashed with SHA-256 before storage
- **Brute-force protection**: Rate limiting on identity resolution endpoints
- **Merge audit trail**: Every merge is logged with full conflict resolution details for forensic review
- **Suppression cascade**: When a profile is suppressed, all linked identities, traits, and sync records are cleaned

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `cdp.profile.created` | system | New profile created |
| `cdp.profile.updated` | system | Profile traits or metadata updated |
| `cdp.profile.merged` | system | Two profiles merged (includes merge log) |
| `cdp.profile.suppressed` | privacy | Profile suppressed (GDPR/CCPA) |
| `cdp.profile.deleted` | privacy | Profile hard-deleted |
| `cdp.identity.linked` | system | Two identifiers linked via co-occurrence |
| `cdp.identity.resolved` | system | Identifiers resolved to a profile |
| `cdp.merge.requested` | system | Profile merge requested (pending review) |
| `cdp.merge.candidate` | system | Potential merge detected (needs review) |
| `cdp.event.tracked` | system | Event tracked and stored |
| `cdp.event.batch_processed` | system | Batch of events processed |
| `cdp.trait.defined` | admin | New trait definition created |
| `cdp.trait.updated` | system | Trait value updated on a profile |
| `cdp.trait.computed` | system | Computed trait recalculated |
| `cdp.trait.batch_completed` | system | Batch trait computation finished |
| `cdp.segment.created` | admin | New segment created |
| `cdp.segment.computed` | system | Segment membership recomputed |
| `cdp.segment.member_added` | system | Profile entered a segment |
| `cdp.segment.member_removed` | system | Profile exited a segment |
| `cdp.sync.triggered` | system | Sync job triggered |
| `cdp.sync.completed` | system | Sync job completed (success/partial) |
| `cdp.sync.failed` | error | Sync job failed |
| `cdp.destination.created` | admin | New destination configured |
| `cdp.destination.tested` | admin | Destination connection tested |
| `cdp.destination.test_failed` | error | Destination connection test failed |

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════════════════════
CDP_DATABASE_URL=postgresql://...                # Primary database connection
CDP_DATABASE_POOL_MIN=5                          # Minimum pool connections
CDP_DATABASE_POOL_MAX=50                         # Maximum pool connections

# ═══════════════════════════════════════════════════════════════════════════════
# EVENT INGESTION
# ═══════════════════════════════════════════════════════════════════════════════
CDP_EVENT_BATCH_SIZE=100                         # Max events per batch insert
CDP_EVENT_BATCH_TIMEOUT_MS=5000                  # Flush batch after N ms
CDP_EVENT_DEDUP_WINDOW_HOURS=24                  # Message ID dedup window
CDP_EVENT_MAX_PROPERTIES_SIZE_KB=64              # Max event properties size
CDP_EVENT_RETENTION_MONTHS=12                    # Hot storage retention
CDP_EVENT_ARCHIVE_ENABLED=true                   # Archive old partitions to S3

# ═══════════════════════════════════════════════════════════════════════════════
# IDENTITY RESOLUTION
# ═══════════════════════════════════════════════════════════════════════════════
CDP_IDENTITY_AUTO_MERGE=true                     # Enable automatic profile merging
CDP_IDENTITY_MIN_CONFIDENCE=0.8                  # Min confidence for auto-merge
CDP_IDENTITY_HASH_ALGORITHM=sha256               # Hash algorithm for values
CDP_IDENTITY_CACHE_TTL_SECONDS=300               # Redis cache TTL for lookups
CDP_IDENTITY_MAX_ALIASES_PER_PROFILE=50          # Safety limit

# ═══════════════════════════════════════════════════════════════════════════════
# TRAIT ENGINE
# ═══════════════════════════════════════════════════════════════════════════════
CDP_TRAIT_COMPUTATION_DEBOUNCE_MS=5000           # Debounce window for computations
CDP_TRAIT_BATCH_SIZE=1000                        # Profiles per batch computation
CDP_TRAIT_BATCH_CONCURRENCY=4                    # Parallel batch workers
CDP_TRAIT_COMPUTATION_TIMEOUT_MS=300000          # 5-minute timeout per batch job

# ═══════════════════════════════════════════════════════════════════════════════
# SEGMENTATION
# ═══════════════════════════════════════════════════════════════════════════════
CDP_SEGMENT_MAX_RULES_DEPTH=5                    # Max nesting depth for rules
CDP_SEGMENT_COMPUTATION_TIMEOUT_MS=600000        # 10-minute timeout
CDP_SEGMENT_RECOMPUTE_CRON="0 2 * * *"           # Nightly recomputation at 2 AM
CDP_SEGMENT_MAX_SIZE=10000000                    # Safety limit: 10M profiles

# ═══════════════════════════════════════════════════════════════════════════════
# SYNC
# ═══════════════════════════════════════════════════════════════════════════════
CDP_SYNC_DEFAULT_BATCH_SIZE=100                  # Records per sync batch
CDP_SYNC_MAX_RETRY_ATTEMPTS=5                    # Max retries per failed record
CDP_SYNC_RETRY_BACKOFF_MS=1000                   # Initial retry backoff
CDP_SYNC_TIMEOUT_MS=600000                       # 10-minute sync timeout
CDP_SYNC_CONCURRENT_JOBS=3                       # Max concurrent sync jobs

# ═══════════════════════════════════════════════════════════════════════════════
# REDIS (Caching & Queues)
# ═══════════════════════════════════════════════════════════════════════════════
CDP_REDIS_URL=redis://localhost:6379/2           # Redis instance for CDP
CDP_REDIS_KEY_PREFIX=cdp:                        # Key namespace

# ═══════════════════════════════════════════════════════════════════════════════
# PRIVACY & COMPLIANCE
# ═══════════════════════════════════════════════════════════════════════════════
CDP_PII_ENCRYPTION_KEY=...                       # AES-256 key for PII at rest
CDP_SUPPRESSION_CASCADE=true                     # Cascade suppression to sync
CDP_CONSENT_REQUIRED=false                       # Require consent before tracking
CDP_DATA_RETENTION_DEFAULT_MONTHS=24             # Default retention period
```

---

## Error Codes

| Code | Name | Description | HTTP |
|------|------|-------------|------|
| `CDP_PROFILE_NOT_FOUND` | Profile Not Found | No profile exists with the given ID | 404 |
| `CDP_PROFILE_SUPPRESSED` | Profile Suppressed | Profile has been suppressed (GDPR) | 410 |
| `CDP_PROFILE_MERGED` | Profile Merged | Profile was merged into another; use `mergedIntoId` | 301 |
| `CDP_MERGE_FAILED` | Merge Failed | Profile merge could not be completed | 500 |
| `CDP_MERGE_SAME_PROFILE` | Same Profile | Cannot merge a profile with itself | 400 |
| `CDP_MERGE_CROSS_VENTURE` | Cross-Venture Merge | Cannot merge profiles from different ventures | 400 |
| `CDP_IDENTITY_CONFLICT` | Identity Conflict | Identity value already associated with another profile | 409 |
| `CDP_IDENTITY_LIMIT` | Alias Limit | Profile has reached max alias count | 429 |
| `CDP_EVENT_DUPLICATE` | Duplicate Event | Event with this messageId already exists | 409 |
| `CDP_EVENT_INVALID_SCHEMA` | Invalid Event Schema | Event properties don't match definition schema | 422 |
| `CDP_EVENT_TOO_LARGE` | Event Too Large | Event properties exceed size limit | 413 |
| `CDP_TRAIT_NOT_FOUND` | Trait Not Found | Trait definition not found for this venture | 404 |
| `CDP_TRAIT_TYPE_MISMATCH` | Trait Type Mismatch | Value type doesn't match trait definition | 422 |
| `CDP_TRAIT_VALIDATION` | Trait Validation Failed | Value failed validation rules | 422 |
| `CDP_TRAIT_COMPUTATION_FAILED` | Computation Failed | Trait computation encountered an error | 500 |
| `CDP_SEGMENT_NOT_FOUND` | Segment Not Found | No segment exists with the given ID | 404 |
| `CDP_SEGMENT_INVALID_RULES` | Invalid Rules | Segment rules are malformed or too deeply nested | 422 |
| `CDP_SEGMENT_STATIC_ONLY` | Static Only | Operation only valid for static segments | 400 |
| `CDP_SEGMENT_COMPUTING` | Segment Computing | Segment is currently being recomputed | 409 |
| `CDP_DESTINATION_NOT_FOUND` | Destination Not Found | No destination exists with the given ID | 404 |
| `CDP_DESTINATION_TEST_FAILED` | Test Failed | Destination connection test failed | 502 |
| `CDP_DESTINATION_NO_ADAPTER` | No Adapter | No adapter registered for this destination type | 501 |
| `CDP_SYNC_CONFIG_NOT_FOUND` | Sync Config Not Found | No sync config exists with the given ID | 404 |
| `CDP_SYNC_INACTIVE` | Sync Inactive | Sync configuration is not active | 400 |
| `CDP_SYNC_IN_PROGRESS` | Sync In Progress | A sync job is already running for this config | 409 |
| `CDP_VENTURE_REQUIRED` | Venture Required | ventureId is required for all CDP operations | 400 |
| `CDP_UNAUTHORIZED` | Unauthorized | Insufficient permissions for this operation | 403 |
| `CDP_RATE_LIMITED` | Rate Limited | Too many requests; try again later | 429 |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-orm | ^0.29.x | Database ORM (Postgres with JSONB) |
| @paralleldrive/cuid2 | ^2.x | Collision-resistant unique IDs |
| zod | ^3.x | Input validation and schema definition |
| ioredis | ^5.x | Identity cache, computation queue, rate limiting |
| node-cron | ^3.x | Scheduled segment recomputation and sync |
| crypto (built-in) | — | SHA-256 hashing for identity values |
| @mcv/events | workspace | Internal event bus for CDP audit events |
| @mcv/db | workspace | Shared database connection and migrations |
| @mcv/portfolio | workspace | Venture schema references |
| @mcv/kernel | workspace | User/auth schema references |

### Downstream Consumers

| Package | Consumes | Purpose |
|---------|----------|---------|
| @mcv/marketing | Segments, Profiles | Campaign targeting and personalization |
| @mcv/agentic-os | Profiles, Traits | Agent customer context for NAOS |
| @mcv/commerce | Events, Profiles | Purchase tracking, cart abandonment |
| @mcv/compliance | Audit Events, Suppression | GDPR/CCPA compliance workflows |
| @mcv/analytics | Event Metrics, Segments | Portfolio-wide analytics dashboards |

---

## Testing Notes

### Unit Testing

```typescript
import { IdentityGraph, TraitEngine, SegmentService, EventCollector } from '@mcv/cdp';

describe('Identity Resolution', () => {
  it('should resolve email to existing profile', async () => {
    const result = await identityGraph.resolve({
      ventureId: 'test-venture',
      email: 'test@example.com',
    });

    expect(result.profileId).toBe('existing-profile-id');
    expect(result.confidence).toBe(1.0);
    expect(result.isNewProfile).toBe(false);
  });

  it('should return null for unknown identifiers', async () => {
    const result = await identityGraph.resolve({
      ventureId: 'test-venture',
      email: 'unknown@example.com',
    });

    expect(result.profileId).toBeNull();
    expect(result.isNewProfile).toBe(true);
  });

  it('should trigger auto-merge when multiple profiles share identifiers', async () => {
    // Setup: two profiles with different emails but same phone
    const result = await identityGraph.resolve({
      ventureId: 'test-venture',
      email: 'user-a@example.com',
      phone: '+15551234567',         // Shared with user-b
    });

    // Should merge and return the primary (more events)
    expect(result.profileId).toBe('profile-with-more-events');
    expect(result.matchedIdentities).toHaveLength(2);
  });
});

describe('Trait Engine', () => {
  it('should compute aggregate trait from events', async () => {
    const traits = await traitEngine.computeTraits('profile-with-orders');

    expect(traits.total_orders).toBe(15);
    expect(traits.lifetime_revenue).toBeCloseTo(2499.85, 2);
  });

  it('should validate trait type on set', async () => {
    await expect(
      traitEngine.setTrait('profile-id', 'total_bets', 'not-a-number', 'manual')
    ).rejects.toThrow('expects number, got string');
  });
});

describe('Segment Evaluation', () => {
  it('should correctly evaluate trait conditions', async () => {
    const isMember = await segmentService.isMember(
      'high-ltv-segment',
      'profile-with-high-ltv',
    );

    expect(isMember).toBe(true);
  });

  it('should compute segment diff correctly', async () => {
    const result = await segmentService.computeSegment('test-segment');

    expect(result.total).toBeGreaterThan(0);
    expect(result.added).toBeGreaterThanOrEqual(0);
    expect(result.removed).toBeGreaterThanOrEqual(0);
  });
});

describe('Event Deduplication', () => {
  it('should reject duplicate messageId', async () => {
    await collector.track({
      ventureId: 'test',
      category: 'track',
      name: 'Test',
      messageId: 'msg-123',
      source: 'test',
    });

    await expect(
      collector.track({
        ventureId: 'test',
        category: 'track',
        name: 'Test',
        messageId: 'msg-123',
        source: 'test',
      })
    ).rejects.toThrow('CDP_EVENT_DUPLICATE');
  });
});
```

### Integration Testing

```typescript
describe('CDP E2E: Anonymous → Identified → Segmented → Synced', () => {
  it('should handle complete customer lifecycle', async () => {
    // 1. Track anonymous events
    const { eventId } = await collector.page({
      ventureId: 'test-venture',
      anonymousId: 'anon-device-123',
      source: 'web',
    });
    expect(eventId).toBeTruthy();

    // 2. Identify the user
    const { profileId } = await collector.identify({
      ventureId: 'test-venture',
      userId: 'user-456',
      anonymousId: 'anon-device-123',
      traits: { email: 'test@example.com', plan: 'premium' },
      source: 'web',
    });
    expect(profileId).toBeTruthy();

    // 3. Verify anonymous events were backfilled
    const profile = await profileService.getProfile(profileId);
    expect(profile?.totalEvents).toBeGreaterThan(0);

    // 4. Track revenue event
    await collector.track({
      ventureId: 'test-venture',
      profileId,
      category: 'track',
      name: 'Order Completed',
      properties: { revenue: 99.99, currency: 'USD' },
      source: 'web',
    });

    // 5. Verify LTV updated
    const updated = await profileService.getProfile(profileId);
    expect(Number(updated?.ltvAmount)).toBeCloseTo(99.99, 2);

    // 6. Compute traits
    const traits = await traitEngine.computeTraits(profileId);
    expect(traits.total_orders).toBe(1);

    // 7. Check segment membership
    const isMember = await segmentService.isMember('paying-customers', profileId);
    expect(isMember).toBe(true);

    // 8. Trigger sync
    const job = await syncOrchestrator.triggerSync('sync-config-id', 'manual');
    expect(job.status).toBe('running');
  });
});
```

---

## Cron Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| `0 2 * * *` | Segment Recomputation | Recompute all active dynamic segments |
| `0 3 * * *` | Trait Batch Computation | Recompute computed traits for all active profiles |
| `0 4 * * *` | Event Metrics Rollup | Aggregate hourly metrics into daily/weekly/monthly |
| `0 6 * * *` | Scheduled Syncs | Execute all sync configs with `scheduleType: 'scheduled'` |
| `0 0 1 * *` | Partition Management | Create next month's event partition, archive old ones |
| `0 5 * * 0` | Identity Graph Cleanup | Remove orphaned nodes and low-confidence edges |

---

*@mcv/cdp — Customer Data Platform Module*