# Tier 6: Presentation — Module Documentation

| Field              | Value                                           |
| ------------------ | ----------------------------------------------- |
| **Tier**           | 6 — Presentation                                |
| **Classification** | INTERNAL                                        |
| **Packages**       | `@mcv/api`, `@mcv/apps`, `@mcv/ui`             |
| **Version**        | 0.1.0                                           |
| **Runtime**        | Node.js ≥ 20 / Edge (Vercel)                   |
| **Framework**      | Next.js 15.0.7, tRPC v11, HeroUI, Tailwind CSS |
| **Build System**   | Turborepo                                       |
| **Last Updated**   | February 2026                                   |

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Position](#architecture-position)
3. [Sub-Package Deep Dives](#sub-package-deep-dives)
   - [3.1 @mcv/api — tRPC API Surface](#31-mcvapi--trpc-api-surface)
   - [3.2 @mcv/apps — Next.js Applications](#32-mcvapps--nextjs-applications)
   - [3.3 @mcv/ui — Component Library & Design System](#33-mcvui--component-library--design-system)
4. [Cross-Package Data Flow](#cross-package-data-flow)
5. [Shared Patterns](#shared-patterns)
6. [Build & Development](#build--development)
7. [Key Interfaces, Configuration & Dependencies](#key-interfaces-configuration--dependencies)
8. [Performance](#performance)
9. [Deployment](#deployment)
10. [Testing Strategy](#testing-strategy)
11. [Security](#security)
12. [Multi-Tenant Design](#multi-tenant-design)

---

## Overview

Tier 6 is the **Presentation Layer** of MCV.ONE — the apex of the platform's six-tier architecture and the surface through which every human operator, executive, venture lead, and AI agent interacts with the system. It translates the raw capabilities distributed across Tiers 0–5 into cohesive, production-grade user interfaces, a type-safe API surface, and a comprehensive design system.

This tier is the **terminal consumer** in the dependency graph: it imports from every lower tier, but nothing imports from it. Every pixel rendered, every tRPC call dispatched, every button clicked, and every real-time subscription established flows through Tier 6.

Three sub-packages compose this tier:

| Sub-Package    | Role                       | Scale                                            |
| -------------- | -------------------------- | ------------------------------------------------ |
| **`@mcv/api`** | Unified tRPC API surface   | 61 routers, 68 services, 42 schemas             |
| **`@mcv/apps`**| Next.js 15 applications    | 169 pages, 75 API routes, 35 feature modules    |
| **`@mcv/ui`**  | HeroUI component library   | 508 components, 71 categories, 85 patterns      |

Together they orchestrate the user experience for the MCV Global Consortium — 9 ventures, hundreds of AI agents, and thousands of users managed through a unified, dark-themed, accessibility-first interface.

### At a Glance

| Metric                            | Value                               |
| --------------------------------- | ----------------------------------- |
| Total components                  | 508                                 |
| Total pages                       | 169 (Super-Admin) + Venture Admin   |
| tRPC routers                      | 61                                  |
| API route handlers                | 75                                  |
| Domain services                   | 68                                  |
| Zod schema modules                | 42                                  |
| Feature modules (FSD)             | 35                                  |
| Zustand stores                    | 10                                  |
| Internal `@mcv/*` dependencies    | 17 workspace packages               |
| HeroUI component packages         | 33                                  |
| Procedure types                   | 14+                                 |
| Rate limit presets                | 5                                   |
| UI component categories           | 71                                  |
| Pre-built UI patterns             | 85                                  |
| Venture brand themes              | 9                                   |
| Navigation sections               | 18                                  |
| Transpiled packages               | 53                                  |

### What This Tier Does

1. **Exposes a unified API** — A single tRPC `appRouter` merging 61 domain routers into one type-safe, end-to-end API surface
2. **Renders the user interface** — Every page, modal, form, chart, kanban board, and interactive element users see
3. **Provides a design system** — 508 components across 71 categories with venture-specific theming
4. **Manages multi-tenancy** — The "Chameleon Engine" dynamically rebrands the entire UI per venture context
5. **Enforces presentation-layer security** — Edge middleware for auth checks, rate limiting, CSP, and security headers
6. **Orchestrates client state** — 10 Zustand stores for navigation, auth UI, CRM, AI command, and more
7. **Handles real-time** — WebSocket subscriptions, Server-Sent Events, and presence indicators
8. **Delivers performance** — React Server Components, streaming, code splitting, and Edge runtime

### What This Tier Does NOT Do

1. **Business logic** — Delegated to Tier 5 domain packages (`@mcv/domains`)
2. **Data persistence** — Delegated to Tier 2 infrastructure (`@mcv/db`)
3. **Authentication providers** — Delegated to Tier 4 (`@mcv/auth`); this tier consumes sessions
4. **Schema/type definitions** — Core types live in Tier 1 (`@mcv/kernel`); this tier imports them
5. **Runtime primitives** — Error handling and logging foundation lives in Tier 0

### Design Philosophy

| Principle                | Meaning                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| **Thin presentation**    | Pages are composites of feature modules; minimal logic in route files                        |
| **Server-first**         | Default to React Server Components; use `'use client'` only when interactivity requires it   |
| **Type-safe end-to-end** | From database schema through tRPC to React component props — zero `any`                     |
| **Dark mode native**     | Dark theme is default and primary; light mode is secondary                                   |
| **Context-aware**        | The UI adapts dynamically based on auth state, venture context, and user permissions         |
| **Feature-sliced**       | Each capability is a self-contained feature module with its own components, hooks, and types |
| **Accessibility-first**  | WCAG 2.1 AA compliance, ARIA patterns, keyboard navigation, focus management                |
| **Multi-tenant by design** | Every component, every layout, every route respects venture context                        |

---

## Architecture Position

Tier 6 sits at the **apex of the dependency tree**, consuming services from every tier below. No package imports from Tier 6 — it is a terminal consumer.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   T I E R   6  │  P R E S E N T A T I O N                         │
│                                                                     │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐             │
│   │  @mcv/api   │   │  @mcv/apps  │   │   @mcv/ui   │             │
│   │  61 routers │──▶│  169 pages  │◀──│  508 comps   │             │
│   │  68 services│   │  75 routes  │   │  71 cats    │             │
│   └─────────────┘   └─────────────┘   └─────────────┘             │
│          │                 │                  │                     │
│   ─ ─ ─ ─ ─ ─ ─   YOU ARE HERE   ─ ─ ─ ─ ─ ─ ─                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             │ consumes
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│   T I E R   5  │  D O M A I N   M O D U L E S                     │
│                                                                     │
│   @mcv/users       User management, profiles                       │
│   @mcv/tenants     Multi-tenancy, Chameleon Engine                  │
│   @mcv/domains     Business logic, domain services                  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│   T I E R   4  │  F E A T U R E S                                  │
│                                                                     │
│   @mcv/auth          Authentication (Better Auth)                   │
│   @mcv/permissions   RBAC, permission gates                         │
│   @mcv/flags         Feature flag evaluation                        │
│   @mcv/notifications Push, email, in-app alerts                     │
│   @mcv/ai            AI/LLM integrations, agents                    │
│   @mcv/activity      Activity feed, engagement                      │
│   @mcv/audit         Audit logging, compliance                      │
│   @mcv/gateway       AI Gateway, model routing                      │
│   @mcv/rag           RAG, knowledge retrieval                       │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│   T I E R   3  │  A P I   L A Y E R                                │
│                                                                     │
│   @mcv/api           tRPC routers, gateway                          │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│   T I E R   2  │  I N F R A S T R U C T U R E                      │
│                                                                     │
│   @mcv/db            Drizzle ORM, PostgreSQL schemas                │
│   @mcv/storage       S3/Supabase file storage                       │
│   @mcv/realtime      WebSocket, SSE, presence                       │
│   @mcv/config        Shared config, env validation                  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│   T I E R   1  │  F O U N D A T I O N                              │
│                                                                     │
│   @mcv/kernel        Shared types, utilities, constants             │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│   T I E R   0  │  C O R E                                          │
│                                                                     │
│   Runtime, structured logging, error handling                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Dependency Flow Rules

1. **Tier 6 imports from all lower tiers** — It is the only tier that touches every other tier
2. **No package imports from Tier 6** — It is a terminal consumer; nothing depends on it
3. **@mcv/apps depends on @mcv/api and @mcv/ui** — The apps orchestrate the other two sub-packages
4. **@mcv/api depends on Tiers 0–5** — It bridges domain logic to the HTTP boundary
5. **@mcv/ui has minimal lower-tier deps** — Primarily external (HeroUI, Tailwind, Framer Motion)
6. **Feature modules are internal** — The `features/` directory in apps is private; reusable components flow to `@mcv/ui`

### Inter-Package Dependency Matrix

```
              @mcv/api    @mcv/apps    @mcv/ui
@mcv/api        —           ✗           ✗        (nothing imports api)
@mcv/apps      ✓ uses       —          ✓ uses    (apps imports both)
@mcv/ui        ✗            ✗           —        (ui is standalone)
```

- **`@mcv/apps`** is the orchestrator — it brings `@mcv/api` (data) and `@mcv/ui` (rendering) together
- **`@mcv/api`** is the data gateway — it has no awareness of apps or UI
- **`@mcv/ui`** is the design system — it has no awareness of API or apps; pure presentational components

---

## Sub-Package Deep Dives

### 3.1 @mcv/api — tRPC API Surface

**Classification:** INTERNAL · **Version:** 0.1.0

`@mcv/api` is the **single API surface** for the entire MCV.ONE platform. It exposes a unified tRPC router (`appRouter`) that merges 61 domain routers into one type-safe, end-to-end API. Every client — Next.js App Router, Hono edge workers, React Query hooks, and AI agents — connects through this package.

**This is the only package that defines API endpoints. No other package creates HTTP routes.**

#### Key Metrics

| Metric              | Value |
| ------------------- | ----- |
| Domain routers      | 61    |
| Zod schema modules  | 42    |
| Service classes     | 68    |
| Procedure types     | 14+   |
| Rate limit presets  | 5     |
| Export entry points | 7     |

#### Package Architecture

```
@mcv/api/
├── src/
│   ├── root.ts                 # appRouter — merges all 61 domain routers
│   ├── trpc.ts                 # tRPC instance, base procedures, middleware
│   ├── context.ts              # Request context factory
│   ├── routers/                # 61 domain routers
│   │   ├── auth/
│   │   │   ├── auth.router.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts
│   │   ├── ventures/
│   │   ├── users/
│   │   ├── crm/
│   │   ├── ai/
│   │   ├── invoicing/
│   │   ├── tasks/
│   │   ├── ... (61 total)
│   │   └── index.ts            # Re-exports all routers
│   ├── middleware/
│   │   ├── auth.middleware.ts   # Session validation
│   │   ├── tenant.middleware.ts # Venture context injection
│   │   ├── rate-limit.ts       # Sliding window rate limiter
│   │   ├── logging.ts          # Request/response logging
│   │   ├── timing.ts           # Performance timing
│   │   └── error-handler.ts    # Structured error responses
│   ├── procedures/
│   │   ├── public.ts           # publicProcedure — no auth required
│   │   ├── protected.ts        # protectedProcedure — session required
│   │   ├── admin.ts            # adminProcedure — Tier 0 only
│   │   ├── venture.ts          # ventureProcedure — venture context required
│   │   ├── agent.ts            # agentProcedure — AI agent identity
│   │   └── ... (14+ types)
│   ├── schemas/                # 42 Zod schema modules
│   │   ├── auth.schema.ts
│   │   ├── venture.schema.ts
│   │   ├── user.schema.ts
│   │   └── ...
│   └── utils/
│       ├── superjson.ts        # SuperJSON transformer
│       ├── openapi.ts          # OpenAPI spec generation
│       └── error-codes.ts      # Standardized error codes
├── package.json
└── tsconfig.json
```

#### Router Domain Map

The 61 routers are organized by business domain:

| Domain Area                    | Routers | Key Namespaces                                                                  |
| ------------------------------ | ------- | ------------------------------------------------------------------------------- |
| **Authentication & Identity**  | 6       | `auth`, `mfa`, `passkey`, `wallet`, `users`, `roles`                           |
| **Multi-Tenancy & Access**     | 4       | `ventures`, `ventureMembers`, `permissions`, `settings`                        |
| **AI & Intelligence**          | 7       | `gateway`, `rag`, `ai`, `intelligence`, `hitl`, `agentTasks`, `workbench`      |
| **CRM & Contacts**             | 6       | `contacts`, `organizations`, `deals`, `activities`, `crmV2`, `entityGraph`     |
| **Task & Project Management**  | 8       | `tasks`, `projects`, `sprints`, `taskTemplates`, `timeEntries`, `automationRules`, `taskAnalytics`, `workflows` |
| **Communication**              | 4       | `conversations`, `queues`, `twilio`, `contactCenter`                           |
| **Commerce & Payments**        | 4       | `catalog`, `invoicing`, `payments`, `forms`                                    |
| **Content & Documents**        | 4       | `cms`, `comments`, `tags`, `documentEditor`                                    |
| **Operations & Monitoring**    | 5       | `audit`, `notifications`, `flags`, `storage`, `stats`                          |
| **Strategy & Finance**         | 5       | `portfolio`, `treasury`, `tokenEconomy`, `strategy`, `grantConcierge`          |
| **Marketing & Branding**       | 3       | `marketing`, `branding`, `reputation`                                          |
| **Infrastructure**             | 5       | `analytics`, `webhooks`, `integrations`, `email`, `calendar`                   |

#### The Middleware Chain

Every tRPC request passes through a carefully ordered middleware chain. The order matters — each middleware enriches the context for the next:

```
Incoming tRPC Request
        │
        ▼
┌──────────────────────────────────┐
│  1. Request ID + Timing          │  Generates unique requestId, starts timer
├──────────────────────────────────┤
│  2. Logging                      │  Logs method, path, input shape
├──────────────────────────────────┤
│  3. Rate Limiting                │  Sliding window check (IP or userId)
├──────────────────────────────────┤
│  4. Auth Validation              │  Validates Better Auth session cookie
├──────────────────────────────────┤
│  5. User Resolution              │  Loads full user profile from session
├──────────────────────────────────┤
│  6. Venture Context              │  Resolves active venture from header/session
├──────────────────────────────────┤
│  7. Permission Loading           │  Loads RBAC permissions for user+venture
├──────────────────────────────────┤
│  8. Input Validation             │  Zod schema validation on request input
├──────────────────────────────────┤
│  9. Procedure Handler            │  Actual business logic execution
├──────────────────────────────────┤
│ 10. Response Serialization       │  SuperJSON transform (Date, Map, Set, etc.)
├──────────────────────────────────┤
│ 11. Error Handler                │  Structured error response on failure
├──────────────────────────────────┤
│ 12. Completion Logging           │  Duration, status, response size
└──────────────────────────────────┘
```

#### Procedure Type Hierarchy

The 14+ procedure types form a hierarchy from least to most privileged:

```typescript
// Level 0: No authentication
publicProcedure
  → No auth required
  → Rate limited by IP (public preset: 50/min)
  → Used for: health checks, public API, unauthenticated forms

// Level 1: Authenticated
protectedProcedure
  → Requires valid Better Auth session
  → Rate limited by userId (general preset: 100/min)
  → Context includes: user, session, permissions
  → Used for: most application endpoints

// Level 2: Venture-scoped
ventureProcedure
  → Extends protectedProcedure
  → Requires active venture context (header or session)
  → Context includes: venture object with id, slug, name, settings
  → Used for: all venture-specific operations

// Level 3: Admin
adminProcedure
  → Extends protectedProcedure
  → Requires Tier 0 (Super Admin) role
  → Used for: platform-wide administration

// Level 4: Specialized
agentProcedure
  → For AI agent callers (API key auth, no session)
  → Includes agent identity, budget context

systemProcedure
  → For internal service-to-service calls
  → Bypasses rate limiting, elevated privileges

webhookProcedure
  → For incoming webhooks (Stripe, Twilio, etc.)
  → Signature validation, idempotency
```

#### Service Layer Pattern

Each router delegates to a service class. The router is a thin translation layer; the service contains the actual business logic:

```typescript
// Router: thin handler that validates input and delegates
export const ventureRouter = router({
  list: ventureProcedure
    .input(listVenturesSchema)
    .query(async ({ ctx, input }) => {
      return ctx.services.ventures.list(input, ctx);
    }),

  create: adminProcedure
    .input(createVentureSchema)
    .mutation(async ({ ctx, input }) => {
      const venture = await ctx.services.ventures.create(input, ctx);
      await ctx.services.audit.log('venture.created', { ventureId: venture.id }, ctx);
      return venture;
    }),

  getBySlug: ventureProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.services.ventures.getBySlug(input.slug, ctx);
    }),
});

// Service: real business logic, reusable across routers
class VentureService {
  async list(input: ListVenturesInput, ctx: AuthenticatedContext) {
    const { page, limit, search, status } = input;

    // Build query with tenant scoping
    let query = ctx.db.select().from(ventures);

    // Super-admins see all; venture admins see only their venture
    if (ctx.user.tier > 0) {
      query = query.where(eq(ventures.id, ctx.venture.id));
    }

    if (search) {
      query = query.where(ilike(ventures.name, `%${search}%`));
    }

    if (status) {
      query = query.where(eq(ventures.status, status));
    }

    const results = await query
      .orderBy(desc(ventures.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { items: results, total: results.length, page, limit };
  }

  async create(input: CreateVentureInput, ctx: AdminContext) {
    // Only Tier 0 can create ventures (enforced by adminProcedure)
    const slug = slugify(input.name);

    // Check for duplicate slug
    const existing = await ctx.db.select()
      .from(ventures)
      .where(eq(ventures.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: `Venture with slug "${slug}" already exists`,
      });
    }

    const [venture] = await ctx.db.insert(ventures)
      .values({ ...input, slug, createdBy: ctx.user.id })
      .returning();

    // Initialize venture defaults (settings, branding, permissions)
    await this.initializeVentureDefaults(venture.id, ctx);

    return venture;
  }
}
```

#### Rate Limiting Architecture

The sliding window rate limiter uses Upstash Redis for distributed state:

| Preset      | Limit     | Window   | Key Strategy | Applies To                              |
| ----------- | --------- | -------- | ------------ | --------------------------------------- |
| `public`    | 50/min    | Per IP   | IP address   | Health checks, public booking           |
| `general`   | 100/min   | Per user | userId       | Standard authenticated endpoints        |
| `auth`      | 5/min     | Per IP   | IP address   | Login, signup, password reset           |
| `strict`    | 3/min     | Per IP   | IP address   | Password reset confirmation             |
| `relaxed`   | 200/min   | Per user | userId       | Dashboard polling, real-time feeds      |

```typescript
// Rate limit middleware implementation
const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(limit, window),
  analytics: true,
  prefix: `mcv:ratelimit:${preset}`,
});

// Applied per-procedure via middleware
export const rateLimitMiddleware = (preset: RateLimitPreset) =>
  t.middleware(async ({ ctx, next }) => {
    const key = preset === 'public' || preset === 'auth' || preset === 'strict'
      ? ctx.ip ?? 'unknown'
      : ctx.user?.id ?? ctx.ip ?? 'unknown';

    const { success, remaining, reset } = await rateLimiter.limit(key);

    if (!success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)}s`,
      });
    }

    return next({
      ctx: { ...ctx, rateLimit: { remaining, reset } },
    });
  });
```

#### OpenAPI Generation

`@mcv/api` auto-generates an OpenAPI 3.0 specification for external consumers (AI agents, third-party integrations):

```typescript
import { generateOpenApiDocument } from 'trpc-openapi';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'MCV.ONE API',
  version: '0.1.0',
  baseUrl: 'https://admin.mcv.one/api',
  docsUrl: 'https://docs.mcv.one/api',
  tags: [
    'auth', 'ventures', 'users', 'crm', 'invoicing',
    'tasks', 'ai', 'catalog', 'cms', 'analytics',
  ],
});
```

#### SuperJSON Serialization

All tRPC responses pass through SuperJSON for rich type preservation:

```typescript
// Before SuperJSON: Date becomes string, Map/Set lost, undefined stripped
{ createdAt: "2026-02-09T12:00:00.000Z", tags: [...], metadata: {...} }

// After SuperJSON: types preserved across the wire
{ createdAt: Date, tags: Map<string, Tag>, metadata: { nested: undefined } }
```

Supported types: `Date`, `Map`, `Set`, `BigInt`, `undefined`, `RegExp`, `NaN`, `Infinity`, `-Infinity`.

#### Export Entry Points

`@mcv/api` exposes 7 carefully designed entry points:

| Entry Point                | Purpose                                        |
| -------------------------- | ---------------------------------------------- |
| `@mcv/api`                 | Main — `appRouter` type + `createCaller`       |
| `@mcv/api/trpc`            | tRPC instance, procedures, middleware          |
| `@mcv/api/context`         | Request context factory                        |
| `@mcv/api/schemas`         | All Zod schemas (for form validation in apps)  |
| `@mcv/api/services`        | Service classes (for server actions)            |
| `@mcv/api/openapi`         | OpenAPI document generation                    |
| `@mcv/api/types`           | Inferred types from `AppRouter`                |

#### WebSocket Subscriptions

Real-time data flows through tRPC subscriptions backed by WebSocket connections:

```typescript
// Server: define a subscription procedure
export const notificationRouter = router({
  onNew: protectedProcedure
    .subscription(({ ctx }) => {
      return observable<Notification>((emit) => {
        const handler = (notification: Notification) => {
          if (notification.userId === ctx.user.id) {
            emit.next(notification);
          }
        };

        eventEmitter.on('notification:created', handler);
        return () => eventEmitter.off('notification:created', handler);
      });
    }),
});

// Client: subscribe in a React component
function NotificationBell() {
  trpc.notifications.onNew.useSubscription(undefined, {
    onData(notification) {
      toast.info(notification.title);
      queryClient.invalidateQueries(['notifications']);
    },
  });
}
```

Active subscription channels include:
- **Notifications** — Real-time alerts, approval requests
- **Presence** — Online status indicators for team members
- **AI Tasks** — Agent status updates, HITL queue changes
- **CRM Activity** — Deal stage changes, new contacts
- **Chat** — Conversation messages (contact center)

---

### 3.2 @mcv/apps — Next.js Applications

**Classification:** PRIVATE · **Version:** 0.1.0

`@mcv/apps` is the **crown jewel** of the MCV.ONE platform — the applications that put every lower tier's capabilities into the hands of human operators. It houses Next.js 15 applications serving as the primary user interfaces for the entire MCV Global Consortium.

#### Applications

| Application       | Package              | Port | Domain              | Status             |
| ----------------- | -------------------- | ---- | ------------------- | ------------------ |
| **Super-Admin**   | `@mcv/admin`         | 3000 | `admin.mcv.one`     | Active Development |
| **Venture Admin** | `@mcv/venture-admin` | 3001 | `{venture}.mcv.one` | Planned            |

#### Super-Admin Key Metrics

| Metric                  | Value                                               |
| ----------------------- | --------------------------------------------------- |
| Page components         | 169                                                 |
| API route handlers      | 75                                                  |
| Feature modules (FSD)   | 35                                                  |
| Zustand stores          | 10                                                  |
| Route groups            | 4 (`(auth)`, `(dashboard)`, `(public)`, `api`)      |
| Layout nesting depth    | 5 levels                                            |
| Navigation sections     | 18                                                  |
| Venture branding colors | 6 unique palettes                                   |

#### Application Architecture — Super-Admin

```
@mcv/apps/admin/
├── app/                              # Next.js 15 App Router
│   ├── layout.tsx                    # Root layout — providers, fonts, metadata
│   ├── not-found.tsx                 # Global 404
│   ├── error.tsx                     # Global error boundary
│   ├── loading.tsx                   # Root loading state
│   │
│   ├── (auth)/                       # Auth route group (no sidebar)
│   │   ├── layout.tsx                # Centered card layout
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── mfa/page.tsx
│   │
│   ├── (dashboard)/                  # Main app (with sidebar + header)
│   │   ├── layout.tsx                # Dashboard shell — sidebar, header, providers
│   │   ├── page.tsx                  # Mission Control (home dashboard)
│   │   │
│   │   ├── admin/                    # Administration module (40 pages)
│   │   │   ├── users/
│   │   │   │   ├── page.tsx          # User list with DataTable
│   │   │   │   ├── [userId]/page.tsx # User detail/edit
│   │   │   │   └── new/page.tsx      # Create user
│   │   │   ├── roles/
│   │   │   ├── permissions/
│   │   │   ├── ventures/
│   │   │   ├── flags/
│   │   │   ├── email/
│   │   │   ├── storage/
│   │   │   ├── gateway/
│   │   │   ├── audit/
│   │   │   ├── marketing/
│   │   │   └── ai-command/
│   │   │
│   │   ├── ai-command/               # AI Command Center (8 pages)
│   │   │   ├── page.tsx              # Swarm overview
│   │   │   ├── agents/
│   │   │   ├── hitl/
│   │   │   ├── naos/
│   │   │   └── queen/
│   │   │
│   │   ├── crm/                      # CRM (9 pages)
│   │   │   ├── page.tsx              # CRM dashboard
│   │   │   ├── contacts/
│   │   │   ├── organizations/
│   │   │   ├── deals/
│   │   │   ├── pipeline/
│   │   │   └── forecast/
│   │   │
│   │   ├── portfolio/                # Portfolio (6 pages)
│   │   ├── invoicing/                # Invoicing (8 pages)
│   │   ├── catalog/                  # Product Catalog (5 pages)
│   │   ├── strategy/                 # Strategy (4 pages)
│   │   ├── settings/                 # Settings (9 pages)
│   │   ├── documents/                # Document Studio (4 pages)
│   │   ├── knowledge/                # Knowledge Base (4 pages)
│   │   ├── engineering/              # Engineering (1 page — Workbench)
│   │   ├── tasks/                    # Tasks (3 pages)
│   │   ├── workflows/                # Workflows (2 pages)
│   │   ├── cms/                      # CMS (5 pages)
│   │   ├── analytics/                # Analytics dashboards
│   │   ├── approvals/                # Approval workflows
│   │   ├── contact-center/           # Contact center
│   │   ├── grants/                   # Grant management
│   │   │
│   │   └── v/                        # Venture context routes
│   │       └── [ventureSlug]/        # Dynamic venture scope
│   │           ├── page.tsx          # Venture dashboard
│   │           ├── engineering/
│   │           ├── growth/
│   │           ├── operations/
│   │           └── tasks/
│   │
│   ├── (public)/                     # Public pages (no auth)
│   │   ├── layout.tsx
│   │   └── booking/page.tsx
│   │
│   └── api/                          # API route handlers (75)
│       ├── trpc/[trpc]/route.ts      # tRPC HTTP handler
│       ├── auth/[...all]/route.ts    # Better Auth catch-all
│       ├── webhooks/
│       │   ├── stripe/route.ts
│       │   ├── twilio/route.ts
│       │   └── github/route.ts
│       ├── upload/route.ts
│       ├── export/route.ts
│       └── ... (75 total)
│
├── features/                         # Feature-Sliced Design (35 modules)
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── MFAChallenge.tsx
│   │   │   └── SessionManager.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useSession.ts
│   │   ├── stores/
│   │   │   └── auth.store.ts
│   │   └── types.ts
│   ├── crm/
│   ├── invoicing/
│   ├── ai-command/
│   ├── portfolio/
│   ├── navigation/
│   ├── ... (35 total)
│   └── index.ts
│
├── components/                       # App-level shared components
│   ├── providers/
│   │   ├── RootProviders.tsx         # Composes all context providers
│   │   ├── ThemeProvider.tsx
│   │   ├── AuthProvider.tsx
│   │   ├── TRPCProvider.tsx
│   │   └── VentureProvider.tsx
│   ├── layouts/
│   │   ├── DashboardShell.tsx        # Main app shell
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── shared/
│       ├── ErrorBoundary.tsx
│       ├── LoadingScreen.tsx
│       └── PermissionGate.tsx
│
├── lib/                              # Application utilities
│   ├── trpc.ts                       # tRPC client configuration
│   ├── auth.ts                       # Auth helpers
│   ├── utils.ts                      # General utilities
│   └── constants.ts                  # App-level constants
│
├── stores/                           # Zustand stores (10)
│   ├── navigation.store.ts           # Sidebar state, breadcrumbs, routing
│   ├── auth-ui.store.ts              # Auth form state, MFA flow
│   ├── crm.store.ts                  # CRM filters, pipeline view state
│   ├── ai-command.store.ts           # Agent selection, HITL queue
│   ├── invoicing.store.ts            # Invoice drafts, line items
│   ├── theme.store.ts                # Theme preference, venture context
│   ├── notification.store.ts         # Toast queue, unread count
│   ├── search.store.ts               # Global search state (Cmd+K)
│   ├── table.store.ts                # DataTable state (sorts, filters, selection)
│   └── workspace.store.ts            # Layout preferences, panel states
│
├── middleware.ts                      # Next.js Edge middleware
├── next.config.ts                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind CSS configuration
└── tsconfig.json
```

#### Core Modules Deep Dive

##### Mission Control (Home Dashboard)

The Mission Control page is the executive nerve center — a single-page overview of the entire consortium:

```
┌─────────────────────────────────────────────────────────────────┐
│  MISSION CONTROL                                    Feb 2026    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Revenue  │  │ Active   │  │ AI Agents│  │ Pending  │      │
│  │ $2.4M    │  │ Users    │  │ Online   │  │ Approvals│      │
│  │ ▲ 12%    │  │ 1,247    │  │ 43/67    │  │ 7        │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│  ┌─────────────────────────────┐  ┌────────────────────────┐  │
│  │  Revenue by Venture (chart) │  │  Recent Activity Feed  │  │
│  │  ████████████████████████   │  │  • Deal closed: $45K   │  │
│  │  ████████████████           │  │  • Agent deployed: #42 │  │
│  │  ██████████████████████     │  │  • Invoice paid: #1087 │  │
│  └─────────────────────────────┘  └────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────┐  ┌────────────────────────┐  │
│  │  Venture Health Matrix      │  │  AI Swarm Status       │  │
│  │  BetEdge ●●●●●◐            │  │  Agents: 43 active     │  │
│  │  EdgeIQ  ●●●●●●            │  │  Tasks:  128 in queue  │  │
│  │  MCVGG   ●●●●◐○            │  │  HITL:   7 pending     │  │
│  └─────────────────────────────┘  └────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Key data sources:
- **Revenue KPIs** — `trpc.analytics.getRevenueSummary`
- **User counts** — `trpc.stats.getActiveUsers`
- **AI swarm** — `trpc.gateway.getSwarmStatus`
- **Pending approvals** — `trpc.tasks.getPendingApprovals`
- **Activity feed** — `trpc.activity.getRecent` (real-time via subscription)
- **Venture health** — `trpc.portfolio.getHealthMatrix`

##### Administration Module (40 Pages)

The largest module — provides platform-wide management for super-admins:

| Sub-Module       | Pages | Key Features                                                  |
| ---------------- | ----- | ------------------------------------------------------------- |
| **Users**        | 5     | CRUD, role assignment, status management, session viewing     |
| **Roles**        | 3     | Role definition, permission assignment, hierarchy             |
| **Permissions**  | 3     | Granular permission CRUD, role-permission matrix              |
| **Ventures**     | 5     | Venture lifecycle, settings, branding, member management      |
| **Feature Flags**| 3     | Flag CRUD, targeting rules, rollout percentages               |
| **Email**        | 3     | Template editor, send history, Resend integration             |
| **Storage**      | 2     | File browser, upload management, S3 integration               |
| **Gateway**      | 4     | AI model configuration, budget management, usage analytics    |
| **Audit**        | 3     | Audit log viewer, filters, export                             |
| **Marketing**    | 4     | Campaign management, analytics, reputation                    |
| **AI Command**   | 5     | Agent management, HITL center, NAOS registry                  |

##### AI Command Center (8 Pages)

The nerve center for MCV.ONE's AI operations:

```
┌─────────────────────────────────────────────────────────────────┐
│  AI COMMAND CENTER                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Swarm Overview                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Active Agents: 43    │  Queue: 128  │  Budget: $2.1K  │    │
│  │  ═══════════════════  │  ═══════     │  ═══════════    │    │
│  │  ████████████░░░░░░░  │  ████████    │  ██████████░░   │    │
│  │  64% capacity         │  73% busy    │  84% consumed   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  HITL Queue (7 pending)                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ⚠ Agent #12 requests approval: Deploy to production   │    │
│  │  ⚠ Agent #34 requests review: Generated contract       │    │
│  │  ⚠ Agent #7  requests escalation: Budget exceeded      │    │
│  │  ... 4 more                                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Agent Registry                                                 │
│  ┌──────┬──────────────┬──────────┬───────────┬───────────┐   │
│  │ ID   │ Name         │ Status   │ Model     │ Tasks/hr  │   │
│  ├──────┼──────────────┼──────────┼───────────┼───────────┤   │
│  │ #001 │ Scout Alpha  │ ● Active │ GPT-4     │ 12        │   │
│  │ #002 │ Writer Beta  │ ● Active │ Claude    │ 8         │   │
│  │ #003 │ Analyst Gamma│ ○ Idle   │ GPT-4     │ 0         │   │
│  └──────┴──────────────┴──────────┴───────────┴───────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Pages:
- **Swarm Overview** — Real-time dashboard of all active AI agents, capacity, and budgets
- **Agent Management** — CRUD for agent configurations, model assignments, task queues
- **HITL Center** — Human-in-the-loop approval queue with real-time WebSocket updates
- **NAOS Registry** — Agent template registry (Natural Agent Operating System)
- **Queen Orchestrator** — Meta-agent that coordinates the swarm; configuration and monitoring

##### CRM Module (9 Pages)

Full customer relationship management integrated with the venture context:

| Page              | Route                    | Description                                          |
| ----------------- | ------------------------ | ---------------------------------------------------- |
| Dashboard         | `/crm`                   | Pipeline overview, conversion funnel, activity feed  |
| Contacts          | `/crm/contacts`          | Contact list with advanced filters, bulk actions     |
| Contact Detail    | `/crm/contacts/[id]`     | Full contact profile, activity timeline, deals       |
| Organizations     | `/crm/organizations`     | Company management, hierarchy, contact mapping       |
| Org Detail        | `/crm/organizations/[id]`| Org profile, associated contacts, deals              |
| Deals             | `/crm/deals`             | Kanban pipeline view, drag-and-drop stage changes    |
| Deal Detail       | `/crm/deals/[id]`        | Deal profile, activities, proposals, documents       |
| Pipeline Config   | `/crm/pipeline`          | Pipeline stage configuration, automation rules       |
| Forecast          | `/crm/forecast`          | Revenue forecasting, weighted pipeline, charts       |

#### Layout System

The application uses a 5-level nested layout system:

```
Level 1: Root Layout (app/layout.tsx)
├── Fonts (Inter, JetBrains Mono)
├── Metadata (title template, OG tags)
├── RootProviders
│   ├── ThemeProvider (HeroUI + venture themes)
│   ├── AuthProvider (Better Auth session)
│   ├── TRPCProvider (React Query + tRPC)
│   └── VentureProvider (Chameleon Engine)
│
├── Level 2: Route Group Layouts
│   ├── (auth)/layout.tsx — Centered card, no nav
│   ├── (dashboard)/layout.tsx — Sidebar + header shell
│   └── (public)/layout.tsx — Minimal public layout
│
│   └── Level 3: Module Layouts
│       ├── admin/layout.tsx — Admin sub-navigation
│       ├── crm/layout.tsx — CRM sidebar tabs
│       ├── ai-command/layout.tsx — AI module header
│       └── ...
│
│       └── Level 4: Section Layouts
│           ├── admin/users/layout.tsx — User management tabs
│           └── crm/contacts/layout.tsx — Contact filters
│
│           └── Level 5: Page-level
│               └── admin/users/[userId]/layout.tsx — User detail tabs
```

Each layout level adds context and UI chrome:
- **Level 1** — Global providers, fonts, metadata
- **Level 2** — Authentication gate, navigation shell
- **Level 3** — Module-specific navigation, breadcrumb context
- **Level 4** — Section tabs, filter panels
- **Level 5** — Entity-level tabs (profile, activity, settings)

#### Next.js Middleware Pipeline

The Edge middleware (`middleware.ts`) runs on every request before the application:

```typescript
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID();

  // 1. Security Headers
  const response = addSecurityHeaders(NextResponse.next(), {
    csp: getCSPDirectives(),
    hsts: 'max-age=31536000; includeSubDomains',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
  });

  // 2. Request ID
  response.headers.set('x-request-id', requestId);

  // 3. Public routes — skip auth
  if (isPublicRoute(pathname)) {
    return response;
  }

  // 4. Session validation
  const session = await getSession(request);
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Route-level permission check
  const requiredPermission = getRoutePermission(pathname);
  if (requiredPermission && !hasPermission(session, requiredPermission)) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // 6. Venture context resolution
  const ventureSlug = extractVentureSlug(pathname, session);
  if (ventureSlug) {
    response.headers.set('x-venture-slug', ventureSlug);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
  ],
};
```

#### Zustand Stores (10)

Client-side state management uses Zustand v5 with middleware:

| Store                    | Purpose                                           | Persistence   |
| ------------------------ | ------------------------------------------------- | ------------- |
| `navigation.store`       | Sidebar state, breadcrumbs, active section        | `localStorage`|
| `auth-ui.store`          | Login form state, MFA flow, session refresh       | None (memory) |
| `crm.store`              | Pipeline view, contact filters, deal sort         | `sessionStorage` |
| `ai-command.store`       | Agent selection, HITL queue filters               | `sessionStorage` |
| `invoicing.store`        | Invoice drafts, line item editor                  | `localStorage`|
| `theme.store`            | Theme preference, reduced motion                  | `localStorage`|
| `notification.store`     | Toast queue, unread count, sound preference       | `localStorage`|
| `search.store`           | Cmd+K state, recent searches, results             | `sessionStorage` |
| `table.store`            | DataTable column visibility, sorts, page size     | `localStorage`|
| `workspace.store`        | Panel sizes, collapsed state, layout mode         | `localStorage`|

```typescript
// Example: Navigation store with persist middleware
interface NavigationState {
  layer: 'global' | 'venture' | 'module';
  currentVenture: VentureSlug | null;
  globalSection: string;
  ventureSection: string;
  activeModule: string | null;
  sidebarCollapsed: boolean;
  breadcrumbs: Breadcrumb[];
  recentVentures: VentureSlug[];
}

interface NavigationActions {
  switchToVenture: (slug: VentureSlug) => void;
  setGlobalSection: (section: string) => void;
  toggleSidebar: () => void;
  pushBreadcrumb: (crumb: Breadcrumb) => void;
  addRecentVenture: (slug: VentureSlug) => void;
}

export const useNavigationStore = create<NavigationState & NavigationActions>()(
  persist(
    (set, get) => ({
      layer: 'global',
      currentVenture: null,
      globalSection: 'mission-control',
      ventureSection: 'dashboard',
      activeModule: null,
      sidebarCollapsed: false,
      breadcrumbs: [],
      recentVentures: [],

      switchToVenture: (slug) =>
        set({
          layer: 'venture',
          currentVenture: slug,
          ventureSection: 'dashboard',
        }),

      setGlobalSection: (section) =>
        set({ globalSection: section, layer: 'global' }),

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      pushBreadcrumb: (crumb) =>
        set((state) => ({
          breadcrumbs: [...state.breadcrumbs.slice(-4), crumb],
        })),

      addRecentVenture: (slug) =>
        set((state) => ({
          recentVentures: [
            slug,
            ...state.recentVentures.filter((v) => v !== slug),
          ].slice(0, 5),
        })),
    }),
    {
      name: 'mcv-navigation',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        recentVentures: state.recentVentures,
      }),
    }
  )
);
```

#### Venture Admin (Planned)

The Venture Admin is a **tenant-scoped** portal for individual venture operators. It shares most feature modules with the Super-Admin but operates in a fixed venture context:

| Dimension       | Super-Admin                     | Venture Admin                  |
| --------------- | ------------------------------- | ------------------------------ |
| **Scope**       | All ventures (Tier 0)           | Single venture (Tier 1)        |
| **Domain**      | `admin.mcv.one`                 | `{venture}.mcv.one`            |
| **Navigation**  | Full 18-section global nav      | Venture nav only               |
| **Permissions** | Full RBAC (Tier 0–3)            | Venture RBAC (Tier 1–3)        |
| **Exclusive**   | Portfolio, Treasury, Token Economy, Strategy | —              |

The Venture Admin will reuse feature modules from the Super-Admin, but with a fixed venture context and reduced navigation. The Chameleon Engine will render the venture's brand identity as the primary theme.

---

### 3.3 @mcv/ui — Component Library & Design System

**Classification:** PUBLISHABLE · **Version:** 1.0.0

`@mcv/ui` is the comprehensive design system and component library for the MCV.ONE ecosystem. Built on HeroUI (formerly NextUI), it provides every UI building block needed across all 9 ventures with consistent user experiences.

**This is the face of MCV.ONE — every pixel, interaction, and animation flows from this package.**

#### Key Metrics

| Metric               | Value |
| -------------------- | ----- |
| Total components     | 508   |
| Component categories | 71    |
| Pre-built UI patterns| 85    |
| Venture brand themes | 9     |
| Design token scales  | 10    |

#### Package Architecture

```
@mcv/ui/
├── src/
│   ├── components/                    # 508 components across 71 categories
│   │   ├── foundation/                # Primitives & layout (71 components)
│   │   │   ├── primitives/
│   │   │   │   ├── Box.tsx
│   │   │   │   ├── Flex.tsx
│   │   │   │   ├── Grid.tsx
│   │   │   │   ├── Stack.tsx
│   │   │   │   └── Center.tsx
│   │   │   ├── typography/
│   │   │   │   ├── Heading.tsx
│   │   │   │   ├── Text.tsx
│   │   │   │   ├── Code.tsx
│   │   │   │   ├── Prose.tsx
│   │   │   │   └── Truncate.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Container.tsx
│   │   │   │   ├── Section.tsx
│   │   │   │   ├── Divider.tsx
│   │   │   │   ├── Spacer.tsx
│   │   │   │   └── AspectRatio.tsx
│   │   │   ├── surfaces/
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Paper.tsx
│   │   │   │   ├── Panel.tsx
│   │   │   │   └── GlassCard.tsx
│   │   │   ├── media/
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── Image.tsx
│   │   │   │   ├── Video.tsx
│   │   │   │   └── Icon.tsx
│   │   │   ├── icons/
│   │   │   │   └── (Lucide re-exports + custom icons)
│   │   │   ├── animations/
│   │   │   │   ├── FadeIn.tsx
│   │   │   │   ├── SlideIn.tsx
│   │   │   │   ├── ScaleIn.tsx
│   │   │   │   ├── Shimmer.tsx
│   │   │   │   └── Skeleton.tsx
│   │   │   └── accessibility/
│   │   │       ├── VisuallyHidden.tsx
│   │   │       ├── SkipLink.tsx
│   │   │       ├── FocusTrap.tsx
│   │   │       └── LiveRegion.tsx
│   │   │
│   │   ├── forms/                     # Form controls (82 components)
│   │   │   ├── inputs/                # 18 input types
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Textarea.tsx
│   │   │   │   ├── NumberInput.tsx
│   │   │   │   ├── PasswordInput.tsx
│   │   │   │   ├── SearchInput.tsx
│   │   │   │   ├── PhoneInput.tsx
│   │   │   │   ├── CurrencyInput.tsx
│   │   │   │   ├── PercentageInput.tsx
│   │   │   │   ├── URLInput.tsx
│   │   │   │   ├── EmailInput.tsx
│   │   │   │   ├── ColorInput.tsx
│   │   │   │   ├── SlugInput.tsx
│   │   │   │   ├── TagInput.tsx
│   │   │   │   ├── OTPInput.tsx
│   │   │   │   ├── MaskedInput.tsx
│   │   │   │   ├── AutocompleteInput.tsx
│   │   │   │   ├── AddressInput.tsx
│   │   │   │   └── CreditCardInput.tsx
│   │   │   ├── selects/               # 8 select variants
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── MultiSelect.tsx
│   │   │   │   ├── Combobox.tsx
│   │   │   │   ├── TreeSelect.tsx
│   │   │   │   ├── VentureSelect.tsx
│   │   │   │   ├── UserSelect.tsx
│   │   │   │   ├── RoleSelect.tsx
│   │   │   │   └── StatusSelect.tsx
│   │   │   ├── pickers/               # 8 pickers
│   │   │   │   ├── DatePicker.tsx
│   │   │   │   ├── TimePicker.tsx
│   │   │   │   ├── DateRangePicker.tsx
│   │   │   │   ├── ColorPicker.tsx
│   │   │   │   ├── IconPicker.tsx
│   │   │   │   ├── EmojiPicker.tsx
│   │   │   │   ├── FilePicker.tsx
│   │   │   │   └── FontPicker.tsx
│   │   │   ├── editors/               # 6 rich editors
│   │   │   │   ├── RichTextEditor.tsx
│   │   │   │   ├── MarkdownEditor.tsx
│   │   │   │   ├── CodeEditor.tsx
│   │   │   │   ├── JSONEditor.tsx
│   │   │   │   ├── SQLEditor.tsx
│   │   │   │   └── TemplateEditor.tsx
│   │   │   ├── uploads/               # 5 upload components
│   │   │   │   ├── FileUpload.tsx
│   │   │   │   ├── ImageUpload.tsx
│   │   │   │   ├── AvatarUpload.tsx
│   │   │   │   ├── BulkUpload.tsx
│   │   │   │   └── DragDropZone.tsx
│   │   │   ├── toggles/
│   │   │   │   ├── Switch.tsx
│   │   │   │   ├── Checkbox.tsx
│   │   │   │   ├── CheckboxGroup.tsx
│   │   │   │   ├── Radio.tsx
│   │   │   │   └── RadioGroup.tsx
│   │   │   ├── buttons/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── IconButton.tsx
│   │   │   │   ├── ButtonGroup.tsx
│   │   │   │   ├── ToggleButton.tsx
│   │   │   │   ├── SplitButton.tsx
│   │   │   │   └── FAB.tsx
│   │   │   ├── sliders/
│   │   │   │   ├── Slider.tsx
│   │   │   │   └── RangeSlider.tsx
│   │   │   └── form-layout/
│   │   │       ├── Form.tsx
│   │   │       ├── FormField.tsx
│   │   │       ├── FormSection.tsx
│   │   │       ├── FormActions.tsx
│   │   │       └── FormWizard.tsx
│   │   │
│   │   ├── data-display/              # Data visualization (119 components)
│   │   │   ├── tables/                # 12 table variants
│   │   │   │   ├── DataTable.tsx       # Full-featured CRUD table
│   │   │   │   ├── SimpleTable.tsx     # Lightweight read-only
│   │   │   │   ├── TreeTable.tsx       # Hierarchical data
│   │   │   │   ├── PivotTable.tsx      # Cross-tab analysis
│   │   │   │   ├── VirtualTable.tsx    # Virtualized for 10K+ rows
│   │   │   │   ├── EditableTable.tsx   # Inline cell editing
│   │   │   │   ├── GroupedTable.tsx    # Row grouping
│   │   │   │   ├── MasterDetail.tsx    # Expandable rows
│   │   │   │   ├── ComparisonTable.tsx # Side-by-side comparison
│   │   │   │   ├── TimelineTable.tsx   # Time-series data
│   │   │   │   ├── KanbanTable.tsx     # Kanban + table hybrid
│   │   │   │   └── AuditTable.tsx      # Audit log viewer
│   │   │   ├── charts/                # 18 chart types
│   │   │   │   ├── LineChart.tsx
│   │   │   │   ├── BarChart.tsx
│   │   │   │   ├── AreaChart.tsx
│   │   │   │   ├── PieChart.tsx
│   │   │   │   ├── DonutChart.tsx
│   │   │   │   ├── ScatterChart.tsx
│   │   │   │   ├── RadarChart.tsx
│   │   │   │   ├── TreemapChart.tsx
│   │   │   │   ├── SankeyChart.tsx
│   │   │   │   ├── FunnelChart.tsx
│   │   │   │   ├── GaugeChart.tsx
│   │   │   │   ├── HeatmapChart.tsx
│   │   │   │   ├── CandlestickChart.tsx
│   │   │   │   ├── WaterfallChart.tsx
│   │   │   │   ├── BubbleChart.tsx
│   │   │   │   ├── ComboChart.tsx
│   │   │   │   ├── SparklineChart.tsx
│   │   │   │   └── MiniChart.tsx
│   │   │   ├── metrics/               # 8 metric displays
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── TrendIndicator.tsx
│   │   │   │   ├── ProgressRing.tsx
│   │   │   │   ├── Scorecard.tsx
│   │   │   │   ├── ComparisonMetric.tsx
│   │   │   │   ├── SparklineMetric.tsx
│   │   │   │   └── GoalTracker.tsx
│   │   │   ├── cards/                 # 12 card types
│   │   │   │   ├── InfoCard.tsx
│   │   │   │   ├── ProfileCard.tsx
│   │   │   │   ├── PricingCard.tsx
│   │   │   │   ├── FeatureCard.tsx
│   │   │   │   ├── TestimonialCard.tsx
│   │   │   │   ├── ArticleCard.tsx
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── EventCard.tsx
│   │   │   │   ├── NotificationCard.tsx
│   │   │   │   ├── AgentCard.tsx
│   │   │   │   ├── VentureCard.tsx
│   │   │   │   └── DealCard.tsx
│   │   │   ├── lists/
│   │   │   │   ├── List.tsx
│   │   │   │   ├── DescriptionList.tsx
│   │   │   │   ├── Timeline.tsx
│   │   │   │   ├── ActivityFeed.tsx
│   │   │   │   └── VirtualList.tsx
│   │   │   ├── badges/
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── StatusBadge.tsx
│   │   │   │   ├── CountBadge.tsx
│   │   │   │   ├── PriorityBadge.tsx
│   │   │   │   └── VentureBadge.tsx
│   │   │   └── misc/
│   │   │       ├── Tooltip.tsx
│   │   │       ├── Popover.tsx
│   │   │       ├── Chip.tsx
│   │   │       ├── Tag.tsx
│   │   │       ├── Avatar.tsx
│   │   │       ├── AvatarGroup.tsx
│   │   │       ├── Countdown.tsx
│   │   │       ├── Calendar.tsx
│   │   │       ├── JSONViewer.tsx
│   │   │       └── CodeBlock.tsx
│   │   │
│   │   ├── navigation/               # Navigation (44 components)
│   │   │   ├── sidebar/              # 6 sidebar variants
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── CollapsibleSidebar.tsx
│   │   │   │   ├── MiniSidebar.tsx
│   │   │   │   ├── FloatingSidebar.tsx
│   │   │   │   ├── VentureSidebar.tsx
│   │   │   │   └── SettingsSidebar.tsx
│   │   │   ├── tabs/
│   │   │   │   ├── Tabs.tsx
│   │   │   │   ├── VerticalTabs.tsx
│   │   │   │   ├── ScrollableTabs.tsx
│   │   │   │   └── SegmentedControl.tsx
│   │   │   ├── breadcrumbs/
│   │   │   │   ├── Breadcrumbs.tsx
│   │   │   │   └── BreadcrumbsAuto.tsx
│   │   │   ├── pagination/
│   │   │   │   ├── Pagination.tsx
│   │   │   │   ├── CursorPagination.tsx
│   │   │   │   └── InfiniteScroll.tsx
│   │   │   ├── menus/
│   │   │   │   ├── DropdownMenu.tsx
│   │   │   │   ├── ContextMenu.tsx
│   │   │   │   ├── CommandPalette.tsx
│   │   │   │   └── ActionMenu.tsx
│   │   │   ├── steppers/
│   │   │   │   ├── Stepper.tsx
│   │   │   │   ├── VerticalStepper.tsx
│   │   │   │   └── WizardStepper.tsx
│   │   │   ├── links/
│   │   │   │   ├── Link.tsx
│   │   │   │   ├── NavLink.tsx
│   │   │   │   └── BackLink.tsx
│   │   │   └── bars/
│   │   │       ├── Navbar.tsx
│   │   │       ├── Toolbar.tsx
│   │   │       └── BottomBar.tsx
│   │   │
│   │   ├── feedback/                  # Feedback & status (41 components)
│   │   │   ├── alerts/
│   │   │   │   ├── Alert.tsx
│   │   │   │   ├── Banner.tsx
│   │   │   │   ├── Callout.tsx
│   │   │   │   └── InlineAlert.tsx
│   │   │   ├── toasts/
│   │   │   │   ├── Toast.tsx
│   │   │   │   ├── ToastProvider.tsx
│   │   │   │   ├── Sonner.tsx
│   │   │   │   └── NotificationToast.tsx
│   │   │   ├── modals/
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── ConfirmModal.tsx
│   │   │   │   ├── AlertModal.tsx
│   │   │   │   └── FullScreenModal.tsx
│   │   │   ├── progress/
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   ├── CircularProgress.tsx
│   │   │   │   ├── StepProgress.tsx
│   │   │   │   └── UploadProgress.tsx
│   │   │   ├── loading/
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── Skeleton.tsx
│   │   │   │   ├── Placeholder.tsx
│   │   │   │   ├── LoadingOverlay.tsx
│   │   │   │   └── PulseLoader.tsx
│   │   │   ├── errors/
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   ├── ErrorPage.tsx
│   │   │   │   ├── NotFound.tsx
│   │   │   │   ├── Unauthorized.tsx
│   │   │   │   └── ServerError.tsx
│   │   │   └── empty/
│   │   │       ├── EmptyState.tsx
│   │   │       ├── NoResults.tsx
│   │   │       └── ComingSoon.tsx
│   │   │
│   │   ├── overlays/                  # Overlays (29 components)
│   │   │   ├── modals/
│   │   │   ├── drawers/
│   │   │   ├── dialogs/
│   │   │   ├── sheets/
│   │   │   └── lightboxes/
│   │   │
│   │   └── specialized/              # Domain-specific (122 components)
│   │       ├── auth/                  # 12 auth components
│   │       │   ├── LoginForm.tsx
│   │       │   ├── RegisterForm.tsx
│   │       │   ├── ForgotPasswordForm.tsx
│   │       │   ├── MFASetup.tsx
│   │       │   ├── MFAChallenge.tsx
│   │       │   ├── PasskeySetup.tsx
│   │       │   ├── OAuthButtons.tsx
│   │       │   ├── SessionList.tsx
│   │       │   ├── APIKeyManager.tsx
│   │       │   ├── WalletConnect.tsx
│   │       │   ├── PermissionGate.tsx
│   │       │   └── RoleSelector.tsx
│   │       ├── commerce/              # 18 commerce components
│   │       │   ├── ProductGrid.tsx
│   │       │   ├── PriceDisplay.tsx
│   │       │   ├── CartSummary.tsx
│   │       │   ├── InvoicePreview.tsx
│   │       │   ├── PaymentForm.tsx
│   │       │   ├── SubscriptionCard.tsx
│   │       │   ├── InvoiceLineEditor.tsx
│   │       │   ├── TaxCalculator.tsx
│   │       │   └── ... (18 total)
│   │       ├── finance/               # 10 finance components
│   │       │   ├── PortfolioChart.tsx
│   │       │   ├── CapitalStack.tsx
│   │       │   ├── TreasuryDashboard.tsx
│   │       │   ├── BudgetTracker.tsx
│   │       │   └── ... (10 total)
│   │       ├── gaming/                # 12 gaming components (BetEdge)
│   │       │   ├── OddsDisplay.tsx
│   │       │   ├── BetSlip.tsx
│   │       │   ├── LiveScoreboard.tsx
│   │       │   ├── LeaderboardTable.tsx
│   │       │   └── ... (12 total)
│   │       ├── ai/                    # 8 AI components
│   │       │   ├── AgentStatusCard.tsx
│   │       │   ├── SwarmVisualization.tsx
│   │       │   ├── HITLApprovalCard.tsx
│   │       │   ├── ModelSelector.tsx
│   │       │   ├── PromptEditor.tsx
│   │       │   ├── TokenUsageChart.tsx
│   │       │   ├── AgentTimeline.tsx
│   │       │   └── ChatInterface.tsx
│   │       ├── web3/                  # 12 web3 components
│   │       │   ├── WalletButton.tsx
│   │       │   ├── TokenBalance.tsx
│   │       │   ├── TransactionHistory.tsx
│   │       │   ├── NFTGallery.tsx
│   │       │   └── ... (12 total)
│   │       └── admin/                 # 15 admin components
│   │           ├── AuditLogViewer.tsx
│   │           ├── FeatureFlagToggle.tsx
│   │           ├── UserManagementTable.tsx
│   │           ├── PermissionMatrix.tsx
│   │           ├── VentureSelector.tsx
│   │           ├── SystemHealthDashboard.tsx
│   │           └── ... (15 total)
│   │
│   ├── patterns/                      # 85 pre-built UI patterns
│   │   ├── admin/
│   │   │   ├── MCVShell.tsx           # Main admin shell layout
│   │   │   ├── CRUDPage.tsx           # Standard list + create + edit pattern
│   │   │   ├── DetailPage.tsx         # Entity detail with tabs
│   │   │   ├── DashboardPage.tsx      # KPI + charts + feed layout
│   │   │   ├── SettingsPage.tsx       # Settings form with sections
│   │   │   └── ... (20 total)
│   │   ├── data/
│   │   │   ├── DataTablePage.tsx      # Table + filters + actions
│   │   │   ├── KanbanBoard.tsx        # Drag-and-drop board
│   │   │   ├── CalendarView.tsx       # Event calendar
│   │   │   ├── GanttView.tsx          # Project timeline
│   │   │   └── ... (15 total)
│   │   ├── forms/
│   │   │   ├── WizardForm.tsx         # Multi-step form
│   │   │   ├── InlineEditForm.tsx     # Click-to-edit
│   │   │   ├── BulkEditForm.tsx       # Multi-record editing
│   │   │   └── ... (10 total)
│   │   ├── marketing/
│   │   │   ├── LandingHero.tsx
│   │   │   ├── FeatureSection.tsx
│   │   │   ├── PricingSection.tsx
│   │   │   └── ... (10 total)
│   │   └── misc/
│   │       ├── OnboardingFlow.tsx
│   │       ├── CommandPalette.tsx
│   │       ├── NotificationCenter.tsx
│   │       └── ... (30 total)
│   │
│   ├── themes/                        # Venture theme system
│   │   ├── base.ts                    # Base theme tokens
│   │   ├── dark.ts                    # Dark mode overrides
│   │   ├── light.ts                   # Light mode overrides
│   │   ├── ventures/
│   │   │   ├── betedge.ts             # BetEdge AI (Green)
│   │   │   ├── edgeiq.ts              # EdgeIQ (Blue)
│   │   │   ├── mcvgg.ts              # MCVGG (Purple)
│   │   │   ├── studio.ts             # Studio (Amber)
│   │   │   ├── agency.ts             # Agency (Pink)
│   │   │   ├── sentinel.ts           # Sentinel (Red)
│   │   │   ├── ventures-hub.ts       # Ventures Hub
│   │   │   ├── capital.ts            # Capital
│   │   │   └── foundation.ts         # Foundation
│   │   └── tokens/
│   │       ├── colors.ts             # Color token scales
│   │       ├── typography.ts          # Font families, sizes, weights
│   │       ├── spacing.ts            # Spacing scale
│   │       ├── radii.ts              # Border radius scale
│   │       ├── shadows.ts            # Shadow definitions
│   │       ├── transitions.ts        # Animation timing
│   │       ├── breakpoints.ts        # Responsive breakpoints
│   │       └── z-index.ts            # Z-index stacking order
│   │
│   ├── hooks/                         # Shared React hooks
│   │   ├── useTheme.ts
│   │   ├── useVenture.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useBreakpoint.ts
│   │   ├── useClickOutside.ts
│   │   ├── useDebounce.ts
│   │   ├── useFocusTrap.ts
│   │   ├── useIntersection.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useKeyboardShortcut.ts
│   │   ├── useReducedMotion.ts
│   │   └── useScrollPosition.ts
│   │
│   ├── utils/                         # UI utilities
│   │   ├── cn.ts                      # clsx + tailwind-merge
│   │   ├── variants.ts               # tailwind-variants helpers
│   │   ├── colors.ts                 # Color manipulation
│   │   ├── format.ts                 # Number, date, currency formatting
│   │   └── accessibility.ts          # ARIA attribute helpers
│   │
│   └── index.ts                       # Package exports
│
├── .storybook/                        # Storybook configuration
│   ├── main.ts
│   ├── preview.ts
│   └── theme.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

#### Design System Features

##### Design Tokens

The design system is built on a comprehensive token architecture:

| Token Scale    | Values                                          | CSS Variable Prefix  |
| -------------- | ----------------------------------------------- | -------------------- |
| **Colors**     | 12 semantic colors × 11 shades (50–950)         | `--mcv-color-*`      |
| **Typography** | 3 font families, 13 sizes, 9 weights            | `--mcv-font-*`       |
| **Spacing**    | 16 values (0, 0.5, 1, 1.5, 2, ... 96)          | `--mcv-space-*`      |
| **Radii**      | 8 values (none, sm, md, lg, xl, 2xl, 3xl, full) | `--mcv-radius-*`     |
| **Shadows**    | 6 elevations (none, sm, md, lg, xl, 2xl)        | `--mcv-shadow-*`     |
| **Transitions**| 5 durations, 4 easing curves                    | `--mcv-transition-*` |
| **Breakpoints**| 6 (xs, sm, md, lg, xl, 2xl)                     | Media queries        |
| **Z-Index**    | 8 layers (base, dropdown, sticky, modal, etc.)  | `--mcv-z-*`          |
| **Opacity**    | 10 values (0, 5, 10, 20, ..., 100)              | `--mcv-opacity-*`    |
| **Line Heights**| 6 values (none, tight, snug, normal, relaxed, loose) | `--mcv-leading-*` |

##### Venture Themes (Chameleon Engine)

Each of the 9 ventures has a complete theme extending the base tokens:

| Venture           | Primary Color         | Accent          | Category    | Domain              |
| ----------------- | --------------------- | --------------- | ----------- | ------------------- |
| **BetEdge AI**    | `#22c55e` (Green)     | `#10b981`       | Consumer    | `betedge.app`       |
| **EdgeIQ**        | `#3b82f6` (Blue)      | `#6366f1`       | Platform    | `edgeiq.mcv.one`    |
| **MCVGG**         | `#8b5cf6` (Purple)    | `#a855f7`       | Consumer    | `mcvgg.com`         |
| **Studio**        | `#f59e0b` (Amber)     | `#f97316`       | Service     | `studio.mcv.one`    |
| **Agency**        | `#ec4899` (Pink)      | `#f43f5e`       | Service     | `agency.mcv.one`    |
| **Sentinel**      | `#ef4444` (Red)       | `#dc2626`       | Platform    | `sentinel.mcv.one`  |
| **Ventures Hub**  | `#06b6d4` (Cyan)      | `#0891b2`       | Platform    | `ventures.mcv.one`  |
| **Capital**       | `#eab308` (Yellow)    | `#ca8a04`       | Service     | `capital.mcv.one`   |
| **Foundation**    | `#64748b` (Slate)     | `#475569`       | Platform    | `foundation.mcv.one`|

Theme switching works through CSS custom properties — no re-render required:

```typescript
// ThemeProvider applies venture tokens as CSS variables
function ThemeProvider({ venture, children }: ThemeProviderProps) {
  const theme = getVentureTheme(venture);

  return (
    <div
      style={tokensToCSSVars(theme.tokens)}
      className={cn('min-h-screen bg-background text-foreground', theme.className)}
    >
      <ThemeContext.Provider value={theme}>
        {children}
      </ThemeContext.Provider>
    </div>
  );
}

// Components consume tokens via Tailwind classes
function VentureCard({ venture }: { venture: Venture }) {
  return (
    <Card className="bg-primary/10 border-primary/20">
      <CardHeader>
        <Badge color="primary">{venture.name}</Badge>
      </CardHeader>
      <CardBody>
        <Text className="text-primary-foreground">{venture.description}</Text>
      </CardBody>
    </Card>
  );
}
```

##### Component API Standards

Every component in `@mcv/ui` follows consistent API patterns:

```typescript
/** Base props shared by all components */
interface BaseComponentProps {
  variant?: 'solid' | 'outline' | 'ghost' | 'link' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/** Compound component pattern for complex components */
// Usage: <DataTable columns={...} data={...}>
//          <DataTable.Header />
//          <DataTable.Body />
//          <DataTable.Footer />
//          <DataTable.Pagination />
//        </DataTable>
```

##### Accessibility (WCAG 2.1 AA)

Every component is built with accessibility as a first-class concern:

| Requirement              | Implementation                                              |
| ------------------------ | ----------------------------------------------------------- |
| **Keyboard navigation**  | All interactive components support full keyboard control     |
| **Focus management**     | Focus trapping in modals, focus restoration on close         |
| **ARIA attributes**      | Proper roles, labels, descriptions on all components        |
| **Color contrast**       | All text meets 4.5:1 (normal) or 3:1 (large) contrast ratio|
| **Reduced motion**       | `prefers-reduced-motion` respected for all animations       |
| **Screen reader**        | Live regions for dynamic content, descriptive labels        |
| **Skip links**           | Skip-to-main-content link on every page                     |
| **Form errors**          | Error messages associated via `aria-describedby`            |

##### Storybook Documentation

The complete library is documented in Storybook:

```
Storybook Structure:
├── Foundation/            # 71 components
│   ├── Primitives
│   ├── Typography
│   ├── Layout
│   ├── Surfaces
│   ├── Media
│   ├── Icons
│   ├── Animations
│   └── Accessibility
├── Forms/                 # 82 components
│   ├── Inputs
│   ├── Selects
│   ├── Pickers
│   ├── Editors
│   ├── Uploads
│   ├── Toggles
│   ├── Buttons
│   ├── Sliders
│   └── Form Layout
├── Data Display/          # 119 components
│   ├── Tables
│   ├── Charts
│   ├── Metrics
│   ├── Cards
│   ├── Lists
│   ├── Badges
│   └── Misc
├── Navigation/            # 44 components
├── Feedback/              # 41 components
├── Overlays/              # 29 components
├── Specialized/           # 122 components
│   ├── Auth
│   ├── Commerce
│   ├── Finance
│   ├── Gaming
│   ├── AI
│   ├── Web3
│   └── Admin
└── Patterns/              # 85 pre-built layouts
    ├── Admin
    ├── Data
    ├── Forms
    ├── Marketing
    └── Misc
```

Each story includes:
- **Default** — Component with default props
- **Variants** — All visual variants (solid, outline, ghost, etc.)
- **Sizes** — All size variants (xs through xl)
- **Colors** — All semantic color variants
- **States** — Disabled, loading, error, empty
- **Interactive** — Storybook interactions for testing
- **Code** — Usage examples with copy-paste snippets
- **Accessibility** — a11y addon results

---

## Cross-Package Data Flow

Understanding how data flows through Tier 6 is essential. Here is the complete lifecycle of a user request:

### Full Request Lifecycle

```
┌────────────────────────────────────────────────────────────────────────┐
│                          USER ACTION                                   │
│  User clicks "Create Invoice" button in the Invoicing module          │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  1. UI COMPONENT (@mcv/ui)                                            │
│                                                                        │
│  <Button onClick={handleCreate} isLoading={mutation.isPending}>       │
│    Create Invoice                                                      │
│  </Button>                                                             │
│                                                                        │
│  The Button component from @mcv/ui renders with venture theme,        │
│  handles loading state, disabled state, and accessibility.            │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  2. FEATURE MODULE (@mcv/apps/features/invoicing)                     │
│                                                                        │
│  function CreateInvoicePage() {                                        │
│    const form = useForm<CreateInvoiceInput>({                         │
│      resolver: zodResolver(createInvoiceSchema), // from @mcv/api     │
│    });                                                                 │
│                                                                        │
│    const mutation = trpc.invoicing.create.useMutation({               │
│      onSuccess: (invoice) => {                                        │
│        toast.success(`Invoice ${invoice.number} created`);            │
│        router.push(`/invoicing/${invoice.id}`);                       │
│      },                                                                │
│      onError: (error) => {                                            │
│        toast.error(error.message);                                    │
│      },                                                                │
│    });                                                                 │
│                                                                        │
│    const handleCreate = form.handleSubmit((data) => {                 │
│      mutation.mutate(data);                                           │
│    });                                                                 │
│  }                                                                     │
│                                                                        │
│  The feature module validates the form, triggers the tRPC mutation,   │
│  and handles success/error states with optimistic updates.            │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  3. tRPC CLIENT (@mcv/apps/lib/trpc.ts)                               │
│                                                                        │
│  React Query serializes the input, adds auth headers (session         │
│  cookie), venture context header (x-venture-id), and sends the        │
│  request to the tRPC HTTP handler.                                    │
│                                                                        │
│  POST /api/trpc/invoicing.create                                      │
│  Headers:                                                              │
│    Cookie: better-auth.session=eyJ...                                 │
│    x-venture-id: betedge                                              │
│    x-request-id: 550e8400-e29b-41d4-a716-446655440000                │
│  Body: { "json": { "clientId": "...", "items": [...], ... } }        │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  4. NEXT.JS API ROUTE (@mcv/apps/app/api/trpc/[trpc]/route.ts)       │
│                                                                        │
│  The Next.js API route handler creates the tRPC context from the      │
│  request headers and delegates to the tRPC server.                    │
│                                                                        │
│  export const POST = fetchRequestHandler({                            │
│    router: appRouter,                                                 │
│    createContext: ({ req }) => createContext(req.headers),             │
│  });                                                                   │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  5. MIDDLEWARE CHAIN (@mcv/api/middleware)                             │
│                                                                        │
│  Request passes through:                                               │
│  ┌─ requestId + timing ─┐                                             │
│  ├─ logging ─────────────┤                                             │
│  ├─ rate limiting ───────┤  (general preset: 100/min per user)        │
│  ├─ auth validation ─────┤  (validates Better Auth session)           │
│  ├─ user resolution ─────┤  (loads full user profile)                 │
│  ├─ venture context ─────┤  (resolves venture from header)            │
│  ├─ permission check ────┤  (verifies invoicing:create permission)    │
│  └─ input validation ────┘  (Zod schema: createInvoiceSchema)        │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  6. tRPC ROUTER (@mcv/api/routers/invoicing/invoicing.router.ts)      │
│                                                                        │
│  invoicing.create = ventureProcedure                                  │
│    .input(createInvoiceSchema)                                        │
│    .mutation(async ({ ctx, input }) => {                              │
│      const invoice = await ctx.services.invoicing.create(input, ctx); │
│      await ctx.services.audit.log('invoice.created', {...}, ctx);     │
│      await ctx.services.notifications.send({                          │
│        userId: input.clientId,                                        │
│        type: 'invoice_created',                                       │
│        data: { invoiceId: invoice.id },                               │
│      }, ctx);                                                          │
│      return invoice;                                                   │
│    });                                                                 │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  7. DOMAIN SERVICE (Tier 5 — @mcv/invoicing)                          │
│                                                                        │
│  InvoicingService.create():                                            │
│  - Generates invoice number (venture-scoped sequence)                 │
│  - Calculates line item totals, taxes, discounts                      │
│  - Validates client exists in CRM                                     │
│  - Creates invoice record in database                                 │
│  - Generates PDF via template engine                                  │
│  - Stores PDF in S3 via @mcv/storage                                  │
│  - Returns complete invoice object                                    │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  8. DATABASE (Tier 2 — @mcv/db)                                       │
│                                                                        │
│  Drizzle ORM executes:                                                │
│  INSERT INTO invoices (venture_id, client_id, number, ...)            │
│  VALUES ($1, $2, $3, ...) RETURNING *;                                │
│                                                                        │
│  INSERT INTO invoice_items (invoice_id, description, qty, price, ...) │
│  VALUES ($1, $2, $3, $4, ...) RETURNING *;                            │
│                                                                        │
│  All queries are venture-scoped (WHERE venture_id = $1).              │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼ (response flows back up)
┌────────────────────────────────────────────────────────────────────────┐
│  9. RESPONSE SERIALIZATION                                            │
│                                                                        │
│  SuperJSON serializes the response, preserving Date objects,          │
│  then tRPC wraps it in the standard response format.                  │
│                                                                        │
│  {                                                                     │
│    "result": {                                                         │
│      "data": {                                                         │
│        "json": { "id": "...", "number": "INV-2026-001", ... },        │
│        "meta": { "values": { "createdAt": ["Date"] } }               │
│      }                                                                 │
│    }                                                                   │
│  }                                                                     │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  10. UI UPDATE (@mcv/apps + @mcv/ui)                                  │
│                                                                        │
│  React Query receives the response:                                   │
│  - Deserializes via SuperJSON (Date objects restored)                 │
│  - Calls onSuccess callback → toast + redirect                       │
│  - Invalidates related queries (invoice list, dashboard KPIs)        │
│  - UI re-renders with new data via React Server Components           │
│                                                                        │
│  The user sees a success toast and is redirected to the new invoice   │
│  detail page, rendered as a React Server Component with streaming.   │
└────────────────────────────────────────────────────────────────────────┘
```

### Server Action Flow (Alternative Path)

For mutations triggered from React Server Components, the flow bypasses HTTP:

```
RSC Page (server)
  │
  ├── Calls server action directly
  │   └── 'use server'
  │       async function createInvoice(formData: FormData) {
  │         const caller = createCaller(await createContext(headers()));
  │         return caller.invoicing.create(parseFormData(formData));
  │       }
  │
  ├── No HTTP round-trip — direct function call
  ├── Same middleware chain (auth, tenant, validation)
  ├── Same service layer
  └── Response streams back via RSC protocol
```

### Real-Time Data Flow (WebSocket)

```
┌──────────────┐    WebSocket     ┌──────────────┐    EventEmitter    ┌──────────────┐
│   Browser     │◄────────────────│   tRPC WS    │◄───────────────────│   Service     │
│   Component   │   subscription  │   Server     │   event emission   │   Layer       │
│               │                 │              │                    │              │
│  useSubscribe │                 │  observable  │                    │  emit.next() │
│  ({           │    { data }     │  ((emit) => {│    'notification:  │              │
│    onData:    │◄────────────────│    handler   │◄── created'        │  After DB    │
│    (notif) => │                 │  })          │                    │  insert      │
│    toast()    │                 │              │                    │              │
│  })           │                 │              │                    │              │
└──────────────┘                 └──────────────┘                    └──────────────┘
```

---

## Shared Patterns

### Authentication Flow

The complete authentication flow spans all three sub-packages:

```
┌─────────────────────────────────────────────────────────────────┐
│  AUTHENTICATION FLOW                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User visits /login                                          │
│     └── (auth) layout renders LoginForm from @mcv/ui            │
│                                                                 │
│  2. User submits credentials                                    │
│     └── trpc.auth.login.useMutation({ email, password })        │
│         └── @mcv/api validates via Better Auth                  │
│             └── @mcv/auth checks credentials + MFA status       │
│                                                                 │
│  3a. No MFA → Session created                                   │
│      └── HTTP-only cookie set                                   │
│      └── Redirect to / (Mission Control)                        │
│                                                                 │
│  3b. MFA enabled → MFA challenge                                │
│      └── Redirect to /mfa                                       │
│      └── MFAChallenge component renders (TOTP / Passkey)        │
│      └── trpc.auth.verifyMFA.useMutation({ code })              │
│      └── Session created on success                             │
│                                                                 │
│  4. Dashboard loads                                             │
│     └── Edge middleware validates session on every request       │
│     └── AuthProvider loads user profile + permissions           │
│     └── VentureProvider resolves venture context                │
│     └── Navigation builds based on permission tier              │
│                                                                 │
│  5. Session management                                          │
│     └── Auto-refresh before expiry (15-min window)              │
│     └── Concurrent session detection                            │
│     └── Force logout on security events                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tenant Resolution

Every request resolves a venture context through a priority chain:

```typescript
// Priority order for venture context resolution:
// 1. URL path parameter: /v/betedge/... → ventureSlug = 'betedge'
// 2. Request header: x-venture-id → ventureSlug from header
// 3. Session default: user.defaultVentureId → last active venture
// 4. Permission scope: if user has access to exactly one venture → auto-select
// 5. null: no venture context (super-admin global view)

async function resolveVentureContext(
  pathname: string,
  headers: Headers,
  session: Session
): Promise<VentureContext | null> {
  // 1. URL parameter
  const pathVenture = extractVentureFromPath(pathname);
  if (pathVenture) {
    return await loadVentureBySlug(pathVenture);
  }

  // 2. Header
  const headerVenture = headers.get('x-venture-id');
  if (headerVenture) {
    return await loadVentureBySlug(headerVenture);
  }

  // 3. Session default
  if (session.defaultVentureId) {
    return await loadVentureById(session.defaultVentureId);
  }

  // 4. Single-venture user
  const userVentures = await getUserVentures(session.userId);
  if (userVentures.length === 1) {
    return userVentures[0];
  }

  // 5. No context
  return null;
}
```

### Error Boundaries

Error handling uses a layered boundary strategy:

```
Root Error Boundary (app/error.tsx)
├── Catches: Unhandled errors in the entire app
├── Renders: Full-page error with "Return to Dashboard" button
├── Reports: Sends to error tracking service
│
├── Module Error Boundary (e.g., crm/error.tsx)
│   ├── Catches: Errors within the CRM module
│   ├── Renders: Module-scoped error with "Return to CRM" button
│   ├── Preserves: Sidebar and header remain functional
│   │
│   ├── Section Error Boundary (e.g., crm/contacts/error.tsx)
│   │   ├── Catches: Errors within the contacts section
│   │   ├── Renders: Section-scoped error card
│   │   ├── Preserves: Module navigation remains functional
│   │   │
│   │   └── Component Error Boundary (<ErrorBoundary> from @mcv/ui)
│   │       ├── Catches: Individual component errors
│   │       ├── Renders: Inline error card with retry button
│   │       └── Preserves: Everything else on the page
```

```typescript
// Component-level error boundary usage
function VentureHealthWidget() {
  return (
    <ErrorBoundary
      fallback={<ErrorCard title="Health data unavailable" retryable />}
      onError={(error) => captureException(error)}
    >
      <Suspense fallback={<Skeleton className="h-48" />}>
        <VentureHealthData />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Loading States

Progressive loading uses Suspense boundaries aligned with the layout hierarchy:

```
Page Load Sequence:
┌─────────────────────────────────────────────────────────────┐
│  Frame 1 (0ms): Shell renders immediately                   │
│  ┌─────────┐ ┌──────────────────────────────────────────┐  │
│  │ Sidebar  │ │  Header                                  │  │
│  │ (cached) │ │  (cached — user avatar, venture name)    │  │
│  │          │ ├──────────────────────────────────────────┤  │
│  │          │ │                                          │  │
│  │          │ │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │
│  │          │ │  │░░░░░░░░░│ │░░░░░░░░░│ │░░░░░░░░░│   │  │
│  │          │ │  │ KPI     │ │ KPI     │ │ KPI     │   │  │
│  │          │ │  │ skeleton│ │ skeleton│ │ skeleton│   │  │
│  │          │ │  └─────────┘ └─────────┘ └─────────┘   │  │
│  │          │ │                                          │  │
│  │          │ │  ┌─────────────────────────────────────┐ │  │
│  │          │ │  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │  │
│  │          │ │  │  Chart skeleton                     │ │  │
│  │          │ │  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │  │
│  │          │ │  └─────────────────────────────────────┘ │  │
│  └─────────┘ └──────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Frame 2 (~200ms): KPIs stream in                          │
│  ┌─────────┐ ┌──────────────────────────────────────────┐  │
│  │ Sidebar  │ │  Header                                  │  │
│  │          │ ├──────────────────────────────────────────┤  │
│  │          │ │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │
│  │          │ │  │ $2.4M   │ │ 1,247   │ │ 43/67   │   │  │
│  │          │ │  │ Revenue │ │ Users   │ │ Agents  │   │  │
│  │          │ │  │ ▲ 12%   │ │ ▲ 5%   │ │ ● online│   │  │
│  │          │ │  └─────────┘ └─────────┘ └─────────┘   │  │
│  │          │ │                                          │  │
│  │          │ │  ┌─────────────────────────────────────┐ │  │
│  │          │ │  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │  │
│  │          │ │  │  Chart still loading...              │ │  │
│  │          │ │  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │  │
│  │          │ │  └─────────────────────────────────────┘ │  │
│  └─────────┘ └──────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Frame 3 (~500ms): Charts stream in — page complete        │
│  ┌─────────┐ ┌──────────────────────────────────────────┐  │
│  │ Sidebar  │ │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │
│  │          │ │  │ $2.4M   │ │ 1,247   │ │ 43/67   │   │  │
│  │          │ │  └─────────┘ └─────────┘ └─────────┘   │  │
│  │          │ │  ┌─────────────────────────────────────┐ │  │
│  │          │ │  │  ████████████████████████            │ │  │
│  │          │ │  │  Revenue by Venture (live chart)     │ │  │
│  │          │ │  │  ████████████████                    │ │  │
│  │          │ │  └─────────────────────────────────────┘ │  │
│  └─────────┘ └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Optimistic Updates

Mutations use optimistic updates for instant UI feedback:

```typescript
// CRM: Move deal to new pipeline stage (drag and drop)
const moveDeal = trpc.deals.updateStage.useMutation({
  // Optimistic update — move the card immediately
  onMutate: async ({ dealId, newStage }) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries(['deals', 'pipeline']);

    // Snapshot current state
    const previousPipeline = queryClient.getQueryData(['deals', 'pipeline']);

    // Optimistically update the cache
    queryClient.setQueryData(['deals', 'pipeline'], (old: Pipeline) => {
      const deal = findDeal(old, dealId);
      return moveDealToStage(old, deal, newStage);
    });

    return { previousPipeline };
  },

  // Rollback on error
  onError: (err, variables, context) => {
    queryClient.setQueryData(['deals', 'pipeline'], context?.previousPipeline);
    toast.error('Failed to move deal. Changes reverted.');
  },

  // Sync with server on success
  onSettled: () => {
    queryClient.invalidateQueries(['deals', 'pipeline']);
  },
});
```

### Permission-Gated UI

Components and routes are conditionally rendered based on permissions:

```typescript
// Navigation: items are filtered by permission
const navigationSections: NavigationSection[] = [
  {
    title: 'Administration',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users, permission: 'users:manage' },
      { label: 'Roles', href: '/admin/roles', icon: Shield, permission: 'roles:manage' },
      { label: 'Ventures', href: '/admin/ventures', icon: Building, permission: 'ventures:manage' },
      { label: 'Audit', href: '/admin/audit', icon: FileSearch, permission: 'audit:view' },
    ],
  },
];

// Rendering: only show items the user has permission for
function SidebarSection({ section }: { section: NavigationSection }) {
  const { permissions } = useAuth();

  const visibleItems = section.items.filter(
    (item) => !item.permission || permissions.includes(item.permission)
  );

  if (visibleItems.length === 0) return null;

  return (
    <div>
      <SidebarLabel>{section.title}</SidebarLabel>
      {visibleItems.map((item) => (
        <SidebarItem key={item.href} item={item} />
      ))}
    </div>
  );
}

// Component-level gate
function InvoiceActions({ invoice }: { invoice: Invoice }) {
  return (
    <div className="flex gap-2">
      <PermissionGate permission="invoicing:edit">
        <Button onClick={() => editInvoice(invoice)}>Edit</Button>
      </PermissionGate>
      <PermissionGate permission="invoicing:delete">
        <Button color="danger" onClick={() => deleteInvoice(invoice)}>Delete</Button>
      </PermissionGate>
      <PermissionGate permission="invoicing:send">
        <Button color="primary" onClick={() => sendInvoice(invoice)}>Send</Button>
      </PermissionGate>
    </div>
  );
}
```

### URL Query State Management

Complex filter and view states are persisted in the URL using `nuqs`:

```typescript
// DataTable with URL-persisted state
function ContactsPage() {
  const [search, setSearch] = useQueryState('q', { defaultValue: '' });
  const [status, setStatus] = useQueryState('status');
  const [sort, setSort] = useQueryState('sort', { defaultValue: 'name' });
  const [order, setOrder] = useQueryState('order', { defaultValue: 'asc' });
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage, setPerPage] = useQueryState('perPage', parseAsInteger.withDefault(25));

  // URL: /crm/contacts?q=acme&status=active&sort=name&order=asc&page=1&perPage=25
  // Shareable, bookmarkable, back/forward navigation works

  const { data } = trpc.contacts.list.useQuery({
    search,
    status: status ?? undefined,
    sort,
    order,
    page,
    limit: perPage,
  });

  return (
    <DataTable
      data={data?.items ?? []}
      columns={contactColumns}
      pagination={{ page, perPage, total: data?.total ?? 0, onChange: setPage }}
      onSort={(field, direction) => { setSort(field); setOrder(direction); }}
      onSearch={setSearch}
    />
  );
}
```

---

## Build & Development

### Turborepo Build Graph

The monorepo uses Turborepo for parallel, cached, incremental builds. The build order enforces the tier dependency graph — lower tiers build first, Tier 6 builds last:

```
Build Order (dependency-aware):

Tier 0: @mcv/logger                    [~2s]
    │
    ▼
Tier 1: @mcv/kernel                    [~3s]
    │
    ▼
Tier 2: @mcv/db, @mcv/storage,        [~5s, parallel]
        @mcv/config, @mcv/realtime
    │
    ▼
Tier 4: @mcv/auth, @mcv/permissions,   [~8s, parallel]
        @mcv/flags, @mcv/notifications,
        @mcv/ai, @mcv/activity,
        @mcv/audit, @mcv/gateway,
        @mcv/rag, @mcv/catalog,
        @mcv/invoicing, @mcv/payments
    │
    ▼
Tier 5: @mcv/users, @mcv/tenants,     [~5s, parallel]
        @mcv/domains
    │
    ▼
Tier 6: @mcv/ui                        [~10s]
        @mcv/api                        [~8s, parallel with ui]
            │
            ▼
        @mcv/apps (admin)               [~45s]
            │
            ▼
        Total: ~80s (cold) / ~5s (cached)
```

#### Turborepo Configuration

```jsonc
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": [],
      "cache": true
    },
    "type-check": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "cache": true
    },
    "storybook": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    }
  }
}
```

### Development Server Setup

```bash
# Start all packages in dev mode (Turborepo)
pnpm dev

