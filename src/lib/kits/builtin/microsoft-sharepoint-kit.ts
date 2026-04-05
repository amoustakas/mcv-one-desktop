import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function msApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
  const r = await ctx.fetch(`/api/microsoft-graph?${q}`);
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'SharePoint error'); }
  return r.json();
}

const listSites: KitToolHandler = async (input, ctx) => {
  const d = await msApi('list-sites', { search: input.search }, ctx);
  const sites = d.value ?? [];
  const lines = sites.map((s: { displayName: string; webUrl: string; description: string }) =>
    `- **${s.displayName}** — [${s.webUrl}](${s.webUrl})\n  ${s.description?.slice(0, 80) || ''}`);
  return { success: true, data: sites, displayMarkdown: `## SharePoint Sites (${sites.length})\n\n${lines.join('\n')}` };
};

const getSite: KitToolHandler = async (input, ctx) => {
  const d = await msApi('get-site', { siteId: input.siteId }, ctx);
  return { success: true, data: d, displayMarkdown: `## ${d.displayName}\n\n- **URL:** ${d.webUrl}\n- **Description:** ${d.description || 'N/A'}` };
};

const siteLists: KitToolHandler = async (input, ctx) => {
  const d = await msApi('site-lists', { siteId: input.siteId }, ctx);
  const lists = d.value ?? [];
  const lines = lists.map((l: { displayName: string; description: string; list: { template: string } }) =>
    `- **${l.displayName}** (${l.list?.template || 'custom'}) — ${l.description?.slice(0, 60) || ''}`);
  return { success: true, data: lists, displayMarkdown: `## Lists (${lists.length})\n\n${lines.join('\n')}` };
};

const listItems: KitToolHandler = async (input, ctx) => {
  const d = await msApi('list-items', { siteId: input.siteId, listId: input.listId, top: input.limit }, ctx);
  const items = d.value ?? [];
  return { success: true, data: items, displayMarkdown: `## List Items (${items.length})\n\n\`\`\`json\n${JSON.stringify(items.slice(0, 10).map((i: { fields: unknown }) => i.fields), null, 2).slice(0, 3000)}\n\`\`\`` };
};

export const manifest: KitManifest = {
  id: 'microsoft-sharepoint', name: 'Microsoft SharePoint', version: '1.0.0',
  description: 'SharePoint — sites, lists, documents, and content management across the organization.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use sharepoint tools for organizational document management, site browsing, and list data access.',
  tools: [
    { name: 'sharepoint_sites', description: 'List or search SharePoint sites.', input_schema: { type: 'object', properties: { search: { type: 'string' } } } },
    { name: 'sharepoint_site', description: 'Get site details by ID.', input_schema: { type: 'object', properties: { siteId: { type: 'string' } }, required: ['siteId'] } },
    { name: 'sharepoint_lists', description: 'List all lists in a site.', input_schema: { type: 'object', properties: { siteId: { type: 'string' } }, required: ['siteId'] } },
    { name: 'sharepoint_items', description: 'Get items from a list.', input_schema: { type: 'object', properties: { siteId: { type: 'string' }, listId: { type: 'string' }, limit: { type: 'number' } }, required: ['siteId', 'listId'] } },
  ],
};
export const handlers: Record<string, KitToolHandler> = { sharepoint_sites: listSites, sharepoint_site: getSite, sharepoint_lists: siteLists, sharepoint_items: listItems };
