# MCV.ONE SDK Documentation

> **Status**: BLUEPRINT FINALIZATION PHASE (Pre-Reification)  
> Enterprise-grade documentation for the MCV.ONE Agentic Operating System — a multi-venture platform powering 9 businesses across AI, gaming, SEO, real estate, grant management, and more.

---

## 📊 Documentation Stats

| Metric | Value |
|--------|-------|
| **Total MODULE.md files** | 58 |
| **Total documentation** | 4.6 MB / 89,794 lines |
| **Tiers covered** | 0–6 (complete stack) |
| **Core Hardening** | T0–T4: 100% Verified |
| **Domain Status** | T5: Consolidated (Pending Submodule Explosion) |

---

## 🏗️ Architecture & Nesting Standards

MCV.ONE uses an 8-tier architecture spanning from kernel primitives to full applications:

```
┌─────────────────────────────────────────────────────────┐
│  Tier 6: Presentation                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────────────┐ │
│  │   API   │  │  Apps   │  │     UI Components       │ │
│  │ (tRPC)  │  │(Next.js)│  │    (508 components)     │ │
│  └─────────┘  └─────────┘  └─────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  Tier 5: Business Domains (The Mega-Engines)            │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ Nexus  │ │Commerce│ │ Growth │ │Finance │  ...13+   │
│  │ Hub    │ │Catalog │ │ Engine │ │Billing │  domains  │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
├─────────────────────────────────────────────────────────┤
│  Tier 4: Intelligence                                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │Gateway │ │  RAG   │ │Personas│ │Metrics │  11       │
│  │400+ LLM│ │  Deep  │ │ Brand  │ │ Dual   │  modules  │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
├─────────────────────────────────────────────────────────┤
│  Tier 3: Connectors                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ Email  │ │Payments│ │ Voice  │ │ GitHub │  11       │
│  │SendGrid│ │ Stripe │ │ Twilio │ │  API   │  modules  │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
├─────────────────────────────────────────────────────────┤
│  Tier 2.5: Shared Services (Business Logic)             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Workflows │ │Templates │ │Scheduling│ │  Media   │   │
│  │ 80+ node │ │ Render   │ │ Booking  │ │ Storage  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│  Tier 2: Fabric (Infrastructure)                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Audit │ │Cache │ │Flags │ │Queue │ │Events│  9 mod.  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
├─────────────────────────────────────────────────────────┤
│  Tier 1: Identity                                       │
│  ┌──────┐ ┌──────────┐ ┌───────┐ ┌─────┐ ┌─────┐      │
│  │ Auth │ │Permissions│ │Tenants│ │Users│ │ SSO │      │
│  └──────┘ └──────────┘ └───────┘ └─────┘ └─────┘      │
├─────────────────────────────────────────────────────────┤
│  Tier 0: Kernel                                         │
│  ┌────┐ ┌──────┐ ┌──────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
│  │ DB │ │Config│ │Logger│ │Types│ │Utils│ │Errors│    │
│  └────┘ └──────┘ └──────┘ └─────┘ └─────┘ └─────┘     │
└─────────────────────────────────────────────────────────┘
```

Documentation follows a **Level 4 Nesting Strategy** to support discrete package reification:

`tier-{N}-{layer}/{classification}/{domain}/{submodule}/{deep-module}/MODULE.md`

### The Nexus Mega-Engine
The `crm` package has been deprecated and consolidated into **@mcv/nexus**. Nexus is the unified "Customer Relationship & Communication Hub" containing:
*   **Relationship**: CRM (Contacts, Deals, Pipelines, Activities)
*   **Communication**: Contact Center, Conversations, Calls, Forms, Support
*   **Execution**: Documents, Sign, Calendar

---

## ⚠️ Important Notes

*   **Stale Directories**: `tier-5-domains/publishable/crm` is **STALE** and pending deletion. Use `@mcv/nexus` as the source of truth.
*   **Identifier Standard**: All schemas are moving toward a unified `uuid('venture_id')` and `uuid('user_id')` standard.
*   **Submodule Explosion**: Tier 5 documentation is currently consolidated in domain-level `MODULE.md` files. These are being systematically "exploded" into discrete submodule directories to match the Monorepo package structure.

---

## 📁 Directory Structure

