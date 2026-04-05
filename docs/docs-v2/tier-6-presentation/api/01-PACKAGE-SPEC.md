# @mcv/api — Package Specification
## Tier 6: Presentation Layer — API Surface

**Package:** `@mcv/api`  
**Classification:** INTERNAL  
**Version:** 0.1.0  
**Last Updated:** February 8, 2026

---

## Executive Summary

`@mcv/api` is the **single API surface** for the entire MCV.ONE platform. It exposes a unified tRPC router (`appRouter`) that merges **61 domain routers** into one type-safe, end-to-end API. Every client — Next.js App Router, Hono edge workers, React Query hooks, and AI agents — connects through this package.

**This is the only package that defines API endpoints. No other package creates HTTP routes.**

The package provides:

- **Type-safe RPC** — Full end-to-end TypeScript inference from client to server via tRPC v11
- **Authentication & Authorization** — 14+ procedure types enforcing Better Auth sessions, RBAC tiers, venture context, agent identity, and granular permissions
- **Input Validation** — Zod-first schema validation on every endpoint via 42 schema modules
- **Rate Limiting** — Sliding window rate limiter with 5 presets protecting all endpoint categories
- **Multi-tenancy** — Venture-scoped context injected into every authenticated request
- **Domain Orchestration** — 68 service classes implementing business logic behind thin router handlers
- **Serialization** — SuperJSON transformer for Date, Map, Set, BigInt, and undefined values
- **OpenAPI Generation** — Automatic OpenAPI 3.0 spec generation from tRPC routers for external consumers

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATIONS                                 │
│                                                                              │
│  Next.js App Router  │  Hono Edge Workers  │  React Query  │  AI Agents    │
│  /api/trpc GET/POST  │  /trpc/* handler     │  trpc.xxx()   │  x-agent-id   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ all requests flow through
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/api                                        │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ routers  │ │ schemas  │ │ services │ │middleware│ │  trpc    │         │
│  │ (61)     │ │ (42)     │ │ (68)     │ │ (3)      │ │ (init)   │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                                    │
│  │  types   │ │  utils   │ │ openapi  │                                    │
│  └──────────┘ └──────────┘ └──────────┘                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ depends on
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LOWER-TIER PACKAGES                                   │
│                                                                              │
│  @mcv/db      @mcv/auth       @mcv/permissions   @mcv/logger               │
│  @mcv/gateway @mcv/rag        @mcv/catalog       @mcv/payments              │
│  @mcv/twilio  @mcv/invoicing  @mcv/notifications @mcv/storage               │
│  @mcv/ai      @mcv/flags      @mcv/audit         @mcv/activity              │
│  @mcv/tenants @mcv/users      @mcv/secrets        @mcv/document-editor      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sub-Modules Overview

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **routers** | 61 domain routers merged into `appRouter` | `appRouter`, `AppRouter`, individual routers |
| **trpc** | tRPC initialization, context creation, procedure types | `createContext`, `createFetchContext`, 14 procedure types |
| **schemas** | 42 Zod schema modules for input validation | All input/output schema types |
| **services** | 68 service classes implementing business logic | Domain service classes |
| **middleware** | Request pipeline: logger, rate limiter, auth | `loggerMiddleware`, `SlidingWindowRateLimiter` |
| **types** | TypeScript type definitions | `Context`, `Session`, `AuthenticatedUser`, `VentureContext` |
| **utils** | Pagination, JWT, crypto, cookies, OAuth helpers | `buildPaginatedResponse`, `signJWT` |
| **openapi** | OpenAPI spec generation from tRPC routers | `openApiDocument` |

---

## Package Exports

The package provides seven export entry points via `package.json` exports map:

```jsonc
{
  ".":           "./src/index.ts",           // Everything (appRouter, types, schemas, services)
  "./trpc":      "./src/trpc/index.ts",      // tRPC utilities, procedures, context
  "./routers":   "./src/routers/index.ts",   // AppRouter + individual routers
  "./middleware": "./src/middleware/index.ts", // Rate limiting, logger
  "./services":  "./src/services/index.ts",  // All domain services
  "./schemas":   "./src/schemas/index.ts",   // All Zod schemas
  "./schemas/*": "./src/schemas/*.ts",       // Individual schema modules
  "./types":     "./src/types/index.ts"      // All TypeScript types
}
```

### Root Export (`@mcv/api`)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// ROOT ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

export { appRouter, type AppRouter } from './routers';

// All 61 individual routers re-exported by name
export {
  authRouter,
  mfaRouter,
  passkeyRouter,
  walletRouter,
  usersRouter,
  venturesRouter,
  ventureMembersRouter,
  rolesRouter,
  permissionsRouter,
  auditRouter,
  notificationsRouter,
  storageRouter,
  flagsRouter,
  settingsRouter,
  gatewayRouter,
  ragRouter,
  statsRouter,
  activityRouter,
  conversationRouter,
  queueRouter,
  projectRouter,
  workflowRouter,
  webhookRouter,
  integrationRouter,
  analyticsRouter,
  taskRouter,
  contactRouter,
  organizationRouter,
  dealRouter,
  twilioRouter,
  paymentsRouter,
  contactCenterRouter,
  emailRouter,
  calendarRouter,
  crmV2Router,
  reputationRouter,
  invoicingRouter,
  formRouter,
  documentEditorRouter,
  catalogRouter,
  aiRouter,
  marketingRouter,
  portfolioRouter,
  treasuryRouter,
  tokenEconomyRouter,
  strategyRouter,
  grantConciergeRouter,
  entityGraphRouter,
  intelligenceRouter,
  workbenchRouter,
  sprintRouter,
  hitlRouter,
  agentTasksRouter,
  taskTemplateRouter,
  timeEntryRouter,
  automationRuleRouter,
  taskAnalyticsRouter,
  cmsRouter,
  commentsRouter,
  tagsRouter,
  brandingRouter,
} from './routers';
```

### tRPC Export (`@mcv/api/trpc`)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// tRPC UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  // Core tRPC primitives
  router,
  middleware,
  procedure,
  createCallerFactory,
  mergeRouters,

  // Context creation
  createContext,
  createFetchContext,
  type Context,
  type Session,
  type AuthenticatedUser,
  type VentureContext,
  type CreateContextOptions,

  // Standard procedures
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  superAdminProcedure,
  ventureProcedure,
  agentProcedure,
  permissionProcedure,
  requirePermission,
  requireAnyPermission,

  // Rate-limited procedures
  rateLimitedPublicProcedure,
  rateLimitedProtectedProcedure,
  rateLimitedAuthProcedure,
  strictRateLimitedProcedure,
  rateLimitedProcedure,
  rateLimitedProtectedProcedureWith,
  rateLimitedAdminProcedure,

  // Context types
  type AuthenticatedContext,
  type VentureContextRequired,
  type AdminContext,
  type SuperAdminContext,
  type AgentContext,
  type RateLimitedContext,
  type RateLimitedAuthenticatedContext,
} from './trpc';
```

### Middleware Export (`@mcv/api/middleware`)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  loggerMiddleware,
  createRateLimitMiddleware,
  rateLimitAuth,
  rateLimitGeneral,
  rateLimitPublic,
  rateLimitStrict,
  rateLimitRelaxed,
  SlidingWindowRateLimiter,
  rateLimiter,
  getRateLimitHeaders,
  getRateLimitErrorHeaders,
  checkRateLimitStatus,
  resetRateLimit,
  createRateLimitKey,
  RATE_LIMIT_PRESETS,
  type RateLimitConfig,
  type RateLimitPreset,
  type RateLimitResult,
  type RateLimitInfo,
} from './middleware';
```

### Utilities Export (`@mcv/api/utils`)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  // Offset-based pagination
  calculatePaginationMeta,
  calculateOffset,
  buildPaginatedResponse,

  // Cursor-based pagination
  encodeCursor,
  decodeCursor,
  buildCursorPaginatedResponse,

  // Types
  type PaginatedResponse,
  type CursorPaginatedResponse,
  type CursorPaginationMeta,
} from './utils';

// JWT utilities
export {
  signJWT,
  verifyRefreshToken,
  hashRefreshToken,
  createRefreshToken,
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_EXPIRY_MS,
} from './utils/jwt';

// Crypto utilities
export {
  hashPassword,
  verifyPassword,
  generateSecureToken,
} from './utils/crypto';

// Response types
export type { JWTPayload, SignJWTOptions, SuccessResponse } from './types';
```

---

## Core Interfaces

### Context — The Request Object

Every tRPC procedure receives a `Context` object built during request initialization:

```typescript
/**
 * Full context available to all procedures.
 * Created fresh for every request by createContext() / createFetchContext().
 */
