# @mcv/cdp/identity-graph — Cross-Platform Identity Resolution

**Parent Package:** @mcv/cdp  
**Tier:** 5 (Domain Layer — MCV-Only)  
**Classification:** INTERNAL (MCV-Only — Never Published)  
**Last Updated:** February 9, 2026

---

## Purpose

The `identity-graph` submodule handles cross-platform identity resolution — the core algorithm that enables a single person to be recognized across all 9 MCV ventures and every touchpoint (web, mobile, blockchain, email, support, commerce, gaming). It maintains a directed graph of identifier nodes (email, phone, device ID, wallet address, social IDs, advertising IDs) connected by co-occurrence edges, and resolves them to unified profiles.

**This is the brain of the CDP. Without identity resolution, every anonymous session and every cross-device interaction would be a disconnected data point.**

The identity graph enables:

- **Cross-device linking** — A user on their iPhone, MacBook, and office desktop is recognized as one person via shared login events
- **Cross-venture unification** — The same email used on BetEdge and SerpSpace resolves to the same profile
- **Anonymous-to-identified stitching** — When a user logs in, all prior anonymous events are retroactively attributed to their profile
- **Blockchain identity** — Wallet addresses are first-class identity nodes, enabling DeFi users on FutureState to be linked to their email accounts
- **Configurable merge policies** — Per-venture resolution rules control auto-merge thresholds, required confidence levels, and whether merges need human review
- **Probabilistic scoring** — Edge strength and confidence scores enable sophisticated matching without false positives

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SERVER — CORE IDENTITY GRAPH OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  IdentityGraph,             // Graph of identifiers → profiles
  IdentityResolver,          // Resolve multiple identifiers to one profile
  AliasManager,              // Manage email/phone/device/wallet aliases
} from './service';

// Resolution operations
export {
  resolve,                   // Resolve identifiers to profile ID
  linkIdentities,            // Link co-occurring identifiers
  associateWithProfile,      // Bind identifiers to a profile
  getProfileGraph,           // Get full identity graph for a profile
  triggerMerge,              // Request profile merge
} from './resolver';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT — REACT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export { useIdentityGraph } from './client/hooks/use-identity-graph';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT — REACT COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export { IdentityGraphVisualization } from './client/components/identity-graph-viz';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  IDENTITY_TYPES,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  IdentityNode,
  IdentityEdge,
  IdentityGraphView,
  IdentityResolutionInput,
  ResolutionResult,
  IdentitySource,
  ResolutionRule,
  IdentityType,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          IDENTITY RESOLUTION ARCHITECTURE                                │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              INBOUND SIGNALS                                         │ │
│  │                                                                                      │ │
│  │  track() → email + deviceId    identify() → userId + anonymousId                    │ │
│  │  page() → cookie + sessionId   login → email + userId + wallet                      │ │
│  │                                                                                      │ │
│  └─────────────────────────────────────┬───────────────────────────────────────────────┘ │
│                                        │                                                 │
│                                        ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              IDENTITY GRAPH ENGINE                                   │ │
│  │                                                                                      │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                       │ │
│  │  │  IdentityGraph  │  │IdentityResolver │  │  AliasManager   │                       │ │
│  │  │                 │  │                 │  │                 │                       │ │
│  │  │ • upsertNode    │  │ • resolve()     │  │ • addAlias      │                       │ │
│  │  │ • upsertEdge    │  │ • findNodes     │  │ • removeAlias   │                       │ │
│  │  │ • getGraph      │  │ • rankProfiles  │  │ • verifyAlias   │                       │ │
│  │  │ • hashValue     │  │ • shouldMerge   │  │ • hashValue     │                       │ │
│  │  └────────┬────────┘  └────────┬────────┘  └─────────────────┘                       │ │
│  │           │                    │                                                      │ │
│  │           ▼                    ▼                                                      │ │
│  │  ┌────────────────────────────────────────────┐                                      │ │
│  │  │          RESOLUTION RULES ENGINE           │                                      │ │
│  │  │                                            │                                      │ │
│  │  │  Per-venture policies:                     │                                      │ │
│  │  │  • Min confidence threshold                │                                      │ │
│  │  │  • Required identity types for auto-merge  │                                      │ │
│  │  │  • Human review requirements               │                                      │ │
│  │  │  • Priority ordering                       │                                      │ │
│  │  └────────────────────────────────────────────┘                                      │ │
│  │                                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                        │                                                 │
│                                        ▼                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              DATA LAYER (PostgreSQL)                                 │ │
│  │                                                                                      │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                    │ │
│  │  │ cdp_identity_node│  │ cdp_identity_edge│  │cdp_resolution_   │                    │ │
│  │  │                  │  │                  │  │      rule        │                    │ │
│  │  │ • type           │  │ • sourceNodeId   │  │ • identityTypes  │                    │ │
│  │  │ • value/hash     │  │ • targetNodeId   │  │ • minConfidence  │                    │ │
│  │  │ • profileId      │  │ • strength       │  │ • action         │                    │ │
│  │  │ • occurrences    │  │ • confidence     │  │ • requiresReview │                    │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘                    │ │
│  │                                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────────────────────┘ │
│                                        │                                                 │
│                              Merge Events                                                │
│                                        ▼                                                 │
│                              ProfileService.mergeProfiles()                              │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Resolution Algorithm Flow

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