# Start specific packages
pnpm dev --filter=@mcv/admin      # Super-Admin on :3000
pnpm dev --filter=@mcv/ui         # Storybook on :6006

# Full development environment
pnpm dev                          # All packages
# Runs in parallel:
#   @mcv/admin    → localhost:3000 (Next.js dev server)
#   @mcv/ui       → localhost:6006 (Storybook dev server)
#   @mcv/api      → built and watched (consumed by admin)
#   lower tiers   → built and watched
```

#### Hot Reload Architecture

```
File Change Detected
        │
        ├── @mcv/ui component changed
        │   └── HMR via Next.js fast refresh
        │       └── Component re-renders in browser (~100ms)
        │
        ├── @mcv/api router changed
        │   └── TypeScript re-compiled by turbo
        │       └── Next.js dev server picks up change (~500ms)
        │       └── React Query refetches if type changed
        │
        ├── @mcv/apps page changed
        │   └── Next.js fast refresh
        │       └── RSC re-renders server-side (~200ms)
        │       └── Client components hot-reload (~100ms)
        │
        └── Lower tier change (e.g., @mcv/db schema)
            └── Turbo rebuilds affected packages in order
                └── All dependent packages re-compile (~2-5s)
```

### Storybook Development

```bash
# Start Storybook for the UI library
pnpm --filter @mcv/ui storybook