```
docs-v2/
├── README.md                    ← You are here
├── 00-ARCHITECTURE.md           ← System-wide architecture
├── 00-INDEX.md                  ← Module index & cross-references
├── 00-ROADMAP.md                ← Development roadmap
├── DOCUMENTATION-SPRINT.md      ← Sprint tracker & progress
├── AGENT-PROMPTS.md             ← Prompt templates for doc agents
│
├── tier-0-kernel/               ← Foundational primitives
│   ├── 01-PACKAGE-SPEC.md
│   ├── config/MODULE.md
│   ├── context/MODULE.md
│   ├── db/MODULE.md
│   ├── errors/MODULE.md
│   ├── logger/MODULE.md
│   ├── types/MODULE.md
│   └── utils/MODULE.md
│
├── tier-1-identity/             ← Authentication & authorization
│   ├── auth/MODULE.md           (47 KB)
│   ├── permissions/MODULE.md    (52 KB)
│   ├── sso/MODULE.md            (103 KB)
│   ├── tenants/MODULE.md        (76 KB)
│   └── users/MODULE.md          (48 KB)
│
├── tier-2-fabric/               ← Infrastructure services
│   ├── audit/MODULE.md          (53 KB)
│   ├── cache/MODULE.md          (32 KB)
│   ├── events/MODULE.md         (25 KB)
│   ├── flags/MODULE.md          (47 KB)
│   ├── notifications/MODULE.md  (52 KB)
│   ├── queue/MODULE.md          (31 KB)
│   ├── realtime/MODULE.md       (40 KB)
│   ├── search/MODULE.md         (37 KB)
│   └── storage/MODULE.md        (58 KB)
│
├── tier-2.5-shared/             ← Cross-cutting shared services
│   ├── calculations/MODULE.md   (137 KB)
│   ├── export/MODULE.md         (120 KB)
│   ├── import/MODULE.md         (113 KB)
│   ├── localization/MODULE.md   (114 KB)
│   ├── media/MODULE.md          (111 KB)
│   ├── scheduling/MODULE.md     (169 KB)
│   ├── templates/MODULE.md      (143 KB)
│   ├── theming/MODULE.md        (132 KB)
│   ├── validation/MODULE.md     (138 KB)
│   ├── versioning/MODULE.md     (107 KB)
│   └── workflows/MODULE.md      (66 KB)
│
├── tier-3-connectors/           ← External service integrations
│   ├── accounting/MODULE.md     (111 KB)
│   ├── email/MODULE.md          (107 KB)
│   ├── github/MODULE.md         (129 KB)
│   ├── google/MODULE.md         (78 KB)
│   ├── oauth/MODULE.md          (121 KB)
│   ├── payments/MODULE.md       (104 KB)
│   ├── payroll/MODULE.md        (130 KB)
│   ├── registrars/MODULE.md     (127 KB)
│   ├── social/MODULE.md         (121 KB)
│   ├── voice/MODULE.md          (87 KB)
│   └── webhooks/MODULE.md       (98 KB)
│
├── tier-4-intelligence/         ← AI/ML capabilities
│   ├── context/MODULE.md        (119 KB)
│   ├── embed/MODULE.md          (39 KB)
│   ├── embedding/MODULE.md      (123 KB)
│   ├── gateway/MODULE.md        (89 KB)
│   ├── knowledge/MODULE.md      (86 KB)
│   ├── memory/MODULE.md         (134 KB)
│   ├── metrics/MODULE.md        (137 KB)
│   ├── ml/MODULE.md             (123 KB)
│   ├── personas/MODULE.md       (131 KB)
│   ├── rag/MODULE.md            (91 KB)
│   └── streaming/MODULE.md      (114 KB)
│
├── tier-5-domains/              ← Business domain modules
│   ├── mcv-only/                ← Internal MCV domains
│   │   ├── agentic-os/          (NAOS, Queen, Scouts, HITL...)
│   │   ├── cdp/                 (Customer Data Platform)
│   │   ├── compliance/          (KYC, AML, Responsible Gaming)
│   │   ├── portfolio/           (Ventures, Grants, Strategy)
│   │   ├── treasury/            (Cash, Funding, P&L, Tax)
│   │   └── web3-core/           (Wallets, Staking, Governance)
│   └── publishable/             ← White-label domains
│       ├── analytics/           (Cohorts, Funnels, Dashboards)
│       ├── commerce/            (Catalog, Cart, Checkout, POS)
│       ├── crm/                 (Contacts, Deals, Pipelines)
│       ├── engagement/          (Points, Quests, Leaderboards)
│       ├── finance/             (Accounting, Billing, Budgeting)
│       ├── growth/              (SEO, Ads, Email, Affiliates)
│       ├── nexus/               (CRM, Contact Center, Calendar)
│       ├── operations/          (Tasks, Projects, Workflows)
│       ├── people/              (HR, Hiring, Learning, Leave)
│       ├── token-economy/       (EDGE Token, Staking, DAO)
│       └── web3-public/         (NFTs, Oracles, Wallet SDK)
│
├── tier-6-presentation/         ← Application layer
│   ├── api/MODULE.md            (101 KB — 61 tRPC routers)
│   ├── apps/MODULE.md           (pending)
│   └── ui/                      (508 component library)
│
├── adrs/                        ← Architecture Decision Records
├── corporate/                   ← Corporate documentation
└── guides/                      ← Developer guides
```

