# @mcv/domains/commerce — Commerce Platform

**Parent Package:** @mcv/domains  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Purpose

The `commerce` domain provides a full-stack, multi-tenant commerce platform that powers every revenue-generating activity within the MCV ecosystem. It spans the entire commercial lifecycle — from product catalog management and shopping cart operations through checkout, payment processing, invoicing, subscriptions, and fulfillment. Every venture on the platform gets an independent, fully-isolated commerce stack with its own Stripe Connect account, product catalog, tax configuration, and order pipeline.

**This domain is the single source of truth for all monetary transactions, product data, and commercial operations across MCV.**

Unlike monolithic e-commerce platforms, the Commerce domain is composed of 11 focused submodules that can be used independently or in concert. A SaaS venture might only use Subscriptions and Payments. A retail venture uses Catalog, Cart, Checkout, and Shipping. A consulting firm uses Invoicing and Proposals. The modular design means ventures pay (in complexity) only for what they use.

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

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CATALOG API
// ═══════════════════════════════════════════════════════════════════════════════

// Product operations
export {
  createProduct,           // Create product with full pricing/media/SEO
  updateProduct,           // Partial update with optimistic locking
  deleteProduct,           // Soft-delete (marks discontinued)
  getProduct,              // Get by ID with variants, rules, inventory
  listProducts,            // Paginated list with filters/sort
  duplicateProduct,        // Clone product with new SKU
  archiveProduct,          // Set status to archived
  bulkUpdateProductStatus, // Batch status change (max 100)
  bulkDeleteProducts,      // Batch delete (max 100)
  syncProductToStripe,     // Push product/price to Stripe
  getLowStockProducts,     // Products below threshold
} from './server/services/product-service';

// Category operations (tree hierarchy)
export {
  createCategory,          // Create with auto materialized path
  updateCategory,          // Update name, slug, parent, etc.
  deleteCategory,          // Delete with child reassignment
  getCategory,             // Get single category
  listCategories,          // Paginated flat list
  getCategoryTree,         // Full tree structure
  moveCategory,            // Reparent node (recalculates paths)
  getCategoryAncestors,    // Breadcrumb chain
  getCategoryDescendants,  // All nested children
  recountCategoryProducts, // Recount product_count field
} from './server/services/category-service';

// Discount codes
export {
  createDiscount,          // Create percentage/fixed/BXGY discount
  updateDiscount,          // Update rules and limits
  deleteDiscount,          // Remove discount code
  getDiscount,             // Get by ID
  listDiscounts,           // Paginated with type filter
  validateDiscountCode,    // Check validity without applying
  applyDiscountToCart,     // Apply and calculate discount amount
  incrementDiscountUsage,  // Bump usage counter on order complete
} from './server/services/discount-service';

// Inventory management
export {
  recordInventoryMovement, // Record purchase/sale/adjustment/return/transfer
  bulkAdjustInventory,     // Batch stock adjustments (max 100)
  transferInventory,       // Move stock between variants
  listInventoryMovements,  // Audit trail with date range
  getLowStockAlerts,       // Products needing restock
  getStockReport,          // Snapshot of current stock levels
} from './server/services/inventory-service';

// Price rules (B2B, volume, tiered)
export {
  createPriceRule,         // Create volume/tiered/group/time rule
  updatePriceRule,         // Update rule config
  deletePriceRule,         // Remove rule
  getPriceRule,            // Get by ID
  listPriceRules,          // Paginated with product/type filter
  listPriceRulesByProduct, // All rules for a product
  calculateEffectivePrice, // Resolve final price given context
} from './server/services/price-rule-service';

// Product collections
export {
  createCollection,             // Create manual or automated collection
  updateCollection,             // Update rules/metadata
  deleteCollection,             // Remove collection
  getCollection,                // Get by ID with products
  listCollections,              // Paginated with type filter
  addProductsToCollection,      // Manual add (max 100)
  removeProductsFromCollection, // Manual remove (max 100)
  reorderCollectionProducts,    // Set sort order
  evaluateCollectionRules,      // Re-evaluate automated rules
} from './server/services/collection-service';

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENTS API (Stripe Connect)
// ═══════════════════════════════════════════════════════════════════════════════

// Stripe Connect accounts
export {
  createConnectedAccount,    // Create standard/express/custom account
  getAccount,                // Get venture's connected account
  generateOnboardingLink,    // Generate Stripe onboarding URL
  getBalance,                // Current Stripe balance
  updateApplicationFee,      // Super admin: set fee percentage
  listConnectedAccounts,     // Super admin: all accounts
} from './server/services/stripe-connect-service';

// Payment products & prices
export {
  createPaymentProduct,      // Create Stripe product
  updatePaymentProduct,      // Update product details
  archivePaymentProduct,     // Deactivate product
  getPaymentProduct,         // Get by ID
  listPaymentProducts,       // Paginated with type filter
  createPrice,               // Create one-time or recurring price
  archivePrice,              // Deactivate price
  listPrices,                // List prices for product
} from './server/services/product-service';

// Payment customers
export {
  createPaymentCustomer,     // Create customer (syncs to Stripe)
  listPaymentCustomers,      // Paginated customer list
} from './server/services/customer-service';

// Checkout sessions
export {
  createCheckoutSession,     // Create Stripe checkout session
  createPaymentLink,         // Create reusable payment link
  getCheckoutSession,        // Get session status
  expireCheckoutSession,     // Force-expire open session
} from './server/services/checkout-service';

// Subscriptions
export {
  createSubscription,        // Create with optional trial
  updateSubscription,        // Change price/quantity
  cancelSubscription,        // Cancel immediately or at period end
  pauseSubscription,         // Pause billing
  resumeSubscription,        // Resume paused subscription
  listSubscriptions,         // Paginated with status filter
  getUpcomingInvoice,        // Preview next invoice
  applySubscriptionDiscount, // Apply coupon to subscription
} from './server/services/subscription-service';

// Invoices (Stripe-native)
export {
  createStripeInvoice,       // Create invoice with line items
  updateStripeInvoice,       // Update before finalization
  sendStripeInvoice,         // Finalize and send
  voidStripeInvoice,         // Void open invoice
  markUncollectible,         // Mark as uncollectible
  addInvoiceLineItem,        // Add line item to draft invoice
  listStripeInvoices,        // Paginated with status filter
} from './server/services/invoice-service';

// Refunds & disputes
export {
  createRefund,              // Full or partial refund
  listRefunds,               // Paginated refund list
  listDisputes,              // Active disputes
  submitDisputeEvidence,     // Submit evidence for dispute
} from './server/services/refund-service';

// Payouts
export {
  createPayout,              // Initiate standard/instant payout
  listPayouts,               // Payout history
} from './server/services/payout-service';

// Revenue reporting
export {
  getMrr,                    // Monthly recurring revenue
  getArr,                    // Annual recurring revenue
  getChurnRate,              // Subscription churn rate
  getLtv,                    // Customer lifetime value
  getRevenueTimeline,        // Revenue over time (day/week/month)
  getRevenueByProduct,       // Revenue per product
  getPaymentMethodBreakdown, // Card vs bank vs ACH split
  getPlatformRevenue,        // Super admin: platform fee revenue
  getOutstandingInvoices,    // Unpaid invoice totals
} from './server/services/reporting-service';

// ═══════════════════════════════════════════════════════════════════════════════
// INVOICING API (Advanced — beyond Stripe-native)
// ═══════════════════════════════════════════════════════════════════════════════

// Invoice templates
export {
  createInvoiceTemplate,     // Branded template with colors/logo/tax config
  updateInvoiceTemplate,     // Update branding/settings
  deleteInvoiceTemplate,     // Remove template
  listInvoiceTemplates,      // All venture templates
} from './server/services/invoice-template-service';

// Invoices V2 (advanced lifecycle)
export {
  createInvoiceV2,           // Create with line items, template, reminders
  updateInvoiceV2,           // Update draft invoice
  deleteInvoiceV2,           // Delete draft
  getInvoiceV2,              // Get by ID with relations
  listInvoicesV2,            // Paginated with rich filters
  sendInvoiceV2,             // Send via email with payment link
  markInvoiceViewed,         // Track recipient view
  recordPayment,             // Record manual payment (card/cash/check)
  applyCredit,               // Apply credit note to invoice
  voidInvoiceV2,             // Void sent invoice
  writeOffInvoice,           // Write off uncollectible
  duplicateInvoiceV2,        // Clone invoice
  getInvoiceSummary,         // Dashboard stats
  getInvoiceHtml,            // Rendered HTML for preview
  getInvoicePdfData,         // PDF generation data
  detectOverdueInvoices,     // Cron: mark overdue
  processReminders,          // Cron: send due reminders
} from './server/services/invoice-v2-service';

// Proposals
export {
  createProposal,            // Create with rich content blocks
  updateProposal,            // Update content/pricing
  deleteProposal,            // Remove proposal
  getProposal,               // Get by ID
  listProposals,             // Paginated with status filter
  sendProposal,              // Send to client
  markProposalViewed,        // Track view
  acceptProposal,            // Accept with e-signature
  declineProposal,           // Decline with reason
  convertProposalToInvoice,  // Convert accepted proposal to invoice
  getProposalSummary,        // Dashboard stats
} from './server/services/proposal-service';

// Estimates / Quotes
export {
  createEstimate,            // Create versioned estimate
  updateEstimate,            // Update with version tracking
  deleteEstimate,            // Remove estimate
  getEstimate,               // Get by ID with versions
  listEstimates,             // Paginated with status filter
  sendEstimate,              // Send to client
  markEstimateViewed,        // Track view
  acceptEstimate,            // Accept with e-signature
  declineEstimate,           // Decline with reason
  convertEstimateToInvoice,  // Convert with progress invoicing
  duplicateEstimate,         // Clone estimate
  getEstimateSummary,        // Dashboard stats
  detectExpiredEstimates,    // Cron: mark expired
} from './server/services/estimate-service';

// Recurring invoices
export {
  createRecurringInvoice,    // Create scheduled invoice generation
  updateRecurringInvoice,    // Update schedule/template
  pauseRecurringInvoice,     // Pause generation
  resumeRecurringInvoice,    // Resume generation
  cancelRecurringInvoice,    // Cancel permanently
  getRecurringInvoice,       // Get by ID
  listRecurringInvoices,     // Paginated with status filter
  processDueRecurringInvoices, // Cron: generate due invoices
} from './server/services/recurring-invoice-service';

// Credit notes
export {
  createCreditNote,          // Create credit against invoice
  issueCreditNote,           // Issue (make applicable)
  voidCreditNote,            // Void credit note
  listCreditNotes,           // Paginated with invoice filter
} from './server/services/credit-note-service';

// Platform fees (super admin)
export {
  getPlatformFeeConfig,          // Get fee config for venture
  updatePlatformFeeConfig,       // Update percentage/flat/tiered
  listPlatformFeeConfigs,        // All venture fee configs
  getPlatformRevenueReport,      // Revenue from platform fees
} from './server/services/platform-fee-service';

// Approval workflows
export {
  createApprovalWorkflow,    // Create multi-step approval
  updateApprovalWorkflow,    // Update rules/approvers
  deleteApprovalWorkflow,    // Remove workflow
  listApprovalWorkflows,     // List by entity type
  submitForApproval,         // Submit entity for review
  makeApprovalDecision,      // Approve/reject/request changes
  getApprovalStatus,         // Check current approval state
  getMyPendingApprovals,     // Approvals awaiting user decision
  cancelApproval,            // Cancel pending approval
} from './server/services/approval-service';

// Document engagement tracking
export {
  trackDocumentView,         // Track view with device/location/duration
  getEngagementScore,        // Engagement score for document
  getViewHistory,            // All views for a document
  getEngagementHeatmap,      // Section-level attention heatmap
  getEngagementReport,       // Venture-wide engagement report
} from './server/services/engagement-service';

// Interactive pricing
export {
  createPricingConfig,       // Create package/builder pricing
  updatePricingConfig,       // Update pricing options
  getPricingConfig,          // Get config for entity
  selectPackage,             // Client selects a package
  toggleAddon,               // Client toggles addon
  updatePricingQuantity,     // Client adjusts quantity
  lockPricingSelection,      // Lock selection for conversion
  getPricingSelectionSummary,// Get current selection total
} from './server/services/interactive-pricing-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TAX API
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createTaxCategory,         // Create tax category (e.g., "Physical Goods")
  listTaxCategories,         // All categories for venture
  deleteTaxCategory,         // Remove category
  createTaxRate,             // Create rate (country/state/postal)
  listTaxRates,              // Rates with location filter
  deleteTaxRate,             // Remove rate
} from './server/services/tax-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

// Catalog hooks
export { useProducts } from './client/hooks/use-products';
export { useProduct } from './client/hooks/use-product';
export { useCategories } from './client/hooks/use-categories';
export { useCategoryTree } from './client/hooks/use-category-tree';
export { useCollections } from './client/hooks/use-collections';
export { useInventory } from './client/hooks/use-inventory';
export { useDiscounts } from './client/hooks/use-discounts';

// Cart hooks
export { useCart } from './client/hooks/use-cart';
export { useCartActions } from './client/hooks/use-cart-actions';

// Checkout hooks
export { useCheckout } from './client/hooks/use-checkout';
export { useCheckoutSession } from './client/hooks/use-checkout-session';

// Payment hooks
export { usePayments } from './client/hooks/use-payments';
export { useSubscriptions } from './client/hooks/use-subscriptions';
export { useStripeConnect } from './client/hooks/use-stripe-connect';
export { useRevenueDashboard } from './client/hooks/use-revenue-dashboard';

