// @mcv/capital-sdk/documents-service — round/commitment/contact document vault.

import type { SupabaseClient } from '@supabase/supabase-js';
import { CreateDocumentInput, type CapitalDocument, type DocumentType } from './types';

export function mapDocumentRow(row: Record<string, unknown>): CapitalDocument {
  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    roundId: (row.round_id as string) ?? null,
    commitmentId: (row.commitment_id as string) ?? null,
    contactId: (row.contact_id as string) ?? null,
    name: row.name as string,
    documentType: row.document_type as DocumentType,
    fileUrl: row.file_url as string,
    fileSize: row.file_size === null || row.file_size === undefined ? null : Number(row.file_size),
    mimeType: (row.mime_type as string) ?? null,
    isInvestorVisible: Boolean(row.is_investor_visible),
    requiresNda: Boolean(row.requires_nda),
    version: Number(row.version ?? 1),
    previousVersionId: (row.previous_version_id as string) ?? null,
    uploadedBy: (row.uploaded_by as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: (row.deleted_at as string) ?? null,
  };
}

export interface DocumentsService {
  createDocument(input: CreateDocumentInput): Promise<CapitalDocument>;
  getDocument(id: string): Promise<CapitalDocument | null>;
  listByRound(roundId: string, opts?: { investorVisibleOnly?: boolean }): Promise<CapitalDocument[]>;
  listByCommitment(commitmentId: string): Promise<CapitalDocument[]>;
  listByContact(contactId: string): Promise<CapitalDocument[]>;
  listByVenture(ventureId: string, filters?: { documentType?: DocumentType; limit?: number }): Promise<CapitalDocument[]>;
  setVisibility(id: string, isInvestorVisible: boolean): Promise<CapitalDocument>;
  deleteDocument(id: string): Promise<void>;
}

export interface DocumentsServiceOptions {
  supabase: SupabaseClient | null;
}

export function createDocumentsService({ supabase }: DocumentsServiceOptions): DocumentsService {
  return {
    async createDocument(input) {
      if (!supabase) throw new Error('Supabase client not available');
      const validated = CreateDocumentInput.parse(input);
      const row = {
        venture_id: validated.ventureId,
        round_id: validated.roundId ?? null,
        commitment_id: validated.commitmentId ?? null,
        contact_id: validated.contactId ?? null,
        name: validated.name,
        document_type: validated.documentType,
        file_url: validated.fileUrl,
        file_size: validated.fileSize ?? null,
        mime_type: validated.mimeType ?? null,
        is_investor_visible: validated.isInvestorVisible,
        requires_nda: validated.requiresNda,
        uploaded_by: validated.uploadedBy ?? null,
        metadata: validated.metadata,
      };
      const { data, error } = await supabase
        .from('capital_documents')
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(`Failed to create document: ${error.message}`);
      return mapDocumentRow(data);
    },

    async getDocument(id) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('capital_documents')
        .select()
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw new Error(`Failed: ${error.message}`);
      return data ? mapDocumentRow(data) : null;
    },

    async listByRound(roundId, opts) {
      if (!supabase) return [];
      let q = supabase
        .from('capital_documents')
        .select()
        .eq('round_id', roundId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (opts?.investorVisibleOnly) q = q.eq('is_investor_visible', true);
      const { data, error } = await q;
      if (error) throw new Error(`Failed: ${error.message}`);
      return (data ?? []).map(mapDocumentRow);
    },

    async listByCommitment(commitmentId) {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('capital_documents')
        .select()
        .eq('commitment_id', commitmentId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw new Error(`Failed: ${error.message}`);
      return (data ?? []).map(mapDocumentRow);
    },

    async listByContact(contactId) {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('capital_documents')
        .select()
        .eq('contact_id', contactId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw new Error(`Failed: ${error.message}`);
      return (data ?? []).map(mapDocumentRow);
    },

    async listByVenture(ventureId, filters) {
      if (!supabase) return [];
      let q = supabase
        .from('capital_documents')
        .select()
        .eq('venture_id', ventureId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(filters?.limit ?? 100);
      if (filters?.documentType) q = q.eq('document_type', filters.documentType);
      const { data, error } = await q;
      if (error) throw new Error(`Failed: ${error.message}`);
      return (data ?? []).map(mapDocumentRow);
    },

    async setVisibility(id, isInvestorVisible) {
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('capital_documents')
        .update({ is_investor_visible: isInvestorVisible, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`Failed: ${error.message}`);
      return mapDocumentRow(data);
    },

    async deleteDocument(id) {
      if (!supabase) throw new Error('Supabase client not available');
      const { error } = await supabase
        .from('capital_documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(`Failed: ${error.message}`);
    },
  };
}
