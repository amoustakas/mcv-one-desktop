# @mcv/api — Technical Architecture
## System Design & Data Flow

**Package:** `@mcv/api`  
**Version:** 0.1.0  
**Last Updated:** February 8, 2026

---

## Architecture Overview

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

## Request Lifecycle

Every API request follows a predictable lifecycle through the tRPC pipeline:

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Client   │────▶│  HTTP Adapter│────▶│ createContext │────▶│  Middleware   │
│  Request  │     │  (Fetch/Hono)│     │              │     │  Pipeline    │
└──────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                   │
                  ┌──────────────┐     ┌──────────────┐     ┌─────▼────────┐
                  │  SuperJSON   │◀────│  Router      │◀────│  Zod Input   │
                  │  Serialize   │     │  Handler     │     │  Validation  │
                  └──────┬───────┘     └──────────────┘     └──────────────┘
                         │
                  ┌──────▼───────┐
                  │  HTTP        │
                  │  Response    │
                  └──────────────┘
```

### Phase 1: HTTP Adapter

The tRPC adapter receives the raw HTTP request and routes it to the tRPC handler:

```typescript
// Next.js App Router adapter
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createFetchContext,
  });

export { handler as GET, handler as POST };
```

**Supported adapters:**
| Adapter | Runtime | Import |
|---------|---------|--------|
| Fetch API | Next.js App Router, Cloudflare Workers | `@trpc/server/adapters/fetch` |
| Hono | Edge workers, standalone servers | `@hono/trpc-server` |
| Server-side caller | React Server Components | `createCallerFactory` (no HTTP) |

### Phase 2: Context Creation

Context is created once per request. All subsequent middleware and procedures receive this pre-built context:

```
┌─────────────────────────────────────────────────────────────────┐
│                    createContext(headers)                         │
│                                                                  │
│  Step 1: Parse Headers                                          │
│  ├── Extract requestId (x-request-id or random UUID)            │
│  ├── Extract IP (cf-connecting-ip → x-forwarded-for → x-real-ip)│
│  └── Extract User-Agent                                          │
│                                                                  │
│  Step 2: Verify Session (Better Auth)                            │
│  ├── auth.api.getSession({ headers })                           │
│  ├── If no session → return base context (unauthenticated)      │
│  └── Map session → Session interface                             │
│                                                                  │
│  Step 3: Load Venture (parallel with Step 4)                    │
│  ├── If session.ventureId exists → DB lookup                    │
│  ├── Verify venture status (reject "suspended")                 │
│  └── Return VentureContext or null                               │
│                                                                  │
│  Step 4: Load Permissions (parallel with Step 3)                │
│  ├── loadUserPermissions(userId, ventureId, db, role)           │
│  ├── Resolves RBAC tier (0-3)                                   │
│  └── Returns UserPermissions with grants                         │
│                                                                  │
│  Step 5: Assemble Context                                        │
│  └── Return { db, logger, headers, requestId, ip, userAgent,    │
│               session, user, venture, permissions }              │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
export async function createContext(opts: CreateContextOptions): Promise<Context> {
  const { headers, requestId = crypto.randomUUID() } = opts;

  // 1. Base context (always present)
  const baseContext: Context = {
    db, logger, headers, requestId,
    ip: extractClientIP(headers),
    userAgent: headers.get("user-agent"),
    session: null, user: null, venture: null, permissions: null,
  };

  // 2. Verify session via Better Auth
  const sessionData = await auth.api.getSession({ headers });
  if (!sessionData) return baseContext;  // Unauthenticated

  // 3. Map session to our interface
  const contextSession: Session = {
    userId: session.userId,
    email: user.email,
    ventureId: (session as any).activeVentureId || null,
    sessionId: session.id,
    expiresAt: session.expiresAt,
  };

  // 4-5. Load venture + permissions (parallel)
  const [venture, permissions] = await Promise.all([
    contextSession.ventureId ? loadVenture(contextSession.ventureId) : null,
    loadUserPermissions(contextSession.userId, contextSession.ventureId, db, user.role),
  ]);

  return { ...baseContext, session: contextSession, user, venture, permissions };
}
```

**IP Extraction Priority:**
1. `cf-connecting-ip` (Cloudflare)
2. `x-forwarded-for` (first IP in chain)
3. `x-real-ip` (Nginx)
4. `null` (local/direct)

### Phase 3: Middleware Pipeline

Middleware executes in order, each wrapping the `next()` call. The specific chain depends on the procedure type used:

```
publicProcedure:
  logger → handler

