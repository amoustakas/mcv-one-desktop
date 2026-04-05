# @mcv/api — Implementation Plan
## Phased Build & Delivery Strategy

**Package:** `@mcv/api`  
**Version:** 0.1.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Foundation](#phase-1-foundation)
4. [Phase 2: Core Domain Routers](#phase-2-core-domain-routers)
5. [Phase 3: Advanced Features](#phase-3-advanced-features)
6. [Phase 4: Polish & Production Readiness](#phase-4-polish--production-readiness)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risk Register](#risk-register)
10. [Timeline & Milestones](#timeline--milestones)

---

## Overview

### Mission

Build the **single API surface** for the MCV.ONE platform — a unified tRPC router (`appRouter`) that merges 61 domain routers into one type-safe, end-to-end API. Every client — Next.js App Router, Hono edge workers, React Query hooks, and AI agents — connects exclusively through `@mcv/api`.

### Scope

| Dimension | Detail |
|-----------|--------|
| **Routers** | 61 domain routers organized into 14 functional groups |
| **Schemas** | 42 Zod schema modules for input validation |
| **Services** | 68 service classes implementing business logic |
| **Middleware** | Logger, rate limiter (5 presets), 6 auth enforcement layers |
| **Procedure Types** | 14 procedure types (public, protected, admin, superAdmin, venture, agent, permission, + 7 rate-limited variants) |
| **Adapters** | Next.js Fetch, Hono, server-side caller |
| **Serialization** | SuperJSON transformer |

### Guiding Principles

1. **Type Safety First** — End-to-end TypeScript inference from client to server, no `any` leaks
2. **Thin Routers, Fat Services** — Routers validate input and call services; all business logic lives in service classes
3. **Zod-First Validation** — Every endpoint has a Zod input schema, no exceptions
4. **Progressive Auth** — Procedure types compose middlewares to enforce the correct authorization level
5. **Venture Isolation** — All tenant-scoped queries filter by venture ID; no cross-tenant data leaks
6. **Fail Loud** — Structured tRPC errors with domain-specific messages; Zod errors exposed to clients
7. **Observability** — Every request logged with path, type, requestId, userId, duration, and error status

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| RPC Framework | tRPC | v11 |
| Validation | Zod | v3.23+ |
| Serialization | SuperJSON | v2 |
| Auth | Better Auth | latest |
| Database | Drizzle ORM + PostgreSQL | latest |
| Rate Limiting | Custom sliding window (in-memory / Redis) | — |
| Web Framework | Next.js App Router + Hono | v15 / v4 |
| Testing | Vitest | v2+ |
| Client | @trpc/react-query | v11 |

---

## Prerequisites

### Infrastructure Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| `@mcv/db` — Drizzle ORM + PostgreSQL | ✅ Required | Must be initialized before any service can operate |
| `@mcv/auth` — Better Auth | ✅ Required | Session verification, user lookup, MFA, passkeys |
| `@mcv/permissions` — RBAC system | ✅ Required | Permission resolution for all auth middleware |
| `@mcv/logger` — Structured logging | ✅ Required | Logger instance injected into context |
| PostgreSQL database | ✅ Required | Primary data store |
| Redis (optional) | ⚪ Optional | Required for distributed rate limiting; falls back to in-memory |
| Node.js 20+ | ✅ Required | Runtime for Next.js 15 and tRPC v11 |

### Package Dependencies (Tier 1–5)

The API layer sits at **Tier 6** and depends on packages from all lower tiers:

```
Tier 1 (Foundation):    @mcv/types, @mcv/config, @mcv/logger, @mcv/errors
Tier 2 (Infrastructure): @mcv/db, @mcv/cache, @mcv/secrets, @mcv/storage
Tier 3 (Core Services):  @mcv/auth, @mcv/permissions, @mcv/tenants, @mcv/audit
Tier 4 (Domain Logic):   @mcv/users, @mcv/notifications, @mcv/activity, @mcv/flags
Tier 5 (Domain Packages): @mcv/gateway, @mcv/rag, @mcv/catalog, @mcv/payments,
                           @mcv/twilio, @mcv/invoicing, @mcv/ai, @mcv/document-editor
```

### Developer Setup

```bash
# 1. Clone and install
git clone <repo> && cd mcv
pnpm install

# 2. Set up environment
cp packages/api/.env.example packages/api/.env
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, etc.

# 3. Generate database schemas
pnpm --filter @mcv/db generate
pnpm --filter @mcv/db push

# 4. Run API in development
pnpm --filter @mcv/api dev

# 5. Run tests
pnpm --filter @mcv/api test
```

---

## Phase 1: Foundation

**Goal:** Establish the tRPC infrastructure, context creation, middleware pipeline, and first routers (auth + users) to prove the full request lifecycle end-to-end.

**Duration:** 2–3 weeks

### 1.1 tRPC Initialization

**File:** `src/trpc/init.ts`

| Task | Description | Priority |
|------|-------------|----------|
| Initialize tRPC with `Context` type | `initTRPC.context<Context>().create(...)` | P0 |
| Configure SuperJSON transformer | Serialize Date, Map, Set, BigInt, undefined | P0 |
| Custom error formatter | Flatten Zod errors, strip stack traces in production | P0 |
| Export tRPC primitives | `router`, `middleware`, `procedure`, `createCallerFactory`, `mergeRouters` | P0 |

```typescript
// Target output
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  },
});
```

### 1.2 Context Creation

**File:** `src/trpc/context.ts`

| Task | Description | Priority |
|------|-------------|----------|
| Define `Context` interface | db, logger, headers, requestId, ip, userAgent, session, user, venture, permissions | P0 |
| Implement `createContext()` | Parse headers → verify session → load venture → load permissions | P0 |
| Implement `createFetchContext()` | Adapter wrapper for Fetch API (Next.js, Hono) | P0 |
| IP extraction utility | Priority: `cf-connecting-ip` → `x-forwarded-for` → `x-real-ip` → null | P0 |
| Define narrowed context types | `AuthenticatedContext`, `VentureContextRequired`, `AdminContext`, `SuperAdminContext`, `AgentContext` | P0 |

**Implementation sequence:**
1. Base context (db + logger + request metadata) — always succeeds
2. Session verification via `auth.api.getSession({ headers })` — null if unauthenticated
3. Venture loading from DB if `session.activeVentureId` exists — reject suspended ventures
4. Permission resolution via `@mcv/permissions` — returns tier + grants
5. Assemble and return complete context

### 1.3 Logger Middleware

**File:** `src/middleware/logger.ts`

| Task | Description | Priority |
|------|-------------|----------|
| Implement `loggerMiddleware` | Log path, type, requestId, userId, durationMs, error | P0 |
| Create `baseProcedure` | `t.procedure.use(loggerMiddleware)` — applied to ALL procedures | P0 |
| Structured log format | JSON logs compatible with @mcv/logger | P0 |

### 1.4 Auth Middleware

**File:** `src/trpc/procedures.ts`

| Task | Description | Priority |
|------|-------------|----------|
| `isAuthenticated` middleware | Validate session exists, user active, permissions loaded | P0 |
| `isAdmin` middleware | Check `permissions.tier` is 0 or 1 | P0 |
| `isSuperAdmin` middleware | Check `permissions.tier` is 0 | P0 |
| `hasVentureContext` middleware | Validate auth + `ctx.venture` exists | P0 |
| `isAgent` middleware | Validate `x-agent-id` header, construct agent context | P1 |
| `requirePermission(r, a)` middleware | Check specific RBAC grant via `checkPermission()` | P0 |

**Procedure type composition:**

```typescript
// Base (all procedures)
export const baseProcedure = t.procedure.use(loggerMiddleware);

// Public — no auth
export const publicProcedure = baseProcedure;

// Protected — session required
export const protectedProcedure = baseProcedure.use(isAuthenticated);

// Admin — tier 0 or 1
export const adminProcedure = baseProcedure.use(isAdmin);

// Super Admin — tier 0 only
export const superAdminProcedure = baseProcedure.use(isSuperAdmin);

// Venture — session + venture required
export const ventureProcedure = baseProcedure.use(hasVentureContext);

// Agent — AI agent authenticated
export const agentProcedure = baseProcedure.use(isAgent);

// Permission — session + specific grant
export const permissionProcedure = (resource: string, action: string) =>
  baseProcedure.use(requirePermission(resource, action));
```

### 1.5 Auth Router

**File:** `src/routers/auth.router.ts` + `src/services/auth.service.ts`

| Task | Description | Priority |
|------|-------------|----------|
| `auth.login` | Email + password login via Better Auth | P0 |
| `auth.signup` | Account creation with email verification | P0 |
| `auth.logout` | Destroy current session | P0 |
| `auth.getSession` | Return current session info | P0 |
| `auth.forgotPassword` | Send password reset email | P0 |
| `auth.resetPassword` | Confirm password reset with token | P0 |
| `auth.verifyEmail` | Email verification | P0 |
| `auth.switchVenture` | Switch active venture context | P0 |
| `auth.listSessions` / `auth.revokeSession` | Session management | P1 |
| Auth schemas | `loginSchema`, `signupSchema`, `resetPasswordSchema` | P0 |

### 1.6 Users Router

**File:** `src/routers/users.router.ts` + `src/services/user.service.ts`

| Task | Description | Priority |
|------|-------------|----------|
| `users.me` | Get current user profile | P0 |
| `users.updateProfile` | Update own profile | P0 |
| `users.list` | Admin: list users with pagination + filters | P0 |
| `users.getById` / `create` / `update` / `delete` | Admin CRUD | P0 |
| `users.assignRole` / `removeRole` | Role management | P1 |
| `users.invite` | Email invitations | P1 |

### 1.7 Core Schemas

**Files:** `src/schemas/common.schema.ts`, `src/schemas/auth.schema.ts`, `src/schemas/user.schema.ts`

| Task | Description | Priority |
|------|-------------|----------|
| Common schemas | Pagination, sorting, date range, UUID, status, response wrappers | P0 |
| Auth schemas | Login, signup, password reset, MFA completion | P0 |
| User schemas | Create/update user, list with filters | P0 |

### 1.8 Adapter Integration

| Task | Description | Priority |
|------|-------------|----------|
| Next.js App Router handler | `app/api/trpc/[trpc]/route.ts` with `fetchRequestHandler` | P0 |
| Server-side caller factory | `createCallerFactory(appRouter)` for RSC | P0 |
| Hono adapter | `@hono/trpc-server` integration | P2 |

### Phase 1 Deliverables

- [x] tRPC initialized with SuperJSON + error formatter
- [x] Context creation with full lifecycle (headers → session → venture → permissions)
- [x] Logger middleware on all procedures
- [x] 6 auth middlewares composing 7+ procedure types
- [x] Auth router (login, signup, logout, session, password reset, venture switching)
- [x] Users router (CRUD + role assignment)
- [x] Common + auth + user Zod schemas
- [x] Next.js adapter + server-side caller
- [x] End-to-end type inference proven (client → server → response)

---

## Phase 2: Core Domain Routers

**Goal:** Build all 61 domain routers, 42 schema modules, and 68 service classes covering every business domain. This is the bulk of the work.

**Duration:** 6–8 weeks

### 2.1 Rate Limiting Infrastructure

**File:** `src/middleware/rate-limiter.ts`

| Task | Description | Priority |
|------|-------------|----------|
| `SlidingWindowRateLimiter` class | In-memory sliding window with auto-cleanup | P0 |
| 5 rate limit presets | `auth` (5/min), `general` (100/min), `public` (50/min), `strict` (3/min), `relaxed` (500/min) | P0 |
| Rate limit middleware factory | `createRateLimitMiddleware(config)` | P0 |
| Composite key generation | `{path}:{userId or IP}` | P0 |
| Rate limit headers | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After` | P0 |
| 7 rate-limited procedure types | `rateLimitedPublicProcedure`, `rateLimitedProtectedProcedure`, etc. | P0 |
| Redis adapter (optional) | Distributed rate limiting for multi-instance deployments | P2 |

### 2.2 Multi-Tenancy & Access Control Routers

**Duration:** 1 week

| Router | Service | Schema | Procedures | Priority |
|--------|---------|--------|------------|----------|
| `venturesRouter` | `VentureService` | `venture.schema.ts` | ~10 (CRUD, settings, suspend/reactivate) | P0 |
| `ventureMembersRouter` | `VentureMemberService` | `venture.schema.ts` | ~8 (add/remove, invite, accept) | P0 |
| `permissionsRouter` | `PermissionService` | — | ~6 (check, bulk check, list) | P0 |
| `rolesRouter` | `RoleService` | `role.schema.ts` | ~8 (CRUD, assign/remove permissions) | P0 |
| `settingsRouter` | `SettingsService` | — | ~8 (get/set, bulk, system) | P1 |

### 2.3 AI & Intelligence Routers

**Duration:** 1.5 weeks

| Router | Service | Schema | Procedures | Priority |
|--------|---------|--------|------------|----------|
| `gatewayRouter` | via `@mcv/gateway` | — | ~18 (chat, stream, models, usage, budget) | P0 |
| `ragRouter` | via `@mcv/rag` | `rag.schema.ts` | ~14 (stores, documents, query modes, costs) | P0 |
| `aiRouter` | `AiService` | — | varies (orchestration, prompts) | P1 |
| `intelligenceRouter` | `IntelligenceService` | `intelligence.schema.ts` | ~8 (health, entity profile, comparison, timeline) | P1 |
| `hitlRouter` | `HitlService` | `hitl.schema.ts` | ~6 (list, create, resolve, escalate) | P1 |
| `agentTasksRouter` | `AgentTaskService` | `task-extended.schema.ts` | ~8 (queue, claim, progress, complete) | P1 |
| `workbenchRouter` | `WorkbenchService` | — | varies | P2 |

### 2.4 CRM & Contact Routers

**Duration:** 1.5 weeks

| Router | Service | Schema | Procedures | Priority |
|--------|---------|--------|------------|----------|
| `contactRouter` | `ContactService` | `contact.schema.ts` | ~8 (CRUD, search, merge, bulk import) | P0 |
| `organizationRouter` | `OrganizationService` | `organization.schema.ts` | ~8 (CRUD, hierarchy) | P0 |
| `dealRouter` | `DealService` | `deal.schema.ts` | ~10 (CRUD, stage, won/lost, pipeline) | P0 |
| `activityRouter` | `ActivityService` | `activity.schema.ts` | ~6 (CRM activity log) | P1 |
| `crmV2Router` | Multiple services | `crm-v2.schema.ts` | ~20+ (custom objects, scoring, forecast, duplicates) | P1 |
| `entityGraphRouter` | `EntityGraphService` | `entity-graph.schema.ts` | ~10 (nodes, edges, traverse) | P2 |

### 2.5 Task & Project Management Routers

**Duration:** 1.5 weeks

| Router | Service | Schema | Procedures | Priority |
|--------|---------|--------|------------|----------|
| `taskRouter` | `TaskService` | `task.schema.ts` | ~12 (CRUD, transition, assign, bulk, search) | P0 |
| `projectRouter` | `ProjectService` | `project.schema.ts` | ~10 (CRUD, members) | P0 |
| `workflowRouter` | `WorkflowEngine` | `workflow.schema.ts` | ~20+ (CRUD, publish, execute, retry, templates) | P0 |
| `sprintRouter` | `SprintService` | `sprint.schema.ts` | ~8 (CRUD, backlog, complete) | P1 |
| `taskTemplateRouter` | `TaskTemplateService` | `task-template.schema.ts` | ~6 (CRUD, instantiate) | P1 |
| `timeEntryRouter` | `TimeEntryService` | `time-entry.schema.ts` | ~8 (CRUD, timer, timesheet) | P1 |
| `automationRuleRouter` | `AutomationRuleService` | `automation-rule.schema.ts` | ~8 (CRUD, evaluate) | P2 |
| `taskAnalyticsRouter` | `TaskAnalyticsService` | `task-analytics.schema.ts` | ~6 (burndown, velocity, cycle time) | P2 |

### 2.6 Communication & Contact Center Routers

**Duration:** 1 week

| Router | Service | Schema | Procedures | Priority |
|--------|---------|--------|------------|----------|
| `conversationRouter` | `ConversationService` | `conversation.schema.ts` | ~10 (CRUD, messages, assign, transfer) | P0 |
| `queueRouter` | `QueueService` | `queue.schema.ts` | ~8 (CRUD, routing, assignment) | P0 |
| `twilioRouter` | via `@mcv/twilio` | — | ~10 (SMS, voice, phone numbers) | P1 |
| `contactCenterRouter` | Multiple services | — | ~15+ (power dialer, supervisor, SLA, CSAT) | P1 |

### 2.7 Calendar & Scheduling Router

**Duration:** 1 week

| Router | Service | Schema | Procedures | Priority |
|--------|---------|--------|------------|----------|
| `calendarRouter` | `CalendarService`, `AppointmentService`, `AvailabilityService`, `ReminderService`, `RoundRobinService`, `BookingPageService`, `GoogleSyncService` | `calendar.schema.ts` | ~32 (CRUD, availability, booking, sync, public pages) | P0 |

**Key complexity:** Calendar is the largest single router with 32 procedures spanning 7 service classes. Requires nested router organization:
- `calendar.events.*` — Event CRUD
- `calendar.availability.*` — Rules, overrides, team matrix
- `calendar.appointments.*` — Booking, reschedule, cancel
- `calendar.reminders.*` — Reminder management
- `calendar.roundRobin.*` — Assignment configuration
- `calendar.bookingPages.*` — Public booking pages
- `calendar.public.*` — Unauthenticated public endpoints
- `calendar.googleSync.*` — Google Calendar integration

### 2.8 Commerce & Payments Routers

**Duration:** 1 week

| Router | Service | Schema | Procedures | Priority |
|--------|---------|--------|------------|----------|
| `catalogRouter` | via `@mcv/catalog/server` | — | ~48 (products, categories, discounts, inventory, pricing, collections, tax) | P0 |
| `paymentsRouter` | via `@mcv/payments` | — | varies (checkout, subscriptions, refunds, Connect) | P0 |
| `invoicingRouter` | via `@mcv/invoicing` | — | ~15+ (invoices, recurring, credit notes, proposals, fees) | P1 |
| `tokenEconomyRouter` | `TokenEconomyService` | `token-economy.schema.ts` | ~12 (staking, governance, vesting, DAO) | P2 |

### 2.9 Marketing, Content & Documents Routers

**Duration:** 1 week

| Router | Service | Schema | Procedures | Priority |
|--------|---------|--------|------------|----------|
| `emailRouter` | via SendGrid | — | ~8 (templates, campaigns, send) | P1 |
| `marketingRouter` | Multiple services | — | ~10 (campaigns, social, ads, creatives) | P1 |
| `formRouter` | `FormService` + related | `form.schema.ts` | ~12 (builder, submissions, analytics, embed, public) | P1 |
| `reputationRouter` | Multiple services | `reputation.schema.ts` | ~12 (reviews, requests, analytics, competitors, widgets) | P1 |
| `cmsRouter` | `CmsService` | `cms.schema.ts` | ~10 (content, pages) | P2 |
| `documentEditorRouter` | via `@mcv/document-editor` | — | ~8 (block editor CRUD, export) | P1 |
| `storageRouter` | via `@mcv/storage` | — | ~8 (upload, download, folders) | P0 |
| `commentsRouter` | `CommentsService` | — | ~6 (universal comments) | P1 |

### 2.10 Analytics, Observability & Platform Routers

**Duration:** 1 week

| Router | Service | Schema | Procedures | Priority |
|--------|---------|--------|------------|----------|
| `analyticsRouter` | `MetricsService` | `analytics.schema.ts` | ~10 (dashboards, metrics, reports) | P1 |
| `statsRouter` | `StatsService` | `stats.schema.ts` | ~8 (aggregates) | P1 |
| `auditRouter` | `AuditService` | — | ~6 (list, search, export, entity history) | P0 |
| `notificationsRouter` | `NotificationService` | — | ~8 (list, preferences, send) | P0 |
| `flagsRouter` | via `@mcv/flags` | — | ~6 (CRUD, evaluate) | P1 |
| `webhookRouter` | `WebhookService` | `webhook.schema.ts` | ~8 (CRUD, test, delivery history) | P1 |
| `integrationRouter` | `IntegrationService` | `integration.schema.ts` | ~8 (OAuth CRUD) | P1 |
| `portfolioRouter` | `PortfolioService` | `portfolio.schema.ts` | ~8 (cross-venture analytics) | P2 |
| `treasuryRouter` | `TreasuryService` | `treasury.schema.ts` | ~10 (budgets, transactions, reports) | P2 |
| `strategyRouter` | `StrategyService` | `strategy.schema.ts` | ~10 (objectives, roadmap, KPIs) | P2 |
| `grantConciergeRouter` | `GrantConciergeService` | `grant-concierge.schema.ts` | ~12 (opportunities, applications, documents) | P2 |
| `tagsRouter` | `TagsService` | — | ~6 (universal tagging) | P1 |
| `brandingRouter` | `BrandingService` | `branding.schema.ts` | ~6 (brand config) | P2 |

### 2.11 Subscription Endpoints

| Task | Description | Priority |
|------|-------------|----------|
| WebSocket adapter setup | Configure tRPC WebSocket server alongside HTTP | P1 |
| `notifications.onNew` subscription | Real-time notification delivery | P1 |
| `conversations.onMessage` subscription | Chat messages in real-time | P1 |
| `conversations.onTyping` subscription | Typing indicators | P2 |
| `tasks.onUpdate` subscription | Task status change events | P2 |
| `workflows.onExecutionUpdate` subscription | Execution progress events | P2 |
| `analytics.realtime` subscription | Real-time metric updates | P2 |
| `agentTasks.onAssigned` subscription | Agent task assignment events | P2 |
| `contactCenter.onQueueUpdate` subscription | Queue status events | P2 |
| `hitl.onPending` subscription | New HITL approval events | P2 |

### 2.12 File Upload Endpoints

| Task | Description | Priority |
|------|-------------|----------|
| `storage.upload` | General file upload via multipart or base64 | P0 |
| `rag.documents.upload` | RAG document ingestion upload | P0 |
| `grants.documents.upload` | Grant application document upload | P1 |
| `marketing.creatives.upload` | Creative asset upload | P2 |
| Upload size validation | Configurable per-route file size limits | P0 |
| MIME type validation | Allowlist-based content type checking | P0 |
| Virus scanning hook | Pre-upload scan integration point | P2 |

### Phase 2 Deliverables

- [x] Rate limiting infrastructure with 5 presets + 7 rate-limited procedure types
- [x] All 61 domain routers implemented and mounted on `appRouter`
- [x] All 42 Zod schema modules validated and tested
- [x] All 68 service classes with business logic
- [x] WebSocket subscriptions for real-time features
- [x] File upload endpoints with validation
- [x] Full `appRouter` type exported as `AppRouter`

---

## Phase 3: Advanced Features

**Goal:** Add production-grade features: distributed rate limiting, caching, API versioning, and optional GraphQL gateway.

**Duration:** 3–4 weeks

### 3.1 Distributed Rate Limiting (Redis)

| Task | Description | Priority |
|------|-------------|----------|
| Redis adapter for `SlidingWindowRateLimiter` | Replace in-memory Map with Redis MULTI/EXEC | P1 |
| Atomic sliding window in Redis | Use sorted sets for O(log N) window checks | P1 |
| Fallback to in-memory | Graceful degradation if Redis unavailable | P1 |
| Per-venture rate limit overrides | Allow ventures to have custom rate limits | P2 |
| Rate limit dashboard | Admin endpoint for viewing rate limit status | P2 |
| IP allowlist/denylist | Skip rate limiting for trusted IPs; block abusive IPs | P2 |

```typescript
// Redis sliding window implementation sketch
class RedisSlidingWindowRateLimiter {
  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - windowMs;

    const result = await this.redis.multi()
      .zremrangebyscore(key, 0, windowStart)   // Remove expired entries
      .zadd(key, now, `${now}:${crypto.randomUUID()}`) // Add current request
      .zcard(key)                              // Count requests in window
      .pexpire(key, windowMs)                  // Set TTL
      .exec();

    const count = result[2] as number;
    return { allowed: count <= limit, current: count, limit, remaining: Math.max(0, limit - count) };
  }
}
```

### 3.2 Response Caching Layer

| Task | Description | Priority |
|------|-------------|----------|
| Cache middleware | Configurable TTL per procedure | P1 |
| Cache key generation | Based on procedure path + input + user/venture context | P1 |
| In-memory LRU cache | For frequently-accessed queries (settings, flags, etc.) | P1 |
| Redis cache backend | Distributed cache for multi-instance | P2 |
| Cache invalidation | Event-driven invalidation on mutations | P1 |
| Cache-Control headers | HTTP cache headers for CDN caching of public endpoints | P2 |
| Stale-while-revalidate | Serve stale data while refreshing in background | P2 |

```typescript
// Cache middleware factory
export function withCache(opts: { ttlMs: number; keyFn?: (input: unknown) => string }) {
  return middleware(async ({ ctx, input, path, next }) => {
    const key = `cache:${path}:${opts.keyFn?.(input) ?? JSON.stringify(input)}`;
    
    const cached = await cache.get(key);
    if (cached) return { ok: true, data: cached };

    const result = await next();
    if (result.ok) {
      await cache.set(key, result.data, opts.ttlMs);
    }
    return result;
  });
}

// Usage
export const flagsRouter = router({
  evaluate: publicProcedure
    .use(withCache({ ttlMs: 30_000 }))  // Cache 30s
    .input(z.object({ key: z.string() }))
    .query(({ input }) => flagService.evaluate(input.key)),
});
```

### 3.3 API Versioning

| Task | Description | Priority |
|------|-------------|----------|
| Version header strategy | `X-API-Version: 2026-02-01` date-based versioning | P2 |
| Version middleware | Read version header, inject into context | P2 |
| Version-aware routers | Coexist v1 and v2 of procedures during migration | P2 |
| Deprecation headers | `Sunset` and `Deprecation` headers on old procedures | P2 |
| Version changelog | Machine-readable breaking change log | P2 |

```typescript
// Version-aware routing approach
export const appRouter = router({
  // Current version (default)
  users: usersRouter,

  // Versioned namespace for breaking changes
  v2: router({
    users: usersV2Router,  // Breaking change in user schema
  }),
});
```

### 3.4 GraphQL Gateway (Optional)

| Task | Description | Priority |
|------|-------------|----------|
| Evaluate `trpc-openapi` vs custom GraphQL | Compare effort and type safety | P3 |
| OpenAPI 3.0 spec generation | Auto-generate from tRPC routers using `trpc-openapi` | P2 |
| GraphQL schema generation | Map tRPC routers → GraphQL types and resolvers | P3 |
| GraphQL playground | Development tool for exploring the API | P3 |
| REST endpoint bridge | `/api/rest/*` endpoints for external integrations | P2 |

```typescript
// OpenAPI generation (trpc-openapi)
import { generateOpenApiDocument } from 'trpc-openapi';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'MCV.ONE API',
  version: '1.0.0',
  baseUrl: 'https://api.mcv.one',
});
```

### 3.5 Request Batching & Performance

| Task | Description | Priority |
|------|-------------|----------|
| HTTP batch link | Enable request batching in tRPC client | P1 |
| Batch size limits | Cap at 10 procedures per batch | P1 |
| Request deduplication | Deduplicate identical queries within a batch | P2 |
| Connection pooling | Optimize database connection reuse | P1 |
| Query optimization | N+1 detection and batched DB queries in services | P1 |

### Phase 3 Deliverables

- [x] Redis-backed distributed rate limiting with fallback
- [x] Response caching layer with TTL and invalidation
- [x] API versioning strategy with header-based routing
- [x] OpenAPI 3.0 spec auto-generation
- [x] Request batching with size limits
- [x] Performance optimizations (connection pooling, query optimization)

---

## Phase 4: Polish & Production Readiness

**Goal:** Harden the API for production: comprehensive error handling, documentation, monitoring, and deployment configuration.

**Duration:** 2–3 weeks

### 4.1 Error Handling & Resilience

| Task | Description | Priority |
|------|-------------|----------|
| Standardized error codes | Domain-specific error codes beyond tRPC defaults | P0 |
| Error boundary middleware | Catch unhandled errors, log, return safe response | P0 |
| Circuit breaker | Protect against cascading failures from external services | P1 |
| Retry logic | Automatic retry for transient database/network errors | P1 |
| Graceful degradation | Serve partial results when non-critical services fail | P2 |
| Dead letter queue | Log failed mutations for manual replay | P2 |

### 4.2 Monitoring & Observability

| Task | Description | Priority |
|------|-------------|----------|
| Request metrics | Track p50/p95/p99 latency per procedure | P0 |
| Error rate tracking | Alert on elevated error rates | P0 |
| Rate limit metrics | Track rate limit hits and rejections | P1 |
| Health check endpoint | `GET /api/health` — DB, Redis, external service checks | P0 |
| Readiness probe | `GET /api/ready` — warmup check for deployments | P1 |
| OpenTelemetry traces | Distributed tracing across middleware → service → DB | P2 |
| Request ID propagation | Pass `x-request-id` to all downstream services | P0 |

### 4.3 Security Hardening

| Task | Description | Priority |
|------|-------------|----------|
| CORS configuration | Restrict origins to known client domains | P0 |
| CSRF protection | SameSite cookies + CSRF token for mutations | P0 |
| Input sanitization | XSS prevention on all text inputs | P0 |
| SQL injection prevention | Parameterized queries via Drizzle ORM (inherent) | P0 |
| Response header security | `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` | P1 |
| Sensitive data masking | Mask PII in logs (emails, IPs, tokens) | P1 |
| Audit log integration | Log all admin mutations to audit trail | P0 |
| Session fixation prevention | Rotate session ID on privilege change | P1 |

### 4.4 Documentation

| Task | Description | Priority |
|------|-------------|----------|
| OpenAPI spec hosting | Swagger UI at `/api/docs` | P1 |
| Client SDK documentation | Usage examples for React Query, RSC, Hono | P1 |
| Error code reference | Catalog of all error codes with solutions | P1 |
| Migration guide | Guide for moving from REST to tRPC | P2 |
| Architecture decision records | Document key technical decisions | P2 |

### 4.5 Deployment & DevOps

| Task | Description | Priority |
|------|-------------|----------|
| Environment validation | Zod-validated env vars on startup | P0 |
| Graceful shutdown | Drain in-flight requests on SIGTERM | P0 |
| Cold start optimization | Lazy service initialization for serverless | P1 |
| Bundle size monitoring | Track package size, tree-shake unused exports | P1 |
| Feature flag integration | Gate new routers behind feature flags | P1 |

### Phase 4 Deliverables

- [x] Standardized error handling with domain-specific codes
- [x] Health check and readiness probe endpoints
- [x] Security hardening (CORS, CSRF, XSS, headers)
- [x] OpenAPI documentation hosted at `/api/docs`
- [x] Environment validation on startup
- [x] Graceful shutdown with request draining
- [x] Monitoring metrics for latency, errors, and rate limits

---

## Testing Strategy

### Test Pyramid

```
            ┌─────────────┐
            │    E2E      │   5% — Full HTTP round-trip tests
            │  (Playwright)│   Test critical user flows end-to-end
            ├─────────────┤
            │ Integration  │  30% — Router + service + DB tests
            │   (Vitest)   │   Test full procedure lifecycle
            ├─────────────┤
            │    Unit      │  65% — Service + schema + middleware tests
            │   (Vitest)   │   Test business logic in isolation
            └─────────────┘
```

### Unit Tests

| Target | Coverage Goal | Description |
|--------|-------------|-------------|
| Zod schemas | 100% | Every schema module: valid input passes, invalid input fails with expected errors |
| Service methods | 90%+ | Business logic tested with mocked DB, isolated from tRPC |
| Middleware | 100% | Auth enforcement, rate limiting, logging — test each decision branch |
| Utilities | 100% | Pagination helpers, cursor encoding, IP extraction |

```typescript
// Example: Schema unit test
describe('loginSchema', () => {
  it('accepts valid email + password', () => {
    const result = loginSchema.safeParse({
      email: 'user@mcv.one',
      password: 'securePassword123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'securePassword123',
    });
    expect(result.success).toBe(false);
    expect(result.error!.flatten().fieldErrors.email).toBeDefined();
  });
});
```

### Integration Tests

| Target | Coverage Goal | Description |
|--------|-------------|-------------|
| Router procedures | 80%+ | Full procedure lifecycle: input → middleware → handler → service → output |
| Auth flows | 100% | Login, signup, MFA, session management, venture switching |
| Rate limiting | 100% | Verify all 5 presets enforce limits correctly |
| Pagination | 90%+ | Offset and cursor pagination across all list endpoints |
| Error handling | 90%+ | Verify correct error codes and messages |

```typescript
// Example: Integration test with server-side caller
describe('auth router', () => {
  let caller: ReturnType<typeof createCallerFactory<AppRouter>>;

  beforeEach(async () => {
    const ctx = await createTestContext(); // Test DB, mock auth
    caller = createCaller(ctx);
  });

  it('login returns session for valid credentials', async () => {
    await seedUser({ email: 'test@mcv.one', password: 'password123' });

    const result = await caller.auth.login({
      email: 'test@mcv.one',
      password: 'password123',
    });

    expect(result.session).toBeDefined();
    expect(result.session.email).toBe('test@mcv.one');
    expect(result.user.status).toBe('active');
  });

  it('login throws UNAUTHORIZED for wrong password', async () => {
    await seedUser({ email: 'test@mcv.one', password: 'password123' });

    await expect(
      caller.auth.login({ email: 'test@mcv.one', password: 'wrong' })
    ).rejects.toThrow(TRPCError);
  });

  it('protected procedure rejects unauthenticated requests', async () => {
    const publicCaller = createCaller(await createTestContext({ authenticated: false }));

    await expect(publicCaller.users.me()).rejects.toThrow('UNAUTHORIZED');
  });
});
```

### Integration Test Infrastructure

```typescript
// test/helpers/test-context.ts
export async function createTestContext(opts?: {
  authenticated?: boolean;
  userId?: string;
  ventureId?: string;
  tier?: number;
}): Promise<Context> {
  return {
    db: testDb,                    // Test database (migrated, seeded)
    logger: testLogger,            // Captured log output
    headers: new Headers(),
    requestId: crypto.randomUUID(),
    ip: '127.0.0.1',
    userAgent: 'test-runner/1.0',
    session: opts?.authenticated !== false ? mockSession(opts) : null,
    user: opts?.authenticated !== false ? mockUser(opts) : null,
    venture: opts?.ventureId ? mockVenture(opts.ventureId) : null,
    permissions: opts?.authenticated !== false ? mockPermissions(opts?.tier ?? 2) : null,
  };
}

// test/helpers/test-db.ts
export async function setupTestDb() {
  // 1. Create test database
  // 2. Run migrations
  // 3. Return drizzle client
}

export async function teardownTestDb() {
  // 1. Drop test database
}

export async function resetTestData() {
  // 1. Truncate all tables
  // 2. Reset sequences
}
```

### Rate Limit Testing

```typescript
describe('rate limiting', () => {
  it('enforces auth preset (5/min)', async () => {
    const ctx = await createTestContext({ authenticated: false });
    const caller = createCaller(ctx);

    // 5 requests should succeed
    for (let i = 0; i < 5; i++) {
      await expect(caller.auth.login({
        email: 'test@mcv.one',
        password: 'password123',
      })).resolves.toBeDefined();
    }

    // 6th request should be rate limited
    await expect(caller.auth.login({
      email: 'test@mcv.one',
      password: 'password123',
    })).rejects.toThrow('TOO_MANY_REQUESTS');
  });

  it('uses composite key (path:IP)', async () => {
    // Different paths should have independent limits
    // Same path + same IP should share a limit
    // Same path + different IP should have independent limits
  });
});
```

### E2E Tests

```typescript
// Example: Full HTTP round-trip
describe('E2E: auth flow', () => {
  it('signup → verify → login → switch venture', async () => {
    // 1. Signup
    const signup = await fetch('/api/trpc/auth.signup', {
      method: 'POST',
      body: JSON.stringify({ json: { email: 'new@mcv.one', password: 'secure123', firstName: 'Test' } }),
    });
    expect(signup.status).toBe(200);

    // 2. Verify email (extract token from mock email service)
    const token = await getVerificationToken('new@mcv.one');
    const verify = await fetch('/api/trpc/auth.verifyEmail', {
      method: 'POST',
      body: JSON.stringify({ json: { token } }),
    });
    expect(verify.status).toBe(200);

    // 3. Login
    const login = await fetch('/api/trpc/auth.login', {
      method: 'POST',
      body: JSON.stringify({ json: { email: 'new@mcv.one', password: 'secure123' } }),
    });
    const { result } = await login.json();
    expect(result.data.json.session).toBeDefined();
  });
});
```

### Test Commands

```bash
# Run all tests
pnpm --filter @mcv/api test

# Run with coverage
pnpm --filter @mcv/api test --coverage

# Run specific test file
pnpm --filter @mcv/api test src/routers/__tests__/auth.test.ts

# Run in watch mode
pnpm --filter @mcv/api test --watch

# Run integration tests only
pnpm --filter @mcv/api test --grep "integration"

# Run E2E tests
pnpm --filter @mcv/api test:e2e
```

---

## Acceptance Criteria

### Phase 1 — Foundation ✅

| # | Criterion | Verification |
|---|-----------|-------------|
| 1 | tRPC initialized with SuperJSON transformer | Types serialize/deserialize correctly (Date, Map, Set, BigInt) |
| 2 | Context created with full lifecycle | Session, venture, and permissions resolved per request |
| 3 | Logger middleware logs every request | Verify path, type, requestId, userId, durationMs in logs |
| 4 | Auth middleware enforces all 6 levels | Unit tests for each: public, protected, admin, superAdmin, venture, agent |
| 5 | Auth router handles core flows | Login, signup, logout, session, password reset all work |
| 6 | Users router provides CRUD + roles | Admin can list, create, update, delete, assign roles |
| 7 | End-to-end type inference works | Client-side type hints match server-side definitions |
| 8 | Next.js adapter handles GET/POST | Both query (GET) and mutation (POST) work correctly |

### Phase 2 — Core ✅

| # | Criterion | Verification |
|---|-----------|-------------|
| 9 | All 61 routers mounted and functional | Each router responds to at least one procedure call |
| 10 | All 42 schema modules validate correctly | Schema unit tests pass for valid and invalid inputs |
| 11 | Rate limiting enforces all 5 presets | Integration tests verify rate limits are enforced |
| 12 | WebSocket subscriptions deliver events | Subscription connection established, events received |
| 13 | File uploads work with validation | Upload succeeds, size limits enforced, MIME types checked |
| 14 | Venture isolation enforced | No cross-tenant data leaks in any router |
| 15 | Batch operations work correctly | Bulk create/update/delete return proper BatchResult |

### Phase 3 — Advanced ✅

| # | Criterion | Verification |
|---|-----------|-------------|
| 16 | Redis rate limiting works (or falls back) | Rate limits enforced in multi-instance deployment |
| 17 | Response caching reduces latency | Cached queries return in <5ms vs uncached |
| 18 | OpenAPI spec generated correctly | Swagger UI renders at `/api/docs` with all endpoints |
| 19 | Request batching works | Multiple queries in single HTTP request succeed |

### Phase 4 — Production ✅

| # | Criterion | Verification |
|---|-----------|-------------|
| 20 | Health check returns service status | `GET /api/health` returns DB + Redis + external service status |
| 21 | Graceful shutdown drains requests | In-flight requests complete before process exits |
| 22 | CORS restricts origins | Cross-origin requests from unknown domains are rejected |
| 23 | Sensitive data masked in logs | Emails, tokens, passwords not visible in production logs |
| 24 | 90%+ code coverage | `vitest --coverage` reports >90% lines covered |
| 25 | p95 latency < 200ms for queries | Latency benchmarks pass under typical load |

---

## Risk Register

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|-----------|------------|
| R1 | **Context creation latency** — Session verification + venture lookup + permission resolution adds per-request overhead | High | Medium | Cache session/venture/permissions in short-lived LRU cache (30s TTL). Parallelize venture + permission loading. |
| R2 | **61 routers → bundle size explosion** — Importing all routers bloats the serverless function | Medium | High | Tree-shake unused routers via export map. Lazy-load services. Monitor bundle size with `@next/bundle-analyzer`. |
| R3 | **In-memory rate limiter fails in multi-instance** — Each instance has its own count | High | High | Phase 3 Redis adapter. Interim: accept slightly higher effective limits (N × limit for N instances). |
| R4 | **Schema drift** — Zod schemas diverge from actual database types | Medium | Medium | Generate schemas from Drizzle types where possible. CI check that schema-to-type mapping is consistent. |
| R5 | **Service class coupling** — 68 services importing each other creates circular dependencies | High | Medium | Enforce unidirectional dependency flow: routers → services → DB. Use event bus for cross-service communication. |
| R6 | **Subscription backpressure** — High-frequency events overwhelm WebSocket connections | Medium | Low | Implement server-side throttling per subscription. Buffer and batch events. Client-side reconnection with exponential backoff. |
| R7 | **Auth middleware performance** — `checkPermission()` on every request queries the DB | High | Medium | Cache resolved permissions for session duration. Invalidate on role/permission change events. |
| R8 | **TypeScript compilation time** — 61 routers + 42 schemas + 68 services = slow type checking | Medium | High | Use `--incremental` compilation. Split test configs. Consider `tsc --watch` for development. |
| R9 | **Rate limit bypass via IP rotation** — Attackers cycle IPs to avoid IP-based limits | Medium | Low | Combine IP + fingerprint for public limits. Add CAPTCHA after 3 failed auth attempts. WAF-level protection. |
| R10 | **Venture data leakage** — Bug in service layer allows cross-venture queries | Critical | Low | Automated tests assert venture isolation. Drizzle query builder always includes `where ventureId =` filter. Code review checklist. |
| R11 | **SuperJSON overhead** — Transformer adds serialization/deserialization time | Low | Medium | Benchmark overhead. For high-throughput endpoints, consider raw JSON where rich types aren't needed. |
| R12 | **Better Auth session verification failure** — Third-party auth service downtime | High | Low | Implement session caching. Graceful degradation: allow cached sessions for read-only operations during auth outage. |

---

## Timeline & Milestones

### Overall Timeline: 13–18 weeks

```
Week  1–3  │ Phase 1: Foundation
            │ ├── tRPC init + context + middleware
            │ ├── Auth + Users routers
            │ └── Next.js adapter + type inference proof
            │
Week  4–11 │ Phase 2: Core Domain Routers
            │ ├── W4:  Rate limiting + multi-tenancy routers
            │ ├── W5:  AI/Intelligence + CRM routers
            │ ├── W6:  Task/Project + Communication routers
            │ ├── W7:  Calendar + Commerce routers
            │ ├── W8:  Marketing + Content + Documents routers
            │ ├── W9:  Analytics + Platform routers
            │ ├── W10: Subscriptions + File uploads
            │ └── W11: Integration testing + bug fixes
            │
Week 12–15 │ Phase 3: Advanced Features
            │ ├── W12: Redis rate limiting + response caching
            │ ├── W13: API versioning + OpenAPI generation
            │ ├── W14: Request batching + performance optimization
            │ └── W15: GraphQL gateway evaluation + REST bridge
            │
Week 16–18 │ Phase 4: Polish & Production
            │ ├── W16: Error handling + security hardening
            │ ├── W17: Monitoring + documentation
            │ └── W18: Deployment config + final testing
```

### Key Milestones

| Milestone | Target | Exit Criteria |
|-----------|--------|---------------|
| **M1: First Blood** | Week 2 | Auth login/signup works end-to-end through Next.js adapter |
| **M2: Middleware Complete** | Week 3 | All 14 procedure types functional, logger + auth middleware tested |
| **M3: Rate Limiter Live** | Week 4 | All 5 rate limit presets enforced, headers returned correctly |
| **M4: 25 Routers** | Week 6 | Auth, users, ventures, AI, CRM, tasks — core business domains operational |
| **M5: 50 Routers** | Week 9 | Calendar, commerce, marketing, analytics — most routers done |
| **M6: All 61 Routers** | Week 11 | Complete router catalog, all schemas validated, integration tests pass |
| **M7: Subscriptions** | Week 10 | WebSocket transport working, at least 3 subscriptions live |
| **M8: Redis Rate Limits** | Week 12 | Distributed rate limiting operational with fallback |
| **M9: OpenAPI Spec** | Week 13 | Auto-generated spec, Swagger UI at `/api/docs` |
| **M10: Production Ready** | Week 18 | All acceptance criteria met, 90%+ coverage, security audit passed |

### Dependencies

```
Phase 1                     Phase 2                  Phase 3              Phase 4
┌─────────┐  ┌──────────────────────────┐  ┌──────────────┐  ┌──────────────┐
│ tRPC    │  │ Multi-tenancy routers    │  │ Redis RL     │  │ Error        │
│ init    │→ │ (ventures, roles, perms) │→ │ (distributed)│→ │ handling     │
└─────────┘  └──────────────────────────┘  └──────────────┘  └──────────────┘
     │              │                              │
     ↓              ↓                              ↓
┌─────────┐  ┌──────────────────────────┐  ┌──────────────┐  ┌──────────────┐
│ Context │  │ Domain routers           │  │ Caching      │  │ Monitoring   │
│ + auth  │→ │ (AI, CRM, tasks, etc.)   │→ │ layer        │→ │ + alerting   │
└─────────┘  └──────────────────────────┘  └──────────────┘  └──────────────┘
     │              │                              │
     ↓              ↓                              ↓
┌─────────┐  ┌──────────────────────────┐  ┌──────────────┐  ┌──────────────┐
│ Auth +  │  │ Subscriptions +          │  │ API          │  │ Security +   │
│ Users   │→ │ file uploads             │→ │ versioning   │→ │ deployment   │
│ routers │  └──────────────────────────┘  └──────────────┘  └──────────────┘
└─────────┘                                       │
                                                  ↓
                                           ┌──────────────┐
                                           │ OpenAPI /     │
                                           │ GraphQL (opt) │
                                           └──────────────┘
```

### Resource Requirements

| Role | Allocation | Responsibilities |
|------|-----------|-----------------|
| **Lead API Engineer** | 100% | Architecture, tRPC setup, middleware, code review |
| **Backend Developer 1** | 100% | Domain routers (AI, CRM, Tasks, Calendar) |
| **Backend Developer 2** | 100% | Domain routers (Commerce, Marketing, Analytics) |
| **Backend Developer 3** | 50% | Services, schemas, integration tests |
| **DevOps Engineer** | 25% | Redis setup, deployment config, monitoring |
| **QA Engineer** | 50% | Integration tests, E2E tests, security testing |

### Sprint Cadence

- **Sprint length:** 2 weeks
- **Sprint ceremonies:** Planning (Mon), daily standup, demo (Fri W2), retro (Fri W2)
- **Definition of Done:**
  - Router tests pass (unit + integration)
  - Schema tests pass (valid + invalid inputs)
  - TypeScript compiles with no errors
  - Code review approved
  - Documentation updated
  - No `any` types in public API surface

---

*@mcv/api — API Layer*
