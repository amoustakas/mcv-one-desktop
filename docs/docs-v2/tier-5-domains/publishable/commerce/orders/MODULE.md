# @mcv/commerce/orders

> **Tier 5 Domain Module** · Commerce · Order Management
> **Classification:** Publishable
> **Package:** `@mcv/commerce/orders`
> **Registry:** `npm:@mcv/commerce-orders`
> **Since:** 0.1.0

---

## Purpose

The `@mcv/commerce/orders` module is the transactional backbone of the MCV.ONE commerce platform, orchestrating the complete order lifecycle from the moment a customer completes checkout through fulfillment, delivery, and—when necessary—returns and refunds. It implements a deterministic finite state machine that governs every order's progression through well-defined stages: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, and `completed`, with cancellation branches available at any pre-shipment stage. Every state transition is recorded as an immutable timeline event, published to Redpanda for downstream consumers, and made visible to both merchants and customers through configurable notification channels. This module is the single source of truth for "what was bought, what was paid, and what happened next."

Order management in a multi-venture SaaS platform demands more than simple CRUD operations. Each venture operates with its own order numbering scheme, fulfillment locations, tax configurations, and return policies—yet customers who interact with multiple ventures expect a consolidated view of their purchase history. The module resolves this tension through Supabase row-level security policies that partition data by venture while exposing cross-venture aggregation endpoints for platform administrators. Payment tracking supports the full complexity of modern commerce: split payments across multiple methods, partial captures, authorization holds, and multi-currency settlements. The payment timeline maintains a complete audit trail that satisfies PCI-DSS requirements for transaction record-keeping without ever storing raw card data.

Fulfillment is where orders meet the physical world, and this module models that complexity faithfully. A single order can be split across multiple shipments originating from different fulfillment locations, each progressing independently through pick, pack, and ship stages. Shipping label generation integrates with carrier APIs through the `@mcv/commerce/shipping` module, and tracking numbers flow back into the order timeline as real-time updates. Returns and refunds are first-class citizens: the RMA (Return Merchandise Authorization) workflow supports partial returns, exchanges, restocking fees, and automated refund calculations that account for proportional discounts and tax adjustments. Subscription orders—generated automatically from recurring schedules managed by `@mcv/commerce/subscriptions`—flow through the same pipeline, ensuring consistent fulfillment and analytics regardless of how an order originates.

---

## Exports

```typescript
// @mcv/commerce/orders — public export map

// ── Core Service ─────────────────────────────────────────────
export { OrderService }              from './services/order.service';
export { OrderSearchService }        from './services/order-search.service';
export { FulfillmentService }        from './services/fulfillment.service';
export { RefundService }             from './services/refund.service';
export { ReturnService }             from './services/return.service';
export { OrderTimelineService }      from './services/order-timeline.service';
export { OrderAnalyticsService }     from './services/order-analytics.service';
export { OrderNumberingService }     from './services/order-numbering.service';
export { SubscriptionOrderService }  from './services/subscription-order.service';
export { OrderNotificationService }  from './services/order-notification.service';
export { OrderImportService }        from './services/order-import.service';
export { OrderExportService }        from './services/order-export.service';
export { OrderBulkService }          from './services/order-bulk.service';
export { OrderTagService }           from './services/order-tag.service';

// ── tRPC Router ──────────────────────────────────────────────
export { orderRouter }               from './trpc/order.router';
export { fulfillmentRouter }         from './trpc/fulfillment.router';
export { returnRouter }              from './trpc/return.router';
export { refundRouter }              from './trpc/refund.router';
export { orderAnalyticsRouter }      from './trpc/order-analytics.router';
export { orderSearchRouter }         from './trpc/order-search.router';

// ── Core Types ───────────────────────────────────────────────
export type { Order }                from './types/order';
export type { OrderItem }            from './types/order-item';
export type { OrderPayment }         from './types/order-payment';
export type { Fulfillment }          from './types/fulfillment';
export type { FulfillmentItem }      from './types/fulfillment-item';
export type { Shipment }             from './types/shipment';
export type { ReturnRequest }        from './types/return-request';
export type { ReturnItem }           from './types/return-item';
export type { Refund }               from './types/refund';
export type { OrderNote }            from './types/order-note';
export type { OrderTimelineEvent }   from './types/order-timeline-event';
export type { OrderTag }             from './types/order-tag';

// ── Enums ────────────────────────────────────────────────────
export { OrderStatus }               from './enums/order-status';
export { PaymentStatus }             from './enums/payment-status';
export { FulfillmentStatus }         from './enums/fulfillment-status';
export { ReturnStatus }              from './enums/return-status';
export { RefundStatus }              from './enums/refund-status';
export { ShipmentStatus }            from './enums/shipment-status';
export { OrderTimelineEventType }    from './enums/order-timeline-event-type';
export { ReturnReason }              from './enums/return-reason';
export { CancellationReason }        from './enums/cancellation-reason';

// ── Input / Output Schemas (Zod) ────────────────────────────
export { CreateOrderInput }          from './schemas/create-order.input';
export { UpdateOrderInput }          from './schemas/update-order.input';
export { CreateFulfillmentInput }    from './schemas/create-fulfillment.input';
export { CreateReturnInput }         from './schemas/create-return.input';
export { CreateRefundInput }         from './schemas/create-refund.input';
export { OrderSearchInput }          from './schemas/order-search.input';
export { OrderBulkUpdateInput }      from './schemas/order-bulk-update.input';
export { OrderImportInput }          from './schemas/order-import.input';
export { OrderAnalyticsInput }       from './schemas/order-analytics.input';

// ── Events (Redpanda) ───────────────────────────────────────
export { OrderCreatedEvent }         from './events/order-created.event';
export { OrderConfirmedEvent }       from './events/order-confirmed.event';
export { OrderCancelledEvent }       from './events/order-cancelled.event';
export { OrderFulfilledEvent }       from './events/order-fulfilled.event';
export { OrderShippedEvent }         from './events/order-shipped.event';
export { OrderDeliveredEvent }       from './events/order-delivered.event';
export { OrderCompletedEvent }       from './events/order-completed.event';
export { OrderRefundedEvent }        from './events/order-refunded.event';
export { ReturnRequestedEvent }      from './events/return-requested.event';
export { ReturnCompletedEvent }      from './events/return-completed.event';
export { PaymentCapturedEvent }      from './events/payment-captured.event';

// ── Database Schema ──────────────────────────────────────────
export { orders }                    from './db/schema/orders';
export { orderItems }                from './db/schema/order-items';
export { orderPayments }             from './db/schema/order-payments';
export { fulfillments }              from './db/schema/fulfillments';
export { fulfillmentItems }          from './db/schema/fulfillment-items';
export { shipments }                 from './db/schema/shipments';
export { returnRequests }            from './db/schema/return-requests';
export { returnItems }               from './db/schema/return-items';
export { refunds }                   from './db/schema/refunds';
export { orderNotes }                from './db/schema/order-notes';
export { orderTimeline }             from './db/schema/order-timeline';
export { orderTags }                 from './db/schema/order-tags';

// ── Hooks (React) ────────────────────────────────────────────
export { useOrder }                  from './hooks/use-order';
export { useOrders }                 from './hooks/use-orders';
export { useOrderSearch }            from './hooks/use-order-search';
export { useOrderTimeline }          from './hooks/use-order-timeline';
export { useOrderAnalytics }         from './hooks/use-order-analytics';
export { useFulfillment }           from './hooks/use-fulfillment';
export { useReturnRequest }          from './hooks/use-return-request';
export { useOrderMutations }         from './hooks/use-order-mutations';

// ── Utilities ────────────────────────────────────────────────
export { calculateOrderTotals }      from './utils/calculate-order-totals';
export { calculateRefundAmount }     from './utils/calculate-refund-amount';
export { generateOrderNumber }       from './utils/generate-order-number';
export { validateStateTransition }   from './utils/validate-state-transition';
export { snapshotProductAtPurchase } from './utils/snapshot-product';
export { buildOrderSearchQuery }     from './utils/build-order-search-query';
export { formatOrderForExport }      from './utils/format-order-export';
export { parseOrderImport }          from './utils/parse-order-import';
```

---

## Architecture

### Order State Machine

```
                         ┌──────────────────────────────────────────────┐
                         │           ORDER STATE MACHINE                │
                         └──────────────────────────────────────────────┘

   ┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │   PENDING    │────▶│  CONFIRMED   │────▶│  PROCESSING  │────▶│   SHIPPED    │
   │              │     │              │     │              │     │              │
   │ Awaiting     │     │ Payment      │     │ Fulfillment  │     │ In transit   │
   │ payment      │     │ captured     │     │ in progress  │     │ to customer  │
   └──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
          │                    │                    │                    │
          │  cancel            │  cancel            │  cancel            │
          ▼                    ▼                    ▼                    ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────────┐
   │  CANCELLED   │     │  CANCELLED  │     │  CANCELLED  │     │  DELIVERED   │
   │              │     │  + Refund   │     │  + Refund   │     │              │
   │ No payment   │     │  initiated  │     │  initiated  │     │ Customer     │
   │ captured     │     │             │     │             │     │ received     │
   └──────────────┘     └─────────────┘     └─────────────┘     └──────┬───────┘
                                                                       │
                                                                       ▼
                                                                ┌──────────────┐
                                                                │  COMPLETED   │
                                                                │              │
                                                                │ Return       │
                                                                │ window       │
                                                                │ expired      │
                                                                └──────┬───────┘
                                                                       │
                                                              return   │
                                                              request  │
                                                                       ▼
                                                                ┌──────────────┐
                                                                │  RETURNED    │
                                                                │  (partial/   │
                                                                │   full)      │
                                                                └──────────────┘

   ─── Valid Transitions ───────────────────────────────────────────────────────

   pending     → confirmed | cancelled
   confirmed   → processing | cancelled
   processing  → shipped | partially_shipped | cancelled
   shipped     → delivered
   delivered   → completed | returned (via return request)
   completed   → returned (within return window)

   ─── Cancellation Rules ──────────────────────────────────────────────────────

   • PENDING:     Cancel freely; no refund needed (no payment captured)
   • CONFIRMED:   Cancel + auto-initiate full refund
   • PROCESSING:  Cancel if no items picked; partial refund if some fulfilled
   • SHIPPED+:    Cannot cancel — must use return/refund flow
```

### Fulfillment Pipeline

```
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                    FULFILLMENT PIPELINE                                 │
   └─────────────────────────────────────────────────────────────────────────┘

   ORDER CONFIRMED
         │
         ▼
   ┌──────────────┐     Can an order be fulfilled from
   │  ROUTE ORDER  │     a single location?
   │  to locations │─────────────────────────────┐
   └──────┬───────┘                              │
          │ yes                                  │ no
          ▼                                      ▼
   ┌──────────────┐                   ┌───────────────────┐
   │  SINGLE       │                   │  SPLIT ORDER       │
   │  FULFILLMENT  │                   │  into N fulfillments│
   └──────┬───────┘                   └──────┬────────────┘
          │                                  │
          │          ┌───────────────────────┬┘
          │          │                       │
          ▼          ▼                       ▼
   ┌──────────────────────────────────────────────┐
   │            PER-FULFILLMENT WORKFLOW           │
   │                                               │
   │  ┌────────┐   ┌────────┐   ┌────────┐       │
   │  │  PICK   │──▶│  PACK  │──▶│  SHIP  │       │
   │  │        │   │        │   │        │       │
   │  │ Assign │   │ Box &  │   │ Label  │       │
   │  │ items  │   │ weigh  │   │ + hand │       │
   │  │ to bins│   │        │   │ off    │       │
   │  └────────┘   └────────┘   └───┬────┘       │
   │                                 │             │
   └─────────────────────────────────┼─────────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │  SHIPMENT     │
                              │               │
                              │ carrier_code  │
                              │ tracking_no   │
                              │ label_url     │
                              │ estimated_    │
                              │  delivery     │
                              └──────┬───────┘
                                     │
                          ┌──────────┼──────────┐
                          ▼          ▼          ▼
                    ┌──────────┐ ┌────────┐ ┌────────────┐
                    │ IN       │ │ OUT    │ │ DELIVERED  │
                    │ TRANSIT  │ │ FOR    │ │            │
                    │          │ │ DELIVERY│ │            │
                    └──────────┘ └────────┘ └────────────┘


   ─── Partial Shipment Logic ──────────────────────────────────────────────

   When not all items are shipped:
     order.status = "partially_shipped"
     order.fulfillment_status = "partial"

   When ALL fulfillments reach "shipped":
     order.status = "shipped"
     order.fulfillment_status = "fulfilled"
```

### Return & Refund Flow

```
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                    RETURN & REFUND FLOW                                 │
   └─────────────────────────────────────────────────────────────────────────┘

   CUSTOMER / ADMIN
         │
         │  Initiate return
         ▼
   ┌──────────────┐
   │ CREATE RMA    │  return_request record
   │               │  status: requested
   │ • items[]     │  • return_reason
   │ • quantities  │  • return_type: refund | exchange
   │ • reason      │  • images (optional)
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐     ┌──────────────┐
   │  APPROVED?    │─no─▶│  REJECTED    │
   │               │     │              │
   │ Policy check  │     │ Reason       │
   │ + admin review│     │ recorded     │
   └──────┬───────┘     └──────────────┘
          │ yes
          ▼
   ┌──────────────┐
   │ RETURN LABEL  │  Generate or provide
   │ GENERATED     │  return shipping label
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ ITEMS         │  Warehouse receives
   │ RECEIVED      │  and inspects items
   └──────┬───────┘
          │
          ├── condition: acceptable ──┐
          │                           │
          ├── condition: damaged ─────┤
          │                           │
          ▼                           ▼
   ┌──────────────┐          ┌──────────────┐
   │ REFUND CALC   │          │ RESTOCKING   │
   │               │          │ FEE APPLIED  │
   │ item_total    │          │              │
   │ - restocking  │          │ % of item    │
   │ - return_ship │          │ value        │
   │ + tax_refund  │          └──────┬───────┘
   └──────┬───────┘                 │
          │◀────────────────────────┘
          ▼
   ┌──────────────┐          ┌──────────────┐
   │ REFUND TYPE   │          │ EXCHANGE     │
   │               │          │ ORDER        │
   │ original_     │          │ CREATED      │
   │ payment       │          │              │
   │ method        │          │ Links to     │
   │               │          │ original RMA │
   └──────┬───────┘          └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ REFUND        │  refund.status: completed
   │ PROCESSED     │  order_payment updated
   └──────────────┘
```

### Event Flow (Redpanda)

```
   ┌─────────────────────────────────────────────────────────────────────────┐
   │                    EVENT TOPOLOGY (Redpanda)                            │
   └─────────────────────────────────────────────────────────────────────────┘

   Producer                    Topic                    Consumers
   ─────────────────────────────────────────────────────────────────────────

   OrderService ──────▶  commerce.orders.created  ──▶  NotificationService
                                                  ──▶  AnalyticsIngester
                                                  ──▶  InventoryService

   OrderService ──────▶  commerce.orders.confirmed ──▶  FulfillmentService
                                                   ──▶  PaymentService
                                                   ──▶  NotificationService

   FulfillmentService ▶  commerce.orders.shipped  ──▶  NotificationService
                                                  ──▶  TrackingService

   OrderService ──────▶  commerce.orders.cancelled──▶  RefundService
                                                  ──▶  InventoryService
                                                  ──▶  NotificationService

   ReturnService ─────▶  commerce.returns.requested──▶ NotificationService
                                                   ──▶ FulfillmentService

   RefundService ─────▶  commerce.refunds.processed──▶ NotificationService
                                                   ──▶ AccountingService
                                                   ──▶ AnalyticsIngester

   ─── Topic Schema ────────────────────────────────────────────────────────

   All events follow CloudEvents v1.0 envelope:
   {
     specversion: "1.0",
     type: "commerce.orders.created",
     source: "/ventures/{ventureId}/orders",
     subject: "{orderId}",
     id: "{eventId}",          // idempotency key
     time: "ISO-8601",
     datacontenttype: "application/json",
     data: { ... }             // event-specific payload
   }
```

