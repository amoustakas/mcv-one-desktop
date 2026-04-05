# Release 1.0 — Foundation & Core Platform

**Release ID:** R-1.0
**Codename:** Genesis
**Target:** M0 (Blueprint) → M1 (Foundation) → M2 (Intelligence)
**Timeline:** February 15, 2026 — April 15, 2026 (8 weeks active development)
**Status:** PLANNING
**Last Updated:** March 10, 2026

---

## Release Goals

1. Scaffold the MCV One monorepo with full Turborepo + pnpm workspace configuration
2. Implement the kernel (T0), identity (T1), and fabric (T2) tiers as production-ready packages
3. Deploy multi-tenant database with RLS isolation for all 9 ventures
4. Integrate Better Auth with RBAC + venture-scoped permissions
5. Stand up the NAOS agent runtime with Queen orchestrator and initial Ralph pods
6. Launch the Super Admin dashboard (T6) with core platform management features
7. Begin BetEdge venture migration (coexistence phase)

---

## Epic Registry

| # | Epic | Tier | Sprints | Est. Tasks | Priority | Dependencies |
|---|------|------|---------|------------|----------|--------------|
| E-001 | Monorepo Scaffold & DevOps | T0 | S1 | 18 | P0 | None |
| E-002 | Kernel Package (@mcv/kernel) | T0 | S1 | 14 | P0 | E-001 |
| E-003 | Database & Multi-Tenancy | T0/T1 | S1-S2 | 22 | P0 | E-001 |
| E-004 | Identity & Auth (@mcv/auth) | T1 | S2 | 20 | P0 | E-002, E-003 |
| E-005 | Fabric Layer (@mcv/fabric) | T2 | S2-S3 | 16 | P1 | E-002 |
| E-006 | AI Gateway (@mcv/gateway) | T4 | S3 | 12 | P1 | E-002, E-005 |
| E-007 | NAOS Agent Runtime | T5 | S3-S4 | 24 | P1 | E-005, E-006 |
| E-008 | UI Design System (@mcv/ui) | T6 | S2-S3 | 16 | P1 | E-001 |
| E-009 | Super Admin Shell | T6 | S3-S4 | 20 | P1 | E-004, E-008 |
| E-010 | CRM Foundation (@mcv/crm) | T5 | S4 | 18 | P2 | E-003, E-004 |
| E-011 | BetEdge Coexistence Setup | Venture | S3-S4 | 14 | P2 | E-003, E-004 |
| E-012 | CI/CD Pipeline & Testing | Cross | S1-S4 | 12 | P0 | E-001 |
| **Total** | | | **4 sprints** | **206 tasks** | | |

---

## Sprint Schedule

| Sprint | Name | Dates | Capacity | Focus |
|--------|------|-------|----------|-------|
| S1 | The Fresh Start | Weeks 1-2 | 80 pts | Monorepo, Kernel, Database |
| S2 | Identity & Fabric | Weeks 3-4 | 80 pts | Auth, Events, Storage, UI |
| S3 | Intelligence Layer | Weeks 5-6 | 80 pts | AI Gateway, NAOS, Admin Shell |
| S4 | Integration & Polish | Weeks 7-8 | 80 pts | CRM, BetEdge, E2E Testing |

---

## E-001: Monorepo Scaffold & DevOps

**Description:** Initialize the mcv-one monorepo with Turborepo, pnpm workspaces, TypeScript configuration, linting, and the base directory structure for all tiers.

**Acceptance Criteria:**
- [ ] Turborepo v2.x configured with task pipeline (build, lint, typecheck, test, dev)
- [ ] pnpm v9.x workspace with `apps/*` and `packages/*` scopes
- [ ] TypeScript 5.x with shared tsconfig base and per-package overrides
- [ ] ESLint + Prettier with shared config
- [ ] Husky pre-commit hooks (lint-staged)
- [ ] All tier directories created with placeholder package.json
- [ ] `pnpm dev` starts development servers for all apps
- [ ] README with setup instructions

