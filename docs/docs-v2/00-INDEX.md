# MCV.ONE SDK Documentation
## Agentic Operating System — Complete Technical Reference

**Version:** 3.2  
**Last Updated:** February 9, 2026  
**Status:** CANONICAL SOURCE OF TRUTH

---

## Quick Navigation

| Tier | Package | Classification | Description |
|------|---------|----------------|-------------|
| 0 | [@mcv/kernel](./tier-0-kernel/01-PACKAGE-SPEC.md) | INTERNAL | Database, config, logging, utilities, types |
| 1 | [@mcv/identity](./tier-1-identity/01-PACKAGE-SPEC.md) | INTERNAL | Authentication, permissions, tenants, users, SSO |
| 2 | [@mcv/fabric](./tier-2-fabric/01-PACKAGE-SPEC.md) | INTERNAL | Audit, storage, realtime, notifications, queues |
| 2.5 | [@mcv/shared](./tier-2.5-shared/01-PACKAGE-SPEC.md) | INTERNAL | Templates, workflows, validation, localization |
| 3 | [@mcv/connectors](./tier-3-connectors/01-PACKAGE-SPEC.md) | PUBLISHABLE | Email, voice, payments, OAuth, integrations |
| 4 | [@mcv/intelligence](./tier-4-intelligence/01-PACKAGE-SPEC.md) | MCV-ONLY | LLM gateway, RAG, ML, embeddings, personas |
| 5 | [Business Domains](./tier-5-domains/README.md) | Mixed | 18 domain packages (see below) |
| 6 | [@mcv/ui](./tier-6-presentation/ui/01-PACKAGE-SPEC.md) | PUBLISHABLE | 508 components, design system |
| 6 | [@mcv/api](./tier-6-presentation/api/01-PACKAGE-SPEC.md) | INTERNAL | tRPC gateway, API routes |

---

## Tier 5: Business Domains

### MCV-ONLY Packages (6)

| Package | Description | Key Modules |
|---------|-------------|-------------|
| [@mcv/agentic-os](./tier-5-domains/mcv-only/agentic-os/01-PACKAGE-SPEC.md) | NAOS agent orchestration | Queen, Swarm, HITL, Scouts |
| [@mcv/cdp](./tier-5-domains/mcv-only/cdp/01-PACKAGE-SPEC.md) | Customer Data Platform | Profiles, Segments, Identity Graph |
| [@mcv/portfolio](./tier-5-domains/mcv-only/portfolio/01-PACKAGE-SPEC.md) | Holding company management | Ventures, Strategy, Grants |
| [@mcv/treasury](./tier-5-domains/mcv-only/treasury/01-PACKAGE-SPEC.md) | Financial operations | P&L, Cash, Tax, Funding |
| [@mcv/compliance](./tier-5-domains/mcv-only/compliance/01-PACKAGE-SPEC.md) | Regulatory compliance | KYC, AML, Jurisdictions |
| [@mcv/web3-core](./tier-5-domains/mcv-only/web3-core/01-PACKAGE-SPEC.md) | EDGE token economy | Staking, Governance, DeFi, Contracts |

### PUBLISHABLE Packages (12)

