// src/lib/commerce/search-engine.ts
// Commerce Surface Layer — Product Search Engine
// Full-text search, autocomplete, popular searches, and analytics tracking

import { supabase } from '../supabase';
import type { SearchFilters, SearchResult } from './surface-types';

// ─────────────────────────────────────────────────────────
// SEARCH PRODUCTS (full-text with filters)
// ─────────────────────────────────────────────────────────

export async function searchProducts(
  ventureId: string,
  query: string,
  filters?: SearchFilters,
): Promise<SearchResult> {
  if (!supabase) {
    return { query, totalCount: 0, products: [], facets: { categories: [], priceRange: { min: 0, max: 0 }, tags: [] } };
  }

  // Build base query — full-text search on name + description
  let dbQuery = supabase
    .from('products')
    .select('id, name, description, pricing, category_ids, tags, type, status')
    .eq('venture_id', ventureId)
    .neq('status', 'archived')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

  // Apply optional filters
  if (filters?.inStock === true) {
    dbQuery = dbQuery.gt('inventory_count', 0);
  }
  if (filters?.productType && filters.productType.length > 0) {
    dbQuery = dbQuery.in('type', filters.productType);
  }
  if (filters?.priceRange) {
    // Price is stored as JSONB pricing.default.amount — approximate via ilike not possible
    // We'll do client-side filtering after fetch for price range
  }

  // Apply sort
  const sortBy = filters?.sortBy ?? 'relevance';
  if (sortBy === 'newest') {
    dbQuery = dbQuery.order('created_at', { ascending: false });
  } else if (sortBy === 'price_asc' || sortBy === 'price_desc') {
    // Sort by name as fallback — price is in JSONB
    dbQuery = dbQuery.order('name', { ascending: sortBy === 'price_asc' });
  } else {
    dbQuery = dbQuery.order('name', { ascending: true });
  }

  dbQuery = dbQuery.limit(100);

  const { data, error } = await dbQuery;
  if (error) throw new Error(`Search failed: ${error.message}`);

  let products = data ?? [];

  // Client-side price range filter (price is in JSONB)
  if (filters?.priceRange) {
    const { min, max } = filters.priceRange;
    products = products.filter((p) => {
      const pricing = p.pricing as { default?: { amount: number } } | null;
      const amount = pricing?.default?.amount ?? 0;
      return amount >= min && amount <= max;
    });
  }

  // Client-side tag filter
  if (filters?.tags && filters.tags.length > 0) {
    const filterTags = filters.tags;
    products = products.filter((p) => {
      const pTags = (p.tags as string[]) ?? [];
      return filterTags.some((t) => pTags.includes(t));
    });
  }

  // Client-side category filter
  if (filters?.categories && filters.categories.length > 0) {
    const filterCats = filters.categories;
    products = products.filter((p) => {
      const pCats = (p.category_ids as string[]) ?? [];
      return filterCats.some((c) => pCats.includes(c));
    });
  }

  // Rating filter — requires join with reviews table
  if (filters?.rating) {
    // We'd need a rating cache; skip for now and note it
    // In production: join with products_rating_cache table
  }

  // Build facets from result set
  const allCategories = new Map<string, number>();
  const allTags = new Map<string, number>();
  let priceMin = Infinity;
  let priceMax = 0;

  for (const p of products) {
    const pricing = p.pricing as { default?: { amount: number } } | null;
    const amount = pricing?.default?.amount ?? 0;
    if (amount < priceMin) priceMin = amount;
    if (amount > priceMax) priceMax = amount;

    for (const cat of (p.category_ids as string[]) ?? []) {
      allCategories.set(cat, (allCategories.get(cat) ?? 0) + 1);
    }
    for (const tag of (p.tags as string[]) ?? []) {
      allTags.set(tag, (allTags.get(tag) ?? 0) + 1);
    }
  }

  // Score: products where name matches get higher score
  const lowerQuery = query.toLowerCase();
  const scored = products.map((p) => {
    const nameMatch = (p.name as string).toLowerCase().includes(lowerQuery);
    const score = nameMatch ? 1.0 : 0.6;
    const desc = p.description as string | null;
    const highlight = desc ? desc.slice(0, 120) : null;
    return {
      productId: p.id as string,
      name: p.name as string,
      score,
      highlight,
    };
  });

  // Sort by score descending if relevance
  if (sortBy === 'relevance') {
    scored.sort((a, b) => b.score - a.score);
  }

  // Track this search
  trackSearch(ventureId, query, scored.length).catch(() => {});

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
}

// ─────────────────────────────────────────────────────────
// SUGGEST PRODUCTS (autocomplete)
// ─────────────────────────────────────────────────────────

export async function suggestProducts(
  ventureId: string,
  query: string,
): Promise<Array<{ productId: string; name: string }>> {
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
}

// ─────────────────────────────────────────────────────────
// POPULAR SEARCHES
// ─────────────────────────────────────────────────────────

export async function getPopularSearches(
  ventureId: string,
  limit = 10,
): Promise<Array<{ query: string; count: number }>> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('search_analytics')
    .select('query')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    // Table may not exist yet — return empty
    return [];
  }

  // Aggregate client-side
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const q = (row.query as string).toLowerCase();
    counts.set(q, (counts.get(q) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query, count]) => ({ query, count }));
}

// ─────────────────────────────────────────────────────────
// TRACK SEARCH
// ─────────────────────────────────────────────────────────

export async function trackSearch(
  ventureId: string,
  query: string,
  resultsCount: number,
  clickedProductId?: string | null,
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from('search_analytics').insert({
    venture_id: ventureId,
    query,
    results_count: resultsCount,
    clicked_product_id: clickedProductId ?? null,
    converted: false,
    created_at: new Date().toISOString(),
  });

  // Swallow errors — analytics tracking is best-effort
  if (error) {
    // Table may not exist yet — silently skip
  }
}

// ─────────────────────────────────────────────────────────
// TRACK CONVERSION
// ─────────────────────────────────────────────────────────

export async function trackConversion(
  ventureId: string,
  query: string,
  productId: string,
): Promise<void> {
  if (!supabase) return;

  await supabase
    .from('search_analytics')
    .update({ converted: true })
    .eq('venture_id', ventureId)
    .eq('query', query)
    .eq('clicked_product_id', productId)
    .eq('converted', false);
}
