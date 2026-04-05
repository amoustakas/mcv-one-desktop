# MCV Commerce & Financial Operating System

> **Spec ID:** SPEC-002
> **Version:** 1.0.0
> **Date:** 2026-04-05
> **Status:** Draft
> **Tier:** 2-7 (Cross-cutting)
> **Author:** Tony / NAOS
> **Lifecycle:** Design → Plan → Build

---

## Executive Summary

The MCV Commerce & Financial Operating System is the foundational infrastructure layer that powers all monetary operations across the MCV ecosystem. It replaces fragmented payment integrations with a unified, cost-optimized, multi-processor financial engine that supports every commerce model — retail, digital, physical goods, subscriptions, metered billing, credit systems, overages, invoicing, loans/BNPL, and marketplace transactions.

**This is not a feature. This is the financial rails of a new-era PaaS ecosystem.**

Every venture (Futurestate, BetEdge, WarForge, mcv.gg, EdgeIQ, ARQ Labs), every partner app, and every external integration consumes this as infrastructure. The system provides a universal double-entry ledger, intelligent payment routing across fiat and crypto rails, comprehensive financial reporting (replacing QuickBooks/Xero), multi-jurisdiction tax compliance, and a platform API with partner SDK.

### Architecture Position

```
Tier 7: Venture Apps (Futurestate, BetEdge, WarForge, MCV Desktop)
Tier 6: Platform API & Partner SDK (@mcv/commerce-api)
Tier 5: Commerce (@mcv/commerce) + Finance (@mcv/finance)
Tier 3: Smart Payment Router (@mcv/payments)
Tier 2: Universal Ledger (@mcv/ledger)    <── NEW PRIMITIVE
Tier 1: Identity (@mcv/identity)
Tier 0: Kernel (@mcv/kernel)
```

### Venture Impact

| Venture | Commerce Models | Priority |
|---------|----------------|----------|
| **Futurestate** | Investments, yields, marketplace, credits, subscriptions | High |
| **BetEdge** | Credits/overages, subscriptions, real-time metered billing | High |
| **WarForge** | Digital goods (skins, items), subscriptions, in-game credits | High |
| **mcv.gg** | Token sales, marketplace listings, creator subscriptions | High |
| **EdgeIQ Markets** | Subscriptions, metered API billing, data credits | Medium |
| **ARQ Labs** | Research credits, invoiced services, enterprise billing | Medium |
| **MCV Platform** | Platform fees, partner billing, revenue aggregation | Critical |

---

## Section 1: Universal Ledger (`@mcv/ledger` — Tier 2)

### Overview

The Universal Ledger is the **single source of truth for all financial state** in the MCV ecosystem. Every monetary movement — payment, refund, credit grant, subscription charge, loan disbursement, yield distribution, overage fee, platform fee, crypto transfer, wallet balance sync — creates balanced debit/credit journal entries.

This is a double-entry accounting system at the infrastructure layer. It is not an application feature — it is a platform primitive that Commerce, Finance, Billing, and all venture apps write to and read from.

**Key insight:** Every wallet — on-chain or off-chain — IS a ledger account. This unifies fiat bank accounts, Stripe balances, Solana wallets, USDC holdings, SPL tokens, exchange balances, and platform credits into a single balance tracking system.

### Data Model

```typescript
// ═══════════════════════════════════════════════════════════
// LEDGER ACCOUNT — every entity that can hold value
// ═══════════════════════════════════════════════════════════

interface LedgerAccount {
  id: string
  ventureId: string             // venture scope
  code: string                  // "1010", "4010", etc.
  name: string                  // "Cash - Stripe", "Revenue - Subscriptions"
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  subtype: string               // "cash" | "crypto_wallet" | "receivable" | "payable" | etc.
  currency: string              // "USD" | "CAD" | "USDC" | "SOL" | "EDGE" | "BTC"
  currentBalance: number
  isSystem: boolean             // true = auto-created by platform

  // Wallet integration — null for non-wallet accounts
  wallet: WalletBinding | null

  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

interface WalletBinding {
  chain: 'solana' | 'ethereum' | 'bitcoin' | null  // null = off-chain (bank, exchange)
  address: string | null          // on-chain public key
  provider: string | null         // "phantom" | "web3auth" | "ledger" | "stripe" | "plaid" | "coinbase"
  custodyType: 'self' | 'custodial' | 'embedded' | 'exchange' | 'bank'
  lastSyncedAt: Date | null       // when balance was last verified
  syncStrategy: 'realtime' | 'polling' | 'webhook' | 'manual'
}

// ═══════════════════════════════════════════════════════════
// JOURNAL ENTRY — the atomic unit of financial movement
// ═══════════════════════════════════════════════════════════

interface JournalEntry {
  id: string
  ventureId: string
  entryNumber: string             // auto-incrementing per venture (JE-000001)
  entryDate: Date
  description: string
  sourceType: JournalSourceType
  sourceId: string                // FK to the originating record
  status: 'draft' | 'posted' | 'reversed'
  lines: JournalEntryLine[]
  postedAt: Date | null
  postedBy: string | null
  reversalOf: string | null       // FK if this reverses another entry
  createdAt: Date
}

type JournalSourceType =
  | 'payment'         // incoming payment
  | 'refund'          // refund issued
  | 'credit_grant'    // credits issued to user
  | 'credit_consume'  // credits spent by user
  | 'subscription'    // subscription charge
  | 'invoice'         // invoice payment
  | 'loan_disburse'   // loan principal sent
  | 'loan_repayment'  // loan repayment received
  | 'overage'         // overage charge
  | 'transfer'        // cross-account/cross-venture transfer
  | 'yield'           // yield/dividend distribution
  | 'platform_fee'    // platform fee collected
  | 'payout'          // payout to connected account
  | 'tax_remittance'  // tax remitted to authority
  | 'wallet_sync'     // on-chain balance sync
  | 'swap'            // crypto swap (cross-currency)
  | 'manual'          // manual adjustment

interface JournalEntryLine {
  id: string
  entryId: string
  accountId: string               // FK to LedgerAccount
  lineNumber: number
  debitAmount: number             // one of these is 0
  creditAmount: number            // the other is the amount
  currency: string
  exchangeRate: number            // for multi-currency (1.0 = base currency)
  dimensions: LineDimensions      // for reporting slices
}

interface LineDimensions {
  ventureId?: string
  productId?: string
  customerId?: string
  departmentId?: string
  projectId?: string
  rail?: string                   // "stripe" | "solana" | "ach" | "interac" | "wire"
  taxJurisdiction?: string        // "CA-ON" | "US-CA"
}

// ═══════════════════════════════════════════════════════════
// CREDIT ACCOUNT — stored-value per user/org
// ═══════════════════════════════════════════════════════════

interface CreditAccount {
  id: string
  ventureId: string
  ownerId: string                 // userId or orgId
  ownerType: 'user' | 'organization' | 'venture'
  currency: string                // platform credits, USD, USDC, etc.
  balance: number
  creditLimit: number             // 0 = prepaid only
  totalGranted: number            // lifetime credits granted
  totalConsumed: number           // lifetime credits consumed
  totalExpired: number            // lifetime credits expired
  expiresAt: Date | null          // for promotional credits
  metadata: Record<string, unknown>
}

// ═══════════════════════════════════════════════════════════
// FISCAL PERIODS — accounting period management
// ═══════════════════════════════════════════════════════════

interface FiscalYear {
  id: string
  ventureId: string
  name: string                    // "FY2026"
  startDate: Date
  endDate: Date
  status: 'open' | 'closed' | 'locked'
  isCurrent: boolean
}

interface FiscalPeriod {
  id: string
  fiscalYearId: string
  periodNumber: number            // 1-12 for monthly
  periodName: string              // "January 2026"
  startDate: Date
  endDate: Date
  status: 'open' | 'closed' | 'locked'
}

// ═══════════════════════════════════════════════════════════
// ACCOUNT BALANCE SNAPSHOTS — fast period-end reporting
// ═══════════════════════════════════════════════════════════

interface AccountBalance {
  id: string
  accountId: string
  periodId: string
  openingBalance: number
  debits: number                  // total debits in period
  credits: number                 // total credits in period
  closingBalance: number
  currency: string
}
```

