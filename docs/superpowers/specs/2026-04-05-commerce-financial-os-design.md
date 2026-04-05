# MCV Commerce & Financial Operating System

> **Spec ID:** SPEC-002
> **Version:** 2.0.0
> **Date:** 2026-04-05
> **Status:** Draft
> **Tier:** 2-7 (Cross-cutting)
> **Author:** Tony / NAOS
> **Lifecycle:** Design → Plan → Build

---

## Executive Summary

The MCV Commerce & Financial Operating System is the foundational infrastructure layer that powers all monetary operations across the MCV ecosystem. It replaces fragmented payment integrations with a unified, cost-optimized, multi-processor financial engine that supports every commerce model — retail, digital, physical goods, subscriptions, metered billing, credit systems, overages, invoicing, loans/BNPL, marketplace transactions, creator royalties, escrow, micropayments, and vendor/supplier payments.

**This is not a feature. This is the financial rails of a new-era PaaS ecosystem.**

**Receipts are dead.** Traditional receipts (PDFs, paper, email confirmations) are replaced by **Transaction Intelligence** — living, queryable, real-time transaction records with full provenance chains, smart categorization, and cross-reference to every related financial event. Every transaction is a node in a knowledge graph, not a dead document.

**Creators get paid automatically.** Every resale, stream, usage, or derivative work triggers automatic, transparent, on-chain-verifiable royalty splits. Creator economics are a first-class primitive, not a bolt-on.

Every venture (Futurestate, BetEdge, WarForge, mcv.gg, EdgeIQ, ARQ Labs), every partner app, and every external integration consumes this as infrastructure. The system provides a universal double-entry ledger, intelligent payment routing across fiat and crypto rails, comprehensive financial reporting (replacing QuickBooks/Xero), multi-jurisdiction tax compliance, fraud detection, revenue recognition (ASC 606), financial forecasting, and a platform API with partner SDK.

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

  // Creator Economy
  | 'creator_content'       // royalty-bearing content (music, art, video, code, templates)
  | 'creator_membership'    // creator fan subscription with royalty passthrough

  // Marketplace
  | 'marketplace_listing'   // third-party seller product
  | 'marketplace_escrow'    // escrow-protected marketplace transaction

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
  creator: CreatorRoyaltyConfig | null
  escrow: EscrowConfig | null

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

## Section 7: Transaction Intelligence (Receipts Are Dead)

### Overview

Traditional receipts — PDFs, paper printouts, email confirmations — are information graveyards. They're generated, sent, and forgotten. The MCV Commerce OS replaces them with **Transaction Intelligence**: every transaction becomes a living node in a financial knowledge graph.

### Transaction Record (replaces Receipt)

```typescript
// ═══════════════════════════════════════════════════════════
// TRANSACTION INTELLIGENCE — the receipt killer
// ═══════════════════════════════════════════════════════════

interface TransactionRecord {
  id: string
  ventureId: string
  transactionNumber: string         // human-readable: TXN-2026-04-00001
  type: TransactionType
  status: TransactionStatus
  timestamp: Date

  // Parties
  payer: PartyRef                   // who paid
  payee: PartyRef                   // who received
  intermediaries: PartyRef[]        // platform, tax authorities, royalty recipients

  // Money
  amount: number
  currency: string
  exchangeRate: number | null       // if cross-currency
  fees: TransactionFee[]            // all fees broken out
  netAmount: number                 // after fees

  // Smart routing provenance
  rail: string                      // which processor handled it
  railTransactionId: string         // processor's reference
  routingDecisionId: string         // FK to routing_decisions (why this rail)
  costSaved: number                 // savings vs default routing

  // Provenance chain — every related financial event
  relatedRecords: RelatedRecord[]
  // e.g., for a subscription renewal:
  //   - Original subscription creation
  //   - Previous renewals
  //   - Associated invoice
  //   - Credit applied
  //   - Journal entry in ledger
  //   - Tax calculated
  //   - Royalty splits triggered

  // Smart categorization
  categories: string[]              // auto-tagged: "subscription", "recurring", "b2b"
  productRef: { productId: string; productName: string } | null
  subscriptionRef: { subscriptionId: string; planName: string } | null
  invoiceRef: { invoiceId: string; invoiceNumber: string } | null
  orderRef: { orderId: string } | null

  // Lifecycle events (replaces static receipt)
  events: TransactionEvent[]
  // e.g.: initiated → processing → succeeded → settled → reconciled
  // Each event has timestamp, actor, metadata

  // Access & sharing
  accessUrl: string                 // unique URL to view this record (no auth needed, signed)
  shareableLink: string             // short link for sharing
  qrCode: string                    // QR code data URL

  // Tax & compliance
  taxBreakdown: TaxComponent[] | null
  complianceTier: string | null
  jurisdictions: string[]           // tax jurisdictions involved

  metadata: Record<string, unknown>
}

type TransactionType =
  | 'purchase' | 'subscription_renewal' | 'refund' | 'credit_grant'
  | 'credit_consume' | 'transfer' | 'payout' | 'loan_disbursement'
  | 'loan_repayment' | 'royalty_distribution' | 'yield_distribution'
  | 'platform_fee' | 'tax_remittance' | 'escrow_hold' | 'escrow_release'

type TransactionStatus =
  | 'initiated' | 'processing' | 'succeeded' | 'failed'
  | 'refunded' | 'partially_refunded' | 'disputed' | 'settled'
  | 'reconciled'

interface TransactionEvent {
  timestamp: Date
  event: string                     // "payment.initiated", "payment.succeeded", etc.
  actor: string                     // userId or "system"
  metadata: Record<string, unknown>
}

interface RelatedRecord {
  type: 'transaction' | 'invoice' | 'subscription' | 'order' | 'journal_entry'
       | 'royalty_split' | 'credit_movement' | 'tax_return' | 'dispute'
  id: string
  relationship: string              // "parent" | "child" | "sibling" | "reversal"
  description: string
}

// No more PDF receipts. Ever.
// Instead: a living URL that shows the full transaction story,
// updates as events occur (settlement, reconciliation, disputes),
// and links to every related financial record.
//
// Users can:
//   - View any transaction at its URL (signed, no login needed)
//   - See the full provenance chain (what triggered this, what it triggered)
//   - Export to any format if they REALLY want a PDF (legacy compat)
//   - Search across all transactions with smart filters
//   - Set up transaction alerts and watchlists
```

### Transaction Search & Intelligence

```typescript
interface TransactionSearch {
  // Full-text search across descriptions, notes, product names
  query?: string
  // Structured filters
  ventureId?: string
  type?: TransactionType[]
  status?: TransactionStatus[]
  dateRange?: { start: Date; end: Date }
  amountRange?: { min: number; max: number }
  currency?: string
  rail?: string
  customerId?: string
  productId?: string
  // Smart filters
  hasRoyalties?: boolean
  hasSplits?: boolean
  isRecurring?: boolean
  isDisputed?: boolean
  // Aggregations
  groupBy?: 'day' | 'week' | 'month' | 'rail' | 'venture' | 'product_type'
}

// The transaction graph enables:
// - "Show me all revenue from creator X across all ventures"
// - "What's my total processing cost for Interac vs Stripe this quarter?"
// - "Trace this refund back to the original purchase and all splits"
// - "Alert me when any single-day revenue exceeds $50K"
```

---

## Section 8: Creator Royalties & Revenue Sharing

### Overview

