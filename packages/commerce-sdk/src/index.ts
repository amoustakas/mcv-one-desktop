// @mcv/commerce-sdk — Commerce & Financial OS primitives.
//
// First slice (v0.1.0): canonical type system — products, orders, carts,
// customers, subscriptions, invoices, loans, fulfillment, discounts,
// inventory, gift cards, reviews, wishlists, search, analytics. Pure
// Zod + TS; zero side effects.
//
// Future slices will progressively lift the service engines (cart,
// checkout, discount, inventory, fulfillment, gift-card, invoice, loan,
// subscription, etc.) as DI factories composed on @mcv/ledger-sdk and
// @mcv/payments-sdk. App-side shims keep consumers working during each
// intermediate step.

export * from './types';
export * from './surface-types';
export * from './search-engine';
export * from './wishlist-service';
export * from './review-service';
export * from './notification-service';
export * from './digital-delivery-service';
export * from './commerce-analytics';

// product-service.searchProducts collides with search-engine.searchProducts
// (raw CRUD vs faceted analytics-instrumented). Both are intentional
// — consumers import product-service via its subpath
// (@mcv/commerce-sdk/product-service) when they want the direct path.
export { createProductService, mapProductRow } from './product-service';
export type { ProductService, ProductServiceOptions, ListProductsFilters } from './product-service';

export const MCV_COMMERCE_SDK_VERSION = '0.8.0' as const;
