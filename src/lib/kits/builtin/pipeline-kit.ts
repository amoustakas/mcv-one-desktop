import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function pipeApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, endpoint = '/api/pipeline') {
  const r = await ctx.fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Pipeline error'); }
  return r.json();
}

const getPipeline: KitToolHandler = async (_i, ctx) => {
  const r = await ctx.fetch('/api/pipeline');
  if (!r.ok) throw new Error('Pipeline fetch failed');
  const d = await r.json();
  const entries = d.entries ?? [];
  const summary = d.summary;
  let md = `## Pipeline (${entries.length} entries)\n\n`;
  if (summary) md += `**Active:** ${summary.active} | **Error:** ${summary.error} | **Pending:** ${summary.pending}\n\n`;
  entries.slice(0, 15).forEach((e: { source: string; title: string; status: string; venture_id: string }) => {
    md += `- [${e.source}] **${e.title}** — ${e.status}${e.venture_id ? ` (${e.venture_id})` : ''}\n`;
  });
  return { success: true, data: d, displayMarkdown: md };
};

const fullSync: KitToolHandler = async (_i, ctx) => {
  const d = await pipeApi('full-sync', {}, ctx, '/api/pipeline-sync');
  return { success: true, data: d, displayMarkdown: `## Pipeline Sync Complete\n\n\`\`\`json\n${JSON.stringify(d, null, 2).slice(0, 2000)}\n\`\`\`` };
};

const syncCommits: KitToolHandler = async (input, ctx) => {
  const d = await pipeApi('sync-commits', { commits: input.commits }, ctx, '/api/pipeline-sync');
  return { success: true, data: d, displayMarkdown: `Synced ${d.synced ?? '?'} commits to pipeline.` };
};

const syncMemories: KitToolHandler = async (input, ctx) => {
  const d = await pipeApi('sync-memories', { memories: input.memories }, ctx, '/api/pipeline-sync');
  return { success: true, data: d, displayMarkdown: `Synced ${d.synced ?? '?'} memory files to pipeline.` };
};

export const manifest: KitManifest = {
  id: 'pipeline-ops', name: 'Pipeline Operations', version: '1.0.0',
  description: 'Pipeline — aggregated view of all active work: GitHub commits, Vercel deployments, n8n workflows, local sessions, and full data sync.',
  author: 'MCV', capabilities: ['network'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use pipeline tools for a unified view of all active work across all sources, and to trigger data synchronization.',
  tools: [
    { name: 'pipeline_status', description: 'Get the full pipeline: all active entries from GitHub, Vercel, n8n, local.', input_schema: { type: 'object', properties: {} } },
    { name: 'pipeline_full_sync', description: 'Trigger a full data sync (commits, memories, repos, notifications).', input_schema: { type: 'object', properties: {} } },
    { name: 'pipeline_sync_commits', description: 'Sync git commits into the pipeline.', input_schema: { type: 'object', properties: {} } },
    { name: 'pipeline_sync_memories', description: 'Sync local memory files into the pipeline.', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = { pipeline_status: getPipeline, pipeline_full_sync: fullSync, pipeline_sync_commits: syncCommits, pipeline_sync_memories: syncMemories };
