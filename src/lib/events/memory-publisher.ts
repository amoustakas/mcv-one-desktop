// Memory Event Publisher — sim-mode EventPublisher implementation.
//
// Implements the @mcv/events-sdk EventPublisher interface without any
// Supabase dependency, so sim runs can exercise the event-bus path in
// memory. Used by the Milofish sim-mode kernel (study-gate.ts) to
// forward captured DispatchEvents through a publisher-shaped boundary,
// proving the integration with the real @mcv/events-sdk pipeline works
// before real credentials are wired.
//
// Production code uses createPublisher() from @mcv/events-sdk/publisher;
// sim and test code uses this class. Both satisfy the same interface,
// so call sites are swap-compatible.

import type { EventPublisher } from '@mcv/events-sdk/publisher';
import type { EventEnvelope, PublishOptions } from '@mcv/events-sdk/types';
import { makeEnvelope } from '@mcv/events-sdk/envelope';

export interface MemoryPublisherOptions {
  /** Ring-buffer capacity. Oldest events dropped when exceeded. Default 1000. */
  capacity?: number;
  /** Optional callback fired after every successful publish (live dashboards). */
  onPublish?: (envelope: EventEnvelope<unknown>) => void;
}

/**
 * In-memory EventPublisher with the same publish() contract as the Supabase
 * publisher. Envelopes are built via the canonical makeEnvelope() so ids,
 * correlation, and timestamps match real-mode exactly — sim-parity
 * guaranteed at the envelope layer.
 */
export class MemoryEventPublisher implements EventPublisher {
  private buffer: EventEnvelope<unknown>[] = [];
  private readonly capacity: number;
  private readonly onPublish?: (envelope: EventEnvelope<unknown>) => void;

  constructor(options: MemoryPublisherOptions = {}) {
    this.capacity = options.capacity ?? 1000;
    this.onPublish = options.onPublish;
  }

  async publish<T>(topic: string, payload: T, opts: PublishOptions = {}): Promise<EventEnvelope<T>> {
    const envelope = makeEnvelope<T>(topic, payload, opts);
    this.buffer.unshift(envelope as EventEnvelope<unknown>);
    if (this.buffer.length > this.capacity) {
      this.buffer.length = this.capacity;
    }
    this.onPublish?.(envelope as EventEnvelope<unknown>);
    return envelope;
  }

  /** Return most-recent-first snapshot of captured envelopes. */
  list(options: { limit?: number; topicPrefix?: string } = {}): EventEnvelope<unknown>[] {
    const limit = options.limit ?? this.buffer.length;
    const filtered = options.topicPrefix
      ? this.buffer.filter((e) => e.topic.startsWith(options.topicPrefix!))
      : this.buffer;
    return filtered.slice(0, limit);
  }

  /** Total envelopes currently held in the buffer. */
  size(): number {
    return this.buffer.length;
  }

  /** Drop all captured envelopes. */
  clear(): void {
    this.buffer.length = 0;
  }

  /** Envelopes matching an exact topic string. */
  byTopic(topic: string): EventEnvelope<unknown>[] {
    return this.buffer.filter((e) => e.topic === topic);
  }

  /** Envelopes sharing a correlationId (full cascade view). */
  byCorrelation(correlationId: string): EventEnvelope<unknown>[] {
    return this.buffer.filter((e) => e.correlationId === correlationId);
  }
}
