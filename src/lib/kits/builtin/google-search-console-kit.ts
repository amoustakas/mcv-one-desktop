import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function gscApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/google-search-console?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'GSC error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/google-search-console', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'GSC error'); }
  return r.json();
}

const topQueries: KitToolHandler = async (input, ctx) => {
  const d = await gscApi('top-queries', { siteUrl: input.siteUrl }, ctx, 'POST');
  const rows = d.rows ?? [];
  const lines = rows.slice(0, 20).map((r: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }) =>
    `- **${r.keys[0]}** — ${r.clicks} clicks, ${r.impressions} impressions, CTR ${(r.ctr * 100).toFixed(1)}%, pos ${r.position.toFixed(1)}`);
  return { success: true, data: rows, displayMarkdown: `## Top Queries (30d)\n\n${lines.join('\n')}` };
};

const topPages: KitToolHandler = async (input, ctx) => {
  const d = await gscApi('top-pages', { siteUrl: input.siteUrl }, ctx, 'POST');
  const rows = d.rows ?? [];
  const lines = rows.slice(0, 20).map((r: { keys: string[]; clicks: number; impressions: number; position: number }) =>
    `- **${r.keys[0]}** — ${r.clicks} clicks, ${r.impressions} impressions, pos ${r.position.toFixed(1)}`);
  return { success: true, data: rows, displayMarkdown: `## Top Pages (30d)\n\n${lines.join('\n')}` };
};

const listSites: KitToolHandler = async (_i, ctx) => {
  const d = await gscApi('list-sites', {}, ctx);
  const sites = d.siteEntry ?? [];
  const lines = sites.map((s: { siteUrl: string; permissionLevel: string }) => `- **${s.siteUrl}** — ${s.permissionLevel}`);
  return { success: true, data: sites, displayMarkdown: `## Verified Sites (${sites.length})\n\n${lines.join('\n')}` };
};

const inspectUrl: KitToolHandler = async (input, ctx) => {
  const d = await gscApi('inspect-url', { siteUrl: input.siteUrl, inspectionUrl: input.url }, ctx, 'POST');
  const result = d.inspectionResult;
  return { success: true, data: result, displayMarkdown: `## URL Inspection: ${input.url}\n\n- **Index Status:** ${result?.indexStatusResult?.coverageState || 'unknown'}\n- **Crawled:** ${result?.indexStatusResult?.lastCrawlTime || 'never'}\n- **Mobile Usability:** ${result?.mobileUsabilityResult?.verdict || 'unknown'}` };
};

const gscOverview: KitToolHandler = async (_i, ctx) => {
  const d = await gscApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Search Console Overview\n\n- **Sites:** ${d.site_count}\n${d.sites?.map((s: { url: string; permission: string }) => `- ${s.url} (${s.permission})`).join('\n') || 'No sites'}` };
};

export const manifest: KitManifest = {
  id: 'google-search-console', name: 'Google Search Console', version: '1.0.0',
  description: 'Google Search Console — search performance, top queries, top pages, URL inspection, sitemaps.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use search console tools for SEO analysis, keyword performance, page ranking, and URL indexing status.',
  tools: [
    { name: 'gsc_top_queries', description: 'Get top search queries (30 days).', input_schema: { type: 'object', properties: { siteUrl: { type: 'string', description: 'e.g. https://mcv.one' } }, required: ['siteUrl'] } },
    { name: 'gsc_top_pages', description: 'Get top pages by search traffic (30 days).', input_schema: { type: 'object', properties: { siteUrl: { type: 'string' } }, required: ['siteUrl'] } },
    { name: 'gsc_list_sites', description: 'List verified sites.', input_schema: { type: 'object', properties: {} } },
    { name: 'gsc_inspect_url', description: 'Inspect a URL for indexing status and mobile usability.', input_schema: { type: 'object', properties: { siteUrl: { type: 'string' }, url: { type: 'string', description: 'URL to inspect' } }, required: ['siteUrl', 'url'] } },
    { name: 'gsc_overview', description: 'Search Console overview: sites, permissions.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  gsc_top_queries: topQueries, gsc_top_pages: topPages, gsc_list_sites: listSites, gsc_inspect_url: inspectUrl, gsc_overview: gscOverview,
};
