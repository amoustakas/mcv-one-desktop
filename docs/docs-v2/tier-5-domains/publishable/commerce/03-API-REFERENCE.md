# @mcv/commerce — API Reference

| Field | Value |
|---|---|
| **Package** | `@mcv/commerce` |
| **Classification** | PUBLISHABLE |
| **Tier** | 5 (Domain Layer) |
| **Last Updated** | February 9, 2026 |

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Catalog API](#catalog-api)
3. [Cart API](#cart-api)
4. [Checkout API](#checkout-api)
5. [Payments API](#payments-api)
6. [Subscriptions API](#subscriptions-api)
7. [Invoicing API](#invoicing-api)
8. [Proposals API](#proposals-api)
9. [Estimates API](#estimates-api)
10. [Recurring Invoices API](#recurring-invoices-api)
11. [Tax API](#tax-api)
12. [Wholesale / Price Rules API](#wholesale--price-rules-api)
13. [Approval Workflows API](#approval-workflows-api)
14. [Platform Fees API](#platform-fees-api)
15. [Revenue Reporting API](#revenue-reporting-api)
16. [Type Definitions](#type-definitions)
17. [Zod Schemas](#zod-schemas)
18. [Events](#events)
19. [Error Codes](#error-codes)
20. [Configuration](#configuration)

---

## API Overview

`@mcv/commerce` exposes **132 tRPC procedures** across **3 routers**:

| Router | Procedures | Scope |
|---|---|---|
| `catalogRouter` | 57 | Products, categories, discounts, inventory, price rules, collections, tax |
| `paymentsRouter` | 32 | Stripe Connect, checkout, subscriptions, refunds, disputes, payouts, reporting |
| `invoicingRouter` | 55 | Templates, invoices V2, proposals, estimates, recurring, credit notes, approvals, engagement, fees |

### Authentication Levels

| Level | Description | Usage |
|---|---|---|
| `ventureProcedure` | Any authenticated venture member | Read operations, listing, search |
| `adminProcedure` | Venture admin or higher | Create, update, delete, send, record payments |
| `superAdminProcedure` | Platform super admin only | Cross-venture analytics, platform fees |
| `protectedProcedure` | Any authenticated user | Document view tracking, client-facing actions |

### Common Response Format

All list endpoints return a paginated response:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;       // 1-indexed
  pageSize: number;   // Default: 20, max: 100
}
```

### Common Input Patterns

```typescript
// Pagination input
interface PaginationInput {
  page?: number;       // Default: 1
  pageSize?: number;   // Default: 20, max: 100
}

// Date range filter
interface DateRangeInput {
  from?: Date;
  to?: Date;
}

// Sort input
interface SortInput {
  sort?: string;       // e.g. 'name_asc', 'price_desc', 'created_desc'
}
```

---

## Catalog API

### Product Service

#### `createProduct`

Creates a new product with full pricing, media, SEO, and inventory configuration.

```typescript
// Router: catalogRouter.createProduct
// Auth: adminProcedure
// Type: mutation

// Input
const input = z.object({
  name: z.string().min(1).max(500),
  slug: z.string().min(1).max(600).optional(),   // Auto-generated from name if omitted
  sku: z.string().max(100).optional(),
  description: z.string().max(10000).optional(),
  shortDescription: z.string().max(500).optional(),
  type: z.enum(['physical', 'digital', 'service', 'subscription', 'bundle']),
  status: z.enum(['draft', 'active', 'archived', 'discontinued']).default('draft'),
  basePrice: z.number().int().min(0),              // Price in cents
  compareAtPrice: z.number().int().min(0).optional(),
  costPrice: z.number().int().min(0).optional(),
  currency: z.string().length(3).default('usd'),
  taxable: z.boolean().default(true),
  taxCategoryId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().max(200),
    sortOrder: z.number().int().min(0),
    isPrimary: z.boolean(),
  })).optional(),
  attributes: z.record(z.unknown()).optional(),
  variants: z.record(z.array(z.string())).optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  trackInventory: z.boolean().default(false),
  inventoryQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  allowBackorder: z.boolean().default(false),
  weight: z.string().optional(),
  weightUnit: z.enum(['kg', 'lb', 'oz', 'g']).default('kg'),
  dimensions: z.object({
    length: z.number(),
    width: z.number(),
    height: z.number(),
    unit: z.enum(['cm', 'in']),
  }).optional(),
  digitalFileUrl: z.string().url().optional(),
  downloadLimit: z.number().int().min(1).optional(),
  expiryDays: z.number().int().min(1).optional(),
  isPublic: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

// Output: Product
// Events: catalog.product.created
```

**Example:**

```typescript
const product = await trpc.catalog.createProduct.mutate({
  name: 'Premium Wireless Headphones',
  type: 'physical',
  status: 'active',
  basePrice: 29999,         // $299.99
  compareAtPrice: 39999,    // Was $399.99
  costPrice: 12000,
  images: [
    { url: 'https://cdn.example.com/img.jpg', alt: 'Black headphones', sortOrder: 0, isPrimary: true },
  ],
  tags: ['electronics', 'audio', 'wireless'],
  trackInventory: true,
  inventoryQuantity: 500,
  isPublic: true,
  isFeatured: true,
});
```

#### `updateProduct`

Partial update with optimistic locking.

```typescript
// Router: catalogRouter.updateProduct
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  id: z.string().uuid(),
  // All fields from createProduct are optional
  name: z.string().min(1).max(500).optional(),
  basePrice: z.number().int().min(0).optional(),
  status: z.enum(['draft', 'active', 'archived', 'discontinued']).optional(),
  // ... all other fields optional
});

// Output: Product
// Events: catalog.product.updated
// Errors: PRODUCT_NOT_FOUND, PRODUCT_ARCHIVED
```

#### `deleteProduct`

Soft-delete — marks product as discontinued.

```typescript
// Router: catalogRouter.deleteProduct
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });

// Output: { success: boolean }
// Events: catalog.product.deleted
// Errors: PRODUCT_NOT_FOUND
```

#### `getProduct`

Retrieve product by ID with variants, price rules, and inventory data.

```typescript
// Router: catalogRouter.getProduct
// Auth: ventureProcedure
// Type: query

const input = z.object({ id: z.string().uuid() });

// Output: Product (with resolved variants and active price rules)
// Errors: PRODUCT_NOT_FOUND
```

#### `listProducts`

Paginated product listing with filters and sorting.

```typescript
// Router: catalogRouter.listProducts
// Auth: ventureProcedure
// Type: query

const input = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'active', 'archived', 'discontinued']).optional(),
  type: z.enum(['physical', 'digital', 'service', 'subscription', 'bundle']).optional(),
  categoryId: z.string().uuid().optional(),
  isFeatured: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  query: z.string().max(200).optional(),   // Text search
  sort: z.enum([
    'name_asc', 'name_desc',
    'price_asc', 'price_desc',
    'created_desc', 'created_asc',
  ]).default('created_desc'),
});

// Output: PaginatedResponse<Product>
```

#### `duplicateProduct`

Clone a product with a new SKU.

```typescript
// Router: catalogRouter.duplicateProduct
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });

// Output: Product (copy with status='draft', new slug)
// Events: catalog.product.created
```

#### `archiveProduct`

Set product status to archived.

```typescript
// Router: catalogRouter.archiveProduct
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });
// Output: Product
// Events: catalog.product.archived
```

#### `bulkUpdateProductStatus`

Batch status change for up to 100 products.

```typescript
// Router: catalogRouter.bulkUpdateProductStatus
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(100),
  status: z.enum(['draft', 'active', 'archived', 'discontinued']),
});

// Output: { updated: number }
// Events: catalog.product.status_changed (per product)
```

#### `bulkDeleteProducts`

Batch delete for up to 100 products.

```typescript
// Router: catalogRouter.bulkDeleteProducts
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  productIds: z.array(z.string().uuid()).min(1).max(100),
});

// Output: { deleted: number }
// Events: catalog.product.deleted (per product)
```

#### `syncProductToStripe`

Push product and price data to Stripe.

```typescript
// Router: catalogRouter.syncProductToStripe
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });

// Output: { stripeProductId: string; stripePriceId: string }
// Events: catalog.product.stripe_synced
// Errors: PRODUCT_NOT_FOUND, STRIPE_ACCOUNT_NOT_FOUND
```

#### `getLowStockProducts`

Products below their low-stock threshold.

```typescript
// Router: catalogRouter.getLowStockProducts
// Auth: ventureProcedure
// Type: query

const input = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// Output: PaginatedResponse<{ product: Product; currentQuantity: number; threshold: number }>
```

### Category Service

#### `createCategory`

Create category with auto-materialized path.

```typescript
// Router: catalogRouter.createCategory
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(250).optional(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

// Output: ProductCategory (with computed level and path)
// Events: catalog.category.created
```

#### `updateCategory`

```typescript
// Router: catalogRouter.updateCategory
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(250).optional(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Output: ProductCategory
// Errors: CATEGORY_NOT_FOUND
```

#### `deleteCategory`

```typescript
// Router: catalogRouter.deleteCategory
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });

// Output: { success: boolean }
// Errors: CATEGORY_NOT_FOUND, CATEGORY_HAS_CHILDREN
```

#### `getCategoryTree`

Full tree structure for the venture.

```typescript
// Router: catalogRouter.getCategoryTree
// Auth: ventureProcedure
// Type: query

// No input (entire venture tree)

// Output: CategoryTreeNode[]
interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  level: number;
  path: string;
  productCount: number;
  children: CategoryTreeNode[];
}
```

#### `moveCategory`

Reparent a category node (recalculates all paths).

```typescript
// Router: catalogRouter.moveCategory
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  id: z.string().uuid(),
  newParentId: z.string().uuid().nullable(),
});

// Output: ProductCategory
// Events: catalog.category.moved
// Errors: CATEGORY_NOT_FOUND, CATEGORY_CIRCULAR_REF
```

#### `getCategoryAncestors`

Breadcrumb chain for a category.

```typescript
// Router: catalogRouter.getCategoryAncestors
// Auth: ventureProcedure
// Type: query

const input = z.object({ id: z.string().uuid() });

// Output: ProductCategory[] (ordered root → leaf)
```

#### `getCategoryDescendants`

All nested children of a category.

```typescript
// Router: catalogRouter.getCategoryDescendants
// Auth: ventureProcedure
// Type: query

const input = z.object({ id: z.string().uuid() });

// Output: ProductCategory[]
```

### Discount Service

#### `createDiscount`

```typescript
// Router: catalogRouter.createDiscount
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  name: z.string().min(1).max(200),
  type: z.enum(['percentage', 'fixed', 'free_shipping', 'buy_x_get_y']),
  value: z.number().min(0),               // Percent (0-100) or cents
  minimumAmount: z.number().int().min(0).optional(),
  maximumDiscount: z.number().int().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  perCustomerLimit: z.number().int().min(1).optional(),
  applicableTo: z.object({
    type: z.enum(['all', 'products', 'categories']),
    ids: z.array(z.string().uuid()).optional(),
  }).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true),
});

// Output: DiscountCode
// Events: catalog.discount.created
// Errors: DISCOUNT_CODE_EXISTS
```

#### `validateDiscountCode`

Check validity without applying.

```typescript
// Router: catalogRouter.validateDiscountCode
// Auth: ventureProcedure
// Type: query

const input = z.object({
  code: z.string(),
  cartTotal: z.number().int().min(0),
  productIds: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  customerUsageCount: z.number().int().min(0).default(0),
});

// Output
interface DiscountValidation {
  valid: boolean;
  discount?: { code: string; type: string; value: number };
  discountAmount?: number;   // cents
  message: string;
}

// Errors: DISCOUNT_NOT_FOUND, DISCOUNT_EXPIRED, DISCOUNT_NOT_ACTIVE,
//         DISCOUNT_USAGE_EXCEEDED, DISCOUNT_MINIMUM_NOT_MET, DISCOUNT_NOT_APPLICABLE
```

#### `applyDiscountToCart`

Apply discount and calculate the amount.

```typescript
// Router: catalogRouter.applyDiscountToCart
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  code: z.string(),
  cartTotal: z.number().int().min(0),
  productIds: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  customerUsageCount: z.number().int().min(0).default(0),
});

// Output: { valid: boolean; discountAmount: number; finalTotal: number; code: string }
// Events: catalog.discount.applied
```

### Inventory Service

#### `recordInventoryMovement`

Record a stock change with audit trail.

```typescript
// Router: catalogRouter.recordInventoryMovement
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  type: z.enum(['purchase', 'sale', 'adjustment', 'return', 'transfer']),
  quantity: z.number().int(),             // Positive = add, negative = subtract
  reference: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

// Output: InventoryMovement
// Events: catalog.inventory.movement, catalog.inventory.low_stock (if below threshold)
// Errors: PRODUCT_NOT_FOUND, INVENTORY_INSUFFICIENT (for negative qty if not allowing backorder)
```

#### `bulkAdjustInventory`

Batch stock adjustments (max 100).

```typescript
// Router: catalogRouter.bulkAdjustInventory
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  adjustments: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    type: z.enum(['purchase', 'sale', 'adjustment', 'return', 'transfer']),
    quantity: z.number().int(),
    reference: z.string().max(200).optional(),
    notes: z.string().max(1000).optional(),
  })).min(1).max(100),
});

