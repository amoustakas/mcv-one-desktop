# @mcv/commerce/payments

> **Tier 5 Domain Module** · Commerce · Payments
> **Classification:** PUBLISHABLE
> **Version:** 1.0.0
> **Status:** Production
> **Owner:** Commerce Platform Team
> **RLS:** Multi-tenant isolated
> **PCI DSS:** Level 1 Compliant

---

## Purpose

The `@mcv/commerce/payments` module is the financial transaction backbone of the MCV.ONE platform. It provides a unified, provider-agnostic payment processing layer that abstracts the complexity of multiple payment service providers — Stripe, PayPal, Square, Adyen, and Braintree — behind a single, consistent API surface. Every venture on the platform, regardless of its business model, processes payments through this module, ensuring consistent security posture, audit trails, and reconciliation across the entire ecosystem. The module handles the full payment lifecycle from intent creation through settlement, including captures, cancellations, refunds, disputes, and payouts, while maintaining PCI DSS Level 1 compliance at every stage.

Payment processing in a multi-venture, multi-currency platform presents extraordinary complexity. Each venture may have different provider preferences, settlement currencies, fee structures, and compliance requirements. A venture operating in the EU needs SEPA support and Strong Customer Authentication (SCA) via 3D Secure 2.0; a venture in the US needs ACH direct debit and ZIP code verification; a Web3 venture needs EDGE token payments on Solana. This module encapsulates all of that complexity behind the `PaymentService` interface, allowing venture developers to process payments with a single `createIntent()` call while the module handles provider selection, currency conversion, fraud scoring, retry logic, and regulatory compliance transparently. The provider abstraction layer uses a strategy pattern with runtime provider resolution, so adding a new payment provider requires only implementing the `PaymentProvider` interface — no changes to consuming code.

The module also maintains a complete double-entry payment ledger that tracks every financial movement across the platform. Every payment, refund, fee, payout, and settlement is recorded as a pair of balanced ledger entries, enabling real-time balance tracking per provider, per venture, and per currency. The ledger integrates with the platform's reconciliation engine to automatically match provider settlement reports against internal records, flagging discrepancies for review. This financial infrastructure supports the commerce module's marketplace capabilities — split payments, vendor payouts, platform fees, affiliate commissions — while providing the audit trail required for financial compliance. Webhook processing from all providers is centralized through a single ingestion pipeline with signature verification, event deduplication, and dead-letter queue (DLQ) handling, ensuring no financial event is ever lost or processed twice.

---

## Exports

```typescript
// @mcv/commerce/payments — Public API

// ─── Core Services ───────────────────────────────────────────────
export { PaymentService }              from './services/payment.service';
export { PaymentIntentService }        from './services/payment-intent.service';
export { PaymentMethodService }        from './services/payment-method.service';
export { RefundService }               from './services/refund.service';
export { DisputeService }              from './services/dispute.service';
export { PayoutService }               from './services/payout.service';
export { PaymentLedgerService }        from './services/payment-ledger.service';
export { WebhookProcessor }            from './services/webhook-processor.service';
export { FraudDetectionService }       from './services/fraud-detection.service';
export { ReconciliationService }       from './services/reconciliation.service';
export { DunningService }              from './services/dunning.service';
export { PaymentAnalyticsService }     from './services/payment-analytics.service';

// ─── Provider Implementations ────────────────────────────────────
export { StripeProvider }              from './providers/stripe.provider';
export { PayPalProvider }              from './providers/paypal.provider';
export { SquareProvider }              from './providers/square.provider';
export { AdyenProvider }               from './providers/adyen.provider';
export { BraintreeProvider }           from './providers/braintree.provider';
export { SolanaProvider }              from './providers/solana.provider';
export { ProviderRegistry }            from './providers/provider-registry';
export { ProviderRouter }              from './providers/provider-router';

// ─── Core Interfaces ─────────────────────────────────────────────
export type { IPaymentService }        from './interfaces/payment-service.interface';
export type { IPaymentProvider }       from './interfaces/payment-provider.interface';
export type { IPaymentIntent }         from './interfaces/payment-intent.interface';
export type { IPaymentMethod }         from './interfaces/payment-method.interface';
export type { IRefundService }         from './interfaces/refund-service.interface';
export type { IDisputeService }        from './interfaces/dispute-service.interface';
export type { IPayoutService }         from './interfaces/payout-service.interface';
export type { IPaymentLedger }         from './interfaces/payment-ledger.interface';
export type { IWebhookProcessor }      from './interfaces/webhook-processor.interface';
export type { IFraudDetector }         from './interfaces/fraud-detector.interface';

// ─── Types & Enums ───────────────────────────────────────────────
export type {
  PaymentIntentCreateInput,
  PaymentIntentConfirmInput,
  PaymentIntentCaptureInput,
  PaymentIntentCancelInput,
  PaymentIntentResult,
  PaymentIntentStatus,
} from './types/payment-intent.types';

export type {
  PaymentMethodCreateInput,
  PaymentMethodType,
  PaymentMethodStatus,
  CardDetails,
  BankAccountDetails,
  DigitalWalletDetails,
  CryptoWalletDetails,
  BnplDetails,
} from './types/payment-method.types';

export type {
  RefundCreateInput,
  RefundReason,
  RefundStatus,
  RefundResult,
} from './types/refund.types';

export type {
  DisputeResponse,
  DisputeEvidence,
  DisputeReason,
  DisputeStatus,
  DisputeOutcome,
} from './types/dispute.types';

export type {
  PayoutCreateInput,
  PayoutBatchInput,
  PayoutStatus,
  PayoutMethod,
  PayoutSchedule,
  PayoutResult,
} from './types/payout.types';

export type {
  LedgerEntry,
  LedgerAccount,
  LedgerBalance,
  ReconciliationReport,
} from './types/ledger.types';

export type {
  WebhookEvent,
  WebhookEventType,
  WebhookProvider,
} from './types/webhook.types';

export type {
  FraudScore,
  FraudSignal,
  FraudDecision,
  VelocityLimit,
} from './types/fraud.types';

export type {
  CurrencyCode,
  CurrencyAmount,
  ExchangeRate,
  FxQuote,
} from './types/currency.types';

export type {
  PaymentFee,
  FeeType,
  PlatformFeeConfig,
} from './types/fee.types';

// ─── Database Schema ─────────────────────────────────────────────
export {
  paymentIntentsTable,
  paymentMethodsTable,
  paymentTransactionsTable,
  refundsTable,
  disputesTable,
  disputeEvidenceTable,
  payoutsTable,
  payoutItemsTable,
  paymentLedgerTable,
  providerConfigsTable,
  webhookEventsTable,
  paymentFeesTable,
} from './schema';

// ─── tRPC Router ─────────────────────────────────────────────────
export { paymentsRouter }              from './router';
export type { PaymentsRouter }         from './router';

// ─── Constants ───────────────────────────────────────────────────
export {
  PAYMENT_ERROR_CODES,
  SUPPORTED_CURRENCIES,
  PROVIDER_CAPABILITIES,
  DEFAULT_RETRY_SCHEDULE,
  VELOCITY_LIMITS,
} from './constants';

// ─── Utilities ───────────────────────────────────────────────────
export { formatCurrency }              from './utils/format-currency';
export { convertCurrency }             from './utils/convert-currency';
export { calculateFees }               from './utils/calculate-fees';
export { generateIdempotencyKey }      from './utils/idempotency';
export { maskPaymentMethod }           from './utils/mask-payment-method';
export { validatePaymentInput }        from './utils/validate-payment';
export { parseProviderWebhook }        from './utils/parse-webhook';
```

---

## Architecture

### Payment Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATION                              │
│                                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  ┌──────────────────┐   │
│  │ Checkout  │  │ Payment Form │  │ Apple Pay  │  │ Crypto Connect   │   │
│  │   Page    │  │  (Stripe.js) │  │  Button   │  │ (Phantom/EDGE)   │   │
│  └─────┬────┘  └──────┬───────┘  └─────┬─────┘  └────────┬─────────┘   │
│        │               │                │                  │             │
└────────┼───────────────┼────────────────┼──────────────────┼─────────────┘
         │               │                │                  │
         ▼               ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          tRPC API LAYER                                 │
│                                                                         │
│  payments.createIntent  │  payments.confirm  │  payments.capture        │
│  payments.cancel        │  payments.refund   │  payments.listMethods    │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                     INPUT VALIDATION                              │  │
│  │  • Zod schema validation        • Idempotency key check          │  │
│  │  • Currency/amount validation    • Permission verification        │  │
│  │  • Venture-scoped RLS            • Rate limiting                  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PAYMENT SERVICE LAYER                             │
│                                                                         │
│  ┌─────────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  PaymentIntent      │  │  Fraud Detection  │  │  Fee Calculator  │   │
│  │  Service            │  │  Service          │  │  Service         │   │
│  │                     │  │                   │  │                  │   │
│  │  • Create intent    │  │  • Risk scoring   │  │  • Provider fees │   │
│  │  • Confirm payment  │  │  • Velocity check │  │  • Platform fees │   │
│  │  • Capture funds    │  │  • Device finger  │  │  • FX markup     │   │
│  │  • Cancel/void      │  │  • 3DS trigger    │  │  • Split calc    │   │
│  └─────────┬───────────┘  └────────┬─────────┘  └────────┬─────────┘   │
│            │                       │                      │             │
│            ▼                       ▼                      ▼             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    PROVIDER ROUTER                                │   │
│  │                                                                   │   │
│  │  Routes to optimal provider based on:                             │   │
│  │  • Venture provider configuration                                 │   │
│  │  • Payment method type                                            │   │
│  │  • Currency / settlement requirements                             │   │
│  │  • Provider health / availability                                 │   │
│  │  • Cost optimization rules                                        │   │
│  │  • Geographic regulations                                         │   │
│  └───────────────────────┬──────────────────────────────────────────┘   │
│                          │                                              │
└──────────────────────────┼──────────────────────────────────────────────┘
                           │
         ┌─────────────────┼──────────────────────┐
         │                 │                       │
         ▼                 ▼                       ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────────┐
│   STRIPE     │  │   PAYPAL     │  │   SQUARE  │  ADYEN  │ BRAINTREE │
│   Provider   │  │   Provider   │  │   Provider│ Provider│ Provider  │
│              │  │              │  │           │         │           │
│ • Cards      │  │ • PayPal     │  │ • Cards   │ • Cards │ • Cards   │
│ • Apple Pay  │  │ • Venmo      │  │ • Cash App│ • iDEAL │ • PayPal  │
│ • Google Pay │  │ • BNPL       │  │ • Gift    │ • SEPA  │ • Venmo   │
│ • ACH        │  │ • Credit     │  │   Cards   │ • Alipay│ • BNPL    │
│ • SEPA       │  │              │  │           │ • Boleto│           │
│ • Klarna     │  │              │  │           │         │           │
└──────┬───────┘  └──────┬───────┘  └─────┬─────┴────┬────┴─────┬─────┘
       │                 │                 │          │          │
       ▼                 ▼                 ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL PAYMENT NETWORKS                            │
