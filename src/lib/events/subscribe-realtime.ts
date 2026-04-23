// src/lib/events/subscribe-realtime.ts
//
// Browser-side thin wrapper around @mcv/events-sdk's createSubscriber bound
// to the shared supabase client. Separate from the SDK so consumers don't
// have to re-wire the client per call; import { subscribeToEvents } and go.

import { supabase } from '../supabase';
import {
  createContractRegistry,
  createSubscriber,
  ALL_CONTRACTS,
  type EventEnvelope,
  type EventSubscriber,
  type SubscriberHandle,
} from '@mcv/events-sdk';

let _subscriber: EventSubscriber | null = null;

function getSubscriber(): EventSubscriber | null {
  if (!supabase) return null;
  if (_subscriber) return _subscriber;
  const registry = createContractRegistry({ contracts: ALL_CONTRACTS });
  _subscriber = createSubscriber({ supabase, registry });
  return _subscriber;
}

/**
 * Subscribe to typed events matching the given topic pattern. Returns a handle
 * with `.unsubscribe()` — safe to call in a React effect cleanup.
 *
 * Examples:
 *   subscribeToEvents('foundation.*',  (e) => ...)   — any foundation event
 *   subscribeToEvents('capital.round.funded', (e) => ...) — exact match
 *   subscribeToEvents('*',            (e) => ...)   — every event
 */
export function subscribeToEvents<T = unknown>(
  topicPattern: string,
  handler: (event: EventEnvelope<T>) => void | Promise<void>,
  opts?: { label?: string },
): SubscriberHandle | null {
  const sub = getSubscriber();
  if (!sub) return null;
  return sub.subscribe<T>(
    topicPattern,
    async (e) => {
      try {
        await handler(e);
      } catch (err) {
        // Mirror the SDK's dispatcher — but in the browser we don't have a DLQ
        // adapter wired. Surface the error via console so the EventStreamView
        // can still show the event landed.
         
        console.warn(`[subscribeToEvents] handler threw on ${e.topic}:`, err);
      }
    },
    opts,
  );
}

/** Tear down the process-wide subscriber — primarily for HMR in dev. */
export async function closeEventSubscriber(): Promise<void> {
  if (_subscriber) {
    await _subscriber.close();
    _subscriber = null;
  }
}