Creator economics are a first-class primitive in MCV Commerce. Every piece of content, every digital good, every marketplace listing can have automatic, transparent royalty splits that trigger on every sale, resale, stream, usage, or derivative work.

This isn't just "creator payouts." This is an **economic engine** where creators set terms once and get paid forever — automatically, across all ventures, across all rails, with full ledger tracking.

### Royalty Configuration

```typescript
// ═══════════════════════════════════════════════════════════
// CREATOR ROYALTIES — automatic revenue sharing
// ═══════════════════════════════════════════════════════════

interface CreatorRoyaltyConfig {
  creatorId: string                   // userId of the creator
  royaltyType: RoyaltyType
  splits: RoyaltySplit[]              // who gets what
  resaleRoyalty: number | null        // % on secondary sales (e.g., 10%)
  streamingRate: number | null        // per-stream/per-view rate
  derivativePolicy: DerivativePolicy
  minimumPayout: number               // minimum balance before auto-payout
  payoutFrequency: 'realtime' | 'daily' | 'weekly' | 'monthly'
  payoutRail: string | null           // preferred payout rail (null = smart route)
  transparencyLevel: 'public' | 'holders_only' | 'private'
}

type RoyaltyType =
  | 'fixed_percentage'     // X% of every sale
  | 'tiered'               // percentage changes with volume
  | 'declining'            // percentage decreases over time
  | 'perpetual'            // fixed forever
  | 'time_limited'         // royalties expire after N years
  | 'performance_based'    // scales with engagement metrics

interface RoyaltySplit {
  recipientId: string                 // userId, ventureId, or external
  recipientType: 'creator' | 'collaborator' | 'label' | 'publisher'
                | 'platform' | 'charity'
  percentage: number                  // share of royalty pool
  description: string                 // "Primary artist 60%", "Producer 15%"
  vestingSchedule: VestingSchedule | null  // optional: royalties vest over time
}

interface VestingSchedule {
  cliffMonths: number                 // months before any royalties
  vestingMonths: number               // total vesting period
  vestingPercentageAtCliff: number    // % unlocked at cliff
  // Linear vesting after cliff
}

interface DerivativePolicy {
  allowDerivatives: boolean
  derivativeRoyaltyPercent: number    // % from derivative works
  requireAttribution: boolean
  requireApproval: boolean            // creator must approve derivatives
}

// ═══════════════════════════════════════════════════════════
// ROYALTY DISTRIBUTION — how payments flow to creators
// ═══════════════════════════════════════════════════════════

// When a sale occurs for a royalty-bearing product:
//
// 1. Sale of $100 digital art with 15% creator royalty:
//    Total splits:
//      Creator (primary):    $12.00 (80% of 15%)
//      Collaborator:         $1.50  (10% of 15%)
//      Publisher:            $1.50  (10% of 15%)
//      Platform fee:         $5.00  (5%)
//      Seller revenue:       $80.00
//
// 2. Resale on marketplace ($150) with 10% resale royalty:
//    Creator (primary):      $12.00 (80% of 10%)
//    Collaborator:           $1.50  (10% of 10%)
//    Publisher:              $1.50  (10% of 10%)
//    Platform fee:           $7.50  (5%)
//    Seller (reseller):      $127.50
//
// 3. Each split generates:
//    - A SplitPaymentItem in the payment router
//    - A JournalEntry line in the ledger
//    - A TransactionRecord linking to the royalty agreement
//    - An update to the creator's RoyaltyDashboard metrics
//
// On-chain enforcement (Solana Token-2022):
//   Transfer Hook validates royalty payment before token transfer
//   Royalty is enforced at the protocol level, not just the app level

// ═══════════════════════════════════════════════════════════
// REVENUE SHARING / AFFILIATE PROGRAMS
// ═══════════════════════════════════════════════════════════

interface RevenueSharingProgram {
  id: string
  ventureId: string
  name: string                        // "Affiliate Program", "Partner Revenue Share"
  type: 'affiliate' | 'referral' | 'reseller' | 'white_label'
  commissionStructure: CommissionStructure
  cookieDurationDays: number          // attribution window
  minimumPayout: number
  payoutFrequency: 'monthly' | 'biweekly'
  status: 'active' | 'paused' | 'archived'
  terms: string                       // legal terms URL
}

interface CommissionStructure {
  type: 'flat' | 'percentage' | 'tiered' | 'recurring'
  flatAmount?: number
  percentage?: number
  tiers?: { minRevenue: number; maxRevenue: number; percentage: number }[]
  recurringMonths?: number            // for recurring: how many months of commissions
  // e.g., SaaS affiliate: 20% of first 12 months of subscription revenue
}

interface AffiliatePartner {
  id: string
  programId: string
  userId: string
  referralCode: string
  customLink: string                  // vanity URL
  totalReferrals: number
  totalRevenue: number
  totalCommissions: number
  pendingPayout: number
  status: 'active' | 'suspended'
}
```

### Creator Dashboard (Venture-Scoped View)

```
Creator Hub (new NavRail section in venture mode):
  ├── Overview          # Total earnings, active royalties, pending payouts
  ├── Content           # My royalty-bearing products/content
  ├── Royalties         # Royalty agreement details, split breakdowns
  ├── Earnings          # Earnings history, projections, by-product breakdown
  ├── Payouts           # Payout history, pending, schedule
  ├── Analytics         # Stream counts, resale volume, derivative tracking
  └── Collaborators     # Manage collaborator splits, invitations
```

---

## Section 9: Escrow Service

### Overview

Escrow is missing from most commerce platforms and it shouldn't be. Any marketplace transaction, milestone-based service, or high-value exchange needs a trusted intermediary. MCV's escrow is a ledger primitive — funds are held in escrow accounts (a liability) until release conditions are met.

```typescript
// ═══════════════════════════════════════════════════════════
// ESCROW — trusted intermediary for high-value transactions
// ═══════════════════════════════════════════════════════════

interface EscrowConfig {
  releaseCondition: EscrowReleaseCondition
  disputeResolutionMethod: 'platform_arbitration' | 'mutual_agreement' | 'time_based'
  autoReleaseDays: number | null      // auto-release after N days if no dispute
  inspectionPeriodDays: number        // buyer inspection period after delivery
  platformEscrowFee: number           // percentage fee for escrow service
}

type EscrowReleaseCondition =
  | 'buyer_confirms'           // buyer manually confirms satisfaction
  | 'milestone_complete'       // specific milestones met
  | 'time_based'               // auto-release after period
  | 'dual_approval'            // both parties must approve
  | 'third_party_verification' // external verifier confirms

interface EscrowAgreement {
  id: string
  ventureId: string
  buyerId: string
  sellerId: string
  amount: number
  currency: string
  status: 'pending_funding' | 'funded' | 'in_progress' | 'pending_release'
         | 'released' | 'disputed' | 'refunded' | 'canceled'
  milestones: EscrowMilestone[]       // for milestone-based release
  escrowAccountId: string             // ledger account holding the funds
  releaseCondition: EscrowReleaseCondition
  expiresAt: Date
  metadata: Record<string, unknown>
}

interface EscrowMilestone {
  id: string
  name: string
  description: string
  amount: number                      // portion of total released at this milestone
  status: 'pending' | 'submitted' | 'approved' | 'rejected'
  dueDate: Date | null
  submittedAt: Date | null
  approvedAt: Date | null
  evidence: string[]                  // URLs to proof of completion
}

// Escrow ledger flow:
//
// Fund escrow:
//   DR: Escrow Holding Account (1095)    $5,000
//   CR: Cash (1010)                      $5,000
//
// Release milestone (50%):
//   DR: Escrow Fee Expense               $125   (2.5% fee)
//   DR: Seller Payout                    $2,375
//   CR: Escrow Holding Account (1095)    $2,500
//
// Dispute → refund:
//   DR: Cash (buyer refund)              $2,500
//   CR: Escrow Holding Account (1095)    $2,500
```