│  Visa │ Mastercard │ Amex │ Discover │ ACH │ SEPA │ SWIFT │ Solana    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Provider Abstraction Layer

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PROVIDER ABSTRACTION LAYER                          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    IPaymentProvider Interface                    │    │
│  │                                                                 │    │
│  │  createPayment(input)        → ProviderPaymentResult            │    │
│  │  confirmPayment(id, data)    → ProviderPaymentResult            │    │
│  │  capturePayment(id, amount)  → ProviderPaymentResult            │    │
│  │  cancelPayment(id, reason)   → ProviderCancelResult             │    │
│  │  refundPayment(id, input)    → ProviderRefundResult             │    │
│  │  getPayment(id)              → ProviderPaymentResult            │    │
│  │  createCustomer(input)       → ProviderCustomerResult           │    │
│  │  attachMethod(input)         → ProviderMethodResult             │    │
│  │  detachMethod(id)            → void                             │    │
│  │  createPayout(input)         → ProviderPayoutResult             │    │
│  │  verifyWebhook(payload, sig) → WebhookVerificationResult        │    │
│  │  getBalance()                → ProviderBalance                  │    │
│  │  healthCheck()               → ProviderHealthStatus             │    │
│  └─────────────────────┬───────────────────────────────────────────┘    │
│                        │                                                │
│          ┌─────────────┼──────────────┬──────────────┐                  │
│          ▼             ▼              ▼              ▼                   │
│  ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐         │
│  │StripeProvider│ │PayPalProv│ │SquareProv│ │  SolanaProvider │         │
│  │  Stripe SDK  │ │PayPal SDK│ │Square SDK│ │ @solana/web3.js │         │
│  └──────────────┘ └──────────┘ └──────────┘ └────────────────┘         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Provider Router                              │    │
│  │                                                                 │    │
│  │  resolve(ventureId, method, currency) → IPaymentProvider        │    │
│  │                                                                 │    │
│  │  Resolution Order:                                              │    │
│  │  1. Venture-specific override (provider_configs table)          │    │
│  │  2. Payment method affinity (Apple Pay → Stripe)                │    │
│  │  3. Currency optimization (SEPA → Adyen for EUR)                │    │
│  │  4. Cost-based routing (lowest fee for card type)               │    │
│  │  5. Health-based fallback (skip degraded providers)             │    │
│  │  6. Default platform provider (Stripe)                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Webhook Ingestion Pipeline

```
Provider Webhook ──► POST /api/webhooks/{provider}
                            │
                            ▼
                   ┌──────────────────┐
                   │  Signature Check  │──── FAIL ──► 401 Unauthorized
                   └────────┬─────────┘
                            │ PASS
                            ▼
                   ┌──────────────────┐
                   │ Event Dedup Check │──── DUPLICATE ──► 200 OK (noop)
                   │ (webhook_events)  │
                   └────────┬─────────┘
                            │ NEW
                            ▼
                   ┌──────────────────┐
                   │  Store Raw Event  │
                   │  status: pending  │
                   └────────┬─────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │  Event Mapper    │
                   │  Provider → Norm │──► Normalized PaymentEvent
                   └────────┬─────────┘
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
    ┌───────────────┐ ┌──────────┐ ┌────────────┐
    │payment.updated│ │ refund.* │ │ dispute.*  │  ...
    └───────┬───────┘ └────┬─────┘ └─────┬──────┘
            │              │              │
            ▼              ▼              ▼
    ┌──────────────────────────────────────────┐
    │         Update Internal State            │
    │  • payment_intents   • refunds           │
    │  • payment_ledger    • disputes          │
    └──────────────┬───────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────────┐
    │    Mark webhook_event: processed         │
    └──────────────────────────────────────────┘

  On failure: retry 5x with exponential backoff → DLQ
```

### Double-Entry Ledger Model

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DOUBLE-ENTRY PAYMENT LEDGER                       │
│                                                                      │
│  Every financial event produces balanced debit + credit entries:      │
│                                                                      │
│  ┌──────────────────┬────────────────┬────────────────────────┐      │
│  │ Event            │ Debit Account  │ Credit Account         │      │
│  ├──────────────────┼────────────────┼────────────────────────┤      │
│  │ Payment received │ Provider:Stripe│ Revenue:{ventureId}    │      │
│  │ Platform fee     │ Revenue:{vId}  │ PlatformFees:{vId}     │      │
│  │ Provider fee     │ ProviderFees   │ Provider:Stripe        │      │
│  │ Refund issued    │ Revenue:{vId}  │ Provider:Stripe        │      │
│  │ Payout to vendor │ Payables:{vId} │ Provider:Stripe        │      │
│  │ Chargeback       │ Revenue:{vId}  │ Provider:Stripe        │      │
│  │ Chargeback rev.  │ Provider:Stripe│ Revenue:{vId}          │      │
│  │ FX conversion    │ FxSettlement   │ Provider:Stripe        │      │
│  └──────────────────┴────────────────┴────────────────────────┘      │
│                                                                      │
│  Invariant: SUM(debits) = SUM(credits) for every transaction_id      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### IPaymentService

```typescript
/**
 * Primary payment service interface.
 * Orchestrates the full payment lifecycle across all providers.
 */
interface IPaymentService {
  /** Create a new payment intent. Validates, scores for fraud, selects provider. */
  createIntent(input: PaymentIntentCreateInput): Promise<PaymentIntentResult>;

  /** Confirm a payment intent after client-side authentication (3DS, redirect). */
  confirmIntent(input: PaymentIntentConfirmInput): Promise<PaymentIntentResult>;

  /** Capture a previously authorized payment. Supports partial capture. */
  captureIntent(input: PaymentIntentCaptureInput): Promise<PaymentIntentResult>;

  /** Cancel/void a payment intent. Releases authorization hold. */
  cancelIntent(input: PaymentIntentCancelInput): Promise<PaymentIntentResult>;

  /** Retrieve a payment intent by ID with related transactions. */
  getIntent(intentId: string, ventureId: string): Promise<PaymentIntentResult>;

  /** List payment intents with filtering and pagination. */
  listIntents(input: PaymentIntentListInput): Promise<PaginatedResult<PaymentIntentResult>>;

  /** Process a refund against a captured payment. */
  refund(input: RefundCreateInput): Promise<RefundResult>;

  /** Get real-time FX quote for currency conversion. */
  getFxQuote(from: CurrencyCode, to: CurrencyCode, amount: number): Promise<FxQuote>;
}

interface PaymentIntentCreateInput {
  ventureId: string;
  customerId: string;
  amount: number;
  currency: CurrencyCode;
  paymentMethodId?: string;
  paymentMethodData?: PaymentMethodData;
  captureMethod: 'automatic' | 'manual';
  confirm?: boolean;
  offSession?: boolean;
  orderId?: string;
  subscriptionId?: string;
  description?: string;
  statementDescriptor?: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
}

interface PaymentIntentConfirmInput {
  paymentIntentId: string;
  ventureId: string;
  paymentMethodId?: string;
  returnUrl?: string;
}

interface PaymentIntentCaptureInput {
  paymentIntentId: string;
  ventureId: string;
  amount?: number;  // Partial capture if less than authorized
}

interface PaymentIntentCancelInput {
  paymentIntentId: string;
  ventureId: string;
  reason?: string;
}
```

### IPaymentProvider

```typescript
/**
 * Interface all payment providers must implement.
 * Abstraction layer between our service and external APIs.
 */
interface IPaymentProvider {
  readonly name: string;
  readonly apiVersion: string;
  readonly capabilities: ProviderCapabilities;

  // ─── Payment Operations ──────────────────────────────
  createPayment(input: ProviderCreatePaymentInput): Promise<ProviderPaymentResult>;
  confirmPayment(providerPaymentId: string, data: ProviderConfirmData): Promise<ProviderPaymentResult>;
  capturePayment(providerPaymentId: string, amount?: number): Promise<ProviderPaymentResult>;
  cancelPayment(providerPaymentId: string, reason?: string): Promise<ProviderCancelResult>;
  getPayment(providerPaymentId: string): Promise<ProviderPaymentResult>;

  // ─── Refund Operations ───────────────────────────────
  refundPayment(providerPaymentId: string, input: ProviderRefundInput): Promise<ProviderRefundResult>;
  getRefund(providerRefundId: string): Promise<ProviderRefundResult>;

  // ─── Customer & Payment Method ───────────────────────
  createCustomer(input: ProviderCustomerInput): Promise<ProviderCustomerResult>;
  attachPaymentMethod(input: ProviderAttachMethodInput): Promise<ProviderMethodResult>;
  detachPaymentMethod(providerMethodId: string): Promise<void>;
  listPaymentMethods(providerCustomerId: string, type?: PaymentMethodType): Promise<ProviderMethodResult[]>;

  // ─── Payout Operations ───────────────────────────────
  createPayout(input: ProviderPayoutInput): Promise<ProviderPayoutResult>;
  cancelPayout(providerPayoutId: string): Promise<ProviderPayoutResult>;

  // ─── Webhook Verification ────────────────────────────
  verifyWebhook(payload: string | Buffer, signature: string, secret: string): Promise<WebhookVerificationResult>;
  mapWebhookEvent(providerEvent: unknown): PaymentEvent;

  // ─── Health & Balance ────────────────────────────────
  healthCheck(): Promise<ProviderHealthStatus>;
  getBalance(): Promise<ProviderBalance>;
}

interface ProviderCapabilities {
  methods: PaymentMethodType[];
  currencies: CurrencyCode[];
  features: ProviderFeature[];
  regions: string[];
  maxPaymentAmount: Record<CurrencyCode, number>;
}

type ProviderFeature =
  | 'card_payments'
  | 'bank_transfers'
  | 'digital_wallets'
  | 'bnpl'
  | 'crypto'
  | '3ds2'
  | 'manual_capture'
  | 'partial_capture'
  | 'partial_refund'
  | 'recurring'
  | 'payouts'
  | 'multi_currency'
  | 'instant_payouts'
  | 'dispute_management';

interface ProviderHealthStatus {
  provider: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  lastChecked: Date;
  apiVersion: string;
  details?: Record<string, unknown>;
}
```

### IPaymentIntent

```typescript
/**
 * Represents a payment intent — the core payment object.
 * Tracks a payment from creation through completion.
 */
interface IPaymentIntent {
  id: string;
  ventureId: string;
  customerId: string;
  amount: number;                          // Smallest currency unit (cents)
  currency: CurrencyCode;
  status: PaymentIntentStatus;
  paymentMethodId: string | null;
  paymentMethodType: PaymentMethodType | null;
  provider: string | null;
  providerPaymentId: string | null;
  clientSecret: string | null;
  captureMethod: 'automatic' | 'manual';
  requires3ds: boolean;
  threeDsStatus: ThreeDsStatus | null;
  fraudScore: number | null;
  fraudDecision: FraudDecision | null;
  idempotencyKey: string;
  statementDescriptor: string | null;
  description: string | null;
  metadata: Record<string, string>;
  amountCaptured: number;
  amountRefunded: number;
  orderId: string | null;
  subscriptionId: string | null;
  settlementCurrency: CurrencyCode | null;
  exchangeRate: number | null;
  fees: PaymentFee[];
  refunds: RefundResult[];
  disputes: DisputeResponse[];
  lastError: PaymentError | null;
  customerIp: string | null;
  customerUserAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
  capturedAt: Date | null;
  cancelledAt: Date | null;
  failedAt: Date | null;
}

type PaymentIntentStatus =
  | 'created'
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'captured'
  | 'succeeded'
  | 'cancelled'
  | 'failed';

type ThreeDsStatus =
  | 'not_required'
  | 'required'
  | 'challenge_presented'
  | 'authenticated'
  | 'failed'
  | 'abandoned';
```

### IPaymentMethod