**Sprint:** S1
**Estimated Tasks:** 18

### Features

| Feature | Tasks | Description |
|---------|-------|-------------|
| F-001.1 Turborepo Init | 4 | Initialize turbo.json, configure task pipeline, set up remote caching |
| F-001.2 Workspace Config | 3 | pnpm-workspace.yaml, shared tsconfig, package scope conventions |
| F-001.3 Linting & Formatting | 3 | ESLint flat config, Prettier, lint-staged, Husky hooks |
| F-001.4 Package Scaffolding | 4 | Create all tier directories (T0-T6) with package.json stubs |
| F-001.5 Dev Scripts | 2 | Root-level scripts (dev, build, lint, test, db:push, db:migrate) |
| F-001.6 Environment Config | 2 | .env.example, env validation with Zod, dotenv-cli setup |

---

## E-002: Kernel Package (@mcv/kernel)

**Description:** Implement the T0 kernel package that provides configuration management, structured logging, type definitions, and error handling used by every other package.

**Acceptance Criteria:**
- [ ] `@mcv/kernel/config` — Type-safe config loading with Zod validation
- [ ] `@mcv/kernel/logger` — Structured JSON logger (pino) with venture context
- [ ] `@mcv/kernel/types` — Core TypeScript types (VentureId, UserId, Result<T>, etc.)
- [ ] `@mcv/kernel/errors` — Error hierarchy (AppError → NotFoundError, AuthError, ValidationError, etc.)
- [ ] `@mcv/kernel/context` — Venture context container (getCurrentVentureId, withVentureContext)
- [ ] 90%+ test coverage (per Testing Strategy)
- [ ] Published to internal registry and consumable by other packages

**Sprint:** S1
**Estimated Tasks:** 14

### Features

| Feature | Tasks | Description |
|---------|-------|-------------|
| F-002.1 Config Module | 3 | Zod-validated env config, venture-specific overrides, secrets resolution |
| F-002.2 Logger Module | 3 | Pino logger with request ID, venture ID, structured JSON output |
| F-002.3 Type Definitions | 3 | Core types, branded types (VentureId, UserId), Result/Option monads |
| F-002.4 Error System | 3 | Error class hierarchy, error codes enum, error serialization |
| F-002.5 Context Module | 2 | AsyncLocalStorage-based venture context, middleware helpers |

---

## E-003: Database & Multi-Tenancy

**Description:** Set up Supabase PostgreSQL with Drizzle ORM, implement Row-Level Security multi-tenancy (per ADR-006), create the core schema, and establish migration workflows (per ADR-010).

**Acceptance Criteria:**
- [ ] `@mcv/db` package with Drizzle ORM configured for Supabase
- [ ] Connection pooling via PgBouncer (port 6543 pooled, port 5432 direct)
- [ ] Venture registry table (`ventures`) seeded with all 9 ventures
- [ ] RLS policies on all tenant-scoped tables
- [ ] `SET LOCAL app.current_venture_id` middleware integration
- [ ] Drizzle Kit migration pipeline (push for dev, migrate for staging/prod)
- [ ] Composite indexes on `(venture_id, <filter>)` for all major tables
- [ ] Migration review workflow documented

**Sprint:** S1-S2
**Estimated Tasks:** 22

### Features

| Feature | Tasks | Description |
|---------|-------|-------------|
| F-003.1 Drizzle Setup | 3 | drizzle.config.ts, connection pool config, Supabase integration |
| F-003.2 Core Schema | 5 | ventures, users, venture_memberships, roles, permissions, system_config |
| F-003.3 RLS Implementation | 4 | CREATE POLICY for all tables, session variable middleware, isolation tests |
| F-003.4 Migration Pipeline | 3 | db:push (dev), db:generate, db:migrate:prod, rollback procedures |
| F-003.5 Seed Data | 3 | 9 ventures, default roles, system config, test fixtures |
| F-003.6 Query Helpers | 4 | Venture-scoped query builder, pagination helpers, soft delete, audit columns |

