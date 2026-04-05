// src/lib/creator/types.ts
// Creator Economy — Royalties, Escrow, Transaction Intelligence
// MCV Commerce & Financial OS — Sections 7, 8, 9

import { z } from 'zod';

// ─────────────────────────────────────────────────────────
// PARTY REF (payer / payee)
// ─────────────────────────────────────────────────────────

export const PartyRefSchema = z.object({
  id: z.string(),
  type: z.enum(['user', 'venture', 'organization', 'external', 'platform']),
  name: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
});
export type PartyRef = z.infer<typeof PartyRefSchema>;

// ─────────────────────────────────────────────────────────
// ROYALTIES
// ─────────────────────────────────────────────────────────

export const RoyaltySplitSchema = z.object({
  recipientId: z.string(),
  recipientType: z.enum(['creator', 'collaborator', 'label', 'publisher', 'platform', 'charity']),
  percentage: z.number().min(0).max(100),
  description: z.string().nullable().default(null),
});
export type RoyaltySplit = z.infer<typeof RoyaltySplitSchema>;

export const RoyaltyTypeEnum = z.enum([
  'fixed_percentage',
  'tiered',
  'perpetual',
  'time_limited',
]);
export type RoyaltyType = z.infer<typeof RoyaltyTypeEnum>;

export const PayoutFrequencyEnum = z.enum(['instant', 'daily', 'weekly', 'monthly', 'manual']);
export type PayoutFrequency = z.infer<typeof PayoutFrequencyEnum>;

export const TransparencyLevelEnum = z.enum(['public', 'participants_only', 'private']);
export type TransparencyLevel = z.infer<typeof TransparencyLevelEnum>;

export const CreatorRoyaltyConfigSchema = z.object({
  creatorId: z.string(),
  royaltyType: RoyaltyTypeEnum,
  splits: z.array(RoyaltySplitSchema).min(1),
  resaleRoyalty: z.number().min(0).max(100).default(0), // % on secondary / resale
  minimumPayout: z.number().min(0).default(0),
  payoutFrequency: PayoutFrequencyEnum.default('monthly'),
  transparencyLevel: TransparencyLevelEnum.default('participants_only'),
});
export type CreatorRoyaltyConfig = z.infer<typeof CreatorRoyaltyConfigSchema>;

export const CreateRoyaltyAgreementInputSchema = CreatorRoyaltyConfigSchema.extend({
  ventureId: z.string(),
  productId: z.string().uuid(),
});
export type CreateRoyaltyAgreementInput = z.infer<typeof CreateRoyaltyAgreementInputSchema>;

export interface RoyaltyAgreement {
  id: string;
  ventureId: string;
  productId: string;
  creatorId: string;
  royaltyType: RoyaltyType;
  splits: RoyaltySplit[];
  resaleRoyalty: number;
  minimumPayout: number;
  payoutFrequency: PayoutFrequency;
  transparencyLevel: TransparencyLevel;
  status: 'active' | 'paused' | 'terminated';
  createdAt: string;
}

export const RoyaltyDistributionSplitSchema = z.object({
  recipientId: z.string(),
  recipientType: z.string(),
  percentage: z.number(),
  amount: z.number(),
  journalEntryId: z.string().nullable().default(null),
});
export type RoyaltyDistributionSplit = z.infer<typeof RoyaltyDistributionSplitSchema>;

export interface RoyaltyDistribution {
  id: string;
  agreementId: string;
  transactionId: string;
  totalAmount: number;
  splits: RoyaltyDistributionSplit[];
  status: 'pending' | 'processing' | 'distributed' | 'failed';
  journalEntryId: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────
// ESCROW
// ─────────────────────────────────────────────────────────

export const EscrowStatusEnum = z.enum([
  'pending_funding',
  'funded',
  'in_progress',
  'pending_release',
  'released',
  'disputed',
  'refunded',
  'canceled',
]);
export type EscrowStatus = z.infer<typeof EscrowStatusEnum>;

export const EscrowReleaseConditionEnum = z.enum([
  'buyer_confirms',
  'milestone_complete',
  'time_based',
  'dual_approval',
]);
export type EscrowReleaseCondition = z.infer<typeof EscrowReleaseConditionEnum>;

export const EscrowMilestoneStatusEnum = z.enum([
  'pending',
  'submitted',
  'approved',
  'rejected',
]);
export type EscrowMilestoneStatus = z.infer<typeof EscrowMilestoneStatusEnum>;

export const EscrowMilestoneSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().nullable().default(null),
  amount: z.number().positive(),
  status: EscrowMilestoneStatusEnum.default('pending'),
  dueDate: z.string().date().nullable().default(null),
  submittedAt: z.string().datetime().nullable().default(null),
  approvedAt: z.string().datetime().nullable().default(null),
  evidence: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
});
export type EscrowMilestone = z.infer<typeof EscrowMilestoneSchema>;

export const CreateEscrowMilestoneInputSchema = EscrowMilestoneSchema.omit({
  id: true,
  status: true,
  submittedAt: true,
  approvedAt: true,
  createdAt: true,
  evidence: true,
});
export type CreateEscrowMilestoneInput = z.infer<typeof CreateEscrowMilestoneInputSchema>;

