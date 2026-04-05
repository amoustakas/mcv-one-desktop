# @mcv/cdp/profiles — Unified Customer Profiles

**Parent Package:** @mcv/cdp  
**Submodule:** profiles  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** INTERNAL (MCV-Only — Never Published)  
**Last Updated:** February 9, 2026

---

## Purpose

The `profiles` submodule is the **unified 360° customer profile layer** for the MCV.ONE Customer Data Platform. It owns the core `cdp_profile` table and all operations for creating, reading, updating, merging, searching, and suppressing customer profiles across all 9 MCV ventures.

Every person interacting with any MCV venture — whether placing a bet on BetEdge, staking tokens on FutureState, purchasing SEO tools on SerpSpace, or streaming on StreamFi — is represented by a single canonical profile. This submodule ensures that profile is accurate, complete, and privacy-compliant.

**Key responsibilities:**

- **Profile lifecycle management** — Create, read, update, and delete customer profiles with full audit trail
- **Profile merging** — Deterministic and probabilistic merge engine that consolidates duplicate profiles while preserving data integrity
- **Profile search** — Multi-criteria search with JSONB trait filtering, venture scoping, and pagination
- **GDPR/CCPA compliance** — Built-in suppression workflow that clears all PII, deletes aliases, and anonymizes linked records
- **360° view assembly** — Combines raw profile data with computed traits, identity aliases, segment memberships, and activity timeline
- **Cross-venture resolution** — Works with the identity-graph submodule to recognize the same person across different ventures
- **LTV tracking** — Automatic lifetime value computation from revenue events across all touchpoints

---

