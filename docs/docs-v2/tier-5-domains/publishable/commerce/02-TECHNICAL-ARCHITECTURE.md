# @mcv/commerce — Technical Architecture

| Field | Value |
|---|---|
| **Package** | `@mcv/commerce` |
| **Classification** | PUBLISHABLE |
| **Tier** | 5 (Domain Layer) |
| **Last Updated** | February 9, 2026 |

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
4. [Data Models](#data-models)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance Architecture](#performance-architecture)
8. [Scalability](#scalability)
9. [Error Handling](#error-handling)
10. [Observability](#observability)
11. [Security Architecture](#security-architecture)

---

## Architecture Overview

The `@mcv/commerce` domain follows a layered architecture pattern with clear separation between client-facing components, API routing, business logic services, and data persistence. The architecture is designed for:

- **Modularity** — 11 submodules that can be used independently or composed together
- **Multi-tenancy** — Complete venture isolation at every layer
- **Stripe-native** — Deep integration with Stripe Connect for payments, subscriptions, and invoicing
- **Event-driven** — Structured audit events for every significant operation
- **Cache-friendly** — Strategic caching at multiple layers for performance
- **White-label ready** — Per-venture branding, templates, and configuration

### Architecture Principles

1. **Venture Scoping** — Every query, every service call, every event is scoped to a venture. There are zero cross-venture data access paths in non-super-admin code.
2. **Stripe as Source of Truth** — For payment state (charges, subscriptions, invoices), Stripe is the authoritative source. Commerce maintains a local mirror for fast reads, updated via webhooks.
3. **Amounts in Cents** — All monetary amounts are stored as integers (cents) to avoid floating-point arithmetic errors. Currency is stored alongside every amount.
4. **Soft Deletes** — Products use soft delete (status = 'discontinued'). Invoices can be voided but not deleted after sending. Only draft documents can be hard-deleted.
5. **Optimistic Locking** — Product updates use `updatedAt` comparison to prevent concurrent modification conflicts.
6. **Idempotent Webhooks** — Stripe webhook handlers use unique Stripe IDs for deduplication, ensuring safe retry behavior.

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js (Next.js 15) | Server-side execution |
| **Framework** | Next.js 15 (App Router) | Full-stack React framework |
| **Build** | Turborepo | Monorepo build orchestration |
| **API** | tRPC v10 | Type-safe API layer |
| **Database** | PostgreSQL (Supabase) | Primary data store |
| **ORM** | Drizzle ORM | Schema definition, query building, migrations |
| **Validation** | Zod | Input/output schema validation |
| **Payments** | Stripe Connect | Payment processing, subscriptions, invoicing |
| **Cache** | Redis | Session caching, rate limiting |
| **Events** | Redpanda/Kafka | Event streaming (audit trail) |
| **AI** | OpenRouter | Product description generation, pricing suggestions |
| **Auth** | Supabase Auth + @mcv/identity | User authentication and authorization |
| **Blockchain** | Solana/EDGE Token | (Future) Token-gated commerce features |

---

## System Diagram

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Admin Panel  │  │  Storefront   │  │  Public API   │  │  Webhooks  │ │
│  │  (Internal)   │  │  (Customer)   │  │  (External)   │  │  (Stripe)  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                  │                  │                 │         │
│         └──────────────────┼──────────────────┼─────────────────┘        │
│                            │                  │                           │
└────────────────────────────┼──────────────────┼───────────────────────────┘
                             │                  │
                             ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         tRPC ROUTER LAYER                                │
│                                                                          │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────────┐ │
│  │  catalogRouter     │  │  paymentsRouter   │  │  invoicingRouter    │ │
│  │  (57 procedures)   │  │  (32 procedures)  │  │  (55 procedures)   │ │
│  └────────┬──────────┘  └────────┬──────────┘  └─────────┬───────────┘ │
│           │                      │                        │              │
│  ┌────────┴──────────────────────┴────────────────────────┴───────────┐ │
│  │                    AUTH MIDDLEWARE                                   │ │
│  │  ventureProcedure │ adminProcedure │ superAdminProcedure            │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└────────────────────────────────────────┬────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                    │
│                                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │ Product Service │  │ Payment Service│  │ Invoice Service│            │
│  │ Category Svc    │  │ Checkout Svc   │  │ Proposal Svc   │            │
│  │ Discount Svc    │  │ Subscription   │  │ Estimate Svc   │            │
│  │ Inventory Svc   │  │ Refund Svc     │  │ Recurring Svc  │            │
│  │ PriceRule Svc   │  │ Dispute Svc    │  │ CreditNote Svc │            │
│  │ Collection Svc  │  │ Payout Svc     │  │ Approval Svc   │            │
│  │ Tax Service     │  │ Reporting Svc  │  │ Engagement Svc │            │
│  │                 │  │ Connect Svc    │  │ PlatformFee Svc│            │
│  │                 │  │ Customer Svc   │  │ Pricing Svc    │            │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘            │
│          │                   │                    │                      │
│  ┌───────┴───────────────────┴────────────────────┴──────────────────┐  │
│  │                     SHARED INFRASTRUCTURE                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │  │  Drizzle │  │   Zod    │  │  Stripe  │  │  Events  │         │  │
│  │  │   ORM    │  │ Schemas  │  │  Client  │  │  Emitter │         │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└────────────────────────────────────────┬────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                        │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  PostgreSQL       │  │  Redis Cache     │  │  Stripe API      │      │
│  │  (Supabase)       │  │                  │  │  (External)      │      │
│  │                   │  │  • Cart sessions │  │                  │      │
│  │  • 36 tables      │  │  • Product cache │  │  • Payments      │      │
│  │  • 28 enums       │  │  • Tax rates     │  │  • Subscriptions │      │
│  │  • 45+ indexes    │  │  • Rate limiting │  │  • Invoices      │      │
│  │  • RLS policies   │  │  • Revenue cache │  │  • Webhooks      │      │
│  │                   │  │                  │  │                  │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐                             │
│  │  Redpanda/Kafka   │  │  Object Storage  │                             │
│  │                   │  │                  │                             │
│  │  • Audit events   │  │  • Invoice PDFs  │                             │
│  │  • Commerce events│  │  • Signatures    │                             │
│  │  • Webhook replay │  │  • Product media │                             │
│  └──────────────────┘  └──────────────────┘                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Commerce Flow (Happy Path)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│          │    │          │    │          │    │          │    │          │
│ CATALOG  │───>│   CART   │───>│ CHECKOUT │───>│ PAYMENT  │───>│  ORDER   │
│          │    │          │    │          │    │          │    │          │
│ Browse   │    │ Add/     │    │ Address  │    │ Stripe   │    │ Confirm  │
│ Search   │    │ Remove   │    │ Shipping │    │ Charge   │    │ Fulfill  │
│ Filter   │    │ Discount │    │ Tax Calc │    │ Capture  │    │ Ship     │
│          │    │ Qty      │    │ Review   │    │          │    │ Deliver  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │
                                                      ▼
                                                ┌──────────┐
                                                │          │
                                                │ INVOICE  │
                                                │          │
                                                │ Generate │
                                                │ Send     │
                                                │ Track    │
                                                │ Collect  │
                                                └──────────┘
```

---

## Module Architecture

### 3.1 Cart Lifecycle

The cart submodule manages ephemeral shopping sessions with a well-defined lifecycle:

```
┌─────────────────────────────────────────────────────────────────┐
│                       CART LIFECYCLE                              │
│                                                                  │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐ │
│  │  EMPTY  │───>│ ACTIVE   │───>│ CHECKOUT │───>│ CONVERTED │ │
│  │         │    │          │    │          │    │           │ │
│  │ Session │    │ Items    │    │ Stripe   │    │ Order     │ │
│  │ created │    │ added    │    │ session  │    │ created   │ │
│  └─────────┘    └──────────┘    └──────────┘    └───────────┘ │
│       │              │               │                          │
│       │              ▼               │                          │
│       │         ┌──────────┐         │                          │
│       │         │ DISCOUNT │         │                          │
│       │         │ APPLIED  │─────────┘                          │
│       │         └──────────┘                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────┐                                                    │
│  │ EXPIRED │  (TTL: 72 hours default)                           │
│  └─────────┘                                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Cart Architecture Details:**

- **Session Key**: Carts are keyed by a `sessionId` (UUID) stored in the client cookie. This allows anonymous browsing.
- **User Association**: When a user authenticates, the cart is associated with their user ID via `linkCartToUser(sessionId, userId)`. If the user had a previous cart, items are merged.
- **Item Storage**: Cart items reference `productId` and optional `variantId`. Prices are resolved at read time (not stored) to ensure accuracy.
- **Discount Application**: Discount codes are validated against the full cart context (total, product IDs, category IDs, customer usage count) before being applied.
- **Tax Calculation**: Tax is calculated during the cart read operation based on the customer's location (if known) or deferred to checkout.
- **TTL**: Carts expire after a configurable period (default 72 hours). Expired carts are cleaned up by a background sweep.

**Cart Data Flow:**

```typescript
// 1. Create cart (implicit on first addToCart)
addToCart(sessionId, { productId, variantId, quantity })
  → Resolve product price (base + variant override + active price rules)
  → Check inventory availability
  → Insert/update cart item
  → Recalculate cart totals
  → Return updated cart

// 2. Apply discount
applyDiscountToCart(ventureId, code, { cartTotal, productIds, categoryIds, customerUsageCount })
  → Validate discount: active, within date range, usage not exhausted
  → Check applicability: products/categories match
  → Check minimum amount
  → Calculate discount amount (capped at maximumDiscount)
  → Return { valid, discountAmount, finalTotal }

// 3. Get cart with totals
getCart(sessionId)
  → Fetch all cart items
  → Resolve current prices for each item
  → Calculate subtotal (sum of lineTotal for each item)
  → Apply discount if present
  → Calculate tax based on location
  → Return { items, subtotal, discountAmount, taxAmount, total, itemCount }
```

### 3.2 Catalog Search Architecture

Product search and filtering is a critical performance path. The architecture uses a multi-strategy approach:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CATALOG SEARCH PIPELINE                        │
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────────┐ │
│  │  Search   │───>│  Query       │───>│  PostgreSQL           │ │
│  │  Request  │    │  Builder     │    │                       │ │
│  │           │    │              │    │  Full-text: pg_trgm   │ │
│  │ • query   │    │ • text match │    │  GIN index on name,   │ │
│  │ • filters │    │ • filters    │    │  description, tags    │ │
│  │ • sort    │    │ • sort       │    │                       │ │
│  │ • page    │    │ • pagination │    │  Filters: composite   │ │
│  │           │    │              │    │  indexes on status,   │ │
│  └──────────┘    └──────────────┘    │  type, category,      │ │
│                                       │  price range           │ │
│                                       │                       │ │
│                                       │  Sort: pre-built      │ │
│                                       │  indexes for common   │ │
│                                       │  sort patterns        │ │
│                                       └───────────┬───────────┘ │
│                                                   │              │
│                                                   ▼              │
│                                       ┌───────────────────────┐ │
│                                       │  Result Processing    │ │
│                                       │                       │ │
│                                       │  • Resolve variants   │ │
│                                       │  • Apply price rules  │ │
│                                       │  • Check inventory    │ │
│                                       │  • Format response    │ │
│                                       └───────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Query Builder Logic:**

```typescript
async function listProducts(ventureId: string, opts: ListProductsInput) {
  let query = db.select().from(products)
    .where(eq(products.ventureId, ventureId));

  // Apply filters
  if (opts.status) query = query.where(eq(products.status, opts.status));
  if (opts.type) query = query.where(eq(products.type, opts.type));
  if (opts.categoryId) query = query.where(eq(products.categoryId, opts.categoryId));
  if (opts.isFeatured) query = query.where(eq(products.isFeatured, true));
  if (opts.isPublic) query = query.where(eq(products.isPublic, true));
  if (opts.minPrice) query = query.where(gte(products.basePrice, opts.minPrice));
  if (opts.maxPrice) query = query.where(lte(products.basePrice, opts.maxPrice));
  if (opts.tags?.length) query = query.where(arrayOverlap(products.tags, opts.tags));

  // Text search (pg_trgm)
  if (opts.query) {
    query = query.where(or(
      ilike(products.name, `%${opts.query}%`),
      ilike(products.description, `%${opts.query}%`),
    ));
  }

  // Sort
  const sortMap = {
    'name_asc': asc(products.name),
    'name_desc': desc(products.name),
    'price_asc': asc(products.basePrice),
    'price_desc': desc(products.basePrice),
    'created_desc': desc(products.createdAt),
    'created_asc': asc(products.createdAt),
  };
  query = query.orderBy(sortMap[opts.sort ?? 'created_desc']);

  // Pagination
  const offset = ((opts.page ?? 1) - 1) * (opts.pageSize ?? 20);
  query = query.limit(opts.pageSize ?? 20).offset(offset);

  return query;
}
```

### 3.3 Checkout Flow

The checkout flow orchestrates the transition from cart to paid order through Stripe Checkout Sessions:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CHECKOUT FLOW SEQUENCE                            │
│                                                                          │
│  Client                    Server                      Stripe            │
│  ──────                    ──────                      ──────            │
│    │                          │                          │                │
│    │  1. initCheckout()       │                          │                │
│    │─────────────────────────>│                          │                │
│    │                          │                          │                │
│    │                          │  2. Validate cart items   │                │
│    │                          │  3. Resolve prices        │                │
│    │                          │  4. Calculate tax         │                │
│    │                          │  5. Apply discount        │                │
│    │                          │                          │                │
│    │                          │  6. createCheckoutSession │                │
│    │                          │─────────────────────────>│                │
│    │                          │                          │                │
│    │                          │  7. Stripe session URL   │                │
│    │                          │<─────────────────────────│                │
│    │                          │                          │                │
│    │  8. Redirect to Stripe   │                          │                │
│    │<─────────────────────────│                          │                │
│    │                          │                          │                │
│    │  9. Customer pays        │                          │                │
│    │─────────────────────────────────────────────────────>│                │
│    │                          │                          │                │
│    │                          │  10. checkout.session.    │                │
│    │                          │      completed webhook   │                │
│    │                          │<─────────────────────────│                │
│    │                          │                          │                │
│    │                          │  11. Create Order         │                │
│    │                          │  12. Record Payment       │                │
│    │                          │  13. Update Inventory     │                │
│    │                          │  14. Send Confirmation    │                │
│    │                          │  15. Emit Events          │                │
│    │                          │                          │                │
│    │  16. Redirect to         │                          │                │
│    │      success URL         │                          │                │
│    │<────────────────────────────────────────────────────│                │
│    │                          │                          │                │
└─────────────────────────────────────────────────────────────────────────┘
```

**Checkout Modes:**

| Mode | Use Case | Stripe Flow |
|---|---|---|
| `payment` | One-time purchases | Creates PaymentIntent, charges card |
| `subscription` | Recurring billing | Creates Subscription with first invoice |
| `setup` | Save card for later | Creates SetupIntent, stores payment method |

**Checkout Session Creation:**

```typescript
async function createCheckoutSession(ventureId: string, input: CreateCheckoutInput) {
  // 1. Get venture's Stripe connected account
  const account = await getStripeAccount(ventureId);
  if (!account || !account.chargesEnabled) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'STRIPE_CHARGES_DISABLED' });
  }

  // 2. Resolve line items to Stripe price IDs
  const lineItems = input.lineItems.map(item => ({
    price: item.priceId, // Must be a Stripe price ID
    quantity: item.quantity,
  }));

  // 3. Create Stripe Checkout Session on connected account
  const session = await stripe.checkout.sessions.create({
    mode: input.mode,
    line_items: lineItems,
    customer: input.customerId ? await getStripeCustomerId(input.customerId) : undefined,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + (24 * 3600), // 24h expiry
    payment_intent_data: input.mode === 'payment' ? {
      application_fee_amount: calculatePlatformFee(account, totalAmount),
    } : undefined,
    subscription_data: input.mode === 'subscription' ? {
      application_fee_percent: parseFloat(account.applicationFeePercent),
    } : undefined,
  }, {
    stripeAccount: account.stripeAccountId,
  });

  // 4. Store session reference in database
  await db.insert(paymentCheckoutSessions).values({
    ventureId,
    stripeSessionId: session.id,
    customerId: input.customerId,
    mode: input.mode,
    status: 'open',
    totalAmount: session.amount_total,
    currency: session.currency,
    expiresAt: new Date(session.expires_at * 1000),
  });

  return { id: session.id, url: session.url };
}
```

### 3.4 Order State Machine

Orders follow a well-defined state machine with clear transitions:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ORDER STATE MACHINE                               │
│                                                                          │
│                       ┌─────────────┐                                   │
│                       │   DRAFT     │  (Manual order creation)          │
│                       └──────┬──────┘                                   │
│                              │ confirm()                                 │
│                              ▼                                           │
│                       ┌─────────────┐                                   │
│              ┌────────│  CONFIRMED  │────────┐                          │
│              │        └──────┬──────┘        │                          │
│              │               │               │                          │
│              │ cancel()      │ process()     │                          │
│              ▼               ▼               │                          │
│       ┌─────────────┐ ┌─────────────┐       │                          │
│       │  CANCELLED  │ │ PROCESSING  │       │                          │
│       └─────────────┘ └──────┬──────┘       │                          │
│                              │               │                          │
│                              │ ship()        │                          │
│                              ▼               │                          │
│                       ┌─────────────┐       │                          │
│                       │   SHIPPED   │       │                          │
│                       └──────┬──────┘       │                          │
│                              │               │                          │
│                              │ deliver()     │                          │
│                              ▼               │                          │
│                       ┌─────────────┐       │                          │
│              ┌────────│  DELIVERED  │       │                          │
│              │        └─────────────┘       │                          │
│              │                               │                          │
│              │ requestReturn()               │                          │
│              ▼                               │                          │
│       ┌──────────────────┐                   │                          │
│       │ REFUND_REQUESTED │                   │                          │
│       └────────┬─────────┘                   │                          │
│                │                              │                          │
│                │ processReturn()              │                          │
│                ▼                              │                          │
│         ┌──────────┐                          │                          │
│         │ RETURNED │                          │                          │
│         └────┬─────┘                          │                          │
│              │                                │                          │
│              │ refund()                       │                          │
│              ▼                                │                          │
│         ┌──────────┐                          │                          │
│         │ REFUNDED │                          │                          │
│         └──────────┘                          │                          │
│                                                                          │
│  VALID TRANSITIONS:                                                      │
│  draft → confirmed                                                       │
│  confirmed → processing, cancelled                                       │
│  processing → shipped                                                    │
│  shipped → delivered                                                     │
│  delivered → refund_requested                                            │
│  refund_requested → returned                                             │
│  returned → refunded                                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Order Creation from Checkout:**

When a `checkout.session.completed` webhook is received:

```typescript
async function handleCheckoutComplete(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  
  // 1. Find local session record
  const localSession = await db.select().from(paymentCheckoutSessions)
    .where(eq(paymentCheckoutSessions.stripeSessionId, session.id))
    .limit(1);
  
  // 2. Idempotency check — skip if already processed
  if (localSession[0]?.status === 'complete') return;
  
  // 3. Update session status
  await db.update(paymentCheckoutSessions)
    .set({ status: 'complete', completedAt: new Date() })
    .where(eq(paymentCheckoutSessions.id, localSession[0].id));
  
  // 4. Record payment transaction
  const payment = await recordPaymentTransaction(localSession[0].ventureId, {
    customerId: localSession[0].customerId,
    stripePaymentIntentId: session.payment_intent as string,
    amount: session.amount_total!,
    currency: session.currency!,
    status: 'succeeded',
  });
  
  // 5. Create order
  const order = await createOrder(localSession[0].ventureId, {
    customerId: localSession[0].customerId,
    paymentId: payment.id,
    checkoutSessionId: localSession[0].id,
    lineItems: session.line_items,
    status: 'confirmed',
  });
  
  // 6. Update inventory
  for (const item of order.lineItems) {
    await recordInventoryMovement(localSession[0].ventureId, {
      productId: item.productId,
      variantId: item.variantId,
      type: 'sale',
      quantity: -item.quantity,
      reference: order.id,
    });
  }
  
  // 7. Emit events
  emitEvent('payments.checkout.completed', { sessionId: session.id, orderId: order.id });
  emitEvent('payments.payment.succeeded', { paymentId: payment.id, amount: payment.amount });
}
```

### 3.5 Payment Processing Architecture

Payment processing is entirely Stripe Connect-based with platform fee collection:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PAYMENT PROCESSING ARCHITECTURE                       │
│                                                                          │
│  ┌──────────────┐                     ┌──────────────────────────────┐ │
│  │   Customer    │                     │        STRIPE PLATFORM       │ │
│  │   Browser     │                     │                              │ │
│  │              │                     │  ┌──────────────────────┐    │ │
│  │  Stripe.js   │────────────────────>│  │  Platform Account    │    │ │
│  │  Elements    │   Tokenized card    │  │  (MCV.ONE)           │    │ │
│  │              │                     │  │                      │    │ │
│  └──────────────┘                     │  │  Collects:           │    │ │
│                                        │  │  • Application fees  │    │ │
│                                        │  │  • Platform revenue  │    │ │
│                                        │  └──────────┬───────────┘    │ │
│                                        │             │                │ │
│                                        │             ▼                │ │
│                                        │  ┌──────────────────────┐    │ │
│                                        │  │  Connected Account   │    │ │
│                                        │  │  (Venture)           │    │ │
│                                        │  │                      │    │ │
│                                        │  │  Receives:           │    │ │
│                                        │  │  • Payment - fee     │    │ │
│                                        │  │  • Manages payouts   │    │ │
│                                        │  └──────────────────────┘    │ │
│                                        │                              │ │
│                                        └──────────────────────────────┘ │
│                                                                          │
│  PLATFORM FEE FLOW:                                                      │
│  ───────────────────                                                     │
│  Customer pays $100                                                      │
│  → Stripe processing fee: $3.20 (2.9% + $0.30)                         │
│  → Platform fee: $2.50 (2.5% application fee)                           │
│  → Venture receives: $94.30                                              │
│                                                                          │
│  TIERED FEE EXAMPLE:                                                     │
│  ──────────────────                                                      │
│  Volume < $100K/mo  → 3.0% platform fee                                │
│  Volume $100K-500K  → 2.5% platform fee                                │
│  Volume $500K-$1M   → 2.0% platform fee                                │
│  Volume > $1M       → 1.5% platform fee                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.6 POS Integration Architecture

Point of Sale extends the online checkout flow for in-person payments:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        POS ARCHITECTURE                                  │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  POS Client   │    │  Commerce    │    │   Stripe     │              │
│  │  (Register)   │    │  Backend     │    │   Terminal   │              │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘              │
│         │                    │                    │                      │
│         │ 1. registerReader  │                    │                      │
│         │───────────────────>│ 2. Create reader   │                      │
│         │                    │───────────────────>│                      │
│         │                    │ 3. Reader object   │                      │
│         │                    │<───────────────────│                      │
│         │ 4. Reader ready    │                    │                      │
│         │<───────────────────│                    │                      │
│         │                    │                    │                      │
│         │ 5. addLineItems    │                    │                      │
│         │───────────────────>│                    │                      │
│         │                    │                    │                      │
│         │ 6. collectPayment  │                    │                      │
│         │───────────────────>│ 7. Create PI      │                      │
│         │                    │───────────────────>│                      │
│         │                    │ 8. Present on      │                      │
│         │                    │    reader           │                      │
│         │                    │───────────────────>│                      │
│         │                    │                    │                      │
│         │                    │  9. Customer taps  │                      │
│         │                    │     card            │                      │
│         │                    │                    │                      │
│         │                    │ 10. PI succeeded   │                      │
│         │                    │<───────────────────│                      │
│         │                    │                    │                      │
│         │ 11. Payment done   │                    │                      │
│         │<───────────────────│                    │                      │
│         │                    │                    │                      │
│         │ 12. Print/email    │                    │                      │
│         │    receipt         │                    │                      │
│         │                    │                    │                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.7 Subscription Billing Architecture

Subscriptions are managed via Stripe Billing with bidirectional sync:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   SUBSCRIPTION BILLING ARCHITECTURE                      │
│                                                                          │
│  LIFECYCLE STATE MACHINE:                                                │
│                                                                          │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                       │
│  │ TRIALING │────>│  ACTIVE  │────>│ CANCELED │                       │
│  └──────────┘     └──────────┘     └──────────┘                       │
│                        │  ▲                ▲                             │
│                        │  │                │                             │
│                        ▼  │                │                             │
│                   ┌──────────┐             │                             │
│                   │ PAST_DUE │─────────────┘                            │
│                   └──────────┘     (retry exhaustion)                    │
│                        │                                                 │
│                        ▼                                                 │
│                   ┌──────────┐                                          │
│                   │  UNPAID  │                                          │
│                   └──────────┘                                          │
│                                                                          │
│                   ┌──────────┐                                          │
│                   │  PAUSED  │←── (admin pause)                         │
│                   └──────────┘──> ACTIVE (resume)                       │
│                                                                          │
│  BILLING CYCLE:                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐        │
│  │  Period   │───>│  Invoice │───>│  Charge  │───>│  Receipt │        │
│  │  Start    │    │  Created │    │  Attempt │    │  Sent    │        │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘        │
│                                       │                                  │
│                                       │ Failed?                          │
│                                       ▼                                  │
│                                  ┌──────────┐                           │
│                                  │  Retry   │ (3 attempts over 14 days) │
│                                  │  Queue   │                           │
│                                  └──────────┘                           │
│                                                                          │
│  PRORATION (Plan Change):                                                │
│                                                                          │
│  Day 15 of 30-day period, upgrade from $29 → $79:                       │
│  • Unused time credit: $29 × (15/30) = $14.50 credit                   │
│  • New plan charge: $79 × (15/30) = $39.50                             │
│  • Net charge: $39.50 - $14.50 = $25.00                                │
│  • Next full invoice: $79.00 on next period                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.8 Shipping & Fulfillment Architecture

Shipping integrates with external carrier APIs through @mcv/connectors:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   SHIPPING & FULFILLMENT FLOW                            │
│                                                                          │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐                 │
│  │  Order    │───>│  Fulfillment │───>│  Carrier     │                 │
│  │  Created  │    │  Service     │    │  Connector   │                 │
│  └──────────┘    └──────┬───────┘    └──────┬───────┘                 │
│                         │                    │                          │
│                         ▼                    ▼                          │
│                  ┌────────────┐       ┌────────────┐                   │
│                  │  Calculate │       │  Compare   │                   │
│                  │  Dim Weight│       │  Rates     │                   │
│                  └────────────┘       └────────────┘                   │
│                                             │                          │
│                                             ▼                          │
│                  ┌────────────┐       ┌────────────┐                   │
│                  │  Generate  │<──────│  Select    │                   │
│                  │  Label     │       │  Carrier   │                   │
│                  └────────────┘       └────────────┘                   │
│                         │                                              │
│                         ▼                                              │
│                  ┌────────────┐       ┌────────────┐                   │
│                  │  Track     │──────>│  Notify    │                   │
│                  │  Shipment  │       │  Customer  │                   │
│                  └────────────┘       └────────────┘                   │
│                                                                          │
│  RATE CALCULATION:                                                       │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │  Input:                                                    │          │
│  │  • Origin address (venture warehouse)                     │          │
│  │  • Destination address (customer)                         │          │
│  │  • Package dimensions + weight                            │          │
│  │  • Declared value (for insurance)                         │          │
│  │                                                            │          │
│  │  Output per carrier:                                      │          │
│  │  • Service level (Economy, Priority, Express)             │          │
│  │  • Rate in cents                                          │          │
│  │  • Estimated delivery days                                │          │
│  │  • Tracking availability                                  │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.9 Tax Calculation Architecture

Tax resolution follows a hierarchical lookup strategy:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     TAX CALCULATION PIPELINE                             │
│                                                                          │
│  INPUT:                                                                  │
│  ┌─────────────────────────────────────────────────┐                   │
│  │  • Product tax category ID                       │                   │
│  │  • Customer location (country, state, postal)    │                   │
│  │  • Line item amount                              │                   │
│  │  • Tax-inclusive flag                             │                   │
│  └──────────────────────┬──────────────────────────┘                   │
│                         │                                                │
│                         ▼                                                │
│  RATE RESOLUTION (most specific wins):                                   │
│  ┌─────────────────────────────────────────────────┐                   │
│  │  1. Look up by (category, country, state, postal)│  ← Most specific │
│  │     Found? → Use this rate                        │                   │
│  │                                                   │                   │
│  │  2. Look up by (category, country, state)         │                   │
│  │     Found? → Use this rate                        │                   │
│  │                                                   │                   │
│  │  3. Look up by (category, country)                │                   │
│  │     Found? → Use this rate                        │                   │
│  │                                                   │                   │
│  │  4. Use tax category default rate                 │  ← Fallback      │
│  └──────────────────────┬──────────────────────────┘                   │
│                         │                                                │
│                         ▼                                                │
│  COMPOUND TAX CHECK:                                                     │
│  ┌─────────────────────────────────────────────────┐                   │
│  │  If multiple rates apply (e.g., state + district):│                   │
│  │                                                   │                   │
│  │  Non-compound (default):                          │                   │
│  │    tax = amount × (rate1 + rate2)                 │                   │
│  │    Example: $100 × (7.25% + 1.25%) = $8.50      │                   │
│  │                                                   │                   │
│  │  Compound:                                        │                   │
│  │    tax1 = amount × rate1                          │                   │
│  │    tax2 = (amount + tax1) × rate2                 │                   │
│  │    Example: $100 × 7.25% = $7.25                 │                   │
│  │             $107.25 × 1.25% = $1.34              │                   │
│  │             Total tax = $8.59                     │                   │
│  └──────────────────────┬──────────────────────────┘                   │
│                         │                                                │
│                         ▼                                                │
│  TAX-INCLUSIVE HANDLING:                                                  │
│  ┌─────────────────────────────────────────────────┐                   │
│  │  If tax-inclusive pricing:                        │                   │
│  │    taxAmount = amount - (amount / (1 + rate))     │                   │
│  │    preTaxAmount = amount - taxAmount              │                   │
│  │                                                   │                   │
│  │  If tax-exclusive (default):                      │                   │
│  │    taxAmount = amount × rate                      │                   │
│  │    total = amount + taxAmount                     │                   │
│  └─────────────────────────────────────────────────┘                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.10 Wholesale Pricing Architecture

Wholesale pricing uses a priority-based rule evaluation engine:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WHOLESALE PRICING ENGINE                               │
│                                                                          │
│  INPUT:                                                                  │
│  ┌────────────────────────────────────────────┐                         │
│  │  • Product ID                               │                         │
│  │  • Quantity                                  │                         │
│  │  • Customer group ID (optional)             │                         │
│  │  • Current date (for time-limited rules)    │                         │
│  └────────────────────┬───────────────────────┘                         │
│                       │                                                  │
│                       ▼                                                  │
│  RULE COLLECTION:                                                        │
│  ┌────────────────────────────────────────────┐                         │
│  │  Fetch all active price rules for product   │                         │
│  │  ORDER BY priority DESC                     │                         │
│  └────────────────────┬───────────────────────┘                         │
│                       │                                                  │
│                       ▼                                                  │
│  RULE EVALUATION (highest priority first):                               │
│  ┌────────────────────────────────────────────┐                         │
│  │                                             │                         │
│  │  1. customer_group rules                    │  Priority: 10+         │
│  │     → Match on customerGroupId              │                         │
│  │     → Apply discount percentage             │                         │
│  │                                             │                         │
│  │  2. time_limited rules                      │  Priority: 5-9         │
│  │     → Check startDate ≤ now ≤ endDate       │                         │
│  │     → Apply fixed price or discount         │                         │
│  │                                             │                         │
│  │  3. tiered rules                            │  Priority: 1-4         │
│  │     → Find tier matching quantity            │                         │
│  │     → Apply tier price                       │                         │
│  │                                             │                         │
│  │  4. volume rules                            │  Priority: 0           │
│  │     → Check minQuantity/maxQuantity         │                         │
│  │     → Apply fixed price or discount         │                         │
│  │                                             │                         │
│  └────────────────────┬───────────────────────┘                         │
│                       │                                                  │
│                       ▼                                                  │
│  PRICE RESOLUTION:                                                       │
│  ┌────────────────────────────────────────────┐                         │
│  │  If multiple rules match:                   │                         │
│  │  → Highest priority rule wins               │                         │
│  │  → Return { basePrice, effectivePrice,      │                         │
│  │            appliedRule, savings }             │                         │
│  │                                             │                         │
│  │  If no rules match:                         │                         │
│  │  → Return base product price                │                         │
│  └────────────────────────────────────────────┘                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Database Schema Overview

Commerce uses **36 tables** organized into three logical schemas:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA MAP                               │
│                                                                          │
│  CATALOG SCHEMA (11 tables)        PAYMENTS SCHEMA (13 tables)          │
│  ┌───────────────────────┐        ┌───────────────────────┐             │
│  │ products              │        │ stripe_accounts       │             │
│  │ product_variants      │        │ payment_products      │             │
│  │ product_categories    │        │ payment_prices        │             │
│  │ price_rules           │        │ payment_customers     │             │
│  │ discount_codes        │        │ payment_subscriptions │             │
│  │ tax_categories        │        │ payment_invoices      │             │
│  │ tax_rates             │        │ payment_transactions  │             │
│  │ inventory_movements   │        │ payment_refunds       │             │
│  │ product_collections   │        │ payment_disputes      │             │
│  │ collection_products   │        │ payment_payouts       │             │
│  │                       │        │ payment_tax_rates     │             │
│  └───────────────────────┘        │ payment_checkout_sess │             │
│                                    │ payment_links         │             │
│                                    └───────────────────────┘             │
│                                                                          │
│  INVOICING SCHEMA (12 tables)                                            │
│  ┌───────────────────────┐                                              │
│  │ invoice_templates     │                                              │
│  │ invoices_v2           │                                              │
│  │ proposals             │                                              │
│  │ estimates             │                                              │
│  │ recurring_invoices    │                                              │
│  │ credit_notes          │                                              │
│  │ payment_receipts      │                                              │
│  │ platform_fee_configs  │                                              │
│  │ platform_fee_ledger   │                                              │
│  │ approval_workflows    │                                              │
│  │ approval_requests     │                                              │
│  │ approval_decisions    │                                              │
│  └───────────────────────┘                                              │
│                                                                          │
│  ENUMS: 28 PostgreSQL enum types                                         │
│  INDEXES: 45+ covering all common query patterns                         │
│  JSONB COLUMNS: 21 for flexible/nested data                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Drizzle ORM Schema Definitions

#### Products Table

```typescript
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  categoryId: uuid('category_id').references(() => productCategories.id),
  
  // Identity
  name: varchar('name', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 600 }).notNull(),
  sku: varchar('sku', { length: 100 }),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  type: productTypeEnum('type').notNull().default('physical'),
  status: productStatusEnum('status').notNull().default('draft'),
  
  // Pricing
  basePrice: integer('base_price').notNull().default(0),
  compareAtPrice: integer('compare_at_price'),
  costPrice: integer('cost_price'),
  currency: varchar('currency', { length: 3 }).notNull().default('usd'),
  taxable: boolean('taxable').notNull().default(true),
  taxCategoryId: uuid('tax_category_id').references(() => taxCategories.id),
  
  // Media & Attributes
  images: jsonb('images').$type<ProductImage[]>().default([]),
  attributes: jsonb('attributes').$type<Record<string, unknown>>().default({}),
  variants: jsonb('variants').$type<Record<string, string[]>>().default({}),
  tags: text('tags').array().default([]),
  
  // SEO
  metaTitle: varchar('meta_title', { length: 200 }),
  metaDescription: text('meta_description'),
  
  // Inventory
  trackInventory: boolean('track_inventory').notNull().default(false),
  inventoryQuantity: integer('inventory_quantity').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(5),
  allowBackorder: boolean('allow_backorder').notNull().default(false),
  
  // Physical
  weight: decimal('weight', { precision: 10, scale: 3 }),
  weightUnit: varchar('weight_unit', { length: 5 }).notNull().default('kg'),
  dimensions: jsonb('dimensions').$type<ProductDimensions>(),
  
  // Digital
  digitalFileUrl: text('digital_file_url'),
  downloadLimit: integer('download_limit'),
  expiryDays: integer('expiry_days'),
  
  // Stripe
  stripeProductId: varchar('stripe_product_id', { length: 100 }),
  stripePriceId: varchar('stripe_price_id', { length: 100 }),
  
  // Visibility
  isPublic: boolean('is_public').notNull().default(false),
  isFeatured: boolean('is_featured').notNull().default(false),
  
  // Audit
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('product_venture_idx').on(table.ventureId),
  categoryIdx: index('product_category_idx').on(table.categoryId),
  skuIdx: index('product_sku_idx').on(table.ventureId, table.sku),
  slugIdx: index('product_slug_idx').on(table.ventureId, table.slug),
  statusIdx: index('product_status_idx').on(table.ventureId, table.status),
  typeIdx: index('product_type_idx').on(table.ventureId, table.type),
  createdIdx: index('product_created_idx').on(table.createdAt),
  featuredIdx: index('product_featured_idx').on(table.ventureId, table.isFeatured),
  publicIdx: index('product_public_idx').on(table.ventureId, table.isPublic),
}));
```

#### Product Variants Table

```typescript
export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  name: varchar('name', { length: 200 }).notNull(),
  sku: varchar('sku', { length: 100 }),
  price: integer('price').notNull(),
  compareAtPrice: integer('compare_at_price'),
  attributes: jsonb('attributes').$type<Record<string, string>>().default({}),
  inventoryQuantity: integer('inventory_quantity').notNull().default(0),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  stripePriceId: varchar('stripe_price_id', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  productIdx: index('variant_product_idx').on(table.productId),
  ventureIdx: index('variant_venture_idx').on(table.ventureId),
  skuIdx: index('variant_sku_idx').on(table.ventureId, table.sku),
}));
```

#### Product Categories Table (Materialized Path)

```typescript
export const productCategories = pgTable('product_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  parentId: uuid('parent_id').references(() => productCategories.id),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 250 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  level: integer('level').notNull().default(0),
  path: varchar('path', { length: 1000 }).notNull(),
  productCount: integer('product_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('category_venture_idx').on(table.ventureId),
  pathIdx: index('category_path_idx').on(table.ventureId, table.path),
  parentIdx: index('category_parent_idx').on(table.parentId),
  slugIdx: index('category_slug_idx').on(table.ventureId, table.slug),
}));
```

#### Stripe Accounts Table

```typescript
export const stripeAccounts = pgTable('stripe_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  stripeAccountId: varchar('stripe_account_id', { length: 100 }).notNull(),
  accountType: stripeAccountTypeEnum('account_type').notNull().default('express'),
  status: stripeAccountStatusEnum('status').notNull().default('pending'),
  businessName: varchar('business_name', { length: 200 }),
  email: varchar('email', { length: 300 }),
  country: varchar('country', { length: 2 }).notNull().default('US'),
  currency: varchar('currency', { length: 3 }).notNull().default('usd'),
  chargesEnabled: boolean('charges_enabled').notNull().default(false),
  payoutsEnabled: boolean('payouts_enabled').notNull().default(false),
  detailsSubmitted: boolean('details_submitted').notNull().default(false),
  onboardingUrl: text('onboarding_url'),
  applicationFeePercent: decimal('application_fee_percent', { precision: 5, scale: 2 }).notNull().default('2.50'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('stripe_account_venture_idx').on(table.ventureId),
  stripeIdIdx: uniqueIndex('stripe_account_stripe_id').on(table.stripeAccountId),
}));
```

#### Invoices V2 Table

```typescript
export const invoicesV2 = pgTable('invoices_v2', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  contactId: uuid('contact_id'),
  organizationId: uuid('organization_id'),
  templateId: uuid('template_id').references(() => invoiceTemplates.id),
  recurringInvoiceId: uuid('recurring_invoice_id').references(() => recurringInvoices.id),
  number: varchar('number', { length: 50 }).notNull(),
  status: invoiceV2StatusEnum('status').notNull().default('draft'),
  issueDate: timestamp('issue_date').notNull().defaultNow(),
  dueDate: timestamp('due_date'),
  lineItems: jsonb('line_items').$type<InvoiceV2LineItem[]>().notNull().default([]),
  subtotal: integer('subtotal').notNull().default(0),
  taxAmount: integer('tax_amount').notNull().default(0),
  discountAmount: integer('discount_amount').notNull().default(0),
  total: integer('total').notNull().default(0),
  amountPaid: integer('amount_paid').notNull().default(0),
  amountDue: integer('amount_due').notNull().default(0),
  currency: varchar('currency', { length: 3 }).notNull().default('usd'),
  notes: text('notes'),
  terms: text('terms'),
  paymentLink: text('payment_link'),
  stripeInvoiceId: varchar('stripe_invoice_id', { length: 100 }),
  sentAt: timestamp('sent_at'),
  viewedAt: timestamp('viewed_at'),
  paidAt: timestamp('paid_at'),
  reminders: jsonb('reminders').$type<InvoiceReminder[]>(),
  customFields: jsonb('custom_fields').$type<Record<string, string>>(),
  billingAddress: jsonb('billing_address').$type<InvoiceAddress>(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('invoice_v2_venture_idx').on(table.ventureId),
  statusIdx: index('invoice_v2_status_idx').on(table.ventureId, table.status),
  numberIdx: index('invoice_v2_number_idx').on(table.ventureId, table.number),
  dueDateIdx: index('invoice_v2_due_date_idx').on(table.dueDate),
  contactIdx: index('invoice_v2_contact_idx').on(table.contactId),
  recurringIdx: index('invoice_v2_recurring_idx').on(table.recurringInvoiceId),
}));
```

#### Payment Transactions Table

```typescript
export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  customerId: uuid('customer_id').notNull().references(() => paymentCustomers.id),
  invoiceId: uuid('invoice_id').references(() => paymentInvoices.id),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 100 }),
  stripeChargeId: varchar('stripe_charge_id', { length: 100 }),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('usd'),
  status: paymentStatusEnum('status').notNull(),
  paymentMethod: paymentMethodTypeEnum('payment_method'),
  cardBrand: varchar('card_brand', { length: 50 }),
  cardLast4: varchar('card_last4', { length: 4 }),
  receiptUrl: text('receipt_url'),
  applicationFeeAmount: integer('application_fee_amount'),
  refundedAmount: integer('refunded_amount').notNull().default(0),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('payment_tx_venture_idx').on(table.ventureId),
  customerIdx: index('payment_tx_customer_idx').on(table.customerId),
  statusIdx: index('payment_tx_status_idx').on(table.ventureId, table.status),
  createdIdx: index('payment_tx_created_idx').on(table.createdAt),
  stripePiIdx: uniqueIndex('payment_tx_stripe_pi_idx').on(table.stripePaymentIntentId),
  stripeChargeIdx: index('payment_tx_stripe_charge_idx').on(table.stripeChargeId),
}));
```

#### Payment Subscriptions Table

```typescript
export const paymentSubscriptions = pgTable('payment_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  customerId: uuid('customer_id').notNull().references(() => paymentCustomers.id),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }),
  status: paymentSubscriptionStatusEnum('status').notNull().default('trialing'),
  priceId: uuid('price_id').references(() => paymentPrices.id),
  quantity: integer('quantity').notNull().default(1),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAt: timestamp('cancel_at'),
  canceledAt: timestamp('canceled_at'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  applicationFeePercent: decimal('application_fee_percent', { precision: 5, scale: 2 }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('sub_venture_idx').on(table.ventureId),
  customerIdx: index('sub_customer_idx').on(table.customerId),
  statusIdx: index('sub_status_idx').on(table.ventureId, table.status),
  stripeIdx: uniqueIndex('sub_stripe_idx').on(table.stripeSubscriptionId),
  periodEndIdx: index('sub_period_end_idx').on(table.currentPeriodEnd),
}));
```

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIPS                                  │
│                                                                          │
│  CATALOG DOMAIN:                                                         │
│                                                                          │
│  product_categories ──< products ──< product_variants                   │
│        │                   │                                             │
│        │ (tree)            │──< inventory_movements                     │
│        │                   │                                             │
│        └─ parent_id ──>    │──< price_rules                            │
│           product_categories│                                            │
│                            │──< collection_products >── product_collects│
│                            │                                             │
│                            └── tax_category_id ──> tax_categories       │
│                                                        │                 │
│                                                        └──< tax_rates   │
│                                                                          │
│  discount_codes (standalone, references product/category IDs in JSONB)   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  PAYMENTS DOMAIN:                                                        │
│                                                                          │
│  stripe_accounts ──< payment_products ──< payment_prices                │
│        │                                       │                         │
│        │                                       ├── payment_subscriptions │
│        │                                       └── payment_invoices      │
│        │                                                                 │
│        └──< payment_customers ──< payment_subscriptions                 │
│                    │              │                                       │
│                    │              └──< payment_invoices                  │
│                    │                                                     │
│                    └──< payment_transactions ──< payment_refunds        │
│                                   │                                      │
│                                   └──< payment_disputes                 │
│                                                                          │
│  payment_payouts (linked to stripe_accounts)                             │
│  payment_checkout_sessions                                               │
│  payment_links                                                           │
│  payment_tax_rates                                                       │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  INVOICING DOMAIN:                                                       │
│                                                                          │
│  invoice_templates ──< invoices_v2                                      │
│                            │                                             │
│                            ├──< credit_notes                            │
│                            └──< payment_receipts                        │
│                                                                          │
│  recurring_invoices ──< invoices_v2 (via recurring_invoice_id)          │
│                                                                          │
│  proposals (standalone, converts to invoices_v2)                         │
│  estimates (standalone, converts to invoices_v2 via progress invoicing)  │
│                                                                          │
│  approval_workflows ──< approval_requests ──< approval_decisions        │
│                                                                          │
│  platform_fee_configs ──< platform_fee_ledger                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow & Events

### Event Architecture

Commerce emits structured audit events for every significant operation. Events are published to Redpanda/Kafka topics for consumption by downstream services:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      EVENT FLOW ARCHITECTURE                             │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐ │
│  │  Commerce     │───>│  Event       │───>│  Redpanda/Kafka          │ │
│  │  Service      │    │  Emitter     │    │                          │ │
│  │  Layer        │    │              │    │  Topics:                  │ │
│  └──────────────┘    └──────────────┘    │  • commerce.catalog.*    │ │
│                                           │  • commerce.payments.*   │ │
│                                           │  • commerce.invoicing.*  │ │
│                                           └──────────┬───────────────┘ │
│                                                      │                  │
│                          ┌───────────────────────────┼───────────┐     │
│                          │                           │           │     │
│                          ▼                           ▼           ▼     │
│                   ┌──────────────┐    ┌──────────────┐  ┌───────────┐│
│                   │  @mcv/       │    │  @mcv/       │  │  @mcv/    ││
│                   │  analytics   │    │  engagement  │  │  growth   ││
│                   │              │    │              │  │           ││
│                   │  Revenue     │    │  Purchase    │  │  Referral ││
│                   │  dashboards  │    │  emails      │  │  rewards  ││
│                   │  Funnels     │    │  Campaigns   │  │  Loyalty  ││
│                   └──────────────┘    └──────────────┘  └───────────┘│
│                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Event Catalog

#### Catalog Events

| Event | Trigger | Payload |
|---|---|---|
| `catalog.product.created` | Product creation | productId, name, type, status, userId |
| `catalog.product.updated` | Product update | productId, changedFields, userId |
| `catalog.product.deleted` | Product deletion | productId, name, userId |
| `catalog.product.stripe_synced` | Stripe sync | productId, stripeProductId, stripePriceId |
| `catalog.category.created` | Category creation | categoryId, name, parentId |
| `catalog.category.moved` | Category reparent | categoryId, oldParentId, newParentId |
| `catalog.discount.applied` | Discount applied to cart | discountId, code, cartTotal, discountAmount |
| `catalog.inventory.movement` | Inventory change | productId, variantId, type, quantity |
| `catalog.inventory.low_stock` | Below threshold | productId, quantity, threshold |
| `catalog.collection.evaluated` | Auto-rules evaluated | collectionId, added, removed |

#### Payment Events

| Event | Trigger | Payload |
|---|---|---|
| `payments.account.created` | Stripe account created | accountId, stripeAccountId, type |
| `payments.account.activated` | Onboarding complete | accountId, stripeAccountId |
| `payments.checkout.created` | Checkout session created | sessionId, mode, totalAmount |
| `payments.checkout.completed` | Payment successful | sessionId, paymentIntentId, amount |
| `payments.payment.succeeded` | Payment successful | paymentId, amount, method |
| `payments.payment.failed` | Payment failed | paymentId, amount, errorCode |
| `payments.refund.created` | Refund initiated | refundId, paymentId, amount, reason |
| `payments.dispute.opened` | Dispute filed | disputeId, paymentId, amount |
| `payments.subscription.created` | Subscription started | subId, customerId, priceId |
| `payments.subscription.canceled` | Subscription canceled | subId, reason |
| `payments.subscription.renewed` | Billing cycle renewed | subId, invoiceId, amount |

#### Invoicing Events

| Event | Trigger | Payload |
|---|---|---|
| `invoicing.invoice.created` | Invoice created | invoiceId, number, total |
| `invoicing.invoice.sent` | Invoice sent | invoiceId, contactId |
| `invoicing.invoice.viewed` | Client viewed | invoiceId, viewedAt |
| `invoicing.invoice.paid` | Full payment | invoiceId, amount |
| `invoicing.invoice.overdue` | Past due date | invoiceId, dueDate, amountDue |
| `invoicing.proposal.accepted` | Proposal accepted | proposalId, signatureUrl |
| `invoicing.proposal.converted` | Converted to invoice | proposalId, invoiceId |
| `invoicing.estimate.converted` | Converted to invoice | estimateId, invoiceId, milestonePercent |
| `invoicing.recurring.generated` | Invoice auto-generated | recurringId, invoiceId |
| `invoicing.approval.decided` | Approval decision | requestId, decision, decidedBy |

### Webhook Data Flow

Stripe webhooks are the primary mechanism for payment state synchronization:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WEBHOOK PROCESSING PIPELINE                           │
│                                                                          │
│  Stripe ──> /api/webhooks/stripe                                        │
│                    │                                                     │
│                    ▼                                                     │
│             ┌──────────────┐                                            │
│             │  Signature   │  Verify stripe-signature header            │
│             │  Validation  │  using STRIPE_WEBHOOK_SECRET               │
│             └──────┬───────┘                                            │
│                    │                                                     │
│                    ▼                                                     │
│             ┌──────────────┐                                            │
│             │  Event       │  Parse event type and route to             │
│             │  Router      │  appropriate handler                       │
│             └──────┬───────┘                                            │
│                    │                                                     │
│          ┌─────────┼─────────────────────────┐                          │
│          │         │                         │                          │
│          ▼         ▼                         ▼                          │
│  ┌──────────┐ ┌──────────┐          ┌──────────────┐                  │
│  │ Account  │ │ Payment  │          │ Subscription │                  │
│  │ Handler  │ │ Handler  │          │ Handler      │                  │
│  └──────────┘ └──────────┘          └──────────────┘                  │
│                                                                          │
│  IDEMPOTENCY:                                                           │
│  • Each Stripe event has a unique ID (evt_xxx)                          │
│  • Handlers use Stripe object IDs as unique keys                        │
│  • Duplicate webhooks are safely skipped                                │
│  • Missed webhooks are reconciled every 4 hours                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### Internal Integrations

| Module | Integration Type | Data Flow |
|---|---|---|
| `@mcv/kernel` | Middleware | Provides ventureId context, auth procedures |
| `@mcv/identity` | Authentication | User session, role verification |
| `@mcv/db` | Data access | Drizzle connection, schema types |
| `@mcv/shared` | Utilities | Zod schemas, helper functions |
| `@mcv/fabric` | UI components | React components consume commerce hooks |
| `@mcv/crm` | Contact lookup | contactId/organizationId for invoicing |
| `@mcv/connectors/email` | Email delivery | Invoice, proposal, receipt emails |
| `@mcv/connectors/shipping` | Carrier APIs | Rate calculation, label generation |
| `@mcv/intelligence` | AI features | Product descriptions, pricing suggestions |

### External Integrations

| Service | Protocol | Purpose |
|---|---|---|
| Stripe Connect API | REST/HTTPS | Payments, subscriptions, invoicing, payouts |
| Stripe Webhooks | HTTPS POST | Real-time payment state sync |
| Stripe Terminal | WebSocket | POS reader communication |
| Carrier APIs | REST | Shipping rates and tracking (via connectors) |
| Email Provider | SMTP/API | Invoice and notification delivery (via connectors) |

---

## Performance Architecture

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MULTI-LAYER CACHE ARCHITECTURE                        │
│                                                                          │
│  LAYER 1: In-Memory (Node.js Process)                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  • Tax rate lookups (TTL: 24h, ~100 entries per venture)        │   │
│  │  • Discount code existence check (TTL: 5min)                    │   │
│  │  • Stripe account status (TTL: 1h)                              │   │
│  │  • Category tree structure (TTL: 1h)                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  LAYER 2: Redis (Shared Cache)                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  • Cart sessions (TTL: 72h)                                     │   │
│  │    Key: cart:{sessionId}                                        │   │
│  │    Value: serialized cart with items                             │   │
│  │                                                                  │   │
│  │  • Product catalog pages (TTL: 5min)                            │   │
│  │    Key: products:{ventureId}:{page}:{filters_hash}              │   │
│  │    Value: serialized product list                                │   │
│  │                                                                  │   │
│  │  • Revenue metrics (TTL: 15min)                                 │   │
│  │    Key: revenue:{ventureId}:{metric}                            │   │
│  │    Value: computed metric value                                  │   │
│  │                                                                  │   │
│  │  • Rate limiting counters                                       │   │
│  │    Key: ratelimit:{ventureId}:{endpoint}                        │   │
│  │    Value: request count with sliding window                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  LAYER 3: PostgreSQL (Source of Truth)                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  • Materialized views for revenue aggregates                    │   │
│  │  • Denormalized product_count on categories                     │   │
│  │  • Pre-computed inventory summaries                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  CACHE INVALIDATION PATTERNS:                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Write-through: Cart mutations update cache immediately         │   │
│  │  TTL-based: Product catalog, revenue metrics auto-expire        │   │
│  │  Event-driven: Stripe webhooks invalidate payment state cache   │   │
│  │  Manual: Admin can force-flush category tree cache              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Query Optimization Patterns

| Pattern | Strategy | Example |
|---|---|---|
| **Paginated lists** | Composite index + offset | `(venture_id, status) + LIMIT/OFFSET` |
| **Text search** | pg_trgm GIN index | `name ILIKE '%query%'` with trigram index |
| **Tree traversal** | Materialized path | `path LIKE 'electronics/%'` for descendants |
| **Stripe lookups** | Unique index | `stripe_subscription_id` for webhook routing |
| **Date ranges** | B-tree index | `created_at` for time-series queries |
| **Aggregations** | Materialized views | Pre-computed revenue per period |
| **Count queries** | Denormalization | `product_count` on categories |

### Connection Pooling

```typescript
// Database connection pool configuration
const pool = {
  min: 5,               // Minimum connections maintained
  max: 20,              // Maximum connections in pool
  idleTimeoutMs: 30000, // Close idle connections after 30s
  acquireTimeoutMs: 10000, // Timeout waiting for connection
};
```

---

## Scalability

### Horizontal Scaling

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCALING ARCHITECTURE                                   │
│                                                                          │
│  ┌──────────────┐                                                       │
│  │ Load Balancer │                                                       │
│  └──────┬───────┘                                                       │
│         │                                                                │
│    ┌────┼────────────────────────┐                                      │
│    │    │                        │                                      │
│    ▼    ▼                        ▼                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐                                   │
│  │ Node 1 │  │ Node 2 │  │ Node N │  (Stateless API servers)          │
│  └───┬────┘  └───┬────┘  └───┬────┘                                   │
│      │           │           │                                          │
│      └───────────┼───────────┘                                          │
│                  │                                                       │
│         ┌────────┼────────┐                                             │
│         │        │        │                                             │
│         ▼        ▼        ▼                                             │
│  ┌──────────┐ ┌──────┐ ┌──────────┐                                   │
│  │ PostgreSQL│ │Redis │ │ Redpanda │                                   │
│  │ Primary + │ │Cluster│ │  Cluster │                                   │
│  │ Replicas  │ │      │ │          │                                   │
│  └──────────┘ └──────┘ └──────────┘                                   │
│                                                                          │
│  SCALING TRIGGERS:                                                       │
│  • API servers: CPU > 70% or request latency > 200ms                   │
│  • PostgreSQL replicas: Read query latency > 100ms                     │
│  • Redis: Memory usage > 75% or connection count > 500                 │
│  • Redpanda: Consumer lag > 10,000 events                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Scaling Strategy

| Technique | When | Benefit |
|---|---|---|
| Read replicas | Reporting queries | Offload analytics from primary |
| Connection pooling | Always | Efficient connection reuse |
| Materialized views | Revenue reporting | Pre-computed aggregates |
| Partitioning | > 10M rows per table | Faster queries on large tables |
| Archival | > 1 year old data | Move historical data to archive |

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```typescript
interface CommerceError {
  code: string;          // Machine-readable error code (e.g., 'PRODUCT_NOT_FOUND')
  message: string;       // Human-readable description
  httpStatus: number;    // HTTP status code
  details?: Record<string, unknown>; // Additional context
}
```

### Error Categories

| Category | HTTP | Error Codes | Handling |
|---|---|---|---|
| Not Found | 404 | `*_NOT_FOUND` | Return null or throw |
| Conflict | 409 | `*_EXISTS`, `*_ALREADY_*` | Suggest resolution |
| Bad Request | 400 | Validation failures, state violations | Return field errors |
| Forbidden | 403 | `*_UNAUTHORIZED` | Check roles |
| Rate Limited | 429 | Rate limit exceeded | Return retry-after |
| Server Error | 500 | Unexpected failures | Log, alert, retry |

### Stripe Error Handling

```typescript
try {
  const session = await stripe.checkout.sessions.create(params, {
    stripeAccount: connectedAccountId,
  });
} catch (error) {
  if (error instanceof Stripe.errors.StripeError) {
    switch (error.type) {
      case 'StripeCardError':
        // Card declined — return to customer
        throw new TRPCError({ code: 'BAD_REQUEST', message: error.message });
      case 'StripeRateLimitError':
        // Stripe rate limited — retry with backoff
        await sleep(1000);
        return retry();
      case 'StripeInvalidRequestError':
        // Bad params — log and fix
        logger.error('Stripe invalid request', { error, params });
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      case 'StripeAuthenticationError':
        // Bad API key — alert ops
        logger.critical('Stripe auth failed', { error });
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      default:
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
  }
  throw error;
}
```

### Retry Strategy

| Operation | Max Retries | Backoff | Timeout |
|---|---|---|---|
| Stripe API calls | 3 | Exponential (1s, 2s, 4s) | 30s |
| Webhook processing | 5 | Linear (5s intervals) | 60s |
| Database transactions | 2 | Immediate | 10s |
| Email delivery | 3 | Exponential (30s, 5m, 30m) | 24h |

---

## Observability

### Structured Logging

```typescript
// All commerce operations use structured logging
logger.info('commerce.product.created', {
  ventureId,
  productId: product.id,
  productName: product.name,
  productType: product.type,
  userId,
  duration: Date.now() - startTime,
});

logger.warn('commerce.inventory.low_stock', {
  ventureId,
  productId,
  currentQuantity: 3,
  threshold: 25,
});

logger.error('commerce.stripe.webhook_failed', {
  eventType: event.type,
  eventId: event.id,
  error: error.message,
  stripeAccountId,
});
```

### Metrics

| Metric | Type | Labels |
|---|---|---|
| `commerce_orders_total` | Counter | venture_id, status |
| `commerce_payments_total` | Counter | venture_id, status, method |
| `commerce_payments_amount` | Histogram | venture_id, currency |
| `commerce_checkout_duration_ms` | Histogram | venture_id, mode |
| `commerce_api_requests_total` | Counter | router, procedure, status |
| `commerce_api_latency_ms` | Histogram | router, procedure |
| `commerce_webhook_latency_ms` | Histogram | event_type |
| `commerce_webhook_errors_total` | Counter | event_type, error_code |
| `commerce_subscriptions_active` | Gauge | venture_id |
| `commerce_invoices_overdue` | Gauge | venture_id |
| `commerce_revenue_mrr` | Gauge | venture_id, currency |
| `commerce_cart_items` | Histogram | venture_id |
| `commerce_cache_hit_rate` | Gauge | cache_name |

### Health Checks

```typescript
// Commerce health check endpoint
async function healthCheck() {
  const checks = {
    database: await checkDatabase(),    // SELECT 1
    stripe: await checkStripe(),        // Verify API key
    redis: await checkRedis(),          // PING
    webhookSync: await checkWebhookSync(), // Last processed timestamp
  };
  
  const healthy = Object.values(checks).every(c => c.status === 'ok');
  return { status: healthy ? 'healthy' : 'degraded', checks };
}
```

---

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                                      │
│                                                                          │
│  Layer 1: Network                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  • TLS 1.3 for all connections                                  │   │
│  │  • WAF rules for common attack patterns                         │   │
│  │  • IP allowlisting for webhook endpoints                        │   │
│  │  • DDoS protection via CDN                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Layer 2: Authentication                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  • Supabase Auth with JWT tokens                                │   │
│  │  • CSRF protection on all mutations                             │   │
│  │  • Session management via @mcv/identity                         │   │
│  │  • Stripe webhook signature verification                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Layer 3: Authorization                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  • Role-based access control (venture, admin, super admin)      │   │
│  │  • Procedure-level auth middleware                               │   │
│  │  • Venture scoping on every query                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Layer 4: Data Protection                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  • PostgreSQL RLS for defense-in-depth tenant isolation         │   │
│  │  • Encryption at rest (database-level)                          │   │
│  │  • PCI compliance — no raw card data stored                     │   │
│  │  • Zod validation on all inputs                                 │   │
│  │  • HTML sanitization for templates and content blocks           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Layer 5: Monitoring                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  • Audit events for all mutations                               │   │
│  │  • Anomaly detection on payment patterns                        │   │
│  │  • Rate limiting per venture per endpoint                       │   │
│  │  • Failed auth attempt tracking                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Stripe Webhook Security

```typescript
// Webhook signature verification
function verifyWebhookSignature(req: Request): Stripe.Event {
  const sig = req.headers['stripe-signature'];
  const body = req.rawBody; // Must be raw body, not parsed
  
  try {
    return stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    logger.warn('commerce.webhook.signature_invalid', {
      error: err.message,
      ip: req.ip,
    });
    throw new Error('Invalid webhook signature');
  }
}
```

---

*@mcv/commerce — Commerce Platform Domain*