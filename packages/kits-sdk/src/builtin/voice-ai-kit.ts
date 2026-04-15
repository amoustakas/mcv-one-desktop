import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function postJson(url: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

const voiceListVoices: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/voice-voices', { action: 'list' }, ctx);
  const voices = data.voices || [];

  // Apply filters
  let filtered = voices;
  if (input.gender) filtered = filtered.filter((v: any) => v.gender.toLowerCase() === (input.gender as string).toLowerCase());
  if (input.pitch) filtered = filtered.filter((v: any) => v.pitch.toLowerCase().includes((input.pitch as string).toLowerCase()));

  const lines = filtered.slice(0, 15).map((v: any) =>
    `- **${v.name}** — ${v.gender}, ${v.pitch} pitch (${v.traits.join(', ')})`,
  );

  return {
    success: true,
    data: filtered,
    displayMarkdown: `## Available Voices (${filtered.length})\n\n${lines.join('\n')}`,
  };
};

const voiceRecommend: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/voice-voices', {
    action: 'recommend',
    description: input.description,
    useCase: input.useCase,
  }, ctx);

  const recs = data.recommendations || [];
  const lines = recs.map((r: any) => `- **${r.name}** — ${r.reasoning}`);

  return {
    success: true,
    data: recs,
    displayMarkdown: recs.length
      ? `## Voice Recommendations\n\n${lines.join('\n')}`
      : 'No recommendations found.',
  };
};

const voiceStartConversation: KitToolHandler = async (_input, _ctx) => {
  // Voice conversations are started from the Voice Studio UI, not via kit tools.
  // This tool provides guidance on how to start.
  return {
    success: true,
    data: { action: 'navigate', view: 'voice-studio' },
    displayMarkdown: '**Voice conversation started.** Navigate to **Voice Studio** in the sidebar to speak with the AI. You can select a voice, set a personality, and enable function calling.',
  };
};

export const manifest: KitManifest = {
  id: 'voice-ai',
  name: 'Voice AI',
  version: '1.0.0',
  description: 'AI voice capabilities — 31 pre-built voices, AI casting director, real-time voice conversations with function calling via Gemini Live API.',
  author: 'MCV',
  capabilities: ['network', 'llm'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use voice_list_voices to show available AI voices with optional gender/pitch filters. Use voice_recommend_voice to get AI-powered voice recommendations for a use case. Use voice_start_conversation to begin a real-time voice session (opens Voice Studio).',
  tools: [
    {
      name: 'voice_list_voices',
      description: 'List available AI voices with optional filters.',
      input_schema: {
        type: 'object',
        properties: {
          gender: { type: 'string', enum: ['Male', 'Female'], description: 'Filter by gender' },
          pitch: { type: 'string', description: 'Filter by pitch (e.g. "Low", "Medium", "High")' },
        },
      },
    },
    {
      name: 'voice_recommend_voice',
      description: 'AI Casting Director — recommend the best voices for a specific use case or character.',
      input_schema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Natural language description of the voice needed (e.g. "a warm, authoritative narrator for a documentary")' },
          useCase: { type: 'string', description: 'Context: podcast, game-npc, narrator, customer-service, etc.' },
        },
        required: ['description'],
      },
    },
    {
      name: 'voice_start_conversation',
      description: 'Start a real-time voice conversation with an AI agent. Opens the Voice Studio.',
      input_schema: {
        type: 'object',
        properties: {
          voiceName: { type: 'string', description: 'Voice to use (e.g. "Zephyr", "Charon")' },
          systemPrompt: { type: 'string', description: 'Personality/instructions for the voice agent' },
        },
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  voice_list_voices: voiceListVoices,
  voice_recommend_voice: voiceRecommend,
  voice_start_conversation: voiceStartConversation,
};
