# @mcv/finance/billing

> **Tier 5 Domain Module — Publishable**
> Subscription billing, usage-based metering, invoice generation, and payment collection.

---

## Purpose

The `@mcv/finance/billing` module is the revenue engine of the MCV platform. It manages the complete billing lifecycle — from plan creation and subscription management through usage metering, invoice generation, payment collection, and revenue recognition. Built on Stripe Connect with Supabase PostgreSQL for persistent state, the module exposes its API surface via tRPC procedures.

**Core responsibilities:**

- **Subscription lifecycle management** — Create, update, pause, resume, cancel, and expire subscriptions with full audit trails
- **Usage-based billing** — Track metered consumption, apply tiered pricing models, and calculate overage charges
- **Invoice generation** — Automatically produce invoices from subscriptions and usage records with line-item detail, tax calculation, and PDF rendering
- **Payment collection** — Integrate with Stripe for automatic charge attempts, retry logic, and dunning workflows
- **Billing cycle orchestration** — Support monthly, quarterly, annual, and custom billing periods with precise boundary calculations
- **Proration engine** — Calculate pro-rated charges for mid-cycle plan changes (upgrades, downgrades, cancellations)
- **Credits & adjustments** — Issue account credits, apply promotional discounts, and make manual billing adjustments
- **Revenue recognition** — Track deferred revenue and enforce ASC 606 compliance for recognized vs. unrecognized revenue
- **Billing portal** — Serve a customer-facing portal for invoice history, payment method management, and self-service plan changes
- **Multi-currency billing** — Bill customers in their local currency with FX conversion and settlement currency management

---

## Exports

```typescript
// === Core Services ===
export { BillingService }            from './services/billing.service';
export { SubscriptionService }       from './services/subscription.service';
export { InvoiceService }            from './services/invoice.service';
export { UsageService }              from './services/usage.service';
export { PaymentService }            from './services/payment.service';
export { ProrationService }          from './services/proration.service';
export { CreditService }             from './services/credit.service';
export { RevenueRecognitionService } from './services/revenue-recognition.service';
export { DunningService }            from './services/dunning.service';
export { BillingPortalService }      from './services/billing-portal.service';
export { CurrencyService }           from './services/currency.service';

// === tRPC Router ===
export { billingRouter }             from './router';

// === Types & Interfaces ===
export type {
  Subscription,
  SubscriptionStatus,
  SubscriptionCreateInput,
  SubscriptionUpdateInput,
  Invoice,
  InvoiceStatus,
  InvoiceLineItem,
  UsageRecord,
  UsageEvent,
  UsageSummary,
  BillingPlan,
  PlanTier,
  PricingModel,
  PaymentMethod,
  PaymentAttempt,
  PaymentResult,
  BillingCycle,
  BillingPeriod,
  ProrationResult,
  CreditEntry,
  CreditAdjustment,
  RevenueSchedule,
  RevenueEntry,
  DunningState,
  DunningStep,
  BillingPortalSession,
  CurrencyConfig,
  ExchangeRate,
} from './types';

// === Schemas (Zod) ===
export {
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
  invoiceCreateSchema,
  usageEventSchema,
  planCreateSchema,
  paymentMethodSchema,
  creditAdjustmentSchema,
  billingPortalSessionSchema,
} from './schemas';

// === Constants ===
export {
  BILLING_ERRORS,
  BILLING_LIMITS,
  DEFAULT_BILLING_CONFIG,
  SUPPORTED_CURRENCIES,
  TAX_RATE_CODES,
} from './constants';

// === Hooks (React) ===
export { useSubscription }       from './hooks/use-subscription';
export { useInvoices }           from './hooks/use-invoices';
export { useUsage }              from './hooks/use-usage';
export { useBillingPortal }      from './hooks/use-billing-portal';
export { usePaymentMethods }     from './hooks/use-payment-methods';
export { usePlanSelector }       from './hooks/use-plan-selector';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           @mcv/finance/billing                              │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         tRPC Router Layer                             │  │
│  │  billing.subscription.*  │  billing.invoice.*  │  billing.usage.*     │  │
│  │  billing.payment.*       │  billing.plan.*     │  billing.portal.*    │  │
│  │  billing.credit.*        │  billing.revenue.*  │  billing.currency.*  │  │
│  └──────────────┬────────────────────┬─────────────────────┬────────────┘  │
│                 │                    │                     │                │
│  ┌──────────────▼──────────────────────────────────────────▼────────────┐  │
│  │                        BillingService (Facade)                       │  │
│  │  Orchestrates all sub-services, manages cross-cutting concerns       │  │
│  └──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──┘  │
│     │      │      │      │      │      │      │      │      │      │      │
│  ┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐│
│  │ Sub ││Inv  ││Usage││Pay  ││Pror ││Cred ││Rev  ││Dunn ││Port ││Curr ││
│  │ scr ││oice ││Svc  ││ment ││atio ││it   ││enue ││ing  ││al   ││ency ││
│  │ ipt ││Svc  ││     ││Svc  ││n    ││Svc  ││Rec  ││Svc  ││Svc  ││Svc  ││
│  │ ion ││     ││     ││     ││Svc  ││     ││Svc  ││     ││     ││     ││
│  │ Svc ││     ││     ││     ││     ││     ││     ││     ││     ││     ││
│  └──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘│
│     │      │      │      │      │      │      │      │      │      │    │
│  ┌──▼──────▼──────▼──────▼──────▼──────▼──────▼──────▼──────▼──────▼──┐ │
│  │                     Data Access Layer (DAL)                         │ │
│  │  Repository pattern with Supabase PostgreSQL                       │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │billing_  │ │invoices  │ │usage_    │ │payment_  │ │revenue_  │ │ │
│  │  │plans     │ │          │ │records   │ │attempts  │ │schedule  │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │subscrip- │ │invoice_  │ │usage_    │ │credit_   │ │dunning_  │ │ │
│  │  │tions     │ │line_items│ │meters    │ │ledger    │ │states    │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
│  │  ┌──────────┐ ┌──────────┐                                        │ │
│  │  │payment_  │ │exchange_ │                                        │ │
│  │  │methods   │ │rates     │                                        │ │
│  │  └──────────┘ └──────────┘                                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    External Integrations                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │  │
│  │  │ Stripe       │  │ Supabase     │  │ Event Bus                │ │  │
│  │  │ Connect API  │  │ PostgreSQL   │  │ (billing.* events)       │ │  │
│  │  │ - Customers  │  │ - ACID txns  │  │ - subscription.created   │ │  │
│  │  │ - Subscript. │  │ - RLS        │  │ - invoice.generated      │ │  │
│  │  │ - Invoices   │  │ - Triggers   │  │ - payment.succeeded      │ │  │
│  │  │ - PaymentInt │  │ - Views      │  │ - payment.failed         │ │  │
│  │  │ - Products   │  │              │  │ - subscription.cancelled │ │  │
│  │  │ - Prices     │  │              │  │ - usage.threshold        │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Subscription → Invoice → Payment

```
Customer signs up                    Billing cycle ends
       │                                    │
       ▼                                    ▼
┌──────────────┐                  ┌──────────────────┐
│ Create Plan  │                  │ Cycle Boundary    │
│ Selection    │                  │ Detector (cron)   │
└──────┬───────┘                  └────────┬─────────┘
       │                                   │
       ▼                                   ▼
┌──────────────┐                  ┌──────────────────┐
│ Subscription │───────────────▶  │ Invoice Generator │
│ Service      │  subscription    │ - Line items      │
│ - Validate   │  active &        │ - Usage rollup    │
│ - Create     │  period ended    │ - Tax calc        │
│ - Sync Stripe│                  │ - Proration       │
└──────┬───────┘                  └────────┬─────────┘
       │                                   │
       ▼                                   ▼
┌──────────────┐                  ┌──────────────────┐
│ Trial Period │                  │ Invoice Finalized │
│ (optional)   │                  │ Status: OPEN      │
│ - N days free│                  └────────┬─────────┘
│ - Auto-conv  │                           │
└──────────────┘                           ▼
                                  ┌──────────────────┐
                                  │ Payment Service   │
                                  │ - Charge via      │
                                  │   Stripe PI       │
                                  │ - Record attempt  │
                                  └────────┬─────────┘
                                           │
                                    ┌──────┴──────┐
                                    │             │
                                    ▼             ▼
                              ┌──────────┐ ┌──────────────┐
                              │ Payment  │ │ Payment      │
                              │ Succeeded│ │ Failed       │
                              │ → PAID   │ │ → Dunning    │
                              └──────────┘ │   Workflow   │
                                           └──────┬───────┘
                                                  │
                                           ┌──────┴──────┐
                                           │  Retry      │
                                           │  Schedule   │
                                           │  Day 1,3,7  │
                                           │  then cancel│
                                           └─────────────┘
```

---

## Core Interfaces

### BillingService (Facade)

The primary entry point for all billing operations. Orchestrates sub-services and ensures transactional consistency.

```typescript
import { TRPCError } from '@trpc/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export interface BillingServiceConfig {
  /** Supabase client with service-role credentials */
  supabase: SupabaseClient;
  /** Stripe client initialized with secret key */
  stripe: Stripe;
  /** Stripe webhook signing secret */
  webhookSecret: string;
  /** Default currency for new subscriptions */
  defaultCurrency: SupportedCurrency;
  /** Enable automatic tax calculation via Stripe Tax */
  autoTax: boolean;
  /** Dunning configuration */
  dunning: DunningConfig;
  /** Revenue recognition settings */
  revenueRecognition: RevenueRecognitionConfig;
}

export interface BillingService {
  // --- Subscription Operations ---
  createSubscription(input: SubscriptionCreateInput): Promise<Subscription>;
  getSubscription(subscriptionId: string): Promise<Subscription>;
  updateSubscription(subscriptionId: string, input: SubscriptionUpdateInput): Promise<Subscription>;
  cancelSubscription(subscriptionId: string, options?: CancelOptions): Promise<Subscription>;
  pauseSubscription(subscriptionId: string, resumeAt?: Date): Promise<Subscription>;
  resumeSubscription(subscriptionId: string): Promise<Subscription>;
  changeSubscriptionPlan(subscriptionId: string, newPlanId: string): Promise<ProrationResult>;
  listSubscriptions(filters: SubscriptionFilters): Promise<PaginatedResult<Subscription>>;

  // --- Plan Operations ---
  createPlan(input: PlanCreateInput): Promise<BillingPlan>;
  updatePlan(planId: string, input: PlanUpdateInput): Promise<BillingPlan>;
  archivePlan(planId: string): Promise<void>;
  listPlans(filters?: PlanFilters): Promise<BillingPlan[]>;
  getPlan(planId: string): Promise<BillingPlan>;

  // --- Invoice Operations ---
  generateInvoice(subscriptionId: string, periodEnd?: Date): Promise<Invoice>;
  getInvoice(invoiceId: string): Promise<Invoice>;
  listInvoices(filters: InvoiceFilters): Promise<PaginatedResult<Invoice>>;
  voidInvoice(invoiceId: string, reason: string): Promise<Invoice>;
  finalizeInvoice(invoiceId: string): Promise<Invoice>;
  sendInvoice(invoiceId: string): Promise<void>;
  downloadInvoicePdf(invoiceId: string): Promise<Buffer>;

  // --- Usage Operations ---
  recordUsage(event: UsageEvent): Promise<UsageRecord>;
  recordUsageBatch(events: UsageEvent[]): Promise<UsageRecord[]>;
  getUsageSummary(subscriptionId: string, meterId: string, period: BillingPeriod): Promise<UsageSummary>;
  listUsageRecords(filters: UsageFilters): Promise<PaginatedResult<UsageRecord>>;

  // --- Payment Operations ---
  collectPayment(invoiceId: string): Promise<PaymentResult>;
  retryPayment(invoiceId: string): Promise<PaymentResult>;
  addPaymentMethod(customerId: string, input: PaymentMethodInput): Promise<PaymentMethod>;
  removePaymentMethod(paymentMethodId: string): Promise<void>;
  setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;
  listPaymentMethods(customerId: string): Promise<PaymentMethod[]>;

  // --- Credit Operations ---
  issueCredit(input: CreditAdjustment): Promise<CreditEntry>;
  getBalance(customerId: string): Promise<CreditBalance>;
  listCredits(customerId: string, filters?: CreditFilters): Promise<PaginatedResult<CreditEntry>>;
  applyCreditsToInvoice(invoiceId: string): Promise<AppliedCredits>;

  // --- Revenue Recognition ---
  getRevenueSchedule(invoiceId: string): Promise<RevenueSchedule>;
  recognizeRevenue(period: BillingPeriod): Promise<RevenueRecognitionResult>;
  getDeferredRevenue(asOfDate: Date): Promise<DeferredRevenueReport>;

  // --- Portal ---
  createPortalSession(customerId: string, returnUrl: string): Promise<BillingPortalSession>;

  // --- Webhooks ---
  handleStripeWebhook(payload: Buffer, signature: string): Promise<void>;

  // --- Currency ---
  getExchangeRate(from: string, to: string): Promise<ExchangeRate>;
  convertAmount(amount: number, from: string, to: string): Promise<ConvertedAmount>;
}
```

### Subscription

```typescript
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'paused'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

