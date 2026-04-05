import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function claudeApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const r = await ctx.fetch('/api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Claude error'); }
  return r.json();
}

const chat: KitToolHandler = async (input, ctx) => {
  const d = await claudeApi('chat', {
    messages: input.messages || [{ role: 'user', content: input.prompt }],
    model: input.model, system: input.system, temperature: input.temperature, max_tokens: input.max_tokens,
  }, ctx);
  const text = d.content?.map((b: { type: string; text?: string }) => b.type === 'text' ? b.text : '').join('') || '';
  return { success: true, data: d, displayMarkdown: `${text}\n\n*${d.model} — ${d.usage?.input_tokens}→${d.usage?.output_tokens} tokens*` };
};

const think: KitToolHandler = async (input, ctx) => {
  const d = await claudeApi('think', {
    messages: input.messages || [{ role: 'user', content: input.prompt }],
    model: input.model, budget_tokens: input.budget ?? 10000, max_tokens: input.max_tokens,
  }, ctx);
  let md = d.response || '';
  if (d.thinking?.length) md = `<details><summary>Thinking (${d.thinking.length} blocks)</summary>\n\n${d.thinking.join('\n\n---\n\n')}\n\n</details>\n\n${md}`;
  md += `\n\n*${d.model} — ${d.usage?.input_tokens}→${d.usage?.output_tokens} tokens*`;
  return { success: true, data: d, displayMarkdown: md };
};

const vision: KitToolHandler = async (input, ctx) => {
  const d = await claudeApi('vision', { imageUrl: input.imageUrl, imageBase64: input.imageBase64, prompt: input.prompt, model: input.model }, ctx);
  const text = d.content?.map((b: { type: string; text?: string }) => b.type === 'text' ? b.text : '').join('') || '';
  return { success: true, data: d, displayMarkdown: text };
};

const pdf: KitToolHandler = async (input, ctx) => {
  const d = await claudeApi('pdf', { pdfUrl: input.pdfUrl, pdfBase64: input.pdfBase64, prompt: input.prompt, model: input.model }, ctx);
  const text = d.content?.map((b: { type: string; text?: string }) => b.type === 'text' ? b.text : '').join('') || '';
  return { success: true, data: d, displayMarkdown: text };
};

const countTokens: KitToolHandler = async (input, ctx) => {
  const d = await claudeApi('count-tokens', {
    messages: input.messages || [{ role: 'user', content: input.text }],
    model: input.model, system: input.system, tools: input.tools,
  }, ctx);
  return { success: true, data: d, displayMarkdown: `**Token count:** ${d.input_tokens} input tokens` };
};

const createBatch: KitToolHandler = async (input, ctx) => {
  const d = await claudeApi('create-batch', { requests: input.requests }, ctx);
  return { success: true, data: d, displayMarkdown: `Batch created: \`${d.id}\` — status: ${d.status}` };
};

const getBatch: KitToolHandler = async (input, ctx) => {
  const d = await claudeApi('get-batch', { batchId: input.batchId }, ctx);
  return { success: true, data: d, displayMarkdown: `Batch \`${d.id}\`: **${d.status}**\nCounts: ${JSON.stringify(d.counts)}` };
};

const toolUse: KitToolHandler = async (input, ctx) => {
  const d = await claudeApi('tool-use', { messages: input.messages, tools: input.tools, system: input.system, model: input.model }, ctx);
  let md = d.text || '';
  if (d.tool_calls?.length) {
    md += '\n\n**Tool Calls:**\n' + d.tool_calls.map((tc: { name: string; input: unknown }) => `- **${tc.name}**(${JSON.stringify(tc.input)})`).join('\n');
  }
  return { success: true, data: d, displayMarkdown: md };
};

const listModels: KitToolHandler = async (_i, ctx) => {
  const d = await claudeApi('list-models', {}, ctx);
  const lines = d.models?.map((m: { id: string; name: string; context: number; output: number }) =>
    `- **${m.name}** (\`${m.id}\`) — ${(m.context / 1000).toFixed(0)}K ctx, ${(m.output / 1000).toFixed(0)}K out`) || [];
  return { success: true, data: d, displayMarkdown: `## Claude Models\n\n${lines.join('\n')}` };
};

