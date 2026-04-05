# @mcv/cdp — Package Specification
## Tier 5: MCV-Only Domains

**Package:** `@mcv/cdp`  
**Classification:** INTERNAL (MCV-Only)  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/cdp` is the Customer Data Platform for MCV.ONE — a unified system for collecting, unifying, and activating customer data across all ventures. It provides identity resolution, behavioral tracking, segmentation, trait management, and cross-platform synchronization.

**This is the single source of truth for customer intelligence across the MCV portfolio.**

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                         │
│   Web App │ Mobile │ Blockchain │ Email │ Support │ Commerce │ Gaming       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                            Event Ingestion
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            @mcv/cdp                                          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        IDENTITY GRAPH                                │    │
│  │        Cross-Platform Identity Resolution & Unification              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│           │                       │                       │                  │
│           ▼                       ▼                       ▼                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │    PROFILES     │  │     EVENTS      │  │     TRAITS      │              │
│  │  Unified View   │  │  Behavioral     │  │  Computed &     │              │
│  │  360° Customer  │  │  Tracking       │  │  Manual Tags    │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                               │                                              │
│                               ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         SEGMENTS                                     │    │
│  │          Dynamic Audience Building & Real-time Membership            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                               │                                              │
│                               ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                           SYNC                                       │    │
│  │          Destinations: Ads │ Email │ CRM │ Analytics │ Warehouse     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ powers
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  @mcv/marketing │ @mcv/agentic-os │ @mcv/commerce │ @mcv/compliance          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **profiles** | Unified customer profiles with 360° view | `ProfileService`, `ProfileMerger`, `ProfileResolver` |
| **identity-graph** | Cross-platform identity resolution | `IdentityGraph`, `IdentityResolver`, `AliasManager` |
| **events** | Behavioral event tracking and storage | `EventCollector`, `EventStore`, `EventProcessor` |
| **traits** | Computed and manual trait management | `TraitEngine`, `TraitComputer`, `TraitStore` |
| **segments** | Dynamic audience segmentation | `SegmentBuilder`, `SegmentEvaluator`, `MembershipEngine` |
| **sync** | External destination synchronization | `SyncOrchestrator`, `DestinationManager`, `SyncJob` |

---

## Module: profiles

### Purpose

The profiles module maintains unified customer profiles that aggregate data from all touchpoints, providing a complete 360° view of each customer.

### Database Schema

```typescript
// @mcv/cdp/profiles/schema.ts
import { pgTable, text, jsonb, timestamp, boolean, integer, numeric, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { ventures } from "@mcv/portfolio/schema";
import { users } from "@mcv/kernel/identity/schema";

export const profileStatusEnum = pgEnum('profile_status', [
  'active',
  'merged',
  'suppressed',
  'deleted',
]);

export const profileTypeEnum = pgEnum('profile_type', [
  'identified',   // Has user account
  'anonymous',    // Cookie/device only
  'lead',         // Email but no account
  'prospect',     // Enriched lead
]);

// Core unified profile
export const profiles = pgTable('cdp_profile', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  
  // Link to auth user (if identified)
  userId: text('user_id').references(() => users.id),
  
  // Profile status
  type: profileTypeEnum('type').default('anonymous').notNull(),
  status: profileStatusEnum('status').default('active').notNull(),
  
  // Canonical identifiers
  canonicalEmail: text('canonical_email'),
  canonicalPhone: text('canonical_phone'),
  
  // Display info (denormalized for performance)
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  
  // Location
  country: text('country'),
  region: text('region'),
  city: text('city'),
  timezone: text('timezone'),
  
  // Engagement metrics (computed)
  firstSeenAt: timestamp('first_seen_at'),
  lastSeenAt: timestamp('last_seen_at'),
  lastActiveAt: timestamp('last_active_at'),
  totalEvents: integer('total_events').default(0),
  totalSessions: integer('total_sessions').default(0),
  
  // Lifetime value (computed)
  ltvAmount: numeric('ltv_amount', { precision: 20, scale: 4 }).default('0'),
  ltvCurrency: text('ltv_currency').default('USD'),
  
  // External IDs (for sync)
  externalIds: jsonb('external_ids').$type<Record<string, string>>().default({}),
  
  // All traits (materialized for fast queries)
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

// Profile identity aliases (email, phone, device, wallet, etc.)
export const profileAliases = pgTable('cdp_profile_alias', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  
  type: text('type').notNull(), // 'email', 'phone', 'device_id', 'wallet', 'cookie', 'user_id'
  value: text('value').notNull(),
  valueHash: text('value_hash').notNull(), // For fast lookups
  
  // Verification
  isVerified: boolean('is_verified').default(false),
  verifiedAt: timestamp('verified_at'),
  verificationMethod: text('verification_method'),
  
  // Source
  source: text('source').notNull(), // 'web', 'mobile', 'api', 'import'
  sourceId: text('source_id'), // Session/event that created it
  
  // Confidence
  confidence: numeric('confidence', { precision: 5, scale: 4 }).default('1.0'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  profileIdx: index('alias_profile_idx').on(t.profileId),
  typeValueIdx: uniqueIndex('alias_type_value_idx').on(t.type, t.valueHash),
  valueHashIdx: index('alias_value_hash_idx').on(t.valueHash),
}));

// Profile merge history
export const profileMerges = pgTable('cdp_profile_merge', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  
  // Winner (survives)
  primaryProfileId: text('primary_profile_id').references(() => profiles.id).notNull(),
  // Loser (merged into winner)
  secondaryProfileId: text('secondary_profile_id').references(() => profiles.id).notNull(),
  
  // Merge details
  reason: text('reason').notNull(), // 'email_match', 'phone_match', 'wallet_match', 'manual'
  confidence: numeric('confidence', { precision: 5, scale: 4 }),
  
  // Who triggered merge
  triggeredBy: text('triggered_by'), // 'system', user ID, or agent ID
  
  // Audit trail
  mergeLog: jsonb('merge_log').$type<MergeLog>(),
  
  // Rollback support
  isReversible: boolean('is_reversible').default(true),
  reversedAt: timestamp('reversed_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  primaryIdx: index('merge_primary_idx').on(t.primaryProfileId),
  secondaryIdx: index('merge_secondary_idx').on(t.secondaryProfileId),
}));

// Profile activity timeline (aggregated from events)
export const profileTimeline = pgTable('cdp_profile_timeline', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  
  // Activity type
  activityType: text('activity_type').notNull(), // 'page_view', 'purchase', 'email_open', etc.
  
  // Summary data
  title: text('title').notNull(),
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Source event
  eventId: text('event_id'),
  
  occurredAt: timestamp('occurred_at').notNull(),
}, (t) => ({
  profileTimeIdx: index('timeline_profile_time_idx').on(t.profileId, t.occurredAt),
}));

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

### Profile Service