export interface Subscription {
  /** Internal UUID */
  id: string;
  /** Stripe subscription ID (sub_xxx) */
  stripeSubscriptionId: string;
  /** Customer/organization ID */
  customerId: string;
  /** Stripe customer ID (cus_xxx) */
  stripeCustomerId: string;
  /** Active billing plan */
  planId: string;
  /** Current subscription status */
  status: SubscriptionStatus;
  /** Billing currency (ISO 4217) */
  currency: string;
  /** Current billing period start */
  currentPeriodStart: Date;
  /** Current billing period end */
  currentPeriodEnd: Date;
  /** Billing interval */
  billingInterval: BillingInterval;
  /** Trial end date (null if no trial) */
  trialEnd: Date | null;
  /** Whether subscription cancels at period end */
  cancelAtPeriodEnd: boolean;
  /** Date when cancellation was requested */
  canceledAt: Date | null;
  /** Date when subscription was paused */
  pausedAt: Date | null;
  /** Scheduled resume date for paused subscriptions */
  resumeAt: Date | null;
  /** Quantity (for per-seat billing) */
  quantity: number;
  /** Applied coupon/discount */
  discountId: string | null;
  /** Metadata bag for application-specific data */
  metadata: Record<string, string>;
  /** ISO timestamp of creation */
  createdAt: Date;
  /** ISO timestamp of last update */
  updatedAt: Date;
}

export type BillingInterval = 'month' | 'quarter' | 'year' | 'custom';

export interface SubscriptionCreateInput {
  customerId: string;
  planId: string;
  quantity?: number;
  trialDays?: number;
  couponId?: string;
  paymentMethodId?: string;
  billingInterval?: BillingInterval;
  currency?: string;
  metadata?: Record<string, string>;
  /** Start date; defaults to now */
  startDate?: Date;
  /** Collection method: charge_automatically or send_invoice */
  collectionMethod?: 'charge_automatically' | 'send_invoice';
}

export interface SubscriptionUpdateInput {
  planId?: string;
  quantity?: number;
  couponId?: string | null;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  cancelAtPeriodEnd?: boolean;
  billingInterval?: BillingInterval;
  /** Proration behavior for plan/quantity changes */
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

export interface CancelOptions {
  /** Cancel immediately or at end of billing period */
  immediately?: boolean;
  /** Reason for cancellation (stored for analytics) */
  reason?: CancellationReason;
  /** Free-text feedback */
  feedback?: string;
  /** Whether to issue a prorated refund */
  prorate?: boolean;
}

export type CancellationReason =
  | 'too_expensive'
  | 'missing_features'
  | 'switched_service'
  | 'unused'
  | 'customer_service'
  | 'too_complex'
  | 'other';
```

### Invoice

```typescript
export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'void'
  | 'uncollectible';

export interface Invoice {
  /** Internal UUID */
  id: string;
  /** Stripe invoice ID (in_xxx) */
  stripeInvoiceId: string;
  /** Invoice number (human-readable, sequential) */
  invoiceNumber: string;
  /** Associated subscription ID */
  subscriptionId: string | null;
  /** Customer/organization ID */
  customerId: string;
  /** Stripe customer ID */
  stripeCustomerId: string;
  /** Current invoice status */
  status: InvoiceStatus;
  /** Billing currency (ISO 4217) */
  currency: string;
  /** Subtotal before tax and discounts (in smallest currency unit) */
  subtotal: number;
  /** Total tax amount */
  tax: number;
  /** Discount amount applied */
  discountAmount: number;
  /** Credits applied from customer balance */
  creditsApplied: number;
  /** Total amount due (subtotal + tax - discount - credits) */
  total: number;
  /** Amount remaining to be paid */
  amountDue: number;
  /** Amount already paid */
  amountPaid: number;
  /** Line items */
  lineItems: InvoiceLineItem[];
  /** Tax breakdown by jurisdiction */
  taxBreakdown: TaxBreakdownEntry[];
  /** Billing period start */
  periodStart: Date;
  /** Billing period end */
  periodEnd: Date;
  /** Due date for payment */
  dueDate: Date;
  /** Date invoice was finalized */
  finalizedAt: Date | null;
  /** Date payment was received */
  paidAt: Date | null;
  /** Date invoice was voided */
  voidedAt: Date | null;
  /** URL to hosted invoice page */
  hostedInvoiceUrl: string | null;
  /** URL to invoice PDF */
  invoicePdfUrl: string | null;
  /** Collection method */
  collectionMethod: 'charge_automatically' | 'send_invoice';
  /** Payment intent ID (for automatic collection) */
  paymentIntentId: string | null;
  /** Memo / notes */
  memo: string | null;
  /** Footer text */
  footer: string | null;
  /** Metadata */
  metadata: Record<string, string>;
  /** ISO timestamp of creation */
  createdAt: Date;
  /** ISO timestamp of last update */
  updatedAt: Date;
}

export interface InvoiceLineItem {
  /** Line item ID */
  id: string;
  /** Invoice ID */
  invoiceId: string;
  /** Description */
  description: string;
  /** Quantity */
  quantity: number;
  /** Unit price (in smallest currency unit) */
  unitPrice: number;
  /** Total for this line (quantity × unitPrice) */
  amount: number;
  /** Associated plan ID (for subscription items) */
  planId: string | null;
  /** Associated usage meter ID (for usage items) */
  meterId: string | null;
  /** Period this line item covers */
  periodStart: Date;
  /** Period end for this line item */
  periodEnd: Date;
  /** Whether this is a proration */
  proration: boolean;
  /** Type of line item */
  type: 'subscription' | 'usage' | 'one_time' | 'proration' | 'credit' | 'tax';
  /** Metadata */
  metadata: Record<string, string>;
}

export interface TaxBreakdownEntry {
  /** Tax jurisdiction (e.g., "CA", "US-NY") */
  jurisdiction: string;
  /** Tax type (e.g., "sales_tax", "vat", "gst") */
  taxType: string;
  /** Tax rate as percentage (e.g., 8.875) */
  rate: number;
  /** Taxable amount */
  taxableAmount: number;
  /** Tax amount */
  taxAmount: number;
}
```

### UsageRecord

```typescript
export interface UsageRecord {
  /** Internal UUID */
  id: string;
  /** Subscription this usage belongs to */
  subscriptionId: string;
  /** Meter identifier (e.g., "api_calls", "storage_gb", "compute_hours") */
  meterId: string;
  /** Quantity consumed */
  quantity: number;
  /** Timestamp of usage event */
  timestamp: Date;
  /** Idempotency key to prevent duplicate recording */
  idempotencyKey: string;
  /** Action: increment (add) or set (absolute) */
  action: 'increment' | 'set';
  /** Metadata about the usage (e.g., endpoint, resource ID) */
  metadata: Record<string, string>;
  /** ISO timestamp of record creation */
  createdAt: Date;
}

export interface UsageEvent {
  /** Subscription ID */
  subscriptionId: string;
  /** Meter identifier */
  meterId: string;
  /** Quantity to record */
  quantity: number;
  /** Event timestamp (defaults to now) */
  timestamp?: Date;
  /** Idempotency key */
  idempotencyKey: string;
  /** Action type */
  action?: 'increment' | 'set';
  /** Metadata */
  metadata?: Record<string, string>;
}

export interface UsageSummary {
  /** Subscription ID */
  subscriptionId: string;
  /** Meter ID */
  meterId: string;
  /** Total usage in the period */
  totalQuantity: number;
  /** Number of individual events */
  eventCount: number;
  /** Period start */
  periodStart: Date;
  /** Period end */
  periodEnd: Date;
  /** Breakdown by day */
  dailyBreakdown: DailyUsage[];
  /** Calculated cost based on pricing tiers */
  estimatedCost: number;
  /** Currency for the estimated cost */
  currency: string;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  quantity: number;
  eventCount: number;
}

export interface UsageMeter {
  /** Meter ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Unit of measurement (e.g., "requests", "GB", "hours") */
  unit: string;
  /** Aggregation method */
  aggregation: 'sum' | 'max' | 'last_during_period';
  /** Event name filter (for filtering from event stream) */
  eventName: string;
  /** Whether this meter is active */
  active: boolean;
  /** Included quantity before charges begin (per billing period) */
  includedQuantity: number;
  /** Pricing tiers */
  tiers: UsageTier[];
  /** Created timestamp */
  createdAt: Date;
}

export interface UsageTier {
  /** Lower bound (inclusive) */
  from: number;
  /** Upper bound (inclusive, null = unlimited) */
  to: number | null;
  /** Price per unit in this tier (smallest currency unit) */
  unitPrice: number;
  /** Flat fee for entering this tier (optional) */
  flatFee?: number;
}
```

### BillingPlan

```typescript
export type PricingModel =
  | 'flat_rate'        // Fixed price per billing period
  | 'per_unit'         // Price × quantity (per-seat)
  | 'tiered'           // Graduated pricing tiers
  | 'volume'           // All units priced at the tier matching total volume
  | 'staircase'        // Flat fee per tier bracket
  | 'usage_based'      // Pure usage metering (no base fee)
  | 'hybrid';          // Base fee + usage-based components

export interface BillingPlan {
  /** Internal UUID */
  id: string;
  /** Stripe product ID (prod_xxx) */
  stripeProductId: string;
  /** Stripe price ID (price_xxx) */
  stripePriceId: string;
  /** Human-readable plan name */
  name: string;
  /** Plan description */
  description: string;
  /** URL-safe slug */
  slug: string;
  /** Pricing model */
  pricingModel: PricingModel;
  /** Base price (in smallest currency unit) per billing interval */
  basePrice: number;
  /** Currency (ISO 4217) */
  currency: string;
  /** Billing interval */
  billingInterval: BillingInterval;
  /** Custom interval count (e.g., 3 months) */
  intervalCount: number;
  /** Trial period in days (0 = no trial) */
  trialDays: number;
  /** Per-unit pricing tiers (for tiered/volume models) */
  tiers: PlanTier[];
  /** Associated usage meters (for hybrid/usage-based models) */
  usageMeters: UsageMeter[];
  /** Features included in this plan (for display/gating) */
  features: PlanFeature[];
  /** Whether new subscriptions can use this plan */
  active: boolean;
  /** Whether this plan is publicly visible */
  public: boolean;
  /** Sort order for display */
  sortOrder: number;
  /** Maximum quantity (for per-seat, 0 = unlimited) */
  maxQuantity: number;
  /** Metadata */
  metadata: Record<string, string>;
  /** ISO timestamp of creation */
  createdAt: Date;
  /** ISO timestamp of last update */
  updatedAt: Date;
  /** ISO timestamp of archival (null if active) */
  archivedAt: Date | null;
}

export interface PlanTier {
  /** Lower bound (inclusive) */
  from: number;
  /** Upper bound (inclusive, null = unlimited) */
  to: number | null;
  /** Price per unit */
  unitPrice: number;
  /** Flat fee for this tier (added once if tier is reached) */
  flatFee: number;
}

export interface PlanFeature {
  /** Feature key for gating checks */
  key: string;
  /** Display label */
  label: string;
  /** Feature value (e.g., "unlimited", "100", "true") */
  value: string;
  /** Whether this feature is a highlight */
  highlighted: boolean;
}

export interface PlanCreateInput {
  name: string;
  description: string;
  slug: string;
  pricingModel: PricingModel;
  basePrice: number;
  currency?: string;
  billingInterval: BillingInterval;
  intervalCount?: number;
  trialDays?: number;
  tiers?: PlanTier[];
  usageMeters?: string[]; // meter IDs
  features?: PlanFeature[];
  active?: boolean;
  public?: boolean;
  sortOrder?: number;
  maxQuantity?: number;
  metadata?: Record<string, string>;
}
```

### PaymentMethod

```typescript
export type PaymentMethodType =
  | 'card'
  | 'bank_account'
  | 'sepa_debit'
  | 'ideal'
  | 'link';

export interface PaymentMethod {
  /** Internal UUID */
  id: string;
  /** Stripe payment method ID (pm_xxx) */
  stripePaymentMethodId: string;
  /** Customer/organization ID */
  customerId: string;
  /** Payment method type */
  type: PaymentMethodType;
  /** Whether this is the default payment method */
  isDefault: boolean;
  /** Card details (if type=card) */
  card: CardDetails | null;
  /** Bank account details (if type=bank_account) */
  bankAccount: BankAccountDetails | null;
  /** Billing address */
  billingAddress: BillingAddress | null;
  /** ISO timestamp of creation */
  createdAt: Date;
  /** ISO timestamp of last update */
  updatedAt: Date;
}

export interface CardDetails {
  /** Card brand (visa, mastercard, amex, etc.) */
  brand: string;
  /** Last 4 digits */
  last4: string;
  /** Expiration month (1-12) */
  expMonth: number;
  /** Expiration year (4-digit) */
  expYear: number;
  /** Card fingerprint for deduplication */
  fingerprint: string;
  /** Funding type */
  funding: 'credit' | 'debit' | 'prepaid' | 'unknown';
  /** Issuing country */
  country: string;
}

export interface BankAccountDetails {
  /** Bank name */
  bankName: string;
  /** Last 4 digits of account number */
  last4: string;
  /** Routing number (US) or sort code (UK) */
  routingNumber: string;
  /** Account holder type */
  accountHolderType: 'individual' | 'company';
  /** Country code */
  country: string;
  /** Currency */
  currency: string;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2
}

export interface PaymentAttempt {
  /** Attempt ID */
  id: string;
  /** Invoice ID */
  invoiceId: string;
  /** Stripe payment intent ID */
  stripePaymentIntentId: string;
  /** Attempt number (1-based) */
  attemptNumber: number;
  /** Amount attempted */
  amount: number;
  /** Currency */
  currency: string;
  /** Payment method used */
  paymentMethodId: string;
  /** Result status */
  status: 'succeeded' | 'failed' | 'pending' | 'canceled';
  /** Failure reason (if failed) */
  failureCode: string | null;
  /** Failure message (if failed) */
  failureMessage: string | null;
  /** Whether this was an automatic retry */
  automatic: boolean;
  /** ISO timestamp */
  createdAt: Date;
}

export interface PaymentResult {
  /** Whether payment succeeded */
  success: boolean;
  /** Payment attempt record */
  attempt: PaymentAttempt;
  /** Updated invoice */
  invoice: Invoice;
  /** Stripe payment intent (for client-side confirmation if needed) */
  paymentIntent?: {
    id: string;
    clientSecret: string;
    status: string;
  };
  /** Whether further action is required (3DS, etc.) */
  requiresAction: boolean;
}
```

### Additional Core Types

```typescript
// --- Billing Cycle & Period ---

export interface BillingCycle {
  /** Subscription ID */
  subscriptionId: string;
  /** Cycle number (1-based, increments each period) */
  cycleNumber: number;
  /** Period start */
  start: Date;
  /** Period end */
  end: Date;
  /** Billing interval */
  interval: BillingInterval;
  /** Invoice ID generated for this cycle */
  invoiceId: string | null;
  /** Status of this cycle */
  status: 'upcoming' | 'current' | 'invoiced' | 'paid' | 'void';
}

export interface BillingPeriod {
  start: Date;
  end: Date;
}

// --- Proration ---

export interface ProrationResult {
  /** Old plan details */
  oldPlan: { id: string; name: string; price: number };
  /** New plan details */
  newPlan: { id: string; name: string; price: number };
  /** Days remaining in current period */
  daysRemaining: number;
  /** Total days in current period */
  totalDays: number;
  /** Credit for unused time on old plan */
  creditAmount: number;
  /** Charge for remaining time on new plan */
  chargeAmount: number;
  /** Net amount (positive = charge, negative = credit) */
  netAmount: number;
  /** Currency */
  currency: string;
  /** Whether an immediate invoice will be generated */
  immediateInvoice: boolean;
  /** Preview line items */
  lineItems: InvoiceLineItem[];
}

// --- Credits ---

export interface CreditEntry {
  /** Credit entry ID */
  id: string;
  /** Customer ID */
  customerId: string;
  /** Amount (positive = credit, negative = debit) */
  amount: number;
  /** Currency */
  currency: string;
  /** Running balance after this entry */
  balance: number;
  /** Type of credit operation */
  type: CreditType;
  /** Description */
  description: string;
  /** Associated invoice ID (if applied to invoice) */
  invoiceId: string | null;
  /** Expiration date (null = never expires) */
  expiresAt: Date | null;
  /** Metadata */
  metadata: Record<string, string>;
  /** ISO timestamp */
  createdAt: Date;
}

export type CreditType =
  | 'manual'           // Manually issued by admin
  | 'promotional'      // Promotional credit
  | 'refund'           // Refund converted to credit
  | 'overpayment'      // Overpayment remainder
  | 'invoice_applied'  // Applied to an invoice
  | 'expired';         // Expired credit (debit entry)

export interface CreditBalance {
  /** Customer ID */
  customerId: string;
  /** Current balance (in smallest currency unit) */
  balance: number;
  /** Currency */
  currency: string;
  /** Credits expiring within 30 days */
  expiringBalance: number;
  /** Last updated timestamp */
  lastUpdated: Date;
}

// --- Revenue Recognition ---

export interface RevenueSchedule {
  /** Invoice ID */
  invoiceId: string;
  /** Total invoice amount */
  totalAmount: number;
  /** Currency */
  currency: string;
  /** Recognition method */
  method: 'point_in_time' | 'over_time' | 'milestone';
  /** Individual revenue entries */
  entries: RevenueEntry[];
  /** Whether schedule is fully recognized */
  fullyRecognized: boolean;
}

export interface RevenueEntry {
  /** Entry ID */
  id: string;
  /** Schedule/Invoice ID */
  invoiceId: string;
  /** Amount to recognize */
  amount: number;
  /** Period this revenue belongs to */
  recognitionDate: Date;
  /** Whether this entry has been recognized */
  recognized: boolean;
  /** Date recognized (null if pending) */
  recognizedAt: Date | null;
  /** Journal entry reference */
  journalEntryRef: string | null;
}

export interface DeferredRevenueReport {
  /** As-of date for the report */
  asOfDate: Date;
  /** Total deferred revenue */
  totalDeferred: number;
  /** Breakdown by month */
  monthlyBreakdown: {
    month: string; // YYYY-MM
    amount: number;
    currency: string;
  }[];
  /** Breakdown by plan */
  planBreakdown: {
    planId: string;
    planName: string;
    amount: number;
  }[];
}

// --- Dunning ---

export interface DunningConfig {
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry schedule in days after initial failure */
  retrySchedule: number[];
  /** Send email notifications on failure */
  notifyOnFailure: boolean;
  /** Cancel subscription after exhausting retries */
  cancelOnExhaustion: boolean;
  /** Grace period in days before marking as unpaid */
  gracePeriodDays: number;
}

export interface DunningState {
  /** Subscription ID */
  subscriptionId: string;
  /** Invoice ID that failed */
  invoiceId: string;
  /** Current retry count */
  retryCount: number;
  /** Next retry date */
  nextRetryAt: Date | null;
  /** Whether dunning is active */
  active: boolean;
  /** Current dunning step */
  currentStep: DunningStep;
  /** History of dunning actions */
  history: DunningAction[];
  /** Date dunning started */
  startedAt: Date;
  /** Date dunning resolved (null if active) */
  resolvedAt: Date | null;
  /** Resolution type */
  resolution: 'paid' | 'canceled' | 'manual' | null;
}

export type DunningStep =
  | 'initial_failure'
  | 'retry_1'
  | 'retry_2'
  | 'retry_3'
  | 'final_notice'
  | 'canceled';

export interface DunningAction {
  step: DunningStep;
  action: 'retry_payment' | 'send_email' | 'update_status' | 'cancel_subscription';
  success: boolean;
  timestamp: Date;
  details: string;
}

// --- Billing Portal ---

export interface BillingPortalSession {
  /** Session ID */
  id: string;
  /** Stripe billing portal session ID */
  stripeSessionId: string;
  /** Customer ID */
  customerId: string;
  /** Portal URL */
  url: string;
  /** Return URL after portal session */
  returnUrl: string;
  /** Expiration timestamp */
  expiresAt: Date;
  /** Created timestamp */
  createdAt: Date;
}

// --- Currency ---

export type SupportedCurrency =
  | 'usd' | 'eur' | 'gbp' | 'cad' | 'aud'
  | 'jpy' | 'chf' | 'nzd' | 'sgd' | 'hkd'
  | 'nok' | 'sek' | 'dkk' | 'pln' | 'czk'
  | 'brl' | 'mxn' | 'inr';

export interface CurrencyConfig {
  /** Settlement currency for your Stripe account */
  settlementCurrency: SupportedCurrency;
  /** Supported billing currencies */
  supportedCurrencies: SupportedCurrency[];
  /** Default currency for new customers */
  defaultCurrency: SupportedCurrency;
  /** FX markup percentage (e.g., 1.5 = 1.5% markup over mid-market rate) */
  fxMarkupPercent: number;
  /** Exchange rate refresh interval in seconds */
  rateRefreshInterval: number;
  /** Provider for exchange rates */
  rateProvider: 'stripe' | 'ecb' | 'openexchangerates';
}

export interface ExchangeRate {
  /** Source currency */
  from: string;
  /** Target currency */
  to: string;
  /** Exchange rate (1 unit of `from` = `rate` units of `to`) */
  rate: number;
  /** Rate with FX markup applied */
  effectiveRate: number;
  /** Timestamp when rate was fetched */
  fetchedAt: Date;
  /** Rate source */
  source: string;
}

export interface ConvertedAmount {
  /** Original amount */
  originalAmount: number;
  /** Original currency */
  originalCurrency: string;
  /** Converted amount */
  convertedAmount: number;
  /** Target currency */
  targetCurrency: string;
  /** Rate used for conversion */
  rate: ExchangeRate;
}
```

---

## Database Schemas

### Table: `billing_plans`

Stores all plan definitions. Plans are synced to Stripe Products/Prices.

```sql
CREATE TABLE billing_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT UNIQUE,
  stripe_price_id   TEXT UNIQUE,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  slug              TEXT NOT NULL UNIQUE,
  pricing_model     TEXT NOT NULL CHECK (pricing_model IN (
    'flat_rate', 'per_unit', 'tiered', 'volume', 'staircase', 'usage_based', 'hybrid'
  )),
  base_price        BIGINT NOT NULL DEFAULT 0,          -- in smallest currency unit
  currency          TEXT NOT NULL DEFAULT 'usd',
  billing_interval  TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month', 'quarter', 'year', 'custom')),
  interval_count    INT NOT NULL DEFAULT 1,
  trial_days        INT NOT NULL DEFAULT 0,
  tiers             JSONB NOT NULL DEFAULT '[]'::jsonb,  -- PlanTier[]
  usage_meters      JSONB NOT NULL DEFAULT '[]'::jsonb,  -- UsageMeter[]
  features          JSONB NOT NULL DEFAULT '[]'::jsonb,  -- PlanFeature[]
  active            BOOLEAN NOT NULL DEFAULT true,
  public            BOOLEAN NOT NULL DEFAULT true,
  sort_order        INT NOT NULL DEFAULT 0,
  max_quantity      INT NOT NULL DEFAULT 0,              -- 0 = unlimited
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at       TIMESTAMPTZ,

