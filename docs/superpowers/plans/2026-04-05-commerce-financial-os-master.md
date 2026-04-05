# MCV Commerce & Financial OS — Master Implementation Plan

> **Spec:** `docs/superpowers/specs/2026-04-05-commerce-financial-os-design.md` (SPEC-002 v2.0, 18 sections)
> **Decomposition:** 8 sequential plans, dependency-ordered
> **Each plan:** Independently deployable, produces working software

---

## Tech Stack Matrix

Every component maps to a specific technology and runtime. No ambiguity.

### Infrastructure Layer

| Component | Technology | Version | Runtime | Why |
|-----------|-----------|---------|---------|-----|
| **Database** | Supabase PostgreSQL | 16 | Managed | Existing stack, RLS, realtime subscriptions |
| **Migrations** | Supabase SQL | — | CLI | `supabase/migration-*.sql` pattern established |
| **API Routes** | Vercel Serverless | Node.js 24 | Vercel Functions | Existing `api/*.ts` pattern with `@vercel/node` |
| **Auth** | Clerk | 3.2.4 (backend) | JWT verification | Existing `api/_auth.ts` middleware |
| **Validation** | Zod | 4.3.6 | Isomorphic | Already in deps, schema-first validation |
| **Background Jobs** | Vercel Cron | — | Vercel Functions | For batch settlement, dunning retries, tax filing |
| **Durable Workflows** | Vercel Workflow | 4.2.0-beta | Vercel Functions | Already in deps — for multi-step payment flows |
| **Event Bus** | Supabase Realtime | — | WebSocket | Existing pattern, powers real-time dashboards |
| **Secrets** | Vercel Env + Supabase Vault | — | Encrypted at rest | Processor API keys, webhook secrets |

### Frontend Layer

| Component | Technology | Version | Why |
|-----------|-----------|---------|-----|
| **UI Framework** | React | 19.2.4 | Existing, concurrent features |
| **State** | Zustand | 5.0.12 | Existing pattern, persistence middleware |
| **Server State** | TanStack Query | 5.96.2 | Existing, cache invalidation |
| **Charts** | Recharts | 3.8.1 | Already in deps, financial chart support |
| **Animation** | Framer Motion | 12.38.0 | Existing design system |
| **Type Safety** | TypeScript | 5.9.3 | Strict mode, ES2023 target |
| **CSS** | CSS Variables | — | `design-system.css` token system |

### Per-Component Tech Decisions

| Plan | Component | Backend | Frontend | Key Libraries |
|------|-----------|---------|----------|---------------|
| **1** | Universal Ledger | Supabase PG (triggers, CHECK constraints) | Zustand store | Zod (validation), `decimal.js` (precision math) |
| **2** | Payment Router | Vercel Functions + Workflow | Zustand store | `stripe` SDK, `@solana/web3.js`, Zod |
| **3** | Commerce Models | Supabase PG + Vercel Functions | Zustand + React Query | Zod (product schemas) |
| **4** | Financials Engine | Supabase PG (materialized views) + Vercel Cron | Recharts + Zustand | `decimal.js`, date-fns |
| **5** | Transaction Intelligence + Creator Royalties | Supabase PG + Vercel Functions | React components | Zod, `@solana/web3.js` (Transfer Hooks) |
| **6** | Fraud + Dunning + Tax | Vercel Functions + Cron | React components | GeoIP lookup, Zod |
| **7** | Super Admin UI | — (reads from Plans 1-6) | Full React views | Recharts, Framer Motion, `react-virtuoso` |
| **8** | Platform API + SDK | Vercel Functions (versioned) | — (headless) | Zod (OpenAPI), `crypto` (HMAC signing) |

### Microservice / Worker Decisions

