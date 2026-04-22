// @mcv/foundation-sdk/services/naming — CRUD over naming_ratifications /
// naming_occurrences / naming_batches, plus batch approve/apply/rollback state
// transitions.
//
// Design split: this service is ISOMORPHIC (browser + Node). The actual
// filesystem scanner and the git commit/rollback operations live in
// scripts/foundation/naming-scanner.ts (Node-only, called by the
// foundation-kit tool handlers). That split keeps the SDK browser-safe
// and lets the cockpit panels import this service without pulling fs.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  NamingRatification,
  NamingOccurrence,
  NamingBatch,
  NamingClassification,
  NamingApprovalStatus,
} from '../types';
import { CLASSIFICATION_DEFAULTS } from '../corpus/ratified-names';
import type { OccurrenceKindKey } from '../corpus/ratified-names';

// ─── Row mappers ────────────────────────────────────────────────────────────

export function mapRatificationRow(row: Record<string, unknown>): NamingRatification {
  return {
    id: row.id as string,
    deprecatedName: row.deprecated_name as string,
    ratifiedName: row.ratified_name as string,
    context: row.context as NamingRatification['context'],
    effectiveAt: row.effective_at as string,
    rationale: (row.rationale as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapOccurrenceRow(row: Record<string, unknown>): NamingOccurrence {
  return {
    id: row.id as string,
    ratificationId: row.ratification_id as string,
    filePath: row.file_path as string,
    lineNumber: Number(row.line_number),
    columnNumber: Number(row.column_number),
    contextBefore: (row.context_before as string) ?? null,
    matchText: row.match_text as string,
    contextAfter: (row.context_after as string) ?? null,
    occurrenceKind: row.occurrence_kind as NamingOccurrence['occurrenceKind'],
    classification: row.classification as NamingOccurrence['classification'],
    proposedReplacement: (row.proposed_replacement as string) ?? null,
    approvalStatus: row.approval_status as NamingOccurrence['approvalStatus'],
    approvedBy: (row.approved_by as string) ?? null,
    approvedAt: (row.approved_at as string) ?? null,
    appliedAt: (row.applied_at as string) ?? null,
    commitSha: (row.commit_sha as string) ?? null,
    batchId: (row.batch_id as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapBatchRow(row: Record<string, unknown>): NamingBatch {
  return {
    id: row.id as string,
    approvedBy: (row.approved_by as string) ?? null,
    approvedAt: (row.approved_at as string) ?? null,
    appliedAt: (row.applied_at as string) ?? null,
    commitSha: (row.commit_sha as string) ?? null,
    preCommitSha: (row.pre_commit_sha as string) ?? null,
    occurrenceCount: Number(row.occurrence_count ?? 0),
    rollbackOf: (row.rollback_of as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: row.created_at as string,
  };
}

// ─── Input types ────────────────────────────────────────────────────────────

export interface InsertOccurrenceInput {
  ratificationId: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  contextBefore?: string | null;
  matchText: string;
  contextAfter?: string | null;
  occurrenceKind: NamingOccurrence['occurrenceKind'];
  classification?: NamingOccurrence['classification'];
  proposedReplacement?: string | null;
}

export interface ListOccurrencesFilters {
  ratificationId?: string;
  approvalStatus?: NamingOccurrence['approvalStatus'] | NamingOccurrence['approvalStatus'][];
  classification?: NamingOccurrence['classification'];
  occurrenceKind?: NamingOccurrence['occurrenceKind'];
  filePath?: string;
  batchId?: string | null;
  limit?: number;
  offset?: number;
}

// ─── Service ────────────────────────────────────────────────────────────────

export interface NamingService {
  listRatifications(): Promise<NamingRatification[]>;
  listOccurrences(filters?: ListOccurrencesFilters): Promise<NamingOccurrence[]>;
  getOccurrence(id: string): Promise<NamingOccurrence | null>;
  /** Bulk insert from a scan pass (called by scripts/foundation/naming-scanner). */
  insertOccurrences(inputs: InsertOccurrenceInput[]): Promise<{ inserted: number }>;
  /** Delete all occurrences for a given scan replacement. Used when rescanning — caller
   *  typically wipes the previous pass before writing a new one. */
  clearOccurrences(filters?: { ratificationId?: string; approvalStatus?: NamingOccurrence['approvalStatus'] }): Promise<{ deleted: number }>;
  classifyOccurrence(id: string, classification: NamingOccurrence['classification']): Promise<NamingOccurrence>;

  /** Create an approval batch covering the given occurrences. Flips each to approved. */
  approveBatch(
    occurrenceIds: string[],
    approver: string,
    notes?: string,
  ): Promise<{ batch: NamingBatch; occurrences: NamingOccurrence[] }>;

  /** Called by the Node-side kit handler AFTER the git commit succeeds — records
   *  commit_sha on the batch + per-occurrence, flips status to applied. */
  recordBatchApplied(
    batchId: string,
    preCommitSha: string,
    commitSha: string,
    appliedAtIso?: string,
  ): Promise<NamingBatch>;

  /** Creates a rollback batch that reverts the given batch's commit. The actual git
   *  revert happens in the kit handler; this method tracks the audit pair. */
  recordRollback(
    originalBatchId: string,
    revertCommitSha: string,
    approver: string,
    notes?: string,
  ): Promise<NamingBatch>;

  /** Default classification for a freshly-scanned occurrence. Exposed so scanner
   *  scripts don't have to import from corpus directly. */
  defaultClassificationFor(kind: OccurrenceKindKey): NamingOccurrence['classification'];
}

export interface NamingServiceOptions {
  supabase: SupabaseClient | null;
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createNamingService({ supabase }: NamingServiceOptions): NamingService {
  const requireClient = (): SupabaseClient => {
    if (!supabase) throw new Error('Supabase client not available for NamingService');
    return supabase;
  };

  return {
    async listRatifications() {
      const client = requireClient();
      const { data, error } = await client
        .from('naming_ratifications').select().order('deprecated_name');
      if (error) throw new Error(`NamingService.listRatifications failed: ${error.message}`);
      return (data ?? []).map(mapRatificationRow);
    },

    async listOccurrences(filters = {}) {
      const client = requireClient();
      let q = client.from('naming_occurrences').select()
        .order('file_path').order('line_number');
      if (filters.ratificationId) q = q.eq('ratification_id', filters.ratificationId);
      if (filters.approvalStatus) {
        q = Array.isArray(filters.approvalStatus)
          ? q.in('approval_status', filters.approvalStatus)
          : q.eq('approval_status', filters.approvalStatus);
      }
      if (filters.classification) q = q.eq('classification', filters.classification);
      if (filters.occurrenceKind) q = q.eq('occurrence_kind', filters.occurrenceKind);
      if (filters.filePath) q = q.eq('file_path', filters.filePath);
      if (filters.batchId !== undefined) {
        q = filters.batchId === null ? q.is('batch_id', null) : q.eq('batch_id', filters.batchId);
      }
      if (filters.limit) q = q.limit(filters.limit);
      if (filters.offset) q = q.range(filters.offset, filters.offset + (filters.limit ?? 500) - 1);

      const { data, error } = await q;
      if (error) throw new Error(`NamingService.listOccurrences failed: ${error.message}`);
      return (data ?? []).map(mapOccurrenceRow);
    },

    async getOccurrence(id) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('naming_occurrences').select().eq('id', id).maybeSingle();
      if (error) throw new Error(`NamingService.getOccurrence failed: ${error.message}`);
      return data ? mapOccurrenceRow(data) : null;
    },

    async insertOccurrences(inputs) {
      if (inputs.length === 0) return { inserted: 0 };
      const client = requireClient();
      const rows = inputs.map((i) => ({
        ratification_id: i.ratificationId,
        file_path: i.filePath,
        line_number: i.lineNumber,
        column_number: i.columnNumber,
        context_before: i.contextBefore ?? null,
        match_text: i.matchText,
        context_after: i.contextAfter ?? null,
        occurrence_kind: i.occurrenceKind,
        classification: i.classification
          ?? CLASSIFICATION_DEFAULTS[i.occurrenceKind as OccurrenceKindKey]
          ?? 'ambiguous',
        proposed_replacement: i.proposedReplacement ?? null,
        approval_status: 'pending',
      }));
      const { error, count } = await client
        .from('naming_occurrences')
        .insert(rows, { count: 'exact' });
      if (error) throw new Error(`NamingService.insertOccurrences failed: ${error.message}`);
      return { inserted: count ?? rows.length };
    },

    async clearOccurrences(filters = {}) {
      const client = requireClient();
      let q = client.from('naming_occurrences').delete({ count: 'exact' });
      if (filters.ratificationId) q = q.eq('ratification_id', filters.ratificationId);
      if (filters.approvalStatus) q = q.eq('approval_status', filters.approvalStatus);
      // Safety rail: require at least one predicate so we never wipe the table.
      if (!filters.ratificationId && !filters.approvalStatus) {
        throw new Error('NamingService.clearOccurrences requires at least one filter (ratificationId or approvalStatus)');
      }
      const { error, count } = await q;
      if (error) throw new Error(`NamingService.clearOccurrences failed: ${error.message}`);
      return { deleted: count ?? 0 };
    },

    async classifyOccurrence(id, classification) {
      const client = requireClient();
      NamingClassification.parse(classification);
      const { data, error } = await client
        .from('naming_occurrences')
        .update({ classification })
        .eq('id', id).select().single();
      if (error) throw new Error(`NamingService.classifyOccurrence failed: ${error.message}`);
      return mapOccurrenceRow(data);
    },

    async approveBatch(occurrenceIds, approver, notes) {
      if (occurrenceIds.length === 0) {
        throw new Error('NamingService.approveBatch requires at least one occurrence id');
      }
      const client = requireClient();
      const nowIso = new Date().toISOString();

      // 1) Create the batch row with count + approver.
      const { data: batchRow, error: batchErr } = await client
        .from('naming_batches')
        .insert({
          approved_by: approver,
          approved_at: nowIso,
          occurrence_count: occurrenceIds.length,
          notes: notes ?? null,
        })
        .select().single();
      if (batchErr) throw new Error(`NamingService.approveBatch failed (batch): ${batchErr.message}`);
      const batch = mapBatchRow(batchRow);

      // 2) Flip each occurrence to approved + link to the batch.
      const { data: occRows, error: occErr } = await client
        .from('naming_occurrences')
        .update({
          approval_status: 'approved',
          approved_by: approver,
          approved_at: nowIso,
          batch_id: batch.id,
        })
        .in('id', occurrenceIds)
        .select();
      if (occErr) throw new Error(`NamingService.approveBatch failed (occurrences): ${occErr.message}`);
      const occurrences = (occRows ?? []).map(mapOccurrenceRow);
      return { batch, occurrences };
    },

    async recordBatchApplied(batchId, preCommitSha, commitSha, appliedAtIso) {
      const client = requireClient();
      const ts = appliedAtIso ?? new Date().toISOString();

      // Batch-level post-apply record
      const { data: batchRow, error: batchErr } = await client
        .from('naming_batches')
        .update({ pre_commit_sha: preCommitSha, commit_sha: commitSha, applied_at: ts })
        .eq('id', batchId).select().single();
      if (batchErr) throw new Error(`NamingService.recordBatchApplied failed (batch): ${batchErr.message}`);

      // Occurrence-level cascade
      const { error: occErr } = await client
        .from('naming_occurrences')
        .update({ approval_status: 'applied', applied_at: ts, commit_sha: commitSha })
        .eq('batch_id', batchId);
      if (occErr) throw new Error(`NamingService.recordBatchApplied failed (occurrences): ${occErr.message}`);

      return mapBatchRow(batchRow);
    },

    async recordRollback(originalBatchId, revertCommitSha, approver, notes) {
      const client = requireClient();

      // Lookup the original batch for occurrence count (informational).
      const { data: origBatch } = await client
        .from('naming_batches').select('occurrence_count').eq('id', originalBatchId).maybeSingle();
      const origCount = Number((origBatch as { occurrence_count?: number } | null)?.occurrence_count ?? 0);

      const { data: row, error } = await client
        .from('naming_batches')
        .insert({
          approved_by: approver,
          approved_at: new Date().toISOString(),
          applied_at: new Date().toISOString(),
          commit_sha: revertCommitSha,
          occurrence_count: origCount,
          rollback_of: originalBatchId,
          notes: notes ?? `Rollback of batch ${originalBatchId}`,
        })
        .select().single();
      if (error) throw new Error(`NamingService.recordRollback failed: ${error.message}`);
      return mapBatchRow(row);
    },

    defaultClassificationFor(kind) {
      return (CLASSIFICATION_DEFAULTS[kind] ?? 'ambiguous') as NamingOccurrence['classification'];
    },
  };
}

// Re-export the approval status vocabulary for consumers that narrow on it.
export { NamingApprovalStatus };
