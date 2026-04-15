import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function lmsApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/lmstudio?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'LM Studio error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/lmstudio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'LM Studio error'); }
  return r.json();
}

const chat: KitToolHandler = async (input, ctx) => {
  const messages = input.messages || [{ role: 'user', content: input.prompt }];
  const d = await lmsApi('chat', { model: input.model, messages, temperature: input.temperature, max_tokens: input.max_tokens }, ctx, 'POST');
  const content = d.choices?.[0]?.message?.content || '';
  const stats = d.stats;
  let md = content;
  if (stats) md += `\n\n*${stats.tokens_per_second?.toFixed(1)} tok/s | ${d.usage?.total_tokens} tokens | ${d.model_info?.arch}/${d.model_info?.quant}*`;
  return { success: true, data: d, displayMarkdown: md };
};

const chatStructured: KitToolHandler = async (input, ctx) => {
  const messages = input.messages || [{ role: 'user', content: input.prompt }];
  const d = await lmsApi('chat-structured', { model: input.model, messages, schema: input.schema, temperature: input.temperature }, ctx, 'POST');
  const content = d.choices?.[0]?.message?.content || '';
  try {
    const parsed = JSON.parse(content);
    return { success: true, data: parsed, displayMarkdown: `## Structured Output\n\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\`` };
  } catch {
    return { success: true, data: content, displayMarkdown: content };
  }
};

const chatWithTools: KitToolHandler = async (input, ctx) => {
  const d = await lmsApi('chat-with-tools', { model: input.model, messages: input.messages, tools: input.tools, tool_choice: input.tool_choice }, ctx, 'POST');
  const choice = d.choices?.[0];
  if (choice?.message?.tool_calls?.length) {
    const calls = choice.message.tool_calls.map((tc: { function: { name: string; arguments: string } }) =>
      `- **${tc.function.name}**(${tc.function.arguments})`);
    return { success: true, data: d, displayMarkdown: `## Tool Calls\n\n${calls.join('\n')}` };
  }
  return { success: true, data: d, displayMarkdown: choice?.message?.content || 'No response' };
};

const embeddings: KitToolHandler = async (input, ctx) => {
  const d = await lmsApi('embeddings', { model: input.model, input: input.text }, ctx, 'POST');
  const dim = d.data?.[0]?.embedding?.length ?? 0;
  return { success: true, data: d, displayMarkdown: `Local embedding generated: **${dim} dimensions** (model: ${d.model || 'default'})` };
};

const listModels: KitToolHandler = async (_i, ctx) => {
  const d = await lmsApi('list-models', {}, ctx);
  const models = d.data ?? [];
  const lines = models.map((m: { id: string; object?: string }) => `- **${m.id}**`);
  return { success: true, data: models, displayMarkdown: `## Local Models (${models.length})\n\n${lines.join('\n')}` };
};

