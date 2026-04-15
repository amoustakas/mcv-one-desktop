// @mcv/capital-sdk/rounds-service — round CRUD + status machine + waterfall.
//
// Totals (total_committed, total_funded, total_investors, allocation_remaining)
// are maintained by the SQL trigger `recompute_round_totals()`. We never
// write them from the service — always read-back after mutations.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CreateRoundInput,
  type Round,
  type RoundStatus,
  type RoundType,
  type RaiseLane,
  canTransitionRound,
} from './types';

export function mapRoundRow(row: Record<string, unknown>): Round {
  const asNum = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
  const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? null,
    roundType: row.round_type as RoundType,
    raiseLane: row.raise_lane as RaiseLane,
    status: row.status as RoundStatus,
    targetRaise: Number(row.target_raise),
    hardCap: asNum(row.hard_cap),
    softCap: asNum(row.soft_cap),
    minimumCheck: Number(row.minimum_check),
    maximumCheck: asNum(row.maximum_check),
    currency: row.currency as string,
    preMoneyValuation: asNum(row.pre_money_valuation),
    postMoneyValuation: asNum(row.post_money_valuation),
    pricePerShare: asNum(row.price_per_share),
    pricePerToken: asNum(row.price_per_token),
    sharesAvailable: asNum(row.shares_available),
    tokensAvailable: asNum(row.tokens_available),
    valuationCap: asNum(row.valuation_cap),
    discountRate: asNum(row.discount_rate),
    interestRate: asNum(row.interest_rate),
    vestingSchedule: (row.vesting_schedule as string) ?? null,
    tokenWarrantRatio: asNum(row.token_warrant_ratio),
    totalCommitted: Number(row.total_committed ?? 0),
    totalFunded: Number(row.total_funded ?? 0),
    totalInvestors: Number(row.total_investors ?? 0),
    allocationRemaining: asNum(row.allocation_remaining),
    openDate: (row.open_date as string) ?? null,
    closeDate: (row.close_date as string) ?? null,
    fundingDeadline: (row.funding_deadline as string) ?? null,
    regulatoryFramework: (row.regulatory_framework as Round['regulatoryFramework']) ?? null,
    accreditedOnly: Boolean(row.accredited_only),
    jurisdictionRestrictions: asArr<string>(row.jurisdiction_restrictions),
    maxInvestors: asNum(row.max_investors),
    termSheetUrl: (row.term_sheet_url as string) ?? null,
    safeTemplateUrl: (row.safe_template_url as string) ?? null,
    subscriptionAgreementUrl: (row.subscription_agreement_url as string) ?? null,
    pitchDeckUrl: (row.pitch_deck_url as string) ?? null,
    dataRoomUrl: (row.data_room_url as string) ?? null,
    isPublic: Boolean(row.is_public),
    publicPageSlug: (row.public_page_slug as string) ?? null,
    featuredOrder: asNum(row.featured_order),
    tokenMintAddress: (row.token_mint_address as string) ?? null,
    tokenSymbol: (row.token_symbol as string) ?? null,
    tokenDecimals: asNum(row.token_decimals),
    vestingContractAddress: (row.vesting_contract_address as string) ?? null,
    escrowType: (row.escrow_type as string) ?? null,
    escrowAccountId: (row.escrow_account_id as string) ?? null,
    tags: asArr<string>(row.tags),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string) ?? null,
  };
}