# Build static Storybook (for deployment)
pnpm --filter @mcv/ui build-storybook

# Run Storybook interaction tests
pnpm --filter @mcv/ui test-storybook
```

Storybook is configured with:
- **Dark theme** by default (matching the app)
- **Venture theme addon** — switch between venture themes in the toolbar
- **Viewport addon** — test responsive breakpoints
- **a11y addon** — automatic accessibility checks
- **Interactions addon** — Playwright-based interaction testing
- **Controls addon** — dynamic prop editing
- **Actions addon** — event logging
- **Docs addon** — auto-generated documentation

### Code Generation

```bash
# Generate a new tRPC router
pnpm gen:router <domain-name>
# Creates: routers/<domain>/<domain>.router.ts, .service.ts, .schema.ts

# Generate a new UI component
pnpm gen:component <category>/<ComponentName>
# Creates: components/<category>/<ComponentName>.tsx + story + test

# Generate a new feature module
pnpm gen:feature <feature-name>
# Creates: features/<name>/components/, hooks/, stores/, types.ts

# Generate a new page
pnpm gen:page <route-path>
# Creates: app/(dashboard)/<path>/page.tsx + loading.tsx + error.tsx
```

---

## Key Interfaces, Configuration & Dependencies

### Core Context Types

```typescript
/** Full tRPC request context — built fresh for every request */
interface Context {
  db: DrizzleClient;
  logger: Logger;
  headers: Headers;
  requestId: string;
  ip: string | null;
  userAgent: string | null;
  session: Session | null;
  user: AuthenticatedUser | null;
  venture: VentureContext | null;
  permissions: UserPermissions | null;
  rateLimit?: RateLimitInfo;
}

