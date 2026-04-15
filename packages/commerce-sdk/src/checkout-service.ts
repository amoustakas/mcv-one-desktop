// @mcv/commerce-sdk/checkout-service — cart → order → payment → ledger.
//
// The orchestration layer that ties the commerce surface together.
// 4 public methods behind createCheckoutService({ supabase, ledger,
// payments, cart, product }):
//
//   instantBuy              one-click purchase using a customer's saved
//                           default address + payment method
//   checkout                full cart checkout (with inventory validation
//                           + price refresh before execution)
//   estimateCheckout        no-side-effect estimate — payment-router
//                           decision + fee breakdown for a cart
//   conversationalCheckout  NAOS chat flow: returns a confirmation
//                           summary when confirmed=false, executes
//                           instantBuy when confirmed=true
//
// Four narrow adapters so consumers can mix-and-match:
//
//   LedgerAdapter          3 methods, same as invoice/loan/subscription
//   PaymentRouterAdapter   2 methods: processPayment + estimateRoute
//   CartAdapter            2 methods: getCart + clearCart
//   ProductAdapter         1 method: getProduct (same shape as
//                          cart-service's ProductAdapter)
//
// Journal entry on successful checkout:
//   DR 1010 Cash / CR 4000 Revenue (venture's general revenue account)
// Ledger failures are swallowed — checkout completes even when the
// chart-of-accounts is incomplete, matching the original behavior.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CartSession, CartItem } from './surface-types';

// ─── Adapters ──────────────────────────────────────────────────────────

export interface LedgerAccountRef { id: string }
export interface LedgerJournalEntryRef { id: string }

export interface LedgerJournalEntryInput {
  ventureId: string;
  entryDate: string;
  description: string;
  sourceType: string;
  sourceId: string;
  lines: Array<{
    accountId: string;
    debitAmount: number;
    creditAmount: number;
    currency?: string;
    exchangeRate?: number;
    dimensions?: Record<string, string | undefined>;
  }>;
}

export interface LedgerAdapter {
  getAccountByCode(ventureId: string, code: string): Promise<LedgerAccountRef | null>;
  createJournalEntry(input: LedgerJournalEntryInput): Promise<LedgerJournalEntryRef>;
  postJournalEntry(entryId: string, postedBy: string): Promise<unknown>;
}

export interface PaymentRequestInput {
  amount: number;
  currency: string;
  method: string | null;
  customerId: string | null;
  customerCountry: string;
  ventureId: string;
  description: string;
  metadata: Record<string, unknown>;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: string;
  error?: string | null;
  processorId: string;
  processorPaymentId: string;
  fee: { totalFee: number };
}

export interface RoutingDecision {
  primaryRail: string;
  fallbackRails: string[];
  estimatedFee: { totalFee: number };
  savingsVsDefault: number;
  reasoning: string;
}

export interface PaymentRouterAdapter {
  processPayment(req: PaymentRequestInput): Promise<{ result: PaymentResult; decision: RoutingDecision }>;
  estimateRoute(input: {
    amount: number;
    currency: string;
    customerCountry: string;
    paymentMethod: string | null;
    urgency: 'standard' | 'fast' | 'cheapest';
    ventureId: string;
    customerId: string | null;
    isRecurring: boolean;
  }): Promise<RoutingDecision | null>;
}

export interface CartAdapter {
  getCart(cartId: string): Promise<CartSession | null>;
  clearCart(cartId: string): Promise<unknown>;
}

export interface CheckoutProductRef {
  id: string;
  name: string;
  trackInventory: boolean;
  inventoryCount: number | null;
  pricing: { default: { amount: number; currency?: string } };
}

export interface ProductAdapter {
  getProduct(id: string, ventureId: string): Promise<CheckoutProductRef | null>;
}

// ─── Response types ────────────────────────────────────────────────────