// Output: { processed: number; movements: InventoryMovement[] }
```

#### `getStockReport`

Current stock snapshot for the venture.

```typescript
// Router: catalogRouter.getStockReport
// Auth: ventureProcedure
// Type: query

const input = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// Output: PaginatedResponse<{
//   productId: string;
//   name: string;
//   sku: string | null;
//   totalQuantity: number;
//   variantBreakdown: Array<{ variantId: string; name: string; quantity: number }>;
// }>
```

#### `getLowStockAlerts`

```typescript
// Router: catalogRouter.getLowStockAlerts
// Auth: ventureProcedure
// Type: query

// Output: Array<{ productId: string; name: string; currentQuantity: number; threshold: number; variantId?: string }>
```

### Collection Service

#### `createCollection`

```typescript
// Router: catalogRouter.createCollection
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(250).optional(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  type: z.enum(['manual', 'automated']),
  rules: z.object({
    conditions: z.array(z.object({
      field: z.enum(['tag', 'category', 'type', 'price_min', 'price_max', 'vendor']),
      operator: z.enum(['eq', 'neq', 'contains', 'gt', 'lt']),
      value: z.string(),
    })),
    match: z.enum(['all', 'any']),
  }).optional(),                           // Required for automated, null for manual
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

// Output: ProductCollection
```

#### `addProductsToCollection`

```typescript
// Router: catalogRouter.addProductsToCollection
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  collectionId: z.string().uuid(),
  productIds: z.array(z.string().uuid()).min(1).max(100),
});

// Output: { added: number }
// Errors: COLLECTION_NOT_FOUND
```

#### `evaluateCollectionRules`

Re-evaluate automated collection rules.

```typescript
// Router: catalogRouter.evaluateCollectionRules
// Auth: adminProcedure
// Type: mutation

const input = z.object({ collectionId: z.string().uuid() });

// Output: { added: number; removed: number; total: number }
// Events: catalog.collection.evaluated
```

---

## Cart API

Cart operations are handled through the catalog router or inline service calls.

#### `addToCart`

```typescript
// Service: addToCart(sessionId, input)

const input = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(999),
});

// Output: CartItem
// Side effects: Resolves current price, checks inventory
```

#### `updateCartItem`

```typescript
// Service: updateCartItem(sessionId, itemId, input)

const input = z.object({
  quantity: z.number().int().min(1).max(999),
});

// Output: CartItem
```

#### `removeFromCart`

```typescript
// Service: removeFromCart(sessionId, itemId)

// Output: { success: boolean }
```

#### `getCart`

```typescript
// Service: getCart(sessionId)

// Output
interface Cart {
  items: CartItem[];
  subtotal: number;          // cents
  discountAmount: number;    // cents
  discountCode: string | null;
  taxAmount: number;         // cents
  total: number;             // cents
  itemCount: number;
}

interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;         // cents (resolved from current pricing)
  lineTotal: number;         // cents
  imageUrl: string | null;
}
```

---

## Checkout API

#### `createCheckoutSession`

```typescript
// Router: paymentsRouter.createCheckoutSession
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  lineItems: z.array(z.object({
    priceId: z.string(),       // Stripe price ID
    quantity: z.number().int().min(1),
    description: z.string().optional(),
  })).min(1),
  mode: z.enum(['payment', 'subscription', 'setup']),
  customerId: z.string().uuid().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// Output: { id: string; url: string; stripeSessionId: string }
// Events: payments.checkout.created
// Errors: STRIPE_ACCOUNT_NOT_FOUND, STRIPE_CHARGES_DISABLED
```

#### `getCheckoutSession`

```typescript
// Router: paymentsRouter.getCheckoutSession
// Auth: ventureProcedure
// Type: query

const input = z.object({ id: z.string().uuid() });

// Output: CheckoutSession
```

#### `expireCheckoutSession`

```typescript
// Router: paymentsRouter.expireCheckoutSession
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });

// Output: CheckoutSession
// Errors: CHECKOUT_SESSION_COMPLETE
```

#### `createPaymentLink`

```typescript
// Router: paymentsRouter.createPaymentLink
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  lineItems: z.array(z.object({
    priceId: z.string(),
    quantity: z.number().int().min(1),
  })).min(1),
});

// Output: { id: string; url: string }
```

---

## Payments API

### Stripe Connect

#### `createConnectedAccount`

```typescript
// Router: paymentsRouter.createAccount
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  type: z.enum(['standard', 'express', 'custom']).default('express'),
  email: z.string().email(),
  country: z.string().length(2).default('US'),
  businessProfile: z.object({
    name: z.string().optional(),
    url: z.string().url().optional(),
    supportEmail: z.string().email().optional(),
  }).optional(),
});

// Output: StripeAccount
// Events: payments.account.created
```

#### `generateOnboardingLink`

```typescript
// Router: paymentsRouter.getOnboardingLink
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  refreshUrl: z.string().url(),
  returnUrl: z.string().url(),
});

// Output: { url: string }
```

#### `getAccount`

```typescript
// Router: paymentsRouter.getAccount
// Auth: ventureProcedure
// Type: query

// Output: StripeAccount | null
```

#### `getBalance`

```typescript
// Router: paymentsRouter.getBalance
// Auth: ventureProcedure
// Type: query

// Output: { available: number; pending: number; currency: string }
```

### Payment Products & Prices

#### `createPaymentProduct`

```typescript
// Router: paymentsRouter.createProduct
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['one_time', 'recurring', 'metered']),
  active: z.boolean().default(true),
  metadata: z.record(z.string()).optional(),
});

// Output: PaymentProduct
```

#### `createPrice`

```typescript
// Router: paymentsRouter.createPrice
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  productId: z.string().uuid(),
  amount: z.number().int().min(0),
  currency: z.string().length(3).default('usd'),
  type: z.enum(['one_time', 'recurring']),
  interval: z.enum(['day', 'week', 'month', 'year']).optional(),  // Required for recurring
  intervalCount: z.number().int().min(1).optional(),
  trialDays: z.number().int().min(0).optional(),
  active: z.boolean().default(true),
});

// Output: Price
```

### Customers

#### `createPaymentCustomer`

```typescript
// Router: paymentsRouter.createCustomer
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  email: z.string().email().optional(),
  name: z.string().max(200).optional(),
  contactId: z.string().uuid().optional(),    // Link to CRM contact
  metadata: z.record(z.string()).optional(),
});

// Output: PaymentCustomer
```

### Refunds

#### `createRefund`

```typescript
// Router: paymentsRouter.createRefund
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().int().min(1).optional(),    // Partial refund; omit for full
  reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer', 'other']).optional(),
  notes: z.string().max(1000).optional(),
});

// Output: Refund
// Events: payments.refund.created
// Errors: PAYMENT_NOT_FOUND, PAYMENT_ALREADY_REFUNDED, REFUND_AMOUNT_EXCEEDS_PAYMENT
```

### Disputes

#### `submitDisputeEvidence`

```typescript
// Router: paymentsRouter.submitDisputeEvidence
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  disputeId: z.string().uuid(),
  evidence: z.record(z.unknown()),
});