  CONSTRAINT valid_base_price CHECK (base_price >= 0),
  CONSTRAINT valid_trial_days CHECK (trial_days >= 0),
  CONSTRAINT valid_interval_count CHECK (interval_count > 0)
);

CREATE INDEX idx_billing_plans_slug ON billing_plans (slug);
CREATE INDEX idx_billing_plans_active ON billing_plans (active) WHERE active = true;
CREATE INDEX idx_billing_plans_public ON billing_plans (active, public) WHERE active = true AND public = true;
```

### Table: `subscriptions`

Tracks all customer subscriptions. Mirrors Stripe subscription state with local extensions.

```sql
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id  TEXT UNIQUE,
  customer_id             UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  stripe_customer_id      TEXT NOT NULL,
  plan_id                 UUID NOT NULL REFERENCES billing_plans(id) ON DELETE RESTRICT,
  status                  TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN (
    'trialing', 'active', 'paused', 'past_due', 'canceled', 'unpaid',
    'incomplete', 'incomplete_expired'
  )),
  currency                TEXT NOT NULL DEFAULT 'usd',
  current_period_start    TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end      TIMESTAMPTZ NOT NULL,
  billing_interval        TEXT NOT NULL DEFAULT 'month',
  trial_end               TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT false,
  canceled_at             TIMESTAMPTZ,
  cancellation_reason     TEXT,
  cancellation_feedback   TEXT,
  paused_at               TIMESTAMPTZ,
  resume_at               TIMESTAMPTZ,
  quantity                INT NOT NULL DEFAULT 1,
  discount_id             TEXT,
  collection_method       TEXT NOT NULL DEFAULT 'charge_automatically'
                          CHECK (collection_method IN ('charge_automatically', 'send_invoice')),
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_period CHECK (current_period_end > current_period_start)
);

CREATE INDEX idx_subscriptions_customer ON subscriptions (customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
CREATE INDEX idx_subscriptions_plan ON subscriptions (plan_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions (stripe_subscription_id);
CREATE INDEX idx_subscriptions_period_end ON subscriptions (current_period_end)
  WHERE status IN ('active', 'trialing');
CREATE INDEX idx_subscriptions_trial_end ON subscriptions (trial_end)
  WHERE trial_end IS NOT NULL AND status = 'trialing';
```

### Table: `invoices`

All generated invoices with full financial detail.

```sql
CREATE TABLE invoices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id     TEXT UNIQUE,
  invoice_number        TEXT NOT NULL UNIQUE,
  subscription_id       UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  customer_id           UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  stripe_customer_id    TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'open', 'paid', 'void', 'uncollectible'
  )),
  currency              TEXT NOT NULL DEFAULT 'usd',
  subtotal              BIGINT NOT NULL DEFAULT 0,
  tax                   BIGINT NOT NULL DEFAULT 0,
  discount_amount       BIGINT NOT NULL DEFAULT 0,
  credits_applied       BIGINT NOT NULL DEFAULT 0,
  total                 BIGINT NOT NULL DEFAULT 0,
  amount_due            BIGINT NOT NULL DEFAULT 0,
  amount_paid           BIGINT NOT NULL DEFAULT 0,
  tax_breakdown         JSONB NOT NULL DEFAULT '[]'::jsonb,
  period_start          TIMESTAMPTZ NOT NULL,
  period_end            TIMESTAMPTZ NOT NULL,
  due_date              TIMESTAMPTZ NOT NULL,
  finalized_at          TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ,
  voided_at             TIMESTAMPTZ,
  hosted_invoice_url    TEXT,
  invoice_pdf_url       TEXT,
  collection_method     TEXT NOT NULL DEFAULT 'charge_automatically',
  payment_intent_id     TEXT,
  memo                  TEXT,
  footer                TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_amounts CHECK (subtotal >= 0 AND tax >= 0 AND total >= 0),
  CONSTRAINT valid_invoice_period CHECK (period_end > period_start)
);