export interface Context {
  // ═══ INFRASTRUCTURE (always present) ═══
  /** Drizzle database client (Postgres) */
  db: NonNullable<typeof db>;
  /** Structured logger instance (@mcv/logger) */
  logger: Logger;

  // ═══ REQUEST METADATA (always present) ═══
  /** Raw request headers */
  headers: Headers;
  /** Unique request identifier (x-request-id or crypto.randomUUID()) */
  requestId: string;
  /** Client IP from cf-connecting-ip / x-forwarded-for / x-real-ip */
  ip: string | null;
  /** User-Agent header value */
  userAgent: string | null;

  // ═══ AUTHENTICATION STATE (null if unauthenticated) ═══
  /** Session data from Better Auth */
  session: Session | null;
  /** Authenticated user profile */
  user: AuthenticatedUser | null;

  // ═══ MULTI-TENANCY (null if no venture selected) ═══
  /** Active venture context */
  venture: VentureContext | null;

  // ═══ AUTHORIZATION (null if unauthenticated) ═══
  /** User's resolved permissions from @mcv/permissions */
  permissions: UserPermissions | null;

  // ═══ RATE LIMITING (set by rate limit middleware) ═══
  /** Rate limit info — only present on rate-limited procedures */
  rateLimit?: RateLimitInfo;
}
```

### Session

```typescript
export interface Session {
  userId: string;           // UUID
  email: string;            // User's email
  ventureId: string | null; // Active venture (from activeVentureId)
  sessionId: string;        // Better Auth session record ID
  expiresAt: Date;          // Session expiration
}
```

### AuthenticatedUser

```typescript
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  image: string | null;
  status: "active" | "suspended" | "banned" | "deleted";
  emailVerified: boolean;
  mfaEnabled: boolean;
  role: string | null;
  createdAt: Date;
}
```

### VentureContext

```typescript
export interface VentureContext {
  id: string;
  slug: string;
  name: string;
  status: "active" | "suspended" | "archived" | "pending";
  settings: Record<string, unknown> | null;
}
```

### Procedure Context Types

Each procedure type narrows the `Context` to guarantee certain fields:

```typescript
/** Context with guaranteed session — protectedProcedure */
export interface AuthenticatedContext extends Context {
  session: Session;
  user: AuthenticatedUser;
  permissions: UserPermissions;
}

