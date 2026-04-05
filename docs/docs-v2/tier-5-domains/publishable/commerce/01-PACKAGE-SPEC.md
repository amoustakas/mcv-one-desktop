# @mcv/commerce — Package Specification

| Field | Value |
|---|---|
| **Package** | `@mcv/commerce` |
| **Classification** | PUBLISHABLE |
| **Tier** | 5 (Domain Layer) |
| **Version** | 0.1.0 |
| **Status** | Specification |
| **Last Updated** | February 9, 2026 |
| **Maintainer** | MCV Platform Team |
| **License** | Proprietary (MCV.ONE Consortium) |

---

## Table of Contents

1. [Overview](#overview)
2. [Purpose & Scope](#purpose--scope)
3. [Module Summary](#module-summary)
4. [Architecture Position](#architecture-position)
5. [Key Interfaces & Types](#key-interfaces--types)
6. [Configuration](#configuration)
7. [Dependencies](#dependencies)
8. [Multi-Tenant Design](#multi-tenant-design)
9. [Security](#security)
10. [Performance](#performance)
11. [Deployment](#deployment)

---

## Overview

`@mcv/commerce` is the full-stack, multi-tenant commerce platform powering every revenue-generating activity within the MCV.ONE ecosystem. It spans the entire commercial lifecycle — from product catalog management and shopping cart operations through checkout, payment processing, invoicing, subscriptions, and fulfillment. Every venture on the platform receives an independent, fully-isolated commerce stack with its own Stripe Connect account, product catalog, tax configuration, and order pipeline.

As a **Tier 5 PUBLISHABLE** domain, `@mcv/commerce` is designed to be white-labeled and used by external organizations beyond the MCV consortium. This means the module adheres to strict API stability contracts, comprehensive documentation standards, and clean abstraction boundaries that allow third-party adopters to integrate the full commerce stack (or individual submodules) into their own platforms without coupling to MCV internals.

### Key Characteristics

- **11 focused submodules** composable independently or in concert
- **132 tRPC procedures** across 3 routers (catalog, payments, invoicing)
- **36 database tables** with comprehensive indexing
- **Stripe Connect native** — every venture gets its own Stripe account
- **Enterprise invoicing** — branded templates, approval workflows, e-signatures
- **Zero PCI exposure** — all card data handled by Stripe.js client-side tokenization
- **Full audit trail** — every commercial operation emits structured audit events
- **White-label ready** — venture-scoped branding, templates, and configuration

### What Commerce Is

- **Multi-tenant product catalog** with variants, pricing rules, collections, and Stripe sync
- **Session-based shopping cart** with discount code validation and tax calculation
- **Stripe Connect checkout** supporting one-time payments, subscriptions, and setup intents
- **Advanced invoicing** with branded templates, recurring schedules, credit notes, and approval workflows
- **Proposal and estimate system** with rich content blocks, e-signatures, version history, and progress invoicing
- **Subscription lifecycle management** with trials, pausing, cancellation, and usage-based billing
- **Tax engine** with multi-jurisdiction rates (country/state/postal), compound tax, and tax-inclusive pricing
- **Inventory tracking** with movement audit trail, low-stock alerts, and variant-level stock
- **Platform fee management** for Stripe Connect ecosystem (percentage, flat, tiered)
- **Revenue reporting** with MRR, ARR, churn rate, LTV, and per-product breakdown

### What Commerce Is Not

- Not a standalone storefront (it provides APIs; the UI is built with @mcv/fabric components)
- Not a shipping carrier integration (it tracks shipments; carrier APIs are in @mcv/connectors)
- Not a warehouse management system (it tracks inventory quantities, not bin locations)
- Not an accounting system (it feeds data to accounting integrations via @mcv/connectors)

---

## Purpose & Scope

### Purpose

The Commerce domain exists to provide a unified, modular, and enterprise-grade commercial infrastructure for the MCV.ONE platform. It solves the fundamental challenge of operating a multi-venture consortium where each venture has distinct commercial needs — a SaaS company needs subscriptions and usage billing, a retail venture needs catalogs and shipping, a consulting firm needs invoicing and proposals — all while sharing a common platform with centralized governance, unified analytics, and cross-venture platform fee management.

### Business Context

MCV.ONE operates a 9-venture consortium where each venture operates semi-independently but shares core platform infrastructure. The Commerce domain is the revenue engine that:

1. **Enables venture independence** — Each venture controls its own catalog, pricing, branding, and payment configuration
2. **Provides platform governance** — Super admins manage platform fees, cross-venture analytics, and compliance
3. **Supports diverse business models** — From physical product retail to SaaS subscriptions to professional services invoicing
4. **Scales with the ecosystem** — New ventures can spin up a full commerce stack in minutes
5. **Generates platform revenue** — Configurable per-venture platform fees on all transactions

### Scope Boundaries

#### In Scope

| Capability | Description |
|---|---|
| Product Management | Full CRUD for products, variants, categories, collections, pricing rules |
| Cart & Checkout | Session-based cart with discount validation, Stripe-hosted checkout |
| Payment Processing | Stripe Connect integration for charges, refunds, disputes, payouts |
| Subscription Management | Full lifecycle including trials, pausing, cancellation, usage billing |
| Invoicing | Branded templates, rich lifecycle, reminders, recurring schedules |
| Proposals & Estimates | Rich content blocks, e-signatures, version history, progress invoicing |
| Tax Management | Multi-jurisdiction rates with compound tax and inclusive pricing |
| Inventory Tracking | Movement audit trail, low-stock alerts, variant-level stock |
| Platform Fees | Per-venture fee configuration (percentage, flat, tiered) |
| Revenue Reporting | MRR, ARR, churn, LTV, per-product revenue, payment method breakdown |
| Approval Workflows | Multi-step chains for invoices, proposals, estimates, credit notes |
| Document Engagement | View tracking, section heatmaps, engagement scoring |
| Discount Engine | Percentage, fixed, free shipping, BXGY with usage limits |
| Credit Notes | Partial refund credits applied against invoices |
| Interactive Pricing | Package/builder pricing for proposals and estimates |

#### Out of Scope

| Capability | Handled By |
|---|---|
| Storefront UI rendering | `@mcv/fabric` (component library) |
| Carrier API integration | `@mcv/connectors/shipping` |
| Email delivery | `@mcv/connectors/email` |
| Accounting/bookkeeping | `@mcv/connectors/accounting` |
| CRM contact management | `@mcv/crm` |
| Analytics dashboards | `@mcv/analytics` |
| AI product descriptions | `@mcv/intelligence/gateway` |
| User authentication | `@mcv/identity` |
| Warehouse management | External WMS integrations |
| POS hardware management | Stripe Terminal SDK (client-side) |

---

## Module Summary

The Commerce domain is composed of **11 focused submodules** that can be used independently or in concert. Each submodule owns a specific aspect of the commercial lifecycle and exposes a clean service API through tRPC routers.

### Submodule Overview

| # | Submodule | Purpose | Key Entities | tRPC Procedures |
|---|---|---|---|---|
| 1 | **Catalog** | Product information, categorization, media, Stripe sync | Products, Variants, Categories, Collections, Price Rules, Discounts | 57 |
| 2 | **Cart** | Session-based shopping cart with discount application | Cart Sessions, Cart Items | (inline in catalog) |
| 3 | **Checkout** | Multi-step checkout orchestration via Stripe Checkout Sessions | Checkout Sessions, Payment Links | 4 |
| 4 | **Invoicing** | Advanced invoicing with branded templates and rich lifecycle | Invoice Templates, Invoices V2, Line Items, Credit Notes | 21 |
| 5 | **Orders** | Order lifecycle from confirmation through fulfillment | Orders, Order Items, Shipments | (event-driven) |
| 6 | **Payments** | Stripe Connect payment processing, refunds, disputes, payouts | Stripe Accounts, Transactions, Refunds, Disputes, Payouts | 32 |
| 7 | **POS** | In-person payment via Stripe Terminal | Terminal Readers, POS Transactions | (extends checkout) |
| 8 | **Shipping** | Rate calculation, label generation, tracking | Shipping Rates, Labels, Tracking Events | (via connectors) |
| 9 | **Subscriptions** | Recurring billing lifecycle via Stripe Billing | Subscriptions, Billing Periods | 8 |
| 10 | **Tax** | Multi-jurisdiction tax calculation | Tax Categories, Tax Rates | 6 |
| 11 | **Wholesale** | B2B pricing, volume discounts, customer groups | Price Rules, Customer Groups, Tiers | (via price rules) |

### 1. Catalog

The catalog submodule is the foundation of the commerce domain. Every product, variant, category, collection, price rule, and discount code lives here. Products support five types (`physical`, `digital`, `service`, `subscription`, `bundle`) and four statuses (`draft`, `active`, `archived`, `discontinued`). Categories use a materialized path tree for efficient ancestor/descendant queries. Products can be organized into manual or rule-based automated collections.

**Key Features:**
- Full product CRUD with 33-column product records
- Variant management with independent SKU, pricing, and inventory per variant
- Category tree hierarchy using materialized paths for O(1) ancestor/descendant lookups
- Automated collections with rule-based product inclusion (tag, category, type, price range)
- Manual collections with drag-and-drop reordering
- Discount engine supporting percentage, fixed, free shipping, and buy-X-get-Y codes
- Inventory tracking with movement audit trail (purchase, sale, adjustment, return, transfer)
- Price rules for volume, tiered, customer group, and time-limited pricing
- Stripe product/price sync for payment processing
- Low-stock alerts with configurable thresholds
- Bulk operations (status update, delete, inventory adjust) up to 100 items per batch

**Product Types:**

| Type | Description | Key Fields |
|---|---|---|
| `physical` | Tangible goods requiring shipping | weight, dimensions, trackInventory |
| `digital` | Downloadable files | digitalFileUrl, downloadLimit, expiryDays |
| `service` | Time-based or project services | basePrice (hourly/flat rate) |
| `subscription` | Recurring billing products | Links to Stripe subscription prices |
| `bundle` | Grouped products | attributes (child product references) |

### 2. Cart

The cart submodule manages ephemeral shopping sessions. Carts are keyed by session ID (not user ID) to support anonymous browsing, though they can be associated with authenticated users. Cart operations include add, remove, update quantity, apply discount codes, and calculate totals with tax.

**Key Features:**
- Session-based cart keyed by session ID for anonymous browsing support
- Cart-to-user association for authenticated sessions
- Real-time subtotal, discount, tax, and total calculation
- Discount code validation with complex eligibility rules
- Configurable cart TTL (default 72 hours)
- Maximum cart item limits (default 100 items)
- Variant-aware line items with unit pricing

### 3. Checkout

Checkout creates a Stripe Checkout Session that handles address collection, payment method selection, and charge creation. Supports three modes: `payment` (one-time), `subscription` (recurring), and `setup` (save payment method for later). Sessions expire after 24 hours by default.

**Key Features:**
- Stripe-hosted checkout with three modes (payment, subscription, setup)
- Automatic line item conversion from cart to Stripe format
- Configurable success and cancel URLs with session ID interpolation
- Reusable payment links for recurring use cases
- Session expiry management with manual force-expire
- Webhook-driven completion handling

### 4. Invoicing

The invoicing submodule provides enterprise-grade invoice management that goes far beyond Stripe's native invoicing. It supports branded templates, full lifecycle tracking, automated reminders, credit notes, recurring schedules, approval workflows, proposals with rich content blocks and e-signatures, estimates with version history and progress invoicing, and document engagement tracking.

**Key Features:**
- Branded invoice templates with custom HTML headers/footers, logos, and color schemes
- Full lifecycle: draft → sent → viewed → partial → paid → overdue → void → write_off
- Automated reminders (before, on, and after due date)
- Credit notes for partial refunds and adjustments
- Recurring invoice schedules (separate from Stripe subscriptions)
- Multi-step approval workflows with auto-approve rules
- Rich proposals with content blocks (headings, paragraphs, images, tables, testimonials, videos)
- E-signature capture with IP logging
- Estimates with version history and progress invoicing (milestone-based billing)
- Document engagement tracking (view duration, section heatmaps, device info)
- Interactive pricing (package/builder pricing for proposals)

### 5. Orders

Orders are created when a checkout session completes (via Stripe webhook) or when an invoice is paid. They track the fulfillment pipeline: confirmed → processing → shipped → delivered. Orders link to the payment transaction, customer, line items, and shipping information.

**Key Features:**
- Automatic order creation from completed checkout sessions
- Full lifecycle: draft → confirmed → processing → shipped → delivered
- Cancellation support with optional refund triggering
- Return/refund request workflow
- Shipping information attachment
- Line item tracking with variant references

### 6. Payments

The payments submodule manages the full payment lifecycle via Stripe Connect. Each venture has its own Stripe connected account (standard, express, or custom). Platform fees are collected automatically on each transaction via Stripe's application fee mechanism.

**Key Features:**
- Stripe Connect account management (standard, express, custom)
- Onboarding flow with hosted Stripe pages
- Payment intent creation and capture
- Full and partial refunds with reason tracking
- Dispute management with evidence submission
- Payout management (standard and instant)
- Platform fee collection via application fees
- Revenue reporting (MRR, ARR, churn, LTV, timeline, per-product)
- Payment method breakdown analytics
- Bidirectional Stripe webhook sync

### 7. POS (Point of Sale)

POS extends the checkout flow for physical retail. It manages Stripe Terminal reader registration, creates in-person payment intents, and handles receipt generation. POS transactions flow through the same payment pipeline as online orders, ensuring unified reporting.

**Key Features:**
- Stripe Terminal reader registration and management
- In-person payment intent creation (tap, swipe, insert)
- Receipt generation (print and email)
- Unified reporting with online transactions
- Cart/line item management for in-person sales

### 8. Shipping

The shipping submodule interfaces with carrier APIs (via @mcv/connectors) to calculate rates, generate shipping labels, and track deliveries. It supports multi-carrier comparison, dimensional weight calculation, and automatic tracking notifications.

**Key Features:**
- Multi-carrier rate comparison (USPS, UPS, FedEx, etc.)
- Dimensional weight calculation
- Shipping label generation
- Package tracking with automatic status updates
- Delivery notification via email/SMS
- Origin/destination address validation

### 9. Subscriptions

Subscriptions manage the entire recurring revenue lifecycle. They support trial periods, quantity-based billing, pause/resume, coupon application, proration, and automated invoice generation. All subscription operations are synced bidirectionally with Stripe.

**Key Features:**
- Full lifecycle: trialing → active → past_due → canceled/unpaid/paused
- Trial period support with configurable duration
- Plan upgrade/downgrade with automatic proration
- Pause and resume billing
- Coupon and discount application
- Usage-based billing via Stripe metered pricing
- Upcoming invoice preview
- Automated retry for failed payments
- Platform fee collection on subscription charges

### 10. Tax

The tax submodule supports two parallel tax systems: Catalog Tax (product-level rates with geographic precision) and Payment Tax (Stripe Tax rates for subscriptions and invoices).

**Key Features:**
- Tax categories (Physical Goods, Digital Services, etc.)
- Multi-jurisdiction rates with country/state/postal code precision
- Compound tax calculation (tax on tax)
- Tax-inclusive pricing support
- Default tax category for new products
- Stripe Tax rate sync for subscription/invoice tax
- Automatic rate resolution by customer location

### 11. Wholesale

Wholesale leverages the price rules system to offer tiered and volume-based pricing for B2B customers. Customer groups get automatic price adjustments, minimum order quantities, and net payment terms.

**Key Features:**
- Volume-based pricing with quantity tiers
- Customer group pricing (e.g., Gold Partner = 15% off)
- Tiered pricing with configurable break points
- Time-limited promotional pricing
- Effective price calculation considering all applicable rules
- Priority-based rule evaluation (higher priority rules apply first)

---

## Architecture Position

`@mcv/commerce` sits at **Tier 5** of the MCV platform architecture — the Domain Layer. It depends on lower tiers for infrastructure (Tier 1), shared utilities (Tier 2), core services (Tier 3), and platform capabilities (Tier 4), while being consumed by higher-level applications and external integrations.

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 7: APPLICATION LAYER                     │
│                                                                  │
│  Venture Apps    Admin Panel    Storefront    Mobile Apps        │
│                                                                  │
├──────────────────────────────┬───────────────────────────────────┤
│     TIER 6: ORCHESTRATION    │     TIER 6: ORCHESTRATION        │
│                              │                                   │
│  @mcv/analytics              │  @mcv/engagement                 │
│  @mcv/growth                 │  @mcv/workflows                  │
│                              │                                   │
├──────────────────────────────┴───────────────────────────────────┤
│                  ╔══════════════════════════════╗                 │
│   TIER 5:       ║     @mcv/commerce            ║    TIER 5:     │
│   DOMAIN        ║     ════════════             ║    DOMAIN      │
│   LAYER         ║  catalog │ cart │ checkout   ║    LAYER       │
│                 ║  invoicing │ orders          ║                 │
│  @mcv/crm      ║  payments │ pos │ shipping   ║  @mcv/content  │
│  @mcv/social    ║  subscriptions │ tax        ║  @mcv/learning │
│  @mcv/projects  ║  wholesale                  ║  @mcv/hr       │
│                 ╚══════════════════════════════╝                 │
├──────────────────────────────────────────────────────────────────┤
│                    TIER 4: PLATFORM CAPABILITIES                 │
│                                                                  │
│  @mcv/fabric (UI)    @mcv/connectors    @mcv/intelligence       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                    TIER 3: CORE SERVICES                         │
│                                                                  │
│  @mcv/identity       @mcv/notifications  @mcv/storage           │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                    TIER 2: SHARED UTILITIES                      │
│                                                                  │
│  @mcv/shared         @mcv/db             @mcv/config            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                    TIER 1: INFRASTRUCTURE                        │
│                                                                  │
│  @mcv/kernel (multi-tenancy, middleware, ventureId context)      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow Position

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ @mcv/    │────>│ @mcv/    │────>│ @mcv/    │────>│ @mcv/    │
│ identity │     │ kernel   │     │ commerce │     │analytics │
│          │     │          │     │          │     │          │
│ Auth     │     │ Venture  │     │ Orders   │     │ Revenue  │
│ Users    │     │ Context  │     │ Payments │     │ Metrics  │
│ Roles    │     │ Tenant   │     │ Invoices │     │ Funnels  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
                                  ┌──────────┐     ┌──────────┐
                                  │ @mcv/    │────>│ @mcv/    │
                                  │engagement│     │ growth   │
                                  │          │     │          │
                                  │ Emails   │     │ Campaigns│
                                  │ Notifs   │     │ Referrals│
                                  └──────────┘     └──────────┘
```

### Router Architecture

Commerce exposes its API through three tRPC routers that are merged into the platform's main router:

```
┌─────────────────────────────────────────────────────────────┐
│                    @mcv/commerce Router                       │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ catalogRouter    │  │ paymentsRouter  │  │ invoicing   │ │
│  │                  │  │                  │  │ Router      │ │
│  │ 57 procedures    │  │ 32 procedures   │  │ 55 procs    │ │
│  │                  │  │                  │  │             │ │
│  │ • Products (11)  │  │ • Accounts (6)  │  │ • Templates │ │
│  │ • Categories(10) │  │ • Products (5)  │  │ • InvoicesV2│ │
│  │ • Discounts (8)  │  │ • Prices (3)    │  │ • Proposals │ │
│  │ • Inventory (6)  │  │ • Customers (2) │  │ • Estimates │ │
│  │ • PriceRules(7)  │  │ • Subs (8)      │  │ • Recurring │ │
│  │ • Collections(9) │  │ • Invoices (7)  │  │ • Credits   │ │
│  │ • Tax (6)        │  │ • Checkout (4)  │  │ • Approvals │ │
│  │                  │  │ • Refunds (2)   │  │ • Engage    │ │
│  │                  │  │ • Disputes (2)  │  │ • Pricing   │ │
│  │                  │  │ • Payouts (2)   │  │ • Fees      │ │
│  │                  │  │ • Reporting (9) │  │             │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                              │
│  Total: 132 tRPC procedures + 15 webhook handlers            │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Interfaces & Types

### Core Entity Types

#### Product

The central entity of the catalog submodule. Products represent anything that can be sold — physical goods, digital downloads, services, subscriptions, or bundles.

```typescript
interface Product {
  id: string;                          // UUID primary key
  ventureId: string;                   // Tenant isolation
  categoryId: string | null;           // FK to product_categories
  
  // Identity
  name: string;                        // Display name (max 500)
  slug: string;                        // URL-safe identifier
  sku: string | null;                  // Stock keeping unit
  description: string | null;          // Full description (max 10000)
  shortDescription: string | null;     // Summary (max 500)
  type: 'physical' | 'digital' | 'service' | 'subscription' | 'bundle';
  status: 'draft' | 'active' | 'archived' | 'discontinued';
  
  // Pricing (all amounts in cents)
  basePrice: number;                   // Default price in cents
  compareAtPrice: number | null;       // Original/strike-through price
  costPrice: number | null;            // Cost of goods (for margin calc)
  currency: string;                    // ISO 4217 (default: 'usd')
  taxable: boolean;                    // Subject to tax calculation
  taxCategoryId: string | null;        // FK to tax_categories
  
  // Media
  images: ProductImage[];              // Array of {url, alt, sortOrder, isPrimary}
  
  // Attributes & Variants
  attributes: Record<string, unknown>; // Arbitrary key-value pairs
  variants: Record<string, string[]>;  // e.g. { color: ['red','blue'], size: ['S','M','L'] }
  tags: string[];                      // Searchable tags
  
  // SEO
  metaTitle: string | null;            // HTML <title> override
  metaDescription: string | null;      // Meta description tag
  
  // Inventory
  trackInventory: boolean;             // Enable stock tracking
  inventoryQuantity: number;           // Current stock level
  lowStockThreshold: number;           // Alert threshold (default: 5)
  allowBackorder: boolean;             // Allow purchase when out of stock
  
  // Physical Product
  weight: string | null;               // Decimal weight
  weightUnit: string;                  // 'kg' | 'lb' | 'oz' | 'g'
  dimensions: ProductDimensions | null;// { length, width, height, unit }
  
  // Digital Product
  digitalFileUrl: string | null;       // Download URL
  downloadLimit: number | null;        // Max downloads per purchase
  expiryDays: number | null;           // Days until download expires
  
  // Stripe Integration
  stripeProductId: string | null;      // Synced Stripe product ID
  stripePriceId: string | null;        // Synced Stripe price ID
  
  // Visibility
  isPublic: boolean;                   // Visible on storefront
  isFeatured: boolean;                 // Featured product flag
  
  // Audit
  createdBy: string | null;            // User ID who created
  createdAt: Date;
  updatedAt: Date;
}
```

#### StripeAccount

Represents a venture's Stripe Connect account for payment processing.

```typescript
interface StripeAccount {
  id: string;
  ventureId: string;
  stripeAccountId: string;              // Stripe acct_xxx
  accountType: 'standard' | 'express' | 'custom';
  status: 'pending' | 'active' | 'restricted' | 'disabled';
  businessName: string | null;
  email: string | null;
  country: string;                      // 2-letter ISO
  currency: string;                     // Default: 'usd'
  chargesEnabled: boolean;              // Can accept payments
  payoutsEnabled: boolean;              // Can receive payouts
  detailsSubmitted: boolean;            // Onboarding complete
  onboardingUrl: string | null;         // Active onboarding link
  applicationFeePercent: string;        // Platform fee (e.g. "2.50")
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### InvoiceV2

The advanced invoice entity with full lifecycle tracking.

```typescript
interface InvoiceV2 {
  id: string;
  ventureId: string;
  contactId: string | null;
  organizationId: string | null;
  templateId: string | null;
  recurringInvoiceId: string | null;
  number: string;                       // e.g. "INV-1042"
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void' | 'write_off';
  issueDate: Date;
  dueDate: Date | null;
  lineItems: InvoiceV2LineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  notes: string | null;
  terms: string | null;
  paymentLink: string | null;
  stripeInvoiceId: string | null;
  sentAt: Date | null;
  viewedAt: Date | null;
  paidAt: Date | null;
  reminders: InvoiceReminder[] | null;
  customFields: Record<string, string> | null;
  billingAddress: InvoiceAddress | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Subscription

Represents a recurring billing relationship via Stripe.

```typescript
interface Subscription {
  id: string;
  ventureId: string;
  customerId: string;
  stripeSubscriptionId: string | null;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'paused';
  priceId: string | null;
  quantity: number;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAt: Date | null;
  canceledAt: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  applicationFeePercent: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Proposal

Rich sales document with content blocks and e-signature support.

```typescript
interface Proposal {
  id: string;
  ventureId: string;
  contactId: string | null;
  organizationId: string | null;
  title: string;
  proposalNumber: string | null;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  content: ProposalContentBlock[];
  lineItems: InvoiceV2LineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  validUntil: Date | null;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  declineReason: string | null;
  signatureUrl: string | null;
  signatureIp: string | null;
  sentAt: Date | null;
  viewedAt: Date | null;
  coverImageUrl: string | null;
  customFields: Record<string, string> | null;
  convertedInvoiceId: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Supporting Types

```typescript
interface ProductVariant {
  id: string;
  productId: string;
  ventureId: string;
  name: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  attributes: Record<string, string>;
  inventoryQuantity: number;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  stripePriceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductCategory {
  id: string;
  ventureId: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  metadata: Record<string, unknown>;
  level: number;
  path: string;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductImage {
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
}

interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

interface DiscountCode {
  id: string;
  ventureId: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
  value: number;
  minimumAmount: number | null;
  maximumDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number | null;
  applicableTo: DiscountApplicableTo | null;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
}

interface PriceRule {
  id: string;
  ventureId: string;
  productId: string;
  name: string;
  type: 'volume' | 'tiered' | 'customer_group' | 'time_limited';
  config: PriceRuleConfig;
  priority: number;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
}

interface Payment {
  id: string;
  ventureId: string;
  customerId: string;
  invoiceId: string | null;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethod: 'card' | 'bank_transfer' | 'ach' | null;
  cardBrand: string | null;
  cardLast4: string | null;
  receiptUrl: string | null;
  applicationFeeAmount: number | null;
  refundedAmount: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

interface InvoiceV2LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  discountPercent?: number;
  discountAmount?: number;
  productId?: string;
  sortOrder: number;
}

interface InvoiceReminder {
  date: string;
  sent: boolean;
  sentAt?: string;
  type: 'before_due' | 'on_due' | 'after_due';
  dayOffset: number;
}

interface InvoiceAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface ProposalContentBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'table' | 'divider'
      | 'pricing' | 'terms' | 'signature' | 'video' | 'testimonial';
  content: string;
  metadata?: Record<string, unknown>;
  sortOrder: number;
}
```

### Enumeration Types

```typescript
// Product enums
type ProductType = 'physical' | 'digital' | 'service' | 'subscription' | 'bundle';
type ProductStatus = 'draft' | 'active' | 'archived' | 'discontinued';

// Pricing enums
type PriceRuleType = 'volume' | 'tiered' | 'customer_group' | 'time_limited';
type DiscountType = 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';

// Inventory enums
type InventoryMovementType = 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer';

// Collection enums
type CollectionType = 'manual' | 'automated';

// Stripe Connect enums
type StripeAccountType = 'standard' | 'express' | 'custom';
type StripeAccountStatus = 'pending' | 'active' | 'restricted' | 'disabled';

// Payment enums
type PaymentStatus = 'succeeded' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
type PaymentMethodType = 'card' | 'bank_transfer' | 'ach';
type CheckoutMode = 'payment' | 'subscription' | 'setup';

// Subscription enums
type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'paused';

// Invoice enums
type InvoiceV2Status = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void' | 'write_off';
type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
type EstimateStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'converted';

// Recurring enums
type RecurringInterval = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'yearly';
type RecurringStatus = 'active' | 'paused' | 'cancelled' | 'completed';

// Approval enums
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';
type ApprovalEntityType = 'invoice' | 'proposal' | 'estimate' | 'credit_note' | 'discount';

// Platform fee enums
type PlatformFeeType = 'percentage' | 'flat' | 'tiered';
```

### Pagination

All list endpoints use a common pagination response format:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;      // 1-indexed
  pageSize: number;  // Default: 20, max: 100
}
```

---

## Configuration

### Required Environment Variables

| Variable | Description | Example |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe platform secret key | `sk_live_xxxxxxxxxxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret | `whsec_xxxxxxxxxxxxx` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side) | `pk_live_xxxxxxxxxxxxx` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/mcv` |

### Optional Environment Variables

| Variable | Description | Default |
|---|---|---|
| `STRIPE_API_VERSION` | Stripe API version | `2024-12-18.acacia` |
| `STRIPE_CONNECT_DEFAULT_FEE` | Default platform fee % | `2.50` |
| `STRIPE_WEBHOOK_TOLERANCE_SECONDS` | Webhook signature tolerance | `300` |
| `COMMERCE_DEFAULT_CURRENCY` | Default currency for new ventures | `usd` |
| `COMMERCE_DEFAULT_TAX_RATE` | Default tax rate % | `0` |
| `COMMERCE_MAX_CART_ITEMS` | Maximum items in a cart | `100` |
| `COMMERCE_CART_TTL_HOURS` | Cart session expiry | `72` |
| `COMMERCE_CHECKOUT_EXPIRY_HOURS` | Checkout session expiry | `24` |
| `COMMERCE_LOW_STOCK_THRESHOLD` | Default low stock alert level | `5` |
| `COMMERCE_MAX_BULK_OPERATIONS` | Max items per bulk operation | `100` |
| `INVOICE_NUMBER_PREFIX` | Default invoice number prefix | `INV` |
| `INVOICE_DEFAULT_PAYMENT_TERMS` | Default payment terms (days) | `30` |
| `INVOICE_REMINDER_ENABLED` | Enable automated reminders | `true` |
| `PROPOSAL_DEFAULT_VALIDITY_DAYS` | Default proposal validity | `30` |
| `ESTIMATE_DEFAULT_VALIDITY_DAYS` | Default estimate validity | `30` |
| `RECURRING_INVOICE_CRON` | Cron schedule for recurring processing | `0 6 * * *` |
| `OVERDUE_DETECTION_CRON` | Cron schedule for overdue detection | `0 8 * * *` |

### Per-Venture Configuration

Each venture can customize its commerce experience through:

| Configuration | Scope | Description |
|---|---|---|
| Stripe Account Type | Per-venture | standard, express, or custom Connect account |
| Platform Fee | Per-venture | Percentage, flat, or tiered fee structure |
| Default Currency | Per-venture | ISO 4217 currency code |
| Tax Configuration | Per-venture | Tax categories, rates, inclusive/exclusive |
| Invoice Templates | Per-venture | Branded templates with colors, logos, HTML |
| Invoice Number Prefix | Per-venture | e.g., "INV", "BILL", custom prefix |
| Payment Terms | Per-venture | Default days until invoice due |
| Low Stock Threshold | Per-venture | Customizable per-product threshold |
| Cart TTL | Global | Configurable via environment variable |
| Checkout Expiry | Global | Configurable via environment variable |

---

## Dependencies

### Upstream Dependencies (Commerce Depends On)

| Package | Tier | Relationship | Required |
|---|---|---|---|
| `@mcv/kernel` | 1 | Multi-tenancy (ventureId context), auth middleware, procedure types | **Yes** |
| `@mcv/db` | 2 | Database connection, Drizzle ORM, schema definitions | **Yes** |
| `@mcv/shared` | 2 | Validation schemas, utility functions, common types | **Yes** |
| `@mcv/identity` | 3 | User authentication, role verification, session management | **Yes** |
| `@mcv/fabric` | 4 | UI components for commerce pages (client-side only) | **Yes (client)** |
| `@mcv/connectors/email` | 4 | Invoice/proposal email delivery | Optional |
| `@mcv/connectors/shipping` | 4 | Carrier rate calculation, label generation | Optional |
| `@mcv/crm` | 5 | Contact and organization lookups (contactId, organizationId) | Optional |

### Downstream Dependencies (Depends on Commerce)

| Package | Tier | Relationship |
|---|---|---|
| `@mcv/analytics` | 6 | Consumes commerce events for revenue analytics, conversion funnels |
| `@mcv/engagement` | 6 | Triggers engagement campaigns based on purchase activity |
| `@mcv/growth` | 6 | Uses commerce data for referral programs, loyalty points |
| Venture Apps | 7 | Direct consumers of commerce tRPC API |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `stripe` | `^17.x` | Stripe API client (Connect, Payments, Subscriptions, Invoicing) |
| `drizzle-orm` | `^0.38.x` | Database ORM (schema definitions, queries, migrations) |
| `@trpc/server` | `^10.x` | tRPC router definitions and procedure types |
| `zod` | `^3.x` | Input validation schemas for all procedures |

### Stripe API Integration Points

| Stripe API | Commerce Usage |
|---|---|
| `accounts.create` | Create connected account |
| `accountLinks.create` | Generate onboarding URL |
| `accounts.retrieve` | Check account status |
| `products.create/update` | Sync catalog products |
| `prices.create` | Create pricing for products |
| `customers.create` | Create Stripe customer |
| `subscriptions.create/update/cancel` | Subscription lifecycle |
| `invoices.create/send/void` | Stripe-native invoicing |
| `checkout.sessions.create` | Hosted checkout pages |
| `paymentLinks.create` | Reusable payment links |
| `refunds.create` | Process refunds |
| `disputes.update` | Submit dispute evidence |
| `payouts.create` | Initiate payouts |
| `balance.retrieve` | Check account balance |
| `taxRates.create` | Create tax rate objects |

### Webhook Events Handled

| Stripe Event | Commerce Handler |
|---|---|
| `account.updated` | Update connected account status |
| `checkout.session.completed` | Create order, send confirmation |
| `payment_intent.succeeded` | Record payment transaction |
| `payment_intent.payment_failed` | Record failure, notify customer |
| `invoice.paid` | Update invoice status |
| `invoice.payment_failed` | Mark as past_due |
| `customer.subscription.created` | Record new subscription |
| `customer.subscription.updated` | Update subscription state |
| `customer.subscription.deleted` | Mark as canceled |
| `charge.dispute.created` | Record dispute |
| `charge.dispute.closed` | Update dispute outcome |
| `charge.refunded` | Record refund |
| `payout.paid` | Update payout status |
| `payout.failed` | Record payout failure |

---

## Multi-Tenant Design

### Tenant Isolation Model

Commerce implements strict venture-level tenant isolation. Every entity in the system belongs to exactly one venture, and all queries are scoped by `ventureId` at multiple layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     ISOLATION LAYERS                         │
│                                                              │
│  Layer 1: tRPC Middleware                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ventureProcedure / adminProcedure / superAdminProc   │    │
│  │ Extracts ventureId from session context              │    │
│  │ Validates user belongs to venture                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  Layer 2: Service Layer                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Every service method accepts ventureId as param      │    │
│  │ All queries include WHERE venture_id = $ventureId    │    │
│  │ No cross-venture data leakage possible               │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  Layer 3: Database (RLS)                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PostgreSQL Row-Level Security policies               │    │
│  │ venture_id = current_setting('app.venture_id')       │    │
│  │ Defense-in-depth: even raw SQL is scoped             │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│  Layer 4: Stripe Connect                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Each venture has its own Stripe Connected Account    │    │
│  │ Payments are processed on the connected account      │    │
│  │ Financial data is inherently isolated by Stripe      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Cross-Venture Access

Only super admin procedures can access data across ventures:

| Procedure | Scope | Purpose |
|---|---|---|
| `listConnectedAccounts` | All ventures | Platform fee management |
| `getPlatformRevenue` | All ventures | Platform revenue reporting |
| `getCrossVentureCatalogStats` | All ventures | Ecosystem-wide analytics |
| `listPlatformFeeConfigs` | All ventures | Fee configuration overview |
| `getPlatformRevenueReport` | All ventures | Cross-venture fee reporting |

### Venture Provisioning

When a new venture is created, the commerce domain automatically:

1. Creates a Stripe Connected Account (express by default)
2. Generates an onboarding link for the venture owner
3. Creates a default invoice template with venture branding
4. Sets up default tax categories
5. Configures platform fee based on venture tier

### Data Model — Venture Scope

Every table in the commerce schema includes a `venture_id` column:

```sql
-- Example: products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id),
  -- ... other columns
  CONSTRAINT products_venture_idx UNIQUE (venture_id, slug)
);

-- RLS policy
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_venture_policy ON products
  USING (venture_id = current_setting('app.venture_id')::uuid);
```

---

## Security

### Authorization Levels

| Level | Description | Example Procedures |
|---|---|---|
| `ventureProcedure` | Any authenticated venture member | Read operations, listing, search |
| `adminProcedure` | Venture admin or higher | Create, update, delete, send, record payments |
| `superAdminProcedure` | Platform super admin only | Cross-venture analytics, platform fees, account listing |
| `protectedProcedure` | Any authenticated user | Document view tracking, notification reads |

### PCI Compliance

Commerce achieves PCI compliance by **never** storing, processing, or transmitting raw card data:

- **Card collection**: Stripe.js / Stripe Elements (client-side tokenization)
- **Payment processing**: Stripe API (server-side, using tokens only)
- **Stored card data**: Only `cardBrand` and `cardLast4` (PCI-compliant fields)
- **Webhook verification**: Stripe signature validation with configurable tolerance

### Sensitive Data Matrix

| Data | Storage | Encryption | Access |
|---|---|---|---|
| Stripe Account IDs | PostgreSQL | At-rest (DB-level) | Admin only |
| Customer Emails | PostgreSQL | At-rest (DB-level) | Venture members |
| Payment Amounts | PostgreSQL (integer) | At-rest (DB-level) | Venture members |
| Card Last 4 | PostgreSQL | None (non-sensitive) | Venture members |
| E-Signatures | Object storage URL | TLS in transit | Venture members |
| Signature IPs | PostgreSQL | At-rest (DB-level) | Admin only |
| Webhook Secrets | Environment variable | N/A | Server runtime only |
| Stripe API Keys | Environment variable | N/A | Server runtime only |

### Input Validation

All inputs are validated via Zod schemas at the router level before reaching service code:

```typescript
// Example: product creation schema
const createProductSchema = z.object({
  name: z.string().min(1).max(500),
  basePrice: z.number().int().min(0),
  sku: z.string().max(100).optional(),
  description: z.string().max(10000).optional(),
  type: z.enum(['physical', 'digital', 'service', 'subscription', 'bundle']),
  status: z.enum(['draft', 'active', 'archived', 'discontinued']),
  images: z.array(productImageSchema).optional(),
  tags: z.array(z.string()).optional(),
  // ... all fields validated
});
```

### Rate Limiting

| Endpoint Group | Rate Limit | Window |
|---|---|---|
| Product reads | 100 req/s per venture | Sliding window |
| Product writes | 20 req/s per venture | Sliding window |
| Checkout creation | 10 req/s per venture | Sliding window |
| Payment operations | 30 req/s per venture | Sliding window |
| Invoice operations | 50 req/s per venture | Sliding window |
| Webhook processing | 100 req/s global | Sliding window |
| Reporting queries | 5 req/s per venture | Sliding window |

### CSRF & XSS Protection

- All tRPC mutations require authenticated sessions with CSRF tokens
- Invoice template HTML is sanitized before storage and rendering
- Proposal content blocks are sanitized to prevent XSS
- All user-generated content is escaped in email templates

---

## Performance

### Query Performance Targets

| Operation | Target Latency | Strategy |
|---|---|---|
| Product listing (paginated) | < 50ms | Composite index on (venture_id, status) + offset pagination |
| Product search (text) | < 100ms | GIN index on name/description + pg_trgm |
| Category tree load | < 30ms | Single query with materialized path + `LIKE 'path/%'` |
| Discount validation | < 20ms | Index on (venture_id, code) + in-memory usage check |
| Tax rate resolution | < 10ms | Index on (country, state, postal_code) + cache |
| Invoice listing | < 50ms | Composite index on (venture_id, status) + cursor pagination |
| Stripe webhook processing | < 200ms | Unique index on Stripe IDs for fast lookup |
| Revenue reporting | < 500ms | Materialized views for aggregates, updated on cron |

### Caching Strategy

| Cache Target | TTL | Invalidation Strategy |
|---|---|---|
| Product Catalog | 5 minutes | Invalidate on product CRUD |
| Category Tree | 1 hour | Invalidate on category CRUD |
| Cart Sessions | 30 seconds | Invalidate on cart mutation |
| Tax Rates | 24 hours | Invalidate on rate CRUD |
| Stripe Account | 1 hour | Invalidate on webhook update |
| Revenue Metrics | 15 minutes | Invalidate on payment event |

### Bulk Operations

All bulk endpoints are capped at 100 items per batch to prevent database lock contention:

- `bulkUpdateProductStatus` — max 100 products per call
- `bulkDeleteProducts` — max 100 products per call
- `bulkAdjustInventory` — max 100 movements per call
- `addProductsToCollection` / `removeProductsFromCollection` — max 100 per call

All bulk operations use `Promise.all` with connection pooling and transactions for atomicity.

### Database Indexing Strategy

The commerce schema uses **45+ indexes** optimized for the most common query patterns:

- **Venture-scoped lookups**: Composite indexes on `(venture_id, ...)` for all primary queries
- **Stripe ID lookups**: Unique indexes on all Stripe reference IDs for webhook processing
- **Date-range queries**: Indexes on `created_at`, `due_date`, `next_date` for time-based filtering
- **Status filtering**: Composite indexes on `(venture_id, status)` for filtered listing
- **Full-text search**: GIN indexes with pg_trgm for product name/description search
- **Tree traversal**: Materialized path indexes for category hierarchy queries

---

## Deployment

### Database Migrations

Commerce requires 36 tables across 3 schemas (catalog, payments, invoicing). Migrations are managed by Drizzle ORM:

```bash
# Generate migration from schema changes
npx drizzle-kit generate:pg

# Apply migrations
npx drizzle-kit push:pg

# Verify schema state
npx drizzle-kit check:pg
```

### Stripe Configuration

1. **Create Stripe Platform Account** — The MCV platform operates as the "platform" in Stripe Connect terminology
2. **Configure Webhook Endpoint** — Point to `/api/webhooks/stripe` with all required events enabled
3. **Set Default Platform Fee** — Configure `STRIPE_CONNECT_DEFAULT_FEE` environment variable
4. **Enable Stripe Connect** — Register for Stripe Connect in Stripe Dashboard

### Cron Jobs

The following background jobs must be configured:

| Job | Schedule | Handler |
|---|---|---|
| Process reminders | Every 30 minutes | `processReminders()` |
| Detect overdue invoices | Daily 8 AM | `detectOverdueInvoices()` |
| Process recurring invoices | Daily 6 AM | `processDueRecurringInvoices()` |
| Detect expired estimates | Daily 9 AM | `detectExpiredEstimates()` |
| Sync missed webhooks | Every 4 hours | `syncStripeWebhookMissed()` |

### Health Checks

Commerce exposes health check endpoints for monitoring:

| Check | Endpoint | Validates |
|---|---|---|
| Database connectivity | `/health/db` | PostgreSQL connection pool |
| Stripe connectivity | `/health/stripe` | Stripe API key validity |
| Cache connectivity | `/health/cache` | Redis connection (if enabled) |
| Webhook sync | `/health/webhooks` | Last successful webhook timestamp |

### Monitoring & Observability

| Metric | Type | Description |
|---|---|---|
| `commerce.orders.created` | Counter | Total orders created |
| `commerce.payments.processed` | Counter | Total payments processed |
| `commerce.payments.failed` | Counter | Failed payment attempts |
| `commerce.checkout.abandoned` | Counter | Abandoned checkout sessions |
| `commerce.invoices.overdue` | Gauge | Current overdue invoice count |
| `commerce.subscriptions.active` | Gauge | Current active subscription count |
| `commerce.subscriptions.churn` | Gauge | Monthly churn rate |
| `commerce.revenue.mrr` | Gauge | Monthly recurring revenue |
| `commerce.api.latency` | Histogram | API response latency by endpoint |
| `commerce.webhook.latency` | Histogram | Webhook processing latency |
| `commerce.webhook.failures` | Counter | Failed webhook processing |

### Scaling Considerations

| Component | Scaling Strategy |
|---|---|
| tRPC API | Horizontal scaling behind load balancer |
| PostgreSQL | Read replicas for reporting queries |
| Redis Cache | Cluster mode for high-availability |
| Stripe Webhooks | Idempotent processing with deduplication |
| Cron Jobs | Leader election to prevent duplicate execution |
| File Storage | CDN for invoice PDFs, proposal covers, signatures |

---

*@mcv/commerce — Commerce Platform Domain*
