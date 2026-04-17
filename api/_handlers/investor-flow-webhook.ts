// api/_handlers/investor-flow-webhook.ts
// Inbound webhook handler for payment processor callbacks.
// Routes through the catchall dispatcher as /api/investor-flow-webhook.
//
// M5 I3.2: signature verification is now mandatory for every processor
// (Stripe / Plaid / USDC). No signature, no access. The prior "warn and
// accept" fallback has been removed.
//
// ─── Raw body handling ──────────────────────────────────────────────────
// Stripe signature verification requires byte-exact raw body. We disable
// the Vercel body parser and stream the request ourselves, then JSON-parse
// for our own routing after the signature has been validated.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase';
import {
  verifyStripeWebhook,
  verifyPlaidWebhook,
  verifyUSDCWebhook,
  WebhookVerificationError,
} from '../../src/lib/server/webhook-verify';
import { withRateLimit, LIMITS, getClientIp } from '../../src/lib/server/rate-limit';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
  // USDC-only enrichment for on-chain verification:
  usdc?: {
    tx_signature: string;
    amount: number;
    recipient: string;
    mint: string;
  };
}

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  // If bodyParser already ran (local dev / test), re-serialise.
  if (req.body && typeof req.body === 'object') {
    return Buffer.from(JSON.stringify(req.body), 'utf8');
  }
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  // 1. Read raw body (needed for Stripe + Plaid signature verification).
  let rawBody: Buffer;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'failed to read body';
    return res.status(400).json({ error: `read_body_failed: ${message}` });
  }

  // 2. Parse JSON envelope.
  let body: Partial<WebhookPayload>;
  try {
    body = rawBody.length === 0 ? {} : (JSON.parse(rawBody.toString('utf8')) as Partial<WebhookPayload>);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'invalid json';
    return res.status(400).json({ error: `invalid_json: ${message}` });
  }

  try {
    if (!body.processor) return res.status(400).json({ error: 'processor required' });
    if (!body.event_type) return res.status(400).json({ error: 'event_type required' });
    if (!body.external_id) return res.status(400).json({ error: 'external_id required' });

    // 3. Signature verification — zero-trust. No signature, no access.
    const processor = body.processor.toLowerCase();
    try {
      if (processor === 'stripe') {
        const sig = req.headers['stripe-signature'];
        verifyStripeWebhook(
          rawBody,
          typeof sig === 'string' ? sig : undefined,
          process.env.STRIPE_WEBHOOK_SECRET ?? '',
        );
      } else if (processor === 'plaid') {
        const sig = req.headers['plaid-verification'];
        await verifyPlaidWebhook(
          rawBody,
          typeof sig === 'string' ? sig : undefined,
        );
      } else if (processor === 'usdc') {
        if (!body.usdc) {
          throw new WebhookVerificationError('usdc', 'missing_usdc_payload');
        }
        await verifyUSDCWebhook(body.usdc, process.env.SOLANA_RPC_URL ?? '');
      } else {
        // Unknown processor — refuse.
        return res.status(400).json({ error: `unsupported_processor:${body.processor}` });
      }
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        return res.status(401).json({
          error: err.message,
          processor: err.processor,
          code: err.code,
        });
      }
      throw err;
    }

    // 4. Dedup on (processor, external_id)
    const { data: existing } = await supabase
      .from('payment_events')
      .select('id')
      .eq('processor', body.processor)
      .eq('external_id', body.external_id)
      .maybeSingle();
    if (existing) {
      return res.status(200).json({ deduped: true, event_id: existing.id });
    }

    // 5. Insert event row
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

    // 6. If payment_intent_id correlates, update downstream state
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

export default withRateLimit(LIMITS.WEBHOOK, getClientIp)(handler);
