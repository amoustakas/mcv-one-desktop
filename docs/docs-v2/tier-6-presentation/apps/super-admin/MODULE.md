# @mcv/apps-super-admin — Super Admin Dashboard
## Tier 6: Presentation | Classification: MCV-ONLY

**Version:** 1.0
**Last Updated:** March 10, 2026
**Reference:** 00-ARCHITECTURE.md (Tier 6), DEPLOYMENT-ARCHITECTURE.md
**Prototype Source:** apps/admin in mcv-one-admin-prototype

---

## 1. Executive Summary

The Super Admin Dashboard is the **Tier 0 executive command center** for the entire MCV.ONE consortium. It provides platform-wide visibility and control across all 9+ ventures, the Agent Layer (Queen/NAOS/Ralph), infrastructure, compliance, and treasury. This is **not** a customer-facing application — it is the operational cockpit for MCV Global administrators.

**Access:** Super Admins and designated platform operators only.
**URL:** admin.mcv.one
**Framework:** Next.js 15 (App Router) + tRPC + @mcv/ui

---

## 2. Architecture

The application uses Next.js App Router with route groups:

- **(auth)** — Unauthenticated routes: login, register, forgot-password, reset-password, mfa/setup, mfa/verify, oauth/callback, magic-link, verify-email
- **(dashboard)** — Authenticated shell with sidebar + header
  - **(global)** — Cross-venture operations (35 feature domains)
  - **/v/[ventureSlug]/** — Venture-specific views (engineering, growth, operations, tasks)
- **/api/** — Backend routes: /api/trpc/[trpc] (62 routers), /api/auth/[...all], /api/gateway/*, /api/webhooks/*

---

## 3. Feature Modules (35 Domains)

### 3.1 Platform Administration
- **Dashboard** (/) — KPI overview, venture health, alerts → analytics
- **Users** (/admin/users/*) — User management, invitations, bans, impersonation → identity
- **Roles & Permissions** (/admin/roles, /admin/permissions) — RBAC/ABAC management → identity
- **Ventures** (/admin/ventures/*) — Create/edit/archive ventures, API keys, members → portfolio
- **Feature Flags** (/admin/flags/*) — Flag management, overrides, evaluate → fabric
- **Audit** (/admin/audit/*) — Audit log viewer, exports, timeline → fabric
- **Activity** (/admin/activity) — Activity feed across platform → fabric
- **Storage** (/admin/storage) — File management, quotas → fabric
- **Notifications** (/admin/notifications) — Template management, delivery tracking → fabric

### 3.2 Agent Layer (Agentic OS)
- **AI Command** (/ai-command/*) — Agent management, skills, prompts, knowledge → agentic-os
- **Queen** (/ai-command/queen) — Strategic orchestrator control → agentic-os
- **NAOS** (/ai-command/naos) — Execution pipeline dashboard → agentic-os
- **Swarm** (/ai-command/swarm) — Ralph worker pod management → agentic-os
- **HITL** (/ai-command/hitl) — Human-in-the-loop approvals queue → agentic-os
- **Reasoning** (/ai-command/reasoning) — AI reasoning trace viewer → agentic-os
- **Gateway** (/gateway) — LLM model management, budgets, usage → intelligence
- **RAG** (/rag/*) — Knowledge base, vector search, documents → intelligence

### 3.3 Business Operations
- **CRM** (/crm/*) — Contacts, organizations, deals, pipelines, forecast, duplicates → nexus/crm
- **Contact Center** (/contact-center/*) — Dialer, inbox, call queues → nexus/contact-center
- **Calendar** (/calendar) — Event scheduling, availability → nexus/calendar
- **Forms** (/forms/*) — Dynamic form builder → nexus/forms
- **Document Editor** (/documents/*) — Proposals, contracts, AI writing → nexus/documents
- **Invoicing** (/invoicing/*) — Invoices, estimates, proposals, credit notes, recurring → commerce
- **Payments** (/admin/payments) — Payment processing, Stripe dashboard → commerce
- **Catalog** (/catalog/*) — Products, categories, inventory, discounts → commerce

### 3.4 Growth & Marketing
- **Marketing** (/admin/marketing/*) — Campaigns, assets, automation, studio → growth
- **Email** (/admin/email/*) — Templates, logs, campaigns → growth/email
- **CMS** (/cms/*) — Blog posts, categories, tags, comments → growth/content
- **Knowledge** (/knowledge/*) — Help center, API docs, changelog, training → growth/education
- **Reputation** — Reviews, ratings management → engagement

### 3.5 Finance & Strategy
- **Treasury** (/treasury) — Cash flow, fund management, allocations → treasury
- **Token Economy** (/token-economy) — EDGE token management, staking metrics → token-economy
- **Portfolio** (/portfolio/*) — Venture health, capital, entities, domains → portfolio
- **Strategy** (/strategy/*) — Vision, roadmap, investors, M&A → portfolio/strategy
- **Grant Concierge** (/grants) — Grant discovery, applications, tracking → portfolio/grants

### 3.6 Operations & Developer
- **Tasks** (/tasks/*) — Projects, sprints, HITL tasks → operations/tasks
- **Workflows** (/workflows/*) — Automation builder, run history → operations/workflows
- **Integrations** (/integrations) — Third-party connections → connectors
- **Engineering** (/engineering/*) — Developer workbench, ops pipeline → operations
- **Settings** (/settings/*) — Profile, security, API keys, appearance → identity

---

## 4. UI Architecture

### 4.1 Layout System
- **AppShell** — Header (breadcrumb, venture switcher, search, notifications, profile) + Sidebar (navigation, collapsible, venture-aware) + CommandMenu (Cmd+K)
- **Component Library:** @mcv/ui (492 components), Tailwind CSS 4 + HeroUI + Radix UI
- **Icons:** Lucide React | **Animations:** Framer Motion | **Charts:** Recharts
- **Tables:** TanStack Table v8 | **Forms:** React Hook Form + Zod
- **Editor:** TipTap | **Flow:** @xyflow/react | **DnD:** @dnd-kit

### 4.2 State Architecture (ADR-005)
- **Server State:** TanStack Query via @trpc/react-query
- **Client State:** Zustand (sidebar, venture context, theme)
- **URL State:** nuqs (filters, pagination, search)
- **Form State:** React Hook Form + Zod

---

## 5. Access Control

**Auth Methods:** Email/password, Google OAuth, GitHub OAuth, Magic Link, Passkey/WebAuthn
**MFA Enforcement:** REQUIRED for super_admin and platform_ops roles
**Access Tiers:**
- Tier 0 (super_admin): Full platform — all ventures, all features
- Tier 1 (platform_ops): Platform operations — monitoring, support, flags
- Tier 2 (venture_admin): Redirected to Venture Admin app

---

## 6. Prototype Status

| Metric | Count |
|--------|-------|
| Feature modules | 35 |
| Admin app TS/TSX files | 687 |
| Page routes | 60+ |
| API routes | 75+ |
| tRPC routers | 62 |
| Last commit | Feb 7, 2026 |

---

## Document Control

| Field | Value |
|-------|-------|
| Author | MCV Engineering |
| Created | March 10, 2026 |
| Version | 1.0 |
| Prototype | mcv-one-admin-prototype/apps/admin |
