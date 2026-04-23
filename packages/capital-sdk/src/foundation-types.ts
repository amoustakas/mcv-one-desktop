// @mcv/capital-sdk/foundation-types — the five-tuple primitive types.
//
// Treasury + DistributionConfig + ComplianceRuleSet + RoyaltyGraph +
// LegalEntity + AlgorithmicRule + DistributionLeg + CapitalFlow.
//
// Schema: supabase/migration-capital-foundation.sql
// Plan:   C:\Users\moust\.claude\plans\luminous-mapping-globe.md
//
// These types are the contract every venture reads/writes against. Services
// that CRUD these rows live alongside this file (treasury-service.ts,
// compliance-service.ts, royalty-service.ts, etc.) in follow-up PRs.

import { z } from 'zod';

// ─── CapitalFlow — the 16-kind taxonomy ─────────────────────────────────

export const CapitalFlow = z.enum([
  're_precon_deposit',
  're_construction_draw',
  're_yield_distribution',
  're_capital_call',
  'startup_equity_crowdfund',
  'startup_safe_presale',
  'token_presale',
  'token_tge_launch',
  'token_liquidity_provision',
  'royalty_payout',
  'referral_reward',
  'quest_reward',
  'engagement_payout',
  'vendor_bill',
  'platform_fee_split',
  'ip_filing_expense',
]);
export type CapitalFlow = z.infer<typeof CapitalFlow>;

// ─── LegalEntity ────────────────────────────────────────────────────────

export const LegalEntityType = z.enum([
  'corporation', 'llc', 'gp', 'lp', 'trust', 'foundation', 'dao', 'other',
]);
export type LegalEntityType = z.infer<typeof LegalEntityType>;

