// api/_handlers/ops-health.ts
//
// Operational health snapshot — complements /api/health (static env-var
// config) with live activity counts pulled from the payment_events audit
// log, venture_docs embedding state, storage_chunks distribution, OAuth
// connection health, and a cron freshness check inferred from the last
// row each audit table has seen.
//
// Read-only, service-role reads. Clerk-gated so only logged-in users see
// it, but nothing here is PII — just counts + ISO timestamps.
//
// Shape:
//   {
//     generated_at,
//     payments: { last_24h: { total, by_type, by_status }, last_event_at },
//     webhooks: { stripe: {...}, plaid: {...} },
//     rag: {
//       venture_docs: { total, embedded, stale, last_embed_at },
//       storage_chunks: { total, by_source }
//     },
//     oauth: { active, expired, expiring_soon_1h },
//     crons: [ { path, schedule, signal, last_seen_at, stale_by_seconds } ]
//   }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient, requireAuth } from './_supabase.js';

import { requestLogger } from '../../src/lib/server/logger';
interface Bucket { [key: string]: number }

async function countBy(
  supabase: ReturnType<typeof getServiceClient>,
  table: string,
  column: string,
  sinceISO: string,
): Promise<Bucket> {
  // Supabase doesn't have a native "group by" in the REST API; pull the
  // relevant rows and aggregate in-process. Capped at 5,000 to keep the
  // endpoint snappy — ops-health is a status board, not a report.
  const { data } = await supabase
    .from(table)
    .select(column)
    .gte('created_at', sinceISO)
    .limit(5000);

  const out: Bucket = {};
  const rows = (data ?? []) as unknown as Array<Record<string, string | null>>;
  for (const row of rows) {
    const key = row[column] ?? 'unknown';
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  const ctx = await requireAuth(req, res);
  if (!ctx) return;

  const supabase = getServiceClient();
  const nowISO = new Date().toISOString();
  const dayAgoISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const hourAgoISO = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const oneHourFromNowISO = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  try {
    // ── Payments ──────────────────────────────────────────────────────
    const [paymentsByType, paymentsByStatus, paymentsLast24h, lastPaymentEvent] =
      await Promise.all([
        countBy(supabase, 'payment_events', 'event_type', dayAgoISO),
        countBy(supabase, 'payment_events', 'status', dayAgoISO),
        supabase
          .from('payment_events')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', dayAgoISO),
        supabase
          .from('payment_events')
          .select('created_at, event_type, processor')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    // ── Webhooks (stripe + plaid) — inferred from payment_events ─────
    const stripeLast24h = Object.entries(paymentsByType)
      .filter(([k]) => k.startsWith('charge.') || k.startsWith('refund.') || k.startsWith('payout.') || k.startsWith('transfer.') || k.startsWith('dispute.') || k.startsWith('subscription.'))
      .reduce((sum, [, n]) => sum + n, 0);
    const [stripeLastEvent, plaidLastEvent] = await Promise.all([
      supabase
        .from('payment_events')
        .select('created_at')
        .eq('processor', 'stripe')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('payment_events')
        .select('created_at')
        .eq('processor', 'plaid')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // ── RAG — venture_docs + storage_chunks ──────────────────────────
    const [ventureDocsTotal, ventureDocsEmbedded, lastEmbed, chunkTotal, chunksByFile, chunksByVentureDoc] =
      await Promise.all([
        supabase.from('venture_docs').select('id', { count: 'exact', head: true }),
        supabase
          .from('venture_docs')
          .select('id', { count: 'exact', head: true })
          .not('last_embedded_at', 'is', null),
        supabase
          .from('venture_docs')
          .select('last_embedded_at')
          .not('last_embedded_at', 'is', null)
          .order('last_embedded_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('storage_chunks').select('id', { count: 'exact', head: true }),
        supabase
          .from('storage_chunks')
          .select('id', { count: 'exact', head: true })
          .not('file_id', 'is', null),
        supabase
          .from('storage_chunks')
          .select('id', { count: 'exact', head: true })
          .eq('source_type', 'venture_doc'),
      ]);

    const totalDocs = ventureDocsTotal.count ?? 0;
    const embeddedDocs = ventureDocsEmbedded.count ?? 0;

    // ── OAuth health ──────────────────────────────────────────────────
    const [oauthActive, oauthExpired, oauthExpiringSoon] = await Promise.all([
      supabase
        .from('oauth_connections')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('oauth_connections')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'expired'),
      supabase
        .from('oauth_connections')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('token_expires_at', nowISO)
        .lte('token_expires_at', oneHourFromNowISO),
    ]);

    // ── Crons — infer freshness from a signal table each cron writes ──
    // We don't have a cron registry so we infer by looking at a row each
    // cron is known to produce. last_seen_at = "latest mutation in the
    // signal table"; stale_by_seconds compares against the cron schedule.
    const [
      complianceCronSignal,
      embedCronSignal,
    ] = await Promise.all([
      // Compliance runs every 60 min — look at any recent payment_events
      // (dunning retries) or fraud_checks row as a proxy. Use the latest
      // of the two.
      supabase
        .from('payment_events')
        .select('created_at')
        .gte('created_at', hourAgoISO)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      // venture-docs-embed runs every 30 min — last_embedded_at is the
      // ground truth, already fetched above; reuse that.
      Promise.resolve(lastEmbed),
    ]);

    const secondsSince = (iso: string | null | undefined): number | null => {
      if (!iso) return null;
      const d = new Date(iso).getTime();
      if (Number.isNaN(d)) return null;
      return Math.round((Date.now() - d) / 1000);
    };

    const crons = [
      {
        path: '/api/compliance-cron',
        schedule: '0 * * * *',
        budget_seconds: 60 * 60,
        last_seen_at: complianceCronSignal.data?.created_at ?? null,
        stale_by_seconds: secondsSince(complianceCronSignal.data?.created_at),
      },
      {
        path: '/api/venture-docs-embed',
        schedule: '*/30 * * * *',
        budget_seconds: 30 * 60,
        last_seen_at: (embedCronSignal as typeof lastEmbed).data?.last_embedded_at ?? null,
        stale_by_seconds: secondsSince((embedCronSignal as typeof lastEmbed).data?.last_embedded_at),
      },
      {
        path: '/api/cron-asset-rediscovery',
        schedule: '0 6 * * *',
        budget_seconds: 24 * 60 * 60,
        // No clean signal table for this one yet — report null; UI shows
        // "no signal" and doesn't flag stale until we add tracking.
        last_seen_at: null,
        stale_by_seconds: null,
      },
    ];

    return res.json({
      generated_at: nowISO,
      payments: {
        last_24h: {
          total: paymentsLast24h.count ?? 0,
          by_type: paymentsByType,
          by_status: paymentsByStatus,
        },
        last_event: lastPaymentEvent.data ?? null,
      },
      webhooks: {
        stripe: {
          last_event_at: stripeLastEvent.data?.created_at ?? null,
          events_last_24h: stripeLast24h,
        },
        plaid: {
          last_event_at: plaidLastEvent.data?.created_at ?? null,
        },
      },
      rag: {
        venture_docs: {
          total: totalDocs,
          embedded: embeddedDocs,
          stale: Math.max(0, totalDocs - embeddedDocs),
          last_embed_at: lastEmbed.data?.last_embedded_at ?? null,
        },
        storage_chunks: {
          total: chunkTotal.count ?? 0,
          by_source: {
            file: chunksByFile.count ?? 0,
            venture_doc: chunksByVentureDoc.count ?? 0,
          },
        },
      },
      oauth: {
        active: oauthActive.count ?? 0,
        expired: oauthExpired.count ?? 0,
        expiring_soon_1h: oauthExpiringSoon.count ?? 0,
      },
      crons,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ops-health]', msg);
    return res.status(500).json({ error: msg });
  }
}
