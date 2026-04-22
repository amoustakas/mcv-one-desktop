// @mcv/foundation-sdk/services/ip-portfolio — CRUD over ip_marks.
//
// Handles trademarks, patents, copyrights, and trade secrets through the same
// unified `ip_marks` table. Patent-only extension columns (claim_summary,
// novelty_hook, etc.) are gated by a DB CHECK constraint — the service accepts
// them on input for patents and nulls them for other kinds.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CreateIPMarkInput,
  IPMark,
  IPPriorityTier,
  IPMarkKind,
  IPStatus,
  HoldingChainStage,
  type IPBudgetRollup,
} from '../types';

// ─── Row mapping ────────────────────────────────────────────────────────────

export function mapIPMarkRow(row: Record<string, unknown>): IPMark {
  return {
    id: row.id as string,
    markText: row.mark_text as string,
    markKind: row.mark_kind as IPMark['markKind'],
    priorityTier: row.priority_tier as IPMark['priorityTier'],
    classes: (row.classes as number[]) ?? [],
    jurisdictions: (row.jurisdictions as string[]) ?? [],
    ownerEntityId: (row.owner_entity_id as string) ?? null,
    holdingChainStage: row.holding_chain_stage as IPMark['holdingChainStage'],
    domainFk: (row.domain_fk as string) ?? null,
    status: row.status as IPMark['status'],
    filingNumber: (row.filing_number as string) ?? null,
    registrationNumber: (row.registration_number as string) ?? null,
    filedAt: (row.filed_at as string) ?? null,
    registeredAt: (row.registered_at as string) ?? null,
    renewalDue: (row.renewal_due as string) ?? null,
    isCompound: Boolean(row.is_compound),
    compoundParentMarkId: (row.compound_parent_mark_id as string) ?? null,
    claimSummary: (row.claim_summary as string) ?? null,
    noveltyHook: (row.novelty_hook as string) ?? null,
    supportingArtifacts: (row.supporting_artifacts as string[]) ?? [],
    provisionalDraftStatus: (row.provisional_draft_status as IPMark['provisionalDraftStatus']) ?? null,
    filingVehicle: (row.filing_vehicle as IPMark['filingVehicle']) ?? null,
    notes: (row.notes as string) ?? null,
    sourceDoc: (row.source_doc as string) ?? null,
    sourceSection: (row.source_section as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Filter types ───────────────────────────────────────────────────────────

export interface ListIPMarksFilters {
  markKind?: IPMark['markKind'];
  priorityTier?: IPMark['priorityTier'] | IPMark['priorityTier'][];
  status?: IPMark['status'];
  ownerEntityId?: string;
  holdingChainStage?: IPMark['holdingChainStage'];
  jurisdictions?: string[];           // any-of match
  isCompound?: boolean;
  compoundParentMarkId?: string;
  search?: string;                    // case-insensitive markText LIKE
  limit?: number;
  offset?: number;
}

// ─── Service interface ──────────────────────────────────────────────────────

export interface IPPortfolioService {
  list(filters?: ListIPMarksFilters): Promise<IPMark[]>;
  get(id: string): Promise<IPMark | null>;
  create(input: CreateIPMarkInput): Promise<IPMark>;
  updateStatus(id: string, status: IPMark['status']): Promise<IPMark>;
  linkDomain(id: string, domainId: string | null): Promise<IPMark>;
  listCompoundsOf(parentId: string): Promise<IPMark[]>;
  readBudgetRollup(): Promise<IPBudgetRollup>;
}

export interface IPPortfolioServiceOptions {
  supabase: SupabaseClient | null;
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createIPPortfolioService({ supabase }: IPPortfolioServiceOptions): IPPortfolioService {
  const requireClient = (): SupabaseClient => {
    if (!supabase) throw new Error('Supabase client not available for IPPortfolioService');
    return supabase;
  };

  return {
    async list(filters = {}) {
      const client = requireClient();
      let q = client.from('ip_marks').select();

      if (filters.markKind) q = q.eq('mark_kind', filters.markKind);
      if (filters.priorityTier) {
        q = Array.isArray(filters.priorityTier)
          ? q.in('priority_tier', filters.priorityTier)
          : q.eq('priority_tier', filters.priorityTier);
      }
      if (filters.status) q = q.eq('status', filters.status);
      if (filters.ownerEntityId) q = q.eq('owner_entity_id', filters.ownerEntityId);
      if (filters.holdingChainStage) q = q.eq('holding_chain_stage', filters.holdingChainStage);
      if (filters.jurisdictions && filters.jurisdictions.length > 0) {
        q = q.overlaps('jurisdictions', filters.jurisdictions);
      }
      if (typeof filters.isCompound === 'boolean') q = q.eq('is_compound', filters.isCompound);
      if (filters.compoundParentMarkId) q = q.eq('compound_parent_mark_id', filters.compoundParentMarkId);
      if (filters.search) q = q.ilike('mark_text', `%${filters.search}%`);

      q = q
        .order('priority_tier', { ascending: true })      // P0 < P1 < P2 by sort key
        .order('mark_text', { ascending: true });
      if (filters.limit) q = q.limit(filters.limit);
      if (filters.offset) q = q.range(filters.offset, filters.offset + (filters.limit ?? 100) - 1);

      const { data, error } = await q;
      if (error) throw new Error(`IPPortfolioService.list failed: ${error.message}`);
      return (data ?? []).map(mapIPMarkRow);
    },

    async get(id) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('ip_marks')
        .select()
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(`IPPortfolioService.get failed: ${error.message}`);
      return data ? mapIPMarkRow(data) : null;
    },

    async create(input) {
      const client = requireClient();
      const validated = CreateIPMarkInput.parse(input);
      const isPatent = validated.markKind === 'patent';
      const row = {
        mark_text: validated.markText,
        mark_kind: validated.markKind,
        priority_tier: validated.priorityTier,
        classes: validated.classes ?? [],
        jurisdictions: validated.jurisdictions ?? [],
        owner_entity_id: validated.ownerEntityId,
        holding_chain_stage: validated.holdingChainStage ?? 'interim_mcv_inc',
        domain_fk: validated.domainFk,
        status: validated.status ?? 'identified',
        filing_number: validated.filingNumber,
        registration_number: validated.registrationNumber,
        filed_at: validated.filedAt,
        registered_at: validated.registeredAt,
        renewal_due: validated.renewalDue,
        is_compound: validated.isCompound ?? false,
        compound_parent_mark_id: validated.compoundParentMarkId,
        // Patent extension — CHECK constraint enforces null-when-not-patent
        claim_summary: isPatent ? validated.claimSummary : null,
        novelty_hook: isPatent ? validated.noveltyHook : null,
        supporting_artifacts: isPatent ? (validated.supportingArtifacts ?? []) : null,
        provisional_draft_status: isPatent ? validated.provisionalDraftStatus : null,
        filing_vehicle: isPatent ? validated.filingVehicle : null,
        notes: validated.notes,
        source_doc: validated.sourceDoc,
        source_section: validated.sourceSection,
      };
      const { data, error } = await client
        .from('ip_marks')
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(`IPPortfolioService.create failed: ${error.message}`);
      return mapIPMarkRow(data);
    },

    async updateStatus(id, status) {
      const client = requireClient();
      // Validate via zod enum
      const parsed = IPStatus.parse(status);
      const { data, error } = await client
        .from('ip_marks')
        .update({ status: parsed })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`IPPortfolioService.updateStatus failed: ${error.message}`);
      return mapIPMarkRow(data);
    },

    async linkDomain(id, domainId) {
      const client = requireClient();
      const { data, error } = await client
        .from('ip_marks')
        .update({ domain_fk: domainId })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`IPPortfolioService.linkDomain failed: ${error.message}`);
      return mapIPMarkRow(data);
    },

    async listCompoundsOf(parentId) {
      const client = requireClient();
      const { data, error } = await client
        .from('ip_marks')
        .select()
        .eq('compound_parent_mark_id', parentId)
        .order('mark_text');
      if (error) throw new Error(`IPPortfolioService.listCompoundsOf failed: ${error.message}`);
      return (data ?? []).map(mapIPMarkRow);
    },

    async readBudgetRollup() {
      // Read-only aggregation. Keeps the heavy lifting server-side where possible.
      const client = requireClient();
      const { data, error } = await client
        .from('filing_records')
        .select('fee_total_usd, filing_type, ip_mark_id, ip_marks!inner(priority_tier)');
      if (error) throw new Error(`IPPortfolioService.readBudgetRollup failed: ${error.message}`);

      const rollup: IPBudgetRollup = {
        p0Total: 0, p1Total: 0, p2Total: 0,
        madridTotal: 0, utilityTotal: 0, allTotal: 0,
        yearOneEnvelopeLow: 266000,
        yearOneEnvelopeHigh: 351000,
      };
      for (const row of (data ?? []) as Array<Record<string, unknown>>) {
        const fee = Number(row.fee_total_usd ?? 0);
        const tier = ((row.ip_marks as Record<string, unknown>)?.priority_tier as string) ?? '';
        const type = (row.filing_type as string) ?? '';
        rollup.allTotal += fee;
        if (tier === 'P0') rollup.p0Total += fee;
        else if (tier === 'P1') rollup.p1Total += fee;
        else if (tier === 'P2') rollup.p2Total += fee;
        if (type === 'madrid_extension') rollup.madridTotal += fee;
        if (type === 'utility_patent') rollup.utilityTotal += fee;
      }
      return rollup;
    },
  };
}

// Re-export the enum schemas that service consumers commonly need inline.
export { IPPriorityTier, IPMarkKind, IPStatus, HoldingChainStage };
