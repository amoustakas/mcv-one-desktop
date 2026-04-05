# @mcv/commerce/tax

> Tax calculation, collection, remittance tracking, and multi-jurisdiction compliance engine for the MCV.ONE platform.

**Module ID:** `@mcv/commerce/tax`
**Layer:** Tier 5 — Domain
**Parent:** `@mcv/commerce`
**Status:** Active
**Since:** 0.14.0
**Maintainer:** MCV Commerce Team

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
- [Core Interfaces](#core-interfaces)
- [Database Schemas](#database-schemas)
- [Code Examples](#code-examples)
- [Error Codes](#error-codes)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)

---

## Purpose

Every commercial transaction on the MCV.ONE platform — whether a SaaS subscription, marketplace sale, physical product shipment, or digital service delivery — must comply with tax laws across dozens of jurisdictions. Tax rules are notoriously complex: rates vary by product type, customer location, seller nexus, exemption status, and time of year. Getting them wrong exposes the organization to audit liability, penalties, and loss of customer trust.

`@mcv/commerce/tax` is the centralized tax engine that sits between the checkout/invoicing layer and external tax authority systems. It provides:

1. **Real-time tax calculation** at the line-item level for carts, checkouts, invoices, and credit memos — with sub-second response times even for multi-line, multi-jurisdiction orders.

2. **Provider abstraction** over commercial tax engines (Avalara AvaTax, TaxJar, Vertex) with automatic fallback, health monitoring, and a built-in rate database for offline/degraded operation.

3. **Nexus management** that automatically tracks economic nexus thresholds per state/province, maintains physical nexus registries, and alerts when new filing obligations arise.

4. **Exemption certificate lifecycle** — upload, validate, store, and apply customer-level and product-level exemptions, including resale certificates and government exemptions.

5. **Multi-jurisdiction compliance** spanning US state/county/city/district taxes, Canadian GST/HST/PST/QST, EU VAT (standard/reduced/zero/super-reduced), UK VAT, Australian GST, and extensible to any jurisdiction.

6. **VAT/GST handling** with per-country registration tracking, B2B reverse charge mechanism, MOSS/OSS support for digital services, and real-time VAT number validation via VIES.

7. **Reporting and filing support** — aggregated tax liability by jurisdiction, filing calendar management, sales tax return data generation, EU VAT returns with EC Sales List, and export formats compatible with major filing systems.

8. **Audit-grade record keeping** — every calculation is traced with full input/output snapshots, provider responses, rate sources, and amendment history for audit defense.

### Design Principles

- **Accuracy over speed, but both when possible.** Tax calculations must be correct. The fallback chain ensures availability, but never sacrifices accuracy for performance.
- **Provider-agnostic.** No business logic depends on a specific tax provider. Switching from Avalara to TaxJar requires only configuration changes.
- **Tenant-isolated.** Every tenant has its own nexus configuration, exemption certificates, provider credentials, and tax settings. Row-level security enforces strict isolation.
- **Jurisdiction-first modeling.** The data model is built around jurisdictions (not providers), so rates, rules, and filing obligations are portable across provider backends.
- **Immutable calculation records.** Once a tax calculation is committed to a transaction, it is never modified — only amended with a full audit trail.

### What This Module Does NOT Do

- **File tax returns.** This module generates the data needed for filing but does not submit returns to tax authorities. Filing is handled by external services or the `@mcv/commerce/tax-filing` extension.
- **Handle customs/duties.** Import duties, tariffs, and customs declarations are managed by `@mcv/commerce/shipping`.
- **Process tax payments.** Remittance of collected tax to authorities is coordinated by `@mcv/commerce/treasury`.

---

## Exports

```typescript
// === Core Service ===
export { TaxService }                    from './services/tax.service';
export { TaxCalculationEngine }          from './services/calculation-engine';
export { TaxProviderOrchestrator }       from './services/provider-orchestrator';

// === Providers ===
export { AvalaraTaxProvider }            from './providers/avalara.provider';
export { TaxJarProvider }                from './providers/taxjar.provider';
export { VertexProvider }                from './providers/vertex.provider';
export { BuiltInRateProvider }           from './providers/builtin-rate.provider';
export type { TaxProvider }              from './providers/tax-provider.interface';

// === Nexus ===
export { NexusManager }                  from './services/nexus-manager';
export { EconomicNexusTracker }          from './services/economic-nexus-tracker';
export type { NexusRecord }              from './types/nexus.types';
export type { NexusThreshold }           from './types/nexus.types';

// === Exemptions ===
export { ExemptionService }              from './services/exemption.service';
export { CertificateValidator }          from './services/certificate-validator';
export type { ExemptionCertificate }     from './types/exemption.types';
export type { ExemptionReason }          from './types/exemption.types';

// === VAT/GST ===
export { VATService }                    from './services/vat.service';
export { VATValidator }                  from './services/vat-validator';
export { ReverseChargeEngine }           from './services/reverse-charge-engine';
export { MOSSService }                   from './services/moss.service';
export type { VATRegistration }          from './types/vat.types';
export type { VATValidationResult }      from './types/vat.types';

// === Tax Codes & Rates ===
export { TaxCodeRegistry }               from './services/tax-code-registry';
export { TaxRateResolver }               from './services/tax-rate-resolver';
export type { TaxCode }                  from './types/tax-code.types';
export type { TaxRate }                  from './types/tax-rate.types';
export type { TaxHoliday }              from './types/tax-rate.types';

// === Reporting ===
export { TaxReportService }              from './services/tax-report.service';
export { FilingCalendarService }         from './services/filing-calendar.service';
export type { TaxReturn }               from './types/tax-return.types';
export type { TaxLiabilitySummary }     from './types/tax-return.types';
export type { FilingObligation }        from './types/filing.types';

// === Audit ===
export { TaxAuditService }              from './services/tax-audit.service';
export type { TaxAuditEntry }           from './types/audit.types';
export type { CalculationTrace }        from './types/audit.types';

// === Core Types ===
export type { TaxCalculation }           from './types/tax-calculation.types';
export type { TaxCalculationRequest }    from './types/tax-calculation.types';
export type { TaxCalculationResult }     from './types/tax-calculation.types';
export type { TaxLineItem }             from './types/tax-calculation.types';
export type { TaxJurisdiction }         from './types/jurisdiction.types';
export type { JurisdictionBreakdown }   from './types/jurisdiction.types';
export type { TaxAddress }              from './types/address.types';
export type { TaxConfig }               from './types/config.types';

// === tRPC Router ===
export { taxRouter }                     from './trpc/tax.router';

// === Drizzle Schemas ===
export * as taxSchemas                   from './db/schemas';

// === Constants ===
export { TAX_ERROR_CODES }              from './constants/error-codes';
export { JURISDICTION_CODES }           from './constants/jurisdictions';
export { DEFAULT_TAX_CODES }           from './constants/tax-codes';
export { NEXUS_THRESHOLDS }            from './constants/nexus-thresholds';
```

---

## Architecture

### High-Level Tax Calculation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Commerce Layer                                │
│  (Cart / Checkout / Invoice / Credit Memo / Subscription Renewal)   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    TaxCalculationRequest
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         TaxService                                    │
│                                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐  │
│  │  Exemption   │  │   Nexus      │  │    Tax Code Resolution     │  │
│  │  Check       │  │   Check      │  │    (Product Taxability)    │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────┬───────────────┘  │
│         │                │                        │                   │
│         ▼                ▼                        ▼                   │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │              TaxCalculationEngine                                │ │
│  │                                                                   │ │
│  │  • Resolves ship-from / ship-to addresses                        │ │
│  │  • Determines applicable jurisdictions                            │ │
│  │  • Applies exemptions & special rules                            │ │
│  │  • Routes to provider via orchestrator                           │ │
│  │  • Handles tax-inclusive price back-calculation                   │ │
│  └──────────────────────────┬──────────────────────────────────────┘ │
│                              │                                        │
└──────────────────────────────┼────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                   TaxProviderOrchestrator                              │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                    Provider Fallback Chain                        ││
│  │                                                                   ││
│  │   Primary           Secondary          Tertiary (Offline)        ││
│  │  ┌──────────┐     ┌──────────┐       ┌──────────────────┐       ││
│  │  │ Avalara  │────▶│ TaxJar   │──────▶│ Built-in Rate DB │       ││
│  │  │ AvaTax   │     │          │       │ (local fallback)  │       ││
│  │  └──────────┘     └──────────┘       └──────────────────┘       ││
│  │       │                │                      │                   ││
│  │  Health Monitor   Health Monitor        Always Available          ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                       │
│  • Circuit breaker per provider (5 failures → open, 30s reset)       │
│  • Latency tracking & SLA enforcement (<500ms P95)                   │
│  • Request deduplication (idempotency key)                           │
│  • Response caching (TTL: 5min for identical inputs)                 │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                    TaxCalculationResult
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       Persistence Layer                               │
│                                                                       │
│  ┌──────────────┐  ┌───────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ tax_          │  │ tax_      │  │ tax_audit_  │  │ nexus_      │ │
│  │ calculations  │  │ rates     │  │ log         │  │ records     │ │
│  └──────────────┘  └───────────┘  └─────────────┘  └─────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Provider Abstraction Layer

Every tax provider implements the `TaxProvider` interface, which normalizes the wildly different APIs of commercial tax engines into a single contract:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TaxProvider Interface                          │
│                                                                   │
│  calculateTax(request) → TaxCalculationResult                    │
│  commitTransaction(transactionId) → void                         │
│  voidTransaction(transactionId) → void                           │
│  adjustTransaction(transactionId, adjustments) → Result          │
│  validateAddress(address) → ValidatedAddress                     │
│  getHealthStatus() → ProviderHealthStatus                        │
│  getTaxRates(jurisdiction) → TaxRate[]                           │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐    ┌──────────────┐    ┌──────────────────┐
│   Avalara    │    │   TaxJar     │    │     Vertex       │
│   AvaTax     │    │              │    │                  │
│              │    │              │    │                  │
│ REST API v2  │    │ REST API v2  │    │ SOAP/REST API    │
│ Tax codes:   │    │ Tax codes:   │    │ Tax codes:       │
│  Avalara     │    │  TaxJar      │    │  Vertex          │
│  taxonomy    │    │  categories  │    │  commodity codes  │
│              │    │              │    │                  │
│ Supports:    │    │ Supports:    │    │ Supports:        │
│ • US/CA/EU   │    │ • US/CA/EU   │    │ • US/CA/EU/APAC  │
│ • Address    │    │ • AutoFile   │    │ • ERP integration │
│   validation │    │ • Nexus      │    │ • O Series       │
│ • Returns    │    │   insights   │    │ • Cloud           │
└─────────────┘    └──────────────┘    └──────────────────┘
```

### Tax-Inclusive Price Back-Calculation

For markets that require tax-inclusive pricing (EU, AU, UK), the engine performs reverse calculation:

```
Tax-Inclusive Price (displayed to customer)
         │
         ▼
┌──────────────────────────────────────────┐
│  Back-Calculation Engine                  │
│                                           │
│  net_price = inclusive_price / (1 + rate)  │
│  tax_amount = inclusive_price - net_price  │
│                                           │
│  Multi-jurisdiction splitting:            │
│  For compound rates (PST on GST+price):   │
│  Iterative solver with convergence check  │
└──────────────────────────────────────────┘
         │
         ▼
  net_price + tax_breakdown[]
```

### Nexus Detection Pipeline

```
┌───────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  Transaction   │     │  Economic Nexus  │     │   Nexus Alert        │
│  Stream        │────▶│  Tracker         │────▶│   Generator          │
│  (all sales)   │     │                  │     │                      │
└───────────────┘     │  Per-state:       │     │  • Email to tax team │
                       │  • Revenue YTD    │     │  • Dashboard alert   │
                       │  • Txn count YTD  │     │  • Filing obligation │
                       │  vs. thresholds   │     │    creation          │
                       └──────────────────┘     └──────────────────────┘

US Economic Nexus Thresholds (examples):
┌──────────────┬───────────┬────────────┐
│ State        │ Revenue   │ Txn Count  │
├──────────────┼───────────┼────────────┤
│ California   │ $500,000  │ —          │
│ Texas        │ $500,000  │ —          │
│ New York     │ $500,000  │ 100        │
│ South Dakota │ $100,000  │ 200        │
│ Pennsylvania │ $100,000  │ —          │
│ ...39 more   │           │            │
└──────────────┴───────────┴────────────┘
```

### VAT/GST Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     VAT Decision Tree                        │
│                                                               │
│  1. Is seller VAT-registered in buyer's country?             │
│     ├─ YES → Charge local VAT rate                           │
│     └─ NO → Is OSS/MOSS applicable? (digital services)      │
│              ├─ YES → Charge buyer-country VAT via OSS       │
│              └─ NO → Check distance selling threshold         │
│                       ├─ EXCEEDED → Register & charge local  │
│                       └─ BELOW → Charge origin-country VAT   │
│                                                               │
│  2. Is buyer a VAT-registered business (B2B)?                │
│     ├─ YES → Validate VAT number via VIES                    │
│     │         ├─ VALID → Reverse charge (0% VAT)            │
│     │         └─ INVALID → Charge standard VAT               │
│     └─ NO (B2C) → Charge applicable VAT rate                │
│                                                               │
│  3. Product classification                                    │
│     ├─ Standard rate (most goods/services)                   │
│     ├─ Reduced rate (food, books, children's clothing)       │
│     ├─ Super-reduced rate (essential items, select countries) │
│     └─ Zero-rated (exports, certain financial services)      │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### TaxCalculationRequest

The primary input to any tax calculation. Represents a single transaction (order, invoice, credit memo) with one or more line items.

```typescript
/**
 * Request payload for tax calculation.
 * Supports both tax-exclusive (US-style) and tax-inclusive (EU-style) pricing.
 */
interface TaxCalculationRequest {
  /** Unique identifier for this calculation (idempotency key). */
  calculationId: string;

  /** Tenant performing the transaction. */
  tenantId: string;

  /** Type of document being taxed. */
  documentType: 'sale' | 'return' | 'exchange' | 'invoice' | 'credit_memo';

  /**
   * Document-level date. Used to determine applicable rates.
   * Defaults to current date if omitted.
   */
  taxDate?: string; // ISO 8601

  /** Currency code (ISO 4217). Affects rounding rules. */
  currencyCode: string;

  /** Whether line item amounts include tax. */
  taxIncluded: boolean;

  /**
   * Customer information for exemption and classification lookup.
   */
  customer: TaxCustomer;

  /**
   * Ship-from address (seller/warehouse origin).
   * Required for origin-based tax states.
   */
  shipFrom: TaxAddress;

  /**
   * Ship-to address (customer destination).
   * Primary address for destination-based taxation.
   */
  shipTo: TaxAddress;

  /** Line items to calculate tax on. */
  lineItems: TaxLineItemRequest[];

  /**
   * Whether to commit this transaction to the provider.
   * Committed transactions count toward filing.
   * Set to false for quotes/estimates.
   */
  commit: boolean;

  /**
   * Optional: force a specific provider for this calculation.
   * Bypasses the fallback chain. Use for testing/debugging only.
   */
  forceProvider?: 'avalara' | 'taxjar' | 'vertex' | 'builtin';

  /** Arbitrary metadata passed through to the provider and stored in audit log. */
  metadata?: Record<string, unknown>;
}

/**
 * Customer information relevant to tax determination.
 */
interface TaxCustomer {
  /** Internal customer ID. */
  customerId: string;

  /** Customer type affects tax treatment. */
  customerType: 'individual' | 'business' | 'government' | 'nonprofit' | 'reseller';

  /**
   * VAT/tax registration number for B2B transactions.
   * When provided, triggers reverse charge evaluation.
   */
  taxRegistrationNumber?: string;

  /** Country of VAT registration (ISO 3166-1 alpha-2). */
  taxRegistrationCountry?: string;

  /**
   * Exemption certificate IDs attached to this customer.
   * The engine validates they are active and applicable.
   */
  exemptionCertificateIds?: string[];

  /** Entity use code (e.g., 'RESALE', 'GOVERNMENT', 'CHARITABLE'). */
  entityUseCode?: string;
}

/**
 * Address used for tax jurisdiction determination.
 * At minimum, country + postal code are required.
 */
interface TaxAddress {
  /** Street address line 1. */
  line1?: string;

  /** Street address line 2 (apt, suite, etc.). */
  line2?: string;

  /** City/municipality. */
  city?: string;

  /** State, province, or region code. */
  region?: string;

  /** Postal/ZIP code. */
  postalCode: string;

  /** ISO 3166-1 alpha-2 country code. */
  country: string;
}

/**
 * Individual line item in a tax calculation request.
 */
interface TaxLineItemRequest {
  /** Unique line item identifier within this request. */
  lineId: string;

  /**
   * Product tax code determining taxability.
   * Maps to provider-specific codes via TaxCodeRegistry.
   */
  taxCode: string;

  /** Quantity of items. */
  quantity: number;

  /**
   * Unit price (before or after tax depending on taxIncluded).
   * Decimal string to avoid floating point issues.
   */
  unitPrice: string;

  /**
   * Total extended amount (quantity × unitPrice after discounts).
   * When provided, takes precedence over quantity × unitPrice.
   */
  extendedAmount?: string;

  /** Line-level discount amount (pre-tax). */
  discountAmount?: string;

  /** Product description for audit trail. */
  description?: string;

  /** Whether this line item is shipping/freight. */
  isShipping?: boolean;

  /**
   * Override ship-to for this specific line item.
   * Used for split shipments.
   */
  shipTo?: TaxAddress;

  /** Line-level metadata. */
  metadata?: Record<string, unknown>;
}
```

### TaxCalculationResult

The output of a tax calculation — the full breakdown of tax amounts by jurisdiction.

```typescript
/**
 * Result of a tax calculation.
 * Contains per-line-item breakdowns and document-level totals.
 */
interface TaxCalculationResult {
  /** Echoed calculation ID for correlation. */
  calculationId: string;

  /** Provider that performed the calculation. */
  provider: 'avalara' | 'taxjar' | 'vertex' | 'builtin';

  /** Provider-assigned transaction/document ID. */
  providerTransactionId?: string;

  /** Whether the transaction was committed to the provider. */
  committed: boolean;

  /** Document-level totals. */
  summary: TaxSummary;

  /** Per-line-item results. */
  lineItems: TaxLineItemResult[];

  /** Jurisdiction-level breakdown across all lines. */
  jurisdictionSummary: JurisdictionBreakdown[];

  /** Timestamp of calculation (ISO 8601). */
  calculatedAt: string;

  /** Calculation duration in milliseconds. */
  calculationTimeMs: number;

  /** Warnings (e.g., address could not be validated, fallback used). */
  warnings: TaxWarning[];
}

/**
 * Document-level tax summary.
 */
interface TaxSummary {
  /** Total amount of all line items before tax. */
  subtotal: string;

  /** Total tax amount across all jurisdictions. */
  totalTax: string;

  /** Grand total (subtotal + totalTax). */
  total: string;

  /** Effective combined tax rate (totalTax / subtotal). */
  effectiveRate: string;

  /** Total discount applied. */
  totalDiscount: string;

  /** Total exempt amount. */
  totalExempt: string;

  /** Total taxable amount. */
  totalTaxable: string;
}

/**
 * Per-line-item tax calculation result.
 */
interface TaxLineItemResult {
  /** Echoed line ID. */
  lineId: string;

  /** Taxable amount for this line. */
  taxableAmount: string;

  /** Tax amount for this line. */
  taxAmount: string;

  /** Exempt amount for this line. */
  exemptAmount: string;

  /** Whether this line is fully exempt. */
  isExempt: boolean;

  /** Exemption reason if applicable. */
  exemptionReason?: string;

  /** Exemption certificate ID if applicable. */
  exemptionCertificateId?: string;

  /** Tax code used (after resolution). */
  resolvedTaxCode: string;

  /** Jurisdiction-level breakdown for this line. */
  jurisdictions: JurisdictionBreakdown[];
}

/**
 * Tax breakdown for a single jurisdiction.
 */
interface JurisdictionBreakdown {
  /** Jurisdiction identifier (e.g., 'US-CA', 'US-CA-LOS_ANGELES', 'EU-DE'). */
  jurisdictionCode: string;

  /** Human-readable jurisdiction name. */
  jurisdictionName: string;

  /** Jurisdiction type/level. */
  jurisdictionType: 'country' | 'state' | 'county' | 'city' | 'district' | 'special';

  /** Tax type within this jurisdiction. */
  taxType: 'sales_tax' | 'use_tax' | 'vat' | 'gst' | 'hst' | 'pst' | 'qst' | 'excise';

  /** Tax rate applied. */
  rate: string;

  /** Taxable amount in this jurisdiction. */
  taxableAmount: string;

  /** Tax amount for this jurisdiction. */
  taxAmount: string;

  /** Whether this jurisdiction's tax was exempt. */
  isExempt: boolean;

  /** Exemption reason for this jurisdiction. */
  exemptionReason?: string;
}

/**
 * Warnings generated during tax calculation.
 */
interface TaxWarning {
  /** Warning code. */
  code: string;

  /** Human-readable message. */
  message: string;

  /** Severity level. */
  severity: 'info' | 'warning' | 'error';

  /** Source of the warning. */
  source: 'address_validation' | 'provider' | 'nexus' | 'exemption' | 'rate_lookup';
}
```

### TaxProvider

The interface that all tax provider adapters must implement.

```typescript
/**
 * Tax provider interface.
 * All external tax engines implement this contract.
 */
interface TaxProvider {
  /** Provider identifier. */
  readonly providerId: 'avalara' | 'taxjar' | 'vertex' | 'builtin';

  /** Human-readable provider name. */
  readonly providerName: string;

  /**
   * Calculate tax for a transaction.
   * This is the primary method called by the orchestrator.
   */
  calculateTax(
    request: TaxCalculationRequest,
    options?: ProviderOptions,
  ): Promise<TaxCalculationResult>;

  /**
   * Commit a previously-calculated transaction.
   * Committed transactions appear in tax returns and filing data.
   * Providers that don't distinguish draft/committed may no-op.
   */
  commitTransaction(transactionId: string): Promise<void>;

  /**
   * Void a committed transaction.
   * Used when an order is fully cancelled before fulfillment.
   */
  voidTransaction(transactionId: string): Promise<void>;

  /**
   * Adjust a committed transaction (partial refund, price change).
   * Creates an adjustment document linked to the original.
   */
  adjustTransaction(
    originalTransactionId: string,
    adjustments: TaxAdjustmentRequest,
  ): Promise<TaxCalculationResult>;

  /**
   * Validate and normalize an address.
   * Returns the corrected address and validation confidence.
   */
  validateAddress(address: TaxAddress): Promise<AddressValidationResult>;

  /**
   * Retrieve tax rates for a given jurisdiction.
   * Used for rate display and offline fallback seeding.
   */
  getTaxRates(
    jurisdiction: TaxAddress,
    taxCode?: string,
  ): Promise<TaxRate[]>;

  /**
   * Health check for this provider.
   * The orchestrator calls this periodically to manage the fallback chain.
   */
  getHealthStatus(): Promise<ProviderHealthStatus>;

  /**
   * Initialize the provider with tenant-specific credentials.
   */
  initialize(config: TaxProviderConfig): Promise<void>;

  /**
   * Gracefully shut down the provider (close connections, flush caches).
   */
  shutdown(): Promise<void>;
}

/**
 * Options passed to provider on each calculation.
 */
interface ProviderOptions {
  /** Maximum time to wait for provider response. */
  timeoutMs?: number;

  /** Whether to cache this result. */
  cacheable?: boolean;

  /** Custom headers to pass to the provider API. */
  customHeaders?: Record<string, string>;
}

/**
 * Health status of a tax provider.
 */
interface ProviderHealthStatus {
  /** Whether the provider is currently healthy. */
  healthy: boolean;

  /** Current circuit breaker state. */
  circuitState: 'closed' | 'open' | 'half_open';

  /** Last successful request timestamp. */
  lastSuccessAt?: string;

  /** Last failure timestamp. */
  lastFailureAt?: string;

  /** Rolling failure count. */
  failureCount: number;

  /** Average response time over last 100 requests (ms). */
  avgResponseTimeMs: number;

  /** P95 response time over last 100 requests (ms). */
  p95ResponseTimeMs: number;

  /** Provider-specific status details. */
  details?: Record<string, unknown>;
}

/**
 * Address validation result.
 */
interface AddressValidationResult {
  /** Whether the address is valid. */
  valid: boolean;

  /** Corrected/normalized address. */
  normalizedAddress: TaxAddress;

  /** Confidence score (0-100). */
  confidence: number;

  /** Validation messages. */
  messages: string[];

  /** Resolution quality. */
  resolution: 'rooftop' | 'range' | 'street' | 'city' | 'postal_code' | 'country';
}
```

### TaxRate

Represents a tax rate applicable to a specific jurisdiction and product category.

```typescript
/**
 * Tax rate for a specific jurisdiction and product category.
 */
interface TaxRate {
  /** Unique rate identifier. */
  rateId: string;

  /** Jurisdiction this rate applies to. */
  jurisdictionCode: string;

  /** Jurisdiction name. */
  jurisdictionName: string;

  /** Jurisdiction level. */
  jurisdictionType: 'country' | 'state' | 'county' | 'city' | 'district' | 'special';

  /** Tax type. */
  taxType: 'sales_tax' | 'use_tax' | 'vat' | 'gst' | 'hst' | 'pst' | 'qst' | 'excise';

  /** Tax rate as a decimal (e.g., 0.0825 for 8.25%). */
  rate: string;

  /** Rate category. */
  rateCategory: 'standard' | 'reduced' | 'super_reduced' | 'zero' | 'exempt' | 'parking';

  /** Product tax code this rate applies to. Null = default rate. */
  taxCode?: string;

  /** Effective start date (ISO 8601). */
  effectiveFrom: string;

  /** Effective end date. Null = currently active. */
  effectiveTo?: string;

  /** Whether this is a compound rate (applied on top of other taxes). */
  isCompound: boolean;

  /** Display name for customer-facing contexts. */
  displayName: string;

  /** Source of this rate data. */
  source: 'provider' | 'manual' | 'government' | 'builtin';

  /** Last updated timestamp. */
  updatedAt: string;
}

/**
 * Tax holiday definition — temporary rate reduction or exemption.
 */
interface TaxHoliday {
  /** Holiday identifier. */
  holidayId: string;

  /** Jurisdiction code. */
  jurisdictionCode: string;

  /** Holiday name (e.g., "Back-to-School Sales Tax Holiday"). */
  name: string;

  /** Start date/time (ISO 8601). */
  startsAt: string;

  /** End date/time (ISO 8601). */
  endsAt: string;

  /** Tax codes eligible for the holiday. */
  eligibleTaxCodes: string[];

  /** Maximum item price eligible (null = no limit). */
  maxItemPrice?: string;

  /** Rate override during holiday (usually '0'). */
  holidayRate: string;

  /** Whether this holiday is currently active. */
  isActive: boolean;
}
```

### NexusRecord

Tracks where a tenant has established tax nexus (obligation to collect).

```typescript
/**
 * Nexus record indicating a tax collection obligation in a jurisdiction.
 */
interface NexusRecord {
  /** Unique record identifier. */
  nexusId: string;

  /** Tenant this nexus belongs to. */
  tenantId: string;

  /** Jurisdiction code (e.g., 'US-CA', 'CA-ON', 'EU-DE'). */
  jurisdictionCode: string;

  /** Country code. */
  country: string;

  /** State/province/region code (if applicable). */
  region?: string;

  /** Type of nexus established. */
  nexusType: 'physical' | 'economic' | 'affiliate' | 'click_through' | 'marketplace' | 'voluntary';

  /** Date nexus was established (ISO 8601). */
  establishedDate: string;

  /** Date nexus ended (null = still active). */
  endDate?: string;

  /** Whether the tenant is registered to collect in this jurisdiction. */
  isRegistered: boolean;

  /** Tax registration number for this jurisdiction. */
  registrationNumber?: string;

  /** Registration effective date. */
  registrationDate?: string;

  /** Filing frequency for this jurisdiction. */
  filingFrequency?: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

  /** Economic nexus tracking (for economic nexus type). */
  economicNexusData?: EconomicNexusData;

  /** Notes. */
  notes?: string;

  /** Record timestamps. */
  createdAt: string;
  updatedAt: string;
}

/**
 * Economic nexus tracking data for a specific jurisdiction.
 */
interface EconomicNexusData {
  /** Revenue threshold for nexus in this jurisdiction. */
  revenueThreshold: string;

  /** Transaction count threshold (null = revenue-only state). */
  transactionThreshold?: number;

  /** Current-period revenue in this jurisdiction. */
  currentRevenue: string;

  /** Current-period transaction count. */
  currentTransactions: number;

  /** Period for threshold evaluation. */
  evaluationPeriod: 'calendar_year' | 'trailing_12_months' | 'previous_calendar_year';

  /** Whether the threshold has been exceeded. */
  thresholdExceeded: boolean;

  /** Date threshold was exceeded. */
  thresholdExceededDate?: string;

  /** Last evaluation timestamp. */
  lastEvaluatedAt: string;
}
```

### ExemptionCertificate

Manages tax exemption certificates for customers.

```typescript
/**
 * Tax exemption certificate.
 */
interface ExemptionCertificate {
  /** Unique certificate identifier. */
  certificateId: string;

  /** Tenant this certificate belongs to. */
  tenantId: string;

  /** Customer this certificate is issued by. */
  customerId: string;

  /** Certificate type. */
  certificateType:
    | 'resale'
    | 'government'
    | 'nonprofit'
    | 'agricultural'
    | 'manufacturing'
    | 'direct_pay'
    | 'foreign_diplomat'
    | 'tribal'
    | 'other';

  /** Jurisdictions this certificate is valid in. */
  jurisdictions: string[];

  /** Certificate/permit number. */
  certificateNumber: string;

  /** Issuing authority. */
  issuingAuthority?: string;

  /** Effective date. */
  effectiveDate: string;

  /** Expiration date (null = no expiration). */
  expirationDate?: string;

  /** Current status. */
  status: 'pending_review' | 'active' | 'expired' | 'revoked' | 'rejected';

  /** Product tax codes this exemption applies to (empty = all products). */
  applicableTaxCodes: string[];

  /** Exempt percentage (100 = fully exempt, 50 = half exempt). */
  exemptPercentage: number;

  /** File storage reference for the certificate document. */
  documentUrl?: string;

  /** Document MIME type. */
  documentMimeType?: string;

  /** Validation details. */
  validation?: CertificateValidation;

  /** Reason for exemption (displayed on invoices). */
  exemptionReason: string;

  /** Record timestamps. */
  createdAt: string;
  updatedAt: string;
}

/**
 * Certificate validation result.
 */
interface CertificateValidation {
  /** Whether the certificate has been validated. */
  validated: boolean;

  /** Validation method. */
  method: 'manual' | 'automated' | 'provider';

  /** Validated by (user ID or system). */
  validatedBy: string;

  /** Validation date. */
  validatedAt: string;

  /** Validation notes. */
  notes?: string;
}
```

### TaxReturn

Represents aggregated tax data for a filing period.

```typescript
/**
 * Tax return data for a filing period and jurisdiction.
 */
interface TaxReturn {
  /** Unique return identifier. */
  returnId: string;

  /** Tenant. */
  tenantId: string;

  /** Jurisdiction this return covers. */
  jurisdictionCode: string;

  /** Return type. */
  returnType: 'sales_tax' | 'vat' | 'gst' | 'hst' | 'ec_sales_list';

  /** Filing period start (ISO 8601). */
  periodStart: string;

  /** Filing period end (ISO 8601). */
  periodEnd: string;

  /** Filing frequency. */
  frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

  /** Filing deadline. */
  filingDeadline: string;

  /** Return status. */
  status: 'draft' | 'ready' | 'filed' | 'amended' | 'overdue';

  /** Aggregated amounts. */
  amounts: TaxReturnAmounts;

  /** Transaction count in this return. */
  transactionCount: number;

  /** Adjustment count. */
  adjustmentCount: number;

  /** Filing reference number (after submission). */
  filingReferenceNumber?: string;

  /** Date filed. */
  filedAt?: string;

  /** Filed by (user ID). */
  filedBy?: string;

  /** Payment reference. */
  paymentReference?: string;

  /** Payment date. */
  paidAt?: string;

  /** Notes. */
  notes?: string;

  /** Record timestamps. */
  createdAt: string;
  updatedAt: string;
}

/**
 * Aggregated amounts for a tax return.
 */
interface TaxReturnAmounts {
  /** Total gross sales. */
  grossSales: string;

  /** Non-taxable sales. */
  nonTaxableSales: string;

  /** Exempt sales. */
  exemptSales: string;

  /** Taxable sales. */
  taxableSales: string;

  /** Total tax collected. */
  taxCollected: string;

  /** Tax adjustments (positive or negative). */
  adjustments: string;

  /** Tax credits applied. */
  credits: string;

  /** Net tax due. */
  netTaxDue: string;

  /** Penalty (if late). */
  penalty: string;

  /** Interest (if late). */
  interest: string;

  /** Total amount due (netTaxDue + penalty + interest). */
  totalDue: string;
}

/**
 * Tax liability summary across all jurisdictions.
 */
interface TaxLiabilitySummary {
  /** Period this summary covers. */
  periodStart: string;
  periodEnd: string;

  /** Breakdown by jurisdiction. */
  jurisdictions: JurisdictionLiability[];

  /** Grand totals. */
  totals: {
    grossSales: string;
    taxableSales: string;
    taxCollected: string;
    netTaxDue: string;
  };
}

/**
 * Tax liability for a single jurisdiction.
 */
interface JurisdictionLiability {
  jurisdictionCode: string;
  jurisdictionName: string;
  taxType: string;
  grossSales: string;
  exemptSales: string;
  taxableSales: string;
  taxCollected: string;
  adjustments: string;
  netTaxDue: string;
  filingDeadline: string;
  filingStatus: 'upcoming' | 'due' | 'overdue' | 'filed';
}
```

### VATValidator

Validates VAT registration numbers in real time.

```typescript
/**
 * VAT number validation service.
 */
interface VATValidator {
  /**
   * Validate a VAT number via VIES or local registry.
   * Returns detailed validation result including business name.
   */
  validate(vatNumber: string, countryCode: string): Promise<VATValidationResult>;

  /**
   * Batch validate multiple VAT numbers.
   */
  validateBatch(
    entries: Array<{ vatNumber: string; countryCode: string }>,
  ): Promise<VATValidationResult[]>;

  /**
   * Check if VIES service is available.
   */
  isServiceAvailable(): Promise<boolean>;
}

/**
 * Result of VAT number validation.
 */
interface VATValidationResult {
  /** The VAT number that was validated. */
  vatNumber: string;

  /** Country code. */
  countryCode: string;

  /** Whether the VAT number is valid. */
  valid: boolean;

  /** Business name associated with the VAT number. */
  businessName?: string;

  /** Business address associated with the VAT number. */
  businessAddress?: string;

  /** Validation source. */
  source: 'vies' | 'hmrc' | 'ato' | 'cache' | 'manual';

  /** Request ID from the validation service. */
  requestId?: string;

  /** Timestamp of validation. */
  validatedAt: string;

  /** Cache expiry (validations are cached for 24h). */
  cacheExpiresAt?: string;

  /** Error details if validation failed. */
  error?: {
    code: string;
    message: string;
  };
}

/**
 * VAT registration record for a tenant in a specific country.
 */
interface VATRegistration {
  /** Registration ID. */
  registrationId: string;

  /** Tenant. */
  tenantId: string;

  /** Country of registration. */
  country: string;

  /** VAT registration number. */
  vatNumber: string;

  /** Registration effective date. */
  effectiveDate: string;

  /** Registration end date (null = active). */
  endDate?: string;

  /** Whether this is a MOSS/OSS registration. */
  isMossOss: boolean;

  /** Filing frequency in this country. */
  filingFrequency: 'monthly' | 'quarterly' | 'annual';

  /** Registration status. */
  status: 'active' | 'pending' | 'suspended' | 'deregistered';

  /** Threshold for distance selling (EUR). */
  distanceSellingThreshold?: string;

  /** Current distance selling revenue. */
  currentDistanceSellingRevenue?: string;

  /** Record timestamps. */
  createdAt: string;
  updatedAt: string;
}
```

### TaxCode

Product tax classification code that determines taxability.

```typescript
/**
 * Product tax code — determines how a product is taxed.
 */
interface TaxCode {
  /** Internal tax code identifier. */
  taxCodeId: string;

  /** Tax code (e.g., 'PC040100' for clothing, 'SW054000' for SaaS). */
  code: string;

  /** Human-readable description. */
  description: string;

  /** Category grouping. */
  category: 'physical_goods' | 'digital_goods' | 'services' | 'software' | 'food' | 'clothing' | 'medical' | 'other';

  /** Provider-specific code mappings. */
  providerMappings: {
    avalara?: string;
    taxjar?: string;
    vertex?: string;
  };

  /** Default taxability. */
  defaultTaxability: 'taxable' | 'exempt' | 'reduced' | 'varies_by_jurisdiction';

  /** Jurisdiction-specific overrides. */
  jurisdictionOverrides?: Array<{
    jurisdictionCode: string;
    taxability: 'taxable' | 'exempt' | 'reduced';
    rate?: string;
    notes?: string;
  }>;

  /** Whether this code applies to digital services (affects VAT/GST treatment). */
  isDigitalService: boolean;

  /** Whether this code applies to tangible personal property. */
  isTangible: boolean;

  /** Active status. */
  isActive: boolean;

  /** Record timestamps. */
  createdAt: string;
  updatedAt: string;
}
```

### TaxService

The top-level service that orchestrates all tax operations.

```typescript
/**
 * Primary tax service — the main entry point for all tax operations.
 */
interface TaxService {
  // === Calculation ===

  /**
   * Calculate tax for a transaction.
   * This is the primary method used by cart, checkout, and invoice flows.
   */
  calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult>;

  /**
   * Commit a previously-estimated transaction.
   * Called after order confirmation / payment capture.
   */
  commitTransaction(calculationId: string): Promise<void>;

  /**
   * Void a committed transaction.
   * Called on full order cancellation.
   */
  voidTransaction(calculationId: string): Promise<void>;

  /**
   * Create an adjustment (return/refund).
   * Links to the original transaction.
   */
  adjustTransaction(
    originalCalculationId: string,
    adjustments: TaxAdjustmentRequest,
  ): Promise<TaxCalculationResult>;

  // === Rates ===

  /**
   * Look up the effective tax rate for an address and product.
   */
  getEffectiveRate(
    address: TaxAddress,
    taxCode?: string,
  ): Promise<TaxRate[]>;

  /**
   * Retrieve all active tax holidays.
   */
  getActiveHolidays(jurisdictionCode?: string): Promise<TaxHoliday[]>;

  // === Nexus ===

  /**
   * Get all nexus records for the tenant.
   */
  getNexusRecords(): Promise<NexusRecord[]>;

  /**
   * Add a nexus record (manual registration).
   */
  addNexus(nexus: Omit<NexusRecord, 'nexusId' | 'createdAt' | 'updatedAt'>): Promise<NexusRecord>;

  /**
   * Remove a nexus record (deregistration).
   */
  removeNexus(nexusId: string, endDate: string): Promise<void>;

  /**
   * Evaluate current economic nexus status across all tracked jurisdictions.
   */
  evaluateEconomicNexus(): Promise<EconomicNexusData[]>;

  // === Exemptions ===

  /**
   * Upload and create an exemption certificate.
   */
  createExemptionCertificate(
    certificate: Omit<ExemptionCertificate, 'certificateId' | 'status' | 'createdAt' | 'updatedAt'>,
  ): Promise<ExemptionCertificate>;

  /**
   * Validate an exemption certificate.
   */
  validateCertificate(certificateId: string): Promise<CertificateValidation>;

  /**
   * List certificates for a customer.
   */
  getCustomerCertificates(customerId: string): Promise<ExemptionCertificate[]>;

  /**
   * Revoke a certificate.
   */
  revokeCertificate(certificateId: string, reason: string): Promise<void>;

  // === VAT ===

  /**
   * Validate a VAT number.
   */
  validateVAT(vatNumber: string, countryCode: string): Promise<VATValidationResult>;

  /**
   * Get all VAT registrations for the tenant.
   */
  getVATRegistrations(): Promise<VATRegistration[]>;

  /**
   * Add a VAT registration.
   */
  addVATRegistration(
    registration: Omit<VATRegistration, 'registrationId' | 'createdAt' | 'updatedAt'>,
  ): Promise<VATRegistration>;

  // === Reporting ===

  /**
   * Generate tax return data for a jurisdiction and period.
   */
  generateReturn(
    jurisdictionCode: string,
    periodStart: string,
    periodEnd: string,
  ): Promise<TaxReturn>;

  /**
   * Get tax liability summary across all jurisdictions.
   */
  getLiabilitySummary(
    periodStart: string,
    periodEnd: string,
  ): Promise<TaxLiabilitySummary>;

  /**
   * Get the filing calendar (upcoming deadlines).
   */
  getFilingCalendar(): Promise<FilingObligation[]>;

  // === Audit ===

  /**
   * Get the full audit trail for a calculation.
   */
  getAuditTrail(calculationId: string): Promise<TaxAuditEntry[]>;

  /**
   * Export audit data for a date range.
   */
  exportAuditData(
    startDate: string,
    endDate: string,
    format: 'csv' | 'json' | 'xlsx',
  ): Promise<Buffer>;
}

/**
 * Filing obligation — a deadline for a specific jurisdiction.
 */
interface FilingObligation {
  /** Obligation ID. */
  obligationId: string;

  /** Jurisdiction code. */
  jurisdictionCode: string;

  /** Jurisdiction name. */
  jurisdictionName: string;

  /** Return type. */
  returnType: 'sales_tax' | 'vat' | 'gst' | 'hst' | 'ec_sales_list';

  /** Filing frequency. */
  frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

  /** Period start. */
  periodStart: string;

  /** Period end. */
  periodEnd: string;

  /** Filing deadline. */
  deadline: string;

  /** Status. */
  status: 'upcoming' | 'due_soon' | 'overdue' | 'filed';

  /** Estimated tax due. */
  estimatedTaxDue: string;

  /** Associated return ID (if generated). */
  returnId?: string;

  /** Days until deadline. */
  daysUntilDeadline: number;
}
```

---

## Database Schemas

All tables use multi-tenant RLS (Row-Level Security) with `tenant_id` as the partition key. Monetary amounts are stored as `numeric(19,4)` to avoid floating-point rounding errors. All timestamps are `timestamptz`.

### tax_calculations

Stores every tax calculation performed, whether estimated or committed. This is the primary audit table.

```typescript
import { pgTable, uuid, text, numeric, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const taxCalculations = pgTable('tax_calculations', {
  // === Identity ===
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  calculationId: text('calculation_id').notNull(), // idempotency key

  // === Transaction Info ===
  documentType: text('document_type').notNull(), // 'sale' | 'return' | 'exchange' | 'invoice' | 'credit_memo'
  orderId: uuid('order_id'),
  invoiceId: uuid('invoice_id'),
  customerId: uuid('customer_id').notNull(),
  currencyCode: text('currency_code').notNull().default('USD'),

  // === Addresses (JSONB for flexibility across jurisdictions) ===
  shipFrom: jsonb('ship_from').notNull().$type<TaxAddress>(),
  shipTo: jsonb('ship_to').notNull().$type<TaxAddress>(),

  // === Tax Settings ===
  taxIncluded: boolean('tax_included').notNull().default(false),
  taxDate: timestamp('tax_date', { withTimezone: true }).notNull(),

  // === Amounts ===
  subtotal: numeric('subtotal', { precision: 19, scale: 4 }).notNull(),
  totalTax: numeric('total_tax', { precision: 19, scale: 4 }).notNull(),
  totalExempt: numeric('total_exempt', { precision: 19, scale: 4 }).notNull().default('0'),
  totalDiscount: numeric('total_discount', { precision: 19, scale: 4 }).notNull().default('0'),
  total: numeric('total', { precision: 19, scale: 4 }).notNull(),
  effectiveRate: numeric('effective_rate', { precision: 8, scale: 6 }).notNull(),

  // === Provider ===
  provider: text('provider').notNull(), // 'avalara' | 'taxjar' | 'vertex' | 'builtin'
  providerTransactionId: text('provider_transaction_id'),
  providerResponse: jsonb('provider_response'), // raw provider response for debugging

  // === Status ===
  status: text('status').notNull().default('estimated'), // 'estimated' | 'committed' | 'voided' | 'adjusted'
  committed: boolean('committed').notNull().default(false),
  committedAt: timestamp('committed_at', { withTimezone: true }),
  voidedAt: timestamp('voided_at', { withTimezone: true }),

  // === Line Items (denormalized JSONB for query performance) ===
  lineItems: jsonb('line_items').notNull().$type<TaxLineItemResult[]>(),

  // === Jurisdiction Breakdown ===
  jurisdictionBreakdown: jsonb('jurisdiction_breakdown').notNull().$type<JurisdictionBreakdown[]>(),

  // === Warnings ===
  warnings: jsonb('warnings').$type<TaxWarning[]>(),

  // === Calculation Metadata ===
  calculationTimeMs: numeric('calculation_time_ms'),
  fallbackUsed: boolean('fallback_used').notNull().default(false),
  cacheHit: boolean('cache_hit').notNull().default(false),

  // === Original Transaction (for adjustments) ===
  originalCalculationId: uuid('original_calculation_id'),

  // === Metadata ===
  metadata: jsonb('metadata'),

  // === Timestamps ===
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('tax_calc_tenant_idx').on(table.tenantId),
  calcIdIdx: index('tax_calc_calc_id_idx').on(table.tenantId, table.calculationId).unique(),
  orderIdx: index('tax_calc_order_idx').on(table.tenantId, table.orderId),
  invoiceIdx: index('tax_calc_invoice_idx').on(table.tenantId, table.invoiceId),
  customerIdx: index('tax_calc_customer_idx').on(table.tenantId, table.customerId),
  statusIdx: index('tax_calc_status_idx').on(table.tenantId, table.status),
  dateIdx: index('tax_calc_date_idx').on(table.tenantId, table.taxDate),
  providerTxnIdx: index('tax_calc_provider_txn_idx').on(table.provider, table.providerTransactionId),
}));
```

### tax_rates

Master rate table with historical rates (effective date ranges).

```typescript
export const taxRates = pgTable('tax_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'), // null for global/system rates

  // === Jurisdiction ===
  jurisdictionCode: text('jurisdiction_code').notNull(), // e.g., 'US-CA', 'US-CA-LOS_ANGELES-DISTRICT1'
  jurisdictionName: text('jurisdiction_name').notNull(),
  jurisdictionType: text('jurisdiction_type').notNull(), // 'country' | 'state' | 'county' | 'city' | 'district' | 'special'
  country: text('country').notNull(), // ISO 3166-1 alpha-2
  region: text('region'), // state/province code

  // === Rate ===
  taxType: text('tax_type').notNull(), // 'sales_tax' | 'use_tax' | 'vat' | 'gst' | 'hst' | 'pst' | 'qst' | 'excise'
  rate: numeric('rate', { precision: 8, scale: 6 }).notNull(), // decimal, e.g., 0.082500
  rateCategory: text('rate_category').notNull().default('standard'), // 'standard' | 'reduced' | 'super_reduced' | 'zero' | 'exempt' | 'parking'
  displayName: text('display_name').notNull(), // e.g., "California State Tax"

  // === Product Scope ===
  taxCode: text('tax_code'), // null = default rate for jurisdiction

  // === Effective Period ===
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }), // null = currently active

  // === Compound ===
  isCompound: boolean('is_compound').notNull().default(false),

  // === Source ===
  source: text('source').notNull().default('builtin'), // 'provider' | 'manual' | 'government' | 'builtin'

  // === Timestamps ===
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  jurisdictionIdx: index('tax_rates_jurisdiction_idx').on(table.jurisdictionCode, table.taxType),
  effectiveIdx: index('tax_rates_effective_idx').on(table.jurisdictionCode, table.effectiveFrom, table.effectiveTo),
  taxCodeIdx: index('tax_rates_tax_code_idx').on(table.jurisdictionCode, table.taxCode),
  countryIdx: index('tax_rates_country_idx').on(table.country, table.region),
  tenantIdx: index('tax_rates_tenant_idx').on(table.tenantId),
}));
```

### nexus_records

Tracks where each tenant has established tax collection obligations.

```typescript
export const nexusRecords = pgTable('nexus_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // === Jurisdiction ===
  jurisdictionCode: text('jurisdiction_code').notNull(),
  country: text('country').notNull(),
  region: text('region'),

  // === Nexus Type ===
  nexusType: text('nexus_type').notNull(), // 'physical' | 'economic' | 'affiliate' | 'click_through' | 'marketplace' | 'voluntary'
  establishedDate: timestamp('established_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),

  // === Registration ===
  isRegistered: boolean('is_registered').notNull().default(false),
  registrationNumber: text('registration_number'),
  registrationDate: timestamp('registration_date', { withTimezone: true }),

  // === Filing ===
  filingFrequency: text('filing_frequency'), // 'monthly' | 'quarterly' | 'semi_annual' | 'annual'

  // === Economic Nexus Tracking ===
  revenueThreshold: numeric('revenue_threshold', { precision: 19, scale: 4 }),
  transactionThreshold: numeric('transaction_threshold'),
  currentRevenue: numeric('current_revenue', { precision: 19, scale: 4 }).default('0'),
  currentTransactions: numeric('current_transactions').default('0'),
  evaluationPeriod: text('evaluation_period'), // 'calendar_year' | 'trailing_12_months' | 'previous_calendar_year'
  thresholdExceeded: boolean('threshold_exceeded').default(false),
  thresholdExceededDate: timestamp('threshold_exceeded_date', { withTimezone: true }),
  lastEvaluatedAt: timestamp('last_evaluated_at', { withTimezone: true }),

  // === Notes ===
  notes: text('notes'),

  // === Timestamps ===
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('nexus_tenant_idx').on(table.tenantId),
  jurisdictionIdx: index('nexus_jurisdiction_idx').on(table.tenantId, table.jurisdictionCode),
  typeIdx: index('nexus_type_idx').on(table.tenantId, table.nexusType),
  activeIdx: index('nexus_active_idx').on(table.tenantId, table.endDate),
}));
```

### exemption_certificates

Stores customer tax exemption certificates with document references.

```typescript
export const exemptionCertificates = pgTable('exemption_certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  customerId: uuid('customer_id').notNull(),

  // === Certificate Details ===
  certificateType: text('certificate_type').notNull(), // 'resale' | 'government' | 'nonprofit' | etc.
  certificateNumber: text('certificate_number').notNull(),
  issuingAuthority: text('issuing_authority'),
  jurisdictions: jsonb('jurisdictions').notNull().$type<string[]>(), // array of jurisdiction codes
  exemptionReason: text('exemption_reason').notNull(),

  // === Validity ===
  effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  status: text('status').notNull().default('pending_review'), // 'pending_review' | 'active' | 'expired' | 'revoked' | 'rejected'

  // === Scope ===
  applicableTaxCodes: jsonb('applicable_tax_codes').$type<string[]>().default([]),
  exemptPercentage: numeric('exempt_percentage', { precision: 5, scale: 2 }).notNull().default('100'),

  // === Document ===
  documentUrl: text('document_url'),
  documentMimeType: text('document_mime_type'),
  documentHash: text('document_hash'), // SHA-256 for integrity verification

  // === Validation ===
  validatedBy: uuid('validated_by'),
  validatedAt: timestamp('validated_at', { withTimezone: true }),
  validationMethod: text('validation_method'), // 'manual' | 'automated' | 'provider'
  validationNotes: text('validation_notes'),

  // === Timestamps ===
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('exempt_cert_tenant_idx').on(table.tenantId),
  customerIdx: index('exempt_cert_customer_idx').on(table.tenantId, table.customerId),
  statusIdx: index('exempt_cert_status_idx').on(table.tenantId, table.status),
  certNumIdx: index('exempt_cert_num_idx').on(table.tenantId, table.certificateNumber),
  expirationIdx: index('exempt_cert_expiration_idx').on(table.tenantId, table.expirationDate),
}));
```

### tax_returns

Aggregated tax return data per jurisdiction per filing period.

```typescript
export const taxReturns = pgTable('tax_returns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // === Return Info ===
  jurisdictionCode: text('jurisdiction_code').notNull(),
  returnType: text('return_type').notNull(), // 'sales_tax' | 'vat' | 'gst' | 'hst' | 'ec_sales_list'
  frequency: text('frequency').notNull(), // 'monthly' | 'quarterly' | 'semi_annual' | 'annual'

  // === Period ===
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  filingDeadline: timestamp('filing_deadline', { withTimezone: true }).notNull(),

  // === Status ===
  status: text('status').notNull().default('draft'), // 'draft' | 'ready' | 'filed' | 'amended' | 'overdue'

  // === Amounts ===
  grossSales: numeric('gross_sales', { precision: 19, scale: 4 }).notNull().default('0'),
  nonTaxableSales: numeric('non_taxable_sales', { precision: 19, scale: 4 }).notNull().default('0'),
  exemptSales: numeric('exempt_sales', { precision: 19, scale: 4 }).notNull().default('0'),
  taxableSales: numeric('taxable_sales', { precision: 19, scale: 4 }).notNull().default('0'),
  taxCollected: numeric('tax_collected', { precision: 19, scale: 4 }).notNull().default('0'),
  adjustments: numeric('adjustments', { precision: 19, scale: 4 }).notNull().default('0'),
  credits: numeric('credits', { precision: 19, scale: 4 }).notNull().default('0'),
  netTaxDue: numeric('net_tax_due', { precision: 19, scale: 4 }).notNull().default('0'),
  penalty: numeric('penalty', { precision: 19, scale: 4 }).notNull().default('0'),
  interest: numeric('interest', { precision: 19, scale: 4 }).notNull().default('0'),
  totalDue: numeric('total_due', { precision: 19, scale: 4 }).notNull().default('0'),

  // === Transaction Count ===
  transactionCount: numeric('transaction_count').notNull().default('0'),
  adjustmentCount: numeric('adjustment_count').notNull().default('0'),

  // === Filing ===
  filingReferenceNumber: text('filing_reference_number'),
  filedAt: timestamp('filed_at', { withTimezone: true }),
  filedBy: uuid('filed_by'),
  paymentReference: text('payment_reference'),
  paidAt: timestamp('paid_at', { withTimezone: true }),

  // === Notes ===
  notes: text('notes'),

  // === Timestamps ===
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('tax_returns_tenant_idx').on(table.tenantId),
  jurisdictionIdx: index('tax_returns_jurisdiction_idx').on(table.tenantId, table.jurisdictionCode),
  periodIdx: index('tax_returns_period_idx').on(table.tenantId, table.periodStart, table.periodEnd),
  statusIdx: index('tax_returns_status_idx').on(table.tenantId, table.status),
  deadlineIdx: index('tax_returns_deadline_idx').on(table.tenantId, table.filingDeadline),
}));
```

### tax_codes

Product tax code registry mapping internal codes to provider-specific taxonomies.

```typescript
export const taxCodes = pgTable('tax_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'), // null for system-wide codes

  // === Code ===
  code: text('code').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // 'physical_goods' | 'digital_goods' | 'services' | 'software' | 'food' | 'clothing' | 'medical' | 'other'

  // === Provider Mappings ===
  avalaraCode: text('avalara_code'),
  taxjarCode: text('taxjar_code'),
  vertexCode: text('vertex_code'),

  // === Classification ===
  defaultTaxability: text('default_taxability').notNull().default('taxable'), // 'taxable' | 'exempt' | 'reduced' | 'varies_by_jurisdiction'
  isDigitalService: boolean('is_digital_service').notNull().default(false),
  isTangible: boolean('is_tangible').notNull().default(true),

  // === Jurisdiction Overrides ===
  jurisdictionOverrides: jsonb('jurisdiction_overrides').$type<Array<{
    jurisdictionCode: string;
    taxability: string;
    rate?: string;
    notes?: string;
  }>>(),

  // === Status ===
  isActive: boolean('is_active').notNull().default(true),

  // === Timestamps ===
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  codeIdx: index('tax_codes_code_idx').on(table.code),
  tenantCodeIdx: index('tax_codes_tenant_code_idx').on(table.tenantId, table.code).unique(),
  categoryIdx: index('tax_codes_category_idx').on(table.category),
}));
```

### tax_provider_configs

Tenant-specific tax provider configuration and credentials.

```typescript
export const taxProviderConfigs = pgTable('tax_provider_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // === Provider ===
  provider: text('provider').notNull(), // 'avalara' | 'taxjar' | 'vertex'
  priority: numeric('priority').notNull().default('1'), // lower = higher priority in fallback chain

  // === Credentials (encrypted at rest via Supabase vault) ===
  accountId: text('account_id'), // provider account/company ID
  licenseKey: text('license_key'), // encrypted
  apiUrl: text('api_url'), // provider API endpoint
  apiVersion: text('api_version'),

  // === Configuration ===
  environment: text('environment').notNull().default('sandbox'), // 'sandbox' | 'production'
  companyCode: text('company_code'), // Avalara-specific
  defaultTaxCode: text('default_tax_code'),

  // === Settings ===
  isEnabled: boolean('is_enabled').notNull().default(true),
  addressValidationEnabled: boolean('address_validation_enabled').notNull().default(true),
  commitOnCalculation: boolean('commit_on_calculation').notNull().default(false),
  timeoutMs: numeric('timeout_ms').default('5000'),

  // === Health ===
  lastHealthCheck: timestamp('last_health_check', { withTimezone: true }),
  healthStatus: text('health_status').default('unknown'), // 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  consecutiveFailures: numeric('consecutive_failures').default('0'),

  // === Timestamps ===
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('tax_provider_configs_tenant_idx').on(table.tenantId),
  providerIdx: index('tax_provider_configs_provider_idx').on(table.tenantId, table.provider).unique(),
  priorityIdx: index('tax_provider_configs_priority_idx').on(table.tenantId, table.priority),
}));
```

### vat_registrations

Tracks where a tenant is VAT-registered.

```typescript
export const vatRegistrations = pgTable('vat_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // === Registration ===
  country: text('country').notNull(), // ISO 3166-1 alpha-2
  vatNumber: text('vat_number').notNull(),
  effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  status: text('status').notNull().default('active'), // 'active' | 'pending' | 'suspended' | 'deregistered'

  // === MOSS/OSS ===
  isMossOss: boolean('is_moss_oss').notNull().default(false),

  // === Filing ===
  filingFrequency: text('filing_frequency').notNull().default('quarterly'),

  // === Distance Selling ===
  distanceSellingThreshold: numeric('distance_selling_threshold', { precision: 19, scale: 4 }),
  currentDistanceSellingRevenue: numeric('current_distance_selling_revenue', { precision: 19, scale: 4 }).default('0'),

  // === Validation ===
  lastValidatedAt: timestamp('last_validated_at', { withTimezone: true }),
  validationStatus: text('validation_status'), // 'valid' | 'invalid' | 'pending' | 'error'

  // === Timestamps ===
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('vat_reg_tenant_idx').on(table.tenantId),
  countryIdx: index('vat_reg_country_idx').on(table.tenantId, table.country).unique(),
  vatNumIdx: index('vat_reg_vat_num_idx').on(table.vatNumber),
  statusIdx: index('vat_reg_status_idx').on(table.tenantId, table.status),
}));
```

### tax_audit_log

Immutable audit log for all tax-related events.

```typescript
export const taxAuditLog = pgTable('tax_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // === Event ===
  eventType: text('event_type').notNull(),
  // 'calculation_created' | 'calculation_committed' | 'calculation_voided' |
  // 'calculation_adjusted' | 'exemption_applied' | 'exemption_created' |
  // 'exemption_revoked' | 'nexus_established' | 'nexus_removed' |
  // 'vat_validated' | 'provider_fallback' | 'rate_changed' |
  // 'return_generated' | 'return_filed' | 'config_changed'

  // === References ===
  calculationId: uuid('calculation_id'),
  orderId: uuid('order_id'),
  customerId: uuid('customer_id'),
  certificateId: uuid('certificate_id'),
  nexusId: uuid('nexus_id'),
  returnId: uuid('return_id'),

  // === Event Data ===
  eventData: jsonb('event_data').notNull(), // full event payload

  // === Actor ===
  actorType: text('actor_type').notNull(), // 'system' | 'user' | 'api' | 'provider'
  actorId: text('actor_id'), // user ID or system identifier
  ipAddress: text('ip_address'),

  // === Provider Trace ===
  provider: text('provider'),
  providerRequestId: text('provider_request_id'),
  providerResponseTimeMs: numeric('provider_response_time_ms'),

  // === Timestamp (immutable — no updatedAt) ===
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('tax_audit_tenant_idx').on(table.tenantId),
  eventTypeIdx: index('tax_audit_event_type_idx').on(table.tenantId, table.eventType),
  calculationIdx: index('tax_audit_calculation_idx').on(table.tenantId, table.calculationId),
  orderIdx: index('tax_audit_order_idx').on(table.tenantId, table.orderId),
  dateIdx: index('tax_audit_date_idx').on(table.tenantId, table.createdAt),
  actorIdx: index('tax_audit_actor_idx').on(table.actorType, table.actorId),
}));
```

### tax_filing_calendar

Pre-generated filing deadlines for each jurisdiction the tenant operates in.

```typescript
export const taxFilingCalendar = pgTable('tax_filing_calendar', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),

  // === Jurisdiction ===
  jurisdictionCode: text('jurisdiction_code').notNull(),
  jurisdictionName: text('jurisdiction_name').notNull(),

  // === Filing Info ===
  returnType: text('return_type').notNull(), // 'sales_tax' | 'vat' | 'gst' | 'hst' | 'ec_sales_list'
  frequency: text('frequency').notNull(), // 'monthly' | 'quarterly' | 'semi_annual' | 'annual'

  // === Period ===
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  filingDeadline: timestamp('filing_deadline', { withTimezone: true }).notNull(),

  // === Status ===
  status: text('status').notNull().default('upcoming'), // 'upcoming' | 'due_soon' | 'overdue' | 'filed'

  // === Estimated Amount ===
  estimatedTaxDue: numeric('estimated_tax_due', { precision: 19, scale: 4 }),

  // === Associated Return ===
  returnId: uuid('return_id'),

  // === Notifications ===
  reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),
  overdueSentAt: timestamp('overdue_sent_at', { withTimezone: true }),

  // === Timestamps ===
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('tax_filing_cal_tenant_idx').on(table.tenantId),
  deadlineIdx: index('tax_filing_cal_deadline_idx').on(table.tenantId, table.filingDeadline),
  statusIdx: index('tax_filing_cal_status_idx').on(table.tenantId, table.status),
  jurisdictionIdx: index('tax_filing_cal_jurisdiction_idx').on(table.tenantId, table.jurisdictionCode),
  periodIdx: index('tax_filing_cal_period_idx').on(table.tenantId, table.periodStart, table.periodEnd),
}));
```

### Row-Level Security (RLS) Policies

All tables enforce tenant isolation via RLS:

```sql
-- Example RLS policy (applied to all tax tables)
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY tax_calculations_tenant_isolation ON tax_calculations
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tax_calculations_insert ON tax_calculations
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- tax_rates allows null tenant_id for system-wide rates
CREATE POLICY tax_rates_access ON tax_rates
  USING (
    tenant_id IS NULL
    OR tenant_id = current_setting('app.current_tenant_id')::uuid
  );

