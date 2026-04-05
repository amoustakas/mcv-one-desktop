# @mcv/webhooks — Module Specification

**Package:** `@mcv/webhooks`  
**Classification:** Tier 3 — Connector  
**Source:** `packages/db/src/schema/webhooks.ts`, `packages/db/src/schema/webhook-deliveries.ts`, `packages/db/src/schema/notification-webhooks.ts`, `packages/api/src/services/webhook.service.ts`, `packages/api/src/routers/webhook.router.ts`, `packages/api/src/schemas/webhook.schema.ts`  
**Admin UI:** `apps/admin/src/features/integrations/api/use-webhooks.ts`  
**Tests:** `packages/api/tests/services/webhook.service.test.ts`  
**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Purpose

The Webhooks module is MCV.ONE's centralized outbound event notification system. It enables ventures to register HTTP endpoints that receive real-time event callbacks when platform events occur — payment completions, SMS deliveries, CRM updates, workflow triggers, and any other domain event across the MCV ecosystem.

The module handles:

- **Endpoint registration** with per-event-type subscriptions and wildcard (`*`) support
- **HMAC-SHA256 signature generation** for payload integrity verification
- **HTTP POST delivery** with configurable timeouts and custom header injection
- **Exponential backoff retry** with per-webhook configurable retry policies
- **Complete delivery audit trail** with request/response capture, timing, and status tracking
- **Per-endpoint health tracking** via success/failure counters and last-triggered timestamps
- **Notification webhooks** with advanced filtering, multiple auth types, and consecutive failure tracking
- **Secret rotation** with cryptographically secure `whsec_`-prefixed secrets
- **Test delivery** for endpoint verification without triggering real events

This module is a foundational Tier 3 connector used by every other module in the MCV ecosystem — payments, email, Twilio, CRM, notifications, NAOS automation — to fan out platform events to external systems including Zapier, n8n, Make.com, custom APIs, and internal microservices.

> **Architectural Note:** This module is implemented as a distributed system component rather than a standalone package. The database schema lives in `@mcv/db`, the service layer and API routes live in `@mcv/api`, the frontend hooks live in the admin app, and inbound webhook handlers (Stripe, SendGrid, Twilio) are co-located with their respective domain packages. The `@mcv/webhooks` abstraction unifies all outbound webhook concerns under a single documented surface.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE SCHEMA (from @mcv/db)
// ═══════════════════════════════════════════════════════════════════════════════

// Core webhook tables
export { webhooks } from './schema/webhooks';
export { webhookDeliveries } from './schema/webhook-deliveries';
export { notificationWebhooks } from './schema/notification-webhooks';

// Relations
export { webhooksRelations } from './schema/webhooks';
export { webhookDeliveriesRelations } from './schema/webhook-deliveries';
export { notificationWebhooksRelations } from './schema/notification-webhooks';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES (from @mcv/db)
// ═══════════════════════════════════════════════════════════════════════════════

// Webhook types
export type { Webhook, NewWebhook } from './schema/webhooks';
export type { WebhookRetryPolicy } from './schema/webhooks';

// Delivery types
export type { WebhookDelivery, NewWebhookDelivery } from './schema/webhook-deliveries';

// Notification webhook types
export type { NotificationWebhook, NewNotificationWebhook } from './schema/notification-webhooks';
export type { WebhookFilter } from './schema/notification-webhooks';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE LAYER (from @mcv/api)
// ═══════════════════════════════════════════════════════════════════════════════

// Webhook service
export { WebhookService, createWebhookService } from './services/webhook.service';
export type { DeliverResult } from './services/webhook.service';

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS (from @mcv/api)
// ═══════════════════════════════════════════════════════════════════════════════

// Input schemas (Zod)
export {
  createWebhookInputSchema,
  updateWebhookInputSchema,
  getWebhookInputSchema,
  listWebhooksInputSchema,
  deleteWebhookInputSchema,
  toggleWebhookInputSchema,
  regenerateSecretInputSchema,
  triggerWebhooksInputSchema,
  retryDeliveryInputSchema,
  getDeliveriesInputSchema,
  testWebhookInputSchema,
  webhookRetryPolicySchema,
} from './schemas/webhook.schema';

// Schema types
export type {
  CreateWebhookInput,
  UpdateWebhookInput,
  GetWebhookInput,
  ListWebhooksInput,
  DeleteWebhookInput,
  ToggleWebhookInput,
  RegenerateSecretInput,
  TriggerWebhooksInput,
  RetryDeliveryInput,
  GetDeliveriesInput,
  TestWebhookInput,
} from './schemas/webhook.schema';

// ═══════════════════════════════════════════════════════════════════════════════
// tRPC ROUTER (from @mcv/api)
// ═══════════════════════════════════════════════════════════════════════════════

export { webhookRouter } from './routers/webhook.router';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (from apps/admin)
// ═══════════════════════════════════════════════════════════════════════════════

// Query hooks
export { useWebhooks } from './features/integrations/api/use-webhooks';
export { useWebhook } from './features/integrations/api/use-webhooks';
export { useWebhookDeliveries } from './features/integrations/api/use-webhooks';

// Mutation hooks
export { useCreateWebhook } from './features/integrations/api/use-webhooks';
export { useUpdateWebhook } from './features/integrations/api/use-webhooks';
export { useDeleteWebhook } from './features/integrations/api/use-webhooks';
export { useToggleWebhook } from './features/integrations/api/use-webhooks';
export { useRegenerateWebhookSecret } from './features/integrations/api/use-webhooks';
export { useTriggerWebhooks } from './features/integrations/api/use-webhooks';
export { useRetryDelivery } from './features/integrations/api/use-webhooks';
export { useTestWebhook } from './features/integrations/api/use-webhooks';