### Chart of Accounts Template

Auto-created for each venture on provisioning:

```
1xxx — ASSETS
  1010  Cash - Stripe Balance
  1011  Cash - Bank (Primary)
  1012  Cash - Bank (Secondary)
  1013  Cash - PayPal Balance
  1014  Cash - Square Balance
  1015  Cash - Adyen Balance
  1020  Accounts Receivable
  1025  Accounts Receivable - Invoiced
  1030  Inventory - Physical Goods
  1040  Prepaid Expenses
  1050  Crypto - USDC Wallet
  1051  Crypto - SOL Wallet
  1052  Crypto - EDGE Wallet
  1053  Crypto - BTC Wallet (watch-only)
  1055  Crypto - Exchange (Coinbase)
  1056  Crypto - Exchange (Binance)
  1060  Platform Credits Receivable
  1070  Loans Receivable - Short Term
  1071  Loans Receivable - Long Term
  1080  External - Brokerage Holdings
  1090  External - Bank (Plaid/Flinks)

2xxx — LIABILITIES
  2010  Accounts Payable
  2020  Credits Payable (issued credits owed)
  2030  Unearned Revenue (prepaid subscriptions)
  2035  Unearned Revenue (gift cards)
  2040  Loans Payable - Short Term
  2041  Loans Payable - Long Term
  2050  Platform Fees Payable
  2060  Tax Payable - Sales Tax
  2061  Tax Payable - VAT
  2062  Tax Payable - GST/HST
  2070  Refunds Payable
  2080  Customer Deposits

3xxx — EQUITY
  3010  Owner's Equity
  3020  Retained Earnings
  3030  Token Treasury (EDGE holdings)
  3040  FX Translation Reserve

4xxx — REVENUE
  4010  Revenue - Subscriptions
  4020  Revenue - One-Time Sales
  4030  Revenue - Digital Products
  4040  Revenue - Physical Goods
  4050  Revenue - Platform Fees
  4060  Revenue - Transaction Fees
  4070  Revenue - Credit Sales
  4080  Revenue - Interest (Loans)
  4090  Revenue - Yield Distributions
  4100  Revenue - Marketplace Commissions
  4110  Revenue - Services
  4120  Revenue - Metered Usage

5xxx — EXPENSES
  5010  COGS - Physical Goods
  5020  COGS - Digital Delivery
  5030  Payment Processing Fees
  5040  Refunds & Chargebacks
  5050  Credit Grants (promotional)
  5060  Loan Write-offs
  5070  Infrastructure Costs
  5080  Third-Party Service Fees
  5090  FX Gains/Losses
```

### Ledger Invariants

1. **Every journal entry balances** — `SUM(debits) = SUM(credits)` enforced by DB constraint
2. **Immutable once posted** — reversals create new entries, never modify existing
3. **Multi-currency native** — each line carries currency + exchange rate to base
4. **Venture-scoped** — every account and entry belongs to a venture
5. **Dimensional** — every line sliceable by venture, product, customer, department, rail
6. **Wallet = Account** — on-chain and off-chain wallets are ledger accounts with balance sync

### Database Tables

| Table | Columns | Purpose |
|-------|---------|---------|
| `ledger_accounts` | id, ventureId, code, name, type, subtype, currency, currentBalance, isSystem, wallet_chain, wallet_address, wallet_provider, wallet_custodyType, wallet_lastSyncedAt, wallet_syncStrategy, metadata | Every entity that holds value |
| `journal_entries` | id, ventureId, entryNumber, entryDate, description, sourceType, sourceId, status, postedAt, postedBy, reversalOf | Atomic financial movements |
| `journal_entry_lines` | id, entryId, accountId, lineNumber, debitAmount, creditAmount, currency, exchangeRate, dim_ventureId, dim_productId, dim_customerId, dim_departmentId, dim_projectId, dim_rail, dim_taxJurisdiction | Debit/credit lines |
| `credit_accounts` | id, ventureId, ownerId, ownerType, currency, balance, creditLimit, totalGranted, totalConsumed, totalExpired, expiresAt, metadata | Stored-value accounts |
| `fiscal_years` | id, ventureId, name, startDate, endDate, status, isCurrent | Accounting year definitions |
| `fiscal_periods` | id, fiscalYearId, periodNumber, periodName, startDate, endDate, status | Monthly/quarterly periods |
| `account_balances` | id, accountId, periodId, openingBalance, debits, credits, closingBalance, currency | Period snapshots for fast reporting |
| `recurring_journals` | id, ventureId, templateName, frequency, nextRunDate, lines, status | Auto-posted monthly entries |

---

## Section 2: Smart Payment Router (`@mcv/payments` — Tier 3)

### Overview

The Smart Payment Router sits between commerce operations and payment processors. Its job: **pick the cheapest, fastest, most reliable rail for every transaction.** It abstracts all payment processors behind a unified interface, enabling ventures to accept payments via card, ACH, wire, Interac, PayPal, Apple/Google Pay, USDC, SOL, EDGE, and platform credits — all routed intelligently.

Every payment creates a journal entry in the universal ledger. The router also handles split payments (marketplace seller + platform fee + tax), payouts, refunds, and disputes.

### Processor Abstraction

```typescript
// ═══════════════════════════════════════════════════════════
// PAYMENT PROCESSOR — every processor implements this
// ═══════════════════════════════════════════════════════════

interface PaymentProcessor {
  id: string                        // "stripe" | "square" | "adyen" | "paypal" | "solana" | "ach"
  name: string
  capabilities: ProcessorCapability[]
  supportedCurrencies: string[]
  supportedCountries: string[]
  supportedMethods: PaymentMethod[]

  // Core operations
  createPayment(req: PaymentRequest): Promise<PaymentResult>
  capturePayment(paymentId: string): Promise<PaymentResult>
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>
  createSubscription(req: SubscriptionRequest): Promise<SubscriptionResult>
  createPayout(req: PayoutRequest): Promise<PayoutResult>

  // Status & health
  getStatus(paymentId: string): Promise<PaymentStatus>
  getHealth(): Promise<ProcessorHealth>

  // Cost estimation (for smart routing)
  estimateFee(req: PaymentRequest): Promise<FeeEstimate>
}

type ProcessorCapability =
  | 'one_time'        // single charge
  | 'recurring'       // subscriptions
  | 'invoicing'       // send invoice, pay later
  | 'payout'          // send money out
  | 'refund'          // refund support
  | 'dispute'         // chargeback handling
  | 'connect'         // multi-tenant (Stripe Connect, Square Marketplace)
  | 'pos'             // in-person terminal
  | 'crypto'          // on-chain settlement
  | 'p2p'             // peer-to-peer transfers
  | 'bnpl'            // buy now pay later
  | 'credits'         // platform credit consumption

type PaymentMethod =
  | 'card'            // Visa, MC, Amex, Discover
  | 'ach'             // US bank direct debit
  | 'sepa'            // EU bank direct debit
  | 'interac'         // Canada instant transfer
  | 'wire'            // bank wire transfer
  | 'paypal'          // PayPal wallet
  | 'apple_pay'       // Apple Pay
  | 'google_pay'      // Google Pay
  | 'usdc'            // USDC stablecoin
  | 'sol'             // Solana native
  | 'btc'             // Bitcoin
  | 'edge'            // EDGE token
  | 'platform_credit' // internal credit balance
  | 'invoice'         // pay-later / net terms

// ═══════════════════════════════════════════════════════════
// SUPPORTED PROCESSORS (Day 1 + Roadmap)
// ═══════════════════════════════════════════════════════════

// Day 1:
//   - Stripe (cards, subs, invoicing, Connect, payouts)
//   - Solana Pay (USDC, SOL, SPL tokens)
//   - Platform Credits (internal ledger)
//
// Phase 2:
//   - Square (POS, cards)
//   - PayPal (wallet, P2P)
//   - Transak / MoonPay / Nuvei (fiat-to-crypto on-ramp)
//   - ACH direct (Plaid)
//   - Interac e-Transfer direct
//
// Phase 3:
//   - Adyen (global cards, alternative methods)
//   - Wire transfers (for enterprise/wholesale)
//   - Bitcoin Lightning (micro-payments)
```

