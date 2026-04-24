// packages/signer-sdk/src/events/subscriber-template.ts
//
// Copy-paste scaffold for consumers building a signing-observer. Shows
// the canonical shape: subscribe to `signing.*`, branch on topic, route
// to a domain handler. Not a runnable file on its own — consumers
// instantiate createSigningObserver with their own handlers.
//
// Mirrors the shape of @mcv/intelligence-sdk-router's knowledge-observer
// (see project_adk_phase1_landed memory) so cross-module subscribers
// look consistent across the Agentic OS.

import type { EventSubscriber } from '@mcv/events-sdk/subscriber';
import type { EventEnvelope, SubscriberHandle } from '@mcv/events-sdk/types';
import type {
  EnvelopeCreatedPayload,
  EnvelopeViewedPayload,
  EnvelopeSignedPayload,
  EnvelopeVoidedPayload,
  EnvelopeMutationDetectedPayload,
} from '../core/types';
import type { CreatedInput, ViewedInput, SignedInput, VoidedInput, MutationInput } from './emitter';

export interface SigningObserverHandlers {
  onCreated?: (envelope: EventEnvelope<CreatedInput>) => Promise<void>;
  onViewed?: (envelope: EventEnvelope<ViewedInput>) => Promise<void>;
  onSigned?: (envelope: EventEnvelope<SignedInput>) => Promise<void>;
  onVoided?: (envelope: EventEnvelope<VoidedInput>) => Promise<void>;
  onMutation?: (envelope: EventEnvelope<MutationInput>) => Promise<void>;
}

export interface SigningObserverOptions {
  subscriber: EventSubscriber;
  handlers: SigningObserverHandlers;
  /** Observer label — shows up in DLQ rows + Supabase realtime channel name. */
  label?: string;
}

/** Subscribe to all `signing.*` topics with one realtime channel and
 *  dispatch to per-topic handlers. Returns a tear-down handle for
 *  clean shutdown. */
export function createSigningObserver(options: SigningObserverOptions): SubscriberHandle {
  const { subscriber, handlers, label = 'signing-observer' } = options;

  return subscriber.subscribe('signing.*', async (envelope) => {
    switch (envelope.topic) {
      case 'signing.envelope.created':
        if (handlers.onCreated) await handlers.onCreated(envelope as EventEnvelope<CreatedInput>);
        return;
      case 'signing.envelope.viewed':
        if (handlers.onViewed) await handlers.onViewed(envelope as EventEnvelope<ViewedInput>);
        return;
      case 'signing.envelope.signed':
        if (handlers.onSigned) await handlers.onSigned(envelope as EventEnvelope<SignedInput>);
        return;
      case 'signing.envelope.voided':
        if (handlers.onVoided) await handlers.onVoided(envelope as EventEnvelope<VoidedInput>);
        return;
      case 'signing.envelope.mutation-detected':
        if (handlers.onMutation) await handlers.onMutation(envelope as EventEnvelope<MutationInput>);
        return;
      default:
        // Unknown signing.* topic — future-proofed. Log + continue so
        // schema-additions on the emitter side don't crash existing
        // observers. Consumers with strict allow-listing can wrap this
        // observer in their own guard.
        return;
    }
  }, { label });
}

// Re-export the payload types so consumers that build only a subscriber
// don't need a second import line.
export type {
  EnvelopeCreatedPayload,
  EnvelopeViewedPayload,
  EnvelopeSignedPayload,
  EnvelopeVoidedPayload,
  EnvelopeMutationDetectedPayload,
};