// Composite hooks
export { useWebhookManagement } from './features/integrations/api/use-webhooks';
export { useWebhookList } from './features/integrations/api/use-webhooks';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        MCV.ONE WEBHOOK ARCHITECTURE                                  │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                      PLATFORM EVENT SOURCES                                   │   │
│  │                                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │ @mcv/payments│  │ @mcv/twilio  │  │  @mcv/crm    │  │ @mcv/email   │     │   │
│  │  │              │  │              │  │              │  │              │     │   │
│  │  │ invoice.paid │  │ sms.received │  │contact.create│  │ email.bounce │     │   │
│  │  │ sub.created  │  │ call.done    │  │ deal.won     │  │ email.opened │     │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │   │
│  │         │                 │                 │                 │               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │@mcv/notifs   │  │ @mcv/github  │  │  @mcv/naos   │  │  Custom      │     │   │
│  │  │              │  │              │  │              │  │  Modules     │     │   │
│  │  │ notif.sent   │  │ push.received│  │ task.complete │  │  *.custom    │     │   │
│  │  │ template.upd │  │ pr.merged    │  │ workflow.done│  │              │     │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │   │
│  │         │                 │                 │                 │               │   │
│  │         └─────────────────┴─────────────────┴─────────────────┘               │   │
│  │                                    │                                           │   │
│  └────────────────────────────────────┼───────────────────────────────────────────┘   │
│                                       │                                               │
│                                       ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────────────┐   │
│  │                      WEBHOOK DISPATCH ENGINE                                   │   │
│  │                     (WebhookService in @mcv/api)                               │   │
│  │                                                                                │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                     1. EVENT MATCHING                                    │   │   │
│  │  │                                                                         │   │   │
│  │  │  triggerWebhooks(eventType, payload)                                    │   │   │
│  │  │    │                                                                    │   │   │
│  │  │    ├─ Query: webhooks WHERE venture_id = ? AND is_active = true         │   │   │
│  │  │    ├─ Filter: event ∈ webhook.events[] OR webhook.events[] = ['*']      │   │   │
│  │  │    └─ Fan-out: Promise.allSettled(matching.map(deliverWebhook))         │   │   │
│  │  │                                                                         │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                    │                                           │   │
│  │  ┌─────────────────────────────────▼───────────────────────────────────────┐   │   │
│  │  │                     2. DELIVERY PIPELINE                                │   │   │
│  │  │                                                                         │   │   │
│  │  │  deliverWebhook(webhookId, eventType, payload, attemptNumber)           │   │   │
│  │  │                                                                         │   │   │
│  │  │  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │   │
│  │  │  │ Payload  │─▶│  Signature   │─▶│  HTTP POST   │─▶│   Record     │   │   │   │
│  │  │  │ Serialize│  │  Generation  │  │  w/ 30s      │  │   Delivery   │   │   │   │
│  │  │  │          │  │  HMAC-SHA256 │  │  Timeout     │  │   to DB      │   │   │   │
│  │  │  │ JSON.    │  │              │  │              │  │              │   │   │   │
│  │  │  │ stringify│  │ X-Webhook-   │  │ + Custom     │  │ status,      │   │   │   │
│  │  │  │          │  │ Signature    │  │   Headers    │  │ duration_ms, │   │   │   │
│  │  │  │          │  │ X-Webhook-   │  │              │  │ response_*,  │   │   │   │
│  │  │  │          │  │ Event,Id,    │  │              │  │ attempt_num  │   │   │   │
│  │  │  │          │  │ Timestamp    │  │              │  │              │   │   │   │
│  │  │  └──────────┘  └──────────────┘  └──────┬───────┘  └──────┬───────┘   │   │   │
│  │  │                                          │                 │           │   │   │
│  │  │                               ┌──────────▼──────────┐      │           │   │   │
│  │  │                               │   Response Check    │      │           │   │   │
│  │  │                               │                     │      │           │   │   │
│  │  │                               │  HTTP 2xx → success │      │           │   │   │
│  │  │                               │  HTTP 4xx → failed  │      │           │   │   │
│  │  │                               │  HTTP 5xx → retry   │      │           │   │   │
│  │  │                               │  Timeout  → retry   │      │           │   │   │
│  │  │                               │  Error    → retry   │      │           │   │   │
│  │  │                               └──────────┬──────────┘      │           │   │   │
│  │  │                                          │                 │           │   │   │
│  │  │                               ┌──────────▼──────────┐      │           │   │   │
│  │  │                               │  Counter Update     │      │           │   │   │
│  │  │                               │                     │      │           │   │   │
│  │  │                               │  success: +1 count  │      │           │   │   │
│  │  │                               │  failed:  +1 count  │      │           │   │   │
│  │  │                               │  retrying: schedule │      │           │   │   │
│  │  │                               │  → next_retry_at    │      │           │   │   │
│  │  │                               └─────────────────────┘      │           │   │   │
│  │  │                                                             │           │   │   │
│  │  └─────────────────────────────────────────────────────────────┘           │   │   │
│  │                                                                            │   │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                     3. HEALTH TRACKING                              │   │   │
│  │  │                                                                     │   │   │
│  │  │  webhooks.success_count / webhooks.failure_count                    │   │   │
│  │  │  webhooks.last_triggered_at                                         │   │   │
│  │  │  Per-delivery: status, duration_ms, response_status, attempt_number │   │   │
│  │  │  notification_webhooks.consecutive_failures (auto-disable trigger)  │   │   │
│  │  └─────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                               │
│                                    │ HTTP POST                                     │
│                                    ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │                    VENTURE WEBHOOK ENDPOINTS                               │   │
│  │                                                                            │   │
│  │  ┌──────────────────────────┐  ┌──────────────────────────┐               │   │
│  │  │  Integration Platforms   │  │  Custom Endpoints        │               │   │
│  │  │                          │  │                          │               │   │
│  │  │  • Zapier               │  │  • https://api.co/hooks  │               │   │
│  │  │  • n8n                  │  │  • Internal microservices│               │   │
│  │  │  • Make.com             │  │  • Monitoring systems    │               │   │
│  │  │  • IFTTT               │  │  • Data pipelines        │               │   │
│  │  └──────────────────────────┘  └──────────────────────────┘               │   │
│  │                                                                            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │                    INBOUND WEBHOOK RECEIVERS                               │   │
│  │           (co-located with domain packages, not in @mcv/webhooks)          │   │
│  │                                                                            │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │   │
│  │  │ Stripe Webhooks  │  │ SendGrid Webhooks│  │ Twilio Webhooks  │        │   │
│  │  │ @mcv/payments    │  │ @mcv/email       │  │ @mcv/twilio      │        │   │
│  │  │                  │  │                  │  │                  │        │   │
│  │  │ stripe-webhook.ts│  │ webhook-handler  │  │ sms-webhook.ts   │        │   │
│  │  │                  │  │ .service.ts      │  │ voice-webhook.ts │        │   │
│  │  │ • checkout done  │  │                  │  │ status-webhook.ts│        │   │
│  │  │ • payment ok/fail│  │ • delivered      │  │                  │        │   │
│  │  │ • subscription * │  │ • opened/clicked │  │ • sms received   │        │   │
│  │  │ • invoice *      │  │ • bounced        │  │ • call completed │        │   │
│  │  │                  │  │ • spam/unsub     │  │ • status updates │        │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘        │   │
│  │                                                                            │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.0` | Database ORM — table definitions, relations, query builder |
| `drizzle-orm/pg-core` | `^0.30.0` | PostgreSQL-specific column types and indexes |
| `@mcv/db` | `workspace:*` | Database connection, shared schema imports |
| `@trpc/server` | `^11.0.0` | tRPC error types (`TRPCError`) for service layer |
| `zod` | `^3.22.0` | Runtime validation for all inputs/outputs |
| `crypto` | (Node.js built-in) | HMAC-SHA256 signature generation, `randomBytes` for secrets |
| `@tanstack/react-query` | `^5.0.0` | Query caching, invalidation (`keepPreviousData`) in React hooks |

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/db/schema/ventures` | Foreign key reference for `webhooks.venture_id` |
| `@mcv/db/schema/users` | Foreign key reference for `webhooks.created_by` |
| `@mcv/api/trpc/init` | tRPC router factory |
| `@mcv/api/trpc/procedures` | `protectedProcedure`, `adminProcedure` middleware |
| `@mcv/api/services/audit.service` | Audit logging for all webhook mutations |
| `@mcv/api/schemas/common.schema` | `uuidSchema`, `offsetPaginationSchema` shared validators |

### Peer Dependencies (Inbound Webhook Handlers)

These packages contain inbound webhook receivers that are architecturally related but independently maintained:

| Package | Handler | Events |
|---------|---------|--------|
| `@mcv/payments` | `stripe-webhook.ts` | Stripe checkout, payment, subscription, invoice |
| `@mcv/email` | `webhook-handler.service.ts` | SendGrid delivery, open, click, bounce, spam |
| `@mcv/twilio` | `sms-webhook.ts`, `voice-webhook.ts`, `status-webhook.ts` | Twilio SMS, voice, status callbacks |
| `@mcv/github` | `github-webhook.ts` | GitHub push, PR, issue events |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (shared with `@mcv/db`) |
| `WEBHOOK_DELIVERY_TIMEOUT_MS` | No | `30000` | HTTP timeout for outbound deliveries (30s in service) |
| `WEBHOOK_MAX_RETRY_ATTEMPTS` | No | `3` | Default maximum retry attempts per delivery |
| `WEBHOOK_RETRY_BACKOFF_MS` | No | `1000` | Default base backoff interval (doubled each retry) |
| `WEBHOOK_MAX_PAYLOAD_SIZE` | No | `256000` | Maximum payload size in bytes (256KB) |
| `WEBHOOK_SIGNATURE_ALGORITHM` | No | `sha256` | HMAC algorithm for signature generation |
| `WEBHOOK_DELIVERY_LOG_RETENTION_DAYS` | No | `30` | Days to retain delivery logs before pruning |
| `WEBHOOK_SECRET_PREFIX` | No | `whsec_` | Prefix for generated webhook secrets |

### Inbound Webhook Variables (per-domain)

| Variable | Package | Description |
|----------|---------|-------------|
| `STRIPE_WEBHOOK_SECRET` | `@mcv/payments` | Stripe webhook signing secret |
| `SENDGRID_WEBHOOK_PUBLIC_KEY` | `@mcv/email` | SendGrid ECDSA verification key |
| `TWILIO_AUTH_TOKEN` | `@mcv/twilio` | Twilio request signature validation |
| `NOTION_WEBHOOK_SECRET` | NAOS automation | Notion webhook HMAC secret |

---

## Database Schema

### Table 1: `webhooks` — Registered Webhook Endpoints

The primary table for outbound webhook endpoint registration. Each row represents a single HTTP endpoint that will receive event callbacks for a specific venture.

```typescript
import {
  pgTable, uuid, text, timestamp, jsonb, integer, boolean, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ventures } from './ventures';
import { users } from './users';
import { webhookDeliveries } from './webhook-deliveries';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface WebhookRetryPolicy {
  max_attempts: number;   // Maximum delivery attempts (default: 3, max: 10)
  backoff_ms: number;     // Base backoff interval in ms (default: 1000, max: 60000)
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

export const webhooks = pgTable(
  'webhooks',
  {
    // Primary key
    id:              uuid('id').primaryKey().defaultRandom(),

    // Venture scope (tenant isolation)
    ventureId:       uuid('venture_id')
                       .references(() => ventures.id)
                       .notNull(),

    // Endpoint configuration
    name:            text('name').notNull(),              // Human-readable label
    url:             text('url').notNull(),               // Delivery endpoint URL
    secret:          text('secret').notNull(),            // HMAC-SHA256 signing secret (whsec_*)
    events:          text('events').array().notNull(),    // Event types to subscribe to
    headers:         jsonb('headers')                     // Custom headers sent with each delivery
                       .$type<Record<string, string>>()
                       .default({}),

    // State
    isActive:        boolean('is_active').default(true),  // Enable/disable without deletion

    // Retry configuration
    retryPolicy:     jsonb('retry_policy')
                       .$type<WebhookRetryPolicy>()
                       .default({ max_attempts: 3, backoff_ms: 1000 }),

    // Health metrics
    lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
    successCount:    integer('success_count').default(0),
    failureCount:    integer('failure_count').default(0),

    // Audit
    createdBy:       uuid('created_by').references(() => users.id),
    createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_webhooks_venture').on(table.ventureId),
    index('idx_webhooks_events').using('gin', table.events),  // GIN for array containment
  ]
);
```

**Column Details:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `venture_id` | `uuid` | No | — | FK → `ventures.id`, tenant isolation |
| `name` | `text` | No | — | Human-readable label (1-255 chars) |
| `url` | `text` | No | — | HTTP(S) delivery endpoint URL |
| `secret` | `text` | No | — | HMAC signing secret (`whsec_` + 64 hex chars) |
| `events` | `text[]` | No | — | Array of event types, supports `*` wildcard |
| `headers` | `jsonb` | No | `{}` | Custom headers injected into each delivery |
| `is_active` | `boolean` | No | `true` | Active flag; inactive webhooks skip delivery |
| `retry_policy` | `jsonb` | No | `{max_attempts: 3, backoff_ms: 1000}` | Per-webhook retry configuration |
| `last_triggered_at` | `timestamptz` | Yes | `null` | Last successful or failed delivery timestamp |
| `success_count` | `integer` | No | `0` | Lifetime successful delivery count |
| `failure_count` | `integer` | No | `0` | Lifetime failed delivery count (after all retries) |
| `created_by` | `uuid` | Yes | `null` | FK → `users.id`, creating user |
| `created_at` | `timestamptz` | No | `now()` | Row creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Last modification timestamp |

### Table 2: `webhook_deliveries` — Delivery Attempt Log

Every delivery attempt (including retries) is recorded as an immutable log entry. This provides a complete audit trail for debugging, monitoring, and replay.

