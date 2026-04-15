// Thin shim — canonical implementation lives in @mcv/commerce-sdk/commerce-analytics.
import { createCommerceAnalytics } from '@mcv/commerce-sdk/commerce-analytics';
import { supabase } from '../supabase';

const engine = createCommerceAnalytics({ supabase });

export const getConversionFunnel = engine.getConversionFunnel;
export const getCartAbandonment = engine.getCartAbandonment;
export const getTopProducts = engine.getTopProducts;
export const getCustomerAnalytics = engine.getCustomerAnalytics;
export const getRevenueByChannel = engine.getRevenueByChannel;
export const getFullAnalytics = engine.getFullAnalytics;

export type { DateRange, CommerceAnalyticsEngine } from '@mcv/commerce-sdk/commerce-analytics';