## Exports

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORE SERVICE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export {
  ProfileService,            // Create, read, update, merge, suppress profiles
  ProfileMerger,             // Deterministic & probabilistic merge engine
  ProfileResolver,           // Resolve identifiers → profile
} from './service';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUERY FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export {
  getProfile,                // Get single profile with computed traits
  searchProfiles,            // Multi-criteria profile search
  getProfileTimeline,        // Activity timeline for a profile
  getProfileSegments,        // All segments a profile belongs to
  suppressProfile,           // GDPR: suppress and anonymize
} from './queries';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLIENT HOOKS (React)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export { useProfile } from './client/hooks/use-profile';
export { useProfileSearch } from './client/hooks/use-profile-search';
export { useProfileTimeline } from './client/hooks/use-profile-timeline';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLIENT COMPONENTS (React)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export { ProfileCard } from './client/components/profile-card';
export { ProfileDetail } from './client/components/profile-detail';
export { ProfileTimeline } from './client/components/profile-timeline';
export { ProfileMergeDialog } from './client/components/profile-merge-dialog';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type {
  Profile,
  ProfileWithDetails,
  ProfileAlias,
  ProfileSearchCriteria,
  ProfileSearchResult,
  CreateProfileInput,
  UpdateProfileInput,
  ProfileStatus,
  ProfileType,
  MergeLog,
  MergeConflictResolution,
  TimelineEntry,
  SuppressionResult,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PROFILES SUBMODULE                                 │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        ProfileService                                 │  │
│  │                                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │  │
│  │  │  upsertProfile│  │  getProfile  │  │searchProfiles│                │  │
│  │  │              │  │  (360° view) │  │  (multi-     │                │  │
│  │  │  • resolve   │  │              │  │  criteria)   │                │  │
│  │  │    identity  │  │  • traits    │  │              │  ┌───────────┐ │  │
│  │  │  • create or │  │  • aliases   │  │  • JSONB     │  │ suppress  │ │  │
│  │  │    update    │  │  • segments  │  │    trait     │  │ Profile   │ │  │
│  │  │  • link      │  │  • timeline  │  │    filters   │  │           │ │  │
│  │  │    aliases   │  │  • LTV       │  │  • venture   │  │ • clear   │ │  │
│  │  └──────┬───────┘  └──────────────┘  │    scoped    │  │   PII     │ │  │
│  │         │                             └──────────────┘  │ • delete  │ │  │
│  │         ▼                                               │   aliases │ │  │
│  │  ┌──────────────┐  ┌──────────────┐                     │ • audit   │ │  │
│  │  │ProfileMerger │  │  Timeline    │                     └───────────┘ │  │
│  │  │              │  │  Builder     │                                   │  │
│  │  │  • conflict  │  │              │                                   │  │
│  │  │    resolution│  │  • activity  │                                   │  │
│  │  │  • field     │  │    feed      │                                   │  │
│  │  │    merging   │  │  • event     │                                   │  │
│  │  │  • LTV sum   │  │    grouping  │                                   │  │
│  │  │  • rollback  │  │              │                                   │  │
│  │  └──────────────┘  └──────────────┘                                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        DATABASE TABLES                              │    │
│  │                                                                     │    │
│  │  cdp_profile  ──── cdp_profile_alias  ──── cdp_profile_merge        │    │
│  │  (core data)       (identifiers)           (audit trail)            │    │
│  │                                                                     │    │
│  │  cdp_profile_timeline                                               │    │
│  │  (activity feed)                                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  Dependencies: identity-graph (resolution), traits (computed), segments     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### cdp_profile — Core Profile Table

```typescript
// @mcv/cdp/profiles/schema.ts
import {
  pgTable, text, jsonb, timestamp, boolean, integer,
  numeric, index, uniqueIndex, pgEnum,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { ventures } from '@mcv/portfolio/schema';
import { users } from '@mcv/kernel/identity/schema';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENUMS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORE PROFILE TABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
  traitsGinIdx: index('profile_traits_gin_idx').using('gin', t.traits),
}));
```

### cdp_profile_alias — Known Identifiers

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROFILE ALIASES — All known identifiers for a profile
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const profileAliases = pgTable('cdp_profile_alias', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),

  // Identifier type and value
  type: text('type').notNull(),           // 'email', 'phone', 'device_id', 'wallet', 'cookie', 'user_id'
  value: text('value').notNull(),         // The raw value (encrypted at rest)
  valueHash: text('value_hash').notNull(), // SHA-256 for fast indexed lookups

  // Verification status
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at'),
  verificationMethod: text('verification_method'), // 'email_otp', 'phone_sms', 'oauth', 'manual'

  // Source tracking
  source: text('source').notNull(),       // 'web', 'mobile', 'api', 'import'
  sourceId: text('source_id'),            // Session/event ID that created it

  // Confidence score (0.0 – 1.0)
  confidence: numeric('confidence', { precision: 5, scale: 4 }).default('1.0'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  profileIdx: index('alias_profile_idx').on(t.profileId),
  typeValueIdx: uniqueIndex('alias_type_value_idx').on(t.type, t.valueHash),
  valueHashIdx: index('alias_value_hash_idx').on(t.valueHash),
}));
```

### cdp_profile_merge — Merge Audit Trail

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROFILE MERGE HISTORY — Audit trail for all merges
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const profileMerges = pgTable('cdp_profile_merge', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),

  // Winner (survives)
  primaryProfileId: text('primary_profile_id').references(() => profiles.id).notNull(),
  // Loser (merged into winner)
  secondaryProfileId: text('secondary_profile_id').references(() => profiles.id).notNull(),

  // Merge context
  reason: text('reason').notNull(),       // 'email_match', 'phone_match', 'wallet_match', 'manual'
  confidence: numeric('confidence', { precision: 5, scale: 4 }),
  triggeredBy: text('triggered_by'),      // 'system', user ID, or agent ID

  // Full audit trail of merge decisions
  mergeLog: jsonb('merge_log').$type<MergeLog>(),

  // Snapshot of secondary profile before merge (for rollback)
  secondarySnapshot: jsonb('secondary_snapshot').$type<Profile>(),

  // Rollback support
  isReversible: boolean('is_reversible').default(true),
  reversedAt: timestamp('reversed_at'),
  reversedBy: text('reversed_by'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  primaryIdx: index('merge_primary_idx').on(t.primaryProfileId),
  secondaryIdx: index('merge_secondary_idx').on(t.secondaryProfileId),
  createdIdx: index('merge_created_idx').on(t.createdAt),
}));
```

