import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// Helpers (mirror commands.ts patterns)
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string | number): string {
  const ts = typeof dateStr === 'number' ? dateStr : new Date(dateStr).getTime();
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function fetchJson(url: string, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Tool Handlers
// ---------------------------------------------------------------------------

const listRepos: KitToolHandler = async (_input, ctx) => {
  const data = await fetchJson('/api/github?action=repos', ctx);
  const repos = data.repos ?? [];
  const lines = repos.map(
    (r: { name: string; updated: string; open_issues: number; description?: string; error?: string }) =>
      r.error
        ? `- **${r.name}** — ${r.error}`
        : `- **${r.name}** — ${r.description || 'No description'} · updated ${timeAgo(r.updated)} · ${r.open_issues} issues`,
  );
  return {
    success: true,
    data: repos,
    displayMarkdown: `## Repositories\n\n${lines.join('\n')}`,
  };
};

const listPrs: KitToolHandler = async (input, ctx) => {
  const repo = (input.repo as string) || 'mcv-one-desktop';
  const data = await fetchJson(`/api/github?action=prs&repo=${encodeURIComponent(repo)}`, ctx);
  const prs = data.prs ?? [];
  if (prs.length === 0) {
    return { success: true, data: [], displayMarkdown: `No PRs found for **${repo}**.` };
  }
  const lines = prs.map(
    (pr: { number: number; title: string; state: string; merged: string | null; author: string; updated: string }) => {
      const status = pr.merged ? '`merged`' : pr.state === 'open' ? '`open`' : '`closed`';
      return `- #${pr.number} ${status} **${pr.title}** by ${pr.author} · ${timeAgo(pr.updated)}`;
    },
  );
  return {
    success: true,
    data: prs,
    displayMarkdown: `## PRs — ${repo}\n\n${lines.join('\n')}`,
  };
};

const listCommits: KitToolHandler = async (input, ctx) => {
  const repo = (input.repo as string) || 'mcv-one-desktop';
  const data = await fetchJson(`/api/github?action=commits&repo=${encodeURIComponent(repo)}`, ctx);
  const commits = data.commits ?? [];
  const lines = commits.map(
    (c: { sha: string; message: string; author: string; date: string }) =>
      `- \`${c.sha}\` ${c.message} — ${c.author}, ${timeAgo(c.date)}`,
  );
  return {
    success: true,
    data: commits,
    displayMarkdown: `## Recent Commits — ${repo}\n\n${lines.join('\n')}`,
  };
};

const checkStatus: KitToolHandler = async (_input, ctx) => {
  const [gh, vc] = await Promise.all([
    fetchJson('/api/github?action=overview', ctx).catch(() => null),
    fetchJson('/api/vercel-status?action=deployments', ctx).catch(() => null),
  ]);

  let md = '## System Status\n\n';
  if (gh) {
    md += '### GitHub Repos\n\n| Repo | Last Push | Issues |\n|------|-----------|--------|\n';
    for (const r of gh.repos) {
      md += `| ${r.name} | ${r.updated ? timeAgo(r.updated) : 'N/A'} | ${r.open_issues} |\n`;
    }
    if (gh.recent_commits?.length) {
      md += `\n**Recent commits (mcv-one-desktop):**\n`;
      for (const c of gh.recent_commits) {
        md += `- \`${c.sha}\` ${c.message}\n`;
      }
    }
  }
  if (vc?.deployments?.length) {
    md += '\n### Vercel Deployments\n\n';
    for (const d of vc.deployments.slice(0, 5)) {
      const state = d.state === 'READY' ? 'live' : d.state;
      md += `- \`${state}\` **${d.name}** → ${d.target || 'preview'}\n`;
    }
  }
  return { success: true, data: { github: gh, vercel: vc }, displayMarkdown: md };
};

// ---------------------------------------------------------------------------
// Manifest & Export
// ---------------------------------------------------------------------------

export const manifest: KitManifest = {
  id: 'github-ops',
  name: 'GitHub Operations',
  version: '1.0.0',
  description: 'List repositories, pull requests, commits, and check system status across all EdgeIQ GitHub repos.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks about code repositories, pull requests, commits, deployment status, or system health.',
  tools: [
    {
      name: 'list_repos',
      description: 'List all GitHub repositories with their descriptions, last update time, and open issue count.',
      input_schema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'list_prs',
      description: 'List recent pull requests for a given repository. Defaults to mcv-one-desktop if no repo specified.',
      input_schema: {
        type: 'object',
        properties: {
          repo: { type: 'string', description: 'Repository name (e.g. "mcv-one-desktop", "Futurestate")' },
        },
      },
    },
    {
      name: 'list_commits',
      description: 'List recent commits for a given repository. Defaults to mcv-one-desktop if no repo specified.',
      input_schema: {
        type: 'object',
        properties: {
          repo: { type: 'string', description: 'Repository name (e.g. "mcv-one-desktop", "Futurestate")' },
        },
      },
    },
    {
      name: 'check_status',
      description: 'Get a full system status overview including GitHub repos, recent commits, and Vercel deployments.',
      input_schema: { type: 'object', properties: {}, required: [] },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  list_repos: listRepos,
  list_prs: listPrs,
  list_commits: listCommits,
  check_status: checkStatus,
};
