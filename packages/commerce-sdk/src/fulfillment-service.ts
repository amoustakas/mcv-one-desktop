// @mcv/commerce-sdk/fulfillment-service — order fulfillment, pick lists,
// returns, refund-ledger integration.
//
// First commerce service with TWO adapters: a LedgerAdapter (same 3-
// method shape as @mcv/payments-sdk/split-engine) for the refund journal
// entry, and an InventoryAdapter with a single returnStock method for
// restocking on `receiveReturn`. Both are intentionally minimal so
// consumers can bring their own ledger/inventory without importing the
// full @mcv/ledger-sdk or future @mcv/commerce-sdk/inventory-manager.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Fulfillment,
  FulfillmentItem,
  FulfillmentStatus,
  ReturnRequest,
  ReturnItem,
  ReturnStatus,
} from './surface-types';

// ─── Adapters ──────────────────────────────────────────────────────────

// Shared ledger contract — see @mcv/ledger-sdk/adapter.
import type { LedgerAdapter } from '@mcv/ledger-sdk';
export type {
  LedgerAccountRef,
  LedgerJournalEntryRef,
  LedgerJournalEntryInput,
  LedgerAdapter,
} from '@mcv/ledger-sdk';

export interface InventoryAdapter {
  returnStock(
    productId: string,
    locationId: string,
    quantity: number,
    referenceId: string,
    variantId?: string | null,
  ): Promise<unknown>;
}

// ─── Row mappers ────────────────────────────────────────────────────────

function mapFulfillmentItemRow(row: Record<string, unknown>): FulfillmentItem {
  return {
    id: row.id as string,
    fulfillmentId: row.fulfillment_id as string,
    orderItemId: row.order_item_id as string,
    quantity: Number(row.quantity),
  };
}

function mapFulfillmentRow(
  row: Record<string, unknown>,
  items: Record<string, unknown>[] = [],
): Fulfillment {
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    status: row.status as FulfillmentStatus,
    items: items.map(mapFulfillmentItemRow),
    trackingNumber: (row.tracking_number as string | null) ?? null,
    trackingUrl: (row.tracking_url as string | null) ?? null,
    carrier: (row.carrier as string | null) ?? null,
    shippedAt: (row.shipped_at as string | null) ?? null,
    deliveredAt: (row.delivered_at as string | null) ?? null,
    estimatedDelivery: (row.estimated_delivery as string | null) ?? null,
    shippingLabelUrl: (row.shipping_label_url as string | null) ?? null,
    returnLabelUrl: (row.return_label_url as string | null) ?? null,
    notes: (row.notes as string) ?? '',
    createdAt: row.created_at as string,
  };
}

function mapReturnItemRow(row: Record<string, unknown>): ReturnItem {
  return {
    id: row.id as string,
    returnRequestId: row.return_request_id as string,
    orderItemId: row.order_item_id as string,
    quantity: Number(row.quantity),
    reason: row.reason as string,
  };
}

