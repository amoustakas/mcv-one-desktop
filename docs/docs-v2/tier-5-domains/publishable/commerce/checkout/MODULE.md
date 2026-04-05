# @mcv/commerce/checkout

> **Tier:** 5 — Domain Module
> **Classification:** Publishable
> **Domain:** Commerce
> **Submodule:** Checkout
> **Runtime:** Server (Edge-compatible)
> **Multi-tenant:** Yes (venture-scoped RLS)
> **PCI Compliance:** SAQ-A (tokenized, no raw card data)

---

## Purpose

The `@mcv/commerce/checkout` module orchestrates the complete multi-step checkout flow from shopping cart to order confirmation within the MCV.ONE platform. It implements a finite state machine that guides customers through address collection, shipping method selection, payment processing, order review, and final confirmation — ensuring data integrity and transactional consistency at every transition. The module is designed for multi-tenant operation, where each venture maintains isolated checkout configurations, payment provider credentials, and custom checkout fields, all enforced through PostgreSQL Row-Level Security policies that make cross-tenant data access structurally impossible.

Payment processing is handled through a provider-agnostic abstraction layer that currently supports Stripe Payment Intents, PayPal Orders, Apple Pay, and Google Pay, with 3D Secure / Strong Customer Authentication (SCA) challenges managed transparently. The module never stores raw card numbers, CVVs, or sensitive authentication data — all payment methods are tokenized at the provider level before reaching MCV infrastructure, maintaining SAQ-A PCI DSS compliance. Real-time fraud detection integrates with Stripe Radar and Sift Science to score transactions, enforce velocity limits, flag address mismatches, and trigger step-up authentication when risk thresholds are exceeded.

Beyond the core purchase flow, the module provides guest checkout for anonymous users, express checkout for returning customers with saved payment methods, abandoned checkout recovery with automated email sequences, and a fully extensible customization system that allows ventures to inject custom fields, validation rules, and upsell/cross-sell slots at any point in the checkout pipeline. All checkout events are published to Redpanda topics for real-time analytics, inventory synchronization, and downstream service orchestration, ensuring that the checkout module serves as the authoritative source of truth for purchase intent across the entire platform.

---

## Exports

```typescript
// @mcv/commerce/checkout — Public Export Map

// ─── Core Service ──────────────────────────────────────────────
export { CheckoutService }                    from './services/checkout.service';
export { CheckoutSessionManager }             from './services/session-manager.service';
export { CheckoutStateMachine }               from './services/state-machine.service';
export { CheckoutOrchestrator }               from './services/orchestrator.service';

// ─── Address ───────────────────────────────────────────────────
export { AddressService }                     from './services/address.service';
export { AddressValidator }                   from './services/address-validator.service';
export { AddressBookService }                 from './services/address-book.service';
export { SmartyStreetsProvider }              from './providers/address/smarty-streets.provider';
export { GoogleAddressProvider }              from './providers/address/google-address.provider';

// ─── Shipping ──────────────────────────────────────────────────
export { ShippingRateService }                from './services/shipping-rate.service';
export { ShippingMethodSelector }             from './services/shipping-method-selector.service';
export { DeliveryEstimationService }          from './services/delivery-estimation.service';
export { UPSProvider }                        from './providers/shipping/ups.provider';
export { FedExProvider }                      from './providers/shipping/fedex.provider';
export { USPSProvider }                       from './providers/shipping/usps.provider';
export { DHLProvider }                        from './providers/shipping/dhl.provider';

// ─── Payment ───────────────────────────────────────────────────
export { PaymentProcessor }                   from './services/payment-processor.service';
export { PaymentIntentService }               from './services/payment-intent.service';
export { PaymentMethodService }               from './services/payment-method.service';
export { ThreeDSecureHandler }                from './services/three-d-secure.service';
export { StripePaymentProvider }              from './providers/payment/stripe.provider';
export { PayPalPaymentProvider }              from './providers/payment/paypal.provider';
export { ApplePayProvider }                   from './providers/payment/apple-pay.provider';
export { GooglePayProvider }                  from './providers/payment/google-pay.provider';

// ─── Tax ───────────────────────────────────────────────────────
export { TaxFinalizationService }             from './services/tax-finalization.service';
export { TaxExemptionService }                from './services/tax-exemption.service';
export { DutyCalculationService }             from './services/duty-calculation.service';
export { AvalaraProvider }                    from './providers/tax/avalara.provider';
export { TaxJarProvider }                     from './providers/tax/taxjar.provider';

// ─── Order ─────────────────────────────────────────────────────
export { OrderCreator }                       from './services/order-creator.service';
export { OrderConfirmationService }           from './services/order-confirmation.service';
export { InventoryReservationService }        from './services/inventory-reservation.service';

// ─── Guest & Express ───────────────────────────────────────────
export { GuestCheckoutService }               from './services/guest-checkout.service';
export { ExpressCheckoutService }             from './services/express-checkout.service';
export { PostPurchaseAccountService }         from './services/post-purchase-account.service';

// ─── Fraud ─────────────────────────────────────────────────────
export { FraudChecker }                       from './services/fraud-checker.service';
export { VelocityChecker }                    from './services/velocity-checker.service';
export { AddressMismatchScorer }              from './services/address-mismatch-scorer.service';
export { RadarIntegration }                   from './providers/fraud/radar.provider';
export { SiftIntegration }                    from './providers/fraud/sift.provider';

// ─── Recovery ──────────────────────────────────────────────────
export { CheckoutRecoveryService }            from './services/checkout-recovery.service';
export { AbandonedCheckoutEmailService }      from './services/abandoned-checkout-email.service';
export { SessionReplayService }               from './services/session-replay.service';

// ─── Customization ─────────────────────────────────────────────
export { CheckoutCustomizationService }       from './services/checkout-customization.service';
export { CustomFieldRegistry }                from './services/custom-field-registry.service';
export { UpsellSlotService }                  from './services/upsell-slot.service';
export { CheckoutValidationEngine }           from './services/checkout-validation-engine.service';

// ─── Events ────────────────────────────────────────────────────
export { CheckoutEventEmitter }               from './events/checkout-event-emitter';
export { CheckoutEventConsumer }              from './events/checkout-event-consumer';

// ─── tRPC Router ───────────────────────────────────────────────
export { checkoutRouter }                     from './trpc/checkout.router';
export { checkoutAddressRouter }              from './trpc/checkout-address.router';
export { checkoutShippingRouter }             from './trpc/checkout-shipping.router';
export { checkoutPaymentRouter }              from './trpc/checkout-payment.router';
export { checkoutRecoveryRouter }             from './trpc/checkout-recovery.router';

// ─── Database Schema ───────────────────────────────────────────
export {
  checkoutSessions,
  checkoutAddresses,
  checkoutShippingSelections,
  checkoutPayments,
  checkoutCustomFields,
  checkoutEvents,
  checkoutRecovery,
  checkoutFraudSignals,
  checkoutUpsells,
}                                             from './schema';

// ─── Types ─────────────────────────────────────────────────────
export type {
  CheckoutSession,
  CheckoutStep,
  CheckoutStepName,
  CheckoutStatus,
  CheckoutAddress,
  CheckoutAddressType,
  ShippingRate,
  ShippingMethod,
  ShippingCarrier,
  DeliveryEstimate,
  PaymentIntent,
  PaymentMethodToken,
  PaymentProvider,
  PaymentStatus,
  ThreeDSecureResult,
  TaxFinalization,
  TaxExemptionCertificate,
  DutyEstimate,
  OrderCreateResult,
  GuestCheckoutInput,
  ExpressCheckoutInput,
  FraudScore,
  FraudSignal,
  FraudDecision,
  CheckoutRecoveryRecord,
  CheckoutCustomField,
  CheckoutCustomFieldValue,
  CheckoutUpsellSlot,
  CheckoutValidationRule,
  CheckoutEventPayload,
  CheckoutConfig,
  VentureCheckoutConfig,
}                                             from './types';

// ─── Errors ────────────────────────────────────────────────────
export {
  CheckoutError,
  CheckoutSessionExpiredError,
  CheckoutStepInvalidError,
  CheckoutPaymentDeclinedError,
  CheckoutPaymentRequiresActionError,
  CheckoutAddressInvalidError,
  CheckoutShippingUnavailableError,
  CheckoutInventoryExhaustedError,
  CheckoutFraudBlockedError,
  CheckoutOrderCreationFailedError,
  CheckoutRecoveryExpiredError,
  CheckoutCustomFieldValidationError,
}                                             from './errors';

// ─── Constants ─────────────────────────────────────────────────
export {
  CHECKOUT_STEPS,
  CHECKOUT_STATUSES,
  PAYMENT_PROVIDERS,
  SHIPPING_CARRIERS,
  TAX_PROVIDERS,
  FRAUD_PROVIDERS,
  DEFAULT_SESSION_TTL_MINUTES,
  MAX_CHECKOUT_ITEMS,
  SUPPORTED_CURRENCIES,
}                                             from './constants';
```

---

## Architecture

### Checkout State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CHECKOUT STATE MACHINE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐     ┌───────────┐     ┌──────────┐     ┌────────────┐  │
│   │          │     │           │     │          │     │            │  │
│   │  CART    │────▶│  ADDRESS  │────▶│ SHIPPING │────▶│  PAYMENT   │  │
│   │          │     │           │     │          │     │            │  │
│   └──────────┘     └─────┬─────┘     └────┬─────┘     └──────┬─────┘  │
│        │                 │                │                   │        │
│        │                 │◀───────────────┘                   │        │
│        │                 │         (back)                     │        │
│        │                 │                                    ▼        │
│        │                 │                            ┌────────────┐   │
│        │                 │                            │            │   │
│        │                 │◀───────────────────────────│   REVIEW   │   │
│        │                 │         (back)             │            │   │
│        │                 │                            └──────┬─────┘   │
│        │                 │                                   │        │
│        │                 │                                   ▼        │
│        │                 │                            ┌────────────┐   │
│        │                 │                            │            │   │
│        │                 │                            │  CONFIRM   │   │
│        │                 │                            │            │   │
│        │                 │                            └──────┬─────┘   │
│        │                 │                                   │        │
│        ▼                 ▼                                   ▼        │
│   ┌──────────┐     ┌───────────┐                     ┌────────────┐   │
│   │ ABANDONED│     │  EXPIRED  │                     │ COMPLETED  │   │
│   │          │     │           │                     │            │   │
│   └──────────┘     └───────────┘                     └────────────┘   │
│        │                                                    │        │
│        ▼                                                    ▼        │
│   ┌──────────┐                                       ┌────────────┐   │
│   │ RECOVERY │                                       │   ORDER    │   │
│   │  EMAIL   │                                       │  CREATED   │   │
│   └──────────┘                                       └────────────┘   │
│                                                                         │
│   Legend:                                                                │
│   ────▶  Forward transition (requires step validation)                 │
│   ◀────  Back transition (preserves entered data)                      │
│                                                                         │
│   Express Checkout: CART ──▶ REVIEW ──▶ CONFIRM (skip address/ship/pay)│
│   Guest Checkout:   Same flow, ephemeral session, no saved addresses   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Payment Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PAYMENT PROCESSING FLOW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Client (Browser)              Server                    Provider      │
│   ─────────────────             ──────                    ────────      │
│         │                         │                          │          │
│         │  1. Submit Payment      │                          │          │
│         │────────────────────────▶│                          │          │
│         │                         │                          │          │
│         │                         │  2. Fraud Check          │          │
│         │                         │──────────┐               │          │
│         │                         │          │ FraudChecker   │          │
│         │                         │◀─────────┘               │          │
│         │                         │                          │          │
│         │                         │  3. Create PaymentIntent │          │
│         │                         │─────────────────────────▶│          │
│         │                         │                          │          │
│         │                         │  4a. Intent Created      │          │
│         │                         │◀─────────────────────────│          │
│         │                         │                          │          │
│         │  5a. Client Secret      │                          │          │
│         │◀────────────────────────│                          │          │
│         │                         │                          │          │
│         │  ─── OR (3DS Required) ────                        │          │
│         │                         │                          │          │
│         │                         │  4b. requires_action     │          │
│         │                         │◀─────────────────────────│          │
│         │                         │                          │          │
│         │  5b. 3DS Challenge URL  │                          │          │
│         │◀────────────────────────│                          │          │
│         │                         │                          │          │
│         │  6. User completes 3DS  │                          │          │
│         │─────────────────────────────────────────────────▶  │          │
│         │                         │                          │          │
│         │                         │  7. Webhook: succeeded   │          │
│         │                         │◀─────────────────────────│          │
│         │                         │                          │          │
│         │                         │  8. Capture Payment      │          │
│         │                         │─────────────────────────▶│          │
│         │                         │                          │          │
│         │                         │  9. Captured             │          │
│         │                         │◀─────────────────────────│          │
│         │                         │                          │          │
│         │                         │  10. Create Order        │          │
│         │                         │──────────┐               │          │
│         │                         │          │ OrderCreator   │          │
│         │                         │◀─────────┘               │          │
│         │                         │                          │          │
│         │  11. Order Confirmed    │                          │          │
│         │◀────────────────────────│                          │          │
│         │                         │                          │          │
│         │                         │  12. Emit Events         │          │
│         │                         │──▶ Redpanda              │          │
│         │                         │──▶ Confirmation Email    │          │
│         │                         │──▶ Inventory Deduction   │          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### System Integration Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CHECKOUT INTEGRATION MAP                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐    ┌─────────────────────────────┐    ┌───────────┐  │
│   │  @mcv/      │    │   @mcv/commerce/checkout     │    │  @mcv/    │  │
│   │  commerce/  │───▶│                              │───▶│ commerce/ │  │
│   │  cart       │    │  ┌─────────┐  ┌──────────┐  │    │  orders   │  │
│   └─────────────┘    │  │ State   │  │ Payment  │  │    └───────────┘  │
│                      │  │ Machine │  │ Process  │  │                   │
│   ┌─────────────┐    │  └────┬────┘  └────┬─────┘  │    ┌───────────┐  │
│   │  @mcv/      │    │       │            │        │    │  @mcv/    │  │
│   │  commerce/  │───▶│  ┌────▼────┐  ┌────▼─────┐  │───▶│ commerce/ │  │
│   │  catalog    │    │  │ Address │  │  Fraud   │  │    │  inventory│  │
│   └─────────────┘    │  │ Valid.  │  │  Check   │  │    └───────────┘  │
│                      │  └─────────┘  └──────────┘  │                   │
│   ┌─────────────┐    │                              │    ┌───────────┐  │
│   │  @mcv/      │───▶│  ┌─────────┐  ┌──────────┐  │───▶│  @mcv/    │  │
│   │  auth       │    │  │Shipping │  │   Tax    │  │    │  notify   │  │
│   └─────────────┘    │  │  Rates  │  │  Final.  │  │    └───────────┘  │
│                      │  └─────────┘  └──────────┘  │                   │
│   ┌─────────────┐    │                              │    ┌───────────┐  │
│   │  @mcv/      │◀──│  ┌─────────┐  ┌──────────┐  │───▶│ Redpanda  │  │
│   │  analytics  │    │  │Recovery │  │ Custom   │  │    │  Events   │  │
│   └─────────────┘    │  │         │  │ Fields   │  │    └───────────┘  │
│                      │  └─────────┘  └──────────┘  │                   │
│                      │                              │                   │
│                      └─────────────────────────────┘                   │
│                                                                         │
│   External Providers:                                                   │
│   ┌────────┐ ┌────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────────┐ │
│   │ Stripe │ │ PayPal │ │SmartyStr.│ │Avalara  │ │ UPS/FedEx/USPS/  │ │
│   │        │ │        │ │          │ │/TaxJar  │ │ DHL              │ │
│   └────────┘ └────────┘ └──────────┘ └─────────┘ └──────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Checkout Session

