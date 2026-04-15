// @mcv/capital-sdk/commitments-service — the core ledger ops.
//
// Status transitions go through the state machine. Totals on rounds and
// investor profiles update via SQL triggers on commitment writes.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CreateCommitmentInput,
  type Commitment,
  type CommitmentStatus,
  type PaymentMethod,
  canTransitionCommitment,
} from './types';

export function mapCommitmentRow(row: Record<string, unknown>): Commitment {
  const asNum = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
  const asArr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    contactId: row.contact_id as string,
    roundId: row.round_id as string,
    organizationId: (row.organization_id as string) ?? null,
    status: row.status as CommitmentStatus,
    amount: Number(row.amount),
    currency: row.currency as string,
    amountUsd: Number(row.amount_usd),
    sharesAllocated: asNum(row.shares_allocated),
    ownershipPct: asNum(row.ownership_pct),
    tokensAllocated: asNum(row.tokens_allocated),
    tokenPriceAtCommit: asNum(row.token_price_at_commit),
    walletAddress: (row.wallet_address as string) ?? null,
    equityComponent: asNum(row.equity_component),
    tokenWarrantComponent: asNum(row.token_warrant_component),
    paymentMethod: (row.payment_method as PaymentMethod) ?? null,
    paymentReference: (row.payment_reference as string) ?? null,
    paymentReceivedAt: (row.payment_received_at as string) ?? null,
    docusignEnvelopeId: (row.docusign_envelope_id as string) ?? null,
    docusignStatus: (row.docusign_status as string) ?? null,
    signedAt: (row.signed_at as string) ?? null,
    documentUrls: asArr<string>(row.document_urls),
    interestExpressedAt: (row.interest_expressed_at as string) ?? null,
    softCommittedAt: (row.soft_committed_at as string) ?? null,
    reservedAt: (row.reserved_at as string) ?? null,
    fundedAt: (row.funded_at as string) ?? null,
    distributedAt: (row.distributed_at as string) ?? null,
    notes: (row.notes as string) ?? null,
    internalNotes: (row.internal_notes as string) ?? null,
    source: (row.source as string) ?? null,
    referralContactId: (row.referral_contact_id as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string) ?? null,
  };
}

// Stamp the right timestamp field for each status transition.
function timestampForStatus(status: CommitmentStatus): Record<string, string> {
  const now = new Date().toISOString();
  switch (status) {
    case 'interest':          return { interest_expressed_at: now };
    case 'soft_commit':       return { soft_committed_at: now };
    case 'reserved':          return { reserved_at: now };
    case 'funded':            return { funded_at: now };
    case 'token_distributed': return { distributed_at: now };
    default:                  return {};
  }
}

export interface ListCommitmentsFilters {
  roundId?: string;
  contactId?: string;
  status?: CommitmentStatus;
  limit?: number;
  offset?: number;
}

export interface CommitmentsService {
  createCommitment(input: CreateCommitmentInput): Promise<Commitment>;
  updateCommitment(id: string, updates: Partial<Omit<CreateCommitmentInput, 'contactId' | 'roundId'>>): Promise<Commitment>;
  getCommitment(id: string): Promise<Commitment | null>;
  listCommitments(ventureId: string, filters?: ListCommitmentsFilters): Promise<Commitment[]>;
  listByRound(roundId: string): Promise<Commitment[]>;
  listByContact(contactId: string): Promise<Commitment[]>;
  listByPortalUser(portalUserId: string): Promise<Commitment[]>;
  updateStatus(id: string, nextStatus: CommitmentStatus, actorId?: string): Promise<Commitment>;
  recordPayment(id: string, paymentMethod: PaymentMethod, paymentReference: string): Promise<Commitment>;
  attachDocuSign(id: string, envelopeId: string): Promise<Commitment>;
  markSigned(id: string): Promise<Commitment>;
  deleteCommitment(id: string): Promise<void>;
}

export interface CommitmentsServiceOptions {
  supabase: SupabaseClient | null;
}

