# @mcv/api — Centralized tRPC API Package

**Package:** `@mcv/api`  
**Tier:** 6 (Presentation Layer — API)  
**Classification:** MCV-ONLY (Internal)  
**Version:** 0.1.0  
**Last Updated:** February 8, 2026

---

## Purpose

The `@mcv/api` package is the **single API surface** for the entire MCV.ONE platform. It exposes a unified tRPC router (`appRouter`) that merges **61 domain routers** into one type-safe, end-to-end API. Every client — Next.js App Router, Hono edge workers, React Query hooks, and AI agents — connects through this package.

**This is the only package that defines API endpoints. No other package creates HTTP routes.**

Key responsibilities:

- **Type-safe RPC** — Full end-to-end TypeScript inference from client to server via tRPC v11
- **Authentication & Authorization** — 10+ procedure types enforcing Better Auth sessions, RBAC tiers, venture context, agent identity, and granular permissions
- **Input Validation** — Zod-first schema validation on every endpoint via 42 schema modules
- **Rate Limiting** — Sliding window rate limiter with 5 presets protecting all endpoint categories
- **Multi-tenancy** — Venture-scoped context injected into every authenticated request
- **Domain Orchestration** — 68 service classes implementing business logic behind thin router handlers
- **Serialization** — SuperJSON transformer for Date, Map, Set, BigInt, and undefined values

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            @mcv/api — tRPC API LAYER                                    │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              CLIENT ENTRY POINTS                                   │  │
│  │                                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │  │
│  │  │  Next.js App │  │  Hono Edge   │  │  React Query │  │  AI Agents   │          │  │
│  │  │  /api/trpc   │  │  Worker      │  │  Client SDK  │  │  x-agent-id  │          │  │
│  │  │  GET / POST  │  │  /trpc/*     │  │  trpc.xxx()  │  │  Headers     │          │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │  │
│  │         │                 │                 │                 │                    │  │
│  │         └─────────────────┴─────────────────┴─────────────────┘                    │  │
│  │                                    │                                               │  │
│  └────────────────────────────────────┼───────────────────────────────────────────────┘  │
│                                       │                                                  │
│  ┌────────────────────────────────────▼───────────────────────────────────────────────┐  │
│  │                          CONTEXT CREATION                                           │  │
│  │                                                                                     │  │
│  │  createFetchContext(req) → createContext(headers)                                   │  │
│  │                                                                                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│  │  │  Parse      │  │  Verify     │  │  Load       │  │  Load       │              │  │
│  │  │  Headers    │→ │  Session    │→ │  Venture    │→ │  Permissions│              │  │
│  │  │  (IP, UA,   │  │  (Better    │  │  (DB lookup │  │  (RBAC tier │              │  │
│  │  │  requestId) │  │   Auth)     │  │  + status)  │  │  + grants)  │              │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘              │  │
│  │                                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                                  │
│  ┌────────────────────────────────────▼───────────────────────────────────────────────┐  │
│  │                          MIDDLEWARE PIPELINE                                        │  │
│  │                                                                                     │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                 │  │
│  │  │  Logger           │  │  Rate Limiter     │  │  Auth Enforcer   │                 │  │
│  │  │                   │  │                   │  │                   │                 │  │
│  │  │  • path, type     │  │  • Sliding window │  │  • isAuthenticated│                 │  │
│  │  │  • requestId      │  │  • 5 presets      │  │  • isAdmin        │                 │  │
│  │  │  • userId         │  │  • Per-route keys │  │  • isSuperAdmin   │                 │  │
│  │  │  • duration       │  │  • 429 + Retry    │  │  • hasVenture     │                 │  │
│  │  │  • error tracking │  │  • Auto-cleanup   │  │  • isAgent        │                 │  │
│  │  └──────────────────┘  └──────────────────┘  │  • requirePerm()  │                 │  │
│  │                                               └──────────────────┘                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                                  │
│  ┌────────────────────────────────────▼───────────────────────────────────────────────┐  │
│  │                          ROUTER LAYER (61 Domain Routers)                           │  │
│  │                                                                                     │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
│  │  │  auth   │ │ gateway │ │  rag    │ │calendar │ │ catalog │ │workflow │        │  │
│  │  │ (15)    │ │ (18)    │ │ (14)    │ │ (32)    │ │ (48)    │ │ (20+)   │        │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
│  │  │  tasks  │ │contacts │ │  hitl   │ │  ai     │ │payments │ │  ...55  │        │  │
│  │  │ (12)    │ │ (8)     │ │ (6)     │ │ (varies)│ │ (varies)│ │  more   │        │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │  │
│  │                                                                                     │  │
│  │  Each router: Zod input → procedure type → handler → service call                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                                  │
│  ┌────────────────────────────────────▼───────────────────────────────────────────────┐  │
│  │                          SERVICE LAYER (68 Domain Services)                         │  │
│  │                                                                                     │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │  │
│  │  │ AuthService     │  │ CalendarService│  │ Intelligence   │  │ WorkflowEngine │   │  │
│  │  │                 │  │                │  │ Service (50KB) │  │ (102KB)        │   │  │
│  │  │ Login, signup,  │  │ CRUD, avail,   │  │ Venture health,│  │ Graph exec,    │   │  │
│  │  │ wallet, MFA     │  │ booking, sync  │  │ entity intel   │  │ versioning     │   │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘   │  │
│  │                                                                                     │  │
│  │  + 64 more services: AuditService, AiService, CatalogService, ContactService...   │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                                  │
│  ┌────────────────────────────────────▼───────────────────────────────────────────────┐  │
│  │                          DATABASE & EXTERNAL SERVICES                               │  │
│  │                                                                                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │ @mcv/db  │  │ @mcv/auth│  │@mcv/gate │  │ @mcv/rag │  │ Stripe   │            │  │
│  │  │ Drizzle  │  │ Better   │  │ OpenRouter│  │ Vector   │  │ Twilio   │            │  │
│  │  │ Postgres │  │ Auth     │  │ LLM GW   │  │ Search   │  │ SendGrid │            │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │  │
│  │                                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Package Exports

The package provides seven export entry points via `package.json` exports map:

```jsonc
{
  ".":          "./src/index.ts",      // Everything (appRouter, types, schemas, services)
  "./trpc":     "./src/trpc/index.ts", // tRPC utilities, procedures, context
  "./routers":  "./src/routers/index.ts",    // AppRouter + individual routers
  "./middleware":"./src/middleware/index.ts", // Rate limiting, logger
  "./services": "./src/services/index.ts",   // All domain services
  "./schemas":  "./src/schemas/index.ts",    // All Zod schemas
  "./schemas/*":"./src/schemas/*.ts",        // Individual schema modules
  "./types":    "./src/types/index.ts"       // All TypeScript types
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
} from './routers';

// ═══════════════════════════════════════════════════════════════════════════════
// tRPC UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  // Core
  router,
  middleware,
  procedure,
  createCallerFactory,
  mergeRouters,

  // Context
  createContext,
  createFetchContext,
  type Context,
  type Session,
  type AuthenticatedUser,
  type VentureContext,
  type CreateContextOptions,

  // Procedures
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

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS (42 modules)
// ═══════════════════════════════════════════════════════════════════════════════

export * from './schemas';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICES (68 classes)
// ═══════════════════════════════════════════════════════════════════════════════

export * from './services';

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

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  // Pagination
  calculatePaginationMeta,
  calculateOffset,
  buildPaginatedResponse,
  encodeCursor,
  decodeCursor,
  buildCursorPaginatedResponse,
  type PaginatedResponse,
  type CursorPaginatedResponse,
  type CursorPaginationMeta,
} from './utils';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES (re-exports from all modules)
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  JWTPayload,
  SignJWTOptions,
  SuccessResponse,
} from './types';
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
  // ═══════════════════════════════════════════════════════════════════════════
  // INFRASTRUCTURE (always present)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Drizzle database client (Postgres) — guaranteed non-null for API routes */
  db: NonNullable<typeof db>;

  /** Structured logger instance (@mcv/logger) */
  logger: Logger;

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUEST METADATA (always present)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Raw request headers */
  headers: Headers;

  /** Unique request identifier (from x-request-id header or crypto.randomUUID()) */
  requestId: string;

  /** Client IP extracted from cf-connecting-ip / x-forwarded-for / x-real-ip */
  ip: string | null;

  /** User-Agent header value */
  userAgent: string | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION STATE (null if unauthenticated)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Session data from Better Auth — null for public procedures */
  session: Session | null;

  /** Authenticated user profile — null for public procedures */
  user: AuthenticatedUser | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // MULTI-TENANCY (null if no venture selected)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Active venture context — null if user hasn't selected a venture */
  venture: VentureContext | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHORIZATION (null if unauthenticated)
  // ═══════════════════════════════════════════════════════════════════════════

  /** User's resolved permissions from @mcv/permissions — null for public */
  permissions: UserPermissions | null;

  // ═══════════════════════════════════════════════════════════════════════════
  // RATE LIMITING (set by rate limit middleware)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Rate limit info — only present on rate-limited procedures */
  rateLimit?: RateLimitInfo;
}
```

### Session

```typescript
/**
 * User session data extracted from Better Auth.
 * Mapped from Better Auth's session object during context creation.
 */
