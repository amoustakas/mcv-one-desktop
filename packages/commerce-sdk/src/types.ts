// src/lib/commerce/types.ts
// Commerce layer — Tier 5 (consumes Ledger @ Tier 2, Payment Router @ Tier 3)
// MCV Commerce & Financial OS — SPEC-002

import { z } from 'zod';

// ─────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────

export const ProductType = z.enum([
  'physical_good', 'physical_rental',
  'digital_download', 'digital_access', 'digital_license',
  'subscription', 'metered',
  'credit_pack', 'token', 'investment', 'loan',
  'service', 'service_retainer',
  'creator_content', 'creator_membership',
  'marketplace_listing', 'marketplace_escrow',
]);
export type ProductType = z.infer<typeof ProductType>;

export const ProductStatus = z.enum(['draft', 'active', 'archived']);
export type ProductStatus = z.infer<typeof ProductStatus>;

export const OrderStatus = z.enum([
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'refunded',
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const SubscriptionStatus = z.enum([
  'trialing', 'active', 'paused', 'past_due', 'canceled', 'unpaid',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;

export const InvoiceStatus = z.enum([
  'draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'voided',
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatus>;

export const LoanStatus = z.enum([
  'application', 'approved', 'disbursed', 'repaying', 'paid_off', 'defaulted',
]);
export type LoanStatus = z.infer<typeof LoanStatus>;

export const SubscriptionInterval = z.enum(['day', 'week', 'month', 'year']);
export type SubscriptionInterval = z.infer<typeof SubscriptionInterval>;

export const PaymentTerms = z.enum([
  'net_7', 'net_15', 'net_30', 'net_60', 'net_90', 'due_on_receipt',
]);
export type PaymentTerms = z.infer<typeof PaymentTerms>;

export const OverageBehavior = z.enum(['block', 'charge', 'throttle', 'notify_admin']);
export type OverageBehavior = z.infer<typeof OverageBehavior>;

export const InterestType = z.enum(['simple', 'compound']);
export type InterestType = z.infer<typeof InterestType>;

export const LateFeeType = z.enum(['fixed', 'percentage', 'none']);
export type LateFeeType = z.infer<typeof LateFeeType>;

// ─────────────────────────────────────────────────────────
// PRICING
// ─────────────────────────────────────────────────────────

export const PricePointSchema = z.object({
  amount: z.number().min(0),
  currency: z.string().min(2).max(10).default('USD'),
  compareAtPrice: z.number().min(0).nullable().default(null),
  costBasis: z.number().min(0).nullable().default(null),
});
export type PricePoint = z.infer<typeof PricePointSchema>;

export const VolumeTierSchema = z.object({
  minQuantity: z.number().int().positive(),
  maxQuantity: z.number().int().positive().nullable().default(null),
  price: PricePointSchema,
});
export type VolumeTier = z.infer<typeof VolumeTierSchema>;

export const WholesaleTierSchema = z.object({
  tierId: z.string(),
  tierName: z.string(),
  price: PricePointSchema,
});
export type WholesaleTier = z.infer<typeof WholesaleTierSchema>;

export const PricingConfigSchema = z.object({
  default: PricePointSchema,
  volumeTiers: z.array(VolumeTierSchema).default([]),
  wholesaleTiers: z.array(WholesaleTierSchema).default([]),
});
export type PricingConfig = z.infer<typeof PricingConfigSchema>;

// ─────────────────────────────────────────────────────────
// PRODUCT TYPE-SPECIFIC CONFIGS
// ─────────────────────────────────────────────────────────

export const PhysicalConfigSchema = z.object({
  weightGrams: z.number().min(0).nullable().default(null),
  dimensionsCm: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
  }).nullable().default(null),
  requiresShipping: z.boolean().default(true),
  shippingClass: z.string().nullable().default(null),
  rentalPeriodDays: z.number().int().positive().nullable().default(null),
  depositAmount: z.number().min(0).nullable().default(null),
});
export type PhysicalConfig = z.infer<typeof PhysicalConfigSchema>;

export const DigitalConfigSchema = z.object({
  fileUrl: z.string().nullable().default(null),
  fileSize: z.number().int().min(0).nullable().default(null),
  fileMimeType: z.string().nullable().default(null),
  downloadLimit: z.number().int().positive().nullable().default(null),
  downloadExpiryHours: z.number().int().positive().nullable().default(null),
  streamable: z.boolean().default(false),
  licenseKey: z.string().nullable().default(null),
});
export type DigitalConfig = z.infer<typeof DigitalConfigSchema>;

export const OverageConfigSchema = z.object({
  behavior: OverageBehavior,
  perUnitPrice: z.number().min(0).nullable().default(null),
  gracePeriodHours: z.number().int().min(0).default(0),
  hardCapMultiplier: z.number().positive().nullable().default(null),
  notifyAt: z.array(z.number().min(0).max(100)).default([]),
});
export type OverageConfig = z.infer<typeof OverageConfigSchema>;

export const SubscriptionConfigSchema = z.object({
  defaultPlanId: z.string().nullable().default(null),
  trialDays: z.number().int().min(0).default(0),
  cancelAtPeriodEnd: z.boolean().default(false),
  prorateOnUpgrade: z.boolean().default(true),
  prorateOnDowngrade: z.boolean().default(false),
});
export type SubscriptionConfig = z.infer<typeof SubscriptionConfigSchema>;

export const MeteredConfigSchema = z.object({
  meterId: z.string(),
  unit: z.string(),
  unitLabel: z.string().nullable().default(null),
  aggregationMethod: z.enum(['sum', 'max', 'last_during_period']).default('sum'),
  reportingInterval: z.enum(['realtime', 'hourly', 'daily']).default('daily'),
  overage: OverageConfigSchema.nullable().default(null),
});
export type MeteredConfig = z.infer<typeof MeteredConfigSchema>;

export const CreditConfigSchema = z.object({
  creditAmount: z.number().positive(),
  creditCurrency: z.string().default('credits'),
  bonusCredits: z.number().min(0).default(0),
  expiryDays: z.number().int().positive().nullable().default(null),
});
export type CreditConfig = z.infer<typeof CreditConfigSchema>;

export const LoanConfigSchema = z.object({
  principal: z.number().positive(),
  interestRate: z.number().min(0),
  interestType: InterestType,
  termMonths: z.number().int().positive(),
  repaymentSchedule: z.enum(['monthly', 'bi_weekly', 'weekly', 'bullet']).default('monthly'),
  lateFeeAmount: z.number().min(0).default(0),
  autoDebitEnabled: z.boolean().default(false),
});
export type LoanConfig = z.infer<typeof LoanConfigSchema>;

export const InvestmentConfigSchema = z.object({
  minimumAmount: z.number().positive(),
  maximumAmount: z.number().positive().nullable().default(null),
  targetYield: z.number().min(0).nullable().default(null),
  lockupDays: z.number().int().min(0).default(0),
  investmentType: z.enum(['equity', 'debt', 'revenue_share', 'token', 'rwa']),
  requiresAccreditedInvestor: z.boolean().default(false),
  offeringDocumentUrl: z.string().nullable().default(null),
});
export type InvestmentConfig = z.infer<typeof InvestmentConfigSchema>;

export const GiftConfigSchema = z.object({
  giftable: z.boolean().default(true),
  giftMessageEnabled: z.boolean().default(true),
  scheduledDelivery: z.boolean().default(false),
  anonymousGiftAllowed: z.boolean().default(false),
});
export type GiftConfig = z.infer<typeof GiftConfigSchema>;

export const TransferConfigSchema = z.object({
  transferable: z.boolean().default(false),
  transferFee: z.number().min(0).default(0),
  transferCooldownHours: z.number().int().min(0).default(0),
  maxTransfers: z.number().int().positive().nullable().default(null),
  requireRecipientKyc: z.boolean().default(false),
});
export type TransferConfig = z.infer<typeof TransferConfigSchema>;

// ─────────────────────────────────────────────────────────
// PRODUCT
// ─────────────────────────────────────────────────────────

export const ProductSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string(),
  type: ProductType,
  name: z.string().min(1).max(500),
  description: z.string().nullable().default(null),
  status: ProductStatus,
  sku: z.string().nullable().default(null),
  pricing: PricingConfigSchema,
  categoryIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  trackInventory: z.boolean().default(false),
  inventoryCount: z.number().int().min(0).nullable().default(null),
  taxCategoryId: z.string().nullable().default(null),
  taxExempt: z.boolean().default(false),
  requiresKyc: z.boolean().default(false),
  minimumComplianceTier: z.string().nullable().default(null),
  geoRestrictions: z.array(z.string()).default([]),
  // Type-specific nullable config objects
  physical: PhysicalConfigSchema.nullable().default(null),
  digital: DigitalConfigSchema.nullable().default(null),
  subscription: SubscriptionConfigSchema.nullable().default(null),
  metered: MeteredConfigSchema.nullable().default(null),
  credit: CreditConfigSchema.nullable().default(null),
  loan: LoanConfigSchema.nullable().default(null),
  investment: InvestmentConfigSchema.nullable().default(null),
  gift: GiftConfigSchema.nullable().default(null),
  transfer: TransferConfigSchema.nullable().default(null),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Product = z.infer<typeof ProductSchema>;

export const CreateProductInput = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: ProductStatus.default('draft'),
});
export type CreateProductInput = z.infer<typeof CreateProductInput>;

// ─────────────────────────────────────────────────────────
// SUBSCRIPTION PLAN
// ─────────────────────────────────────────────────────────

export const SubscriptionPlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  interval: SubscriptionInterval,
  intervalCount: z.number().int().positive().default(1),
  price: PricePointSchema,
  features: z.array(z.string()).default([]),
  limits: z.record(z.string(), z.unknown()).default({}),
  overage: OverageConfigSchema.nullable().default(null),
});
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