### cdp_profile_timeline — Aggregated Activity Feed

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PROFILE TIMELINE — Aggregated activity feed for the 360° view
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const profileTimeline = pgTable('cdp_profile_timeline', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),

  // Activity classification
  activityType: text('activity_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  // Link to source event
  eventId: text('event_id'),
  ventureId: text('venture_id').references(() => ventures.id),

  occurredAt: timestamp('occurred_at').notNull(),
}, (t) => ({
  profileTimeIdx: index('timeline_profile_time_idx').on(t.profileId, t.occurredAt),
  activityTypeIdx: index('timeline_activity_type_idx').on(t.activityType),
}));
```

### Table Size Estimates

| Table | Description | Est. Rows | Growth |
|-------|-------------|-----------|--------|
| `cdp_profile` | Unified customer profiles | 1M+ | ~50K/month |
| `cdp_profile_alias` | Email/phone/device/wallet identifiers | 3M+ | ~150K/month |
| `cdp_profile_merge` | Merge audit trail | 50K+ | ~5K/month |
| `cdp_profile_timeline` | Aggregated activity feed | 10M+ | ~1M/month |

---

## Core Interfaces

### Profile

```typescript
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
```

### ProfileWithDetails — Full 360° View

```typescript
interface ProfileWithDetails extends Profile {
  aliases: ProfileAlias[];
  computedTraits: Record<string, unknown>;
  segments: Array<{
    id: string;
    name: string;
    slug: string;
    type: 'dynamic' | 'static' | 'ml';
    enteredAt: Date;
  }>;
  recentActivity: TimelineEntry[];
  venturePresence: Array<{
    ventureId: string;
    ventureName: string;
    firstSeen: Date;
    lastSeen: Date;
    eventCount: number;
  }>;
}
```

### ProfileAlias

```typescript
interface ProfileAlias {
  id: string;
  profileId: string;
  type: 'email' | 'phone' | 'device_id' | 'wallet' | 'cookie' | 'user_id' | 'social' | 'advertising';
  value: string;
  valueHash: string;
  isVerified: boolean;
  verifiedAt: Date | null;
  verificationMethod: string | null;
  source: string;
  sourceId: string | null;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Search & Input Types

```typescript
interface CreateProfileInput {
  ventureId: string;
  type?: 'identified' | 'anonymous' | 'lead' | 'prospect';
  userId?: string;
  email?: string;
  phone?: string;
  displayName?: string;
  avatarUrl?: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  traits?: Record<string, unknown>;
  externalIds?: Record<string, string>;
  source: string;
}

interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  traits?: Record<string, unknown>;
  externalIds?: Record<string, string>;
}

interface ProfileSearchCriteria {
  ventureId: string;
  email?: string;
  phone?: string;
  userId?: string;
  deviceId?: string;
  walletAddress?: string;
  type?: ProfileType | ProfileType[];
  status?: ProfileStatus | ProfileStatus[];
  country?: string;
  region?: string;
  city?: string;
  traits?: Record<string, unknown>;
  lastSeenAfter?: Date;
  lastSeenBefore?: Date;
  firstSeenAfter?: Date;
  firstSeenBefore?: Date;
  minEvents?: number;
  maxEvents?: number;
  minLtv?: number;
  maxLtv?: number;
  segmentId?: string;
  notInSegmentId?: string;
  query?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'lastSeenAt' | 'firstSeenAt' | 'totalEvents' | 'ltvAmount' | 'createdAt';
  orderDir?: 'asc' | 'desc';
}

interface ProfileSearchResult {
  profiles: Profile[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}
```

### Merge Types

```typescript
interface MergeLog {
  fieldsFromPrimary: string[];
  fieldsFromSecondary: string[];
  conflictsResolved: MergeConflictResolution[];
  aliasesMoved: number;
  eventsMoved: number;
  segmentsMoved: number;
  traitsMerged: Record<string, { primary: unknown; secondary: unknown; result: unknown }>;
  ltvMerge: {
    primaryLtv: string;
    secondaryLtv: string;
    combinedLtv: string;
  };
}

interface MergeConflictResolution {
  field: string;
  primaryValue: unknown;
  secondaryValue: unknown;
  chosenValue: unknown;
  resolution: 'primary' | 'secondary' | 'merged' | 'newest' | 'manual';
  reason: string;
}

interface TimelineEntry {
  id: string;
  profileId: string;
  activityType: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  eventId: string | null;
  ventureId: string | null;
  occurredAt: Date;
}

interface SuppressionResult {
  profileId: string;
  aliasesDeleted: number;
  traitsCleared: number;
  externalIdsCleared: number;
  syncRecordsCleaned: number;
  suppressedAt: Date;
}
```

---

## ProfileService

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

