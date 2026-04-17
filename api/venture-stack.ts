// api/venture-stack.ts
// Top-level Vercel serverless route wiring the T2.7 handler.
// Exposes POST /api/venture-stack with actions:
//   list-ventures | get-venture | list-jurisdictions | list-accounts | get-brand-kit.
//
// The shared `_handlers/_supabase.ts` helpers live under `_handlers/` so
// that Vercel file-based routing excludes them from deployment as routes;
// we reach into that directory for the same getServiceClient() singleton
// used by capital.ts / prospects.ts.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_handlers/_supabase';
import { handleVentureStack, type VentureStackRequest } from './_handlers/venture-stack';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  try {
    const result = await handleVentureStack(
      getServiceClient(),
      req.body as VentureStackRequest,
    );
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'venture-stack failed';
    console.error('[venture-stack] error:', message);
    return res.status(500).json({ error: message });
  }
}
