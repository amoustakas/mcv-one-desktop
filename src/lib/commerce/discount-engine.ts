// Thin shim — canonical implementation lives in @mcv/commerce-sdk/discount-engine.
import { createDiscountEngine } from '@mcv/commerce-sdk/discount-engine';
import { supabase } from '../supabase';

const engine = createDiscountEngine({ supabase });

export const createDiscount = engine.createDiscount;
export const getDiscount = engine.getDiscount;
export const getDiscountByCode = engine.getDiscountByCode;
export const listDiscounts = engine.listDiscounts;
export const updateDiscount = engine.updateDiscount;
export const disableDiscount = engine.disableDiscount;
export const validateDiscount = engine.validateDiscount;
export const applyDiscounts = engine.applyDiscounts;
export const incrementUsage = engine.incrementUsage;

export { calculateBXGY } from '@mcv/commerce-sdk/discount-engine';
export type {
  DiscountEngine,
  BXGYResult,
  ApplyDiscountsResult,
  ListDiscountsFilters,
} from '@mcv/commerce-sdk/discount-engine';
