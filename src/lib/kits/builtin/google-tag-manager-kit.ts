import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function gtmApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/google-tag-manager?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'GTM error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/google-tag-manager', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'GTM error'); }
  return r.json();
}

const listAccounts: KitToolHandler = async (_i, ctx) => {
  const d = await gtmApi('list-accounts', {}, ctx);
  const accts = d.account ?? [];
  const lines = accts.map((a: { name: string; accountId: string }) => `- **${a.name}** (\`${a.accountId}\`)`);
  return { success: true, data: accts, displayMarkdown: `## GTM Accounts (${accts.length})\n\n${lines.join('\n')}` };
};

const listContainers: KitToolHandler = async (input, ctx) => {
  const d = await gtmApi('list-containers', { accountId: input.accountId }, ctx);
  const containers = d.container ?? [];
  const lines = containers.map((c: { name: string; containerId: string; publicId: string; usageContext: string[] }) =>
    `- **${c.name}** (\`${c.publicId}\`) — ${c.usageContext?.join(', ')}`);
  return { success: true, data: containers, displayMarkdown: `## Containers (${containers.length})\n\n${lines.join('\n')}` };
};

const listTags: KitToolHandler = async (input, ctx) => {
  const d = await gtmApi('list-tags', { workspacePath: input.workspacePath }, ctx);
  const tags = d.tag ?? [];
  const lines = tags.map((t: { name: string; type: string; paused: boolean; tagId: string }) =>
    `- **${t.name}** (${t.type}) ${t.paused ? '⏸ paused' : '▶ active'}`);
  return { success: true, data: tags, displayMarkdown: `## Tags (${tags.length})\n\n${lines.join('\n')}` };
};

const listTriggers: KitToolHandler = async (input, ctx) => {
  const d = await gtmApi('list-triggers', { workspacePath: input.workspacePath }, ctx);
  const triggers = d.trigger ?? [];
  const lines = triggers.map((t: { name: string; type: string; triggerId: string }) => `- **${t.name}** (${t.type})`);
  return { success: true, data: triggers, displayMarkdown: `## Triggers (${triggers.length})\n\n${lines.join('\n')}` };
};

const listVariables: KitToolHandler = async (input, ctx) => {
  const d = await gtmApi('list-variables', { workspacePath: input.workspacePath }, ctx);
  const vars = d.variable ?? [];
  const lines = vars.map((v: { name: string; type: string }) => `- **${v.name}** (${v.type})`);
  return { success: true, data: vars, displayMarkdown: `## Variables (${vars.length})\n\n${lines.join('\n')}` };
};

const createTag: KitToolHandler = async (input, ctx) => {
  const d = await gtmApi('create-tag', { workspacePath: input.workspacePath, name: input.name, type: input.type, parameter: input.parameter, firingTriggerId: input.triggerId }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Tag created: **${d.name}** (${d.type})` };
};

const publishVersion: KitToolHandler = async (input, ctx) => {
  const d = await gtmApi('create-version', { workspacePath: input.workspacePath, name: input.name, notes: input.notes }, ctx, 'POST');
  if (input.publish && d.containerVersion?.path) {
    await gtmApi('publish-version', { versionPath: d.containerVersion.path }, ctx, 'POST');
    return { success: true, data: d, displayMarkdown: `Version **${d.containerVersion.name}** created AND published.` };
  }
  return { success: true, data: d, displayMarkdown: `Version created: **${d.containerVersion?.name || 'unnamed'}** (not yet published)` };
};

const listVersions: KitToolHandler = async (input, ctx) => {
  const d = await gtmApi('list-versions', { containerPath: input.containerPath }, ctx);
  const versions = d.containerVersionHeader ?? [];
  const lines = versions.map((v: { name: string; containerVersionId: string; numTags: string }) =>
    `- **${v.name || `v${v.containerVersionId}`}** — ${v.numTags || '?'} tags`);
  return { success: true, data: versions, displayMarkdown: `## Versions (${versions.length})\n\n${lines.join('\n')}` };
};

const gtmOverview: KitToolHandler = async (_i, ctx) => {
  const d = await gtmApi('overview', {}, ctx);
  const lines = d.account_names?.map((a: { name: string; id: string }) => `- **${a.name}** (\`${a.id}\`)`) || [];
  return { success: true, data: d, displayMarkdown: `## Google Tag Manager\n\n- **Accounts:** ${d.accounts}\n\n${lines.join('\n')}` };
};

export const manifest: KitManifest = {
  id: 'google-tag-manager', name: 'Google Tag Manager', version: '1.0.0',
  description: 'GTM — accounts, containers, workspaces, tags CRUD, triggers CRUD, variables, versions, publishing, and environments.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use GTM tools for managing tracking tags, triggers, variables, and publishing container versions. Requires Google OAuth.',
  tools: [
    { name: 'gtm_accounts', description: 'List GTM accounts.', input_schema: { type: 'object', properties: {} } },
    { name: 'gtm_containers', description: 'List containers in an account.', input_schema: { type: 'object', properties: { accountId: { type: 'string' } }, required: ['accountId'] } },
    { name: 'gtm_tags', description: 'List tags in a workspace.', input_schema: { type: 'object', properties: { workspacePath: { type: 'string', description: 'accounts/X/containers/Y/workspaces/Z' } }, required: ['workspacePath'] } },
    { name: 'gtm_triggers', description: 'List triggers in a workspace.', input_schema: { type: 'object', properties: { workspacePath: { type: 'string' } }, required: ['workspacePath'] } },
    { name: 'gtm_variables', description: 'List variables in a workspace.', input_schema: { type: 'object', properties: { workspacePath: { type: 'string' } }, required: ['workspacePath'] } },
    { name: 'gtm_create_tag', description: 'Create a new tag.', input_schema: { type: 'object', properties: { workspacePath: { type: 'string' }, name: { type: 'string' }, type: { type: 'string', description: 'e.g. gaawe (GA4), html (custom HTML)' }, triggerId: { type: 'string' } }, required: ['workspacePath', 'name', 'type'] } },
    { name: 'gtm_publish', description: 'Create and optionally publish a container version.', input_schema: { type: 'object', properties: { workspacePath: { type: 'string' }, name: { type: 'string' }, notes: { type: 'string' }, publish: { type: 'boolean' } }, required: ['workspacePath'] } },
    { name: 'gtm_versions', description: 'List container versions.', input_schema: { type: 'object', properties: { containerPath: { type: 'string' } }, required: ['containerPath'] } },
    { name: 'gtm_overview', description: 'GTM overview: accounts.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  gtm_accounts: listAccounts, gtm_containers: listContainers, gtm_tags: listTags,
  gtm_triggers: listTriggers, gtm_variables: listVariables, gtm_create_tag: createTag,
  gtm_publish: publishVersion, gtm_versions: listVersions, gtm_overview: gtmOverview,
};
