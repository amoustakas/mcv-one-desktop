// @mcv/commerce-sdk/cart-service — cart lifecycle, items, discounts,
// addresses, totals, abandonment, merge-on-login.
//
// 18 methods behind createCartService({ supabase, tax, product }). Needs
// two additional adapters beyond the LedgerAdapter pattern used by the
// ledger-backed factories:
//
//   TaxAdapter      one method — calculateTax(input) → { totalTax }.
//                   Used by recalculateTotals when a shipping address is
//                   set so tax is computed from the cart's destination.
//   ProductAdapter  one method — getProduct(id, ventureId) → Product|null.
//                   Used by addToCart to validate existence and pull the
//                   current unit price + inventory count.
//
// Both adapters are intentionally minimal — callers bring their own tax
// engine (compliance-sdk, Avalara, etc.) and product service without
// pulling the full SDKs.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CartSession,
  CartItem,
  SurfaceAddress,
  AppliedDiscount,
} from './surface-types';

// ─── Adapters ──────────────────────────────────────────────────────────

export interface TaxCalculationResult {
  totalTax: number;
}

export interface TaxAdapter {
  calculateTax(input: {
    ventureId: string;
    customerLocation: {
      country: string;
      state?: string | undefined;
      city?: string | undefined;
      postalCode?: string | undefined;
    };
    lineItems: Array<{
      id: string;
      description: string;
      amount: number;
      quantity: number;
      taxExempt?: boolean;
    }>;
    shippingAmount?: number;
    discountAmount?: number;
    isB2B: boolean;
  }): Promise<TaxCalculationResult>;
}

// Minimal product shape cart-service needs — just enough for price +
// inventory + display. Avoids importing the full Product type so the
// adapter boundary is narrow.
export interface CartProductRef {
  id: string;
  trackInventory: boolean;
  inventoryCount: number | null;
  pricing: { default: { amount: number } };
}

export interface ProductAdapter {
  getProduct(id: string, ventureId: string): Promise<CartProductRef | null>;
}

// ─── Row mappers ────────────────────────────────────────────────────────

export function mapCartItemRow(row: Record<string, unknown>): CartItem {
  const parseJson = <T>(value: unknown): T | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return value as T;
    if (typeof value === 'string') {
      try { return JSON.parse(value) as T; } catch { return null; }
    }
    return null;
  };

  return {
    id: row.id as string,
    productId: row.product_id as string,
    variantId: (row.variant_id as string) ?? null,
    quantity: row.quantity as number,
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
    taxAmount: Number(row.tax_amount ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    metadata: parseJson<Record<string, unknown>>(row.metadata) ?? {},
  };
}

export function mapCartRow(
  row: Record<string, unknown>,
  items: CartItem[],
): CartSession {
  const parseJson = <T>(value: unknown): T | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return value as T;
    if (typeof value === 'string') {
      try { return JSON.parse(value) as T; } catch { return null; }
    }
    return null;
  };

  const parseStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') {
      try { return JSON.parse(value) as string[]; } catch { return []; }
    }
    return [];
  };

  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    customerId: (row.customer_id as string) ?? null,
    sessionId: row.session_id as string,
    items,
    discountCodes: parseStringArray(row.discount_codes),
    appliedDiscounts: parseJson<AppliedDiscount[]>(row.applied_discounts) ?? [],
    subtotal: Number(row.subtotal ?? 0),
    discountTotal: Number(row.discount_total ?? 0),
    taxTotal: Number(row.tax_total ?? 0),
    shippingTotal: Number(row.shipping_total ?? 0),
    total: Number(row.total ?? 0),
    currency: (row.currency as string) ?? 'USD',
    shippingAddress: parseJson<SurfaceAddress>(row.shipping_address),
    billingAddress: parseJson<SurfaceAddress>(row.billing_address),
    selectedPaymentMethod: (row.selected_payment_method as string) ?? null,
    selectedShippingMethod: (row.selected_shipping_method as string) ?? null,
    abandonedAt: (row.abandoned_at as string) ?? null,
    recoveryEmailSent: (row.recovery_email_sent as boolean) ?? false,
    expiresAt: row.expires_at as string,
    metadata: parseJson<Record<string, unknown>>(row.metadata) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Engine interface ──────────────────────────────────────────────────