-- tax_audit_log is append-only: no UPDATE or DELETE policies
CREATE POLICY tax_audit_log_insert ON tax_audit_log
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tax_audit_log_select ON tax_audit_log
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## Code Examples

### Example 1: Calculate Tax at Checkout

The most common operation — calculate tax for a customer's cart at checkout time.

```typescript
import { TaxService } from '@mcv/commerce/tax';

// Inject via DI container
const taxService = container.resolve(TaxService);

// Calculate tax for a US domestic order
const result = await taxService.calculateTax({
  calculationId: `calc_${orderId}_${Date.now()}`,
  tenantId: ctx.tenantId,
  documentType: 'sale',
  currencyCode: 'USD',
  taxIncluded: false,
  customer: {
    customerId: customer.id,
    customerType: 'individual',
  },
  shipFrom: {
    line1: '123 Warehouse Blvd',
    city: 'Austin',
    region: 'TX',
    postalCode: '78701',
    country: 'US',
  },
  shipTo: {
    line1: customer.address.line1,
    city: customer.address.city,
    region: customer.address.state,
    postalCode: customer.address.zip,
    country: 'US',
  },
  lineItems: cart.items.map((item) => ({
    lineId: item.id,
    taxCode: item.product.taxCode ?? 'P0000000', // general tangible property
    quantity: item.quantity,
    unitPrice: item.unitPrice.toString(),
    discountAmount: item.discount?.toString(),
    description: item.product.name,
  })),
  commit: false, // estimate only — commit after payment
});

console.log(`Subtotal: $${result.summary.subtotal}`);
console.log(`Tax:      $${result.summary.totalTax}`);
console.log(`Total:    $${result.summary.total}`);
console.log(`Rate:     ${(parseFloat(result.summary.effectiveRate) * 100).toFixed(2)}%`);
console.log(`Provider: ${result.provider}`);

// Display jurisdiction breakdown to customer
for (const j of result.jurisdictionSummary) {
  console.log(`  ${j.jurisdictionName} (${j.taxType}): ${(parseFloat(j.rate) * 100).toFixed(2)}% = $${j.taxAmount}`);
}
// Output:
//   Texas State Tax (sales_tax): 6.25% = $12.50
//   Austin City Tax (sales_tax): 1.00% = $2.00
//   Travis County MTA (sales_tax): 1.00% = $2.00
```