CREATE INDEX idx_invoices_customer ON invoices (customer_id);
CREATE INDEX idx_invoices_subscription ON invoices (subscription_id);
CREATE INDEX idx_invoices_status ON invoices (status);
CREATE INDEX idx_invoices_stripe ON invoices (stripe_invoice_id);
CREATE INDEX idx_invoices_number ON invoices (invoice_number);
CREATE INDEX idx_invoices_due_date ON invoices (due_date) WHERE status = 'open';
CREATE INDEX idx_invoices_period ON invoices (period_start, period_end);

-- Sequential invoice number generation
CREATE SEQUENCE invoice_number_seq START 10001;
```

### Table: `invoice_line_items`

Individual line items on invoices.

```sql
CREATE TABLE invoice_line_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  quantity      NUMERIC(15, 4) NOT NULL DEFAULT 1,
  unit_price    BIGINT NOT NULL DEFAULT 0,
  amount        BIGINT NOT NULL DEFAULT 0,
  plan_id       UUID REFERENCES billing_plans(id),
  meter_id      TEXT,
  period_start  TIMESTAMPTZ NOT NULL,
  period_end    TIMESTAMPTZ NOT NULL,
  proration     BOOLEAN NOT NULL DEFAULT false,
  type          TEXT NOT NULL DEFAULT 'subscription' CHECK (type IN (
    'subscription', 'usage', 'one_time', 'proration', 'credit', 'tax'
  )),
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_line_amount CHECK (quantity >= 0)
);

CREATE INDEX idx_line_items_invoice ON invoice_line_items (invoice_id);
CREATE INDEX idx_line_items_type ON invoice_line_items (type);
CREATE INDEX idx_line_items_plan ON invoice_line_items (plan_id) WHERE plan_id IS NOT NULL;
```

### Table: `usage_records`

Granular usage events for metered billing.

```sql
CREATE TABLE usage_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id   UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  meter_id          TEXT NOT NULL,
  quantity          NUMERIC(15, 4) NOT NULL,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key   TEXT NOT NULL,
  action            TEXT NOT NULL DEFAULT 'increment' CHECK (action IN ('increment', 'set')),
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_usage_quantity CHECK (quantity >= 0),
  CONSTRAINT unique_idempotency UNIQUE (subscription_id, meter_id, idempotency_key)
);

CREATE INDEX idx_usage_subscription ON usage_records (subscription_id);
CREATE INDEX idx_usage_meter ON usage_records (meter_id);
CREATE INDEX idx_usage_timestamp ON usage_records (timestamp);
CREATE INDEX idx_usage_sub_meter_ts ON usage_records (subscription_id, meter_id, timestamp);

-- Partition by month for performance at scale
-- CREATE TABLE usage_records_2025_01 PARTITION OF usage_records
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### Table: `payment_methods`

Customer payment instruments.

```sql
CREATE TABLE payment_methods (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_method_id  TEXT NOT NULL UNIQUE,
  customer_id               UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type                      TEXT NOT NULL CHECK (type IN (
    'card', 'bank_account', 'sepa_debit', 'ideal', 'link'
  )),
  is_default                BOOLEAN NOT NULL DEFAULT false,
  card_brand                TEXT,
  card_last4                TEXT,
  card_exp_month            INT,
  card_exp_year             INT,
  card_fingerprint          TEXT,
  card_funding              TEXT,
  card_country              TEXT,
  bank_name                 TEXT,
  bank_last4                TEXT,
  bank_routing_number       TEXT,
  bank_account_holder_type  TEXT,
  bank_country              TEXT,
  bank_currency             TEXT,
  billing_address           JSONB,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_methods_customer ON payment_methods (customer_id);
CREATE INDEX idx_payment_methods_default ON payment_methods (customer_id, is_default) WHERE is_default = true;
CREATE INDEX idx_payment_methods_stripe ON payment_methods (stripe_payment_method_id);

-- Ensure only one default per customer
CREATE UNIQUE INDEX idx_one_default_payment_method
  ON payment_methods (customer_id) WHERE is_default = true;
```

### Table: `payment_attempts`

Audit log of all payment collection attempts.

```sql
CREATE TABLE payment_attempts (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id                UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  stripe_payment_intent_id  TEXT,
  attempt_number            INT NOT NULL DEFAULT 1,
  amount                    BIGINT NOT NULL,
  currency                  TEXT NOT NULL DEFAULT 'usd',
  payment_method_id         UUID REFERENCES payment_methods(id),
  status                    TEXT NOT NULL CHECK (status IN (
    'succeeded', 'failed', 'pending', 'canceled'
  )),
  failure_code              TEXT,
  failure_message           TEXT,
  automatic                 BOOLEAN NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_attempt_number CHECK (attempt_number > 0),
  CONSTRAINT valid_attempt_amount CHECK (amount > 0)
);

CREATE INDEX idx_payment_attempts_invoice ON payment_attempts (invoice_id);
CREATE INDEX idx_payment_attempts_status ON payment_attempts (status);
CREATE INDEX idx_payment_attempts_stripe ON payment_attempts (stripe_payment_intent_id);
CREATE INDEX idx_payment_attempts_created ON payment_attempts (created_at);
```

### Table: `credit_ledger`

Double-entry credit ledger tracking all balance changes.

```sql
CREATE TABLE credit_ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  amount        BIGINT NOT NULL,             -- positive = credit, negative = debit
  currency      TEXT NOT NULL DEFAULT 'usd',
  balance       BIGINT NOT NULL,             -- running balance after this entry
  type          TEXT NOT NULL CHECK (type IN (
    'manual', 'promotional', 'refund', 'overpayment', 'invoice_applied', 'expired'
  )),
  description   TEXT NOT NULL DEFAULT '',
  invoice_id    UUID REFERENCES invoices(id),
  expires_at    TIMESTAMPTZ,
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID                         -- admin user who created the entry
);

CREATE INDEX idx_credit_ledger_customer ON credit_ledger (customer_id);
CREATE INDEX idx_credit_ledger_type ON credit_ledger (type);
CREATE INDEX idx_credit_ledger_invoice ON credit_ledger (invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX idx_credit_ledger_expires ON credit_ledger (expires_at)
  WHERE expires_at IS NOT NULL AND type != 'expired';
CREATE INDEX idx_credit_ledger_balance ON credit_ledger (customer_id, created_at DESC);
```

### Table: `revenue_schedule`

ASC 606 compliant revenue recognition schedule.

```sql
CREATE TABLE revenue_schedule (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount            BIGINT NOT NULL,          -- amount to recognize
  currency          TEXT NOT NULL DEFAULT 'usd',
  recognition_date  DATE NOT NULL,            -- date when revenue should be recognized
  recognized        BOOLEAN NOT NULL DEFAULT false,
  recognized_at     TIMESTAMPTZ,
  journal_entry_ref TEXT,                     -- reference to accounting journal entry
  method            TEXT NOT NULL DEFAULT 'over_time' CHECK (method IN (
    'point_in_time', 'over_time', 'milestone'
  )),
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_rev_amount CHECK (amount > 0)
);

CREATE INDEX idx_revenue_schedule_invoice ON revenue_schedule (invoice_id);
CREATE INDEX idx_revenue_schedule_date ON revenue_schedule (recognition_date);
CREATE INDEX idx_revenue_schedule_pending ON revenue_schedule (recognition_date, recognized)
  WHERE recognized = false;
CREATE INDEX idx_revenue_schedule_month ON revenue_schedule (
  date_trunc('month', recognition_date)
) WHERE recognized = false;
```

### Table: `dunning_states`

Tracks dunning workflow state for failed payments.

```sql
CREATE TABLE dunning_states (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id   UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  invoice_id        UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  retry_count       INT NOT NULL DEFAULT 0,
  next_retry_at     TIMESTAMPTZ,
  active            BOOLEAN NOT NULL DEFAULT true,
  current_step      TEXT NOT NULL DEFAULT 'initial_failure' CHECK (current_step IN (
    'initial_failure', 'retry_1', 'retry_2', 'retry_3', 'final_notice', 'canceled'
  )),
  history           JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at       TIMESTAMPTZ,
  resolution        TEXT CHECK (resolution IN ('paid', 'canceled', 'manual')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_retry_count CHECK (retry_count >= 0)
);

CREATE INDEX idx_dunning_subscription ON dunning_states (subscription_id);
CREATE INDEX idx_dunning_invoice ON dunning_states (invoice_id);
CREATE INDEX idx_dunning_active ON dunning_states (active, next_retry_at)
  WHERE active = true;
CREATE UNIQUE INDEX idx_dunning_active_invoice
  ON dunning_states (invoice_id) WHERE active = true;
```

### Table: `exchange_rates`

Cached exchange rates for multi-currency billing.

```sql
CREATE TABLE exchange_rates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency   TEXT NOT NULL,
  rate          NUMERIC(18, 8) NOT NULL,
  effective_rate NUMERIC(18, 8) NOT NULL,    -- rate with FX markup applied
  source        TEXT NOT NULL DEFAULT 'stripe',
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,

  CONSTRAINT valid_rate CHECK (rate > 0),
  CONSTRAINT valid_effective_rate CHECK (effective_rate > 0),
  CONSTRAINT unique_currency_pair UNIQUE (from_currency, to_currency, fetched_at)
);

CREATE INDEX idx_exchange_rates_pair ON exchange_rates (from_currency, to_currency);
CREATE INDEX idx_exchange_rates_expires ON exchange_rates (expires_at);
CREATE INDEX idx_exchange_rates_latest ON exchange_rates (from_currency, to_currency, fetched_at DESC);
```

### Materialized View: `usage_summary_mv`

Pre-aggregated usage data for fast invoice generation.

```sql
CREATE MATERIALIZED VIEW usage_summary_mv AS
SELECT
  subscription_id,
  meter_id,
  date_trunc('month', timestamp) AS billing_month,
  SUM(quantity) AS total_quantity,
  COUNT(*) AS event_count,
  MIN(timestamp) AS first_event,
  MAX(timestamp) AS last_event
FROM usage_records
WHERE action = 'increment'
GROUP BY subscription_id, meter_id, date_trunc('month', timestamp);

CREATE UNIQUE INDEX idx_usage_summary_mv_pk
  ON usage_summary_mv (subscription_id, meter_id, billing_month);

-- Refresh concurrently via cron
-- SELECT cron.schedule('refresh_usage_summary', '*/15 * * * *',
--   $$REFRESH MATERIALIZED VIEW CONCURRENTLY usage_summary_mv$$);
```

### RLS Policies

```sql
-- Customers can only see their own subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_customer_read ON subscriptions
  FOR SELECT USING (customer_id = auth.uid()::uuid);

-- Customers can only see their own invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_customer_read ON invoices
  FOR SELECT USING (customer_id = auth.uid()::uuid);

-- Customers can only see their own payment methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_methods_customer_read ON payment_methods
  FOR SELECT USING (customer_id = auth.uid()::uuid);

-- Customers can only see their own credit ledger
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY credit_ledger_customer_read ON credit_ledger
  FOR SELECT USING (customer_id = auth.uid()::uuid);

-- Service role bypasses all RLS policies for server-side operations
```

---

## Code Examples

### 1. Creating a Subscription with Trial Period

```typescript
import { BillingService } from '@mcv/finance/billing';

async function createSubscription(
  billing: BillingService,
  customerId: string,
  planSlug: string,
) {
  // Look up the plan by slug
  const plans = await billing.listPlans({ slug: planSlug, active: true });
  const plan = plans[0];

  if (!plan) {
    throw new Error(`Plan not found: ${planSlug}`);
  }

  // Create subscription with 14-day trial
  const subscription = await billing.createSubscription({
    customerId,
    planId: plan.id,
    trialDays: 14,
    quantity: 1,
    collectionMethod: 'charge_automatically',
    metadata: {
      source: 'onboarding_flow',
      campaign: 'q1_2025_promo',
    },
  });

  console.log(`Subscription created: ${subscription.id}`);
  console.log(`Status: ${subscription.status}`); // 'trialing'
  console.log(`Trial ends: ${subscription.trialEnd}`);
  console.log(`Stripe ID: ${subscription.stripeSubscriptionId}`);

  return subscription;
}
```

### 2. Recording Usage and Generating an Invoice