```typescript
/**
 * Represents the current state of a checkout session.
 * Sessions are venture-scoped and TTL-bound.
 */
interface CheckoutSession {
  /** Unique session identifier (ULID) */
  id: string;

  /** Venture this checkout belongs to */
  ventureId: string;

  /** Authenticated user ID, null for guest checkout */
  userId: string | null;

  /** Guest email for anonymous checkouts */
  guestEmail: string | null;

  /** Source cart ID that initiated this checkout */
  cartId: string;

  /** Current step in the checkout flow */
  currentStep: CheckoutStepName;

  /** Overall checkout status */
  status: CheckoutStatus;

  /** Snapshot of cart items at checkout creation */
  lineItems: CheckoutLineItem[];

  /** Collected billing address */
  billingAddress: CheckoutAddress | null;

  /** Collected shipping address */
  shippingAddress: CheckoutAddress | null;

  /** Whether shipping address matches billing */
  shippingSameAsBilling: boolean;

  /** Selected shipping method */
  selectedShippingMethod: ShippingMethod | null;

  /** All available shipping rates (cached) */
  availableShippingRates: ShippingRate[];

  /** Payment intent ID from provider */
  paymentIntentId: string | null;

  /** Payment provider being used */
  paymentProvider: PaymentProvider;

  /** Tokenized payment method reference */
  paymentMethodToken: string | null;

  /** Payment status */
  paymentStatus: PaymentStatus;

  /** Subtotal in smallest currency unit (cents) */
  subtotalAmount: number;

  /** Shipping cost in smallest currency unit */
  shippingAmount: number;

  /** Tax amount in smallest currency unit */
  taxAmount: number;

  /** Duty/import tax amount for international orders */
  dutyAmount: number;

  /** Discount amount in smallest currency unit */
  discountAmount: number;

  /** Grand total in smallest currency unit */
  totalAmount: number;

  /** ISO 4217 currency code */
  currency: string;

  /** Applied coupon/discount codes */
  appliedDiscountCodes: string[];

  /** Custom field values for this checkout */
  customFieldValues: CheckoutCustomFieldValue[];

  /** Fraud assessment score and signals */
  fraudScore: FraudScore | null;

  /** Whether this is an express checkout session */
  isExpress: boolean;

  /** Whether this is a guest checkout session */
  isGuest: boolean;

  /** Session expiration timestamp */
  expiresAt: Date;

  /** IP address of the client */
  clientIp: string;

  /** User agent string */
  userAgent: string;

  /** Creation timestamp */
  createdAt: Date;

  /** Last activity timestamp */
  updatedAt: Date;

  /** Completed order ID (set after successful checkout) */
  completedOrderId: string | null;

  /** Metadata bag for extensibility */
  metadata: Record<string, unknown>;
}

/** The ordered steps in a standard checkout flow */
type CheckoutStepName = 'address' | 'shipping' | 'payment' | 'review' | 'confirm';

/** Overall checkout lifecycle status */
type CheckoutStatus =
  | 'active'          // Checkout in progress
  | 'completed'       // Successfully converted to order
  | 'expired'         // Session TTL exceeded
  | 'abandoned'       // User left without completing
  | 'recovering'      // Recovery email sent, awaiting return
  | 'failed';         // Terminal failure (fraud block, etc.)
```

### Checkout Step

```typescript
/**
 * Represents a single step in the checkout flow with
 * validation rules and transition guards.
 */
interface CheckoutStep {
  /** Step identifier */
  name: CheckoutStepName;

  /** Display label for the step */
  label: string;

  /** Step position in the flow (0-indexed) */
  order: number;

  /** Whether this step can be skipped (e.g., express checkout) */
  skippable: boolean;

  /** Whether this step has been completed */
  completed: boolean;

  /** Validation errors for this step */
  errors: CheckoutStepError[];

  /**
   * Validate the current session state for this step.
   * Returns true if the step is valid and can transition forward.
   */
  validate(session: CheckoutSession): Promise<CheckoutStepValidation>;

  /**
   * Guard function that determines if transition to this step is allowed.
   * Checks that all prerequisite steps are completed.
   */
  canEnter(session: CheckoutSession): boolean;

  /**
   * Execute any side effects when entering this step
   * (e.g., calculate shipping rates when entering shipping step).
   */
  onEnter(session: CheckoutSession): Promise<CheckoutSession>;

  /**
   * Execute any side effects when leaving this step
   * (e.g., reserve inventory when leaving review step).
   */
  onExit(session: CheckoutSession): Promise<CheckoutSession>;
}

interface CheckoutStepValidation {
  valid: boolean;
  errors: CheckoutStepError[];
}

interface CheckoutStepError {
  field: string;
  code: string;
  message: string;
}
```

### Address Types

```typescript
/**
 * Checkout address with international format support.
 */
interface CheckoutAddress {
  /** Address record ID */
  id: string;

  /** Address type */
  type: CheckoutAddressType;

  /** First name */
  firstName: string;

  /** Last name */
  lastName: string;

  /** Company name (optional) */
  company: string | null;

  /** Address line 1 (street address) */
  addressLine1: string;

  /** Address line 2 (apt, suite, etc.) */
  addressLine2: string | null;

  /** City / locality */
  city: string;

  /** State / province / region */
  state: string;

  /** Postal / ZIP code */
  postalCode: string;

  /** ISO 3166-1 alpha-2 country code */
  countryCode: string;

  /** Phone number (E.164 format) */
  phone: string | null;

  /** Whether this address has been validated */
  validated: boolean;

  /** Validation provider result */
  validationResult: AddressValidationResult | null;

  /** Reference to saved address book entry (if applicable) */
  addressBookEntryId: string | null;
}

type CheckoutAddressType = 'billing' | 'shipping';

/**
 * Result from address validation provider.
 */
interface AddressValidationResult {
  /** Whether the address is deliverable */
  deliverable: boolean;

  /** Confidence score 0-100 */
  confidence: number;

  /** Suggested corrections */
  suggestions: AddressSuggestion[];

  /** Validation provider used */
  provider: 'smarty_streets' | 'google';

  /** Provider-specific metadata */
  providerMetadata: Record<string, unknown>;

  /** DPV (Delivery Point Validation) match code for US addresses */
  dpvMatchCode: string | null;

  /** Whether the address is a residential address */
  residential: boolean | null;

  /** Validated/standardized address components */
  standardized: Partial<CheckoutAddress> | null;
}

interface AddressSuggestion {
  /** The suggested address */
  address: Partial<CheckoutAddress>;

  /** Description of the correction */
  description: string;

  /** Confidence score for this suggestion */
  confidence: number;
}

/**
 * Address validation service interface.
 * Implementations wrap external providers (SmartyStreets, Google).
 */
interface AddressValidator {
  /**
   * Validate an address and return standardized results.
   */
  validate(
    address: CheckoutAddress,
    ventureId: string,
  ): Promise<AddressValidationResult>;

  /**
   * Autocomplete partial address input.
   */
  autocomplete(
    query: string,
    countryCode: string,
    ventureId: string,
  ): Promise<AddressSuggestion[]>;

  /**
   * Check if the provider supports validation for a given country.
   */
  supportsCountry(countryCode: string): boolean;
}
```

### Shipping Types

```typescript
/**
 * A shipping rate quote from a carrier.
 */
interface ShippingRate {
  /** Unique rate identifier */
  id: string;

  /** Carrier providing the rate */
  carrier: ShippingCarrier;

  /** Service level (e.g., 'ground', 'express', '2day') */
  serviceLevel: string;

  /** Human-readable service name */
  serviceName: string;

  /** Rate amount in smallest currency unit */
  amount: number;

  /** Currency code */
  currency: string;

  /** Estimated delivery date range */
  deliveryEstimate: DeliveryEstimate;

  /** Whether this rate includes tracking */
  trackingIncluded: boolean;

  /** Whether this rate includes insurance */
  insuranceIncluded: boolean;

  /** Whether signature is required */
  signatureRequired: boolean;

  /** Carrier-specific rate ID for booking */
  carrierRateId: string;

  /** Rate expiration (quotes are time-limited) */
  expiresAt: Date;
}

type ShippingCarrier = 'ups' | 'fedex' | 'usps' | 'dhl' | 'custom';

interface DeliveryEstimate {
  /** Earliest delivery date */
  earliestDate: Date;

  /** Latest delivery date */
  latestDate: Date;

  /** Business days in transit */
  businessDays: number;

  /** Whether this is a guaranteed delivery date */
  guaranteed: boolean;
}

/**
 * Selected shipping method for the checkout session.
 */
interface ShippingMethod {
  /** Reference to the selected rate */
  rateId: string;

  /** Carrier */
  carrier: ShippingCarrier;

  /** Service level */
  serviceLevel: string;

  /** Service name */
  serviceName: string;

  /** Cost in smallest currency unit */
  amount: number;

  /** Currency */
  currency: string;

  /** Expected delivery estimate */
  deliveryEstimate: DeliveryEstimate;
}

/**
 * Shipping rate service interface.
 * Aggregates rates from multiple carrier providers.
 */
interface ShippingRateService {
  /**
   * Get shipping rates for a checkout session.
   * Queries all configured carriers in parallel.
   */
  getRates(
    session: CheckoutSession,
    origin: ShippingOrigin,
    destination: CheckoutAddress,
  ): Promise<ShippingRate[]>;

  /**
   * Validate that a selected rate is still available and price hasn't changed.
   */
  validateRate(rateId: string, expectedAmount: number): Promise<boolean>;

  /**
   * Get updated delivery estimate for a specific rate.
   */
  getDeliveryEstimate(
    carrier: ShippingCarrier,
    serviceLevel: string,
    origin: ShippingOrigin,
    destination: CheckoutAddress,
  ): Promise<DeliveryEstimate>;
}

interface ShippingOrigin {
  /** Warehouse/fulfillment center address */
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
}
```

### Payment Types

```typescript
/**
 * Payment intent representing a pending or completed payment.
 */
interface PaymentIntent {
  /** Internal payment intent ID */
  id: string;

  /** External provider payment intent ID (e.g., Stripe pi_xxx) */
  externalId: string;

  /** Payment provider */
  provider: PaymentProvider;

  /** Amount in smallest currency unit */
  amount: number;

  /** Currency code */
  currency: string;

  /** Payment status */
  status: PaymentStatus;

  /** Client secret for frontend confirmation (Stripe) */
  clientSecret: string | null;

  /** Whether 3D Secure authentication is required */
  requiresAction: boolean;

  /** URL for 3D Secure challenge (if required) */
  actionUrl: string | null;

  /** Tokenized payment method reference */
  paymentMethodToken: string | null;

  /** Last four digits of card (for display) */
  cardLast4: string | null;

  /** Card brand (visa, mastercard, etc.) */
  cardBrand: string | null;

  /** Error message if payment failed */
  errorMessage: string | null;

  /** Error code if payment failed */
  errorCode: string | null;

  /** Provider-specific metadata */
  providerMetadata: Record<string, unknown>;

  /** Created timestamp */
  createdAt: Date;

  /** Last updated timestamp */
  updatedAt: Date;
}

type PaymentProvider = 'stripe' | 'paypal' | 'apple_pay' | 'google_pay';

type PaymentStatus =
  | 'pending'              // Intent created, awaiting confirmation
  | 'requires_action'      // 3DS/SCA challenge required
  | 'processing'           // Payment being processed
  | 'requires_capture'     // Authorized, awaiting capture
  | 'captured'             // Payment captured successfully
  | 'failed'               // Payment failed
  | 'canceled'             // Payment canceled
  | 'refunded'             // Payment refunded (post-order)
  | 'partially_refunded';  // Partial refund issued

/**
 * Payment method token stored for express checkout.
 * No raw card data — only provider tokens.
 */
interface PaymentMethodToken {
  /** Token ID */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** User ID (tokens are user-scoped) */
  userId: string;

  /** Payment provider */
  provider: PaymentProvider;

  /** Provider-side token/payment method ID */
  externalToken: string;

  /** Card brand for display */
  cardBrand: string | null;

  /** Last four digits for display */
  cardLast4: string | null;

  /** Expiration month */
  expirationMonth: number | null;

  /** Expiration year */
  expirationYear: number | null;

  /** Whether this is the default payment method */
  isDefault: boolean;

  /** Token creation timestamp */
  createdAt: Date;
}

/**
 * Result of a 3D Secure authentication attempt.
 */
interface ThreeDSecureResult {
  /** Whether authentication succeeded */
  authenticated: boolean;

  /** Authentication status from the issuer */
  authenticationStatus: 'success' | 'attempted' | 'failed' | 'unavailable';

  /** ECI (Electronic Commerce Indicator) value */
  eci: string | null;

  /** Whether liability shift occurred */
  liabilityShift: boolean;

  /** Version of 3DS used (1 or 2) */
  version: '1' | '2';
}

/**
 * Payment processor interface.
 * Abstracts over Stripe, PayPal, Apple Pay, Google Pay.
 */
interface PaymentProcessor {
  /** Provider identifier */
  provider: PaymentProvider;

  /**
   * Create a payment intent for the given checkout session.
   */
  createIntent(
    session: CheckoutSession,
    paymentMethodToken?: string,
  ): Promise<PaymentIntent>;

  /**
   * Confirm a payment intent (client-side confirmation callback).
   */
  confirmIntent(
    intentId: string,
    confirmationData: Record<string, unknown>,
  ): Promise<PaymentIntent>;

  /**
   * Capture an authorized payment.
   */
  capturePayment(intentId: string, amount?: number): Promise<PaymentIntent>;

  /**
   * Cancel a payment intent.
   */
  cancelIntent(intentId: string): Promise<PaymentIntent>;

  /**
   * Handle a webhook event from the provider.
   */
  handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<{ event: string; data: Record<string, unknown> }>;

  /**
   * Check if the provider supports the given currency.
   */
  supportsCurrency(currency: string): boolean;
}
```

### Tax Types