```typescript
/**
 * Stored payment method. Tokenized — no raw card numbers stored.
 */
interface IPaymentMethod {
  id: string;
  customerId: string;
  ventureId: string;
  type: PaymentMethodType;
  provider: string;
  providerMethodId: string;
  isDefault: boolean;
  card: CardDetails | null;
  bankAccount: BankAccountDetails | null;
  digitalWallet: DigitalWalletDetails | null;
  cryptoWallet: CryptoWalletDetails | null;
  bnpl: BnplDetails | null;
  billingAddress: BillingAddress | null;
  status: PaymentMethodStatus;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

type PaymentMethodType = 'card' | 'bank_transfer' | 'digital_wallet' | 'crypto' | 'bnpl';
type PaymentMethodStatus = 'active' | 'expired' | 'revoked' | 'failed_verification';

interface CardDetails {
  brand: string;                          // visa, mastercard, amex
  last4: string;
  expMonth: number;
  expYear: number;
  funding: 'credit' | 'debit' | 'prepaid' | 'unknown';
  country: string | null;
  cvcCheck: 'pass' | 'fail' | 'unavailable' | 'unchecked';
  addressLine1Check: 'pass' | 'fail' | 'unavailable' | 'unchecked';
  postalCodeCheck: 'pass' | 'fail' | 'unavailable' | 'unchecked';
  threeDsSupported: boolean;
  fingerprint: string;
}

interface BankAccountDetails {
  bankName: string;
  accountType: 'checking' | 'savings';
  last4: string;
  routingNumber: string;
  transferMethod: 'ach' | 'sepa' | 'bacs' | 'wire';
  country: string;
  currency: CurrencyCode;
  iban: string | null;
  bic: string | null;
  mandateId: string | null;
  verified: boolean;
}

interface DigitalWalletDetails {
  walletType: 'apple_pay' | 'google_pay' | 'samsung_pay' | 'click_to_pay';
  dynamicLast4: string;
  cardBrand: string;
  deviceManufacturer: string | null;
}

interface CryptoWalletDetails {
  network: 'solana' | 'ethereum';
  address: string;
  walletProvider: string;              // phantom, solflare, etc.
  token: 'EDGE' | 'SOL' | 'USDC' | 'USDT';
  tokenMint: string | null;
}

interface BnplDetails {
  provider: 'klarna' | 'afterpay' | 'affirm' | 'clearpay';
  planType: 'pay_in_4' | 'pay_in_3' | 'pay_later' | 'financing';
  installments: number;
  approvalStatus: 'approved' | 'pending' | 'declined';
}
```

### IRefundService

```typescript
interface IRefundService {
  create(input: RefundCreateInput): Promise<RefundResult>;
  get(refundId: string, ventureId: string): Promise<RefundResult>;
  listForPayment(intentId: string, ventureId: string): Promise<RefundResult[]>;
  list(input: RefundListInput): Promise<PaginatedResult<RefundResult>>;
  cancel(refundId: string, ventureId: string): Promise<RefundResult>;
  issueStoreCredit(input: StoreCreditInput): Promise<StoreCreditResult>;
}

interface RefundCreateInput {
  paymentIntentId: string;
  ventureId: string;
  amount: number | null;               // null = full refund
  reason: RefundReason;
  notes: string | null;
  notifyCustomer: boolean;
  idempotencyKey: string;
  metadata: Record<string, string>;
}

type RefundReason =
  | 'requested_by_customer'
  | 'duplicate'
  | 'fraudulent'
  | 'order_cancelled'
  | 'product_not_received'
  | 'product_defective'
  | 'product_not_as_described'
  | 'other';

type RefundStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';

interface RefundResult {
  id: string;
  paymentIntentId: string;
  ventureId: string;
  amount: number;
  currency: CurrencyCode;
  status: RefundStatus;
  reason: RefundReason;
  provider: string;
  providerRefundId: string;
  failureReason: string | null;
  metadata: Record<string, string>;
  createdAt: Date;
  completedAt: Date | null;
  estimatedArrival: Date | null;
}
```

### IDisputeService

```typescript
interface IDisputeService {
  get(disputeId: string, ventureId: string): Promise<DisputeResponse>;
  list(input: DisputeListInput): Promise<PaginatedResult<DisputeResponse>>;
  submitEvidence(disputeId: string, evidence: DisputeCreateEvidenceInput): Promise<DisputeResponse>;
  accept(disputeId: string, ventureId: string): Promise<DisputeResponse>;
  getResponseTemplate(reason: DisputeReason): Promise<DisputeTemplate>;
  getAnalytics(ventureId: string, period: DateRange): Promise<DisputeAnalytics>;
}

type DisputeStatus =
  | 'warning_needs_response'
  | 'warning_under_review'
  | 'warning_closed'
  | 'needs_response'
  | 'under_review'
  | 'charge_refunded'
  | 'won'
  | 'lost';

type DisputeReason =
  | 'duplicate'
  | 'fraudulent'
  | 'subscription_cancelled'
  | 'product_unacceptable'
  | 'product_not_received'
  | 'unrecognized'
  | 'credit_not_processed'
  | 'general';

type DisputeOutcome = 'won' | 'lost' | 'accepted' | 'expired';

interface DisputeResponse {
  id: string;
  paymentIntentId: string;
  ventureId: string;
  amount: number;
  currency: CurrencyCode;
  status: DisputeStatus;
  reason: DisputeReason;
  provider: string;
  providerDisputeId: string;
  evidence: DisputeEvidence[];
  outcome: DisputeOutcome | null;
  respondBy: Date;
  isAutoResponded: boolean;
  createdAt: Date;
  resolvedAt: Date | null;
}

interface DisputeAnalytics {
  ventureId: string;
  period: DateRange;
  totalDisputes: number;
  totalAmount: number;
  winRate: number;
  avgResponseTime: number;
  byReason: Record<DisputeReason, number>;
  byOutcome: Record<DisputeOutcome, number>;
  chargebackRate: number;
  trend: Array<{ date: string; count: number; amount: number }>;
}
```

### IPayoutService

```typescript
interface IPayoutService {
  create(input: PayoutCreateInput): Promise<PayoutResult>;
  createBatch(input: PayoutBatchInput): Promise<PayoutBatchResult>;
  get(payoutId: string, ventureId: string): Promise<PayoutResult>;
  list(input: PayoutListInput): Promise<PaginatedResult<PayoutResult>>;
  cancel(payoutId: string, ventureId: string): Promise<PayoutResult>;
  retry(payoutId: string, ventureId: string): Promise<PayoutResult>;
  getSchedule(ventureId: string): Promise<PayoutSchedule>;
  updateSchedule(ventureId: string, schedule: PayoutScheduleInput): Promise<PayoutSchedule>;
  getAvailableBalance(ventureId: string): Promise<AvailablePayoutBalance>;
  reconcile(ventureId: string, period: DateRange): Promise<PayoutReconciliationResult>;
}

type PayoutMethod = 'bank_transfer' | 'paypal' | 'crypto' | 'check' | 'platform_credit';
type PayoutStatus = 'pending' | 'processing' | 'in_transit' | 'paid' | 'failed' | 'cancelled' | 'returned';

interface PayoutCreateInput {
  ventureId: string;
  recipientId: string;
  amount: number;
  currency: CurrencyCode;
  method: PayoutMethod;
  destination: PayoutDestination;
  description: string | null;
  idempotencyKey: string;
  metadata: Record<string, string>;
}

interface PayoutBatchInput {
  ventureId: string;
  description: string;
  items: PayoutItemInput[];
  atomic: boolean;
  idempotencyKey: string;
}

interface PayoutResult {
  id: string;
  ventureId: string;
  recipientId: string;
  batchId: string | null;
  amount: number;
  currency: CurrencyCode;
  fee: number;
  netAmount: number;
  method: PayoutMethod;
  status: PayoutStatus;
  provider: string;
  providerPayoutId: string;
  failureReason: string | null;
  createdAt: Date;
  expectedArrival: Date | null;
  paidAt: Date | null;
}

interface PayoutSchedule {
  ventureId: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'manual';
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  minimumAmount: number;
  currency: CurrencyCode;
  method: PayoutMethod;
  holdPeriodDays: number;
  isActive: boolean;
  nextScheduledAt: Date | null;
}
```

### IPaymentLedger

```typescript
interface IPaymentLedger {
  record(entry: LedgerEntryInput): Promise<LedgerEntry[]>;
  getBalance(account: LedgerAccount, asOf?: Date): Promise<LedgerBalance>;
  getVentureBalances(ventureId: string): Promise<LedgerBalance[]>;
  getEntriesForTransaction(transactionId: string): Promise<LedgerEntry[]>;
  query(input: LedgerQueryInput): Promise<PaginatedResult<LedgerEntry>>;
  reconcile(input: ReconciliationInput): Promise<ReconciliationReport>;
  verifyIntegrity(ventureId?: string): Promise<LedgerIntegrityResult>;
}

interface LedgerEntry {
  id: string;
  transactionId: string;
  paymentIntentId: string | null;
  refundId: string | null;
  payoutId: string | null;
  ventureId: string;
  account: LedgerAccount;
  type: 'debit' | 'credit';
  amount: number;
  currency: CurrencyCode;
  description: string;
  metadata: Record<string, string>;
  createdAt: Date;
}

interface LedgerAccount {
  category: LedgerAccountCategory;
  subId: string;
}

type LedgerAccountCategory =
  | 'provider'
  | 'revenue'
  | 'platform_fees'
  | 'provider_fees'
  | 'payables'
  | 'fx_settlement'
  | 'reserves'
  | 'refund_reserve'
  | 'tax_collected';

interface LedgerBalance {
  account: LedgerAccount;
  balance: number;
  currency: CurrencyCode;
  totalDebits: number;
  totalCredits: number;
  lastEntryAt: Date | null;
  asOf: Date;
}

interface ReconciliationReport {
  id: string;
  ventureId: string;
  provider: string;
  period: DateRange;
  status: 'matched' | 'discrepancies_found' | 'pending_review';
  internalTotal: number;
  providerTotal: number;
  difference: number;
  currency: CurrencyCode;
  discrepancies: ReconciliationDiscrepancy[];
  matchedCount: number;
  unmatchedCount: number;
  createdAt: Date;
}
```

### IWebhookProcessor

```typescript
interface IWebhookProcessor {
  process(input: WebhookProcessInput): Promise<WebhookProcessResult>;
  retry(eventId: string): Promise<WebhookProcessResult>;
  listEvents(input: WebhookEventListInput): Promise<PaginatedResult<WebhookEvent>>;
  getDlq(input: DlqListInput): Promise<PaginatedResult<WebhookEvent>>;
  reprocessDlq(eventIds: string[]): Promise<WebhookBatchResult>;
  purge(olderThan: Date): Promise<{ purgedCount: number }>;
}

interface WebhookEvent {
  id: string;
  provider: WebhookProvider;
  providerEventId: string;
  eventType: string;
  normalizedType: WebhookEventType;
  payload: Record<string, unknown>;
  signature: string;
  status: WebhookDeliveryStatus;
  attempts: number;
  lastAttemptAt: Date | null;
  lastError: string | null;
  processedAt: Date | null;
  createdAt: Date;
}

type WebhookProvider = 'stripe' | 'paypal' | 'square' | 'adyen' | 'braintree' | 'solana';

type WebhookEventType =
  | 'payment.created'     | 'payment.processing'  | 'payment.succeeded'
  | 'payment.failed'      | 'payment.cancelled'   | 'payment.captured'
  | 'payment.requires_action'
  | 'refund.created'      | 'refund.succeeded'    | 'refund.failed'
  | 'dispute.created'     | 'dispute.updated'     | 'dispute.won'
  | 'dispute.lost'        | 'dispute.evidence_required'
  | 'payout.created'      | 'payout.paid'         | 'payout.failed'
  | 'method.attached'     | 'method.detached'     | 'method.expiring';

type WebhookDeliveryStatus = 'pending' | 'processing' | 'processed' | 'failed' | 'dlq';
```

### IFraudDetector

