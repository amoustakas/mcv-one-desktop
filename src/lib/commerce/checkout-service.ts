// Thin shim — canonical implementation lives in @mcv/commerce-sdk/checkout-service.
// The orchestration layer binds the SDK checkout engine to the app's
// 4 dependencies: ledger service, payment router, cart service, and
// product service.
import {
  createCheckoutService,
  type LedgerAdapter,
  type PaymentRouterAdapter,
  type CartAdapter,
  type ProductAdapter,
} from '@mcv/commerce-sdk/checkout-service';
import { supabase } from '../supabase';
import {
  createJournalEntry as svcCreateJournalEntry,
  postJournalEntry as svcPostJournalEntry,
  getAccountByCode as svcGetAccountByCode,
} from '../ledger/service';
import { paymentRouter } from '../payments/router';
import { getCart as svcGetCart, clearCart as svcClearCart } from './cart-service';
import { getProduct as svcGetProduct } from './product-service';

const ledger: LedgerAdapter = {
  getAccountByCode: (ventureId, code) => svcGetAccountByCode(ventureId, code),
  createJournalEntry: (input) => svcCreateJournalEntry(input),
  postJournalEntry: (entryId, postedBy) => svcPostJournalEntry(entryId, postedBy),
};

const payments: PaymentRouterAdapter = {
  // The PaymentRouter singleton already returns { result, decision } —
  // signature matches PaymentRouterAdapter.processPayment exactly.
  processPayment: (req) => paymentRouter.processPayment(req as Parameters<typeof paymentRouter.processPayment>[0]),
  estimateRoute: (input) => paymentRouter.estimateRoute(input),
};

const cart: CartAdapter = {
  getCart: (cartId) => svcGetCart(cartId),
  clearCart: (cartId) => svcClearCart(cartId),
};

const product: ProductAdapter = {
  getProduct: (id, ventureId) => svcGetProduct(id, ventureId),
};

const service = createCheckoutService({ supabase, ledger, payments, cart, product });

export const instantBuy = service.instantBuy;
export const checkout = service.checkout;
export const estimateCheckout = service.estimateCheckout;
export const conversationalCheckout = service.conversationalCheckout;

export type {
  CheckoutService,
  OrderConfirmation,
  CheckoutEstimate,
  ConversationalCheckoutSummary,
} from '@mcv/commerce-sdk/checkout-service';