// ─────────────────────────────────────────────────────────
// INVOICE CONFIG
// ─────────────────────────────────────────────────────────

export const InvoiceConfigSchema = z.object({
  paymentTerms: PaymentTerms.default('net_30'),
  autoReminders: z.boolean().default(true),
  reminderSchedule: z.array(z.number().int()).default([7, 3, 1]),
  lateFeeType: LateFeeType.default('none'),
  lateFeeValue: z.number().min(0).default(0),
  acceptPartialPayment: z.boolean().default(false),
  approvalRequired: z.boolean().default(false),
});
export type InvoiceConfig = z.infer<typeof InvoiceConfigSchema>;

// ─────────────────────────────────────────────────────────
// ORDER
// ─────────────────────────────────────────────────────────

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().nullable().default(null),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const AddressSchema = z.object({
  line1: z.string(),
  line2: z.string().nullable().default(null),
  city: z.string(),
  state: z.string().nullable().default(null),
  postalCode: z.string().nullable().default(null),
  country: z.string().length(2),
});
export type Address = z.infer<typeof AddressSchema>;

export const OrderSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string(),
  customerId: z.string(),
  status: OrderStatus,
  items: z.array(OrderItemSchema),
  totalAmount: z.number().min(0),
  currency: z.string().min(2).max(10),
  paymentIntentId: z.string().uuid().nullable().default(null),
  shippingAddress: AddressSchema.nullable().default(null),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderInput = OrderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: OrderStatus.default('pending'),
  items: z.array(OrderItemSchema.omit({ id: true, orderId: true })),
});
export type CreateOrderInput = z.infer<typeof CreateOrderInput>;