  /**
   * Create or retrieve a profile. Handles identity resolution automatically.
   *
   * Pipeline:
   * 1. Extract identifiers from input (email, phone, userId, etc.)
   * 2. Call identityGraph.resolve() to find existing profile
   * 3. If found → update existing profile with new data
   * 4. If not found → create new profile
   * 5. Create/update identity aliases for all provided identifiers
   * 6. Link co-occurring identifiers in the identity graph
   * 7. Emit cdp.profile.created or cdp.profile.updated event
   */
  async upsertProfile(input: CreateProfileInput): Promise<Profile>;

  /**
   * Get profile by ID with full trait resolution, aliases, and segments.
   *
   * Assembly:
   * 1. Fetch base profile from cdp_profile
   * 2. Fetch all aliases from cdp_profile_alias
   * 3. Hydrate computed traits from TraitEngine
   * 4. Fetch segment memberships from cdp_segment_membership
   * 5. Fetch recent timeline entries
   * 6. Fetch cross-venture presence data
   *
   * @throws CDP_PROFILE_SUPPRESSED if profile was suppressed
   * @throws CDP_PROFILE_MERGED if profile was merged (includes mergedIntoId)
   */
  async getProfile(profileId: string): Promise<ProfileWithDetails | null>;

  /**
   * Multi-criteria search with JSONB trait filtering.
   * All queries are scoped by ventureId for data isolation.
   */
  async searchProfiles(criteria: ProfileSearchCriteria): Promise<ProfileSearchResult>;

  /**
   * Update profile traits and metadata (partial merge).
   * Traits and externalIds are shallow-merged with existing values.
   */
  async updateProfile(profileId: string, updates: UpdateProfileInput): Promise<Profile>;

  /**
   * Add an alias (identifier) to a profile.
   * If the alias exists on ANOTHER profile, triggers auto-merge evaluation.
   *
   * @throws CDP_IDENTITY_LIMIT if profile has reached max alias count (50)
   * @throws CDP_IDENTITY_CONFLICT if alias exists and merge is not possible
   */
  async addAlias(
    profileId: string,
    type: string,
    value: string,
    source: string,
    options?: { confidence?: number; isVerified?: boolean; verificationMethod?: string },
  ): Promise<void>;