export interface Session {
  /** User ID (UUID) */
  userId: string;

  /** User's email address */
  email: string;

  /** Active venture ID (from activeVentureId on session) — null if none selected */
  ventureId: string | null;

  /** Database ID of the Better Auth session record */
  sessionId: string;

  /** When this session expires */
  expiresAt: Date;
}
```

### AuthenticatedUser

```typescript
/**
 * Authenticated user with profile data.
 * Shape matches Better Auth's user schema.
 */
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
/**
 * Current venture (tenant) context.
 * Loaded from the ventures table when session has an activeVentureId.
 */
export interface VentureContext {
  id: string;
  slug: string;
  name: string;
  status: "active" | "suspended" | "archived" | "pending";
  settings: Record<string, unknown> | null;
}
```

### Procedure Context Types

Each procedure type narrows the `Context` to guarantee certain fields are present:

```typescript
/**
 * Context with guaranteed session — used by protectedProcedure
 */
export interface AuthenticatedContext extends Context {
  session: Session;              // Guaranteed non-null
  user: AuthenticatedUser;       // Guaranteed non-null
  permissions: UserPermissions;  // Guaranteed non-null
}

/**
 * Context with guaranteed venture — used by ventureProcedure
 */
export interface VentureContextRequired extends AuthenticatedContext {
  venture: VentureContext;       // Guaranteed non-null
}

/**
 * Admin context — tier 0 (super) or tier 1 (venture admin)
 */
export interface AdminContext extends AuthenticatedContext {
  // permissions.tier is 0 or 1
}

/**
 * Super admin context — tier 0 only
 */
export interface SuperAdminContext extends AuthenticatedContext {
  // permissions.tier is 0
}

/**
 * Agent context — AI agent authenticated via headers
 */
export interface AgentContext extends Context {
  agent: {
    id: string;
    name: string;
    agentType: string;
    autonomyLevel: number;
    ventureScope: string[];
  };
}

/**
 * Context with rate limit info
 */
export interface RateLimitedContext extends Context {
  rateLimit: RateLimitInfo;
}

/**
 * Authenticated + rate limited context
 */
export interface RateLimitedAuthenticatedContext extends AuthenticatedContext {
  rateLimit: RateLimitInfo;
}
```

### RateLimitInfo

```typescript
/**
 * Rate limit info injected into context by rate limit middleware.
 */
export interface RateLimitInfo {
  /** Current request count in the window */
  current: number;
  /** Maximum allowed requests */
  limit: number;
  /** Remaining requests in current window */
  remaining: number;
  /** Seconds until window resets */
  resetIn: number;
}
```

---

## tRPC Initialization

The tRPC instance is created in `src/trpc/init.ts` with two critical configurations:

```typescript
import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  /**
   * SuperJSON transformer for proper serialization of:
   * - Date objects → ISO strings (auto-deserialized on client)
   * - Map/Set → array representations
   * - BigInt → string
   * - undefined values → preserved across wire
   */
  transformer: superjson,

  /**
   * Custom error formatter that exposes:
   * - Flattened Zod validation errors (fieldErrors + formErrors)
   * - Stack traces in development only
   */
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
        stack:
          process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    };
  },
});

// Export tRPC primitives
export const router = t.router;
export const middleware = t.middleware;
export const procedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
export const mergeRouters = t.mergeRouters;
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
    │ Health, auth     │  │ Logged-in user  │   │ Public + rate limited      │
    └──────────────────┘  └──────┬──────────┘   └────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
  ┌──────▼──────────┐  ┌────────▼────────┐  ┌──────────▼──────────┐
  │ adminProcedure  │  │ ventureProcedure│  │ permissionProcedure │
  │ + isAdmin       │  │ + hasVenture   │  │ + requirePermission │
  │                 │  │ Context         │  │ ('resource','action')│
  │ Tier 0 or 1    │  │                 │  │                      │
  └──────┬──────────┘  │ Auth + venture  │  │ Auth + specific RBAC│
         │             │ required        │  │ grant checked       │
  ┌──────▼──────────┐  └─────────────────┘  └──────────────────────┘
  │ superAdminProc. │
  │ + isSuperAdmin  │
  │                 │
  │ Tier 0 only     │
  └─────────────────┘

  ┌──────────────────┐  ┌───────────────────────────┐
  │ agentProcedure   │  │ rateLimitedAuthProcedure  │
  │ + isAgent        │  │ + rateLimitAuth (5/min)    │
  │                  │  │                            │
  │ x-agent-id header│  │ Login/signup protection    │
  └──────────────────┘  └───────────────────────────┘
```

### Procedure Reference

| Procedure | Middleware Chain | Auth Level | Rate Limit | Use Case |
|-----------|----------------|------------|------------|----------|
| `publicProcedure` | logger | None | None | Health checks, public booking pages, auth flows |
| `protectedProcedure` | logger → isAuthenticated | Session required | None | General authenticated endpoints |
| `adminProcedure` | logger → isAdmin | Tier 0 or 1 | None | Venture management, user admin |
| `superAdminProcedure` | logger → isSuperAdmin | Tier 0 only | None | System settings, cross-venture ops |
| `ventureProcedure` | logger → hasVentureContext | Session + venture | None | Venture-scoped operations |
| `agentProcedure` | logger → isAgent | x-agent-id header | None | AI agent endpoints |
| `permissionProcedure(r,a)` | logger → isAuth → requirePermission | Session + RBAC grant | None | Granular permission checks |
| `rateLimitedPublicProcedure` | logger → rateLimitPublic | None | 50/min per IP | Rate-limited public APIs |
| `rateLimitedProtectedProcedure` | logger → rateLimitGeneral → isAuth | Session required | 100/min per user | Rate-limited authenticated APIs |
| `rateLimitedAuthProcedure` | logger → rateLimitAuth | None | 5/min per IP | Login, signup, password reset |
| `strictRateLimitedProcedure` | logger → rateLimitStrict | None | 3/min per IP | Password reset confirmation |
| `rateLimitedProcedure(cfg)` | logger → custom rate limit | None | Custom | Factory for custom limits |
| `rateLimitedProtectedProcedureWith(cfg)` | logger → custom RL → isAuth | Session required | Custom | Factory for custom auth + RL |
| `rateLimitedAdminProcedure(cfg)` | logger → custom RL → isAdmin | Tier 0 or 1 | Custom | Factory for admin + RL |

---

## Middleware

### Logger Middleware

Applied to **every** procedure via `baseProcedure`. Logs the full lifecycle:

```typescript
export const loggerMiddleware = middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();
  const { logger, requestId, session } = ctx;

  const meta = { path, type, requestId, userId: session?.userId };

  logger.debug({ ...meta, msg: "Procedure started" });

  try {
    const result = await next();
    const durationMs = Date.now() - start;

    if (!result.ok) {
      logger.error({ ...meta, durationMs, error: result.error, msg: "Procedure failed" });
    } else {
      logger.info({ ...meta, durationMs, msg: "Procedure completed" });
    }
    return result;
  } catch (error) {
    const durationMs = Date.now() - start;
    logger.error({ ...meta, durationMs, error, msg: "Procedure crashed" });
    throw error;
  }
});
```

**Log fields per request:**

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | tRPC path (e.g., `auth.login`, `catalog.listProducts`) |
| `type` | string | `query` or `mutation` |
| `requestId` | string | UUID from `x-request-id` header or auto-generated |
| `userId` | string \| undefined | Authenticated user's ID |
| `durationMs` | number | Wall-clock execution time |
| `error` | object \| undefined | Error details on failure |

### Rate Limit Middleware

The rate limiter uses a **sliding window algorithm** with in-memory storage:

```typescript
export class SlidingWindowRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();

  // Automatic cleanup of stale entries every 60s
  // Entries expire after 5 minutes of inactivity

  check(key: string, limit: number, windowMs: number): RateLimitResult;
  status(key: string, limit: number, windowMs: number): RateLimitResult;
  reset(key: string): void;
  clear(): void;
  get size(): number;
}
```

**Rate Limit Presets:**

| Preset | Limit | Window | Key Strategy | Use Case |
|--------|-------|--------|-------------|----------|
| `auth` | 5 req | 60s | Client IP | Login, signup, password reset — brute force protection |
| `general` | 100 req | 60s | User ID (fallback: IP) | Standard authenticated endpoints |
| `public` | 50 req | 60s | Client IP | Unauthenticated public APIs |
| `strict` | 3 req | 60s | Client IP | Highly sensitive ops (e.g., password reset confirm) |
| `relaxed` | 500 req | 60s | User ID (fallback: IP) | High-throughput endpoints |

**Composite key format:** `{tRPC_path}:{identifier}` — rate limits are applied per-route.

**Rate Limit Config Interface:**

```typescript
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Key generator — determines how to identify unique clients */
  keyGenerator?: (ctx: Context) => string | null;
  /** Whether to skip rate limiting for certain requests */
  skip?: (ctx: Context) => boolean;
  /** Custom message for 429 error */
  message?: string;
}
```

**Rate Limit Headers:**

```typescript
// Success response headers
'X-RateLimit-Limit': '100'        // Maximum allowed
'X-RateLimit-Remaining': '95'     // Remaining in window
'X-RateLimit-Reset': '1706300060' // Unix timestamp when window resets

