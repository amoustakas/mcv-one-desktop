// @mcv/commerce-sdk/create-commerce-engine — top-level bundle factory.
//
// One options object → all 17 commerce services, wired and ready. Drop-in
// for venture apps using the full MCV SDK stack: pass a single
// LedgerService (which structurally satisfies LedgerAdapter) and the
// other adapters once; get back every service in one composed object.
//
// For partial usage (e.g. only product + cart, no checkout), prefer the
// individual subpath factories: `@mcv/commerce-sdk/product-service`,
// `@mcv/commerce-sdk/cart-service`, etc. — see README.
//
// Adapter requirements:
//   - product, customer, inventory, discount, search, wishlist, review,
//     notification, digitalDelivery, analytics → just supabase
//   - cart      → tax + cartProduct
//   - subscription, invoice, loan → ledger
//   - fulfillment → ledger + inventory adapter
//   - giftCard    → ledger + credit adapter
//   - checkout    → ledger + payments + cart adapter + checkoutProduct adapter
//
// Adapter-requiring services are present on the returned object only when
// their adapters are supplied. TypeScript marks them optional.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { LedgerAdapter } from '@mcv/ledger-sdk';

import { createProductService, type ProductService } from './product-service';
import { createCustomerService, type CustomerService } from './customer-service';
import { createInventoryManager, type InventoryManager } from './inventory-manager';
import { createDiscountEngine, type DiscountEngine } from './discount-engine';
import { createSearchEngine, type SearchEngine } from './search-engine';
import { createWishlistService, type WishlistService } from './wishlist-service';
import { createReviewService, type ReviewService } from './review-service';
import { createNotificationService, type NotificationService } from './notification-service';
import { createDigitalDeliveryService, type DigitalDeliveryService } from './digital-delivery-service';
import { createCommerceAnalytics, type CommerceAnalyticsEngine } from './commerce-analytics';

import {
  createCartService,
  type CartService,
  type TaxAdapter,
  type ProductAdapter as CartProductAdapter,
} from './cart-service';
import { createSubscriptionEngine, type SubscriptionEngine } from './subscription-engine';
import { createInvoiceEngine, type InvoiceEngine } from './invoice-engine';
import { createLoanEngine, type LoanEngine } from './loan-engine';
import {
  createFulfillmentService,
  type FulfillmentService,
  type InventoryAdapter,
} from './fulfillment-service';
import {
  createGiftCardService,
  type GiftCardService,
  type CreditAdapter,
} from './gift-card-service';
import {
  createCheckoutService,
  type CheckoutService,
  type PaymentRouterAdapter,
  type CartAdapter,
  type ProductAdapter as CheckoutProductAdapter,
} from './checkout-service';

export interface CommerceEngineOpts {
  supabase: SupabaseClient | null;

  // Required for: subscription, invoice, loan, fulfillment, giftCard, checkout
  ledger?: LedgerAdapter;

  // Required for: checkout
  payments?: PaymentRouterAdapter;

  // Required for: cart
  tax?: TaxAdapter;
  cartProduct?: CartProductAdapter;

  // Required for: checkout (in addition to ledger + payments)
  cart?: CartAdapter;
  checkoutProduct?: CheckoutProductAdapter;

  // Required for: fulfillment
  inventory?: InventoryAdapter;

  // Required for: giftCard
  credit?: CreditAdapter;
}

export interface CommerceEngine {
  // Always present
  product: ProductService;
  customer: CustomerService;
  inventory: InventoryManager;
  discount: DiscountEngine;
  search: SearchEngine;
  wishlist: WishlistService;
  review: ReviewService;
  notification: NotificationService;
  digitalDelivery: DigitalDeliveryService;
  analytics: CommerceAnalyticsEngine;

  // Conditional on adapters
  cart?: CartService;
  subscription?: SubscriptionEngine;
  invoice?: InvoiceEngine;
  loan?: LoanEngine;
  fulfillment?: FulfillmentService;
  giftCard?: GiftCardService;
  checkout?: CheckoutService;
}

export function createCommerceEngine(opts: CommerceEngineOpts): CommerceEngine {
  const { supabase } = opts;

  const engine: CommerceEngine = {
    product:         createProductService({ supabase }),
    customer:        createCustomerService({ supabase }),
    inventory:       createInventoryManager({ supabase }),
    discount:        createDiscountEngine({ supabase }),
    search:          createSearchEngine({ supabase }),
    wishlist:        createWishlistService({ supabase }),
    review:          createReviewService({ supabase }),
    notification:    createNotificationService({ supabase }),
    digitalDelivery: createDigitalDeliveryService({ supabase }),
    analytics:       createCommerceAnalytics({ supabase }),
  };

  if (opts.tax && opts.cartProduct) {
    engine.cart = createCartService({
      supabase,
      tax: opts.tax,
      product: opts.cartProduct,
    });
  }

  if (opts.ledger) {
    engine.subscription = createSubscriptionEngine({ supabase, ledger: opts.ledger });
    engine.invoice      = createInvoiceEngine({ supabase, ledger: opts.ledger });
    engine.loan         = createLoanEngine({ supabase, ledger: opts.ledger });

    if (opts.inventory) {
      engine.fulfillment = createFulfillmentService({
        supabase,
        ledger: opts.ledger,
        inventory: opts.inventory,
      });
    }

    if (opts.credit) {
      engine.giftCard = createGiftCardService({
        supabase,
        ledger: opts.ledger,
        credit: opts.credit,
      });
    }

    if (opts.payments && opts.cart && opts.checkoutProduct) {
      engine.checkout = createCheckoutService({
        supabase,
        ledger: opts.ledger,
        payments: opts.payments,
        cart: opts.cart,
        product: opts.checkoutProduct,
      });
    }
  }

  return engine;
}
