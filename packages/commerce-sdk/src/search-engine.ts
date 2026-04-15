// @mcv/commerce-sdk/search-engine — product search + autocomplete factory.
//
// Establishes the DI-factory pattern for commerce services. Each engine
// takes { supabase } (and future engines will take additional deps like
// ledger or payments), returns an object with the historical function
// names so the app-side shim is trivial.
//
// Null supabase degrades to empty results — hosts can instantiate before
// DB bootstrap without throwing.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SearchFilters, SearchResult } from './surface-types';

// ─── Engine interface ──────────────────────────────────────────────────

export interface SearchEngine {
  searchProducts(ventureId: string, query: string, filters?: SearchFilters): Promise<SearchResult>;
  suggestProducts(ventureId: string, query: string): Promise<Array<{ productId: string; name: string }>>;
  getPopularSearches(ventureId: string, limit?: number): Promise<Array<{ query: string; count: number }>>;
  trackSearch(
    ventureId: string,
    query: string,
    resultsCount: number,
    clickedProductId?: string | null,
  ): Promise<void>;
  trackConversion(ventureId: string, query: string, productId: string): Promise<void>;
}

export interface SearchEngineOptions {
  supabase: SupabaseClient | null;
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createSearchEngine({ supabase }: SearchEngineOptions): SearchEngine {
  const service: SearchEngine = {
    async searchProducts(ventureId, query, filters) {
      if (!supabase) {
        return { query, totalCount: 0, products: [], facets: { categories: [], priceRange: { min: 0, max: 0 }, tags: [] } };
      }

      let dbQuery = supabase
        .from('products')
        .select('id, name, description, pricing, category_ids, tags, type, status')
        .eq('venture_id', ventureId)
        .neq('status', 'archived')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

      if (filters?.inStock === true) {
        dbQuery = dbQuery.gt('inventory_count', 0);
      }
      if (filters?.productType && filters.productType.length > 0) {
        dbQuery = dbQuery.in('type', filters.productType);
      }
      // priceRange + tags + categories filtered client-side because pricing
      // is JSONB and the other two are arrays we'd need PostgREST array ops
      // for — fine at 100-row caps.

      const sortBy = filters?.sortBy ?? 'relevance';
      if (sortBy === 'newest') {
        dbQuery = dbQuery.order('created_at', { ascending: false });
      } else if (sortBy === 'price_asc' || sortBy === 'price_desc') {
        dbQuery = dbQuery.order('name', { ascending: sortBy === 'price_asc' });
      } else {
        dbQuery = dbQuery.order('name', { ascending: true });
      }

      dbQuery = dbQuery.limit(100);

      const { data, error } = await dbQuery;
      if (error) throw new Error(`Search failed: ${error.message}`);

      let products = (data ?? []) as Array<{
        id: string;
        name: string;
        description: string | null;
        pricing: { default?: { amount: number } } | null;
        category_ids: string[] | null;
        tags: string[] | null;
      }>;

      if (filters?.priceRange) {
        const { min, max } = filters.priceRange;
        products = products.filter((p) => {
          const amount = p.pricing?.default?.amount ?? 0;
          return amount >= min && amount <= max;
        });
      }
      if (filters?.tags && filters.tags.length > 0) {
        const filterTags = filters.tags;
        products = products.filter((p) => {
          const pTags = p.tags ?? [];
          return filterTags.some((t) => pTags.includes(t));
        });
      }
      if (filters?.categories && filters.categories.length > 0) {
        const filterCats = filters.categories;
        products = products.filter((p) => {
          const pCats = p.category_ids ?? [];
          return filterCats.some((c) => pCats.includes(c));
        });
      }
      // Rating filter pending a products_rating_cache table — no-op today.

      const allCategories = new Map<string, number>();
      const allTags = new Map<string, number>();
      let priceMin = Infinity;
      let priceMax = 0;

      for (const p of products) {
        const amount = p.pricing?.default?.amount ?? 0;
        if (amount < priceMin) priceMin = amount;
        if (amount > priceMax) priceMax = amount;

        for (const cat of p.category_ids ?? []) {
          allCategories.set(cat, (allCategories.get(cat) ?? 0) + 1);
        }
        for (const tag of p.tags ?? []) {
          allTags.set(tag, (allTags.get(tag) ?? 0) + 1);
        }
      }

      const lowerQuery = query.toLowerCase();
      const scored = products.map((p) => {
        const nameMatch = p.name.toLowerCase().includes(lowerQuery);
        const score = nameMatch ? 1.0 : 0.6;
        const highlight = p.description ? p.description.slice(0, 120) : null;
        return { productId: p.id, name: p.name, score, highlight };
      });

      if (sortBy === 'relevance') {
        scored.sort((a, b) => b.score - a.score);
      }

      // Fire-and-forget analytics — never block the search response.
      service.trackSearch(ventureId, query, scored.length).catch(() => { /* swallow */ });

      return {
        query,
        totalCount: scored.length,
        products: scored,
        facets: {
          categories: Array.from(allCategories.entries()).map(([id, count]) => ({ id, count })),
          priceRange: { min: priceMin === Infinity ? 0 : priceMin, max: priceMax },
          tags: Array.from(allTags.entries()).map(([tag, count]) => ({ tag, count })),
        },
      };
    },

    async suggestProducts(ventureId, query) {
      if (!supabase || !query.trim()) return [];

      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('venture_id', ventureId)
        .neq('status', 'archived')
        .ilike('name', `${query}%`)
        .order('name', { ascending: true })
        .limit(5);

      if (error) throw new Error(`Suggest failed: ${error.message}`);

      return (data ?? []).map((p) => ({ productId: p.id as string, name: p.name as string }));
    },

    async getPopularSearches(ventureId, limit = 10) {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('search_analytics')
        .select('query')
        .eq('venture_id', ventureId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        // Table may not exist yet — degrade to empty.
        return [];
      }

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        const q = (row.query as string).toLowerCase();
        counts.set(q, (counts.get(q) ?? 0) + 1);
      }

      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([query, count]) => ({ query, count }));
    },

    async trackSearch(ventureId, query, resultsCount, clickedProductId) {
      if (!supabase) return;

      // Swallow errors — tracking is best-effort.
      await supabase.from('search_analytics').insert({
        venture_id: ventureId,
        query,
        results_count: resultsCount,
        clicked_product_id: clickedProductId ?? null,
        converted: false,
        created_at: new Date().toISOString(),
      });
    },

    async trackConversion(ventureId, query, productId) {
      if (!supabase) return;

      await supabase
        .from('search_analytics')
        .update({ converted: true })
        .eq('venture_id', ventureId)
        .eq('query', query)
        .eq('clicked_product_id', productId)
        .eq('converted', false);
    },
  };

  return service;
}
