// packages/events-sdk/src/publisher.ts
//
// createPublisher({ supabase, registry? }) → EventPublisher
//
// Responsibilities:
//   - Validate topic convention + payload against the module's emission schema.
//   - Build a fresh EventEnvelope<T> and INSERT it into event_log.
//   - Return the envelope so callers can chain a causation chain on follow-ups.
//
// Non-goals:
//   - Fan-out to subscribers: Supabase realtime handles that via the
//     supabase_realtime publication (see migration). Subscribers live in
//     subscriber.ts; the publisher doesn't call them.
//   - Transactional guarantees beyond the single event_log INSERT. If the
//     caller needs atomicity with a domain-table INSERT, they should wrap both
//     in the same Supabase transaction.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { EventEnvelope, PublishOptions } from './types.js';
import { envelopeToInsert, makeEnvelope } from './envelope.js';
import type { ContractRegistry } from './registry.js';

export interface PublisherOptions {
  supabase: SupabaseClient;
  /**
   * Optional. When provided, publish() will look up the emission declaration
   * for the given topic and zod-validate the payload before insert. Without
   * a registry, publishes still work but skip schema validation — good for
   * bootstrap + tests.
   */
  registry?: ContractRegistry;
  /**
   * Called once per failed INSERT for logging. Defaults to console.warn.
   * Fabric/Sentry plumbing can swap this in.
   */
  onError?: (err: unknown, envelope: EventEnvelope<unknown>) => void;
}

export interface EventPublisher {
  publish<T>(topic: string, payload: T, opts?: PublishOptions): Promise<EventEnvelope<T>>;
}

export function createPublisher(options: PublisherOptions): EventPublisher {
  const { supabase, registry, onError } = options;

  return {
    async publish<T>(topic: string, payload: T, opts: PublishOptions = {}): Promise<EventEnvelope<T>> {
      // 1. Schema validation (optional, via registry).
      if (registry) {
        const emission = registry.findEmission(topic);
        if (emission) {
          const result = emission.payload.safeParse(payload);
          if (!result.success) {
            const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
            throw new Error(`[events-sdk] payload validation failed for ${topic}: ${issues}`);
          }
        }
        // Topics absent from the registry still publish — bootstrap + legacy
        // topics shouldn't block the bus from lighting up. A CI lint can flag
        // hand-rolled topics later (plan §Risk #5).
      }

      // 2. Build envelope.
      const envelope = makeEnvelope<T>(topic, payload, opts);

      // 3. INSERT into event_log. Cast to `never` on the jsonb side keeps TS
      //    quiet about the open-ended payload type.
      const insertRow = envelopeToInsert(envelope);
      const { error } = await supabase.from('event_log').insert(insertRow as never);
      if (error) {
        (onError ?? defaultOnError)(error, envelope as EventEnvelope<unknown>);
        throw new Error(`[events-sdk] event_log insert failed for ${topic}: ${error.message}`);
      }

      return envelope;
    },
  };
}

function defaultOnError(err: unknown, envelope: EventEnvelope<unknown>): void {
   
  console.warn(`[events-sdk] publish failed`, { topic: envelope.topic, id: envelope.id, err });
}
