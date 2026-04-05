# @mcv/commerce/wholesale

> **Wholesale / B2B Commerce** — Enterprise-grade B2B wholesale operations for the MCV.ONE platform. Manages wholesale accounts, tiered pricing, bulk ordering, quote workflows, net terms & credit, trade catalogs, sales rep assignment, and wholesale analytics.

**Package:** `@mcv/commerce/wholesale`
**Layer:** Tier 5 — Domain
**Runtime:** Server (Node.js 20+)
**Since:** 0.9.0
**Status:** Stable
**Maintainer:** MCV Commerce Team

---

## Table of Contents

1. [Purpose](#purpose)
2. [Exports](#exports)
3. [Architecture](#architecture)
4. [Core Interfaces](#core-interfaces)
5. [Database Schemas](#database-schemas)
6. [Code Examples](#code-examples)
7. [Error Codes](#error-codes)
8. [Security](#security)
9. [Environment Variables](#environment-variables)
10. [Dependencies](#dependencies)
11. [Testing](#testing)

---

## Purpose

B2B wholesale commerce is fundamentally different from B2C retail. Wholesale buyers place large orders on recurring schedules, negotiate pricing per account, operate on net payment terms, and require dedicated sales representatives. The `@mcv/commerce/wholesale` module provides a complete B2B commerce layer that sits alongside (and integrates with) the core `@mcv/commerce` module, adding wholesale-specific workflows without contaminating the retail experience.

### What This Module Solves

**Account-Based Commerce:** Unlike anonymous retail shoppers, wholesale buyers represent companies. A single wholesale account may have multiple authorized buyers, each with different purchasing limits and approval requirements. This module manages the full lifecycle: application → approval → onboarding → ongoing operations → account review.

**Complex Pricing Models:** Wholesale pricing is never simple. A single product may have a base wholesale price, a volume-tiered price (buy 100+ for $X, buy 500+ for $Y), a customer-group price (Gold tier gets 15% off), a negotiated contract price (Acme Corp pays exactly $4.27/unit), and a promotional price — all simultaneously. The pricing engine resolves these according to configurable priority rules.

**Quote-Driven Sales:** Many B2B transactions begin with a Request for Quote (RFQ), not an Add to Cart. Buyers submit quote requests, sales reps prepare quotes with custom pricing, buyers negotiate, and approved quotes convert to orders. This module manages the full quote lifecycle with version tracking, expiration, and approval chains.

**Net Terms & Credit Management:** Wholesale buyers don't pay at checkout. They receive invoices with payment terms (Net 30, Net 60, Net 90) and pay within the agreed window. This requires credit limits, credit applications, aging reports, and statement generation — all handled by this module.

**Sales Organization:** Wholesale operations are driven by sales representatives assigned to territories and accounts. Reps need to place orders on behalf of customers, track commissions, manage their book of business, and have visibility into account health metrics.

### Design Principles

- **Account-first, not cart-first** — Every wholesale operation is scoped to an account, not a session
- **Price resolution is deterministic** — Given the same inputs, pricing always resolves identically, with full audit trail
- **Quotes are immutable versions** — Each quote revision creates a new version; no silent edits
- **Credit is a first-class resource** — Credit limits enforce at order placement, not just at payment
- **Multi-tenant isolation** — All wholesale data is tenant-scoped via Supabase RLS; no cross-tenant leakage
- **Composable with retail** — Wholesale and retail share product catalogs but maintain separate pricing, inventory allocation, and order flows

---

## Exports

```typescript
// === Primary Service ===
export { WholesaleService }              from './services/wholesale.service';
export { createWholesaleService }        from './services/wholesale.service';

// === Account Management ===
export { WholesaleAccountService }       from './services/account.service';
export { AccountApprovalWorkflow }       from './workflows/account-approval';
export { AccountOnboardingWorkflow }     from './workflows/account-onboarding';

// === Pricing Engine ===
export { WholesalePricingEngine }        from './services/pricing-engine.service';
export { PriceListService }             from './services/price-list.service';
export { TieredPricingResolver }        from './resolvers/tiered-pricing.resolver';
export { ContractPricingResolver }      from './resolvers/contract-pricing.resolver';
export { GroupPricingResolver }         from './resolvers/group-pricing.resolver';

// === Ordering ===
export { BulkOrderService }             from './services/bulk-order.service';
export { QuickOrderService }            from './services/quick-order.service';
export { CsvOrderParser }              from './services/csv-order-parser.service';
export { ReorderService }              from './services/reorder.service';
export { DraftOrderService }           from './services/draft-order.service';
export { MinimumOrderValidator }       from './validators/minimum-order.validator';

// === Quote Management ===
export { QuoteService }                 from './services/quote.service';
export { QuoteApprovalWorkflow }        from './workflows/quote-approval';
export { QuoteConversionService }       from './services/quote-conversion.service';
export { RfqService }                   from './services/rfq.service';

// === Credit & Terms ===
export { CreditService }               from './services/credit.service';
export { CreditApplicationWorkflow }    from './workflows/credit-application';
export { NetTermsService }             from './services/net-terms.service';
export { AgingReportService }          from './services/aging-report.service';
export { StatementService }            from './services/statement.service';
export { InvoiceService }              from './services/invoice.service';

// === Trade Catalogs ===
export { TradeCatalogService }          from './services/trade-catalog.service';
export { CatalogAccessResolver }        from './resolvers/catalog-access.resolver';
export { PriceVisibilityService }       from './services/price-visibility.service';

// === Sales Organization ===
export { SalesRepService }              from './services/sales-rep.service';
export { TerritoryService }            from './services/territory.service';
export { CommissionService }           from './services/commission.service';
export { RepImpersonationService }     from './services/rep-impersonation.service';

// === Analytics ===
export { WholesaleAnalyticsService }    from './services/wholesale-analytics.service';
export { AccountHealthScorer }          from './services/account-health.service';
export { RepPerformanceService }        from './services/rep-performance.service';

// === tRPC Router ===
export { wholesaleRouter }              from './router';
export type { WholesaleRouter }         from './router';

// === Types ===
export type {
  WholesaleAccount,
  WholesaleAccountApplication,
  WholesaleAccountStatus,
  AccountBuyer,
  AccountBuyerRole,
  CompanyProfile,
  PriceList,
  PriceListItem,
  PriceListAssignment,
  PricingTier,
  PricingRule,
  PriceResolutionResult,
  PriceResolutionContext,
  Quote,
  QuoteItem,
  QuoteStatus,
  QuoteVersion,
  RfqRequest,
  BulkOrder,
  BulkOrderLine,
  CsvOrderRow,
  OrderDraft,
  MinimumOrderRule,
  MinimumOrderViolation,
  CreditTerms,
  CreditApplication,
  CreditApplicationStatus,
  CreditLimit,
  AgingBucket,
  AgingReport,
  AccountStatement,
  StatementLineItem,
  TradeCatalog,
  TradeCatalogAccess,
  CatalogVisibility,
  SalesRep,
  Territory,
  TerritoryAssignment,
  Commission,
  CommissionRule,
  CommissionPeriod,
  WholesaleOrderSummary,
  AccountHealthScore,
  RepPerformanceMetrics,
  ReorderSuggestion,
} from './types';

// === Schemas (Drizzle) ===
export {
  wholesaleAccounts,
  accountBuyers,
  companyProfiles,
  priceLists,
  priceListItems,
  priceListAssignments,
  quotes,
  quoteItems,
  quoteVersions,
  creditTerms,
  creditApplications,
  creditLimits,
  salesReps,
  territories,
  territoryAssignments,
  commissions,
  commissionRules,
  wholesaleOrders,
  wholesaleOrderLines,
  accountStatements,
  statementLineItems,
  tradeCatalogs,
  tradeCatalogAccess,
  minimumOrderRules,
} from './schema';

// === Error Classes ===
export {
  WholesaleError,
  AccountNotApprovedError,
  AccountSuspendedError,
  CreditLimitExceededError,
  MinimumOrderNotMetError,
  QuoteExpiredError,
  QuoteAlreadyConvertedError,
  PriceListNotFoundError,
  InvalidBuyerRoleError,
  TerritoryConflictError,
  CatalogAccessDeniedError,
  DuplicateAccountError,
  CreditApplicationPendingError,
  InvalidNetTermsError,
  RepNotAssignedError,
  BulkOrderParseError,
  QuoteApprovalRequiredError,
  AccountCreditFrozenError,
  InvalidCasePackQuantityError,
  NegotiatedPriceExpiredError,
} from './errors';
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Wholesale Commerce Layer                        │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Account     │  │   Pricing    │  │     Order Pipeline       │  │
│  │  Management   │  │   Engine     │  │                          │  │
│  │              │  │              │  │  RFQ → Quote → Draft →   │  │
│  │  Application │  │  Base Price  │  │  Validate → Order →      │  │
│  │  Approval    │  │  Tier Calc   │  │  Invoice → Statement     │  │
│  │  Onboarding  │  │  Group Disc  │  │                          │  │
│  │  Buyers      │  │  Contract    │  │  ┌─────────────────────┐ │  │
│  │  Profiles    │  │  Negotiated  │  │  │  Bulk Order Forms   │ │  │
│  │              │  │  Resolution  │  │  │  CSV Upload         │ │  │
│  └──────┬───────┘  └──────┬───────┘  │  │  Quick Order        │ │  │
│         │                 │          │  │  Reorder History     │ │  │
│         │                 │          │  └─────────────────────┘ │  │
│         │                 │          └──────────┬───────────────┘  │
│         │                 │                     │                   │
│  ┌──────┴─────────────────┴─────────────────────┴───────────────┐  │
│  │                    WholesaleService                           │  │
│  │                  (Orchestration Layer)                        │  │
│  └──────┬──────────────────┬──────────────────────┬─────────────┘  │
│         │                  │                      │                 │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌───────────┴─────────────┐  │
│  │   Credit &   │  │    Sales     │  │     Trade Catalogs      │  │
│  │   Terms      │  │    Org       │  │                          │  │
│  │              │  │              │  │  Catalog Definitions     │  │
│  │  Net Terms   │  │  Reps        │  │  Access Control          │  │
│  │  Credit Lim  │  │  Territories │  │  Price Visibility        │  │
│  │  Applications│  │  Commissions │  │  Group Restrictions      │  │
│  │  Aging       │  │  Impersonation│ │                          │  │
│  │  Statements  │  │              │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  Wholesale Analytics                          │   │
│  │  Account Revenue │ Reorder Freq │ AOV │ Credit │ Rep Perf    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                     │
    ┌────┴────┐         ┌────┴────┐           ┌────┴────┐
    │Supabase │         │ @mcv/   │           │ @mcv/   │
    │PostgreSQL│        │commerce │           │ auth    │
    │ + RLS   │         │ (core)  │           │         │
    └─────────┘         └─────────┘           └─────────┘
```

### B2B Order Flow

The wholesale order flow differs significantly from retail. Orders can originate from multiple entry points and pass through validation, pricing, credit, and approval stages before fulfillment:

```
                    ┌─────────────────┐
                    │   Entry Points   │
                    └───────┬─────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         ┌────┴────┐  ┌────┴────┐  ┌────┴────┐
         │Quick    │  │CSV      │  │ RFQ /   │
         │Order    │  │Upload   │  │ Quote   │
         │Form     │  │         │  │ Request │
         └────┬────┘  └────┬────┘  └────┬────┘
              │             │             │
              │             │      ┌──────┴──────┐
              │             │      │ Quote       │
              │             │      │ Creation    │
              │             │      │ & Approval  │
              │             │      └──────┬──────┘
              │             │             │
              └─────────────┼─────────────┘
                            │
                    ┌───────┴────────┐
                    │  Draft Order    │
                    │  Assembly       │
                    └───────┬────────┘
                            │
                    ┌───────┴────────┐
                    │  Price          │
                    │  Resolution     │◄──── Pricing Engine
                    └───────┬────────┘
                            │
                    ┌───────┴────────┐
                    │  Minimum Order  │
                    │  Validation     │
                    │  • Min value    │
                    │  • Min qty/SKU  │
                    │  • Case packs   │
                    │  • Mixed cases  │
                    └───────┬────────┘
                            │
                    ┌───────┴────────┐
                    │  Credit Check   │
                    │  • Credit limit │
                    │  • Outstanding  │
                    │  • Net terms    │
                    └───────┬────────┘
                            │
                    ┌───────┴────────┐
                    │  Buyer Approval │
                    │  (if required)  │
                    └───────┬────────┘
                            │
                    ┌───────┴────────┐
                    │  Order          │
                    │  Placement      │──────► @mcv/commerce (fulfillment)
                    └───────┬────────┘
                            │
                    ┌───────┴────────┐
                    │  Invoice        │
                    │  Generation     │
                    └───────┬────────┘
                            │
                    ┌───────┴────────┐
                    │  Aging &        │
                    │  Statements     │
                    └─────────────────┘
```

### Pricing Resolution Pipeline

Wholesale pricing resolution is the most complex subsystem. When a price is requested for a product + account combination, the engine evaluates multiple pricing sources in priority order and returns the resolved price with full audit trail:

```
Input: (productId, variantId, quantity, accountId, groupId, tenantId)
                            │
                    ┌───────┴────────┐
                    │ 1. Negotiated   │  Highest priority
                    │    Contract     │  Account-specific, time-bound
                    │    Price        │  contracts with fixed pricing
                    └───────┬────────┘
                            │ (miss)
                    ┌───────┴────────┐
                    │ 2. Account      │  Price lists assigned
                    │    Price List   │  directly to the account
                    └───────┬────────┘
                            │ (miss)
                    ┌───────┴────────┐
                    │ 3. Customer     │  Group-level pricing
                    │    Group Price  │  (Gold, Silver, Bronze tiers)
                    └───────┬────────┘
                            │ (miss)
                    ┌───────┴────────┐
                    │ 4. Volume       │  Quantity-based tiers
                    │    Tier Price   │  evaluated against the
                    │                 │  ordered quantity
                    └───────┬────────┘
                            │ (miss)
                    ┌───────┴────────┐
                    │ 5. Base         │  Default wholesale price
                    │    Wholesale    │  from the product record
                    │    Price        │  (compare price / trade price)
                    └───────┬────────┘
                            │ (miss)
                    ┌───────┴────────┐
                    │ 6. Retail       │  Fallback: retail price
                    │    Price with   │  minus configured wholesale
                    │    Discount %   │  discount percentage
                    └─────────────────┘

Output: PriceResolutionResult {
  unitPrice, totalPrice, source, tier?,
  discount?, priceListId?, contractId?,
  auditTrail: PriceResolutionStep[]
}
```

### Multi-Tenant Data Isolation

All wholesale data is tenant-scoped. Supabase Row Level Security (RLS) policies ensure that:

1. **Wholesale accounts** are visible only within their tenant
2. **Price lists** cannot leak across tenants — even if a price list ID is guessed
3. **Quotes** are scoped to both tenant and account — a buyer can only see their own quotes
4. **Credit data** is strictly isolated — no tenant can view another's credit limits or aging
5. **Sales reps** see only accounts within their tenant and assigned territories
6. **Rep impersonation** is logged and auditable per tenant

```sql
-- Example RLS policy on wholesale_accounts
CREATE POLICY "tenant_isolation" ON wholesale_accounts
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Buyers see only their own account
CREATE POLICY "buyer_account_access" ON wholesale_accounts
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND id IN (
      SELECT account_id FROM account_buyers
      WHERE user_id = auth.uid()
    )
  );
```

---

## Core Interfaces

### WholesaleAccount

Represents a B2B customer account. A single wholesale account belongs to a company and may have multiple authorized buyers.

```typescript
/**
 * A wholesale/B2B customer account.
 *
 * Accounts go through an approval workflow before they can place orders.
 * Each account belongs to a company and can have multiple authorized buyers
 * with different roles (admin, buyer, viewer).
 */
interface WholesaleAccount {
  /** Unique account identifier */
  id: string;

  /** Tenant this account belongs to */
  tenantId: string;

  /** Human-readable account number (e.g., "WS-10042") */
  accountNumber: string;

  /** Current account status */
  status: WholesaleAccountStatus;

  /** Company profile (legal name, tax ID, addresses, etc.) */
  companyProfile: CompanyProfile;

  /** Customer group for group-based pricing (e.g., "gold", "silver") */
  customerGroupId: string | null;

  /** Assigned sales representative */
  salesRepId: string | null;

  /** Territory this account falls under */
  territoryId: string | null;

  /** Credit terms assigned to this account */
  creditTermsId: string | null;

  /** Price lists directly assigned to this account */
  priceListIds: string[];

  /** Default payment method on file */
  defaultPaymentMethodId: string | null;

  /** Tax exemption certificate ID, if applicable */
  taxExemptionId: string | null;

  /** Whether tax-exempt status is verified */
  taxExemptVerified: boolean;

  /** Account-level notes (internal, visible to reps and admins) */
  internalNotes: string | null;

  /** Tags for segmentation and filtering */
  tags: string[];

  /** Custom metadata */
  metadata: Record<string, unknown>;

  /** When the application was submitted */
  appliedAt: Date;

  /** When the account was approved (null if pending/rejected) */
  approvedAt: Date | null;

  /** Who approved the account */
  approvedBy: string | null;

  /** When the account was last active (placed an order) */
  lastActiveAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

type WholesaleAccountStatus =
  | 'pending'       // Application submitted, awaiting review
  | 'under_review'  // Being reviewed by sales/admin
  | 'approved'      // Active, can place orders
  | 'suspended'     // Temporarily disabled (e.g., overdue payments)
  | 'closed'        // Permanently closed
  | 'rejected';     // Application denied

interface CompanyProfile {
  /** Legal company name */
  legalName: string;

  /** DBA / trade name */
  tradeName: string | null;

  /** Tax identification number (EIN, VAT, etc.) */
  taxId: string | null;

  /** DUNS number for credit verification */
  dunsNumber: string | null;

  /** Industry / business type */
  industry: string | null;

  /** Annual revenue range for credit assessment */
  annualRevenueRange: string | null;

  /** Number of employees range */
  employeeCountRange: string | null;

  /** Year established */
  yearEstablished: number | null;

  /** Company website */
  website: string | null;

  /** Primary billing address */
  billingAddress: Address;

  /** Primary shipping address */
  shippingAddress: Address;

  /** Additional shipping addresses */
  additionalShippingAddresses: Address[];

  /** Primary contact */
  primaryContact: ContactInfo;

  /** Accounts payable contact */
  apContact: ContactInfo | null;
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  title: string | null;
}
```

### AccountBuyer

Represents an individual user authorized to act on behalf of a wholesale account.

```typescript
/**
 * A buyer authorized to operate under a wholesale account.
 *
 * Accounts can have multiple buyers with different roles:
 * - admin: Full access, can manage other buyers, approve orders
 * - buyer: Can place orders up to their spending limit
 * - viewer: Read-only access to account orders and quotes
 */
interface AccountBuyer {
  id: string;
  accountId: string;
  userId: string;
  role: AccountBuyerRole;

  /** Per-buyer spending limit per order (null = account limit applies) */
  orderLimit: number | null;

  /** Whether this buyer requires approval for orders above orderLimit */
  requiresApproval: boolean;

  /** Whether this buyer can create quotes */
  canCreateQuotes: boolean;

  /** Whether this buyer can approve quotes */
  canApproveQuotes: boolean;

  /** Name for display purposes */
  displayName: string;
  email: string;

  isActive: boolean;
  invitedAt: Date;
  acceptedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type AccountBuyerRole = 'admin' | 'buyer' | 'viewer';
```

### PriceList

A named collection of product prices that can be assigned to accounts or customer groups.

```typescript
/**
 * A wholesale price list.
 *
 * Price lists contain specific prices for products/variants and can be
 * assigned to individual accounts, customer groups, or both.
 * Multiple price lists can apply to a single account; resolution
 * priority determines which price wins.
 */
interface PriceList {
  id: string;
  tenantId: string;

  /** Human-readable name (e.g., "2026 Spring Catalog", "Gold Tier Pricing") */
  name: string;

  /** Optional description */
  description: string | null;

  /** Currency code (ISO 4217) */
  currency: string;

  /** Priority for resolution when multiple lists match (higher = checked first) */
  priority: number;

  /** Whether this is a contract/negotiated price list */
  isContract: boolean;

  /** Account this price list is exclusively for (null = shared/group list) */
  accountId: string | null;

  /** Customer group this list applies to (null = account-specific or universal) */
  customerGroupId: string | null;

  /** When this price list becomes effective */
  effectiveFrom: Date;

  /** When this price list expires (null = no expiration) */
  effectiveTo: Date | null;

  /** Whether the price list is currently active */
  isActive: boolean;

  /** Number of items in this price list */
  itemCount: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * A single item in a price list, defining the price for a specific
 * product/variant at one or more quantity tiers.
 */
interface PriceListItem {
  id: string;
  priceListId: string;

  /** The product this price applies to */
  productId: string;

  /** Specific variant (null = all variants of the product) */
  variantId: string | null;

  /** SKU for quick lookup */
  sku: string | null;

  /** Base unit price at this price list level */
  unitPrice: number;

  /** Optional compare-at price (shows as "was" price) */
  compareAtPrice: number | null;

  /** Volume-based pricing tiers */
  tiers: PricingTier[];

  /** Minimum order quantity for this item */
  minimumQuantity: number;

  /** Case pack size (orders must be in multiples of this) */
  casePackSize: number | null;

  /** Per-unit cost (for margin calculations, not shown to buyers) */
  costPrice: number | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * A volume-based pricing tier within a price list item.
 */
interface PricingTier {
  /** Minimum quantity for this tier to apply */
  minQuantity: number;

  /** Maximum quantity (null = unlimited) */
  maxQuantity: number | null;

  /** Unit price at this tier */
  unitPrice: number;

  /** Optional label (e.g., "Case Price", "Pallet Price") */
  label: string | null;
}
```

### PriceResolutionResult

The output of the pricing engine when resolving a price for a product + account.

```typescript
/**
 * The result of resolving a wholesale price for a specific product,
 * account, and quantity combination.
 *
 * Includes the final price, the source that determined it, and a
 * complete audit trail showing every pricing source evaluated.
 */
interface PriceResolutionResult {
  /** The resolved unit price */
  unitPrice: number;

  /** Total price (unitPrice × quantity) */
  totalPrice: number;

  /** Quantity the price was resolved for */
  quantity: number;

  /** Currency code */
  currency: string;

  /** Which pricing source determined the final price */
  source: PricingSource;

  /** The specific pricing tier that matched (if volume-tiered) */
  tier: PricingTier | null;

  /** Price list that provided the price (if applicable) */
  priceListId: string | null;

  /** Contract ID that provided the price (if negotiated) */
  contractId: string | null;

  /** Discount applied (if any) */
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
    reason: string;
  } | null;

  /** Compare-at price for display (e.g., "was $10, now $7.50") */
  compareAtPrice: number | null;

  /** Complete audit trail of the resolution process */
  auditTrail: PriceResolutionStep[];

  /** Whether the price is below cost (flagged for review) */
  belowCost: boolean;

  /** Margin percentage (if cost price is known) */
  marginPercent: number | null;
}

type PricingSource =
  | 'negotiated_contract'
  | 'account_price_list'
  | 'customer_group'
  | 'volume_tier'
  | 'base_wholesale'
  | 'retail_discount';

interface PriceResolutionStep {
  source: PricingSource;
  evaluated: boolean;
  matched: boolean;
  price: number | null;
  reason: string;
  priceListId?: string;
  tierId?: string;
}

interface PriceResolutionContext {
  productId: string;
  variantId: string | null;
  quantity: number;
  accountId: string;
  customerGroupId: string | null;
  tenantId: string;
  currency: string;
  /** Override date for price list effectivity (default: now) */
  effectiveDate?: Date;
}
```

### Quote

Represents a formal price quote sent to a wholesale buyer.

```typescript
/**
 * A wholesale price quote.
 *
 * Quotes are versioned — each edit creates a new version. Only the
 * latest version is "active". Quotes have expiration dates and can
 * be converted to orders upon acceptance.
 */
interface Quote {
  id: string;
  tenantId: string;
  accountId: string;

  /** Human-readable quote number (e.g., "Q-2026-0042") */
  quoteNumber: string;

  /** Current version number (incremented on each revision) */
  version: number;

  /** Current status */
  status: QuoteStatus;

  /** Buyer who requested the quote (or null if rep-initiated) */
  requestedBy: string | null;

  /** Sales rep who created/owns the quote */
  createdByRepId: string | null;

  /** Quote items */
  items: QuoteItem[];

  /** Subtotal before tax/shipping */
  subtotal: number;

  /** Tax amount */
  taxAmount: number;

  /** Shipping/freight estimate */
  shippingAmount: number;

  /** Total quote value */
  total: number;

  /** Currency */
  currency: string;

  /** Payment terms offered in this quote */
  paymentTerms: string | null;

  /** Shipping terms / delivery method */
  shippingTerms: string | null;

  /** Estimated delivery date */
  estimatedDeliveryDate: Date | null;

  /** Internal notes (visible to reps only) */
  internalNotes: string | null;

  /** Customer-facing notes */
  customerNotes: string | null;

  /** Terms and conditions text */
  termsAndConditions: string | null;

  /** When the quote expires */
  expiresAt: Date;

  /** When the quote was sent to the buyer */
  sentAt: Date | null;

  /** When the buyer accepted the quote */
  acceptedAt: Date | null;

  /** Order ID if the quote was converted to an order */
  convertedOrderId: string | null;

  /** When the quote was converted to an order */
  convertedAt: Date | null;

  /** Custom fields */
  customFields: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

type QuoteStatus =
  | 'draft'          // Being created/edited by rep
  | 'pending_review' // Submitted for internal approval
  | 'approved'       // Internally approved, ready to send
  | 'sent'           // Sent to buyer
  | 'viewed'         // Buyer has opened the quote
  | 'accepted'       // Buyer accepted
  | 'rejected'       // Buyer rejected
  | 'expired'        // Past expiration date
  | 'converted'      // Successfully converted to order
  | 'cancelled';     // Cancelled by rep/admin

interface QuoteItem {
  id: string;
  quoteId: string;

  productId: string;
  variantId: string | null;
  sku: string;
  name: string;
  description: string | null;

  quantity: number;

  /** Unit price offered in this quote */
  unitPrice: number;

  /** Original/list price (for showing discount) */
  listPrice: number;

  /** Line total */
  lineTotal: number;

  /** Discount percentage from list price */
  discountPercent: number;

  /** Per-item notes */
  notes: string | null;

  /** Sort order within the quote */
  sortOrder: number;
}

interface QuoteVersion {
  id: string;
  quoteId: string;
  version: number;
  snapshot: Quote;
  changedBy: string;
  changeReason: string | null;
  createdAt: Date;
}
```

### BulkOrder

Represents a wholesale order assembled from bulk ordering interfaces.

```typescript
/**
 * A bulk order being assembled by a wholesale buyer.
 *
 * Bulk orders can be built from multiple sources: quick-order forms,
 * CSV uploads, reorder history, or quote conversions. They go through
 * validation (minimums, case packs, credit) before placement.
 */
interface BulkOrder {
  id: string;
  tenantId: string;
  accountId: string;
  buyerId: string;

  /** Order source */
  source: BulkOrderSource;

  /** Current status */
  status: BulkOrderStatus;

  /** Line items */
  lines: BulkOrderLine[];

  /** Resolved pricing for all lines */
  pricing: {
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    total: number;
    currency: string;
  };

  /** Minimum order validation results */
  minimumOrderValidation: MinimumOrderValidationResult;

  /** Credit check result */
  creditCheck: CreditCheckResult | null;

  /** Quote this order was derived from (if any) */
  sourceQuoteId: string | null;

  /** PO number provided by the buyer */
  purchaseOrderNumber: string | null;

  /** Requested delivery date */
  requestedDeliveryDate: Date | null;

  /** Shipping address override (null = account default) */
  shippingAddressId: string | null;

  /** Order-level notes */
  notes: string | null;

  /** If placed by a rep on behalf of the buyer */
  placedByRepId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

type BulkOrderSource =
  | 'quick_order'    // SKU + quantity form
  | 'csv_upload'     // CSV file import
  | 'reorder'        // Reorder from history
  | 'quote'          // Converted from quote
  | 'draft'          // Manually assembled draft
  | 'rep_assisted';  // Placed by sales rep

type BulkOrderStatus =
  | 'draft'
  | 'validating'
  | 'validation_failed'
  | 'pending_approval'
  | 'approved'
  | 'placing'
  | 'placed'
  | 'failed';

interface BulkOrderLine {
  id: string;
  orderId: string;

  productId: string;
  variantId: string | null;
  sku: string;
  name: string;

  /** Requested quantity */
  quantity: number;

  /** Resolved unit price */
  unitPrice: number;

  /** Line total */
  lineTotal: number;

  /** Price resolution details */
  priceResolution: PriceResolutionResult;

  /** Validation issues on this line */
  validationIssues: LineValidationIssue[];

  /** Whether this line is valid */
  isValid: boolean;
}

interface LineValidationIssue {
  type: 'minimum_quantity' | 'case_pack' | 'out_of_stock' | 'discontinued' | 'invalid_sku' | 'price_changed';
  message: string;
  severity: 'error' | 'warning';
  suggestedQuantity?: number;
}
```

### CreditTerms

Defines payment terms and credit limits for wholesale accounts.

```typescript
/**
 * Credit terms assigned to a wholesale account.
 *
 * Defines payment terms (Net 30, Net 60, etc.), credit limits,
 * and early payment discounts.
 */
interface CreditTerms {
  id: string;
  tenantId: string;
  accountId: string;

  /** Payment term type */
  termType: NetTermType;

  /** Number of days until payment is due */
  netDays: number;

  /** Credit limit in account currency */
  creditLimit: number;

  /** Current outstanding balance */
  outstandingBalance: number;

  /** Available credit (creditLimit - outstandingBalance) */
  availableCredit: number;

  /** Currency */
  currency: string;

  /** Early payment discount (e.g., 2/10 Net 30 = 2% if paid in 10 days) */
  earlyPaymentDiscount: {
    discountPercent: number;
    withinDays: number;
  } | null;

  /** Whether the credit is currently frozen (no new orders) */
  isFrozen: boolean;

  /** Reason for freezing */
  frozenReason: string | null;

  /** When the credit terms were last reviewed */
  lastReviewedAt: Date | null;

  /** Next scheduled review date */
  nextReviewAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

type NetTermType =
  | 'net_15'
  | 'net_30'
  | 'net_45'
  | 'net_60'
  | 'net_90'
  | 'due_on_receipt'
  | 'prepaid'
  | 'custom';

/**
 * A credit application submitted by a prospective or existing
 * wholesale account requesting credit terms.
 */
interface CreditApplication {
  id: string;
  tenantId: string;
  accountId: string;

  /** Requested credit limit */
  requestedCreditLimit: number;

  /** Requested payment terms */
  requestedTerms: NetTermType;

  /** Application status */
  status: CreditApplicationStatus;

  /** Business financial information */
  financialInfo: {
    annualRevenue: number | null;
    yearsInBusiness: number | null;
    bankName: string | null;
    bankContactPhone: string | null;
    dunsNumber: string | null;
  };

  /** Trade references */
  tradeReferences: TradeReference[];

  /** Internal credit score (calculated) */
  creditScore: number | null;

  /** Decision notes from the reviewer */
  decisionNotes: string | null;

  /** Approved credit limit (may differ from requested) */
  approvedCreditLimit: number | null;

  /** Approved terms (may differ from requested) */
  approvedTerms: NetTermType | null;

  /** Who reviewed the application */
  reviewedBy: string | null;

  reviewedAt: Date | null;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

type CreditApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'denied'
  | 'more_info_needed';

interface TradeReference {
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  creditLimit: number | null;
  yearsAsCustomer: number | null;
}

/**
 * Aging report showing outstanding invoices grouped by age bucket.
 */
interface AgingReport {
  accountId: string;
  accountNumber: string;
  companyName: string;
  currency: string;

  /** Total outstanding balance */
  totalOutstanding: number;

  /** Credit limit */
  creditLimit: number;

  /** Buckets */
  current: AgingBucket;       // 0-30 days
  thirtyDays: AgingBucket;    // 31-60 days
  sixtyDays: AgingBucket;     // 61-90 days
  ninetyDays: AgingBucket;    // 91-120 days
  overHundredTwenty: AgingBucket; // 120+ days

  /** Individual invoices */
  invoices: AgingInvoice[];

  generatedAt: Date;
}

interface AgingBucket {
  amount: number;
  invoiceCount: number;
  percentage: number; // of total outstanding
}

interface AgingInvoice {
  invoiceId: string;
  invoiceNumber: string;
  orderId: string;
  amount: number;
  paidAmount: number;
  balance: number;
  issuedAt: Date;
  dueAt: Date;
  daysOverdue: number;
  status: 'current' | 'overdue' | 'paid' | 'partial' | 'written_off';
}

/**
 * Account statement for a billing period.
 */
interface AccountStatement {
  id: string;
  tenantId: string;
  accountId: string;

  /** Statement period */
  periodStart: Date;
  periodEnd: Date;

  /** Opening balance */
  openingBalance: number;

  /** Total charges during period */
  totalCharges: number;

  /** Total payments during period */
  totalPayments: number;

  /** Total credits/adjustments during period */
  totalCredits: number;

  /** Closing balance */
  closingBalance: number;

  currency: string;

  /** Line items */
  lineItems: StatementLineItem[];

  /** PDF URL */
  pdfUrl: string | null;

  /** When the statement was sent to the account */
  sentAt: Date | null;

  generatedAt: Date;
  createdAt: Date;
}

interface StatementLineItem {
  date: Date;
  type: 'charge' | 'payment' | 'credit' | 'adjustment';
  description: string;
  referenceNumber: string | null;
  amount: number;
  balance: number;
}
```

### SalesRep

Represents a sales representative managing wholesale accounts.

```typescript
/**
 * A sales representative in the wholesale organization.
 */
interface SalesRep {
  id: string;
  tenantId: string;

  /** Associated user account */
  userId: string;

  /** Employee / rep identifier */
  repCode: string;

  /** Display name */
  name: string;

  /** Contact email */
  email: string;

  /** Contact phone */
  phone: string | null;

  /** Whether the rep is currently active */
  isActive: boolean;

  /** Assigned territories */
  territoryIds: string[];

  /** Commission structure */
  commissionRuleId: string | null;

  /** Manager (for hierarchical sales orgs) */
  managerId: string | null;

  /** Maximum discount percentage this rep can offer without approval */
  maxDiscountPercent: number;

  /** Whether this rep can impersonate buyers to place orders */
  canImpersonate: boolean;

  /** Custom metadata */
  metadata: Record<string, unknown>;

  hiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A geographic or logical territory for sales assignment.
 */
interface Territory {
  id: string;
  tenantId: string;

  /** Territory name (e.g., "Northeast US", "EMEA - Germany") */
  name: string;

  /** Territory code */
  code: string;

  /** Description */
  description: string | null;

  /** Parent territory (for hierarchical territories) */
  parentId: string | null;

  /** Geographic definition (if applicable) */
  geography: {
    countries?: string[];
    states?: string[];
    postalCodeRanges?: Array<{ from: string; to: string }>;
    regions?: string[];
  } | null;

  /** Assigned sales reps */
  assignedRepIds: string[];

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Commission earned by a sales rep on an order.
 */
interface Commission {
  id: string;
  tenantId: string;
  repId: string;
  orderId: string;
  accountId: string;

  /** Order total the commission is based on */
  orderTotal: number;

  /** Commission rate applied */
  commissionRate: number;

  /** Commission amount earned */
  commissionAmount: number;

  /** Currency */
  currency: string;

  /** Commission status */
  status: 'pending' | 'approved' | 'paid' | 'reversed';

  /** Pay period this commission belongs to */
  periodId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Commission calculation rules.
 */
interface CommissionRule {
  id: string;
  tenantId: string;

  name: string;

  /** Base commission rate (percentage) */
  baseRate: number;

  /** Tiered rates based on revenue thresholds */
  tiers: CommissionTier[];

  /** Product category overrides */
  categoryOverrides: Array<{
    categoryId: string;
    rate: number;
  }>;

  /** Whether new accounts earn a higher rate */
  newAccountBonus: number | null;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CommissionTier {
  /** Minimum period revenue to qualify */
  minRevenue: number;
  /** Commission rate at this tier */
  rate: number;
  /** Label */
  label: string;
}
```

### TradeCatalog

Controls which products are visible to which wholesale customers.

```typescript
/**
 * A trade catalog defines a subset of products available to
 * specific wholesale customer groups or accounts.
 */
interface TradeCatalog {
  id: string;
  tenantId: string;

  /** Catalog name */
  name: string;

  /** Description */
  description: string | null;

  /** Visibility mode */
  visibility: CatalogVisibility;

  /** Product IDs included in this catalog */
  productIds: string[];

  /** Category IDs included (all products in these categories) */
  categoryIds: string[];

  /** Customer groups that can see this catalog */
  allowedGroupIds: string[];

  /** Specific accounts that can see this catalog (overrides groups) */
  allowedAccountIds: string[];

  /** Whether prices are hidden until the buyer logs in */
  hideUntilLogin: boolean;

  /** Whether out-of-stock items are shown */
  showOutOfStock: boolean;

  /** Sort order for catalog display */
  sortOrder: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type CatalogVisibility =
  | 'all_wholesale'    // All approved wholesale accounts
  | 'group_restricted' // Only specified customer groups
  | 'account_restricted' // Only specified accounts
  | 'invite_only';    // Must be explicitly invited

interface TradeCatalogAccess {
  id: string;
  catalogId: string;
  accountId: string | null;
  customerGroupId: string | null;
  grantedBy: string;
  grantedAt: Date;
  expiresAt: Date | null;
}
```

### WholesaleService

The primary orchestration service that coordinates all wholesale operations.

```typescript
/**
 * Primary wholesale commerce service.
 *
 * Orchestrates account management, pricing, ordering, credit,
 * and quote workflows. This is the main entry point for wholesale
 * operations in application code.
 */
interface WholesaleService {
  // === Account Operations ===
  createApplication(input: CreateApplicationInput): Promise<WholesaleAccount>;
  approveAccount(accountId: string, approvedBy: string): Promise<WholesaleAccount>;
  rejectAccount(accountId: string, reason: string, rejectedBy: string): Promise<WholesaleAccount>;
  suspendAccount(accountId: string, reason: string): Promise<WholesaleAccount>;
  reactivateAccount(accountId: string): Promise<WholesaleAccount>;
  getAccount(accountId: string): Promise<WholesaleAccount | null>;
  getAccountByNumber(accountNumber: string): Promise<WholesaleAccount | null>;
  listAccounts(filters: AccountFilters): Promise<PaginatedResult<WholesaleAccount>>;
  addBuyer(accountId: string, input: AddBuyerInput): Promise<AccountBuyer>;
  removeBuyer(accountId: string, buyerId: string): Promise<void>;
  updateBuyerRole(accountId: string, buyerId: string, role: AccountBuyerRole): Promise<AccountBuyer>;

  // === Pricing ===
  resolvePrice(context: PriceResolutionContext): Promise<PriceResolutionResult>;
  resolvePrices(contexts: PriceResolutionContext[]): Promise<PriceResolutionResult[]>;
  createPriceList(input: CreatePriceListInput): Promise<PriceList>;
  updatePriceList(priceListId: string, input: UpdatePriceListInput): Promise<PriceList>;
  addPriceListItems(priceListId: string, items: CreatePriceListItemInput[]): Promise<PriceListItem[]>;
  removePriceListItems(priceListId: string, itemIds: string[]): Promise<void>;
  assignPriceListToAccount(priceListId: string, accountId: string): Promise<void>;
  assignPriceListToGroup(priceListId: string, groupId: string): Promise<void>;
  getEffectivePriceList(accountId: string): Promise<PriceListItem[]>;

  // === Ordering ===
  createBulkOrder(input: CreateBulkOrderInput): Promise<BulkOrder>;
  parseCSVOrder(csvContent: string, accountId: string): Promise<CsvParseResult>;
  createFromCSV(csvContent: string, accountId: string, buyerId: string): Promise<BulkOrder>;
  createReorder(previousOrderId: string, buyerId: string): Promise<BulkOrder>;
  validateOrder(orderId: string): Promise<OrderValidationResult>;
  placeOrder(orderId: string): Promise<WholesaleOrderResult>;
  getDraftOrders(accountId: string): Promise<BulkOrder[]>;

  // === Quotes ===
  createRfq(input: CreateRfqInput): Promise<Quote>;
  createQuote(input: CreateQuoteInput): Promise<Quote>;
  updateQuote(quoteId: string, input: UpdateQuoteInput): Promise<Quote>;
  submitQuoteForApproval(quoteId: string): Promise<Quote>;
  approveQuote(quoteId: string, approvedBy: string): Promise<Quote>;
  sendQuote(quoteId: string): Promise<Quote>;
  acceptQuote(quoteId: string, buyerId: string): Promise<Quote>;
  rejectQuote(quoteId: string, reason: string): Promise<Quote>;
  convertQuoteToOrder(quoteId: string, buyerId: string): Promise<BulkOrder>;
  getQuote(quoteId: string): Promise<Quote | null>;
  listQuotes(accountId: string, filters: QuoteFilters): Promise<PaginatedResult<Quote>>;
  getQuoteVersions(quoteId: string): Promise<QuoteVersion[]>;

  // === Credit & Terms ===
  submitCreditApplication(input: CreateCreditApplicationInput): Promise<CreditApplication>;
  reviewCreditApplication(applicationId: string, decision: CreditDecision): Promise<CreditApplication>;
  getCreditTerms(accountId: string): Promise<CreditTerms | null>;
  updateCreditLimit(accountId: string, newLimit: number, reason: string): Promise<CreditTerms>;
  freezeCredit(accountId: string, reason: string): Promise<CreditTerms>;
  unfreezeCredit(accountId: string): Promise<CreditTerms>;
  checkCredit(accountId: string, orderAmount: number): Promise<CreditCheckResult>;
  getAgingReport(accountId: string): Promise<AgingReport>;
  generateStatement(accountId: string, periodStart: Date, periodEnd: Date): Promise<AccountStatement>;
  recordPayment(accountId: string, input: RecordPaymentInput): Promise<void>;

  // === Trade Catalogs ===
  createCatalog(input: CreateCatalogInput): Promise<TradeCatalog>;
  updateCatalog(catalogId: string, input: UpdateCatalogInput): Promise<TradeCatalog>;
  getVisibleProducts(accountId: string, filters: ProductFilters): Promise<PaginatedResult<WholesaleProduct>>;
  grantCatalogAccess(catalogId: string, accountId: string): Promise<TradeCatalogAccess>;
  revokeCatalogAccess(catalogId: string, accountId: string): Promise<void>;

  // === Sales Organization ===
  assignRep(accountId: string, repId: string): Promise<void>;
  unassignRep(accountId: string): Promise<void>;
  getRepAccounts(repId: string): Promise<WholesaleAccount[]>;
  calculateCommission(orderId: string): Promise<Commission>;
  getRepPerformance(repId: string, period: DateRange): Promise<RepPerformanceMetrics>;
  impersonateBuyer(repId: string, accountId: string, buyerId: string): Promise<ImpersonationSession>;

  // === Analytics ===
  getAccountAnalytics(accountId: string, period: DateRange): Promise<AccountAnalytics>;
  getWholesaleOverview(tenantId: string, period: DateRange): Promise<WholesaleOverview>;
  getReorderSuggestions(accountId: string): Promise<ReorderSuggestion[]>;
}
```

### MinimumOrderRule & Validation

```typescript
/**
 * Minimum order rules that wholesale orders must satisfy.
 */
interface MinimumOrderRule {
  id: string;
  tenantId: string;

  /** Rule name */
  name: string;

  /** Rule type */
  type: MinimumOrderRuleType;

  /** Which accounts/groups this rule applies to */
  scope: {
    allAccounts: boolean;
    accountIds: string[];
    customerGroupIds: string[];
  };

  /** Minimum value (currency amount or quantity, depending on type) */
  minimumValue: number;

  /** Product/category scope (null = all products) */
  productScope: {
    allProducts: boolean;
    productIds: string[];
    categoryIds: string[];
  };

  /** Whether to block order or just warn */
  enforcement: 'block' | 'warn';

  /** Custom message shown when the minimum is not met */
  message: string | null;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type MinimumOrderRuleType =
  | 'min_order_value'        // Total order must be ≥ $X
  | 'min_quantity_per_sku'   // Each SKU must have ≥ N units
  | 'min_total_quantity'     // Total units across all SKUs ≥ N
  | 'case_pack'             // Quantity must be multiple of case pack size
  | 'mixed_case_max'        // Max number of unique SKUs in a mixed case
  | 'min_line_items';       // Order must have ≥ N distinct line items

interface MinimumOrderValidationResult {
  isValid: boolean;
  violations: MinimumOrderViolation[];
  warnings: MinimumOrderViolation[];
}

interface MinimumOrderViolation {
  ruleId: string;
  ruleType: MinimumOrderRuleType;
  message: string;
  currentValue: number;
  requiredValue: number;
  affectedLineIds: string[];
  suggestedFix: string | null;
}

interface CreditCheckResult {
  approved: boolean;
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;
  orderAmount: number;
  remainingAfterOrder: number;
  reason: string | null;
  isFrozen: boolean;
}
```

### Analytics Interfaces

```typescript
/**
 * Account-level analytics for a date range.
 */
interface AccountAnalytics {
  accountId: string;
  period: DateRange;

  /** Revenue metrics */
  revenue: {
    total: number;
    orderCount: number;
    averageOrderValue: number;
    largestOrder: number;
    smallestOrder: number;
  };

  /** Ordering patterns */
  ordering: {
    averageDaysBetweenOrders: number;
    lastOrderDate: Date | null;
    daysSinceLastOrder: number;
    topProducts: Array<{
      productId: string;
      sku: string;
      name: string;
      totalQuantity: number;
      totalRevenue: number;
    }>;
    ordersByMonth: Array<{
      month: string;
      orderCount: number;
      revenue: number;
    }>;
  };

  /** Credit metrics */
  credit: {
    creditLimit: number;
    currentBalance: number;
    utilizationPercent: number;
    averageDaysToPayment: number;
    latePaymentCount: number;
    onTimePaymentPercent: number;
  };

  /** Quote metrics */
  quotes: {
    totalQuotes: number;
    acceptedQuotes: number;
    rejectedQuotes: number;
    conversionRate: number;
    averageQuoteValue: number;
  };
}

/**
 * Sales rep performance metrics.
 */
interface RepPerformanceMetrics {
  repId: string;
  period: DateRange;

  /** Revenue generated */
  totalRevenue: number;

  /** Number of orders placed through/by this rep */
  orderCount: number;

  /** Average order value */
  averageOrderValue: number;

  /** Number of active accounts */
  activeAccountCount: number;

  /** New accounts acquired */
  newAccountCount: number;

  /** Quote metrics */
  quotesCreated: number;
  quotesAccepted: number;
  quoteConversionRate: number;
  averageQuoteValue: number;

  /** Commission earned */
  totalCommission: number;

  /** Ranking among all reps */
  revenueRank: number;

  /** Revenue by account */
  topAccounts: Array<{
    accountId: string;
    accountNumber: string;
    companyName: string;
    revenue: number;
    orderCount: number;
  }>;
}

/**
 * Reorder suggestion based on account purchase history.
 */
interface ReorderSuggestion {
  accountId: string;
  productId: string;
  variantId: string | null;
  sku: string;
  name: string;

  /** Average quantity ordered */
  averageQuantity: number;

  /** Suggested reorder quantity */
  suggestedQuantity: number;

  /** Average days between orders for this product */
  averageDaysBetweenOrders: number;

  /** Days since this product was last ordered */
  daysSinceLastOrder: number;

  /** Whether this product is "overdue" for reorder */
  isOverdue: boolean;

  /** Last price paid */
  lastUnitPrice: number;

  /** Current price */
  currentUnitPrice: number;

  /** Price change percentage */
  priceChangePercent: number;

  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Account health score for at-a-glance assessment.
 */
interface AccountHealthScore {
  accountId: string;

  /** Overall score (0-100) */
  overallScore: number;

  /** Component scores */
  components: {
    /** Payment behavior score */
    paymentHealth: number;
    /** Order frequency / growth score */
    orderingHealth: number;
    /** Credit utilization score */
    creditHealth: number;
    /** Engagement / recency score */
    engagementHealth: number;
  };

  /** Risk level derived from overall score */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';

  /** Specific risk flags */
  flags: string[];

  /** Actionable recommendations */
  recommendations: string[];

  calculatedAt: Date;
}

interface WholesaleOverview {
  tenantId: string;
  period: DateRange;

  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  activeAccounts: number;
  newAccounts: number;
  pendingApplications: number;
  pendingQuotes: number;
  totalOutstanding: number;
  overdueAmount: number;
  overdueAccountCount: number;

  revenueByMonth: Array<{ month: string; revenue: number }>;
  topAccounts: Array<{ accountId: string; companyName: string; revenue: number }>;
  topProducts: Array<{ productId: string; sku: string; name: string; revenue: number }>;
  repLeaderboard: Array<{ repId: string; name: string; revenue: number; orderCount: number }>;
}
```

---

## Database Schemas

All tables use Supabase PostgreSQL with Row Level Security (RLS) enabled. Schemas are defined using Drizzle ORM.

### wholesale_accounts

```typescript
import { pgTable, uuid, text, timestamp, jsonb, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const wholesaleAccountStatusEnum = pgEnum('wholesale_account_status', [
  'pending', 'under_review', 'approved', 'suspended', 'closed', 'rejected',
]);

export const wholesaleAccounts = pgTable('wholesale_accounts', {
  id:                  uuid('id').defaultRandom().primaryKey(),
  tenantId:            uuid('tenant_id').notNull().references(() => tenants.id),
  accountNumber:       text('account_number').notNull().unique(),
  status:              wholesaleAccountStatusEnum('status').notNull().default('pending'),
  companyProfile:      jsonb('company_profile').notNull().$type<CompanyProfile>(),
  customerGroupId:     uuid('customer_group_id'),
  salesRepId:          uuid('sales_rep_id').references(() => salesReps.id),
  territoryId:         uuid('territory_id').references(() => territories.id),
  creditTermsId:       uuid('credit_terms_id').references(() => creditTerms.id),
  priceListIds:        uuid('price_list_ids').array().notNull().default([]),
  defaultPaymentMethodId: uuid('default_payment_method_id'),
  taxExemptionId:      text('tax_exemption_id'),
  taxExemptVerified:   boolean('tax_exempt_verified').notNull().default(false),
  internalNotes:       text('internal_notes'),
  tags:                text('tags').array().notNull().default([]),
  metadata:            jsonb('metadata').notNull().default({}),
  appliedAt:           timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
  approvedAt:          timestamp('approved_at', { withTimezone: true }),
  approvedBy:          uuid('approved_by'),
  lastActiveAt:        timestamp('last_active_at', { withTimezone: true }),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### account_buyers

```typescript
export const accountBuyerRoleEnum = pgEnum('account_buyer_role', [
  'admin', 'buyer', 'viewer',
]);

export const accountBuyers = pgTable('account_buyers', {
  id:               uuid('id').defaultRandom().primaryKey(),
  accountId:        uuid('account_id').notNull().references(() => wholesaleAccounts.id, { onDelete: 'cascade' }),
  userId:           uuid('user_id').notNull(),
  role:             accountBuyerRoleEnum('role').notNull().default('buyer'),
  orderLimit:       numeric('order_limit', { precision: 12, scale: 2 }),
  requiresApproval: boolean('requires_approval').notNull().default(false),
  canCreateQuotes:  boolean('can_create_quotes').notNull().default(true),
  canApproveQuotes: boolean('can_approve_quotes').notNull().default(false),
  displayName:      text('display_name').notNull(),
  email:            text('email').notNull(),
  isActive:         boolean('is_active').notNull().default(true),
  invitedAt:        timestamp('invited_at', { withTimezone: true }).notNull().defaultNow(),
  acceptedAt:       timestamp('accepted_at', { withTimezone: true }),
  lastLoginAt:      timestamp('last_login_at', { withTimezone: true }),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueBuyerPerAccount: unique().on(table.accountId, table.userId),
}));
```

### price_lists & price_list_items

```typescript
export const priceLists = pgTable('price_lists', {
  id:              uuid('id').defaultRandom().primaryKey(),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  name:            text('name').notNull(),
  description:     text('description'),
  currency:        text('currency').notNull().default('USD'),
  priority:        integer('priority').notNull().default(0),
  isContract:      boolean('is_contract').notNull().default(false),
  accountId:       uuid('account_id').references(() => wholesaleAccounts.id),
  customerGroupId: uuid('customer_group_id'),
  effectiveFrom:   timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  effectiveTo:     timestamp('effective_to', { withTimezone: true }),
  isActive:        boolean('is_active').notNull().default(true),
  itemCount:       integer('item_count').notNull().default(0),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const priceListItems = pgTable('price_list_items', {
  id:              uuid('id').defaultRandom().primaryKey(),
  priceListId:     uuid('price_list_id').notNull().references(() => priceLists.id, { onDelete: 'cascade' }),
  productId:       uuid('product_id').notNull(),
  variantId:       uuid('variant_id'),
  sku:             text('sku'),
  unitPrice:       numeric('unit_price', { precision: 12, scale: 4 }).notNull(),
  compareAtPrice:  numeric('compare_at_price', { precision: 12, scale: 4 }),
  tiers:           jsonb('tiers').notNull().default([]).$type<PricingTier[]>(),
  minimumQuantity: integer('minimum_quantity').notNull().default(1),
  casePackSize:    integer('case_pack_size'),
  costPrice:       numeric('cost_price', { precision: 12, scale: 4 }),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueProductInList: unique().on(table.priceListId, table.productId, table.variantId),
  skuIndex: index('idx_price_list_items_sku').on(table.sku),
}));

export const priceListAssignments = pgTable('price_list_assignments', {
  id:              uuid('id').defaultRandom().primaryKey(),
  priceListId:     uuid('price_list_id').notNull().references(() => priceLists.id, { onDelete: 'cascade' }),
  accountId:       uuid('account_id').references(() => wholesaleAccounts.id),
  customerGroupId: uuid('customer_group_id'),
  assignedBy:      uuid('assigned_by').notNull(),
  assignedAt:      timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueAssignment: unique().on(table.priceListId, table.accountId, table.customerGroupId),
}));
```

### quotes & quote_items

```typescript
export const quoteStatusEnum = pgEnum('quote_status', [
  'draft', 'pending_review', 'approved', 'sent', 'viewed',
  'accepted', 'rejected', 'expired', 'converted', 'cancelled',
]);

export const quotes = pgTable('quotes', {
  id:                   uuid('id').defaultRandom().primaryKey(),
  tenantId:             uuid('tenant_id').notNull().references(() => tenants.id),
  accountId:            uuid('account_id').notNull().references(() => wholesaleAccounts.id),
  quoteNumber:          text('quote_number').notNull().unique(),
  version:              integer('version').notNull().default(1),
  status:               quoteStatusEnum('status').notNull().default('draft'),
  requestedBy:          uuid('requested_by'),
  createdByRepId:       uuid('created_by_rep_id').references(() => salesReps.id),
  subtotal:             numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
  taxAmount:            numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  shippingAmount:       numeric('shipping_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  total:                numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
  currency:             text('currency').notNull().default('USD'),
  paymentTerms:         text('payment_terms'),
  shippingTerms:        text('shipping_terms'),
  estimatedDeliveryDate: timestamp('estimated_delivery_date', { withTimezone: true }),
  internalNotes:        text('internal_notes'),
  customerNotes:        text('customer_notes'),
  termsAndConditions:   text('terms_and_conditions'),
  expiresAt:            timestamp('expires_at', { withTimezone: true }).notNull(),
  sentAt:               timestamp('sent_at', { withTimezone: true }),
  acceptedAt:           timestamp('accepted_at', { withTimezone: true }),
  convertedOrderId:     uuid('converted_order_id'),
  convertedAt:          timestamp('converted_at', { withTimezone: true }),
  customFields:         jsonb('custom_fields').notNull().default({}),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const quoteItems = pgTable('quote_items', {
  id:              uuid('id').defaultRandom().primaryKey(),
  quoteId:         uuid('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  productId:       uuid('product_id').notNull(),
  variantId:       uuid('variant_id'),
  sku:             text('sku').notNull(),
  name:            text('name').notNull(),
  description:     text('description'),
  quantity:        integer('quantity').notNull(),
  unitPrice:       numeric('unit_price', { precision: 12, scale: 4 }).notNull(),
  listPrice:       numeric('list_price', { precision: 12, scale: 4 }).notNull(),
  lineTotal:       numeric('line_total', { precision: 12, scale: 2 }).notNull(),
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }).notNull().default('0'),
  notes:           text('notes'),
  sortOrder:       integer('sort_order').notNull().default(0),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const quoteVersions = pgTable('quote_versions', {
  id:           uuid('id').defaultRandom().primaryKey(),
  quoteId:      uuid('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  version:      integer('version').notNull(),
  snapshot:     jsonb('snapshot').notNull().$type<Quote>(),
  changedBy:    uuid('changed_by').notNull(),
  changeReason: text('change_reason'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueVersion: unique().on(table.quoteId, table.version),
}));
```

### credit_terms & credit_applications

```typescript
export const netTermTypeEnum = pgEnum('net_term_type', [
  'net_15', 'net_30', 'net_45', 'net_60', 'net_90',
  'due_on_receipt', 'prepaid', 'custom',
]);

export const creditTerms = pgTable('credit_terms', {
  id:                   uuid('id').defaultRandom().primaryKey(),
  tenantId:             uuid('tenant_id').notNull().references(() => tenants.id),
  accountId:            uuid('account_id').notNull().references(() => wholesaleAccounts.id).unique(),
  termType:             netTermTypeEnum('term_type').notNull().default('net_30'),
  netDays:              integer('net_days').notNull().default(30),
  creditLimit:          numeric('credit_limit', { precision: 12, scale: 2 }).notNull(),
  outstandingBalance:   numeric('outstanding_balance', { precision: 12, scale: 2 }).notNull().default('0'),
  availableCredit:      numeric('available_credit', { precision: 12, scale: 2 }).notNull(),
  currency:             text('currency').notNull().default('USD'),
  earlyPaymentDiscount: jsonb('early_payment_discount'),
  isFrozen:             boolean('is_frozen').notNull().default(false),
  frozenReason:         text('frozen_reason'),
  lastReviewedAt:       timestamp('last_reviewed_at', { withTimezone: true }),
  nextReviewAt:         timestamp('next_review_at', { withTimezone: true }),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const creditApplicationStatusEnum = pgEnum('credit_application_status', [
  'draft', 'submitted', 'under_review', 'approved', 'denied', 'more_info_needed',
]);

export const creditApplications = pgTable('credit_applications', {
  id:                    uuid('id').defaultRandom().primaryKey(),
  tenantId:              uuid('tenant_id').notNull().references(() => tenants.id),
  accountId:             uuid('account_id').notNull().references(() => wholesaleAccounts.id),
  requestedCreditLimit:  numeric('requested_credit_limit', { precision: 12, scale: 2 }).notNull(),
  requestedTerms:        netTermTypeEnum('requested_terms').notNull(),
  status:                creditApplicationStatusEnum('status').notNull().default('draft'),
  financialInfo:         jsonb('financial_info').notNull().default({}),
  tradeReferences:       jsonb('trade_references').notNull().default([]).$type<TradeReference[]>(),
  creditScore:           integer('credit_score'),
  decisionNotes:         text('decision_notes'),
  approvedCreditLimit:   numeric('approved_credit_limit', { precision: 12, scale: 2 }),
  approvedTerms:         netTermTypeEnum('approved_terms'),
  reviewedBy:            uuid('reviewed_by'),
  reviewedAt:            timestamp('reviewed_at', { withTimezone: true }),
  submittedAt:           timestamp('submitted_at', { withTimezone: true }),
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### sales_reps & territories

```typescript
export const salesReps = pgTable('sales_reps', {
  id:                uuid('id').defaultRandom().primaryKey(),
  tenantId:          uuid('tenant_id').notNull().references(() => tenants.id),
  userId:            uuid('user_id').notNull(),
  repCode:           text('rep_code').notNull(),
  name:              text('name').notNull(),
  email:             text('email').notNull(),
  phone:             text('phone'),
  isActive:          boolean('is_active').notNull().default(true),
  commissionRuleId:  uuid('commission_rule_id').references(() => commissionRules.id),
  managerId:         uuid('manager_id').references(() => salesReps.id),
  maxDiscountPercent: numeric('max_discount_percent', { precision: 5, scale: 2 }).notNull().default('10'),
  canImpersonate:    boolean('can_impersonate').notNull().default(false),
  metadata:          jsonb('metadata').notNull().default({}),
  hiredAt:           timestamp('hired_at', { withTimezone: true }).notNull(),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueRepCode: unique().on(table.tenantId, table.repCode),
}));

export const territories = pgTable('territories', {
  id:            uuid('id').defaultRandom().primaryKey(),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  name:          text('name').notNull(),
  code:          text('code').notNull(),
  description:   text('description'),
  parentId:      uuid('parent_id').references(() => territories.id),
  geography:     jsonb('geography'),
  isActive:      boolean('is_active').notNull().default(true),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueTerritoryCode: unique().on(table.tenantId, table.code),
}));

export const territoryAssignments = pgTable('territory_assignments', {
  id:           uuid('id').defaultRandom().primaryKey(),
  territoryId:  uuid('territory_id').notNull().references(() => territories.id, { onDelete: 'cascade' }),
  repId:        uuid('rep_id').notNull().references(() => salesReps.id, { onDelete: 'cascade' }),
  isPrimary:    boolean('is_primary').notNull().default(false),
  assignedAt:   timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueAssignment: unique().on(table.territoryId, table.repId),
}));

export const commissionRules = pgTable('commission_rules', {
  id:               uuid('id').defaultRandom().primaryKey(),
  tenantId:         uuid('tenant_id').notNull().references(() => tenants.id),
  name:             text('name').notNull(),
  baseRate:         numeric('base_rate', { precision: 5, scale: 4 }).notNull(),
  tiers:            jsonb('tiers').notNull().default([]).$type<CommissionTier[]>(),
  categoryOverrides: jsonb('category_overrides').notNull().default([]),
  newAccountBonus:  numeric('new_account_bonus', { precision: 5, scale: 4 }),
  isActive:         boolean('is_active').notNull().default(true),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const commissions = pgTable('commissions', {
  id:               uuid('id').defaultRandom().primaryKey(),
  tenantId:         uuid('tenant_id').notNull().references(() => tenants.id),
  repId:            uuid('rep_id').notNull().references(() => salesReps.id),
  orderId:          uuid('order_id').notNull(),
  accountId:        uuid('account_id').notNull().references(() => wholesaleAccounts.id),
  orderTotal:       numeric('order_total', { precision: 12, scale: 2 }).notNull(),
  commissionRate:   numeric('commission_rate', { precision: 5, scale: 4 }).notNull(),
  commissionAmount: numeric('commission_amount', { precision: 12, scale: 2 }).notNull(),
  currency:         text('currency').notNull().default('USD'),
  status:           text('status').notNull().default('pending'),
  periodId:         uuid('period_id'),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### wholesale_orders & account_statements

```typescript
export const wholesaleOrders = pgTable('wholesale_orders', {
  id:                    uuid('id').defaultRandom().primaryKey(),
  tenantId:              uuid('tenant_id').notNull().references(() => tenants.id),
  accountId:             uuid('account_id').notNull().references(() => wholesaleAccounts.id),
  buyerId:               uuid('buyer_id').notNull().references(() => accountBuyers.id),
  orderNumber:           text('order_number').notNull().unique(),
  source:                text('source').notNull(),
  status:                text('status').notNull().default('draft'),
  subtotal:              numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxAmount:             numeric('tax_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  shippingAmount:        numeric('shipping_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  total:                 numeric('total', { precision: 12, scale: 2 }).notNull(),
  currency:              text('currency').notNull().default('USD'),
  purchaseOrderNumber:   text('purchase_order_number'),
  sourceQuoteId:         uuid('source_quote_id').references(() => quotes.id),
  requestedDeliveryDate: timestamp('requested_delivery_date', { withTimezone: true }),
  shippingAddressId:     uuid('shipping_address_id'),
  notes:                 text('notes'),
  placedByRepId:         uuid('placed_by_rep_id').references(() => salesReps.id),
  creditCheckResult:     jsonb('credit_check_result'),
  minimumOrderValidation: jsonb('minimum_order_validation'),
  placedAt:              timestamp('placed_at', { withTimezone: true }),
  coreOrderId:           uuid('core_order_id'), // Reference to @mcv/commerce core order
  createdAt:             timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:             timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const wholesaleOrderLines = pgTable('wholesale_order_lines', {
  id:              uuid('id').defaultRandom().primaryKey(),
  orderId:         uuid('order_id').notNull().references(() => wholesaleOrders.id, { onDelete: 'cascade' }),
  productId:       uuid('product_id').notNull(),
  variantId:       uuid('variant_id'),
  sku:             text('sku').notNull(),
  name:            text('name').notNull(),
  quantity:        integer('quantity').notNull(),
  unitPrice:       numeric('unit_price', { precision: 12, scale: 4 }).notNull(),
  lineTotal:       numeric('line_total', { precision: 12, scale: 2 }).notNull(),
  priceResolution: jsonb('price_resolution').notNull().$type<PriceResolutionResult>(),
  sortOrder:       integer('sort_order').notNull().default(0),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const accountStatements = pgTable('account_statements', {
  id:              uuid('id').defaultRandom().primaryKey(),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  accountId:       uuid('account_id').notNull().references(() => wholesaleAccounts.id),
  periodStart:     timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd:       timestamp('period_end', { withTimezone: true }).notNull(),
  openingBalance:  numeric('opening_balance', { precision: 12, scale: 2 }).notNull(),
  totalCharges:    numeric('total_charges', { precision: 12, scale: 2 }).notNull(),
  totalPayments:   numeric('total_payments', { precision: 12, scale: 2 }).notNull(),
  totalCredits:    numeric('total_credits', { precision: 12, scale: 2 }).notNull(),
  closingBalance:  numeric('closing_balance', { precision: 12, scale: 2 }).notNull(),
  currency:        text('currency').notNull().default('USD'),
  lineItems:       jsonb('line_items').notNull().default([]).$type<StatementLineItem[]>(),
  pdfUrl:          text('pdf_url'),
  sentAt:          timestamp('sent_at', { withTimezone: true }),
  generatedAt:     timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### trade_catalogs & minimum_order_rules

```typescript
export const catalogVisibilityEnum = pgEnum('catalog_visibility', [
  'all_wholesale', 'group_restricted', 'account_restricted', 'invite_only',
]);

export const tradeCatalogs = pgTable('trade_catalogs', {
  id:              uuid('id').defaultRandom().primaryKey(),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  name:            text('name').notNull(),
  description:     text('description'),
  visibility:      catalogVisibilityEnum('visibility').notNull().default('all_wholesale'),
  productIds:      uuid('product_ids').array().notNull().default([]),
  categoryIds:     uuid('category_ids').array().notNull().default([]),
  allowedGroupIds: uuid('allowed_group_ids').array().notNull().default([]),
  allowedAccountIds: uuid('allowed_account_ids').array().notNull().default([]),
  hideUntilLogin:  boolean('hide_until_login').notNull().default(true),
  showOutOfStock:  boolean('show_out_of_stock').notNull().default(false),
  sortOrder:       integer('sort_order').notNull().default(0),
  isActive:        boolean('is_active').notNull().default(true),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tradeCatalogAccess = pgTable('trade_catalog_access', {
  id:              uuid('id').defaultRandom().primaryKey(),
  catalogId:       uuid('catalog_id').notNull().references(() => tradeCatalogs.id, { onDelete: 'cascade' }),
  accountId:       uuid('account_id').references(() => wholesaleAccounts.id),
  customerGroupId: uuid('customer_group_id'),
  grantedBy:       uuid('granted_by').notNull(),
  grantedAt:       timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt:       timestamp('expires_at', { withTimezone: true }),
});

export const minimumOrderRuleTypeEnum = pgEnum('minimum_order_rule_type', [
  'min_order_value', 'min_quantity_per_sku', 'min_total_quantity',
  'case_pack', 'mixed_case_max', 'min_line_items',
]);

export const minimumOrderRules = pgTable('minimum_order_rules', {
  id:            uuid('id').defaultRandom().primaryKey(),
  tenantId:      uuid('tenant_id').notNull().references(() => tenants.id),
  name:          text('name').notNull(),
  type:          minimumOrderRuleTypeEnum('type').notNull(),
  scope:         jsonb('scope').notNull(),
  minimumValue:  numeric('minimum_value', { precision: 12, scale: 2 }).notNull(),
  productScope:  jsonb('product_scope').notNull(),
  enforcement:   text('enforcement').notNull().default('block'),
  message:       text('message'),
  isActive:      boolean('is_active').notNull().default(true),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## Code Examples

### Example 1: Submit a Wholesale Account Application

```typescript
import { createWholesaleService } from '@mcv/commerce/wholesale';

const wholesale = createWholesaleService({ db, tenantId });

// A new business submits an application
const account = await wholesale.createApplication({
  companyProfile: {
    legalName: 'Sunrise Coffee Roasters LLC',
    tradeName: 'Sunrise Coffee',
    taxId: '87-1234567',
    dunsNumber: null,
    industry: 'Food & Beverage - Coffee',
    annualRevenueRange: '$1M-$5M',
    employeeCountRange: '10-50',
    yearEstablished: 2018,
    website: 'https://sunrisecoffee.example.com',
    billingAddress: {
      line1: '456 Roaster Way',
      line2: 'Suite 200',
      city: 'Portland',
      state: 'OR',
      postalCode: '97201',
      country: 'US',
    },
    shippingAddress: {
      line1: '789 Warehouse Blvd',
      city: 'Portland',
      state: 'OR',
      postalCode: '97203',
      country: 'US',
    },
    additionalShippingAddresses: [],
    primaryContact: {
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria@sunrisecoffee.example.com',
      phone: '+1-503-555-0142',
      title: 'Purchasing Manager',
    },
    apContact: {
      firstName: 'James',
      lastName: 'Park',
      email: 'ap@sunrisecoffee.example.com',
      phone: '+1-503-555-0143',
      title: 'Controller',
    },
  },
  requestedTerms: 'net_30',
  requestedCreditLimit: 25000,
  tags: ['coffee', 'portland', 'food-service'],
});

console.log(account.accountNumber); // "WS-10042"
console.log(account.status);        // "pending"

// The account automatically enters the approval workflow.
// Admin/sales team receives a notification to review.
```

### Example 2: Approve Account and Set Up Pricing

```typescript
// Admin reviews and approves the application
const approved = await wholesale.approveAccount(
  account.id,
  adminUserId,
);
console.log(approved.status); // "approved"

// Add the account to the "Silver" customer group
await wholesale.updateAccount(account.id, {
  customerGroupId: silverGroupId,
});

// Create a negotiated price list for this specific account
const priceList = await wholesale.createPriceList({
  name: 'Sunrise Coffee - 2026 Contract',
  currency: 'USD',
  priority: 100,
  isContract: true,
  accountId: account.id,
  effectiveFrom: new Date('2026-01-01'),
  effectiveTo: new Date('2026-12-31'),
});

// Add items with volume tiers
await wholesale.addPriceListItems(priceList.id, [
  {
    productId: espressoBlendId,
    sku: 'CB-ESP-5LB',
    unitPrice: 42.00,
    tiers: [
      { minQuantity: 10, maxQuantity: 49, unitPrice: 40.00, label: 'Case (10+)' },
      { minQuantity: 50, maxQuantity: 99, unitPrice: 37.50, label: 'Quarter Pallet' },
      { minQuantity: 100, maxQuantity: null, unitPrice: 35.00, label: 'Full Pallet' },
    ],
    casePackSize: 5, // Must order in multiples of 5
    minimumQuantity: 5,
    costPrice: 28.00,
  },
  {
    productId: houseBlendId,
    sku: 'CB-HSE-5LB',
    unitPrice: 38.00,
    tiers: [
      { minQuantity: 10, maxQuantity: 49, unitPrice: 36.00, label: 'Case (10+)' },
      { minQuantity: 50, maxQuantity: null, unitPrice: 33.00, label: 'Bulk' },
    ],
    casePackSize: 5,
    minimumQuantity: 5,
    costPrice: 24.00,
  },
]);

// Assign a sales rep
await wholesale.assignRep(account.id, portlandRepId);

// Add additional buyers to the account
await wholesale.addBuyer(account.id, {
  userId: buyerUserId,
  role: 'buyer',
  displayName: 'David Kim',
  email: 'david@sunrisecoffee.example.com',
  orderLimit: 5000, // Can order up to $5,000 without approval
  requiresApproval: true,
  canCreateQuotes: true,
  canApproveQuotes: false,
});
```

### Example 3: Price Resolution

```typescript
// Resolve pricing for a product + account + quantity combination
const price = await wholesale.resolvePrice({
  productId: espressoBlendId,
  variantId: null,
  quantity: 50,
  accountId: account.id,
  customerGroupId: silverGroupId,
  tenantId,
  currency: 'USD',
});

console.log(price);
// {
//   unitPrice: 37.50,
//   totalPrice: 1875.00,
//   quantity: 50,
//   currency: 'USD',
//   source: 'account_price_list',
//   tier: { minQuantity: 50, maxQuantity: 99, unitPrice: 37.50, label: 'Quarter Pallet' },
//   priceListId: '...',
//   contractId: null,
//   discount: null,
//   compareAtPrice: 42.00,
//   auditTrail: [
//     { source: 'negotiated_contract', evaluated: true, matched: false, price: null, reason: 'No active contract' },
//     { source: 'account_price_list', evaluated: true, matched: true, price: 37.50, reason: 'Matched tier: 50-99 units at $37.50' },
//     { source: 'customer_group', evaluated: false, matched: false, price: null, reason: 'Skipped: higher priority source matched' },
//     { source: 'volume_tier', evaluated: false, matched: false, price: null, reason: 'Skipped: higher priority source matched' },
//     { source: 'base_wholesale', evaluated: false, matched: false, price: null, reason: 'Skipped: higher priority source matched' },
//     { source: 'retail_discount', evaluated: false, matched: false, price: null, reason: 'Skipped: higher priority source matched' },
//   ],
//   belowCost: false,
//   marginPercent: 25.35,
// }

// Batch price resolution for multiple products
const prices = await wholesale.resolvePrices([
  { productId: espressoBlendId, variantId: null, quantity: 50, accountId: account.id, customerGroupId: silverGroupId, tenantId, currency: 'USD' },
  { productId: houseBlendId, variantId: null, quantity: 20, accountId: account.id, customerGroupId: silverGroupId, tenantId, currency: 'USD' },
  { productId: decafBlendId, variantId: null, quantity: 10, accountId: account.id, customerGroupId: silverGroupId, tenantId, currency: 'USD' },
]);
```

### Example 4: CSV Bulk Order Upload

```typescript
const csvContent = `sku,quantity,notes
CB-ESP-5LB,50,Espresso blend - regular order
CB-HSE-5LB,20,House blend
CB-DEC-5LB,10,Decaf for the new café location
CB-SOR-5LB,15,Single origin Rwanda
INVALID-SKU,5,This won't match
CB-ESP-5LB,3,This will fail case pack validation (not multiple of 5)
`;

// Parse the CSV first to preview and validate
const parseResult = await wholesale.parseCSVOrder(csvContent, account.id);

console.log(parseResult);
// {
//   totalRows: 6,
//   validRows: 3,
//   invalidRows: 3,
//   rows: [
//     { sku: 'CB-ESP-5LB', quantity: 50, isValid: true, resolvedProduct: {...}, price: {...} },
//     { sku: 'CB-HSE-5LB', quantity: 20, isValid: true, resolvedProduct: {...}, price: {...} },
//     { sku: 'CB-DEC-5LB', quantity: 10, isValid: true, resolvedProduct: {...}, price: {...} },
//     { sku: 'CB-SOR-5LB', quantity: 15, isValid: true, resolvedProduct: {...}, price: {...} },
//     { sku: 'INVALID-SKU', quantity: 5, isValid: false, errors: [{ type: 'invalid_sku', message: 'SKU not found' }] },
//     { sku: 'CB-ESP-5LB', quantity: 3, isValid: false, errors: [{ type: 'case_pack', message: 'Quantity must be in multiples of 5' }] },
//   ],
//   estimatedTotal: 3425.00,
// }

// Create the bulk order from CSV (only valid rows are included)
const order = await wholesale.createFromCSV(csvContent, account.id, buyerId);

console.log(order.status); // "draft"
console.log(order.lines.length); // 4 (valid lines only)

// Validate the full order (minimums, credit, etc.)
const validation = await wholesale.validateOrder(order.id);
if (validation.isValid) {
  const result = await wholesale.placeOrder(order.id);
  console.log(result.orderNumber); // "WO-2026-00158"
}
```

### Example 5: Quote Workflow (RFQ → Quote → Order)

```typescript
// Step 1: Buyer submits a Request for Quote
const rfq = await wholesale.createRfq({
  accountId: account.id,
  requestedBy: buyerId,
  items: [
    { productId: espressoBlendId, sku: 'CB-ESP-5LB', quantity: 200, targetPrice: 34.00 },
    { productId: houseBlendId, sku: 'CB-HSE-5LB', quantity: 100, targetPrice: 32.00 },
  ],
  notes: 'We\'re opening 3 new locations in Q2 and need volume pricing for the year.',
  requestedDeliveryDate: new Date('2026-04-01'),
});

console.log(rfq.status); // "draft" — becomes "sent" when submitted
console.log(rfq.quoteNumber); // "Q-2026-0089"

// Step 2: Sales rep reviews and creates a formal quote
const quote = await wholesale.updateQuote(rfq.id, {
  items: [
    {
      productId: espressoBlendId,
      sku: 'CB-ESP-5LB',
      name: 'Espresso Blend 5lb Bag',
      quantity: 200,
      unitPrice: 34.50,  // Close to their target
      listPrice: 42.00,
    },
    {
      productId: houseBlendId,
      sku: 'CB-HSE-5LB',
      name: 'House Blend 5lb Bag',
      quantity: 100,
      unitPrice: 32.50,  // Close to their target
      listPrice: 38.00,
    },
  ],
  paymentTerms: 'Net 30',
  shippingTerms: 'FOB Origin',
  estimatedDeliveryDate: new Date('2026-03-25'),
  customerNotes: 'Volume pricing valid for orders of 200+ and 100+ respectively through 2026.',
  internalNotes: 'Margin still healthy at these prices. Customer has strong payment history.',
  expiresAt: new Date('2026-03-15'),
});

// Step 3: Submit for internal approval (if required by discount level)
await wholesale.submitQuoteForApproval(quote.id);

// Step 4: Manager approves
await wholesale.approveQuote(quote.id, managerId);

// Step 5: Send quote to buyer
await wholesale.sendQuote(quote.id);
// → Buyer receives email with quote PDF

// Step 6: Buyer accepts the quote
await wholesale.acceptQuote(quote.id, buyerId);

// Step 7: Convert accepted quote to an order
const order = await wholesale.convertQuoteToOrder(quote.id, buyerId);
console.log(order.source); // "quote"
console.log(order.sourceQuoteId); // quote.id
console.log(order.total); // 10150.00 (200 × 34.50 + 100 × 32.50)

// The quote is now marked as "converted" and cannot be used again
const updatedQuote = await wholesale.getQuote(quote.id);
console.log(updatedQuote.status); // "converted"
console.log(updatedQuote.convertedOrderId); // order.id
```

### Example 6: Credit Management & Aging

```typescript
// Submit a credit application for a new account
const creditApp = await wholesale.submitCreditApplication({
  accountId: account.id,
  requestedCreditLimit: 50000,
  requestedTerms: 'net_30',
  financialInfo: {
    annualRevenue: 2500000,
    yearsInBusiness: 6,
    bankName: 'Pacific Northwest Bank',
    bankContactPhone: '+1-503-555-0200',
    dunsNumber: '12-345-6789',
  },
  tradeReferences: [
    {
      companyName: 'Green Bean Suppliers Inc.',
      contactName: 'Sarah Johnson',
      contactPhone: '+1-206-555-0300',
      contactEmail: 'sarah@greenbeans.example.com',
      creditLimit: 30000,
      yearsAsCustomer: 4,
    },
    {
      companyName: 'Pacific Packaging Co.',
      contactName: 'Tom Lee',
      contactPhone: '+1-503-555-0400',
      contactEmail: 'tom@pacpack.example.com',
      creditLimit: 15000,
      yearsAsCustomer: 3,
    },
  ],
});

// Admin reviews and approves with adjusted limit
await wholesale.reviewCreditApplication(creditApp.id, {
  status: 'approved',
  approvedCreditLimit: 40000, // Approved at $40K (less than requested $50K)
  approvedTerms: 'net_30',
  decisionNotes: 'Strong trade references. Starting at $40K, will review for increase in 6 months.',
  reviewedBy: creditManagerId,
});

// Check available credit before placing an order
const creditCheck = await wholesale.checkCredit(account.id, 12500);
console.log(creditCheck);
// {
//   approved: true,
//   creditLimit: 40000,
//   outstandingBalance: 8750,
//   availableCredit: 31250,
//   orderAmount: 12500,
//   remainingAfterOrder: 18750,
//   reason: null,
//   isFrozen: false,
// }

// Generate an aging report
const aging = await wholesale.getAgingReport(account.id);
console.log(aging);
// {
//   accountId: '...',
//   accountNumber: 'WS-10042',
//   companyName: 'Sunrise Coffee Roasters LLC',
//   currency: 'USD',
//   totalOutstanding: 8750,
//   creditLimit: 40000,
//   current: { amount: 5200, invoiceCount: 2, percentage: 59.43 },
//   thirtyDays: { amount: 3550, invoiceCount: 1, percentage: 40.57 },
//   sixtyDays: { amount: 0, invoiceCount: 0, percentage: 0 },
//   ninetyDays: { amount: 0, invoiceCount: 0, percentage: 0 },
//   overHundredTwenty: { amount: 0, invoiceCount: 0, percentage: 0 },
//   invoices: [...],
//   generatedAt: '2026-02-08T...',
// }

// Generate a monthly statement
const statement = await wholesale.generateStatement(
  account.id,
  new Date('2026-01-01'),
  new Date('2026-01-31'),
);
console.log(statement.closingBalance); // 8750.00

// Record an incoming payment
await wholesale.recordPayment(account.id, {
  amount: 3550,
  invoiceId: aging.invoices[2].invoiceId,
  paymentMethod: 'ach_transfer',
  referenceNumber: 'ACH-20260208-001',
  paidAt: new Date(),
  notes: 'Payment for Invoice #INV-2026-0034',
});
```

### Example 7: Sales Rep Operations & Impersonation

```typescript
import { SalesRepService, RepImpersonationService } from '@mcv/commerce/wholesale';

const repService = new SalesRepService({ db, tenantId });
const impersonation = new RepImpersonationService({ db, tenantId });

// Get all accounts assigned to a rep
const myAccounts = await repService.getAccounts(repId);
console.log(`Managing ${myAccounts.length} accounts`);

// View rep performance for the current quarter
const performance = await wholesale.getRepPerformance(repId, {
  start: new Date('2026-01-01'),
  end: new Date('2026-03-31'),
});

console.log(performance);
// {
//   repId: '...',
//   period: { start: '2026-01-01', end: '2026-03-31' },
//   totalRevenue: 187500,
//   orderCount: 42,
//   averageOrderValue: 4464.29,
//   activeAccountCount: 15,
//   newAccountCount: 3,
//   quotesCreated: 18,
//   quotesAccepted: 14,
//   quoteConversionRate: 77.78,
//   averageQuoteValue: 8200,
//   totalCommission: 9375,
//   revenueRank: 2,
//   topAccounts: [
//     { accountId: '...', accountNumber: 'WS-10042', companyName: 'Sunrise Coffee', revenue: 32500, orderCount: 8 },
//     ...
//   ],
// }

// Impersonate a buyer to place an order on their behalf
const session = await wholesale.impersonateBuyer(repId, account.id, buyerId);
// Session includes an impersonation token that:
// - Logs all actions as "repId acting as buyerId"
// - Expires after 1 hour
// - Cannot modify account settings
// - Can place orders, create quotes, view pricing

console.log(session);
// {
//   sessionId: '...',
//   repId: '...',
//   accountId: '...',
//   buyerId: '...',
//   expiresAt: '2026-02-08T...',
//   permissions: ['place_orders', 'view_pricing', 'create_quotes', 'view_orders'],
// }

// Calculate commission on a placed order
const commission = await wholesale.calculateCommission(orderId);
console.log(commission);
// {
//   repId: '...',
//   orderId: '...',
//   accountId: '...',
//   orderTotal: 10150.00,
//   commissionRate: 0.05, // 5%
//   commissionAmount: 507.50,
//   currency: 'USD',
//   status: 'pending',
// }
```

### Example 8: Trade Catalogs & Reorder Suggestions

```typescript
// Create a restricted trade catalog for premium accounts only
const catalog = await wholesale.createCatalog({
  name: 'Reserve Collection 2026',
  description: 'Limited-edition single-origin coffees, available to Gold and Platinum accounts',
  visibility: 'group_restricted',
  productIds: [rwandaId, ethiopiaId, colombiaId, guatemalaId],
  categoryIds: [],
  allowedGroupIds: [goldGroupId, platinumGroupId],
  allowedAccountIds: [],
  hideUntilLogin: true,
  showOutOfStock: false,
});

// Grant access to a specific Silver account as a special exception
await wholesale.grantCatalogAccess(catalog.id, account.id);

// Get products visible to an account (respects catalog restrictions)
const products = await wholesale.getVisibleProducts(account.id, {
  search: 'espresso',
  categoryId: coffeeCategory,
  page: 1,
  pageSize: 20,
});

// Each product includes resolved wholesale pricing for this account
products.items.forEach((product) => {
  console.log(`${product.sku}: ${product.name}`);
  console.log(`  Wholesale price: $${product.wholesalePrice.unitPrice}`);
  console.log(`  Price source: ${product.wholesalePrice.source}`);
  if (product.wholesalePrice.tier) {
    console.log(`  Volume tier: ${product.wholesalePrice.tier.label}`);
  }
});

// Get reorder suggestions based on purchase history
const suggestions = await wholesale.getReorderSuggestions(account.id);

suggestions.forEach((s) => {
  console.log(`${s.sku}: ${s.name}`);
  console.log(`  Last ordered: ${s.daysSinceLastOrder} days ago`);
  console.log(`  Avg. interval: ${s.averageDaysBetweenOrders} days`);
  console.log(`  Overdue: ${s.isOverdue ? 'YES' : 'no'}`);
  console.log(`  Suggested qty: ${s.suggestedQuantity}`);
  console.log(`  Current price: $${s.currentUnitPrice}`);
  if (s.priceChangePercent !== 0) {
    const direction = s.priceChangePercent > 0 ? '↑' : '↓';
    console.log(`  Price change: ${direction} ${Math.abs(s.priceChangePercent).toFixed(1)}%`);
  }
  console.log(`  Confidence: ${(s.confidence * 100).toFixed(0)}%`);
  console.log('');
});

// Output:
// CB-ESP-5LB: Espresso Blend 5lb Bag
//   Last ordered: 32 days ago
//   Avg. interval: 21 days
//   Overdue: YES
//   Suggested qty: 50
//   Current price: $37.50
//   Confidence: 92%
//
// CB-HSE-5LB: House Blend 5lb Bag
//   Last ordered: 18 days ago
//   Avg. interval: 28 days
//   Overdue: no
//   Suggested qty: 20
//   Current price: $36.00
//   Price change: ↑ 2.9%
//   Confidence: 85%

// Get account health score
const health = await wholesale.getAccountHealth(account.id);
console.log(health);
// {
//   accountId: '...',
//   overallScore: 82,
//   components: {
//     paymentHealth: 90,
//     orderingHealth: 78,
//     creditHealth: 85,
//     engagementHealth: 75,
//   },
//   riskLevel: 'low',
//   flags: ['reorder_overdue_espresso'],
//   recommendations: [
//     'Account has overdue reorders for 1 product — consider proactive outreach',
//     'Credit utilization at 21.9% — room for credit limit increase at next review',
//   ],
//   calculatedAt: '2026-02-08T...',
// }
```

---

## Error Codes

All errors extend `WholesaleError` and include a machine-readable `code`, a human-readable `message`, and optional `details`.

| Code | Error Class | HTTP | Description |
|------|------------|------|-------------|
| `WHOLESALE_ACCOUNT_NOT_FOUND` | `AccountNotFoundError` | 404 | The specified wholesale account does not exist |
| `WHOLESALE_ACCOUNT_NOT_APPROVED` | `AccountNotApprovedError` | 403 | Account has not been approved yet; cannot place orders |
| `WHOLESALE_ACCOUNT_SUSPENDED` | `AccountSuspendedError` | 403 | Account is suspended (e.g., overdue payments); operations blocked |
| `WHOLESALE_ACCOUNT_CLOSED` | `AccountClosedError` | 403 | Account has been permanently closed |
| `WHOLESALE_DUPLICATE_ACCOUNT` | `DuplicateAccountError` | 409 | An account with this tax ID or company name already exists |
| `WHOLESALE_CREDIT_LIMIT_EXCEEDED` | `CreditLimitExceededError` | 422 | Order amount exceeds available credit |
| `WHOLESALE_CREDIT_FROZEN` | `AccountCreditFrozenError` | 422 | Account credit is frozen; no new orders until resolved |
| `WHOLESALE_CREDIT_APP_PENDING` | `CreditApplicationPendingError` | 409 | A credit application is already pending review |
| `WHOLESALE_MIN_ORDER_NOT_MET` | `MinimumOrderNotMetError` | 422 | Order does not meet minimum order requirements |
| `WHOLESALE_INVALID_CASE_PACK` | `InvalidCasePackQuantityError` | 422 | Quantity is not a valid multiple of the case pack size |
| `WHOLESALE_QUOTE_EXPIRED` | `QuoteExpiredError` | 410 | Quote has passed its expiration date |
| `WHOLESALE_QUOTE_ALREADY_CONVERTED` | `QuoteAlreadyConvertedError` | 409 | Quote has already been converted to an order |
| `WHOLESALE_QUOTE_APPROVAL_REQUIRED` | `QuoteApprovalRequiredError` | 403 | Quote requires internal approval before it can be sent |
| `WHOLESALE_QUOTE_NOT_SENDABLE` | `QuoteNotSendableError` | 422 | Quote is not in a state that allows sending (must be approved) |
| `WHOLESALE_PRICE_LIST_NOT_FOUND` | `PriceListNotFoundError` | 404 | The specified price list does not exist |
| `WHOLESALE_PRICE_LIST_EXPIRED` | `PriceListExpiredError` | 410 | The price list has passed its effective end date |
| `WHOLESALE_NEGOTIATED_PRICE_EXPIRED` | `NegotiatedPriceExpiredError` | 410 | The negotiated/contract price has expired |
| `WHOLESALE_INVALID_BUYER_ROLE` | `InvalidBuyerRoleError` | 403 | Buyer does not have the required role for this operation |
| `WHOLESALE_BUYER_LIMIT_EXCEEDED` | `BuyerLimitExceededError` | 422 | Order exceeds the buyer's per-order spending limit |
| `WHOLESALE_CATALOG_ACCESS_DENIED` | `CatalogAccessDeniedError` | 403 | Account does not have access to the requested trade catalog |
| `WHOLESALE_REP_NOT_ASSIGNED` | `RepNotAssignedError` | 422 | No sales rep is assigned to this account |
| `WHOLESALE_TERRITORY_CONFLICT` | `TerritoryConflictError` | 409 | Territory assignment conflicts with existing assignments |
| `WHOLESALE_INVALID_NET_TERMS` | `InvalidNetTermsError` | 422 | Invalid or unsupported net terms configuration |
| `WHOLESALE_BULK_ORDER_PARSE_ERROR` | `BulkOrderParseError` | 422 | CSV or bulk order input could not be parsed |
| `WHOLESALE_IMPERSONATION_DENIED` | `ImpersonationDeniedError` | 403 | Rep does not have permission to impersonate buyers |
| `WHOLESALE_IMPERSONATION_EXPIRED` | `ImpersonationExpiredError` | 401 | Impersonation session has expired |
| `WHOLESALE_DISCOUNT_EXCEEDS_MAX` | `DiscountExceedsMaxError` | 422 | Discount exceeds the rep's maximum allowed discount |
| `WHOLESALE_ORDER_VALIDATION_FAILED` | `OrderValidationFailedError` | 422 | Order failed one or more validation checks |

### Error Structure

```typescript
class WholesaleError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'WholesaleError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

// Example: Minimum order not met
class MinimumOrderNotMetError extends WholesaleError {
  constructor(violations: MinimumOrderViolation[]) {
    super(
      'WHOLESALE_MIN_ORDER_NOT_MET',
      `Order does not meet minimum requirements: ${violations.map(v => v.message).join('; ')}`,
      422,
      { violations },
    );
    this.name = 'MinimumOrderNotMetError';
  }
}

// Example: Credit limit exceeded
class CreditLimitExceededError extends WholesaleError {
  constructor(creditCheck: CreditCheckResult) {
    super(
      'WHOLESALE_CREDIT_LIMIT_EXCEEDED',
      `Order amount $${creditCheck.orderAmount} exceeds available credit $${creditCheck.availableCredit}`,
      422,
      { creditCheck },
    );
    this.name = 'CreditLimitExceededError';
  }
}
```

---

## Security

### Authentication & Authorization

All wholesale endpoints require authentication via `@mcv/auth`. Authorization is layered:

1. **Tenant Isolation** — Supabase RLS enforces that all queries are scoped to the current tenant via `app.tenant_id` session variable. No application-level code can bypass this.

2. **Account-Level Access** — Buyers can only access data within their assigned wholesale account. This is enforced at the database level via RLS policies that join `account_buyers`.

3. **Buyer Roles** — Operations are gated by the buyer's role within the account:

   | Operation | Admin | Buyer | Viewer |
   |-----------|-------|-------|--------|
   | View orders / quotes | ✅ | ✅ | ✅ |
   | Place orders | ✅ | ✅ (up to limit) | ❌ |
   | Create quotes / RFQs | ✅ | ✅ | ❌ |
   | Approve orders | ✅ | ❌ | ❌ |
   | Manage buyers | ✅ | ❌ | ❌ |
   | View credit / statements | ✅ | ❌ | ❌ |
   | Update company profile | ✅ | ❌ | ❌ |

4. **Sales Rep Access** — Reps can view and operate on accounts assigned to them (via territory or direct assignment). Rep impersonation is separately permissioned and fully audited.

5. **Admin Access** — Tenant admins have full access to all wholesale operations including account approval, credit management, and analytics.

### Rep Impersonation Security

Sales rep impersonation is a sensitive capability that allows reps to place orders on behalf of buyers. It is protected by multiple safeguards:

```typescript
// Impersonation is controlled at the rep level
interface ImpersonationGuardrails {
  // Rep must have canImpersonate = true
  repMustBeAuthorized: true;

  // Rep must be assigned to the account (via territory or direct)
  repMustBeAssigned: true;

  // Sessions expire after 1 hour
  maxSessionDurationMs: 3600000;

  // All actions are logged with both rep and buyer identity
  auditLogging: true;

  // Impersonation cannot:
  restrictedActions: [
    'modify_account_settings',
    'manage_buyers',
    'modify_credit_terms',
    'approve_accounts',
    'delete_anything',
  ];
}
```

### Impersonation Audit Log

Every action taken during an impersonation session is logged:

```typescript
interface ImpersonationAuditEntry {
  sessionId: string;
  repId: string;
  buyerId: string;
  accountId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Example audit entries:
// { action: 'impersonation_started', resourceType: 'session', ... }
// { action: 'order_created', resourceType: 'wholesale_order', resourceId: 'wo-123', ... }
// { action: 'quote_viewed', resourceType: 'quote', resourceId: 'q-456', ... }
// { action: 'impersonation_ended', resourceType: 'session', ... }
```

### Credit Data Protection

Credit and financial data receives additional protection:

- **Encryption at rest** — Credit applications, trade references, and financial info are encrypted in the database using Supabase Vault
- **Restricted access** — Only account admins and tenant admins can view credit details; buyers with `buyer` role cannot see credit limits or aging data
- **Audit trail** — All credit limit changes, freezes, and payment recordings are logged with actor, timestamp, and reason
- **PII handling** — Trade reference contact information is treated as PII and subject to data retention policies

### Price List Security

- **No cross-tenant leakage** — Price lists are tenant-scoped via RLS; a price list ID from one tenant cannot be queried by another
- **Account-specific lists are private** — Price lists assigned to a specific account are visible only to that account's buyers and the assigned rep
- **Contract pricing is confidential** — Negotiated contract prices are never exposed in catalog browsing; they resolve only during checkout/quote flows
- **Price resolution is server-only** — The pricing engine runs exclusively on the server; clients receive resolved prices, never the resolution logic

### Input Validation

All wholesale inputs are validated using Zod schemas:

```typescript
import { z } from 'zod';

const createApplicationSchema = z.object({
  companyProfile: z.object({
    legalName: z.string().min(1).max(255),
    tradeName: z.string().max(255).nullable(),
    taxId: z.string().regex(/^\d{2}-\d{7}$/).nullable(), // US EIN format
    industry: z.string().max(100).nullable(),
    website: z.string().url().nullable(),
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    primaryContact: contactInfoSchema,
    apContact: contactInfoSchema.nullable(),
  }),
  requestedTerms: z.enum(['net_15', 'net_30', 'net_45', 'net_60', 'net_90']),
  requestedCreditLimit: z.number().positive().max(10_000_000),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

const bulkOrderLineSchema = z.object({
  sku: z.string().min(1).max(100),
  quantity: z.number().int().positive().max(100_000),
  notes: z.string().max(500).optional(),
});

const csvUploadSchema = z.object({
  content: z.string().max(1_000_000), // 1MB max CSV
  accountId: z.string().uuid(),
  buyerId: z.string().uuid(),
});
```

### Rate Limiting

Wholesale endpoints have specific rate limits to prevent abuse:

| Endpoint Category | Rate Limit | Window |
|---|---|---|
| Price resolution (single) | 100 req/min | Per account |
| Price resolution (batch) | 20 req/min | Per account |
| CSV upload | 10 req/hour | Per account |
| Quote creation | 30 req/hour | Per account |
| Order placement | 20 req/hour | Per account |
| Credit check | 50 req/min | Per account |
| Impersonation session start | 10 req/hour | Per rep |
| Analytics queries | 30 req/min | Per tenant |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WHOLESALE_ACCOUNT_NUMBER_PREFIX` | No | `WS-` | Prefix for generated account numbers |
| `WHOLESALE_ACCOUNT_NUMBER_START` | No | `10000` | Starting sequence for account numbers |
| `WHOLESALE_QUOTE_NUMBER_PREFIX` | No | `Q-` | Prefix for quote numbers (year is auto-appended) |
| `WHOLESALE_ORDER_NUMBER_PREFIX` | No | `WO-` | Prefix for wholesale order numbers |
| `WHOLESALE_DEFAULT_QUOTE_EXPIRY_DAYS` | No | `30` | Default expiration period for quotes in days |
| `WHOLESALE_DEFAULT_NET_TERMS` | No | `net_30` | Default payment terms for new accounts |
| `WHOLESALE_DEFAULT_CREDIT_LIMIT` | No | `10000` | Default credit limit for newly approved accounts |
| `WHOLESALE_MAX_CSV_ROWS` | No | `1000` | Maximum number of rows allowed in CSV upload |
| `WHOLESALE_MAX_CSV_SIZE_BYTES` | No | `1048576` | Maximum CSV file size (default 1MB) |
| `WHOLESALE_IMPERSONATION_TTL_MS` | No | `3600000` | Impersonation session duration (default 1 hour) |
| `WHOLESALE_PRICE_CACHE_TTL_MS` | No | `300000` | Price resolution cache TTL (default 5 minutes) |
| `WHOLESALE_ENABLE_BELOW_COST_ALERTS` | No | `true` | Alert when a resolved price is below cost |
| `WHOLESALE_MIN_ORDER_ENFORCEMENT` | No | `block` | Default enforcement for minimum order rules (`block` or `warn`) |
| `WHOLESALE_STATEMENT_RETENTION_DAYS` | No | `730` | How long to keep generated statements (default 2 years) |
| `WHOLESALE_AGING_OVERDUE_THRESHOLD_DAYS` | No | `30` | Days past due before an invoice is flagged as overdue |
| `WHOLESALE_AUTO_SUSPEND_OVERDUE_DAYS` | No | `90` | Auto-suspend accounts with invoices overdue by this many days (0 = disabled) |
| `WHOLESALE_COMMISSION_DEFAULT_RATE` | No | `0.05` | Default commission rate (5%) when no rule is configured |
| `WHOLESALE_REORDER_CONFIDENCE_THRESHOLD` | No | `0.7` | Minimum confidence score for reorder suggestions |
| `WHOLESALE_STATEMENT_PDF_BUCKET` | No | `statements` | Supabase Storage bucket for statement PDFs |
| `WHOLESALE_WEBHOOK_URL` | No | — | Webhook URL for wholesale event notifications |
| `WHOLESALE_ENABLE_ANALYTICS_CACHE` | No | `true` | Cache analytics queries for performance |
| `WHOLESALE_ANALYTICS_CACHE_TTL_MS` | No | `600000` | Analytics cache TTL (default 10 minutes) |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/commerce` | Core commerce module — products, orders, inventory, fulfillment |
| `@mcv/auth` | Authentication, user management, session handling |
| `@mcv/db` | Supabase client, Drizzle ORM configuration, RLS helpers |
| `@mcv/tenancy` | Multi-tenant context, tenant resolution, RLS session setup |
| `@mcv/events` | Domain event bus for wholesale events (account approved, order placed, etc.) |
| `@mcv/notifications` | Email/notification delivery for quotes, statements, approvals |
| `@mcv/storage` | Supabase Storage for statement PDFs, CSV uploads |
| `@mcv/pdf` | PDF generation for quotes, invoices, and statements |
| `@mcv/validation` | Shared Zod schemas and validation utilities |
| `@mcv/logging` | Structured logging with tenant and request context |
| `@mcv/cache` | Caching layer for price resolution and analytics |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.35.0` | Database ORM for schema definition and queries |
| `@supabase/supabase-js` | `^2.45.0` | Supabase client for RLS-aware database access |
| `zod` | `^3.23.0` | Runtime input validation |
| `@trpc/server` | `^11.0.0` | Type-safe API router |
| `csv-parse` | `^5.5.0` | CSV parsing for bulk order uploads |
| `decimal.js` | `^10.4.0` | Precise decimal arithmetic for pricing calculations |
| `date-fns` | `^3.6.0` | Date manipulation for aging, terms, and statements |
| `nanoid` | `^5.0.0` | Short ID generation for account/order numbers |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.45.0` | Must be provided by the host application |
| `drizzle-orm` | `^0.35.0` | Must be provided by the host application |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── pricing-engine.test.ts
│   │   ├── minimum-order-validator.test.ts
│   │   ├── csv-order-parser.test.ts
│   │   ├── credit-check.test.ts
│   │   ├── commission-calculator.test.ts
│   │   ├── aging-report.test.ts
│   │   ├── quote-expiry.test.ts
│   │   └── account-health-scorer.test.ts
│   ├── integration/
│   │   ├── account-lifecycle.test.ts
│   │   ├── quote-workflow.test.ts
│   │   ├── bulk-order-flow.test.ts
│   │   ├── credit-application-flow.test.ts
│   │   ├── price-list-management.test.ts
│   │   ├── rep-impersonation.test.ts
│   │   ├── trade-catalog-access.test.ts
│   │   └── statement-generation.test.ts
│   └── e2e/
│       ├── full-order-cycle.test.ts
│       ├── rfq-to-order.test.ts
│       └── multi-tenant-isolation.test.ts
```

### Unit Test Example: Pricing Engine

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WholesalePricingEngine } from '../services/pricing-engine.service';
import { createMockPriceListRepository } from './__mocks__/price-list-repository';

describe('WholesalePricingEngine', () => {
  let engine: WholesalePricingEngine;
  let mockRepo: ReturnType<typeof createMockPriceListRepository>;

  beforeEach(() => {
    mockRepo = createMockPriceListRepository();
    engine = new WholesalePricingEngine({ priceListRepo: mockRepo });
  });

  describe('resolvePrice', () => {
    it('should resolve negotiated contract price when available', async () => {
      mockRepo.setContractPrice('product-1', 'account-1', {
        unitPrice: 30.00,
        effectiveFrom: new Date('2026-01-01'),
        effectiveTo: new Date('2026-12-31'),
      });

      const result = await engine.resolvePrice({
        productId: 'product-1',
        variantId: null,
        quantity: 10,
        accountId: 'account-1',
        customerGroupId: 'silver',
        tenantId: 'tenant-1',
        currency: 'USD',
      });

      expect(result.unitPrice).toBe(30.00);
      expect(result.source).toBe('negotiated_contract');
      expect(result.auditTrail[0]).toMatchObject({
        source: 'negotiated_contract',
        evaluated: true,
        matched: true,
        price: 30.00,
      });
    });

    it('should fall through to account price list when no contract exists', async () => {
      mockRepo.setAccountPriceList('product-1', 'account-1', {
        unitPrice: 35.00,
        tiers: [
          { minQuantity: 50, maxQuantity: null, unitPrice: 32.00, label: 'Bulk' },
        ],
      });

      const result = await engine.resolvePrice({
        productId: 'product-1',
        variantId: null,
        quantity: 10,
        accountId: 'account-1',
        customerGroupId: null,
        tenantId: 'tenant-1',
        currency: 'USD',
      });

      expect(result.unitPrice).toBe(35.00);
      expect(result.source).toBe('account_price_list');
    });

    it('should select correct volume tier based on quantity', async () => {
      mockRepo.setAccountPriceList('product-1', 'account-1', {
        unitPrice: 42.00,
        tiers: [
          { minQuantity: 10, maxQuantity: 49, unitPrice: 40.00, label: 'Case' },
          { minQuantity: 50, maxQuantity: 99, unitPrice: 37.50, label: 'Quarter Pallet' },
          { minQuantity: 100, maxQuantity: null, unitPrice: 35.00, label: 'Full Pallet' },
        ],
      });

      const result = await engine.resolvePrice({
        productId: 'product-1',
        variantId: null,
        quantity: 75,
        accountId: 'account-1',
        customerGroupId: null,
        tenantId: 'tenant-1',
        currency: 'USD',
      });

      expect(result.unitPrice).toBe(37.50);
      expect(result.totalPrice).toBe(2812.50);
      expect(result.tier?.label).toBe('Quarter Pallet');
    });

    it('should flag below-cost pricing', async () => {
      mockRepo.setAccountPriceList('product-1', 'account-1', {
        unitPrice: 20.00,
        costPrice: 25.00,
        tiers: [],
      });

      const result = await engine.resolvePrice({
        productId: 'product-1',
        variantId: null,
        quantity: 10,
        accountId: 'account-1',
        customerGroupId: null,
        tenantId: 'tenant-1',
        currency: 'USD',
      });

      expect(result.belowCost).toBe(true);
      expect(result.marginPercent).toBeLessThan(0);
    });

    it('should skip expired price lists', async () => {
      mockRepo.setAccountPriceList('product-1', 'account-1', {
        unitPrice: 30.00,
        effectiveTo: new Date('2025-12-31'), // Expired
        tiers: [],
      });

      mockRepo.setBaseWholesalePrice('product-1', 45.00);

      const result = await engine.resolvePrice({
        productId: 'product-1',
        variantId: null,
        quantity: 10,
        accountId: 'account-1',
        customerGroupId: null,
        tenantId: 'tenant-1',
        currency: 'USD',
      });

      expect(result.unitPrice).toBe(45.00);
      expect(result.source).toBe('base_wholesale');
    });

    it('should provide complete audit trail', async () => {
      mockRepo.setBaseWholesalePrice('product-1', 50.00);

      const result = await engine.resolvePrice({
        productId: 'product-1',
        variantId: null,
        quantity: 10,
        accountId: 'account-1',
        customerGroupId: null,
        tenantId: 'tenant-1',
        currency: 'USD',
      });

      expect(result.auditTrail).toHaveLength(6);
      expect(result.auditTrail.map(s => s.source)).toEqual([
        'negotiated_contract',
        'account_price_list',
        'customer_group',
        'volume_tier',
        'base_wholesale',
        'retail_discount',
      ]);

      // Only base_wholesale should have matched
      const matched = result.auditTrail.filter(s => s.matched);
      expect(matched).toHaveLength(1);
      expect(matched[0].source).toBe('base_wholesale');
    });
  });
});
```

### Unit Test Example: Minimum Order Validator

```typescript
describe('MinimumOrderValidator', () => {
  it('should enforce minimum order value', async () => {
    const validator = new MinimumOrderValidator({
      rules: [
        {
          id: 'rule-1',
          type: 'min_order_value',
          minimumValue: 500,
          enforcement: 'block',
          scope: { allAccounts: true, accountIds: [], customerGroupIds: [] },
          productScope: { allProducts: true, productIds: [], categoryIds: [] },
        },
      ],
    });

    const result = await validator.validate({
      lines: [
        { productId: 'p1', quantity: 5, unitPrice: 40.00, lineTotal: 200.00 },
        { productId: 'p2', quantity: 3, unitPrice: 50.00, lineTotal: 150.00 },
      ],
      subtotal: 350.00,
    });

    expect(result.isValid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]).toMatchObject({
      ruleType: 'min_order_value',
      currentValue: 350,
      requiredValue: 500,
      message: expect.stringContaining('$500'),
    });
  });

  it('should enforce case pack quantities', async () => {
    const validator = new MinimumOrderValidator({
      rules: [
        {
          id: 'rule-2',
          type: 'case_pack',
          minimumValue: 6, // Case pack of 6
          enforcement: 'block',
          scope: { allAccounts: true, accountIds: [], customerGroupIds: [] },
          productScope: { allProducts: false, productIds: ['p1'], categoryIds: [] },
        },
      ],
    });

    const result = await validator.validate({
      lines: [
        { productId: 'p1', quantity: 7, unitPrice: 10.00, lineTotal: 70.00 }, // Not multiple of 6
        { productId: 'p2', quantity: 5, unitPrice: 10.00, lineTotal: 50.00 }, // Different product, no rule
      ],
      subtotal: 120.00,
    });

    expect(result.isValid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]).toMatchObject({
      ruleType: 'case_pack',
      currentValue: 7,
      requiredValue: 6,
      suggestedFix: 'Adjust quantity to 12 (next valid multiple of 6)',
    });
  });

  it('should return warnings for warn-only rules', async () => {
    const validator = new MinimumOrderValidator({
      rules: [
        {
          id: 'rule-3',
          type: 'min_line_items',
          minimumValue: 5,
          enforcement: 'warn',
          scope: { allAccounts: true, accountIds: [], customerGroupIds: [] },
          productScope: { allProducts: true, productIds: [], categoryIds: [] },
        },
      ],
    });

    const result = await validator.validate({
      lines: [
        { productId: 'p1', quantity: 10, unitPrice: 10.00, lineTotal: 100.00 },
        { productId: 'p2', quantity: 10, unitPrice: 10.00, lineTotal: 100.00 },
      ],
      subtotal: 200.00,
    });

    expect(result.isValid).toBe(true); // Warnings don't block
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].ruleType).toBe('min_line_items');
  });
});
```

### Integration Test Example: Full Quote Workflow

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext, cleanupTestContext } from './__helpers__/test-context';

describe('Quote Workflow (Integration)', () => {
  let ctx: Awaited<ReturnType<typeof createTestContext>>;

  beforeAll(async () => {
    ctx = await createTestContext();
    // Creates a test tenant, admin user, approved wholesale account,
    // sales rep, price list, and buyer
  });

  afterAll(async () => {
    await cleanupTestContext(ctx);
  });

  it('should complete the full RFQ → Quote → Order lifecycle', async () => {
    const { wholesale, account, buyer, rep, admin } = ctx;

    // 1. Buyer submits RFQ
    const rfq = await wholesale.createRfq({
      accountId: account.id,
      requestedBy: buyer.id,
      items: [
        { productId: ctx.products[0].id, sku: 'TEST-001', quantity: 100, targetPrice: 25.00 },
        { productId: ctx.products[1].id, sku: 'TEST-002', quantity: 50, targetPrice: 30.00 },
      ],
      notes: 'Need volume pricing for Q2',
    });
    expect(rfq.status).toBe('draft');
    expect(rfq.quoteNumber).toMatch(/^Q-\d{4}-\d+$/);

    // 2. Rep creates formal quote
    const quote = await wholesale.updateQuote(rfq.id, {
      items: [
        { productId: ctx.products[0].id, sku: 'TEST-001', name: 'Test Product 1', quantity: 100, unitPrice: 26.00, listPrice: 35.00 },
        { productId: ctx.products[1].id, sku: 'TEST-002', name: 'Test Product 2', quantity: 50, unitPrice: 31.00, listPrice: 40.00 },
      ],
      paymentTerms: 'Net 30',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    expect(quote.total).toBe(4150.00); // (100 × 26) + (50 × 31)

    // 3. Submit for approval
    await wholesale.submitQuoteForApproval(quote.id);
    const pendingQuote = await wholesale.getQuote(quote.id);
    expect(pendingQuote!.status).toBe('pending_review');

    // 4. Manager approves
    await wholesale.approveQuote(quote.id, admin.id);
    const approvedQuote = await wholesale.getQuote(quote.id);
    expect(approvedQuote!.status).toBe('approved');

    // 5. Send to buyer
    await wholesale.sendQuote(quote.id);
    const sentQuote = await wholesale.getQuote(quote.id);
    expect(sentQuote!.status).toBe('sent');
    expect(sentQuote!.sentAt).toBeTruthy();

    // 6. Buyer accepts
    await wholesale.acceptQuote(quote.id, buyer.id);
    const acceptedQuote = await wholesale.getQuote(quote.id);
    expect(acceptedQuote!.status).toBe('accepted');

    // 7. Convert to order
    const order = await wholesale.convertQuoteToOrder(quote.id, buyer.id);
    expect(order.source).toBe('quote');
    expect(order.sourceQuoteId).toBe(quote.id);
    expect(order.total).toBe(4150.00);
    expect(order.lines).toHaveLength(2);

    // 8. Verify quote is now converted
    const convertedQuote = await wholesale.getQuote(quote.id);
    expect(convertedQuote!.status).toBe('converted');
    expect(convertedQuote!.convertedOrderId).toBe(order.id);

    // 9. Verify double-conversion is blocked
    await expect(
      wholesale.convertQuoteToOrder(quote.id, buyer.id)
    ).rejects.toThrow('WHOLESALE_QUOTE_ALREADY_CONVERTED');

    // 10. Verify version history
    const versions = await wholesale.getQuoteVersions(quote.id);
    expect(versions.length).toBeGreaterThanOrEqual(2);
  });

  it('should reject expired quotes', async () => {
    const { wholesale, account, buyer } = ctx;

    const quote = await wholesale.createQuote({
      accountId: account.id,
      createdByRepId: ctx.rep.id,
      items: [
        { productId: ctx.products[0].id, sku: 'TEST-001', name: 'Test', quantity: 10, unitPrice: 25.00, listPrice: 35.00 },
      ],
      expiresAt: new Date(Date.now() - 1000), // Already expired
    });

    // Fast-forward quote to 'sent' status for testing
    await wholesale.approveQuote(quote.id, ctx.admin.id);
    await wholesale.sendQuote(quote.id);

    await expect(
      wholesale.acceptQuote(quote.id, buyer.id)
    ).rejects.toThrow('WHOLESALE_QUOTE_EXPIRED');
  });
});
```

### Testing Utilities

```typescript
/**
 * Creates a complete test context with all wholesale dependencies.
 */
async function createTestContext() {
  const db = await createTestDatabase();
  const tenantId = await createTestTenant(db);

  // Set up RLS context
  await db.execute(sql`SELECT set_config('app.tenant_id', ${tenantId}, true)`);

  const wholesale = createWholesaleService({ db, tenantId });

  // Create test data
  const admin = await createTestUser(db, { role: 'admin' });
  const products = await createTestProducts(db, tenantId, 5);

  const account = await wholesale.createApplication({
    companyProfile: createTestCompanyProfile(),
    requestedTerms: 'net_30',
    requestedCreditLimit: 50000,
  });
  await wholesale.approveAccount(account.id, admin.id);

  const buyer = await wholesale.addBuyer(account.id, {
    userId: (await createTestUser(db, { role: 'user' })).id,
    role: 'buyer',
    displayName: 'Test Buyer',
    email: 'buyer@test.example.com',
    orderLimit: 10000,
    requiresApproval: false,
    canCreateQuotes: true,
    canApproveQuotes: false,
  });

  const rep = await createTestSalesRep(db, tenantId);
  await wholesale.assignRep(account.id, rep.id);

  // Set up credit
  await wholesale.reviewCreditApplication(
    (await wholesale.submitCreditApplication({
      accountId: account.id,
      requestedCreditLimit: 50000,
      requestedTerms: 'net_30',
      financialInfo: {},
      tradeReferences: [],
    })).id,
    {
      status: 'approved',
      approvedCreditLimit: 50000,
      approvedTerms: 'net_30',
      reviewedBy: admin.id,
    },
  );

  // Create a price list
  const priceList = await wholesale.createPriceList({
    name: 'Test Price List',
    currency: 'USD',
    priority: 10,
    isContract: false,
    effectiveFrom: new Date(),
  });

  await wholesale.addPriceListItems(priceList.id, products.map((p, i) => ({
    productId: p.id,
    sku: `TEST-${String(i + 1).padStart(3, '0')}`,
    unitPrice: 25 + (i * 5),
    tiers: [],
    minimumQuantity: 1,
  })));

  await wholesale.assignPriceListToAccount(priceList.id, account.id);

  return { db, tenantId, wholesale, admin, account, buyer, rep, products, priceList };
}
```

### Running Tests

```bash
# Run all wholesale tests
pnpm test --filter=@mcv/commerce/wholesale

# Run unit tests only
pnpm test --filter=@mcv/commerce/wholesale -- --dir=unit

# Run integration tests (requires test database)
pnpm test:integration --filter=@mcv/commerce/wholesale

# Run with coverage
pnpm test:coverage --filter=@mcv/commerce/wholesale

# Run a specific test file
pnpm test --filter=@mcv/commerce/wholesale -- pricing-engine.test.ts
```

### Test Coverage Requirements

| Category | Minimum Coverage |
|----------|-----------------|
| Pricing Engine | 95% |
| Minimum Order Validator | 95% |
| Credit Check Logic | 90% |
| Quote State Machine | 90% |
| Account Lifecycle | 85% |
| CSV Parser | 90% |
| Commission Calculator | 90% |
| Overall Module | 85% |

---

*Last updated: 2026-02-08*