---

## Core Interfaces

### Order

```typescript
import { z } from 'zod';

// ── Enums ────────────────────────────────────────────────────

export enum OrderStatus {
  PENDING            = 'pending',
  CONFIRMED          = 'confirmed',
  PROCESSING         = 'processing',
  PARTIALLY_SHIPPED  = 'partially_shipped',
  SHIPPED            = 'shipped',
  DELIVERED          = 'delivered',
  COMPLETED          = 'completed',
  CANCELLED          = 'cancelled',
  RETURNED           = 'returned',
}

export enum PaymentStatus {
  PENDING              = 'pending',
  AUTHORIZED           = 'authorized',
  PARTIALLY_CAPTURED   = 'partially_captured',
  CAPTURED             = 'captured',
  PARTIALLY_REFUNDED   = 'partially_refunded',
  REFUNDED             = 'refunded',
  VOIDED               = 'voided',
  FAILED               = 'failed',
}

export enum FulfillmentStatus {
  UNFULFILLED      = 'unfulfilled',
  PARTIAL          = 'partial',
  FULFILLED        = 'fulfilled',
  RETURNED         = 'returned',
}

export enum ReturnStatus {
  REQUESTED        = 'requested',
  APPROVED         = 'approved',
  LABEL_GENERATED  = 'label_generated',
  IN_TRANSIT       = 'in_transit',
  RECEIVED         = 'received',
  INSPECTED        = 'inspected',
  COMPLETED        = 'completed',
  REJECTED         = 'rejected',
  CANCELLED        = 'cancelled',
}

export enum RefundStatus {
  PENDING          = 'pending',
  PROCESSING       = 'processing',
  COMPLETED        = 'completed',
  FAILED           = 'failed',
  CANCELLED        = 'cancelled',
}

export enum ShipmentStatus {
  LABEL_CREATED    = 'label_created',
  PICKED_UP        = 'picked_up',
  IN_TRANSIT       = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED        = 'delivered',
  FAILED_DELIVERY  = 'failed_delivery',
  RETURNED_TO_SENDER = 'returned_to_sender',
}

export enum ReturnReason {
  DEFECTIVE             = 'defective',
  NOT_AS_DESCRIBED      = 'not_as_described',
  WRONG_ITEM            = 'wrong_item',
  ARRIVED_DAMAGED       = 'arrived_damaged',
  ARRIVED_LATE          = 'arrived_late',
  NO_LONGER_NEEDED      = 'no_longer_needed',
  BETTER_PRICE_FOUND    = 'better_price_found',
  ACCIDENTAL_PURCHASE   = 'accidental_purchase',
  SIZE_FIT_ISSUE        = 'size_fit_issue',
  QUALITY_NOT_EXPECTED  = 'quality_not_expected',
  OTHER                 = 'other',
}

export enum CancellationReason {
  CUSTOMER_REQUEST      = 'customer_request',
  OUT_OF_STOCK          = 'out_of_stock',
  PAYMENT_FAILED        = 'payment_failed',
  FRAUD_SUSPECTED       = 'fraud_suspected',
  DUPLICATE_ORDER       = 'duplicate_order',
  PRICING_ERROR         = 'pricing_error',
  SHIPPING_UNAVAILABLE  = 'shipping_unavailable',
  ADMIN_CANCELLATION    = 'admin_cancellation',
  OTHER                 = 'other',
}

export enum OrderTimelineEventType {
  ORDER_CREATED         = 'order_created',
  ORDER_CONFIRMED       = 'order_confirmed',
  PAYMENT_AUTHORIZED    = 'payment_authorized',
  PAYMENT_CAPTURED      = 'payment_captured',
  PAYMENT_FAILED        = 'payment_failed',
  FULFILLMENT_CREATED   = 'fulfillment_created',
  ITEMS_PICKED          = 'items_picked',
  ITEMS_PACKED          = 'items_packed',
  SHIPMENT_CREATED      = 'shipment_created',
  SHIPMENT_UPDATE       = 'shipment_update',
  ORDER_SHIPPED         = 'order_shipped',
  ORDER_DELIVERED       = 'order_delivered',
  ORDER_COMPLETED       = 'order_completed',
  ORDER_CANCELLED       = 'order_cancelled',
  RETURN_REQUESTED      = 'return_requested',
  RETURN_APPROVED       = 'return_approved',
  RETURN_REJECTED       = 'return_rejected',
  RETURN_RECEIVED       = 'return_received',
  RETURN_COMPLETED      = 'return_completed',
  REFUND_INITIATED      = 'refund_initiated',
  REFUND_COMPLETED      = 'refund_completed',
  REFUND_FAILED         = 'refund_failed',
  NOTE_ADDED            = 'note_added',
  TAG_ADDED             = 'tag_added',
  TAG_REMOVED           = 'tag_removed',
  EDIT_APPLIED          = 'edit_applied',
  EMAIL_SENT            = 'email_sent',
  CUSTOMER_NOTIFIED     = 'customer_notified',
}

// ── Core Interfaces ──────────────────────────────────────────

/**
 * Represents a monetary amount with currency.
 * All monetary values in the orders module use this structure
 * to avoid floating-point arithmetic issues.
 */
export interface Money {
  /** Amount in the smallest currency unit (e.g., cents for USD). */
  amount: number;
  /** ISO 4217 currency code. */
  currency: string;
}

/**
 * Address used for shipping and billing throughout the order lifecycle.
 */
export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  countryCode: string;          // ISO 3166-1 alpha-2
  phone?: string;
  isDefault?: boolean;
}

/**
 * Snapshot of a product at the time of purchase.
 * Decouples the order from future catalog changes.
 */
export interface ProductSnapshot {
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  variantName?: string;
  imageUrl?: string;
  weight?: {
    value: number;
    unit: 'g' | 'kg' | 'oz' | 'lb';
  };
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  attributes: Record<string, string>;   // e.g., { color: "Red", size: "M" }
  taxCode?: string;
}

/**
 * An individual line item within an order.
 */
export interface OrderItem {
  id: string;
  orderId: string;
  productSnapshot: ProductSnapshot;
  quantity: number;
  unitPrice: Money;
  compareAtPrice?: Money;
  discountAllocations: DiscountAllocation[];
  taxLines: TaxLine[];
  subtotal: Money;                      // unitPrice × quantity
  totalDiscount: Money;                 // sum of all discount allocations
  totalTax: Money;                      // sum of all tax lines
  total: Money;                         // subtotal - totalDiscount + totalTax
  fulfilledQuantity: number;
  returnedQuantity: number;
  refundedQuantity: number;
  customFields?: Record<string, unknown>;
  requiresShipping: boolean;
  isGiftCard: boolean;
  giftCardCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Discount allocation applied to a specific line item.
 */
export interface DiscountAllocation {
  discountId: string;
  discountCode?: string;
  description: string;
  amount: Money;
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping';
}

/**
 * Tax line computed for a line item.
 */
export interface TaxLine {
  title: string;              // e.g., "CA State Tax", "GST", "VAT"
  rate: number;               // e.g., 0.0825 for 8.25%
  amount: Money;
  jurisdiction?: string;
  taxCode?: string;
}

/**
 * The Order — central aggregate of the commerce domain.
 */
export interface Order {
  id: string;
  ventureId: string;
  orderNumber: string;                  // Venture-specific display number
  externalId?: string;                  // ID from external system (imports)

  // ── Customer ───────────────────────────
  customerId?: string;                  // null for guest checkout
  customerEmail: string;
  customerPhone?: string;
  customerNote?: string;                // Note from customer at checkout

  // ── Status ─────────────────────────────
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;

  // ── Addresses ──────────────────────────
  shippingAddress?: Address;
  billingAddress: Address;

  // ── Line Items ─────────────────────────
  items: OrderItem[];

  // ── Financials ─────────────────────────
  subtotal: Money;                      // Sum of item subtotals
  totalDiscounts: Money;                // Sum of all discount allocations
  totalShipping: Money;                 // Shipping cost
  totalTax: Money;                      // Sum of all tax lines
  total: Money;                         // Grand total (subtotal - discounts + shipping + tax)
  totalRefunded: Money;                 // Sum of all completed refunds
  totalOutstanding: Money;              // total - totalRefunded
  currency: string;                     // Primary currency (ISO 4217)

  // ── Shipping ───────────────────────────
  shippingMethod?: {
    id: string;
    name: string;
    carrier: string;
    estimatedDays: number;
    price: Money;
  };

  // ── Discounts (order-level) ────────────
  discountCodes: string[];
  discountAllocations: DiscountAllocation[];

  // ── Tax ────────────────────────────────
  taxLines: TaxLine[];
  taxExempt: boolean;
  taxExemptionCode?: string;

  // ── Payments ───────────────────────────
  payments: OrderPayment[];

  // ── Fulfillment ────────────────────────
  fulfillments: Fulfillment[];

  // ── Returns / Refunds ──────────────────
  returnRequests: ReturnRequest[];
  refunds: Refund[];

  // ── Metadata ───────────────────────────
  tags: string[];
  notes: OrderNote[];
  timeline: OrderTimelineEvent[];
  source: OrderSource;
  sourceId?: string;                    // e.g., checkout session ID
  ip?: string;
  userAgent?: string;
  locale?: string;
  customFields?: Record<string, unknown>;

  // ── Cancellation ───────────────────────
  cancelledAt?: Date;
  cancellationReason?: CancellationReason;
  cancelledBy?: string;                 // user ID

  // ── Subscription ───────────────────────
  subscriptionId?: string;
  subscriptionCycleIndex?: number;

  // ── Timestamps ─────────────────────────
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  processedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  returnWindowExpiresAt?: Date;
}

export type OrderSource =
  | 'checkout'
  | 'admin'
  | 'api'
  | 'import'
  | 'subscription'
  | 'pos'
  | 'draft';

/**
 * Payment record associated with an order.
 * Supports multiple payment methods per order (split pay).
 */
export interface OrderPayment {
  id: string;
  orderId: string;
  ventureId: string;
  paymentMethodType: string;            // 'card', 'paypal', 'bank_transfer', 'gift_card', etc.
  paymentMethodName: string;            // "Visa •••• 4242"
  paymentProviderId: string;            // Stripe/PayPal charge ID
  status: PaymentStatus;
  amount: Money;
  authorizedAmount: Money;
  capturedAmount: Money;
  refundedAmount: Money;
  currency: string;
  gatewayResponse?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  authorizedAt?: Date;
  capturedAt?: Date;
  voidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fulfillment — a group of items being prepared and shipped together.
 */
export interface Fulfillment {
  id: string;
  orderId: string;
  ventureId: string;
  fulfillmentNumber: string;
  status: FulfillmentStatus;
  locationId: string;                   // Fulfillment/warehouse location
  locationName: string;
  items: FulfillmentItem[];
  shipment?: Shipment;
  assignedTo?: string;                  // Staff user ID
  pickedAt?: Date;
  packedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * An item within a fulfillment.
 */
export interface FulfillmentItem {
  id: string;
  fulfillmentId: string;
  orderItemId: string;
  sku: string;
  quantity: number;
  pickedQuantity: number;
  packedQuantity: number;
}

/**
 * Shipment — the physical package with carrier and tracking info.
 */
export interface Shipment {
  id: string;
  fulfillmentId: string;
  orderId: string;
  ventureId: string;
  carrierCode: string;                  // 'ups', 'fedex', 'usps', 'dhl', 'canada_post', etc.
  carrierName: string;
  serviceCode: string;                  // 'ground', 'express', '2day', etc.
  trackingNumber: string;
  trackingUrl?: string;
  labelUrl?: string;
  labelFormat?: 'pdf' | 'zpl' | 'png';
  status: ShipmentStatus;
  weight?: {
    value: number;
    unit: 'g' | 'kg' | 'oz' | 'lb';
  };
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  shippingCost: Money;
  insuranceAmount?: Money;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  signedBy?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  trackingEvents: ShipmentTrackingEvent[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tracking event from carrier webhook or polling.
 */
export interface ShipmentTrackingEvent {
  timestamp: Date;
  status: ShipmentStatus;
  description: string;
  location?: string;
  carrierEventCode?: string;
}

/**
 * Return Merchandise Authorization (RMA) request.
 */
export interface ReturnRequest {
  id: string;
  orderId: string;
  ventureId: string;
  rmaNumber: string;
  customerId?: string;
  status: ReturnStatus;
  returnType: 'refund' | 'exchange' | 'store_credit';
  items: ReturnItem[];
  reason: ReturnReason;
  reasonDetail?: string;
  images?: string[];                    // URLs of customer-uploaded images
  returnShippingLabel?: {
    carrierCode: string;
    trackingNumber: string;
    trackingUrl?: string;
    labelUrl: string;
  };
  exchangeOrderId?: string;            // Linked exchange order
  restockingFeeRate?: number;           // 0.00 - 1.00
  restockingFeeAmount?: Money;
  returnShippingCost?: Money;
  refundAmount?: Money;                 // Calculated after inspection
  inspectionNotes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  receivedAt?: Date;
  inspectedAt?: Date;
  completedAt?: Date;
  rejectedAt?: Date;
  rejectedReason?: string;
  requestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual item in a return request.
 */
export interface ReturnItem {
  id: string;
  returnRequestId: string;
  orderItemId: string;
  sku: string;
  productName: string;
  quantity: number;
  reason: ReturnReason;
  condition?: 'new' | 'like_new' | 'used' | 'damaged' | 'defective';
  receivedQuantity?: number;
  restockable: boolean;
  refundAmount: Money;
}

/**
 * Refund record — can be partial or full, linked to a return or standalone.
 */
export interface Refund {
  id: string;
  orderId: string;
  ventureId: string;
  returnRequestId?: string;             // null for non-return refunds
  refundNumber: string;
  status: RefundStatus;
  reason: string;
  items: RefundLineItem[];
  subtotalRefund: Money;
  shippingRefund: Money;
  taxRefund: Money;
  restockingFee: Money;
  totalRefund: Money;
  paymentId: string;                    // Which payment to refund to
  paymentProviderRefundId?: string;     // Stripe refund ID, etc.
  note?: string;
  processedBy?: string;
  processedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Line item within a refund.
 */
export interface RefundLineItem {
  orderItemId: string;
  sku: string;
  quantity: number;
  unitRefund: Money;
  totalRefund: Money;
  restock: boolean;
}

/**
 * Internal or customer-visible note on an order.
 */
export interface OrderNote {
  id: string;
  orderId: string;
  ventureId: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'staff' | 'system' | 'customer';
  content: string;
  isInternal: boolean;                  // false = visible to customer
  attachments?: string[];               // URLs
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Immutable timeline event for order audit trail.
 */
export interface OrderTimelineEvent {
  id: string;
  orderId: string;
  ventureId: string;
  eventType: OrderTimelineEventType;
  title: string;
  description?: string;
  actorId?: string;                     // user or system
  actorName?: string;
  actorType: 'customer' | 'admin' | 'staff' | 'system' | 'webhook';
  metadata?: Record<string, unknown>;   // Event-specific data
  isCustomerVisible: boolean;
  createdAt: Date;
}

// ── Service Interfaces ───────────────────────────────────────

/**
 * Primary service for order CRUD and lifecycle operations.
 */
export interface OrderService {
  // ── CRUD ───────────────────────────────
  create(input: CreateOrderInput): Promise<Order>;
  getById(orderId: string): Promise<Order | null>;
  getByOrderNumber(ventureId: string, orderNumber: string): Promise<Order | null>;
  getByCustomer(customerId: string, pagination: PaginationInput): Promise<PaginatedResult<Order>>;
  getByVenture(ventureId: string, pagination: PaginationInput): Promise<PaginatedResult<Order>>;

  // ── Lifecycle ──────────────────────────
  confirm(orderId: string): Promise<Order>;
  process(orderId: string): Promise<Order>;
  cancel(orderId: string, reason: CancellationReason, note?: string): Promise<Order>;
  markShipped(orderId: string): Promise<Order>;
  markDelivered(orderId: string, signedBy?: string): Promise<Order>;
  complete(orderId: string): Promise<Order>;

  // ── Editing ────────────────────────────
  updateShippingAddress(orderId: string, address: Address): Promise<Order>;
  updateBillingAddress(orderId: string, address: Address): Promise<Order>;
  addItem(orderId: string, item: AddOrderItemInput): Promise<Order>;
  updateItemQuantity(orderId: string, itemId: string, quantity: number): Promise<Order>;
  removeItem(orderId: string, itemId: string): Promise<Order>;
  applyDiscount(orderId: string, discountCode: string): Promise<Order>;
  removeDiscount(orderId: string, discountCode: string): Promise<Order>;

  // ── Notes ──────────────────────────────
  addNote(orderId: string, content: string, isInternal: boolean): Promise<OrderNote>;
  deleteNote(orderId: string, noteId: string): Promise<void>;

  // ── Tags ───────────────────────────────
  addTag(orderId: string, tag: string): Promise<void>;
  removeTag(orderId: string, tag: string): Promise<void>;

  // ── Recalculation ──────────────────────
  recalculateTotals(orderId: string): Promise<Order>;
}

/**
 * Full-text search and advanced filtering for orders.
 */
export interface OrderSearchService {
  search(input: OrderSearchInput): Promise<PaginatedResult<Order>>;
  suggest(ventureId: string, query: string): Promise<OrderSuggestion[]>;
  saveFilter(ventureId: string, filter: SavedFilter): Promise<SavedFilter>;
  getSavedFilters(ventureId: string): Promise<SavedFilter[]>;
  deleteSavedFilter(filterId: string): Promise<void>;
}

/**
 * Service for creating and managing fulfillments.
 */
export interface FulfillmentService {
  create(input: CreateFulfillmentInput): Promise<Fulfillment>;
  getById(fulfillmentId: string): Promise<Fulfillment | null>;
  getByOrder(orderId: string): Promise<Fulfillment[]>;
  markPicked(fulfillmentId: string, items: PickedItem[]): Promise<Fulfillment>;
  markPacked(fulfillmentId: string, packageInfo: PackageInfo): Promise<Fulfillment>;
  createShipment(fulfillmentId: string, shipmentInput: CreateShipmentInput): Promise<Shipment>;
  cancelFulfillment(fulfillmentId: string, reason: string): Promise<Fulfillment>;
  updateTrackingEvent(shipmentId: string, event: ShipmentTrackingEvent): Promise<Shipment>;
}

/**
 * Service for processing refunds.
 */
export interface RefundService {
  create(input: CreateRefundInput): Promise<Refund>;
  getById(refundId: string): Promise<Refund | null>;
  getByOrder(orderId: string): Promise<Refund[]>;
  process(refundId: string): Promise<Refund>;
  cancel(refundId: string, reason: string): Promise<Refund>;
  calculateRefundAmount(orderId: string, items: RefundLineItem[]): Promise<RefundCalculation>;
}

/**
 * Service for managing returns (RMA).
 */
export interface ReturnService {
  create(input: CreateReturnInput): Promise<ReturnRequest>;
  getById(returnId: string): Promise<ReturnRequest | null>;
  getByOrder(orderId: string): Promise<ReturnRequest[]>;
  approve(returnId: string, approvedBy: string): Promise<ReturnRequest>;
  reject(returnId: string, reason: string, rejectedBy: string): Promise<ReturnRequest>;
  generateReturnLabel(returnId: string): Promise<ReturnRequest>;
  markReceived(returnId: string, receivedItems: ReceivedItem[]): Promise<ReturnRequest>;
  inspect(returnId: string, inspectionResult: InspectionResult): Promise<ReturnRequest>;
  complete(returnId: string): Promise<ReturnRequest>;
  cancel(returnId: string, reason: string): Promise<ReturnRequest>;
}

/**
 * Analytics service for order metrics.
 */
export interface OrderAnalyticsService {
  getOverview(ventureId: string, dateRange: DateRange): Promise<OrderAnalyticsOverview>;
  getGMV(ventureId: string, dateRange: DateRange, groupBy: TimeGranularity): Promise<TimeSeriesData>;
  getAOV(ventureId: string, dateRange: DateRange, groupBy: TimeGranularity): Promise<TimeSeriesData>;
  getOrderCount(ventureId: string, dateRange: DateRange, groupBy: TimeGranularity): Promise<TimeSeriesData>;
  getFulfillmentMetrics(ventureId: string, dateRange: DateRange): Promise<FulfillmentMetrics>;
  getReturnMetrics(ventureId: string, dateRange: DateRange): Promise<ReturnMetrics>;
  getTopProducts(ventureId: string, dateRange: DateRange, limit: number): Promise<TopProduct[]>;
  getRevenueByVenture(dateRange: DateRange): Promise<VentureRevenue[]>;
  getConversionFunnel(ventureId: string, dateRange: DateRange): Promise<ConversionFunnel>;
}

// ── Supporting Types ─────────────────────────────────────────

export interface PaginationInput {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface OrderSearchInput {
  ventureId: string;
  query?: string;                       // Full-text search
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  fulfillmentStatus?: FulfillmentStatus[];
  customerId?: string;
  customerEmail?: string;
  dateRange?: DateRange;
  amountRange?: { min?: number; max?: number };
  tags?: string[];
  source?: OrderSource[];
  hasReturns?: boolean;
  hasRefunds?: boolean;
  subscriptionId?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'total' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface TimeSeriesData {
  labels: string[];
  values: number[];
  currency?: string;
}

export interface OrderAnalyticsOverview {
  gmv: Money;
  gmvChange: number;                   // % change vs previous period
  orderCount: number;
  orderCountChange: number;
  aov: Money;
  aovChange: number;
  returnRate: number;
  returnRateChange: number;
  averageFulfillmentHours: number;
  fulfillmentTimeChange: number;
  topSellingProducts: TopProduct[];
}

export interface FulfillmentMetrics {
  averagePickTimeMinutes: number;
  averagePackTimeMinutes: number;
  averageShipTimeHours: number;
  averageDeliveryDays: number;
  onTimeDeliveryRate: number;
  fulfillmentsByLocation: { locationId: string; locationName: string; count: number }[];
}

export interface ReturnMetrics {
  totalReturns: number;
  returnRate: number;
  averageResolutionDays: number;
  topReturnReasons: { reason: ReturnReason; count: number; percentage: number }[];
  refundTotal: Money;
}

export interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  revenue: Money;
}

export interface VentureRevenue {
  ventureId: string;
  ventureName: string;
  gmv: Money;
  orderCount: number;
  aov: Money;
}

export interface SavedFilter {
  id: string;
  ventureId: string;
  name: string;
  filter: Omit<OrderSearchInput, 'page' | 'pageSize' | 'ventureId'>;
  createdBy: string;
  createdAt: Date;
}

export interface OrderSuggestion {
  type: 'order_number' | 'customer_name' | 'customer_email' | 'sku';
  value: string;
  orderId?: string;
  highlight: string;
}

export interface ConversionFunnel {
  checkoutStarted: number;
  paymentInitiated: number;
  orderCreated: number;
  orderConfirmed: number;
  orderFulfilled: number;
  orderDelivered: number;
}

export interface RefundCalculation {
  items: {
    orderItemId: string;
    quantity: number;
    unitRefund: Money;
    totalRefund: Money;
  }[];
  subtotalRefund: Money;
  proportionalShippingRefund: Money;
  taxRefund: Money;
  restockingFee: Money;
  totalRefund: Money;
}
```