---

## E-004: Identity & Auth (@mcv/auth)

**Description:** Implement Better Auth with email/password, OAuth (Google, GitHub), magic link, MFA, and the RBAC + ABAC authorization model with venture-scoped permissions.

**Acceptance Criteria:**
- [ ] Better Auth configured with PostgreSQL adapter (Drizzle)
- [ ] Sign up, sign in, sign out, password reset flows
- [ ] OAuth providers: Google, GitHub (extensible to Apple, Discord)
- [ ] Magic link authentication
- [ ] TOTP MFA (required for super_admin, optional for others)
- [ ] JWT sessions (15 min access, 30 day refresh)
- [ ] RBAC: super_admin, platform_ops, venture_admin, venture_user, guest
- [ ] ABAC: venture membership check on every request
- [ ] tRPC middleware for auth context propagation

**Sprint:** S2
**Estimated Tasks:** 20

### Features

| Feature | Tasks | Description |
|---------|-------|-------------|
| F-004.1 Better Auth Setup | 3 | Server config, Drizzle adapter, session strategy (JWT) |
| F-004.2 Auth Flows | 4 | Email/password, OAuth (Google, GitHub), magic link, password reset |
| F-004.3 MFA | 3 | TOTP setup, verification, recovery codes, enforcement rules |
| F-004.4 RBAC Implementation | 4 | Role definitions, permission matrix, role assignment, role inheritance |
| F-004.5 Venture Authorization | 3 | Venture membership check, venture switching, cross-venture admin access |
| F-004.6 tRPC Auth Middleware | 3 | Session extraction, auth context, permission guards, rate limiting |

---

## E-005: Fabric Layer (@mcv/fabric)

**Description:** Implement the T2 infrastructure services: event bus (Redpanda per ADR-004), file storage (Supabase Storage), real-time subscriptions, and audit logging.

**Acceptance Criteria:**
- [ ] `@mcv/events` — Redpanda producer/consumer with typed event envelopes
- [ ] `@mcv/storage` — Supabase Storage wrapper with venture-scoped buckets
- [ ] `@mcv/realtime` — Supabase Realtime subscriptions for live updates
- [ ] `@mcv/audit` — Audit log system (who did what, when, to which resource)
- [ ] Standard event envelope: `MCVEvent<T>` with correlationId, ventureId, timestamp
- [ ] Dead-letter queue for failed event processing

**Sprint:** S2-S3
**Estimated Tasks:** 16

### Features

| Feature | Tasks | Description |
|---------|-------|-------------|
| F-005.1 Event Bus | 5 | Redpanda client, typed producers/consumers, event envelope, DLQ, retry policy |
| F-005.2 File Storage | 3 | Supabase Storage wrapper, venture buckets, signed URLs, size limits |
| F-005.3 Real-time | 3 | Supabase Realtime channels, venture-scoped subscriptions, presence |
| F-005.4 Audit System | 3 | Audit log table, auto-capture middleware, query/filter API |
| F-005.5 Queue & Scheduling | 2 | Background job queue (Upstash QStash or pg-boss), cron scheduling |

---

## E-006: AI Gateway (@mcv/gateway)

**Description:** Implement the OpenRouter-based LLM gateway (per ADR-007) with model routing, fallback chains, per-venture cost tracking, and response caching.

**Acceptance Criteria:**
- [ ] OpenRouter API integration with key management
- [ ] Default model chain: Claude Sonnet → GPT-4o → DeepSeek
- [ ] Cost-optimized chain: DeepSeek → Claude Haiku → GPT-4o-mini
- [ ] Per-venture configuration (model preferences, budgets, custom system prompts)
- [ ] Automatic failover on provider errors (with exponential backoff)
- [ ] Cost tracking per request (stored in database, queryable by venture)
- [ ] Semantic response caching (Upstash Redis)
- [ ] Rate limiting per venture

**Sprint:** S3
**Estimated Tasks:** 12

