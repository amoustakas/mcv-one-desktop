import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

function timeAgo(dateStr: string | number): string {
  const ts = typeof dateStr === 'number' ? dateStr : new Date(dateStr).getTime();
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

async function fetchJson(url: string, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

const listDeployments: KitToolHandler = async (_input, ctx) => {
  const data = await fetchJson('/api/vercel-status?action=deployments', ctx);
  const deployments = data.deployments ?? [];
  if (deployments.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No deployments found. Is VERCEL_TOKEN configured?' };
  }
  const lines = deployments.map(
    (d: { name: string; state: string; url: string; target: string; created: number }) => {
      const state = d.state === 'READY' ? '`live`' : d.state === 'ERROR' ? '`error`' : `\`${d.state}\``;
      return `- ${state} **${d.name}** → ${d.target || 'preview'} · ${timeAgo(d.created)}`;
    },
  );
  return { success: true, data: deployments, displayMarkdown: `## Vercel Deployments\n\n${lines.join('\n')}` };
};

const listProjects: KitToolHandler = async (_input, ctx) => {
  const data = await fetchJson('/api/vercel-status?action=projects', ctx);
  const projects = data.projects ?? [];
  if (projects.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No Vercel projects found.' };
  }
  const lines = projects.map(
    (p: { name: string; framework: string; url: string }) =>
      `- **${p.name}** (${p.framework || 'unknown'}) → [${p.url}](${p.url})`,
  );
  return { success: true, data: projects, displayMarkdown: `## Vercel Projects\n\n${lines.join('\n')}` };
};

export const manifest: KitManifest = {
  id: 'vercel-ops',
  name: 'Vercel Operations',
  version: '1.0.0',
  description: 'List Vercel deployments and projects.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks about deployments, hosting, or Vercel projects.',
  tools: [
    {
      name: 'list_deployments',
      description: 'List recent Vercel deployments with their status, target, and URL.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'list_projects',
      description: 'List all Vercel projects with their framework and URL.',
      input_schema: { type: 'object', properties: {} },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  list_deployments: listDeployments,
  list_projects: listProjects,
};