---

## Database Schemas

### orders

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── orders ───────────────────────────────────────────────────

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    orderNumber: varchar('order_number', { length: 64 }).notNull(),
    externalId: varchar('external_id', { length: 255 }),

    // Customer
    customerId: uuid('customer_id').references(() => customers.id),
    customerEmail: varchar('customer_email', { length: 255 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 32 }),
    customerNote: text('customer_note'),

    // Status
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    paymentStatus: varchar('payment_status', { length: 32 }).notNull().default('pending'),
    fulfillmentStatus: varchar('fulfillment_status', { length: 32 }).notNull().default('unfulfilled'),

    // Addresses (stored as JSONB for flexibility)
    shippingAddress: jsonb('shipping_address').$type<Address>(),
    billingAddress: jsonb('billing_address').$type<Address>().notNull(),

    // Financials (stored in smallest currency unit)
    subtotalAmount: bigint('subtotal_amount', { mode: 'number' }).notNull().default(0),
    totalDiscountAmount: bigint('total_discount_amount', { mode: 'number' }).notNull().default(0),
    totalShippingAmount: bigint('total_shipping_amount', { mode: 'number' }).notNull().default(0),
    totalTaxAmount: bigint('total_tax_amount', { mode: 'number' }).notNull().default(0),
    totalAmount: bigint('total_amount', { mode: 'number' }).notNull().default(0),
    totalRefundedAmount: bigint('total_refunded_amount', { mode: 'number' }).notNull().default(0),
    totalOutstandingAmount: bigint('total_outstanding_amount', { mode: 'number' }).notNull().default(0),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),

    // Shipping method
    shippingMethod: jsonb('shipping_method'),

    // Discounts
    discountCodes: jsonb('discount_codes').$type<string[]>().default([]),
    discountAllocations: jsonb('discount_allocations').$type<DiscountAllocation[]>().default([]),

    // Tax
    taxLines: jsonb('tax_lines').$type<TaxLine[]>().default([]),
    taxExempt: boolean('tax_exempt').notNull().default(false),
    taxExemptionCode: varchar('tax_exemption_code', { length: 64 }),

    // Source
    source: varchar('source', { length: 32 }).notNull().default('checkout'),
    sourceId: varchar('source_id', { length: 255 }),
    ip: varchar('ip', { length: 45 }),
    userAgent: text('user_agent'),
    locale: varchar('locale', { length: 10 }),

    // Cancellation
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: varchar('cancellation_reason', { length: 64 }),
    cancelledBy: uuid('cancelled_by'),

    // Subscription
    subscriptionId: uuid('subscription_id'),
    subscriptionCycleIndex: integer('subscription_cycle_index'),

    // Custom fields
    customFields: jsonb('custom_fields').default({}),

    // Timestamps
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    returnWindowExpiresAt: timestamp('return_window_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Unique order number per venture
    ventureOrderNumberIdx: uniqueIndex('uq_orders_venture_order_number')
      .on(table.ventureId, table.orderNumber),

    // Common query indexes
    ventureStatusIdx: index('idx_orders_venture_status')
      .on(table.ventureId, table.status),
    ventureCreatedIdx: index('idx_orders_venture_created')
      .on(table.ventureId, table.createdAt),
    customerIdx: index('idx_orders_customer')
      .on(table.customerId),
    customerEmailIdx: index('idx_orders_customer_email')
      .on(table.customerEmail),
    paymentStatusIdx: index('idx_orders_payment_status')
      .on(table.ventureId, table.paymentStatus),
    fulfillmentStatusIdx: index('idx_orders_fulfillment_status')
      .on(table.ventureId, table.fulfillmentStatus),
    externalIdIdx: index('idx_orders_external_id')
      .on(table.ventureId, table.externalId),
    subscriptionIdx: index('idx_orders_subscription')
      .on(table.subscriptionId),
    createdAtIdx: index('idx_orders_created_at')
      .on(table.createdAt),

    // Full-text search index (created via raw SQL migration)
    // CREATE INDEX idx_orders_fts ON orders USING gin(
    //   to_tsvector('english', coalesce(order_number, '') || ' ' ||
    //     coalesce(customer_email, '') || ' ' ||
    //     coalesce(customer_phone, ''))
    // );
  }),
);
```

### order_items

```typescript
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),

    // Product snapshot (immutable at time of purchase)
    productSnapshot: jsonb('product_snapshot').$type<ProductSnapshot>().notNull(),

    // Quantities
    quantity: integer('quantity').notNull(),
    fulfilledQuantity: integer('fulfilled_quantity').notNull().default(0),
    returnedQuantity: integer('returned_quantity').notNull().default(0),
    refundedQuantity: integer('refunded_quantity').notNull().default(0),

    // Pricing (smallest currency unit)
    unitPriceAmount: bigint('unit_price_amount', { mode: 'number' }).notNull(),
    compareAtPriceAmount: bigint('compare_at_price_amount', { mode: 'number' }),
    subtotalAmount: bigint('subtotal_amount', { mode: 'number' }).notNull(),
    totalDiscountAmount: bigint('total_discount_amount', { mode: 'number' }).notNull().default(0),
    totalTaxAmount: bigint('total_tax_amount', { mode: 'number' }).notNull().default(0),
    totalAmount: bigint('total_amount', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),

    // Discount & tax detail
    discountAllocations: jsonb('discount_allocations').$type<DiscountAllocation[]>().default([]),
    taxLines: jsonb('tax_lines').$type<TaxLine[]>().default([]),

    // Flags
    requiresShipping: boolean('requires_shipping').notNull().default(true),
    isGiftCard: boolean('is_gift_card').notNull().default(false),
    giftCardCode: varchar('gift_card_code', { length: 64 }),

    // Custom fields
    customFields: jsonb('custom_fields').default({}),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdx: index('idx_order_items_order').on(table.orderId),
    ventureIdx: index('idx_order_items_venture').on(table.ventureId),
    skuIdx: index('idx_order_items_sku').on(
      sql`(product_snapshot->>'sku')`,
    ),
  }),
);
```

### order_payments

```typescript
export const orderPayments = pgTable(
  'order_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    paymentMethodType: varchar('payment_method_type', { length: 32 }).notNull(),
    paymentMethodName: varchar('payment_method_name', { length: 128 }).notNull(),
    paymentProviderId: varchar('payment_provider_id', { length: 255 }),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    authorizedAmount: bigint('authorized_amount', { mode: 'number' }).notNull().default(0),
    capturedAmount: bigint('captured_amount', { mode: 'number' }).notNull().default(0),
    refundedAmount: bigint('refunded_amount', { mode: 'number' }).notNull().default(0),
    currency: varchar('currency', { length: 3 }).notNull(),
    gatewayResponse: jsonb('gateway_response'),
    errorCode: varchar('error_code', { length: 64 }),
    errorMessage: text('error_message'),
    authorizedAt: timestamp('authorized_at', { withTimezone: true }),
    capturedAt: timestamp('captured_at', { withTimezone: true }),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdx: index('idx_order_payments_order').on(table.orderId),
    ventureIdx: index('idx_order_payments_venture').on(table.ventureId),
    providerIdx: index('idx_order_payments_provider').on(table.paymentProviderId),
    statusIdx: index('idx_order_payments_status').on(table.ventureId, table.status),
  }),
);
```

### fulfillments

```typescript
export const fulfillments = pgTable(
  'fulfillments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    fulfillmentNumber: varchar('fulfillment_number', { length: 64 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    locationId: uuid('location_id').notNull(),
    locationName: varchar('location_name', { length: 255 }).notNull(),
    assignedTo: uuid('assigned_to'),
    notes: text('notes'),
    pickedAt: timestamp('picked_at', { withTimezone: true }),
    packedAt: timestamp('packed_at', { withTimezone: true }),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdx: index('idx_fulfillments_order').on(table.orderId),
    ventureIdx: index('idx_fulfillments_venture').on(table.ventureId),
    statusIdx: index('idx_fulfillments_status').on(table.ventureId, table.status),
    locationIdx: index('idx_fulfillments_location').on(table.locationId),
    assignedIdx: index('idx_fulfillments_assigned').on(table.assignedTo),
  }),
);
```

### fulfillment_items

```typescript
export const fulfillmentItems = pgTable(
  'fulfillment_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fulfillmentId: uuid('fulfillment_id').notNull().references(() => fulfillments.id, { onDelete: 'cascade' }),
    orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id),
    sku: varchar('sku', { length: 128 }).notNull(),
    quantity: integer('quantity').notNull(),
    pickedQuantity: integer('picked_quantity').notNull().default(0),
    packedQuantity: integer('packed_quantity').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    fulfillmentIdx: index('idx_fulfillment_items_fulfillment').on(table.fulfillmentId),
    orderItemIdx: index('idx_fulfillment_items_order_item').on(table.orderItemId),
  }),
);
```

### shipments

```typescript
export const shipments = pgTable(
  'shipments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fulfillmentId: uuid('fulfillment_id').notNull().references(() => fulfillments.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').notNull().references(() => orders.id),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    carrierCode: varchar('carrier_code', { length: 32 }).notNull(),
    carrierName: varchar('carrier_name', { length: 128 }).notNull(),
    serviceCode: varchar('service_code', { length: 64 }).notNull(),
    trackingNumber: varchar('tracking_number', { length: 128 }).notNull(),
    trackingUrl: text('tracking_url'),
    labelUrl: text('label_url'),
    labelFormat: varchar('label_format', { length: 8 }),
    status: varchar('status', { length: 32 }).notNull().default('label_created'),
    weightValue: integer('weight_value'),
    weightUnit: varchar('weight_unit', { length: 4 }),
    dimensionLength: integer('dimension_length'),
    dimensionWidth: integer('dimension_width'),
    dimensionHeight: integer('dimension_height'),
    dimensionUnit: varchar('dimension_unit', { length: 4 }),
    shippingCostAmount: bigint('shipping_cost_amount', { mode: 'number' }).notNull().default(0),
    shippingCostCurrency: varchar('shipping_cost_currency', { length: 3 }).notNull(),
    insuranceAmount: bigint('insurance_amount', { mode: 'number' }),
    estimatedDeliveryDate: timestamp('estimated_delivery_date', { withTimezone: true }),
    actualDeliveryDate: timestamp('actual_delivery_date', { withTimezone: true }),
    signedBy: varchar('signed_by', { length: 255 }),
    trackingEvents: jsonb('tracking_events').$type<ShipmentTrackingEvent[]>().default([]),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    fulfillmentIdx: index('idx_shipments_fulfillment').on(table.fulfillmentId),
    orderIdx: index('idx_shipments_order').on(table.orderId),
    ventureIdx: index('idx_shipments_venture').on(table.ventureId),
    trackingIdx: index('idx_shipments_tracking').on(table.carrierCode, table.trackingNumber),
    statusIdx: index('idx_shipments_status').on(table.ventureId, table.status),
  }),
);
```

### return_requests

```typescript
export const returnRequests = pgTable(
  'return_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    rmaNumber: varchar('rma_number', { length: 64 }).notNull(),
    customerId: uuid('customer_id'),
    status: varchar('status', { length: 32 }).notNull().default('requested'),
    returnType: varchar('return_type', { length: 16 }).notNull().default('refund'),
    reason: varchar('reason', { length: 64 }).notNull(),
    reasonDetail: text('reason_detail'),
    images: jsonb('images').$type<string[]>().default([]),
    returnShippingLabel: jsonb('return_shipping_label'),
    exchangeOrderId: uuid('exchange_order_id'),
    restockingFeeRate: integer('restocking_fee_rate'),       // stored as basis points (e.g., 1500 = 15%)
    restockingFeeAmount: bigint('restocking_fee_amount', { mode: 'number' }),
    returnShippingCostAmount: bigint('return_shipping_cost_amount', { mode: 'number' }),
    refundAmount: bigint('refund_amount', { mode: 'number' }),
    currency: varchar('currency', { length: 3 }).notNull(),
    inspectionNotes: text('inspection_notes'),
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    receivedAt: timestamp('received_at', { withTimezone: true }),
    inspectedAt: timestamp('inspected_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    rejectedAt: timestamp('rejected_at', { withTimezone: true }),
    rejectedReason: text('rejected_reason'),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdx: index('idx_return_requests_order').on(table.orderId),
    ventureIdx: index('idx_return_requests_venture').on(table.ventureId),
    rmaIdx: uniqueIndex('uq_return_requests_rma').on(table.ventureId, table.rmaNumber),
    statusIdx: index('idx_return_requests_status').on(table.ventureId, table.status),
    customerIdx: index('idx_return_requests_customer').on(table.customerId),
  }),
);
```

### return_items

```typescript
export const returnItems = pgTable(
  'return_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    returnRequestId: uuid('return_request_id').notNull().references(() => returnRequests.id, { onDelete: 'cascade' }),
    orderItemId: uuid('order_item_id').notNull().references(() => orderItems.id),
    sku: varchar('sku', { length: 128 }).notNull(),
    productName: varchar('product_name', { length: 512 }).notNull(),
    quantity: integer('quantity').notNull(),
    reason: varchar('reason', { length: 64 }).notNull(),
    condition: varchar('condition', { length: 16 }),
    receivedQuantity: integer('received_quantity'),
    restockable: boolean('restockable').notNull().default(true),
    refundAmount: bigint('refund_amount', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    returnRequestIdx: index('idx_return_items_request').on(table.returnRequestId),
    orderItemIdx: index('idx_return_items_order_item').on(table.orderItemId),
  }),
);
```

### refunds

```typescript
export const refunds = pgTable(
  'refunds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    returnRequestId: uuid('return_request_id').references(() => returnRequests.id),
    refundNumber: varchar('refund_number', { length: 64 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    reason: text('reason').notNull(),
    items: jsonb('items').$type<RefundLineItem[]>().notNull(),
    subtotalRefundAmount: bigint('subtotal_refund_amount', { mode: 'number' }).notNull(),
    shippingRefundAmount: bigint('shipping_refund_amount', { mode: 'number' }).notNull().default(0),
    taxRefundAmount: bigint('tax_refund_amount', { mode: 'number' }).notNull().default(0),
    restockingFeeAmount: bigint('restocking_fee_amount', { mode: 'number' }).notNull().default(0),
    totalRefundAmount: bigint('total_refund_amount', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    paymentId: uuid('payment_id').notNull().references(() => orderPayments.id),
    paymentProviderRefundId: varchar('payment_provider_refund_id', { length: 255 }),
    note: text('note'),
    processedBy: uuid('processed_by'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    failureReason: text('failure_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdx: index('idx_refunds_order').on(table.orderId),
    ventureIdx: index('idx_refunds_venture').on(table.ventureId),
    refundNumberIdx: uniqueIndex('uq_refunds_number').on(table.ventureId, table.refundNumber),
    statusIdx: index('idx_refunds_status').on(table.ventureId, table.status),
    returnIdx: index('idx_refunds_return').on(table.returnRequestId),
    paymentIdx: index('idx_refunds_payment').on(table.paymentId),
  }),
);
```

### order_notes

```typescript
export const orderNotes = pgTable(
  'order_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    authorId: uuid('author_id').notNull(),
    authorName: varchar('author_name', { length: 255 }).notNull(),
    authorRole: varchar('author_role', { length: 16 }).notNull(),
    content: text('content').notNull(),
    isInternal: boolean('is_internal').notNull().default(true),
    attachments: jsonb('attachments').$type<string[]>().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdx: index('idx_order_notes_order').on(table.orderId),
    ventureIdx: index('idx_order_notes_venture').on(table.ventureId),
    authorIdx: index('idx_order_notes_author').on(table.authorId),
  }),
);
```

### order_timeline

```typescript
export const orderTimeline = pgTable(
  'order_timeline',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    title: varchar('title', { length: 512 }).notNull(),
    description: text('description'),
    actorId: uuid('actor_id'),
    actorName: varchar('actor_name', { length: 255 }),
    actorType: varchar('actor_type', { length: 16 }).notNull().default('system'),
    metadata: jsonb('metadata').default({}),
    isCustomerVisible: boolean('is_customer_visible').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdx: index('idx_order_timeline_order').on(table.orderId),
    ventureIdx: index('idx_order_timeline_venture').on(table.ventureId),
    eventTypeIdx: index('idx_order_timeline_event_type').on(table.eventType),
    createdAtIdx: index('idx_order_timeline_created').on(table.orderId, table.createdAt),
  }),
);
```

### order_tags

```typescript
export const orderTags = pgTable(
  'order_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    ventureId: uuid('venture_id').notNull().references(() => ventures.id),
    tag: varchar('tag', { length: 128 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdx: index('idx_order_tags_order').on(table.orderId),
    ventureTagIdx: uniqueIndex('uq_order_tags_venture_order_tag')
      .on(table.ventureId, table.orderId, table.tag),
    tagIdx: index('idx_order_tags_tag').on(table.ventureId, table.tag),
  }),
);
```

### Row-Level Security (RLS)

```sql
-- ── RLS Policies for Orders ──────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tags ENABLE ROW LEVEL SECURITY;