// 429 response headers (additional)
'Retry-After': '15'               // Seconds to wait before retrying
```

### Authentication Middleware

Six auth enforcement middlewares, each narrowing the context type:

```typescript
// isAuthenticated — Checks session, user, permissions exist + user is "active"
// Throws UNAUTHORIZED if not logged in
// Throws FORBIDDEN if user status is "suspended"

// isAdmin — Checks permissions.tier is 0 or 1
// Throws FORBIDDEN if not admin

// isSuperAdmin — Checks permissions.tier is 0
// Throws FORBIDDEN if not super admin

// hasVentureContext — Checks auth + ctx.venture exists
// Throws BAD_REQUEST if no venture selected

// isAgent — Checks x-agent-id header present
// Constructs agent context object

// requirePermission(resource, action) — Checks auth + calls checkPermission()
// Throws FORBIDDEN with specific reason if denied
```

---

## Context Creation

The context is created for every request in `src/trpc/context.ts`:

```typescript
export async function createContext(opts: CreateContextOptions): Promise<Context> {
  const { headers, requestId = crypto.randomUUID() } = opts;

  // 1. Base context (always present)
  const baseContext: Context = {
    db,
    logger,
    headers,
    requestId,
    ip: extractClientIP(headers),     // cf-connecting-ip → x-forwarded-for → x-real-ip
    userAgent: headers.get("user-agent"),
    session: null,
    user: null,
    venture: null,
    permissions: null,
  };

  // 2. Verify session via Better Auth
  const sessionData = await auth.api.getSession({ headers });
  if (!sessionData) return baseContext;  // Unauthenticated

  // 3. Map session to our Session interface
  const contextSession: Session = {
    userId: session.userId,
    email: user.email,
    ventureId: (session as any).activeVentureId || null,
    sessionId: session.id,
    expiresAt: session.expiresAt,
  };

  // 4. Load venture if ventureId is set
  let venture: VentureContext | null = null;
  if (contextSession.ventureId) {
    venture = await loadVenture(contextSession.ventureId);
    // Returns null if venture is "suspended"
  }

  // 5. Load user permissions via @mcv/permissions
  const permissions = await loadUserPermissions(
    contextSession.userId,
    contextSession.ventureId,
    db,
    user.role,
  );

  return { ...baseContext, session: contextSession, user, venture, permissions };
}

// Adapter for Fetch API (Next.js App Router, Hono, Cloudflare Workers)
export async function createFetchContext(opts: FetchCreateContextFnOptions): Promise<Context> {
  return createContext({
    headers: opts.req.headers,
    requestId: opts.req.headers.get("x-request-id") || undefined,
  });
}
```

**IP Extraction Priority:**
1. `cf-connecting-ip` (Cloudflare)
2. `x-forwarded-for` (first IP in chain)
3. `x-real-ip` (Nginx)
4. `null` (local/direct)

---

## Router Catalog

All 61 domain routers merged into the `appRouter`. Organized by functional area:

### Authentication & Identity (6 routers)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `auth` | `authRouter` | Login, signup, logout, sessions, password reset, email verification, venture switching, Web3 wallet auth | ~20 | public + protected |
| `mfa` | `mfaRouter` | Multi-factor authentication (TOTP, SMS) setup and verification | ~6 | protected |
| `passkey` | `passkeyRouter` | WebAuthn/FIDO2 passkey registration and authentication | ~6 | protected |
| `wallet` | `walletRouter` | Web3 wallet nonce generation and signature verification | ~4 | public + protected |
| `users` | `usersRouter` | User CRUD, profile management, role assignment, invitations | ~12 | admin |
| `roles` | `rolesRouter` | Role CRUD, permission assignment, tier management | ~8 | admin |

### Multi-Tenancy & Access Control (4 routers)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `ventures` | `venturesRouter` | Venture CRUD, settings, tier management | ~10 | admin / superAdmin |
| `ventureMembers` | `ventureMembersRouter` | Venture membership management, invitations | ~8 | admin |
| `permissions` | `permissionsRouter` | Permission queries, grant checks | ~6 | protected |
| `settings` | `settingsRouter` | System and venture settings management | ~8 | admin |

### AI & Intelligence (7 routers)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `gateway` | `gatewayRouter` | LLM chat completions, tier routing, usage analytics, budget management, model config | ~18 | protected / admin / superAdmin |
| `rag` | `ragRouter` | RAG store management, file upload/ingestion, basic/synthesis/deep queries, cost tracking | ~14 (nested) | protected / admin / superAdmin |
| `ai` | `aiRouter` | AI command center — orchestration, prompt management | varies | protected / admin |
| `intelligence` | `intelligenceRouter` | Venture health reports, entity intelligence, unified timeline, actionable insights | ~8 (nested) | admin / superAdmin |
| `hitl` | `hitlRouter` | Human-in-the-Loop approval queue: create, list, resolve, escalate | ~6 | protected |
| `agentTasks` | `agentTasksRouter` | Agent task queue: assign, claim, progress, complete, metrics | ~8 | venture / protected |
| `workbench` | `workbenchRouter` | Engineering workbench tools | varies | protected |

### CRM & Contacts (6 routers)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `contacts` | `contactRouter` | Contact CRUD, search, lifecycle management | ~8 | venture |
| `organizations` | `organizationRouter` | Organization/company CRUD, hierarchy | ~8 | venture |
| `deals` | `dealRouter` | Deal pipeline CRUD, stage management | ~10 | venture |
| `activities` | `activityRouter` | CRM activity log (calls, emails, meetings) | ~6 | protected |
| `crmV2` | `crmV2Router` | Advanced CRM: custom objects, deal scoring, forecasting, duplicates, lead scoring, smart views | ~20+ | venture / admin |
| `entityGraph` | `entityGraphRouter` | Universal cross-entity relationship system | ~10 | admin |

### Task & Project Management (8 routers)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `tasks` | `taskRouter` | Task CRUD, status transitions, search, bulk operations | ~12 | venture |
| `projects` | `projectRouter` | Project CRUD, member management | ~10 | venture |
| `sprints` | `sprintRouter` | Sprint management, time-boxed iterations | ~8 | venture |
| `taskTemplates` | `taskTemplateRouter` | Reusable task creation templates | ~6 | venture |
| `timeEntries` | `timeEntryRouter` | Worklogs, timers, timesheets | ~8 | venture |
| `automationRules` | `automationRuleRouter` | No-code workflow automation rules | ~8 | venture / admin |
| `taskAnalytics` | `taskAnalyticsRouter` | Burndown, velocity, throughput, cycle time analytics | ~6 | venture |
| `workflows` | `workflowRouter` | Workflow automation engine: V1 + V2 graph-based, versioning, execution, approvals, templates | ~20+ | venture / admin |

### Communication & Contact Center (4 routers)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `conversations` | `conversationRouter` | Contact center conversations, messaging | ~10 | protected |
| `queues` | `queueRouter` | Contact center queue routing, assignment | ~8 | admin |
| `twilio` | `twilioRouter` | SMS, voice, phone number management (Twilio) | ~10 | admin |
| `contactCenter` | `contactCenterRouter` | Advanced: power dialer, supervisor, SLA, CSAT, routing | ~15+ | admin |

### Calendar & Scheduling (1 router)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `calendar` | `calendarRouter` | Calendar CRUD, availability, appointments, reminders, round-robin, booking pages, Google sync, public booking | ~32 | permission / public |

### Commerce & Payments (4 routers)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `catalog` | `catalogRouter` | Products, categories, discounts, inventory, price rules, collections, tax management | ~48 | venture / admin / superAdmin |
| `payments` | `paymentsRouter` | Stripe Connect payments, invoices, subscriptions | varies | admin |
| `invoicing` | `invoicingRouter` | Advanced invoicing, proposals, recurring, credit notes, platform fees | ~15+ | admin |
| `tokenEconomy` | `tokenEconomyRouter` | Web3/EDGE token, staking, governance, vesting, DAO | ~12 | admin |

### Marketing & Content (5 routers)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `email` | `emailRouter` | Email marketing (SendGrid integration) | ~8 | admin |
| `marketing` | `marketingRouter` | Marketing automation campaigns | ~10 | admin |
| `forms` | `formRouter` | Forms & surveys builder, submissions, analytics | ~12 | venture / admin |
| `reputation` | `reputationRouter` | Reviews, AI responses, competitor tracking, widgets | ~12 | venture / admin |
| `cms` | `cmsRouter` | Content management system | ~10 | venture / admin |

### Documents & Storage (3 routers)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `documentEditor` | `documentEditorRouter` | Block-based document editor (invoices, proposals) | ~8 | venture |
| `storage` | `storageRouter` | File upload, download, management | ~8 | protected |
| `comments` | `commentsRouter` | Universal commenting system | ~6 | protected |

### Analytics & Observability (4 routers)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `analytics` | `analyticsRouter` | Analytics hub: metrics, dashboards | ~10 | admin |
| `stats` | `statsRouter` | Statistics and aggregate metrics | ~8 | admin |
| `audit` | `auditRouter` | Audit log queries and management | ~6 | admin |
| `notifications` | `notificationsRouter` | Notification delivery and preferences | ~8 | protected |

### Platform Operations (6 routers)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `flags` | `flagsRouter` | Feature flag management | ~6 | admin |
| `webhooks` | `webhookRouter` | Webhook configuration and delivery | ~8 | admin |
| `integrations` | `integrationRouter` | OAuth integration management | ~8 | admin |
| `portfolio` | `portfolioRouter` | Cross-venture portfolio analytics | ~8 | superAdmin |
| `treasury` | `treasuryRouter` | Financial oversight, token economy | ~10 | admin / superAdmin |
| `strategy` | `strategyRouter` | Objectives, roadmap, M&A, investor relations | ~10 | admin / superAdmin |

### Grants & Funding (1 router)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `grants` | `grantConciergeRouter` | Grant opportunities, applications, documents, calendar | ~12 | venture / admin |

### Tags & Metadata (1 router)

| Namespace | Router | Description | Procedure Count | Auth Level |
|-----------|--------|-------------|----------------|------------|
| `tags` | `tagsRouter` | Universal tagging system | ~6 | protected |

---

## Schemas

The `schemas/` directory contains **42 Zod schema modules** providing input validation for every endpoint. All schemas are co-located with their domain and re-exported from `schemas/index.ts`.

### Common Schemas (`common.schema.ts`)

Reusable building blocks used across all routers:

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// PAGINATION
// ═══════════════════════════════════════════════════════════════════════════════

export const cursorPaginationSchema = z.object({
  cursor: z.string().nullish(),
  limit: z.number().min(1).max(100).default(20),
});

export const offsetPaginationSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

export const paginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
  hasMore: z.boolean(),
  hasPrevious: z.boolean(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// SORTING & FILTERING
// ═══════════════════════════════════════════════════════════════════════════════

export const sortDirectionSchema = z.enum(["asc", "desc"]);
export const sortSchema = z.object({
  field: z.string(),
  direction: sortDirectionSchema.default("asc"),
});

export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const filterOperatorSchema = z.enum([
  "eq", "neq", "gt", "gte", "lt", "lte",
  "like", "in", "nin", "null", "notNull",
]);

// ═══════════════════════════════════════════════════════════════════════════════
// IDS & STATUS
// ═══════════════════════════════════════════════════════════════════════════════

export const uuidSchema = z.string().uuid();
export const uuidArraySchema = z.array(uuidSchema);
export const idParamSchema = z.object({ id: uuidSchema });
export const idsParamSchema = z.object({ ids: uuidArraySchema.min(1).max(100) });

export const statusSchema = z.enum(["active","inactive","pending","suspended","archived"]);
export const userStatusSchema = z.enum(["active","suspended","banned","deleted"]);
export const ventureStatusSchema = z.enum(["active","suspended","archived","pending"]);

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE WRAPPERS
// ═══════════════════════════════════════════════════════════════════════════════

export function successResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) { ... }
export function listResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) { ... }
export const batchResultSchema = z.object({
  succeeded: z.number(),
  failed: z.number(),
  errors: z.array(z.object({ id: z.string(), error: z.string() })),
});
```

