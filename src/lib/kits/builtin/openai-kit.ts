import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function oaiApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'POST') {
  const r = await ctx.fetch('/api/openai', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'OpenAI error'); }
  return r.json();
}

const chat: KitToolHandler = async (input, ctx) => {
  const messages = input.messages || [{ role: 'user', content: input.prompt }];
  const d = await oaiApi('chat', { messages, model: input.model, temperature: input.temperature }, ctx);
  const content = d.choices?.[0]?.message?.content || '';
  return { success: true, data: d, displayMarkdown: content };
};

const generateImage: KitToolHandler = async (input, ctx) => {
  const d = await oaiApi('generate-image', { prompt: input.prompt, size: input.size, quality: input.quality }, ctx);
  const images = d.data ?? [];
  const lines = images.map((img: { url: string; revised_prompt: string }, i: number) => `![Image ${i + 1}](${img.url})\n*${img.revised_prompt || ''}*`);
  return { success: true, data: d, displayMarkdown: `## Generated Image\n\n${lines.join('\n\n')}` };
};

const embeddings: KitToolHandler = async (input, ctx) => {
  const d = await oaiApi('embeddings', { input: input.text, model: input.model }, ctx);
  const dim = d.data?.[0]?.embedding?.length ?? 0;
  return { success: true, data: d, displayMarkdown: `Embedding generated: ${dim} dimensions (model: ${d.model})` };
};

const moderation: KitToolHandler = async (input, ctx) => {
  const d = await oaiApi('moderation', { input: input.text }, ctx);
  const result = d.results?.[0];
  const flagged = result?.flagged ? 'FLAGGED' : 'OK';
  const cats = Object.entries(result?.categories || {}).filter(([, v]) => v).map(([k]) => k);
  return { success: true, data: d, displayMarkdown: `## Moderation: **${flagged}**\n\n${cats.length > 0 ? `Categories: ${cats.join(', ')}` : 'No violations detected.'}` };
};

const listModels: KitToolHandler = async (_i, ctx) => {
  const d = await oaiApi('list-models', {}, ctx);
  const models = (d.data ?? []).filter((m: { id: string }) => ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'dall-e-3', 'whisper-1', 'tts-1'].includes(m.id));
  const lines = models.map((m: { id: string; owned_by: string }) => `- **${m.id}** (${m.owned_by})`);
  return { success: true, data: models, displayMarkdown: `## Key Models\n\n${lines.join('\n')}` };
};

const oaiOverview: KitToolHandler = async (_i, ctx) => {
  const d = await oaiApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## OpenAI Overview\n\n- **Total Models:** ${d.total_models}\n- **Custom Models:** ${d.custom_models}\n- **Available:** ${d.key_models?.join(', ')}` };
};

export const manifest: KitManifest = {
  id: 'openai-ai', name: 'OpenAI', version: '1.0.0',
  description: 'OpenAI — GPT-4o chat, DALL-E image generation, embeddings, moderation, whisper transcription, TTS.',
  author: 'MCV', capabilities: ['network', 'credentials', 'llm'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use openai tools as an alternative AI provider to Claude/Gemini. GPT-4o for chat, DALL-E for images, embeddings for semantic search, moderation for content safety.',
  tools: [
    { name: 'openai_chat', description: 'Chat completion with GPT-4o.', input_schema: { type: 'object', properties: { prompt: { type: 'string' }, model: { type: 'string', description: 'gpt-4o, gpt-4o-mini' }, temperature: { type: 'number' } }, required: ['prompt'] } },
    { name: 'openai_image', description: 'Generate an image with DALL-E 3.', input_schema: { type: 'object', properties: { prompt: { type: 'string' }, size: { type: 'string', description: '1024x1024, 1792x1024, 1024x1792' }, quality: { type: 'string', description: 'standard or hd' } }, required: ['prompt'] } },
    { name: 'openai_embeddings', description: 'Generate text embeddings for semantic search.', input_schema: { type: 'object', properties: { text: { type: 'string' }, model: { type: 'string' } }, required: ['text'] } },
    { name: 'openai_moderation', description: 'Check text for policy violations.', input_schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
    { name: 'openai_models', description: 'List available models.', input_schema: { type: 'object', properties: {} } },
    { name: 'openai_overview', description: 'OpenAI account overview.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  openai_chat: chat, openai_image: generateImage, openai_embeddings: embeddings,
  openai_moderation: moderation, openai_models: listModels, openai_overview: oaiOverview,
};
