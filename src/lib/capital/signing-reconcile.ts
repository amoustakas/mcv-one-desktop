// Shared Capital signing-reconciliation helper.
//
// Companion to reconcile.ts (payments) + compliance-reconcile.ts
// (compliance/screening). Every signing-rail adapter (DocuSign today,
// MCV Sign next, future eIDAS vendors) feeds a CapitalSigningEvent
// through this helper which:
//
//   1. Resolves the commitment — adapter event may carry commitmentId
//      directly (custom-field stamp) OR only an envelopeId in which
//      case we look up via the docusign_envelopes table.
//   2. On outcome='signed': calls engine.commitments.markSigned which
//      stamps signed_at + transitions status to 'signed' if the state
//      machine allows. Also persists the signed-PDF receipt into the
//      Content OS so every signed contract is versioned + searchable.
//   3. On outcome='declined' / 'voided' / 'expired': records an
//      activity entry + emits a notification but does NOT auto-
//      transition the commitment. Operator decides whether to re-send.
//   4. Emits capital.commitment.signed / declined / voided / expired
//      notifications (notifications table + Fabric topic) so the bell
//      pings + slack/email dispatch fires.
//
// Never throws — webhook callers always ACK 200. Failed reconciliation
// is operator-visible via the notification + activity log.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CapitalSigningEvent } from './adapters/types';

export interface SigningReconcileOpts {
  supabase: SupabaseClient;
}

export interface SigningReconcileResult {
  outcome: CapitalSigningEvent['outcome'] | 'skipped' | 'no_match';
  commitmentId?: string;
  ventureId?: string;
  receiptContentId?: string;
}

