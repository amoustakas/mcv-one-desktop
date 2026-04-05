# @mcv/fabric — Package Specification
## Tier 2: Cross-Cutting Infrastructure

**Package:** `@mcv/fabric`  
**Classification:** INTERNAL  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/fabric` provides the cross-cutting infrastructure services that all business domains depend on: audit logging, file storage, real-time communication, notifications, feature flags, job queues, event bus, search, and caching.

These are the "connective tissue" of the platform — services that don't belong to any single domain but are used by all of them.

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BUSINESS DOMAINS (Tier 5)                           │
│  nexus | engagement | growth | commerce | operations | finance | ...        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ uses
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/fabric                                     │
│                                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │  audit  │ │ storage │ │realtime │ │  notif  │ │  flags  │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                            │
│  │  queue  │ │ events  │ │ search  │ │  cache  │                            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ depends on
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  @mcv/identity (Tier 1)                        @mcv/kernel (Tier 0)         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Key Technologies |
|--------|---------|------------------|
| **audit** | Compliance logging, 7-year retention | PostgreSQL, partitioning |
| **storage** | File/media storage with CDN | S3, Supabase Storage, R2 |
| **realtime** | WebSocket, presence, live updates | Supabase Realtime |
| **notifications** | Omnichannel messaging | SendGrid, Twilio, OneSignal |
| **flags** | Feature toggles, A/B testing | Custom + LaunchDarkly |
| **queue** | Background jobs, scheduling | BullMQ, Temporal |
| **events** | Domain event bus | Redpanda/Kafka |
| **search** | Full-text search | Meilisearch, Typesense |
| **cache** | Distributed caching | Redis (Upstash) |

---

## Module: audit

### Purpose
Compliance-grade audit logging with 7-year retention for regulatory requirements.

### Key Features
- Immutable audit trail
- User action tracking
- Data change logging (before/after)
- IP and device fingerprinting
- Compliance exports (SOC2, GDPR)
- Table partitioning for performance

### Schema

```typescript
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  
  // Actor
  userId: uuid('user_id'),
  userEmail: varchar('user_email', { length: 255 }),
  userIp: varchar('user_ip', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Action
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),
  
  // Data
  dataBefore: jsonb('data_before'),
  dataAfter: jsonb('data_after'),
  metadata: jsonb('metadata'),
  
  // Timing
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  
  // Compliance
  retainUntil: timestamp('retain_until', { withTimezone: true }).notNull(),
});
```

### API

```typescript
// Log an audit event
await audit.log({
  action: 'user.updated',
  resource: 'users',
  resourceId: userId,
  dataBefore: oldUser,
  dataAfter: newUser,
});

// Query audit history
const history = await audit.query({
  resource: 'orders',
  resourceId: orderId,
  dateRange: { from, to },
});

// Compliance export
const report = await audit.export({
  ventureId,
  dateRange: { from, to },
  format: 'csv',
});
```

---

## Module: storage

### Purpose
Unified file storage with CDN delivery, supporting multiple backends.

### Key Features
- Multi-backend support (S3, Supabase, R2)
- Automatic image optimization
- Video transcoding (via Cloudflare Stream)
- Signed URLs for private files
- Folder organization
- Quota management

### API

```typescript
// Upload file
const file = await storage.upload({
  bucket: 'avatars',
  path: `users/${userId}/avatar.jpg`,
  content: fileBuffer,
  contentType: 'image/jpeg',
  public: true,
});

// Get signed URL (for private files)
const url = await storage.getSignedUrl({
  bucket: 'documents',
  path: 'contracts/contract-123.pdf',
  expiresIn: 3600, // 1 hour
});

// Delete file
await storage.delete({
  bucket: 'temp',
  path: 'uploads/temp-file.zip',
});

// List files
const files = await storage.list({
  bucket: 'media',
  prefix: 'videos/',
  limit: 100,
});
```

---

## Module: realtime

### Purpose
Real-time communication via WebSocket for live updates, presence, and collaboration.

### Key Features
- Supabase Realtime integration
- Channel-based pub/sub
- Presence tracking (who's online)
- Typing indicators
- Broadcast messages
- Database change subscriptions

### API

```typescript
// Subscribe to channel
const channel = realtime.channel('orders', { ventureId });

