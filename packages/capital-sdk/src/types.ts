// @mcv/capital-sdk/types — canonical domain types.
// Mirrors migration-capital.sql enum vocabularies exactly.

import { z } from 'zod';

// ─── Enums ──────────────────────────────────────────────────────────────

export const ContactType = z.enum([
  'prospect', 'angel', 'vc', 'lp', 'institutional',
  'strategic_partner', 'advisor', 'key_person',
  'transfer_agent', 'legal', 'service_provider',
]);
export type ContactType = z.infer<typeof ContactType>;

export const ContactStage = z.enum([
  'cold', 'warm', 'engaged', 'soft_commit', 'due_diligence',
  'signed', 'funded', 'active_investor', 'churned', 'dormant',
]);
export type ContactStage = z.infer<typeof ContactStage>;

export const OrgType = z.enum([
  'vc_fund', 'family_office', 'angel_group', 'sovereign_wealth',
  'pension_fund', 'corporate', 'accelerator', 'government',
  'exchange', 'transfer_agent', 'law_firm', 'accounting_firm',
  'startup', 'other',
]);
export type OrgType = z.infer<typeof OrgType>;

export const RoundType = z.enum([
  'safe', 'convertible_note', 'priced_equity',
  'token_sale', 'token_presale', 'rwa_tranche',
  'hybrid_equity_token', 'crowdfund_reg_cf', 'crowdfund_reg_d',
  'crowdfund_mi_45', 'revenue_share',
]);
export type RoundType = z.infer<typeof RoundType>;

export const RaiseLane = z.enum(['token', 'equity', 'hybrid']);
export type RaiseLane = z.infer<typeof RaiseLane>;

export const RoundStatus = z.enum([
  'draft', 'preview', 'open', 'closing', 'closed', 'funded', 'cancelled',
]);
export type RoundStatus = z.infer<typeof RoundStatus>;

export const CommitmentStatus = z.enum([
  'interest', 'soft_commit', 'reserved', 'pending_docs',
  'signed', 'pending_wire', 'funded',
  'token_pending', 'token_distributed',
  'refunded', 'withdrawn',
]);
export type CommitmentStatus = z.infer<typeof CommitmentStatus>;