protectedProcedure:
  logger → isAuthenticated → handler

adminProcedure:
  logger → isAuthenticated → isAdmin → handler

ventureProcedure:
  logger → isAuthenticated → hasVentureContext → handler

rateLimitedProtectedProcedure:
  logger → rateLimitGeneral → isAuthenticated → handler

permissionProcedure('calendars', 'create'):
  logger → isAuthenticated → requirePermission('calendars','create') → handler
```

### Phase 4: Input Validation

Zod schemas validate all input before the handler executes:

```typescript
.input(z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  status: z.enum(['active', 'archived']).optional(),
  search: z.string().max(200).optional(),
}))
```

Validation failures return structured errors:

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

### Phase 5: Router Handler

The handler is a thin function that delegates to a service:

```typescript
create: ventureProcedure
  .input(createContactSchema)
  .mutation(async ({ ctx, input }) => {
    const service = new ContactService(ctx.venture.id);
    const result = await service.create(input, ctx.session.userId);

    await auditService.log({
      action: 'contact.create',
      userId: ctx.session.userId,
      ventureId: ctx.venture.id,
      resourceType: 'contact',
      resourceId: result.id,
      metadata: { name: input.name },
    });

    return result;
  })
```

### Phase 6: Response Serialization

SuperJSON transforms the response for wire transport:

```
Server Response Object:
  { createdAt: Date, amount: BigInt(1000), tags: Set(['a','b']) }

After SuperJSON:
  { json: { createdAt: "2026-02-08T...", amount: "1000", tags: ["a","b"] },
    meta: { values: { createdAt: ["Date"], amount: ["bigint"], tags: ["set"] } } }

Client (auto-deserialized):
  { createdAt: Date, amount: BigInt(1000), tags: Set(['a','b']) }
```

---

## Middleware Architecture

### Logger Middleware

Applied to **every** procedure via `baseProcedure`. Logs the full request lifecycle:

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
| `requestId` | string | UUID from header or auto-generated |
| `userId` | string \| undefined | Authenticated user's ID |
| `durationMs` | number | Wall-clock execution time |
| `error` | object \| undefined | Error details on failure |

### Rate Limit Middleware

The rate limiter uses a **sliding window algorithm** with in-memory storage:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SlidingWindowRateLimiter                       │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      In-Memory Map                         │  │
│  │                                                            │  │
│  │  Key: "{trpc_path}:{identifier}"                          │  │
│  │  Value: { timestamps: number[], windowMs: number }        │  │
│  │                                                            │  │
│  │  "auth.login:192.168.1.1" → [t1, t2, t3]                │  │
│  │  "catalog.list:user_abc123" → [t1, t2, ..., t95]        │  │
│  │  "rag.query.deep:user_xyz" → [t1]                        │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Cleanup Timer (60s)                      │  │
│  │  • Removes entries with no activity in 5 minutes           │  │
│  │  • Prevents unbounded memory growth                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Methods:                                                        │
│  • check(key, limit, windowMs) → RateLimitResult                │
│  • status(key, limit, windowMs) → RateLimitResult               │
│  • reset(key) → void                                             │
│  • clear() → void                                                │
│  • get size → number                                             │
└─────────────────────────────────────────────────────────────────┘
```

**Sliding Window Algorithm:**

```
Window: 60 seconds | Limit: 5 requests

Time (seconds):  0    10    20    30    40    50    60    70
Requests:        R1   R2    R3    R4    R5              R6

At T=50:  Window = [0, 50] → 5 requests → AT LIMIT
At T=60:  Window = [0, 60] → 5 requests → STILL AT LIMIT
At T=61:  Window = [1, 61] → R1 falls out → 4 requests → R6 ALLOWED
```

**Rate Limit Configuration:**

```typescript
export interface RateLimitConfig {
  limit: number;              // Maximum requests in window
  windowMs: number;           // Window size in milliseconds
  keyGenerator?: (ctx: Context) => string | null;  // Client identifier
  skip?: (ctx: Context) => boolean;                // Skip conditions
  message?: string;           // Custom 429 message
}
```

**Preset Configurations:**

| Preset | Limit | Window | Key Strategy | Headers |
|--------|-------|--------|-------------|---------|
| `auth` | 5/min | 60s | `ctx.ip` | X-RateLimit-* |
| `general` | 100/min | 60s | `ctx.session.userId \|\| ctx.ip` | X-RateLimit-* |
| `public` | 50/min | 60s | `ctx.ip` | X-RateLimit-* |
| `strict` | 3/min | 60s | `ctx.ip` | X-RateLimit-* |
| `relaxed` | 500/min | 60s | `ctx.session.userId \|\| ctx.ip` | X-RateLimit-* |