/** Context with guaranteed venture — ventureProcedure */
export interface VentureContextRequired extends AuthenticatedContext {
  venture: VentureContext;
}

/** Admin context — tier 0 (super) or tier 1 (venture admin) */
export interface AdminContext extends AuthenticatedContext {}

/** Super admin context — tier 0 only */
export interface SuperAdminContext extends AuthenticatedContext {}

/** Agent context — AI agent via x-agent-id header */
export interface AgentContext extends Context {
  agent: {
    id: string;
    name: string;
    agentType: string;
    autonomyLevel: number;
    ventureScope: string[];
  };
}

/** Rate-limited context */
export interface RateLimitedContext extends Context {
  rateLimit: RateLimitInfo;
}

/** Authenticated + rate-limited context */
export interface RateLimitedAuthenticatedContext extends AuthenticatedContext {
  rateLimit: RateLimitInfo;
}
```

### RateLimitInfo

```typescript
export interface RateLimitInfo {
  current: number;    // Current request count in window
  limit: number;      // Maximum allowed requests
  remaining: number;  // Remaining requests in window
  resetIn: number;    // Seconds until window resets
}
```

---

## Procedure Type Hierarchy

Procedures are the building blocks of tRPC endpoints. Each procedure type enforces a specific authorization level through middleware composition:

```
                    ┌───────────────────┐
                    │   t.procedure     │  Raw tRPC procedure (no middleware)
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  baseProcedure    │  + loggerMiddleware (all requests logged)
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────────────────────────┐
              │               │                                   │
    ┌─────────▼────────┐  ┌──▼──────────────┐   ┌───────────────▼────────────┐
    │ publicProcedure  │  │ protectedProc.  │   │ rateLimitedPublicProcedure │
    │                  │  │ + isAuthenticated│   │ + rateLimitPublic (50/min) │
    │ No auth needed   │  │                 │   │                            │
    └──────────────────┘  └──────┬──────────┘   └────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
  ┌──────▼──────────┐  ┌────────▼────────┐  ┌──────────▼──────────┐
  │ adminProcedure  │  │ ventureProcedure│  │ permissionProcedure │
  │ + isAdmin       │  │ + hasVenture   │  │ + requirePermission │
  │ Tier 0 or 1     │  │ Auth + venture  │  │ Auth + specific RBAC│
  └──────┬──────────┘  └─────────────────┘  └──────────────────────┘
         │
  ┌──────▼──────────┐
  │ superAdminProc. │
  │ + isSuperAdmin  │
  │ Tier 0 only     │
  └─────────────────┘

  ┌──────────────────┐  ┌───────────────────────────┐
  │ agentProcedure   │  │ rateLimitedAuthProcedure  │
  │ + isAgent        │  │ + rateLimitAuth (5/min)    │
  │ x-agent-id hdr   │  │ Login/signup protection    │
  └──────────────────┘  └───────────────────────────┘