### Example 2: Commit Transaction After Payment

After payment is captured, commit the tax calculation so it counts toward filing.

```typescript
import { TaxService } from '@mcv/commerce/tax';

const taxService = container.resolve(TaxService);

// After successful payment capture
try {
  await taxService.commitTransaction(order.taxCalculationId);

  console.log(`Tax committed for order ${order.id}`);
} catch (error) {
  if (error.code === 'TAX_ALREADY_COMMITTED') {
    // Idempotent — safe to ignore
    console.log('Transaction already committed');
  } else {
    // Log but don't fail the order — tax commitment can be retried
    console.error('Tax commit failed, will retry:', error.message);
    await taxRetryQueue.enqueue({
      action: 'commit',
      calculationId: order.taxCalculationId,
      retryCount: 0,
    });
  }
}
```

### Example 3: Handle Tax-Inclusive Pricing (EU VAT)

For EU customers where displayed prices include VAT.

```typescript
import { TaxService } from '@mcv/commerce/tax';

const taxService = container.resolve(TaxService);

// EU order — prices include VAT
const result = await taxService.calculateTax({
  calculationId: `calc_eu_${orderId}`,
  tenantId: ctx.tenantId,
  documentType: 'sale',
  currencyCode: 'EUR',
  taxIncluded: true, // prices already include VAT
  customer: {
    customerId: customer.id,
    customerType: 'individual', // B2C
  },
  shipFrom: {
    city: 'Dublin',
    region: 'D',
    postalCode: 'D02',
    country: 'IE',
  },
  shipTo: {
    city: 'Berlin',
    region: 'BE',
    postalCode: '10115',
    country: 'DE',
  },
  lineItems: [
    {
      lineId: 'item_1',
      taxCode: 'SW054000', // SaaS subscription
      quantity: 1,
      unitPrice: '119.00', // €119 including 19% German VAT
      description: 'Pro Plan — Monthly',
    },
  ],
  commit: true,
});

// Back-calculated breakdown:
// Net price: €100.00
// German VAT (19%): €19.00
// Total (displayed): €119.00
console.log(`Net: €${result.lineItems[0].taxableAmount}`);    // "100.0000"
console.log(`VAT: €${result.lineItems[0].taxAmount}`);        // "19.0000"
console.log(`Type: ${result.jurisdictionSummary[0].taxType}`); // "vat"
```

