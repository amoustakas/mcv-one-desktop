// packages/events-sdk/src/replay.ts
//
// createReplayService({ supabase }) — targeted replay from event_log to a
// caller-supplied handler. Does NOT re-INSERT events; replay is observation-only.
// Useful for:
//   - Backfilling a new subscriber over historical events.
//   - Re-driving a workflow that got added after an event was emitted.
//   - Testing a handler against live-shape past data.

import type { SupabaseClient } from '@supabase/supabase-js';
import { rowToEnvelope, topicMatches } from './envelope.js';
import type { EventEnvelope, EventHandler, EventLogRow } from './types.js';

export interface ReplayService {
  replay(opts: ReplayOptions): Promise<{ replayed: number; failed: number }>;
}

export interface ReplayOptions {
  /** Topic pattern (exact, trailing *, segment *). Required. */
  topicPattern: string;
  /** ISO timestamp — only replay events emitted after this. Defaults to start-of-log. */
  since?: string;
  /** Upper bound — defaults to now. */
  until?: string;
  /** Cap; default 1000. Guard against accidental full-log replays. */
  limit?: number;
  /** The handler to drive with each event. */
  targetHandler: EventHandler<unknown>;
  /** Optional venture filter — narrows to a single venture's events. */
  ventureId?: string;
  /** Optional correlation id — narrows to one cascade. */
  correlationId?: string;
}

export function createReplayService(deps: { supabase: SupabaseClient }): ReplayService {
  const { supabase } = deps;

  return {
    async replay(opts: ReplayOptions): Promise<{ replayed: number; failed: number }> {
      const limit = opts.limit ?? 1000;
      let q = supabase
        .from('event_log')
        .select('*')
        .order('emitted_at', { ascending: true })
        .limit(limit);

      if (opts.since) q = q.gte('emitted_at', opts.since);
      if (opts.until) q = q.lte('emitted_at', opts.until);
      if (opts.ventureId) q = q.eq('venture_id', opts.ventureId);
      if (opts.correlationId) q = q.eq('correlation_id', opts.correlationId);

      // We don't try to push the topic pattern into SQL — Postgres LIKE
      // wouldn't cover segment wildcards anyway. Filter in memory after the
      // bounded fetch.
      const { data, error } = await q;
      if (error) throw new Error(`[events-sdk] replay query failed: ${error.message}`);

      let replayed = 0;
      let failed = 0;
      for (const row of (data ?? []) as EventLogRow[]) {
        const envelope: EventEnvelope<unknown> = rowToEnvelope(row);
        if (!topicMatches(envelope.topic, opts.topicPattern)) continue;
        try {
          await opts.targetHandler(envelope);
          replayed += 1;
        } catch (err) {
          failed += 1;
           
          console.warn(`[events-sdk] replay handler threw on ${envelope.topic}:`, err instanceof Error ? err.message : err);
        }
      }
      return { replayed, failed };
    },
  };
}
