// Thin shim — canonical implementation lives in @mcv/commerce-sdk/cart-service.
// Binds createCartService to the app's Supabase, compliance tax-engine, and
// product-service.
import {
  createCartService,
  type TaxAdapter,
  type ProductAdapter,
} from '@mcv/commerce-sdk/cart-service';
import { supabase } from '../supabase';
import { calculateTax as svcCalculateTax } from '../compliance/tax-engine';
import { getProduct as svcGetProduct } from './product-service';

const tax: TaxAdapter = {
  calculateTax: (input) => svcCalculateTax(input),
};

const product: ProductAdapter = {
  getProduct: (id, ventureId) => svcGetProduct(id, ventureId),
};

const service = createCartService({ supabase, tax, product });

export const createCart = service.createCart;
export const getCart = service.getCart;
export const getCartBySession = service.getCartBySession;
export const getCartByCustomer = service.getCartByCustomer;
export const addToCart = service.addToCart;
export const removeFromCart = service.removeFromCart;
export const updateQuantity = service.updateQuantity;
export const applyDiscountCode = service.applyDiscountCode;
export const removeDiscountCode = service.removeDiscountCode;
export const setShippingAddress = service.setShippingAddress;
export const setBillingAddress = service.setBillingAddress;
export const selectPaymentMethod = service.selectPaymentMethod;
export const selectShippingMethod = service.selectShippingMethod;
export const mergeGuestCart = service.mergeGuestCart;
export const markAbandoned = service.markAbandoned;
export const getAbandonedCarts = service.getAbandonedCarts;
export const clearCart = service.clearCart;

export { mapCartRow, mapCartItemRow } from '@mcv/commerce-sdk/cart-service';
export type {
  CartService,
  TaxAdapter,
  ProductAdapter,
} from '@mcv/commerce-sdk/cart-service';