```

### Procedure Reference

| Procedure | Middleware Chain | Auth Level | Rate Limit | Use Case |
|-----------|----------------|------------|------------|----------|
| `publicProcedure` | logger | None | None | Health checks, public booking, auth flows |
| `protectedProcedure` | logger → isAuthenticated | Session required | None | General authenticated endpoints |
| `adminProcedure` | logger → isAdmin | Tier 0 or 1 | None | Venture management, user admin |
| `superAdminProcedure` | logger → isSuperAdmin | Tier 0 only | None | System settings, cross-venture ops |
| `ventureProcedure` | logger → hasVentureContext | Session + venture | None | Venture-scoped operations |
| `agentProcedure` | logger → isAgent | x-agent-id header | None | AI agent endpoints |
| `permissionProcedure(r,a)` | logger → isAuth → requirePerm | Session + RBAC grant | None | Granular permission checks |
| `rateLimitedPublicProcedure` | logger → rateLimitPublic | None | 50/min per IP | Rate-limited public APIs |
| `rateLimitedProtectedProcedure` | logger → rateLimitGeneral → isAuth | Session required | 100/min per user | Rate-limited auth APIs |
| `rateLimitedAuthProcedure` | logger → rateLimitAuth | None | 5/min per IP | Login, signup, password reset |
| `strictRateLimitedProcedure` | logger → rateLimitStrict | None | 3/min per IP | Password reset confirmation |
| `rateLimitedProcedure(cfg)` | logger → custom rate limit | None | Custom | Factory for custom limits |
| `rateLimitedProtectedProcedureWith(cfg)` | logger → custom RL → isAuth | Session | Custom | Factory for custom auth + RL |
| `rateLimitedAdminProcedure(cfg)` | logger → custom RL → isAdmin | Tier 0/1 | Custom | Factory for admin + RL |

---

## Router Catalog

All 61 domain routers are merged into the `appRouter`. Organized by functional area:

### Authentication & Identity (6 routers)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `auth` | `authRouter` | Login, signup, logout, sessions, password reset, email verification, venture switching, Web3 wallet auth | ~20 | public + protected |
| `mfa` | `mfaRouter` | Multi-factor authentication (TOTP, SMS) setup and verification | ~6 | protected |
| `passkey` | `passkeyRouter` | WebAuthn/FIDO2 passkey registration and authentication | ~6 | protected |
| `wallet` | `walletRouter` | Web3 wallet nonce generation and signature verification | ~4 | public + protected |
| `users` | `usersRouter` | User CRUD, profile management, role assignment, invitations | ~12 | admin |
| `roles` | `rolesRouter` | Role CRUD, permission assignment, tier management | ~8 | admin |

### Multi-Tenancy & Access Control (4 routers)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `ventures` | `venturesRouter` | Venture CRUD, settings, tier management | ~10 | admin / superAdmin |
| `ventureMembers` | `ventureMembersRouter` | Venture membership management, invitations | ~8 | admin |
| `permissions` | `permissionsRouter` | Permission queries, grant checks | ~6 | protected |
| `settings` | `settingsRouter` | System and venture settings management | ~8 | admin |

### AI & Intelligence (7 routers)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `gateway` | `gatewayRouter` | LLM chat completions, tier routing, usage analytics, budget management, model config | ~18 | protected / admin / superAdmin |
| `rag` | `ragRouter` | RAG store management, file upload/ingestion, basic/synthesis/deep queries, cost tracking | ~14 (nested) | protected / admin / superAdmin |
| `ai` | `aiRouter` | AI command center — orchestration, prompt management | varies | protected / admin |
| `intelligence` | `intelligenceRouter` | Venture health reports, entity intelligence, unified timeline, actionable insights | ~8 (nested) | admin / superAdmin |
| `hitl` | `hitlRouter` | Human-in-the-Loop approval queue: create, list, resolve, escalate | ~6 | protected |
| `agentTasks` | `agentTasksRouter` | Agent task queue: assign, claim, progress, complete, metrics | ~8 | venture / protected |
| `workbench` | `workbenchRouter` | Engineering workbench tools | varies | protected |

### CRM & Contacts (6 routers)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `contacts` | `contactRouter` | Contact CRUD, search, lifecycle management | ~8 | venture |
| `organizations` | `organizationRouter` | Organization/company CRUD, hierarchy | ~8 | venture |
| `deals` | `dealRouter` | Deal pipeline CRUD, stage management | ~10 | venture |
| `activities` | `activityRouter` | CRM activity log (calls, emails, meetings) | ~6 | protected |
| `crmV2` | `crmV2Router` | Advanced CRM: custom objects, deal scoring, forecasting, duplicates, lead scoring, smart views | ~20+ | venture / admin |
| `entityGraph` | `entityGraphRouter` | Universal cross-entity relationship system | ~10 | admin |

### Task & Project Management (8 routers)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `tasks` | `taskRouter` | Task CRUD, status transitions, search, bulk operations | ~12 | venture |
| `projects` | `projectRouter` | Project CRUD, member management | ~10 | venture |
| `sprints` | `sprintRouter` | Sprint management, time-boxed iterations | ~8 | venture |
| `taskTemplates` | `taskTemplateRouter` | Reusable task creation templates | ~6 | venture |
| `timeEntries` | `timeEntryRouter` | Worklogs, timers, timesheets | ~8 | venture |
| `automationRules` | `automationRuleRouter` | No-code workflow automation rules | ~8 | venture / admin |
| `taskAnalytics` | `taskAnalyticsRouter` | Burndown, velocity, throughput, cycle time analytics | ~6 | venture |
| `workflows` | `workflowRouter` | Workflow automation engine: V1 + V2 graph-based, versioning, execution, approvals, templates | ~20+ | venture / admin |

### Communication & Contact Center (4 routers)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `conversations` | `conversationRouter` | Contact center conversations, messaging | ~10 | protected |
| `queues` | `queueRouter` | Contact center queue routing, assignment | ~8 | admin |
| `twilio` | `twilioRouter` | SMS, voice, phone number management (Twilio) | ~10 | admin |
| `contactCenter` | `contactCenterRouter` | Advanced: power dialer, supervisor, SLA, CSAT, routing | ~15+ | admin |

### Calendar & Scheduling (1 router)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `calendar` | `calendarRouter` | Calendar CRUD, availability, appointments, reminders, round-robin, booking pages, Google sync, public booking | ~32 | permission / public |

### Commerce & Payments (4 routers)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `catalog` | `catalogRouter` | Products, categories, discounts, inventory, price rules, collections, tax management | ~48 | venture / admin / superAdmin |
| `payments` | `paymentsRouter` | Stripe Connect payments, invoices, subscriptions | varies | admin |
| `invoicing` | `invoicingRouter` | Advanced invoicing, proposals, recurring, credit notes, platform fees | ~15+ | admin |
| `tokenEconomy` | `tokenEconomyRouter` | Web3/EDGE token, staking, governance, vesting, DAO | ~12 | admin |

### Marketing & Content (5 routers)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `email` | `emailRouter` | Email marketing (SendGrid integration) | ~8 | admin |
| `marketing` | `marketingRouter` | Marketing automation campaigns | ~10 | admin |
| `forms` | `formRouter` | Forms & surveys builder, submissions, analytics | ~12 | venture / admin |
| `reputation` | `reputationRouter` | Reviews, AI responses, competitor tracking, widgets | ~12 | venture / admin |
| `cms` | `cmsRouter` | Content management system | ~10 | venture / admin |

### Documents & Storage (3 routers)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `documentEditor` | `documentEditorRouter` | Block-based document editor (invoices, proposals) | ~8 | venture |
| `storage` | `storageRouter` | File upload, download, management | ~8 | protected |
| `comments` | `commentsRouter` | Universal commenting system | ~6 | protected |

### Analytics & Observability (4 routers)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `analytics` | `analyticsRouter` | Analytics hub: metrics, dashboards | ~10 | admin |
| `stats` | `statsRouter` | Statistics and aggregate metrics | ~8 | admin |
| `audit` | `auditRouter` | Audit log queries and management | ~6 | admin |
| `notifications` | `notificationsRouter` | Notification delivery and preferences | ~8 | protected |

### Platform Operations (6 routers)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `flags` | `flagsRouter` | Feature flag management | ~6 | admin |
| `webhooks` | `webhookRouter` | Webhook configuration and delivery | ~8 | admin |
| `integrations` | `integrationRouter` | OAuth integration management | ~8 | admin |
| `portfolio` | `portfolioRouter` | Cross-venture portfolio analytics | ~8 | superAdmin |
| `treasury` | `treasuryRouter` | Financial oversight, token economy | ~10 | admin / superAdmin |
| `strategy` | `strategyRouter` | Objectives, roadmap, M&A, investor relations | ~10 | admin / superAdmin |

### Grants & Funding (1 router)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `grants` | `grantConciergeRouter` | Grant opportunities, applications, documents, calendar | ~12 | venture / admin |

### Tags, Branding & Metadata (2 routers)

| Namespace | Router | Description | Procedures | Auth Level |
|-----------|--------|-------------|-----------|------------|
| `tags` | `tagsRouter` | Universal tagging system | ~6 | protected |
| `branding` | `brandingRouter` | Brand guidelines management | ~6 | admin |

---

## Schema Catalog

The `schemas/` directory contains **42 Zod schema modules** providing input validation for every endpoint.

### Common Schemas (`common.schema.ts`)

Reusable building blocks used across all routers:

```typescript
// Pagination
export const cursorPaginationSchema = z.object({
  cursor: z.string().nullish(),
  limit: z.number().min(1).max(100).default(20),
});