### Schema Catalog

| Schema Module | Domain | Key Schemas | Exported Types |
|--------------|--------|-------------|----------------|
| `auth.schema.ts` | Authentication | loginSchema, signupSchema, resetPasswordSchema, walletVerifySchema, completeMfaLoginSchema | LoginInput, SignupInput, AuthResult, SessionInfo |
| `common.schema.ts` | Shared | offsetPaginationSchema, dateRangeSchema, uuidSchema, idParamSchema | All common types |
| `user.schema.ts` | Users | createUserSchema, updateUserSchema, listUsersSchema | User, UserWithRoles, CreateUserInput |
| `venture.schema.ts` | Ventures | createVentureSchema, updateVentureSchema | Venture, VentureWithStats, VentureSettings |
| `task.schema.ts` | Tasks | createTaskSchema, updateTaskSchema, listTasksSchema | Task types |
| `task-extended.schema.ts` | Agent Tasks | queueForAgentSchema, agentClaimTaskSchema, agentCompleteTaskSchema | Agent task types |
| `task-template.schema.ts` | Templates | createTemplateSchema, listTemplatesSchema | Template types |
| `task-analytics.schema.ts` | Analytics | burndownSchema, velocitySchema | Analytics types |
| `workflow.schema.ts` | Workflows | V1 + V2 schemas: workflowNodeSchema, workflowEdgeSchema, conditionGroupSchema | 20+ types |
| `calendar.schema.ts` | Calendar | createCalendarSchema, bookAppointmentSchema, publicBookSchema | Calendar types |
| `contact.schema.ts` | CRM Contacts | createContactSchema, searchSchema | Contact types |
| `organization.schema.ts` | CRM Orgs | createOrgSchema | Organization types |
| `deal.schema.ts` | CRM Deals | createDealSchema, pipelineSchema | Deal types |
| `conversation.schema.ts` | Contact Center | createConversationSchema, messageSchema | Conversation types |
| `queue.schema.ts` | Routing | queueConfigSchema, assignmentSchema | Queue types |
| `analytics.schema.ts` | Analytics Hub | metricSchema, dashboardSchema | Analytics types |
| `stats.schema.ts` | Statistics | aggregateSchema | Stat types |
| `activity.schema.ts` | Activity Log | createActivitySchema, listSchema | Activity types |
| `integration.schema.ts` | OAuth | oauthConfigSchema | Integration types |
| `webhook.schema.ts` | Webhooks | createWebhookSchema | Webhook types |
| `form.schema.ts` | Forms | formBuilderSchema, submissionSchema | Form types |
| `reputation.schema.ts` | Reviews | reviewRequestSchema, responseSchema | Reputation types |
| `portfolio.schema.ts` | Portfolio | portfolioQuerySchema | Portfolio types |
| `strategy.schema.ts` | Strategy | objectiveSchema, roadmapSchema | Strategy types |
| `treasury.schema.ts` | Treasury | budgetSchema, transactionSchema | Treasury types |
| `token-economy.schema.ts` | Web3 | stakingSchema, governanceSchema | Token types |
| `entity-graph.schema.ts` | Entity Graph | createNodeSchema, createEdgeSchema | Graph types |
| `intelligence.schema.ts` | Intelligence | ventureIntelligenceSchema, entityIntelligenceSchema | Intelligence types |
| `hitl.schema.ts` | HITL | createHITLApprovalSchema, resolveHITLApprovalSchema | HITL types |
| `sprint.schema.ts` | Sprints | createSprintSchema | Sprint types |
| `time-entry.schema.ts` | Time Tracking | createTimeEntrySchema | TimeEntry types |
| `automation-rule.schema.ts` | Automation | createRuleSchema, conditionSchema | Rule types |
| `crm-v2.schema.ts` | Advanced CRM | customObjectSchema, forecastSchema | CRM V2 types |
| `grant-concierge.schema.ts` | Grants | applicationSchema, opportunitySchema | Grant types |
| `cms.schema.ts` | CMS | contentSchema, pageSchema | CMS types |
| `passkey.schema.ts` | WebAuthn | registrationSchema, verificationSchema | Passkey types |
| `role.schema.ts` | Roles | createRoleSchema | Role types |
| `project.schema.ts` | Projects | createProjectSchema | Project types |
| `branding.schema.ts` | Branding | brandingConfigSchema | Branding types |
| `rag.schema.ts` | RAG | querySchema, uploadSchema | RAG types |