```typescript
/**
 * Final tax calculation result at checkout.
 */
interface TaxFinalization {
  /** Tax transaction ID from provider */
  transactionId: string;

  /** Total tax amount in smallest currency unit */
  totalTaxAmount: number;

  /** Tax broken down by jurisdiction */
  jurisdictionBreakdown: TaxJurisdiction[];

  /** Whether any tax exemption was applied */
  exemptionApplied: boolean;

  /** Exemption certificate ID if applicable */
  exemptionCertificateId: string | null;

  /** Duty/import tax for international orders */
  dutyAmount: number;

  /** Currency code */
  currency: string;

  /** Tax provider used */
  provider: 'avalara' | 'taxjar';

  /** Whether the tax calculation is committed (finalized) */
  committed: boolean;
}

interface TaxJurisdiction {
  /** Jurisdiction name (e.g., "California", "Los Angeles County") */
  name: string;

  /** Jurisdiction type */
  type: 'country' | 'state' | 'county' | 'city' | 'district';

  /** Tax rate for this jurisdiction */
  rate: number;

  /** Tax amount for this jurisdiction */
  amount: number;
}

interface TaxExemptionCertificate {
  /** Certificate ID */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Customer/user ID */
  userId: string;

  /** Exempt states/regions */
  exemptRegions: string[];

  /** Certificate number */
  certificateNumber: string;

  /** Issuing authority */
  issuingAuthority: string;

  /** Expiration date */
  expiresAt: Date;

  /** Whether certificate has been verified */
  verified: boolean;
}

interface DutyEstimate {
  /** Harmonized system code for the products */
  hsCode: string;

  /** Duty rate percentage */
  dutyRate: number;

  /** Estimated duty amount */
  dutyAmount: number;

  /** Import tax amount */
  importTaxAmount: number;

  /** Total landed cost addition */
  totalLandedCost: number;

  /** Destination country */
  destinationCountry: string;

  /** Currency code */
  currency: string;
}
```

### Order Creation

```typescript
/**
 * Result of creating an order from a completed checkout.
 */
interface OrderCreateResult {
  /** Whether order creation succeeded */
  success: boolean;

  /** Created order ID */
  orderId: string | null;

  /** Order number (human-friendly, venture-scoped) */
  orderNumber: string | null;

  /** Payment capture result */
  paymentCaptured: boolean;

  /** Inventory reservation result */
  inventoryReserved: boolean;

  /** Confirmation email queued */
  confirmationEmailQueued: boolean;

  /** Any warnings (non-fatal issues) */
  warnings: string[];

  /** Error details if creation failed */
  error: OrderCreationError | null;
}

interface OrderCreationError {
  code: string;
  message: string;
  retryable: boolean;
  details: Record<string, unknown>;
}

/**
 * Order creator interface.
 * Atomically converts a checkout session into an order.
 */
interface OrderCreator {
  /**
   * Create an order from a completed checkout session.
   * This is a transactional operation that:
   * 1. Validates the checkout session is complete
   * 2. Captures the authorized payment
   * 3. Deducts inventory
   * 4. Creates the order record
   * 5. Queues confirmation email
   * 6. Emits order.created event
   *
   * If any step fails, the entire operation rolls back.
   */
  createOrder(session: CheckoutSession): Promise<OrderCreateResult>;

  /**
   * Retry a failed order creation.
   * Uses idempotency key to prevent double-creation.
   */
  retryOrderCreation(
    sessionId: string,
    idempotencyKey: string,
  ): Promise<OrderCreateResult>;
}
```

### Fraud Detection

```typescript
/**
 * Fraud assessment score and signals.
 */
interface FraudScore {
  /** Overall risk score 0-100 (higher = more risky) */
  score: number;

  /** Decision based on configured thresholds */
  decision: FraudDecision;

  /** Individual signals that contributed to the score */
  signals: FraudSignal[];

  /** Provider that generated the score */
  provider: 'radar' | 'sift' | 'internal';

  /** Provider-specific risk assessment ID */
  externalAssessmentId: string | null;

  /** Recommended action */
  recommendedAction: 'allow' | 'challenge_3ds' | 'review' | 'block';

  /** Assessed at timestamp */
  assessedAt: Date;
}

type FraudDecision = 'approve' | 'review' | 'reject';

interface FraudSignal {
  /** Signal type */
  type: FraudSignalType;

  /** Signal severity */
  severity: 'low' | 'medium' | 'high' | 'critical';

  /** Human-readable description */
  description: string;

  /** Score contribution (how much this signal added to total) */
  scoreContribution: number;

  /** Raw data behind the signal */
  data: Record<string, unknown>;
}

type FraudSignalType =
  | 'velocity_ip'           // Too many checkouts from same IP
  | 'velocity_card'         // Too many attempts with same card
  | 'velocity_email'        // Too many checkouts with same email
  | 'address_mismatch'      // Billing/shipping address mismatch
  | 'avs_mismatch'          // AVS verification failed
  | 'cvv_mismatch'          // CVV verification failed
  | 'geo_anomaly'           // IP geolocation doesn't match addresses
  | 'proxy_vpn'             // Request coming from proxy/VPN
  | 'device_fingerprint'    // Suspicious device fingerprint
  | 'high_value'            // Unusually high order value
  | 'new_customer'          // First-time customer
  | 'card_country_mismatch' // Card issuing country doesn't match billing
  | 'email_disposable'      // Disposable email address used
  | 'email_new'             // Email address recently created
  | 'rapid_checkout'        // Checkout completed unusually fast
  | 'bot_behavior';         // Automated/bot-like behavior patterns

/**
 * Fraud checker interface.
 * Orchestrates fraud assessment from multiple providers.
 */
interface FraudChecker {
  /**
   * Assess fraud risk for a checkout session.
   * Called before payment capture.
   */
  assess(session: CheckoutSession): Promise<FraudScore>;

  /**
   * Report a transaction outcome (for machine learning feedback).
   */
  reportOutcome(
    sessionId: string,
    outcome: 'legitimate' | 'fraudulent' | 'chargeback',
  ): Promise<void>;

  /**
   * Check velocity limits for the given identifiers.
   */
  checkVelocity(
    ip: string,
    email: string,
    cardFingerprint: string | null,
    windowMinutes: number,
  ): Promise<{ exceeded: boolean; counts: Record<string, number> }>;
}
```

### Recovery

```typescript
/**
 * Checkout recovery record for abandoned checkout flows.
 */
interface CheckoutRecoveryRecord {
  /** Recovery record ID */
  id: string;

  /** Original checkout session ID */
  checkoutSessionId: string;

  /** Venture ID */
  ventureId: string;

  /** User ID (null for guest) */
  userId: string | null;

  /** Email to send recovery to */
  email: string;

  /** Recovery token (signed, time-limited) */
  recoveryToken: string;

  /** Recovery URL */
  recoveryUrl: string;

  /** Number of recovery emails sent */
  emailsSent: number;

  /** Maximum emails to send */
  maxEmails: number;

  /** Timestamps of sent emails */
  emailSentAt: Date[];

  /** Whether the checkout was recovered (user returned) */
  recovered: boolean;

  /** Whether the recovery ultimately converted to an order */
  converted: boolean;

  /** Recovery token expiration */
  expiresAt: Date;

  /** Record creation timestamp */
  createdAt: Date;
}

/**
 * Checkout recovery service.
 * Handles abandoned checkout detection, email sending, and session restoration.
 */
interface CheckoutRecoveryService {
  /**
   * Detect abandoned checkouts that are eligible for recovery.
   * Called periodically by a scheduled job.
   */
  detectAbandoned(
    ventureId: string,
    abandonedAfterMinutes: number,
  ): Promise<CheckoutRecoveryRecord[]>;

  /**
   * Send a recovery email for an abandoned checkout.
   */
  sendRecoveryEmail(
    recoveryId: string,
    templateOverride?: string,
  ): Promise<boolean>;

  /**
   * Restore a checkout session from a recovery token.
   * Creates a new session pre-populated with the original data.
   */
  restoreSession(recoveryToken: string): Promise<CheckoutSession>;

  /**
   * Get recovery analytics for a venture.
   */
  getRecoveryStats(
    ventureId: string,
    dateRange: { from: Date; to: Date },
  ): Promise<RecoveryStats>;
}

interface RecoveryStats {
  /** Total abandoned checkouts in period */
  totalAbandoned: number;

  /** Recovery emails sent */
  emailsSent: number;

  /** Checkouts recovered (user returned) */
  recovered: number;

  /** Recovered checkouts that converted to orders */
  converted: number;

  /** Recovery rate (recovered / totalAbandoned) */
  recoveryRate: number;

  /** Conversion rate (converted / recovered) */
  conversionRate: number;

  /** Revenue recovered */
  revenueRecovered: number;

  /** Currency */
  currency: string;
}
```

### Checkout Customization

```typescript
/**
 * Custom field definition for venture-specific checkout customization.
 */
interface CheckoutCustomField {
  /** Field ID */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Field key (unique per venture) */
  key: string;

  /** Display label */
  label: string;

  /** Field type */
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number';

  /** Which checkout step this field appears on */
  step: CheckoutStepName;

  /** Whether the field is required */
  required: boolean;

  /** Validation rules */
  validationRules: CheckoutValidationRule[];

  /** Options for select/radio fields */
  options: { value: string; label: string }[];

  /** Placeholder text */
  placeholder: string | null;

  /** Help text displayed below the field */
  helpText: string | null;

  /** Display order within the step */
  displayOrder: number;

  /** Whether the field is currently active */
  active: boolean;

  /** Created timestamp */
  createdAt: Date;
}

interface CheckoutCustomFieldValue {
  /** Field ID */
  fieldId: string;

  /** Field key */
  fieldKey: string;

  /** Submitted value */
  value: string;

  /** Whether validation passed */
  valid: boolean;
}

interface CheckoutValidationRule {
  /** Rule type */
  type: 'regex' | 'min_length' | 'max_length' | 'min_value' | 'max_value' | 'custom';

  /** Rule parameter (regex pattern, min/max value, etc.) */
  param: string;

  /** Error message if validation fails */
  message: string;
}

/**
 * Upsell/cross-sell slot configuration for checkout pages.
 */
interface CheckoutUpsellSlot {
  /** Slot ID */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Which step this upsell appears on */
  step: CheckoutStepName;

  /** Slot position within the step */
  position: 'before_content' | 'after_content' | 'sidebar';

  /** Upsell type */
  type: 'product_recommendation' | 'addon' | 'warranty' | 'gift_wrap' | 'custom';

  /** Product IDs to recommend (for product_recommendation type) */
  productIds: string[];

  /** Custom HTML/component reference (for custom type) */
  customComponent: string | null;

  /** Whether the slot is active */
  active: boolean;

  /** Display rules (e.g., minimum cart value) */
  displayRules: Record<string, unknown>;
}
```

### Checkout Configuration

```typescript
/**
 * Venture-specific checkout configuration.
 */
interface VentureCheckoutConfig {
  /** Venture ID */
  ventureId: string;

  /** Session TTL in minutes (default: 30) */
  sessionTtlMinutes: number;

  /** Enabled payment providers */
  enabledPaymentProviders: PaymentProvider[];

  /** Enabled shipping carriers */
  enabledShippingCarriers: ShippingCarrier[];

  /** Whether guest checkout is allowed */
  guestCheckoutEnabled: boolean;

  /** Whether express checkout is enabled */
  expressCheckoutEnabled: boolean;

  /** Whether address validation is required */
  addressValidationRequired: boolean;

  /** Address validation provider preference */
  addressValidationProvider: 'smarty_streets' | 'google' | 'none';

  /** Tax provider */
  taxProvider: 'avalara' | 'taxjar' | 'none';

  /** Fraud detection provider */
  fraudProvider: 'radar' | 'sift' | 'internal' | 'none';

  /** Fraud score threshold for automatic block */
  fraudBlockThreshold: number;

  /** Fraud score threshold for 3DS challenge */
  fraudChallengeThreshold: number;

  /** Fraud score threshold for manual review */
  fraudReviewThreshold: number;

  /** Whether to collect phone number */
  collectPhone: boolean;

  /** Whether to collect company name */
  collectCompany: boolean;

  /** Abandoned checkout recovery settings */
  recovery: {
    enabled: boolean;
    abandonedAfterMinutes: number;
    maxEmails: number;
    emailDelayMinutes: number[];
    recoveryTokenTtlHours: number;
  };

  /** Supported currencies */
  supportedCurrencies: string[];

  /** Default currency */
  defaultCurrency: string;

  /** Supported countries for shipping */
  shippingCountries: string[];

  /** Custom checkout steps (allows reordering/skipping) */
  stepOverrides: Partial<Record<CheckoutStepName, { enabled: boolean; order: number }>>;

  /** Minimum order amount (in default currency's smallest unit) */
  minimumOrderAmount: number;

  /** Maximum order amount */
  maximumOrderAmount: number;

  /** Maximum items per checkout */
  maximumItems: number;
}
```

### Checkout Event Payloads

```typescript
/**
 * Events emitted to Redpanda during checkout lifecycle.
 */
type CheckoutEventPayload =
  | CheckoutCreatedEvent
  | CheckoutStepCompletedEvent
  | CheckoutPaymentInitiatedEvent
  | CheckoutPaymentCompletedEvent
  | CheckoutPaymentFailedEvent
  | CheckoutCompletedEvent
  | CheckoutAbandonedEvent
  | CheckoutRecoveryEvent
  | CheckoutFraudFlaggedEvent;

interface CheckoutCreatedEvent {
  type: 'checkout.created';
  checkoutSessionId: string;
  ventureId: string;
  userId: string | null;
  cartId: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  isGuest: boolean;
  isExpress: boolean;
  timestamp: Date;
}

interface CheckoutStepCompletedEvent {
  type: 'checkout.step_completed';
  checkoutSessionId: string;
  ventureId: string;
  step: CheckoutStepName;
  durationMs: number;
  timestamp: Date;
}

interface CheckoutPaymentInitiatedEvent {
  type: 'checkout.payment_initiated';
  checkoutSessionId: string;
  ventureId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  timestamp: Date;
}

interface CheckoutPaymentCompletedEvent {
  type: 'checkout.payment_completed';
  checkoutSessionId: string;
  ventureId: string;
  provider: PaymentProvider;
  paymentIntentId: string;
  amount: number;
  currency: string;
  timestamp: Date;
}

interface CheckoutPaymentFailedEvent {
  type: 'checkout.payment_failed';
  checkoutSessionId: string;
  ventureId: string;
  provider: PaymentProvider;
  errorCode: string;
  errorMessage: string;
  timestamp: Date;
}

interface CheckoutCompletedEvent {
  type: 'checkout.completed';
  checkoutSessionId: string;
  ventureId: string;
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  isGuest: boolean;
  isExpress: boolean;
  durationMs: number;
  timestamp: Date;
}

interface CheckoutAbandonedEvent {
  type: 'checkout.abandoned';
  checkoutSessionId: string;
  ventureId: string;
  lastStep: CheckoutStepName;
  totalAmount: number;
  currency: string;
  sessionAgeMs: number;
  timestamp: Date;
}

interface CheckoutRecoveryEvent {
  type: 'checkout.recovery';
  checkoutSessionId: string;
  ventureId: string;
  recoveryId: string;
  action: 'email_sent' | 'link_clicked' | 'session_restored' | 'converted';
  timestamp: Date;
}

interface CheckoutFraudFlaggedEvent {
  type: 'checkout.fraud_flagged';
  checkoutSessionId: string;
  ventureId: string;
  fraudScore: number;
  decision: FraudDecision;
  signals: FraudSignalType[];
  action: 'blocked' | 'challenged' | 'review_queued';
  timestamp: Date;
}
```