  /**
   * Merge two profiles. Primary survives, secondary marked as merged.
   *
   * Merge pipeline:
   * 1. Validate both profiles exist, are active, and in same venture
   * 2. Snapshot secondary profile for rollback
   * 3. Determine field-by-field merge strategy
   * 4. Move all aliases from secondary → primary
   * 5. Move all events from secondary → primary
   * 6. Transfer segment memberships
   * 7. Combine LTV amounts
   * 8. Merge engagement metrics (earliest firstSeen, latest lastSeen, sum events)
   * 9. Mark secondary as status='merged', set mergedIntoId
   * 10. Create merge audit record
   * 11. Emit cdp.profile.merged event
   *
   * @throws CDP_MERGE_SAME_PROFILE if primaryId === secondaryId
   * @throws CDP_MERGE_CROSS_VENTURE if profiles are in different ventures
   */
  async mergeProfiles(
    primaryId: string,
    secondaryId: string,
    reason: string,
    triggeredBy: string,
    options?: { conflictResolutions?: Record<string, 'primary' | 'secondary'> },
  ): Promise<Profile>;

  /**
   * Reverse a profile merge using the stored snapshot.
   * Only works if merge record has isReversible=true.
   */
  async unmergeProfiles(mergeId: string, reversedBy: string): Promise<Profile>;

  /**
   * GDPR/CCPA profile suppression. Clears all PII and deletes aliases.
   *
   * Suppression pipeline:
   * 1. Clear PII fields: canonicalEmail, canonicalPhone, displayName, avatarUrl
   * 2. Set displayName to '[Suppressed]'
   * 3. Clear all traits and externalIds
   * 4. DELETE all rows from cdp_profile_alias for this profile
   * 5. Remove profile from all sync destinations
   * 6. Set status to 'suppressed'
   * 7. Emit cdp.profile.suppressed event
   *
   * NOTE: Events are NOT deleted — they are anonymized by removing the profile link.
   */
  async suppressProfile(profileId: string, reason: string): Promise<SuppressionResult>;

  /** Activity timeline with cursor-based pagination. */
  async getTimeline(profileId: string, options: {
    limit?: number;
    before?: Date;
    activityTypes?: string[];
    ventureId?: string;
  }): Promise<{ entries: TimelineEntry[]; hasMore: boolean; oldestTimestamp: Date | null }>;

  /** Update engagement metrics after an event is tracked (called by EventCollector). */
  async updateEngagement(profileId: string, event: {
    timestamp: Date;
    sessionId?: string;
    revenue?: number;
    currency?: string;
  }): Promise<void>;
}
```

---

## ProfileMerger

```typescript
export class ProfileMerger {
  /**
   * Default merge strategy for each profile field:
   *
   * | Field           | Strategy                                          |
   * |-----------------|---------------------------------------------------|
   * | displayName     | Primary if set, else secondary                    |
   * | avatarUrl       | Primary if set, else secondary                    |
   * | canonicalEmail  | Verified > unverified > primary                   |
   * | canonicalPhone  | Verified > unverified > primary                   |
   * | type            | Most "identified" wins                            |
   * | country/region  | Most recent (by lastSeenAt)                       |
   * | firstSeenAt     | Earliest of both                                  |
   * | lastSeenAt      | Latest of both                                    |
   * | totalEvents     | Sum of both                                       |
   * | totalSessions   | Sum of both                                       |
   * | ltvAmount       | Sum of both                                       |
   * | traits          | Deep merge (primary wins conflicts)               |
   * | externalIds     | Merge all (primary wins conflicts)                |
   */
  static readonly MERGE_STRATEGIES: Record<string, MergeStrategy>;

  async executeMerge(
    primary: Profile,
    secondary: Profile,
    overrides?: Record<string, 'primary' | 'secondary'>,
  ): Promise<{ mergedData: Partial<Profile>; mergeLog: MergeLog }>;

  async previewMerge(
    primaryId: string,
    secondaryId: string,
  ): Promise<{ conflicts: MergeConflictResolution[]; estimatedResult: Partial<Profile> }>;
}