export function createCommitmentsService({ supabase }: CommitmentsServiceOptions): CommitmentsService {
  return {
    async createCommitment(input) {
      if (!supabase) throw new Error('Supabase client not available');
      const validated = CreateCommitmentInput.parse(input);
      const row = {
        venture_id: validated.ventureId,
        contact_id: validated.contactId,
        round_id: validated.roundId,
        organization_id: validated.organizationId ?? null,
        status: validated.status,
        amount: validated.amount,
        currency: validated.currency,
        amount_usd: validated.amountUsd,
        payment_method: validated.paymentMethod ?? null,
        wallet_address: validated.walletAddress ?? null,
        notes: validated.notes ?? null,
        internal_notes: validated.internalNotes ?? null,
        source: validated.source ?? null,
        metadata: validated.metadata,
        ...timestampForStatus(validated.status),
      };
      const { data, error } = await supabase
        .from('capital_commitments')
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(`Failed to create commitment: ${error.message}`);
      return mapCommitmentRow(data);
    },

    async updateCommitment(id, updates) {
      if (!supabase) throw new Error('Supabase client not available');
      const row: Record<string, unknown> = {};
      if (updates.amount !== undefined) row.amount = updates.amount;
      if (updates.amountUsd !== undefined) row.amount_usd = updates.amountUsd;
      if (updates.currency !== undefined) row.currency = updates.currency;
      if (updates.organizationId !== undefined) row.organization_id = updates.organizationId;
      if (updates.paymentMethod !== undefined) row.payment_method = updates.paymentMethod;
      if (updates.walletAddress !== undefined) row.wallet_address = updates.walletAddress;
      if (updates.notes !== undefined) row.notes = updates.notes;
      if (updates.internalNotes !== undefined) row.internal_notes = updates.internalNotes;
      if (updates.metadata !== undefined) row.metadata = updates.metadata;
      row.updated_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('capital_commitments')
        .update(row)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`Failed to update commitment: ${error.message}`);
      return mapCommitmentRow(data);
    },

    async getCommitment(id) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('capital_commitments')
        .select()
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw new Error(`Failed to get commitment: ${error.message}`);
      return data ? mapCommitmentRow(data) : null;
    },

    async listCommitments(ventureId, filters) {
      if (!supabase) return [];
      const limit = filters?.limit ?? 100;
      const offset = filters?.offset ?? 0;
      let q = supabase
        .from('capital_commitments')
        .select()
        .eq('venture_id', ventureId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (filters?.roundId) q = q.eq('round_id', filters.roundId);
      if (filters?.contactId) q = q.eq('contact_id', filters.contactId);
      if (filters?.status) q = q.eq('status', filters.status);
      const { data, error } = await q;
      if (error) throw new Error(`Failed to list commitments: ${error.message}`);
      return (data ?? []).map(mapCommitmentRow);
    },

    async listByRound(roundId) {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('capital_commitments')
        .select()
        .eq('round_id', roundId)
        .is('deleted_at', null)
        .order('amount_usd', { ascending: false });
      if (error) throw new Error(`Failed to list by round: ${error.message}`);
      return (data ?? []).map(mapCommitmentRow);
    },

    async listByContact(contactId) {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('capital_commitments')
        .select()
        .eq('contact_id', contactId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw new Error(`Failed to list by contact: ${error.message}`);
      return (data ?? []).map(mapCommitmentRow);
    },

    async listByPortalUser(portalUserId) {
      if (!supabase) return [];
      // 1. Find contacts with this portal_user_id
      const { data: profiles } = await supabase
        .from('capital_investor_profile')
        .select('contact_id')
        .eq('portal_user_id', portalUserId);
      const contactIds = (profiles ?? []).map((p: { contact_id: string }) => p.contact_id);
      if (!contactIds.length) return [];
      const { data, error } = await supabase
        .from('capital_commitments')
        .select()
        .in('contact_id', contactIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw new Error(`Failed to list portal commitments: ${error.message}`);
      return (data ?? []).map(mapCommitmentRow);
    },

    async updateStatus(id, nextStatus, _actorId) {
      if (!supabase) throw new Error('Supabase client not available');
      const current = await this.getCommitment(id);
      if (!current) throw new Error(`Commitment ${id} not found`);
      if (!canTransitionCommitment(current.status, nextStatus)) {
        throw new Error(`Invalid commitment transition: ${current.status} → ${nextStatus}`);
      }
      const patch = {
        status: nextStatus,
        updated_at: new Date().toISOString(),
        ...timestampForStatus(nextStatus),
      };
      const { data, error } = await supabase
        .from('capital_commitments')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`Failed to update status: ${error.message}`);
      return mapCommitmentRow(data);
    },

    async recordPayment(id, paymentMethod, paymentReference) {
      if (!supabase) throw new Error('Supabase client not available');
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('capital_commitments')
        .update({
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          payment_received_at: now,
          status: 'funded',
          funded_at: now,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`Failed to record payment: ${error.message}`);
      return mapCommitmentRow(data);
    },

    async attachDocuSign(id, envelopeId) {
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('capital_commitments')
        .update({
          docusign_envelope_id: envelopeId,
          docusign_status: 'sent',
          status: 'pending_docs',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`Failed to attach DocuSign: ${error.message}`);
      return mapCommitmentRow(data);
    },

    async markSigned(id) {
      if (!supabase) throw new Error('Supabase client not available');
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('capital_commitments')
        .update({
          docusign_status: 'completed',
          status: 'signed',
          signed_at: now,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`Failed to mark signed: ${error.message}`);
      return mapCommitmentRow(data);
    },

    async deleteCommitment(id) {
      if (!supabase) throw new Error('Supabase client not available');
      const { error } = await supabase
        .from('capital_commitments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(`Failed to delete commitment: ${error.message}`);
    },
  };
}