```typescript
import { BillingService } from '@mcv/finance/billing';
import { v4 as uuid } from 'uuid';

async function recordApiUsageAndInvoice(
  billing: BillingService,
  subscriptionId: string,
) {
  // Record usage events throughout the billing period
  const usageEvents = [
    {
      subscriptionId,
      meterId: 'api_calls',
      quantity: 1500,
      idempotencyKey: uuid(),
      timestamp: new Date('2025-01-15T10:30:00Z'),
      metadata: { endpoint: '/api/v1/analyze' },
    },
    {
      subscriptionId,
      meterId: 'api_calls',
      quantity: 3200,
      idempotencyKey: uuid(),
      timestamp: new Date('2025-01-16T14:00:00Z'),
      metadata: { endpoint: '/api/v1/process' },
    },
    {
      subscriptionId,
      meterId: 'storage_gb',
      quantity: 25.5,
      idempotencyKey: uuid(),
      action: 'set' as const, // Absolute value (not incremental)
      timestamp: new Date('2025-01-31T23:59:59Z'),
      metadata: { source: 'daily_snapshot' },
    },
  ];

  // Batch record usage
  const records = await billing.recordUsageBatch(usageEvents);
  console.log(`Recorded ${records.length} usage events`);

  // Get usage summary for the period
  const summary = await billing.getUsageSummary(
    subscriptionId,
    'api_calls',
    { start: new Date('2025-01-01'), end: new Date('2025-02-01') },
  );
  console.log(`Total API calls: ${summary.totalQuantity}`);
  console.log(`Estimated cost: $${(summary.estimatedCost / 100).toFixed(2)}`);

  // Generate invoice for the billing period
  const invoice = await billing.generateInvoice(
    subscriptionId,
    new Date('2025-02-01'),
  );
  console.log(`Invoice #${invoice.invoiceNumber}: $${(invoice.total / 100).toFixed(2)}`);
  console.log(`Line items:`);
  for (const item of invoice.lineItems) {
    console.log(`  - ${item.description}: $${(item.amount / 100).toFixed(2)}`);
  }

  return invoice;
}
```

### 3. Handling Plan Upgrades with Proration

```typescript
import { BillingService } from '@mcv/finance/billing';

async function upgradePlan(
  billing: BillingService,
  subscriptionId: string,
  newPlanSlug: string,
) {
  // Preview the proration before committing
  const subscription = await billing.getSubscription(subscriptionId);
  const newPlan = (await billing.listPlans({ slug: newPlanSlug }))[0];

  if (!newPlan) {
    throw new Error(`Plan not found: ${newPlanSlug}`);
  }

  // Calculate proration
  const proration = await billing.changeSubscriptionPlan(
    subscriptionId,
    newPlan.id,
  );

  console.log(`Upgrade: ${proration.oldPlan.name} → ${proration.newPlan.name}`);
  console.log(`Days remaining: ${proration.daysRemaining}/${proration.totalDays}`);
  console.log(`Credit for old plan: -$${(proration.creditAmount / 100).toFixed(2)}`);
  console.log(`Charge for new plan: +$${(proration.chargeAmount / 100).toFixed(2)}`);
  console.log(`Net charge: $${(proration.netAmount / 100).toFixed(2)}`);

  if (proration.immediateInvoice) {
    console.log('An immediate invoice will be generated for the difference.');
  }

  // Preview the proration line items
  for (const item of proration.lineItems) {
    const prefix = item.proration ? '(proration) ' : '';
    console.log(`  ${prefix}${item.description}: $${(item.amount / 100).toFixed(2)}`);
  }

  return proration;
}
```

### 4. Dunning Workflow for Failed Payments

```typescript
import { BillingService, DunningService } from '@mcv/finance/billing';
import type { DunningConfig } from '@mcv/finance/billing';

// Configure dunning behavior
const dunningConfig: DunningConfig = {
  maxRetries: 3,
  retrySchedule: [1, 3, 7], // Retry after 1, 3, and 7 days
  notifyOnFailure: true,
  cancelOnExhaustion: true,
  gracePeriodDays: 14,
};

async function handlePaymentFailure(
  billing: BillingService,
  dunning: DunningService,
  invoiceId: string,
  subscriptionId: string,
) {
  // Initial payment attempt failed — start dunning
  const state = await dunning.initiate(subscriptionId, invoiceId);
  console.log(`Dunning started for invoice ${invoiceId}`);
  console.log(`Next retry at: ${state.nextRetryAt}`);

  // The dunning service handles retries via cron job
  // Manual retry is also possible:
  const retryResult = await billing.retryPayment(invoiceId);

  if (retryResult.success) {
    console.log('Payment succeeded on retry!');
    // Dunning state is automatically resolved
  } else {
    console.log(`Retry failed: ${retryResult.attempt.failureMessage}`);
    console.log(`Attempt ${retryResult.attempt.attemptNumber} of ${dunningConfig.maxRetries}`);

    if (retryResult.attempt.attemptNumber >= dunningConfig.maxRetries) {
      console.log('All retries exhausted. Subscription will be canceled.');
      // The dunning cron job handles cancellation
    }
  }

  return retryResult;
}

// Cron job handler for processing dunning retries
async function processDunningRetries(dunning: DunningService) {
  const pendingRetries = await dunning.getPendingRetries();
  console.log(`Processing ${pendingRetries.length} dunning retries`);

  for (const state of pendingRetries) {
    try {
      await dunning.executeRetry(state.id);
    } catch (error) {
      console.error(`Dunning retry failed for ${state.invoiceId}:`, error);
    }
  }
}
```

### 5. Multi-Currency Billing with FX Conversion

```typescript
import { BillingService, CurrencyService } from '@mcv/finance/billing';

async function createMultiCurrencySubscription(
  billing: BillingService,
  currency: CurrencyService,
  customerId: string,
  planId: string,
  customerCurrency: string,
) {
  // Get the plan (priced in USD)
  const plan = await billing.getPlan(planId);
  console.log(`Plan: ${plan.name} - $${(plan.basePrice / 100).toFixed(2)} USD/mo`);

  // Convert price to customer's currency
  const converted = await currency.convertAmount(
    plan.basePrice,
    plan.currency,
    customerCurrency,
  );

  console.log(
    `Local price: ${(converted.convertedAmount / 100).toFixed(2)} ${customerCurrency.toUpperCase()}`
  );
  console.log(
    `Exchange rate: ${converted.rate.effectiveRate} (includes ${1.5}% FX markup)`
  );

  // Create subscription in customer's local currency
  const subscription = await billing.createSubscription({
    customerId,
    planId,
    currency: customerCurrency,
    metadata: {
      base_currency: plan.currency,
      fx_rate: converted.rate.effectiveRate.toString(),
      fx_rate_date: converted.rate.fetchedAt.toISOString(),
    },
  });

  console.log(`Subscription created in ${customerCurrency.toUpperCase()}`);
  return subscription;
}
```

### 6. Revenue Recognition (ASC 606)

```typescript
import { BillingService } from '@mcv/finance/billing';

async function recognizeMonthlyRevenue(
  billing: BillingService,
  period: { start: Date; end: Date },
) {
  // Get deferred revenue report
  const deferredReport = await billing.getDeferredRevenue(period.start);
  console.log(`Deferred revenue as of ${period.start.toISOString()}:`);
  console.log(`  Total: $${(deferredReport.totalDeferred / 100).toFixed(2)}`);

  for (const entry of deferredReport.monthlyBreakdown) {
    console.log(`  ${entry.month}: $${(entry.amount / 100).toFixed(2)}`);
  }

  // Recognize revenue for the period
  const result = await billing.recognizeRevenue(period);
  console.log(`\nRevenue recognized for ${period.start.toISOString()} - ${period.end.toISOString()}:`);
  console.log(`  Entries processed: ${result.entriesProcessed}`);
  console.log(`  Total recognized: $${(result.totalRecognized / 100).toFixed(2)}`);
  console.log(`  Journal entries created: ${result.journalEntriesCreated}`);

  return result;
}

// For annual subscriptions, create a 12-month recognition schedule
async function createAnnualRevenueSchedule(
  billing: BillingService,
  invoiceId: string,
) {
  const schedule = await billing.getRevenueSchedule(invoiceId);
  console.log(`Revenue schedule for invoice ${invoiceId}:`);
  console.log(`  Method: ${schedule.method}`);
  console.log(`  Total: $${(schedule.totalAmount / 100).toFixed(2)}`);
  console.log(`  Monthly recognition:`);

  for (const entry of schedule.entries) {
    const status = entry.recognized ? '✓' : '○';
    console.log(
      `    ${status} ${entry.recognitionDate.toISOString().slice(0, 7)}: $${(entry.amount / 100).toFixed(2)}`
    );
  }
}
```

### 7. Stripe Webhook Handler

```typescript
import { BillingService } from '@mcv/finance/billing';
import type { Request, Response } from 'express';

export function createWebhookHandler(billing: BillingService) {
  return async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    try {
      await billing.handleStripeWebhook(req.body, signature);
      res.status(200).json({ received: true });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Webhook error:', error.message);
        // Return 200 for known events we choose not to handle
        // Return 400 for signature verification failures
        if (error.message.includes('signature')) {
          return res.status(400).json({ error: 'Invalid signature' });
        }
      }
      // Return 200 to prevent Stripe from retrying
      res.status(200).json({ received: true, error: 'Processing failed' });
    }
  };
}

// Internally, the webhook handler processes these events:
// - customer.subscription.created
// - customer.subscription.updated
// - customer.subscription.deleted
// - customer.subscription.trial_will_end
// - invoice.created
// - invoice.finalized
// - invoice.paid
// - invoice.payment_failed
// - invoice.voided
// - payment_intent.succeeded
// - payment_intent.payment_failed
// - payment_method.attached
// - payment_method.detached
// - payment_method.updated
// - customer.discount.created
// - customer.discount.deleted
```

### 8. Billing Portal Session Creation

```typescript
import { BillingService } from '@mcv/finance/billing';

async function openBillingPortal(
  billing: BillingService,
  customerId: string,
  returnUrl: string,
) {
  const session = await billing.createPortalSession(customerId, returnUrl);

  console.log(`Portal session created: ${session.id}`);
  console.log(`URL: ${session.url}`);
  console.log(`Expires: ${session.expiresAt}`);

  // The portal allows customers to:
  // - View and download invoices
  // - Update payment methods
  // - Change or cancel subscriptions
  // - View usage and billing history
  // - Update billing address

  return session;
}
```

### 9. Credit Issuance and Application

```typescript
import { BillingService } from '@mcv/finance/billing';

async function issueAndApplyCredits(
  billing: BillingService,
  customerId: string,
  invoiceId: string,
) {
  // Issue a promotional credit
  const credit = await billing.issueCredit({
    customerId,
    amount: 5000, // $50.00
    currency: 'usd',
    type: 'promotional',
    description: 'New customer welcome credit',
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    metadata: {
      campaign: 'welcome_2025',
      issued_by: 'system',
    },
  });

  console.log(`Credit issued: $${(credit.amount / 100).toFixed(2)}`);
  console.log(`New balance: $${(credit.balance / 100).toFixed(2)}`);
  console.log(`Expires: ${credit.expiresAt}`);

  // Check current balance
  const balance = await billing.getBalance(customerId);
  console.log(`Total credit balance: $${(balance.balance / 100).toFixed(2)}`);
  console.log(`Expiring within 30 days: $${(balance.expiringBalance / 100).toFixed(2)}`);

  // Apply credits to an invoice
  const applied = await billing.applyCreditsToInvoice(invoiceId);
  console.log(`Credits applied to invoice: $${(applied.amountApplied / 100).toFixed(2)}`);
  console.log(`Remaining invoice balance: $${(applied.remainingDue / 100).toFixed(2)}`);

  return applied;
}
```

### 10. Tiered Pricing Calculation

```typescript
import type { UsageTier } from '@mcv/finance/billing';

/**
 * Calculate cost for graduated tiered pricing.
 * Each tier's rate only applies to usage within that tier's range.
 */
function calculateTieredCost(
  quantity: number,
  tiers: UsageTier[],
  includedQuantity: number = 0,
): { totalCost: number; tierBreakdown: TierBreakdown[] } {
  const billableQuantity = Math.max(0, quantity - includedQuantity);
  let remaining = billableQuantity;
  let totalCost = 0;
  const tierBreakdown: TierBreakdown[] = [];

  for (const tier of tiers) {
    if (remaining <= 0) break;

    const tierRange = tier.to !== null ? tier.to - tier.from + 1 : Infinity;
    const quantityInTier = Math.min(remaining, tierRange);

    const tierCost = quantityInTier * tier.unitPrice + (tier.flatFee ?? 0);
    totalCost += tierCost;

    tierBreakdown.push({
      from: tier.from,
      to: tier.to,
      quantity: quantityInTier,
      unitPrice: tier.unitPrice,
      flatFee: tier.flatFee ?? 0,
      subtotal: tierCost,
    });

    remaining -= quantityInTier;
  }

  return { totalCost, tierBreakdown };
}

interface TierBreakdown {
  from: number;
  to: number | null;
  quantity: number;
  unitPrice: number;
  flatFee: number;
  subtotal: number;
}

// Example: API call pricing
const apiTiers: UsageTier[] = [
  { from: 0,       to: 10000,   unitPrice: 0,    flatFee: 0 },    // First 10K free
  { from: 10001,   to: 100000,  unitPrice: 50,   flatFee: 0 },    // $0.0050/call
  { from: 100001,  to: 1000000, unitPrice: 25,   flatFee: 0 },    // $0.0025/call
  { from: 1000001, to: null,    unitPrice: 10,   flatFee: 0 },    // $0.0010/call
];

const result = calculateTieredCost(250000, apiTiers);
console.log(`Total cost: $${(result.totalCost / 100).toFixed(2)}`);
for (const tier of result.tierBreakdown) {
  console.log(
    `  ${tier.from.toLocaleString()}-${tier.to?.toLocaleString() ?? '∞'}: ` +
    `${tier.quantity.toLocaleString()} × $${(tier.unitPrice / 100).toFixed(4)} = $${(tier.subtotal / 100).toFixed(2)}`
  );
}
```

---

## tRPC Router

```typescript
import { router, protectedProcedure, adminProcedure } from '@mcv/trpc';
import { z } from 'zod';
import {
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
  invoiceCreateSchema,
  usageEventSchema,
  planCreateSchema,
  creditAdjustmentSchema,
} from './schemas';