### Smart Routing Decision Engine

```typescript
// ═══════════════════════════════════════════════════════════
// ROUTING ENGINE — picks the optimal rail per transaction
// ═══════════════════════════════════════════════════════════

interface RoutingRequest {
  amount: number
  currency: string
  customerCountry: string
  paymentMethod: PaymentMethod | null   // null = let router decide
  urgency: 'instant' | 'same_day' | 'standard'
  ventureId: string
  customerId: string | null
  isRecurring: boolean
}

interface RoutingDecision {
  primaryRail: string             // chosen processor ID
  fallbackRails: string[]         // ordered fallbacks if primary fails
  estimatedFee: FeeEstimate
  estimatedSettlement: string     // "instant" | "1 day" | "3-5 days"
  reasoning: string               // human-readable explanation
  savingsVsDefault: number        // $ saved vs naive Stripe card routing
}

interface FeeEstimate {
  fixedFee: number                // flat per-transaction fee
  percentageFee: number           // percentage of amount
  totalFee: number                // calculated total
  currency: string
  networkFee?: number             // blockchain gas/priority fee
}

// Routing factors (weighted scoring model)
interface RoutingFactors {
  cost: number          // weight: 0.35 — fee as % of transaction
  speed: number         // weight: 0.20 — settlement time
  reliability: number   // weight: 0.20 — uptime, historical success rate
  compliance: number    // weight: 0.10 — PCI, KYC, geographic compliance
  preference: number    // weight: 0.15 — venture/user preference override
}

// Cost optimization examples:
//
// | Scenario                  | Naive (Stripe card) | Smart Route          | Savings |
// |---------------------------|--------------------|-----------------------|---------|
// | $50 US subscription       | $1.75 (2.9%+30c)  | ACH: $0.25 flat       | 86%     |
// | $200 CAD one-time         | $6.10 (2.9%+30c)  | Interac: $0.50        | 92%     |
// | $5,000 cross-border       | $145.30            | USDC transfer: $0.01  | 99.99%  |
// | $25K enterprise invoice   | $725.30            | Wire: $25 flat        | 97%     |
// | $10 micro-payment         | $0.59              | Platform credits: $0  | 100%    |
// | $100 marketplace purchase | $3.20              | Solana Pay: $0.005    | 99.8%   |
```

### Split Payment Engine

```typescript
// ═══════════════════════════════════════════════════════════
// SPLIT PAYMENTS — single transaction, multiple recipients
// ═══════════════════════════════════════════════════════════

interface SplitPaymentRequest {
  totalAmount: number
  currency: string
  source: PaymentSource
  splits: PaymentSplit[]
  metadata: Record<string, unknown>
}

interface PaymentSplit {
  recipientId: string               // ventureId, userId, or external account
  recipientType: 'venture' | 'user' | 'platform' | 'tax_authority' | 'external'
  amount: number                    // fixed amount OR...
  percentage?: number               // percentage of total (calculated at execution)
  rail?: string                     // force specific rail for this split
  description: string               // "Seller revenue" | "Platform fee" | "Sales tax"
  ledgerAccount: string             // which account to credit
  timing: 'immediate' | 'on_settlement' | 'deferred'
}

// Example: Marketplace purchase $100 digital product
//   splits = [
//     { recipientType: 'venture',      amount: 92.50, description: 'Seller revenue' },
//     { recipientType: 'platform',     amount: 5.00,  description: 'Platform fee 5%' },
//     { recipientType: 'tax_authority', amount: 2.50,  description: 'HST collected' },
//   ]
//
// Example: Cross-rail investment $5,000 on Futurestate
//   splits = [
//     { recipientType: 'venture',  amount: 4950, rail: 'solana', description: 'Property tokens' },
//     { recipientType: 'platform', amount: 50,   rail: 'stripe', description: 'Platform fee 1%' },
//   ]
//
// Each split generates corresponding journal entry lines in the ledger
```

### Venture-Level Payment Configuration

```typescript
interface VenturePaymentConfig {
  ventureId: string
  enabledProcessors: string[]         // which processors this venture uses
  preferredRail: string | null        // override smart routing default
  platformFee: {
    type: 'percentage' | 'flat' | 'tiered'
    value: number                     // e.g., 2.5 for 2.5%
    tiers?: { minAmount: number; maxAmount: number; feePercent: number }[]
  }
  autoPayoutSchedule: 'daily' | 'weekly' | 'monthly' | 'manual'
  autoPayoutMinimum: number           // minimum balance before auto-payout
  cryptoEnabled: boolean
  bnplEnabled: boolean
  creditSystemEnabled: boolean
  invoicingEnabled: boolean
  posEnabled: boolean
  allowedCountries: string[] | '*'    // geographic restrictions
  blockedCountries: string[]
  maxTransactionAmount: number | null // per-transaction limit
  requireKycAbove: number | null      // require KYC for transactions above this amount
}
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `payment_processors` | Registered processors with credentials and capabilities |
| `processor_credentials` | Encrypted API keys per venture per processor |
| `payment_intents` | Payment requests with routing decisions |
| `payment_results` | Processor responses and status |
| `split_payments` | Split payment definitions |
| `split_payment_items` | Individual split items with recipient and timing |
| `routing_decisions` | Audit trail of every routing decision (for optimization) |
| `routing_rules` | Custom routing overrides per venture |
| `processor_health` | Real-time health/uptime tracking per processor |
| `venture_payment_configs` | Per-venture payment settings |
| `payout_schedules` | Automated payout configuration and history |
| `disputes` | Chargeback/dispute records across processors |
| `refunds` | Refund records across processors |

---

## Section 3: Product & Commerce Models (`@mcv/commerce` — Tier 5)

### Overview

The commerce layer defines every type of product and transaction that MCV ventures can offer. It builds on the ledger (for financial tracking) and the payment router (for collection) to provide a complete commerce engine.

Every product type you can imagine — physical goods, digital downloads, subscriptions, metered billing, credit packs, loans, marketplace listings, investments, services — is a first-class entity with dedicated configuration.

### Product Type Taxonomy

```typescript
// ═══════════════════════════════════════════════════════════
// PRODUCT TYPES — every commerce model
// ═══════════════════════════════════════════════════════════

type ProductType =
  // Physical
  | 'physical_good'         // shipped item (merch, hardware, books)
  | 'physical_rental'       // rented item (equipment, space)

  // Digital
  | 'digital_download'      // one-time file delivery (ebook, software, asset pack)
  | 'digital_access'        // access to content/service (course, tool, API)
  | 'digital_license'       // software license key

  // Subscription
  | 'subscription'          // recurring billing (SaaS, membership)
  | 'metered'               // usage-based billing (API calls, compute, storage)

  // Financial
  | 'credit_pack'           // buy credits in bulk (e.g., 1000 credits for $50)
  | 'token'                 // crypto/utility token purchase
  | 'investment'            // tokenized asset (Futurestate properties)
  | 'loan'                  // lending product (principal + interest schedule)

  // Services
  | 'service'               // one-time service (consulting, design)
  | 'service_retainer'      // ongoing retainer (monthly hours block)

  // Marketplace
  | 'marketplace_listing'   // third-party seller product

// ═══════════════════════════════════════════════════════════
// PRODUCT — the universal product entity
// ═══════════════════════════════════════════════════════════

interface Product {
  id: string
  ventureId: string
  type: ProductType
  name: string
  description: string
  status: 'draft' | 'active' | 'archived'
  sku: string | null

  // Pricing
  pricing: PricingConfig

  // Type-specific configuration (only relevant fields populated)
  physical: PhysicalConfig | null
  digital: DigitalConfig | null
  subscription: SubscriptionConfig | null
  metered: MeteredConfig | null
  credit: CreditConfig | null
  loan: LoanConfig | null
  investment: InvestmentConfig | null