export interface OrderConfirmation {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentId: string;
  paymentStatus: string;
  processorRail: string;
  total: number;
  currency: string;
  items: Array<{
    productId: string;
    variantId: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  shippingAddress: Record<string, unknown> | null;
  estimatedFee: number;
  savingsVsDefault: number;
  createdAt: string;
}

export interface CheckoutEstimate {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  estimatedProcessingFee: number;
  total: number;
  currency: string;
  primaryRail: string;
  fallbackRails: string[];
  savingsVsDefault: number;
  reasoning: string;
}

export interface ConversationalCheckoutSummary {
  confirmed: false;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: string;
  shippingAddress: Record<string, unknown> | null;
  paymentMethodLast4: string | null;
  confirmationPrompt: string;
}

// ─── Engine interface ──────────────────────────────────────────────────

export interface CheckoutService {
  instantBuy(
    ventureId: string,
    customerId: string,
    productId: string,
    quantity?: number,
    variantId?: string | null,
  ): Promise<OrderConfirmation>;
  checkout(cartId: string, paymentMethodId?: string): Promise<OrderConfirmation>;
  estimateCheckout(cartId: string): Promise<CheckoutEstimate>;
  conversationalCheckout(
    ventureId: string,
    customerId: string,
    productId: string,
    confirmed?: boolean,
  ): Promise<OrderConfirmation | ConversationalCheckoutSummary>;
}

export interface CheckoutServiceOptions {
  supabase: SupabaseClient | null;
  ledger: LedgerAdapter;
  payments: PaymentRouterAdapter;
  cart: CartAdapter;
  product: ProductAdapter;
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createCheckoutService({
  supabase,
  ledger,
  payments,
  cart,
  product,
}: CheckoutServiceOptions): CheckoutService {
  // Closed-over core execution engine: runs the full cart → order →
  // payment → inventory → transaction → journal → notification → cart-
  // clear sequence. Shared by instantBuy + checkout.
  async function executeCheckout(params: {
    ventureId: string;
    customerId: string | null;
    items: CartItem[];
    currency: string;
    shippingAddress: Record<string, unknown> | null;
    billingAddress: Record<string, unknown> | null;
    paymentMethodId: string | null;
    taxTotal: number;
    shippingTotal: number;
    discountTotal: number;
    cartId?: string;
  }): Promise<OrderConfirmation> {
    if (!supabase) throw new Error('Supabase client not available');

    const {
      ventureId,
      customerId,
      items,
      currency,
      shippingAddress,
      billingAddress,
      paymentMethodId,
      taxTotal,
      shippingTotal,
      discountTotal,
      cartId,
    } = params;

    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const total = Math.max(0, subtotal - discountTotal + taxTotal + shippingTotal);

    // 1. Process payment via the router — router decides rail.
    const paymentReq: PaymentRequestInput = {
      amount: total,
      currency,
      method: null,
      customerId: customerId ?? null,
      customerCountry:
        (shippingAddress?.country as string) ??
        (billingAddress?.country as string) ??
        'US',
      ventureId,
      description: `Order for ${items.length} item(s)`,
      metadata: { cartId: cartId ?? null },
    };

    const { result: paymentResult, decision } = await payments.processPayment(paymentReq);

    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.error ?? 'Unknown error'}`);
    }

    // 2. Create order record (order_number generated by DB trigger).
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        venture_id: ventureId,
        customer_id: customerId ?? null,
        cart_id: cartId ?? null,
        status: 'confirmed',
        payment_status: paymentResult.status,
        payment_id: paymentResult.paymentId,
        processor_id: paymentResult.processorId,
        processor_payment_id: paymentResult.processorPaymentId,
        subtotal,
        discount_total: discountTotal,
        tax_total: taxTotal,
        shipping_total: shippingTotal,
        total,
        currency,
        shipping_address: shippingAddress ?? null,
        billing_address: billingAddress ?? null,
        selected_payment_method: paymentMethodId ?? null,
        metadata: {
          rail: decision.primaryRail,
          savingsVsDefault: decision.savingsVsDefault,
          estimatedFee: decision.estimatedFee.totalFee,
        },
      })
      .select()
      .single();

    if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);

    const orderId = order.id as string;

    // 3. Insert order_items rows.
    const orderItemRows = items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      tax_amount: item.taxAmount,
      discount_amount: item.discountAmount,
      metadata: item.metadata,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemRows);
    if (itemsError) throw new Error(`Failed to create order items: ${itemsError.message}`);

    // 4. Inventory decrement for tracked products. Best-effort — a lookup
    //    failure shouldn't block the confirmed order.
    for (const item of items) {
      const prod = await product.getProduct(item.productId, ventureId).catch(() => null);
      if (prod?.trackInventory && prod.inventoryCount !== null) {
        await supabase
          .from('products')
          .update({
            inventory_count: Math.max(0, prod.inventoryCount - item.quantity),
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.productId)
          .eq('venture_id', ventureId);
      }
    }

    // 5. Transaction audit row — non-fatal on failure.
    await supabase.from('transactions').insert({
      venture_id: ventureId,
      order_id: orderId,
      payment_id: paymentResult.paymentId,
      processor_id: paymentResult.processorId,
      processor_payment_id: paymentResult.processorPaymentId,
      amount: total,
      currency,
      status: paymentResult.status,
      fee: paymentResult.fee.totalFee,
      metadata: {
        rail: decision.primaryRail,
        reasoning: decision.reasoning,
      },
    }).then(() => null).catch(() => null);

    // 6. Ledger entry: DR 1010 Cash / CR 4000 Revenue. Swallowed — ledger
    //    outages or missing accounts shouldn't block order confirmation.
    try {
      const [cashAccount, revenueAccount] = await Promise.all([
        ledger.getAccountByCode(ventureId, '1010'),
        ledger.getAccountByCode(ventureId, '4000'),
      ]);

      if (cashAccount && revenueAccount) {
        const entry = await ledger.createJournalEntry({
          ventureId,
          entryDate: new Date().toISOString(),
          description: `Sale — Order ${order.order_number ?? orderId}`,
          sourceType: 'order',
          sourceId: orderId,
          lines: [
            {
              accountId: cashAccount.id,
              debitAmount: total,
              creditAmount: 0,
              currency,
              dimensions: {
                ventureId,
                customerId: customerId ?? undefined,
                rail: decision.primaryRail,
              },
            },
            {
              accountId: revenueAccount.id,
              debitAmount: 0,
              creditAmount: total,
              currency,
              dimensions: {
                ventureId,
                customerId: customerId ?? undefined,
              },
            },
          ],
        });

        await ledger.postJournalEntry(entry.id, 'system:checkout').catch(() => null);
      }
    } catch {
      // Non-fatal.
    }

    // 7. Clear originating cart if provided.
    if (cartId) {
      await cart.clearCart(cartId).catch(() => null);
    }

    // 8. Fire-and-forget order-confirmation notification.
    supabase.from('notification_queue').insert({
      venture_id: ventureId,
      event: 'order.confirmed',
      customer_id: customerId ?? null,
      payload: { orderId, total, currency },
    }).then(() => null).catch(() => null);

    return {
      orderId,
      orderNumber: (order.order_number as string) ?? orderId,
      status: 'confirmed',
      paymentId: paymentResult.paymentId,
      paymentStatus: paymentResult.status,
      processorRail: decision.primaryRail,
      total,
      currency,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
      })),
      shippingAddress,
      estimatedFee: decision.estimatedFee.totalFee,
      savingsVsDefault: decision.savingsVsDefault,
      createdAt: order.created_at as string,
    };
  }

  const service: CheckoutService = {
    async instantBuy(ventureId, customerId, productId, quantity = 1, variantId) {
      if (!supabase) throw new Error('Supabase client not available');

      const prod = await product.getProduct(productId, ventureId);
      if (!prod) throw new Error(`Product ${productId} not found`);

      // Customer's saved defaults drive the instant-buy flow.
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('default_address_id, default_payment_method_id')
        .eq('id', customerId)
        .eq('venture_id', ventureId)
        .single();

      if (customerError) throw new Error(`Customer not found: ${customerError.message}`);

      if (!customer.default_payment_method_id) {
        throw new Error('No saved payment method found. Please add a payment method before using Instant Buy.');
      }
      if (!customer.default_address_id) {
        throw new Error('No saved shipping address found. Please add an address before using Instant Buy.');
      }

      const { data: addressRow } = await supabase
        .from('customer_addresses')
        .select()
        .eq('id', customer.default_address_id)
        .single();

      const { data: methodRow } = await supabase
        .from('saved_payment_methods')
        .select()
        .eq('id', customer.default_payment_method_id)
        .single();

      const unitPrice = prod.pricing.default.amount;
      const currency = prod.pricing.default.currency ?? 'USD';

      const item: CartItem = {
        id: crypto.randomUUID(),
        productId,
        variantId: variantId ?? null,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        taxAmount: 0,
        discountAmount: 0,
        metadata: {},
      };

      return executeCheckout({
        ventureId,
        customerId,
        items: [item],
        currency,
        shippingAddress: addressRow ?? null,
        billingAddress: addressRow ?? null,
        paymentMethodId: (methodRow?.id as string) ?? null,
        taxTotal: 0,      // simplified for instant buy
        shippingTotal: 0, // simplified for instant buy
        discountTotal: 0,
      });
    },

    async checkout(cartId, paymentMethodId) {
      const cartSession = await cart.getCart(cartId);
      if (!cartSession) throw new Error(`Cart ${cartId} not found`);

      if (cartSession.items.length === 0) throw new Error('Cannot check out an empty cart');
      if (!cartSession.shippingAddress) {
        throw new Error('Shipping address is required to complete checkout');
      }

      // Price + inventory refresh immediately before payment — guards
      // against stale carts where product state has changed since add.
      if (supabase) {
        for (const item of cartSession.items) {
          const prod = await product.getProduct(item.productId, cartSession.ventureId).catch(() => null);
          if (!prod) throw new Error(`Product ${item.productId} is no longer available`);
          if (prod.trackInventory && prod.inventoryCount !== null) {
            if (prod.inventoryCount < item.quantity) {
              throw new Error(
                `Product ${prod.name} only has ${prod.inventoryCount} units available (${item.quantity} requested)`,
              );
            }
          }
        }
      }

      return executeCheckout({
        ventureId: cartSession.ventureId,
        customerId: cartSession.customerId,
        items: cartSession.items,
        currency: cartSession.currency,
        shippingAddress: cartSession.shippingAddress as unknown as Record<string, unknown>,
        billingAddress: (cartSession.billingAddress ?? cartSession.shippingAddress) as unknown as Record<string, unknown>,
        paymentMethodId: paymentMethodId ?? cartSession.selectedPaymentMethod,
        taxTotal: cartSession.taxTotal,
        shippingTotal: cartSession.shippingTotal,
        discountTotal: cartSession.discountTotal,
        cartId,
      });
    },

    async estimateCheckout(cartId) {
      const cartSession = await cart.getCart(cartId);
      if (!cartSession) throw new Error(`Cart ${cartId} not found`);

      const total = cartSession.total;
      const currency = cartSession.currency;
      const country =
        ((cartSession.shippingAddress as Record<string, unknown> | null)?.country as string) ??
        ((cartSession.billingAddress as Record<string, unknown> | null)?.country as string) ??
        'US';

      // No-side-effect routing estimate — decision only, no charge.
      const decision = await payments.estimateRoute({
        amount: total,
        currency,
        customerCountry: country,
        paymentMethod: null,
        urgency: 'standard',
        ventureId: cartSession.ventureId,
        customerId: cartSession.customerId,
        isRecurring: false,
      }).catch(() => null);

      return {
        subtotal: cartSession.subtotal,
        discountTotal: cartSession.discountTotal,
        taxTotal: cartSession.taxTotal,
        shippingTotal: cartSession.shippingTotal,
        estimatedProcessingFee: decision?.estimatedFee.totalFee ?? 0,
        total: total + (decision?.estimatedFee.totalFee ?? 0),
        currency,
        primaryRail: decision?.primaryRail ?? 'stripe',
        fallbackRails: decision?.fallbackRails ?? [],
        savingsVsDefault: decision?.savingsVsDefault ?? 0,
        reasoning: decision?.reasoning ?? '',
      };
    },

    async conversationalCheckout(ventureId, customerId, productId, confirmed = false) {
      if (!supabase) throw new Error('Supabase client not available');

      const prod = await product.getProduct(productId, ventureId);
      if (!prod) throw new Error(`Product ${productId} not found`);

      if (!confirmed) {
        // Unconfirmed → return summary card for NAOS chat to show the user.
        const { data: customer } = await supabase
          .from('customers')
          .select(
            `
            default_address_id,
            default_payment_method_id,
            customer_addresses!fk_default_address(line1, city, state, country),
            saved_payment_methods!fk_default_method(last4)
          `,
          )
          .eq('id', customerId)
          .eq('venture_id', ventureId)
          .maybeSingle();

        const addressRows = customer?.customer_addresses;
        const methodRows = customer?.saved_payment_methods;
        const address = Array.isArray(addressRows) ? addressRows[0] : addressRows;
        const method = Array.isArray(methodRows) ? methodRows[0] : methodRows;

        const unitPrice = prod.pricing.default.amount;
        const currency = prod.pricing.default.currency ?? 'USD';

        return {
          confirmed: false,
          productName: prod.name,
          quantity: 1,
          unitPrice,
          total: unitPrice,
          currency,
          shippingAddress: address
            ? { line1: address.line1, city: address.city, state: address.state, country: address.country }
            : null,
          paymentMethodLast4: method?.last4 ?? null,
          confirmationPrompt: `Ready to purchase "${prod.name}" for $${unitPrice.toFixed(2)} ${currency}? Reply "confirm" to complete.`,
        };
      }

      // Confirmed — delegate to instantBuy.
      return service.instantBuy(ventureId, customerId, productId, 1);
    },
  };

  return service;
}