```typescript
// @mcv/cdp/profiles/service.ts
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { db } from '@mcv/db';
import { profiles, profileAliases, profileMerges, profileTimeline } from './schema';
import { IdentityGraph } from '../identity-graph';
import { TraitEngine } from '../traits';
import { EventBus } from '@mcv/events';

export interface CreateProfileInput {
  ventureId: string;
  type?: 'identified' | 'anonymous' | 'lead' | 'prospect';
  userId?: string;
  email?: string;
  phone?: string;
  displayName?: string;
  traits?: Record<string, unknown>;
  source: string;
}

export interface ProfileSearchCriteria {
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

export class ProfileService {
  private identityGraph: IdentityGraph;
  private traitEngine: TraitEngine;
  private eventBus: EventBus;
  
  constructor(deps: {
    identityGraph: IdentityGraph;
    traitEngine: TraitEngine;
    eventBus: EventBus;
  }) {
    this.identityGraph = deps.identityGraph;
    this.traitEngine = deps.traitEngine;
    this.eventBus = deps.eventBus;
  }
  
  /**
   * Create or retrieve a profile for given identifiers.
   * Handles identity resolution automatically.
   */
  async upsertProfile(input: CreateProfileInput): Promise<Profile> {
    // 1. Try to find existing profile via identity graph
    const existingProfile = await this.identityGraph.resolve({
      ventureId: input.ventureId,
      email: input.email,
      phone: input.phone,
      userId: input.userId,
    });
    
    if (existingProfile) {
      // Update existing profile with new data
      return this.updateProfile(existingProfile.id, {
        displayName: input.displayName,
        traits: input.traits,
      });
    }
    
    // 2. Create new profile
    const profile = await db.insert(profiles).values({
      ventureId: input.ventureId,
      userId: input.userId,
      type: input.type ?? 'anonymous',
      canonicalEmail: input.email?.toLowerCase().trim(),
      canonicalPhone: this.normalizePhone(input.phone),
      displayName: input.displayName,
      traits: input.traits ?? {},
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    }).returning().then(r => r[0]);
    
    // 3. Create aliases for identifiers
    const aliases: Array<{type: string; value: string}> = [];
    if (input.email) aliases.push({ type: 'email', value: input.email });
    if (input.phone) aliases.push({ type: 'phone', value: input.phone });
    if (input.userId) aliases.push({ type: 'user_id', value: input.userId });
    
    for (const alias of aliases) {
      await this.addAlias(profile.id, alias.type, alias.value, input.source);
    }
    
    // 4. Emit event
    await this.eventBus.emit('cdp.profile.created', {
      profileId: profile.id,
      ventureId: input.ventureId,
      type: profile.type,
    });
    
    return profile;
  }
  
  /**
   * Get profile by ID with full trait resolution.
   */
  async getProfile(profileId: string): Promise<ProfileWithDetails | null> {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
      with: {
        aliases: true,
      },
    });
    
    if (!profile) return null;
    
    // Compute real-time traits
    const computedTraits = await this.traitEngine.computeTraits(profileId);
    
    return {
      ...profile,
      traits: { ...profile.traits, ...computedTraits },
    };
  }
  
  /**
   * Search profiles with complex criteria.
   */
  async searchProfiles(criteria: ProfileSearchCriteria): Promise<ProfileSearchResult> {
    const conditions = [eq(profiles.ventureId, criteria.ventureId)];
    
    if (criteria.email) {
      conditions.push(eq(profiles.canonicalEmail, criteria.email.toLowerCase()));
    }
    
    if (criteria.lastSeenAfter) {
      conditions.push(sql`${profiles.lastSeenAt} >= ${criteria.lastSeenAfter}`);
    }
    
    // Trait filtering with JSONB
    if (criteria.traits) {
      for (const [key, value] of Object.entries(criteria.traits)) {
        conditions.push(sql`${profiles.traits}->>${key} = ${String(value)}`);
      }
    }
    
    const [results, countResult] = await Promise.all([
      db.select()
        .from(profiles)
        .where(and(...conditions))
        .orderBy(desc(profiles.lastSeenAt))
        .limit(criteria.limit ?? 50)
        .offset(criteria.offset ?? 0),
      db.select({ count: sql<number>`count(*)` })
        .from(profiles)
        .where(and(...conditions)),
    ]);
    
    return {
      profiles: results,
      total: countResult[0].count,
      hasMore: (criteria.offset ?? 0) + results.length < countResult[0].count,
    };
  }
  
  /**
   * Update profile traits and metadata.
   */
  async updateProfile(
    profileId: string,
    updates: {
      displayName?: string;
      traits?: Record<string, unknown>;
      externalIds?: Record<string, string>;
    }
  ): Promise<Profile> {
    const existing = await this.getProfile(profileId);
    if (!existing) throw new NotFoundError('Profile', profileId);
    
    const merged = {
      displayName: updates.displayName ?? existing.displayName,
      traits: { ...existing.traits, ...updates.traits },
      externalIds: { ...existing.externalIds, ...updates.externalIds },
      updatedAt: new Date(),
    };
    
    await db.update(profiles)
      .set(merged)
      .where(eq(profiles.id, profileId));
    
    await this.eventBus.emit('cdp.profile.updated', {
      profileId,
      changes: updates,
    });
    
    return { ...existing, ...merged };
  }
  
  /**
   * Add an alias (identifier) to a profile.
   */
  async addAlias(
    profileId: string,
    type: string,
    value: string,
    source: string
  ): Promise<void> {
    const valueHash = await this.hashValue(value);
    
    // Check if alias already exists on another profile
    const existingAlias = await db.query.profileAliases.findFirst({
      where: and(
        eq(profileAliases.type, type),
        eq(profileAliases.valueHash, valueHash),
      ),
    });
    
    if (existingAlias && existingAlias.profileId !== profileId) {
      // Trigger merge
      await this.identityGraph.triggerMerge(
        profileId,
        existingAlias.profileId,
        `${type}_match`
      );
      return;
    }
    
    if (existingAlias) return; // Already exists on this profile
    
    await db.insert(profileAliases).values({
      profileId,
      type,
      value,
      valueHash,
      source,
    });
  }
  
  /**
   * Merge two profiles together.
   */
  async mergeProfiles(
    primaryId: string,
    secondaryId: string,
    reason: string,
    triggeredBy: string
  ): Promise<Profile> {
    const [primary, secondary] = await Promise.all([
      this.getProfile(primaryId),
      this.getProfile(secondaryId),
    ]);
    
    if (!primary || !secondary) {
      throw new Error('Both profiles must exist for merge');
    }
    
    // Determine merge strategy
    const mergeLog = this.resolveMergeConflicts(primary, secondary);
    
    // Update primary with merged data
    await db.update(profiles)
      .set({
        displayName: mergeLog.resolvedProfile.displayName,
        traits: mergeLog.resolvedProfile.traits,
        externalIds: mergeLog.resolvedProfile.externalIds,
        totalEvents: (primary.totalEvents ?? 0) + (secondary.totalEvents ?? 0),
        totalSessions: (primary.totalSessions ?? 0) + (secondary.totalSessions ?? 0),
        ltvAmount: String(
          Number(primary.ltvAmount ?? 0) + Number(secondary.ltvAmount ?? 0)
        ),
        firstSeenAt: new Date(Math.min(
          primary.firstSeenAt?.getTime() ?? Infinity,
          secondary.firstSeenAt?.getTime() ?? Infinity
        )),
        lastSeenAt: new Date(Math.max(
          primary.lastSeenAt?.getTime() ?? 0,
          secondary.lastSeenAt?.getTime() ?? 0
        )),
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, primaryId));
    
    // Move aliases to primary
    await db.update(profileAliases)
      .set({ profileId: primaryId })
      .where(eq(profileAliases.profileId, secondaryId));
    
    // Mark secondary as merged
    await db.update(profiles)
      .set({
        status: 'merged',
        mergedIntoId: primaryId,
        mergedAt: new Date(),
      })
      .where(eq(profiles.id, secondaryId));
    
    // Record merge
    await db.insert(profileMerges).values({
      primaryProfileId: primaryId,
      secondaryProfileId: secondaryId,
      reason,
      triggeredBy,
      mergeLog,
    });
    
    await this.eventBus.emit('cdp.profile.merged', {
      primaryId,
      secondaryId,
      reason,
    });
    
    return this.getProfile(primaryId) as Promise<Profile>;
  }
  
  /**
   * Suppress a profile (GDPR/privacy request).
   */
  async suppressProfile(profileId: string, reason: string): Promise<void> {
    await db.update(profiles)
      .set({
        status: 'suppressed',
        // Clear PII
        canonicalEmail: null,
        canonicalPhone: null,
        displayName: '[Suppressed]',
        traits: {},
        externalIds: {},
      })
      .where(eq(profiles.id, profileId));
    
    // Delete aliases
    await db.delete(profileAliases)
      .where(eq(profileAliases.profileId, profileId));
    
    await this.eventBus.emit('cdp.profile.suppressed', {
      profileId,
      reason,
    });
  }
  
  /**
   * Get profile timeline/activity history.
   */
  async getTimeline(
    profileId: string,
    options: { limit?: number; before?: Date }
  ): Promise<TimelineEntry[]> {
    const conditions = [eq(profileTimeline.profileId, profileId)];
    
    if (options.before) {
      conditions.push(sql`${profileTimeline.occurredAt} < ${options.before}`);
    }
    
    return db.select()
      .from(profileTimeline)
      .where(and(...conditions))
      .orderBy(desc(profileTimeline.occurredAt))
      .limit(options.limit ?? 50);
  }
  
  private normalizePhone(phone?: string): string | undefined {
    if (!phone) return undefined;
    // Strip all non-numeric, ensure +country code
    return phone.replace(/\D/g, '').replace(/^(\d)/, '+$1');
  }
  
  private async hashValue(value: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(value.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Buffer.from(hashBuffer).toString('hex');
  }
  
  private resolveMergeConflicts(primary: Profile, secondary: Profile): MergeLog {
    const conflicts: MergeLog['conflictsResolved'] = [];
    const resolvedProfile: Partial<Profile> = {};
    
    // Merge traits (secondary overwrites conflicts)
    resolvedProfile.traits = { ...secondary.traits, ...primary.traits };
    
    // Use newest display name
    if (primary.displayName !== secondary.displayName) {
      const useSecondary = (secondary.updatedAt ?? 0) > (primary.updatedAt ?? 0);
      resolvedProfile.displayName = useSecondary ? secondary.displayName : primary.displayName;
      conflicts.push({
        field: 'displayName',
        primaryValue: primary.displayName,
        secondaryValue: secondary.displayName,
        chosenValue: resolvedProfile.displayName,
        resolution: useSecondary ? 'secondary' : 'primary',
      });
    }
    
    // Merge external IDs
    resolvedProfile.externalIds = { ...secondary.externalIds, ...primary.externalIds };
    
    return {
      fieldsFromPrimary: ['id', 'ventureId', 'userId'],
      fieldsFromSecondary: [],
      conflictsResolved: conflicts,
      resolvedProfile,
      aliasesMoved: 0, // Filled by caller
      eventsMoved: 0,
    };
  }
}
```

### Profile API (tRPC)

```typescript
// @mcv/cdp/profiles/router.ts
import { z } from 'zod';
import { router, protectedProcedure } from '@mcv/gateway/trpc';
import { ProfileService } from './service';

export const profileRouter = router({
  // Get single profile
  get: protectedProcedure
    .input(z.object({ profileId: z.string() }))
    .query(async ({ input, ctx }) => {
      const service = new ProfileService(ctx.deps);
      return service.getProfile(input.profileId);
    }),
  
  // Search/list profiles
  search: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      traits: z.record(z.unknown()).optional(),
      segmentId: z.string().optional(),
      lastSeenAfter: z.date().optional(),
      lastSeenBefore: z.date().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      const service = new ProfileService(ctx.deps);
      return service.searchProfiles(input);
    }),
  
  // Upsert profile (identify)
  upsert: protectedProcedure
    .input(z.object({
      ventureId: z.string(),
      userId: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      displayName: z.string().optional(),
      traits: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const service = new ProfileService(ctx.deps);
      return service.upsertProfile({
        ...input,
        source: 'api',
      });
    }),
  
  // Update traits
  updateTraits: protectedProcedure
    .input(z.object({
      profileId: z.string(),
      traits: z.record(z.unknown()),
    }))
    .mutation(async ({ input, ctx }) => {
      const service = new ProfileService(ctx.deps);
      return service.updateProfile(input.profileId, { traits: input.traits });
    }),
  
  // Get timeline
  timeline: protectedProcedure
    .input(z.object({
      profileId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      before: z.date().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const service = new ProfileService(ctx.deps);
      return service.getTimeline(input.profileId, {
        limit: input.limit,
        before: input.before,
      });
    }),
  
  // Merge profiles (admin)
  merge: protectedProcedure
    .input(z.object({
      primaryId: z.string(),
      secondaryId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const service = new ProfileService(ctx.deps);
      return service.mergeProfiles(
        input.primaryId,
        input.secondaryId,
        input.reason ?? 'manual',
        ctx.user.id
      );
    }),
  
  // Suppress profile (GDPR)
  suppress: protectedProcedure
    .input(z.object({
      profileId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const service = new ProfileService(ctx.deps);
      return service.suppressProfile(input.profileId, input.reason);
    }),
});
```

---

## Module: identity-graph

### Purpose

The identity-graph module handles cross-platform identity resolution, linking anonymous users to identified profiles and maintaining a graph of all known identifiers for each customer.

### Database Schema

```typescript
// @mcv/cdp/identity-graph/schema.ts
import { pgTable, text, jsonb, timestamp, numeric, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { profiles } from '../profiles/schema';
import { ventures } from "@mcv/portfolio/schema";

export const identityTypeEnum = pgEnum('identity_type', [
  'email',
  'phone',
  'user_id',
  'device_id',
  'cookie',
  'wallet',
  'social',       // facebook_id, google_id, etc.
  'advertising',  // gaid, idfa
  'custom',
]);

// Identity nodes in the graph
export const identityNodes = pgTable('cdp_identity_node', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  
  // The identifier
  type: identityTypeEnum('type').notNull(),
  value: text('value').notNull(),
  valueHash: text('value_hash').notNull(),
  
  // Resolved profile
  profileId: text('profile_id').references(() => profiles.id),
  
  // Metadata
  firstSeenAt: timestamp('first_seen_at').defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  occurrenceCount: integer('occurrence_count').default(1),
  
  // Source tracking
  sources: jsonb('sources').$type<IdentitySource[]>().default([]),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  ventureTypeValueIdx: uniqueIndex('identity_venture_type_value_idx')
    .on(t.ventureId, t.type, t.valueHash),
  profileIdx: index('identity_profile_idx').on(t.profileId),
  valueHashIdx: index('identity_value_hash_idx').on(t.valueHash),
}));

// Edges connecting identity nodes (co-occurrence)
export const identityEdges = pgTable('cdp_identity_edge', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  
  sourceNodeId: text('source_node_id').references(() => identityNodes.id).notNull(),
  targetNodeId: text('target_node_id').references(() => identityNodes.id).notNull(),
  
  // Edge strength (co-occurrence count)
  strength: integer('strength').default(1),
  
  // Confidence score (0-1)
  confidence: numeric('confidence', { precision: 5, scale: 4 }).default('1.0'),
  
  // How they were linked
  linkType: text('link_type').notNull(), // 'same_session', 'same_event', 'explicit', 'inferred'
  
  firstLinkedAt: timestamp('first_linked_at').defaultNow().notNull(),
  lastLinkedAt: timestamp('last_linked_at').defaultNow().notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  sourceIdx: index('edge_source_idx').on(t.sourceNodeId),
  targetIdx: index('edge_target_idx').on(t.targetNodeId),
  uniqueEdgeIdx: uniqueIndex('edge_unique_idx').on(t.sourceNodeId, t.targetNodeId),
}));

// Resolution rules
export const resolutionRules = pgTable('cdp_resolution_rule', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  
  name: text('name').notNull(),
  description: text('description'),
  
  // Rule priority (higher = evaluated first)
  priority: integer('priority').default(100),
  
  // Conditions
  identityTypes: jsonb('identity_types').$type<string[]>().notNull(), // e.g., ['email', 'phone']
  minConfidence: numeric('min_confidence', { precision: 5, scale: 4 }).default('0.8'),
  minOccurrences: integer('min_occurrences').default(1),
  
  // Actions
  action: text('action').notNull(), // 'merge', 'link', 'ignore'
  requiresReview: boolean('requires_review').default(false),
  
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

interface IdentitySource {
  type: 'web' | 'mobile' | 'api' | 'import' | 'enrichment';
  name: string;
  timestamp: string;
  eventId?: string;
  sessionId?: string;
}
```