  // Gifting & transfers
  gift: GiftConfig
  transfer: TransferConfig

  // Catalog
  categoryIds: string[]
  collectionIds: string[]
  tags: string[]
  images: ProductImage[]
  seoTitle: string | null
  seoDescription: string | null

  // Inventory
  trackInventory: boolean
  inventoryCount: number | null
  lowStockThreshold: number | null

  // Tax
  taxCategoryId: string | null
  taxExempt: boolean

  // Compliance gating
  requiresKyc: boolean
  minimumComplianceTier: string | null
  geoRestrictions: string[]

  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}
```

### Pricing Engine

```typescript
// ═══════════════════════════════════════════════════════════
// PRICING — flexible, multi-strategy pricing
// ═══════════════════════════════════════════════════════════

interface PricingConfig {
  default: PricePoint
  variants?: PricePoint[]             // size/color/tier variants
  volume?: VolumeTier[]               // buy more = cheaper
  wholesale?: WholesaleTier[]         // B2B pricing
  dynamic?: DynamicPricingRule[]      // time-based, demand-based
}

interface PricePoint {
  amount: number
  currency: string
  compareAtPrice?: number             // strikethrough price
  costBasis?: number                  // for margin calculation
}

interface VolumeTier {
  minQuantity: number
  maxQuantity: number | null
  pricePerUnit: number
  currency: string
}

interface WholesaleTier {
  customerGroupId: string             // B2B customer group
  pricePerUnit: number
  currency: string
  minOrderAmount: number | null
}

interface DynamicPricingRule {
  type: 'time_decay' | 'demand_surge' | 'early_bird' | 'flash_sale'
  startDate: Date | null
  endDate: Date | null
  modifier: number                    // multiplier (0.8 = 20% off, 1.2 = 20% surge)
  conditions: Record<string, unknown>
}
```

### Subscription Engine

```typescript
// ═══════════════════════════════════════════════════════════
// SUBSCRIPTIONS — recurring billing lifecycle
// ═══════════════════════════════════════════════════════════

interface SubscriptionConfig {
  plans: SubscriptionPlan[]
  trialDays: number | null
  prorationBehavior: 'create_prorations' | 'none' | 'always_invoice'
  cancelBehavior: 'immediate' | 'end_of_period'
  pauseEnabled: boolean
  maxPauseDurationDays: number | null
  gracePeriodDays: number             // days after failed payment before cancellation
}

interface SubscriptionPlan {
  id: string
  name: string                          // "Starter" | "Pro" | "Enterprise"
  interval: 'day' | 'week' | 'month' | 'year'
  intervalCount: number                 // 1 = monthly, 3 = quarterly
  price: PricePoint
  features: string[]                    // feature flags unlocked by this plan
  limits: Record<string, number>        // "api_calls": 10000, "storage_gb": 50
  overageConfig: OverageConfig | null   // what happens when limits exceeded
}

interface OverageConfig {
  behavior: 'block' | 'charge' | 'throttle' | 'notify_admin'
  perUnitPrice: number                  // e.g., $0.001 per extra API call
  gracePeriodHours: number              // buffer before charging
  hardCapMultiplier: number             // max 5x plan limit, then block
  notifyAt: number[]                    // [80, 90, 100] percent thresholds
}

// Subscription state machine:
//   create → trialing → active → [pause/cancel/update]
//                   ↓         ↓
//               past_due → unpaid → canceled
//                   ↓
//               paused → active (resume)
```

### Credit System

```typescript
// ═══════════════════════════════════════════════════════════
// CREDITS — stored-value / prepaid system
// ═══════════════════════════════════════════════════════════

interface CreditConfig {
  creditAmount: number                // credits per purchase
  bonusCredits: number                // promotional bonus
  expirationDays: number | null       // null = never expires
  transferable: boolean               // can credits be sent to other users
}

// Credit operations flow through the ledger:
//
// Purchase credits:
//   DR: Cash (payment received)
//   CR: Credits Payable (liability — owed to user)
//
// Consume credits:
//   DR: Credits Payable (reduce liability)
//   CR: Revenue - Credit Sales (recognize revenue)
//
// Expire credits:
//   DR: Credits Payable (reduce liability)
//   CR: Other Revenue (breakage income)
//
// Transfer credits:
//   DR: User A Credit Account (decrease)
//   CR: User B Credit Account (increase)
//   (no revenue impact — just liability transfer)
```

### Loan & Buy-Now-Pay-Later

```typescript
// ═══════════════════════════════════════════════════════════
// LOANS — lending products with repayment schedules
// ═══════════════════════════════════════════════════════════

interface LoanConfig {
  principal: number
  interestRate: number                // annual rate (0.08 = 8%)
  interestType: 'simple' | 'compound'
  termMonths: number
  repaymentSchedule: 'monthly' | 'biweekly' | 'weekly'
  lateFeeAmount: number
  lateFeeGraceDays: number
  collateralRequired: boolean
  collateralType: string | null       // "property_tokens" | "crypto" | null
  autoDebitEnabled: boolean
}

// BNPL is a loan variant:
interface BnplConfig {
  installmentCount: number            // typically 4
  intervalDays: number                // typically 14
  interestRate: 0                     // always 0 for BNPL
  lateFeeAmount: number
  lateFeeGraceDays: number
}

// Loan lifecycle:
//   Application → Approved → Disbursed → Repaying → Paid Off
//                    ↓                       ↓
//                 Declined              Defaulted → Collections
//
// Loan disbursement journal entry:
//   DR: Loans Receivable (1070)    $5,000
//   CR: Cash (1010)                $5,000
//
// Loan repayment journal entry:
//   DR: Cash (1010)                $450
//   CR: Loans Receivable (1070)    $400 (principal)
//   CR: Revenue - Interest (4080)  $50  (interest)
//
// Loan default journal entry:
//   DR: Loan Write-offs (5060)     $3,200
//   CR: Loans Receivable (1070)    $3,200
```

### Invoice / Pay-Later

```typescript
// ═══════════════════════════════════════════════════════════
// INVOICING — enterprise pay-later billing
// ═══════════════════════════════════════════════════════════

interface InvoiceConfig {
  paymentTerms: 'net_7' | 'net_15' | 'net_30' | 'net_60' | 'net_90' | 'due_on_receipt' | 'custom'
  customTermsDays?: number
  autoReminders: boolean
  reminderSchedule: number[]          // days relative to due: [-7, -1, 1, 7, 14, 30]
  lateFeeType: 'percentage' | 'flat' | 'none'
  lateFeeValue: number
  acceptPartialPayment: boolean
  requirePurchaseOrder: boolean       // enterprise: PO number required
  approvalRequired: boolean           // internal approval before sending
}

// Invoice states:
//   draft → pending_approval → sent → viewed → partial → paid
//                                              ↓
//                                          overdue → collections → write_off
//                                              ↓
//                                          voided

// Branded invoice templates per venture with:
//   - Logo, colors, fonts
//   - Custom footer/terms
//   - Multi-language support
//   - PDF generation
//   - E-signature support (proposals/estimates)
```

### Gifting & Ownership Transfers

```typescript
// ═══════════════════════════════════════════════════════════
// GIFTING & TRANSFERS — social commerce
// ═══════════════════════════════════════════════════════════

interface GiftConfig {
  giftable: boolean
  giftMessageEnabled: boolean
  giftWrappingOptions: string[]       // visual themes
  scheduledDelivery: boolean          // send at specific date/time
  anonymousGiftAllowed: boolean       // hide sender identity
}

interface TransferConfig {
  transferable: boolean
  transferFee: number | null          // platform fee on transfers (e.g., 2.5%)
  transferCooldownHours: number       // prevent immediate resale
  maxTransfersPerItem: number | null  // null = unlimited
  requireRecipientKyc: boolean
}

