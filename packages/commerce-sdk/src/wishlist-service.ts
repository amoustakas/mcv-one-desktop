// @mcv/commerce-sdk/wishlist-service — wishlists, sharing, price-drop, cart migration.
//
// DI-factory around 9 methods. Wishlists support public share URLs
// (nanoid-generated) and price-drop tracking based on the price snapshot
// captured at add-time. moveToCart pulls the item into a cart row then
// removes the wishlist entry through the same factory instance.

import { nanoid } from 'nanoid';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Wishlist, WishlistItem } from './surface-types';

// ─── Row mappers ────────────────────────────────────────────────────────

function mapWishlistItemRow(row: Record<string, unknown>): WishlistItem {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    variantId: (row.variant_id as string) ?? null,
    addedAt: row.added_at as string,
    priceWhenAdded: Number(row.price_when_added ?? 0),
    notifyOnPriceDrop: (row.notify_on_price_drop as boolean) ?? true,
  };
}

function mapWishlistRow(row: Record<string, unknown>, items: WishlistItem[]): Wishlist {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    ventureId: row.venture_id as string,
    name: (row.name as string) ?? 'My Wishlist',
    isPublic: (row.is_public as boolean) ?? false,
    shareUrl: (row.share_url as string) ?? null,
    items,
    createdAt: row.created_at as string,
  };
}

// ─── Engine interface ──────────────────────────────────────────────────

export interface WishlistService {
  createWishlist(customerId: string, ventureId: string, name?: string): Promise<Wishlist>;
  getWishlist(wishlistId: string): Promise<Wishlist | null>;
  getCustomerWishlists(customerId: string, ventureId: string): Promise<Wishlist[]>;
  addToWishlist(wishlistId: string, productId: string, variantId?: string | null): Promise<Wishlist>;
  removeFromWishlist(wishlistId: string, itemId: string): Promise<Wishlist>;
  togglePublic(wishlistId: string, isPublic: boolean): Promise<Wishlist>;
  getPublicWishlist(shareUrl: string): Promise<Wishlist | null>;
  getPriceDropItems(
    ventureId: string,
  ): Promise<Array<{ wishlistItem: WishlistItem; wishlistId: string; customerId: string; currentPrice: number }>>;
  moveToCart(wishlistId: string, itemId: string, cartId: string): Promise<void>;
}