// Output: Dispute
// Errors: DISPUTE_EVIDENCE_DEADLINE_PASSED
```

### Payouts

#### `createPayout`

```typescript
// Router: paymentsRouter.createPayout
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  amount: z.number().int().min(1),
  currency: z.string().length(3).default('usd'),
  method: z.enum(['standard', 'instant']).default('standard'),
  description: z.string().max(200).optional(),
});

// Output: Payout
// Events: payments.payout.created
// Errors: PAYOUT_INSUFFICIENT_BALANCE
```

---

## Subscriptions API

#### `createSubscription`

```typescript
// Router: paymentsRouter.createSubscription
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  customerId: z.string().uuid(),
  priceId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
  trialDays: z.number().int().min(0).optional(),
  applicationFeePercent: z.number().min(0).max(100).optional(),
  metadata: z.record(z.string()).optional(),
});

// Output: Subscription
// Events: payments.subscription.created
// Errors: CUSTOMER_NOT_FOUND, PRICE_NOT_FOUND, STRIPE_ACCOUNT_NOT_ACTIVE
```

#### `updateSubscription`

Upgrade/downgrade plan or change quantity.

```typescript
// Router: paymentsRouter.updateSubscription
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  id: z.string().uuid(),
  priceId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).optional(),
});

// Output: Subscription
// Errors: SUBSCRIPTION_NOT_FOUND, SUBSCRIPTION_ALREADY_CANCELED
```

#### `cancelSubscription`

```typescript
// Router: paymentsRouter.cancelSubscription
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  id: z.string().uuid(),
  immediately: z.boolean().default(false),
  cancelAtPeriodEnd: z.boolean().default(true),
});

// Output: Subscription
// Events: payments.subscription.canceled
// Errors: SUBSCRIPTION_NOT_FOUND, SUBSCRIPTION_ALREADY_CANCELED
```

#### `pauseSubscription`

```typescript
// Router: paymentsRouter.pauseSubscription
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });

// Output: Subscription
// Errors: SUBSCRIPTION_NOT_FOUND, SUBSCRIPTION_ALREADY_PAUSED
```

#### `resumeSubscription`

```typescript
// Router: paymentsRouter.resumeSubscription
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });

// Output: Subscription
// Errors: SUBSCRIPTION_NOT_FOUND, SUBSCRIPTION_NOT_PAUSED
```

#### `getUpcomingInvoice`

Preview the next invoice for a subscription.

```typescript
// Router: paymentsRouter.getUpcomingInvoice
// Auth: ventureProcedure
// Type: query

const input = z.object({ subscriptionId: z.string().uuid() });

// Output: { subtotal: number; tax: number; total: number; nextPaymentDate: string }
```

#### `applySubscriptionDiscount`

```typescript
// Router: paymentsRouter.applyDiscount
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  subscriptionId: z.string().uuid(),
  couponId: z.string(),                // Stripe coupon ID
});

// Output: Subscription
```

---

## Invoicing API

### Invoice Templates

#### `createInvoiceTemplate`

```typescript
// Router: invoicingRouter.createTemplate
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  name: z.string().min(1).max(200),
  isDefault: z.boolean().default(false),
  headerHtml: z.string().max(10000).optional(),
  footerHtml: z.string().max(10000).optional(),
  logoUrl: z.string().url().optional(),
  colors: z.object({
    primary: z.string(),
    accent: z.string(),
    background: z.string().optional(),
    textColor: z.string().optional(),
  }).optional(),
  defaultPaymentTerms: z.number().int().min(0).default(30),
  defaultNotes: z.string().max(2000).optional(),
  taxConfig: z.object({
    enabled: z.boolean(),
    defaultRate: z.number().min(0).max(100),
    taxLabel: z.string().default('Sales Tax'),
    taxId: z.string().optional(),
    inclusive: z.boolean().default(false),
    compoundTax: z.boolean().default(false),
    additionalRates: z.array(z.object({
      label: z.string(),
      rate: z.number(),
      appliesToAll: z.boolean(),
    })).optional(),
  }).optional(),
  numberPrefix: z.string().max(10).default('INV'),
  nextNumber: z.number().int().min(1).default(1001),
});

// Output: InvoiceTemplate
```

### Invoices V2

#### `createInvoiceV2`

```typescript
// Router: invoicingRouter.createInvoice
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  contactId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  dueDate: z.date().optional(),
  lineItems: z.array(z.object({
    id: z.string(),
    description: z.string().min(1).max(500),
    quantity: z.number().min(0),
    unitPrice: z.number().int(),           // cents
    amount: z.number().int(),              // cents
    taxRate: z.number().min(0).max(100).optional(),
    taxAmount: z.number().int().optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    discountAmount: z.number().int().optional(),
    productId: z.string().uuid().optional(),
    sortOrder: z.number().int().min(0),
  })).min(1),
  notes: z.string().max(5000).optional(),
  terms: z.string().max(5000).optional(),
  billingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string().length(2),
  }).optional(),
  reminders: z.array(z.object({
    date: z.string(),
    sent: z.boolean().default(false),
    type: z.enum(['before_due', 'on_due', 'after_due']),
    dayOffset: z.number().int(),
  })).optional(),
  customFields: z.record(z.string()).optional(),
});

// Output: InvoiceV2 (with auto-generated number, calculated totals)
// Events: invoicing.invoice.created
```

#### `sendInvoiceV2`

Send invoice via email with payment link.

```typescript
// Router: invoicingRouter.sendInvoice
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });

// Output: InvoiceV2 (status updated to 'sent')
// Events: invoicing.invoice.sent
// Errors: INVOICE_NOT_FOUND, INVOICE_ALREADY_SENT
```

#### `recordPayment`

Record a manual payment against an invoice.

```typescript
// Router: invoicingRouter.recordPayment
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().int().min(1),       // cents
  method: z.enum(['card', 'bank_transfer', 'ach', 'cash', 'check']),
  reference: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

// Output: InvoiceV2 (with updated amountPaid, amountDue, status)
// Events: invoicing.invoice.paid or invoicing.invoice.partial_payment
// Errors: INVOICE_NOT_FOUND, INVOICE_ALREADY_PAID, INVOICE_PAYMENT_EXCEEDS_DUE
```

#### `applyCredit`

Apply a credit note to an invoice.

```typescript
// Router: invoicingRouter.applyCredit
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  invoiceId: z.string().uuid(),
  creditNoteId: z.string().uuid(),
});

// Output: InvoiceV2
// Events: invoicing.credit_note.applied
// Errors: CREDIT_NOTE_NOT_FOUND, CREDIT_NOTE_ALREADY_APPLIED, CREDIT_NOTE_EXCEEDS_INVOICE
```

#### `voidInvoiceV2`

```typescript
// Router: invoicingRouter.voidInvoice
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });

// Output: InvoiceV2
// Events: invoicing.invoice.voided
// Errors: INVOICE_NOT_FOUND, INVOICE_ALREADY_VOIDED, INVOICE_ALREADY_PAID
```

#### `getInvoiceSummary`

Dashboard stats for the venture.

```typescript
// Router: invoicingRouter.getInvoiceSummary
// Auth: ventureProcedure
// Type: query

// Output
interface InvoiceSummary {
  totalDraft: number;
  totalSent: number;
  totalOverdue: number;
  totalPaid: number;
  amountOutstanding: number;   // cents
  amountOverdue: number;       // cents
  amountPaidThisMonth: number; // cents
}
```

#### `getInvoiceHtml`

Rendered HTML for preview/PDF.

```typescript
// Router: invoicingRouter.getInvoiceHtml
// Auth: ventureProcedure
// Type: query

const input = z.object({ id: z.string().uuid() });

// Output: { html: string }
```

---

## Proposals API

#### `createProposal`

```typescript
// Router: invoicingRouter.createProposal
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  contactId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  content: z.array(z.object({
    id: z.string(),
    type: z.enum(['heading', 'paragraph', 'image', 'table', 'divider',
                   'pricing', 'terms', 'signature', 'video', 'testimonial']),
    content: z.string(),
    metadata: z.record(z.unknown()).optional(),
    sortOrder: z.number().int().min(0),
  })),
  lineItems: z.array(z.object({
    id: z.string(),
    description: z.string().min(1).max(500),
    quantity: z.number().min(0),
    unitPrice: z.number().int(),
    amount: z.number().int(),
    sortOrder: z.number().int().min(0),
  })).min(1),
  validUntil: z.date().optional(),
  coverImageUrl: z.string().url().optional(),
  customFields: z.record(z.string()).optional(),
});

// Output: Proposal
// Events: invoicing.proposal.created
```

#### `sendProposal`

```typescript
// Router: invoicingRouter.sendProposal
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });

// Output: Proposal (status → 'sent')
// Events: invoicing.proposal.sent
```

#### `acceptProposal`

Client accepts with e-signature.

```typescript
// Router: invoicingRouter.acceptProposal
// Auth: ventureProcedure
// Type: mutation

const input = z.object({
  id: z.string().uuid(),
  signatureUrl: z.string().url(),
  signatureIp: z.string().optional(),
});

// Output: Proposal (status → 'accepted')
// Events: invoicing.proposal.accepted
// Errors: PROPOSAL_NOT_FOUND, PROPOSAL_NOT_SENT, PROPOSAL_EXPIRED,
//         PROPOSAL_ALREADY_ACCEPTED, PROPOSAL_ALREADY_DECLINED
```

#### `declineProposal`

```typescript
// Router: invoicingRouter.declineProposal
// Auth: ventureProcedure
// Type: mutation

const input = z.object({
  id: z.string().uuid(),
  reason: z.string().max(1000).optional(),
});

// Output: Proposal (status → 'declined')
// Events: invoicing.proposal.declined
```

#### `convertProposalToInvoice`

Convert accepted proposal into an invoice.

```typescript
// Router: invoicingRouter.convertProposalToInvoice
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });

// Output: InvoiceV2 (created from proposal line items)
// Events: invoicing.proposal.converted
// Errors: PROPOSAL_NOT_FOUND, PROPOSAL_NOT_SENT (must be accepted)
```

---

## Estimates API

#### `createEstimate`

```typescript
// Router: invoicingRouter.createEstimate
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  contactId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  lineItems: z.array(z.object({
    id: z.string(),
    description: z.string().min(1).max(500),
    quantity: z.number().min(0),
    unitPrice: z.number().int(),
    amount: z.number().int(),
    taxRate: z.number().optional(),
    taxAmount: z.number().int().optional(),
    sortOrder: z.number().int().min(0),
  })).min(1),
  validUntil: z.date().optional(),
  notes: z.string().max(5000).optional(),
  terms: z.string().max(5000).optional(),
  customFields: z.record(z.string()).optional(),
});

// Output: Estimate (with currentVersion: 1)
// Events: invoicing.estimate.created
```

#### `convertEstimateToInvoice`

Convert with progress invoicing (milestone-based billing).

```typescript
// Router: invoicingRouter.convertEstimateToInvoice
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  id: z.string().uuid(),
  milestonePercent: z.number().min(1).max(100),
  milestoneName: z.string().min(1).max(200),
});

// Output: InvoiceV2 (for the specified percentage of the estimate total)
// Events: invoicing.estimate.converted
// Errors: ESTIMATE_NOT_FOUND, ESTIMATE_NOT_ACCEPTED, ESTIMATE_FULLY_INVOICED
```

**Example:**

```typescript
// Estimate total: $20,000
const invoice1 = await trpc.invoicing.convertEstimateToInvoice.mutate({
  id: estimateId,
  milestonePercent: 30,
  milestoneName: 'Design Phase Complete',
});
// Creates invoice for $6,000 (30% of $20,000)

const invoice2 = await trpc.invoicing.convertEstimateToInvoice.mutate({
  id: estimateId,
  milestonePercent: 40,
  milestoneName: 'Development Complete',
});
// Creates invoice for $8,000 (40% of $20,000)
// Remaining 30% ($6,000) available for final milestone
```

#### `acceptEstimate`

```typescript
// Router: invoicingRouter.acceptEstimate
// Auth: ventureProcedure
// Type: mutation

const input = z.object({
  id: z.string().uuid(),
  signatureUrl: z.string().url(),
  signatureIp: z.string().optional(),
});

// Output: Estimate (status → 'accepted')
// Events: invoicing.estimate.accepted
```

---

## Recurring Invoices API

#### `createRecurringInvoice`

```typescript
// Router: invoicingRouter.createRecurring
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  contactId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  templateConfig: z.object({
    lineItems: z.array(z.object({
      id: z.string(),
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number().int(),
      amount: z.number().int(),
      sortOrder: z.number().int(),
    })),
    currency: z.string().length(3).default('usd'),
    paymentTermsDays: z.number().int().min(0).default(30),
    notes: z.string().optional(),
    terms: z.string().optional(),
    taxConfig: z.object({
      enabled: z.boolean(),
      defaultRate: z.number(),
      taxLabel: z.string(),
      inclusive: z.boolean().default(false),
    }).optional(),
  }),
  interval: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'semiannually', 'yearly']),
  dayOfMonth: z.number().int().min(1).max(28).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  autoSend: z.boolean().default(true),
});

// Output: RecurringInvoice
// Events: invoicing.recurring.created
```

#### `pauseRecurringInvoice`

```typescript
// Router: invoicingRouter.pauseRecurring
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });

// Output: RecurringInvoice (status → 'paused')
// Events: invoicing.recurring.paused
```

#### `cancelRecurringInvoice`

```typescript
// Router: invoicingRouter.cancelRecurring
// Auth: adminProcedure
// Type: mutation

const input = z.object({ id: z.string().uuid() });

// Output: RecurringInvoice (status → 'cancelled')
// Events: invoicing.recurring.cancelled
// Errors: RECURRING_NOT_FOUND, RECURRING_ALREADY_CANCELLED
```

---

## Tax API

#### `createTaxCategory`

```typescript
// Router: catalogRouter.createTaxCategory
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  defaultRate: z.number().min(0).max(100),   // Percentage
  isDefault: z.boolean().default(false),
});

// Output: TaxCategory
```

#### `createTaxRate`

```typescript
// Router: catalogRouter.createTaxRate
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  taxCategoryId: z.string().uuid(),
  country: z.string().length(2),
  state: z.string().max(10).optional(),
  postalCode: z.string().max(20).optional(),
  rate: z.number().min(0).max(100),          // Percentage
  name: z.string().min(1).max(200),
  isCompound: z.boolean().default(false),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

// Output: CatalogTaxRate
// Errors: TAX_CATEGORY_NOT_FOUND
```

#### `listTaxRates`

```typescript
// Router: catalogRouter.listTaxRates
// Auth: ventureProcedure
// Type: query

const input = z.object({
  taxCategoryId: z.string().uuid().optional(),
  country: z.string().length(2).optional(),
  state: z.string().max(10).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// Output: PaginatedResponse<CatalogTaxRate>
```

---

## Wholesale / Price Rules API

#### `createPriceRule`

```typescript
// Router: catalogRouter.createPriceRule
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.enum(['volume', 'tiered', 'customer_group', 'time_limited']),
  config: z.object({
    minQuantity: z.number().int().min(0).optional(),
    maxQuantity: z.number().int().min(0).optional(),
    price: z.number().int().min(0).optional(),
    discountPercent: z.number().min(0).max(100).optional(),
    customerGroupId: z.string().uuid().optional(),
    tiers: z.array(z.object({
      minQty: z.number().int().min(0),
      maxQty: z.number().int().min(0),
      price: z.number().int().min(0),
    })).optional(),
  }),
  priority: z.number().int().min(0).default(0),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true),
});

// Output: PriceRule
```

#### `calculateEffectivePrice`

Resolve the final price considering all applicable rules.

```typescript
// Router: catalogRouter.calculateEffectivePrice
// Auth: ventureProcedure
// Type: query

const input = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
  customerGroupId: z.string().uuid().optional(),
});

// Output
interface EffectivePriceResult {
  basePrice: number;         // Original price in cents
  effectivePrice: number;    // Final price per unit in cents
  appliedRule: string | null;// Name of the winning rule
  savings: number;           // Savings per unit in cents
  savingsPercent: number;    // Savings as percentage
}
```

---

## Approval Workflows API

#### `createApprovalWorkflow`

```typescript
// Router: invoicingRouter.createApprovalWorkflow
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  name: z.string().min(1).max(200),
  entityType: z.enum(['invoice', 'proposal', 'estimate', 'credit_note', 'discount']),
  rules: z.array(z.object({
    step: z.number().int().min(1),
    approverRoleId: z.string().uuid().optional(),
    approverUserId: z.string().uuid().optional(),
    condition: z.object({
      field: z.string(),
      operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
      value: z.number(),
    }).optional(),
    autoApproveBelow: z.number().int().min(0).optional(),
  })).min(1),
  isActive: z.boolean().default(true),
});

// Output: ApprovalWorkflow
```

#### `submitForApproval`

```typescript
// Router: invoicingRouter.submitForApproval
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  entityType: z.enum(['invoice', 'proposal', 'estimate', 'credit_note', 'discount']),
  entityId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

// Output: ApprovalRequest
// Events: invoicing.approval.submitted
```

#### `makeApprovalDecision`

```typescript
// Router: invoicingRouter.makeApprovalDecision
// Auth: adminProcedure
// Type: mutation

const input = z.object({
  approvalRequestId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected', 'changes_requested']),
  reason: z.string().max(1000).optional(),
});

// Output: ApprovalRequest (with updated status and current step)
// Events: invoicing.approval.decided, invoicing.approval.completed (if all steps done)
// Errors: APPROVAL_NOT_PENDING, APPROVAL_UNAUTHORIZED
```

#### `getMyPendingApprovals`

```typescript
// Router: invoicingRouter.getMyPendingApprovals
// Auth: ventureProcedure
// Type: query

const input = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// Output: PaginatedResponse<ApprovalRequest>
```

---

## Platform Fees API

#### `updatePlatformFeeConfig`

```typescript
// Router: invoicingRouter.updatePlatformFeeConfig
// Auth: superAdminProcedure
// Type: mutation

const input = z.object({
  ventureId: z.string().uuid(),
  feeType: z.enum(['percentage', 'flat', 'tiered']),
  feePercent: z.number().min(0).max(100).optional(),
  flatFeeCents: z.number().int().min(0).optional(),
  tieredConfig: z.object({
    tiers: z.array(z.object({
      upTo: z.number().int().min(0),
      feePercent: z.number().min(0).max(100),
    })),
    resetPeriod: z.enum(['monthly', 'quarterly', 'yearly']),
  }).optional(),
  invoiceFeePercent: z.number().min(0).max(100).optional(),
  proposalConversionFee: z.number().int().min(0).optional(),
  cappedAt: z.number().int().min(0).nullable().optional(),
  minimumFee: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
  effectiveFrom: z.date(),
  effectiveUntil: z.date().optional(),
  notes: z.string().max(1000).optional(),
});

// Output: PlatformFeeConfig
// Events: payments.fee.updated
```

#### `getPlatformRevenueReport`

```typescript
// Router: invoicingRouter.getPlatformRevenueReport
// Auth: superAdminProcedure
// Type: query

const input = z.object({
  from: z.date(),
  to: z.date(),
});

// Output
interface PlatformRevenueReport {
  totalFees: number;          // cents
  totalTransactions: number;
  avgFeePercent: number;
  byVenture: Array<{
    ventureId: string;
    feesCollected: number;
    transactionVolume: number;
  }>;
}
```

---

## Revenue Reporting API

#### `getMrr`

```typescript
// Router: paymentsRouter.getMrr
// Auth: ventureProcedure
// Type: query

// Output: { mrr: number; currency: string; activeSubscriptions: number }
```

#### `getArr`

```typescript
// Router: paymentsRouter.getArr
// Auth: ventureProcedure
// Type: query

