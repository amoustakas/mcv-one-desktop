# @mcv/fabric — Fabric Module (Tier 2, INTERNAL)

> **Platform infrastructure services — audit trails, caching, event bus, feature flags, notifications, job queues, real-time subscriptions, search, and file storage.**

**Package:** `@mcv/fabric`
**Tier:** 2 — Cross-Cutting Infrastructure
**Classification:** INTERNAL
**Version:** 1.0.0
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Position](#architecture-position)
3. [Design Philosophy](#design-philosophy)
4. [Module Structure](#module-structure)
5. [Submodule: audit](#submodule-audit)
6. [Submodule: cache](#submodule-cache)
7. [Submodule: events](#submodule-events)
8. [Submodule: flags](#submodule-flags)
9. [Submodule: notifications](#submodule-notifications)
10. [Submodule: queue](#submodule-queue)
11. [Submodule: realtime](#submodule-realtime)
12. [Submodule: search](#submodule-search)
13. [Submodule: storage](#submodule-storage)
14. [Cross-Module Integration](#cross-module-integration)
15. [Key Interfaces](#key-interfaces)
16. [Database Schema](#database-schema)
17. [Domain Events](#domain-events)
18. [Configuration](#configuration)
19. [Security Model](#security-model)
20. [Testing Strategy](#testing-strategy)
21. [Operational Runbook](#operational-runbook)
22. [Migration & Versioning](#migration--versioning)
23. [Performance Budgets](#performance-budgets)
24. [Package Exports](#package-exports)
25. [Dependencies](#dependencies)

---

## Overview

`@mcv/fabric` is the **connective tissue** of the MCV.ONE platform. It provides the cross-cutting infrastructure services that every business domain depends on but that don't belong to any single domain. Fabric is the infrastructure backbone — if `@mcv/kernel` is the operating system and `@mcv/identity` is the security perimeter, then `@mcv/fabric` is the plumbing, wiring, and HVAC of the building.

### What Fabric Provides

| Submodule | Purpose | Primary Technology |
|-----------|---------|-------------------|
| **audit** | Compliance-grade audit logging | PostgreSQL + partitioning |
| **cache** | Distributed caching layer | Redis (Upstash) |
| **events** | Domain event bus | Redpanda / Kafka |
| **flags** | Feature flags & experimentation | Custom engine + LaunchDarkly |
| **notifications** | Omnichannel messaging | SendGrid, Twilio, OneSignal |
| **queue** | Background job processing | BullMQ / Temporal |
| **realtime** | WebSocket & live subscriptions | Supabase Realtime |
| **search** | Full-text search & indexing | Meilisearch / Typesense |
| **storage** | File & media storage with CDN | S3 / Supabase Storage / R2 |

### Core Design Principles

1. **Venture-Scoped by Default** — Every fabric service is multi-tenant. All queries, caches, and indices are automatically scoped to the current venture context.
2. **Backend-Agnostic** — Each submodule defines a provider interface. Swap Redis for Memcached, S3 for R2, SendGrid for Resend — the domain code never changes.
3. **Event-Driven Integration** — Fabric services communicate internally via the event bus. Upload a file -> storage emits an event -> search indexes it -> audit logs it.
4. **Fail-Open for Non-Critical, Fail-Closed for Critical** — Cache misses fall through to the database. Audit log failures halt the operation.
5. **Zero Domain Knowledge** — Fabric knows nothing about orders, users, or products. It provides generic infrastructure that domains configure for their needs.

---

## Architecture Position

```
+-----------------------------------------------------------------------+
|                        BUSINESS DOMAINS  (Tier 5)                      |
|  @mcv/nexus . @mcv/engagement . @mcv/growth . @mcv/commerce           |
|  @mcv/operations . @mcv/finance . @mcv/analytics                      |
+-----------------------------------------------------------------------+
|                        DOMAIN SUPPORT    (Tier 4)                      |
|  Shared domain services, cross-domain orchestration                    |
+-----------------------------------------------------------------------+
|                        BUSINESS LOGIC    (Tier 3)                      |
|  Workflow engine, rule engine, domain event handlers                   |
+-----------------------------------------------------------------------+
|                                                                        |
|                  +-------------------------------+                     |
|                  |     @mcv/fabric  (Tier 2)     |  <-- YOU ARE HERE   |
|                  |                               |                     |
|                  |   +-------+  +-------+        |                     |
|                  |   | audit |  | cache |        |                     |
|                  |   +-------+  +-------+        |                     |
|                  |   +-------+  +-------+        |                     |
|                  |   |events |  | flags |        |                     |
|                  |   +-------+  +-------+        |                     |
|                  |   +-------+  +-------+        |                     |
|                  |   |notif. |  | queue |        |                     |
|                  |   +-------+  +-------+        |                     |
|                  |   +--------+ +-------+        |                     |
|                  |   |realtime| |search |        |                     |
|                  |   +--------+ +-------+        |                     |
|                  |   +-------+                   |                     |
|                  |   |storage|                   |                     |
|                  |   +-------+                   |                     |
|                  +-------------------------------+                     |
|                                                                        |
+-----------------------------------------------------------------------+
|  @mcv/identity (Tier 1)            @mcv/kernel (Tier 0)               |
|  Auth, RBAC, sessions              DB, config, logger, errors          |
+-----------------------------------------------------------------------+
```

### Dependency Rules

- **Fabric MAY depend on:** `@mcv/kernel` (Tier 0), `@mcv/identity` (Tier 1)
- **Fabric MUST NOT depend on:** Any Tier 3, 4, or 5 package
- **Fabric submodules MAY depend on:** Other fabric submodules (e.g., `notifications` -> `queue`)
- **All domain packages MAY depend on:** `@mcv/fabric`

### Internal Dependency Graph

```
                    +----------+
              +---->|  events  |<----+
              |     +----+-----+     |
              |          |           |
              |          v           |
         +----+---+  +------+  +---+-----+
         | audit  |  |cache |  | storage  |
         +--------+  +--+---+  +---+-----+
                        |          |
                        v          |
                   +--------+     |
                   | search |<----+
                   +--------+
              
         +--------------+  +----------+
         |notifications |-->|  queue   |
         +--------------+  +----------+

         +----------+  +----------+
         |  flags   |  | realtime |
         +----------+  +----------+
              (independent)    (independent)
```

---

## Design Philosophy

### 1. Provider Pattern

Every fabric submodule follows the **provider pattern**. The submodule defines an interface, and concrete implementations (providers) are injected at startup. This allows:

- **Local development** with in-memory providers
- **Testing** with mock providers
- **Production** with cloud providers
- **Migration** between providers without code changes

```typescript
// Generic provider interface
interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, opts?: CacheSetOptions): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
}

// Redis provider (production)
class RedisCacheProvider implements CacheProvider { /* ... */ }

// In-memory provider (testing)
class InMemoryCacheProvider implements CacheProvider { /* ... */ }
```

### 2. Venture-Scoped by Default

Every operation in fabric automatically scopes to the current venture from the execution context:

```typescript
// The ventureId is pulled from AsyncLocalStorage context
// Developers never need to pass it explicitly
await cache.set('product:123', data); 
// Actually stores: "v:{ventureId}:product:123"

await search.query('products', { q: 'headphones' });
// Actually filters: WHERE ventureId = ctx.ventureId
```

### 3. Circuit Breaker Integration

All external service calls go through `@mcv/kernel`'s circuit breaker. If Redis is down, cache operations gracefully degrade. If SendGrid is unresponsive, notifications queue for retry.

```typescript
// Every provider wraps calls in circuit breakers
async get<T>(key: string): Promise<T | null> {
  return this.circuitBreaker.execute(
    'redis:get',
    () => this.redis.get(this.scopedKey(key)),
    { fallback: () => null }  // Graceful degradation
  );
}
```

### 4. Observability Built-In

Every fabric operation emits:
- **Structured logs** via `@mcv/kernel` logger
- **Metrics** (latency, throughput, error rates)
- **Traces** (OpenTelemetry spans)
- **Audit events** (for operations that modify state)

---

## Module Structure

```
packages/fabric/
  src/
    index.ts                      # Package entry -- re-exports all submodules
    shared/
      provider.ts                 # Base provider interface
      scoping.ts                  # Venture scoping utilities
      retry.ts                    # Retry/backoff utilities
      serialization.ts            # JSON/binary serialization
      metrics.ts                  # Shared metrics helpers
    
    audit/
      index.ts                    # Audit module entry
      audit.service.ts            # Core audit service
      audit.schema.ts             # Drizzle schema
      audit.types.ts              # Types & interfaces
      audit.queries.ts            # Query builders
      audit.export.ts             # Compliance export
      audit.retention.ts          # Retention policy engine
      audit.middleware.ts         # Express/tRPC middleware
      providers/
        postgres.provider.ts      # PostgreSQL provider
        memory.provider.ts        # In-memory (testing)
    
    cache/
      index.ts
      cache.service.ts
      cache.types.ts
      cache.keys.ts               # Key naming conventions
      cache.invalidation.ts       # Invalidation strategies
      cache.memoize.ts            # Function memoization
      cache.rate-limit.ts         # Rate limiting via cache
      providers/
        redis.provider.ts         # Redis/Upstash
        memory.provider.ts        # In-memory (LRU)
        tiered.provider.ts        # L1 memory + L2 Redis
    
    events/
      index.ts
      events.service.ts
      events.types.ts
      events.schema-registry.ts   # Event schema validation
      events.producer.ts          # Event publishing
      events.consumer.ts          # Event subscription
      events.dlq.ts               # Dead letter queue
      events.replay.ts            # Event replay
      providers/
        redpanda.provider.ts      # Redpanda/Kafka
        memory.provider.ts        # In-memory (testing)
        supabase.provider.ts      # Supabase Realtime fallback
    
    flags/
      index.ts
      flags.service.ts
      flags.schema.ts
      flags.types.ts
      flags.engine.ts             # Evaluation engine
      flags.targeting.ts          # Targeting rules
      flags.experiments.ts        # A/B testing
      flags.overrides.ts          # Dev/test overrides
      providers/
        database.provider.ts      # PostgreSQL-backed
        launchdarkly.provider.ts  # LaunchDarkly
        memory.provider.ts        # In-memory (testing)
    
    notifications/
      index.ts
      notifications.service.ts
      notifications.schema.ts
      notifications.types.ts
      notifications.templates.ts  # Template engine
      notifications.preferences.ts
      notifications.delivery.ts   # Delivery tracking
      notifications.digest.ts     # Batching/digest
      notifications.router.ts     # Channel routing
      providers/
        email/
          sendgrid.provider.ts
          resend.provider.ts
          ses.provider.ts
        sms/
          twilio.provider.ts
        push/
          onesignal.provider.ts
          firebase.provider.ts
        inapp/
          websocket.provider.ts
        memory.provider.ts
    
    queue/
      index.ts
      queue.service.ts
      queue.schema.ts
      queue.types.ts
      queue.scheduler.ts          # Cron/scheduled jobs
      queue.retry.ts              # Retry policies
      queue.priority.ts           # Priority queues
      queue.monitoring.ts         # Job health monitoring
      queue.dlq.ts                # Dead letter queue
      providers/
        bullmq.provider.ts        # BullMQ
        temporal.provider.ts      # Temporal.io
        memory.provider.ts        # In-memory (testing)
    
    realtime/
      index.ts
      realtime.service.ts
      realtime.types.ts
      realtime.channels.ts        # Channel management
      realtime.presence.ts        # Presence tracking
      realtime.broadcast.ts       # Broadcast messaging
      realtime.subscriptions.ts   # DB change subscriptions
      providers/
        supabase.provider.ts      # Supabase Realtime
        websocket.provider.ts     # Raw WebSocket
        memory.provider.ts        # In-memory (testing)
    
    search/
      index.ts
      search.service.ts
      search.types.ts
      search.indexer.ts           # Index management
      search.query-builder.ts     # Query DSL
      search.facets.ts            # Faceted search
      search.synonyms.ts          # Synonym management
      search.ranking.ts           # Custom ranking
      providers/
        meilisearch.provider.ts
        typesense.provider.ts
        postgres.provider.ts      # pg_trgm + tsvector
        memory.provider.ts
    
    storage/
      index.ts
      storage.service.ts
      storage.schema.ts
      storage.types.ts
      storage.upload.ts           # Upload management
      storage.image.ts            # Image optimization
      storage.video.ts            # Video transcoding
      storage.signed-urls.ts      # Signed URL generation
      storage.quotas.ts           # Quota management
      providers/
        s3.provider.ts            # AWS S3
        supabase.provider.ts      # Supabase Storage
        r2.provider.ts            # Cloudflare R2
        memory.provider.ts        # In-memory (testing)
  
  drizzle/
    migrations/                   # Drizzle migration files
  
  tests/
    audit/
    cache/
    events/
    flags/
    notifications/
    queue/
    realtime/
    search/
    storage/
    integration/
  
  package.json
  tsconfig.json
  MODULE.md                       # This file
```

---

## Submodule: audit

### Purpose

The **audit** submodule provides a compliance-grade, immutable audit trail for the entire MCV.ONE platform. Every meaningful action — data creation, modification, deletion, access, authentication event — is captured with full context: who did it, when, from where, and exactly what changed (before/after snapshots).

Audit logs serve three critical functions:
1. **Compliance** — SOC 2, GDPR Article 30, HIPAA, and industry-specific regulatory requirements mandate detailed activity logging with multi-year retention.
2. **Security Forensics** — When incidents occur, the audit trail provides a complete timeline for investigation.
3. **Operational Visibility** — Business users can review the history of any resource to understand how it reached its current state.

### Architecture

```
+--------------------------------------------------------------+
|                    Audit Middleware Layer                      |
|  (Express middleware . tRPC middleware . Manual audit.log())  |
+--------------------------------------------------------------+
|                                                               |
|  +--------------+  +-------------+  +------------------+     |
|  | AuditService |  |AuditQuerier |  |  AuditExporter   |     |
|  |              |  |             |  |                  |     |
|  | - log()      |  | - query()   |  | - exportCSV()   |     |
|  | - logBatch() |  | - getById() |  | - exportJSON()  |     |
|  | - logDiff()  |  | - timeline()|  | - exportPDF()   |     |
|  +------+-------+  +------+------+  +--------+---------+     |
|         |                 |                   |               |
|         v                 v                   v               |
|  +----------------------------------------------------+      |
|  |              Audit Provider Interface               |      |
|  |  write() . query() . export() . purge()             |      |
|  +------------------------+---------------------------+      |
|                           |                                   |
|              +------------+------------+                      |
|              v            v            v                      |
|  +--------------+ +------------+ +----------+                 |
|  |  PostgreSQL  | | Clickhouse | | In-Memory|                 |
|  |  (default)   | | (optional) | |  (test)  |                 |
|  +--------------+ +------------+ +----------+                 |
|                                                               |
|  +----------------------------------------------------+      |
|  |           Retention Policy Engine                   |      |
|  |  - 7-year default (compliance)                      |      |
|  |  - Venture-configurable                             |      |
|  |  - Automatic partition management                   |      |
|  |  - GDPR right-to-erasure pseudonymization           |      |
|  +----------------------------------------------------+      |
+--------------------------------------------------------------+
```

### Data Model

```typescript
// --- Audit Log Entry ---
interface AuditLogEntry {
  id: string;                  // UUID v7 (time-ordered)
  ventureId: string;           // Venture scope

  // Actor -- who performed the action
  actor: {
    type: 'user' | 'system' | 'api_key' | 'webhook' | 'cron';
    id: string | null;         // userId, apiKeyId, etc.
    email: string | null;
    displayName: string | null;
    ip: string | null;         // IPv4 or IPv6
    userAgent: string | null;
    sessionId: string | null;
    impersonatedBy: string | null; // If admin is impersonating
  };

  // Action -- what happened
  action: string;              // Dot-notation: "user.updated", "order.deleted"
  category: AuditCategory;     // 'data' | 'auth' | 'admin' | 'system' | 'security'
  severity: AuditSeverity;     // 'info' | 'warning' | 'critical'

  // Resource -- what was affected
  resource: {
    type: string;              // "users", "orders", "products"
    id: string | null;         // Primary key of resource
    displayName: string | null; // Human-readable label
    parentType: string | null;
    parentId: string | null;
  };

  // Data -- the change itself
  data: {
    before: Record<string, unknown> | null;  // State before change
    after: Record<string, unknown> | null;   // State after change
    diff: AuditDiffEntry[] | null;           // Computed diff
    redacted: string[];                      // Fields that were redacted
  };

  // Context
  metadata: Record<string, unknown>;
  tags: string[];
  correlationId: string | null;
  requestId: string | null;

  // Timing & Retention
  timestamp: Date;
  retainUntil: Date;

  // Integrity
  checksum: string;                   // SHA-256 of entry
  previousChecksum: string | null;    // Chain integrity
}

// --- Diff Entry ---
interface AuditDiffEntry {
  field: string;           // "email", "address.city"
  oldValue: unknown;
  newValue: unknown;
  type: 'added' | 'removed' | 'changed';
}

// --- Audit Categories ---
type AuditCategory =
  | 'data'      // CRUD operations on resources
  | 'auth'      // Login, logout, password change, MFA
  | 'admin'     // Admin panel actions, config changes
  | 'system'    // Automated processes, migrations
  | 'security'; // Permission changes, suspicious activity

type AuditSeverity = 'info' | 'warning' | 'critical';
```

### Database Schema (Drizzle)

```typescript
import { pgTable, uuid, varchar, text, jsonb, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';

export const auditCategoryEnum = pgEnum('audit_category', [
  'data', 'auth', 'admin', 'system', 'security'
]);

export const auditSeverityEnum = pgEnum('audit_severity', [
  'info', 'warning', 'critical'
]);

export const auditLogs = pgTable('fabric_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),

  // Actor
  actorType: varchar('actor_type', { length: 20 }).notNull(),
  actorId: uuid('actor_id'),
  actorEmail: varchar('actor_email', { length: 255 }),
  actorDisplayName: varchar('actor_display_name', { length: 255 }),
  actorIp: varchar('actor_ip', { length: 45 }),
  actorUserAgent: text('actor_user_agent'),
  actorSessionId: uuid('actor_session_id'),
  impersonatedBy: uuid('impersonated_by'),

  // Action
  action: varchar('action', { length: 100 }).notNull(),
  category: auditCategoryEnum('category').notNull().default('data'),
  severity: auditSeverityEnum('severity').notNull().default('info'),

  // Resource
  resourceType: varchar('resource_type', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),
  resourceDisplayName: varchar('resource_display_name', { length: 255 }),
  parentResourceType: varchar('parent_resource_type', { length: 100 }),
  parentResourceId: uuid('parent_resource_id'),

  // Data
  dataBefore: jsonb('data_before'),
  dataAfter: jsonb('data_after'),
  dataDiff: jsonb('data_diff'),
  redactedFields: jsonb('redacted_fields').$type<string[]>().default([]),

  // Context
  metadata: jsonb('metadata').default({}),
  tags: jsonb('tags').$type<string[]>().default([]),
  correlationId: uuid('correlation_id'),
  requestId: uuid('request_id'),

  // Timing
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  retainUntil: timestamp('retain_until', { withTimezone: true }).notNull(),

  // Integrity
  checksum: varchar('checksum', { length: 64 }).notNull(),
  previousChecksum: varchar('previous_checksum', { length: 64 }),
}, (table) => ({
  ventureTimestampIdx: index('audit_venture_timestamp_idx')
    .on(table.ventureId, table.timestamp),
  resourceIdx: index('audit_resource_idx')
    .on(table.ventureId, table.resourceType, table.resourceId),
  actorIdx: index('audit_actor_idx')
    .on(table.ventureId, table.actorId),
  actionIdx: index('audit_action_idx')
    .on(table.ventureId, table.action),
  categoryIdx: index('audit_category_idx')
    .on(table.ventureId, table.category),
  retentionIdx: index('audit_retention_idx')
    .on(table.retainUntil),
  correlationIdx: index('audit_correlation_idx')
    .on(table.correlationId),
}));
```

### Table Partitioning

Audit logs are **partitioned by month** for performance and retention management:

```sql
-- Parent table (created by Drizzle migration, then partitioned manually)
CREATE TABLE fabric_audit_logs (
  -- ... columns ...
) PARTITION BY RANGE (timestamp);

-- Monthly partitions (auto-created by retention engine)
CREATE TABLE fabric_audit_logs_2026_01
  PARTITION OF fabric_audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE fabric_audit_logs_2026_02
  PARTITION OF fabric_audit_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Retention: drop entire partitions when all rows have expired
-- This is O(1) vs. row-by-row deletion
DROP TABLE fabric_audit_logs_2019_01; -- 7 years old
```

### Core API

```typescript
// --- Logging ---

// Log a single audit event
await audit.log({
  action: 'user.updated',
  category: 'data',
  resource: { type: 'users', id: userId },
  dataBefore: oldUser,
  dataAfter: newUser,
  metadata: { reason: 'Profile update via settings page' },
});

// Log with automatic diff computation
await audit.logDiff({
  action: 'order.updated',
  resource: { type: 'orders', id: orderId },
  before: oldOrder,
  after: newOrder,
  redact: ['creditCardNumber', 'ssn'],
});

// Batch logging (for bulk operations)
await audit.logBatch([
  { action: 'product.archived', resource: { type: 'products', id: p1 } },
  { action: 'product.archived', resource: { type: 'products', id: p2 } },
  { action: 'product.archived', resource: { type: 'products', id: p3 } },
], { correlationId: batchOperationId });

// --- Querying ---

// Query audit trail for a specific resource
const history = await audit.query({
  resourceType: 'orders',
  resourceId: orderId,
  dateRange: { from: startDate, to: endDate },
  limit: 50,
  offset: 0,
});

// Get timeline for a resource (all changes, chronological)
const timeline = await audit.timeline({
  resourceType: 'users',
  resourceId: userId,
});

// Search across all audit logs
const results = await audit.search({
  actions: ['user.deleted', 'user.suspended'],
  category: 'security',
  severity: 'critical',
  dateRange: { from: thirtyDaysAgo, to: now },
  actorId: suspiciousUserId,
});

// --- Compliance Export ---

// Export audit logs for compliance review
const csvReport = await audit.export({
  ventureId,
  dateRange: { from: startOfYear, to: endOfYear },
  format: 'csv',
  filters: { category: 'auth' },
});

// Generate SOC 2 compliance report
const soc2Report = await audit.export({
  ventureId,
  dateRange: { from: auditPeriodStart, to: auditPeriodEnd },
  format: 'pdf',
  template: 'soc2',
});

// GDPR data access report (all actions involving a user)
const gdprReport = await audit.export({
  ventureId,
  filters: { actorId: userId },
  format: 'json',
  template: 'gdpr-subject-access',
});
```

### Middleware Integration

```typescript
// Express middleware -- auto-logs all mutating API requests
app.use(audit.middleware({
  filter: (req) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method),
  resourceExtractor: (req) => ({
    type: req.path.split('/')[2],
    id: req.params.id,
  }),
  redact: ['password', 'token', 'creditCard', 'ssn'],
  severityMap: {
    'DELETE': 'warning',
    'default': 'info',
  },
}));

// tRPC middleware -- auto-logs all mutations
const auditedProcedure = t.procedure.use(audit.trpcMiddleware({
  filter: (opts) => opts.type === 'mutation',
}));
```

### Retention Policy

```typescript
interface RetentionPolicy {
  default: Duration;           // Default: 7 years
  byCategory: {
    data: Duration;            // 7 years
    auth: Duration;            // 7 years
    admin: Duration;           // 10 years
    system: Duration;          // 2 years
    security: Duration;        // 10 years
  };
  byVenture: Record<string, Duration>;
  gdprPseudonymization: {
    enabled: boolean;
    delay: Duration;
  };
}

// Retention engine runs as a scheduled job
queue.cron('audit:retention', '0 3 * * *', async () => {
  await audit.retention.ensurePartitions();
  await audit.retention.purgeExpired();
  await audit.retention.pseudonymize();
});
```

### Integrity Chain

Audit entries form an **integrity chain** per venture. Each entry includes a SHA-256 checksum covering its content plus the previous entry's checksum. This makes tampering detectable:

```typescript
function computeChecksum(
  entry: AuditLogEntry,
  previousChecksum: string | null
): string {
  const payload = JSON.stringify({
    ventureId: entry.ventureId,
    action: entry.action,
    resource: entry.resource,
    data: entry.data,
    timestamp: entry.timestamp.toISOString(),
    previousChecksum,
  });
  return createHash('sha256').update(payload).digest('hex');
}

// Verification
async function verifyIntegrity(
  ventureId: string,
  dateRange: DateRange
): Promise<IntegrityReport> {
  const entries = await audit.query({
    ventureId, dateRange, orderBy: 'timestamp',
  });
  let previousChecksum: string | null = null;
  const violations: string[] = [];

  for (const entry of entries) {
    const expected = computeChecksum(entry, previousChecksum);
    if (entry.checksum !== expected) {
      violations.push(`Entry ${entry.id}: checksum mismatch`);
    }
    previousChecksum = entry.checksum;
  }

  return {
    valid: violations.length === 0,
    violations,
    entriesChecked: entries.length,
  };
}
```

### Security Considerations

- **Immutability**: Audit log entries cannot be updated or deleted through the application. Only the retention engine can drop expired partitions.
- **Redaction**: Sensitive fields (passwords, tokens, PII) are automatically redacted before storage. The `redactedFields` array records which fields were redacted.
- **Access Control**: Only users with `fabric.audit.read` permission can query audit logs. Export requires `fabric.audit.export`.
- **Encryption at Rest**: Audit log partitions are stored on encrypted volumes. JSONB fields containing PII are additionally encrypted using AES-256-GCM with venture-specific keys.
- **Tamper Detection**: The integrity chain allows periodic verification that no entries have been modified or deleted.

---

## Submodule: cache

### Purpose

The **cache** submodule provides a high-performance distributed caching layer built on Redis (Upstash). It implements the **cache-aside** pattern with venture-scoped key namespacing, automatic invalidation strategies, TTL management, and graceful degradation when the cache backend is unavailable.

Caching is critical for MCV.ONE's multi-tenant architecture where the same queries are repeated across thousands of ventures. Without caching, database load would be unsustainable.

### Architecture

```
+--------------------------------------------------------------+
|                     Application Layer                         |
|                                                               |
|  cache.get() . cache.set() . cache.getOrSet() . cache.memo() |
+--------------------------------------------------------------+
|                                                               |
|  +------------------------------------------------------+    |
|  |              CacheService (Facade)                    |    |
|  |                                                       |    |
|  |  - Venture-scoped key prefixing                       |    |
|  |  - Serialization / deserialization                    |    |
|  |  - TTL enforcement                                    |    |
|  |  - Metrics & tracing                                  |    |
|  |  - Circuit breaker wrapping                           |    |
|  +------------------------+-----------------------------+    |
|                           |                                   |
|         +-----------------+-----------------+                 |
|         v                 v                 v                 |
|  +------------+    +------------+    +----------------+       |
|  |   Redis    |    |  In-Memory |    |    Tiered      |       |
|  |  (Upstash) |    |  (LRU Map) |    | L1 Mem + L2 R |       |
|  +------------+    +------------+    +----------------+       |
|                                                               |
|  +------------------------------------------------------+    |
|  |           Invalidation Engine                         |    |
|  |                                                       |    |
|  |  - Tag-based invalidation                             |    |
|  |  - Pattern-based invalidation                         |    |
|  |  - Event-driven invalidation (via events submodule)   |    |
|  |  - TTL-based expiry                                   |    |
|  |  - Write-through invalidation                         |    |
|  +------------------------------------------------------+    |
|                                                               |
|  +------------------------------------------------------+    |
|  |           Rate Limiter                                |    |
|  |                                                       |    |
|  |  - Sliding window algorithm                           |    |
|  |  - Token bucket (for burst tolerance)                 |    |
|  |  - Per-user, per-IP, per-venture limits               |    |
|  +------------------------------------------------------+    |
+--------------------------------------------------------------+
```

### Key Naming Convention

All cache keys follow a strict convention to prevent collisions and enable venture isolation:

```
v:{ventureId}:{module}:{entity}:{identifier}
```

Examples:
```
v:550e8400-e29b:commerce:product:123          # Single product
v:550e8400-e29b:commerce:products:list:page=1 # Product list page 1
v:550e8400-e29b:identity:user:456             # User profile
v:550e8400-e29b:search:products:q=headphones  # Search result
global:flags:all                               # Global feature flags
global:config:smtp                             # Global config
```

### Core Types

```typescript
interface CacheSetOptions {
  ttl?: number;                // Time-to-live in seconds
  tags?: string[];             // Tags for group invalidation
  staleWhileRevalidate?: number; // Serve stale for N seconds while refreshing
  compress?: boolean;          // Enable zstd compression for large values
  lockTimeout?: number;        // Distributed lock timeout (stampede prevention)
}

interface CacheGetOptions {
  allowStale?: boolean;        // Allow stale-while-revalidate values
}

interface RateLimitOptions {
  key: string;
  limit: number;
  window: number;              // Window in seconds
  algorithm?: 'sliding-window' | 'token-bucket';
  burstLimit?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter: number | null;
}

interface TieredCacheConfig {
  l1: {
    maxSize: number;
    ttl: number;
  };
  l2: {
    provider: 'redis' | 'upstash';
    ttl: number;
  };
}
```

### Core API

```typescript
// --- Basic Operations ---

await cache.set('product:123', productData, {
  ttl: 3600,
  tags: ['products', 'category:electronics'],
});

const product = await cache.get<Product>('product:123');

await cache.delete('product:123');

const exists = await cache.has('product:123');

// --- Cache-Aside (Get or Compute) ---

const product = await cache.getOrSet(
  'product:123',
  async () => {
    return await db.query.products.findFirst({
      where: eq(products.id, '123'),
    });
  },
  {
    ttl: 3600,
    tags: ['products'],
    staleWhileRevalidate: 300,
  }
);

// --- Bulk Operations ---

const items = await cache.getMany<Product>(
  ['product:1', 'product:2', 'product:3']
);

await cache.setMany([
  { key: 'product:1', value: product1, ttl: 3600 },
  { key: 'product:2', value: product2, ttl: 3600 },
]);

// --- Invalidation ---

await cache.delete('product:123');
await cache.deletePattern('product:*');
await cache.invalidateByTag('products');
await cache.invalidateByTag('category:electronics');

// --- Memoization ---

const getProductWithRelations = cache.memoize(
  async (productId: string) => {
    return await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: { category: true, variants: true, images: true },
    });
  },
  {
    keyFn: (productId) => `product:full:${productId}`,
    ttl: 1800,
    tags: (productId) => ['products', `product:${productId}`],
  }
);

const product = await getProductWithRelations('123');

// --- Rate Limiting ---

const result = await cache.rateLimit({
  key: `api:${userId}`,
  limit: 100,
  window: 60,
});

if (!result.allowed) {
  throw new TooManyRequestsError({
    retryAfter: result.retryAfter,
    limit: 100,
    remaining: result.remaining,
  });
}

// --- Distributed Locking ---

const value = await cache.withLock(
  'expensive-computation:key',
  async () => {
    return await performExpensiveComputation();
  },
  { lockTimeout: 10000, waitTimeout: 5000 }
);
```

### Cache Invalidation Strategies

```typescript
// Strategy 1: Event-Driven Invalidation
events.subscribe('product.updated', async (event) => {
  const { productId, categoryId } = event.data;
  await cache.invalidateByTag(`product:${productId}`);
  await cache.invalidateByTag(`category:${categoryId}`);
  await cache.invalidateByTag('product-lists');
});

// Strategy 2: Write-Through
async function updateProduct(id: string, data: UpdateProductInput) {
  const updated = await db.update(products)
    .set(data).where(eq(products.id, id)).returning();
  await cache.set(`product:${id}`, updated, {
    ttl: 3600, tags: ['products'],
  });
  return updated;
}

// Strategy 3: Stale-While-Revalidate
const product = await cache.getOrSet('product:123', fetchProduct, {
  ttl: 3600,
  staleWhileRevalidate: 300,
});

// Strategy 4: Tag-Based Group Invalidation
await cache.set('product:1', p1, { tags: ['products', 'featured'] });
await cache.set('product:2', p2, { tags: ['products', 'sale'] });
await cache.set('product:3', p3, { tags: ['products', 'featured'] });

await cache.invalidateByTag('featured'); // Removes product:1 and product:3
```

### Tiered Caching (L1 + L2)

For ultra-high-throughput scenarios, the tiered provider combines an in-process LRU cache (L1) with Redis (L2):

```
Request -> L1 (in-memory, <1ms) -> L2 (Redis, ~2-5ms) -> Database (~10-50ms)
```

```typescript
const tieredCache = new TieredCacheProvider({
  l1: { maxSize: 10_000, ttl: 30 },
  l2: { provider: 'redis', ttl: 3600 },
});
```

### Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `fabric.cache.hit` | Counter | Cache hits |
| `fabric.cache.miss` | Counter | Cache misses |
| `fabric.cache.hit_rate` | Gauge | Hit rate percentage |
| `fabric.cache.latency` | Histogram | Get/set latency |
| `fabric.cache.size` | Gauge | Number of keys |
| `fabric.cache.evictions` | Counter | LRU evictions (L1) |
| `fabric.cache.errors` | Counter | Backend errors |
| `fabric.cache.rate_limit.allowed` | Counter | Allowed requests |
| `fabric.cache.rate_limit.blocked` | Counter | Blocked requests |

---

## Submodule: events

### Purpose

The **events** submodule provides a domain event bus for loose coupling between services. It enables event-driven architecture where services communicate by publishing and subscribing to events rather than making direct calls. This is the backbone of MCV.ONE's eventual consistency model.

Built on **Redpanda** (Kafka-compatible), the event bus provides durable, ordered, replayable event streams with schema validation, consumer groups, and dead letter queue handling.

### Architecture

```
+------------------------------------------------------------------+
|                        Producers                                  |
|  Domain services publish events via events.publish()              |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------------------------------------------------+  |
|  |               Schema Registry                              |  |
|  |  - Validates event payload against registered schema        |  |
|  |  - Prevents schema drift                                   |  |
|  |  - Supports schema evolution (backward compatible)          |  |
|  +------------------------+-----------------------------------+  |
|                           |                                       |
|  +------------------------v-----------------------------------+  |
|  |              Event Bus (Redpanda / Kafka)                   |  |
|  |                                                             |  |
|  |  Topics:                                                    |  |
|  |  +----------------+ +--------------+ +-----------------+   |  |
|  |  | mcv.orders.*   | |mcv.users.*   | |mcv.products.*   |   |  |
|  |  +----------------+ +--------------+ +-----------------+   |  |
|  |  +----------------+ +--------------+ +-----------------+   |  |
|  |  | mcv.payments.* | |mcv.audit.*   | |mcv.system.*     |   |  |
|  |  +----------------+ +--------------+ +-----------------+   |  |
|  +------------------------+-----------------------------------+  |
|                           |                                       |
|         +-----------------+-----------------+                     |
|         v                 v                 v                     |
|  +-------------+  +-------------+  +------------+                |
|  | Consumer    |  | Consumer    |  | Consumer   |                |
|  | Group A     |  | Group B     |  | Group C    |                |
|  | (analytics) |  | (notif.)   |  | (audit)    |                |
|  +------+------+  +------+------+  +-----+------+                |
|         |                |                |                       |
|         +----------------+----------------+                       |
|                          |                                        |
|                          v  (on failure)                           |
|  +------------------------------------------------------------+  |
|  |                 Dead Letter Queue                           |  |
|  |  Failed events -> DLQ -> Alert -> Manual review -> Replay   |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

### Event Envelope

Every event published through the bus is wrapped in a standard **CloudEvents-inspired** envelope:

```typescript
interface DomainEvent<T = unknown> {
  // Identity
  id: string;                  // UUID v7
  type: string;                // Dot-notation: "order.created"
  source: string;              // Publishing service: "@mcv/commerce"

  // Context
  ventureId: string;
  correlationId: string;
  causationId: string | null;

  // Payload
  data: T;
  dataSchema: string;          // Schema version: "order.created/v1"

  // Metadata
  timestamp: Date;
  version: number;

  // Actor
  actor: {
    type: 'user' | 'system' | 'api_key';
    id: string | null;
  };

  // Delivery
  retryCount: number;
  maxRetries: number;
}
```

### Topic Management

```typescript
interface TopicConfig {
  name: string;                // "mcv.orders"
  partitions: number;          // Default: 6
  replicationFactor: number;   // Default: 3
  retentionMs: number;         // Default: 7 days (604800000)
  cleanupPolicy: 'delete' | 'compact' | 'compact,delete';
  maxMessageBytes: number;     // Default: 1MB
}

const TOPICS = {
  ORDERS:        'mcv.orders',
  USERS:         'mcv.users',
  PRODUCTS:      'mcv.products',
  PAYMENTS:      'mcv.payments',
  NOTIFICATIONS: 'mcv.notifications',
  AUDIT:         'mcv.audit',
  SYSTEM:        'mcv.system',
} as const;
```

### Schema Registry

```typescript
// Register a schema
events.registerSchema('order.created', {
  version: 1,
  schema: z.object({
    orderId: z.string().uuid(),
    customerId: z.string().uuid(),
    items: z.array(z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })),
    total: z.number().positive(),
    currency: z.string().length(3),
  }),
  compatibility: 'backward',
});

// Schema evolution: add optional fields (backward compatible)
events.registerSchema('order.created', {
  version: 2,
  schema: z.object({
    orderId: z.string().uuid(),
    customerId: z.string().uuid(),
    items: z.array(z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
    })),
    total: z.number().positive(),
    currency: z.string().length(3),
    discountCode: z.string().optional(),
    shippingMethod: z.string().optional(),
  }),
  compatibility: 'backward',
});
```

### Core API

```typescript
// --- Publishing ---

await events.publish('order.created', {
  orderId: order.id,
  customerId: order.customerId,
  items: order.items,
  total: order.total,
  currency: order.currency,
});

await events.publish('order.created', payload, {
  key: order.id,
  headers: { priority: 'high' },
  correlationId: traceId,
});

await events.publishBatch([
  { type: 'inventory.reserved', data: { /* ... */ }, key: productId },
  { type: 'order.confirmed', data: { /* ... */ }, key: orderId },
]);

// --- Subscribing ---

events.subscribe('order.created', async (event) => {
  await updateAnalytics(event.data);
});

events.subscribe('order.*', async (event) => {
  await processOrder(event);
}, {
  group: 'order-processor',
  concurrency: 10,
  maxRetries: 3,
  retryDelay: [1000, 5000, 30000],
});

events.subscribe(
  ['order.created', 'order.updated', 'order.cancelled'],
  handler,
  { group: 'order-projector' }
);

// --- Replay ---

await events.replay('order.created', {
  from: new Date('2026-01-01'),
  to: new Date('2026-02-01'),
  handler: async (event) => {
    await rebuildOrderProjection(event);
  },
  concurrency: 5,
  onProgress: (count, total) => {
    console.log(`Replayed ${count}/${total} events`);
  },
});

// --- Dead Letter Queue ---

const dlqEvents = await events.dlq.list({
  topic: 'mcv.orders',
  group: 'order-processor',
  limit: 50,
});

await events.dlq.retry(dlqEventId);

await events.dlq.retryAll({
  topic: 'mcv.orders',
  group: 'order-processor',
});

await events.dlq.purge({ olderThan: '30d' });
```

### Consumer Group Patterns

```typescript
// Pattern 1: Competing Consumers
events.subscribe('order.created', processOrder, {
  group: 'order-processor',
});

// Pattern 2: Fan-Out
events.subscribe('order.created', updateAnalytics, { group: 'analytics' });
events.subscribe('order.created', sendConfirmation, { group: 'notifications' });
events.subscribe('order.created', updateInventory, { group: 'inventory' });
events.subscribe('order.created', logAuditTrail, { group: 'audit' });

// Pattern 3: Event Sourcing
events.subscribe('order.*', async (event) => {
  switch (event.type) {
    case 'order.created':
      await orderProjection.create(event.data);
      break;
    case 'order.updated':
      await orderProjection.update(event.data);
      break;
    case 'order.cancelled':
      await orderProjection.cancel(event.data);
      break;
  }
}, { group: 'order-projection' });
```

### Error Handling & Retry

```typescript
interface EventRetryPolicy {
  maxRetries: number;
  retryDelay: number | number[];
  retryableErrors: string[];
  nonRetryableErrors: string[];
  onExhausted: 'dlq' | 'discard' | 'alert';
}

// Default retry behavior:
// Attempt 1: Immediate
// Attempt 2: 1 second delay
// Attempt 3: 5 seconds delay
// Attempt 4: 30 seconds delay
// After 4 failures: -> Dead Letter Queue + alert

events.subscribe('payment.processed', processPayment, {
  group: 'payment-handler',
  maxRetries: 5,
  retryDelay: [1000, 5000, 30000, 120000, 600000],
  nonRetryableErrors: ['ValidationError', 'NotFoundError'],
  onExhausted: 'dlq',
});
```

---

## Submodule: flags

### Purpose

The **flags** submodule provides a feature flag and experimentation system for gradual rollouts, A/B testing, and kill switches. Feature flags decouple deployment from release — code ships to production behind a flag and is enabled incrementally.

Flags are **venture-scoped** by default, allowing per-venture feature enablement. This is essential for MCV.ONE's multi-tenant model where different ventures may be on different plans with different features.

### Architecture

```
+--------------------------------------------------------------+
|                     Flag Evaluation                           |
|                                                               |
|  flags.isEnabled() . flags.getValue() . flags.getAll()       |
+--------------------------------------------------------------+
|                                                               |
|  +------------------------------------------------------+    |
|  |              Flag Evaluation Engine                    |    |
|  |                                                       |    |
|  |  1. Check overrides (dev/test)                        |    |
|  |  2. Check kill switches                               |    |
|  |  3. Evaluate targeting rules                          |    |
|  |  4. Evaluate percentage rollout                       |    |
|  |  5. Return default value                              |    |
|  +------------------------+-----------------------------+    |
|                           |                                   |
|  +------------------------v-----------------------------+    |
|  |              Flag Store (with cache)                  |    |
|  |                                                       |    |
|  |  - Flags cached in memory (refreshed every 30s)       |    |
|  |  - Redis as L2 cache                                  |    |
|  |  - PostgreSQL as source of truth                      |    |
|  |  - Real-time updates via WebSocket                    |    |
|  +------------------------------------------------------+    |
|                                                               |
|  +------------------------------------------------------+    |
|  |              Experiment Engine                         |    |
|  |                                                       |    |
|  |  - Deterministic hashing (consistent assignment)       |    |
|  |  - Variant tracking                                   |    |
|  |  - Metrics integration                                |    |
|  |  - Statistical significance calculation               |    |
|  +------------------------------------------------------+    |
+--------------------------------------------------------------+
```

### Data Model

```typescript
interface FeatureFlag {
  id: string;
  key: string;                 // "new-checkout-flow"
  name: string;                // "New Checkout Flow"
  description: string;

  type: 'boolean' | 'string' | 'number' | 'json';
  defaultValue: FlagValue;

  enabled: boolean;
  archived: boolean;

  targeting: TargetingConfig;

  ventureId: string | null;    // null = global flag
  tags: string[];
  owner: string;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  staleTimeout: number | null; // Days before stale alert
}

type FlagValue = boolean | string | number | Record<string, unknown>;

interface TargetingConfig {
  rules: TargetingRule[];
  percentage: number | null;   // Percentage rollout (0-100)
  seed: string;                // Deterministic hash seed
}

interface TargetingRule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  value: FlagValue;
  priority: number;
}

interface RuleCondition {
  attribute: string;           // "userId", "ventureId", "plan", "email"
  operator: ConditionOperator;
  value: unknown;
}

type ConditionOperator =
  | 'eq' | 'neq'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in' | 'notIn'
  | 'contains' | 'startsWith' | 'endsWith'
  | 'matches';
```

### Database Schema

```typescript
export const featureFlags = pgTable('fabric_feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),

  type: varchar('type', { length: 20 }).notNull().default('boolean'),
  defaultValue: jsonb('default_value').notNull(),

  enabled: boolean('enabled').notNull().default(false),
  archived: boolean('archived').notNull().default(false),

  targeting: jsonb('targeting').$type<TargetingConfig>().notNull()
    .default({ rules: [], percentage: null, seed: '' }),

  ventureId: uuid('venture_id'),
  tags: jsonb('tags').$type<string[]>().default([]),
  owner: varchar('owner', { length: 255 }),

  staleTimeout: integer('stale_timeout'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').notNull(),
}, (table) => ({
  keyVentureIdx: index('flags_key_venture_idx')
    .on(table.key, table.ventureId).unique(),
  enabledIdx: index('flags_enabled_idx').on(table.enabled),
}));

export const flagOverrides = pgTable('fabric_flag_overrides', {
  id: uuid('id').primaryKey().defaultRandom(),
  flagId: uuid('flag_id').notNull().references(() => featureFlags.id),
  targetType: varchar('target_type', { length: 20 }).notNull(),
  targetId: varchar('target_id', { length: 255 }).notNull(),
  value: jsonb('value').notNull(),
  reason: text('reason'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').notNull(),
});

export const experiments = pgTable('fabric_experiments', {
  id: uuid('id').primaryKey().defaultRandom(),
  flagId: uuid('flag_id').notNull().references(() => featureFlags.id),
  name: varchar('name', { length: 255 }).notNull(),
  hypothesis: text('hypothesis'),
  variants: jsonb('variants').$type<ExperimentVariant[]>().notNull(),
  metrics: jsonb('metrics').$type<string[]>().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  results: jsonb('results').$type<ExperimentResults>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').notNull(),
});
```

### Core API

```typescript
// --- Flag Evaluation ---

if (await flags.isEnabled('new-checkout-flow', { userId, ventureId })) {
  renderNewCheckout();
} else {
  renderClassicCheckout();
}

const variant = await flags.getValue<string>('pricing-page', {
  userId, ventureId,
});

const allFlags = await flags.getAll({ userId, ventureId });

// --- Flag Management ---

await flags.create({
  key: 'new-checkout-flow',
  name: 'New Checkout Flow',
  description: 'Streamlined single-page checkout',
  type: 'boolean',
  defaultValue: false,
  owner: 'checkout-team',
  tags: ['checkout', 'ux'],
});

await flags.updateTargeting('new-checkout-flow', {
  rules: [
    {
      name: 'Beta users',
      conditions: [
        { attribute: 'plan', operator: 'in', value: ['pro', 'enterprise'] },
      ],
      value: true,
      priority: 1,
    },
    {
      name: 'Internal team',
      conditions: [
        { attribute: 'email', operator: 'endsWith', value: '@mcv.one' },
      ],
      value: true,
      priority: 2,
    },
  ],
  percentage: 25,
});

await flags.enable('new-checkout-flow');
await flags.disable('new-checkout-flow'); // Kill switch

// --- Overrides ---

await flags.setOverride('new-checkout-flow', {
  targetType: 'user',
  targetId: userId,
  value: true,
  reason: 'QA testing',
  expiresAt: new Date('2026-03-01'),
});

await flags.removeOverride('new-checkout-flow', {
  targetType: 'user', targetId: userId,
});

// --- Experiments ---

const experiment = await flags.createExperiment({
  flagKey: 'pricing-page',
  name: 'Pricing Page Optimization',
  hypothesis: 'Showing annual pricing first increases conversion by 15%',
  variants: [
    { key: 'control', name: 'Monthly First', weight: 34, value: 'monthly-first' },
    { key: 'variant-a', name: 'Annual First', weight: 33, value: 'annual-first' },
    { key: 'variant-b', name: 'Toggle View', weight: 33, value: 'toggle' },
  ],
  metrics: ['conversion_rate', 'revenue_per_user', 'plan_selection'],
});

await flags.startExperiment(experiment.id);

await flags.trackExposure('pricing-page', {
  userId, variant: 'variant-a', timestamp: new Date(),
});

const results = await flags.getExperimentResults(experiment.id);
```

### Flag Evaluation Engine

The evaluation engine processes flags in a deterministic order:

```
1. Override check  -> If user/venture has an override, return it
2. Kill switch     -> If flag is disabled, return default
3. Rules           -> Evaluate targeting rules in priority order
4. Percentage      -> If no rule matches, check percentage rollout
5. Default         -> Return default value
```

```typescript
class FlagEvaluationEngine {
  async evaluate(
    flag: FeatureFlag,
    context: EvaluationContext
  ): Promise<FlagValue> {
    // 1. Check overrides
    const override = await this.getOverride(flag.id, context);
    if (override !== undefined) return override;

    // 2. Kill switch
    if (!flag.enabled) return flag.defaultValue;

    // 3. Targeting rules (in priority order)
    const sortedRules = [...flag.targeting.rules]
      .sort((a, b) => a.priority - b.priority);
    for (const rule of sortedRules) {
      if (this.evaluateRule(rule, context)) {
        return rule.value;
      }
    }

    // 4. Percentage rollout
    if (flag.targeting.percentage !== null) {
      const hash = this.deterministicHash(
        flag.targeting.seed,
        context.userId ?? context.sessionId
      );
      const bucket = hash % 100;
      if (bucket < flag.targeting.percentage) {
        return this.getTrueValue(flag);
      }
    }

    // 5. Default
    return flag.defaultValue;
  }

  private deterministicHash(seed: string, identifier: string): number {
    // MurmurHash3 -- fast, uniform distribution, deterministic
    return murmurhash3(seed + ':' + identifier) % 100;
  }
}
```

### Stale Flag Detection

```typescript
queue.cron('flags:stale-check', '0 9 * * 1', async () => {
  const staleFlags = await flags.findStale();
  for (const flag of staleFlags) {
    await notifications.send({
      userId: flag.owner,
      template: 'flag.stale',
      data: {
        flagKey: flag.key,
        flagName: flag.name,
        lastUpdated: flag.updatedAt,
        staleDays: differenceInDays(new Date(), flag.updatedAt),
      },
      channels: ['email', 'inapp'],
    });
  }
});
```

---

## Submodule: notifications

### Purpose

The **notifications** submodule provides omnichannel notification delivery — email, SMS, push notifications, in-app messages, and WhatsApp. It handles template rendering, user preferences, delivery tracking, batching/digest, and multi-language support.

### Architecture

```
+--------------------------------------------------------------------+
|                    Notification Request                              |
|  notifications.send() . notifications.broadcast()                   |
+--------------------------------------------------------------------+
|                                                                     |
|  +--------------------------------------------------------------+  |
|  |                Template Engine                                |  |
|  |                                                               |  |
|  |  - Handlebars/MJML templates                                  |  |
|  |  - Variable interpolation                                     |  |
|  |  - Conditional sections                                       |  |
|  |  - Localization (i18n)                                        |  |
|  |  - Per-channel templates (email HTML vs SMS text)             |  |
|  +------------------------------+-------------------------------+  |
|                                 |                                    |
|  +------------------------------v-------------------------------+  |
|  |              Preference Engine                                |  |
|  |                                                               |  |
|  |  - Channel preferences (email: on, SMS: off, push: on)       |  |
|  |  - Quiet hours (no notifications 10pm-8am)                   |  |
|  |  - Frequency caps (max 5 emails/day)                         |  |
|  |  - Category preferences (marketing: off, transactional: on)  |  |
|  |  - Digest mode (batch notifications into daily summary)       |  |
|  +------------------------------+-------------------------------+  |
|                                 |                                    |
|  +------------------------------v-------------------------------+  |
|  |              Channel Router                                   |  |
|  |                                                               |  |
|  |  Determines which channels to use based on:                   |  |
|  |  - Notification priority (critical overrides quiet hours)     |  |
|  |  - User preferences                                          |  |
|  |  - Channel availability                                      |  |
|  |  - Fallback rules (push failed -> try email)                 |  |
|  +----------+----------+----------+-----------+-----------------+  |
|             |          |          |           |                      |
|             v          v          v           v                     |
|  +----------+  +------+--+  +---+----+  +---+------+              |
|  |   Email   |  |   SMS   |  |  Push  |  |  In-App  |              |
|  | SendGrid  |  | Twilio  |  |OneSign.|  |WebSocket |              |
|  | Resend    |  |         |  |Firebase|  |          |              |
|  | SES       |  |         |  |        |  |          |              |
|  +-----+-----+  +----+----+  +---+----+  +----+-----+              |
|        |             |           |            |                      |
|        +-------------+-----------+------------+                      |
|                      v                                               |
|  +--------------------------------------------------------------+  |
|  |              Delivery Tracker                                 |  |
|  |                                                               |  |
|  |  - Delivery status (queued -> sent -> delivered -> read)      |  |
|  |  - Bounce/failure handling                                    |  |
|  |  - Analytics (open rates, click rates)                        |  |
|  |  - Webhook receivers for provider callbacks                   |  |
|  +--------------------------------------------------------------+  |
+--------------------------------------------------------------------+
```

### Data Model

```typescript
interface Notification {
  id: string;
  ventureId: string;
  userId: string;

  template: string;
  data: Record<string, unknown>;
  locale: string;

  channels: NotificationChannel[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  category: 'transactional' | 'marketing' | 'system' | 'security';

  deduplicationKey: string | null;
  expiresAt: Date | null;
  scheduledAt: Date | null;

  status: NotificationStatus;
  deliveries: NotificationDelivery[];

  createdAt: Date;
  sentAt: Date | null;
  readAt: Date | null;
}

type NotificationChannel = 'email' | 'sms' | 'push' | 'inapp' | 'whatsapp';

type NotificationStatus =
  | 'pending'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'cancelled'
  | 'expired';

interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  status: 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed'
        | 'opened' | 'clicked';
  providerMessageId: string | null;
  providerResponse: Record<string, unknown> | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  metadata: Record<string, unknown>;
}

interface NotificationPreferences {
  userId: string;
  ventureId: string;

  channels: {
    email: ChannelPreference;
    sms: ChannelPreference;
    push: ChannelPreference;
    inapp: ChannelPreference;
    whatsapp: ChannelPreference;
  };

  categories: {
    transactional: boolean;
    marketing: boolean;
    system: boolean;
    security: boolean;
  };

  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
    exceptCritical: boolean;
  };

  digest: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    time: string;
    dayOfWeek: number | null;
  };

  frequencyCap: {
    maxPerDay: number;
    maxPerHour: number;
    excludeCategories: string[];
  };
}

interface ChannelPreference {
  enabled: boolean;
  verified: boolean;
  address: string | null;
}
```

### Database Schema

```typescript
export const notifications = pgTable('fabric_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull(),

  template: varchar('template', { length: 100 }).notNull(),
  data: jsonb('data').notNull().default({}),
  locale: varchar('locale', { length: 10 }).notNull().default('en'),

  channels: jsonb('channels').$type<NotificationChannel[]>().notNull(),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'),
  category: varchar('category', { length: 20 }).notNull().default('transactional'),

  deduplicationKey: varchar('deduplication_key', { length: 255 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),

  status: varchar('status', { length: 20 }).notNull().default('pending'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  readAt: timestamp('read_at', { withTimezone: true }),
}, (table) => ({
  userStatusIdx: index('notif_user_status_idx')
    .on(table.ventureId, table.userId, table.status),
  statusIdx: index('notif_status_idx').on(table.status),
  dedupeIdx: index('notif_dedupe_idx')
    .on(table.deduplicationKey).unique(),
  scheduledIdx: index('notif_scheduled_idx').on(table.scheduledAt),
}));

export const notificationDeliveries = pgTable('fabric_notification_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  notificationId: uuid('notification_id').notNull()
    .references(() => notifications.id),
  channel: varchar('channel', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('queued'),
  providerMessageId: varchar('provider_message_id', { length: 255 }),
  providerResponse: jsonb('provider_response'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  clickedAt: timestamp('clicked_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  metadata: jsonb('metadata').default({}),
});

export const notificationPreferences = pgTable('fabric_notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull(),
  preferences: jsonb('preferences').$type<NotificationPreferences>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userVentureIdx: index('notif_pref_user_venture_idx')
    .on(table.ventureId, table.userId).unique(),
}));

export const notificationTemplates = pgTable('fabric_notification_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id'),
  key: varchar('key', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 20 }).notNull(),
  email: jsonb('email').$type<EmailTemplate>(),
  sms: jsonb('sms').$type<SmsTemplate>(),
  push: jsonb('push').$type<PushTemplate>(),
  inapp: jsonb('inapp').$type<InAppTemplate>(),
  locales: jsonb('locales').$type<Record<string, LocalizedTemplate>>().default({}),
  variables: jsonb('variables').$type<TemplateVariable[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Core API

```typescript
// --- Sending ---

await notifications.send({
  userId,
  template: 'order.confirmed',
  data: {
    orderNumber: 'ORD-12345',
    total: '$99.99',
    items: order.items,
    estimatedDelivery: '2026-02-15',
  },
  channels: ['email', 'push', 'inapp'],
  priority: 'high',
  category: 'transactional',
});

await notifications.send({
  userId,
  template: 'weekly-digest',
  data: { highlights, stats },
  channels: 'preferred',
  category: 'marketing',
});

await notifications.broadcast({
  userIds: ventureUserIds,
  template: 'maintenance-notice',
  data: {
    maintenanceWindow: 'Feb 15, 2am-4am EST',
    affectedServices: ['API', 'Dashboard'],
  },
  priority: 'high',
  category: 'system',
});

await notifications.send({
  userId,
  template: 'cart-abandonment',
  data: { cartItems, cartTotal },
  channels: ['email'],
  category: 'marketing',
  scheduledAt: addHours(new Date(), 2),
  expiresAt: addHours(new Date(), 24),
});

// --- Preferences ---

const prefs = await notifications.getPreferences(userId);

await notifications.updatePreferences(userId, {
  channels: {
    email: { enabled: true },
    sms: { enabled: false },
    push: { enabled: true },
  },
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'America/Toronto',
    exceptCritical: true,
  },
  digest: {
    enabled: true,
    frequency: 'daily',
    time: '09:00',
  },
});

await notifications.unsubscribe(userId, 'marketing');

// --- Delivery Tracking ---

const status = await notifications.getDeliveryStatus(notificationId);

const history = await notifications.getHistory(userId, {
  limit: 50,
  category: 'transactional',
  status: 'delivered',
});

await notifications.markRead(notificationId, userId);
await notifications.markAllRead(userId);

// --- Templates ---

await notifications.upsertTemplate({
  key: 'order.confirmed',
  name: 'Order Confirmation',
  category: 'transactional',
  variables: [
    { name: 'orderNumber', type: 'string', required: true },
    { name: 'total', type: 'string', required: true },
    { name: 'items', type: 'array', required: true },
  ],
  email: {
    subject: 'Order {{orderNumber}} Confirmed!',
    html: '<h1>Thanks for your order!</h1><p>Order #{{orderNumber}}</p>...',
    text: 'Thanks for your order! Order #{{orderNumber}}...',
  },
  sms: {
    body: 'Order {{orderNumber}} confirmed! Total: {{total}}',
  },
  push: {
    title: 'Order Confirmed',
    body: 'Your order #{{orderNumber}} has been confirmed',
    icon: 'order-icon',
    action: '/orders/{{orderNumber}}',
  },
  inapp: {
    title: 'Order Confirmed',
    body: 'Your order #{{orderNumber}} ({{total}}) has been confirmed',
    action: '/orders/{{orderNumber}}',
    icon: 'check-circle',
  },
});

const preview = await notifications.previewTemplate('order.confirmed', {
  orderNumber: 'ORD-12345',
  total: '$99.99',
  items: [{ name: 'Widget', quantity: 2 }],
});
```

### Digest System

```typescript
queue.cron('notifications:digest', '0 * * * *', async () => {
  const usersWithDigest = await notifications.getUsersWithPendingDigest();

  for (const user of usersWithDigest) {
    const pending = await notifications.getPendingDigest(user.id);
    if (pending.length > 0) {
      await notifications.send({
        userId: user.id,
        template: 'digest',
        data: {
          notifications: pending,
          count: pending.length,
          period: user.preferences.digest.frequency,
        },
        channels: ['email'],
        category: 'system',
        bypassDigest: true,
      });
      await notifications.markDigestSent(
        user.id, pending.map(n => n.id)
      );
    }
  }
});
```


## Submodule: queue

### Purpose

The **queue** submodule provides background job processing with scheduling, retry policies, priority queues, and monitoring. It decouples time-consuming operations (email sending, image processing, report generation) from request handling, ensuring fast API responses.

### Architecture

```
+--------------------------------------------------------------+
|                     Job Producers                             |
|  queue.add() . queue.schedule() . queue.cron()               |
+--------------------------------------------------------------+
|                                                               |
|  +------------------------------------------------------+    |
|  |              Queue Manager                            |    |
|  |                                                       |    |
|  |  - Named queues (email, image-processing, reports)    |    |
|  |  - Priority queues (critical -> high -> normal -> low)|    |
|  |  - Rate-limited queues (max N jobs/second)            |    |
|  |  - Delayed/scheduled jobs                             |    |
|  |  - Recurring (cron) jobs                              |    |
|  +------------------------+-----------------------------+    |
|                           |                                   |
|  +------------------------v-----------------------------+    |
|  |              Job Workers                              |    |
|  |                                                       |    |
|  |  - Concurrent processing (configurable per queue)     |    |
|  |  - Sandboxed execution                                |    |
|  |  - Graceful shutdown (finish current job)             |    |
|  |  - Health checks                                      |    |
|  +------------------------+-----------------------------+    |
|                           |                                   |
|         +-----------------+-----------------+                 |
|         v                 v                 v                 |
|  +------------+    +------------+    +------------+           |
|  |  Retry     |    |  Backoff   |    |  Dead      |           |
|  |  Engine    |    |  Strategy  |    |  Letter Q  |           |
|  |            |    |            |    |            |           |
|  |  - Fixed   |    |  - Exp.   |    |  - Store   |           |
|  |  - Exp.    |    |  - Linear |    |  - Alert   |           |
|  |  - Custom  |    |  - Custom |    |  - Retry   |           |
|  +------------+    +------------+    +------------+           |
|                                                               |
|  +------------------------------------------------------+    |
|  |              Job Monitor                              |    |
|  |                                                       |    |
|  |  - Active/waiting/completed/failed counts             |    |
|  |  - Processing rate                                    |    |
|  |  - Average duration                                   |    |
|  |  - Error rates                                        |    |
|  |  - Worker health                                      |    |
|  +------------------------------------------------------+    |
+--------------------------------------------------------------+
```

### Data Model

```typescript
interface Job<T = unknown> {
  id: string;
  name: string;                // Job type: "send-email"
  queue: string;               // Queue name: "email"
  data: T;                     // Job payload
  priority: number;            // Lower = higher priority (1 = critical)

  createdAt: Date;
  processedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  delay: number | null;

  attemptsMade: number;
  maxRetries: number;
  retryDelay: number[];

  status: JobStatus;
  progress: number;            // 0-100
  result: unknown | null;
  error: string | null;
  stackTrace: string | null;

  ventureId: string;
  correlationId: string | null;
}

type JobStatus =
  | 'waiting'
  | 'delayed'
  | 'active'
  | 'completed'
  | 'failed'
  | 'dead';

interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: BackoffStrategy;
  timeout?: number;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  deduplication?: {
    key: string;
    ttl: number;
  };
}

interface BackoffStrategy {
  type: 'fixed' | 'exponential' | 'linear' | 'custom';
  delay: number;
  maxDelay?: number;
  factor?: number;
}
```

### Database Schema (Shadow Table)

```typescript
// BullMQ uses Redis for job storage; we keep a shadow in PostgreSQL
// for monitoring, analytics, and historical queries

export const jobHistory = pgTable('fabric_job_history', {
  id: uuid('id').primaryKey(),
  ventureId: uuid('venture_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  queue: varchar('queue', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  priority: integer('priority').notNull().default(0),
  data: jsonb('data').notNull(),
  result: jsonb('result'),
  error: text('error'),
  attemptsMade: integer('attempts_made').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(3),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  duration: integer('duration'), // Processing time in ms
  correlationId: uuid('correlation_id'),
}, (table) => ({
  ventureStatusIdx: index('job_history_venture_status_idx')
    .on(table.ventureId, table.status),
  nameIdx: index('job_history_name_idx')
    .on(table.name, table.status),
  createdAtIdx: index('job_history_created_idx')
    .on(table.createdAt),
}));
```

### Core API

```typescript
// --- Job Registration ---

queue.process('send-email', async (job) => {
  const { to, subject, html, text } = job.data;
  job.updateProgress(10);
  const result = await emailProvider.send({ to, subject, html, text });
  job.updateProgress(100);
  return { messageId: result.id, provider: 'sendgrid' };
}, {
  concurrency: 10,
  limiter: { max: 100, duration: 60_000 },
});

queue.process<ImageProcessingJob>('process-image', async (job) => {
  const { fileId, operations } = job.data;
  const file = await storage.download(fileId);
  for (let i = 0; i < operations.length; i++) {
    await applyOperation(file, operations[i]);
    job.updateProgress(((i + 1) / operations.length) * 100);
  }
  await storage.upload(fileId, file);
  return { processedOperations: operations.length };
});

// --- Enqueueing ---

const job = await queue.add('send-email', {
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome aboard!</h1>',
  text: 'Welcome aboard!',
});

await queue.add('send-email', emailData, {
  priority: 1,
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000,
    factor: 2,
    maxDelay: 60_000,
  },
  timeout: 30_000,
  deduplication: {
    key: `email:${userId}:welcome`,
    ttl: 86400,
  },
});

await queue.add('send-reminder', reminderData, {
  delay: 24 * 60 * 60 * 1000,
});

// --- Scheduled / Cron Jobs ---

await queue.cron('daily-report', '0 9 * * *', async () => {
  const report = await generateDailyReport();
  await notifications.send({
    userId: adminUserId,
    template: 'daily-report',
    data: report,
  });
});

await queue.cron('cleanup-temp-files', '0 3 * * *', async () => {
  await storage.cleanupTemp({ olderThan: '24h' });
});

await queue.cron('refresh-search-index', '*/15 * * * *', async () => {
  await search.refreshStaleIndices();
});

// --- Job Management ---

const jobStatus = await queue.getJob(jobId);
await queue.cancelJob(jobId);
await queue.pause('send-email');
await queue.resume('send-email');

const stats = await queue.getStats('send-email');
// { waiting: 42, active: 10, completed: 1234, failed: 5, delayed: 3 }

// --- Monitoring ---

const queues = await queue.listQueues();
const failedJobs = await queue.getFailed('send-email', { limit: 50 });
await queue.retryJob(jobId);
await queue.retryAllFailed('send-email');
await queue.clean('send-email', { status: 'completed', olderThan: '7d' });
```

### Retry Strategies

```typescript
// Fixed Delay -- same delay every time
{ type: 'fixed', delay: 5000 }
// 5s, 5s, 5s...

// Exponential Backoff -- double the delay each time
{ type: 'exponential', delay: 1000, factor: 2, maxDelay: 60000 }
// 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s...

// Linear Backoff -- add fixed increment each time
{ type: 'linear', delay: 1000 }
// 1s, 2s, 3s, 4s, 5s...

// Custom Delay Array -- explicit delays for each retry
{ type: 'custom', delays: [1000, 5000, 30000, 120000, 600000] }
// 1s, 5s, 30s, 2m, 10m
```

### Priority Queues

```typescript
const PRIORITIES = {
  CRITICAL: 1,    // System-critical (payment processing)
  HIGH: 5,        // User-facing (email confirmation)
  NORMAL: 10,     // Standard (analytics processing)
  LOW: 20,        // Background (cleanup, optimization)
  BULK: 50,       // Bulk operations (mass email)
};

await queue.add('process-payment', paymentData, {
  priority: PRIORITIES.CRITICAL,
});

await queue.add('optimize-images', imageData, {
  priority: PRIORITIES.LOW,
});
```

---

## Submodule: realtime

### Purpose

The **realtime** submodule provides live, bidirectional communication between the server and clients via WebSocket. Built on **Supabase Realtime**, it supports channel-based pub/sub, presence tracking (who's online), typing indicators, database change subscriptions, and broadcast messaging.

### Architecture

```
+--------------------------------------------------------------------+
|                     Client Applications                             |
|  Browser . Mobile . Desktop                                        |
+--------------------------------------------------------------------+
|                                                                     |
|  +--------------------------------------------------------------+  |
|  |              WebSocket Connection Manager                     |  |
|  |                                                               |  |
|  |  - Connection pooling                                         |  |
|  |  - Automatic reconnection                                     |  |
|  |  - Heartbeat/keepalive                                        |  |
|  |  - Authentication (JWT validation)                            |  |
|  |  - Venture-scoped channels                                    |  |
|  +------------------------------+-------------------------------+  |
|                                 |                                    |
|  +------------------------------v-------------------------------+  |
|  |              Channel Manager                                  |  |
|  |                                                               |  |
|  |  Channels:                                                    |  |
|  |  +-------------+ +-------------+ +---------------------+     |  |
|  |  |  orders     | |  chat:room1 | |  dashboard:venture1 |     |  |
|  |  +-------------+ +-------------+ +---------------------+     |  |
|  |                                                               |  |
|  |  - Channel authorization (who can join)                       |  |
|  |  - Message routing                                            |  |
|  |  - Presence tracking per channel                              |  |
|  +--------------------------------------------------------------+  |
|                                                                     |
|  +-----------------+ +-----------------+ +--------------------+     |
|  |   Presence      | |   Broadcast     | |  DB Change Sub.   |     |
|  |                 | |                 | |                    |     |
|  | - Online/offline| | - Send to all   | | - INSERT/UPDATE/  |     |
|  | - Custom state  | |   in channel    | |   DELETE triggers |     |
|  | - Sync/diff     | | - Typing, etc.  | | - Row-level sub.  |     |
|  +-----------------+ +-----------------+ +--------------------+     |
|                                                                     |
|  +--------------------------------------------------------------+  |
|  |              Supabase Realtime Engine                         |  |
|  |  (Phoenix channels . PostgreSQL logical replication)          |  |
|  +--------------------------------------------------------------+  |
+--------------------------------------------------------------------+
```

### Data Model

```typescript
interface RealtimeChannel {
  name: string;                // "orders", "chat:room-123"
  ventureId: string;
  access: 'public' | 'authenticated' | 'private';
  allowedRoles: string[];
  presenceEnabled: boolean;
  presenceState: Map<string, PresenceEntry>;
  subscribers: Set<string>;
}

interface PresenceEntry {
  userId: string;
  connectionId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  metadata: Record<string, unknown>;
}

interface RealtimeMessage {
  type: string;
  payload: unknown;
  channel: string;
  sender: string | null;
  timestamp: Date;
}

interface DatabaseChange<T = unknown> {
  table: string;
  schema: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  old: T | null;
  new: T | null;
  timestamp: Date;
  commitTimestamp: Date;
}
```

### Core API

```typescript
// --- Channel Management ---

const channel = realtime.channel('orders', {
  ventureId,
  access: 'authenticated',
});

channel.on('order.created', (payload) => {
  updateOrderList(payload);
});

channel.on('order.status-changed', (payload) => {
  updateOrderStatus(payload.orderId, payload.newStatus);
});

channel.off('order.created');
channel.unsubscribe();

// --- Presence ---

channel.track({
  userId: currentUser.id,
  status: 'online',
  displayName: currentUser.name,
  avatar: currentUser.avatarUrl,
  currentPage: '/dashboard',
});

channel.track({
  userId: currentUser.id,
  status: 'away',
});

const presence = channel.presenceState();

channel.onPresenceSync(() => {
  const onlineUsers = channel.presenceState();
  updateOnlineIndicators(onlineUsers);
});

channel.onPresenceJoin((key, current, newPresence) => {
  showToast(`${newPresence.displayName} is now online`);
});

channel.onPresenceLeave((key, current, leftPresence) => {
  showToast(`${leftPresence.displayName} went offline`);
});

// --- Broadcast ---

channel.broadcast('typing', {
  userId: currentUser.id,
  isTyping: true,
});

channel.broadcast('cursor-move', {
  userId: currentUser.id,
  x: cursorX,
  y: cursorY,
  elementId: selectedElement,
});

channel.on('broadcast:typing', (payload) => {
  showTypingIndicator(payload.userId, payload.isTyping);
});

// --- Database Change Subscriptions ---

realtime.onDatabaseChange('orders', '*', (change) => {
  console.log(`Order ${change.type}:`, change);
});

realtime.onDatabaseChange('orders', 'INSERT', (change) => {
  addToOrderList(change.new);
});

realtime.onDatabaseChange('orders', 'UPDATE', (change) => {
  updateOrderInList(change.new);
});

realtime.onDatabaseChange('orders', '*', (change) => {
  updateMyOrders(change);
}, {
  filter: `customer_id=eq.${currentUser.id}`,
});

// --- Server-Side Push ---

await realtime.push('orders', 'order.created', {
  orderId: order.id,
  customerName: order.customerName,
  total: order.total,
});

await realtime.pushToUser(userId, 'notification', {
  title: 'New message',
  body: 'You have a new message from John',
  action: '/messages/123',
});
```

### Connection Lifecycle

```typescript
const connection = realtime.connect({
  token: accessToken,
  ventureId,
});

connection.onConnect(() => { /* ... */ });
connection.onDisconnect((reason) => { /* ... */ });
connection.onError((error) => { /* ... */ });

realtime.configure({
  reconnect: {
    enabled: true,
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
  },
  heartbeat: {
    interval: 30000,
    timeout: 10000,
  },
});
```

### Channel Authorization

```typescript
realtime.authorize('orders', async (userId, ventureId, channelParams) => {
  const user = await identity.getUser(userId);
  if (!user) return { allowed: false };
  if (user.ventureId !== ventureId) return { allowed: false };

  const hasPermission = await identity.hasPermission(userId, 'orders.read');
  return {
    allowed: hasPermission,
    presenceKey: userId,
  };
});
```

---

## Submodule: search

### Purpose

The **search** submodule provides full-text search with faceting, typo tolerance, filters, and real-time indexing. Built on **Meilisearch** (with Typesense and PostgreSQL tsvector as alternative backends), it provides sub-50ms search across all indexed content with automatic venture scoping.

### Architecture

```
+--------------------------------------------------------------+
|                     Search API                                |
|  search.query() . search.index() . search.remove()          |
+--------------------------------------------------------------+
|                                                               |
|  +------------------------------------------------------+    |
|  |              Query Builder                            |    |
|  |                                                       |    |
|  |  - Full-text query parsing                            |    |
|  |  - Filter construction                                |    |
|  |  - Facet aggregation                                  |    |
|  |  - Venture-scoped filtering (automatic)               |    |
|  |  - Sort/rank customization                            |    |
|  +------------------------+-----------------------------+    |
|                           |                                   |
|  +------------------------v-----------------------------+    |
|  |              Search Provider                          |    |
|  |                                                       |    |
|  |  - Meilisearch (default -- fast, typo-tolerant)       |    |
|  |  - Typesense (alternative)                            |    |
|  |  - PostgreSQL tsvector (fallback, no extra infra)     |    |
|  +------------------------------------------------------+    |
|                                                               |
|  +------------------------------------------------------+    |
|  |              Indexer                                   |    |
|  |                                                       |    |
|  |  - Real-time indexing (on data change)                 |    |
|  |  - Bulk indexing (initial load, reindex)               |    |
|  |  - Index schema management                             |    |
|  |  - Synonym management                                  |    |
|  |  - Custom ranking rules                                |    |
|  +------------------------------------------------------+    |
+--------------------------------------------------------------+
```

### Data Model

```typescript
interface SearchIndexConfig {
  name: string;
  searchableFields: string[];
  filterableFields: string[];
  sortableFields: string[];
  facetFields: string[];
  displayFields: string[];
  highlightFields: string[];

  typoTolerance: {
    enabled: boolean;
    minWordSize: { oneTypo: number; twoTypos: number };
  };

  synonyms: Record<string, string[]>;
  stopWords: string[];

  rankingRules: string[];
  customRanking: Array<{ field: string; order: 'asc' | 'desc' }>;

  tenantField: string;         // Default: "ventureId"
}

interface SearchQuery {
  q: string;
  filters?: Record<string, FilterValue>;
  facets?: string[];
  limit?: number;
  offset?: number;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  highlightPreTag?: string;
  highlightPostTag?: string;
  ventureId?: string;
}

type FilterValue =
  | string | number | boolean
  | { min?: number; max?: number }
  | string[]
  | { not: string | number };

interface SearchResult<T = unknown> {
  hits: SearchHit<T>[];
  query: string;
  totalHits: number;
  processingTimeMs: number;
  facets?: Record<string, FacetResult>;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface SearchHit<T> {
  id: string;
  document: T;
  score: number;
  highlights: Record<string, string>;
}

interface FacetResult {
  values: Array<{ value: string; count: number }>;
  total: number;
}
```

### Core API

```typescript
// --- Index Management ---

await search.createIndex('products', {
  searchableFields: ['name', 'description', 'category', 'brand', 'tags'],
  filterableFields: ['category', 'brand', 'price', 'inStock', 'rating'],
  sortableFields: ['price', 'rating', 'createdAt', 'name'],
  facetFields: ['category', 'brand', 'priceRange', 'rating'],
  displayFields: ['name', 'description', 'price', 'image', 'rating'],
  highlightFields: ['name', 'description'],

  typoTolerance: {
    enabled: true,
    minWordSize: { oneTypo: 4, twoTypos: 8 },
  },

  synonyms: {
    'phone': ['mobile', 'cell phone', 'smartphone'],
    'laptop': ['notebook', 'computer'],
    'tv': ['television', 'monitor', 'screen'],
  },

  rankingRules: [
    'words', 'typo', 'proximity', 'attribute', 'sort', 'exactness',
  ],
  customRanking: [{ field: 'salesCount', order: 'desc' }],
});

// --- Indexing Documents ---

await search.index('products', {
  id: product.id,
  ventureId: product.ventureId,
  name: product.name,
  description: product.description,
  category: product.category.name,
  brand: product.brand,
  price: product.price,
  inStock: product.stockQuantity > 0,
  rating: product.averageRating,
  tags: product.tags,
  image: product.thumbnailUrl,
  createdAt: product.createdAt,
  salesCount: product.salesCount,
});

await search.bulkIndex('products', products.map(p => ({
  id: p.id,
  ventureId: p.ventureId,
  name: p.name,
  /* ... */
})));

await search.remove('products', productId);
await search.bulkRemove('products', productIds);

// --- Searching ---

const results = await search.query('products', {
  q: 'wireless headphones',
});

const results = await search.query('products', {
  q: 'wireless headphones',
  filters: {
    category: 'electronics',
    price: { min: 50, max: 200 },
    inStock: true,
    brand: ['Sony', 'Bose', 'Apple'],
  },
  facets: ['category', 'brand', 'priceRange'],
  sort: [{ field: 'rating', order: 'desc' }],
  limit: 20,
  offset: 0,
});

const results = await search.multiQuery([
  { index: 'products', q: 'wireless', limit: 5 },
  { index: 'articles', q: 'wireless', limit: 3 },
  { index: 'categories', q: 'wireless', limit: 2 },
]);

const suggestions = await search.suggest('products', {
  q: 'wire',
  limit: 5,
});

// --- Event-Driven Indexing ---

events.subscribe('product.created', async (event) => {
  await search.index('products', event.data);
});

events.subscribe('product.updated', async (event) => {
  await search.index('products', event.data);
});

events.subscribe('product.deleted', async (event) => {
  await search.remove('products', event.data.productId);
});

// --- Reindexing ---

await search.reindex('products', {
  source: async function* () {
    let cursor = null;
    while (true) {
      const batch = await db.query.products.findMany({
        limit: 1000,
        ...(cursor ? { where: gt(products.id, cursor) } : {}),
        orderBy: asc(products.id),
      });
      if (batch.length === 0) break;
      yield batch;
      cursor = batch[batch.length - 1].id;
    }
  },
  batchSize: 1000,
  onProgress: (indexed, total) => {
    console.log(`Reindexed ${indexed}/${total} products`);
  },
});
```

### Venture-Scoped Search

```typescript
// All searches are automatically scoped to the current venture.
// The ventureId filter is injected by the search service.

// What the developer writes:
const results = await search.query('products', {
  q: 'headphones',
  filters: { category: 'electronics' },
});

// What actually executes:
// Meilisearch query with filter:
// "ventureId = '{currentVentureId}' AND category = 'electronics'"

// For global searches (admin only), explicitly pass ventureId: null:
const globalResults = await search.query('products', {
  q: 'headphones',
  ventureId: null, // Requires fabric.search.global permission
});
```

---

## Submodule: storage

### Purpose

The **storage** submodule provides unified file storage with multi-backend support (S3, Supabase Storage, Cloudflare R2), automatic image optimization, signed URLs for private files, quota management, and CDN delivery. It handles everything from user avatar uploads to multi-gigabyte video files.

### Architecture

```
+------------------------------------------------------------------+
|                     Storage API                                   |
|  storage.upload() . storage.download() . storage.getSignedUrl()  |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------------------------------------------------+  |
|  |              Upload Manager                                |  |
|  |                                                             |  |
|  |  - Multipart upload handling                                |  |
|  |  - File validation (type, size, content)                    |  |
|  |  - Virus scanning (ClamAV integration)                      |  |
|  |  - Deduplication (content-hash based)                       |  |
|  |  - Progress tracking                                        |  |
|  +------------------------+-----------------------------------+  |
|                           |                                       |
|  +------------------------v-----------------------------------+  |
|  |              Processing Pipeline                            |  |
|  |                                                             |  |
|  |  +----------+  +----------+  +----------+  +----------+    |  |
|  |  |  Image   |  |  Video   |  |  PDF     |  |  Audio   |    |  |
|  |  | Processor|  |Transcoder|  |Processor |  |Processor |    |  |
|  |  |          |  |          |  |          |  |          |    |  |
|  |  | - Resize |  | - HLS   |  | - Preview|  | - Transc.|    |  |
|  |  | - Crop   |  | - Thumb  |  | - OCR    |  | - Wavefm.|    |  |
|  |  | - Format |  | - Comprs.|  | - Text   |  |          |    |  |
|  |  | - EXIF   |  |          |  |          |  |          |    |  |
|  |  +----------+  +----------+  +----------+  +----------+    |  |
|  +------------------------+-----------------------------------+  |
|                           |                                       |
|  +------------------------v-----------------------------------+  |
|  |              Storage Provider                               |  |
|  |                                                             |  |
|  |  +---------+  +----------------+  +--------------+          |  |
|  |  |   S3    |  | Supabase Store |  | Cloudflare R2|          |  |
|  |  +---------+  +----------------+  +--------------+          |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  +------------------------------------------------------------+  |
|  |              CDN / Delivery                                 |  |
|  |                                                             |  |
|  |  - Cloudflare CDN for public files                          |  |
|  |  - Signed URLs for private files                            |  |
|  |  - On-the-fly image transformation (Cloudflare Images)      |  |
|  |  - Range requests for video/audio streaming                 |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  +------------------------------------------------------------+  |
|  |              Quota Manager                                  |  |
|  |                                                             |  |
|  |  - Per-venture storage quotas                               |  |
|  |  - Usage tracking                                           |  |
|  |  - Overage alerts                                           |  |
|  |  - Auto-cleanup of temp files                               |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

### Data Model

```typescript
interface StorageFile {
  id: string;
  ventureId: string;

  bucket: string;
  path: string;

  filename: string;
  mimeType: string;
  size: number;
  checksum: string;

  visibility: 'public' | 'private';
  publicUrl: string | null;

  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  variants: FileVariant[];

  metadata: Record<string, unknown>;
  exif: Record<string, unknown> | null;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  expiresAt: Date | null;
}

interface FileVariant {
  name: string;
  path: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
}

interface BucketConfig {
  name: string;
  defaultVisibility: 'public' | 'private';
  allowedMimeTypes: string[];
  maxFileSize: number;
  imageVariants: ImageVariantConfig[];
  expiresAfter: number | null;
  maxTotalSize: number | null;
  maxFileCount: number | null;
}

interface ImageVariantConfig {
  name: string;
  width: number;
  height: number;
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  format: 'jpeg' | 'png' | 'webp' | 'avif';
  quality: number;
}
```

### Database Schema

```typescript
export const storageFiles = pgTable('fabric_storage_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  bucket: varchar('bucket', { length: 100 }).notNull(),
  path: varchar('path', { length: 1000 }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  checksum: varchar('checksum', { length: 64 }).notNull(),
  visibility: varchar('visibility', { length: 10 }).notNull().default('private'),
  publicUrl: varchar('public_url', { length: 2000 }),
  processingStatus: varchar('processing_status', { length: 20 })
    .notNull().default('pending'),
  variants: jsonb('variants').$type<FileVariant[]>().default([]),
  metadata: jsonb('metadata').default({}),
  exif: jsonb('exif'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => ({
  ventureBucketIdx: index('storage_venture_bucket_idx')
    .on(table.ventureId, table.bucket),
  pathIdx: index('storage_path_idx')
    .on(table.ventureId, table.bucket, table.path).unique(),
  checksumIdx: index('storage_checksum_idx')
    .on(table.ventureId, table.checksum),
  expiresIdx: index('storage_expires_idx').on(table.expiresAt),
}));

export const storageBuckets = pgTable('fabric_storage_buckets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id'),
  name: varchar('name', { length: 100 }).notNull(),
  config: jsonb('config').$type<BucketConfig>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameVentureIdx: index('storage_bucket_name_venture_idx')
    .on(table.name, table.ventureId).unique(),
}));

export const storageQuotas = pgTable('fabric_storage_quotas', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  totalSize: bigint('total_size', { mode: 'number' }).notNull().default(0),
  fileCount: integer('file_count').notNull().default(0),
  maxTotalSize: bigint('max_total_size', { mode: 'number' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ventureIdx: index('storage_quota_venture_idx')
    .on(table.ventureId).unique(),
}));
```

### Core API

```typescript
// --- Upload ---

const file = await storage.upload({
  bucket: 'avatars',
  path: `users/${userId}/avatar.jpg`,
  content: fileBuffer,
  contentType: 'image/jpeg',
  visibility: 'public',
  metadata: { uploadedFrom: 'profile-settings' },
});

const file = await storage.upload({
  bucket: 'products',
  path: `products/${productId}/main.jpg`,
  content: fileBuffer,
  contentType: 'image/jpeg',
  visibility: 'public',
  variants: [
    { name: 'thumbnail', width: 150, height: 150, fit: 'cover',
      format: 'webp', quality: 80 },
    { name: 'medium', width: 600, height: 600, fit: 'inside',
      format: 'webp', quality: 85 },
    { name: 'large', width: 1200, height: 1200, fit: 'inside',
      format: 'webp', quality: 90 },
  ],
});

// Multipart upload (for large files)
const upload = await storage.createMultipartUpload({
  bucket: 'media',
  path: `videos/${videoId}/original.mp4`,
  contentType: 'video/mp4',
});
for (const chunk of fileChunks) {
  await storage.uploadPart(upload.uploadId, chunk, partNumber);
}
await storage.completeMultipartUpload(upload.uploadId);

// Upload from URL
const file = await storage.uploadFromUrl({
  bucket: 'imports',
  path: `imports/${importId}/data.csv`,
  url: 'https://example.com/export.csv',
});

// --- Download / Access ---

const url = storage.getPublicUrl({
  bucket: 'avatars',
  path: `users/${userId}/avatar.jpg`,
});

const thumbnailUrl = storage.getPublicUrl({
  bucket: 'products',
  path: `products/${productId}/main.jpg`,
  variant: 'thumbnail',
});

const signedUrl = await storage.getSignedUrl({
  bucket: 'documents',
  path: `contracts/${contractId}.pdf`,
  expiresIn: 3600,
  download: true,
});

const buffer = await storage.download({
  bucket: 'documents',
  path: `contracts/${contractId}.pdf`,
});

const stream = await storage.stream({
  bucket: 'media',
  path: `videos/${videoId}/original.mp4`,
  range: { start: 0, end: 1048575 },
});

// --- File Management ---

const files = await storage.list({
  bucket: 'media',
  prefix: `products/${productId}/`,
  limit: 100,
});

const fileInfo = await storage.getInfo({
  bucket: 'avatars',
  path: `users/${userId}/avatar.jpg`,
});

await storage.move({
  from: { bucket: 'temp', path: 'uploads/temp-123.jpg' },
  to: { bucket: 'avatars', path: `users/${userId}/avatar.jpg` },
});

await storage.copy({
  from: { bucket: 'templates', path: 'default-avatar.jpg' },
  to: { bucket: 'avatars', path: `users/${userId}/avatar.jpg` },
});

await storage.delete({
  bucket: 'temp',
  path: 'uploads/temp-123.jpg',
});

await storage.bulkDelete({
  bucket: 'temp',
  paths: expiredPaths,
});

// --- Quotas ---

const quota = await storage.getQuota(ventureId);
// { used: 5_368_709_120, limit: 10_737_418_240, percentage: 50 }

const canUpload = await storage.checkQuota(ventureId, fileSize);
```

### Image Processing Pipeline

```typescript
queue.process('storage:process-image', async (job) => {
  const { fileId, variants } = job.data;
  const file = await storage.download(fileId);
  const image = sharp(file);
  const metadata = await image.metadata();

  await storage.updateMetadata(fileId, {
    exif: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      hasAlpha: metadata.hasAlpha,
    },
  });

  for (const variant of variants) {
    const processed = await image
      .resize(variant.width, variant.height, { fit: variant.fit })
      .toFormat(variant.format, { quality: variant.quality })
      .toBuffer();

    const variantPath = storage.getVariantPath(
      file.path, variant.name, variant.format
    );

    await storage.upload({
      bucket: file.bucket,
      path: variantPath,
      content: processed,
      contentType: `image/${variant.format}`,
      visibility: file.visibility,
    });

    job.updateProgress(
      (variants.indexOf(variant) + 1) / variants.length * 100
    );
  }

  await storage.updateProcessingStatus(fileId, 'completed');
});
```

### Event Integration

```typescript
events.subscribe('storage.file.uploaded', async (event) => {
  const { fileId, bucket, path, mimeType } = event.data;

  if (bucket === 'documents') {
    await search.index('documents', {
      id: fileId,
      filename: event.data.filename,
      mimeType,
      uploadedBy: event.data.createdBy,
    });
  }

  await audit.log({
    action: 'storage.file.uploaded',
    resource: { type: 'files', id: fileId },
    metadata: { bucket, path, size: event.data.size },
  });
});

events.subscribe('storage.file.deleted', async (event) => {
  await search.remove('documents', event.data.fileId);
  await cache.invalidateByTag(`file:${event.data.fileId}`);
});
```

---

## Cross-Module Integration

Fabric submodules form a cohesive infrastructure layer through event-driven integration. Here are the key integration patterns:

### Integration Map

```
+-------------------------------------------------------------+
|                    Cross-Module Integration                   |
|                                                               |
|  events ----------> audit        (event-sourced audit trail)  |
|  events ----------> search       (real-time index updates)    |
|  events ----------> cache        (event-driven invalidation)  |
|                                                               |
|  notifications ---> queue        (async delivery via jobs)    |
|  notifications ---> realtime     (in-app via WebSocket)       |
|  notifications ---> events       (delivery events)            |
|                                                               |
|  storage ---------> events       (upload/delete events)       |
|  storage ---------> queue        (async image processing)     |
|  storage ---------> search       (file indexing)              |
|  storage ---------> audit        (access logging)             |
|                                                               |
|  cache -----------> search       (cached search results)      |
|                                                               |
|  flags -----------> events       (flag change events)         |
|  flags -----------> cache        (flag evaluation cache)      |
|  flags -----------> audit        (flag change audit)          |
|                                                               |
|  queue -----------> events       (job lifecycle events)       |
|  queue -----------> audit        (job execution audit)        |
+-------------------------------------------------------------+
```

### Pattern 1: Event-Sourced Audit Trail

```typescript
events.subscribe('*', async (event) => {
  await audit.log({
    action: event.type,
    category: 'data',
    resource: {
      type: extractResourceType(event.type),
      id: event.data.id
        || event.data[`${extractResourceType(event.type)}Id`],
    },
    metadata: {
      eventId: event.id,
      source: event.source,
      correlationId: event.correlationId,
    },
  });
}, { group: 'fabric:audit' });
```

### Pattern 2: Async Notification Delivery

```typescript
notifications.send = async (options) => {
  const notification = await createNotificationRecord(options);

  for (const channel of resolvedChannels) {
    await queue.add('notification:deliver', {
      notificationId: notification.id,
      channel,
      userId: options.userId,
      template: options.template,
      data: options.data,
    }, {
      priority: priorityMap[options.priority],
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }

  return notification;
};
```

### Pattern 3: Storage -> Processing -> Indexing Pipeline

```typescript
// 1. Upload -> 2. Process -> 3. Index -> 4. Notify

const file = await storage.upload({ bucket, path, content, contentType });
// -> Emits: storage.file.uploaded

events.subscribe('storage.file.uploaded', async (event) => {
  if (event.data.mimeType.startsWith('image/')) {
    await queue.add('storage:process-image', {
      fileId: event.data.fileId,
      variants: [ /* ... */ ],
    });
  }
}, { group: 'fabric:storage-processor' });

events.subscribe('storage.file.processed', async (event) => {
  await search.index('files', {
    id: event.data.fileId,
    filename: event.data.filename,
    mimeType: event.data.mimeType,
    size: event.data.size,
    bucket: event.data.bucket,
  });
}, { group: 'fabric:storage-indexer' });

events.subscribe('storage.file.processed', async (event) => {
  await notifications.send({
    userId: event.data.createdBy,
    template: 'file.processed',
    data: { filename: event.data.filename },
    channels: ['inapp'],
  });
}, { group: 'fabric:storage-notifier' });
```

### Pattern 4: Cache Invalidation via Events

```typescript
events.subscribe('product.updated', async (event) => {
  await cache.invalidateByTag(`product:${event.data.productId}`);
  await cache.invalidateByTag('product-lists');
}, { group: 'fabric:cache-invalidator' });

events.subscribe('user.updated', async (event) => {
  await cache.invalidateByTag(`user:${event.data.userId}`);
}, { group: 'fabric:cache-invalidator' });
```

---

## Key Interfaces

### Provider Interface (Base)

```typescript
interface FabricProvider {
  readonly name: string;
  readonly type: string;
  initialize(config: Record<string, unknown>): Promise<void>;
  healthCheck(): Promise<HealthCheckResult>;
  shutdown(): Promise<void>;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  details: Record<string, unknown>;
}
```

### Service Interface (Base)

```typescript
interface FabricService {
  readonly name: string;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  healthCheck(): Promise<HealthCheckResult>;
  getMetrics(): Record<string, number>;
}
```

### Venture Context

```typescript
interface VentureContext {
  ventureId: string;
  userId: string | null;
  sessionId: string | null;
  correlationId: string;
  permissions: string[];
}

function getCurrentVentureId(): string {
  const ctx = asyncLocalStorage.getStore();
  if (!ctx?.ventureId) throw new MissingContextError('ventureId');
  return ctx.ventureId;
}
```

---

## Database Schema

### Complete Schema Summary

| Table | Submodule | Purpose |
|-------|-----------|---------|
| `fabric_audit_logs` | audit | Audit trail entries (partitioned by month) |
| `fabric_feature_flags` | flags | Feature flag definitions |
| `fabric_flag_overrides` | flags | Per-user/venture flag overrides |
| `fabric_experiments` | flags | A/B experiment definitions |
| `fabric_notifications` | notifications | Notification records |
| `fabric_notification_deliveries` | notifications | Per-channel delivery tracking |
| `fabric_notification_preferences` | notifications | User notification preferences |
| `fabric_notification_templates` | notifications | Notification templates |
| `fabric_job_history` | queue | Job execution history (shadow of Redis) |
| `fabric_storage_files` | storage | File metadata |
| `fabric_storage_buckets` | storage | Bucket configurations |
| `fabric_storage_quotas` | storage | Per-venture storage quotas |

### Indexes Strategy

All fabric tables follow these indexing principles:

1. **Venture-first composite indexes** — Every query is venture-scoped, so ventureId is always the leading column.
2. **Timestamp indexes** — For time-range queries and retention management.
3. **Status indexes** — For filtering by processing/delivery status.
4. **Unique constraints** — For deduplication (notification dedup keys, file paths, flag keys).

### Migration Strategy

```typescript
// Fabric uses Drizzle ORM for all schema management
// Migrations are generated via: drizzle-kit generate:pg

// Migration files are in: packages/fabric/drizzle/migrations/
// Format: 0001_create_audit_logs.sql, 0002_create_feature_flags.sql, etc.

// Applied via:
await migrate(db, { migrationsFolder: './drizzle/migrations' });
```

---

## Domain Events

### Events Published by Fabric

| Event | Source | Description |
|-------|--------|-------------|
| `fabric.audit.entry.created` | audit | New audit log entry |
| `fabric.audit.integrity.violation` | audit | Integrity chain tampered |
| `fabric.cache.eviction` | cache | Cache eviction (mass) |
| `fabric.events.dlq.added` | events | Event moved to DLQ |
| `fabric.flags.changed` | flags | Flag definition changed |
| `fabric.flags.experiment.started` | flags | Experiment started |
| `fabric.flags.experiment.completed` | flags | Experiment completed |
| `fabric.notifications.sent` | notifications | Notification sent |
| `fabric.notifications.delivered` | notifications | Notification delivered |
| `fabric.notifications.bounced` | notifications | Notification bounced |
| `fabric.notifications.opened` | notifications | Notification opened |
| `fabric.queue.job.completed` | queue | Job completed |
| `fabric.queue.job.failed` | queue | Job failed |
| `fabric.queue.job.dead` | queue | Job moved to DLQ |
| `fabric.storage.file.uploaded` | storage | File uploaded |
| `fabric.storage.file.processed` | storage | File processing complete |
| `fabric.storage.file.deleted` | storage | File deleted |
| `fabric.storage.quota.warning` | storage | Quota 80% reached |
| `fabric.storage.quota.exceeded` | storage | Quota exceeded |
| `fabric.search.reindex.completed` | search | Reindex completed |

### Event Schemas

All fabric events follow the standard `DomainEvent<T>` envelope defined in the events submodule. Event payloads are validated against registered Zod schemas.

---

## Configuration

### Environment Variables

```bash
# --- Audit ---
FABRIC_AUDIT_RETENTION_YEARS=7
FABRIC_AUDIT_PARTITION_AHEAD_MONTHS=3
FABRIC_AUDIT_INTEGRITY_CHECK_ENABLED=true

# --- Cache ---
FABRIC_CACHE_PROVIDER=redis          # redis | memory | tiered
FABRIC_CACHE_REDIS_URL=redis://localhost:6379
FABRIC_CACHE_DEFAULT_TTL=3600
FABRIC_CACHE_L1_MAX_SIZE=10000
FABRIC_CACHE_L1_TTL=30

# --- Events ---
FABRIC_EVENTS_PROVIDER=redpanda      # redpanda | memory | supabase
FABRIC_EVENTS_BROKERS=localhost:9092
FABRIC_EVENTS_SCHEMA_REGISTRY_URL=http://localhost:8081
FABRIC_EVENTS_DEFAULT_RETENTION_MS=604800000
FABRIC_EVENTS_DLQ_RETENTION_MS=2592000000

# --- Flags ---
FABRIC_FLAGS_PROVIDER=database       # database | launchdarkly | memory
FABRIC_FLAGS_CACHE_TTL=30
FABRIC_FLAGS_STALE_CHECK_DAYS=30
FABRIC_FLAGS_LAUNCHDARKLY_SDK_KEY=sdk-xxx

# --- Notifications ---
FABRIC_NOTIFICATIONS_EMAIL_PROVIDER=sendgrid  # sendgrid | resend | ses
FABRIC_NOTIFICATIONS_SMS_PROVIDER=twilio
FABRIC_NOTIFICATIONS_PUSH_PROVIDER=onesignal  # onesignal | firebase

FABRIC_NOTIFICATIONS_SENDGRID_API_KEY=SG.xxx
FABRIC_NOTIFICATIONS_RESEND_API_KEY=re_xxx
FABRIC_NOTIFICATIONS_TWILIO_ACCOUNT_SID=ACxxx
FABRIC_NOTIFICATIONS_TWILIO_AUTH_TOKEN=xxx
FABRIC_NOTIFICATIONS_ONESIGNAL_APP_ID=xxx
FABRIC_NOTIFICATIONS_ONESIGNAL_REST_API_KEY=xxx

FABRIC_NOTIFICATIONS_FROM_EMAIL=noreply@mcv.one
FABRIC_NOTIFICATIONS_FROM_NAME="MCV.ONE"
FABRIC_NOTIFICATIONS_DIGEST_DEFAULT=daily

# --- Queue ---
FABRIC_QUEUE_PROVIDER=bullmq         # bullmq | temporal | memory
FABRIC_QUEUE_REDIS_URL=redis://localhost:6379
FABRIC_QUEUE_DEFAULT_ATTEMPTS=3
FABRIC_QUEUE_COMPLETED_RETENTION=604800000   # 7 days
FABRIC_QUEUE_FAILED_RETENTION=2592000000     # 30 days

# --- Realtime ---
FABRIC_REALTIME_PROVIDER=supabase    # supabase | websocket | memory
FABRIC_REALTIME_SUPABASE_URL=https://xxx.supabase.co
FABRIC_REALTIME_SUPABASE_ANON_KEY=eyJxxx
FABRIC_REALTIME_HEARTBEAT_INTERVAL=30000
FABRIC_REALTIME_MAX_CHANNELS_PER_CONNECTION=100

# --- Search ---
FABRIC_SEARCH_PROVIDER=meilisearch   # meilisearch | typesense | postgres
FABRIC_SEARCH_MEILISEARCH_HOST=http://localhost:7700
FABRIC_SEARCH_MEILISEARCH_API_KEY=masterKey
FABRIC_SEARCH_TYPESENSE_HOST=localhost
FABRIC_SEARCH_TYPESENSE_PORT=8108
FABRIC_SEARCH_TYPESENSE_API_KEY=xxx

# --- Storage ---
FABRIC_STORAGE_PROVIDER=supabase     # supabase | s3 | r2
FABRIC_STORAGE_SUPABASE_URL=https://xxx.supabase.co
FABRIC_STORAGE_SUPABASE_SERVICE_KEY=eyJxxx
FABRIC_STORAGE_S3_BUCKET=mcv-files
FABRIC_STORAGE_S3_REGION=us-east-1
FABRIC_STORAGE_R2_ACCOUNT_ID=xxx
FABRIC_STORAGE_R2_ACCESS_KEY=xxx
FABRIC_STORAGE_R2_SECRET_KEY=xxx
FABRIC_STORAGE_CDN_URL=https://cdn.mcv.one
FABRIC_STORAGE_MAX_FILE_SIZE=104857600       # 100MB
FABRIC_STORAGE_DEFAULT_QUOTA=10737418240     # 10GB per venture
```

### Configuration Schema (Zod)

```typescript
import { z } from 'zod';

export const fabricConfig = z.object({
  audit: z.object({
    retentionYears: z.number().min(1).max(20).default(7),
    partitionAheadMonths: z.number().min(1).max(12).default(3),
    integrityCheckEnabled: z.boolean().default(true),
  }),

  cache: z.object({
    provider: z.enum(['redis', 'memory', 'tiered']).default('redis'),
    redisUrl: z.string().url().optional(),
    defaultTtl: z.number().min(1).default(3600),
    l1MaxSize: z.number().min(100).default(10000),
    l1Ttl: z.number().min(1).default(30),
  }),

  events: z.object({
    provider: z.enum(['redpanda', 'memory', 'supabase']).default('redpanda'),
    brokers: z.array(z.string()).min(1).default(['localhost:9092']),
    schemaRegistryUrl: z.string().url().optional(),
    defaultRetentionMs: z.number().default(604800000),
    dlqRetentionMs: z.number().default(2592000000),
  }),

  flags: z.object({
    provider: z.enum(['database', 'launchdarkly', 'memory']).default('database'),
    cacheTtl: z.number().min(1).default(30),
    staleCheckDays: z.number().min(1).default(30),
  }),

  notifications: z.object({
    emailProvider: z.enum(['sendgrid', 'resend', 'ses']).default('sendgrid'),
    smsProvider: z.enum(['twilio']).default('twilio'),
    pushProvider: z.enum(['onesignal', 'firebase']).default('onesignal'),
    fromEmail: z.string().email().default('noreply@mcv.one'),
    fromName: z.string().default('MCV.ONE'),
    digestDefault: z.enum(['immediate', 'hourly', 'daily', 'weekly'])
      .default('daily'),
  }),

  queue: z.object({
    provider: z.enum(['bullmq', 'temporal', 'memory']).default('bullmq'),
    redisUrl: z.string().url().optional(),
    defaultAttempts: z.number().min(1).default(3),
    completedRetentionMs: z.number().default(604800000),
    failedRetentionMs: z.number().default(2592000000),
  }),

  realtime: z.object({
    provider: z.enum(['supabase', 'websocket', 'memory']).default('supabase'),
    heartbeatInterval: z.number().min(1000).default(30000),
    maxChannelsPerConnection: z.number().min(1).default(100),
  }),

  search: z.object({
    provider: z.enum(['meilisearch', 'typesense', 'postgres'])
      .default('meilisearch'),
  }),

  storage: z.object({
    provider: z.enum(['supabase', 's3', 'r2']).default('supabase'),
    cdnUrl: z.string().url().optional(),
    maxFileSize: z.number().default(104857600),
    defaultQuota: z.number().default(10737418240),
  }),
});
```

---

## Security Model

### Permissions

Fabric defines the following permissions, enforced by `@mcv/identity`:

| Permission | Description |
|------------|-------------|
| `fabric.audit.read` | Read audit logs |
| `fabric.audit.export` | Export audit logs |
| `fabric.audit.verify` | Run integrity verification |
| `fabric.cache.manage` | Manage cache (flush, invalidate) |
| `fabric.events.publish` | Publish domain events |
| `fabric.events.subscribe` | Subscribe to events |
| `fabric.events.dlq.manage` | Manage dead letter queue |
| `fabric.events.replay` | Replay events |
| `fabric.flags.read` | Read flag values |
| `fabric.flags.manage` | Create/update/delete flags |
| `fabric.flags.override` | Set flag overrides |
| `fabric.flags.experiment` | Manage experiments |
| `fabric.notifications.send` | Send notifications |
| `fabric.notifications.manage` | Manage templates, view analytics |
| `fabric.queue.manage` | View/manage job queues |
| `fabric.queue.retry` | Retry failed jobs |
| `fabric.realtime.manage` | Manage channels, view connections |
| `fabric.search.read` | Search indexed content |
| `fabric.search.manage` | Manage indices, reindex |
| `fabric.search.global` | Search across all ventures |
| `fabric.storage.read` | Read/download files |
| `fabric.storage.write` | Upload files |
| `fabric.storage.delete` | Delete files |
| `fabric.storage.manage` | Manage buckets, quotas |

### Data Isolation

1. **Venture Scoping**: All data is automatically scoped to the current venture. Cross-venture access is prevented at the service layer.
2. **Row-Level Security**: PostgreSQL RLS policies enforce venture isolation at the database level as a defense-in-depth measure.
3. **Encryption**: Sensitive data in JSONB fields is encrypted at the application level using AES-256-GCM with venture-specific keys.
4. **Key Rotation**: Encryption keys are rotated quarterly. Old data is re-encrypted during rotation.

### Audit Trail Security

- Audit log entries are **immutable** — no update or delete operations are exposed through the API.
- The integrity chain (checksum linking) makes tampering detectable.
- Audit log access itself is audited (meta-audit).
- Database-level permissions prevent direct table manipulation.

### File Security

- All file uploads pass through virus scanning (ClamAV).
- Content-type validation prevents MIME-type spoofing.
- Signed URLs have configurable expiry (default: 1 hour).
- Private files are never accessible without a valid signed URL.
- File access is logged in the audit trail.

### Rate Limiting

- All public API endpoints are rate-limited via the cache submodule.
- Per-user, per-IP, and per-venture limits are enforced.
- Rate limit headers are included in API responses.

---

## Testing Strategy

### Unit Tests

Each submodule has comprehensive unit tests using the in-memory provider:

```typescript
describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService(new InMemoryCacheProvider());
  });

  it('should get and set values', async () => {
    await cache.set('key', { name: 'test' }, { ttl: 60 });
    const result = await cache.get('key');
    expect(result).toEqual({ name: 'test' });
  });

  it('should respect TTL', async () => {
    await cache.set('key', 'value', { ttl: 1 });
    vi.advanceTimersByTime(2000);
    const result = await cache.get('key');
    expect(result).toBeNull();
  });

  it('should invalidate by tag', async () => {
    await cache.set('key1', 'a', { tags: ['group1'] });
    await cache.set('key2', 'b', { tags: ['group1'] });
    await cache.set('key3', 'c', { tags: ['group2'] });

    await cache.invalidateByTag('group1');

    expect(await cache.get('key1')).toBeNull();
    expect(await cache.get('key2')).toBeNull();
    expect(await cache.get('key3')).toBe('c');
  });
});
```

### Integration Tests

Integration tests run against real infrastructure in Docker:

```typescript
describe('SearchService (Meilisearch)', () => {
  let search: SearchService;

  beforeAll(async () => {
    search = new SearchService(new MeilisearchProvider({
      host: process.env.MEILISEARCH_TEST_HOST!,
      apiKey: process.env.MEILISEARCH_TEST_KEY!,
    }));

    await search.createIndex('test-products', {
      searchableFields: ['name', 'description'],
      filterableFields: ['category', 'price'],
    });
  });

  it('should index and search documents', async () => {
    await search.bulkIndex('test-products', [
      { id: '1', ventureId: 'v1', name: 'Wireless Headphones',
        category: 'electronics', price: 99 },
      { id: '2', ventureId: 'v1', name: 'Bluetooth Speaker',
        category: 'electronics', price: 49 },
    ]);

    await waitForIndexing();

    const results = await search.query('test-products', {
      q: 'wireless',
      ventureId: 'v1',
    });

    expect(results.hits).toHaveLength(1);
    expect(results.hits[0].document.name).toBe('Wireless Headphones');
  });
});
```

### Test Infrastructure

```yaml
# docker-compose.test.yml
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  meilisearch:
    image: getmeili/meilisearch:v1.6
    ports: ["7700:7700"]
    environment:
      MEILI_MASTER_KEY: testMasterKey

  redpanda:
    image: redpandadata/redpanda:v23.3
    ports: ["9092:9092"]
```

---

## Operational Runbook

### Health Checks

```typescript
const health = await fabric.healthCheck();
// Returns:
// {
//   status: 'healthy',
//   submodules: {
//     audit:         { status: 'healthy', latencyMs: 2 },
//     cache:         { status: 'healthy', latencyMs: 1, hitRate: 0.92 },
//     events:        { status: 'healthy', latencyMs: 5, consumerLag: 12 },
//     flags:         { status: 'healthy', latencyMs: 1, flagCount: 42 },
//     notifications: { status: 'healthy', pendingCount: 3 },
//     queue:         { status: 'healthy', activeJobs: 7, failedJobs: 0 },
//     realtime:      { status: 'healthy', connections: 156 },
//     search:        { status: 'healthy', latencyMs: 3, indexedDocs: 15420 },
//     storage:       { status: 'healthy', latencyMs: 8 },
//   }
// }
```

### Common Operations

| Scenario | Command |
|----------|---------|
| Flush cache for a venture | `cache.deletePattern('v:{ventureId}:*')` |
| Retry all DLQ events | `events.dlq.retryAll({ topic: 'mcv.orders' })` |
| Reindex all products | `search.reindex('products', { source: productStream })` |
| Pause notification delivery | `queue.pause('notification:deliver')` |
| Check feature flag status | `flags.getAll({ ventureId })` |
| Verify audit integrity | `audit.verifyIntegrity(ventureId, dateRange)` |
| Check storage quotas | `storage.getQuota(ventureId)` |
| View realtime connections | `realtime.getConnectionCount()` |

### Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| Cache hit rate low | Hit rate < 70% for 10 min | Warning |
| Event consumer lag | Lag > 10,000 messages | Warning |
| Event consumer lag critical | Lag > 100,000 messages | Critical |
| DLQ growing | DLQ size > 100 events | Warning |
| Queue backlog | Waiting jobs > 10,000 | Warning |
| Notification delivery failures | Failure rate > 5% | Warning |
| Storage quota near limit | Usage > 80% | Warning |
| Audit integrity violation | Any violation detected | Critical |
| Search index stale | Last index update > 1h | Warning |
| Realtime connection spike | Connections > 10,000 | Warning |

---

## Migration & Versioning

### Schema Versioning

Fabric database schema is versioned via Drizzle migrations. Each migration is:
1. **Forward-only** — No rollback migrations. Fix-forward instead.
2. **Backward-compatible** — New columns are nullable or have defaults. Old code works with new schema.
3. **Idempotent** — Safe to re-run.

### API Versioning

Fabric APIs follow semantic versioning. Breaking changes are introduced via new major versions with a deprecation period:

```typescript
// v1 API (current)
await cache.set('key', value, { ttl: 3600 });

// v2 API (future -- if breaking change needed)
await cache.v2.set('key', value, { ttl: '1h', tags: ['group'] });
```

### Provider Migration

Switching providers is a zero-downtime operation:

```typescript
// 1. Deploy new provider alongside old
// 2. Dual-write: write to both, read from old
// 3. Verify: confirm new provider has identical data
// 4. Switch: read from new, write to both
// 5. Decommission: stop writing to old
```

---

## Performance Budgets

| Operation | Target | Maximum |
|-----------|--------|---------|
| Cache get | < 2ms | 10ms |
| Cache set | < 3ms | 15ms |
| Audit log write | < 10ms | 50ms |
| Audit query (indexed) | < 50ms | 200ms |
| Event publish | < 5ms | 25ms |
| Flag evaluation | < 1ms | 5ms |
| Notification queue | < 10ms | 50ms |
| Search query | < 30ms | 100ms |
| Storage upload (1MB) | < 500ms | 2000ms |
| Storage signed URL | < 5ms | 20ms |
| Realtime broadcast | < 10ms | 50ms |

### Load Targets

| Metric | Target |
|--------|--------|
| Cache operations/sec | 50,000+ |
| Events/sec | 10,000+ |
| Notifications/hour | 100,000+ |
| Search queries/sec | 1,000+ |
| Concurrent WebSocket connections | 50,000+ |
| Storage uploads/min | 500+ |
| Queue jobs/sec | 5,000+ |

---

## Package Exports

```typescript
// --- Submodule Exports ---

// Audit
export { audit } from './audit';
export type {
  AuditLogEntry,
  AuditQuery,
  AuditCategory,
  AuditSeverity,
  AuditExportOptions,
  RetentionPolicy,
  IntegrityReport,
} from './audit';

// Cache
export { cache } from './cache';
export type {
  CacheSetOptions,
  CacheGetOptions,
  RateLimitOptions,
  RateLimitResult,
  TieredCacheConfig,
} from './cache';

// Events
export { events } from './events';
export type {
  DomainEvent,
  EventHandler,
  TopicConfig,
  EventRetryPolicy,
} from './events';

// Flags
export { flags } from './flags';
export type {
  FeatureFlag,
  FlagValue,
  TargetingConfig,
  TargetingRule,
  Experiment,
  ExperimentResults,
} from './flags';

// Notifications
export { notifications } from './notifications';
export type {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationPreferences,
  NotificationDelivery,
  DeliveryStatus,
} from './notifications';

// Queue
export { queue } from './queue';
export type {
  Job,
  JobOptions,
  JobStatus,
  BackoffStrategy,
} from './queue';

// Realtime
export { realtime } from './realtime';
export type {
  RealtimeChannel,
  PresenceEntry,
  RealtimeMessage,
  DatabaseChange,
} from './realtime';

// Search
export { search } from './search';
export type {
  SearchQuery,
  SearchResult,
  SearchHit,
  SearchIndexConfig,
  FacetResult,
} from './search';

// Storage
export { storage } from './storage';
export type {
  StorageFile,
  FileVariant,
  BucketConfig,
  UploadOptions,
} from './storage';

// --- Shared Exports ---
export type {
  FabricProvider,
  FabricService,
  HealthCheckResult,
} from './shared';
export { fabricConfig } from './shared/config';
```

---

## Dependencies

### Upstream (Internal)

| Package | What Fabric Uses |
|---------|-----------------|
| `@mcv/kernel` | Database (Drizzle), config, logger, errors, context (AsyncLocalStorage), circuit breaker |
| `@mcv/identity` | User context, permission checks, JWT validation |

### External (Runtime)

| Package | Purpose | Submodule |
|---------|---------|-----------|
| `@supabase/storage-js` | Supabase Storage client | storage |
| `@supabase/realtime-js` | Supabase Realtime client | realtime |
| `@sendgrid/mail` | Email delivery | notifications |
| `twilio` | SMS/WhatsApp delivery | notifications |
| `onesignal-node` | Push notifications | notifications |
| `@upstash/redis` | Redis cache | cache |
| `bullmq` | Job queue | queue |
| `kafkajs` | Redpanda/Kafka client | events |
| `meilisearch` | Search engine client | search |
| `sharp` | Image processing | storage |
| `zod` | Schema validation | all |
| `murmurhash3js` | Deterministic hashing | flags |
| `handlebars` | Template rendering | notifications |

### External (Development)

| Package | Purpose |
|---------|---------|
| `vitest` | Unit & integration testing |
| `testcontainers` | Docker containers for integration tests |
| `drizzle-kit` | Migration generation |
| `@faker-js/faker` | Test data generation |

---

*@mcv/fabric -- Infrastructure Services Layer*