export const offsetPaginationSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

// Sorting & Filtering
export const sortDirectionSchema = z.enum(["asc", "desc"]);
export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// IDs & Status
export const uuidSchema = z.string().uuid();
export const idParamSchema = z.object({ id: uuidSchema });
export const statusSchema = z.enum(["active","inactive","pending","suspended","archived"]);

// Response Wrappers
export function successResponseSchema<T>(dataSchema: T) { ... }
export function listResponseSchema<T>(itemSchema: T) { ... }
```

### Schema Module Inventory

| Schema Module | Domain | Key Schemas |
|--------------|--------|-------------|
| `common.schema.ts` | Shared | pagination, dateRange, uuid, status |
| `auth.schema.ts` | Authentication | login, signup, resetPassword, walletVerify, completeMfaLogin |
| `user.schema.ts` | Users | createUser, updateUser, listUsers |
| `venture.schema.ts` | Ventures | createVenture, updateVenture |
| `task.schema.ts` | Tasks | createTask, updateTask, listTasks |
| `task-extended.schema.ts` | Agent Tasks | queueForAgent, agentClaim, agentComplete |
| `task-template.schema.ts` | Templates | createTemplate, listTemplates |
| `task-analytics.schema.ts` | Analytics | burndown, velocity |
| `workflow.schema.ts` | Workflows | workflowNode, workflowEdge, conditionGroup (20+ types) |
| `calendar.schema.ts` | Calendar | createCalendar, bookAppointment, publicBook |
| `contact.schema.ts` | CRM Contacts | createContact, search |
| `organization.schema.ts` | CRM Orgs | createOrg |
| `deal.schema.ts` | CRM Deals | createDeal, pipeline |
| `conversation.schema.ts` | Contact Center | createConversation, message |
| `queue.schema.ts` | Routing | queueConfig, assignment |
| `analytics.schema.ts` | Analytics Hub | metric, dashboard |
| `stats.schema.ts` | Statistics | aggregate |
| `activity.schema.ts` | Activity Log | createActivity, list |
| `catalog.schema.ts` | Products | product, category, discount, inventory |
| `invoicing.schema.ts` | Invoicing | invoice, proposal, creditNote |
| `email.schema.ts` | Email | campaign, template |
| `form.schema.ts` | Forms | formBuilder, submission |
| `reputation.schema.ts` | Reviews | reviewRequest, response |
| `document-editor.schema.ts` | Documents | document, block |
| `integration.schema.ts` | OAuth | oauthConfig |
| `webhook.schema.ts` | Webhooks | createWebhook |
| `portfolio.schema.ts` | Portfolio | portfolioQuery |
| `strategy.schema.ts` | Strategy | objective, roadmap |
| `treasury.schema.ts` | Treasury | budget, transaction |
| `token-economy.schema.ts` | Web3 | staking, governance |
| `entity-graph.schema.ts` | Entity Graph | createNode, createEdge |
| `intelligence.schema.ts` | Intelligence | ventureIntelligence, entityIntelligence |
| `hitl.schema.ts` | HITL | createHITLApproval, resolveHITLApproval |
| `sprint.schema.ts` | Sprints | createSprint |
| `time-entry.schema.ts` | Time Tracking | createTimeEntry |
| `automation-rule.schema.ts` | Automation | createRule, condition |
| `crm-v2.schema.ts` | Advanced CRM | customObject, forecast |
| `grant-concierge.schema.ts` | Grants | application, opportunity |
| `cms.schema.ts` | CMS | content, page |
| `passkey.schema.ts` | WebAuthn | registration, verification |
| `role.schema.ts` | Roles | createRole |
| `project.schema.ts` | Projects | createProject |
| `branding.schema.ts` | Branding | brandingConfig |
| `rag.schema.ts` | RAG | query, upload |

---

## Service Catalog

The `services/` directory contains **68 service classes** implementing all business logic. Routers are thin handlers that validate input, check auth, call a service, and return the result.

### Major Services (by code size)

| Service | File Size | Description |
|---------|-----------|-------------|
| `WorkflowEngine` | 102KB | Graph-based workflow execution, versioning, step execution, approvals, error recovery |
| `IntelligenceService` | 50KB | Venture health reports, entity intelligence, cross-venture comparison, unified timeline |
| `AuthService` | ~30KB | Login/signup, JWT management, wallet auth (legacy — migrating to Better Auth) |
| `AiService` | ~25KB | AI command center orchestration, prompt management |
| `CalendarService` | ~15KB | Calendar CRUD, availability rules, overrides |
| `AppointmentService` | ~12KB | Booking, rescheduling, cancellation, agenda |
| `AvailabilityService` | ~10KB | Slot availability calculation, team availability matrix |
| `GrantConciergeService` | ~10KB | Grant opportunity matching |
| `ConversationService` | ~10KB | Contact center conversations |
| `TaskService` | ~10KB | Task CRUD, status transitions |
| `WorkflowService` | ~10KB | V1 workflow CRUD |

### Full Service Inventory

| Service | Purpose |
|---------|---------|
| `AuthService` | Authentication & session management (legacy) |
| `UserService` | User CRUD, profile management |
| `VentureService` | Venture CRUD, settings |
| `RoleService` | Role management |
| `MfaService` | TOTP setup, verification |
| `PasskeyService` | WebAuthn registration/verification |
| `CalendarService` | Calendar CRUD |
| `AppointmentService` | Booking & scheduling |
| `AvailabilityService` | Slot calculation |
| `ReminderService` | Appointment reminders |
| `RoundRobinService` | Round-robin assignment |
| `BookingPageService` | Public booking pages |
| `GoogleSyncService` | Google Calendar sync |
| `ContactService` | CRM contacts |
| `OrganizationService` | CRM organizations |
| `DealService` | Deal pipeline |
| `DealScoringService` | AI deal scoring |
| `CustomObjectService` | CRM custom objects |
| `DuplicateDetectionService` | CRM duplicate detection |
| `LeadScoringService` | AI lead scoring |
| `ForecastService` | Revenue forecasting |
| `SmartViewService` | Saved CRM views |
| `ConversationService` | Contact center |
| `QueueService` | Queue routing |
| `PowerDialerService` | Auto-dialing |
| `SupervisorService` | CC supervision |
| `RoutingService` | CC routing rules |
| `SlaService` | SLA tracking |
| `CsatService` | Customer satisfaction |
| `ProjectService` | Project CRUD |
| `TaskService` | Task CRUD |
| `WorkflowService` | V1 workflow CRUD |
| `WorkflowEngine` | V2 graph workflow engine |
| `WorkflowConditionEvaluator` | Condition evaluation |
| `AuditService` | Audit logging |
| `NotificationService` | Notification delivery |
| `IntegrationService` | OAuth management |
| `WebhookService` | Webhook dispatch |
| `FormService` | Form builder |
| `FormSubmissionService` | Form submissions |
| `FormAnalyticsService` | Form analytics |
| `FormEmbedService` | Embeddable forms |
| `AiService` | AI orchestration |
| `IntelligenceService` | Venture intelligence |
| `EntityGraphService` | Entity relationships |
| `StrategyService` | Strategic planning |
| `PortfolioService` | Cross-venture analytics |
| `TreasuryService` | Financial oversight |
| `TokenEconomyService` | Web3 token ops |
| `GrantConciergeService` | Grant matching |
| `ReviewSyncService` | Review platform sync |
| `ReviewRequestService` | Review campaigns |
| `ReviewResponseService` | AI review responses |
| `ReviewAnalyticsService` | Review analytics |
| `ReviewWidgetService` | Embeddable widgets |
| `CompetitorService` | Competitor tracking |
| `MarketingAnalyticsService` | Campaign analytics |
| `SocialConnectorService` | Social media |
| `AdManagerService` | Ad campaigns |
| `CreativeService` | Creative assets |
| `BrandingService` | Brand guidelines |
| `MetricsService` | System metrics |
| `ActivityService` | Activity logging |
| `ActivityBusService` | Activity event bus |
| `DocumentRagPipelineService` | Document → RAG ingestion |
| `AgentPresenceService` | AI agent presence |
| `IntegrationGuard` | Integration permissions |
| `CatalogService` | Products (via `@mcv/catalog/server`) |

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | — | Better Auth signing secret |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | App URL for email links |
| `APP_URL` | No | `http://localhost:3000` | Server-side app URL |
| `NODE_ENV` | No | `development` | Controls stack trace exposure |
| `OPENROUTER_API_KEY` | Yes* | — | OpenRouter API key (gateway router) |
| `STRIPE_SECRET_KEY` | Yes* | — | Stripe secret key (payments router) |
| `STRIPE_WEBHOOK_SECRET` | Yes* | — | Stripe webhook signing secret |
| `TWILIO_ACCOUNT_SID` | Yes* | — | Twilio account SID (twilio router) |
| `TWILIO_AUTH_TOKEN` | Yes* | — | Twilio auth token |
| `SENDGRID_API_KEY` | Yes* | — | SendGrid API key (email router) |
| `GOOGLE_CLIENT_ID` | Yes* | — | Google OAuth client ID (calendar sync) |
| `GOOGLE_CLIENT_SECRET` | Yes* | — | Google OAuth client secret |