---

## Section 10: Micropayments & Batching

### Overview

Sub-$1 transactions are economically impossible on traditional payment rails (a $0.10 purchase costs $0.33 on Stripe). MCV solves this with **credit-based micropayments** and **batch settlement** — transactions accumulate as credit movements and settle to real rails periodically.

```typescript
// ═══════════════════════════════════════════════════════════
// MICROPAYMENTS — sub-$1 economics that actually work
// ═══════════════════════════════════════════════════════════

interface MicropaymentConfig {
  // Threshold below which payments use credits instead of real rails
  micropaymentThreshold: number       // e.g., $5.00
  // How credits are topped up
  autoTopUpEnabled: boolean
  autoTopUpAmount: number             // e.g., $25.00
  autoTopUpTrigger: number            // top up when balance falls below this
  autoTopUpRail: string               // which rail to charge for top-up
  // Batch settlement
  batchSettlementFrequency: 'hourly' | 'daily' | 'weekly'
  batchSettlementMinimum: number      // minimum accumulated before settling
}

// Use cases:
//   WarForge: $0.25 in-game item purchase → credit deduction (instant, $0 fee)
//   EdgeIQ: $0.001 per API call → usage accumulated, invoiced monthly
//   mcv.gg: $0.50 tip to creator → credit transfer (instant, $0 fee)
//   BetEdge: $0.10 micro-bet → credit deduction (instant, $0 fee)
//
// Economics:
//   User tops up $25 via Stripe card → $0.73 + $0.30 fee = $1.03 (4.1%)
//   User makes 100 x $0.25 purchases = $25.00 total
//   Effective fee: $1.03 / $25.00 = 4.1% (vs $103.00 if each was a card charge = 412%!)
//   Savings: 99% vs per-transaction card charging
//
// Even better with crypto:
//   User tops up $25 via USDC → $0.005 fee (0.02%)
//   100 purchases still cost $0.005 total in fees
```

---

## Section 11: Vendor & Supplier Payments (Accounts Payable)

### Overview

The spec originally focused on **collecting** money. But ventures also need to **pay** people — vendors, suppliers, contractors, creators, affiliates. The AP (Accounts Payable) system manages outbound payments with the same smart routing and ledger tracking.

```typescript
// ═══════════════════════════════════════════════════════════
// ACCOUNTS PAYABLE — paying vendors, suppliers, contractors
// ═══════════════════════════════════════════════════════════

interface Vendor {
  id: string
  ventureId: string
  name: string
  email: string
  type: 'supplier' | 'contractor' | 'creator' | 'affiliate' | 'service_provider'
  taxId: string | null                // for 1099/T4A reporting
  paymentPreferences: {
    preferredRail: string | null
    preferredCurrency: string
    bankAccountId: string | null      // for ACH/wire
    walletAddress: string | null      // for crypto
    paypalEmail: string | null
  }
  defaultPaymentTerms: string         // "net_30", "on_receipt", etc.
  status: 'active' | 'inactive'
  ytdPayments: number                 // year-to-date for tax reporting
}

interface Bill {
  id: string
  ventureId: string
  vendorId: string
  billNumber: string
  amount: number
  currency: string
  status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'paid' | 'voided'
  dueDate: Date
  paymentTerms: string
  lineItems: BillLineItem[]
  approvalChainId: string | null      // multi-step approval for large payments
  scheduledPayDate: Date | null
  paidAt: Date | null
  paidVia: string | null              // which rail was used
  attachments: string[]               // invoice scans, contracts
}

interface BillLineItem {
  description: string
  amount: number
  accountId: string                   // which expense account to debit
  taxAmount: number
  projectId: string | null            // cost center tracking
}

// Bill payment journal entry:
//   DR: Expense Account (5xxx)       $1,000
//   CR: Accounts Payable (2010)      $1,000
//
// When paid:
//   DR: Accounts Payable (2010)      $1,000
//   CR: Cash (1010)                  $1,000

// Batch payouts:
//   Accumulate multiple vendor payments and send in a single batch
//   Reduces per-transaction fees (especially for wire/ACH)
//   Schedule: "Pay all approved bills every Friday"

// Tax reporting:
//   Track YTD payments per vendor for 1099 (US) / T4A (Canada) filing
//   Auto-generate tax forms at year end
//   Flag vendors approaching reporting thresholds ($600 US, $500 CA)
```

---

## Section 12: Fraud Detection & Prevention

### Overview

Every payment system is a target. MCV Commerce includes built-in fraud detection that scores every transaction before it reaches a processor, using velocity checks, behavioral analysis, and configurable rules.

```typescript
// ═══════════════════════════════════════════════════════════
// FRAUD DETECTION — ML-scored transaction risk
// ═══════════════════════════════════════════════════════════

interface FraudCheckResult {
  transactionId: string
  riskScore: number                   // 0-100 (0 = safe, 100 = definitely fraud)
  decision: 'allow' | 'review' | 'block'
  signals: FraudSignal[]
  requiresVerification: boolean       // trigger 3D Secure, OTP, etc.
}

interface FraudSignal {
  type: FraudSignalType
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  score: number                       // contribution to overall risk score
}

type FraudSignalType =
  | 'velocity_amount'          // too much spend in short time
  | 'velocity_count'           // too many transactions in short time
  | 'geo_mismatch'             // billing country != IP country
  | 'device_fingerprint'       // new/suspicious device
  | 'card_testing'             // small amounts testing card validity
  | 'account_age'              // very new account making large purchase
  | 'unusual_amount'           // amount far outside user's normal range
  | 'time_anomaly'             // transaction at unusual time for user
  | 'repeated_decline'         // multiple failed attempts
  | 'known_fraud_pattern'      // matches known fraud behavior

interface FraudRule {
  id: string
  ventureId: string | null            // null = platform-wide
  name: string
  condition: string                   // rule expression: "amount > 10000 AND account_age < 7d"
  action: 'block' | 'review' | 'require_3ds' | 'flag' | 'add_score'
  scoreImpact: number                 // how much to add to risk score
  enabled: boolean
}

// Chargeback prevention:
// - 3D Secure 2.0 for high-risk transactions (shifts liability to issuer)
// - Address Verification (AVS) on all card transactions
// - CVV/CVC verification required
// - IP geolocation vs billing address comparison
// - Device fingerprinting for repeat fraud detection
// - Velocity limits configurable per venture
// - Real-time fraud score visible in Super Admin
```

---

## Section 13: Revenue Recognition (ASC 606)

### Overview

For fundraising, audits, and proper GAAP compliance, MCV needs automated revenue recognition following ASC 606 (the standard that governs when revenue can be "recognized" on financial statements). This is critical for subscriptions, credits, and multi-element arrangements.