### Identity Graph Service

```typescript
// @mcv/cdp/identity-graph/service.ts
import { eq, and, or, sql } from 'drizzle-orm';
import { db } from '@mcv/db';
import { identityNodes, identityEdges, resolutionRules } from './schema';
import { profiles } from '../profiles/schema';
import { EventBus } from '@mcv/events';

export interface IdentityResolutionInput {
  ventureId: string;
  email?: string;
  phone?: string;
  userId?: string;
  deviceId?: string;
  walletAddress?: string;
  sessionId?: string;
  customIds?: Record<string, string>;
}

export interface ResolutionResult {
  profileId: string | null;
  confidence: number;
  matchedIdentities: Array<{ type: string; value: string }>;
  isNewProfile: boolean;
}

export class IdentityGraph {
  private eventBus: EventBus;
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }
  
  /**
   * Resolve identifiers to a single profile.
   * Returns existing profile or null if new.
   */
  async resolve(input: IdentityResolutionInput): Promise<ResolutionResult> {
    // 1. Collect all identifiers
    const identifiers = this.collectIdentifiers(input);
    if (identifiers.length === 0) {
      return { profileId: null, confidence: 0, matchedIdentities: [], isNewProfile: true };
    }
    
    // 2. Find all matching nodes
    const nodes = await this.findNodes(input.ventureId, identifiers);
    
    if (nodes.length === 0) {
      return { profileId: null, confidence: 0, matchedIdentities: [], isNewProfile: true };
    }
    
    // 3. Find profiles connected to these nodes
    const profileIds = [...new Set(nodes.filter(n => n.profileId).map(n => n.profileId!))];
    
    if (profileIds.length === 0) {
      return { profileId: null, confidence: 0, matchedIdentities: [], isNewProfile: true };
    }
    
    if (profileIds.length === 1) {
      return {
        profileId: profileIds[0],
        confidence: 1.0,
        matchedIdentities: nodes.map(n => ({ type: n.type, value: n.value })),
        isNewProfile: false,
      };
    }
    
    // 4. Multiple profiles found - check merge rules
    const shouldMerge = await this.shouldAutoMerge(profileIds, nodes);
    
    if (shouldMerge.merge) {
      await this.triggerMerge(
        shouldMerge.primaryId!,
        shouldMerge.secondaryIds![0],
        'identity_resolution'
      );
      return {
        profileId: shouldMerge.primaryId!,
        confidence: shouldMerge.confidence,
        matchedIdentities: nodes.map(n => ({ type: n.type, value: n.value })),
        isNewProfile: false,
      };
    }
    
    // 5. Return highest confidence profile
    const rankedProfiles = await this.rankProfiles(profileIds, nodes);
    
    return {
      profileId: rankedProfiles[0].profileId,
      confidence: rankedProfiles[0].confidence,
      matchedIdentities: nodes.map(n => ({ type: n.type, value: n.value })),
      isNewProfile: false,
    };
  }
  
  /**
   * Link identities together (co-occurrence).
   */
  async linkIdentities(
    ventureId: string,
    identifiers: Array<{ type: string; value: string }>,
    linkType: string
  ): Promise<void> {
    // 1. Ensure all nodes exist
    const nodes: IdentityNode[] = [];
    for (const id of identifiers) {
      const node = await this.upsertNode(ventureId, id.type, id.value);
      nodes.push(node);
    }
    
    // 2. Create/update edges between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        await this.upsertEdge(nodes[i].id, nodes[j].id, linkType);
      }
    }
  }
  
  /**
   * Associate identities with a profile.
   */
  async associateWithProfile(
    ventureId: string,
    profileId: string,
    identifiers: Array<{ type: string; value: string }>
  ): Promise<void> {
    for (const id of identifiers) {
      const node = await this.upsertNode(ventureId, id.type, id.value);
      
      if (node.profileId && node.profileId !== profileId) {
        // Already associated with different profile - trigger merge check
        await this.checkAndTriggerMerge(profileId, node.profileId);
      }
      
      await db.update(identityNodes)
        .set({
          profileId,
          lastSeenAt: new Date(),
          occurrenceCount: sql`${identityNodes.occurrenceCount} + 1`,
        })
        .where(eq(identityNodes.id, node.id));
    }
  }
  
  /**
   * Get the full identity graph for a profile.
   */
  async getProfileGraph(profileId: string): Promise<IdentityGraphView> {
    // Get all nodes for this profile
    const nodes = await db.select()
      .from(identityNodes)
      .where(eq(identityNodes.profileId, profileId));
    
    // Get all edges between these nodes
    const nodeIds = nodes.map(n => n.id);
    const edges = await db.select()
      .from(identityEdges)
      .where(
        or(
          sql`${identityEdges.sourceNodeId} = ANY(${nodeIds})`,
          sql`${identityEdges.targetNodeId} = ANY(${nodeIds})`
        )
      );
    
    return {
      profileId,
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        value: n.value,
        firstSeen: n.firstSeenAt,
        lastSeen: n.lastSeenAt,
        occurrences: n.occurrenceCount,
      })),
      edges: edges.map(e => ({
        source: e.sourceNodeId,
        target: e.targetNodeId,
        strength: e.strength,
        confidence: Number(e.confidence),
        linkType: e.linkType,
      })),
    };
  }
  
  /**
   * Trigger a profile merge.
   */
  async triggerMerge(
    primaryId: string,
    secondaryId: string,
    reason: string
  ): Promise<void> {
    await this.eventBus.emit('cdp.merge.requested', {
      primaryId,
      secondaryId,
      reason,
    });
  }
  
  private collectIdentifiers(input: IdentityResolutionInput): Array<{ type: string; value: string }> {
    const identifiers: Array<{ type: string; value: string }> = [];
    
    if (input.email) identifiers.push({ type: 'email', value: input.email.toLowerCase() });
    if (input.phone) identifiers.push({ type: 'phone', value: input.phone });
    if (input.userId) identifiers.push({ type: 'user_id', value: input.userId });
    if (input.deviceId) identifiers.push({ type: 'device_id', value: input.deviceId });
    if (input.walletAddress) identifiers.push({ type: 'wallet', value: input.walletAddress });
    
    if (input.customIds) {
      for (const [key, value] of Object.entries(input.customIds)) {
        identifiers.push({ type: `custom:${key}`, value });
      }
    }
    
    return identifiers;
  }
  
  private async findNodes(
    ventureId: string,
    identifiers: Array<{ type: string; value: string }>
  ): Promise<IdentityNode[]> {
    const conditions = identifiers.map(id => 
      and(
        eq(identityNodes.type, id.type),
        eq(identityNodes.valueHash, this.hashValue(id.value))
      )
    );
    
    return db.select()
      .from(identityNodes)
      .where(and(
        eq(identityNodes.ventureId, ventureId),
        or(...conditions)
      ));
  }
  
  private async upsertNode(
    ventureId: string,
    type: string,
    value: string
  ): Promise<IdentityNode> {
    const valueHash = this.hashValue(value);
    
    const existing = await db.query.identityNodes.findFirst({
      where: and(
        eq(identityNodes.ventureId, ventureId),
        eq(identityNodes.type, type),
        eq(identityNodes.valueHash, valueHash)
      ),
    });
    
    if (existing) {
      await db.update(identityNodes)
        .set({
          lastSeenAt: new Date(),
          occurrenceCount: sql`${identityNodes.occurrenceCount} + 1`,
        })
        .where(eq(identityNodes.id, existing.id));
      return existing;
    }
    
    return db.insert(identityNodes).values({
      ventureId,
      type,
      value,
      valueHash,
    }).returning().then(r => r[0]);
  }
  
  private async upsertEdge(
    sourceId: string,
    targetId: string,
    linkType: string
  ): Promise<void> {
    const existing = await db.query.identityEdges.findFirst({
      where: or(
        and(eq(identityEdges.sourceNodeId, sourceId), eq(identityEdges.targetNodeId, targetId)),
        and(eq(identityEdges.sourceNodeId, targetId), eq(identityEdges.targetNodeId, sourceId))
      ),
    });
    
    if (existing) {
      await db.update(identityEdges)
        .set({
          strength: sql`${identityEdges.strength} + 1`,
          lastLinkedAt: new Date(),
        })
        .where(eq(identityEdges.id, existing.id));
      return;
    }
    
    await db.insert(identityEdges).values({
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      linkType,
    });
  }
  
  private hashValue(value: string): string {
    // Synchronous hash for quick lookups
    return require('crypto')
      .createHash('sha256')
      .update(value.toLowerCase().trim())
      .digest('hex');
  }
  
  private async shouldAutoMerge(
    profileIds: string[],
    nodes: IdentityNode[]
  ): Promise<{ merge: boolean; primaryId?: string; secondaryIds?: string[]; confidence: number }> {
    // Get venture's resolution rules
    const venture = nodes[0]?.ventureId;
    if (!venture) return { merge: false, confidence: 0 };
    
    const rules = await db.select()
      .from(resolutionRules)
      .where(and(
        eq(resolutionRules.ventureId, venture),
        eq(resolutionRules.isActive, true)
      ))
      .orderBy(sql`${resolutionRules.priority} DESC`);
    
    for (const rule of rules) {
      // Check if matching identity types present
      const matchingTypes = nodes.filter(n => 
        (rule.identityTypes as string[]).includes(n.type)
      );
      
      if (matchingTypes.length >= 2 && rule.action === 'merge') {
        // Determine primary (profile with more data)
        const profileData = await Promise.all(profileIds.map(async id => ({
          id,
          eventCount: (await db.query.profiles.findFirst({
            where: eq(profiles.id, id),
          }))?.totalEvents ?? 0,
        })));
        
        profileData.sort((a, b) => b.eventCount - a.eventCount);
        
        return {
          merge: true,
          primaryId: profileData[0].id,
          secondaryIds: profileData.slice(1).map(p => p.id),
          confidence: Number(rule.minConfidence),
        };
      }
    }
    
    return { merge: false, confidence: 0 };
  }
  
  private async rankProfiles(
    profileIds: string[],
    nodes: IdentityNode[]
  ): Promise<Array<{ profileId: string; confidence: number }>> {
    // Rank by number of matching identities and recency
    const rankings = await Promise.all(profileIds.map(async id => {
      const matchingNodes = nodes.filter(n => n.profileId === id);
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.id, id),
      });
      
      return {
        profileId: id,
        confidence: matchingNodes.length / nodes.length,
        recency: profile?.lastSeenAt?.getTime() ?? 0,
      };
    }));
    
    rankings.sort((a, b) => {
      if (a.confidence !== b.confidence) return b.confidence - a.confidence;
      return b.recency - a.recency;
    });
    
    return rankings;
  }
  
  private async checkAndTriggerMerge(
    profileId1: string,
    profileId2: string
  ): Promise<void> {
    // Emit event for merge review
    await this.eventBus.emit('cdp.merge.candidate', {
      profileIds: [profileId1, profileId2],
      reason: 'shared_identity',
    });
  }
}

interface IdentityNode {
  id: string;
  ventureId: string;
  type: string;
  value: string;
  valueHash: string;
  profileId: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  occurrenceCount: number;
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
```