\* Required only if the corresponding feature router is used.

### tRPC Configuration

```typescript
// tRPC initialization with SuperJSON + Zod error formatting
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

### Rate Limit Presets

| Preset | Limit | Window | Key Strategy | Use Case |
|--------|-------|--------|-------------|----------|
| `auth` | 5 req | 60s | Client IP | Login, signup — brute force protection |
| `general` | 100 req | 60s | User ID (fallback: IP) | Standard authenticated endpoints |
| `public` | 50 req | 60s | Client IP | Unauthenticated public APIs |
| `strict` | 3 req | 60s | Client IP | Password reset confirmation |
| `relaxed` | 500 req | 60s | User ID (fallback: IP) | High-throughput endpoints |

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@trpc/server` | ^11.0.0-rc.446 | tRPC server framework |
| `superjson` | ^2.2.6 | Date/Map/Set/BigInt serialization |
| `zod` | ^4.3.6 | Runtime schema validation |
| `date-fns` | ^4.1.0 | Date manipulation |
| `jose` | ^5.2.0 | JWT signing/verification |
| `nanoid` | ^5.0.7 | Compact unique ID generation |
| `stripe` | ^14.0.0 | Stripe payment processing |
| `viem` | ^2.45.0 | Ethereum wallet signature verification |
| `otpauth` | ^9.2.2 | TOTP one-time password |
| `uuid` | ^9.0.0 | UUID generation |
| `trpc-to-openapi` | ^3.1.0 | OpenAPI spec generation |
| `@google-cloud/secret-manager` | ^6.1.1 | GCP secret management |