// Gift flow:
//   Buyer pays → product/credit/sub assigned to recipient
//   Journal: DR Cash, CR Revenue (buyer pays)
//   Delivery: instant (digital) or shipped (physical)
//
// Transfer flow:
//   Owner initiates → platform validates eligibility
//   If fee: SplitPaymentRequest (transfer fee to platform)
//   Ledger: ownership transfer journal entry
//   On-chain: SPL token transfer if tokenized
```

### Physical Goods Configuration

```typescript
interface PhysicalConfig {
  weight: number | null               // grams
  dimensions: { length: number; width: number; height: number } | null
  shippingRequired: boolean
  shippingClassId: string | null
  originCountry: string
  hsCode: string | null               // harmonized system code (customs)
  requiresSignature: boolean
  fragile: boolean
  returnable: boolean
  returnWindowDays: number
}
```

### Digital Goods Configuration

```typescript
interface DigitalConfig {
  deliveryMethod: 'download' | 'email' | 'access_grant' | 'license_key'
  fileUrl: string | null              // for downloads
  fileSize: number | null             // bytes
  maxDownloads: number | null         // per purchase
  downloadExpiryDays: number | null
  licenseType: 'single' | 'multi' | 'site' | 'enterprise' | null
  accessDurationDays: number | null   // for time-limited access
}
```

### Metered Billing Configuration

```typescript
interface MeteredConfig {
  meters: UsageMeter[]
  billingCycle: 'monthly' | 'daily' | 'hourly'
  aggregationMethod: 'sum' | 'max' | 'last'
  minimumCharge: number | null        // minimum bill per period
}

interface UsageMeter {
  id: string
  name: string                        // "API Calls" | "Storage GB" | "Compute Hours"
  unit: string                        // "call" | "gb" | "hour"
  pricingTiers: MeteredTier[]
  includedUnits: number               // free tier
}

interface MeteredTier {
  upTo: number | null                 // null = unlimited (last tier)
  pricePerUnit: number
}

// Example: API billing
// meters = [{
//   name: "API Calls",
//   unit: "call",
//   includedUnits: 1000,
//   pricingTiers: [
//     { upTo: 10000, pricePerUnit: 0.001 },    // $0.001/call for 1K-10K
//     { upTo: 100000, pricePerUnit: 0.0005 },   // $0.0005/call for 10K-100K
//     { upTo: null, pricePerUnit: 0.0001 },      // $0.0001/call for 100K+
//   ]
// }]
```

### Investment Configuration (Futurestate Pattern)

```typescript
interface InvestmentConfig {
  assetType: 'real_estate' | 'equity' | 'debt' | 'fund' | 'token'
  tokenMint: string | null            // Solana SPL token mint address
  projectedYield: number              // annual yield percentage
  minimumInvestment: number
  maximumInvestment: number | null
  lockupPeriodDays: number
  distributionFrequency: 'monthly' | 'quarterly' | 'annually'
  complianceRequirements: string[]    // KYC tiers, accreditation, etc.
}
```

### Commerce Database Tables

| Table | Purpose |
|-------|---------|
| `products` | Universal product catalog |
| `product_variants` | Size/color/tier variants with independent pricing |
| `product_categories` | Hierarchical categories (materialized path) |
| `product_collections` | Manual or rule-based product groups |
| `product_images` | Media with alt text and ordering |
| `price_rules` | Volume, wholesale, dynamic pricing rules |
| `discount_codes` | Percentage/fixed/BXGY with usage limits |
| `inventory_movements` | Audit trail: purchase/sale/adjustment/return |
| `cart_sessions` | Session-based shopping carts |
| `cart_items` | Line items per cart |
| `orders` | Post-checkout order records |
| `order_items` | Line items per order |
| `order_fulfillments` | Shipment/delivery tracking |
| `subscriptions` | Active subscription records |
| `subscription_items` | Per-subscription line items |
| `usage_records` | Metered usage events (idempotent) |
| `usage_meters` | Meter definitions |
| `invoices` | Invoice records with templates |
| `invoice_line_items` | Invoice line detail |
| `invoice_reminders` | Scheduled reminder tracking |
| `loans` | Loan records with terms |
| `loan_repayments` | Repayment schedule and history |
| `credit_packs` | Credit pack purchase records |
| `gift_orders` | Gift metadata (recipient, message, schedule) |
| `transfer_records` | Ownership transfer audit trail |
| `proposals` | Rich proposals with e-signature |
| `estimates` | Quotes with version tracking |
| `recurring_invoices` | Scheduled invoice generation |
| `approval_workflows` | Multi-step approval chains |
| `approval_requests` | Pending approval items |

---

## Section 4: Financials Tracking & Reporting Engine (`@mcv/finance` — Tier 5)

### Overview

The Financials Engine reads from the universal ledger and produces every financial report, metric, and insight that MCV ventures need — from real-time MRR dashboards to full GAAP-compliant balance sheets. It replaces QuickBooks/Xero with a native, venture-scoped financial system while optionally syncing to external tools.

### Financial Statements

```typescript
// ═══════════════════════════════════════════════════════════
// REPORT SCOPE — every report can be global, venture, or customer
// ═══════════════════════════════════════════════════════════

interface ReportScope {
  level: 'global' | 'venture' | 'customer'
  ventureId?: string
  customerId?: string
  dateRange: { start: Date; end: Date }
  currency: string                    // reporting currency (convert all entries)
  comparePeriod?: 'previous_period' | 'previous_year' | 'custom'
  compareRange?: { start: Date; end: Date }
}

// ═══════════════════════════════════════════════════════════
// INCOME STATEMENT (P&L)
// ═══════════════════════════════════════════════════════════

interface IncomeStatement {
  scope: ReportScope
  revenue: {
    subscriptions: number
    oneTimeSales: number
    digitalProducts: number
    physicalGoods: number
    platformFees: number
    transactionFees: number
    creditSales: number
    loanInterest: number
    yieldDistributions: number
    marketplaceCommissions: number
    meteredUsage: number
    services: number
    total: number
  }
  costOfRevenue: {
    physicalGoodsCost: number
    digitalDeliveryCost: number
    paymentProcessingFees: number
    refundsAndChargebacks: number
    total: number
  }
  grossProfit: number
  grossMargin: number
  operatingExpenses: {
    infrastructure: number
    thirdPartyServices: number
    creditGrants: number
    loanWriteoffs: number
    fxGainsLosses: number
    total: number
  }
  operatingIncome: number
  otherIncome: number               // interest, credit breakage, etc.
  netIncome: number
  comparison: PercentageChange | null
}

// ═══════════════════════════════════════════════════════════
// BALANCE SHEET
// ═══════════════════════════════════════════════════════════

interface BalanceSheet {
  scope: ReportScope
  asOfDate: Date
  assets: {
    current: {
      cashAndEquivalents: number      // all fiat + crypto wallets
      accountsReceivable: number
      inventory: number
      creditsReceivable: number
      loansReceivableShortTerm: number
      externalConnections: number
      prepaidExpenses: number
      total: number
    }
    nonCurrent: {
      loansReceivableLongTerm: number
      equipment: number
      investments: number
      tokenTreasury: number
      total: number
    }
    totalAssets: number
  }
  liabilities: {
    current: {
      accountsPayable: number
      creditsPayable: number
      unearnedRevenue: number
      taxPayable: number
      refundsPayable: number
      customerDeposits: number
      loansPayableShortTerm: number
      total: number
    }
    nonCurrent: {
      loansPayableLongTerm: number
      total: number
    }
    totalLiabilities: number
  }
  equity: {
    ownersEquity: number
    retainedEarnings: number
    tokenTreasury: number
    fxTranslationReserve: number
    totalEquity: number
  }
  // Verify: assets = liabilities + equity
}

// ═══════════════════════════════════════════════════════════
// CASH FLOW STATEMENT
// ═══════════════════════════════════════════════════════════