### Example 4: B2B Reverse Charge (EU Cross-Border)

When a VAT-registered business buys from another EU country, reverse charge applies.

```typescript
import { TaxService } from '@mcv/commerce/tax';

const taxService = container.resolve(TaxService);

// First, validate the buyer's VAT number
const vatResult = await taxService.validateVAT('DE123456789', 'DE');

if (!vatResult.valid) {
  throw new Error(`Invalid VAT number: ${vatResult.error?.message}`);
}

console.log(`Validated: ${vatResult.businessName} at ${vatResult.businessAddress}`);

// Calculate tax — reverse charge should apply
const result = await taxService.calculateTax({
  calculationId: `calc_b2b_${orderId}`,
  tenantId: ctx.tenantId,
  documentType: 'sale',
  currencyCode: 'EUR',
  taxIncluded: false,
  customer: {
    customerId: customer.id,
    customerType: 'business',
    taxRegistrationNumber: 'DE123456789',
    taxRegistrationCountry: 'DE',
  },
  shipFrom: {
    city: 'Dublin',
    postalCode: 'D02',
    country: 'IE', // seller is in Ireland
  },
  shipTo: {
    city: 'Berlin',
    postalCode: '10115',
    country: 'DE', // buyer is in Germany
  },
  lineItems: [
    {
      lineId: 'consulting_1',
      taxCode: 'SV101000', // consulting services
      quantity: 10,
      unitPrice: '150.00',
      description: 'Technical consulting — 10 hours',
    },
  ],
  commit: true,
});

// Reverse charge applied: 0% VAT, buyer self-assesses
console.log(`Tax: €${result.summary.totalTax}`);        // "0.0000"
console.log(`Rate: ${result.summary.effectiveRate}`);    // "0.000000"

// Invoice should display:
// "Reverse charge: VAT to be accounted for by the recipient
//  pursuant to Article 196 of Council Directive 2006/112/EC"
for (const warning of result.warnings) {
  if (warning.code === 'REVERSE_CHARGE_APPLIED') {
    console.log(warning.message);
  }
}
```