### Features

| Feature | Tasks | Description |
|---------|-------|-------------|
| F-006.1 OpenRouter Client | 3 | API client, authentication, streaming support, error handling |
| F-006.2 Model Routing | 3 | Fallback chains, per-venture config, model tier selection |
| F-006.3 Cost Management | 3 | Per-request tracking, venture budgets, alerts, monthly rollups |
| F-006.4 Caching & Rate Limits | 3 | Semantic dedup (Redis), per-venture rate limits, quota enforcement |

---

## E-007: NAOS Agent Runtime

**Description:** Implement the Natural Agent Operating System runtime that manages agent lifecycle, the Queen orchestrator, and initial Ralph execution pods (Smith, Scribe, Oracle).

**Acceptance Criteria:**
- [ ] NAOS process manager: spawn, suspend, resume, terminate agents
- [ ] Queen orchestrator: task decomposition, risk assessment, dispatch
- [ ] Ralph Smith pod: code generation, review, testing instruments
- [ ] Ralph Scribe pod: content writing, editing instruments
- [ ] Ralph Oracle pod: data query, insight generation instruments
- [ ] Capability-based access control (read, write, execute, delegate, etc.)
- [ ] Cost budget enforcement per request
- [ ] Trajectory logging for every execution
- [ ] HITL checkpoint system (approve/reject before risky actions)

**Sprint:** S3-S4
**Estimated Tasks:** 24

### Features

| Feature | Tasks | Description |
|---------|-------|-------------|
| F-007.1 NAOS Kernel | 4 | Process manager, scheduler, resource governor, capability enforcement |
| F-007.2 Queen Orchestrator | 5 | Task decomposition, DAG builder, risk assessment, dispatch, aggregation |
| F-007.3 Ralph Smith Pod | 4 | Code instruments (edit, review, test, deploy), system prompt, tool registry |
| F-007.4 Ralph Scribe Pod | 3 | Content instruments (write, edit, translate, summarize), system prompt |
| F-007.5 Ralph Oracle Pod | 3 | Data instruments (query, visualize, insight), system prompt |
| F-007.6 HITL System | 3 | Approval queue, notification triggers, timeout handling, audit trail |
| F-007.7 Trajectory Logging | 2 | Execution recording, exemplar flagging, performance metrics |

---

## E-008: UI Design System (@mcv/ui)

**Description:** Build the shared component library based on shadcn/ui + Tailwind CSS with venture-aware theming, used by all T6 presentation apps.

**Acceptance Criteria:**
- [ ] shadcn/ui components adapted with MCV design tokens
- [ ] Tailwind CSS theme config with venture color overrides
- [ ] Core components: Button, Input, Select, Dialog, Table, Card, Badge, Avatar
- [ ] Layout components: AppShell, Sidebar, TopBar, Breadcrumbs, PageHeader
- [ ] Data components: DataTable (with sorting, filtering, pagination), Charts (Recharts)
- [ ] Form components: FormField, FormSelect, FormDatePicker (React Hook Form integration)
- [ ] Storybook documentation for all components
- [ ] Dark mode support

**Sprint:** S2-S3
**Estimated Tasks:** 16

### Features

| Feature | Tasks | Description |
|---------|-------|-------------|
| F-008.1 Design Tokens | 2 | Color palette, typography, spacing, shadows, breakpoints, venture overrides |
| F-008.2 Core Components | 4 | Button, Input, Select, Dialog, Table, Card, Badge, Avatar, Tooltip |
| F-008.3 Layout Components | 3 | AppShell, Sidebar, TopBar, Breadcrumbs, PageHeader, EmptyState |
| F-008.4 Data Components | 4 | DataTable (TanStack Table), Charts (Recharts), KPI cards, Sparklines |
| F-008.5 Form Components | 2 | FormField, FormSelect, FormDatePicker, FormTextarea (React Hook Form) |
| F-008.6 Storybook | 1 | Storybook setup, stories for all components, design system docs |

---