```typescript
// ═══════════════════════════════════════════════════════════
// REVENUE RECOGNITION — ASC 606 compliance
// ═══════════════════════════════════════════════════════════

interface RevenueSchedule {
  id: string
  ventureId: string
  sourceType: 'subscription' | 'credit_pack' | 'service' | 'license' | 'bundle'
  sourceId: string
  totalAmount: number
  recognizedAmount: number
  deferredAmount: number
  startDate: Date
  endDate: Date
  recognitionMethod: RecognitionMethod
  entries: RevenueEntry[]
  status: 'active' | 'completed' | 'voided'
}

type RecognitionMethod =
  | 'straight_line'         // evenly over period (subscriptions)
  | 'usage_based'           // as usage occurs (metered)
  | 'milestone'             // at completion milestones (services)
  | 'point_in_time'         // immediately on delivery (one-time sales)
  | 'proportional'          // based on stand-alone selling prices (bundles)

interface RevenueEntry {
  id: string
  scheduleId: string
  periodId: string
  amount: number
  type: 'recognition' | 'deferral' | 'adjustment'
  journalEntryId: string              // FK to ledger
  recognizedAt: Date
}

// Subscription revenue recognition:
//   Customer pays $120 for annual plan on March 15
//   
//   On payment:
//     DR: Cash $120
//     CR: Unearned Revenue (2030) $120     ← liability, not revenue yet
//   
//   Each month (Mar-Feb):
//     DR: Unearned Revenue $10
//     CR: Revenue - Subscriptions $10      ← now it's revenue
//   
//   March (partial): $10 * (16/31) = $5.16 recognized
//   April-February: $10/month
//   March (remaining): $10 * (15/31) = $4.84 recognized

// Credit pack revenue recognition:
//   Customer buys 1000 credits for $50
//   Revenue recognized as credits are consumed (usage-based)
//   Unused credits at expiry → breakage revenue
```

---

## Section 14: Financial Forecasting & Intelligence

### Overview

The ledger contains enough data to predict the future. AI-powered financial forecasting uses historical ledger data, subscription metrics, and external signals to project revenue, expenses, cash flow, and runway.

```typescript
// ═══════════════════════════════════════════════════════════
// FINANCIAL FORECASTING — AI-powered projections
// ═══════════════════════════════════════════════════════════

interface ForecastRequest {
  ventureId: string | null            // null = consolidated
  metric: ForecastMetric
  horizonMonths: number               // how far to project (3, 6, 12, 24)
  scenarios: ('conservative' | 'base' | 'optimistic')[]
  includeSeasonality: boolean
  externalSignals?: string[]          // "market_conditions", "industry_trends"
}

type ForecastMetric =
  | 'revenue'              // total revenue projection
  | 'mrr'                  // MRR trajectory
  | 'expenses'             // expense projection
  | 'cash_flow'            // net cash flow
  | 'runway'               // months until cash runs out
  | 'churn'                // churn rate projection
  | 'customer_count'       // subscriber growth
  | 'ltv'                  // LTV evolution
  | 'processing_costs'     // payment processing cost trend

interface ForecastResult {
  metric: ForecastMetric
  horizonMonths: number
  scenarios: {
    conservative: ForecastDataPoint[]
    base: ForecastDataPoint[]
    optimistic: ForecastDataPoint[]
  }
  confidence: number                  // 0-1 confidence level
  keyDrivers: string[]                // what's driving the forecast
  risks: ForecastRisk[]               // what could go wrong
}

interface ForecastDataPoint {
  date: Date
  value: number
  upperBound: number                  // confidence interval
  lowerBound: number
}

interface ForecastRisk {
  description: string
  probability: number                 // 0-1
  impact: number                      // dollar impact
  mitigation: string                  // suggested action
}

// Forecast inputs (from ledger + metrics):
//   - Historical MRR/ARR with growth rate
//   - Churn cohort analysis (when do customers leave?)
//   - Seasonal patterns (Q4 spike, summer dip, etc.)
//   - Expansion/contraction revenue trends
//   - Processing cost trends (are we optimizing over time?)
//   - Credit consumption velocity (how fast do users spend credits?)
//   - Loan repayment patterns (default rate projections)
//
// Output: visual projections on the Financials Dashboard
//   with confidence intervals and scenario comparisons
```

---

## Section 15: Multi-Entity Consolidation

### Overview

EdgeIQ Holdings is the parent entity. Each venture is a separate financial entity. The consolidation engine produces combined financial statements with inter-venture elimination entries — essential for corporate reporting, fundraising, and tax compliance.

```typescript
// ═══════════════════════════════════════════════════════════
// CONSOLIDATION — holding company financial rollup
// ═══════════════════════════════════════════════════════════

interface ConsolidatedReport {
  parentEntity: string                // "EdgeIQ Holdings"
  reportType: 'income_statement' | 'balance_sheet' | 'cash_flow'
  period: { start: Date; end: Date }
  currency: string                    // reporting currency (USD)

  // Individual venture statements
  ventureStatements: Record<string, IncomeStatement | BalanceSheet | CashFlowStatement>

  // Elimination entries
  eliminations: EliminationEntry[]

  // Consolidated result
  consolidated: IncomeStatement | BalanceSheet | CashFlowStatement
}

interface EliminationEntry {
  description: string
  debitAccount: string
  debitAmount: number
  creditAccount: string
  creditAmount: number
  reason: 'intercompany_revenue' | 'intercompany_payable' | 'intercompany_investment'
          | 'unrealized_profit' | 'platform_fee_internal'
}

// Example: Futurestate pays MCV Platform a 1% platform fee
//   On Futurestate's books: Expense $1,000
//   On MCV Platform's books: Revenue $1,000
//   Elimination: Remove both — it's internal money movement
//
// Example: BetEdge uses ARQ Labs' AI service
//   BetEdge: Expense $5,000
//   ARQ Labs: Revenue $5,000
//   Elimination: Remove both on consolidated statements

// Minority interest tracking (if ventures have external investors):
//   Futurestate may have external LPs
//   Their share of profit/loss shown separately on consolidated P&L
```

---

## Section 16: Dunning & Payment Recovery

### Overview

Failed payments are the #1 revenue leak in subscription businesses. MCV Commerce includes a configurable dunning engine that automatically retries failed payments, sends escalating notifications, and manages grace periods before cancellation.

```typescript
// ═══════════════════════════════════════════════════════════
// DUNNING — automated failed payment recovery
// ═══════════════════════════════════════════════════════════

interface DunningConfig {
  ventureId: string
  retrySchedule: DunningRetry[]       // when and how to retry
  notificationSchedule: DunningNotification[]
  gracePeriodDays: number             // days before subscription canceled
  finalAction: 'cancel' | 'pause' | 'downgrade_to_free'
  smartRetryEnabled: boolean          // AI picks optimal retry time
}

interface DunningRetry {
  dayAfterFailure: number             // e.g., 1, 3, 5, 7
  retryTime: string | 'smart'        // "09:00" or "smart" (AI-optimized)
  rail: string | 'same'              // try different rail? or same
}

interface DunningNotification {
  dayAfterFailure: number
  channel: 'email' | 'sms' | 'push' | 'in_app'
  template: string                    // notification template ID
  includeUpdatePaymentLink: boolean
  tone: 'friendly' | 'urgent' | 'final'
}

// Default dunning flow:
//   Day 0:  Payment fails → retry immediately on same rail
//   Day 1:  Retry on different rail + friendly email
//   Day 3:  Retry + "action needed" email with payment update link
//   Day 5:  Retry (smart timing) + urgent push notification
//   Day 7:  Final retry + "last chance" email
//   Day 10: Grace period expires → final action (cancel/pause/downgrade)
//
// Smart retry (AI-optimized):
//   Analyzes when the customer's payments historically succeed
//   Retries at the optimal time (e.g., payday patterns)
//   Tries different rails (card failed? try ACH/bank)
//   Industry benchmark: smart retry recovers 30-40% more than dumb retry

// Dunning dashboard in Super Admin:
//   - Currently in dunning: count + total revenue at risk
//   - Recovery rate (% of failed payments successfully retried)
//   - Revenue recovered this month
//   - Average days to recovery
//   - Dunning funnel (how many at each stage)
```