export const PaymentMethod = z.enum([
  'wire_usd', 'wire_cad', 'wire_eur', 'wire_gbp', 'ach',
  'crypto_usdc', 'crypto_usdt', 'crypto_sol', 'crypto_eth', 'crypto_btc',
  'edge_token', 'check', 'other',
]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const AccreditationStatus = z.enum([
  'unknown', 'not_accredited', 'self_certified', 'verified_accredited',
  'qualified_purchaser', 'institutional', 'exempt',
]);
export type AccreditationStatus = z.infer<typeof AccreditationStatus>;

export const KycStatus = z.enum([
  'not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired',
]);
export type KycStatus = z.infer<typeof KycStatus>;

export const RegulatoryFramework = z.enum([
  'reg_d_506c', 'reg_d_506b', 'reg_cf', 'reg_a', 'reg_s',
  'mi_45_110', 'mi_45_106', 'token_utility', 'token_security',
  'exempt', 'other',
]);
export type RegulatoryFramework = z.infer<typeof RegulatoryFramework>;

export const WalletChain = z.enum(['solana', 'ethereum', 'polygon', 'base']);
export type WalletChain = z.infer<typeof WalletChain>;

export const DocumentType = z.enum([
  'term_sheet', 'safe', 'convertible_note', 'subscription_agreement',
  'side_letter', 'quarterly_update', 'annual_report',
  'pitch_deck', 'financial_model', 'legal_opinion',
  'form_45_106f9', 'om', 'om_delivery', 'signed_agreement',
  'nda', 'tax_form', 'other',
]);
export type DocumentType = z.infer<typeof DocumentType>;

export const ActivityType = z.enum([
  'email', 'call', 'meeting', 'note',
  'portal_view', 'portal_login', 'doc_sent', 'doc_signed',
  'payment_received', 'payment_sent', 'status_change',
  'token_distributed', 'enrichment', 'system',
]);
export type ActivityType = z.infer<typeof ActivityType>;

// ─── Allowed status transitions (pure domain rule) ──────────────────────

export const ROUND_STATUS_TRANSITIONS: Record<RoundStatus, RoundStatus[]> = {
  draft:     ['preview', 'open', 'cancelled'],
  preview:   ['open', 'draft', 'cancelled'],
  open:      ['closing', 'closed', 'cancelled'],
  closing:   ['closed', 'open', 'cancelled'],
  closed:    ['funded', 'cancelled'],
  funded:    [],
  cancelled: [],
};

export const COMMITMENT_STATUS_TRANSITIONS: Record<CommitmentStatus, CommitmentStatus[]> = {
  interest:           ['soft_commit', 'withdrawn'],
  soft_commit:        ['reserved', 'pending_docs', 'withdrawn'],
  reserved:           ['pending_docs', 'soft_commit', 'withdrawn'],
  pending_docs:       ['signed', 'reserved', 'withdrawn'],
  signed:             ['pending_wire', 'funded', 'refunded'],
  pending_wire:       ['funded', 'refunded'],
  funded:             ['token_pending', 'token_distributed', 'refunded'],
  token_pending:      ['token_distributed', 'refunded'],
  token_distributed:  ['refunded'],
  refunded:           [],
  withdrawn:          [],
};

export function canTransitionRound(from: RoundStatus, to: RoundStatus): boolean {
  return ROUND_STATUS_TRANSITIONS[from].includes(to);
}

export function canTransitionCommitment(from: CommitmentStatus, to: CommitmentStatus): boolean {
  return COMMITMENT_STATUS_TRANSITIONS[from].includes(to);
}

// ─── Core record types ──────────────────────────────────────────────────

export interface Organization {
  id: string;
  ventureId: string;
  name: string;
  legalName: string | null;
  slug: string;
  website: string | null;
  logoUrl: string | null;
  description: string | null;
  orgType: OrgType;
  industry: string | null;
  headquarters: string | null;
  jurisdiction: string | null;
  employeeCount: string | null;
  foundedYear: number | null;
  aum: number | null;
  typicalCheckSize: string | null;
  investmentFocus: string[];
  investmentStage: string[];
  isRaisingProject: boolean;
  projectStatus: string | null;
  totalContactCount: number;
  totalCommittedUsd: number;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface InvestorProfile {
  contactId: string;
  ventureId: string;
  organizationId: string | null;
  contactType: ContactType;
  stage: ContactStage;
  jobTitle: string | null;
  relationshipOwner: string | null;
  lastTouchDate: string | null;
  lastTouchType: string | null;
  nextFollowUp: string | null;
  accreditationStatus: AccreditationStatus;
  accreditationExpiry: string | null;
  kycStatus: KycStatus;
  kycCompletedAt: string | null;
  jurisdiction: string | null;
  walletAddress: string | null;
  walletChain: WalletChain | null;
  portalEnabled: boolean;
  portalUserId: string | null;
  portalLastLogin: string | null;
  leadScore: number;
  totalCommittedUsd: number;
  totalFundedUsd: number;
  source: string | null;
  referredBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Round {
  id: string;
  ventureId: string;
  name: string;
  slug: string;
  description: string | null;
  roundType: RoundType;
  raiseLane: RaiseLane;
  status: RoundStatus;
  targetRaise: number;
  hardCap: number | null;
  softCap: number | null;
  minimumCheck: number;
  maximumCheck: number | null;
  currency: string;
  preMoneyValuation: number | null;
  postMoneyValuation: number | null;
  pricePerShare: number | null;
  pricePerToken: number | null;
  sharesAvailable: number | null;
  tokensAvailable: number | null;
  valuationCap: number | null;
  discountRate: number | null;
  interestRate: number | null;
  vestingSchedule: string | null;
  tokenWarrantRatio: number | null;
  totalCommitted: number;
  totalFunded: number;
  totalInvestors: number;
  allocationRemaining: number | null;
  openDate: string | null;
  closeDate: string | null;
  fundingDeadline: string | null;
  regulatoryFramework: RegulatoryFramework | null;
  accreditedOnly: boolean;
  jurisdictionRestrictions: string[];
  maxInvestors: number | null;
  termSheetUrl: string | null;
  safeTemplateUrl: string | null;
  subscriptionAgreementUrl: string | null;
  pitchDeckUrl: string | null;
  dataRoomUrl: string | null;
  isPublic: boolean;
  publicPageSlug: string | null;
  featuredOrder: number | null;
  tokenMintAddress: string | null;
  tokenSymbol: string | null;
  tokenDecimals: number | null;
  vestingContractAddress: string | null;
  escrowType: string | null;
  escrowAccountId: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Commitment {
  id: string;
  ventureId: string;
  contactId: string;
  roundId: string;
  organizationId: string | null;
  status: CommitmentStatus;
  amount: number;
  currency: string;
  amountUsd: number;
  sharesAllocated: number | null;
  ownershipPct: number | null;
  tokensAllocated: number | null;
  tokenPriceAtCommit: number | null;
  walletAddress: string | null;
  equityComponent: number | null;
  tokenWarrantComponent: number | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  paymentReceivedAt: string | null;
  docusignEnvelopeId: string | null;
  docusignStatus: string | null;
  signedAt: string | null;
  documentUrls: string[];
  interestExpressedAt: string | null;
  softCommittedAt: string | null;
  reservedAt: string | null;
  fundedAt: string | null;
  distributedAt: string | null;
  notes: string | null;
  internalNotes: string | null;
  source: string | null;
  referralContactId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Activity {
  id: string;
  ventureId: string;
  contactId: string | null;
  organizationId: string | null;
  roundId: string | null;
  commitmentId: string | null;
  activityType: ActivityType;
  title: string;
  description: string | null;
  previousValue: string | null;
  newValue: string | null;
  actorId: string | null;
  actorType: 'user' | 'system' | 'naos' | 'investor' | 'webhook';
  metadata: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export interface CapitalDocument {
  id: string;
  ventureId: string;
  roundId: string | null;
  commitmentId: string | null;
  contactId: string | null;
  name: string;
  documentType: DocumentType;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  isInvestorVisible: boolean;
  requiresNda: boolean;
  version: number;
  previousVersionId: string | null;
  uploadedBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// ─── Insert / Update input schemas (Zod) ────────────────────────────────

export const CreateRoundInput = z.object({
  ventureId: z.string().min(1),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional().nullable(),
  roundType: RoundType,
  raiseLane: RaiseLane.default('equity'),
  targetRaise: z.number().positive(),
  hardCap: z.number().positive().optional().nullable(),
  softCap: z.number().positive().optional().nullable(),
  minimumCheck: z.number().min(0).default(0),
  maximumCheck: z.number().positive().optional().nullable(),
  currency: z.string().default('USD'),
  preMoneyValuation: z.number().positive().optional().nullable(),
  valuationCap: z.number().positive().optional().nullable(),
  discountRate: z.number().min(0).max(100).optional().nullable(),
  interestRate: z.number().min(0).max(100).optional().nullable(),
  vestingSchedule: z.string().optional().nullable(),
  openDate: z.string().optional().nullable(),
  closeDate: z.string().optional().nullable(),
  fundingDeadline: z.string().optional().nullable(),
  regulatoryFramework: RegulatoryFramework.optional().nullable(),
  accreditedOnly: z.boolean().default(false),
  jurisdictionRestrictions: z.array(z.string()).default([]),
  maxInvestors: z.number().int().positive().optional().nullable(),
  termSheetUrl: z.string().optional().nullable(),
  safeTemplateUrl: z.string().optional().nullable(),
  subscriptionAgreementUrl: z.string().optional().nullable(),
  pitchDeckUrl: z.string().optional().nullable(),
  dataRoomUrl: z.string().optional().nullable(),
  isPublic: z.boolean().default(false),
  publicPageSlug: z.string().optional().nullable(),
  tokenSymbol: z.string().optional().nullable(),
  tokenDecimals: z.number().int().optional().nullable(),
  escrowType: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateRoundInput = z.infer<typeof CreateRoundInput>;

export const CreateCommitmentInput = z.object({
  ventureId: z.string().min(1),
  contactId: z.string().uuid(),
  roundId: z.string().uuid(),
  organizationId: z.string().uuid().optional().nullable(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  amountUsd: z.number().positive(),
  status: CommitmentStatus.default('interest'),
  paymentMethod: PaymentMethod.optional().nullable(),
  walletAddress: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateCommitmentInput = z.infer<typeof CreateCommitmentInput>;

export const CreateOrganizationInput = z.object({
  ventureId: z.string().min(1),
  name: z.string().min(1).max(500),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  legalName: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  orgType: OrgType.default('other'),
  industry: z.string().optional().nullable(),
  headquarters: z.string().optional().nullable(),
  jurisdiction: z.string().optional().nullable(),
  aum: z.number().optional().nullable(),
  typicalCheckSize: z.string().optional().nullable(),
  investmentFocus: z.array(z.string()).default([]),
  investmentStage: z.array(z.string()).default([]),
  isRaisingProject: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationInput>;

export const UpsertInvestorProfileInput = z.object({
  contactId: z.string().uuid(),
  ventureId: z.string().min(1),
  organizationId: z.string().uuid().optional().nullable(),
  contactType: ContactType.default('prospect'),
  stage: ContactStage.default('cold'),
  jobTitle: z.string().optional().nullable(),
  relationshipOwner: z.string().optional().nullable(),
  accreditationStatus: AccreditationStatus.default('unknown'),
  kycStatus: KycStatus.default('not_started'),
  jurisdiction: z.string().optional().nullable(),
  walletAddress: z.string().optional().nullable(),
  walletChain: WalletChain.optional().nullable(),
  portalEnabled: z.boolean().default(false),
  portalUserId: z.string().optional().nullable(),
  leadScore: z.number().int().min(0).max(100).default(0),
  source: z.string().optional().nullable(),
  referredBy: z.string().uuid().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type UpsertInvestorProfileInput = z.infer<typeof UpsertInvestorProfileInput>;

export const CreateDocumentInput = z.object({
  ventureId: z.string().min(1),
  roundId: z.string().uuid().optional().nullable(),
  commitmentId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(500),
  documentType: DocumentType,
  fileUrl: z.string(),
  fileSize: z.number().int().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  isInvestorVisible: z.boolean().default(false),
  requiresNda: z.boolean().default(false),
  uploadedBy: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateDocumentInput = z.infer<typeof CreateDocumentInput>;

export const CreateActivityInput = z.object({
  ventureId: z.string().min(1),
  contactId: z.string().uuid().optional().nullable(),
  organizationId: z.string().uuid().optional().nullable(),
  roundId: z.string().uuid().optional().nullable(),
  commitmentId: z.string().uuid().optional().nullable(),
  activityType: ActivityType,
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  previousValue: z.string().optional().nullable(),
  newValue: z.string().optional().nullable(),
  actorId: z.string().optional().nullable(),
  actorType: z.enum(['user', 'system', 'naos', 'investor', 'webhook']).default('user'),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateActivityInput = z.infer<typeof CreateActivityInput>;

// ─── Dashboard types ────────────────────────────────────────────────────

export interface GlobalSummary {
  totalRaisedUsd: number;
  totalCommittedUsd: number;
  activeRounds: number;
  totalInvestors: number;
  pipelineFunnel: Record<ContactStage, number>;
  topInvestors: Array<{
    contactId: string;
    name: string;
    organizationName: string | null;
    totalCommittedUsd: number;
    ventureCount: number;
  }>;
  recentActivity: Activity[];
}

export interface VentureSummary {
  ventureId: string;
  totalRaisedUsd: number;
  totalCommittedUsd: number;
  activeRoundsCount: number;
  investorCount: number;
  recentActivity: Activity[];
  rounds: Round[];
}