// ─────────────────────────────────────────────────────────
// SUBSCRIPTION (active instance)
// ─────────────────────────────────────────────────────────

export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string(),
  customerId: z.string(),
  planId: z.string(),
  productId: z.string().uuid().nullable().default(null),
  status: SubscriptionStatus,
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  trialEnd: z.string().datetime().nullable().default(null),
  cancelAtPeriodEnd: z.boolean().default(false),
  quantity: z.number().int().positive().default(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

export const CreateSubscriptionInput = SubscriptionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: SubscriptionStatus.default('active'),
});
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionInput>;

// ─────────────────────────────────────────────────────────
// INVOICE
// ─────────────────────────────────────────────────────────

export const InvoiceLineItemSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  description: z.string(),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
  productId: z.string().uuid().nullable().default(null),
  taxAmount: z.number().min(0).default(0),
});
export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string(),
  customerId: z.string(),
  invoiceNumber: z.string(),
  status: InvoiceStatus,
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  total: z.number().min(0),
  amountDue: z.number().min(0),
  amountPaid: z.number().min(0).default(0),
  dueDate: z.string().date(),
  paymentTerms: PaymentTerms,
  lineItems: z.array(InvoiceLineItemSchema),
  sentAt: z.string().datetime().nullable().default(null),
  viewedAt: z.string().datetime().nullable().default(null),
  paidAt: z.string().datetime().nullable().default(null),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const CreateInvoiceInput = InvoiceSchema.omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: InvoiceStatus.default('draft'),
  lineItems: z.array(InvoiceLineItemSchema.omit({ id: true, invoiceId: true })),
});
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceInput>;

// ─────────────────────────────────────────────────────────
// LOAN
// ─────────────────────────────────────────────────────────

export const LoanRepaymentSchema = z.object({
  id: z.string().uuid(),
  loanId: z.string().uuid(),
  amount: z.number().min(0),
  principalPortion: z.number().min(0),
  interestPortion: z.number().min(0),
  paymentDate: z.string().datetime(),
  status: z.enum(['pending', 'completed', 'failed']),
});
export type LoanRepayment = z.infer<typeof LoanRepaymentSchema>;

export const LoanSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string(),
  customerId: z.string(),
  productId: z.string().uuid().nullable().default(null),
  principal: z.number().positive(),
  interestRate: z.number().min(0),
  interestType: InterestType,
  termMonths: z.number().int().positive(),
  status: LoanStatus,
  outstandingBalance: z.number().min(0),
  nextPaymentDate: z.string().date().nullable().default(null),
  disbursedAt: z.string().datetime().nullable().default(null),
  repayments: z.array(LoanRepaymentSchema).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Loan = z.infer<typeof LoanSchema>;

export const CreateLoanInput = LoanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  repayments: true,
}).extend({
  status: LoanStatus.default('application'),
});
export type CreateLoanInput = z.infer<typeof CreateLoanInput>;

// ─────────────────────────────────────────────────────────
// USAGE RECORD (metered billing)
// ─────────────────────────────────────────────────────────

export const UsageRecordSchema = z.object({
  id: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  meterId: z.string(),
  quantity: z.number().min(0),
  timestamp: z.string().datetime(),
  idempotencyKey: z.string(),
  action: z.enum(['increment', 'set']).default('increment'),
});
export type UsageRecord = z.infer<typeof UsageRecordSchema>;

export const CreateUsageRecordInput = UsageRecordSchema.omit({ id: true });
export type CreateUsageRecordInput = z.infer<typeof CreateUsageRecordInput>;
