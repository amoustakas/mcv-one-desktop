import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function sentryApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/sentry?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Sentry error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/sentry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Sentry error'); }
  return r.json();
}

const listIssues: KitToolHandler = async (input, ctx) => {
  const d = await sentryApi('list-issues', { project: input.project, query: input.query, limit: input.limit ?? 15 }, ctx);
  const issues = Array.isArray(d) ? d : [];
  const lines = issues.map((i: { title: string; shortId: string; count: string; lastSeen: string; level: string }) =>
    `- **${i.shortId}** ${i.title} — ${i.count}x, last ${new Date(i.lastSeen).toLocaleDateString()} (${i.level})`);
  return { success: true, data: issues, displayMarkdown: `## Issues (${issues.length})\n\n${lines.join('\n')}` };
};

const resolveIssue: KitToolHandler = async (input, ctx) => {
  const d = await sentryApi('resolve-issue', { issueId: input.issueId }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Issue ${input.issueId} resolved.` };
};

const listProjects: KitToolHandler = async (_i, ctx) => {
  const d = await sentryApi('list-projects', {}, ctx);
  const projects = Array.isArray(d) ? d : [];
  const lines = projects.map((p: { name: string; slug: string; platform: string }) => `- **${p.name}** (\`${p.slug}\`) — ${p.platform || 'unknown'}`);
  return { success: true, data: projects, displayMarkdown: `## Projects (${projects.length})\n\n${lines.join('\n')}` };
};

const listReleases: KitToolHandler = async (input, ctx) => {
  const d = await sentryApi('list-releases', { project: input.project }, ctx);
  const releases = Array.isArray(d) ? d : [];
  const lines = releases.slice(0, 10).map((r: { version: string; dateCreated: string; newGroups: number }) =>
    `- **${r.version}** — ${new Date(r.dateCreated).toLocaleDateString()} (${r.newGroups} new issues)`);
  return { success: true, data: releases, displayMarkdown: `## Releases (${releases.length})\n\n${lines.join('\n')}` };
};

const sentryOverview: KitToolHandler = async (_i, ctx) => {
  const d = await sentryApi('overview', {}, ctx);
  let md = `## Sentry Overview\n\n- **Projects:** ${d.project_count}\n- **Unresolved Issues:** ${d.unresolved_issues}`;
  if (d.top_issues?.length) {
    md += '\n\n### Top Issues\n' + d.top_issues.map((i: { title: string; count: string }) => `- ${i.title} (${i.count}x)`).join('\n');
  }
  return { success: true, data: d, displayMarkdown: md };
};

export const manifest: KitManifest = {
  id: 'sentry-monitoring', name: 'Sentry', version: '1.0.0',
  description: 'Sentry — error monitoring, issue tracking, releases, performance, and project health.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use sentry tools for error monitoring, issue resolution, release tracking, and project health checks.',
  tools: [
    { name: 'sentry_issues', description: 'List unresolved issues (optionally by project).', input_schema: { type: 'object', properties: { project: { type: 'string', description: 'Project slug' }, query: { type: 'string', description: 'Search query' }, limit: { type: 'number' } } } },
    { name: 'sentry_resolve', description: 'Resolve an issue.', input_schema: { type: 'object', properties: { issueId: { type: 'string' } }, required: ['issueId'] } },
    { name: 'sentry_projects', description: 'List all projects.', input_schema: { type: 'object', properties: {} } },
    { name: 'sentry_releases', description: 'List releases for a project.', input_schema: { type: 'object', properties: { project: { type: 'string' } } } },
    { name: 'sentry_overview', description: 'Sentry overview: projects, unresolved, top issues.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  sentry_issues: listIssues, sentry_resolve: resolveIssue, sentry_projects: listProjects,
  sentry_releases: listReleases, sentry_overview: sentryOverview,
};