```typescript
interface IFraudDetector {
  score(input: FraudScoreInput): Promise<FraudScore>;
  checkVelocity(input: VelocityCheckInput): Promise<VelocityCheck>;
  shouldRequire3ds(input: ThreeDsDecisionInput): Promise<ThreeDsDecision>;
  reportFraud(paymentIntentId: string, details: FraudReportInput): Promise<void>;
  getRules(ventureId: string): Promise<FraudRule[]>;
  upsertRule(rule: FraudRuleInput): Promise<FraudRule>;
}

interface FraudScore {
  score: number;                          // 0-100 (higher = riskier)
  decision: FraudDecision;
  signals: FraudSignal[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requires3ds: boolean;
}

type FraudDecision = 'allow' | 'review' | 'block';

interface FraudSignal {
  type: string;
  description: string;
  weight: number;
  details: Record<string, unknown>;
}

interface VelocityLimit {
  metric: 'transaction_count' | 'total_amount' | 'unique_cards' | 'unique_ips';
  scope: 'customer' | 'ip' | 'card_fingerprint' | 'email' | 'device';
  windowSeconds: number;
  maxValue: number;
  action: 'block' | 'require_3ds' | 'flag_review';
}
```

---

## Database Schemas

### payment_intents

```typescript
import { pgTable, uuid, varchar, bigint, text, jsonb, boolean, timestamp, index, uniqueIndex, numeric, integer } from 'drizzle-orm/pg-core';

export const paymentIntentsTable = pgTable(
  'payment_intents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull(),
    customerId: uuid('customer_id').notNull(),
    orderId: uuid('order_id'),
    subscriptionId: uuid('subscription_id'),

    amount: bigint('amount', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    amountCaptured: bigint('amount_captured', { mode: 'number' }).notNull().default(0),
    amountRefunded: bigint('amount_refunded', { mode: 'number' }).notNull().default(0),

    status: varchar('status', { length: 50 }).notNull().default('created'),
    captureMethod: varchar('capture_method', { length: 20 }).notNull().default('automatic'),

    paymentMethodId: uuid('payment_method_id'),
    paymentMethodType: varchar('payment_method_type', { length: 30 }),

    provider: varchar('provider', { length: 50 }),
    providerPaymentId: varchar('provider_payment_id', { length: 255 }),
    clientSecret: varchar('client_secret', { length: 500 }),

    requires3ds: boolean('requires_3ds').notNull().default(false),
    threeDsStatus: varchar('three_ds_status', { length: 30 }),
    fraudScore: integer('fraud_score'),
    fraudDecision: varchar('fraud_decision', { length: 20 }),

    settlementCurrency: varchar('settlement_currency', { length: 3 }),
    exchangeRate: numeric('exchange_rate', { precision: 18, scale: 8 }),

    statementDescriptor: varchar('statement_descriptor', { length: 22 }),
    description: text('description'),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),

    customerIp: varchar('customer_ip', { length: 45 }),
    customerUserAgent: text('customer_user_agent'),

    lastErrorCode: varchar('last_error_code', { length: 50 }),
    lastErrorMessage: text('last_error_message'),
    lastErrorDeclineCode: varchar('last_error_decline_code', { length: 50 }),

    metadata: jsonb('metadata').notNull().default({}),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    capturedAt: timestamp('captured_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
  },
  (table) => ({
    ventureIdx: index('pi_venture_idx').on(table.ventureId),
    customerIdx: index('pi_customer_idx').on(table.customerId),
    statusIdx: index('pi_status_idx').on(table.status),
    providerIdx: index('pi_provider_idx').on(table.provider, table.providerPaymentId),
    orderIdx: index('pi_order_idx').on(table.orderId),
    idempotencyIdx: uniqueIndex('pi_idempotency_idx').on(table.ventureId, table.idempotencyKey),
    createdAtIdx: index('pi_created_at_idx').on(table.createdAt),
  }),
);

// RLS Policy:
// CREATE POLICY payment_intents_rls ON payment_intents
//   USING (venture_id = current_setting('app.current_venture_id')::uuid)
//   WITH CHECK (venture_id = current_setting('app.current_venture_id')::uuid);
```

### payment_methods

```typescript
export const paymentMethodsTable = pgTable(
  'payment_methods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull(),
    customerId: uuid('customer_id').notNull(),

    type: varchar('type', { length: 30 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('active'),
    isDefault: boolean('is_default').notNull().default(false),

    provider: varchar('provider', { length: 50 }).notNull(),
    providerMethodId: varchar('provider_method_id', { length: 255 }).notNull(),
    providerCustomerId: varchar('provider_customer_id', { length: 255 }),

    // Card fields
    cardBrand: varchar('card_brand', { length: 30 }),
    cardLast4: varchar('card_last4', { length: 4 }),
    cardExpMonth: integer('card_exp_month'),
    cardExpYear: integer('card_exp_year'),
    cardFunding: varchar('card_funding', { length: 20 }),
    cardCountry: varchar('card_country', { length: 2 }),
    cardFingerprint: varchar('card_fingerprint', { length: 255 }),
    card3dsSupported: boolean('card_3ds_supported'),

    // Bank account fields
    bankName: varchar('bank_name', { length: 255 }),
    bankLast4: varchar('bank_last4', { length: 4 }),
    bankTransferMethod: varchar('bank_transfer_method', { length: 20 }),
    bankCountry: varchar('bank_country', { length: 2 }),
    bankVerified: boolean('bank_verified').default(false),

    // Digital wallet fields
    walletType: varchar('wallet_type', { length: 30 }),
    walletDynamicLast4: varchar('wallet_dynamic_last4', { length: 4 }),

    // Crypto fields
    cryptoNetwork: varchar('crypto_network', { length: 20 }),
    cryptoAddress: varchar('crypto_address', { length: 255 }),
    cryptoToken: varchar('crypto_token', { length: 20 }),

    // BNPL fields
    bnplProvider: varchar('bnpl_provider', { length: 30 }),
    bnplPlanType: varchar('bnpl_plan_type', { length: 30 }),

    // Billing address
    billingLine1: varchar('billing_line1', { length: 255 }),
    billingCity: varchar('billing_city', { length: 100 }),
    billingState: varchar('billing_state', { length: 100 }),
    billingPostalCode: varchar('billing_postal_code', { length: 20 }),
    billingCountry: varchar('billing_country', { length: 2 }),

    metadata: jsonb('metadata').notNull().default({}),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => ({
    ventureCustomerIdx: index('pm_venture_customer_idx').on(table.ventureId, table.customerId),
    providerIdx: index('pm_provider_idx').on(table.provider, table.providerMethodId),
    fingerprintIdx: index('pm_fingerprint_idx').on(table.cardFingerprint),
  }),
);
// RLS: venture_id = current_setting('app.current_venture_id')::uuid
```

### payment_transactions

```typescript
export const paymentTransactionsTable = pgTable(
  'payment_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull(),
    paymentIntentId: uuid('payment_intent_id').notNull(),

    type: varchar('type', { length: 30 }).notNull(),
    // 'authorization' | 'capture' | 'void' | 'refund' | 'chargeback' | 'chargeback_reversal'
    status: varchar('status', { length: 30 }).notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    netAmount: bigint('net_amount', { mode: 'number' }),

    provider: varchar('provider', { length: 50 }).notNull(),
    providerTransactionId: varchar('provider_transaction_id', { length: 255 }),

    providerFee: bigint('provider_fee', { mode: 'number' }).default(0),
    platformFee: bigint('platform_fee', { mode: 'number' }).default(0),
    fxFee: bigint('fx_fee', { mode: 'number' }).default(0),

    errorCode: varchar('error_code', { length: 50 }),
    errorMessage: text('error_message'),
    declineCode: varchar('decline_code', { length: 50 }),

    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => ({
    intentIdx: index('pt_intent_idx').on(table.paymentIntentId),
    ventureIdx: index('pt_venture_idx').on(table.ventureId),
    providerIdx: index('pt_provider_idx').on(table.provider, table.providerTransactionId),
  }),
);
```

### refunds

```typescript
export const refundsTable = pgTable(
  'refunds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull(),
    paymentIntentId: uuid('payment_intent_id').notNull(),

    amount: bigint('amount', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    reason: varchar('reason', { length: 50 }).notNull(),
    notes: text('notes'),

    provider: varchar('provider', { length: 50 }).notNull(),
    providerRefundId: varchar('provider_refund_id', { length: 255 }),
    failureReason: text('failure_reason'),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),

    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    estimatedArrival: timestamp('estimated_arrival', { withTimezone: true }),
  },
  (table) => ({
    ventureIdx: index('ref_venture_idx').on(table.ventureId),
    intentIdx: index('ref_intent_idx').on(table.paymentIntentId),
    statusIdx: index('ref_status_idx').on(table.status),
    idempotencyIdx: uniqueIndex('ref_idempotency_idx').on(table.ventureId, table.idempotencyKey),
  }),
);
```

### disputes & dispute_evidence

```typescript
export const disputesTable = pgTable(
  'disputes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull(),
    paymentIntentId: uuid('payment_intent_id').notNull(),

    amount: bigint('amount', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    reason: varchar('reason', { length: 50 }).notNull(),
    outcome: varchar('outcome', { length: 30 }),

    provider: varchar('provider', { length: 50 }).notNull(),
    providerDisputeId: varchar('provider_dispute_id', { length: 255 }).notNull(),

    respondBy: timestamp('respond_by', { withTimezone: true }).notNull(),
    isAutoResponded: boolean('is_auto_responded').notNull().default(false),

    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => ({
    ventureIdx: index('dis_venture_idx').on(table.ventureId),
    statusIdx: index('dis_status_idx').on(table.status),
    respondByIdx: index('dis_respond_by_idx').on(table.respondBy),
  }),
);

export const disputeEvidenceTable = pgTable(
  'dispute_evidence',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    disputeId: uuid('dispute_id').notNull(),
    ventureId: uuid('venture_id').notNull(),

    type: varchar('type', { length: 50 }).notNull(),
    content: text('content').notNull(),
    mimeType: varchar('mime_type', { length: 100 }),
    fileSize: integer('file_size'),
    fileUrl: varchar('file_url', { length: 2048 }),

    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    disputeIdx: index('de_dispute_idx').on(table.disputeId),
  }),
);
```

### payouts & payout_items

```typescript
export const payoutsTable = pgTable(
  'payouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull(),
    batchId: uuid('batch_id'),
    recipientId: uuid('recipient_id').notNull(),

    amount: bigint('amount', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    fee: bigint('fee', { mode: 'number' }).notNull().default(0),
    netAmount: bigint('net_amount', { mode: 'number' }).notNull(),
    method: varchar('method', { length: 30 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('pending'),

    destinationType: varchar('destination_type', { length: 30 }).notNull(),
    destinationEncrypted: text('destination_encrypted').notNull(),

    provider: varchar('provider', { length: 50 }),
    providerPayoutId: varchar('provider_payout_id', { length: 255 }),
    failureReason: text('failure_reason'),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),
    description: text('description'),
    metadata: jsonb('metadata').notNull().default({}),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    expectedArrival: timestamp('expected_arrival', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
  },
  (table) => ({
    ventureIdx: index('po_venture_idx').on(table.ventureId),
    recipientIdx: index('po_recipient_idx').on(table.recipientId),
    statusIdx: index('po_status_idx').on(table.status),
    idempotencyIdx: uniqueIndex('po_idempotency_idx').on(table.ventureId, table.idempotencyKey),
  }),
);

export const payoutItemsTable = pgTable(
  'payout_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    payoutId: uuid('payout_id').notNull(),
    ventureId: uuid('venture_id').notNull(),
    recipientId: uuid('recipient_id').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    fee: bigint('fee', { mode: 'number' }).notNull().default(0),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    referenceType: varchar('reference_type', { length: 50 }),
    referenceId: uuid('reference_id'),
    description: text('description'),
    failureReason: text('failure_reason'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => ({
    payoutIdx: index('poi_payout_idx').on(table.payoutId),
    ventureIdx: index('poi_venture_idx').on(table.ventureId),
  }),
);
```