-- ── Venture isolation (all tables follow same pattern) ───────

-- Orders: venture members can read; write requires staff+ role
CREATE POLICY "orders_venture_read" ON orders
  FOR SELECT
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "orders_venture_write" ON orders
  FOR ALL
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'staff')
    )
  );

-- Customer self-service: customers can view their own orders
CREATE POLICY "orders_customer_read" ON orders
  FOR SELECT
  USING (
    customer_id = auth.uid()
    OR customer_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Order notes: internal notes hidden from customers
CREATE POLICY "order_notes_customer_read" ON order_notes
  FOR SELECT
  USING (
    -- Staff can see all notes for their venture
    (
      venture_id IN (
        SELECT venture_id FROM venture_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin', 'staff')
      )
    )
    OR
    -- Customers can only see non-internal notes on their orders
    (
      is_internal = false
      AND order_id IN (
        SELECT id FROM orders
        WHERE customer_id = auth.uid()
      )
    )
  );

-- Order timeline: customer-visible events only for customers
CREATE POLICY "order_timeline_customer_read" ON order_timeline
  FOR SELECT
  USING (
    (
      venture_id IN (
        SELECT venture_id FROM venture_members
        WHERE user_id = auth.uid()
      )
    )
    OR
    (
      is_customer_visible = true
      AND order_id IN (
        SELECT id FROM orders
        WHERE customer_id = auth.uid()
      )
    )
  );

-- Payment data: restricted to admin+ only
CREATE POLICY "order_payments_admin_read" ON order_payments
  FOR SELECT
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Platform admin: full access across all ventures
CREATE POLICY "orders_platform_admin" ON orders
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM platform_admins
      WHERE is_active = true
    )
  );

-- ── Full-text search index ───────────────────────────────────

CREATE INDEX idx_orders_fts ON orders USING gin(
  to_tsvector('english',
    coalesce(order_number, '') || ' ' ||
    coalesce(customer_email, '') || ' ' ||
    coalesce(customer_phone, '') || ' ' ||
    coalesce(customer_note, '')
  )
);

-- Order items: search by SKU and product name
CREATE INDEX idx_order_items_product_fts ON order_items USING gin(
  to_tsvector('english',
    coalesce(product_snapshot->>'name', '') || ' ' ||
    coalesce(product_snapshot->>'sku', '')
  )
);

-- ── Auto-update timestamp trigger ────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER order_payments_updated_at
  BEFORE UPDATE ON order_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER fulfillments_updated_at
  BEFORE UPDATE ON fulfillments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER return_requests_updated_at
  BEFORE UPDATE ON return_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER order_notes_updated_at
  BEFORE UPDATE ON order_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Code Examples

### 1. Create an Order from Checkout

```typescript
import { OrderService } from '@mcv/commerce/orders';
import { createContext } from '@mcv/core/context';

/**
 * Example: Creating an order after a successful checkout session.
 * The checkout module calls this when payment is authorized.
 */
async function createOrderFromCheckout(
  checkoutSession: CheckoutSession,
  ctx: AppContext,
) {
  const orderService = ctx.get(OrderService);

  // Build order items with product snapshots (price frozen at purchase time)
  const items = checkoutSession.lineItems.map((lineItem) => ({
    productSnapshot: {
      productId: lineItem.product.id,
      variantId: lineItem.variant?.id,
      sku: lineItem.variant?.sku ?? lineItem.product.sku,
      name: lineItem.product.name,
      variantName: lineItem.variant?.name,
      imageUrl: lineItem.product.images[0]?.url,
      weight: lineItem.product.weight,
      dimensions: lineItem.product.dimensions,
      attributes: lineItem.variant?.attributes ?? {},
      taxCode: lineItem.product.taxCode,
    },
    quantity: lineItem.quantity,
    unitPrice: {
      amount: lineItem.unitPrice,
      currency: checkoutSession.currency,
    },
    compareAtPrice: lineItem.compareAtPrice
      ? { amount: lineItem.compareAtPrice, currency: checkoutSession.currency }
      : undefined,
    discountAllocations: lineItem.discountAllocations,
    taxLines: lineItem.taxLines,
    requiresShipping: lineItem.requiresShipping,
    isGiftCard: lineItem.isGiftCard,
    customFields: lineItem.customFields,
  }));

  // Create the order
  const order = await orderService.create({
    ventureId: checkoutSession.ventureId,
    customerId: checkoutSession.customerId,
    customerEmail: checkoutSession.email,
    customerPhone: checkoutSession.phone,
    customerNote: checkoutSession.note,
    shippingAddress: checkoutSession.shippingAddress,
    billingAddress: checkoutSession.billingAddress,
    items,
    shippingMethod: checkoutSession.shippingMethod,
    discountCodes: checkoutSession.discountCodes,
    source: 'checkout',
    sourceId: checkoutSession.id,
    ip: checkoutSession.ip,
    userAgent: checkoutSession.userAgent,
    locale: checkoutSession.locale,
    // Payment will be linked separately after authorization
  });

  console.log(`Order ${order.orderNumber} created for ${order.customerEmail}`);
  // → Order MCV-1001 created for customer@example.com

  // If payment was already authorized during checkout, confirm immediately
  if (checkoutSession.paymentAuthorized) {
    const confirmed = await orderService.confirm(order.id);
    console.log(`Order ${confirmed.orderNumber} confirmed, status: ${confirmed.status}`);
    // → Order MCV-1001 confirmed, status: confirmed
  }

  return order;
}
```

### 2. Fulfillment Workflow (Pick → Pack → Ship)

```typescript
import { FulfillmentService } from '@mcv/commerce/orders';

/**
 * Example: Complete fulfillment workflow for a single-location order.
 * Demonstrates the pick → pack → ship pipeline.
 */
async function fulfillOrder(orderId: string, ctx: AppContext) {
  const fulfillmentService = ctx.get(FulfillmentService);

  // Step 1: Create a fulfillment for all items from the warehouse
  const fulfillment = await fulfillmentService.create({
    orderId,
    locationId: 'wh-east-001',
    items: [
      { orderItemId: 'item-1', quantity: 2 },
      { orderItemId: 'item-2', quantity: 1 },
    ],
  });

  console.log(`Fulfillment ${fulfillment.fulfillmentNumber} created`);
  // → Fulfillment FUL-1001-A created

  // Step 2: Mark items as picked (warehouse staff scans items)
  const picked = await fulfillmentService.markPicked(fulfillment.id, [
    { fulfillmentItemId: fulfillment.items[0].id, pickedQuantity: 2 },
    { fulfillmentItemId: fulfillment.items[1].id, pickedQuantity: 1 },
  ]);

  console.log(`Picked at: ${picked.pickedAt}`);
  // → Picked at: 2026-02-08T15:30:00.000Z

  // Step 3: Mark items as packed (box sealed, weighed)
  const packed = await fulfillmentService.markPacked(fulfillment.id, {
    weight: { value: 850, unit: 'g' },
    dimensions: { length: 30, width: 20, height: 15, unit: 'cm' },
    packageType: 'box',
  });

  console.log(`Packed at: ${packed.packedAt}`);
  // → Packed at: 2026-02-08T15:45:00.000Z

  // Step 4: Create shipment with tracking
  const shipment = await fulfillmentService.createShipment(fulfillment.id, {
    carrierCode: 'ups',
    serviceCode: 'ground',
    trackingNumber: '1Z999AA10123456784',
    labelUrl: 'https://labels.example.com/1Z999AA10123456784.pdf',
    labelFormat: 'pdf',
    shippingCost: { amount: 1299, currency: 'USD' },
    estimatedDeliveryDate: new Date('2026-02-13'),
  });

  console.log(`Shipment created: ${shipment.trackingNumber}`);
  console.log(`Tracking URL: ${shipment.trackingUrl}`);
  // → Shipment created: 1Z999AA10123456784
  // → Tracking URL: https://www.ups.com/track?tracknum=1Z999AA10123456784

  return shipment;
}
```

