// MCV Sign audit trail writer.
//
// Every state transition of an envelope appends one row to
// signing_envelope_audit. DB-level triggers block UPDATE + DELETE on
// this table so the trail is tamper-evident. Corrections are written
// as new rows with a 'content_mutation_detected' event type + payload
// pointing to the superseded row.
//
// Never throws — audit is best-effort from the caller's perspective.
// A missing audit entry is a signal the caller should log, not block
// on. (The database trigger + RLS is the real integrity guarantee.)

import type { SupabaseClient } from '@supabase/supabase-js';

export type AuditEventType =
  | 'envelope_created'
  | 'envelope_sent'
  | 'token_issued'
  | 'signer_viewed'
  | 'signature_applied'
  | 'envelope_completed'
  | 'envelope_declined'
  | 'envelope_voided'
  | 'envelope_expired'
  | 'content_mutation_detected';

export interface AuditEvent {
  envelopeId: string;
  eventType: AuditEventType;
  actor?: string;
  actorType?: 'user' | 'signer' | 'system';
  payload?: Record<string, unknown>;
}

export async function appendAuditEvent(
  supabase: SupabaseClient,
  event: AuditEvent,
): Promise<void> {
  try {
    await supabase.from('signing_envelope_audit').insert({
      envelope_id: event.envelopeId,
      event_type: event.eventType,
      actor: event.actor ?? null,
      actor_type: event.actorType ?? 'system',
      payload: event.payload ?? {},
    });
  } catch (err) {
    console.warn(
      '[mcv-sign-audit] append failed:',
      err instanceof Error ? err.message : err,
    );
  }
}