### Internal Dependencies (Workspace)

| Package | Purpose |
|---------|---------|
| `@mcv/db` | Drizzle ORM database client, schema, query builders |
| `@mcv/auth` | Better Auth configuration, session management |
| `@mcv/permissions` | RBAC permission loading and checking |
| `@mcv/logger` | Structured logging (Pino-based) |
| `@mcv/gateway` | LLM gateway — tier routing, budget, usage |
| `@mcv/rag` | RAG store management, document ingestion, vector search |
| `@mcv/ai` | AI orchestration services |
| `@mcv/notifications` | Email templates and delivery (SendGrid) |
| `@mcv/storage` | File storage management |
| `@mcv/payments` | Stripe Connect integration |
| `@mcv/twilio` | Twilio SMS/voice integration |
| `@mcv/catalog` | Product catalog services |
| `@mcv/invoicing` | Invoicing and proposals |
| `@mcv/document-editor` | Block-based document editor |
| `@mcv/flags` | Feature flag evaluation |
| `@mcv/activity` | Activity tracking and event bus |
| `@mcv/audit` | Audit log recording |
| `@mcv/tenants` | Multi-tenancy utilities |
| `@mcv/users` | User management utilities |
| `@mcv/secrets` | Secret management (GCP) |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.4.5 | TypeScript compiler |
| `vitest` | ^2.1.9 | Test runner |
| `@vitest/coverage-v8` | ^2.1.0 | Code coverage |
| `@simplewebauthn/server` | ^13.2.2 | WebAuthn/FIDO2 server |
| `@simplewebauthn/types` | 11 | WebAuthn type definitions |

---

## File Structure

```
packages/api/src/
├── index.ts                          # Root exports
├── openapi.ts                        # OpenAPI spec generation
├── trpc/
│   ├── index.ts                      # Re-exports all tRPC utilities
│   ├── init.ts                       # tRPC init (SuperJSON + Zod error formatting)
│   ├── context.ts                    # Context creation (Session, User, Venture, Permissions)
│   └── procedures.ts                 # 14+ procedure types + middleware definitions
├── middleware/
│   ├── index.ts                      # Re-exports middleware
│   ├── logger.ts                     # Request logging middleware
│   └── rate-limit.ts                 # Sliding window rate limiter (5 presets)
├── routers/
│   ├── index.ts                      # AppRouter — merges 61 domain routers
│   ├── auth.router.ts                # Authentication & session management
│   ├── gateway.router.ts             # LLM gateway operations
│   ├── rag.router.ts                 # RAG operations (nested routers)
│   ├── catalog.router.ts             # Product catalog (48 procedures)
│   ├── calendar.router.ts            # Calendar & appointments (32 procedures)
│   ├── workflow.router.ts            # Workflow automation engine
│   ├── hitl.router.ts                # HITL approval queue
│   ├── agent-tasks.router.ts         # AI agent task operations
│   ├── intelligence.router.ts        # Intelligence layer
│   ├── ... (51 more router files)
│   └── workbench.ts                  # Engineering workbench
├── schemas/
│   ├── index.ts                      # Re-exports all schemas
│   ├── common.schema.ts              # Shared: pagination, dates, IDs, status
│   ├── auth.schema.ts                # Auth: login, signup, MFA, wallet
│   ├── workflow.schema.ts            # V1 + V2 workflow schemas
│   ├── ... (39 more schema files)
│   └── task.types.ts                 # Task-specific type definitions
├── services/
│   ├── index.ts                      # Re-exports all services
│   ├── workflow-engine.ts            # Graph workflow engine (102KB)
│   ├── intelligence.service.ts       # Intelligence layer (50KB)
│   ├── auth.service.ts               # Auth logic (legacy)
│   ├── ... (65 more service files)
│   └── integration.guard.ts          # Integration permission guard
├── types/
│   └── index.ts                      # Re-exports all type definitions
└── utils/
    ├── index.ts                      # Re-exports all utilities
    ├── pagination.ts                 # Offset + cursor pagination helpers
    ├── jwt.ts                        # JWT signing/verification
    ├── crypto.ts                     # Password hashing, token generation
    ├── cookies.ts                    # Cookie management helpers
    ├── oauth.ts                      # OAuth flow utilities
    ├── response.ts                   # Response wrapper types
    ├── color.ts                      # Color utilities
    └── image.ts                      # Image processing utilities
```

