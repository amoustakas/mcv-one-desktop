// @mcv/commerce-sdk/discount-engine — promotions, codes, BXGY, stacking.
//
// 9 methods behind createDiscountEngine({ supabase }) plus calculateBXGY
// exported top-level (pure). Supports 5 discount types — percentage,
// fixed_amount, bxgy (buy X get Y), tiered, free_shipping — with:
//
//   validateDiscount   8-rule gate (status, date range, global + per-
//                      customer usage caps, min order/qty, product-
//                      applicability, customer-group restriction)
//   applyDiscounts     cart-level resolution. Collects auto-discounts
//                      (no-code) + code-validated ones, picks single-
//                      best when any non-stackable, otherwise stacks
//                      in deterministic order (percentage → tiered →
//                      bxgy → free_shipping → fixed_amount). Distributes
//                      savings proportionally per item.
//   incrementUsage     RPC-first (increment_discount_usage) with a
//                      manual fallback; also records per-customer row
//                      in discount_usage for per-customer cap checks.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Discount,
  DiscountStatus,
  DiscountType,
  DiscountTier,
  CreateDiscountInput,
  CartItem,
} from './surface-types';
import { CreateDiscountInput as CreateDiscountInputSchema } from './surface-types';

// ─── Row mapper ─────────────────────────────────────────────────────────