### Identity Node Type Hierarchy

```
                    ┌──────────────────┐
                    │   IDENTITY NODE  │
                    │     TYPES        │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    HIGH TRUST         MEDIUM TRUST         LOW TRUST
    (Deterministic)    (Semi-Deterministic) (Probabilistic)
         │                   │                   │
    ┌────┤              ┌────┤              ┌────┤
    │    │              │    │              │    │
  email  user_id     phone  wallet       cookie  device_id
    │                   │                   │
  social            advertising          (session)
  (OAuth)           (GAID/IDFA)
```

| Identity Type | Trust Level | Description | Example |
|--------------|-------------|-------------|---------|
| `email` | High | Email address (canonical, lowercased) | `jordan@example.com` |
| `user_id` | High | Authenticated user ID from auth system | `user-7x9k2` |
| `phone` | High | Phone number (E.164 normalized) | `+15551234567` |
| `wallet` | Medium | Blockchain wallet address | `0x742d35Cc...` |
| `social` | Medium | OAuth provider ID (Facebook, Google, etc.) | `fb:1234567890` |
| `device_id` | Medium | Mobile device fingerprint | `ios:A1B2C3D4` |
| `advertising` | Low | Ad platform ID (GAID, IDFA) | `gaid:5e6f7a8b` |
| `cookie` | Low | Browser cookie identifier | `ga_12345678` |
| `custom` | Variable | Venture-specific custom identifier | `betedge:player_id:789` |

---

## Core Types

### Identity Resolution Input

```typescript
interface IdentityResolutionInput {
  ventureId: string;                   // Required: venture scope
  email?: string;                      // Email address
  phone?: string;                      // Phone number
  userId?: string;                     // Auth user ID
  deviceId?: string;                   // Device fingerprint
  walletAddress?: string;              // Blockchain wallet
  sessionId?: string;                  // Session identifier (for co-occurrence)
  customIds?: Record<string, string>;  // Venture-specific identifiers
}
```

### Resolution Result

```typescript
interface ResolutionResult {
  profileId: string | null;            // Resolved profile ID (null if new)
  confidence: number;                  // Overall confidence score (0.0 – 1.0)
  matchedIdentities: Array<{          // Which identifiers matched
    type: string;
    value: string;
  }>;
  isNewProfile: boolean;               // Whether this is a new (unresolved) visitor
}
```

### Identity Graph View

```typescript
interface IdentityGraphView {
  profileId: string;                   // Owner profile
  nodes: Array<{
    id: string;                        // Node CUID2
    type: string;                      // Identity type (email, phone, wallet, etc.)
    value: string;                     // Raw value (masked for PII in API responses)
    firstSeen: Date;                   // When this identifier was first observed
    lastSeen: Date;                    // Most recent observation
    occurrences: number;               // Total co-occurrence count
  }>;
  edges: Array<{
    source: string;                    // Source node ID
    target: string;                    // Target node ID
    strength: number;                  // Co-occurrence count (weight)
    confidence: number;                // Confidence score (0.0 – 1.0)
    linkType: string;                  // How they were linked
  }>;
}
```