// Output: { arr: number; currency: string }
```

#### `getChurnRate`

```typescript
// Router: paymentsRouter.getChurnRate
// Auth: ventureProcedure
// Type: query

const input = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
});

// Output: { rate: number; churned: number; total: number; period: string }
```

#### `getLtv`

```typescript
// Router: paymentsRouter.getLtv
// Auth: ventureProcedure
// Type: query

// Output: { ltv: number; avgLifetimeMonths: number; avgMonthlyRevenue: number }
```

#### `getRevenueTimeline`

```typescript
// Router: paymentsRouter.getRevenueTimeline
// Auth: ventureProcedure
// Type: query

const input = z.object({
  from: z.date(),
  to: z.date(),
  granularity: z.enum(['day', 'week', 'month']).default('month'),
});

// Output: Array<{ period: string; revenue: number }>
```

#### `getRevenueByProduct`

```typescript
// Router: paymentsRouter.getRevenueByProduct
// Auth: ventureProcedure
// Type: query

const input = z.object({
  from: z.date(),
  to: z.date(),
});

// Output: Array<{ productId: string; name: string; revenue: number; units: number }>
```

#### `getPaymentMethodBreakdown`

```typescript
// Router: paymentsRouter.getPaymentMethodBreakdown
// Auth: ventureProcedure
// Type: query

// Output: { card: number; bank_transfer: number; ach: number } // percentages
```

#### `getOutstandingInvoices`

```typescript
// Router: paymentsRouter.getOutstandingInvoices
// Auth: ventureProcedure
// Type: query

