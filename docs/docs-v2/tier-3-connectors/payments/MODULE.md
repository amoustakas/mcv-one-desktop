# @mcv/payments — Module Specification

**Parent Package:** `@mcv/payments`  
**Tier:** 3 (Connector — External Service Integration)  
**Classification:** MCV-ONLY (Phase 1) → PUBLISHABLE (Phase 2: Q4 2026)  
**Source:** `packages/payments/`  
**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Purpose

The `payments` module is a multi-tenant payment processing system built on **Stripe Connect**. It provides complete commerce infrastructure for the MCV.ONE platform where each venture (tenant) operates through an isolated Stripe Connected Account — Express, Standard, or Custom — with configurable platform application fees.

**This module is the single entry point for all monetary transactions in the MCV ecosystem.** Every checkout, subscription, invoice, refund, payout, and revenue metric flows through this connector.

### Core Capabilities

- **Stripe Connect Multi-Tenancy** — Each venture gets its own connected account with full payment isolation
- **Product Catalog Management** — Create, price, and manage products synced bidirectionally with Stripe
- **Subscription Lifecycle** — Create, update, pause, resume, cancel with proration and dunning support
- **Hosted Checkout** — Stripe-hosted checkout sessions with automatic application fee calculation
- **Invoice Workflow** — Draft → Finalize → Send → Pay with line-item management and hosted payment pages
- **Refund & Dispute Handling** — Full/partial refunds with over-refund prevention, dispute evidence submission
- **Payout Management** — Standard and instant payouts to connected account bank accounts
- **Revenue Analytics** — MRR, ARR, churn rate, LTV, revenue timelines, product breakdowns
- **Webhook Processing** — 15+ Stripe event types with idempotent handling and automatic state sync
- **PCI Compliance** — Zero card data touches MCV servers; all sensitive data handled by Stripe

### Relationship to @mcv/invoicing

The `@mcv/payments` module handles **Stripe-managed invoicing** — invoices tied to Stripe subscriptions and customers with automatic payment collection. The separate `invoicing.ts` schema (Tier 5) handles **advanced branded invoicing** — templates, proposals, estimates, recurring invoice schedules, credit notes, approval workflows, and platform fee ledgers. Both systems share the Stripe Connect infrastructure but serve different business needs:

| Feature | @mcv/payments (invoices) | @mcv/invoicing (invoices_v2) |
|---------|-------------------------|-------------------------------|
| Use Case | Auto-billing for subscriptions | Manual invoicing, consulting, retainers |
| Payment | Auto-charged via Stripe | Manual payment or payment link |
| Templates | Stripe-hosted | Custom branded HTML templates |
| Lifecycle | draft → open → paid/void | draft → sent → viewed → partial → paid |
| Credit Notes | Not supported | Full credit note workflow |
| Proposals | Not supported | Full proposal + e-signature |

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// ROOT PACKAGE — @mcv/payments
// Re-exports all types from ./types
// ═══════════════════════════════════════════════════════════════════════════════

export * from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER PACKAGE — @mcv/payments/server
// All server-side services, middleware, and utilities
// ═══════════════════════════════════════════════════════════════════════════════

// Connected Account Management
export {
  StripeConnectService,          // Class for testing/extension
  stripeConnectService,          // Singleton instance
} from './services/stripe-connect.service';

// Checkout & Payment Links
export {
  CheckoutService,
  checkoutService,
} from './services/checkout.service';

// Subscription Lifecycle
export {
  SubscriptionService,
  subscriptionService,
} from './services/subscription.service';

// Invoice Management
export {
  InvoiceService,
  invoiceService,
} from './services/invoice.service';

// Product Catalog
export {
  ProductService,
  productService,
} from './services/product.service';

// Payouts & Transfers
export {
  PayoutService,
  payoutService,
} from './services/payout.service';

// Refunds & Disputes
export {
  RefundService,
  refundService,
} from './services/refund.service';

// Webhook Event Router
export {
  WebhookHandlerService,
  webhookHandlerService,
} from './services/webhook-handler.service';

// Revenue Analytics
export {
  ReportingService,
  reportingService,
} from './services/reporting.service';

// Webhook Signature Verification Middleware
export {
  verifyStripeWebhook,           // Platform webhook verification
} from './middleware/stripe-webhook';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT PACKAGE — @mcv/payments/client
// React hooks for payment UI integration
// ═══════════════════════════════════════════════════════════════════════════════

export { useCheckout } from './hooks/use-checkout';
export { useSubscriptions } from './hooks/use-subscriptions';
export { useInvoices } from './hooks/use-invoices';
export { useRevenue } from './hooks/use-revenue';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          PAYMENT SYSTEM ARCHITECTURE                                 │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                           CONSUMER LAYERS                                     │   │
│  │                                                                               │   │
│  │  ┌──────────────────┐  ┌─────────────────┐  ┌──────────────────────────┐     │   │
│  │  │   Tier 5:        │  │   Tier 4:       │  │   Dashboard UI           │     │   │
│  │  │   @mcv/commerce  │  │   NAOS Agents   │  │   React Components       │     │   │
│  │  │   @mcv/finance   │  │   Automation    │  │   Revenue Charts         │     │   │
│  │  │   @mcv/growth    │  │   Workflows     │  │   Subscription Tables    │     │   │
│  │  └────────┬─────────┘  └───────┬─────────┘  └────────────┬─────────────┘     │   │
│  │           │                    │                          │                    │   │
│  │           └────────────────────┴──────────────────────────┘                    │   │
│  │                                │                                               │   │
│  └────────────────────────────────┼───────────────────────────────────────────────┘   │
│                                   │                                                   │
│  ┌────────────────────────────────▼───────────────────────────────────────────────┐   │
│  │                          @mcv/payments                                          │   │
│  │                                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                     SERVER SERVICES LAYER                               │   │   │
│  │  │                                                                         │   │   │
│  │  │  ┌───────────────────┐  ┌────────────────────┐  ┌───────────────────┐  │   │   │
│  │  │  │  StripeConnect    │  │  ProductService     │  │ CheckoutService   │  │   │   │
│  │  │  │  Service          │  │                     │  │                   │  │   │   │
│  │  │  │                   │  │ • createProduct     │  │ • createSession   │  │   │   │
│  │  │  │ • createAccount   │  │ • createPrice       │  │ • paymentLinks    │  │   │   │
│  │  │  │ • onboardingLink  │  │ • updateProduct     │  │ • expireSession   │  │   │   │
│  │  │  │ • getBalance      │  │ • archiveProduct    │  │ • handleComplete  │  │   │   │
│  │  │  │ • updateFees      │  │ • listProducts      │  │                   │  │   │   │
│  │  │  │ • deriveStatus    │  │ • archivePrice      │  │                   │  │   │   │
│  │  │  └───────────────────┘  └────────────────────┘  └───────────────────┘  │   │   │
│  │  │                                                                         │   │   │
│  │  │  ┌───────────────────┐  ┌────────────────────┐  ┌───────────────────┐  │   │   │
│  │  │  │  Subscription     │  │  InvoiceService     │  │  RefundService    │  │   │   │
│  │  │  │  Service          │  │                     │  │                   │  │   │   │
│  │  │  │                   │  │ • create (draft)    │  │ • createRefund    │  │   │   │
│  │  │  │ • create          │  │ • update (draft)    │  │ • listRefunds     │  │   │   │
│  │  │  │ • update (prorate)│  │ • send/finalize     │  │ • handleDispute   │  │   │   │
│  │  │  │ • cancel          │  │ • void              │  │ • submitEvidence  │  │   │   │
│  │  │  │ • pause/resume    │  │ • markUncollectible │  │ • listDisputes    │  │   │   │
│  │  │  │ • applyDiscount   │  │ • addLineItem       │  │ • syncRefund      │  │   │   │
│  │  │  │ • upcomingInvoice │  │ • syncFromStripe    │  │                   │  │   │   │
│  │  │  │ • syncFromStripe  │  │                     │  │                   │  │   │   │
│  │  │  └───────────────────┘  └────────────────────┘  └───────────────────┘  │   │   │
│  │  │                                                                         │   │   │
│  │  │  ┌───────────────────┐  ┌────────────────────┐  ┌───────────────────┐  │   │   │
│  │  │  │  PayoutService    │  │  ReportingService   │  │ WebhookHandler   │  │   │   │
│  │  │  │                   │  │                     │  │ Service           │  │   │   │
│  │  │  │ • createPayout    │  │ • getMrr / getArr   │  │                   │  │   │   │
│  │  │  │ • createTransfer  │  │ • getChurnRate      │  │ • handleEvent     │  │   │   │
│  │  │  │ • getBalance      │  │ • getLtv            │  │ • 15+ event types │  │   │   │
│  │  │  │ • listPayouts     │  │ • revenueTimeline   │  │ • O(1) dispatch   │  │   │   │
│  │  │  │ • syncFromStripe  │  │ • revenueByProduct  │  │ • idempotent sync │  │   │   │
│  │  │  │                   │  │ • paymentMethods    │  │                   │  │   │   │
│  │  │  │                   │  │ • platformRevenue   │  │                   │  │   │   │
│  │  │  │                   │  │ • outstanding       │  │                   │  │   │   │
│  │  │  └───────────────────┘  └────────────────────┘  └───────────────────┘  │   │   │
│  │  │                                                                         │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                   STRIPE CONNECT TOPOLOGY                               │   │   │
│  │  │                                                                         │   │   │
│  │  │           ┌────────────────────────────────────┐                        │   │   │
│  │  │           │       Platform Account             │                        │   │   │
│  │  │           │       (MCV.ONE Master)             │                        │   │   │
│  │  │           │                                    │                        │   │   │
│  │  │           │  API Key: sk_live_...              │                        │   │   │
│  │  │           │  Webhook: whsec_...                │                        │   │   │
│  │  │           │  Application Fees: configurable    │                        │   │   │
│  │  │           └──────────┬─────────────────────────┘                        │   │   │
│  │  │                      │                                                  │   │   │
│  │  │         ┌────────────┼──────────────┐                                   │   │   │
│  │  │         │            │              │                                   │   │   │
│  │  │         ▼            ▼              ▼                                   │   │   │
│  │  │  ┌───────────┐ ┌───────────┐ ┌───────────┐                            │   │   │
│  │  │  │ Venture A │ │ Venture B │ │ Venture C │  ...N ventures             │   │   │
│  │  │  │ Express   │ │ Express   │ │ Custom    │                            │   │   │
│  │  │  │ Fee: 5%   │ │ Fee: 3%   │ │ Fee: 8%   │                            │   │   │
│  │  │  │ Active ✓  │ │ Pending ◌ │ │ Active ✓  │                            │   │   │
│  │  │  └───────────┘ └───────────┘ └───────────┘                            │   │   │
│  │  │                                                                         │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    CLIENT HOOKS LAYER (React)                            │   │   │
│  │  │                                                                         │   │   │
│  │  │  useCheckout()     useSubscriptions()   useInvoices()   useRevenue()    │   │   │
│  │  │                                                                         │   │   │
│  │  │  • createSession   • create/update      • create/send   • MRR/ARR      │   │   │
│  │  │  • paymentLinks    • cancel/pause       • void/uncoll.  • churn/LTV    │   │   │
│  │  │  • redirect        • resume             • addLineItem   • timelines    │   │   │
│  │  │                                                                         │   │   │
│  │  │  All hooks use: x-venture-id header, Promise.allSettled for resilience  │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                 │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    MIDDLEWARE & UTILITIES                                │   │   │
│  │  │                                                                         │   │   │
│  │  │  verifyStripeWebhook()      verifyStripeConnectWebhook()               │   │   │
│  │  │  getStripeClient()          getStripeConfig()                           │   │   │
│  │  │                                                                         │   │   │
│  │  │  Credentials: GCP Vault → env fallback                                 │   │   │
│  │  │  Client: Singleton, API v2024-12-18.acacia                             │   │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           EXTERNAL DEPENDENCIES                                   │  │
│  │                                                                                   │  │
│  │  ┌────────────────┐  ┌─────────────────┐  ┌────────────────────────────────────┐│  │
│  │  │  @mcv/db        │  │  @mcv/secrets   │  │  Stripe API                       ││  │
│  │  │  PostgreSQL     │  │  GCP Secret Mgr │  │  v2024-12-18.acacia               ││  │
│  │  │  Drizzle ORM    │  │  Vault fallback │  │  Node SDK ^14.0.0                 ││  │
│  │  │  14 tables      │  │  mcv-system-    │  │  Connect, Checkout, Billing       ││  │
│  │  │  28+ indexes    │  │  stripe-master  │  │  Webhook signature verification   ││  │
│  │  └────────────────┘  └─────────────────┘  └────────────────────────────────────┘│  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Payment Intent Lifecycle