---

## Services

The `services/` directory contains **68 service classes** implementing all business logic. Routers are thin handlers that validate input, check auth, call a service, and return the result.

### Service Catalog

| Service | File | Size | Description |
|---------|------|------|-------------|
| `WorkflowEngine` | `workflow-engine.ts` | 102KB | Graph-based workflow execution engine with versioning, step execution, approvals, and error recovery |
| `IntelligenceService` | `intelligence.service.ts` | 50KB | Venture health reports, entity intelligence profiles, cross-venture comparison, unified timeline |
| `AuthService` | `auth.service.ts` | ~30KB | Login/signup, JWT management, wallet authentication (legacy — migrated to Better Auth) |
| `AiService` | `ai.service.ts` | ~25KB | AI command center orchestration, prompt management |
| `CalendarService` | `calendar.service.ts` | ~15KB | Calendar CRUD, availability rules, overrides |
| `AppointmentService` | `appointment.service.ts` | ~12KB | Booking, rescheduling, cancellation, agenda |
| `AvailabilityService` | `availability.service.ts` | ~10KB | Slot availability calculation, team availability matrix |
| `CatalogService` | (via `@mcv/catalog/server`) | External | Products, categories, discounts, inventory, pricing |
| `ContactService` | `contact.service.ts` | ~8KB | CRM contact CRUD, search, lifecycle |
| `DealService` | `deal.service.ts` | ~8KB | Deal pipeline management |
| `DealScoringService` | `deal-scoring.service.ts` | ~6KB | AI-powered deal scoring |
| `ConversationService` | `conversation.service.ts` | ~10KB | Contact center conversations |
| `QueueService` | `queue.service.ts` | ~8KB | Contact center queue routing |
| `ProjectService` | `project.service.ts` | ~8KB | Project CRUD, members |
| `TaskService` | `task.service.ts` | ~10KB | Task CRUD, status transitions |
| `WorkflowService` | `workflow.service.ts` | ~10KB | V1 workflow CRUD |
| `WorkflowConditionEvaluator` | `workflow-condition-evaluator.ts` | ~8KB | Condition evaluation for workflow branching |
| `AuditService` | `audit.service.ts` | ~5KB | Audit log recording |
| `UserService` | `user.service.ts` | ~8KB | User CRUD, profile management |
| `VentureService` | `venture.service.ts` | ~8KB | Venture CRUD, settings |
| `RoleService` | `role.service.ts` | ~6KB | Role management |
| `MfaService` | `mfa.service.ts` | ~8KB | TOTP setup, verification |
| `PasskeyService` | `passkey.service.ts` | ~8KB | WebAuthn registration/verification |
| `NotificationService` | `notification.service.ts` | ~6KB | Notification delivery |
| `IntegrationService` | `integration.service.ts` | ~8KB | OAuth token management |
| `WebhookService` | `webhook.service.ts` | ~6KB | Webhook dispatch |
| `FormService` | `form.service.ts` | ~8KB | Form builder CRUD |
| `FormSubmissionService` | `form-submission.service.ts` | ~6KB | Form submission processing |
| `FormAnalyticsService` | `form-analytics.service.ts` | ~5KB | Form submission analytics |
| `FormEmbedService` | `form-embed.service.ts` | ~4KB | Embeddable form generation |
| `ReminderService` | `reminder.service.ts` | ~5KB | Appointment reminder scheduling |
| `RoundRobinService` | `round-robin.service.ts` | ~6KB | Round-robin assignment algorithm |
| `BookingPageService` | `booking-page.service.ts` | ~6KB | Public booking page management |
| `GoogleSyncService` | `google-sync.service.ts` | ~8KB | Google Calendar sync |
| `StrategyService` | `strategy.service.ts` | ~8KB | Strategic planning, roadmaps |
| `PortfolioService` | `portfolio.service.ts` | ~6KB | Cross-venture analytics |
| `TreasuryService` | `treasury.service.ts` | ~8KB | Financial oversight |
| `TokenEconomyService` | `token-economy.service.ts` | ~8KB | Web3 token operations |
| `GrantConciergeService` | `grant-concierge.service.ts` | ~10KB | Grant opportunity matching |
| `EntityGraphService` | `entity-graph.service.ts` | ~8KB | Graph-based entity relationships |
| `MetricsService` | `metrics.service.ts` | ~6KB | System metrics collection |
| `ActivityService` | `activity.service.ts` | ~6KB | Activity logging |
| `ActivityBusService` | `activity-bus.service.ts` | ~4KB | Activity event bus |
| `OrganizationService` | `organization.service.ts` | ~6KB | Organization management |
| `CustomObjectService` | `custom-object.service.ts` | ~8KB | CRM custom object definitions |
| `DuplicateDetectionService` | `duplicate-detection.service.ts` | ~6KB | CRM duplicate detection |
| `LeadScoringService` | `lead-scoring.service.ts` | ~6KB | AI lead scoring |
| `ForecastService` | `forecast.service.ts` | ~6KB | Revenue forecasting |
| `SmartViewService` | `smart-view.service.ts` | ~5KB | Saved CRM views |
| `PowerDialerService` | `power-dialer.service.ts` | ~8KB | Auto-dialing system |
| `SupervisorService` | `supervisor.service.ts` | ~6KB | Contact center supervision |
| `RoutingService` | `routing.service.ts` | ~6KB | Contact center routing rules |
| `SlaService` | `sla.service.ts` | ~6KB | SLA tracking and enforcement |
| `CsatService` | `csat.service.ts` | ~5KB | Customer satisfaction surveys |
| `ReviewSyncService` | `review-sync.service.ts` | ~6KB | Review platform sync |
| `ReviewRequestService` | `review-request.service.ts` | ~5KB | Review request campaigns |
| `ReviewResponseService` | `review-response.service.ts` | ~6KB | AI review response generation |
| `ReviewAnalyticsService` | `review-analytics.service.ts` | ~5KB | Review analytics |
| `ReviewWidgetService` | `review-widget.service.ts` | ~4KB | Embeddable review widgets |
| `CompetitorService` | `competitor.service.ts` | ~5KB | Competitor tracking |
| `MarketingAnalyticsService` | `marketing-analytics.service.ts` | ~6KB | Campaign analytics |
| `SocialConnectorService` | `social-connector.service.ts` | ~6KB | Social media integration |
| `AdManagerService` | `ad-manager.service.ts` | ~6KB | Ad campaign management |
| `CreativeService` | `creative.service.ts` | ~5KB | Creative asset management |
| `BrandingService` | `branding.service.ts` | ~5KB | Brand guidelines management |
| `DocumentRagPipelineService` | `document-rag-pipeline.service.ts` | ~8KB | Document ingestion to RAG |
| `AgentPresenceService` | `agent-presence.service.ts` | ~5KB | AI agent presence tracking |
| `IntegrationGuard` | `integration.guard.ts` | ~3KB | Integration permission checks |

---

## Code Examples

### Example 1: Next.js App Router Setup

```typescript
// app/api/trpc/[trpc]/route.ts
import { appRouter, createFetchContext } from '@mcv/api';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createFetchContext,
  });

export { handler as GET, handler as POST };
```

### Example 2: Hono Edge Worker Setup

```typescript
import { Hono } from 'hono';
import { trpcServer } from '@hono/trpc-server';
import { appRouter, createFetchContext } from '@mcv/api';

const app = new Hono();

app.use('/trpc/*', trpcServer({
  router: appRouter,
  createContext: createFetchContext,
}));

export default app;
```

### Example 3: React Query Client Setup

```typescript
// lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@mcv/api';

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
        headers: () => ({
          'x-request-id': crypto.randomUUID(),
        }),
      }),
    ],
  });
}

// Usage in components:
// const { data } = trpc.auth.me.useQuery();
// const { data } = trpc.catalog.listProducts.useQuery({ page: 1, pageSize: 20 });
// const mutation = trpc.calendar.book.useMutation();
```

### Example 4: Server-Side Caller (SSR)