| Action | Approach | Rationale |
|--------|----------|-----------|
| **Payment webhook processing** | Vercel Function (dedicated) | Stripe/processor webhooks need fast, reliable handlers |
| **Batch settlement** | Vercel Cron (daily) | Micropayment credit→fiat settlement |
| **Dunning retries** | Vercel Cron (hourly) | Smart retry at optimal times |
| **Revenue recognition** | Vercel Cron (daily) | Monthly recognition entries |
| **Tax nexus tracking** | Vercel Cron (weekly) | Threshold monitoring |
| **Bank feed sync** | Vercel Cron (daily) | Plaid/Flinks balance import |
| **Financial forecasting** | Vercel Function (on-demand) | Claude API for AI analysis |
| **Fraud scoring** | Vercel Function (inline) | Pre-payment scoring in payment flow |
| **Royalty distribution** | Vercel Workflow (durable) | Multi-step: calculate → split → pay → ledger |
| **Escrow release** | Vercel Workflow (durable) | Multi-step with approval gates |
| **Consolidated reports** | Vercel Function (on-demand) | Compute-heavy, long-running |

### File Structure Convention

```
src/lib/ledger/           # Tier 2 — Universal Ledger
  types.ts                 # Zod schemas + TypeScript types
  service.ts               # Core ledger operations
  credit-service.ts        # Credit account operations
  wallet-sync.ts           # Wallet↔Ledger binding
  chart-of-accounts.ts     # Default CoA template + provisioning

src/lib/payments/          # Tier 3 — Payment Router
  types.ts                 # Processor interface + Zod schemas
  router.ts                # Smart routing decision engine
  processors/              # One file per processor
    stripe.ts
    solana.ts
    credits.ts             # Platform credits (internal)
  split-engine.ts          # Split payment orchestration
  webhook-handler.ts       # Unified webhook processing

src/lib/commerce/          # Tier 5 — Commerce
  types.ts                 # Product, order, subscription types
  product-service.ts       # Product CRUD
  subscription-engine.ts   # Sub lifecycle + overages
  credit-system.ts         # Credit packs (uses ledger credits)
  invoice-engine.ts        # Invoice lifecycle
  loan-engine.ts           # Loan/BNPL lifecycle
  escrow-service.ts        # Escrow agreements
  royalty-engine.ts        # Creator royalty splits

src/lib/finance/           # Tier 5 — Finance
  types.ts                 # Report types, metric types
  statements.ts            # P&L, balance sheet, cash flow generators
  metrics.ts               # Real-time MRR/ARR/churn/burn
  cost-intelligence.ts     # Processing fee analysis + recommendations
  tax-engine.ts            # Multi-jurisdiction tax calculation
  revenue-recognition.ts   # ASC 606 schedules
  forecasting.ts           # AI-powered projections
  consolidation.ts         # Multi-entity rollup

src/stores/
  commerce.ts              # Commerce state (products, orders, subs)
  finance.ts               # Finance state (metrics, reports)
  ledger.ts                # Ledger state (accounts, entries)
  payments.ts              # Payment state (processor health, routing)

src/views/
  Commerce/                # Super Admin commerce views
  Financials/              # Super Admin financial views

src/components/commerce/   # Shared commerce components
src/components/finance/    # Shared finance components

api/
  ledger.ts                # Ledger API endpoint
  payments.ts              # Payment processing endpoint (extends existing)
  commerce.ts              # Commerce API endpoint
  finance.ts               # Finance/reporting API endpoint
  webhooks/
    stripe.ts              # Stripe webhook handler
    solana.ts              # Solana webhook handler
  cron/
    dunning.ts             # Dunning retry cron
    settlement.ts          # Batch settlement cron
    revenue-recognition.ts # Monthly recognition cron
    tax-nexus.ts           # Nexus threshold check cron

supabase/
  migration-ledger.sql     # Ledger tables
  migration-payments.sql   # Payment router tables
  migration-commerce.sql   # Commerce tables
  migration-finance.sql    # Finance tables
```

---

## Plan Dependency Graph

```
Plan 1: Universal Ledger ─────────────────────────────┐
  │                                                     │
  ├──→ Plan 2: Payment Router ──→ Plan 5: Royalties    │
  │      │                         + Escrow + TxIntel   │
  │      │                                              │
  │      ├──→ Plan 3: Commerce Models                   │
  │      │      │                                       │
  │      │      └──→ Plan 6: Fraud + Dunning + Tax     │
  │      │                                              │
  │      └──→ Plan 4: Financials Engine ────────────────┘
  │             │
  │             └──→ Plan 7: Super Admin UI
  │
  └──────────────────→ Plan 8: Platform API + SDK
```

