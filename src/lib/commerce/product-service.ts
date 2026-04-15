// Thin shim — canonical implementation lives in @mcv/commerce-sdk/product-service.
import { createProductService } from '@mcv/commerce-sdk/product-service';
import { supabase } from '../supabase';

const service = createProductService({ supabase });

export const createProduct = service.createProduct;
export const updateProduct = service.updateProduct;
export const getProduct = service.getProduct;
export const listProducts = service.listProducts;
export const archiveProduct = service.archiveProduct;
export const searchProducts = service.searchProducts;

export { mapProductRow } from '@mcv/commerce-sdk/product-service';
export type { ProductService, ListProductsFilters } from '@mcv/commerce-sdk/product-service';
