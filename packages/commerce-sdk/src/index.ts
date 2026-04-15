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

export const MCV_COMMERCE_SDK_VERSION = '0.4.0' as const;