### 3. Partial Shipment (Split Fulfillment)

```typescript
import { FulfillmentService, OrderService } from '@mcv/commerce/orders';

/**
 * Example: Splitting an order across multiple fulfillment locations.
 * Item A ships from East warehouse, Item B ships from West warehouse.
 */
async function partialShipment(orderId: string, ctx: AppContext) {
  const fulfillmentService = ctx.get(FulfillmentService);
  const orderService = ctx.get(OrderService);

  const order = await orderService.getById(orderId);
  if (!order) throw new Error('Order not found');

  // Create fulfillment 1: East warehouse (items available immediately)
  const fulfillmentEast = await fulfillmentService.create({
    orderId,
    locationId: 'wh-east-001',
    items: [
      { orderItemId: order.items[0].id, quantity: order.items[0].quantity },
    ],
  });

  // Create fulfillment 2: West warehouse (backordered item)
  const fulfillmentWest = await fulfillmentService.create({
    orderId,
    locationId: 'wh-west-001',
    items: [
      { orderItemId: order.items[1].id, quantity: order.items[1].quantity },
    ],
  });

  // Ship fulfillment 1 immediately
  await fulfillmentService.markPicked(fulfillmentEast.id, [
    { fulfillmentItemId: fulfillmentEast.items[0].id, pickedQuantity: fulfillmentEast.items[0].quantity },
  ]);
  await fulfillmentService.markPacked(fulfillmentEast.id, {
    weight: { value: 500, unit: 'g' },
    dimensions: { length: 20, width: 15, height: 10, unit: 'cm' },
  });
  await fulfillmentService.createShipment(fulfillmentEast.id, {
    carrierCode: 'fedex',
    serviceCode: '2day',
    trackingNumber: '794644790132',
    shippingCost: { amount: 1599, currency: 'USD' },
    estimatedDeliveryDate: new Date('2026-02-10'),
  });

  // Check order status — should be "partially_shipped"
  const updatedOrder = await orderService.getById(orderId);
  console.log(`Order status: ${updatedOrder!.status}`);
  console.log(`Fulfillment status: ${updatedOrder!.fulfillmentStatus}`);
  // → Order status: partially_shipped
  // → Fulfillment status: partial

  // Later: Ship fulfillment 2 from West warehouse
  await fulfillmentService.markPicked(fulfillmentWest.id, [
    { fulfillmentItemId: fulfillmentWest.items[0].id, pickedQuantity: fulfillmentWest.items[0].quantity },
  ]);
  await fulfillmentService.markPacked(fulfillmentWest.id, {
    weight: { value: 1200, unit: 'g' },
    dimensions: { length: 25, width: 20, height: 15, unit: 'cm' },
  });
  await fulfillmentService.createShipment(fulfillmentWest.id, {
    carrierCode: 'usps',
    serviceCode: 'priority',
    trackingNumber: '9400111899223100012345',
    shippingCost: { amount: 899, currency: 'USD' },
    estimatedDeliveryDate: new Date('2026-02-12'),
  });

  // Now order should be fully shipped
  const fullyShipped = await orderService.getById(orderId);
  console.log(`Order status: ${fullyShipped!.status}`);
  console.log(`Fulfillment status: ${fullyShipped!.fulfillmentStatus}`);
  // → Order status: shipped
  // → Fulfillment status: fulfilled
}
```

### 4. Return & Refund Processing

```typescript
import { ReturnService, RefundService, OrderService } from '@mcv/commerce/orders';

/**
 * Example: Customer requests a partial return — one item defective,
 * one item size issue. Demonstrates the full RMA → refund flow.
 */
async function processReturnAndRefund(orderId: string, ctx: AppContext) {
  const returnService = ctx.get(ReturnService);
  const refundService = ctx.get(RefundService);
  const orderService = ctx.get(OrderService);

  const order = await orderService.getById(orderId);
  if (!order) throw new Error('Order not found');

  // Step 1: Customer creates return request
  const returnRequest = await returnService.create({
    orderId,
    returnType: 'refund',
    items: [
      {
        orderItemId: order.items[0].id,
        quantity: 1,
        reason: 'defective',
        reasonDetail: 'Screen has dead pixels in the upper-right corner',
        images: ['https://uploads.example.com/return/img1.jpg'],
      },
      {
        orderItemId: order.items[1].id,
        quantity: 1,
        reason: 'size_fit_issue',
        reasonDetail: 'Ordered M but fits like XS',
      },
    ],
  });

  console.log(`RMA created: ${returnRequest.rmaNumber}`);
  // → RMA created: RMA-1001-001

  // Step 2: Admin approves return
  const approved = await returnService.approve(
    returnRequest.id,
    'admin-user-id',
  );
  console.log(`Return approved: ${approved.status}`);
  // → Return approved: approved

  // Step 3: Generate return shipping label
  const withLabel = await returnService.generateReturnLabel(returnRequest.id);
  console.log(`Return label: ${withLabel.returnShippingLabel?.labelUrl}`);
  // → Return label: https://labels.example.com/return/RMA-1001-001.pdf

  // Step 4: Warehouse receives returned items
  const received = await returnService.markReceived(returnRequest.id, [
    {
      returnItemId: returnRequest.items[0].id,
      receivedQuantity: 1,
      condition: 'defective',
    },
    {
      returnItemId: returnRequest.items[1].id,
      receivedQuantity: 1,
      condition: 'like_new',
    },
  ]);
  console.log(`Items received at: ${received.receivedAt}`);

  // Step 5: Inspect and determine refund
  const inspected = await returnService.inspect(returnRequest.id, {
    notes: 'Item 1 confirmed defective (dead pixels). Item 2 is in original condition.',
    itemResults: [
      { returnItemId: returnRequest.items[0].id, restockable: false },
      { returnItemId: returnRequest.items[1].id, restockable: true },
    ],
  });

  // Step 6: Calculate refund (accounts for restocking fee on item 2)
  const refundCalc = await refundService.calculateRefundAmount(orderId, [
    {
      orderItemId: order.items[0].id,
      quantity: 1,
      unitRefund: order.items[0].unitPrice,
      totalRefund: order.items[0].unitPrice,
      restock: false,
    },
    {
      orderItemId: order.items[1].id,
      quantity: 1,
      unitRefund: order.items[1].unitPrice,
      totalRefund: order.items[1].unitPrice,
      restock: true,
    },
  ]);

  console.log(`Subtotal refund: $${refundCalc.subtotalRefund.amount / 100}`);
  console.log(`Restocking fee: $${refundCalc.restockingFee.amount / 100}`);
  console.log(`Tax refund: $${refundCalc.taxRefund.amount / 100}`);
  console.log(`Total refund: $${refundCalc.totalRefund.amount / 100}`);
  // → Subtotal refund: $149.98
  // → Restocking fee: $7.50
  // → Tax refund: $11.75
  // → Total refund: $154.23

  // Step 7: Create and process the refund
  const refund = await refundService.create({
    orderId,
    returnRequestId: returnRequest.id,
    reason: 'Return - defective item and size issue',
    items: refundCalc.items,
    subtotalRefund: refundCalc.subtotalRefund,
    shippingRefund: refundCalc.proportionalShippingRefund,
    taxRefund: refundCalc.taxRefund,
    restockingFee: refundCalc.restockingFee,
    paymentId: order.payments[0].id,
  });

  const processed = await refundService.process(refund.id);
  console.log(`Refund ${processed.refundNumber}: ${processed.status}`);
  // → Refund REF-1001-001: completed

  // Step 8: Complete the return
  await returnService.complete(returnRequest.id);
}
```

### 5. Order Search & Filtering

```typescript
import { OrderSearchService } from '@mcv/commerce/orders';

/**
 * Example: Advanced order search with filters, saved filters, and suggestions.
 */
async function searchAndFilterOrders(ventureId: string, ctx: AppContext) {
  const searchService = ctx.get(OrderSearchService);

  // Full-text search across order number, email, phone, notes
  const searchResults = await searchService.search({
    ventureId,
    query: 'john@example.com',
    page: 1,
    pageSize: 20,
  });

  console.log(`Found ${searchResults.total} orders`);
  // → Found 12 orders

  // Complex filter: high-value unfulfilled orders from last 7 days
  const filteredResults = await searchService.search({
    ventureId,
    status: ['confirmed', 'processing'],
    fulfillmentStatus: ['unfulfilled'],
    dateRange: {
      from: new Date('2026-02-01'),
      to: new Date('2026-02-08'),
    },
    amountRange: { min: 10000 },        // $100+ orders (in cents)
    sortBy: 'total',
    sortOrder: 'desc',
    page: 1,
    pageSize: 50,
  });

  console.log(`High-value unfulfilled: ${filteredResults.total}`);
  // → High-value unfulfilled: 8

  // Filter by tags
  const vipOrders = await searchService.search({
    ventureId,
    tags: ['vip', 'priority'],
    status: ['confirmed'],
    sortBy: 'createdAt',
    sortOrder: 'asc',
    page: 1,
    pageSize: 25,
  });

  // Save a filter for reuse
  const savedFilter = await searchService.saveFilter(ventureId, {
    id: '',                              // will be generated
    ventureId,
    name: 'High-Value Unfulfilled',
    filter: {
      status: ['confirmed', 'processing'],
      fulfillmentStatus: ['unfulfilled'],
      amountRange: { min: 10000 },
      sortBy: 'total',
      sortOrder: 'desc',
    },
    createdBy: 'admin-user-id',
    createdAt: new Date(),
  });

  console.log(`Saved filter: ${savedFilter.name} (${savedFilter.id})`);
  // → Saved filter: High-Value Unfulfilled (sf_abc123)

  // Auto-suggest for search bar
  const suggestions = await searchService.suggest(ventureId, 'MCV-10');
  console.log('Suggestions:', suggestions);
  // → Suggestions: [
  //     { type: 'order_number', value: 'MCV-1001', orderId: '...', highlight: '<b>MCV-10</b>01' },
  //     { type: 'order_number', value: 'MCV-1002', orderId: '...', highlight: '<b>MCV-10</b>02' },
  //     ...
  //   ]

  // Orders with returns
  const returnOrders = await searchService.search({
    ventureId,
    hasReturns: true,
    dateRange: {
      from: new Date('2026-01-01'),
      to: new Date('2026-02-08'),
    },
    page: 1,
    pageSize: 50,
  });

  console.log(`Orders with returns: ${returnOrders.total}`);
  // → Orders with returns: 23
}
```

### 6. Bulk Order Operations

```typescript
import { OrderBulkService, OrderService, OrderTagService } from '@mcv/commerce/orders';

/**
 * Example: Bulk operations — tag, cancel, and export multiple orders.
 */
async function bulkOrderOperations(ventureId: string, ctx: AppContext) {
  const bulkService = ctx.get(OrderBulkService);
  const tagService = ctx.get(OrderTagService);

  // Bulk add tags to orders
  const tagResult = await bulkService.addTags({
    ventureId,
    orderIds: ['order-1', 'order-2', 'order-3', 'order-4'],
    tags: ['holiday-sale', 'q4-2025'],
  });

  console.log(`Tagged ${tagResult.successCount} orders, ${tagResult.failureCount} failures`);
  // → Tagged 4 orders, 0 failures

  // Bulk cancel orders (only pre-shipment orders can be cancelled)
  const cancelResult = await bulkService.cancel({
    ventureId,
    orderIds: ['order-5', 'order-6', 'order-7'],
    reason: 'out_of_stock',
    note: 'Supplier unable to fulfill — product discontinued',
  });

  console.log(`Cancelled ${cancelResult.successCount} orders`);
  console.log(`Failed: ${cancelResult.failures.map((f) => `${f.orderId}: ${f.reason}`).join(', ')}`);
  // → Cancelled 2 orders
  // → Failed: order-7: Cannot cancel shipped order

  // Bulk update fulfillment status
  const fulfillResult = await bulkService.updateStatus({
    ventureId,
    orderIds: ['order-8', 'order-9', 'order-10'],
    targetStatus: 'processing',
  });

  console.log(`Updated ${fulfillResult.successCount} orders to processing`);
  // → Updated 3 orders to processing

  // Bulk export orders to CSV
  const exportService = ctx.get(OrderExportService);
  const exportResult = await exportService.exportToCsv({
    ventureId,
    dateRange: {
      from: new Date('2026-01-01'),
      to: new Date('2026-02-08'),
    },
    columns: [
      'orderNumber',
      'customerEmail',
      'status',
      'total',
      'createdAt',
      'shippingMethod',
    ],
    includeItems: true,
  });

  console.log(`Exported ${exportResult.rowCount} orders to ${exportResult.fileUrl}`);
  // → Exported 156 orders to https://exports.example.com/orders-2026-Q1.csv

  // Bulk remove tags
  const removeResult = await bulkService.removeTags({
    ventureId,
    orderIds: ['order-1', 'order-2'],
    tags: ['holiday-sale'],
  });

  console.log(`Removed tags from ${removeResult.successCount} orders`);
  // → Removed tags from 2 orders
}
```

### 7. Subscription Order Generation

```typescript
import { SubscriptionOrderService, OrderService } from '@mcv/commerce/orders';

/**
 * Example: Generating recurring orders from subscription schedules.
 * The subscription module triggers order creation on schedule.
 */
async function generateSubscriptionOrder(
  subscriptionId: string,
  ctx: AppContext,
) {
  const subscriptionOrderService = ctx.get(SubscriptionOrderService);
  const orderService = ctx.get(OrderService);

  // Generate next order from subscription schedule
  const order = await subscriptionOrderService.generateNextOrder({
    subscriptionId,
    // Override options (customer can modify next delivery)
    overrides: {
      shippingAddress: undefined,        // use default from subscription
      items: [
        // Customer skipped one item for this cycle
        {
          productId: 'prod-coffee-001',
          variantId: 'var-whole-bean',
          quantity: 2,                    // increased from usual 1
        },
        // Removed prod-tea-001 (skipped this cycle)
      ],
      scheduledDate: new Date('2026-02-15'),  // moved delivery date
    },
  });

  console.log(`Subscription order created: ${order.orderNumber}`);
  console.log(`Subscription ID: ${order.subscriptionId}`);
  console.log(`Cycle: ${order.subscriptionCycleIndex}`);
  console.log(`Source: ${order.source}`);
  // → Subscription order created: MCV-SUB-1001-12
  // → Subscription ID: sub_abc123
  // → Cycle: 12
  // → Source: subscription

  // The order follows the same lifecycle as any other order
  const confirmed = await orderService.confirm(order.id);
  console.log(`Order confirmed: ${confirmed.status}`);
  // → Order confirmed: confirmed

  // Pause next subscription order
  await subscriptionOrderService.skipNextOrder(subscriptionId, {
    reason: 'Customer on vacation',
    resumeDate: new Date('2026-03-15'),
  });

  // Modify upcoming subscription order before it generates
  await subscriptionOrderService.modifyUpcoming(subscriptionId, {
    addItems: [
      { productId: 'prod-mug-001', variantId: 'var-ceramic-blue', quantity: 1 },
    ],
    removeItems: ['prod-tea-001'],
    note: 'Added mug as one-time add-on',
  });

  // List all orders generated by this subscription
  const subscriptionOrders = await orderService.getByVenture(order.ventureId, {
    page: 1,
    pageSize: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const subOrders = subscriptionOrders.data.filter(
    (o) => o.subscriptionId === subscriptionId,
  );
  console.log(`Total subscription orders: ${subOrders.length}`);
  // → Total subscription orders: 12
}
```

