// @ts-nocheck
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

const createDeployment: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/vercel-status', { action: 'create-deployment', name: input.name, gitSource: input.gitSource }, ctx);
  return { success: true, data: d, displayMarkdown: `**Deployment created:** \`${d.id || d.uid}\` for ${input.name}` };
};

const cancelDeployment: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/vercel-status', { action: 'cancel-deployment', deploymentId: input.deploymentId }, ctx);
  return { success: true, data: d, displayMarkdown: `**Deployment canceled:** \`${input.deploymentId}\`` };
};

const listEnvVars: KitToolHandler = async (input, ctx) => {
  const data = await fetchJson(`/api/vercel-status?action=env-vars&projectId=${encodeURIComponent(input.projectId)}`, ctx);
  const envs = data.envs ?? [];
  if (envs.length === 0) return { success: true, data: [], displayMarkdown: 'No environment variables found.' };
  const lines = envs.map((e: { key: string; target: string[]; type: string }) =>
    `- \`${e.key}\` (${e.type}) — ${(e.target || []).join(', ')}`);
  return { success: true, data: envs, displayMarkdown: `## Env Vars (${envs.length})\n\n${lines.join('\n')}` };
};

const createEnvVar: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/vercel-status', { action: 'create-env-var', projectId: input.projectId, key: input.key, value: input.value, target: input.target }, ctx);
  return { success: true, data: d, displayMarkdown: `**Env var created:** \`${input.key}\`` };
};

const deleteEnvVar: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/vercel-status', { action: 'delete-env-var', projectId: input.projectId, envId: input.envId }, ctx);
  return { success: true, data: d, displayMarkdown: `**Env var deleted:** \`${input.envId}\`` };
};

const listDomains: KitToolHandler = async (input, ctx) => {
  const data = await fetchJson(`/api/vercel-status?action=domains&projectId=${encodeURIComponent(input.projectId)}`, ctx);
  const domains = data.domains ?? [];
  if (domains.length === 0) return { success: true, data: [], displayMarkdown: 'No domains found.' };
  const lines = domains.map((d: { name: string; verified: boolean }) =>
    `- **${d.name}** ${d.verified ? '(verified)' : '(unverified)'}`);
  return { success: true, data: domains, displayMarkdown: `## Domains (${domains.length})\n\n${lines.join('\n')}` };
};

const addDomain: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/vercel-status', { action: 'add-domain', projectId: input.projectId, domain: input.domain }, ctx);
  return { success: true, data: d, displayMarkdown: `**Domain added:** ${input.domain}` };
};

const removeDomain: KitToolHandler = async (input, ctx) => {
  const d = await postJson('/api/vercel-status', { action: 'remove-domain', projectId: input.projectId, domain: input.domain }, ctx);
  return { success: true, data: d, displayMarkdown: `**Domain removed:** ${input.domain}` };
};

const getProject: KitToolHandler = async (input, ctx) => {
  const data = await fetchJson(`/api/vercel-status?action=project&projectId=${encodeURIComponent(input.projectId)}`, ctx);
  return { success: true, data, displayMarkdown: `## Project: ${data.name || input.projectId}\n\n- Framework: ${data.framework || 'N/A'}\n- Node: ${data.nodeVersion || 'N/A'}\n- Updated: ${data.updatedAt || 'N/A'}` };
};

export const manifest: KitManifest = {
  id: 'vercel-ops',
  name: 'Vercel Operations',
  version: '2.0.0',
  description: 'Manage Vercel deployments, projects, environment variables, and domains.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks about deployments, hosting, Vercel projects, environment variables, or domains.',
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
    {
      name: 'vercel_create_deployment',
      description: 'Create a new Vercel deployment.',
      input_schema: { type: 'object', properties: { name: { type: 'string', description: 'Project name' }, gitSource: { type: 'object', description: 'Git source config (repo, ref, etc.)' } }, required: ['name'] },
    },
    {
      name: 'vercel_cancel_deployment',
      description: 'Cancel a running Vercel deployment.',
      input_schema: { type: 'object', properties: { deploymentId: { type: 'string', description: 'Deployment ID or URL' } }, required: ['deploymentId'] },
    },
    {
      name: 'vercel_list_env_vars',
      description: 'List environment variables for a Vercel project.',
      input_schema: { type: 'object', properties: { projectId: { type: 'string', description: 'Project ID or name' } }, required: ['projectId'] },
    },
    {
      name: 'vercel_create_env_var',
      description: 'Create an environment variable for a Vercel project.',
      input_schema: { type: 'object', properties: { projectId: { type: 'string', description: 'Project ID' }, key: { type: 'string', description: 'Variable name' }, value: { type: 'string', description: 'Variable value' }, target: { type: 'array', items: { type: 'string' }, description: 'Targets: production, preview, development' } }, required: ['projectId', 'key', 'value'] },
    },
    {
      name: 'vercel_delete_env_var',
      description: 'Delete an environment variable from a Vercel project.',
      input_schema: { type: 'object', properties: { projectId: { type: 'string', description: 'Project ID' }, envId: { type: 'string', description: 'Env variable ID' } }, required: ['projectId', 'envId'] },
    },
    {
      name: 'vercel_list_domains',
      description: 'List domains for a Vercel project.',
      input_schema: { type: 'object', properties: { projectId: { type: 'string', description: 'Project ID or name' } }, required: ['projectId'] },
    },
    {
      name: 'vercel_add_domain',
      description: 'Add a domain to a Vercel project.',
      input_schema: { type: 'object', properties: { projectId: { type: 'string', description: 'Project ID' }, domain: { type: 'string', description: 'Domain name' } }, required: ['projectId', 'domain'] },
    },
    {
      name: 'vercel_remove_domain',
      description: 'Remove a domain from a Vercel project.',
      input_schema: { type: 'object', properties: { projectId: { type: 'string', description: 'Project ID' }, domain: { type: 'string', description: 'Domain name' } }, required: ['projectId', 'domain'] },
    },
    {
      name: 'vercel_get_project',
      description: 'Get details for a Vercel project.',
      input_schema: { type: 'object', properties: { projectId: { type: 'string', description: 'Project ID or name' } }, required: ['projectId'] },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  list_deployments: listDeployments,
  list_projects: listProjects,
  vercel_create_deployment: createDeployment,
  vercel_cancel_deployment: cancelDeployment,
  vercel_list_env_vars: listEnvVars,
  vercel_create_env_var: createEnvVar,
  vercel_delete_env_var: deleteEnvVar,
  vercel_list_domains: listDomains,
  vercel_add_domain: addDomain,
  vercel_remove_domain: removeDomain,
  vercel_get_project: getProject,
};
