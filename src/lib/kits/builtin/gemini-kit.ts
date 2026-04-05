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

const geminiGenerate: KitToolHandler = async (input, ctx) => {
  const prompt = input.prompt as string;
  const data = await postJson('/api/google', { action: 'gemini-generate', prompt }, ctx);
  return {
    success: true,
    data: data.content,
    displayMarkdown: data.content || 'No response from Gemini.',
  };
};

const geminiSummarize: KitToolHandler = async (input, ctx) => {
  const text = input.text as string;
  const data = await postJson('/api/google', { action: 'gemini-summarize', text }, ctx);
  return {
    success: true,
    data: data.content,
    displayMarkdown: `## Summary\n\n${data.content || 'No summary generated.'}`,
  };
};

const placesSearch: KitToolHandler = async (input, ctx) => {
  const query = input.query as string;
  const data = await postJson('/api/google', { action: 'places-search', query }, ctx);
  const places = data.places ?? [];
  if (places.length === 0) return { success: true, data: [], displayMarkdown: 'No places found.' };
  const lines = places.slice(0, 10).map(
    (p: { name: string; address: string; rating: number }) =>
      `- **${p.name}** — ${p.address} (${p.rating ? p.rating + ' stars' : 'unrated'})`,
  );
  return { success: true, data: places, displayMarkdown: `## Places: ${query}\n\n${lines.join('\n')}` };
};

const geocodeAddress: KitToolHandler = async (input, ctx) => {
  const address = input.address as string;
  const data = await postJson('/api/google', { action: 'maps-geocode', address }, ctx);
  const results = data.results ?? [];
  if (results.length === 0) return { success: true, data: null, displayMarkdown: 'Address not found.' };
  const r = results[0];
  const loc = r.geometry?.location;
  return {
    success: true,
    data: { address: r.formatted_address, lat: loc?.lat, lng: loc?.lng },
    displayMarkdown: `**${r.formatted_address}**\nLat: ${loc?.lat}, Lng: ${loc?.lng}`,
  };
};

// Epic 8: Cloud code execution handler
const geminiCodeExecute: KitToolHandler = async (input, ctx) => {
  const prompt = (input.prompt || input.code || input.query) as string;
  const data = await postJson('/api/google-generate', { action: 'generate-with-code-execution', prompt }, ctx);
  let md = data.content || '';
  if (data.codeResults?.length) {
    md += '\n\n**Code Execution:**\n';
    for (const cr of data.codeResults) {
      if (cr.code) md += `\`\`\`${cr.language || 'python'}\n${cr.code}\n\`\`\`\n`;
      if (cr.output) md += `Output: ${cr.output}\n`;
    }
  }
  return { success: true, data, displayMarkdown: md };
};

// Epic 8: Search grounding handler
const geminiSearch: KitToolHandler = async (input, ctx) => {
  const query = (input.query || input.prompt) as string;
  const data = await postJson('/api/google-generate', { action: 'generate-with-search', prompt: query }, ctx);
  let md = data.content || '';
  if (data.groundingMetadata) md += '\n\n*Grounded with Google Search*';
  return { success: true, data, displayMarkdown: md };
};

export const manifest: KitManifest = {
  id: 'gemini-intelligence',
  name: 'Gemini Intelligence',
  version: '2.0.0',
  description: 'Google Gemini for text generation, summarization, code execution, web search grounding, and Google Places/Geocoding APIs.',
  author: 'MCV',
  capabilities: ['network', 'llm'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use gemini_generate for long-context analysis. Use gemini_summarize for condensing text. Use gemini_code_execute when you need to run Python for math, data analysis, or computation. Use gemini_search to look up live web data. Use places_search and geocode_address for location queries.',
  tools: [
    {
      name: 'gemini_generate',
      description: 'Send a prompt to Google Gemini Pro. Use for long-context document analysis (100k+ tokens), second-opinion reasoning, or Google-specific knowledge not available to Claude.',
      input_schema: {
        type: 'object',
        properties: { prompt: { type: 'string', description: 'The prompt to send to Gemini' } },
        required: ['prompt'],
      },
    },
    {
      name: 'gemini_summarize',
      description: 'Summarize text using Gemini Flash.',
      input_schema: {
        type: 'object',
        properties: { text: { type: 'string', description: 'Text or URL to summarize' } },
        required: ['text'],
      },
    },
    {
      name: 'places_search',
      description: 'Search Google Places for businesses, restaurants, landmarks, etc.',
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search query (e.g. "coffee shops near Toronto")' } },
        required: ['query'],
      },
    },
    {
      name: 'geocode_address',
      description: 'Geocode an address to get latitude and longitude coordinates.',
      input_schema: {
        type: 'object',
        properties: { address: { type: 'string', description: 'Address to geocode' } },
        required: ['address'],
      },
    },
    {
      name: 'gemini_code_execute',
      description: 'Execute Python code using Gemini cloud compute. Use for mathematical calculations, data analysis, statistical computations, or any task requiring actual code execution.',
      input_schema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Description of the computation or code to execute' },
          code: { type: 'string', description: 'Optional: specific Python code to run' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'gemini_search',
      description: 'Search the live web using Google Search grounding. Use to find current prices, news, facts, or any real-time information.',
      input_schema: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search query for live web data' } },
        required: ['query'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  gemini_generate: geminiGenerate,
  gemini_summarize: geminiSummarize,
  places_search: placesSearch,
  geocode_address: geocodeAddress,
  gemini_code_execute: geminiCodeExecute,
  gemini_search: geminiSearch,
};
