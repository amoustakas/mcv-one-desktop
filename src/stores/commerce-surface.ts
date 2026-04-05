// src/stores/commerce-surface.ts
// Zustand store — Commerce Surface Layer
// Cart, Customer, Discount, Inventory, Fulfillment, Reviews, Wishlists, Gift Cards, Analytics, Search

import { create } from 'zustand';
import type {
  CartSession,
  Customer,
  Discount,
  InventoryLevel,
  Fulfillment,
  Review,
  Wishlist,
  GiftCard,
  CommerceAnalytics,
} from '../lib/commerce/surface-types';

// ─────────────────────────────────────────────────────────
// STATE TYPES
// ─────────────────────────────────────────────────────────

interface CommerceSurfaceState {
  // Cart
  cart: CartSession | null;
  cartLoading: boolean;

  // Customers
  customers: Customer[];
  customersLoading: boolean;

  // Discounts
  discounts: Discount[];
  discountsLoading: boolean;

  // Inventory
  inventory: InventoryLevel[];
  lowStockProducts: Record<string, unknown>[];
  inventoryLoading: boolean;

  // Fulfillments
  fulfillments: Fulfillment[];
  unfulfilledOrders: Record<string, unknown>[];
  fulfillmentLoading: boolean;

  // Reviews
  reviews: Review[];
  moderationQueue: Review[];
  reviewsLoading: boolean;

  // Wishlists
  wishlists: Wishlist[];
  wishlistLoading: boolean;

  // Gift Cards
  giftCards: GiftCard[];
  giftCardLoading: boolean;

  // Analytics
  analytics: CommerceAnalytics | null;
  analyticsLoading: boolean;

  // Search
  searchResults: Array<{ productId: string; name: string; score: number; highlight: string | null }>;
  searchLoading: boolean;
  searchQuery: string;

  // ── Cart Actions ────────────────────────────────────────

  fetchCart: (ventureId: string, cartId: string) => Promise<void>;
  createCart: (ventureId: string, customerId?: string | null) => Promise<CartSession>;
  addToCart: (ventureId: string, cartId: string, productId: string, quantity?: number, variantId?: string | null) => Promise<void>;
  removeFromCart: (ventureId: string, cartId: string, itemId: string) => Promise<void>;
  updateCartQuantity: (ventureId: string, cartId: string, itemId: string, quantity: number) => Promise<void>;
  applyCartDiscount: (ventureId: string, cartId: string, code: string) => Promise<void>;
  fetchAbandonedCarts: (ventureId: string) => Promise<Record<string, unknown>[]>;

  // ── Checkout Actions ────────────────────────────────────

  instantBuy: (ventureId: string, productId: string, customerId: string, options?: Record<string, unknown>) => Promise<Record<string, unknown>>;
  checkout: (ventureId: string, cartId: string, customerId: string, paymentMethodId?: string) => Promise<Record<string, unknown>>;

  // ── Customer Actions ────────────────────────────────────

  fetchCustomers: (ventureId: string, segment?: string) => Promise<void>;
  createCustomer: (ventureId: string, input: Record<string, unknown>) => Promise<Customer>;
  fetchCustomer: (ventureId: string, customerId: string) => Promise<Customer>;

  // ── Discount Actions ────────────────────────────────────

  fetchDiscounts: (ventureId: string, status?: string) => Promise<void>;
  createDiscount: (ventureId: string, input: Record<string, unknown>) => Promise<Discount>;
  validateDiscount: (ventureId: string, code: string, cartTotal?: number) => Promise<{ valid: boolean; reason?: string; discount?: Discount }>;

  // ── Inventory Actions ───────────────────────────────────

  fetchInventory: (ventureId: string, productId: string) => Promise<void>;
  fetchLowStock: (ventureId: string, threshold?: number) => Promise<void>;
  adjustInventory: (ventureId: string, productId: string, locationId: string, quantity: number, reason?: string) => Promise<void>;

  // ── Fulfillment Actions ─────────────────────────────────

  fetchUnfulfilledOrders: (ventureId: string) => Promise<void>;
  createFulfillment: (ventureId: string, orderId: string, items: Record<string, unknown>[], options?: Record<string, unknown>) => Promise<void>;
  markShipped: (ventureId: string, fulfillmentId: string, tracking?: { trackingNumber?: string; carrier?: string; trackingUrl?: string }) => Promise<void>;