export interface CartService {
  createCart(
    ventureId: string,
    customerId?: string | null,
    sessionId?: string,
  ): Promise<CartSession>;
  getCart(cartId: string): Promise<CartSession | null>;
  getCartBySession(ventureId: string, sessionId: string): Promise<CartSession | null>;
  getCartByCustomer(ventureId: string, customerId: string): Promise<CartSession | null>;

  addToCart(
    cartId: string,
    productId: string,
    quantity: number,
    variantId?: string | null,
  ): Promise<CartSession>;
  removeFromCart(cartId: string, itemId: string): Promise<CartSession>;
  updateQuantity(cartId: string, itemId: string, quantity: number): Promise<CartSession>;

  applyDiscountCode(cartId: string, code: string): Promise<CartSession>;
  removeDiscountCode(cartId: string, code: string): Promise<CartSession>;

  setShippingAddress(cartId: string, address: SurfaceAddress): Promise<CartSession>;
  setBillingAddress(cartId: string, address: SurfaceAddress): Promise<CartSession>;
  selectPaymentMethod(cartId: string, methodId: string): Promise<CartSession>;
  selectShippingMethod(
    cartId: string,
    method: string,
    shippingAmount?: number,
  ): Promise<CartSession>;

  mergeGuestCart(guestCartId: string, customerId: string): Promise<CartSession>;
  markAbandoned(cartId: string): Promise<void>;
  getAbandonedCarts(ventureId: string, olderThanHours?: number): Promise<CartSession[]>;
  clearCart(cartId: string): Promise<CartSession>;
}

