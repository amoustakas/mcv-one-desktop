# @mcv/commerce-sdk

Commerce & Financial OS primitives — **17 services**, one optional
top-level bundle, zero module-level singletons. DI factories all the way
down: caller injects a Supabase client (or `null` for a degraded
no-persistence mode) and any required adapters.

```
src/
├── types.ts                     # Canonical types — Product, Order, Cart, Subscription, …
├── surface-types.ts             # UI/API-shaped projections (CartSession, CartItem, …)
├── product-service.ts           # CRUD + variants + pricing
├── customer-service.ts          # Customer profiles, segments, lifetime value
├── inventory-manager.ts         # Stock levels, reservations, restocks
├── discount-engine.ts           # Coupons, promotions, tiered discounts
├── search-engine.ts             # Faceted search with analytics instrumentation
├── wishlist-service.ts          # Saved-for-later
├── review-service.ts            # Product reviews + ratings
├── notification-service.ts      # Order / shipping / promo notifications
├── digital-delivery-service.ts  # License keys, downloadable goods
├── commerce-analytics.ts        # Conversion funnels, AOV, top products
├── cart-service.ts              # Cart + items + tax — needs TaxAdapter, ProductAdapter
├── checkout-service.ts          # Orchestration — needs Ledger, Payments, Cart, Product adapters
├── subscription-engine.ts       # Lifecycle + proration + usage metering — needs LedgerAdapter
├── invoice-engine.ts            # Invoice + line items + payment terms — needs LedgerAdapter
├── loan-engine.ts               # BNPL + amortization — needs LedgerAdapter
├── fulfillment-service.ts       # Pick / pack / ship + restock — needs Ledger + Inventory adapters
├── gift-card-service.ts         # Issue / redeem / refund — needs Ledger + Credit adapters
└── create-commerce-engine.ts    # Top-level bundle factory
```

## Two ways to compose

### 1. Top-level bundle — `createCommerceEngine({...})`

Recommended for venture apps using the full MCV SDK stack. One options
object → all 17 services wired:

```ts
import { createCommerceEngine } from '@mcv/commerce-sdk';
import { createLedgerService } from '@mcv/ledger-sdk';
import { createPaymentRouter } from '@mcv/payments-sdk';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabase = createSupabaseAdmin();
const ledger = createLedgerService({ supabase });   // satisfies LedgerAdapter
const payments = createPaymentRouter({ supabase }); // satisfies PaymentRouterAdapter

const commerce = createCommerceEngine({
  supabase,
  ledger,
  payments,
  tax: yourTaxAdapter,
  cartProduct: yourCartProductAdapter,
  cart: yourCartAdapter,
  checkoutProduct: yourCheckoutProductAdapter,
  inventory: yourInventoryAdapter,
  credit: yourCreditAdapter,
});

await commerce.product.list({ ventureId });
await commerce.checkout?.checkout(cartId);
await commerce.subscription?.createSubscription({...});
```

Adapter-requiring services are typed as optional on the returned
`CommerceEngine` — they're only present when their adapters are supplied.

### 2. Subpath imports — pick what you need

Recommended when you only need part of the SDK, want maximum
tree-shaking, or are integrating into a non-MCV stack:

```ts
import { createProductService } from '@mcv/commerce-sdk/product-service';
import { createCartService } from '@mcv/commerce-sdk/cart-service';
import { createSubscriptionEngine } from '@mcv/commerce-sdk/subscription-engine';
```

> **Why subpaths exist:** Several services (`fulfillment-service`,
> `gift-card-service`, `invoice-engine`, `loan-engine`,
> `subscription-engine`, `cart-service`, `checkout-service`) declare or
> re-export adapter interfaces. Exposing them all at the root barrel
> would cause name collisions (notably with `@mcv/payments-sdk`'s
> `LedgerAdapter`). Subpath-only exports keep adapter names scoped to
> the consumer that actually uses them.

## Service matrix