**Response Headers:**

```
// Success response
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706300060

// 429 response (additional)
Retry-After: 15
```

### Authentication Middleware

Six auth enforcement middlewares, each narrowing the context type:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Auth Middleware Stack                          │
│                                                                  │
│  ┌──────────────────────────────┐                               │
│  │     isAuthenticated          │ Checks:                       │
│  │                              │ • session exists              │
│  │  ctx.session → non-null      │ • user exists                 │
│  │  ctx.user → non-null         │ • permissions loaded          │
│  │  ctx.permissions → non-null  │ • user.status === "active"    │
│  │                              │                               │
│  │  Throws:                     │ Returns:                      │
│  │  • UNAUTHORIZED (no session) │ AuthenticatedContext           │
│  │  • FORBIDDEN (suspended)     │                               │
│  └──────────────────────────────┘                               │
│                                                                  │
│  ┌──────────────────────────────┐                               │
│  │     isAdmin                  │ Checks:                       │
│  │                              │ • isAuthenticated first       │
│  │  permissions.tier → 0 or 1   │ • permissions.tier ≤ 1        │
│  │                              │                               │
│  │  Throws: FORBIDDEN           │ Returns: AdminContext          │
│  └──────────────────────────────┘                               │
│                                                                  │
│  ┌──────────────────────────────┐                               │
│  │     isSuperAdmin             │ Checks:                       │
│  │                              │ • isAuthenticated first       │
│  │  permissions.tier → 0 only   │ • permissions.tier === 0      │
│  │                              │                               │
│  │  Throws: FORBIDDEN           │ Returns: SuperAdminContext     │
│  └──────────────────────────────┘                               │
│                                                                  │
│  ┌──────────────────────────────┐                               │
│  │     hasVentureContext        │ Checks:                       │
│  │                              │ • isAuthenticated first       │
│  │  ctx.venture → non-null      │ • ctx.venture exists          │
│  │                              │                               │
│  │  Throws: BAD_REQUEST         │ Returns: VentureContextReq    │
│  └──────────────────────────────┘                               │
│                                                                  │
│  ┌──────────────────────────────┐                               │
│  │     isAgent                  │ Checks:                       │
│  │                              │ • x-agent-id header present   │
│  │  ctx.agent → populated       │ • Constructs agent metadata   │
│  │                              │                               │
│  │  Throws: UNAUTHORIZED        │ Returns: AgentContext          │
│  └──────────────────────────────┘                               │
│                                                                  │
│  ┌──────────────────────────────┐                               │
│  │  requirePermission(res, act) │ Checks:                       │
│  │                              │ • isAuthenticated first       │
│  │  Granular RBAC check         │ • checkPermission() call      │
│  │                              │                               │
│  │  Throws: FORBIDDEN + reason  │ Returns: AuthenticatedContext  │
│  └──────────────────────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Router Organization

### Router Merge Architecture

All 61 routers are merged into a single `appRouter` in `routers/index.ts`:

```typescript
export const appRouter = router({
  // Authentication & Identity
  auth: authRouter,
  mfa: mfaRouter,
  passkey: passkeyRouter,
  wallet: walletRouter,
  users: usersRouter,
  roles: rolesRouter,

  // Multi-Tenancy & Access Control
  ventures: venturesRouter,
  ventureMembers: ventureMembersRouter,
  permissions: permissionsRouter,
  settings: settingsRouter,

  // AI & Intelligence
  gateway: gatewayRouter,
  rag: ragRouter,          // Nested: stores, files, query, metrics, admin
  ai: aiRouter,
  intelligence: intelligenceRouter,  // Nested sub-routers
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

  // Communication & Contact Center
  conversations: conversationRouter,
  queues: queueRouter,
  twilio: twilioRouter,
  contactCenter: contactCenterRouter,

  // Calendar & Scheduling
  calendar: calendarRouter,

  // Commerce & Payments
  catalog: catalogRouter,
  payments: paymentsRouter,
  invoicing: invoicingRouter,
  tokenEconomy: tokenEconomyRouter,

  // Marketing & Content
  email: emailRouter,
  marketing: marketingRouter,
  forms: formRouter,
  reputation: reputationRouter,
  cms: cmsRouter,

  // Documents & Storage
  documentEditor: documentEditorRouter,
  storage: storageRouter,
  comments: commentsRouter,

  // Analytics & Observability
  analytics: analyticsRouter,
  stats: statsRouter,
  audit: auditRouter,
  notifications: notificationsRouter,

  // Platform Operations
  flags: flagsRouter,
  webhooks: webhookRouter,
  integrations: integrationRouter,
  portfolio: portfolioRouter,
  treasury: treasuryRouter,
  strategy: strategyRouter,

  // Grants & Funding
  grants: grantConciergeRouter,

  // Tags & Metadata
  tags: tagsRouter,
  branding: brandingRouter,
});

export type AppRouter = typeof appRouter;
```