```
Customer Checkout → Stripe Checkout Session → Payment Intent Created
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  Stripe fires   │
                                              │  webhook event  │
                                              └────────┬────────┘
                                                       │
    ┌──────────────────────────────────────────────────┼───────────────┐
    │                                                  │               │
    ▼                                                  ▼               ▼
payment_intent.succeeded              checkout.session.completed   invoice.paid
    │                                          │                       │
    ▼                                          ▼                       ▼
WebhookHandlerService                  CheckoutService           InvoiceService
.handlePaymentIntentSucceeded()        .handleSessionCompleted() .syncFromStripe()
    │                                          │                       │
    ▼                                          ▼                       ▼
INSERT payment_transactions            UPDATE checkout_sessions   UPDATE invoices
SET status = 'succeeded'               SET status = 'complete'   SET status = 'paid'
    │
    ▼
Extract: card_brand, card_last4, receipt_url, application_fee_amount
```

### Data Flow: Subscription Lifecycle

```
                    ┌──────────┐
                    │  create  │ SubscriptionService.create()
                    └────┬─────┘
                         │
              ┌──────────▼──────────┐
              │    trialing         │ (if trialDays > 0)
              │                     │
              │ trial_will_end ─────┼──▶ Notification (future)
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐     ┌───────────────┐
              │     active          │◀────│   resume()    │
              │                     │     └───────────────┘
              │                     │
              │ update (prorate) ◀──┼──── SubscriptionService.update()
              │ applyDiscount    ◀──┤
              │                     │     ┌───────────────┐
              │     pause() ────────┼────▶│   paused      │
              │                     │     └───────────────┘
              └───┬─────────────┬───┘
                  │             │
    ┌─────────────▼─┐   ┌──────▼────────┐
    │   past_due    │   │  canceled     │ cancel(immediately: true)
    │               │   │               │ OR subscription.deleted webhook
    │ payment_failed│   └───────────────┘
    │ retries...    │
    └───────┬───────┘
            │
    ┌───────▼───────┐
    │    unpaid     │ All retries exhausted
    └───────────────┘
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `stripe` | `^14.0.0` | Stripe Node.js SDK (API version `2024-12-18.acacia`) |
| `@mcv/db` | `workspace:*` | Database connection + Drizzle ORM (PostgreSQL) |
| `@mcv/secrets` | `workspace:*` | GCP Secret Manager for Stripe credential retrieval |
| `react` | `^18.x` | Client-side hooks (peer dependency) |
| `drizzle-orm` | `^0.30.x` | Type-safe SQL query builder (via @mcv/db) |

### Peer Dependencies (Implicit via @mcv/db)

| Package | Purpose |
|---------|---------|
| `pg` | PostgreSQL driver |
| `drizzle-orm/pg-core` | PostgreSQL schema definitions, pgEnum, pgTable |
| `drizzle-orm` | Relations, query builder, SQL helpers |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | Yes* | — | Platform secret key (fallback if vault unavailable) |
| `STRIPE_WEBHOOK_SECRET` | Yes* | — | Platform webhook endpoint signing secret |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | No | — | Separate secret for Connect account webhooks |

> **\*** Credentials are loaded from GCP Secret Manager (`mcv-system-stripe-master`) with environment variable fallback. At least one source must be configured.

### Vault Secret Structure

The GCP Secret Manager secret `projects/mcv-one-prototype/secrets/mcv-system-stripe-master/versions/latest` stores:

```json
{
  "secretKey": "sk_live_...",
  "webhookSecret": "whsec_...",
  "connectWebhookSecret": "whsec_..."
}
```

### Credential Resolution Order

```
1. GCP Secret Manager: SecretManagerService.getSecret(
     'projects/mcv-one-prototype/secrets/mcv-system-stripe-master/versions/latest'
   )
2. Environment Variables: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
3. Throw Error: "Stripe credentials not found..."
```

---

## TypeScript Interfaces

All types are defined in `packages/payments/src/types.ts` and exported from the root package.

### Stripe Account Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Stripe Account Types
// ═══════════════════════════════════════════════════════════════════════════════

export type StripeAccountType = 'standard' | 'express' | 'custom';
export type StripeAccountStatus = 'pending' | 'active' | 'restricted' | 'disabled';

export interface CreateConnectedAccountInput {
  type?: StripeAccountType;           // default: 'express'
  businessProfile?: {
    name?: string;
    url?: string;
    supportEmail?: string;
    supportPhone?: string;
  };
  country?: string;                   // default: 'US'
  email?: string;
}

export interface OnboardingLinkInput {
  refreshUrl: string;                 // URL if link expires
  returnUrl: string;                  // URL after completion
}

export interface AccountBalance {
  available: BalanceAmount[];
  pending: BalanceAmount[];
}

export interface BalanceAmount {
  amount: number;                     // in smallest currency unit (cents for USD)
  currency: string;
}
```

### Product & Price Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Product & Price Types
// ═══════════════════════════════════════════════════════════════════════════════

export type ProductType = 'one_time' | 'recurring' | 'metered';
export type PriceType = 'one_time' | 'recurring';
export type PriceInterval = 'day' | 'week' | 'month' | 'year';

export interface CreateProductInput {
  name: string;
  description?: string;
  images?: string[];                  // URLs; first image used as imageUrl in DB
  type?: ProductType;                 // default: 'one_time'
  metadata?: Record<string, string>;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  images?: string[];
  metadata?: Record<string, string>;
}

export interface CreatePriceInput {
  amount: number;                     // in cents (e.g., 1999 = $19.99)
  currency?: string;                  // default: 'usd'
  interval?: PriceInterval;           // set for recurring prices
  intervalCount?: number;             // default: 1 (e.g., 2 = every 2 months)
  trialDays?: number;                 // free trial period
  metadata?: Record<string, string>;
}

export interface UpdatePriceInput {
  active?: boolean;                   // deactivate price (Stripe: immutable amounts)
  metadata?: Record<string, string>;
}
```

### Customer Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Customer Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreateCustomerInput {
  email: string;
  name?: string;
  contactId?: string;                 // Links to CRM contact
  metadata?: Record<string, string>;
}

export interface UpdateCustomerInput {
  email?: string;
  name?: string;
  defaultPaymentMethod?: string;      // Stripe payment method ID
  metadata?: Record<string, string>;
}
```

### Subscription Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Subscription Types
// ═══════════════════════════════════════════════════════════════════════════════

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'trialing'
  | 'paused';