### Identity Source

```typescript
interface IdentitySource {
  type: 'web' | 'mobile' | 'api' | 'import' | 'enrichment';
  name: string;                        // Source name (e.g., 'BetEdge Web SDK')
  timestamp: string;                   // ISO 8601 timestamp
  eventId?: string;                    // Originating event ID
  sessionId?: string;                  // Session in which this was observed
}
```

### Resolution Rule

```typescript
interface ResolutionRule {
  id: string;
  ventureId: string;
  name: string;                        // Human-readable rule name
  description: string | null;
  priority: number;                    // Higher = evaluated first (default: 100)
  identityTypes: string[];             // Required identity types (e.g., ['email', 'phone'])
  minConfidence: number;               // Minimum confidence for auto-action (default: 0.8)
  minOccurrences: number;              // Minimum co-occurrences required (default: 1)
  action: 'merge' | 'link' | 'ignore'; // What to do when conditions are met
  requiresReview: boolean;             // Whether to flag for human review instead of auto-acting
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Database Schema

```typescript
// @mcv/cdp/identity-graph/schema.ts
import {
  pgTable, text, jsonb, timestamp, numeric, integer,
  boolean, index, uniqueIndex, pgEnum,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { profiles } from '../profiles/schema';
import { ventures } from '@mcv/portfolio/schema';

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

### Database Table Summary

| Table | Description | Est. Rows | Notes |
|-------|-------------|-----------|-------|
| `cdp_identity_node` | Identity graph nodes (one per identifier) | 5M+ | Unique on (venture, type, valueHash) |
| `cdp_identity_edge` | Co-occurrence edges between identity nodes | 10M+ | Unique on (source, target) |
| `cdp_resolution_rule` | Per-venture auto-merge/link policies | 100+ | Priority-ordered evaluation |

### Edge Link Types

| Link Type | Description | Confidence | Example |
|-----------|-------------|------------|---------|
| `same_event` | Two identifiers appeared in the same event | 1.0 | email + userId in `identify()` call |
| `same_session` | Two identifiers appeared in the same session | 0.9 | deviceId + cookie in same browsing session |
| `explicit` | Explicitly linked via API or user action | 1.0 | User linked wallet in account settings |
| `inferred` | Linked via heuristic or ML model | 0.5–0.8 | Same IP + browser fingerprint pattern |

---

## IdentityGraph Service

```typescript
// @mcv/cdp/identity-graph/service.ts
import { eq, and, or, sql } from 'drizzle-orm';
import { db } from '@mcv/db';
import { identityNodes, identityEdges, resolutionRules } from './schema';
import { profiles } from '../profiles/schema';
import { EventBus } from '@mcv/events';

export class IdentityGraph {
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Resolve one or more identifiers to a single profile.
   *
   * Algorithm:
   * 1. Collect all identifiers from input
   * 2. Hash and find matching nodes in cdp_identity_node
   * 3. Collect profile IDs associated with matching nodes
   * 4. If 0 profiles → return null (new profile needed)
   * 5. If 1 profile → return it with confidence 1.0
   * 6. If N profiles → check resolution rules for auto-merge
   * 7. Return highest-confidence profile
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

    // 4. Multiple profiles found — check merge rules
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
   * Link co-occurring identifiers (e.g., email + device in same session).
   *
   * Creates nodes for all identifiers (if not existing) and creates edges
   * between every pair of identifiers. Edge strength is incremented on
   * each subsequent co-occurrence.
   */
  async linkIdentities(
    ventureId: string,
    identifiers: Array<{ type: string; value: string }>,
    linkType: string
  ): Promise<void> {
    // 1. Ensure all nodes exist
    const nodes: IdentityNodeRecord[] = [];
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
   * Associate identifiers with a resolved profile.
   *
   * For each identifier:
   * 1. Upsert the identity node
   * 2. If the node is already associated with a DIFFERENT profile → trigger merge check
   * 3. Otherwise, set the profileId on the node
   */
  async associateWithProfile(
    ventureId: string,
    profileId: string,
    identifiers: Array<{ type: string; value: string }>
  ): Promise<void> {
    for (const id of identifiers) {
      const node = await this.upsertNode(ventureId, id.type, id.value);

      if (node.profileId && node.profileId !== profileId) {
        // Already associated with different profile — trigger merge check
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
   * Get the complete identity graph visualization for a profile.
   *
   * Returns all identity nodes associated with the profile and all edges
   * connecting those nodes. Used for the IdentityGraphVisualization component.
   */
  async getProfileGraph(profileId: string): Promise<IdentityGraphView> {
    // Get all nodes for this profile
    const nodes = await db.select()
      .from(identityNodes)
      .where(eq(identityNodes.profileId, profileId));

    // Get all edges between these nodes
    const nodeIds = nodes.map(n => n.id);
    const edges = nodeIds.length > 0
      ? await db.select()
          .from(identityEdges)
          .where(
            or(
              sql`${identityEdges.sourceNodeId} = ANY(${nodeIds})`,
              sql`${identityEdges.targetNodeId} = ANY(${nodeIds})`
            )
          )
      : [];

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
   * Emits cdp.merge.requested event for ProfileService to handle.
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

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private collectIdentifiers(
    input: IdentityResolutionInput
  ): Array<{ type: string; value: string }> {
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
  ): Promise<IdentityNodeRecord[]> {
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
  ): Promise<IdentityNodeRecord> {
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
    nodes: IdentityNodeRecord[]
  ): Promise<{
    merge: boolean;
    primaryId?: string;
    secondaryIds?: string[];
    confidence: number;
  }> {
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
    nodes: IdentityNodeRecord[]
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

// Internal record type (matches DB row)
interface IdentityNodeRecord {
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
```

---

## React Hooks

### useIdentityGraph (Graph Visualization)

```tsx
import { useIdentityGraph } from '@mcv/cdp/identity-graph';

function IdentityExplorer({ profileId }: { profileId: string }) {
  const { data: graph, isLoading, error } = useIdentityGraph(profileId);

  if (isLoading) return <Skeleton />;
  if (!graph) return <EmptyState message="No identity data" />;

  return (
    <Card>
      <h3>Identity Graph ({graph.nodes.length} identifiers)</h3>

      <IdentityGraphVisualization
        nodes={graph.nodes}
        edges={graph.edges}
        onNodeClick={(node) => console.log('Selected:', node.type, node.value)}
      />

      <IdentityList>
        {graph.nodes.map((node) => (
          <IdentityItem key={node.id}>
            <Badge>{node.type}</Badge>
            <span>{maskPII(node.value, node.type)}</span>
            <span className="muted">
              {node.occurrences} occurrences · Last seen {formatRelative(node.lastSeen)}
            </span>
          </IdentityItem>
        ))}
      </IdentityList>
    </Card>
  );
}
```

---

## Usage Examples

### Example 1: Basic Identity Resolution

```typescript
import { IdentityGraph } from '@mcv/cdp';

const identityGraph = new IdentityGraph(eventBus);

// ═══════════════════════════════════════════════════════════════════════════════
// Resolve a returning user by email
// ═══════════════════════════════════════════════════════════════════════════════

const result = await identityGraph.resolve({
  ventureId: 'betedge-venture-uuid',
  email: 'jordan@example.com',
});

console.log(result);
// {
//   profileId: 'profile-xyz',
//   confidence: 1.0,
//   matchedIdentities: [{ type: 'email', value: 'jordan@example.com' }],
//   isNewProfile: false,
// }
```

### Example 2: Multi-Identifier Resolution with Auto-Merge

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Resolve with multiple identifiers that span two profiles
// ═══════════════════════════════════════════════════════════════════════════════

const result = await identityGraph.resolve({
  ventureId: 'betedge-venture-uuid',
  email: 'jordan@example.com',       // → profile_1
  walletAddress: '0xABC123...',      // → profile_2
  deviceId: 'iphone-xyz',           // → profile_1
});

// Resolution rules detect email + wallet match → auto-merge triggered
console.log(result);
// {
//   profileId: 'profile_1',      // Winner (had more events)
//   confidence: 0.95,
//   matchedIdentities: [
//     { type: 'email', value: 'jordan@example.com' },
//     { type: 'wallet', value: '0xABC123...' },
//     { type: 'device_id', value: 'iphone-xyz' },
//   ],
//   isNewProfile: false,
// }
```

### Example 3: Link Co-Occurring Identifiers

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Link identifiers that appeared in the same session
// ═══════════════════════════════════════════════════════════════════════════════

await identityGraph.linkIdentities(
  'betedge-venture-uuid',
  [
    { type: 'email', value: 'jordan@example.com' },
    { type: 'device_id', value: 'iphone-abc-123' },
    { type: 'cookie', value: 'ga_session_456' },
  ],
  'same_session'
);

// Creates nodes for all three identifiers (if not existing)
// Creates edges: email↔device, email↔cookie, device↔cookie
// Each edge has strength=1 on first occurrence, incremented thereafter
```

### Example 4: Explore a Profile's Identity Graph

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

### Example 5: Configure Resolution Rules

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Create a resolution rule for BetEdge: auto-merge on email + wallet match
// ═══════════════════════════════════════════════════════════════════════════════

await db.insert(resolutionRules).values({
  ventureId: 'betedge-venture-uuid',
  name: 'Email + Wallet Auto-Merge',
  description: 'Auto-merge profiles when same email and wallet are detected',
  priority: 200,                       // High priority — evaluated early
  identityTypes: ['email', 'wallet'],
  minConfidence: 0.9,
  minOccurrences: 2,                   // Must co-occur at least twice
  action: 'merge',
  requiresReview: false,               // Fully automatic
});

// ═══════════════════════════════════════════════════════════════════════════════
// Create a rule that requires human review for device-only matches
// ═══════════════════════════════════════════════════════════════════════════════

await db.insert(resolutionRules).values({
  ventureId: 'betedge-venture-uuid',
  name: 'Device Match (Review Required)',
  description: 'Flag device-only matches for human review',
  priority: 50,                        // Lower priority
  identityTypes: ['device_id', 'cookie'],
  minConfidence: 0.7,
  minOccurrences: 5,                   // Need many co-occurrences
  action: 'merge',
  requiresReview: true,                // Needs human approval
});
```

### Example 6: Associate Identifiers After Login

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// User logs in — associate all session identifiers with their profile
// ═══════════════════════════════════════════════════════════════════════════════

await identityGraph.associateWithProfile(
  'betedge-venture-uuid',
  'profile-xyz',
  [
    { type: 'email', value: 'jordan@example.com' },
    { type: 'user_id', value: 'user-7x9k2' },
    { type: 'device_id', value: 'iphone-abc-123' },
    { type: 'wallet', value: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD47' },
  ]
);

// Each identifier node now has profileId = 'profile-xyz'
// If any identifier was associated with a DIFFERENT profile,
// a merge candidate event is emitted
```

### Example 7: New Visitor (No Resolution)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// First-time visitor — no existing identity found
// ═══════════════════════════════════════════════════════════════════════════════

const result = await identityGraph.resolve({
  ventureId: 'betedge-venture-uuid',
  deviceId: 'brand-new-device-xyz',
});

console.log(result);
// {
//   profileId: null,          // No match found
//   confidence: 0,
//   matchedIdentities: [],
//   isNewProfile: true,       // Caller should create a new anonymous profile
// }
```

---

## Error Codes

| Code | Name | Description | HTTP |
|------|------|-------------|------|
| `CDP_IDENTITY_CONFLICT` | Identity Conflict | Identity value already associated with another profile (merge candidate emitted) | 409 |
| `CDP_IDENTITY_LIMIT` | Alias Limit | Profile has reached max alias count (50 per profile) | 429 |
| `CDP_VENTURE_REQUIRED` | Venture Required | ventureId is required for all identity operations | 400 |
| `CDP_UNAUTHORIZED` | Unauthorized | Insufficient permissions for this operation | 403 |
| `CDP_RATE_LIMITED` | Rate Limited | Too many resolution requests; try again later | 429 |

---

## Security Considerations

### Identity Security

- **Value hashing**: All identity values (emails, phones, wallets) hashed with SHA-256 before storage in `valueHash` column
- **PII storage**: Raw `value` field is encrypted at rest with venture-specific encryption keys
- **Brute-force protection**: Rate limiting on identity resolution endpoints (100 req/s per venture)
- **Merge audit trail**: Every auto-merge and manual merge is logged with full conflict resolution details for forensic review
- **Suppression cascade**: When a profile is suppressed, all identity nodes for that profile have their `value` field cleared

### Access Control

- **Venture isolation**: All identity nodes are scoped by `ventureId`; cross-venture resolution requires explicit admin permission
- **Row-Level Security (RLS)**: Postgres RLS policies enforce venture isolation at the database level
- **Resolution rule management**: Creating/modifying resolution rules requires `cdp:admin` permission
- **Graph visualization**: PII values are masked in API responses (e.g., `j***@example.com`)

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `cdp.identity.linked` | system | Two identifiers linked via co-occurrence |
| `cdp.identity.resolved` | system | Identifiers resolved to a profile |
| `cdp.merge.requested` | system | Profile merge requested by identity resolution |
| `cdp.merge.candidate` | system | Potential merge detected (needs review) |

---

## Performance Considerations

| Operation | Target Latency | P99 | Strategy |
|-----------|---------------|-----|----------|
| `resolve()` — identity resolution | < 30ms | < 100ms | Hash index lookup on valueHash |
| `linkIdentities()` — 3 identifiers | < 50ms | < 150ms | Batched node upsert + edge creation |
| `associateWithProfile()` | < 40ms | < 120ms | Node update with merge check |
| `getProfileGraph()` | < 30ms | < 100ms | Index on profileId |

### Optimization Strategies

1. **SHA-256 hash index** — Constant-time lookups on `valueHash` without scanning PII values
2. **Edge deduplication** — `uniqueIndex('edge_unique_idx')` prevents duplicate edges; strength is incremented atomically
3. **Node occurrence counting** — `occurrenceCount` updated atomically via `sql` increment, not read-modify-write
4. **Redis cache** — Identity resolution results are cached in Redis for 5 minutes (configurable via `CDP_IDENTITY_CACHE_TTL_SECONDS`)
5. **Batch node creation** — `linkIdentities()` creates all nodes first, then all edges in a single transaction

---

## Environment Variables

```bash
CDP_IDENTITY_AUTO_MERGE=true                     # Enable automatic profile merging
CDP_IDENTITY_MIN_CONFIDENCE=0.8                  # Min confidence for auto-merge
CDP_IDENTITY_HASH_ALGORITHM=sha256               # Hash algorithm for values
CDP_IDENTITY_CACHE_TTL_SECONDS=300               # Redis cache TTL for lookups
CDP_IDENTITY_MAX_ALIASES_PER_PROFILE=50          # Safety limit
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| drizzle-orm | ^0.29.x | Database ORM (Postgres) |
| @paralleldrive/cuid2 | ^2.x | Collision-resistant unique IDs |
| crypto (built-in) | — | SHA-256 hashing for identity values |
| ioredis | ^5.x | Identity resolution cache |
| @mcv/cdp/profiles | workspace | Profile schema references |
| @mcv/events | workspace | Internal event bus for merge events |
| @mcv/db | workspace | Shared database connection |
| @mcv/portfolio | workspace | Venture schema references |

---

## Testing Notes

```typescript
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

  it('should increment edge strength on co-occurrence', async () => {
    // Link same identifiers twice
    await identityGraph.linkIdentities('test', [
      { type: 'email', value: 'test@example.com' },
      { type: 'device_id', value: 'device-123' },
    ], 'same_session');

    await identityGraph.linkIdentities('test', [
      { type: 'email', value: 'test@example.com' },
      { type: 'device_id', value: 'device-123' },
    ], 'same_session');

    const graph = await identityGraph.getProfileGraph('profile-id');
    const edge = graph.edges[0];
    expect(edge.strength).toBe(2);
  });
});
```

---

*@mcv/cdp/identity-graph — Cross-Platform Identity Resolution Module*
