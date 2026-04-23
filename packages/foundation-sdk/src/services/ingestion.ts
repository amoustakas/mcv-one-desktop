// @mcv/foundation-sdk/services/ingestion — audit wrapper around counsel-corpus
// ingestion passes.
//
// This service handles the DB side of ingestion: open/close docs_ingestion_runs
// audit rows, record insertion + embedding counts, capture errors.
//
// The actual parsing logic — markdown → structured rows, CSV → domain_registry
// upserts, chunking → storage_chunks via text-embedding-004 — lives in
// scripts/foundation/ingest-counsel-corpus.ts (Node-only) and its sibling parser
// modules. The kit layer wires them together; this service just tracks audit.

import type { SupabaseClient } from '@supabase/supabase-js';
import { DocsIngestionRun, IngestionSourceKind } from '../types';

// ─── Row mapping ────────────────────────────────────────────────────────────

export function mapIngestionRunRow(row: Record<string, unknown>): DocsIngestionRun {
  return {
    id: row.id as string,
    sourcePath: row.source_path as string,
    sourceKind: row.source_kind as DocsIngestionRun['sourceKind'],
    startedAt: row.started_at as string,
    completedAt: (row.completed_at as string) ?? null,
    rowsInserted: Number(row.rows_inserted ?? 0),
    chunksEmbedded: Number(row.chunks_embedded ?? 0),
    status: row.status as DocsIngestionRun['status'],
    errorLog: (row.error_log as string) ?? null,
  };
}

// ─── Service ────────────────────────────────────────────────────────────────

export interface StartRunInput {
  sourcePath: string;
  sourceKind: DocsIngestionRun['sourceKind'];
}

export interface CompleteRunInput {
  runId: string;
  rowsInserted: number;
  chunksEmbedded: number;
  status: DocsIngestionRun['status'];          // 'ok' | 'failed'
  errorLog?: string | null;
}

export interface IngestionService {
  startRun(input: StartRunInput): Promise<DocsIngestionRun>;
  completeRun(input: CompleteRunInput): Promise<DocsIngestionRun>;
  listRuns(sourcePath?: string, limit?: number): Promise<DocsIngestionRun[]>;
  latestRunForPath(sourcePath: string): Promise<DocsIngestionRun | null>;
  /** Total rows inserted across ALL completed runs. Drives the "ingested X rows" badge. */
  aggregateCounts(): Promise<{ totalRuns: number; totalRows: number; totalChunks: number; lastSuccessAt: string | null }>;
}

export interface IngestionServiceOptions {
  supabase: SupabaseClient | null;
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createIngestionService({ supabase }: IngestionServiceOptions): IngestionService {
  const requireClient = (): SupabaseClient => {
    if (!supabase) throw new Error('Supabase client not available for IngestionService');
    return supabase;
  };

  return {
    async startRun(input) {
      const client = requireClient();
      IngestionSourceKind.parse(input.sourceKind);
      const row = {
        source_path: input.sourcePath,
        source_kind: input.sourceKind,
        status: 'running' as const,
      };
      const { data, error } = await client
        .from('docs_ingestion_runs').insert(row).select().single();
      if (error) throw new Error(`IngestionService.startRun failed: ${error.message}`);
      return mapIngestionRunRow(data);
    },

    async completeRun(input) {
      const client = requireClient();
      const patch = {
        rows_inserted: input.rowsInserted,
        chunks_embedded: input.chunksEmbedded,
        status: input.status,
        error_log: input.errorLog ?? null,
        completed_at: new Date().toISOString(),
      };
      const { data, error } = await client
        .from('docs_ingestion_runs')
        .update(patch).eq('id', input.runId).select().single();
      if (error) throw new Error(`IngestionService.completeRun failed: ${error.message}`);
      return mapIngestionRunRow(data);
    },

    async listRuns(sourcePath, limit = 50) {
      const client = requireClient();
      let q = client.from('docs_ingestion_runs').select()
        .order('started_at', { ascending: false }).limit(limit);
      if (sourcePath) q = q.eq('source_path', sourcePath);
      const { data, error } = await q;
      if (error) throw new Error(`IngestionService.listRuns failed: ${error.message}`);
      return (data ?? []).map(mapIngestionRunRow);
    },

    async latestRunForPath(sourcePath) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('docs_ingestion_runs').select()
        .eq('source_path', sourcePath)
        .order('started_at', { ascending: false })
        .limit(1).maybeSingle();
      if (error) throw new Error(`IngestionService.latestRunForPath failed: ${error.message}`);
      return data ? mapIngestionRunRow(data) : null;
    },

    async aggregateCounts() {
      const client = requireClient();
      const { data, error } = await client
        .from('docs_ingestion_runs')
        .select('rows_inserted, chunks_embedded, status, completed_at');
      if (error) throw new Error(`IngestionService.aggregateCounts failed: ${error.message}`);
      let totalRuns = 0;
      let totalRows = 0;
      let totalChunks = 0;
      let lastSuccessAt: string | null = null;
      for (const row of (data ?? []) as Array<{ rows_inserted?: number; chunks_embedded?: number; status?: string; completed_at?: string | null }>) {
        totalRuns += 1;
        if (row.status === 'ok') {
          totalRows += Number(row.rows_inserted ?? 0);
          totalChunks += Number(row.chunks_embedded ?? 0);
          if (row.completed_at && (!lastSuccessAt || row.completed_at > lastSuccessAt)) {
            lastSuccessAt = row.completed_at;
          }
        }
      }
      return { totalRuns, totalRows, totalChunks, lastSuccessAt };
    },
  };
}
