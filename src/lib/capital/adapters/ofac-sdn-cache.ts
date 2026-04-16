// OFAC SDN cache accessor. Bridges the ofac_sdn_entries Supabase
// table (migration-ofac-sdn-cache.sql) to the in-memory SdnEntry[]
// that ofac-adapter.ts consumes.
//
// Two callers:
//   1. Screening path — loads the list, hands it to the adapter as
//      the sdnEntries option. Falls back to OFAC_SEED when the DB
//      is empty (dev, cold start before first cron, unit tests).
//   2. Refresh path — upserts a freshly-fetched list (from the
//      Treasury CSV) into the table and records a log entry.
//
// Keeps the adapter stateless + synchronous — no DB awareness
// in ofac-adapter.ts itself, so the matcher stays pure.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SdnEntry } from './ofac-adapter';
import { OFAC_SEED } from './ofac-seed';

export interface LoadOptions {
  /** When true, returns OFAC_SEED even if DB has rows (for debug). */
  preferSeed?: boolean;
  /** When true and DB is empty, skip returning the bundled seed —
   *  useful in tests that want to validate "empty DB" behavior without
   *  the seed masking it. */
  skipSeedFallback?: boolean;
}

/**
 * Load SDN entries for the adapter. Tries the ofac_sdn_entries table
 * first; falls back to the curated seed when the table is empty or
 * inaccessible. Never throws — compliance must stay available even
 * when the cache is down.
 */
export async function loadSdnEntries(
  supabase: SupabaseClient,
  opts: LoadOptions = {},
): Promise<{ entries: SdnEntry[]; source: 'db' | 'seed' | 'empty' }> {
  if (opts.preferSeed) return { entries: OFAC_SEED, source: 'seed' };

  try {
    const { data, error } = await supabase
      .from('ofac_sdn_entries')
      .select('id, primary_name, aliases, dob, country, list, programs')
      .limit(20000);

    if (error || !data || data.length === 0) {
      if (opts.skipSeedFallback) return { entries: [], source: 'empty' };
      return { entries: OFAC_SEED, source: 'seed' };
    }

    const entries: SdnEntry[] = data.map((r) => ({
      id: r.id as string,
      primaryName: r.primary_name as string,
      aliases: (r.aliases as string[] | null) ?? undefined,
      dob: (r.dob as string | null) ?? undefined,
      country: (r.country as string | null) ?? undefined,
      list: (r.list as SdnEntry['list']) ?? 'SDN',
      programs: (r.programs as string[] | null) ?? [],
    }));
    return { entries, source: 'db' };
  } catch (err) {
    console.warn('[ofac-cache] load failed, using seed:', err instanceof Error ? err.message : err);
    if (opts.skipSeedFallback) return { entries: [], source: 'empty' };
    return { entries: OFAC_SEED, source: 'seed' };
  }
}

/**
 * Upsert a batch of SDN entries + log the refresh run. Returns the
 * refresh log id so the caller can surface a link in the admin UI.
 *
 * Semantics — this is a FULL REFRESH: we insert/update by primary key
 * but do NOT delete missing rows. To delete, call with `deleteMissing:
 * true` which first collects all existing ids, diffs against the
 * incoming batch, and deletes the difference. Leaving delete off is
 * safer for partial-list refreshes (alt_names.csv, programs-only
 * updates).
 */
export async function upsertSdnEntries(
  supabase: SupabaseClient,
  entries: SdnEntry[],
  opts: { sourceUrl?: string; deleteMissing?: boolean } = {},
): Promise<{ refreshId: string | null; upserted: number; deleted: number }> {
  // Open the log first so we can correlate timing + failures.
  let refreshId: string | null = null;
  try {
    const { data: log } = await supabase
      .from('ofac_sdn_refresh_log')
      .insert({ source_url: opts.sourceUrl ?? null, status: 'running' })
      .select('id')
      .maybeSingle();
    refreshId = (log?.id as string | undefined) ?? null;
  } catch (err) {
    console.warn('[ofac-cache] refresh log open failed:', err instanceof Error ? err.message : err);
  }

  let upserted = 0;
  let deleted = 0;
  try {
    // Chunk at 500 rows to stay inside Supabase request limits.
    const CHUNK = 500;
    for (let i = 0; i < entries.length; i += CHUNK) {
      const chunk = entries.slice(i, i + CHUNK).map((e) => ({
        id: e.id,
        primary_name: e.primaryName,
        aliases: e.aliases ?? [],
        dob: e.dob ?? null,
        country: e.country ?? null,
        list: e.list,
        programs: e.programs ?? [],
        fetched_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('ofac_sdn_entries').upsert(chunk, { onConflict: 'id' });
      if (error) throw new Error(error.message);
      upserted += chunk.length;
    }

    if (opts.deleteMissing) {
      const { data: existing } = await supabase.from('ofac_sdn_entries').select('id');
      const existingIds = new Set(((existing as { id: string }[] | null) ?? []).map((r) => r.id));
      const newIds = new Set(entries.map((e) => e.id));
      const toDelete = [...existingIds].filter((id) => !newIds.has(id));
      if (toDelete.length > 0) {
        const { error } = await supabase.from('ofac_sdn_entries').delete().in('id', toDelete);
        if (error) throw new Error(error.message);
        deleted = toDelete.length;
      }
    }

    if (refreshId) {
      await supabase
        .from('ofac_sdn_refresh_log')
        .update({ completed_at: new Date().toISOString(), rows_upserted: upserted, rows_deleted: deleted, status: 'completed' })
        .eq('id', refreshId);
    }
    return { refreshId, upserted, deleted };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (refreshId) {
      await supabase
        .from('ofac_sdn_refresh_log')
        .update({ completed_at: new Date().toISOString(), status: 'failed', error: msg, rows_upserted: upserted, rows_deleted: deleted })
        .eq('id', refreshId);
    }
    throw err;
  }
}
