import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { discoverAssets } from '../src/lib/ventures/asset-discovery';

/**
 * Nightly cron — rescans every venture for related assets and upserts
 * new discoveries as `discovered=true, confirmed=false` rows.
 *
 * Configured in vercel.json: { "path": "/api/cron-asset-rediscovery", "schedule": "0 6 * * *" }
 * (06:00 UTC = ~22:00 Pacific — after all sibling repos from the day are captured.)
 *
 * The handler is intentionally conservative:
 * - Never overwrites confirmed assets
 * - Skips duplicates via (venture_id, kind, name) existence check
 * - Fails soft: per-venture errors are logged but don't abort the run
 */

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel cron requests include a specific header; guard against public calls
  const auth = req.headers.authorization;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { data: ventures, error } = await supabase.from('ventures').select('id, name, domain');
  if (error) return res.status(500).json({ error: error.message });

  const results: Array<{ venture: string; created: number; skipped: number; error?: string }> = [];

  // The repo list comes from an external integration (GitHub scan). For the
  // baseline run we re-compute sub-brand candidates from each brand config,
  // so ventures with subBrandTlds configured in meta always stay in sync.
  for (const v of ventures || []) {
    try {
      const candidates = discoverAssets(
        {
          id: v.id,
          subBrandTlds: (v as unknown as { sub_brand_tlds?: string[] }).sub_brand_tlds ?? [],
          legacyMarkers: ['prototype', 'legacy', 'archive', 'deprecated'],
        },
        { repos: [], socials: [] }  // repo/social inputs come from GitHub + Clerk scans (Epic 5 extensions)
      );

      let created = 0, skipped = 0;
      for (const c of candidates) {
        const { data: existing } = await supabase
          .from('venture_assets')
          .select('id')
          .eq('venture_id', v.id)
          .eq('kind', c.kind)
          .eq('name', c.name)
          .limit(1);
        if (existing && existing.length > 0) { skipped++; continue; }
        const { error: insErr } = await supabase.from('venture_assets').insert({
          venture_id: v.id,
          kind: c.kind,
          name: c.name,
          url: c.url,
          meta: c.meta || {},
          tier: c.tier,
          discovered: true,
          confirmed: false,
          created_by: 'cron-rediscovery',
        });
        if (!insErr) created++;
      }
      results.push({ venture: v.id, created, skipped });
    } catch (e) {
      results.push({ venture: v.id, created: 0, skipped: 0, error: e instanceof Error ? e.message : 'unknown' });
    }
  }

  return res.json({ ran_at: new Date().toISOString(), results });
}