## E-009: Super Admin Shell

**Description:** Build the Super Admin web application shell — the primary management interface for platform operators. Implements routing, navigation, auth guards, and core management pages.

**Acceptance Criteria:**
- [ ] Next.js 15 app with App Router in `apps/super-admin/`
- [ ] tRPC client configured with auth context
- [ ] AppShell layout with sidebar navigation (all 35 module slots)
- [ ] Auth guards: super_admin and platform_ops roles only
- [ ] Dashboard home page with platform KPIs
- [ ] Venture management: list, create, configure ventures
- [ ] User management: list, invite, role assignment
- [ ] Settings page: platform configuration
- [ ] Error boundaries and loading states

**Sprint:** S3-S4
**Estimated Tasks:** 20

### Features

| Feature | Tasks | Description |
|---------|-------|-------------|
| F-009.1 App Scaffold | 3 | Next.js 15 init, tRPC client, auth provider, layout structure |
| F-009.2 Navigation & Routing | 3 | Sidebar with 6 feature groups, breadcrumbs, route guards |
| F-009.3 Dashboard Home | 3 | Platform KPIs (users, ventures, revenue, AI usage), activity feed |
| F-009.4 Venture Management | 4 | Venture list, create wizard, settings panel, feature toggles |
| F-009.5 User Management | 4 | User list, invite flow, role assignment, venture membership |
| F-009.6 Platform Settings | 3 | System config, AI settings, event bus health, database stats |

---

## E-010: CRM Foundation (@mcv/crm)

**Description:** Implement the core CRM module — contacts, companies, and deals — that every venture consumes for customer management.

**Acceptance Criteria:**
- [ ] Contacts: CRUD with custom fields, tags, segments
- [ ] Companies: CRUD with contact associations
- [ ] Deals: pipeline stages, values, probability, close dates
- [ ] Activity log: per-contact timeline (emails, notes, calls, events)
- [ ] Search: full-text search across contacts and companies
- [ ] Import/Export: CSV import with field mapping, CSV export
- [ ] All queries venture-scoped via RLS

**Sprint:** S4
**Estimated Tasks:** 18

### Features

| Feature | Tasks | Description |
|---------|-------|-------------|
| F-010.1 Contact Management | 4 | Schema, CRUD router, search, custom fields, tags |
| F-010.2 Company Management | 3 | Schema, CRUD router, contact associations |
| F-010.3 Deal Pipeline | 4 | Schema, pipeline stages, CRUD, probability, forecasting |
| F-010.4 Activity Timeline | 3 | Activity types, per-contact log, filters, auto-capture |
| F-010.5 Import/Export | 2 | CSV import with field mapping, CSV export, bulk operations |
| F-010.6 CRM UI Pages | 2 | Contact list/detail, company list/detail, deal pipeline board |

---

## E-011: BetEdge Coexistence Setup

**Description:** Configure BetEdge as the first live venture on MCV One, establish coexistence with the existing prototype, and begin the migration bridge.

**Acceptance Criteria:**
- [ ] BetEdge venture record created with full configuration (per VENTURE-SPEC.md §8.1)
- [ ] Better Auth sessions accepted by both MCV One and BetEdge prototype
- [ ] Event bridge: BetEdge prototype publishes to Redpanda topics
- [ ] BetEdge-specific Drizzle tables created (Category B from VENTURE-SPEC.md §4.1)
- [ ] DNS routing: betedge.app serves MCV One (staging), prototype (production)
- [ ] Venture Admin dashboard accessible for BetEdge team

**Sprint:** S3-S4
**Estimated Tasks:** 14

### Features

| Feature | Tasks | Description |
|---------|-------|-------------|
| F-011.1 Venture Configuration | 3 | Seed venture record, branding, feature flags, AI config |
| F-011.2 Auth Bridge | 3 | Shared JWT between MCV One and prototype, session migration |
| F-011.3 Event Bridge | 3 | Redpanda topics for BetEdge, prototype publisher adapter |
| F-011.4 BetEdge Schema | 3 | Category B tables (odds, predictions, picks, sports data) |
| F-011.5 DNS & Routing | 2 | Cloudflare zone config, staging vs production routing |