---

## 📖 How to Read These Docs

### MODULE.md Structure

Every `MODULE.md` follows a consistent format:

1. **Purpose** — What the module does and why it exists
2. **Exports** — Complete public API surface
3. **Architecture Diagram** — ASCII system diagram
4. **TypeScript Interfaces** — Full type definitions with JSDoc
5. **Database Schema** — Drizzle ORM + SQL DDL
6. **Code Examples** — 10-15 production-ready examples
7. **Performance** — Latency targets, optimization strategies
8. **Security** — Auth, RLS policies, data protection
9. **Audit Events** — What gets logged
10. **Environment Variables** — Configuration reference
11. **Error Codes** — With HTTP status and resolution
12. **Dependencies** — Internal + external packages

### Quick Start by Role

| Role | Start Here |
|------|-----------|
| **New developer** | `00-ARCHITECTURE.md` → Tier 0 → Tier 1 |
| **Frontend dev** | `tier-6-presentation/` → `tier-2.5-shared/` |
| **Backend dev** | `tier-1-identity/` → `tier-2-fabric/` → `tier-3-connectors/` |
| **AI/ML engineer** | `tier-4-intelligence/gateway/` → `rag/` → `personas/` |
| **Product manager** | `tier-5-domains/` → `00-ROADMAP.md` |
| **DevOps** | `tier-0-kernel/config/` → `tier-2-fabric/` |

---

## 🔗 Key Cross-References

### Dependency Flow (Bottom → Top)

```
Tier 0 (Kernel) → used by everything
  ↓
Tier 1 (Identity) → auth, permissions, tenants
  ↓
Tier 2 (Fabric) → audit, cache, events, storage
  ↓
Tier 2.5 (Shared) → workflows, templates, media
  ↓
Tier 3 (Connectors) → email, payments, voice
  ↓
Tier 4 (Intelligence) → gateway, RAG, personas
  ↓
Tier 5 (Domains) → business logic modules
  ↓
Tier 6 (Presentation) → API, UI, apps
```

### Critical Packages

| Package | Tier | Size | Why It Matters |
|---------|------|------|---------------|
| `@mcv/auth` | 1 | 47KB | Better Auth, MFA, WebAuthn, session management |
| `@mcv/permissions` | 1 | 52KB | 5-tier RBAC+ABAC, resource-action model |
| `@mcv/gateway` | 4 | 89KB | AI routing to 400+ models via OpenRouter |
| `@mcv/rag` | 4 | 91KB | Deep RAG, semantic reranking, NAOS tool |
| `@mcv/api` | 6 | 101KB | 61 tRPC routers, 68 services, full API surface |

---

## 🏢 MCV Ventures

This platform serves 9 ventures:

| Venture | Domain | Key Modules |
|---------|--------|-------------|
| **BetEdge** | Sports Betting AI | engagement, compliance, token-economy |
| **SerpSpace** | SEO Platform | growth, analytics, registrars |
| **Full Gain** | Grant Management | portfolio, finance, operations |
| **MCV Studios** | Gaming | engagement, commerce, web3 |
| **Futurestate** | Real Estate | nexus, commerce, analytics |
| + 4 more | Various | Shared infrastructure |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TanStack Query |
| **UI Components** | HeroUI (508 components), Tailwind CSS |
| **API** | tRPC v11, Zod validation, SuperJSON |
| **Database** | PostgreSQL + Supabase, Drizzle ORM |
| **AI/ML** | OpenRouter (400+ models), pgvector, RAG |
| **Auth** | Better Auth, SAML 2.0, OIDC, SCIM |
| **Blockchain** | Solana, EDGE token economy |
| **Events** | Redpanda/Kafka, WebSocket |
| **Build** | Turborepo monorepo, 27 SDK packages |

---

## 📝 Contributing

When adding or updating documentation:

1. Follow the MODULE.md template structure above
2. Read actual source code — don't guess
3. Include complete TypeScript interfaces (not abbreviated)
4. Provide 10-15 production-ready code examples
5. Document all DB schemas with SQL DDL
6. Target 40KB+ per MODULE.md (80KB+ average)
7. Run quality checks against the gateway MODULE.md reference

---

*Built with 🔥 by Forge — MCV Global Consortium's AI documentation engine*
