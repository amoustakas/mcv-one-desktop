import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function dgApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/deepgram?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Deepgram error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/deepgram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Deepgram error'); }
  return r.json();
}

const transcribeUrl: KitToolHandler = async (input, ctx) => {
  const d = await dgApi('transcribe-url', { url: input.url, language: input.language, model: input.model, diarize: input.diarize }, ctx, 'POST');
  const transcript = d.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
  const confidence = d.results?.channels?.[0]?.alternatives?.[0]?.confidence;
  return { success: true, data: d, displayMarkdown: `## Transcription\n\n**Confidence:** ${confidence ? (confidence * 100).toFixed(1) + '%' : 'N/A'}\n\n${transcript.slice(0, 5000)}` };
};

const transcribeWithIntelligence: KitToolHandler = async (input, ctx) => {
  const d = await dgApi('transcribe-with-intelligence', { url: input.url, language: input.language }, ctx, 'POST');
  const alt = d.results?.channels?.[0]?.alternatives?.[0];
  let md = `## Transcription (Full Intelligence)\n\n${(alt?.transcript || '').slice(0, 3000)}`;
  if (d.results?.summary) md += `\n\n### Summary\n${d.results.summary.short}`;
  if (d.results?.topics?.segments?.length) md += `\n\n### Topics\n${d.results.topics.segments.map((s: { topics: { topic: string }[] }) => s.topics?.map((t) => t.topic).join(', ')).join('; ')}`;
  if (d.results?.sentiments?.average) md += `\n\n### Sentiment: ${d.results.sentiments.average.sentiment}`;
  return { success: true, data: d, displayMarkdown: md };
};

const listModels: KitToolHandler = async (_i, ctx) => {
  const d = await dgApi('list-models', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Deepgram Models\n\n\`\`\`json\n${JSON.stringify(d, null, 2).slice(0, 2000)}\n\`\`\`` };
};

const dgOverview: KitToolHandler = async (_i, ctx) => {
  const d = await dgApi('overview', {}, ctx);
  const lines = d.projects?.map((p: { name: string; id: string }) => `- **${p.name}** (\`${p.id}\`)`) || [];
  return { success: true, data: d, displayMarkdown: `## Deepgram Overview\n\n- **Projects:** ${d.project_count}\n${lines.join('\n')}` };
};

export const manifest: KitManifest = {
  id: 'deepgram-audio', name: 'Deepgram Audio', version: '1.0.0',
  description: 'Deepgram — speech-to-text transcription with topics, sentiment, summarization, diarization, and entity detection.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use deepgram tools for audio/video transcription from URLs, with optional intelligence features (topics, sentiment, summary).',
  tools: [
    { name: 'deepgram_transcribe', description: 'Transcribe audio/video from a URL.', input_schema: { type: 'object', properties: { url: { type: 'string', description: 'URL to audio/video file' }, language: { type: 'string' }, model: { type: 'string', description: 'nova-2, whisper, etc.' }, diarize: { type: 'boolean' } }, required: ['url'] } },
    { name: 'deepgram_transcribe_intel', description: 'Transcribe with full intelligence: topics, sentiment, summary, entities, intents, diarization.', input_schema: { type: 'object', properties: { url: { type: 'string' }, language: { type: 'string' } }, required: ['url'] } },
    { name: 'deepgram_list_models', description: 'List available transcription models.', input_schema: { type: 'object', properties: {} } },
    { name: 'deepgram_overview', description: 'Deepgram account overview: projects.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  deepgram_transcribe: transcribeUrl, deepgram_transcribe_intel: transcribeWithIntelligence,
  deepgram_list_models: listModels, deepgram_overview: dgOverview,
};
