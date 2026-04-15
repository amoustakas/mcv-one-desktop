import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function treasuryApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const r = await ctx.fetch('/api/treasury', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Treasury error'); }
  return r.json();
}

const listFinancials: KitToolHandler = async (input, ctx) => {
  const d = await treasuryApi('list', { month: input.month }, ctx);
  const records = d.records ?? d.data ?? [];
  const lines = records.map((r: { venture_id: string; month: string; revenue: number; expenses: number }) =>
    `- **${r.venture_id}** (${r.month}) — Revenue: $${r.revenue?.toLocaleString()} | Expenses: $${r.expenses?.toLocaleString()} | Net: $${((r.revenue || 0) - (r.expenses || 0)).toLocaleString()}`);
  return { success: true, data: records, displayMarkdown: `## Treasury (${records.length} records)\n\n${lines.join('\n')}` };
};

const upsertRecord: KitToolHandler = async (input, ctx) => {
  const d = await treasuryApi('upsert', { venture_id: input.ventureId, month: input.month, revenue: input.revenue, expenses: input.expenses }, ctx);
  return { success: true, data: d, displayMarkdown: `Financial record saved: **${input.ventureId}** (${input.month}) — Rev: $${input.revenue}, Exp: $${input.expenses}` };
};

const getSummary: KitToolHandler = async (_i, ctx) => {
  const d = await treasuryApi('summary', {}, ctx);
  const records = d.records ?? d.data ?? [];
  const totalRev = records.reduce((s: number, r: { revenue: number }) => s + (r.revenue || 0), 0);
  const totalExp = records.reduce((s: number, r: { expenses: number }) => s + (r.expenses || 0), 0);
  return { success: true, data: d, displayMarkdown: `## Treasury Summary\n\n- **Total Revenue:** $${totalRev.toLocaleString()}\n- **Total Expenses:** $${totalExp.toLocaleString()}\n- **Net:** $${(totalRev - totalExp).toLocaleString()}\n- **Records:** ${records.length}` };
};

export const manifest: KitManifest = {
  id: 'treasury-finance', name: 'Treasury', version: '1.0.0',
  description: 'Treasury — venture financial records, revenue/expenses tracking, monthly reporting, and P&L summaries.',
  author: 'MCV', capabilities: ['network'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use treasury tools for financial data across ventures: revenue, expenses, net income, and monthly reporting.',
  tools: [
    { name: 'treasury_list', description: 'List financial records, optionally by month.', input_schema: { type: 'object', properties: { month: { type: 'string', description: 'YYYY-MM' } } } },
    { name: 'treasury_upsert', description: 'Create or update a financial record for a venture/month.', input_schema: { type: 'object', properties: { ventureId: { type: 'string' }, month: { type: 'string' }, revenue: { type: 'number' }, expenses: { type: 'number' } }, required: ['ventureId', 'month'] } },
    { name: 'treasury_summary', description: 'Get aggregate financial summary across all ventures.', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = { treasury_list: listFinancials, treasury_upsert: upsertRecord, treasury_summary: getSummary };
