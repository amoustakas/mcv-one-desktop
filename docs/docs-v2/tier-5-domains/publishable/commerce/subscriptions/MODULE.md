# @mcv/commerce/subscriptions

> Recurring subscription management for the MCV.ONE commerce platform — plan lifecycle, billing cycles, usage metering, entitlements, and subscriber state machine orchestration.

**Package:** `@mcv/commerce/subscriptions`
**Layer:** Tier 5 — Domain Module
**Parent:** `@mcv/commerce`
**Since:** 0.12.0
**Status:** Stable
**Maintainer:** MCV Platform Team

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Subscription State Machine](#subscription-state-machine)
  - [Billing Cycle Flow](#billing-cycle-flow)
  - [System Architecture Overview](#system-architecture-overview)
- [Core Interfaces](#core-interfaces)
  - [SubscriptionPlan](#subscriptionplan)
  - [Subscription](#subscription)
  - [SubscriptionItem](#subscriptionitem)
  - [BillingCycle](#billingcycle)
  - [UsageRecord](#usagerecord)
  - [PlanChange](#planchange)
  - [CancellationRequest](#cancellationrequest)
  - [Entitlement](#entitlement)
  - [DunningAttempt](#dunningattempt)
  - [SubscriptionEvent](#subscriptionevent)
  - [SubscriptionService](#subscriptionservice)
  - [EntitlementService](#entitlementservice)
  - [BillingService](#billingservice)
  - [UsageService](#usageservice)
  - [AnalyticsService](#analyticsservice)
- [Database Schemas](#database-schemas)
  - [subscription_plans](#subscription_plans)
  - [subscriptions](#subscriptions)
  - [subscription_items](#subscription_items)
  - [billing_cycles](#billing_cycles)
  - [usage_records](#usage_records)
  - [plan_changes](#plan_changes)
  - [cancellations](#cancellations)
  - [subscription_events](#subscription_events)
  - [entitlements](#entitlements)
  - [dunning_attempts](#dunning_attempts)
- [Code Examples](#code-examples)
  - [Example 1 — Creating a Subscription Plan](#example-1--creating-a-subscription-plan)
  - [Example 2 — Subscribing a Customer](#example-2--subscribing-a-customer)
  - [Example 3 — Upgrading a Subscription Mid-Cycle](#example-3--upgrading-a-subscription-mid-cycle)
  - [Example 4 — Recording and Billing Metered Usage](#example-4--recording-and-billing-metered-usage)
  - [Example 5 — Handling Dunning and Failed Payments](#example-5--handling-dunning-and-failed-payments)
  - [Example 6 — Cancellation with Win-Back Offer](#example-6--cancellation-with-win-back-offer)
  - [Example 7 — Pause and Resume a Subscription](#example-7--pause-and-resume-a-subscription)
  - [Example 8 — Checking Entitlements at Runtime](#example-8--checking-entitlements-at-runtime)
- [Error Codes](#error-codes)
- [Security](#security)
  - [Multi-Tenant Isolation](#multi-tenant-isolation)
  - [Payment Data Security](#payment-data-security)
  - [Authorization Model](#authorization-model)
  - [Audit Trail](#audit-trail)
  - [Rate Limiting](#rate-limiting)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [End-to-End Tests](#end-to-end-tests)
  - [Test Utilities](#test-utilities)

---

## Purpose

The `@mcv/commerce/subscriptions` module is the backbone of recurring revenue for MCV.ONE-powered applications. It provides a complete, production-grade subscription management system that handles the full lifecycle of a recurring billing relationship — from initial plan creation, through trial periods and active billing, to cancellation, win-back, and expiration.

### What This Module Solves

Subscription billing is deceptively complex. A naive implementation handles the happy path (customer signs up, gets charged monthly, cancels). Production reality is far messier:

- A customer upgrades mid-cycle and expects a prorated charge.
- A payment fails, requiring intelligent retry logic across multiple days.
- A subscriber pauses for two months during summer vacation.
- Usage-based billing must reconcile metered units at cycle end.
- A plan change from monthly to annual billing requires careful date arithmetic.
- Multi-tenant isolation demands every query be scoped to the correct organization.
- Finance needs real-time MRR/ARR calculations that account for discounts, trials, and expansion.

This module solves all of these and more, providing:

1. **Declarative Plan Modeling** — Define plans with complex pricing structures (flat-rate, per-seat, tiered, metered, hybrid) using a composable configuration schema. Plans support trial periods, setup fees, billing anchors, and custom metadata.

2. **Robust State Machine** — Every subscription follows a well-defined state machine (`trialing → active → paused → past_due → canceled → expired`) with guard conditions, transition hooks, and audit logging for every state change.

3. **Automated Billing Orchestration** — The billing engine handles cycle generation, invoice creation, charge scheduling, proration calculation, and payment processing. It integrates with Stripe Billing while maintaining an authoritative local ledger.

4. **Usage-Based Billing** — First-class support for metered and usage-based pricing models. Track consumption in real-time, apply tiered pricing, handle overage charges, and reconcile usage at cycle boundaries.

5. **Intelligent Dunning** — When payments fail, the smart retry system uses configurable retry schedules with exponential backoff, payment method fallback, customer notifications, and graceful degradation before involuntary churn.

6. **Entitlement Engine** — Map plan features to runtime entitlements. Check feature flags, enforce API rate limits, validate storage quotas, and gate seat counts — all derived from the subscriber's active plan.

7. **Comprehensive Analytics** — Calculate MRR, ARR, churn rate, LTV, trial conversion rate, expansion/contraction revenue, and cohort analysis. These metrics power dashboards, investor reports, and growth optimization.

8. **Stripe Billing Sync** — Bidirectional synchronization with Stripe Billing ensures that local state and Stripe state remain consistent. Webhooks from Stripe are processed idempotently, and local mutations are pushed to Stripe in real-time.

### Design Principles

- **Local-first, Stripe-second**: The local database is the source of truth. Stripe is a payment processor, not a subscription database. This allows offline plan modeling, complex business rules, and multi-provider support.
- **Event-sourced transitions**: Every state change emits a domain event (`subscription.created`, `subscription.renewed`, `billing_cycle.charged`, etc.) that downstream systems can consume for analytics, notifications, and integrations.
- **Tenant isolation by default**: All queries are scoped by `tenant_id` via Supabase Row-Level Security (RLS). There is no way to accidentally query across tenants.
- **Idempotent operations**: Every mutation (charge, refund, plan change) carries an idempotency key. Retries are safe. Duplicate webhook deliveries are harmless.
- **Composable pricing**: Plans are built from pricing components (base price, per-seat, metered tiers, add-ons) that compose cleanly rather than relying on a single monolithic price field.

---

## Exports

```typescript
// === Core Services ===
export { SubscriptionService } from './services/subscription.service';
export { BillingService } from './services/billing.service';
export { EntitlementService } from './services/entitlement.service';
export { UsageService } from './services/usage.service';
export { DunningService } from './services/dunning.service';
export { AnalyticsService } from './services/analytics.service';
export { PlanService } from './services/plan.service';
export { PlanChangeService } from './services/plan-change.service';
export { CancellationService } from './services/cancellation.service';
export { PauseResumeService } from './services/pause-resume.service';
export { WebhookService } from './services/webhook.service';
export { InvoiceService } from './services/invoice.service';

// === tRPC Router ===
export { subscriptionsRouter } from './router';
export type { SubscriptionsRouter } from './router';

// === Core Types ===
export type {
  Subscription,
  SubscriptionStatus,
  SubscriptionPlan,
  SubscriptionItem,
  SubscriptionEvent,
  SubscriptionMetadata,
} from './types/subscription.types';

export type {
  BillingCycle,
  BillingCycleStatus,
  BillingInterval,
  BillingAnchor,
  ProrationBehavior,
} from './types/billing.types';

export type {
  UsageRecord,
  UsageAggregation,
  UsageTier,
  MeteringMode,
} from './types/usage.types';

export type {
  PlanChange,
  PlanChangeType,
  PlanChangeMode,
  PlanChangeTiming,
} from './types/plan-change.types';

export type {
  CancellationRequest,
  CancellationReason,
  CancellationTiming,
  WinBackOffer,
} from './types/cancellation.types';

export type {
  Entitlement,
  EntitlementCheck,
  EntitlementOverride,
  FeatureFlag,
  RateLimit,
  StorageQuota,
  SeatLimit,
} from './types/entitlement.types';

export type {
  DunningAttempt,
  DunningSchedule,
  DunningOutcome,
  RetryStrategy,
} from './types/dunning.types';

export type {
  SubscriptionAnalytics,
  MRRBreakdown,
  ChurnMetrics,
  CohortAnalysis,
  LTVCalculation,
  TrialConversion,
  RevenueMetrics,
} from './types/analytics.types';

// === Pricing Types ===
export type {
  PricingModel,
  FlatRatePricing,
  PerSeatPricing,
  TieredPricing,
  MeteredPricing,
  HybridPricing,
  PricingTier,
  PricingComponent,
} from './types/pricing.types';

// === Schemas (Drizzle) ===
export {
  subscriptionPlans,
  subscriptions,
  subscriptionItems,
  billingCycles,
  usageRecords,
  planChanges,
  cancellations,
  subscriptionEvents,
  entitlements,
  dunningAttempts,
} from './schema';

// === Validators (Zod) ===
export {
  createPlanSchema,
  updatePlanSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
  changePlanSchema,
  cancelSubscriptionSchema,
  pauseSubscriptionSchema,
  resumeSubscriptionSchema,
  recordUsageSchema,
  checkEntitlementSchema,
} from './validators';

// === Constants ===
export {
  SUBSCRIPTION_STATUSES,
  BILLING_INTERVALS,
  PRORATION_BEHAVIORS,
  CANCELLATION_REASONS,
  DUNNING_STRATEGIES,
  SUBSCRIPTION_EVENTS,
  DEFAULT_TRIAL_DAYS,
  MAX_DUNNING_ATTEMPTS,
  DEFAULT_GRACE_PERIOD_DAYS,
} from './constants';

// === Errors ===
export {
  SubscriptionError,
  PlanNotFoundError,
  SubscriptionNotFoundError,
  InvalidStateTransitionError,
  BillingCycleError,
  PaymentFailedError,
  EntitlementExceededError,
  UsageRecordError,
  PlanChangeError,
  DunningExhaustedError,
  SubscriptionAlreadyCanceledError,
  SubscriptionAlreadyPausedError,
  InvalidPlanConfigurationError,
  TrialExpiredError,
  ProrationCalculationError,
  SeatLimitExceededError,
  QuotaExceededError,
  RateLimitExceededError,
  CancellationWindowExpiredError,
  InvoiceGenerationError,
  WebhookProcessingError,
  StripeSubscriptionSyncError,
} from './errors';

// === Utilities ===
export {
  calculateProration,
  calculateMRR,
  calculateARR,
  calculateLTV,
  calculateChurnRate,
  generateBillingCycleDates,
  resolveEntitlements,
  buildPricingBreakdown,
  formatSubscriptionPeriod,
  isTrialActive,
  isGracePeriodActive,
  getNextBillingDate,
} from './utils';

// === Hooks ===
export {
  useSubscription,
  useSubscriptionPlan,
  useSubscriptionPlans,
  useEntitlements,
  useEntitlementCheck,
  useUsageMetrics,
  useSubscriptionAnalytics,
  useBillingHistory,
} from './hooks';
```

---

## Architecture

### Subscription State Machine

The subscription lifecycle is modeled as a finite state machine with well-defined transitions, guard conditions, and side effects. Every transition is logged as a `SubscriptionEvent` for audit and analytics.

```
                          ┌─────────────────────────────────────────┐
                          │                                         │
                          ▼                                         │
┌──────────┐  trial    ┌──────────┐  activate   ┌──────────┐       │
│          │  starts   │          │  (payment   │          │       │
│ CREATED  │─────────▶ │ TRIALING │  success or │  ACTIVE  │◀──────┘
│          │           │          │  trial end) │          │  resume
└──────────┘           └──────────┘             └──────────┘
     │                      │                     │  │  │
     │                      │                     │  │  │
     │  immediate           │  trial              │  │  │ payment
     │  activation          │  expired            │  │  │ fails
     │  (no trial)          │  (no payment)       │  │  │
     │                      │                     │  │  ▼
     │                      │                     │  │ ┌──────────┐
     │                      │                     │  │ │          │
     │                      │                     │  │ │ PAST_DUE │
     │                      │                     │  │ │          │
     │                      │                     │  │ └──────────┘
     │                      │                     │  │      │
     │                      │                     │  │      │ payment
     │                      │                     │  │      │ recovered
     │                      │                     │  │      │ ────────▶ ACTIVE
     │                      │                     │  │      │
     │                      │                     │  │      │ dunning
     │                      │                     │  │      │ exhausted
     │                      │                     │  │      │
     │                      │                     │  │      ▼
     │                      ▼                     │  │  ┌──────────┐
     │                  ┌──────────┐              │  │  │          │
     │                  │          │              │  └─▶│ CANCELED │
     └─────────────────▶│ EXPIRED  │◀─────────────┘    │          │
       (creation fail)  │          │  cancel            └──────────┘
                        └──────────┘  (immediate)            │
                             ▲                               │
                             │                               │ grace
                             │  pause                        │ period
                             │  expired                      │ ends
                             │                               │
                        ┌──────────┐                         ▼
                        │          │                    ┌──────────┐
                        │  PAUSED  │◀───── pause ──────│          │
                        │          │                    │ EXPIRED  │
                        └──────────┘                    │          │
                             │                          └──────────┘
                             │ resume
                             │
                             ▼
                          ACTIVE
```

#### State Definitions

| State | Description | Billing | Access | Transitions To |
|-------|-------------|---------|--------|----------------|
| `trialing` | Customer is in a free trial period. No charges until trial ends. | Suspended | Full | `active`, `canceled`, `expired` |
| `active` | Subscription is active and billing normally. The happy path. | Active | Full | `paused`, `past_due`, `canceled` |
| `paused` | Subscriber or admin has paused the subscription. Billing and (optionally) access are suspended. | Suspended | Configurable | `active`, `canceled`, `expired` |
| `past_due` | A payment attempt has failed. Dunning is in progress. | Retrying | Configurable (grace period) | `active`, `canceled` |
| `canceled` | Subscription has been canceled. May still have access until period end. | Stopped | Until period end | `expired`, `active` (reactivation) |
| `expired` | Subscription has fully ended. No billing, no access. Terminal state. | None | None | `active` (re-subscribe only) |

#### Transition Guards

Every state transition is protected by guard conditions that prevent invalid operations:

```typescript
interface TransitionGuard {
  from: SubscriptionStatus;
  to: SubscriptionStatus;
  guard: (subscription: Subscription, context: TransitionContext) => boolean;
  sideEffects: TransitionSideEffect[];
}

const TRANSITION_GUARDS: TransitionGuard[] = [
  {
    from: 'trialing',
    to: 'active',
    guard: (sub, ctx) => {
      // Trial must have ended OR payment method must be on file
      return ctx.trialEnded || ctx.hasPaymentMethod;
    },
    sideEffects: ['createFirstBillingCycle', 'chargeSetupFee', 'emitActivatedEvent'],
  },
  {
    from: 'active',
    to: 'paused',
    guard: (sub, ctx) => {
      // Plan must allow pausing, and no pending charges
      return sub.plan.allowPause && !ctx.hasPendingCharges;
    },
    sideEffects: ['suspendBilling', 'emitPausedEvent', 'scheduleAutoResume'],
  },
  {
    from: 'active',
    to: 'past_due',
    guard: (sub, ctx) => {
      // Only transition on actual payment failure
      return ctx.paymentFailed === true;
    },
    sideEffects: ['initiateDunning', 'notifyCustomer', 'emitPastDueEvent'],
  },
  {
    from: 'past_due',
    to: 'active',
    guard: (sub, ctx) => {
      // Payment must be recovered
      return ctx.paymentRecovered === true;
    },
    sideEffects: ['clearDunning', 'resetGracePeriod', 'emitRecoveredEvent'],
  },
  {
    from: 'past_due',
    to: 'canceled',
    guard: (sub, ctx) => {
      // Dunning must be exhausted OR manual cancellation
      return ctx.dunningExhausted || ctx.manualCancellation;
    },
    sideEffects: ['finalizeCharges', 'emitCanceledEvent', 'scheduleExpiration'],
  },
  {
    from: 'canceled',
    to: 'active',
    guard: (sub, ctx) => {
      // Reactivation within grace period with valid payment
      return ctx.withinGracePeriod && ctx.hasPaymentMethod;
    },
    sideEffects: ['reactivateBilling', 'emitReactivatedEvent'],
  },
  // ... additional guards omitted for brevity
];
```

### Billing Cycle Flow

The billing cycle engine manages the creation, processing, and reconciliation of billing periods. It supports both anniversary billing (cycle starts on subscription creation date) and calendar billing (cycle aligns to calendar boundaries).

```
┌─────────────────────────────────────────────────────────────────────┐
│                      BILLING CYCLE FLOW                             │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │  PENDING  │───▶│ INVOICED │───▶│ CHARGING │───▶│   PAID   │     │
│  │          │    │          │    │          │    │          │     │
│  │ Cycle    │    │ Invoice  │    │ Payment  │    │ Success  │     │
│  │ created  │    │ generated│    │ attempted│    │ recorded │     │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘     │
│       │                               │               │            │
│       │                               │               │            │
│       │                               ▼               ▼            │
│       │                          ┌──────────┐   ┌──────────┐      │
│       │                          │  FAILED  │   │  NEXT    │      │
│       │                          │          │   │  CYCLE   │      │
│       │                          │ Payment  │   │  created │      │
│       │                          │ failed   │   │          │      │
│       │                          └──────────┘   └──────────┘      │
│       │                               │                            │
│       │                               ▼                            │
│       │                          ┌──────────┐                      │
│       │                          │ RETRYING │                      │
│       │                          │          │──────▶ PAID           │
│       │                          │ Smart    │       (if recovered)  │
│       │                          │ retry    │                      │
│       │                          └──────────┘                      │
│       │                               │                            │
│       │                               ▼                            │
│       │                          ┌──────────┐                      │
│       ▼                          │ DUNNING  │                      │
│  ┌──────────┐                    │ EXHAUSTED│                      │
│  │  VOID    │                    │          │──────▶ CANCELED       │
│  │          │                    │ All retry│       (involuntary)   │
│  │ Cycle    │                    │ attempts │                      │
│  │ voided   │                    │ failed   │                      │
│  └──────────┘                    └──────────┘                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Billing Cycle Lifecycle

1. **PENDING** — A new billing cycle is created at the start of each period. Usage meters are reset. The cycle knows its start date, end date, and due date.

2. **INVOICED** — At the billing date (typically a few days before the due date), the system generates an invoice. For metered plans, usage is aggregated and priced. For flat-rate plans, the recurring charge is applied. Proration adjustments from mid-cycle changes are included.

3. **CHARGING** — The system attempts to charge the customer's default payment method via Stripe. This is an atomic operation with an idempotency key.

4. **PAID** — Payment succeeded. A receipt is generated, the `subscription_events` table is updated, and the next billing cycle is scheduled.

5. **FAILED** — Payment failed. The system transitions to the smart retry flow, which selects optimal retry times based on the failure reason, day of week, and historical patterns.

6. **VOID** — The cycle was voided (e.g., subscription canceled before billing, or administrative correction). No charge is attempted.

#### Proration Engine

When a subscriber changes plans mid-cycle, the proration engine calculates the credit/debit:

```typescript
interface ProrationCalculation {
  /** Days remaining in current cycle */
  remainingDays: number;
  /** Total days in current cycle */
  totalDays: number;
  /** Credit for unused time on old plan */
  creditAmount: number;
  /** Charge for remaining time on new plan */
  debitAmount: number;
  /** Net amount (positive = charge, negative = credit) */
  netAmount: number;
  /** Applied to next invoice or charged immediately */
  applicationMode: 'immediate' | 'next_invoice';
  /** Detailed line items */
  lineItems: ProrationLineItem[];
}

type ProrationBehavior =
  | 'create_prorations'        // Default: calculate and apply prorations
  | 'always_invoice'           // Create prorations and invoice immediately
  | 'none'                     // No proration; new price starts next cycle
  ;
```

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │  React Hooks │  │  Admin Panel │  │  Customer Portal          │  │
│  │  useSubscr.. │  │  Plan Config │  │  Self-Service Billing     │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────┬──────────────┘  │
│         │                │                        │                 │
└─────────┼────────────────┼────────────────────────┼─────────────────┘
          │                │                        │
          ▼                ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         tRPC ROUTER                                 │
│                                                                     │
│  subscriptions.create    subscriptions.changePlan                   │
│  subscriptions.cancel    subscriptions.pause                        │
│  subscriptions.resume    subscriptions.getById                      │
│  plans.create            plans.update                               │
│  plans.list              plans.archive                              │
│  billing.getCycles       billing.getInvoices                        │
│  usage.record            usage.getMetrics                           │
│  entitlements.check      entitlements.list                          │
│  analytics.mrr           analytics.churn                            │
│                                                                     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVICE LAYER                                 │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ SubscriptionSvc  │  │ BillingService│  │  EntitlementService   │ │
│  │ - create()       │  │ - charge()    │  │  - check()            │ │
│  │ - changePlan()   │  │ - prorate()   │  │  - resolve()          │ │
│  │ - cancel()       │  │ - retry()     │  │  - enforce()          │ │
│  │ - pause/resume() │  │ - invoice()   │  │  - override()         │ │
│  └────────┬─────────┘  └──────┬───────┘  └───────────┬───────────┘ │
│           │                   │                       │             │
│  ┌────────┴─────────┐  ┌─────┴────────┐  ┌──────────┴──────────┐  │
│  │ PlanChangeService│  │DunningService │  │  UsageService       │  │
│  │ - upgrade()      │  │ - schedule()  │  │  - record()         │  │
│  │ - downgrade()    │  │ - retry()     │  │  - aggregate()      │  │
│  │ - addOn()        │  │ - escalate()  │  │  - tier()           │  │
│  │ - quantity()     │  │ - recover()   │  │  - overage()        │  │
│  └──────────────────┘  └──────────────┘  └─────────────────────┘  │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │CancellationSvc   │  │AnalyticsSvc  │  │  WebhookService      │ │
│  │ - initiate()     │  │ - mrr()      │  │  - process()         │ │
│  │ - winBack()      │  │ - churn()    │  │  - verify()          │ │
│  │ - survey()       │  │ - ltv()      │  │  - dispatch()        │ │
│  │ - finalize()     │  │ - cohort()   │  │  - replay()          │ │
│  └──────────────────┘  └──────────────┘  └───────────────────────┘ │
│                                                                     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA & INTEGRATION LAYER                       │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Supabase        │  │ Stripe       │  │  Event Bus            │ │
│  │  PostgreSQL      │  │ Billing API  │  │  (@mcv/events)        │ │
│  │  (Drizzle ORM)   │  │ Webhooks     │  │                       │ │
│  │  RLS Policies    │  │ PaymentIntents│ │  subscription.created  │ │
│  │                  │  │ Subscriptions│  │  subscription.renewed  │ │
│  │  10 tables       │  │ Invoices     │  │  payment.failed       │ │
│  │  w/ tenant_id    │  │ Customers    │  │  entitlement.changed  │ │
│  └──────────────────┘  └──────────────┘  └───────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### SubscriptionPlan

Defines a subscription offering with its pricing, features, and configuration.

```typescript
/**
 * A subscription plan defines the terms, pricing, and entitlements
 * for a recurring billing product.
 */
interface SubscriptionPlan {
  /** Unique plan identifier (UUID) */
  id: string;

  /** Tenant that owns this plan */
  tenantId: string;

  /** Human-readable plan name (e.g., "Pro", "Enterprise") */
  name: string;

  /** URL-safe slug for the plan (e.g., "pro-monthly") */
  slug: string;

  /** Plan description for customer-facing UI */
  description: string | null;

  /** Billing interval */
  interval: BillingInterval;

  /** Number of intervals between billings (e.g., 3 for quarterly) */
  intervalCount: number;

  /** Pricing model configuration */
  pricing: PricingModel;

  /** Currency code (ISO 4217) */
  currency: string;

  /** Trial period in days (0 = no trial) */
  trialPeriodDays: number;

  /** One-time setup fee in smallest currency unit (cents) */
  setupFee: number;

  /** Whether this plan is currently available for new subscriptions */
  isActive: boolean;

  /** Whether this plan is visible in public pricing pages */
  isPublic: boolean;

  /** Whether subscribers can pause this plan */
  allowPause: boolean;

  /** Maximum pause duration in days (null = unlimited) */
  maxPauseDurationDays: number | null;

  /** Billing anchor configuration */
  billingAnchor: BillingAnchor;

  /** Entitlements included with this plan */
  entitlements: PlanEntitlement[];

  /** Add-ons available for this plan */
  availableAddOns: string[];

  /** Metadata for custom business logic */
  metadata: Record<string, unknown>;

  /** Stripe Price ID for sync */
  stripePriceId: string | null;

  /** Stripe Product ID for sync */
  stripeProductId: string | null;

  /** Sort order for display */
  sortOrder: number;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

/** Billing interval options */
type BillingInterval = 'day' | 'week' | 'month' | 'year';

/** How billing dates are anchored */
interface BillingAnchor {
  /** Anchor type */
  type: 'anniversary' | 'calendar';
  /** For calendar anchoring: day of month (1-28) */
  dayOfMonth?: number;
  /** For calendar anchoring: month of year (1-12) for annual plans */
  monthOfYear?: number;
}

/** Entitlement included with a plan */
interface PlanEntitlement {
  /** Feature key (e.g., "api_requests", "storage_gb", "seats") */
  featureKey: string;
  /** Entitlement type */
  type: 'boolean' | 'numeric' | 'tiered';
  /** Value (true/false for boolean, limit for numeric) */
  value: boolean | number;
  /** Soft limit (warning) vs hard limit (block) */
  enforcement: 'soft' | 'hard';
  /** Reset interval for metered features */
  resetInterval?: BillingInterval;
}
```

### PricingModel

Flexible pricing configuration supporting multiple models:

```typescript
/**
 * Union type for all supported pricing models.
 * Plans can use one or combine multiple models (hybrid).
 */
type PricingModel =
  | FlatRatePricing
  | PerSeatPricing
  | TieredPricing
  | MeteredPricing
  | HybridPricing;

/** Simple flat-rate pricing: fixed amount per billing cycle */
interface FlatRatePricing {
  model: 'flat_rate';
  /** Amount in smallest currency unit (e.g., cents) */
  amount: number;
}

/** Per-seat pricing: amount × number of seats */
interface PerSeatPricing {
  model: 'per_seat';
  /** Amount per seat per billing cycle */
  amountPerSeat: number;
  /** Minimum seats required */
  minSeats: number;
  /** Maximum seats allowed (null = unlimited) */
  maxSeats: number | null;
  /** Whether to include fractional seat billing */
  allowFractional: boolean;
}

/** Tiered pricing: different rates at different volume levels */
interface TieredPricing {
  model: 'tiered';
  /** Tiering mode */
  tierMode: 'graduated' | 'volume';
  /** Price tiers */
  tiers: PricingTier[];
}

/** A single pricing tier */
interface PricingTier {
  /** Inclusive upper bound of this tier (null = unlimited) */
  upTo: number | null;
  /** Flat fee for this tier */
  flatAmount: number;
  /** Per-unit amount for this tier */
  unitAmount: number;
}

/** Metered/usage-based pricing */
interface MeteredPricing {
  model: 'metered';
  /** Usage metric key */
  metricKey: string;
  /** How usage is aggregated per cycle */
  aggregation: UsageAggregation;
  /** Pricing tiers for usage */
  tiers: PricingTier[];
  /** Prepaid units included (0 = pure pay-as-you-go) */
  includedUnits: number;
  /** Overage pricing per unit beyond included */
  overageUnitAmount: number;
}

/** Hybrid pricing: base fee + usage/seat components */
interface HybridPricing {
  model: 'hybrid';
  /** Components that make up the total price */
  components: PricingComponent[];
}

interface PricingComponent {
  /** Component identifier */
  key: string;
  /** Display name */
  name: string;
  /** Component pricing model */
  pricing: FlatRatePricing | PerSeatPricing | TieredPricing | MeteredPricing;
}

type UsageAggregation = 'sum' | 'max' | 'last' | 'average';
```

### Subscription

A customer's active subscription instance:

```typescript
/**
 * Represents a single subscription — the relationship between
 * a customer and a plan over time.
 */
interface Subscription {
  /** Unique subscription identifier (UUID) */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** Customer who owns this subscription */
  customerId: string;

  /** Organization (for B2B multi-seat plans) */
  organizationId: string | null;

  /** The plan this subscription is based on */
  planId: string;

  /** Resolved plan object (joined) */
  plan?: SubscriptionPlan;

  /** Current subscription status */
  status: SubscriptionStatus;

  /** Subscription items (line items / components) */
  items: SubscriptionItem[];

  /** Quantity (for per-seat or quantity-based plans) */
  quantity: number;

  /** Current billing cycle */
  currentCycleId: string | null;

  /** When the current period started */
  currentPeriodStart: Date;

  /** When the current period ends */
  currentPeriodEnd: Date;

  /** When the subscription was created */
  createdAt: Date;

  /** When the subscription was activated (trial end or immediate) */
  activatedAt: Date | null;

  /** When the trial ends (null if no trial) */
  trialEndsAt: Date | null;

  /** When the subscription was canceled */
  canceledAt: Date | null;

  /** When access ends after cancellation */
  cancelAtPeriodEnd: boolean;

  /** When the subscription was paused */
  pausedAt: Date | null;

  /** When the subscription will auto-resume */
  resumeAt: Date | null;

  /** When the subscription fully expired */
  expiredAt: Date | null;

  /** Cancellation details */
  cancellationDetails: CancellationDetails | null;

  /** Default payment method ID (Stripe) */
  defaultPaymentMethodId: string | null;

  /** Stripe Subscription ID for sync */
  stripeSubscriptionId: string | null;

  /** Stripe Customer ID for sync */
  stripeCustomerId: string | null;

  /** Collection method: charge automatically or send invoice */
  collectionMethod: 'charge_automatically' | 'send_invoice';

  /** Days until invoice is due (for send_invoice method) */
  daysUntilDue: number | null;

  /** Discount/coupon applied */
  discountId: string | null;

  /** Proration behavior for plan changes */
  prorationBehavior: ProrationBehavior;

  /** Custom metadata */
  metadata: Record<string, unknown>;

  /** Timestamps */
  updatedAt: Date;
}

type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'paused'
  | 'past_due'
  | 'canceled'
  | 'expired';

interface CancellationDetails {
  reason: CancellationReason;
  feedback: string | null;
  canceledBy: 'customer' | 'admin' | 'system';
  effectiveDate: Date;
  winBackOffered: boolean;
  winBackAccepted: boolean;
  surveyResponses: Record<string, string> | null;
}
```

### SubscriptionItem

Individual line items within a subscription (supports multi-component plans):

```typescript
/**
 * A subscription item represents a single billable component
 * within a subscription. Subscriptions can have multiple items
 * (e.g., base plan + add-ons + metered components).
 */
interface SubscriptionItem {
  /** Unique item identifier */
  id: string;

  /** Parent subscription */
  subscriptionId: string;

  /** Price/plan component this item represents */
  priceId: string;

  /** Quantity for this item */
  quantity: number;

  /** Whether this is an add-on item */
  isAddOn: boolean;

  /** Usage metric key (for metered items) */
  metricKey: string | null;

  /** Stripe Subscription Item ID */
  stripeSubscriptionItemId: string | null;

  /** Custom metadata */
  metadata: Record<string, unknown>;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### BillingCycle

Represents a single billing period with its charges and status:

```typescript
/**
 * A billing cycle represents one period of a subscription's life.
 * It tracks the period dates, charges, and payment status.
 */
interface BillingCycle {
  /** Unique cycle identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** Parent subscription */
  subscriptionId: string;

  /** Cycle sequence number (1, 2, 3, ...) */
  cycleNumber: number;

  /** Period start (inclusive) */
  periodStart: Date;

  /** Period end (exclusive) */
  periodEnd: Date;

  /** Billing date (when invoice is generated) */
  billingDate: Date;

  /** Due date for payment */
  dueDate: Date;

  /** Cycle status */
  status: BillingCycleStatus;

  /** Subtotal before discounts and tax (smallest currency unit) */
  subtotalAmount: number;

  /** Discount amount */
  discountAmount: number;

  /** Tax amount */
  taxAmount: number;

  /** Total amount due */
  totalAmount: number;

  /** Amount actually paid */
  paidAmount: number;

  /** Currency code */
  currency: string;

  /** Proration adjustments applied */
  prorationAdjustments: ProrationAdjustment[];

  /** Usage charges for metered components */
  usageCharges: UsageCharge[];

  /** Invoice ID (internal) */
  invoiceId: string | null;

  /** Stripe Invoice ID */
  stripeInvoiceId: string | null;

  /** Payment attempt details */
  paymentAttempts: PaymentAttempt[];

  /** When payment was received */
  paidAt: Date | null;

  /** When cycle was voided */
  voidedAt: Date | null;

  /** Void reason */
  voidReason: string | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type BillingCycleStatus =
  | 'pending'
  | 'invoiced'
  | 'charging'
  | 'paid'
  | 'failed'
  | 'retrying'
  | 'void'
  | 'refunded'
  | 'partially_refunded';

interface ProrationAdjustment {
  description: string;
  amount: number;
  fromPlanId: string;
  toPlanId: string;
  daysRemaining: number;
  totalDays: number;
}

interface UsageCharge {
  metricKey: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  tierBreakdown: TierBreakdownItem[];
}

interface TierBreakdownItem {
  tierLabel: string;
  quantity: number;
  unitAmount: number;
  amount: number;
}

interface PaymentAttempt {
  attemptNumber: number;
  attemptedAt: Date;
  amount: number;
  paymentMethodId: string;
  status: 'succeeded' | 'failed' | 'pending';
  failureCode: string | null;
  failureMessage: string | null;
  stripePaymentIntentId: string | null;
}
```

### UsageRecord

Tracks metered usage for usage-based billing:

```typescript
/**
 * A usage record captures a single usage event for metered billing.
 * Records are aggregated at cycle end to compute charges.
 */
interface UsageRecord {
  /** Unique record identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** Subscription this usage belongs to */
  subscriptionId: string;

  /** Subscription item this usage is for */
  subscriptionItemId: string;

  /** Usage metric key (e.g., "api_calls", "storage_gb", "compute_hours") */
  metricKey: string;

  /** Quantity consumed */
  quantity: number;

  /** Action: set (replace current value) or increment (add to current) */
  action: 'set' | 'increment';

  /** Timestamp of the usage event */
  timestamp: Date;

  /** Idempotency key to prevent duplicate recording */
  idempotencyKey: string;

  /** Billing cycle this usage falls within */
  billingCycleId: string;

  /** Optional properties for the usage event */
  properties: Record<string, unknown>;

  /** Timestamps */
  createdAt: Date;
}

/** Aggregated usage for a cycle */
interface UsageSummary {
  metricKey: string;
  subscriptionItemId: string;
  billingCycleId: string;
  totalQuantity: number;
  includedQuantity: number;
  overageQuantity: number;
  aggregation: UsageAggregation;
  periodStart: Date;
  periodEnd: Date;
  recordCount: number;
}
```

### PlanChange

Records and manages subscription plan changes (upgrades, downgrades, add-on changes):

```typescript
/**
 * A plan change records the intent and execution of a subscription
 * modification — upgrades, downgrades, add-on changes, or quantity changes.
 */
interface PlanChange {
  /** Unique change identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** Subscription being changed */
  subscriptionId: string;

  /** Type of change */
  type: PlanChangeType;

  /** Previous plan ID */
  fromPlanId: string;

  /** New plan ID */
  toPlanId: string;

  /** Previous quantity */
  fromQuantity: number;

  /** New quantity */
  toQuantity: number;

  /** When to apply the change */
  timing: PlanChangeTiming;

  /** Proration behavior */
  prorationBehavior: ProrationBehavior;

  /** Calculated proration details */
  proration: ProrationCalculation | null;

  /** Change status */
  status: PlanChangeStatus;

  /** When the change was requested */
  requestedAt: Date;

  /** When the change takes/took effect */
  effectiveAt: Date;

  /** When the change was applied */
  appliedAt: Date | null;

  /** Who initiated the change */
  initiatedBy: string;

  /** Reason for the change */
  reason: string | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type PlanChangeType = 'upgrade' | 'downgrade' | 'crossgrade' | 'add_on' | 'quantity';

type PlanChangeTiming = 'immediate' | 'end_of_period' | 'specific_date';

type PlanChangeStatus = 'pending' | 'applied' | 'canceled' | 'failed';
```

### CancellationRequest

Manages the cancellation workflow including surveys and win-back offers:

```typescript
/**
 * A cancellation request captures the full lifecycle of a subscriber
 * deciding to cancel — from intent through win-back attempts to final execution.
 */
interface CancellationRequest {
  /** Unique request identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** Subscription being canceled */
  subscriptionId: string;

  /** Customer requesting cancellation */
  customerId: string;

  /** Cancellation reason category */
  reason: CancellationReason;

  /** Free-text feedback */
  feedback: string | null;

  /** When cancellation takes effect */
  timing: CancellationTiming;

  /** Effective cancellation date */
  effectiveDate: Date;

  /** Who initiated: customer, admin, or system (dunning) */
  initiatedBy: 'customer' | 'admin' | 'system';

  /** Offboarding survey responses */
  surveyResponses: SurveyResponse[];

  /** Win-back offer extended (if any) */
  winBackOffer: WinBackOffer | null;

  /** Whether the win-back was accepted */
  winBackAccepted: boolean;

  /** Request status */
  status: 'pending' | 'win_back_offered' | 'confirmed' | 'executed' | 'withdrawn';

  /** Refund details (if applicable) */
  refund: RefundDetails | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  executedAt: Date | null;
}

type CancellationReason =
  | 'too_expensive'
  | 'missing_features'
  | 'switched_competitor'
  | 'no_longer_needed'
  | 'poor_support'
  | 'too_complex'
  | 'technical_issues'
  | 'temporary_pause'
  | 'company_closed'
  | 'other';

type CancellationTiming = 'immediate' | 'end_of_period';

interface WinBackOffer {
  /** Offer identifier */
  id: string;
  /** Type of offer */
  type: 'discount' | 'pause' | 'downgrade' | 'extension';
  /** Discount percentage (for discount offers) */
  discountPercent?: number;
  /** Number of cycles the offer applies */
  durationCycles?: number;
  /** Alternative plan to downgrade to */
  alternativePlanId?: string;
  /** Free extension in days */
  extensionDays?: number;
  /** Offer message */
  message: string;
  /** Offer expiration */
  expiresAt: Date;
}

interface SurveyResponse {
  questionId: string;
  question: string;
  answer: string;
}

interface RefundDetails {
  amount: number;
  reason: string;
  stripeRefundId: string | null;
  processedAt: Date;
}
```

### Entitlement

Feature entitlements derived from subscription plans:

```typescript
/**
 * An entitlement defines what a subscriber can access based on their plan.
 * Entitlements are the bridge between billing and feature gating.
 */
interface Entitlement {
  /** Unique entitlement identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** Subscription this entitlement belongs to */
  subscriptionId: string;

  /** Feature key (e.g., "api_requests", "storage_gb", "advanced_analytics") */
  featureKey: string;

  /** Entitlement type */
  type: 'boolean' | 'numeric' | 'tiered';

  /** Current value */
  value: boolean | number;

  /** Current usage (for numeric entitlements) */
  currentUsage: number;

  /** Whether this is a hard limit (blocks) or soft limit (warns) */
  enforcement: 'soft' | 'hard';

  /** Reset interval for metered entitlements */
  resetInterval: BillingInterval | null;

  /** Last reset timestamp */
  lastResetAt: Date | null;

  /** Override applied by admin (null = use plan default) */
  override: EntitlementOverride | null;

  /** Source plan that grants this entitlement */
  sourcePlanId: string;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/** Result of checking an entitlement */
interface EntitlementCheck {
  /** The feature being checked */
  featureKey: string;
  /** Whether access is granted */
  allowed: boolean;
  /** Current usage vs limit */
  usage?: {
    current: number;
    limit: number;
    remaining: number;
    percentUsed: number;
  };
  /** Whether a soft limit warning should be shown */
  warning: boolean;
  /** Warning message */
  warningMessage?: string;
  /** Enforcement type */
  enforcement: 'soft' | 'hard';
  /** Upgrade path (if not allowed) */
  upgradePath?: {
    planId: string;
    planName: string;
    newLimit: number;
  };
}

interface EntitlementOverride {
  /** Override value */
  value: boolean | number;
  /** Reason for override */
  reason: string;
  /** Who applied the override */
  appliedBy: string;
  /** When the override expires (null = permanent) */
  expiresAt: Date | null;
  /** When the override was applied */
  appliedAt: Date;
}
```

### DunningAttempt

Tracks payment retry attempts during the dunning process:

```typescript
/**
 * A dunning attempt records a single retry in the payment recovery process.
 */
interface DunningAttempt {
  /** Unique attempt identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** Subscription in dunning */
  subscriptionId: string;

  /** Billing cycle being dunned */
  billingCycleId: string;

  /** Attempt sequence number */
  attemptNumber: number;

  /** Maximum attempts configured */
  maxAttempts: number;

  /** When the attempt was scheduled */
  scheduledAt: Date;

  /** When the attempt was executed */
  executedAt: Date | null;

  /** Payment method used */
  paymentMethodId: string;

  /** Amount attempted */
  amount: number;

  /** Currency code */
  currency: string;

  /** Attempt outcome */
  outcome: DunningOutcome;

  /** Failure code from payment processor */
  failureCode: string | null;

  /** Failure message */
  failureMessage: string | null;

  /** Whether a customer notification was sent */
  notificationSent: boolean;

  /** Notification channel used */
  notificationChannel: 'email' | 'sms' | 'in_app' | null;

  /** Stripe Payment Intent ID */
  stripePaymentIntentId: string | null;

  /** Retry strategy used */
  strategy: RetryStrategy;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type DunningOutcome = 'pending' | 'succeeded' | 'failed' | 'skipped';

interface RetryStrategy {
  /** Base delay between retries */
  baseDelayHours: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Maximum delay between retries */
  maxDelayHours: number;
  /** Whether to try alternate payment methods */
  tryAlternatePaymentMethods: boolean;
  /** Preferred retry days of week (0=Sun, 1=Mon, ...) */
  preferredRetryDays: number[];
  /** Preferred retry hour (local time) */
  preferredRetryHour: number;
}

interface DunningSchedule {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Retry strategy */
  strategy: RetryStrategy;
  /** Grace period in days before restricting access */
  gracePeriodDays: number;
  /** Whether to send customer notifications */
  notifyCustomer: boolean;
  /** Notification schedule */
  notifications: DunningNotification[];
}

interface DunningNotification {
  /** When to send relative to dunning start (days) */
  dayOffset: number;
  /** Notification channel */
  channel: 'email' | 'sms' | 'in_app';
  /** Template key */
  templateKey: string;
}
```

### SubscriptionEvent

Immutable event log for audit and analytics:

```typescript
/**
 * A subscription event is an immutable record of something that happened
 * to a subscription. Used for audit trails, analytics, and event sourcing.
 */
interface SubscriptionEvent {
  /** Unique event identifier */
  id: string;

  /** Tenant scope */
  tenantId: string;

  /** Subscription this event pertains to */
  subscriptionId: string;

  /** Event type */
  eventType: SubscriptionEventType;

  /** Event payload (varies by type) */
  payload: Record<string, unknown>;

  /** Previous state (for state transitions) */
  previousState: SubscriptionStatus | null;

  /** New state (for state transitions) */
  newState: SubscriptionStatus | null;

  /** Who/what caused this event */
  actor: EventActor;

  /** Idempotency key */
  idempotencyKey: string;

  /** Stripe event ID (if triggered by webhook) */
  stripeEventId: string | null;

  /** Event timestamp */
  occurredAt: Date;

  /** When the event was recorded */
  createdAt: Date;
}

type SubscriptionEventType =
  | 'subscription.created'
  | 'subscription.activated'
  | 'subscription.trial_started'
  | 'subscription.trial_ending'
  | 'subscription.trial_ended'
  | 'subscription.renewed'
  | 'subscription.paused'
  | 'subscription.resumed'
  | 'subscription.past_due'
  | 'subscription.recovered'
  | 'subscription.canceled'
  | 'subscription.expired'
  | 'subscription.reactivated'
  | 'plan_change.requested'
  | 'plan_change.applied'
  | 'plan_change.canceled'
  | 'billing_cycle.created'
  | 'billing_cycle.invoiced'
  | 'billing_cycle.charged'
  | 'billing_cycle.paid'
  | 'billing_cycle.failed'
  | 'billing_cycle.voided'
  | 'billing_cycle.refunded'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'dunning.started'
  | 'dunning.attempt'
  | 'dunning.recovered'
  | 'dunning.exhausted'
  | 'usage.recorded'
  | 'usage.threshold_reached'
  | 'entitlement.granted'
  | 'entitlement.revoked'
  | 'entitlement.overridden'
  | 'cancellation.requested'
  | 'cancellation.win_back_offered'
  | 'cancellation.win_back_accepted'
  | 'cancellation.executed';

interface EventActor {
  type: 'customer' | 'admin' | 'system' | 'stripe_webhook';
  id: string;
  name?: string;
}
```

### SubscriptionService

The primary service for subscription lifecycle management:

```typescript
/**
 * SubscriptionService is the main entry point for subscription operations.
 * It orchestrates the state machine, delegates to specialized services,
 * and ensures consistency.
 */
interface SubscriptionService {
  /**
   * Create a new subscription for a customer.
   * Handles trial setup, initial billing cycle, Stripe sync.
   */
  create(input: CreateSubscriptionInput): Promise<Subscription>;

  /**
   * Retrieve a subscription by ID.
   * Includes plan, items, and current cycle.
   */
  getById(subscriptionId: string): Promise<Subscription | null>;

  /**
   * List subscriptions with filtering and pagination.
   */
  list(input: ListSubscriptionsInput): Promise<PaginatedResult<Subscription>>;

  /**
   * List subscriptions for a specific customer.
   */
  listByCustomer(customerId: string, options?: ListOptions): Promise<Subscription[]>;

  /**
   * Change the subscription's plan (upgrade/downgrade).
   * Handles proration, entitlement updates, and Stripe sync.
   */
  changePlan(input: ChangePlanInput): Promise<PlanChange>;

  /**
   * Change the quantity (seats) on a subscription.
   */
  changeQuantity(input: ChangeQuantityInput): Promise<Subscription>;

  /**
   * Add an add-on to the subscription.
   */
  addAddOn(input: AddAddOnInput): Promise<SubscriptionItem>;

  /**
   * Remove an add-on from the subscription.
   */
  removeAddOn(subscriptionId: string, itemId: string): Promise<void>;

  /**
   * Cancel a subscription.
   * Supports immediate or end-of-period cancellation.
   */
  cancel(input: CancelSubscriptionInput): Promise<CancellationRequest>;

  /**
   * Pause a subscription.
   * Suspends billing and optionally access.
   */
  pause(input: PauseSubscriptionInput): Promise<Subscription>;

  /**
   * Resume a paused subscription.
   */
  resume(subscriptionId: string): Promise<Subscription>;

  /**
   * Reactivate a canceled subscription (within grace period).
   */
  reactivate(subscriptionId: string): Promise<Subscription>;

  /**
   * Update the default payment method.
   */
  updatePaymentMethod(
    subscriptionId: string,
    paymentMethodId: string
  ): Promise<Subscription>;

  /**
   * Apply a discount/coupon to a subscription.
   */
  applyDiscount(subscriptionId: string, discountId: string): Promise<Subscription>;

  /**
   * Remove a discount from a subscription.
   */
  removeDiscount(subscriptionId: string): Promise<Subscription>;

  /**
   * Get the full event history for a subscription.
   */
  getEventHistory(
    subscriptionId: string,
    options?: EventHistoryOptions
  ): Promise<PaginatedResult<SubscriptionEvent>>;

  /**
   * Preview what a plan change would look like (proration, new price).
   * Does not mutate anything.
   */
  previewPlanChange(input: ChangePlanInput): Promise<PlanChangePreview>;

  /**
   * Preview what cancellation would look like (refund, access end date).
   * Does not mutate anything.
   */
  previewCancellation(input: CancelSubscriptionInput): Promise<CancellationPreview>;
}

interface CreateSubscriptionInput {
  customerId: string;
  planId: string;
  quantity?: number;
  paymentMethodId?: string;
  trialPeriodDays?: number;
  billingAnchor?: BillingAnchor;
  collectionMethod?: 'charge_automatically' | 'send_invoice';
  prorationBehavior?: ProrationBehavior;
  addOnIds?: string[];
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}

interface ChangePlanInput {
  subscriptionId: string;
  newPlanId: string;
  timing?: PlanChangeTiming;
  prorationBehavior?: ProrationBehavior;
  reason?: string;
}

interface CancelSubscriptionInput {
  subscriptionId: string;
  reason: CancellationReason;
  timing: CancellationTiming;
  feedback?: string;
  surveyResponses?: SurveyResponse[];
  skipWinBack?: boolean;
}

interface PauseSubscriptionInput {
  subscriptionId: string;
  resumeAt?: Date;
  reason?: string;
}

interface PlanChangePreview {
  fromPlan: SubscriptionPlan;
  toPlan: SubscriptionPlan;
  proration: ProrationCalculation;
  newMonthlyAmount: number;
  effectiveDate: Date;
  nextBillingDate: Date;
}

interface CancellationPreview {
  accessEndDate: Date;
  refundAmount: number;
  remainingDaysInCycle: number;
  winBackEligible: boolean;
}
```

### EntitlementService

Runtime feature gating based on subscription plans:

```typescript
/**
 * EntitlementService provides real-time feature access control based on
 * the subscriber's active plan. It's the bridge between billing and
 * product feature flags.
 */
interface EntitlementService {
  /**
   * Check if a subscription has access to a specific feature.
   * Returns detailed usage info for metered features.
   */
  check(subscriptionId: string, featureKey: string): Promise<EntitlementCheck>;

  /**
   * Batch check multiple features at once (more efficient).
   */
  checkBatch(
    subscriptionId: string,
    featureKeys: string[]
  ): Promise<Map<string, EntitlementCheck>>;

  /**
   * Resolve all entitlements for a subscription.
   * Used to populate the feature matrix in the UI.
   */
  resolveAll(subscriptionId: string): Promise<Entitlement[]>;

  /**
   * Increment usage for a metered entitlement.
   * Enforces limits based on the enforcement mode.
   */
  incrementUsage(
    subscriptionId: string,
    featureKey: string,
    amount: number
  ): Promise<EntitlementCheck>;

  /**
   * Set absolute usage for an entitlement.
   */
  setUsage(
    subscriptionId: string,
    featureKey: string,
    amount: number
  ): Promise<EntitlementCheck>;

  /**
   * Reset usage counters (typically at cycle boundaries).
   */
  resetUsage(subscriptionId: string, featureKey?: string): Promise<void>;

  /**
   * Apply an admin override to an entitlement.
   */
  applyOverride(
    subscriptionId: string,
    featureKey: string,
    override: EntitlementOverride
  ): Promise<Entitlement>;

  /**
   * Remove an admin override.
   */
  removeOverride(subscriptionId: string, featureKey: string): Promise<Entitlement>;

  /**
   * Compare entitlements between two plans (for upgrade/downgrade UI).
   */
  comparePlans(
    fromPlanId: string,
    toPlanId: string
  ): Promise<EntitlementComparison[]>;
}

interface EntitlementComparison {
  featureKey: string;
  featureName: string;
  fromValue: boolean | number;
  toValue: boolean | number;
  change: 'added' | 'removed' | 'upgraded' | 'downgraded' | 'unchanged';
}
```

### BillingService

Manages billing cycles, invoices, and payment processing:

```typescript
/**
 * BillingService handles the financial side of subscriptions —
 * cycle management, invoice generation, charge processing, and refunds.
 */
interface BillingService {
  /**
   * Create a new billing cycle for a subscription.
   */
  createCycle(subscriptionId: string): Promise<BillingCycle>;

  /**
   * Get the current billing cycle for a subscription.
   */
  getCurrentCycle(subscriptionId: string): Promise<BillingCycle | null>;

  /**
   * List billing cycles for a subscription.
   */
  listCycles(
    subscriptionId: string,
    options?: ListOptions
  ): Promise<PaginatedResult<BillingCycle>>;

  /**
   * Generate an invoice for a billing cycle.
   * Aggregates usage, applies discounts, calculates tax.
   */
  generateInvoice(cycleId: string): Promise<Invoice>;

  /**
   * Process payment for a billing cycle.
   */
  charge(cycleId: string): Promise<PaymentResult>;

  /**
   * Calculate proration for a mid-cycle plan change.
   */
  calculateProration(input: ProrationInput): Promise<ProrationCalculation>;

  /**
   * Issue a refund for a billing cycle.
   */
  refund(cycleId: string, amount?: number, reason?: string): Promise<RefundResult>;

  /**
   * Void an unpaid billing cycle.
   */
  voidCycle(cycleId: string, reason: string): Promise<BillingCycle>;

  /**
   * Process all pending billing cycles (batch job).
   */
  processAllPending(): Promise<BatchProcessingResult>;

  /**
   * Get upcoming renewal information.
   */
  getUpcomingRenewal(subscriptionId: string): Promise<UpcomingRenewal>;
}

interface ProrationInput {
  subscriptionId: string;
  fromPlanId: string;
  toPlanId: string;
  fromQuantity: number;
  toQuantity: number;
  effectiveDate: Date;
}

interface PaymentResult {
  success: boolean;
  amount: number;
  paymentIntentId: string | null;
  failureCode?: string;
  failureMessage?: string;
}

interface RefundResult {
  amount: number;
  refundId: string;
  stripeRefundId: string | null;
  status: 'pending' | 'succeeded' | 'failed';
}

interface UpcomingRenewal {
  subscriptionId: string;
  renewalDate: Date;
  estimatedAmount: number;
  lineItems: RenewalLineItem[];
  paymentMethodLast4: string | null;
}

interface RenewalLineItem {
  description: string;
  amount: number;
  quantity: number;
}

interface BatchProcessingResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ cycleId: string; error: string }>;
}
```

### UsageService

Records and aggregates metered usage:

```typescript
/**
 * UsageService manages the recording, aggregation, and querying
 * of metered usage data for usage-based billing.
 */
interface UsageService {
  /**
   * Record a usage event.
   * Idempotent — duplicate idempotency keys are ignored.
   */
  record(input: RecordUsageInput): Promise<UsageRecord>;

  /**
   * Batch record multiple usage events.
   */
  recordBatch(inputs: RecordUsageInput[]): Promise<UsageRecord[]>;

  /**
   * Get aggregated usage for a subscription's current cycle.
   */
  getCurrentUsage(
    subscriptionId: string,
    metricKey?: string
  ): Promise<UsageSummary[]>;

  /**
   * Get usage history across billing cycles.
   */
  getUsageHistory(
    subscriptionId: string,
    metricKey: string,
    options?: UsageHistoryOptions
  ): Promise<UsageSummary[]>;

  /**
   * Get real-time usage metrics (for dashboards).
   */
  getRealtimeMetrics(
    subscriptionId: string,
    metricKey: string,
    resolution: 'hour' | 'day' | 'week'
  ): Promise<UsageTimeSeries>;

  /**
   * Aggregate usage for a billing cycle (called at cycle end).
   */
  aggregateForCycle(billingCycleId: string): Promise<UsageSummary[]>;

  /**
   * Set a usage alert threshold.
   */
  setAlert(input: UsageAlertInput): Promise<UsageAlert>;

  /**
   * Reset usage counters for a new cycle.
   */
  resetForNewCycle(subscriptionId: string, billingCycleId: string): Promise<void>;
}

interface RecordUsageInput {
  subscriptionId: string;
  metricKey: string;
  quantity: number;
  action?: 'set' | 'increment';
  timestamp?: Date;
  idempotencyKey: string;
  properties?: Record<string, unknown>;
}

interface UsageTimeSeries {
  metricKey: string;
  resolution: 'hour' | 'day' | 'week';
  dataPoints: Array<{
    timestamp: Date;
    value: number;
  }>;
}

interface UsageAlertInput {
  subscriptionId: string;
  metricKey: string;
  thresholdPercent: number;
  notificationChannels: ('email' | 'in_app' | 'webhook')[];
}

interface UsageAlert {
  id: string;
  subscriptionId: string;
  metricKey: string;
  thresholdPercent: number;
  triggered: boolean;
  triggeredAt: Date | null;
}
```

### AnalyticsService

Subscription metrics and revenue analytics:

```typescript
/**
 * AnalyticsService calculates subscription metrics for dashboards,
 * reporting, and business intelligence.
 */
interface AnalyticsService {
  /**
   * Calculate Monthly Recurring Revenue (MRR) with breakdown.
   */
  calculateMRR(options?: MRROptions): Promise<MRRBreakdown>;

  /**
   * Calculate Annual Recurring Revenue (ARR).
   */
  calculateARR(options?: MRROptions): Promise<number>;

  /**
   * Calculate churn metrics for a period.
   */
  calculateChurn(period: AnalyticsPeriod): Promise<ChurnMetrics>;

  /**
   * Calculate Customer Lifetime Value.
   */
  calculateLTV(options?: LTVOptions): Promise<LTVCalculation>;

  /**
   * Get trial conversion metrics.
   */
  getTrialConversion(period: AnalyticsPeriod): Promise<TrialConversion>;

  /**
   * Run cohort analysis on subscriptions.
   */
  cohortAnalysis(options: CohortOptions): Promise<CohortAnalysis>;

  /**
   * Get revenue metrics summary.
   */
  getRevenueMetrics(period: AnalyticsPeriod): Promise<RevenueMetrics>;

  /**
   * Get subscription count by status.
   */
  getStatusBreakdown(): Promise<Map<SubscriptionStatus, number>>;
}

interface MRRBreakdown {
  /** Total MRR */
  total: number;
  /** New MRR from new subscriptions */
  newMRR: number;
  /** Expansion MRR from upgrades and add-ons */
  expansionMRR: number;
  /** Contraction MRR from downgrades */
  contractionMRR: number;
  /** Churned MRR from cancellations */
  churnedMRR: number;
  /** Reactivation MRR */
  reactivationMRR: number;
  /** Net new MRR (new + expansion - contraction - churned + reactivation) */
  netNewMRR: number;
  /** MRR by plan */
  byPlan: Array<{ planId: string; planName: string; mrr: number }>;
  /** Currency */
  currency: string;
  /** Calculation timestamp */
  calculatedAt: Date;
}

interface ChurnMetrics {
  /** Gross churn rate (%) */
  grossChurnRate: number;
  /** Net churn rate (%) — accounts for expansion */
  netChurnRate: number;
  /** Number of churned subscriptions */
  churnedCount: number;
  /** Revenue lost to churn */
  churnedRevenue: number;
  /** Voluntary vs involuntary breakdown */
  voluntary: number;
  involuntary: number;
  /** Churn by reason */
  byReason: Array<{ reason: CancellationReason; count: number; revenue: number }>;
  /** Period analyzed */
  period: AnalyticsPeriod;
}

interface LTVCalculation {
  /** Average Customer Lifetime Value */
  averageLTV: number;
  /** Average revenue per account per month */
  averageRevenuePerMonth: number;
  /** Average customer lifespan in months */
  averageLifespanMonths: number;
  /** LTV by plan */
  byPlan: Array<{ planId: string; planName: string; ltv: number }>;
  /** LTV:CAC ratio (if CAC data available) */
  ltvToCacRatio: number | null;
}

interface TrialConversion {
  /** Total trials started in period */
  trialsStarted: number;
  /** Total trials converted to paid */
  trialsConverted: number;
  /** Conversion rate (%) */
  conversionRate: number;
  /** Average days to convert */
  averageDaysToConvert: number;
  /** Trials expired without converting */
  trialsExpired: number;
  /** Conversion by plan */
  byPlan: Array<{ planId: string; planName: string; rate: number }>;
}

interface CohortAnalysis {
  /** Cohort grouping (month subscriber joined) */
  cohorts: Array<{
    cohortMonth: string;
    startingCount: number;
    /** Retention at each month */
    retention: number[];
    /** Revenue at each month */
    revenue: number[];
  }>;
}

interface RevenueMetrics {
  /** Total revenue in period */
  totalRevenue: number;
  /** Recurring revenue */
  recurringRevenue: number;
  /** One-time revenue (setup fees, etc.) */
  oneTimeRevenue: number;
  /** Usage/overage revenue */
  usageRevenue: number;
  /** Refunds */
  refundedAmount: number;
  /** Net revenue */
  netRevenue: number;
  /** Average Revenue Per User (ARPU) */
  arpu: number;
  /** Period */
  period: AnalyticsPeriod;
}

interface AnalyticsPeriod {
  start: Date;
  end: Date;
}
```

---

## Database Schemas

All tables use multi-tenant Row-Level Security (RLS) with `tenant_id` scoping. The schemas are defined using Drizzle ORM for type-safe query building.

### subscription_plans

```typescript
import { pgTable, uuid, text, integer, boolean, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  interval: text('interval', {
    enum: ['day', 'week', 'month', 'year'],
  }).notNull(),
  intervalCount: integer('interval_count').notNull().default(1),
  pricing: jsonb('pricing').notNull().$type<PricingModel>(),
  currency: text('currency').notNull().default('usd'),
  trialPeriodDays: integer('trial_period_days').notNull().default(0),
  setupFee: integer('setup_fee').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  isPublic: boolean('is_public').notNull().default(true),
  allowPause: boolean('allow_pause').notNull().default(false),
  maxPauseDurationDays: integer('max_pause_duration_days'),
  billingAnchor: jsonb('billing_anchor').notNull().$type<BillingAnchor>()
    .default({ type: 'anniversary' }),
  entitlements: jsonb('entitlements').notNull().$type<PlanEntitlement[]>()
    .default([]),
  availableAddOns: jsonb('available_add_ons').notNull().$type<string[]>()
    .default([]),
  metadata: jsonb('metadata').notNull().default({}),
  stripePriceId: text('stripe_price_id'),
  stripeProductId: text('stripe_product_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('idx_subscription_plans_tenant').on(table.tenantId),
  slugIdx: index('idx_subscription_plans_slug').on(table.tenantId, table.slug).unique(),
  activeIdx: index('idx_subscription_plans_active').on(table.tenantId, table.isActive),
  stripeProductIdx: index('idx_subscription_plans_stripe_product').on(table.stripeProductId),
}));
```

**RLS Policy:**
```sql
CREATE POLICY subscription_plans_tenant_isolation ON subscription_plans
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### subscriptions

```typescript
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  planId: uuid('plan_id').notNull().references(() => subscriptionPlans.id),
  status: text('status', {
    enum: ['trialing', 'active', 'paused', 'past_due', 'canceled', 'expired'],
  }).notNull().default('trialing'),
  quantity: integer('quantity').notNull().default(1),
  currentCycleId: uuid('current_cycle_id'),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  pausedAt: timestamp('paused_at', { withTimezone: true }),
  resumeAt: timestamp('resume_at', { withTimezone: true }),
  expiredAt: timestamp('expired_at', { withTimezone: true }),
  cancellationDetails: jsonb('cancellation_details').$type<CancellationDetails>(),
  defaultPaymentMethodId: text('default_payment_method_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeCustomerId: text('stripe_customer_id'),
  collectionMethod: text('collection_method', {
    enum: ['charge_automatically', 'send_invoice'],
  }).notNull().default('charge_automatically'),
  daysUntilDue: integer('days_until_due'),
  discountId: uuid('discount_id'),
  prorationBehavior: text('proration_behavior', {
    enum: ['create_prorations', 'always_invoice', 'none'],
  }).notNull().default('create_prorations'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_subscriptions_tenant').on(table.tenantId),
  customerIdx: index('idx_subscriptions_customer').on(table.tenantId, table.customerId),
  orgIdx: index('idx_subscriptions_org').on(table.tenantId, table.organizationId),
  planIdx: index('idx_subscriptions_plan').on(table.tenantId, table.planId),
  statusIdx: index('idx_subscriptions_status').on(table.tenantId, table.status),
  stripeSubIdx: index('idx_subscriptions_stripe').on(table.stripeSubscriptionId).unique(),
  periodEndIdx: index('idx_subscriptions_period_end').on(table.currentPeriodEnd),
  trialEndsIdx: index('idx_subscriptions_trial_ends').on(table.trialEndsAt),
}));
```

**RLS Policy:**
```sql
CREATE POLICY subscriptions_tenant_isolation ON subscriptions
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### subscription_items

```typescript
export const subscriptionItems = pgTable('subscription_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  subscriptionId: uuid('subscription_id').notNull()
    .references(() => subscriptions.id, { onDelete: 'cascade' }),
  priceId: text('price_id').notNull(),
  quantity: integer('quantity').notNull().default(1),
  isAddOn: boolean('is_add_on').notNull().default(false),
  metricKey: text('metric_key'),
  stripeSubscriptionItemId: text('stripe_subscription_item_id'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  subscriptionIdx: index('idx_subscription_items_subscription').on(table.subscriptionId),
  stripeItemIdx: index('idx_subscription_items_stripe').on(table.stripeSubscriptionItemId),
  metricIdx: index('idx_subscription_items_metric').on(table.subscriptionId, table.metricKey),
}));
```

### billing_cycles

```typescript
export const billingCycles = pgTable('billing_cycles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  subscriptionId: uuid('subscription_id').notNull()
    .references(() => subscriptions.id, { onDelete: 'cascade' }),
  cycleNumber: integer('cycle_number').notNull(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  billingDate: timestamp('billing_date', { withTimezone: true }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  status: text('status', {
    enum: ['pending', 'invoiced', 'charging', 'paid', 'failed', 'retrying', 'void',
           'refunded', 'partially_refunded'],
  }).notNull().default('pending'),
  subtotalAmount: integer('subtotal_amount').notNull().default(0),
  discountAmount: integer('discount_amount').notNull().default(0),
  taxAmount: integer('tax_amount').notNull().default(0),
  totalAmount: integer('total_amount').notNull().default(0),
  paidAmount: integer('paid_amount').notNull().default(0),
  currency: text('currency').notNull().default('usd'),
  prorationAdjustments: jsonb('proration_adjustments')
    .$type<ProrationAdjustment[]>().notNull().default([]),
  usageCharges: jsonb('usage_charges').$type<UsageCharge[]>().notNull().default([]),
  invoiceId: uuid('invoice_id'),
  stripeInvoiceId: text('stripe_invoice_id'),
  paymentAttempts: jsonb('payment_attempts').$type<PaymentAttempt[]>().notNull().default([]),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidReason: text('void_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_billing_cycles_tenant').on(table.tenantId),
  subscriptionIdx: index('idx_billing_cycles_subscription').on(table.subscriptionId),
  statusIdx: index('idx_billing_cycles_status').on(table.tenantId, table.status),
  billingDateIdx: index('idx_billing_cycles_billing_date').on(table.billingDate),
  periodIdx: index('idx_billing_cycles_period').on(
    table.subscriptionId, table.periodStart, table.periodEnd
  ),
  stripeInvoiceIdx: index('idx_billing_cycles_stripe_invoice').on(table.stripeInvoiceId),
  cycleNumberUniq: index('idx_billing_cycles_number').on(
    table.subscriptionId, table.cycleNumber
  ).unique(),
}));
```

### usage_records

```typescript
export const usageRecords = pgTable('usage_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  subscriptionId: uuid('subscription_id').notNull()
    .references(() => subscriptions.id, { onDelete: 'cascade' }),
  subscriptionItemId: uuid('subscription_item_id').notNull()
    .references(() => subscriptionItems.id),
  metricKey: text('metric_key').notNull(),
  quantity: integer('quantity').notNull(),
  action: text('action', { enum: ['set', 'increment'] }).notNull().default('increment'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  idempotencyKey: text('idempotency_key').notNull(),
  billingCycleId: uuid('billing_cycle_id').notNull()
    .references(() => billingCycles.id),
  properties: jsonb('properties').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_usage_records_tenant').on(table.tenantId),
  subscriptionIdx: index('idx_usage_records_subscription').on(table.subscriptionId),
  metricIdx: index('idx_usage_records_metric').on(
    table.subscriptionId, table.metricKey, table.timestamp
  ),
  cycleIdx: index('idx_usage_records_cycle').on(table.billingCycleId),
  idempotencyIdx: index('idx_usage_records_idempotency').on(table.idempotencyKey).unique(),
  timestampIdx: index('idx_usage_records_timestamp').on(table.timestamp),
}));
```

### plan_changes

```typescript
export const planChanges = pgTable('plan_changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  subscriptionId: uuid('subscription_id').notNull()
    .references(() => subscriptions.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['upgrade', 'downgrade', 'crossgrade', 'add_on', 'quantity'],
  }).notNull(),
  fromPlanId: uuid('from_plan_id').notNull().references(() => subscriptionPlans.id),
  toPlanId: uuid('to_plan_id').notNull().references(() => subscriptionPlans.id),
  fromQuantity: integer('from_quantity').notNull(),
  toQuantity: integer('to_quantity').notNull(),
  timing: text('timing', {
    enum: ['immediate', 'end_of_period', 'specific_date'],
  }).notNull(),
  prorationBehavior: text('proration_behavior', {
    enum: ['create_prorations', 'always_invoice', 'none'],
  }).notNull(),
  proration: jsonb('proration').$type<ProrationCalculation>(),
  status: text('status', {
    enum: ['pending', 'applied', 'canceled', 'failed'],
  }).notNull().default('pending'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  effectiveAt: timestamp('effective_at', { withTimezone: true }).notNull(),
  appliedAt: timestamp('applied_at', { withTimezone: true }),
  initiatedBy: text('initiated_by').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_plan_changes_tenant').on(table.tenantId),
  subscriptionIdx: index('idx_plan_changes_subscription').on(table.subscriptionId),
  statusIdx: index('idx_plan_changes_status').on(table.status),
  effectiveIdx: index('idx_plan_changes_effective').on(table.effectiveAt),
}));
```

### cancellations

```typescript
export const cancellations = pgTable('cancellations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  subscriptionId: uuid('subscription_id').notNull()
    .references(() => subscriptions.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  reason: text('reason', {
    enum: [
      'too_expensive', 'missing_features', 'switched_competitor',
      'no_longer_needed', 'poor_support', 'too_complex',
      'technical_issues', 'temporary_pause', 'company_closed', 'other',
    ],
  }).notNull(),
  feedback: text('feedback'),
  timing: text('timing', {
    enum: ['immediate', 'end_of_period'],
  }).notNull(),
  effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
  initiatedBy: text('initiated_by', {
    enum: ['customer', 'admin', 'system'],
  }).notNull(),
  surveyResponses: jsonb('survey_responses').$type<SurveyResponse[]>().notNull().default([]),
  winBackOffer: jsonb('win_back_offer').$type<WinBackOffer>(),
  winBackAccepted: boolean('win_back_accepted').notNull().default(false),
  status: text('status', {
    enum: ['pending', 'win_back_offered', 'confirmed', 'executed', 'withdrawn'],
  }).notNull().default('pending'),
  refund: jsonb('refund').$type<RefundDetails>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  executedAt: timestamp('executed_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('idx_cancellations_tenant').on(table.tenantId),
  subscriptionIdx: index('idx_cancellations_subscription').on(table.subscriptionId),
  customerIdx: index('idx_cancellations_customer').on(table.customerId),
  statusIdx: index('idx_cancellations_status').on(table.status),
  reasonIdx: index('idx_cancellations_reason').on(table.reason),
}));
```

### subscription_events

```typescript
export const subscriptionEvents = pgTable('subscription_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  subscriptionId: uuid('subscription_id').notNull()
    .references(() => subscriptions.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull().default({}),
  previousState: text('previous_state'),
  newState: text('new_state'),
  actor: jsonb('actor').notNull().$type<EventActor>(),
  idempotencyKey: text('idempotency_key').notNull(),
  stripeEventId: text('stripe_event_id'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_subscription_events_tenant').on(table.tenantId),
  subscriptionIdx: index('idx_subscription_events_subscription').on(table.subscriptionId),
  eventTypeIdx: index('idx_subscription_events_type').on(table.eventType),
  occurredAtIdx: index('idx_subscription_events_occurred').on(table.occurredAt),
  idempotencyIdx: index('idx_subscription_events_idempotency')
    .on(table.idempotencyKey).unique(),
  stripeEventIdx: index('idx_subscription_events_stripe').on(table.stripeEventId),
}));
```

### entitlements

```typescript
export const entitlements = pgTable('entitlements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  subscriptionId: uuid('subscription_id').notNull()
    .references(() => subscriptions.id, { onDelete: 'cascade' }),
  featureKey: text('feature_key').notNull(),
  type: text('type', {
    enum: ['boolean', 'numeric', 'tiered'],
  }).notNull(),
  value: jsonb('value').notNull(),
  currentUsage: integer('current_usage').notNull().default(0),
  enforcement: text('enforcement', {
    enum: ['soft', 'hard'],
  }).notNull().default('hard'),
  resetInterval: text('reset_interval', {
    enum: ['day', 'week', 'month', 'year'],
  }),
  lastResetAt: timestamp('last_reset_at', { withTimezone: true }),
  override: jsonb('override').$type<EntitlementOverride>(),
  sourcePlanId: uuid('source_plan_id').notNull()
    .references(() => subscriptionPlans.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_entitlements_tenant').on(table.tenantId),
  subscriptionIdx: index('idx_entitlements_subscription').on(table.subscriptionId),
  featureIdx: index('idx_entitlements_feature').on(
    table.subscriptionId, table.featureKey
  ).unique(),
  typeIdx: index('idx_entitlements_type').on(table.type),
}));
```

### dunning_attempts

```typescript
export const dunningAttempts = pgTable('dunning_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  subscriptionId: uuid('subscription_id').notNull()
    .references(() => subscriptions.id, { onDelete: 'cascade' }),
  billingCycleId: uuid('billing_cycle_id').notNull()
    .references(() => billingCycles.id),
  attemptNumber: integer('attempt_number').notNull(),
  maxAttempts: integer('max_attempts').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  paymentMethodId: text('payment_method_id').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('usd'),
  outcome: text('outcome', {
    enum: ['pending', 'succeeded', 'failed', 'skipped'],
  }).notNull().default('pending'),
  failureCode: text('failure_code'),
  failureMessage: text('failure_message'),
  notificationSent: boolean('notification_sent').notNull().default(false),
  notificationChannel: text('notification_channel', {
    enum: ['email', 'sms', 'in_app'],
  }),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  strategy: jsonb('strategy').notNull().$type<RetryStrategy>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('idx_dunning_attempts_tenant').on(table.tenantId),
  subscriptionIdx: index('idx_dunning_attempts_subscription').on(table.subscriptionId),
  cycleIdx: index('idx_dunning_attempts_cycle').on(table.billingCycleId),
  scheduledIdx: index('idx_dunning_attempts_scheduled').on(table.scheduledAt),
  outcomeIdx: index('idx_dunning_attempts_outcome').on(table.outcome),
  attemptUniq: index('idx_dunning_attempts_number').on(
    table.billingCycleId, table.attemptNumber
  ).unique(),
}));
```

---

## Code Examples

### Example 1 — Creating a Subscription Plan

Create a plan with tiered pricing, trial period, and entitlements.

```typescript
import { PlanService } from '@mcv/commerce/subscriptions';
import { db } from '@mcv/database';

const planService = new PlanService(db);

// Create a "Pro" plan with monthly billing
const proPlan = await planService.create({
  name: 'Pro',
  slug: 'pro-monthly',
  description: 'For growing teams that need advanced features and priority support.',
  interval: 'month',
  intervalCount: 1,
  pricing: {
    model: 'hybrid',
    components: [
      {
        key: 'base',
        name: 'Base subscription',
        pricing: {
          model: 'flat_rate',
          amount: 4900, // $49.00
        },
      },
      {
        key: 'seats',
        name: 'Team seats',
        pricing: {
          model: 'per_seat',
          amountPerSeat: 1200, // $12.00 per additional seat
          minSeats: 1,
          maxSeats: 100,
          allowFractional: false,
        },
      },
      {
        key: 'api_calls',
        name: 'API calls',
        pricing: {
          model: 'metered',
          metricKey: 'api_calls',
          aggregation: 'sum',
          tiers: [
            { upTo: 10000, flatAmount: 0, unitAmount: 0 },
            { upTo: 100000, flatAmount: 0, unitAmount: 1 }, // $0.01 per call
            { upTo: null, flatAmount: 0, unitAmount: 0.5 }, // $0.005 per call
          ],
          includedUnits: 10000,
          overageUnitAmount: 1,
        },
      },
    ],
  },
  currency: 'usd',
  trialPeriodDays: 14,
  setupFee: 0,
  allowPause: true,
  maxPauseDurationDays: 90,
  billingAnchor: { type: 'anniversary' },
  entitlements: [
    {
      featureKey: 'api_calls',
      type: 'numeric',
      value: 10000,
      enforcement: 'soft',
      resetInterval: 'month',
    },
    {
      featureKey: 'storage_gb',
      type: 'numeric',
      value: 50,
      enforcement: 'hard',
    },
    {
      featureKey: 'seats',
      type: 'numeric',
      value: 5,
      enforcement: 'hard',
    },
    {
      featureKey: 'advanced_analytics',
      type: 'boolean',
      value: true,
      enforcement: 'hard',
    },
    {
      featureKey: 'priority_support',
      type: 'boolean',
      value: true,
      enforcement: 'hard',
    },
    {
      featureKey: 'custom_branding',
      type: 'boolean',
      value: false,
      enforcement: 'hard',
    },
  ],
  sortOrder: 2,
  metadata: {
    tier: 'mid',
    recommended: true,
  },
});

console.log(`Created plan: ${proPlan.name} (${proPlan.id})`);
// Created plan: Pro (a1b2c3d4-...)

// Also create an annual variant with a discount
const proAnnualPlan = await planService.create({
  name: 'Pro (Annual)',
  slug: 'pro-annual',
  description: 'Pro plan billed annually — save 20%!',
  interval: 'year',
  intervalCount: 1,
  pricing: {
    model: 'hybrid',
    components: [
      {
        key: 'base',
        name: 'Base subscription (annual)',
        pricing: {
          model: 'flat_rate',
          amount: 47040, // $470.40 — 20% off monthly ($588)
        },
      },
      {
        key: 'seats',
        name: 'Team seats (annual)',
        pricing: {
          model: 'per_seat',
          amountPerSeat: 11520, // $115.20/yr — 20% off monthly ($144/yr)
          minSeats: 1,
          maxSeats: 100,
          allowFractional: false,
        },
      },
    ],
  },
  currency: 'usd',
  trialPeriodDays: 14,
  setupFee: 0,
  allowPause: true,
  maxPauseDurationDays: 90,
  billingAnchor: { type: 'anniversary' },
  entitlements: proPlan.entitlements, // Same entitlements as monthly
  sortOrder: 3,
  metadata: {
    tier: 'mid',
    variant: 'annual',
    savingsPercent: 20,
  },
});
```

### Example 2 — Subscribing a Customer

Subscribe a customer to a plan, handling trial setup and Stripe synchronization.

```typescript
import { SubscriptionService } from '@mcv/commerce/subscriptions';
import { db } from '@mcv/database';

const subscriptionService = new SubscriptionService(db);

// Subscribe a customer to the Pro plan with a 14-day trial
const subscription = await subscriptionService.create({
  customerId: 'cust_abc123',
  planId: proPlan.id,
  quantity: 3, // 3 seats
  paymentMethodId: 'pm_stripe_xyz789',
  // trialPeriodDays is inherited from plan (14) unless overridden
  metadata: {
    source: 'pricing_page',
    campaign: 'spring_launch_2026',
  },
  idempotencyKey: 'create_sub_cust_abc123_pro_v1',
});

console.log(`Subscription created: ${subscription.id}`);
console.log(`Status: ${subscription.status}`);           // "trialing"
console.log(`Trial ends: ${subscription.trialEndsAt}`);   // 14 days from now
console.log(`Quantity: ${subscription.quantity}`);         // 3
console.log(`Period: ${subscription.currentPeriodStart} - ${subscription.currentPeriodEnd}`);

// The subscription is now in "trialing" state.
// Events emitted:
//   - subscription.created
//   - subscription.trial_started
//
// Stripe sync:
//   - Stripe Subscription created with trial_end set
//   - Stripe Customer linked via stripeCustomerId
//
// Entitlements:
//   - All plan entitlements are immediately active (full access during trial)

// Subscribe without a trial (immediate activation)
const immediateSubscription = await subscriptionService.create({
  customerId: 'cust_def456',
  planId: proPlan.id,
  quantity: 1,
  paymentMethodId: 'pm_stripe_abc123',
  trialPeriodDays: 0, // Override plan's 14-day trial
  idempotencyKey: 'create_sub_cust_def456_pro_v1',
});

console.log(`Status: ${immediateSubscription.status}`); // "active"
console.log(`Activated: ${immediateSubscription.activatedAt}`); // now
// First billing cycle is created and charged immediately

// Subscribe with calendar billing anchor (bill on 1st of each month)
const calendarSubscription = await subscriptionService.create({
  customerId: 'cust_ghi789',
  planId: proPlan.id,
  quantity: 5,
  paymentMethodId: 'pm_stripe_def456',
  trialPeriodDays: 0,
  billingAnchor: {
    type: 'calendar',
    dayOfMonth: 1,
  },
  idempotencyKey: 'create_sub_cust_ghi789_pro_v1',
});
// First cycle is prorated from today to the 1st of next month
```

### Example 3 — Upgrading a Subscription Mid-Cycle

Upgrade from Pro to Enterprise mid-cycle with proration.

```typescript
import { SubscriptionService } from '@mcv/commerce/subscriptions';

const subscriptionService = new SubscriptionService(db);

// First, preview what the upgrade will look like
const preview = await subscriptionService.previewPlanChange({
  subscriptionId: subscription.id,
  newPlanId: enterprisePlan.id,
  timing: 'immediate',
  prorationBehavior: 'create_prorations',
});

console.log('=== Upgrade Preview ===');
console.log(`From: ${preview.fromPlan.name} ($${preview.fromPlan.pricing.components[0].pricing.amount / 100}/mo)`);
console.log(`To: ${preview.toPlan.name} ($${preview.toPlan.pricing.components[0].pricing.amount / 100}/mo)`);
console.log(`Proration credit: -$${(preview.proration.creditAmount / 100).toFixed(2)}`);
console.log(`Proration charge: +$${(preview.proration.debitAmount / 100).toFixed(2)}`);
console.log(`Net charge: $${(preview.proration.netAmount / 100).toFixed(2)}`);
console.log(`Effective: ${preview.effectiveDate}`);
console.log(`Next billing: ${preview.nextBillingDate}`);

// Output:
// === Upgrade Preview ===
// From: Pro ($49.00/mo)
// To: Enterprise ($199.00/mo)
// Proration credit: -$24.50 (15 days remaining of $49 plan)
// Proration charge: +$99.50 (15 days of $199 plan)
// Net charge: $75.00
// Effective: 2026-02-08T23:05:00Z
// Next billing: 2026-02-23T00:00:00Z

// Execute the upgrade
const planChange = await subscriptionService.changePlan({
  subscriptionId: subscription.id,
  newPlanId: enterprisePlan.id,
  timing: 'immediate',
  prorationBehavior: 'create_prorations',
  reason: 'Customer requested upgrade for additional features',
});

console.log(`Plan change: ${planChange.id}`);
console.log(`Type: ${planChange.type}`);       // "upgrade"
console.log(`Status: ${planChange.status}`);   // "applied"
console.log(`Proration: $${(planChange.proration!.netAmount / 100).toFixed(2)}`);

// Events emitted:
//   - plan_change.requested
//   - plan_change.applied
//   - entitlement.granted (for new features)
//   - billing_cycle.charged (proration amount)

// For end-of-period upgrade (no immediate charge)
const deferredChange = await subscriptionService.changePlan({
  subscriptionId: subscription.id,
  newPlanId: enterprisePlan.id,
  timing: 'end_of_period',
  prorationBehavior: 'none',
  reason: 'Scheduled upgrade for next billing cycle',
});

console.log(`Status: ${deferredChange.status}`);     // "pending"
console.log(`Effective: ${deferredChange.effectiveAt}`); // end of current period
// The change will be applied automatically when the current period ends
```

### Example 4 — Recording and Billing Metered Usage

Track API call usage and calculate usage-based charges at cycle end.

```typescript
import { UsageService, BillingService } from '@mcv/commerce/subscriptions';

const usageService = new UsageService(db);
const billingService = new BillingService(db);

// Record individual usage events (typically from API middleware)
await usageService.record({
  subscriptionId: subscription.id,
  metricKey: 'api_calls',
  quantity: 1,
  action: 'increment',
  idempotencyKey: `api_call_${requestId}`,
  properties: {
    endpoint: '/api/v1/data',
    method: 'GET',
    responseCode: 200,
  },
});

// Batch record (more efficient for high-volume metrics)
await usageService.recordBatch([
  {
    subscriptionId: subscription.id,
    metricKey: 'api_calls',
    quantity: 150,
    action: 'increment',
    idempotencyKey: `api_calls_batch_${batchId}_1`,
    timestamp: new Date('2026-02-08T12:00:00Z'),
  },
  {
    subscriptionId: subscription.id,
    metricKey: 'storage_gb',
    quantity: 12.5,
    action: 'set', // Set absolute value (not increment)
    idempotencyKey: `storage_snapshot_${batchId}`,
    timestamp: new Date('2026-02-08T12:00:00Z'),
  },
]);

// Check current usage during the cycle
const currentUsage = await usageService.getCurrentUsage(
  subscription.id,
  'api_calls'
);

console.log('=== Current API Usage ===');
for (const summary of currentUsage) {
  console.log(`Metric: ${summary.metricKey}`);
  console.log(`Total: ${summary.totalQuantity.toLocaleString()} calls`);
  console.log(`Included: ${summary.includedQuantity.toLocaleString()} calls`);
  console.log(`Overage: ${summary.overageQuantity.toLocaleString()} calls`);
  console.log(`Period: ${summary.periodStart} - ${summary.periodEnd}`);
}
// Output:
// Metric: api_calls
// Total: 12,451 calls
// Included: 10,000 calls
// Overage: 2,451 calls
// Period: 2026-01-23 - 2026-02-23

// Get real-time usage time series (for dashboard charts)
const timeSeries = await usageService.getRealtimeMetrics(
  subscription.id,
  'api_calls',
  'day'
);

for (const point of timeSeries.dataPoints) {
  console.log(`${point.timestamp.toISOString().split('T')[0]}: ${point.value} calls`);
}

// Set up a usage alert (notify at 80% of included quota)
await usageService.setAlert({
  subscriptionId: subscription.id,
  metricKey: 'api_calls',
  thresholdPercent: 80,
  notificationChannels: ['email', 'in_app'],
});

// At cycle end, aggregate usage for billing
const cycle = await billingService.getCurrentCycle(subscription.id);
const usageSummaries = await usageService.aggregateForCycle(cycle!.id);

// Generate invoice with usage charges
const invoice = await billingService.generateInvoice(cycle!.id);

console.log('=== Invoice Line Items ===');
console.log(`Base subscription: $${(4900 / 100).toFixed(2)}`);
console.log(`Seats (3): $${((1200 * 3) / 100).toFixed(2)}`);
console.log(`API overage (2,451 calls): $${((2451 * 1) / 100).toFixed(2)}`);
console.log(`Total: $${(invoice.totalAmount / 100).toFixed(2)}`);

// Output:
// Base subscription: $49.00
// Seats (3): $36.00
// API overage (2,451 calls): $24.51
// Total: $109.51
```

### Example 5 — Handling Dunning and Failed Payments

Configure and manage the payment retry process when charges fail.

```typescript
import { DunningService, BillingService } from '@mcv/commerce/subscriptions';

const dunningService = new DunningService(db);
const billingService = new BillingService(db);

// Configure dunning schedule for the tenant
await dunningService.configureSchedule({
  maxAttempts: 4,
  strategy: {
    baseDelayHours: 24,
    backoffMultiplier: 2,
    maxDelayHours: 168, // 7 days
    tryAlternatePaymentMethods: true,
    preferredRetryDays: [1, 2, 3, 4, 5], // Mon-Fri
    preferredRetryHour: 10, // 10 AM local time
  },
  gracePeriodDays: 7,
  notifyCustomer: true,
  notifications: [
    {
      dayOffset: 0,
      channel: 'email',
      templateKey: 'payment_failed_first',
    },
    {
      dayOffset: 3,
      channel: 'email',
      templateKey: 'payment_failed_reminder',
    },
    {
      dayOffset: 3,
      channel: 'in_app',
      templateKey: 'update_payment_method_banner',
    },
    {
      dayOffset: 7,
      channel: 'email',
      templateKey: 'payment_failed_urgent',
    },
    {
      dayOffset: 10,
      channel: 'email',
      templateKey: 'subscription_will_cancel',
    },
  ],
});

// When a payment fails, dunning starts automatically.
// But you can also manually inspect and manage it:

// List subscriptions currently in dunning
const dunningSubscriptions = await dunningService.listActive({
  tenantId: currentTenantId,
  limit: 50,
});

for (const entry of dunningSubscriptions) {
  console.log(`Subscription ${entry.subscriptionId}:`);
  console.log(`  Attempts: ${entry.currentAttempt}/${entry.maxAttempts}`);
  console.log(`  Amount: $${(entry.amount / 100).toFixed(2)}`);
  console.log(`  Last failure: ${entry.lastFailureCode} - ${entry.lastFailureMessage}`);
  console.log(`  Next retry: ${entry.nextRetryAt}`);
  console.log(`  Grace period ends: ${entry.gracePeriodEndsAt}`);
}

// Manually trigger a retry (e.g., after customer updates payment method)
const retryResult = await dunningService.retryNow(subscription.id);

if (retryResult.outcome === 'succeeded') {
  console.log('Payment recovered!');
  // subscription.status automatically transitions back to "active"
  // Events: dunning.recovered, payment.succeeded, subscription.recovered
} else {
  console.log(`Retry failed: ${retryResult.failureMessage}`);
  console.log(`Next automatic retry: ${retryResult.nextRetryAt}`);
}

// Handle dunning exhaustion (all retries failed)
// This is typically handled by the DunningService automatically:
//
// 1. After max attempts reached:
//    - subscription.status → "canceled" (involuntary churn)
//    - Event: dunning.exhausted
//    - Event: subscription.canceled (initiatedBy: "system")
//    - Final notification sent to customer
//
// 2. The subscription enters a grace period where:
//    - Access may be restricted (configurable)
//    - Customer can reactivate by updating payment
//    - After grace period: subscription → "expired"

// Check dunning metrics
const dunningMetrics = await dunningService.getMetrics({
  period: { start: startOfMonth, end: endOfMonth },
});

console.log('=== Dunning Metrics ===');
console.log(`Active dunning: ${dunningMetrics.activeDunning}`);
console.log(`Recovered this month: ${dunningMetrics.recovered}`);
console.log(`Recovery rate: ${dunningMetrics.recoveryRate}%`);
console.log(`Revenue recovered: $${(dunningMetrics.revenueRecovered / 100).toFixed(2)}`);
console.log(`Revenue lost: $${(dunningMetrics.revenueLost / 100).toFixed(2)}`);
console.log(`Avg attempts to recover: ${dunningMetrics.avgAttemptsToRecover}`);
```

### Example 6 — Cancellation with Win-Back Offer

Handle the cancellation flow including offboarding survey and win-back offer.

```typescript
import { CancellationService, SubscriptionService } from '@mcv/commerce/subscriptions';

const cancellationService = new CancellationService(db);
const subscriptionService = new SubscriptionService(db);

// Step 1: Preview the cancellation
const preview = await subscriptionService.previewCancellation({
  subscriptionId: subscription.id,
  reason: 'too_expensive',
  timing: 'end_of_period',
});

console.log('=== Cancellation Preview ===');
console.log(`Access ends: ${preview.accessEndDate}`);
console.log(`Refund amount: $${(preview.refundAmount / 100).toFixed(2)}`);
console.log(`Days remaining: ${preview.remainingDaysInCycle}`);
console.log(`Win-back eligible: ${preview.winBackEligible}`);

// Step 2: Initiate cancellation with survey
const cancellationRequest = await subscriptionService.cancel({
  subscriptionId: subscription.id,
  reason: 'too_expensive',
  timing: 'end_of_period',
  feedback: 'We love the product but our budget was cut. Need a cheaper option.',
  surveyResponses: [
    {
      questionId: 'q1',
      question: 'What was the primary reason for canceling?',
      answer: 'Budget constraints',
    },
    {
      questionId: 'q2',
      question: 'How likely are you to return if your budget allows?',
      answer: 'Very likely',
    },
    {
      questionId: 'q3',
      question: 'Would a discounted plan help you stay?',
      answer: 'Yes, 30% discount would work',
    },
  ],
  skipWinBack: false, // Allow win-back offer
});

console.log(`Cancellation request: ${cancellationRequest.id}`);
console.log(`Status: ${cancellationRequest.status}`); // "win_back_offered"

// The system automatically generated a win-back offer based on the reason
// and survey responses:
if (cancellationRequest.winBackOffer) {
  const offer = cancellationRequest.winBackOffer;
  console.log('=== Win-Back Offer ===');
  console.log(`Type: ${offer.type}`);           // "discount"
  console.log(`Discount: ${offer.discountPercent}%`); // 30
  console.log(`Duration: ${offer.durationCycles} cycles`); // 3
    return {
      canceled: true,
      effectiveDate: canceledSubscription.currentPeriodEnd,
      winBackOffer: winBackOffer ?? undefined,
      refundAmount: refundAmount ?? undefined,
      surveyRecorded: !!reason,
    };
  }),
});
```

---

### Example 8: Subscription Analytics — MRR Calculation & Churn Analysis

`	ypescript
// packages/commerce/subscriptions/src/analytics/mrr.ts
import { db } from '@mcv/kernel/db';
import { subscriptions, subscriptionPlans, subscriptionInvoices } from '../schema';
import { eq, and, gte, lte, sql, inArray, not, isNull } from 'drizzle-orm';
import { startOfMonth, endOfMonth, subMonths, differenceInDays, format } from 'date-fns';

// ─── MRR Snapshot ────────────────────────────────────────────────────
export interface MRRSnapshot {
  date: Date;
  totalMRR: number;
  newMRR: number;
  expansionMRR: number;
  contractionMRR: number;
  churnedMRR: number;
  reactivationMRR: number;
  netNewMRR: number;
}

export interface ChurnAnalysis {
  period: string;
  totalSubscribers: number;
  churnedSubscribers: number;
  churnRate: number;
  revenueChurnRate: number;
  retentionRate: number;
  averageLifetimeMonths: number;
  topCancellationReasons: Array<{ reason: string; count: number; percentage: number }>;
}

/**
 * Calculate Monthly Recurring Revenue for a tenant.
 * Normalizes all billing intervals to monthly equivalents.
 */
export async function calculateMRR(
  tenantId: string,
  asOfDate: Date = new Date()
): Promise<MRRSnapshot> {
  const activeStatuses = ['active', 'trialing', 'past_due'];

  // Get all active subscriptions with their plans
  const activeSubs = await db
    .select({
      id: subscriptions.id,
      planId: subscriptions.planId,
      status: subscriptions.status,
      quantity: subscriptions.quantity,
      priceAmount: subscriptionPlans.priceAmount,
      billingInterval: subscriptionPlans.billingInterval,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(
      and(
        eq(subscriptions.tenantId, tenantId),
        inArray(subscriptions.status, activeStatuses)
      )
    );

  // Normalize to monthly revenue
  const normalizeToMonthly = (amount: number, interval: string): number => {
    switch (interval) {
      case 'day': return amount * 30;
      case 'week': return amount * (52 / 12);
      case 'month': return amount;
      case 'quarter': return amount / 3;
      case 'year': return amount / 12;
      default: return amount;
    }
  };

  let totalMRR = 0;
  for (const sub of activeSubs) {
    const monthlyAmount = normalizeToMonthly(
      sub.priceAmount * (sub.quantity ?? 1),
      sub.billingInterval
    );
    totalMRR += monthlyAmount;
  }

  // Calculate MRR movements for the current month
  const monthStart = startOfMonth(asOfDate);
  const monthEnd = endOfMonth(asOfDate);
  const prevMonthStart = startOfMonth(subMonths(asOfDate, 1));
  const prevMonthEnd = endOfMonth(subMonths(asOfDate, 1));

  // New MRR: subscriptions created this month
  const newSubs = activeSubs.filter(
    (s) => s.createdAt >= monthStart && s.createdAt <= monthEnd
  );
  const newMRR = newSubs.reduce(
    (sum, s) => sum + normalizeToMonthly(s.priceAmount * (s.quantity ?? 1), s.billingInterval),
    0
  );

  // Churned MRR: subscriptions canceled this month
  const churnedSubs = await db
    .select({
      priceAmount: subscriptionPlans.priceAmount,
      billingInterval: subscriptionPlans.billingInterval,
      quantity: subscriptions.quantity,
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(
      and(
        eq(subscriptions.tenantId, tenantId),
        eq(subscriptions.status, 'canceled'),
        gte(subscriptions.canceledAt, monthStart),
        lte(subscriptions.canceledAt, monthEnd)
      )
    );

  const churnedMRR = churnedSubs.reduce(
    (sum, s) => sum + normalizeToMonthly(s.priceAmount * (s.quantity ?? 1), s.billingInterval),
    0
  );

  // Expansion & Contraction MRR from plan changes
  const upgrades = await db.execute(sql`
    SELECT COALESCE(SUM(new_mrr - old_mrr), 0) as expansion
    FROM subscription_plan_changes
    WHERE tenant_id = ${tenantId}`
      AND changed_at >= ${monthStart}`
      AND changed_at <= ${monthEnd}`
      AND new_mrr > old_mrr
  `);
  const expansionMRR = Number(upgrades.rows[0]?.expansion ?? 0);

  const downgrades = await db.execute(sql`
    SELECT COALESCE(SUM(old_mrr - new_mrr), 0) as contraction
    FROM subscription_plan_changes
    WHERE tenant_id = ${tenantId}`
      AND changed_at >= ${monthStart}`
      AND changed_at <= ${monthEnd}`
      AND new_mrr < old_mrr
  `);
  const contractionMRR = Number(downgrades.rows[0]?.contraction ?? 0);

  // Reactivation MRR
  const reactivations = await db
    .select({
      priceAmount: subscriptionPlans.priceAmount,
      billingInterval: subscriptionPlans.billingInterval,
      quantity: subscriptions.quantity,
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(
      and(
        eq(subscriptions.tenantId, tenantId),
        inArray(subscriptions.status, activeStatuses),
        gte(subscriptions.reactivatedAt, monthStart),
        lte(subscriptions.reactivatedAt, monthEnd)
      )
    );

  const reactivationMRR = reactivations.reduce(
    (sum, s) => sum + normalizeToMonthly(s.priceAmount * (s.quantity ?? 1), s.billingInterval),
    0
  );

  const netNewMRR = newMRR + expansionMRR + reactivationMRR - churnedMRR - contractionMRR;

  return {
    date: asOfDate,
    totalMRR: Math.round(totalMRR),
    newMRR: Math.round(newMRR),
    expansionMRR: Math.round(expansionMRR),
    contractionMRR: Math.round(contractionMRR),
    churnedMRR: Math.round(churnedMRR),
    reactivationMRR: Math.round(reactivationMRR),
    netNewMRR: Math.round(netNewMRR),
  };
}

/**
 * Analyze churn over a given period for a tenant.
 */
export async function analyzeChurn(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ChurnAnalysis> {
  // Total subscribers at start of period
  const totalAtStart = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.tenantId, tenantId),
        lte(subscriptions.createdAt, periodStart),
        not(
          and(
            eq(subscriptions.status, 'canceled'),
            lte(subscriptions.canceledAt, periodStart)
          )
        )
      )
    );

  const totalSubscribers = Number(totalAtStart[0]?.count ?? 0);

  // Churned during period
  const churned = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.tenantId, tenantId),
        eq(subscriptions.status, 'canceled'),
        gte(subscriptions.canceledAt, periodStart),
        lte(subscriptions.canceledAt, periodEnd)
      )
    );

  const churnedSubscribers = Number(churned[0]?.count ?? 0);
  const churnRate = totalSubscribers > 0 ? (churnedSubscribers / totalSubscribers) * 100 : 0;
  const retentionRate = 100 - churnRate;

  // Top cancellation reasons
  const reasons = await db.execute(sql`
    SELECT cancellation_reason as reason, count(*) as count
    FROM subscriptions
    WHERE tenant_id = ${tenantId}`
      AND status = 'canceled'
      AND canceled_at >= ${periodStart}`
      AND canceled_at <= ${periodEnd}`
      AND cancellation_reason IS NOT NULL
    GROUP BY cancellation_reason
    ORDER BY count DESC
    LIMIT 10
  `);

  const topCancellationReasons = reasons.rows.map((r: any) => ({
    reason: r.reason,
    count: Number(r.count),
    percentage: churnedSubscribers > 0 ? (Number(r.count) / churnedSubscribers) * 100 : 0,
  }));

  // Average lifetime
  const lifetimes = await db.execute(sql`
    SELECT AVG(
      EXTRACT(EPOCH FROM (canceled_at - created_at)) / 86400 / 30
    ) as avg_lifetime_months
    FROM subscriptions
    WHERE tenant_id = ${tenantId}`
      AND status = 'canceled'
      AND canceled_at IS NOT NULL
  `);

  const averageLifetimeMonths = Number(lifetimes.rows[0]?.avg_lifetime_months ?? 0);

  // Revenue churn rate
  const normalizeToMonthly = (amount: number, interval: string): number => {
    switch (interval) {
      case 'month': return amount;
      case 'quarter': return amount / 3;
      case 'year': return amount / 12;
      default: return amount;
    }
  };

  const churnedRevenue = await db
    .select({
      priceAmount: subscriptionPlans.priceAmount,
      billingInterval: subscriptionPlans.billingInterval,
      quantity: subscriptions.quantity,
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(
      and(
        eq(subscriptions.tenantId, tenantId),
        eq(subscriptions.status, 'canceled'),
        gte(subscriptions.canceledAt, periodStart),
        lte(subscriptions.canceledAt, periodEnd)
      )
    );

  const churnedMRR = churnedRevenue.reduce(
    (sum, s) => sum + normalizeToMonthly(s.priceAmount * (s.quantity ?? 1), s.billingInterval),
    0
  );

  // Total MRR at period start (approximate)
  const allActiveSubs = await db
    .select({
      priceAmount: subscriptionPlans.priceAmount,
      billingInterval: subscriptionPlans.billingInterval,
      quantity: subscriptions.quantity,
    })
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(
      and(
        eq(subscriptions.tenantId, tenantId),
        lte(subscriptions.createdAt, periodStart),
        not(
          and(
            eq(subscriptions.status, 'canceled'),
            lte(subscriptions.canceledAt, periodStart)
          )
        )
      )
    );

  const totalMRRAtStart = allActiveSubs.reduce(
    (sum, s) => sum + normalizeToMonthly(s.priceAmount * (s.quantity ?? 1), s.billingInterval),
    0
  );

  const revenueChurnRate = totalMRRAtStart > 0 ? (churnedMRR / totalMRRAtStart) * 100 : 0;

  return {
    period: ` to `,
    totalSubscribers,
    churnedSubscribers,
    churnRate: Math.round(churnRate * 100) / 100,
    revenueChurnRate: Math.round(revenueChurnRate * 100) / 100,
    retentionRate: Math.round(retentionRate * 100) / 100,
    averageLifetimeMonths: Math.round(averageLifetimeMonths * 10) / 10,
    topCancellationReasons,
  };
}
`


---

## Error Codes

All subscription error codes follow the pattern SUB_XXX and extend the standard MCV DomainError base class from @mcv/kernel/errors.

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| SUB_001 | PLAN_NOT_FOUND | 404 | The requested subscription plan does not exist or is not available in the current tenant. |
| SUB_002 | PLAN_INACTIVE | 410 | The subscription plan has been deactivated and is no longer available for new subscriptions. |
| SUB_003 | INVALID_STATE_TRANSITION | 409 | The requested state change is not allowed from the subscription's current state (e.g., cannot activate a canceled subscription directly). |
| SUB_004 | PAYMENT_FAILED | 402 | The payment method on file was declined or the charge could not be processed. Dunning flow will be initiated automatically. |
| SUB_005 | PAYMENT_METHOD_REQUIRED | 402 | A valid payment method must be attached before creating or reactivating a subscription. |
| SUB_006 | ALREADY_CANCELED | 409 | The subscription has already been canceled. Use reactivation flow to restore it. |
| SUB_007 | ALREADY_ACTIVE | 409 | The subscription is already in an active state. No action required. |
| SUB_008 | TRIAL_EXPIRED | 403 | The trial period has ended and no payment method was provided. Subscription cannot continue without payment. |
| SUB_009 | TRIAL_NOT_AVAILABLE | 403 | This plan does not offer a trial period, or the subscriber has already used their trial for this plan. |
| SUB_010 | USAGE_LIMIT_EXCEEDED | 429 | The subscriber has exceeded the metered usage limit for the current billing cycle. |
| SUB_011 | USAGE_FEATURE_NOT_METERED | 400 | Attempted to report usage on a feature that is not configured for metered billing. |
| SUB_012 | DOWNGRADE_RESTRICTED | 403 | Downgrade to the requested plan is not allowed due to current feature usage exceeding the target plan's limits. |
| SUB_013 | UPGRADE_REQUIRED | 403 | The requested action requires a higher-tier subscription plan. |
| SUB_014 | SEAT_LIMIT_EXCEEDED | 403 | The subscription has reached its maximum allowed seat count. Upgrade the plan or purchase additional seats. |
| SUB_015 | SEAT_MINIMUM_NOT_MET | 400 | Cannot reduce seats below the plan's minimum seat requirement or below the number of currently active users. |
| SUB_016 | PAUSE_NOT_ALLOWED | 403 | This subscription plan does not allow pausing, or the subscription has already been paused the maximum number of times. |
| SUB_017 | PAUSE_DURATION_EXCEEDED | 400 | The requested pause duration exceeds the maximum allowed pause period for this plan. |
| SUB_018 | ENTITLEMENT_CHECK_FAILED | 403 | The subscriber does not have the required entitlement to access this feature or resource. |
| SUB_019 | BILLING_CYCLE_MISMATCH | 400 | The requested billing interval change is not supported for this plan or requires a plan change. |
| SUB_020 | PRORATION_CALCULATION_ERROR | 500 | Failed to calculate proration amount for the plan change. Contact support if this persists. |
| SUB_021 | WEBHOOK_SIGNATURE_INVALID | 401 | The incoming webhook signature could not be verified. The event will not be processed. |
| SUB_022 | WEBHOOK_EVENT_STALE | 409 | The webhook event has already been processed or is older than the current subscription state. |
| SUB_023 | COUPON_INVALID | 400 | The provided coupon code is invalid, expired, or not applicable to the selected plan. |
| SUB_024 | COUPON_ALREADY_APPLIED | 409 | A coupon has already been applied to this subscription. Remove the existing coupon first. |
| SUB_025 | DUNNING_IN_PROGRESS | 409 | The subscription is currently in a dunning (retry) cycle. State changes are restricted until payment resolves or dunning exhausts. |
| SUB_026 | CANCEL_PERIOD_LOCKED | 403 | The subscription is within a contractual lock-in period and cannot be canceled without an early termination fee. |
| SUB_027 | REACTIVATION_WINDOW_EXPIRED | 410 | The grace period for reactivation has expired. The subscriber must create a new subscription. |
| SUB_028 | ADDON_NOT_COMPATIBLE | 400 | The requested add-on is not compatible with the subscriber's current plan. |
| SUB_029 | INVOICE_GENERATION_FAILED | 500 | Failed to generate the invoice for this billing cycle. The system will retry automatically. |
| SUB_030 | STRIPE_SYNC_FAILED | 502 | Failed to synchronize subscription state with Stripe. The local state may be inconsistent until the next webhook reconciliation. |
| SUB_031 | TENANT_BILLING_DISABLED | 403 | Billing has been disabled for this tenant. Contact platform administrator. |
| SUB_032 | CONCURRENT_MODIFICATION | 409 | Another process is currently modifying this subscription. Retry the operation. |

### Error Response Format

`json
{
  "error": {
    "code": "SUB_012",
    "name": "DOWNGRADE_RESTRICTED",
    "message": "Cannot downgrade to 'starter' plan: current storage usage (45GB) exceeds target plan limit (10GB)",
    "details": {
      "subscriptionId": "sub_abc123",
      "currentPlan": "professional",
      "targetPlan": "starter",
      "blockers": [
        {
          "feature": "storage",
          "currentUsage": 45000000000,
          "targetLimit": 10000000000,
          "unit": "bytes"
        }
      ]
    },
    "httpStatus": 403,
    "retryable": false,
    "documentationUrl": "https://docs.mcv.dev/errors/SUB_012"
  }
}
`

### Error Handling Best Practices

`	ypescript
import { SubscriptionError, isRetryable } from '@mcv/commerce/subscriptions';

try {
  await subscriptionService.changePlan(subId, newPlanId);
} catch (error) {
  if (error instanceof SubscriptionError) {
    switch (error.code) {
      case 'SUB_004': // Payment failed
        // Redirect user to update payment method
        await redirectToPaymentUpdate(error.details.subscriptionId);
        break;
      case 'SUB_012': // Downgrade restricted
        // Show user what they need to reduce
        await showDowngradeBlockers(error.details.blockers);
        break;
      case 'SUB_032': // Concurrent modification
        // Retry with exponential backoff
        if (isRetryable(error)) {
          await retryWithBackoff(() => subscriptionService.changePlan(subId, newPlanId));
        }
        break;
      default:
        logger.error('Subscription operation failed', { error });
        throw error;
    }
  }
}
`


---

## Security

### Access Control Matrix

| Operation | Subscriber | Billing Admin | Tenant Admin | API (Service Key) |
|-----------|:----------:|:-------------:|:------------:|:-----------------:|
| View own subscription | ✅ | ✅ | ✅ | ✅ |
| View all subscriptions | ❌ | ✅ | ✅ | ✅ |
| Create subscription | ✅ | ✅ | ✅ | ✅ |
| Cancel own subscription | ✅ | ✅ | ✅ | ✅ |
| Cancel any subscription | ❌ | ✅ | ✅ | ✅ |
| Change own plan | ✅ | ✅ | ✅ | ✅ |
| Change any plan | ❌ | ✅ | ✅ | ✅ |
| Pause subscription | ✅ | ✅ | ✅ | ✅ |
| Manage seats | ✅ (own) | ✅ | ✅ | ✅ |
| View invoices (own) | ✅ | ✅ | ✅ | ✅ |
| View all invoices | ❌ | ✅ | ✅ | ✅ |
| Issue refund | ❌ | ✅ | ✅ | ✅ |
| Apply coupon | ✅ | ✅ | ✅ | ✅ |
| Create/edit plans | ❌ | ❌ | ✅ | ✅ |
| Configure dunning | ❌ | ❌ | ✅ | ✅ |
| View analytics/MRR | ❌ | ✅ | ✅ | ✅ |
| Manage entitlements | ❌ | ❌ | ✅ | ✅ |
| Process webhooks | ❌ | ❌ | ❌ | ✅ |
| Override billing cycle | ❌ | ❌ | ✅ | ✅ |
| Export subscription data | ❌ | ✅ | ✅ | ✅ |

### Row-Level Security (RLS) Policies

`sql
-- Subscribers can only view and manage their own subscriptions
CREATE POLICY subscription_subscriber_select ON subscriptions
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND subscriber_id = current_setting('app.user_id')::uuid
  );

CREATE POLICY subscription_subscriber_update ON subscriptions
  FOR UPDATE
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND subscriber_id = current_setting('app.user_id')::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND subscriber_id = current_setting('app.user_id')::uuid
  );

-- Billing admins can view all subscriptions within their tenant
CREATE POLICY subscription_billing_admin_select ON subscriptions
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = current_setting('app.tenant_id')::uuid
        AND user_id = current_setting('app.user_id')::uuid
        AND role IN ('billing_admin', 'admin', 'owner')
    )
  );

-- Tenant admins have full access within their tenant
CREATE POLICY subscription_admin_all ON subscriptions
  FOR ALL
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND EXISTS (
      SELECT 1 FROM tenant_members
      WHERE tenant_id = current_setting('app.tenant_id')::uuid
        AND user_id = current_setting('app.user_id')::uuid
        AND role IN ('admin', 'owner')
    )
  );

-- Plans are readable by all authenticated users within a tenant
CREATE POLICY plan_tenant_select ON subscription_plans
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND is_active = true
  );

-- Invoice access restricted to subscriber or billing admin
CREATE POLICY invoice_access ON subscription_invoices
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND (
      subscriber_id = current_setting('app.user_id')::uuid
      OR EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = current_setting('app.tenant_id')::uuid
          AND user_id = current_setting('app.user_id')::uuid
          AND role IN ('billing_admin', 'admin', 'owner')
      )
    )
  );

-- Usage records: subscribers see own, admins see all
CREATE POLICY usage_record_access ON subscription_usage_records
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND (
      subscriber_id = current_setting('app.user_id')::uuid
      OR EXISTS (
        SELECT 1 FROM tenant_members
        WHERE tenant_id = current_setting('app.tenant_id')::uuid
          AND user_id = current_setting('app.user_id')::uuid
          AND role IN ('billing_admin', 'admin', 'owner')
      )
    )
  );
`

### Payment Data Protection (PCI Compliance)

> **This module does NOT store raw payment card data.** All sensitive payment information is handled by Stripe and never touches MCV servers.

| Data Type | Storage Location | MCV Stores? | Notes |
|-----------|-----------------|:-----------:|-------|
| Card numbers (PAN) | Stripe only | ❌ | Never transmitted to MCV |
| CVV/CVC | Stripe only | ❌ | Never transmitted to MCV |
| Stripe Customer ID | MCV database | ✅ | Non-sensitive reference token |
| Stripe Subscription ID | MCV database | ✅ | Non-sensitive reference token |
| Payment Method ID | MCV database | ✅ | Tokenized reference, not card data |
| Last 4 digits | MCV database | ✅ | For display purposes only |
| Card brand | MCV database | ✅ | For display purposes (Visa, MC, etc.) |
| Invoice PDFs | Stripe-hosted URL | ❌ | Linked, not stored |
| Billing address | MCV database | ✅ | Encrypted at rest via Supabase |

**Security measures:**
- All Stripe API calls use TLS 1.2+
- Stripe webhook signatures verified on every event (SUB_021 on failure)
- Payment method tokens are scoped to the Stripe customer and cannot be used externally
- Billing-sensitive columns encrypted at rest via Supabase's transparent data encryption
- Audit logs record all subscription state changes with actor identity
- PII fields (email, name, address) follow @mcv/identity data retention policies

### Subscription Manipulation Prevention

`	ypescript
// Anti-fraud checks built into subscription operations
const subscriptionGuards = {
  // Prevent trial abuse: one trial per plan per user (across tenants)
  trialAbusePrevention: async (userId: string, planId: string) => {
    const previousTrials = await db
      .select({ count: sql<number>count(*) })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, userId),
          eq(subscriptions.planId, planId),
          eq(subscriptions.hadTrial, true)
        )
      );
    if (Number(previousTrials[0].count) > 0) {
      throw new SubscriptionError('SUB_009', 'Trial already used for this plan');
    }
  },

  // Prevent rapid plan cycling (gaming proration)
  planCyclingPrevention: async (subscriptionId: string) => {
    const recentChanges = await db
      .select({ count: sql<number>count(*) })
      .from(subscriptionPlanChanges)
      .where(
        and(
          eq(subscriptionPlanChanges.subscriptionId, subscriptionId),
          gte(subscriptionPlanChanges.changedAt, subDays(new Date(), 7))
        )
      );
    if (Number(recentChanges[0].count) >= 3) {
      throw new SubscriptionError('SUB_032', 'Too many plan changes in 7 days');
    }
  },

  // Prevent concurrent modifications via optimistic locking
  optimisticLock: async (subscriptionId: string, expectedVersion: number) => {
    const result = await db
      .update(subscriptions)
      .set({ version: sqlersion + 1 })
      .where(
        and(
          eq(subscriptions.id, subscriptionId),
          eq(subscriptions.version, expectedVersion)
        )
      )
      .returning();
    if (result.length === 0) {
      throw new SubscriptionError('SUB_032', 'Concurrent modification detected');
    }
    return result[0];
  },
};
`

### Rate Limiting

| Endpoint | Authenticated | Unauthenticated | Window | Notes |
|----------|:------------:|:---------------:|:------:|-------|
| subscription.create | 10 req | N/A | 1 hour | Per user, prevents mass creation |
| subscription.changePlan | 5 req | N/A | 1 hour | Per subscription |
| subscription.cancel | 5 req | N/A | 1 hour | Per user |
| subscription.reactivate | 5 req | N/A | 1 hour | Per subscription |
| subscription.updateSeats | 20 req | N/A | 1 hour | Per subscription |
| usage.report | 1000 req | N/A | 1 minute | Per subscription, high volume |
| usage.query | 100 req | N/A | 1 minute | Per user |
| plans.list | 100 req | 20 req | 1 minute | Public plans are cacheable |
| invoices.list | 60 req | N/A | 1 minute | Per user |
| nalytics.mrr | 10 req | N/A | 1 minute | Expensive query |
| webhooks.stripe | 500 req | 500 req | 1 minute | Stripe IP allowlist applied |


---

## Environment Variables

### Stripe Configuration

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `STRIPE_SECRET_KEY` | ✅ | — | Stripe secret API key (`sk_live_...` or `sk_test_...`). Used for all server-side Stripe operations. |
| `STRIPE_PUBLISHABLE_KEY` | ✅ | — | Stripe publishable key (`pk_live_...` or `pk_test_...`). Sent to the client for Stripe Elements. |
| `STRIPE_WEBHOOK_SECRET` | ✅ | — | Webhook endpoint signing secret (`whsec_...`). Used to verify incoming Stripe events. |
| `STRIPE_API_VERSION` | ❌ | `2024-04-10` | Pinned Stripe API version. Ensures consistent behavior across deployments. |

### Billing Configuration

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `SUBSCRIPTION_DEFAULT_CURRENCY` | ❌ | `usd` | Default currency for new subscription plans (ISO 4217 code). |
| `SUBSCRIPTION_PRORATION_BEHAVIOR` | ❌ | `create_prorations` | How plan changes are prorated: `create_prorations`, `none`, or `always_invoice`. |
| `SUBSCRIPTION_COLLECTION_METHOD` | ❌ | `charge_automatically` | Default collection method: `charge_automatically` or `send_invoice`. |
| `SUBSCRIPTION_INVOICE_DAYS_UNTIL_DUE` | ❌ | `30` | Days until invoice is due when using `send_invoice` collection. |
| `SUBSCRIPTION_TAX_BEHAVIOR` | ❌ | `exclusive` | Tax behavior: `exclusive`, `inclusive`, or `unspecified`. |
| `SUBSCRIPTION_BILLING_ANCHOR_DAY` | ❌ | — | Day of month (1-28) to anchor billing cycles. Omit for subscription-start anchoring. |

### Dunning Configuration

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `DUNNING_MAX_RETRY_ATTEMPTS` | ❌ | `4` | Maximum number of payment retry attempts before cancellation. |
| `DUNNING_RETRY_SCHEDULE_DAYS` | ❌ | `1,3,5,7` | Comma-separated days after failure to retry payment (e.g., retry on day 1, 3, 5, 7). |
| `DUNNING_GRACE_PERIOD_DAYS` | ❌ | `7` | Days after final failed retry before automatic cancellation. |
| `DUNNING_NOTIFY_ON_EACH_RETRY` | ❌ | `true` | Send email notification to subscriber on each retry attempt. |
| `DUNNING_DOWNGRADE_PLAN_ID` | ❌ | — | Plan to downgrade to instead of canceling. Omit to cancel on dunning exhaustion. |

### Trial Configuration

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `SUBSCRIPTION_DEFAULT_TRIAL_DAYS` | ❌ | `14` | Default trial period in days when plan doesn't specify one. |
| `SUBSCRIPTION_TRIAL_REQUIRES_PAYMENT` | ❌ | `false` | Whether to require a payment method to start a trial. |
| `SUBSCRIPTION_TRIAL_END_BEHAVIOR` | ❌ | `cancel` | What happens when trial ends without payment: `cancel` or `pause`. |
| `SUBSCRIPTION_ONE_TRIAL_PER_PLAN` | ❌ | `true` | Enforce one trial per user per plan across the platform. |

### Usage & Metering

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `USAGE_AGGREGATION_INTERVAL` | ❌ | `hour` | How frequently to aggregate usage records: `minute`, `hour`, `day`. |
| `USAGE_REPORT_BATCH_SIZE` | ❌ | `100` | Maximum usage records per batch report to Stripe. |
| `USAGE_SYNC_CRON` | ❌ | `*/15 * * * *` | Cron expression for syncing usage records to Stripe Billing. |
| `USAGE_OVERAGE_BEHAVIOR` | ❌ | `charge` | What to do when usage exceeds plan limits: `charge`, `block`, or `notify`. |

### Webhooks & Events

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `SUBSCRIPTION_WEBHOOK_TOLERANCE_SECONDS` | ❌ | `300` | Maximum age (seconds) of webhook events to accept. Older events are rejected. |
| `SUBSCRIPTION_EVENT_BUS_TOPIC` | ❌ | `commerce.subscriptions` | Event bus topic prefix for subscription domain events. |
| `SUBSCRIPTION_EMIT_ANALYTICS_EVENTS` | ❌ | `true` | Whether to emit analytics events for subscription state changes. |

### Analytics

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `MRR_CACHE_TTL_SECONDS` | ❌ | `300` | Cache TTL for MRR calculations. Set to 0 to disable caching. |
| `CHURN_ANALYSIS_LOOKBACK_MONTHS` | ❌ | `12` | Default lookback period for churn analysis reports. |


---

## Dependencies

### Internal Packages

| Package | Version | Purpose | Import Examples |
|---------|---------|---------|-----------------|
| `@mcv/kernel` | `workspace:*` | Core utilities, database client, error base classes, event bus, configuration loader | `db`, `DomainError`, `eventBus`, `config` |
| `@mcv/identity` | `workspace:*` | User identity, authentication context, session management | `getCurrentUser`, `requireAuth`, `AuthContext` |
| `@mcv/fabric` | `workspace:*` | Multi-tenant context, tenant resolution, RLS session variables | `withTenant`, `TenantContext`, `setRLSContext` |
| `@mcv/finance/billing` | `workspace:*` | Shared billing primitives, invoice generation, tax calculation | `generateInvoice`, `calculateTax`, `BillingAddress` |
| `@mcv/commerce/payments` | `workspace:*` | Payment processing, Stripe customer management, payment method CRUD | `createStripeCustomer`, `attachPaymentMethod`, `chargeCustomer` |
| `@mcv/commerce/catalog` | `workspace:*` | Product catalog integration for subscription-linked products | `Product`, `ProductVariant`, `resolveProduct` |
| `@mcv/engagement/points` | `workspace:*` | Loyalty points integration — award points on subscription milestones | `awardPoints`, `PointsTransaction` |
| `@mcv/engagement/notifications` | `workspace:*` | Notification delivery for billing alerts, dunning emails, renewal reminders | `sendNotification`, `NotificationTemplate` |
| `@mcv/analytics/events` | `workspace:*` | Analytics event tracking for subscription lifecycle events | `trackEvent`, `AnalyticsEvent` |
| `@mcv/shared/temporal` | `workspace:*` | Date/time utilities, billing period calculations, timezone handling | `calculateBillingPeriod`, `nextBillingDate` |

### External Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `stripe` | `^14.x` | Stripe Node.js SDK — subscription management, billing, webhooks, usage-based metering |
| `drizzle-orm` | `^0.34.x` | Type-safe ORM for PostgreSQL schema definitions, queries, and migrations |
| `@trpc/server` | `^10.x` | Type-safe API router for subscription endpoints |
| `zod` | `^3.x` | Runtime schema validation for API inputs, plan configurations, and webhook payloads |
| `date-fns` | `^3.x` | Date manipulation for billing cycles, trial periods, proration calculations |
| `decimal.js` | `^10.x` | Arbitrary-precision decimal arithmetic for currency and proration calculations |
| `cron-parser` | `^4.x` | Parse cron expressions for usage sync scheduling |
| `p-retry` | `^6.x` | Retry logic with exponential backoff for Stripe API calls and webhook processing |
| `p-queue` | `^8.x` | Concurrency-limited queue for batch operations (usage sync, bulk invoicing) |
| `nanoid` | `^5.x` | Generate compact, URL-safe unique IDs for subscription and invoice identifiers |
| `superjson` | `^2.x` | Serialization for tRPC, handling Date objects and BigInt in subscription data |

### Dependency Graph

`
@mcv/commerce/subscriptions
├── @mcv/kernel (core)
│   ├── database client (Drizzle + Supabase)
│   ├── event bus
│   └── error handling
├── @mcv/identity (auth)
│   └── user context & sessions
├── @mcv/fabric (tenancy)
│   └── tenant resolution & RLS
├── @mcv/finance/billing (billing primitives)
│   └── invoicing & tax
├── @mcv/commerce/payments (payment processing)
│   └── Stripe customer & payment methods
├── @mcv/commerce/catalog (products)
│   └── product linkage
├── @mcv/engagement/points (loyalty)
│   └── milestone rewards
├── @mcv/engagement/notifications (comms)
│   └── billing alerts & dunning emails
├── @mcv/analytics/events (tracking)
│   └── lifecycle event tracking
└── @mcv/shared/temporal (dates)
    └── billing period math
`



---

## Testing

### Unit Tests

#### State Machine Tests

```typescript
// packages/commerce/subscriptions/src/__tests__/state-machine.test.ts
import { describe, it, expect } from 'vitest';
import {
  SubscriptionStateMachine,
  SubscriptionState,
  SubscriptionEvent,
} from '../state-machine';

describe('SubscriptionStateMachine', () => {
  const sm = new SubscriptionStateMachine();

  describe('valid transitions', () => {
    it.each([
      ['trialing', 'TRIAL_END', 'active'],
      ['trialing', 'TRIAL_EXPIRE', 'expired'],
      ['trialing', 'CANCEL', 'canceled'],
      ['active', 'PAYMENT_FAILED', 'past_due'],
      ['active', 'CANCEL', 'canceled'],
      ['active', 'PAUSE', 'paused'],
      ['past_due', 'PAYMENT_SUCCESS', 'active'],
      ['past_due', 'DUNNING_EXHAUST', 'canceled'],
      ['past_due', 'CANCEL', 'canceled'],
      ['paused', 'RESUME', 'active'],
      ['paused', 'CANCEL', 'canceled'],
      ['canceled', 'REACTIVATE', 'active'],
      ['expired', 'REACTIVATE', 'active'],
    ] as [SubscriptionState, SubscriptionEvent, SubscriptionState][])(
      'transitions from %s on %s to %s',
      (from, event, expected) => {
        expect(sm.transition(from, event)).toBe(expected);
      }
    );
  });

  describe('invalid transitions', () => {
    it.each([
      ['active', 'TRIAL_END'],
      ['active', 'PAYMENT_SUCCESS'],
      ['canceled', 'PAUSE'],
      ['canceled', 'PAYMENT_FAILED'],
      ['paused', 'PAYMENT_FAILED'],
      ['trialing', 'RESUME'],
      ['expired', 'PAUSE'],
    ] as [SubscriptionState, SubscriptionEvent][])(
      'rejects transition from %s on %s',
      (from, event) => {
        expect(() => sm.transition(from, event)).toThrow('SUB_003');
      }
    );
  });

  describe('transition guards', () => {
    it('rejects pause when plan disallows it', () => {
      const context = { planAllowsPause: false };
      expect(() => sm.transition('active', 'PAUSE', context)).toThrow('SUB_016');
    });

    it('rejects reactivation when grace period expired', () => {
      const context = { gracePeriodExpired: true };
      expect(() => sm.transition('canceled', 'REACTIVATE', context)).toThrow('SUB_027');
    });
  });
});
```

#### Proration Calculation Tests

```typescript
// packages/commerce/subscriptions/src/__tests__/proration.test.ts
import { describe, it, expect } from 'vitest';
import { calculateProration } from '../billing/proration';

describe('calculateProration', () => {
  const baseDate = new Date('2025-03-15T00:00:00Z');

  it('calculates upgrade proration correctly', () => {
    const result = calculateProration({
      currentPlanPrice: 2000, // $20/mo
      newPlanPrice: 5000,     // $50/mo
      currentPeriodStart: new Date('2025-03-01'),
      currentPeriodEnd: new Date('2025-03-31'),
      changeDate: new Date('2025-03-15'),
    });

    // 16 remaining days out of 30 = ~53.3%
    // Credit: $20 * 16/30 = $10.67
    // Charge: $50 * 16/30 = $26.67
    // Net: $26.67 - $10.67 = $16.00
    expect(result.creditAmount).toBe(1067);
    expect(result.chargeAmount).toBe(2667);
    expect(result.netAmount).toBe(1600);
    expect(result.direction).toBe('upgrade');
  });

  it('calculates downgrade proration correctly', () => {
    const result = calculateProration({
      currentPlanPrice: 5000,
      newPlanPrice: 2000,
      currentPeriodStart: new Date('2025-03-01'),
      currentPeriodEnd: new Date('2025-03-31'),
      changeDate: new Date('2025-03-15'),
    });

    expect(result.creditAmount).toBe(2667);
    expect(result.chargeAmount).toBe(1067);
    expect(result.netAmount).toBe(-1600);
    expect(result.direction).toBe('downgrade');
  });

  it('handles same-price plan changes', () => {
    const result = calculateProration({
      currentPlanPrice: 2000,
      newPlanPrice: 2000,
      currentPeriodStart: new Date('2025-03-01'),
      currentPeriodEnd: new Date('2025-03-31'),
      changeDate: new Date('2025-03-15'),
    });

    expect(result.netAmount).toBe(0);
    expect(result.direction).toBe('lateral');
  });

  it('handles change on first day of period', () => {
    const result = calculateProration({
      currentPlanPrice: 2000,
      newPlanPrice: 5000,
      currentPeriodStart: new Date('2025-03-01'),
      currentPeriodEnd: new Date('2025-03-31'),
      changeDate: new Date('2025-03-01'),
    });

    // Full period remaining â€” credit full old, charge full new
    expect(result.creditAmount).toBe(2000);
    expect(result.chargeAmount).toBe(5000);
    expect(result.netAmount).toBe(3000);
  });

  it('handles change on last day of period', () => {
    const result = calculateProration({
      currentPlanPrice: 2000,
      newPlanPrice: 5000,
      currentPeriodStart: new Date('2025-03-01'),
      currentPeriodEnd: new Date('2025-03-31'),
      changeDate: new Date('2025-03-31'),
    });

    // 0 remaining days â€” minimal proration
    expect(result.creditAmount).toBe(0);
    expect(result.chargeAmount).toBe(0);
    expect(result.netAmount).toBe(0);
  });

  it('uses decimal.js for precision â€” no floating point drift', () => {
    const result = calculateProration({
      currentPlanPrice: 999,  // $9.99
      newPlanPrice: 2999,     // $29.99
      currentPeriodStart: new Date('2025-02-01'),
      currentPeriodEnd: new Date('2025-02-28'),
      changeDate: new Date('2025-02-10'),
    });

    // Verify no floating point artifacts (amounts should be clean integers)
    expect(Number.isInteger(result.creditAmount)).toBe(true);
    expect(Number.isInteger(result.chargeAmount)).toBe(true);
    expect(Number.isInteger(result.netAmount)).toBe(true);
  });

  it('handles quantity-based proration', () => {
    const result = calculateProration({
      currentPlanPrice: 1000, // $10/seat
      newPlanPrice: 1000,
      currentQuantity: 5,
      newQuantity: 10,
      currentPeriodStart: new Date('2025-03-01'),
      currentPeriodEnd: new Date('2025-03-31'),
      changeDate: new Date('2025-03-15'),
    });

    // Adding 5 seats for remaining 16/30 of period
    // Additional charge: $10 * 5 * 16/30 = $26.67
    expect(result.netAmount).toBe(2667);
    expect(result.direction).toBe('upgrade');
  });
});
```

#### Dunning Logic Tests

```typescript
// packages/commerce/subscriptions/src/__tests__/dunning.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DunningService } from '../dunning/service';
import { addDays } from 'date-fns';

describe('DunningService', () => {
  let dunning: DunningService;
  const mockStripe = {
    invoices: { pay: vi.fn() },
    subscriptions: { update: vi.fn() },
  };
  const mockNotify = vi.fn();
  const mockEventBus = { emit: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    dunning = new DunningService({
      stripe: mockStripe as any,
      notify: mockNotify,
      eventBus: mockEventBus as any,
      config: {
        maxRetryAttempts: 4,
        retryScheduleDays: [1, 3, 5, 7],
        gracePeriodDays: 7,
        downgradePlanId: null,
      },
    });
  });

  it('schedules retries according to configured schedule', () => {
    const failDate = new Date('2025-03-01');
    const schedule = dunning.calculateRetrySchedule(failDate);

    expect(schedule).toEqual([
      { attempt: 1, date: addDays(failDate, 1) },
      { attempt: 2, date: addDays(failDate, 3) },
      { attempt: 3, date: addDays(failDate, 5) },
      { attempt: 4, date: addDays(failDate, 7) },
    ]);
  });

  it('retries payment and returns to active on success', async () => {
    mockStripe.invoices.pay.mockResolvedValue({ paid: true });

    const result = await dunning.retryPayment({
      subscriptionId: 'sub_123',
      invoiceId: 'inv_456',
      attempt: 1,
    });

    expect(result.success).toBe(true);
    expect(result.newState).toBe('active');
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'payment_recovered' })
    );
  });

  it('continues dunning on retry failure', async () => {
    mockStripe.invoices.pay.mockRejectedValue(
      new Error('card_declined')
    );

    const result = await dunning.retryPayment({
      subscriptionId: 'sub_123',
      invoiceId: 'inv_456',
      attempt: 2,
    });

    expect(result.success).toBe(false);
    expect(result.newState).toBe('past_due');
    expect(result.nextRetryAt).toBeDefined();
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'payment_retry_failed' })
    );
  });

  it('cancels subscription after max retries exhausted', async () => {
    mockStripe.invoices.pay.mockRejectedValue(
      new Error('card_declined')
    );

    const result = await dunning.retryPayment({
      subscriptionId: 'sub_123',
      invoiceId: 'inv_456',
      attempt: 4, // final attempt
    });

    expect(result.success).toBe(false);
    expect(result.newState).toBe('canceled');
    expect(result.nextRetryAt).toBeNull();
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'subscription.dunning.exhausted',
      expect.objectContaining({ subscriptionId: 'sub_123' })
    );
  });

  it('downgrades instead of canceling when configured', async () => {
    dunning = new DunningService({
      stripe: mockStripe as any,
      notify: mockNotify,
      eventBus: mockEventBus as any,
      config: {
        maxRetryAttempts: 4,
        retryScheduleDays: [1, 3, 5, 7],
        gracePeriodDays: 7,
        downgradePlanId: 'plan_free',
      },
    });

    mockStripe.invoices.pay.mockRejectedValue(new Error('card_declined'));

    const result = await dunning.retryPayment({
      subscriptionId: 'sub_123',
      invoiceId: 'inv_456',
      attempt: 4,
    });

    expect(result.newState).toBe('active');
    expect(result.downgradedTo).toBe('plan_free');
  });
});
```

### Integration Tests

#### Full Subscription Lifecycle

```typescript
// packages/commerce/subscriptions/src/__tests__/integration/lifecycle.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext, TestContext } from '@mcv/kernel/testing';
import { subscriptionRouter } from '../../router';
import { createCaller } from '../../trpc';

describe('Subscription Lifecycle (Integration)', () => {
  let ctx: TestContext;
  let caller: ReturnType<typeof createCaller>;

  beforeAll(async () => {
    ctx = await createTestContext({
      modules: ['identity', 'fabric', 'commerce/subscriptions'],
      seed: 'subscription-lifecycle',
    });
    caller = createCaller(ctx.createAuthContext('user_subscriber'));

    // Seed a test plan
    await ctx.db.insert(subscriptionPlans).values({
      id: 'plan_pro',
      tenantId: ctx.tenantId,
      name: 'Professional',
      slug: 'professional',
      priceAmount: 4900,
      currency: 'usd',
      billingInterval: 'month',
      trialDays: 14,
      isActive: true,
      features: { seats: 10, storage: 50_000_000_000, apiCalls: 100_000 },
    });
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it('creates a subscription with trial', async () => {
    const sub = await caller.subscription.create({
      planId: 'plan_pro',
      startTrial: true,
    });

    expect(sub.status).toBe('trialing');
    expect(sub.trialEnd).toBeDefined();
    expect(sub.currentPeriodStart).toBeDefined();
  });

  it('activates after trial ends with payment method', async () => {
    await caller.subscription.attachPaymentMethod({
      subscriptionId: sub.id,
      paymentMethodId: 'pm_test_visa',
    });

    // Simulate trial end
    const activated = await caller.subscription.activate({
      subscriptionId: sub.id,
    });

    expect(activated.status).toBe('active');
  });

  it('upgrades plan with proration', async () => {
    // Seed higher plan
    await ctx.db.insert(subscriptionPlans).values({
      id: 'plan_enterprise',
      tenantId: ctx.tenantId,
      name: 'Enterprise',
      slug: 'enterprise',
      priceAmount: 19900,
      currency: 'usd',
      billingInterval: 'month',
      isActive: true,
      features: { seats: 100, storage: 500_000_000_000, apiCalls: 1_000_000 },
    });

    const result = await caller.subscription.changePlan({
      subscriptionId: sub.id,
      newPlanId: 'plan_enterprise',
    });

    expect(result.previousPlan).toBe('plan_pro');
    expect(result.newPlan).toBe('plan_enterprise');
    expect(result.prorationAmount).toBeGreaterThan(0);
  });

  it('pauses and resumes subscription', async () => {
    const paused = await caller.subscription.pause({
      subscriptionId: sub.id,
      reason: 'vacation',
    });
    expect(paused.status).toBe('paused');

    const resumed = await caller.subscription.resume({
      subscriptionId: sub.id,
    });
    expect(resumed.status).toBe('active');
  });

  it('cancels at period end', async () => {
    const canceled = await caller.subscription.cancel({
      subscriptionId: sub.id,
      cancelAtPeriodEnd: true,
      reason: 'too_expensive',
    });

    expect(canceled.status).toBe('active'); // Still active until period end
    expect(canceled.cancelAtPeriodEnd).toBe(true);
  });

  it('reactivates canceled subscription', async () => {
    const reactivated = await caller.subscription.reactivate({
      subscriptionId: sub.id,
    });

    expect(reactivated.status).toBe('active');
    expect(reactivated.cancelAtPeriodEnd).toBe(false);
  });
});
```

#### Webhook Handling Tests

```typescript
// packages/commerce/subscriptions/src/__tests__/integration/webhooks.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createTestContext, TestContext } from '@mcv/kernel/testing';
import { handleStripeWebhook } from '../../webhooks/handler';
import { constructStripeEvent } from '../../webhooks/verify';
import Stripe from 'stripe';

describe('Stripe Webhook Handling (Integration)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestContext({
      modules: ['commerce/subscriptions'],
      seed: 'webhook-tests',
    });
  });

  it('handles invoice.payment_succeeded', async () => {
    const event = createMockEvent('invoice.payment_succeeded', {
      subscription: 'sub_stripe_123',
      amount_paid: 4900,
      currency: 'usd',
      status: 'paid',
    });

    const result = await handleStripeWebhook(ctx.db, event);

    expect(result.processed).toBe(true);
    const invoice = await ctx.db.query.subscriptionInvoices.findFirst({
      where: eq(subscriptionInvoices.stripeInvoiceId, event.data.object.id),
    });
    expect(invoice).toBeDefined();
    expect(invoice!.status).toBe('paid');
  });

  it('handles invoice.payment_failed â€” initiates dunning', async () => {
    const event = createMockEvent('invoice.payment_failed', {
      subscription: 'sub_stripe_123',
      attempt_count: 1,
    });

    const result = await handleStripeWebhook(ctx.db, event);

    expect(result.processed).toBe(true);
    const sub = await ctx.db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, 'sub_stripe_123'),
    });
    expect(sub!.status).toBe('past_due');
  });

  it('handles customer.subscription.deleted', async () => {
    const event = createMockEvent('customer.subscription.deleted', {
      id: 'sub_stripe_123',
    });

    const result = await handleStripeWebhook(ctx.db, event);

    expect(result.processed).toBe(true);
    const sub = await ctx.db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, 'sub_stripe_123'),
    });
    expect(sub!.status).toBe('canceled');
  });

  it('rejects events with invalid signatures', async () => {
    const rawBody = '{"type":"invoice.payment_succeeded"}';
    const invalidSig = 'invalid_signature';

    await expect(
      constructStripeEvent(rawBody, invalidSig)
    ).rejects.toThrow('SUB_021');
  });

  it('deduplicates already-processed events', async () => {
    const event = createMockEvent('invoice.payment_succeeded', {
      subscription: 'sub_stripe_123',
    });

    // Process once
    await handleStripeWebhook(ctx.db, event);
    // Process again â€” should be idempotent
    const result = await handleStripeWebhook(ctx.db, event);

    expect(result.processed).toBe(false);
    expect(result.reason).toBe('already_processed');
  });
});
```

### Test Utilities

```typescript
// packages/commerce/subscriptions/src/__tests__/utils/factories.ts
import { nanoid } from 'nanoid';

export function createMockSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: `sub_${nanoid(12)}`,
    tenantId: `tenant_${nanoid(8)}`,
    subscriberId: `user_${nanoid(8)}`,
    planId: 'plan_pro',
    status: 'active',
    quantity: 1,
    currentPeriodStart: new Date('2025-03-01'),
    currentPeriodEnd: new Date('2025-03-31'),
    cancelAtPeriodEnd: false,
    trialStart: null,
    trialEnd: null,
    canceledAt: null,
    pausedAt: null,
    reactivatedAt: null,
    stripeSubscriptionId: `sub_stripe_${nanoid(14)}`,
    stripeCustomerId: `cus_${nanoid(14)}`,
    metadata: {},
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockPlan(overrides: Partial<SubscriptionPlan> = {}): SubscriptionPlan {
  return {
    id: `plan_${nanoid(8)}`,
    tenantId: `tenant_${nanoid(8)}`,
    name: 'Professional',
    slug: 'professional',
    description: 'For growing teams',
    priceAmount: 4900,
    currency: 'usd',
    billingInterval: 'month',
    trialDays: 14,
    isActive: true,
    features: { seats: 10, storage: 50_000_000_000 },
    stripePriceId: `price_${nanoid(14)}`,
    metadata: {},
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockEvent(type: string, data: Record<string, any>): Stripe.Event {
  return {
    id: `evt_${nanoid(14)}`,
    object: 'event',
    api_version: '2024-04-10',
    created: Math.floor(Date.now() / 1000),
    type,
    data: { object: { id: `obj_${nanoid(14)}`, ...data } },
    livemode: false,
    pending_webhooks: 0,
    request: null,
  } as unknown as Stripe.Event;
}
```

### Coverage Targets

| Category | Target | Rationale |
|----------|:------:|-----------|
| **Overall line coverage** | â‰¥ 90% | Critical financial module â€” high coverage required |
| **State machine** | 100% | Every valid and invalid transition must be tested |
| **Proration calculations** | 100% | Financial accuracy is non-negotiable |
| **Dunning logic** | â‰¥ 95% | Directly impacts revenue recovery |
| **Webhook handlers** | â‰¥ 95% | Must handle all Stripe event types correctly |
| **tRPC routers** | â‰¥ 85% | Input validation and authorization paths |
| **Analytics queries** | â‰¥ 80% | Complex queries, focus on correctness |
| **Schema/types** | N/A | Type definitions excluded from coverage |
| **Integration tests** | â‰¥ 75% | Full lifecycle scenarios against test database |
| **Branch coverage** | â‰¥ 85% | Ensure edge cases (null, empty, boundary) are covered |

```bash
# Run all subscription module tests
pnpm --filter @mcv/commerce-subscriptions test

# Run with coverage
pnpm --filter @mcv/commerce-subscriptions test:coverage

# Run only unit tests
pnpm --filter @mcv/commerce-subscriptions test -- --grep "unit"

# Run only integration tests (requires test database)
pnpm --filter @mcv/commerce-subscriptions test:integration

# Run specific test file
pnpm --filter @mcv/commerce-subscriptions test -- src/__tests__/state-machine.test.ts
```
