import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function fsApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const r = await ctx.fetch('/api/futurestate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'FutureState error'); }
  return r.json();
}

const listProperties: KitToolHandler = async (_i, ctx) => {
  const d = await fsApi('properties', {}, ctx);
  const props = d.properties ?? d.data ?? [];
  const lines = props.map((p: { name: string; location: string; value: number; status: string; tokenized: boolean }) =>
    `- **${p.name}** — ${p.location} — $${p.value?.toLocaleString()} — ${p.status}${p.tokenized ? ' 🪙' : ''}`);
  return { success: true, data: props, displayMarkdown: `## Properties (${props.length})\n\n${lines.join('\n')}` };
};

const getPortfolio: KitToolHandler = async (_i, ctx) => {
  const d = await fsApi('portfolio', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Portfolio\n\n\`\`\`json\n${JSON.stringify(d, null, 2).slice(0, 3000)}\n\`\`\`` };
};

const getStats: KitToolHandler = async (_i, ctx) => {
  const d = await fsApi('stats', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## FutureState Dashboard\n\n\`\`\`json\n${JSON.stringify(d, null, 2).slice(0, 2000)}\n\`\`\`` };
};

export const manifest: KitManifest = {
  id: 'futurestate-rwa', name: 'FutureState RWA', version: '1.0.0',
  description: 'FutureState — real-world asset properties, portfolio management, tokenization status, and investment analytics.',
  author: 'MCV', capabilities: ['network'], runtime: 'inline', ventureScope: ['futurestate', 'mcv'],
  instructions: 'Use futurestate tools for RWA property data, portfolio analysis, and tokenization status.',
  tools: [
    { name: 'futurestate_properties', description: 'List RWA properties with values and tokenization status.', input_schema: { type: 'object', properties: {} } },
    { name: 'futurestate_portfolio', description: 'Get user investment portfolio.', input_schema: { type: 'object', properties: {} } },
    { name: 'futurestate_stats', description: 'Get FutureState dashboard stats.', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = { futurestate_properties: listProperties, futurestate_portfolio: getPortfolio, futurestate_stats: getStats };
