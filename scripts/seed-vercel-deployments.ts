/**
 * Seed vercel_projects + vercel_deployments from the Vercel REST API.
 *
 * First pass: list projects on the MCV team → upsert into vercel_projects.
 * Second pass: for each project, list up to N recent deployments → upsert
 * into vercel_deployments. Idempotent on vercel_project_id + vercel_deployment_id.
 *
 * Usage:
 *   npx tsx scripts/seed-vercel-deployments.ts                 # live run
 *   npx tsx scripts/seed-vercel-deployments.ts --dry-run       # fetch only
 *   npx tsx scripts/seed-vercel-deployments.ts --emit-json=path.json
 *   npx tsx scripts/seed-vercel-deployments.ts --limit=20      # 20 deployments/project (default 50)
 *
 * Env (loaded from .env.local):
 *   VERCEL_TOKEN         — token with read access to team/projects/deployments
 *   VERCEL_TEAM_ID       — team slug or id (defaults to "mcv")
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 *
 * Mirrors scripts/seed-domain-registry.ts + scripts/seed-github-repos.ts.
 * Plan: C:\Users\moust\.claude\plans\we-just-got-namecheap-glowing-thimble.md
 * Schema: supabase/migration-vercel-deployments-2026-04-23.sql
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// ───────────────────────────────────────────────────────────────────────────
// Load .env.local
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
const limitFlag = argv.find((a) => a.startsWith('--limit='));
const perProjectLimit = limitFlag ? Math.max(1, parseInt(limitFlag.split('=')[1], 10) || 50) : 50;

// ───────────────────────────────────────────────────────────────────────────
// Vercel API shim
// ───────────────────────────────────────────────────────────────────────────
const VERCEL_API = 'https://api.vercel.com';

interface VercelProjectApi {
  id: string;
  name: string;
  framework: string | null;
  createdAt: number;
  updatedAt: number;
  targets?: { production?: { alias?: string[] } };
  alias?: Array<{ domain: string }>;
}

interface VercelDeploymentApi {
  uid: string;
  name: string;
  url: string;
  state: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED' | 'CANCELED' | 'INITIALIZING' | 'DEPLOYING';
  created: number;         // ms epoch
  ready?: number;
  target?: 'production' | 'staging' | null;
  creator?: { username?: string };
  meta?: Record<string, unknown>;
  projectId: string;
}

async function vercelFetch<T>(path: string, token: string, teamId?: string): Promise<T> {
  const url = new URL(`${VERCEL_API}${path}`);
  if (teamId) url.searchParams.set('teamId', teamId);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Vercel API ${res.status} ${path}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// teamId may be a slug (needs resolution) or an id (team_xxx). Vercel accepts
// slug on most endpoints; resolve to id once for consistency.
async function resolveTeamId(token: string, slugOrId: string): Promise<string | undefined> {
  if (!slugOrId) return undefined;
  if (slugOrId.startsWith('team_')) return slugOrId;
  try {
    const team = await vercelFetch<{ id: string }>(`/v2/teams/${slugOrId}`, token);
    return team.id;
  } catch {
    // Fall back to using the slug directly — some endpoints accept it.
    return slugOrId;
  }
}

async function listAllProjects(token: string, teamId?: string): Promise<VercelProjectApi[]> {
  const all: VercelProjectApi[] = [];
  let next: string | undefined;
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams({ limit: '100' });
    if (next) qs.set('until', String(next));
    const data = await vercelFetch<{
      projects: VercelProjectApi[];
      pagination: { next?: string | null };
    }>(`/v9/projects?${qs.toString()}`, token, teamId);
    all.push(...(data.projects ?? []));
    if (!data.pagination?.next) break;
    next = data.pagination.next;
  }
  return all;
}

async function listProjectDeployments(
  token: string,
  projectId: string,
  limit: number,
  teamId?: string,
): Promise<VercelDeploymentApi[]> {
  const qs = new URLSearchParams({ projectId, limit: String(limit) });
  const data = await vercelFetch<{ deployments: VercelDeploymentApi[] }>(
    `/v6/deployments?${qs.toString()}`,
    token,
    teamId,
  );
  return data.deployments ?? [];
}

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────
async function main() {
  const token = process.env.VERCEL_TOKEN || '';
  const teamSlugOrId = process.env.VERCEL_TEAM_ID || 'mcv';
  if (!token) {
    console.error('[seed-vercel] Missing VERCEL_TOKEN.');
    console.error('  Create one at https://vercel.com/account/tokens, scope it to the MCV team.');
    process.exit(1);
  }

  const teamId = await resolveTeamId(token, teamSlugOrId);
  console.log(`[seed-vercel] Team: ${teamSlugOrId}${teamId && teamId !== teamSlugOrId ? ` → ${teamId}` : ''}`);
  console.log(`[seed-vercel] Fetching projects...`);
  const projects = await listAllProjects(token, teamId);
  console.log(`[seed-vercel] Found ${projects.length} projects.`);

  // Fetch deployments per project (bounded concurrency of 4 so we don't hammer).
  console.log(`[seed-vercel] Fetching up to ${perProjectLimit} deployments per project (concurrency=4)...`);
  const deploymentsByProject = new Map<string, VercelDeploymentApi[]>();
  const pending = [...projects];
  async function worker() {
    while (pending.length) {
      const proj = pending.shift();
      if (!proj) return;
      try {
        const deps = await listProjectDeployments(token, proj.id, perProjectLimit, teamId);
        deploymentsByProject.set(proj.id, deps);
      } catch (err) {
        console.warn(`  [${proj.name}] deployment fetch failed: ${err instanceof Error ? err.message : err}`);
        deploymentsByProject.set(proj.id, []);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, () => worker()));

  const totalDeployments = [...deploymentsByProject.values()].reduce((n, d) => n + d.length, 0);
  console.log(`[seed-vercel] Fetched ${totalDeployments} total deployments.`);

  if (dryRun) {
    console.log('[seed-vercel] --dry-run: skipping DB writes. Sample (first 10 deployments):');
    let printed = 0;
    for (const deps of deploymentsByProject.values()) {
      for (const d of deps) {
        if (printed >= 10) break;
        console.log(
          `  ${d.name.padEnd(28)} ${d.state.padEnd(12)} ${(d.target ?? 'preview').padEnd(10)} ` +
          `${new Date(d.created).toISOString().slice(0, 19).replace('T', ' ')}`,
        );
        printed++;
      }
      if (printed >= 10) break;
    }
    return;
  }

  const now = new Date().toISOString();
  type ProjRow = {
    vercel_project_id: string;
    name: string;
    framework: string | null;
    production_url: string | null;
    last_deployment_at: string | null;
    last_synced_at: string;
  };
  type DeployRow = {
    vercel_deployment_id: string;
    vercel_project_id: string;
    project_name: string;
    url: string;
    state: VercelDeploymentApi['state'];
    target: 'production' | 'staging' | 'preview';
    creator_username: string | null;
    commit_sha: string | null;
    commit_message: string | null;
    git_branch: string | null;
    meta: Record<string, unknown>;
    created_at_vercel: string;
    ready_at: string | null;
    last_synced_at: string;
  };

  const projectRows: ProjRow[] = projects.map((p) => {
    const deps = deploymentsByProject.get(p.id) ?? [];
    const mostRecent = deps.reduce<number>((max, d) => Math.max(max, d.created), 0);
    return {
      vercel_project_id: p.id,
      name: p.name,
      framework: p.framework,
      production_url:
        p.targets?.production?.alias?.[0] ??
        p.alias?.find((a) => !a.domain.endsWith('.vercel.app'))?.domain ??
        p.alias?.[0]?.domain ??
        null,
      last_deployment_at: mostRecent > 0 ? new Date(mostRecent).toISOString() : null,
      last_synced_at: now,
    };
  });

  const deploymentRows: DeployRow[] = [];
  for (const p of projects) {
    const deps = deploymentsByProject.get(p.id) ?? [];
    for (const d of deps) {
      const meta = (d.meta ?? {}) as Record<string, unknown>;
      deploymentRows.push({
        vercel_deployment_id: d.uid,
        vercel_project_id: p.id,
        project_name: p.name,
        url: d.url,
        state: d.state,
        target: (d.target ?? 'preview') as 'production' | 'staging' | 'preview',
        creator_username: d.creator?.username ?? null,
        commit_sha: (meta.githubCommitSha as string | undefined) ?? null,
        commit_message: (meta.githubCommitMessage as string | undefined) ?? null,
        git_branch: (meta.githubCommitRef as string | undefined) ?? null,
        meta,
        created_at_vercel: new Date(d.created).toISOString(),
        ready_at: d.ready ? new Date(d.ready).toISOString() : null,
        last_synced_at: now,
      });
    }
  }

  if (emitJsonPath) {
    fs.writeFileSync(
      emitJsonPath,
      JSON.stringify({ projects: projectRows, deployments: deploymentRows }, null, 2),
    );
    console.log(`[seed-vercel] ✅ Wrote ${projectRows.length} projects + ${deploymentRows.length} deployments → ${emitJsonPath}`);
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    '';
  if (!supabaseUrl || !supabaseKey) {
    console.error('[seed-vercel] Missing SUPABASE_URL / SUPABASE_SERVICE_KEY');
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`[seed-vercel] Upserting ${projectRows.length} projects...`);
  const { error: projErr } = await supabase
    .from('vercel_projects')
    .upsert(projectRows, { onConflict: 'vercel_project_id' });
  if (projErr) {
    console.error('[seed-vercel] projects upsert failed:', projErr.message);
    process.exit(1);
  }

  console.log(`[seed-vercel] Upserting ${deploymentRows.length} deployments...`);
  const { error: depErr } = await supabase
    .from('vercel_deployments')
    .upsert(deploymentRows, { onConflict: 'vercel_deployment_id' });
  if (depErr) {
    console.error('[seed-vercel] deployments upsert failed:', depErr.message);
    process.exit(1);
  }

  console.log('[seed-vercel] ✅ Upsert complete.');

  // Fire foundation.deployment.live events for production deployments that
  // landed in READY state since last sync. Coarse-grained (no de-dupe vs prior
  // runs); event_log has its own idempotency path per consumer.
  const recentReadyProd = deploymentRows.filter(
    (d) => d.state === 'READY' && d.target === 'production',
  );
  if (recentReadyProd.length > 0) {
    try {
      await supabase.from('event_log').insert(
        recentReadyProd.slice(0, 20).map((d) => ({
          topic: 'foundation.deployment.live',
          schema_version: '1.0',
          correlation_id: crypto.randomUUID(),
          causation_id: null,
          venture_id: null,
          emitted_by: 'script:seed-vercel-deployments',
          payload: {
            projectName: d.project_name,
            url: d.url,
            target: d.target,
            commitSha: d.commit_sha,
            commitMessage: d.commit_message,
          },
          status: 'published',
        })),
      );
      console.log(`[seed-vercel] 🔔 Emitted ${Math.min(recentReadyProd.length, 20)} foundation.deployment.live events.`);
    } catch (err) {
      console.warn('[seed-vercel] event emit failed (non-fatal):', err instanceof Error ? err.message : err);
    }
  }

  // Sample sanity
  const { data: sample } = await supabase
    .from('vercel_deployments')
    .select('project_name, state, target, created_at_vercel, url')
    .order('created_at_vercel', { ascending: false })
    .limit(10);
  console.log('[seed-vercel] 10 most recent deployments:');
  for (const row of sample ?? []) {
    console.log(
      `  ${(row.project_name as string).padEnd(24)} ${(row.state as string).padEnd(10)} ` +
      `${(row.target as string).padEnd(10)} ${(row.created_at_vercel as string).slice(0, 19)}`,
    );
  }
}

main().catch((err) => {
  console.error('[seed-vercel] FATAL:', err?.message ?? err);
  process.exit(1);
});