---

## Module: events

### Purpose

The events module handles behavioral event tracking, storage, and processing — capturing every meaningful interaction users have across the platform.

### Database Schema

```typescript
// @mcv/cdp/events/schema.ts
import { pgTable, text, jsonb, timestamp, numeric, integer, index, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { profiles } from '../profiles/schema';
import { ventures } from "@mcv/portfolio/schema";

export const eventCategoryEnum = pgEnum('event_category', [
  'page',
  'track',
  'identify',
  'screen',
  'group',
  'alias',
]);

// Raw events (high-volume, partitioned by date)
export const events = pgTable('cdp_event', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  
  // Profile association
  profileId: text('profile_id').references(() => profiles.id),
  anonymousId: text('anonymous_id'), // Pre-identification
  
  // Event classification
  category: eventCategoryEnum('category').notNull(),
  name: text('name').notNull(),  // 'Page Viewed', 'Product Added', 'Order Completed'
  
  // Event data
  properties: jsonb('properties').$type<Record<string, unknown>>().default({}),
  
  // Context
  context: jsonb('context').$type<EventContext>().default({}),
  
  // Timing
  timestamp: timestamp('timestamp').notNull(),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  sentAt: timestamp('sent_at'),
  
  // Source
  source: text('source').notNull(), // 'web', 'mobile', 'server', 'import'
  sourceId: text('source_id'),  // SDK instance ID
  
  // Message deduplication
  messageId: text('message_id').unique(),
  
  // Revenue tracking
  revenue: numeric('revenue', { precision: 20, scale: 4 }),
  currency: text('currency'),
  
  // Version (schema evolution)
  version: integer('version').default(1),
}, (t) => ({
  ventureTimeIdx: index('event_venture_time_idx').on(t.ventureId, t.timestamp),
  profileTimeIdx: index('event_profile_time_idx').on(t.profileId, t.timestamp),
  nameIdx: index('event_name_idx').on(t.name),
  anonymousIdx: index('event_anonymous_idx').on(t.anonymousId),
}));

// Event definitions (schema registry)
export const eventDefinitions = pgTable('cdp_event_definition', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  
  category: eventCategoryEnum('category').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  
  // Schema
  propertiesSchema: jsonb('properties_schema').$type<JSONSchema>(),
  
  // Tracking
  status: text('status').default('active'), // 'active', 'deprecated', 'draft'
  totalCount: integer('total_count').default(0),
  lastSeenAt: timestamp('last_seen_at'),
  
  // Tags for organization
  tags: jsonb('tags').$type<string[]>().default([]),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  ventureCategoryNameIdx: uniqueIndex('event_def_venture_category_name_idx')
    .on(t.ventureId, t.category, t.name),
}));

// Aggregated event metrics (for dashboards)
export const eventMetrics = pgTable('cdp_event_metric', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  
  // Aggregation window
  windowStart: timestamp('window_start').notNull(),
  windowEnd: timestamp('window_end').notNull(),
  granularity: text('granularity').notNull(), // 'hour', 'day', 'week', 'month'
  
  // Dimensions
  eventName: text('event_name').notNull(),
  source: text('source'),
  
  // Metrics
  eventCount: integer('event_count').default(0),
  uniqueProfiles: integer('unique_profiles').default(0),
  totalRevenue: numeric('total_revenue', { precision: 20, scale: 4 }),
  
  // Property aggregates (e.g., avg cart value)
  propertyAggregates: jsonb('property_aggregates').$type<Record<string, number>>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  ventureWindowIdx: index('metric_venture_window_idx')
    .on(t.ventureId, t.granularity, t.windowStart),
  eventNameIdx: index('metric_event_name_idx').on(t.eventName),
}));

interface EventContext {
  // Device
  device?: {
    id?: string;
    manufacturer?: string;
    model?: string;
    type?: 'mobile' | 'tablet' | 'desktop';
  };
  // OS
  os?: {
    name?: string;
    version?: string;
  };
  // Browser
  browser?: {
    name?: string;
    version?: string;
  };
  // Location
  location?: {
    ip?: string;
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  // Page
  page?: {
    url?: string;
    path?: string;
    title?: string;
    referrer?: string;
  };
  // Campaign
  campaign?: {
    source?: string;
    medium?: string;
    name?: string;
    term?: string;
    content?: string;
  };
  // Session
  sessionId?: string;
  // Custom
  [key: string]: unknown;
}

interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  additionalProperties?: boolean;
}
```

### Event Collector Service

```typescript
// @mcv/cdp/events/collector.ts
import { db } from '@mcv/db';
import { events, eventDefinitions, eventMetrics } from './schema';
import { IdentityGraph } from '../identity-graph';
import { TraitEngine } from '../traits';
import { EventBus } from '@mcv/events';

export interface TrackEventInput {
  ventureId: string;
  
  // Identity (at least one required)
  profileId?: string;
  userId?: string;
  anonymousId?: string;
  
  // Event data
  category: 'page' | 'track' | 'identify' | 'screen';
  name: string;
  properties?: Record<string, unknown>;
  
  // Context
  context?: EventContext;
  
  // Timing
  timestamp?: Date;
  sentAt?: Date;
  
  // Source
  source: string;
  sourceId?: string;
  
  // Deduplication
  messageId?: string;
}

export class EventCollector {
  private identityGraph: IdentityGraph;
  private traitEngine: TraitEngine;
  private eventBus: EventBus;
  private batchQueue: TrackEventInput[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  
  constructor(deps: {
    identityGraph: IdentityGraph;
    traitEngine: TraitEngine;
    eventBus: EventBus;
  }) {
    this.identityGraph = deps.identityGraph;
    this.traitEngine = deps.traitEngine;
    this.eventBus = deps.eventBus;
  }
  
  /**
   * Track a single event.
   */
  async track(input: TrackEventInput): Promise<{ eventId: string; profileId: string | null }> {
    // 1. Resolve profile
    const resolution = await this.resolveProfile(input);
    
    // 2. Insert event
    const event = await db.insert(events).values({
      ventureId: input.ventureId,
      profileId: resolution.profileId,
      anonymousId: input.anonymousId,
      category: input.category,
      name: input.name,
      properties: input.properties ?? {},
      context: input.context ?? {},
      timestamp: input.timestamp ?? new Date(),
      sentAt: input.sentAt,
      source: input.source,
      sourceId: input.sourceId,
      messageId: input.messageId,
      revenue: this.extractRevenue(input.properties),
      currency: input.properties?.currency as string,
    }).returning().then(r => r[0]);
    
    // 3. Update identity graph with co-occurring identities
    await this.updateIdentityGraph(input, resolution);
    
    // 4. Update profile stats
    if (resolution.profileId) {
      await this.updateProfileStats(resolution.profileId, input);
    }
    
    // 5. Trigger trait computation if needed
    if (this.shouldComputeTraits(input)) {
      await this.traitEngine.queueComputation(resolution.profileId!, input.name);
    }
    
    // 6. Emit event for downstream processing
    await this.eventBus.emit('cdp.event.tracked', {
      eventId: event.id,
      profileId: resolution.profileId,
      ventureId: input.ventureId,
      name: input.name,
      category: input.category,
    });
    
    return {
      eventId: event.id,
      profileId: resolution.profileId,
    };
  }
  
  /**
   * Track multiple events in batch.
   */
  async trackBatch(inputs: TrackEventInput[]): Promise<void> {
    // Use transaction for efficiency
    await db.transaction(async (tx) => {
      for (const input of inputs) {
        await this.track(input);
      }
    });
  }
  
  /**
   * Identify a user (merge anonymous with identified).
   */
  async identify(input: {
    ventureId: string;
    userId: string;
    anonymousId?: string;
    traits?: Record<string, unknown>;
    context?: EventContext;
    source: string;
  }): Promise<{ profileId: string }> {
    // 1. Create/get profile for userId
    const resolution = await this.identityGraph.resolve({
      ventureId: input.ventureId,
      userId: input.userId,
    });
    
    let profileId = resolution.profileId;
    
    if (!profileId) {
      // Create new profile
      const profile = await db.insert(profiles).values({
        ventureId: input.ventureId,
        userId: input.userId,
        type: 'identified',
        traits: input.traits ?? {},
      }).returning().then(r => r[0]);
      profileId = profile.id;
    }
    
    // 2. Link anonymousId if provided
    if (input.anonymousId) {
      await this.identityGraph.associateWithProfile(
        input.ventureId,
        profileId,
        [
          { type: 'user_id', value: input.userId },
          { type: 'anonymous_id', value: input.anonymousId },
        ]
      );
      
      // Update previous anonymous events to this profile
      await db.update(events)
        .set({ profileId })
        .where(and(
          eq(events.anonymousId, input.anonymousId),
          eq(events.profileId, null)
        ));
    }
    
    // 3. Track identify event
    await this.track({
      ventureId: input.ventureId,
      profileId,
      category: 'identify',
      name: 'Identify',
      properties: input.traits,
      context: input.context,
      source: input.source,
    });
    
    return { profileId };
  }
  
  /**
   * Page view tracking.
   */
  async page(input: {
    ventureId: string;
    profileId?: string;
    anonymousId?: string;
    name?: string;
    properties?: Record<string, unknown>;
    context?: EventContext;
    source: string;
  }): Promise<{ eventId: string }> {
    const result = await this.track({
      ...input,
      category: 'page',
      name: input.name ?? 'Page Viewed',
      properties: {
        ...input.properties,
        url: input.context?.page?.url,
        path: input.context?.page?.path,
        title: input.context?.page?.title,
        referrer: input.context?.page?.referrer,
      },
    });
    
    return { eventId: result.eventId };
  }
  
  /**
   * Query events with filtering.
   */
  async queryEvents(params: {
    ventureId: string;
    profileId?: string;
    eventName?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ events: Event[]; total: number }> {
    const conditions = [eq(events.ventureId, params.ventureId)];
    
    if (params.profileId) {
      conditions.push(eq(events.profileId, params.profileId));
    }
    if (params.eventName) {
      conditions.push(eq(events.name, params.eventName));
    }
    if (params.startDate) {
      conditions.push(sql`${events.timestamp} >= ${params.startDate}`);
    }
    if (params.endDate) {
      conditions.push(sql`${events.timestamp} <= ${params.endDate}`);
    }
    
    const [results, countResult] = await Promise.all([
      db.select()
        .from(events)
        .where(and(...conditions))
        .orderBy(desc(events.timestamp))
        .limit(params.limit ?? 100)
        .offset(params.offset ?? 0),
      db.select({ count: sql<number>`count(*)` })
        .from(events)
        .where(and(...conditions)),
    ]);
    
    return {
      events: results,
      total: countResult[0].count,
    };
  }
  
  /**
   * Get event metrics for analytics.
   */
  async getMetrics(params: {
    ventureId: string;
    eventName?: string;
    granularity: 'hour' | 'day' | 'week' | 'month';
    startDate: Date;
    endDate: Date;
  }): Promise<EventMetricRow[]> {
    const conditions = [
      eq(eventMetrics.ventureId, params.ventureId),
      eq(eventMetrics.granularity, params.granularity),
      sql`${eventMetrics.windowStart} >= ${params.startDate}`,
      sql`${eventMetrics.windowEnd} <= ${params.endDate}`,
    ];
    
    if (params.eventName) {
      conditions.push(eq(eventMetrics.eventName, params.eventName));
    }
    
    return db.select()
      .from(eventMetrics)
      .where(and(...conditions))
      .orderBy(eventMetrics.windowStart);
  }
  
  private async resolveProfile(input: TrackEventInput): Promise<{ profileId: string | null; isNew: boolean }> {
    if (input.profileId) {
      return { profileId: input.profileId, isNew: false };
    }
    
    const resolution = await this.identityGraph.resolve({
      ventureId: input.ventureId,
      userId: input.userId,
      deviceId: input.anonymousId,
    });
    
    return {
      profileId: resolution.profileId,
      isNew: resolution.isNewProfile,
    };
  }
  
  private async updateIdentityGraph(
    input: TrackEventInput,
    resolution: { profileId: string | null }
  ): Promise<void> {
    const identifiers: Array<{ type: string; value: string }> = [];
    
    if (input.userId) identifiers.push({ type: 'user_id', value: input.userId });
    if (input.anonymousId) identifiers.push({ type: 'device_id', value: input.anonymousId });
    if (input.context?.device?.id) identifiers.push({ type: 'device_id', value: input.context.device.id });
    
    if (identifiers.length > 1) {
      await this.identityGraph.linkIdentities(
        input.ventureId,
        identifiers,
        'same_event'
      );
    }
    
    if (resolution.profileId && identifiers.length > 0) {
      await this.identityGraph.associateWithProfile(
        input.ventureId,
        resolution.profileId,
        identifiers
      );
    }
  }
  
  private async updateProfileStats(profileId: string, input: TrackEventInput): Promise<void> {
    const updates: Record<string, unknown> = {
      lastSeenAt: new Date(),
      totalEvents: sql`${profiles.totalEvents} + 1`,
    };
    
    if (input.name === 'Session Started') {
      updates.totalSessions = sql`${profiles.totalSessions} + 1`;
    }
    
    const revenue = this.extractRevenue(input.properties);
    if (revenue) {
      updates.ltvAmount = sql`${profiles.ltvAmount} + ${revenue}`;
    }
    
    await db.update(profiles)
      .set(updates)
      .where(eq(profiles.id, profileId));
  }
  
  private extractRevenue(properties?: Record<string, unknown>): string | null {
    const revenue = properties?.revenue ?? properties?.total ?? properties?.value;
    if (typeof revenue === 'number') return String(revenue);
    if (typeof revenue === 'string') return revenue;
    return null;
  }
  
  private shouldComputeTraits(input: TrackEventInput): boolean {
    const traitTriggerEvents = [
      'Order Completed',
      'Product Purchased',
      'Subscription Started',
      'Subscription Cancelled',
      'Deposit Made',
      'Bet Placed',
    ];
    return input.profileId != null && traitTriggerEvents.includes(input.name);
  }
}
```