type MergeStrategy = 'primary' | 'secondary' | 'newest' | 'oldest' | 'sum' | 'merge' | 'verified';
```

### Merge Algorithm Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        PROFILE MERGE FLOW                                │
│                                                                          │
│  1. VALIDATE                                                             │
│     ├─ Both profiles exist and are status='active'                       │
│     ├─ Same ventureId                                                    │
│     └─ Not the same profile                                              │
│                                                                          │
│  2. SNAPSHOT secondary profile for rollback                              │
│                                                                          │
│  3. RESOLVE FIELDS (per merge strategy table)                            │
│     ├─ displayName   → primary if set, else secondary                    │
│     ├─ canonicalEmail → verified wins                                    │
│     ├─ type          → most-identified wins                              │
│     ├─ firstSeenAt   → min(primary, secondary)                           │
│     ├─ lastSeenAt    → max(primary, secondary)                           │
│     ├─ totalEvents   → primary + secondary                               │
│     ├─ ltvAmount     → primary + secondary                               │
│     └─ traits        → deep merge (primary wins conflicts)               │
│                                                                          │
│  4. TRANSFER aliases: UPDATE SET profile_id = primary                    │
│  5. TRANSFER events: UPDATE SET profile_id = primary                     │
│  6. TRANSFER segments: Move memberships, avoid duplicates                │
│  7. MARK secondary: status='merged', merged_into_id=primary.id          │
│  8. AUDIT: INSERT cdp_profile_merge with full merge_log                  │
│  9. EMIT: cdp.profile.merged event                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Code Examples

### Example 1: Upsert a Profile with Identity Resolution

```typescript
import { ProfileService } from '@mcv/cdp/profiles';

const profileService = new ProfileService({ identityGraph, traitEngine, eventBus });

const profile = await profileService.upsertProfile({
  ventureId: 'betedge-venture-uuid',
  email: 'jordan@example.com',
  userId: 'user-7x9k2',
  displayName: 'Jordan Smith',
  traits: {
    preferred_sport: 'basketball',
    signup_source: 'referral',
    plan: 'premium',
  },
  source: 'web',
});

console.log('Profile ID:', profile.id);
console.log('Type:', profile.type);               // 'identified'
console.log('Email:', profile.canonicalEmail);    // 'jordan@example.com'
```

### Example 2: Get Full 360° Profile View

```typescript
const fullProfile = await profileService.getProfile('profile-xyz-id');

if (!fullProfile) return;

console.log('Name:', fullProfile.displayName);           // 'Jordan Smith'
console.log('LTV:', fullProfile.ltvAmount);               // '12450.0000'
console.log('Total Events:', fullProfile.totalEvents);    // 347

// Aliases
for (const alias of fullProfile.aliases) {
  console.log(`  ${alias.type}: ${alias.value} (verified: ${alias.isVerified})`);
}

// Computed traits
console.log('Traits:', fullProfile.computedTraits);
// { total_bets: 156, total_wagered: 12450.00, churn_risk: 0.12, ... }

// Segment memberships
for (const seg of fullProfile.segments) {
  console.log(`  ${seg.name} (${seg.type})`);
}
```

### Example 3: Search with Trait Filtering

```typescript
const results = await profileService.searchProfiles({
  ventureId: 'betedge-venture-uuid',
  country: 'CA',
  traits: {
    vip_status: 'gold',
    total_bets: { $gte: 50 },
  },
  minLtv: 1000,
  lastSeenBefore: new Date('2026-01-15'),
  status: 'active',
  limit: 25,
  orderBy: 'ltvAmount',
  orderDir: 'desc',
});

console.log(`Found ${results.total} profiles`);
for (const p of results.profiles) {
  console.log(`  ${p.displayName} — LTV: $${p.ltvAmount}`);
}
```

### Example 4: Profile Merge with Preview

```typescript
// Preview the merge
const preview = await profileMerger.previewMerge('profile-a', 'profile-b');
for (const conflict of preview.conflicts) {
  console.log(`${conflict.field}: "${conflict.primaryValue}" vs "${conflict.secondaryValue}"`);
}

