# Smart Payment Router — Implementation Plan (Plan 2 of 8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Smart Payment Router — a multi-processor abstraction layer with cost-optimized routing that picks the cheapest rail per transaction. Includes Stripe adapter (refactoring existing code), Platform Credits adapter, Solana stub, routing decision engine, and split payment support. Every payment creates journal entries in the Universal Ledger (Plan 1).

**Architecture:** Each payment processor implements a `PaymentProcessor` interface. The `PaymentRouter` scores available processors by cost/speed/reliability and picks the optimal rail. Split payments distribute a single transaction across multiple recipients. All results are recorded in the ledger via journal entries.

**Tech Stack:** TypeScript 5.9 strict, Zod 4.3 (validation), Supabase PG (routing decisions audit, processor config), Vercel Functions (API), Zustand (client state). Stripe REST API (existing pattern — no SDK). Ledger integration via `src/lib/ledger/service.ts`.

**Spec Reference:** `docs/superpowers/specs/2026-04-05-commerce-financial-os-design.md` Section 2

**Depends on:** Plan 1 (Universal Ledger) — completed

---

## Phase 1: Payment Types & Processor Interface

### Task 1: Create Payment Type Definitions

**Files:**
- Create: `src/lib/payments/types.ts`

Defines all payment types, processor interface, routing types, and split payment types. This is the contract that all processors implement.

### Task 2: Create Supabase Migration for Payment Tables

**Files:**
- Create: `supabase/migration-payments.sql`

Tables: `payment_processors`, `processor_credentials`, `payment_intents`, `routing_decisions`, `split_payments`, `split_payment_items`, `venture_payment_configs`.

---

## Phase 2: Processor Adapters

### Task 3: Create Stripe Processor Adapter

**Files:**
- Create: `src/lib/payments/processors/stripe.ts`

Wraps existing Stripe REST API pattern into the `PaymentProcessor` interface. Uses the same `stripeFetch()` pattern from `api/stripe.ts`.

### Task 4: Create Platform Credits Processor

**Files:**
- Create: `src/lib/payments/processors/credits.ts`

Internal processor that deducts from user's credit account via `src/lib/ledger/credit-service.ts`. Zero fees.

### Task 5: Create Solana Pay Processor Stub

**Files:**
- Create: `src/lib/payments/processors/solana.ts`

Stub implementation for Solana USDC/SOL payments. Implements the interface but returns mock results. Will be fully implemented when @solana/web3.js integration is wired.

---

## Phase 3: Routing Engine

### Task 6: Create Payment Router (Decision Engine)

**Files:**
- Create: `src/lib/payments/router.ts`
- Create: `src/lib/payments/__tests__/router.test.ts`

The core brain — scores available processors by weighted factors (cost 35%, speed 20%, reliability 20%, compliance 10%, preference 15%) and returns a routing decision with primary + fallback rails.

### Task 7: Create Split Payment Engine

**Files:**
- Create: `src/lib/payments/split-engine.ts`

Orchestrates splitting a payment across multiple recipients (seller, platform, tax, royalties). Each split can use a different rail. Creates corresponding ledger journal entries.

---

## Phase 4: API + Store + Kit

### Task 8: Create Payments API Endpoint

**Files:**
- Create: `api/payments.ts`

Vercel serverless endpoint with actions: create-payment, estimate-route, create-split-payment, list-payments, get-payment.

### Task 9: Create Payments Zustand Store

**Files:**
- Create: `src/stores/payments.ts`

Client state for processor health, routing decisions, payment history, savings tracking.

### Task 10: Create Payments Kit for Agent Integration

**Files:**
- Create: `src/lib/kits/builtin/payments-kit.ts`
- Modify: `src/lib/kits/loader.ts`

Agent tools: estimate_route, create_payment, list_payments, get_savings_report.

### Task 11: Module Index + Verification

**Files:**
- Create: `src/lib/payments/index.ts`

Barrel exports + full verification (tests, types, lint, build).