---

## Database Schemas

### checkout_sessions

```typescript
import { pgTable, text, integer, boolean, timestamp, jsonb, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Core checkout session table.
 * Each row represents one checkout attempt, from creation through
 * completion, expiration, or abandonment.
 */
export const checkoutSessions = pgTable(
  'checkout_sessions',
  {
    id:                     text('id').primaryKey(),                          // ULID
    ventureId:              text('venture_id').notNull(),                     // FK → ventures
    userId:                 text('user_id'),                                  // FK → users (null for guest)
    guestEmail:             text('guest_email'),                              // Email for guest checkout
    cartId:                 text('cart_id').notNull(),                        // FK → carts
    currentStep:            text('current_step').notNull().default('address'),// CheckoutStepName
    status:                 text('status').notNull().default('active'),       // CheckoutStatus
    lineItems:              jsonb('line_items').notNull(),                    // CheckoutLineItem[]
    billingAddressId:       text('billing_address_id'),                       // FK → checkout_addresses
    shippingAddressId:      text('shipping_address_id'),                      // FK → checkout_addresses
    shippingSameAsBilling:  boolean('shipping_same_as_billing').default(true),
    selectedShippingRateId: text('selected_shipping_rate_id'),               // FK → checkout_shipping_selections
    paymentIntentId:        text('payment_intent_id'),                        // FK → checkout_payments
    paymentProvider:        text('payment_provider'),                         // PaymentProvider
    paymentStatus:          text('payment_status').default('pending'),        // PaymentStatus
    subtotalAmount:         integer('subtotal_amount').notNull(),             // cents
    shippingAmount:         integer('shipping_amount').notNull().default(0),
    taxAmount:              integer('tax_amount').notNull().default(0),
    dutyAmount:             integer('duty_amount').notNull().default(0),
    discountAmount:         integer('discount_amount').notNull().default(0),
    totalAmount:            integer('total_amount').notNull(),
    currency:               text('currency').notNull().default('usd'),
    appliedDiscountCodes:   jsonb('applied_discount_codes').default(sql`'[]'::jsonb`),
    fraudScoreId:           text('fraud_score_id'),                           // FK → checkout_fraud_signals
    isExpress:              boolean('is_express').notNull().default(false),
    isGuest:                boolean('is_guest').notNull().default(false),
    clientIp:               text('client_ip'),
    userAgent:              text('user_agent'),
    completedOrderId:       text('completed_order_id'),                       // FK → orders
    metadata:               jsonb('metadata').default(sql`'{}'::jsonb`),
    expiresAt:              timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // RLS: Users can only access checkout sessions belonging to their venture
    pgPolicy('checkout_sessions_venture_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`venture_id = current_setting('app.current_venture_id')::text`,
      withCheck: sql`venture_id = current_setting('app.current_venture_id')::text`,
    }),
    // RLS: Users can only access their own sessions (or admin override)
    pgPolicy('checkout_sessions_user_access', {
      as: 'permissive',
      for: 'select',
      using: sql`
        user_id = current_setting('app.current_user_id')::text
        OR current_setting('app.current_role')::text = 'admin'
        OR is_guest = true
      `,
    }),
  ],
);
```

### checkout_addresses

```typescript
/**
 * Addresses collected during checkout.
 * Supports both billing and shipping, with validation results.
 */
export const checkoutAddresses = pgTable(
  'checkout_addresses',
  {
    id:                   text('id').primaryKey(),                           // ULID
    ventureId:            text('venture_id').notNull(),
    checkoutSessionId:    text('checkout_session_id').notNull(),             // FK → checkout_sessions
    type:                 text('type').notNull(),                             // 'billing' | 'shipping'
    firstName:            text('first_name').notNull(),
    lastName:             text('last_name').notNull(),
    company:              text('company'),
    addressLine1:         text('address_line_1').notNull(),
    addressLine2:         text('address_line_2'),
    city:                 text('city').notNull(),
    state:                text('state').notNull(),
    postalCode:           text('postal_code').notNull(),
    countryCode:          text('country_code').notNull(),                    // ISO 3166-1 alpha-2
    phone:                text('phone'),                                     // E.164 format
    validated:            boolean('validated').notNull().default(false),
    validationResult:     jsonb('validation_result'),                        // AddressValidationResult
    addressBookEntryId:   text('address_book_entry_id'),                     // FK → address_book
    createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('checkout_addresses_venture_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`venture_id = current_setting('app.current_venture_id')::text`,
      withCheck: sql`venture_id = current_setting('app.current_venture_id')::text`,
    }),
  ],
);
```

### checkout_shipping_selections

```typescript
/**
 * Shipping rate selections made during checkout.
 * Stores both the selected rate and all available rates at time of selection.
 */
export const checkoutShippingSelections = pgTable(
  'checkout_shipping_selections',
  {
    id:                   text('id').primaryKey(),                           // ULID
    ventureId:            text('venture_id').notNull(),
    checkoutSessionId:    text('checkout_session_id').notNull(),             // FK → checkout_sessions
    selectedCarrier:      text('selected_carrier').notNull(),                // ShippingCarrier
    selectedServiceLevel: text('selected_service_level').notNull(),
    selectedServiceName:  text('selected_service_name').notNull(),
    selectedAmount:       integer('selected_amount').notNull(),              // cents
    selectedCurrency:     text('selected_currency').notNull(),
    carrierRateId:        text('carrier_rate_id').notNull(),                 // External rate ID
    deliveryEstimate:     jsonb('delivery_estimate').notNull(),              // DeliveryEstimate
    availableRates:       jsonb('available_rates').notNull(),                // ShippingRate[]
    ratesQueriedAt:       timestamp('rates_queried_at', { withTimezone: true }).notNull(),
    ratesExpireAt:        timestamp('rates_expire_at', { withTimezone: true }).notNull(),
    createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('checkout_shipping_venture_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`venture_id = current_setting('app.current_venture_id')::text`,
      withCheck: sql`venture_id = current_setting('app.current_venture_id')::text`,
    }),
  ],
);
```

### checkout_payments

```typescript
/**
 * Payment records for checkout sessions.
 * Tracks the full lifecycle of payment intents — from creation through
 * capture, failure, or cancellation.
 */
export const checkoutPayments = pgTable(
  'checkout_payments',
  {
    id:                   text('id').primaryKey(),                           // ULID
    ventureId:            text('venture_id').notNull(),
    checkoutSessionId:    text('checkout_session_id').notNull(),             // FK → checkout_sessions
    provider:             text('provider').notNull(),                         // PaymentProvider
    externalId:           text('external_id').notNull(),                      // Stripe pi_xxx, PayPal order ID, etc.
    amount:               integer('amount').notNull(),                        // cents
    currency:             text('currency').notNull(),
    status:               text('status').notNull().default('pending'),        // PaymentStatus
    clientSecret:         text('client_secret'),                              // Stripe client secret (encrypted at rest)
    requiresAction:       boolean('requires_action').notNull().default(false),
    actionUrl:            text('action_url'),                                 // 3DS challenge URL
    paymentMethodToken:   text('payment_method_token'),                      // Tokenized payment method
    cardLast4:            text('card_last_4'),
    cardBrand:            text('card_brand'),
    threeDSecureResult:   jsonb('three_d_secure_result'),                    // ThreeDSecureResult
    errorMessage:         text('error_message'),
    errorCode:            text('error_code'),
    idempotencyKey:       text('idempotency_key').notNull().unique(),        // Prevent double charges
    providerMetadata:     jsonb('provider_metadata').default(sql`'{}'::jsonb`),
    capturedAt:           timestamp('captured_at', { withTimezone: true }),
    failedAt:             timestamp('failed_at', { withTimezone: true }),
    canceledAt:           timestamp('canceled_at', { withTimezone: true }),
    createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('checkout_payments_venture_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`venture_id = current_setting('app.current_venture_id')::text`,
      withCheck: sql`venture_id = current_setting('app.current_venture_id')::text`,
    }),
  ],
);
```

### checkout_custom_fields

```typescript
/**
 * Custom field definitions and submitted values for venture-specific
 * checkout customization. Definitions are venture-scoped; values are
 * session-scoped.
 */
export const checkoutCustomFields = pgTable(
  'checkout_custom_fields',
  {
    id:                   text('id').primaryKey(),                           // ULID
    ventureId:            text('venture_id').notNull(),
    key:                  text('key').notNull(),                              // Unique per venture
    label:                text('label').notNull(),
    type:                 text('type').notNull(),                             // 'text' | 'select' | etc.
    step:                 text('step').notNull(),                             // CheckoutStepName
    required:             boolean('required').notNull().default(false),
    validationRules:      jsonb('validation_rules').default(sql`'[]'::jsonb`),
    options:              jsonb('options').default(sql`'[]'::jsonb`),         // For select/radio
    placeholder:          text('placeholder'),
    helpText:             text('help_text'),
    displayOrder:         integer('display_order').notNull().default(0),
    active:               boolean('active').notNull().default(true),
    createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('checkout_custom_fields_venture_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`venture_id = current_setting('app.current_venture_id')::text`,
      withCheck: sql`venture_id = current_setting('app.current_venture_id')::text`,
    }),
  ],
);

/**
 * Submitted custom field values per checkout session.
 */
export const checkoutCustomFieldValues = pgTable(
  'checkout_custom_field_values',
  {
    id:                   text('id').primaryKey(),                           // ULID
    ventureId:            text('venture_id').notNull(),
    checkoutSessionId:    text('checkout_session_id').notNull(),             // FK → checkout_sessions
    fieldId:              text('field_id').notNull(),                         // FK → checkout_custom_fields
    fieldKey:             text('field_key').notNull(),
    value:                text('value').notNull(),
    valid:                boolean('valid').notNull().default(true),
    createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('checkout_custom_field_values_venture_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`venture_id = current_setting('app.current_venture_id')::text`,
      withCheck: sql`venture_id = current_setting('app.current_venture_id')::text`,
    }),
  ],
);
```

### checkout_events

```typescript
/**
 * Audit log of all checkout events.
 * Append-only table for full checkout lifecycle tracking.
 * Also serves as the source for Redpanda event publishing.
 */
export const checkoutEvents = pgTable(
  'checkout_events',
  {
    id:                   text('id').primaryKey(),                           // ULID
    ventureId:            text('venture_id').notNull(),
    checkoutSessionId:    text('checkout_session_id').notNull(),             // FK → checkout_sessions
    eventType:            text('event_type').notNull(),                       // CheckoutEventPayload['type']
    payload:              jsonb('payload').notNull(),                         // Full event payload
    publishedToRedpanda:  boolean('published_to_redpanda').notNull().default(false),
    publishedAt:          timestamp('published_at', { withTimezone: true }),
    createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('checkout_events_venture_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`venture_id = current_setting('app.current_venture_id')::text`,
      withCheck: sql`venture_id = current_setting('app.current_venture_id')::text`,
    }),
    // Events are append-only — no updates or deletes
    pgPolicy('checkout_events_append_only', {
      as: 'restrictive',
      for: 'update',
      using: sql`false`,
    }),
    pgPolicy('checkout_events_no_delete', {
      as: 'restrictive',
      for: 'delete',
      using: sql`false`,
    }),
  ],
);
```

### checkout_recovery

```typescript
/**
 * Recovery records for abandoned checkout sessions.
 * Tracks recovery email campaigns and session restoration.
 */
export const checkoutRecovery = pgTable(
  'checkout_recovery',
  {
    id:                   text('id').primaryKey(),                           // ULID
    ventureId:            text('venture_id').notNull(),
    checkoutSessionId:    text('checkout_session_id').notNull(),             // FK → checkout_sessions
    userId:               text('user_id'),                                    // FK → users (null for guest)
    email:                text('email').notNull(),
    recoveryToken:        text('recovery_token').notNull().unique(),          // Signed JWT
    recoveryUrl:          text('recovery_url').notNull(),
    emailsSent:           integer('emails_sent').notNull().default(0),
    maxEmails:            integer('max_emails').notNull().default(3),
    emailSentAt:          jsonb('email_sent_at').default(sql`'[]'::jsonb`), // Date[]
    recovered:            boolean('recovered').notNull().default(false),
    converted:            boolean('converted').notNull().default(false),
    restoredSessionId:    text('restored_session_id'),                       // FK → checkout_sessions (new session)
    expiresAt:            timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('checkout_recovery_venture_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`venture_id = current_setting('app.current_venture_id')::text`,
      withCheck: sql`venture_id = current_setting('app.current_venture_id')::text`,
    }),
  ],
);
```

### checkout_fraud_signals

```typescript
/**
 * Fraud assessment records for checkout sessions.
 * Stores the full fraud scoring result and individual signals.
 */
export const checkoutFraudSignals = pgTable(
  'checkout_fraud_signals',
  {
    id:                     text('id').primaryKey(),                           // ULID
    ventureId:              text('venture_id').notNull(),
    checkoutSessionId:      text('checkout_session_id').notNull(),             // FK → checkout_sessions
    score:                  integer('score').notNull(),                         // 0-100
    decision:               text('decision').notNull(),                        // FraudDecision
    signals:                jsonb('signals').notNull(),                         // FraudSignal[]
    provider:               text('provider').notNull(),                        // 'radar' | 'sift' | 'internal'
    externalAssessmentId:   text('external_assessment_id'),
    recommendedAction:      text('recommended_action').notNull(),              // 'allow' | 'challenge_3ds' | 'review' | 'block'
    actionTaken:            text('action_taken'),                               // What was actually done
    reportedOutcome:        text('reported_outcome'),                           // 'legitimate' | 'fraudulent' | 'chargeback'
    assessedAt:             timestamp('assessed_at', { withTimezone: true }).notNull(),
    createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('checkout_fraud_signals_venture_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`venture_id = current_setting('app.current_venture_id')::text`,
      withCheck: sql`venture_id = current_setting('app.current_venture_id')::text`,
    }),
  ],
);
```

### checkout_upsells