### payment_ledger

```typescript
export const paymentLedgerTable = pgTable(
  'payment_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    transactionId: uuid('transaction_id').notNull(),
    ventureId: uuid('venture_id').notNull(),

    paymentIntentId: uuid('payment_intent_id'),
    refundId: uuid('refund_id'),
    payoutId: uuid('payout_id'),

    accountCategory: varchar('account_category', { length: 50 }).notNull(),
    accountSubId: varchar('account_sub_id', { length: 255 }).notNull(),
    entryType: varchar('entry_type', { length: 10 }).notNull(), // 'debit' | 'credit'
    transactionType: varchar('transaction_type', { length: 50 }).notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),

    description: text('description').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    transactionIdx: index('pl_transaction_idx').on(table.transactionId),
    ventureIdx: index('pl_venture_idx').on(table.ventureId),
    accountIdx: index('pl_account_idx').on(table.accountCategory, table.accountSubId),
    intentIdx: index('pl_intent_idx').on(table.paymentIntentId),
    createdAtIdx: index('pl_created_at_idx').on(table.createdAt),
  }),
);

// Integrity constraint: SUM(debits) = SUM(credits) per transaction_id
// Enforced via trigger:
// CREATE OR REPLACE FUNCTION check_ledger_balance() RETURNS TRIGGER AS $$
// BEGIN
//   IF (SELECT SUM(CASE WHEN entry_type='debit' THEN amount ELSE -amount END)
//       FROM payment_ledger WHERE transaction_id = NEW.transaction_id) != 0 THEN
//     RAISE EXCEPTION 'Ledger transaction % is unbalanced', NEW.transaction_id;
//   END IF;
//   RETURN NEW;
// END; $$ LANGUAGE plpgsql;
```

### provider_configs

```typescript
export const providerConfigsTable = pgTable(
  'provider_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull(),

    provider: varchar('provider', { length: 50 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    isPrimary: boolean('is_primary').notNull().default(false),

    apiKeyEncrypted: text('api_key_encrypted'),
    secretKeyEncrypted: text('secret_key_encrypted'),
    webhookSecretEncrypted: text('webhook_secret_encrypted'),

    supportedMethods: jsonb('supported_methods').notNull().default([]),
    supportedCurrencies: jsonb('supported_currencies').notNull().default([]),
    settlementCurrency: varchar('settlement_currency', { length: 3 }),
    statementDescriptor: varchar('statement_descriptor', { length: 22 }),

    routingPriority: integer('routing_priority').notNull().default(0),
    routingRules: jsonb('routing_rules').notNull().default({}),
    feeConfig: jsonb('fee_config').notNull().default({}),
    payoutSchedule: jsonb('payout_schedule'),

    mode: varchar('mode', { length: 10 }).notNull().default('live'),
    metadata: jsonb('metadata').notNull().default({}),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ventureProviderIdx: uniqueIndex('pc_venture_provider_idx').on(table.ventureId, table.provider),
  }),
);
```

### webhook_events

```typescript
export const webhookEventsTable = pgTable(
  'webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: varchar('provider', { length: 50 }).notNull(),
    providerEventId: varchar('provider_event_id', { length: 255 }).notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    normalizedType: varchar('normalized_type', { length: 100 }),
    payload: jsonb('payload').notNull(),
    signature: text('signature').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(5),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    lastError: text('last_error'),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
    paymentIntentId: uuid('payment_intent_id'),
    ventureId: uuid('venture_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (table) => ({
    providerEventIdx: uniqueIndex('we_provider_event_idx').on(table.provider, table.providerEventId),
    statusIdx: index('we_status_idx').on(table.status),
    nextRetryIdx: index('we_next_retry_idx').on(table.nextRetryAt),
  }),
);
```

### payment_fees

```typescript
export const paymentFeesTable = pgTable(
  'payment_fees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull(),
    paymentIntentId: uuid('payment_intent_id').notNull(),
    transactionId: uuid('transaction_id'),
    feeType: varchar('fee_type', { length: 30 }).notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    ratePercentage: numeric('rate_percentage', { precision: 8, scale: 4 }),
    rateFixed: bigint('rate_fixed', { mode: 'number' }),
    basisAmount: bigint('basis_amount', { mode: 'number' }),
    provider: varchar('provider', { length: 50 }).notNull(),
    description: text('description'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ventureIdx: index('pf_venture_idx').on(table.ventureId),
    intentIdx: index('pf_intent_idx').on(table.paymentIntentId),
  }),
);
```

---

## Code Examples

### Example 1: Create a Payment Intent

```typescript
import { PaymentService, generateIdempotencyKey } from '@mcv/commerce/payments';

async function createCheckoutPayment(
  ventureId: string,
  customerId: string,
  orderId: string,
  amount: number,      // In cents (2999 = $29.99)
  currency: string,
) {
  const paymentService = new PaymentService();

  const intent = await paymentService.createIntent({
    ventureId,
    customerId,
    orderId,
    amount,
    currency: currency as CurrencyCode,
    captureMethod: 'automatic',
    description: `Order ${orderId}`,
    statementDescriptor: 'MCV*STORE',
    idempotencyKey: generateIdempotencyKey(orderId, 'checkout'),
    metadata: {
      orderId,
      source: 'web_checkout',
    },
  });

  // Return client secret for frontend (Stripe.js confirmCardPayment)
  return {
    intentId: intent.id,
    clientSecret: intent.clientSecret,
    requires3ds: intent.requires3ds,
    provider: intent.provider,
  };
}

const result = await createCheckoutPayment(
  'venture_123', 'cust_456', 'ord_789', 2999, 'USD',
);
// → { intentId: 'pi_abc', clientSecret: 'pi_abc_secret_xyz',
//     requires3ds: false, provider: 'stripe' }
```

### Example 2: Process a Card Payment (Server-Side)

```typescript
import { PaymentService, PaymentMethodService } from '@mcv/commerce/payments';

async function processCardPayment(
  ventureId: string,
  customerId: string,
  paymentMethodId: string,
  amount: number,
  currency: CurrencyCode,
  orderId: string,
) {
  const paymentService = new PaymentService();
  const methodService = new PaymentMethodService();

  // 1. Verify payment method
  const method = await methodService.get(paymentMethodId, ventureId);
  if (!method || method.customerId !== customerId) {
    throw new PaymentError('PAYMENT_METHOD_NOT_FOUND', 'Payment method not found');
  }
  if (method.status !== 'active') {
    throw new PaymentError('PAYMENT_METHOD_INACTIVE', 'Payment method is not active');
  }

  // 2. Create + confirm in one step
  const intent = await paymentService.createIntent({
    ventureId,
    customerId,
    orderId,
    amount,
    currency,
    paymentMethodId,
    captureMethod: 'automatic',
    confirm: true,
    offSession: false,
    idempotencyKey: generateIdempotencyKey(orderId, 'card-payment'),
    statementDescriptor: 'MCV*ORDER',
    metadata: { orderId },
  });

  // 3. Handle outcomes
  switch (intent.status) {
    case 'succeeded':
      return { success: true, intentId: intent.id };

    case 'requires_action':
      // 3D Secure challenge required
      return {
        success: false,
        requires3ds: true,
        intentId: intent.id,
        clientSecret: intent.clientSecret,
      };

    case 'requires_capture':
      const captured = await paymentService.captureIntent({
        paymentIntentId: intent.id,
        ventureId,
        amount,
      });
      return { success: true, intentId: captured.id };

    case 'failed':
      throw new PaymentError(
        intent.lastError?.code ?? 'PAYMENT_FAILED',
        intent.lastError?.message ?? 'Payment processing failed',
      );

    default:
      throw new PaymentError('UNEXPECTED_STATUS', `Unexpected: ${intent.status}`);
  }
}

try {
  const result = await processCardPayment(
    'venture_123', 'cust_456', 'pm_saved_visa_789', 4999, 'USD', 'ord_abc',
  );
  console.log('Payment result:', result);
} catch (error) {
  if (error instanceof PaymentError) {
    console.error(`[${error.code}]: ${error.message}`);
  }
}
```

### Example 3: Apple Pay Payment

```typescript
import { PaymentService } from '@mcv/commerce/payments';

async function processApplePayPayment(
  ventureId: string,
  customerId: string,
  orderId: string,
  amount: number,
  currency: CurrencyCode,
  applePayToken: string,
  billingContact: { addressLines?: string[]; locality?: string;
    administrativeArea?: string; postalCode?: string; countryCode?: string },
) {
  const paymentService = new PaymentService();

  const intent = await paymentService.createIntent({
    ventureId,
    customerId,
    orderId,
    amount,
    currency,
    captureMethod: 'automatic',
    confirm: true,
    paymentMethodData: {
      type: 'digital_wallet',
      digitalWallet: {
        walletType: 'apple_pay',
        token: applePayToken,
      },
      billingAddress: {
        line1: billingContact.addressLines?.[0] ?? '',
        line2: billingContact.addressLines?.[1] ?? null,
        city: billingContact.locality ?? '',
        state: billingContact.administrativeArea ?? null,
        postalCode: billingContact.postalCode ?? '',
        country: billingContact.countryCode ?? '',
      },
    },
    idempotencyKey: generateIdempotencyKey(orderId, 'apple-pay'),
    statementDescriptor: 'MCV*PURCHASE',
    metadata: { orderId, paymentMethod: 'apple_pay' },
  });

  // Apple Pay: biometric auth replaces 3DS, usually succeeds immediately
  if (intent.status === 'succeeded') {
    return { success: true, intentId: intent.id };
  }

  if (intent.status === 'failed') {
    throw new PaymentError(
      intent.lastError?.code ?? 'APPLE_PAY_FAILED',
      intent.lastError?.message ?? 'Apple Pay payment failed',
    );
  }

  return { success: false, status: intent.status, clientSecret: intent.clientSecret };
}
```

### Example 4: Refund Processing

```typescript
import { RefundService, PaymentService } from '@mcv/commerce/payments';

async function processRefund(
  ventureId: string,
  paymentIntentId: string,
  amount: number | null,       // null = full refund
  reason: RefundReason,
  notes: string | null,
  requestedBy: string,
) {
  const refundService = new RefundService();
  const paymentService = new PaymentService();

  // 1. Verify payment is refundable
  const intent = await paymentService.getIntent(paymentIntentId, ventureId);
  if (!intent) throw new PaymentError('PAYMENT_NOT_FOUND', 'Payment not found');
  if (intent.status !== 'succeeded' && intent.status !== 'captured') {
    throw new PaymentError('PAYMENT_NOT_REFUNDABLE',
      `Cannot refund payment with status: ${intent.status}`);
  }

  // 2. Calculate refundable amount
  const refundableAmount = intent.amountCaptured - intent.amountRefunded;
  const refundAmount = amount ?? refundableAmount;

  if (refundAmount <= 0) {
    throw new PaymentError('NOTHING_TO_REFUND', 'Already fully refunded');
  }
  if (refundAmount > refundableAmount) {
    throw new PaymentError('REFUND_EXCEEDS_AVAILABLE',
      `Amount ${refundAmount} exceeds refundable ${refundableAmount}`);
  }

  // 3. Process refund
  const refund = await refundService.create({
    paymentIntentId,
    ventureId,
    amount: refundAmount,
    reason,
    notes,
    notifyCustomer: true,
    idempotencyKey: generateIdempotencyKey(paymentIntentId, `refund-${Date.now()}`),
    metadata: {
      requestedBy,
      refundType: amount === null ? 'full' : 'partial',
    },
  });

  return refund;
  // → { id: 'ref_xyz', amount: 2999, currency: 'USD', status: 'processing',
  //     estimatedArrival: '2026-02-15T...' }
}

// Full refund
await processRefund('venture_123', 'pi_abc', null, 'requested_by_customer',
  'Customer changed their mind', 'admin_1');

// Partial refund ($10.00 of $50.00)
await processRefund('venture_123', 'pi_abc', 1000, 'product_defective',
  'One item damaged in shipping', 'support_2');

// Store credit alternative
async function issueStoreCreditRefund(ventureId: string, intentId: string,
  amount: number, customerId: string) {
  const refundService = new RefundService();
  return refundService.issueStoreCredit({
    paymentIntentId: intentId, ventureId, customerId, amount,
    reason: 'requested_by_customer', expiresInDays: 365,
    idempotencyKey: generateIdempotencyKey(intentId, 'store-credit'),
    metadata: { source: 'refund_alternative' },
  });
}
```