channel.on('order.created', (payload) => {
  console.log('New order:', payload);
});

// Track presence
channel.track({
  userId: currentUser.id,
  status: 'online',
  lastSeen: new Date(),
});

// Get presence state
const presence = channel.presenceState();

// Broadcast message
channel.broadcast('typing', {
  userId: currentUser.id,
  isTyping: true,
});

// Subscribe to database changes
realtime.onDatabaseChange('orders', 'INSERT', (payload) => {
  console.log('Order inserted:', payload.new);
});
```

---

## Module: notifications

### Purpose
Omnichannel notification delivery with templates, preferences, and delivery tracking.

### Channels
- **Email**: SendGrid, Resend, AWS SES
- **SMS**: Twilio
- **Push**: OneSignal, Firebase
- **In-App**: WebSocket delivery
- **WhatsApp**: Twilio WhatsApp Business

### Key Features
- Template management
- User preferences (quiet hours, channel preferences)
- Delivery tracking and analytics
- Digest/batching
- Localization

### API

```typescript
// Send notification
await notifications.send({
  userId,
  template: 'order.confirmed',
  data: { orderNumber, total },
  channels: ['email', 'push'], // or 'all' for user preferences
});

// Send to multiple users
await notifications.broadcast({
  userIds: [user1, user2, user3],
  template: 'announcement',
  data: { message },
});

// Check delivery status
const status = await notifications.getDeliveryStatus(notificationId);

// Update preferences
await notifications.updatePreferences(userId, {
  email: { enabled: true, digest: 'daily' },
  push: { enabled: true, quietHours: { start: '22:00', end: '08:00' } },
  sms: { enabled: false },
});
```

---

## Module: flags

### Purpose
Feature flag management for gradual rollouts, A/B testing, and experimentation.

### Key Features
- Boolean, multivariate, and percentage flags
- User/venture/organization targeting
- A/B experiment support
- Analytics integration
- Override capabilities

### API

```typescript
// Check flag (boolean)
if (await flags.isEnabled('new-checkout-flow', { userId, ventureId })) {
  // Show new checkout
}

// Get flag value (multivariate)
const variant = await flags.getValue('pricing-page', { userId });
// Returns: 'control' | 'variant-a' | 'variant-b'

// Bulk check
const allFlags = await flags.getAll({ userId, ventureId });

// Override for testing
await flags.setOverride('feature-x', true, { userId });

// Create experiment
await flags.createExperiment({
  key: 'checkout-test',
  variants: ['control', 'streamlined', 'one-page'],
  weights: [34, 33, 33],
  targetingRules: [{ attribute: 'plan', operator: 'eq', value: 'pro' }],
});
```

---

## Module: queue

### Purpose
Background job processing with scheduling, retries, and monitoring.

### Key Features
- BullMQ-based job queues
- Scheduled/cron jobs
- Retry with exponential backoff
- Dead letter queue
- Job prioritization
- Rate limiting

### API

```typescript
// Define job handler
queue.process('send-email', async (job) => {
  const { to, subject, body } = job.data;
  await emailService.send({ to, subject, body });
});

// Enqueue job
await queue.add('send-email', {
  to: 'user@example.com',
  subject: 'Welcome!',
  body: emailHtml,
});

// Schedule job
await queue.schedule('send-email', {
  to: 'user@example.com',
  subject: 'Reminder',
  body: reminderHtml,
}, {
  delay: 24 * 60 * 60 * 1000, // 24 hours
});

// Cron job
await queue.cron('daily-report', '0 9 * * *', async () => {
  await generateDailyReport();
});

// Get job status
const status = await queue.getJob(jobId);
```

---

## Module: events

### Purpose
Domain event bus for loose coupling between services.

### Key Features
- Redpanda/Kafka-compatible streaming
- Event sourcing support
- Schema registry
- Dead letter handling
- Replay capability

### API

```typescript
// Publish event
await events.publish('order.created', {
  orderId: order.id,
  customerId: order.customerId,
  total: order.total,
  ventureId: order.ventureId,
});