```typescript
/**
 * Upsell/cross-sell slot configurations and interactions.
 */
export const checkoutUpsells = pgTable(
  'checkout_upsells',
  {
    id:                   text('id').primaryKey(),                           // ULID
    ventureId:            text('venture_id').notNull(),
    step:                 text('step').notNull(),                             // CheckoutStepName
    position:             text('position').notNull(),                         // 'before_content' | 'after_content' | 'sidebar'
    type:                 text('type').notNull(),                             // UpsellSlot type
    productIds:           jsonb('product_ids').default(sql`'[]'::jsonb`),
    customComponent:      text('custom_component'),
    active:               boolean('active').notNull().default(true),
    displayRules:         jsonb('display_rules').default(sql`'{}'::jsonb`),
    impressions:          integer('impressions').notNull().default(0),
    clicks:               integer('clicks').notNull().default(0),
    conversions:          integer('conversions').notNull().default(0),
    revenue:              integer('revenue').notNull().default(0),            // cents
    createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy('checkout_upsells_venture_isolation', {
      as: 'permissive',
      for: 'all',
      using: sql`venture_id = current_setting('app.current_venture_id')::text`,
      withCheck: sql`venture_id = current_setting('app.current_venture_id')::text`,
    }),
  ],
);
```

---

## Code Examples

### 1. Create Checkout Session from Cart

```typescript
import { CheckoutService } from '@mcv/commerce/checkout';
import { CartService } from '@mcv/commerce/cart';

/**
 * Create a new checkout session from the user's active cart.
 * Validates cart contents, snapshots line items, and initializes
 * the checkout state machine.
 */
async function createCheckoutFromCart(
  ventureId: string,
  userId: string,
  cartId: string,
) {
  const cartService = new CartService();
  const checkoutService = new CheckoutService();

  // 1. Load and validate the cart
  const cart = await cartService.getCart(ventureId, cartId);

  if (!cart || cart.items.length === 0) {
    throw new CheckoutError('CHECKOUT_CART_EMPTY', 'Cannot create checkout from an empty cart');
  }

  // 2. Verify inventory availability for all items
  const inventoryCheck = await checkoutService.verifyInventory(
    ventureId,
    cart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    })),
  );

  if (!inventoryCheck.allAvailable) {
    throw new CheckoutInventoryExhaustedError(
      'Some items are no longer available',
      inventoryCheck.unavailableItems,
    );
  }

  // 3. Create the checkout session
  const session = await checkoutService.createSession({
    ventureId,
    userId,
    cartId,
    lineItems: cart.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      imageUrl: item.imageUrl,
      weight: item.weight,
      dimensions: item.dimensions,
      taxCode: item.taxCode,
    })),
    subtotalAmount: cart.subtotal,
    totalAmount: cart.subtotal, // Will be updated with shipping + tax
    currency: cart.currency,
    appliedDiscountCodes: cart.appliedDiscountCodes,
    isGuest: false,
    isExpress: false,
    metadata: {
      cartVersion: cart.version,
      source: 'web',
    },
  });

  // 4. Emit checkout.created event
  await checkoutService.emitEvent({
    type: 'checkout.created',
    checkoutSessionId: session.id,
    ventureId,
    userId,
    cartId,
    totalAmount: session.totalAmount,
    currency: session.currency,
    itemCount: session.lineItems.length,
    isGuest: false,
    isExpress: false,
    timestamp: new Date(),
  });

  return session;
}

// Usage
const session = await createCheckoutFromCart(
  'venture_abc123',
  'user_xyz789',
  'cart_def456',
);

console.log(`Checkout session created: ${session.id}`);
console.log(`Current step: ${session.currentStep}`);  // 'address'
console.log(`Expires at: ${session.expiresAt}`);       // 30 min from now
```

### 2. Address Validation

```typescript
import { AddressValidator, AddressService } from '@mcv/commerce/checkout';

/**
 * Validate and standardize a shipping address using the configured
 * address validation provider (SmartyStreets or Google).
 * Returns the validation result with suggestions if the address
 * needs correction.
 */
async function validateAndSetShippingAddress(
  checkoutSessionId: string,
  ventureId: string,
  address: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode: string;
    phone?: string;
  },
) {
  const addressValidator = new AddressValidator();
  const addressService = new AddressService();

  // 1. Validate the address with external provider
  const validationResult = await addressValidator.validate(
    {
      ...address,
      id: '',
      type: 'shipping',
      company: null,
      addressLine2: address.addressLine2 ?? null,
      phone: address.phone ?? null,
      validated: false,
      validationResult: null,
      addressBookEntryId: null,
    },
    ventureId,
  );

  // 2. Handle validation outcomes
  if (!validationResult.deliverable) {
    return {
      valid: false,
      error: 'Address is not deliverable. Please check and try again.',
      suggestions: validationResult.suggestions,
      validationResult,
    };
  }

  // 3. If confidence is low, offer suggestions
  if (validationResult.confidence < 80 && validationResult.suggestions.length > 0) {
    return {
      valid: false,
      error: 'We found a potential issue with your address.',
      suggestions: validationResult.suggestions,
      validationResult,
      requiresConfirmation: true,
    };
  }

  // 4. Use standardized address if available, otherwise use input
  const finalAddress = validationResult.standardized
    ? { ...address, ...validationResult.standardized }
    : address;

  // 5. Save the validated address to the checkout session
  const savedAddress = await addressService.setAddress(
    checkoutSessionId,
    ventureId,
    {
      type: 'shipping',
      ...finalAddress,
      validated: true,
      validationResult,
    },
  );

  return {
    valid: true,
    address: savedAddress,
    validationResult,
    standardized: !!validationResult.standardized,
  };
}

// Usage
const result = await validateAndSetShippingAddress(
  'checkout_abc123',
  'venture_xyz',
  {
    firstName: 'Jane',
    lastName: 'Doe',
    addressLine1: '123 Main St',
    addressLine2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    countryCode: 'US',
    phone: '+12125551234',
  },
);

if (result.valid) {
  console.log('Address validated and saved:', result.address.id);
} else if (result.requiresConfirmation) {
  console.log('Address needs confirmation. Suggestions:', result.suggestions);
} else {
  console.log('Address invalid:', result.error);
}
```

### 3. Shipping Rate Calculation

```typescript
import { ShippingRateService, CheckoutSessionManager } from '@mcv/commerce/checkout';

/**
 * Fetch real-time shipping rates from all configured carriers
 * and present them to the customer for selection.
 */
async function getShippingRatesForCheckout(
  checkoutSessionId: string,
  ventureId: string,
) {
  const shippingRateService = new ShippingRateService();
  const sessionManager = new CheckoutSessionManager();

  // 1. Load the current checkout session
  const session = await sessionManager.getSession(checkoutSessionId, ventureId);

  if (!session.shippingAddress) {
    throw new CheckoutStepInvalidError(
      'Shipping address must be set before requesting rates',
      'shipping',
    );
  }

  // 2. Determine the shipping origin (warehouse/fulfillment center)
  const origin = await shippingRateService.getShippingOrigin(ventureId);

  // 3. Fetch rates from all enabled carriers in parallel
  const rates = await shippingRateService.getRates(
    session,
    origin,
    session.shippingAddress,
  );

  // 4. Sort rates by price (cheapest first)
  const sortedRates = rates.sort((a, b) => a.amount - b.amount);

  // 5. Group by carrier for display
  const ratesByCarrier = sortedRates.reduce<Record<string, typeof sortedRates>>(
    (acc, rate) => {
      if (!acc[rate.carrier]) acc[rate.carrier] = [];
      acc[rate.carrier].push(rate);
      return acc;
    },
    {},
  );

  // 6. Cache rates on the session
  await sessionManager.updateSession(checkoutSessionId, ventureId, {
    availableShippingRates: sortedRates,
  });

  return {
    rates: sortedRates,
    ratesByCarrier,
    cheapest: sortedRates[0] ?? null,
    fastest: sortedRates.reduce((fastest, rate) =>
      rate.deliveryEstimate.businessDays < fastest.deliveryEstimate.businessDays
        ? rate
        : fastest,
      sortedRates[0],
    ),
    rateCount: sortedRates.length,
  };
}

/**
 * Select a shipping method for the checkout session.
 */
async function selectShippingMethod(
  checkoutSessionId: string,
  ventureId: string,
  rateId: string,
) {
  const shippingRateService = new ShippingRateService();
  const sessionManager = new CheckoutSessionManager();

  const session = await sessionManager.getSession(checkoutSessionId, ventureId);

  // 1. Find the selected rate from cached available rates
  const selectedRate = session.availableShippingRates.find((r) => r.id === rateId);

  if (!selectedRate) {
    throw new CheckoutShippingUnavailableError('Selected shipping rate is no longer available');
  }

  // 2. Verify rate hasn't expired
  if (new Date() > selectedRate.expiresAt) {
    throw new CheckoutShippingUnavailableError('Shipping rate has expired. Please refresh rates.');
  }

  // 3. Validate rate price hasn't changed
  const stillValid = await shippingRateService.validateRate(rateId, selectedRate.amount);

  if (!stillValid) {
    throw new CheckoutShippingUnavailableError('Shipping rate price has changed. Please refresh.');
  }

  // 4. Save selection and update session totals
  const updatedSession = await sessionManager.setShippingMethod(
    checkoutSessionId,
    ventureId,
    {
      rateId: selectedRate.id,
      carrier: selectedRate.carrier,
      serviceLevel: selectedRate.serviceLevel,
      serviceName: selectedRate.serviceName,
      amount: selectedRate.amount,
      currency: selectedRate.currency,
      deliveryEstimate: selectedRate.deliveryEstimate,
    },
  );

  return updatedSession;
}

// Usage
const rates = await getShippingRatesForCheckout('checkout_abc123', 'venture_xyz');
console.log(`Found ${rates.rateCount} shipping options`);
console.log(`Cheapest: ${rates.cheapest.serviceName} - $${rates.cheapest.amount / 100}`);
console.log(`Fastest: ${rates.fastest.serviceName} - ${rates.fastest.deliveryEstimate.businessDays} days`);

const session = await selectShippingMethod('checkout_abc123', 'venture_xyz', rates.cheapest.id);
console.log(`Shipping selected. New total: $${session.totalAmount / 100}`);
```

### 4. Payment Intent Creation & Processing

```typescript
import {
  PaymentProcessor,
  FraudChecker,
  CheckoutSessionManager,
} from '@mcv/commerce/checkout';

/**
 * Create a payment intent and handle the full payment flow,
 * including fraud assessment and 3D Secure challenges.
 */
async function initiatePayment(
  checkoutSessionId: string,
  ventureId: string,
  paymentProvider: PaymentProvider,
  paymentMethodToken?: string,
) {
  const paymentProcessor = new PaymentProcessor(paymentProvider);
  const fraudChecker = new FraudChecker();
  const sessionManager = new CheckoutSessionManager();

  // 1. Load the current checkout session
  const session = await sessionManager.getSession(checkoutSessionId, ventureId);

  // 2. Verify all prerequisite steps are complete
  if (!session.shippingAddress || !session.selectedShippingMethod) {
    throw new CheckoutStepInvalidError(
      'Address and shipping must be completed before payment',
      'payment',
    );
  }

  // 3. Run fraud assessment
  const fraudScore = await fraudChecker.assess(session);

  // 4. Handle fraud decisions
  if (fraudScore.decision === 'reject') {
    await sessionManager.updateSession(checkoutSessionId, ventureId, {
      status: 'failed',
      fraudScore,
    });

    await sessionManager.emitEvent({
      type: 'checkout.fraud_flagged',
      checkoutSessionId,
      ventureId,
      fraudScore: fraudScore.score,
      decision: fraudScore.decision,
      signals: fraudScore.signals.map((s) => s.type),
      action: 'blocked',
      timestamp: new Date(),
    });

    throw new CheckoutFraudBlockedError(
      'This transaction has been declined for security reasons',
    );
  }

  // 5. Create the payment intent
  const paymentIntent = await paymentProcessor.createIntent(
    session,
    paymentMethodToken,
  );

  // 6. Save payment intent to session
  await sessionManager.updateSession(checkoutSessionId, ventureId, {
    paymentIntentId: paymentIntent.id,
    paymentProvider,
    paymentStatus: paymentIntent.status,
    paymentMethodToken: paymentIntent.paymentMethodToken,
    fraudScore,
  });

  // 7. Emit payment initiated event
  await sessionManager.emitEvent({
    type: 'checkout.payment_initiated',
    checkoutSessionId,
    ventureId,
    provider: paymentProvider,
    amount: session.totalAmount,
    currency: session.currency,
    timestamp: new Date(),
  });

  // 8. Handle 3D Secure challenge if required
  if (paymentIntent.requiresAction) {
    // If fraud score recommends 3DS, or provider requires it
    return {
      status: 'requires_action',
      clientSecret: paymentIntent.clientSecret,
      actionUrl: paymentIntent.actionUrl,
      paymentIntentId: paymentIntent.id,
      message: '3D Secure authentication required',
    };
  }

  // 9. If payment succeeded immediately (e.g., saved card, no 3DS)
  if (paymentIntent.status === 'requires_capture') {
    return {
      status: 'authorized',
      paymentIntentId: paymentIntent.id,
      message: 'Payment authorized. Ready for review.',
    };
  }

  return {
    status: paymentIntent.status,
    clientSecret: paymentIntent.clientSecret,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Handle the Stripe webhook callback after 3DS completion.
 */
async function handlePaymentWebhook(
  provider: PaymentProvider,
  payload: Buffer,
  signature: string,
) {
  const paymentProcessor = new PaymentProcessor(provider);
  const sessionManager = new CheckoutSessionManager();

  // 1. Verify and parse the webhook
  const { event, data } = await paymentProcessor.handleWebhook(payload, signature);

  // 2. Route based on event type
  switch (event) {
    case 'payment_intent.succeeded': {
      const externalId = data.id as string;
      const payment = await sessionManager.findPaymentByExternalId(externalId);

      await sessionManager.updatePaymentStatus(payment.id, 'requires_capture');

      await sessionManager.emitEvent({
        type: 'checkout.payment_completed',
        checkoutSessionId: payment.checkoutSessionId,
        ventureId: payment.ventureId,
        provider,
        paymentIntentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        timestamp: new Date(),
      });
      break;
    }

    case 'payment_intent.payment_failed': {
      const externalId = data.id as string;
      const payment = await sessionManager.findPaymentByExternalId(externalId);

      await sessionManager.updatePaymentStatus(payment.id, 'failed', {
        errorCode: data.last_payment_error?.code,
        errorMessage: data.last_payment_error?.message,
      });

      await sessionManager.emitEvent({
        type: 'checkout.payment_failed',
        checkoutSessionId: payment.checkoutSessionId,
        ventureId: payment.ventureId,
        provider,
        errorCode: data.last_payment_error?.code ?? 'unknown',
        errorMessage: data.last_payment_error?.message ?? 'Payment failed',
        timestamp: new Date(),
      });
      break;
    }
  }
}

// Usage
const paymentResult = await initiatePayment(
  'checkout_abc123',
  'venture_xyz',
  'stripe',
  'pm_card_visa',
);

if (paymentResult.status === 'requires_action') {
  console.log('3DS challenge required. Redirect to:', paymentResult.actionUrl);
  // Client-side: stripe.handleCardAction(paymentResult.clientSecret)
} else if (paymentResult.status === 'authorized') {
  console.log('Payment authorized! Proceed to review step.');
}
```