// Invoicing hooks
export { useInvoices } from './client/hooks/use-invoices';
export { useProposals } from './client/hooks/use-proposals';
export { useEstimates } from './client/hooks/use-estimates';
export { useRecurringInvoices } from './client/hooks/use-recurring-invoices';
export { useApprovalWorkflows } from './client/hooks/use-approval-workflows';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { ProductCatalog } from './client/components/product-catalog';
export { ProductEditor } from './client/components/product-editor';
export { CategoryManager } from './client/components/category-manager';
export { InventoryDashboard } from './client/components/inventory-dashboard';
export { ShoppingCart } from './client/components/shopping-cart';
export { CheckoutFlow } from './client/components/checkout-flow';
export { InvoiceBuilder } from './client/components/invoice-builder';
export { InvoicePreview } from './client/components/invoice-preview';
export { ProposalBuilder } from './client/components/proposal-builder';
export { EstimateBuilder } from './client/components/estimate-builder';
export { SubscriptionManager } from './client/components/subscription-manager';
export { RevenueDashboard } from './client/components/revenue-dashboard';
export { PaymentHistory } from './client/components/payment-history';
export { StripeOnboarding } from './client/components/stripe-onboarding';
export { InteractivePricing } from './client/components/interactive-pricing';
export { ApprovalQueue } from './client/components/approval-queue';
export { EngagementAnalytics } from './client/components/engagement-analytics';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  PRODUCT_TYPES,
  PRODUCT_STATUSES,
  DISCOUNT_TYPES,
  PRICE_RULE_TYPES,
  COLLECTION_TYPES,
  INVENTORY_MOVEMENT_TYPES,
  PAYMENT_STATUSES,
  SUBSCRIPTION_STATUSES,
  INVOICE_STATUSES,
  INVOICE_V2_STATUSES,
  PROPOSAL_STATUSES,
  ESTIMATE_STATUSES,
  CHECKOUT_MODES,
  REFUND_REASONS,
  PAYOUT_METHODS,
  RECURRING_INTERVALS,
  PLATFORM_FEE_TYPES,
  APPROVAL_ENTITY_TYPES,
  TAX_DEFAULTS,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Catalog types
  Product,
  NewProduct,
  ProductVariant,
  NewProductVariant,
  ProductCategory,
  NewProductCategory,
  ProductImage,
  ProductDimensions,
  ProductCollection,
  NewProductCollection,
  CollectionAutoRules,
  CollectionProduct,
  DiscountCode,
  NewDiscountCode,
  DiscountApplicableTo,
  PriceRule,
  NewPriceRule,
  PriceRuleConfig,
  InventoryMovement,
  NewInventoryMovement,

  // Tax types
  TaxCategory,
  NewTaxCategory,
  CatalogTaxRate,
  NewCatalogTaxRate,

  // Payment types
  StripeAccount,
  NewStripeAccount,
  PaymentProduct,
  NewPaymentProduct,
  Price,
  NewPrice,
  PaymentCustomer,
  NewPaymentCustomer,
  Subscription,
  NewSubscription,
  Invoice,
  NewInvoice,
  InvoiceLineItem,
  Payment,
  NewPayment,
  Refund,
  NewRefund,
  Dispute,
  NewDispute,
  Payout,
  NewPayout,
  PaymentTaxRate,
  NewPaymentTaxRate,
  CheckoutSession,
  NewCheckoutSession,
  CheckoutLineItem,
  PaymentLink,
  NewPaymentLink,

  // Invoicing types
  InvoiceTemplate,
  NewInvoiceTemplate,
  InvoiceTemplateColors,
  InvoiceTaxConfig,
  InvoiceV2,
  NewInvoiceV2,
  InvoiceV2LineItem,
  InvoiceReminder,
  InvoiceAddress,
  Proposal,
  NewProposal,
  ProposalContentBlock,
  RecurringInvoice,
  NewRecurringInvoice,
  RecurringTemplateConfig,
  CreditNote,
  NewCreditNote,
  PaymentReceipt,
  NewPaymentReceipt,
  PlatformFeeConfig,
  NewPlatformFeeConfig,
  TieredFeeConfig,
  PlatformFeeLedgerEntry,
  NewPlatformFeeLedgerEntry,
  Estimate,
  NewEstimate,
  EstimateVersionEntry,
  ProgressInvoicing,
  ApprovalWorkflow,
  NewApprovalWorkflow,
  ApprovalRuleConfig,
  ApprovalRequest,
  NewApprovalRequest,
  ApprovalDecision,
  NewApprovalDecision,
} from './types';
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                          COMMERCE DOMAIN ARCHITECTURE                                     │
│                                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              ENTRY POINTS                                            │  │
│  │                                                                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │  │
│  │  │  Admin Panel │  │  Storefront  │  │  Public API  │  │  Webhooks    │            │  │
│  │  │  (Internal)  │  │  (Customer)  │  │  (External)  │  │  (Stripe)    │            │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │  │
│  │         │                 │                  │                 │                     │  │
│  │         └─────────────────┴──────────────────┴─────────────────┘                     │  │
│  │                                     │                                                │  │
│  └─────────────────────────────────────┼────────────────────────────────────────────────┘  │
│                                        │                                                   │
│  ┌─────────────────────────────────────▼────────────────────────────────────────────────┐  │
│  │                            tRPC ROUTER LAYER                                          │  │
│  │                                                                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                      │  │
│  │  │ catalogRouter   │  │ paymentsRouter  │  │ invoicingRouter │                      │  │
│  │  │                 │  │                 │  │                 │                      │  │
│  │  │ • Products      │  │ • Stripe Connect│  │ • Templates     │                      │  │
│  │  │ • Categories    │  │ • Checkout      │  │ • Invoices V2   │                      │  │
│  │  │ • Discounts     │  │ • Subscriptions │  │ • Proposals     │                      │  │
│  │  │ • Inventory     │  │ • Invoices      │  │ • Estimates     │                      │  │
│  │  │ • Price Rules   │  │ • Refunds       │  │ • Recurring     │                      │  │
│  │  │ • Collections   │  │ • Payouts       │  │ • Credit Notes  │                      │  │
│  │  │ • Tax           │  │ • Reporting     │  │ • Approvals     │                      │  │
│  │  │                 │  │                 │  │ • Engagement    │                      │  │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                      │  │
│  │           │                    │                     │                                │  │
│  └───────────┼────────────────────┼─────────────────────┼────────────────────────────────┘  │
│              │                    │                     │                                   │
│  ┌───────────▼────────────────────▼─────────────────────▼────────────────────────────────┐  │
│  │                           SERVICE LAYER                                                │  │
│  │                                                                                        │  │
│  │                    ┌───────────────────────────────┐                                   │  │
│  │  ┌─────────┐      │     COMMERCE FLOW             │      ┌─────────┐                 │  │
│  │  │         │      │                               │      │         │                 │  │
│  │  │ CATALOG ├─────▶│  Catalog ──▶ Cart ──▶ Checkout├─────▶│ PAYMENT │                 │  │
│  │  │         │      │     │                    │    │      │         │                 │  │
│  │  │ products│      │     │    ┌───────────┐   │    │      │ stripe  │                 │  │
│  │  │ variants│      │     ▼    │           │   ▼    │      │ connect │                 │  │
│  │  │ pricing │      │  Discount│  Tax Calc │ Order  │      │ charges │                 │  │
│  │  │ inventory      │  Engine  │  Engine   │ Create │      │ refunds │                 │  │
│  │  │ collections    │     │    │           │   │    │      │ disputes│                 │  │
│  │  │         │      │     ▼    └───────────┘   ▼    │      │         │                 │  │
│  │  └─────────┘      │  Apply ──────────────▶ Total  │      └─────────┘                 │  │
│  │                    │                               │                                   │  │
│  │                    └──────────────┬────────────────┘                                   │  │
│  │                                   │                                                    │  │
│  │              ┌────────────────────┼────────────────────┐                               │  │
│  │              ▼                    ▼                    ▼                               │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                       │  │
│  │  │   INVOICING     │  │  SUBSCRIPTIONS  │  │   FULFILLMENT   │                       │  │
│  │  │                 │  │                 │  │                 │                       │  │
│  │  │ invoices v2     │  │ stripe subs     │  │ orders          │                       │  │
│  │  │ proposals       │  │ trials          │  │ shipments       │                       │  │
│  │  │ estimates       │  │ usage billing   │  │ returns         │                       │  │
│  │  │ recurring       │  │ pause/resume    │  │ tracking        │                       │  │
│  │  │ credit notes    │  │ churn mgmt      │  │ notifications   │                       │  │
│  │  │ approvals       │  │                 │  │                 │                       │  │
│  │  │ engagement      │  │                 │  │                 │                       │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                       │  │
│  │                                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          DATABASE LAYER (PostgreSQL)                                    │  │
│  │                                                                                        │  │
│  │  CATALOG SCHEMA                 PAYMENTS SCHEMA              INVOICING SCHEMA          │  │
│  │  ┌───────────────────┐         ┌───────────────────┐        ┌───────────────────┐     │  │
│  │  │ products          │         │ stripe_accounts   │        │ invoice_templates │     │  │
│  │  │ product_variants  │         │ payment_products  │        │ invoices_v2       │     │  │
│  │  │ product_categories│         │ payment_prices    │        │ proposals         │     │  │
│  │  │ price_rules       │         │ payment_customers │        │ estimates         │     │  │
│  │  │ discount_codes    │         │ payment_subs      │        │ recurring_invoices│     │  │
│  │  │ tax_categories    │         │ payment_invoices  │        │ credit_notes      │     │  │
│  │  │ tax_rates         │         │ payment_txns      │        │ payment_receipts  │     │  │
│  │  │ inventory_movements│        │ payment_refunds   │        │ platform_fee_cfg  │     │  │
│  │  │ product_collections│        │ payment_disputes  │        │ platform_fee_ldgr │     │  │
│  │  │ collection_products│        │ payment_payouts   │        │ approval_workflows│     │  │
│  │  │                   │         │ payment_tax_rates │        │ approval_requests │     │  │
│  │  │                   │         │ payment_checkout  │        │ approval_decisions│     │  │
│  │  │                   │         │ payment_links     │        │                   │     │  │
│  │  └───────────────────┘         └───────────────────┘        └───────────────────┘     │  │
│  │                                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          EXTERNAL INTEGRATIONS                                         │  │
│  │                                                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │    Stripe    │  │    Email     │  │     CRM      │  │   Shipping   │              │  │
│  │  │   Connect    │  │   Service    │  │   Contacts   │  │   Carriers   │              │  │
│  │  │              │  │              │  │              │  │              │              │  │
│  │  │ • Payments   │  │ • Invoice    │  │ • Customer   │  │ • Rate calc  │              │  │
│  │  │ • Subs       │  │   delivery   │  │   sync       │  │ • Tracking   │              │  │
│  │  │ • Payouts    │  │ • Reminders  │  │ • Contact    │  │ • Labels     │              │  │
│  │  │ • Webhooks   │  │ • Receipts   │  │   lookup     │  │ • Returns    │              │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘              │  │
│  │                                                                                        │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Commerce Flow (Happy Path)

```
                            COMMERCE LIFECYCLE
                            
  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
  │          │    │          │    │          │    │          │    │          │
  │ CATALOG  │───▶│   CART   │───▶│ CHECKOUT │───▶│ PAYMENT  │───▶│  ORDER   │
  │          │    │          │    │          │    │          │    │          │
  │ Browse   │    │ Add/     │    │ Address  │    │ Stripe   │    │ Confirm  │
  │ Search   │    │ Remove   │    │ Shipping │    │ Charge   │    │ Fulfill  │
  │ Filter   │    │ Discount │    │ Tax Calc │    │ Capture  │    │ Ship     │
  │          │    │ Qty      │    │ Review   │    │          │    │ Deliver  │
  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                        │
                                                        ▼
                                                  ┌──────────┐
                                                  │          │
                                                  │ INVOICE  │
                                                  │          │
                                                  │ Generate │
                                                  │ Send     │
                                                  │ Track    │
                                                  │ Collect  │
                                                  └──────────┘
```

---

## Submodules

### 1. Catalog

**Purpose:** Product information management, categorization, media, and Stripe sync.

The catalog submodule is the foundation of the commerce domain. Every product, variant, category, collection, price rule, and discount code lives here. Products support five types (physical, digital, service, subscription, bundle) and four statuses (draft, active, archived, discontinued). Categories use a materialized path tree for efficient ancestor/descendant queries. Products can be organized into manual or rule-based automated collections.

#### Product Types

| Type | Description | Fields Used |
|------|-------------|-------------|
| `physical` | Tangible goods requiring shipping | weight, dimensions, trackInventory |
| `digital` | Downloadable files | digitalFileUrl, downloadLimit, expiryDays |
| `service` | Time-based or project services | basePrice (hourly/flat rate) |
| `subscription` | Recurring billing products | Links to Stripe subscription prices |
| `bundle` | Grouped products | attributes (child product references) |

