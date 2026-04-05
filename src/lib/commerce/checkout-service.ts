// @ts-nocheck
// src/lib/commerce/checkout-service.ts
// Commerce Surface Layer — Checkout Service
// Orchestrates cart → order → payment → ledger

import { supabase } from '../supabase';
import { paymentRouter } from '../payments/router';
import { createJournalEntry, postJournalEntry, getAccountByCode } from '../ledger/service';
import { getCart, clearCart } from './cart-service';
import { getProduct } from './product-service';
import type { CartSession, CartItem } from './surface-types';
import type { PaymentRequest } from '../payments/types';

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────
// INTERNAL: CORE EXECUTION ENGINE
// ─────────────────────────────────────────────────────────

async function _executeCheckout(
  ventureId: string,
  customerId: string | null,
  items: CartItem[],
  currency: string,
  shippingAddress: Record<string, unknown> | null,
  billingAddress: Record<string, unknown> | null,
  paymentMethodId: string | null,
  taxTotal: number,
  shippingTotal: number,
  discountTotal: number,
  cartId?: string,
): Promise<OrderConfirmation> {
  if (!supabase) throw new Error('Supabase client not available');

  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  const total = Math.max(0, subtotal - discountTotal + taxTotal + shippingTotal);

  // 1. Process payment
  const paymentReq: PaymentRequest = {
    amount: total,
    currency,
    method: null, // let router decide
    customerId: customerId ?? null,
    customerCountry:
      (shippingAddress?.country as string) ??
      (billingAddress?.country as string) ??
      'US',
    ventureId,
    description: `Order for ${items.length} item(s)`,
    metadata: { cartId: cartId ?? null },
  };

  const { result: paymentResult, decision } = await paymentRouter.processPayment(paymentReq);

  if (!paymentResult.success) {
    throw new Error(`Payment failed: ${paymentResult.error ?? 'Unknown error'}`);
  }

  // 2. Create order record
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

  // 3. Create order items
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

  // 4. Reserve inventory (decrement available count for tracked products)
  for (const item of items) {
    const product = await getProduct(item.productId, ventureId).catch(() => null);
    if (product?.trackInventory && product.inventoryCount !== null) {
      await supabase
        .from('products')
        .update({
          inventory_count: Math.max(0, product.inventoryCount - item.quantity),
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.productId)
        .eq('venture_id', ventureId);
    }
  }

  // 5. Create transaction record
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
  }).then(() => null).catch(() => null); // non-fatal

  // 6. Create ledger entries (DR Cash / CR Revenue)
  try {
    const [cashAccount, revenueAccount] = await Promise.all([
      getAccountByCode(ventureId, '1010'), // Cash
      getAccountByCode(ventureId, '4000'), // Revenue
    ]);

    if (cashAccount && revenueAccount) {
      const entry = await createJournalEntry({
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

      await postJournalEntry(entry.id, 'system:checkout').catch(() => null);
    }
  } catch {
    // Non-fatal — ledger errors should not block order confirmation
  }

  // 7. Clear the originating cart (if provided)
  if (cartId) {
    await clearCart(cartId).catch(() => null);
  }

  // 8. Trigger notification (fire-and-forget)
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
    paymentStatus: paymentResult.status as string,
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
    shippingAddress: shippingAddress,
    estimatedFee: decision.estimatedFee.totalFee,
    savingsVsDefault: decision.savingsVsDefault,
    createdAt: order.created_at as string,
  };
}

// ─────────────────────────────────────────────────────────
// PUBLIC: INSTANT BUY
// ─────────────────────────────────────────────────────────

export async function instantBuy(
  ventureId: string,
  customerId: string,
  productId: string,
  quantity = 1,
  variantId?: string | null,
): Promise<OrderConfirmation> {
  if (!supabase) throw new Error('Supabase client not available');

  // Validate product
  const product = await getProduct(productId, ventureId);
  if (!product) throw new Error(`Product ${productId} not found`);

  // Load customer's saved address + payment method
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('default_address_id, default_payment_method_id')
    .eq('id', customerId)
    .eq('venture_id', ventureId)
    .single();

  if (customerError) throw new Error(`Customer not found: ${customerError.message}`);

  if (!customer.default_payment_method_id) {
    throw new Error(
      'No saved payment method found. Please add a payment method before using Instant Buy.',
    );
  }
  if (!customer.default_address_id) {
    throw new Error(
      'No saved shipping address found. Please add an address before using Instant Buy.',
    );
  }

  // Fetch default address
  const { data: addressRow } = await supabase
    .from('customer_addresses')
    .select()
    .eq('id', customer.default_address_id)
    .single();

  // Fetch default payment method
  const { data: methodRow } = await supabase
    .from('saved_payment_methods')
    .select()
    .eq('id', customer.default_payment_method_id)
    .single();

  const unitPrice = product.pricing.default.amount;
  const currency = product.pricing.default.currency ?? 'USD';

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

  return _executeCheckout(
    ventureId,
    customerId,
    [item],
    currency,
    addressRow ?? null,
    addressRow ?? null,
    methodRow?.id as string ?? null,
    0, // tax — simplified for instant buy
    0, // shipping — simplified for instant buy
    0,
    undefined,
  );
}