---

## Section 17: Price Localization

### Overview

A $50 product in the US shouldn't cost $50 in India. Price localization automatically adjusts prices based on customer geography and purchasing power parity, maximizing global revenue while remaining fair.

```typescript
// ═══════════════════════════════════════════════════════════
// PRICE LOCALIZATION — geography-aware pricing
// ═══════════════════════════════════════════════════════════

interface PriceLocalizationConfig {
  ventureId: string
  enabled: boolean
  baseCurrency: string                // prices authored in this currency
  strategy: 'purchasing_power_parity' | 'exchange_rate_only' | 'manual_override'
  roundingRule: 'nearest_99' | 'nearest_dollar' | 'exact'
  minimumPrice: Record<string, number>  // per-currency minimum (e.g., INR: 50)
  countryOverrides: CountryPriceOverride[]
}

interface CountryPriceOverride {
  country: string                     // ISO code
  currency: string
  multiplier: number                  // e.g., 0.4 for India (60% discount)
  reason: string                      // "PPP adjustment" or "market pricing"
}

// Example: $50 USD subscription
//   US:     $50.00 USD (base)
//   Canada: $67.99 CAD (exchange rate)
//   India:  ₹999 INR (PPP: ~$12 equivalent — 76% discount)
//   Brazil: R$79.90 BRL (PPP: ~$16 equivalent — 68% discount)
//   UK:     £39.99 GBP (exchange rate + rounding)
//   EU:     €44.99 EUR (exchange rate + rounding)
//
// VPN/fraud prevention:
//   Localized price tied to billing address, not IP
//   Payment method country must match pricing country
//   Gift purchases use buyer's pricing, not recipient's
```

---

## Section 18: Orchestration Integration

### Overview

The Commerce & Financial OS integrates with MCV's existing Algorithmic Orchestration Engine (SPEC-001) to surface commerce tasks, financial alerts, and operational intelligence in the Command Center.

### Task Integration

Commerce events automatically create orchestration tasks:

```typescript
// Commerce → Orchestration task mapping
interface CommerceTaskTrigger {
  event: string
  taskTemplate: {
    type: 'epic' | 'sprint' | 'story' | 'task' | 'sub_atomic'
    title: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    assignee: string | 'auto'         // auto = based on venture/role
    ventureId: string
  }
}

// Auto-generated tasks:
//   invoice.overdue            → "Follow up on overdue invoice INV-001 ($5,000)"
//   subscription.past_due      → "Recover failed payment for customer X"
//   tax.nexus.threshold_reached → "Register for sales tax in California (threshold hit)"
//   fraud.high_risk            → "Review flagged transaction TXN-001 (risk: 87)"
//   loan.past_due              → "Contact borrower about late payment on loan LOAN-001"
//   vendor.payment_due         → "Approve vendor payment batch ($12,500)"
//   revenue.anomaly            → "Investigate 40% revenue drop in BetEdge (last 24h)"
//   payout.failed              → "Resolve failed payout to Venture X connected account"
//   escrow.dispute             → "Arbitrate escrow dispute #ESC-001 ($3,200)"
//   royalty.payout_ready       → "Process creator royalty batch ($8,750 to 23 creators)"
//   dunning.final_stage        → "12 subscriptions entering final dunning stage ($3,600 MRR)"
//   cost.optimization          → "Enable ACH for US subs — estimated savings $2,400/mo"

// Session tracking:
//   Long-running financial operations (batch payouts, tax filing, bank reconciliation)
//   tracked as Sessions in the orchestration engine
//   visible in Command Center with progress indicators
```

### Command Center Widgets

New widgets for the Command Center dashboard:

```
Commerce Widgets:
  - Revenue Ticker (real-time rolling 24h revenue)
  - Active Subscriptions gauge with MRR
  - Payment Rail Health (green/yellow/red per processor)
  - Smart Routing Savings counter
  - Dunning Recovery funnel
  - Outstanding AR aging mini-chart

Financial Widgets:
  - Cash Position (all wallets + banks + crypto)
  - Burn Rate + Runway indicator
  - Revenue Forecast sparkline (next 6 months)
  - Cost Intelligence score (how optimized are we?)
  - Tax Filing Calendar (upcoming deadlines)
  - Creator Royalty payout queue
```

---

## Section 19: Device Hub — Physical-Digital Bridge Infrastructure

### 19.1 Purpose & Scope

The Device Hub transforms MCV One Desktop from a software-only interface into a **workstation operating system** that treats physical hardware as first-class citizens of the intelligence layer. Every connected device becomes both a sensor (feeding data into NAOS) and an actuator (receiving commands from NAOS).

**This is the physical-digital bridge for the entire MCV ecosystem.**

The operator's desk — Stream Deck, GoXLR mixer, MIDI controllers, audio interfaces, barcode scanners, serial peripherals — is no longer separate from the build system. Every button press, fader move, and voice input can trigger agent workflows, navigate ventures, execute kit tools, and feed into the orchestration engine. Conversely, the system pushes state back to devices: Stream Deck buttons light up with venture status, GoXLR faders reflect audio routing decisions, LEDs indicate build health.

Connected Claude Code sessions and remote NAOS agents are also modeled as devices — unifying hardware peripherals and software agents under a single discovery, mapping, and control framework.

### 19.2 Device Discovery Protocol

```
Discovery Sources:
  ├── USB HID         — node-hid enumeration (vendorId/productId matching)
  ├── Stream Deck     — @elgato-stream-deck/node auto-detection
  ├── GoXLR           — GoXLR utility daemon (localhost WebSocket probe)
  ├── MIDI            — @julusian/midi port scanning
  ├── Serial          — serialport library enumeration
  ├── Web Audio       — navigator.mediaDevices.enumerateDevices()
  ├── Bluetooth       — Web Bluetooth API (future, behind flag)
  └── Agent Sessions  — ~/.claude/projects/ filesystem scan + Supabase active_sessions
```

**Discovery is continuous**: the local server polls USB/HID every 3 seconds and diffs against known devices. Hot-plug events trigger immediate re-scan. GoXLR utility connection is persistent (reconnect on drop). Agent session discovery runs on 10-second intervals.

### 19.3 Device Registry

Central state managed by `useDeviceStore` (Zustand, persisted to localStorage). Every device — physical or software — gets a `DeviceDescriptor`:

