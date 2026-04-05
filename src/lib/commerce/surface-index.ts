// src/lib/commerce/surface-index.ts
// Commerce Surface Layer — Barrel Export
// Re-exports all surface service modules

// ── Types ──────────────────────────────────────────────────────────────────
export * from './surface-types';

// ── Cart & Checkout ────────────────────────────────────────────────────────
export * from './cart-service';
export * from './checkout-service';

// ── Customer Management ────────────────────────────────────────────────────
export * from './customer-service';

// ── Discounts & Promotions ─────────────────────────────────────────────────
export * from './discount-engine';

// ── Inventory Management ───────────────────────────────────────────────────
export * from './inventory-manager';

// ── Order Fulfillment ──────────────────────────────────────────────────────
export * from './fulfillment-service';

// ── Notifications ──────────────────────────────────────────────────────────
export * from './notification-service';

// ── Digital Delivery ──────────────────────────────────────────────────────
export * from './digital-delivery-service';

// ── Reviews & Ratings ─────────────────────────────────────────────────────
export * from './review-service';

// ── Wishlists ─────────────────────────────────────────────────────────────
export * from './wishlist-service';

// ── Gift Cards ─────────────────────────────────────────────────────────────
export * from './gift-card-service';

// ── Search Engine ──────────────────────────────────────────────────────────
export * from './search-engine';

// ── Analytics ─────────────────────────────────────────────────────────────
export * from './commerce-analytics';