### 8. Order Analytics Query

```typescript
import { OrderAnalyticsService } from '@mcv/commerce/orders';

/**
 * Example: Querying order analytics for dashboard and reporting.
 */
async function queryOrderAnalytics(ventureId: string, ctx: AppContext) {
  const analytics = ctx.get(OrderAnalyticsService);

  const dateRange = {
    from: new Date('2026-01-01'),
    to: new Date('2026-02-08'),
  };

  // Overview metrics (top-level KPIs)
  const overview = await analytics.getOverview(ventureId, dateRange);
  console.log('=== Order Analytics Overview ===');
  console.log(`GMV: $${overview.gmv.amount / 100} (${overview.gmvChange > 0 ? '+' : ''}${overview.gmvChange}%)`);
  console.log(`Orders: ${overview.orderCount} (${overview.orderCountChange > 0 ? '+' : ''}${overview.orderCountChange}%)`);
  console.log(`AOV: $${overview.aov.amount / 100} (${overview.aovChange > 0 ? '+' : ''}${overview.aovChange}%)`);
  console.log(`Return rate: ${overview.returnRate}% (${overview.returnRateChange > 0 ? '+' : ''}${overview.returnRateChange}%)`);
  console.log(`Avg fulfillment time: ${overview.averageFulfillmentHours}h`);
  // → === Order Analytics Overview ===
  // → GMV: $245,678.90 (+12.3%)
  // → Orders: 1,847 (+8.1%)
  // → AOV: $133.01 (+3.9%)
  // → Return rate: 4.2% (-0.8%)
  // → Avg fulfillment time: 18.5h

  // GMV time series (daily)
  const gmvDaily = await analytics.getGMV(ventureId, dateRange, 'day');
  console.log('\nDaily GMV (last 5 days):');
  gmvDaily.labels.slice(-5).forEach((label, i) => {
    console.log(`  ${label}: $${gmvDaily.values[gmvDaily.values.length - 5 + i] / 100}`);
  });
  // → Daily GMV (last 5 days):
  // →   2026-02-04: $6,234.50
  // →   2026-02-05: $7,891.20
  // →   2026-02-06: $5,432.10
  // →   2026-02-07: $8,123.40
  // →   2026-02-08: $4,567.80

  // Top products by revenue
  const topProducts = await analytics.getTopProducts(ventureId, dateRange, 10);
  console.log('\nTop 5 Products:');
  topProducts.slice(0, 5).forEach((product, i) => {
    console.log(`  ${i + 1}. ${product.productName} (${product.sku})`);
    console.log(`     Qty: ${product.quantitySold} | Revenue: $${product.revenue.amount / 100}`);
  });
  // → Top 5 Products:
  // →   1. Premium Wireless Headphones (SKU-WH-001)
  // →      Qty: 234 | Revenue: $46,566.00
  // →   2. Organic Coffee Blend (SKU-CB-002)
  // →      Qty: 567 | Revenue: $11,340.00
  // →   ...

  // Fulfillment metrics
  const fulfillment = await analytics.getFulfillmentMetrics(ventureId, dateRange);
  console.log('\nFulfillment Metrics:');
  console.log(`  Avg pick time: ${fulfillment.averagePickTimeMinutes} min`);
  console.log(`  Avg pack time: ${fulfillment.averagePackTimeMinutes} min`);
  console.log(`  Avg ship time: ${fulfillment.averageShipTimeHours}h`);
  console.log(`  On-time delivery: ${fulfillment.onTimeDeliveryRate}%`);
  console.log('  By location:');
  fulfillment.fulfillmentsByLocation.forEach((loc) => {
    console.log(`    ${loc.locationName}: ${loc.count} orders`);
  });
  // → Fulfillment Metrics:
  // →   Avg pick time: 12 min
  // →   Avg pack time: 8 min
  // →   Avg ship time: 4.2h
  // →   On-time delivery: 94.7%
  // →   By location:
  // →     East Warehouse: 1,123 orders
  // →     West Warehouse: 724 orders

  // Return metrics
  const returns = await analytics.getReturnMetrics(ventureId, dateRange);
  console.log('\nReturn Metrics:');
  console.log(`  Total returns: ${returns.totalReturns}`);
  console.log(`  Return rate: ${returns.returnRate}%`);
  console.log(`  Avg resolution: ${returns.averageResolutionDays} days`);
  console.log('  Top reasons:');
  returns.topReturnReasons.forEach((r) => {
    console.log(`    ${r.reason}: ${r.count} (${r.percentage}%)`);
  });
  // → Return Metrics:
  // →   Total returns: 78
  // →   Return rate: 4.2%
  // →   Avg resolution: 5.3 days
  // →   Top reasons:
  // →     size_fit_issue: 28 (35.9%)
  // →     not_as_described: 18 (23.1%)
  // →     defective: 12 (15.4%)

  // Revenue by venture (platform-level, cross-venture)
  const ventureRevenue = await analytics.getRevenueByVenture(dateRange);
  console.log('\nRevenue by Venture:');
  ventureRevenue.forEach((v) => {
    console.log(`  ${v.ventureName}: $${v.gmv.amount / 100} (${v.orderCount} orders, AOV: $${v.aov.amount / 100})`);
  });
  // → Revenue by Venture:
  // →   Main Store: $182,345.00 (1,234 orders, AOV: $147.77)
  // →   Outlet: $42,678.90 (456 orders, AOV: $93.59)
  // →   Wholesale: $20,655.00 (157 orders, AOV: $131.56)

  // Conversion funnel
  const funnel = await analytics.getConversionFunnel(ventureId, dateRange);
  console.log('\nConversion Funnel:');
  console.log(`  Checkout started:  ${funnel.checkoutStarted}`);
  console.log(`  Payment initiated: ${funnel.paymentInitiated} (${((funnel.paymentInitiated / funnel.checkoutStarted) * 100).toFixed(1)}%)`);
  console.log(`  Order created:     ${funnel.orderCreated} (${((funnel.orderCreated / funnel.checkoutStarted) * 100).toFixed(1)}%)`);
  console.log(`  Order confirmed:   ${funnel.orderConfirmed}`);
  console.log(`  Order fulfilled:   ${funnel.orderFulfilled}`);
  console.log(`  Order delivered:   ${funnel.orderDelivered}`);
  // → Conversion Funnel:
  // →   Checkout started:  4,521
  // →   Payment initiated: 3,012 (66.6%)
  // →   Order created:     1,847 (40.9%)
  // →   Order confirmed:   1,842
  // →   Order fulfilled:   1,789
  // →   Order delivered:   1,756
}
```

---

## Error Codes

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| `ORD_001` | `ORDER_NOT_FOUND` | 404 | Order does not exist or is not accessible to the current user. |
| `ORD_002` | `ORDER_INVALID_TRANSITION` | 422 | Attempted state transition is not allowed from the current status. |
| `ORD_003` | `ORDER_ALREADY_CANCELLED` | 409 | Order has already been cancelled. |
| `ORD_004` | `ORDER_CANNOT_CANCEL_SHIPPED` | 422 | Cannot cancel an order that has already shipped; use returns instead. |
| `ORD_005` | `ORDER_ITEMS_EMPTY` | 422 | Order must contain at least one item. |
| `ORD_006` | `ORDER_DUPLICATE_NUMBER` | 409 | Order number already exists for this venture. |
| `ORD_007` | `ORDER_CUSTOMER_NOT_FOUND` | 404 | Referenced customer does not exist. |
| `ORD_008` | `ORDER_VENTURE_MISMATCH` | 403 | Operation attempted on an order belonging to a different venture. |
| `ORD_009` | `ORDER_EDIT_LOCKED` | 422 | Order cannot be edited in its current status (post-fulfillment). |
| `ORD_010` | `ORDER_IMPORT_VALIDATION_FAILED` | 422 | Imported order data failed schema validation. |
| `PAY_001` | `PAYMENT_NOT_FOUND` | 404 | Payment record not found on this order. |
| `PAY_002` | `PAYMENT_CAPTURE_FAILED` | 502 | Payment gateway returned an error during capture. |
| `PAY_003` | `PAYMENT_ALREADY_CAPTURED` | 409 | Payment has already been fully captured. |
| `PAY_004` | `PAYMENT_INSUFFICIENT_AUTH` | 422 | Capture amount exceeds authorized amount. |
| `PAY_005` | `PAYMENT_VOID_FAILED` | 502 | Failed to void authorization at gateway. |
| `FUL_001` | `FULFILLMENT_NOT_FOUND` | 404 | Fulfillment record does not exist. |
| `FUL_002` | `FULFILLMENT_ALREADY_SHIPPED` | 409 | Fulfillment has already been shipped. |
| `FUL_003` | `FULFILLMENT_QUANTITY_EXCEEDED` | 422 | Fulfillment quantity exceeds available unfulfilled quantity. |
| `FUL_004` | `FULFILLMENT_LOCATION_INVALID` | 422 | Specified fulfillment location does not exist or is inactive. |
| `FUL_005` | `FULFILLMENT_PICK_INCOMPLETE` | 422 | Cannot pack before all items are picked. |
| `FUL_006` | `FULFILLMENT_PACK_INCOMPLETE` | 422 | Cannot create shipment before items are packed. |
| `SHP_001` | `SHIPMENT_LABEL_FAILED` | 502 | Carrier API returned error generating shipping label. |
| `SHP_002` | `SHIPMENT_TRACKING_NOT_FOUND` | 404 | Tracking number not found at carrier. |
| `RET_001` | `RETURN_NOT_FOUND` | 404 | Return request does not exist. |
| `RET_002` | `RETURN_WINDOW_EXPIRED` | 422 | Return window has expired for this order. |
| `RET_003` | `RETURN_QUANTITY_EXCEEDED` | 422 | Return quantity exceeds available returnable quantity. |
| `RET_004` | `RETURN_ALREADY_PROCESSED` | 409 | Return request has already been completed or rejected. |
| `RET_005` | `RETURN_ITEM_NOT_RETURNABLE` | 422 | This item type is not eligible for return (e.g., digital goods). |
| `RET_006` | `RETURN_LABEL_GENERATION_FAILED` | 502 | Failed to generate return shipping label from carrier. |
| `REF_001` | `REFUND_NOT_FOUND` | 404 | Refund record does not exist. |
| `REF_002` | `REFUND_EXCEEDS_CAPTURED` | 422 | Refund amount exceeds total captured payment amount. |
| `REF_003` | `REFUND_GATEWAY_FAILED` | 502 | Payment gateway returned error during refund processing. |
| `REF_004` | `REFUND_ALREADY_PROCESSED` | 409 | Refund has already been completed. |
| `REF_005` | `REFUND_CALCULATION_MISMATCH` | 422 | Provided refund amounts do not match recalculated totals. |
| `BLK_001` | `BULK_PARTIAL_FAILURE` | 207 | Some operations in the bulk request failed; see failures array. |
| `BLK_002` | `BULK_LIMIT_EXCEEDED` | 422 | Bulk operation exceeds the maximum batch size (default: 100). |
| `SUB_001` | `SUBSCRIPTION_ORDER_GENERATION_FAILED` | 500 | Failed to generate order from subscription schedule. |
| `SUB_002` | `SUBSCRIPTION_NOT_ACTIVE` | 422 | Subscription is not in an active state; cannot generate orders. |

### Error Response Shape

```typescript
interface OrderError {
  code: string;                         // e.g., "ORD_002"
  message: string;                      // Human-readable description
  details?: Record<string, unknown>;    // Additional context
  orderId?: string;                     // Related order (if applicable)
  statusCode: number;                   // HTTP status code
}

// Example error response:
{
  "code": "ORD_002",
  "message": "Cannot transition order from 'delivered' to 'processing'",
  "details": {
    "currentStatus": "delivered",
    "targetStatus": "processing",
    "allowedTransitions": ["completed", "returned"]
  },
  "orderId": "ord_abc123",
  "statusCode": 422
}
```

---

## Security

### Order Access Control

```typescript
/**
 * Order access is controlled at three levels:
 *
 * 1. VENTURE ISOLATION (RLS)
 *    - All tables have venture_id columns with RLS policies
 *    - Users can only access orders within their venture membership
 *    - Platform admins bypass venture isolation
 *
 * 2. ROLE-BASED PERMISSIONS
 *    - customer: View own orders, create returns, add notes
 *    - staff: View all venture orders, manage fulfillments, add notes
 *    - admin: Full CRUD, cancel orders, process refunds, view payments
 *    - owner: All admin permissions + configure order settings
 *    - platform_admin: Cross-venture access, analytics, exports
 *
 * 3. STATUS-BASED RESTRICTIONS
 *    - Editing addresses only allowed pre-shipment
 *    - Adding/removing items only allowed in pending/confirmed status
 *    - Cancellation only allowed pre-shipment
 *    - Refunds require admin+ role
 */

// Permission matrix
const ORDER_PERMISSIONS = {
  'order:read':           ['customer', 'staff', 'admin', 'owner'],
  'order:create':         ['staff', 'admin', 'owner'],
  'order:update':         ['staff', 'admin', 'owner'],
  'order:cancel':         ['admin', 'owner'],
  'order:delete':         ['owner'],                          // soft delete only
  'fulfillment:create':   ['staff', 'admin', 'owner'],
  'fulfillment:manage':   ['staff', 'admin', 'owner'],
  'return:request':       ['customer', 'staff', 'admin', 'owner'],
  'return:approve':       ['admin', 'owner'],
  'return:reject':        ['admin', 'owner'],
  'refund:create':        ['admin', 'owner'],
  'refund:process':       ['admin', 'owner'],
  'payment:view':         ['admin', 'owner'],
  'analytics:view':       ['admin', 'owner'],
  'export:orders':        ['admin', 'owner'],
  'import:orders':        ['admin', 'owner'],
  'note:add_internal':    ['staff', 'admin', 'owner'],
  'note:add_customer':    ['customer', 'staff', 'admin', 'owner'],
  'tag:manage':           ['staff', 'admin', 'owner'],
  'bulk:operations':      ['admin', 'owner'],
} as const;
```

### Payment Data Handling

```typescript
/**
 * Payment security follows PCI-DSS Level 1 compliance requirements:
 *
 * 1. NO RAW CARD DATA
 *    - Card numbers are NEVER stored in the orders database
 *    - Only tokenized references (Stripe payment method IDs, etc.)
 *    - Payment method display names use masked format: "Visa •••• 4242"
 *
 * 2. GATEWAY RESPONSES
 *    - Gateway response JSON stored for audit purposes
 *    - Sensitive fields (CVV results, full card numbers) are stripped
 *    - Only authorization codes, AVS results, and decline reasons retained
 *
 * 3. ACCESS RESTRICTIONS
 *    - Payment records require admin+ role via RLS
 *    - Customer-facing views show only: method type, last 4, amount, status
 *    - Staff members cannot see payment gateway details
 *
 * 4. AUDIT TRAIL
 *    - All payment state changes recorded in order_timeline
 *    - Timeline events include actor, timestamp, and metadata
 *    - Payment events are immutable (append-only)
 *
 * 5. ENCRYPTION
 *    - Supabase transparent data encryption (TDE) at rest
 *    - TLS 1.3 in transit
 *    - Payment provider IDs encrypted at application layer
 */

// Payment data sanitization before storage
function sanitizeGatewayResponse(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const BLOCKED_KEYS = [
    'card_number', 'pan', 'cvv', 'cvc', 'cvv2',
    'expiry', 'exp_month', 'exp_year',
    'security_code', 'pin',
  ];

  const sanitized = { ...raw };
  for (const key of BLOCKED_KEYS) {
    delete sanitized[key];
  }

  // Recursively sanitize nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeGatewayResponse(value as Record<string, unknown>);
    }
  }

  return sanitized;
}
```

