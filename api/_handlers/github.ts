import { getProviderToken } from './_oauth-helper.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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


const GITHUB_USER = 'amoustakas';

const REPOS = [
  'mcv-one-desktop',
  'mcv-one',
  'Futurestate',
  'Bet-Edge',
  'mcv-one-admin-prototype',
];

async function ghFetch(path: string, token: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function ghMutate(path: string, token: string, method: string, body?: unknown) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  if (res.status === 204) return { success: true };
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  if (!['GET', 'POST'].includes(req.method || '')) return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action as string;
  const repo = req.query.repo as string;

  // Bare GET without action = health-check ping (used by Command Center
  // System Health card). Returns 200 OK with a summary regardless of auth.
  if (!action) {
    return res.json({
      ok: true, service: 'github',
      actions: ['repos','prs','commits','overview','branches','tree','file','pr-files','commit-detail','create-issue','update-issue','close-issue','add-issue-comment','create-pr','merge-pr'],
    });
  }

  let token: string;
  try {
    const result = await getProviderToken(userId, 'github');
    token = result.token;
  } catch {
    return res.status(503).json({ error: 'GitHub not connected. Add a token in Settings > Integrations or set GITHUB_TOKEN env var.' });
  }

  try {
    switch (action) {
      case 'repos': {
        const results = await Promise.all(
          REPOS.map(async (name) => {
            try {
              const r = await ghFetch(`/repos/${GITHUB_USER}/${name}`, token);
              return {
                name: r.name,
                description: r.description,
                url: r.html_url,
                stars: r.stargazers_count,
                updated: r.pushed_at,
                language: r.language,
                open_issues: r.open_issues_count,
              };
            } catch {
              return { name, error: 'Not found or no access' };
            }
          })
        );
        return res.json({ repos: results });
      }

      case 'prs': {
        const target = repo || 'mcv-one-desktop';
        const prs = await ghFetch(`/repos/${GITHUB_USER}/${target}/pulls?state=all&per_page=10&sort=updated&direction=desc`, token);
        return res.json({
          prs: prs.map((pr: Record<string, unknown>) => ({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            url: pr.html_url,
            author: (pr.user as Record<string, unknown>)?.login,
            created: pr.created_at,
            updated: pr.updated_at,
            merged: pr.merged_at,
            draft: pr.draft,
          })),
        });
      }

      case 'commits': {
        const target = repo || 'mcv-one-desktop';
        const commits = await ghFetch(`/repos/${GITHUB_USER}/${target}/commits?per_page=10`, token);
        return res.json({
          commits: commits.map((c: Record<string, unknown>) => {
            const commit = c.commit as Record<string, unknown>;
            const author = commit.author as Record<string, unknown>;
            return {
              sha: (c.sha as string).slice(0, 7),
              message: (commit.message as string).split('\n')[0],
              author: author?.name,
              date: author?.date,
              url: c.html_url,
            };
          }),
        });
      }

      case 'overview': {
        const [reposData, desktopPrs, desktopCommits] = await Promise.all([
          Promise.all(
            REPOS.map(async (name) => {
              try {
                const r = await ghFetch(`/repos/${GITHUB_USER}/${name}`, token);
                return { name: r.name, updated: r.pushed_at, open_issues: r.open_issues_count };
              } catch {
                return { name, updated: null, open_issues: 0 };
              }
            })
          ),
          ghFetch(`/repos/${GITHUB_USER}/mcv-one-desktop/pulls?state=open&per_page=5`, token),
          ghFetch(`/repos/${GITHUB_USER}/mcv-one-desktop/commits?per_page=5`, token),
        ]);

        return res.json({
          repos: reposData,
          open_prs: desktopPrs.length,
          recent_commits: desktopCommits.map((c: Record<string, unknown>) => {
            const commit = c.commit as Record<string, unknown>;
            const author = commit.author as Record<string, unknown>;
            return {
              sha: (c.sha as string).slice(0, 7),
              message: (commit.message as string).split('\n')[0],
              date: author?.date,
            };
          }),
        });
      }

      // ── Repository browsing (Phase B) ──────────────────────────

      case 'branches': {
        const repoName = repo || 'mcv-one-desktop';
        const data = await ghFetch(`/repos/${GITHUB_USER}/${repoName}/branches?per_page=50`, token);
        const branches = data.map((b: { name: string; commit: { sha: string }; protected: boolean }) => ({
          name: b.name,
          sha: b.commit.sha.slice(0, 7),
          protected: b.protected,
        }));
        return res.json({ branches });
      }

      case 'tree': {
        const repoName = repo || 'mcv-one-desktop';
        const branch = (req.query.branch as string) || 'master';
        // Get the tree SHA from the branch ref
        const ref = await ghFetch(`/repos/${GITHUB_USER}/${repoName}/git/ref/heads/${branch}`, token);
        const treeSha = ref.object.sha;
        const data = await ghFetch(`/repos/${GITHUB_USER}/${repoName}/git/trees/${treeSha}?recursive=1`, token);
        const entries = (data.tree ?? []).map((e: { path: string; mode: string; type: string; sha: string; size?: number }) => ({
          path: e.path,
          type: e.type, // 'blob' or 'tree'
          sha: e.sha.slice(0, 7),
          size: e.size,
        }));
        return res.json({ tree: entries, sha: treeSha.slice(0, 7), truncated: data.truncated });
      }

      case 'file': {
        const repoName = repo || 'mcv-one-desktop';
        const path = req.query.path as string;
        const branch = (req.query.branch as string) || 'master';
        if (!path) return res.status(400).json({ error: 'path required' });
        const data = await ghFetch(`/repos/${GITHUB_USER}/${repoName}/contents/${encodeURIComponent(path)}?ref=${branch}`, token);
        let content = '';
        if (data.content && data.encoding === 'base64') {
          content = Buffer.from(data.content, 'base64').toString('utf-8');
        }
        return res.json({
          name: data.name,
          path: data.path,
          sha: data.sha?.slice(0, 7),
          size: data.size,
          content,
          encoding: 'utf-8',
        });
      }

      case 'pr-files': {
        const repoName = repo || 'mcv-one-desktop';
        const prNumber = req.query.pr as string;
        if (!prNumber) return res.status(400).json({ error: 'pr number required' });
        const data = await ghFetch(`/repos/${GITHUB_USER}/${repoName}/pulls/${prNumber}/files?per_page=100`, token);
        const files = data.map((f: { filename: string; status: string; additions: number; deletions: number; patch?: string }) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          patch: f.patch,
        }));
        return res.json({ files });
      }

      case 'commit-detail': {
        const repoName = repo || 'mcv-one-desktop';
        const sha = req.query.sha as string;
        if (!sha) return res.status(400).json({ error: 'sha required' });
        const data = await ghFetch(`/repos/${GITHUB_USER}/${repoName}/commits/${sha}`, token);
        const commit = data.commit as Record<string, unknown>;
        const author = commit.author as Record<string, unknown>;
        return res.json({
          sha: (data.sha as string).slice(0, 7),
          message: commit.message,
          author: author?.name,
          date: author?.date,
          stats: data.stats,
          files: (data.files ?? []).map((f: { filename: string; status: string; additions: number; deletions: number; patch?: string }) => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
            patch: f.patch,
          })),
        });
      }

      // ── Issue CRUD (Phase C) ─────────────────────────────────

      case 'create-issue': {
        const repoName = repo || 'mcv-one-desktop';
        const { title, body: issueBody, labels, assignees } = req.body;
        if (!title) return res.status(400).json({ error: 'title required' });
        const data = await ghMutate(`/repos/${GITHUB_USER}/${repoName}/issues`, token, 'POST', {
          title, body: issueBody || '', labels: labels || [], assignees: assignees || [],
        });
        return res.json({ issue: { number: data.number, title: data.title, url: data.html_url, state: data.state } });
      }

      case 'update-issue': {
        const repoName = repo || 'mcv-one-desktop';
        const { number, title, body: issueBody, state, labels } = req.body;
        if (!number) return res.status(400).json({ error: 'number required' });
        const payload: Record<string, unknown> = {};
        if (title !== undefined) payload.title = title;
        if (issueBody !== undefined) payload.body = issueBody;
        if (state !== undefined) payload.state = state;
        if (labels !== undefined) payload.labels = labels;
        const data = await ghMutate(`/repos/${GITHUB_USER}/${repoName}/issues/${number}`, token, 'PATCH', payload);
        return res.json({ issue: { number: data.number, title: data.title, url: data.html_url, state: data.state } });
      }

      case 'close-issue': {
        const repoName = repo || 'mcv-one-desktop';
        const { number } = req.body;
        if (!number) return res.status(400).json({ error: 'number required' });
        const data = await ghMutate(`/repos/${GITHUB_USER}/${repoName}/issues/${number}`, token, 'PATCH', { state: 'closed' });
        return res.json({ issue: { number: data.number, title: data.title, state: data.state } });
      }

      case 'add-issue-comment': {
        const repoName = repo || 'mcv-one-desktop';
        const { number, body: commentBody } = req.body;
        if (!number || !commentBody) return res.status(400).json({ error: 'number and body required' });
        const data = await ghMutate(`/repos/${GITHUB_USER}/${repoName}/issues/${number}/comments`, token, 'POST', { body: commentBody });
        return res.json({ comment: { id: data.id, url: data.html_url, created: data.created_at } });
      }

      case 'list-issues': {
        const repoName = repo || 'mcv-one-desktop';
        const state = (req.query.state as string) || 'open';
        const data = await ghFetch(`/repos/${GITHUB_USER}/${repoName}/issues?state=${state}&per_page=20`, token);
        return res.json({
          issues: data.map((i: Record<string, unknown>) => ({
            number: i.number, title: i.title, state: i.state, url: i.html_url,
            labels: ((i.labels as Array<{ name: string }>) || []).map((l) => l.name),
            created: i.created_at, updated: i.updated_at,
          })),
        });
      }

      // ── Pull Request CRUD (Phase C) ───────────────────────────

      case 'create-pr': {
        const repoName = repo || 'mcv-one-desktop';
        const { title, body: prBody, head, base } = req.body;
        if (!title || !head || !base) return res.status(400).json({ error: 'title, head, and base required' });
        const data = await ghMutate(`/repos/${GITHUB_USER}/${repoName}/pulls`, token, 'POST', {
          title, body: prBody || '', head, base,
        });
        return res.json({ pr: { number: data.number, title: data.title, url: data.html_url, state: data.state } });
      }

      case 'merge-pr': {
        const repoName = repo || 'mcv-one-desktop';
        const { number, merge_method } = req.body;
        if (!number) return res.status(400).json({ error: 'number required' });
        const data = await ghMutate(`/repos/${GITHUB_USER}/${repoName}/pulls/${number}/merge`, token, 'PUT', {
          merge_method: merge_method || 'squash',
        });
        return res.json({ merged: data.merged, message: data.message, sha: data.sha });
      }

      // ── Release CRUD (Phase C) ────────────────────────────────

      case 'create-release': {
        const repoName = repo || 'mcv-one-desktop';
        const { tag_name, name, body: releaseBody, draft, prerelease } = req.body;
        if (!tag_name) return res.status(400).json({ error: 'tag_name required' });
        const data = await ghMutate(`/repos/${GITHUB_USER}/${repoName}/releases`, token, 'POST', {
          tag_name, name: name || tag_name, body: releaseBody || '', draft: draft || false, prerelease: prerelease || false,
        });
        return res.json({ release: { id: data.id, tag: data.tag_name, url: data.html_url } });
      }

      case 'list-releases': {
        const repoName = repo || 'mcv-one-desktop';
        const data = await ghFetch(`/repos/${GITHUB_USER}/${repoName}/releases?per_page=10`, token);
        return res.json({
          releases: data.map((r: Record<string, unknown>) => ({
            id: r.id, tag: r.tag_name, name: r.name, url: r.html_url,
            draft: r.draft, prerelease: r.prerelease, published: r.published_at,
          })),
        });
      }

      // ── Branch management (Phase C) ───────────────────────────

      case 'create-branch': {
        const repoName = repo || 'mcv-one-desktop';
        const { branch, sha } = req.body;
        if (!branch || !sha) return res.status(400).json({ error: 'branch and sha required' });
        const data = await ghMutate(`/repos/${GITHUB_USER}/${repoName}/git/refs`, token, 'POST', {
          ref: `refs/heads/${branch}`, sha,
        });
        return res.json({ ref: data.ref, sha: data.object?.sha });
      }

      case 'delete-branch': {
        const repoName = repo || 'mcv-one-desktop';
        const { branch } = req.body;
        if (!branch) return res.status(400).json({ error: 'branch required' });
        await ghMutate(`/repos/${GITHUB_USER}/${repoName}/git/refs/heads/${branch}`, token, 'DELETE');
        return res.json({ success: true, branch });
      }

      // ── Actions (Phase C) ─────────────────────────────────────

      case 'trigger-workflow': {
        const repoName = repo || 'mcv-one-desktop';
        const { workflow_id, ref, inputs } = req.body;
        if (!workflow_id) return res.status(400).json({ error: 'workflow_id required' });
        await ghMutate(`/repos/${GITHUB_USER}/${repoName}/actions/workflows/${workflow_id}/dispatches`, token, 'POST', {
          ref: ref || 'master', inputs: inputs || {},
        });
        return res.json({ success: true, workflow_id });
      }

      case 'list-actions': {
        const repoName = repo || 'mcv-one-desktop';
        const data = await ghFetch(`/repos/${GITHUB_USER}/${repoName}/actions/runs?per_page=10`, token);
        return res.json({
          runs: (data.workflow_runs || []).map((r: Record<string, unknown>) => ({
            id: r.id, name: r.name, status: r.status, conclusion: r.conclusion,
            url: r.html_url, branch: r.head_branch, created: r.created_at,
          })),
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error));
    return res.status(500).json({ error: message });
  }
}
