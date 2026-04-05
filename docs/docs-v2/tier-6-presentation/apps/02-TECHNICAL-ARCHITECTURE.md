# @mcv/apps — Technical Architecture

| Field            | Value                                    |
| ---------------- | ---------------------------------------- |
| **Package**      | `@mcv/apps`                              |
| **Scope**        | INTERNAL                                 |
| **Tier**         | 6 — Presentation Layer                   |
| **Framework**    | Next.js 15.0.7 (App Router)             |
| **Last Updated** | February 2026                            |

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Application Architecture](#application-architecture)
4. [Next.js App Router Structure](#nextjs-app-router-structure)
5. [Middleware Architecture](#middleware-architecture)
6. [Server Components vs Client Components](#server-components-vs-client-components)
7. [Data Fetching Patterns](#data-fetching-patterns)
8. [State Management](#state-management)
9. [Real-time Features](#real-time-features)
10. [Performance Architecture](#performance-architecture)
11. [Security Architecture](#security-architecture)
12. [Deployment Pipeline](#deployment-pipeline)

---

## Architecture Overview

`@mcv/apps` implements a **layered presentation architecture** built on Next.js 15's App Router. The architecture is organized around three fundamental principles:

1. **Server-first rendering** — React Server Components (RSC) are the default; client interactivity is opt-in
2. **Feature-sliced design** — Each capability is a self-contained module under `features/`
3. **Context-driven adaptation** — The Chameleon Engine dynamically adapts every aspect of the UI based on auth state, venture context, and user permissions

### Architectural Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│                     BROWSER (User Agent)                             │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                 Client-Side Layer                             │    │
│  │  • React hydration & interactivity                           │    │
│  │  • Zustand stores (10 stores)                                │    │
│  │  • React Query cache (tRPC)                                  │    │
│  │  • URL state (nuqs)                                          │    │
│  │  • WebSocket subscriptions (Pusher)                          │    │
│  │  • Command palette (cmdk)                                    │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │ hydrate / fetch                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│                     EDGE LAYER (Vercel Edge / Cloudflare)            │
│                              │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐    │
│  │                    Middleware                                 │    │
│  │  • Authentication check (cookie validation)                  │    │
│  │  • Rate limiting (Upstash Redis)                             │    │
│  │  • Security headers injection (CSP, HSTS)                    │    │
│  │  • Request routing (public vs. authenticated)                │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│                     SERVER LAYER (Node.js / Serverless)               │
│                              │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐    │
│  │               React Server Components (RSC)                  │    │
│  │  • Route layouts (5 nesting levels)                          │    │
│  │  • Page components (169 pages)                               │    │
│  │  • Data fetching (direct DB/API access)                      │    │
│  │  • Streaming (Suspense boundaries)                           │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐    │
│  │                   API Route Handlers                          │    │
│  │  • tRPC catch-all handler (/api/trpc/[trpc])                 │    │
│  │  • REST endpoints (75 route.ts files)                        │    │
│  │  • Webhook handlers (Stripe, storage)                        │    │
│  │  • Better Auth handler (/api/auth/[...all])                  │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ queries / mutations
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES                                  │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │ Supabase   │  │ Upstash    │  │ S3/Storage  │  │ Pusher       │  │
│  │ PostgreSQL │  │ Redis      │  │             │  │ (Realtime)   │  │
│  │ + RLS      │  │            │  │             │  │              │  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────────┘  │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │ OpenAI     │  │ Anthropic  │  │ Stripe     │  │ Resend       │  │
│  │ (AI)       │  │ (AI)       │  │ (Payments) │  │ (Email)      │  │
│  └────────────┘  └────────────┘  └────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## System Diagram

### Next.js App Router Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        app/ (Root)                               │
│                                                                  │
│  layout.tsx ─── RootLayout                                       │
│  │  ├── Fonts: Inter + JetBrains Mono                           │
│  │  ├── Metadata: "MCV.ONE Super Admin"                         │
│  │  ├── Theme: Dark mode (forced via className="dark")          │
│  │  └── <Providers>                                             │
│  │       ├── TRPCProvider          (API client)                 │
│  │       ├── HeroUIProvider        (UI components)              │
│  │       ├── NextThemesProvider    (theme management)           │
│  │       ├── AuthProvider          (session + RBAC)             │
│  │       ├── VentureProvider       (multi-tenancy)              │
│  │       └── NotificationProvider  (alerts)                     │
│  │                                                               │
│  ├── (auth)/ ─── Auth Route Group                               │
│  │   ├── layout.tsx ─── Minimal centered layout (no shell)      │
│  │   ├── login/                                                  │
│  │   ├── register/                                               │
│  │   ├── forgot-password/                                        │
│  │   ├── reset-password/                                         │
│  │   ├── magic-link/                                             │
│  │   ├── mfa/setup/                                              │
│  │   ├── mfa/verify/                                             │
│  │   ├── oauth/callback/                                         │
│  │   └── verify-email/                                           │
│  │                                                               │
│  ├── (dashboard)/ ─── Dashboard Route Group                     │
│  │   ├── layout.tsx ─── Dashboard Layout                        │
│  │   │   ├── VentureContextProvider                             │
│  │   │   ├── PermissionsProvider                                │
│  │   │   ├── MCVShell (sidebar + header + breadcrumbs)          │
│  │   │   ├── CommandMenu (⌘K)                                   │
│  │   │   └── HeaderTicker (NAOS live feed)                      │
│  │   │                                                           │
│  │   ├── (global)/ ─── Tier 0 Super Admin                      │
│  │   │   ├── layout.tsx ─── GlobalContextProvider               │
│  │   │   │                                                       │
│  │   │   ├── admin/ ──────── Administration (40 pages)          │
│  │   │   │   ├── users/                                          │
│  │   │   │   ├── roles/                                          │
│  │   │   │   ├── ventures/                                       │
│  │   │   │   ├── flags/                                          │
│  │   │   │   ├── storage/                                        │
│  │   │   │   ├── email/                                          │
│  │   │   │   ├── gateway/                                        │
│  │   │   │   ├── audit/                                          │
│  │   │   │   ├── command/ (AI agents, approvals, automations)   │
│  │   │   │   └── marketing/ (campaigns, studio, brand)          │
│  │   │   │                                                       │
│  │   │   ├── ai-command/ ─── AI Command Center (8 pages)        │
│  │   │   │   ├── agents/                                         │
│  │   │   │   ├── gateway/                                        │
│  │   │   │   ├── hitl/                                           │
│  │   │   │   ├── naos/                                           │
│  │   │   │   ├── queen/                                          │
│  │   │   │   ├── reasoning/                                      │
│  │   │   │   └── swarm/                                          │
│  │   │   │                                                       │
│  │   │   ├── analytics/ ──── Analytics (1 page)                 │
│  │   │   ├── approvals/ ──── Approvals (1 page)                 │
│  │   │   ├── catalog/ ────── Product Catalog (5 pages)          │
│  │   │   ├── contact-center/ Contact Center (2 pages)           │
│  │   │   ├── crm/ ────────── CRM (9 pages)                     │
│  │   │   ├── documents/ ──── Document Studio (4 pages)          │
│  │   │   ├── engineering/ ── Engineering (1 page)               │
│  │   │   ├── grants/ ─────── Grant Concierge (1 page)          │
│  │   │   ├── integrations/ ─ Integrations (1 page)              │
│  │   │   ├── intelligence/ ─ Intelligence (1 page)              │
│  │   │   ├── invoicing/ ──── Invoicing (8 pages)               │
│  │   │   ├── knowledge/ ──── Knowledge (4 pages)               │
│  │   │   ├── onboarding/ ─── Onboarding (1 page)               │
│  │   │   ├── ops/ ────────── Operations (1 page)               │
│  │   │   ├── platform/ ───── Platform (4 pages)                │
│  │   │   ├── portfolio/ ──── Portfolio (6 pages)               │
│  │   │   ├── portfolio-health/ Portfolio Health (1 page)        │
│  │   │   ├── settings/ ───── Settings (9 pages)                │
│  │   │   ├── signals/ ────── Signals (1 page)                  │
│  │   │   ├── strategy/ ───── Strategy (4 pages)                │
│  │   │   ├── swarm/ ──────── Swarm (1 page)                    │
│  │   │   ├── tasks/ ──────── Tasks (3 pages)                   │
│  │   │   ├── token-economy/ ─ Token Economy (1 page)            │
│  │   │   ├── treasury/ ───── Treasury (1 page)                 │
│  │   │   └── workflows/ ──── Workflows (2 pages)               │
│  │   │                                                           │
│  │   ├── cms/ ─────────────── CMS (5 pages)                    │
│  │   ├── media/ ───────────── Media Library (1 page)            │
│  │   │                                                           │
│  │   └── v/[ventureSlug]/ ── Venture Routes (9 pages)          │
│  │       ├── layout.tsx ──── VentureLayout                      │
│  │       ├── engineering/                                        │
│  │       ├── growth/                                             │
│  │       ├── operations/                                         │
│  │       ├── settings/                                           │
│  │       └── tasks/                                              │
│  │                                                               │
│  ├── (public)/ ─── Public Route Group                           │
│  │   └── portfolio/ (2 pages)                                    │
│  │                                                               │
│  ├── api/ ──────── API Route Handlers (75 routes)               │
│  │   ├── trpc/[trpc]/route.ts  (tRPC catch-all)                │
│  │   ├── auth/[...all]/route.ts (Better Auth)                   │
│  │   ├── users/                                                  │
│  │   ├── ventures/                                               │
│  │   ├── flags/                                                  │
│  │   ├── audit/                                                  │
│  │   ├── activities/                                             │
│  │   ├── storage/                                                │
│  │   ├── notifications/                                          │
│  │   ├── gateway/                                                │
│  │   ├── permissions/                                            │
│  │   ├── roles/                                                  │
│  │   ├── public/                                                 │
│  │   ├── webhooks/                                               │
│  │   └── health/                                                 │
│  │                                                               │
│  ├── forbidden/ ── 403 Page                                     │
│  └── maintenance/ ─ Maintenance Page                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component & Feature Dependency Map

```
┌─────────────────────────────────────────────────────────────┐
│                      Route Pages (169)                       │
│    app/(dashboard)/(global)/crm/page.tsx                     │
│    app/(dashboard)/(global)/admin/users/page.tsx             │
│    ...                                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ compose
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Feature Modules (35)                         │
│    features/crm/components/DealKanban.tsx                     │
│    features/auth/components/LoginForm.tsx                     │
│    features/ai-command/components/SwarmVisualization.tsx      │
│    ...                                                       │
└────┬────────────────────────┬───────────────────────────────┘
     │                        │
     │ import                 │ import
     ▼                        ▼
┌──────────────┐   ┌──────────────────────────────────────────┐
│  @mcv/ui     │   │           Custom Hooks                    │
│  MCVShell    │   │  hooks/use-realtime.ts                    │
│  HeroUI      │   │  hooks/use-presence.ts                    │
│  Design sys  │   │  hooks/use-url-state.ts                   │
└──────────────┘   │  hooks/use-live-query.ts                  │
                   └──────────────────────────┬───────────────┘
                                              │
                                              │ use
                                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    State Layer                                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Zustand      │  │ React Query  │  │ nuqs         │      │
│  │ (10 stores)  │  │ (tRPC)       │  │ (URL state)  │      │
│  │              │  │              │  │              │      │
│  │ navigation   │  │ server state │  │ search/page  │      │
│  │ auth-ui      │  │ cache        │  │ filters      │      │
│  │ crm          │  │ optimistic   │  │ sort/order   │      │
│  │ ai-command   │  │ updates      │  │              │      │
│  │ portfolio    │  │              │  │              │      │
│  │ ...          │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Application Architecture

### Super-Admin Application (`@mcv/admin`)

The Super-Admin is organized into functional domains, each serving a distinct operational need:

#### Command Center Domain

The executive dashboard and real-time monitoring hub:

| Component | Route | Key Features |
|-----------|-------|--------------|
| **Mission Control** | `/` | KPI tiles, pending approvals count, recent activity feed, live signal ticker |
| **Portfolio Health** | `/portfolio-health` | Aggregate health scores across all ventures with trend sparklines |
| **Live Signals** | `/signals` | Real-time event feed from Supabase realtime subscriptions |
| **Pending Approvals** | `/approvals` | Cross-module approval queue (invoices, AI actions, access requests) |

#### Venture Management Domain

Complete lifecycle management for consortium ventures:

| Component | Route | Key Features |
|-----------|-------|--------------|
| **Venture Registry** | `/portfolio` | Card grid of all ventures with health indicators, status badges |
| **Venture Detail** | `/portfolio/[ventureSlug]` | Deep-dive intelligence profile with KPIs, team, financials |
| **Capital Stack** | `/portfolio/capital` | Investment tracking, cap table, funding rounds |
| **Entity Management** | `/portfolio/entities` | Corporate entity registry and legal structure |
| **Domain Portfolio** | `/portfolio/domains` | Domain name management, DNS, SSL |
| **Create Venture** | `/admin/ventures/new` | Multi-step venture creation wizard |

#### User Management Domain

Platform-wide user administration:

| Component | Route | Key Features |
|-----------|-------|--------------|
| **User Directory** | `/admin/users` | Searchable user list with role badges, venture assignments, status |
| **User Profile** | `/admin/users/[id]` | Detailed profile: roles, permissions, sessions, activity, audit trail |
| **Invitations** | `/admin/users/invitations` | Pending invitations management with resend/revoke |
| **Role Management** | `/admin/roles` | Role definition editor with permission matrix |
| **Permission Matrix** | `/admin/permissions` | Fine-grained permission management grid |

#### System Configuration Domain

Platform-level settings and configuration:

| Component | Route | Key Features |
|-----------|-------|--------------|
| **Feature Flags** | `/admin/flags` | Flag management with targeting rules, overrides, rollout percentages |
| **Email Config** | `/admin/email` | Email service configuration, templates, delivery logs |
| **Storage Admin** | `/admin/storage` | File storage overview, quota management per venture |
| **Gateway Admin** | `/admin/gateway` | AI Gateway configuration, model routing, budget limits |
| **Audit Log** | `/admin/audit` | Security audit trail with advanced filters and export |

#### AI Agent Management Domain

The AI Command Center for managing the multi-agent system:

| Component | Route | Key Features |
|-----------|-------|--------------|
| **Swarm Overview** | `/ai-command` | Dashboard showing all agent statuses, task queues, performance metrics |
| **Agent Management** | `/ai-command/agents` | Configure AI agents: capabilities, models, permissions, rate limits |
| **Queen Orchestrator** | `/ai-command/queen` | Master orchestrator control panel for multi-agent coordination |
| **NAOS Registry** | `/ai-command/naos` | Named Agent Ontology System — agent identity and capability registry |
| **HITL Center** | `/ai-command/hitl` | Human-in-the-Loop approval queue for AI-generated actions |
| **Active Swarm** | `/ai-command/swarm` | Real-time swarm visualization using @xyflow/react flow diagrams |
| **AI Gateway** | `/ai-command/gateway` | Model routing, rate limiting, cost tracking, budget management |
| **Reasoning Engine** | `/ai-command/reasoning` | AI reasoning chain viewer for debugging agent decision-making |

### Venture Admin Application (`@mcv/venture-admin`)

The Venture Admin is architecturally identical to the Super-Admin's venture context (`/v/[ventureSlug]/`) but deployed as a standalone application with:

#### Venture Dashboard

| Component | Route | Key Features |
|-----------|-------|--------------|
| **Mission Control** | `/` | Venture-specific KPIs, health score, team activity |
| **Operations** | `/operations` | Operational monitoring, deployments, infrastructure |
| **Growth** | `/growth` | Growth metrics, analytics, campaign performance |
| **Engineering** | `/engineering` | Venture engineering workbench, sprint planning |
| **Tasks** | `/tasks` | Project management, kanban boards, HITL tasks |
| **Settings** | `/settings` | Venture configuration, branding, domains, team |

#### Domain-Specific Pages

Each venture can activate domain modules from the shared feature library:

| Module | Availability | Description |
|--------|-------------|-------------|
| **CRM** | All ventures | Venture-scoped contacts, deals, pipeline |
| **Catalog** | Consumer ventures | Product management for e-commerce ventures |
| **Invoicing** | Service ventures | Invoice and proposal management |
| **Content** | All ventures | CMS for venture-specific content |
| **Documents** | All ventures | Document creation and templates |

#### User & Role Management

| Component | Description |
|-----------|-------------|
| **Team Directory** | Venture team members with roles and status |
| **Role Assignment** | Assign Tier 1–3 roles within the venture |
| **Invitations** | Invite new team members to the venture |
| **Access Requests** | Review and approve access requests |

---

## Next.js App Router Structure

### Route Groups

The application uses four route groups to separate concerns without affecting URL structure:

#### `(auth)/` — Authentication Group

```typescript
// (auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

- **No shell** — Minimal centered layout without sidebar or header
- **Public access** — No session required (middleware allows these paths)
- **9 pages** — Login, register, forgot/reset password, magic link, MFA setup/verify, OAuth callback, email verification

#### `(dashboard)/` — Dashboard Group

```typescript
// (dashboard)/layout.tsx
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <VentureContextProvider>
      <PermissionsProvider user={permissionsUser} organizationId={activeVenture?.slug ?? null}>
        <MCVShell
          sidebarCollapsed={sidebarCollapsed}
          headerProps={headerProps}
          sidebarProps={sidebarProps}
        >
          <CommandMenu />
          <HeaderTicker />
          {children}
        </MCVShell>
      </PermissionsProvider>
    </VentureContextProvider>
  );
}
```

- **Full shell** — MCVShell provides sidebar, header, breadcrumbs, and the command palette
- **Authenticated** — Middleware redirects unauthenticated users to `/login`
- **Two nested groups:**
  - `(global)/` — Tier 0 Super Admin routes with `GlobalContextProvider`
  - `v/[ventureSlug]/` — Tier 1 per-venture routes with `VentureLayout`

#### `(public)/` — Public Group

- **No auth required** — Accessible to anyone
- **Minimal layout** — Marketing/portfolio presentation
- **2 pages** — Portfolio showcase, venture profiles

#### `api/` — API Routes

- **75 route handlers** — tRPC, REST, webhooks, health
- **Serverless** — Each handler runs as an independent serverless function
- **Auth validated** — Middleware checks session for non-public API routes

### Layouts

The application employs a **five-level layout nesting** strategy:

```
Level 1: RootLayout (app/layout.tsx)
│  Fonts, metadata, theme, Providers wrapper
│
├── Level 2: AuthLayout (app/(auth)/layout.tsx)
│   Minimal centered layout
│
├── Level 2: DashboardLayout (app/(dashboard)/layout.tsx)
│   │  MCVShell, permissions, venture context
│   │
│   ├── Level 3: GlobalLayout (app/(dashboard)/(global)/layout.tsx)
│   │   │  GlobalContextProvider (layer="global")
│   │   │
│   │   ├── Level 4: AdminLayout (admin/layout.tsx)
│   │   ├── Level 4: CRMLayout (crm/layout.tsx)
│   │   ├── Level 4: CatalogLayout (catalog/layout.tsx)
│   │   ├── Level 4: AICommandLayout (ai-command/layout.tsx)
│   │   ├── Level 4: StrategyLayout (strategy/layout.tsx)
│   │   ├── Level 4: TreasuryLayout (treasury/layout.tsx)
│   │   ├── Level 4: InvoicingLayout (invoicing/layout.tsx)
│   │   ├── Level 4: PortfolioLayout (portfolio/layout.tsx)
│   │   ├── Level 4: SettingsLayout (settings/layout.tsx)
│   │   ├── Level 4: KnowledgeLayout (knowledge/layout.tsx)
│   │   ├── Level 4: PlatformLayout (platform/layout.tsx)
│   │   ├── Level 4: TokenEconomyLayout (token-economy/layout.tsx)
│   │   ├── Level 4: EngineeringLayout (engineering/layout.tsx)
│   │   ├── Level 4: GrantsLayout (grants/layout.tsx)
│   │   ├── Level 4: IntelligenceLayout (intelligence/layout.tsx)
│   │   └── Level 4: WorkflowsLayout (workflows/layout.tsx)
│   │       │
│   │       └── Level 5: Specific page layouts (e.g., admin/marketing/layout.tsx)
│   │
│   └── Level 3: VentureLayout (app/(dashboard)/v/[ventureSlug]/layout.tsx)
│       Venture-scoped context, dynamic theming
│
└── Level 2: PublicLayout (app/(public)/layout.tsx)
    Portfolio public view
```

### Loading States

Every route segment defines a `loading.tsx` file that provides an instant skeleton:

```typescript
// (dashboard)/(global)/crm/loading.tsx
export default function CRMLoading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}
```

Loading states are rendered **instantly** while the Server Component data fetches, providing:
- Zero-delay navigation between route segments
- Progressive content reveal as data streams in
- Consistent loading patterns across the application

### Error Boundaries

Each module defines an `error.tsx` file for graceful error handling:

```typescript
// (dashboard)/(global)/crm/error.tsx
'use client';

export default function CRMError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-xl font-semibold text-zinc-200">Something went wrong</h2>
      <p className="text-zinc-400 mt-2">{error.message}</p>
      <Button onClick={reset} className="mt-4">Try Again</Button>
    </div>
  );
}
```

Error boundaries catch rendering errors within their segment without crashing the entire page — the shell, sidebar, and header remain functional.

### Module Layout Pattern

Each major module under `(global)/` follows a consistent layout pattern:

```typescript
// (global)/crm/layout.tsx
export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleContextProvider module="crm">
      <ModuleNavigation tabs={crmTabs} />
      {children}
    </ModuleContextProvider>
  );
}
```

Module layouts provide:
- **Tab navigation** — Horizontal tabs within the module (contacts, deals, organizations)
- **Module context** — Active filters, view preferences, module-specific state
- **Breadcrumb integration** — Automatic breadcrumb trail from the global navigation system
- **Permission gating** — Module-level permission checks before rendering children

---

## Middleware Architecture

### Middleware Pipeline

The `src/middleware.ts` executes at the **Edge** (before any page or API route) and processes requests through a three-stage pipeline:

```
┌──────────────────────────────────────────────────────────────┐
│                     Incoming Request                          │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  Stage 1: PATH CLASSIFICATION                                │
│                                                              │
│  Is this a public path?                                      │
│  ├── YES → Skip auth, proceed to response                   │
│  └── NO  → Continue to Stage 2                              │
│                                                              │
│  Public paths:                                               │
│  /login, /register, /forgot-password, /reset-password,       │
│  /verify-email, /magic-link, /oauth, /mfa,                   │
│  /api/auth, /api/trpc/auth.*, /api/health,                   │
│  /_next, /favicon.ico, /robots.txt, /sitemap.xml             │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  Stage 2: AUTHENTICATION CHECK                               │
│                                                              │
│  Read session cookie: better-auth.session_token              │
│  ├── Cookie missing:                                         │
│  │   ├── Page request → Redirect to /login?callbackUrl=...  │
│  │   └── API request  → Return 401 JSON                     │
│  └── Cookie present → Continue to Stage 3                   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  Stage 3: RATE LIMITING (auth-sensitive routes only)         │
│                                                              │
│  Evaluate request against Upstash Redis rate limiter:        │
│  ├── /login           → 5 req / 1 min                       │
│  ├── /register        → 3 req / 1 min                       │
│  ├── /forgot-password → 3 req / 5 min                       │
│  ├── /mfa/verify      → 5 req / 5 min                       │
│  ├── /magic-link      → 3 req / 5 min                       │
│  └── /passkey         → 10 req / 1 min                      │
│                                                              │
│  Rate-limited → Return 429 with Retry-After header          │
│  OK → Continue to response                                   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  Response: INJECT SECURITY HEADERS                           │
│                                                              │
│  X-Content-Type-Options: nosniff                             │
│  X-Frame-Options: DENY                                       │
│  X-XSS-Protection: 1; mode=block                             │
│  Referrer-Policy: strict-origin-when-cross-origin            │
│  Content-Security-Policy: default-src 'self'; ...            │
└──────────────────────────────────────────────────────────────┘
```

### Middleware Matcher Configuration

```typescript
export const config = {
  matcher: [
    // Match all paths except static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
```

This matcher ensures middleware runs on:
- ✅ All page requests
- ✅ All API route requests
- ✅ All dynamic routes
- ❌ Static assets (`_next/static`, images, favicon)

### Auth Middleware — Session Validation

The auth middleware validates the session cookie but does **not** perform database lookups at the Edge. Full session enrichment (RBAC, permissions, venture access) happens in the `AuthProvider` after the page loads.

```
Edge Middleware:  Cookie exists? → Allow/Deny
AuthProvider:    Cookie valid? → Enrich with RBAC via tRPC
PermissionsProvider: User tier? → Gate UI components
```

This split keeps Edge middleware fast (~1ms) while allowing rich authorization logic in the React tree.

### Tenant Resolution

Tenant resolution happens at two levels:

1. **URL-based** — For venture-scoped routes (`/v/[ventureSlug]/`), the venture is extracted from the URL path
2. **Context-based** — For global routes, the active venture is determined by the navigation store (user's last selected venture)

The Venture Admin application uses **domain-based** tenant resolution:
- `betedge.mcv.one` → BetEdge AI context
- `edgeiq.mcv.one` → EdgeIQ Markets context
- `mcvgg.mcv.one` → MCV Gaming context

### RBAC Middleware

Permission checks are **not** performed in Edge middleware (which lacks database access). Instead, RBAC is enforced at three levels:

| Level | Mechanism | Enforcement |
|-------|-----------|-------------|
| **Component** | `<PermissionGate>`, `<SuperAdminOnly>` | Hide/show UI elements |
| **Page** | Layout-level permission checks | Redirect to `/forbidden` |
| **API** | tRPC context middleware | Return 403 error |

---

## Server Components vs Client Components

### Strategy

The application follows a **server-first** strategy where all components are React Server Components by default. Client Components are used **only when interactivity requires it**.

```
┌─────────────────────────────────────────────────────────────┐
│                   Component Decision Tree                     │
│                                                              │
│  Does the component need...                                  │
│  ├── Event handlers (onClick, onChange)?    → Client         │
│  ├── React hooks (useState, useEffect)?    → Client         │
│  ├── Browser APIs (localStorage, etc.)?    → Client         │
│  ├── Animations (Framer Motion)?           → Client         │
│  ├── Real-time subscriptions?              → Client         │
│  ├── Form management (React Hook Form)?    → Client         │
│  ├── Drag-and-drop (@dnd-kit)?             → Client         │
│  ├── None of the above?                    → Server ✓       │
│  └── Database/API access on render?        → Server ✓       │
└─────────────────────────────────────────────────────────────┘
```

### Server Component Usage

Server Components are used for:

| Use Case | Example |
|----------|---------|
| **Page shells** | Layout components that fetch initial data |
| **Data-heavy displays** | Tables, lists, detail views with SSR |
| **Static content** | Documentation pages, settings descriptions |
| **Metadata** | Dynamic page titles, OpenGraph tags |
| **Permission checks** | Server-side auth validation before rendering |
| **Data transformation** | Formatting dates, currencies, numbers |

```typescript
// Example Server Component — User List Page
// app/(dashboard)/(global)/admin/users/page.tsx
// NO 'use client' directive — this is a Server Component

import { trpc } from '@/lib/trpc/server';

export default async function UsersPage() {
  const users = await trpc.users.list({ page: 1, limit: 20 });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-zinc-100">User Management</h1>
      <UserTable users={users} />  {/* Client component for interactivity */}
    </div>
  );
}
```

### Client Component Usage

Client Components (`'use client'`) are used for:

| Use Case | Example Component |
|----------|-------------------|
| **Interactive forms** | LoginForm, VentureForm, InvoiceEditor |
| **Data tables with sorting/filtering** | UserTable, DealTable (via @tanstack/react-table) |
| **Kanban boards** | DealKanban (via @dnd-kit) |
| **Charts and visualizations** | TrendChart, PLStatement (via Recharts) |
| **Flow diagrams** | SwarmVisualization, WorkflowBuilder (via @xyflow/react) |
| **Command palette** | CommandMenu (via cmdk) |
| **Real-time components** | SignalFeed, PresenceIndicator |
| **Rich text editor** | DocumentEditor (via TipTap) |
| **Animations** | Page transitions, loading animations (via Framer Motion) |
| **Theme switcher** | AppearanceSettings (via next-themes) |

```typescript
// Example Client Component — CRM Deal Kanban
// features/crm/components/DealKanban.tsx
'use client';

import { DndContext, closestCorners } from '@dnd-kit/core';
import { trpc } from '@/lib/trpc/client';
import { useCRMStore } from '@/stores/crm-store';

export function DealKanban() {
  const { data: deals } = trpc.crm.deals.list.useQuery();
  const { activeFilters } = useCRMStore();
  const updateDeal = trpc.crm.deals.update.useMutation();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over) {
      updateDeal.mutate({ id: active.id, stage: over.id });
    }
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      {/* Kanban columns */}
    </DndContext>
  );
}
```

### Composition Pattern

The standard pattern composes Server and Client Components:

```typescript
// Server Component (page.tsx) — fetches data, renders shell
export default async function CRMPage() {
  const initialDeals = await trpc.crm.deals.list({ limit: 50 });

  return (
    <div className="p-6">
      <PageHeader title="CRM Pipeline" />          {/* Server: static header */}
      <DealStats deals={initialDeals} />            {/* Server: computed stats */}
      <DealKanban initialData={initialDeals} />     {/* Client: interactive kanban */}
    </div>
  );
}

// Client Component — receives pre-fetched data, adds interactivity
'use client';
function DealKanban({ initialData }: { initialData: Deal[] }) {
  const { data: deals } = trpc.crm.deals.list.useQuery(undefined, {
    initialData,          // Pre-fetched from server — no loading flash
    refetchInterval: 30000,  // Refresh every 30s
  });
  // ... interactive kanban rendering
}
```

---

## Data Fetching Patterns

### tRPC Client Configuration

```typescript
// lib/trpc/client.ts — Client-side tRPC setup
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@mcv/api';

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCLinks() {
  return [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      // Auth: HttpOnly cookies sent automatically — no manual token injection
    }),
  ];
}
```

**Key design decisions:**
- **`httpBatchLink`** — Batches multiple concurrent tRPC calls into a single HTTP request
- **`superjson`** — Serializes Date, Map, Set, BigInt transparently between client and server
- **No auth headers** — Session cookie is HttpOnly; sent automatically by the browser
- **Unified router** — The `@mcv/api` package aggregates all domain routers into a single `AppRouter`

### Pattern 1: Simple Query

```typescript
// Basic data fetching with automatic caching and refetching
const { data: users, isLoading, error } = trpc.users.list.useQuery({
  page: 1,
  limit: 20,
  search: searchQuery,
});
```

### Pattern 2: Dependent Query

```typescript
// RBAC enrichment — only fetch when session exists
const { data: rbacData } = trpc.auth.me.useQuery(undefined, {
  enabled: !!sessionData?.user,     // Don't fetch until session is available
  staleTime: 5 * 60 * 1000,        // 5-minute stale time for RBAC data
});
```

### Pattern 3: Mutation with Cache Invalidation

```typescript
const utils = trpc.useUtils();

const updateUser = trpc.users.update.useMutation({
  onSuccess: () => {
    utils.users.list.invalidate();    // Refetch user list
    utils.users.get.invalidate();     // Refetch user detail
    toast.success('User updated');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

### Pattern 4: Optimistic Update

```typescript
const toggleFlag = trpc.flags.update.useMutation({
  onMutate: async (newData) => {
    // Cancel outgoing queries
    await utils.flags.list.cancel();

    // Snapshot previous value
    const previousFlags = utils.flags.list.getData();

    // Optimistically update the cache
    utils.flags.list.setData(undefined, (old) =>
      old?.map((flag) =>
        flag.id === newData.id ? { ...flag, ...newData } : flag
      )
    );

    return { previousFlags };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    utils.flags.list.setData(undefined, context?.previousFlags);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    utils.flags.list.invalidate();
  },
});
```

### Pattern 5: Infinite Query (Pagination)

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = trpc.activities.feed.useInfiniteQuery(
  { limit: 20 },
  {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  },
);

// Flatten pages into a single array
const activities = data?.pages.flatMap((page) => page.items) ?? [];
```

### Pattern 6: Server-Side Data Fetching (RSC)

```typescript
// lib/trpc/server.ts — Server-side tRPC caller
import { createCallerFactory } from '@trpc/server';
import { appRouter } from '@mcv/api';
import { createContext } from '@mcv/api/context';

const createCaller = createCallerFactory(appRouter);

export async function getServerCaller() {
  const context = await createContext();
  return createCaller(context);
}

// Usage in a Server Component
export default async function UsersPage() {
  const caller = await getServerCaller();
  const users = await caller.users.list({ page: 1, limit: 20 });
  return <UserTable users={users} />;
}
```

### React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      staleTime: 60 * 1000,     // 1 minute default stale time
      retry: 1,                  // Retry once on failure
    },
    mutations: {
      retry: 1,                  // Retry mutations once on network error
    },
  },
});
```

### Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useQuery` | `hooks/use-query.ts` | Enhanced query hook with unified loading/error states |
| `useLiveQuery` | `hooks/use-live-query.ts` | Query with live updates (polling or WebSocket fallback) |
| `useRealtime` | `hooks/use-realtime.ts` | WebSocket/SSE subscription for real-time data |
| `usePresence` | `hooks/use-presence.ts` | User presence tracking (online/offline/idle) |
| `useUrlState` | `hooks/use-url-state.ts` | URL-synced state management (wraps nuqs) |
| `useControllableState` | `hooks/use-controllable-state.ts` | Controlled/uncontrolled component state |

---

## State Management

The application uses a **three-tier state management** approach:

```
┌─────────────────────────────────────────────────────────────┐
│  Tier 1: SERVER STATE (tRPC + React Query)                   │
│                                                              │
│  All data from the backend. Cached, refetched, invalidated. │
│  Source of truth for: users, ventures, deals, flags, etc.   │
│  Cache lifetime: 1 min (default), 5 min (RBAC)             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Tier 2: CLIENT STATE (Zustand)                              │
│                                                              │
│  UI-specific state not stored on the server.                │
│  10 stores covering navigation, auth UI, CRM, AI, etc.     │
│  Selective persistence to localStorage.                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Tier 3: URL STATE (nuqs)                                    │
│                                                              │
│  Filter, search, pagination, sort state in the URL.          │
│  Shareable, bookmarkable, browser-history compatible.        │
└─────────────────────────────────────────────────────────────┘
```

### Zustand Stores (10 stores)

#### `navigation-store.ts` — Navigation State (Most Critical)

```typescript
interface NavigationState {
  // Current navigation context
  layer: 'global' | 'venture' | 'module';
  currentVenture: VentureSlug | null;
  globalSection: string;
  ventureSection: string;
  activeModule: string | null;
  moduleSubSection: string | null;

  // Sidebar
  sidebarCollapsed: boolean;
  sidebarTransitioning: boolean;

  // Breadcrumbs
  breadcrumbs: Breadcrumb[];

  // Quick switch
  recentVentures: VentureSlug[];    // Max 5, persisted

  // Engineering workbench
  workbenchActive: boolean;
  workbenchStage: 'genesis' | 'architecture' | 'planning' | 'execution' | null;
}

// Key actions
switchToGlobal();                    // Reset to Layer 0
switchToVenture(slug: VentureSlug);  // Enter Layer 1
enterModule(slug, subSection?);      // Enter Layer 2
exitModule();                        // Return to parent
toggleSidebar();                     // Collapse/expand

// Persistence: sidebarCollapsed, recentVentures only
```

#### `auth-store.ts` — Authentication UI State

```typescript
interface AuthStoreState {
  showLoginModal: boolean;
  showSessionExpiredModal: boolean;
  showMfaSetupModal: boolean;
  rememberEmail: string | null;
  preferredAuthMethod: 'password' | 'magic-link' | 'passkey';
  trustedDevices: string[];
  lastActivity: number | null;
  sessionWarningShown: boolean;
}

// Persistence: rememberEmail, preferredAuthMethod, trustedDevices
```

#### Domain-Specific Stores

| Store | File | State | Persistence |
|-------|------|-------|-------------|
| `ai-command-store` | `ai-command-store.ts` | Swarm visualization state, agent filters, HITL queue | None |
| `campaign-wizard-store` | `campaign-wizard-store.ts` | Multi-step campaign creation (audience, content, schedule, budget) | None |
| `cart-store` | `cart-store.ts` | E-commerce cart items, quantities | localStorage |
| `content-pipeline-store` | `content-pipeline-store.ts` | Content lifecycle: draft → review → approved → published | None |
| `crm-store` | `crm-store.ts` | Deal pipeline view, active filters, kanban column config | None |
| `intelligence-store` | `intelligence-store.ts` | Intelligence dashboard filters, knowledge graph state | None |
| `portfolio-store` | `portfolio-store.ts` | Portfolio view preferences, venture comparison selections | None |
| `wishlist-store` | `wishlist-store.ts` | Saved product wishlist | localStorage |

### URL State (nuqs)

```typescript
// Example: CRM contacts page with shareable filter state
import { useQueryState, parseAsInteger } from 'nuqs';

function ContactsPage() {
  const [search, setSearch] = useQueryState('q');
  const [status, setStatus] = useQueryState('status');
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [sort, setSort] = useQueryState('sort');
  const [order, setOrder] = useQueryState('order');

  // URL: /crm/contacts?q=john&status=active&page=2&sort=name&order=asc
  // Shareable, bookmarkable, browser-back compatible
}
```

---

## Real-time Features

### Architecture

Real-time data flows through **Pusher** (WebSocket) and **Supabase Realtime** (PostgreSQL LISTEN/NOTIFY):

```
┌──────────────────────────────────────────────────────────────┐
│                    Backend Events                              │
│                                                              │
│  ┌────────────┐   ┌────────────┐   ┌────────────────────┐   │
│  │ Database   │   │ AI Agent   │   │ User Action        │   │
│  │ Changes    │   │ Events     │   │ (CRM, Invoice...)  │   │
│  └─────┬──────┘   └─────┬──────┘   └──────┬─────────────┘   │
│        │                 │                  │                  │
│        ▼                 ▼                  ▼                  │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                  Event Bus                            │    │
│  │  Supabase Realtime / Pusher / Internal                │    │
│  └──────────────────────────┬───────────────────────────┘    │
│                              │                                │
└──────────────────────────────┼────────────────────────────────┘
                               │ WebSocket
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Browser Client                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │            RealtimeProvider                            │    │
│  │  providers/realtime-provider.tsx                       │    │
│  │                                                       │    │
│  │  ┌─────────────────────────────────────────────────┐  │    │
│  │  │  Channel Subscriptions                          │  │    │
│  │  │  • venture:{slug}           (venture events)    │  │    │
│  │  │  • user:{id}                (personal events)   │  │    │
│  │  │  • global:signals           (signal feed)       │  │    │
│  │  │  • swarm:status             (AI swarm updates)  │  │    │
│  │  │  • presence:dashboard       (user presence)     │  │    │
│  │  └─────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │            Consumer Hooks                              │    │
│  │  hooks/use-realtime.ts   → Channel subscription       │    │
│  │  hooks/use-presence.ts   → Online/offline/idle        │    │
│  │  hooks/use-live-query.ts → Polling + WS fallback      │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Supabase Realtime Subscriptions

```typescript
// hooks/use-realtime.ts
export function useRealtime<T>(
  channel: string,
  event: string,
  callback: (payload: T) => void,
) {
  useEffect(() => {
    const subscription = supabase
      .channel(channel)
      .on('postgres_changes', { event, schema: 'public' }, (payload) => {
        callback(payload.new as T);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel, event, callback]);
}
```

### Real-time Use Cases

| Feature | Channel | Event Type | Consumer |
|---------|---------|-----------|----------|
| **Live Signal Feed** | `global:signals` | INSERT | SignalFeed component |
| **AI Swarm Status** | `swarm:status` | UPDATE | SwarmVisualization component |
| **Deal Pipeline** | `venture:{slug}:deals` | INSERT/UPDATE | DealKanban component |
| **Notification Bell** | `user:{id}:notifications` | INSERT | NotificationManager |
| **User Presence** | `presence:dashboard` | track/untrack | PresenceIndicator |
| **Approval Queue** | `global:approvals` | INSERT | ApprovalBadge count |
| **Activity Feed** | `venture:{slug}:activity` | INSERT | ActivityFeed component |
| **HITL Queue** | `swarm:hitl` | INSERT | HITLQueue badge |

### Presence System

```typescript
// hooks/use-presence.ts
export function usePresence(room: string) {
  const [presenceState, setPresenceState] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const channel = supabase.channel(room);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setPresenceState(Object.values(state).flat());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id,
            name: currentUser.name,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  return presenceState;
}
```

---

## Performance Architecture

### Rendering Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                   Rendering Decision Matrix                    │
│                                                              │
│  Route Type          │ Rendering     │ Cache                 │
│  ────────────────────┼───────────────┼───────────────────────│
│  Static pages        │ Build-time    │ CDN (permanent)       │
│  (maintenance, 403)  │ (SSG)         │                       │
│  ────────────────────┼───────────────┼───────────────────────│
│  Public pages        │ ISR           │ CDN + revalidate      │
│  (portfolio)         │               │ (5 min)               │
│  ────────────────────┼───────────────┼───────────────────────│
│  Dashboard pages     │ Dynamic SSR   │ React Query cache     │
│  (CRM, Admin)        │ + Streaming   │ (1 min stale)         │
│  ────────────────────┼───────────────┼───────────────────────│
│  Real-time pages     │ Dynamic SSR   │ WebSocket updates     │
│  (Signals, Swarm)    │ + Client      │ (live)                │
│  ────────────────────┼───────────────┼───────────────────────│
│  API routes          │ Serverless    │ Upstash Redis         │
│  ────────────────────┼───────────────┼───────────────────────│
│  Middleware           │ Edge          │ N/A                   │
└──────────────────────────────────────────────────────────────┘
```

### Streaming SSR

Next.js 15 App Router enables **streaming** for progressive page rendering:

```typescript
// Page with streaming data
import { Suspense } from 'react';

export default async function DashboardPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Renders immediately */}
      <PageHeader title="Mission Control" />

      {/* Streams in when data is ready */}
      <Suspense fallback={<KPISkeleton />}>
        <KPITiles />          {/* Server Component — fetches KPIs */}
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />      {/* Server Component — fetches chart data */}
      </Suspense>

      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />    {/* Server Component — fetches activity */}
      </Suspense>
    </div>
  );
}
```

Benefits:
- **Time to First Byte (TTFB)** is minimized — shell renders instantly
- **Progressive rendering** — Content sections stream in as data becomes available
- **No loading waterfalls** — Independent data fetches stream concurrently

### Code Splitting

| Level | Mechanism | Example |
|-------|-----------|---------|
| **Route-level** | Automatic (App Router) | Each route segment is a separate chunk |
| **Feature-level** | Dynamic imports | `const Editor = dynamic(() => import('@/features/document-editor'))` |
| **Component-level** | `next/dynamic` | Heavy components (charts, editors) lazy-loaded |
| **Package-level** | Tree-shaking | `transpilePackages` enables dead-code elimination |

### Bundle Size Optimization

| Optimization | Impact |
|-------------|--------|
| **RSC default** | Components without `'use client'` ship zero JS to the browser |
| **HeroUI individual imports** | Each HeroUI component is a separate package |
| **Lucide tree-shaking** | Only imported icons are bundled (~1KB per icon vs. ~500KB all) |
| **Server-only packages** | Handlebars excluded from client bundle via `serverExternalPackages` |
| **SuperJSON** | ~4KB — minimal serialization overhead |

### Caching Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Caching Layers                            │
│                                                              │
│  Layer 1: CDN (Vercel Edge Network)                          │
│  ├── Static assets: permanent cache with content-hash        │
│  ├── ISR pages: stale-while-revalidate                       │
│  └── Edge middleware: no caching                             │
│                                                              │
│  Layer 2: React Query (In-Memory)                            │
│  ├── Default stale time: 60 seconds                          │
│  ├── RBAC data: 5 minutes                                    │
│  ├── Automatic background refetch on window focus (prod)     │
│  └── Manual invalidation on mutations                        │
│                                                              │
│  Layer 3: Upstash Redis (Distributed)                        │
│  ├── Rate limit counters                                     │
│  ├── Session data (Better Auth)                              │
│  └── Feature flag cache                                      │
│                                                              │
│  Layer 4: Browser (localStorage)                             │
│  ├── Zustand persisted stores                                │
│  ├── Sidebar collapsed state                                 │
│  ├── Recent ventures (max 5)                                 │
│  ├── Auth preferences                                        │
│  └── Theme preference                                        │
│                                                              │
│  Layer 5: URL (nuqs)                                         │
│  ├── Search queries                                          │
│  ├── Filter state                                            │
│  ├── Pagination                                              │
│  └── Sort preferences                                        │
└──────────────────────────────────────────────────────────────┘
```

### Performance Metrics Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **TTFB** | < 200ms | Edge middleware + streaming SSR |
| **FCP** | < 1s | RSC streaming, route-level code splitting |
| **LCP** | < 2.5s | Preloaded fonts, optimized images, CDN |
| **CLS** | < 0.1 | Skeleton loading states, fixed layout dimensions |
| **TTI** | < 3.5s | Minimal client JS (RSC default), deferred hydration |
| **Bundle size** | < 300KB (first load) | Tree-shaking, dynamic imports, RSC |

---

## Security Architecture

### Threat Model

```
┌──────────────────────────────────────────────────────────────┐
│                    Threat Surface Map                          │
│                                                              │
│  Threat                 │ Mitigation                         │
│  ───────────────────────┼────────────────────────────────────│
│  XSS (Cross-Site        │ CSP headers, React auto-escaping, │
│  Scripting)             │ no dangerouslySetInnerHTML         │
│  ───────────────────────┼────────────────────────────────────│
│  CSRF (Cross-Site       │ SameSite cookies, form-action CSP  │
│  Request Forgery)       │                                    │
│  ───────────────────────┼────────────────────────────────────│
│  Session Hijacking      │ HttpOnly cookies, Secure flag,     │
│                         │ session management UI              │
│  ───────────────────────┼────────────────────────────────────│
│  Brute Force            │ Rate limiting (Upstash Redis),     │
│                         │ MFA, account lockout               │
│  ───────────────────────┼────────────────────────────────────│
│  Privilege Escalation   │ RBAC at component, API, and DB     │
│                         │ layers; Supabase RLS               │
│  ───────────────────────┼────────────────────────────────────│
│  Data Leakage           │ Venture-scoped RLS, tenant         │
│  (Cross-Tenant)         │ isolation, context validation      │
│  ───────────────────────┼────────────────────────────────────│
│  Clickjacking           │ X-Frame-Options: DENY              │
│  ───────────────────────┼────────────────────────────────────│
│  Token Theft            │ No tokens in localStorage;         │
│                         │ HttpOnly session cookies only      │
│  ───────────────────────┼────────────────────────────────────│
│  API Abuse              │ Rate limiting, auth validation,    │
│                         │ input validation (Zod)             │
└──────────────────────────────────────────────────────────────┘
```

### Authentication Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Login Page    │────▶│  Better Auth     │────▶│  Session Cookie │
│   /login        │     │  signIn.email()  │     │  (HttpOnly)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                         │
        │  MFA Required?        │                         │
        │◀──────────────────────┘                         │
        │                                                 │
        ▼                                                 ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  MFA Verify     │────▶│  twoFactor       │────▶│  AuthProvider   │
│  /mfa/verify    │     │  .verify()       │     │  transforms     │
└─────────────────┘     └──────────────────┘     │  user + RBAC    │
                                                  └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  Dashboard /    │
                                                  │  Mission Control│
                                                  └─────────────────┘
```

### Supported Authentication Methods

| Method | Implementation | Security Level |
|--------|---------------|---------------|
| **Email/Password** | Better Auth `signIn.email()` | Standard + optional MFA |
| **Magic Link** | Resend email + token | Passwordless |
| **OAuth 2.0** | Google, GitHub | Delegated auth |
| **WebAuthn/Passkey** | `@simplewebauthn/browser` | Hardware-backed |
| **TOTP MFA** | Authenticator apps | Second factor |

### Authorization — Defense in Depth

```
┌──────────────────────────────────────────────────────────────┐
│  Request Flow Through Authorization Layers                    │
│                                                              │
│  Browser Request                                             │
│       │                                                      │
│       ▼                                                      │
│  ┌─── Edge Middleware ──────────────────────────────────┐    │
│  │  • Cookie present? (binary auth check)               │    │
│  │  • Rate limit OK?                                    │    │
│  │  • Security headers injected                         │    │
│  └──────────────────────────┬───────────────────────────┘    │
│                              │                                │
│       ▼                                                      │
│  ┌─── React Server Component ──────────────────────────┐    │
│  │  • AuthProvider: session enrichment via tRPC         │    │
│  │  • Tier verification, venture access check           │    │
│  │  • Redirect to /forbidden if unauthorized            │    │
│  └──────────────────────────┬───────────────────────────┘    │
│                              │                                │
│       ▼                                                      │
│  ┌─── Component Layer ─────────────────────────────────┐    │
│  │  • <PermissionGate> hides unauthorized UI            │    │
│  │  • <SuperAdminOnly> gates Tier 0 features            │    │
│  │  • <RoleGuard> checks role assignments               │    │
│  └──────────────────────────┬───────────────────────────┘    │
│                              │                                │
│       ▼                                                      │
│  ┌─── API Layer (tRPC) ───────────────────────────────┐    │
│  │  • Context middleware validates session              │    │
│  │  • Permission checks on every procedure              │    │
│  │  • Venture context validation                        │    │
│  └──────────────────────────┬───────────────────────────┘    │
│                              │                                │
│       ▼                                                      │
│  ┌─── Database Layer (Supabase RLS) ──────────────────┐    │
│  │  • Row-Level Security policies per venture           │    │
│  │  • app.current_venture_id session variable           │    │
│  │  • Service role for admin overrides only             │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Input Validation

All user input is validated through **Zod schemas** at multiple layers:

| Layer | Validation | Schema Source |
|-------|-----------|---------------|
| **Forms** | React Hook Form + `@hookform/resolvers` | Feature-local Zod schemas |
| **URL params** | nuqs with type parsers | nuqs built-in parsers |
| **API inputs** | tRPC input validation | `@mcv/api` router schemas |
| **Environment** | `@t3-oss/env-nextjs` | `src/env.ts` schema |

---

## Deployment Pipeline

### Build Pipeline

```
┌────────────────────────────────────────────────────────────────┐
│                     Turborepo Build Graph                       │
│                                                                │
│  ┌─────────────┐                                               │
│  │ Tier 0-1    │  @mcv/kernel, @mcv/config                     │
│  │ Foundation   │  (types, utilities, env schemas)              │
│  └──────┬──────┘                                               │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────┐                                               │
│  │ Tier 2      │  @mcv/db, @mcv/storage, @mcv/realtime         │
│  │ Infra       │  (Drizzle, S3, WebSocket)                     │
│  └──────┬──────┘                                               │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────┐                                               │
│  │ Tier 3      │  @mcv/api                                     │
│  │ API         │  (tRPC routers, unified AppRouter)             │
│  └──────┬──────┘                                               │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────┐                                               │
│  │ Tier 4      │  @mcv/auth, @mcv/permissions, @mcv/flags,     │
│  │ Features    │  @mcv/notifications, @mcv/ai, @mcv/gateway,   │
│  │             │  @mcv/rag, @mcv/activity, @mcv/audit           │
│  └──────┬──────┘                                               │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────┐                                               │
│  │ Tier 5      │  @mcv/ui, @mcv/tenants, @mcv/users            │
│  │ Domain      │  (MCVShell, Chameleon Engine, profiles)        │
│  └──────┬──────┘                                               │
│         │                                                      │
│         ▼                                                      │
│  ┌─────────────┐                                               │
│  │ Tier 6      │  @mcv/admin, @mcv/venture-admin                │
│  │ APPS        │  (Next.js build, static optimization)          │
│  └─────────────┘                                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### CI/CD Stages

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│  Commit   │──▶│  Validate │──▶│   Test    │──▶│   Build   │──▶│  Deploy   │
│           │   │           │   │           │   │           │   │           │
│  Push to  │   │ • tsc     │   │ • Unit    │   │ • turbo   │   │ • Vercel  │
│  main     │   │ • eslint  │   │ • E2E     │   │   build   │   │   or      │
│           │   │ • prettier│   │   (PW)    │   │ • next    │   │   Docker  │
│           │   │ • env     │   │ • Visual  │   │   build   │   │           │
│           │   │   check   │   │   (SB)    │   │ • bundle  │   │ • Preview │
│           │   │           │   │           │   │   analyze │   │   → Prod  │
└───────────┘   └───────────┘   └───────────┘   └───────────┘   └───────────┘
     │                                                               │
     └── PR branches → Preview deployments (Vercel)                  │
                                                                     │
     main → Staging auto-deploy ────────────────────────────────────┘
     tags → Production deploy (manual approval)
```

### Deployment Targets

| Target | Use Case | Configuration |
|--------|----------|---------------|
| **Vercel** | Primary production | Zero-config Next.js, Edge Functions, ISR, automatic preview deployments |
| **Docker** | Self-hosted / staging | Multi-stage Dockerfile with standalone Next.js output |
| **Fly.io** | Regional deployment | Low-latency deployments for specific ventures |

### Docker Configuration

```dockerfile
# Multi-stage Dockerfile for production
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/admin/package.json ./apps/admin/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm turbo build --filter=@mcv/admin

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./.next/static
COPY --from=builder /app/apps/admin/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment-Specific Configuration

| Environment | Domain | Database | Redis | Features |
|-------------|--------|----------|-------|----------|
| **Development** | `localhost:3000` | Local PostgreSQL | In-memory fallback | All flags ON |
| **Preview** | `*.vercel.app` | Staging Supabase | Staging Upstash | Branch flags |
| **Staging** | `staging.mcv.one` | Staging Supabase | Staging Upstash | QA flags |
| **Production** | `admin.mcv.one` | Production Supabase | Production Upstash | Feature flags |

### Monitoring & Observability

| Concern | Tool | Integration |
|---------|------|-------------|
| **Error tracking** | Sentry (planned) | Next.js SDK, source maps |
| **Performance** | Vercel Analytics | Web Vitals, server timing |
| **Logs** | Vercel Logs / custom | Structured JSON logging |
| **Health check** | `/api/health` | Uptime monitoring integration |
| **Audit trail** | `@mcv/audit` | All user actions logged |
| **AI monitoring** | `@mcv/gateway` | Model usage, cost, latency |

---

*@mcv/apps — Application Layer*
