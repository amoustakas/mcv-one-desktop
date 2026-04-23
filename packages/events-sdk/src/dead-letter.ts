// packages/events-sdk/src/dead-letter.ts
//
// createDeadLetterService({ supabase }) — records subscriber failures to
// event_dead_letters + exposes list + retry primitives for the DLQ cockpit
// view. Keeps events-sdk policy: no silent drops.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { EventDeadLetterRow, EventEnvelope, EventHandler } from './types.js';
import { rowToEnvelope } from './envelope.js';

export interface DeadLetterService {
  /** Called by the subscriber dispatcher when a handler throws. */
  record(entry: RecordDeadLetterInput): Promise<void>;
  /** List failed events for the DLQ cockpit. Newest first. */
  list(filters?: ListDeadLettersFilters): Promise<EventDeadLetterRow[]>;
  /**
   * Retry one dead letter: fetches the archived event from event_log and
   * invokes the caller-supplied handler. On success, marks the DLQ row
   * resolved; on repeated failure, bumps attempt_count + records the new
   * error.
   */
  retry(id: string, handler: EventHandler<unknown>): Promise<{ ok: boolean; error?: string }>;
}

export interface RecordDeadLetterInput {
  eventId: string;
  topic: string;
  subscriberLabel: string;
  subscriberId?: string;
  errorMessage: string;
  errorStack?: string;
}

export interface ListDeadLettersFilters {
  topic?: string;
  status?: EventDeadLetterRow['status'];
  limit?: number;
}

export function createDeadLetterService(deps: { supabase: SupabaseClient }): DeadLetterService {
  const { supabase } = deps;

  return {
    async record(entry: RecordDeadLetterInput): Promise<void> {
      const row = {
        event_id: entry.eventId,
        subscriber_id: entry.subscriberId ?? null,
        subscriber_label: entry.subscriberLabel,
        topic: entry.topic,
        error_message: entry.errorMessage,
        error_stack: entry.errorStack ?? null,
      };
      const { error } = await supabase.from('event_dead_letters').insert(row as never);
      if (error) throw new Error(`[events-sdk] dead_letter insert failed: ${error.message}`);
    },

    async list(filters: ListDeadLettersFilters = {}): Promise<EventDeadLetterRow[]> {
      let q = supabase
        .from('event_dead_letters')
        .select('*')
        .order('last_failed_at', { ascending: false })
        .limit(filters.limit ?? 100);
      if (filters.topic) q = q.eq('topic', filters.topic);
      if (filters.status) q = q.eq('status', filters.status);
      const { data, error } = await q;
      if (error) throw new Error(`[events-sdk] dead_letter list failed: ${error.message}`);
      return (data ?? []) as EventDeadLetterRow[];
    },

    async retry(id: string, handler: EventHandler<unknown>): Promise<{ ok: boolean; error?: string }> {
      // Load the DLQ row + its archived event.
      const { data: dlRow, error: dlErr } = await supabase
        .from('event_dead_letters')
        .select('*')
        .eq('id', id)
        .single();
      if (dlErr || !dlRow) return { ok: false, error: dlErr?.message ?? 'dead letter not found' };
      const dl = dlRow as EventDeadLetterRow;

      const { data: evRow, error: evErr } = await supabase
        .from('event_log')
        .select('*')
        .eq('id', dl.event_id)
        .single();
      if (evErr || !evRow) return { ok: false, error: evErr?.message ?? 'archived event not found' };
      const envelope: EventEnvelope<unknown> = rowToEnvelope(evRow);

      try {
        await handler(envelope);
        await supabase
          .from('event_dead_letters')
          .update({ status: 'resolved', last_failed_at: new Date().toISOString() } as never)
          .eq('id', id);
        return { ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabase
          .from('event_dead_letters')
          .update({
            status: 'pending',
            attempt_count: dl.attempt_count + 1,
            last_failed_at: new Date().toISOString(),
            error_message: msg,
            error_stack: err instanceof Error ? err.stack ?? null : null,
          } as never)
          .eq('id', id);
        return { ok: false, error: msg };
      }
    },
  };
}