### Example 5: Manage Exemption Certificates

Upload and apply a resale certificate for a wholesale customer.

```typescript
import { TaxService } from '@mcv/commerce/tax';

const taxService = container.resolve(TaxService);

// 1. Create the exemption certificate
const certificate = await taxService.createExemptionCertificate({
  tenantId: ctx.tenantId,
  customerId: wholesaleCustomer.id,
  certificateType: 'resale',
  certificateNumber: 'RS-2026-TX-00001234',
  issuingAuthority: 'Texas Comptroller of Public Accounts',
  jurisdictions: ['US-TX'], // valid in Texas
  effectiveDate: '2026-01-01T00:00:00Z',
  expirationDate: '2030-12-31T23:59:59Z',
  applicableTaxCodes: [], // all products
  exemptPercentage: 100,
  exemptionReason: 'Resale — Texas Tax Code §151.302',
  documentUrl: 'https://storage.mcv.one/certs/rs-2026-tx-00001234.pdf',
  documentMimeType: 'application/pdf',
});

console.log(`Certificate created: ${certificate.certificateId} (${certificate.status})`);

// 2. Validate the certificate (moves to 'active' status)
const validation = await taxService.validateCertificate(certificate.certificateId);
console.log(`Validation: ${validation.validated ? 'PASSED' : 'FAILED'}`);

// 3. Now calculate tax — exemption is automatically applied
const result = await taxService.calculateTax({
  calculationId: `calc_exempt_${orderId}`,
  tenantId: ctx.tenantId,
  documentType: 'sale',
  currencyCode: 'USD',
  taxIncluded: false,
  customer: {
    customerId: wholesaleCustomer.id,
    customerType: 'reseller',
    exemptionCertificateIds: [certificate.certificateId],
    entityUseCode: 'RESALE',
  },
  shipFrom: {
    city: 'Austin',
    region: 'TX',
    postalCode: '78701',
    country: 'US',
  },
  shipTo: {
    city: 'Houston',
    region: 'TX',
    postalCode: '77001',
    country: 'US',
  },
  lineItems: [
    {
      lineId: 'bulk_001',
      taxCode: 'P0000000',
      quantity: 500,
      unitPrice: '25.00',
      description: 'Widget — bulk wholesale',
    },
  ],
  commit: true,
});

// Fully exempt due to resale certificate
console.log(`Tax: $${result.summary.totalTax}`);       // "0.0000"
console.log(`Exempt: $${result.summary.totalExempt}`);  // "12500.0000"
console.log(`Reason: ${result.lineItems[0].exemptionReason}`);
// "Resale — Texas Tax Code §151.302"
```