// Output: { totalOutstanding: number; totalOverdue: number; count: number; currency: string }
```

---

## Type Definitions

### Core Types Summary

| Type | Module | Description |
|---|---|---|
| `Product` | Catalog | Full product record (33 fields) |
| `ProductVariant` | Catalog | Size/color variant with pricing |
| `ProductCategory` | Catalog | Tree category with materialized path |
| `ProductCollection` | Catalog | Manual or automated product group |
| `DiscountCode` | Catalog | Discount code with rules |
| `PriceRule` | Catalog | Volume/tiered/group pricing rule |
| `InventoryMovement` | Catalog | Stock change record |
| `TaxCategory` | Tax | Tax group configuration |
| `CatalogTaxRate` | Tax | Jurisdiction-specific tax rate |
| `StripeAccount` | Payments | Stripe Connected Account |
| `PaymentProduct` | Payments | Stripe product |
| `Price` | Payments | Stripe price (one-time or recurring) |
| `PaymentCustomer` | Payments | Customer linked to Stripe |
| `Subscription` | Payments | Recurring billing subscription |
| `Payment` | Payments | Payment transaction record |
| `Refund` | Payments | Refund record |
| `Dispute` | Payments | Dispute record |
| `Payout` | Payments | Payout to venture bank |
| `CheckoutSession` | Checkout | Stripe Checkout Session |
| `PaymentLink` | Checkout | Reusable payment link |
| `InvoiceTemplate` | Invoicing | Branded invoice template |
| `InvoiceV2` | Invoicing | Advanced invoice with lifecycle |
| `InvoiceV2LineItem` | Invoicing | Line item for invoices/proposals/estimates |
| `Proposal` | Invoicing | Rich proposal with e-signature |
| `Estimate` | Invoicing | Versioned estimate with progress invoicing |
| `RecurringInvoice` | Invoicing | Scheduled invoice generation |
| `CreditNote` | Invoicing | Credit against an invoice |
| `PlatformFeeConfig` | Fees | Per-venture fee configuration |
| `ApprovalWorkflow` | Approvals | Multi-step approval chain |
| `ApprovalRequest` | Approvals | Active approval request |
| `ApprovalDecision` | Approvals | Individual step decision |

---

## Zod Schemas

All input schemas are defined using Zod and exported for client-side reuse:

```typescript
// Import schemas for client-side validation
import {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  createDiscountSchema,
  validateDiscountCodeSchema,
  recordInventoryMovementSchema,
  createCheckoutSessionSchema,
  createSubscriptionSchema,
  createInvoiceV2Schema,
  createProposalSchema,
  createEstimateSchema,
  createRecurringInvoiceSchema,
  createTaxCategorySchema,
  createTaxRateSchema,
  createPriceRuleSchema,
  createApprovalWorkflowSchema,
  updatePlatformFeeConfigSchema,
} from '@mcv/commerce/schemas';
```

### Schema Conventions

- All ID fields use `z.string().uuid()`
- All monetary amounts use `z.number().int().min(0)` (cents)
- All string lengths have explicit `.max()` limits
- All enums use `z.enum([...])` with literal values
- Optional fields use `.optional()` or `.nullable()`
- Arrays with limits use `.min(N).max(M)`
- Dates use `z.date()` (ISO 8601 string on the wire)

---

## Events

### Event Format

All commerce events follow a consistent structure:

```typescript
interface CommerceEvent {
  type: string;              // e.g. 'catalog.product.created'
  ventureId: string;         // Tenant context
  timestamp: string;         // ISO 8601
  userId: string | null;     // Actor
  data: Record<string, unknown>; // Event-specific payload
}
```

### Event Categories

| Prefix | Count | Scope |
|---|---|---|
| `catalog.*` | 16 | Product, category, discount, inventory, collection events |
| `payments.*` | 17 | Account, checkout, payment, refund, dispute, subscription, fee events |
| `invoicing.*` | 21 | Invoice, proposal, estimate, recurring, credit note, approval events |

### Key Events for Downstream Consumption

| Event | Consumer | Action |
|---|---|---|
| `payments.payment.succeeded` | @mcv/analytics | Update revenue metrics |
| `payments.subscription.created` | @mcv/engagement | Send welcome sequence |
| `payments.subscription.canceled` | @mcv/engagement | Trigger churn prevention |
| `invoicing.invoice.overdue` | @mcv/engagement | Send overdue reminders |
| `invoicing.proposal.accepted` | @mcv/analytics | Track conversion rate |
| `catalog.inventory.low_stock` | @mcv/engagement | Alert inventory manager |

---

## Error Codes

### Catalog Errors

| Code | HTTP | Description |
|---|---|---|
| `PRODUCT_NOT_FOUND` | 404 | Product does not exist or not in this venture |
| `PRODUCT_SLUG_EXISTS` | 409 | Product slug already taken |
| `PRODUCT_SKU_EXISTS` | 409 | Product SKU already exists |
| `PRODUCT_ARCHIVED` | 400 | Cannot modify archived product |
| `CATEGORY_NOT_FOUND` | 404 | Category does not exist |
| `CATEGORY_CIRCULAR_REF` | 400 | Would create circular reference |
| `CATEGORY_HAS_CHILDREN` | 400 | Cannot delete with children |
| `DISCOUNT_NOT_FOUND` | 404 | Discount code not found |
| `DISCOUNT_CODE_EXISTS` | 409 | Code already taken |
| `DISCOUNT_EXPIRED` | 400 | Past end date |
| `DISCOUNT_NOT_ACTIVE` | 400 | Deactivated |
| `DISCOUNT_USAGE_EXCEEDED` | 400 | Usage limit reached |
| `DISCOUNT_PER_CUSTOMER_EXCEEDED` | 400 | Per-customer limit reached |
| `DISCOUNT_MINIMUM_NOT_MET` | 400 | Cart below minimum |
| `DISCOUNT_NOT_APPLICABLE` | 400 | Products/categories don't match |
| `INVENTORY_INSUFFICIENT` | 400 | Not enough stock |
| `PRICE_RULE_NOT_FOUND` | 404 | Price rule not found |
| `COLLECTION_NOT_FOUND` | 404 | Collection not found |
| `TAX_CATEGORY_NOT_FOUND` | 404 | Tax category not found |
| `TAX_RATE_NOT_FOUND` | 404 | Tax rate not found |

### Payment Errors

| Code | HTTP | Description |
|---|---|---|
| `STRIPE_ACCOUNT_NOT_FOUND` | 404 | No Stripe account for venture |
| `STRIPE_ACCOUNT_NOT_ACTIVE` | 400 | Account not yet activated |
| `STRIPE_CHARGES_DISABLED` | 400 | Charges not enabled |
| `STRIPE_PAYOUTS_DISABLED` | 400 | Payouts not enabled |
| `STRIPE_ONBOARDING_INCOMPLETE` | 400 | Onboarding not finished |
| `PAYMENT_NOT_FOUND` | 404 | Payment not found |
| `PAYMENT_ALREADY_REFUNDED` | 400 | Already fully refunded |
| `REFUND_AMOUNT_EXCEEDS_PAYMENT` | 400 | Refund > remaining refundable |
| `CHECKOUT_SESSION_EXPIRED` | 400 | Session expired |
| `CHECKOUT_SESSION_COMPLETE` | 400 | Cannot modify completed session |
| `SUBSCRIPTION_NOT_FOUND` | 404 | Subscription not found |
| `SUBSCRIPTION_ALREADY_CANCELED` | 400 | Already canceled |
| `SUBSCRIPTION_ALREADY_PAUSED` | 400 | Already paused |
| `SUBSCRIPTION_NOT_PAUSED` | 400 | Cannot resume non-paused |
| `CUSTOMER_NOT_FOUND` | 404 | Customer not found |
| `PRICE_NOT_FOUND` | 404 | Price not found |
| `PAYOUT_INSUFFICIENT_BALANCE` | 400 | Insufficient balance |
| `DISPUTE_EVIDENCE_DEADLINE_PASSED` | 400 | Evidence deadline passed |

### Invoicing Errors

| Code | HTTP | Description |
|---|---|---|
| `INVOICE_NOT_FOUND` | 404 | Invoice not found |
| `INVOICE_NOT_DRAFT` | 400 | Can only edit draft invoices |
| `INVOICE_ALREADY_SENT` | 400 | Already sent |
| `INVOICE_ALREADY_PAID` | 400 | Already fully paid |
| `INVOICE_ALREADY_VOIDED` | 400 | Already voided |
| `INVOICE_PAYMENT_EXCEEDS_DUE` | 400 | Payment > amount due |
| `TEMPLATE_NOT_FOUND` | 404 | Template not found |
| `PROPOSAL_NOT_FOUND` | 404 | Proposal not found |
| `PROPOSAL_NOT_SENT` | 400 | Cannot accept/decline unsent |
| `PROPOSAL_ALREADY_ACCEPTED` | 400 | Already accepted |
| `PROPOSAL_ALREADY_DECLINED` | 400 | Already declined |
| `PROPOSAL_EXPIRED` | 400 | Past validity date |
| `ESTIMATE_NOT_FOUND` | 404 | Estimate not found |
| `ESTIMATE_NOT_ACCEPTED` | 400 | Cannot convert unaccepted |
| `ESTIMATE_FULLY_INVOICED` | 400 | All milestones invoiced |
| `RECURRING_NOT_FOUND` | 404 | Recurring invoice not found |
| `RECURRING_ALREADY_CANCELLED` | 400 | Already cancelled |
| `CREDIT_NOTE_NOT_FOUND` | 404 | Credit note not found |
| `CREDIT_NOTE_EXCEEDS_INVOICE` | 400 | Credit > invoice total |
| `CREDIT_NOTE_ALREADY_APPLIED` | 400 | Already applied |
| `APPROVAL_WORKFLOW_NOT_FOUND` | 404 | Workflow not found |
| `APPROVAL_NOT_PENDING` | 400 | No pending approval at step |
| `APPROVAL_UNAUTHORIZED` | 403 | Not authorized for this step |
| `PLATFORM_FEE_CONFIG_NOT_FOUND` | 404 | No fee config for venture |

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | **Yes** | — | Stripe platform secret key |
| `STRIPE_WEBHOOK_SECRET` | **Yes** | — | Stripe webhook endpoint secret |
| `STRIPE_PUBLISHABLE_KEY` | **Yes** | — | Client-side Stripe key |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `STRIPE_API_VERSION` | No | `2024-12-18.acacia` | Stripe API version |
| `STRIPE_CONNECT_DEFAULT_FEE` | No | `2.50` | Default platform fee % |
| `COMMERCE_DEFAULT_CURRENCY` | No | `usd` | Default currency |
| `COMMERCE_DEFAULT_TAX_RATE` | No | `0` | Default tax rate % |
| `COMMERCE_MAX_CART_ITEMS` | No | `100` | Max cart items |
| `COMMERCE_CART_TTL_HOURS` | No | `72` | Cart expiry hours |
| `COMMERCE_CHECKOUT_EXPIRY_HOURS` | No | `24` | Checkout expiry hours |
| `COMMERCE_LOW_STOCK_THRESHOLD` | No | `5` | Default low stock level |
| `COMMERCE_MAX_BULK_OPERATIONS` | No | `100` | Max batch size |
| `INVOICE_NUMBER_PREFIX` | No | `INV` | Invoice number prefix |
| `INVOICE_DEFAULT_PAYMENT_TERMS` | No | `30` | Days until due |
| `INVOICE_REMINDER_ENABLED` | No | `true` | Enable reminders |
| `PROPOSAL_DEFAULT_VALIDITY_DAYS` | No | `30` | Proposal validity days |
| `ESTIMATE_DEFAULT_VALIDITY_DAYS` | No | `30` | Estimate validity days |
| `RECURRING_INVOICE_CRON` | No | `0 6 * * *` | Recurring processing schedule |
| `OVERDUE_DETECTION_CRON` | No | `0 8 * * *` | Overdue detection schedule |

---

*@mcv/commerce — Commerce Platform Domain*
