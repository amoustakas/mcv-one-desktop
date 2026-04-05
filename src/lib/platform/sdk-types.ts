// src/lib/platform/sdk-types.ts
// TypeScript type contract for @mcv/commerce-sdk consumers.
// This is the public API surface — re-export only stable, consumer-facing types.

// ── Products & Commerce ───────────────────────────────────────────────────────
export type {
  ProductType,
  ProductStatus,
  Product,
  CreateProductInput,
  PricePoint,
  PricingConfig,
  SubscriptionPlan,
  SubscriptionConfig,
  SubscriptionStatus,
  SubscriptionInterval,
  Subscription,
  CreateSubscriptionInput,
  InvoiceStatus,
  InvoiceLineItem,
  Invoice,
  CreateInvoiceInput,
  LoanStatus,
  LoanRepayment,
  Loan,
  CreateLoanInput,
  UsageRecord,
  CreateUsageRecordInput,
  OrderStatus,
  Order,
  CreateOrderInput,
  PaymentTerms,
} from '../commerce/types';

// ── Payments ──────────────────────────────────────────────────────────────────
export type {
  PaymentMethod,
  PaymentStatus,
  PaymentRequest,
  PaymentResult,
  FeeEstimate,
  RoutingDecision,
  RefundResult,
} from '../payments/types';

// ── Ledger ────────────────────────────────────────────────────────────────────
export type {
  AccountType,
  AccountSubtype,
  LedgerAccount,
  JournalEntry,
  JournalEntryLine,
  JournalStatus,
  JournalSourceType,
  CreditAccount,
  TrialBalanceRow,
  CreateAccountInput,
  CreateJournalEntryInput,
} from '../ledger/types';

// ── Financial Reports ─────────────────────────────────────────────────────────
export type {
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  RealTimeMetrics,
  ReportScope,
  DateRange,
} from '../finance/types';

// ── Platform API ──────────────────────────────────────────────────────────────
export type {
  ApiKey,
  RateLimitTier,
  GeneratedApiKey,
} from './api-keys';

export type {
  WebhookEndpoint,
  WebhookDelivery,
} from './webhooks';

export type { RateLimitResult } from './rate-limiter';