interface CashFlowStatement {
  scope: ReportScope
  operating: {
    netIncome: number
    adjustments: {
      depreciation: number
      changeInReceivables: number
      changeInPayables: number
      changeInUnearnedRevenue: number
      changeInCreditsPayable: number
      changeInInventory: number
    }
    netOperatingCashFlow: number
  }
  investing: {
    equipmentPurchases: number
    investmentPurchases: number
    investmentSales: number
    netInvestingCashFlow: number
  }
  financing: {
    loanProceeds: number
    loanRepayments: number
    ownerDistributions: number
    ownerContributions: number
    netFinancingCashFlow: number
  }
  netCashChange: number
  beginningCash: number
  endingCash: number
  // Cash includes: fiat + crypto + exchange balances (all wallet accounts)
}
```

### Real-Time Financial Metrics

```typescript
// ═══════════════════════════════════════════════════════════
// REAL-TIME METRICS — WebSocket-pushed dashboard data
// ═══════════════════════════════════════════════════════════

interface RealTimeFinancials {
  // Revenue metrics
  mrr: number
  arr: number
  netRevenue24h: number
  netRevenue7d: number
  netRevenue30d: number
  revenueGrowthMoM: number           // month-over-month growth %

  // Subscription metrics
  activeSubscriptions: number
  trialSubscriptions: number
  churnRate30d: number
  expansionRevenue30d: number         // upgrades
  contractionRevenue30d: number       // downgrades

  // Customer metrics
  ltv: number                         // customer lifetime value
  cac: number                         // customer acquisition cost
  ltvCacRatio: number

  // Cash position
  totalCashPosition: number           // all wallets + bank accounts
  burnRate: number                    // monthly cash outflow
  runway: number                      // months remaining

  // Credit & loans
  outstandingCredits: number
  outstandingLoans: number
  creditUtilizationRate: number
  loanDefaultRate: number

  // Processing
  pendingPayouts: number
  processingFeesTotal30d: number
  smartRoutingSavings30d: number

  // Revenue breakdowns
  revenueByRail: Record<string, number>
  revenueByVenture: Record<string, number>
  revenueByProductType: Record<string, number>
  revenueByCountry: Record<string, number>

  // Accounts receivable
  arTotal: number
  arAging: {
    current: number
    days30: number
    days60: number
    days90: number
    days90plus: number
  }
}
```

### Cost Intelligence Engine

```typescript
// ═══════════════════════════════════════════════════════════
// COST INTELLIGENCE — payment processing cost optimization
// ═══════════════════════════════════════════════════════════

interface CostIntelligence {
  totalProcessingFees: number
  feesByProcessor: Record<string, number>
  feesByRail: Record<string, number>
  feesByVenture: Record<string, number>
  avgFeePercentage: number
  transactionsRouted: number
  savingsFromSmartRouting: number
  savingsFromCryptoRails: number
  savingsFromVolumeDiscounts: number
  savingsFromACH: number
  totalSavings: number
  savingsPercentage: number           // savings / (fees + savings)
  recommendations: CostRecommendation[]
}

interface CostRecommendation {
  type: 'switch_rail' | 'enable_processor' | 'negotiate_rate'
       | 'batch_payouts' | 'convert_to_crypto' | 'enable_ach'
       | 'upgrade_plan' | 'consolidate_volume'
  title: string
  description: string
  estimatedMonthlySavings: number
  effort: 'low' | 'medium' | 'high'
  ventureId: string | null            // null = global recommendation
  priority: number                    // 1 = highest
}
```

### Multi-Jurisdiction Tax Engine

```typescript
// ═══════════════════════════════════════════════════════════
// TAX ENGINE — global tax calculation, filing, remittance
// ═══════════════════════════════════════════════════════════

interface TaxCalculationRequest {
  ventureId: string
  lineItems: {
    productId: string
    amount: number
    quantity: number
    taxCategoryId: string | null
  }[]
  customerLocation: {
    country: string                   // ISO 3166-1 alpha-2
    state: string | null
    postalCode: string | null
    city: string | null
  }
  sellerLocation: {
    country: string
    state: string | null
  }
  exemptions?: TaxExemption[]
  shippingAmount?: number
  discountAmount?: number
  isB2B: boolean                      // B2B = potential reverse charge (EU)
  customerVatId?: string              // for EU B2B VAT reverse charge
}

interface TaxBreakdown {
  subtotal: number
  taxableAmount: number
  totalTax: number
  components: TaxComponent[]
  exemptAmount: number
  effectiveRate: number
}

interface TaxComponent {
  jurisdiction: string                // "CA-ON" | "US-CA-LA" | "EU-DE"
  name: string                        // "HST" | "CA State Tax" | "VAT"
  rate: number                        // 0.13, 0.0725, 0.19
  amount: number
  taxType: 'sales' | 'vat' | 'gst' | 'hst' | 'pst' | 'qst' | 'excise' | 'customs'
  compound: boolean                   // tax on tax (QST on GST in Quebec)
  inclusive: boolean                  // EU VAT = inclusive, NA = exclusive
}

interface TaxJurisdiction {
  id: string
  code: string                        // "CA-ON", "US-CA", "EU-DE"
  country: string
  state: string | null
  name: string
  taxType: string
  defaultRate: number
  categories: TaxCategoryRate[]       // different rates by product category
  thresholds: NexusThreshold[]        // when filing obligation triggers
  filingFrequency: 'monthly' | 'quarterly' | 'annually'
  filingDeadlineDays: number
}

interface NexusThreshold {
  type: 'revenue' | 'transactions' | 'physical_presence'
  threshold: number                   // $100K or 200 transactions (US Wayfair)
  period: 'calendar_year' | 'rolling_12m'
}

interface TaxReturn {
  id: string
  ventureId: string
  jurisdictionId: string
  period: { start: Date; end: Date }
  status: 'draft' | 'filed' | 'accepted' | 'rejected' | 'amended'
  taxCollected: number
  taxRemitted: number
  filingDeadline: Date
  filedAt: Date | null
  confirmationNumber: string | null
}

// Supported jurisdictions (Day 1):
// Canada: GST 5%, HST 13% (ON), 15% (NS/NB/NL/PEI), PST 7% (BC), 6% (SK), QST 9.975% (QC)
// US: State sales tax 0-10.25%, 12,000+ jurisdictions, Wayfair economic nexus
// EU: VAT 17-27%, OSS one-stop-shop, reverse charge B2B
// UK: VAT 20%, reduced 5%, zero-rated
// Australia: GST 10%
// Crypto: jurisdiction-dependent (property/capital gains treatment)

// Tax filing generates journal entries:
//   DR: Tax Payable (2060)       $amount
//   CR: Cash (1010)              $amount
```

### External Integrations

```typescript
// ═══════════════════════════════════════════════════════════
// INTEGRATIONS — sync with external accounting tools
// ═══════════════════════════════════════════════════════════

interface ExternalIntegration {
  id: string
  ventureId: string
  provider: 'quickbooks' | 'xero' | 'sage' | 'freshbooks'
  status: 'connected' | 'disconnected' | 'error'
  syncDirection: 'push' | 'pull' | 'bidirectional'
  lastSyncAt: Date | null
  syncFrequency: 'realtime' | 'hourly' | 'daily'
  mappings: AccountMapping[]          // map ledger accounts to external accounts
}

interface AccountMapping {
  ledgerAccountId: string
  externalAccountId: string
  externalAccountName: string
}

// Bank feed integrations (Plaid/Flinks):
interface BankFeedConnection {
  id: string
  ventureId: string
  provider: 'plaid' | 'flinks'
  institutionId: string
  institutionName: string
  accountIds: string[]
  status: 'active' | 'needs_reauth' | 'disconnected'
  lastSyncAt: Date
}