```typescript
type DeviceTransport = 'usb-hid' | 'midi' | 'web-audio' | 'serial' | 'bluetooth' | 'websocket' | 'http';

type DeviceClass =
  | 'stream-deck'       // Elgato Stream Deck (all models)
  | 'goxlr'             // TC-Helicon GoXLR / GoXLR Mini
  | 'midi-controller'   // Generic MIDI controller
  | 'audio-interface'   // Audio input/output devices
  | 'barcode-scanner'   // USB HID barcode/NFC scanners
  | 'hid-generic'       // Any unrecognized USB HID device
  | 'serial-generic'    // Serial port devices
  | 'agent-session';    // Claude Code / NAOS agent instance

type DeviceCapability =
  | 'button-input'      // Pressable buttons (Stream Deck, MIDI pads)
  | 'fader-input'       // Sliding faders (GoXLR, MIDI)
  | 'encoder-input'     // Rotary encoders
  | 'audio-input'       // Microphone capture
  | 'audio-output'      // Speaker/headphone output
  | 'audio-routing'     // Programmable audio routing matrix (GoXLR)
  | 'display-output'    // Pixel display on buttons (Stream Deck LCD)
  | 'led-output'        // Controllable LED indicators
  | 'sampler'           // Audio sample playback (GoXLR sampler)
  | 'effects'           // Audio effects engine (GoXLR reverb, echo, pitch)
  | 'text-input'        // Text/barcode data input
  | 'agent-io';         // Bidirectional agent communication

interface DeviceDescriptor {
  id: string;                          // Unique: USB serial, generated UUID, or session ID
  class: DeviceClass;
  transport: DeviceTransport;
  name: string;                        // Human-readable: "Stream Deck XL", "GoXLR Mini"
  manufacturer?: string;
  model?: string;
  firmware?: string;
  capabilities: DeviceCapability[];
  status: 'connected' | 'disconnected' | 'error' | 'initializing';
  lastSeen: number;                    // Unix timestamp
  metadata: Record<string, unknown>;   // Device-specific (button count, fader count, etc.)
}
```

### 19.4 Input Ingestion Pipeline

Every physical interaction flows through a normalized pipeline into the intelligence layer:

```
Physical Device (button press, fader move, voice, scan)
  │
  ▼
Local Server (Node.js, port 3100)
  │  — Raw protocol handling (HID reports, MIDI messages, serial data)
  │  — Device-specific normalization
  │
  ▼
SSE Stream → Browser
  │  — Server-Sent Events per device (or multiplexed)
  │
  ▼
DeviceStore.pushEvent(event: DeviceInputEvent)
  │  — Ring buffer (last 500 events)
  │  — Event published to subscribers
  │
  ▼
Mapping Engine
  │  — Matches event against active DeviceMappings
  │  — Checks venture context scope
  │
  ▼
Action Dispatcher
  ├── navigate(viewId)           — Switch MCV Desktop view
  ├── kit-tool(kitId, tool, input)  — Execute any loaded kit tool
  ├── agent-command(prompt)      — Inject prompt into Aegis/NAOS
  ├── webhook(url, method, body) — Fire external webhook
  ├── audio-route(routing)       — Modify GoXLR routing matrix
  ├── command-palette(command)   — Trigger any command palette action
  └── composite(actions[])       — Chain multiple actions sequentially
```

```typescript
interface DeviceInputEvent {
  id: string;
  deviceId: string;
  timestamp: number;
  type: 'button-press' | 'button-release' | 'fader-change' | 'encoder-rotate' |
        'audio-level' | 'text-scan' | 'agent-message' | 'midi-note' | 'midi-cc';
  payload: Record<string, unknown>;    // Type-specific data
  // Examples:
  //   button-press:   { buttonIndex: 3, page: 0 }
  //   fader-change:   { faderName: 'A', value: 0.75 }
  //   midi-note:      { note: 60, velocity: 127, channel: 0 }
  //   text-scan:      { text: 'SKU-12345', format: 'code128' }
  //   agent-message:  { sessionId: 'abc', content: '...', role: 'assistant' }
}
```

### 19.5 Output Control Pipeline

The system pushes state and commands back to physical devices:

```
NAOS Agent / Kit Tool / UI Action / Orchestration Event
  │
  ▼
DeviceStore.sendCommand(command: DeviceOutputCommand)
  │
  ▼
HTTP POST → Local Server (port 3100)
  │  — Route to device-specific driver
  │
  ▼
Device Driver
  ├── node-hid write (raw HID output reports)
  ├── @elgato-stream-deck/node (set button image, brightness)
  ├── GoXLR utility WebSocket (set fader, route audio, trigger sampler)
  ├── MIDI output (note, CC, sysex)
  └── Serial write (raw bytes)
  │
  ▼
Physical Device (LED lights up, fader moves, image changes, sound plays)
```

```typescript
interface DeviceOutputCommand {
  id: string;
  deviceId: string;
  type: 'set-button-image' | 'set-button-color' | 'set-fader-position' |
        'set-led-color' | 'play-sample' | 'set-effect' | 'route-audio' |
        'set-brightness' | 'send-agent-command';
  payload: Record<string, unknown>;
  // Examples:
  //   set-button-image: { buttonIndex: 3, imageBuffer: Uint8Array, format: 'rgb' }
  //   set-fader-position: { faderName: 'A', value: 0.5 }
  //   route-audio: { input: 'mic', output: 'stream', enabled: true }
  //   play-sample: { bank: 'A', slot: 1 }
  //   send-agent-command: { sessionId: 'abc', prompt: 'run the tests' }
}
```

### 19.6 Stream Deck Integration

Elgato Stream Deck (all models: Mini 6-button, MK.2 15-button, XL 32-button, Plus with encoders+LCD strip, Pedal 3-button) serves as a **physical command palette** for MCV operations.

**Button Mapping Architecture:**

```text
Stream Deck Page (per-venture or global)
  └── Button[index]
       ├── icon: Dynamic image (venture logo, status indicator, real-time metric)
       ├── label: Short text overlay
       └── mapping: DeviceMapping → action on press/release
```

**Dynamic Icon Generation:**
- Icons generated server-side using `canvas` (node-canvas)
- Real-time data rendered onto buttons: build status (green/red), MRR sparkline, active sessions count
- Venture logos pre-loaded, status badges overlaid dynamically
- Stream Deck Plus LCD strip shows scrolling ticker (revenue, alerts, session names)

**Page System:**

```text
Page 0: Global Command
  ├── [0] Command Center    [1] Portfolio    [2] Aegis AI
  ├── [3] BetEdge           [4] Futurestate  [5] WarForge
  ├── [6] mcv.gg            [7] EdgeIQ       [8] ARQ Labs
  ├── [9] Sessions          [10] Build       [11] Deploy
  └── [12] Mute Mic         [13] DND Toggle  [14] Lock

Page 1: BetEdge Context (auto-switch when venture = betedge)
  ├── [0] Dashboard         [1] Live Bets    [2] Analytics
  ├── ...venture-specific actions...
  └── [14] Back to Global

Page N: Per-venture pages...
```

**Auto-page switching:** When the user switches ventures in MCV Desktop, the Stream Deck automatically switches to that venture's page. The mapping engine checks `contextId` on each mapping.

### 19.7 GoXLR Integration

The GoXLR (TC-Helicon) is a professional audio mixer with programmable routing, effects, sampler, and motorized faders. Integration via the open-source **GoXLR Utility** daemon which exposes a localhost WebSocket API.

**Capabilities exposed:**

