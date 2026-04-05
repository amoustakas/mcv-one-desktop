// src/lib/commerce/inventory-manager.ts
// Inventory Manager — Commerce Surface Layer
// Multi-location stock management: reservations, transfers, adjustments, audit trail

import { supabase } from '../supabase';
import type {
  InventoryLevel,
  InventoryLocation,
  InventoryMovement,
  InventoryMovementType,
} from './surface-types';
import type { SurfaceAddress } from './surface-types';

// ─────────────────────────────────────────────────────────
// ROW MAPPERS (snake_case → camelCase)
// ─────────────────────────────────────────────────────────

function mapLocationRow(row: Record<string, unknown>): InventoryLocation {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    name: row.name as string,
    address: (row.address as SurfaceAddress),
    isDefault: Boolean(row.is_default),
    status: row.status as 'active' | 'inactive',
  };
}

function mapLevelRow(row: Record<string, unknown>): InventoryLevel {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    variantId: (row.variant_id as string | null) ?? null,
    locationId: row.location_id as string,
    available: Number(row.available ?? 0),
    reserved: Number(row.reserved ?? 0),
    committed: Number(row.committed ?? 0),
    incoming: Number(row.incoming ?? 0),
    onHand: Number(row.on_hand ?? 0),
    lowStockThreshold: Number(row.low_stock_threshold ?? 0),
    backorderEnabled: Boolean(row.backorder_enabled),
  };
}

function mapMovementRow(row: Record<string, unknown>): InventoryMovement {
  return {
    id: row.id as string,
    productId: row.product_id as string,
    locationId: row.location_id as string,
    type: row.type as InventoryMovementType,
    quantity: Number(row.quantity),
    previousLevel: Number(row.previous_level),
    newLevel: Number(row.new_level),
    referenceType: (row.reference_type as string | null) ?? null,
    referenceId: (row.reference_id as string | null) ?? null,
    reason: row.reason as string,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
  };
}

// ─────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────

/**
 * Recalculate on_hand = available + reserved + committed and persist.
 */
async function recalculateOnHand(levelId: string): Promise<void> {
  if (!supabase) return;
  await supabase.rpc('recalculate_inventory_on_hand', { p_level_id: levelId }).then(
    async (res) => {
      if (res.error) {
        // Fallback: manual calculation
        const { data } = await supabase!
          .from('inventory_levels')
          .select('available, reserved, committed')
          .eq('id', levelId)
          .single();

        if (data) {
          const onHand =
            Number(data.available) + Number(data.reserved) + Number(data.committed);
          await supabase!
            .from('inventory_levels')
            .update({ on_hand: onHand })
            .eq('id', levelId);
        }
      }
    },
  );
}

/**
 * Create an inventory movement record for audit trail.
 */
async function createMovement(params: {
  productId: string;
  variantId?: string | null;
  locationId: string;
  type: InventoryMovementType;
  quantity: number;
  previousLevel: number;
  newLevel: number;
  referenceType?: string | null;
  referenceId?: string | null;
  reason: string;
  createdBy: string;
}): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('inventory_movements').insert({
    product_id: params.productId,
    variant_id: params.variantId ?? null,
    location_id: params.locationId,
    type: params.type,
    quantity: params.quantity,
    previous_level: params.previousLevel,
    new_level: params.newLevel,
    reference_type: params.referenceType ?? null,
    reference_id: params.referenceId ?? null,
    reason: params.reason,
    created_by: params.createdBy,
  });
  if (error) throw new Error(`Failed to create inventory movement: ${error.message}`);
}

// ─────────────────────────────────────────────────────────
// LOCATION MANAGEMENT
// ─────────────────────────────────────────────────────────

