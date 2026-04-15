// Thin shim — canonical implementation lives in @mcv/commerce-sdk/search-engine.
// Binds createSearchEngine to the app's Supabase client and re-exports the
// historical function surface so consumers stay unchanged.
import { createSearchEngine } from '@mcv/commerce-sdk/search-engine';
import { supabase } from '../supabase';

const engine = createSearchEngine({ supabase });

export const searchProducts = engine.searchProducts;
export const suggestProducts = engine.suggestProducts;
export const getPopularSearches = engine.getPopularSearches;
export const trackSearch = engine.trackSearch;
export const trackConversion = engine.trackConversion;

export type { SearchEngine } from '@mcv/commerce-sdk/search-engine';