```typescript
// app/dashboard/page.tsx (Server Component)
import { appRouter, createCallerFactory, createContext } from '@mcv/api';
import { headers } from 'next/headers';

const createCaller = createCallerFactory(appRouter);

export default async function DashboardPage() {
  const headersList = await headers();
  const ctx = await createContext({ headers: headersList });
  const caller = createCaller(ctx);

  // Direct procedure calls — fully type-safe, no HTTP overhead
  const me = await caller.auth.me();
  const ventures = await caller.ventures.list({ page: 1, pageSize: 50 });
  const stats = await caller.stats.overview();

  return <Dashboard user={me.user} ventures={ventures} stats={stats} />;
}
```

### Example 5: Creating a Custom Router

```typescript
// routers/my-domain.router.ts
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router } from '../trpc/init';
import {
  ventureProcedure,
  adminProcedure,
  permissionProcedure,
} from '../trpc/procedures';
import { offsetPaginationSchema, uuidSchema } from '../schemas/common.schema';

export const myDomainRouter = router({
  // Query — requires venture context
  list: ventureProcedure
    .input(z.object({
      ...offsetPaginationSchema.shape,
      search: z.string().optional(),
      status: z.enum(['active', 'archived']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      // ctx.venture is guaranteed non-null
      const ventureId = ctx.venture.id;
      // ... database query
      return { items: [], meta: { total: 0, page: input.page, pageSize: input.pageSize, totalPages: 0, hasMore: false, hasPrevious: false } };
    }),

  // Mutation — requires specific permission
  create: permissionProcedure('my-domain', 'create')
    .input(z.object({
      name: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // ctx.user, ctx.permissions guaranteed
      return { id: 'new-uuid', ...input };
    }),

  // Admin mutation
  delete: adminProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      // ctx.permissions.tier is 0 or 1
      return { success: true };
    }),
});
```

### Example 6: Using Rate Limiting

```typescript
import { router } from '../trpc/init';
import {
  rateLimitedPublicProcedure,
  rateLimitedProtectedProcedure,
  rateLimitedProcedure,
  rateLimitedProtectedProcedureWith,
} from '../trpc/procedures';

export const myRouter = router({
  // Pre-built: 50 req/min per IP
  publicEndpoint: rateLimitedPublicProcedure
    .query(async () => {
      return { status: 'ok' };
    }),

  // Pre-built: 100 req/min per user
  protectedEndpoint: rateLimitedProtectedProcedure
    .query(async ({ ctx }) => {
      // ctx.rateLimit.remaining gives remaining quota
      return { remaining: ctx.rateLimit?.remaining };
    }),

  // Custom: 10 req/min with IP key
  customEndpoint: rateLimitedProcedure({
    limit: 10,
    windowMs: 60_000,
    keyGenerator: (ctx) => ctx.ip,
    message: 'Too many requests to this endpoint',
  }).query(async () => {
    return { status: 'ok' };
  }),

  // Custom with auth: 20 req/min per user
  customProtected: rateLimitedProtectedProcedureWith({
    limit: 20,
    windowMs: 60_000,
  }).mutation(async ({ ctx, input }) => {
    return { success: true };
  }),
});
```

### Example 7: Error Handling on the Client

```typescript
import { TRPCClientError } from '@trpc/client';
import type { AppRouter } from '@mcv/api';

async function handleLogin(email: string, password: string) {
  try {
    const result = await trpc.auth.login.mutate({ email, password });
    return result;
  } catch (error) {
    if (error instanceof TRPCClientError<AppRouter>) {
      // Access tRPC error code
      switch (error.data?.code) {
        case 'UNAUTHORIZED':
          console.error('Invalid credentials');
          break;
        case 'FORBIDDEN':
          console.error('Account suspended');
          break;
        case 'TOO_MANY_REQUESTS':
          const retryAfter = error.data?.cause?.retryAfter;
          console.error(`Rate limited. Retry in ${retryAfter}s`);
          break;
        default:
          console.error(error.message);
      }

      // Access Zod validation errors
      if (error.data?.zodError) {
        const fieldErrors = error.data.zodError.fieldErrors;
        // { email: ['Invalid email address'], password: ['Must be 8+ chars'] }
        console.error('Validation errors:', fieldErrors);
      }
    }
  }
}
```

### Example 8: Agent Authentication

```typescript
// From an AI agent (e.g., NAOS Queen, Ralph)
const response = await fetch('/api/trpc/agentTasks.agentClaim', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-agent-id': 'agent_queen_001',      // Required for agentProcedure
    'x-agent-key': 'agent_secret_key',     // Optional: for production validation
    'x-request-id': crypto.randomUUID(),
  },
  body: JSON.stringify({
    json: {
      taskId: '550e8400-e29b-41d4-a716-446655440000',
      agentId: 'agent_queen_001',
    },
  }),
});

// The agent context will be:
// ctx.agent = {
//   id: 'agent_queen_001',
//   name: 'agent',
//   agentType: 'worker',
//   autonomyLevel: 3,
//   ventureScope: [],
// }
```

### Example 9: Permission-Based Procedure

```typescript
import { permissionProcedure, requirePermission, requireAnyPermission } from '@mcv/api';

// Single permission check
const createCalendar = permissionProcedure('calendars', 'create')
  .input(createCalendarSchema)
  .mutation(async ({ ctx, input }) => {
    // User has 'calendars:create' permission
    const service = new CalendarService(ctx.venture!.id);
    return service.create(input);
  });

// Inline permission middleware
const updateDocument = protectedProcedure
  .use(requirePermission('documents', 'update'))
  .input(updateDocSchema)
  .mutation(async ({ ctx, input }) => {
    // ...
  });

// Any-of permission check
const viewReports = protectedProcedure
  .use(requireAnyPermission([
    { resource: 'analytics', action: 'read' },
    { resource: 'reports', action: 'read' },
  ]))
  .query(async ({ ctx }) => {
    // User has EITHER analytics:read OR reports:read
  });
```

### Example 10: Nested Router Pattern (RAG Example)

```typescript
// Routers can be nested for clean namespacing
export const ragRouter = router({
  stores: router({
    list: protectedProcedure.input(...).query(...),
    get: protectedProcedure.input(...).query(...),
    create: adminProcedure.input(...).mutation(...),
    update: adminProcedure.input(...).mutation(...),
    delete: adminProcedure.input(...).mutation(...),
  }),

  files: router({
    list: protectedProcedure.input(...).query(...),
    upload: protectedProcedure.input(...).mutation(...),
    get: protectedProcedure.input(...).query(...),
    delete: protectedProcedure.input(...).mutation(...),
  }),

  query: router({
    basic: protectedProcedure.input(querySchema).mutation(...),
    withSynthesis: protectedProcedure.input(queryWithSynthesisSchema).mutation(...),
    deep: protectedProcedure.input(deepQuerySchema).mutation(...),
  }),

  metrics: router({
    costs: adminProcedure.input(dateRangeSchema).query(...),
    trend: adminProcedure.input(...).query(...),
    currentSpend: adminProcedure.query(...),
  }),

  admin: router({
    listAllStores: superAdminProcedure.input(...).query(...),
    clearCache: superAdminProcedure.mutation(...),
    invalidateStoreCache: superAdminProcedure.input(...).mutation(...),
  }),
});

// Client usage: trpc.rag.stores.list.useQuery()
// Client usage: trpc.rag.query.deep.useMutation()
```

### Example 11: Audit Logging Pattern

```typescript
// Standard pattern used across all routers
export const myRouter = router({
  create: adminProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await myService.create(ctx.venture!.id, input);

      // Audit log with full context
      await auditService.log({
        action: 'my-domain.create',
        userId: ctx.session.userId,
        ventureId: ctx.venture?.id,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        resourceType: 'my-domain',
        resourceId: result.id,
        metadata: {
          name: input.name,
          // Include relevant fields for audit trail
        },
      });

      return result;
    }),
});
```

### Example 12: Public Procedure with Venture Resolution

```typescript
// Pattern for public procedures that need to resolve a venture (e.g., booking pages)
export const calendarRouter = router({
  publicGetSlots: publicProcedure
    .input(publicSlotsSchema)
    .query(async ({ input }) => {
      // No auth — resolve venture from the booking page slug
      const [page] = await db
        .select()
        .from(bookingPages)
        .where(
          and(
            eq(bookingPages.slug, input.slug),
            eq(bookingPages.isActive, true)
          )
        )
        .limit(1);

      if (!page) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Booking page not found',
        });
      }

      // Use the venture from the booking page
      return availabilityService.getAvailableSlots(
        page.calendarId,
        input.startDate,
        input.endDate,
        input.duration,
        input.timezone
      );
    }),
});
```

### Example 13: HITL (Human-in-the-Loop) Approval Flow