export interface CreateSubscriptionInput {
  customerId: string;                 // Local customer UUID
  priceId: string;                    // Local price UUID
  quantity?: number;                  // default: 1
  trialDays?: number;                 // override price-level trial
  applicationFeePercent?: number;     // overrides venture default (0-100)
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionInput {
  priceId?: string;                   // Plan change (prorated)
  quantity?: number;                  // Seat change (prorated)
  metadata?: Record<string, string>;
}

export interface CancelSubscriptionInput {
  immediately?: boolean;              // Cancel now (vs. end of period)
  cancelAtPeriodEnd?: boolean;        // default: true
}
```

### Invoice Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Invoice Types
// ═══════════════════════════════════════════════════════════════════════════════

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface CreateInvoiceInput {
  customerId: string;
  lineItems: InvoiceLineItemInput[];
  dueDate?: Date;                     // default: 30 days from creation
  memo?: string;
  metadata?: Record<string, string>;
}

export interface UpdateInvoiceInput {
  dueDate?: Date;
  memo?: string;
  metadata?: Record<string, string>;
}

export interface InvoiceLineItemInput {
  description: string;
  amount: number;                     // unit price in cents
  quantity: number;
}

export interface AddLineItemInput {
  description: string;
  amount: number;                     // unit price in cents
  quantity: number;
}
```

### Checkout Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Checkout Types
// ═══════════════════════════════════════════════════════════════════════════════

export type CheckoutMode = 'payment' | 'subscription' | 'setup';
export type CheckoutSessionStatus = 'open' | 'complete' | 'expired';

export interface CreateCheckoutSessionInput {
  lineItems: CheckoutLineItemInput[];
  mode: CheckoutMode;
  customerId?: string;                // Pre-fill customer details
  successUrl: string;                 // Supports {CHECKOUT_SESSION_ID} placeholder
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutLineItemInput {
  priceId: string;                    // Local price UUID (resolved to Stripe price)
  quantity: number;
}

export interface CreatePaymentLinkInput {
  lineItems: CheckoutLineItemInput[];
  metadata?: Record<string, string>;
}
```

### Refund & Dispute Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Refund Types
// ═══════════════════════════════════════════════════════════════════════════════

export type RefundStatus = 'pending' | 'succeeded' | 'failed' | 'canceled';
export type RefundReason = 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';

export interface CreateRefundInput {
  paymentId: string;                  // Local payment UUID
  amount?: number;                    // Partial refund in cents; omit for full refund
  reason?: RefundReason;
  notes?: string;                     // Internal note, not sent to Stripe
}

// ═══════════════════════════════════════════════════════════════════════════════
// Dispute Types
// ═══════════════════════════════════════════════════════════════════════════════

export type DisputeStatus =
  | 'warning_needs_response'
  | 'warning_under_review'
  | 'needs_response'
  | 'under_review'
  | 'charge_refunded'
  | 'won'
  | 'lost';
```

### Payment Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Payment Types
// ═══════════════════════════════════════════════════════════════════════════════

export type PaymentStatus =
  | 'succeeded'
  | 'pending'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type PaymentMethodType = 'card' | 'bank_transfer' | 'ach';

// ═══════════════════════════════════════════════════════════════════════════════
// Payout Types
// ═══════════════════════════════════════════════════════════════════════════════

export type PayoutStatus = 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';
export type PayoutMethod = 'standard' | 'instant';
```

### Reporting Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Reporting Types
// ═══════════════════════════════════════════════════════════════════════════════

export type ReportGranularity = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface DateRangeInput {
  from: Date;
  to: Date;
}

export interface RevenueTimelinePoint {
  date: string;                       // ISO date or truncated period
  revenue: number;                    // in cents
  count: number;                      // number of transactions
}

export interface RevenueByProduct {
  productId: string;
  productName: string;
  revenue: number;                    // in cents
  count: number;
}

export interface PaymentMethodBreakdown {
  method: string;                     // 'card', 'bank_transfer', 'ach', 'unknown'
  count: number;
  amount: number;                     // in cents
  percentage: number;                 // 0-100
}

export interface MrrMetrics {
  mrr: number;                        // Current MRR in cents
  previousMrr: number;               // Last month approximation
  growthRate: number;                 // Percentage (e.g., 12.5 = 12.5%)
  newMrr: number;                    // From new subscriptions this month
  churnedMrr: number;                // Lost from cancellations this month
  expansionMrr: number;              // Net of upgrades minus downgrades
}

export interface ChurnMetrics {
  churnRate: number;                  // Percentage
  churnedSubscriptions: number;
  totalSubscriptions: number;
  period: string;                     // 'month', 'quarter', 'year'
}

export interface LtvMetrics {
  averageLtv: number;                 // Average customer lifetime value (cents)
  medianLtv: number;                  // Approximated as average (window fn TODO)
  averageLifespanMonths: number;      // Average subscription duration
  averageRevenuePerCustomer: number;  // Total revenue / customer count (cents)
}
```

### Webhook Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// Webhook Types
// ═══════════════════════════════════════════════════════════════════════════════

export interface StripeWebhookEvent {
  id: string;                         // evt_...
  type: string;                       // e.g., 'payment_intent.succeeded'
  data: {
    object: Record<string, unknown>;
    previous_attributes?: Record<string, unknown>;
  };
  account?: string;                   // Connected account ID (for Connect events)
  livemode: boolean;
  created: number;                    // Unix timestamp
}
```

### List Filters & Pagination

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// List Filters
// ═══════════════════════════════════════════════════════════════════════════════

export interface PaginationInput {
  page?: number;                      // default: 1
  pageSize?: number;                  // default: 20
}

export interface ListProductsFilter extends PaginationInput {
  type?: ProductType;
  active?: boolean;
  search?: string;                    // ILIKE name search
}

export interface ListSubscriptionsFilter extends PaginationInput {
  status?: SubscriptionStatus;
  customerId?: string;
}

export interface ListInvoicesFilter extends PaginationInput {
  status?: InvoiceStatus;
  customerId?: string;
  subscriptionId?: string;
}

export interface ListPaymentsFilter extends PaginationInput {
  status?: PaymentStatus;
  customerId?: string;
  dateRange?: DateRangeInput;
}

export interface ListAccountsFilter extends PaginationInput {
  status?: StripeAccountStatus;
}
```

---

## Database Schema

### Overview

All payment tables live in `packages/db/src/schema/payments.ts`. The schema uses Drizzle ORM with PostgreSQL, defining 14 tables with 17 pgEnum types and 28+ composite indexes.

### Tables

| Table | Purpose | Row Estimate | Key Columns |
|-------|---------|--------------|-------------|
| `stripe_accounts` | Connected accounts per venture | 1 per venture | `stripe_account_id`, `status`, `charges_enabled`, `application_fee_percent` |
| `payment_products` | Product catalog | 10-100/venture | `stripe_product_id`, `name`, `type`, `is_active` |
| `payment_prices` | Pricing tiers | 1-5/product | `stripe_price_id`, `unit_amount`, `interval`, `trial_days` |
| `payment_customers` | Customers mapped to CRM contacts | 10-10K/venture | `stripe_customer_id`, `contact_id`, `email`, `balance` |
| `payment_subscriptions` | Recurring billing records | 1-5K/venture | `stripe_subscription_id`, `status`, `current_period_end`, `trial_end` |
| `payment_invoices` | Invoice records | 1-50K/venture | `stripe_invoice_id`, `status`, `total`, `amount_due`, `line_items` |
| `payment_transactions` | Payment records | 1-100K/venture | `stripe_payment_intent_id`, `amount`, `status`, `card_last4` |
| `payment_refunds` | Refund records | 1-5% of transactions | `stripe_refund_id`, `amount`, `reason`, `notes` |
| `payment_disputes` | Dispute tracking | <1% of transactions | `stripe_dispute_id`, `status`, `evidence_due_by`, `evidence` |
| `payment_payouts` | Payout tracking | 1-4/month/venture | `stripe_payout_id`, `amount`, `arrival_date`, `failure_code` |
| `payment_tax_rates` | Tax rate definitions | 1-10/venture | `stripe_tax_rate_id`, `percentage`, `jurisdiction`, `inclusive` |
| `payment_checkout_sessions` | Checkout sessions | 1-50K/venture | `stripe_session_id`, `mode`, `status`, `total_amount` |
| `payment_links` | Reusable payment links | 1-50/venture | `stripe_payment_link_id`, `url`, `active` |

### Enum Definitions (PostgreSQL)

```sql
-- Account Management
CREATE TYPE stripe_account_type AS ENUM ('standard', 'express', 'custom');
CREATE TYPE stripe_account_status AS ENUM ('pending', 'active', 'restricted', 'disabled');

-- Product & Pricing
CREATE TYPE payment_product_type AS ENUM ('one_time', 'recurring', 'metered');
CREATE TYPE payment_price_type AS ENUM ('one_time', 'recurring');
CREATE TYPE payment_price_interval AS ENUM ('day', 'week', 'month', 'year');

-- Subscription Lifecycle
CREATE TYPE payment_subscription_status AS ENUM (
  'active', 'past_due', 'canceled', 'unpaid', 'trialing', 'paused'
);

-- Invoice Workflow
CREATE TYPE payment_invoice_status AS ENUM (
  'draft', 'open', 'paid', 'void', 'uncollectible'
);

-- Payment Processing
CREATE TYPE payment_status AS ENUM (
  'succeeded', 'pending', 'failed', 'refunded', 'partially_refunded'
);
CREATE TYPE payment_method_type AS ENUM ('card', 'bank_transfer', 'ach');

-- Refunds & Disputes
CREATE TYPE payment_refund_status AS ENUM ('pending', 'succeeded', 'failed', 'canceled');
CREATE TYPE payment_refund_reason AS ENUM (
  'duplicate', 'fraudulent', 'requested_by_customer', 'other'
);
CREATE TYPE payment_dispute_status AS ENUM (
  'warning_needs_response', 'warning_under_review', 'needs_response',
  'under_review', 'charge_refunded', 'won', 'lost'
);

-- Payouts
CREATE TYPE payment_payout_status AS ENUM ('paid', 'pending', 'in_transit', 'canceled', 'failed');
CREATE TYPE payment_payout_method AS ENUM ('standard', 'instant');

-- Checkout
CREATE TYPE payment_checkout_mode AS ENUM ('payment', 'subscription', 'setup');
CREATE TYPE payment_checkout_session_status AS ENUM ('open', 'complete', 'expired');
```

### Drizzle ORM Table Definitions

#### stripe_accounts

```typescript
export const stripeAccounts = pgTable(
  'stripe_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id')
      .references(() => ventures.id, { onDelete: 'cascade' })
      .notNull(),
    stripeAccountId: text('stripe_account_id').notNull().unique(),
    accountType: stripeAccountTypeEnum('account_type').notNull().default('express'),
    status: stripeAccountStatusEnum('status').notNull().default('pending'),
    businessName: text('business_name'),
    email: text('email'),
    country: text('country').default('US'),
    currency: text('currency').default('usd'),
    chargesEnabled: boolean('charges_enabled').default(false),
    payoutsEnabled: boolean('payouts_enabled').default(false),
    detailsSubmitted: boolean('details_submitted').default(false),
    onboardingUrl: text('onboarding_url'),
    applicationFeePercent: numeric('application_fee_percent', {
      precision: 5, scale: 2,
    }).default('0.00'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('stripe_account_venture_idx').on(table.ventureId),
    index('stripe_account_stripe_id_idx').on(table.stripeAccountId),
    index('stripe_account_status_idx').on(table.status),
  ]
);
```

#### payment_customers

```typescript
export const paymentCustomers = pgTable(
  'payment_customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id')
      .references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
    contactId: uuid('contact_id')
      .references(() => contacts.id, { onDelete: 'set null' }),
    stripeCustomerId: text('stripe_customer_id').unique(),
    email: text('email'),
    name: text('name'),
    defaultPaymentMethod: text('default_payment_method'),
    currency: text('currency').default('usd'),
    balance: integer('balance').default(0),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('payment_customer_venture_idx').on(table.ventureId),
    index('payment_customer_contact_idx').on(table.contactId),
    index('payment_customer_stripe_idx').on(table.stripeCustomerId),
    index('payment_customer_email_idx').on(table.ventureId, table.email),
  ]
);
```

#### payment_transactions

```typescript
export const payments = pgTable(
  'payment_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id')
      .references(() => ventures.id, { onDelete: 'cascade' }).notNull(),
    customerId: uuid('customer_id')
      .references(() => paymentCustomers.id, { onDelete: 'cascade' }).notNull(),
    invoiceId: uuid('invoice_id')
      .references(() => invoices.id, { onDelete: 'set null' }),
    stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
    stripeChargeId: text('stripe_charge_id'),
    amount: integer('amount').notNull(),                  // cents
    currency: text('currency').notNull().default('usd'),
    status: paymentStatusEnum('status').notNull().default('pending'),
    paymentMethod: paymentMethodTypeEnum('payment_method'),
    cardBrand: text('card_brand'),                        // visa, mastercard, amex
    cardLast4: text('card_last4'),                        // 4242
    receiptUrl: text('receipt_url'),
    applicationFeeAmount: integer('application_fee_amount'),
    refundedAmount: integer('refunded_amount').default(0),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('payment_tx_venture_idx').on(table.ventureId),
    index('payment_tx_customer_idx').on(table.customerId),
    index('payment_tx_invoice_idx').on(table.invoiceId),
    index('payment_tx_stripe_pi_idx').on(table.stripePaymentIntentId),
    index('payment_tx_status_idx').on(table.ventureId, table.status),
    index('payment_tx_created_idx').on(table.createdAt),
  ]
);
```

### Entity Relationship Diagram

```
ventures ──1:1──▶ stripe_accounts
    │
    ├──1:N──▶ payment_products ──1:N──▶ payment_prices
    │                                         │
    │                                         │ (referenced by)
    │                                         ▼
    ├──1:N──▶ payment_customers ──1:N──▶ payment_subscriptions
    │              │                         │
    │              ├──1:N──▶ payment_invoices ◀── payment_subscriptions
    │              │              │
    │              └──1:N──▶ payment_transactions ──1:N──▶ payment_refunds
    │                             │
    │                             └──1:N──▶ payment_disputes
    │
    ├──1:N──▶ payment_payouts
    ├──1:N──▶ payment_tax_rates
    ├──1:N──▶ payment_checkout_sessions
    └──1:N──▶ payment_links

contacts ──1:1──▶ payment_customers (CRM integration)
```

### Complete Index Catalog

| Index Name | Table | Columns | Purpose |
|-----------|-------|---------|---------|
| `stripe_account_venture_idx` | stripe_accounts | (venture_id) | Fast account lookup by venture |
| `stripe_account_stripe_id_idx` | stripe_accounts | (stripe_account_id) | Webhook event routing |
| `stripe_account_status_idx` | stripe_accounts | (status) | Admin account filtering |
| `payment_product_venture_idx` | payment_products | (venture_id) | Venture scoping |
| `payment_product_stripe_idx` | payment_products | (stripe_product_id) | Stripe sync |
| `payment_product_active_idx` | payment_products | (venture_id, is_active) | Active product listing |
| `payment_price_venture_idx` | payment_prices | (venture_id) | Venture scoping |
| `payment_price_product_idx` | payment_prices | (product_id) | Product→price lookup |
| `payment_price_stripe_idx` | payment_prices | (stripe_price_id) | Stripe sync |
| `payment_price_active_idx` | payment_prices | (venture_id, is_active) | Active price listing |
| `payment_customer_venture_idx` | payment_customers | (venture_id) | Venture scoping |
| `payment_customer_contact_idx` | payment_customers | (contact_id) | CRM contact lookup |
| `payment_customer_stripe_idx` | payment_customers | (stripe_customer_id) | Webhook customer resolution |
| `payment_customer_email_idx` | payment_customers | (venture_id, email) | Email lookup within venture |
| `payment_subscription_venture_idx` | payment_subscriptions | (venture_id) | Venture scoping |
| `payment_subscription_customer_idx` | payment_subscriptions | (customer_id) | Customer subscriptions |
| `payment_subscription_stripe_idx` | payment_subscriptions | (stripe_subscription_id) | Webhook sync |
| `payment_subscription_status_idx` | payment_subscriptions | (venture_id, status) | Status filtering |
| `payment_subscription_period_idx` | payment_subscriptions | (current_period_end) | Renewal detection |
| `payment_invoice_venture_idx` | payment_invoices | (venture_id) | Venture scoping |
| `payment_invoice_status_idx` | payment_invoices | (venture_id, status) | Status filtering |
| `payment_invoice_due_date_idx` | payment_invoices | (due_date) | Overdue detection |
| `payment_tx_venture_idx` | payment_transactions | (venture_id) | Venture scoping |
| `payment_tx_status_idx` | payment_transactions | (venture_id, status) | Status filtering |
| `payment_tx_created_idx` | payment_transactions | (created_at) | Time-series queries |
| `payment_dispute_status_idx` | payment_disputes | (venture_id, status) | Active dispute listing |
| `payment_payout_status_idx` | payment_payouts | (venture_id, status) | Payout status filtering |
| `payment_checkout_status_idx` | payment_checkout_sessions | (venture_id, status) | Active session lookup |

---

## Server Services

### StripeConnectService

Manages the Stripe Connected Account lifecycle for each venture. This is the foundation — all other services depend on the connected account existing.

| Method | Signature | Description |
|--------|-----------|-------------|
| `createConnectedAccount` | `(ventureId, input: CreateConnectedAccountInput)` | Creates Express/Standard/Custom connected account in Stripe + DB |
| `generateOnboardingLink` | `(ventureId, input: OnboardingLinkInput)` | Generates Stripe Account Link for KYC/identity verification |
| `getAccount` | `(ventureId)` | Fetches account with live Stripe sync (auto-updates status) |
| `getBalance` | `(ventureId): Promise<AccountBalance>` | Returns available + pending balance per currency |
| `updateApplicationFee` | `(ventureId, feePercent: number)` | Sets platform fee (0–100%), validated |
| `listConnectedAccounts` | `(filters: ListAccountsFilter)` | Super admin: paginated list of all connected accounts |
| `handleAccountUpdated` | `(stripeAccountId: string)` | Webhook handler for `account.updated` events |
| `getStripeAccountId` | `(ventureId): Promise<string \| null>` | Helper: get raw Stripe account ID for a venture |
| `getApplicationFeePercent` | `(ventureId): Promise<number>` | Helper: get fee % (used by Checkout/Subscription services) |

**Account Status Derivation Logic:**

```typescript
private deriveAccountStatus(account: Stripe.Account):
  'pending' | 'active' | 'restricted' | 'disabled' {

  if (account.charges_enabled && account.payouts_enabled) return 'active';
  if (account.details_submitted && !account.charges_enabled) return 'restricted';
  if (!account.details_submitted) return 'pending';
  return 'restricted';
}
```

### ProductService

Full product catalog CRUD with bidirectional Stripe sync. Products are created in Stripe on the connected account and mirrored locally.

| Method | Signature | Description |
|--------|-----------|-------------|
| `createProduct` | `(ventureId, input: CreateProductInput)` | Creates product in Stripe + local DB |
| `createPrice` | `(ventureId, productId, input: CreatePriceInput)` | Creates price tier linked to product |
| `updateProduct` | `(ventureId, productId, input: UpdateProductInput)` | Updates name, description, images, metadata |
| `updatePrice` | `(ventureId, priceId, input: UpdatePriceInput)` | Updates active status and metadata only (Stripe immutability) |
| `archiveProduct` | `(ventureId, productId)` | Soft-deletes: sets Stripe `active: false` |
| `archivePrice` | `(ventureId, priceId)` | Deactivates price in Stripe and local DB |
| `listProducts` | `(ventureId, filters: ListProductsFilter)` | Paginated list with type/active/search filters |
| `getProduct` | `(ventureId, productId)` | Single product with all associated prices |
| `listPrices` | `(ventureId, productId)` | Active prices for a product |

### SubscriptionService

Complete subscription lifecycle management with Stripe sync, proration, trials, and dunning.

| Method | Signature | Description |
|--------|-----------|-------------|
| `create` | `(ventureId, input: CreateSubscriptionInput)` | Creates subscription with optional trial period |
| `update` | `(ventureId, id, input: UpdateSubscriptionInput)` | Prorated plan/quantity changes |
| `cancel` | `(ventureId, id, input?: CancelSubscriptionInput)` | Immediate or end-of-period cancellation |
| `pause` | `(ventureId, id)` | Pauses billing (Stripe `pause_collection: { behavior: 'void' }`) |
| `resume` | `(ventureId, id)` | Resumes paused subscription |
| `listSubscriptions` | `(ventureId, filters: ListSubscriptionsFilter)` | Filter by status, customer, with pagination |
| `getUpcomingInvoice` | `(ventureId, id)` | Preview next charge amount and line items |
| `applyDiscount` | `(ventureId, id, couponId)` | Apply Stripe coupon to subscription |
| `syncFromStripe` | `(stripeSubscriptionId, data: Stripe.Subscription)` | Webhook sync: periods, trial dates, cancel info |

**Stripe → Local Status Mapping:**

```typescript
const mapping: Record<string, SubscriptionStatus> = {
  active:               'active',
  past_due:             'past_due',
  canceled:             'canceled',
  unpaid:               'unpaid',
  trialing:             'trialing',
  paused:               'paused',
  incomplete:           'past_due',       // Mapped: initial payment hasn't succeeded
  incomplete_expired:   'canceled',       // Mapped: initial payment window expired
};
```

### InvoiceService

Draft → Finalize → Send → Pay workflow with Stripe-hosted payment pages.

| Method | Signature | Description |
|--------|-----------|-------------|
| `create` | `(ventureId, input: CreateInvoiceInput)` | Creates draft invoice with line items in Stripe + DB |
| `update` | `(ventureId, id, input: UpdateInvoiceInput)` | Updates draft invoice (memo, due date, metadata) |
| `send` | `(ventureId, id)` | Finalizes + emails invoice via Stripe; gets hosted URL + PDF |
| `void` | `(ventureId, id)` | Voids unpaid invoice (guards: not paid, not already void) |
| `markUncollectible` | `(ventureId, id)` | Marks invoice as uncollectible in Stripe + DB |
| `addLineItem` | `(ventureId, id, input: AddLineItemInput)` | Adds line item to draft; recalculates totals |
| `listInvoices` | `(ventureId, filters: ListInvoicesFilter)` | Filter by status, customer, subscription |
| `syncFromStripe` | `(stripeInvoiceId, data: Stripe.Invoice)` | Webhook sync: amounts, status, URLs |

### CheckoutService

Stripe-hosted checkout sessions and reusable payment links with automatic application fee calculation.

| Method | Signature | Description |
|--------|-----------|-------------|
| `createSession` | `(ventureId, input: CreateCheckoutSessionInput)` | Creates Stripe Checkout session with fees |
| `createPaymentLink` | `(ventureId, input: CreatePaymentLinkInput)` | Creates reusable payment link on connected account |
| `getSession` | `(ventureId, sessionId)` | Get session status from local DB |
| `expireSession` | `(ventureId, sessionId)` | Manually expire open session (Stripe + DB) |
| `handleSessionCompleted` | `(stripeSessionId)` | Webhook: marks session complete with timestamp |

**Fee Calculation for Checkout Sessions:**

```typescript
// For one-time payments (mode: 'payment'):
payment_intent_data: {
  transfer_data: { destination: stripeAccountId },
}

// For subscriptions (mode: 'subscription'):
subscription_data: {
  application_fee_percent: feePercent,  // From venture's stripe_accounts.application_fee_percent
  transfer_data: { destination: stripeAccountId },
}
```

### RefundService

Full and partial refunds with over-refund prevention and dispute management.

| Method | Signature | Description |
|--------|-----------|-------------|
| `createRefund` | `(ventureId, input: CreateRefundInput)` | Full/partial refund with amount validation |
| `listRefunds` | `(ventureId, filters)` | List refunds, optionally filter by paymentId |
| `handleDisputeCreated` | `(stripeDisputeId, data: Stripe.Dispute)` | Creates dispute record from webhook |
| `handleDisputeUpdated` | `(stripeDisputeId, data: Stripe.Dispute)` | Updates dispute status, evidence due date |
| `submitEvidence` | `(ventureId, disputeId, evidence)` | Submit dispute evidence to Stripe |
| `listDisputes` | `(ventureId, filters)` | List disputes by status |
| `syncRefundFromStripe` | `(stripeRefundId, data: Stripe.Refund)` | Webhook sync for refund status |

**Refund Validation Logic:**

```typescript
// 1. Payment must be in refundable state
if (payment.status !== 'succeeded' && payment.status !== 'partially_refunded') {
  throw new Error('Payment cannot be refunded');
}

// 2. Amount check: prevent over-refunding
const refundAmount = input.amount || payment.amount;  // Full refund if no amount
const alreadyRefunded = payment.refundedAmount || 0;

if (alreadyRefunded + refundAmount > payment.amount) {
  throw new Error('Refund amount exceeds payment amount');
}

// 3. After refund: update payment status
const newStatus = (alreadyRefunded + refundAmount >= payment.amount)
  ? 'refunded'            // Fully refunded
  : 'partially_refunded'; // Still has remaining amount
```

### PayoutService

Connected account payout management with balance checking.

| Method | Signature | Description |
|--------|-----------|-------------|
| `createPayout` | `(ventureId, options)` | Standard or instant payout to bank account |
| `getBalance` | `(ventureId)` | Delegates to StripeConnectService.getBalance |
| `listPayouts` | `(ventureId, filters)` | Filter payouts by status |
| `createTransfer` | `(ventureId, options)` | Platform → connected account transfer |
| `syncFromStripe` | `(stripePayoutId, data: Stripe.Payout)` | Webhook sync: status, arrival, failure info |

### ReportingService

Revenue analytics engine powered by SQL aggregations. All monetary values in cents.

| Method | Signature | Description |
|--------|-----------|-------------|
| `getMrr` | `(ventureId): Promise<MrrMetrics>` | MRR with growth decomposition (new, churned, expansion) |
| `getArr` | `(ventureId): Promise<number>` | Annual Recurring Revenue (MRR × 12) |
| `getChurnRate` | `(ventureId, period): Promise<ChurnMetrics>` | Churn rate for month/quarter/year |
| `getLtv` | `(ventureId): Promise<LtvMetrics>` | Customer Lifetime Value from payment history |
| `getRevenueTimeline` | `(ventureId, range, granularity)` | Revenue over time by day/week/month/quarter/year |
| `getRevenueByProduct` | `(ventureId, range)` | Revenue breakdown per product |
| `getPaymentMethodBreakdown` | `(ventureId)` | Card vs bank vs ACH distribution |
| `getPlatformRevenue` | `(range)` | Super admin: total platform application fees |
| `getOutstandingInvoices` | `(ventureId)` | Open + overdue invoice summary |

**MRR Calculation — Interval Normalization:**

```sql
-- Normalizes all billing intervals to monthly equivalent:
CASE
  WHEN interval = 'month' THEN unit_amount × quantity
  WHEN interval = 'year'  THEN unit_amount × quantity / 12
  WHEN interval = 'week'  THEN unit_amount × quantity × 4
  WHEN interval = 'day'   THEN unit_amount × quantity × 30
  ELSE 0
END
```

**MRR Growth Decomposition:**

```
MRR Decomposition:
  currentMrr    = SUM of active subscriptions (normalized to monthly)
  newMrr        = SUM of subscriptions created this month
  churnedMrr    = SUM of subscriptions canceled this month
  previousMrr   = currentMrr - newMrr + churnedMrr
  expansionMrr  = MAX(0, currentMrr - previousMrr - newMrr + churnedMrr)
  growthRate    = (currentMrr - previousMrr) / previousMrr × 100
```

### WebhookHandlerService

Central Stripe event router. Receives verified webhook events and dispatches to appropriate service handlers via switch statement (O(1) dispatch).

| Stripe Event | Handler Method | Action |
|-------------|----------------|--------|
| `payment_intent.succeeded` | `handlePaymentIntentSucceeded` | Upsert payment record with card details |
| `payment_intent.payment_failed` | `handlePaymentIntentFailed` | Mark payment as failed |
| `invoice.created` | `handleInvoiceSync` | Sync invoice state from Stripe |
| `invoice.finalized` | `handleInvoiceSync` | Sync invoice state from Stripe |
| `invoice.paid` | `handleInvoicePaid` | Mark paid, update amounts, set paidAt |
| `invoice.payment_failed` | `handleInvoicePaymentFailed` | Reset invoice to open status |
| `customer.subscription.created` | `handleSubscriptionSync` | Sync subscription periods, status |
| `customer.subscription.updated` | `handleSubscriptionSync` | Sync subscription periods, status |
| `customer.subscription.deleted` | `handleSubscriptionDeleted` | Mark canceled with timestamp |
| `customer.subscription.trial_will_end` | `handleTrialWillEnd` | Log (future: trigger notification) |
| `checkout.session.completed` | `checkoutService.handleSessionCompleted` | Mark session complete |
| `charge.refunded` | `handleChargeRefunded` | Update refunded amount and status |
| `charge.dispute.created` | `refundService.handleDisputeCreated` | Create dispute record |
| `charge.dispute.closed` | `refundService.handleDisputeUpdated` | Update dispute status |
| `charge.dispute.updated` | `refundService.handleDisputeUpdated` | Update dispute evidence/status |
| `account.updated` | `stripeConnectService.handleAccountUpdated` | Sync connected account state |
| `payout.paid` | `payoutService.syncFromStripe` | Mark payout paid |
| `payout.failed` | `payoutService.syncFromStripe` | Record failure code/message |

**Payment Method Extraction from Charges:**

```typescript
private extractPaymentMethod(charge: Stripe.Charge | null):
  'card' | 'bank_transfer' | 'ach' | null {

  if (!charge?.payment_method_details) return null;
  const type = charge.payment_method_details.type;

  if (type === 'card') return 'card';
  if (type === 'ach_debit' || type === 'ach_credit_transfer') return 'ach';
  if (type === 'customer_balance' || type === 'bank_transfer') return 'bank_transfer';
  return 'card'; // Default fallback
}
```

---

## Client Hooks (React)

All hooks use the `'use client'` directive and communicate with the server via `fetch()` with `x-venture-id` header for multi-tenant scoping.

### `useCheckout(options: UseCheckoutOptions)`

```typescript
interface UseCheckoutOptions {
  ventureId: string;
}

interface UseCheckoutResult {
  isLoading: boolean;
  error: Error | null;
  createSession: (input: CreateCheckoutSessionInput) => Promise<{ url: string | null }>;
  createPaymentLink: (input: CreatePaymentLinkInput) => Promise<{ url: string | null }>;
  redirectToCheckout: (input: CreateCheckoutSessionInput) => Promise<void>;
}
```

**API Endpoints Used:**
- `POST /api/payments/checkout/sessions`
- `POST /api/payments/payment-links`

### `useSubscriptions(options: UseSubscriptionsOptions)`

```typescript
interface UseSubscriptionsOptions {
  ventureId: string;
  customerId?: string;
  status?: SubscriptionStatus;
  enabled?: boolean;                  // default: true, controls auto-fetch
}

interface UseSubscriptionsResult {
  subscriptions: SubscriptionRecord[];
  isLoading: boolean;
  error: Error | null;
  total: number;
  create: (input: CreateSubscriptionInput) => Promise<SubscriptionRecord>;
  update: (id: string, input: UpdateSubscriptionInput) => Promise<SubscriptionRecord>;
  cancel: (id: string, input?: CancelSubscriptionInput) => Promise<SubscriptionRecord>;
  pause: (id: string) => Promise<SubscriptionRecord>;
  resume: (id: string) => Promise<SubscriptionRecord>;
  refresh: () => Promise<void>;       // Manual re-fetch
}
```

**Auto-fetch:** Subscriptions are loaded on mount and when filter params change. Each mutation (create/update/cancel/pause/resume) auto-refreshes the list.

### `useInvoices(options: UseInvoicesOptions)`

```typescript
interface UseInvoicesOptions {
  ventureId: string;
  customerId?: string;
  status?: InvoiceStatus;
  subscriptionId?: string;
  enabled?: boolean;
}

interface UseInvoicesResult {
  invoices: InvoiceRecord[];
  isLoading: boolean;
  error: Error | null;
  total: number;
  create: (input: CreateInvoiceInput) => Promise<InvoiceRecord>;
  send: (id: string) => Promise<InvoiceRecord>;
  voidInvoice: (id: string) => Promise<InvoiceRecord>;
  markUncollectible: (id: string) => Promise<InvoiceRecord>;
  addLineItem: (id: string, input: AddLineItemInput) => Promise<InvoiceRecord>;
  refresh: () => Promise<void>;
}
```

### `useRevenue(options: UseRevenueOptions)`

```typescript
interface UseRevenueOptions {
  ventureId: string;
  dateRange?: { from: string; to: string };
  granularity?: ReportGranularity;    // default: 'day'
  enabled?: boolean;
}

interface UseRevenueResult {
  mrr: MrrMetrics | null;
  arr: number | null;
  churn: ChurnMetrics | null;
  ltv: LtvMetrics | null;
  timeline: RevenueTimelinePoint[];
  byProduct: RevenueByProduct[];
  paymentMethods: PaymentMethodBreakdown[];
  outstanding: { count: number; totalAmount: number; overdueCount: number; overdueAmount: number } | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}
```

**Performance:** Uses `Promise.allSettled` to fetch all 8 reporting endpoints in parallel. Individual endpoint failures don't block the entire dashboard — partial data is still rendered.

---

## Code Examples

### 1. Onboard a Venture to Stripe Connect

```typescript
import { stripeConnectService } from '@mcv/payments/server';

// Step 1: Create connected account
const account = await stripeConnectService.createConnectedAccount(ventureId, {
  type: 'express',
  email: 'owner@venture.com',
  businessProfile: {
    name: 'Acme Corp',
    url: 'https://acme.com',
    supportEmail: 'support@acme.com',
    supportPhone: '+15551234567',
  },
  country: 'US',
});
// account.status === 'pending'
// account.stripeAccountId === 'acct_...'

// Step 2: Generate onboarding link for KYC verification
const { url, expiresAt } = await stripeConnectService.generateOnboardingLink(ventureId, {
  refreshUrl: 'https://app.mcv.one/settings/payments?refresh=true',
  returnUrl: 'https://app.mcv.one/settings/payments?onboarding=complete',
});
// Redirect venture owner to `url`

// Step 3: After onboarding, account.updated webhook fires
// StripeConnectService.handleAccountUpdated() auto-syncs status to 'active'
```

### 2. Create Product with Monthly and Yearly Pricing

```typescript
import { productService } from '@mcv/payments/server';

// Create the product
const product = await productService.createProduct(ventureId, {
  name: 'Pro Plan',
  description: 'Full access to all features including priority support',
  images: ['https://assets.acme.com/pro-plan-hero.png'],
  type: 'recurring',
  metadata: { tier: 'professional', features: 'all' },
});

// Create monthly price
const monthlyPrice = await productService.createPrice(ventureId, product.id, {
  amount: 4999,           // $49.99/month
  currency: 'usd',
  interval: 'month',
  trialDays: 14,
  metadata: { display: 'Monthly' },
});

// Create yearly price (17% discount)
const yearlyPrice = await productService.createPrice(ventureId, product.id, {
  amount: 49900,          // $499.00/year (save $100.88)
  currency: 'usd',
  interval: 'year',
  metadata: { display: 'Annual', savings: '17%' },
});

// List all active prices for the product
const allPrices = await productService.listPrices(ventureId, product.id);
// Returns: [monthlyPrice, yearlyPrice]
```

### 3. Create Subscription with Trial and Custom Fee

```typescript
import { subscriptionService } from '@mcv/payments/server';

const subscription = await subscriptionService.create(ventureId, {
  customerId: 'cust_local_uuid',
  priceId: monthlyPrice.id,
  quantity: 5,                        // 5 seats
  trialDays: 14,                      // 14-day free trial
  applicationFeePercent: 5.0,         // Override venture default
  metadata: {
    source: 'onboarding_flow',
    campaign: 'summer_launch_2026',
  },
});
// subscription.status === 'trialing'
// subscription.trialEnd === Date (14 days from now)

// Preview the first real charge
const upcoming = await subscriptionService.getUpcomingInvoice(
  ventureId,
  subscription.id
);
console.log(`First charge: $${(upcoming.amount / 100).toFixed(2)}`);
// First charge: $249.95 (5 seats × $49.99)
```

### 4. Manage Subscription Lifecycle

```typescript
import { subscriptionService } from '@mcv/payments/server';

// Upgrade: Change from monthly to yearly (prorated)
const upgraded = await subscriptionService.update(ventureId, subscription.id, {
  priceId: yearlyPrice.id,
  quantity: 10,                       // Also increase seats
});

// Pause subscription (customer on vacation)
await subscriptionService.pause(ventureId, subscription.id);
// subscription.status === 'paused', billing voided

// Resume when customer returns
await subscriptionService.resume(ventureId, subscription.id);
// subscription.status === 'active'

// Apply discount coupon
await subscriptionService.applyDiscount(ventureId, subscription.id, 'SAVE20');

// Cancel at end of period
const canceled = await subscriptionService.cancel(ventureId, subscription.id, {
  cancelAtPeriodEnd: true,
});
// subscription.cancelAt === currentPeriodEnd
// Status remains 'active' until period ends

// Or cancel immediately
await subscriptionService.cancel(ventureId, subscription.id, {
  immediately: true,
});
// subscription.status === 'canceled' immediately
```

### 5. Create and Send Invoice with Line Items

```typescript
import { invoiceService } from '@mcv/payments/server';

// Create a draft invoice
const invoice = await invoiceService.create(ventureId, {
  customerId: 'cust_local_uuid',
  lineItems: [
    { description: 'Web Development (40hrs)', amount: 15000, quantity: 40 },
    { description: 'UI/UX Design Review',     amount: 7500,  quantity: 2 },
    { description: 'API Integration Setup',   amount: 25000, quantity: 1 },
  ],
  dueDate: new Date('2026-03-15'),
  memo: 'February 2026 professional services — Invoice #MCV-2026-0042',
  metadata: { project: 'website_redesign', phase: '2' },
});
// invoice.status === 'draft'
// invoice.total === 640000 + 15000 + 25000 = $6,850.00

// Add another line item after review
await invoiceService.addLineItem(ventureId, invoice.id, {
  description: 'Rush delivery surcharge',
  amount: 5000,
  quantity: 1,
});
// invoice.total recalculated to $6,900.00

// Finalize, email, and get payment link
const sent = await invoiceService.send(ventureId, invoice.id);
// sent.status === 'open'
// sent.hostedInvoiceUrl === 'https://invoice.stripe.com/i/...'
// sent.invoicePdfUrl === 'https://invoice.stripe.com/i/.../pdf'

// If customer can't pay, mark as uncollectible
await invoiceService.markUncollectible(ventureId, invoice.id);

// Or void it entirely
await invoiceService.void(ventureId, invoice.id);
```

### 6. Process Checkout with Subscription Mode

```typescript
import { checkoutService } from '@mcv/payments/server';

// Create a checkout session for a new subscription
const session = await checkoutService.createSession(ventureId, {
  lineItems: [{ priceId: monthlyPrice.id, quantity: 1 }],
  mode: 'subscription',
  customerId: 'cust_local_uuid',       // Pre-fill customer info
  successUrl: 'https://app.acme.com/welcome?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: 'https://app.acme.com/pricing',
  metadata: { source: 'pricing_page', campaign: 'summer_sale' },
});
// session.url → redirect user here
// Application fee auto-calculated from venture's applicationFeePercent

// Create a reusable payment link (shareable URL)
const link = await checkoutService.createPaymentLink(ventureId, {
  lineItems: [{ priceId: monthlyPrice.id, quantity: 1 }],
  metadata: { channel: 'social_media' },
});
// link.url → 'https://buy.stripe.com/...'

// Expire a session that's no longer needed
await checkoutService.expireSession(ventureId, session.id);
```

### 7. Process a Partial Refund

```typescript
import { refundService } from '@mcv/payments/server';

// Partial refund: customer used service for half the month
const refund = await refundService.createRefund(ventureId, {
  paymentId: 'pay_local_uuid',
  amount: 2500,                       // Refund $25.00 of $49.99 charge
  reason: 'requested_by_customer',
  notes: 'Customer requested partial refund for unused days (15/30)',
});
// refund.status === 'succeeded'
// Payment status now: 'partially_refunded'

// Full refund: omit amount
const fullRefund = await refundService.createRefund(ventureId, {
  paymentId: 'pay_local_uuid_2',
  reason: 'duplicate',
  notes: 'Duplicate charge from billing system error',
});
// Payment status now: 'refunded'

// List all refunds for a specific payment
const { items, total } = await refundService.listRefunds(ventureId, {
  paymentId: 'pay_local_uuid',
  page: 1,
  pageSize: 10,
});
```

### 8. Handle Disputes with Evidence Submission

```typescript
import { refundService } from '@mcv/payments/server';

// List active disputes requiring response
const { items: disputes } = await refundService.listDisputes(ventureId, {
  status: 'needs_response',
});

// Submit evidence for a dispute
for (const dispute of disputes) {
  await refundService.submitEvidence(ventureId, dispute.id, {
    product_description: 'Monthly SaaS subscription — Pro Plan (5 seats)',
    customer_communication: 'Customer confirmed usage in email on March 3, 2026',
    uncategorized_text: 'Service was delivered as described. Customer logged in 47 times during the billing period.',
    service_date: '2026-02-01',
    service_documentation: 'https://app.acme.com/usage-report/cust_123',
  });
  // dispute.status → 'under_review'
}
```

### 9. Payouts and Platform Transfers

```typescript
import { payoutService } from '@mcv/payments/server';

// Check available balance before payout
const balance = await payoutService.getBalance(ventureId);
console.log('Available:', balance.available);
// Available: [{ amount: 157500, currency: 'usd' }] → $1,575.00

// Create a standard payout (2-3 business days)
const payout = await payoutService.createPayout(ventureId, {
  amount: 100000,                     // $1,000.00
  currency: 'usd',
  method: 'standard',
  description: 'Weekly payout — Feb 3-7, 2026',
});
// payout.status === 'pending'
// payout.arrivalDate === ~2-3 business days from now

// Create a platform → connected account transfer
const transfer = await payoutService.createTransfer(ventureId, {
  amount: 50000,                      // $500.00
  currency: 'usd',
  description: 'Referral bonus payment',
});

// List payout history
const { items: payoutHistory } = await payoutService.listPayouts(ventureId, {
  status: 'paid',
  page: 1,
  pageSize: 50,
});
```

### 10. Revenue Dashboard Analytics

```typescript
import { reportingService } from '@mcv/payments/server';

// MRR with growth decomposition
const mrr = await reportingService.getMrr(ventureId);
console.log(`MRR: $${(mrr.mrr / 100).toFixed(2)}`);
console.log(`Growth: ${mrr.growthRate}% month-over-month`);
console.log(`New MRR: $${(mrr.newMrr / 100).toFixed(2)}`);
console.log(`Churned: -$${(mrr.churnedMrr / 100).toFixed(2)}`);
console.log(`Expansion: $${(mrr.expansionMrr / 100).toFixed(2)}`);

// ARR (annualized)
const arr = await reportingService.getArr(ventureId);
console.log(`ARR: $${(arr / 100).toFixed(2)}`);

// Churn analysis
const churn = await reportingService.getChurnRate(ventureId, 'month');
console.log(`Monthly churn: ${churn.churnRate}%`);
console.log(`Churned: ${churn.churnedSubscriptions} of ${churn.totalSubscriptions}`);

// Customer Lifetime Value
const ltv = await reportingService.getLtv(ventureId);
console.log(`Avg LTV: $${(ltv.averageLtv / 100).toFixed(2)}`);
console.log(`Avg lifespan: ${ltv.averageLifespanMonths} months`);

// Revenue timeline for a date range
const timeline = await reportingService.getRevenueTimeline(
  ventureId,
  { from: new Date('2026-01-01'), to: new Date('2026-12-31') },
  'month'
);
// timeline: [{ date: '2026-01-01', revenue: 450000, count: 87 }, ...]

// Revenue by product
const byProduct = await reportingService.getRevenueByProduct(
  ventureId,
  { from: new Date('2026-01-01'), to: new Date('2026-06-30') }
);
// byProduct: [{ productId: '...', productName: 'Pro Plan', revenue: 2450000, count: 245 }]

// Payment method distribution
const methods = await reportingService.getPaymentMethodBreakdown(ventureId);
// methods: [{ method: 'card', count: 950, amount: 4750000, percentage: 95.0 }, ...]

// Outstanding invoices
const outstanding = await reportingService.getOutstandingInvoices(ventureId);
console.log(`${outstanding.overdueCount} overdue invoices: $${(outstanding.overdueAmount / 100).toFixed(2)}`);
```

### 11. Platform Revenue (Super Admin)

```typescript
import { reportingService } from '@mcv/payments/server';

// Total platform application fees across all ventures
const platformRevenue = await reportingService.getPlatformRevenue({
  from: new Date('2026-01-01'),
  to: new Date('2026-01-31'),
});
console.log(`Platform fees collected: $${(platformRevenue.total / 100).toFixed(2)}`);
console.log(`From ${platformRevenue.count} transactions`);

// Breakdown by venture
for (const v of platformRevenue.byVenture) {
  console.log(`  ${v.ventureId}: $${(v.total / 100).toFixed(2)} (${v.count} txns)`);
}
```

### 12. Webhook Processing Pipeline

```typescript
import { verifyStripeWebhook } from '@mcv/payments/server';
import { webhookHandlerService } from '@mcv/payments/server';

// In your Next.js API route handler:
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  try {
    // Step 1: Verify webhook signature (HMAC)
    const event = await verifyStripeWebhook(rawBody, signature);

    // Step 2: Route to appropriate handler
    const result = await webhookHandlerService.handleEvent(event);

    if (result.handled) {
      console.log(`[Webhook] Processed: ${result.type}`);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    } else {
      console.log(`[Webhook] Unhandled event type: ${result.type}`);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return new Response(JSON.stringify({ error: 'Webhook failed' }), { status: 400 });
  }
}
```

### 13. React: Complete Checkout Flow

```tsx
import { useCheckout } from '@mcv/payments/client';

function PricingPage({ ventureId }: { ventureId: string }) {
  const { isLoading, error, redirectToCheckout } = useCheckout({ ventureId });

  const handleSubscribe = async (priceId: string) => {
    try {
      await redirectToCheckout({
        lineItems: [{ priceId, quantity: 1 }],
        mode: 'subscription',
        successUrl: `${window.location.origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`,
      });
      // User is redirected to Stripe Checkout
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  return (
    <div>
      <button
        onClick={() => handleSubscribe('price_monthly_uuid')}
        disabled={isLoading}
      >
        {isLoading ? 'Redirecting...' : 'Subscribe Monthly — $49.99'}
      </button>
      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  );
}
```

### 14. React: Revenue Dashboard with useRevenue

```tsx
import { useRevenue } from '@mcv/payments/client';

function RevenueDashboard({ ventureId }: { ventureId: string }) {
  const {
    mrr, arr, churn, ltv, timeline, outstanding, isLoading, error, refresh,
  } = useRevenue({
    ventureId,
    dateRange: { from: '2026-01-01', to: '2026-12-31' },
    granularity: 'month',
  });

  if (isLoading) return <div>Loading analytics...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard title="MRR" value={mrr ? `$${(mrr.mrr / 100).toFixed(2)}` : '—'} />
      <MetricCard title="ARR" value={arr ? `$${(arr / 100).toFixed(2)}` : '—'} />
      <MetricCard title="Churn" value={churn ? `${churn.churnRate}%` : '—'} />
      <MetricCard title="Avg LTV" value={ltv ? `$${(ltv.averageLtv / 100).toFixed(2)}` : '—'} />

      {outstanding && outstanding.overdueCount > 0 && (
        <Alert>
          {outstanding.overdueCount} overdue invoices totaling
          ${(outstanding.overdueAmount / 100).toFixed(2)}
        </Alert>
      )}

      <RevenueChart data={timeline} />
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### 15. React: Subscription Management UI

```tsx
import { useSubscriptions } from '@mcv/payments/client';

function SubscriptionManager({ ventureId, customerId }: Props) {
  const {
    subscriptions, isLoading, total, cancel, pause, resume, refresh,
  } = useSubscriptions({
    ventureId,
    customerId,
    status: 'active',
  });

  const handleCancel = async (id: string) => {
    if (confirm('Cancel subscription at end of billing period?')) {
      await cancel(id, { cancelAtPeriodEnd: true });
      // List auto-refreshes after mutation
    }
  };

  const handlePause = async (id: string) => {
    await pause(id);
  };

  return (
    <div>
      <h2>Active Subscriptions ({total})</h2>
      {subscriptions.map((sub) => (
        <div key={sub.id}>
          <span>Status: {sub.status}</span>
          <span>Renews: {new Date(sub.currentPeriodEnd!).toLocaleDateString()}</span>
          <button onClick={() => handlePause(sub.id)}>Pause</button>
          <button onClick={() => handleCancel(sub.id)}>Cancel</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Middleware

### `verifyStripeWebhook(rawBody, signature, endpointSecret?)`

Verifies Stripe webhook signatures using `stripe.webhooks.constructEvent()`. The credential resolution chain:

1. If `endpointSecret` is provided, use it directly
2. Otherwise, call `getStripeConfig()` → vault lookup → env fallback
3. Throws descriptive errors for missing secrets, signatures, or body

```typescript
// Platform webhook (from Stripe directly)
const event = await verifyStripeWebhook(rawBody, req.headers['stripe-signature']);

// Connect webhook (from connected accounts — uses separate secret)
const event = await verifyStripeConnectWebhook(rawBody, req.headers['stripe-signature']);
```

**Error Cases:**
- `"Stripe webhook secret not configured..."` — No secret in vault or env
- `"Missing stripe-signature header"` — Request lacks the header
- `"Missing request body"` — Empty body
- `"Webhook signature verification failed: ..."` — HMAC mismatch (tampered or wrong secret)

### `getStripeClient()`

Singleton factory for the Stripe SDK client. Lazily initialized on first call, reused for all subsequent requests.

```typescript
const stripe = await getStripeClient();
// Uses API version '2024-12-18.acacia'
// Credentials from getStripeConfig() (vault → env)
```

### `getStripeConfig()`

Credential resolver with GCP Secret Manager primary and environment variable fallback.

```typescript
// Resolution order:
// 1. GCP: projects/mcv-one-prototype/secrets/mcv-system-stripe-master/versions/latest
// 2. Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_CONNECT_WEBHOOK_SECRET
// 3. Error: "Stripe credentials not found..."
```

---

## Security Considerations

### 1. Credential Storage
Stripe secret keys are stored in **GCP Secret Manager** (`mcv-system-stripe-master`), never in code, configuration files, or version control. Environment variables serve only as a development/fallback mechanism.

### 2. Webhook Signature Verification
Every incoming webhook is verified via **HMAC-SHA256 signature** using `stripe.webhooks.constructEvent()` before any processing occurs. Invalid signatures result in immediate 400 rejection.

### 3. Venture Isolation (Multi-Tenant Security)
Each venture operates through its own **Stripe Connected Account**. All service methods accept `ventureId` as the first parameter and enforce scoping:
```typescript
// Every query includes venture_id in WHERE clause:
where: and(
  eq(subscriptions.id, subscriptionId),
  eq(subscriptions.ventureId, ventureId)   // ← Tenant isolation
)
```
This prevents cross-venture data access even if IDs are guessed or leaked.

### 4. PCI Compliance
**Zero card data** touches MCV servers. All payment details are handled by:
- Stripe Checkout (hosted payment pages)
- Stripe Elements (client-side tokenization)
- Stripe's PCI-DSS Level 1 certified infrastructure

The `payment_transactions` table stores only non-sensitive metadata: `card_brand`, `card_last4`, `receipt_url`.

### 5. Idempotency
Webhook handlers use Stripe's unique identifiers (`stripePaymentIntentId`, `stripeInvoiceId`, etc.) with database `UNIQUE` constraints. Duplicate webhook deliveries are handled gracefully via upsert patterns — the second delivery updates rather than duplicates.

### 6. Fee Validation
Application fee percent is validated to the `0–100` range before database storage:
```typescript
if (feePercent < 0 || feePercent > 100) {
  throw new Error('Fee percent must be between 0 and 100');
}
```

### 7. Refund Guards
Refund service enforces multiple guards to prevent financial errors:
- Payment must be in `succeeded` or `partially_refunded` status
- Refund amount cannot exceed `payment.amount - refundedAmount`
- Full refund amount is calculated automatically when `amount` is omitted

### 8. State Machine Guards
Invoice mutations enforce state constraints:
- Only `draft` invoices can be updated or have line items added
- Only `draft` invoices can be sent (finalized)
- `paid` and `void` invoices cannot be voided
- Checkout sessions must be `open` to be expired

---

## Performance Considerations

### 1. Parallel Queries
All list endpoints use `Promise.all` to execute data + count queries simultaneously:
```typescript
const [items, countResult] = await Promise.all([
  db.select().from(table).where(where).limit(pageSize).offset(offset),
  db.select({ count: sql`count(*)::int` }).from(table).where(where),
]);
```

### 2. Composite Indexes
All major tables have composite indexes on `(venture_id, status)` for efficient filtered queries within a tenant context. Time-series queries use `created_at` indexes.

### 3. Pagination
All list endpoints are paginated with configurable `page` and `pageSize` (default: 20). This prevents unbounded result sets.

### 4. Singleton Stripe Client
The Stripe SDK client is lazily initialized once and reused across all requests, avoiding connection overhead on every API call.

### 5. Webhook Dispatch
The `WebhookHandlerService` uses a `switch` statement for O(1) event routing — no iteration over handler registrations.

### 6. Revenue Reporting SQL
MRR and revenue calculations use single SQL aggregation queries with `CASE` expressions rather than fetching individual subscriptions. The `COALESCE` + `SUM` + `FILTER` pattern keeps complex analytics in a single database round-trip.

### 7. Client-Side Parallel Fetching
The `useRevenue` hook uses `Promise.allSettled` to fetch all 8 reporting endpoints simultaneously. Individual failures are handled gracefully — partial data renders while failed endpoints show null.

### 8. Database Connection Checks
All service methods check `if (!db)` at the start and throw `'Database unavailable'` immediately, preventing cascading errors from null database references.

---

## Error Codes

| Error | Service | Context | Description |
|-------|---------|---------|-------------|
| `Database unavailable` | All | DB init | Database connection not initialized |
| `Venture already has a connected account` | StripeConnect | createConnectedAccount | Prevents duplicate account creation |
| `No connected account found for venture` | StripeConnect | getBalance, generateOnboardingLink | Venture hasn't completed onboarding |
| `Venture has no connected Stripe account` | Checkout, Subscription | createSession, create | Venture needs onboarding first |
| `Fee percent must be between 0 and 100` | StripeConnect | updateApplicationFee | Fee validation failed |
| `Customer not found or has no Stripe customer ID` | Subscription | create | Customer not mapped to Stripe |
| `Price not found` | Checkout | resolveLineItems | Local price UUID doesn't exist |
| `Price has no Stripe ID` | Checkout | resolveLineItems | Price not synced to Stripe |
| `New price not found` | Subscription | update | Price for plan change doesn't exist |
| `Product not found` | Product | createPrice, update, archive | Product UUID doesn't exist in venture |
| `Subscription not found` | Subscription | update, cancel, pause, resume | Sub UUID doesn't exist in venture |
| `Invoice not found` | Invoice | update, send, void, addLineItem | Invoice UUID doesn't exist in venture |
| `Only draft invoices can be updated` | Invoice | update | State guard: non-draft mutation |
| `Only draft invoices can be sent` | Invoice | send | State guard: can only finalize drafts |
| `Only draft invoices can be modified` | Invoice | addLineItem | State guard: line item addition |
| `Cannot void this invoice` | Invoice | void | Invoice is paid or already void |
| `Customer not found` | Invoice | create | customerId doesn't exist in venture |
| `Payment not found` | Refund | createRefund | paymentId doesn't exist in venture |
| `Payment cannot be refunded` | Refund | createRefund | Payment not in succeeded/partially_refunded |
| `Refund amount exceeds payment amount` | Refund | createRefund | Over-refund prevention |
| `Dispute not found` | Refund | submitEvidence | disputeId doesn't exist in venture |
| `No connected account found` | Payout | createPayout, createTransfer | Venture needs onboarding first |
| `Checkout session not found` | Checkout | expireSession | Session UUID doesn't exist |
| `Session is not open` | Checkout | expireSession | Can only expire open sessions |
| `Stripe webhook secret not configured` | Middleware | verifyStripeWebhook | No secret in vault or env |
| `Missing stripe-signature header` | Middleware | verifyStripeWebhook | Request lacks header |
| `Missing request body` | Middleware | verifyStripeWebhook | Empty body |
| `Webhook signature verification failed: ...` | Middleware | verifyStripeWebhook | HMAC mismatch |
| `Stripe credentials not found` | Utils | getStripeConfig | No key in vault or env |

---

## Audit Events

| Event | Trigger | Data Fields |
|-------|---------|-------------|
| `payment.account.created` | Connected account created | ventureId, accountType, stripeAccountId |
| `payment.account.onboarded` | Account status → active | ventureId, accountType, chargesEnabled |
| `payment.account.fee_updated` | Application fee changed | ventureId, oldFee, newFee |
| `payment.product.created` | Product created | ventureId, productId, name, type |
| `payment.product.archived` | Product archived | ventureId, productId |
| `payment.price.created` | Price created | ventureId, priceId, amount, interval |
| `payment.checkout.created` | Checkout session created | ventureId, sessionId, mode, totalAmount |
| `payment.checkout.completed` | Checkout session completed | ventureId, sessionId |
| `payment.subscription.created` | New subscription | ventureId, subscriptionId, customerId, priceId, trialDays |
| `payment.subscription.updated` | Subscription modified | ventureId, subscriptionId, changes |
| `payment.subscription.canceled` | Subscription canceled | ventureId, subscriptionId, immediately |
| `payment.subscription.paused` | Subscription paused | ventureId, subscriptionId |
| `payment.subscription.resumed` | Subscription resumed | ventureId, subscriptionId |
| `payment.invoice.created` | Draft invoice created | ventureId, invoiceId, total, lineItemCount |
| `payment.invoice.sent` | Invoice finalized and sent | ventureId, invoiceId, total, hostedUrl |
| `payment.invoice.paid` | Invoice paid | ventureId, invoiceId, amountPaid |
| `payment.invoice.voided` | Invoice voided | ventureId, invoiceId |
| `payment.transaction.succeeded` | Payment succeeded | ventureId, paymentId, amount, cardBrand, cardLast4 |
| `payment.transaction.failed` | Payment failed | ventureId, paymentId, amount |
| `payment.refund.created` | Refund processed | ventureId, refundId, paymentId, amount, reason |
| `payment.dispute.created` | Dispute opened | ventureId, disputeId, amount, reason |
| `payment.dispute.evidence_submitted` | Evidence submitted | ventureId, disputeId |
| `payment.dispute.resolved` | Dispute won/lost | ventureId, disputeId, status |
| `payment.payout.created` | Payout initiated | ventureId, payoutId, amount, method |
| `payment.payout.paid` | Payout completed | ventureId, payoutId, arrivalDate |
| `payment.payout.failed` | Payout failed | ventureId, payoutId, failureCode, failureMessage |
| `payment.webhook.received` | Stripe webhook processed | eventType, handled, accountId |

---

## API Endpoints (Client Hooks)

All endpoints require the `x-venture-id` header for multi-tenant scoping.

| Endpoint | Method | Hook | Description |
|----------|--------|------|-------------|
| `/api/payments/checkout/sessions` | POST | `useCheckout.createSession` | Create Stripe Checkout session |
| `/api/payments/payment-links` | POST | `useCheckout.createPaymentLink` | Create reusable payment link |
| `/api/payments/subscriptions` | GET | `useSubscriptions` | List subscriptions (paginated) |
| `/api/payments/subscriptions` | POST | `useSubscriptions.create` | Create subscription |
| `/api/payments/subscriptions/:id` | PATCH | `useSubscriptions.update` | Update subscription (prorate) |
| `/api/payments/subscriptions/:id/cancel` | POST | `useSubscriptions.cancel` | Cancel subscription |
| `/api/payments/subscriptions/:id/pause` | POST | `useSubscriptions.pause` | Pause subscription |
| `/api/payments/subscriptions/:id/resume` | POST | `useSubscriptions.resume` | Resume subscription |
| `/api/payments/invoices` | GET | `useInvoices` | List invoices (paginated) |
| `/api/payments/invoices` | POST | `useInvoices.create` | Create draft invoice |
| `/api/payments/invoices/:id/send` | POST | `useInvoices.send` | Finalize and send invoice |
| `/api/payments/invoices/:id/void` | POST | `useInvoices.voidInvoice` | Void invoice |
| `/api/payments/invoices/:id/uncollectible` | POST | `useInvoices.markUncollectible` | Mark uncollectible |
| `/api/payments/invoices/:id/line-items` | POST | `useInvoices.addLineItem` | Add line item to draft |
| `/api/payments/reporting/mrr` | GET | `useRevenue` | Monthly Recurring Revenue |
| `/api/payments/reporting/arr` | GET | `useRevenue` | Annual Recurring Revenue |
| `/api/payments/reporting/churn` | GET | `useRevenue` | Churn rate (period param) |
| `/api/payments/reporting/ltv` | GET | `useRevenue` | Customer Lifetime Value |
| `/api/payments/reporting/timeline` | GET | `useRevenue` | Revenue over time (granularity param) |
| `/api/payments/reporting/by-product` | GET | `useRevenue` | Revenue by product |
| `/api/payments/reporting/payment-methods` | GET | `useRevenue` | Payment method distribution |
| `/api/payments/reporting/outstanding` | GET | `useRevenue` | Outstanding invoice summary |

---

## Package Exports Summary

### `@mcv/payments` (Root Package)
- All TypeScript types from `./types`

### `@mcv/payments/server` (Server Package)
- 9 service classes (with singleton instances)
- `verifyStripeWebhook` middleware
- `verifyStripeConnectWebhook` middleware

### `@mcv/payments/client` (Client Package)
- 4 React hooks

---

## Cross-Module Integration Points

### @mcv/db
- All 14 payment tables defined in `packages/db/src/schema/payments.ts`
- Drizzle ORM query builder, relations, SQL helpers
- PostgreSQL connection management

### @mcv/secrets
- `SecretManagerService` for GCP Secret Manager access
- Secret path: `projects/mcv-one-prototype/secrets/mcv-system-stripe-master/versions/latest`

### @mcv/invoicing (Tier 5 — Future)
- Advanced invoicing extends the payment customer base
- Platform fee ledger tracks application fees per transaction
- Proposal → Invoice conversion uses Stripe Checkout infrastructure

### CRM Contacts
- `payment_customers.contact_id` → `contacts.id` foreign key
- CRM contact changes can be synced to Stripe customer records

### @mcv/notifications (Planned)
- `customer.subscription.trial_will_end` events will trigger trial-ending notifications
- Invoice payment reminders via email/SMS
- Dispute deadline alerts

---

## Testing Strategy

### Unit Tests
- Service method logic (status mapping, fee calculation, amount validation)
- Refund guard logic (over-refund prevention, state checks)
- MRR interval normalization calculations
- Webhook event routing dispatch

### Integration Tests
- Stripe API mock (using `stripe-mock` or jest mocks)
- Full service flows: create product → create price → create subscription → webhook sync
- Invoice lifecycle: create → add items → send → pay (via webhook)
- Refund flow: payment → partial refund → full refund

### E2E Tests
- Stripe Checkout redirect flow
- Webhook endpoint signature verification
- Connected account onboarding flow

### Test Fixtures
```typescript
// Example test for refund guard
describe('RefundService', () => {
  it('should prevent over-refunding', async () => {
    // Payment: $100.00, already refunded: $75.00
    await expect(
      refundService.createRefund(ventureId, {
        paymentId: payment.id,
        amount: 5000,  // $50.00 — would exceed $100.00 total
      })
    ).rejects.toThrow('Refund amount exceeds payment amount');
  });

  it('should reject refund on failed payment', async () => {
    await expect(
      refundService.createRefund(ventureId, {
        paymentId: failedPayment.id,
      })
    ).rejects.toThrow('Payment cannot be refunded');
  });
});
```

---

## Future Enhancements

- **Metered Billing** — Usage-based pricing with Stripe usage records
- **Multi-Currency** — Full multi-currency support per venture (currently USD-default)
- **Tax Automation** — Integration with Stripe Tax for automatic tax calculation
- **Dunning Automation** — Configurable retry schedules for failed payments
- **Revenue Recognition** — Deferred revenue tracking for accrual accounting
- **Stripe Billing Portal** — Customer self-service for subscription management
- **Webhook Retry Queue** — Dead letter queue for failed webhook processing
- **Caching Layer** — Redis cache for product/price lookups and reporting queries
- **Real-time Subscriptions** — WebSocket push for live revenue dashboard updates
- **Coupon & Promotion Management** — Full coupon CRUD beyond `applyDiscount`