### Example 6: Economic Nexus Evaluation

Check which jurisdictions the tenant has exceeded economic nexus thresholds.

```typescript
import { TaxService, NexusManager } from '@mcv/commerce/tax';

const taxService = container.resolve(TaxService);
const nexusManager = container.resolve(NexusManager);

// Evaluate economic nexus across all US states
const nexusResults = await taxService.evaluateEconomicNexus();

console.log('Economic Nexus Status:');
console.log('======================');

for (const nexus of nexusResults) {
  const revenuePercent = (
    (parseFloat(nexus.currentRevenue) / parseFloat(nexus.revenueThreshold)) * 100
  ).toFixed(1);

  const txnPercent = nexus.transactionThreshold
    ? ((nexus.currentTransactions / nexus.transactionThreshold) * 100).toFixed(1)
    : 'N/A';

  console.log(`\n${nexus.jurisdictionCode}:`);
  console.log(`  Revenue: $${nexus.currentRevenue} / $${nexus.revenueThreshold} (${revenuePercent}%)`);
  console.log(`  Transactions: ${nexus.currentTransactions} / ${nexus.transactionThreshold ?? '—'} (${txnPercent}%)`);
  console.log(`  Exceeded: ${nexus.thresholdExceeded ? '⚠️ YES' : '✅ No'}`);

  if (nexus.thresholdExceeded && !nexus.isRegistered) {
    console.log(`  ⚠️  ACTION REQUIRED: Register in ${nexus.jurisdictionCode}`);

    // Auto-create nexus record for tracking
    await nexusManager.createNexusRecord({
      tenantId: ctx.tenantId,
      jurisdictionCode: nexus.jurisdictionCode,
      country: 'US',
      region: nexus.jurisdictionCode.split('-')[1],
      nexusType: 'economic',
      establishedDate: nexus.thresholdExceededDate!,
      isRegistered: false, // pending registration
    });
  }
}

// Output:
// Economic Nexus Status:
// ======================
//
// US-CA:
//   Revenue: $523,451.00 / $500,000.00 (104.7%)
//   Transactions: 847 / — (N/A%)
//   Exceeded: ⚠️ YES
//   ⚠️  ACTION REQUIRED: Register in US-CA
//
// US-NY:
//   Revenue: $312,200.00 / $500,000.00 (62.4%)
//   Transactions: 89 / 100 (89.0%)
//   Exceeded: ✅ No
//
// US-TX:
//   Revenue: $87,400.00 / $500,000.00 (17.5%)
//   Transactions: 156 / — (N/A%)
//   Exceeded: ✅ No
```

### Example 7: Generate Tax Return Data

Generate aggregated tax return data for a jurisdiction and filing period.

```typescript
import { TaxService, TaxReportService } from '@mcv/commerce/tax';

const taxService = container.resolve(TaxService);
const reportService = container.resolve(TaxReportService);

// Generate Q4 2025 Texas sales tax return
const taxReturn = await taxService.generateReturn(
  'US-TX',
  '2025-10-01T00:00:00Z',
  '2025-12-31T23:59:59Z',
);

console.log(`Texas Sales Tax Return — Q4 2025`);
console.log(`================================`);
console.log(`Status:          ${taxReturn.status}`);
console.log(`Transactions:    ${taxReturn.transactionCount}`);
console.log(`Filing Deadline: ${new Date(taxReturn.filingDeadline).toLocaleDateString()}`);
console.log(``);
console.log(`Gross Sales:       $${taxReturn.amounts.grossSales}`);
console.log(`Non-Taxable Sales: $${taxReturn.amounts.nonTaxableSales}`);
console.log(`Exempt Sales:      $${taxReturn.amounts.exemptSales}`);
console.log(`Taxable Sales:     $${taxReturn.amounts.taxableSales}`);
console.log(`Tax Collected:     $${taxReturn.amounts.taxCollected}`);
console.log(`Adjustments:       $${taxReturn.amounts.adjustments}`);
console.log(`Credits:           $${taxReturn.amounts.credits}`);
console.log(`Net Tax Due:       $${taxReturn.amounts.netTaxDue}`);
console.log(`Total Due:         $${taxReturn.amounts.totalDue}`);

// Get the full filing calendar
const calendar = await taxService.getFilingCalendar();

console.log(`\nUpcoming Filing Deadlines:`);
for (const obligation of calendar.filter((o) => o.daysUntilDeadline <= 30)) {
  const urgency = obligation.daysUntilDeadline <= 7 ? '🔴' : obligation.daysUntilDeadline <= 14 ? '🟡' : '🟢';
  console.log(`  ${urgency} ${obligation.jurisdictionName} (${obligation.returnType})`);
  console.log(`     Period: ${obligation.periodStart} to ${obligation.periodEnd}`);
  console.log(`     Deadline: ${obligation.deadline} (${obligation.daysUntilDeadline} days)`);
  console.log(`     Est. Due: $${obligation.estimatedTaxDue}`);
}

// Export audit data for the same period
const auditExport = await taxService.exportAuditData(
  '2025-10-01T00:00:00Z',
  '2025-12-31T23:59:59Z',
  'csv',
);

// Save to file for accountant review
await fs.writeFile('/exports/tx-q4-2025-audit.csv', auditExport);
```

### Example 8: Multi-Jurisdiction Canadian Order (GST + PST)

Handle a Canadian order where both federal GST and provincial PST apply.

```typescript
import { TaxService } from '@mcv/commerce/tax';

const taxService = container.resolve(TaxService);

// BC order: GST (5%) + PST (7%) = 12% combined
const result = await taxService.calculateTax({
  calculationId: `calc_ca_${orderId}`,
  tenantId: ctx.tenantId,
  documentType: 'sale',
  currencyCode: 'CAD',
  taxIncluded: false,
  customer: {
    customerId: customer.id,
    customerType: 'individual',
  },
  shipFrom: {
    city: 'Toronto',
    region: 'ON',
    postalCode: 'M5V 2T6',
    country: 'CA',
  },
  shipTo: {
    city: 'Vancouver',
    region: 'BC',
    postalCode: 'V6B 1A1',
    country: 'CA',
  },
  lineItems: [
    {
      lineId: 'laptop_1',
      taxCode: 'PC040100', // electronics
      quantity: 1,
      unitPrice: '1499.99',
      description: 'Laptop — 15" Pro',
    },
    {
      lineId: 'case_1',
      taxCode: 'PC040100',
      quantity: 1,
      unitPrice: '79.99',
      description: 'Laptop carrying case',
    },
    {
      lineId: 'shipping',
      taxCode: 'FR010000', // freight/shipping
      quantity: 1,
      unitPrice: '24.99',
      description: 'Standard shipping',
      isShipping: true,
    },
  ],
  commit: true,
});

console.log('Canadian Order Tax Breakdown:');
console.log(`Subtotal: CAD $${result.summary.subtotal}`);

// Jurisdiction breakdown shows both GST and PST
for (const j of result.jurisdictionSummary) {
  console.log(`  ${j.jurisdictionName} (${j.taxType}): ${(parseFloat(j.rate) * 100).toFixed(1)}% = CAD $${j.taxAmount}`);
}
console.log(`Total Tax: CAD $${result.summary.totalTax}`);
console.log(`Total: CAD $${result.summary.total}`);

// Output:
// Canadian Order Tax Breakdown:
// Subtotal: CAD $1604.9700
//   Federal GST (gst): 5.0% = CAD $80.2485
//   British Columbia PST (pst): 7.0% = CAD $112.3479
// Total Tax: CAD $192.5964
// Total: CAD $1797.5664

// Note: PST on shipping varies by province.
// BC charges PST on shipping; Alberta has no PST.
// The engine handles these nuances per jurisdiction.
```

---

## Error Codes

All errors from `@mcv/commerce/tax` use structured error codes in the `TAX_` namespace. Errors extend the platform's base `McvError` class with additional tax-specific context.

| Code | HTTP | Description | Recoverable | Retry |
|------|------|-------------|-------------|-------|
| `TAX_CALCULATION_FAILED` | 500 | Tax calculation could not be completed by any provider in the fallback chain. | No | Yes (with backoff) |
| `TAX_PROVIDER_UNAVAILABLE` | 503 | All configured tax providers are currently unreachable. Built-in fallback may still be available. | Transient | Yes |
| `TAX_PROVIDER_TIMEOUT` | 504 | Tax provider did not respond within the configured timeout. | Transient | Yes |
| `TAX_PROVIDER_AUTH_FAILED` | 401 | Provider API credentials are invalid or expired. | No | No (fix credentials) |
| `TAX_PROVIDER_RATE_LIMITED` | 429 | Provider rate limit exceeded. | Transient | Yes (respect Retry-After) |
| `TAX_INVALID_ADDRESS` | 400 | Ship-to or ship-from address could not be resolved to a tax jurisdiction. | No | No (fix address) |
| `TAX_ADDRESS_INCOMPLETE` | 400 | Address is missing required fields for tax determination (minimum: country + postal code). | No | No (provide full address) |
| `TAX_INVALID_TAX_CODE` | 400 | The specified product tax code does not exist or is inactive. | No | No (use valid code) |
| `TAX_CODE_MAPPING_MISSING` | 500 | Internal tax code could not be mapped to the active provider's taxonomy. | No | No (add mapping) |
| `TAX_ALREADY_COMMITTED` | 409 | This transaction has already been committed. Safe to ignore (idempotent). | N/A | N/A |
| `TAX_ALREADY_VOIDED` | 409 | This transaction has already been voided. | N/A | N/A |
| `TAX_COMMIT_NOT_FOUND` | 404 | The calculation ID does not exist or has no estimated transaction to commit. | No | No |
| `TAX_VOID_NOT_ALLOWED` | 409 | Transaction cannot be voided (e.g., already filed in a return). | No | No |
| `TAX_ADJUSTMENT_EXCEEDS_ORIGINAL` | 400 | The adjustment amount exceeds the original transaction amount. | No | No (fix amount) |
| `TAX_EXEMPTION_NOT_FOUND` | 404 | The specified exemption certificate does not exist. | No | No |
| `TAX_EXEMPTION_EXPIRED` | 400 | The exemption certificate has expired. | No | No (renew cert) |
| `TAX_EXEMPTION_INVALID_JURISDICTION` | 400 | The exemption certificate is not valid in the ship-to jurisdiction. | No | No |
| `TAX_EXEMPTION_REVOKED` | 400 | The exemption certificate has been revoked. | No | No |
| `TAX_VAT_VALIDATION_FAILED` | 502 | VIES or other VAT validation service is unavailable. | Transient | Yes |
| `TAX_VAT_NUMBER_INVALID` | 400 | The provided VAT number failed validation. | No | No (fix VAT number) |
| `TAX_VAT_NUMBER_FORMAT_INVALID` | 400 | The VAT number does not match the expected format for the country. | No | No |
| `TAX_NEXUS_NOT_FOUND` | 404 | The specified nexus record does not exist. | No | No |
| `TAX_NEXUS_ALREADY_EXISTS` | 409 | A nexus record already exists for this jurisdiction. | N/A | N/A |
| `TAX_RETURN_NOT_FOUND` | 404 | The specified tax return does not exist. | No | No |
| `TAX_RETURN_ALREADY_FILED` | 409 | The tax return has already been filed and cannot be modified (use amendment). | No | No |
| `TAX_RETURN_PERIOD_OVERLAP` | 409 | A return already exists for this jurisdiction and overlapping period. | No | No |
| `TAX_CONFIG_INVALID` | 400 | Tax provider configuration is invalid (missing required fields). | No | No (fix config) |
| `TAX_TENANT_NOT_CONFIGURED` | 400 | No tax configuration exists for this tenant. At least a built-in fallback config must exist. | No | No (create config) |
| `TAX_CURRENCY_MISMATCH` | 400 | The calculation currency does not match the jurisdiction's expected currency. | No | No |
| `TAX_RATE_NOT_FOUND` | 404 | No tax rate found for the specified jurisdiction and date. | No | No (check jurisdiction code) |
| `TAX_HOLIDAY_CONFLICT` | 409 | Overlapping tax holiday definitions for the same jurisdiction and tax code. | No | No (resolve conflict) |

