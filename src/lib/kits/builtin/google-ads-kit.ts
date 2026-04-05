import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';
async function gadsApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') { const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString(); const r = await ctx.fetch(`/api/google-ads?${q}`); if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Google Ads error'); } return r.json(); }
  const r = await ctx.fetch('/api/google-ads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) }); if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Google Ads error'); } return r.json();
}
const listCampaigns: KitToolHandler = async (input, ctx) => { const d = await gadsApi('list-campaigns', { customerId: input.customerId }, ctx); return { success: true, data: d, displayMarkdown: `## Google Ads Campaigns\n\n\`\`\`json\n${JSON.stringify(d?.[0]?.results?.slice(0, 10), null, 2).slice(0, 3000)}\n\`\`\`` }; };
const performance: KitToolHandler = async (input, ctx) => { const d = await gadsApi('campaign-performance', { customerId: input.customerId, dateRange: input.dateRange ?? 'LAST_30_DAYS' }, ctx); return { success: true, data: d, displayMarkdown: `## Campaign Performance\n\n\`\`\`json\n${JSON.stringify(d?.[0]?.results?.slice(0, 10), null, 2).slice(0, 3000)}\n\`\`\`` }; };
const keywords: KitToolHandler = async (input, ctx) => { const d = await gadsApi('list-keywords', { customerId: input.customerId }, ctx); return { success: true, data: d, displayMarkdown: `## Keywords\n\n\`\`\`json\n${JSON.stringify(d?.[0]?.results?.slice(0, 15), null, 2).slice(0, 3000)}\n\`\`\`` }; };
const searchTerms: KitToolHandler = async (input, ctx) => { const d = await gadsApi('search-terms', { customerId: input.customerId }, ctx); return { success: true, data: d, displayMarkdown: `## Search Terms\n\n\`\`\`json\n${JSON.stringify(d?.[0]?.results?.slice(0, 15), null, 2).slice(0, 3000)}\n\`\`\`` }; };
const customQuery: KitToolHandler = async (input, ctx) => { const d = await gadsApi('custom-query', { customerId: input.customerId, query: input.query }, ctx, 'POST'); return { success: true, data: d, displayMarkdown: `## GAQL Query Result\n\n\`\`\`json\n${JSON.stringify(d?.[0]?.results?.slice(0, 10), null, 2).slice(0, 3000)}\n\`\`\`` }; };
const gadsOverview: KitToolHandler = async (input, ctx) => { const d = await gadsApi('overview', { customerId: input.customerId }, ctx); return { success: true, data: d, displayMarkdown: `## Google Ads (7d)\n\n- **Impressions:** ${d.impressions_7d}\n- **Clicks:** ${d.clicks_7d}\n- **Cost:** $${d.cost_7d}\n- **Conversions:** ${d.conversions_7d}` }; };
export const manifest: KitManifest = {
  id: 'google-ads', name: 'Google Ads', version: '1.0.0',
  description: 'Google Ads — campaigns, ad groups, ads, keywords, search terms, budgets, performance reports, and GAQL queries.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use google ads tools for campaign management, keyword analysis, search term reports, and custom GAQL queries.',
  tools: [
    { name: 'gads_campaigns', description: 'List Google Ads campaigns with metrics.', input_schema: { type: 'object', properties: { customerId: { type: 'string' } } } },
    { name: 'gads_performance', description: 'Campaign performance report.', input_schema: { type: 'object', properties: { customerId: { type: 'string' }, dateRange: { type: 'string', description: 'LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH' } } } },
    { name: 'gads_keywords', description: 'List keywords with metrics.', input_schema: { type: 'object', properties: { customerId: { type: 'string' } } } },
    { name: 'gads_search_terms', description: 'Search term report (30d).', input_schema: { type: 'object', properties: { customerId: { type: 'string' } } } },
    { name: 'gads_query', description: 'Run a custom GAQL query.', input_schema: { type: 'object', properties: { customerId: { type: 'string' }, query: { type: 'string', description: 'Google Ads Query Language' } }, required: ['query'] } },
    { name: 'gads_overview', description: 'Google Ads account overview (7d).', input_schema: { type: 'object', properties: { customerId: { type: 'string' } } } },
  ],
};
export const handlers: Record<string, KitToolHandler> = { gads_campaigns: listCampaigns, gads_performance: performance, gads_keywords: keywords, gads_search_terms: searchTerms, gads_query: customQuery, gads_overview: gadsOverview };
