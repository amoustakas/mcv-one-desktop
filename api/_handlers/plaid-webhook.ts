// api/plaid-webhook.ts
//
// Plaid webhook receiver for the MCV payment audit loop.
//
// Primary responsibility: TRANSFER_EVENTS_UPDATE. Plaid pushes a lightweight
// "something changed" ping; we pull the actual events via /transfer/event/
// sync using a persisted cursor (plaid_webhook_cursors.transfer_events) and
// emit one payment_events row per event.
//
// Plaid webhook verification uses ES256 JWT signed by their rotating keys.
// We:
//   1. Read the `plaid-verification` JWT from the request header.
//   2. Decode the kid from the JWT header and fetch the corresponding public
//      key via POST /webhook_verification_key/get.
//   3. Verify the JWT signature with node:crypto (ES256 / P-256).
//   4. Confirm `request_body_sha256` inside the JWT equals sha256(rawBody).
//   5. Reject if `iat` is older than 5 minutes.
//
// Verification is enforced when PLAID_CLIENT_ID + PLAID_SECRET are set. To
// skip verification in dev, set PLAID_WEBHOOK_VERIFY=0.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { emitPaymentEvent, type PaymentEventType } from './_payment-events.js';
import { withRateLimit, LIMITS, getClientIp } from '../../src/lib/server/rate-limit';

export const config = { api: { bodyParser: false } };

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || '';
const PLAID_SECRET = process.env.PLAID_SECRET || '';
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';

const PLAID_BASE: Record<string, string> = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
};

const CURSOR_KEY = 'transfer_events';

// ─── Raw body reader ─────────────────────────────────────────────────────

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ─── Plaid JWT verification ─────────────────────────────────────────────

function base64UrlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

interface PlaidJwtHeader { alg: string; kid: string; typ?: string }
interface PlaidJwtBody {
  iat: number;
  request_body_sha256: string;
}

function decodeJwt(token: string): { header: PlaidJwtHeader; body: PlaidJwtBody; signingInput: string; signature: Buffer } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]).toString('utf8')) as PlaidJwtHeader;
    const body = JSON.parse(base64UrlDecode(parts[1]).toString('utf8')) as PlaidJwtBody;
    const signature = base64UrlDecode(parts[2]);
    return { header, body, signingInput: `${parts[0]}.${parts[1]}`, signature };
  } catch {
    return null;
  }
}

// ES256 signatures arrive as JOSE-flavored concatenated R||S (64 bytes).
// Node's crypto.verify expects DER-encoded ECDSA signatures, so we convert.
function joseToDer(jose: Buffer): Buffer {
  if (jose.length !== 64) throw new Error(`expected 64-byte R||S signature, got ${jose.length}`);
  const r = jose.subarray(0, 32);
  const s = jose.subarray(32, 64);

  function trimLeadingZeros(buf: Buffer): Buffer {
    let i = 0;
    while (i < buf.length - 1 && buf[i] === 0) i++;
    // Prepend 0x00 if high bit is set (positive integer in DER).
    if (buf[i] & 0x80) return Buffer.concat([Buffer.from([0x00]), buf.subarray(i)]);
    return buf.subarray(i);
  }

  const rTrim = trimLeadingZeros(r);
  const sTrim = trimLeadingZeros(s);
  const derLen = 2 + rTrim.length + 2 + sTrim.length;
  return Buffer.concat([
    Buffer.from([0x30, derLen]),
    Buffer.from([0x02, rTrim.length]), rTrim,
    Buffer.from([0x02, sTrim.length]), sTrim,
  ]);
}