// Execute the merge
const merged = await profileService.mergeProfiles(
  'profile-a',          // Winner
  'profile-b',          // Loser
  'manual_duplicate',
  'admin-user-id',
);

console.log('Merged LTV:', merged.ltvAmount);          // Summed
console.log('Total events:', merged.totalEvents);      // Combined
```

### Example 5: GDPR Suppression

```typescript
const result = await profileService.suppressProfile(
  'profile-gdpr-request-id',
  'GDPR erasure request #4521',
);

console.log(`Aliases deleted: ${result.aliasesDeleted}`);
console.log(`Traits cleared: ${result.traitsCleared}`);
console.log(`Suppressed at: ${result.suppressedAt}`);

// Profile is now: displayName='[Suppressed]', traits={}, all aliases deleted
```

### Example 6: Profile Timeline

```typescript
const timeline = await profileService.getTimeline('profile-xyz', {
  limit: 20,
  activityTypes: ['purchase', 'bet_placed', 'page_view'],
});

for (const entry of timeline.entries) {
  console.log(`[${entry.occurredAt.toISOString()}] ${entry.activityType}: ${entry.title}`);
}
// [2026-02-08T15:30:00Z] bet_placed: Placed $50 bet on Lakers vs Celtics
// [2026-02-08T14:45:00Z] page_view: Viewed NBA Odds page

if (timeline.hasMore) {
  const older = await profileService.getTimeline('profile-xyz', {
    limit: 20,
    before: timeline.oldestTimestamp!,
  });
}
```

### Example 7: Bulk Import

```typescript
const csvRows = await parseCsv('customer-export.csv');
let created = 0, errors = 0;