const loadModel: KitToolHandler = async (input, ctx) => {
  const d = await lmsApi('load-model', { model: input.model, contextLength: input.contextLength, gpuOffload: input.gpuOffload }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Model **${input.model}** loaded.${input.contextLength ? ` Context: ${input.contextLength}` : ''}` };
};

const unloadModel: KitToolHandler = async (input, ctx) => {
  await lmsApi('unload-model', { model: input.model }, ctx, 'POST');
  return { success: true, data: {}, displayMarkdown: `Model **${input.model}** unloaded.` };
};

const benchmark: KitToolHandler = async (input, ctx) => {
  const d = await lmsApi('benchmark', { model: input.model, prompt: input.prompt }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `## Benchmark: ${d.model}\n\n- **Speed:** ${d.tokensPerSecond?.toFixed(1)} tok/s\n- **Time to first token:** ${d.timeToFirstToken}s\n- **Generation time:** ${d.generationTime}s\n- **Total:** ${d.totalTimeMs}ms\n- **Architecture:** ${d.modelInfo?.arch} (${d.modelInfo?.quant})\n- **Context:** ${d.modelInfo?.context_length}\n- **Runtime:** ${d.runtime?.name}` };
};

const serverHealth: KitToolHandler = async (_i, ctx) => {
  const d = await lmsApi('health', {}, ctx);
  return { success: true, data: d, displayMarkdown: d.online
    ? `## LM Studio: **ONLINE** (${d.latencyMs}ms)\n\nEndpoint: ${d.baseUrl}`
    : `## LM Studio: **OFFLINE**\n\nEndpoint: ${d.baseUrl}\nStart LM Studio and enable the local server.` };
};

const lmsOverview: KitToolHandler = async (_i, ctx) => {
  const d = await lmsApi('overview', {}, ctx);
  if (!d.online) return { success: true, data: d, displayMarkdown: `## LM Studio: **OFFLINE**\n\nStart LM Studio desktop app and enable the local server at ${d.baseUrl}` };
  return { success: true, data: d, displayMarkdown: `## LM Studio: **ONLINE** (${d.latencyMs}ms)\n\n- **Loaded Models:** ${d.loaded_models}\n- **Total Available:** ${d.total_models}\n\n### Active Models\n${d.models?.map((m: string) => `- ${m}`).join('\n') || 'None loaded'}` };
};

export const manifest: KitManifest = {
  id: 'lmstudio-local', name: 'LM Studio (Local)', version: '1.0.0',
  description: 'LM Studio — run LLMs locally: chat, structured output, tool calling, embeddings, model management, benchmarks. Zero cloud cost, full privacy.',
  author: 'MCV', capabilities: ['network', 'llm'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use lmstudio tools for local LLM inference with zero cloud cost. Supports chat, structured JSON output, tool calling, embeddings, model loading/unloading, and performance benchmarks. Requires LM Studio desktop running with local server enabled.',
  tools: [
    { name: 'lms_chat', description: 'Chat with a local LLM (zero cloud cost).', input_schema: { type: 'object', properties: { prompt: { type: 'string' }, model: { type: 'string', description: 'Model ID (optional, uses loaded model)' }, temperature: { type: 'number' }, max_tokens: { type: 'number' } }, required: ['prompt'] } },
    { name: 'lms_chat_structured', description: 'Get structured JSON output from a local LLM.', input_schema: { type: 'object', properties: { prompt: { type: 'string' }, schema: { type: 'object', description: 'JSON Schema for structured output' }, model: { type: 'string' }, temperature: { type: 'number' } }, required: ['prompt', 'schema'] } },
    { name: 'lms_chat_tools', description: 'Local LLM with tool calling (function calling).', input_schema: { type: 'object', properties: { messages: { type: 'array' }, tools: { type: 'array', description: 'OpenAI-format tool definitions' }, model: { type: 'string' }, tool_choice: { type: 'string', description: 'auto, none, or required' } }, required: ['messages', 'tools'] } },
    { name: 'lms_embeddings', description: 'Generate embeddings locally for semantic search.', input_schema: { type: 'object', properties: { text: { type: 'string' }, model: { type: 'string' } }, required: ['text'] } },
    { name: 'lms_list_models', description: 'List available local models.', input_schema: { type: 'object', properties: {} } },
    { name: 'lms_load_model', description: 'Load a model into memory (may take 30-120s).', input_schema: { type: 'object', properties: { model: { type: 'string', description: 'Model path or identifier' }, contextLength: { type: 'number' }, gpuOffload: { type: 'number', description: 'GPU layers to offload (0-999)' } }, required: ['model'] } },
    { name: 'lms_unload_model', description: 'Unload a model from memory.', input_schema: { type: 'object', properties: { model: { type: 'string' } }, required: ['model'] } },
    { name: 'lms_benchmark', description: 'Run a quick performance benchmark on a loaded model.', input_schema: { type: 'object', properties: { model: { type: 'string' }, prompt: { type: 'string' } } } },
    { name: 'lms_health', description: 'Check if LM Studio server is running.', input_schema: { type: 'object', properties: {} } },
    { name: 'lms_overview', description: 'LM Studio overview: server status, loaded models, availability.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  lms_chat: chat, lms_chat_structured: chatStructured, lms_chat_tools: chatWithTools,
  lms_embeddings: embeddings, lms_list_models: listModels, lms_load_model: loadModel,
  lms_unload_model: unloadModel, lms_benchmark: benchmark, lms_health: serverHealth,
  lms_overview: lmsOverview,
};