function buildInsertRow(input: CreateRoundInput): Record<string, unknown> {
  return {
    venture_id: input.ventureId,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    round_type: input.roundType,
    raise_lane: input.raiseLane,
    status: 'draft',
    target_raise: input.targetRaise,
    hard_cap: input.hardCap ?? null,
    soft_cap: input.softCap ?? null,
    minimum_check: input.minimumCheck,
    maximum_check: input.maximumCheck ?? null,
    currency: input.currency,
    pre_money_valuation: input.preMoneyValuation ?? null,
    valuation_cap: input.valuationCap ?? null,
    discount_rate: input.discountRate ?? null,
    interest_rate: input.interestRate ?? null,
    vesting_schedule: input.vestingSchedule ?? null,
    open_date: input.openDate ?? null,
    close_date: input.closeDate ?? null,
    funding_deadline: input.fundingDeadline ?? null,
    regulatory_framework: input.regulatoryFramework ?? null,
    accredited_only: input.accreditedOnly,
    jurisdiction_restrictions: input.jurisdictionRestrictions,
    max_investors: input.maxInvestors ?? null,
    term_sheet_url: input.termSheetUrl ?? null,
    safe_template_url: input.safeTemplateUrl ?? null,
    subscription_agreement_url: input.subscriptionAgreementUrl ?? null,
    pitch_deck_url: input.pitchDeckUrl ?? null,
    data_room_url: input.dataRoomUrl ?? null,
    is_public: input.isPublic,
    public_page_slug: input.publicPageSlug ?? null,
    token_symbol: input.tokenSymbol ?? null,
    token_decimals: input.tokenDecimals ?? null,
    escrow_type: input.escrowType ?? null,
    tags: input.tags,
    metadata: input.metadata,
  };
}

export interface ListRoundsFilters {
  status?: RoundStatus;
  roundType?: RoundType;
  raiseLane?: RaiseLane;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}

export interface RoundsService {
  createRound(input: CreateRoundInput): Promise<Round>;
  updateRound(id: string, ventureId: string, updates: Partial<CreateRoundInput>): Promise<Round>;
  getRound(id: string): Promise<Round | null>;
  getRoundBySlug(ventureId: string, slug: string): Promise<Round | null>;
  listRounds(ventureId: string, filters?: ListRoundsFilters): Promise<Round[]>;
  listAllRounds(filters?: ListRoundsFilters): Promise<Round[]>;  // cross-venture, for super-admin
  listPublicRounds(filters?: ListRoundsFilters): Promise<Round[]>;
  updateStatus(id: string, nextStatus: RoundStatus, actorId?: string): Promise<Round>;
  deleteRound(id: string): Promise<void>;
}

export interface RoundsServiceOptions {
  supabase: SupabaseClient | null;
}

