// src/lib/commerce/product-service.ts
// Commerce layer — Product CRUD, search, and type-specific validation
// Tier 5 — consumes Supabase directly (no ledger dependency for products)

import { supabase } from '../supabase';
import {
  CreateProductInput,
  type Product,
  type ProductStatus,
  type ProductType,
  type PricingConfig,
  type PhysicalConfig,
  type DigitalConfig,
  type SubscriptionConfig,
  type MeteredConfig,
  type CreditConfig,
  type LoanConfig,
  type InvestmentConfig,
  type GiftConfig,
  type TransferConfig,
} from './types';

// ─────────────────────────────────────────────────────────
// ROW MAPPER (snake_case DB → camelCase TypeScript)
// ─────────────────────────────────────────────────────────

export function mapProductRow(row: Record<string, unknown>): Product {
  const parseJson = <T>(value: unknown): T | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return value as T;
    if (typeof value === 'string') {
      try { return JSON.parse(value) as T; } catch { return null; }
    }
    return null;
  };

  const parseJsonArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') {
      try { return JSON.parse(value) as string[]; } catch { return []; }
    }
    return [];
  };

  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    type: row.type as ProductType,
    name: row.name as string,
    description: (row.description as string) ?? null,
    status: row.status as ProductStatus,
    sku: (row.sku as string) ?? null,
    pricing: parseJson<PricingConfig>(row.pricing) ?? {
      default: { amount: 0, currency: 'USD', compareAtPrice: null, costBasis: null },
      volumeTiers: [],
      wholesaleTiers: [],
    },
    categoryIds: parseJsonArray(row.category_ids),
    tags: parseJsonArray(row.tags),
    trackInventory: (row.track_inventory as boolean) ?? false,
    inventoryCount: (row.inventory_count as number) ?? null,
    taxCategoryId: (row.tax_category_id as string) ?? null,
    taxExempt: (row.tax_exempt as boolean) ?? false,
    requiresKyc: (row.requires_kyc as boolean) ?? false,
    minimumComplianceTier: (row.minimum_compliance_tier as string) ?? null,
    geoRestrictions: parseJsonArray(row.geo_restrictions),
    physical: parseJson<PhysicalConfig>(row.physical_config),
    digital: parseJson<DigitalConfig>(row.digital_config),
    subscription: parseJson<SubscriptionConfig>(row.subscription_config),
    metered: parseJson<MeteredConfig>(row.metered_config),
    credit: parseJson<CreditConfig>(row.credit_config),
    loan: parseJson<LoanConfig>(row.loan_config),
    investment: parseJson<InvestmentConfig>(row.investment_config),
    gift: parseJson<GiftConfig>(row.gift_config),
    transfer: parseJson<TransferConfig>(row.transfer_config),
    metadata: (parseJson<Record<string, unknown>>(row.metadata)) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

function buildInsertRow(input: CreateProductInput): Record<string, unknown> {
  return {
    venture_id: input.ventureId,
    type: input.type,
    name: input.name,
    description: input.description ?? null,
    status: input.status ?? 'draft',
    sku: input.sku ?? null,
    pricing: input.pricing,
    category_ids: input.categoryIds ?? [],
    tags: input.tags ?? [],
    track_inventory: input.trackInventory ?? false,
    inventory_count: input.inventoryCount ?? null,
    tax_category_id: input.taxCategoryId ?? null,
    tax_exempt: input.taxExempt ?? false,
    requires_kyc: input.requiresKyc ?? false,
    minimum_compliance_tier: input.minimumComplianceTier ?? null,
    geo_restrictions: input.geoRestrictions ?? [],
    physical_config: input.physical ?? null,
    digital_config: input.digital ?? null,
    subscription_config: input.subscription ?? null,
    metered_config: input.metered ?? null,
    credit_config: input.credit ?? null,
    loan_config: input.loan ?? null,
    investment_config: input.investment ?? null,
    gift_config: input.gift ?? null,
    transfer_config: input.transfer ?? null,
    metadata: input.metadata ?? {},
  };
}

// ─────────────────────────────────────────────────────────
// CRUD OPERATIONS
// ─────────────────────────────────────────────────────────

