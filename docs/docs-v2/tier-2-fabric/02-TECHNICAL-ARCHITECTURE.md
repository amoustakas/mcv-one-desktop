# @mcv/fabric — Technical Architecture
## System Design & Data Flow

**Package:** `@mcv/fabric`  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
│                      (Next.js, tRPC, Services)                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ uses @mcv/fabric
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/fabric API                                 │
│                                                                              │
│  audit.log()  storage.upload()  realtime.channel()  notifications.send()   │
│  flags.isEnabled()  queue.add()  events.publish()  search.query()          │
│  cache.get()                                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          ▼
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│    PostgreSQL     │    │       Redis       │    │     Redpanda      │
│   (Supabase)      │    │    (Upstash)      │    │   (Kafka API)     │
│                   │    │                   │    │                   │
│ • Audit logs      │    │ • Cache           │    │ • Domain events   │
│ • Notifications   │    │ • Rate limits     │    │ • Event sourcing  │
│ • Flag configs    │    │ • Session store   │    │                   │
│ • Job state       │    │ • Job queues      │    │                   │
└───────────────────┘    └───────────────────┘    └───────────────────┘
           │                          │                          │
           ▼                          ▼                          ▼
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│  Supabase Storage │    │    Meilisearch    │    │  External APIs    │
│                   │    │                   │    │                   │
│ • Files           │    │ • Full-text       │    │ • SendGrid        │
│ • Media           │    │ • Faceted search  │    │ • Twilio          │
│ • CDN delivery    │    │                   │    │ • OneSignal       │
└───────────────────┘    └───────────────────┘    └───────────────────┘
```

---

## Audit System Architecture

### Data Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Action  │────▶│  Audit   │────▶│  Queue   │────▶│ Database │
│ Trigger  │     │ Capture  │     │ (Async)  │     │  Write   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                                   │
                      │                                   │
                      ▼                                   ▼
               ┌──────────┐                        ┌──────────┐
               │ Context  │                        │ Partition│
               │ Enrich   │                        │  by Date │
               │          │                        │          │
               │ • User   │                        │ Monthly  │
               │ • IP     │                        │ Tables   │
               │ • Device │                        │          │
               └──────────┘                        └──────────┘
```

### Partitioning Strategy

```sql
-- Monthly partitions for audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    venture_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    ...
) PARTITION BY RANGE (timestamp);

-- Auto-create partitions
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

### Retention Policy

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Security events | 7 years | SOX compliance |
| Financial transactions | 7 years | Tax/audit |
| User actions | 2 years | Analytics |
| System events | 90 days | Debugging |

---

## Storage System Architecture

### Upload Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Presign │────▶│  Direct  │────▶│    S3    │
│  App     │     │   URL    │     │  Upload  │     │ / R2     │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                                   │
                      │                                   │
                      ▼                                   ▼
               ┌──────────┐                        ┌──────────┐
               │  API     │                        │  Webhook │
               │  Verify  │◀───────────────────────│ Callback │
               │          │                        │          │
               └──────────┘                        └──────────┘
                      │
                      ▼
               ┌──────────┐
               │ Database │
               │  Record  │
               └──────────┘
```

### Image Processing Pipeline

```
Original Upload
       │
       ▼
┌──────────────────────────────────────────┐
│           Image Processing               │
│                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │  thumb  │  │  medium │  │  large  │  │
│  │ 150x150 │  │ 800x600 │  │ 1920x   │  │
│  └─────────┘  └─────────┘  └─────────┘  │
│                                          │
│  WebP conversion for web delivery        │
│                                          │
└──────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│              CDN Delivery                │
│         (Cloudflare / Supabase)          │
└──────────────────────────────────────────┘
```

---

## Real-time System Architecture

### WebSocket Connection Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Auth    │────▶│ Supabase │────▶│ Channel  │
│  Connect │     │  Token   │     │ Realtime │     │  Join    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        │
                                        ▼
                                 ┌──────────┐
                                 │ Presence │
                                 │  Track   │
                                 │          │
                                 │ • Online │
                                 │ • Typing │
                                 │ • Focus  │
                                 └──────────┘
```

### Channel Types

| Type | Purpose | Example |
|------|---------|---------|
| Private | User-specific | `user:${userId}` |
| Venture | Venture-wide | `venture:${ventureId}` |
| Resource | Entity updates | `orders:${orderId}` |
| Presence | Who's online | `presence:${roomId}` |

---

## Notification System Architecture

### Delivery Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          NOTIFICATION REQUEST                                 │
│                                                                               │
│   notifications.send({ userId, template: 'order.confirmed', data })          │
│                                                                               │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            USER PREFERENCES                                    │
│                                                                                │
│   Load preferences: { email: true, push: true, sms: false }                   │
│   Check quiet hours: 22:00 - 08:00                                            │
│                                                                                │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              ▼                         ▼                         ▼
       ┌──────────┐              ┌──────────┐              ┌──────────┐
       │  Email   │              │   Push   │              │  In-App  │
       │ SendGrid │              │ OneSignal│              │ WebSocket│
       └────┬─────┘              └────┬─────┘              └────┬─────┘
            │                         │                         │
            ▼                         ▼                         ▼
       ┌──────────┐              ┌──────────┐              ┌──────────┐
       │ Delivery │              │ Delivery │              │ Delivery │
       │ Tracking │              │ Tracking │              │ Tracking │
       └──────────┘              └──────────┘              └──────────┘
```

### Template System