function mapReturnRequestRow(
  row: Record<string, unknown>,
  items: Record<string, unknown>[] = [],
): ReturnRequest {
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    customerId: row.customer_id as string,
    items: items.map(mapReturnItemRow),
    reason: row.reason as string,
    status: row.status as ReturnStatus,
    refundAmount: row.refund_amount != null ? Number(row.refund_amount) : null,
    returnTrackingNumber: (row.return_tracking_number as string | null) ?? null,
    returnLabelUrl: (row.return_label_url as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Engine interface ──────────────────────────────────────────────────

export interface PickListItem {
  productId: string;
  variantId: string | null;
  productName: string;
  sku: string | null;
  totalQuantity: number;
  orders: Array<{ orderId: string; orderItemId: string; quantity: number }>;
}

export interface FulfillmentService {
  createFulfillment(
    orderId: string,
    items: Array<{ orderItemId: string; quantity: number }>,
  ): Promise<Fulfillment>;
  markShipped(
    fulfillmentId: string,
    trackingNumber: string,
    carrier: string,
    trackingUrl?: string | null,
  ): Promise<Fulfillment>;
  markDelivered(fulfillmentId: string): Promise<Fulfillment>;
  getOrderFulfillments(orderId: string): Promise<Fulfillment[]>;
  getUnfulfilledOrders(
    ventureId: string,
  ): Promise<Array<{ orderId: string; createdAt: string }>>;
  generatePickList(orderIds: string[]): Promise<PickListItem[]>;

  createReturnRequest(
    orderId: string,
    customerId: string,
    items: Array<{ orderItemId: string; quantity: number; reason: string }>,
    reason: string,
  ): Promise<ReturnRequest>;
  approveReturn(returnRequestId: string, refundAmount?: number | null): Promise<ReturnRequest>;
  receiveReturn(returnRequestId: string): Promise<ReturnRequest>;
  rejectReturn(returnRequestId: string, reason: string): Promise<ReturnRequest>;
  getReturnRequests(
    ventureId: string,
    filters?: { status?: ReturnStatus; customerId?: string; page?: number; pageSize?: number },
  ): Promise<{ returns: ReturnRequest[]; total: number }>;

  updateOrderFulfillmentStatus(orderId: string): Promise<void>;
}

export interface FulfillmentServiceOptions {
  supabase: SupabaseClient | null;
  ledger: LedgerAdapter;
  inventory: InventoryAdapter;
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createFulfillmentService({
  supabase,
  ledger,
  inventory,
}: FulfillmentServiceOptions): FulfillmentService {
  // Closed-over fetchers — not on the public interface.
  async function fetchFulfillmentWithItems(id: string): Promise<Fulfillment> {
    if (!supabase) throw new Error('Supabase client not available');

    const { data: fulfillment, error: fErr } = await supabase
      .from('fulfillments')
      .select()
      .eq('id', id)
      .single();

    if (fErr) throw new Error(`Failed to fetch fulfillment: ${fErr.message}`);

    const { data: items, error: iErr } = await supabase
      .from('fulfillment_items')
      .select()
      .eq('fulfillment_id', id);

    if (iErr) throw new Error(`Failed to fetch fulfillment items: ${iErr.message}`);

    return mapFulfillmentRow(fulfillment, items ?? []);
  }

  async function fetchReturnRequestWithItems(id: string): Promise<ReturnRequest> {
    if (!supabase) throw new Error('Supabase client not available');

    const { data: returnReq, error: rErr } = await supabase
      .from('return_requests')
      .select()
      .eq('id', id)
      .single();

    if (rErr) throw new Error(`Failed to fetch return request: ${rErr.message}`);

    const { data: items, error: iErr } = await supabase
      .from('return_items')
      .select()
      .eq('return_request_id', id);

    if (iErr) throw new Error(`Failed to fetch return items: ${iErr.message}`);

    return mapReturnRequestRow(returnReq, items ?? []);
  }

  const service: FulfillmentService = {
    async createFulfillment(orderId, items) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: fulfillment, error: fErr } = await supabase
        .from('fulfillments')
        .insert({
          order_id: orderId,
          status: 'unfulfilled',
          notes: '',
        })
        .select()
        .single();

      if (fErr) throw new Error(`Failed to create fulfillment: ${fErr.message}`);

      if (items.length > 0) {
        const itemRows = items.map((item) => ({
          fulfillment_id: fulfillment.id,
          order_item_id: item.orderItemId,
          quantity: item.quantity,
        }));

        const { error: iErr } = await supabase.from('fulfillment_items').insert(itemRows);
        if (iErr) throw new Error(`Failed to create fulfillment items: ${iErr.message}`);
      }

      await service.updateOrderFulfillmentStatus(orderId);

      return fetchFulfillmentWithItems(fulfillment.id);
    },

    async markShipped(fulfillmentId, trackingNumber, carrier, trackingUrl) {
      if (!supabase) throw new Error('Supabase client not available');

      // Estimated delivery: 5 business days from now.
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

      const { data, error } = await supabase
        .from('fulfillments')
        .update({
          status: 'fulfilled',
          tracking_number: trackingNumber,
          carrier,
          tracking_url: trackingUrl ?? null,
          shipped_at: new Date().toISOString(),
          estimated_delivery: estimatedDelivery.toISOString(),
        })
        .eq('id', fulfillmentId)
        .select()
        .single();

      if (error) throw new Error(`Failed to mark fulfillment as shipped: ${error.message}`);

      await service.updateOrderFulfillmentStatus(data.order_id as string);

      return fetchFulfillmentWithItems(fulfillmentId);
    },

    async markDelivered(fulfillmentId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('fulfillments')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
        })
        .eq('id', fulfillmentId)
        .select()
        .single();

      if (error) throw new Error(`Failed to mark fulfillment as delivered: ${error.message}`);

      await service.updateOrderFulfillmentStatus(data.order_id as string);

      return fetchFulfillmentWithItems(fulfillmentId);
    },

    async getOrderFulfillments(orderId) {
      if (!supabase) return [];

      const { data: fulfillments, error: fErr } = await supabase
        .from('fulfillments')
        .select()
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (fErr) throw new Error(`Failed to get order fulfillments: ${fErr.message}`);

      const result: Fulfillment[] = [];
      for (const f of fulfillments ?? []) {
        result.push(await fetchFulfillmentWithItems(f.id as string));
      }
      return result;
    },

    async getUnfulfilledOrders(ventureId) {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('venture_id', ventureId)
        .in('fulfillment_status', ['unfulfilled', 'partially_fulfilled'])
        .order('created_at', { ascending: true });

      if (error) throw new Error(`Failed to get unfulfilled orders: ${error.message}`);

      return (data ?? []).map((row: Record<string, unknown>) => ({
        orderId: row.id as string,
        createdAt: row.created_at as string,
      }));
    },

    async generatePickList(orderIds) {
      if (!supabase) return [];
      if (orderIds.length === 0) return [];

      const { data: fulfillments, error: fErr } = await supabase
        .from('fulfillments')
        .select('id, order_id')
        .in('order_id', orderIds)
        .in('status', ['unfulfilled', 'partially_fulfilled']);

      if (fErr) throw new Error(`Failed to get fulfillments for pick list: ${fErr.message}`);
      if (!fulfillments || fulfillments.length === 0) return [];

      const fulfillmentIds = (fulfillments as Array<{ id: string; order_id: string }>).map((f) => f.id);
      const fulfillmentOrderMap = new Map(
        (fulfillments as Array<{ id: string; order_id: string }>).map((f) => [f.id, f.order_id]),
      );

      const { data: items, error: iErr } = await supabase
        .from('fulfillment_items')
        .select('fulfillment_id, order_item_id, quantity')
        .in('fulfillment_id', fulfillmentIds);

      if (iErr) throw new Error(`Failed to get fulfillment items for pick list: ${iErr.message}`);
      if (!items || items.length === 0) return [];

      const orderItemIds = (items as Array<{ order_item_id: string }>).map((i) => i.order_item_id);

      const { data: orderItems, error: oiErr } = await supabase
        .from('order_items')
        .select('id, product_id, variant_id, product_name, sku')
        .in('id', orderItemIds);

      if (oiErr) throw new Error(`Failed to get order items for pick list: ${oiErr.message}`);

      const orderItemMap = new Map(
        (orderItems ?? []).map((oi: Record<string, unknown>) => [oi.id as string, oi]),
      );

      const aggregated = new Map<string, PickListItem>();

      for (const item of items as Array<{ fulfillment_id: string; order_item_id: string; quantity: number }>) {
        const orderItem = orderItemMap.get(item.order_item_id);
        if (!orderItem) continue;

        const productId = orderItem.product_id as string;
        const variantId = (orderItem.variant_id as string | null) ?? null;
        const key = `${productId}:${variantId ?? 'null'}`;
        const orderId = fulfillmentOrderMap.get(item.fulfillment_id) ?? '';

        if (!aggregated.has(key)) {
          aggregated.set(key, {
            productId,
            variantId,
            productName: (orderItem.product_name as string) ?? '',
            sku: (orderItem.sku as string | null) ?? null,
            totalQuantity: 0,
            orders: [],
          });
        }

        const entry = aggregated.get(key)!;
        entry.totalQuantity += item.quantity;
        entry.orders.push({ orderId, orderItemId: item.order_item_id, quantity: item.quantity });
      }

      return Array.from(aggregated.values()).sort((a, b) =>
        a.productName.localeCompare(b.productName),
      );
    },

    async createReturnRequest(orderId, customerId, items, reason) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: returnReq, error: rErr } = await supabase
        .from('return_requests')
        .insert({
          order_id: orderId,
          customer_id: customerId,
          reason,
          status: 'requested',
          refund_amount: null,
        })
        .select()
        .single();

      if (rErr) throw new Error(`Failed to create return request: ${rErr.message}`);

      if (items.length > 0) {
        const itemRows = items.map((item) => ({
          return_request_id: returnReq.id,
          order_item_id: item.orderItemId,
          quantity: item.quantity,
          reason: item.reason,
        }));

        const { error: iErr } = await supabase.from('return_items').insert(itemRows);
        if (iErr) throw new Error(`Failed to create return items: ${iErr.message}`);
      }

      return fetchReturnRequestWithItems(returnReq.id as string);
    },

    async approveReturn(returnRequestId, refundAmount) {
      if (!supabase) throw new Error('Supabase client not available');

      const returnReq = await fetchReturnRequestWithItems(returnRequestId);

      // Compute refund from item prices when caller didn't override.
      let calculatedRefund = refundAmount ?? null;
      if (calculatedRefund == null) {
        const orderItemIds = returnReq.items.map((i) => i.orderItemId);
        if (orderItemIds.length > 0) {
          const { data: orderItems } = await supabase
            .from('order_items')
            .select('id, unit_price')
            .in('id', orderItemIds);

          if (orderItems) {
            const priceMap = new Map(
              (orderItems as Array<{ id: string; unit_price: number }>).map((oi) => [
                oi.id,
                Number(oi.unit_price),
              ]),
            );
            calculatedRefund = returnReq.items.reduce(
              (sum, item) => sum + (priceMap.get(item.orderItemId) ?? 0) * item.quantity,
              0,
            );
          }
        }
      }

      const { data, error } = await supabase
        .from('return_requests')
        .update({
          status: 'approved',
          refund_amount: calculatedRefund,
          updated_at: new Date().toISOString(),
        })
        .eq('id', returnRequestId)
        .select()
        .single();

      if (error) throw new Error(`Failed to approve return: ${error.message}`);

      // Double-entry refund journal: DR 5040 Refunds & Chargebacks, CR 1010 Cash.
      // Only fires when there's actually a refund amount and the ledger
      // adapter resolves both accounts.
      if (calculatedRefund && calculatedRefund > 0) {
        const { data: order } = await supabase
          .from('orders')
          .select('venture_id')
          .eq('id', returnReq.orderId)
          .single();

        if (order?.venture_id) {
          const ventureId = order.venture_id as string;

          const refundsAccount = await ledger.getAccountByCode(ventureId, '5040');
          const cashAccount = await ledger.getAccountByCode(ventureId, '1010');

          if (refundsAccount && cashAccount) {
            const entry = await ledger.createJournalEntry({
              ventureId,
              entryDate: new Date().toISOString(),
              description: `Refund approved for return ${returnRequestId} on order ${returnReq.orderId}`,
              sourceType: 'return_request',
              sourceId: returnRequestId,
              lines: [
                {
                  accountId: refundsAccount.id,
                  debitAmount: calculatedRefund,
                  creditAmount: 0,
                  dimensions: { customerId: returnReq.customerId },
                },
                {
                  accountId: cashAccount.id,
                  debitAmount: 0,
                  creditAmount: calculatedRefund,
                  dimensions: { customerId: returnReq.customerId },
                },
              ],
            });

            await ledger.postJournalEntry(entry.id, 'system');
          }
        }
      }

      // data is used implicitly to ensure row updated — fresh read below.
      void data;
      return fetchReturnRequestWithItems(returnRequestId);
    },

    async receiveReturn(returnRequestId) {
      if (!supabase) throw new Error('Supabase client not available');

      const returnReq = await fetchReturnRequestWithItems(returnRequestId);

      // Restock for each item via the injected inventory adapter. We look
      // up product/variant/location from order_items so the caller's
      // inventory implementation doesn't need to know the return ↔ order
      // mapping.
      const orderItemIds = returnReq.items.map((i) => i.orderItemId);
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id, product_id, variant_id, location_id')
        .in('id', orderItemIds);

      if (orderItems) {
        for (const returnItem of returnReq.items) {
          const orderItem = (orderItems as Array<Record<string, unknown>>).find(
            (oi) => oi.id === returnItem.orderItemId,
          );
          if (!orderItem) continue;

          const productId = orderItem.product_id as string;
          const variantId = (orderItem.variant_id as string | null) ?? null;
          const locationId = (orderItem.location_id as string | null) ?? null;

          if (locationId) {
            await inventory.returnStock(
              productId,
              locationId,
              returnItem.quantity,
              returnRequestId,
              variantId,
            );
          }
        }
      }

      const { error } = await supabase
        .from('return_requests')
        .update({
          status: 'received',
          updated_at: new Date().toISOString(),
        })
        .eq('id', returnRequestId);

      if (error) throw new Error(`Failed to mark return as received: ${error.message}`);

      return fetchReturnRequestWithItems(returnRequestId);
    },

    async rejectReturn(returnRequestId, reason) {
      if (!supabase) throw new Error('Supabase client not available');

      const { error } = await supabase
        .from('return_requests')
        .update({
          status: 'rejected',
          reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', returnRequestId);

      if (error) throw new Error(`Failed to reject return: ${error.message}`);

      return fetchReturnRequestWithItems(returnRequestId);
    },

    async getReturnRequests(ventureId, filters) {
      if (!supabase) return { returns: [], total: 0 };

      const page = filters?.page ?? 1;
      const pageSize = filters?.pageSize ?? 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('return_requests')
        .select(
          `
          *,
          orders!inner(venture_id)
        `,
          { count: 'exact' },
        )
        .eq('orders.venture_id', ventureId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.customerId) query = query.eq('customer_id', filters.customerId);

      const { data, error, count } = await query;
      if (error) throw new Error(`Failed to get return requests: ${error.message}`);

      const returns: ReturnRequest[] = [];
      for (const row of data ?? []) {
        returns.push(await fetchReturnRequestWithItems(row.id as string));
      }

      return { returns, total: count ?? 0 };
    },

    async updateOrderFulfillmentStatus(orderId) {
      if (!supabase) return;

      const { data: orderItems, error: oiErr } = await supabase
        .from('order_items')
        .select('id, quantity')
        .eq('order_id', orderId);

      if (oiErr || !orderItems || orderItems.length === 0) return;

      const { data: fulfillments, error: fErr } = await supabase
        .from('fulfillments')
        .select('id, status')
        .eq('order_id', orderId)
        .neq('status', 'canceled');

      if (fErr) return;

      if (!fulfillments || fulfillments.length === 0) {
        await supabase
          .from('orders')
          .update({ fulfillment_status: 'unfulfilled' })
          .eq('id', orderId);
        return;
      }

      const fulfillmentIds = (fulfillments as Array<{ id: string; status: string }>).map((f) => f.id);
      const { data: fulfilledItems } = await supabase
        .from('fulfillment_items')
        .select('order_item_id, quantity')
        .in('fulfillment_id', fulfillmentIds);

      const fulfilledQtyMap = new Map<string, number>();
      for (const fi of fulfilledItems ?? []) {
        const key = fi.order_item_id as string;
        fulfilledQtyMap.set(key, (fulfilledQtyMap.get(key) ?? 0) + Number(fi.quantity));
      }

      const totalOrderQty = (orderItems as Array<{ id: string; quantity: number }>).reduce(
        (sum, oi) => sum + Number(oi.quantity),
        0,
      );

      const totalFulfilledQty = (orderItems as Array<{ id: string; quantity: number }>).reduce(
        (sum, oi) => sum + (fulfilledQtyMap.get(oi.id) ?? 0),
        0,
      );

      const allDelivered = (fulfillments as Array<{ status: string }>).every(
        (f) => f.status === 'delivered',
      );

      let fulfillmentStatus: FulfillmentStatus;

      if (totalFulfilledQty === 0) {
        fulfillmentStatus = 'unfulfilled';
      } else if (allDelivered && totalFulfilledQty >= totalOrderQty) {
        fulfillmentStatus = 'delivered';
      } else if (totalFulfilledQty >= totalOrderQty) {
        fulfillmentStatus = 'fulfilled';
      } else {
        fulfillmentStatus = 'partially_fulfilled';
      }

      await supabase
        .from('orders')
        .update({ fulfillment_status: fulfillmentStatus })
        .eq('id', orderId);
    },
  };

  return service;
}