export async function createProduct(input: CreateProductInput): Promise<Product> {
  if (!supabase) throw new Error('Supabase client not available');

  const validated = CreateProductInput.parse(input);
  const row = buildInsertRow(validated);

  const { data, error } = await supabase
    .from('products')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Failed to create product: ${error.message}`);
  return mapProductRow(data);
}

export async function updateProduct(
  id: string,
  ventureId: string,
  updates: Partial<Omit<CreateProductInput, 'ventureId' | 'type'>>,
): Promise<Product> {
  if (!supabase) throw new Error('Supabase client not available');

  // Build partial update row — only include explicitly provided keys
  const row: Record<string, unknown> = {};

  if (updates.name !== undefined) row.name = updates.name;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.sku !== undefined) row.sku = updates.sku;
  if (updates.pricing !== undefined) row.pricing = updates.pricing;
  if (updates.categoryIds !== undefined) row.category_ids = updates.categoryIds;
  if (updates.tags !== undefined) row.tags = updates.tags;
  if (updates.trackInventory !== undefined) row.track_inventory = updates.trackInventory;
  if (updates.inventoryCount !== undefined) row.inventory_count = updates.inventoryCount;
  if (updates.taxCategoryId !== undefined) row.tax_category_id = updates.taxCategoryId;
  if (updates.taxExempt !== undefined) row.tax_exempt = updates.taxExempt;
  if (updates.requiresKyc !== undefined) row.requires_kyc = updates.requiresKyc;
  if (updates.minimumComplianceTier !== undefined) row.minimum_compliance_tier = updates.minimumComplianceTier;
  if (updates.geoRestrictions !== undefined) row.geo_restrictions = updates.geoRestrictions;
  if (updates.physical !== undefined) row.physical_config = updates.physical;
  if (updates.digital !== undefined) row.digital_config = updates.digital;
  if (updates.subscription !== undefined) row.subscription_config = updates.subscription;
  if (updates.metered !== undefined) row.metered_config = updates.metered;
  if (updates.credit !== undefined) row.credit_config = updates.credit;
  if (updates.loan !== undefined) row.loan_config = updates.loan;
  if (updates.investment !== undefined) row.investment_config = updates.investment;
  if (updates.gift !== undefined) row.gift_config = updates.gift;
  if (updates.transfer !== undefined) row.transfer_config = updates.transfer;
  if (updates.metadata !== undefined) row.metadata = updates.metadata;

  row.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('products')
    .update(row)
    .eq('id', id)
    .eq('venture_id', ventureId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update product: ${error.message}`);
  return mapProductRow(data);
}

export async function getProduct(
  id: string,
  ventureId: string,
): Promise<Product | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('products')
    .select()
    .eq('id', id)
    .eq('venture_id', ventureId)
    .single();

  if (error?.code === 'PGRST116') return null; // not found
  if (error) throw new Error(`Failed to get product: ${error.message}`);
  return mapProductRow(data);
}

export interface ListProductsFilters {
  type?: ProductType;
  status?: ProductStatus;
  categoryId?: string;
  limit?: number;
  offset?: number;
}

export async function listProducts(
  ventureId: string,
  filters?: ListProductsFilters,
): Promise<Product[]> {
  if (!supabase) return [];

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  let query = supabase
    .from('products')
    .select()
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.categoryId) query = query.contains('category_ids', [filters.categoryId]);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list products: ${error.message}`);
  return (data ?? []).map(mapProductRow);
}

export async function archiveProduct(id: string, ventureId: string): Promise<Product> {
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('products')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('venture_id', ventureId)
    .select()
    .single();

  if (error) throw new Error(`Failed to archive product: ${error.message}`);
  return mapProductRow(data);
}

export async function searchProducts(
  ventureId: string,
  query: string,
): Promise<Product[]> {
  if (!supabase) return [];

  const term = `%${query}%`;

  // Search on name and description using ilike
  const { data, error } = await supabase
    .from('products')
    .select()
    .eq('venture_id', ventureId)
    .or(`name.ilike.${term},description.ilike.${term}`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(`Failed to search products: ${error.message}`);
  return (data ?? []).map(mapProductRow);
}