export async function createLocation(
  ventureId: string,
  name: string,
  address: SurfaceAddress,
  isDefault = false,
): Promise<InventoryLocation> {
  if (!supabase) throw new Error('Supabase client not available');

  // If setting as default, unset any existing default
  if (isDefault) {
    await supabase
      .from('inventory_locations')
      .update({ is_default: false })
      .eq('venture_id', ventureId)
      .eq('is_default', true);
  }

  const { data, error } = await supabase
    .from('inventory_locations')
    .insert({
      venture_id: ventureId,
      name,
      address,
      is_default: isDefault,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create location: ${error.message}`);
  return mapLocationRow(data);
}

export async function listLocations(ventureId: string): Promise<InventoryLocation[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('inventory_locations')
    .select()
    .eq('venture_id', ventureId)
    .order('is_default', { ascending: false });

  if (error) throw new Error(`Failed to list locations: ${error.message}`);
  return (data ?? []).map(mapLocationRow);
}

// ─────────────────────────────────────────────────────────
// INVENTORY LEVEL QUERIES
// ─────────────────────────────────────────────────────────

export async function getInventoryLevel(
  productId: string,
  locationId: string,
  variantId?: string | null,
): Promise<InventoryLevel | null> {
  if (!supabase) return null;

  let query = supabase
    .from('inventory_levels')
    .select()
    .eq('product_id', productId)
    .eq('location_id', locationId);

  if (variantId) {
    query = query.eq('variant_id', variantId);
  } else {
    query = query.is('variant_id', null);
  }

  const { data, error } = await query.single();
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(`Failed to get inventory level: ${error.message}`);
  return mapLevelRow(data);
}

export async function getInventoryLevels(
  productId: string,
  variantId?: string | null,
): Promise<InventoryLevel[]> {
  if (!supabase) return [];

  let query = supabase
    .from('inventory_levels')
    .select()
    .eq('product_id', productId);

  if (variantId !== undefined) {
    if (variantId) {
      query = query.eq('variant_id', variantId);
    } else {
      query = query.is('variant_id', null);
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get inventory levels: ${error.message}`);
  return (data ?? []).map(mapLevelRow);
}

// ─────────────────────────────────────────────────────────
// SET / ADJUST INVENTORY
// ─────────────────────────────────────────────────────────

export async function setInventoryLevel(
  productId: string,
  locationId: string,
  available: number,
  variantId?: string | null,
): Promise<InventoryLevel> {
  if (!supabase) throw new Error('Supabase client not available');

  const existing = await getInventoryLevel(productId, locationId, variantId);
  const previousLevel = existing?.available ?? 0;
  const onHand = available + (existing?.reserved ?? 0) + (existing?.committed ?? 0);

  let data: Record<string, unknown>;
  let error: { message: string } | null;

  if (existing) {
    const res = await supabase
      .from('inventory_levels')
      .update({ available, on_hand: onHand })
      .eq('id', existing.id)
      .select()
      .single();
    data = res.data;
    error = res.error;
  } else {
    const res = await supabase
      .from('inventory_levels')
      .insert({
        product_id: productId,
        variant_id: variantId ?? null,
        location_id: locationId,
        available,
        reserved: 0,
        committed: 0,
        incoming: 0,
        on_hand: available,
        low_stock_threshold: 5,
        backorder_enabled: false,
      })
      .select()
      .single();
    data = res.data;
    error = res.error;
  }

  if (error) throw new Error(`Failed to set inventory level: ${error.message}`);

  const level = mapLevelRow(data);

  await createMovement({
    productId,
    variantId,
    locationId,
    type: 'adjustment',
    quantity: available - previousLevel,
    previousLevel,
    newLevel: available,
    reason: 'Manual inventory set',
    createdBy: 'system',
  });

  return level;
}

export async function adjustInventory(
  productId: string,
  locationId: string,
  quantity: number,
  reason: string,
  createdBy: string,
  variantId?: string | null,
): Promise<InventoryLevel> {
  if (!supabase) throw new Error('Supabase client not available');

  const existing = await getInventoryLevel(productId, locationId, variantId);
  if (!existing) {
    throw new Error(`No inventory level found for product ${productId} at location ${locationId}`);
  }

  const newAvailable = existing.available + quantity;
  if (newAvailable < 0 && !existing.backorderEnabled) {
    throw new Error('Insufficient inventory — adjustment would result in negative stock');
  }

  const newOnHand = newAvailable + existing.reserved + existing.committed;

  const { data, error } = await supabase
    .from('inventory_levels')
    .update({ available: newAvailable, on_hand: newOnHand })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw new Error(`Failed to adjust inventory: ${error.message}`);

  await createMovement({
    productId,
    variantId,
    locationId,
    type: 'adjustment',
    quantity,
    previousLevel: existing.available,
    newLevel: newAvailable,
    reason,
    createdBy,
  });

  return mapLevelRow(data);
}

// ─────────────────────────────────────────────────────────
// RESERVATION LIFECYCLE
// ─────────────────────────────────────────────────────────

export async function reserveStock(
  productId: string,
  locationId: string,
  quantity: number,
  orderId: string,
  variantId?: string | null,
): Promise<InventoryLevel> {
  if (!supabase) throw new Error('Supabase client not available');

  const existing = await getInventoryLevel(productId, locationId, variantId);
  if (!existing) {
    throw new Error(`No inventory level found for product ${productId} at location ${locationId}`);
  }

  if (existing.available < quantity && !existing.backorderEnabled) {
    throw new Error(
      `Insufficient stock: ${existing.available} available, ${quantity} requested`,
    );
  }

  const newAvailable = existing.available - quantity;
  const newReserved = existing.reserved + quantity;
  const newOnHand = newAvailable + newReserved + existing.committed;

  const { data, error } = await supabase
    .from('inventory_levels')
    .update({
      available: newAvailable,
      reserved: newReserved,
      on_hand: newOnHand,
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw new Error(`Failed to reserve stock: ${error.message}`);

  await createMovement({
    productId,
    variantId,
    locationId,
    type: 'reservation',
    quantity: -quantity,
    previousLevel: existing.available,
    newLevel: newAvailable,
    referenceType: 'order',
    referenceId: orderId,
    reason: `Reservation for order ${orderId}`,
    createdBy: 'system',
  });

  return mapLevelRow(data);
}

export async function commitStock(
  productId: string,
  locationId: string,
  quantity: number,
  orderId: string,
  variantId?: string | null,
): Promise<InventoryLevel> {
  if (!supabase) throw new Error('Supabase client not available');

  const existing = await getInventoryLevel(productId, locationId, variantId);
  if (!existing) {
    throw new Error(`No inventory level found for product ${productId} at location ${locationId}`);
  }

  if (existing.reserved < quantity) {
    throw new Error(
      `Insufficient reserved stock: ${existing.reserved} reserved, ${quantity} requested`,
    );
  }

  const newReserved = existing.reserved - quantity;
  const newCommitted = existing.committed + quantity;
  const newOnHand = existing.available + newReserved + newCommitted;

  const { data, error } = await supabase
    .from('inventory_levels')
    .update({
      reserved: newReserved,
      committed: newCommitted,
      on_hand: newOnHand,
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw new Error(`Failed to commit stock: ${error.message}`);

  await createMovement({
    productId,
    variantId,
    locationId,
    type: 'sale',
    quantity: -quantity,
    previousLevel: existing.reserved,
    newLevel: newReserved,
    referenceType: 'order',
    referenceId: orderId,
    reason: `Order ${orderId} confirmed — stock committed`,
    createdBy: 'system',
  });

  return mapLevelRow(data);
}

export async function releaseReservation(
  productId: string,
  locationId: string,
  quantity: number,
  orderId: string,
  variantId?: string | null,
): Promise<InventoryLevel> {
  if (!supabase) throw new Error('Supabase client not available');

  const existing = await getInventoryLevel(productId, locationId, variantId);
  if (!existing) {
    throw new Error(`No inventory level found for product ${productId} at location ${locationId}`);
  }

  const releaseQty = Math.min(quantity, existing.reserved);
  const newReserved = existing.reserved - releaseQty;
  const newAvailable = existing.available + releaseQty;
  const newOnHand = newAvailable + newReserved + existing.committed;

  const { data, error } = await supabase
    .from('inventory_levels')
    .update({
      available: newAvailable,
      reserved: newReserved,
      on_hand: newOnHand,
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw new Error(`Failed to release reservation: ${error.message}`);

  await createMovement({
    productId,
    variantId,
    locationId,
    type: 'release',
    quantity: releaseQty,
    previousLevel: existing.reserved,
    newLevel: newReserved,
    referenceType: 'order',
    referenceId: orderId,
    reason: `Reservation released for order ${orderId} (cart timeout or cancellation)`,
    createdBy: 'system',
  });

  return mapLevelRow(data);
}

export async function deductStock(
  productId: string,
  locationId: string,
  quantity: number,
  orderId: string,
  variantId?: string | null,
): Promise<InventoryLevel> {
  if (!supabase) throw new Error('Supabase client not available');

  const existing = await getInventoryLevel(productId, locationId, variantId);
  if (!existing) {
    throw new Error(`No inventory level found for product ${productId} at location ${locationId}`);
  }

  if (existing.committed < quantity) {
    throw new Error(
      `Insufficient committed stock: ${existing.committed} committed, ${quantity} requested`,
    );
  }

  const newCommitted = existing.committed - quantity;
  const newOnHand = existing.available + existing.reserved + newCommitted;

  const { data, error } = await supabase
    .from('inventory_levels')
    .update({
      committed: newCommitted,
      on_hand: newOnHand,
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw new Error(`Failed to deduct stock: ${error.message}`);

  await createMovement({
    productId,
    variantId,
    locationId,
    type: 'sale',
    quantity: -quantity,
    previousLevel: existing.committed,
    newLevel: newCommitted,
    referenceType: 'order',
    referenceId: orderId,
    reason: `Stock deducted on shipment for order ${orderId}`,
    createdBy: 'system',
  });

  return mapLevelRow(data);
}

export async function returnStock(
  productId: string,
  locationId: string,
  quantity: number,
  returnId: string,
  variantId?: string | null,
): Promise<InventoryLevel> {
  if (!supabase) throw new Error('Supabase client not available');

  const existing = await getInventoryLevel(productId, locationId, variantId);
  if (!existing) {
    throw new Error(`No inventory level found for product ${productId} at location ${locationId}`);
  }

  const newAvailable = existing.available + quantity;
  const newOnHand = newAvailable + existing.reserved + existing.committed;

  const { data, error } = await supabase
    .from('inventory_levels')
    .update({
      available: newAvailable,
      on_hand: newOnHand,
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) throw new Error(`Failed to return stock: ${error.message}`);

  await createMovement({
    productId,
    variantId,
    locationId,
    type: 'return',
    quantity,
    previousLevel: existing.available,
    newLevel: newAvailable,
    referenceType: 'return_request',
    referenceId: returnId,
    reason: `Stock returned for return request ${returnId}`,
    createdBy: 'system',
  });

  return mapLevelRow(data);
}

// ─────────────────────────────────────────────────────────
// TRANSFER
// ─────────────────────────────────────────────────────────

export async function transferStock(
  productId: string,
  fromLocationId: string,
  toLocationId: string,
  quantity: number,
  variantId?: string | null,
): Promise<{ from: InventoryLevel; to: InventoryLevel }> {
  if (!supabase) throw new Error('Supabase client not available');

  const fromLevel = await getInventoryLevel(productId, fromLocationId, variantId);
  if (!fromLevel) {
    throw new Error(`No inventory level at source location for product ${productId}`);
  }

  if (fromLevel.available < quantity) {
    throw new Error(
      `Insufficient stock at source: ${fromLevel.available} available, ${quantity} requested`,
    );
  }

  // Deduct from source
  const newFromAvailable = fromLevel.available - quantity;
  const newFromOnHand = newFromAvailable + fromLevel.reserved + fromLevel.committed;

  const { data: fromData, error: fromErr } = await supabase
    .from('inventory_levels')
    .update({ available: newFromAvailable, on_hand: newFromOnHand })
    .eq('id', fromLevel.id)
    .select()
    .single();

  if (fromErr) throw new Error(`Failed to deduct stock from source: ${fromErr.message}`);

  await createMovement({
    productId,
    variantId,
    locationId: fromLocationId,
    type: 'transfer',
    quantity: -quantity,
    previousLevel: fromLevel.available,
    newLevel: newFromAvailable,
    referenceType: 'transfer',
    referenceId: `${fromLocationId}->${toLocationId}`,
    reason: `Transfer to location ${toLocationId}`,
    createdBy: 'system',
  });

  // Add to destination — upsert
  const toLevel = await getInventoryLevel(productId, toLocationId, variantId);
  let toData: Record<string, unknown>;
  let toErr: { message: string } | null;

  if (toLevel) {
    const newToAvailable = toLevel.available + quantity;
    const newToOnHand = newToAvailable + toLevel.reserved + toLevel.committed;
    const res = await supabase
      .from('inventory_levels')
      .update({ available: newToAvailable, on_hand: newToOnHand })
      .eq('id', toLevel.id)
      .select()
      .single();
    toData = res.data;
    toErr = res.error;
  } else {
    const res = await supabase
      .from('inventory_levels')
      .insert({
        product_id: productId,
        variant_id: variantId ?? null,
        location_id: toLocationId,
        available: quantity,
        reserved: 0,
        committed: 0,
        incoming: 0,
        on_hand: quantity,
        low_stock_threshold: 5,
        backorder_enabled: false,
      })
      .select()
      .single();
    toData = res.data;
    toErr = res.error;
  }

  if (toErr) throw new Error(`Failed to add stock to destination: ${toErr.message}`);

  const prevToLevel = toLevel?.available ?? 0;
  await createMovement({
    productId,
    variantId,
    locationId: toLocationId,
    type: 'transfer',
    quantity,
    previousLevel: prevToLevel,
    newLevel: prevToLevel + quantity,
    referenceType: 'transfer',
    referenceId: `${fromLocationId}->${toLocationId}`,
    reason: `Transfer from location ${fromLocationId}`,
    createdBy: 'system',
  });

  return {
    from: mapLevelRow(fromData),
    to: mapLevelRow(toData),
  };
}

// ─────────────────────────────────────────────────────────
// REPORTING
// ─────────────────────────────────────────────────────────

export async function getLowStockProducts(
  ventureId: string,
  locationId?: string,
): Promise<InventoryLevel[]> {
  if (!supabase) return [];

  // Get all products for this venture
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('venture_id', ventureId);

  const productIds = (products ?? []).map((p: { id: string }) => p.id);
  if (productIds.length === 0) return [];

  let query = supabase
    .from('inventory_levels')
    .select()
    .in('product_id', productIds);

  if (locationId) query = query.eq('location_id', locationId);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get low stock products: ${error.message}`);

  return (data ?? [])
    .map(mapLevelRow)
    .filter((level) => level.available <= level.lowStockThreshold);
}

export async function getInventoryMovements(
  productId: string,
  locationId?: string,
  limit = 50,
): Promise<InventoryMovement[]> {
  if (!supabase) return [];

  let query = supabase
    .from('inventory_movements')
    .select()
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (locationId) query = query.eq('location_id', locationId);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to get inventory movements: ${error.message}`);
  return (data ?? []).map(mapMovementRow);
}