---

## Module: traits

### Purpose

The traits module manages both computed (derived from events) and manual (set explicitly) traits for customer profiles.

### Database Schema

```typescript
// @mcv/cdp/traits/schema.ts
import { pgTable, text, jsonb, timestamp, boolean, numeric, integer, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { profiles } from '../profiles/schema';
import { ventures } from "@mcv/portfolio/schema";

export const traitTypeEnum = pgEnum('trait_type', [
  'string',
  'number',
  'boolean',
  'date',
  'array',
  'object',
]);

export const traitSourceEnum = pgEnum('trait_source', [
  'computed',    // Derived from events
  'manual',      // Set via API
  'imported',    // Bulk import
  'enrichment',  // Third-party enrichment
  'ml',          // ML model prediction
]);

// Trait definitions
export const traitDefinitions = pgTable('cdp_trait_definition', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  
  // Identification
  key: text('key').notNull(),  // 'lifetime_value', 'churn_risk'
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),  // 'demographics', 'behavior', 'predictive'
  
  // Type
  type: traitTypeEnum('type').notNull(),
  
  // Source
  source: traitSourceEnum('source').notNull(),
  
  // For computed traits: the computation rule
  computationRule: jsonb('computation_rule').$type<ComputationRule>(),
  
  // For ML traits: model info
  mlModelId: text('ml_model_id'),
  
  // Default value
  defaultValue: jsonb('default_value'),
  
  // Validation
  validationRules: jsonb('validation_rules').$type<ValidationRule[]>(),
  
  // Privacy
  isPii: boolean('is_pii').default(false),
  isExportable: boolean('is_exportable').default(true),
  
  // Status
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  ventureKeyIdx: uniqueIndex('trait_def_venture_key_idx').on(t.ventureId, t.key),
  categoryIdx: index('trait_def_category_idx').on(t.category),
}));

// Trait values per profile
export const traitValues = pgTable('cdp_trait_value', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  traitDefinitionId: text('trait_definition_id').references(() => traitDefinitions.id).notNull(),
  
  // The value
  value: jsonb('value'),
  
  // Source details
  source: traitSourceEnum('source').notNull(),
  sourceDetails: jsonb('source_details').$type<SourceDetails>(),
  
  // Confidence (for ML predictions)
  confidence: numeric('confidence', { precision: 5, scale: 4 }),
  
  // Timing
  computedAt: timestamp('computed_at'),
  expiresAt: timestamp('expires_at'),
  
  // Version for optimistic locking
  version: integer('version').default(1),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  profileTraitIdx: uniqueIndex('trait_value_profile_trait_idx')
    .on(t.profileId, t.traitDefinitionId),
  traitDefIdx: index('trait_value_trait_def_idx').on(t.traitDefinitionId),
}));

// Trait computation jobs
export const traitComputationJobs = pgTable('cdp_trait_computation_job', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  
  // What to compute
  traitDefinitionId: text('trait_definition_id').references(() => traitDefinitions.id).notNull(),
  profileId: text('profile_id').references(() => profiles.id), // null = all profiles
  
  // Trigger
  triggeredBy: text('triggered_by').notNull(), // 'event', 'schedule', 'manual'
  triggerEventName: text('trigger_event_name'),
  
  // Status
  status: text('status').default('pending'), // 'pending', 'running', 'completed', 'failed'
  
  // Results
  profilesProcessed: integer('profiles_processed').default(0),
  profilesUpdated: integer('profiles_updated').default(0),
  error: text('error'),
  
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

interface ComputationRule {
  type: 'aggregate' | 'window' | 'recency' | 'frequency' | 'custom';
  
  // For aggregate
  eventName?: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'first' | 'last';
  propertyPath?: string;
  
  // For window
  windowDays?: number;
  
  // For recency
  sinceEvent?: string;
  unit?: 'days' | 'hours' | 'minutes';
  
  // For custom
  sql?: string;
  
  // Filters
  eventFilters?: Array<{
    property: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
    value: unknown;
  }>;
}

interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'custom';
  value: unknown;
  message: string;
}

interface SourceDetails {
  eventId?: string;
  importId?: string;
  enrichmentProvider?: string;
  modelVersion?: string;
  computedFrom?: string[];
}
```

### Trait Engine