```typescript
// Agent creates an approval request
const approval = await trpc.hitl.create.mutate({
  taskId: 'task-uuid',
  agentId: 'agent_queen_001',
  approvalType: 'action_execution',
  title: 'Deploy to production',
  description: 'Agent wants to deploy v2.1.0 to production servers',
  proposedAction: { type: 'deploy', version: '2.1.0', target: 'production' },
  alternatives: [
    { type: 'deploy', version: '2.1.0', target: 'staging' },
  ],
  riskAssessment: { level: 'high', reason: 'Production deployment' },
  priority: 'high',
  expiresInMinutes: 60,
  autoApproveAfterMinutes: 120,
  ventureId: 'venture-uuid',
});

// Human reviewer resolves
await trpc.hitl.resolve.mutate({
  id: approval.id,
  decision: 'approved',
  reason: 'Reviewed and approved for production',
  modifications: null,
});

// Check pending count for badge
const { count } = await trpc.hitl.pendingCount.query();
```

### Example 14: Lazy-Loading Services Pattern

```typescript
// Used in catalog.router.ts — services loaded on demand to avoid import side effects
function getServices() {
  const catalog = require('@mcv/catalog/server');
  return {
    product: catalog.productService as import('@mcv/catalog/server').ProductService,
    category: catalog.categoryService as import('@mcv/catalog/server').CategoryService,
    discount: catalog.discountService as import('@mcv/catalog/server').DiscountService,
    inventory: catalog.inventoryService as import('@mcv/catalog/server').InventoryService,
    priceRule: catalog.priceRuleService as import('@mcv/catalog/server').PriceRuleService,
    collection: catalog.collectionService as import('@mcv/catalog/server').CollectionService,
  };
}

// Helper to validate venture context
function requireVentureId(ctx: any): string {
  if (!ctx.venture?.id) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Venture context required' });
  }
  return ctx.venture.id;
}
```

### Example 15: Paginated Response Pattern

```typescript
import { calculateOffset, buildPaginatedResponse } from '@mcv/api';

// Standard paginated query pattern
export const myRouter = router({
  list: ventureProcedure
    .input(z.object({
      ...offsetPaginationSchema.shape,
      status: z.enum(['active', 'archived']).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const conditions: SQL<unknown>[] = [
        eq(myTable.ventureId, ctx.venture.id),
      ];

      if (input.status) conditions.push(eq(myTable.status, input.status));

      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        db.select()
          .from(myTable)
          .where(whereClause)
          .orderBy(desc(myTable.createdAt))
          .limit(input.pageSize)
          .offset(calculateOffset(input.page, input.pageSize)),
        db.select({ count: sql<number>`count(*)::int` })
          .from(myTable)
          .where(whereClause),
      ]);

      const total = countResult[0]?.count || 0;
      return buildPaginatedResponse(items, total, input.page, input.pageSize);
    }),
});

// Response shape:
// {
//   items: [...],
//   meta: {
//     total: 42,
//     page: 1,
//     pageSize: 20,
//     totalPages: 3,
//     hasMore: true,
//     hasPrevious: false,
//   }
// }
```

---

## Security

### Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Client   │────▶│  tRPC Handler│────▶│ createContext │────▶│ Better Auth  │
│           │     │              │     │              │     │ getSession() │
│  Cookie:  │     │ Extract      │     │ Verify       │     │              │
│  session  │     │ headers      │     │ session      │     │ Validate     │
│  token    │     │              │     │ Load user    │     │ cookie/token │
└──────────┘     └──────────────┘     │ Load venture │     └──────────────┘
                                       │ Load perms   │
                                       └──────────────┘
```

**Session verification happens once per request** during context creation. All procedures receive the pre-verified context — no redundant auth checks.

### Authorization Tiers

The permission system uses a **4-tier hierarchy**:

| Tier | Role | Capabilities |
|------|------|-------------|
| **0** | Super Admin | Full system access, cross-venture operations, model config, platform settings |
| **1** | Venture Admin | Full access within their venture, user management, settings |
| **2** | Member | Standard access based on role permissions within venture |
| **3** | Guest | Limited read-only access per role assignment |

### RBAC Permission Checks

Granular permissions are checked via `@mcv/permissions`:

```typescript
// checkPermission() resolves against the user's role grants
const result = await checkPermission({
  userId: ctx.session.userId,
  organizationId: ctx.venture?.id,
  resource: 'calendars',    // Resource namespace
  action: 'create',         // CRUD action
});

// result: { allowed: boolean, reason?: string }
```

### Input Validation

**Every endpoint** uses Zod schemas for input validation:

- Type coercion (strings to dates via `z.coerce.date()`)
- Bounds checking (`z.number().min(0).max(100)`)
- Pattern validation (`z.string().regex(...)`)
- Enum constraints (`z.enum([...])`)
- Nested object validation
- Array length limits (`.min(1).max(100)`)
- UUID format enforcement (`z.string().uuid()`)

Validation errors are automatically formatted and include flattened field errors:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "data": {
      "zodError": {
        "fieldErrors": {
          "email": ["Invalid email address"],
          "password": ["Password must be at least 8 characters"]
        },
        "formErrors": []
      }
    }
  }
}
```

### Rate Limiting Strategy

| Endpoint Category | Preset | Limit | Key | Rationale |
|------------------|--------|-------|-----|-----------|
| Login / Signup | `auth` | 5/min | IP | Prevent brute force |
| Password reset confirm | `strict` | 3/min | IP | Prevent token guessing |
| Public API (no auth) | `public` | 50/min | IP | Prevent abuse |
| Authenticated API | `general` | 100/min | User ID | Fair use enforcement |
| High-throughput (e.g., analytics) | `relaxed` | 500/min | User ID | Allow intensive usage |

### Agent Authentication

AI agents authenticate via HTTP headers:

```
x-agent-id: agent_queen_001    # Required — agent identifier
x-agent-key: secret_key        # Optional — for production API key validation
```

The `isAgent` middleware validates the `x-agent-id` header and constructs an `AgentContext` with the agent's metadata. In production, this validates against the `ai_agents` database table.

---

## Error Codes

### tRPC Error Codes

| Code | HTTP Status | When Used |
|------|-------------|-----------|
| `BAD_REQUEST` | 400 | Invalid input, missing venture context |
| `UNAUTHORIZED` | 401 | No session, expired session |
| `FORBIDDEN` | 403 | Insufficient permissions, suspended account, budget exceeded |
| `NOT_FOUND` | 404 | Resource not found |
| `METHOD_NOT_SUPPORTED` | 405 | Deprecated endpoint (migrated to Better Auth) |
| `CONFLICT` | 409 | Duplicate resource (e.g., existing model config) |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Database unavailable, unexpected errors |

### Custom Error Patterns

```typescript
// Resource not found
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Product not found',
});

// Venture context required
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: 'Venture context required. Please select a venture.',
});

// Budget exceeded (Gateway)
throw new TRPCError({
  code: 'FORBIDDEN',
  message: 'LLM budget exceeded for this venture',
  cause: error, // Original GatewayBudgetError
});

// Rate limited
throw new TRPCError({
  code: 'TOO_MANY_REQUESTS',
  message: 'Too many authentication attempts. Please try again later.',
  cause: {
    retryAfter: result.retryAfter,
    limit: result.limit,
    current: result.current,
    resetIn: result.resetIn,
  },
});

// Deprecated endpoint
throw new TRPCError({
  code: 'METHOD_NOT_SUPPORTED',
  message: 'This endpoint is deprecated. Use authClient.twoFactor.enable()',
});

// Approval already resolved
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: `Approval already ${existing.status}`,
});
```

---

## Performance Considerations

### Request Lifecycle Cost

| Phase | Typical Latency | Notes |
|-------|----------------|-------|
| Context creation | 5–20ms | Better Auth session verify + DB lookups (venture, permissions) |
| Logger middleware | <1ms | Structured log writes are async/buffered |
| Rate limit check | <1ms | In-memory Map lookup and timestamp comparison |
| Auth middleware | <1ms | Context field checks (already resolved) |
| Input validation | 1–5ms | Zod parsing (depends on schema complexity) |
| Router handler | 5–500ms | Business logic + database queries |
| SuperJSON serialization | 1–5ms | Transform response for wire format |

### Optimization Strategies

1. **Parallel context loading** — Venture and permissions are loaded concurrently after session verification
2. **Lazy service imports** — Catalog services use `require()` to avoid cold-start import chains
3. **In-memory rate limiting** — No Redis round-trip for rate limit checks (trades consistency for speed)
4. **Cursor pagination** — Available alongside offset pagination for large datasets
5. **Batch operations** — Bulk update/delete endpoints accept up to 100 IDs per request
6. **SuperJSON transformer** — Handles Date/BigInt serialization without manual conversion
7. **Automatic cleanup** — Rate limiter cleans stale entries every 60 seconds (entries expire after 5 min inactivity)

