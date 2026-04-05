# Tier 6: Presentation — Technical Architecture

| Field              | Value                                           |
| ------------------ | ----------------------------------------------- |
| **Tier**           | 6 — Presentation                                |
| **Classification** | INTERNAL                                        |
| **Packages**       | `@mcv/api`, `@mcv/apps`, `@mcv/ui`             |
| **Framework**      | Next.js 15, tRPC v11, HeroUI, Tailwind CSS     |
| **Build System**   | Turborepo                                       |
| **Last Updated**   | February 2026                                   |

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Sub-Package Architecture](#sub-package-architecture)
   - [3.1 @mcv/api — tRPC API Layer](#31-mcvapi--trpc-api-layer)
   - [3.2 @mcv/apps — Next.js Applications](#32-mcvapps--nextjs-applications)
   - [3.3 @mcv/ui — Component Library](#33-mcvui--component-library)
4. [Shared Patterns](#shared-patterns)
5. [Build & Bundling](#build--bundling)
6. [Performance Architecture](#performance-architecture)
7. [Security Architecture](#security-architecture)
8. [Observability](#observability)
9. [Deployment Pipeline](#deployment-pipeline)

---

## 1. Architecture Overview

Tier 6 is the **presentation layer** — the top of the MCV.ONE six-tier stack. It is responsible for everything the user sees and interacts with: the API surface that serves data, the Next.js applications that render pages, and the component library that provides the visual building blocks.

### Architectural Principles

| Principle | Description |
|-----------|-------------|
| **Server-first rendering** | React Server Components by default; client components only for interactivity |
| **Type-safe end-to-end** | Zod schemas → tRPC → TypeScript → React props — zero `any` in the chain |
| **Thin presentation** | Pages are composites; business logic lives in Tier 5 domain services |
| **Multi-tenant by default** | Every request, every component, every route is venture-aware |
| **Edge-first middleware** | Auth, rate limiting, and security headers run at the Edge |
| **Feature-sliced design** | Self-contained feature modules with private components, hooks, and types |
| **Monorepo-native** | Turborepo caching and dependency graph drive the build pipeline |

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 15.0.7 | Full-stack React framework (App Router) |
| API | tRPC | v11 | Type-safe RPC (61 routers) |
| State (server) | React Query | v5 | Server state caching and sync |
| State (client) | Zustand | v5 | Client state management (10 stores) |
| Components | HeroUI | v2 | Component library foundation |
| Styling | Tailwind CSS | v3 | Utility-first CSS |
| Animation | Framer Motion | v11 | Physics-based animations |
| Validation | Zod | v3 | Runtime schema validation |
| Serialization | SuperJSON | v2 | Enhanced JSON (Date, Map, Set, BigInt) |
| Auth | Better Auth | — | Session management, OAuth, MFA, passkeys |
| Icons | Lucide React | — | Icon library |
| URL State | nuqs | — | Type-safe URL query parameters |
| Build | Turborepo | — | Monorepo build orchestration |

---

## 2. System Diagram

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USERS & AGENTS                               │
│                                                                         │
│  Browser (admin.mcv.one)  │  Hono Edge Workers  │  AI Agents (x-agent) │
└────────────────┬──────────┴──────────┬──────────┴──────────┬───────────┘
                 │                     │                     │
                 ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EDGE MIDDLEWARE LAYER                            │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Security │  │  Rate    │  │ Session  │  │  Route   │  │ Venture │ │
│  │ Headers  │  │ Limiting │  │ Validate │  │ Protect  │  │ Resolve │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       └──────────────┴──────────────┴──────────────┴──────────────┘     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           @mcv/apps                                     │
│                     (Next.js 15 App Router)                             │
│                                                                         │
│  ┌──────────────────────┐  ┌──────────────────────┐                    │
│  │    SERVER LAYER       │  │    CLIENT LAYER       │                    │
│  │                      │  │                      │                    │
│  │  Layouts (5 deep)    │  │  Zustand (10 stores) │                    │
│  │  RSC Pages (169)     │  │  React Query cache   │                    │
│  │  Server Actions      │  │  Client components   │                    │
│  │  Route Handlers (75) │  │  Command Palette     │                    │
│  └──────────┬───────────┘  └──────────┬───────────┘                    │
│             │                         │                                 │
│             ▼                         ▼                                 │
│  ┌─────────────────────────────────────────────────┐                   │
│  │              PROVIDER TREE                       │                   │
│  │  QueryClient → tRPC → Auth → Theme → Venture   │                   │
│  └──────────────────────┬──────────────────────────┘                   │
└─────────────────────────┼───────────────────────────────────────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
┌───────────────┐ ┌─────────────┐ ┌───────────────┐
│   @mcv/api    │ │  @mcv/ui    │ │ Server Actions│
│               │ │             │ │               │
│ tRPC Router   │ │ Components  │ │ Direct calls  │
│ (61 merged)   │ │ (508)       │ │ to services   │
│               │ │             │ │               │
│ Middleware:   │ │ Theming:    │ │ Form actions  │
│  • Logger     │ │  • Tokens   │ │ Mutations     │
│  • Rate Limit │ │  • Ventures │ │ Revalidation  │
│  • Auth       │ │  • Dark/Lgt │ │               │
│               │ │             │ │               │
│ Services (68) │ │ Patterns    │ │               │
│ Schemas (42)  │ │ (85)        │ │               │
└───────┬───────┘ └─────────────┘ └───────┬───────┘
        │                                 │
        └─────────────┬───────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         TIERS 0–5                                       │
│                                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐       │
│  │ @mcv/db │ │@mcv/auth│ │@mcv/perm│ │ @mcv/ai │ │@mcv/flags│       │
│  │ Drizzle │ │Better   │ │ RBAC    │ │ LLM/    │ │ Feature  │       │
│  │ Postgres│ │Auth     │ │ Gates   │ │ Agents  │ │ Flags    │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └──────────┘       │
│                                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │@mcv/store│ │@mcv/audit│ │@mcv/notif│ │@mcv/gatew│ │@mcv/kernel │ │
│  │ S3/Supa  │ │ Logging  │ │ Push/SMS │ │ AI Route │ │ Types/Util │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

```
1. HTTP Request arrives at Vercel Edge
        │
2. Edge Middleware pipeline:
   ├─► Apply security headers (CSP, HSTS, X-Frame-Options)
   ├─► Check rate limits (sliding window → Upstash Redis)
   ├─► Validate session (Better Auth cookie → session lookup)
   ├─► Resolve route protection (public vs protected matcher)
   ├─► Inject venture context (from session.activeVentureId)
   └─► Attach request ID + logging metadata
        │
3. Next.js App Router resolves route:
   ├─► Static route → served from Edge cache
   ├─► Dynamic route → render pipeline
   └─► API route → tRPC handler
        │
4a. PAGE RENDER (RSC):
   ├─► Layout chain renders (root → auth → dashboard → section → page)
   ├─► Server Components fetch data via tRPC caller (server-side)
   ├─► Streaming sends HTML chunks with Suspense boundaries
   ├─► Client Components hydrate with React Query cache
   └─► Page interactive
        │
4b. API CALL (tRPC):
   ├─► tRPC adapter parses request (GET query / POST mutation)
   ├─► Middleware chain: logger → rate limit → auth → permission
   ├─► Input validation (Zod schema)
   ├─► Service class executes business logic
   ├─► Response serialized via SuperJSON
   └─► JSON response returned
```

---

## 3. Sub-Package Architecture

### 3.1 @mcv/api — tRPC API Layer

#### Directory Structure

```
packages/api/src/
├── index.ts                    # Root export (appRouter, types, schemas)
├── trpc/
│   ├── index.ts                # tRPC init, context, procedures
│   ├── context.ts              # createContext, createFetchContext
│   ├── procedures.ts           # 14+ procedure type definitions
│   └── transformer.ts          # SuperJSON configuration
├── routers/
│   ├── index.ts                # appRouter merge (61 routers)
│   ├── auth.router.ts          # Authentication & identity
│   ├── mfa.router.ts           # Multi-factor authentication
│   ├── passkey.router.ts       # WebAuthn/FIDO2
│   ├── wallet.router.ts        # Web3 wallet auth
│   ├── users.router.ts         # User management
│   ├── roles.router.ts         # Role management
│   ├── ventures.router.ts      # Venture CRUD
│   ├── contacts.router.ts      # CRM contacts
│   ├── deals.router.ts         # CRM deals/pipeline
│   ├── tasks.router.ts         # Task management
│   ├── gateway.router.ts       # AI Gateway
│   ├── rag.router.ts           # RAG queries
│   ├── invoicing.router.ts     # Invoice management
│   ├── catalog.router.ts       # Product catalog
│   ├── workflows.router.ts     # Workflow engine
│   ├── calendar.router.ts      # Calendar/scheduling
│   ├── ...                     # (61 routers total)
│   └── branding.router.ts      # Venture branding
├── schemas/
│   ├── index.ts                # All schema exports
│   ├── auth.schema.ts          # Auth input schemas
│   ├── users.schema.ts         # User input schemas
│   ├── ventures.schema.ts      # Venture input schemas
│   ├── ...                     # (42 schema modules)
│   └── common.schema.ts        # Shared pagination, filter schemas
├── services/
│   ├── index.ts                # All service exports
│   ├── auth.service.ts         # Auth business logic
│   ├── users.service.ts        # User business logic
│   ├── ventures.service.ts     # Venture business logic
│   ├── ...                     # (68 service classes)
│   └── analytics.service.ts    # Analytics aggregation
├── middleware/
│   ├── index.ts                # Middleware exports
│   ├── logger.ts               # Request/response logging
│   └── rate-limiter.ts         # Sliding window rate limiter
├── types/
│   ├── index.ts                # Type exports
│   ├── context.ts              # Context, Session, User types
│   └── responses.ts            # Standard response types
├── utils/
│   ├── pagination.ts           # Offset + cursor pagination
│   ├── jwt.ts                  # JWT sign/verify
│   ├── crypto.ts               # Password hashing, token generation
│   └── cookies.ts              # Cookie helpers
└── openapi/
    └── index.ts                # OpenAPI 3.0 spec generation
```

#### Router Architecture

The `appRouter` is the single entry point for all API calls. It merges 61 domain routers into one type-safe namespace:

```typescript
export const appRouter = router({
  // Authentication & Identity
  auth: authRouter,
  mfa: mfaRouter,
  passkey: passkeyRouter,
  wallet: walletRouter,
  users: usersRouter,
  roles: rolesRouter,

  // Multi-Tenancy & Access
  ventures: venturesRouter,
  ventureMembers: ventureMembersRouter,
  permissions: permissionsRouter,
  settings: settingsRouter,

  // AI & Intelligence
  gateway: gatewayRouter,
  rag: ragRouter,
  ai: aiRouter,
  intelligence: intelligenceRouter,
  hitl: hitlRouter,
  agentTasks: agentTasksRouter,
  workbench: workbenchRouter,

  // CRM & Contacts
  contacts: contactRouter,
  organizations: organizationRouter,
  deals: dealRouter,
  activities: activityRouter,
  crmV2: crmV2Router,
  entityGraph: entityGraphRouter,

  // Task & Project Management
  tasks: taskRouter,
  projects: projectRouter,
  sprints: sprintRouter,
  taskTemplates: taskTemplateRouter,
  timeEntries: timeEntryRouter,
  automationRules: automationRuleRouter,
  taskAnalytics: taskAnalyticsRouter,
  workflows: workflowRouter,

  // Communication
  conversations: conversationRouter,
  queues: queueRouter,
  twilio: twilioRouter,
  contactCenter: contactCenterRouter,

  // Commerce & Payments
  catalog: catalogRouter,
  invoicing: invoicingRouter,
  payments: paymentsRouter,
  forms: formRouter,

  // Content & Documents
  cms: cmsRouter,
  comments: commentsRouter,
  tags: tagsRouter,
  documentEditor: documentEditorRouter,

  // Operations & Monitoring
  audit: auditRouter,
  notifications: notificationsRouter,
  flags: flagsRouter,
  storage: storageRouter,
  stats: statsRouter,

  // Strategy & Finance
  portfolio: portfolioRouter,
  treasury: treasuryRouter,
  tokenEconomy: tokenEconomyRouter,
  strategy: strategyRouter,
  grantConcierge: grantConciergeRouter,

  // Marketing & Branding
  marketing: marketingRouter,
  branding: brandingRouter,
  reputation: reputationRouter,

  // Infrastructure
  analytics: analyticsRouter,
  webhooks: webhookRouter,
  integrations: integrationRouter,
  email: emailRouter,
  calendar: calendarRouter,
});

export type AppRouter = typeof appRouter;
```

#### Middleware Chain

Every tRPC procedure passes through a middleware chain. The chain is composable — each procedure type adds layers:

```
                         ┌───────────────────┐
                         │   t.procedure      │  Raw tRPC procedure
                         └─────────┬─────────┘
                                   │
                         ┌─────────▼─────────┐
                         │   baseProcedure    │  + loggerMiddleware
                         └─────────┬─────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               │                   │                   │
     ┌─────────▼─────────┐ ┌──────▼──────┐   ┌───────▼────────┐
     │  publicProcedure   │ │ protected   │   │ rateLimited    │
     │  (no auth)         │ │ Procedure   │   │ Public (50/min)│
     └───────────────────┘ │ + isAuth     │   └────────────────┘
                           └──────┬──────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼────────┐ ┌───────▼───────┐ ┌────────▼───────────┐
    │  adminProcedure   │ │ ventureProcedure│ │ permissionProcedure│
    │  + isAdmin        │ │ + hasVenture   │ │ + requirePermission│
    │  (Tier 0 or 1)    │ └───────────────┘ └────────────────────┘
    └─────────┬────────┘
              │
    ┌─────────▼────────┐
    │ superAdminProc.   │
    │  + isSuperAdmin   │
    │  (Tier 0 only)    │
    └──────────────────┘
```

#### Auth Middleware Implementation

```typescript
const isAuthenticated = middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user,
      permissions: ctx.permissions,
    },
  });
});

const isAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.session?.role || !['super_admin', 'venture_admin'].includes(ctx.session.role)) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});

const hasVentureContext = middleware(async ({ ctx, next }) => {
  if (!ctx.venture) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Venture context required. Switch to a venture first.',
    });
  }
  return next({ ctx: { venture: ctx.venture } });
});

const requirePermission = (resource: string, action: string) =>
  middleware(async ({ ctx, next }) => {
    const hasPermission = ctx.permissions?.check(resource, action);
    if (!hasPermission) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next({ ctx });
  });
```

#### Context Creation

The tRPC context is built fresh for every request:

```typescript
export async function createContext(headers: Headers): Promise<Context> {
  const requestId = headers.get('x-request-id') ?? crypto.randomUUID();
  const ip = headers.get('cf-connecting-ip')
    ?? headers.get('x-forwarded-for')
    ?? headers.get('x-real-ip')
    ?? null;
  const userAgent = headers.get('user-agent') ?? null;

  // Resolve session from Better Auth cookie
  const session = await resolveSession(headers);
  const user = session ? await resolveUser(session.userId) : null;
  const venture = session?.ventureId ? await resolveVenture(session.ventureId) : null;
  const permissions = user ? await resolvePermissions(user.id, venture?.id) : null;

  return {
    db,
    logger: createLogger({ requestId }),
    headers,
    requestId,
    ip,
    userAgent,
    session,
    user,
    venture,
    permissions,
  };
}
```

#### Rate Limiting Architecture

The sliding window rate limiter uses Upstash Redis for distributed state:

```typescript
// 5 presets for different endpoint categories
const RATE_LIMIT_PRESETS = {
  public:   { maxRequests: 50,  windowMs: 60_000 },   // 50/min per IP
  general:  { maxRequests: 100, windowMs: 60_000 },   // 100/min per user
  auth:     { maxRequests: 5,   windowMs: 60_000 },   // 5/min per IP
  strict:   { maxRequests: 3,   windowMs: 60_000 },   // 3/min per IP
  relaxed:  { maxRequests: 200, windowMs: 60_000 },   // 200/min per user
};

// Key generation
function createRateLimitKey(identifier: string, preset: string): string {
  return `rl:${preset}:${identifier}`;
}

// Sliding window algorithm
class SlidingWindowRateLimiter {
  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Atomic Redis pipeline:
    // 1. Remove expired entries
    // 2. Count current entries
    // 3. Add new entry if within limit
    // 4. Set TTL
    const [, count] = await redis
      .pipeline()
      .zremrangebyscore(key, 0, windowStart)
      .zcard(key)
      .zadd(key, { score: now, member: `${now}:${crypto.randomUUID()}` })
      .expire(key, Math.ceil(config.windowMs / 1000))
      .exec();

    return {
      allowed: count < config.maxRequests,
      current: count,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - count),
      resetIn: Math.ceil(config.windowMs / 1000),
    };
  }
}
```

---

### 3.2 @mcv/apps — Next.js Applications

#### Directory Structure

```
apps/admin/
├── app/
│   ├── layout.tsx                 # Root layout (providers, fonts, metadata)
│   ├── not-found.tsx              # 404 page
│   ├── error.tsx                  # Global error boundary
│   ├── (auth)/
│   │   ├── layout.tsx             # Auth layout (centered, minimal)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── verify/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Dashboard layout (MCVShell + sidebar)
│   │   ├── page.tsx               # Mission Control (/)
│   │   ├── admin/                 # 40 admin pages
│   │   │   ├── layout.tsx
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── ventures/
│   │   │   ├── flags/
│   │   │   ├── audit/
│   │   │   └── ...
│   │   ├── ai-command/            # 8 AI pages
│   │   ├── crm/                   # 9 CRM pages
│   │   ├── portfolio/             # 6 portfolio pages
│   │   ├── invoicing/             # 8 invoicing pages
│   │   ├── catalog/               # 5 catalog pages
│   │   ├── strategy/              # 4 strategy pages
│   │   ├── settings/              # 9 settings pages
│   │   ├── documents/             # 4 document pages
│   │   ├── tasks/                 # 3 task pages
│   │   ├── workflows/             # 2 workflow pages
│   │   ├── cms/                   # 5 CMS pages
│   │   ├── v/[ventureSlug]/       # 9 venture-scoped pages
│   │   └── ...                    # (169 pages total)
│   ├── (public)/
│   │   ├── layout.tsx             # Public layout (no auth)
│   │   ├── portfolio/page.tsx
│   │   └── portfolio/[slug]/page.tsx
│   └── api/
│       ├── trpc/[...trpc]/route.ts  # tRPC HTTP handler
│       ├── auth/[...all]/route.ts   # Better Auth routes
│       ├── webhooks/stripe/route.ts # Stripe webhooks
│       └── ...                      # (75 route handlers)
├── features/                      # Feature-Sliced Design modules (35)
│   ├── mission-control/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   ├── crm/
│   ├── invoicing/
│   ├── ai-command/
│   ├── portfolio/
│   ├── task-management/
│   └── ...
├── stores/                        # Zustand stores (10)
│   ├── navigation.store.ts
│   ├── auth.store.ts
│   ├── crm.store.ts
│   ├── ai-command.store.ts
│   ├── portfolio.store.ts
│   ├── command-palette.store.ts
│   ├── notifications.store.ts
│   ├── settings.store.ts
│   ├── realtime.store.ts
│   └── theme.store.ts
├── lib/
│   ├── trpc.ts                    # tRPC client configuration
│   ├── auth.ts                    # Auth client utilities
│   ├── env.ts                     # Environment validation
│   └── utils.ts                   # Shared utilities
├── providers/
│   ├── index.tsx                  # Provider composition
│   ├── query-provider.tsx         # React Query + tRPC
│   ├── auth-provider.tsx          # Auth context
│   ├── theme-provider.tsx         # Theme + venture context
│   └── realtime-provider.tsx      # WebSocket/SSE subscriptions
├── middleware.ts                   # Edge middleware
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind configuration
└── tsconfig.json                  # TypeScript configuration
```

#### App Router Strategy

##### Route Groups

The application uses four top-level route groups to organize pages by authentication context:

| Route Group | Auth | Layout | Purpose |
|-------------|------|--------|---------|
| `(auth)` | None | Centered, minimal | Login, register, password reset |
| `(dashboard)` | Required | MCVShell (sidebar + header) | Main application |
| `(public)` | None | Public layout | Portfolio showcase |
| `api` | Varies | None (JSON responses) | tRPC, webhooks, auth |

##### Layout Nesting

Layouts nest up to 5 levels deep, each adding progressive context:

```
root layout (level 1)
  └─► fonts, metadata, global providers, Toaster
      │
      (dashboard) layout (level 2)
        └─► MCVShell, sidebar, header, auth gate
            │
            /admin layout (level 3)
              └─► Admin sub-navigation, permission check
                  │
                  /admin/ventures layout (level 4)
                    └─► Venture context tabs
                        │
                        /admin/ventures/[id] layout (level 5)
                          └─► Entity detail shell
```

Each layout is a React Server Component that can fetch data directly:

```typescript
// app/(dashboard)/admin/ventures/layout.tsx
export default async function VenturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ventures = await caller.ventures.list();

  return (
    <div>
      <VenturesTabs ventures={ventures} />
      <Suspense fallback={<VenturesListSkeleton />}>
        {children}
      </Suspense>
    </div>
  );
}
```

#### React Server Components Strategy

##### RSC Decision Matrix

| Criterion | Server Component | Client Component |
|-----------|-----------------|-----------------|
| Data fetching | ✅ Direct DB/API access | ❌ Needs React Query |
| Interactivity | ❌ No event handlers | ✅ onClick, onChange, etc. |
| State | ❌ No useState/useEffect | ✅ Full React hooks |
| Bundle size | ✅ Zero JS to client | ⚠️ Adds to bundle |
| Streaming | ✅ Suspense boundaries | ⚠️ Hydration cost |
| Auth context | ✅ Server session | ✅ Client context |
| Forms | ✅ Server Actions | ✅ Controlled forms |

##### Server/Client Boundary Pattern

```typescript
// SERVER: Page shell (RSC) — fetches data, renders layout
// app/(dashboard)/crm/contacts/page.tsx
export default async function ContactsPage() {
  const contacts = await caller.contacts.list({ limit: 50 });
  const stats = await caller.contacts.stats();

  return (
    <div>
      <ContactsHeader stats={stats} />
      <Suspense fallback={<ContactTableSkeleton />}>
        <ContactsTableClient initialData={contacts} />
      </Suspense>
    </div>
  );
}

// CLIENT: Interactive table (needs hooks, events, state)
// features/crm/components/contacts-table-client.tsx
'use client';

export function ContactsTableClient({ initialData }: Props) {
  const { data, fetchNextPage } = trpc.contacts.list.useInfiniteQuery(
    { limit: 50 },
    { initialData, getNextPageParam: (last) => last.nextCursor }
  );

  return (
    <DataTable
      data={data?.pages.flatMap(p => p.items) ?? []}
      onRowClick={handleRowClick}
      onSort={handleSort}
    />
  );
}
```

#### Middleware Pipeline (Edge)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Content-Security-Policy', buildCSP());

  // 2. Request ID
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  response.headers.set('x-request-id', requestId);

  // 3. Session Validation
  const session = await validateSession(request);

  // 4. Route Protection
  if (isProtectedRoute(request.nextUrl.pathname) && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. Auth route redirect (already logged in)
  if (isAuthRoute(request.nextUrl.pathname) && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico|api/webhooks).*)'],
};
```

#### Provider Tree Architecture

The provider tree wraps the entire application, composing multiple contexts:

```typescript
// providers/index.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider>
        <AuthProvider>
          <ThemeProvider defaultTheme="dark">
            <VentureProvider>
              <RealtimeProvider>
                <Toaster />
                <CommandPalette />
                {children}
              </RealtimeProvider>
            </VentureProvider>
          </ThemeProvider>
        </AuthProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

Provider ordering matters — each depends on the ones above:

```
QueryClientProvider   (1)  React Query cache
  └─► TRPCProvider    (2)  tRPC client (needs QueryClient)
       └─► AuthProvider (3)  Auth state (needs tRPC for session)
            └─► ThemeProvider (4)  Theme context (needs auth for user prefs)
                 └─► VentureProvider (5)  Venture context (needs auth + theme)
                      └─► RealtimeProvider (6)  WebSocket (needs auth + venture)
```

#### Zustand Store Architecture

10 Zustand stores manage client-side state:

| Store | Purpose | Persistence | Key State |
|-------|---------|-------------|-----------|
| `navigation` | Sidebar, layer, breadcrumbs | `localStorage` | `layer`, `currentVenture`, `sidebarCollapsed` |
| `auth` | Auth UI modals, MFA state | Session | `showLoginModal`, `preferredAuthMethod` |
| `crm` | CRM view preferences | `localStorage` | `pipelineView`, `activeFilters` |
| `ai-command` | AI command center state | Session | `activeSwarm`, `hitlQueue` |
| `portfolio` | Portfolio view state | Session | `selectedVentures`, `healthView` |
| `command-palette` | Global search state | None | `isOpen`, `query`, `results` |
| `notifications` | Notification bell state | None | `unreadCount`, `notifications` |
| `settings` | User preferences | `localStorage` | `appearance`, `density`, `locale` |
| `realtime` | Connection status | None | `connected`, `channels`, `presence` |
| `theme` | Theme override state | `localStorage` | `mode`, `ventureOverride` |

---

### 3.3 @mcv/ui — Component Library

#### Directory Structure

```
packages/ui/src/
├── index.ts                       # Root export
├── components/
│   ├── primitives/                # 12 components
│   │   ├── Button.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   └── ...
│   ├── typography/                # 8 components
│   ├── layout/                    # 15 components
│   ├── surfaces/                  # 10 components
│   ├── forms/
│   │   ├── inputs/                # 18 components
│   │   ├── selects/               # 8 components
│   │   ├── pickers/               # 8 components
│   │   ├── editors/               # 6 components
│   │   └── ...
│   ├── data/
│   │   ├── tables/                # 12 components
│   │   ├── charts/                # 18 components
│   │   ├── metrics/               # 8 components
│   │   └── ...
│   ├── navigation/                # 44 components
│   ├── feedback/                  # 41 components
│   ├── overlays/                  # 29 components
│   └── specialized/
│       ├── auth/                  # 12 components
│       ├── commerce/              # 18 components
│       ├── finance/               # 10 components
│       ├── gaming/                # 12 components
│       ├── ai/                    # 8 components
│       ├── web3/                  # 12 components
│       ├── admin/                 # 15 components
│       └── ...                    # (16 specialized categories)
├── branding/
│   ├── tokens.ts                  # Design token definitions
│   ├── ThemeProvider.tsx           # Theme context + CSS var injection
│   ├── themes/
│   │   ├── mcv.ts                 # Base MCV theme
│   │   ├── betedge.ts             # BetEdge venture theme
│   │   ├── edgeiq.ts              # EdgeIQ venture theme
│   │   ├── mcvgg.ts               # MCVGG venture theme
│   │   ├── studio.ts              # Studio venture theme
│   │   ├── agency.ts              # Agency venture theme
│   │   └── sentinel.ts            # Sentinel venture theme
│   └── utils/
│       ├── apply-tokens.ts        # CSS variable injection
│       ├── color-scale.ts         # Color scale generation
│       └── contrast.ts            # Contrast ratio checking
├── patterns/
│   ├── admin/                     # Admin layout patterns (15)
│   │   ├── MCVShell.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminHeader.tsx
│   │   └── ...
│   ├── auth/                      # Auth flow patterns (12)
│   ├── commerce/                  # Commerce patterns (10)
│   ├── dashboards/                # Dashboard patterns (8)
│   ├── forms/                     # Form patterns (10)
│   ├── data/                      # Data display patterns (10)
│   ├── settings/                  # Settings patterns (8)
│   └── onboarding/                # Onboarding patterns (12)
├── hooks/
│   ├── useMediaQuery.ts
│   ├── useBreakpoint.ts
│   ├── useVenture.ts
│   ├── useTheme.ts
│   └── ...
└── utils/
    ├── cn.ts                      # Class name merge (clsx + twMerge)
    ├── variants.ts                # Tailwind Variants helpers
    └── accessibility.ts           # ARIA utilities
```

#### Component Architecture

##### Component Layers

```
┌─────────────────────────────────────────────────────┐
│  PATTERNS (85)                                       │
│  Pre-built composite UI flows                        │
│  MCVShell, LoginForm, DashboardCard, SettingsLayout │
├─────────────────────────────────────────────────────┤
│  SPECIALIZED (122)                                   │
│  Domain-specific compound components                 │
│  Leaderboard, InvoiceTable, AIChat, WalletButton    │
├─────────────────────────────────────────────────────┤
│  DATA DISPLAY (119) + FORMS (82)                     │
│  Data tables, charts, inputs, selects, editors       │
│  DataTable, LineChart, DatePicker, RichTextEditor    │
├─────────────────────────────────────────────────────┤
│  NAVIGATION (44) + FEEDBACK (41) + OVERLAYS (29)     │
│  Sidebar, Tabs, Alerts, Modals, Toasts, Drawers     │
├─────────────────────────────────────────────────────┤
│  FOUNDATION (71)                                     │
│  Primitives, typography, layout, surfaces            │
│  Button, Badge, Text, Grid, Card, Image             │
├─────────────────────────────────────────────────────┤
│  BRANDING                                            │
│  Design tokens, ThemeProvider, venture themes        │
│  tokens, ThemeProvider, betedgeTheme, etc.           │
└─────────────────────────────────────────────────────┘
```

##### Component API Standard

Every component follows a consistent API pattern:

```typescript
interface ComponentProps {
  // Visual
  variant?: 'solid' | 'outline' | 'ghost' | 'link' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';

  // State
  isDisabled?: boolean;
  isLoading?: boolean;
  isActive?: boolean;

  // Icons
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;

  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;

  // Styling
  className?: string;
  style?: React.CSSProperties;

  // Children
  children?: React.ReactNode;
}
```

##### Compound Components Pattern

Complex components use the compound pattern for composability:

```typescript
<DataTable data={users}>
  <DataTable.Toolbar>
    <DataTable.Search placeholder="Search users..." />
    <DataTable.Filters>
      <DataTable.Filter field="role" options={roles} />
    </DataTable.Filters>
  </DataTable.Toolbar>
  <DataTable.Header>
    <DataTable.Column field="name" sortable />
    <DataTable.Column field="email" sortable />
    <DataTable.Column field="role" filterable />
  </DataTable.Header>
  <DataTable.Body>
    {(row) => <DataTable.Row key={row.id}>...</DataTable.Row>}
  </DataTable.Body>
  <DataTable.Footer>
    <DataTable.Pagination />
  </DataTable.Footer>
</DataTable>
```

#### Theming Architecture

##### Token System

All visual properties are defined as design tokens that map to CSS custom properties:

```
Design Tokens (TypeScript)
        │
        ▼
CSS Custom Properties (applied by ThemeProvider)
        │
        ▼
Tailwind CSS Utilities (consume CSS vars)
        │
        ▼
Components (use Tailwind classes)
```

##### Token Scales

| Scale | Values | Example |
|-------|--------|---------|
| **Colors** | Primary, secondary, accent, semantic (50–950 shades) | `hsl(var(--primary-500))` |
| **Typography** | Fonts (4), sizes (11), weights (9), line heights (6) | `var(--font-sans)` |
| **Spacing** | 27 values (0–32) | `0.25rem` to `8rem` |
| **Radii** | 8 values (none–full) | `0.375rem` (md) |
| **Shadows** | 8 values (none–2xl + inner) | Box shadow presets |
| **Transitions** | 7 durations, 5 easings | `200ms ease-in-out` |
| **Breakpoints** | 7 values (xs–3xl) | `320px` to `1920px` |
| **Z-Indices** | 12 levels (hide–tooltip) | `1400` (modal) |

##### Venture Theme Override

Each venture extends the base theme. The `ThemeProvider` applies venture-specific CSS variables at runtime:

```typescript
function applyVentureTokens(root: HTMLElement, venture: VentureTheme) {
  // Override primary color scale
  Object.entries(venture.colors.primary).forEach(([shade, value]) => {
    root.style.setProperty(`--primary-${shade}`, value);
  });

  // Override fonts
  if (venture.typography?.fonts) {
    Object.entries(venture.typography.fonts).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });
  }

  // Apply component-level overrides via data attributes
  root.dataset.venture = venture.id;
}
```

#### Storybook Configuration

All 508 components are documented in Storybook with:

- **Stories** — Default, all variants, all sizes, all colors
- **Controls** — Interactive prop editing
- **Docs** — Auto-generated API documentation
- **Accessibility** — a11y addon for WCAG compliance checks
- **Interactions** — play functions for interaction testing
- **Themes** — Toggle between MCV base + all venture themes
- **Dark/Light** — Toggle between dark and light mode

---

## 4. Shared Patterns

### Data Fetching Patterns

#### Pattern 1: Server-Side Fetch (RSC)

```typescript
// Fastest path — data available at render time
export default async function VenturesPage() {
  const ventures = await caller.ventures.list();
  return <VenturesList ventures={ventures} />;
}
```

#### Pattern 2: Client-Side Fetch (React Query)

```typescript
// For interactive data that changes based on user actions
'use client';
export function ContactsView() {
  const { data, isLoading } = trpc.contacts.list.useQuery({
    limit: 50,
    status: 'active',
  });

  if (isLoading) return <ContactsSkeleton />;
  return <ContactsTable data={data} />;
}
```

#### Pattern 3: Hybrid (RSC + Client Hydration)

```typescript
// Server fetches initial data; client takes over for interactions
export default async function DashboardPage() {
  const stats = await caller.stats.overview();

  return (
    <div>
      <StatsGrid stats={stats} />                    {/* RSC */}
      <Suspense fallback={<ChartSkeleton />}>
        <RealtimeChartClient />                       {/* Client */}
      </Suspense>
    </div>
  );
}
```

#### Pattern 4: Infinite Scroll

```typescript
'use client';
export function ActivityFeed() {
  const { data, fetchNextPage, hasNextPage } =
    trpc.activities.list.useInfiniteQuery(
      { limit: 25 },
      { getNextPageParam: (last) => last.nextCursor }
    );

  return (
    <VirtualList
      items={data?.pages.flatMap(p => p.items) ?? []}
      onEndReached={() => hasNextPage && fetchNextPage()}
      renderItem={(item) => <ActivityCard activity={item} />}
    />
  );
}
```

### Error Handling Patterns

#### tRPC Error Codes

| Code | Meaning | UI Response |
|------|---------|-------------|
| `UNAUTHORIZED` | No valid session | Redirect to login |
| `FORBIDDEN` | Insufficient permissions | Show 403 page or toast |
| `NOT_FOUND` | Entity doesn't exist | Show 404 or empty state |
| `BAD_REQUEST` | Invalid input | Show field-level validation errors |
| `TOO_MANY_REQUESTS` | Rate limited | Show retry countdown toast |
| `INTERNAL_SERVER_ERROR` | Server error | Show error boundary with retry |
| `CONFLICT` | Duplicate/stale data | Show conflict resolution UI |

#### Error Boundary Hierarchy

```
Root Error Boundary (app/error.tsx)
  └─► Route Group Error (dashboard/error.tsx)
       └─► Section Error (admin/error.tsx)
            └─► Component Error (feature-level ErrorBoundary)
                 └─► Inline Error (per-widget RetryButton)
```

### State Management Patterns

| State Type | Tool | Scope | Example |
|------------|------|-------|---------|
| **Server state** | React Query (via tRPC) | Per-query, auto-cached | API data, lists, entities |
| **Client state** | Zustand | Per-store, some persisted | Navigation, preferences |
| **URL state** | nuqs | Per-URL, shareable | Filters, pagination, sort |
| **Form state** | React Hook Form | Per-form, ephemeral | Input values, validation |
| **Server state (RSC)** | Direct fetch | Per-render | Layout data, initial props |

---

## 5. Build & Bundling

### Turborepo Build Graph

```
                    ┌─────────────┐
                    │  @mcv/kernel │  Tier 1 (builds first)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ @mcv/db  │ │@mcv/confg│ │@mcv/store│  Tier 2
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │             │            │
             ▼             ▼            ▼
    ┌─────────────────────────────────────────┐
    │  @mcv/auth  @mcv/perm  @mcv/ai  ...    │  Tier 4
    └────────────────────┬────────────────────┘
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
     ┌───────────┐ ┌──────────┐ ┌──────────┐
     │  @mcv/api │ │ @mcv/ui  │ │@mcv/apps │  Tier 6 (builds last)
     │  (lib)    │ │  (lib)   │ │  (app)   │
     └───────────┘ └──────────┘ └──────────┘
```

### Code Splitting Strategy

| Strategy | Mechanism | Impact |
|----------|-----------|--------|
| **Route-based** | Next.js automatic per-route chunks | Each page loads only its code |
| **Feature-based** | `dynamic()` imports for feature modules | 35 modules lazy-loaded |
| **Component-based** | `dynamic()` for heavy components | Charts, editors, maps deferred |
| **Vendor splitting** | `next.config.ts` chunk optimization | HeroUI, Recharts, Monaco isolated |
| **CSS splitting** | Tailwind purge + per-route CSS | Only used classes ship |

### Bundle Analysis

| Chunk | Target Size | Contents |
|-------|-------------|----------|
| **Framework** | ~80KB | React, Next.js runtime |
| **Vendor** | ~60KB | Zustand, React Query, tRPC client |
| **HeroUI** | ~40KB | Used component styles |
| **App shell** | ~30KB | Layouts, providers, navigation |
| **Per-route** | ~10-30KB | Page-specific code |
| **Total initial** | < 200KB | First page load (gzipped) |

### Tree Shaking

- `@mcv/ui` exports are **individually importable** — `import { Button } from '@mcv/ui'` only includes Button
- HeroUI uses the `@heroui/*` scoped packages — each component is a separate package
- Tailwind CSS purges unused classes at build time
- SuperJSON `superjson/register` is only imported server-side

---

## 6. Performance Architecture

### Rendering Strategy

```
                         Request arrives
                              │
                    ┌─────────▼─────────┐
                    │  Route Type Check   │
                    └─────────┬─────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐    ┌───────▼───────┐   ┌──────▼──────┐
    │  Static    │    │   Dynamic     │   │    API      │
    │  (ISR)     │    │   (SSR/RSC)   │   │   (tRPC)    │
    │            │    │               │   │             │
    │ Cached at  │    │ Server render │   │ JSON resp.  │
    │ edge, re-  │    │ with streaming│   │ with cache  │
    │ validated   │    │ + Suspense   │   │ headers     │
    └────────────┘    └──────────────┘   └─────────────┘
```

### Performance Optimizations

| Optimization | Layer | Technique |
|-------------|-------|-----------|
| **RSC** | Rendering | Server-rendered HTML, zero JS for static content |
| **Streaming** | Rendering | Suspense boundaries stream HTML as data arrives |
| **Code splitting** | Bundle | Route, feature, and component-level splits |
| **Image optimization** | Assets | Next.js `Image` with AVIF/WebP, responsive sizes |
| **Font optimization** | Assets | `next/font` with preload and display swap |
| **Prefetching** | Navigation | `<Link>` prefetches on hover/viewport intersection |
| **React Query staleTime** | Data | Avoid refetches for recently fetched data (30s-5min) |
| **Virtual scrolling** | Rendering | VirtualList/VirtualTable for large datasets |
| **Debounced search** | Input | Search inputs debounced (300ms) before API calls |
| **Optimistic updates** | Mutations | UI updates immediately, rolls back on error |
| **Edge caching** | CDN | Static assets cached globally via Vercel Edge |
| **Redis caching** | API | Rate limit state and session lookups via Upstash |

### Core Web Vitals Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **LCP** (Largest Contentful Paint) | < 2.5s | RSC streaming, font preload, image optimization |
| **FID** (First Input Delay) | < 100ms | Minimal client JS, code splitting, deferred hydration |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Skeleton loaders, fixed-dimension layouts, font display |
| **TTFB** (Time To First Byte) | < 200ms | Edge runtime, ISR, connection pooling |
| **INP** (Interaction to Next Paint) | < 200ms | React transitions, concurrent features |

---

## 7. Security Architecture

### Defense in Depth

```
┌──────────────────────────────────────────────────────────┐
│  Layer 1: CDN / Edge                                      │
│  Cloudflare DDoS protection, WAF rules, bot detection     │
├──────────────────────────────────────────────────────────┤
│  Layer 2: Edge Middleware                                  │
│  Security headers, rate limiting, session validation       │
├──────────────────────────────────────────────────────────┤
│  Layer 3: tRPC Procedures                                 │
│  Auth middleware, permission checks, input validation      │
├──────────────────────────────────────────────────────────┤
│  Layer 4: Service Layer                                   │
│  Business rule validation, tenant isolation, audit         │
├──────────────────────────────────────────────────────────┤
│  Layer 5: Database                                        │
│  Row-level security, parameterized queries, encryption     │
└──────────────────────────────────────────────────────────┘
```

### Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Strict allow-list | Prevents XSS, data injection |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forces HTTPS |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer info |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Restricts browser APIs |
| `X-Request-ID` | UUID per request | Request tracing |

### Authentication Architecture

```
                         ┌──────────────┐
                         │   Browser     │
                         └──────┬───────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
     ┌──────▼──────┐   ┌───────▼───────┐   ┌──────▼──────┐
     │  Password    │   │  OAuth 2.0    │   │  WebAuthn   │
     │  + TOTP/SMS  │   │  Google/GitHub│   │  Passkeys   │
     └──────┬──────┘   └───────┬───────┘   └──────┬──────┘
            │                   │                   │
            └───────────────────┼───────────────────┘
                                │
                         ┌──────▼───────┐
                         │  Better Auth  │
                         │  Session Mgmt │
                         │  HTTP-only    │
                         │  Cookies      │
                         └──────┬───────┘
                                │
                         ┌──────▼───────┐
                         │  tRPC Context │
                         │  session/user │
                         │  venture/perm │
                         └──────────────┘
```

### RBAC Architecture

```
Super Admin (Tier 0)
    │
    ├──► Full platform access
    ├──► Cross-venture operations
    ├──► System configuration
    │
Venture Admin (Tier 1)
    │
    ├──► Venture-scoped management
    ├──► User administration (within venture)
    ├──► Feature configuration
    │
Operator (Tier 2)
    │
    ├──► Module-level access
    ├──► Assigned features only
    ├──► Create/edit within scope
    │
Viewer (Tier 3)
    │
    ├──► Read-only access
    └──► Reduced navigation
```

Permissions are enforced at three levels:

1. **Route level** — Edge middleware checks auth state
2. **Procedure level** — tRPC middleware checks role/permissions
3. **UI level** — `<PermissionGate>` component conditionally renders

---

## 8. Observability

### Logging Architecture

```
┌──────────────────┐     ┌──────────────────┐
│  tRPC Logger     │     │  Next.js Logger   │
│  (per-request)   │     │  (middleware)      │
└────────┬─────────┘     └────────┬──────────┘
         │                        │
         └────────────┬───────────┘
                      │
              ┌───────▼───────┐
              │ @mcv/logger   │
              │ Structured    │
              │ JSON output   │
              └───────┬───────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼────┐  ┌────▼────┐  ┌───▼────┐
    │ Console │  │ Vercel  │  │ Sentry │
    │ (dev)   │  │ Logs    │  │ (prod) │
    └─────────┘  └─────────┘  └────────┘
```

### Structured Log Format

```json
{
  "level": "info",
  "message": "tRPC request completed",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "path": "ventures.list",
  "procedure": "query",
  "userId": "usr_abc123",
  "ventureId": "vnt_xyz789",
  "durationMs": 42,
  "status": "success",
  "timestamp": "2026-02-09T12:00:00.000Z"
}
```

### Metrics & Monitoring

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| **Response time (p95)** | Vercel Analytics | > 2s |
| **Error rate** | Sentry | > 1% of requests |
| **Rate limit hits** | Upstash Redis | > 100/hour per IP |
| **Session creation** | Better Auth | Anomaly detection |
| **Bundle size** | CI build output | > 250KB initial |
| **Core Web Vitals** | Vercel Speed Insights | Below "good" threshold |
| **Build duration** | Turborepo | > 5 min |
| **Type check** | CI | Any errors |

### Request Tracing

Every request carries a `x-request-id` header (generated at Edge middleware) that propagates through:

1. Edge Middleware logs
2. tRPC context (`ctx.requestId`)
3. Service layer logging
4. Database query logging
5. External API calls (passed as header)

This enables end-to-end trace correlation across all layers.

---

## 9. Deployment Pipeline

### Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEVELOPER WORKSTATION                         │
│                                                                     │
│  git commit → conventional commit format                            │
│  git push → triggers CI                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       GITHUB ACTIONS CI                              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Stage 1: VALIDATE (parallel)                                │   │
│  │                                                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │   │
│  │  │  Type Check │  │   Lint     │  │  Format    │            │   │
│  │  │  (tsc)      │  │  (ESLint)  │  │ (Prettier) │            │   │
│  │  └────────────┘  └────────────┘  └────────────┘            │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────▼───────────────────────────────────┐   │
│  │  Stage 2: TEST (parallel)                                    │   │
│  │                                                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │   │
│  │  │ Unit Tests │  │ Integration │  │  Component │            │   │
│  │  │  (Vitest)   │  │  (Vitest)   │  │  (Storybook)│            │   │
│  │  └────────────┘  └────────────┘  └────────────┘            │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────▼───────────────────────────────────┐   │
│  │  Stage 3: BUILD (Turborepo — cached, parallel)               │   │
│  │                                                              │   │
│  │  @mcv/kernel → @mcv/db → @mcv/auth → ... → @mcv/api        │   │
│  │                                              → @mcv/ui       │   │
│  │                                              → @mcv/apps     │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────▼───────────────────────────────────┐   │
│  │  Stage 4: E2E (Playwright)                                   │   │
│  │                                                              │   │
│  │  20 critical user flows against preview deployment           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        VERCEL DEPLOYMENT                             │
│                                                                     │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
│  │    Preview     │───►│    Staging     │───►│  Production   │       │
│  │   (per-PR)     │    │  (auto on     │    │  (manual      │       │
│  │                │    │   main merge)  │    │   promotion)  │       │
│  └───────────────┘    └───────────────┘    └───────────────┘       │
│                                                                     │
│  Serverless Functions (Node.js 20)                                  │
│  Edge Functions (API routes, middleware)                             │
│  Static Assets (CDN, global)                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Environment Strategy

| Environment | Branch | Domain | Purpose |
|-------------|--------|--------|---------|
| **Preview** | Feature branches | `{branch}.vercel.app` | PR review |
| **Staging** | `main` | `staging.admin.mcv.one` | Pre-production validation |
| **Production** | `main` (promoted) | `admin.mcv.one` | Live traffic |

### Rollback Strategy

| Scenario | Action | Timeframe |
|----------|--------|-----------|
| **Build failure** | CI blocks deploy | Immediate |
| **E2E failure** | CI blocks deploy | ~10 min (E2E run) |
| **Performance regression** | Vercel instant rollback | < 1 min |
| **Runtime error spike** | Sentry alert → rollback | < 5 min |
| **Feature issue** | Feature flag disable | Instant (no deploy) |

### Docker Alternative

For self-hosted or non-Vercel deployments:

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm turbo build --filter=@mcv/admin

# Production
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./.next/static
COPY --from=builder /app/apps/admin/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

---

*Tier 6: Presentation — The MCV.ONE User Interface Layer*