### Error Response Structure

```typescript
interface TaxError {
  /** Error code from the TAX_ namespace. */
  code: string;

  /** HTTP status code. */
  status: number;

  /** Human-readable error message. */
  message: string;

  /** Additional context. */
  details: {
    /** The provider that generated the error (if applicable). */
    provider?: string;

    /** Provider-specific error code. */
    providerErrorCode?: string;

    /** Provider-specific error message. */
    providerErrorMessage?: string;

    /** The calculation ID that failed (if applicable). */
    calculationId?: string;

    /** The jurisdiction involved (if applicable). */
    jurisdictionCode?: string;

    /** Suggested fix or next step. */
    suggestion?: string;

    /** Whether the operation is safe to retry. */
    retryable: boolean;

    /** Recommended retry delay in milliseconds (if retryable). */
    retryAfterMs?: number;
  };
}
```

---

## Security

### Credential Protection

Tax provider API keys are sensitive — they authorize real-money tax transactions and access filing data.

| Asset | Protection | Storage |
|-------|-----------|---------|
| Avalara API key / license key | Encrypted at rest via Supabase Vault | `tax_provider_configs.license_key` (vault reference) |
| TaxJar API token | Encrypted at rest via Supabase Vault | `tax_provider_configs.license_key` (vault reference) |
| Vertex client ID / secret | Encrypted at rest via Supabase Vault | `tax_provider_configs.license_key` (vault reference) |
| VIES credentials | Not required (public service) | N/A |
| Exemption certificate documents | Encrypted blob storage with signed URLs | `@mcv/storage` with 1h URL expiry |
| Tax calculation details | Tenant-isolated via RLS | `tax_calculations` table |
| VAT registration numbers | PII — encrypted at rest | `vat_registrations.vat_number` |

### Row-Level Security (RLS)

Every tax table enforces tenant isolation:

- **`tax_calculations`** — Tenants can only read/write their own calculations
- **`tax_rates`** — System rates (null tenant_id) are readable by all; tenant-specific overrides are isolated
- **`nexus_records`** — Strict tenant isolation
- **`exemption_certificates`** — Strict tenant isolation; document URLs use signed, time-limited access
- **`tax_returns`** — Strict tenant isolation
- **`tax_provider_configs`** — Strict tenant isolation; license keys accessed only through vault
- **`tax_audit_log`** — Append-only; tenants can read their own logs but cannot modify or delete

### Access Control

```typescript
// tRPC middleware enforces permissions
const taxRouter = router({
  calculateTax: protectedProcedure
    .meta({ permission: 'tax:calculate' })
    .input(taxCalculationRequestSchema)
    .mutation(({ ctx, input }) => {
      return taxService.calculateTax({ ...input, tenantId: ctx.tenantId });
    }),

  commitTransaction: protectedProcedure
    .meta({ permission: 'tax:commit' })
    .input(z.object({ calculationId: z.string() }))
    .mutation(({ input }) => {
      return taxService.commitTransaction(input.calculationId);
    }),

  // Admin-only operations
  manageNexus: adminProcedure
    .meta({ permission: 'tax:nexus:manage' })
    .input(nexusRecordSchema)
    .mutation(({ ctx, input }) => {
      return taxService.addNexus({ ...input, tenantId: ctx.tenantId });
    }),

  configureProvider: adminProcedure
    .meta({ permission: 'tax:config:manage' })
    .input(providerConfigSchema)
    .mutation(({ ctx, input }) => {
      return taxService.configureProvider({ ...input, tenantId: ctx.tenantId });
    }),

  // Tax returns — restricted to finance role
  generateReturn: protectedProcedure
    .meta({ permission: 'tax:returns:generate', roles: ['admin', 'finance'] })
    .input(generateReturnSchema)
    .mutation(({ ctx, input }) => {
      return taxService.generateReturn(input.jurisdictionCode, input.periodStart, input.periodEnd);
    }),

  exportAuditData: protectedProcedure
    .meta({ permission: 'tax:audit:export', roles: ['admin', 'finance', 'auditor'] })
    .input(auditExportSchema)
    .mutation(({ input }) => {
      return taxService.exportAuditData(input.startDate, input.endDate, input.format);
    }),
});
```

### Required Permissions

| Permission | Description | Default Roles |
|-----------|-------------|---------------|
| `tax:calculate` | Calculate tax on transactions | `admin`, `manager`, `system` |
| `tax:commit` | Commit tax transactions | `admin`, `manager`, `system` |
| `tax:void` | Void committed transactions | `admin`, `finance` |
| `tax:adjust` | Create tax adjustments (refunds) | `admin`, `finance`, `support` |
| `tax:rates:read` | View tax rates | All authenticated |
| `tax:rates:manage` | Create/update tax rates | `admin` |
| `tax:nexus:read` | View nexus records | `admin`, `finance` |
| `tax:nexus:manage` | Create/update/delete nexus records | `admin` |
| `tax:exemptions:read` | View exemption certificates | `admin`, `finance`, `support` |
| `tax:exemptions:manage` | Create/validate/revoke certificates | `admin`, `finance` |
| `tax:vat:validate` | Validate VAT numbers | All authenticated |
| `tax:vat:manage` | Manage VAT registrations | `admin`, `finance` |
| `tax:returns:read` | View tax return data | `admin`, `finance`, `auditor` |
| `tax:returns:generate` | Generate tax returns | `admin`, `finance` |
| `tax:config:read` | View tax provider configuration | `admin` |
| `tax:config:manage` | Update tax provider configuration | `admin` |
| `tax:audit:read` | View audit log | `admin`, `finance`, `auditor` |
| `tax:audit:export` | Export audit data | `admin`, `finance`, `auditor` |

### Data Retention

- **Tax calculations** — Retained for 7 years (statutory minimum for most jurisdictions)
- **Audit log entries** — Retained for 10 years (immutable, never deleted)
- **Exemption certificates** — Retained for 4 years after expiration/revocation
- **Tax returns** — Retained for 7 years after filing
- **VAT validation cache** — 24-hour TTL, then re-validated on next use
- **Provider API responses** — Raw responses stored in audit log for 7 years

### PII Handling

- Customer addresses are stored in `tax_calculations` for audit purposes but are classified as PII
- VAT registration numbers are PII and are encrypted at rest
- Exemption certificate documents may contain business addresses, EINs, and signatures — stored in encrypted blob storage
- All PII access is logged in the platform audit trail (`@mcv/audit`)
- GDPR data subject access requests (DSAR) include tax calculation records; anonymization replaces customer details while preserving aggregate tax data

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `TAX_DEFAULT_PROVIDER` | Primary tax provider for calculations | `avalara` |
| `TAX_FALLBACK_PROVIDERS` | Comma-separated fallback provider order | `taxjar,builtin` |
| `TAX_DEFAULT_CURRENCY` | Default currency for calculations | `USD` |
| `TAX_DEFAULT_SHIP_FROM_COUNTRY` | Default origin country | `US` |
| `TAX_DEFAULT_SHIP_FROM_REGION` | Default origin state/province | `TX` |
| `TAX_DEFAULT_SHIP_FROM_POSTAL` | Default origin postal code | `78701` |

### Avalara Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `AVALARA_ACCOUNT_ID` | Avalara account number | `2000012345` |
| `AVALARA_LICENSE_KEY` | Avalara license key (use vault in production) | `ABCDEF1234567890` |
| `AVALARA_ENVIRONMENT` | Avalara environment | `production` or `sandbox` |
| `AVALARA_COMPANY_CODE` | Avalara company code | `MCV_DEFAULT` |
| `AVALARA_API_URL` | Avalara API base URL (override) | `https://rest.avatax.com/api/v2` |
| `AVALARA_TIMEOUT_MS` | Request timeout | `5000` |

### TaxJar Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `TAXJAR_API_TOKEN` | TaxJar API token (use vault in production) | `abc123def456` |
| `TAXJAR_ENVIRONMENT` | TaxJar environment | `production` or `sandbox` |
| `TAXJAR_API_URL` | TaxJar API base URL (override) | `https://api.taxjar.com/v2` |
| `TAXJAR_TIMEOUT_MS` | Request timeout | `5000` |

### Vertex Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `VERTEX_CLIENT_ID` | Vertex OAuth client ID | `vertex-client-id` |
| `VERTEX_CLIENT_SECRET` | Vertex OAuth client secret (use vault in production) | `vertex-secret` |
| `VERTEX_TRUSTED_ID` | Vertex Trusted ID | `12345` |
| `VERTEX_API_URL` | Vertex API base URL | `https://restconnect.vertexsmb.com` |
| `VERTEX_TIMEOUT_MS` | Request timeout | `8000` |

### VAT Validation

| Variable | Description | Example |
|----------|-------------|---------|
| `VIES_WSDL_URL` | EU VIES SOAP service URL | `https://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl` |
| `VIES_TIMEOUT_MS` | VIES validation timeout | `10000` |
| `HMRC_VAT_API_URL` | UK HMRC VAT validation API | `https://api.service.hmrc.gov.uk` |
| `HMRC_CLIENT_ID` | HMRC OAuth client ID | `hmrc-client-id` |
| `HMRC_CLIENT_SECRET` | HMRC OAuth client secret | `hmrc-secret` |

### Behavior

| Variable | Description | Default |
|----------|-------------|---------|
| `TAX_CACHE_TTL_SECONDS` | Cache TTL for identical calculation requests | `300` (5 min) |
| `TAX_CIRCUIT_BREAKER_THRESHOLD` | Failures before circuit opens | `5` |
| `TAX_CIRCUIT_BREAKER_RESET_MS` | Time before circuit half-opens | `30000` (30s) |
| `TAX_HEALTH_CHECK_INTERVAL_MS` | Provider health check interval | `60000` (1 min) |
| `TAX_NEXUS_EVALUATION_CRON` | Cron expression for economic nexus evaluation | `0 2 * * *` (2 AM daily) |
| `TAX_FILING_REMINDER_DAYS` | Days before deadline to send reminder | `14` |
| `TAX_VAT_CACHE_TTL_SECONDS` | VAT validation cache TTL | `86400` (24h) |
| `TAX_BUILTIN_RATE_REFRESH_CRON` | Cron for refreshing built-in rate database | `0 0 1 * *` (1st of month) |
| `TAX_AUDIT_RETENTION_YEARS` | Years to retain audit log entries | `10` |
| `TAX_CALCULATION_RETENTION_YEARS` | Years to retain calculation records | `7` |
| `TAX_MAX_LINE_ITEMS_PER_REQUEST` | Maximum line items in a single calculation | `1000` |
| `TAX_DEDUP_WINDOW_SECONDS` | Window for request deduplication | `60` |

---

## Dependencies

### Internal Dependencies