```typescript
// @mcv/cdp/traits/engine.ts
import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '@mcv/db';
import { traitDefinitions, traitValues, traitComputationJobs } from './schema';
import { events } from '../events/schema';
import { profiles } from '../profiles/schema';
import { EventBus } from '@mcv/events';

export class TraitEngine {
  private eventBus: EventBus;
  private computationQueue: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }
  
  /**
   * Define a new trait.
   */
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
  }): Promise<TraitDefinition> {
    const trait = await db.insert(traitDefinitions).values({
      ventureId: input.ventureId,
      key: input.key,
      name: input.name,
      description: input.description,
      category: input.category,
      type: input.type,
      source: input.source,
      computationRule: input.computationRule,
      defaultValue: input.defaultValue,
      isPii: input.isPii ?? false,
    }).returning().then(r => r[0]);
    
    await this.eventBus.emit('cdp.trait.defined', {
      traitId: trait.id,
      key: trait.key,
      ventureId: input.ventureId,
    });
    
    return trait;
  }
  
  /**
   * Set a manual trait value for a profile.
   */
  async setTrait(
    profileId: string,
    key: string,
    value: unknown,
    source: 'manual' | 'imported' | 'enrichment' = 'manual'
  ): Promise<void> {
    // Get profile's venture
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
    });
    if (!profile) throw new NotFoundError('Profile', profileId);
    
    // Get trait definition
    const traitDef = await db.query.traitDefinitions.findFirst({
      where: and(
        eq(traitDefinitions.ventureId, profile.ventureId),
        eq(traitDefinitions.key, key)
      ),
    });
    
    if (!traitDef) {
      throw new NotFoundError('TraitDefinition', key);
    }
    
    // Validate value type
    this.validateTraitValue(value, traitDef);
    
    // Upsert trait value
    await db.insert(traitValues)
      .values({
        profileId,
        traitDefinitionId: traitDef.id,
        value,
        source,
      })
      .onConflictDoUpdate({
        target: [traitValues.profileId, traitValues.traitDefinitionId],
        set: {
          value,
          source,
          version: sql`${traitValues.version} + 1`,
          updatedAt: new Date(),
        },
      });
    
    // Update denormalized traits on profile
    await this.updateProfileTraits(profileId);
  }
  
  /**
   * Set multiple traits at once.
   */
  async setTraits(
    profileId: string,
    traits: Record<string, unknown>,
    source: 'manual' | 'imported' | 'enrichment' = 'manual'
  ): Promise<void> {
    for (const [key, value] of Object.entries(traits)) {
      await this.setTrait(profileId, key, value, source);
    }
  }
  
  /**
   * Get all traits for a profile.
   */
  async getTraits(profileId: string): Promise<Record<string, unknown>> {
    const values = await db.select({
      key: traitDefinitions.key,
      value: traitValues.value,
    })
    .from(traitValues)
    .innerJoin(traitDefinitions, eq(traitValues.traitDefinitionId, traitDefinitions.id))
    .where(eq(traitValues.profileId, profileId));
    
    return Object.fromEntries(values.map(v => [v.key, v.value]));
  }
  
  /**
   * Compute traits for a profile based on computation rules.
   */
  async computeTraits(profileId: string): Promise<Record<string, unknown>> {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
    });
    if (!profile) return {};
    
    // Get all computed trait definitions for this venture
    const computedTraits = await db.select()
      .from(traitDefinitions)
      .where(and(
        eq(traitDefinitions.ventureId, profile.ventureId),
        eq(traitDefinitions.source, 'computed'),
        eq(traitDefinitions.isActive, true)
      ));
    
    const results: Record<string, unknown> = {};
    
    for (const trait of computedTraits) {
      if (!trait.computationRule) continue;
      
      const value = await this.executeComputation(profileId, trait.computationRule);
      results[trait.key] = value;
      
      // Store computed value
      await db.insert(traitValues)
        .values({
          profileId,
          traitDefinitionId: trait.id,
          value,
          source: 'computed',
          computedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [traitValues.profileId, traitValues.traitDefinitionId],
          set: {
            value,
            computedAt: new Date(),
            version: sql`${traitValues.version} + 1`,
            updatedAt: new Date(),
          },
        });
    }
    
    return results;
  }
  
  /**
   * Queue trait computation (debounced).
   */
  async queueComputation(profileId: string, triggerEvent: string): Promise<void> {
    const key = `${profileId}:${triggerEvent}`;
    
    // Debounce - wait 5 seconds before computing
    if (this.computationQueue.has(key)) {
      clearTimeout(this.computationQueue.get(key)!);
    }
    
    const timeout = setTimeout(async () => {
      this.computationQueue.delete(key);
      await this.computeTraits(profileId);
      await this.updateProfileTraits(profileId);
    }, 5000);
    
    this.computationQueue.set(key, timeout);
  }
  
  /**
   * Run batch computation for all profiles (scheduled job).
   */
  async runBatchComputation(ventureId: string, traitKey: string): Promise<ComputationJobResult> {
    const traitDef = await db.query.traitDefinitions.findFirst({
      where: and(
        eq(traitDefinitions.ventureId, ventureId),
        eq(traitDefinitions.key, traitKey)
      ),
    });
    
    if (!traitDef || !traitDef.computationRule) {
      throw new Error(`Trait '${traitKey}' not found or not computed`);
    }
    
    // Create job record
    const job = await db.insert(traitComputationJobs).values({
      traitDefinitionId: traitDef.id,
      triggeredBy: 'schedule',
      status: 'running',
      startedAt: new Date(),
    }).returning().then(r => r[0]);
    
    let processed = 0;
    let updated = 0;
    
    try {
      // Stream profiles in batches
      const batchSize = 1000;
      let offset = 0;
      
      while (true) {
        const batch = await db.select()
          .from(profiles)
          .where(and(
            eq(profiles.ventureId, ventureId),
            eq(profiles.status, 'active')
          ))
          .limit(batchSize)
          .offset(offset);
        
        if (batch.length === 0) break;
        
        for (const profile of batch) {
          const value = await this.executeComputation(profile.id, traitDef.computationRule!);
          
          const result = await db.insert(traitValues)
            .values({
              profileId: profile.id,
              traitDefinitionId: traitDef.id,
              value,
              source: 'computed',
              computedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [traitValues.profileId, traitValues.traitDefinitionId],
              set: {
                value,
                computedAt: new Date(),
                updatedAt: new Date(),
              },
            })
            .returning();
          
          processed++;
          if (result.length > 0) updated++;
        }
        
        offset += batchSize;
        
        // Update job progress
        await db.update(traitComputationJobs)
          .set({ profilesProcessed: processed, profilesUpdated: updated })
          .where(eq(traitComputationJobs.id, job.id));
      }
      
      // Mark completed
      await db.update(traitComputationJobs)
        .set({
          status: 'completed',
          profilesProcessed: processed,
          profilesUpdated: updated,
          completedAt: new Date(),
        })
        .where(eq(traitComputationJobs.id, job.id));
      
      return { jobId: job.id, processed, updated };
      
    } catch (error) {
      await db.update(traitComputationJobs)
        .set({
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        })
        .where(eq(traitComputationJobs.id, job.id));
      
      throw error;
    }
  }
  
  private async executeComputation(
    profileId: string,
    rule: ComputationRule
  ): Promise<unknown> {
    switch (rule.type) {
      case 'aggregate':
        return this.computeAggregate(profileId, rule);
      case 'window':
        return this.computeWindow(profileId, rule);
      case 'recency':
        return this.computeRecency(profileId, rule);
      case 'frequency':
        return this.computeFrequency(profileId, rule);
      default:
        return null;
    }
  }
  
  private async computeAggregate(
    profileId: string,
    rule: ComputationRule
  ): Promise<number | null> {
    const conditions = [eq(events.profileId, profileId)];
    
    if (rule.eventName) {
      conditions.push(eq(events.name, rule.eventName));
    }
    
    let selectClause: unknown;
    switch (rule.aggregation) {
      case 'count':
        selectClause = sql<number>`count(*)`;
        break;
      case 'sum':
        selectClause = sql<number>`sum((${events.properties}->>'${rule.propertyPath}')::numeric)`;
        break;
      case 'avg':
        selectClause = sql<number>`avg((${events.properties}->>'${rule.propertyPath}')::numeric)`;
        break;
      case 'max':
        selectClause = sql<number>`max((${events.properties}->>'${rule.propertyPath}')::numeric)`;
        break;
      case 'min':
        selectClause = sql<number>`min((${events.properties}->>'${rule.propertyPath}')::numeric)`;
        break;
      default:
        return null;
    }
    
    const result = await db.select({ value: selectClause })
      .from(events)
      .where(and(...conditions));
    
    return result[0]?.value ?? null;
  }
  
  private async computeWindow(
    profileId: string,
    rule: ComputationRule
  ): Promise<number | null> {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - (rule.windowDays ?? 30));
    
    const conditions = [
      eq(events.profileId, profileId),
      sql`${events.timestamp} >= ${windowStart}`,
    ];
    
    if (rule.eventName) {
      conditions.push(eq(events.name, rule.eventName));
    }
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(...conditions));
    
    return result[0]?.count ?? 0;
  }
  
  private async computeRecency(
    profileId: string,
    rule: ComputationRule
  ): Promise<number | null> {
    const conditions = [eq(events.profileId, profileId)];
    
    if (rule.sinceEvent) {
      conditions.push(eq(events.name, rule.sinceEvent));
    }
    
    const result = await db.select({ timestamp: events.timestamp })
      .from(events)
      .where(and(...conditions))
      .orderBy(desc(events.timestamp))
      .limit(1);
    
    if (result.length === 0) return null;
    
    const diffMs = Date.now() - result[0].timestamp.getTime();
    
    switch (rule.unit) {
      case 'minutes':
        return Math.floor(diffMs / 60000);
      case 'hours':
        return Math.floor(diffMs / 3600000);
      case 'days':
      default:
        return Math.floor(diffMs / 86400000);
    }
  }
  
  private async computeFrequency(
    profileId: string,
    rule: ComputationRule
  ): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const conditions = [
      eq(events.profileId, profileId),
      sql`${events.timestamp} >= ${thirtyDaysAgo}`,
    ];
    
    if (rule.eventName) {
      conditions.push(eq(events.name, rule.eventName));
    }
    
    // Get unique days with activity
    const result = await db.select({
      uniqueDays: sql<number>`count(distinct date_trunc('day', ${events.timestamp}))`,
    })
    .from(events)
    .where(and(...conditions));
    
    return result[0]?.uniqueDays ?? 0;
  }
  
  private validateTraitValue(value: unknown, definition: TraitDefinition): void {
    const typeChecks: Record<string, (v: unknown) => boolean> = {
      string: v => typeof v === 'string',
      number: v => typeof v === 'number',
      boolean: v => typeof v === 'boolean',
      date: v => v instanceof Date || !isNaN(Date.parse(String(v))),
      array: v => Array.isArray(v),
      object: v => typeof v === 'object' && v !== null && !Array.isArray(v),
    };
    
    if (!typeChecks[definition.type](value)) {
      throw new ValidationError(`Trait '${definition.key}' expects ${definition.type}, got ${typeof value}`);
    }
  }
  
  private async updateProfileTraits(profileId: string): Promise<void> {
    const allTraits = await this.getTraits(profileId);
    
    await db.update(profiles)
      .set({
        traits: allTraits,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, profileId));
  }
}

interface ComputationJobResult {
  jobId: string;
  processed: number;
  updated: number;
}
```

---

## Module: segments

### Purpose

The segments module enables dynamic audience segmentation based on profile traits, events, and custom rules.

### Database Schema

```typescript
// @mcv/cdp/segments/schema.ts
import { pgTable, text, jsonb, timestamp, boolean, integer, index, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { profiles } from '../profiles/schema';
import { ventures } from "@mcv/portfolio/schema";

export const segmentTypeEnum = pgEnum('segment_type', [
  'dynamic',   // Computed in real-time
  'static',    // Manually curated list
  'ml',        // ML-based lookalike/predictive
]);

export const segmentStatusEnum = pgEnum('segment_status', [
  'draft',
  'computing',
  'active',
  'paused',
  'archived',
]);

// Segment definitions
export const segments = pgTable('cdp_segment', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  
  // Identification
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  
  // Type
  type: segmentTypeEnum('type').default('dynamic').notNull(),
  status: segmentStatusEnum('status').default('draft').notNull(),
  
  // Rules (for dynamic segments)
  rules: jsonb('rules').$type<SegmentRules>(),
  
  // For ML segments
  seedSegmentId: text('seed_segment_id'), // Source segment for lookalike
  mlModelId: text('ml_model_id'),
  similarityThreshold: numeric('similarity_threshold', { precision: 5, scale: 4 }),
  
  // Computed stats
  estimatedSize: integer('estimated_size'),
  lastComputedSize: integer('last_computed_size'),
  lastComputedAt: timestamp('last_computed_at'),
  
  // Sync settings
  syncEnabled: boolean('sync_enabled').default(false),
  syncDestinations: jsonb('sync_destinations').$type<string[]>().default([]),
  
  // Metadata
  tags: jsonb('tags').$type<string[]>().default([]),
  createdBy: text('created_by'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  ventureSlugIdx: uniqueIndex('segment_venture_slug_idx').on(t.ventureId, t.slug),
  statusIdx: index('segment_status_idx').on(t.status),
}));

// Segment membership (for caching/static segments)
export const segmentMemberships = pgTable('cdp_segment_membership', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  segmentId: text('segment_id').references(() => segments.id).notNull(),
  profileId: text('profile_id').references(() => profiles.id).notNull(),
  
  // How they entered
  enteredAt: timestamp('entered_at').defaultNow().notNull(),
  entryReason: text('entry_reason'), // 'rule_match', 'manual', 'ml_prediction'
  
  // For ML segments
  score: numeric('score', { precision: 5, scale: 4 }),
  
  // Exit tracking
  exitedAt: timestamp('exited_at'),
  exitReason: text('exit_reason'),
  
  // Snapshot version (for incremental updates)
  snapshotVersion: integer('snapshot_version').default(1),
}, (t) => ({
  segmentProfileIdx: uniqueIndex('membership_segment_profile_idx')
    .on(t.segmentId, t.profileId),
  profileIdx: index('membership_profile_idx').on(t.profileId),
  enteredIdx: index('membership_entered_idx').on(t.enteredAt),
}));

// Segment computation history
export const segmentComputations = pgTable('cdp_segment_computation', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  segmentId: text('segment_id').references(() => segments.id).notNull(),
  
  // Status
  status: text('status').default('running'), // 'running', 'completed', 'failed'
  
  // Results
  previousSize: integer('previous_size'),
  newSize: integer('new_size'),
  added: integer('added'),
  removed: integer('removed'),
  
  // Timing
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),
  
  // Error
  error: text('error'),
});

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
  
  // For segment conditions (include/exclude)
  segmentId?: string;
  
  // Comparison
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains' | 'exists' | 'not_exists' | 'in' | 'not_in';
  value?: unknown;
  
  // For nested conditions
  conditions?: SegmentCondition[];
  nestedOperator?: 'and' | 'or';
}
```

### Segment Builder & Evaluator