| # | Service | Factory | Subpath | Required adapters |
|---|---------|---------|---------|-------------------|
| 1 | ProductService          | `createProductService`         | `/product-service`         | — |
| 2 | CustomerService         | `createCustomerService`        | (root)                     | — |
| 3 | InventoryManager        | `createInventoryManager`       | (root)                     | — |
| 4 | DiscountEngine          | `createDiscountEngine`         | (root)                     | — |
| 5 | SearchEngine            | `createSearchEngine`           | (root)                     | — |
| 6 | WishlistService         | `createWishlistService`        | (root)                     | — |
| 7 | ReviewService           | `createReviewService`          | (root)                     | — |
| 8 | NotificationService     | `createNotificationService`    | (root)                     | — |
| 9 | DigitalDeliveryService  | `createDigitalDeliveryService` | (root)                     | — |
| 10 | CommerceAnalytics      | `createCommerceAnalytics`      | (root)                     | — |
| 11 | CartService            | `createCartService`            | `/cart-service`            | TaxAdapter, ProductAdapter |
| 12 | SubscriptionEngine     | `createSubscriptionEngine`     | `/subscription-engine`     | LedgerAdapter |
| 13 | InvoiceEngine          | `createInvoiceEngine`          | `/invoice-engine`          | LedgerAdapter |
| 14 | LoanEngine             | `createLoanEngine`             | `/loan-engine`             | LedgerAdapter |
| 15 | FulfillmentService     | `createFulfillmentService`     | `/fulfillment-service`     | LedgerAdapter, InventoryAdapter |
| 16 | GiftCardService        | `createGiftCardService`        | `/gift-card-service`       | LedgerAdapter, CreditAdapter |
| 17 | CheckoutService        | `createCheckoutService`        | `/checkout-service`        | LedgerAdapter, PaymentRouterAdapter, CartAdapter, ProductAdapter |

## Adapter contracts

Adapters are deliberately **narrow projections** — each service declares
the minimum shape it needs, so adapters are trivial to mock and unrelated
changes never ripple across services.

| Adapter | Defined in | Satisfied by |
|---------|------------|--------------|
| `LedgerAdapter`       | [@mcv/ledger-sdk/adapter](../ledger-sdk/src/adapter.ts) | `LedgerService` from `@mcv/ledger-sdk` |
| `PaymentRouterAdapter`| `./checkout-service`                                   | `PaymentRouter` from `@mcv/payments-sdk` |
| `CartAdapter`         | `./checkout-service`                                   | `CartService` (subset of methods) |
| `ProductAdapter` (cart)     | `./cart-service`     | `ProductService` (subset)         |
| `ProductAdapter` (checkout) | `./checkout-service` | `ProductService` (subset + name)  |
| `TaxAdapter`          | `./cart-service`        | Custom — Avalara, TaxJar, Stripe Tax, etc. |
| `InventoryAdapter`    | `./fulfillment-service` | `InventoryManager` (subset) |
| `CreditAdapter`       | `./gift-card-service`   | Custom — typically a wallet/loyalty service |

The shared `LedgerAdapter` lives in `@mcv/ledger-sdk` and is re-exported
from each commerce-sdk subpath that uses it (so existing imports like
`import type { LedgerAdapter } from '@mcv/commerce-sdk/subscription-engine'`
keep working).

## Versioning

```ts
import { MCV_COMMERCE_SDK_VERSION } from '@mcv/commerce-sdk';
```

- `0.19.0` — Top-level `createCommerceEngine` bundle factory; shared `LedgerAdapter` consolidated into `@mcv/ledger-sdk`.
- `0.18.0` — CheckoutService extracted with 4 adapters.
- `0.17.0` — CartService extracted with TaxAdapter + ProductAdapter.
- `0.16.0` — SubscriptionEngine DI factory.

## Peer dependencies

- `@supabase/supabase-js` ^2.0.0
- `@mcv/ledger-sdk` (workspace) — for the shared `LedgerAdapter` contract
