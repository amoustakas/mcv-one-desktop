// @mcv/capital-sdk/contacts-service — satellite CRUD over crm_contacts.
//
// Investor profile = capital_investor_profile (1:1 by contact_id on crm_contacts).
// This service never touches crm_contacts directly — caller must ensure the
// contact row exists first (the API handler does this via the CRM contacts path).

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  UpsertInvestorProfileInput,
  type InvestorProfile,
  type ContactStage,
  type ContactType,
  type AccreditationStatus,
  type KycStatus,
  type WalletChain,
} from './types';

export function mapInvestorRow(row: Record<string, unknown>): InvestorProfile {
  return {
    contactId: row.contact_id as string,
    ventureId: row.venture_id as string,
    organizationId: (row.organization_id as string) ?? null,
    contactType: row.contact_type as ContactType,
    stage: row.stage as ContactStage,
    jobTitle: (row.job_title as string) ?? null,
    relationshipOwner: (row.relationship_owner as string) ?? null,
    lastTouchDate: (row.last_touch_date as string) ?? null,
    lastTouchType: (row.last_touch_type as string) ?? null,
    nextFollowUp: (row.next_follow_up as string) ?? null,
    accreditationStatus: row.accreditation_status as AccreditationStatus,
    accreditationExpiry: (row.accreditation_expiry as string) ?? null,
    kycStatus: row.kyc_status as KycStatus,
    kycCompletedAt: (row.kyc_completed_at as string) ?? null,
    jurisdiction: (row.jurisdiction as string) ?? null,
    walletAddress: (row.wallet_address as string) ?? null,
    walletChain: (row.wallet_chain as WalletChain) ?? null,
    portalEnabled: Boolean(row.portal_enabled),
    portalUserId: (row.portal_user_id as string) ?? null,
    portalLastLogin: (row.portal_last_login as string) ?? null,
    leadScore: Number(row.lead_score ?? 0),
    totalCommittedUsd: Number(row.total_committed_usd ?? 0),
    totalFundedUsd: Number(row.total_funded_usd ?? 0),
    source: (row.source as string) ?? null,
    referredBy: (row.referred_by as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export interface ListInvestorsFilters {
  contactType?: ContactType;
  stage?: ContactStage;
  accreditationStatus?: AccreditationStatus;
  kycStatus?: KycStatus;
  organizationId?: string;
  portalEnabled?: boolean;
  minLeadScore?: number;
  minTotalCommitted?: number;
  limit?: number;
  offset?: number;
}

export interface ContactsService {
  upsertInvestorProfile(input: UpsertInvestorProfileInput): Promise<InvestorProfile>;
  getInvestorProfile(contactId: string): Promise<InvestorProfile | null>;
  getByPortalUserId(portalUserId: string): Promise<InvestorProfile[]>;
  listInvestors(ventureId: string, filters?: ListInvestorsFilters): Promise<InvestorProfile[]>;
  listAllInvestors(filters?: ListInvestorsFilters): Promise<InvestorProfile[]>;
  updateStage(contactId: string, stage: ContactStage): Promise<InvestorProfile>;
  enablePortal(contactId: string, portalUserId: string): Promise<InvestorProfile>;
  updateLeadScore(contactId: string, leadScore: number): Promise<InvestorProfile>;
  recordTouch(contactId: string, touchType: string): Promise<InvestorProfile>;
  deleteProfile(contactId: string): Promise<void>;
}

export interface ContactsServiceOptions {
  supabase: SupabaseClient | null;
}

export function createContactsService({ supabase }: ContactsServiceOptions): ContactsService {
  return {
    async upsertInvestorProfile(input) {
      if (!supabase) throw new Error('Supabase client not available');
      const validated = UpsertInvestorProfileInput.parse(input);
      const row = {
        contact_id: validated.contactId,
        venture_id: validated.ventureId,
        organization_id: validated.organizationId ?? null,
        contact_type: validated.contactType,
        stage: validated.stage,
        job_title: validated.jobTitle ?? null,
        relationship_owner: validated.relationshipOwner ?? null,
        accreditation_status: validated.accreditationStatus,
        kyc_status: validated.kycStatus,
        jurisdiction: validated.jurisdiction ?? null,
        wallet_address: validated.walletAddress ?? null,
        wallet_chain: validated.walletChain ?? null,
        portal_enabled: validated.portalEnabled,
        portal_user_id: validated.portalUserId ?? null,
        lead_score: validated.leadScore,
        source: validated.source ?? null,
        referred_by: validated.referredBy ?? null,
        metadata: validated.metadata,
      };
      const { data, error } = await supabase
        .from('capital_investor_profile')
        .upsert(row, { onConflict: 'contact_id' })
        .select()
        .single();
      if (error) throw new Error(`Failed to upsert investor profile: ${error.message}`);
      return mapInvestorRow(data);
    },

    async getInvestorProfile(contactId) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('capital_investor_profile')
        .select()
        .eq('contact_id', contactId)
        .maybeSingle();
      if (error) throw new Error(`Failed to get investor profile: ${error.message}`);
      return data ? mapInvestorRow(data) : null;
    },

    async getByPortalUserId(portalUserId) {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('capital_investor_profile')
        .select()
        .eq('portal_user_id', portalUserId);
      if (error) throw new Error(`Failed: ${error.message}`);
      return (data ?? []).map(mapInvestorRow);
    },

    async listInvestors(ventureId, filters) {
      if (!supabase) return [];
      const limit = filters?.limit ?? 100;
      const offset = filters?.offset ?? 0;
      let q = supabase
        .from('capital_investor_profile')
        .select()
        .eq('venture_id', ventureId)
        .order('lead_score', { ascending: false })
        .range(offset, offset + limit - 1);
      if (filters?.contactType) q = q.eq('contact_type', filters.contactType);
      if (filters?.stage) q = q.eq('stage', filters.stage);
      if (filters?.accreditationStatus) q = q.eq('accreditation_status', filters.accreditationStatus);
      if (filters?.kycStatus) q = q.eq('kyc_status', filters.kycStatus);
      if (filters?.organizationId) q = q.eq('organization_id', filters.organizationId);
      if (filters?.portalEnabled !== undefined) q = q.eq('portal_enabled', filters.portalEnabled);
      if (filters?.minLeadScore !== undefined) q = q.gte('lead_score', filters.minLeadScore);
      if (filters?.minTotalCommitted !== undefined) q = q.gte('total_committed_usd', filters.minTotalCommitted);
      const { data, error } = await q;
      if (error) throw new Error(`Failed to list investors: ${error.message}`);
      return (data ?? []).map(mapInvestorRow);
    },

    async listAllInvestors(filters) {
      if (!supabase) return [];
      const limit = filters?.limit ?? 200;
      let q = supabase
        .from('capital_investor_profile')
        .select()
        .order('total_committed_usd', { ascending: false })
        .limit(limit);
      if (filters?.contactType) q = q.eq('contact_type', filters.contactType);
      if (filters?.stage) q = q.eq('stage', filters.stage);
      if (filters?.minLeadScore !== undefined) q = q.gte('lead_score', filters.minLeadScore);
      const { data, error } = await q;
      if (error) throw new Error(`Failed: ${error.message}`);
      return (data ?? []).map(mapInvestorRow);
    },

    async updateStage(contactId, stage) {
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('capital_investor_profile')
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('contact_id', contactId)
        .select()
        .single();
      if (error) throw new Error(`Failed to update stage: ${error.message}`);
      return mapInvestorRow(data);
    },

    async enablePortal(contactId, portalUserId) {
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('capital_investor_profile')
        .update({
          portal_enabled: true,
          portal_user_id: portalUserId,
          updated_at: new Date().toISOString(),
        })
        .eq('contact_id', contactId)
        .select()
        .single();
      if (error) throw new Error(`Failed to enable portal: ${error.message}`);
      return mapInvestorRow(data);
    },

    async updateLeadScore(contactId, leadScore) {
      if (!supabase) throw new Error('Supabase client not available');
      const bounded = Math.max(0, Math.min(100, Math.round(leadScore)));
      const { data, error } = await supabase
        .from('capital_investor_profile')
        .update({ lead_score: bounded, updated_at: new Date().toISOString() })
        .eq('contact_id', contactId)
        .select()
        .single();
      if (error) throw new Error(`Failed to update lead score: ${error.message}`);
      return mapInvestorRow(data);
    },

    async recordTouch(contactId, touchType) {
      if (!supabase) throw new Error('Supabase client not available');
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('capital_investor_profile')
        .update({
          last_touch_date: now,
          last_touch_type: touchType,
          updated_at: now,
        })
        .eq('contact_id', contactId)
        .select()
        .single();
      if (error) throw new Error(`Failed to record touch: ${error.message}`);
      return mapInvestorRow(data);
    },

    async deleteProfile(contactId) {
      if (!supabase) throw new Error('Supabase client not available');
      const { error } = await supabase
        .from('capital_investor_profile')
        .delete()
        .eq('contact_id', contactId);
      if (error) throw new Error(`Failed to delete profile: ${error.message}`);
    },
  };
}