```typescript
// @mcv/cdp/segments/service.ts
import { eq, and, or, sql, desc } from 'drizzle-orm';
import { db } from '@mcv/db';
import { segments, segmentMemberships, segmentComputations } from './schema';
import { profiles } from '../profiles/schema';
import { events } from '../events/schema';
import { EventBus } from '@mcv/events';

export interface CreateSegmentInput {
  ventureId: string;
  name: string;
  slug: string;
  description?: string;
  type: 'dynamic' | 'static' | 'ml';
  rules?: SegmentRules;
  tags?: string[];
}

export class SegmentService {
  private eventBus: EventBus;
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }
  
  /**
   * Create a new segment.
   */
  async createSegment(input: CreateSegmentInput): Promise<Segment> {
    const segment = await db.insert(segments).values({
      ventureId: input.ventureId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      type: input.type,
      rules: input.rules,
      tags: input.tags ?? [],
      status: 'draft',
    }).returning().then(r => r[0]);
    
    await this.eventBus.emit('cdp.segment.created', {
      segmentId: segment.id,
      ventureId: input.ventureId,
    });
    
    return segment;
  }
  
  /**
   * Update segment rules.
   */
  async updateRules(segmentId: string, rules: SegmentRules): Promise<Segment> {
    const segment = await db.update(segments)
      .set({
        rules,
        status: 'draft', // Needs recomputation
        updatedAt: new Date(),
      })
      .where(eq(segments.id, segmentId))
      .returning()
      .then(r => r[0]);
    
    return segment;
  }
  
  /**
   * Estimate segment size without full computation.
   */
  async estimateSize(segmentId: string): Promise<number> {
    const segment = await db.query.segments.findFirst({
      where: eq(segments.id, segmentId),
    });
    
    if (!segment || !segment.rules) return 0;
    
    // Build SQL from rules and do a count
    const whereClause = this.buildWhereClause(segment.rules);
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(profiles)
      .where(and(
        eq(profiles.ventureId, segment.ventureId),
        eq(profiles.status, 'active'),
        whereClause
      ));
    
    // Update estimate
    await db.update(segments)
      .set({ estimatedSize: result[0].count })
      .where(eq(segments.id, segmentId));
    
    return result[0].count;
  }
  
  /**
   * Compute segment membership (full refresh).
   */
  async computeSegment(segmentId: string): Promise<ComputationResult> {
    const segment = await db.query.segments.findFirst({
      where: eq(segments.id, segmentId),
    });
    
    if (!segment) throw new NotFoundError('Segment', segmentId);
    
    // Create computation record
    const computation = await db.insert(segmentComputations).values({
      segmentId,
      previousSize: segment.lastComputedSize,
    }).returning().then(r => r[0]);
    
    // Mark segment as computing
    await db.update(segments)
      .set({ status: 'computing' })
      .where(eq(segments.id, segmentId));
    
    const startTime = Date.now();
    
    try {
      if (segment.type === 'dynamic') {
        return this.computeDynamicSegment(segment, computation);
      } else if (segment.type === 'static') {
        // Static segments don't get auto-computed
        return { added: 0, removed: 0, total: segment.lastComputedSize ?? 0 };
      } else if (segment.type === 'ml') {
        return this.computeMLSegment(segment, computation);
      }
      
      throw new Error(`Unknown segment type: ${segment.type}`);
      
    } catch (error) {
      await db.update(segmentComputations)
        .set({
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
          durationMs: Date.now() - startTime,
        })
        .where(eq(segmentComputations.id, computation.id));
      
      await db.update(segments)
        .set({ status: 'draft' })
        .where(eq(segments.id, segmentId));
      
      throw error;
    }
  }
  
  /**
   * Check if a profile is in a segment.
   */
  async isMember(segmentId: string, profileId: string): Promise<boolean> {
    const segment = await db.query.segments.findFirst({
      where: eq(segments.id, segmentId),
    });
    
    if (!segment) return false;
    
    if (segment.type === 'static') {
      // Check membership table
      const membership = await db.query.segmentMemberships.findFirst({
        where: and(
          eq(segmentMemberships.segmentId, segmentId),
          eq(segmentMemberships.profileId, profileId),
          sql`${segmentMemberships.exitedAt} IS NULL`
        ),
      });
      return !!membership;
    }
    
    // For dynamic segments, evaluate rules in real-time
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
    });
    
    if (!profile || !segment.rules) return false;
    
    return this.evaluateRules(profile, segment.rules);
  }
  
  /**
   * Get all segments a profile belongs to.
   */
  async getProfileSegments(profileId: string): Promise<Segment[]> {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
    });
    
    if (!profile) return [];
    
    // Get all active segments for this venture
    const allSegments = await db.select()
      .from(segments)
      .where(and(
        eq(segments.ventureId, profile.ventureId),
        eq(segments.status, 'active')
      ));
    
    const memberSegments: Segment[] = [];
    
    for (const segment of allSegments) {
      if (await this.isMember(segment.id, profileId)) {
        memberSegments.push(segment);
      }
    }
    
    return memberSegments;
  }
  
  /**
   * Add profiles to static segment manually.
   */
  async addToSegment(segmentId: string, profileIds: string[]): Promise<number> {
    const segment = await db.query.segments.findFirst({
      where: eq(segments.id, segmentId),
    });
    
    if (!segment || segment.type !== 'static') {
      throw new Error('Can only manually add to static segments');
    }
    
    let added = 0;
    
    for (const profileId of profileIds) {
      try {
        await db.insert(segmentMemberships).values({
          segmentId,
          profileId,
          entryReason: 'manual',
        });
        added++;
      } catch (e) {
        // Ignore duplicates
      }
    }
    
    // Update segment size
    await this.updateSegmentSize(segmentId);
    
    return added;
  }
  
  /**
   * Remove profiles from static segment.
   */
  async removeFromSegment(segmentId: string, profileIds: string[]): Promise<number> {
    const result = await db.update(segmentMemberships)
      .set({
        exitedAt: new Date(),
        exitReason: 'manual_removal',
      })
      .where(and(
        eq(segmentMemberships.segmentId, segmentId),
        sql`${segmentMemberships.profileId} = ANY(${profileIds})`,
        sql`${segmentMemberships.exitedAt} IS NULL`
      ));
    
    await this.updateSegmentSize(segmentId);
    
    return profileIds.length;
  }
  
  private async computeDynamicSegment(
    segment: Segment,
    computation: SegmentComputation
  ): Promise<ComputationResult> {
    if (!segment.rules) {
      throw new Error('Dynamic segment requires rules');
    }
    
    const whereClause = this.buildWhereClause(segment.rules);
    
    // Get all matching profiles
    const matchingProfiles = await db.select({ id: profiles.id })
      .from(profiles)
      .where(and(
        eq(profiles.ventureId, segment.ventureId),
        eq(profiles.status, 'active'),
        whereClause
      ));
    
    const matchingIds = new Set(matchingProfiles.map(p => p.id));
    
    // Get current members
    const currentMembers = await db.select({ profileId: segmentMemberships.profileId })
      .from(segmentMemberships)
      .where(and(
        eq(segmentMemberships.segmentId, segment.id),
        sql`${segmentMemberships.exitedAt} IS NULL`
      ));
    
    const currentIds = new Set(currentMembers.map(m => m.profileId));
    
    // Determine additions and removals
    const toAdd = [...matchingIds].filter(id => !currentIds.has(id));
    const toRemove = [...currentIds].filter(id => !matchingIds.has(id));
    
    // Batch insert new members
    if (toAdd.length > 0) {
      await db.insert(segmentMemberships).values(
        toAdd.map(profileId => ({
          segmentId: segment.id,
          profileId,
          entryReason: 'rule_match',
        }))
      ).onConflictDoNothing();
    }
    
    // Mark removed members as exited
    if (toRemove.length > 0) {
      await db.update(segmentMemberships)
        .set({
          exitedAt: new Date(),
          exitReason: 'rule_no_longer_match',
        })
        .where(and(
          eq(segmentMemberships.segmentId, segment.id),
          sql`${segmentMemberships.profileId} = ANY(${toRemove})`
        ));
    }
    
    // Update segment
    const newSize = matchingIds.size;
    
    await db.update(segments)
      .set({
        status: 'active',
        lastComputedSize: newSize,
        lastComputedAt: new Date(),
      })
      .where(eq(segments.id, segment.id));
    
    // Update computation record
    await db.update(segmentComputations)
      .set({
        status: 'completed',
        newSize,
        added: toAdd.length,
        removed: toRemove.length,
        completedAt: new Date(),
        durationMs: Date.now() - computation.startedAt.getTime(),
      })
      .where(eq(segmentComputations.id, computation.id));
    
    await this.eventBus.emit('cdp.segment.computed', {
      segmentId: segment.id,
      size: newSize,
      added: toAdd.length,
      removed: toRemove.length,
    });
    
    return {
      added: toAdd.length,
      removed: toRemove.length,
      total: newSize,
    };
  }
  
  private async computeMLSegment(
    segment: Segment,
    computation: SegmentComputation
  ): Promise<ComputationResult> {
    // ML segment computation would call the ML service
    // For now, placeholder
    throw new Error('ML segment computation not implemented');
  }
  
  private buildWhereClause(rules: SegmentRules): SQL {
    const conditions = rules.conditions.map(c => this.buildCondition(c));
    
    if (rules.operator === 'and') {
      return and(...conditions);
    } else {
      return or(...conditions);
    }
  }
  
  private buildCondition(condition: SegmentCondition): SQL {
    if (condition.type === 'trait') {
      return this.buildTraitCondition(condition);
    } else if (condition.type === 'event') {
      return this.buildEventCondition(condition);
    } else if (condition.conditions) {
      // Nested conditions
      const nested = condition.conditions.map(c => this.buildCondition(c));
      return condition.nestedOperator === 'and' ? and(...nested) : or(...nested);
    }
    
    throw new Error(`Unknown condition type: ${condition.type}`);
  }
  
  private buildTraitCondition(condition: SegmentCondition): SQL {
    const path = `${profiles.traits}->>'${condition.traitKey}'`;
    
    switch (condition.operator) {
      case 'eq':
        return sql`${path} = ${String(condition.value)}`;
      case 'ne':
        return sql`${path} != ${String(condition.value)}`;
      case 'gt':
        return sql`(${path})::numeric > ${condition.value}`;
      case 'gte':
        return sql`(${path})::numeric >= ${condition.value}`;
      case 'lt':
        return sql`(${path})::numeric < ${condition.value}`;
      case 'lte':
        return sql`(${path})::numeric <= ${condition.value}`;
      case 'contains':
        return sql`${path} ILIKE ${'%' + condition.value + '%'}`;
      case 'exists':
        return sql`${profiles.traits} ? ${condition.traitKey}`;
      case 'not_exists':
        return sql`NOT (${profiles.traits} ? ${condition.traitKey})`;
      case 'in':
        return sql`${path} = ANY(${condition.value as string[]})`;
      default:
        throw new Error(`Unknown operator: ${condition.operator}`);
    }
  }
  
  private buildEventCondition(condition: SegmentCondition): SQL {
    // Event conditions require a subquery
    const timeframeCondition = condition.timeframe
      ? sql`${events.timestamp} > NOW() - INTERVAL '${condition.timeframe.value} ${condition.timeframe.unit}'`
      : sql`true`;
    
    return sql`EXISTS (
      SELECT 1 FROM ${events}
      WHERE ${events.profileId} = ${profiles.id}
      AND ${events.name} = ${condition.eventName}
      AND ${timeframeCondition}
    )`;
  }
  
  private evaluateRules(profile: Profile, rules: SegmentRules): boolean {
    const results = rules.conditions.map(c => this.evaluateCondition(profile, c));
    
    if (rules.operator === 'and') {
      return results.every(r => r);
    } else {
      return results.some(r => r);
    }
  }
  
  private evaluateCondition(profile: Profile, condition: SegmentCondition): boolean {
    if (condition.type === 'trait') {
      const value = profile.traits?.[condition.traitKey!];
      return this.compareValues(value, condition.operator, condition.value);
    }
    
    // Event conditions would need async lookup - simplified here
    return false;
  }
  
  private compareValues(actual: unknown, operator: string, expected: unknown): boolean {
    switch (operator) {
      case 'eq': return actual === expected;
      case 'ne': return actual !== expected;
      case 'gt': return Number(actual) > Number(expected);
      case 'gte': return Number(actual) >= Number(expected);
      case 'lt': return Number(actual) < Number(expected);
      case 'lte': return Number(actual) <= Number(expected);
      case 'contains': return String(actual).includes(String(expected));
      case 'exists': return actual !== undefined && actual !== null;
      case 'not_exists': return actual === undefined || actual === null;
      case 'in': return Array.isArray(expected) && expected.includes(actual);
      default: return false;
    }
  }
  
  private async updateSegmentSize(segmentId: string): Promise<void> {
    const count = await db.select({ count: sql<number>`count(*)` })
      .from(segmentMemberships)
      .where(and(
        eq(segmentMemberships.segmentId, segmentId),
        sql`${segmentMemberships.exitedAt} IS NULL`
      ));
    
    await db.update(segments)
      .set({
        lastComputedSize: count[0].count,
        lastComputedAt: new Date(),
      })
      .where(eq(segments.id, segmentId));
  }
}

interface ComputationResult {
  added: number;
  removed: number;
  total: number;
}
```