#### Product Interface

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
```

#### Product Variant Interface

```typescript
interface ProductVariant {
  id: string;
  productId: string;
  ventureId: string;
  name: string;                          // e.g. "Red / Large"
  sku: string | null;                    // Variant-specific SKU
  price: number;                         // Price in cents (overrides base)
  compareAtPrice: number | null;
  attributes: Record<string, string>;    // e.g. { color: 'red', size: 'L' }
  inventoryQuantity: number;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  stripePriceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Category Interface (Materialized Path Tree)

```typescript
interface ProductCategory {
  id: string;
  ventureId: string;
  parentId: string | null;              // Self-referential FK
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  metadata: Record<string, unknown>;
  level: number;                        // Depth in tree (0 = root)
  path: string;                         // Materialized path "root/electronics/phones"
  productCount: number;                 // Denormalized count
  createdAt: Date;
  updatedAt: Date;
}
```

#### Collection Interface

```typescript
interface ProductCollection {
  id: string;
  ventureId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  rules: CollectionAutoRules | null;     // null for manual collections
  type: 'manual' | 'automated';
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CollectionAutoRules {
  conditions: Array<{
    field: 'tag' | 'category' | 'type' | 'price_min' | 'price_max' | 'vendor';
    operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt';
    value: string;
  }>;
  match: 'all' | 'any';                 // AND vs OR for conditions
}
```

---

### 2. Cart

**Purpose:** Session-based shopping cart with discount application and real-time totals.

The cart submodule manages ephemeral shopping sessions. Carts are keyed by session ID (not user ID) to support anonymous browsing, though they can be associated with authenticated users. Cart operations include add, remove, update quantity, apply discount codes, and calculate totals with tax.

#### Cart Operations

```typescript
// Add item to cart
const item = await addToCart(sessionId, {
  productId: 'prod-abc123',
  variantId: 'var-def456',    // Optional: specific variant
  quantity: 2,
});

// Update quantity
await updateCartItem(sessionId, item.id, { quantity: 3 });

// Remove item
await removeFromCart(sessionId, item.id);

// Apply discount code
const result = await applyDiscountToCart(ventureId, 'SAVE20', {
  cartTotal: 9999,
  productIds: ['prod-abc123'],
  categoryIds: ['cat-xyz'],
  customerUsageCount: 0,
});
// result: { valid: true, discountAmount: 2000, finalTotal: 7999, code: 'SAVE20' }

// Get cart with calculated totals
const cart = await getCart(sessionId);
// {
//   items: [{ productId, variantId, quantity, unitPrice, lineTotal }],
//   subtotal: 9999,
//   discountAmount: 2000,
//   taxAmount: 640,
//   total: 8639,
//   itemCount: 3,
//   discountCode: 'SAVE20'
// }
```

---

### 3. Checkout

**Purpose:** Multi-step checkout orchestration via Stripe Checkout Sessions.

Checkout creates a Stripe Checkout Session that handles address collection, payment method selection, and charge creation. Supports three modes: `payment` (one-time), `subscription` (recurring), and `setup` (save payment method for later). Sessions expire after 24 hours by default.

#### Checkout Session Interface

```typescript
interface CheckoutSession {
  id: string;
  ventureId: string;
  stripeSessionId: string | null;
  customerId: string | null;
  mode: 'payment' | 'subscription' | 'setup';
  status: 'open' | 'complete' | 'expired';
  successUrl: string | null;
  cancelUrl: string | null;
  lineItems: CheckoutLineItem[] | null;
  totalAmount: number | null;           // cents
  currency: string;
  expiresAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

interface CheckoutLineItem {
  priceId: string;                      // FK to payment_prices
  quantity: number;
  description?: string;
}
```

#### Checkout Flow

```typescript
// 1. Create checkout session
const session = await createCheckoutSession(ventureId, {
  lineItems: [
    { priceId: 'price-abc', quantity: 2 },
    { priceId: 'price-def', quantity: 1 },
  ],
  mode: 'payment',
  customerId: 'cust-xyz',
  successUrl: 'https://store.example.com/success?session={CHECKOUT_SESSION_ID}',
  cancelUrl: 'https://store.example.com/cart',
});

// 2. Redirect customer to Stripe-hosted checkout
redirect(session.stripeCheckoutUrl);

// 3. Handle success (webhook or redirect)
const completed = await getCheckoutSession(ventureId, session.id);
// completed.status === 'complete'

// Alternative: Create a reusable payment link
const link = await createPaymentLink(ventureId, {
  lineItems: [{ priceId: 'price-abc', quantity: 1 }],
});
// link.url → shareable URL
```

---

### 4. Invoicing

**Purpose:** Advanced invoicing with branded templates, rich lifecycle, credit notes, recurring schedules, and approval workflows.

The invoicing submodule provides enterprise-grade invoice management that goes far beyond Stripe's native invoicing. It supports:
- **Branded templates** with custom HTML headers/footers, logos, and color schemes
- **Full lifecycle tracking**: draft → sent → viewed → partial → paid → overdue → void → write_off
- **Automated reminders** before, on, and after due date
- **Credit notes** for partial refunds and adjustments
- **Recurring invoices** for retainers and scheduled billing (separate from Stripe subscriptions)
- **Approval workflows** with multi-step chains and auto-approve rules
- **Document engagement tracking** with view duration, section heatmaps, and device info

> **Recurring Invoices vs. Subscriptions:**
> - **Subscriptions** (payments.ts) = Stripe-managed auto-charge. Customer is billed automatically. Used for SaaS plans, memberships.
> - **Recurring Invoices** (invoicing.ts) = Internally-scheduled invoice generation. Sends a new invoice on a schedule. Customer pays manually or via payment link. Used for retainers, consulting, rent.

#### Invoice Template Interface

```typescript
interface InvoiceTemplate {
  id: string;
  ventureId: string;
  name: string;
  isDefault: boolean;
  headerHtml: string | null;            // Custom HTML header
  footerHtml: string | null;            // Custom HTML footer
  logoUrl: string | null;               // Company logo
  colors: InvoiceTemplateColors | null;
  defaultPaymentTerms: number;          // Days until due (default: 30)
  defaultNotes: string | null;
  taxConfig: InvoiceTaxConfig | null;
  numberPrefix: string;                 // e.g. "INV" → INV-1001
  nextNumber: number;                   // Auto-increment
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceTemplateColors {
  primary: string;                      // Brand color
  accent: string;                       // Secondary color
  background?: string;
  textColor?: string;
}

interface InvoiceTaxConfig {
  enabled: boolean;
  defaultRate: number;                  // Percentage (e.g. 8.5)
  taxLabel: string;                     // "Sales Tax", "VAT", "GST"
  taxId?: string;                       // Tax registration number
  inclusive: boolean;                    // Tax-inclusive pricing
  compoundTax?: boolean;                // Compound tax calculation
  additionalRates?: Array<{
    label: string;
    rate: number;
    appliesToAll: boolean;
  }>;
}
```

#### Invoice V2 Interface

```typescript
interface InvoiceV2 {
  id: string;
  ventureId: string;
  contactId: string | null;             // FK to CRM contacts
  organizationId: string | null;        // FK to organizations
  templateId: string | null;            // FK to invoice_templates
  recurringInvoiceId: string | null;    // FK if generated from recurring
  number: string;                       // e.g. "INV-1042"
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void' | 'write_off';
  issueDate: Date;
  dueDate: Date | null;
  
  // Line items
  lineItems: InvoiceV2LineItem[];
  
  // Totals (all in cents)
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  
  // Content
  notes: string | null;
  terms: string | null;
  paymentLink: string | null;           // Stripe payment link
  stripeInvoiceId: string | null;       // Linked Stripe invoice
  
  // Lifecycle timestamps
  sentAt: Date | null;
  viewedAt: Date | null;
  paidAt: Date | null;
  
  // Reminders
  reminders: InvoiceReminder[] | null;
  
  // Custom
  customFields: Record<string, string> | null;
  billingAddress: InvoiceAddress | null;
  
  // Audit
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceV2LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;                    // cents
  amount: number;                       // cents (quantity * unitPrice)
  taxRate?: number;                     // percentage
  taxAmount?: number;                   // cents
  discountPercent?: number;
  discountAmount?: number;
  productId?: string;                   // Link to catalog product
  sortOrder: number;
}

interface InvoiceReminder {
  date: string;                         // ISO date
  sent: boolean;
  sentAt?: string;
  type: 'before_due' | 'on_due' | 'after_due';
  dayOffset: number;                    // negative=before, 0=on, positive=after
}

interface InvoiceAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```

#### Invoice Lifecycle

```
                              INVOICE LIFECYCLE

    ┌────────┐     ┌────────┐     ┌────────┐     ┌─────────┐     ┌────────┐
    │ DRAFT  │────▶│  SENT  │────▶│ VIEWED │────▶│ PARTIAL │────▶│  PAID  │
    └────────┘     └────────┘     └────────┘     └─────────┘     └────────┘
         │              │              │                               ▲
         │              │              │                               │
         ▼              ▼              ▼                               │
    ┌────────┐     ┌─────────┐   ┌─────────┐                         │
    │  VOID  │     │ OVERDUE │──▶│WRITE_OFF│                         │
    └────────┘     └─────────┘   └─────────┘                         │
                        │                                             │
                        └─────────────────────────────────────────────┘
                               (payment received)
```

---

### 5. Orders

**Purpose:** Order lifecycle management from confirmation through fulfillment.

Orders are created when a checkout session completes (via Stripe webhook) or when an invoice is paid. They track the fulfillment pipeline: confirmed → processing → shipped → delivered. Orders link to the payment transaction, customer, line items, and shipping information.

#### Order Lifecycle

```
    draft ──▶ confirmed ──▶ processing ──▶ shipped ──▶ delivered
                    │                                      │
                    └──▶ cancelled                         │
                                                           ▼
                              returned ◀── refund_requested
                                 │
                                 ▼
                              refunded
```

---

### 6. Payments

**Purpose:** Stripe Connect payment processing, refunds, disputes, and payouts.

The payments submodule manages the full payment lifecycle via Stripe Connect. Each venture has its own Stripe connected account (standard, express, or custom). Platform fees are collected automatically on each transaction via Stripe's application fee mechanism.

#### Stripe Account Interface

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

#### Payment Transaction Interface

```typescript
interface Payment {
  id: string;
  ventureId: string;
  customerId: string;                   // FK to payment_customers
  invoiceId: string | null;             // FK to payment_invoices
  stripePaymentIntentId: string | null; // Stripe pi_xxx
  stripeChargeId: string | null;        // Stripe ch_xxx
  amount: number;                       // cents
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethod: 'card' | 'bank_transfer' | 'ach' | null;
  cardBrand: string | null;             // 'visa', 'mastercard', etc.
  cardLast4: string | null;             // Last 4 digits
  receiptUrl: string | null;            // Stripe receipt URL
  applicationFeeAmount: number | null;  // Platform fee collected (cents)
  refundedAmount: number;               // Total refunded (cents)
  metadata: Record<string, unknown>;
  createdAt: Date;
}
```

#### Payment Customer Interface

```typescript
interface PaymentCustomer {
  id: string;
  ventureId: string;
  contactId: string | null;             // FK to CRM contacts
  stripeCustomerId: string | null;      // Stripe cus_xxx
  email: string | null;
  name: string | null;
  defaultPaymentMethod: string | null;  // Stripe pm_xxx
  currency: string;
  balance: number;                      // Account balance (cents)
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Refund Interface

```typescript
interface Refund {
  id: string;
  ventureId: string;
  paymentId: string;                    // FK to payment_transactions
  stripeRefundId: string | null;        // Stripe re_xxx
  amount: number;                       // cents
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other' | null;
  notes: string | null;
  createdAt: Date;
}
```

#### Dispute Interface

```typescript
interface Dispute {
  id: string;
  ventureId: string;
  paymentId: string;
  stripeDisputeId: string | null;
  amount: number;                       // cents
  currency: string;
  status: 'warning_needs_response' | 'warning_under_review' | 'needs_response' 
        | 'under_review' | 'charge_refunded' | 'won' | 'lost';
  reason: string | null;
  evidenceDueBy: Date | null;
  evidence: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Payout Interface

```typescript
interface Payout {
  id: string;
  ventureId: string;
  stripePayoutId: string | null;
  amount: number;                       // cents
  currency: string;
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';
  arrivalDate: Date | null;
  method: 'standard' | 'instant';
  description: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  createdAt: Date;
}
```

---

### 7. POS (Point of Sale)

**Purpose:** In-person payment processing via Stripe Terminal.

POS extends the checkout flow for physical retail. It manages Stripe Terminal reader registration, creates in-person payment intents, and handles receipt generation. POS transactions flow through the same payment pipeline as online orders, ensuring unified reporting.

#### POS Flow

```
  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ Register │───▶│ Cart/    │───▶│  Tap/    │───▶│ Receipt  │
  │ Reader   │    │ Line     │    │  Swipe   │    │ Print/   │
  │          │    │ Items    │    │  Insert  │    │ Email    │
  └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

### 8. Shipping

**Purpose:** Shipping rate calculation, label generation, and tracking.

The shipping submodule interfaces with carrier APIs (via @mcv/connectors) to calculate rates, generate shipping labels, and track deliveries. It supports multi-carrier comparison, dimensional weight calculation, and automatic tracking notifications.

#### Shipping Rate Calculation

```typescript
// Get shipping rates for a cart
const rates = await calculateShippingRates({
  origin: { country: 'US', state: 'CA', postalCode: '94105' },
  destination: { country: 'US', state: 'NY', postalCode: '10001' },
  packages: [
    {
      weight: 2.5,       // kg
      dimensions: { length: 30, width: 20, height: 10, unit: 'cm' },
    },
  ],
});
// rates: [
//   { carrier: 'usps', service: 'Priority', rate: 899, estimatedDays: 2-3 },
//   { carrier: 'ups', service: 'Ground', rate: 1299, estimatedDays: 5-7 },
//   { carrier: 'fedex', service: 'Express', rate: 2499, estimatedDays: 1-2 },
// ]
```

---

### 9. Subscriptions

**Purpose:** Recurring billing lifecycle via Stripe Billing.

Subscriptions manage the entire recurring revenue lifecycle. They support trial periods, quantity-based billing, pause/resume, coupon application, proration, and automated invoice generation. All subscription operations are synced bidirectionally with Stripe.

#### Subscription Interface

```typescript
interface Subscription {
  id: string;
  ventureId: string;
  customerId: string;                   // FK to payment_customers
  stripeSubscriptionId: string | null;  // Stripe sub_xxx
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'paused';
  priceId: string | null;              // FK to payment_prices
  quantity: number;
  
  // Billing period
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  
  // Cancellation
  cancelAt: Date | null;               // Scheduled cancellation
  canceledAt: Date | null;             // Actual cancellation
  
  // Trial
  trialStart: Date | null;
  trialEnd: Date | null;
  