/** Better Auth session data */
interface Session {
  userId: string;
  email: string;
  ventureId: string | null;
  sessionId: string;
  expiresAt: Date;
}

/** Authenticated user profile */
interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  status: 'active' | 'suspended' | 'banned' | 'deleted';
  emailVerified: boolean;
  mfaEnabled: boolean;
  role: string | null;
  createdAt: Date;
}

/** Active venture context for multi-tenancy */
interface VentureContext {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'suspended' | 'archived' | 'pending';
  settings: Record<string, unknown> | null;
}
```

### Navigation Types

```typescript
type NavigationLayer = 'global' | 'venture' | 'module';

type VentureSlug =
  | 'betedge' | 'edgeiq' | 'mcvgg'
  | 'studio' | 'agency' | 'sentinel';

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  permission?: string;
  children?: NavigationItem[];
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

interface NavigationState {
  layer: NavigationLayer;
  currentVenture: VentureSlug | null;
  globalSection: string;
  ventureSection: string;
  activeModule: string | null;
  sidebarCollapsed: boolean;
  breadcrumbs: Breadcrumb[];
  recentVentures: VentureSlug[];
}
```

### Venture Configuration

```typescript
interface VentureConfig {
  slug: VentureSlug;
  name: string;
  color: string;
  accentColor: string;
  icon: string;
  domain: string;
  adminDomain: string;
  category: 'consumer' | 'platform' | 'service';
  hasEdgeToken: boolean;
  status: 'development' | 'active' | 'maintenance' | 'archived';
  productSuite: NavigationItem[];
}
```

### Auth Context

```typescript
interface AuthContextValue {
  state: 'loading' | 'authenticated' | 'mfa-pending' | 'unauthenticated';
  user: User | null;
  session: Session | null;
  tier: 0 | 1 | 2 | 3;
  permissions: string[];
  ventureAccess: VentureSlug[];
  login(credentials: LoginCredentials): Promise<void>;
  logout(): Promise<void>;
  verifyMFA(code: string, trustDevice?: boolean): Promise<void>;
  refreshSession(): void;
}
```

### Theme Types

```typescript
interface VentureTheme {
  id: string;
  name: string;
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
  };
  typography: {
    fonts: { sans: string; display: string; mono: string };
  };
  components: Record<string, { defaultProps?: Record<string, unknown> }>;
  assets: {
    logo: string;
    logomark: string;
    favicon: string;
    ogImage: string;
  };
}

interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  venture: VentureTheme;
  tokens: DesignTokens;
}
```

### Component API Standard

```typescript
/** Every UI component follows this base API pattern */
interface BaseComponentProps {
  variant?: 'solid' | 'outline' | 'ghost' | 'link' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
```

### Environment Variables

All environment variables are validated at startup via `@t3-oss/env-nextjs` + Zod schemas:

#### Required — Core

| Variable                         | Type     | Description                          |
| -------------------------------- | -------- | ------------------------------------ |
| `DATABASE_URL`                   | `string` | PostgreSQL connection string         |
| `BETTER_AUTH_SECRET`             | `string` | Session signing secret               |
| `BETTER_AUTH_URL`                | `string` | Auth callback URL                    |
| `NEXT_PUBLIC_APP_URL`            | `string` | Public application URL               |

#### Required — Authentication

| Variable                         | Type     | Description                          |
| -------------------------------- | -------- | ------------------------------------ |
| `GOOGLE_CLIENT_ID`              | `string` | Google OAuth client ID               |
| `GOOGLE_CLIENT_SECRET`          | `string` | Google OAuth client secret           |
| `GITHUB_CLIENT_ID`              | `string` | GitHub OAuth client ID               |
| `GITHUB_CLIENT_SECRET`          | `string` | GitHub OAuth client secret           |
| `RESEND_API_KEY`                | `string` | Resend email service key             |

#### Required — Infrastructure

| Variable                         | Type     | Description                          |
| -------------------------------- | -------- | ------------------------------------ |
| `UPSTASH_REDIS_REST_URL`        | `string` | Redis URL for rate limiting & caching|
| `UPSTASH_REDIS_REST_TOKEN`      | `string` | Redis auth token                     |
| `SUPABASE_URL`                  | `string` | Supabase project URL                 |
| `SUPABASE_ANON_KEY`             | `string` | Supabase anonymous key               |
| `SUPABASE_SERVICE_ROLE_KEY`     | `string` | Supabase service role key            |

#### Required — AI Gateway

| Variable                         | Type     | Description                          |
| -------------------------------- | -------- | ------------------------------------ |
| `OPENAI_API_KEY`                | `string` | OpenAI API key                       |
| `ANTHROPIC_API_KEY`             | `string` | Anthropic API key                    |
| `AI_GATEWAY_BUDGET_LIMIT`       | `number` | Monthly AI spend limit               |

#### Required — Storage

| Variable                         | Type     | Description                          |
| -------------------------------- | -------- | ------------------------------------ |
| `S3_BUCKET`                     | `string` | S3 bucket name                       |
| `S3_REGION`                     | `string` | S3 region                            |
| `S3_ACCESS_KEY_ID`              | `string` | S3 access key                        |
| `S3_SECRET_ACCESS_KEY`          | `string` | S3 secret key                        |

#### Required — Payments

| Variable                                | Type     | Description                    |
| --------------------------------------- | -------- | ------------------------------ |
| `STRIPE_SECRET_KEY`                     | `string` | Stripe secret key              |
| `STRIPE_WEBHOOK_SECRET`                 | `string` | Stripe webhook signing secret  |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`    | `string` | Stripe publishable key         |

### Next.js Configuration

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: [
    // 33 @heroui/* packages
    // 17 @mcv/* workspace packages
    // 3 @trpc/* packages
    // Total: 53 transpiled packages
  ],
  serverExternalPackages: ['handlebars'],
};
```

| Setting                  | Value              | Rationale                                              |
| ------------------------ | ------------------ | ------------------------------------------------------ |
| `reactStrictMode`        | `true`             | Double-renders in dev to catch side effects             |
| `eslint.ignoreDuringBuilds` | `true`          | ESLint runs separately in CI for build speed           |
| `transpilePackages`      | 53 packages        | Workspace + HeroUI packages ship as ESM/TS sources     |
| `serverExternalPackages` | `['handlebars']`   | Server-only email templates — keep out of client bundle|

### Tailwind CSS Configuration

Tailwind is configured at the workspace root with venture-aware theme extension:

- **Content paths** — Scans `@mcv/apps` pages, `@mcv/ui` components, and HeroUI node_modules
- **Dark mode** — `class` strategy (default dark, toggled by `ThemeProvider`)
- **Custom plugins** — Venture branding plugin, animation utilities, glass morphism
- **Design tokens** — All `@mcv/ui` tokens mapped to Tailwind utilities via CSS custom properties

### Internal Dependencies (Workspace)

Tier 6 depends on 17 internal `@mcv/*` workspace packages spanning all lower tiers:

| Package              | Tier | Purpose                                    |
| -------------------- | ---- | ------------------------------------------ |
| `@mcv/kernel`        | 1    | Shared types, utilities, constants         |
| `@mcv/db`            | 2    | Drizzle ORM, PostgreSQL schemas            |
| `@mcv/storage`       | 2    | S3/Supabase file storage                   |
| `@mcv/config`        | 2    | Shared config, env validation              |
| `@mcv/auth`          | 4    | Better Auth sessions, OAuth, MFA, passkeys |
| `@mcv/permissions`   | 4    | RBAC, permission gates                     |
| `@mcv/flags`         | 4    | Feature flag evaluation                    |
| `@mcv/notifications` | 4    | Push, email, in-app alerts                 |
| `@mcv/ai`            | 4    | AI/LLM integrations, agent orchestration   |
| `@mcv/activity`      | 4    | Activity feed, engagement tracking         |
| `@mcv/audit`         | 4    | Audit logging, compliance                  |
| `@mcv/gateway`       | 4    | AI Gateway, model routing, budgets         |
| `@mcv/rag`           | 4    | RAG, knowledge retrieval                   |
| `@mcv/catalog`       | 4    | Product catalog, inventory                 |
| `@mcv/invoicing`     | 4    | Invoice generation, proposals, recurring   |
| `@mcv/payments`      | 4    | Stripe integration, subscriptions          |
| `@mcv/logger`        | 0    | Structured logging                         |

### External Dependencies (Key)

| Package                 | Version | Purpose                          |
| ----------------------- | ------- | -------------------------------- |
| `next`                  | 15.0.7  | React framework (App Router)     |
| `react`                 | 19.x    | UI rendering                     |
| `@trpc/server`          | 11.x    | Type-safe API server             |
| `@trpc/client`          | 11.x    | Type-safe API client             |
| `@trpc/react-query`     | 11.x    | React Query integration          |
| `@heroui/react`         | 2.x     | Component library foundation     |
| `tailwindcss`           | 3.x     | Utility-first CSS                |
| `framer-motion`         | 11.x    | Animation library                |
| `zustand`               | 5.x     | Client state management          |
| `zod`                   | 3.x     | Schema validation                |
| `superjson`             | 2.x     | Enhanced JSON serialization      |
| `@tanstack/react-query` | 5.x     | Server state management          |
| `lucide-react`          | —       | Icon library                     |
| `nuqs`                  | —       | URL query state management       |
| `@t3-oss/env-nextjs`    | —       | Env validation                   |
| `better-auth`           | —       | Authentication framework         |

---

## Performance

### React Server Components (RSC) Strategy

Tier 6 uses a **server-first** rendering strategy. The default is React Server Components; client components are used only when interactivity requires it.

| Strategy                | When Used                              | Examples                                          |
| ----------------------- | -------------------------------------- | ------------------------------------------------- |
| **Server Component**    | Static content, data fetching, layouts | Page shells, data tables, stat cards              |
| **Client Component**    | Interactivity, state, effects          | Forms, modals, command palette, charts            |
| **Streaming**           | Large data sets, slow queries          | Dashboard KPIs, analytics, reports                |
| **Suspense boundaries** | Progressive loading                    | Per-section loading skeletons                     |

#### Server vs Client Decision Matrix

```
Does the component need...
├── Event handlers (onClick, onChange)? → Client Component
├── useState, useEffect, useRef?       → Client Component
├── Browser APIs (window, document)?   → Client Component
├── Third-party client-only libs?      → Client Component (dynamic import)
│
└── None of the above?                 → Server Component (default)
    ├── Data fetching?                 → Server Component (async)
    ├── Database access?               → Server Component
    ├── Backend secrets?               → Server Component
    └── Static rendering?              → Server Component
```

#### Streaming Architecture

```typescript
// Page with multiple independent data sources using streaming
export default async function MissionControlPage() {
  return (
    <div className="grid grid-cols-4 gap-6">
      {/* KPIs stream in first (~200ms) */}
      <Suspense fallback={<KPISkeleton />}>
        <KPICards />
      </Suspense>

      {/* Revenue chart streams in second (~400ms) */}
      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>

      {/* Activity feed streams in third (~500ms) */}
      <Suspense fallback={<FeedSkeleton />}>
        <ActivityFeed />
      </Suspense>

      {/* Venture health streams last (~800ms, complex query) */}
      <Suspense fallback={<HealthSkeleton />}>
        <VentureHealth />
      </Suspense>
    </div>
  );
}