export const billingRouter = router({
  // === Subscription Procedures ===
  subscription: router({
    create: protectedProcedure
      .input(subscriptionCreateSchema)
      .mutation(({ ctx, input }) =>
        ctx.billing.createSubscription(input)),

    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(({ ctx, input }) =>
        ctx.billing.getSubscription(input.id)),

    update: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        data: subscriptionUpdateSchema,
      }))
      .mutation(({ ctx, input }) =>
        ctx.billing.updateSubscription(input.id, input.data)),

    cancel: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        immediately: z.boolean().optional().default(false),
        reason: z.enum([
          'too_expensive', 'missing_features', 'switched_service',
          'unused', 'customer_service', 'too_complex', 'other',
        ]).optional(),
        feedback: z.string().max(1000).optional(),
        prorate: z.boolean().optional().default(true),
      }))
      .mutation(({ ctx, input }) =>
        ctx.billing.cancelSubscription(input.id, {
          immediately: input.immediately,
          reason: input.reason,
          feedback: input.feedback,
          prorate: input.prorate,
        })),

    pause: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        resumeAt: z.date().optional(),
      }))
      .mutation(({ ctx, input }) =>
        ctx.billing.pauseSubscription(input.id, input.resumeAt)),

    resume: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ ctx, input }) =>
        ctx.billing.resumeSubscription(input.id)),

    changePlan: protectedProcedure
      .input(z.object({
        id: z.string().uuid(),
        newPlanId: z.string().uuid(),
      }))
      .mutation(({ ctx, input }) =>
        ctx.billing.changeSubscriptionPlan(input.id, input.newPlanId)),

    list: protectedProcedure
      .input(z.object({
        customerId: z.string().uuid().optional(),
        status: z.enum([
          'trialing', 'active', 'paused', 'past_due', 'canceled',
          'unpaid', 'incomplete', 'incomplete_expired',
        ]).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(20),
      }))
      .query(({ ctx, input }) =>
        ctx.billing.listSubscriptions(input)),
  }),

  // === Plan Procedures ===
  plan: router({
    create: adminProcedure
      .input(planCreateSchema)
      .mutation(({ ctx, input }) =>
        ctx.billing.createPlan(input)),

    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(({ ctx, input }) =>
        ctx.billing.getPlan(input.id)),

    list: protectedProcedure
      .input(z.object({
        active: z.boolean().optional().default(true),
        public: z.boolean().optional(),
      }).optional())
      .query(({ ctx, input }) =>
        ctx.billing.listPlans(input)),

    archive: adminProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ ctx, input }) =>
        ctx.billing.archivePlan(input.id)),
  }),

  // === Invoice Procedures ===
  invoice: router({
    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(({ ctx, input }) =>
        ctx.billing.getInvoice(input.id)),

    list: protectedProcedure
      .input(z.object({
        customerId: z.string().uuid().optional(),
        subscriptionId: z.string().uuid().optional(),
        status: z.enum(['draft', 'open', 'paid', 'void', 'uncollectible']).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(20),
      }))
      .query(({ ctx, input }) =>
        ctx.billing.listInvoices(input)),

    void: adminProcedure
      .input(z.object({
        id: z.string().uuid(),
        reason: z.string().min(1).max(500),
      }))
      .mutation(({ ctx, input }) =>
        ctx.billing.voidInvoice(input.id, input.reason)),

    send: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ ctx, input }) =>
        ctx.billing.sendInvoice(input.id)),

    downloadPdf: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(({ ctx, input }) =>
        ctx.billing.downloadInvoicePdf(input.id)),
  }),

  // === Usage Procedures ===
  usage: router({
    record: protectedProcedure
      .input(usageEventSchema)
      .mutation(({ ctx, input }) =>
        ctx.billing.recordUsage(input)),

    recordBatch: protectedProcedure
      .input(z.array(usageEventSchema).max(1000))
      .mutation(({ ctx, input }) =>
        ctx.billing.recordUsageBatch(input)),

    summary: protectedProcedure
      .input(z.object({
        subscriptionId: z.string().uuid(),
        meterId: z.string(),
        periodStart: z.date(),
        periodEnd: z.date(),
      }))
      .query(({ ctx, input }) =>
        ctx.billing.getUsageSummary(
          input.subscriptionId,
          input.meterId,
          { start: input.periodStart, end: input.periodEnd },
        )),
  }),

  // === Payment Procedures ===
  payment: router({
    collect: adminProcedure
      .input(z.object({ invoiceId: z.string().uuid() }))
      .mutation(({ ctx, input }) =>
        ctx.billing.collectPayment(input.invoiceId)),

    retry: adminProcedure
      .input(z.object({ invoiceId: z.string().uuid() }))
      .mutation(({ ctx, input }) =>
        ctx.billing.retryPayment(input.invoiceId)),

    methods: router({
      add: protectedProcedure
        .input(z.object({
          customerId: z.string().uuid(),
          paymentMethodId: z.string(), // Stripe PM ID from client-side
          setDefault: z.boolean().optional().default(false),
        }))
        .mutation(({ ctx, input }) =>
          ctx.billing.addPaymentMethod(input.customerId, input)),

      remove: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(({ ctx, input }) =>
          ctx.billing.removePaymentMethod(input.id)),

      setDefault: protectedProcedure
        .input(z.object({
          customerId: z.string().uuid(),
          paymentMethodId: z.string().uuid(),
        }))
        .mutation(({ ctx, input }) =>
          ctx.billing.setDefaultPaymentMethod(input.customerId, input.paymentMethodId)),

      list: protectedProcedure
        .input(z.object({ customerId: z.string().uuid() }))
        .query(({ ctx, input }) =>
          ctx.billing.listPaymentMethods(input.customerId)),
    }),
  }),

  // === Credit Procedures ===
  credit: router({
    issue: adminProcedure
      .input(creditAdjustmentSchema)
      .mutation(({ ctx, input }) =>
        ctx.billing.issueCredit(input)),

    balance: protectedProcedure
      .input(z.object({ customerId: z.string().uuid() }))
      .query(({ ctx, input }) =>
        ctx.billing.getBalance(input.customerId)),

    list: protectedProcedure
      .input(z.object({
        customerId: z.string().uuid(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(20),
      }))
      .query(({ ctx, input }) =>
        ctx.billing.listCredits(input.customerId, input)),

    applyToInvoice: adminProcedure
      .input(z.object({ invoiceId: z.string().uuid() }))
      .mutation(({ ctx, input }) =>
        ctx.billing.applyCreditsToInvoice(input.invoiceId)),
  }),

  // === Revenue Recognition Procedures ===
  revenue: router({
    schedule: adminProcedure
      .input(z.object({ invoiceId: z.string().uuid() }))
      .query(({ ctx, input }) =>
        ctx.billing.getRevenueSchedule(input.invoiceId)),

    recognize: adminProcedure
      .input(z.object({
        periodStart: z.date(),
        periodEnd: z.date(),
      }))
      .mutation(({ ctx, input }) =>
        ctx.billing.recognizeRevenue({ start: input.periodStart, end: input.periodEnd })),

    deferredReport: adminProcedure
      .input(z.object({ asOfDate: z.date() }))
      .query(({ ctx, input }) =>
        ctx.billing.getDeferredRevenue(input.asOfDate)),
  }),

  // === Portal Procedures ===
  portal: router({
    createSession: protectedProcedure
      .input(z.object({
        customerId: z.string().uuid(),
        returnUrl: z.string().url(),
      }))
      .mutation(({ ctx, input }) =>
        ctx.billing.createPortalSession(input.customerId, input.returnUrl)),
  }),

  // === Currency Procedures ===
  currency: router({
    getRate: protectedProcedure
      .input(z.object({
        from: z.string().length(3),
        to: z.string().length(3),
      }))
      .query(({ ctx, input }) =>
        ctx.billing.getExchangeRate(input.from, input.to)),

    convert: protectedProcedure
      .input(z.object({
        amount: z.number().int().positive(),
        from: z.string().length(3),
        to: z.string().length(3),
      }))
      .query(({ ctx, input }) =>
        ctx.billing.convertAmount(input.amount, input.from, input.to)),
  }),
});
```

---

## Error Codes

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| `BILLING_001` | `PLAN_NOT_FOUND` | 404 | The specified billing plan does not exist or has been archived |
| `BILLING_002` | `PLAN_NOT_ACTIVE` | 400 | Cannot create subscription — the plan is inactive or archived |
| `BILLING_003` | `SUBSCRIPTION_NOT_FOUND` | 404 | The specified subscription does not exist |
| `BILLING_004` | `SUBSCRIPTION_ALREADY_CANCELED` | 400 | Subscription is already canceled and cannot be modified |
| `BILLING_005` | `SUBSCRIPTION_NOT_ACTIVE` | 400 | Operation requires an active subscription (current status is incompatible) |
| `BILLING_006` | `SUBSCRIPTION_PAUSED` | 400 | Subscription is paused — resume before performing this operation |
| `BILLING_007` | `INVOICE_NOT_FOUND` | 404 | The specified invoice does not exist |
| `BILLING_008` | `INVOICE_ALREADY_PAID` | 400 | Invoice has already been paid and cannot be modified |
| `BILLING_009` | `INVOICE_ALREADY_VOIDED` | 400 | Invoice has been voided and cannot be charged |
| `BILLING_010` | `INVOICE_NOT_FINALIZED` | 400 | Invoice must be finalized before payment can be collected |
| `BILLING_011` | `PAYMENT_METHOD_NOT_FOUND` | 404 | The specified payment method does not exist or has been detached |
| `BILLING_012` | `PAYMENT_FAILED` | 402 | Payment attempt failed (see failure_code and failure_message for details) |
| `BILLING_013` | `PAYMENT_REQUIRES_ACTION` | 402 | Payment requires additional customer authentication (3D Secure, etc.) |
| `BILLING_014` | `INSUFFICIENT_CREDITS` | 400 | Insufficient credit balance to cover the requested amount |
| `BILLING_015` | `USAGE_DUPLICATE_EVENT` | 409 | Usage event with this idempotency key has already been recorded |
| `BILLING_016` | `USAGE_METER_NOT_FOUND` | 404 | The specified usage meter does not exist on this plan |
| `BILLING_017` | `INVALID_CURRENCY` | 400 | The specified currency is not supported for billing |
| `BILLING_018` | `CURRENCY_MISMATCH` | 400 | Operation requires matching currencies (cannot mix currencies in one invoice) |
| `BILLING_019` | `PRORATION_FAILED` | 500 | Failed to calculate proration for the plan change |
| `BILLING_020` | `STRIPE_SYNC_FAILED` | 502 | Failed to synchronize state with Stripe (Stripe API error) |
| `BILLING_021` | `WEBHOOK_SIGNATURE_INVALID` | 400 | Stripe webhook signature verification failed |
| `BILLING_022` | `DUNNING_EXHAUSTED` | 400 | All dunning retries have been exhausted for this subscription |
| `BILLING_023` | `TRIAL_ALREADY_USED` | 400 | Customer has already used a trial period for this plan |
| `BILLING_024` | `QUANTITY_EXCEEDS_MAX` | 400 | Requested quantity exceeds the plan's maximum allowed quantity |
| `BILLING_025` | `REVENUE_ALREADY_RECOGNIZED` | 400 | Revenue for this period has already been recognized |
| `BILLING_026` | `PORTAL_SESSION_EXPIRED` | 410 | Billing portal session has expired — create a new one |
| `BILLING_027` | `EXCHANGE_RATE_STALE` | 503 | Exchange rate data is too old — refresh required before conversion |
| `BILLING_028` | `DOWNGRADE_RESTRICTED` | 400 | Downgrade not permitted — current usage exceeds target plan limits |

```typescript
export const BILLING_ERRORS = {
  PLAN_NOT_FOUND: {
    code: 'BILLING_001',
    message: 'Billing plan not found',
    httpStatus: 404,
  },
  PLAN_NOT_ACTIVE: {
    code: 'BILLING_002',
    message: 'Plan is not active for new subscriptions',
    httpStatus: 400,
  },
  SUBSCRIPTION_NOT_FOUND: {
    code: 'BILLING_003',
    message: 'Subscription not found',
    httpStatus: 404,
  },
  SUBSCRIPTION_ALREADY_CANCELED: {
    code: 'BILLING_004',
    message: 'Subscription is already canceled',
    httpStatus: 400,
  },
  SUBSCRIPTION_NOT_ACTIVE: {
    code: 'BILLING_005',
    message: 'Subscription is not in an active state',
    httpStatus: 400,
  },
  SUBSCRIPTION_PAUSED: {
    code: 'BILLING_006',
    message: 'Subscription is paused — resume before modifying',
    httpStatus: 400,
  },
  INVOICE_NOT_FOUND: {
    code: 'BILLING_007',
    message: 'Invoice not found',
    httpStatus: 404,
  },
  INVOICE_ALREADY_PAID: {
    code: 'BILLING_008',
    message: 'Invoice has already been paid',
    httpStatus: 400,
  },
  INVOICE_ALREADY_VOIDED: {
    code: 'BILLING_009',
    message: 'Invoice has been voided',
    httpStatus: 400,
  },
  INVOICE_NOT_FINALIZED: {
    code: 'BILLING_010',
    message: 'Invoice must be finalized before payment collection',
    httpStatus: 400,
  },
  PAYMENT_METHOD_NOT_FOUND: {
    code: 'BILLING_011',
    message: 'Payment method not found',
    httpStatus: 404,
  },
  PAYMENT_FAILED: {
    code: 'BILLING_012',
    message: 'Payment attempt failed',
    httpStatus: 402,
  },
  PAYMENT_REQUIRES_ACTION: {
    code: 'BILLING_013',
    message: 'Payment requires additional authentication',
    httpStatus: 402,
  },
  INSUFFICIENT_CREDITS: {
    code: 'BILLING_014',
    message: 'Insufficient credit balance',
    httpStatus: 400,
  },
  USAGE_DUPLICATE_EVENT: {
    code: 'BILLING_015',
    message: 'Duplicate usage event (idempotency key already exists)',
    httpStatus: 409,
  },
  USAGE_METER_NOT_FOUND: {
    code: 'BILLING_016',
    message: 'Usage meter not found on this plan',
    httpStatus: 404,
  },
  INVALID_CURRENCY: {
    code: 'BILLING_017',
    message: 'Unsupported billing currency',
    httpStatus: 400,
  },
  CURRENCY_MISMATCH: {
    code: 'BILLING_018',
    message: 'Currency mismatch in billing operation',
    httpStatus: 400,
  },
  PRORATION_FAILED: {
    code: 'BILLING_019',
    message: 'Proration calculation failed',
    httpStatus: 500,
  },
  STRIPE_SYNC_FAILED: {
    code: 'BILLING_020',
    message: 'Failed to sync with Stripe',
    httpStatus: 502,
  },
  WEBHOOK_SIGNATURE_INVALID: {
    code: 'BILLING_021',
    message: 'Invalid Stripe webhook signature',
    httpStatus: 400,
  },
  DUNNING_EXHAUSTED: {
    code: 'BILLING_022',
    message: 'All dunning retries exhausted',
    httpStatus: 400,
  },
  TRIAL_ALREADY_USED: {
    code: 'BILLING_023',
    message: 'Trial period already used for this plan',
    httpStatus: 400,
  },
  QUANTITY_EXCEEDS_MAX: {
    code: 'BILLING_024',
    message: 'Quantity exceeds plan maximum',
    httpStatus: 400,
  },
  REVENUE_ALREADY_RECOGNIZED: {
    code: 'BILLING_025',
    message: 'Revenue already recognized for this period',
    httpStatus: 400,
  },
  PORTAL_SESSION_EXPIRED: {
    code: 'BILLING_026',
    message: 'Billing portal session expired',
    httpStatus: 410,
  },
  EXCHANGE_RATE_STALE: {
    code: 'BILLING_027',
    message: 'Exchange rate data is stale',
    httpStatus: 503,
  },
  DOWNGRADE_RESTRICTED: {
    code: 'BILLING_028',
    message: 'Downgrade restricted due to current usage',
    httpStatus: 400,
  },
} as const;
```

---

## Security

### Authentication & Authorization

- All billing tRPC procedures require authentication via `protectedProcedure`
- Administrative operations (plan creation, voiding invoices, issuing credits, revenue recognition) use `adminProcedure` with role-based access checks
- Customer-scoped queries enforce `customerId` matching via RLS policies — customers can only see their own data
- Service-role operations (webhook handlers, cron jobs) bypass RLS using the Supabase service-role client

### Stripe Security

- **Webhook signature verification** — All incoming Stripe webhooks are verified using the `STRIPE_WEBHOOK_SECRET` before processing. Invalid signatures are rejected with `BILLING_021`
- **API key management** — Stripe secret keys are stored in environment variables, never in code or client bundles
- **Idempotency** — All Stripe API calls that create resources include idempotency keys to prevent duplicate charges
- **PCI compliance** — Payment method tokenization happens client-side via Stripe Elements. Raw card numbers never touch our servers
- **Connect mode** — Stripe Connect is used for platform billing. Connected account operations are scoped via `stripeAccount` headers

### Data Protection

- **Amounts in smallest unit** — All monetary amounts are stored as integers in the smallest currency unit (e.g., cents for USD) to avoid floating-point errors
- **Audit trail** — All billing mutations are logged with actor, timestamp, and before/after state
- **Credit ledger integrity** — Running balances are maintained transactionally with `SELECT ... FOR UPDATE` locks to prevent race conditions
- **Invoice immutability** — Finalized invoices cannot be edited. Corrections require voiding and re-issuing
- **Soft deletion** — Plans are archived rather than deleted. Subscriptions are canceled, not removed
- **Currency isolation** — Multi-currency invoices are prevented at the schema level. Each invoice operates in exactly one currency

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `billing.usage.record` | 1000 req | per minute |
| `billing.usage.recordBatch` | 100 req | per minute |
| `billing.payment.collect` | 10 req | per minute |
| `billing.subscription.create` | 20 req | per minute |
| `billing.portal.createSession` | 30 req | per minute |
| `billing.currency.convert` | 100 req | per minute |

### Sensitive Data Handling

- Payment method details (card numbers, bank accounts) are stored in Stripe only — local records contain only last-4, brand, and fingerprint
- Stripe customer IDs and payment intent IDs are stored for cross-reference but are not considered PII
- Invoice PDFs may contain billing addresses — access is gated by customer ownership
- Exchange rates are cached locally but are not sensitive data

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | ✅ | — | Stripe API secret key (`sk_live_xxx` or `sk_test_xxx`) |
| `STRIPE_PUBLISHABLE_KEY` | ✅ | — | Stripe publishable key for client-side usage |
| `STRIPE_WEBHOOK_SECRET` | ✅ | — | Webhook endpoint signing secret (`whsec_xxx`) |
| `STRIPE_API_VERSION` | ❌ | `2024-12-18.acacia` | Pinned Stripe API version |
| `SUPABASE_URL` | ✅ | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | Service role key for server-side operations |
| `SUPABASE_ANON_KEY` | ✅ | — | Anonymous key for client-side (RLS-enforced) access |
| `BILLING_DEFAULT_CURRENCY` | ❌ | `usd` | Default currency for new subscriptions |
| `BILLING_SETTLEMENT_CURRENCY` | ❌ | `usd` | Settlement currency for the Stripe account |
| `BILLING_FX_MARKUP_PERCENT` | ❌ | `1.5` | FX markup over mid-market rate (percentage) |
| `BILLING_EXCHANGE_RATE_TTL` | ❌ | `3600` | Exchange rate cache TTL in seconds |
| `BILLING_EXCHANGE_RATE_PROVIDER` | ❌ | `stripe` | Exchange rate provider (`stripe`, `ecb`, `openexchangerates`) |
| `BILLING_TAX_ENABLED` | ❌ | `true` | Enable automatic tax calculation via Stripe Tax |
| `BILLING_DUNNING_MAX_RETRIES` | ❌ | `3` | Maximum dunning retry attempts |
| `BILLING_DUNNING_SCHEDULE` | ❌ | `1,3,7` | Comma-separated retry schedule in days |
| `BILLING_DUNNING_GRACE_PERIOD` | ❌ | `14` | Grace period in days before marking unpaid |
| `BILLING_INVOICE_PREFIX` | ❌ | `INV` | Prefix for generated invoice numbers |
| `BILLING_INVOICE_DUE_DAYS` | ❌ | `30` | Default due date offset in days from invoice date |
| `BILLING_PORTAL_RETURN_URL` | ❌ | — | Default return URL for billing portal sessions |
| `BILLING_REVENUE_RECOGNITION` | ❌ | `true` | Enable ASC 606 revenue recognition tracking |
| `BILLING_MAX_USAGE_BATCH_SIZE` | ❌ | `1000` | Maximum usage events per batch request |
| `BILLING_WEBHOOK_TOLERANCE` | ❌ | `300` | Webhook signature tolerance in seconds |
| `OPENEXCHANGERATES_APP_ID` | ❌ | — | App ID for Open Exchange Rates (if using that provider) |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/core` | Shared types, error classes, logging, configuration |
| `@mcv/auth` | Authentication context, user/org resolution |
| `@mcv/trpc` | tRPC router factory, procedure builders, middleware |
| `@mcv/events` | Event bus for publishing billing domain events |
| `@mcv/email` | Transactional emails (invoice delivery, payment failure notifications) |
| `@mcv/pdf` | Invoice PDF generation |
| `@mcv/finance/accounting` | Journal entry creation for revenue recognition |
| `@mcv/finance/tax` | Tax calculation and compliance (if separated) |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `stripe` | `^17.x` | Stripe Node.js SDK for all payment operations |
| `@supabase/supabase-js` | `^2.x` | Supabase client for PostgreSQL access |
| `@trpc/server` | `^10.x` | tRPC server for API layer |
| `zod` | `^3.x` | Runtime schema validation |
| `date-fns` | `^3.x` | Date arithmetic for billing periods and proration |
| `decimal.js` | `^10.x` | Arbitrary-precision decimal math for financial calculations |
| `uuid` | `^9.x` | UUID generation for idempotency keys |
| `ioredis` | `^5.x` | Redis client for rate limiting and usage event buffering |
| `bull` | `^4.x` | Job queue for async invoice generation and dunning retries |

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProrationService } from './services/proration.service';
import { calculateTieredCost } from './utils/pricing';

