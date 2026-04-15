import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function memApi(path: string, ctx: KitExecutionContext, options?: { method?: string; body?: unknown }) {
  const r = await ctx.fetch(`/api/memory${path}`, {
    method: options?.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Memory error'); }
  return r.json();
}

const listMemories: KitToolHandler = async (input, ctx) => {
  const params = new URLSearchParams();
  if (input.type) params.set('type', input.type as string);
  if (input.ventureId) params.set('ventureId', input.ventureId as string);
  if (input.search) params.set('search', input.search as string);
  const d = await memApi(`?${params.toString()}`, ctx);
  const mems = d.memories ?? d.data ?? [];
  const lines = mems.map((m: { key: string; type: string; value: string }) =>
    `- **${m.key}** (${m.type}) — ${typeof m.value === 'string' ? m.value.slice(0, 80) : '...'}`);
  return { success: true, data: mems, displayMarkdown: `## Memories (${mems.length})\n\n${lines.join('\n')}` };
};

const saveMemory: KitToolHandler = async (input, ctx) => {
  const d = await memApi('', ctx, { method: 'POST', body: { key: input.key, type: input.type || 'project', value: input.value, venture_id: input.ventureId } });
  return { success: true, data: d, displayMarkdown: `Memory saved: **${input.key}** (${input.type || 'project'})` };
};

const deleteMemory: KitToolHandler = async (input, ctx) => {
  await memApi(`?id=${input.id}`, ctx, { method: 'DELETE' });
  return { success: true, data: {}, displayMarkdown: `Memory deleted: ${input.id}` };
};

const listEvents: KitToolHandler = async (input, ctx) => {
  const params = new URLSearchParams({ events: 'true' });
  if (input.sessionId) params.set('sessionId', input.sessionId as string);
  if (input.eventType) params.set('eventType', input.eventType as string);
  const d = await memApi(`?${params.toString()}`, ctx);
  const events = d.events ?? d.data ?? [];
  const lines = events.slice(0, 20).map((e: { event_type: string; description: string; created_at: string }) =>
    `- **${e.event_type}** — ${e.description?.slice(0, 80)} — ${new Date(e.created_at).toLocaleString()}`);
  return { success: true, data: events, displayMarkdown: `## Session Events (${events.length})\n\n${lines.join('\n')}` };
};

export const manifest: KitManifest = {
  id: 'memory-system', name: 'Memory System', version: '1.0.0',
  description: 'MCV Memory — project memories, session events, cross-session knowledge, and contextual search.',
  author: 'MCV', capabilities: ['network'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use memory tools for storing/retrieving project knowledge, searching memories, and tracking session events across conversations.',
  tools: [
    { name: 'memory_list', description: 'List project memories. Search, filter by type or venture.', input_schema: { type: 'object', properties: { type: { type: 'string', description: 'user, feedback, project, reference' }, ventureId: { type: 'string' }, search: { type: 'string' } } } },
    { name: 'memory_save', description: 'Save a new memory for cross-session recall.', input_schema: { type: 'object', properties: { key: { type: 'string' }, value: { type: 'string' }, type: { type: 'string' }, ventureId: { type: 'string' } }, required: ['key', 'value'] } },
    { name: 'memory_delete', description: 'Delete a memory by ID.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'memory_events', description: 'List session events (agent actions, tool calls, decisions).', input_schema: { type: 'object', properties: { sessionId: { type: 'string' }, eventType: { type: 'string' } } } },
  ],
};
export const handlers: Record<string, KitToolHandler> = { memory_list: listMemories, memory_save: saveMemory, memory_delete: deleteMemory, memory_events: listEvents };
