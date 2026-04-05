# @mcv/commerce — Implementation Plan

| Field | Value |
|---|---|
| **Package** | `@mcv/commerce` |
| **Classification** | PUBLISHABLE |
| **Tier** | 5 (Domain Layer) |
| **Last Updated** | February 9, 2026 |

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Foundation](#phase-1-foundation)
4. [Phase 2: Core Commerce](#phase-2-core-commerce)
5. [Phase 3: Advanced Features](#phase-3-advanced-features)
6. [Phase 4: Polish & Optimization](#phase-4-polish--optimization)
7. [Testing Strategy](#testing-strategy)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Risks & Mitigations](#risks--mitigations)
10. [Timeline](#timeline)

---

## Overview

This implementation plan outlines the phased delivery of `@mcv/commerce` — the full-stack, multi-tenant commerce platform for MCV.ONE. The plan is structured into four phases, progressing from foundational data models and basic CRUD through full payment processing, advanced invoicing, and finally to optimization and polish.

### Design Principles

1. **Incremental Delivery** — Each phase delivers usable functionality. Phase 1 alone provides a working product catalog.
2. **Test-First** — Service tests written alongside implementation. Integration tests gate phase completion.
3. **Stripe-Native** — Every payment feature leverages Stripe Connect APIs directly. No custom payment processing.
4. **Multi-Tenant from Day 1** — ventureId scoping baked into every table, every service, every query from the start.
5. **Schema-Driven** — Drizzle ORM schemas and Zod validation schemas are written first, then services built on top.
6. **Event-Driven** — Audit events emitted from Phase 1 onward, enabling downstream integrations without blocking.

### Scope

| Metric | Count |
|---|---|
| Database tables | 36 |
| PostgreSQL enums | 28 |
| tRPC procedures | 132 |
| Service modules | 25+ |
| React hooks | 20+ |
| React components | 17 |
| Cron jobs | 5 |
| Stripe webhook handlers | 15 |

---

## Prerequisites

### Infrastructure Requirements

Before starting Phase 1, the following must be in place:

| Prerequisite | Status Required | Owner |
|---|---|---|
| PostgreSQL database (Supabase) | Running, accessible | Platform team |
| Drizzle ORM configured | Connected to database | @mcv/db |
| tRPC router infrastructure | Base router with auth middleware | @mcv/kernel |
| Authentication system | Working venture/admin/superAdmin procedures | @mcv/identity |
| Venture provisioning | createVenture working, ventureId in context | @mcv/kernel |
| Redis instance | Running for caching (optional Phase 1) | Platform team |
| Stripe account (test mode) | API keys available | Platform team |
| Turborepo package | `packages/domains/commerce/` scaffolded | Platform team |

### Dependency Packages

| Package | Version | Phase Needed |
|---|---|---|
| `drizzle-orm` | `^0.38.x` | Phase 1 |
| `zod` | `^3.x` | Phase 1 |
| `@trpc/server` | `^10.x` | Phase 1 |
| `stripe` | `^17.x` | Phase 2 |
| `@mcv/kernel` | latest | Phase 1 |
| `@mcv/identity` | latest | Phase 1 |
| `@mcv/db` | latest | Phase 1 |
| `@mcv/shared` | latest | Phase 1 |
| `@mcv/fabric` | latest | Phase 3 (components) |
| `@mcv/connectors/email` | latest | Phase 2 (invoicing) |

### Developer Setup

```bash
# Clone and install
git clone <mcv-monorepo>
cd packages/domains/commerce

# Environment variables (.env.local)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
DATABASE_URL=postgresql://user:pass@localhost:54322/mcv

# Run schema migrations
pnpm drizzle-kit push:pg

# Start development
pnpm dev
```

---

## Phase 1: Foundation

**Duration:** 3 weeks
**Goal:** Product catalog, categories, inventory, cart, basic orders — the data layer foundation.

### Week 1: Schema & Product CRUD

#### 1.1 Database Schema — Catalog

Create Drizzle ORM schema for the catalog domain:

| Task | Files | Priority |
|---|---|---|
| Define product enums (type, status) | `server/schema/catalog.ts` | P0 |
| Create `products` table (33 columns) | `server/schema/catalog.ts` | P0 |
| Create `product_variants` table | `server/schema/catalog.ts` | P0 |
| Create `product_categories` table (materialized path) | `server/schema/catalog.ts` | P0 |
| Create `discount_codes` table | `server/schema/catalog.ts` | P1 |
| Create `tax_categories` + `tax_rates` tables | `server/schema/catalog.ts` | P1 |
| Create `inventory_movements` table | `server/schema/catalog.ts` | P1 |
| Create `product_collections` + `collection_products` tables | `server/schema/catalog.ts` | P2 |
| Create `price_rules` table | `server/schema/catalog.ts` | P2 |
| Run migration, verify all tables created | — | P0 |
| Add all indexes (9 for products, 5 for categories, etc.) | `server/schema/catalog.ts` | P0 |

**Deliverable:** 11 tables, 10 enums, all indexes created.

#### 1.2 Product Service

| Task | Files | Priority |
|---|---|---|
| Implement `createProduct` with Zod validation | `server/services/product-service.ts` | P0 |
| Implement `updateProduct` with optimistic locking | `server/services/product-service.ts` | P0 |
| Implement `deleteProduct` (soft delete → discontinued) | `server/services/product-service.ts` | P0 |
| Implement `getProduct` with variant loading | `server/services/product-service.ts` | P0 |
| Implement `listProducts` with filters/sort/pagination | `server/services/product-service.ts` | P0 |
| Implement `duplicateProduct` | `server/services/product-service.ts` | P1 |
| Implement `archiveProduct` | `server/services/product-service.ts` | P1 |
| Implement `bulkUpdateProductStatus` (max 100) | `server/services/product-service.ts` | P1 |
| Implement `bulkDeleteProducts` (max 100) | `server/services/product-service.ts` | P1 |
| Implement `getLowStockProducts` | `server/services/product-service.ts` | P2 |
| Write Zod schemas for all product inputs | `server/schemas/product-schemas.ts` | P0 |
| Write unit tests for product service | `server/services/__tests__/product-service.test.ts` | P0 |

**Deliverable:** Full product CRUD with tests.

#### 1.3 Category Service

| Task | Files | Priority |
|---|---|---|
| Implement `createCategory` with materialized path | `server/services/category-service.ts` | P0 |
| Implement `updateCategory` | `server/services/category-service.ts` | P0 |
| Implement `deleteCategory` with child check | `server/services/category-service.ts` | P0 |
| Implement `getCategoryTree` (full tree) | `server/services/category-service.ts` | P0 |
| Implement `moveCategory` (reparent + path recalculation) | `server/services/category-service.ts` | P1 |
| Implement `getCategoryAncestors` (breadcrumb) | `server/services/category-service.ts` | P1 |
| Implement `getCategoryDescendants` | `server/services/category-service.ts` | P1 |
| Implement `recountCategoryProducts` | `server/services/category-service.ts` | P2 |
| Write tests for tree operations | `server/services/__tests__/category-service.test.ts` | P0 |

**Deliverable:** Working category tree with materialized path.

### Week 2: Inventory, Discounts, Cart

#### 2.1 Inventory Service

| Task | Files | Priority |
|---|---|---|
| Implement `recordInventoryMovement` | `server/services/inventory-service.ts` | P0 |
| Implement `bulkAdjustInventory` (max 100) | `server/services/inventory-service.ts` | P1 |
| Implement `transferInventory` | `server/services/inventory-service.ts` | P1 |
| Implement `listInventoryMovements` with date range | `server/services/inventory-service.ts` | P1 |
| Implement `getLowStockAlerts` | `server/services/inventory-service.ts` | P1 |
| Implement `getStockReport` | `server/services/inventory-service.ts` | P2 |
| Emit `catalog.inventory.movement` and `catalog.inventory.low_stock` events | — | P1 |
| Write tests | `server/services/__tests__/inventory-service.test.ts` | P0 |

**Deliverable:** Inventory tracking with audit trail.

#### 2.2 Discount Service

| Task | Files | Priority |
|---|---|---|
| Implement `createDiscount` | `server/services/discount-service.ts` | P0 |
| Implement `updateDiscount` / `deleteDiscount` | `server/services/discount-service.ts` | P0 |
| Implement `validateDiscountCode` with all eligibility checks | `server/services/discount-service.ts` | P0 |
| Implement `applyDiscountToCart` with amount calculation | `server/services/discount-service.ts` | P0 |
| Implement `incrementDiscountUsage` | `server/services/discount-service.ts` | P1 |
| Support all 4 discount types (percentage, fixed, free_shipping, buy_x_get_y) | — | P0 |
| Write comprehensive validation tests | `server/services/__tests__/discount-service.test.ts` | P0 |

**Deliverable:** Discount engine with full validation.

#### 2.3 Cart Service

| Task | Files | Priority |
|---|---|---|
| Implement `addToCart` with price resolution | `server/services/cart-service.ts` | P0 |
| Implement `updateCartItem` (quantity change) | `server/services/cart-service.ts` | P0 |
| Implement `removeFromCart` | `server/services/cart-service.ts` | P0 |
| Implement `getCart` with totals calculation | `server/services/cart-service.ts` | P0 |
| Implement discount code integration | `server/services/cart-service.ts` | P1 |
| Implement cart TTL and expiry | `server/services/cart-service.ts` | P2 |
| Write tests | `server/services/__tests__/cart-service.test.ts` | P0 |

**Deliverable:** Session-based cart with discount support.

### Week 3: tRPC Router, Tax, Basic Orders

#### 3.1 Catalog Router

| Task | Files | Priority |
|---|---|---|
| Create `catalogRouter` with all product procedures | `server/routers/catalog-router.ts` | P0 |
| Add category procedures | `server/routers/catalog-router.ts` | P0 |
| Add discount procedures | `server/routers/catalog-router.ts` | P0 |
| Add inventory procedures | `server/routers/catalog-router.ts` | P1 |
| Add tax procedures | `server/routers/catalog-router.ts` | P1 |
| Wire auth middleware (ventureProcedure / adminProcedure) | — | P0 |
| Integration tests for router endpoints | `server/routers/__tests__/catalog-router.test.ts` | P0 |

#### 3.2 Tax Service

| Task | Files | Priority |
|---|---|---|
| Implement `createTaxCategory` / `listTaxCategories` / `deleteTaxCategory` | `server/services/tax-service.ts` | P0 |
| Implement `createTaxRate` / `listTaxRates` / `deleteTaxRate` | `server/services/tax-service.ts` | P0 |
| Implement tax rate resolution (country → state → postal) | `server/services/tax-service.ts` | P0 |
| Implement compound tax calculation | `server/services/tax-service.ts` | P1 |
| Implement tax-inclusive pricing | `server/services/tax-service.ts` | P1 |
| Write tests for multi-jurisdiction resolution | `server/services/__tests__/tax-service.test.ts` | P0 |

#### 3.3 Constants & Types Export

| Task | Files | Priority |
|---|---|---|
| Export all TypeScript interfaces | `types.ts` | P0 |
| Export all constants (enums, defaults) | `constants.ts` | P0 |
| Export Zod schemas for client reuse | `schemas/index.ts` | P0 |
| Create package entry point (`index.ts`) | `index.ts` | P0 |

### Phase 1 Exit Criteria

- [ ] 11 catalog tables created with indexes
- [ ] Full product CRUD (create, read, update, delete, list, duplicate, archive, bulk)
- [ ] Category tree with materialized path (create, move, ancestors, descendants)
- [ ] Inventory tracking with audit trail
- [ ] Discount engine with all 4 types validated
- [ ] Session-based cart with discount application
- [ ] Tax categories and rates with multi-jurisdiction resolution
- [ ] catalogRouter with 45+ procedures wired
- [ ] All services have unit tests with >80% coverage
- [ ] Event emission for catalog operations

---

## Phase 2: Core Commerce

**Duration:** 4 weeks
**Goal:** Stripe Connect payments, checkout, subscriptions, invoicing, and order management.

### Week 4: Stripe Connect & Payment Schema

#### 4.1 Payment Schema

| Task | Files | Priority |
|---|---|---|
| Define payment enums (14 types) | `server/schema/payments.ts` | P0 |
| Create all 13 payment tables | `server/schema/payments.ts` | P0 |
| Add Stripe ID unique indexes | `server/schema/payments.ts` | P0 |
| Run migration | — | P0 |

#### 4.2 Stripe Connect Service

| Task | Files | Priority |
|---|---|---|
| Implement `createConnectedAccount` (standard/express/custom) | `server/services/stripe-connect-service.ts` | P0 |
| Implement `generateOnboardingLink` | `server/services/stripe-connect-service.ts` | P0 |
| Implement `getAccount` / `listConnectedAccounts` | `server/services/stripe-connect-service.ts` | P0 |
| Implement `getBalance` | `server/services/stripe-connect-service.ts` | P1 |
| Implement `updateApplicationFee` | `server/services/stripe-connect-service.ts` | P1 |
| Handle `account.updated` webhook | `server/webhooks/stripe-handler.ts` | P0 |
| Write tests with Stripe mock | `server/services/__tests__/stripe-connect.test.ts` | P0 |

### Week 5: Checkout, Payments, Customers

#### 5.1 Customer Service

| Task | Files | Priority |
|---|---|---|
| Implement `createPaymentCustomer` (syncs to Stripe) | `server/services/customer-service.ts` | P0 |
| Implement `listPaymentCustomers` | `server/services/customer-service.ts` | P0 |

#### 5.2 Payment Product & Price Service

| Task | Files | Priority |
|---|---|---|
| Implement `createPaymentProduct` / `updatePaymentProduct` / `archivePaymentProduct` | `server/services/product-service.ts` (payments) | P0 |
| Implement `createPrice` / `archivePrice` / `listPrices` | `server/services/product-service.ts` (payments) | P0 |
| Implement catalog → Stripe product sync (`syncProductToStripe`) | `server/services/product-service.ts` | P0 |

#### 5.3 Checkout Service

| Task | Files | Priority |
|---|---|---|
| Implement `createCheckoutSession` (payment/subscription/setup modes) | `server/services/checkout-service.ts` | P0 |
| Implement `getCheckoutSession` / `expireCheckoutSession` | `server/services/checkout-service.ts` | P0 |
| Implement `createPaymentLink` | `server/services/checkout-service.ts` | P1 |
| Platform fee calculation on checkout | `server/services/checkout-service.ts` | P0 |
| Handle `checkout.session.completed` webhook | `server/webhooks/stripe-handler.ts` | P0 |
| Handle `payment_intent.succeeded` / `payment_intent.payment_failed` webhooks | `server/webhooks/stripe-handler.ts` | P0 |

#### 5.4 Refund & Dispute Service

| Task | Files | Priority |
|---|---|---|
| Implement `createRefund` (full/partial) | `server/services/refund-service.ts` | P0 |
| Implement `listRefunds` / `listDisputes` | `server/services/refund-service.ts` | P0 |
| Implement `submitDisputeEvidence` | `server/services/refund-service.ts` | P1 |
| Handle `charge.refunded` / `charge.dispute.*` webhooks | `server/webhooks/stripe-handler.ts` | P0 |

#### 5.5 Payout Service

| Task | Files | Priority |
|---|---|---|
| Implement `createPayout` (standard/instant) | `server/services/payout-service.ts` | P1 |
| Implement `listPayouts` | `server/services/payout-service.ts` | P1 |
| Handle `payout.paid` / `payout.failed` webhooks | `server/webhooks/stripe-handler.ts` | P1 |

### Week 6: Subscriptions & Invoicing Schema

#### 6.1 Subscription Service

| Task | Files | Priority |
|---|---|---|
| Implement `createSubscription` with trial support | `server/services/subscription-service.ts` | P0 |
| Implement `updateSubscription` (plan change, quantity) | `server/services/subscription-service.ts` | P0 |
| Implement `cancelSubscription` (immediate / at period end) | `server/services/subscription-service.ts` | P0 |
| Implement `pauseSubscription` / `resumeSubscription` | `server/services/subscription-service.ts` | P1 |
| Implement `getUpcomingInvoice` | `server/services/subscription-service.ts` | P1 |
| Implement `applySubscriptionDiscount` | `server/services/subscription-service.ts` | P1 |
| Handle `customer.subscription.*` webhooks | `server/webhooks/stripe-handler.ts` | P0 |

#### 6.2 Invoicing Schema

| Task | Files | Priority |
|---|---|---|
| Define invoicing enums (7 types) | `server/schema/invoicing.ts` | P0 |
| Create all 12 invoicing tables | `server/schema/invoicing.ts` | P0 |
| Add indexes | `server/schema/invoicing.ts` | P0 |
| Run migration | — | P0 |

#### 6.3 Invoice Template Service

| Task | Files | Priority |
|---|---|---|
| Implement template CRUD | `server/services/invoice-template-service.ts` | P0 |
| Support branded colors, logos, HTML headers/footers | — | P0 |
| Support tax configuration per template | — | P1 |
| Auto-increment invoice numbering | — | P0 |

### Week 7: Invoice V2, Payments Router

#### 7.1 Invoice V2 Service

| Task | Files | Priority |
|---|---|---|
| Implement full invoice CRUD | `server/services/invoice-v2-service.ts` | P0 |
| Implement `sendInvoiceV2` (email + payment link) | `server/services/invoice-v2-service.ts` | P0 |
| Implement `markInvoiceViewed` | `server/services/invoice-v2-service.ts` | P0 |
| Implement `recordPayment` (manual payment) | `server/services/invoice-v2-service.ts` | P0 |
| Implement `voidInvoiceV2` / `writeOffInvoice` | `server/services/invoice-v2-service.ts` | P0 |
| Implement `duplicateInvoiceV2` | `server/services/invoice-v2-service.ts` | P1 |
| Implement `getInvoiceSummary` (dashboard stats) | `server/services/invoice-v2-service.ts` | P1 |
| Implement `getInvoiceHtml` / `getInvoicePdfData` | `server/services/invoice-v2-service.ts` | P1 |
| Implement `detectOverdueInvoices` (cron) | `server/services/invoice-v2-service.ts` | P1 |
| Implement `processReminders` (cron) | `server/services/invoice-v2-service.ts` | P1 |

#### 7.2 Stripe Native Invoice Service

| Task | Files | Priority |
|---|---|---|
| Implement Stripe invoice CRUD | `server/services/invoice-service.ts` | P0 |
| Implement `sendStripeInvoice` / `voidStripeInvoice` | `server/services/invoice-service.ts` | P0 |
| Handle `invoice.paid` / `invoice.payment_failed` webhooks | `server/webhooks/stripe-handler.ts` | P0 |

#### 7.3 Payments Router

| Task | Files | Priority |
|---|---|---|
| Create `paymentsRouter` with all 32 procedures | `server/routers/payments-router.ts` | P0 |
| Wire auth middleware | — | P0 |
| Integration tests | `server/routers/__tests__/payments-router.test.ts` | P0 |

### Phase 2 Exit Criteria

- [ ] 13 payment tables + 12 invoicing tables created
- [ ] Stripe Connect onboarding flow working end-to-end
- [ ] Checkout sessions creating payments via Stripe
- [ ] Subscription lifecycle (create, update, cancel, pause, resume)
- [ ] Invoice V2 full lifecycle (draft → sent → viewed → paid/overdue/void)
- [ ] Stripe native invoicing working
- [ ] Refund and dispute handling
- [ ] Payout management
- [ ] All 15 webhook handlers implemented
- [ ] paymentsRouter with 32 procedures
- [ ] Cron jobs: overdue detection, reminder processing
- [ ] All services with unit tests >80% coverage

---

## Phase 3: Advanced Features

**Duration:** 4 weeks
**Goal:** Proposals, estimates, recurring invoicing, approvals, POS, wholesale, collections, AI recommendations, reporting.

### Week 8: Proposals & Estimates

#### 8.1 Proposal Service

| Task | Files | Priority |
|---|---|---|
| Implement full proposal CRUD | `server/services/proposal-service.ts` | P0 |
| Implement rich content blocks (10 block types) | — | P0 |
| Implement `sendProposal` | `server/services/proposal-service.ts` | P0 |
| Implement `acceptProposal` with e-signature capture | `server/services/proposal-service.ts` | P0 |
| Implement `declineProposal` | `server/services/proposal-service.ts` | P0 |
| Implement `convertProposalToInvoice` | `server/services/proposal-service.ts` | P0 |
| Implement `getProposalSummary` | `server/services/proposal-service.ts` | P1 |

#### 8.2 Estimate Service

| Task | Files | Priority |
|---|---|---|
| Implement estimate CRUD with version tracking | `server/services/estimate-service.ts` | P0 |
| Implement `sendEstimate` / `acceptEstimate` / `declineEstimate` | `server/services/estimate-service.ts` | P0 |
| Implement `convertEstimateToInvoice` with progress invoicing | `server/services/estimate-service.ts` | P0 |
| Implement milestone tracking | — | P0 |
| Implement `duplicateEstimate` | `server/services/estimate-service.ts` | P1 |
| Implement `detectExpiredEstimates` (cron) | `server/services/estimate-service.ts` | P1 |

### Week 9: Recurring Invoices, Credit Notes, Approvals

#### 9.1 Recurring Invoice Service

| Task | Files | Priority |
|---|---|---|
| Implement recurring CRUD | `server/services/recurring-invoice-service.ts` | P0 |
| Implement `pause` / `resume` / `cancel` | `server/services/recurring-invoice-service.ts` | P0 |
| Implement `processDueRecurringInvoices` (cron) | `server/services/recurring-invoice-service.ts` | P0 |
| Support all 6 intervals (weekly through yearly) | — | P0 |
| Auto-send on generation | — | P1 |

#### 9.2 Credit Note Service

| Task | Files | Priority |
|---|---|---|
| Implement `createCreditNote` / `issueCreditNote` / `voidCreditNote` | `server/services/credit-note-service.ts` | P0 |
| Implement `listCreditNotes` | `server/services/credit-note-service.ts` | P0 |
| Wire `applyCredit` to invoice V2 service | — | P0 |

#### 9.3 Approval Workflow Service

| Task | Files | Priority |
|---|---|---|
| Implement workflow CRUD | `server/services/approval-service.ts` | P0 |
| Implement `submitForApproval` | `server/services/approval-service.ts` | P0 |
| Implement `makeApprovalDecision` with step progression | `server/services/approval-service.ts` | P0 |
| Implement `getMyPendingApprovals` | `server/services/approval-service.ts` | P0 |
| Implement auto-approve rules | `server/services/approval-service.ts` | P1 |
| Implement conditional step logic | `server/services/approval-service.ts` | P1 |

#### 9.4 Invoicing Router

| Task | Files | Priority |
|---|---|---|
| Create `invoicingRouter` with all 55 procedures | `server/routers/invoicing-router.ts` | P0 |
| Wire auth middleware | — | P0 |
| Integration tests | `server/routers/__tests__/invoicing-router.test.ts` | P0 |

### Week 10: Collections, Wholesale, POS, Engagement

#### 10.1 Collection Service

| Task | Files | Priority |
|---|---|---|
| Implement collection CRUD | `server/services/collection-service.ts` | P0 |
| Implement `addProductsToCollection` / `removeProductsFromCollection` | `server/services/collection-service.ts` | P0 |
| Implement `reorderCollectionProducts` | `server/services/collection-service.ts` | P1 |
| Implement `evaluateCollectionRules` for automated collections | `server/services/collection-service.ts` | P0 |

#### 10.2 Price Rule Service (Wholesale)

| Task | Files | Priority |
|---|---|---|
| Implement price rule CRUD | `server/services/price-rule-service.ts` | P0 |
| Implement `calculateEffectivePrice` with priority evaluation | `server/services/price-rule-service.ts` | P0 |
| Support all 4 rule types (volume, tiered, customer_group, time_limited) | — | P0 |
| Implement `listPriceRulesByProduct` | `server/services/price-rule-service.ts` | P1 |

#### 10.3 POS Integration

| Task | Files | Priority |
|---|---|---|
| Implement Stripe Terminal reader registration | `server/services/pos-service.ts` | P1 |
| Implement in-person payment intent creation | `server/services/pos-service.ts` | P1 |
| Implement receipt generation (print + email) | `server/services/pos-service.ts` | P2 |
| Unified reporting pipeline with online transactions | — | P1 |

#### 10.4 Engagement & Interactive Pricing

| Task | Files | Priority |
|---|---|---|
| Implement `trackDocumentView` | `server/services/engagement-service.ts` | P1 |
| Implement `getEngagementScore` / `getViewHistory` | `server/services/engagement-service.ts` | P1 |
| Implement `getEngagementHeatmap` | `server/services/engagement-service.ts` | P2 |
| Implement interactive pricing (package/builder) | `server/services/interactive-pricing-service.ts` | P2 |

### Week 11: Revenue Reporting, Platform Fees, AI

#### 11.1 Reporting Service

| Task | Files | Priority |
|---|---|---|
| Implement `getMrr` / `getArr` | `server/services/reporting-service.ts` | P0 |
| Implement `getChurnRate` / `getLtv` | `server/services/reporting-service.ts` | P0 |
| Implement `getRevenueTimeline` | `server/services/reporting-service.ts` | P0 |
| Implement `getRevenueByProduct` | `server/services/reporting-service.ts` | P1 |
| Implement `getPaymentMethodBreakdown` | `server/services/reporting-service.ts` | P1 |
| Implement `getOutstandingInvoices` | `server/services/reporting-service.ts` | P1 |
| Create materialized views for aggregates | `server/schema/views.ts` | P1 |

#### 11.2 Platform Fee Service

| Task | Files | Priority |
|---|---|---|
| Implement `getPlatformFeeConfig` / `updatePlatformFeeConfig` | `server/services/platform-fee-service.ts` | P0 |
| Implement `listPlatformFeeConfigs` | `server/services/platform-fee-service.ts` | P0 |
| Implement `getPlatformRevenueReport` | `server/services/platform-fee-service.ts` | P0 |
| Implement tiered fee calculation | `server/services/platform-fee-service.ts` | P1 |
| Implement fee ledger entries | `server/services/platform-fee-service.ts` | P1 |

#### 11.3 AI Integration

| Task | Files | Priority |
|---|---|---|
| AI product description generation | Integration with @mcv/intelligence | P2 |
| AI pricing suggestions | Integration with @mcv/intelligence | P2 |
| Smart discount recommendation | Integration with @mcv/intelligence | P2 |

### Phase 3 Exit Criteria

- [ ] Proposals with rich content blocks and e-signature
- [ ] Estimates with version history and progress invoicing
- [ ] Recurring invoice generation working on cron
- [ ] Credit notes applied to invoices
- [ ] Approval workflows with multi-step chains
- [ ] Collections (manual + automated rule evaluation)
- [ ] Wholesale pricing with tiered/volume/group rules
- [ ] POS terminal integration (basic)
- [ ] Revenue reporting (MRR, ARR, churn, LTV, timeline)
- [ ] Platform fee management for super admins
- [ ] invoicingRouter with 55 procedures
- [ ] All 132 tRPC procedures wired

---

## Phase 4: Polish & Optimization

**Duration:** 2 weeks
**Goal:** Client components, performance optimization, caching, documentation, production readiness.

### Week 12: Client Hooks & Components

#### 12.1 React Hooks

| Hook | Source |
|---|---|
| `useProducts` / `useProduct` | `client/hooks/use-products.ts` |
| `useCategories` / `useCategoryTree` | `client/hooks/use-categories.ts` |
| `useCollections` | `client/hooks/use-collections.ts` |
| `useInventory` | `client/hooks/use-inventory.ts` |
| `useDiscounts` | `client/hooks/use-discounts.ts` |
| `useCart` / `useCartActions` | `client/hooks/use-cart.ts` |
| `useCheckout` / `useCheckoutSession` | `client/hooks/use-checkout.ts` |
| `usePayments` / `useSubscriptions` | `client/hooks/use-payments.ts` |
| `useStripeConnect` | `client/hooks/use-stripe-connect.ts` |
| `useRevenueDashboard` | `client/hooks/use-revenue-dashboard.ts` |
| `useInvoices` / `useProposals` / `useEstimates` | `client/hooks/use-invoices.ts` |
| `useRecurringInvoices` | `client/hooks/use-recurring-invoices.ts` |
| `useApprovalWorkflows` | `client/hooks/use-approval-workflows.ts` |

#### 12.2 React Components

| Component | Description |
|---|---|
| `ProductCatalog` | Product listing with filters and search |
| `ProductEditor` | Full product edit form |
| `CategoryManager` | Tree-view category management |
| `InventoryDashboard` | Stock levels and alerts |
| `ShoppingCart` | Cart sidebar with totals |
| `CheckoutFlow` | Multi-step checkout UI |
| `InvoiceBuilder` | Invoice creation with line items |
| `InvoicePreview` | Rendered invoice preview |
| `ProposalBuilder` | Rich proposal editor |
| `EstimateBuilder` | Estimate editor with versions |
| `SubscriptionManager` | Subscription list and management |
| `RevenueDashboard` | Revenue charts and metrics |
| `PaymentHistory` | Payment transaction list |
| `StripeOnboarding` | Connect onboarding flow |
| `InteractivePricing` | Package/builder pricing UI |
| `ApprovalQueue` | Pending approval list |
| `EngagementAnalytics` | View tracking analytics |

### Week 13: Performance, Caching, Production Readiness

#### 13.1 Caching Implementation

| Task | Priority |
|---|---|
| Redis cart session caching (TTL: 72h) | P0 |
| Product catalog page caching (TTL: 5min) | P1 |
| Category tree caching (TTL: 1h) | P1 |
| Tax rate caching (TTL: 24h) | P1 |
| Revenue metric caching (TTL: 15min) | P2 |
| Cache invalidation on write operations | P0 |

#### 13.2 Performance Optimization

| Task | Priority |
|---|---|
| Verify all query latency targets met (<50ms reads, <200ms writes) | P0 |
| Create materialized views for revenue aggregates | P1 |
| Optimize N+1 queries in product listing with variants | P0 |
| Add database connection pooling configuration | P0 |
| Implement rate limiting per venture per endpoint | P0 |

#### 13.3 Production Readiness

| Task | Priority |
|---|---|
| Configure all 5 cron jobs with proper scheduling | P0 |
| Health check endpoints (database, Stripe, Redis, webhooks) | P0 |
| Structured logging for all services | P0 |
| Prometheus metrics exported | P1 |
| Error monitoring integration (Sentry) | P0 |
| Stripe webhook reconciliation job (every 4 hours) | P1 |
| Documentation review and update | P0 |
| Security audit: RLS policies, input validation, auth middleware | P0 |

### Phase 4 Exit Criteria

- [ ] 20+ React hooks exported
- [ ] 17 React components exported
- [ ] Redis caching implemented for critical paths
- [ ] All query latency targets met
- [ ] Rate limiting configured
- [ ] 5 cron jobs scheduled
- [ ] Health checks operational
- [ ] Structured logging and metrics
- [ ] Security audit passed
- [ ] Documentation complete

---

## Testing Strategy

### Test Pyramid

```
          ┌───────────┐
          │   E2E     │   5-10 critical user flows
          │  Tests    │   (Playwright)
          ├───────────┤
          │Integration│   50+ tests
          │  Tests    │   (tRPC router + DB)
          ├───────────┤
          │  Service  │   200+ tests
          │  Tests    │   (business logic)
          ├───────────┤
          │   Unit    │   300+ tests
          │  Tests    │   (pure functions, schemas)
          └───────────┘
```

### Test Categories

| Category | Scope | Tool | Count |
|---|---|---|---|
| **Unit Tests** | Zod schemas, helpers, price calculation, tax resolution | Vitest | 300+ |
| **Service Tests** | Service layer with database (Supabase test instance) | Vitest + pg | 200+ |
| **Integration Tests** | tRPC router → service → database round trips | Vitest + tRPC caller | 50+ |
| **Stripe Tests** | Stripe API calls with test mode | Vitest + Stripe test keys | 30+ |
| **E2E Tests** | Full checkout flow, invoice lifecycle | Playwright | 10+ |

### Coverage Targets

| Module | Target |
|---|---|
| Service layer | ≥ 80% line coverage |
| Router layer | ≥ 70% line coverage |
| Schema validation | 100% (all fields tested) |
| Webhook handlers | ≥ 90% line coverage |
| Client hooks | ≥ 60% line coverage |

### Test Data Strategy

- **Fixtures:** Pre-built product, category, customer, and venture fixtures
- **Factories:** `createTestProduct()`, `createTestInvoice()`, etc. for dynamic test data
- **Stripe Test Mode:** All Stripe tests use `sk_test_` keys with test card numbers
- **Database Isolation:** Each test suite gets a fresh transaction that rolls back

---

## Acceptance Criteria

### Functional Requirements

| # | Requirement | Phase |
|---|---|---|
| AC-01 | A venture admin can create, edit, and list products with variants | Phase 1 |
| AC-02 | Categories form a navigable tree with breadcrumbs | Phase 1 |
| AC-03 | Inventory movements are tracked with an audit trail | Phase 1 |
| AC-04 | Discount codes validate against all eligibility rules | Phase 1 |
| AC-05 | Cart maintains session state with real-time totals | Phase 1 |
| AC-06 | Tax rates resolve correctly by country/state/postal | Phase 1 |
| AC-07 | A venture can complete Stripe Connect onboarding | Phase 2 |
| AC-08 | A customer can checkout and pay via Stripe | Phase 2 |
| AC-09 | Subscriptions can be created, upgraded, paused, and canceled | Phase 2 |
| AC-10 | Invoices follow the full lifecycle (draft → paid) | Phase 2 |
| AC-11 | Refunds process correctly via Stripe | Phase 2 |
| AC-12 | All Stripe webhooks are handled idempotently | Phase 2 |
| AC-13 | Proposals support rich content and e-signatures | Phase 3 |
| AC-14 | Estimates support progress invoicing | Phase 3 |
| AC-15 | Recurring invoices generate on schedule | Phase 3 |
| AC-16 | Approval workflows enforce multi-step chains | Phase 3 |
| AC-17 | Wholesale pricing resolves correctly by priority | Phase 3 |
| AC-18 | Revenue reporting provides accurate MRR/ARR/churn | Phase 3 |
| AC-19 | Platform fees are collected correctly per configuration | Phase 3 |
| AC-20 | All operations are venture-scoped (no data leakage) | All |

### Non-Functional Requirements

| # | Requirement | Target |
|---|---|---|
| NF-01 | Product listing response time | < 50ms (p95) |
| NF-02 | Checkout session creation | < 500ms (p95) |
| NF-03 | Webhook processing time | < 200ms (p95) |
| NF-04 | Concurrent ventures supported | 100+ |
| NF-05 | Products per venture | 100,000+ |
| NF-06 | Test coverage (services) | ≥ 80% |
| NF-07 | Zero PCI data exposure | All card data via Stripe.js |
| NF-08 | Uptime SLA | 99.9% |

---

## Risks & Mitigations

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| Stripe API rate limits | Checkout failures | Medium | Implement exponential backoff, queue webhook processing |
| Webhook delivery failures | Stale payment state | Medium | 4-hour reconciliation cron, idempotent handlers |
| Complex tax calculations | Incorrect totals | Low | Comprehensive test suite for all jurisdiction combinations |
| Materialized path corruption | Broken category tree | Low | Validation on move operations, path recalculation tool |
| N+1 query patterns | Slow listing pages | Medium | Eager loading for variants, price rules in list queries |
| Redis cache inconsistency | Stale prices shown | Low | Short TTLs, write-through invalidation |
| Concurrent inventory updates | Overselling | Medium | Database transactions with row-level locks |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| Stripe API version changes | Breaking changes | Low | Pin API version, test against upcoming versions |
| PCI compliance gaps | Legal/financial | Low | No raw card data stored; annual Stripe compliance review |
| Multi-currency complexity | Incorrect totals | Medium | Store currency alongside every amount; standardize on cents |
| Venture data leakage | Security incident | Low | RLS policies, service-level scoping, automated security tests |
| Feature creep in invoicing | Timeline slip | Medium | Strict phase gate criteria; defer P2 items if behind |

### Dependency Risks

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| @mcv/kernel not ready | Blocked on auth | Medium | Develop with mock middleware, integrate when available |
| @mcv/connectors/email delayed | No invoice delivery | Medium | Queue emails, add retry logic, manual send fallback |
| @mcv/crm not available | No contact lookup | Low | Make contactId optional, operate without CRM data |
| Stripe test mode differences | Unexpected production behavior | Low | Test with Stripe test mode; shadow test with live keys pre-launch |

---

## Timeline

### Summary

| Phase | Duration | Start | End | Key Deliverables |
|---|---|---|---|---|
| **Phase 1: Foundation** | 3 weeks | Week 1 | Week 3 | Catalog, categories, inventory, cart, tax, catalogRouter |
| **Phase 2: Core** | 4 weeks | Week 4 | Week 7 | Stripe Connect, checkout, subscriptions, invoicing, paymentsRouter |
| **Phase 3: Advanced** | 4 weeks | Week 8 | Week 11 | Proposals, estimates, recurring, approvals, POS, wholesale, reporting, invoicingRouter |
| **Phase 4: Polish** | 2 weeks | Week 12 | Week 13 | Client hooks, components, caching, performance, production readiness |

### Gantt Overview

```
Week:  1    2    3    4    5    6    7    8    9    10   11   12   13
       ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
P1     ████████████████
       Schema  Inv/Disc Router
       Product Cart    Tax

P2                      ████████████████████████
                        Stripe  CkOut  Subs  InvV2
                        Connect Pay    Invoice Router

P3                                              ████████████████████████
                                                Proposals  Collections  Report
                                                Estimates  Wholesale    Fees
                                                Recurring  POS         AI
                                                Approvals  Engagement

P4                                                                  ████████
                                                                    Hooks
                                                                    Components
                                                                    Cache
                                                                    Production
```

### Milestones

| Milestone | Week | Criteria |
|---|---|---|
| **M1: Catalog Ready** | Week 3 | Products, categories, inventory, cart working with tests |
| **M2: Payments Live** | Week 7 | End-to-end checkout, subscriptions, invoicing with Stripe |
| **M3: Full Feature** | Week 11 | All 132 procedures implemented, all features working |
| **M4: Production Ready** | Week 13 | Caching, performance targets met, security audit passed |

### Resource Requirements

| Role | Count | Phase |
|---|---|---|
| Backend Engineer (Senior) | 2 | All phases |
| Backend Engineer | 1 | Phase 2-3 |
| Frontend Engineer | 1 | Phase 3-4 (components) |
| QA Engineer | 1 | Phase 2-4 (testing) |
| DevOps | 0.5 | Phase 4 (production setup) |

---

*@mcv/commerce — Commerce Platform Domain*