async function fetchWebhookVerificationKey(kid: string): Promise<crypto.KeyObject | null> {
  const baseUrl = PLAID_BASE[PLAID_ENV] || PLAID_BASE.sandbox;
  try {
    const res = await fetch(`${baseUrl}/webhook_verification_key/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: PLAID_CLIENT_ID, secret: PLAID_SECRET, key_id: kid }),
    });
    const data = await res.json() as { key?: { alg: string; crv: string; kty: string; use: string; x: string; y: string; kid: string } };
    if (!data.key) return null;
    return crypto.createPublicKey({ format: 'jwk', key: data.key });
  } catch {
    return null;
  }
}

async function verifyPlaidWebhook(rawBody: Buffer, jwtHeader: string | undefined): Promise<boolean> {
  if (!jwtHeader) return false;
  const decoded = decodeJwt(jwtHeader);
  if (!decoded) return false;
  if (decoded.header.alg !== 'ES256') return false;

  // iat must be within 5 minutes
  const nowSec = Math.floor(Date.now() / 1000);
  if (!decoded.body.iat || nowSec - decoded.body.iat > 5 * 60) return false;

  // body hash must match
  const bodyHash = crypto.createHash('sha256').update(rawBody).digest('hex');
  if (bodyHash !== decoded.body.request_body_sha256) return false;

  const pubKey = await fetchWebhookVerificationKey(decoded.header.kid);
  if (!pubKey) return false;

  try {
    const derSig = joseToDer(decoded.signature);
    return crypto.verify(
      'SHA256',
      Buffer.from(decoded.signingInput, 'utf8'),
      pubKey,
      derSig,
    );
  } catch {
    return false;
  }
}

// ─── Plaid Transfer event sync ──────────────────────────────────────────

interface PlaidTransferEvent {
  event_id: number;
  event_type: string;          // 'pending' | 'cancelled' | 'failed' | 'settled' | 'returned' | 'posted' | ...
  timestamp: string;
  account_id?: string;
  transfer_id: string;
  transfer_amount?: string;
  transfer_type?: 'debit' | 'credit';
  failure_reason?: { description?: string } | null;
}

async function plaidFetch(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const baseUrl = PLAID_BASE[PLAID_ENV] || PLAID_BASE.sandbox;
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: PLAID_CLIENT_ID, secret: PLAID_SECRET, ...body }),
  });
  const data = await res.json() as Record<string, unknown>;
  if (data.error_code) throw new Error(`${data.error_code}: ${data.error_message}`);
  return data;
}

async function readCursor(): Promise<number> {
  const { data } = await supabase
    .from('plaid_webhook_cursors')
    .select('last_event_id')
    .eq('cursor_key', CURSOR_KEY)
    .maybeSingle();
  return (data?.last_event_id as number | undefined) ?? 0;
}

async function writeCursor(eventId: number): Promise<void> {
  await supabase
    .from('plaid_webhook_cursors')
    .upsert({ cursor_key: CURSOR_KEY, last_event_id: eventId, updated_at: new Date().toISOString() }, { onConflict: 'cursor_key' });
}

// Plaid → payment_events.event_type mapping.
// A single Plaid transfer can generate multiple events across its lifecycle;
// we emit for terminal states so the ledger shows settlement outcome.
function mapPlaidEvent(evt: PlaidTransferEvent): { type: PaymentEventType; status: string } | null {
  switch (evt.event_type) {
    case 'posted':
    case 'settled':
      return { type: 'transfer.succeeded', status: evt.event_type };
    case 'failed':
    case 'returned':
    case 'cancelled':
    case 'reversed':
      return { type: 'transfer.failed', status: evt.event_type };
    // 'pending' and 'swept' are progress states covered by transfer.created
    // at initiation; no additional event needed.
    default:
      return null;
  }
}

async function ventureForTransfer(transferId: string): Promise<{ ventureId: string | null; userId: string | null; amountCents: number | null; currency: string | null }> {
  const { data } = await supabase
    .from('plaid_transfers')
    .select('venture_id, user_id, amount_cents, currency')
    .eq('transfer_id', transferId)
    .maybeSingle();
  return {
    ventureId: (data?.venture_id as string | null) ?? null,
    userId: (data?.user_id as string | null) ?? null,
    amountCents: (data?.amount_cents as number | null) ?? null,
    currency: (data?.currency as string | null) ?? null,
  };
}

async function syncTransferEvents(): Promise<{ processed: number; emitted: number }> {
  let afterId = await readCursor();
  let processed = 0;
  let emitted = 0;
  let hasMore = true;
  let iterations = 0;
  const MAX_ITERATIONS = 40; // safety cap: 40 * 25 = 1,000 events per webhook

  while (hasMore && iterations < MAX_ITERATIONS) {
    iterations++;
    const data = await plaidFetch('/transfer/event/sync', { after_id: afterId, count: 25 });
    const events = (data.transfer_events as PlaidTransferEvent[] | undefined) ?? [];
    hasMore = Boolean(data.has_more);

    if (events.length === 0) break;

    for (const evt of events) {
      processed++;
      const mapped = mapPlaidEvent(evt);
      if (!mapped) {
        afterId = Math.max(afterId, evt.event_id);
        continue;
      }

      const lookup = await ventureForTransfer(evt.transfer_id);
      await emitPaymentEvent({
        event_type: mapped.type,
        processor: 'plaid',
        venture_id: lookup.ventureId,
        actor: lookup.userId,
        external_id: evt.transfer_id,
        amount_cents: lookup.amountCents ?? (evt.transfer_amount ? Math.round(parseFloat(evt.transfer_amount) * 100) : null),
        currency: (lookup.currency ?? 'USD').toUpperCase(),
        status: mapped.status,
        error_message: evt.failure_reason?.description ?? null,
        payload: {
          plaid_event_id: evt.event_id,
          plaid_event_type: evt.event_type,
          timestamp: evt.timestamp,
          account_id: evt.account_id,
        },
      });
      emitted++;
      afterId = Math.max(afterId, evt.event_id);

      // ── Capital reconciliation hook (Epic 13 S1 → live) ──
      // For settled inbound credits, attempt to auto-match a Capital
      // commitment via the PlaidAdapter and call recordPayment when
      // unambiguous. Failures are logged but never block payment_events.
      if (evt.event_type === 'settled' && evt.transfer_type === 'credit') {
        try {
          await reconcileToCapital(evt);
        } catch (err) {
          console.warn('[plaid-webhook] capital reconciliation failed:', err instanceof Error ? err.message : err);
        }
      }
    }

    await writeCursor(afterId);
  }

  return { processed, emitted };
}

// ── Capital reconciliation ──────────────────────────────────────────────
// Composes the PlaidAdapter (Epic 13 S1) with the capital-sdk's
// commitments service. Pure best-effort; webhook still ACKs even if
// reconciliation can't find a unique match (admin reconciles manually).

async function reconcileToCapital(evt: PlaidTransferEvent): Promise<void> {
  if (!evt.account_id || !evt.transfer_amount) return;
  const { createPlaidAdapter } = await import('../../src/lib/capital/adapters/plaid-adapter');
  const { reconcileCapitalPayment } = await import('../../src/lib/capital/reconcile');

  // $1 wire fee tolerance — correspondent banks sometimes skim a flat fee
  // before Plaid sees the settled credit.
  const adapter = createPlaidAdapter({ supabase, amountToleranceCents: 100 });
  const mapped = await adapter.fromForeign({
    transfer_id: evt.transfer_id,
    account_id: evt.account_id,
    amount: evt.transfer_amount,
    iso_currency_code: 'USD',
    type: 'credit',
    status: 'settled',
    posted_at: evt.timestamp,
  });

  // Shared helper handles: null skip, review_needed notification on
  // ambiguous match, recordPayment + reconciled notification on 1:1 match.
  // Realtime postgres_changes on capital_commitments (PR #14) refreshes
  // dashboards either way; the explicit notification gives bell + slack +
  // email fan-out via the dispatcher cron.
  await reconcileCapitalPayment(mapped, {
    supabase,
    source: 'plaid',
    refLabel: 'Plaid transfer',
  });
}

// ─── Handler ────────────────────────────────────────────────────────────

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('POST only');

  let raw: Buffer;
  try {
    raw = await readRawBody(req);
  } catch {
    return res.status(400).send('Failed to read body');
  }

  const verifyEnabled = (process.env.PLAID_WEBHOOK_VERIFY ?? '1') !== '0';
  if (verifyEnabled && PLAID_CLIENT_ID && PLAID_SECRET) {
    const ok = await verifyPlaidWebhook(raw, req.headers['plaid-verification'] as string | undefined);
    if (!ok) return res.status(401).send('Invalid webhook signature');
  }

  let body: { webhook_type?: string; webhook_code?: string; item_id?: string };
  try {
    body = JSON.parse(raw.toString('utf8')) as typeof body;
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  // Only handle transfer events for payment_events. Other webhook types
  // (ITEM_WEBHOOK, TRANSACTIONS, AUTH, IDENTITY) may be handled elsewhere.
  if (body.webhook_type === 'TRANSFER' && body.webhook_code === 'TRANSFER_EVENTS_UPDATE') {
    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      return res.status(500).send('PLAID credentials not configured');
    }
    try {
      const result = await syncTransferEvents();
      return res.status(200).json({ received: true, handled: true, ...result });
    } catch (err) {
      // Log-and-continue — we return 200 so Plaid doesn't retry, the next
      // webhook will re-sync from the last persisted cursor.
      const msg = err instanceof Error ? err.message : 'unknown';
      console.error('[plaid-webhook] transfer sync failed:', msg);
      return res.status(200).json({ received: true, handled: false, error: msg });
    }
  }

  return res.status(200).json({ received: true, handled: false, type: body.webhook_type });
}

export default withRateLimit(LIMITS.WEBHOOK, getClientIp)(handler);