---

## E-012: CI/CD Pipeline & Testing

**Description:** Implement the GitHub Actions CI/CD pipeline (per CICD-PIPELINE.md) and testing infrastructure (per TESTING-STRATEGY.md) that runs continuously across all sprints.

**Acceptance Criteria:**
- [ ] CI workflow: lint, typecheck, test, build on every PR
- [ ] Turborepo remote caching in CI (60-80% hit rate target)
- [ ] CD workflows: auto-deploy dev, manual staging, manual production
- [ ] Vitest configured for all packages with coverage thresholds
- [ ] Playwright E2E test framework for Super Admin
- [ ] Database integration tests with isolated test schemas
- [ ] Multi-tenancy isolation tests (verify venture A can't access venture B)
- [ ] Migration review enforced via CODEOWNERS

**Sprint:** S1-S4 (continuous)
**Estimated Tasks:** 12

### Features

| Feature | Tasks | Description |
|---------|-------|-------------|
| F-012.1 CI Workflow | 3 | GitHub Actions ci.yml, Turborepo caching, matrix builds |
| F-012.2 CD Workflows | 3 | Dev auto-deploy, staging manual, production with approval |
| F-012.3 Unit Testing | 2 | Vitest config per package, coverage thresholds, mocking patterns |
| F-012.4 Integration Testing | 2 | Test database, RLS isolation tests, tRPC router tests |
| F-012.5 E2E Testing | 2 | Playwright setup, critical flow tests, screenshot regression |

---

## Dependency Graph

```
E-001 (Monorepo) ──┬──→ E-002 (Kernel) ──┬──→ E-005 (Fabric) ──→ E-006 (AI Gateway)
                    │                      │                              │
                    │                      ├──→ E-004 (Auth) ──┐         │
                    │                      │                    │         │
                    ├──→ E-003 (Database) ─┤                    ├──→ E-009 (Admin Shell)
                    │                      │                    │         │
                    ├──→ E-008 (UI) ───────┤                    │         │
                    │                      │                    │         │
                    └──→ E-012 (CI/CD) ────┘                    ├──→ E-010 (CRM)
                                                                │
                                                                └──→ E-011 (BetEdge)
                                                                
                                           E-005 + E-006 ──→ E-007 (NAOS)
```

**Critical Path:** E-001 → E-002 → E-003 → E-004 → E-009 (Super Admin MVP)

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| Supabase RLS performance with 9 ventures | High | Low | Composite indexes, benchmark at 10x expected load |
| Better Auth edge cases (OAuth, MFA) | Medium | Medium | Extensive integration tests, fallback to email/password |
| Redpanda operational complexity | Medium | Medium | Start with Upstash Kafka (managed), self-host later |
| Turborepo cache invalidation bugs | Low | Medium | Full rebuild fallback, CI verifies uncached builds weekly |
| BetEdge prototype coexistence conflicts | Medium | Medium | Feature flags, gradual DNS cutover, 48h monitoring window |
| NAOS agent cost overruns | High | Low | Hard budget caps, per-request cost tracking, alerts at 80% |

---

## Success Criteria for Release 1.0

| Criteria | Measurement | Target |
|----------|-------------|--------|
| All 12 epics completed | Feature completion rate | 100% |
| Test coverage | Vitest + Playwright | T0: 90%, T1: 85%, T2: 80% |
| CI pipeline reliability | Green build rate | > 95% |
| Multi-tenancy isolation | Automated isolation tests | 100% pass |
| Super Admin functional | Core pages working | Dashboard + Ventures + Users |
| BetEdge venture configured | Coexistence established | Auth bridge + event bridge working |
| NAOS agents operational | Queen + 3 Ralph pods | Successfully execute test tasks |
| Documentation | All specs match implementation | Architecture → Code alignment verified |
