import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function venturesApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const r = await ctx.fetch('/api/ventures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Ventures error'); }
  return r.json();
}

const listVentures: KitToolHandler = async (_i, ctx) => {
  const d = await venturesApi('list', {}, ctx);
  const ventures = d.ventures ?? d.data ?? [];
  const lines = ventures.map((v: { name: string; slug: string; status: string; description: string }) =>
    `- **${v.name}** (\`${v.slug}\`) — ${v.status} — ${v.description?.slice(0, 60) || ''}`);
  return { success: true, data: ventures, displayMarkdown: `## Ventures (${ventures.length})\n\n${lines.join('\n')}` };
};

const getVenture: KitToolHandler = async (input, ctx) => {
  const d = await venturesApi('get', { id: input.id }, ctx);
  return { success: true, data: d, displayMarkdown: `## ${d.name}\n\n- **Slug:** ${d.slug}\n- **Status:** ${d.status}\n- **Description:** ${d.description || 'N/A'}` };
};

const createVenture: KitToolHandler = async (input, ctx) => {
  const d = await venturesApi('create', { name: input.name, description: input.description, status: input.status || 'active' }, ctx);
  return { success: true, data: d, displayMarkdown: `Venture created: **${input.name}**` };
};

const updateVenture: KitToolHandler = async (input, ctx) => {
  const d = await venturesApi('update', { id: input.id, name: input.name, description: input.description, status: input.status }, ctx);
  return { success: true, data: d, displayMarkdown: `Venture updated: ${input.id}` };
};

export const manifest: KitManifest = {
  id: 'ventures-management', name: 'Venture Management', version: '1.0.0',
  description: 'Ventures — create, update, list, and manage the MCV venture portfolio (BetEdge, Futurestate, WarForge, etc.).',
  author: 'MCV', capabilities: ['network'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use ventures tools for managing the venture portfolio — listing, creating, updating ventures across the MCV ecosystem.',
  tools: [
    { name: 'ventures_list', description: 'List all ventures in the portfolio.', input_schema: { type: 'object', properties: {} } },
    { name: 'ventures_get', description: 'Get venture details by ID.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'ventures_create', description: 'Create a new venture.', input_schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, status: { type: 'string' } }, required: ['name'] } },
    { name: 'ventures_update', description: 'Update a venture.', input_schema: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, status: { type: 'string' } }, required: ['id'] } },
  ],
};
export const handlers: Record<string, KitToolHandler> = { ventures_list: listVentures, ventures_get: getVenture, ventures_create: createVenture, ventures_update: updateVenture };