| Package | Description | Key Modules |
|---------|-------------|-------------|
| Package | Description | Key Modules |
|---------|-------------|-------------|
| [@mcv/nexus](./tier-5-domains/publishable/nexus/01-PACKAGE-SPEC.md) | Relationship & Communication Hub | CRM, Contact Center, Conversations, Calls, Forms, Support, Documents, Sign, Calendar |
| [@mcv/engagement](./tier-5-domains/publishable/engagement/01-PACKAGE-SPEC.md) | Gamification engine | Points, Quests, Achievements, X-to-Earn |
| [@mcv/growth](./tier-5-domains/publishable/growth/01-PACKAGE-SPEC.md) | Marketing automation | Campaigns, Content, SEO, Affiliates |
| [@mcv/commerce](./tier-5-domains/publishable/commerce/01-PACKAGE-SPEC.md) | E-commerce platform | Catalog, Orders, POS, Subscriptions |
| [@mcv/operations](./tier-5-domains/publishable/operations/01-PACKAGE-SPEC.md) | Business operations | Tasks, Workflows, Calendar, Editor |
| [@mcv/finance](./tier-5-domains/publishable/finance/01-PACKAGE-SPEC.md) | Financial management | Accounting, Expenses, Budgeting |
| [@mcv/people](./tier-5-domains/publishable/people/01-PACKAGE-SPEC.md) | HR & workforce | Directory, Hiring, Performance, Learning |
| [@mcv/analytics](./tier-5-domains/publishable/analytics/01-PACKAGE-SPEC.md) | Business intelligence | Dashboards, Reports, Funnels, Cohorts |
| [@mcv/web3-public](./tier-5-domains/publishable/web3-public/01-PACKAGE-SPEC.md) | Public blockchain | NFTs, Attestation Layer, Oracles |
| [@mcv/token-economy](./tier-5-domains/publishable/token-economy/01-PACKAGE-SPEC.md) | Token mechanics | Rewards, ACS Controllers, Launchpad |

---

## Architecture Decisions

- [ADR-001: Enterprise Architecture Decisions](./adrs/ADR-001-enterprise-decisions.md)

---

## Documentation Standards

### Core File Set (Per Major Engine)
Every Tier 5 package MUST contain the following 4 files in its root:

| Document | Purpose |
|----------|---------|
| `01-PACKAGE-SPEC.md` | Vision, scope, business context, and high-level module map. |
| `02-TECHNICAL-ARCHITECTURE.md` | System design, data flow, dependencies, and event bus integrations. |
| `03-API-REFERENCE.md` | Consolidated tRPC routes, Zod schemas, and core TypeScript interfaces. |
| `04-IMPLEMENTATION-PLAN.md` | Phased roadmap, milestones, and task breakdown for reification. |

### Per Module (Discrete Sub-Package)
Every submodule (e.g., `nexus/crm`) MUST have its own `MODULE.md`:

| Document | Purpose |
|----------|---------|
| `MODULE.md` | Deep-dive technical spec: schemas, services, 10+ code examples, and performance targets. |

---

## Related Resources

- **Codebase:** `C:\Users\moust\Documents\GitHub\mcv-one-admin-prototype`
- **Architecture Doc:** [PACKAGE-ARCHITECTURE-v3.2.md](../../Documents/GitHub/mcv-one-admin-prototype/docs/PACKAGE-ARCHITECTURE-v3.md)
- **Corporate Structure:** [./corporate/](./corporate/)
- **Development Guides:** [./guides/](./guides/)

---

## Package Statistics

| Classification | Count | npm Scope |
|----------------|-------|-----------|
| KERNEL | 1 | `@mcv/kernel` |
| INTERNAL | 5 | `@mcv/*` (private) |
| MCV-ONLY | 7 | `@mcv/*` (private) |
| PUBLISHABLE | 12 | `@mcv/*` (public/private npm) |
| **TOTAL** | **25** | |

---

## Ventures Using This SDK

| Venture | Domain | Primary Packages |
|---------|--------|------------------|
| BetEdge AI | betedge.app | engagement, analytics, web3-public, compliance |
| EdgeIQ Markets | edgeiq.app | analytics, compliance, web3-core |
| MCV Studios | mcv.gg | engagement, web3-public, commerce |
| Futurestate | futurestate.io | web3-public, analytics |
| Full Gain | fullgain.ca | growth, nexus, operations |
| MCV Tech | mcv.tech | operations, nexus |
| SerpSpace | serpspace.com | growth, analytics |
| ARQ Labs | arqlabs.ca | intelligence, agentic-os |

---

*MCV Global Consortium — SDK Documentation v3.2*
