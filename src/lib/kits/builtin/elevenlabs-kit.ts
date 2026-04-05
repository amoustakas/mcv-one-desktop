import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function xiApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/elevenlabs?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'ElevenLabs error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/elevenlabs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'ElevenLabs error'); }
  return r.json();
}

const listVoices: KitToolHandler = async (_i, ctx) => {
  const d = await xiApi('list-voices', {}, ctx);
  const voices = d.voices ?? [];
  const lines = voices.map((v: { name: string; voice_id: string; category: string; labels: Record<string, string> }) =>
    `- **${v.name}** (\`${v.voice_id}\`) — ${v.category} — ${Object.values(v.labels || {}).join(', ')}`);
  return { success: true, data: voices, displayMarkdown: `## Voices (${voices.length})\n\n${lines.join('\n')}` };
};

const tts: KitToolHandler = async (input, ctx) => {
  const d = await xiApi('tts', { voiceId: input.voiceId, text: input.text, model_id: input.model }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `TTS generated for voice \`${input.voiceId}\`: "${(input.text as string).slice(0, 80)}..."` };
};

const generateSfx: KitToolHandler = async (input, ctx) => {
  const d = await xiApi('generate-sfx', { text: input.text, duration_seconds: input.duration }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Sound effect generated: "${input.text}"` };
};

const listModels: KitToolHandler = async (_i, ctx) => {
  const models = await xiApi('list-models', {}, ctx);
  const list = Array.isArray(models) ? models : [];
  const lines = list.map((m: { model_id: string; name: string; description: string }) => `- **${m.name}** (\`${m.model_id}\`) — ${(m.description || '').slice(0, 60)}`);
  return { success: true, data: list, displayMarkdown: `## Models (${list.length})\n\n${lines.join('\n')}` };
};

const searchVoices: KitToolHandler = async (input, ctx) => {
  const d = await xiApi('search-voices', { query: input.query, page_size: input.limit ?? 10 }, ctx);
  const voices = d.voices ?? [];
  const lines = voices.map((v: { name: string; voice_id: string; category: string }) => `- **${v.name}** (\`${v.voice_id}\`) — ${v.category}`);
  return { success: true, data: voices, displayMarkdown: `## Voice Search: "${input.query}" (${voices.length})\n\n${lines.join('\n')}` };
};

const xiOverview: KitToolHandler = async (_i, ctx) => {
  const d = await xiApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## ElevenLabs Overview\n\n- **Tier:** ${d.tier}\n- **Characters Used:** ${d.character_count?.toLocaleString()} / ${d.character_limit?.toLocaleString()}\n- **Voices:** ${d.voice_count}\n- **Models:** ${d.model_count}` };
};

export const manifest: KitManifest = {
  id: 'elevenlabs-voice', name: 'ElevenLabs Voice', version: '1.0.0',
  description: 'ElevenLabs — text-to-speech, voices, voice search, sound effects, models, and usage.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use elevenlabs tools for TTS generation, voice browsing, sound effects, and voice AI capabilities.',
  tools: [
    { name: 'elevenlabs_list_voices', description: 'List all available voices.', input_schema: { type: 'object', properties: {} } },
    { name: 'elevenlabs_tts', description: 'Generate speech from text.', input_schema: { type: 'object', properties: { voiceId: { type: 'string' }, text: { type: 'string' }, model: { type: 'string', description: 'eleven_multilingual_v2, eleven_turbo_v2, etc.' } }, required: ['voiceId', 'text'] } },
    { name: 'elevenlabs_generate_sfx', description: 'Generate a sound effect from text description.', input_schema: { type: 'object', properties: { text: { type: 'string', description: 'Description of the sound' }, duration: { type: 'number' } }, required: ['text'] } },
    { name: 'elevenlabs_list_models', description: 'List available TTS models.', input_schema: { type: 'object', properties: {} } },
    { name: 'elevenlabs_search_voices', description: 'Search the voice library.', input_schema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
    { name: 'elevenlabs_overview', description: 'Account overview: tier, usage, voice count.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  elevenlabs_list_voices: listVoices, elevenlabs_tts: tts, elevenlabs_generate_sfx: generateSfx,
  elevenlabs_list_models: listModels, elevenlabs_search_voices: searchVoices, elevenlabs_overview: xiOverview,
};
