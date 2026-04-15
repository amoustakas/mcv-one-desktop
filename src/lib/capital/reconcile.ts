// Shared Capital reconciliation helper.
//
// Epic 13 (Legacy Interop). Every LegacyAdapter with an inbound payment
// path (Plaid, Stripe-inbound, ACH-direct, future Carta contributions…)
// feeds a CapitalPaymentEvent through this helper, which:
//
//   1. If the adapter couldn't uniquely match a commitment → emits a
//      `capital.commitment.review_needed` notification so an admin can
//      reconcile manually. Ambiguity is a *signal*, not an error.
//   2. Otherwise → calls engine.commitments.recordPayment to flip the
//      commitment into the funded state + emits `capital.commitment.
//      reconciled` for Fabric + bell + slack/email fan-out.
//
// Webhook callers wrap this in try/catch and always ACK 200 — a failed
// reconciliation must never cause the foreign system to retry. Admin
// review is the safety net.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CapitalPaymentEvent } from './adapters/types';

export interface ReconcileOpts {
  supabase: SupabaseClient;
  /** Adapter id — used in log prefixes and notification topics. */
  source: 'plaid' | 'stripe' | string;
  /** Short human-readable label for the external reference, e.g. 'transfer'
   *  for Plaid, 'payment intent' for Stripe. Surfaces in notification copy. */
  refLabel: string;
}

export interface ReconcileResult {
  outcome: 'skipped' | 'review_needed' | 'reconciled';
  commitmentId?: string;
  ventureId?: string;
  candidates?: number;
}

/**
 * Drive a CapitalPaymentEvent through recordPayment + notification fanout.
 * Returns early (skipped) on null events. Never throws — errors from the
 * engine or notifications layer are logged and absorbed so the webhook
 * caller can always ACK its origin.
 */
export async function reconcileCapitalPayment(
  event: CapitalPaymentEvent | null,
  opts: ReconcileOpts,
): Promise<ReconcileResult> {
  if (!event) return { outcome: 'skipped' };

  if (!event.commitmentId) {
    console.log(
      `[${opts.source}-reconcile] review needed — ${opts.refLabel} ${event.paymentReference.slice(0, 12)}…, ` +
      `candidates=${event.matchDiagnostics.candidates}`,
    );
    await emitReconcileNotification(opts.supabase, {
      source: opts.source,
      refLabel: opts.refLabel,
      topic: 'capital.commitment.review_needed',
      title: `${opts.refLabel} received but no unique commitment match — $${event.amountUsd.toLocaleString()}`,
      isOk: false,
      event,
    });
    return {
      outcome: 'review_needed',
      candidates: event.matchDiagnostics.candidates,
    };
  }

  // Dynamic import keeps the helper useable from edge-runtime webhooks that
  // can't bundle the whole SDK at build time. The SDK itself is bundled by
  // Vercel on the first invocation and memoized for subsequent ones.
  const { createCapitalEngine } = await import('@mcv/capital-sdk');
  const engine = createCapitalEngine({ supabase: opts.supabase });

  const commitment = await engine.commitments.recordPayment(
    event.commitmentId,
    event.paymentMethod,
    event.paymentReference,
  );
  console.log(
    `[${opts.source}-reconcile] auto-reconciled ${opts.refLabel} ${event.paymentReference.slice(0, 12)}… ` +
    `→ commitment ${event.commitmentId.slice(0, 8)}`,
  );

  await emitReconcileNotification(opts.supabase, {
    source: opts.source,
    refLabel: opts.refLabel,
    topic: 'capital.commitment.reconciled',
    title: `${opts.refLabel} auto-reconciled — $${event.amountUsd.toLocaleString()}`,
    isOk: true,
    event,
    commitmentId: event.commitmentId,
    ventureId: commitment.ventureId ?? undefined,
  });

  return {
    outcome: 'reconciled',
    commitmentId: event.commitmentId,
    ventureId: commitment.ventureId ?? undefined,
    candidates: 1,
  };
}

interface EmitArgs {
  source: string;
  refLabel: string;
  topic: 'capital.commitment.reconciled' | 'capital.commitment.review_needed';
  title: string;
  isOk: boolean;
  event: CapitalPaymentEvent;
  commitmentId?: string;
  ventureId?: string;
}

async function emitReconcileNotification(supabase: SupabaseClient, args: EmitArgs): Promise<void> {
  try {
    const desc = args.isOk
      ? `${args.source} ${args.refLabel} ${args.event.paymentReference.slice(0, 12)}… → commitment ${args.commitmentId?.slice(0, 8) ?? 'unknown'}`
      : `${args.source} ${args.refLabel} ${args.event.paymentReference.slice(0, 12)}… matched ${args.event.matchDiagnostics.candidates} candidates — manual review required`;

    await supabase.from('notifications').insert({
      type: args.isOk ? 'success' : 'warning',
      title: args.title,
      description: desc,
      source: 'capital',
      venture_id: args.ventureId ?? null,
      metadata: {
        topic: args.topic,
        adapter: args.source,
        external_reference: args.event.paymentReference,
        amount_usd: args.event.amountUsd,
        contact_id: args.event.contactId,
        commitment_id: args.commitmentId ?? null,
        candidates: args.event.matchDiagnostics.candidates,
      },
    });
  } catch (err) {
    console.warn(
      `[${args.source}-reconcile] notification emit failed:`,
      err instanceof Error ? err.message : err,
    );
  }
}
