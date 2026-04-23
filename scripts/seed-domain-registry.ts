/**
 * Seed domain_registry from Namecheap.
 *
 * Pulls every domain on the Namecheap account and upserts into Supabase
 * `domain_registry`. Idempotent on `fqdn`. First run hydrates 0 → N rows
 * from the stub seeds already in the migration; subsequent runs refresh
 * expires_at / auto_renew / status.
 *
 * Usage:
 *   npx tsx scripts/seed-domain-registry.ts                 # live run
 *   npx tsx scripts/seed-domain-registry.ts --dry-run       # fetch only, no DB writes
 *   npx tsx scripts/seed-domain-registry.ts --sandbox       # use Namecheap sandbox API
 *
 * Env (loaded from .env.local via Node's --env-file or dotenv wrapper):
 *   NAMECHEAP_API_USER   (or falls back to NAMECHEAP_USERNAME)
 *   NAMECHEAP_API_KEY
 *   NAMECHEAP_USERNAME   (defaults to NAMECHEAP_API_USER)
 *   NAMECHEAP_CLIENT_IP  (optional — auto-detected via ipify if missing)
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 *
 * IP whitelist: Namecheap requires the caller's public IP to be whitelisted
 * under Profile → Tools → Business & Dev Tools → Namecheap API Access →
 * "Whitelisted IPs". Script prints the detected IP so you know what to add.
 *
 * Plan: C:\Users\moust\.claude\plans\we-are-extracting-all-wondrous-quasar.md
 * Schema: supabase/migration-domain-registry-2026-04-17.sql
 */

import { createClient } from '@supabase/supabase-js';
import { createNamecheapClient, detectPublicIp } from '../src/lib/namecheap/client.js';

// ───────────────────────────────────────────────────────────────────────────
// Load .env.local (mirrors server/local.ts) so this runs as `tsx script.ts`
// without needing a prefix. Idempotent if already loaded.
// ───────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
(function loadEnvLocal() {
  const cwd = process.cwd();
  for (const name of ['.env.local', '.env']) {
    const p = path.join(cwd, name);
    if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const eq = line.indexOf('=');
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
})();

// ───────────────────────────────────────────────────────────────────────────
// CLI flags
// ───────────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const sandbox = argv.includes('--sandbox');
// --emit-json=path.json  — write the normalized rows to a JSON file instead
// of calling Supabase. Useful when the seed will be executed via a separate
// privileged path (e.g. Supabase MCP with elevated creds).
const emitJsonFlag = argv.find((a) => a.startsWith('--emit-json='));
const emitJsonPath = emitJsonFlag ? emitJsonFlag.split('=')[1] : null;

// ───────────────────────────────────────────────────────────────────────────
// Credential resolution + self-check
// ───────────────────────────────────────────────────────────────────────────
async function main() {
  const apiUser = process.env.NAMECHEAP_API_USER || process.env.NAMECHEAP_USERNAME || '';
  const apiKey = process.env.NAMECHEAP_API_KEY || '';
  const userName = process.env.NAMECHEAP_USERNAME || process.env.NAMECHEAP_API_USER || '';

  if (!apiKey || !userName) {
    console.error('[seed-domain-registry] Missing NAMECHEAP_API_KEY / NAMECHEAP_USERNAME.');
    console.error('  Run:  vercel env pull .env.local --environment=development --yes');
    console.error('  And verify those keys are in Vercel env (Project → Settings → Environment Variables).');
    process.exit(1);
  }

  let clientIp = process.env.NAMECHEAP_CLIENT_IP || '';
  if (!clientIp) {
    console.log('[seed-domain-registry] NAMECHEAP_CLIENT_IP not set — auto-detecting via ipify...');
    clientIp = await detectPublicIp();
    console.log(`[seed-domain-registry] Detected public IP: ${clientIp}`);
    console.log('[seed-domain-registry] Make sure this IP is whitelisted in Namecheap:');
    console.log('  Profile → Tools → Business & Dev Tools → Namecheap API Access → Whitelisted IPs');
  }

  console.log(`[seed-domain-registry] Connecting to Namecheap ${sandbox ? 'SANDBOX' : 'PRODUCTION'}...`);
  const namecheap = createNamecheapClient({
    apiUser: apiUser || userName,
    apiKey,
    userName,
    clientIp,
    sandbox,
  });

  const domains = await namecheap.listDomains();
  console.log(`[seed-domain-registry] Fetched ${domains.length} domains from Namecheap.`);

  if (dryRun) {
    console.log('[seed-domain-registry] --dry-run: skipping DB writes. Sample (first 10):');
    for (const d of domains.slice(0, 10)) {
      console.log(`  ${d.name.padEnd(28)} exp=${d.expires} autorenew=${d.autoRenew} whois=${d.isWhoisGuard}`);
    }
    return;
  }

  // Pre-compute normalized rows once so both the JSON-emit path and the
  // Supabase-upsert path share identical semantics.
  const rowsPrepared = domains.map((d) => ({
    fqdn: d.name.toLowerCase(),
    registrar: 'Namecheap',
    registrar_ref: d.id,
    registered_at: d.created || null,
    expires_at: d.expires || null,
    auto_renew: d.autoRenew,
    status: d.isExpired ? 'expired' : 'active',
    last_synced_at: new Date().toISOString(),
  }));

  if (emitJsonPath) {
    fs.writeFileSync(emitJsonPath, JSON.stringify(rowsPrepared, null, 2));
    console.log(`[seed-domain-registry] ✅ Wrote ${rowsPrepared.length} rows → ${emitJsonPath}`);
    console.log('[seed-domain-registry] (skipping Supabase upsert — --emit-json mode)');
    return;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Supabase upsert
  // ──────────────────────────────────────────────────────────────────────────
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    '';
  if (!supabaseUrl || !supabaseKey) {
    console.error('[seed-domain-registry] Missing SUPABASE_URL / SUPABASE_SERVICE_KEY');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows = rowsPrepared;

  console.log(`[seed-domain-registry] Upserting ${rows.length} rows to domain_registry...`);
  const { data, error } = await supabase
    .from('domain_registry')
    .upsert(rows, { onConflict: 'fqdn', ignoreDuplicates: false })
    .select('fqdn');

  if (error) {
    console.error('[seed-domain-registry] Supabase upsert failed:', error.message);
    process.exit(1);
  }

  console.log(`[seed-domain-registry] ✅ Upserted ${data?.length ?? rows.length} rows.`);

  // Show a sample of what landed for sanity
  const { data: sample } = await supabase
    .from('domain_registry')
    .select('fqdn, expires_at, auto_renew, status')
    .eq('registrar', 'Namecheap')
    .order('expires_at', { ascending: true })
    .limit(10);
  console.log('[seed-domain-registry] 10 domains nearest expiry:');
  for (const row of sample ?? []) {
    console.log(`  ${(row.fqdn as string).padEnd(28)} exp=${row.expires_at} autorenew=${row.auto_renew} status=${row.status}`);
  }
}

main().catch((err) => {
  console.error('[seed-domain-registry] FATAL:', err?.message ?? err);
  if (err?.message?.includes('IP address') || err?.message?.includes('Invalid request IP')) {
    console.error('  → This is likely the Namecheap IP whitelist. Log into Namecheap,');
    console.error('    go to Profile → Tools → Namecheap API Access → Whitelisted IPs,');
    console.error('    and add the detected IP printed above.');
  }
  process.exit(1);
});