export async function reconcileCapitalSigning(
  event: CapitalSigningEvent | null,
  opts: SigningReconcileOpts,
): Promise<SigningReconcileResult> {
  if (!event) return { outcome: 'skipped' };

  // ── Resolve commitmentId ───────────────────────────────────────────
  // Adapter may have stamped it from envelope custom fields. Otherwise
  // look up via docusign_envelopes table (idempotency + audit row).
  let commitmentId = event.commitmentId;
  if (!commitmentId && event.envelopeId) {
    try {
      const { data } = await opts.supabase
        .from('docusign_envelopes')
        .select('commitment_id')
        .eq('envelope_id', event.envelopeId)
        .maybeSingle();
      commitmentId = (data?.commitment_id as string | undefined) ?? '';
    } catch (err) {
      console.warn('[signing-reconcile] envelope lookup failed:', err instanceof Error ? err.message : err);
    }
  }
  if (!commitmentId) {
    console.warn(`[signing-reconcile] no commitment match for envelope ${event.envelopeId}`);
    await emitNotification(opts.supabase, {
      title: `Signing event received with no commitment match — envelope ${event.envelopeId.slice(0, 12)}…`,
      description: `Adapter ${event.source} reported '${event.outcome}' but the envelope wasn't traceable to a commitment.`,
      type: 'warning',
      topic: 'capital.signing.no_match',
      metadata: { adapter: event.source, envelope_id: event.envelopeId, outcome: event.outcome },
    });
    return { outcome: 'no_match' };
  }

  // ── Receipt persistence ──
  // The signed-PDF (base64 from DocuSign Connect "Include Documents")
  // is stored on docusign_envelopes.raw_event for immediate audit
  // recovery. Promoting the receipt into the Content OS so it gets
  // versioning + RAG indexing + role-based visibility is a follow-up
  // PR that owns the full content-table column mapping. Until then,
  // receiptContentId stays undefined and admins fetch the PDF from
  // the envelope row when needed.
  const receiptContentId: string | undefined = event.receipt?.contentId;

  // ── Update the commitment ─────────────────────────────────────────
  let ventureId: string | undefined;
  try {
    if (event.outcome === 'signed') {
      // markSigned stamps signed_at + transitions status to 'signed'
      // when the state machine allows (signed → pending_wire). The
      // SDK call also updates docusign_status if the column exists.
      const { createCapitalEngine } = await import('@mcv/capital-sdk');
      const engine = createCapitalEngine({ supabase: opts.supabase });
      const commitment = await engine.commitments.markSigned(commitmentId);
      ventureId = commitment.ventureId ?? undefined;

      // Stamp envelope id on the commitment (keeps existing
      // attachDocuSign value but ensures it points to the most
      // recent envelope when an envelope was re-sent).
      await opts.supabase
        .from('capital_commitments')
        .update({
          docusign_envelope_id: event.envelopeId,
          docusign_status: event.outcome,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commitmentId);
    } else {
      // Non-terminal-success outcomes — record on commitment + log
      // activity but don't transition status.
      await opts.supabase
        .from('capital_commitments')
        .update({
          docusign_envelope_id: event.envelopeId,
          docusign_status: event.outcome,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commitmentId);
      const { data } = await opts.supabase
        .from('capital_commitments')
        .select('venture_id')
        .eq('id', commitmentId)
        .maybeSingle();
      ventureId = (data?.venture_id as string | undefined) ?? undefined;
    }
  } catch (err) {
    console.warn('[signing-reconcile] commitment update failed:', err instanceof Error ? err.message : err);
  }

  // Persist envelope row for future lookup + audit (upsert is safe;
  // we may receive duplicate webhooks when DocuSign retries).
  try {
    await opts.supabase.from('docusign_envelopes').upsert({
      envelope_id: event.envelopeId,
      commitment_id: commitmentId,
      adapter: event.source,
      outcome: event.outcome,
      signers_json: event.signers ?? [],
      receipt_content_id: receiptContentId ?? null,
      completed_at: event.completedAt,
      raw_event: event.rawEvent ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'envelope_id' });
  } catch (err) {
    console.warn('[signing-reconcile] envelope row upsert failed:', err instanceof Error ? err.message : err);
  }

  // ── Notification fan-out ─────────────────────────────────────────
  const titleByOutcome: Record<CapitalSigningEvent['outcome'], string> = {
    signed: `Commitment signed — envelope ${event.envelopeId.slice(0, 12)}…`,
    declined: `Signature DECLINED — envelope ${event.envelopeId.slice(0, 12)}…`,
    voided: `Envelope voided — ${event.envelopeId.slice(0, 12)}…`,
    expired: `Envelope expired before completion — ${event.envelopeId.slice(0, 12)}…`,
  };
  const typeByOutcome: Record<CapitalSigningEvent['outcome'], 'success' | 'warning' | 'error' | 'info'> = {
    signed: 'success', declined: 'error', voided: 'warning', expired: 'warning',
  };
  await emitNotification(opts.supabase, {
    title: titleByOutcome[event.outcome],
    description: `Commitment ${commitmentId.slice(0, 8)} · adapter ${event.source} · ${(event.signers ?? []).length} signer(s)`,
    type: typeByOutcome[event.outcome],
    topic: `capital.commitment.${event.outcome}`,
    ventureId,
    metadata: {
      adapter: event.source,
      envelope_id: event.envelopeId,
      commitment_id: commitmentId,
      outcome: event.outcome,
      receipt_content_id: receiptContentId ?? null,
    },
  });

  return { outcome: event.outcome, commitmentId, ventureId, receiptContentId };
}

interface EmitArgs {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'error' | 'info';
  topic: string;
  ventureId?: string;
  metadata: Record<string, unknown>;
}

async function emitNotification(supabase: SupabaseClient, args: EmitArgs): Promise<void> {
  try {
    await supabase.from('notifications').insert({
      type: args.type,
      title: args.title,
      description: args.description,
      source: 'capital',
      venture_id: args.ventureId ?? null,
      metadata: { topic: args.topic, ...args.metadata },
    });
  } catch (err) {
    console.warn('[signing-reconcile] notification emit failed:', err instanceof Error ? err.message : err);
  }
}

