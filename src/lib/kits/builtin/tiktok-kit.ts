import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';
async function ttApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') { const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString(); const r = await ctx.fetch(`/api/tiktok?${q}`); if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'TikTok error'); } return r.json(); }
  const r = await ctx.fetch('/api/tiktok', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) }); if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'TikTok error'); } return r.json();
}
const userInfo: KitToolHandler = async (_i, ctx) => { const d = await ttApi('user-info', {}, ctx); const u = d.data?.user; return { success: true, data: u, displayMarkdown: u ? `## @${u.display_name}\n\n- **Followers:** ${u.follower_count?.toLocaleString()}\n- **Following:** ${u.following_count?.toLocaleString()}\n- **Likes:** ${u.likes_count?.toLocaleString()}\n- **Videos:** ${u.video_count}\n- **Verified:** ${u.is_verified ? 'Yes' : 'No'}` : 'No user data.' }; };
const listCampaigns: KitToolHandler = async (input, ctx) => { const d = await ttApi('list-campaigns', { advertiserId: input.advertiserId }, ctx); const camps = d.data?.list ?? []; const lines = camps.map((c: { campaign_name: string; campaign_id: string; status: string; budget: number }) => `- **${c.campaign_name}** — ${c.status} — $${(c.budget / 100).toFixed(0)} budget`); return { success: true, data: camps, displayMarkdown: `## TikTok Campaigns (${camps.length})\n\n${lines.join('\n')}` }; };
const campaignMetrics: KitToolHandler = async (input, ctx) => { const d = await ttApi('campaign-metrics', { advertiserId: input.advertiserId, campaignIds: input.campaignIds, startDate: input.startDate, endDate: input.endDate }, ctx, 'POST'); return { success: true, data: d, displayMarkdown: `## Campaign Metrics\n\n\`\`\`json\n${JSON.stringify(d.data?.list?.slice(0, 10), null, 2).slice(0, 3000)}\n\`\`\`` }; };
const accountReport: KitToolHandler = async (input, ctx) => { const d = await ttApi('account-report', { advertiserId: input.advertiserId }, ctx, 'POST'); return { success: true, data: d, displayMarkdown: `## TikTok Account Report (30d)\n\n\`\`\`json\n${JSON.stringify(d.data?.list?.slice(0, 10), null, 2).slice(0, 3000)}\n\`\`\`` }; };
const listAudiences: KitToolHandler = async (input, ctx) => { const d = await ttApi('list-audiences', { advertiserId: input.advertiserId }, ctx); const auds = d.data?.list ?? []; const lines = auds.map((a: { custom_audience_name: string; audience_type: string }) => `- **${a.custom_audience_name}** (${a.audience_type})`); return { success: true, data: auds, displayMarkdown: `## TikTok Audiences (${auds.length})\n\n${lines.join('\n')}` }; };
const ttOverview: KitToolHandler = async (_i, ctx) => { const d = await ttApi('overview', {}, ctx); return { success: true, data: d, displayMarkdown: `## TikTok\n\n- **Configured:** ${d.configured}\n- **Advertiser:** ${d.advertiser_id}` }; };
export const manifest: KitManifest = {
  id: 'tiktok-social', name: 'TikTok', version: '1.0.0',
  description: 'TikTok — user profile, videos, ads campaigns, ad groups, creatives, audiences, account reports, and pixels.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use tiktok tools for TikTok user analytics, ad campaign management, audience targeting, and performance reporting.',
  tools: [
    { name: 'tiktok_user', description: 'Get TikTok user profile info.', input_schema: { type: 'object', properties: {} } },
    { name: 'tiktok_campaigns', description: 'List TikTok ad campaigns.', input_schema: { type: 'object', properties: { advertiserId: { type: 'string' } } } },
    { name: 'tiktok_campaign_metrics', description: 'Get campaign performance metrics.', input_schema: { type: 'object', properties: { advertiserId: { type: 'string' }, campaignIds: { type: 'array' }, startDate: { type: 'string' }, endDate: { type: 'string' } } } },
    { name: 'tiktok_account_report', description: 'Get account-level report (30d).', input_schema: { type: 'object', properties: { advertiserId: { type: 'string' } } } },
    { name: 'tiktok_audiences', description: 'List custom audiences.', input_schema: { type: 'object', properties: { advertiserId: { type: 'string' } } } },
    { name: 'tiktok_overview', description: 'TikTok overview.', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = { tiktok_user: userInfo, tiktok_campaigns: listCampaigns, tiktok_campaign_metrics: campaignMetrics, tiktok_account_report: accountReport, tiktok_audiences: listAudiences, tiktok_overview: ttOverview };