### Example 5: Dispute Handling

```typescript
import { DisputeService } from '@mcv/commerce/payments';

async function handleNewDispute(disputeId: string, ventureId: string) {
  const disputeService = new DisputeService();
  const dispute = await disputeService.get(disputeId, ventureId);

  console.log('Dispute received:', {
    id: dispute.id, amount: dispute.amount, reason: dispute.reason,
    respondBy: dispute.respondBy,
  });

  // Small disputes: auto-accept (cost of fighting > amount)
  if (dispute.amount < 500) {
    await disputeService.accept(dispute.id, ventureId);
    return { action: 'accepted', disputeId: dispute.id };
  }

  // Get template and auto-submit evidence
  const template = await disputeService.getResponseTemplate(dispute.reason);
  if (template.autoSubmit) {
    await submitDisputeEvidence(dispute);
    return { action: 'evidence_submitted', disputeId: dispute.id };
  }

  return { action: 'queued_for_review', disputeId: dispute.id };
}

async function submitDisputeEvidence(dispute: DisputeResponse) {
  const disputeService = new DisputeService();

  // Always include receipt
  await disputeService.submitEvidence(dispute.id, {
    type: 'receipt',
    content: await generateReceipt(dispute.paymentIntentId),
    mimeType: 'application/pdf',
  });

  // Shipping proof for "not received" disputes
  if (dispute.reason === 'product_not_received') {
    const tracking = await getShippingTracking(dispute.paymentIntentId);
    if (tracking) {
      await disputeService.submitEvidence(dispute.id, {
        type: 'shipping_documentation',
        content: JSON.stringify(tracking),
      });
      await disputeService.submitEvidence(dispute.id, {
        type: 'tracking_number',
        content: tracking.trackingNumber,
      });
    }
  }

  // Customer communications
  const comms = await getCustomerCommunications(dispute.paymentIntentId);
  if (comms.length > 0) {
    await disputeService.submitEvidence(dispute.id, {
      type: 'customer_communication',
      content: JSON.stringify(comms),
    });
  }
}

// Dispute analytics — monitor chargeback rate
async function getDisputeReport(ventureId: string) {
  const disputeService = new DisputeService();
  const analytics = await disputeService.getAnalytics(ventureId, {
    start: new Date('2026-01-01'),
    end: new Date('2026-02-08'),
  });

  if (analytics.chargebackRate > 0.009) {
    console.warn('Chargeback rate approaching card network threshold (1%)!');
  }

  return analytics;
}
```

### Example 6: Payout Batch Processing

```typescript
import { PayoutService } from '@mcv/commerce/payments';

async function processVendorPayouts(
  ventureId: string,
  vendorPayouts: Array<{
    vendorId: string; amount: number; currency: CurrencyCode;
    method: PayoutMethod; destination: PayoutDestination;
    periodStart: string; periodEnd: string; orderCount: number;
  }>,
) {
  const payoutService = new PayoutService();

  // 1. Check available balance
  const balance = await payoutService.getAvailableBalance(ventureId);
  const totalNeeded = vendorPayouts.reduce((sum, p) => sum + p.amount, 0);
  if (balance.available < totalNeeded) {
    throw new PaymentError('INSUFFICIENT_BALANCE',
      `Available ${balance.available} < needed ${totalNeeded}`);
  }

  // 2. Execute batch
  const batchResult = await payoutService.createBatch({
    ventureId,
    description: `Vendor settlements - ${new Date().toISOString().split('T')[0]}`,
    atomic: false,
    idempotencyKey: generateIdempotencyKey(ventureId, `batch-${Date.now()}`),
    items: vendorPayouts.map((vp) => ({
      recipientId: vp.vendorId,
      amount: vp.amount,
      currency: vp.currency,
      method: vp.method,
      destination: vp.destination,
      description: `Settlement ending ${vp.periodEnd}`,
      metadata: { vendorId: vp.vendorId, orderCount: String(vp.orderCount) },
    })),
  });

  console.log('Batch result:', {
    batchId: batchResult.batchId,
    success: batchResult.successCount,
    failed: batchResult.failedCount,
    totalAmount: batchResult.totalAmount,
  });

  return batchResult;
}

// Usage: mixed payout methods
await processVendorPayouts('venture_123', [
  {
    vendorId: 'vendor_aaa', amount: 150000, currency: 'USD',
    method: 'bank_transfer',
    destination: { bankAccount: { accountNumber: '****4567',
      routingNumber: '021000021', accountType: 'checking',
      country: 'US', currency: 'USD' } },
    periodStart: '2026-01-01', periodEnd: '2026-01-31', orderCount: 47,
  },
  {
    vendorId: 'vendor_bbb', amount: 75000, currency: 'USD',
    method: 'paypal',
    destination: { paypal: { email: 'vendor@example.com' } },
    periodStart: '2026-01-01', periodEnd: '2026-01-31', orderCount: 23,
  },
  {
    vendorId: 'vendor_ccc', amount: 50000, currency: 'USD',
    method: 'crypto',
    destination: { crypto: { network: 'solana',
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      token: 'USDC' } },
    periodStart: '2026-01-01', periodEnd: '2026-01-31', orderCount: 12,
  },
]);
```

### Example 7: Multi-Currency Payment with FX

```typescript
import { PaymentService } from '@mcv/commerce/payments';

async function processMultiCurrencyPayment(
  ventureId: string,
  customerId: string,
  orderId: string,
  amount: number,              // Amount in presentment currency (e.g., EUR cents)
  presentmentCurrency: CurrencyCode,  // What customer sees (EUR)
  settlementCurrency: CurrencyCode,   // What venture receives (USD)
) {
  const paymentService = new PaymentService();

  // 1. Get FX quote
  const fxQuote = await paymentService.getFxQuote(
    presentmentCurrency, settlementCurrency, amount,
  );

  console.log('FX Quote:', {
    from: `${amount} ${presentmentCurrency}`,
    to: `${fxQuote.convertedAmount} ${settlementCurrency}`,
    rate: fxQuote.rate,
    markup: fxQuote.markupPercentage,
    expiresAt: fxQuote.expiresAt,
  });

  // 2. Create intent in presentment currency
  const intent = await paymentService.createIntent({
    ventureId,
    customerId,
    orderId,
    amount,
    currency: presentmentCurrency,
    captureMethod: 'automatic',
    idempotencyKey: generateIdempotencyKey(orderId, 'multi-currency'),
    statementDescriptor: 'MCV*INTL',
    metadata: {
      orderId,
      presentmentCurrency,
      settlementCurrency,
      fxRate: String(fxQuote.rate),
      fxQuoteId: fxQuote.id,
    },
  });

  // Settlement happens automatically in the venture's configured currency.
  // The exchange rate and FX fee are recorded in the payment_fees table
  // and the ledger records the FX conversion entry.

  return {
    intentId: intent.id,
    clientSecret: intent.clientSecret,
    presentment: { amount, currency: presentmentCurrency },
    settlement: {
      amount: fxQuote.convertedAmount,
      currency: settlementCurrency,
      rate: fxQuote.rate,
    },
  };
}

// European customer paying in EUR, venture settles in USD
const result = await processMultiCurrencyPayment(
  'venture_123', 'cust_eu_456', 'ord_intl_789',
  2499,  // €24.99
  'EUR', 'USD',
);
// → { presentment: { amount: 2499, currency: 'EUR' },
//     settlement: { amount: 2724, currency: 'USD', rate: 1.0900 } }
```

### Example 8: Webhook Processing