export interface CartServiceOptions {
  supabase: SupabaseClient | null;
  tax: TaxAdapter;
  product: ProductAdapter;
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createCartService({ supabase, tax, product }: CartServiceOptions): CartService {
  async function fetchCartItems(cartId: string): Promise<CartItem[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('cart_items')
      .select()
      .eq('cart_id', cartId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(`Failed to fetch cart items: ${error.message}`);
    return (data ?? []).map(mapCartItemRow);
  }

  async function recalculateTotals(cartId: string): Promise<void> {
    if (!supabase) return;

    const items = await fetchCartItems(cartId);
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const { data: cartRow, error: cartError } = await supabase
      .from('cart_sessions')
      .select('venture_id, applied_discounts, shipping_address, shipping_total, currency')
      .eq('id', cartId)
      .single();
    if (cartError) throw new Error(`Failed to fetch cart for recalculation: ${cartError.message}`);

    const appliedDiscounts: AppliedDiscount[] = Array.isArray(cartRow.applied_discounts)
      ? (cartRow.applied_discounts as AppliedDiscount[])
      : [];
    const discountTotal = appliedDiscounts.reduce((sum, d) => sum + d.amountSaved, 0);
    const shippingTotal = Number(cartRow.shipping_total ?? 0);

    // Tax calc only when we have a destination. Swallow errors so a tax
    // service outage doesn't block cart updates — falls back to 0.
    let taxTotal = 0;
    const shippingAddress = cartRow.shipping_address as SurfaceAddress | null;
    if (shippingAddress && items.length > 0) {
      const taxResult = await tax
        .calculateTax({
          ventureId: cartRow.venture_id as string,
          customerLocation: {
            country: shippingAddress.country,
            state: shippingAddress.state,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
          },
          lineItems: items.map((item) => ({
            id: item.id,
            description: `product:${item.productId}`,
            amount: item.unitPrice,
            quantity: item.quantity,
            taxExempt: false,
          })),
          shippingAmount: shippingTotal,
          discountAmount: discountTotal,
          isB2B: false,
        })
        .catch(() => null);
      if (taxResult) taxTotal = taxResult.totalTax;
    }

    const total = Math.max(0, subtotal - discountTotal + taxTotal + shippingTotal);

    await supabase
      .from('cart_sessions')
      .update({
        subtotal,
        discount_total: discountTotal,
        tax_total: taxTotal,
        total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cartId);
  }

  const service: CartService = {
    async createCart(ventureId, customerId, sessionId) {
      if (!supabase) throw new Error('Supabase client not available');

      const sid = sessionId ?? crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('cart_sessions')
        .insert({
          venture_id: ventureId,
          customer_id: customerId ?? null,
          session_id: sid,
          subtotal: 0,
          discount_total: 0,
          tax_total: 0,
          shipping_total: 0,
          total: 0,
          currency: 'USD',
          discount_codes: [],
          applied_discounts: [],
          recovery_email_sent: false,
          expires_at: expiresAt,
          metadata: {},
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create cart: ${error.message}`);
      return mapCartRow(data, []);
    },

    async getCart(cartId) {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('cart_sessions')
        .select()
        .eq('id', cartId)
        .single();

      if (error?.code === 'PGRST116') return null;
      if (error) throw new Error(`Failed to get cart: ${error.message}`);

      const items = await fetchCartItems(cartId);
      return mapCartRow(data, items);
    },

    async getCartBySession(ventureId, sessionId) {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('cart_sessions')
        .select()
        .eq('venture_id', ventureId)
        .eq('session_id', sessionId)
        .is('abandoned_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(`Failed to get cart by session: ${error.message}`);
      if (!data) return null;

      const items = await fetchCartItems(data.id as string);
      return mapCartRow(data, items);
    },

    async getCartByCustomer(ventureId, customerId) {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('cart_sessions')
        .select()
        .eq('venture_id', ventureId)
        .eq('customer_id', customerId)
        .is('abandoned_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(`Failed to get cart by customer: ${error.message}`);
      if (!data) return null;

      const items = await fetchCartItems(data.id as string);
      return mapCartRow(data, items);
    },

    async addToCart(cartId, productId, quantity, variantId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: cartRow, error: cartError } = await supabase
        .from('cart_sessions')
        .select('venture_id')
        .eq('id', cartId)
        .single();
      if (cartError) throw new Error(`Cart not found: ${cartError.message}`);

      const prod = await product.getProduct(productId, cartRow.venture_id as string);
      if (!prod) throw new Error(`Product ${productId} not found`);

      if (prod.trackInventory && prod.inventoryCount !== null) {
        if (prod.inventoryCount < quantity) {
          throw new Error(`Insufficient inventory for product ${productId}: ${prod.inventoryCount} available`);
        }
      }

      const unitPrice = prod.pricing.default.amount;
      const totalPrice = unitPrice * quantity;

      // Upsert: duplicate (product, variant) lines consolidate by qty.
      const { data: existing } = await supabase
        .from('cart_items')
        .select()
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .eq('variant_id', variantId ?? null)
        .maybeSingle();

      if (existing) {
        const newQty = (existing.quantity as number) + quantity;
        const newTotal = unitPrice * newQty;
        await supabase
          .from('cart_items')
          .update({
            quantity: newQty,
            total_price: newTotal,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({
          cart_id: cartId,
          product_id: productId,
          variant_id: variantId ?? null,
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          tax_amount: 0,
          discount_amount: 0,
          metadata: {},
        });
      }

      await recalculateTotals(cartId);
      const cart = await service.getCart(cartId);
      if (!cart) throw new Error('Cart not found after add');
      return cart;
    },

    async removeFromCart(cartId, itemId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('cart_id', cartId);

      if (error) throw new Error(`Failed to remove item: ${error.message}`);

      await recalculateTotals(cartId);
      const cart = await service.getCart(cartId);
      if (!cart) throw new Error('Cart not found after remove');
      return cart;
    },

    async updateQuantity(cartId, itemId, quantity) {
      if (!supabase) throw new Error('Supabase client not available');

      if (quantity <= 0) return service.removeFromCart(cartId, itemId);

      const { data: item, error: fetchError } = await supabase
        .from('cart_items')
        .select('unit_price')
        .eq('id', itemId)
        .eq('cart_id', cartId)
        .single();

      if (fetchError) throw new Error(`Item not found: ${fetchError.message}`);

      const totalPrice = Number(item.unit_price) * quantity;

      const { error } = await supabase
        .from('cart_items')
        .update({
          quantity,
          total_price: totalPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .eq('cart_id', cartId);

      if (error) throw new Error(`Failed to update quantity: ${error.message}`);

      await recalculateTotals(cartId);
      const cart = await service.getCart(cartId);
      if (!cart) throw new Error('Cart not found after update');
      return cart;
    },

    async applyDiscountCode(cartId, code) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: cartRow, error: cartError } = await supabase
        .from('cart_sessions')
        .select('venture_id, discount_codes, applied_discounts, subtotal')
        .eq('id', cartId)
        .single();
      if (cartError) throw new Error(`Cart not found: ${cartError.message}`);

      const existingCodes = (Array.isArray(cartRow.discount_codes) ? cartRow.discount_codes : []) as string[];
      if (existingCodes.includes(code)) {
        throw new Error(`Discount code "${code}" already applied`);
      }

      const now = new Date().toISOString();
      const { data: discount, error: discountError } = await supabase
        .from('discounts')
        .select()
        .eq('venture_id', cartRow.venture_id)
        .eq('code', code)
        .eq('status', 'active')
        .lte('starts_at', now)
        .maybeSingle();

      if (discountError) throw new Error(`Failed to look up discount: ${discountError.message}`);
      if (!discount) throw new Error(`Discount code "${code}" is invalid or expired`);

      if (discount.ends_at && new Date(discount.ends_at as string) < new Date()) {
        throw new Error(`Discount code "${code}" has expired`);
      }

      if (
        discount.max_uses_total !== null &&
        (discount.used_count as number) >= (discount.max_uses_total as number)
      ) {
        throw new Error(`Discount code "${code}" has reached its usage limit`);
      }

      const subtotal = Number(cartRow.subtotal);

      if (discount.minimum_order_amount !== null && subtotal < Number(discount.minimum_order_amount)) {
        throw new Error(
          `Minimum order of $${Number(discount.minimum_order_amount).toFixed(2)} required for this discount`,
        );
      }

      // Simple amount-saved calc per type. Richer stacking/bxgy logic
      // lives in discount-engine — this path handles the straightforward
      // percentage / fixed / free-shipping cases at cart time.
      let amountSaved = 0;
      const discountType = discount.type as string;
      const discountValue = Number(discount.value);

      if (discountType === 'percentage') {
        amountSaved = subtotal * (discountValue / 100);
      } else if (discountType === 'fixed_amount') {
        amountSaved = Math.min(discountValue, subtotal);
      } else if (discountType === 'free_shipping') {
        // Resolved against shipping total at totals recalc.
        amountSaved = 0;
      }

      const newApplied = [
        ...((Array.isArray(cartRow.applied_discounts) ? cartRow.applied_discounts : []) as AppliedDiscount[]),
        {
          discountId: discount.id as string,
          code,
          type: discountType as AppliedDiscount['type'],
          value: discountValue,
          amountSaved,
        },
      ];

      await supabase
        .from('cart_sessions')
        .update({
          discount_codes: [...existingCodes, code],
          applied_discounts: newApplied,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartId);

      await recalculateTotals(cartId);
      const cart = await service.getCart(cartId);
      if (!cart) throw new Error('Cart not found after discount');
      return cart;
    },

    async removeDiscountCode(cartId, code) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: cartRow, error: cartError } = await supabase
        .from('cart_sessions')
        .select('discount_codes, applied_discounts')
        .eq('id', cartId)
        .single();
      if (cartError) throw new Error(`Cart not found: ${cartError.message}`);

      const existingCodes = (Array.isArray(cartRow.discount_codes) ? cartRow.discount_codes : []) as string[];
      const existingDiscounts = (Array.isArray(cartRow.applied_discounts) ? cartRow.applied_discounts : []) as AppliedDiscount[];

      await supabase
        .from('cart_sessions')
        .update({
          discount_codes: existingCodes.filter((c: string) => c !== code),
          applied_discounts: existingDiscounts.filter((d: AppliedDiscount) => d.code !== code),
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartId);

      await recalculateTotals(cartId);
      const cart = await service.getCart(cartId);
      if (!cart) throw new Error('Cart not found after remove discount');
      return cart;
    },

    async setShippingAddress(cartId, address) {
      if (!supabase) throw new Error('Supabase client not available');

      const { error } = await supabase
        .from('cart_sessions')
        .update({
          shipping_address: address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartId);

      if (error) throw new Error(`Failed to set shipping address: ${error.message}`);

      // Tax calc depends on destination — recalc immediately.
      await recalculateTotals(cartId);
      const cart = await service.getCart(cartId);
      if (!cart) throw new Error('Cart not found after address update');
      return cart;
    },

    async setBillingAddress(cartId, address) {
      if (!supabase) throw new Error('Supabase client not available');

      const { error } = await supabase
        .from('cart_sessions')
        .update({
          billing_address: address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartId);

      if (error) throw new Error(`Failed to set billing address: ${error.message}`);

      const cart = await service.getCart(cartId);
      if (!cart) throw new Error('Cart not found after billing address update');
      return cart;
    },

    async selectPaymentMethod(cartId, methodId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { error } = await supabase
        .from('cart_sessions')
        .update({
          selected_payment_method: methodId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartId);

      if (error) throw new Error(`Failed to select payment method: ${error.message}`);

      const cart = await service.getCart(cartId);
      if (!cart) throw new Error('Cart not found');
      return cart;
    },

    async selectShippingMethod(cartId, method, shippingAmount) {
      if (!supabase) throw new Error('Supabase client not available');

      const { error } = await supabase
        .from('cart_sessions')
        .update({
          selected_shipping_method: method,
          shipping_total: shippingAmount ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartId);

      if (error) throw new Error(`Failed to select shipping method: ${error.message}`);

      await recalculateTotals(cartId);
      const cart = await service.getCart(cartId);
      if (!cart) throw new Error('Cart not found after shipping method update');
      return cart;
    },

    async mergeGuestCart(guestCartId, customerId) {
      if (!supabase) throw new Error('Supabase client not available');

      const guestCart = await service.getCart(guestCartId);
      if (!guestCart) throw new Error(`Guest cart ${guestCartId} not found`);

      let customerCart = await service.getCartByCustomer(guestCart.ventureId, customerId);
      if (!customerCart) {
        customerCart = await service.createCart(guestCart.ventureId, customerId);
      }

      for (const item of guestCart.items) {
        await service.addToCart(customerCart.id, item.productId, item.quantity, item.variantId);
      }

      for (const code of guestCart.discountCodes) {
        try {
          await service.applyDiscountCode(customerCart.id, code);
        } catch {
          // Best-effort — skip invalid codes rather than fail the merge.
        }
      }

      if (guestCart.shippingAddress && !customerCart.shippingAddress) {
        await service.setShippingAddress(customerCart.id, guestCart.shippingAddress);
      }

      await service.markAbandoned(guestCartId);

      const merged = await service.getCart(customerCart.id);
      if (!merged) throw new Error('Merged cart not found');
      return merged;
    },

    async markAbandoned(cartId) {
      if (!supabase) return;

      await supabase
        .from('cart_sessions')
        .update({
          abandoned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartId);
    },

    async getAbandonedCarts(ventureId, olderThanHours = 1) {
      if (!supabase) return [];

      const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('cart_sessions')
        .select()
        .eq('venture_id', ventureId)
        .not('abandoned_at', 'is', null)
        .lte('abandoned_at', cutoff)
        .order('abandoned_at', { ascending: false });

      if (error) throw new Error(`Failed to get abandoned carts: ${error.message}`);

      const carts: CartSession[] = [];
      for (const row of data ?? []) {
        const items = await fetchCartItems(row.id as string);
        carts.push(mapCartRow(row, items));
      }
      return carts;
    },

    async clearCart(cartId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) throw new Error(`Failed to clear cart: ${error.message}`);

      await supabase
        .from('cart_sessions')
        .update({
          subtotal: 0,
          discount_total: 0,
          tax_total: 0,
          total: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cartId);

      const cart = await service.getCart(cartId);
      if (!cart) throw new Error('Cart not found after clear');
      return cart;
    },
  };

  return service;
}
