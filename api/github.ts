import { requireAuth } from "./_middleware";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_USER = 'amoustakas';

const REPOS = [
  'mcv-one-desktop',
  'mcv-one',
  'Futurestate',
  'Bet-Edge',
  'mcv-one-admin-prototype',
];

async function ghFetch(path: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
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
  if (!GITHUB_TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN not configured' });

  const action = req.query.action as string;
  const repo = req.query.repo as string;

  try {
    switch (action) {
      case 'repos': {
        const results = await Promise.all(
          REPOS.map(async (name) => {
            try {
              const r = await ghFetch(`/repos/${GITHUB_USER}/${name}`);
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
        const prs = await ghFetch(`/repos/${GITHUB_USER}/${target}/pulls?state=all&per_page=10&sort=updated&direction=desc`);
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
        const commits = await ghFetch(`/repos/${GITHUB_USER}/${target}/commits?per_page=10`);
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
                const r = await ghFetch(`/repos/${GITHUB_USER}/${name}`);
                return { name: r.name, updated: r.pushed_at, open_issues: r.open_issues_count };
              } catch {
                return { name, updated: null, open_issues: 0 };
              }
            })
          ),
          ghFetch(`/repos/${GITHUB_USER}/mcv-one-desktop/pulls?state=open&per_page=5`),
          ghFetch(`/repos/${GITHUB_USER}/mcv-one-desktop/commits?per_page=5`),
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

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