```typescript
import { WebhookProcessor } from '@mcv/commerce/payments';

// Express/Next.js API route handler for Stripe webhooks
export async function POST(request: Request) {
  const webhookProcessor = new WebhookProcessor();

  const body = await request.text();
  const signature = request.headers.get('stripe-signature') ?? '';

  try {
    const result = await webhookProcessor.process({
      provider: 'stripe',
      payload: body,
      signature,
      headers: Object.fromEntries(request.headers.entries()),
    });

    if (result.status === 'duplicate') {
      // Already processed — idempotent success
      return new Response('OK', { status: 200 });
    }

    if (result.status === 'processed') {
      console.log('Webhook processed:', {
        eventId: result.eventId,
        type: result.normalizedType,
        paymentIntentId: result.paymentIntentId,
      });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      console.error('Webhook signature verification failed');
      return new Response('Unauthorized', { status: 401 });
    }

    // Return 500 so the provider retries
    console.error('Webhook processing error:', error);
    return new Response('Internal Error', { status: 500 });
  }
}

// Process the DLQ (dead-letter queue) — run periodically
async function processDlq() {
  const webhookProcessor = new WebhookProcessor();

  const dlqEvents = await webhookProcessor.getDlq({
    limit: 50,
    provider: 'stripe',
  });

  if (dlqEvents.items.length === 0) {
    console.log('DLQ is empty');
    return;
  }

  console.log(`Processing ${dlqEvents.items.length} DLQ events`);

  const result = await webhookProcessor.reprocessDlq(
    dlqEvents.items.map((e) => e.id),
  );

  console.log('DLQ reprocessing result:', {
    succeeded: result.succeeded,
    failed: result.failed,
    remaining: result.remaining,
  });
}

// Webhook event mapping: how provider events become normalized events
//
// Stripe                          → Normalized
// ─────────────────────────────────────────────
// payment_intent.succeeded        → payment.succeeded
// payment_intent.payment_failed   → payment.failed
// payment_intent.canceled         → payment.cancelled
// payment_intent.requires_action  → payment.requires_action
// payment_intent.amount_capturable→ payment.captured
// charge.refunded                 → refund.succeeded
// charge.refund.updated           → refund.succeeded | refund.failed
// charge.dispute.created          → dispute.created
// charge.dispute.updated          → dispute.updated
// charge.dispute.closed           → dispute.won | dispute.lost
// payout.paid                     → payout.paid
// payout.failed                   → payout.failed
// payment_method.attached         → method.attached
// payment_method.detached         → method.detached
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `PAYMENT_INTENT_NOT_FOUND` | 404 | Payment intent does not exist or is not accessible |
| `PAYMENT_METHOD_NOT_FOUND` | 404 | Payment method does not exist |
| `PAYMENT_METHOD_INACTIVE` | 400 | Payment method expired, revoked, or failed verification |
| `PAYMENT_FAILED` | 402 | Payment was declined by the provider or card network |
| `PAYMENT_NOT_REFUNDABLE` | 400 | Payment status does not allow refunds |
| `CARD_DECLINED` | 402 | Card was declined (generic) |
| `CARD_DECLINED_INSUFFICIENT_FUNDS` | 402 | Insufficient funds on card |
| `CARD_DECLINED_LOST_STOLEN` | 402 | Card reported lost or stolen |
| `CARD_DECLINED_EXPIRED` | 402 | Card has expired |
| `CARD_DECLINED_FRAUD` | 402 | Card declined due to suspected fraud |
| `CARD_CVC_INVALID` | 400 | CVC verification failed |
| `CARD_AVS_FAILED` | 400 | Address verification failed |
| `AUTHENTICATION_REQUIRED` | 402 | 3D Secure authentication required |
| `THREE_DS_FAILED` | 402 | 3D Secure authentication failed |
| `AMOUNT_TOO_SMALL` | 400 | Amount below minimum for currency |
| `AMOUNT_TOO_LARGE` | 400 | Amount exceeds maximum allowed |
| `CURRENCY_NOT_SUPPORTED` | 400 | Currency not supported by provider/venture |
| `DUPLICATE_IDEMPOTENCY_KEY` | 409 | Idempotency key already used with different params |
| `REFUND_EXCEEDS_AVAILABLE` | 400 | Refund amount exceeds refundable balance |
| `NOTHING_TO_REFUND` | 400 | Payment already fully refunded |
| `REFUND_FAILED` | 500 | Refund processing failed at provider |
| `DISPUTE_RESPONSE_DEADLINE_PASSED` | 400 | Dispute response deadline expired |
| `INSUFFICIENT_BALANCE` | 400 | Insufficient balance for payout |
| `PAYOUT_FAILED` | 500 | Payout processing failed |
| `PAYOUT_DESTINATION_INVALID` | 400 | Invalid payout destination |
| `PROVIDER_UNAVAILABLE` | 503 | Payment provider is down or unreachable |
| `PROVIDER_ERROR` | 502 | Unexpected error from provider API |
| `PROVIDER_NOT_CONFIGURED` | 400 | No provider configured for this venture/method |
| `WEBHOOK_SIGNATURE_INVALID` | 401 | Webhook signature verification failed |
| `WEBHOOK_PROCESSING_FAILED` | 500 | Failed to process webhook event |
| `VELOCITY_LIMIT_EXCEEDED` | 429 | Too many transactions in time window |
| `FRAUD_BLOCKED` | 403 | Payment blocked by fraud detection |
| `FRAUD_REVIEW_REQUIRED` | 402 | Payment flagged for manual fraud review |
| `LEDGER_IMBALANCED` | 500 | Ledger entries do not balance (critical) |
| `FX_QUOTE_EXPIRED` | 400 | Foreign exchange quote has expired |
| `CRYPTO_TRANSACTION_FAILED` | 402 | Solana/crypto transaction failed |
| `CRYPTO_INSUFFICIENT_BALANCE` | 402 | Insufficient token balance in wallet |
| `BNPL_NOT_APPROVED` | 402 | BNPL application declined |
| `CAPTURE_AMOUNT_EXCEEDS_AUTH` | 400 | Capture amount exceeds authorization |
| `ALREADY_CAPTURED` | 400 | Payment has already been captured |
| `ALREADY_CANCELLED` | 400 | Payment has already been cancelled |

---

## Security

### PCI DSS Level 1 Compliance

The payments module maintains PCI DSS Level 1 compliance through architectural design:

- **No raw card data touches our servers.** Card numbers are tokenized client-side via provider SDKs (Stripe.js, Braintree Drop-in) before reaching our API. The `payment_methods` table stores only tokens, last-4 digits, and card metadata — never full PANs, CVCs, or expiry dates in raw form.

- **Tokenization at rest.** Provider API keys, webhook secrets, and payout destinations are encrypted using AES-256-GCM with keys managed via Supabase Vault. The `provider_configs` table stores only encrypted blobs in `*_encrypted` columns.

- **Network segmentation.** Payment processing runs in an isolated Supabase Edge Function environment with restricted network access. Only outbound connections to provider APIs are permitted.

- **Audit logging.** Every payment operation produces an immutable audit log entry. The `payment_ledger` table serves as the financial audit trail. All admin access to payment data is logged with user ID, timestamp, and action.

### Tokenization Flow

```
Client Browser                    Our Server                    Stripe API
     │                               │                              │
     │  1. Card number entered       │                              │
     │     in Stripe Elements        │                              │
     │─────────────────────────────────────────────────────────────►│
     │                               │     2. Stripe returns        │
     │  3. Token (tok_xxx)           │        token to client       │
     │◄────────────────────────────────────────────────────────────│
     │                               │                              │
     │  4. Send token to our API     │                              │
     │──────────────────────────────►│                              │
     │                               │  5. Use token to create      │
     │                               │     PaymentIntent at Stripe  │
     │                               │─────────────────────────────►│
     │                               │                              │
     │                               │  6. Store token + last4      │
     │                               │     in payment_methods       │
     │                               │                              │

     Raw card number NEVER reaches our server.
```

### 3D Secure 2.0

3D Secure is triggered based on fraud scoring and regulatory requirements:

```typescript
// 3DS decision logic (simplified)
function shouldRequire3ds(input: ThreeDsDecisionInput): ThreeDsDecision {
  // Always require for:
  // 1. European cards (PSD2/SCA mandate)
  if (isEuropeanCard(input.card)) return { required: true, reason: 'sca_mandate' };

  // 2. High fraud score
  if (input.fraudScore > 70) return { required: true, reason: 'high_risk' };

  // 3. Velocity violations
  if (input.velocityViolations.length > 0) return { required: true, reason: 'velocity' };

  // 4. Amount thresholds per venture config
  if (input.amount > input.ventureConfig.threeDsThreshold) {
    return { required: true, reason: 'amount_threshold' };
  }

  // 5. Card not previously authenticated
  if (!input.card.threeDsSupported) return { required: false, reason: 'not_supported' };

  return { required: false, reason: 'low_risk' };
}
```

### Fraud Prevention

The fraud detection pipeline runs before every payment:

1. **Velocity checks** — Rate limits per customer, IP, card fingerprint, email, and device. Configurable per venture via `FraudRule` entries.

2. **Risk scoring** — Composite score (0-100) based on signals:
   - IP geolocation vs. billing address mismatch
   - Device fingerprint anomalies
   - Email domain risk (disposable, free vs. corporate)
   - Card BIN country vs. IP country
   - Transaction amount vs. customer history
   - Time-of-day patterns

3. **Decision engine** — Based on score:
   - `0-30`: Allow (low risk)
   - `31-60`: Allow + require 3DS (medium risk)
   - `61-80`: Flag for review (high risk)
   - `81-100`: Block automatically (critical risk)

4. **Velocity limits** (defaults, configurable per venture):

| Metric | Scope | Window | Max | Action |
|--------|-------|--------|-----|--------|
| Transactions | Customer | 1 hour | 10 | Block |
| Transactions | IP | 1 hour | 20 | Block |
| Total amount | Customer | 24 hours | $5,000 | Require 3DS |
| Unique cards | Customer | 24 hours | 3 | Flag review |
| Failed attempts | Card fingerprint | 1 hour | 5 | Block |
| Transactions | Email | 1 hour | 5 | Require 3DS |

### Webhook Signature Verification

Each provider uses different signing mechanisms:

```typescript
// Stripe: HMAC-SHA256 with timestamp
async verifyStripeWebhook(payload: string, signature: string, secret: string) {
  const elements = signature.split(',');
  const timestamp = elements.find(e => e.startsWith('t='))?.slice(2);
  const v1Signature = elements.find(e => e.startsWith('v1='))?.slice(3);

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac('sha256', secret)
    .update(signedPayload).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(v1Signature!), Buffer.from(expected))) {
    throw new WebhookVerificationError('Invalid Stripe signature');
  }

  // Reject if timestamp is too old (> 5 minutes)
  const age = Date.now() / 1000 - Number(timestamp);
  if (age > 300) {
    throw new WebhookVerificationError('Stripe webhook timestamp too old');
  }
}

// PayPal: Certificate-based verification
// Square: HMAC-SHA256 with webhook signature key
// Adyen: HMAC-SHA256 with HMAC key from Customer Area
// Solana: Transaction signature verification via web3.js
```

---

## Environment Variables

```bash
# ─── Stripe ────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...              # Stripe secret key (platform-level)
STRIPE_PUBLISHABLE_KEY=pk_live_...         # Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_...            # Stripe webhook signing secret
STRIPE_API_VERSION=2024-12-18.acacia       # Pinned Stripe API version

# ─── PayPal ────────────────────────────────────────────────────────
PAYPAL_CLIENT_ID=...                       # PayPal REST API client ID
PAYPAL_CLIENT_SECRET=...                   # PayPal REST API client secret
PAYPAL_WEBHOOK_ID=...                      # PayPal webhook ID
PAYPAL_MODE=live                           # live | sandbox

# ─── Square ────────────────────────────────────────────────────────
SQUARE_ACCESS_TOKEN=...                    # Square access token
SQUARE_LOCATION_ID=...                     # Default Square location
SQUARE_WEBHOOK_SIGNATURE_KEY=...           # Square webhook signing key
SQUARE_ENVIRONMENT=production              # production | sandbox

# ─── Adyen ─────────────────────────────────────────────────────────
ADYEN_API_KEY=...                          # Adyen API key
ADYEN_MERCHANT_ACCOUNT=...                # Adyen merchant account
ADYEN_HMAC_KEY=...                         # Adyen webhook HMAC key
ADYEN_ENVIRONMENT=live                     # live | test

# ─── Braintree ─────────────────────────────────────────────────────
BRAINTREE_MERCHANT_ID=...                  # Braintree merchant ID
BRAINTREE_PUBLIC_KEY=...                   # Braintree public key
BRAINTREE_PRIVATE_KEY=...                  # Braintree private key
BRAINTREE_ENVIRONMENT=production           # production | sandbox

# ─── Solana / Crypto ──────────────────────────────────────────────
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_MERCHANT_WALLET=...                 # Platform receive wallet
EDGE_TOKEN_MINT=...                        # EDGE SPL token mint address
SOLANA_COMMITMENT=confirmed                # confirmed | finalized

# ─── Payment Module Config ────────────────────────────────────────
PAYMENT_DEFAULT_PROVIDER=stripe            # Default payment provider
PAYMENT_DEFAULT_CURRENCY=USD               # Default currency
PAYMENT_STATEMENT_DESCRIPTOR=MCV*          # Default statement descriptor
PAYMENT_MAX_RETRY_ATTEMPTS=5               # Webhook/dunning max retries
PAYMENT_RETRY_BACKOFF_BASE_MS=1000         # Exponential backoff base
PAYMENT_IDEMPOTENCY_TTL_HOURS=48           # Idempotency key TTL
PAYMENT_HOLD_PERIOD_DAYS=7                 # Payout hold period

# ─── Fraud Detection ──────────────────────────────────────────────
FRAUD_SCORE_BLOCK_THRESHOLD=80             # Score above this = auto-block
FRAUD_SCORE_REVIEW_THRESHOLD=60            # Score above this = flag review
FRAUD_SCORE_3DS_THRESHOLD=30               # Score above this = require 3DS
FRAUD_VELOCITY_ENABLED=true                # Enable velocity checks

# ─── FX ───────────────────────────────────────────────────────────
FX_PROVIDER=stripe                         # FX rate source
FX_MARKUP_PERCENTAGE=1.5                   # Platform FX markup (%)
FX_QUOTE_TTL_SECONDS=300                   # FX quote validity