  // ── Review Actions ──────────────────────────────────────

  fetchReviews: (ventureId: string, productId?: string, status?: string) => Promise<void>;
  fetchModerationQueue: (ventureId: string) => Promise<void>;
  createReview: (ventureId: string, input: Record<string, unknown>) => Promise<Review>;

  // ── Wishlist Actions ────────────────────────────────────

  fetchWishlists: (ventureId: string, customerId: string) => Promise<void>;
  addToWishlist: (ventureId: string, customerId: string, productId: string, options?: Record<string, unknown>) => Promise<void>;

  // ── Gift Card Actions ───────────────────────────────────

  createGiftCard: (ventureId: string, input: Record<string, unknown>) => Promise<GiftCard>;
  fetchGiftCardBalance: (ventureId: string, code: string) => Promise<{ currentBalance: number; currency: string; status: string }>;

  // ── Analytics Actions ───────────────────────────────────

  fetchAnalytics: (ventureId: string, from?: string, to?: string) => Promise<void>;
  fetchFunnel: (ventureId: string, from?: string, to?: string) => Promise<Record<string, unknown>>;

  // ── Search Actions ──────────────────────────────────────

  searchProducts: (ventureId: string, query: string, filters?: Record<string, unknown>) => Promise<void>;
  suggestProducts: (ventureId: string, query: string) => Promise<Array<{ productId: string; name: string }>>;
  clearSearch: () => void;
}

// ─────────────────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────────────────

const API_BASE = '/api/commerce-surface';