| Feature | Input (from GoXLR) | Output (to GoXLR) |
|---------|--------------------|--------------------|
| **Faders** | Fader position changes (A/B/C/D, 0-255) | Set fader position programmatically |
| **Routing Matrix** | — | Route any input to any output (mic→stream, game→headphones, etc.) |
| **Mute Buttons** | Mute state changes | Toggle mutes programmatically |
| **Effects** | — | Set reverb, echo, pitch, megaphone, robot, hardtune parameters |
| **Sampler** | Sample playback triggers | Play, stop, assign samples to banks A/B/C |
| **Mic Settings** | — | Gate, compressor, EQ, de-esser configuration |
| **Profiles** | Profile switch events | Load named GoXLR profile |

**NAOS-Aware Audio Routing:**
- "Meeting mode": GoXLR routes mic to stream, mutes game audio, activates compressor
- "Build mode": GoXLR routes music to headphones, mic to push-to-talk, sampler armed for sound effects
- "Stream mode": Full routing — mic to stream+monitor, game to stream, music to headphones only
- Profiles auto-switch based on MCV Desktop venture context or NAOS agent commands

### 19.8 Connected Sessions

Claude Code instances and remote NAOS agents are modeled as devices with `class: 'agent-session'` and capability `'agent-io'`.

**Discovery:**

```text
Local Discovery:
  ~/.claude/projects/
    ├── c--Users-moust-mcv-one-desktop/     → active session if lock file exists
    ├── c--Users-moust-Documents-GitHub-.../  → another session
    └── ...

Remote Discovery (future):
  Supabase table: active_sessions
    ├── session_id, user_id, project, device, status, last_heartbeat
    └── Realtime subscription for live updates
```

**Session-as-Device model:**
```typescript
// A connected Claude Code session
{
  id: 'session-abc123',
  class: 'agent-session',
  transport: 'websocket',
  name: 'mcv-one-desktop (master)',
  capabilities: ['agent-io'],
  status: 'connected',
  metadata: {
    projectDir: 'C:/Users/moust/mcv-one-desktop',
    branch: 'master',
    model: 'claude-opus-4-6',
    loadedKits: ['github', 'tasks', 'docs'],
    activeView: 'engineering',
    lastMessage: 'Building device hub components...',
    pid: 12345
  }
}
```

**Cross-session capabilities:**
- View all active sessions across the workstation and network
- Send a prompt to any session ("run the test suite in Futurestate")
- Broadcast commands by venture ("all BetEdge sessions: pull latest and rebuild")
- Monitor session health and activity (message rate, last command, errors)
- Stream Deck button per active session with status color

### 19.9 Device Profiles & Presets

Named profiles bundle device configurations for specific contexts:

```typescript
interface DeviceProfile {
  id: string;
  name: string;                        // "Trading Desk", "Build Mode", "Stream Setup"
  description?: string;
  ventureId?: string;                  // null = global, otherwise venture-scoped
  mappings: DeviceMapping[];           // All button/fader/input mappings for this profile
  streamDeckPages?: StreamDeckPage[];  // Stream Deck page layouts
  goxlrPreset?: string;               // GoXLR profile name to load
  audioRouting?: AudioRoutingPreset;   // Audio routing matrix state
  activateOn: 'venture-switch' | 'manual' | 'schedule' | 'trigger';
}

interface DeviceMapping {
  id: string;
  deviceId: string;
  inputPattern: {
    type: DeviceInputEvent['type'];
    filter?: Record<string, unknown>;  // e.g., { buttonIndex: 3 } or { faderName: 'A' }
  };
  action: DeviceMappingAction;
  contextId?: string;                  // Venture scope (null = any)
}

type DeviceMappingAction =
  | { type: 'navigate'; viewId: string }
  | { type: 'kit-tool'; kitId: string; toolName: string; input: Record<string, unknown> }
  | { type: 'agent-command'; prompt: string; ventureId?: string }
  | { type: 'webhook'; url: string; method: string; body: Record<string, unknown> }
  | { type: 'command-palette'; command: string }
  | { type: 'audio-route'; routing: Record<string, unknown> }
  | { type: 'composite'; actions: DeviceMappingAction[] };

interface StreamDeckPage {
  id: string;
  name: string;
  buttons: Array<{
    index: number;
    icon?: string;                     // URL or base64 image
    label?: string;                    // Text overlay
    color?: string;                    // Background color
    mappingId?: string;                // FK to DeviceMapping
  }>;
}

interface AudioRoutingPreset {
  routes: Array<{
    input: string;                     // 'mic' | 'game' | 'music' | 'chat' | 'system' | 'sample'
    output: string;                    // 'headphones' | 'stream' | 'line-out' | 'chat-mic'
    enabled: boolean;
    volume?: number;                   // 0-1
  }>;
  effects?: Record<string, unknown>;   // Reverb, echo, pitch settings
}
```

**Auto-activation:** When the user switches to BetEdge in the NavRail, the "Trading Desk" profile activates — Stream Deck switches to the BetEdge page, GoXLR loads the trading audio profile, and mappings update to BetEdge-specific actions.

### 19.10 Security

| Concern | Mitigation |
|---------|------------|
| **Local server exposure** | CORS origin validation: only `localhost:5173` (Vite dev) and `localhost:4173` (preview) accepted |
| **USB HID access** | Node-level: `node-hid` requires explicit vendorId/productId open. No blanket HID enumeration of sensitive devices |
| **GoXLR daemon** | Connection to `localhost:14564` only (GoXLR utility default). No external network access |
| **Remote sessions** | Authenticated via Clerk JWT. Session discovery requires matching `userId` in Supabase |
| **Agent command injection** | All `agent-command` actions are logged and rate-limited (max 10/minute per device). Destructive prompts require HITL confirmation |
| **Audit trail** | Every `DeviceInputEvent` and `DeviceOutputCommand` logged to FlightRecorder telemetry |
| **Device permissions** | First-time device access prompts user confirmation in the Device Hub UI |

### 19.11 Kit Integration

The **Device Kit** (`device-kit.ts`) is a builtin kit registered in the AgentOrchestrator, making device operations available as tools in any NAOS/Aegis conversation:

```text
Kit: device-kit
Scope: * (all ventures)
Tools:
  ├── list_devices          — List all connected devices with status
  ├── get_device_state      — Detailed state of a specific device
  ├── send_device_command   — Send output command (set button, move fader, play sample)
  ├── set_device_mapping    — Create or update an input→action mapping
  ├── activate_device_profile — Switch to a named device profile
  ├── list_device_profiles  — List available profiles
  └── get_device_events     — Recent events from the ring buffer (last N)
```

**Example NAOS interaction:**

```text
User: "Set up my Stream Deck for the BetEdge trading session"

NAOS: [calls list_devices] → finds Stream Deck XL
      [calls activate_device_profile] → activates "Trading Desk" profile
      [calls send_device_command] → sets button 0 to BetEdge logo
      [calls send_device_command] → sets button 1 to live odds feed icon
      → "Done. Your Stream Deck is configured for BetEdge trading.
         Button 0: BetEdge dashboard, Button 1: Live odds, Button 2: Place bet..."
```

### 19.12 App Instance Detection & Multi-Screen Awareness

Each running MCV Desktop instance (browser, PWA, Capacitor) self-registers as a device with `class: 'app-instance'`. The instance registry bridges the existing Presence system (Supabase Realtime) into the Device Hub, creating a unified view of all hardware peripherals AND all running app instances.

**Detection Capabilities:**