// ─────────────────────────────────────────────────────────
// PUBLIC: FULL CART CHECKOUT
// ─────────────────────────────────────────────────────────

export async function checkout(
  cartId: string,
  paymentMethodId?: string,
): Promise<OrderConfirmation> {
  const cart = await getCart(cartId);
  if (!cart) throw new Error(`Cart ${cartId} not found`);

  if (cart.items.length === 0) throw new Error('Cannot check out an empty cart');

  if (!cart.shippingAddress) {
    throw new Error('Shipping address is required to complete checkout');
  }

  // Validate current prices (refresh from products)
  if (supabase) {
    for (const item of cart.items) {
      const product = await getProduct(item.productId, cart.ventureId).catch(() => null);
      if (!product) throw new Error(`Product ${item.productId} is no longer available`);
      if (product.trackInventory && product.inventoryCount !== null) {
        if (product.inventoryCount < item.quantity) {
          throw new Error(
            `Product ${product.name} only has ${product.inventoryCount} units available (${item.quantity} requested)`,
          );
        }
      }
    }
  }

  return _executeCheckout(
    cart.ventureId,
    cart.customerId,
    cart.items,
    cart.currency,
    cart.shippingAddress as unknown as Record<string, unknown>,
    (cart.billingAddress ?? cart.shippingAddress) as unknown as Record<string, unknown>,
    paymentMethodId ?? cart.selectedPaymentMethod,
    cart.taxTotal,
    cart.shippingTotal,
    cart.discountTotal,
    cartId,
  );
}

// ─────────────────────────────────────────────────────────
// PUBLIC: ESTIMATE CHECKOUT (no side effects)
// ─────────────────────────────────────────────────────────

export async function estimateCheckout(cartId: string): Promise<CheckoutEstimate> {
  const cart = await getCart(cartId);
  if (!cart) throw new Error(`Cart ${cartId} not found`);

  const total = cart.total;
  const currency = cart.currency;
  const country =
    (cart.shippingAddress?.country) ??
    (cart.billingAddress?.country) ??
    'US';

  // Estimate routing without executing
  const decision = await paymentRouter.estimateRoute({
    amount: total,
    currency,
    customerCountry: country,
    paymentMethod: null,
    urgency: 'standard',
    ventureId: cart.ventureId,
    customerId: cart.customerId,
    isRecurring: false,
  }).catch(() => null);

  return {
    subtotal: cart.subtotal,
    discountTotal: cart.discountTotal,
    taxTotal: cart.taxTotal,
    shippingTotal: cart.shippingTotal,
    estimatedProcessingFee: decision?.estimatedFee.totalFee ?? 0,
    total: total + (decision?.estimatedFee.totalFee ?? 0),
    currency,
    primaryRail: decision?.primaryRail ?? 'stripe',
    fallbackRails: decision?.fallbackRails ?? [],
    savingsVsDefault: decision?.savingsVsDefault ?? 0,
    reasoning: decision?.reasoning ?? '',
  };
}

// ─────────────────────────────────────────────────────────
// PUBLIC: CONVERSATIONAL CHECKOUT (NAOS chat flow)
// ─────────────────────────────────────────────────────────

export async function conversationalCheckout(
  ventureId: string,
  customerId: string,
  productId: string,
  confirmed = false,
): Promise<OrderConfirmation | ConversationalCheckoutSummary> {
  if (!supabase) throw new Error('Supabase client not available');

  const product = await getProduct(productId, ventureId);
  if (!product) throw new Error(`Product ${productId} not found`);

  if (!confirmed) {
    // Return summary for user confirmation
    const { data: customer } = await supabase
      .from('customers')
      .select(`
        default_address_id,
        default_payment_method_id,
        customer_addresses!fk_default_address(line1, city, state, country),
        saved_payment_methods!fk_default_method(last4)
      `)
      .eq('id', customerId)
      .eq('venture_id', ventureId)
      .maybeSingle();

    const addressRows = customer?.customer_addresses;
    const methodRows = customer?.saved_payment_methods;
    const address = Array.isArray(addressRows) ? addressRows[0] : addressRows;
    const method = Array.isArray(methodRows) ? methodRows[0] : methodRows;

    const unitPrice = product.pricing.default.amount;
    const currency = product.pricing.default.currency ?? 'USD';

    return {
      confirmed: false,
      productName: product.name,
      quantity: 1,
      unitPrice,
      total: unitPrice,
      currency,
      shippingAddress: address
        ? { line1: address.line1, city: address.city, state: address.state, country: address.country }
        : null,
      paymentMethodLast4: method?.last4 ?? null,
      confirmationPrompt: `Ready to purchase "${product.name}" for $${unitPrice.toFixed(2)} ${currency}? Reply "confirm" to complete.`,
    };
  }

  // Confirmed — execute instant buy
  return instantBuy(ventureId, customerId, productId, 1);
}
