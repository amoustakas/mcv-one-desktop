// api/docusign-webhook.ts
//
// DocuSign Connect webhook receiver (Epic 13 S3).
//
// Receives envelope-status events, verifies HMAC-SHA256, maps through
// the DocuSignAdapter → CapitalSigningEvent → reconcileCapitalSigning
// which transitions the commitment, persists signed-PDF receipt to
// Content OS, and fans out notifications.
//
// HMAC: DocuSign Connect signs each request with one or more configured
// secrets in the X-DocuSign-Signature-1 header (lowercase variants
// possible). We verify against any configured secret in
// DOCUSIGN_WEBHOOK_SECRET (comma-separated for rotation). The body is
// hashed raw — bodyParser must stay disabled.
//
// DOCUSIGN_WEBHOOK_VERIFY=0 disables verification in dev.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

import { requestLogger } from '../../src/lib/server/logger';
export const config = { api: { bodyParser: false } };

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function verifyDocuSignSignature(raw: Buffer, headers: VercelRequest['headers']): boolean {
  const secrets = (process.env.DOCUSIGN_WEBHOOK_SECRET ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (secrets.length === 0) return false;

  // DocuSign sends X-DocuSign-Signature-1 (and -2, -3 if multiple
  // secrets are configured). Any of them matching is sufficient.
  const sigHeaders = Object.entries(headers)
    .filter(([k]) => k.toLowerCase().startsWith('x-docusign-signature-'))
    .map(([, v]) => Array.isArray(v) ? v[0] : v)
    .filter((v): v is string => typeof v === 'string');
  if (sigHeaders.length === 0) return false;

  for (const secret of secrets) {
    const computed = crypto.createHmac('sha256', secret).update(raw).digest('base64');
    for (const provided of sigHeaders) {
      if (constantTimeEqual(computed, provided)) return true;
    }
  }
  return false;
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
  if (req.method !== 'POST') return res.status(405).send('POST only');

  let raw: Buffer;
  try {
    raw = await readRawBody(req);
  } catch {
    return res.status(400).send('Failed to read body');
  }

  const verifyEnabled = (process.env.DOCUSIGN_WEBHOOK_VERIFY ?? '1') !== '0';
  if (verifyEnabled) {
    if (!verifyDocuSignSignature(raw, req.headers)) {
      return res.status(401).send('Invalid signature');
    }
  }

  let body: unknown;
  try {
    body = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  const { createDocuSignAdapter } = await import('../../src/lib/capital/adapters/docusign-adapter');
  const { reconcileCapitalSigning } = await import('../../src/lib/capital/signing-reconcile');

  const adapter = createDocuSignAdapter();
  const event = await adapter.fromForeign(body as never);
  if (!event) {
    return res.status(200).json({ received: true, handled: false, reason: 'non-terminal or malformed' });
  }
  const result = await reconcileCapitalSigning(event, { supabase });
  return res.status(200).json({
    received: true,
    handled: true,
    outcome: result.outcome,
    commitment_id: result.commitmentId,
    receipt_content_id: result.receiptContentId,
  });
}
