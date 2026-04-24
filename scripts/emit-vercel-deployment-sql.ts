// One-shot helper: reads /tmp/vercel-seed.json and emits INSERT batches of
// `vercel_deployments` to stdout, split so each batch fits comfortably under
// any execute_sql size limit. Run:
//   npx tsx scripts/emit-vercel-deployment-sql.ts > /tmp/vercel-deployments.sql
// Then feed /tmp/vercel-deployments.sql batch-by-batch through the Supabase MCP
// execute_sql tool. Delete this file after use — not part of the shipping
// code path; .env-blessed seed-vercel-deployments.ts is canonical.

import fs from 'node:fs';
import path from 'node:path';

type Deploy = {
  vercel_deployment_id: string;
  vercel_project_id: string;
  project_name: string;
  url: string;
  state: string;
  target: string;
  creator_username: string | null;
  commit_sha: string | null;
  commit_message: string | null;
  git_branch: string | null;
  meta: Record<string, unknown>;
  created_at_vercel: string;
  ready_at: string | null;
  last_synced_at: string;
};

const jsonPath = process.argv[2] ?? path.join(process.env.TEMP ?? '/tmp', 'vercel-seed.json');
const raw = fs.readFileSync(jsonPath, 'utf8');
const parsed = JSON.parse(raw) as { deployments: Deploy[] };
const rows = parsed.deployments;

const BATCH = 25;
const esc = (v: string | null): string => {
  if (v === null) return 'NULL';
  return `'${v.replace(/'/g, "''")}'`;
};

// Keep only a minimal meta slice — drop the full commit message (which is
// already captured in the dedicated commit_message column) and any large
// nested blobs. Shrinks the SQL payload by ~10x so MCP execute_sql batches fit.
const META_KEYS = ['githubCommitSha', 'githubCommitRef', 'githubCommitOrg', 'githubRepo', 'branchAlias'] as const;
function sliceMeta(m: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of META_KEYS) if (k in m) out[k] = m[k];
  return out;
}

// Also truncate commit_message to 500 chars so we don't bloat a row on big commits.
function truncate(s: string | null, max = 500): string | null {
  if (s === null) return null;
  return s.length > max ? s.slice(0, max) + '…' : s;
}

for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const values = batch.map((d) => {
    const metaJson = JSON.stringify(sliceMeta(d.meta ?? {})).replace(/'/g, "''");
    return `(${esc(d.vercel_deployment_id)}, ${esc(d.vercel_project_id)}, ${esc(d.project_name)}, ${esc(d.url)}, ${esc(d.state)}, ${esc(d.target)}, ${esc(d.creator_username)}, ${esc(d.commit_sha)}, ${esc(truncate(d.commit_message))}, ${esc(d.git_branch)}, '${metaJson}'::jsonb, ${esc(d.created_at_vercel)}, ${esc(d.ready_at)}, ${esc(d.last_synced_at)})`;
  }).join(',\n');
  process.stdout.write(`-- Batch ${Math.floor(i / BATCH) + 1} of ${Math.ceil(rows.length / BATCH)} (${batch.length} rows)\n`);
  process.stdout.write(
    `INSERT INTO vercel_deployments (vercel_deployment_id, vercel_project_id, project_name, url, state, target, creator_username, commit_sha, commit_message, git_branch, meta, created_at_vercel, ready_at, last_synced_at) VALUES\n` +
    values +
    `\nON CONFLICT (vercel_deployment_id) DO UPDATE SET state = EXCLUDED.state, ready_at = EXCLUDED.ready_at, last_synced_at = EXCLUDED.last_synced_at;\n\n`,
  );
}
