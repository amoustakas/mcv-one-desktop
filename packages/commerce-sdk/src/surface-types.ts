// @ts-nocheck
// src/lib/commerce/surface-types.ts
// Commerce Surface Layer — SPEC-002-B
// Cart, Customer, Discount, Fulfillment, Notifications, Inventory,
// Shipping, Digital Delivery, Reviews, Wishlists, Gift Cards, Analytics, Search

import { z } from 'zod';

// ─────────────────────────────────────────────────────────
// ADDRESS (extended from base — includes name/phone for surface layer)
// ─────────────────────────────────────────────────────────

export const SurfaceAddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  company: z.string().nullable(),
  line1: z.string(),
  line2: z.string().nullable(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string().length(2),
  phone: z.string().nullable(),
});
export type SurfaceAddress = z.infer<typeof SurfaceAddressSchema>;

// ─────────────────────────────────────────────────────────
// SECTION 1: CART & CHECKOUT
// ─────────────────────────────────────────────────────────

export const AppliedDiscountSchema = z.object({
  discountId: z.string(),
  code: z.string().nullable(),
  type: z.enum(['percentage', 'fixed_amount', 'bxgy', 'free_shipping', 'tiered']),
  value: z.number(),
  amountSaved: z.number(),
});
export type AppliedDiscount = z.infer<typeof AppliedDiscountSchema>;

export const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0),
  metadata: z.record(z.string(), z.unknown()),
});
export type CartItem = z.infer<typeof CartItemSchema>;

