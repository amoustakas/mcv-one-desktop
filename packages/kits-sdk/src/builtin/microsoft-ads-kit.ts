import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';
async function msAdsApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') { const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString(); const r = await ctx.fetch(`/api/microsoft-ads?${q}`); if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'MS Ads error'); } return r.json(); }
  const r = await ctx.fetch('/api/microsoft-ads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) }); if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'MS Ads error'); } return r.json();
}
const listCampaigns: KitToolHandler = async (_i, ctx) => { const d = await msAdsApi('list-campaigns', {}, ctx, 'POST'); return { success: true, data: d, displayMarkdown: `## Microsoft Ads Campaigns\n\n\`\`\`json\n${JSON.stringify(d, null, 2).slice(0, 3000)}\n\`\`\`` }; };
const listAdGroups: KitToolHandler = async (input, ctx) => { const d = await msAdsApi('list-ad-groups', { campaignId: input.campaignId }, ctx); return { success: true, data: d, displayMarkdown: `## Ad Groups\n\n\`\`\`json\n${JSON.stringify(d, null, 2).slice(0, 3000)}\n\`\`\`` }; };
const listKeywords: KitToolHandler = async (input, ctx) => { const d = await msAdsApi('list-keywords', { adGroupId: input.adGroupId }, ctx); return { success: true, data: d, displayMarkdown: `## Keywords\n\n\`\`\`json\n${JSON.stringify(d, null, 2).slice(0, 3000)}\n\`\`\`` }; };
const msAdsOverview: KitToolHandler = async (_i, ctx) => { const d = await msAdsApi('overview', {}, ctx); return { success: true, data: d, displayMarkdown: `## Microsoft Ads\n\n- **Configured:** ${d.configured}\n- **Account:** ${d.account_id}` }; };

const listAds: KitToolHandler = async (input, ctx) => {
  const d = await msAdsApi('list-ads', { adGroupId: input.adGroupId }, ctx);
  return { success: true, data: d, displayMarkdown: `Ads: ${JSON.stringify(d).slice(0, 500)}` };
};

const listBudgets: KitToolHandler = async (_i, ctx) => {
  const d = await msAdsApi('list-budgets', {}, ctx);
  return { success: true, data: d, displayMarkdown: `Budgets: ${JSON.stringify(d).slice(0, 500)}` };
};

export const manifest: KitManifest = {
  id: 'microsoft-ads', name: 'Microsoft Ads', version: '2.0.0',
  description: 'Microsoft Advertising (Bing Ads) — campaigns, ad groups, ads, keywords, budgets, and performance.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use microsoft ads tools for Bing Ads campaign management and performance reporting.',
  tools: [
    { name: 'msads_campaigns', description: 'List Microsoft Ads campaigns.', input_schema: { type: 'object', properties: {} } },
    { name: 'msads_ad_groups', description: 'List ad groups in a campaign.', input_schema: { type: 'object', properties: { campaignId: { type: 'string' } }, required: ['campaignId'] } },
    { name: 'msads_keywords', description: 'List keywords in an ad group.', input_schema: { type: 'object', properties: { adGroupId: { type: 'string' } }, required: ['adGroupId'] } },
    { name: 'msads_overview', description: 'Microsoft Ads account overview.', input_schema: { type: 'object', properties: {} } },
    { name: 'msads_list_ads', description: 'List ads in an ad group.', input_schema: { type: 'object', properties: { adGroupId: { type: 'string' } }, required: ['adGroupId'] } },
    { name: 'msads_budgets', description: 'List account budgets.', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = {
  msads_campaigns: listCampaigns, msads_ad_groups: listAdGroups, msads_keywords: listKeywords, msads_overview: msAdsOverview,
  msads_list_ads: listAds, msads_budgets: listBudgets,
};
