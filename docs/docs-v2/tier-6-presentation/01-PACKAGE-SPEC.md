# Tier 6: Presentation — Package Specification

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
2. [Purpose & Scope](#purpose--scope)
3. [Sub-Package Summary](#sub-package-summary)
4. [Architecture Position](#architecture-position)
5. [Cross-Package Integration](#cross-package-integration)
6. [Key Interfaces & Types](#key-interfaces--types)
7. [Configuration](#configuration)
8. [Dependencies](#dependencies)
9. [Multi-Tenant Design](#multi-tenant-design)
10. [Security](#security)
11. [Performance](#performance)
12. [Deployment](#deployment)
13. [Testing Strategy](#testing-strategy)
14. [Versioning & Release](#versioning--release)

---

## Overview

Tier 6 is the **Presentation Layer** of MCV.ONE — the apex of the platform's six-tier architecture and the surface through which every human (and AI agent) interacts with the system. It translates the raw capabilities distributed across Tiers 0–5 into cohesive, production-grade user interfaces, a type-safe API surface, and a comprehensive design system.

This tier is the **terminal consumer** in the dependency graph: it imports from every lower tier, but nothing imports from it. Every pixel rendered, every tRPC call dispatched, every button clicked, and every real-time subscription established flows through Tier 6.

Three sub-packages compose this tier:

| Sub-Package | Role | Scale |
|-------------|------|-------|
| **`@mcv/api`** | Unified tRPC API surface | 61 routers, 68 services, 42 schemas |
| **`@mcv/apps`** | Next.js 15 applications | 169 pages, 75 API routes, 35 feature modules |
| **`@mcv/ui`** | HeroUI component library | 508 components, 71 categories, 85 patterns |

Together they orchestrate the user experience for the MCV Global Consortium — 9 ventures, hundreds of AI agents, and thousands of users managed through a unified, dark-themed, accessibility-first interface.

### At a Glance

| Metric | Value |
|--------|-------|
| Total components | 508 |
| Total pages | 169 (Super-Admin) + Venture Admin (planned) |
| tRPC routers | 61 |
| API route handlers | 75 |
| Domain services | 68 |
| Zod schema modules | 42 |
| Feature modules (FSD) | 35 |
| Zustand stores | 10 |
| Internal `@mcv/*` dependencies | 17 workspace packages |
| HeroUI component packages | 33 |
| Procedure types | 14+ |
| Rate limit presets | 5 |
| UI component categories | 71 |
| Pre-built UI patterns | 85 |
| Venture brand themes | 9 |
| Navigation sections | 18 |
| Transpiled packages | 53 |

---

## Purpose & Scope

### Purpose

Tier 6 exists to answer a single question: **how do humans and AI agents interact with MCV.ONE?**

It is not an afterthought — the presentation layer is the most visible, most complex, and most frequently deployed part of the platform. Every executive, venture operator, AI supervisor, and end user forms their entire impression of MCV.ONE through this tier.

### Scope — What This Tier Does

1. **Exposes a unified API** — A single tRPC `appRouter` merging 61 domain routers into one type-safe, end-to-end API surface
2. **Renders the user interface** — Every page, modal, form, chart, kanban board, and interactive element users see
3. **Provides a design system** — 508 components across 71 categories with venture-specific theming
4. **Manages multi-tenancy** — The "Chameleon Engine" dynamically rebrands the entire UI per venture context
5. **Enforces presentation-layer security** — Edge middleware for auth checks, rate limiting, CSP, and security headers
6. **Orchestrates client state** — 10 Zustand stores for navigation, auth UI, CRM, AI command, and more
7. **Handles real-time** — WebSocket subscriptions, Server-Sent Events, and presence indicators
8. **Delivers performance** — React Server Components, streaming, code splitting, and Edge runtime

### Scope — What This Tier Does NOT Do

1. **Business logic** — Delegated to Tier 5 domain packages (`@mcv/domains`)
2. **Data persistence** — Delegated to Tier 2 infrastructure (`@mcv/db`)
3. **Authentication providers** — Delegated to Tier 4 (`@mcv/auth`); this tier consumes sessions
4. **Schema/type definitions** — Core types live in Tier 1 (`@mcv/kernel`); this tier imports them
5. **Runtime primitives** — Error handling and logging foundation lives in Tier 0

### Design Philosophy

| Principle | Meaning |
|-----------|---------|
| **Thin presentation** | Pages are composites of feature modules; minimal logic in route files |
| **Server-first** | Default to React Server Components; use `'use client'` only when interactivity requires it |
| **Type-safe end-to-end** | From database schema through tRPC to React component props — zero `any` |
| **Dark mode native** | Dark theme is default and primary; light mode is secondary |
| **Context-aware** | The UI adapts dynamically based on auth state, venture context, and user permissions |
| **Feature-sliced** | Each capability is a self-contained feature module with its own components, hooks, and types |
| **Accessibility-first** | WCAG 2.1 AA compliance, ARIA patterns, keyboard navigation, focus management |
| **Multi-tenant by design** | Every component, every layout, every route respects venture context |

---

## Sub-Package Summary

### @mcv/api — tRPC API Surface

**Classification:** INTERNAL · **Version:** 0.1.0

`@mcv/api` is the **single API surface** for the entire MCV.ONE platform. It exposes a unified tRPC router (`appRouter`) that merges 61 domain routers into one type-safe, end-to-end API. Every client — Next.js App Router, Hono edge workers, React Query hooks, and AI agents — connects through this package.

**This is the only package that defines API endpoints. No other package creates HTTP routes.**

#### Key Metrics

| Metric | Value |
|--------|-------|
| Domain routers | 61 |
| Zod schema modules | 42 |
| Service classes | 68 |
| Procedure types | 14+ |
| Rate limit presets | 5 |
| Export entry points | 7 |

#### Capabilities

- **Type-safe RPC** — Full end-to-end TypeScript inference from client to server via tRPC v11
- **Authentication & Authorization** — 14+ procedure types enforcing Better Auth sessions, RBAC tiers, venture context, agent identity, and granular permissions
- **Input Validation** — Zod-first schema validation on every endpoint
- **Rate Limiting** — Sliding window rate limiter with 5 presets protecting all endpoint categories
- **Multi-tenancy** — Venture-scoped context injected into every authenticated request
- **Domain Orchestration** — 68 service classes implementing business logic behind thin router handlers
- **Serialization** — SuperJSON transformer for Date, Map, Set, BigInt, and undefined values
- **OpenAPI Generation** — Automatic OpenAPI 3.0 spec generation for external consumers

#### Router Domains

| Domain Area | Routers | Key Namespaces |
|-------------|---------|----------------|
| Authentication & Identity | 6 | `auth`, `mfa`, `passkey`, `wallet`, `users`, `roles` |
| Multi-Tenancy & Access | 4 | `ventures`, `ventureMembers`, `permissions`, `settings` |
| AI & Intelligence | 7 | `gateway`, `rag`, `ai`, `intelligence`, `hitl`, `agentTasks`, `workbench` |
| CRM & Contacts | 6 | `contacts`, `organizations`, `deals`, `activities`, `crmV2`, `entityGraph` |
| Task & Project Management | 8 | `tasks`, `projects`, `sprints`, `taskTemplates`, `timeEntries`, `automationRules`, `taskAnalytics`, `workflows` |
| Communication | 4 | `conversations`, `queues`, `twilio`, `contactCenter` |
| Commerce & Payments | 4 | `catalog`, `invoicing`, `payments`, `forms` |
| Content & Documents | 4 | `cms`, `comments`, `tags`, `documentEditor` |
| Operations & Monitoring | 5 | `audit`, `notifications`, `flags`, `storage`, `stats` |
| Strategy & Finance | 5 | `portfolio`, `treasury`, `tokenEconomy`, `strategy`, `grantConcierge` |
| Marketing & Branding | 3 | `marketing`, `branding`, `reputation` |
| Infrastructure | 5 | `analytics`, `webhooks`, `integrations`, `email`, `calendar` |

---

### @mcv/apps — Next.js Applications

**Classification:** PRIVATE · **Version:** 0.1.0

`@mcv/apps` is the **crown jewel** of the MCV.ONE platform — the applications that put every lower tier's capabilities into the hands of human operators. It houses Next.js 15 applications serving as the primary user interfaces for the entire MCV Global Consortium.

#### Applications

| Application | Package | Port | Domain | Status |
|-------------|---------|------|--------|--------|
| **Super-Admin** | `@mcv/admin` | 3000 | `admin.mcv.one` | Active Development |
| **Venture Admin** | `@mcv/venture-admin` | 3001 | `{venture}.mcv.one` | Planned |

#### Super-Admin Key Metrics

| Metric | Value |
|--------|-------|
| Page components | 169 |
| API route handlers | 75 |
| Feature modules (FSD) | 35 |
| Zustand stores | 10 |
| Route groups | 4 (`(auth)`, `(dashboard)`, `(public)`, `api`) |
| Layout nesting depth | 5 levels |
| Navigation sections | 18 |
| Venture branding colors | 6 unique palettes |

#### Core Modules (Super-Admin)

| Module | Route Prefix | Pages | Description |
|--------|-------------|-------|-------------|
| **Mission Control** | `/` | 1 | Executive dashboard — KPIs, pending approvals, live signals |
| **Administration** | `/admin/` | 40 | Users, roles, permissions, ventures, flags, email, storage, gateway, audit, marketing, AI command |
| **AI Command Center** | `/ai-command/` | 8 | Swarm overview, agent management, HITL center, NAOS registry, queen orchestrator |
| **CRM** | `/crm/` | 9 | Contacts, organizations, deals, pipeline, forecast, data quality |
| **Portfolio** | `/portfolio/` | 6 | Venture registry, capital stack, domains, entities, health |
| **Invoicing** | `/invoicing/` | 8 | Invoices, proposals, estimates, credit notes, recurring, platform fees |
| **Product Catalog** | `/catalog/` | 5 | Products, categories, inventory, discounts |
| **Strategy** | `/strategy/` | 4 | Vision board, roadmap, investor relations, M&A pipeline |
| **Settings** | `/settings/` | 9 | Profile, security, sessions, API keys, appearance, notifications |
| **Document Studio** | `/documents/` | 4 | Rich text editor, templates, AI content assistant |
| **Knowledge** | `/knowledge/` | 4 | Documentation, API reference, training, changelog |
| **Engineering** | `/engineering/` | 1 | Workbench — venture genesis, architecture, planning, execution |
| **Tasks** | `/tasks/` | 3 | Projects, project detail, HITL tasks |
| **Workflows** | `/workflows/` | 2 | Visual workflow builder, run history |
| **CMS** | `/cms/` | 5 | Posts, categories, tags, comments |
| **Venture Context** | `/v/[ventureSlug]/` | 9 | Per-venture dashboard, engineering, growth, operations, tasks |
| *+ 12 more modules* | — | — | Analytics, Approvals, Contact Center, Grants, etc. |

#### Venture Admin (Planned)

The Venture Admin is a **tenant-scoped** portal for individual venture operators. It shares most feature modules with the Super-Admin but operates in a fixed venture context:

| Dimension | Super-Admin | Venture Admin |
|-----------|-------------|---------------|
| **Scope** | All ventures (Tier 0) | Single venture (Tier 1) |
| **Domain** | `admin.mcv.one` | `{venture}.mcv.one` |
| **Navigation** | Full 18-section global nav | Venture nav only |
| **Permissions** | Full RBAC (Tier 0-3) | Venture RBAC (Tier 1-3) |
| **Exclusive** | Portfolio, Treasury, Token Economy, Strategy | — |

---

### @mcv/ui — Component Library & Design System

**Classification:** PUBLISHABLE · **Version:** 1.0.0

`@mcv/ui` is the comprehensive design system and component library for the MCV.ONE ecosystem. Built on HeroUI (formerly NextUI), it provides every UI building block needed across all 9 ventures with consistent user experiences.

**This is the face of MCV.ONE — every pixel, interaction, and animation flows from this package.**

#### Key Metrics

| Metric | Value |
|--------|-------|
| Total components | 508 |
| Component categories | 71 |
| Pre-built UI patterns | 85 |
| Venture brand themes | 9 |
| Design token scales | 10 |

#### Component Categories (71)

| Area | Categories | Components | Highlights |
|------|-----------|------------|------------|
| **Foundation** | 8 | 71 | Primitives, typography, layout, surfaces, media, icons, animations, accessibility |
| **Forms** | 12 | 82 | 18 input types, 8 select variants, 8 pickers, 6 editors, 5 upload components |
| **Data Display** | 15 | 119 | 12 table variants, 18 chart types, 8 metric displays, 12 card types |
| **Navigation** | 8 | 44 | Sidebar (6 variants), tabs, breadcrumbs, pagination, menus, steppers |
| **Feedback** | 7 | 41 | Alerts, toasts, modals, popovers, progress, loading, error boundaries |
| **Overlays** | 5 | 29 | Modals (8), drawers (6), dialogs (6), sheets (5), lightboxes (4) |
| **Specialized** | 16 | 122 | Auth (12), commerce (18), finance (10), gaming (12), AI (8), web3 (12), admin (15) |

#### Design System Features

- **Design Tokens** — Full token scales for colors, typography, spacing, radii, shadows, transitions, breakpoints, z-indices
- **Venture Themes** — Each of the 9 ventures has a custom theme extending the base (colors, typography, component overrides, assets)
- **Dark Mode Native** — Dark theme is primary; light mode derived from the same tokens
- **Compound Components** — Complex components (DataTable, Form, etc.) use the compound pattern for composability
- **Tailwind Integration** — All tokens map to Tailwind CSS utilities via CSS custom properties
- **Storybook** — Complete Storybook documentation with interaction tests

---

## Architecture Position

Tier 6 sits at the **apex of the dependency tree**, consuming services from every tier below. No package imports from Tier 6 — it is a terminal consumer.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   T I E R   6  ─  P R E S E N T A T I O N                         │
│                                                                     │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐             │
│   │  @mcv/api   │   │  @mcv/apps  │   │   @mcv/ui   │             │
│   │  61 routers │◄──│  169 pages  │──►│ 508 comps   │             │
│   │  68 services│   │  75 routes  │   │  71 cats    │             │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘             │
│          │                 │                  │                     │
│   ─ ─ ─ ─ ─ ─ ─  YOU ARE HERE  ─ ─ ─ ─ ─ ─ ─ ─                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             │ consumes
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│   T I E R   5  ─  D O M A I N   M O D U L E S                     │
│                                                                     │
│   @mcv/users       User management, profiles                       │
│   @mcv/tenants     Multi-tenancy, Chameleon Engine                  │
│   @mcv/domains     Business logic, domain services                  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│   T I E R   4  ─  F E A T U R E S                                  │
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
│   T I E R   3  ─  A P I   L A Y E R                                │
│                                                                     │
│   @mcv/api           tRPC routers, gateway (defined in Tier 6)      │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│   T I E R   2  ─  I N F R A S T R U C T U R E                      │
│                                                                     │
│   @mcv/db            Drizzle ORM, PostgreSQL schemas                │
│   @mcv/storage       S3/Supabase file storage                       │
│   @mcv/realtime      WebSocket, SSE, presence                       │
│   @mcv/config        Shared config, env validation                  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│   T I E R   1  ─  F O U N D A T I O N                              │
│                                                                     │
│   @mcv/kernel        Shared types, utilities, constants             │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│   T I E R   0  ─  C O R E                                          │
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

---

## Cross-Package Integration

The three sub-packages form a tightly integrated presentation system. Understanding how they interconnect is critical to working within Tier 6.

### Data Flow

```
                    ┌──────────────────────────────┐
                    │          USER / AGENT         │
                    │    (browser / API client)     │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │         @mcv/apps             │
                    │                              │
                    │  ┌────────┐  ┌────────────┐  │
                    │  │ Pages  │  │ Middleware  │  │
                    │  │ (RSC)  │  │ (Edge)     │  │
                    │  └───┬────┘  └─────┬──────┘  │
                    │      │             │         │
                    │  ┌───▼─────────────▼──────┐  │
                    │  │   Provider Tree         │  │
                    │  │   (Auth, Theme, tRPC)   │  │
                    │  └───┬────────────────────┘  │
                    └──────┼───────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
     ┌─────────────┐ ┌──────────┐ ┌──────────┐
     │  @mcv/api   │ │ @mcv/ui  │ │ Server   │
     │             │ │          │ │ Actions  │
     │ tRPC calls  │ │ renders  │ │ (RSC)    │
     │ via React   │ │ comps    │ │          │
     │ Query       │ │ w/ theme │ │          │
     └──────┬──────┘ └──────────┘ └──────────┘
            │
            ▼
     ┌─────────────┐
     │ Tiers 0–5   │
     │ (Domain,    │
     │  DB, Auth)  │
     └─────────────┘
```

### Integration Points

#### 1. apps → api: tRPC Client

`@mcv/apps` consumes `@mcv/api` via a tRPC client configured with React Query. All data fetching in the application flows through this channel:

```typescript
// Server-side (RSC) — direct caller
import { createCaller } from '@mcv/api/trpc';
const caller = createCaller(await createContext(headers));
const ventures = await caller.ventures.list();

// Client-side — React Query hooks
import { trpc } from '~/lib/trpc';
const { data } = trpc.ventures.list.useQuery();
```

The `AppRouter` type from `@mcv/api` is the single source of truth for all API types. No manual type definitions are needed — TypeScript inference flows from Zod schemas through tRPC to the UI.

#### 2. apps → ui: Component Consumption

`@mcv/apps` imports components from `@mcv/ui` for all rendering. Pages compose UI components into feature-specific layouts:

```typescript
import { DataTable, StatCard, Badge, Button } from '@mcv/ui';
import { MCVShell } from '@mcv/ui/patterns/admin';
```

The `ThemeProvider` from `@mcv/ui` wraps the entire application, providing venture-specific branding through the Chameleon Engine.

#### 3. api → ui: Shared Types

Both `@mcv/api` and `@mcv/ui` share types from lower tiers (`@mcv/kernel`), ensuring that API response shapes align with component prop interfaces without manual mapping.

#### 4. apps: Server Actions

Next.js Server Actions in `@mcv/apps` can call `@mcv/api` services directly (server-to-server), bypassing the HTTP layer for mutations triggered from React Server Components.

### Package Boundaries

| Boundary | Direction | Mechanism | Examples |
|----------|-----------|-----------|----------|
| apps → api | Data fetch | tRPC client (React Query) | `trpc.ventures.list.useQuery()` |
| apps → api | Mutations | tRPC mutations / Server Actions | `trpc.users.create.useMutation()` |
| apps → ui | Rendering | React component imports | `<DataTable>`, `<MCVShell>` |
| apps → ui | Theming | ThemeProvider context | `useVenture()`, `useTheme()` |
| api → tiers 0–5 | Domain logic | Direct imports | `@mcv/db`, `@mcv/auth`, `@mcv/permissions` |
| ui → external | Styling | HeroUI + Tailwind CSS | `@heroui/react`, `tailwind-variants` |

---

## Key Interfaces & Types

### Core Context Types (from @mcv/api)

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

### Navigation Types (from @mcv/apps)

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

### Venture Configuration (from @mcv/apps)

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

### Auth Context (from @mcv/apps)

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

### Component API Standard (from @mcv/ui)

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

### Theme Types (from @mcv/ui)

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

---

## Configuration

### Environment Variables

All environment variables are validated at startup via `@t3-oss/env-nextjs` + Zod schemas. The tier requires configuration across several domains:

#### Required — Core

| Variable | Type | Description |
|----------|------|-------------|
| `DATABASE_URL` | `string` | PostgreSQL connection string (Supabase) |
| `BETTER_AUTH_SECRET` | `string` | Session signing secret |
| `BETTER_AUTH_URL` | `string` | Auth callback URL |
| `NEXT_PUBLIC_APP_URL` | `string` | Public application URL |

#### Required — Authentication

| Variable | Type | Description |
|----------|------|-------------|
| `GOOGLE_CLIENT_ID` | `string` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `string` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | `string` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | `string` | GitHub OAuth client secret |
| `RESEND_API_KEY` | `string` | Resend email service key |

#### Required — Infrastructure

| Variable | Type | Description |
|----------|------|-------------|
| `UPSTASH_REDIS_REST_URL` | `string` | Redis URL for rate limiting & caching |
| `UPSTASH_REDIS_REST_TOKEN` | `string` | Redis auth token |
| `SUPABASE_URL` | `string` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `string` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | `string` | Supabase service role key (server-only) |

#### Required — AI Gateway

| Variable | Type | Description |
|----------|------|-------------|
| `OPENAI_API_KEY` | `string` | OpenAI API key |
| `ANTHROPIC_API_KEY` | `string` | Anthropic API key |
| `AI_GATEWAY_BUDGET_LIMIT` | `number` | Monthly AI spend limit |

#### Required — Storage

| Variable | Type | Description |
|----------|------|-------------|
| `S3_BUCKET` | `string` | S3 bucket name |
| `S3_REGION` | `string` | S3 region |
| `S3_ACCESS_KEY_ID` | `string` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | `string` | S3 secret key |

#### Required — Payments

| Variable | Type | Description |
|----------|------|-------------|
| `STRIPE_SECRET_KEY` | `string` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | `string` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `string` | Stripe publishable key (client) |

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

| Setting | Value | Rationale |
|---------|-------|-----------|
| `reactStrictMode` | `true` | Double-renders in dev to catch side effects |
| `eslint.ignoreDuringBuilds` | `true` | ESLint runs separately in CI for build speed |
| `transpilePackages` | 53 | Workspace + HeroUI packages ship as ESM/TS sources |
| `serverExternalPackages` | `['handlebars']` | Server-only email templates — keep out of client bundle |

### Tailwind CSS Configuration

Tailwind is configured at the workspace root with venture-aware theme extension:

- **Content paths** — Scans `@mcv/apps` pages, `@mcv/ui` components, and HeroUI node_modules
- **Dark mode** — `class` strategy (default dark, toggled by `ThemeProvider`)
- **Custom plugins** — Venture branding plugin, animation utilities, glass morphism
- **Design tokens** — All `@mcv/ui` tokens mapped to Tailwind utilities via CSS custom properties

---

## Dependencies

### Internal Dependencies (Workspace)

Tier 6 depends on 17 internal `@mcv/*` workspace packages spanning all lower tiers:

| Package | Tier | Purpose |
|---------|------|---------|
| `@mcv/kernel` | 1 | Shared types, utilities, constants |
| `@mcv/db` | 2 | Drizzle ORM, PostgreSQL schemas |
| `@mcv/storage` | 2 | S3/Supabase file storage |
| `@mcv/config` | 2 | Shared config, env validation |
| `@mcv/auth` | 4 | Better Auth sessions, OAuth, MFA, passkeys |
| `@mcv/permissions` | 4 | RBAC, permission gates |
| `@mcv/flags` | 4 | Feature flag evaluation |
| `@mcv/notifications` | 4 | Push, email, in-app alerts |
| `@mcv/ai` | 4 | AI/LLM integrations, agent orchestration |
| `@mcv/activity` | 4 | Activity feed, engagement tracking |
| `@mcv/audit` | 4 | Audit logging, compliance |
| `@mcv/gateway` | 4 | AI Gateway, model routing, budgets |
| `@mcv/rag` | 4 | RAG, knowledge retrieval |
| `@mcv/catalog` | 4 | Product catalog, inventory |
| `@mcv/invoicing` | 4 | Invoice generation, proposals, recurring |
| `@mcv/payments` | 4 | Stripe integration, subscriptions |
| `@mcv/logger` | 0 | Structured logging |

### External Dependencies (Key)

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.0.7 | React framework (App Router) |
| `react` | 19.x | UI rendering |
| `@trpc/server` | 11.x | Type-safe API server |
| `@trpc/client` | 11.x | Type-safe API client |
| `@trpc/react-query` | 11.x | React Query integration |
| `@heroui/react` | 2.x | Component library foundation |
| `tailwindcss` | 3.x | Utility-first CSS |
| `framer-motion` | 11.x | Animation library |
| `zustand` | 5.x | Client state management |
| `zod` | 3.x | Schema validation |
| `superjson` | 2.x | Enhanced JSON serialization |
| `@tanstack/react-query` | 5.x | Server state management |
| `lucide-react` | — | Icon library |
| `nuqs` | — | URL query state management |
| `@t3-oss/env-nextjs` | — | Env validation |
| `better-auth` | — | Authentication framework |

---

## Multi-Tenant Design

### The Chameleon Engine

MCV.ONE's multi-tenant architecture is called the **Chameleon Engine** — named for its ability to dynamically rebrand the entire user interface per venture context. Every component, layout, and page adapts to the active venture's visual identity.

#### Venture Switching

```
User clicks venture in sidebar
        │
        ▼
┌───────────────────────┐
│  Navigation Store     │  switchToVenture(slug)
│  updates context      │
└───────┬───────────────┘
        │
        ├──► Theme Provider applies venture tokens (CSS vars)
        ├──► Sidebar rebuilds with venture navigation
        ├──► Header updates with venture branding
        ├──► API context sends venture header to tRPC
        └──► URL updates to /v/{ventureSlug}/...
```

#### Venture Themes

Each venture has a unique visual identity:

| Venture | Primary Color | Category | Domain |
|---------|--------------|----------|--------|
| **BetEdge AI** | `#22c55e` (Green) | Consumer | `betedge.app` |
| **EdgeIQ** | `#3b82f6` (Blue) | Platform | `edgeiq.mcv.one` |
| **MCVGG** | `#8b5cf6` (Purple) | Consumer | `mcvgg.com` |
| **Studio** | `#f59e0b` (Amber) | Service | `studio.mcv.one` |
| **Agency** | `#ec4899` (Pink) | Service | `agency.mcv.one` |
| **Sentinel** | `#ef4444` (Red) | Platform | `sentinel.mcv.one` |

#### Tenant Isolation

- **API Level** — Every authenticated request includes a `venture` context via `ventureProcedure`; queries are automatically scoped to the active venture
- **UI Level** — Navigation, theming, and data display are all venture-scoped
- **Permission Level** — RBAC is hierarchical: Tier 0 (super-admin) sees all ventures; Tier 1 (venture admin) sees only their venture
- **Data Level** — Database queries enforce `ventureId` WHERE clauses at the service layer

### Role-Based UI

The interface adapts based on the user's permission tier:

| Tier | Role | UI Scope | Navigation |
|------|------|----------|------------|
| 0 | Super Admin | Full platform access | 18 sections, all ventures |
| 1 | Venture Admin | Single venture management | Venture nav, administration |
| 2 | Operator | Module-level access | Assigned modules only |
| 3 | Viewer | Read-only access | Reduced navigation, no actions |

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
  ├─► Security Headers (CSP, HSTS, X-Frame-Options)
  ├─► Rate Limiting (sliding window, 5 presets)
  ├─► Session Validation (Better Auth cookie)
  ├─► Route Protection (public vs protected routes)
  ├─► Venture Context Resolution (from session or header)
  ├─► Permission Check (RBAC tier + granular permissions)
  └─► Request ID + Logging
```

### Rate Limiting

Five rate limit presets protect all endpoint categories:

| Preset | Limit | Window | Applies To |
|--------|-------|--------|------------|
| `public` | 50/min | Per IP | Health checks, public booking |
| `general` | 100/min | Per user | Standard authenticated endpoints |
| `auth` | 5/min | Per IP | Login, signup, password reset |
| `strict` | 3/min | Per IP | Password reset confirmation |
| `relaxed` | 200/min | Per user | Dashboard polling, real-time feeds |

### Additional Security Measures

| Measure | Implementation |
|---------|---------------|
| **CSRF Protection** | SameSite cookies + custom header validation |
| **XSS Prevention** | React auto-escaping + CSP + DOMPurify for user content |
| **SQL Injection** | Drizzle ORM parameterized queries (no raw SQL) |
| **Input Validation** | Zod schemas on every tRPC endpoint |
| **Session Security** | HTTP-only cookies, secure flag, short expiry + refresh |
| **MFA** | TOTP, SMS, WebAuthn/FIDO2 passkeys |
| **Audit Trail** | All admin actions logged to `@mcv/audit` |

---

## Performance

### React Server Components (RSC)

Tier 6 uses a **server-first** rendering strategy. The default is React Server Components; client components are used only when interactivity requires it.

| Strategy | When Used | Examples |
|----------|-----------|---------|
| **Server Component** | Static content, data fetching, layouts | Page shells, data tables, stat cards |
| **Client Component** | Interactivity, state, effects | Forms, modals, command palette, charts |
| **Streaming** | Large data sets, slow queries | Dashboard KPIs, analytics, reports |
| **Suspense boundaries** | Progressive loading | Per-section loading skeletons |

### Code Splitting

```
Route Groups:
├── (auth)       → Auth pages — separate chunk
├── (dashboard)  → Main app — lazy-loaded modules
├── (public)     → Public pages — minimal bundle
└── api          → API routes — server-only
```

- **Route-based splitting** — Each route group loads independently
- **Feature-based splitting** — 35 feature modules are lazy-loaded on navigation
- **Component-based splitting** — Heavy components (editors, charts, maps) use `dynamic()` imports
- **Vendor splitting** — Large dependencies (HeroUI, Recharts, Monaco) in separate chunks

### Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **LCP** | < 2.5s | RSC streaming, image optimization |
| **FID** | < 100ms | Minimal client JS, code splitting |
| **CLS** | < 0.1 | Skeleton loaders, fixed layouts |
| **TTFB** | < 200ms | Edge runtime, ISR where applicable |
| **Bundle size** | < 200KB (initial) | Tree shaking, dynamic imports |

### Caching Strategy

| Layer | Mechanism | TTL | Scope |
|-------|-----------|-----|-------|
| **Browser** | Service Worker + Cache API | Varies | Static assets |
| **CDN** | Vercel Edge Cache | 1h (pages), 1y (assets) | Public routes |
| **React Query** | In-memory + staleTime | 30s–5min | Per-query |
| **tRPC** | Response caching headers | Varies | Per-procedure |
| **Redis** | Upstash Redis | 1min–1h | Rate limits, sessions |

---

## Deployment

### Infrastructure

| Component | Platform | Region |
|-----------|----------|--------|
| **Next.js Apps** | Vercel (Serverless + Edge) | `iad1` (US East) |
| **Database** | Supabase (PostgreSQL) | US East |
| **Redis** | Upstash | Global (multi-region) |
| **Storage** | S3 / Supabase Storage | US East |
| **CDN** | Vercel Edge Network | Global |
| **DNS** | Cloudflare | Global |

### Deployment Pipeline

```
git push → main branch
     │
     ▼
┌─────────────────────────┐
│  GitHub Actions CI       │
│                         │
│  1. Type check (tsc)    │
│  2. Lint (ESLint)       │
│  3. Unit tests (Vitest) │
│  4. Build (Turborepo)   │
│  5. E2E (Playwright)    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Vercel Deploy           │
│                         │
│  Preview → Staging       │
│  Staging → Production    │
│  (manual promotion)     │
└─────────────────────────┘
```

### Build System (Turborepo)

The monorepo uses Turborepo for parallel, cached builds:

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

### Domain Configuration

| App | Production Domain | Preview Pattern |
|-----|-------------------|-----------------|
| Super-Admin | `admin.mcv.one` | `admin-{branch}.vercel.app` |
| Venture Admin | `{venture}.mcv.one` | `{venture}-{branch}.vercel.app` |

---

## Testing Strategy

### Test Pyramid

| Level | Framework | Scope | Coverage Target |
|-------|-----------|-------|-----------------|
| **Unit** | Vitest | Services, utils, hooks | 80% |
| **Component** | Vitest + Testing Library | UI components | 70% |
| **Integration** | Vitest | tRPC routers, middleware | 75% |
| **E2E** | Playwright | Critical user journeys | 20 flows |
| **Visual** | Storybook + Chromatic | Component visual regression | All 508 components |

### Critical E2E Flows

1. Login → MFA → Dashboard
2. Venture switching (Chameleon Engine)
3. CRM: Contact → Deal → Pipeline
4. Invoicing: Create → Send → Payment
5. AI Command: Agent deploy → HITL approval
6. Task management: Create → Sprint → Complete
7. Feature flag toggle → UI update
8. Settings: Profile, security, API keys

---

## Versioning & Release

| Package | Version Strategy | Publish Target |
|---------|-----------------|----------------|
| `@mcv/api` | Workspace-linked | Internal only |
| `@mcv/apps` | Workspace-linked | Deploy to Vercel |
| `@mcv/ui` | SemVer (1.x.x) | Internal npm registry |

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