### PII Protection

```typescript
/**
 * PII (Personally Identifiable Information) protection:
 *
 * 1. DATA MINIMIZATION
 *    - Only essential customer data stored on orders
 *    - Full customer profiles live in @mcv/commerce/customers
 *    - IP addresses and user agents retained for fraud detection, purged after 90 days
 *
 * 2. RIGHT TO ERASURE (GDPR Article 17)
 *    - Customer deletion anonymizes orders (email → hashed, name → "[Deleted]")
 *    - Order history retained for accounting/tax compliance
 *    - Shipping addresses anonymized but order totals preserved
 *
 * 3. DATA EXPORT (GDPR Article 20)
 *    - Customer data export includes all orders and timeline events
 *    - Export format: JSON, conforming to data portability requirements
 *
 * 4. LOG SANITIZATION
 *    - Application logs never contain full email addresses or phone numbers
 *    - Order numbers and IDs used for log correlation
 *    - Structured logging with PII fields marked and filtered
 *
 * 5. SEARCH ISOLATION
 *    - Full-text search indexes respect RLS policies
 *    - Cross-venture search requires platform admin role
 *    - Search suggestions sanitized to prevent data leakage
 */

// PII anonymization for GDPR right to erasure
async function anonymizeCustomerOrders(customerId: string, db: DrizzleDB) {
  await db
    .update(orders)
    .set({
      customerEmail: sql`encode(digest(customer_email, 'sha256'), 'hex') || '@deleted.local'`,
      customerPhone: null,
      customerNote: null,
      shippingAddress: sql`jsonb_build_object(
        'firstName', '[Deleted]',
        'lastName', '[Deleted]',
        'addressLine1', '[Redacted]',
        'city', (shipping_address->>'city'),
        'stateProvince', (shipping_address->>'stateProvince'),
        'postalCode', left(shipping_address->>'postalCode', 3) || '***',
        'countryCode', (shipping_address->>'countryCode')
      )`,
      billingAddress: sql`jsonb_build_object(
        'firstName', '[Deleted]',
        'lastName', '[Deleted]',
        'addressLine1', '[Redacted]',
        'city', (billing_address->>'city'),
        'stateProvince', (billing_address->>'stateProvince'),
        'postalCode', left(billing_address->>'postalCode', 3) || '***',
        'countryCode', (billing_address->>'countryCode')
      )`,
      ip: null,
      userAgent: null,
      updatedAt: new Date(),
    })
    .where(eq(orders.customerId, customerId));
}
```

### Rate Limiting & Abuse Prevention

```typescript
/**
 * Rate limits for order endpoints:
 *
 * | Endpoint                  | Limit (per venture) | Window |
 * |---------------------------|---------------------|--------|
 * | POST /orders              | 100                 | 1 min  |
 * | GET /orders (list)        | 300                 | 1 min  |
 * | GET /orders/:id           | 600                 | 1 min  |
 * | POST /orders/search       | 120                 | 1 min  |
 * | POST /fulfillments        | 200                 | 1 min  |
 * | POST /returns             | 50                  | 1 min  |
 * | POST /refunds             | 30                  | 1 min  |
 * | POST /orders/bulk/*       | 10                  | 1 min  |
 * | GET /orders/analytics/*   | 60                  | 1 min  |
 * | POST /orders/export       | 5                   | 5 min  |
 *
 * Customer-facing endpoints have separate per-customer limits:
 * | POST /returns (customer)  | 5                   | 1 hour |
 * | GET /orders (customer)    | 60                  | 1 min  |
 */
```

---

## Environment Variables

```bash
# ── Order Configuration ───────────────────────────────────────

# Order number prefix per venture (configured via admin UI, stored in DB)
# Default prefix if none configured:
ORDER_NUMBER_PREFIX=MCV

# Order number format: "sequential" | "random" | "date_sequential"
ORDER_NUMBER_FORMAT=sequential

# Default return window in days (can be overridden per venture)
ORDER_RETURN_WINDOW_DAYS=30

# Auto-complete orders after delivery (days after delivered status)
ORDER_AUTO_COMPLETE_DAYS=14

# Maximum items per order
ORDER_MAX_ITEMS=500

# Maximum bulk operation batch size
ORDER_BULK_MAX_SIZE=100

# ── Payment Configuration ────────────────────────────────────

# Payment provider (configured per venture in admin)
# Supported: stripe, paypal, square, manual
PAYMENT_DEFAULT_PROVIDER=stripe

# Auto-capture payment on order confirmation
PAYMENT_AUTO_CAPTURE=true

# Payment authorization hold duration (hours)
PAYMENT_AUTH_HOLD_HOURS=168

# ── Fulfillment Configuration ────────────────────────────────

# Default fulfillment assignment strategy: "manual" | "auto_nearest" | "round_robin"
FULFILLMENT_ASSIGNMENT_STRATEGY=manual

# Auto-split orders across locations when single location can't fulfill
FULFILLMENT_AUTO_SPLIT=true

# ── Redpanda / Event Streaming ───────────────────────────────

# Redpanda broker connection
REDPANDA_BROKERS=localhost:9092
REDPANDA_SASL_USERNAME=
REDPANDA_SASL_PASSWORD=
REDPANDA_SASL_MECHANISM=SCRAM-SHA-256

# Topic prefix for order events
ORDER_EVENTS_TOPIC_PREFIX=commerce.orders
ORDER_EVENTS_PARTITIONS=12
ORDER_EVENTS_REPLICATION_FACTOR=3

# Consumer group for order event processing
ORDER_EVENTS_CONSUMER_GROUP=order-service

# ── Notifications ────────────────────────────────────────────

# Email provider for order notifications
ORDER_EMAIL_PROVIDER=resend
ORDER_EMAIL_FROM=orders@mcv.one

# SMS provider for shipping updates (optional)
ORDER_SMS_PROVIDER=twilio
ORDER_SMS_FROM=+15551234567

# Webhook URL for order events (optional, per-venture config)
ORDER_WEBHOOK_TIMEOUT_MS=10000
ORDER_WEBHOOK_RETRY_COUNT=3

# ── Search ───────────────────────────────────────────────────

# Full-text search configuration
ORDER_SEARCH_MAX_RESULTS=1000
ORDER_SEARCH_DEFAULT_PAGE_SIZE=25

# ── Analytics ────────────────────────────────────────────────

# Analytics cache TTL (seconds)
ORDER_ANALYTICS_CACHE_TTL=300

# Analytics materialized view refresh interval (seconds)
ORDER_ANALYTICS_REFRESH_INTERVAL=3600

# ── Database ─────────────────────────────────────────────────

# Supabase connection (inherited from platform config)
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Connection pool settings for order-heavy workloads
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=25
DATABASE_STATEMENT_TIMEOUT_MS=30000
```

---

## Dependencies

```jsonc
{
  // ── Internal MCV Packages ──────────────────────────────────
  "@mcv/core":                    "workspace:*",    // DI container, context, base errors
  "@mcv/core/db":                 "workspace:*",    // Drizzle setup, migrations, RLS helpers
  "@mcv/core/events":             "workspace:*",    // Redpanda producer/consumer, CloudEvents
  "@mcv/core/auth":               "workspace:*",    // Auth context, JWT, RLS session
  "@mcv/core/validation":         "workspace:*",    // Zod schemas, input validation
  "@mcv/core/pagination":         "workspace:*",    // Pagination types and helpers
  "@mcv/core/errors":             "workspace:*",    // Standard error classes
  "@mcv/core/logging":            "workspace:*",    // Structured logging with PII filtering
  "@mcv/core/cache":              "workspace:*",    // Redis/Valkey cache layer
  "@mcv/commerce/customers":      "workspace:*",    // Customer records, addresses
  "@mcv/commerce/products":       "workspace:*",    // Product snapshots, SKU resolution
  "@mcv/commerce/inventory":      "workspace:*",    // Stock reservation, restock on return
  "@mcv/commerce/shipping":       "workspace:*",    // Carrier APIs, label generation, tracking
  "@mcv/commerce/payments":       "workspace:*",    // Payment gateway abstraction
  "@mcv/commerce/discounts":      "workspace:*",    // Discount validation and allocation
  "@mcv/commerce/tax":            "workspace:*",    // Tax calculation engine
  "@mcv/commerce/subscriptions":  "workspace:*",    // Subscription schedule management
  "@mcv/commerce/notifications":  "workspace:*",    // Email/SMS template rendering and sending
  "@mcv/ventures":                "workspace:*",    // Venture config, membership, roles

  // ── External Dependencies ─────────────────────────────────
  "drizzle-orm":                  "^0.35.0",        // ORM and query builder
  "drizzle-zod":                  "^0.7.0",         // Auto-generate Zod schemas from Drizzle
  "@trpc/server":                 "^11.0.0",        // tRPC router definitions
  "zod":                          "^3.23.0",        // Runtime schema validation
  "nanoid":                       "^5.0.0",         // Short unique ID generation
  "date-fns":                     "^4.0.0",         // Date arithmetic (return windows, etc.)
  "decimal.js":                   "^10.4.0",        // Precise decimal math for financials
  "csv-stringify":                "^6.5.0",         // CSV export generation
  "csv-parse":                    "^5.5.0",         // CSV import parsing

  // ── Dev Dependencies ──────────────────────────────────────
  "vitest":                       "^2.1.0",         // Test runner
  "@faker-js/faker":              "^9.0.0",         // Test data generation
  "testcontainers":               "^10.0.0",        // PostgreSQL container for integration tests
  "msw":                          "^2.4.0",         // Mock carrier/payment APIs
  "drizzle-kit":                  "^0.28.0"         // Migration tooling
}
```

### Dependency Graph

```
                    @mcv/core
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
       @mcv/core    @mcv/core  @mcv/core
       /db          /events    /auth
            │          │          │
            └──────────┼──────────┘
                       │
                       ▼
              @mcv/commerce/orders ◀── YOU ARE HERE
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
  @mcv/commerce   @mcv/commerce  @mcv/commerce
  /payments       /shipping      /inventory
         │             │             │
         ▼             ▼             ▼
    Stripe SDK    Carrier APIs   Stock engine

  Peer dependencies (consumed, not owned):
  ─────────────────────────────────────────
  @mcv/commerce/products     → ProductSnapshot creation
  @mcv/commerce/customers    → Customer lookup
  @mcv/commerce/discounts    → Discount validation
  @mcv/commerce/tax          → Tax calculation
  @mcv/commerce/subscriptions → Subscription schedule
  @mcv/ventures              → Venture config and roles
```

---

## Testing

### Test Strategy

```
┌────────────────────────────────────────────────────────────────────┐
│                     TEST PYRAMID                                   │
│                                                                    │
│                        ╱╲                                          │
│                       ╱  ╲        E2E Tests (5%)                   │
│                      ╱────╲       Full order lifecycle via API     │
│                     ╱      ╲                                       │
│                    ╱────────╲     Integration Tests (25%)           │
│                   ╱          ╲    DB + services + events            │
│                  ╱────────────╲                                     │
│                 ╱              ╲  Unit Tests (70%)                  │
│                ╱────────────────╲ State machine, calculations,     │
│               ╱                  ╲ validation, utilities            │
│              ╱────────────────────╲                                 │
└────────────────────────────────────────────────────────────────────┘
```

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { validateStateTransition } from './utils/validate-state-transition';
import { calculateOrderTotals } from './utils/calculate-order-totals';
import { calculateRefundAmount } from './utils/calculate-refund-amount';
import { generateOrderNumber } from './utils/generate-order-number';
import { OrderStatus } from './enums/order-status';

