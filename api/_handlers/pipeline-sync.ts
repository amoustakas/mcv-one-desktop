import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}


const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

/**
 * Pipeline Sync — ingests local machine data into Supabase for cross-device access.
 *
 * Called by the frontend when local server data is available.
 * Upserts data to avoid duplicates.
 */
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
  const userId = await requireAuth(req, res); if (!userId) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const action = req.body?.action;

  try {
    switch (action) {
      // ── Sync git commits as activities ──
      case 'sync-commits': {
        const { commits, repo } = req.body;
        if (!commits?.length) return res.json({ synced: 0 });

        const activities = commits.slice(0, 30).map((c: { sha: string; date: string; author: string; message: string }) => ({
          type: 'commit',
          title: `[${repo}] ${c.message.slice(0, 200)}`,
          description: `${c.author} · ${c.sha.slice(0, 7)}`,
          venture_id: guessVenture(repo),
          metadata: { sha: c.sha, repo, author: c.author, source: 'pipeline-sync' },
          created_at: c.date,
        }));

        // Upsert — use sha in metadata to detect duplicates
        let synced = 0;
        for (const act of activities) {
          const { data: existing } = await supabase
            .from('activities')
            .select('id')
            .eq('type', 'commit')
            .contains('metadata', { sha: act.metadata.sha })
            .limit(1);

          if (!existing?.length) {
            await supabase.from('activities').insert(act);
            synced++;
          }
        }

        return res.json({ synced, total: commits.length });
      }

      // ── Sync memory files as documents ──
      case 'sync-memories': {
        const { memories } = req.body;
        if (!memories?.length) return res.json({ synced: 0 });

        let synced = 0;
        for (const project of memories) {
          const ventureId = guessVentureFromProject(project.project);

          for (const file of project.files) {
            // Check if already exists by path in metadata
            const { data: existing } = await supabase
              .from('documents')
              .select('id, updated_at')
              .contains('metadata', { localPath: file.path })
              .limit(1);

            if (existing?.length) {
              // Update if file is newer
              const existingDate = new Date(existing[0].updated_at).getTime();
              const fileDate = new Date(file.modified).getTime();
              if (fileDate > existingDate) {
                await supabase.from('documents').update({
                  updated_at: file.modified,
                }).eq('id', existing[0].id);
                synced++;
              }
            } else {
              // Insert new
              await supabase.from('documents').insert({
                user_id: userId,
                venture_id: ventureId,
                title: file.name.replace('.md', '').replace(/_/g, ' ').replace(/-/g, ' '),
                doc_type: file.name.startsWith('feedback') ? 'note' : file.name.startsWith('project') ? 'status-report' : file.name.startsWith('user') ? 'overview' : file.name.startsWith('reference') ? 'architecture' : 'note',
                metadata: { localPath: file.path, source: 'pipeline-sync', project: project.project },
                created_at: file.modified,
                updated_at: file.modified,
              });
              synced++;
            }
          }
        }

        return res.json({ synced });
      }

      // ── Sync repo stats as tasks (uncommitted work) ──
      case 'sync-repos': {
        const { repos } = req.body;
        if (!repos?.length) return res.json({ synced: 0 });

        let synced = 0;
        for (const repo of repos) {
          if (repo.uncommittedChanges > 0) {
            // Create or update a task for uncommitted work
            const { data: existing } = await supabase
              .from('tasks')
              .select('id')
              .contains('metadata', { type: 'uncommitted', repo: repo.name })
              .eq('status', 'in_progress')
              .limit(1);

            if (existing?.length) {
              await supabase.from('tasks').update({
                title: `${repo.uncommittedChanges} uncommitted changes in ${repo.name}`,
                updated_at: new Date().toISOString(),
              }).eq('id', existing[0].id);
            } else {
              await supabase.from('tasks').insert({
                user_id: userId,
                venture_id: guessVenture(repo.name),
                title: `${repo.uncommittedChanges} uncommitted changes in ${repo.name}`,
                status: 'in_progress',
                priority: repo.uncommittedChanges > 20 ? 'high' : 'medium',
                metadata: { type: 'uncommitted', repo: repo.name, source: 'pipeline-sync' },
              });
            }
            synced++;
          }
        }

        return res.json({ synced });
      }

      // ── Sync notifications for significant events ──
      case 'sync-notifications': {
        const { events } = req.body;
        if (!events?.length) return res.json({ synced: 0 });

        const notifications = events.map((e: { type: string; title: string; description: string; ventureId?: string }) => ({
          type: e.type === 'error' ? 'error' : 'info',
          title: e.title,
          description: e.description,
          source: 'pipeline',
          venture_id: e.ventureId || null,
          read: false,
        }));

        const { data } = await supabase.from('notifications').insert(notifications).select('id');
        return res.json({ synced: data?.length || 0 });
      }

      // ── Full sync (all data types at once) ──
      case 'full-sync': {
        const { commits, memories, repos } = req.body;
        const results: Record<string, number> = {};

        if (commits?.length) {
          // Sync latest commits from each repo
          for (const batch of commits) {
            const activities = batch.commits.slice(0, 10).map((c: { sha: string; date: string; author: string; message: string }) => ({
              type: 'commit',
              title: `[${batch.repo}] ${c.message.slice(0, 200)}`,
              description: `${c.author} · ${c.sha.slice(0, 7)}`,
              venture_id: guessVenture(batch.repo),
              metadata: { sha: c.sha, repo: batch.repo, author: c.author, source: 'pipeline-sync' },
              created_at: c.date,
            }));

            for (const act of activities) {
              const { data: existing } = await supabase
                .from('activities')
                .select('id')
                .contains('metadata', { sha: act.metadata.sha })
                .limit(1);
              if (!existing?.length) {
                await supabase.from('activities').insert(act);
                results.commits = (results.commits || 0) + 1;
              }
            }
          }
        }

        if (memories?.length) {
          for (const project of memories) {
            const ventureId = guessVentureFromProject(project.project);
            for (const file of project.files) {
              const { data: existing } = await supabase
                .from('documents')
                .select('id')
                .contains('metadata', { localPath: file.path })
                .limit(1);
              if (!existing?.length) {
                await supabase.from('documents').insert({
                  user_id: userId,
                  venture_id: ventureId,
                  title: file.name.replace('.md', '').replace(/[_-]/g, ' '),
                  doc_type: 'note',
                  metadata: { localPath: file.path, source: 'pipeline-sync', project: project.project },
                  created_at: file.modified,
                  updated_at: file.modified,
                });
                results.memories = (results.memories || 0) + 1;
              }
            }
          }
        }

        if (repos?.length) {
          for (const repo of repos) {
            if (repo.uncommittedChanges > 0) {
              const { data: existing } = await supabase
                .from('tasks')
                .select('id')
                .contains('metadata', { type: 'uncommitted', repo: repo.name })
                .eq('status', 'in_progress')
                .limit(1);
              if (!existing?.length) {
                await supabase.from('tasks').insert({
                  user_id: userId,
                  venture_id: guessVenture(repo.name),
                  title: `${repo.uncommittedChanges} uncommitted changes in ${repo.name}`,
                  status: 'in_progress',
                  priority: repo.uncommittedChanges > 20 ? 'high' : 'medium',
                  metadata: { type: 'uncommitted', repo: repo.name, source: 'pipeline-sync' },
                });
                results.tasks = (results.tasks || 0) + 1;
              }
            }
          }
        }

        return res.json({ synced: results, total: Object.values(results).reduce((s, n) => s + n, 0) });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Sync failed' });
  }
}

// ── Helpers ──

function guessVenture(repoName: string): string {
  const lower = repoName.toLowerCase();
  if (lower.includes('futurestate')) return 'futurestate';
  if (lower.includes('bet-edge') || lower.includes('betedge')) return 'betedge';
  if (lower.includes('mcv-one') || lower.includes('mcv-desktop')) return 'mcv';
  if (lower.includes('warforge')) return 'warforge';
  if (lower.includes('edgeiq')) return 'edgeiq';
  if (lower.includes('arqlab')) return 'arqlabs';
  return 'mcv';
}

function guessVentureFromProject(projectName: string): string {
  const lower = projectName.toLowerCase();
  if (lower.includes('futurestate')) return 'futurestate';
  if (lower.includes('bet-edge') || lower.includes('betedge')) return 'betedge';
  if (lower.includes('mcv-one-desktop') || lower.includes('mcv-one-desktop')) return 'mcv';
  if (lower.includes('mcv')) return 'mcv';
  return 'mcv';
}