```typescript
// Template definition
const templates = {
  'order.confirmed': {
    email: {
      subject: 'Order #{{orderNumber}} Confirmed',
      template: 'emails/order-confirmed.html',
    },
    push: {
      title: 'Order Confirmed',
      body: 'Your order #{{orderNumber}} is confirmed!',
    },
    inApp: {
      type: 'order',
      action: 'view',
      resourceId: '{{orderId}}',
    },
  },
};
```

---

## Queue System Architecture

### Job Processing Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              JOB LIFECYCLE                                    │
│                                                                               │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐   │
│  │ Created │───▶│ Waiting │───▶│ Active  │───▶│Complete │───▶│ Removed │   │
│  └─────────┘    └─────────┘    └────┬────┘    └─────────┘    └─────────┘   │
│                                     │                                        │
│                                     │ (on failure)                          │
│                                     ▼                                        │
│                              ┌─────────────┐                                 │
│                              │   Retry     │──────┐                          │
│                              │ (exp. back) │      │                          │
│                              └──────┬──────┘      │ (max retries)            │
│                                     │             ▼                          │
│                                     └──────▶┌─────────┐                      │
│                                             │  Dead   │                      │
│                                             │ Letter  │                      │
│                                             └─────────┘                      │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Queue Configuration

```typescript
const queueConfig = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // Start with 1s, then 2s, 4s, 8s...
    },
    removeOnComplete: 100, // Keep last 100
    removeOnFail: 1000,    // Keep last 1000 failed
  },
  
  limiter: {
    max: 100,      // Max jobs per interval
    duration: 1000, // 1 second
  },
};
```

---

## Event Bus Architecture

### Event Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              EVENT PRODUCER                                   │
│                                                                               │
│   events.publish('order.created', { orderId, total, ... })                   │
│                                                                               │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                              REDPANDA / KAFKA                                  │
│                                                                                │
│   Topic: mcv.events.order.created                                             │
│   Partitions: 6 (by ventureId for ordering)                                   │
│   Retention: 7 days                                                           │
│                                                                                │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              ▼                         ▼                         ▼
       ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
       │  Analytics   │          │  Engagement  │          │  Inventory   │
       │   Service    │          │   Service    │          │   Service    │
       │              │          │              │          │              │
       │ Track order  │          │ Award points │          │ Update stock │
       └──────────────┘          └──────────────┘          └──────────────┘
```

### Event Schema

```typescript
interface DomainEvent<T = unknown> {
  id: string;           // Unique event ID
  type: string;         // Event type (order.created)
  version: number;      // Schema version
  timestamp: string;    // ISO timestamp
  ventureId: string;    // Tenant ID
  userId?: string;      // Acting user
  correlationId: string; // Request correlation
  data: T;              // Event payload
}
```

---

## Search System Architecture

### Indexing Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Database │────▶│  Change  │────▶│  Queue   │────▶│Meilisearch│
│  Write   │     │  Event   │     │  Index   │     │  Update  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │
                      │ Debounce
                      ▼
               ┌──────────┐
               │  Batch   │
               │ Updates  │
               └──────────┘
```

### Index Configuration

```typescript
const searchConfig = {
  products: {
    primaryKey: 'id',
    searchableAttributes: ['name', 'description', 'sku'],
    filterableAttributes: ['category', 'brand', 'price', 'ventureId'],
    sortableAttributes: ['price', 'createdAt', 'popularity'],
    rankingRules: [
      'words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'
    ],
  },
};
```

---

## Cache System Architecture

### Cache Layers

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              REQUEST                                         │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │    L1: In-Memory      │
                            │    (LRU, 1000 items)  │
                            │    TTL: 60s           │
                            └───────────┬───────────┘
                                        │ miss
                                        ▼
                            ┌───────────────────────┐
                            │    L2: Redis          │
                            │    (Upstash)          │
                            │    TTL: varies        │
                            └───────────┬───────────┘
                                        │ miss
                                        ▼
                            ┌───────────────────────┐
                            │    L3: Database       │
                            │    (PostgreSQL)       │
                            │                       │
                            └───────────────────────┘
```

### Cache Keys Convention

```
{scope}:{entity}:{id}:{field?}

Examples:
- user:usr_abc123
- user:usr_abc123:permissions
- venture:ven_xyz:settings
- product:prd_123:inventory
- rate:api:usr_abc123
```

---

## Performance Considerations

### Audit
- Async write via queue (non-blocking)
- Monthly partitioning (fast queries)
- Index on (venture_id, timestamp, resource)

### Storage
- Direct upload to S3 (bypass API)
- CDN caching (99% cache hit)
- Image optimization at upload

### Realtime
- Connection pooling
- Channel cleanup (idle timeout)
- Message batching

### Notifications
- Queue-based delivery
- Template caching
- Batch digest delivery

### Queue
- Worker auto-scaling
- Priority queues
- Concurrency limits

### Events
- Partitioning by ventureId
- Consumer groups for scaling
- Exactly-once semantics

### Search
- Batched indexing
- Async re-indexing
- Query caching

### Cache
- L1 in-memory + L2 Redis
- Cache warming on deploy
- Graceful degradation

---

## Failure Modes

| Component | Failure Mode | Recovery |
|-----------|--------------|----------|
| Audit | DB write fails | Retry queue, dead letter |
| Storage | Upload fails | Client retry, presigned URL refresh |
| Realtime | WS disconnect | Auto-reconnect with backoff |
| Notifications | Delivery fails | Retry, fallback channel |
| Queue | Worker crash | Job returns to queue |
| Events | Consumer lag | Scale consumers, backpressure |
| Search | Index stale | Re-index trigger |
| Cache | Redis down | Fallback to DB |

---

*@mcv/fabric — Technical Architecture v1.0*