function mapDiscountRow(row: Record<string, unknown>): Discount {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    code: (row.code as string | null) ?? null,
    type: row.type as DiscountType,
    value: Number(row.value),
    appliesTo: row.applies_to as Discount['appliesTo'],
    productIds: (row.product_ids as string[]) ?? [],
    collectionIds: (row.collection_ids as string[]) ?? [],
    customerGroupIds: (row.customer_group_ids as string[]) ?? [],
    minimumOrderAmount: row.minimum_order_amount != null ? Number(row.minimum_order_amount) : null,
    minimumQuantity: row.minimum_quantity != null ? Number(row.minimum_quantity) : null,
    maxUsesTotal: row.max_uses_total != null ? Number(row.max_uses_total) : null,
    maxUsesPerCustomer: row.max_uses_per_customer != null ? Number(row.max_uses_per_customer) : null,
    usedCount: Number(row.used_count ?? 0),
    startsAt: row.starts_at as string,
    endsAt: (row.ends_at as string | null) ?? null,
    stackable: Boolean(row.stackable),
    status: row.status as DiscountStatus,
    buyQuantity: row.buy_quantity != null ? Number(row.buy_quantity) : null,
    getQuantity: row.get_quantity != null ? Number(row.get_quantity) : null,
    getProductIds: (row.get_product_ids as string[] | null) ?? null,
    tiers: (row.tiers as DiscountTier[] | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

// ─── Pure helpers ──────────────────────────────────────────────────────

export interface BXGYResult {
  freeItems: Array<{ productId: string; quantity: number; unitPrice: number }>;
  totalDiscount: number;
}

export function calculateBXGY(cartItems: CartItem[], discount: Discount): BXGYResult {
  if (discount.type !== 'bxgy') return { freeItems: [], totalDiscount: 0 };

  const buyQty = discount.buyQuantity ?? 1;
  const getQty = discount.getQuantity ?? 1;
  const getProductIds = discount.getProductIds ?? [];

  // Find qualifying "buy" items. Specific-products restricts the set.
  const buyItems = discount.appliesTo === 'specific_products' && discount.productIds.length > 0
    ? cartItems.filter((item) => discount.productIds.includes(item.productId))
    : cartItems;

  const totalBuyQty = buyItems.reduce((sum, item) => sum + item.quantity, 0);
  const sets = Math.floor(totalBuyQty / buyQty);

  if (sets === 0) return { freeItems: [], totalDiscount: 0 };

  const getItems = getProductIds.length > 0
    ? cartItems.filter((item) => getProductIds.includes(item.productId))
    : buyItems;

  // Give away cheapest — sort ascending by unit price.
  const sortedGetItems = [...getItems].sort((a, b) => a.unitPrice - b.unitPrice);

  const freeItems: BXGYResult['freeItems'] = [];
  let remainingFree = sets * getQty;
  let totalDiscount = 0;

  for (const item of sortedGetItems) {
    if (remainingFree <= 0) break;
    const freeQty = Math.min(item.quantity, remainingFree);
    freeItems.push({
      productId: item.productId,
      quantity: freeQty,
      unitPrice: item.unitPrice,
    });
    totalDiscount += freeQty * item.unitPrice;
    remainingFree -= freeQty;
  }

  return { freeItems, totalDiscount };
}

function estimateDiscountSavings(
  discount: Discount,
  cartItems: CartItem[],
  cartTotal: number,
): number {
  switch (discount.type) {
    case 'percentage':
      return cartTotal * (discount.value / 100);
    case 'fixed_amount':
      return Math.min(discount.value, cartTotal);
    case 'bxgy':
      return calculateBXGY(cartItems, discount).totalDiscount;
    case 'tiered': {
      if (!discount.tiers) return 0;
      const tier = [...discount.tiers]
        .sort((a, b) => b.minAmount - a.minAmount)
        .find((t) => cartTotal >= t.minAmount);
      return tier ? cartTotal * (tier.discountPercent / 100) : 0;
    }
    case 'free_shipping':
      return 0;
    default:
      return 0;
  }
}

// ─── Engine interface ──────────────────────────────────────────────────

interface ItemDiscount {
  cartItemId: string;
  discountId: string;
  amountSaved: number;
}

export interface ApplyDiscountsResult {
  appliedDiscounts: Discount[];
  totalDiscount: number;
  itemDiscounts: ItemDiscount[];
}

export interface ListDiscountsFilters {
  status?: DiscountStatus;
  type?: DiscountType;
  page?: number;
  pageSize?: number;
}

export interface DiscountEngine {
  createDiscount(input: CreateDiscountInput): Promise<Discount>;
  getDiscount(id: string, ventureId: string): Promise<Discount | null>;
  getDiscountByCode(ventureId: string, code: string): Promise<Discount | null>;
  listDiscounts(
    ventureId: string,
    filters?: ListDiscountsFilters,
  ): Promise<{ discounts: Discount[]; total: number }>;
  updateDiscount(
    id: string,
    ventureId: string,
    updates: Partial<Pick<
      Discount,
      | 'code' | 'value' | 'appliesTo' | 'productIds' | 'collectionIds'
      | 'customerGroupIds' | 'minimumOrderAmount' | 'minimumQuantity'
      | 'maxUsesTotal' | 'maxUsesPerCustomer' | 'startsAt' | 'endsAt'
      | 'stackable' | 'status' | 'buyQuantity' | 'getQuantity'
      | 'getProductIds' | 'tiers' | 'metadata'
    >>,
  ): Promise<Discount>;
  disableDiscount(id: string, ventureId: string): Promise<Discount>;
  validateDiscount(
    ventureId: string,
    code: string,
    cartTotal: number,
    customerId: string | null,
    productIds: string[],
  ): Promise<{ valid: boolean; reason?: string; discount?: Discount }>;
  applyDiscounts(
    cartItems: CartItem[],
    discountCodes: string[],
    customerId: string | null,
    ventureId: string,
  ): Promise<ApplyDiscountsResult>;
  incrementUsage(discountId: string, customerId: string | null): Promise<void>;
}

export interface DiscountEngineOptions {
  supabase: SupabaseClient | null;
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createDiscountEngine({ supabase }: DiscountEngineOptions): DiscountEngine {
  const engine: DiscountEngine = {
    async createDiscount(input) {
      if (!supabase) throw new Error('Supabase client not available');

      const validated = CreateDiscountInputSchema.parse(input);

      const { data, error } = await supabase
        .from('discounts')
        .insert({
          venture_id: validated.ventureId,
          code: validated.code,
          type: validated.type,
          value: validated.value,
          applies_to: validated.appliesTo,
          product_ids: validated.productIds,
          collection_ids: validated.collectionIds,
          customer_group_ids: validated.customerGroupIds,
          minimum_order_amount: validated.minimumOrderAmount,
          minimum_quantity: validated.minimumQuantity,
          max_uses_total: validated.maxUsesTotal,
          max_uses_per_customer: validated.maxUsesPerCustomer,
          starts_at: validated.startsAt,
          ends_at: validated.endsAt,
          stackable: validated.stackable,
          status: 'active',
          used_count: 0,
          buy_quantity: validated.buyQuantity,
          get_quantity: validated.getQuantity,
          get_product_ids: validated.getProductIds,
          tiers: validated.tiers,
          metadata: validated.metadata,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create discount: ${error.message}`);
      return mapDiscountRow(data);
    },

    async getDiscount(id, ventureId) {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('discounts')
        .select()
        .eq('id', id)
        .eq('venture_id', ventureId)
        .single();

      if (error?.code === 'PGRST116') return null;
      if (error) throw new Error(`Failed to get discount: ${error.message}`);
      return mapDiscountRow(data);
    },

    async getDiscountByCode(ventureId, code) {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('discounts')
        .select()
        .eq('venture_id', ventureId)
        .eq('code', code)
        .single();

      if (error?.code === 'PGRST116') return null;
      if (error) throw new Error(`Failed to get discount by code: ${error.message}`);
      return mapDiscountRow(data);
    },

    async listDiscounts(ventureId, filters) {
      if (!supabase) return { discounts: [], total: 0 };

      const page = filters?.page ?? 1;
      const pageSize = filters?.pageSize ?? 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('discounts')
        .select('*', { count: 'exact' })
        .eq('venture_id', ventureId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.type) query = query.eq('type', filters.type);

      const { data, error, count } = await query;
      if (error) throw new Error(`Failed to list discounts: ${error.message}`);

      return {
        discounts: (data ?? []).map(mapDiscountRow),
        total: count ?? 0,
      };
    },

    async updateDiscount(id, ventureId, updates) {
      if (!supabase) throw new Error('Supabase client not available');

      const row: Record<string, unknown> = {};
      if (updates.code !== undefined) row.code = updates.code;
      if (updates.value !== undefined) row.value = updates.value;
      if (updates.appliesTo !== undefined) row.applies_to = updates.appliesTo;
      if (updates.productIds !== undefined) row.product_ids = updates.productIds;
      if (updates.collectionIds !== undefined) row.collection_ids = updates.collectionIds;
      if (updates.customerGroupIds !== undefined) row.customer_group_ids = updates.customerGroupIds;
      if (updates.minimumOrderAmount !== undefined) row.minimum_order_amount = updates.minimumOrderAmount;
      if (updates.minimumQuantity !== undefined) row.minimum_quantity = updates.minimumQuantity;
      if (updates.maxUsesTotal !== undefined) row.max_uses_total = updates.maxUsesTotal;
      if (updates.maxUsesPerCustomer !== undefined) row.max_uses_per_customer = updates.maxUsesPerCustomer;
      if (updates.startsAt !== undefined) row.starts_at = updates.startsAt;
      if (updates.endsAt !== undefined) row.ends_at = updates.endsAt;
      if (updates.stackable !== undefined) row.stackable = updates.stackable;
      if (updates.status !== undefined) row.status = updates.status;
      if (updates.buyQuantity !== undefined) row.buy_quantity = updates.buyQuantity;
      if (updates.getQuantity !== undefined) row.get_quantity = updates.getQuantity;
      if (updates.getProductIds !== undefined) row.get_product_ids = updates.getProductIds;
      if (updates.tiers !== undefined) row.tiers = updates.tiers;
      if (updates.metadata !== undefined) row.metadata = updates.metadata;

      const { data, error } = await supabase
        .from('discounts')
        .update(row)
        .eq('id', id)
        .eq('venture_id', ventureId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update discount: ${error.message}`);
      return mapDiscountRow(data);
    },

    async disableDiscount(id, ventureId) {
      return engine.updateDiscount(id, ventureId, { status: 'disabled' });
    },

    async validateDiscount(ventureId, code, cartTotal, customerId, productIds) {
      if (!supabase) return { valid: false, reason: 'Service unavailable' };

      const discount = await engine.getDiscountByCode(ventureId, code);
      if (!discount) return { valid: false, reason: 'Discount code not found' };

      // 1. Active status
      if (discount.status !== 'active') {
        return { valid: false, reason: `Discount is ${discount.status}` };
      }

      // 2. Date range
      const now = new Date();
      const startsAt = new Date(discount.startsAt);
      if (now < startsAt) return { valid: false, reason: 'Discount has not started yet' };
      if (discount.endsAt) {
        const endsAt = new Date(discount.endsAt);
        if (now > endsAt) return { valid: false, reason: 'Discount has expired' };
      }

      // 3. Global usage cap
      if (discount.maxUsesTotal != null && discount.usedCount >= discount.maxUsesTotal) {
        return { valid: false, reason: 'Discount has reached its usage limit' };
      }

      // 4. Per-customer usage cap
      if (discount.maxUsesPerCustomer != null && customerId) {
        const { count, error } = await supabase
          .from('discount_usage')
          .select('*', { count: 'exact', head: true })
          .eq('discount_id', discount.id)
          .eq('customer_id', customerId);

        if (!error && count != null && count >= discount.maxUsesPerCustomer) {
          return { valid: false, reason: 'You have already used this discount the maximum number of times' };
        }
      }

      // 5. Minimum order amount
      if (discount.minimumOrderAmount != null && cartTotal < discount.minimumOrderAmount) {
        return { valid: false, reason: `Minimum order amount of ${discount.minimumOrderAmount} required` };
      }

      // 6. Minimum quantity
      if (discount.minimumQuantity != null) {
        const totalQty = productIds.length;
        if (totalQty < discount.minimumQuantity) {
          return { valid: false, reason: `Minimum quantity of ${discount.minimumQuantity} items required` };
        }
      }

      // 7. Product applicability
      if (discount.appliesTo === 'specific_products' && discount.productIds.length > 0) {
        const hasEligibleProduct = productIds.some((pid) => discount.productIds.includes(pid));
        if (!hasEligibleProduct) {
          return { valid: false, reason: 'Discount does not apply to items in your cart' };
        }
      }

      // 8. Customer group restriction
      if (discount.appliesTo === 'specific_customers' && discount.customerGroupIds.length > 0) {
        if (!customerId) {
          return { valid: false, reason: 'You must be signed in to use this discount' };
        }
        const { data: customerData } = await supabase
          .from('customers')
          .select('group')
          .eq('id', customerId)
          .single();

        const customerGroup = customerData?.group as string | null;
        if (!customerGroup || !discount.customerGroupIds.includes(customerGroup)) {
          return { valid: false, reason: 'This discount is not available for your account' };
        }
      }

      return { valid: true, discount };
    },

    async applyDiscounts(cartItems, discountCodes, customerId, ventureId) {
      if (!supabase) return { appliedDiscounts: [], totalDiscount: 0, itemDiscounts: [] };

      const cartTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const productIds = cartItems.map((item) => item.productId);

      // 1. Auto-discounts (no code, active, already started).
      const now = new Date().toISOString();
      const { data: autoRows } = await supabase
        .from('discounts')
        .select()
        .eq('venture_id', ventureId)
        .eq('status', 'active')
        .is('code', null)
        .lte('starts_at', now);

      const autoDiscounts: Discount[] = (autoRows ?? [])
        .map(mapDiscountRow)
        .filter((d) => {
          if (d.endsAt && new Date(d.endsAt) < new Date()) return false;
          if (d.minimumOrderAmount != null && cartTotal < d.minimumOrderAmount) return false;
          if (d.appliesTo === 'specific_products' && d.productIds.length > 0) {
            return productIds.some((pid) => d.productIds.includes(pid));
          }
          return true;
        });

      // 2. Code-based discounts — validate each.
      const codeDiscounts: Discount[] = [];
      for (const code of discountCodes) {
        const result = await engine.validateDiscount(ventureId, code, cartTotal, customerId, productIds);
        if (result.valid && result.discount) codeDiscounts.push(result.discount);
      }

      const allEligible = [...autoDiscounts, ...codeDiscounts];
      if (allEligible.length === 0) {
        return { appliedDiscounts: [], totalDiscount: 0, itemDiscounts: [] };
      }

      // 3. Stackability: any non-stackable → pick single best by estimated savings.
      const hasNonStackable = allEligible.some((d) => !d.stackable);

      let toApply: Discount[];
      if (hasNonStackable) {
        let bestDiscount = allEligible[0];
        let bestSavings = estimateDiscountSavings(bestDiscount, cartItems, cartTotal);
        for (const d of allEligible.slice(1)) {
          const savings = estimateDiscountSavings(d, cartItems, cartTotal);
          if (savings > bestSavings) {
            bestSavings = savings;
            bestDiscount = d;
          }
        }
        toApply = [bestDiscount];
      } else {
        // All stackable — deterministic order: percentage → tiered → bxgy → free_shipping → fixed.
        toApply = allEligible.sort((a, b) => {
          const order = ['percentage', 'tiered', 'bxgy', 'free_shipping', 'fixed_amount'];
          return order.indexOf(a.type) - order.indexOf(b.type);
        });
      }

      // 4. Per-item savings distribution.
      const itemDiscounts: ItemDiscount[] = [];
      let totalDiscount = 0;
      let runningCartTotal = cartTotal;

      for (const discount of toApply) {
        if (discount.type === 'bxgy') {
          const { freeItems, totalDiscount: bxgyTotal } = calculateBXGY(cartItems, discount);
          totalDiscount += bxgyTotal;
          for (const fi of freeItems) {
            const cartItem = cartItems.find((ci) => ci.productId === fi.productId);
            if (cartItem) {
              itemDiscounts.push({
                cartItemId: cartItem.id,
                discountId: discount.id,
                amountSaved: fi.quantity * fi.unitPrice,
              });
            }
          }
        } else if (discount.type === 'free_shipping') {
          // Resolved at shipping rate level; no item-level discount here.
          totalDiscount += 0;
        } else if (discount.type === 'tiered' && discount.tiers) {
          const matchedTier = [...discount.tiers]
            .sort((a, b) => b.minAmount - a.minAmount)
            .find((t) => runningCartTotal >= t.minAmount);

          if (matchedTier) {
            const saved = runningCartTotal * (matchedTier.discountPercent / 100);
            totalDiscount += saved;
            runningCartTotal -= saved;
            for (const item of cartItems) {
              const proportion = item.totalPrice / cartTotal;
              itemDiscounts.push({
                cartItemId: item.id,
                discountId: discount.id,
                amountSaved: saved * proportion,
              });
            }
          }
        } else {
          // percentage or fixed_amount
          const applicableItems = discount.appliesTo === 'specific_products' && discount.productIds.length > 0
            ? cartItems.filter((ci) => discount.productIds.includes(ci.productId))
            : cartItems;

          const applicableTotal = applicableItems.reduce((s, i) => s + i.totalPrice, 0);

          let discountSaved = 0;
          if (discount.type === 'percentage') {
            discountSaved = applicableTotal * (discount.value / 100);
          } else {
            // fixed_amount — cap at applicable total.
            discountSaved = Math.min(discount.value, applicableTotal);
          }

          totalDiscount += discountSaved;
          runningCartTotal -= discountSaved;

          for (const item of applicableItems) {
            const proportion = applicableTotal > 0 ? item.totalPrice / applicableTotal : 0;
            itemDiscounts.push({
              cartItemId: item.id,
              discountId: discount.id,
              amountSaved: discountSaved * proportion,
            });
          }
        }
      }

      return { appliedDiscounts: toApply, totalDiscount, itemDiscounts };
    },

    async incrementUsage(discountId, customerId) {
      if (!supabase) return;

      // RPC path (preferred — atomic increment).
      const { error: incErr } = await supabase.rpc('increment_discount_usage', {
        p_discount_id: discountId,
      });

      if (incErr) {
        // Fallback: fetch+update. Not atomic but better than nothing.
        const { data: current } = await supabase
          .from('discounts')
          .select('used_count')
          .eq('id', discountId)
          .single();

        await supabase
          .from('discounts')
          .update({ used_count: ((current?.used_count as number) ?? 0) + 1 })
          .eq('id', discountId);
      }

      if (customerId) {
        await supabase.from('discount_usage').insert({
          discount_id: discountId,
          customer_id: customerId,
          used_at: new Date().toISOString(),
        });
      }
    },
  };

  return engine;
}