describe('Order State Machine', () => {
  it('allows valid transitions', () => {
    expect(validateStateTransition('pending', 'confirmed')).toBe(true);
    expect(validateStateTransition('confirmed', 'processing')).toBe(true);
    expect(validateStateTransition('processing', 'shipped')).toBe(true);
    expect(validateStateTransition('shipped', 'delivered')).toBe(true);
    expect(validateStateTransition('delivered', 'completed')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(validateStateTransition('pending', 'shipped')).toBe(false);
    expect(validateStateTransition('shipped', 'pending')).toBe(false);
    expect(validateStateTransition('completed', 'processing')).toBe(false);
    expect(validateStateTransition('cancelled', 'confirmed')).toBe(false);
  });

  it('allows cancellation from pre-ship statuses', () => {
    expect(validateStateTransition('pending', 'cancelled')).toBe(true);
    expect(validateStateTransition('confirmed', 'cancelled')).toBe(true);
    expect(validateStateTransition('processing', 'cancelled')).toBe(true);
  });

  it('blocks cancellation from post-ship statuses', () => {
    expect(validateStateTransition('shipped', 'cancelled')).toBe(false);
    expect(validateStateTransition('delivered', 'cancelled')).toBe(false);
    expect(validateStateTransition('completed', 'cancelled')).toBe(false);
  });

  it('allows returns from delivered and completed', () => {
    expect(validateStateTransition('delivered', 'returned')).toBe(true);
    expect(validateStateTransition('completed', 'returned')).toBe(true);
  });
});

describe('calculateOrderTotals', () => {
  it('calculates correct totals for simple order', () => {
    const result = calculateOrderTotals({
      items: [
        { unitPrice: 2999, quantity: 2, discounts: 0, tax: 494 },
        { unitPrice: 4999, quantity: 1, discounts: 500, tax: 371 },
      ],
      shippingCost: 999,
      orderLevelDiscounts: 0,
    });

    expect(result.subtotal).toBe(10997);     // (2999*2) + (4999*1)
    expect(result.totalDiscount).toBe(500);
    expect(result.totalTax).toBe(865);        // 494 + 371
    expect(result.totalShipping).toBe(999);
    expect(result.total).toBe(12361);         // 10997 - 500 + 865 + 999
  });

  it('handles zero-quantity edge case', () => {
    const result = calculateOrderTotals({
      items: [
        { unitPrice: 2999, quantity: 0, discounts: 0, tax: 0 },
      ],
      shippingCost: 0,
      orderLevelDiscounts: 0,
    });

    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });

  it('never produces negative totals', () => {
    const result = calculateOrderTotals({
      items: [
        { unitPrice: 1000, quantity: 1, discounts: 0, tax: 80 },
      ],
      shippingCost: 0,
      orderLevelDiscounts: 2000,           // discount exceeds subtotal
    });

    expect(result.total).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateRefundAmount', () => {
  it('calculates partial refund with restocking fee', () => {
    const result = calculateRefundAmount({
      items: [
        { unitPrice: 5000, quantity: 1, taxRate: 0.08 },
      ],
      restockingFeeRate: 0.15,
      includeShipping: false,
      originalShipping: 999,
    });

    expect(result.subtotalRefund).toBe(5000);
    expect(result.restockingFee).toBe(750);    // 5000 * 0.15
    expect(result.taxRefund).toBe(400);        // 5000 * 0.08
    expect(result.shippingRefund).toBe(0);
    expect(result.totalRefund).toBe(4650);     // 5000 - 750 + 400
  });

  it('calculates full refund with proportional shipping', () => {
    const result = calculateRefundAmount({
      items: [
        { unitPrice: 5000, quantity: 2, taxRate: 0.08 },
      ],
      restockingFeeRate: 0,
      includeShipping: true,
      originalShipping: 999,
    });

    expect(result.subtotalRefund).toBe(10000);
    expect(result.shippingRefund).toBe(999);
    expect(result.taxRefund).toBe(800);
    expect(result.totalRefund).toBe(11799);
  });
});

describe('generateOrderNumber', () => {
  it('generates sequential order numbers', () => {
    const num = generateOrderNumber({
      format: 'sequential',
      prefix: 'MCV',
      lastSequence: 1000,
    });

    expect(num).toBe('MCV-1001');
  });

  it('generates date-based sequential numbers', () => {
    const num = generateOrderNumber({
      format: 'date_sequential',
      prefix: 'ORD',
      lastSequence: 42,
      date: new Date('2026-02-08'),
    });

    expect(num).toBe('ORD-20260208-043');
  });

  it('generates random order numbers of correct length', () => {
    const num = generateOrderNumber({
      format: 'random',
      prefix: 'MCV',
      length: 8,
    });

    expect(num).toMatch(/^MCV-[A-Z0-9]{8}$/);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from 'testcontainers';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { OrderService } from './services/order.service';
import { FulfillmentService } from './services/fulfillment.service';
import { RefundService } from './services/refund.service';
import { ReturnService } from './services/return.service';
import { createTestContext, seedTestVenture, seedTestCustomer } from './test-utils';

describe('Order Lifecycle (Integration)', () => {
  let container: StartedPostgreSqlContainer;
  let db: ReturnType<typeof drizzle>;
  let orderService: OrderService;
  let fulfillmentService: FulfillmentService;
  let refundService: RefundService;
  let returnService: ReturnService;
  let ventureId: string;
  let customerId: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer()
      .withDatabase('test_orders')
      .start();

    const sql = postgres(container.getConnectionUri());
    db = drizzle(sql);
    await migrate(db, { migrationsFolder: './drizzle' });

    const ctx = createTestContext(db);
    orderService = ctx.get(OrderService);
    fulfillmentService = ctx.get(FulfillmentService);
    refundService = ctx.get(RefundService);
    returnService = ctx.get(ReturnService);

    ventureId = await seedTestVenture(db);
    customerId = await seedTestCustomer(db, ventureId);
  }, 60_000);

  afterAll(async () => {
    await container.stop();
  });

  it('creates an order and progresses through lifecycle', async () => {
    // Create
    const order = await orderService.create({
      ventureId,
      customerId,
      customerEmail: 'test@example.com',
      billingAddress: {
        firstName: 'Test',
        lastName: 'User',
        addressLine1: '123 Test St',
        city: 'Toronto',
        stateProvince: 'ON',
        postalCode: 'M5V 1A1',
        countryCode: 'CA',
      },
      items: [
        {
          productSnapshot: {
            productId: 'prod-1',
            sku: 'TEST-SKU-001',
            name: 'Test Product',
            attributes: {},
          },
          quantity: 2,
          unitPrice: { amount: 2999, currency: 'CAD' },
          requiresShipping: true,
          isGiftCard: false,
        },
      ],
      source: 'api',
    });

    expect(order.status).toBe('pending');
    expect(order.orderNumber).toMatch(/^MCV-/);
    expect(order.items).toHaveLength(1);

    // Confirm
    const confirmed = await orderService.confirm(order.id);
    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.confirmedAt).toBeDefined();

    // Create fulfillment
    const fulfillment = await fulfillmentService.create({
      orderId: order.id,
      locationId: 'wh-test-001',
      items: [{ orderItemId: order.items[0].id, quantity: 2 }],
    });

    expect(fulfillment.status).toBe('pending');

    // Pick → Pack → Ship
    await fulfillmentService.markPicked(fulfillment.id, [
      { fulfillmentItemId: fulfillment.items[0].id, pickedQuantity: 2 },
    ]);

    await fulfillmentService.markPacked(fulfillment.id, {
      weight: { value: 500, unit: 'g' },
    });

    const shipment = await fulfillmentService.createShipment(fulfillment.id, {
      carrierCode: 'canada_post',
      serviceCode: 'expedited',
      trackingNumber: 'CP123456789',
      shippingCost: { amount: 1299, currency: 'CAD' },
    });

    expect(shipment.trackingNumber).toBe('CP123456789');

    // Verify order is shipped
    const shipped = await orderService.getById(order.id);
    expect(shipped!.status).toBe('shipped');
    expect(shipped!.fulfillmentStatus).toBe('fulfilled');

    // Mark delivered
    const delivered = await orderService.markDelivered(order.id);
    expect(delivered.status).toBe('delivered');

    // Complete
    const completed = await orderService.complete(order.id);
    expect(completed.status).toBe('completed');
  });

  it('handles cancellation with refund', async () => {
    const order = await orderService.create({
      ventureId,
      customerId,
      customerEmail: 'cancel@example.com',
      billingAddress: {
        firstName: 'Cancel',
        lastName: 'Test',
        addressLine1: '456 Cancel Ave',
        city: 'Toronto',
        stateProvince: 'ON',
        postalCode: 'M5V 2B2',
        countryCode: 'CA',
      },
      items: [
        {
          productSnapshot: {
            productId: 'prod-2',
            sku: 'TEST-SKU-002',
            name: 'Cancel Test Product',
            attributes: {},
          },
          quantity: 1,
          unitPrice: { amount: 9999, currency: 'CAD' },
          requiresShipping: true,
          isGiftCard: false,
        },
      ],
      source: 'api',
    });

    await orderService.confirm(order.id);
    const cancelled = await orderService.cancel(order.id, 'customer_request', 'Changed mind');

    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancelledAt).toBeDefined();
    expect(cancelled.cancellationReason).toBe('customer_request');

    // Verify refund was auto-initiated
    const refunds = await refundService.getByOrder(order.id);
    expect(refunds).toHaveLength(1);
    expect(refunds[0].status).toBe('pending');
  });

  it('processes return and partial refund', async () => {
    // Create and fulfill order first
    const order = await orderService.create({
      ventureId,
      customerId,
      customerEmail: 'return@example.com',
      billingAddress: {
        firstName: 'Return',
        lastName: 'Test',
        addressLine1: '789 Return Rd',
        city: 'Toronto',
        stateProvince: 'ON',
        postalCode: 'M5V 3C3',
        countryCode: 'CA',
      },
      items: [
        {
          productSnapshot: {
            productId: 'prod-3',
            sku: 'TEST-SKU-003',
            name: 'Return Test A',
            attributes: {},
          },
          quantity: 1,
          unitPrice: { amount: 5999, currency: 'CAD' },
          requiresShipping: true,
          isGiftCard: false,
        },
        {
          productSnapshot: {
            productId: 'prod-4',
            sku: 'TEST-SKU-004',
            name: 'Return Test B',
            attributes: {},
          },
          quantity: 1,
          unitPrice: { amount: 3999, currency: 'CAD' },
          requiresShipping: true,
          isGiftCard: false,
        },
      ],
      source: 'api',
    });

    // Fast-forward to delivered
    await orderService.confirm(order.id);
    const fulfillment = await fulfillmentService.create({
      orderId: order.id,
      locationId: 'wh-test-001',
      items: order.items.map((item) => ({
        orderItemId: item.id,
        quantity: item.quantity,
      })),
    });
    // ... (pick, pack, ship omitted for brevity)
    await orderService.markDelivered(order.id);

    // Create return for just item A
    const returnRequest = await returnService.create({
      orderId: order.id,
      returnType: 'refund',
      items: [
        {
          orderItemId: order.items[0].id,
          quantity: 1,
          reason: 'defective',
        },
      ],
    });

    expect(returnRequest.status).toBe('requested');
    expect(returnRequest.rmaNumber).toBeDefined();

    // Approve, receive, and complete
    await returnService.approve(returnRequest.id, 'admin-1');
    await returnService.markReceived(returnRequest.id, [
      {
        returnItemId: returnRequest.items[0].id,
        receivedQuantity: 1,
        condition: 'defective',
      },
    ]);

    const completed = await returnService.complete(returnRequest.id);
    expect(completed.status).toBe('completed');

    // Verify refund was created for partial amount
    const refunds = await refundService.getByOrder(order.id);
    expect(refunds).toHaveLength(1);
    expect(refunds[0].items).toHaveLength(1);
  });

  it('prevents invalid state transitions', async () => {
    const order = await orderService.create({
      ventureId,
      customerId,
      customerEmail: 'invalid@example.com',
      billingAddress: {
        firstName: 'Invalid',
        lastName: 'Test',
        addressLine1: '000 Invalid St',
        city: 'Toronto',
        stateProvince: 'ON',
        postalCode: 'M5V 0A0',
        countryCode: 'CA',
      },
      items: [
        {
          productSnapshot: {
            productId: 'prod-5',
            sku: 'TEST-SKU-005',
            name: 'Invalid Test',
            attributes: {},
          },
          quantity: 1,
          unitPrice: { amount: 1999, currency: 'CAD' },
          requiresShipping: true,
          isGiftCard: false,
        },
      ],
      source: 'api',
    });

    // Cannot skip from pending to shipped
    await expect(
      orderService.markShipped(order.id),
    ).rejects.toThrow(/ORD_002/);

    // Cannot complete a pending order
    await expect(
      orderService.complete(order.id),
    ).rejects.toThrow(/ORD_002/);
  });

  it('records timeline events for all state changes', async () => {
    const order = await orderService.create({
      ventureId,
      customerId,
      customerEmail: 'timeline@example.com',
      billingAddress: {
        firstName: 'Timeline',
        lastName: 'Test',
        addressLine1: '111 Timeline Blvd',
        city: 'Toronto',
        stateProvince: 'ON',
        postalCode: 'M5V 1T1',
        countryCode: 'CA',
      },
      items: [
        {
          productSnapshot: {
            productId: 'prod-6',
            sku: 'TEST-SKU-006',
            name: 'Timeline Test',
            attributes: {},
          },
          quantity: 1,
          unitPrice: { amount: 2499, currency: 'CAD' },
          requiresShipping: true,
          isGiftCard: false,
        },
      ],
      source: 'api',
    });

    await orderService.confirm(order.id);
    await orderService.addNote(order.id, 'Test note', true);

    const fullOrder = await orderService.getById(order.id);
    const timeline = fullOrder!.timeline;

    expect(timeline.length).toBeGreaterThanOrEqual(3);
    expect(timeline[0].eventType).toBe('order_created');
    expect(timeline[1].eventType).toBe('order_confirmed');
    expect(timeline[2].eventType).toBe('note_added');

    // Created event should be customer-visible
    expect(timeline[0].isCustomerVisible).toBe(true);

    // Internal note should NOT be customer-visible
    expect(timeline[2].isCustomerVisible).toBe(false);
  });
});
```

### Event Publishing Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { OrderService } from './services/order.service';
import { createMockEventBus } from '@mcv/core/events/testing';

describe('Order Event Publishing', () => {
  it('publishes OrderCreatedEvent on creation', async () => {
    const eventBus = createMockEventBus();
    const orderService = new OrderService({ eventBus, /* ... */ });

    await orderService.create({ /* ... valid input ... */ });

    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0]).toMatchObject({
      type: 'commerce.orders.created',
      source: expect.stringContaining('/ventures/'),
      data: expect.objectContaining({
        orderId: expect.any(String),
        orderNumber: expect.any(String),
        ventureId: expect.any(String),
      }),
    });
  });

  it('publishes OrderCancelledEvent with refund details', async () => {
    const eventBus = createMockEventBus();
    const orderService = new OrderService({ eventBus, /* ... */ });

    // ... create and confirm order ...

    await orderService.cancel(orderId, 'customer_request');

    const cancelEvent = eventBus.published.find(
      (e) => e.type === 'commerce.orders.cancelled',
    );

    expect(cancelEvent).toBeDefined();
    expect(cancelEvent!.data).toMatchObject({
      orderId: expect.any(String),
      cancellationReason: 'customer_request',
      refundInitiated: true,
    });
  });

  it('events follow CloudEvents v1.0 spec', async () => {
    const eventBus = createMockEventBus();
    const orderService = new OrderService({ eventBus, /* ... */ });

    await orderService.create({ /* ... */ });

    const event = eventBus.published[0];
    expect(event.specversion).toBe('1.0');
    expect(event.id).toBeDefined();
    expect(event.time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(event.datacontenttype).toBe('application/json');
  });
});
```

### Test Utilities

```typescript
// test-utils.ts — Shared test helpers for order tests

import { faker } from '@faker-js/faker';
import type { CreateOrderInput } from './schemas/create-order.input';

/**
 * Generate a valid order creation input with random data.
 */
export function createTestOrderInput(
  overrides: Partial<CreateOrderInput> = {},
): CreateOrderInput {
  return {
    ventureId: overrides.ventureId ?? faker.string.uuid(),
    customerId: overrides.customerId ?? faker.string.uuid(),
    customerEmail: overrides.customerEmail ?? faker.internet.email(),
    customerPhone: faker.phone.number(),
    billingAddress: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      addressLine1: faker.location.streetAddress(),
      city: faker.location.city(),
      stateProvince: faker.location.state({ abbreviated: true }),
      postalCode: faker.location.zipCode(),
      countryCode: 'US',
    },
    shippingAddress: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      addressLine1: faker.location.streetAddress(),
      city: faker.location.city(),
      stateProvince: faker.location.state({ abbreviated: true }),
      postalCode: faker.location.zipCode(),
      countryCode: 'US',
    },
    items: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
      productSnapshot: {
        productId: faker.string.uuid(),
        variantId: faker.string.uuid(),
        sku: faker.string.alphanumeric(10).toUpperCase(),
        name: faker.commerce.productName(),
        variantName: faker.commerce.productAdjective(),
        imageUrl: faker.image.url(),
        attributes: {
          color: faker.color.human(),
          size: faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL']),
        },
      },
      quantity: faker.number.int({ min: 1, max: 5 }),
      unitPrice: {
        amount: faker.number.int({ min: 500, max: 50000 }),
        currency: 'USD',
      },
      requiresShipping: true,
      isGiftCard: false,
    })),
    source: 'api',
    ...overrides,
  };
}

/**
 * Create a fully fulfilled order for return/refund testing.
 */
export async function createFulfilledOrder(
  orderService: OrderService,
  fulfillmentService: FulfillmentService,
  ventureId: string,
): Promise<Order> {
  const input = createTestOrderInput({ ventureId });
  const order = await orderService.create(input);
  await orderService.confirm(order.id);

  const fulfillment = await fulfillmentService.create({
    orderId: order.id,
    locationId: 'test-warehouse',
    items: order.items.map((item) => ({
      orderItemId: item.id,
      quantity: item.quantity,
    })),
  });

  await fulfillmentService.markPicked(fulfillment.id,
    fulfillment.items.map((fi) => ({
      fulfillmentItemId: fi.id,
      pickedQuantity: fi.quantity,
    })),
  );

  await fulfillmentService.markPacked(fulfillment.id, {
    weight: { value: 1000, unit: 'g' },
  });

  await fulfillmentService.createShipment(fulfillment.id, {
    carrierCode: 'test_carrier',
    serviceCode: 'standard',
    trackingNumber: `TEST-${faker.string.alphanumeric(12)}`,
    shippingCost: { amount: 999, currency: 'USD' },
  });

  await orderService.markDelivered(order.id);
  return orderService.getById(order.id) as Promise<Order>;
}
```

### Running Tests

```bash
# Run all order module tests
pnpm --filter @mcv/commerce-orders test

# Run with coverage
pnpm --filter @mcv/commerce-orders test:coverage

# Run integration tests only (requires Docker for testcontainers)
pnpm --filter @mcv/commerce-orders test:integration

# Run specific test file
pnpm --filter @mcv/commerce-orders test -- order-lifecycle.test.ts

# Watch mode during development
pnpm --filter @mcv/commerce-orders test:watch
```

---

## Changelog

| Version | Date       | Changes                                       |
|---------|------------|-----------------------------------------------|
| 0.1.0   | 2025-06-15 | Initial release — core order CRUD, state machine |
| 0.2.0   | 2025-07-20 | Fulfillment pipeline (pick/pack/ship)           |
| 0.3.0   | 2025-08-30 | Returns & refunds (RMA workflow)                |
| 0.4.0   | 2025-10-01 | Order search, saved filters, suggestions        |
| 0.5.0   | 2025-11-15 | Subscription order generation                   |
| 0.6.0   | 2026-01-10 | Analytics service, conversion funnel             |
| 0.7.0   | 2026-02-01 | Bulk operations, CSV import/export              |

---

*Last updated: 2026-02-08 · Maintainer: @mcv/commerce-team · License: PROPRIETARY*