describe('ProrationService', () => {
  let proration: ProrationService;

  beforeEach(() => {
    proration = new ProrationService();
  });

  it('should calculate correct proration for mid-cycle upgrade', () => {
    const result = proration.calculate({
      oldPlanPrice: 2900, // $29.00
      newPlanPrice: 9900, // $99.00
      periodStart: new Date('2025-02-01'),
      periodEnd: new Date('2025-03-01'),
      changeDate: new Date('2025-02-15'),
      currency: 'usd',
    });

    expect(result.daysRemaining).toBe(14);
    expect(result.totalDays).toBe(28);
    expect(result.creditAmount).toBe(1450); // 14/28 * 2900 = 1450
    expect(result.chargeAmount).toBe(4950); // 14/28 * 9900 = 4950
    expect(result.netAmount).toBe(3500);    // 4950 - 1450 = 3500
  });

  it('should calculate correct proration for mid-cycle downgrade', () => {
    const result = proration.calculate({
      oldPlanPrice: 9900,
      newPlanPrice: 2900,
      periodStart: new Date('2025-02-01'),
      periodEnd: new Date('2025-03-01'),
      changeDate: new Date('2025-02-15'),
      currency: 'usd',
    });

    expect(result.netAmount).toBe(-3500); // Negative = credit
  });

  it('should handle same-day change (full period remaining)', () => {
    const result = proration.calculate({
      oldPlanPrice: 2900,
      newPlanPrice: 4900,
      periodStart: new Date('2025-02-01'),
      periodEnd: new Date('2025-03-01'),
      changeDate: new Date('2025-02-01'),
      currency: 'usd',
    });

    expect(result.daysRemaining).toBe(28);
    expect(result.totalDays).toBe(28);
    expect(result.creditAmount).toBe(2900);
    expect(result.chargeAmount).toBe(4900);
    expect(result.netAmount).toBe(2000);
  });
});

