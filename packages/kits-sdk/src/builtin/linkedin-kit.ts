import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function liApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const query = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const res = await ctx.fetch(`/api/linkedin?${query}`);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `LinkedIn ${res.status}`); }
    return res.json();
  }
  const res = await ctx.fetch('/api/linkedin', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `LinkedIn ${res.status}`); }
  return res.json();
}

const myProfile: KitToolHandler = async (_input, ctx) => {
  const data = await liApi('me', {}, ctx);
  return { success: true, data, displayMarkdown: `## LinkedIn Profile\n\n- **Name:** ${data.name}\n- **Email:** ${data.email}\n- **Picture:** ${data.picture ? 'Yes' : 'No'}` };
};

const createPost: KitToolHandler = async (input, ctx) => {
  const data = await liApi('create-post', { text: input.text, visibility: input.visibility ?? 'PUBLIC' }, ctx, 'POST');
  return { success: true, data, displayMarkdown: `LinkedIn post published: "${(input.text as string).slice(0, 100)}..."` };
};

const getCompany: KitToolHandler = async (input, ctx) => {
  const data = await liApi('get-company', { companyId: input.companyId }, ctx);
  return { success: true, data, displayMarkdown: `## ${data.name || 'Company'}\n\n- **Vanity:** ${data.vanityName}\n- **Staff:** ${data.staffCountRange?.start}-${data.staffCountRange?.end}\n- **Website:** ${data.websiteUrl || 'N/A'}` };
};

const liOverview: KitToolHandler = async (_input, ctx) => {
  const data = await liApi('overview', {}, ctx);
  return { success: true, data, displayMarkdown: `## LinkedIn Overview\n\n- **Name:** ${data.name}\n- **Email:** ${data.email}` };
};

const deletePost: KitToolHandler = async (input, ctx) => {
  const d = await liApi('delete-post', { postUrn: input.postUrn }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Post deleted: ${JSON.stringify(d).slice(0, 500)}` };
};

const adAccounts: KitToolHandler = async (_input, ctx) => {
  const d = await liApi('list-ad-accounts', {}, ctx);
  return { success: true, data: d, displayMarkdown: `Ad accounts: ${JSON.stringify(d).slice(0, 500)}` };
};

const adCampaigns: KitToolHandler = async (input, ctx) => {
  const d = await liApi('list-ad-campaigns', { accountId: input.accountId }, ctx);
  return { success: true, data: d, displayMarkdown: `Ad campaigns: ${JSON.stringify(d).slice(0, 500)}` };
};

const createAdCampaign: KitToolHandler = async (input, ctx) => {
  const d = await liApi('create-ad-campaign', { accountId: input.accountId, name: input.name, objective: input.objective, dailyBudget: input.dailyBudget }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Ad campaign created: ${JSON.stringify(d).slice(0, 500)}` };
};

const adCreatives: KitToolHandler = async (input, ctx) => {
  const d = await liApi('list-ad-creatives', { campaignId: input.campaignId }, ctx);
  return { success: true, data: d, displayMarkdown: `Ad creatives: ${JSON.stringify(d).slice(0, 500)}` };
};

const adAnalytics: KitToolHandler = async (input, ctx) => {
  const d = await liApi('ad-analytics', { accountId: input.accountId, campaignId: input.campaignId }, ctx);
  return { success: true, data: d, displayMarkdown: `Ad analytics: ${JSON.stringify(d).slice(0, 500)}` };
};

const adminOrgs: KitToolHandler = async (_input, ctx) => {
  const d = await liApi('list-admin-orgs', {}, ctx);
  return { success: true, data: d, displayMarkdown: `Admin orgs: ${JSON.stringify(d).slice(0, 500)}` };
};

const orgPosts: KitToolHandler = async (input, ctx) => {
  const d = await liApi('org-posts', { orgId: input.orgId }, ctx);
  return { success: true, data: d, displayMarkdown: `Org posts: ${JSON.stringify(d).slice(0, 500)}` };
};

export const manifest: KitManifest = {
  id: 'linkedin-social',
  name: 'LinkedIn',
  version: '2.0.0',
  description: 'LinkedIn — profile, posts, company pages, connections, ads management, org admin, and professional networking.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use linkedin tools for professional networking, posting content, company research, and connection management.',
  tools: [
    { name: 'linkedin_profile', description: 'Get your LinkedIn profile.', input_schema: { type: 'object', properties: {} } },
    { name: 'linkedin_post', description: 'Publish a post to LinkedIn.', input_schema: { type: 'object', properties: { text: { type: 'string' }, visibility: { type: 'string', description: 'PUBLIC or CONNECTIONS' } }, required: ['text'] } },
    { name: 'linkedin_company', description: 'Get company page info.', input_schema: { type: 'object', properties: { companyId: { type: 'string' } }, required: ['companyId'] } },
    { name: 'linkedin_overview', description: 'LinkedIn profile summary.', input_schema: { type: 'object', properties: {} } },
    { name: 'linkedin_delete_post', description: 'Delete a LinkedIn post.', input_schema: { type: 'object', properties: { postUrn: { type: 'string', description: 'Post URN to delete' } }, required: ['postUrn'] } },
    { name: 'linkedin_ad_accounts', description: 'List LinkedIn ad accounts.', input_schema: { type: 'object', properties: {} } },
    { name: 'linkedin_ad_campaigns', description: 'List ad campaigns for an account.', input_schema: { type: 'object', properties: { accountId: { type: 'string' } }, required: ['accountId'] } },
    { name: 'linkedin_create_ad_campaign', description: 'Create a new ad campaign.', input_schema: { type: 'object', properties: { accountId: { type: 'string' }, name: { type: 'string' }, objective: { type: 'string' }, dailyBudget: { type: 'number' } }, required: ['accountId', 'name', 'objective', 'dailyBudget'] } },
    { name: 'linkedin_ad_creatives', description: 'List ad creatives for a campaign.', input_schema: { type: 'object', properties: { campaignId: { type: 'string' } }, required: ['campaignId'] } },
    { name: 'linkedin_ad_analytics', description: 'Get ad analytics for an account/campaign.', input_schema: { type: 'object', properties: { accountId: { type: 'string' }, campaignId: { type: 'string' } }, required: ['accountId'] } },
    { name: 'linkedin_admin_orgs', description: 'List organizations you administer.', input_schema: { type: 'object', properties: {} } },
    { name: 'linkedin_org_posts', description: 'List posts for an organization.', input_schema: { type: 'object', properties: { orgId: { type: 'string' } }, required: ['orgId'] } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  linkedin_profile: myProfile,
  linkedin_post: createPost,
  linkedin_company: getCompany,
  linkedin_overview: liOverview,
  linkedin_delete_post: deletePost,
  linkedin_ad_accounts: adAccounts,
  linkedin_ad_campaigns: adCampaigns,
  linkedin_create_ad_campaign: createAdCampaign,
  linkedin_ad_creatives: adCreatives,
  linkedin_ad_analytics: adAnalytics,
  linkedin_admin_orgs: adminOrgs,
  linkedin_org_posts: orgPosts,
};