// Bank reconciliation:
//   External transactions matched against ledger entries
//   Unmatched items flagged for manual review
//   Auto-match rules: amount + date + description patterns
```

### Finance Database Tables

| Table | Purpose |
|-------|---------|
| `fiscal_years` | Accounting year definitions |
| `fiscal_periods` | Monthly/quarterly periods |
| `account_balances` | Period snapshots for fast reporting |
| `recurring_journals` | Auto-posted monthly entries |
| `tax_jurisdictions` | Jurisdiction rules and rates |
| `tax_category_rates` | Product-category-specific rates |
| `tax_exemptions` | Customer tax exemption certificates |
| `tax_nexus_tracking` | Per-venture nexus threshold monitoring |
| `tax_returns` | Filing history and status |
| `tax_remittances` | Payment records to tax authorities |
| `external_integrations` | QB/Xero/Sage connections |
| `account_mappings` | Ledger → external account mapping |
| `bank_connections` | Plaid/Flinks bank feed links |
| `bank_transactions` | Imported bank transactions |
| `reconciliation_rules` | Auto-match patterns |
| `reconciliation_matches` | Matched transaction pairs |
| `budget_plans` | Budget definitions per venture/department |
| `budget_allocations` | Line item allocations |
| `budget_actuals` | Actual vs budget tracking |
| `financial_reports` | Saved/scheduled report configs |
| `report_snapshots` | Point-in-time report outputs |

---

## Section 5: Super Admin Commerce UI (MCV One Desktop — Tier 7)

### Overview

The Super Admin UI surfaces all commerce and financial data inside MCV One Desktop. It operates in two modes:

1. **Global Super Admin** — Tony's God view across all ventures: consolidated financials, payment rail config, platform fee management, cross-venture analytics
2. **Venture Admin** — Scoped to a single venture: that venture's products, orders, subscriptions, invoices, and financial reports

### Navigation Integration

Fits into existing MCV One Desktop NavRail structure:

```
GLOBAL MODE:
  Commerce (new NavRail section)
    ├── Overview              # Cross-venture commerce dashboard
    │                         # Revenue heatmap, rail distribution, savings ticker
    ├── Payment Rails         # Processor config, smart routing, health monitor
    │                         # Enable/disable per venture, fee structure, fallbacks
    ├── Products              # Global product catalog (all ventures)
    │                         # Filter by type, venture, status
    ├── Orders                # All orders across ventures
    │                         # Fulfillment pipeline, dispute queue
    ├── Subscriptions         # All active subs, churn analysis, MRR
    │                         # Plan comparison, cohort retention
    ├── Credits & Wallets     # Credit system management, wallet overview
    │                         # Outstanding credits, utilization, expiration
    ├── Invoicing             # All invoices, AR aging, dunning
    │                         # Template management, approval queue
    ├── Loans & BNPL          # Lending overview, repayment tracking
    │                         # Default risk, portfolio health
    └── Tax                   # Multi-jurisdiction overview, filing status
                              # Nexus alerts, remittance calendar

  Financials (new NavRail section)
    ├── Dashboard             # Real-time P&L, MRR, ARR, burn, runway
    │                         # Cash position (all wallets/banks/crypto)
    ├── Statements            # P&L, Balance Sheet, Cash Flow
    │                         # Period comparison, drill-down to entries
    ├── Cost Intelligence     # Processing fees, savings, recommendations
    │                         # Savings counter, rail optimization tips
    ├── Ledger                # Journal entries, trial balance
    │                         # Search, filter, drill-down
    ├── Accounts              # Chart of accounts management
    │                         # Add/edit accounts, bank reconciliation
    ├── Reporting             # Custom report builder
    │                         # Scheduled reports, export (PDF/CSV/Excel)
    └── Integrations          # QB/Xero sync, bank feeds
                              # Connection status, sync history

VENTURE MODE (venture-scoped):
  Commerce
    ├── Dashboard             # Venture commerce overview
    ├── Products              # This venture's catalog
    ├── Orders                # This venture's orders
    ├── Subscriptions         # This venture's subs
    ├── Credits               # This venture's credit system
    ├── Invoicing             # This venture's invoices
    └── Settings              # Payment rails, tax config, fees

  Financials
    ├── Dashboard             # Venture financials
    ├── Statements            # Venture P&L, Balance Sheet
    ├── Costs                 # Venture processing fees
    └── Ledger                # Venture journal entries
```

### Key Super Admin Views

**Global Commerce Overview:**
- Revenue heatmap across ventures (color-coded by volume)
- Payment rail distribution pie chart (% via Stripe vs crypto vs ACH vs Interac)
- Smart routing savings ticker (real-time cumulative savings)
- Active subscriptions count + MRR trend sparkline
- Outstanding credits + loans summary
- Top 10 products by revenue across ecosystem

**Payment Rails Configuration:**
- Processor cards with health/uptime indicators
- Enable/disable toggle per venture per processor
- Platform fee structure editor (percentage/flat/tiered)
- Smart routing weight sliders (cost vs speed vs reliability)
- Fallback chain configuration
- Volume aggregation dashboard (total volume for negotiating leverage)
- Transaction success rate by processor (last 24h/7d/30d)

**Cost Intelligence Dashboard:**
- Fee breakdown charts by processor, rail, venture, product type
- Savings dashboard: "You saved $X this month via smart routing"
- Before/after comparison: Stripe-only fees vs current smart routing fees
- Recommendation cards with estimated savings and effort level
- Cost trend over time (are fees going up or down?)

**Financials Dashboard:**
- Consolidated P&L across all ventures (with venture drill-down)
- Real-time cash position gauge (all wallets + banks + crypto + exchanges)
- Burn rate trend + runway projection (months at current burn)
- Revenue breakdown by product type, rail, and venture
- AR/AP aging stacked bar charts
- Tax collection status heat map by jurisdiction

---

## Section 6: Platform API & Partner SDK (Tier 6)

### Overview

The Commerce & Financial OS is designed as infrastructure that external partners, third-party apps, and venture frontends consume via a versioned REST API with webhook delivery and a typed SDK.

### API Gateway

```
Auth: API Key + Venture Scope (internal) or OAuth2 (external partners)
Rate Limits: Tiered by plan (100 / 1K / 10K / 100K req/min)
Versioning: /v1/ prefix with deprecation headers
Format: JSON REST + WebSocket (real-time metrics)
```

### API Surface

```
Commerce API:
  POST   /v1/products                      Create product
  GET    /v1/products                      List products (paginated, filtered)
  GET    /v1/products/:id                  Get product detail
  PATCH  /v1/products/:id                  Update product
  DELETE /v1/products/:id                  Archive product

  POST   /v1/checkout/sessions             Create checkout session
  POST   /v1/orders                        Create order directly
  GET    /v1/orders/:id                    Get order with line items
  POST   /v1/orders/:id/fulfill            Mark as fulfilled
  POST   /v1/orders/:id/cancel             Cancel order

  POST   /v1/subscriptions                 Create subscription
  GET    /v1/subscriptions/:id             Get subscription
  PATCH  /v1/subscriptions/:id             Update (upgrade/downgrade)
  POST   /v1/subscriptions/:id/cancel      Cancel subscription
  POST   /v1/subscriptions/:id/pause       Pause subscription
  POST   /v1/subscriptions/:id/resume      Resume subscription
  GET    /v1/subscriptions/:id/usage       Get metered usage

  POST   /v1/credits/grant                 Grant credits to user
  POST   /v1/credits/consume               Consume credits
  GET    /v1/credits/:userId/balance       Get credit balance
  POST   /v1/credits/transfer              Transfer credits between users

  POST   /v1/invoices                      Create invoice
  GET    /v1/invoices/:id                  Get invoice
  POST   /v1/invoices/:id/send             Send to customer
  POST   /v1/invoices/:id/pay              Record payment
  POST   /v1/invoices/:id/void             Void invoice
  GET    /v1/invoices/:id/pdf              Download PDF

  POST   /v1/loans                         Create loan
  GET    /v1/loans/:id                     Get loan detail
  GET    /v1/loans/:id/schedule            Get repayment schedule
  POST   /v1/loans/:id/repay              Record repayment

  POST   /v1/gifts                         Create gift order
  POST   /v1/transfers                     Transfer product ownership

Payments API:
  POST   /v1/payments                      Create payment (router picks best rail)
  GET    /v1/payments/:id                  Get payment status
  POST   /v1/payments/:id/capture          Capture authorized payment
  POST   /v1/payments/:id/refund           Refund (full or partial)
  POST   /v1/payments/estimate             Estimate routing + fees
  POST   /v1/payouts                       Create payout to connected account
  POST   /v1/split-payments                Create split payment

