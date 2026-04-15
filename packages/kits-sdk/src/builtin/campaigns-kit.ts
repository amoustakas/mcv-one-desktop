import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function campApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'POST') {
  const r = await ctx.fetch('/api/campaigns', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Campaigns error'); }
  return r.json();
}

const listCampaigns: KitToolHandler = async (input, ctx) => {
  const d = await campApi('list', { venture_id: input.ventureId }, ctx);
  const camps = d.campaigns ?? d.data ?? [];
  const lines = camps.map((c: { name: string; status: string; budget: number; channel: string }) =>
    `- **${c.name}** — ${c.status} (${c.channel || 'multi'}) — $${c.budget?.toLocaleString() || '0'}`);
  return { success: true, data: camps, displayMarkdown: `## Campaigns (${camps.length})\n\n${lines.join('\n')}` };
};

const createCampaign: KitToolHandler = async (input, ctx) => {
  const d = await campApi('create', { name: input.name, channel: input.channel, budget: input.budget, venture_id: input.ventureId, status: input.status || 'draft' }, ctx);
  return { success: true, data: d, displayMarkdown: `Campaign created: **${input.name}** ($${input.budget || 0})` };
};

const campaignStats: KitToolHandler = async (_i, ctx) => {
  const d = await campApi('stats', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Campaign Stats\n\n- **Total:** ${d.total}\n- **Active:** ${d.active}\n- **Budget:** $${d.budget?.toLocaleString()}\n- **Reach:** ${d.reach?.toLocaleString()}` };
};

export const manifest: KitManifest = {
  id: 'campaigns-marketing', name: 'Marketing Campaigns', version: '1.0.0',
  description: 'Marketing campaigns — list, create, update, stats, and multi-venture campaign management.',
  author: 'MCV', capabilities: ['network'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use campaigns tools for managing marketing campaigns, budgets, and channel performance.',
  tools: [
    { name: 'campaigns_list', description: 'List all campaigns, optionally by venture.', input_schema: { type: 'object', properties: { ventureId: { type: 'string' } } } },
    { name: 'campaigns_create', description: 'Create a new campaign.', input_schema: { type: 'object', properties: { name: { type: 'string' }, channel: { type: 'string' }, budget: { type: 'number' }, ventureId: { type: 'string' } }, required: ['name'] } },
    { name: 'campaigns_stats', description: 'Get aggregate campaign stats.', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = { campaigns_list: listCampaigns, campaigns_create: createCampaign, campaigns_stats: campaignStats };