### Nested Router Pattern

Some routers use nesting for clean namespacing:

```typescript
// RAG router — nested for logical grouping
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

### Router Pattern: Thin Handlers

Routers follow a strict pattern — thin handlers that delegate to services:

```
┌──────────────────────────────────────────────────────────────────┐
│                       Router Handler Pattern                      │
│                                                                   │
│  1. Procedure type (auth level)                                  │
│  2. Input schema (Zod validation)                                │
│  3. Extract context fields (venture, user, session)              │
│  4. Call service method                                          │
│  5. Optional: audit log                                          │
│  6. Return result                                                │
│                                                                   │
│  create: ventureProcedure                          ← Step 1      │
│    .input(createSchema)                            ← Step 2      │
│    .mutation(async ({ ctx, input }) => {                          │
│      const ventureId = ctx.venture.id;             ← Step 3      │
│      const result = await service.create(          ← Step 4      │
│        ventureId, input, ctx.session.userId                      │
│      );                                                          │
│      await auditService.log({ ... });              ← Step 5      │
│      return result;                                ← Step 6      │
│    })                                                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Service Layer Architecture

Services encapsulate all business logic. The router layer never contains business rules directly.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Service Classes                        │    │
│  │                                                          │    │
│  │  Constructor:                                            │    │
│  │  • Receives ventureId (scoped to tenant)                │    │
│  │  • Receives db instance (from context)                  │    │
│  │                                                          │    │
│  │  Methods:                                                │    │
│  │  • CRUD operations (create, get, list, update, delete)  │    │
│  │  • Business operations (process, calculate, validate)   │    │
│  │  • Query builders (search, filter, aggregate)           │    │
│  │                                                          │    │
│  │  Dependencies:                                           │    │
│  │  • @mcv/db (Drizzle queries)                            │    │
│  │  • Other services (composition)                          │    │
│  │  • External packages (@mcv/gateway, @mcv/rag, etc.)     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Lazy-Loading Pattern                         │    │
│  │                                                          │    │
│  │  // Used by catalog router to avoid import side effects  │    │
│  │  function getServices() {                                │    │
│  │    const catalog = require('@mcv/catalog/server');       │    │
│  │    return {                                              │    │
│  │      product: catalog.productService,                   │    │
│  │      category: catalog.categoryService,                 │    │
│  │      discount: catalog.discountService,                 │    │
│  │    };                                                    │    │
│  │  }                                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Service Size Distribution

```
                        Service Code Size Distribution
                        
  WorkflowEngine     ████████████████████████████████████████  102KB
  Intelligence       ████████████████████                       50KB
  AuthService        ████████████                               30KB
  AiService          ██████████                                 25KB
  CalendarService    ██████                                     15KB
  AppointmentService ████                                       12KB
  AvailabilityService ████                                      10KB
  GrantConcierge     ████                                       10KB
  ConversationService████                                       10KB
  TaskService        ████                                       10KB
  WorkflowService    ████                                       10KB
  GoogleSyncService  ███                                         8KB
  MfaService         ███                                         8KB
  PasskeyService     ███                                         8KB
  ...55 more         ██ (3-8KB each)
```

---

## Authentication Flow

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

```
┌─────────────────────────────────────────────────────────────────┐
│                    Permission Hierarchy                           │
│                                                                  │
│  Tier 0: Super Admin                                             │
│  ├── Full system access                                          │
│  ├── Cross-venture operations                                    │
│  ├── Model configuration                                         │
│  └── Platform settings                                           │
│                                                                  │
│  Tier 1: Venture Admin                                           │
│  ├── Full access within their venture                            │
│  ├── User management                                             │
│  └── Venture settings                                            │
│                                                                  │
│  Tier 2: Member                                                  │
│  ├── Standard access based on role permissions                   │
│  └── Within venture scope only                                   │
│                                                                  │
│  Tier 3: Guest                                                   │
│  └── Limited read-only access per role assignment                │
└─────────────────────────────────────────────────────────────────┘
```