| Module | Purpose | Usage |
|--------|---------|-------|
| `@mcv/core` | Base error types, config, logging | Error classes, structured logging, env config |
| `@mcv/db` | Drizzle ORM setup, connection pool, migration runner | Database access for all tax tables |
| `@mcv/auth` | Authentication and authorization middleware | Permission checks on tRPC endpoints |
| `@mcv/tenancy` | Multi-tenant context, RLS session management | `app.current_tenant_id` setting for RLS |
| `@mcv/storage` | File storage for exemption certificate documents | Certificate upload, signed URL generation |
| `@mcv/audit` | Platform-wide audit logging | Cross-module audit trail integration |
| `@mcv/queue` | Job queue for async operations | Nexus evaluation, rate refresh, retry jobs |
| `@mcv/cache` | Distributed caching (Redis) | Calculation result caching, VAT validation cache |
| `@mcv/commerce/orders` | Order lifecycle events | Tax commit/void on order state changes |
| `@mcv/commerce/invoicing` | Invoice generation | Tax line items on invoices |
| `@mcv/commerce/products` | Product catalog | Tax code assignment to products |
| `@mcv/commerce/customers` | Customer records | Exemption certificate linking, customer type |
| `@mcv/notifications` | Email/push notifications | Filing deadline reminders, nexus alerts |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `avatax` | `^24.0.0` | Avalara AvaTax REST API SDK |
| `taxjar` | `^5.0.0` | TaxJar API client |
| `drizzle-orm` | `^0.30.0` | Database ORM |
| `zod` | `^3.22.0` | Runtime schema validation for all inputs |
| `@trpc/server` | `^11.0.0` | tRPC router definitions |
| `decimal.js` | `^10.4.0` | Arbitrary-precision decimal arithmetic for tax amounts |
| `node-cache` | `^5.1.0` | In-memory LRU cache for hot rate lookups |
| `cron-parser` | `^4.9.0` | Cron expression parsing for scheduled jobs |
| `soap` | `^1.0.0` | SOAP client for VIES VAT validation |
| `pino` | `^8.0.0` | Structured logging |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.40.0` | Supabase client for RLS and vault |

---

## Testing

### Test Strategy

The tax module employs a multi-layered testing strategy reflecting the critical nature of tax calculations — errors have legal and financial consequences.

| Layer | Coverage Target | Runner | Focus |
|-------|----------------|--------|-------|
| Unit tests | 95%+ | Vitest | Individual functions: rate resolution, back-calculation, jurisdiction matching, tax code mapping |
| Integration tests | 90%+ | Vitest + Supabase local | Full calculation flow through the engine with real DB, RLS verification, audit log completeness |
| Provider tests | 80%+ | Vitest (mocked) | Each provider adapter against recorded API responses (VCR-style) |
| E2E tests | Key flows | Playwright + API | Checkout → tax calculation → commit → return generation lifecycle |
| Compliance tests | All jurisdictions | Vitest | Known tax scenarios verified against expected results per jurisdiction |
| Performance tests | P95 < 500ms | k6 | Calculation latency under load, cache hit ratios, fallback timing |

### Unit Test Examples

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TaxCalculationEngine } from '../services/calculation-engine';
import { TaxRateResolver } from '../services/tax-rate-resolver';
import { BuiltInRateProvider } from '../providers/builtin-rate.provider';
import Decimal from 'decimal.js';

describe('TaxCalculationEngine', () => {
  let engine: TaxCalculationEngine;
  let rateResolver: TaxRateResolver;

  beforeEach(() => {
    rateResolver = new TaxRateResolver(mockRateDb);
    engine = new TaxCalculationEngine(rateResolver);
  });

  describe('tax-exclusive calculation', () => {
    it('calculates correct tax for single-jurisdiction US order', async () => {
      const result = await engine.calculate({
        lineItems: [
          { lineId: '1', taxCode: 'P0000000', quantity: 2, unitPrice: '50.00' },
        ],
        shipTo: { country: 'US', region: 'TX', postalCode: '78701' },
        shipFrom: { country: 'US', region: 'TX', postalCode: '78701' },
        taxIncluded: false,
        currencyCode: 'USD',
      });

      expect(result.summary.subtotal).toBe('100.0000');
      expect(result.summary.totalTax).toBe('8.2500'); // TX combined rate 8.25%
      expect(result.summary.total).toBe('108.2500');
      expect(result.jurisdictionSummary).toHaveLength(3); // state + city + district
    });

    it('applies line-level discounts before tax', async () => {
      const result = await engine.calculate({
        lineItems: [
          {
            lineId: '1',
            taxCode: 'P0000000',
            quantity: 1,
            unitPrice: '100.00',
            discountAmount: '20.00',
          },
        ],
        shipTo: { country: 'US', region: 'CA', postalCode: '90210' },
        shipFrom: { country: 'US', region: 'CA', postalCode: '90210' },
        taxIncluded: false,
        currencyCode: 'USD',
      });

      // Tax on $80 (after $20 discount), not $100
      expect(result.summary.totalTaxable).toBe('80.0000');
      expect(result.summary.totalDiscount).toBe('20.0000');
    });
  });

  describe('tax-inclusive back-calculation', () => {
    it('correctly back-calculates net price from VAT-inclusive price', async () => {
      const result = await engine.calculate({
        lineItems: [
          { lineId: '1', taxCode: 'SW054000', quantity: 1, unitPrice: '119.00' },
        ],
        shipTo: { country: 'DE', postalCode: '10115' },
        shipFrom: { country: 'IE', postalCode: 'D02' },
        taxIncluded: true,
        currencyCode: 'EUR',
      });

      // €119 inclusive of 19% German VAT
      expect(result.lineItems[0].taxableAmount).toBe('100.0000');
      expect(result.lineItems[0].taxAmount).toBe('19.0000');
      expect(result.summary.total).toBe('119.0000');
    });

    it('handles compound tax back-calculation (Canadian GST+PST)', async () => {
      // BC: GST 5% + PST 7% (non-compound) = 12% total
      const result = await engine.calculate({
        lineItems: [
          { lineId: '1', taxCode: 'P0000000', quantity: 1, unitPrice: '112.00' },
        ],
        shipTo: { country: 'CA', region: 'BC', postalCode: 'V6B 1A1' },
        shipFrom: { country: 'CA', region: 'ON', postalCode: 'M5V 2T6' },
        taxIncluded: true,
        currencyCode: 'CAD',
      });

      const netPrice = new Decimal('112.00').dividedBy(new Decimal('1.12'));
      expect(result.lineItems[0].taxableAmount).toBe(netPrice.toFixed(4));
    });
  });

  describe('exemption handling', () => {
    it('applies full exemption from valid resale certificate', async () => {
      const result = await engine.calculate({
        lineItems: [
          { lineId: '1', taxCode: 'P0000000', quantity: 10, unitPrice: '50.00' },
        ],
        shipTo: { country: 'US', region: 'TX', postalCode: '78701' },
        shipFrom: { country: 'US', region: 'TX', postalCode: '78701' },
        taxIncluded: false,
        currencyCode: 'USD',
        customer: {
          customerId: 'cust_123',
          customerType: 'reseller',
          exemptionCertificateIds: ['cert_active_resale'],
          entityUseCode: 'RESALE',
        },
      });

      expect(result.summary.totalTax).toBe('0.0000');
      expect(result.summary.totalExempt).toBe('500.0000');
      expect(result.lineItems[0].isExempt).toBe(true);
      expect(result.lineItems[0].exemptionReason).toContain('Resale');
    });

    it('rejects expired exemption certificate', async () => {
      const result = await engine.calculate({
        lineItems: [
          { lineId: '1', taxCode: 'P0000000', quantity: 1, unitPrice: '100.00' },
        ],
        shipTo: { country: 'US', region: 'TX', postalCode: '78701' },
        shipFrom: { country: 'US', region: 'TX', postalCode: '78701' },
        taxIncluded: false,
        currencyCode: 'USD',
        customer: {
          customerId: 'cust_123',
          customerType: 'reseller',
          exemptionCertificateIds: ['cert_expired'],
        },
      });

      // Tax should be charged normally
      expect(result.summary.totalTax).not.toBe('0.0000');
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'EXEMPTION_EXPIRED' }),
      );
    });
  });
});

describe('TaxRateResolver', () => {
  it('returns the correct rate for a jurisdiction on a given date', async () => {
    const resolver = new TaxRateResolver(mockRateDb);
    const rates = await resolver.resolve('US-CA', new Date('2026-01-15'));

    expect(rates).toContainEqual(
      expect.objectContaining({
        jurisdictionCode: 'US-CA',
        jurisdictionType: 'state',
        rate: '0.072500', // CA state rate
      }),
    );
  });

  it('uses historical rate when tax date is in the past', async () => {
    const resolver = new TaxRateResolver(mockRateDb);
    // Rate before Jan 2025 increase
    const rates = await resolver.resolve('US-CA', new Date('2024-06-01'));

    expect(rates).toContainEqual(
      expect.objectContaining({
        jurisdictionCode: 'US-CA',
        rate: '0.072500',
      }),
    );
  });

  it('applies tax holiday rate when within holiday period', async () => {
    const resolver = new TaxRateResolver(mockRateDb);
    // During TX back-to-school holiday (typically early August)
    const rates = await resolver.resolve('US-TX', new Date('2026-08-08'), 'PC040100');

    const clothingRate = rates.find((r) => r.taxCode === 'PC040100');
    expect(clothingRate?.rate).toBe('0.000000'); // exempt during holiday
  });
});
```

### Integration Test Examples

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext } from '@mcv/testing';
import { TaxService } from '../services/tax.service';

describe('TaxService Integration', () => {
  let ctx: TestContext;
  let taxService: TaxService;

  beforeAll(async () => {
    ctx = await createTestContext({
      modules: ['tax'],
      seedData: 'tax-integration',
    });
    taxService = ctx.resolve(TaxService);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it('full lifecycle: estimate → commit → void', async () => {
    // 1. Estimate
    const estimate = await taxService.calculateTax({
      calculationId: 'test-lifecycle-001',
      tenantId: ctx.tenantId,
      documentType: 'sale',
      currencyCode: 'USD',
      taxIncluded: false,
      customer: { customerId: 'cust_test', customerType: 'individual' },
      shipFrom: { postalCode: '78701', country: 'US', region: 'TX' },
      shipTo: { postalCode: '10001', country: 'US', region: 'NY' },
      lineItems: [
        { lineId: 'l1', taxCode: 'P0000000', quantity: 1, unitPrice: '100.00' },
      ],
      commit: false,
    });

    expect(estimate.committed).toBe(false);
    expect(parseFloat(estimate.summary.totalTax)).toBeGreaterThan(0);

    // 2. Commit
    await taxService.commitTransaction('test-lifecycle-001');

    // Verify committed in DB
    const committed = await ctx.db
      .select()
      .from(taxCalculations)
      .where(eq(taxCalculations.calculationId, 'test-lifecycle-001'))
      .limit(1);

    expect(committed[0].committed).toBe(true);
    expect(committed[0].committedAt).not.toBeNull();

    // 3. Void
    await taxService.voidTransaction('test-lifecycle-001');

    const voided = await ctx.db
      .select()
      .from(taxCalculations)
      .where(eq(taxCalculations.calculationId, 'test-lifecycle-001'))
      .limit(1);

    expect(voided[0].status).toBe('voided');
    expect(voided[0].voidedAt).not.toBeNull();
  });

  it('enforces RLS — tenant A cannot see tenant B calculations', async () => {
    // Create calculation as tenant A
    await taxService.calculateTax({
      calculationId: 'rls-test-001',
      tenantId: ctx.tenantAId,
      documentType: 'sale',
      currencyCode: 'USD',
      taxIncluded: false,
      customer: { customerId: 'cust_a', customerType: 'individual' },
      shipFrom: { postalCode: '78701', country: 'US', region: 'TX' },
      shipTo: { postalCode: '78701', country: 'US', region: 'TX' },
      lineItems: [
        { lineId: 'l1', taxCode: 'P0000000', quantity: 1, unitPrice: '50.00' },
      ],
      commit: false,
    });

    // Switch to tenant B context
    ctx.setTenant(ctx.tenantBId);

    // Attempt to read tenant A's calculation
    const result = await taxService.getAuditTrail('rls-test-001');
    expect(result).toHaveLength(0); // RLS blocks access
  });

  it('writes audit log entry for every calculation', async () => {
    await taxService.calculateTax({
      calculationId: 'audit-test-001',
      tenantId: ctx.tenantId,
      documentType: 'sale',
      currencyCode: 'USD',
      taxIncluded: false,
      customer: { customerId: 'cust_test', customerType: 'individual' },
      shipFrom: { postalCode: '78701', country: 'US', region: 'TX' },
      shipTo: { postalCode: '78701', country: 'US', region: 'TX' },
      lineItems: [
        { lineId: 'l1', taxCode: 'P0000000', quantity: 1, unitPrice: '100.00' },
      ],
      commit: false,
    });

    const auditEntries = await taxService.getAuditTrail('audit-test-001');

    expect(auditEntries).toContainEqual(
      expect.objectContaining({
        eventType: 'calculation_created',
        calculationId: expect.any(String),
        eventData: expect.objectContaining({
          provider: expect.any(String),
          totalTax: expect.any(String),
        }),
      }),
    );
  });

  it('falls back to built-in provider when primary is unavailable', async () => {
    // Simulate primary provider failure
    await ctx.mockProviderFailure('avalara');

    const result = await taxService.calculateTax({
      calculationId: 'fallback-test-001',
      tenantId: ctx.tenantId,
      documentType: 'sale',
      currencyCode: 'USD',
      taxIncluded: false,
      customer: { customerId: 'cust_test', customerType: 'individual' },
      shipFrom: { postalCode: '78701', country: 'US', region: 'TX' },
      shipTo: { postalCode: '78701', country: 'US', region: 'TX' },
      lineItems: [
        { lineId: 'l1', taxCode: 'P0000000', quantity: 1, unitPrice: '100.00' },
      ],
      commit: false,
    });

    // Should succeed with fallback provider
    expect(result.provider).toBe('builtin');
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'PROVIDER_FALLBACK',
        message: expect.stringContaining('avalara'),
      }),
    );

    // Audit log should record the fallback
    const auditEntries = await taxService.getAuditTrail('fallback-test-001');
    expect(auditEntries).toContainEqual(
      expect.objectContaining({
        eventType: 'provider_fallback',
      }),
    );
  });
});
```

### Compliance Test Suite

```typescript
import { describe, it, expect } from 'vitest';
import { TaxCalculationEngine } from '../services/calculation-engine';
import { complianceScenarios } from '../__fixtures__/compliance-scenarios';

/**
 * Compliance test suite — verifies tax calculations against known-correct
 * results for every supported jurisdiction. These scenarios are sourced from:
 * - State/province tax authority published rate tables
 * - Accountant-verified manual calculations
 * - Provider (Avalara/TaxJar) comparison runs
 *
 * Run before every release. Any failure blocks deployment.
 */
describe('Tax Compliance Suite', () => {
  const engine = new TaxCalculationEngine(productionRateDb);

  describe.each(complianceScenarios)('$jurisdiction — $description', (scenario) => {
    it(`calculates correct total tax: $${scenario.expectedTax}`, async () => {
      const result = await engine.calculate(scenario.input);

      expect(result.summary.totalTax).toBe(scenario.expectedTax);
      expect(result.summary.effectiveRate).toBe(scenario.expectedRate);
    });

    it('produces correct jurisdiction breakdown', async () => {
      const result = await engine.calculate(scenario.input);

      for (const expected of scenario.expectedJurisdictions) {
        const actual = result.jurisdictionSummary.find(
          (j) => j.jurisdictionCode === expected.code,
        );
        expect(actual).toBeDefined();
        expect(actual!.rate).toBe(expected.rate);
        expect(actual!.taxAmount).toBe(expected.amount);
      }
    });
  });
});

// Example fixture (partial):
// complianceScenarios = [
//   {
//     jurisdiction: 'US-CA-LOS_ANGELES',
//     description: 'Standard tangible goods in Los Angeles',
//     input: { shipTo: { country: 'US', region: 'CA', postalCode: '90001' }, ... },
//     expectedTax: '9.5000',
//     expectedRate: '0.095000',
//     expectedJurisdictions: [
//       { code: 'US-CA', rate: '0.072500', amount: '7.2500' },
//       { code: 'US-CA-LOS_ANGELES', rate: '0.022500', amount: '2.2500' },
//     ],
//   },
//   ...
// ]
```

### Running Tests

```bash
# Run all tax module tests
pnpm test --filter @mcv/commerce-tax

# Run unit tests only
pnpm test --filter @mcv/commerce-tax -- --grep "unit"

# Run compliance suite
pnpm test --filter @mcv/commerce-tax -- --grep "Compliance"

# Run integration tests (requires local Supabase)
pnpm test:integration --filter @mcv/commerce-tax

# Run with coverage
pnpm test:coverage --filter @mcv/commerce-tax

# Run performance benchmarks
pnpm test:perf --filter @mcv/commerce-tax
```

---

*This module is part of the MCV.ONE Commerce domain. For related modules, see [`@mcv/commerce/orders`](../orders/MODULE.md), [`@mcv/commerce/invoicing`](../invoicing/MODULE.md), and [`@mcv/commerce/products`](../products/MODULE.md).*