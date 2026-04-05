// @ts-nocheck
// src/lib/platform/webhooks.ts
// Webhook Delivery System — register, emit, deliver with HMAC signing + retries

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface WebhookEndpoint {
  id: string;
  ventureId: string;
  url: string;
  secret: string;           // used for HMAC signing; never returned in list responses
  events: string[];          // event names this endpoint subscribes to, e.g. ['payment.succeeded']
  status: 'active' | 'disabled';
  failureCount: number;
  lastDeliveredAt: string | null;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'failed';
  httpStatus: number | null;
  attempts: number;
  nextRetryAt: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HMAC SIGNING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * HMAC-SHA256 signature of the JSON-stringified payload using the endpoint secret.
 * Returns hex digest suitable for X-MCV-Signature header: `sha256=<hex>`
 */
export async function signPayload(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const body = JSON.stringify(payload);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(body);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `sha256=${hex}`;
  }

  // Node.js fallback
  const { createHmac } = await import('crypto');
  const hex = createHmac('sha256', secret).update(body).digest('hex');
  return `sha256=${hex}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function randomToken(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => chars[b % chars.length]).join('');
  }
  let result = '';
  for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function newId(): string {
  return `${Date.now().toString(36)}-${randomToken(12)}`;
}

/** Exponential backoff: 1min, 5min, 30min, 2h, 8h */
const RETRY_DELAYS_MS = [60_000, 300_000, 1_800_000, 7_200_000, 28_800_000];

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function registerWebhook(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
  ventureId: string,
  url: string,
  events: string[],
  secret: string,
): Promise<WebhookEndpoint> {
  const id = newId();
  const now = new Date().toISOString();

  const row = {
    id,
    venture_id: ventureId,
    url,
    secret,
    events,
    status: 'active',
    failure_count: 0,
    last_delivered_at: null,
    created_at: now,
  };

  const { error } = await supabase.from('webhook_endpoints').insert(row);
  if (error) throw new Error(`Failed to register webhook: ${error.message}`);

  return {
    id,
    ventureId,
    url,
    secret,
    events,
    status: 'active',
    failureCount: 0,
    lastDeliveredAt: null,
    createdAt: now,
  };
}

export async function removeWebhook(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
  endpointId: string,
  ventureId: string,
): Promise<void> {
  const { error } = await supabase
    .from('webhook_endpoints')
    .delete()
    .eq('id', endpointId)
    .eq('venture_id', ventureId);

  if (error) throw new Error(`Failed to remove webhook: ${error.message}`);
}

export async function listWebhooks(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
  ventureId: string,
): Promise<Omit<WebhookEndpoint, 'secret'>[]> {
  const { data, error } = await supabase
    .from('webhook_endpoints')
    .select('id, venture_id, url, events, status, failure_count, last_delivered_at, created_at')
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list webhooks: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    ventureId: row.venture_id,
    url: row.url,
    events: row.events ?? [],
    status: row.status as 'active' | 'disabled',
    failureCount: row.failure_count ?? 0,
    lastDeliveredAt: row.last_delivered_at,
    createdAt: row.created_at,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT EMISSION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Emit an event to all matching active webhook endpoints for a venture.
 * Creates delivery records in the DB. Actual HTTP delivery is async.
 */
export async function emitEvent(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
  ventureId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<WebhookDelivery[]> {
  // Find all active endpoints for this venture that match the event
  const { data: endpoints, error: epErr } = await supabase
    .from('webhook_endpoints')
    .select('id, events, status')
    .eq('venture_id', ventureId)
    .eq('status', 'active');

  if (epErr) throw new Error(`Failed to fetch webhook endpoints: ${epErr.message}`);

  const matching = (endpoints ?? []).filter((ep) => {
    const events: string[] = ep.events ?? [];
    return events.includes('*') || events.includes(event);
  });

  if (matching.length === 0) return [];

  const now = new Date().toISOString();
  const deliveries: WebhookDelivery[] = matching.map((ep) => ({
    id: newId(),
    endpointId: ep.id as string,
    event,
    payload,
    status: 'pending' as const,
    httpStatus: null,
    attempts: 0,
    nextRetryAt: null,
    createdAt: now,
  }));

  const rows = deliveries.map((d) => ({
    id: d.id,
    endpoint_id: d.endpointId,
    event: d.event,
    payload: d.payload,
    status: d.status,
    http_status: d.httpStatus,
    attempts: d.attempts,
    next_retry_at: d.nextRetryAt,
    created_at: d.createdAt,
  }));

  const { error: insertErr } = await supabase.from('webhook_deliveries').insert(rows);
  if (insertErr) throw new Error(`Failed to queue deliveries: ${insertErr.message}`);

  return deliveries;
}

// ─────────────────────────────────────────────────────────────────────────────
// DELIVERY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deliver a single webhook delivery record.
 * POSTs to the endpoint URL with HMAC signature header.
 * Retries up to 5 times with exponential backoff.
 */
export async function deliverWebhook(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
  deliveryId: string,
): Promise<void> {
  // Load delivery record
  const { data: delivery, error: dlErr } = await supabase
    .from('webhook_deliveries')
    .select('*')
    .eq('id', deliveryId)
    .single();

  if (dlErr || !delivery) throw new Error(`Delivery ${deliveryId} not found`);
  if (delivery.status === 'delivered') return;

  // Load endpoint (need secret for signing)
  const { data: endpoint, error: epErr } = await supabase
    .from('webhook_endpoints')
    .select('*')
    .eq('id', delivery.endpoint_id)
    .single();

  if (epErr || !endpoint) {
    await supabase
      .from('webhook_deliveries')
      .update({ status: 'failed' })
      .eq('id', deliveryId);
    return;
  }

  const attempts: number = (delivery.attempts ?? 0) + 1;
  const payload = delivery.payload as Record<string, unknown>;

  // Build envelope with metadata
  const envelope = {
    id: deliveryId,
    event: delivery.event as string,
    ventureId: endpoint.venture_id as string,
    timestamp: new Date().toISOString(),
    data: payload,
  };

  const signature = await signPayload(envelope, endpoint.secret as string);

  let httpStatus: number | null = null;
  let succeeded = false;

  try {
    const response = await fetch(endpoint.url as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MCV-Signature': signature,
        'X-MCV-Event': delivery.event as string,
        'X-MCV-Delivery': deliveryId,
      },
      body: JSON.stringify(envelope),
      signal: AbortSignal.timeout(30_000),
    });

    httpStatus = response.status;
    succeeded = response.ok;
  } catch {
    httpStatus = null;
    succeeded = false;
  }

  if (succeeded) {
    await supabase
      .from('webhook_deliveries')
      .update({ status: 'delivered', http_status: httpStatus, attempts })
      .eq('id', deliveryId);

    await supabase
      .from('webhook_endpoints')
      .update({ last_delivered_at: new Date().toISOString(), failure_count: 0 })
      .eq('id', endpoint.id);
  } else {
    // Schedule retry if under max attempts
    const nextRetryAt =
      attempts < RETRY_DELAYS_MS.length
        ? new Date(Date.now() + RETRY_DELAYS_MS[attempts - 1]).toISOString()
        : null;

    await supabase
      .from('webhook_deliveries')
      .update({
        status: attempts >= 5 ? 'failed' : 'pending',
        http_status: httpStatus,
        attempts,
        next_retry_at: nextRetryAt,
      })
      .eq('id', deliveryId);

    // Increment failure count on endpoint
    await supabase
      .from('webhook_endpoints')
      .update({ failure_count: (endpoint.failure_count ?? 0) + 1 })
      .eq('id', endpoint.id);
  }
}
