// packages/events-sdk/src/envelope.ts
//
// Envelope helpers:
//   makeEnvelope()    — builds an EventEnvelope<T> with defaults (id, emittedAt, correlationId…).
//   rowToEnvelope()   — maps snake_case event_log row → camelCase EventEnvelope.
//   topicMatches()    — wildcard-aware topic-pattern matcher (client-side filter; see plan §Risk #1).
//   assertValidTopic() — enforces `<module>.<entity>.<action>` convention.
//
// Runtime deps: none. Pure functions + zod-agnostic.

import type { EventEnvelope, EventLogRow, PublishOptions } from './types.js';

const TOPIC_RE = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*){2,}$/;

/**
 * Validates the `<module>.<entity>.<action>` convention. Rejects empty or malformed
 * topics at publish time — cheaper than letting bad topics land in event_log.
 * Allows deeper nesting (`foundation.counsel.task.completed`) as long as the
 * three-part minimum + kebab-case rule is met.
 */
export function assertValidTopic(topic: string): void {
  if (!TOPIC_RE.test(topic)) {
    throw new Error(
      `[events-sdk] invalid topic "${topic}". Expected "<module>.<entity>.<action>" with lowercase kebab-case parts (e.g. foundation.counsel.nda-executed)`,
    );
  }
}

/**
 * Build a fresh envelope. ID + emittedAt are client-generated here so the
 * caller gets them back before the DB insert round-trips (important for the
 * publisher's causationId chaining). The DB will accept the client ID as long
 * as it passes the uuid check — gen_random_uuid() is the default if we leave
 * id off, but we generate client-side for determinism.
 */
export function makeEnvelope<T>(
  topic: string,
  payload: T,
  opts: PublishOptions = {},
): EventEnvelope<T> {
  assertValidTopic(topic);
  const id = randomUuid();
  return {
    id,
    topic,
    schemaVersion: opts.schemaVersion ?? '1.0',
    // Root events self-correlate (correlationId = id). Cascading events
    // inherit the parent's correlationId so the whole chain shares one.
    correlationId: opts.correlationId ?? id,
    causationId: opts.causationId ?? null,
    ventureId: opts.ventureId ?? null,
    emittedAt: new Date().toISOString(),
    emittedBy: opts.emittedBy ?? 'system:unknown',
    payload,
    status: 'published',
  };
}

/**
 * Client-safe UUID generator. Uses Web Crypto when available (modern Node, all
 * browsers, Deno), falls back to a non-cryptographic RFC-4122 shape so
 * environments without crypto.randomUUID still get a parseable id. The fallback
 * is fine for correlation ids where uniqueness matters more than
 * unpredictability.
 */
export function randomUuid(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  // RFC-4122 v4 shape, Math.random backed — sufficient for correlation ids.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Map an event_log row (snake_case) → EventEnvelope (camelCase). Used by the
 * subscriber when it receives a realtime INSERT and by the replay service
 * when it re-issues archived events.
 */
export function rowToEnvelope<T = unknown>(row: EventLogRow): EventEnvelope<T> {
  return {
    id: row.id,
    topic: row.topic,
    schemaVersion: row.schema_version,
    correlationId: row.correlation_id,
    causationId: row.causation_id,
    ventureId: row.venture_id,
    emittedAt: row.emitted_at,
    emittedBy: row.emitted_by,
    payload: row.payload as T,
    status: row.status,
  };
}

/**
 * Inverse of rowToEnvelope — maps an EventEnvelope to the insert shape
 * event_log expects. Kept separate from makeEnvelope so publishers can decide
 * whether to chain a client-side id or let the DB generate one.
 */
export function envelopeToInsert<T>(envelope: EventEnvelope<T>): Omit<EventLogRow, 'id'> & { id?: string } {
  return {
    id: envelope.id,
    topic: envelope.topic,
    schema_version: envelope.schemaVersion,
    correlation_id: envelope.correlationId,
    causation_id: envelope.causationId,
    venture_id: envelope.ventureId,
    emitted_at: envelope.emittedAt,
    emitted_by: envelope.emittedBy,
    payload: envelope.payload as unknown,
    status: envelope.status,
  };
}

/**
 * Topic pattern matcher. Supports:
 *   - exact match:        `foundation.counsel.nda-executed` === topic
 *   - trailing wildcard:  `foundation.*`         — any topic starting with `foundation.`
 *   - segment wildcard:   `foundation.*.executed` — any one-segment substitution
 *   - global wildcard:    `*`                     — matches everything
 *
 * Per plan §Risk #1, Supabase realtime filters are row-level only, so subscribers
 * subscribe to the whole event_log table + apply this matcher client-side.
 */
export function topicMatches(topic: string, pattern: string): boolean {
  if (pattern === '*' || pattern === topic) return true;
  const topicParts = topic.split('.');
  const patternParts = pattern.split('.');

  // Trailing `*` — matches any number of remaining segments (prefix match).
  if (patternParts[patternParts.length - 1] === '*') {
    const prefix = patternParts.slice(0, -1);
    if (topicParts.length < prefix.length) return false;
    return prefix.every((seg, i) => seg === '*' || seg === topicParts[i]);
  }

  // Strict segment-count equality for segment wildcards.
  if (topicParts.length !== patternParts.length) return false;
  return patternParts.every((seg, i) => seg === '*' || seg === topicParts[i]);
}