```typescript
import {
  pgTable, uuid, text, timestamp, jsonb, integer, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { webhooks } from './webhooks';

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    // Primary key
    id:              uuid('id').primaryKey().defaultRandom(),

    // Parent webhook (cascade delete)
    webhookId:       uuid('webhook_id')
                       .references(() => webhooks.id, { onDelete: 'cascade' })
                       .notNull(),

    // Event info
    eventType:       text('event_type').notNull(),
    payload:         jsonb('payload')
                       .$type<Record<string, unknown>>()
                       .notNull(),

    // Request details
    requestHeaders:  jsonb('request_headers')
                       .$type<Record<string, string>>(),

    // Response details
    responseStatus:  integer('response_status'),              // HTTP status code (null on error)
    responseBody:    text('response_body'),                   // Response body (truncated to 10KB)
    responseHeaders: jsonb('response_headers')
                       .$type<Record<string, string>>(),

    // Timing
    durationMs:      integer('duration_ms'),                  // Request round-trip duration

    // Retry state
    attemptNumber:   integer('attempt_number').default(1),    // Current attempt (1-indexed)
    status:          text('status', {
                       enum: ['pending', 'success', 'failed', 'retrying'],
                     }).notNull().default('pending'),
    nextRetryAt:     timestamp('next_retry_at', { withTimezone: true }),

    // Audit
    createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_webhook_deliveries_webhook').on(table.webhookId),
    index('idx_webhook_deliveries_status').on(table.status),
  ]
);
```

**Column Details:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key, usable as idempotency key |
| `webhook_id` | `uuid` | No | — | FK → `webhooks.id` with `ON DELETE CASCADE` |
| `event_type` | `text` | No | — | Event type string (e.g., `invoice.paid`) |
| `payload` | `jsonb` | No | — | Full event payload as delivered |
| `request_headers` | `jsonb` | Yes | — | Headers sent with the HTTP request |
| `response_status` | `integer` | Yes | `null` | HTTP response status code |
| `response_body` | `text` | Yes | `null` | Response body (truncated to 10,000 chars) |
| `response_headers` | `jsonb` | Yes | `null` | Response headers received |
| `duration_ms` | `integer` | Yes | `null` | Round-trip time in milliseconds |
| `attempt_number` | `integer` | No | `1` | Delivery attempt (1 = first try) |
| `status` | `text` | No | `'pending'` | Delivery status enum |
| `next_retry_at` | `timestamptz` | Yes | `null` | Scheduled retry timestamp |
| `created_at` | `timestamptz` | No | `now()` | Delivery attempt timestamp |

### Table 3: `notification_webhooks` — Advanced Notification Endpoints

A specialized webhook table with advanced features: multiple authentication types, event-based filtering with field-level operators, and consecutive failure tracking for auto-disable logic.

```typescript
import {
  pgTable, uuid, text, timestamp, jsonb, integer, boolean, index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ventures } from './ventures';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface WebhookFilter {
  field: string;                                              // JSON path in payload
  operator: 'eq' | 'ne' | 'in' | 'contains' | 'startsWith'; // Comparison operator
  value: unknown;                                             // Comparison value
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

export const notificationWebhooks = pgTable(
  'notification_webhooks',
  {
    id:                   uuid('id').primaryKey().defaultRandom(),
    ventureId:            uuid('venture_id')
                            .references(() => ventures.id, { onDelete: 'cascade' })
                            .notNull(),

    // Target
    name:                 text('name').notNull(),
    url:                  text('url').notNull(),

    // Authentication (supports multiple schemes)
    authType:             text('auth_type').default('none'),   // 'none' | 'bearer' | 'basic' | 'hmac'
    authSecret:           text('auth_secret'),                 // Encrypted at rest

    // Event subscription
    eventTypes:           jsonb('event_types')
                            .$type<string[]>()
                            .notNull(),

    // Payload filtering
    filters:              jsonb('filters')
                            .$type<WebhookFilter[]>(),

    // Status
    isActive:             boolean('is_active').default(true),

    // Health tracking (consecutive failure model)
    lastSuccessAt:        timestamp('last_success_at', { withTimezone: true }),
    lastFailureAt:        timestamp('last_failure_at', { withTimezone: true }),
    consecutiveFailures:  integer('consecutive_failures').default(0),

    // Audit
    createdAt:            timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt:            timestamp('updated_at', { withTimezone: true }),
  },
  (table) => [
    index('webhook_venture_idx').on(table.ventureId),
    index('webhook_active_idx').on(table.isActive),
  ]
);
```

**Column Details:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `venture_id` | `uuid` | No | — | FK → `ventures.id` with `ON DELETE CASCADE` |
| `name` | `text` | No | — | Human-readable label |
| `url` | `text` | No | — | Delivery endpoint URL |
| `auth_type` | `text` | No | `'none'` | Authentication scheme |
| `auth_secret` | `text` | Yes | `null` | Encrypted auth credential |
| `event_types` | `jsonb` | No | — | Array of subscribed event types |
| `filters` | `jsonb` | Yes | `null` | Field-level payload filters |
| `is_active` | `boolean` | No | `true` | Active flag |
| `last_success_at` | `timestamptz` | Yes | `null` | Most recent successful delivery |
| `last_failure_at` | `timestamptz` | Yes | `null` | Most recent failed delivery |
| `consecutive_failures` | `integer` | No | `0` | Consecutive failure count (resets on success) |
| `created_at` | `timestamptz` | No | `now()` | Row creation timestamp |
| `updated_at` | `timestamptz` | Yes | `null` | Last modification timestamp |

### Entity Relationships

```
ventures ──1:N──▶ webhooks ──1:N──▶ webhook_deliveries
                     │
                     └── created_by → users

ventures ──1:N──▶ notification_webhooks
```

### Relations (Drizzle ORM)

```typescript
// webhooks → venture, creator, deliveries
export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  venture: one(ventures, {
    fields: [webhooks.ventureId],
    references: [ventures.id],
  }),
  creator: one(users, {
    fields: [webhooks.createdBy],
    references: [users.id],
  }),
  deliveries: many(webhookDeliveries),
}));

// webhook_deliveries → webhook
export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  webhook: one(webhooks, {
    fields: [webhookDeliveries.webhookId],
    references: [webhooks.id],
  }),
}));

// notification_webhooks → venture
export const notificationWebhooksRelations = relations(notificationWebhooks, ({ one }) => ({
  venture: one(ventures, {
    fields: [notificationWebhooks.ventureId],
    references: [ventures.id],
  }),
}));
```

### Inferred Types

```typescript
// From webhooks table
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;

// From webhook_deliveries table
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;

// From notification_webhooks table
export type NotificationWebhook = typeof notificationWebhooks.$inferSelect;
export type NewNotificationWebhook = typeof notificationWebhooks.$inferInsert;
```

### Database Indexes Summary

| Index | Table | Columns | Type | Purpose |
|-------|-------|---------|------|---------|
| `idx_webhooks_venture` | `webhooks` | `venture_id` | B-tree | Fast lookup by venture |
| `idx_webhooks_events` | `webhooks` | `events` | GIN (array) | Array containment queries (`@>`) |
| `idx_webhook_deliveries_webhook` | `webhook_deliveries` | `webhook_id` | B-tree | Delivery history per webhook |
| `idx_webhook_deliveries_status` | `webhook_deliveries` | `status` | B-tree | Retry scheduler polling |
| `webhook_venture_idx` | `notification_webhooks` | `venture_id` | B-tree | Fast lookup by venture |
| `webhook_active_idx` | `notification_webhooks` | `is_active` | B-tree | Active endpoint filtering |

---

## Service Layer

### WebhookService

The `WebhookService` class is a **venture-scoped** service that provides all webhook lifecycle operations. Each instance is bound to a single `ventureId`, enforcing tenant isolation at the service level.

```typescript
export class WebhookService {
  private ventureId: string;

  constructor(ventureId: string);

  // ════════════════════════════════════════════════════════════════════════════
  // WEBHOOK MANAGEMENT (CRUD)
  // ════════════════════════════════════════════════════════════════════════════

  /** List all webhooks for the venture, ordered by created_at DESC */
  async list(): Promise<Webhook[]>;

  /** Get a single webhook by ID (returns null if not found or wrong venture) */
  async get(id: string): Promise<Webhook | null>;

  /** Create a new webhook with auto-generated whsec_ secret */
  async create(data: CreateWebhookInput, createdBy?: string): Promise<Webhook>;

  /** Update webhook configuration (partial updates supported) */
  async update(id: string, data: Partial<UpdateWebhookInput>): Promise<Webhook>;

  /** Delete a webhook and cascade-delete all deliveries */
  async delete(id: string): Promise<void>;

  /** Toggle webhook active/inactive state */
  async toggle(id: string, active: boolean): Promise<Webhook>;

  /** Regenerate the webhook's HMAC signing secret */
  async regenerateSecret(id: string): Promise<{ secret: string }>;

  // ════════════════════════════════════════════════════════════════════════════
  // DELIVERY ENGINE
  // ════════════════════════════════════════════════════════════════════════════

  /** Trigger all active webhooks subscribed to an event type */
  async triggerWebhooks(eventType: string, payload: unknown): Promise<void>;

  /** Deliver a single webhook with HTTP POST and record the result */
  async deliverWebhook(
    webhookId: string,
    eventType: string,
    payload: unknown,
    attemptNumber?: number,
  ): Promise<DeliverResult>;

  /** Retry a previously failed delivery */
  async retryDelivery(deliveryId: string): Promise<DeliverResult>;

  // ════════════════════════════════════════════════════════════════════════════
  // HISTORY & TESTING
  // ════════════════════════════════════════════════════════════════════════════

  /** Get paginated delivery history for a webhook */
  async getDeliveries(params: GetDeliveriesInput): Promise<PaginatedResult<WebhookDelivery>>;

  /** Send a test event (webhook.test) to a specific webhook */
  async testWebhook(webhookId: string): Promise<DeliverResult>;

  // ════════════════════════════════════════════════════════════════════════════
  // CRYPTOGRAPHY
  // ════════════════════════════════════════════════════════════════════════════

  /** Generate HMAC-SHA256 signature for a payload string */
  generateSignature(payload: string, secret: string): string;
}

/** Factory function for venture-scoped WebhookService */
export function createWebhookService(ventureId: string): WebhookService;
```