### RBAC Permission Checks

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

### Agent Authentication

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  AI Agent     │────▶│  isAgent MW  │────▶│  AgentContext │
│               │     │              │     │              │
│  Headers:     │     │  Validate    │     │  agent.id    │
│  x-agent-id   │     │  x-agent-id  │     │  agent.name  │
│  x-agent-key  │     │  header      │     │  agentType   │
│  x-request-id │     │              │     │  autonomyLvl │
└──────────────┘     └──────────────┘     │  ventureScope│
                                           └──────────────┘
```

---

## Error Handling

### tRPC Error Code Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                    Error Code Mapping                             │
│                                                                  │
│  ┌─────────────────────┬──────────┬──────────────────────────┐  │
│  │ tRPC Code           │ HTTP     │ When Used                │  │
│  ├─────────────────────┼──────────┼──────────────────────────┤  │
│  │ BAD_REQUEST          │ 400      │ Invalid input, missing   │  │
│  │                      │          │ venture context          │  │
│  │ UNAUTHORIZED         │ 401      │ No session, expired      │  │
│  │ FORBIDDEN            │ 403      │ Insufficient perms,      │  │
│  │                      │          │ suspended, budget exceeded│  │
│  │ NOT_FOUND            │ 404      │ Resource not found       │  │
│  │ METHOD_NOT_SUPPORTED │ 405      │ Deprecated endpoint      │  │
│  │ CONFLICT             │ 409      │ Duplicate resource       │  │
│  │ TOO_MANY_REQUESTS    │ 429      │ Rate limit exceeded      │  │
│  │ INTERNAL_SERVER_ERROR│ 500      │ DB unavailable,          │  │
│  │                      │          │ unexpected errors        │  │
│  └─────────────────────┴──────────┴──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Error Response Structure

```typescript
// Standard tRPC error response
{
  error: {
    message: "Invalid email address",
    code: -32600,                    // JSON-RPC error code
    data: {
      code: "BAD_REQUEST",          // tRPC code
      httpStatus: 400,
      path: "auth.login",           // Procedure path
      zodError: {                   // Only for validation errors
        fieldErrors: {
          email: ["Invalid email address"],
          password: ["Password must be at least 8 characters"]
        },
        formErrors: []
      },
      stack: "..."                  // Only in development
    }
  }
}
```

### Error Patterns by Domain

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
  cause: error,
});

// Rate limited
throw new TRPCError({
  code: 'TOO_MANY_REQUESTS',
  message: 'Too many authentication attempts. Please try again later.',
  cause: { retryAfter: result.retryAfter, limit: result.limit },
});

// Deprecated endpoint
throw new TRPCError({
  code: 'METHOD_NOT_SUPPORTED',
  message: 'This endpoint is deprecated. Use authClient.twoFactor.enable()',
});

// Approval already resolved (business logic)
throw new TRPCError({
  code: 'BAD_REQUEST',
  message: `Approval already ${existing.status}`,
});
```

### Client-Side Error Handling

```typescript
import { TRPCClientError } from '@trpc/client';
import type { AppRouter } from '@mcv/api';

try {
  const result = await trpc.auth.login.mutate({ email, password });
} catch (error) {
  if (error instanceof TRPCClientError<AppRouter>) {
    switch (error.data?.code) {
      case 'UNAUTHORIZED':
        // Invalid credentials
        break;
      case 'FORBIDDEN':
        // Account suspended
        break;
      case 'TOO_MANY_REQUESTS':
        const retryAfter = error.data?.cause?.retryAfter;
        // Rate limited — retry in retryAfter seconds
        break;
    }

    // Zod validation errors
    if (error.data?.zodError) {
      const fieldErrors = error.data.zodError.fieldErrors;
      // { email: ['Invalid email'], password: ['Must be 8+ chars'] }
    }
  }
}
```

---

## Caching Strategy

### Current Approach

The API package currently relies on **no application-level caching** for most operations. Caching is handled by:

1. **tRPC React Query** — Client-side cache with automatic invalidation
2. **Better Auth session cache** — Sessions verified once per request
3. **Database connection pooling** — Reused connections via `@mcv/db`

### Rate Limiter Cache