export interface WishlistServiceOptions {
  supabase: SupabaseClient | null;
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createWishlistService({ supabase }: WishlistServiceOptions): WishlistService {
  // Internal: fetch wishlist + items in two queries. Closed over supabase,
  // not exposed on the returned interface.
  async function fetchWishlistWithItems(wishlistId: string): Promise<Wishlist | null> {
    if (!supabase) return null;

    const { data: wishlist, error: wishlistError } = await supabase
      .from('wishlists')
      .select()
      .eq('id', wishlistId)
      .single();

    if (wishlistError?.code === 'PGRST116') return null;
    if (wishlistError) throw new Error(`Failed to fetch wishlist: ${wishlistError.message}`);

    const { data: items, error: itemsError } = await supabase
      .from('wishlist_items')
      .select()
      .eq('wishlist_id', wishlistId)
      .order('added_at', { ascending: false });

    if (itemsError) throw new Error(`Failed to fetch wishlist items: ${itemsError.message}`);

    return mapWishlistRow(wishlist, (items ?? []).map(mapWishlistItemRow));
  }

  const service: WishlistService = {
    async createWishlist(customerId, ventureId, name = 'My Wishlist') {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('wishlists')
        .insert({
          customer_id: customerId,
          venture_id: ventureId,
          name,
          is_public: false,
          share_url: null,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create wishlist: ${error.message}`);
      return mapWishlistRow(data, []);
    },

    getWishlist: fetchWishlistWithItems,

    async getCustomerWishlists(customerId, ventureId) {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('wishlists')
        .select()
        .eq('customer_id', customerId)
        .eq('venture_id', ventureId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to get customer wishlists: ${error.message}`);

      const wishlists: Wishlist[] = [];
      for (const row of data ?? []) {
        const full = await fetchWishlistWithItems(row.id as string);
        if (full) wishlists.push(full);
      }
      return wishlists;
    },

    async addToWishlist(wishlistId, productId, variantId) {
      if (!supabase) throw new Error('Supabase client not available');

      let priceWhenAdded = 0;
      const { data: productData } = await supabase
        .from('products')
        .select('price')
        .eq('id', productId)
        .single();
      if (productData?.price != null) priceWhenAdded = Number(productData.price);

      const { error } = await supabase
        .from('wishlist_items')
        .upsert(
          {
            wishlist_id: wishlistId,
            product_id: productId,
            variant_id: variantId ?? null,
            added_at: new Date().toISOString(),
            price_when_added: priceWhenAdded,
            notify_on_price_drop: true,
          },
          { onConflict: 'wishlist_id,product_id,variant_id' },
        );

      if (error) throw new Error(`Failed to add item to wishlist: ${error.message}`);

      const updated = await fetchWishlistWithItems(wishlistId);
      if (!updated) throw new Error('Wishlist not found after add');
      return updated;
    },

    async removeFromWishlist(wishlistId, itemId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId)
        .eq('wishlist_id', wishlistId);

      if (error) throw new Error(`Failed to remove item from wishlist: ${error.message}`);

      const updated = await fetchWishlistWithItems(wishlistId);
      if (!updated) throw new Error('Wishlist not found after remove');
      return updated;
    },

    async togglePublic(wishlistId, isPublic) {
      if (!supabase) throw new Error('Supabase client not available');

      const shareUrl = isPublic ? `wl_${nanoid(16)}` : null;

      const { error } = await supabase
        .from('wishlists')
        .update({ is_public: isPublic, share_url: shareUrl })
        .eq('id', wishlistId);

      if (error) throw new Error(`Failed to toggle wishlist visibility: ${error.message}`);

      const updated = await fetchWishlistWithItems(wishlistId);
      if (!updated) throw new Error('Wishlist not found');
      return updated;
    },

    async getPublicWishlist(shareUrl) {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('wishlists')
        .select()
        .eq('share_url', shareUrl)
        .eq('is_public', true)
        .single();

      if (error?.code === 'PGRST116') return null;
      if (error) throw new Error(`Failed to get public wishlist: ${error.message}`);

      return fetchWishlistWithItems(data.id as string);
    },

    async getPriceDropItems(ventureId) {
      if (!supabase) return [];

      const { data: items, error } = await supabase
        .from('wishlist_items')
        .select(
          `
          *,
          wishlists!inner(customer_id, venture_id)
        `,
        )
        .eq('wishlists.venture_id', ventureId)
        .eq('notify_on_price_drop', true);

      if (error) throw new Error(`Failed to fetch wishlist items: ${error.message}`);
      if (!items || items.length === 0) return [];

      const productIds = [
        ...new Set((items as Record<string, unknown>[]).map((i) => i.product_id as string)),
      ];
      const { data: products } = await supabase
        .from('products')
        .select('id, price')
        .in('id', productIds);

      const priceMap = new Map<string, number>(
        (products ?? []).map((p: Record<string, unknown>) => [p.id as string, Number(p.price)]),
      );

      const drops: Array<{
        wishlistItem: WishlistItem;
        wishlistId: string;
        customerId: string;
        currentPrice: number;
      }> = [];

      for (const item of items as Record<string, unknown>[]) {
        const currentPrice = priceMap.get(item.product_id as string) ?? 0;
        const priceWhenAdded = Number(item.price_when_added ?? 0);
        if (currentPrice < priceWhenAdded) {
          const wishlistMeta = item.wishlists as Record<string, unknown>;
          drops.push({
            wishlistItem: mapWishlistItemRow(item),
            wishlistId: item.wishlist_id as string,
            customerId: wishlistMeta.customer_id as string,
            currentPrice,
          });
        }
      }

      return drops;
    },

    async moveToCart(wishlistId, itemId, cartId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: item, error: fetchError } = await supabase
        .from('wishlist_items')
        .select()
        .eq('id', itemId)
        .eq('wishlist_id', wishlistId)
        .single();

      if (fetchError || !item) throw new Error('Wishlist item not found');

      const witem = mapWishlistItemRow(item);

      const { error: cartError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: witem.productId,
          variant_id: witem.variantId,
          quantity: 1,
          unit_price: witem.priceWhenAdded,
          total_price: witem.priceWhenAdded,
          tax_amount: 0,
          discount_amount: 0,
          metadata: {},
        });

      if (cartError) throw new Error(`Failed to add item to cart: ${cartError.message}`);

      await service.removeFromWishlist(wishlistId, itemId);
    },
  };

  return service;
}
