// packages/events-sdk/src/subscriber.ts
//
// createSubscriber({ supabase, deadLetters?, registry? }) → EventSubscriber
//
// Transport: Supabase realtime INSERTs on event_log. Per plan §Risk #1,
// realtime filters are row-level only, so we subscribe to the whole table
// and client-side filter by topic pattern (see envelope.topicMatches).
//
// Error handling: every handler invocation is wrapped. A thrown handler does
// NOT block other subscribers, does NOT break the channel, and lands the
// failure in event_dead_letters (if the DLQ adapter is wired).

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type {
  EventEnvelope,
  EventHandler,
  EventLogRow,
  SubscriberHandle,
} from './types.js';
import { randomUuid, rowToEnvelope, topicMatches } from './envelope.js';
import type { DeadLetterService } from './dead-letter.js';
import type { ContractRegistry } from './registry.js';

export interface SubscriberOptions {
  supabase: SupabaseClient;
  /** Optional DLQ adapter — failed handlers get logged here. */
  deadLetters?: DeadLetterService;
  /** Optional registry — enables payload re-validation at subscribe boundary (plan §3). */
  registry?: ContractRegistry;
  /** Custom channel name (multiple subscribers can share one; default: 'events-sdk:event_log'). */
  channelName?: string;
}

export interface EventSubscriber {
  subscribe<T = unknown>(topicPattern: string, handler: EventHandler<T>, opts?: SubscribeOptions): SubscriberHandle;
  /** Tear down the realtime channel. After close(), all handles are no-ops. */
  close(): Promise<void>;
}

export interface SubscribeOptions {
  /** Stable identifier for DLQ rows, e.g. 'agent:argus' or 'workflow:nda-cascade'. Defaults to handle id. */
  label?: string;
  /**
   * When true, events-sdk re-validates the payload against the registered
   * emission schema before calling the handler. Default: true when a registry
   * is configured.
   */
  validateOnReceive?: boolean;
}

// A single process-wide subscription registry, scoped to the Subscriber
// instance. The realtime channel is shared across all topic patterns so we
// don't burn connection slots.
interface InternalSub {
  id: string;
  label: string;
  topicPattern: string;
  handler: EventHandler<unknown>;
  validateOnReceive: boolean;
}

export function createSubscriber(options: SubscriberOptions): EventSubscriber {
  const { supabase, deadLetters, registry } = options;
  const channelName = options.channelName ?? `events-sdk:event_log:${randomUuid().slice(0, 8)}`;

  const subs = new Map<string, InternalSub>();
  let channel: RealtimeChannel | null = null;
  let channelReady = false;

  function ensureChannel() {
    if (channel) return;
    channel = supabase
      .channel(channelName)
      .on(
        // Supabase realtime "postgres_changes" event. See plan §Risk #1 — we
        // can't filter by `topic LIKE 'foundation.%'` because filters are
        // column-equality only. So we take all INSERTs on event_log and
        // client-side filter.
        'postgres_changes' as never,
        { event: 'INSERT', schema: 'public', table: 'event_log' } as never,
        (payload: { new: EventLogRow }) => {
          const row = payload.new;
          if (!row) return;
          const envelope = rowToEnvelope(row);
          void dispatch(envelope);
        },
      )
      .subscribe((status) => {
        channelReady = status === 'SUBSCRIBED';
      });
  }

  async function dispatch(envelope: EventEnvelope<unknown>): Promise<void> {
    // Snapshot the subs map — a handler that unsubscribes during dispatch
    // shouldn't break the iteration for the rest.
    const snapshot = Array.from(subs.values());
    for (const sub of snapshot) {
      if (!topicMatches(envelope.topic, sub.topicPattern)) continue;

      // Optional subscribe-boundary validation. Catches producer major
      // bumps where a consumer is still on the old shape.
      if (sub.validateOnReceive && registry) {
        const emission = registry.findEmission(envelope.topic);
        if (emission) {
          const result = emission.payload.safeParse(envelope.payload);
          if (!result.success) {
            await recordDeadLetter(
              envelope,
              sub.label,
              new Error(
                `payload validation failed at subscribe boundary for ${envelope.topic}: ${result.error.issues.map((i) => i.message).join('; ')}`,
              ),
            );
            continue;
          }
        }
      }

      try {
        await sub.handler(envelope);
      } catch (err) {
        await recordDeadLetter(envelope, sub.label, err);
      }
    }
  }

  async function recordDeadLetter(
    envelope: EventEnvelope<unknown>,
    subscriberLabel: string,
    err: unknown,
  ): Promise<void> {
    const error = err instanceof Error ? err : new Error(String(err));
     
    console.warn(`[events-sdk] subscriber ${subscriberLabel} failed on ${envelope.topic}:`, error.message);
    if (!deadLetters) return;
    try {
      await deadLetters.record({
        eventId: envelope.id,
        topic: envelope.topic,
        subscriberLabel,
        errorMessage: error.message,
        errorStack: error.stack,
      });
    } catch (dlErr) {
       
      console.warn('[events-sdk] failed to record dead letter:', dlErr);
    }
  }

  return {
    subscribe<T = unknown>(
      topicPattern: string,
      handler: EventHandler<T>,
      subOpts: SubscribeOptions = {},
    ): SubscriberHandle {
      ensureChannel();
      const id = randomUuid();
      const sub: InternalSub = {
        id,
        label: subOpts.label ?? `anon:${id.slice(0, 8)}`,
        topicPattern,
        handler: handler as EventHandler<unknown>,
        validateOnReceive: subOpts.validateOnReceive ?? !!registry,
      };
      subs.set(id, sub);
      return {
        id,
        topicPattern,
        async unsubscribe() {
          subs.delete(id);
        },
      };
    },
    async close() {
      subs.clear();
      if (channel) {
        await supabase.removeChannel(channel);
        channel = null;
        channelReady = false;
      }
      void channelReady; // quiet unused-var lint in environments that report it
    },
  };
}
