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

async function postJson(url: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
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
// CRUD Handlers
// ---------------------------------------------------------------------------

const createIssue: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/github', { action: 'create-issue', repo: input.repo, title: input.title, body: input.body, labels: input.labels }, ctx);
  return { success: true, data: d, displayMarkdown: `**Issue created:** #${d.number} ${d.title}` };
};

const updateIssue: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/github', { action: 'update-issue', repo: input.repo, number: input.number, title: input.title, body: input.body, state: input.state }, ctx);
  return { success: true, data: d, displayMarkdown: `**Issue updated:** #${input.number}` };
};

const closeIssue: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/github', { action: 'close-issue', repo: input.repo, number: input.number }, ctx);
  return { success: true, data: d, displayMarkdown: `**Issue closed:** #${input.number}` };
};

const addComment: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/github', { action: 'add-comment', repo: input.repo, number: input.number, body: input.body }, ctx);
  return { success: true, data: d, displayMarkdown: `**Comment added** to #${input.number}` };
};

const createPr: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/github', { action: 'create-pr', repo: input.repo, title: input.title, body: input.body, head: input.head, base: input.base }, ctx);
  return { success: true, data: d, displayMarkdown: `**PR created:** #${d.number} ${d.title}` };
};

const mergePr: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/github', { action: 'merge-pr', repo: input.repo, number: input.number }, ctx);
  return { success: true, data: d, displayMarkdown: `**PR merged:** #${input.number}` };
};

const createRelease: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/github', { action: 'create-release', repo: input.repo, tag: input.tag, name: input.name, body: input.body }, ctx);
  return { success: true, data: d, displayMarkdown: `**Release created:** ${d.tag_name || input.tag} — ${d.name || input.name}` };
};

const createBranch: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/github', { action: 'create-branch', repo: input.repo, branch: input.branch, fromSha: input.fromSha }, ctx);
  return { success: true, data: d, displayMarkdown: `**Branch created:** \`${input.branch}\`` };
};

const listIssues: KitToolHandler = async (input, ctx) => {
  const repo = (input.repo as string) || 'mcv-one-desktop';
  const data = await fetchJson(`/api/github?action=issues&repo=${encodeURIComponent(repo)}`, ctx);
  const issues = data.issues ?? [];
  if (issues.length === 0) return { success: true, data: [], displayMarkdown: `No issues found for **${repo}**.` };
  const lines = issues.map(
    (i: { number: number; title: string; state: string; labels: string[] }) =>
      `- #${i.number} \`${i.state}\` **${i.title}** ${(i.labels || []).map((l: string) => `\`${l}\``).join(' ')}`,
  );
  return { success: true, data: issues, displayMarkdown: `## Issues — ${repo}\n\n${lines.join('\n')}` };
};

const listActions: KitToolHandler = async (input, ctx) => {
  const repo = (input.repo as string) || 'mcv-one-desktop';
  const data = await fetchJson(`/api/github?action=actions&repo=${encodeURIComponent(repo)}`, ctx);
  const runs = data.workflow_runs ?? [];
  if (runs.length === 0) return { success: true, data: [], displayMarkdown: `No workflow runs found for **${repo}**.` };
  const lines = runs.map(
    (r: { id: number; name: string; status: string; conclusion: string; created_at: string }) =>
      `- **${r.name}** \`${r.conclusion || r.status}\` — ${timeAgo(r.created_at)} \`${r.id}\``,
  );
  return { success: true, data: runs, displayMarkdown: `## Actions — ${repo}\n\n${lines.join('\n')}` };
};

// ---------------------------------------------------------------------------
// Manifest & Export
// ---------------------------------------------------------------------------

export const manifest: KitManifest = {
  id: 'github-ops',
  name: 'GitHub Operations',
  version: '2.0.0',
  description: 'Full GitHub CRUD — repositories, issues, pull requests, commits, releases, branches, actions, and system status.',
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

// CRUD tools
manifest.tools.push(
  {
    name: 'github_create_issue',
    description: 'Create a new GitHub issue.',
    input_schema: { type: 'object', properties: { repo: { type: 'string', description: 'Repository name' }, title: { type: 'string', description: 'Issue title' }, body: { type: 'string', description: 'Issue body' }, labels: { type: 'array', items: { type: 'string' }, description: 'Labels to apply' } }, required: ['repo', 'title'] },
  },
  {
    name: 'github_update_issue',
    description: 'Update an existing GitHub issue.',
    input_schema: { type: 'object', properties: { repo: { type: 'string', description: 'Repository name' }, number: { type: 'number', description: 'Issue number' }, title: { type: 'string' }, body: { type: 'string' }, state: { type: 'string', description: 'open or closed' } }, required: ['repo', 'number'] },
  },
  {
    name: 'github_close_issue',
    description: 'Close a GitHub issue.',
    input_schema: { type: 'object', properties: { repo: { type: 'string', description: 'Repository name' }, number: { type: 'number', description: 'Issue number' } }, required: ['repo', 'number'] },
  },
  {
    name: 'github_add_comment',
    description: 'Add a comment to an issue or PR.',
    input_schema: { type: 'object', properties: { repo: { type: 'string', description: 'Repository name' }, number: { type: 'number', description: 'Issue/PR number' }, body: { type: 'string', description: 'Comment body' } }, required: ['repo', 'number', 'body'] },
  },
  {
    name: 'github_create_pr',
    description: 'Create a new pull request.',
    input_schema: { type: 'object', properties: { repo: { type: 'string', description: 'Repository name' }, title: { type: 'string', description: 'PR title' }, body: { type: 'string', description: 'PR body' }, head: { type: 'string', description: 'Head branch' }, base: { type: 'string', description: 'Base branch' } }, required: ['repo', 'title', 'head', 'base'] },
  },
  {
    name: 'github_merge_pr',
    description: 'Merge a pull request.',
    input_schema: { type: 'object', properties: { repo: { type: 'string', description: 'Repository name' }, number: { type: 'number', description: 'PR number' } }, required: ['repo', 'number'] },
  },
  {
    name: 'github_create_release',
    description: 'Create a new release with a tag.',
    input_schema: { type: 'object', properties: { repo: { type: 'string', description: 'Repository name' }, tag: { type: 'string', description: 'Tag name (e.g. v1.0.0)' }, name: { type: 'string', description: 'Release name' }, body: { type: 'string', description: 'Release notes' } }, required: ['repo', 'tag'] },
  },
  {
    name: 'github_create_branch',
    description: 'Create a new branch from a SHA.',
    input_schema: { type: 'object', properties: { repo: { type: 'string', description: 'Repository name' }, branch: { type: 'string', description: 'New branch name' }, fromSha: { type: 'string', description: 'SHA to branch from' } }, required: ['repo', 'branch', 'fromSha'] },
  },
  {
    name: 'github_list_issues',
    description: 'List open issues for a repository.',
    input_schema: { type: 'object', properties: { repo: { type: 'string', description: 'Repository name (default: mcv-one-desktop)' } } },
  },
  {
    name: 'github_list_actions',
    description: 'List recent GitHub Actions workflow runs for a repository.',
    input_schema: { type: 'object', properties: { repo: { type: 'string', description: 'Repository name (default: mcv-one-desktop)' } } },
  },
);

// Phase B: Repository Browsing Tools
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
  github_create_issue: createIssue,
  github_update_issue: updateIssue,
  github_close_issue: closeIssue,
  github_add_comment: addComment,
  github_create_pr: createPr,
  github_merge_pr: mergePr,
  github_create_release: createRelease,
  github_create_branch: createBranch,
  github_list_issues: listIssues,
  github_list_actions: listActions,
};