export function createRoundsService({ supabase }: RoundsServiceOptions): RoundsService {
  return {
    async createRound(input) {
      if (!supabase) throw new Error('Supabase client not available');
      const validated = CreateRoundInput.parse(input);
      const { data, error } = await supabase
        .from('capital_rounds')
        .insert(buildInsertRow(validated))
        .select()
        .single();
      if (error) throw new Error(`Failed to create round: ${error.message}`);
      return mapRoundRow(data);
    },

    async updateRound(id, ventureId, updates) {
      if (!supabase) throw new Error('Supabase client not available');
      const row: Record<string, unknown> = {};
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.slug !== undefined) row.slug = updates.slug;
      if (updates.description !== undefined) row.description = updates.description;
      if (updates.targetRaise !== undefined) row.target_raise = updates.targetRaise;
      if (updates.hardCap !== undefined) row.hard_cap = updates.hardCap;
      if (updates.softCap !== undefined) row.soft_cap = updates.softCap;
      if (updates.minimumCheck !== undefined) row.minimum_check = updates.minimumCheck;
      if (updates.maximumCheck !== undefined) row.maximum_check = updates.maximumCheck;
      if (updates.preMoneyValuation !== undefined) row.pre_money_valuation = updates.preMoneyValuation;
      if (updates.valuationCap !== undefined) row.valuation_cap = updates.valuationCap;
      if (updates.discountRate !== undefined) row.discount_rate = updates.discountRate;
      if (updates.interestRate !== undefined) row.interest_rate = updates.interestRate;
      if (updates.vestingSchedule !== undefined) row.vesting_schedule = updates.vestingSchedule;
      if (updates.openDate !== undefined) row.open_date = updates.openDate;
      if (updates.closeDate !== undefined) row.close_date = updates.closeDate;
      if (updates.fundingDeadline !== undefined) row.funding_deadline = updates.fundingDeadline;
      if (updates.regulatoryFramework !== undefined) row.regulatory_framework = updates.regulatoryFramework;
      if (updates.accreditedOnly !== undefined) row.accredited_only = updates.accreditedOnly;
      if (updates.jurisdictionRestrictions !== undefined) row.jurisdiction_restrictions = updates.jurisdictionRestrictions;
      if (updates.maxInvestors !== undefined) row.max_investors = updates.maxInvestors;
      if (updates.termSheetUrl !== undefined) row.term_sheet_url = updates.termSheetUrl;
      if (updates.safeTemplateUrl !== undefined) row.safe_template_url = updates.safeTemplateUrl;
      if (updates.subscriptionAgreementUrl !== undefined) row.subscription_agreement_url = updates.subscriptionAgreementUrl;
      if (updates.pitchDeckUrl !== undefined) row.pitch_deck_url = updates.pitchDeckUrl;
      if (updates.dataRoomUrl !== undefined) row.data_room_url = updates.dataRoomUrl;
      if (updates.isPublic !== undefined) row.is_public = updates.isPublic;
      if (updates.publicPageSlug !== undefined) row.public_page_slug = updates.publicPageSlug;
      if (updates.tags !== undefined) row.tags = updates.tags;
      if (updates.metadata !== undefined) row.metadata = updates.metadata;
      row.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('capital_rounds')
        .update(row)
        .eq('id', id)
        .eq('venture_id', ventureId)
        .select()
        .single();
      if (error) throw new Error(`Failed to update round: ${error.message}`);
      return mapRoundRow(data);
    },

    async getRound(id) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('capital_rounds')
        .select()
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw new Error(`Failed to get round: ${error.message}`);
      return data ? mapRoundRow(data) : null;
    },

    async getRoundBySlug(ventureId, slug) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('capital_rounds')
        .select()
        .eq('venture_id', ventureId)
        .eq('slug', slug)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw new Error(`Failed to get round: ${error.message}`);
      return data ? mapRoundRow(data) : null;
    },

    async listRounds(ventureId, filters) {
      if (!supabase) return [];
      const limit = filters?.limit ?? 50;
      const offset = filters?.offset ?? 0;
      let q = supabase
        .from('capital_rounds')
        .select()
        .eq('venture_id', ventureId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.roundType) q = q.eq('round_type', filters.roundType);
      if (filters?.raiseLane) q = q.eq('raise_lane', filters.raiseLane);
      if (filters?.isPublic !== undefined) q = q.eq('is_public', filters.isPublic);
      const { data, error } = await q;
      if (error) throw new Error(`Failed to list rounds: ${error.message}`);
      return (data ?? []).map(mapRoundRow);
    },

    async listAllRounds(filters) {
      if (!supabase) return [];
      const limit = filters?.limit ?? 100;
      const offset = filters?.offset ?? 0;
      let q = supabase
        .from('capital_rounds')
        .select()
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.raiseLane) q = q.eq('raise_lane', filters.raiseLane);
      const { data, error } = await q;
      if (error) throw new Error(`Failed to list rounds: ${error.message}`);
      return (data ?? []).map(mapRoundRow);
    },

    async listPublicRounds(filters) {
      if (!supabase) return [];
      const limit = filters?.limit ?? 50;
      const offset = filters?.offset ?? 0;
      const { data, error } = await supabase
        .from('capital_rounds')
        .select()
        .eq('is_public', true)
        .in('status', ['open', 'closing'])
        .is('deleted_at', null)
        .order('featured_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw new Error(`Failed to list public rounds: ${error.message}`);
      return (data ?? []).map(mapRoundRow);
    },

    async updateStatus(id, nextStatus, _actorId) {
      if (!supabase) throw new Error('Supabase client not available');
      const current = await this.getRound(id);
      if (!current) throw new Error(`Round ${id} not found`);
      if (!canTransitionRound(current.status, nextStatus)) {
        throw new Error(`Invalid round status transition: ${current.status} → ${nextStatus}`);
      }
      const { data, error } = await supabase
        .from('capital_rounds')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`Failed to update status: ${error.message}`);
      return mapRoundRow(data);
    },

    async deleteRound(id) {
      if (!supabase) throw new Error('Supabase client not available');
      const { error } = await supabase
        .from('capital_rounds')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(`Failed to delete round: ${error.message}`);
    },
  };
}
