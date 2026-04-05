# Commerce Models — Implementation Plan (Plan 3 of 8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the commerce domain layer — universal product entity (17 types), subscription engine with overages, invoice engine, loan/BNPL, gifting/transfers. Every commerce operation creates ledger entries and can be paid through the payment router.

**Architecture:** A product service layer (`src/lib/commerce/`) with Zod-validated types, Supabase storage, and integration with the ledger and payment router. Products are polymorphic — one table with type-specific JSON config columns.

**Tech Stack:** TypeScript 5.9, Zod 4.3, Supabase PG, Vercel Functions, Zustand, Vitest.

**Depends on:** Plan 1 (Ledger), Plan 2 (Payment Router) — both completed.

---

## Tasks

### Task 1: Commerce Type Definitions
Create `src/lib/commerce/types.ts` — all 17 ProductTypes, Product interface, SubscriptionPlan, OverageConfig, CreditConfig, LoanConfig, InvoiceConfig, GiftConfig, TransferConfig, OrderStatus, etc.

### Task 2: Supabase Migration
Create `supabase/migration-commerce.sql` — tables: products, product_variants, orders, order_items, subscriptions, subscription_items, usage_records, invoices, invoice_line_items, loans, loan_repayments.

### Task 3: Product Service
Create `src/lib/commerce/product-service.ts` — CRUD for products with type-specific validation. Create/update/list/archive products. Filter by type, venture, status.

### Task 4: Subscription Engine
Create `src/lib/commerce/subscription-engine.ts` — create/upgrade/downgrade/cancel/pause subscriptions. Overage detection and charging. Trial management. Creates ledger entries for charges.

### Task 5: Invoice Engine
Create `src/lib/commerce/invoice-engine.ts` — create/send/record-payment/void invoices. Payment terms (net-30, etc), reminders, partial payments. Creates ledger entries.

### Task 6: Loan Engine
Create `src/lib/commerce/loan-engine.ts` — create loans with repayment schedules, record repayments, handle BNPL (0% interest installments). Creates ledger entries for disbursement/repayment.

### Task 7: Commerce API + Store + Kit
Create `api/commerce.ts`, `src/stores/commerce.ts`, `src/lib/kits/builtin/commerce-kit.ts`. Register kit in loader.

### Task 8: Module Index + Verification
Create `src/lib/commerce/index.ts`. Run full verification.
