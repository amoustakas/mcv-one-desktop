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

export const manifest: KitManifest = {
  id: 'linkedin-social',
  name: 'LinkedIn',
  version: '1.0.0',
  description: 'LinkedIn — profile, posts, company pages, connections, and professional networking.',
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
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  linkedin_profile: myProfile,
  linkedin_post: createPost,
  linkedin_company: getCompany,
  linkedin_overview: liOverview,
};
