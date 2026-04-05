# @mcv/apps — Implementation Plan

| Field            | Value                                    |
| ---------------- | ---------------------------------------- |
| **Package**      | `@mcv/apps`                              |
| **Scope**        | INTERNAL                                 |
| **Tier**         | 6 — Presentation Layer                   |
| **Last Updated** | February 2026                            |

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1 — Foundation](#phase-1--foundation)
4. [Phase 2 — Core Features](#phase-2--core-features)
5. [Phase 3 — Advanced Features](#phase-3--advanced-features)
6. [Phase 4 — Polish & Production Readiness](#phase-4--polish--production-readiness)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risks & Mitigations](#risks--mitigations)
10. [Timeline](#timeline)

---

## Overview

This plan defines the phased implementation of `@mcv/apps` — the Tier 6 Presentation layer comprising two Next.js 15 applications that serve as the primary user interfaces for the MCV.ONE platform:

- **`@mcv/admin` (Super-Admin)** — Portfolio Command & Control Center for consortium-wide management (169 pages, 75 API routes)
- **`@mcv/venture-admin`** — Per-venture administration portal, tenant-scoped to a single venture

The implementation proceeds in four phases: **Foundation** (shell, auth, layout), **Core** (major feature modules), **Advanced** (AI, real-time, analytics), and **Polish** (a11y, performance, testing). Each phase has concrete deliverables, measurable acceptance criteria, and identified risks.

### Guiding Principles

| Principle | Meaning |
|-----------|---------|
| **Server-first** | Default to React Server Components; opt into client interactivity only when required |
| **Feature-sliced** | Each capability is a self-contained module under `features/` with its own components, hooks, types |
| **Ship incrementally** | Every phase produces a usable, deployable application — no big-bang launches |
| **Type-safe end-to-end** | From Drizzle schema → tRPC router → React component props — never break the type chain |
| **Dark mode native** | Build for dark theme first (zinc-950 base); light mode is secondary |
| **Monorepo leverage** | Maximize reuse from `@mcv/*` workspace packages; extract shared patterns upward to `@mcv/ui` |

---

## Prerequisites

Before Phase 1 begins, the following packages must be at minimum viable status:

### Tier 0–1 (Core / Foundation)

| Package | Requirement | Status |
|---------|------------|--------|
| `@mcv/kernel` | Shared types, utility functions, error types exported | ✓ Available |
| `@mcv/config` | Environment schema definitions, shared constants | ✓ Available |

### Tier 2 (Infrastructure)

| Package | Requirement | Status |
|---------|------------|--------|
| `@mcv/db` | Drizzle ORM client, core schemas (users, ventures, sessions) | ✓ Available |
| `@mcv/storage` | File upload/download, signed URL generation | ◐ Partial |
| `@mcv/realtime` | Supabase Realtime or Pusher channel abstraction | ◐ Partial |

### Tier 3 (API Layer)

| Package | Requirement | Status |
|---------|------------|--------|
| `@mcv/api` | tRPC `AppRouter` with auth, users, ventures routers | ✓ Available |

### Tier 4 (Features)

| Package | Requirement | Status |
|---------|------------|--------|
| `@mcv/auth` | Better Auth configured: email/password, session cookies, MFA scaffold | ✓ Available |
| `@mcv/permissions` | RBAC engine, `PermissionGate`, `RoleGuard`, tier checks | ✓ Available |
| `@mcv/flags` | Feature flag evaluation, `useFlag` hook | ◐ Partial |
| `@mcv/notifications` | In-app notification delivery, `NotificationProvider` | ◐ Partial |
| `@mcv/audit` | Audit log insertion, `auditLog()` helper | ✓ Available |
| `@mcv/ai` | AI agent framework, gateway client | ◐ Partial |

### Tier 5 (Domain / Presentation Support)

| Package | Requirement | Status |
|---------|------------|--------|
| `@mcv/ui` | MCVShell, HeroUI component wrappers, design tokens | ✓ Available |
| `@mcv/tenants` | VentureContextProvider, Chameleon Engine, venture registry | ✓ Available |
| `@mcv/users` | User management service, invitation service | ✓ Available |

### Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 20 | Runtime |
| pnpm | 9.15+ | Package manager (workspace protocol) |
| Turborepo | 2.3+ | Build orchestration |
| Next.js | 15.0.7 | Framework |
| TypeScript | 5.6+ | Type safety |
| Playwright | latest | E2E testing |
| Storybook | 8.6+ | Component development |

---

## Phase 1 — Foundation

**Duration:** 3 weeks  
**Goal:** A working application shell with authentication, routing, and the MCVShell layout. A user can log in, see the dashboard skeleton, and navigate the sidebar.

### 1.1 — Project Scaffolding

**Tasks:**

- [ ] Initialize `apps/admin/` with Next.js 15 App Router via `create-next-app`
- [ ] Configure `next.config.ts` with `transpilePackages` for all 53 workspace + HeroUI packages
- [ ] Configure `serverExternalPackages: ['handlebars']`
- [ ] Set up TypeScript config extending the workspace root `tsconfig.json`
- [ ] Configure Tailwind CSS v4 via PostCSS (`postcss.config.mjs`)
- [ ] Configure path aliases (`@/` → `src/`)
- [ ] Set up environment variable validation with `@t3-oss/env-nextjs` + Zod
- [ ] Create `.env.example` with all required variables documented
- [ ] Add scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `typecheck`, `format`, `format:check`
- [ ] Verify `turbo build --filter=@mcv/admin` resolves the full dependency graph

**Deliverable:** `pnpm dev` starts the app on port 3000 with a blank page. `turbo build` succeeds.

### 1.2 — Authentication Flow

**Tasks:**

- [ ] Create `(auth)/` route group with minimal centered layout
- [ ] Implement `/login` page with email/password form (React Hook Form + Zod)
- [ ] Implement `/register` page with registration form and email verification trigger
- [ ] Implement `/forgot-password` and `/reset-password` pages
- [ ] Implement `/magic-link` page for passwordless login
- [ ] Implement `/mfa/setup` page (TOTP QR code display)
- [ ] Implement `/mfa/verify` page (6-digit code input)
- [ ] Implement `/oauth/callback` handler for Google and GitHub OAuth
- [ ] Implement `/verify-email` confirmation page
- [ ] Create `lib/auth.ts` wrapping `@mcv/auth` Better Auth client
- [ ] Create `providers/auth-context.tsx` with session + RBAC enrichment via `trpc.auth.me`
- [ ] Create `stores/auth-store.ts` for auth UI state (modals, preferences, trusted devices)
- [ ] Wire auth state machine: Loading → Authenticated (with RBAC) / MFA Pending / Unauthenticated

**Deliverable:** Full login/register/MFA flow functional. Session stored in HttpOnly cookie. AuthProvider enriches session with RBAC data from tRPC.

### 1.3 — Edge Middleware

**Tasks:**

- [ ] Create `src/middleware.ts` with path classification (public vs. authenticated)
- [ ] Implement session cookie validation (check `better-auth.session_token`)
- [ ] Implement redirect logic: pages → `/login?callbackUrl=...`; APIs → 401 JSON
- [ ] Implement rate limiting for auth routes via Upstash Redis
  - `/login`: 5 req/1 min
  - `/register`: 3 req/1 min
  - `/forgot-password`: 3 req/5 min
  - `/mfa/verify`: 5 req/5 min
  - `/magic-link`: 3 req/5 min
  - `/passkey`: 10 req/1 min
- [ ] Implement in-memory rate limit fallback for development
- [ ] Inject security headers on every response (CSP, X-Frame-Options, etc.)
- [ ] Configure middleware matcher to exclude static assets

**Deliverable:** Unauthenticated requests are redirected. Auth routes are rate-limited. All responses include security headers.

### 1.4 — Layout System & MCVShell

**Tasks:**

- [ ] Create `app/layout.tsx` (RootLayout) with fonts (Inter + JetBrains Mono), metadata, dark mode class
- [ ] Create `components/providers.tsx` with ordered provider composition:
  1. TRPCProvider
  2. HeroUIProvider (with router integration)
  3. NextThemesProvider (dark mode forced)
  4. AuthProvider
  5. VentureProvider (Chameleon Engine)
  6. NotificationProvider
- [ ] Create `(dashboard)/layout.tsx` with MCVShell, PermissionsProvider, CommandMenu placeholder
- [ ] Create `(dashboard)/(global)/layout.tsx` with GlobalContextProvider
- [ ] Create `components/layout/app-shell.tsx` orchestrating sidebar + header + content
- [ ] Create `components/layout/app-sidebar.tsx` with navigation rendering
- [ ] Create `components/layout/header.tsx` with venture switcher, user menu, breadcrumbs
- [ ] Create `shared/config/navigation/global-nav.ts` with all 18 navigation sections
- [ ] Create `stores/navigation-store.ts` with layer management, venture switching, sidebar toggle
- [ ] Implement breadcrumb generation from current route path
- [ ] Create `(public)/layout.tsx` with minimal layout
- [ ] Create `forbidden/page.tsx` (403) and `maintenance/page.tsx`

**Deliverable:** Dashboard shell renders with sidebar, header, breadcrumbs. Sidebar navigation is clickable. Venture switcher works. Theme is dark mode.

### 1.5 — Super-Admin Shell

**Tasks:**

- [ ] Create Mission Control landing page (`/`) with placeholder KPI tiles
- [ ] Create loading states (`loading.tsx`) for all Phase 1 route segments
- [ ] Create error boundaries (`error.tsx`) for all Phase 1 route segments
- [ ] Wire the global command palette (`⌘K`) with `cmdk` and basic page search
- [ ] Implement the NAOS header ticker placeholder (static data)
- [ ] Configure `not-found.tsx` global 404 page
- [ ] Verify layout nesting: Root → Dashboard → Global → Module layouts all compose correctly

**Deliverable:** The Super-Admin shell is navigable. Mission Control shows placeholder content. Command palette opens and lists pages. All error states are handled gracefully.

---

## Phase 2 — Core Features

**Duration:** 5 weeks  
**Goal:** Primary feature modules are functional. Users can manage ventures, users, roles, CRM pipeline, and navigate the full module tree.

### 2.1 — Venture Management Pages

**Tasks:**

- [ ] Create `admin/ventures/` — venture list with search, status filter, category filter
- [ ] Create `admin/ventures/[id]/` — venture detail page with settings, team, health
- [ ] Create `admin/ventures/new/` — multi-step creation wizard
- [ ] Create `portfolio/` — venture card grid with health indicators
- [ ] Create `portfolio/[ventureSlug]/` — venture intelligence profile
- [ ] Create `portfolio/capital/` — capital stack and investment tracking
- [ ] Create `portfolio/entities/` — corporate entity registry
- [ ] Create `portfolio/domains/` — domain portfolio management
- [ ] Create `portfolio/health/` — portfolio health dashboard
- [ ] Implement venture CRUD server actions (create, update, activate, archive, suspend)
- [ ] Implement venture API route handlers (13 routes)
- [ ] Wire the Chameleon Engine — switching to a venture rebrands sidebar, header, breadcrumbs

**Deliverable:** Full venture lifecycle management. Chameleon Engine dynamically rebrands the UI per venture context.

### 2.2 — User & Role Management

**Tasks:**

- [ ] Create `admin/users/` — user directory with search, role badges, venture assignments
- [ ] Create `admin/users/[id]/` — user detail with profile, roles, sessions, activity, audit
- [ ] Create `admin/users/invitations/` — invitation management (list, resend, revoke)
- [ ] Create `admin/roles/` — role editor with permission matrix
- [ ] Create `admin/permissions/` — permission management grid
- [ ] Create `settings/` module — profile, account, security, sessions, API keys, appearance, notifications
- [ ] Implement user CRUD API routes (10 routes)
- [ ] Implement invitation workflow (create, send email via Resend, accept, revoke)
- [ ] Implement user impersonation (Super Admin only) with audit logging
- [ ] Wire `PermissionGate` components throughout all admin pages
- [ ] Wire `SuperAdminOnly`, `VentureAdminOnly` guard components

**Deliverable:** Complete user lifecycle management. Invitations sent via email. RBAC enforced at component level.

### 2.3 — Domain Dashboards

**Tasks:**

- [ ] Create `crm/` module — dashboard, contacts, organizations, deals (kanban + list), activities, analytics, forecast, duplicates (9 pages)
- [ ] Create `invoicing/` module — overview, invoices, proposals, estimates, credit notes, recurring, approvals, platform fees (8 pages)
- [ ] Create `catalog/` module — overview, products, categories, inventory, discounts (5 pages)
- [ ] Create `documents/` module — editor (TipTap), templates, assets, AI assistant (4 pages)
- [ ] Create `treasury/` — P&L dashboard page
- [ ] Create `strategy/` module — vision board, roadmap, investor relations, M&A (4 pages)
- [ ] Create `knowledge/` module — docs, API reference, training, changelog (4 pages)
- [ ] Create `cms/` module — posts, categories, tags, comments (5 pages)
- [ ] Implement module-level layouts with tab navigation for each module
- [ ] Implement Feature-Sliced Design structure for each module under `features/`
- [ ] Create Zustand stores for CRM, portfolio, content pipeline, campaign wizard

**Deliverable:** All core domain modules have functional pages with real data from tRPC. Module navigation works with tabs and breadcrumbs.

### 2.4 — Navigation System

**Tasks:**

- [ ] Implement Layer 0 (Global) navigation — all 18 sections with icons, badges, permission gates
- [ ] Implement Layer 1 (Venture) navigation — per-venture product suite, operations, settings
- [ ] Implement Layer 2 (Module) navigation — deep-dive tab navigation within each module
- [ ] Create `shared/config/navigation/venture-nav.ts` — venture-specific nav configuration
- [ ] Create `shared/config/navigation/module-nav.ts` — module-specific tab definitions
- [ ] Create `features/context-switcher/` — Global ↔ Venture context switching component
- [ ] Implement the "recent ventures" quick-switch (max 5, persisted to localStorage)
- [ ] Implement keyboard shortcuts for navigation (sidebar toggle, venture switch, etc.)
- [ ] Enhance command palette with venture-aware search, user search, and action commands
- [ ] Implement `v/[ventureSlug]/` venture-scoped routes (9 pages: dashboard, engineering, growth, operations, settings, tasks)

**Deliverable:** Three-layer navigation system fully functional. Context switching rebrands the entire UI. Command palette searches across all entities.

---

## Phase 3 — Advanced Features

**Duration:** 4 weeks  
**Goal:** AI agent management, real-time features, cross-venture analytics, and mobile responsiveness.

### 3.1 — AI Agent Management UI

**Tasks:**

- [ ] Create `ai-command/` module — 8 pages:
  - Swarm Overview (dashboard)
  - Agent Management (config, capabilities)
  - Queen Orchestrator (multi-agent coordination)
  - NAOS Registry (agent identity system)
  - HITL Center (human-in-the-loop approval queue)
  - Active Swarm (real-time visualization)
  - AI Gateway (model routing, costs)
  - Reasoning Engine (chain viewer/debugger)
- [ ] Create `features/ai-command/` feature module with components, hooks, stores
- [ ] Implement `SwarmVisualization` component using `@xyflow/react` for agent flow diagrams
- [ ] Implement `HITLQueue` component with approval/reject actions and audit logging
- [ ] Create `stores/ai-command-store.ts` for swarm state, agent filters, HITL queue
- [ ] Create `admin/command/` sub-routes — agent configs, approvals, automations, knowledge, prompts, skills (6 pages)
- [ ] Wire AI Gateway API routes (chat, completion, stream, models, budget) — 5 routes
- [ ] Implement live header ticker with NAOS agent feed
- [ ] Create `swarm/` — global AI swarm status dashboard

**Deliverable:** Complete AI Command Center with agent management, HITL workflows, swarm visualization, and gateway monitoring.

### 3.2 — Real-time Dashboards

**Tasks:**

- [ ] Create `providers/realtime-provider.tsx` with Supabase Realtime / Pusher connection management
- [ ] Implement `hooks/use-realtime.ts` — channel subscription hook
- [ ] Implement `hooks/use-presence.ts` — user presence tracking (online/offline/idle)
- [ ] Implement `hooks/use-live-query.ts` — polling + WebSocket fallback
- [ ] Create `signals/` — live signal feed page with real-time event stream
- [ ] Wire real-time updates for:
  - Notification bell (unread count badge)
  - AI swarm status changes
  - CRM deal pipeline updates
  - Approval queue new items
  - Activity feed new entries
  - HITL queue new tasks
- [ ] Implement presence indicators in header (who's online)
- [ ] Wire real-time data to Mission Control KPI tiles
- [ ] Implement optimistic updates for CRM deal stage changes (drag-and-drop)

**Deliverable:** Dashboard and critical pages update in real-time without page refresh. Presence system shows online users. Signal feed streams live events.

### 3.3 — Cross-Venture Analytics Views

**Tasks:**

- [ ] Create `analytics/` — portfolio-wide analytics dashboard
- [ ] Implement KPI comparison charts across ventures (Recharts)
- [ ] Implement revenue trend analysis with sparklines
- [ ] Create `portfolio-health/` — aggregate health scoring dashboard
- [ ] Implement venture health score algorithm (engineering velocity, revenue, team, compliance)
- [ ] Create comparative venture cards with health indicators
- [ ] Implement token economy dashboard (`token-economy/`)
- [ ] Create cross-venture CRM analytics (pipeline value, conversion, forecast)
- [ ] Implement treasury dashboard with consolidated P&L view
- [ ] Wire all analytics to tRPC queries with appropriate stale times

**Deliverable:** Executives can view and compare metrics across all ventures from a single dashboard. Health scoring provides at-a-glance venture status.

### 3.4 — Mobile Responsive Design

**Tasks:**

- [ ] Audit all layouts for mobile breakpoints (< 768px)
- [ ] Implement responsive sidebar — collapsible drawer on mobile, persistent on desktop
- [ ] Implement responsive header — condensed navigation, hamburger menu
- [ ] Implement responsive data tables — card view on mobile, table on desktop
- [ ] Implement responsive charts — simplified view on small screens
- [ ] Implement touch-friendly interactions for kanban boards and drag-and-drop
- [ ] Test and fix all 169 pages at mobile, tablet, and desktop breakpoints
- [ ] Implement responsive command palette (full-screen on mobile)
- [ ] Verify touch targets meet minimum 44px accessibility requirement

**Deliverable:** Application is fully usable on mobile devices. Sidebar collapses to a drawer. Tables switch to card layout. Touch interactions work correctly.

---

## Phase 4 — Polish & Production Readiness

**Duration:** 3 weeks  
**Goal:** Accessibility compliance, performance optimization, comprehensive testing, and production deployment readiness.

### 4.1 — Accessibility (a11y)

**Tasks:**

- [ ] Audit all pages with axe-core automated accessibility testing
- [ ] Ensure all interactive elements have proper ARIA labels
- [ ] Implement keyboard navigation for all features (tab order, focus management)
- [ ] Verify color contrast ratios meet WCAG 2.1 AA for dark mode
- [ ] Implement focus trapping in modals and dialogs
- [ ] Add skip-to-content link for keyboard navigation
- [ ] Ensure all form fields have associated labels
- [ ] Implement screen reader announcements for dynamic content (toasts, notifications, live regions)
- [ ] Test with NVDA/VoiceOver screen readers
- [ ] Verify proper heading hierarchy (h1→h6) on all pages
- [ ] Ensure all images have alt text
- [ ] Verify touch target minimum size (44×44px)

**Deliverable:** Application meets WCAG 2.1 AA compliance for all critical paths. Keyboard-only navigation works throughout.

### 4.2 — Performance Optimization

**Tasks:**

- [ ] Analyze bundle size with `@next/bundle-analyzer` — identify and eliminate bloat
- [ ] Convert heavy client components to dynamic imports (`next/dynamic`)
  - TipTap editor
  - Recharts visualizations
  - @xyflow/react flow diagrams
  - @dnd-kit drag-and-drop
- [ ] Implement route prefetching for likely navigation targets
- [ ] Optimize images with `next/image` and WebP/AVIF formats
- [ ] Implement `loading.tsx` skeletons for all remaining route segments
- [ ] Audit and optimize React Query stale times per route
- [ ] Implement edge caching for public pages (ISR)
- [ ] Optimize provider tree — lazy-load providers not needed on initial render
- [ ] Profile and optimize Zustand store hydration
- [ ] Reduce CLS by setting explicit dimensions on dynamic content containers
- [ ] Implement `Suspense` boundaries for progressive rendering on data-heavy pages
- [ ] Target: < 300KB first-load JS, < 200ms TTFB, < 2.5s LCP

**Deliverable:** Core Web Vitals are green. First-load bundle < 300KB. No CLS > 0.1. TTFB < 200ms on Vercel.

### 4.3 — End-to-End Testing

**Tasks:**

- [ ] Set up Playwright test infrastructure with fixtures and helpers
- [ ] Create test utilities: auth helpers, mock data factories, database seeding
- [ ] Write E2E tests for critical flows:
  - **Auth:** Login (email/password), login (magic link), register, MFA setup + verify, logout, session expiry
  - **Navigation:** Global nav, venture switching, module deep-dive, breadcrumbs, command palette
  - **Venture management:** Create, update, activate, archive, suspend
  - **User management:** Invite user, accept invitation, update role, ban/suspend
  - **CRM:** Create contact, create deal, move deal through pipeline (drag-and-drop)
  - **Invoicing:** Create invoice, approve, mark paid
  - **Feature flags:** Create, toggle, override
  - **Settings:** Update profile, change password, manage sessions
  - **Permissions:** Verify Tier 0–3 access restrictions
  - **Responsive:** Key flows on mobile viewport
- [ ] Set up Storybook visual regression testing for design system components
- [ ] Create Storybook stories for all reusable components
- [ ] Configure CI to run Playwright tests on every PR
- [ ] Configure CI to run Storybook build on every PR
- [ ] Target: > 80% coverage of critical user flows

**Deliverable:** Comprehensive E2E test suite covering all critical paths. CI runs tests automatically. Storybook documents all shared components.

### 4.4 — Production Deployment

**Tasks:**

- [ ] Create production environment variable configuration
- [ ] Configure Vercel project with environment variables and preview deployments
- [ ] Create multi-stage Dockerfile for Docker deployment option
- [ ] Set up CI/CD pipeline:
  1. Typecheck (`tsc --noEmit`)
  2. Lint (`eslint`)
  3. Format check (`prettier --check`)
  4. E2E tests (`playwright test`)
  5. Build (`turbo build --filter=@mcv/admin`)
  6. Deploy (Vercel or Docker push)
- [ ] Configure domain DNS (`admin.mcv.one`, `*.mcv.one` for venture subdomains)
- [ ] Set up SSL certificates
- [ ] Configure monitoring and alerting (Vercel Analytics, error tracking)
- [ ] Create production checklist (see Package Spec deployment section)
- [ ] Perform security review: CSP headers, cookie flags, rate limits, RBAC enforcement
- [ ] Load testing: verify application handles expected concurrent users
- [ ] Create runbook for common production issues
- [ ] Document rollback procedure

**Deliverable:** Application deployed to production with monitoring, CI/CD, and documented operational procedures.

---

## Testing Strategy

### Test Pyramid

```
                    ┌─────────────┐
                    │   E2E       │  Playwright
                    │   Tests     │  (Critical flows)
                    │   10%       │
                ┌───┴─────────────┴───┐
                │   Integration       │  Storybook + vitest
                │   Tests             │  (Component composition)
                │   30%               │
            ┌───┴─────────────────────┴───┐
            │   Unit Tests                │  vitest
            │   (Business logic, hooks,   │  (Utilities, stores)
            │    stores, utilities)       │
            │   60%                       │
            └─────────────────────────────┘
```

### E2E Testing (Playwright)

**Scope:** Critical user flows that cross multiple components and API boundaries

```typescript
// Example: Login flow E2E test
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login with email and password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', 'admin@mcv.one');
    await page.fill('[name=password]', 'secure-password');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Mission Control')).toBeVisible();
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/login\?callbackUrl/);
  });

  test('MFA flow when required', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name=email]', 'mfa-user@mcv.one');
    await page.fill('[name=password]', 'secure-password');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/mfa/verify');
    await page.fill('[name=code]', '123456');
    await page.click('button[type=submit]');
    await expect(page).toHaveURL('/');
  });
});
```

### Component Testing (Storybook)

**Scope:** Visual regression testing and component documentation

```typescript
// Example: VentureCard story
import type { Meta, StoryObj } from '@storybook/react';
import { VentureCard } from '@/widgets/venture-card';

const meta: Meta<typeof VentureCard> = {
  title: 'Widgets/VentureCard',
  component: VentureCard,
  decorators: [withProviders],
  parameters: { layout: 'centered' },
};

export default meta;

export const BetEdgeAI: StoryObj<typeof VentureCard> = {
  args: {
    venture: { name: 'BetEdge AI', slug: 'betedge', color: '#F59E0B', status: 'active' },
    health: 92,
    revenue: '$45,200',
    teamSize: 12,
  },
};

export const Archived: StoryObj<typeof VentureCard> = {
  args: {
    venture: { name: 'Old Venture', slug: 'old', color: '#6B7280', status: 'archived' },
    health: 0,
  },
};
```

### Unit Testing (vitest)

**Scope:** Pure functions, Zustand stores, utility functions, custom hooks

```typescript
// Example: Navigation store tests
import { describe, it, expect, beforeEach } from 'vitest';
import { useNavigationStore } from '@/stores/navigation-store';

describe('NavigationStore', () => {
  beforeEach(() => {
    useNavigationStore.getState().switchToGlobal();
  });

  it('switches to venture context', () => {
    useNavigationStore.getState().switchToVenture('betedge');
    expect(useNavigationStore.getState().layer).toBe('venture');
    expect(useNavigationStore.getState().currentVenture).toBe('betedge');
  });

  it('tracks recent ventures (max 5)', () => {
    const slugs = ['betedge', 'edgeiq', 'mcvgg', 'studio', 'agency', 'sentinel'];
    slugs.forEach((s) => useNavigationStore.getState().switchToVenture(s));
    expect(useNavigationStore.getState().recentVentures).toHaveLength(5);
    expect(useNavigationStore.getState().recentVentures[0]).toBe('sentinel');
  });
});
```

---

## Acceptance Criteria

### Phase 1 — Foundation

| Criterion | Measurement |
|-----------|-------------|
| Application starts without errors | `pnpm dev` serves on port 3000 |
| Login flow works end-to-end | User can log in with email/password, session persists across page reloads |
| MFA flow works | User can set up TOTP, verify code on login |
| Magic link works | User receives email, clicks link, is authenticated |
| Middleware blocks unauthenticated requests | Non-public routes redirect to `/login` |
| Rate limiting functional | Exceeding login attempts returns 429 |
| Security headers present | CSP, X-Frame-Options, HSTS on all responses |
| Dashboard shell renders | Sidebar, header, breadcrumbs visible |
| Navigation clickable | All 18 sidebar sections render (even if pages are placeholders) |
| Venture switcher works | Context switches update sidebar navigation and branding |
| Command palette opens | `⌘K` opens search with page listing |
| Dark mode enforced | Application renders with zinc-950 background |
| Build succeeds | `turbo build --filter=@mcv/admin` completes without errors |
| TypeScript clean | `tsc --noEmit` reports zero errors |

### Phase 2 — Core Features

| Criterion | Measurement |
|-----------|-------------|
| Venture CRUD functional | Create, read, update, activate, archive ventures via UI |
| User management functional | Invite, view, update roles, ban/suspend users via UI |
| CRM module functional | Create contacts, manage deals, drag-and-drop pipeline |
| Invoicing module functional | Create, edit, approve invoices |
| Catalog module functional | Manage products, categories, inventory |
| Document editor works | TipTap editor creates and saves rich text documents |
| Three-layer navigation complete | Global → Venture → Module navigation transitions work |
| Permission gates enforced | Tier 0-only features invisible to Tier 1+ users |
| All 169 page routes defined | Every page has at least a placeholder component |
| 75 API routes functional | All REST endpoints return valid responses |

### Phase 3 — Advanced Features

| Criterion | Measurement |
|-----------|-------------|
| AI Command Center functional | All 8 AI command pages render with real data |
| Swarm visualization renders | @xyflow/react flow diagram shows agent topology |
| HITL workflow works | Approve/reject AI actions with audit logging |
| Real-time updates work | Changes in one tab appear in another without refresh |
| Presence system works | Online user indicators update in real-time |
| Signal feed streams | New events appear in the feed within 2 seconds |
| Analytics dashboards render | Cross-venture charts and KPIs display correctly |
| Health scoring works | Ventures display calculated health scores |
| Mobile responsive | All pages usable at 375px width |
| Touch interactions work | Kanban drag-and-drop works on touch devices |

### Phase 4 — Polish & Production

| Criterion | Measurement |
|-----------|-------------|
| Accessibility audit passes | axe-core reports zero critical violations |
| Keyboard navigation works | All features accessible via keyboard only |
| Core Web Vitals green | LCP < 2.5s, CLS < 0.1, FID < 100ms |
| First-load bundle < 300KB | Verified via bundle analyzer |
| E2E tests pass | > 80% coverage of critical flows, all pass in CI |
| Storybook builds | All shared components have stories |
| Production deployment works | Application accessible on `admin.mcv.one` |
| CI/CD pipeline functional | Push to main triggers full pipeline |
| Monitoring active | Error tracking and analytics configured |

---

## Risks & Mitigations

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **53-package transpilation is slow** | Build times > 5 min, poor DX | Medium | Use Turbo remote caching; optimize `transpilePackages` to only include actually-used packages; investigate SWC plugins |
| **HeroUI + Tailwind v4 compatibility** | Styling breaks, layout issues | Low | Pin HeroUI version; create thin wrappers in `@mcv/ui` that can swap implementations if needed |
| **RSC + tRPC integration complexity** | Data fetching patterns unclear, hydration mismatches | Medium | Establish clear Server Component vs. Client Component decision tree early; document patterns in `ARCHITECTURE.md` |
| **Bundle size > 300KB target** | Poor mobile performance | Medium | Aggressive dynamic imports for heavy features (editor, charts, flow diagrams); monitor bundle size in CI |
| **Supabase Realtime connection limits** | Real-time features fail at scale | Low | Implement connection pooling; use Pusher as fallback; batch channel subscriptions |
| **Better Auth session management** | Session issues across subdomain deployments | Medium | Test cross-subdomain cookies early; configure cookie domain to `.mcv.one` |

### Dependency Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Lower-tier packages not ready** | Blocked features, mock data proliferation | Medium | Define clear interfaces early; create mocks for missing functionality; prioritize tier dependencies |
| **tRPC v11 RC breaking changes** | API layer instability | Low | Pin version; monitor release notes; abstract tRPC usage through thin client layer |
| **Next.js 15 App Router edge cases** | Unexpected behavior in production | Medium | Stay on stable release; follow Vercel's deployment recommendations; test streaming SSR thoroughly |

### Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **169 pages is a maintenance burden** | Inconsistent patterns, stale pages | High | Enforce Feature-Sliced Design; use code generation for boilerplate; regular cleanup sweeps |
| **Cross-venture data leakage** | Security/compliance violation | Low | Supabase RLS as the backstop; server-side venture context validation in tRPC middleware; periodic security audits |
| **State management complexity** | 10 Zustand stores become entangled | Medium | Clear boundaries per store; no cross-store imports; document store ownership |

---

## Timeline

### Summary

| Phase | Duration | Weeks | Cumulative |
|-------|----------|-------|------------|
| Phase 1 — Foundation | 3 weeks | Weeks 1–3 | Week 3 |
| Phase 2 — Core Features | 5 weeks | Weeks 4–8 | Week 8 |
| Phase 3 — Advanced Features | 4 weeks | Weeks 9–12 | Week 12 |
| Phase 4 — Polish & Production | 3 weeks | Weeks 13–15 | Week 15 |
| **Total** | **15 weeks** | | |

### Detailed Timeline

```
Week  1  ├── Phase 1: Scaffolding + Auth flow
Week  2  ├── Phase 1: Middleware + Layout system
Week  3  ├── Phase 1: MCVShell + Super-Admin shell
         │
Week  4  ├── Phase 2: Venture management pages
Week  5  ├── Phase 2: User & role management
Week  6  ├── Phase 2: CRM + Invoicing modules
Week  7  ├── Phase 2: Catalog + Documents + Treasury + Strategy
Week  8  ├── Phase 2: Navigation system + remaining modules
         │
Week  9  ├── Phase 3: AI Command Center (8 pages)
Week 10  ├── Phase 3: Real-time features + presence
Week 11  ├── Phase 3: Cross-venture analytics + health scoring
Week 12  ├── Phase 3: Mobile responsive + touch interactions
         │
Week 13  ├── Phase 4: Accessibility audit + fixes
Week 14  ├── Phase 4: Performance optimization + E2E tests
Week 15  ├── Phase 4: Production deployment + monitoring
         │
         └── 🚀 Production Launch
```

### Milestone Checkpoints

| Milestone | Week | Gate Criteria |
|-----------|------|--------------|
| **M1: Shell Ready** | 3 | Auth works, shell renders, navigation clickable |
| **M2: Core Complete** | 8 | All 169 pages defined, CRUD flows work, RBAC enforced |
| **M3: Advanced Done** | 12 | AI Command Center, real-time, analytics, mobile |
| **M4: Production** | 15 | Tests pass, a11y clean, CWV green, deployed to prod |

### Venture Admin Timeline

The `@mcv/venture-admin` application begins after the Super-Admin reaches M2 (Core Complete), sharing the majority of feature modules:

| Phase | Duration | Description |
|-------|----------|-------------|
| VA-1 | 2 weeks | Scaffold app, venture-scoped layout, domain-based tenant resolution |
| VA-2 | 2 weeks | Wire shared feature modules (CRM, tasks, catalog, settings) |
| VA-3 | 1 week | Venture-branded login, onboarding flow, polish |
| **Total** | **5 weeks** | Overlaps with Super-Admin Phase 3–4 |

---

*@mcv/apps — Application Layer*
