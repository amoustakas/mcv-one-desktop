# @mcv/apps — Package Specification

| Field            | Value                                    |
| ---------------- | ---------------------------------------- |
| **Package**      | `@mcv/apps`                              |
| **Scope**        | INTERNAL                                 |
| **Tier**         | 6 — Presentation Layer                   |
| **Classification** | PRIVATE                                |
| **Version**      | 0.1.0                                    |
| **Runtime**      | Node.js ≥ 20 / Edge (Vercel)            |
| **Framework**    | Next.js 15.0.7 (App Router)             |
| **Last Updated** | February 2026                            |

---

## Table of Contents

1. [Overview](#overview)
2. [Purpose & Scope](#purpose--scope)
3. [Module Summary](#module-summary)
4. [Architecture Position](#architecture-position)
5. [Key Interfaces & Types](#key-interfaces--types)
6. [Configuration](#configuration)
7. [Dependencies](#dependencies)
8. [Multi-Tenant Design](#multi-tenant-design)
9. [Security](#security)
10. [Performance](#performance)
11. [Deployment](#deployment)

---

## Overview

`@mcv/apps` is the **crown jewel** of the MCV.ONE platform — the Tier 6 Presentation layer that puts every lower tier's capabilities into the hands of human operators. It houses the Next.js 15 applications that serve as the primary user interfaces for the entire MCV Global Consortium.

This package is the **single entry point** through which every executive, operator, venture admin, and AI supervisor interacts with the MCV ecosystem. Every venture is managed, every AI agent swarm is observed, every treasury operation, CRM pipeline, invoice, document, feature flag, and user permission flows through these interfaces.

The package contains two primary applications:

- **`@mcv/admin` (Super-Admin)** — A Portfolio Command & Control Center spanning the full consortium (169 pages, 75 API routes)
- **`@mcv/venture-admin`** — A tenant-scoped administration portal for individual venture operators

Together, they form the visible face of an enterprise platform that orchestrates 9 ventures, hundreds of AI agents, and thousands of users through a unified, dark-themed, HeroUI-powered interface built on React Server Components.

### At a Glance

| Metric | Value |
|--------|-------|
| Page components | 169 (Super-Admin) |
| API route handlers | 75 |
| Feature modules | 35 (FSD architecture) |
| Zustand stores | 10 |
| Internal package deps | 17 `@mcv/*` workspace packages |
| External UI packages | 33 HeroUI component packages |
| Route groups | 4 (`(auth)`, `(dashboard)`, `(public)`, `api`) |
| Layout nesting depth | 5 levels |
| Venture branding colors | 6 unique color palettes |

---

## Purpose & Scope

### Purpose

`@mcv/apps` exists to translate the raw capabilities distributed across Tiers 0–5 into cohesive, production-ready user interfaces that enterprise operators can use daily. The package answers a single question: **how do humans interact with MCV.ONE?**

### Scope — What This Package Does

1. **Renders the user interface** — Every page, modal, form, chart, kanban board, and interactive element the user sees
2. **Composes the provider tree** — Orchestrates authentication, multi-tenancy, theming, real-time subscriptions, and state management
3. **Defines routing** — 169 route segments organized into hierarchical route groups with nested layouts
4. **Manages client state** — 10 Zustand stores for navigation, auth UI, CRM, AI command, portfolio, and more
5. **Calls the API** — tRPC client configured with React Query for type-safe data fetching
6. **Enforces presentation-layer security** — Edge middleware for auth checks, rate limiting, CSP, and security headers
7. **Handles multi-tenant branding** — The "Chameleon Engine" dynamically rebrands the entire UI per venture context
8. **Provides the command palette** — Global `⌘K` search across ventures, pages, users, and actions

### Scope — What This Package Does NOT Do

1. **Business logic** — Delegated to Tier 5 domain packages (`@mcv/domains`)
2. **Data persistence** — Delegated to Tier 2 infrastructure (`@mcv/db`)
3. **Authentication** — Delegated to Tier 4 (`@mcv/auth`); this package consumes sessions
4. **API router definitions** — Delegated to Tier 3 (`@mcv/api`); this package calls them
5. **Component library** — Shared components live in `@mcv/ui`; this package uses them
6. **Schema/type definitions** — Core types live in Tier 1 (`@mcv/kernel`); this package imports them

### Design Philosophy

| Principle | Meaning |
|-----------|---------|
| **Thin presentation** | Pages are composites of feature modules; minimal logic in route files |
| **Feature-sliced** | Each capability is a self-contained feature module with its own components, hooks, and types |
| **Server-first** | Default to React Server Components; use `'use client'` only when interactivity requires it |
| **Dark mode native** | Dark theme is default and primary; light mode is secondary |
| **Context-aware** | The UI adapts dynamically based on auth state, venture context, and user permissions |
| **Type-safe end-to-end** | From database schema through tRPC to React component props |

---

## Module Summary

### Application 1: Super-Admin (`@mcv/admin`)

**Package name:** `@mcv/admin`  
**Port:** 3000  
**Status:** Active Development  
**Domain:** `admin.mcv.one`  

The Super-Admin is the **Portfolio Command & Control Center** — a Tier 0 Executive Interface designed for operators who run the entire MCV Global multi-venture technology consortium. It is not merely an admin panel; it is a comprehensive enterprise operating system.

#### Core Modules

| Module | Route Prefix | Pages | Description |
|--------|-------------|-------|-------------|
| **Mission Control** | `/` | 1 | Executive dashboard — KPIs, pending approvals, live signals |
| **Administration** | `/admin/` | 40 | Users, roles, permissions, ventures, flags, email, storage, gateway, audit, marketing, AI command |
| **AI Command Center** | `/ai-command/` | 8 | Swarm overview, agent management, HITL center, NAOS registry, queen orchestrator |
| **Analytics** | `/analytics/` | 1 | Portfolio-wide analytics with KPIs, trends, comparisons |
| **Approvals** | `/approvals/` | 1 | Cross-module approval workflows |
| **CRM** | `/crm/` | 9 | Contacts, organizations, deals, pipeline, forecast, data quality |
| **Product Catalog** | `/catalog/` | 5 | Products, categories, inventory, discounts |
| **Contact Center** | `/contact-center/` | 2 | Unified inbox, outbound dialer |
| **Document Studio** | `/documents/` | 4 | Rich text editor, templates, AI content assistant |
| **Engineering** | `/engineering/` | 1 | Workbench — venture genesis, architecture, planning, execution |
| **Grant Concierge** | `/grants/` | 1 | Pipeline tracker, opportunity scout |
| **Integrations** | `/integrations/` | 1 | Third-party service connections |
| **Intelligence** | `/intelligence/` | 1 | AI-powered intelligence hub |
| **Invoicing** | `/invoicing/` | 8 | Invoices, proposals, estimates, credit notes, recurring, platform fees |
| **Knowledge** | `/knowledge/` | 4 | Documentation, API reference, training, changelog |
| **Onboarding** | `/onboarding/` | 1 | User and venture onboarding wizard |
| **Operations** | `/ops/` | 1 | Infrastructure monitoring, health checks |
| **Platform** | `/platform/` | 4 | The Forge, asset library, prompt library |
| **Portfolio** | `/portfolio/` | 6 | Venture registry, capital stack, domains, entities, health |
| **Settings** | `/settings/` | 9 | Profile, security, sessions, API keys, appearance, notifications |
| **Signals** | `/signals/` | 1 | Real-time signal feed |
| **Strategy** | `/strategy/` | 4 | Vision board, roadmap, investor relations, M&A pipeline |
| **Swarm** | `/swarm/` | 1 | Global AI swarm dashboard |
| **Tasks** | `/tasks/` | 3 | Projects, project detail, HITL tasks |
| **Token Economy** | `/token-economy/` | 1 | EDGE token dashboard |
| **Treasury** | `/treasury/` | 1 | P&L, cash operations |
| **Workflows** | `/workflows/` | 2 | Visual workflow builder, run history |
| **CMS** | `/cms/` | 5 | Posts, categories, tags, comments |
| **Media** | `/media/` | 1 | Media library and file browser |
| **Venture Context** | `/v/[ventureSlug]/` | 9 | Per-venture dashboard, engineering, growth, operations, tasks |
| **Public** | `/portfolio/` (public) | 2 | Portfolio showcase, venture profiles |
| **Error Pages** | `/forbidden/`, `/maintenance/` | 2 | 403 and maintenance mode |

**Total: 169 pages, 75 API routes**

#### Global Navigation Sections

The Super-Admin sidebar organizes modules into 18 navigation sections:

1. **COMMAND CENTER** — Mission Control, Portfolio Health, Live Signals, Pending Approvals
2. **PORTFOLIO** — Venture Registry, Entity Management, Domain Portfolio, Capital Stack
3. **STRATEGY** — Vision Board, Master Roadmap, M&A Pipeline, Investor Relations
4. **TREASURY** — P&L Overview, Cash Operations, Tax & Compliance, Funding Rounds
5. **TOKEN ECONOMY** — EDGE Dashboard, ACS Controllers, Staking Pools, Governance, Launchpad
6. **INTELLIGENCE** — Intelligence Hub, Entity Explorer, Knowledge Hub, Venture Profiles
7. **AI COMMAND** — Swarm Overview, Active Swarm, Queen Orchestrator, NAOS Registry, Agent Configs, Prompt Library, HITL Center
8. **CRM** — Dashboard, Contacts, Organizations, Deals, Forecast, Data Quality
9. **ENGINEERING SUITE** — Ops Center, Workbench, The Forge, Docs & Releases
10. **GRANT CONCIERGE** — Pipeline Tracker, Opportunity Scout, Deadline Calendar, Document Vault
11. **INVOICING** — Overview, Invoices, Proposals, Recurring, Estimates, Credit Notes, Approvals, Platform Fees
12. **PRODUCT CATALOG** — Overview, Products, Categories, Inventory, Discounts, Collections
13. **DOCUMENT STUDIO** — Template Gallery, Editor, Content Library, AI Content Assistant
14. **CONTENT STUDIO** — Posts, Categories, Media Library
15. **PLATFORM** — Module Marketplace, Asset Library, The Forge, Prompt Library, Integration Hub
16. **KNOWLEDGE** — Documentation Hub, API Reference, Training Center, Changelog
17. **ADMINISTRATION** — Venture Management, User Management, Roles & Permissions, Feature Flags, Invitations
18. **SETTINGS** — Workspace Settings, API Keys, Audit Log, Billing

### Application 2: Venture Admin (`@mcv/venture-admin`)

**Package name:** `@mcv/venture-admin`  
**Port:** 3001  
**Status:** Planned  
**Domain:** `{venture-slug}.mcv.one`  

The Venture Admin is a **tenant-scoped** administration portal designed for venture operators who manage a single venture rather than the entire consortium. It shares most feature modules with the Super-Admin via the monorepo architecture but operates in a fundamentally different context.

#### Super-Admin vs Venture Admin

| Dimension | Super-Admin | Venture Admin |
|-----------|-------------|---------------|
| **Scope** | All ventures (Tier 0) | Single venture (Tier 1) |
| **Context** | Global + venture switching | Fixed venture context |
| **Navigation** | Full 18-section global nav + venture nav | Venture nav only |
| **Domain** | `admin.mcv.one` | `{venture}.mcv.one` |
| **Permissions** | Full RBAC (Tier 0–3) | Venture RBAC (Tier 1–3) |
| **Exclusive features** | Portfolio, Treasury, Token Economy, Strategy, Platform | — |
| **Shared features** | CRM, Catalog, Tasks, Engineering, Settings | CRM, Catalog, Tasks, Engineering, Settings |
| **Login page** | MCV Global branded | Venture-branded |
| **Onboarding** | Super admin onboarding | Venture-specific onboarding |
| **Custom domains** | ✗ | ✓ (`{venture}.mcv.one`) |

#### Planned Feature Set

| Module | Description |
|--------|-------------|
| **Venture Dashboard** | Single-venture mission control with KPIs, health, and alerts |
| **Operations** | Venture-specific operations monitoring |
| **Engineering** | Venture engineering workbench, DevOps, deployments |
| **Growth** | Growth metrics, analytics, campaigns |
| **CRM** | Venture-scoped contacts, deals, pipeline |
| **Tasks** | Project management, sprints, HITL tasks |
| **Settings** | Venture configuration, branding, domains |
| **User Management** | Venture user administration (Tier 1–3 roles) |

---

## Architecture Position

`@mcv/apps` sits at the **apex of the dependency tree**, consuming services from every tier below:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   T I E R   6  ─  P R E S E N T A T I O N             │
│                                                         │
│   ┌───────────────────┐   ┌───────────────────┐        │
│   │   @mcv/admin      │   │ @mcv/venture-admin│        │
│   │   (Super-Admin)   │   │ (Venture Admin)   │        │
│   │   Port 3000       │   │ Port 3001         │        │
│   │   169 pages       │   │ Planned           │        │
│   └────────┬──────────┘   └────────┬──────────┘        │
│            │                       │                    │
│   ─ ─ ─ ─ ┴ ─ ─ ─ YOU ARE HERE ─ ┘ ─ ─ ─ ─ ─ ─ ─    │
└────────────┼────────────────────────────────────────────┘
             │
             │ consumes
             ▼
┌─────────────────────────────────────────────────────────┐
│   T I E R   5  ─  D O M A I N   M O D U L E S         │
│                                                         │
│   @mcv/ui          Design system, MCVShell, 508 comps   │
│   @mcv/users       User management, profiles            │
│   @mcv/tenants     Multi-tenancy, Chameleon Engine      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│   T I E R   4  ─  F E A T U R E S                      │
│                                                         │
│   @mcv/auth          Authentication (Better Auth)       │
│   @mcv/permissions   RBAC, permission gates             │
│   @mcv/flags         Feature flag evaluation            │
│   @mcv/notifications Push, email, in-app alerts         │
│   @mcv/ai            AI/LLM integrations, agents        │
│   @mcv/activity      Activity feed, engagement          │
│   @mcv/audit         Audit logging, compliance          │
│   @mcv/gateway       AI Gateway, model routing          │
│   @mcv/rag           RAG, knowledge retrieval           │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│   T I E R   3  ─  A P I   L A Y E R                    │
│                                                         │
│   @mcv/api           tRPC routers, gateway              │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│   T I E R   2  ─  I N F R A S T R U C T U R E          │
│                                                         │
│   @mcv/db            Drizzle ORM, PostgreSQL schemas    │
│   @mcv/storage       S3/Supabase file storage           │
│   @mcv/realtime      WebSocket, SSE, presence           │
│   @mcv/config        Shared config, env validation      │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│   T I E R   1  ─  F O U N D A T I O N                  │
│                                                         │
│   @mcv/kernel        Shared types, utilities            │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│   T I E R   0  ─  C O R E                              │
│                                                         │
│   Runtime, logging, error handling                      │
└─────────────────────────────────────────────────────────┘
```

### Dependency Flow Rules

1. **`@mcv/apps` imports from all lower tiers** — It is the only tier that touches every other tier
2. **No package imports from `@mcv/apps`** — Tier 6 is a terminal consumer; nothing depends on it
3. **Feature modules are internal** — The `features/` directory is private to the apps package; modules are not exported
4. **Shared components flow upward** — Reusable components are extracted to `@mcv/ui` (Tier 5), not kept in apps

---

## Key Interfaces & Types

### Navigation Types

```typescript
// Navigation layer enum
type NavigationLayer = 'global' | 'venture' | 'module';

// Venture slug (union of all venture identifiers)
type VentureSlug =
  | 'betedge'
  | 'edgeiq'
  | 'mcvgg'
  | 'studio'
  | 'agency'
  | 'sentinel';

// Navigation item definition
interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  permission?: string;
  children?: NavigationItem[];
}

// Navigation section (group of items)
interface NavigationSection {
  title: string;
  items: NavigationItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

// Breadcrumb entry
interface Breadcrumb {
  label: string;
  href?: string;
  icon?: LucideIcon;
}
```

### Navigation Store State

```typescript
interface NavigationState {
  layer: NavigationLayer;
  currentVenture: VentureSlug | null;
  globalSection: string;
  ventureSection: string;
  activeModule: string | null;
  moduleSubSection: string | null;
  sidebarCollapsed: boolean;
  sidebarTransitioning: boolean;
  breadcrumbs: Breadcrumb[];
  recentVentures: VentureSlug[];         // max 5, persisted to localStorage
  workbenchActive: boolean;
  workbenchStage: 'genesis' | 'architecture' | 'planning' | 'execution' | null;
}

interface NavigationActions {
  switchToGlobal(): void;
  switchToVenture(slug: VentureSlug): void;
  enterModule(slug: string, subSection?: string): void;
  exitModule(): void;
  toggleSidebar(): void;
  setBreadcrumbs(crumbs: Breadcrumb[]): void;
}
```

### Auth Store State

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
```

### Venture Configuration

```typescript
interface VentureConfig {
  slug: VentureSlug;
  name: string;
  color: string;               // primary color (e.g., '#F59E0B')
  accentColor: string;         // accent variant
  icon: string;                // Lucide icon name
  domain: string;              // public domain (e.g., 'betedge.app')
  adminDomain: string;         // admin domain (e.g., 'betedge.mcv.one')
  category: 'consumer' | 'platform' | 'service';
  hasEdgeToken: boolean;
  status: 'development' | 'active' | 'maintenance' | 'archived';
  productSuite: NavigationItem[];
}
```

### Auth Provider Context

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

// Convenience hooks
function useAuth(): AuthContextValue;
function useIsAuthenticated(): boolean;
function useCurrentUser(): User | null;
function useAuthLoading(): boolean;
```

### Venture Context (Chameleon Engine)

```typescript
interface VentureContextValue {
  venture: VentureConfig | null;
  color: string;
  mode: 'global' | 'venture';
  isVenture: boolean;
}

function useVenture(): VentureConfig | null;
function useVentureColor(): string;
function useContextMode(): 'global' | 'venture';
function useIsVenture(): boolean;
function switchToGlobal(): void;
function switchToVenture(slug: VentureSlug): void;
```

### Page Props & Params

```typescript
// Dynamic route params
interface VentureParams {
  ventureSlug: string;
}

interface EntityParams {
  id: string;
}

interface VentureEntityParams extends VentureParams {
  id: string;
}

// Search params (URL query state via nuqs)
interface PaginatedSearchParams {
  page?: number;
  limit?: number;
  q?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface FilteredSearchParams extends PaginatedSearchParams {
  status?: string;
  venture?: VentureSlug;
  dateFrom?: string;
  dateTo?: string;
}
```

### MCVShell Props

```typescript
interface MCVShellProps {
  sidebarCollapsed: boolean;
  headerProps: {
    navigationState: NavigationState;
    activeVenture: VentureConfig | null;
    ventures: VentureConfig[];
    recentVentures: VentureSlug[];
    user: User;
    onHomeClick: () => void;
    onSwitchContext: (slug: VentureSlug | null) => void;
    onLogout: () => void;
  };
  sidebarProps: {
    navigation: NavigationSection[];
    navigationState: NavigationState;
    activeVenture: VentureConfig | null;
    ventures: VentureConfig[];
    isCollapsed: boolean;
    currentPath: string;
  };
  children: React.ReactNode;
}
```

---

## Configuration

### Next.js Configuration (`next.config.ts`)

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,    // ESLint runs separately in CI
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      handlebars: 'handlebars/dist/handlebars.js',
    };
    return config;
  },

  transpilePackages: [
    // 33 @heroui/* component packages
    // 17 @mcv/* workspace packages
    // 3 @trpc/* packages
    // Total: 53 transpiled packages
  ],

  serverExternalPackages: ['handlebars'],
};
```

**Key decisions:**

| Setting | Value | Rationale |
|---------|-------|-----------|
| `reactStrictMode` | `true` | Double-renders in dev to catch side effects |
| `eslint.ignoreDuringBuilds` | `true` | ESLint runs as a separate CI step for speed |
| `transpilePackages` | 53 packages | Workspace packages and HeroUI ship as ESM/TS sources |
| `serverExternalPackages` | `['handlebars']` | Server-only email template engine — keep out of client bundle |
| Webpack alias for Handlebars | Pre-compiled dist | Avoids CJS/ESM interop issues |

### Environment Variables

Validated at startup via `@t3-oss/env-nextjs` + Zod schemas.

#### Required Variables

| Variable | Type | Description |
|----------|------|-------------|
| `DATABASE_URL` | `string` | PostgreSQL connection string (Supabase) |
| `BETTER_AUTH_SECRET` | `string` | Session signing secret |
| `BETTER_AUTH_URL` | `string` | Auth callback URL |
| `NEXT_PUBLIC_APP_URL` | `string` | Public application URL |

#### Authentication

| Variable | Type | Description |
|----------|------|-------------|
| `GOOGLE_CLIENT_ID` | `string` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `string` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | `string` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | `string` | GitHub OAuth client secret |
| `RESEND_API_KEY` | `string` | Resend email service key |

#### Infrastructure

| Variable | Type | Description |
|----------|------|-------------|
| `UPSTASH_REDIS_REST_URL` | `string` | Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | `string` | Redis auth token |
| `SUPABASE_URL` | `string` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `string` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | `string` | Supabase service role key (server-only) |

#### AI Gateway

| Variable | Type | Description |
|----------|------|-------------|
| `OPENAI_API_KEY` | `string` | OpenAI API key |
| `ANTHROPIC_API_KEY` | `string` | Anthropic API key |
| `AI_GATEWAY_BUDGET_LIMIT` | `number` | Monthly AI spend limit |

#### Storage

| Variable | Type | Description |
|----------|------|-------------|
| `S3_BUCKET` | `string` | S3 bucket name |
| `S3_REGION` | `string` | S3 region |
| `S3_ACCESS_KEY_ID` | `string` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | `string` | S3 secret key |

#### Payments

| Variable | Type | Description |
|----------|------|-------------|
| `STRIPE_SECRET_KEY` | `string` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | `string` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | `string` | Webhook signing secret |
| `STRIPE_CONNECT_CLIENT_ID` | `string` | Connect platform client ID |

#### Realtime

| Variable | Type | Description |
|----------|------|-------------|
| `PUSHER_APP_ID` | `string` | Pusher app ID |
| `PUSHER_KEY` | `string` | Pusher key |
| `PUSHER_SECRET` | `string` | Pusher secret |
| `PUSHER_CLUSTER` | `string` | Pusher cluster |
| `NEXT_PUBLIC_PUSHER_KEY` | `string` | Client-side Pusher key |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `string` | Client-side Pusher cluster |

### Routing Configuration

Route groups organize the application into four primary contexts:

```
app/
├── (auth)/              # Unauthenticated — login, register, MFA
├── (dashboard)/         # Authenticated — main application shell
│   ├── (global)/        # Tier 0 — Super Admin global context
│   ├── cms/             # CMS — shares dashboard layout
│   ├── media/           # Media — shares dashboard layout
│   └── v/[ventureSlug]/ # Tier 1 — per-venture context
├── (public)/            # Public — portfolio showcase
└── api/                 # API — tRPC, REST, webhooks
```

### Auth Configuration

Authentication is configured through `@mcv/auth` (Better Auth) with:

| Feature | Configuration |
|---------|---------------|
| **Primary method** | Email/password with remember-me |
| **Passwordless** | Magic link via Resend |
| **OAuth providers** | Google, GitHub (configurable) |
| **WebAuthn/Passkey** | `@simplewebauthn/browser` v11 |
| **MFA** | TOTP (Google Authenticator, Authy) |
| **Session storage** | HttpOnly cookies (never in localStorage) |
| **Session enrichment** | tRPC `auth.me` query adds RBAC data (5-min stale) |

### PostCSS / Tailwind Configuration

```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},   // Tailwind CSS v4 via PostCSS
  },
};
```

Tailwind CSS v4 with custom theme extending the HeroUI design tokens. Dark mode forced via `className="dark"` on the `<html>` element.

---

## Dependencies

### Workspace Dependencies (17 `@mcv/*` packages)

All consumed via pnpm `workspace:*` protocol:

| Package | Tier | Role in Apps |
|---------|------|--------------|
| `@mcv/config` | 2 | Shared configuration, env schemas |
| `@mcv/db` | 2 | Database client (Drizzle ORM), schema definitions |
| `@mcv/storage` | 2 | File storage (S3/Supabase), upload management |
| `@mcv/realtime` | 2 | WebSocket/SSE, live updates, presence |
| `@mcv/api` | 3 | tRPC router definitions, API layer |
| `@mcv/auth` | 4 | Authentication (Better Auth), session management |
| `@mcv/permissions` | 4 | RBAC, permission gates, role guards |
| `@mcv/flags` | 4 | Feature flag evaluation, targeting rules |
| `@mcv/notifications` | 4 | Push, email, in-app alerts |
| `@mcv/ai` | 4 | AI/LLM integrations, agent framework |
| `@mcv/gateway` | 4 | AI Gateway, model routing, rate limiting |
| `@mcv/rag` | 4 | RAG, knowledge retrieval |
| `@mcv/activity` | 4 | Activity feed, engagement tracking |
| `@mcv/audit` | 4 | Audit logging, compliance trail |
| `@mcv/ui` | 5 | Shared UI components (MCVShell, design system) |
| `@mcv/tenants` | 5 | Multi-tenancy, venture context, Chameleon Engine |
| `@mcv/users` | 5 | User management, profiles, invitations |

### External Dependencies — Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.0.7 | App Router, RSC, API Routes, Middleware |
| `react` / `react-dom` | 18.3.1 | Component rendering |
| `typescript` | 5.6.3 | End-to-end type safety |
| `tailwindcss` | 4.1.18 | Utility-first CSS (v4) |

### External Dependencies — UI Component Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| `@heroui/*` (33 packages) | 2.8.7 | Primary component library |
| `@radix-ui/*` (12 packages) | various | Headless primitives |
| `lucide-react` | 0.563.0 | Icon library (1000+ icons) |
| `@iconify/react` | 5.0.2 | Extended icon sets |
| `framer-motion` | 11.11.17 | Animations, transitions |

### External Dependencies — Data & State

| Package | Version | Purpose |
|---------|---------|---------|
| `@trpc/client` | v11 RC | tRPC client |
| `@trpc/react-query` | v11 RC | tRPC React Query integration |
| `@trpc/server` | v11 RC | tRPC server (for API routes) |
| `@tanstack/react-query` | 5.90.19 | Server state management |
| `@tanstack/react-table` | 8.21.3 | Headless table primitives |
| `zustand` | 5.0.1 | Client-side state management |
| `nuqs` | 2.8.6 | URL query state management |
| `superjson` | 2.2.6 | tRPC serialization |

### External Dependencies — Auth & Security

| Package | Version | Purpose |
|---------|---------|---------|
| `@simplewebauthn/browser` | v11 | WebAuthn/Passkey support |
| `@upstash/ratelimit` | 2.0.8 | Distributed rate limiting |
| `@upstash/redis` | 1.36.1 | Redis client |
| `@t3-oss/env-nextjs` | 0.13.10 | Env variable validation |
| `zod` | 4.3.6 | Schema validation |

### External Dependencies — Rich Content

| Package | Version | Purpose |
|---------|---------|---------|
| `@tiptap/*` (7 extensions) | 2.4.0 | Rich text editor |
| `shiki` | 1.22.2 | Syntax highlighting |
| `react-markdown` | 9.0.1 | Markdown rendering |
| `react-dropzone` | 14.0.0 | File upload |

### External Dependencies — Visualization

| Package | Version | Purpose |
|---------|---------|---------|
| `recharts` | 2.13.3 | Charts and graphs |
| `@xyflow/react` | 12.3.5 | Flow diagrams |
| `@vis.gl/react-google-maps` | 1.7.1 | Map visualizations |
| `@dnd-kit/*` (4 packages) | various | Drag-and-drop |
| `canvas-confetti` | 1.9.4 | Celebration animations |

### External Dependencies — Forms

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | 7.71.1 | Form management |
| `@hookform/resolvers` | 5.2.2 | Zod schema integration |
| `cmdk` | 1.1.1 | Command palette (⌘K) |

### External Dependencies — Utilities

| Package | Version | Purpose |
|---------|---------|---------|
| `date-fns` | 4.1.0 | Date manipulation |
| `clsx` | 2.1.1 | Conditional classNames |
| `tailwind-merge` | 2.5.4 | Tailwind class merging |
| `class-variance-authority` | 0.7.1 | Component variants |
| `sonner` | 2.0.7 | Toast notifications |
| `next-themes` | 0.4.3 | Theme management |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `storybook` | 8.6.14 | Component development |
| `playwright` | latest | E2E testing |
| `eslint` | 9.14.0 | Linting |
| `prettier` | latest | Formatting |
| `turbo` | 2.3.0 | Monorepo build orchestration |
| `vite` | 6.4.1 | Storybook bundler |

---

## Multi-Tenant Design

### Architecture Overview

The MCV.ONE platform serves a **9-venture consortium** through a unified application that dynamically adapts its branding, navigation, data scope, and permissions based on the active venture context.

### The Chameleon Engine

The multi-tenant system is powered by the **Chameleon Engine** — a dynamic UI rebranding system implemented via the `VentureContextProvider` from `@mcv/tenants/client`.

#### Two Operating Modes

```
┌───────────────────────────────────────────────────────┐
│                    GLOBAL MODE (Tier 0)               │
│                                                       │
│  • Portfolio-wide view across ALL ventures            │
│  • Full 18-section global navigation                  │
│  • Emerald green accent (#10B981)                     │
│  • Route: /dashboard, /admin, /crm, etc.             │
│  • Super Admin only (Tier 0)                          │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│                   VENTURE MODE (Tier 1)               │
│                                                       │
│  • Scoped to a single venture                         │
│  • Venture-specific navigation                        │
│  • Venture-branded colors & icons                     │
│  • Route: /v/[ventureSlug]/*                          │
│  • Tier 1+ users                                      │
└───────────────────────────────────────────────────────┘
```

#### Venture Registry

| Venture | Slug | Color | Domain | Category |
|---------|------|-------|--------|----------|
| **BetEdge AI** | `betedge` | `#F59E0B` Amber | `betedge.app` | Consumer |
| **EdgeIQ Markets** | `edgeiq` | `#8B5CF6` Purple | `edgeiq.app` | Consumer |
| **MCV Gaming** | `mcvgg` | `#EF4444` Red | `mcv.gg` | Consumer |
| **MCV Studio** | `studio` | `#06B6D4` Cyan | `mcv.digital` | Platform |
| **MCV Agency** | `agency` | `#EC4899` Pink | `mcv.cx` | Service |
| **MCV Sentinel** | `sentinel` | `#10B981` Emerald | `mcv.tech` | Platform |

#### Dynamic Branding Application

When a user switches to a venture context, the Chameleon Engine:

1. **Updates CSS variables** — Primary and accent colors cascade through all components
2. **Swaps sidebar navigation** — Venture-specific product suite replaces global nav
3. **Updates breadcrumbs** — Venture name appears at the root of the breadcrumb trail
4. **Applies venture icon** — Sidebar header shows the venture's icon and name
5. **Scopes data queries** — tRPC calls automatically include the venture context
6. **Updates page titles** — Metadata reflects the active venture

### Super-Admin Multi-Venture View

The Super-Admin can see data across **all ventures simultaneously** in Global Mode:

- **Portfolio Dashboard** — Health scores, KPIs, and comparisons across all ventures
- **CRM** — Contacts and deals tagged by venture, with cross-venture pipeline views
- **Treasury** — Consolidated P&L, cash flow, and funding across the consortium
- **User Management** — All users with their venture access assignments
- **AI Command** — Agent swarms operating across multiple ventures
- **Analytics** — Cross-venture trend analysis and benchmarks

### Venture Admin Isolation

The Venture Admin (`@mcv/venture-admin`) enforces strict tenant isolation:

- **Fixed context** — The venture context is determined at login and cannot be switched
- **Navigation** — Only venture-specific navigation items are available
- **Data** — All queries are automatically scoped to the venture via RLS
- **Permissions** — Only Tier 1–3 roles are available (no Tier 0 / Super Admin)
- **Domains** — Each venture gets its own admin subdomain (`{slug}.mcv.one`)

### Data Isolation — Database Level

Multi-tenant data isolation is enforced at the database level through Supabase Row-Level Security (RLS):

```sql
-- Every venture-scoped table has a venture_id column
-- RLS policy ensures users only see their venture's data
CREATE POLICY "Users can only see their venture's data"
  ON resources
  FOR SELECT
  USING (venture_id = current_setting('app.current_venture_id')::uuid);
```

The venture context is set in the database session via `SET app.current_venture_id` before each query, ensuring no data leakage between tenants regardless of application-layer bugs.

---

## Security

### Defense in Depth

The application implements security at **six layers**:

```
┌─────────────────────────────────────────────────┐
│  Layer 1: EDGE MIDDLEWARE                       │
│  • Auth check (session cookie validation)       │
│  • Rate limiting (Upstash Redis)                │
│  • Security headers (CSP, X-Frame-Options)      │
│  • Public path allowlist                         │
├─────────────────────────────────────────────────┤
│  Layer 2: TRANSPORT                             │
│  • HttpOnly session cookies                      │
│  • Secure flag (HTTPS in production)             │
│  • SameSite (Strict/Lax)                         │
│  • No tokens in localStorage                     │
├─────────────────────────────────────────────────┤
│  Layer 3: APPLICATION                           │
│  • AuthProvider (session + RBAC enrichment)       │
│  • VentureProvider (tenant resolution)            │
│  • PermissionsProvider (RBAC context)             │
├─────────────────────────────────────────────────┤
│  Layer 4: COMPONENT                             │
│  • PermissionGate (conditional rendering)         │
│  • RoleGuard (tier-based rendering)               │
│  • SuperAdminOnly / VentureAdminOnly              │
├─────────────────────────────────────────────────┤
│  Layer 5: API                                   │
│  • tRPC context (server-side session verify)      │
│  • Permission checks on every procedure           │
│  • Venture context validation                     │
├─────────────────────────────────────────────────┤
│  Layer 6: DATABASE                              │
│  • Supabase Row-Level Security (RLS)              │
│  • Venture-scoped policies on all tables          │
│  • Service role for admin overrides               │
└─────────────────────────────────────────────────┘
```

### Edge Middleware

The `src/middleware.ts` runs at the Edge before any page or API route:

#### Authentication Check

```typescript
const PUBLIC_PATHS = [
  '/login', '/register', '/forgot-password', '/reset-password',
  '/verify-email', '/magic-link', '/oauth', '/mfa',
  '/api/auth', '/api/trpc/auth.', '/api/trpc/passkey.',
  '/api/trpc/mfa.', '/api/health',
  '/_next', '/favicon.ico', '/robots.txt', '/sitemap.xml',
];
```

Unauthenticated requests to non-public paths are redirected to `/login?callbackUrl=...` (pages) or receive a `401` JSON response (API routes).

#### Rate Limiting

| Route | Limit | Window |
|-------|-------|--------|
| Login | 5 req | 1 min |
| Registration | 3 req | 1 min |
| Forgot Password | 3 req | 5 min |
| MFA Verify | 5 req | 5 min |
| Magic Link | 3 req | 5 min |
| Passkey | 10 req | 1 min |

Rate-limited responses return HTTP `429` with `Retry-After` and `X-RateLimit-*` headers.

#### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' blob: data: https:;
font-src 'self';
connect-src 'self' https://api.*.mcv.one wss://*.pusher.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

#### Security Headers

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |

### RBAC — Role-Based Access Control

Four user tiers with hierarchical permissions:

| Tier | Role | Access |
|------|------|--------|
| 0 | Super Admin | Full platform access, all ventures, all modules |
| 1 | Venture Admin | Full access within assigned ventures |
| 2 | Manager | Module-level management within ventures |
| 3 | Operator | Operational access within assigned modules |

#### Permission Guard Components

| Component | Description |
|-----------|-------------|
| `PermissionGate` | Renders children if user has specific permission |
| `PermissionStringGate` | String-based permission check |
| `MultiPermissionGate` | Multiple permissions (AND/OR logic) |
| `RoleGuard` | Role-based rendering |
| `SuperAdminOnly` | Tier 0 only |
| `AdminOnly` | Admin role only |
| `VentureAdminOnly` | Venture admin role only |
| `ManagerOnly` | Manager+ role |
| `OperatorOnly` | Operator+ role |

### Session Security

- **HttpOnly cookies** — Session tokens never accessible to client-side JavaScript
- **Secure flag** — HTTPS-only in production
- **SameSite** — Strict or Lax to prevent CSRF
- **Session management** — Users can view and revoke active sessions at `/settings/sessions`
- **Trusted devices** — Users can mark devices as trusted to skip MFA
- **Impersonation** — Super Admins can impersonate users with full audit logging

---

## Performance

### React Server Components (RSC)

The application defaults to **Server Components** for maximum performance:

| Aspect | Server Component | Client Component |
|--------|-----------------|------------------|
| **Default** | ✓ (all components) | Must opt-in with `'use client'` |
| **Data fetching** | Direct DB/API access | Must use hooks (tRPC/React Query) |
| **Bundle size** | Zero client JS | Adds to client bundle |
| **Interactivity** | None | Full (events, state, effects) |

#### When to use Client Components

- Interactive forms (React Hook Form)
- Drag-and-drop interfaces (@dnd-kit)
- Real-time data subscriptions (use-realtime)
- Charts and visualizations (Recharts)
- Client-side state (Zustand stores)
- Command palette (cmdk)
- Animations (Framer Motion)

### Streaming SSR

Next.js 15 App Router enables **streaming** for Server Components:

- `loading.tsx` files provide instant loading skeletons for each route segment
- Server Components can use `Suspense` boundaries for progressive rendering
- Data-heavy pages (analytics, dashboards) stream in sections
- Time to First Byte (TTFB) is minimized

### Code Splitting

- **Route-level** — Each route segment is a separate chunk (automatic with App Router)
- **Feature-level** — Feature modules are lazily imported
- **Component-level** — Heavy components (editors, charts, flow diagrams) use `next/dynamic`
- **Vendor splitting** — `transpilePackages` ensures workspace packages are tree-shaken

### Caching Strategy

| Layer | Mechanism | TTL |
|-------|-----------|-----|
| **React Query** | In-memory cache | 60s stale time (default) |
| **RBAC data** | React Query | 5 min stale time |
| **Static pages** | Build-time rendering | Until next deploy |
| **Dynamic pages** | On-demand ISR | Configurable |
| **Rate limit** | Upstash Redis | Per-route window |
| **CDN** | Vercel Edge | Automatic for static assets |

### Bundle Optimization

- **53 transpiled packages** ensure tree-shaking works across workspace boundaries
- **`serverExternalPackages`** keeps Handlebars server-only (saves ~100KB)
- **HeroUI individual imports** — Each component is a separate package, imported as needed
- **Lucide tree-shaking** — Only imported icons are bundled
- **SuperJSON** — Minimal serialization overhead for tRPC

---

## Deployment

### Build Process

```bash
# Production build via Turborepo
turbo build --filter=@mcv/admin

# Turbo respects the dependency graph:
# 1. Tier 0-1: @mcv/kernel, @mcv/config
# 2. Tier 2:   @mcv/db, @mcv/storage, @mcv/realtime
# 3. Tier 3:   @mcv/api
# 4. Tier 4:   @mcv/auth, @mcv/permissions, @mcv/flags, etc.
# 5. Tier 5:   @mcv/ui, @mcv/tenants, @mcv/users
# 6. Tier 6:   @mcv/admin (this package)
```

### Deployment Targets

| Platform | Use Case | Configuration |
|----------|----------|---------------|
| **Vercel** | Primary production | Zero-config Next.js, Edge Functions for middleware |
| **Docker** | Self-hosted / staging | Multi-stage Dockerfile with standalone output |
| **Fly.io** | Regional deployment | Low-latency venture-specific deployments |

### CI/CD Pipeline

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│   Commit   │───▶│   CI/CD    │───▶│   Build    │───▶│   Deploy   │
│   (main)   │    │   (Turbo)  │    │   (Next.js)│    │  (Vercel)  │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
                        │
                        ├── Typecheck (tsc --noEmit)
                        ├── Lint (eslint)
                        ├── Format check (prettier --check)
                        ├── Unit tests
                        ├── E2E tests (Playwright)
                        └── Build (next build)
```

### Deployment Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Development server (port 3000) |
| `build` | `next build` | Production build with optimization |
| `start` | `next start` | Start production server |
| `lint` | `next lint` | ESLint checks |
| `lint:fix` | `next lint --fix` | Auto-fix lint issues |
| `typecheck` | `tsc --noEmit` | Type checking |
| `format` | `prettier --write .` | Format all files |
| `format:check` | `prettier --check .` | Check formatting |
| `storybook` | `storybook dev -p 6006` | Component dev server |
| `build-storybook` | `storybook build` | Static Storybook build |
| `test:e2e` | `playwright test` | E2E tests |
| `test:e2e:ui` | `playwright test --ui` | E2E tests with UI |

### Build Optimization

| Optimization | Mechanism |
|-------------|-----------|
| App Router static pages | Pre-rendered at build time |
| Dynamic routes | On-demand ISR with `[id]` and `[ventureSlug]` |
| API routes | Serverless functions (auto-scaled) |
| Middleware | Edge Functions (Vercel) or Cloudflare Workers |
| Package bundling | Tree-shaking via `transpilePackages` |
| Turbo caching | Remote caching for CI (hash-based invalidation) |

### Production Checklist

- [ ] All environment variables set and validated
- [ ] Database migrations applied
- [ ] Supabase RLS policies configured
- [ ] Redis (Upstash) provisioned for rate limiting
- [ ] OAuth providers configured (Google, GitHub)
- [ ] Stripe webhooks registered
- [ ] Pusher channels provisioned
- [ ] S3 bucket configured with CORS
- [ ] CSP headers reviewed for production domains
- [ ] Domain DNS configured (`admin.mcv.one`, `*.mcv.one`)
- [ ] SSL certificates provisioned
- [ ] Monitoring and alerting configured
- [ ] Error tracking (Sentry/equivalent) integrated
- [ ] CDN warm-up for static assets

---

*@mcv/apps — Application Layer*