### Scaling Considerations

- **Rate limiter** uses in-memory `Map` — not shared across multiple server instances. For horizontal scaling, swap to Redis adapter.
- **Session verification** calls Better Auth on every request — consider caching sessions for high-throughput scenarios.
- **Context creation** makes 2–3 DB queries per request (session, venture, permissions) — these can be cached per-session.
- **tRPC batching** — The `httpBatchLink` client automatically batches concurrent queries into a single HTTP request.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (via `@mcv/db`) |
| `BETTER_AUTH_SECRET` | Yes | — | Better Auth signing secret (via `@mcv/auth`) |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Application URL for email links |
| `APP_URL` | No | `http://localhost:3000` | Server-side application URL |
| `NODE_ENV` | No | `development` | Controls error stack trace exposure |
| `OPENROUTER_API_KEY` | Yes* | — | OpenRouter API key (for gateway router) |
| `STRIPE_SECRET_KEY` | Yes* | — | Stripe secret key (for payments router) |
| `STRIPE_WEBHOOK_SECRET` | Yes* | — | Stripe webhook signing secret |
| `TWILIO_ACCOUNT_SID` | Yes* | — | Twilio account SID (for twilio router) |
| `TWILIO_AUTH_TOKEN` | Yes* | — | Twilio auth token |
| `SENDGRID_API_KEY` | Yes* | — | SendGrid API key (for email router) |
| `GOOGLE_CLIENT_ID` | Yes* | — | Google OAuth client ID (for calendar sync) |
| `GOOGLE_CLIENT_SECRET` | Yes* | — | Google OAuth client secret |

*Required only if the corresponding feature router is used.

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@trpc/server` | ^11.0.0-rc.446 | tRPC server framework |
| `superjson` | ^2.2.6 | Date/Map/Set/BigInt serialization transformer |
| `zod` | ^4.3.6 | Runtime schema validation |
| `date-fns` | ^4.1.0 | Date manipulation utilities |
| `jose` | ^5.2.0 | JWT signing and verification |
| `nanoid` | ^5.0.7 | Compact unique ID generation |
| `stripe` | ^14.0.0 | Stripe payment processing |
| `viem` | ^2.45.0 | Ethereum wallet signature verification |
| `otpauth` | ^9.2.2 | TOTP one-time password generation/verification |
| `uuid` | ^9.0.0 | UUID generation |
| `trpc-to-openapi` | ^3.1.0 | OpenAPI spec generation from tRPC routers |
| `@google-cloud/secret-manager` | ^6.1.1 | GCP secret management |

### Internal Dependencies (Workspace)

| Package | Purpose |
|---------|---------|
| `@mcv/db` | Drizzle ORM database client, schema, and query builders |
| `@mcv/auth` | Better Auth configuration and session management |
| `@mcv/permissions` | RBAC permission loading and checking |
| `@mcv/logger` | Structured logging (Pino-based) |
| `@mcv/gateway` | LLM gateway (OpenRouter) — tier routing, budget, usage |
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

## Utility Modules

### Pagination (`utils/pagination.ts`)

```typescript
// Offset-based pagination
export function calculatePaginationMeta(total: number, page: number, pageSize: number): PaginationMeta;
export function calculateOffset(page: number, pageSize: number): number;
export function buildPaginatedResponse<T>(items: T[], total: number, page: number, pageSize: number): PaginatedResponse<T>;

// Cursor-based pagination
export function encodeCursor(value: string | number | Date): string;    // Base64URL encoding
export function decodeCursor(cursor: string): string;                   // Base64URL decoding
export function buildCursorPaginatedResponse<T extends { id: string }>(items: T[], limit: number, cursorField?: keyof T): CursorPaginatedResponse<T>;
```

### JWT (`utils/jwt.ts`)

```typescript
export function signJWT(payload: JWTPayload, options?: SignJWTOptions): Promise<string>;
export function verifyRefreshToken(token: string): Promise<boolean>;
export function hashRefreshToken(token: string): string;
export function createRefreshToken(): string;
export const ACCESS_TOKEN_EXPIRY: string;
export const ACCESS_TOKEN_EXPIRY_MS: number;
```

### Crypto (`utils/crypto.ts`)

```typescript
export function hashPassword(password: string): Promise<string>;
export function verifyPassword(password: string, hash: string): Promise<boolean>;
export function generateSecureToken(): string;
```

### Cookies (`utils/cookies.ts`)

Cookie helpers for session management (HttpOnly, Secure, SameSite).

### OAuth (`utils/oauth.ts`)

OAuth flow helpers for provider integrations.

### Response (`utils/response.ts`)

```typescript
export interface SuccessResponse<T> {
  success: true;
  data: T;
}
```

---

## File Structure

```
packages/api/src/
├── index.ts                          # Root exports (AppRouter, types, schemas, services)
├── trpc/
│   ├── index.ts                      # Re-exports all tRPC utilities
│   ├── init.ts                       # tRPC initialization (SuperJSON + Zod error formatting)
│   ├── context.ts                    # Context creation (Session, User, Venture, Permissions)
│   └── procedures.ts                 # 10+ procedure types + middleware definitions
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
│   ├── hitl.router.ts                # HITL approval queue
│   ├── agent-tasks.router.ts         # AI agent task operations
│   ├── intelligence.router.ts        # Intelligence layer
│   ├── workflow.router.ts            # Workflow automation engine
│   ├── ... (52 more router files)
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
│   ├── auth.service.ts               # Auth business logic (legacy)
│   ├── intelligence.service.ts       # Intelligence layer (50KB)
│   ├── workflow-engine.ts            # Graph workflow engine (102KB)
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

# Generate OpenAPI spec from tRPC routers
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
    expect(result.venture).toEqual(mockVenture);
  });
});
```

---

## Design Decisions

### Why tRPC v11 (Not REST/GraphQL)?

1. **End-to-end type safety** — No codegen, no schema drift. Client types are inferred directly from server router definitions.
2. **Zod integration** — Input validation + TypeScript types from a single source of truth.
3. **SuperJSON** — Rich type serialization (Date, BigInt, Map, Set) without manual conversion.
4. **React Query integration** — `createTRPCReact` provides hooks with automatic cache management.
5. **Batching** — `httpBatchLink` combines concurrent queries into a single HTTP request.
6. **Server components** — `createCallerFactory` enables zero-overhead procedure calls in RSC.

### Why a Single AppRouter?

All 61 routers are merged into one `appRouter` because:

1. **Single `AppRouter` type** — One type import gives the client access to all endpoints
2. **Shared context** — All procedures receive the same context creation logic
3. **Consistent middleware** — Logger and auth run uniformly
4. **Selective mounting** — Individual routers are exported for micro-services or testing

### Why In-Memory Rate Limiting?

The `SlidingWindowRateLimiter` uses a `Map` instead of Redis because:

1. **Zero latency** — No network round-trip for rate checks
2. **Sufficient for single-process** — MCV currently runs on a single Next.js instance
3. **Swappable** — The `rateLimiter` instance can be replaced with a Redis adapter when needed
4. **Automatic cleanup** — Stale entries are cleaned every 60s to prevent memory leaks

### Why Better Auth (Not NextAuth/Lucia)?

1. **Organization/tenant plugin** — Built-in multi-tenancy via `activeOrganizationId` on sessions
2. **Passkey support** — Native WebAuthn/FIDO2 without additional packages
3. **API-first** — `auth.api.getSession()` works in any context (not just Next.js)
4. **Session management** — `revokeOtherSessions`, `listSessions` out of the box

---

## Migration Notes

### Better Auth Migration (In Progress)

Several auth endpoints are marked `@deprecated` as the platform migrates from custom JWT auth to Better Auth:

```typescript
// These endpoints now delegate to Better Auth or throw METHOD_NOT_SUPPORTED:
auth.login          // → authClient.signIn.email()
auth.signup         // → authClient.signUp.email()
auth.refresh        // → Better Auth handles via cookies
auth.completeMfaLogin // → authClient.twoFactor.verify()
auth.enableMfa      // → authClient.twoFactor.enable()
auth.verifyMfa      // → authClient.twoFactor.verify()
auth.disableMfa     // → authClient.twoFactor.disable()
```

**Active endpoints** (not deprecated):
- `auth.me` — Session introspection
- `auth.logout` / `auth.logoutAll` — Session termination
- `auth.changePassword` — Password update
- `auth.sessions` / `auth.revokeSession` — Session management
- `auth.switchVenture` — Venture context switching
- `auth.walletNonce` / `auth.walletVerify` — Web3 wallet auth (hybrid approach)

---

## Related Modules

| Module | Relationship |
|--------|-------------|
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