### 5. Atomic Order Creation

```typescript
import {
  OrderCreator,
  CheckoutSessionManager,
  PaymentProcessor,
  InventoryReservationService,
  OrderConfirmationService,
  CheckoutEventEmitter,
} from '@mcv/commerce/checkout';

/**
 * Atomically create an order from a completed checkout session.
 * This is the critical path — all steps must succeed or the
 * entire operation rolls back.
 */
async function completeCheckout(
  checkoutSessionId: string,
  ventureId: string,
) {
  const orderCreator = new OrderCreator();
  const sessionManager = new CheckoutSessionManager();
  const paymentProcessor = new PaymentProcessor('stripe');
  const inventoryService = new InventoryReservationService();
  const confirmationService = new OrderConfirmationService();
  const eventEmitter = new CheckoutEventEmitter();

  // 1. Load and validate the session
  const session = await sessionManager.getSession(checkoutSessionId, ventureId);

  if (session.status !== 'active') {
    throw new CheckoutOrderCreationFailedError(
      `Cannot complete checkout with status: ${session.status}`,
    );
  }

  if (session.currentStep !== 'confirm') {
    throw new CheckoutStepInvalidError(
      'Checkout must be on confirm step to complete',
      'confirm',
    );
  }

  // 2. Generate idempotency key to prevent double-creation
  const idempotencyKey = `order_${checkoutSessionId}_${Date.now()}`;

  // 3. Begin the atomic order creation
  const startTime = Date.now();
  const result = await orderCreator.createOrder(session);

  if (!result.success) {
    // If order creation fails, emit failure event
    await eventEmitter.emit({
      type: 'checkout.payment_failed',
      checkoutSessionId,
      ventureId,
      provider: session.paymentProvider!,
      errorCode: result.error?.code ?? 'ORDER_CREATION_FAILED',
      errorMessage: result.error?.message ?? 'Order creation failed',
      timestamp: new Date(),
    });

    // If the error is retryable, save state for retry
    if (result.error?.retryable) {
      await sessionManager.updateSession(checkoutSessionId, ventureId, {
        metadata: {
          ...session.metadata,
          lastOrderAttemptError: result.error,
          idempotencyKey,
        },
      });
    }

    throw new CheckoutOrderCreationFailedError(
      result.error?.message ?? 'Order creation failed',
      result.error,
    );
  }

  // 4. Mark checkout as completed
  await sessionManager.updateSession(checkoutSessionId, ventureId, {
    status: 'completed',
    completedOrderId: result.orderId,
  });

  // 5. Emit completion event
  const durationMs = Date.now() - startTime;
  await eventEmitter.emit({
    type: 'checkout.completed',
    checkoutSessionId,
    ventureId,
    orderId: result.orderId!,
    orderNumber: result.orderNumber!,
    totalAmount: session.totalAmount,
    currency: session.currency,
    itemCount: session.lineItems.length,
    isGuest: session.isGuest,
    isExpress: session.isExpress,
    durationMs,
    timestamp: new Date(),
  });

  // 6. Queue confirmation email (fire-and-forget)
  confirmationService.queueConfirmationEmail(
    result.orderId!,
    session.userId ?? session.guestEmail!,
    ventureId,
  ).catch((err) => {
    console.error('Failed to queue confirmation email:', err);
    // Non-fatal — order still created successfully
  });

  return {
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    paymentCaptured: result.paymentCaptured,
    inventoryReserved: result.inventoryReserved,
    confirmationEmailQueued: result.confirmationEmailQueued,
    totalAmount: session.totalAmount,
    currency: session.currency,
  };
}

// Usage
try {
  const order = await completeCheckout('checkout_abc123', 'venture_xyz');
  console.log(`Order created: ${order.orderNumber}`);
  console.log(`Payment captured: ${order.paymentCaptured}`);
  console.log(`Total: $${order.totalAmount / 100} ${order.currency.toUpperCase()}`);
} catch (error) {
  if (error instanceof CheckoutOrderCreationFailedError) {
    console.error('Order creation failed:', error.message);
    if (error.details?.retryable) {
      console.log('Error is retryable — scheduling retry...');
    }
  }
}
```

### 6. Guest Checkout Flow

```typescript
import {
  GuestCheckoutService,
  CheckoutService,
  PostPurchaseAccountService,
} from '@mcv/commerce/checkout';

/**
 * Complete guest checkout flow — no account required.
 * Collects email for order confirmation and optional
 * post-purchase account creation.
 */
async function startGuestCheckout(
  ventureId: string,
  cartId: string,
  guestEmail: string,
) {
  const guestService = new GuestCheckoutService();
  const checkoutService = new CheckoutService();

  // 1. Validate guest email
  const emailValidation = await guestService.validateGuestEmail(guestEmail);

  if (!emailValidation.valid) {
    throw new CheckoutError('CHECKOUT_INVALID_EMAIL', emailValidation.error);
  }

  // 2. Check if email belongs to an existing user
  const existingUser = await guestService.findUserByEmail(ventureId, guestEmail);

  if (existingUser) {
    return {
      existingAccount: true,
      message: 'An account with this email exists. Would you like to sign in for a faster checkout?',
      loginUrl: `/auth/login?email=${encodeURIComponent(guestEmail)}&redirect=checkout`,
    };
  }

  // 3. Create guest checkout session
  const session = await checkoutService.createSession({
    ventureId,
    userId: null,            // No user — guest checkout
    guestEmail,
    cartId,
    isGuest: true,
    isExpress: false,
    // ... line items populated from cart
  });

  // 4. Generate guest access token (for session continuity)
  const guestToken = await guestService.createGuestToken(
    session.id,
    guestEmail,
    ventureId,
  );

  return {
    existingAccount: false,
    session,
    guestToken,               // Client stores this for session access
    message: 'Guest checkout started. Proceed to enter your address.',
  };
}

/**
 * After guest checkout completes, offer account creation.
 */
async function offerPostPurchaseAccount(
  checkoutSessionId: string,
  ventureId: string,
) {
  const postPurchaseService = new PostPurchaseAccountService();
  const sessionManager = new CheckoutSessionManager();

  const session = await sessionManager.getSession(checkoutSessionId, ventureId);

  if (!session.isGuest || !session.guestEmail || session.status !== 'completed') {
    return null;
  }

  // 1. Generate account creation token
  const accountToken = await postPurchaseService.createAccountToken(
    session.guestEmail,
    ventureId,
    session.completedOrderId!,
  );

  // 2. Pre-populate account data from checkout
  const prefill = {
    email: session.guestEmail,
    firstName: session.shippingAddress?.firstName,
    lastName: session.shippingAddress?.lastName,
    phone: session.shippingAddress?.phone,
    defaultShippingAddress: session.shippingAddress,
    defaultBillingAddress: session.billingAddress,
  };

  return {
    accountCreationUrl: `/auth/register?token=${accountToken}`,
    prefill,
    benefits: [
      'Track your order status',
      'Faster checkout next time',
      'Save your addresses and payment methods',
      'View order history',
    ],
  };
}

// Usage
const guest = await startGuestCheckout(
  'venture_xyz',
  'cart_anonymous_123',
  'guest@example.com',
);

if (guest.existingAccount) {
  console.log(guest.message);
  // Redirect to login
} else {
  console.log(`Guest checkout session: ${guest.session.id}`);
  // Store guest.guestToken in cookie/localStorage
  // Proceed with normal checkout flow
}
```

### 7. Express Checkout (One-Click)

```typescript
import {
  ExpressCheckoutService,
  CheckoutService,
  PaymentMethodService,
  AddressBookService,
} from '@mcv/commerce/checkout';

/**
 * One-click express checkout for returning customers
 * with saved payment methods and addresses.
 * Skips address, shipping, and payment steps.
 */
async function performExpressCheckout(
  ventureId: string,
  userId: string,
  cartId: string,
) {
  const expressService = new ExpressCheckoutService();
  const paymentMethodService = new PaymentMethodService();
  const addressBookService = new AddressBookService();

  // 1. Verify user has saved payment method and address
  const defaultPayment = await paymentMethodService.getDefaultPaymentMethod(
    ventureId,
    userId,
  );

  if (!defaultPayment) {
    return {
      eligible: false,
      reason: 'No saved payment method. Please complete a standard checkout first.',
    };
  }

  const defaultAddress = await addressBookService.getDefaultShippingAddress(
    ventureId,
    userId,
  );

  if (!defaultAddress) {
    return {
      eligible: false,
      reason: 'No saved shipping address. Please complete a standard checkout first.',
    };
  }

  // 2. Create express checkout session (pre-populated)
  const session = await expressService.createExpressSession({
    ventureId,
    userId,
    cartId,
    shippingAddressId: defaultAddress.id,
    billingAddressId: defaultAddress.id, // Same as shipping by default
    paymentMethodToken: defaultPayment.externalToken,
    paymentProvider: defaultPayment.provider,
    isExpress: true,
  });

  // 3. Auto-select cheapest shipping method
  const shippingRates = await expressService.getQuickShippingRates(
    session,
    defaultAddress,
  );

  if (shippingRates.length === 0) {
    throw new CheckoutShippingUnavailableError(
      'No shipping options available for your address',
    );
  }

  const cheapestRate = shippingRates[0]; // Already sorted by price
  await expressService.selectShipping(session.id, ventureId, cheapestRate.id);

  // 4. Finalize tax calculation
  await expressService.finalizeTax(session.id, ventureId);

  // 5. Session jumps directly to review step
  const finalSession = await expressService.advanceToReview(session.id, ventureId);

  return {
    eligible: true,
    session: finalSession,
    summary: {
      shippingAddress: defaultAddress,
      paymentMethod: {
        brand: defaultPayment.cardBrand,
        last4: defaultPayment.cardLast4,
        provider: defaultPayment.provider,
      },
      shippingMethod: {
        name: cheapestRate.serviceName,
        cost: cheapestRate.amount,
        deliveryEstimate: cheapestRate.deliveryEstimate,
      },
      subtotal: finalSession.subtotalAmount,
      shipping: finalSession.shippingAmount,
      tax: finalSession.taxAmount,
      total: finalSession.totalAmount,
      currency: finalSession.currency,
    },
    message: 'Review your order and confirm to complete purchase.',
  };
}

// Usage
const express = await performExpressCheckout(
  'venture_xyz',
  'user_returning_123',
  'cart_quick_456',
);

if (express.eligible) {
  console.log('Express checkout ready!');
  console.log(`Ship to: ${express.summary.shippingAddress.addressLine1}`);
  console.log(`Pay with: ${express.summary.paymentMethod.brand} ****${express.summary.paymentMethod.last4}`);
  console.log(`Total: $${express.summary.total / 100}`);
  // User just clicks "Confirm" → completeCheckout()
} else {
  console.log(`Not eligible: ${express.reason}`);
  // Fall back to standard checkout
}
```

### 8. Abandoned Checkout Recovery

```typescript
import {
  CheckoutRecoveryService,
  AbandonedCheckoutEmailService,
  SessionReplayService,
  CheckoutSessionManager,
} from '@mcv/commerce/checkout';

/**
 * Detect abandoned checkouts and send recovery emails.
 * Called by a scheduled cron job every 15 minutes.
 */
async function processAbandonedCheckouts(ventureId: string) {
  const recoveryService = new CheckoutRecoveryService();
  const emailService = new AbandonedCheckoutEmailService();
  const sessionManager = new CheckoutSessionManager();

  // 1. Load venture recovery configuration
  const config = await sessionManager.getVentureConfig(ventureId);

  if (!config.recovery.enabled) {
    return { processed: 0, message: 'Recovery disabled for this venture' };
  }

  // 2. Detect abandoned checkouts
  const abandonedSessions = await recoveryService.detectAbandoned(
    ventureId,
    config.recovery.abandonedAfterMinutes,
  );

  let emailsSent = 0;
  let errored = 0;

  for (const recovery of abandonedSessions) {
    try {
      // 3. Determine which email in the sequence to send
      const emailIndex = recovery.emailsSent;
      const delayMinutes = config.recovery.emailDelayMinutes[emailIndex];

      if (emailIndex >= config.recovery.maxEmails) {
        continue; // Max emails reached for this checkout
      }

      // 4. Check if enough time has passed since last email
      const lastSentAt = recovery.emailSentAt[recovery.emailSentAt.length - 1];
      if (lastSentAt) {
        const minutesSinceLastEmail =
          (Date.now() - new Date(lastSentAt).getTime()) / 60_000;
        if (minutesSinceLastEmail < delayMinutes) {
          continue; // Not yet time for the next email
        }
      }

      // 5. Load the original session for email personalization
      const session = await sessionManager.getSession(
        recovery.checkoutSessionId,
        ventureId,
      );

      // 6. Send the recovery email
      const sent = await emailService.sendRecoveryEmail(recovery.id, {
        email: recovery.email,
        recoveryUrl: recovery.recoveryUrl,
        customerName: session.shippingAddress?.firstName ?? 'there',
        items: session.lineItems.map((item) => ({
          name: item.name,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        totalAmount: session.totalAmount,
        currency: session.currency,
        lastStep: session.currentStep,
        emailSequence: emailIndex + 1,
        incentive: emailIndex >= 1
          ? { type: 'discount', code: 'COMEBACK10', percentage: 10 }
          : undefined,
      });

      if (sent) emailsSent++;
    } catch (error) {
      console.error(`Failed to process recovery ${recovery.id}:`, error);
      errored++;
    }
  }

  return {
    processed: abandonedSessions.length,
    emailsSent,
    errored,
    message: `Processed ${abandonedSessions.length} abandoned checkouts, sent ${emailsSent} emails`,
  };
}

/**
 * Restore a checkout session from a recovery link.
 */
async function restoreCheckoutFromRecoveryLink(recoveryToken: string) {
  const recoveryService = new CheckoutRecoveryService();
  const sessionReplay = new SessionReplayService();

  // 1. Validate the recovery token
  const recovery = await recoveryService.validateToken(recoveryToken);

  if (!recovery) {
    throw new CheckoutRecoveryExpiredError('This recovery link has expired or is invalid');
  }

  // 2. Restore the session (creates a new session with original data)
  const restoredSession = await recoveryService.restoreSession(recoveryToken);

  // 3. Mark recovery as recovered
  await recoveryService.markRecovered(recovery.id, restoredSession.id);

  // 4. Emit recovery event
  await recoveryService.emitEvent({
    type: 'checkout.recovery',
    checkoutSessionId: recovery.checkoutSessionId,
    ventureId: recovery.ventureId,
    recoveryId: recovery.id,
    action: 'session_restored',
    timestamp: new Date(),
  });

  return {
    session: restoredSession,
    restoredFrom: recovery.checkoutSessionId,
    message: 'Your checkout has been restored. Pick up where you left off!',
    resumeStep: restoredSession.currentStep,
  };
}

/**
 * Get recovery analytics for the venture dashboard.
 */
async function getRecoveryDashboard(
  ventureId: string,
  days: number = 30,
) {
  const recoveryService = new CheckoutRecoveryService();

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const stats = await recoveryService.getRecoveryStats(ventureId, { from, to: now });

  return {
    period: `Last ${days} days`,
    totalAbandoned: stats.totalAbandoned,
    recoveryEmailsSent: stats.emailsSent,
    sessionsRecovered: stats.recovered,
    ordersConverted: stats.converted,
    recoveryRate: `${(stats.recoveryRate * 100).toFixed(1)}%`,
    conversionRate: `${(stats.conversionRate * 100).toFixed(1)}%`,
    revenueRecovered: `$${(stats.revenueRecovered / 100).toFixed(2)}`,
    currency: stats.currency,
  };
}

// Usage — Cron job
const results = await processAbandonedCheckouts('venture_xyz');
console.log(results.message);

// Usage — Recovery link click
const restored = await restoreCheckoutFromRecoveryLink('eyJhbGciOiJIUzI1NiIs...');
console.log(`Session restored at step: ${restored.resumeStep}`);

// Usage — Dashboard
const dashboard = await getRecoveryDashboard('venture_xyz', 30);
console.log(`Recovery rate: ${dashboard.recoveryRate}`);
console.log(`Revenue recovered: ${dashboard.revenueRecovered}`);
```

