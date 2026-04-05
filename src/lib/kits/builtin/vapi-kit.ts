import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function vapiApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/vapi?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Vapi error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/vapi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Vapi error'); }
  return r.json();
}

const listAssistants: KitToolHandler = async (_i, ctx) => {
  const data = await vapiApi('list-assistants', {}, ctx);
  const list = Array.isArray(data) ? data : [];
  const lines = list.map((a: { id: string; name: string; model: { model: string } }) => `- **${a.name}** (\`${a.id}\`) — ${a.model?.model || 'default'}`);
  return { success: true, data: list, displayMarkdown: `## Vapi Assistants (${list.length})\n\n${lines.join('\n')}` };
};

const createAssistant: KitToolHandler = async (input, ctx) => {
  const d = await vapiApi('create-assistant', { name: input.name, instructions: input.instructions, firstMessage: input.firstMessage }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Assistant created: **${d.name}** (\`${d.id}\`)` };
};

const listCalls: KitToolHandler = async (input, ctx) => {
  const data = await vapiApi('list-calls', { limit: input.limit ?? 10 }, ctx);
  const list = Array.isArray(data) ? data : [];
  const lines = list.map((c: { id: string; status: string; type: string; createdAt: string }) =>
    `- \`${c.id.slice(0, 8)}\` — **${c.status}** (${c.type}) — ${new Date(c.createdAt).toLocaleString()}`);
  return { success: true, data: list, displayMarkdown: `## Calls (${list.length})\n\n${lines.join('\n')}` };
};

const makeCall: KitToolHandler = async (input, ctx) => {
  const d = await vapiApi('create-call', { assistantId: input.assistantId, phoneNumberId: input.phoneNumberId, customer: input.customer }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Call initiated: \`${d.id}\` — status: ${d.status}` };
};

const listPhoneNumbers: KitToolHandler = async (_i, ctx) => {
  const data = await vapiApi('list-phone-numbers', {}, ctx);
  const list = Array.isArray(data) ? data : [];
  const lines = list.map((p: { id: string; number: string; name: string; status: string }) =>
    `- **${p.name || p.number}** (\`${p.number}\`) — ${p.status}`);
  return { success: true, data: list, displayMarkdown: `## Phone Numbers (${list.length})\n\n${lines.join('\n')}` };
};

const vapiOverview: KitToolHandler = async (_i, ctx) => {
  const d = await vapiApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Vapi Overview\n\n- **Assistants:** ${d.assistants}\n- **Recent Calls:** ${d.recent_calls}\n- **Phone Numbers:** ${d.phone_numbers}` };
};

export const manifest: KitManifest = {
  id: 'vapi-voice', name: 'Vapi Voice AI', version: '1.0.0',
  description: 'Vapi — AI voice assistants, outbound calls, phone numbers, workflows, and call analytics.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use vapi tools for AI voice assistant management, making outbound calls, managing phone numbers, and reviewing call logs.',
  tools: [
    { name: 'vapi_list_assistants', description: 'List all Vapi voice assistants.', input_schema: { type: 'object', properties: {} } },
    { name: 'vapi_create_assistant', description: 'Create a new voice assistant.', input_schema: { type: 'object', properties: { name: { type: 'string' }, instructions: { type: 'string' }, firstMessage: { type: 'string' } }, required: ['name'] } },
    { name: 'vapi_list_calls', description: 'List recent calls.', input_schema: { type: 'object', properties: { limit: { type: 'number' } } } },
    { name: 'vapi_make_call', description: 'Initiate an outbound AI voice call.', input_schema: { type: 'object', properties: { assistantId: { type: 'string' }, phoneNumberId: { type: 'string' }, customer: { type: 'object' } }, required: ['assistantId'] } },
    { name: 'vapi_list_phone_numbers', description: 'List available phone numbers.', input_schema: { type: 'object', properties: {} } },
    { name: 'vapi_overview', description: 'Vapi account overview.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  vapi_list_assistants: listAssistants, vapi_create_assistant: createAssistant,
  vapi_list_calls: listCalls, vapi_make_call: makeCall,
  vapi_list_phone_numbers: listPhoneNumbers, vapi_overview: vapiOverview,
};