| Signal | Source | Data |
| --- | --- | --- |
| Screen resolution | `window.screen` | Width x height, pixel ratio |
| Screen class | `classifyScreen()` | ultrawide, cinema, desktop, tablet, phone |
| Multi-monitor | Window Management API | Screen count, labels, positions, which screen this window is on |
| Device type | User agent + touch detection | desktop, tablet, phone |
| Platform | Navigator | win32, macos, ios, android, linux |
| PWA mode | `display-mode: standalone` | Boolean |
| Capacitor | `window.Capacitor` | Boolean |
| Battery | Battery API | Level (0-100%), charging state |
| Network | Network Information API | WiFi, 4G, 3G, offline |
| GPS | Geolocation API | Lat/lng coordinates |
| City | IP geolocation | City name, timezone |
| System health | Local server `/local/health` | CPU count, memory, hostname, uptime |

**Instance Registration Flow:**

```text
App Boot
  → captureDeviceSnapshot() — screen, platform, battery, GPS, network
  → buildSelfDescriptor() — create DeviceDescriptor with class 'app-instance'
  → useDeviceStore.registerDevice() — add to local device registry
  → usePresence() → Supabase Realtime broadcast — visible to all users
  → useInstanceRegistration() — 15s periodic refresh (screen resize, battery changes)
```

**Multi-Screen Detection:**

Uses the Window Management API (`getScreenDetails()`) when available:

- Enumerates all connected monitors with labels, resolution, position, pixel ratio
- Identifies which physical screen this browser window is currently on
- Falls back to `window.screen` for single-monitor or when permission is denied

**Supabase Tables:**

- `active_instances` — live registry of all running instances (heartbeat-based, 5min TTL)
- `screen_registry` — persistent catalog of all screens ever connected (for layout memory)

### 19.13 Mobile Device Integration

Mobile instances (iOS/Android via Capacitor or PWA) register with enhanced capabilities:

**Mobile-specific capabilities:**

- `touch-input` — multi-touch gesture support
- `camera-input` — photo/video capture for document scanning, visual input
- `gps-input` — real-time location for geo-aware workflows
- `audio-input` / `audio-output` — voice commands, dictation, audio capture

**Mobile-specific metadata:**

- Battery level and charging state (critical for long-running tasks)
- Network type (WiFi vs cellular, signal quality)
- GPS coordinates (for location-aware venture context)
- Device orientation (portrait vs landscape)

**Use cases:**

- Phone as a remote control for desktop Stream Deck layouts
- Tablet as a secondary dashboard screen showing real-time metrics
- Mobile camera feed for document/receipt scanning into the commerce system
- Voice-first interaction on mobile feeding into NAOS agent conversations
- GPS-based auto-venture switching (at the office → work ventures, at home → personal)

### 19.14 Architecture Position

```text
Tier 7: MCV One Desktop (Device Hub UI)
Tier 6: Device Kit (NAOS tool interface)
Tier 5: Device Store + Mapping Engine (application state)
Tier 3: Local Server Device Bridge (protocol translation)
Tier 1: Physical Devices (USB HID, GoXLR, Stream Deck, MIDI, Audio, Agent Sessions)
```

### Navigation Integration

New top-level NavRail section between Engineering and Growth & CRM:

```text
Devices (new NavRail section)
  ├── Device Hub           # Dashboard: all devices, status, events, profiles
  ├── Stream Deck          # Button grid, page layouts, mapping editor
  ├── Audio Router         # GoXLR routing matrix, faders, effects, sampler
  └── Sessions             # Connected Claude Code instances, cross-session commands
```

---

## Verification Plan

(Expanded from v1.0 to cover new sections)

### How to Test End-to-End

### How to Test End-to-End

**Core (Sections 1-6):**

1. **Ledger:** Create venture → verify chart of accounts auto-created. Create manual journal entry → verify balances update. Verify debits = credits constraint.

2. **Payment Router:** Configure two processors for a venture. Submit payment → verify router picks cheapest rail. Verify fallback on simulated failure. Verify journal entry created in ledger.

3. **Products:** Create one of each product type (all 17). Verify type-specific config stored correctly. Create checkout session for each type.

4. **Subscriptions:** Create subscription with trial. Verify trial → active transition. Simulate overage → verify charge/block/throttle per config.

5. **Credits:** Grant credits → consume credits → verify ledger entries (liability on grant, revenue on consumption). Test credit expiry and transfer.

6. **Invoicing:** Create invoice → send → verify reminder schedule → record payment → verify ledger entries.

7. **Loans:** Create loan → verify repayment schedule generated. Record repayment → verify principal/interest split in ledger.

8. **Tax:** Calculate tax for CA-ON customer (verify HST 13%), US-CA (state tax), EU-DE (VAT 19%). Verify nexus threshold tracking.

9. **Financials:** After all above flows, generate P&L → verify totals match. Generate balance sheet → verify assets = liabilities + equity.

10. **Cost Intelligence:** After routing multiple payments, verify savings calculation and recommendations generated.

11. **API:** Hit each endpoint via SDK → verify responses match types. Register webhook → trigger event → verify delivery with HMAC signature.

12. **Super Admin UI:** Navigate Commerce Overview → verify data populated. Switch to venture mode → verify scoped data.

**Expanded (Sections 7-18):**

13. **Transaction Intelligence:** Verify every payment generates a TransactionRecord (not a receipt). Verify provenance chain links related records. Verify signed access URL works without auth.

14. **Creator Royalties:** Create royalty-bearing product → sell it → verify automatic splits to creator + collaborators. Resell on marketplace → verify resale royalty triggers. Verify on-chain enforcement via Token-2022 Transfer Hook.

15. **Escrow:** Create escrow agreement → fund it → verify funds in escrow ledger account. Submit milestone → approve → verify partial release. Simulate dispute → verify refund flow.

16. **Micropayments:** Top up credits → make 100 sub-$1 purchases → verify zero per-transaction fees. Verify batch settlement to real rail at configured frequency.

17. **Vendor Payments:** Create vendor → create bill → approve → pay → verify AP ledger entries. Test batch payouts. Verify YTD tracking for tax form generation.

18. **Fraud Detection:** Submit high-risk transaction → verify risk score > 80 → verify review/block action. Verify velocity checks catch card testing patterns.

19. **Revenue Recognition:** Create annual subscription → verify $120 deferred as unearned revenue. Advance 1 month → verify $10 recognized. Verify schedule entries match ledger.

20. **Forecasting:** Request 6-month MRR forecast → verify 3 scenarios generated with confidence intervals. Verify key drivers and risks populated.

21. **Consolidation:** Generate P&L for 2 ventures + consolidated → verify inter-venture eliminations applied. Verify consolidated total matches.

22. **Dunning:** Simulate failed payment → verify retry schedule executes. Verify notifications sent at configured intervals. Verify smart retry selects optimal time.

23. **Price Localization:** Set base price $50 USD → request price for India → verify PPP-adjusted price (~₹999). Verify billing address validation prevents VPN abuse.

24. **Orchestration:** Trigger an overdue invoice → verify task created in orchestration engine. Verify Command Center widget shows commerce metrics.

**Device Hub (Section 19):**

25. **Device Hub:** Navigate to Device Hub → verify scan endpoint returns (empty list OK). Connect Stream Deck → verify auto-detected and displayed. Map button to navigate action → press button → verify view changes. Switch venture → verify Stream Deck page auto-switches. Verify GoXLR status endpoint returns state (or graceful "not found"). Verify connected sessions lists active Claude Code instances from `~/.claude/projects/`. In Aegis chat, say "list my devices" → verify `list_devices` kit tool executes and returns results.