// Subscribe to events
events.subscribe('order.created', async (event) => {
  // Update analytics
  await analytics.trackOrder(event.data);
  
  // Award points
  await engagement.awardPoints(event.data.customerId, 'order', event.data.total);
});

// Subscribe with consumer group
events.subscribe('order.*', handler, {
  group: 'inventory-service',
});

// Replay events
await events.replay('order.created', {
  from: '2026-01-01',
  to: '2026-02-01',
});
```

---

## Module: search

### Purpose
Full-text search with faceting, filters, and real-time indexing.

### Key Features
- Meilisearch/Typesense backends
- Multi-index search
- Faceted search
- Typo tolerance
- Synonyms
- Real-time index updates

### API

```typescript
// Index document
await search.index('products', {
  id: product.id,
  name: product.name,
  description: product.description,
  category: product.category,
  price: product.price,
  ventureId: product.ventureId,
});

// Search
const results = await search.query('products', {
  q: 'wireless headphones',
  filters: { category: 'electronics', price: { min: 50, max: 200 } },
  facets: ['category', 'brand'],
  limit: 20,
  ventureId, // Automatic tenant filtering
});

// Remove from index
await search.remove('products', productId);

// Bulk index
await search.bulkIndex('products', products);
```

---

## Module: cache

### Purpose
Distributed caching for performance optimization.

### Key Features
- Redis (Upstash) backend
- TTL management
- Cache invalidation patterns
- Memoization helpers
- Rate limiting support

### API

```typescript
// Get/set
await cache.set('user:123', userData, { ttl: 3600 });
const user = await cache.get('user:123');

// Get or compute
const data = await cache.getOrSet('expensive-query', async () => {
  return await db.query(...);
}, { ttl: 300 });

// Invalidate
await cache.delete('user:123');
await cache.deletePattern('user:*');

// Rate limiting
const { allowed, remaining, resetAt } = await cache.rateLimit({
  key: `api:${userId}`,
  limit: 100,
  window: 60, // seconds
});

// Memoize function
const memoizedFn = cache.memoize(expensiveFunction, {
  keyFn: (args) => `fn:${args.id}`,
  ttl: 600,
});
```

---

## Dependencies

### Upstream
- @mcv/kernel (db, config, logger, errors, context)
- @mcv/identity (user context, permissions)

### External Services
| Service | Purpose | Package |
|---------|---------|---------|
| Supabase Storage | File storage | @supabase/storage-js |
| Supabase Realtime | WebSocket | @supabase/realtime-js |
| SendGrid | Email | @sendgrid/mail |
| Twilio | SMS, WhatsApp | twilio |
| OneSignal | Push notifications | onesignal-node |
| Redis (Upstash) | Cache | @upstash/redis |
| BullMQ | Job queue | bullmq |
| Redpanda | Event streaming | kafkajs |
| Meilisearch | Search | meilisearch |

---

## Package Exports

```typescript
// Audit
export { audit } from './audit';
export type { AuditLog, AuditQuery } from './audit';

// Storage
export { storage } from './storage';
export type { UploadOptions, StorageFile } from './storage';

// Realtime
export { realtime } from './realtime';
export type { Channel, PresenceState } from './realtime';

// Notifications
export { notifications } from './notifications';
export type { NotificationOptions, DeliveryStatus } from './notifications';

// Flags
export { flags } from './flags';
export type { FlagValue, Experiment } from './flags';

// Queue
export { queue } from './queue';
export type { Job, JobOptions } from './queue';

// Events
export { events } from './events';
export type { DomainEvent, EventHandler } from './events';

// Search
export { search } from './search';
export type { SearchQuery, SearchResult } from './search';

// Cache
export { cache } from './cache';
export type { CacheOptions, RateLimitResult } from './cache';
```

---

*@mcv/fabric — Cross-Cutting Infrastructure v1.0*
