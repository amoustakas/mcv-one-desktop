// api/_handlers/web-vitals.ts
// Beacon endpoint for Core Web Vitals reported by the client.
// Receives navigator.sendBeacon POSTs, logs to pino, returns 204.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requestLogger } from '../../src/lib/server/logger';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log } = requestLogger(req);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    log.info({
      event: 'web_vital',
      metric: body?.name,
      value: body?.value,
      rating: body?.rating,
      path: body?.path,
    });
    res.status(204).end();
  } catch (err) {
    log.warn({ event: 'web_vitals_parse_error', err });
    res.status(400).json({ error: 'bad_request' });
  }
}