---

## Error Codes

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| `CHECKOUT_CART_EMPTY` | `CheckoutError` | 400 | Cannot create checkout from an empty cart |
| `CHECKOUT_SESSION_EXPIRED` | `CheckoutSessionExpiredError` | 410 | Checkout session has exceeded its TTL |
| `CHECKOUT_SESSION_NOT_FOUND` | `CheckoutError` | 404 | Checkout session does not exist or is inaccessible |
| `CHECKOUT_STEP_INVALID` | `CheckoutStepInvalidError` | 400 | Attempted to transition to a step that is not valid given current state |
| `CHECKOUT_STEP_PREREQUISITE` | `CheckoutStepInvalidError` | 400 | Prerequisite steps have not been completed |
| `CHECKOUT_ADDRESS_INVALID` | `CheckoutAddressInvalidError` | 422 | Address validation failed — address is not deliverable |
| `CHECKOUT_ADDRESS_COUNTRY_UNSUPPORTED` | `CheckoutAddressInvalidError` | 422 | Shipping to the specified country is not supported by this venture |
| `CHECKOUT_SHIPPING_UNAVAILABLE` | `CheckoutShippingUnavailableError` | 422 | No shipping methods available for the destination |
| `CHECKOUT_SHIPPING_RATE_EXPIRED` | `CheckoutShippingUnavailableError` | 410 | Selected shipping rate has expired, rates must be refreshed |
| `CHECKOUT_SHIPPING_RATE_CHANGED` | `CheckoutShippingUnavailableError` | 409 | Shipping rate price has changed since selection |
| `CHECKOUT_PAYMENT_DECLINED` | `CheckoutPaymentDeclinedError` | 402 | Payment was declined by the payment provider |
| `CHECKOUT_PAYMENT_REQUIRES_ACTION` | `CheckoutPaymentRequiresActionError` | 402 | Payment requires additional authentication (3DS/SCA) |
| `CHECKOUT_PAYMENT_PROVIDER_ERROR` | `CheckoutError` | 502 | Payment provider returned an unexpected error |
| `CHECKOUT_PAYMENT_CURRENCY_UNSUPPORTED` | `CheckoutError` | 422 | Payment provider does not support the requested currency |
| `CHECKOUT_INVENTORY_EXHAUSTED` | `CheckoutInventoryExhaustedError` | 409 | One or more items are no longer in stock |
| `CHECKOUT_FRAUD_BLOCKED` | `CheckoutFraudBlockedError` | 403 | Transaction blocked by fraud detection system |
| `CHECKOUT_FRAUD_REVIEW` | `CheckoutError` | 202 | Transaction flagged for manual review |
| `CHECKOUT_ORDER_CREATION_FAILED` | `CheckoutOrderCreationFailedError` | 500 | Atomic order creation failed (see details for specific step) |
| `CHECKOUT_ORDER_DUPLICATE` | `CheckoutError` | 409 | Order has already been created for this checkout (idempotency) |
| `CHECKOUT_RECOVERY_EXPIRED` | `CheckoutRecoveryExpiredError` | 410 | Checkout recovery token has expired |
| `CHECKOUT_RECOVERY_ALREADY_CONVERTED` | `CheckoutError` | 409 | Abandoned checkout has already been recovered and completed |
| `CHECKOUT_CUSTOM_FIELD_VALIDATION` | `CheckoutCustomFieldValidationError` | 422 | Custom field value failed validation rules |
| `CHECKOUT_CUSTOM_FIELD_REQUIRED` | `CheckoutCustomFieldValidationError` | 422 | Required custom field was not provided |
| `CHECKOUT_MINIMUM_ORDER` | `CheckoutError` | 422 | Order total is below the venture's minimum order amount |
| `CHECKOUT_MAXIMUM_ORDER` | `CheckoutError` | 422 | Order total exceeds the venture's maximum order amount |
| `CHECKOUT_MAXIMUM_ITEMS` | `CheckoutError` | 422 | Number of items exceeds the maximum per checkout |
| `CHECKOUT_TAX_CALCULATION_FAILED` | `CheckoutError` | 502 | Tax provider returned an error during finalization |
| `CHECKOUT_TAX_EXEMPT_INVALID` | `CheckoutError` | 422 | Tax exemption certificate is invalid or expired |
| `CHECKOUT_GUEST_DISABLED` | `CheckoutError` | 403 | Guest checkout is not enabled for this venture |
| `CHECKOUT_EXPRESS_DISABLED` | `CheckoutError` | 403 | Express checkout is not enabled for this venture |
| `CHECKOUT_EXPRESS_NO_SAVED_DATA` | `CheckoutError` | 422 | Express checkout requires saved address and payment method |

### Error Response Format

```typescript
/**
 * All checkout errors follow this standardized format.
 */
interface CheckoutErrorResponse {
  /** Error code from the table above */
  code: string;

  /** Human-readable error message */
  message: string;

  /** HTTP status code */
  statusCode: number;

  /** The checkout step where the error occurred */
  step: CheckoutStepName | null;

  /** Additional error details */
  details: Record<string, unknown>;

  /** Whether the operation can be retried */
  retryable: boolean;

  /** Suggested user action */
  userAction: string | null;

  /** Correlation ID for support/debugging */
  correlationId: string;

  /** Timestamp */
  timestamp: string;
}

// Example error response:
// {
//   "code": "CHECKOUT_PAYMENT_DECLINED",
//   "message": "Your payment was declined. Please try a different payment method.",
//   "statusCode": 402,
//   "step": "payment",
//   "details": {
//     "declineCode": "insufficient_funds",
//     "provider": "stripe"
//   },
//   "retryable": true,
//   "userAction": "Try a different payment method or contact your bank.",
//   "correlationId": "ckout_err_01HN3XKQVZ...",
//   "timestamp": "2025-01-15T10:30:00.000Z"
// }
```

---

## Security

### PCI DSS Compliance

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PCI COMPLIANCE MODEL                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   SAQ-A (Self-Assessment Questionnaire A)                              │
│                                                                         │
│   MCV.ONE never receives, processes, stores, or transmits              │
│   raw cardholder data. All card handling is delegated to               │
│   PCI-compliant payment providers (Stripe, PayPal).                    │
│                                                                         │
│   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐     │
│   │   Browser    │──────▶ │   Stripe.js  │──────▶ │   Stripe     │     │
│   │              │  card  │   Elements   │ token  │   API        │     │
│   │              │  data  │              │        │              │     │
│   └──────────────┘        └──────────────┘        └──────┬───────┘     │
│                                                          │              │
│                                                   token  │              │
│                                                          ▼              │
│                                                   ┌──────────────┐     │
│                                                   │   MCV.ONE    │     │
│                                                   │   Server     │     │
│                                                   │              │     │
│                                                   │  ✅ Tokens   │     │
│                                                   │  ✅ Last 4   │     │
│                                                   │  ✅ Brand    │     │
│                                                   │  ❌ PAN      │     │
│                                                   │  ❌ CVV      │     │
│                                                   │  ❌ Full exp │     │
│                                                   └──────────────┘     │
│                                                                         │
│   What MCV stores:                     What MCV NEVER stores:          │
│   • Payment method tokens (pm_xxx)     • Full card numbers (PAN)       │
│   • Card last 4 digits                 • CVV / CVC / CVV2             │
│   • Card brand (visa, mc, etc.)        • Full expiration dates         │
│   • Payment intent IDs (pi_xxx)        • Magnetic stripe data          │
│   • 3DS authentication results         • PIN / PIN block               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Payment Tokenization

- **Card data never touches MCV servers.** Stripe.js / PayPal SDK handles all card collection client-side.
- Payment method tokens (`pm_xxx`) are the only card references stored. These tokens cannot be used outside the merchant's Stripe account.
- Client secrets for Payment Intents are short-lived and scoped to a single payment attempt.
- All stored payment tokens are encrypted at rest using AES-256-GCM with per-venture encryption keys managed through the platform key management service.
- Token references are logged in checkout events but never include card numbers or CVVs, even in debug logs.

### Fraud Prevention

```typescript
/**
 * Fraud prevention is layered across multiple checkpoints:
 *
 * Layer 1: Velocity Checks (Pre-Payment)
 * - Max N checkouts per IP per hour
 * - Max N checkouts per email per hour
 * - Max N failed payment attempts per card fingerprint per hour
 *
 * Layer 2: Risk Scoring (Pre-Payment)
 * - Address mismatch scoring (billing vs shipping)
 * - Geo-IP anomaly detection
 * - Device fingerprint analysis
 * - Email risk assessment (disposable, age)
 *
 * Layer 3: Provider-Side (During Payment)
 * - Stripe Radar rules and machine learning
 * - AVS (Address Verification System) checks
 * - CVC verification
 * - 3D Secure step-up authentication
 *
 * Layer 4: Post-Payment Review
 * - Sift Science order review queue
 * - Manual review for flagged orders
 * - Chargeback feedback loop
 */
const defaultFraudThresholds: FraudThresholds = {
  /** Score >= this → automatic block */
  blockThreshold: 85,

  /** Score >= this → trigger 3DS challenge */
  challengeThreshold: 60,

  /** Score >= this → queue for manual review */
  reviewThreshold: 40,

  /** Maximum checkouts per IP per hour */
  maxCheckoutsPerIpPerHour: 10,

  /** Maximum checkouts per email per hour */
  maxCheckoutsPerEmailPerHour: 5,

  /** Maximum failed payments per card per hour */
  maxFailedPaymentsPerCardPerHour: 3,

  /** Maximum order value for automatic approval (cents) */
  autoApproveMaxAmount: 500_00, // $500

  /** Minimum order value to trigger additional scrutiny (cents) */
  highValueThreshold: 200_00, // $200
};
```

### Session Security

- **Session TTL:** Checkout sessions expire after a configurable TTL (default: 30 minutes). Expired sessions cannot be resumed — only recovered through the recovery flow.
- **CSRF Protection:** All checkout mutations require a valid CSRF token bound to the user's session.
- **Rate Limiting:** Checkout endpoints are rate-limited per IP and per user to prevent abuse. Create session: 10/hour/IP. Step transitions: 60/hour/session.
- **Session Binding:** Each checkout session is bound to the originating IP and user agent. Significant changes (different IP subnet, different browser) trigger a re-authentication challenge.
- **Idempotency:** All payment and order creation operations use idempotency keys to prevent double-charges and double-orders in case of network retries or client-side race conditions.
- **Input Sanitization:** All user-provided strings (addresses, custom fields, metadata) are sanitized against XSS, SQL injection, and other injection attacks before storage.
- **Audit Trail:** Every state transition, payment event, and administrative action is recorded in the append-only `checkout_events` table for compliance and forensic analysis.

### Multi-Tenant Isolation