async function apiGet<T>(action: string, params: Record<string, string | number | undefined | boolean>): Promise<T> {
  const query = new URLSearchParams({ action });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v) !== '') query.set(k, String(v));
  }
  const res = await fetch(`${API_BASE}?${query.toString()}`);
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(e.error ?? `Commerce Surface API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function apiPost<T>(action: string, ventureId: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ventureId, ...body }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(e.error ?? `Commerce Surface API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────

export const useCommerceSurfaceStore = create<CommerceSurfaceState>((set, _get) => ({
  // Initial state
  cart: null,
  cartLoading: false,
  customers: [],
  customersLoading: false,
  discounts: [],
  discountsLoading: false,
  inventory: [],
  lowStockProducts: [],
  inventoryLoading: false,
  fulfillments: [],
  unfulfilledOrders: [],
  fulfillmentLoading: false,
  reviews: [],
  moderationQueue: [],
  reviewsLoading: false,
  wishlists: [],
  wishlistLoading: false,
  giftCards: [],
  giftCardLoading: false,
  analytics: null,
  analyticsLoading: false,
  searchResults: [],
  searchLoading: false,
  searchQuery: '',

  // ── Cart ────────────────────────────────────────────────

  fetchCart: async (ventureId, cartId) => {
    set({ cartLoading: true });
    try {
      const { data } = await apiGet<{ data: CartSession }>('get-cart', { ventureId, cartId });
      set({ cart: data });
    } finally {
      set({ cartLoading: false });
    }
  },

  createCart: async (ventureId, customerId) => {
    set({ cartLoading: true });
    try {
      const { data } = await apiPost<{ data: CartSession }>('create-cart', ventureId, { customerId: customerId ?? null });
      set({ cart: data });
      return data;
    } finally {
      set({ cartLoading: false });
    }
  },

  addToCart: async (ventureId, cartId, productId, quantity = 1, variantId = null) => {
    set({ cartLoading: true });
    try {
      const { data } = await apiPost<{ data: CartSession }>('add-to-cart', ventureId, { cartId, productId, quantity, variantId });
      set({ cart: data });
    } finally {
      set({ cartLoading: false });
    }
  },

  removeFromCart: async (ventureId, cartId, itemId) => {
    set({ cartLoading: true });
    try {
      await apiPost('remove-from-cart', ventureId, { cartId, itemId });
      // Refresh cart
      const { data } = await apiGet<{ data: CartSession }>('get-cart', { ventureId, cartId });
      set({ cart: data });
    } finally {
      set({ cartLoading: false });
    }
  },

  updateCartQuantity: async (ventureId, cartId, itemId, quantity) => {
    set({ cartLoading: true });
    try {
      await apiPost('update-quantity', ventureId, { cartId, itemId, quantity });
      const { data } = await apiGet<{ data: CartSession }>('get-cart', { ventureId, cartId });
      set({ cart: data });
    } finally {
      set({ cartLoading: false });
    }
  },

  applyCartDiscount: async (ventureId, cartId, code) => {
    set({ cartLoading: true });
    try {
      await apiPost('apply-discount', ventureId, { cartId, code });
      const { data } = await apiGet<{ data: CartSession }>('get-cart', { ventureId, cartId });
      set({ cart: data });
    } finally {
      set({ cartLoading: false });
    }
  },

  fetchAbandonedCarts: async (ventureId) => {
    const { data } = await apiGet<{ data: Record<string, unknown>[] }>('get-abandoned-carts', { ventureId });
    return data ?? [];
  },

  // ── Checkout ────────────────────────────────────────────

  instantBuy: async (ventureId, productId, customerId, options = {}) => {
    const { data } = await apiPost<{ data: Record<string, unknown> }>('instant-buy', ventureId, { productId, customerId, ...options });
    return data;
  },

  checkout: async (ventureId, cartId, customerId, paymentMethodId) => {
    const { data } = await apiPost<{ data: Record<string, unknown> }>('checkout', ventureId, { cartId, customerId, paymentMethodId });
    set({ cart: null }); // Clear cart after successful checkout
    return data;
  },

  // ── Customers ───────────────────────────────────────────

  fetchCustomers: async (ventureId, segment) => {
    set({ customersLoading: true });
    try {
      const { data } = await apiGet<{ data: Customer[] }>('list-customers', { ventureId, segment });
      set({ customers: data ?? [] });
    } finally {
      set({ customersLoading: false });
    }
  },

  createCustomer: async (ventureId, input) => {
    const { data } = await apiPost<{ data: Customer }>('create-customer', ventureId, input);
    set((state) => ({ customers: [data, ...state.customers] }));
    return data;
  },

  fetchCustomer: async (ventureId, customerId) => {
    const { data } = await apiGet<{ data: Customer }>('get-customer', { ventureId, customerId });
    return data;
  },

  // ── Discounts ───────────────────────────────────────────

  fetchDiscounts: async (ventureId, status) => {
    set({ discountsLoading: true });
    try {
      const { data } = await apiGet<{ data: Discount[] }>('list-discounts', { ventureId, status });
      set({ discounts: data ?? [] });
    } finally {
      set({ discountsLoading: false });
    }
  },

  createDiscount: async (ventureId, input) => {
    const { data } = await apiPost<{ data: Discount }>('create-discount', ventureId, input);
    set((state) => ({ discounts: [data, ...state.discounts] }));
    return data;
  },

  validateDiscount: async (ventureId, code, cartTotal) => {
    const result = await apiGet<{ valid: boolean; reason?: string; discount?: Discount }>(
      'validate-discount', { ventureId, code, cartTotal },
    );
    return result;
  },

  // ── Inventory ───────────────────────────────────────────

  fetchInventory: async (ventureId, productId) => {
    set({ inventoryLoading: true });
    try {
      const { data } = await apiGet<{ data: InventoryLevel[] }>('get-inventory', { ventureId, productId });
      set({ inventory: data ?? [] });
    } finally {
      set({ inventoryLoading: false });
    }
  },

  fetchLowStock: async (ventureId, threshold = 10) => {
    set({ inventoryLoading: true });
    try {
      const { data } = await apiGet<{ data: Record<string, unknown>[] }>('get-low-stock', { ventureId, threshold });
      set({ lowStockProducts: data ?? [] });
    } finally {
      set({ inventoryLoading: false });
    }
  },

  adjustInventory: async (ventureId, productId, locationId, quantity, reason) => {
    await apiPost('adjust-inventory', ventureId, { productId, locationId, quantity, reason });
  },

  // ── Fulfillment ─────────────────────────────────────────

  fetchUnfulfilledOrders: async (ventureId) => {
    set({ fulfillmentLoading: true });
    try {
      const { data } = await apiGet<{ data: Record<string, unknown>[] }>('get-unfulfilled', { ventureId });
      set({ unfulfilledOrders: data ?? [] });
    } finally {
      set({ fulfillmentLoading: false });
    }
  },

  createFulfillment: async (ventureId, orderId, items, options = {}) => {
    set({ fulfillmentLoading: true });
    try {
      const { data } = await apiPost<{ data: Fulfillment }>('create-fulfillment', ventureId, { orderId, items, ...options });
      set((state) => ({ fulfillments: [data, ...state.fulfillments] }));
    } finally {
      set({ fulfillmentLoading: false });
    }
  },

  markShipped: async (ventureId, fulfillmentId, tracking = {}) => {
    await apiPost('mark-shipped', ventureId, { fulfillmentId, ...tracking });
    set((state) => ({
      fulfillments: state.fulfillments.map((f) =>
        f.id === fulfillmentId ? { ...f, status: 'fulfilled' as const } : f,
      ),
    }));
  },

  // ── Reviews ─────────────────────────────────────────────

  fetchReviews: async (ventureId, productId, status) => {
    set({ reviewsLoading: true });
    try {
      const { data } = await apiGet<{ data: Review[] }>('list-reviews', { ventureId, productId, status });
      set({ reviews: data ?? [] });
    } finally {
      set({ reviewsLoading: false });
    }
  },

  fetchModerationQueue: async (ventureId) => {
    set({ reviewsLoading: true });
    try {
      const { data } = await apiGet<{ data: Review[] }>('get-moderation-queue', { ventureId });
      set({ moderationQueue: data ?? [] });
    } finally {
      set({ reviewsLoading: false });
    }
  },

  createReview: async (ventureId, input) => {
    const { data } = await apiPost<{ data: Review }>('create-review', ventureId, input);
    set((state) => ({ reviews: [data, ...state.reviews] }));
    return data;
  },

  // ── Wishlists ───────────────────────────────────────────

  fetchWishlists: async (ventureId, customerId) => {
    set({ wishlistLoading: true });
    try {
      const { data } = await apiGet<{ data: Wishlist[] }>('get-wishlists', { ventureId, customerId });
      set({ wishlists: data ?? [] });
    } finally {
      set({ wishlistLoading: false });
    }
  },

  addToWishlist: async (ventureId, customerId, productId, options = {}) => {
    await apiPost('add-to-wishlist', ventureId, { customerId, productId, ...options });
  },

  // ── Gift Cards ──────────────────────────────────────────

  createGiftCard: async (ventureId, input) => {
    const { data } = await apiPost<{ data: GiftCard }>('create-gift-card', ventureId, input);
    set((state) => ({ giftCards: [data, ...state.giftCards] }));
    return data;
  },

  fetchGiftCardBalance: async (ventureId, code) => {
    const { data } = await apiGet<{ data: { current_balance: number; currency: string; status: string } }>(
      'get-balance', { ventureId, code },
    );
    return { currentBalance: data.current_balance, currency: data.currency, status: data.status };
  },

  // ── Analytics ───────────────────────────────────────────

  fetchAnalytics: async (ventureId, from, to) => {
    set({ analyticsLoading: true });
    try {
      const { data } = await apiGet<{ data: CommerceAnalytics }>('get-analytics', { ventureId, from, to });
      set({ analytics: data });
    } finally {
      set({ analyticsLoading: false });
    }
  },

  fetchFunnel: async (ventureId, from, to) => {
    const { data } = await apiGet<{ data: Record<string, unknown> }>('get-funnel', { ventureId, from, to });
    return data;
  },

  // ── Search ──────────────────────────────────────────────

  searchProducts: async (ventureId, query, _filters) => {
    set({ searchLoading: true, searchQuery: query });
    try {
      const { data } = await apiGet<{ data: { products: Array<{ productId: string; name: string; score: number; highlight: string | null }>; totalCount: number } }>(
        'search', { ventureId, query: encodeURIComponent(query) },
      );
      set({ searchResults: data?.products ?? [] });
    } finally {
      set({ searchLoading: false });
    }
  },

  suggestProducts: async (ventureId, query) => {
    const { data } = await apiGet<{ data: Array<{ productId: string; name: string }> }>(
      'suggest', { ventureId, query: encodeURIComponent(query) },
    );
    return data ?? [];
  },

  clearSearch: () => {
    set({ searchResults: [], searchQuery: '' });
  },
}));