---

## Module: sync

### Purpose

The sync module handles synchronization of CDP data to external destinations like advertising platforms, email providers, CRMs, and data warehouses.

### Database Schema

```typescript
// @mcv/cdp/sync/schema.ts
import { pgTable, text, jsonb, timestamp, boolean, integer, index, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { segments } from '../segments/schema';
import { ventures } from "@mcv/portfolio/schema";

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
  'partial',
]);

// Destination configurations
export const destinations = pgTable('cdp_destination', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  ventureId: text('venture_id').references(() => ventures.id).notNull(),
  
  // Identification
  name: text('name').notNull(),
  type: destinationTypeEnum('type').notNull(),
  
  // Configuration
  config: jsonb('config').$type<DestinationConfig>().notNull(),
  
  // Authentication (encrypted)
  credentials: jsonb('credentials').$type<Record<string, string>>(),
  
  // Mapping
  fieldMappings: jsonb('field_mappings').$type<FieldMapping[]>().default([]),
  
  // Status
  isActive: boolean('is_active').default(true),
  lastTestedAt: timestamp('last_tested_at'),
  lastTestResult: text('last_test_result'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sync configurations (segment → destination)
export const syncConfigs = pgTable('cdp_sync_config', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  
  segmentId: text('segment_id').references(() => segments.id).notNull(),
  destinationId: text('destination_id').references(() => destinations.id).notNull(),
  
  // Sync mode
  mode: text('mode').default('incremental'), // 'full', 'incremental'
  
  // Schedule
  scheduleType: text('schedule_type').default('manual'), // 'manual', 'realtime', 'scheduled'
  cronExpression: text('cron_expression'), // For scheduled
  
  // Settings
  includeTraits: jsonb('include_traits').$type<string[]>(),
  excludeTraits: jsonb('exclude_traits').$type<string[]>(),
  
  // Status
  isActive: boolean('is_active').default(true),
  lastSyncAt: timestamp('last_sync_at'),
  lastSyncStatus: syncStatusEnum('last_sync_status'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  segmentDestIdx: uniqueIndex('sync_segment_dest_idx')
    .on(t.segmentId, t.destinationId),
}));

// Sync job history
export const syncJobs = pgTable('cdp_sync_job', {
  id: text('id').$defaultFn(() => createId()).primaryKey(),
  syncConfigId: text('sync_config_id').references(() => syncConfigs.id).notNull(),
  
  // Status
  status: syncStatusEnum('status').default('pending').notNull(),
  
  // Trigger
  triggeredBy: text('triggered_by').notNull(), // 'schedule', 'manual', 'realtime'
  
  // Progress
  totalRecords: integer('total_records'),
  processedRecords: integer('processed_records').default(0),
  successfulRecords: integer('successful_records').default(0),
  failedRecords: integer('failed_records').default(0),
  
  // Errors
  errors: jsonb('errors').$type<SyncError[]>().default([]),
  
  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  configStatusIdx: index('sync_job_config_status_idx').on(t.syncConfigId, t.status),
  createdAtIdx: index('sync_job_created_idx').on(t.createdAt),
}));

interface DestinationConfig {
  // For ad platforms
  accountId?: string;
  audienceId?: string;
  
  // For email platforms
  listId?: string;
  
  // For warehouses
  dataset?: string;
  table?: string;
  
  // For webhooks
  url?: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  
  // Common
  batchSize?: number;
  retryAttempts?: number;
}

interface FieldMapping {
  sourceField: string;    // CDP field (trait key)
  destField: string;      // Destination field
  transform?: 'hash' | 'lowercase' | 'uppercase' | 'phone_e164';
}

interface SyncError {
  profileId: string;
  error: string;
  timestamp: string;
}
```

### Sync Orchestrator

```typescript
// @mcv/cdp/sync/orchestrator.ts
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@mcv/db';
import { destinations, syncConfigs, syncJobs } from './schema';
import { segmentMemberships } from '../segments/schema';
import { profiles } from '../profiles/schema';
import { EventBus } from '@mcv/events';

export class SyncOrchestrator {
  private adapters: Map<string, DestinationAdapter> = new Map();
  private eventBus: EventBus;
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.registerBuiltInAdapters();
  }
  
  /**
   * Trigger a sync job.
   */
  async triggerSync(
    syncConfigId: string,
    triggeredBy: 'schedule' | 'manual' | 'realtime'
  ): Promise<SyncJob> {
    const config = await db.query.syncConfigs.findFirst({
      where: eq(syncConfigs.id, syncConfigId),
      with: {
        segment: true,
        destination: true,
      },
    });
    
    if (!config) throw new NotFoundError('SyncConfig', syncConfigId);
    if (!config.isActive) throw new Error('Sync config is not active');
    
    // Get adapter
    const adapter = this.adapters.get(config.destination.type);
    if (!adapter) throw new Error(`No adapter for destination type: ${config.destination.type}`);
    
    // Create job
    const job = await db.insert(syncJobs).values({
      syncConfigId,
      triggeredBy,
      status: 'running',
      startedAt: new Date(),
    }).returning().then(r => r[0]);
    
    // Run sync asynchronously
    this.executeSyncJob(job, config, adapter).catch(error => {
      console.error('Sync job failed:', error);
    });
    
    return job;
  }
  
  /**
   * Execute the sync job.
   */
  private async executeSyncJob(
    job: SyncJob,
    config: SyncConfigWithRelations,
    adapter: DestinationAdapter
  ): Promise<void> {
    const errors: SyncError[] = [];
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    try {
      // Get segment members with their profile data
      const members = await db.select({
        profileId: segmentMemberships.profileId,
        profile: profiles,
      })
      .from(segmentMemberships)
      .innerJoin(profiles, eq(segmentMemberships.profileId, profiles.id))
      .where(and(
        eq(segmentMemberships.segmentId, config.segmentId),
        sql`${segmentMemberships.exitedAt} IS NULL`
      ));
      
      // Update total count
      await db.update(syncJobs)
        .set({ totalRecords: members.length })
        .where(eq(syncJobs.id, job.id));
      
      // Process in batches
      const batchSize = config.destination.config?.batchSize ?? 100;
      
      for (let i = 0; i < members.length; i += batchSize) {
        const batch = members.slice(i, i + batchSize);
        
        // Transform data according to field mappings
        const transformedBatch = batch.map(m => 
          this.transformProfile(m.profile, config.destination.fieldMappings ?? [])
        );
        
        try {
          await adapter.sync(config.destination, transformedBatch);
          successful += batch.length;
        } catch (error) {
          // Try individual records
          for (const record of transformedBatch) {
            try {
              await adapter.sync(config.destination, [record]);
              successful++;
            } catch (recordError) {
              failed++;
              errors.push({
                profileId: record.__profileId,
                error: recordError.message,
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
        
        processed += batch.length;
        
        // Update progress
        await db.update(syncJobs)
          .set({
            processedRecords: processed,
            successfulRecords: successful,
            failedRecords: failed,
          })
          .where(eq(syncJobs.id, job.id));
      }
      
      // Mark complete
      await db.update(syncJobs)
        .set({
          status: failed > 0 ? 'partial' : 'completed',
          processedRecords: processed,
          successfulRecords: successful,
          failedRecords: failed,
          errors,
          completedAt: new Date(),
        })
        .where(eq(syncJobs.id, job.id));
      
      // Update sync config
      await db.update(syncConfigs)
        .set({
          lastSyncAt: new Date(),
          lastSyncStatus: failed > 0 ? 'partial' : 'completed',
        })
        .where(eq(syncConfigs.id, config.id));
      
      await this.eventBus.emit('cdp.sync.completed', {
        jobId: job.id,
        syncConfigId: config.id,
        successful,
        failed,
      });
      
    } catch (error) {
      await db.update(syncJobs)
        .set({
          status: 'failed',
          errors: [{ profileId: '', error: error.message, timestamp: new Date().toISOString() }],
          completedAt: new Date(),
        })
        .where(eq(syncJobs.id, job.id));
      
      await db.update(syncConfigs)
        .set({ lastSyncStatus: 'failed' })
        .where(eq(syncConfigs.id, config.id));
      
      throw error;
    }
  }
  
  /**
   * Test a destination connection.
   */
  async testDestination(destinationId: string): Promise<{ success: boolean; message: string }> {
    const destination = await db.query.destinations.findFirst({
      where: eq(destinations.id, destinationId),
    });
    
    if (!destination) throw new NotFoundError('Destination', destinationId);
    
    const adapter = this.adapters.get(destination.type);
    if (!adapter) {
      return { success: false, message: `No adapter for type: ${destination.type}` };
    }
    
    try {
      await adapter.test(destination);
      
      await db.update(destinations)
        .set({
          lastTestedAt: new Date(),
          lastTestResult: 'success',
        })
        .where(eq(destinations.id, destinationId));
      
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      await db.update(destinations)
        .set({
          lastTestedAt: new Date(),
          lastTestResult: error.message,
        })
        .where(eq(destinations.id, destinationId));
      
      return { success: false, message: error.message };
    }
  }
  
  private transformProfile(
    profile: Profile,
    mappings: FieldMapping[]
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {
      __profileId: profile.id,
    };
    
    for (const mapping of mappings) {
      let value = this.getNestedValue(profile, mapping.sourceField);
      
      if (value !== undefined && mapping.transform) {
        value = this.applyTransform(value, mapping.transform);
      }
      
      result[mapping.destField] = value;
    }
    
    return result;
  }
  
  private getNestedValue(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    
    return current;
  }
  
  private applyTransform(value: unknown, transform: string): unknown {
    switch (transform) {
      case 'hash':
        return require('crypto')
          .createHash('sha256')
          .update(String(value).toLowerCase().trim())
          .digest('hex');
      case 'lowercase':
        return String(value).toLowerCase();
      case 'uppercase':
        return String(value).toUpperCase();
      case 'phone_e164':
        // Normalize phone to E.164
        return String(value).replace(/\D/g, '').replace(/^(\d)/, '+$1');
      default:
        return value;
    }
  }
  
  private registerBuiltInAdapters(): void {
    this.adapters.set('webhook', new WebhookAdapter());
    this.adapters.set('facebook_ads', new FacebookAdsAdapter());
    this.adapters.set('google_ads', new GoogleAdsAdapter());
    // ... register other adapters
  }
}

// Adapter interface
interface DestinationAdapter {
  test(destination: Destination): Promise<void>;
  sync(destination: Destination, records: Record<string, unknown>[]): Promise<void>;
}

// Example webhook adapter
class WebhookAdapter implements DestinationAdapter {
  async test(destination: Destination): Promise<void> {
    const response = await fetch(destination.config.url!, {
      method: 'HEAD',
      headers: destination.config.headers,
    });
    
    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }
  }
  
  async sync(
    destination: Destination,
    records: Record<string, unknown>[]
  ): Promise<void> {
    const response = await fetch(destination.config.url!, {
      method: destination.config.method ?? 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...destination.config.headers,
      },
      body: JSON.stringify({ records }),
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${await response.text()}`);
    }
  }
}
```