describe('calculateTieredCost', () => {
  const tiers = [
    { from: 0,     to: 1000,  unitPrice: 100, flatFee: 0 },
    { from: 1001,  to: 5000,  unitPrice: 75,  flatFee: 0 },
    { from: 5001,  to: null,  unitPrice: 50,  flatFee: 0 },
  ];

  it('should calculate cost within first tier', () => {
    const { totalCost } = calculateTieredCost(500, tiers);
    expect(totalCost).toBe(50000); // 500 × 100
  });

  it('should calculate cost spanning multiple tiers', () => {
    const { totalCost } = calculateTieredCost(3000, tiers);
    // Tier 1: 1000 × 100 = 100,000
    // Tier 2: 2000 × 75  = 150,000
    expect(totalCost).toBe(250000);
  });

  it('should calculate cost in unbounded tier', () => {
    const { totalCost } = calculateTieredCost(10000, tiers);
    // Tier 1: 1000 × 100 = 100,000
    // Tier 2: 4000 × 75  = 300,000
    // Tier 3: 5000 × 50  = 250,000
    expect(totalCost).toBe(650000);
  });

  it('should subtract included quantity', () => {
    const { totalCost } = calculateTieredCost(1500, tiers, 1000);
    // Billable = 500 → Tier 1: 500 × 100 = 50,000
    expect(totalCost).toBe(50000);
  });

  it('should return zero for usage within included quantity', () => {
    const { totalCost } = calculateTieredCost(800, tiers, 1000);
    expect(totalCost).toBe(0);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestBillingService, createTestCustomer, cleanupTestData } from './test-utils';
import type { BillingService } from './services/billing.service';

describe('Billing Integration Tests', () => {
  let billing: BillingService;
  let customerId: string;
  let planId: string;

  beforeAll(async () => {
    billing = await createTestBillingService();
    const customer = await createTestCustomer(billing);
    customerId = customer.id;

    // Create a test plan
    const plan = await billing.createPlan({
      name: 'Integration Test Plan',
      description: 'Test plan for integration tests',
      slug: `test-plan-${Date.now()}`,
      pricingModel: 'flat_rate',
      basePrice: 2900,
      currency: 'usd',
      billingInterval: 'month',
      trialDays: 0,
      active: true,
      public: false,
    });
    planId = plan.id;
  });

  afterAll(async () => {
    await cleanupTestData(billing, customerId, planId);
  });

  it('should create a subscription and generate an invoice', async () => {
    // Create subscription
    const subscription = await billing.createSubscription({
      customerId,
      planId,
      quantity: 1,
    });

    expect(subscription.status).toBe('active');
    expect(subscription.planId).toBe(planId);
    expect(subscription.stripeSubscriptionId).toBeTruthy();

    // Generate invoice
    const invoice = await billing.generateInvoice(subscription.id);

    expect(invoice.status).toBe('draft');
    expect(invoice.subtotal).toBe(2900);
    expect(invoice.lineItems.length).toBeGreaterThanOrEqual(1);
    expect(invoice.lineItems[0].type).toBe('subscription');

    // Finalize invoice
    const finalized = await billing.finalizeInvoice(invoice.id);
    expect(finalized.status).toBe('open');

    // Collect payment
    const result = await billing.collectPayment(finalized.id);
    expect(result.success).toBe(true);
    expect(result.invoice.status).toBe('paid');

    // Clean up
    await billing.cancelSubscription(subscription.id, { immediately: true });
  });

  it('should handle usage-based billing end to end', async () => {
    // Create a usage-based plan
    const usagePlan = await billing.createPlan({
      name: 'Usage Test Plan',
      description: 'Test plan with usage metering',
      slug: `usage-plan-${Date.now()}`,
      pricingModel: 'hybrid',
      basePrice: 1000, // $10 base
      currency: 'usd',
      billingInterval: 'month',
      usageMeters: ['api_calls'],
      active: true,
      public: false,
    });

    // Create subscription
    const sub = await billing.createSubscription({
      customerId,
      planId: usagePlan.id,
    });

    // Record usage
    await billing.recordUsage({
      subscriptionId: sub.id,
      meterId: 'api_calls',
      quantity: 5000,
      idempotencyKey: `test-${Date.now()}-1`,
    });

    await billing.recordUsage({
      subscriptionId: sub.id,
      meterId: 'api_calls',
      quantity: 3000,
      idempotencyKey: `test-${Date.now()}-2`,
    });

    // Get usage summary
    const summary = await billing.getUsageSummary(
      sub.id,
      'api_calls',
      {
        start: sub.currentPeriodStart,
        end: sub.currentPeriodEnd,
      },
    );

    expect(summary.totalQuantity).toBe(8000);
    expect(summary.eventCount).toBe(2);

    // Generate invoice (should include base + usage)
    const invoice = await billing.generateInvoice(sub.id);
    expect(invoice.lineItems.some(li => li.type === 'subscription')).toBe(true);
    expect(invoice.lineItems.some(li => li.type === 'usage')).toBe(true);
    expect(invoice.subtotal).toBeGreaterThan(1000); // More than just base fee

    // Clean up
    await billing.cancelSubscription(sub.id, { immediately: true });
    await billing.archivePlan(usagePlan.id);
  });

  it('should correctly issue and apply credits', async () => {
    // Issue credit
    const credit = await billing.issueCredit({
      customerId,
      amount: 1500, // $15.00
      currency: 'usd',
      type: 'promotional',
      description: 'Test credit',
    });

    expect(credit.amount).toBe(1500);
    expect(credit.balance).toBe(1500);

    // Check balance
    const balance = await billing.getBalance(customerId);
    expect(balance.balance).toBe(1500);

    // Create subscription and invoice to apply credits
    const sub = await billing.createSubscription({
      customerId,
      planId,
    });

    const invoice = await billing.generateInvoice(sub.id);
    const finalized = await billing.finalizeInvoice(invoice.id);

    // Apply credits
    const applied = await billing.applyCreditsToInvoice(finalized.id);
    expect(applied.amountApplied).toBe(1500);
    expect(applied.remainingDue).toBe(1400); // 2900 - 1500

    // Verify balance updated
    const newBalance = await billing.getBalance(customerId);
    expect(newBalance.balance).toBe(0);

    // Clean up
    await billing.cancelSubscription(sub.id, { immediately: true });
  });
});
```

### Webhook Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createTestBillingService } from './test-utils';
import Stripe from 'stripe';

describe('Stripe Webhook Handling', () => {
  it('should reject invalid webhook signatures', async () => {
    const billing = await createTestBillingService();
    const invalidPayload = Buffer.from('{}');
    const invalidSignature = 'invalid_signature';

    await expect(
      billing.handleStripeWebhook(invalidPayload, invalidSignature),
    ).rejects.toThrow(/signature/i);
  });

  it('should process invoice.paid webhook', async () => {
    const billing = await createTestBillingService();

    // Mock a valid Stripe webhook event
    const event: Stripe.Event = {
      id: 'evt_test_123',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_test_123',
          subscription: 'sub_test_123',
          customer: 'cus_test_123',
          status: 'paid',
          amount_paid: 2900,
          currency: 'usd',
        } as unknown as Stripe.Invoice,
      },
    } as Stripe.Event;

    // The service verifies the signature internally
    // For testing, we mock the Stripe constructEvent
    const mockStripe = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
    };

    // Process the webhook
    // In real tests, use Stripe CLI: stripe trigger invoice.paid
    // The handler should:
    // 1. Update local invoice status to 'paid'
    // 2. Update subscription period dates
    // 3. Resolve any active dunning state
    // 4. Create revenue recognition schedule entries
    // 5. Emit billing.invoice.paid event
  });

  it('should handle duplicate webhook events idempotently', async () => {
    const billing = await createTestBillingService();

    // Processing the same event twice should not cause errors
    // or duplicate side effects (idempotent handling)
    const eventId = 'evt_test_duplicate_456';

    // First processing succeeds
    // Second processing should be a no-op
    // Idempotency is enforced via event ID deduplication
  });
});
```

### E2E Test: Full Billing Cycle

```typescript
import { describe, it, expect } from 'vitest';
import { createTestBillingService, createTestCustomer } from './test-utils';

describe('Full Billing Cycle E2E', () => {
  it('should complete a full subscription → invoice → payment cycle', async () => {
    const billing = await createTestBillingService();
    const customer = await createTestCustomer(billing);

    // 1. Create a plan
    const plan = await billing.createPlan({
      name: 'E2E Test Pro',
      description: 'E2E test plan',
      slug: `e2e-pro-${Date.now()}`,
      pricingModel: 'hybrid',
      basePrice: 4900, // $49.00
      currency: 'usd',
      billingInterval: 'month',
      trialDays: 7,
      usageMeters: ['api_calls'],
      features: [
        { key: 'api_calls', label: 'API Calls', value: '50000', highlighted: true },
        { key: 'support', label: 'Support', value: 'priority', highlighted: false },
      ],
      active: true,
      public: true,
    });

    // 2. Subscribe customer with trial
    const subscription = await billing.createSubscription({
      customerId: customer.id,
      planId: plan.id,
      trialDays: 7,
    });
    expect(subscription.status).toBe('trialing');

    // 3. Simulate trial ending (in real system, Stripe webhook handles this)
    // ... trial converts to active ...

    // 4. Record usage during the billing period
    await billing.recordUsage({
      subscriptionId: subscription.id,
      meterId: 'api_calls',
      quantity: 75000, // Over the 50K included
      idempotencyKey: `e2e-usage-${Date.now()}`,
    });

    // 5. Generate invoice at period end
    const invoice = await billing.generateInvoice(subscription.id);
    expect(invoice.lineItems.length).toBeGreaterThanOrEqual(2); // Base + usage overage

    // 6. Finalize and collect
    const finalized = await billing.finalizeInvoice(invoice.id);
    const payment = await billing.collectPayment(finalized.id);
    expect(payment.success).toBe(true);

    // 7. Verify revenue schedule was created
    const schedule = await billing.getRevenueSchedule(invoice.id);
    expect(schedule.entries.length).toBeGreaterThan(0);

    // 8. Clean up
    await billing.cancelSubscription(subscription.id, { immediately: true });
    await billing.archivePlan(plan.id);
  });
});
```

### Test Utilities

```typescript
// test-utils.ts
import { BillingService } from './services/billing.service';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function createTestBillingService(): Promise<BillingService> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia' as any,
  });

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  return new BillingService({
    stripe,
    supabase,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    defaultCurrency: 'usd',
    autoTax: false, // Disable tax in tests
    dunning: {
      maxRetries: 3,
      retrySchedule: [1, 3, 7],
      notifyOnFailure: false, // No emails in tests
      cancelOnExhaustion: true,
      gracePeriodDays: 14,
    },
    revenueRecognition: {
      enabled: true,
      defaultMethod: 'over_time',
    },
  });
}

export async function createTestCustomer(billing: BillingService) {
  // Creates a Stripe test customer and local record
  return billing.createCustomer({
    email: `test-${Date.now()}@example.com`,
    name: 'Test Customer',
    metadata: { test: 'true' },
  });
}

export async function cleanupTestData(
  billing: BillingService,
  customerId: string,
  planId: string,
) {
  // Cancel any active subscriptions
  const subs = await billing.listSubscriptions({
    customerId,
    status: 'active',
  });

  for (const sub of subs.items) {
    await billing.cancelSubscription(sub.id, { immediately: true });
  }

  // Archive test plan
  try {
    await billing.archivePlan(planId);
  } catch {
    // Plan may already be archived
  }
}
```

---

## Domain Events

The billing module publishes the following events via the `@mcv/events` bus:

| Event | Payload | Trigger |
|-------|---------|---------|
| `billing.subscription.created` | `{ subscriptionId, customerId, planId, status }` | New subscription created |
| `billing.subscription.updated` | `{ subscriptionId, changes }` | Subscription modified (plan change, quantity, etc.) |
| `billing.subscription.canceled` | `{ subscriptionId, reason, immediately }` | Subscription canceled |
| `billing.subscription.paused` | `{ subscriptionId, resumeAt }` | Subscription paused |
| `billing.subscription.resumed` | `{ subscriptionId }` | Subscription resumed from pause |
| `billing.subscription.trial_ending` | `{ subscriptionId, trialEnd }` | Trial ending in 3 days |
| `billing.invoice.generated` | `{ invoiceId, subscriptionId, total, currency }` | Invoice created |
| `billing.invoice.finalized` | `{ invoiceId, amountDue }` | Invoice finalized and ready for payment |
| `billing.invoice.paid` | `{ invoiceId, amountPaid, paymentMethodId }` | Invoice fully paid |
| `billing.invoice.voided` | `{ invoiceId, reason }` | Invoice voided |
| `billing.payment.succeeded` | `{ invoiceId, amount, paymentMethodId }` | Payment collection succeeded |
| `billing.payment.failed` | `{ invoiceId, amount, failureCode, attemptNumber }` | Payment collection failed |
| `billing.dunning.started` | `{ subscriptionId, invoiceId }` | Dunning workflow initiated |
| `billing.dunning.resolved` | `{ subscriptionId, invoiceId, resolution }` | Dunning workflow resolved |
| `billing.usage.threshold` | `{ subscriptionId, meterId, quantity, threshold }` | Usage exceeded configured threshold |
| `billing.credit.issued` | `{ customerId, amount, type }` | Credit issued to customer |
| `billing.credit.applied` | `{ customerId, invoiceId, amount }` | Credit applied to invoice |
| `billing.revenue.recognized` | `{ period, totalRecognized, entriesCount }` | Revenue recognized for period |

---

## Cron Jobs

| Schedule | Job | Description |
|----------|-----|-------------|
| `0 * * * *` | `billing:cycle-check` | Check for subscriptions with ended billing periods; trigger invoice generation |
| `*/15 * * * *` | `billing:dunning-retry` | Process pending dunning retries that are due |
| `0 0 * * *` | `billing:trial-expiry` | Convert expired trials to active subscriptions or cancel |
| `0 1 * * *` | `billing:credit-expiry` | Expire credits past their expiration date |
| `0 2 * * *` | `billing:exchange-rates` | Refresh exchange rates from configured provider |
| `0 3 1 * *` | `billing:revenue-recognition` | Run monthly revenue recognition batch |
| `*/15 * * * *` | `billing:usage-summary` | Refresh the `usage_summary_mv` materialized view |
| `0 6 * * 1` | `billing:subscription-health` | Weekly check for subscriptions in inconsistent states |

---

## Glossary

| Term | Definition |
|------|------------|
| **Billing Period** | The time span between invoice generation dates (e.g., Jan 1 – Jan 31) |
| **Proration** | Adjusting charges proportionally when a subscription changes mid-period |
| **Dunning** | The process of retrying failed payments and notifying customers |
| **Metered Billing** | Charging based on actual usage (API calls, storage, etc.) rather than flat fees |
| **Tiered Pricing** | Graduated pricing where different usage brackets have different per-unit rates |
| **Volume Pricing** | All units priced at the rate of the tier that matches total usage volume |
| **ASC 606** | Accounting standard for revenue recognition from contracts with customers |
| **Deferred Revenue** | Payment received for services not yet delivered (recognized over time) |
| **Settlement Currency** | The currency in which funds are deposited into your bank account |
| **Idempotency Key** | A unique identifier ensuring the same operation isn't processed twice |
| **Payment Intent** | Stripe's representation of a payment attempt (may require 3DS confirmation) |
| **Connected Account** | A Stripe account linked via Stripe Connect for platform marketplace billing |

---

*Last updated: 2025-02-08*
*Module version: 1.0.0*
*Maintainer: @mcv/finance team*