### DeliverResult Type

```typescript
export interface DeliverResult {
  id: string;                                         // Delivery UUID
  webhookId: string;                                  // Parent webhook UUID
  eventType: string;                                  // Event type delivered
  payload: unknown;                                   // Event payload
  responseStatus?: number | null;                     // HTTP response status
  responseBody?: string | null;                       // Response body (truncated)
  durationMs?: number | null;                         // Request round-trip time
  attemptNumber: number | null;                       // Attempt number (1-indexed)
  status: 'pending' | 'success' | 'failed' | 'retrying';  // Delivery status
  nextRetryAt?: Date | null;                          // Scheduled retry time
  createdAt: Date | null;                             // Delivery timestamp
}
```

---

## Validation Schemas (Zod)

All inputs are validated using Zod schemas before reaching the service layer via tRPC.

### Webhook Management Schemas

```typescript
// Retry policy constraints
export const webhookRetryPolicySchema = z.object({
  max_attempts: z.number().min(1).max(10).default(3),
  backoff_ms: z.number().min(100).max(60000).default(1000),
});

// Create a new webhook
export const createWebhookInputSchema = z.object({
  ventureId: z.string().uuid(),
  name: z.string().min(1).max(255),
  url: z.string().url(),
  events: z.array(z.string().min(1)).min(1),          // At least one event type
  headers: z.record(z.string(), z.string()).optional(),
  retryPolicy: webhookRetryPolicySchema.optional(),
});

// Update existing webhook (all fields optional)
export const updateWebhookInputSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string().min(1)).min(1).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  retryPolicy: webhookRetryPolicySchema.optional(),
});

// Get single webhook
export const getWebhookInputSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string().uuid(),
});

// List all webhooks for a venture
export const listWebhooksInputSchema = z.object({
  ventureId: z.string().uuid(),
});

// Delete webhook
export const deleteWebhookInputSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string().uuid(),
});

// Toggle active state
export const toggleWebhookInputSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string().uuid(),
  active: z.boolean(),
});

// Regenerate secret
export const regenerateSecretInputSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string().uuid(),
});
```

### Delivery Schemas

```typescript
// Trigger webhooks for an event
export const triggerWebhooksInputSchema = z.object({
  ventureId: z.string().uuid(),
  eventType: z.string().min(1),
  payload: z.unknown(),
});

// Retry a failed delivery
export const retryDeliveryInputSchema = z.object({
  deliveryId: z.string().uuid(),
  ventureId: z.string().uuid(),
});

// Get delivery history (with offset pagination)
export const getDeliveriesInputSchema = z.object({
  webhookId: z.string().uuid(),
  ventureId: z.string().uuid(),
}).merge(offsetPaginationSchema);   // Adds: page (default 1), pageSize (default 20, max 100)

// Send test event
export const testWebhookInputSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string().uuid(),
});
```

### Inferred Input Types

```typescript
export type CreateWebhookInput = z.infer<typeof createWebhookInputSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookInputSchema>;
export type GetWebhookInput = z.infer<typeof getWebhookInputSchema>;
export type ListWebhooksInput = z.infer<typeof listWebhooksInputSchema>;
export type DeleteWebhookInput = z.infer<typeof deleteWebhookInputSchema>;
export type ToggleWebhookInput = z.infer<typeof toggleWebhookInputSchema>;
export type RegenerateSecretInput = z.infer<typeof regenerateSecretInputSchema>;
export type TriggerWebhooksInput = z.infer<typeof triggerWebhooksInputSchema>;
export type RetryDeliveryInput = z.infer<typeof retryDeliveryInputSchema>;
export type GetDeliveriesInput = z.infer<typeof getDeliveriesInputSchema>;
export type TestWebhookInput = z.infer<typeof testWebhookInputSchema>;
```

---

## tRPC Router

The webhook router exposes all operations as tRPC procedures with role-based access control. **Queries** use `protectedProcedure` (any authenticated user), **mutations** use `adminProcedure` (venture admins and Tier 0 superadmins only).

### Venture Access Control

```typescript
function checkVentureAccess(
  ctx: { permissions: { tier: number }; venture?: { id: string } | null },
  ventureId: string
) {
  // Tier 0 = superadmin → can access any venture
  // All others → must match their own venture ID
  if (ctx.permissions.tier !== 0 && ctx.venture?.id !== ventureId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You can only manage webhooks for your own venture',
    });
  }
}
```

### Route Map

| Procedure | Type | Auth | Input Schema | Description |
|-----------|------|------|-------------|-------------|
| `webhooks.list` | Query | Protected | `listWebhooksInputSchema` | List all webhooks for a venture |
| `webhooks.get` | Query | Protected | `getWebhookInputSchema` | Get single webhook by ID |
| `webhooks.getDeliveries` | Query | Protected | `getDeliveriesInputSchema` | Paginated delivery history |
| `webhooks.create` | Mutation | Admin | `createWebhookInputSchema` | Create new webhook endpoint |
| `webhooks.update` | Mutation | Admin | `updateWebhookInputSchema` | Update webhook configuration |
| `webhooks.delete` | Mutation | Admin | `deleteWebhookInputSchema` | Delete webhook (cascades deliveries) |
| `webhooks.toggle` | Mutation | Admin | `toggleWebhookInputSchema` | Enable/disable webhook |
| `webhooks.regenerateSecret` | Mutation | Admin | `regenerateSecretInputSchema` | Rotate signing secret |
| `webhooks.trigger` | Mutation | Admin | `triggerWebhooksInputSchema` | Manually trigger event dispatch |
| `webhooks.retryDelivery` | Mutation | Admin | `retryDeliveryInputSchema` | Retry a failed delivery |
| `webhooks.test` | Mutation | Admin | `testWebhookInputSchema` | Send test event to endpoint |

### Audit Logging

Every mutation emits an audit log via `AuditService`:

| Route | Audit Event | Category | Metadata |
|-------|-------------|----------|----------|
| `create` | `webhook.created` | `data` | name, url, events |
| `update` | `webhook.updated` | `data` | changed field names |
| `delete` | `webhook.deleted` | `data` | — |
| `toggle` | `webhook.activated` / `webhook.deactivated` | `data` | active state |
| `regenerateSecret` | `webhook.secret_regenerated` | `security` | — |
| `trigger` | `webhook.triggered` | `data` | eventType |
| `retryDelivery` | `webhook.delivery_retried` | `data` | deliveryId |
| `test` | `webhook.tested` | `data` | webhookId |

---

## Delivery Lifecycle

### State Machine

```
                    ┌────────────┐
                    │  pending   │  (initial state on creation)
                    └─────┬──────┘
                          │
                    deliverWebhook()
                          │
             ┌────────────┼────────────┐
             │            │            │
        HTTP 2xx    HTTP 4xx/5xx   Timeout/Error
             │            │            │
             ▼            ▼            ▼
      ┌────────────┐ ┌────────────┐ ┌────────────┐
      │  success   │ │            │ │            │
      │            │ │  attempt   │ │  attempt   │
      │ counter +1 │ │  < max?   │ │  < max?   │
      │ last_trig  │ │            │ │            │
      └────────────┘ └─────┬──────┘ └─────┬──────┘
                           │               │
                    ┌──────┼───────┐ ┌─────┼──────┐
                    │yes   │no     │ │yes  │no    │
                    ▼      ▼       │ ▼     ▼      │
             ┌──────────┐ ┌──────────┐            │
             │ retrying │ │  failed  │            │
             │          │ │          │            │
             │ schedule │ │counter +1│            │
             │ next_    │ │last_trig │            │
             │ retry_at │ │          │            │
             └────┬─────┘ └──────────┘            │
                  │                                │
                  │  (after backoff delay)          │
                  ▼                                │
            ┌────────────┐                         │
            │  pending   │  (retry attempt)        │
            │  (attempt  │                         │
            │   N + 1)   │                         │
            └─────┬──────┘                         │
                  │                                │
                  └── cycle repeats ───────────────┘
```

### Delivery Status Enum

| Status | Description | Terminal? |
|--------|-------------|-----------|
| `pending` | Queued for delivery (initial or retry) | No |
| `success` | HTTP 2xx response received | **Yes** |
| `failed` | All retries exhausted or permanent failure | **Yes** |
| `retrying` | Failed but retry scheduled | No |

### Retry Schedule

The retry engine uses exponential backoff with the formula:

```
delay = backoff_ms × 2^(attempt_number - 1)
```

**Default configuration** (`max_attempts: 3`, `backoff_ms: 1000`):

| Attempt | Delay | Cumulative Wait | Formula |
|---------|-------|----------------|---------|
| 1 | Immediate | 0s | First try |
| 2 | 1,000ms | 1s | `1000 × 2^0` |
| 3 | 2,000ms | 3s | `1000 × 2^1` |

**Maximum configuration** (`max_attempts: 10`, `backoff_ms: 60000`):

| Attempt | Delay | Cumulative Wait |
|---------|-------|----------------|
| 1 | Immediate | 0s |
| 2 | 60s | 1m |
| 3 | 120s | 3m |
| 4 | 240s | 7m |
| 5 | 480s | 15m |
| 6 | 960s | 31m |
| 7 | 1,920s | ~63m |
| 8 | 3,840s | ~127m |
| 9 | 7,680s | ~255m |
| 10 | 15,360s | ~511m (~8.5h) |