---

## OpenAPI Specification

The package generates an OpenAPI 3.0 document from the tRPC routers for external consumers:

```typescript
import { generateOpenApiDocument } from 'trpc-to-openapi';
import { appRouter } from './routers';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'MCV.ONE API',
  version: '1.0.0',
  baseUrl: 'http://localhost:3000/api',
  description: 'Automated API documentation for MCV.ONE Monorepo',
  tags: ['auth', 'ventures', 'users', 'payments'],
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
});
```

---

## Design Decisions

### Why tRPC v11 (Not REST/GraphQL)?

1. **End-to-end type safety** — No codegen, no schema drift. Client types inferred from server definitions.
2. **Zod integration** — Input validation + TypeScript types from single source of truth.
3. **SuperJSON** — Rich type serialization (Date, BigInt, Map, Set) without manual conversion.
4. **React Query integration** — `createTRPCReact` provides hooks with automatic cache management.
5. **Batching** — `httpBatchLink` combines concurrent queries into single HTTP request.
6. **Server components** — `createCallerFactory` enables zero-overhead procedure calls in RSC.

### Why a Single AppRouter?

1. **Single `AppRouter` type** — One type import gives client access to all endpoints.
2. **Shared context** — All procedures receive the same context creation logic.
3. **Consistent middleware** — Logger and auth run uniformly.
4. **Selective mounting** — Individual routers exported for micro-services or testing.

### Why In-Memory Rate Limiting?

1. **Zero latency** — No network round-trip for rate checks.
2. **Sufficient for single-process** — MCV currently runs on single Next.js instance.
3. **Swappable** — The `rateLimiter` instance can be replaced with Redis adapter.
4. **Automatic cleanup** — Stale entries cleaned every 60s to prevent memory leaks.

### Why Better Auth (Not NextAuth/Lucia)?

1. **Organization/tenant plugin** — Built-in multi-tenancy via `activeOrganizationId` on sessions.
2. **Passkey support** — Native WebAuthn/FIDO2 without additional packages.
3. **API-first** — `auth.api.getSession()` works in any context (not just Next.js).
4. **Session management** — `revokeOtherSessions`, `listSessions` out of the box.

---

## Migration Notes

### Better Auth Migration (In Progress)

Several auth endpoints are marked `@deprecated` as the platform migrates from custom JWT auth to Better Auth:

| Deprecated Endpoint | Replacement |
|---------------------|-------------|
| `auth.login` | `authClient.signIn.email()` |
| `auth.signup` | `authClient.signUp.email()` |
| `auth.refresh` | Better Auth handles via cookies |
| `auth.completeMfaLogin` | `authClient.twoFactor.verify()` |
| `auth.enableMfa` | `authClient.twoFactor.enable()` |
| `auth.verifyMfa` | `authClient.twoFactor.verify()` |
| `auth.disableMfa` | `authClient.twoFactor.disable()` |

**Active endpoints** (not deprecated): `auth.me`, `auth.logout`, `auth.logoutAll`, `auth.changePassword`, `auth.sessions`, `auth.revokeSession`, `auth.switchVenture`, `auth.walletNonce`, `auth.walletVerify`.

---

## Related Packages

| Package | Relationship |
|---------|-------------|
| `@mcv/db` | Database client — provides Drizzle ORM instance and schemas |
| `@mcv/auth` | Authentication — provides Better Auth instance and session verification |
| `@mcv/permissions` | Authorization — provides `loadUserPermissions()` and `checkPermission()` |
| `@mcv/logger` | Logging — provides structured logger instance |
| `@mcv/gateway` | AI Gateway — provides LLM execution, routing, and budget management |
| `@mcv/rag` | RAG System — provides store registry, document ingestion, and search |
| `@mcv/notifications` | Email — provides email templates and SendGrid delivery |
| `@mcv/catalog` | Commerce — provides product, category, and inventory services |
| `@mcv/payments` | Payments — provides Stripe Connect integration |
| `@mcv/twilio` | Communication — provides SMS, voice, and phone number management |
| `@mcv/ui` | Frontend — consumes `AppRouter` type for tRPC client hooks |

---

## Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Type checking
pnpm typecheck

# Lint
pnpm lint

# Generate OpenAPI spec
pnpm generate:openapi
```

### Testing Strategy

- **Unit tests** — Service logic with mocked DB
- **Integration tests** — Full procedure calls via `createCallerFactory`
- **Schema tests** — Validation edge cases for Zod schemas

```typescript
// Example: testing a procedure with createCallerFactory
import { appRouter, createCallerFactory } from '@mcv/api';

const createCaller = createCallerFactory(appRouter);

describe('auth.me', () => {
  it('returns user profile for authenticated user', async () => {
    const caller = createCaller({
      db: mockDb,
      logger: mockLogger,
      headers: new Headers(),
      requestId: 'test-123',
      ip: '127.0.0.1',
      userAgent: 'test',
      session: mockSession,
      user: mockUser,
      venture: mockVenture,
      permissions: mockPermissions,
    });

    const result = await caller.auth.me();
    expect(result.user.id).toBe(mockUser.id);
  });
});
```

---

*@mcv/api — The Single API Surface of MCV.ONE*