Finance API:
  GET    /v1/finance/income-statement      P&L for period
  GET    /v1/finance/balance-sheet         Balance sheet at date
  GET    /v1/finance/cash-flow             Cash flow statement
  GET    /v1/finance/metrics               Real-time MRR, ARR, churn
  GET    /v1/finance/costs                 Cost intelligence
  GET    /v1/finance/tax/summary           Tax collected by jurisdiction
  GET    /v1/finance/tax/returns           Filing status

Ledger API:
  GET    /v1/ledger/accounts               Chart of accounts
  POST   /v1/ledger/accounts               Create account
  GET    /v1/ledger/entries                Journal entries (paginated)
  POST   /v1/ledger/entries                Create manual journal entry
  GET    /v1/ledger/trial-balance          Trial balance at date

Webhooks:
  POST   /v1/webhooks                      Register webhook endpoint
  GET    /v1/webhooks                      List registered webhooks
  DELETE /v1/webhooks/:id                  Remove webhook
  GET    /v1/webhooks/:id/deliveries       Delivery history
```

### Webhook Events

```
Payments:
  payment.created, payment.succeeded, payment.failed
  payment.refunded, payment.disputed
  payout.created, payout.completed, payout.failed

Subscriptions:
  subscription.created, subscription.updated
  subscription.canceled, subscription.paused, subscription.resumed
  subscription.renewed, subscription.past_due
  subscription.trial_ending (3 days before)

Orders:
  order.created, order.fulfilled, order.canceled, order.returned

Invoices:
  invoice.created, invoice.sent, invoice.viewed
  invoice.paid, invoice.partial, invoice.overdue, invoice.voided

Credits:
  credits.granted, credits.consumed, credits.expired, credits.transferred

Loans:
  loan.created, loan.disbursed, loan.repayment
  loan.past_due, loan.defaulted, loan.paid_off

Transfers:
  transfer.created, transfer.completed, transfer.failed
  gift.created, gift.delivered

Ledger:
  ledger.entry.posted, ledger.entry.reversed

Tax:
  tax.return.filed, tax.nexus.threshold_reached
  tax.remittance.due
```

Webhook delivery: HMAC-SHA256 signed, exponential backoff retry (5 attempts), idempotent (event ID dedup), filterable (subscribe to specific events only).

### Partner SDK

```typescript
// @mcv/commerce-sdk — npm package for partners and venture frontends

import { MCVCommerce } from '@mcv/commerce-sdk'

const mcv = new MCVCommerce({
  apiKey: 'mcv_live_...',
  ventureId: 'betedge',
  baseUrl: 'https://api.mcv.one',   // or self-hosted
})

// Products
const product = await mcv.products.create({ ... })
const products = await mcv.products.list({ type: 'subscription', status: 'active' })

// Subscriptions
const sub = await mcv.subscriptions.create({
  customerId: 'cus_123',
  planId: 'plan_pro_monthly',
  paymentMethod: 'pm_456',
})

// Credits
await mcv.credits.grant({
  userId: 'usr_789',
  amount: 500,
  currency: 'credits',
  reason: 'Welcome bonus',
  expiresInDays: 90,
})

// Smart routing estimate
const estimate = await mcv.payments.estimateRoute({
  amount: 5000,
  currency: 'CAD',
  method: 'interac',
  customerCountry: 'CA',
})
// => { rail: 'interac', fee: 0.50, savingsVsCard: 144.80 }

// Webhooks
await mcv.webhooks.create({
  url: 'https://betedge.ai/webhooks/mcv',
  events: ['payment.succeeded', 'subscription.renewed'],
  secret: 'whsec_...',
})

// Financial metrics
const metrics = await mcv.finance.getMetrics()
// => { mrr: 45000, arr: 540000, churnRate30d: 0.032, ... }
```

### API Rate Limiting & Plans

| Plan | Requests/min | Webhooks/mo | Transactions/mo | Price |
|------|-------------|-------------|-----------------|-------|
| Free | 100 | 10K | 500 | $0 |
| Growth | 1,000 | 100K | 5K | $49/mo |
| Scale | 10,000 | 1M | 50K | $299/mo |
| Enterprise | Custom | Unlimited | Unlimited | Custom |

---

## Cross-Cutting Concerns

### Security

- **PCI DSS:** Zero PCI scope — all card data handled client-side via Stripe.js/processor tokenization
- **API Keys:** Scoped per venture, rotatable, with IP allowlisting option
- **Webhook Signing:** HMAC-SHA256 with per-endpoint secrets
- **Ledger Immutability:** Posted entries never modified, only reversed
- **Encryption:** All credentials encrypted at rest (AES-256-GCM)
- **Audit Trail:** Every financial operation logged with userId, timestamp, IP

### Multi-Tenancy

- Every table includes `ventureId` — strict row-level security
- Cross-venture queries only available to Super Admin role
- Venture admins see only their own data
- Platform fees auto-collected per venture configuration
- Each venture has a `baseCurrency` (e.g., "USD", "CAD") — all exchange rates in journal entry lines are relative to this base. Global consolidated reports convert to platform base currency (USD).

### Event Architecture

All financial events emit to an internal event bus for:
- Real-time dashboard updates (WebSocket)
- Webhook delivery to partners
- Analytics pipeline feeding
- Gamification triggers (XP on purchases, achievements on milestones)
- Notification triggers (low balance, overdue invoice, nexus threshold)

### Existing Code to Leverage

| Existing | Location | Reuse Strategy |
|----------|----------|----------------|
| Stripe Kit | `src/lib/kits/builtin/stripe-kit.ts` | Extend as Stripe processor adapter |
| Stripe API | `api/stripe.ts` | Refactor into processor interface impl |
| Kit Types | `src/lib/kits/types.ts` | Commerce tools follow KitToolSchema |
| OAuth Helper | `api/_oauth-helper.ts` | Reuse for processor credential resolution |
| Navigation Store | `src/stores/navigation.ts` | Add commerce + financials view IDs |
| NavRail | `src/components/NavRail.tsx` | Add commerce + financials sections |

### Futurestate Patterns to Adopt

| Pattern | Futurestate Location | How to Use |
|---------|---------------------|------------|
| Compliance Tiers | `lib/compliance/tiers.ts` | Reuse for product KYC gating |
| XP Engine | `lib/progression/xp.ts` | Trigger XP on commerce events |
| Social Feed | `api/social/feed/` | Feed commerce events (purchases, achievements) |
| Blinks | `api/blinks/` | Shareable commerce links (products, invoices) |
| Wallet Integration | `lib/solana/` | Ledger wallet binding pattern |
| Split Payments | `lib/stripe/` | Extend for multi-processor splits |

---

## Verification Plan

### How to Test End-to-End

1. **Ledger:** Create a venture, verify chart of accounts auto-created. Create manual journal entry, verify balances update. Verify debits = credits constraint.

2. **Payment Router:** Configure two processors for a venture. Submit payment, verify router picks cheapest rail. Verify fallback on simulated failure. Verify journal entry created in ledger.

3. **Products:** Create one of each product type. Verify type-specific config stored correctly. Create checkout session for each type.

4. **Subscriptions:** Create subscription with trial. Verify trial → active transition. Simulate overage, verify charge/block/throttle per config.

5. **Credits:** Grant credits, consume credits, verify ledger entries (liability created on grant, revenue recognized on consumption).

6. **Invoicing:** Create invoice, send, verify reminder schedule, record payment, verify ledger entries.

7. **Loans:** Create loan, verify repayment schedule generated. Record repayment, verify principal/interest split in ledger.

8. **Tax:** Calculate tax for CA-ON customer, verify HST 13%. Calculate for US-CA, verify state tax. Verify nexus threshold tracking.

9. **Financials:** After running above flows, generate P&L and verify revenue/expense totals match. Generate balance sheet and verify assets = liabilities + equity.

10. **Cost Intelligence:** After routing multiple payments, verify savings calculation. Verify recommendations generated.

11. **API:** Hit each endpoint via SDK, verify responses match types. Register webhook, trigger event, verify delivery.

12. **Super Admin UI:** Navigate to Commerce Overview, verify data populated. Switch to venture mode, verify scoped data.
