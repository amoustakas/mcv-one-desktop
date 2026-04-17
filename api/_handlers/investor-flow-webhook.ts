// api/_handlers/investor-flow-webhook.ts
// Inbound webhook handler for payment processor callbacks.
// Routes through the catchall dispatcher as /api/investor-flow-webhook.
//
// For M2, signature verification accepts any non-empty string. Production hardening
// (Stripe signed-payload verify, Plaid webhook-verify, USDC on-chain confirmation)
// lands in a follow-up.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase';

const supabase = getServiceClient();

interface WebhookPayload {
  processor: string;
  event_type: string;
  external_id: string;
  external_signature?: string;
  payment_intent_id?: string;
  amount_cents?: number;
  currency?: string;
  status?: string;
  error_message?: string;
  payload: Record<string, unknown>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  const body = (req.body ?? {}) as Partial<WebhookPayload>;

  try {
    if (!body.processor) return res.status(400).json({ error: 'processor required' });
    if (!body.event_type) return res.status(400).json({ error: 'event_type required' });
    if (!body.external_id) return res.status(400).json({ error: 'external_id required' });
    if (!body.external_signature) {
      console.warn('[investor-flow-webhook] missing signature — accepting for M2; production requires verification');
    }

    // 1. Dedup on (processor, external_id)
    const { data: existing } = await supabase
      .from('payment_events')
      .select('id')
      .eq('processor', body.processor)
      .eq('external_id', body.external_id)
      .maybeSingle();
    if (existing) {
      return res.status(200).json({ deduped: true, event_id: existing.id });
    }

    // 2. Insert event row
    const { data: eventRow, error: evErr } = await supabase
      .from('payment_events')
      .insert({
        processor: body.processor,
        event_type: body.event_type,
        external_id: body.external_id,
        external_signature: body.external_signature ?? null,
        payment_id: body.payment_intent_id ?? null,
        amount_cents: body.amount_cents ?? null,
        currency: body.currency ?? 'USD',
        status: body.status ?? null,
        error_message: body.error_message ?? null,
        payload: body.payload ?? {},
      })
      .select('id')
      .single();
    if (evErr) throw evErr;

    let commitment_funded = false;

    // 3. If payment_intent_id correlates, update downstream state
    if (body.payment_intent_id) {
      const succeeded = body.event_type === 'payment_intent.succeeded' || body.status === 'succeeded';
      const failed = body.event_type === 'payment_failed' || body.status === 'failed';

      if (succeeded || failed) {
        const intentStatus = succeeded ? 'completed' : 'failed';
        const { data: intent, error: intentErr } = await supabase
          .from('payment_intents')
          .update({ status: intentStatus, updated_at: new Date().toISOString() })
          .eq('id', body.payment_intent_id)
          .select('id, venture_id, processor_id, amount, currency, metadata')
          .single();

        if (intentErr) {
          console.error('[investor-flow-webhook] payment_intent update failed:', intentErr);
        } else if (intent && succeeded) {
          // Insert payment_records for the settlement
          const { error: recErr } = await supabase.from('payment_records').insert({
            payment_intent_id: intent.id,
            venture_id: intent.venture_id,
            amount: intent.amount,
            currency: intent.currency,
            processor: body.processor,
            rail: ((intent.metadata as Record<string, unknown>)?.rail as string | undefined) ?? body.processor,
            status: 'completed',
            metadata: { external_id: body.external_id, event_type: body.event_type },
          });
          if (recErr) {
            console.error('[investor-flow-webhook] payment_records insert failed:', recErr);
          }

          // Correlate commitment via metadata.commitment_id
          const commitment_id = (intent.metadata as Record<string, unknown>)?.commitment_id as string | undefined;
          if (commitment_id) {
            const now = new Date().toISOString();
            const { data: commitment, error: cErr } = await supabase
              .from('capital_commitments')
              .update({
                status: 'funded',
                funded_at: now,
                payment_received_at: now,
                updated_at: now,
              })
              .eq('id', commitment_id)
              .select('id, venture_id, round_id, contact_id')
              .single();
            if (cErr) {
              console.error('[investor-flow-webhook] commitment funded-update failed:', cErr);
            } else if (commitment) {
              commitment_funded = true;
              const { error: actErr } = await supabase.from('capital_activities').insert({
                venture_id: commitment.venture_id,
                contact_id: commitment.contact_id,
                round_id: commitment.round_id,
                commitment_id: commitment.id,
                activity_type: 'payment_received',
                title: `Payment received: ${intent.currency} ${intent.amount}`,
                description: `Webhook ${body.processor} ${body.event_type} — commitment marked funded`,
                previous_value: 'reserved',
                new_value: 'funded',
                actor_id: body.processor,
                actor_type: 'webhook',
                metadata: { external_id: body.external_id, payment_intent_id: intent.id },
              });
              if (actErr) {
                console.error('[investor-flow-webhook] capital_activities insert failed — non-fatal:', actErr);
              }
            }
          }
        }
      }
    }

    return res.status(200).json({ ok: true, event_id: eventRow?.id, commitment_funded });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'webhook failed';
    console.error('[investor-flow-webhook] error:', message);
    return res.status(500).json({ error: message });
  }
}