// Each component fetches independently, streams when ready
async function KPICards() {
  const caller = createCaller(await createContext(headers()));
  const kpis = await caller.analytics.getKPIs();
  return <KPIGrid kpis={kpis} />;
}
```

### Code Splitting

```
Route Groups:
├── (auth)        Auth pages — separate chunk (~40KB)
├── (dashboard)   Main app — lazy-loaded modules
├── (public)      Public pages — minimal bundle (~20KB)
└── api           API routes — server-only (no client JS)
```

- **Route-based splitting** — Each route group loads independently
- **Feature-based splitting** — 35 feature modules are lazy-loaded on navigation
- **Component-based splitting** — Heavy components (editors, charts, maps) use `dynamic()` imports
- **Vendor splitting** — Large dependencies (HeroUI, Recharts, Monaco) in separate chunks

```typescript
// Dynamic imports for heavy components
const RichTextEditor = dynamic(
  () => import('@mcv/ui/editors/RichTextEditor'),
  {
    loading: () => <Skeleton className="h-64" />,
    ssr: false, // Editor requires browser APIs
  }
);

const RevenueChart = dynamic(
  () => import('../components/charts/RevenueChart'),
  {
    loading: () => <ChartSkeleton />,
  }
);

const MonacoEditor = dynamic(
  () => import('@mcv/ui/editors/CodeEditor'),
  {
    loading: () => <Skeleton className="h-96" />,
    ssr: false,
  }
);
```

### Performance Targets

| Metric           | Target       | Strategy                                    |
| ---------------- | ------------ | ------------------------------------------- |
| **LCP**          | < 2.5s       | RSC streaming, image optimization           |
| **FID**          | < 100ms      | Minimal client JS, code splitting           |
| **CLS**          | < 0.1        | Skeleton loaders, fixed layouts             |
| **TTFB**         | < 200ms      | Edge runtime, ISR where applicable          |
| **Bundle size**  | < 200KB (initial) | Tree shaking, dynamic imports          |

### Caching Strategy

| Layer             | Mechanism                     | TTL              | Scope          |
| ----------------- | ----------------------------- | ---------------- | -------------- |
| **Browser**       | Service Worker + Cache API    | Varies           | Static assets  |
| **CDN**           | Vercel Edge Cache             | 1h (pages), 1y (assets) | Public routes |
| **React Query**   | In-memory + staleTime         | 30s–5min         | Per-query      |
| **tRPC**          | Response caching headers      | Varies           | Per-procedure  |
| **Redis**         | Upstash Redis                 | 1min–1h          | Rate limits, sessions |

```typescript
// React Query caching configuration
const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30 seconds — data considered fresh
      gcTime: 5 * 60 * 1000,       // 5 minutes — cached in memory
      refetchOnWindowFocus: true,   // Refetch when user returns to tab
      refetchOnReconnect: true,     // Refetch on network reconnect
      retry: 3,                     // Retry failed queries 3 times
      retryDelay: (attempt) =>
        Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff
    },
    mutations: {
      retry: 1,                     // Retry mutations once
      onError: (error) => {
        toast.error(error.message); // Global error toast
      },
    },
  },
};