The only server-side cache is the rate limiter's in-memory `Map`:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Rate Limiter Memory Cache                      │
│                                                                  │
│  Storage: Map<string, RateLimitEntry>                           │
│  Cleanup: Every 60 seconds                                       │
│  TTL: 5 minutes of inactivity                                   │
│  Scope: Per-process (not shared across instances)               │
│                                                                  │
│  ┌───────────────────────────────────────────┐                  │
│  │  Scaling Note                              │                  │
│  │                                            │                  │
│  │  For horizontal scaling, replace with:     │                  │
│  │  • Redis sliding window                    │                  │
│  │  • Cloudflare Durable Objects              │                  │
│  │  • Upstash Rate Limit                      │                  │
│  └───────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

### Future Caching Opportunities

| Layer | Strategy | Benefit |
|-------|----------|---------|
| Session cache | Redis with 5-min TTL | Reduce Better Auth DB calls |
| Permission cache | Per-request memoization (already done) | N/A |
| Venture lookup | Redis with invalidation on update | Reduce DB round-trips |
| Static data | CDN edge caching for public endpoints | Reduce server load |
| Query results | React Query staleTime tuning | Reduce API calls |

---

## Input Validation Architecture

### Validation Pipeline

```
Client Input → tRPC Wire Format → SuperJSON Deserialize → Zod Parse → Handler
                                                             │
                                                             ▼
                                                    Validation Error?
                                                     ┌───────┴───────┐
                                                     │ Yes           │ No
                                                     ▼               ▼
                                              TRPCError(BAD_REQUEST) Handler executes
                                              + zodError.flatten()
```

### Schema Composition Patterns

```typescript
// Base schemas composed into endpoint-specific schemas
const createContactSchema = z.object({
  // Required fields
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),

  // Optional fields with defaults
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  status: statusSchema.default('active'),

  // Nested objects
  address: z.object({
    street: z.string().max(200),
    city: z.string().max(100),
    state: z.string().max(50),
    zip: z.string().max(20),
    country: z.string().length(2),
  }).optional(),

  // Reusable pagination
  ...offsetPaginationSchema.shape,

  // Date coercion
  birthDate: z.coerce.date().optional(),
});
```

### Validation Features

| Feature | Implementation | Example |
|---------|---------------|---------|
| Type coercion | `z.coerce.date()` | Strings → Date objects |
| Bounds checking | `.min()` / `.max()` | `z.number().min(0).max(100)` |
| Pattern validation | `.regex()` | Phone number format |
| Enum constraints | `z.enum()` | Status values |
| UUID enforcement | `z.string().uuid()` | All ID fields |
| Array limits | `.min(1).max(100)` | Batch operation IDs |
| Default values | `.default()` | Pagination defaults |
| Nullable | `.nullish()` | Cursor pagination |
| Nested validation | `z.object({})` | Complex inputs |
| Discriminated unions | `z.discriminatedUnion()` | Workflow conditions |

---

## Multi-Tenancy Architecture

### Venture Isolation

Every authenticated request is scoped to a venture (tenant):

```
┌──────────────────────────────────────────────────────────────────┐
│                    Multi-Tenancy Flow                             │
│                                                                  │
│  1. User logs in → session created with activeVentureId         │
│  2. createContext() → loads venture from DB                      │
│  3. ctx.venture injected into every procedure                   │
│  4. ventureProcedure guarantees ctx.venture is non-null         │
│  5. Service receives ventureId → all queries scoped             │
│  6. Database RLS adds additional tenant isolation                │
│                                                                  │
│  User ──▶ Session(ventureId) ──▶ Context(venture) ──▶ Service   │
│                                                         │        │
│                                              SELECT * FROM tasks │
│                                              WHERE venture_id =  │
│                                              ctx.venture.id      │
└──────────────────────────────────────────────────────────────────┘
```

### Venture Switching

```typescript
// auth.switchVenture — changes active venture mid-session
auth.switchVenture: protectedProcedure
  .input(z.object({ ventureId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    // Verify user is member of target venture
    // Update session.activeVentureId
    // Return new venture context
  })
```

---

## Serialization

### SuperJSON Transformer

SuperJSON preserves rich JavaScript types across the wire:

```
┌──────────────────────────────────────────────────────────────────┐
│                    SuperJSON Serialization                        │
│                                                                  │
│  Type          │ Server Value              │ Wire Format          │
│  ──────────────┼───────────────────────────┼────────────────────  │
│  Date          │ new Date('2026-02-08')    │ "2026-02-08T..."    │
│  BigInt        │ BigInt(1000)              │ "1000"              │
│  Map           │ new Map([['a',1]])        │ [["a",1]]           │
│  Set           │ new Set([1,2,3])          │ [1,2,3]             │
│  undefined     │ undefined                 │ preserved           │
│  RegExp        │ /abc/gi                   │ "/abc/gi"           │
│  NaN           │ NaN                       │ "NaN"               │
│  Infinity      │ Infinity                  │ "Infinity"          │
│                                                                  │
│  Meta object tracks type information for deserialization         │
└──────────────────────────────────────────────────────────────────┘
```

