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

// ---------------------------------------------------------------------------
// Phase B: Repository Browsing Tools
// ---------------------------------------------------------------------------

const browseRepoTree: KitToolHandler = async (input, ctx) => {
  const repo = (input.repo as string) || 'mcv-one-desktop';
  const branch = (input.branch as string) || 'master';
  const data = await fetchJson(`/api/github?action=tree&repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`, ctx);
  const entries = data.tree ?? [];
  const folders = entries.filter((e: { type: string }) => e.type === 'tree');
  const files = entries.filter((e: { type: string }) => e.type === 'blob');
  let md = `## ${repo} (${branch})\n\n`;
  md += `*${folders.length} folders, ${files.length} files*\n\n`;
  // Show top-level structure
  const topLevel = entries.filter((e: { path: string }) => !e.path.includes('/'));
  for (const e of topLevel.slice(0, 30)) {
    md += `- ${e.type === 'tree' ? '📁' : '📄'} ${e.path}\n`;
  }
  if (topLevel.length > 30) md += `\n*... ${topLevel.length - 30} more*`;
  return { success: true, data: entries, displayMarkdown: md };
};

const readRepoFile: KitToolHandler = async (input, ctx) => {
  const repo = (input.repo as string) || 'mcv-one-desktop';
  const path = input.path as string;
  const branch = (input.branch as string) || 'master';
  const data = await fetchJson(`/api/github?action=file&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}&branch=${encodeURIComponent(branch)}`, ctx);
  const content = data.content ?? '';
  const preview = content.length > 3000 ? content.slice(0, 3000) + '\n\n*... truncated*' : content;
  const ext = path.split('.').pop() || '';
  return {
    success: true,
    data: { path: data.path, size: data.size },
    displayMarkdown: `## ${data.path}\n\n\`\`\`${ext}\n${preview}\n\`\`\`\n\n*${data.size} bytes*`,
  };
};

const getPrDiff: KitToolHandler = async (input, ctx) => {
  const repo = (input.repo as string) || 'mcv-one-desktop';
  const pr = input.pr_number as string;
  const data = await fetchJson(`/api/github?action=pr-files&repo=${encodeURIComponent(repo)}&pr=${pr}`, ctx);
  const files = data.files ?? [];
  const totalAdd = files.reduce((s: number, f: { additions: number }) => s + f.additions, 0);
  const totalDel = files.reduce((s: number, f: { deletions: number }) => s + f.deletions, 0);
  let md = `## PR #${pr} — ${files.length} files changed (+${totalAdd} -${totalDel})\n\n`;
  for (const f of files) {
    md += `- **${f.filename}** \`${f.status}\` +${f.additions}/-${f.deletions}\n`;
  }
  return { success: true, data: files, displayMarkdown: md };
};

// Update manifest tools to include new ones
manifest.tools.push(
  {
    name: 'browse_repo_tree',
    description: 'Browse the file/folder structure of a GitHub repository. Returns the full directory tree.',
    input_schema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'Repository name (default: mcv-one-desktop)' },
        branch: { type: 'string', description: 'Branch name (default: master)' },
      },
    },
  },
  {
    name: 'read_repo_file',
    description: 'Read the contents of a specific file from a GitHub repository.',
    input_schema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'File path within the repo (e.g. "src/App.tsx")' },
        branch: { type: 'string', description: 'Branch name (default: master)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'get_pr_diff',
    description: 'Get the file changes (diff) for a pull request. Shows which files were modified and the line counts.',
    input_schema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'Repository name' },
        pr_number: { type: 'string', description: 'Pull request number' },
      },
      required: ['pr_number'],
    },
  },
);

export const handlers: Record<string, KitToolHandler> = {
  list_repos: listRepos,
  list_prs: listPrs,
  list_commits: listCommits,
  check_status: checkStatus,
  browse_repo_tree: browseRepoTree,
  read_repo_file: readRepoFile,
  get_pr_diff: getPrDiff,
};
