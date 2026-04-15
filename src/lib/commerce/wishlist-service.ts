// Thin shim — canonical implementation lives in @mcv/commerce-sdk/wishlist-service.
import { createWishlistService } from '@mcv/commerce-sdk/wishlist-service';
import { supabase } from '../supabase';

const service = createWishlistService({ supabase });

export const createWishlist = service.createWishlist;
export const getWishlist = service.getWishlist;
export const getCustomerWishlists = service.getCustomerWishlists;
export const addToWishlist = service.addToWishlist;
export const removeFromWishlist = service.removeFromWishlist;
export const togglePublic = service.togglePublic;
export const getPublicWishlist = service.getPublicWishlist;
export const getPriceDropItems = service.getPriceDropItems;
export const moveToCart = service.moveToCart;

export type { WishlistService } from '@mcv/commerce-sdk/wishlist-service';
