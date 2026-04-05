# @mcv/cdp — API Reference
## Tier 5: MCV-Only Domains

**Package:** `@mcv/cdp`  
**Classification:** INTERNAL (MCV-Only)  
**API Version:** 1.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Service Methods](#service-methods)
   - [Events](#events-service)
   - [Identity Graph](#identity-graph-service)
   - [Profiles](#profiles-service)
   - [Segments](#segments-service)
   - [Sync](#sync-service)
   - [Traits](#traits-service)
3. [Type Definitions](#type-definitions)
4. [Zod Schemas](#zod-schemas)
5. [Event Types](#event-types)
6. [Error Codes](#error-codes)
7. [Config Reference](#config-reference)

---

## API Overview

The `@mcv/cdp` package exposes its functionality through six service classes, each corresponding to a submodule. All services follow these conventions:

- **Authentication:** All methods require a valid venture context (`ventureId`) and authenticated user session
- **Validation:** All inputs are validated via Zod schemas before processing
- **Error Handling:** Methods throw typed errors (see [Error Codes](#error-codes))
- **Transactions:** Multi-step operations use database transactions for atomicity
- **Events:** State-changing operations emit events via the internal event bus

### Import Patterns

```typescript
// Service classes
import {
  EventCollector,
  IdentityGraph,
  ProfileService,
  SegmentService,
  SyncOrchestrator,
  TraitEngine,
} from '@mcv/cdp';

// Individual operations (tree-shakeable)
import { track, trackBatch, identify, page, queryEvents } from '@mcv/cdp';
import { resolve, linkIdentities, getProfileGraph } from '@mcv/cdp';
import { getProfile, searchProfiles, suppressProfile } from '@mcv/cdp';
import { createSegment, evaluateSegment, getMembers } from '@mcv/cdp';
import { triggerSync, testDestination, getSyncHistory } from '@mcv/cdp';
import { defineTrait, computeTrait, getTraitValues } from '@mcv/cdp';

// React hooks
import { useProfile, useSegmentBuilder, useSyncDashboard } from '@mcv/cdp';

// React components
import { ProfileCard, SegmentBuilderUI, SyncDashboard } from '@mcv/cdp';

// Types
import type { Profile, CDPEvent, Segment, TraitDefinition } from '@mcv/cdp';

// Constants
import { EVENT_CATEGORIES, TRAIT_TYPES, SEGMENT_TYPES } from '@mcv/cdp';
```

### Service Initialization

All services require dependency injection of shared infrastructure:

```typescript
import { EventBus } from '@mcv/kernel/events';
import { db } from '@mcv/db';

// Create shared event bus
const eventBus = new EventBus();

// Initialize services (order matters — identity graph first)
const identityGraph = new IdentityGraph(eventBus);
const traitEngine = new TraitEngine(eventBus);
const profileService = new ProfileService({ identityGraph, traitEngine, eventBus });
const eventCollector = new EventCollector({ identityGraph, traitEngine, eventBus });
const segmentService = new SegmentService(eventBus);
const syncOrchestrator = new SyncOrchestrator(eventBus);
```

---

## Service Methods

### Events Service

The `EventCollector` class handles high-volume behavioral event ingestion, deduplication, enrichment, and routing.

---

#### `track(input: TrackEventInput): Promise<TrackEventResult>`

Track a single behavioral event. This is the primary event ingestion method.

**Pipeline:** Validate → Deduplicate → Enrich context → Resolve identity → Persist → Update profile stats → Trigger trait computation → Emit event.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `profileId` | `string` | — | Known profile ID (if available) |
| `anonymousId` | `string` | — | Anonymous device/session ID (required if no profileId) |
| `category` | `EventCategory` | ✅ | Event category: `'page'`, `'track'`, `'identify'`, `'screen'`, `'group'`, `'alias'` |
| `name` | `string` | ✅ | Event name (e.g., `'Bet Placed'`, `'Order Completed'`) |
| `properties` | `Record<string, unknown>` | — | Event-specific data payload |
| `context` | `EventContext` | — | Device, browser, location, campaign context |
| `timestamp` | `Date` | — | When event occurred (defaults to now) |
| `source` | `string` | ✅ | Event source: `'web'`, `'mobile'`, `'server'`, `'import'` |
| `sourceId` | `string` | — | SDK instance identifier |
| `messageId` | `string` | — | Client-generated UUID for deduplication |
| `revenue` | `number` | — | Revenue amount (extracted for LTV tracking) |
| `currency` | `string` | — | Revenue currency code (default: `'USD'`) |

**Returns:**

```typescript
interface TrackEventResult {
  eventId: string;         // Generated event ID
  profileId: string | null; // Resolved profile ID (null if unresolvable)
  isDuplicate: boolean;    // True if messageId already seen
}
```

**Example:**

```typescript
const result = await eventCollector.track({
  ventureId: 'betedge-venture-uuid',
  profileId: 'profile-xyz',
  category: 'track',
  name: 'Bet Placed',
  properties: {
    betId: 'bet-123',
    sport: 'basketball',
    league: 'NBA',
    odds: -150,
    revenue: 50.00,
  },
  context: {
    device: { type: 'mobile', manufacturer: 'Apple' },
    location: { country: 'US', region: 'NY' },
    sessionId: 'session-abc',
  },
  source: 'web',
  messageId: 'msg-unique-uuid',
});

console.log(result.eventId);    // 'clxyz...'
console.log(result.profileId);  // 'profile-xyz'
```

**Errors:** `CDP_VALIDATION_ERROR`, `CDP_RATE_LIMIT_ERROR`

---

#### `trackBatch(inputs: TrackEventInput[]): Promise<BatchTrackResult>`

Track multiple events in a single batch operation. Optimized for bulk ingestion with transaction batching.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `inputs` | `TrackEventInput[]` | ✅ | Array of events (max 500 per batch) |

**Returns:**

```typescript
interface BatchTrackResult {
  total: number;           // Total events submitted
  succeeded: number;       // Successfully processed
  failed: number;          // Failed events
  duplicates: number;      // Duplicate events skipped
  errors: Array<{
    index: number;         // Index in input array
    error: string;         // Error message
  }>;
}
```

**Example:**

```typescript
const result = await eventCollector.trackBatch([
  {
    ventureId: 'betedge-venture-uuid',
    anonymousId: 'device-001',
    category: 'page',
    name: 'Page Viewed',
    properties: { path: '/odds/nba' },
    source: 'web',
  },
  {
    ventureId: 'betedge-venture-uuid',
    anonymousId: 'device-002',
    category: 'track',
    name: 'Bet Placed',
    properties: { revenue: 100 },
    source: 'web',
  },
]);

console.log(`${result.succeeded}/${result.total} events processed`);
```

**Limits:** Maximum 500 events per batch. Exceeding this returns `CDP_BATCH_SIZE_ERROR`.

---

#### `identify(input: IdentifyInput): Promise<IdentifyResult>`

Identify a user — merge an anonymous device/session with an authenticated user account. This triggers identity resolution and backfills all previous anonymous events to the identified profile.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `userId` | `string` | ✅ | Authenticated user ID |
| `anonymousId` | `string` | — | Anonymous device/session ID to merge |
| `traits` | `Record<string, unknown>` | — | Traits to set on the profile |
| `context` | `EventContext` | — | Device/browser/location context |
| `source` | `string` | ✅ | Event source |

**Returns:**

```typescript
interface IdentifyResult {
  profileId: string;          // Resolved/created profile ID
  isNewProfile: boolean;      // True if profile was just created
  eventsBackfilled: number;   // Anonymous events reassigned to profile
}
```

**Example:**

```typescript
const result = await eventCollector.identify({
  ventureId: 'betedge-venture-uuid',
  userId: 'user-7x9k2',
  anonymousId: 'device-abc-123',
  traits: {
    email: 'jordan@example.com',
    name: 'Jordan Smith',
    plan: 'premium',
  },
  source: 'web',
});

console.log(`Profile: ${result.profileId}`);
console.log(`Backfilled ${result.eventsBackfilled} anonymous events`);
```

---

#### `page(input: PageInput): Promise<TrackEventResult>`

Track a page view event with automatic URL/path/title extraction from context.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `profileId` | `string` | — | Known profile ID |
| `anonymousId` | `string` | — | Anonymous ID (required if no profileId) |
| `name` | `string` | — | Page name (optional, extracted from title if not provided) |
| `properties` | `Record<string, unknown>` | — | Additional page properties |
| `context` | `EventContext` | — | Must include `context.page` with URL/path/title |
| `source` | `string` | ✅ | Event source |

**Returns:** `TrackEventResult` (same as `track()`)

---

#### `queryEvents(params: EventQueryParams): Promise<EventQueryResult>`

Query events with multi-dimensional filtering. Supports pagination and sorting.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `profileId` | `string` | — | Filter by profile |
| `eventName` | `string` | — | Filter by event name |
| `category` | `EventCategory` | — | Filter by category |
| `startDate` | `Date` | — | Events after this date |
| `endDate` | `Date` | — | Events before this date |
| `source` | `string` | — | Filter by source |
| `properties` | `Record<string, unknown>` | — | Filter by event properties (JSONB containment) |
| `limit` | `number` | — | Results per page (default: 50, max: 1000) |
| `offset` | `number` | — | Pagination offset |
| `orderBy` | `'timestamp' \| 'receivedAt'` | — | Sort field (default: `'timestamp'`) |
| `orderDir` | `'asc' \| 'desc'` | — | Sort direction (default: `'desc'`) |

**Returns:**

```typescript
interface EventQueryResult {
  events: CDPEvent[];    // Array of matching events
  total: number;         // Total matching events
  hasMore: boolean;      // Whether more pages exist
}
```

**Example:**

```typescript
const result = await eventCollector.queryEvents({
  ventureId: 'betedge-venture-uuid',
  profileId: 'profile-xyz',
  eventName: 'Bet Placed',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-02-01'),
  limit: 20,
});

console.log(`Found ${result.total} events`);
result.events.forEach(e => console.log(`  ${e.name}: $${e.revenue}`));
```

---

#### `getEventMetrics(params: MetricsParams): Promise<EventMetricRow[]>`

Retrieve pre-aggregated event metrics for dashboard rendering.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `eventName` | `string` | — | Filter by event name |
| `source` | `string` | — | Filter by source |
| `granularity` | `'hour' \| 'day' \| 'week' \| 'month'` | ✅ | Aggregation granularity |
| `startDate` | `Date` | ✅ | Start of date range |
| `endDate` | `Date` | ✅ | End of date range |

**Returns:**

```typescript
interface EventMetricRow {
  windowStart: Date;
  windowEnd: Date;
  granularity: string;
  eventName: string;
  source: string | null;
  eventCount: number;
  uniqueProfiles: number;
  totalRevenue: string | null;
  propertyAggregates: Record<string, number> | null;
}
```

---

### Identity Graph Service

The `IdentityGraph` class manages cross-venture identity resolution, maintaining a graph of identifier nodes and co-occurrence edges.

---

#### `resolve(input: IdentityResolutionInput): Promise<ResolutionResult>`

Resolve one or more identifiers to a single profile. This is the core identity resolution algorithm.

**Algorithm:**
1. Collect all identifiers from input
2. Hash and find matching nodes in `cdp_identity_node`
3. Collect profile IDs associated with matching nodes
4. If 0 profiles → return null (new profile needed)
5. If 1 profile → return it with confidence 1.0
6. If N profiles → check resolution rules for auto-merge
7. Return highest-confidence profile

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `email` | `string` | — | Email address |
| `phone` | `string` | — | Phone number |
| `userId` | `string` | — | Authenticated user ID |
| `deviceId` | `string` | — | Device identifier |
| `walletAddress` | `string` | — | Blockchain wallet address |
| `sessionId` | `string` | — | Session identifier |
| `customIds` | `Record<string, string>` | — | Venture-specific custom identifiers |

**Returns:**

```typescript
interface ResolutionResult {
  profileId: string | null;              // Resolved profile ID (null if new)
  confidence: number;                    // Resolution confidence (0.0–1.0)
  matchedIdentities: Array<{
    type: string;
    value: string;
  }>;
  isNewProfile: boolean;                 // True if no existing profile matched
}
```

**Example:**

```typescript
const result = await identityGraph.resolve({
  ventureId: 'betedge-venture-uuid',
  email: 'jordan@example.com',
  deviceId: 'iphone-abc-123',
  walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD47',
});

if (result.isNewProfile) {
  // Create new profile
  const profile = await profileService.upsertProfile({ ... });
} else {
  console.log(`Resolved to profile ${result.profileId} (confidence: ${result.confidence})`);
}
```

---

#### `linkIdentities(ventureId: string, identifiers: IdentifierInput[], linkType: string): Promise<void>`

Link co-occurring identifiers in the identity graph. Creates or strengthens edges between identifier nodes.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `identifiers` | `Array<{ type: string; value: string }>` | ✅ | Identifiers to link together |
| `linkType` | `string` | ✅ | Link type: `'same_session'`, `'same_event'`, `'explicit'`, `'inferred'` |

**Example:**

```typescript
await identityGraph.linkIdentities(
  'betedge-venture-uuid',
  [
    { type: 'email', value: 'jordan@example.com' },
    { type: 'device_id', value: 'iphone-abc-123' },
    { type: 'cookie', value: 'ga_12345' },
  ],
  'same_session'
);
```

---

#### `associateWithProfile(ventureId: string, profileId: string, identifiers: IdentifierInput[]): Promise<void>`

Associate identifiers with a resolved profile. If an identifier is already associated with a different profile, triggers a merge check.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `profileId` | `string` | ✅ | Profile to associate identifiers with |
| `identifiers` | `Array<{ type: string; value: string }>` | ✅ | Identifiers to associate |

---

#### `getProfileGraph(profileId: string): Promise<IdentityGraphView>`

Retrieve the complete identity graph visualization for a profile — all nodes (identifiers) and edges (co-occurrence links).

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | `string` | ✅ | Profile to get graph for |

**Returns:**

```typescript
interface IdentityGraphView {
  profileId: string;
  nodes: Array<{
    id: string;
    type: string;           // 'email', 'phone', 'device_id', 'wallet', etc.
    value: string;          // The actual identifier value
    firstSeen: Date;
    lastSeen: Date;
    occurrences: number;
  }>;
  edges: Array<{
    source: string;         // Source node ID
    target: string;         // Target node ID
    strength: number;       // Co-occurrence count
    confidence: number;     // Link confidence (0.0–1.0)
    linkType: string;       // 'same_session', 'same_event', 'explicit', 'inferred'
  }>;
}
```

---

#### `triggerMerge(primaryId: string, secondaryId: string, reason: string): Promise<void>`

Trigger a profile merge via the event bus. The merge is executed asynchronously by the ProfileMerger.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `primaryId` | `string` | ✅ | Winning profile ID (survives) |
| `secondaryId` | `string` | ✅ | Losing profile ID (merged into winner) |
| `reason` | `string` | ✅ | Merge reason: `'email_match'`, `'phone_match'`, `'wallet_match'`, `'manual'`, `'identity_resolution'` |

---

### Profiles Service

The `ProfileService` class manages unified 360° customer profiles with identity resolution, trait computation, and GDPR compliance.

---

#### `upsertProfile(input: CreateProfileInput): Promise<Profile>`

Create or retrieve a profile. Automatically resolves identity via the identity graph.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `type` | `ProfileType` | — | Profile type (default: `'anonymous'`) |
| `userId` | `string` | — | Authenticated user ID |
| `email` | `string` | — | Email address |
| `phone` | `string` | — | Phone number |
| `displayName` | `string` | — | Display name |
| `traits` | `Record<string, unknown>` | — | Initial traits |
| `source` | `string` | ✅ | Creation source: `'web'`, `'mobile'`, `'api'`, `'import'` |

**Returns:** `Profile` object

**Behavior:**
1. Attempts identity resolution via `IdentityGraph.resolve()`
2. If existing profile found → updates with new data
3. If no profile found → creates new profile
4. Creates aliases for all provided identifiers
5. Emits `cdp.profile.created` or `cdp.profile.updated` event

---

#### `getProfile(profileId: string): Promise<ProfileWithDetails | null>`

Get a profile by ID with full 360° view including computed traits, aliases, and segment memberships.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | `string` | ✅ | Profile ID |

**Returns:**

```typescript
interface ProfileWithDetails extends Profile {
  aliases: ProfileAlias[];                    // All known identifiers
  computedTraits: Record<string, unknown>;   // Real-time computed traits
  segments: Segment[];                        // All segments this profile belongs to
}
```

**Example:**

```typescript
const profile = await profileService.getProfile('profile-xyz');

if (profile) {
  console.log(profile.displayName);          // 'Jordan Smith'
  console.log(profile.type);                 // 'identified'
  console.log(profile.ltvAmount);            // '12450.0000'
  console.log(profile.traits.total_bets);    // 156
  console.log(profile.aliases.length);       // 4
  console.log(profile.segments.length);      // 3
}
```

---

#### `searchProfiles(criteria: ProfileSearchCriteria): Promise<ProfileSearchResult>`

Search profiles with complex multi-criteria filtering including JSONB trait queries.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `email` | `string` | — | Filter by canonical email |
| `phone` | `string` | — | Filter by canonical phone |
| `userId` | `string` | — | Filter by linked user ID |
| `deviceId` | `string` | — | Filter by device ID (via identity graph) |
| `walletAddress` | `string` | — | Filter by wallet address |
| `traits` | `Record<string, unknown>` | — | Filter by trait values (JSONB containment) |
| `segmentId` | `string` | — | Filter by segment membership |
| `lastSeenAfter` | `Date` | — | Profile active after this date |
| `lastSeenBefore` | `Date` | — | Profile active before this date |
| `type` | `ProfileType` | — | Filter by profile type |
| `status` | `ProfileStatus` | — | Filter by status (default: `'active'`) |
| `limit` | `number` | — | Results per page (default: 50, max: 100) |
| `offset` | `number` | — | Pagination offset |

**Returns:**

```typescript
interface ProfileSearchResult {
  profiles: Profile[];     // Matching profiles
  total: number;           // Total matches
  hasMore: boolean;        // Whether more pages exist
}
```

**Example:**

```typescript
const result = await profileService.searchProfiles({
  ventureId: 'betedge-venture-uuid',
  traits: { vip_status: 'gold', preferred_sport: 'basketball' },
  lastSeenAfter: new Date('2026-01-01'),
  limit: 25,
});

console.log(`Found ${result.total} gold VIP basketball fans`);
```

---

#### `updateProfile(profileId: string, updates: ProfileUpdateInput): Promise<Profile>`

Update profile traits, display name, and external IDs. Performs a partial merge — existing values are preserved unless explicitly overwritten.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | `string` | ✅ | Profile to update |
| `updates.displayName` | `string` | — | New display name |
| `updates.traits` | `Record<string, unknown>` | — | Traits to set/update (merged with existing) |
| `updates.externalIds` | `Record<string, string>` | — | External IDs to set/update |

**Returns:** Updated `Profile` object

---

#### `mergeProfiles(primaryId: string, secondaryId: string, reason: string, triggeredBy: string): Promise<Profile>`

Merge two profiles. The primary profile survives; the secondary is marked as `merged`.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `primaryId` | `string` | ✅ | Winning profile ID |
| `secondaryId` | `string` | ✅ | Losing profile ID |
| `reason` | `string` | ✅ | Merge reason |
| `triggeredBy` | `string` | ✅ | Who triggered: `'system'`, user ID, or agent ID |

**Returns:** Merged `Profile` object (the winner with combined data)

**Side Effects:**
- Secondary profile status → `'merged'`, `mergedIntoId` → primary ID
- All aliases moved from secondary to primary
- Events reassigned from secondary to primary
- LTV, totalEvents, totalSessions summed
- Full merge log recorded in `cdp_profile_merge`
- Emits `cdp.profile.merged` event

---

#### `suppressProfile(profileId: string, reason: string): Promise<void>`

Suppress a profile for GDPR/privacy compliance. Clears all PII, deletes aliases, anonymizes the profile.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | `string` | ✅ | Profile to suppress |
| `reason` | `string` | ✅ | Suppression reason (e.g., `'GDPR erasure request #4521'`) |

**Post-Suppression State:**
- `status` → `'suppressed'`
- `canonicalEmail` → `null`
- `canonicalPhone` → `null`
- `displayName` → `'[Suppressed]'`
- `traits` → `{}`
- `externalIds` → `{}`
- All `cdp_profile_alias` records deleted
- Events retained but profile link anonymized

---

#### `getTimeline(profileId: string, options: TimelineOptions): Promise<TimelineEntry[]>`

Get the activity timeline for a profile — an aggregated, human-readable feed of interactions.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | `string` | ✅ | Profile ID |
| `options.limit` | `number` | — | Max entries (default: 50) |
| `options.before` | `Date` | — | Entries before this date (for pagination) |
| `options.activityType` | `string` | — | Filter by activity type |

**Returns:**

```typescript
interface TimelineEntry {
  id: string;
  profileId: string;
  activityType: string;      // 'page_view', 'purchase', 'bet_placed', etc.
  title: string;             // Human-readable title
  description: string | null;
  metadata: Record<string, unknown> | null;
  eventId: string | null;
  occurredAt: Date;
}
```

---

### Segments Service

The `SegmentService` class manages dynamic audience segmentation — creating, evaluating, and maintaining audience segments.

---

#### `createSegment(input: CreateSegmentInput): Promise<Segment>`

Create a new segment definition.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `name` | `string` | ✅ | Human-readable segment name |
| `slug` | `string` | ✅ | URL-safe slug (unique per venture) |
| `description` | `string` | — | Segment description |
| `type` | `SegmentType` | — | Segment type (default: `'dynamic'`) |
| `rules` | `SegmentRules` | — | Rules DSL (required for dynamic segments) |
| `seedSegmentId` | `string` | — | Seed segment for ML lookalike segments |
| `similarityThreshold` | `number` | — | Similarity threshold for ML segments (0.0–1.0) |
| `syncEnabled` | `boolean` | — | Enable automatic sync (default: `false`) |
| `syncDestinations` | `string[]` | — | Destination IDs for automatic sync |
| `tags` | `string[]` | — | Tags for organization |

**Returns:** `Segment` object with status `'draft'`

**Example:**

```typescript
const segment = await segmentService.createSegment({
  ventureId: 'betedge-venture-uuid',
  name: 'High-Value Churn Risk',
  slug: 'high-value-churn-risk',
  description: 'Users with LTV > $500 who haven\'t bet in 30+ days',
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
```

---

#### `updateRules(segmentId: string, rules: SegmentRules): Promise<Segment>`

Update segment rules. Marks the segment as `'draft'` until recomputed.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `segmentId` | `string` | ✅ | Segment to update |
| `rules` | `SegmentRules` | ✅ | New rules DSL |

**Returns:** Updated `Segment` object with status reset to `'draft'`

---

#### `estimateSize(segmentId: string): Promise<number>`

Estimate segment size via `COUNT(*)` without materializing membership. Fast preview for the segment builder UI.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `segmentId` | `string` | ✅ | Segment to estimate |

**Returns:** Estimated number of matching profiles

---

#### `computeSegment(segmentId: string): Promise<ComputationResult>`

Full segment recomputation — materializes membership, computes diff from previous state.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `segmentId` | `string` | ✅ | Segment to compute |

**Returns:**

```typescript
interface ComputationResult {
  segmentId: string;
  total: number;             // Total members after computation
  added: number;             // New members added
  removed: number;           // Members who exited
  previousSize: number;      // Size before computation
  durationMs: number;        // Computation duration
  status: 'completed' | 'failed';
  error?: string;
}
```

**Pipeline:**
1. Load segment definition + rules
2. Compile rules → SQL WHERE clause
3. Execute query to find matching profiles
4. Load current membership set
5. Compute diff (new entries, exits)
6. INSERT new memberships, UPDATE exited memberships
7. Update segment stats
8. Record computation in `cdp_segment_computation`
9. Emit `cdp.segment.computed` event
10. Trigger sync if `syncEnabled = true`

---

#### `isMember(segmentId: string, profileId: string): Promise<boolean>`

Check if a single profile is a member of a segment. For dynamic segments, evaluates rules in real-time against the profile's current traits.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `segmentId` | `string` | ✅ | Segment to check |
| `profileId` | `string` | ✅ | Profile to check |

**Returns:** `boolean`

---

#### `getMembers(segmentId: string, options?: MembershipOptions): Promise<MembershipResult>`

Get all members of a segment with pagination.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `segmentId` | `string` | ✅ | Segment ID |
| `options.limit` | `number` | — | Results per page (default: 50, max: 1000) |
| `options.offset` | `number` | — | Pagination offset |
| `options.includeProfile` | `boolean` | — | Include full profile data (default: `false`) |
| `options.sortBy` | `'enteredAt' \| 'score'` | — | Sort field (default: `'enteredAt'`) |
| `options.sortDir` | `'asc' \| 'desc'` | — | Sort direction (default: `'desc'`) |

**Returns:**

```typescript
interface MembershipResult {
  members: Array<{
    profileId: string;
    enteredAt: Date;
    entryReason: string | null;
    score: number | null;
    profile?: Profile;           // Included if includeProfile = true
  }>;
  total: number;
  hasMore: boolean;
}
```

---

#### `addToSegment(segmentId: string, profileIds: string[]): Promise<number>`

Manually add profiles to a static segment.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `segmentId` | `string` | ✅ | Static segment ID |
| `profileIds` | `string[]` | ✅ | Profile IDs to add (max 1000) |

**Returns:** Number of profiles actually added (excludes duplicates)

**Errors:** `CDP_SEGMENT_TYPE_ERROR` if segment is not `'static'`

---

#### `removeFromSegment(segmentId: string, profileIds: string[]): Promise<number>`

Manually remove profiles from a static segment.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `segmentId` | `string` | ✅ | Static segment ID |
| `profileIds` | `string[]` | ✅ | Profile IDs to remove |

**Returns:** Number of profiles actually removed

---

#### `getProfileSegments(profileId: string): Promise<Segment[]>`

Get all segments that a profile belongs to.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | `string` | ✅ | Profile ID |

**Returns:** Array of `Segment` objects

---

### Sync Service

The `SyncOrchestrator` class manages outbound data synchronization to external activation destinations.

---

#### `triggerSync(syncConfigId: string, triggeredBy: TriggerType): Promise<SyncJobRecord>`

Trigger a sync job for a segment → destination configuration.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `syncConfigId` | `string` | ✅ | Sync configuration ID (segment ↔ destination binding) |
| `triggeredBy` | `'schedule' \| 'manual' \| 'realtime'` | ✅ | What triggered the sync |

**Returns:**

```typescript
interface SyncJobRecord {
  id: string;
  syncConfigId: string;
  status: SyncStatus;            // 'pending', 'running', 'completed', 'failed', 'partial'
  triggeredBy: string;
  totalRecords: number | null;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: SyncError[];
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}
```

**Pipeline:**
1. Load sync config with segment and destination
2. Get destination adapter for destination type
3. Create sync job record with status `'pending'`
4. Query segment members with profile data
5. Apply field mappings and transforms
6. Batch records (configurable batch size)
7. Send each batch to destination adapter
8. Track progress, handle failures with per-record retry
9. Update sync config with last sync status
10. Emit `cdp.sync.completed` event

---

#### `testDestination(destinationId: string): Promise<TestResult>`

Test a destination connection by calling the adapter's test method.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `destinationId` | `string` | ✅ | Destination to test |

**Returns:**

```typescript
interface TestResult {
  success: boolean;
  message: string;
  latencyMs: number;
}
```

---

#### `createDestination(input: CreateDestinationInput): Promise<Destination>`

Register a new external destination.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `name` | `string` | ✅ | Human-readable destination name |
| `type` | `DestinationType` | ✅ | Platform type |
| `config` | `DestinationConfig` | ✅ | Platform-specific configuration |
| `credentials` | `Record<string, string>` | — | API keys/tokens (encrypted at rest) |
| `fieldMappings` | `FieldMapping[]` | — | Field mapping rules |

**Returns:** `Destination` object

---

#### `createSyncConfig(input: CreateSyncConfigInput): Promise<SyncConfig>`

Create a sync configuration binding a segment to a destination.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `segmentId` | `string` | ✅ | Source segment |
| `destinationId` | `string` | ✅ | Target destination |
| `mode` | `'full' \| 'incremental'` | — | Sync mode (default: `'incremental'`) |
| `scheduleType` | `'manual' \| 'realtime' \| 'scheduled'` | — | Schedule type (default: `'manual'`) |
| `cronExpression` | `string` | — | Cron expression (required for `'scheduled'`) |
| `includeTraits` | `string[]` | — | Trait keys to include in sync |
| `excludeTraits` | `string[]` | — | Trait keys to exclude from sync |

**Returns:** `SyncConfig` object

---

#### `getSyncHistory(syncConfigId: string, options?: HistoryOptions): Promise<SyncJobRecord[]>`

Get sync job execution history for a configuration.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `syncConfigId` | `string` | ✅ | Sync configuration ID |
| `options.limit` | `number` | — | Max results (default: 20) |
| `options.status` | `SyncStatus` | — | Filter by status |

**Returns:** Array of `SyncJobRecord` objects ordered by `createdAt DESC`

---

### Traits Service

The `TraitEngine` class manages computed and manual trait definitions, computation rules, and trait value storage.

---

#### `defineTrait(input: DefineTraitInput): Promise<TraitDefinition>`

Define a new trait with optional computation rules.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `key` | `string` | ✅ | Unique trait key (e.g., `'total_bets'`, `'churn_risk'`) |
| `name` | `string` | ✅ | Human-readable name |
| `description` | `string` | — | Trait description |
| `category` | `string` | — | Category: `'demographics'`, `'behavior'`, `'predictive'`, `'financial'` |
| `type` | `TraitType` | ✅ | Data type: `'string'`, `'number'`, `'boolean'`, `'date'`, `'array'`, `'object'` |
| `source` | `TraitSource` | ✅ | Source: `'computed'`, `'manual'`, `'enrichment'`, `'ml'` |
| `computationRule` | `ComputationRule` | — | Computation rule (required for `'computed'` source) |
| `mlModelId` | `string` | — | ML model reference (for `'ml'` source) |
| `defaultValue` | `unknown` | — | Default value when trait is not set |
| `validationRules` | `ValidationRule[]` | — | Value validation constraints |
| `isPii` | `boolean` | — | Whether trait contains PII (default: `false`) |
| `isExportable` | `boolean` | — | Whether trait can be synced to destinations (default: `true`) |

**Returns:** `TraitDefinition` object

**Example:**

```typescript
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
```

---

#### `setTrait(profileId: string, key: string, value: unknown, source?: TraitSource): Promise<void>`

Set a manual trait value for a profile (upsert).

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | `string` | ✅ | Profile ID |
| `key` | `string` | ✅ | Trait key |
| `value` | `unknown` | ✅ | Trait value |
| `source` | `TraitSource` | — | Source (default: `'manual'`) |

---

#### `setTraits(profileId: string, traits: Record<string, unknown>, source?: TraitSource): Promise<void>`

Set multiple traits at once for a profile.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | `string` | ✅ | Profile ID |
| `traits` | `Record<string, unknown>` | ✅ | Key-value pairs of traits to set |
| `source` | `TraitSource` | — | Source for all traits (default: `'manual'`) |

---

#### `getTraitValues(profileId: string): Promise<Record<string, unknown>>`

Get all trait values for a profile — merged stored + computed.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | `string` | ✅ | Profile ID |

**Returns:** Key-value map of all trait values for the profile

---

#### `computeTrait(profileId: string, traitKey: string): Promise<unknown>`

Force-compute a single trait for a single profile.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | `string` | ✅ | Profile ID |
| `traitKey` | `string` | ✅ | Trait key to compute |

**Returns:** Computed trait value

---

#### `computeTraits(profileId: string): Promise<Record<string, unknown>>`

Compute all computed traits for a profile. Executes each computation rule against the profile's event history.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | `string` | ✅ | Profile ID |

**Returns:** Key-value map of all computed trait values

---

#### `runBatchComputation(ventureId: string, traitKey: string): Promise<ComputationJobResult>`

Run batch computation for a trait across all profiles in a venture. Used for scheduled nightly recomputations.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ventureId` | `string` | ✅ | Venture identifier |
| `traitKey` | `string` | ✅ | Trait key to compute |

**Returns:**

```typescript
interface ComputationJobResult {
  jobId: string;             // Computation job ID
  traitKey: string;
  processed: number;         // Total profiles processed
  updated: number;           // Profiles whose trait value changed
  errors: number;            // Profiles that errored
  durationMs: number;        // Total computation duration
  status: 'completed' | 'failed';
}
```

---

## Type Definitions

### Core Types

```typescript
// ─── Profile Types ───────────────────────────────────────────

type ProfileType = 'identified' | 'anonymous' | 'lead' | 'prospect';
type ProfileStatus = 'active' | 'merged' | 'suppressed' | 'deleted';

interface Profile {
  id: string;
  ventureId: string;
  userId: string | null;
  type: ProfileType;
  status: ProfileStatus;
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

interface ProfileAlias {
  id: string;
  profileId: string;
  type: string;
  value: string;
  valueHash: string;
  isVerified: boolean;
  verifiedAt: Date | null;
  verificationMethod: string | null;
  source: string;
  sourceId: string | null;
  confidence: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Identity Types ──────────────────────────────────────────

type IdentityType = 'email' | 'phone' | 'user_id' | 'device_id'
                  | 'cookie' | 'wallet' | 'social' | 'advertising' | 'custom';

interface IdentityNode {
  id: string;
  ventureId: string;
  type: IdentityType;
  value: string;
  valueHash: string;
  profileId: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  occurrenceCount: number;
  sources: IdentitySource[];
  createdAt: Date;
}

interface IdentityEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  strength: number;
  confidence: number;
  linkType: string;
  firstLinkedAt: Date;
  lastLinkedAt: Date;
  createdAt: Date;
}

interface IdentitySource {
  type: 'web' | 'mobile' | 'api' | 'import' | 'enrichment';
  name: string;
  timestamp: string;
  eventId?: string;
  sessionId?: string;
}

// ─── Event Types ─────────────────────────────────────────────

type EventCategory = 'page' | 'track' | 'identify' | 'screen' | 'group' | 'alias';

interface CDPEvent {
  id: string;
  ventureId: string;
  profileId: string | null;
  anonymousId: string | null;
  category: EventCategory;
  name: string;
  properties: Record<string, unknown>;
  context: EventContext;
  timestamp: Date;
  receivedAt: Date;
  sentAt: Date | null;
  source: string;
  sourceId: string | null;
  messageId: string | null;
  revenue: string | null;
  currency: string | null;
  version: number;
}

interface EventContext {
  device?: {
    id?: string;
    manufacturer?: string;
    model?: string;
    type?: 'mobile' | 'tablet' | 'desktop';
  };
  os?: {
    name?: string;
    version?: string;
  };
  browser?: {
    name?: string;
    version?: string;
  };
  location?: {
    ip?: string;
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  page?: {
    url?: string;
    path?: string;
    title?: string;
    referrer?: string;
  };
  campaign?: {
    source?: string;
    medium?: string;
    name?: string;
    term?: string;
    content?: string;
  };
  sessionId?: string;
  [key: string]: unknown;
}

// ─── Trait Types ─────────────────────────────────────────────

type TraitType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
type TraitSource = 'computed' | 'manual' | 'imported' | 'enrichment' | 'ml';

interface TraitDefinition {
  id: string;
  ventureId: string;
  key: string;
  name: string;
  description: string | null;
  category: string | null;
  type: TraitType;
  source: TraitSource;
  computationRule: ComputationRule | null;
  mlModelId: string | null;
  defaultValue: unknown;
  validationRules: ValidationRule[] | null;
  isPii: boolean;
  isExportable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ComputationRule {
  type: 'aggregate' | 'window' | 'recency' | 'frequency' | 'custom';
  eventName?: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'first' | 'last';
  propertyPath?: string;
  windowDays?: number;
  sinceEvent?: string;
  unit?: 'days' | 'hours' | 'minutes';
  sql?: string;
  eventFilters?: Array<{
    property: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
    value: unknown;
  }>;
}

interface TraitValue {
  id: string;
  profileId: string;
  traitDefinitionId: string;
  value: unknown;
  source: TraitSource;
  sourceDetails: Record<string, unknown> | null;
  confidence: string | null;
  computedAt: Date | null;
  expiresAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'required';
  value: unknown;
  message?: string;
}

// ─── Segment Types ───────────────────────────────────────────

type SegmentType = 'dynamic' | 'static' | 'ml';
type SegmentStatus = 'draft' | 'computing' | 'active' | 'paused' | 'archived';

interface Segment {
  id: string;
  ventureId: string;
  name: string;
  slug: string;
  description: string | null;
  type: SegmentType;
  status: SegmentStatus;
  rules: SegmentRules | null;
  seedSegmentId: string | null;
  mlModelId: string | null;
  similarityThreshold: string | null;
  estimatedSize: number | null;
  lastComputedSize: number | null;
  lastComputedAt: Date | null;
  syncEnabled: boolean;
  syncDestinations: string[];
  tags: string[];
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SegmentRules {
  operator: 'and' | 'or';
  conditions: SegmentCondition[];
}

interface SegmentCondition {
  type: 'trait' | 'event' | 'segment' | 'computed';
  traitKey?: string;
  eventName?: string;
  timeframe?: { value: number; unit: 'days' | 'hours' | 'minutes' };
  segmentId?: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'
          | 'contains' | 'not_contains'
          | 'exists' | 'not_exists'
          | 'in' | 'not_in';
  value?: unknown;
  conditions?: SegmentCondition[];
  nestedOperator?: 'and' | 'or';
}

interface SegmentMembership {
  id: string;
  segmentId: string;
  profileId: string;
  enteredAt: Date;
  entryReason: string | null;
  score: string | null;
  exitedAt: Date | null;
  exitReason: string | null;
  snapshotVersion: number;
}

// ─── Sync Types ──────────────────────────────────────────────

type DestinationType = 'facebook_ads' | 'google_ads' | 'tiktok_ads'
                     | 'klaviyo' | 'mailchimp' | 'braze'
                     | 'hubspot' | 'salesforce'
                     | 'snowflake' | 'bigquery'
                     | 'webhook' | 'custom';

type SyncStatus = 'pending' | 'running' | 'completed' | 'failed' | 'partial';

interface Destination {
  id: string;
  ventureId: string;
  name: string;
  type: DestinationType;
  config: DestinationConfig;
  credentials: Record<string, string> | null;
  fieldMappings: FieldMapping[];
  isActive: boolean;
  lastTestedAt: Date | null;
  lastTestResult: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DestinationConfig {
  accountId?: string;
  audienceId?: string;
  listId?: string;
  dataset?: string;
  table?: string;
  url?: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  batchSize?: number;
  retryAttempts?: number;
}

interface FieldMapping {
  sourceField: string;
  destField: string;
  transform?: 'hash' | 'lowercase' | 'uppercase' | 'phone_e164';
}

interface SyncConfig {
  id: string;
  segmentId: string;
  destinationId: string;
  mode: string;
  scheduleType: string;
  cronExpression: string | null;
  includeTraits: string[] | null;
  excludeTraits: string[] | null;
  isActive: boolean;
  lastSyncAt: Date | null;
  lastSyncStatus: SyncStatus | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SyncError {
  profileId: string;
  error: string;
  timestamp: string;
}

// ─── Merge Types ─────────────────────────────────────────────

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

interface MergeConflictResolution {
  field: string;
  strategy: 'primary' | 'secondary' | 'newest' | 'merged' | 'manual';
  manualValue?: unknown;
}
```

---

## Zod Schemas

### Event Schemas

```typescript
import { z } from 'zod';

// ─── Event Context ───────────────────────────────────────────

export const eventContextSchema = z.object({
  device: z.object({
    id: z.string().optional(),
    manufacturer: z.string().optional(),
    model: z.string().optional(),
    type: z.enum(['mobile', 'tablet', 'desktop']).optional(),
  }).optional(),
  os: z.object({
    name: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
  browser: z.object({
    name: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
  location: z.object({
    ip: z.string().ip().optional(),
    country: z.string().length(2).optional(),
    region: z.string().optional(),
    city: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }).optional(),
  page: z.object({
    url: z.string().url().optional(),
    path: z.string().optional(),
    title: z.string().optional(),
    referrer: z.string().optional(),
  }).optional(),
  campaign: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    name: z.string().optional(),
    term: z.string().optional(),
    content: z.string().optional(),
  }).optional(),
  sessionId: z.string().optional(),
}).passthrough();

// ─── Track Event Input ───────────────────────────────────────

export const trackEventInputSchema = z.object({
  ventureId: z.string().min(1),
  profileId: z.string().optional(),
  anonymousId: z.string().optional(),
  category: z.enum(['page', 'track', 'identify', 'screen', 'group', 'alias']),
  name: z.string().min(1).max(256),
  properties: z.record(z.unknown()).default({}),
  context: eventContextSchema.default({}),
  timestamp: z.date().optional(),
  source: z.enum(['web', 'mobile', 'server', 'import']),
  sourceId: z.string().optional(),
  messageId: z.string().uuid().optional(),
  revenue: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
}).refine(
  data => data.profileId || data.anonymousId,
  { message: 'Either profileId or anonymousId must be provided' }
);

// ─── Identify Input ──────────────────────────────────────────

export const identifyInputSchema = z.object({
  ventureId: z.string().min(1),
  userId: z.string().min(1),
  anonymousId: z.string().optional(),
  traits: z.record(z.unknown()).optional(),
  context: eventContextSchema.optional(),
  source: z.enum(['web', 'mobile', 'server', 'import']),
});

// ─── Batch Track Input ───────────────────────────────────────

export const batchTrackInputSchema = z.object({
  events: z.array(trackEventInputSchema).min(1).max(500),
});
```

### Profile Schemas

```typescript
// ─── Create Profile ──────────────────────────────────────────

export const createProfileSchema = z.object({
  ventureId: z.string().min(1),
  type: z.enum(['identified', 'anonymous', 'lead', 'prospect']).optional(),
  userId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  displayName: z.string().max(256).optional(),
  traits: z.record(z.unknown()).optional(),
  source: z.enum(['web', 'mobile', 'api', 'import']),
});

// ─── Profile Search ──────────────────────────────────────────

export const profileSearchSchema = z.object({
  ventureId: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  userId: z.string().optional(),
  deviceId: z.string().optional(),
  walletAddress: z.string().optional(),
  traits: z.record(z.unknown()).optional(),
  segmentId: z.string().optional(),
  lastSeenAfter: z.date().optional(),
  lastSeenBefore: z.date().optional(),
  type: z.enum(['identified', 'anonymous', 'lead', 'prospect']).optional(),
  status: z.enum(['active', 'merged', 'suppressed', 'deleted']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// ─── Profile Update ──────────────────────────────────────────

export const profileUpdateSchema = z.object({
  displayName: z.string().max(256).optional(),
  traits: z.record(z.unknown()).optional(),
  externalIds: z.record(z.string()).optional(),
});

// ─── Profile Merge ───────────────────────────────────────────

export const profileMergeSchema = z.object({
  primaryId: z.string().min(1),
  secondaryId: z.string().min(1),
  reason: z.string().min(1).optional(),
});
```

### Segment Schemas

```typescript
// ─── Segment Condition ───────────────────────────────────────

export const segmentConditionSchema: z.ZodType<SegmentCondition> = z.lazy(() =>
  z.object({
    type: z.enum(['trait', 'event', 'segment', 'computed']),
    traitKey: z.string().optional(),
    eventName: z.string().optional(),
    timeframe: z.object({
      value: z.number().positive(),
      unit: z.enum(['days', 'hours', 'minutes']),
    }).optional(),
    segmentId: z.string().optional(),
    operator: z.enum([
      'eq', 'ne', 'gt', 'gte', 'lt', 'lte',
      'contains', 'not_contains',
      'exists', 'not_exists',
      'in', 'not_in',
    ]),
    value: z.unknown().optional(),
    conditions: z.array(segmentConditionSchema).optional(),
    nestedOperator: z.enum(['and', 'or']).optional(),
  })
);

// ─── Segment Rules ───────────────────────────────────────────

export const segmentRulesSchema = z.object({
  operator: z.enum(['and', 'or']),
  conditions: z.array(segmentConditionSchema).min(1).max(50),
});

// ─── Create Segment ──────────────────────────────────────────

export const createSegmentSchema = z.object({
  ventureId: z.string().min(1),
  name: z.string().min(1).max(256),
  slug: z.string().min(1).max(128).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1024).optional(),
  type: z.enum(['dynamic', 'static', 'ml']).default('dynamic'),
  rules: segmentRulesSchema.optional(),
  seedSegmentId: z.string().optional(),
  similarityThreshold: z.number().min(0).max(1).optional(),
  syncEnabled: z.boolean().default(false),
  syncDestinations: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});
```

### Trait Schemas

```typescript
// ─── Computation Rule ────────────────────────────────────────

export const computationRuleSchema = z.object({
  type: z.enum(['aggregate', 'window', 'recency', 'frequency', 'custom']),
  eventName: z.string().optional(),
  aggregation: z.enum(['count', 'sum', 'avg', 'min', 'max', 'first', 'last']).optional(),
  propertyPath: z.string().optional(),
  windowDays: z.number().positive().optional(),
  sinceEvent: z.string().optional(),
  unit: z.enum(['days', 'hours', 'minutes']).optional(),
  sql: z.string().optional(),
  eventFilters: z.array(z.object({
    property: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'lt', 'contains']),
    value: z.unknown(),
  })).optional(),
});

// ─── Define Trait ────────────────────────────────────────────

export const defineTraitSchema = z.object({
  ventureId: z.string().min(1),
  key: z.string().min(1).max(128).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1).max(256),
  description: z.string().max(1024).optional(),
  category: z.string().max(64).optional(),
  type: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object']),
  source: z.enum(['computed', 'manual', 'enrichment', 'ml']),
  computationRule: computationRuleSchema.optional(),
  mlModelId: z.string().optional(),
  defaultValue: z.unknown().optional(),
  validationRules: z.array(z.object({
    type: z.enum(['min', 'max', 'pattern', 'enum', 'required']),
    value: z.unknown(),
    message: z.string().optional(),
  })).optional(),
  isPii: z.boolean().default(false),
  isExportable: z.boolean().default(true),
});
```

### Sync Schemas

```typescript
// ─── Field Mapping ───────────────────────────────────────────

export const fieldMappingSchema = z.object({
  sourceField: z.string().min(1),
  destField: z.string().min(1),
  transform: z.enum(['hash', 'lowercase', 'uppercase', 'phone_e164']).optional(),
});

// ─── Destination Config ──────────────────────────────────────

export const destinationConfigSchema = z.object({
  accountId: z.string().optional(),
  audienceId: z.string().optional(),
  listId: z.string().optional(),
  dataset: z.string().optional(),
  table: z.string().optional(),
  url: z.string().url().optional(),
  method: z.enum(['POST', 'PUT']).optional(),
  headers: z.record(z.string()).optional(),
  batchSize: z.number().min(1).max(10000).optional(),
  retryAttempts: z.number().min(0).max(10).optional(),
});

// ─── Create Destination ──────────────────────────────────────

export const createDestinationSchema = z.object({
  ventureId: z.string().min(1),
  name: z.string().min(1).max(256),
  type: z.enum([
    'facebook_ads', 'google_ads', 'tiktok_ads',
    'klaviyo', 'mailchimp', 'braze',
    'hubspot', 'salesforce',
    'snowflake', 'bigquery',
    'webhook', 'custom',
  ]),
  config: destinationConfigSchema,
  credentials: z.record(z.string()).optional(),
  fieldMappings: z.array(fieldMappingSchema).default([]),
});

// ─── Create Sync Config ─────────────────────────────────────

export const createSyncConfigSchema = z.object({
  segmentId: z.string().min(1),
  destinationId: z.string().min(1),
  mode: z.enum(['full', 'incremental']).default('incremental'),
  scheduleType: z.enum(['manual', 'realtime', 'scheduled']).default('manual'),
  cronExpression: z.string().optional(),
  includeTraits: z.array(z.string()).optional(),
  excludeTraits: z.array(z.string()).optional(),
});

// ─── Identity Resolution ─────────────────────────────────────

export const identityResolutionSchema = z.object({
  ventureId: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  userId: z.string().optional(),
  deviceId: z.string().optional(),
  walletAddress: z.string().optional(),
  sessionId: z.string().optional(),
  customIds: z.record(z.string()).optional(),
}).refine(
  data => data.email || data.phone || data.userId || data.deviceId || data.walletAddress || data.customIds,
  { message: 'At least one identifier must be provided' }
);
```

---

## Event Types

### Standard Event Taxonomy

The CDP supports a standard event taxonomy across all ventures, plus venture-specific events:

#### Universal Events

| Event Name | Category | Description | Key Properties |
|------------|----------|-------------|---------------|
| `Page Viewed` | `page` | Web page view | `url`, `path`, `title`, `referrer` |
| `Screen Viewed` | `screen` | Mobile screen view | `screenName`, `screenClass` |
| `User Signed Up` | `track` | Account creation | `plan`, `source`, `method` |
| `User Signed In` | `track` | Authentication | `method`, `provider` |
| `Form Submitted` | `track` | Any form submission | `formId`, `formName`, `fields` |
| `Button Clicked` | `track` | UI interaction | `buttonId`, `label`, `section` |
| `Search Performed` | `track` | Search action | `query`, `resultCount`, `filters` |
| `Error Encountered` | `track` | Error event | `errorCode`, `errorMessage`, `context` |

#### E-Commerce Events

| Event Name | Category | Description | Key Properties |
|------------|----------|-------------|---------------|
| `Product Viewed` | `track` | Product detail page | `productId`, `name`, `price`, `category` |
| `Product Added` | `track` | Added to cart | `productId`, `quantity`, `price` |
| `Product Removed` | `track` | Removed from cart | `productId`, `quantity` |
| `Cart Viewed` | `track` | Cart page viewed | `products[]`, `cartValue` |
| `Checkout Started` | `track` | Checkout initiated | `cartValue`, `products[]` |
| `Order Completed` | `track` | Purchase completed | `orderId`, `revenue`, `products[]`, `coupon` |
| `Order Refunded` | `track` | Refund processed | `orderId`, `refundAmount` |

#### Venture-Specific Events

| Venture | Event Name | Key Properties |
|---------|-----------|---------------|
| **BetEdge** | `Bet Placed` | `betId`, `sport`, `league`, `odds`, `revenue` |
| **BetEdge** | `Bet Won` | `betId`, `payout` |
| **BetEdge** | `Bet Lost` | `betId`, `lostAmount` |
| **FutureState** | `Token Staked` | `tokenId`, `stakeAmount`, `stakeDuration` |
| **FutureState** | `Proposal Voted` | `proposalId`, `vote` |
| **SerpSpace** | `Tool Used` | `toolId`, `toolName`, `duration` |
| **StreamFi** | `Stream Started` | `streamId`, `category`, `title` |
| **StreamFi** | `Tip Received` | `tipAmount`, `senderId` |
| **JACKED** | `Workout Logged` | `workoutType`, `duration`, `calories` |
| **SkyBeam** | `Campaign Created` | `campaignId`, `budget`, `platform` |
| **Nexarion** | `API Call Made` | `endpoint`, `method`, `statusCode` |

---

## Error Codes

All CDP errors follow a consistent structure:

```typescript
class CDPError extends Error {
  code: string;           // Error code (e.g., 'CDP_VALIDATION_ERROR')
  statusCode: number;     // HTTP status code equivalent
  details?: unknown;      // Additional error context
}
```

### Error Code Reference

| Code | Status | Description |
|------|--------|-------------|
| `CDP_VALIDATION_ERROR` | 400 | Input validation failed (Zod schema) |
| `CDP_BATCH_SIZE_ERROR` | 400 | Batch exceeds maximum size (500 events) |
| `CDP_INVALID_RULES` | 400 | Segment rules DSL is invalid or contains cycles |
| `CDP_INVALID_COMPUTATION` | 400 | Trait computation rule is malformed |
| `CDP_NOT_FOUND` | 404 | Requested resource (profile, segment, etc.) not found |
| `CDP_PROFILE_NOT_FOUND` | 404 | Profile ID does not exist |
| `CDP_SEGMENT_NOT_FOUND` | 404 | Segment ID does not exist |
| `CDP_DESTINATION_NOT_FOUND` | 404 | Destination ID does not exist |
| `CDP_TRAIT_NOT_FOUND` | 404 | Trait definition not found for the given key |
| `CDP_DUPLICATE_EVENT` | 409 | Event with this `messageId` already exists |
| `CDP_MERGE_CONFLICT` | 409 | Concurrent merge operation on same profile |
| `CDP_DUPLICATE_SEGMENT_SLUG` | 409 | Segment slug already exists for this venture |
| `CDP_DUPLICATE_TRAIT_KEY` | 409 | Trait key already exists for this venture |
| `CDP_SEGMENT_TYPE_ERROR` | 422 | Operation not supported for segment type (e.g., addToSegment on dynamic) |
| `CDP_PROFILE_SUPPRESSED` | 422 | Profile is suppressed — read-only except for delete |
| `CDP_PROFILE_MERGED` | 422 | Profile was merged — use the primary profile instead |
| `CDP_COMPUTATION_FAILED` | 500 | Trait computation or segment evaluation failed |
| `CDP_SYNC_FAILED` | 500 | Sync job failed (destination API error) |
| `CDP_DESTINATION_UNREACHABLE` | 502 | Destination API is unreachable or returned error |
| `CDP_CIRCUIT_OPEN` | 503 | Circuit breaker is open for destination adapter |
| `CDP_RATE_LIMIT_ERROR` | 429 | Event ingestion rate limit exceeded |

### Error Response Format

```typescript
// tRPC error response
{
  error: {
    code: 'CDP_VALIDATION_ERROR',
    message: 'Event name is required',
    data: {
      field: 'name',
      constraint: 'required',
    },
  }
}

// REST API error response
{
  error: {
    code: 'CDP_PROFILE_NOT_FOUND',
    message: 'Profile with ID "profile-xyz" not found',
    statusCode: 404,
  }
}
```

---

## Config Reference

### CDP Module Configuration

```typescript
// @mcv/cdp/config.ts
import { z } from 'zod';

export const cdpConfigSchema = z.object({
  // ─── Event Processing ──────────────────────────────────────
  events: z.object({
    /** Maximum events per batch */
    maxBatchSize: z.number().default(500),
    /** Deduplication window (hours) */
    deduplicationWindowHours: z.number().default(24),
    /** Enable Redpanda streaming (disable for testing) */
    enableStreaming: z.boolean().default(true),
    /** Redpanda broker addresses */
    brokers: z.array(z.string()).default(['localhost:9092']),
    /** Default event source if not provided */
    defaultSource: z.string().default('web'),
    /** Rate limit: max events per second per venture */
    rateLimitPerSecond: z.number().default(10000),
  }).default({}),

  // ─── Identity Resolution ───────────────────────────────────
  identity: z.object({
    /** Minimum confidence for auto-merge */
    autoMergeMinConfidence: z.number().min(0).max(1).default(0.8),
    /** Minimum co-occurrences before linking */
    minCoOccurrences: z.number().default(1),
    /** Enable probabilistic matching */
    enableProbabilistic: z.boolean().default(false),
    /** Maximum graph traversal depth */
    maxGraphDepth: z.number().default(5),
    /** Enable cross-venture resolution */
    enableCrossVenture: z.boolean().default(false),
  }).default({}),

  // ─── Profiles ──────────────────────────────────────────────
  profiles: z.object({
    /** Redis cache TTL for profiles (seconds) */
    cacheTtlSeconds: z.number().default(300),
    /** Maximum profile search results */
    maxSearchResults: z.number().default(100),
    /** Enable automatic profile enrichment */
    enableEnrichment: z.boolean().default(false),
    /** Enrichment provider (e.g., 'clearbit') */
    enrichmentProvider: z.string().optional(),
  }).default({}),

  // ─── Traits ────────────────────────────────────────────────
  traits: z.object({
    /** Debounce window for event-triggered computation (ms) */
    computationDebounceMs: z.number().default(5000),
    /** Maximum concurrent batch computation jobs */
    maxConcurrentJobs: z.number().default(3),
    /** Batch size for batch computation */
    batchComputationSize: z.number().default(1000),
    /** Trait value cache TTL (seconds) */
    cacheTtlSeconds: z.number().default(600),
    /** Enable ML trait computation via OpenRouter */
    enableMlTraits: z.boolean().default(false),
    /** OpenRouter model for ML traits */
    mlModel: z.string().default('anthropic/claude-sonnet-4'),
  }).default({}),

  // ─── Segments ──────────────────────────────────────────────
  segments: z.object({
    /** Maximum rules depth (nested conditions) */
    maxRulesDepth: z.number().default(5),
    /** Maximum conditions per segment */
    maxConditions: z.number().default(50),
    /** Default computation schedule */
    defaultComputationSchedule: z.string().default('0 2 * * *'), // Daily at 2 AM
    /** Segment membership cache TTL (seconds) */
    membershipCacheTtlSeconds: z.number().default(3600),
    /** Enable ML-based lookalike segments */
    enableMlSegments: z.boolean().default(false),
  }).default({}),

  // ─── Sync ──────────────────────────────────────────────────
  sync: z.object({
    /** Default batch size for sync operations */
    defaultBatchSize: z.number().default(500),
    /** Maximum retry attempts per record */
    maxRetryAttempts: z.number().default(3),
    /** Retry backoff base (ms) */
    retryBackoffMs: z.number().default(1000),
    /** Circuit breaker failure threshold */
    circuitBreakerThreshold: z.number().default(5),
    /** Circuit breaker reset timeout (ms) */
    circuitBreakerResetMs: z.number().default(60000),
    /** Enable real-time sync */
    enableRealtimeSync: z.boolean().default(false),
    /** Credential encryption key (from env) */
    encryptionKey: z.string().optional(),
  }).default({}),

  // ─── Database ──────────────────────────────────────────────
  database: z.object({
    /** Connection pool size */
    poolSize: z.number().default(20),
    /** Statement timeout (ms) */
    statementTimeoutMs: z.number().default(30000),
    /** Enable event table partitioning */
    enablePartitioning: z.boolean().default(true),
    /** Partition granularity */
    partitionGranularity: z.enum(['day', 'week', 'month']).default('month'),
  }).default({}),

  // ─── Redis ─────────────────────────────────────────────────
  redis: z.object({
    /** Redis connection URL */
    url: z.string().default('redis://localhost:6379'),
    /** Key prefix for all CDP keys */
    keyPrefix: z.string().default('cdp:'),
    /** Enable bloom filter for deduplication */
    enableBloomFilter: z.boolean().default(true),
  }).default({}),

  // ─── Observability ─────────────────────────────────────────
  observability: z.object({
    /** Enable Prometheus metrics */
    enableMetrics: z.boolean().default(true),
    /** Enable structured logging */
    enableStructuredLogging: z.boolean().default(true),
    /** Log level */
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    /** Enable request tracing */
    enableTracing: z.boolean().default(false),
  }).default({}),
});

export type CDPConfig = z.infer<typeof cdpConfigSchema>;
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CDP_REDPANDA_BROKERS` | Comma-separated Redpanda broker addresses | `localhost:9092` |
| `CDP_REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `CDP_ENCRYPTION_KEY` | AES-256-GCM key for credential encryption | — (required for sync) |
| `CDP_RATE_LIMIT_PER_SECOND` | Max events per second per venture | `10000` |
| `CDP_AUTO_MERGE_CONFIDENCE` | Minimum confidence for auto-merge | `0.8` |
| `CDP_ENABLE_CROSS_VENTURE` | Enable cross-venture identity resolution | `false` |
| `CDP_ENABLE_ML_TRAITS` | Enable ML-powered trait computation | `false` |
| `CDP_ML_MODEL` | OpenRouter model for ML traits | `anthropic/claude-sonnet-4` |
| `CDP_LOG_LEVEL` | Logging level | `info` |
| `CDP_ENABLE_STREAMING` | Enable Redpanda event streaming | `true` |
| `CDP_COMPUTATION_DEBOUNCE_MS` | Trait computation debounce window | `5000` |

### Constants

```typescript
// @mcv/cdp/constants.ts

/** Profile status values */
export const PROFILE_STATUSES = ['active', 'merged', 'suppressed', 'deleted'] as const;

/** Profile type values */
export const PROFILE_TYPES = ['identified', 'anonymous', 'lead', 'prospect'] as const;

/** Identity type values */
export const IDENTITY_TYPES = [
  'email', 'phone', 'user_id', 'device_id',
  'cookie', 'wallet', 'social', 'advertising', 'custom',
] as const;

/** Event category values */
export const EVENT_CATEGORIES = ['page', 'track', 'identify', 'screen', 'group', 'alias'] as const;

/** Trait type values */
export const TRAIT_TYPES = ['string', 'number', 'boolean', 'date', 'array', 'object'] as const;

/** Trait source values */
export const TRAIT_SOURCES = ['computed', 'manual', 'imported', 'enrichment', 'ml'] as const;

/** Segment type values */
export const SEGMENT_TYPES = ['dynamic', 'static', 'ml'] as const;

/** Segment status values */
export const SEGMENT_STATUSES = ['draft', 'computing', 'active', 'paused', 'archived'] as const;

/** Destination type values */
export const DESTINATION_TYPES = [
  'facebook_ads', 'google_ads', 'tiktok_ads',
  'klaviyo', 'mailchimp', 'braze',
  'hubspot', 'salesforce',
  'snowflake', 'bigquery',
  'webhook', 'custom',
] as const;

/** Sync mode values */
export const SYNC_MODES = ['full', 'incremental'] as const;

/** Merge strategy values */
export const MERGE_STRATEGIES = ['primary', 'secondary', 'newest', 'merged', 'manual'] as const;

/** Default batch size for operations */
export const DEFAULT_BATCH_SIZE = 500;

/** Default computation debounce in milliseconds */
export const DEFAULT_COMPUTATION_DEBOUNCE_MS = 5000;

/** Events that trigger trait recomputation */
export const TRAIT_TRIGGER_EVENTS = [
  'Bet Placed', 'Order Completed', 'Token Staked',
  'Deposit Made', 'Subscription Started', 'Tip Received',
] as const;

/** Maximum events per batch track */
export const MAX_EVENTS_PER_BATCH = 500;

/** Maximum nested depth for segment rules */
export const MAX_SEGMENT_RULES_DEPTH = 5;
```

---

*@mcv/cdp — Customer Data Platform Domain*
