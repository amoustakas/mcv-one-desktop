// api/commerce-surface.ts
// Vercel serverless function — Commerce Surface Layer API
// Covers: Cart, Checkout, Customer, Discount, Inventory, Fulfillment,
//         Notifications, Digital Delivery, Reviews, Wishlist, Gift Cards,
//         Search, and Analytics

import type { VercelRequest, VercelResponse } from '@vercel/node';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
  );

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;
  const ventureId = ((req.method === 'GET' ? req.query.ventureId : req.body?.ventureId) as string) ?? '';

  if (!ventureId) {
    return res.status(400).json({ error: 'ventureId is required' });
  }

  try {
    switch (action) {

      // ── CART ────────────────────────────────────────────────────────────────

      case 'create-cart': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { customerId, sessionId, currency = 'USD' } = req.body;
        const sid = sessionId ?? crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from('cart_sessions')
          .insert({
            venture_id: ventureId,
            customer_id: customerId ?? null,
            session_id: sid,
            subtotal: 0, discount_total: 0, tax_total: 0, shipping_total: 0, total: 0,
            currency,
            discount_codes: [], applied_discounts: [],
            recovery_email_sent: false,
            expires_at: expiresAt,
            metadata: {},
          })
          .select().single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'get-cart': {
        const { cartId } = req.query;
        if (!cartId) return res.status(400).json({ error: 'cartId is required' });
        const { data: cart, error: cartErr } = await supabase
          .from('cart_sessions')
          .select()
          .eq('id', cartId as string)
          .eq('venture_id', ventureId)
          .single();
        if (cartErr) throw cartErr;
        const { data: items } = await supabase
          .from('cart_items')
          .select()
          .eq('cart_id', cartId as string)
          .order('created_at', { ascending: true });
        return res.json({ data: { ...cart, items: items ?? [] } });
      }

      case 'add-to-cart': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { cartId, productId, quantity = 1, variantId } = req.body;
        if (!cartId || !productId) return res.status(400).json({ error: 'cartId and productId are required' });

        // Fetch product price
        const { data: product, error: prodErr } = await supabase
          .from('products')
          .select('id, pricing, track_inventory, inventory_count')
          .eq('id', productId as string)
          .eq('venture_id', ventureId)
          .single();
        if (prodErr) throw prodErr;

        const pricing = product.pricing as { default?: { amount: number } } | null;
        const unitPrice = pricing?.default?.amount ?? 0;
        const totalPrice = unitPrice * Number(quantity);

        // Upsert cart item
        const { data: existing } = await supabase
          .from('cart_items')
          .select()
          .eq('cart_id', cartId as string)
          .eq('product_id', productId as string)
          .eq('variant_id', variantId ?? null)
          .maybeSingle();

        if (existing) {
          const newQty = (existing.quantity as number) + Number(quantity);
          await supabase.from('cart_items').update({
            quantity: newQty,
            total_price: unitPrice * newQty,
            updated_at: new Date().toISOString(),
          }).eq('id', existing.id);
        } else {
          await supabase.from('cart_items').insert({
            cart_id: cartId, product_id: productId, variant_id: variantId ?? null,
            quantity, unit_price: unitPrice, total_price: totalPrice,
            tax_amount: 0, discount_amount: 0, metadata: {},
          });
        }

        // Recalculate cart subtotal
        const { data: allItems } = await supabase.from('cart_items').select('total_price').eq('cart_id', cartId as string);
        const subtotal = (allItems ?? []).reduce((s, i) => s + Number(i.total_price), 0);
        await supabase.from('cart_sessions').update({ subtotal, total: subtotal, updated_at: new Date().toISOString() }).eq('id', cartId as string);

        // Return updated cart
        const { data: updatedCart } = await supabase.from('cart_sessions').select().eq('id', cartId as string).single();
        const { data: updatedItems } = await supabase.from('cart_items').select().eq('cart_id', cartId as string);
        return res.json({ data: { ...updatedCart, items: updatedItems ?? [] } });
      }

      case 'remove-from-cart': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { cartId, itemId } = req.body;
        if (!cartId || !itemId) return res.status(400).json({ error: 'cartId and itemId are required' });
        const { error } = await supabase.from('cart_items').delete().eq('id', itemId as string).eq('cart_id', cartId as string);
        if (error) throw error;
        const { data: allItems } = await supabase.from('cart_items').select('total_price').eq('cart_id', cartId as string);
        const subtotal = (allItems ?? []).reduce((s, i) => s + Number(i.total_price), 0);
        await supabase.from('cart_sessions').update({ subtotal, total: subtotal, updated_at: new Date().toISOString() }).eq('id', cartId as string);
        return res.json({ data: { success: true } });
      }

      case 'update-quantity': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { cartId, itemId, quantity } = req.body;
        if (!cartId || !itemId || quantity === undefined) return res.status(400).json({ error: 'cartId, itemId, quantity are required' });
        if (Number(quantity) <= 0) {
          await supabase.from('cart_items').delete().eq('id', itemId as string).eq('cart_id', cartId as string);
        } else {
          const { data: item } = await supabase.from('cart_items').select('unit_price').eq('id', itemId as string).single();
          if (!item) return res.status(404).json({ error: 'Item not found' });
          await supabase.from('cart_items').update({
            quantity: Number(quantity),
            total_price: Number(item.unit_price) * Number(quantity),
            updated_at: new Date().toISOString(),
          }).eq('id', itemId as string).eq('cart_id', cartId as string);
        }
        const { data: allItems } = await supabase.from('cart_items').select('total_price').eq('cart_id', cartId as string);
        const subtotal = (allItems ?? []).reduce((s, i) => s + Number(i.total_price), 0);
        await supabase.from('cart_sessions').update({ subtotal, total: subtotal, updated_at: new Date().toISOString() }).eq('id', cartId as string);
        return res.json({ data: { success: true } });
      }

      case 'apply-discount': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { cartId, code } = req.body;
        if (!cartId || !code) return res.status(400).json({ error: 'cartId and code are required' });
        const now = new Date().toISOString();
        const { data: discount, error: discErr } = await supabase
          .from('discounts')
          .select()
          .eq('venture_id', ventureId)
          .eq('code', code as string)
          .eq('status', 'active')
          .lte('starts_at', now)
          .maybeSingle();
        if (discErr) throw discErr;
        if (!discount) return res.status(400).json({ error: `Discount code "${code}" is invalid or expired` });

        const { data: cartRow } = await supabase.from('cart_sessions').select('subtotal, discount_codes, applied_discounts').eq('id', cartId as string).single();
        if (!cartRow) return res.status(404).json({ error: 'Cart not found' });

        const subtotal = Number(cartRow.subtotal);
        const discType = discount.type as string;
        const discValue = Number(discount.value);
        let amountSaved = discType === 'percentage' ? subtotal * (discValue / 100) : Math.min(discValue, subtotal);

        const existingCodes = (Array.isArray(cartRow.discount_codes) ? cartRow.discount_codes : []) as string[];
        const existingDiscounts = (Array.isArray(cartRow.applied_discounts) ? cartRow.applied_discounts : []) as Record<string, unknown>[];
        const newDiscounts = [...existingDiscounts, { discountId: discount.id, code, type: discType, value: discValue, amountSaved }];

        await supabase.from('cart_sessions').update({
          discount_codes: [...existingCodes, code],
          applied_discounts: newDiscounts,
          discount_total: existingDiscounts.reduce((s, d) => s + Number(d.amountSaved ?? 0), 0) + amountSaved,
          updated_at: new Date().toISOString(),
        }).eq('id', cartId as string);

        return res.json({ data: { success: true, amountSaved } });
      }

      case 'get-abandoned-carts': {
        const { olderThanHours = 1 } = req.query;
        const cutoff = new Date(Date.now() - Number(olderThanHours) * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from('cart_sessions')
          .select()
          .eq('venture_id', ventureId)
          .not('abandoned_at', 'is', null)
          .lte('abandoned_at', cutoff)
          .order('abandoned_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return res.json({ data });
      }

      // ── CHECKOUT ────────────────────────────────────────────────────────────

      case 'instant-buy': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { productId, customerId, quantity = 1, paymentMethodId, shippingAddress } = req.body;
        if (!productId || !customerId) return res.status(400).json({ error: 'productId and customerId are required' });

        const { data: product, error: prodErr } = await supabase
          .from('products')
          .select('id, name, pricing')
          .eq('id', productId as string)
          .eq('venture_id', ventureId)
          .single();
        if (prodErr) throw prodErr;

        const pricing = product.pricing as { default?: { amount: number; currency: string } } | null;
        const unitPrice = pricing?.default?.amount ?? 0;
        const currency = pricing?.default?.currency ?? 'USD';
        const total = unitPrice * Number(quantity);

        const { data: order, error: orderErr } = await supabase
          .from('orders')
          .insert({
            venture_id: ventureId,
            customer_id: customerId,
            status: 'pending',
            total_amount: total,
            currency,
            payment_method_id: paymentMethodId ?? null,
            shipping_address: shippingAddress ?? null,
            metadata: { instant_buy: true },
          })
          .select().single();
        if (orderErr) throw orderErr;

        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: productId,
          quantity: Number(quantity),
          unit_price: unitPrice,
          total_price: total,
        });

        return res.json({ data: order });
      }

      case 'checkout': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { cartId, customerId, paymentMethodId } = req.body;
        if (!cartId || !customerId) return res.status(400).json({ error: 'cartId and customerId are required' });

        const { data: cart, error: cartErr } = await supabase
          .from('cart_sessions')
          .select()
          .eq('id', cartId as string)
          .eq('venture_id', ventureId)
          .single();
        if (cartErr) throw cartErr;

        const { data: items } = await supabase.from('cart_items').select().eq('cart_id', cartId as string);

        const { data: order, error: orderErr } = await supabase
          .from('orders')
          .insert({
            venture_id: ventureId,
            customer_id: customerId,
            cart_id: cartId,
            status: 'pending',
            total_amount: Number(cart.total ?? 0),
            subtotal: Number(cart.subtotal ?? 0),
            tax_total: Number(cart.tax_total ?? 0),
            shipping_total: Number(cart.shipping_total ?? 0),
            discount_total: Number(cart.discount_total ?? 0),
            currency: cart.currency ?? 'USD',
            shipping_address: cart.shipping_address ?? null,
            billing_address: cart.billing_address ?? null,
            payment_method_id: paymentMethodId ?? null,
            metadata: {},
          })
          .select().single();
        if (orderErr) throw orderErr;

        if (items && items.length > 0) {
          await supabase.from('order_items').insert(
            (items as Record<string, unknown>[]).map((i) => ({
              order_id: order.id,
              product_id: i.product_id,
              variant_id: i.variant_id ?? null,
              quantity: i.quantity,
              unit_price: i.unit_price,
              total_price: i.total_price,
            })),
          );
        }

        // Mark cart as completed
        await supabase.from('cart_sessions').update({ abandoned_at: null, metadata: { converted: true } }).eq('id', cartId as string);

        return res.json({ data: order });
      }

      case 'estimate-checkout': {
        const { cartId } = req.query;
        if (!cartId) return res.status(400).json({ error: 'cartId is required' });
        const { data: cart } = await supabase.from('cart_sessions').select('subtotal, discount_total, tax_total, shipping_total, total').eq('id', cartId as string).single();
        return res.json({ data: cart });
      }

      // ── CUSTOMER ────────────────────────────────────────────────────────────

      case 'create-customer': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { email, firstName, lastName, phone, userId: custUserId, tags, group, notes, metadata } = req.body;
        if (!email || !firstName || !lastName) return res.status(400).json({ error: 'email, firstName, lastName are required' });
        const { data, error } = await supabase
          .from('customers')
          .insert({
            venture_id: ventureId,
            user_id: custUserId ?? null,
            email, first_name: firstName, last_name: lastName,
            phone: phone ?? null,
            tags: tags ?? [], segments: [], group: group ?? null,
            total_orders: 0, total_spent: 0, average_order_value: 0, ltv: 0,
            communication_preferences: { email: true, sms: false, push: true },
            notes: notes ?? '',
            metadata: metadata ?? {},
          })
          .select().single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'get-customer': {
        const { customerId } = req.query;
        if (!customerId) return res.status(400).json({ error: 'customerId is required' });
        const { data, error } = await supabase
          .from('customers')
          .select()
          .eq('id', customerId as string)
          .eq('venture_id', ventureId)
          .single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'list-customers': {
        const { limit: lRaw = '50', offset: oRaw = '0', segment } = req.query;
        const limit = Math.min(Number(lRaw), 200);
        const offset = Number(oRaw);
        let query = supabase
          .from('customers')
          .select('*')
          .eq('venture_id', ventureId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (segment) query = query.contains('segments', [segment as string]);
        const { data, error } = await query;
        if (error) throw error;
        return res.json({ data, meta: { limit, offset } });
      }

      case 'add-address': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { customerId, address } = req.body;
        if (!customerId || !address) return res.status(400).json({ error: 'customerId and address are required' });
        const { data, error } = await supabase
          .from('customer_addresses')
          .insert({
            customer_id: customerId,
            first_name: address.firstName, last_name: address.lastName,
            company: address.company ?? null, line1: address.line1,
            line2: address.line2 ?? null, city: address.city,
            state: address.state, postal_code: address.postalCode,
            country: address.country, phone: address.phone ?? null,
            is_default: address.isDefault ?? false,
          })
          .select().single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'save-payment-method': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { customerId, type, last4, brand, expiryMonth, expiryYear, processorId, processorMethodId, isDefault } = req.body;
        if (!customerId || !last4 || !processorId) return res.status(400).json({ error: 'customerId, last4, processorId are required' });
        const { data, error } = await supabase
          .from('customer_payment_methods')
          .insert({
            customer_id: customerId, type: type ?? 'card',
            last4, brand: brand ?? null,
            expiry_month: expiryMonth ?? null, expiry_year: expiryYear ?? null,
            is_default: isDefault ?? false,
            processor_id: processorId, processor_method_id: processorMethodId ?? '',
          })
          .select().single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'compute-segments': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { customerId } = req.body;
        if (!customerId) return res.status(400).json({ error: 'customerId is required' });
        const { data: customer } = await supabase
          .from('customers')
          .select('total_orders, total_spent, last_order_at')
          .eq('id', customerId as string).single();
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        const segments: string[] = [];
        const totalOrders = Number(customer.total_orders ?? 0);
        const totalSpent = Number(customer.total_spent ?? 0);
        if (totalOrders === 0) segments.push('new');
        if (totalOrders >= 2) segments.push('repeat');
        if (totalSpent > 1000) segments.push('high_value');
        if (totalSpent > 10000) segments.push('whale');
        if (totalOrders > 0 && customer.last_order_at) {
          const daysSince = (Date.now() - new Date(customer.last_order_at as string).getTime()) / 86400000;
          if (daysSince > 180) segments.push('dormant');
          else if (daysSince > 60) segments.push('at_risk');
        }
        await supabase.from('customers').update({ segments }).eq('id', customerId as string);
        return res.json({ data: { customerId, segments } });
      }

      // ── DISCOUNT ────────────────────────────────────────────────────────────

      case 'create-discount': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const {
          code, type, value, appliesTo = 'all',
          productIds, collectionIds, customerGroupIds,
          minimumOrderAmount, minimumQuantity,
          maxUsesTotal, maxUsesPerCustomer,
          startsAt, endsAt, stackable = false,
          buyQuantity, getQuantity, getProductIds,
          tiers, metadata,
        } = req.body;
        if (!type || value === undefined) return res.status(400).json({ error: 'type and value are required' });
        const { data, error } = await supabase.from('discounts').insert({
          venture_id: ventureId, code: code ?? null, type, value,
          applies_to: appliesTo, product_ids: productIds ?? [], collection_ids: collectionIds ?? [],
          customer_group_ids: customerGroupIds ?? [], minimum_order_amount: minimumOrderAmount ?? null,
          minimum_quantity: minimumQuantity ?? null, max_uses_total: maxUsesTotal ?? null,
          max_uses_per_customer: maxUsesPerCustomer ?? null,
          starts_at: startsAt ?? new Date().toISOString(), ends_at: endsAt ?? null,
          stackable, status: 'active', used_count: 0,
          buy_quantity: buyQuantity ?? null, get_quantity: getQuantity ?? null,
          get_product_ids: getProductIds ?? null, tiers: tiers ?? null,
          metadata: metadata ?? {},
        }).select().single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'list-discounts': {
        const { status, limit: lRaw = '50', offset: oRaw = '0' } = req.query;
        const limit = Math.min(Number(lRaw), 200);
        const offset = Number(oRaw);
        let query = supabase.from('discounts').select().eq('venture_id', ventureId)
          .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
        if (status) query = query.eq('status', status as string);
        const { data, error } = await query;
        if (error) throw error;
        return res.json({ data, meta: { limit, offset } });
      }

      case 'validate-discount': {
        const { code, cartTotal } = req.query;
        if (!code) return res.status(400).json({ error: 'code is required' });
        const now = new Date().toISOString();
        const { data, error } = await supabase.from('discounts').select()
          .eq('venture_id', ventureId).eq('code', code as string).eq('status', 'active')
          .lte('starts_at', now).maybeSingle();
        if (error) throw error;
        if (!data) return res.json({ valid: false, reason: 'Code not found or inactive' });
        if (data.ends_at && new Date(data.ends_at as string) < new Date()) {
          return res.json({ valid: false, reason: 'Code has expired' });
        }
        if (data.max_uses_total !== null && Number(data.used_count) >= Number(data.max_uses_total)) {
          return res.json({ valid: false, reason: 'Code usage limit reached' });
        }
        if (data.minimum_order_amount !== null && cartTotal !== undefined && Number(cartTotal) < Number(data.minimum_order_amount)) {
          return res.json({ valid: false, reason: `Minimum order $${data.minimum_order_amount} required` });
        }
        return res.json({ valid: true, discount: data });
      }

      case 'apply-discounts': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { cartId, codes } = req.body;
        if (!cartId || !Array.isArray(codes)) return res.status(400).json({ error: 'cartId and codes[] are required' });
        const results: Record<string, unknown>[] = [];
        for (const code of codes as string[]) {
          const now = new Date().toISOString();
          const { data: disc } = await supabase.from('discounts').select()
            .eq('venture_id', ventureId).eq('code', code).eq('status', 'active').lte('starts_at', now).maybeSingle();
          results.push({ code, valid: !!disc, discount: disc });
        }
        return res.json({ data: results });
      }

      // ── INVENTORY ────────────────────────────────────────────────────────────

      case 'list-locations': {
        const { data, error } = await supabase.from('inventory_locations').select()
          .eq('venture_id', ventureId).order('is_default', { ascending: false });
        if (error) throw error;
        return res.json({ data });
      }

      case 'get-inventory': {
        const { productId, locationId } = req.query;
        if (!productId) return res.status(400).json({ error: 'productId is required' });
        let query = supabase.from('inventory_levels').select().eq('product_id', productId as string);
        if (locationId) query = query.eq('location_id', locationId as string);
        const { data, error } = await query;
        if (error) throw error;
        return res.json({ data });
      }

      case 'adjust-inventory': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { productId, locationId, quantity, type = 'adjustment', reason } = req.body;
        if (!productId || !locationId || quantity === undefined) {
          return res.status(400).json({ error: 'productId, locationId, quantity are required' });
        }

        const { data: level, error: lvlErr } = await supabase
          .from('inventory_levels')
          .select()
          .eq('product_id', productId as string)
          .eq('location_id', locationId as string)
          .maybeSingle();

        const prevLevel = level ? Number(level.available ?? 0) : 0;
        const newLevel = Math.max(0, prevLevel + Number(quantity));

        if (level) {
          await supabase.from('inventory_levels').update({
            available: newLevel, on_hand: newLevel,
          }).eq('id', level.id);
        } else {
          await supabase.from('inventory_levels').insert({
            product_id: productId, location_id: locationId,
            available: newLevel, reserved: 0, committed: 0,
            incoming: 0, on_hand: newLevel,
            low_stock_threshold: 5, backorder_enabled: false,
          });
        }

        // Write movement log
        await supabase.from('inventory_movements').insert({
          product_id: productId, location_id: locationId, type,
          quantity: Number(quantity), previous_level: prevLevel, new_level: newLevel,
          reason: reason ?? 'Manual adjustment', created_by: userId,
        }).catch(() => {}); // best-effort

        return res.json({ data: { productId, locationId, previousLevel: prevLevel, newLevel, type } });
      }

      case 'reserve-stock': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { productId, locationId, quantity } = req.body;
        if (!productId || !locationId || !quantity) return res.status(400).json({ error: 'productId, locationId, quantity are required' });

        const { data: level } = await supabase.from('inventory_levels').select().eq('product_id', productId as string).eq('location_id', locationId as string).single();
        if (!level) return res.status(404).json({ error: 'Inventory level not found' });

        const available = Number(level.available ?? 0);
        const reserved = Number(level.reserved ?? 0);
        if (available < Number(quantity)) return res.status(400).json({ error: `Insufficient stock: ${available} available` });

        await supabase.from('inventory_levels').update({
          available: available - Number(quantity),
          reserved: reserved + Number(quantity),
        }).eq('id', level.id);

        return res.json({ data: { success: true, reserved: reserved + Number(quantity), available: available - Number(quantity) } });
      }

      case 'get-low-stock': {
        const { threshold = '10' } = req.query;
        // Get levels where available <= threshold for products in this venture
        const { data: products } = await supabase.from('products').select('id').eq('venture_id', ventureId).eq('status', 'active');
        if (!products || products.length === 0) return res.json({ data: [] });
        const productIds = products.map((p) => p.id as string);
        const { data, error } = await supabase
          .from('inventory_levels')
          .select('*, products(name)')
          .in('product_id', productIds)
          .lte('available', Number(threshold));
        if (error) throw error;
        return res.json({ data });
      }

      // ── FULFILLMENT ──────────────────────────────────────────────────────────

      case 'create-fulfillment': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { orderId, items, carrier, trackingNumber, trackingUrl, notes } = req.body;
        if (!orderId || !items) return res.status(400).json({ error: 'orderId and items are required' });

        const { data, error } = await supabase.from('fulfillments').insert({
          order_id: orderId,
          status: 'unfulfilled',
          items: items ?? [],
          tracking_number: trackingNumber ?? null,
          tracking_url: trackingUrl ?? null,
          carrier: carrier ?? null,
          notes: notes ?? '',
        }).select().single();
        if (error) throw error;

        // Update order status
        await supabase.from('orders').update({ fulfillment_status: 'partially_fulfilled' }).eq('id', orderId as string);

        return res.json({ data });
      }

      case 'mark-shipped': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { fulfillmentId, trackingNumber, trackingUrl, carrier } = req.body;
        if (!fulfillmentId) return res.status(400).json({ error: 'fulfillmentId is required' });

        const { data, error } = await supabase.from('fulfillments').update({
          status: 'fulfilled',
          tracking_number: trackingNumber ?? null,
          tracking_url: trackingUrl ?? null,
          carrier: carrier ?? null,
          shipped_at: new Date().toISOString(),
        }).eq('id', fulfillmentId as string).select().single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'get-unfulfilled': {
        const { data: orders, error: ordErr } = await supabase
          .from('orders')
          .select('id, customer_id, total_amount, created_at, status, fulfillment_status')
          .eq('venture_id', ventureId)
          .in('fulfillment_status', ['unfulfilled', 'partially_fulfilled'])
          .neq('status', 'canceled')
          .order('created_at', { ascending: true });
        if (ordErr) throw ordErr;
        return res.json({ data: orders });
      }

      case 'create-return': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { orderId, customerId, items, reason } = req.body;
        if (!orderId || !customerId || !items) return res.status(400).json({ error: 'orderId, customerId, items are required' });
        const { data, error } = await supabase.from('return_requests').insert({
          order_id: orderId, customer_id: customerId,
          items: items ?? [], reason: reason ?? '',
          status: 'requested', created_at: new Date().toISOString(),
        }).select().single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'approve-return': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { returnId, refundAmount } = req.body;
        if (!returnId) return res.status(400).json({ error: 'returnId is required' });
        const { data, error } = await supabase.from('return_requests').update({
          status: 'approved', refund_amount: refundAmount ?? null, updated_at: new Date().toISOString(),
        }).eq('id', returnId as string).select().single();
        if (error) throw error;
        return res.json({ data });
      }

      // ── NOTIFICATIONS ────────────────────────────────────────────────────────

      case 'list-templates': {
        const { event, channel } = req.query;
        let query = supabase.from('notification_templates').select().eq('venture_id', ventureId);
        if (event) query = query.eq('event', event as string);
        if (channel) query = query.eq('channel', channel as string);
        const { data, error } = await query;
        if (error) throw error;
        return res.json({ data });
      }

      case 'queue-notification': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { templateId, customerId, channel, metadata } = req.body;
        if (!templateId || !customerId) return res.status(400).json({ error: 'templateId and customerId are required' });
        const { data, error } = await supabase.from('notification_deliveries').insert({
          venture_id: ventureId, template_id: templateId,
          customer_id: customerId, channel: channel ?? 'email',
          status: 'pending', metadata: metadata ?? {},
        }).select().single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'process-queue': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        // Mark pending notifications as sent (production would call actual email/SMS provider)
        const { data, error } = await supabase
          .from('notification_deliveries')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('venture_id', ventureId)
          .eq('status', 'pending')
          .select();
        if (error) throw error;
        return res.json({ data, processed: data?.length ?? 0 });
      }

      // ── DIGITAL DELIVERY ─────────────────────────────────────────────────────

      case 'get-download': {
        const { orderId, productId } = req.query;
        if (!orderId || !productId) return res.status(400).json({ error: 'orderId and productId are required' });
        const { data, error } = await supabase
          .from('digital_fulfillments')
          .select()
          .eq('order_id', orderId as string)
          .eq('product_id', productId as string)
          .single();
        if (error) throw error;
        // Check download limit
        if (data.max_downloads > 0 && Number(data.download_count) >= Number(data.max_downloads)) {
          return res.status(403).json({ error: 'Download limit reached' });
        }
        if (data.expires_at && new Date(data.expires_at as string) < new Date()) {
          return res.status(403).json({ error: 'Download link expired' });
        }
        // Increment count
        await supabase.from('digital_fulfillments').update({
          download_count: Number(data.download_count) + 1,
        }).eq('id', data.id);
        return res.json({ data: { downloadUrl: data.download_url, licenseKey: data.license_key } });
      }

      case 'activate-license': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { licenseKey } = req.body;
        if (!licenseKey) return res.status(400).json({ error: 'licenseKey is required' });
        const { data, error } = await supabase
          .from('digital_fulfillments')
          .select()
          .eq('license_key', licenseKey as string)
          .single();
        if (error) throw error;
        if (Number(data.activations) >= Number(data.max_activations)) {
          return res.status(403).json({ error: 'Activation limit reached' });
        }
        await supabase.from('digital_fulfillments').update({
          activations: Number(data.activations) + 1,
        }).eq('id', data.id);
        return res.json({ data: { activated: true, activations: Number(data.activations) + 1 } });
      }

      case 'validate-access': {
        const { accessToken } = req.query;
        if (!accessToken) return res.status(400).json({ error: 'accessToken is required' });
        const { data, error } = await supabase
          .from('digital_fulfillments')
          .select()
          .eq('access_token', accessToken as string)
          .maybeSingle();
        if (error) throw error;
        if (!data) return res.json({ valid: false });
        const expired = data.access_expires_at && new Date(data.access_expires_at as string) < new Date();
        return res.json({ valid: !expired, data });
      }

      // ── REVIEWS ──────────────────────────────────────────────────────────────

      case 'create-review': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { productId, customerId, orderId, rating, title, body: reviewBody, pros, cons, images } = req.body;
        if (!productId || !customerId || !rating) return res.status(400).json({ error: 'productId, customerId, rating are required' });
        if (Number(rating) < 1 || Number(rating) > 5) return res.status(400).json({ error: 'rating must be 1-5' });

        // Check verified purchase
        const isVerified = orderId
          ? !!(await supabase.from('orders').select('id').eq('id', orderId as string).eq('customer_id', customerId as string).maybeSingle()).data
          : false;

        const { data, error } = await supabase.from('reviews').insert({
          venture_id: ventureId, product_id: productId, customer_id: customerId,
          order_id: orderId ?? null, rating: Number(rating),
          title: title ?? '', body: reviewBody ?? '',
          pros: pros ?? [], cons: cons ?? [], images: images ?? [],
          is_verified_purchase: isVerified,
          status: 'pending', helpful_count: 0, report_count: 0,
        }).select().single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'list-reviews': {
        const { productId, status, limit: lRaw = '50', offset: oRaw = '0' } = req.query;
        let query = supabase.from('reviews').select().eq('venture_id', ventureId)
          .order('created_at', { ascending: false })
          .range(Number(oRaw), Number(oRaw) + Math.min(Number(lRaw), 200) - 1);
        if (productId) query = query.eq('product_id', productId as string);
        if (status) query = query.eq('status', status as string);
        const { data, error } = await query;
        if (error) throw error;
        return res.json({ data });
      }

      case 'get-rating': {
        const { productId } = req.query;
        if (!productId) return res.status(400).json({ error: 'productId is required' });
        const { data, error } = await supabase
          .from('reviews')
          .select('rating')
          .eq('product_id', productId as string)
          .eq('venture_id', ventureId)
          .eq('status', 'approved');
        if (error) throw error;
        const reviews = data ?? [];
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
          ? reviews.reduce((s, r) => s + Number(r.rating), 0) / totalReviews
          : 0;
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const r of reviews) distribution[Number(r.rating)]++;
        return res.json({ data: { productId, averageRating, totalReviews, distribution } });
      }

      case 'get-moderation-queue': {
        const { data, error } = await supabase.from('reviews').select()
          .eq('venture_id', ventureId).eq('status', 'pending')
          .order('created_at', { ascending: true });
        if (error) throw error;
        return res.json({ data });
      }

      // ── WISHLIST ─────────────────────────────────────────────────────────────

      case 'get-wishlists': {
        const { customerId } = req.query;
        if (!customerId) return res.status(400).json({ error: 'customerId is required' });
        const { data, error } = await supabase.from('wishlists').select('*, wishlist_items(*)')
          .eq('customer_id', customerId as string).eq('venture_id', ventureId);
        if (error) throw error;
        return res.json({ data });
      }

      case 'add-to-wishlist': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { customerId, wishlistId, productId, variantId, notifyOnPriceDrop } = req.body;
        if (!customerId || !productId) return res.status(400).json({ error: 'customerId and productId are required' });

        // Get or create default wishlist
        let wId = wishlistId;
        if (!wId) {
          const { data: existing } = await supabase.from('wishlists')
            .select('id').eq('customer_id', customerId as string).eq('venture_id', ventureId).limit(1).maybeSingle();
          if (existing) {
            wId = existing.id;
          } else {
            const { data: newList } = await supabase.from('wishlists').insert({
              customer_id: customerId, venture_id: ventureId,
              name: 'My Wishlist', is_public: false,
            }).select().single();
            wId = newList?.id;
          }
        }

        // Get current product price
        const { data: product } = await supabase.from('products').select('pricing').eq('id', productId as string).single();
        const pricing = product?.pricing as { default?: { amount: number } } | null;
        const priceWhenAdded = pricing?.default?.amount ?? 0;

        const { data, error } = await supabase.from('wishlist_items').insert({
          wishlist_id: wId, product_id: productId, variant_id: variantId ?? null,
          price_when_added: priceWhenAdded, notify_on_price_drop: notifyOnPriceDrop ?? false,
        }).select().single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'get-price-drops': {
        const { customerId } = req.query;
        if (!customerId) return res.status(400).json({ error: 'customerId is required' });

        // Get all wishlist items with price_drop_notify = true for this customer
        const { data: wishlists } = await supabase.from('wishlists')
          .select('id').eq('customer_id', customerId as string).eq('venture_id', ventureId);
        if (!wishlists || wishlists.length === 0) return res.json({ data: [] });

        const wIds = wishlists.map((w) => w.id as string);
        const { data: items } = await supabase.from('wishlist_items')
          .select('*, products(name, pricing)').in('wishlist_id', wIds).eq('notify_on_price_drop', true);

        const priceDrops = (items ?? []).filter((item) => {
          const product = item.products as { pricing?: { default?: { amount: number } } } | null;
          const currentPrice = product?.pricing?.default?.amount ?? 0;
          const priceWhenAdded = Number(item.price_when_added ?? 0);
          return currentPrice < priceWhenAdded;
        }).map((item) => {
          const product = item.products as { name: string; pricing?: { default?: { amount: number } } } | null;
          const currentPrice = product?.pricing?.default?.amount ?? 0;
          return {
            productId: item.product_id,
            productName: product?.name ?? '',
            priceWhenAdded: Number(item.price_when_added),
            currentPrice,
            priceDrop: Number(item.price_when_added) - currentPrice,
          };
        });

        return res.json({ data: priceDrops });
      }

      // ── GIFT CARDS ───────────────────────────────────────────────────────────

      case 'create-gift-card': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { initialBalance, currency = 'USD', purchasedBy, recipientEmail, recipientMessage, expiresAt } = req.body;
        if (!initialBalance || Number(initialBalance) <= 0) return res.status(400).json({ error: 'initialBalance must be positive' });

        const code = `GC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const { data, error } = await supabase.from('gift_cards').insert({
          venture_id: ventureId, code,
          initial_balance: Number(initialBalance),
          current_balance: Number(initialBalance),
          currency,
          purchased_by: purchasedBy ?? null,
          recipient_email: recipientEmail ?? null,
          recipient_message: recipientMessage ?? null,
          status: 'active',
          expires_at: expiresAt ?? null,
          transactions: [],
        }).select().single();
        if (error) throw error;
        return res.json({ data });
      }

      case 'redeem': {
        if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
        const { code, amount, orderId } = req.body;
        if (!code || !amount) return res.status(400).json({ error: 'code and amount are required' });

        const { data: card, error: cardErr } = await supabase.from('gift_cards')
          .select().eq('code', code as string).eq('venture_id', ventureId).single();
        if (cardErr) throw cardErr;
        if (card.status !== 'active') return res.status(400).json({ error: 'Gift card is not active' });
        if (card.expires_at && new Date(card.expires_at as string) < new Date()) {
          return res.status(400).json({ error: 'Gift card has expired' });
        }

        const currentBalance = Number(card.current_balance);
        const redeemAmount = Math.min(Number(amount), currentBalance);
        const newBalance = currentBalance - redeemAmount;

        const transactions = (Array.isArray(card.transactions) ? card.transactions : []) as Record<string, unknown>[];
        await supabase.from('gift_cards').update({
          current_balance: newBalance,
          status: newBalance <= 0 ? 'redeemed' : 'active',
          redeemed_at: newBalance <= 0 ? new Date().toISOString() : null,
          transactions: [
            ...transactions,
            { id: crypto.randomUUID(), type: 'redemption', amount: redeemAmount, orderId: orderId ?? null, balanceAfter: newBalance, createdAt: new Date().toISOString() },
          ],
        }).eq('id', card.id);

        return res.json({ data: { redeemed: redeemAmount, remainingBalance: newBalance } });
      }

      case 'get-balance': {
        const { code } = req.query;
        if (!code) return res.status(400).json({ error: 'code is required' });
        const { data, error } = await supabase.from('gift_cards').select('code, current_balance, currency, status, expires_at')
          .eq('code', code as string).eq('venture_id', ventureId).single();
        if (error) throw error;
        return res.json({ data });
      }

      // ── SEARCH ───────────────────────────────────────────────────────────────

      case 'search': {
        const { query: searchQuery, categories, priceMin, priceMax, inStock, sortBy, tags } = req.query;
        if (!searchQuery) return res.status(400).json({ error: 'query is required' });

        let dbQuery = supabase.from('products').select('id, name, description, pricing, category_ids, tags, type, status')
          .eq('venture_id', ventureId).neq('status', 'archived')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);

        if (inStock === 'true') dbQuery = dbQuery.gt('inventory_count', 0);

        const sort = (sortBy as string) ?? 'relevance';
        if (sort === 'newest') dbQuery = dbQuery.order('created_at', { ascending: false });
        else dbQuery = dbQuery.order('name', { ascending: true });
        dbQuery = dbQuery.limit(100);

        const { data, error } = await dbQuery;
        if (error) throw error;

        let products = data ?? [];
        if (priceMin || priceMax) {
          products = products.filter((p) => {
            const pricing = p.pricing as { default?: { amount: number } } | null;
            const amt = pricing?.default?.amount ?? 0;
            if (priceMin && amt < Number(priceMin)) return false;
            if (priceMax && amt > Number(priceMax)) return false;
            return true;
          });
        }

        const lq = (searchQuery as string).toLowerCase();
        const scored = products.map((p) => ({
          productId: p.id as string,
          name: p.name as string,
          score: (p.name as string).toLowerCase().includes(lq) ? 1.0 : 0.6,
          highlight: p.description ? (p.description as string).slice(0, 120) : null,
        })).sort((a, b) => b.score - a.score);

        // Track search (fire and forget)
        supabase.from('search_analytics').insert({
          venture_id: ventureId, query: searchQuery,
          results_count: scored.length, clicked_product_id: null,
          converted: false, created_at: new Date().toISOString(),
        }).catch(() => {});

        return res.json({
          data: {
            query: searchQuery, totalCount: scored.length, products: scored,
          },
        });
      }

      case 'suggest': {
        const { query: suggestQuery } = req.query;
        if (!suggestQuery) return res.status(400).json({ error: 'query is required' });
        const { data, error } = await supabase.from('products').select('id, name')
          .eq('venture_id', ventureId).neq('status', 'archived')
          .ilike('name', `${suggestQuery}%`).order('name', { ascending: true }).limit(5);
        if (error) throw error;
        return res.json({ data: (data ?? []).map((p) => ({ productId: p.id, name: p.name })) });
      }

      // ── ANALYTICS ────────────────────────────────────────────────────────────

      case 'get-analytics': {
        const { from, to } = req.query;
        const dateRange = {
          from: (from as string) ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: (to as string) ?? new Date().toISOString(),
        };

        // Funnel
        const { data: searchData } = await supabase.from('search_analytics').select('query')
          .eq('venture_id', ventureId).gte('created_at', dateRange.from).lte('created_at', dateRange.to);
        const visitors = searchData?.length ?? 0;

        const { data: viewData } = await supabase.from('search_analytics').select('clicked_product_id')
          .eq('venture_id', ventureId).not('clicked_product_id', 'is', null)
          .gte('created_at', dateRange.from).lte('created_at', dateRange.to);
        const productViews = viewData?.length ?? 0;

        const { data: cartItemData } = await supabase.from('cart_items').select('id')
          .gte('created_at', dateRange.from).lte('created_at', dateRange.to);
        const addedToCart = cartItemData?.length ?? 0;

        const { data: checkoutData } = await supabase.from('cart_sessions').select('id')
          .eq('venture_id', ventureId).not('shipping_address', 'is', null)
          .gte('created_at', dateRange.from).lte('created_at', dateRange.to);
        const reachedCheckout = checkoutData?.length ?? 0;

        const { data: ordersData } = await supabase.from('orders').select('id, total_amount, customer_id')
          .eq('venture_id', ventureId).gte('created_at', dateRange.from).lte('created_at', dateRange.to);
        const completed = ordersData?.length ?? 0;

        // Cart abandonment
        const { data: abandonedData } = await supabase.from('cart_sessions').select('id, total, recovery_email_sent')
          .eq('venture_id', ventureId).not('abandoned_at', 'is', null)
          .gte('abandoned_at', dateRange.from).lte('abandoned_at', dateRange.to);
        const abandoned = abandonedData ?? [];
        const abandonedCount = abandoned.length;
        const totalCarts = addedToCart > 0 ? addedToCart : 1;
        const abandonmentRate = abandonedCount / totalCarts;
        const recovered = abandoned.filter((c) => c.recovery_email_sent === true);
        const revenueRecovered = recovered.reduce((s, c) => s + Number(c.total ?? 0), 0);

        // Top products from orders
        let topProducts: { productId: string; revenue: number; unitsSold: number }[] = [];
        if (ordersData && ordersData.length > 0) {
          const orderIds = ordersData.map((o) => o.id as string);
          const { data: items } = await supabase.from('order_items').select('product_id, quantity, unit_price').in('order_id', orderIds.slice(0, 500));
          if (items) {
            const productMap = new Map<string, { revenue: number; unitsSold: number }>();
            for (const item of items) {
              const pid = item.product_id as string;
              const qty = Number(item.quantity ?? 0);
              const price = Number(item.unit_price ?? 0);
              const ex = productMap.get(pid) ?? { revenue: 0, unitsSold: 0 };
              productMap.set(pid, { revenue: ex.revenue + qty * price, unitsSold: ex.unitsSold + qty });
            }
            topProducts = Array.from(productMap.entries()).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10).map(([productId, stats]) => ({ productId, ...stats }));
          }
        }

        // Customer metrics
        const totalRevenue = (ordersData ?? []).reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
        const avgOrderValue = completed > 0 ? totalRevenue / completed : 0;
        const customerCounts = new Map<string, number>();
        for (const o of ordersData ?? []) if (o.customer_id) customerCounts.set(o.customer_id as string, (customerCounts.get(o.customer_id as string) ?? 0) + 1);
        const repeatRate = customerCounts.size > 0 ? Array.from(customerCounts.values()).filter((c) => c >= 2).length / customerCounts.size : 0;

        const denominator = visitors > 0 ? visitors : (addedToCart > 0 ? addedToCart : 1);

        return res.json({
          data: {
            funnel: { visitors, productViews, addedToCart, reachedCheckout, completed, conversionRate: completed / denominator },
            cartAbandonment: { rate: abandonmentRate, recoveryRate: abandoned.length > 0 ? recovered.length / abandoned.length : 0, revenueRecovered, topAbandonedProducts: [] },
            topProducts,
            customerAcquisitionCost: 0,
            repeatPurchaseRate: repeatRate,
            averageOrderValue: avgOrderValue,
            cohorts: [],
          },
        });
      }

      case 'get-funnel': {
        const { from, to } = req.query;
        const dateRange = {
          from: (from as string) ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: (to as string) ?? new Date().toISOString(),
        };

        const [searchData, viewData, cartItemData, checkoutData, ordersData] = await Promise.all([
          supabase.from('search_analytics').select('query').eq('venture_id', ventureId).gte('created_at', dateRange.from).lte('created_at', dateRange.to),
          supabase.from('search_analytics').select('clicked_product_id').eq('venture_id', ventureId).not('clicked_product_id', 'is', null).gte('created_at', dateRange.from).lte('created_at', dateRange.to),
          supabase.from('cart_items').select('id').gte('created_at', dateRange.from).lte('created_at', dateRange.to),
          supabase.from('cart_sessions').select('id').eq('venture_id', ventureId).not('shipping_address', 'is', null).gte('created_at', dateRange.from).lte('created_at', dateRange.to),
          supabase.from('orders').select('id').eq('venture_id', ventureId).gte('created_at', dateRange.from).lte('created_at', dateRange.to),
        ]);

        const visitors = searchData.data?.length ?? 0;
        const productViews = viewData.data?.length ?? 0;
        const addedToCart = cartItemData.data?.length ?? 0;
        const reachedCheckout = checkoutData.data?.length ?? 0;
        const completed = ordersData.data?.length ?? 0;
        const denominator = visitors > 0 ? visitors : (addedToCart > 0 ? addedToCart : 1);

        return res.json({ data: { visitors, productViews, addedToCart, reachedCheckout, completed, conversionRate: completed / denominator } });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    return res.status(500).json({ error: message });
  }
}
