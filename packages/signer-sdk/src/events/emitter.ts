// packages/signer-sdk/src/events/emitter.ts
//
// Typed emitter wrappers around @mcv/events-sdk's createPublisher. Thin
// layer — the heavy lifting (topic validation, schema parse, insert) is
// all in events-sdk. Value here is compile-time typing: callers get
// autocomplete on payload shape per topic + can't accidentally emit
// on a topic that isn't in the SigningContract.

import type { EventPublisher } from '@mcv/events-sdk/publisher';
import type { EventEnvelope, PublishOptions } from '@mcv/events-sdk/types';
import type {
  EnvelopeCreatedPayload,
  EnvelopeViewedPayload,
  EnvelopeSignedPayload,
  EnvelopeVoidedPayload,
  EnvelopeMutationDetectedPayload,
} from '../core/types';

type Without<T, K extends keyof T> = Omit<T, K>;

/** Strip the `topic` field from the core payload types — the emitter
 *  owns the topic string, callers only supply the data. */
export type CreatedInput = Without<EnvelopeCreatedPayload, 'topic'>;
export type ViewedInput = Without<EnvelopeViewedPayload, 'topic'>;
export type SignedInput = Without<EnvelopeSignedPayload, 'topic'>;
export type VoidedInput = Without<EnvelopeVoidedPayload, 'topic'>;
export type MutationInput = Without<EnvelopeMutationDetectedPayload, 'topic'>;

export interface SigningEmitter {
  emitCreated(payload: CreatedInput, opts?: PublishOptions): Promise<EventEnvelope<CreatedInput>>;
  emitViewed(payload: ViewedInput, opts?: PublishOptions): Promise<EventEnvelope<ViewedInput>>;
  emitSigned(payload: SignedInput, opts?: PublishOptions): Promise<EventEnvelope<SignedInput>>;
  emitVoided(payload: VoidedInput, opts?: PublishOptions): Promise<EventEnvelope<VoidedInput>>;
  emitMutation(payload: MutationInput, opts?: PublishOptions): Promise<EventEnvelope<MutationInput>>;
}

/** Compose a typed emitter bound to an existing events-sdk publisher.
 *  Consumers typically call this once at boot and reuse the emitter. */
export function createSigningEmitter(publisher: EventPublisher): SigningEmitter {
  return {
    emitCreated: (payload, opts) => publisher.publish('signing.envelope.created', payload, opts),
    emitViewed: (payload, opts) => publisher.publish('signing.envelope.viewed', payload, opts),
    emitSigned: (payload, opts) => publisher.publish('signing.envelope.signed', payload, opts),
    emitVoided: (payload, opts) => publisher.publish('signing.envelope.voided', payload, opts),
    emitMutation: (payload, opts) =>
      publisher.publish('signing.envelope.mutation-detected', payload, opts),
  };
}