### tRPC Batching

The `httpBatchLink` client automatically batches concurrent queries:

```
Without batching:
  GET /api/trpc/auth.me          → 1 HTTP request
  GET /api/trpc/ventures.list    → 1 HTTP request
  GET /api/trpc/stats.overview   → 1 HTTP request
  Total: 3 requests

With httpBatchLink:
  GET /api/trpc/auth.me,ventures.list,stats.overview → 1 HTTP request
  Total: 1 request (responses array-indexed)
```

---

## Performance Characteristics

### Request Lifecycle Cost

| Phase | Typical Latency | Notes |
|-------|----------------|-------|
| Context creation | 5–20ms | Better Auth verify + DB lookups (venture, permissions) |
| Logger middleware | <1ms | Async/buffered log writes |
| Rate limit check | <1ms | In-memory Map lookup |
| Auth middleware | <1ms | Context field checks (already resolved) |
| Input validation | 1–5ms | Zod parsing (depends on schema complexity) |
| Router handler | 5–500ms | Business logic + database queries |
| SuperJSON serialization | 1–5ms | Transform response for wire format |
| **Total (typical)** | **15–530ms** | **Dominated by handler logic** |

### Optimization Strategies

1. **Parallel context loading** — Venture and permissions loaded concurrently after session verify
2. **Lazy service imports** — Catalog services use `require()` to avoid cold-start import chains
3. **In-memory rate limiting** — No Redis round-trip for rate limit checks
4. **Cursor pagination** — Available alongside offset pagination for large datasets
5. **Batch operations** — Bulk update/delete endpoints accept up to 100 IDs per request
6. **SuperJSON transformer** — Handles Date/BigInt without manual conversion
7. **Automatic cleanup** — Rate limiter cleans stale entries every 60s

### Scaling Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    Scaling Bottlenecks                            │
│                                                                  │
│  ┌─────────────────────────────────────────────┐                │
│  │ Rate Limiter (In-Memory)                     │                │
│  │                                              │                │
│  │ Problem: Not shared across instances          │                │
│  │ Solution: Redis adapter                      │                │
│  │ Impact: Low — only affects rate limit accuracy│                │
│  └─────────────────────────────────────────────┘                │
│                                                                  │
│  ┌─────────────────────────────────────────────┐                │
│  │ Session Verification (Per-Request)           │                │
│  │                                              │                │
│  │ Problem: Better Auth DB call on every request│                │
│  │ Solution: Session cache (Redis, 5-min TTL)   │                │
│  │ Impact: Medium — saves 5-10ms per request    │                │
│  └─────────────────────────────────────────────┘                │
│                                                                  │
│  ┌─────────────────────────────────────────────┐                │
│  │ Context Creation (2-3 DB Queries)            │                │
│  │                                              │                │
│  │ Problem: Session + venture + permissions      │                │
│  │ Solution: Cache per-session, invalidate on   │                │
│  │           venture switch                      │                │
│  │ Impact: Medium — saves 10-15ms per request   │                │
│  └─────────────────────────────────────────────┘                │
│                                                                  │
│  ┌─────────────────────────────────────────────┐                │
│  │ tRPC Batching (Already Optimized)            │                │
│  │                                              │                │
│  │ httpBatchLink batches concurrent queries into │                │
│  │ single HTTP request — no action needed       │                │
│  └─────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Client Integration Patterns

### Next.js App Router (API Route)

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

### Hono Edge Worker

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

### React Query Client

```typescript
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

// Usage:
// const { data } = trpc.catalog.listProducts.useQuery({ page: 1, pageSize: 20 });
// const mutation = trpc.calendar.book.useMutation();
```

### Server-Side Caller (SSR / RSC)

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

---

## Pagination Architecture

### Offset-Based Pagination

```typescript
// Standard pattern used by most list endpoints
export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize);
  return {
    items,
    meta: {
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

// Response shape:
// {
//   items: [...],
//   meta: { total: 42, page: 1, pageSize: 20, totalPages: 3, hasMore: true, hasPrevious: false }
// }
```

### Cursor-Based Pagination