### Response Classification

| Condition | Status | Retry? | Rationale |
|-----------|--------|--------|-----------|
| HTTP 2xx | `success` | No | Endpoint acknowledged receipt |
| HTTP 4xx (except 429) | `failed` or `retrying` | Yes* | Client error, likely permanent |
| HTTP 429 (Too Many Requests) | `retrying` | Yes | Rate limited, transient |
| HTTP 5xx | `retrying` | Yes | Server error, likely transient |
| Timeout (30s) | `retrying` | Yes | Slow or unresponsive endpoint |
| Connection refused | `retrying` | Yes | Endpoint down, may recover |
| DNS resolution failure | `retrying` | Yes | DNS propagation or temporary failure |

*Note: The current implementation retries on all non-2xx responses and errors until max attempts are exhausted. A future enhancement may short-circuit on 4xx errors.

---

## Signature Generation & Verification

### Algorithm

All outbound webhook deliveries are signed using **HMAC-SHA256**:

```
signature = HMAC-SHA256(webhook.secret, JSON.stringify(payload))
```

### Secret Format

Webhook secrets are generated using `crypto.randomBytes(32)` with a `whsec_` prefix:

```
whsec_a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
      └──────────────────── 64 hex characters (32 bytes) ────────────────────┘
```

The `whsec_` prefix:
- Makes secrets visually identifiable as webhook secrets
- Enables automated secret scanning (e.g., GitHub secret detection)
- Follows the convention used by Stripe (`whsec_`), Svix, and other webhook providers

### Request Headers

Every outbound webhook delivery includes these headers:

| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `application/json` | Payload MIME type |
| `X-Webhook-Signature` | `<hex_digest>` | HMAC-SHA256 hex signature |
| `X-Webhook-Event` | `<event_type>` | Event type (e.g., `invoice.paid`) |
| `X-Webhook-Id` | `<webhook_uuid>` | Webhook endpoint UUID |
| `X-Webhook-Timestamp` | `<iso_8601>` | ISO 8601 delivery timestamp |
| Custom headers | From `webhook.headers` | User-configured headers (merged last) |

### Signature Generation (Service Implementation)

```typescript
/**
 * Generate HMAC-SHA256 signature for payload verification.
 * Uses the webhook's stored secret as the HMAC key.
 */
generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
```

### Signature Verification (Receiver-Side Guide)

```typescript
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify an MCV webhook signature.
 * CRITICAL: Uses timing-safe comparison to prevent timing attacks.
 */
function verifyMcvWebhookSignature(
  rawBody: string,          // Raw request body (before JSON.parse)
  signature: string,        // X-Webhook-Signature header value
  secret: string,           // Your webhook secret (whsec_*)
): boolean {
  const expected = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(signature, 'utf8');

  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}
```

### Replay Protection (Receiver-Side Guide)

Receivers should implement these additional protections:

1. **Timestamp validation:** Reject deliveries where `X-Webhook-Timestamp` is older than ±5 minutes
2. **Idempotency:** Store `X-Webhook-Id` to detect and skip duplicate retried deliveries
3. **Body integrity:** Verify the signature against the raw body, not a re-serialized version

```typescript
function validateWebhookDelivery(req: Request): boolean {
  const timestamp = req.headers['x-webhook-timestamp'];
  const webhookId = req.headers['x-webhook-id'];
  const signature = req.headers['x-webhook-signature'];

  // 1. Timestamp freshness (±5 minutes)
  const deliveryTime = new Date(timestamp).getTime();
  const now = Date.now();
  if (Math.abs(now - deliveryTime) > 5 * 60 * 1000) {
    return false; // Replay attack or stale delivery
  }

  // 2. Idempotency check
  if (await isDeliveryAlreadyProcessed(webhookId)) {
    return false; // Already handled this delivery
  }

  // 3. Signature verification
  return verifyMcvWebhookSignature(req.rawBody, signature, SECRET);
}
```

---

## Event Types

Webhooks can subscribe to any combination of platform events. The `*` wildcard subscribes to **all** events.

### Payment Events (`@mcv/payments`)

| Event | Description | Payload Key Fields |
|-------|-------------|-------------------|
| `payment.succeeded` | Payment processed successfully | `payment_id`, `amount`, `currency` |
| `payment.failed` | Payment attempt failed | `payment_id`, `error_code`, `error_message` |
| `payment.refunded` | Full or partial refund issued | `payment_id`, `refund_amount`, `reason` |
| `subscription.created` | New subscription started | `subscription_id`, `plan_id`, `customer_id` |
| `subscription.canceled` | Subscription canceled | `subscription_id`, `cancel_reason` |
| `subscription.updated` | Subscription plan/quantity changed | `subscription_id`, `changes` |
| `invoice.created` | Invoice generated | `invoice_id`, `amount`, `due_date` |
| `invoice.paid` | Invoice payment received | `invoice_id`, `payment_id` |
| `invoice.overdue` | Invoice past due date | `invoice_id`, `days_overdue` |
| `dispute.created` | Payment dispute opened | `dispute_id`, `reason`, `amount` |
| `dispute.resolved` | Dispute won or lost | `dispute_id`, `outcome` |

### Communication Events (`@mcv/twilio`, `@mcv/email`)

| Event | Description | Payload Key Fields |
|-------|-------------|-------------------|
| `sms.received` | Inbound SMS message received | `from`, `to`, `body`, `message_sid` |
| `sms.delivered` | Outbound SMS delivered | `message_sid`, `to`, `status` |
| `sms.failed` | SMS delivery failed | `message_sid`, `error_code`, `error_message` |
| `call.completed` | Voice call ended | `call_sid`, `duration`, `from`, `to` |
| `call.recording.ready` | Call recording available | `call_sid`, `recording_url` |
| `voicemail.received` | New voicemail recorded | `recording_url`, `duration`, `from` |
| `email.delivered` | Email delivered to recipient | `message_id`, `to`, `subject` |
| `email.opened` | Email opened by recipient | `message_id`, `opened_at` |
| `email.clicked` | Link in email clicked | `message_id`, `url`, `clicked_at` |
| `email.bounced` | Email bounced | `message_id`, `bounce_type`, `reason` |
| `email.spam_report` | Recipient reported spam | `message_id`, `email` |

### CRM Events (`@mcv/crm`)

| Event | Description | Payload Key Fields |
|-------|-------------|-------------------|
| `contact.created` | New contact added | `contact_id`, `email`, `name` |
| `contact.updated` | Contact details changed | `contact_id`, `changed_fields` |
| `deal.won` | Deal marked as won | `deal_id`, `amount`, `contact_id` |
| `deal.lost` | Deal marked as lost | `deal_id`, `loss_reason` |
| `deal.stage_changed` | Deal moved to new pipeline stage | `deal_id`, `old_stage`, `new_stage` |

### System Events

| Event | Description | Payload Key Fields |
|-------|-------------|-------------------|
| `user.created` | New user registered | `user_id`, `email`, `venture_id` |
| `user.invited` | User invitation sent | `invite_id`, `email`, `role` |
| `workflow.completed` | Automation workflow finished | `workflow_id`, `status`, `duration` |
| `webhook.test` | Test event for endpoint verification | `message`, `webhook_id`, `timestamp` |

### NAOS Agent Events (`@mcv/naos`)

| Event | Description | Payload Key Fields |
|-------|-------------|-------------------|
| `task.created` | New task queued for agent | `task_id`, `agent`, `priority` |
| `task.completed` | Agent completed a task | `task_id`, `outcome`, `duration` |
| `task.failed` | Agent task execution failed | `task_id`, `error`, `agent` |
| `workflow.started` | Multi-step workflow initiated | `workflow_id`, `steps` |
| `workflow.step_completed` | Individual workflow step done | `workflow_id`, `step`, `result` |

### Wildcard Subscription

```typescript
// Subscribe to ALL events
events: ['*']

// Subscribe to specific events
events: ['invoice.paid', 'subscription.created', 'contact.created']

// Mix specific events (no partial wildcards like 'payment.*')
events: ['payment.succeeded', 'payment.failed', 'payment.refunded']
```

---

## Client Hooks (React)

The admin UI exposes webhook management through tRPC-backed React hooks with TanStack Query.

### Query Hooks

```typescript
/**
 * List all webhooks for a venture.
 * Stale time: 30s. Refetches on window focus.
 */
function useWebhooks(ventureId: string): UseQueryResult<Webhook[]>;

/**
 * Get a single webhook by ID.
 * Stale time: 30s.
 */
function useWebhook(ventureId: string, webhookId: string): UseQueryResult<Webhook>;

/**
 * Get paginated delivery history for a webhook.
 * Stale time: 15s (deliveries change more frequently).
 * Uses keepPreviousData for seamless pagination.
 */
function useWebhookDeliveries(
  ventureId: string,
  webhookId: string,
  options?: { page?: number; pageSize?: number },
): UseQueryResult<PaginatedResult<WebhookDelivery>>;
```

### Mutation Hooks

Each mutation automatically invalidates the relevant queries on success:

```typescript
function useCreateWebhook(): UseMutationResult;      // → invalidates list
function useUpdateWebhook(): UseMutationResult;       // → invalidates list + get
function useDeleteWebhook(): UseMutationResult;       // → invalidates list
function useToggleWebhook(): UseMutationResult;       // → invalidates list + get
function useRegenerateWebhookSecret(): UseMutationResult;  // → invalidates get
function useTriggerWebhooks(): UseMutationResult;     // → invalidates deliveries
function useRetryDelivery(): UseMutationResult;       // → invalidates deliveries
function useTestWebhook(): UseMutationResult;         // → invalidates deliveries
```

### Composite Hooks

Two convenience hooks aggregate multiple operations:

```typescript
/**
 * Full management of a single webhook.
 * Combines query + all mutation operations.
 */
function useWebhookManagement(ventureId: string, webhookId: string): {
  webhook: Webhook | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;

  update: (data: Partial<UpdateWebhookInput>) => Promise<Webhook>;
  isUpdating: boolean;

  delete: () => Promise<{ success: true }>;
  isDeleting: boolean;

  toggle: (active: boolean) => Promise<Webhook>;
  isToggling: boolean;

  regenerateSecret: () => Promise<{ secret: string }>;
  isRegenerating: boolean;

  test: () => Promise<DeliverResult>;
  isTesting: boolean;
};

/**
 * Webhook list with inline operations.
 * Combines list query + create, delete, toggle mutations.
 */
function useWebhookList(ventureId: string): {
  webhooks: Webhook[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;

  create: (data: CreateWebhookInput) => Promise<Webhook>;
  isCreating: boolean;

  delete: (webhookId: string) => Promise<{ success: true }>;
  isDeleting: boolean;

  toggle: (webhookId: string, active: boolean) => Promise<Webhook>;
  isToggling: boolean;
};
```

---

## Code Examples

### 1. Register a Webhook Endpoint

```typescript
import { db } from '@mcv/db';
import { webhooks } from '@mcv/db/schema';
import { randomBytes } from 'crypto';

// Generate a cryptographically secure signing secret
const secret = `whsec_${randomBytes(32).toString('hex')}`;

const [webhook] = await db.insert(webhooks).values({
  ventureId,
  name: 'Zapier Integration',
  url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
  secret,
  events: ['invoice.paid', 'subscription.created', 'contact.created'],
  headers: { 'X-Custom-Header': 'my-value' },
  retryPolicy: { max_attempts: 5, backoff_ms: 2000 },
  createdBy: userId,
}).returning();
```

### 2. Dispatch Events via WebhookService

```typescript
import { createWebhookService } from '@mcv/api';

const service = createWebhookService(ventureId);

// Trigger all webhooks subscribed to 'invoice.paid'
await service.triggerWebhooks('invoice.paid', {
  invoice_id: 'inv_abc123',
  amount: 9900,           // cents
  currency: 'usd',
  customer_email: 'user@example.com',
  paid_at: new Date().toISOString(),
});
```

### 3. Execute Delivery with Full Lifecycle

The `deliverWebhook` method handles the complete delivery lifecycle:

```typescript
import { createWebhookService } from '@mcv/api';

const service = createWebhookService(ventureId);

// Internal flow of deliverWebhook:
//
// 1. Fetch webhook from DB (get by ID + venture scope)
// 2. Serialize payload → JSON.stringify(payload)
// 3. Generate HMAC-SHA256 signature
// 4. Build request headers (standard + custom)
// 5. Execute HTTP POST with 30s timeout (AbortSignal.timeout)
// 6. Record delivery in webhook_deliveries table
// 7. Update webhook counters (success_count or failure_count)
// 8. If failed and retries remain → schedule next retry via next_retry_at

const delivery = await service.deliverWebhook(
  webhookId,
  'contact.created',
  { contact_id: 'ct_xyz', name: 'John Doe', email: 'john@example.com' },
);

console.log(delivery.status);         // 'success' | 'failed' | 'retrying'
console.log(delivery.durationMs);     // 234
console.log(delivery.responseStatus); // 200
console.log(delivery.attemptNumber);  // 1
```

### 4. Test a Webhook Endpoint

```typescript
import { createWebhookService } from '@mcv/api';

const service = createWebhookService(ventureId);

// Sends a webhook.test event with a diagnostic payload
const testDelivery = await service.testWebhook(webhookId);

// Test payload structure:
// {
//   type: 'webhook.test',
//   timestamp: '2026-02-08T19:30:00.000Z',
//   data: { message: 'This is a test webhook delivery.' }
// }

if (testDelivery.status === 'success') {
  console.log(`Endpoint verified in ${testDelivery.durationMs}ms`);
} else {
  console.log(`Endpoint failed: HTTP ${testDelivery.responseStatus}`);
}
```

### 5. Rotate a Webhook Secret

```typescript
import { createWebhookService } from '@mcv/api';

const service = createWebhookService(ventureId);

const { secret } = await service.regenerateSecret(webhookId);
// secret = 'whsec_<64 hex chars>'

// IMPORTANT: The venture must update their receiver to use the new secret.
// Old signatures will no longer verify after rotation.
```

### 6. Query Delivery History with Pagination

```typescript
import { createWebhookService } from '@mcv/api';

const service = createWebhookService(ventureId);

const result = await service.getDeliveries({
  webhookId,
  ventureId,
  page: 1,
  pageSize: 50,
});

console.log(result.items);      // WebhookDelivery[]
console.log(result.total);      // 142
console.log(result.page);       // 1
console.log(result.pageSize);   // 50
console.log(result.totalPages); // 3
```

### 7. Retry a Failed Delivery

```typescript
import { createWebhookService } from '@mcv/api';

const service = createWebhookService(ventureId);

// Retries with attempt_number + 1
const retried = await service.retryDelivery(deliveryId);

console.log(retried.attemptNumber); // 2
console.log(retried.status);        // 'success' | 'retrying' | 'failed'
```

### 8. Verify Webhook Signature (Express Receiver)

```typescript
import express from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

const app = express();
app.use(express.raw({ type: 'application/json' }));

const WEBHOOK_SECRET = process.env.MCV_WEBHOOK_SECRET!;

app.post('/webhooks/mcv', (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const rawBody = req.body.toString('utf8');

  // Generate expected signature
  const expected = createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  // Timing-safe comparison (prevents timing attacks)
  const sigBuf = Buffer.from(signature ?? '', 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');

  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse and process
  const event = JSON.parse(rawBody);
  console.log(`Received: ${req.headers['x-webhook-event']}`, event);

  // Respond quickly (< 30s) to prevent timeout
  res.status(200).json({ received: true });
});
```

### 9. Query Delivery Statistics

```typescript
import { db, eq, sql, gte, and } from '@mcv/db';
import { webhookDeliveries } from '@mcv/db/schema';

// Aggregate delivery stats for the last 24 hours
const stats = await db
  .select({
    status: webhookDeliveries.status,
    count: sql<number>`count(*)::int`,
    avgDuration: sql<number>`avg(${webhookDeliveries.durationMs})::int`,
    maxDuration: sql<number>`max(${webhookDeliveries.durationMs})::int`,
  })
  .from(webhookDeliveries)
  .where(
    and(
      eq(webhookDeliveries.webhookId, webhookId),
      gte(webhookDeliveries.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    )
  )
  .groupBy(webhookDeliveries.status);

// Result:
// [
//   { status: 'success', count: 142, avgDuration: 234, maxDuration: 1200 },
//   { status: 'failed',  count: 3,   avgDuration: 30012, maxDuration: 30000 },
// ]
```

### 10. Replay All Failed Deliveries

```typescript
import { db, eq, and } from '@mcv/db';
import { webhookDeliveries } from '@mcv/db/schema';
import { createWebhookService } from '@mcv/api';

const service = createWebhookService(ventureId);

// Find all failed deliveries for a webhook
const failed = await db
  .select()
  .from(webhookDeliveries)
  .where(
    and(
      eq(webhookDeliveries.webhookId, webhookId),
      eq(webhookDeliveries.status, 'failed'),
    )
  )
  .limit(100);

// Retry each one
const results = await Promise.allSettled(
  failed.map(d => service.retryDelivery(d.id))
);

const succeeded = results.filter(r => r.status === 'fulfilled').length;
const errored = results.filter(r => r.status === 'rejected').length;
console.log(`Replayed: ${succeeded} succeeded, ${errored} errored`);
```

### 11. React: Webhook Management UI

```tsx
import {
  useWebhookList,
  useWebhookManagement,
  useWebhookDeliveries,
} from '@/features/integrations/api/use-webhooks';

function WebhookListPage({ ventureId }: { ventureId: string }) {
  const {
    webhooks, isLoading, create, isCreating, toggle, delete: deleteWebhook,
  } = useWebhookList(ventureId);

  if (isLoading) return <Spinner />;

  return (
    <div>
      <button
        onClick={() => create({
          name: 'My Webhook',
          url: 'https://example.com/hook',
          events: ['invoice.paid'],
        })}
        disabled={isCreating}
      >
        Add Webhook
      </button>

      {webhooks.map(wh => (
        <WebhookCard
          key={wh.id}
          webhook={wh}
          onToggle={(active) => toggle(wh.id, active)}
          onDelete={() => deleteWebhook(wh.id)}
        />
      ))}
    </div>
  );
}

function WebhookDetailPage({ ventureId, webhookId }: Props) {
  const {
    webhook, isLoading, update, toggle, regenerateSecret, test, isTesting,
  } = useWebhookManagement(ventureId, webhookId);

  const { data: deliveries } = useWebhookDeliveries(ventureId, webhookId, {
    page: 1,
    pageSize: 20,
  });

  if (isLoading || !webhook) return <Spinner />;

  return (
    <div>
      <h1>{webhook.name}</h1>
      <p>URL: {webhook.url}</p>
      <p>Events: {webhook.events.join(', ')}</p>
      <p>Success: {webhook.successCount} | Failures: {webhook.failureCount}</p>

      <button onClick={() => test()} disabled={isTesting}>
        {isTesting ? 'Sending...' : 'Send Test'}
      </button>

      <button onClick={() => toggle(!webhook.isActive)}>
        {webhook.isActive ? 'Disable' : 'Enable'}
      </button>

      <DeliveryTable deliveries={deliveries?.items ?? []} />
    </div>
  );
}
```

---

## Inbound Webhook Receivers

While the core `@mcv/webhooks` module handles **outbound** deliveries, the MCV ecosystem also includes **inbound** webhook receivers co-located with their respective domain packages. These are documented here for completeness.

### Stripe Webhook Receiver (`@mcv/payments`)

**Route:** `apps/admin/src/app/api/webhooks/stripe/route.ts`