# ─── Encryption ───────────────────────────────────────────────────
PAYMENT_ENCRYPTION_KEY_ID=...              # Supabase Vault key ID
```

---

## Dependencies

```json
{
  "dependencies": {
    "stripe": "^17.5.0",
    "@paypal/paypal-server-sdk": "^2.0.0",
    "square": "^38.0.0",
    "@adyen/api-library": "^18.0.0",
    "braintree": "^3.24.0",
    "@solana/web3.js": "^1.95.0",
    "@solana/spl-token": "^0.4.0",
    "@trpc/server": "^10.45.0",
    "drizzle-orm": "^0.34.0",
    "zod": "^3.23.0",
    "@supabase/supabase-js": "^2.45.0",
    "decimal.js": "^10.4.0",
    "ioredis": "^5.4.0",
    "uuid": "^10.0.0",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "@faker-js/faker": "^9.2.0",
    "drizzle-kit": "^0.25.0",
    "msw": "^2.6.0",
    "stripe-event-types": "^3.1.0",
    "testcontainers": "^10.14.0"
  }
}
```

### Dependency Notes

| Package | Purpose |
|---------|---------|
| `stripe` | Stripe API client — cards, wallets, ACH, SEPA, BNPL, payouts |
| `@paypal/paypal-server-sdk` | PayPal REST API — PayPal, Venmo, BNPL |
| `square` | Square API — cards, Cash App, gift cards |
| `@adyen/api-library` | Adyen API — cards, iDEAL, SEPA, Alipay, Boleto |
| `braintree` | Braintree API — cards, PayPal, Venmo, BNPL |
| `@solana/web3.js` | Solana blockchain — EDGE token, SOL, USDC/USDT |
| `@solana/spl-token` | SPL token operations for EDGE payments |
| `decimal.js` | Precise decimal arithmetic for financial calculations |
| `ioredis` | Redis for idempotency keys, velocity counters, caching |
| `msw` | Mock Service Worker for provider API mocking in tests |
| `testcontainers` | Docker containers for integration tests (PostgreSQL, Redis) |

---

## Testing

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   ├── payment.service.test.ts
│   │   ├── payment-intent.service.test.ts
│   │   ├── refund.service.test.ts
│   │   ├── dispute.service.test.ts
│   │   ├── payout.service.test.ts
│   │   ├── payment-ledger.service.test.ts
│   │   ├── webhook-processor.service.test.ts
│   │   ├── fraud-detection.service.test.ts
│   │   └── dunning.service.test.ts
│   ├── providers/
│   │   ├── stripe.provider.test.ts
│   │   ├── paypal.provider.test.ts
│   │   ├── square.provider.test.ts
│   │   ├── adyen.provider.test.ts
│   │   ├── braintree.provider.test.ts
│   │   ├── solana.provider.test.ts
│   │   ├── provider-registry.test.ts
│   │   └── provider-router.test.ts
│   ├── utils/
│   │   ├── format-currency.test.ts
│   │   ├── convert-currency.test.ts
│   │   ├── calculate-fees.test.ts
│   │   ├── idempotency.test.ts
│   │   └── validate-payment.test.ts
│   └── ledger/
│       ├── ledger-integrity.test.ts
│       └── reconciliation.test.ts
├── integration/
│   ├── payment-flow.test.ts
│   ├── refund-flow.test.ts
│   ├── dispute-flow.test.ts
│   ├── payout-flow.test.ts
│   ├── webhook-pipeline.test.ts
│   ├── multi-currency.test.ts
│   ├── ledger-balance.test.ts
│   └── provider-failover.test.ts
├── e2e/
│   ├── stripe-checkout.test.ts
│   ├── paypal-checkout.test.ts
│   └── crypto-payment.test.ts
└── fixtures/
    ├── stripe-webhooks/
    ├── paypal-webhooks/
    └── test-data.ts
```

### Unit Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from '../services/payment.service';
import { ProviderRouter } from '../providers/provider-router';
import { FraudDetectionService } from '../services/fraud-detection.service';

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockProviderRouter: ProviderRouter;
  let mockFraudService: FraudDetectionService;
  let mockStripeProvider: any;

  beforeEach(() => {
    mockStripeProvider = {
      name: 'stripe',
      createPayment: vi.fn().mockResolvedValue({
        providerPaymentId: 'pi_stripe_123',
        clientSecret: 'pi_stripe_123_secret_abc',
        status: 'requires_confirmation',
      }),
      capturePayment: vi.fn().mockResolvedValue({
        providerPaymentId: 'pi_stripe_123',
        status: 'succeeded',
      }),
    };

    mockProviderRouter = {
      resolve: vi.fn().mockResolvedValue(mockStripeProvider),
    } as any;

    mockFraudService = {
      score: vi.fn().mockResolvedValue({
        score: 15,
        decision: 'allow',
        riskLevel: 'low',
        requires3ds: false,
        signals: [],
      }),
      checkVelocity: vi.fn().mockResolvedValue({
        passed: true,
        violations: [],
      }),
    } as any;

    paymentService = new PaymentService(mockProviderRouter, mockFraudService);
  });

  describe('createIntent', () => {
    it('should create a payment intent and return client secret', async () => {
      const result = await paymentService.createIntent({
        ventureId: 'venture_123',
        customerId: 'cust_456',
        amount: 2999,
        currency: 'USD',
        captureMethod: 'automatic',
        idempotencyKey: 'idem_test_1',
        metadata: {},
      });

      expect(result.id).toBeDefined();
      expect(result.clientSecret).toBe('pi_stripe_123_secret_abc');
      expect(result.provider).toBe('stripe');
      expect(result.fraudScore).toBe(15);
      expect(result.fraudDecision).toBe('allow');
      expect(result.status).toBe('requires_confirmation');
    });

    it('should block payment when fraud score is critical', async () => {
      mockFraudService.score = vi.fn().mockResolvedValue({
        score: 95,
        decision: 'block',
        riskLevel: 'critical',
        requires3ds: true,
        signals: [{ type: 'ip_mismatch', weight: 40 }],
      });

      await expect(paymentService.createIntent({
        ventureId: 'venture_123',
        customerId: 'cust_456',
        amount: 99999,
        currency: 'USD',
        captureMethod: 'automatic',
        idempotencyKey: 'idem_test_2',
        metadata: {},
      })).rejects.toThrow('FRAUD_BLOCKED');
    });

    it('should enforce idempotency on duplicate keys', async () => {
      const input = {
        ventureId: 'venture_123',
        customerId: 'cust_456',
        amount: 2999,
        currency: 'USD' as CurrencyCode,
        captureMethod: 'automatic' as const,
        idempotencyKey: 'idem_same_key',
        metadata: {},
      };

      const first = await paymentService.createIntent(input);
      const second = await paymentService.createIntent(input);

      // Same idempotency key, same params → same result
      expect(second.id).toBe(first.id);
      // Provider should only be called once
      expect(mockStripeProvider.createPayment).toHaveBeenCalledTimes(1);
    });

    it('should reject duplicate idempotency key with different params', async () => {
      await paymentService.createIntent({
        ventureId: 'venture_123',
        customerId: 'cust_456',
        amount: 2999,
        currency: 'USD',
        captureMethod: 'automatic',
        idempotencyKey: 'idem_conflict',
        metadata: {},
      });

      await expect(paymentService.createIntent({
        ventureId: 'venture_123',
        customerId: 'cust_456',
        amount: 5000, // Different amount!
        currency: 'USD',
        captureMethod: 'automatic',
        idempotencyKey: 'idem_conflict',
        metadata: {},
      })).rejects.toThrow('DUPLICATE_IDEMPOTENCY_KEY');
    });

    it('should require 3DS when fraud score is medium', async () => {
      mockFraudService.score = vi.fn().mockResolvedValue({
        score: 45,
        decision: 'allow',
        riskLevel: 'medium',
        requires3ds: true,
        signals: [],
      });

      const result = await paymentService.createIntent({
        ventureId: 'venture_123',
        customerId: 'cust_456',
        amount: 15000,
        currency: 'USD',
        captureMethod: 'automatic',
        idempotencyKey: 'idem_3ds',
        metadata: {},
      });

      expect(result.requires3ds).toBe(true);
    });
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestDb, teardownTestDb, createTestVenture } from '../fixtures/test-data';

describe('Payment Flow (integration)', () => {
  let db: TestDb;
  let ventureId: string;

  beforeAll(async () => {
    db = await setupTestDb();
    ventureId = await createTestVenture(db);
  });

  afterAll(async () => {
    await teardownTestDb(db);
  });

  it('should complete full payment lifecycle: create → confirm → capture → refund', async () => {
    const paymentService = new PaymentService(db);

    // Create
    const intent = await paymentService.createIntent({
      ventureId,
      customerId: 'test_customer',
      amount: 5000,
      currency: 'USD',
      captureMethod: 'manual',
      idempotencyKey: `test-${Date.now()}`,
      metadata: {},
    });
    expect(intent.status).toBe('requires_confirmation');

    // Confirm
    const confirmed = await paymentService.confirmIntent({
      paymentIntentId: intent.id,
      ventureId,
    });
    expect(confirmed.status).toBe('requires_capture');

    // Capture
    const captured = await paymentService.captureIntent({
      paymentIntentId: intent.id,
      ventureId,
      amount: 5000,
    });
    expect(captured.status).toBe('captured');
    expect(captured.amountCaptured).toBe(5000);

    // Verify ledger entries
    const ledger = new PaymentLedgerService(db);
    const entries = await ledger.getEntriesForTransaction(intent.id);
    const debits = entries.filter(e => e.type === 'debit');
    const credits = entries.filter(e => e.type === 'credit');
    const debitSum = debits.reduce((s, e) => s + e.amount, 0);
    const creditSum = credits.reduce((s, e) => s + e.amount, 0);
    expect(debitSum).toBe(creditSum);  // Balanced ledger

    // Refund
    const refundService = new RefundService(db);
    const refund = await refundService.create({
      paymentIntentId: intent.id,
      ventureId,
      amount: 2000,
      reason: 'requested_by_customer',
      notes: 'Partial refund test',
      notifyCustomer: false,
      idempotencyKey: `refund-test-${Date.now()}`,
      metadata: {},
    });
    expect(refund.status).toBe('processing');
    expect(refund.amount).toBe(2000);

    // Verify updated intent
    const updated = await paymentService.getIntent(intent.id, ventureId);
    expect(updated.amountRefunded).toBe(2000);
  });

  it('should enforce RLS: venture A cannot access venture B payments', async () => {
    const ventureA = await createTestVenture(db, 'Venture A');
    const ventureB = await createTestVenture(db, 'Venture B');
    const paymentService = new PaymentService(db);

    const intent = await paymentService.createIntent({
      ventureId: ventureA,
      customerId: 'test_customer',
      amount: 1000,
      currency: 'USD',
      captureMethod: 'automatic',
      idempotencyKey: `rls-test-${Date.now()}`,
      metadata: {},
    });

    // Venture B cannot access Venture A's payment
    const result = await paymentService.getIntent(intent.id, ventureB);
    expect(result).toBeNull();
  });
});
```

### Running Tests

```bash
# Run all payment tests
pnpm vitest run --project payments

# Run unit tests only
pnpm vitest run tests/unit/

# Run integration tests (requires Docker for testcontainers)
pnpm vitest run tests/integration/

# Run with coverage
pnpm vitest run --coverage --project payments

# Run specific test file
pnpm vitest run tests/unit/services/payment.service.test.ts

# Watch mode during development
pnpm vitest watch --project payments
```

### Test Coverage Targets

| Category | Target | Notes |
|----------|--------|-------|
| Services | >90% | Core payment logic must be thoroughly tested |
| Providers | >85% | Each provider adapter, including error paths |
| Utils | >95% | Currency formatting, fee calculation, validation |
| Ledger | >95% | Financial integrity is critical — every path tested |
| Webhooks | >90% | Signature verification, dedup, all event types |
| Integration | >80% | Full lifecycle flows, RLS enforcement, edge cases |

---

*This module is part of the MCV.ONE platform. For commerce module overview, see `@mcv/commerce`. For subscription/recurring billing, see `@mcv/commerce/subscriptions`. For order management, see `@mcv/commerce/orders`.*