```typescript
/**
 * Checkout data isolation is enforced at the database level through
 * PostgreSQL Row-Level Security (RLS) policies.
 *
 * Every checkout table includes a `venture_id` column, and every query
 * is filtered by the current venture context set in the session:
 *
 *   SET app.current_venture_id = 'venture_xyz';
 *
 * RLS policies ensure:
 * 1. A venture can NEVER read another venture's checkout data
 * 2. A venture can NEVER write to another venture's checkout rows
 * 3. Users within a venture can only access their own sessions (unless admin)
 * 4. Guest sessions are accessible via recovery token only
 *
 * This is enforced at the PostgreSQL level, not the application level,
 * making it impossible to bypass through application bugs.
 */
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CHECKOUT_SESSION_TTL_MINUTES` | No | `30` | Default session TTL in minutes |
| `CHECKOUT_MAX_ITEMS` | No | `100` | Maximum items per checkout session |
| `STRIPE_SECRET_KEY` | Yes* | — | Stripe API secret key (per-venture via vault) |
| `STRIPE_WEBHOOK_SECRET` | Yes* | — | Stripe webhook signing secret |
| `STRIPE_API_VERSION` | No | `2024-12-18.acacia` | Stripe API version to use |
| `PAYPAL_CLIENT_ID` | Yes* | — | PayPal OAuth client ID |
| `PAYPAL_CLIENT_SECRET` | Yes* | — | PayPal OAuth client secret |
| `PAYPAL_ENVIRONMENT` | No | `sandbox` | PayPal environment (`sandbox` or `production`) |
| `SMARTY_STREETS_AUTH_ID` | Yes* | — | SmartyStreets authentication ID |
| `SMARTY_STREETS_AUTH_TOKEN` | Yes* | — | SmartyStreets authentication token |
| `GOOGLE_MAPS_API_KEY` | Yes* | — | Google Maps API key (for address validation) |
| `AVALARA_ACCOUNT_ID` | Yes* | — | Avalara AvaTax account ID |
| `AVALARA_LICENSE_KEY` | Yes* | — | Avalara license key |
| `AVALARA_ENVIRONMENT` | No | `sandbox` | Avalara environment (`sandbox` or `production`) |
| `TAXJAR_API_TOKEN` | Yes* | — | TaxJar API token |
| `UPS_CLIENT_ID` | Yes* | — | UPS OAuth client ID |
| `UPS_CLIENT_SECRET` | Yes* | — | UPS OAuth client secret |
| `UPS_ACCOUNT_NUMBER` | Yes* | — | UPS shipper account number |
| `FEDEX_API_KEY` | Yes* | — | FedEx API key |
| `FEDEX_SECRET_KEY` | Yes* | — | FedEx secret key |
| `FEDEX_ACCOUNT_NUMBER` | Yes* | — | FedEx account number |
| `USPS_USER_ID` | Yes* | — | USPS Web Tools user ID |
| `DHL_API_KEY` | Yes* | — | DHL Express API key |
| `DHL_API_SECRET` | Yes* | — | DHL Express API secret |
| `DHL_ACCOUNT_NUMBER` | Yes* | — | DHL account number |
| `SIFT_API_KEY` | Yes* | — | Sift Science API key |
| `SIFT_ACCOUNT_ID` | Yes* | — | Sift Science account ID |
| `REDPANDA_BROKERS` | Yes | — | Redpanda broker addresses (comma-separated) |
| `REDPANDA_CHECKOUT_TOPIC` | No | `checkout-events` | Redpanda topic for checkout events |
| `CHECKOUT_RECOVERY_TOKEN_SECRET` | Yes | — | Secret for signing recovery JWT tokens |
| `CHECKOUT_RECOVERY_TOKEN_TTL_HOURS` | No | `72` | Recovery token expiration in hours |
| `CHECKOUT_FRAUD_PROVIDER` | No | `internal` | Default fraud provider (`radar`, `sift`, `internal`) |
| `CHECKOUT_ADDRESS_VALIDATION_PROVIDER` | No | `none` | Default address validation provider |
| `DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string |

> **\* Yes (conditional):** Required only when the corresponding provider is enabled for the venture. Provider credentials are typically stored in the venture vault, not in environment variables, for multi-tenant deployments.

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/core` | `workspace:*` | Base utilities, error classes, ULID generation |
| `@mcv/db` | `workspace:*` | Drizzle ORM configuration, database client |
| `@mcv/auth` | `workspace:*` | User authentication, session management |
| `@mcv/commerce/cart` | `workspace:*` | Cart data for checkout session creation |
| `@mcv/commerce/catalog` | `workspace:*` | Product data, pricing, tax codes |
| `@mcv/commerce/inventory` | `workspace:*` | Stock verification, inventory reservation |
| `@mcv/commerce/orders` | `workspace:*` | Order record creation |
| `@mcv/commerce/pricing` | `workspace:*` | Price calculation, discount application |
| `@mcv/notify` | `workspace:*` | Email sending (confirmation, recovery) |
| `@mcv/events` | `workspace:*` | Redpanda event publishing |
| `@mcv/vault` | `workspace:*` | Secure credential storage for provider keys |
| `@mcv/telemetry` | `workspace:*` | Observability, tracing, metrics |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `stripe` | `^17.0.0` | Stripe Payment Intents, Payment Methods, Webhooks |
| `@paypal/checkout-server-sdk` | `^1.0.3` | PayPal Orders API |
| `drizzle-orm` | `^0.36.0` | Database ORM and query builder |
| `@trpc/server` | `^11.0.0` | tRPC router definitions |
| `zod` | `^3.23.0` | Input validation schemas |
| `jsonwebtoken` | `^9.0.0` | Recovery token signing/verification |
| `ioredis` | `^5.4.0` | Rate limiting counters, session caching |
| `kafkajs` | `^2.2.0` | Redpanda event producer (Kafka protocol) |
| `ulid` | `^2.3.0` | Sortable unique ID generation |
| `libphonenumber-js` | `^1.11.0` | Phone number parsing and E.164 formatting |
| `isomorphic-dompurify` | `^2.16.0` | HTML/XSS sanitization for custom fields |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.45.0` | Supabase client (provided by host application) |
| `next` | `^15.0.0` | Next.js framework (for API routes and webhooks) |

---

## Testing

### Test Structure

```
tests/
├── unit/
│   ├── state-machine.test.ts          # Checkout state transitions
│   ├── address-validator.test.ts      # Address validation logic
│   ├── shipping-rate.test.ts          # Rate aggregation and sorting
│   ├── payment-processor.test.ts      # Payment intent lifecycle
│   ├── fraud-checker.test.ts          # Fraud scoring and decisions
│   ├── order-creator.test.ts          # Atomic order creation
│   ├── recovery-service.test.ts       # Abandoned checkout detection
│   ├── custom-field-registry.test.ts  # Custom field validation
│   ├── tax-finalization.test.ts       # Tax calculation and exemptions
│   └── guest-checkout.test.ts         # Guest flow edge cases
├── integration/
│   ├── checkout-flow.test.ts          # Full checkout happy path
│   ├── payment-webhook.test.ts        # Stripe/PayPal webhook handling
│   ├── multi-tenant-isolation.test.ts # RLS policy verification
│   ├── express-checkout.test.ts       # One-click checkout flow
│   ├── recovery-email.test.ts         # Recovery email pipeline
│   └── event-publishing.test.ts       # Redpanda event emission
├── e2e/
│   ├── checkout-stripe.test.ts        # Full Stripe checkout (test mode)
│   ├── checkout-paypal.test.ts        # Full PayPal checkout (sandbox)
│   ├── checkout-guest.test.ts         # Guest checkout end-to-end
│   └── checkout-recovery.test.ts      # Abandonment → recovery → order
└── fixtures/
    ├── sessions.ts                    # Mock checkout sessions
    ├── addresses.ts                   # Test addresses (US, CA, UK, etc.)
    ├── payments.ts                    # Mock payment intents and webhooks
    ├── shipping-rates.ts             # Mock carrier rate responses
    └── fraud-signals.ts              # Mock fraud assessment results
```

### Unit Test Example: State Machine

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CheckoutStateMachine } from '../services/state-machine.service';
import { mockCheckoutSession } from '../fixtures/sessions';

describe('CheckoutStateMachine', () => {
  let stateMachine: CheckoutStateMachine;

  beforeEach(() => {
    stateMachine = new CheckoutStateMachine();
  });

  describe('forward transitions', () => {
    it('should transition from address to shipping when address is valid', async () => {
      const session = mockCheckoutSession({
        currentStep: 'address',
        billingAddress: { /* valid address */ },
        shippingAddress: { /* valid address */ },
      });

      const result = await stateMachine.transition(session, 'shipping');

      expect(result.currentStep).toBe('shipping');
      expect(result.status).toBe('active');
    });

    it('should reject transition from address to shipping without address', async () => {
      const session = mockCheckoutSession({
        currentStep: 'address',
        billingAddress: null,
        shippingAddress: null,
      });

      await expect(
        stateMachine.transition(session, 'shipping'),
      ).rejects.toThrow('CHECKOUT_STEP_PREREQUISITE');
    });

    it('should reject skipping steps (address → payment)', async () => {
      const session = mockCheckoutSession({
        currentStep: 'address',
        billingAddress: { /* valid */ },
        shippingAddress: { /* valid */ },
      });

      await expect(
        stateMachine.transition(session, 'payment'),
      ).rejects.toThrow('CHECKOUT_STEP_INVALID');
    });

    it('should allow express checkout to skip to review', async () => {
      const session = mockCheckoutSession({
        currentStep: 'address',
        isExpress: true,
        billingAddress: { /* saved */ },
        shippingAddress: { /* saved */ },
        selectedShippingMethod: { /* auto-selected */ },
        paymentMethodToken: 'pm_saved_xxx',
      });

      const result = await stateMachine.transition(session, 'review');

      expect(result.currentStep).toBe('review');
    });
  });

  describe('back transitions', () => {
    it('should allow going back from review to payment', async () => {
      const session = mockCheckoutSession({ currentStep: 'review' });

      const result = await stateMachine.transition(session, 'payment');

      expect(result.currentStep).toBe('payment');
    });

    it('should preserve data when going back', async () => {
      const session = mockCheckoutSession({
        currentStep: 'review',
        billingAddress: { firstName: 'Jane' },
        selectedShippingMethod: { serviceName: 'Ground' },
      });

      const result = await stateMachine.transition(session, 'address');

      expect(result.billingAddress?.firstName).toBe('Jane');
      expect(result.selectedShippingMethod?.serviceName).toBe('Ground');
    });
  });

  describe('terminal states', () => {
    it('should not allow transitions from completed state', async () => {
      const session = mockCheckoutSession({ status: 'completed' });

      await expect(
        stateMachine.transition(session, 'address'),
      ).rejects.toThrow('Cannot transition from completed checkout');
    });

    it('should not allow transitions from expired state', async () => {
      const session = mockCheckoutSession({ status: 'expired' });

      await expect(
        stateMachine.transition(session, 'address'),
      ).rejects.toThrow('CHECKOUT_SESSION_EXPIRED');
    });
  });
});
```

### Integration Test Example: Full Checkout Flow

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase, cleanupTestDatabase } from '@mcv/db/testing';
import { CheckoutService } from '../services/checkout.service';
import { AddressService } from '../services/address.service';
import { PaymentProcessor } from '../services/payment-processor.service';
import { OrderCreator } from '../services/order-creator.service';

describe('Full Checkout Flow (Integration)', () => {
  let db: TestDatabase;
  let checkoutService: CheckoutService;

  beforeAll(async () => {
    db = await createTestDatabase();
    checkoutService = new CheckoutService(db);
  });

  afterAll(async () => {
    await cleanupTestDatabase(db);
  });

  it('should complete a full checkout from cart to order', async () => {
    const ventureId = 'test_venture';
    const userId = 'test_user';

    // 1. Create checkout session
    const session = await checkoutService.createSession({
      ventureId,
      userId,
      cartId: 'test_cart',
      lineItems: [
        {
          productId: 'prod_1',
          variantId: 'var_1',
          sku: 'SKU-001',
          name: 'Test Product',
          quantity: 2,
          unitPrice: 2999,
          totalPrice: 5998,
        },
      ],
      subtotalAmount: 5998,
      totalAmount: 5998,
      currency: 'usd',
    });

    expect(session.currentStep).toBe('address');
    expect(session.status).toBe('active');

    // 2. Set address
    const addressService = new AddressService(db);
    await addressService.setAddress(session.id, ventureId, {
      type: 'shipping',
      firstName: 'Jane',
      lastName: 'Doe',
      addressLine1: '123 Test St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      countryCode: 'US',
      validated: true,
    });

    const afterAddress = await checkoutService.advanceStep(session.id, ventureId, 'shipping');
    expect(afterAddress.currentStep).toBe('shipping');

    // 3. Select shipping (mocked carrier response)
    const afterShipping = await checkoutService.setShippingMethod(
      session.id,
      ventureId,
      { carrier: 'usps', serviceLevel: 'priority', amount: 799 },
    );
    expect(afterShipping.shippingAmount).toBe(799);

    const afterShippingStep = await checkoutService.advanceStep(session.id, ventureId, 'payment');
    expect(afterShippingStep.currentStep).toBe('payment');

    // 4. Process payment (Stripe test mode)
    const paymentProcessor = new PaymentProcessor('stripe');
    const intent = await paymentProcessor.createIntent(afterShippingStep, 'pm_card_visa');
    expect(intent.status).toBe('requires_capture');

    const afterPayment = await checkoutService.advanceStep(session.id, ventureId, 'review');
    expect(afterPayment.currentStep).toBe('review');

    // 5. Confirm and create order
    const afterReview = await checkoutService.advanceStep(session.id, ventureId, 'confirm');
    const orderCreator = new OrderCreator(db);
    const order = await orderCreator.createOrder(afterReview);

    expect(order.success).toBe(true);
    expect(order.orderId).toBeDefined();
    expect(order.paymentCaptured).toBe(true);
    expect(order.inventoryReserved).toBe(true);

    // 6. Verify final session state
    const finalSession = await checkoutService.getSession(session.id, ventureId);
    expect(finalSession.status).toBe('completed');
    expect(finalSession.completedOrderId).toBe(order.orderId);
  });

  it('should enforce multi-tenant isolation', async () => {
    // Create session in venture A
    const sessionA = await checkoutService.createSession({
      ventureId: 'venture_a',
      userId: 'user_1',
      cartId: 'cart_1',
      lineItems: [{ productId: 'p1', quantity: 1, unitPrice: 1000, totalPrice: 1000 }],
      subtotalAmount: 1000,
      totalAmount: 1000,
      currency: 'usd',
    });

    // Attempt to access from venture B — should fail
    await expect(
      checkoutService.getSession(sessionA.id, 'venture_b'),
    ).rejects.toThrow('CHECKOUT_SESSION_NOT_FOUND');

    // Access from venture A — should succeed
    const retrieved = await checkoutService.getSession(sessionA.id, 'venture_a');
    expect(retrieved.id).toBe(sessionA.id);
  });
});
```

### Test Coverage Requirements

| Area | Minimum Coverage | Notes |
|------|-----------------|-------|
| State machine transitions | 95% | All valid/invalid transitions, edge cases |
| Payment processing | 90% | Intent lifecycle, webhook handling, error paths |
| Address validation | 85% | US/CA/international formats, suggestions |
| Fraud detection | 90% | All signal types, threshold decisions |
| Order creation | 95% | Atomic rollback, idempotency, race conditions |
| Recovery flow | 85% | Token lifecycle, email sequencing, restoration |
| Custom fields | 80% | All field types, validation rules |
| Multi-tenant RLS | 100% | Isolation must be verified for every table |
| Guest checkout | 85% | Email validation, token management, account offer |
| Express checkout | 85% | Eligibility, saved data usage, fallback |

### Running Tests

```bash
# Run all checkout tests
pnpm test --filter @mcv/commerce/checkout

# Run unit tests only
pnpm test --filter @mcv/commerce/checkout -- --dir tests/unit

# Run integration tests (requires test database)
pnpm test --filter @mcv/commerce/checkout -- --dir tests/integration

# Run e2e tests (requires Stripe test keys + PayPal sandbox)
STRIPE_SECRET_KEY=sk_test_xxx pnpm test --filter @mcv/commerce/checkout -- --dir tests/e2e

# Run with coverage
pnpm test --filter @mcv/commerce/checkout -- --coverage

# Run specific test file
pnpm test --filter @mcv/commerce/checkout -- tests/unit/state-machine.test.ts
```

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## Related Modules

- [`@mcv/commerce/cart`](../cart/MODULE.md) — Shopping cart management (upstream)
- [`@mcv/commerce/orders`](../orders/MODULE.md) — Order management (downstream)
- [`@mcv/commerce/inventory`](../inventory/MODULE.md) — Stock management
- [`@mcv/commerce/catalog`](../catalog/MODULE.md) — Product catalog
- [`@mcv/commerce/pricing`](../pricing/MODULE.md) — Price calculation and discounts
- [`@mcv/notify`](../../notify/MODULE.md) — Email notifications
- [`@mcv/auth`](../../auth/MODULE.md) — Authentication and user sessions