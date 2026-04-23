/**
 * Seed github_repos from the GitHub REST API.
 *
 * Pulls every repo the authenticated token can see and upserts into Supabase
 * `github_repos`. Idempotent on `full_name`. First run hydrates 5 seeded rows
 * (see supabase/migration-github-repos-2026-04-23.sql) into live data;
 * subsequent runs refresh pushed_at / open_issues_count / archived / stars.
 *
 * Usage:
 *   npx tsx scripts/seed-github-repos.ts                 # live run
 *   npx tsx scripts/seed-github-repos.ts --dry-run       # fetch only, no DB writes
 *   npx tsx scripts/seed-github-repos.ts --emit-json=repos.json
 *                                                       # write normalized rows
 *                                                       # to a file (MCP path)
 *   npx tsx scripts/seed-github-repos.ts --affiliation=owner
 *                                                       # restrict to personal repos only
 *                                                       # (default: owner,collaborator,organization_member)
 *
 * Env (loaded from .env.local via the same pattern as seed-domain-registry):
 *   GITHUB_TOKEN         — PAT with `repo` + `read:org` scopes
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 *
 * Mirrors scripts/seed-domain-registry.ts line-for-line where practical.
 * Plan: C:\Users\moust\.claude\plans\we-just-got-namecheap-glowing-thimble.md
 * Schema: supabase/migration-github-repos-2026-04-23.sql
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// ───────────────────────────────────────────────────────────────────────────
// Load .env.local (mirrors seed-domain-registry.ts).
// ───────────────────────────────────────────────────────────────────────────
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
const emitJsonFlag = argv.find((a) => a.startsWith('--emit-json='));
const emitJsonPath = emitJsonFlag ? emitJsonFlag.split('=')[1] : null;
const affiliationFlag = argv.find((a) => a.startsWith('--affiliation='));
const affiliation = affiliationFlag
  ? affiliationFlag.split('=')[1]
  : 'owner,collaborator,organization_member';

// ───────────────────────────────────────────────────────────────────────────
// Types + GitHub API shim
// ───────────────────────────────────────────────────────────────────────────

interface GitHubRepoApi {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  language: string | null;
  default_branch: string;
  visibility: 'public' | 'private' | 'internal';
  archived: boolean;
  html_url: string;
  stargazers_count: number;
  open_issues_count: number;
  pushed_at: string;
  updated_at: string;
}

interface GitHubRepoRow {
  full_name: string;
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  default_branch: string;
  visibility: 'public' | 'private' | 'internal';
  archived: boolean;
  html_url: string;
  stargazers_count: number;
  open_issues_count: number;
  pushed_at: string;
  updated_at: string;
  last_synced_at: string;
}

// Auto-paginate /user/repos — GitHub caps at per_page=100; loop until
// Link header drops the `rel="next"` entry. Safety cap at 50 pages
// (5000 repos — more than anyone will sanely have).
async function listAllRepos(token: string): Promise<GitHubRepoApi[]> {
  const all: GitHubRepoApi[] = [];
  for (let page = 1; page <= 50; page++) {
    const url = `https://api.github.com/user/repos?affiliation=${encodeURIComponent(affiliation)}&per_page=100&page=${page}&sort=pushed&direction=desc`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) {
      throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    }
    const batch = (await res.json()) as GitHubRepoApi[];
    all.push(...batch);
    if (batch.length < 100) break; // last page
  }
  return all;
}

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────
async function main() {
  const token = process.env.GITHUB_TOKEN || '';
  if (!token) {
    console.error('[seed-github-repos] Missing GITHUB_TOKEN.');
    console.error('  Create a PAT at https://github.com/settings/tokens with `repo` + `read:org` scopes,');
    console.error('  then set GITHUB_TOKEN in .env.local or export it in your shell.');
    process.exit(1);
  }

  console.log(`[seed-github-repos] Fetching repos (affiliation=${affiliation})...`);
  const repos = await listAllRepos(token);
  console.log(`[seed-github-repos] Fetched ${repos.length} repos from GitHub.`);

  if (dryRun) {
    console.log('[seed-github-repos] --dry-run: skipping DB writes. Sample (first 10):');
    for (const r of repos.slice(0, 10)) {
      console.log(
        `  ${r.full_name.padEnd(40)} lang=${(r.language ?? '—').padEnd(12)} ` +
        `pushed=${r.pushed_at.slice(0, 10)} issues=${r.open_issues_count} ` +
        `${r.archived ? '[ARCHIVED]' : ''}${r.visibility === 'public' ? '[pub]' : ''}`,
      );
    }
    return;
  }

  const now = new Date().toISOString();
  const rowsPrepared: GitHubRepoRow[] = repos.map((r) => ({
    full_name: r.full_name,
    owner: r.owner.login,
    name: r.name,
    description: r.description,
    language: r.language,
    default_branch: r.default_branch || 'master',
    visibility: r.visibility,
    archived: r.archived,
    html_url: r.html_url,
    stargazers_count: r.stargazers_count,
    open_issues_count: r.open_issues_count,
    pushed_at: r.pushed_at,
    updated_at: r.updated_at,
    last_synced_at: now,
  }));

  if (emitJsonPath) {
    fs.writeFileSync(emitJsonPath, JSON.stringify(rowsPrepared, null, 2));
    console.log(`[seed-github-repos] ✅ Wrote ${rowsPrepared.length} rows → ${emitJsonPath}`);
    console.log('[seed-github-repos] (skipping Supabase upsert — --emit-json mode)');
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    '';
  if (!supabaseUrl || !supabaseKey) {
    console.error('[seed-github-repos] Missing SUPABASE_URL / SUPABASE_SERVICE_KEY');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`[seed-github-repos] Upserting ${rowsPrepared.length} rows to github_repos...`);
  const { data, error } = await supabase
    .from('github_repos')
    .upsert(rowsPrepared, { onConflict: 'full_name', ignoreDuplicates: false })
    .select('full_name');

  if (error) {
    console.error('[seed-github-repos] Supabase upsert failed:', error.message);
    process.exit(1);
  }

  console.log(`[seed-github-repos] ✅ Upserted ${data?.length ?? rowsPrepared.length} rows.`);

  // Fire a foundation.repo.synced event so the nervous system sees the sync.
  // Best-effort; don't fail the seed if the publish fails.
  try {
    await supabase.from('event_log').insert({
      topic: 'foundation.repo.synced',
      schema_version: '1.0',
      correlation_id: crypto.randomUUID(),
      causation_id: null,
      venture_id: null,
      emitted_by: 'script:seed-github-repos',
      payload: {
        repoCount: rowsPrepared.length,
        archivedCount: rowsPrepared.filter((r) => r.archived).length,
        source: 'github-api',
      },
      status: 'published',
    });
    console.log('[seed-github-repos] 🔔 Emitted foundation.repo.synced event.');
  } catch (err) {
    console.warn('[seed-github-repos] event emit failed (non-fatal):', err instanceof Error ? err.message : err);
  }

  // Sample what landed
  const { data: sample } = await supabase
    .from('github_repos')
    .select('full_name, language, pushed_at, open_issues_count, archived')
    .order('pushed_at', { ascending: false })
    .limit(10);
  console.log('[seed-github-repos] 10 most recently pushed repos:');
  for (const row of sample ?? []) {
    console.log(
      `  ${(row.full_name as string).padEnd(40)} lang=${((row.language as string | null) ?? '—').padEnd(12)} ` +
      `pushed=${(row.pushed_at as string | null)?.slice(0, 10) ?? '—'} issues=${row.open_issues_count}`,
    );
  }
}

main().catch((err) => {
  console.error('[seed-github-repos] FATAL:', err?.message ?? err);
  if (err?.message?.includes('401')) {
    console.error('  → 401 — check GITHUB_TOKEN scopes include `repo` (and `read:org` for orgs).');
  }
  process.exit(1);
});