for (const row of csvRows) {
  try {
    await profileService.upsertProfile({
      ventureId: 'serpspace-venture-uuid',
      email: row.email,
      displayName: `${row.first_name} ${row.last_name}`,
      traits: { company: row.company, plan: row.plan },
      source: 'import',
    });
    created++;
  } catch (error) {
    errors++;
  }
}
console.log(`Imported ${created}, errors: ${errors}`);
```

---

## React Hooks

### useProfile

```typescript
function useProfile(profileId: string | null): {
  profile: ProfileWithDetails | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

// Usage
function ProfileDetailPage({ profileId }: { profileId: string }) {
  const { profile, isLoading } = useProfile(profileId);
  if (isLoading) return <ProfileSkeleton />;
  if (!profile) return <NotFound />;
  return <ProfileCard profile={profile} />;
}
```

### useProfileSearch

```typescript
function useProfileSearch(criteria: ProfileSearchCriteria): {
  results: ProfileSearchResult | null;
  isLoading: boolean;
  error: Error | null;
  setPage: (page: number) => void;
  setSort: (field: string, dir: 'asc' | 'desc') => void;
};
```

---

## Error Codes

| Code | Name | Description | HTTP |
|------|------|-------------|------|
| `CDP_PROFILE_NOT_FOUND` | Profile Not Found | No profile exists with the given ID | 404 |
| `CDP_PROFILE_SUPPRESSED` | Profile Suppressed | Profile has been suppressed (GDPR) | 410 |
| `CDP_PROFILE_MERGED` | Profile Merged | Profile was merged; follow `mergedIntoId` | 301 |
| `CDP_MERGE_FAILED` | Merge Failed | Profile merge transaction failed | 500 |
| `CDP_MERGE_SAME_PROFILE` | Same Profile | Cannot merge a profile with itself | 400 |
| `CDP_MERGE_CROSS_VENTURE` | Cross-Venture Merge | Cannot merge profiles from different ventures | 400 |
| `CDP_MERGE_NOT_REVERSIBLE` | Not Reversible | This merge can no longer be reversed | 400 |
| `CDP_IDENTITY_CONFLICT` | Identity Conflict | Alias exists on another profile, cannot auto-merge | 409 |
| `CDP_IDENTITY_LIMIT` | Alias Limit | Profile has reached max aliases (50) | 429 |
| `CDP_VENTURE_REQUIRED` | Venture Required | ventureId is required for all operations | 400 |
| `CDP_UNAUTHORIZED` | Unauthorized | Insufficient permissions | 403 |
| `CDP_SEARCH_TOO_BROAD` | Search Too Broad | Add more filters to narrow results | 422 |

---

## Security Considerations

### Data Privacy

- **PII Encryption at Rest**: canonicalEmail, canonicalPhone encrypted with AES-256 venture-specific keys
- **Hash-Based Lookups**: Aliases indexed by SHA-256 hash for O(1) lookups without exposing PII in indexes
- **GDPR Right to Erasure**: `suppressProfile()` implements complete PII cleanse
- **Consent Tracking**: Profile traits support consent flags used by downstream systems
- **Data Minimization**: Only essential data stored on profile; event details in events submodule

### Access Control

- **Venture Isolation**: Every query scoped by `ventureId`; Postgres RLS enforces at DB level
- **Admin Operations**: Merge, suppress, and bulk operations require `cdp:admin` permission
- **Audit Trail**: Every merge, suppression, and status change logged for compliance

### Merge Security

- **Snapshot Before Merge**: Secondary profile fully preserved for rollback
- **Cross-Venture Guard**: Cross-venture merges explicitly blocked
- **Rollback Window**: Merges reversible within 30 days (configurable)
- **Rate Limiting**: Auto-merges rate-limited to prevent cascade storms

---

## Performance

| Operation | Target | P99 |
|-----------|--------|-----|
| `upsertProfile()` | < 100ms | < 300ms |
| `getProfile()` — 360° view | < 50ms | < 200ms |
| `searchProfiles()` — 50 results | < 100ms | < 500ms |
| `mergeProfiles()` | < 500ms | < 2s |
| `suppressProfile()` | < 200ms | < 800ms |
| `getTimeline()` — 50 entries | < 50ms | < 150ms |

### Optimization Strategies

1. **JSONB GIN Index** on traits for fast trait-based filtering
2. **Materialized traits** stored on profile for O(1) segmentation access
3. **Hash indexes** on aliases for constant-time identity lookups
4. **Composite indexes** on `(venture_id, status)` and `(venture_id, last_seen_at)`
5. **Connection pooling** — shared pool (min: 5, max: 50) across CDP submodules
6. **Cursor-based pagination** for timeline (stable results under concurrent writes)

---

## Audit Events

| Event | Payload | When |
|-------|---------|------|
| `cdp.profile.created` | `{ profileId, ventureId, type, source }` | New profile created |
| `cdp.profile.updated` | `{ profileId, fields, source }` | Profile updated |
| `cdp.profile.merged` | `{ primaryId, secondaryId, mergeLog }` | Profiles merged |
| `cdp.profile.suppressed` | `{ profileId, reason, result }` | Profile suppressed |
| `cdp.profile.deleted` | `{ profileId, reason }` | Profile hard-deleted |
| `cdp.profile.type_changed` | `{ profileId, from, to }` | Type upgraded |
| `cdp.profile.merge_reversed` | `{ mergeId, primaryId, secondaryId }` | Merge reversed |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-orm | ^0.29.x | Database ORM (Postgres with JSONB) |
| @paralleldrive/cuid2 | ^2.x | Collision-resistant unique IDs |
| zod | ^3.x | Input validation |
| crypto (built-in) | — | SHA-256 hashing for identity values |
| @mcv/events | workspace | Internal event bus |
| @mcv/db | workspace | Shared database connection |
| @mcv/cdp/identity-graph | workspace | Identity resolution during upsert |
| @mcv/cdp/traits | workspace | Computed trait hydration |
| @mcv/cdp/segments | workspace | Segment membership queries |

---

*@mcv/cdp/profiles — Unified Customer Profiles Submodule*