```typescript
// For large datasets and real-time lists
export function encodeCursor(value: string | number | Date): string;   // Base64URL encoding
export function decodeCursor(cursor: string): string;                  // Base64URL decoding

export function buildCursorPaginatedResponse<T extends { id: string }>(
  items: T[],
  limit: number,
  cursorField?: keyof T
): CursorPaginatedResponse<T>;

// Response shape:
// {
//   items: [...],
//   meta: { hasMore: true, nextCursor: "base64url...", endCursor: "base64url..." }
// }
```

---

## OpenAPI Generation

The package generates an OpenAPI 3.0 spec for external consumers via `trpc-to-openapi`:

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenAPI Generation                             │
│                                                                  │
│  tRPC Routers ──▶ trpc-to-openapi ──▶ OpenAPI 3.0 Spec          │
│                                                                  │
│  Configuration:                                                  │
│  • Title: MCV.ONE API                                            │
│  • Version: 1.0.0                                                │
│  • Base URL: http://localhost:3000/api                           │
│  • Tags: auth, ventures, users, payments                        │
│  • Security: Bearer JWT                                          │
│                                                                  │
│  Output:                                                         │
│  • JSON OpenAPI spec                                             │
│  • Can be consumed by Swagger UI, Postman, SDK generators       │
│  • Generated via `pnpm generate:openapi`                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layers                                │
│                                                                  │
│  Layer 1: Transport                                              │
│  ├── HTTPS enforced in production                                │
│  └── CORS policies on Hono/Next.js                              │
│                                                                  │
│  Layer 2: Rate Limiting                                          │
│  ├── 5 presets covering all endpoint types                      │
│  ├── Per-IP for public, per-user for authenticated              │
│  └── Sliding window prevents burst abuse                         │
│                                                                  │
│  Layer 3: Authentication                                         │
│  ├── Better Auth session verification                            │
│  ├── Session cookies (HttpOnly, Secure, SameSite)               │
│  └── Web3 wallet signature verification                          │
│                                                                  │
│  Layer 4: Authorization                                          │
│  ├── 4-tier RBAC hierarchy                                       │
│  ├── Granular permission checks                                  │
│  └── Venture-scoped data isolation                               │
│                                                                  │
│  Layer 5: Input Validation                                       │
│  ├── Zod schema on every endpoint                                │
│  ├── UUID format enforcement                                     │
│  └── Array length limits (max 100 for bulk ops)                 │
│                                                                  │
│  Layer 6: Database                                               │
│  ├── Row-Level Security (RLS) policies                           │
│  ├── Venture isolation at SQL level                              │
│  └── Soft deletes (no data loss)                                 │
│                                                                  │
│  Layer 7: Audit                                                  │
│  ├── All mutations audit-logged                                  │
│  ├── User, IP, resource, action recorded                        │
│  └── Tamper-proof audit trail                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Sensitive Data Handling

| Data Type | Protection | Implementation |
|-----------|-----------|----------------|
| Passwords | Bcrypt hashing | `hashPassword()` / `verifyPassword()` |
| Sessions | HttpOnly cookies | Better Auth cookie config |
| JWT secrets | Environment variables | `BETTER_AUTH_SECRET` |
| API keys | GCP Secret Manager | `@mcv/secrets` |
| Logs | Field redaction | Pino `redact` config |
| Error stacks | Dev-only exposure | `NODE_ENV` check in error formatter |

---

## Testing Architecture

### Test Pyramid

```
                    ┌─────────┐
                    │   E2E   │  Few — full HTTP requests
                    │  Tests  │  via Playwright or similar
                    ├─────────┤
                    │         │
                ┌───┤ Integr. ├───┐  Medium — full procedure
                │   │  Tests  │   │  calls via createCallerFactory
                │   ├─────────┤   │
                │   │         │   │
            ┌───┤   │  Unit   │   ├───┐  Many — service logic
            │   │   │  Tests  │   │   │  with mocked DB
            │   │   └─────────┘   │   │
            └───┴─────────────────┴───┘
```

### Integration Test Pattern

```typescript
import { appRouter, createCallerFactory } from '@mcv/api';

const createCaller = createCallerFactory(appRouter);

describe('catalog.listProducts', () => {
  it('returns paginated products for venture', async () => {
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

    const result = await caller.catalog.listProducts({
      page: 1,
      pageSize: 10,
      status: 'active',
    });

    expect(result.items).toHaveLength(10);
    expect(result.meta.total).toBeGreaterThan(0);
    expect(result.meta.hasMore).toBe(true);
  });
});
```

---

*@mcv/api — Technical Architecture — The tRPC API Pipeline*