export interface CartSession {
  id: string;
  ventureId: string;
  customerId: string | null;
  sessionId: string;
  items: CartItem[];
  discountCodes: string[];
  appliedDiscounts: AppliedDiscount[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  total: number;
  currency: string;
  shippingAddress: SurfaceAddress | null;
  billingAddress: SurfaceAddress | null;
  selectedPaymentMethod: string | null;
  selectedShippingMethod: string | null;
  abandonedAt: string | null;
  recoveryEmailSent: boolean;
  expiresAt: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const CreateCartInput = z.object({
  ventureId: z.string(),
  customerId: z.string().nullable(),
  sessionId: z.string(),
  currency: z.string().default('USD'),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateCartInput = z.infer<typeof CreateCartInput>;

export const AddToCartInput = z.object({
  cartId: z.string(),
  productId: z.string(),
  variantId: z.string().nullable(),
  quantity: z.number().int().positive(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type AddToCartInput = z.infer<typeof AddToCartInput>;

// ─────────────────────────────────────────────────────────
// SECTION 2: CUSTOMER MANAGEMENT
// ─────────────────────────────────────────────────────────

export const SavedPaymentMethodSchema = z.object({
  id: z.string(),
  type: z.string(),
  last4: z.string(),
  brand: z.string().nullable(),
  expiryMonth: z.number().int().nullable(),
  expiryYear: z.number().int().nullable(),
  isDefault: z.boolean(),
  processorId: z.string(),
  processorMethodId: z.string(),
});
export type SavedPaymentMethod = z.infer<typeof SavedPaymentMethodSchema>;

export const CustomerSegment = z.enum([
  'high_value',
  'at_risk',
  'new',
  'repeat',
  'whale',
  'dormant',
  'subscription_active',
]);
export type CustomerSegment = z.infer<typeof CustomerSegment>;

export interface Customer {
  id: string;
  ventureId: string;
  userId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  addresses: SurfaceAddress[];
  defaultAddressId: string | null;
  savedPaymentMethods: SavedPaymentMethod[];
  defaultPaymentMethodId: string | null;
  tags: string[];
  segments: string[];
  group: string | null;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  ltv: number;
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  notes: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const CreateCustomerInput = z.object({
  ventureId: z.string(),
  userId: z.string().nullable(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  group: z.string().nullable(),
  communicationPreferences: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }).default({}),
  notes: z.string().default(''),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateCustomerInput = z.infer<typeof CreateCustomerInput>;

// ─────────────────────────────────────────────────────────
// SECTION 3: DISCOUNT & PROMOTION ENGINE
// ─────────────────────────────────────────────────────────

export const DiscountType = z.enum([
  'percentage',
  'fixed_amount',
  'bxgy',
  'free_shipping',
  'tiered',
]);
export type DiscountType = z.infer<typeof DiscountType>;

export const DiscountStatus = z.enum(['active', 'scheduled', 'expired', 'disabled']);
export type DiscountStatus = z.infer<typeof DiscountStatus>;

export const DiscountTierSchema = z.object({
  minAmount: z.number().min(0),
  discountPercent: z.number().min(0).max(100),
});
export type DiscountTier = z.infer<typeof DiscountTierSchema>;

export interface Discount {
  id: string;
  ventureId: string;
  code: string | null;
  type: DiscountType;
  value: number;
  appliesTo: 'all' | 'specific_products' | 'specific_collections' | 'specific_customers';
  productIds: string[];
  collectionIds: string[];
  customerGroupIds: string[];
  minimumOrderAmount: number | null;
  minimumQuantity: number | null;
  maxUsesTotal: number | null;
  maxUsesPerCustomer: number | null;
  usedCount: number;
  startsAt: string;
  endsAt: string | null;
  stackable: boolean;
  status: DiscountStatus;
  buyQuantity: number | null;
  getQuantity: number | null;
  getProductIds: string[] | null;
  tiers: DiscountTier[] | null;
  metadata: Record<string, unknown>;
}

export const CreateDiscountInput = z.object({
  ventureId: z.string(),
  code: z.string().nullable(),
  type: DiscountType,
  value: z.number().min(0),
  appliesTo: z.enum(['all', 'specific_products', 'specific_collections', 'specific_customers']).default('all'),
  productIds: z.array(z.string()).default([]),
  collectionIds: z.array(z.string()).default([]),
  customerGroupIds: z.array(z.string()).default([]),
  minimumOrderAmount: z.number().min(0).nullable(),
  minimumQuantity: z.number().int().min(0).nullable(),
  maxUsesTotal: z.number().int().positive().nullable(),
  maxUsesPerCustomer: z.number().int().positive().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable(),
  stackable: z.boolean().default(false),
  buyQuantity: z.number().int().positive().nullable(),
  getQuantity: z.number().int().positive().nullable(),
  getProductIds: z.array(z.string()).nullable(),
  tiers: z.array(DiscountTierSchema).nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateDiscountInput = z.infer<typeof CreateDiscountInput>;

// ─────────────────────────────────────────────────────────
// SECTION 4: ORDER FULFILLMENT PIPELINE
// ─────────────────────────────────────────────────────────

export const FulfillmentStatus = z.enum([
  'unfulfilled',
  'partially_fulfilled',
  'fulfilled',
  'delivered',
  'returned',
  'canceled',
]);
export type FulfillmentStatus = z.infer<typeof FulfillmentStatus>;

export const FulfillmentItemSchema = z.object({
  id: z.string(),
  fulfillmentId: z.string(),
  orderItemId: z.string(),
  quantity: z.number().int().positive(),
});
export type FulfillmentItem = z.infer<typeof FulfillmentItemSchema>;

export interface Fulfillment {
  id: string;
  orderId: string;
  status: FulfillmentStatus;
  items: FulfillmentItem[];
  trackingNumber: string | null;
  trackingUrl: string | null;
  carrier: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedDelivery: string | null;
  shippingLabelUrl: string | null;
  returnLabelUrl: string | null;
  notes: string;
  createdAt: string;
}

export const ReturnItemSchema = z.object({
  id: z.string(),
  returnRequestId: z.string(),
  orderItemId: z.string(),
  quantity: z.number().int().positive(),
  reason: z.string(),
});
export type ReturnItem = z.infer<typeof ReturnItemSchema>;

export const ReturnStatus = z.enum([
  'requested',
  'approved',
  'shipped_back',
  'received',
  'refunded',
  'rejected',
]);
export type ReturnStatus = z.infer<typeof ReturnStatus>;

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  items: ReturnItem[];
  reason: string;
  status: ReturnStatus;
  refundAmount: number | null;
  returnTrackingNumber: string | null;
  returnLabelUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────
// SECTION 5: NOTIFICATION SYSTEM
// ─────────────────────────────────────────────────────────

export const NotificationEvent = z.enum([
  'order.confirmed',
  'order.shipped',
  'order.delivered',
  'order.canceled',
  'order.refunded',
  'payment.succeeded',
  'payment.failed',
  'subscription.created',
  'subscription.renewed',
  'subscription.canceled',
  'subscription.trial_ending',
  'invoice.sent',
  'invoice.paid',
  'invoice.overdue',
  'cart.abandoned',
  'cart.recovery',
  'inventory.low_stock',
  'review.received',
  'wishlist.price_drop',
  'gift_card.received',
  'loan.payment_due',
  'loan.overdue',
  'royalty.payout_ready',
  'escrow.milestone_approved',
  'escrow.funds_released',
]);
export type NotificationEvent = z.infer<typeof NotificationEvent>;

export const NotificationChannel = z.enum(['email', 'sms', 'push', 'in_app', 'webhook']);
export type NotificationChannel = z.infer<typeof NotificationChannel>;

export interface NotificationTemplate {
  id: string;
  ventureId: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  subject: string;
  body: string;
  enabled: boolean;
  createdAt: string;
}

export const NotificationDeliveryStatus = z.enum([
  'pending',
  'sent',
  'delivered',
  'failed',
  'bounced',
]);
export type NotificationDeliveryStatus = z.infer<typeof NotificationDeliveryStatus>;

export interface NotificationDelivery {
  id: string;
  ventureId: string;
  templateId: string;
  customerId: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────
// SECTION 6: INVENTORY MANAGEMENT
// ─────────────────────────────────────────────────────────

export interface InventoryLocation {
  id: string;
  ventureId: string;
  name: string;
  address: SurfaceAddress;
  isDefault: boolean;
  status: 'active' | 'inactive';
}

export interface InventoryLevel {
  id: string;
  productId: string;
  variantId: string | null;
  locationId: string;
  available: number;
  reserved: number;
  committed: number;
  incoming: number;
  onHand: number;
  lowStockThreshold: number;
  backorderEnabled: boolean;
}

export const InventoryMovementType = z.enum([
  'purchase',
  'sale',
  'return',
  'adjustment',
  'transfer',
  'reservation',
  'release',
]);
export type InventoryMovementType = z.infer<typeof InventoryMovementType>;

export interface InventoryMovement {
  id: string;
  productId: string;
  locationId: string;
  type: InventoryMovementType;
  quantity: number;
  previousLevel: number;
  newLevel: number;
  referenceType: string | null;
  referenceId: string | null;
  reason: string;
  createdBy: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────
// SECTION 7: SHIPPING
// ─────────────────────────────────────────────────────────

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  amount: number;
  currency: string;
  estimatedDays: number;
  guaranteedDelivery: boolean;
}

export const ShippingZoneRateSchema = z.object({
  id: z.string(),
  name: z.string(),
  carrier: z.string().nullable(),
  amount: z.number().min(0),
  currency: z.string().default('USD'),
  minOrderAmount: z.number().min(0).nullable(),
  maxOrderAmount: z.number().min(0).nullable(),
  estimatedDays: z.number().int().min(0).nullable(),
});
export type ShippingZoneRate = z.infer<typeof ShippingZoneRateSchema>;

export interface ShippingZone {
  id: string;
  ventureId: string;
  name: string;
  countries: string[];
  rates: ShippingZoneRate[];
}

// ─────────────────────────────────────────────────────────
// SECTION 8: DIGITAL DELIVERY
// ─────────────────────────────────────────────────────────

export const DripScheduleItemSchema = z.object({
  dayOffset: z.number().int().min(0),
  contentId: z.string(),
  contentTitle: z.string(),
  contentUrl: z.string().nullable(),
});
export type DripScheduleItem = z.infer<typeof DripScheduleItemSchema>;

export interface DigitalFulfillment {
  id: string;
  orderId: string;
  productId: string;
  deliveryMethod: 'download' | 'license_key' | 'access_grant' | 'drip_content';
  downloadUrl: string | null;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: string | null;
  licenseKey: string | null;
  activations: number;
  maxActivations: number;
  accessToken: string | null;
  accessExpiresAt: string | null;
  contentSchedule: DripScheduleItem[] | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────
// SECTION 9: REVIEWS & RATINGS
// ─────────────────────────────────────────────────────────

export const ReviewStatus = z.enum(['pending', 'approved', 'rejected', 'flagged']);
export type ReviewStatus = z.infer<typeof ReviewStatus>;

export interface Review {
  id: string;
  ventureId: string;
  productId: string;
  customerId: string;
  orderId: string | null;
  rating: number;
  title: string;
  body: string;
  pros: string[];
  cons: string[];
  images: string[];
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  helpfulCount: number;
  reportCount: number;
  vendorResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export interface ProductRating {
  productId: string;
  averageRating: number;
  totalReviews: number;
  distribution: { [stars: number]: number };
}

export const CreateReviewInput = z.object({
  ventureId: z.string(),
  productId: z.string(),
  customerId: z.string(),
  orderId: z.string().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string(),
  body: z.string(),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});
export type CreateReviewInput = z.infer<typeof CreateReviewInput>;

// ─────────────────────────────────────────────────────────
// SECTION 10: WISHLIST / SAVE FOR LATER
// ─────────────────────────────────────────────────────────

export const WishlistItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().nullable(),
  addedAt: z.string(),
  priceWhenAdded: z.number().min(0),
  notifyOnPriceDrop: z.boolean(),
});
export type WishlistItem = z.infer<typeof WishlistItemSchema>;

export interface Wishlist {
  id: string;
  customerId: string;
  ventureId: string;
  name: string;
  isPublic: boolean;
  items: WishlistItem[];
  shareUrl: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────
// SECTION 11: GIFT CARDS
// ─────────────────────────────────────────────────────────

export const GiftCardStatus = z.enum(['active', 'redeemed', 'expired', 'disabled']);
export type GiftCardStatus = z.infer<typeof GiftCardStatus>;

export const GiftCardTransactionSchema = z.object({
  id: z.string(),
  giftCardId: z.string(),
  type: z.enum(['purchase', 'redemption', 'refund']),
  amount: z.number(),
  orderId: z.string().nullable(),
  balanceAfter: z.number().min(0),
  createdAt: z.string(),
});
export type GiftCardTransaction = z.infer<typeof GiftCardTransactionSchema>;

export interface GiftCard {
  id: string;
  ventureId: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  purchasedBy: string | null;
  recipientEmail: string | null;
  recipientMessage: string | null;
  status: GiftCardStatus;
  expiresAt: string | null;
  redeemedAt: string | null;
  transactions: GiftCardTransaction[];
  createdAt: string;
}

export const CreateGiftCardInput = z.object({
  ventureId: z.string(),
  initialBalance: z.number().positive(),
  currency: z.string().default('USD'),
  purchasedBy: z.string().nullable(),
  recipientEmail: z.string().email().nullable(),
  recipientMessage: z.string().nullable(),
  expiresAt: z.string().datetime().nullable(),
});
export type CreateGiftCardInput = z.infer<typeof CreateGiftCardInput>;

// ─────────────────────────────────────────────────────────
// SECTION 12: COMMERCE ANALYTICS
// ─────────────────────────────────────────────────────────

export interface ConversionFunnel {
  visitors: number;
  productViews: number;
  addedToCart: number;
  reachedCheckout: number;
  completed: number;
  conversionRate: number;
}

export interface CohortData {
  cohortMonth: string;
  customersAcquired: number;
  retentionByMonth: number[];
  revenueByMonth: number[];
}

export interface CommerceAnalytics {
  funnel: ConversionFunnel;
  cartAbandonment: {
    rate: number;
    recoveryRate: number;
    revenueRecovered: number;
    topAbandonedProducts: { productId: string; count: number }[];
  };
  topProducts: { productId: string; revenue: number; unitsSold: number }[];
  customerAcquisitionCost: number;
  repeatPurchaseRate: number;
  averageOrderValue: number;
  cohorts: CohortData[];
}

// ─────────────────────────────────────────────────────────
// SECTION 13: PRODUCT SEARCH & DISCOVERY
// ─────────────────────────────────────────────────────────

export const SearchFiltersSchema = z.object({
  categories: z.array(z.string()).optional(),
  priceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
  rating: z.number().min(1).max(5).optional(),
  inStock: z.boolean().optional(),
  productType: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'newest', 'rating', 'popularity']).optional(),
});
export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

export interface SearchResult {
  query: string;
  totalCount: number;
  products: Array<{
    productId: string;
    name: string;
    score: number;
    highlight: string | null;
  }>;
  facets: {
    categories: { id: string; count: number }[];
    priceRange: { min: number; max: number };
    tags: { tag: string; count: number }[];
  };
}