// Per-query overrides for different data freshness needs
trpc.analytics.getKPIs.useQuery(undefined, {
  staleTime: 60 * 1000,            // KPIs: 1-minute freshness
  refetchInterval: 60 * 1000,      // Auto-refresh every minute
});

trpc.notifications.getUnread.useQuery(undefined, {
  staleTime: 10 * 1000,            // Notifications: 10-second freshness
  refetchInterval: 10 * 1000,      // Auto-refresh every 10 seconds
});

trpc.settings.getProfile.useQuery(undefined, {
  staleTime: 5 * 60 * 1000,        // Profile: 5-minute freshness (rarely changes)
});
```

---

## Deployment

### Infrastructure

| Component          | Platform                       | Region                |
| ------------------ | ------------------------------ | --------------------- |
| **Next.js Apps**   | Vercel (Serverless + Edge)     | `iad1` (US East)      |
| **Database**       | Supabase (PostgreSQL)          | US East               |
| **Redis**          | Upstash                        | Global (multi-region) |
| **Storage**        | S3 / Supabase Storage          | US East               |
| **CDN**            | Vercel Edge Network            | Global                |
| **DNS**            | Cloudflare                     | Global                |

### Deployment Pipeline

```
git push → main branch
     │
     ▼
┌─────────────────────────────┐
│  GitHub Actions CI           │
│                             │
│  1. Install deps (pnpm)    │
│  2. Type check (tsc)       │     ~2 min
│  3. Lint (ESLint)          │
│  4. Unit tests (Vitest)    │
│  5. Build (Turborepo)      │
│  6. E2E tests (Playwright) │
└─────────────────────────────┘
         │
         ▼ (all green)