  // Platform fee
  applicationFeePercent: string | null;
  
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Subscription Lifecycle

```
                        SUBSCRIPTION LIFECYCLE

    ┌──────────┐     ┌──────────┐     ┌──────────┐
    │ TRIALING │────▶│  ACTIVE  │────▶│ CANCELED │
    └──────────┘     └──────────┘     └──────────┘
                          │  ▲              ▲
                          │  │              │
                          ▼  │              │
                     ┌──────────┐           │
                     │ PAST_DUE │───────────┘
                     └──────────┘     (after retry exhaustion)
                          │
                          ▼
                     ┌──────────┐
                     │  UNPAID  │
                     └──────────┘

                     ┌──────────┐
                     │  PAUSED  │◀──── (admin action)
                     └──────────┘────▶ ACTIVE (resume)
```

#### Subscription Management

```typescript
// Create subscription with trial
const sub = await createSubscription(ventureId, {
  customerId: 'cust-abc',
  priceId: 'price-monthly-pro',
  quantity: 1,
  trialDays: 14,
  applicationFeePercent: 2.5,
});

// Upgrade plan
await updateSubscription(ventureId, sub.id, {
  priceId: 'price-monthly-enterprise',
  quantity: 5,
});

// Cancel at period end
await cancelSubscription(ventureId, sub.id, {
  immediately: false,
  cancelAtPeriodEnd: true,
});

// Pause billing (e.g., customer on vacation)
await pauseSubscription(ventureId, sub.id);

// Resume
await resumeSubscription(ventureId, sub.id);

// Preview upcoming invoice
const preview = await getUpcomingInvoice(ventureId, sub.id);
// { subtotal: 9900, tax: 792, total: 10692, nextPaymentDate: '2026-03-08' }
```

---

### 10. Tax

**Purpose:** Multi-jurisdiction tax calculation with compound rates and inclusive pricing.

The tax submodule supports two parallel tax systems:

1. **Catalog Tax** (catalog.ts): Tax categories and rates at the product level with country/state/postal code precision. Used for e-commerce tax calculation during checkout.
2. **Payment Tax** (payments.ts): Stripe Tax rates synced for subscription and invoice tax. Supports inclusive vs exclusive and jurisdiction tracking.

#### Tax Category Interface

```typescript
interface TaxCategory {
  id: string;
  ventureId: string;
  name: string;                         // e.g. "Physical Goods", "Digital Services"
  description: string | null;
  defaultRate: string;                  // Percentage (e.g. "8.50")
  isDefault: boolean;                   // Default category for new products
  createdAt: Date;
}
```

#### Tax Rate Interface

```typescript
interface CatalogTaxRate {
  id: string;
  ventureId: string;
  taxCategoryId: string;
  country: string;                      // "US", "CA", "GB", etc.
  state: string | null;                 // "CA", "NY", "ON", etc.
  postalCode: string | null;            // Postal-level precision
  rate: string;                         // Percentage (e.g. "8.875")
  name: string;                         // Display name
  isCompound: boolean;                  // Compound tax (tax on tax)
  priority: number;                     // Evaluation order
  isActive: boolean;
  createdAt: Date;
}
```

#### Tax Calculation

```typescript
// Create tax category
const category = await createTaxCategory(ventureId, {
  name: 'Physical Goods',
  defaultRate: 8.5,
  isDefault: true,
});

// Add jurisdiction-specific rates
await createTaxRate(ventureId, {
  taxCategoryId: category.id,
  country: 'US',
  state: 'CA',
  rate: 7.25,
  name: 'California State Tax',
});

await createTaxRate(ventureId, {
  taxCategoryId: category.id,
  country: 'US',
  state: 'CA',
  postalCode: '94105',
  rate: 1.25,
  name: 'San Francisco District Tax',
  isCompound: false,
  priority: 1,
});

// During checkout, tax rates are resolved by location:
// Customer in SF, CA → 7.25% + 1.25% = 8.50%
// Customer in LA, CA → 7.25% (no postal override)
// Customer in TX → falls back to category defaultRate
```

#### Stripe Tax Rate Interface

```typescript
interface PaymentTaxRate {
  id: string;
  ventureId: string;
  stripeTaxRateId: string | null;       // Stripe txr_xxx
  displayName: string;                  // "Sales Tax", "VAT 20%"
  description: string | null;
  percentage: string;                   // Percentage (e.g. "20.00")
  inclusive: boolean;                   // Tax-inclusive pricing
  jurisdiction: string | null;          // "US-CA", "GB", etc.
  active: boolean;
  createdAt: Date;
}
```

---

### 11. Wholesale

**Purpose:** B2B pricing, volume discounts, and customer group management.

Wholesale leverages the price rules system to offer tiered and volume-based pricing for B2B customers. Customer groups get automatic price adjustments, minimum order quantities, and net payment terms.

#### Price Rule Interface

```typescript
interface PriceRule {
  id: string;
  ventureId: string;
  productId: string;
  name: string;                         // e.g. "Wholesale 100+ units"
  type: 'volume' | 'tiered' | 'customer_group' | 'time_limited';
  config: PriceRuleConfig;
  priority: number;                     // Higher = evaluated first
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
}

interface PriceRuleConfig {
  minQuantity?: number;
  maxQuantity?: number;
  price?: number;                       // Fixed price in cents
  discountPercent?: number;             // Percentage discount
  customerGroupId?: string;             // Applies to specific group
  tiers?: Array<{
    minQty: number;
    maxQty: number;
    price: number;                      // Price per unit in cents
  }>;
}
```

#### Wholesale Pricing Example

```typescript
// Create volume discount rule
await createPriceRule(ventureId, {
  productId: 'prod-widget',
  name: 'Volume Discount - Widgets',
  type: 'tiered',
  config: {
    tiers: [
      { minQty: 1, maxQty: 9, price: 999 },     // $9.99 each (1-9 units)
      { minQty: 10, maxQty: 49, price: 899 },    // $8.99 each (10-49 units)
      { minQty: 50, maxQty: 199, price: 749 },   // $7.49 each (50-199 units)
      { minQty: 200, maxQty: 99999, price: 599 }, // $5.99 each (200+ units)
    ],
  },
  isActive: true,
});

// Create customer group pricing
await createPriceRule(ventureId, {
  productId: 'prod-widget',
  name: 'Gold Partner Pricing',
  type: 'customer_group',
  config: {
    customerGroupId: 'group-gold',
    discountPercent: 15,                // 15% off base price
  },
  priority: 10,                         // Evaluated before volume rules
  isActive: true,
});

// Calculate effective price for specific context
const price = await calculateEffectivePrice(ventureId, 'prod-widget', {
  quantity: 75,
  customerGroupId: 'group-gold',
});
// price: { basePrice: 999, effectivePrice: 637, appliedRule: 'Gold Partner + Volume Tier 3' }
```

---

## Additional Submodule: Proposals

**Purpose:** Rich proposal documents with content blocks, e-signatures, and invoice conversion.

Proposals are sophisticated sales documents that combine rich content (headings, paragraphs, images, tables, testimonials, videos) with pricing. They support e-signature capture, view tracking, and one-click conversion to invoices.

#### Proposal Interface

```typescript
interface Proposal {
  id: string;
  ventureId: string;
  contactId: string | null;
  organizationId: string | null;
  title: string;
  proposalNumber: string | null;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  
  // Rich content blocks
  content: ProposalContentBlock[];
  
  // Pricing
  lineItems: InvoiceV2LineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  
  // Validity
  validUntil: Date | null;
  
  // E-Signature
  acceptedAt: Date | null;
  declinedAt: Date | null;
  declineReason: string | null;
  signatureUrl: string | null;          // Captured signature image
  signatureIp: string | null;           // IP at time of signing
  
  // Lifecycle
  sentAt: Date | null;
  viewedAt: Date | null;
  coverImageUrl: string | null;
  customFields: Record<string, string> | null;
  convertedInvoiceId: string | null;    // FK after conversion
  
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProposalContentBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'table' | 'divider' 
      | 'pricing' | 'terms' | 'signature' | 'video' | 'testimonial';
  content: string;                      // HTML or markdown
  metadata?: Record<string, unknown>;
  sortOrder: number;
}
```

---

## Additional Submodule: Estimates / Quotes

**Purpose:** Versioned estimates with progress invoicing and milestone tracking.

Estimates differ from proposals in that they are simpler pricing documents (no rich content blocks) but support **version history** and **progress invoicing** — the ability to invoice a percentage of the estimate at each project milestone.

#### Estimate Interface

```typescript
interface Estimate {
  id: string;
  ventureId: string;
  contactId: string | null;
  organizationId: string | null;
  templateId: string | null;
  estimateNumber: string;
  title: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'converted';
  
  // Line items and totals
  lineItems: InvoiceV2LineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  validUntil: Date | null;
  
  // Content
  notes: string | null;
  terms: string | null;
  customFields: Record<string, string> | null;
  
  // Version history
  versions: EstimateVersionEntry[];
  currentVersion: number;
  
  // Conversion
  convertedInvoiceId: string | null;
  convertedAt: Date | null;
  progressInvoicing: ProgressInvoicing | null;
  
  // E-Signature
  signatureUrl: string | null;
  signatureIp: string | null;
  
  // Lifecycle
  sentAt: Date | null;
  viewedAt: Date | null;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  declineReason: string | null;
  
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EstimateVersionEntry {
  version: number;
  lineItems: InvoiceV2LineItem[];
  total: number;
  createdAt: string;
  note?: string;
}

interface ProgressInvoicing {
  milestones: Array<{
    name: string;                       // "Design Phase", "Development", etc.
    percent: number;                    // 25, 50, etc.
    invoiceId?: string;                 // FK to invoice created
    invoicedAt?: string;                // When milestone was invoiced
  }>;
}
```

#### Progress Invoicing Example

```typescript
// Create estimate
const estimate = await createEstimate(ventureId, {
  contactId: 'contact-abc',
  title: 'Website Redesign Project',
  lineItems: [
    { id: '1', description: 'UX Design', quantity: 1, unitPrice: 500000, amount: 500000, sortOrder: 0 },
    { id: '2', description: 'Frontend Dev', quantity: 1, unitPrice: 800000, amount: 800000, sortOrder: 1 },
    { id: '3', description: 'Backend Dev', quantity: 1, unitPrice: 700000, amount: 700000, sortOrder: 2 },
  ],
  validUntil: new Date('2026-03-31'),
});
// estimate.total = 2,000,000 ($20,000)

// After client accepts, invoice by milestone
const invoice1 = await convertEstimateToInvoice(ventureId, estimate.id, {
  milestonePercent: 30,
  milestoneName: 'Design Phase Complete',
});
// Creates invoice for $6,000 (30% of $20,000)

const invoice2 = await convertEstimateToInvoice(ventureId, estimate.id, {
  milestonePercent: 40,
  milestoneName: 'Development Complete',
});
// Creates invoice for $8,000 (40% of $20,000)

// Remaining 30% ($6,000) available for final milestone
```

---

## Additional Submodule: Recurring Invoices

**Purpose:** Scheduled invoice generation for retainers and recurring services.

#### Recurring Invoice Interface

```typescript
interface RecurringInvoice {
  id: string;
  ventureId: string;
  contactId: string | null;
  organizationId: string | null;
  templateId: string | null;
  name: string;                         // "Monthly SEO Retainer"
  templateConfig: RecurringTemplateConfig;
  interval: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'yearly';
  dayOfMonth: number;                   // 1-28 (avoids month-length issues)
  dayOfWeek: number | null;             // 0=Sunday (for weekly)
  startDate: Date;
  endDate: Date | null;                 // null = indefinite
  nextDate: Date;                       // When the next invoice generates
  lastGeneratedAt: Date | null;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  autoSend: boolean;                    // Auto-send on generation
  totalGenerated: number;               // Count of invoices generated
  totalRevenue: number;                 // Sum of all generated invoices (cents)
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RecurringTemplateConfig {
  lineItems: InvoiceV2LineItem[];       // Template line items
  notes?: string;
  terms?: string;
  currency: string;
  paymentTermsDays: number;             // Due date offset
  taxConfig?: InvoiceTaxConfig;
}
```

---

## Additional Submodule: Platform Fees (Stripe Connect Ecosystem)

**Purpose:** Super admin management of per-venture platform fees.

#### Platform Fee Config Interface

```typescript
interface PlatformFeeConfig {
  id: string;
  ventureId: string;                    // One config per venture
  feeType: 'percentage' | 'flat' | 'tiered';
  feePercent: string;                   // e.g. "2.50"
  flatFeeCents: number;                 // Flat fee per transaction
  tieredConfig: TieredFeeConfig | null;
  invoiceFeePercent: string;            // Fee on invoice payments
  proposalConversionFee: number;        // Flat fee per converted proposal (cents)
  cappedAt: number | null;              // Max fee per transaction (null = uncapped)
  minimumFee: number;                   // Minimum fee per transaction (cents)
  isActive: boolean;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  notes: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TieredFeeConfig {
  tiers: Array<{
    upTo: number;                       // Volume threshold in cents
    feePercent: number;
  }>;
  resetPeriod: 'monthly' | 'quarterly' | 'yearly';
}
```

#### Platform Fee Ledger Interface

```typescript
interface PlatformFeeLedgerEntry {
  id: string;
  ventureId: string;
  invoiceId: string | null;
  feeConfigId: string | null;
  transactionAmount: number;            // Transaction total (cents)
  feeAmount: number;                    // Fee collected (cents)
  feePercent: string | null;
  description: string | null;
  stripeTransferId: string | null;
  period: string | null;                // e.g. '2026-01'
  createdAt: Date;
}
```

---

## Additional Submodule: Approval Workflows

**Purpose:** Multi-step approval chains for invoices, proposals, estimates, credit notes, and discounts.

#### Approval Workflow Interface

```typescript
interface ApprovalWorkflow {
  id: string;
  ventureId: string;
  name: string;                         // "High-Value Invoice Approval"
  entityType: 'invoice' | 'proposal' | 'estimate' | 'credit_note' | 'discount';
  isActive: boolean;
  rules: ApprovalRuleConfig[];
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ApprovalRuleConfig {
  step: number;                         // Sequential step number
  approverRoleId?: string;              // Role-based approval
  approverUserId?: string;              // Specific user approval
  condition?: {                         // Conditional logic
    field: string;                      // 'total', 'discount_percent', etc.
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
  };
  autoApproveBelow?: number;            // Skip step if total below this (cents)
}

interface ApprovalRequest {
  id: string;
  ventureId: string;
  workflowId: string;
  entityType: 'invoice' | 'proposal' | 'estimate' | 'credit_note' | 'discount';
  entityId: string;
  currentStep: number;
  totalSteps: number;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  requestedBy: string | null;
  requestedAt: Date;
  completedAt: Date | null;
  completedBy: string | null;
  notes: string | null;
  createdAt: Date;
}

interface ApprovalDecision {
  id: string;
  approvalRequestId: string;
  step: number;
  decidedBy: string | null;
  decision: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  reason: string | null;
  decidedAt: Date;
  createdAt: Date;
}
```

---

## Database Schemas

### Catalog Schema (`catalog.ts`)

**11 tables, 10 enums, 9 JSONB types**

#### Enums

```sql
-- Product classification
CREATE TYPE product_type AS ENUM ('physical', 'digital', 'service', 'subscription', 'bundle');
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived', 'discontinued');

-- Pricing
CREATE TYPE price_rule_type AS ENUM ('volume', 'tiered', 'customer_group', 'time_limited');
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed', 'free_shipping', 'buy_x_get_y');

-- Inventory
CREATE TYPE inventory_movement_type AS ENUM ('purchase', 'sale', 'adjustment', 'return', 'transfer');

-- Collections
CREATE TYPE collection_type AS ENUM ('manual', 'automated');
```

#### Tables

| Table | Columns | Indexes | Description |
|-------|---------|---------|-------------|
| `product_categories` | 13 | 5 | Tree hierarchy with materialized path |
| `products` | 33 | 9 | Full product records with pricing/media/SEO |
| `product_variants` | 13 | 4 | Size/color/etc. variants with independent pricing |
| `price_rules` | 10 | 4 | Volume, tiered, group, time-limited pricing |
| `discount_codes` | 16 | 4 | Discount codes with usage limits and applicability |
| `tax_categories` | 6 | 2 | Tax groups (Physical Goods, Digital Services, etc.) |
| `tax_rates` | 10 | 4 | Country/state/postal tax rates |
| `inventory_movements` | 10 | 5 | Stock change audit trail |
| `product_collections` | 10 | 4 | Manual and automated product groups |
| `collection_products` | 4 | 3 | Junction table: collection ↔ product |

#### Key Indexes

```sql
-- Product search and filter
CREATE INDEX product_venture_idx ON products (venture_id);
CREATE INDEX product_category_idx ON products (category_id);
CREATE INDEX product_sku_idx ON products (venture_id, sku);
CREATE INDEX product_slug_idx ON products (venture_id, slug);
CREATE INDEX product_status_idx ON products (venture_id, status);
CREATE INDEX product_type_idx ON products (venture_id, type);
CREATE INDEX product_created_idx ON products (created_at);
CREATE INDEX product_featured_idx ON products (venture_id, is_featured);
CREATE INDEX product_public_idx ON products (venture_id, is_public);

-- Category tree traversal
CREATE INDEX product_category_path_idx ON product_categories (venture_id, path);
CREATE INDEX product_category_parent_idx ON product_categories (parent_id);

-- Tax resolution by location
CREATE INDEX tax_rate_location_idx ON tax_rates (country, state, postal_code);

-- Inventory audit
CREATE INDEX inventory_movement_product_idx ON inventory_movements (product_id);
CREATE INDEX inventory_movement_created_idx ON inventory_movements (created_at);
```

### Payments Schema (`payments.ts`)

**13 tables, 14 enums**

#### Enums

```sql
-- Stripe Connect
CREATE TYPE stripe_account_type AS ENUM ('standard', 'express', 'custom');
CREATE TYPE stripe_account_status AS ENUM ('pending', 'active', 'restricted', 'disabled');

-- Products & Prices
CREATE TYPE payment_product_type AS ENUM ('one_time', 'recurring', 'metered');
CREATE TYPE payment_price_type AS ENUM ('one_time', 'recurring');
CREATE TYPE payment_price_interval AS ENUM ('day', 'week', 'month', 'year');

-- Subscriptions
CREATE TYPE payment_subscription_status AS ENUM 
  ('active', 'past_due', 'canceled', 'unpaid', 'trialing', 'paused');

-- Invoices
CREATE TYPE payment_invoice_status AS ENUM ('draft', 'open', 'paid', 'void', 'uncollectible');

-- Payments
CREATE TYPE payment_status AS ENUM 
  ('succeeded', 'pending', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_method_type AS ENUM ('card', 'bank_transfer', 'ach');

-- Refunds
CREATE TYPE payment_refund_status AS ENUM ('pending', 'succeeded', 'failed', 'canceled');
CREATE TYPE payment_refund_reason AS ENUM 
  ('duplicate', 'fraudulent', 'requested_by_customer', 'other');

-- Disputes
CREATE TYPE payment_dispute_status AS ENUM 
  ('warning_needs_response', 'warning_under_review', 'needs_response',
   'under_review', 'charge_refunded', 'won', 'lost');

-- Payouts
CREATE TYPE payment_payout_status AS ENUM ('paid', 'pending', 'in_transit', 'canceled', 'failed');
CREATE TYPE payment_payout_method AS ENUM ('standard', 'instant');

-- Checkout
CREATE TYPE payment_checkout_mode AS ENUM ('payment', 'subscription', 'setup');
CREATE TYPE payment_checkout_session_status AS ENUM ('open', 'complete', 'expired');
```

#### Tables

| Table | Columns | Indexes | Description |
|-------|---------|---------|-------------|
| `stripe_accounts` | 15 | 3 | Connected Stripe accounts per venture |
| `payment_products` | 9 | 3 | Stripe products (one_time, recurring, metered) |
| `payment_prices` | 12 | 4 | Stripe prices with interval/trial config |
| `payment_customers` | 10 | 4 | Customer records mapped to CRM contacts |
| `payment_subscriptions` | 16 | 5 | Active subscriptions with billing periods |
| `payment_invoices` | 17 | 6 | Stripe-native invoices |
| `payment_transactions` | 15 | 6 | Payment records with card/method details |
| `payment_refunds` | 9 | 3 | Refund records with reason tracking |
| `payment_disputes` | 10 | 4 | Dispute records with evidence deadlines |
| `payment_payouts` | 11 | 3 | Payout records to venture bank accounts |
| `payment_tax_rates` | 8 | 2 | Stripe tax rate objects |
| `payment_checkout_sessions` | 12 | 4 | Stripe checkout session records |
| `payment_links` | 7 | 2 | Reusable payment links |

#### Key Indexes

```sql
-- Stripe ID lookups (critical for webhook processing)
CREATE UNIQUE INDEX stripe_account_stripe_id ON stripe_accounts (stripe_account_id);
CREATE UNIQUE INDEX payment_product_stripe_idx ON payment_products (stripe_product_id);
CREATE UNIQUE INDEX payment_price_stripe_idx ON payment_prices (stripe_price_id);
CREATE UNIQUE INDEX payment_customer_stripe_idx ON payment_customers (stripe_customer_id);
CREATE UNIQUE INDEX payment_subscription_stripe_idx ON payment_subscriptions (stripe_subscription_id);
CREATE UNIQUE INDEX payment_invoice_stripe_idx ON payment_invoices (stripe_invoice_id);
CREATE UNIQUE INDEX payment_tx_stripe_pi_idx ON payment_transactions (stripe_payment_intent_id);
CREATE UNIQUE INDEX payment_refund_stripe_idx ON payment_refunds (stripe_refund_id);
CREATE UNIQUE INDEX payment_dispute_stripe_idx ON payment_disputes (stripe_dispute_id);
CREATE UNIQUE INDEX payment_payout_stripe_idx ON payment_payouts (stripe_payout_id);

-- Revenue queries
CREATE INDEX payment_tx_status_idx ON payment_transactions (venture_id, status);
CREATE INDEX payment_tx_created_idx ON payment_transactions (created_at);
CREATE INDEX payment_subscription_status_idx ON payment_subscriptions (venture_id, status);
CREATE INDEX payment_subscription_period_idx ON payment_subscriptions (current_period_end);
```

### Invoicing Schema (`invoicing.ts`)

**12 tables, 7 enums, 12 JSONB types**

#### Enums

```sql
-- Invoice lifecycle
CREATE TYPE invoice_v2_status AS ENUM 
  ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void', 'write_off');

-- Proposal lifecycle
CREATE TYPE proposal_status AS ENUM 
  ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired');

-- Estimate lifecycle
CREATE TYPE estimate_status AS ENUM 
  ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'converted');

-- Recurring
CREATE TYPE recurring_invoice_interval AS ENUM 
  ('weekly', 'biweekly', 'monthly', 'quarterly', 'semiannually', 'yearly');
CREATE TYPE recurring_invoice_status AS ENUM ('active', 'paused', 'cancelled', 'completed');

-- Credit notes
CREATE TYPE credit_note_status AS ENUM ('draft', 'issued', 'applied', 'void');

-- Platform fees
CREATE TYPE platform_fee_type AS ENUM ('percentage', 'flat', 'tiered');

-- Approvals
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'changes_requested');
CREATE TYPE approval_entity_type AS ENUM 
  ('invoice', 'proposal', 'estimate', 'credit_note', 'discount');
```

#### Tables

| Table | Columns | Indexes | Description |
|-------|---------|---------|-------------|
| `invoice_templates` | 12 | 2 | Branded templates with colors/logo/tax |
| `invoices_v2` | 24 | 9 | Advanced invoices with full lifecycle |
| `proposals` | 24 | 6 | Rich proposals with content blocks & e-sig |
| `estimates` | 25 | 6 | Versioned estimates with progress invoicing |
| `recurring_invoices` | 17 | 4 | Scheduled invoice generation |
| `credit_notes` | 9 | 3 | Credit adjustments against invoices |
| `payment_receipts` | 9 | 3 | Payment receipt records |
| `platform_fee_configs` | 15 | 2 | Per-venture fee configuration |
| `platform_fee_ledger` | 9 | 4 | Fee collection audit trail |
| `approval_workflows` | 7 | 2 | Multi-step approval chain definitions |
| `approval_requests` | 12 | 4 | Active approval requests |
| `approval_decisions` | 7 | 2 | Individual approval/rejection decisions |

#### Key Indexes

```sql
-- Invoice lookup and filtering
CREATE INDEX invoice_v2_venture_idx ON invoices_v2 (venture_id);
CREATE INDEX invoice_v2_status_idx ON invoices_v2 (venture_id, status);
CREATE INDEX invoice_v2_number_idx ON invoices_v2 (venture_id, number);
CREATE INDEX invoice_v2_due_date_idx ON invoices_v2 (due_date);
CREATE INDEX invoice_v2_contact_idx ON invoices_v2 (contact_id);
CREATE INDEX invoice_v2_recurring_idx ON invoices_v2 (recurring_invoice_id);

-- Proposal and estimate tracking
CREATE INDEX proposal_status_idx ON proposals (venture_id, status);
CREATE INDEX proposal_valid_until_idx ON proposals (valid_until);
CREATE INDEX estimate_status_idx ON estimates (venture_id, status);
CREATE INDEX estimate_valid_until_idx ON estimates (valid_until);

-- Recurring invoice scheduling
CREATE INDEX recurring_invoice_next_date_idx ON recurring_invoices (next_date);
CREATE INDEX recurring_invoice_status_idx ON recurring_invoices (venture_id, status);

-- Platform fee reporting
CREATE INDEX platform_fee_ledger_period_idx ON platform_fee_ledger (venture_id, period);

-- Approval routing
CREATE INDEX approval_request_entity_idx ON approval_requests (entity_type, entity_id);
CREATE INDEX approval_request_status_idx ON approval_requests (venture_id, status);
```

---

## Code Examples

### Example 1: Full Product Creation with Variants and Stripe Sync

```typescript
import { createProduct, syncProductToStripe } from '@mcv/commerce';

// Create the product
const product = await createProduct(ventureId, {
  name: 'Premium Wireless Headphones',
  slug: 'premium-wireless-headphones',
  sku: 'HDPHN-WRL-001',
  description: 'Noise-cancelling wireless headphones with 30-hour battery life.',
  shortDescription: 'Premium ANC headphones',
  type: 'physical',
  status: 'active',
  basePrice: 29999,                     // $299.99
  compareAtPrice: 39999,                // $399.99 (was price)
  costPrice: 12000,                     // $120.00 (margin tracking)
  currency: 'usd',
  taxable: true,
  images: [
    { url: 'https://cdn.example.com/headphones-black.jpg', alt: 'Black', sortOrder: 0, isPrimary: true },
    { url: 'https://cdn.example.com/headphones-white.jpg', alt: 'White', sortOrder: 1, isPrimary: false },
  ],
  variants: {
    color: ['Midnight Black', 'Pearl White', 'Navy Blue'],
  },
  tags: ['electronics', 'audio', 'wireless', 'noise-cancelling'],
  metaTitle: 'Premium Wireless Headphones | Best ANC 2026',
  metaDescription: 'Experience crystal-clear audio with our premium wireless headphones featuring ANC.',
  trackInventory: true,
  inventoryQuantity: 500,
  lowStockThreshold: 25,
  weight: '0.350',
  weightUnit: 'kg',
  dimensions: { length: 20, width: 18, height: 8, unit: 'cm' },
  isPublic: true,
  isFeatured: true,
}, userId);

// Sync to Stripe for payment processing
await syncProductToStripe(ventureId, product.id);
```

### Example 2: Category Tree Operations

```typescript
import { createCategory, getCategoryTree, getCategoryAncestors } from '@mcv/commerce';

// Create hierarchy: Electronics → Audio → Headphones
const electronics = await createCategory(ventureId, {
  name: 'Electronics',
  slug: 'electronics',
  isActive: true,
});

const audio = await createCategory(ventureId, {
  name: 'Audio',
  slug: 'audio',
  parentId: electronics.id,
});

const headphones = await createCategory(ventureId, {
  name: 'Headphones',
  slug: 'headphones',
  parentId: audio.id,
});
// headphones.path = "electronics/audio/headphones"
// headphones.level = 2

// Get full tree
const tree = await getCategoryTree(ventureId);
// [{ id: electronics.id, name: 'Electronics', children: [
//   { id: audio.id, name: 'Audio', children: [
//     { id: headphones.id, name: 'Headphones', children: [] }
//   ]}
// ]}]

// Get breadcrumb
const ancestors = await getCategoryAncestors(ventureId, headphones.id);
// [electronics, audio, headphones]
```

### Example 3: Discount Code with Validation

```typescript
import { createDiscount, validateDiscountCode } from '@mcv/commerce';

// Create a discount code
const discount = await createDiscount(ventureId, {
  code: 'SPRING25',
  name: 'Spring Sale 25% Off',
  type: 'percentage',
  value: 25,
  minimumAmount: 5000,                  // Minimum $50 cart
  maximumDiscount: 10000,               // Max $100 discount
  usageLimit: 500,                      // 500 total uses
  perCustomerLimit: 1,                  // 1 per customer
  applicableTo: {
    type: 'categories',
    ids: ['cat-electronics', 'cat-audio'],
  },
  startDate: new Date('2026-03-01'),
  endDate: new Date('2026-03-31'),
  isActive: true,
}, userId);

// Validate before applying
const validation = await validateDiscountCode(ventureId, 'SPRING25', {
  cartTotal: 15000,                     // $150 cart
  categoryIds: ['cat-electronics'],
  customerUsageCount: 0,
});
// validation: {
//   valid: true,
//   discount: { code: 'SPRING25', type: 'percentage', value: 25 },
//   discountAmount: 3750,              // $37.50 (25% of $150)
//   message: 'Discount applied'
// }
```

### Example 4: Inventory Management with Audit Trail

```typescript
import { recordInventoryMovement, getStockReport, getLowStockAlerts } from '@mcv/commerce';

// Record purchase receipt
await recordInventoryMovement(ventureId, {
  productId: 'prod-headphones',
  variantId: 'var-black',
  type: 'purchase',
  quantity: 200,                        // +200 units
  reference: 'PO-2026-0042',
  notes: 'Q1 restock from supplier ABC',
}, userId);

// Record sale
await recordInventoryMovement(ventureId, {
  productId: 'prod-headphones',
  variantId: 'var-black',
  type: 'sale',
  quantity: -1,                         // -1 unit
  reference: 'ORD-2026-1234',
}, userId);

// Record adjustment (shrinkage)
await recordInventoryMovement(ventureId, {
  productId: 'prod-headphones',
  type: 'adjustment',
  quantity: -3,
  notes: 'Annual inventory count - 3 units unaccounted for',
}, userId);

// Get current stock snapshot
const report = await getStockReport(ventureId);
// [{ productId, name, sku, totalQuantity, variantBreakdown: [...] }]

// Get low stock alerts
const alerts = await getLowStockAlerts(ventureId);
// [{ productId, name, currentQuantity: 4, threshold: 25, variantId }]
```

### Example 5: Stripe Connect Onboarding

```typescript
import { createConnectedAccount, generateOnboardingLink, getAccount } from '@mcv/commerce';

// Create Express connected account
const account = await createConnectedAccount(ventureId, {
  type: 'express',
  email: 'owner@mybusiness.com',
  country: 'US',
  businessProfile: {
    name: 'My Awesome Store',
    url: 'https://myawesomestore.com',
    supportEmail: 'support@myawesomestore.com',
  },
});
// account.stripeAccountId = 'acct_xxxxxxxxxxxxx'
// account.status = 'pending'

// Generate onboarding link
const onboarding = await generateOnboardingLink(ventureId, {
  refreshUrl: 'https://admin.mcv.app/settings/payments?refresh=true',
  returnUrl: 'https://admin.mcv.app/settings/payments?onboarded=true',
});
// onboarding.url → redirect user to Stripe-hosted onboarding

// After onboarding completes (webhook updates status)
const active = await getAccount(ventureId);
// active.chargesEnabled = true
// active.payoutsEnabled = true
// active.status = 'active'
```

### Example 6: Subscription with Trial and Upgrade

```typescript
import { createSubscription, updateSubscription, getUpcomingInvoice } from '@mcv/commerce';

// Create subscription with 14-day trial
const sub = await createSubscription(ventureId, {
  customerId: 'cust-jane',
  priceId: 'price-starter-monthly',     // $29/month
  quantity: 1,
  trialDays: 14,
  applicationFeePercent: 2.5,
});
// sub.status = 'trialing'
// sub.trialEnd = 14 days from now

// Preview next invoice
const preview = await getUpcomingInvoice(ventureId, sub.id);
// { subtotal: 2900, tax: 0, total: 2900, nextPaymentDate: '...' }

// Upgrade to Pro plan (prorated)
await updateSubscription(ventureId, sub.id, {
  priceId: 'price-pro-monthly',         // $79/month
  quantity: 3,                           // 3 seats
});
// Stripe automatically handles proration
```

### Example 7: Full Invoice V2 Lifecycle

```typescript
import {
  createInvoiceV2,
  sendInvoiceV2,
  recordPayment,
  getInvoiceSummary,
} from '@mcv/commerce';

// Create branded invoice
const invoice = await createInvoiceV2(ventureId, {
  contactId: 'contact-client-abc',
  organizationId: 'org-acme-corp',
  templateId: 'template-professional',
  dueDate: new Date('2026-03-08'),
  lineItems: [
    {
      id: 'li-1',
      description: 'Website Development - Phase 1',
      quantity: 1,
      unitPrice: 500000,               // $5,000
      amount: 500000,
      taxRate: 8.5,
      taxAmount: 42500,
      sortOrder: 0,
    },
    {
      id: 'li-2',
      description: 'SEO Optimization Package',
      quantity: 1,
      unitPrice: 150000,               // $1,500
      amount: 150000,
      taxRate: 8.5,
      taxAmount: 12750,
      sortOrder: 1,
    },
  ],
  notes: 'Thank you for your business!',
  terms: 'Net 30. Late payments subject to 1.5% monthly interest.',
  billingAddress: {
    line1: '123 Business Ave',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'US',
  },
  reminders: [
    { date: '2026-03-01', sent: false, type: 'before_due', dayOffset: -7 },
    { date: '2026-03-08', sent: false, type: 'on_due', dayOffset: 0 },
    { date: '2026-03-15', sent: false, type: 'after_due', dayOffset: 7 },
  ],
}, userId);
// invoice.number = 'INV-1042'
// invoice.total = 705250 ($7,052.50)

// Send to client
await sendInvoiceV2(ventureId, invoice.id);
// Status: draft → sent, email sent with payment link

// Record partial payment
await recordPayment(ventureId, invoice.id, {
  amount: 500000,                       // $5,000 partial payment
  method: 'card',
  reference: 'pi_xxxxxxxxxxxxx',
}, userId);
// Status: sent → partial, amountPaid = 500000, amountDue = 205250

// Dashboard summary
const summary = await getInvoiceSummary(ventureId);
// { totalDraft: 3, totalSent: 12, totalOverdue: 2,
//   amountOutstanding: 4500000, amountOverdue: 1200000 }
```

### Example 8: Proposal with E-Signature

```typescript
import {
  createProposal,
  sendProposal,
  acceptProposal,
  convertProposalToInvoice,
} from '@mcv/commerce';

// Create rich proposal
const proposal = await createProposal(ventureId, {
  contactId: 'contact-prospect',
  organizationId: 'org-prospect-corp',
  title: 'Digital Marketing Strategy 2026',
  content: [
    {
      id: 'blk-1',
      type: 'heading',
      content: 'Executive Summary',
      sortOrder: 0,
    },
    {
      id: 'blk-2',
      type: 'paragraph',
      content: '<p>We propose a comprehensive digital marketing strategy...</p>',
      sortOrder: 1,
    },
    {
      id: 'blk-3',
      type: 'testimonial',
      content: '"Best marketing agency we have ever worked with" — CEO, Acme Corp',
      metadata: { author: 'John Smith', company: 'Acme Corp' },
      sortOrder: 2,
    },
    {
      id: 'blk-4',
      type: 'pricing',
      content: '',                       // Pricing rendered from lineItems
      sortOrder: 3,
    },
    {
      id: 'blk-5',
      type: 'terms',
      content: 'Payment due within 30 days of acceptance.',
      sortOrder: 4,
    },
    {
      id: 'blk-6',
      type: 'signature',
      content: '',                       // Signature capture component
      sortOrder: 5,
    },
  ],
  lineItems: [
    { id: '1', description: 'Social Media Management', quantity: 12, unitPrice: 200000, amount: 2400000, sortOrder: 0 },
    { id: '2', description: 'SEO Campaign', quantity: 1, unitPrice: 500000, amount: 500000, sortOrder: 1 },
    { id: '3', description: 'PPC Management', quantity: 12, unitPrice: 150000, amount: 1800000, sortOrder: 2 },
  ],
  validUntil: new Date('2026-03-31'),
  coverImageUrl: 'https://cdn.example.com/proposal-cover.jpg',
}, userId);
// proposal.total = 4,700,000 ($47,000)

// Send to client
await sendProposal(ventureId, proposal.id);

// Client accepts with e-signature
await acceptProposal(ventureId, proposal.id, {
  signatureUrl: 'https://cdn.example.com/signatures/sig-abc123.png',
  signatureIp: '203.0.113.42',
});

// Convert to invoice
const invoice = await convertProposalToInvoice(ventureId, proposal.id, userId);
// Creates InvoiceV2 with same line items, linked to proposal
```

### Example 9: Recurring Invoice Setup

```typescript
import { createRecurringInvoice, listRecurringInvoices } from '@mcv/commerce';

// Set up monthly retainer billing
const recurring = await createRecurringInvoice(ventureId, {
  contactId: 'contact-retainer-client',
  templateId: 'template-professional',
  name: 'Monthly SEO Retainer - Acme Corp',
  templateConfig: {
    lineItems: [
      {
        id: 'r-1',
        description: 'SEO Retainer - Monthly',
        quantity: 1,
        unitPrice: 300000,             // $3,000
        amount: 300000,
        sortOrder: 0,
      },
      {
        id: 'r-2',
        description: 'Content Creation (8 articles)',
        quantity: 8,
        unitPrice: 25000,             // $250 each
        amount: 200000,
        sortOrder: 1,
      },
    ],
    currency: 'usd',
    paymentTermsDays: 15,
    notes: 'Monthly retainer as per service agreement dated Jan 1, 2026.',
  },
  interval: 'monthly',
  dayOfMonth: 1,                        // Generate on the 1st
  startDate: new Date('2026-03-01'),
  endDate: null,                        // Indefinite
  autoSend: true,                       // Auto-send on generation
}, userId);

// Cron job runs daily, generates due invoices:
// processDueRecurringInvoices() → creates InvoiceV2 with template line items
```

### Example 10: Credit Note and Application

```typescript
import { createCreditNote, issueCreditNote, applyCredit } from '@mcv/commerce';

// Create credit note for partial refund
const creditNote = await createCreditNote(ventureId, {
  invoiceId: 'inv-abc123',
  amount: 50000,                        // $500 credit
  reason: 'Service quality adjustment per client discussion on Feb 5',
  notes: 'Approved by manager Jane Doe',
}, userId);

// Issue the credit note (makes it applicable)
await issueCreditNote(ventureId, creditNote.id);

// Apply credit to the invoice
await applyCredit(ventureId, 'inv-abc123', creditNote.id);
// Invoice amountDue reduced by $500
```

### Example 11: Approval Workflow for High-Value Invoices

```typescript
import {
  createApprovalWorkflow,
  submitForApproval,
  makeApprovalDecision,
  getMyPendingApprovals,
} from '@mcv/commerce';

// Create 2-step approval for invoices over $10,000
const workflow = await createApprovalWorkflow(ventureId, {
  name: 'High-Value Invoice Approval',
  entityType: 'invoice',
  rules: [
    {
      step: 1,
      approverRoleId: 'role-account-manager',
      autoApproveBelow: 1000000,        // Auto-approve under $10,000
    },
    {
      step: 2,
      approverUserId: 'user-cfo',
      condition: {
        field: 'total',
        operator: 'gt',
        value: 5000000,                 // CFO approves if > $50,000
      },
    },
  ],
}, userId);

// Submit invoice for approval
await submitForApproval(ventureId, {
  entityType: 'invoice',
  entityId: 'inv-large-deal',
  notes: 'Large enterprise deal, requires CFO sign-off',
}, userId);

// Account manager sees pending approvals
const pending = await getMyPendingApprovals(ventureId, 'user-account-mgr', {
  page: 1,
  pageSize: 20,
});

// Account manager approves step 1
await makeApprovalDecision(ventureId, {
  approvalRequestId: pending.items[0].id,
  decision: 'approved',
  reason: 'Pricing verified, client creditworthy',
}, 'user-account-mgr');

// CFO approves step 2
await makeApprovalDecision(ventureId, {
  approvalRequestId: pending.items[0].id,
  decision: 'approved',
  reason: 'Approved per Q1 sales target',
}, 'user-cfo');
```

### Example 12: Revenue Reporting

```typescript
import {
  getMrr,
  getArr,
  getChurnRate,
  getLtv,
  getRevenueTimeline,
  getRevenueByProduct,
  getPaymentMethodBreakdown,
} from '@mcv/commerce';

// Monthly Recurring Revenue
const mrr = await getMrr(ventureId);
// { mrr: 4500000, currency: 'usd', activeSubscriptions: 150 }

// Annual Recurring Revenue
const { arr } = await getArr(ventureId);
// arr: 54000000 ($540,000 ARR)

// Churn rate
const churn = await getChurnRate(ventureId, 'month');
// { rate: 3.2, churned: 5, total: 155, period: 'month' }

// Customer Lifetime Value
const ltv = await getLtv(ventureId);
// { ltv: 360000, avgLifetimeMonths: 12, avgMonthlyRevenue: 30000 }

// Revenue timeline
const timeline = await getRevenueTimeline(ventureId, {
  from: new Date('2026-01-01'),
  to: new Date('2026-02-28'),
  granularity: 'week',
});
// [{ period: '2026-W01', revenue: 1250000 }, { period: '2026-W02', revenue: 1380000 }, ...]

// Revenue by product
const byProduct = await getRevenueByProduct(ventureId, {
  from: new Date('2026-01-01'),
  to: new Date('2026-01-31'),
});
// [{ productId, name, revenue: 850000, units: 42 }, ...]

// Payment method split
const methods = await getPaymentMethodBreakdown(ventureId);
// { card: 85, bank_transfer: 10, ach: 5 } // percentages
```

### Example 13: Checkout Session with Subscription Mode

```typescript
import { createCheckoutSession, createPaymentLink } from '@mcv/commerce';

// One-time payment checkout
const paymentSession = await createCheckoutSession(ventureId, {
  lineItems: [
    { priceId: 'price-headphones', quantity: 1 },
    { priceId: 'price-case', quantity: 1 },
  ],
  mode: 'payment',
  customerId: 'cust-buyer',
  successUrl: 'https://store.example.com/thank-you?session={CHECKOUT_SESSION_ID}',
  cancelUrl: 'https://store.example.com/cart',
});

// Subscription checkout
const subSession = await createCheckoutSession(ventureId, {
  lineItems: [
    { priceId: 'price-pro-monthly', quantity: 1 },
  ],
  mode: 'subscription',
  customerId: 'cust-subscriber',
  successUrl: 'https://app.example.com/welcome',
  cancelUrl: 'https://app.example.com/pricing',
});

// Reusable payment link (no session needed)
const link = await createPaymentLink(ventureId, {
  lineItems: [
    { priceId: 'price-consultation', quantity: 1 },
  ],
});
// link.url → "https://checkout.stripe.com/pay/pl_xxx"
```

### Example 14: Collection with Automated Rules

```typescript
import { createCollection, evaluateCollectionRules, addProductsToCollection } from '@mcv/commerce';

// Create automated collection
const saleCollection = await createCollection(ventureId, {
  name: 'On Sale',
  slug: 'on-sale',
  description: 'Products currently on sale',
  type: 'automated',
  rules: {
    conditions: [
      { field: 'tag', operator: 'contains', value: 'sale' },
      { field: 'price_max', operator: 'lt', value: '10000' },
    ],
    match: 'all',                       // Product must match ALL conditions
  },
  isActive: true,
});

// Evaluate rules (adds/removes products based on conditions)
await evaluateCollectionRules(ventureId, saleCollection.id);

// Manual collection
const bestSellers = await createCollection(ventureId, {
  name: 'Best Sellers',
  slug: 'best-sellers',
  type: 'manual',
  isActive: true,
});

await addProductsToCollection(ventureId, bestSellers.id, [
  'prod-headphones',
  'prod-earbuds',
  'prod-speaker',
]);
```

### Example 15: Platform Fee Configuration (Super Admin)

```typescript
import {
  updatePlatformFeeConfig,
  getPlatformRevenueReport,
} from '@mcv/commerce';

// Set tiered pricing for a high-volume venture
await updatePlatformFeeConfig({
  ventureId: 'venture-enterprise',
  feeType: 'tiered',
  tieredConfig: {
    tiers: [
      { upTo: 10000000, feePercent: 3.0 },   // 3% up to $100K volume
      { upTo: 50000000, feePercent: 2.5 },   // 2.5% $100K-$500K
      { upTo: 100000000, feePercent: 2.0 },  // 2.0% $500K-$1M
      { upTo: Infinity, feePercent: 1.5 },   // 1.5% above $1M
    ],
    resetPeriod: 'monthly',
  },
  invoiceFeePercent: 1.0,               // 1% on invoice payments
  proposalConversionFee: 500,           // $5 per converted proposal
  cappedAt: 50000,                       // Max $500 fee per transaction
  minimumFee: 50,                        // Min $0.50 fee
  isActive: true,
  effectiveFrom: new Date('2026-03-01'),
  notes: 'Negotiated enterprise rate per contract #ENT-2026-042',
}, superAdminUserId);

// Platform revenue report
const report = await getPlatformRevenueReport({
  from: new Date('2026-01-01'),
  to: new Date('2026-01-31'),
});
// { totalFees: 15000000, totalTransactions: 4200, avgFeePercent: 2.35,
//   byVenture: [{ ventureId, feesCollected, transactionVolume }] }
```

---

## Performance

### Query Optimization

| Operation | Target Latency | Strategy |
|-----------|---------------|----------|
| Product listing (paginated) | < 50ms | Composite index on (venture_id, status) + offset pagination |
| Product search (text) | < 100ms | GIN index on name/description + pg_trgm |
| Category tree load | < 30ms | Single query with materialized path + `LIKE 'path/%'` |
| Discount validation | < 20ms | Index on (venture_id, code) + in-memory usage check |
| Tax rate resolution | < 10ms | Index on (country, state, postal_code) + cache |
| Invoice listing | < 50ms | Composite index on (venture_id, status) + cursor pagination |
| Stripe webhook processing | < 200ms | Unique index on Stripe IDs for fast lookup |
| Revenue reporting | < 500ms | Materialized views for aggregates, updated on cron |

### Caching Strategy

```
┌─────────────────────────────────────────────────────┐
│                   CACHE LAYERS                       │
│                                                      │
│  ┌─────────────────┐  TTL: 5 min                   │
│  │ Product Catalog  │  Invalidate: on product CRUD  │
│  └─────────────────┘                                │
│                                                      │
│  ┌─────────────────┐  TTL: 1 hour                   │
│  │ Category Tree    │  Invalidate: on category CRUD │
│  └─────────────────┘                                │
│                                                      │
│  ┌─────────────────┐  TTL: 30 sec                   │
│  │ Cart Sessions    │  Invalidate: on cart mutation  │
│  └─────────────────┘                                │
│                                                      │
│  ┌─────────────────┐  TTL: 24 hours                 │
│  │ Tax Rates        │  Invalidate: on rate CRUD     │
│  └─────────────────┘                                │
│                                                      │
│  ┌─────────────────┐  TTL: 1 hour                   │
│  │ Stripe Account   │  Invalidate: on webhook       │
│  └─────────────────┘                                │
│                                                      │
│  ┌─────────────────┐  TTL: 15 min                   │
│  │ Revenue Metrics  │  Invalidate: on payment       │
│  └─────────────────┘                                │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Bulk Operations

- Product status updates: max 100 per batch
- Product deletions: max 100 per batch
- Inventory adjustments: max 100 per batch
- Collection product add/remove: max 100 per batch
- All bulk operations use `Promise.all` with connection pooling
- Transactions guarantee atomicity for inventory movements

### Pagination

All list endpoints support offset-based pagination:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;                         // 1-indexed
  pageSize: number;                     // Default: 20, max: 100
}
```

---

## Security

### Authorization Levels

| Level | Description | Procedures |
|-------|-------------|------------|
| `ventureProcedure` | Any authenticated venture member | Read operations, listing, search |
| `adminProcedure` | Venture admin or higher | Create, update, delete, send, record payments |
| `superAdminProcedure` | Platform super admin only | Cross-venture analytics, platform fees, account listing |
| `protectedProcedure` | Any authenticated user | Document view tracking, notification reads |

### Data Isolation

All queries are scoped by `ventureId` — enforced at both the procedure level (via middleware) and the service level (via query conditions). There is no way to access another venture's data through the Commerce API.

```typescript
// Every service method enforces venture scoping:
async function getProduct(ventureId: string, productId: string) {
  const product = await db.select()
    .from(products)
    .where(and(
      eq(products.id, productId),
      eq(products.ventureId, ventureId),  // Always scoped
    ))
    .limit(1);
  return product[0] ?? null;
}
```

### PCI Compliance

Commerce never stores raw card numbers, CVVs, or full card data. All payment processing is delegated to Stripe:

- **Card data** → Collected by Stripe.js / Stripe Elements (client-side tokenization)
- **Payment intents** → Created on Stripe's servers, referenced by ID
- **Card metadata** → Only `cardBrand` and `cardLast4` are stored (PCI-compliant)
- **Webhook secrets** → Stored as environment variables, never in the database

### Sensitive Data Handling

| Data | Storage | Access |
|------|---------|--------|
| Stripe account IDs | Encrypted at rest (DB-level) | Admin only |
| Customer emails | Plain text (needed for Stripe sync) | Venture members |
| Payment amounts | Integer (cents) | Venture members |
| Card last 4 | Plain text (non-sensitive per PCI) | Venture members |
| Signatures (e-sig) | URL to signed image | Venture members |
| Signature IPs | Plain text | Admin only |
| Webhook secrets | Environment variable | Server only |

### Input Validation

All inputs are validated via Zod schemas at the router level before reaching service code:

```typescript
// Example: product creation validation
z.object({
  name: z.string().min(1).max(500),
  basePrice: z.number().int().min(0),     // No negative prices
  sku: z.string().max(100).optional(),
  description: z.string().max(10000).optional(),
  images: z.array(productImageSchema).optional(),
  tags: z.array(z.string()).optional(),
  // ... all fields validated
})
```

### Rate Limiting

| Endpoint Group | Rate Limit | Window |
|---------------|------------|--------|
| Product reads | 100 req/s per venture | Sliding window |
| Product writes | 20 req/s per venture | Sliding window |
| Checkout creation | 10 req/s per venture | Sliding window |
| Payment operations | 30 req/s per venture | Sliding window |
| Invoice operations | 50 req/s per venture | Sliding window |
| Webhook processing | 100 req/s global | Sliding window |
| Reporting queries | 5 req/s per venture | Sliding window |

---

## Audit Events

All significant commerce operations emit audit events for compliance and debugging.

### Catalog Events

| Event | Trigger | Data |
|-------|---------|------|
| `catalog.product.created` | Product creation | productId, name, type, status, userId |
| `catalog.product.updated` | Product update | productId, changedFields, userId |
| `catalog.product.deleted` | Product deletion | productId, name, userId |
| `catalog.product.archived` | Product archived | productId, previousStatus |
| `catalog.product.status_changed` | Status change | productId, from, to, userId |
| `catalog.product.stripe_synced` | Stripe sync | productId, stripeProductId, stripePriceId |
| `catalog.category.created` | Category creation | categoryId, name, parentId |
| `catalog.category.moved` | Category reparent | categoryId, oldParentId, newParentId |
| `catalog.category.deleted` | Category deletion | categoryId, name, childCount |
| `catalog.discount.created` | Discount code created | discountId, code, type, value |
| `catalog.discount.applied` | Discount applied to cart | discountId, code, cartTotal, discountAmount |
| `catalog.discount.exhausted` | Usage limit reached | discountId, code, usageCount |
| `catalog.inventory.movement` | Inventory change | productId, variantId, type, quantity, reference |
| `catalog.inventory.low_stock` | Below threshold | productId, quantity, threshold |
| `catalog.collection.evaluated` | Auto-rules evaluated | collectionId, added, removed |

### Payment Events

| Event | Trigger | Data |
|-------|---------|------|
| `payments.account.created` | Stripe account created | accountId, stripeAccountId, type |
| `payments.account.activated` | Onboarding complete | accountId, stripeAccountId |
| `payments.checkout.created` | Checkout session created | sessionId, mode, totalAmount |
| `payments.checkout.completed` | Payment successful | sessionId, paymentIntentId, amount |
| `payments.checkout.expired` | Session expired | sessionId |
| `payments.payment.succeeded` | Payment successful | paymentId, amount, method |
| `payments.payment.failed` | Payment failed | paymentId, amount, errorCode |
| `payments.refund.created` | Refund initiated | refundId, paymentId, amount, reason |
| `payments.refund.completed` | Refund processed | refundId, amount |
| `payments.dispute.opened` | Dispute filed | disputeId, paymentId, amount, reason |
| `payments.dispute.resolved` | Dispute resolved | disputeId, outcome (won/lost) |
| `payments.payout.created` | Payout initiated | payoutId, amount, method |
| `payments.payout.failed` | Payout failed | payoutId, failureCode, failureMessage |
| `payments.subscription.created` | Subscription started | subId, customerId, priceId |
| `payments.subscription.canceled` | Subscription canceled | subId, reason, immediately |
| `payments.subscription.renewed` | Billing cycle renewed | subId, invoiceId, amount |
| `payments.fee.updated` | Platform fee changed | ventureId, oldFee, newFee, updatedBy |

### Invoicing Events

| Event | Trigger | Data |
|-------|---------|------|
| `invoicing.invoice.created` | Invoice created | invoiceId, number, total |
| `invoicing.invoice.sent` | Invoice sent to client | invoiceId, contactId, sentAt |
| `invoicing.invoice.viewed` | Client viewed invoice | invoiceId, viewedAt, viewerIp |
| `invoicing.invoice.paid` | Full payment received | invoiceId, amount, method |
| `invoicing.invoice.partial_payment` | Partial payment | invoiceId, amount, remaining |
| `invoicing.invoice.overdue` | Past due date | invoiceId, dueDate, amountDue |
| `invoicing.invoice.voided` | Invoice voided | invoiceId, reason |
| `invoicing.invoice.written_off` | Invoice written off | invoiceId, amount |
| `invoicing.proposal.created` | Proposal created | proposalId, title, total |
| `invoicing.proposal.sent` | Proposal sent | proposalId, contactId |
| `invoicing.proposal.accepted` | Proposal accepted | proposalId, signatureUrl, signatureIp |
| `invoicing.proposal.declined` | Proposal declined | proposalId, reason |
| `invoicing.proposal.converted` | Converted to invoice | proposalId, invoiceId |
| `invoicing.estimate.created` | Estimate created | estimateId, title, total |
| `invoicing.estimate.accepted` | Estimate accepted | estimateId, signatureUrl |
| `invoicing.estimate.converted` | Converted to invoice | estimateId, invoiceId, milestonePercent |
| `invoicing.recurring.generated` | Invoice auto-generated | recurringId, invoiceId, total |
| `invoicing.recurring.paused` | Recurring paused | recurringId |
| `invoicing.recurring.cancelled` | Recurring cancelled | recurringId |
| `invoicing.credit_note.issued` | Credit note issued | creditNoteId, invoiceId, amount |
| `invoicing.credit_note.applied` | Credit applied | creditNoteId, invoiceId, amount |
| `invoicing.approval.submitted` | Submitted for approval | requestId, entityType, entityId |
| `invoicing.approval.decided` | Approval decision made | requestId, decision, decidedBy |
| `invoicing.approval.completed` | All steps approved | requestId, entityType, entityId |

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe platform secret key | `sk_live_xxxxxxxxxxxxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret | `whsec_xxxxxxxxxxxxx` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side) | `pk_live_xxxxxxxxxxxxx` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/mcv` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
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

---

## Error Codes

### Catalog Errors

| Code | HTTP | Description |
|------|------|-------------|
| `PRODUCT_NOT_FOUND` | 404 | Product does not exist or not in this venture |
| `PRODUCT_SLUG_EXISTS` | 409 | Product slug already taken in this venture |
| `PRODUCT_SKU_EXISTS` | 409 | Product SKU already exists |
| `PRODUCT_ARCHIVED` | 400 | Cannot modify archived product |
| `CATEGORY_NOT_FOUND` | 404 | Category does not exist |
| `CATEGORY_CIRCULAR_REF` | 400 | Moving category would create circular reference |
| `CATEGORY_HAS_CHILDREN` | 400 | Cannot delete category with children |
| `DISCOUNT_NOT_FOUND` | 404 | Discount code does not exist |
| `DISCOUNT_CODE_EXISTS` | 409 | Discount code already taken |
| `DISCOUNT_EXPIRED` | 400 | Discount code past end date |
| `DISCOUNT_NOT_ACTIVE` | 400 | Discount code is deactivated |
| `DISCOUNT_USAGE_EXCEEDED` | 400 | Discount usage limit reached |
| `DISCOUNT_PER_CUSTOMER_EXCEEDED` | 400 | Per-customer usage limit reached |
| `DISCOUNT_MINIMUM_NOT_MET` | 400 | Cart total below minimum amount |
| `DISCOUNT_NOT_APPLICABLE` | 400 | Discount doesn't apply to cart products/categories |
| `INVENTORY_INSUFFICIENT` | 400 | Not enough stock for operation |
| `PRICE_RULE_NOT_FOUND` | 404 | Price rule does not exist |
| `COLLECTION_NOT_FOUND` | 404 | Collection does not exist |
| `TAX_CATEGORY_NOT_FOUND` | 404 | Tax category does not exist |
| `TAX_RATE_NOT_FOUND` | 404 | Tax rate does not exist |

### Payment Errors

| Code | HTTP | Description |
|------|------|-------------|
| `STRIPE_ACCOUNT_NOT_FOUND` | 404 | No Stripe account for this venture |
| `STRIPE_ACCOUNT_NOT_ACTIVE` | 400 | Stripe account not yet activated |
| `STRIPE_CHARGES_DISABLED` | 400 | Stripe charges not enabled |
| `STRIPE_PAYOUTS_DISABLED` | 400 | Stripe payouts not enabled |
| `STRIPE_ONBOARDING_INCOMPLETE` | 400 | Stripe onboarding not finished |
| `PAYMENT_NOT_FOUND` | 404 | Payment transaction not found |
| `PAYMENT_ALREADY_REFUNDED` | 400 | Payment already fully refunded |
| `REFUND_AMOUNT_EXCEEDS_PAYMENT` | 400 | Refund amount > remaining refundable |
| `CHECKOUT_SESSION_EXPIRED` | 400 | Checkout session has expired |
| `CHECKOUT_SESSION_COMPLETE` | 400 | Cannot modify completed session |
| `SUBSCRIPTION_NOT_FOUND` | 404 | Subscription not found |
| `SUBSCRIPTION_ALREADY_CANCELED` | 400 | Subscription already canceled |
| `SUBSCRIPTION_ALREADY_PAUSED` | 400 | Subscription already paused |
| `SUBSCRIPTION_NOT_PAUSED` | 400 | Cannot resume non-paused subscription |
| `CUSTOMER_NOT_FOUND` | 404 | Payment customer not found |
| `PRICE_NOT_FOUND` | 404 | Price not found |
| `PAYOUT_INSUFFICIENT_BALANCE` | 400 | Insufficient balance for payout |
| `DISPUTE_EVIDENCE_DEADLINE_PASSED` | 400 | Evidence submission deadline passed |

### Invoicing Errors

| Code | HTTP | Description |
|------|------|-------------|
| `INVOICE_NOT_FOUND` | 404 | Invoice not found |
| `INVOICE_NOT_DRAFT` | 400 | Can only edit draft invoices |
| `INVOICE_ALREADY_SENT` | 400 | Invoice already sent |
| `INVOICE_ALREADY_PAID` | 400 | Invoice already fully paid |
| `INVOICE_ALREADY_VOIDED` | 400 | Invoice already voided |
| `INVOICE_PAYMENT_EXCEEDS_DUE` | 400 | Payment amount exceeds amount due |
| `TEMPLATE_NOT_FOUND` | 404 | Invoice template not found |
| `PROPOSAL_NOT_FOUND` | 404 | Proposal not found |
| `PROPOSAL_NOT_SENT` | 400 | Cannot accept/decline unsent proposal |
| `PROPOSAL_ALREADY_ACCEPTED` | 400 | Proposal already accepted |
| `PROPOSAL_ALREADY_DECLINED` | 400 | Proposal already declined |
| `PROPOSAL_EXPIRED` | 400 | Proposal past validity date |
| `ESTIMATE_NOT_FOUND` | 404 | Estimate not found |
| `ESTIMATE_NOT_ACCEPTED` | 400 | Cannot convert unaccepted estimate |
| `ESTIMATE_FULLY_INVOICED` | 400 | All milestones already invoiced |
| `RECURRING_NOT_FOUND` | 404 | Recurring invoice not found |
| `RECURRING_ALREADY_CANCELLED` | 400 | Recurring invoice already cancelled |
| `CREDIT_NOTE_NOT_FOUND` | 404 | Credit note not found |
| `CREDIT_NOTE_EXCEEDS_INVOICE` | 400 | Credit amount exceeds invoice total |
| `CREDIT_NOTE_ALREADY_APPLIED` | 400 | Credit note already applied |
| `APPROVAL_WORKFLOW_NOT_FOUND` | 404 | Approval workflow not found |
| `APPROVAL_NOT_PENDING` | 400 | No pending approval at current step |
| `APPROVAL_UNAUTHORIZED` | 403 | User not authorized for this approval step |
| `PLATFORM_FEE_CONFIG_NOT_FOUND` | 404 | No fee config for venture |

---

## Dependencies

### Internal Dependencies

| Package | Usage | Required |
|---------|-------|----------|
| `@mcv/kernel` | Multi-tenancy (ventureId), auth, middleware | Yes |
| `@mcv/identity` | User authentication, role checking | Yes |
| `@mcv/fabric` | UI components for commerce pages | Yes (client) |
| `@mcv/db` | Database connection, Drizzle ORM schemas | Yes |
| `@mcv/shared` | Validation schemas, utility functions | Yes |
| `@mcv/connectors/email` | Invoice/proposal email delivery | Optional |
| `@mcv/connectors/shipping` | Carrier rate calculation, label generation | Optional |
| `@mcv/crm` | Contact and organization lookups (contactId, organizationId) | Optional |

### External Dependencies

| Package | Version | Usage |
|---------|---------|-------|
| `stripe` | `^17.x` | Stripe API client for Connect, payments, subscriptions |
| `drizzle-orm` | `^0.38.x` | Database ORM (schema definitions, queries) |
| `@trpc/server` | `^10.x` | tRPC router definitions |
| `zod` | `^3.x` | Input validation schemas |

### Stripe API Integration Points

| Stripe API | Commerce Usage |
|------------|----------------|
| `accounts.create` | Create connected account |
| `accountLinks.create` | Generate onboarding URL |
| `accounts.retrieve` | Check account status |
| `products.create/update` | Sync catalog products |
| `prices.create` | Create pricing for products |
| `customers.create` | Create Stripe customer (synced from CRM) |
| `subscriptions.create/update/cancel` | Subscription lifecycle |
| `invoices.create/send/void` | Stripe-native invoicing |
| `checkout.sessions.create` | Hosted checkout pages |
| `paymentLinks.create` | Reusable payment links |
| `refunds.create` | Process refunds |
| `disputes.update` | Submit dispute evidence |
| `payouts.create` | Initiate payouts to connected accounts |
| `balance.retrieve` | Check connected account balance |
| `taxRates.create` | Create tax rate objects |

### Webhook Events Handled

| Stripe Event | Commerce Handler |
|-------------|-----------------|
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

## tRPC Router Summary

### catalogRouter — 45 procedures

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `createProduct` | mutation | admin | Create product with full config |
| `updateProduct` | mutation | admin | Partial product update |
| `deleteProduct` | mutation | admin | Delete product |
| `getProduct` | query | venture | Get product by ID |
| `listProducts` | query | venture | Paginated product list with filters |
| `duplicateProduct` | mutation | admin | Clone product |
| `archiveProduct` | mutation | admin | Archive product |
| `bulkUpdateProductStatus` | mutation | admin | Batch status change |
| `bulkDeleteProducts` | mutation | admin | Batch delete |
| `syncProductToStripe` | mutation | admin | Push to Stripe |
| `getLowStockProducts` | query | venture | Low stock alert list |
| `createCategory` | mutation | admin | Create category |
| `updateCategory` | mutation | admin | Update category |
| `deleteCategory` | mutation | admin | Delete category |
| `getCategory` | query | venture | Get category |
| `listCategories` | query | venture | Paginated category list |
| `getCategoryTree` | query | venture | Full tree structure |
| `moveCategory` | mutation | admin | Reparent category |
| `getCategoryAncestors` | query | venture | Get ancestor chain |
| `getCategoryDescendants` | query | venture | Get all descendants |
| `recountCategoryProducts` | mutation | admin | Recount product_count |
| `createDiscount` | mutation | admin | Create discount code |
| `updateDiscount` | mutation | admin | Update discount |
| `deleteDiscount` | mutation | admin | Delete discount |
| `getDiscount` | query | venture | Get discount by ID |
| `listDiscounts` | query | venture | Paginated discount list |
| `validateDiscountCode` | query | venture | Validate code |
| `applyDiscountToCart` | mutation | admin | Apply and calculate |
| `incrementDiscountUsage` | mutation | admin | Bump usage counter |
| `recordInventoryMovement` | mutation | admin | Record stock change |
| `bulkAdjustInventory` | mutation | admin | Batch adjustments |
| `transferInventory` | mutation | admin | Transfer between variants |
| `listInventoryMovements` | query | venture | Movement audit trail |
| `getLowStockAlerts` | query | venture | Low stock products |
| `getStockReport` | query | venture | Stock snapshot |
| `createPriceRule` | mutation | admin | Create pricing rule |
| `updatePriceRule` | mutation | admin | Update rule |
| `deletePriceRule` | mutation | admin | Delete rule |
| `getPriceRule` | query | venture | Get rule by ID |
| `listPriceRules` | query | venture | Paginated rule list |
| `listPriceRulesByProduct` | query | venture | Rules for a product |
| `calculateEffectivePrice` | query | venture | Resolve final price |
| `createCollection` | mutation | admin | Create collection |
| `updateCollection` | mutation | admin | Update collection |
| `deleteCollection` | mutation | admin | Delete collection |
| `getCollection` | query | venture | Get collection |
| `listCollections` | query | venture | Paginated collection list |
| `addProductsToCollection` | mutation | admin | Add products |
| `removeProductsFromCollection` | mutation | admin | Remove products |
| `reorderCollectionProducts` | mutation | admin | Set sort order |
| `evaluateCollectionRules` | mutation | admin | Re-evaluate auto rules |
| `createTaxCategory` | mutation | admin | Create tax category |
| `listTaxCategories` | query | venture | List tax categories |
| `deleteTaxCategory` | mutation | admin | Delete tax category |
| `createTaxRate` | mutation | admin | Create tax rate |
| `listTaxRates` | query | venture | List tax rates |
| `deleteTaxRate` | mutation | admin | Delete tax rate |
| `getCatalogAnalytics` | query | venture | Venture catalog stats |
| `getCrossVentureCatalogStats` | query | superAdmin | Cross-venture stats |

### paymentsRouter — 32 procedures

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `createAccount` | mutation | admin | Create Stripe connected account |
| `getAccount` | query | venture | Get connected account |
| `getOnboardingLink` | mutation | admin | Generate onboarding URL |
| `getBalance` | query | venture | Stripe balance |
| `updateFee` | mutation | superAdmin | Update application fee |
| `listAccounts` | query | superAdmin | All connected accounts |
| `createProduct` | mutation | admin | Create payment product |
| `updateProduct` | mutation | admin | Update product |
| `archiveProduct` | mutation | admin | Archive product |
| `getProduct` | query | venture | Get product |
| `listProducts` | query | venture | List products |
| `createPrice` | mutation | admin | Create price |
| `archivePrice` | mutation | admin | Archive price |
| `listPrices` | query | venture | List prices by product |
| `createCustomer` | mutation | admin | Create payment customer |
| `listCustomers` | query | venture | List customers |
| `createSubscription` | mutation | admin | Create subscription |
| `updateSubscription` | mutation | admin | Update subscription |
| `cancelSubscription` | mutation | admin | Cancel subscription |
| `pauseSubscription` | mutation | admin | Pause subscription |
| `resumeSubscription` | mutation | admin | Resume subscription |
| `listSubscriptions` | query | venture | List subscriptions |
| `getUpcomingInvoice` | query | venture | Preview next invoice |
| `applyDiscount` | mutation | admin | Apply coupon |
| `createInvoice` | mutation | admin | Create Stripe invoice |
| `updateInvoice` | mutation | admin | Update invoice |
| `sendInvoice` | mutation | admin | Send invoice |
| `voidInvoice` | mutation | admin | Void invoice |
| `markUncollectible` | mutation | admin | Mark uncollectible |
| `addInvoiceLineItem` | mutation | admin | Add line item |
| `listInvoices` | query | venture | List invoices |
| `createCheckoutSession` | mutation | admin | Create checkout |
| `createPaymentLink` | mutation | admin | Create payment link |
| `getCheckoutSession` | query | venture | Get session |
| `expireCheckoutSession` | mutation | admin | Expire session |
| `createRefund` | mutation | admin | Create refund |
| `listRefunds` | query | venture | List refunds |
| `listDisputes` | query | venture | List disputes |
| `submitDisputeEvidence` | mutation | admin | Submit evidence |
| `createPayout` | mutation | admin | Create payout |
| `listPayouts` | query | venture | List payouts |
| `getMrr` | query | venture | Monthly recurring revenue |
| `getArr` | query | venture | Annual recurring revenue |
| `getChurnRate` | query | venture | Churn rate |
| `getLtv` | query | venture | Customer lifetime value |
| `getRevenueTimeline` | query | venture | Revenue over time |
| `getRevenueByProduct` | query | venture | Per-product revenue |
| `getPaymentMethodBreakdown` | query | venture | Payment method split |
| `getPlatformRevenue` | query | superAdmin | Platform fee revenue |
| `getOutstandingInvoices` | query | venture | Unpaid invoice totals |

### invoicingRouter — 55 procedures

| Procedure | Type | Auth | Description |
|-----------|------|------|-------------|
| `createTemplate` | mutation | admin | Create invoice template |
| `listTemplates` | query | venture | List templates |
| `updateTemplate` | mutation | admin | Update template |
| `deleteTemplate` | mutation | admin | Delete template |
| `createInvoice` | mutation | admin | Create V2 invoice |
| `updateInvoice` | mutation | admin | Update V2 invoice |
| `deleteInvoice` | mutation | admin | Delete V2 invoice |
| `getInvoice` | query | venture | Get V2 invoice |
| `listInvoices` | query | venture | List V2 invoices |
| `sendInvoice` | mutation | admin | Send invoice |
| `markInvoiceViewed` | mutation | venture | Track view |
| `recordPayment` | mutation | admin | Record manual payment |
| `applyCredit` | mutation | admin | Apply credit note |
| `voidInvoice` | mutation | admin | Void invoice |
| `writeOffInvoice` | mutation | admin | Write off invoice |
| `duplicateInvoice` | mutation | admin | Clone invoice |
| `getInvoiceSummary` | query | venture | Dashboard stats |
| `getInvoiceHtml` | query | venture | Rendered HTML |
| `getInvoicePdfData` | query | venture | PDF generation data |
| `detectOverdue` | mutation | admin | Detect overdue invoices (cron) |
| `processReminders` | mutation | admin | Process due reminders (cron) |
| `createProposal` | mutation | admin | Create proposal |
| `updateProposal` | mutation | admin | Update proposal |
| `deleteProposal` | mutation | admin | Delete proposal |
| `getProposal` | query | venture | Get proposal |
| `listProposals` | query | venture | List proposals |
| `sendProposal` | mutation | admin | Send proposal |
| `markProposalViewed` | mutation | venture | Track view |
| `acceptProposal` | mutation | venture | Accept with e-signature |
| `declineProposal` | mutation | venture | Decline with reason |
| `convertProposalToInvoice` | mutation | admin | Convert to invoice |
| `getProposalSummary` | query | venture | Dashboard stats |
| `createRecurring` | mutation | admin | Create recurring invoice |
| `updateRecurring` | mutation | admin | Update recurring |
| `pauseRecurring` | mutation | admin | Pause generation |
| `resumeRecurring` | mutation | admin | Resume generation |
| `cancelRecurring` | mutation | admin | Cancel recurring |
| `getRecurring` | query | venture | Get recurring |
| `listRecurring` | query | venture | List recurring |
| `processDueRecurring` | mutation | superAdmin | Process due invoices (cron) |
| `createCreditNote` | mutation | admin | Create credit note |
| `issueCreditNote` | mutation | admin | Issue credit note |
| `voidCreditNote` | mutation | admin | Void credit note |
| `listCreditNotes` | query | venture | List credit notes |
| `getPlatformFeeConfig` | query | superAdmin | Get fee config |
| `updatePlatformFeeConfig` | mutation | superAdmin | Update fee config |
| `listPlatformFeeConfigs` | query | superAdmin | List all fee configs |
| `getPlatformRevenueReport` | query | superAdmin | Platform revenue |
| `createEstimate` | mutation | admin | Create estimate |
| `updateEstimate` | mutation | admin | Update estimate |
| `deleteEstimate` | mutation | admin | Delete estimate |
| `getEstimate` | query | venture | Get estimate |
| `listEstimates` | query | venture | List estimates |
| `sendEstimate` | mutation | admin | Send estimate |
| `markEstimateViewed` | mutation | venture | Track view |
| `acceptEstimate` | mutation | venture | Accept with e-signature |
| `declineEstimate` | mutation | venture | Decline with reason |
| `convertEstimateToInvoice` | mutation | admin | Convert to invoice |
| `duplicateEstimate` | mutation | admin | Clone estimate |
| `getEstimateSummary` | query | venture | Dashboard stats |
| `detectExpiredEstimates` | mutation | admin | Detect expired (cron) |
| `createApprovalWorkflow` | mutation | admin | Create workflow |
| `updateApprovalWorkflow` | mutation | admin | Update workflow |
| `deleteApprovalWorkflow` | mutation | admin | Delete workflow |
| `listApprovalWorkflows` | query | venture | List workflows |
| `submitForApproval` | mutation | admin | Submit for review |
| `makeApprovalDecision` | mutation | admin | Approve/reject |
| `getApprovalStatus` | query | venture | Check approval state |
| `getMyPendingApprovals` | query | venture | Pending for user |
| `cancelApproval` | mutation | admin | Cancel request |
| `trackDocumentView` | mutation | protected | Track engagement |
| `getEngagementScore` | query | venture | Engagement score |
| `getViewHistory` | query | venture | View history |
| `getEngagementHeatmap` | query | venture | Section heatmap |
| `getClientNotifications` | query | venture | Client notifications |
| `markNotificationRead` | mutation | protected | Mark notification read |
| `getEngagementReport` | query | venture | Engagement report |
| `createPricingConfig` | mutation | admin | Create interactive pricing |
| `updatePricingConfig` | mutation | admin | Update pricing config |
| `getPricingConfig` | query | venture | Get pricing config |
| `selectPackage` | mutation | protected | Client selects package |
| `toggleAddon` | mutation | protected | Client toggles addon |
| `updatePricingQuantity` | mutation | protected | Client adjusts qty |
| `lockPricingSelection` | mutation | protected | Lock selection |
| `getPricingSelectionSummary` | query | venture | Selection summary |

**Total: 132 tRPC procedures across 3 routers**

---

## Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| `processReminders` | `*/30 * * * *` (every 30 min) | Send invoice reminders that are due |
| `detectOverdueInvoices` | `0 8 * * *` (daily 8 AM) | Mark past-due invoices as overdue |
| `processDueRecurringInvoices` | `0 6 * * *` (daily 6 AM) | Generate invoices for due recurring schedules |
| `detectExpiredEstimates` | `0 9 * * *` (daily 9 AM) | Mark expired estimates |
| `syncStripeWebhookMissed` | `0 */4 * * *` (every 4 hours) | Reconcile missed Stripe webhooks |

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/kernel` | Venture context, multi-tenancy, middleware |
| `@mcv/identity` | Authentication, authorization, role management |
| `@mcv/crm` | Contact and organization records (FK targets) |
| `@mcv/fabric` | UI component library for commerce interfaces |
| `@mcv/connectors/email` | Invoice/proposal email delivery |
| `@mcv/connectors/shipping` | Carrier API integration |
| `@mcv/intelligence/gateway` | AI-powered product descriptions, pricing suggestions |
| `@mcv/analytics` | Commerce analytics dashboards |

---

*@mcv/domains/commerce — Full-Stack Commerce Platform*