**Critical path:** Plan 1 → Plan 2 → Plan 3 → Plan 7
**Parallel after Plan 2:** Plans 3, 4, 5 can run simultaneously
**Final:** Plans 7 and 8 after all others complete

---

## Plan Summaries

### Plan 1: Universal Ledger (THIS PLAN — see separate doc)
**Scope:** Supabase migration, TypeScript service layer, Zod schemas, credit system, wallet binding, chart of accounts provisioning, testing infrastructure bootstrap
**Output:** Working ledger with balanced journal entries, credit accounts, wallet sync
**Estimated tasks:** 12

### Plan 2: Smart Payment Router
**Scope:** Processor interface, Stripe adapter (refactor existing), Solana adapter, credits adapter, routing decision engine, split payments, webhook handling
**Depends on:** Plan 1 (every payment creates ledger entries)
**Output:** Multi-processor payments with cost-optimized routing

### Plan 3: Commerce Models
**Scope:** Product entity (17 types), subscription engine + overages, credit packs, invoice engine, loan/BNPL, gifting/transfers
**Depends on:** Plan 1 (ledger entries), Plan 2 (payment collection)
**Output:** Full product catalog and commerce operations

### Plan 4: Financials Engine
**Scope:** P&L/balance sheet/cash flow generators, real-time metrics, cost intelligence, revenue recognition, forecasting, consolidation
**Depends on:** Plan 1 (reads from ledger), Plan 2 (processing fee data)
**Output:** Complete financial reporting replacing QB/Xero

### Plan 5: Royalties, Escrow, Transaction Intelligence
**Scope:** Creator royalty engine, escrow service, transaction records (receipts are dead), revenue sharing/affiliate programs
**Depends on:** Plan 2 (split payments), Plan 1 (ledger)
**Output:** Creator economy + social commerce primitives

### Plan 6: Fraud Detection, Dunning, Tax Engine
**Scope:** Risk scoring, velocity checks, dunning workflow, multi-jurisdiction tax calculation, nexus tracking, price localization
**Depends on:** Plan 2 (pre-payment hook), Plan 3 (product tax categories)
**Output:** Safety and compliance infrastructure

### Plan 7: Super Admin UI
**Scope:** Commerce + Financials NavRail sections, all dashboard views, payment rails config, cost intelligence dashboard, financial statements views
**Depends on:** Plans 1-6 (data sources)
**Output:** Full Super Admin interface in MCV Desktop

### Plan 8: Platform API & SDK
**Scope:** Versioned REST API (/v1/*), webhook delivery system, @mcv/commerce-sdk npm package, rate limiting, API key management
**Depends on:** Plans 1-6 (underlying services)
**Output:** External-facing commerce platform API

---

## Testing Strategy

**Bootstrap in Plan 1** — no test infra exists today.

| Layer | Tool | Pattern |
|-------|------|---------|
| **Unit tests** | Vitest | Service functions, calculations, validators |
| **Integration tests** | Vitest + Supabase local | Database operations, ledger balance invariants |
| **API tests** | Vitest + supertest | Serverless function request/response |
| **E2E tests** | Playwright (later) | Super Admin UI flows |

**Test file convention:** `src/lib/<module>/__tests__/<file>.test.ts`

---

## New Dependencies to Install

| Package | Version | Why |
|---------|---------|-----|
| `vitest` | latest | Test runner (Vite-native) |
| `decimal.js` | latest | Precision-safe money arithmetic (no floating point) |
| `stripe` | latest | Stripe SDK (replacing raw fetch in api/stripe.ts) |
| `@solana/web3.js` | latest | Solana transaction building |
| `@solana/spl-token` | latest | SPL token operations |
| `date-fns` | latest | Date arithmetic for billing cycles, fiscal periods |
| `nanoid` | latest | Short ID generation (transaction numbers, invoice numbers) |
| `jose` | latest | JWT/HMAC for webhook signing and API key validation |