export const CreateEscrowAgreementInputSchema = z.object({
  ventureId: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  amount: z.number().positive(),
  currency: z.string().min(2).max(10).default('USD'),
  releaseCondition: EscrowReleaseConditionEnum.default('buyer_confirms'),
  expiresAt: z.string().datetime().nullable().default(null),
  milestones: z.array(CreateEscrowMilestoneInputSchema).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateEscrowAgreementInput = z.infer<typeof CreateEscrowAgreementInputSchema>;

export interface EscrowAgreement {
  id: string;
  ventureId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  milestones: EscrowMilestone[];
  escrowAccountId: string | null;
  releaseCondition: EscrowReleaseCondition;
  expiresAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────
// TRANSACTION INTELLIGENCE
// ─────────────────────────────────────────────────────────

export const TransactionTypeEnum = z.enum([
  'purchase',
  'subscription_renewal',
  'refund',
  'credit_grant',
  'credit_consume',
  'transfer',
  'payout',
  'royalty_distribution',
  'yield_distribution',
  'escrow_hold',
  'escrow_release',
]);
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

export const TransactionStatusEnum = z.enum([
  'initiated',
  'processing',
  'succeeded',
  'failed',
  'refunded',
  'disputed',
  'settled',
]);
export type TransactionStatus = z.infer<typeof TransactionStatusEnum>;

export const TransactionFeeSchema = z.object({
  type: z.enum(['platform_fee', 'processor_fee', 'network_fee', 'tax', 'other']),
  amount: z.number().min(0),
  currency: z.string().min(2).max(10).default('USD'),
  description: z.string().nullable().default(null),
});
export type TransactionFee = z.infer<typeof TransactionFeeSchema>;

export const RelatedRecordSchema = z.object({
  type: z.string(), // 'order', 'subscription', 'invoice', 'escrow', etc.
  id: z.string(),
  relationship: z.enum([
    'caused_by',
    'refunds',
    'reversal_of',
    'part_of',
    'related_to',
    'escrow_for',
  ]),
  description: z.string().nullable().default(null),
});
export type RelatedRecord = z.infer<typeof RelatedRecordSchema>;

export const TransactionEventSchema = z.object({
  timestamp: z.string().datetime(),
  event: z.string(),
  actor: z.string().nullable().default(null), // userId or 'system'
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type TransactionEvent = z.infer<typeof TransactionEventSchema>;

export const CreateTransactionRecordInputSchema = z.object({
  ventureId: z.string(),
  type: TransactionTypeEnum,
  status: TransactionStatusEnum.default('initiated'),
  timestamp: z.string().datetime(),
  payer: PartyRefSchema,
  payee: PartyRefSchema,
  amount: z.number().min(0),
  currency: z.string().min(2).max(10).default('USD'),
  fees: z.array(TransactionFeeSchema).default([]),
  rail: z.string().nullable().default(null),
  routingDecisionId: z.string().uuid().nullable().default(null),
  costSaved: z.number().min(0).nullable().default(null),
  relatedRecords: z.array(RelatedRecordSchema).default([]),
  categories: z.array(z.string()).default([]),
  events: z.array(TransactionEventSchema).default([]),
  accessUrl: z.string().nullable().default(null),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateTransactionRecordInput = z.infer<typeof CreateTransactionRecordInputSchema>;

export interface TransactionRecord {
  id: string;
  ventureId: string;
  transactionNumber: string; // TXN-2026-04-000001
  type: TransactionType;
  status: TransactionStatus;
  timestamp: string;
  payer: PartyRef;
  payee: PartyRef;
  amount: number;
  currency: string;
  fees: TransactionFee[];
  netAmount: number;
  rail: string | null;
  routingDecisionId: string | null;
  costSaved: number | null;
  relatedRecords: RelatedRecord[];
  categories: string[];
  events: TransactionEvent[];
  accessUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export const TransactionSearchFiltersSchema = z.object({
  type: TransactionTypeEnum.optional(),
  status: TransactionStatusEnum.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  amountMin: z.number().min(0).optional(),
  amountMax: z.number().min(0).optional(),
  customerId: z.string().optional(),
  rail: z.string().optional(),
  query: z.string().optional(), // full-text search
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});
export type TransactionSearchFilters = z.infer<typeof TransactionSearchFiltersSchema>;

// ─────────────────────────────────────────────────────────
// REVENUE SHARING & AFFILIATES
// ─────────────────────────────────────────────────────────

export const RevenueSharingTypeEnum = z.enum(['affiliate', 'referral', 'reseller']);
export type RevenueSharingType = z.infer<typeof RevenueSharingTypeEnum>;

export const CommissionStructureSchema = z.object({
  type: z.enum(['percentage', 'flat', 'tiered']),
  value: z.number().min(0),
  tiers: z.array(z.object({
    minRevenue: z.number().min(0),
    maxRevenue: z.number().min(0).nullable().default(null),
    commissionPercent: z.number().min(0).max(100),
  })).optional(),
  cookieDurationDays: z.number().int().positive().default(30),
});
export type CommissionStructure = z.infer<typeof CommissionStructureSchema>;

export interface RevenueSharingProgram {
  id: string;
  ventureId: string;
  name: string;
  type: RevenueSharingType;
  commissionStructure: CommissionStructure;
  status: 'active' | 'paused' | 'terminated';
  createdAt: string;
}

export interface AffiliatePartner {
  id: string;
  programId: string;
  userId: string;
  referralCode: string;
  totalReferrals: number;
  totalRevenue: number;
  totalCommissions: number;
  pendingPayout: number;
  status: 'active' | 'paused' | 'terminated';
  createdAt: string;
}