const claudeOverview: KitToolHandler = async (_i, ctx) => {
  const d = await claudeApi('overview', {}, ctx);
  if (d.status === 'error') return { success: false, error: d.error, displayMarkdown: `## Claude: **ERROR**\n\n${d.error}` };
  return { success: true, data: d, displayMarkdown: `## Claude API: **${d.status}**\n\n- **Model:** ${d.model_tested}\n- **Available Models:** ${d.available_models}\n- **Capabilities:** ${d.capabilities?.join(', ')}` };
};

export const manifest: KitManifest = {
  id: 'claude-ai', name: 'Claude AI (Direct)', version: '1.0.0',
  description: 'Claude — direct API access: chat, extended thinking, vision, PDF analysis, prompt caching, tool use, batch processing, token counting.',
  author: 'MCV', capabilities: ['network', 'credentials', 'llm'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use claude tools for direct Claude API access beyond the default Aegis chat. Extended thinking for complex reasoning, vision for images, PDF for documents, batch for bulk processing, token counting for cost estimation.',
  tools: [
    { name: 'claude_chat', description: 'Chat with Claude directly (bypasses Aegis orchestrator).', input_schema: { type: 'object', properties: { prompt: { type: 'string' }, model: { type: 'string', description: 'claude-sonnet-4-5-20250929, claude-opus-4-20250514' }, system: { type: 'string' }, temperature: { type: 'number' }, max_tokens: { type: 'number' } }, required: ['prompt'] } },
    { name: 'claude_think', description: 'Extended thinking — Claude shows its reasoning chain before answering.', input_schema: { type: 'object', properties: { prompt: { type: 'string' }, budget: { type: 'number', description: 'Thinking token budget (default 10000)' }, model: { type: 'string' } }, required: ['prompt'] } },
    { name: 'claude_vision', description: 'Analyze an image with Claude vision.', input_schema: { type: 'object', properties: { imageUrl: { type: 'string', description: 'URL to image' }, imageBase64: { type: 'string', description: 'Base64 encoded image' }, prompt: { type: 'string', description: 'What to analyze (default: describe)' } } } },
    { name: 'claude_pdf', description: 'Analyze a PDF document.', input_schema: { type: 'object', properties: { pdfUrl: { type: 'string', description: 'URL to PDF' }, pdfBase64: { type: 'string', description: 'Base64 encoded PDF' }, prompt: { type: 'string' } } } },
    { name: 'claude_count_tokens', description: 'Count tokens for a message without sending it (cost estimation).', input_schema: { type: 'object', properties: { text: { type: 'string' }, system: { type: 'string' } }, required: ['text'] } },
    { name: 'claude_batch', description: 'Create a batch of requests for async processing (50% cheaper).', input_schema: { type: 'object', properties: { requests: { type: 'array', description: 'Array of {custom_id, params: {model, max_tokens, messages}}' } }, required: ['requests'] } },
    { name: 'claude_get_batch', description: 'Check batch processing status.', input_schema: { type: 'object', properties: { batchId: { type: 'string' } }, required: ['batchId'] } },
    { name: 'claude_tool_use', description: 'Send a message with tools/function calling.', input_schema: { type: 'object', properties: { messages: { type: 'array' }, tools: { type: 'array', description: 'Anthropic tool definitions' }, system: { type: 'string' } }, required: ['messages', 'tools'] } },
    { name: 'claude_models', description: 'List available Claude models.', input_schema: { type: 'object', properties: {} } },
    { name: 'claude_overview', description: 'Claude API status and capabilities check.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  claude_chat: chat, claude_think: think, claude_vision: vision, claude_pdf: pdf,
  claude_count_tokens: countTokens, claude_batch: createBatch, claude_get_batch: getBatch,
  claude_tool_use: toolUse, claude_models: listModels, claude_overview: claudeOverview,
};
