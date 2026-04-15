// Cron: promote scheduled capital distributions whose scheduled_for has
// arrived to `processing` by invoking processDistribution(). Engine is
// wired with the real ledger + paymentRouter, so the same auto-JE-post
// + payout-routing chain fires for cron-triggered distributions as for
// manual Tony-clicked ones.
//
// Configured in vercel.json: { "path": "/api/cron-capital-distributions", "schedule": "*/5 * * * *" }
// Every 5 minutes is fine — distributions are low-volume and the action
// is idempotent (processDistribution on a non-scheduled distribution is
// a no-op via status guard inside the SDK).

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCapitalEngine } from '@mcv/capital-sdk';
import { makeCapitalLedgerAdapter, makeCapitalPaymentRouterAdapter } from '../../src/lib/capital/adapters';
import { paymentRouter } from '../../src/lib/payments/router';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

const engine = createCapitalEngine({
  supabase,
  ledger: makeCapitalLedgerAdapter(supabase),
  paymentRouter: makeCapitalPaymentRouterAdapter(paymentRouter),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const nowIso = new Date().toISOString();

  const { data: due, error } = await supabase
    .from('capital_distributions')
    .select('id, venture_id, distribution_type, total_amount, currency, scheduled_for')
    .eq('status', 'scheduled')
    .not('scheduled_for', 'is', null)
    .lte('scheduled_for', nowIso)
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  if (!due || !due.length) return res.json({ ran_at: nowIso, due: 0, results: [] });

  const results: Array<{ id: string; status: string; paid?: number; recipients?: number; error?: string }> = [];

  for (const d of due) {
    try {
      const processed = await engine.distributions.processDistribution(d.id, 'cron-capital-distributions');
      results.push({
        id: d.id,
        status: processed.status,
        paid: processed.totalPaid,
        recipients: processed.totalRecipients,
      });
    } catch (err) {
      results.push({ id: d.id, status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  }

  return res.json({ ran_at: nowIso, due: due.length, results });
}