Receives Stripe events via Next.js API route:

```typescript
// Handled events:
const HANDLED_EVENTS = [
  'checkout.session.completed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
] as const;

// Validates: stripe-signature header
// Returns: { received: true, processed: boolean, action?: string }
```

### SendGrid Webhook Receiver (`@mcv/email`)

**Service:** `packages/email/src/server/services/webhook-handler.service.ts`

Processes SendGrid event batches and updates `email_sends` table:

```typescript
class WebhookHandlerService {
  // Processes events: delivered, open, click, bounce, dropped,
  //                   deferred, spamreport, unsubscribe, processed
  async processEvents(events: SendGridWebhookEvent[]): Promise<{
    processed: number;
    errors: number;
  }>;

  // Verifies ECDSA signature using SendGrid's public key
  verifySignature(publicKey, payload, signature, timestamp): boolean;

  // Maintains suppression lists for bounces, spam reports, unsubscribes
  // Updates campaign statistics automatically
}
```

### Twilio Webhook Receivers (`@mcv/twilio`)

**Handlers:**
- `packages/twilio/src/server/webhooks/sms-webhook.ts` — Inbound SMS
- `packages/twilio/src/server/webhooks/voice-webhook.ts` — Voice call events
- `packages/twilio/src/server/webhooks/status-webhook.ts` — Delivery status callbacks

### GitHub Webhook Receiver (`@mcv/github`)

**Middleware:** `packages/github/src/server/middleware/github-webhook.ts`

Processes GitHub push, PR, and issue events using `@octokit/webhooks`.

---

## Notification Webhooks: Advanced Features

The `notification_webhooks` table extends the base webhook model with features targeted at the notification system:

### Multiple Authentication Types

```typescript
// No authentication
{ authType: 'none', authSecret: null }

// Bearer token
{ authType: 'bearer', authSecret: 'encrypted:eyJhbGciOi...' }
// Adds: Authorization: Bearer <token>

// Basic auth
{ authType: 'basic', authSecret: 'encrypted:dXNlcjpwYXNz' }
// Adds: Authorization: Basic <base64>

// HMAC-SHA256 (same as core webhooks)
{ authType: 'hmac', authSecret: 'encrypted:whsec_...' }
// Adds: X-Webhook-Signature: <hex_digest>
```

### Payload Filtering

Filter events by payload field values before delivery:

```typescript
// Only deliver when payment amount > 10000 cents ($100)
const filters: WebhookFilter[] = [
  { field: 'amount', operator: 'gt', value: 10000 },
];

// Only deliver for specific customer
const filters: WebhookFilter[] = [
  { field: 'customer_email', operator: 'eq', value: 'vip@example.com' },
];

// Only deliver for certain product categories
const filters: WebhookFilter[] = [
  { field: 'category', operator: 'in', value: ['enterprise', 'premium'] },
];
```

### Consecutive Failure Tracking

Unlike the core `webhooks` table which tracks lifetime success/failure counts, `notification_webhooks` tracks **consecutive** failures for automatic disable:

```typescript
// After each successful delivery:
consecutiveFailures = 0;
lastSuccessAt = now();

// After each failed delivery:
consecutiveFailures += 1;
lastFailureAt = now();

// Auto-disable threshold (configurable, typically 10-20):
if (consecutiveFailures >= THRESHOLD) {
  isActive = false;
  // Notify venture admin
}
```

---

## NAOS Integration

The webhooks module integrates with MCV.ONE's NAOS (Network Autonomous Operating System) for AI-driven automation. NAOS agents can both produce and consume webhook events.

### Webhook-Triggered Agent Workflows

External systems (Notion, n8n, Make.com) trigger NAOS workflows via webhooks:

```
┌─────────┐    webhook    ┌─────────┐    execute    ┌─────────┐
│ Notion  │──────────────▶│   n8n   │──────────────▶│  Agent  │
│ Change  │               │Workflow │               │ Session │
└─────────┘               └─────────┘               └─────────┘
                               │
                               ▼
                          ┌─────────┐
                          │ Update  │
                          │ Notion  │
                          └─────────┘
```

### Agent-Generated Webhook Events

NAOS agents emit events that trigger outbound webhooks:

```typescript
// When Queen agent completes task decomposition
await service.triggerWebhooks('task.created', {
  task_id: 'task_abc',
  agent: 'queen',
  priority: 'high',
  parent_spec: 'spec_xyz',
});

// When Ralph agent finishes code generation
await service.triggerWebhooks('task.completed', {
  task_id: 'task_abc',
  agent: 'ralph',
  outcome: 'success',
  files_modified: ['src/components/UserProfile.tsx'],
  duration_ms: 45000,
});
```

---

## Security Considerations

### Outbound Webhook Security

| Concern | Implementation | Status |
|---------|----------------|--------|
| **Payload integrity** | HMAC-SHA256 signatures on every delivery | ✅ Implemented |
| **Timing-safe comparison** | `crypto.timingSafeEqual()` in verification guide | ✅ Documented |
| **Secret generation** | `crypto.randomBytes(32)` with `whsec_` prefix | ✅ Implemented |
| **Secret rotation** | `regenerateSecret()` endpoint with audit log | ✅ Implemented |
| **Tenant isolation** | Venture-scoped service (`WebhookService(ventureId)`) | ✅ Implemented |
| **Access control** | `protectedProcedure` for reads, `adminProcedure` for writes | ✅ Implemented |
| **HTTPS enforcement** | URL validation via `z.string().url()` (runtime) | ⚠️ Partial (no HTTPS-only) |
| **Secret encryption at rest** | DB-level encryption | ⚠️ Planned |
| **Payload size limits** | Configurable max payload size | ⚠️ Planned |
| **IP allowlisting** | Restrict outbound delivery IPs | ⚠️ Not implemented |
| **Response body truncation** | Truncated to 10,000 chars in delivery log | ✅ Implemented |
| **Cascade delete** | Deliveries cascade-deleted with webhook | ✅ Implemented |
| **Replay protection** | `X-Webhook-Id` + `X-Webhook-Timestamp` headers | ✅ Delivered |

### Inbound Webhook Security

| Receiver | Verification Method | Status |
|----------|-------------------|--------|
| Stripe | `stripe-signature` header validation | ✅ Header checked |
| SendGrid | ECDSA signature verification | ✅ Implemented |
| Twilio | Request signature validation via `twilio.validateRequest()` | ✅ Implemented |
| GitHub | `@octokit/webhooks` signature verification | ✅ Implemented |
| Notion | HMAC-SHA256 signature verification | ✅ Documented |

### Security Best Practices

1. **Always verify signatures** before processing webhook payloads
2. **Use timing-safe comparison** (`timingSafeEqual`) — never `===` for signatures
3. **Validate timestamps** to prevent replay attacks (±5 minute window)
4. **Store delivery IDs** for idempotency — webhooks may be delivered more than once
5. **Respond quickly** (< 30 seconds) — long processing should be queued asynchronously
6. **Rotate secrets periodically** via the `regenerateSecret` endpoint
7. **Monitor failure rates** — auto-disable webhooks with sustained failures
8. **Encrypt secrets at rest** — use database-level or application-level encryption

---

## Performance Considerations

### Delivery Performance

| Aspect | Implementation | Impact |
|--------|----------------|--------|
| **Parallel fan-out** | `Promise.allSettled()` for multiple webhooks | Concurrent delivery to all matching endpoints |
| **30-second timeout** | `AbortSignal.timeout(30000)` per delivery | Prevents slow endpoints from blocking queue |
| **GIN index on events** | `idx_webhooks_events` using PostgreSQL GIN | O(1) array containment queries |
| **Async recording** | Delivery recorded after HTTP response | Doesn't block the HTTP call |
| **Response truncation** | Response bodies capped at 10KB | Prevents storage explosion |

### Query Performance

| Query Pattern | Index Used | Expected Performance |
|---------------|-----------|---------------------|
| List webhooks by venture | `idx_webhooks_venture` | < 5ms for typical ventures |
| Match event subscribers | `idx_webhooks_events` (GIN) | < 10ms with array containment |
| Delivery history by webhook | `idx_webhook_deliveries_webhook` | < 20ms for paginated queries |
| Retry scheduler polling | `idx_webhook_deliveries_status` | < 50ms for batch polling |
| Active notification webhooks | `webhook_active_idx` | < 5ms |

### Scalability Guidelines

1. **Delivery log retention:** Prune `webhook_deliveries` older than retention period (default 30 days) to prevent unbounded table growth
2. **Batch polling:** Retry scheduler should poll `next_retry_at <= NOW() AND status = 'retrying'` in batches (limit 100)
3. **Connection pooling:** HTTP client should reuse connections for repeated deliveries to the same host
4. **Rate limiting:** Consider per-venture rate limits for high-volume event producers
5. **Dead letter queue:** For deliveries that fail all retries, consider a DLQ pattern for manual investigation
6. **Horizontal scaling:** The stateless `WebhookService` can run across multiple API instances safely

---

## Testing

### Test Suite Coverage

The webhook service has comprehensive unit tests covering:

| Test Category | Tests | Description |
|--------------|-------|-------------|
| **Database unavailable** | 4 | Verifies graceful error handling when DB is null |
| **Create webhook** | 2 | Secret generation (`whsec_` prefix), default retry policy |
| **HMAC signature** | 4 | Deterministic output, consistency, payload/secret sensitivity |
| **Event matching** | 2 | Exact event match, wildcard (`*`) subscription |
| **Delivery recording** | 3 | Success recording, retry scheduling, signature header inclusion |
| **Regenerate secret** | 1 | DB unavailable error propagation |

### Test Infrastructure