export const LegalEntity = z.object({
  id: z.string(),
  label: z.string(),
  jurisdiction: z.string(),           // 'CA-ON', 'US-DE', 'CAYMAN', 'SG', 'EU'
  entityType: LegalEntityType,
  parentEntityId: z.string().nullable(),
  registrationNumber: z.string().nullable(),
  taxId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  active: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LegalEntity = z.infer<typeof LegalEntity>;

// ─── Treasury ───────────────────────────────────────────────────────────

export const TreasuryKind = z.enum([
  'stripe_connect', 'wallet_custodial', 'wallet_self', 'bank_ach',
  'spl_token', 'erc20', 'multi_sig', 'trust_account', 'escrow', 'other',
]);
export type TreasuryKind = z.infer<typeof TreasuryKind>;

export const TreasuryBalance = z.object({
  currency: z.string(),
  amount: z.number(),
  lastSyncedAt: z.string(),
});
export type TreasuryBalance = z.infer<typeof TreasuryBalance>;

export const TreasuryPolicy = z.object({
  autoExecute: z.boolean().optional(),
  manualApprovalAboveBps: z.number().optional(),
  maxDailyPayoutUsd: z.number().optional(),
  signers: z.array(z.string()).optional(),
}).partial();
export type TreasuryPolicy = z.infer<typeof TreasuryPolicy>;

export const Treasury = z.object({
  id: z.string(),
  ventureId: z.string(),
  label: z.string(),
  kind: TreasuryKind,
  jurisdiction: z.string(),
  currency: z.string(),
  stripeAccountId: z.string().nullable(),
  walletAddress: z.string().nullable(),
  chain: z.string().nullable(),
  custodian: z.string().nullable(),
  ownerEntityId: z.string().nullable(),
  ownerUserId: z.string().nullable(),
  balanceCache: z.array(TreasuryBalance).default([]),
  policy: TreasuryPolicy.default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
  active: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Treasury = z.infer<typeof Treasury>;

// ─── Compliance ─────────────────────────────────────────────────────────

export const ComplianceRuleType = z.enum([
  'hold_period', 'accreditation_min', 'jurisdiction_allowlist', 'jurisdiction_blocklist',
  'ofac', 'aml_score_max', 'age_min', 'investment_cap_per_investor',
  'wager_limit_daily', 'responsible_gaming', 'cooling_off_period',
  'max_token_alloc_per_wallet', 'reg_cf_annual_cap', 'reg_d_verification',
  'vpn_block', 'time_window', 'other',
]);
export type ComplianceRuleType = z.infer<typeof ComplianceRuleType>;

export const ComplianceScope = z.enum([
  'intake', 'distribution', 'withdrawal', 'admit', 'wager', 'transfer',
]);
export type ComplianceScope = z.infer<typeof ComplianceScope>;

export const ComplianceRuleSet = z.object({
  id: z.string(),
  ventureId: z.string(),
  label: z.string(),
  jurisdiction: z.string(),
  description: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  active: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ComplianceRuleSet = z.infer<typeof ComplianceRuleSet>;

export const ComplianceRule = z.object({
  id: z.string(),
  ruleSetId: z.string(),
  ruleType: ComplianceRuleType,
  scope: ComplianceScope,
  config: z.record(z.string(), z.unknown()).default({}),
  priority: z.number().default(100),
  active: z.boolean().default(true),
  effectiveAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ComplianceRule = z.infer<typeof ComplianceRule>;

export const ComplianceDecision = z.enum(['allow', 'review', 'block']);
export type ComplianceDecision = z.infer<typeof ComplianceDecision>;

export interface ComplianceEvaluation {
  decision: ComplianceDecision;
  reasons: Array<{ ruleId: string; ruleType: ComplianceRuleType; message: string }>;
}

// ─── Royalty graph ──────────────────────────────────────────────────────

export const RoyaltyGraph = z.object({
  id: z.string(),
  ventureId: z.string(),
  label: z.string(),
  version: z.number().default(1),
  effectiveAt: z.string(),
  supersededAt: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string(),
});
export type RoyaltyGraph = z.infer<typeof RoyaltyGraph>;

export const RoyaltyRecipientType = z.enum([
  'treasury', 'user', 'external_entity', 'pool',
]);
export type RoyaltyRecipientType = z.infer<typeof RoyaltyRecipientType>;

export const RoyaltyLayerKind = z.enum([
  'platform_rake', 'venture_rake', 'ip_royalty', 'affiliate',
  'creator_share', 'reserve', 'burn', 'fee_split', 'other',
]);
export type RoyaltyLayerKind = z.infer<typeof RoyaltyLayerKind>;

export const RoyaltyGraphLayer = z.object({
  id: z.string(),
  graphId: z.string(),
  sequence: z.number(),
  label: z.string(),
  recipientType: RoyaltyRecipientType,
  recipientId: z.string(),
  bps: z.number().min(0).max(10000),
  kind: RoyaltyLayerKind,
  conditionExpr: z.string().nullable(),
  jurisdiction: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type RoyaltyGraphLayer = z.infer<typeof RoyaltyGraphLayer>;

// ─── DistributionConfig ─────────────────────────────────────────────────

export const BillingMode = z.enum([
  'immediate_on_committed', 'admin_batch', 'threshold',
  'manual', 'milestone', 'scheduled',
]);
export type BillingMode = z.infer<typeof BillingMode>;

export const PayeeStrategy = z.enum([
  'property_spv', 'platform_treasury', 'sponsor_manager',
  'custom_vendor', 'split', 'algorithmic',
]);
export type PayeeStrategy = z.infer<typeof PayeeStrategy>;

export const DistributionScopeType = z.enum([
  'venture', 'property', 'round', 'collection', 'quest', 'creator', 'custom',
]);
export type DistributionScopeType = z.infer<typeof DistributionScopeType>;

export const SplitRule = z.object({
  role: z.string(),                     // 'sponsor', 'platform', 'reserve', 'referrer', 'creator'
  bps: z.number().min(0).max(10000),
  recipientType: RoyaltyRecipientType.optional(),
  recipientId: z.string().optional(),
});
export type SplitRule = z.infer<typeof SplitRule>;

export const FxPolicy = z.object({
  provider: z.enum(['stripe-fx', 'coinbase', 'fixed-rate', 'other']).optional(),
  slippageBps: z.number().optional(),
  lockWindowSec: z.number().optional(),
  fixedRate: z.number().optional(),
}).partial();
export type FxPolicy = z.infer<typeof FxPolicy>;

export const MilestoneStep = z.object({
  pct: z.number().min(0).max(100),
  trigger: z.string(),                  // 'foundation_complete', 'framing_complete', 'occupancy'
  requiresAttestation: z.boolean().optional(),
});
export type MilestoneStep = z.infer<typeof MilestoneStep>;

export const MilestoneSpec = z.object({
  milestones: z.array(MilestoneStep),
});
export type MilestoneSpec = z.infer<typeof MilestoneSpec>;

export const DistributionConfig = z.object({
  id: z.string(),
  ventureId: z.string(),
  flowKind: CapitalFlow,
  scopeType: DistributionScopeType.default('venture'),
  scopeId: z.string().nullable(),
  billingMode: BillingMode,
  billingThresholdBps: z.number().nullable(),
  billingSchedule: z.string().nullable(),
  milestoneSpec: MilestoneSpec.nullable(),
  defaultPayeeStrategy: PayeeStrategy,
  splitRules: z.array(SplitRule).nullable(),
  algorithmicRuleId: z.string().nullable(),
  defaultCurrency: z.string().default('CAD'),
  allowedCurrencies: z.array(z.string()).default(['CAD', 'USD']),
  fxPolicy: FxPolicy.default({}),
  royaltyGraphId: z.string().nullable(),
  complianceRuleSetId: z.string().nullable(),
  treasuryId: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  active: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type DistributionConfig = z.infer<typeof DistributionConfig>;

// ─── AlgorithmicRule ────────────────────────────────────────────────────

export const AlgorithmicRuleKind = z.enum([
  'token_economy', 'engagement_pool', 'fx_rebalancer',
  'quest_issuance', 'social_boost', 'referral_tier', 'other',
]);
export type AlgorithmicRuleKind = z.infer<typeof AlgorithmicRuleKind>;

export const AlgorithmicRule = z.object({
  id: z.string(),
  ventureId: z.string(),
  label: z.string(),
  kind: AlgorithmicRuleKind,
  version: z.number().default(1),
  spec: z.record(z.string(), z.unknown()),
  active: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AlgorithmicRule = z.infer<typeof AlgorithmicRule>;

// ─── DistributionLeg ────────────────────────────────────────────────────

export const DistributionLegRecipientType = z.enum([
  'investor', 'vendor', 'platform', 'reserve', 'royalty_holder',
  'creator', 'referrer', 'referee', 'liquidity_pool', 'external',
]);
export type DistributionLegRecipientType = z.infer<typeof DistributionLegRecipientType>;

export const DistributionLegStatus = z.enum([
  'pending', 'sent', 'settled', 'failed', 'no_account', 'held_compliance', 'cancelled',
]);
export type DistributionLegStatus = z.infer<typeof DistributionLegStatus>;

export const FxConvertedFrom = z.object({
  amount: z.number(),
  currency: z.string(),
  rate: z.number(),
});
export type FxConvertedFrom = z.infer<typeof FxConvertedFrom>;

export const DistributionLeg = z.object({
  id: z.string(),
  distributionId: z.string(),
  recipientType: DistributionLegRecipientType,
  recipientId: z.string(),
  royaltyLayerId: z.string().nullable(),
  amount: z.number().min(0),
  currency: z.string(),
  fxConvertedFrom: FxConvertedFrom.nullable(),
  status: DistributionLegStatus.default('pending'),
  stripeTransferId: z.string().nullable(),
  txHash: z.string().nullable(),
  idempotencyKey: z.string().nullable(),
  settledAt: z.string().nullable(),
  failureReason: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type DistributionLeg = z.infer<typeof DistributionLeg>;

// ─── Venture extensions ─────────────────────────────────────────────────
// (existing Venture row + new columns added in migration)

export const LaunchStage = z.enum([
  'concept', 'prototype', 'alpha', 'beta', 'ga', 'sunset',
]);
export type LaunchStage = z.infer<typeof LaunchStage>;

export const VentureFoundation = z.object({
  ownerEntityId: z.string().nullable(),
  defaultTreasuryId: z.string().nullable(),
  defaultRoyaltyGraphId: z.string().nullable(),
  tokenSymbol: z.string().nullable(),
  launchStage: LaunchStage.nullable(),
  ipRegistry: z.record(z.string(), z.unknown()).nullable(),
});
export type VentureFoundation = z.infer<typeof VentureFoundation>;

// ─── Re-export helpers ──────────────────────────────────────────────────

export const FOUNDATION_CAPITAL_FLOWS = CapitalFlow.options;
export const FOUNDATION_BILLING_MODES = BillingMode.options;
export const FOUNDATION_PAYEE_STRATEGIES = PayeeStrategy.options;
export const FOUNDATION_TREASURY_KINDS = TreasuryKind.options;
export const FOUNDATION_COMPLIANCE_RULE_TYPES = ComplianceRuleType.options;
export const FOUNDATION_ROYALTY_LAYER_KINDS = RoyaltyLayerKind.options;