┌─────────────────────────────┐
│  Vercel Deploy               │
│                             │
│  Branch deploys:            │
│  • feature/* → Preview URL  │     ~1 min
│  • develop   → Staging      │
│  • main      → Production   │
│  (manual promotion for prod)│
└─────────────────────────────┘
```

### Domain Configuration

| App              | Production Domain    | Preview Pattern                    |
| ---------------- | -------------------- | ---------------------------------- |
| Super-Admin      | `admin.mcv.one`      | `admin-{branch}.vercel.app`        |
| Venture Admin    | `{venture}.mcv.one`  | `{venture}-{branch}.vercel.app`    |

### Preview Deployments

Every pull request gets a unique preview deployment:
- **Isolated environment** — Separate from staging/production
- **Seeded database** — Preview branch connected to a seeded staging database
- **Shareable URL** — `https://admin-feat-crm-v2-abc123.vercel.app`
- **GitHub integration** — Bot comments with preview URL on the PR
- **Automatic cleanup** — Destroyed when the PR is merged or closed

### Build System (Turborepo)

```jsonc
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

Build order enforces the tier dependency graph — lower tiers build first, Tier 6 builds last.

---

## Testing Strategy

### Test Pyramid

| Level          | Framework                   | Scope                      | Coverage Target |
| -------------- | --------------------------- | -------------------------- | --------------- |
| **Unit**       | Vitest                      | Services, utils, hooks     | 80%             |
| **Component**  | Vitest + Testing Library    | UI components              | 70%             |
| **Integration**| Vitest                      | tRPC routers, middleware   | 75%             |
| **E2E**        | Playwright                  | Critical user journeys     | 20 flows        |
| **Visual**     | Storybook + Chromatic       | Component visual regression| All 508 comps   |

### Critical E2E Flows

1. Login → MFA → Dashboard
2. Venture switching (Chameleon Engine)
3. CRM: Contact → Deal → Pipeline
4. Invoicing: Create → Send → Payment
5. AI Command: Agent deploy → HITL approval
6. Task management: Create → Sprint → Complete
7. Feature flag toggle → UI update
8. Settings: Profile, security, API keys
9. Global search (Cmd+K) → Navigate to result
10. Error boundary recovery → Retry → Success

### Testing Patterns

```typescript
// Unit test: tRPC router
describe('ventures.list', () => {
  it('returns all ventures for super-admin', async () => {
    const caller = createCaller(superAdminContext);
    const result = await caller.ventures.list({ page: 1, limit: 10 });
    expect(result.items).toHaveLength(6);
  });

  it('returns only own venture for venture-admin', async () => {
    const caller = createCaller(ventureAdminContext);
    const result = await caller.ventures.list({ page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].slug).toBe('betedge');
  });

  it('throws UNAUTHORIZED for unauthenticated', async () => {
    const caller = createCaller(anonContext);
    await expect(caller.ventures.list({ page: 1, limit: 10 }))
      .rejects.toThrow('UNAUTHORIZED');
  });
});

// Component test: UI component
describe('StatCard', () => {
  it('renders value and label', () => {
    render(<StatCard label="Revenue" value="$2.4M" trend={12} />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$2.4M')).toBeInTheDocument();
    expect(screen.getByText('▲ 12%')).toBeInTheDocument();
  });

  it('applies venture theme colors', () => {
    render(
      <ThemeProvider venture="betedge">
        <StatCard label="Revenue" value="$2.4M" color="primary" />
      </ThemeProvider>
    );
    expect(screen.getByTestId('stat-card')).toHaveClass('text-primary');
  });
});

// E2E test: Playwright
test('invoice creation flow', async ({ page }) => {
  await page.goto('/invoicing/new');
  await page.fill('[name="clientId"]', 'acme-corp');
  await page.fill('[name="items.0.description"]', 'Consulting services');
  await page.fill('[name="items.0.quantity"]', '10');
  await page.fill('[name="items.0.price"]', '150');
  await page.click('button:has-text("Create Invoice")');

  await expect(page).toHaveURL(/\/invoicing\/inv_/);
  await expect(page.locator('h1')).toContainText('INV-2026-');
  await expect(page.locator('[data-testid="total"]')).toContainText('$1,500.00');
});
```

---

## Security

### Content Security Policy (CSP)

Tier 6 enforces a strict CSP via Edge middleware:

```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com;
frame-src https://js.stripe.com;
font-src 'self';
```

### Auth Middleware Pipeline

Every request passes through Edge middleware before reaching the application:

```
Request
  │
  ├── Security Headers (CSP, HSTS, X-Frame-Options)
  ├── Rate Limiting (sliding window, 5 presets)
  ├── Session Validation (Better Auth cookie)
  ├── Route Protection (public vs protected routes)
  ├── Venture Context Resolution (from session or header)
  ├── Permission Check (RBAC tier + granular permissions)
  └── Request ID + Logging
```

### Rate Limiting

Five rate limit presets protect all endpoint categories:

| Preset     | Limit    | Window   | Applies To                         |
| ---------- | -------- | -------- | ---------------------------------- |
| `public`   | 50/min   | Per IP   | Health checks, public booking      |
| `general`  | 100/min  | Per user | Standard authenticated endpoints   |
| `auth`     | 5/min    | Per IP   | Login, signup, password reset      |
| `strict`   | 3/min    | Per IP   | Password reset confirmation        |
| `relaxed`  | 200/min  | Per user | Dashboard polling, real-time feeds |

### Additional Security Measures

| Measure               | Implementation                                              |
| --------------------- | ----------------------------------------------------------- |
| **CSRF Protection**   | SameSite cookies + custom header validation                 |
| **XSS Prevention**    | React auto-escaping + CSP + DOMPurify for user content      |
| **SQL Injection**     | Drizzle ORM parameterized queries (no raw SQL)              |
| **Input Validation**  | Zod schemas on every tRPC endpoint                          |
| **Session Security**  | HTTP-only cookies, secure flag, short expiry + refresh      |
| **MFA**               | TOTP, SMS, WebAuthn/FIDO2 passkeys                          |
| **Audit Trail**       | All admin actions logged to `@mcv/audit`                    |

---

## Multi-Tenant Design

### The Chameleon Engine

MCV.ONE's multi-tenant architecture is called the **Chameleon Engine** — named for its ability to dynamically rebrand the entire user interface per venture context. Every component, layout, and page adapts to the active venture's visual identity.

#### Venture Switching Flow

```
User clicks venture in sidebar
        │
        ▼
┌─────────────────────────┐
│  Navigation Store        │  switchToVenture(slug)
│  updates context         │
└─────────────────────────┘
        │
        ├── Theme Provider applies venture tokens (CSS vars)
        ├── Sidebar rebuilds with venture navigation
        ├── Header updates with venture branding
        ├── API context sends venture header to tRPC
        └── URL updates to /v/{ventureSlug}/...
```

#### Venture Themes

Each venture has a unique visual identity:

| Venture          | Primary Color         | Category  | Domain              |
| ---------------- | --------------------- | --------- | ------------------- |
| **BetEdge AI**   | `#22c55e` (Green)     | Consumer  | `betedge.app`       |
| **EdgeIQ**       | `#3b82f6` (Blue)      | Platform  | `edgeiq.mcv.one`    |
| **MCVGG**        | `#8b5cf6` (Purple)    | Consumer  | `mcvgg.com`         |
| **Studio**       | `#f59e0b` (Amber)     | Service   | `studio.mcv.one`    |
| **Agency**       | `#ec4899` (Pink)      | Service   | `agency.mcv.one`    |
| **Sentinel**     | `#ef4444` (Red)       | Platform  | `sentinel.mcv.one`  |

#### Tenant Isolation

- **API Level** — Every authenticated request includes a `venture` context via `ventureProcedure`; queries are automatically scoped to the active venture
- **UI Level** — Navigation, theming, and data display are all venture-scoped
- **Permission Level** — RBAC is hierarchical: Tier 0 (super-admin) sees all ventures; Tier 1 (venture admin) sees only their venture
- **Data Level** — Database queries enforce `ventureId` WHERE clauses at the service layer

### Role-Based UI

The interface adapts based on the user's permission tier:

| Tier | Role          | UI Scope                    | Navigation                           |
| ---- | ------------- | --------------------------- | ------------------------------------ |
| 0    | Super Admin   | Full platform access        | 18 sections, all ventures            |
| 1    | Venture Admin | Single venture management   | Venture nav, administration          |
| 2    | Operator      | Module-level access         | Assigned modules only                |
| 3    | Viewer        | Read-only access            | Reduced navigation, no actions       |

Permission-gated components are rendered conditionally:

```typescript
// Navigation items with permission gates
interface NavigationItem {
  permission?: string; // e.g., 'ventures:manage'
  children?: NavigationItem[];
}

// Component-level gates
<PermissionGate permission="invoicing:create">
  <Button>Create Invoice</Button>
</PermissionGate>
```

---

## Versioning & Release

| Package      | Version Strategy   | Publish Target         |
| ------------ | ------------------ | ---------------------- |
| `@mcv/api`   | Workspace-linked   | Internal only          |
| `@mcv/apps`  | Workspace-linked   | Deploy to Vercel       |
| `@mcv/ui`    | SemVer (1.x.x)    | Internal npm registry  |

### Changelog

All changes are tracked via conventional commits:

- `feat(api):` — New routers, procedures, or schemas
- `feat(apps):` — New pages, features, or modules
- `feat(ui):` — New components, patterns, or themes
- `fix(tier6):` — Cross-cutting bug fixes
- `perf(tier6):` — Performance improvements
- `docs(tier6):` — Documentation updates

---

*Tier 6: Presentation — The MCV.ONE User Interface Layer*