```typescript
// Tests use Vitest with comprehensive mocking:
// - @mcv/db mocked with chainable query builder
// - drizzle-orm operators mocked (eq, and, desc, sql)
// - global.fetch mocked for HTTP delivery testing
// - crypto module used directly (not mocked) for signature verification

describe('WebhookService', () => {
  let webhookService: WebhookService;

  beforeEach(async () => {
    vi.resetModules();
    webhookService = new WebhookService('venture-1');
  });

  // ... test suites
});
```

### Key Test Assertions

```typescript
// Secret format validation
expect(valuesCall.secret).toMatch(/^whsec_[a-f0-9]{64}$/);

// Signature correctness
const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
expect(signature).toBe(expected);

// Retry scheduling
expect(insertValues.status).toBe('retrying');
expect(insertValues.nextRetryAt).toBeInstanceOf(Date);

// Signature header presence
expect(headers['X-Webhook-Signature']).toBeDefined();
```

### Running Tests

```bash
# Run webhook service tests
pnpm --filter @mcv/api test -- webhook.service

# Run with coverage
pnpm --filter @mcv/api test -- --coverage webhook.service

# Watch mode
pnpm --filter @mcv/api test -- --watch webhook.service
```

---

## Error Codes

### Service-Level Errors

| Error | tRPC Code | Context | Description |
|-------|-----------|---------|-------------|
| `Database connection not available` | `INTERNAL_SERVER_ERROR` | Any operation | DB instance is null/undefined |
| `Webhook not found` | `NOT_FOUND` | get, update, delete, toggle, deliver | Invalid webhook ID or wrong venture |
| `Delivery not found` | `NOT_FOUND` | retryDelivery | Invalid delivery ID |
| `Failed to create webhook` | `INTERNAL_SERVER_ERROR` | create | Insert returned no rows |
| `You can only manage webhooks for your own venture` | `FORBIDDEN` | Any route | Venture access violation |

### Delivery-Level Errors

| Error | Status | Retryable | Description |
|-------|--------|-----------|-------------|
| Connection refused | `retrying` | Yes | Endpoint not accepting connections |
| DNS resolution failure | `retrying` | Yes | Hostname cannot be resolved |
| Request timeout (30s) | `retrying` | Yes | Endpoint did not respond in time |
| HTTP 429 Too Many Requests | `retrying` | Yes | Rate limited by endpoint |
| HTTP 5xx Server Error | `retrying` | Yes | Endpoint server error |
| HTTP 4xx Client Error | `retrying`/`failed` | Conditional | Bad request to endpoint |
| Max retries exceeded | `failed` | No | All retry attempts exhausted |

---

## Audit Events

Every webhook mutation generates an audit log entry with full context:

| Event | Trigger | Category | Metadata |
|-------|---------|----------|----------|
| `webhook.created` | Endpoint registered | `data` | webhookId, name, url, events |
| `webhook.updated` | Configuration changed | `data` | webhookId, changed field names |
| `webhook.deleted` | Endpoint removed | `data` | webhookId |
| `webhook.activated` | Webhook enabled | `data` | webhookId, active: true |
| `webhook.deactivated` | Webhook disabled | `data` | webhookId, active: false |
| `webhook.secret_regenerated` | Secret rotated | `security` | webhookId |
| `webhook.triggered` | Manual event dispatch | `data` | webhookId, eventType |
| `webhook.delivery_retried` | Failed delivery retried | `data` | deliveryId |
| `webhook.tested` | Test event dispatched | `data` | webhookId |

### Audit Log Structure

```typescript
await auditService.log({
  eventType: 'webhook.created',         // Audit event type
  category: 'data',                     // 'data' | 'security' | 'access'
  action: 'create',                     // CRUD action
  actorType: 'user',                    // 'user' | 'system' | 'agent'
  actorId: ctx.session.userId,          // Who performed the action
  ventureId: input.ventureId,           // Tenant scope
  resourceType: 'webhook',             // Resource type
  resourceId: webhook.id,              // Resource ID
  ipAddress: ctx.ip,                    // Client IP address
  metadata: {                           // Additional context
    name: input.name,
    url: input.url,
    events: input.events,
  },
});
```

---

## Migration Path

### From Core Webhooks to Notification Webhooks

The platform maintains two webhook tables with different capabilities:

| Feature | `webhooks` | `notification_webhooks` |
|---------|-----------|----------------------|
| Authentication | HMAC-SHA256 only | HMAC, Bearer, Basic, none |
| Event filtering | Array match only | Field-level filters |
| Failure tracking | Lifetime counters | Consecutive failure count |
| Auto-disable | Manual (health check logic) | Built-in via `consecutiveFailures` |
| Delivery log | Separate `webhook_deliveries` table | Inline (planned) |
| Custom headers | Yes | Via auth headers |
| Retry policy | Per-webhook configurable | Global (planned) |
| Service layer | Full `WebhookService` class | Used by notification system |
| tRPC routes | Full CRUD + delivery operations | Via notification routes |

**Future consolidation:** These two tables may be unified in a future version, with `notification_webhooks` features (auth types, filters, consecutive failures) migrated into the core `webhooks` table.

---

## Configuration Reference

### Default Webhook Configuration

```typescript
const WEBHOOK_DEFAULTS = {
  // Delivery
  timeout_ms: 30_000,              // 30-second HTTP timeout
  max_payload_size: 256_000,       // 256KB max payload
  response_body_max_chars: 10_000, // 10KB response body truncation

  // Retry
  max_attempts: 3,                 // Default retry attempts
  backoff_ms: 1_000,               // Default base backoff (1s)
  max_backoff_ms: 60_000,          // Maximum backoff per retry policy

  // Secret
  secret_prefix: 'whsec_',        // Secret prefix for identification
  secret_bytes: 32,                // 32 bytes = 64 hex characters

  // Health
  failure_rate_threshold: 0.9,     // 90% failure rate → consider disabling
  min_deliveries_for_health: 10,   // Minimum deliveries before health check
  consecutive_failure_threshold: 10, // Auto-disable after N consecutive failures

  // Retention
  delivery_log_retention_days: 30, // Prune deliveries older than 30 days

  // Pagination
  default_page_size: 20,           // Default delivery history page size
  max_page_size: 100,              // Maximum delivery history page size
};
```

### Webhook Delivery Headers Template

```typescript
const DELIVERY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Webhook-Signature': '<hmac_hex>',
  'X-Webhook-Event': '<event_type>',
  'X-Webhook-Id': '<webhook_uuid>',
  'X-Webhook-Timestamp': '<iso_8601>',
  // + webhook.headers (user-configured, merged last to allow overrides)
};
```

---

## File Map

```
packages/
├── db/src/schema/
│   ├── webhooks.ts                    # Core webhooks table + relations + types
│   ├── webhook-deliveries.ts          # Delivery log table + relations + types
│   └── notification-webhooks.ts       # Advanced notification webhooks + types
│
├── api/src/
│   ├── routers/webhook.router.ts      # tRPC router (11 procedures)
│   ├── schemas/webhook.schema.ts      # Zod validation schemas (11 schemas)
│   ├── services/webhook.service.ts    # WebhookService class (core logic)
│   └── schemas/common.schema.ts       # Shared: uuidSchema, offsetPaginationSchema
│
├── api/tests/services/
│   └── webhook.service.test.ts        # Vitest unit tests (16 tests)
│
├── email/src/server/services/
│   └── webhook-handler.service.ts     # SendGrid inbound webhook handler
│
├── payments/src/server/
│   ├── middleware/stripe-webhook.ts    # Stripe signature verification
│   └── services/webhook-handler.service.ts  # Stripe event processing
│
├── twilio/src/server/
│   ├── webhooks/sms-webhook.ts        # Twilio SMS inbound
│   ├── webhooks/voice-webhook.ts      # Twilio voice events
│   ├── webhooks/status-webhook.ts     # Twilio status callbacks
│   └── services/webhook-handler.service.ts  # Twilio event processing
│
├── github/src/server/middleware/
│   └── github-webhook.ts             # GitHub event processing
│
apps/admin/src/
├── app/api/webhooks/
│   ├── stripe/route.ts               # Next.js Stripe webhook API route
│   └── storage/optimize/route.ts     # Storage optimization webhook
│
└── features/integrations/api/
    └── use-webhooks.ts               # React hooks (12 hooks)
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-08 | Initial comprehensive documentation |
| — | — | Core `webhooks` + `webhook_deliveries` schema |
| — | — | `notification_webhooks` schema with advanced features |
| — | — | Full `WebhookService` with CRUD + delivery + retry |
| — | — | tRPC router with 11 procedures + audit logging |
| — | — | 11 Zod validation schemas |
| — | — | 12 React hooks (queries, mutations, composites) |
| — | — | Vitest test suite (16 tests) |
| — | — | Inbound webhook receivers: Stripe, SendGrid, Twilio, GitHub |

---

## Roadmap

### Planned Enhancements

| Feature | Priority | Description |
|---------|----------|-------------|
| **HTTPS-only enforcement** | High | Reject non-HTTPS URLs in production |
| **Secret encryption at rest** | High | Encrypt `secret` and `auth_secret` columns |
| **Background delivery queue** | High | Move from inline delivery to job queue (BullMQ) |
| **Dead letter queue** | Medium | Capture permanently failed deliveries for manual review |
| **Webhook event log** | Medium | Centralized event catalog with schema validation |
| **IP allowlisting** | Medium | Restrict which IPs can deliver to outbound endpoints |
| **Partial wildcard matching** | Low | Support patterns like `payment.*` |
| **Table consolidation** | Low | Merge `notification_webhooks` features into `webhooks` |
| **Delivery rate limiting** | Low | Per-endpoint rate limits to prevent abuse |
| **Webhook transforms** | Low | User-defined payload transformations before delivery |
| **GraphQL subscriptions** | Low | Alternative to webhooks for real-time events |

---

*This document was generated from source code analysis of the MCV.ONE admin prototype codebase. All code examples, type definitions, and schema specifications are derived from the actual implementation.*
