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

const createCampaign: KitToolHandler = async (input, ctx) => {
  const d = await ttApi('create-campaign', { campaignName: input.campaignName, objectiveType: input.objectiveType, budget: input.budget }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Campaign created: ${JSON.stringify(d).slice(0, 500)}` };
};

const updateCampaign: KitToolHandler = async (input, ctx) => {
  const d = await ttApi('update-campaign', { campaignId: input.campaignId, campaignName: input.campaignName, budget: input.budget, status: input.status }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Campaign updated: ${JSON.stringify(d).slice(0, 500)}` };
};

const createAdGroup: KitToolHandler = async (input, ctx) => {
  const d = await ttApi('create-ad-group', { campaignId: input.campaignId, adgroupName: input.adgroupName, budget: input.budget }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Ad group created: ${JSON.stringify(d).slice(0, 500)}` };
};

const updateAdGroup: KitToolHandler = async (input, ctx) => {
  const d = await ttApi('update-ad-group', { adgroupId: input.adgroupId, adgroupName: input.adgroupName, budget: input.budget, status: input.status }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Ad group updated: ${JSON.stringify(d).slice(0, 500)}` };
};

const createAd: KitToolHandler = async (input, ctx) => {
  const d = await ttApi('create-ad', { adgroupId: input.adgroupId, adName: input.adName, creatives: input.creatives }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Ad created: ${JSON.stringify(d).slice(0, 500)}` };
};

const updateAdStatus: KitToolHandler = async (input, ctx) => {
  const d = await ttApi('update-ad-status', { adIds: input.adIds, status: input.status }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Ad status updated: ${JSON.stringify(d).slice(0, 500)}` };
};

const interestCategories: KitToolHandler = async (_i, ctx) => {
  const d = await ttApi('list-interest-categories', {}, ctx);
  return { success: true, data: d, displayMarkdown: `Interest categories: ${JSON.stringify(d).slice(0, 500)}` };
};

const createPixel: KitToolHandler = async (input, ctx) => {
  const d = await ttApi('create-pixel', { pixelName: input.pixelName }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Pixel created: ${JSON.stringify(d).slice(0, 500)}` };
};

const adReport: KitToolHandler = async (input, ctx) => {
  const d = await ttApi('ad-report', { advertiserId: input.advertiserId, startDate: input.startDate, endDate: input.endDate }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Ad report: ${JSON.stringify(d).slice(0, 500)}` };
};

export const manifest: KitManifest = {
  id: 'tiktok-social', name: 'TikTok', version: '2.0.0',
  description: 'TikTok — user profile, videos, full ads CRUD (campaigns, ad groups, ads), audiences, pixels, interest targeting, and performance reports.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use tiktok tools for TikTok user analytics, ad campaign management, audience targeting, and performance reporting.',
  tools: [
    { name: 'tiktok_user', description: 'Get TikTok user profile info.', input_schema: { type: 'object', properties: {} } },
    { name: 'tiktok_campaigns', description: 'List TikTok ad campaigns.', input_schema: { type: 'object', properties: { advertiserId: { type: 'string' } } } },
    { name: 'tiktok_campaign_metrics', description: 'Get campaign performance metrics.', input_schema: { type: 'object', properties: { advertiserId: { type: 'string' }, campaignIds: { type: 'array' }, startDate: { type: 'string' }, endDate: { type: 'string' } } } },
    { name: 'tiktok_account_report', description: 'Get account-level report (30d).', input_schema: { type: 'object', properties: { advertiserId: { type: 'string' } } } },
    { name: 'tiktok_audiences', description: 'List custom audiences.', input_schema: { type: 'object', properties: { advertiserId: { type: 'string' } } } },
    { name: 'tiktok_overview', description: 'TikTok overview.', input_schema: { type: 'object', properties: {} } },
    { name: 'tiktok_create_campaign', description: 'Create a TikTok ad campaign.', input_schema: { type: 'object', properties: { campaignName: { type: 'string' }, objectiveType: { type: 'string' }, budget: { type: 'number' } }, required: ['campaignName', 'objectiveType', 'budget'] } },
    { name: 'tiktok_update_campaign', description: 'Update a TikTok ad campaign.', input_schema: { type: 'object', properties: { campaignId: { type: 'string' }, campaignName: { type: 'string' }, budget: { type: 'number' }, status: { type: 'string' } }, required: ['campaignId'] } },
    { name: 'tiktok_create_ad_group', description: 'Create an ad group in a campaign.', input_schema: { type: 'object', properties: { campaignId: { type: 'string' }, adgroupName: { type: 'string' }, budget: { type: 'number' } }, required: ['campaignId', 'adgroupName', 'budget'] } },
    { name: 'tiktok_update_ad_group', description: 'Update an ad group.', input_schema: { type: 'object', properties: { adgroupId: { type: 'string' }, adgroupName: { type: 'string' }, budget: { type: 'number' }, status: { type: 'string' } }, required: ['adgroupId'] } },
    { name: 'tiktok_create_ad', description: 'Create an ad in an ad group.', input_schema: { type: 'object', properties: { adgroupId: { type: 'string' }, adName: { type: 'string' }, creatives: { type: 'object' } }, required: ['adgroupId', 'adName'] } },
    { name: 'tiktok_update_ad_status', description: 'Update ad status (enable/disable).', input_schema: { type: 'object', properties: { adIds: { type: 'array', items: { type: 'string' } }, status: { type: 'string' } }, required: ['adIds', 'status'] } },
    { name: 'tiktok_interest_categories', description: 'List interest targeting categories.', input_schema: { type: 'object', properties: {} } },
    { name: 'tiktok_create_pixel', description: 'Create a TikTok tracking pixel.', input_schema: { type: 'object', properties: { pixelName: { type: 'string' } }, required: ['pixelName'] } },
    { name: 'tiktok_ad_report', description: 'Get ad-level performance report.', input_schema: { type: 'object', properties: { advertiserId: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' } } } },
  ],
};
export const handlers: Record<string, KitToolHandler> = {
  tiktok_user: userInfo, tiktok_campaigns: listCampaigns, tiktok_campaign_metrics: campaignMetrics,
  tiktok_account_report: accountReport, tiktok_audiences: listAudiences, tiktok_overview: ttOverview,
  tiktok_create_campaign: createCampaign, tiktok_update_campaign: updateCampaign,
  tiktok_create_ad_group: createAdGroup, tiktok_update_ad_group: updateAdGroup,
  tiktok_create_ad: createAd, tiktok_update_ad_status: updateAdStatus,
  tiktok_interest_categories: interestCategories, tiktok_create_pixel: createPixel, tiktok_ad_report: adReport,
};
