import { requireAuth } from "./_middleware";
import { getProviderToken } from './_oauth-helper';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  let token: string;
  try {
    const result = await getProviderToken(userId, 'github');
    token = result.token;
  } catch {
    return res.status(500).json({ error: 'GitHub not connected. Add a token in Settings > Integrations or set GITHUB_TOKEN env var.' });
  }

  const action = req.query.action as string;
  const repo = req.query.repo as string;

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

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
