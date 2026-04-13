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

// Image generation via Imagen
const geminiImageGen: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/google', { action: 'imagen-generate', prompt: input.prompt, aspectRatio: input.aspectRatio }, ctx);
  if (data.images?.length) {
    return { success: true, data, displayMarkdown: `## Generated Image\n\n*Prompt: "${(input.prompt as string).slice(0, 80)}"*\n\n${data.images.length} image(s) generated.` };
  }
  return { success: true, data, displayMarkdown: data.content || 'Image generation completed.' };
};

// Vision (image analysis)
const geminiVision: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/google', { action: 'gemini-vision', imageUrl: input.imageUrl, imageBase64: input.imageBase64, prompt: input.prompt || 'Describe this image.' }, ctx);
  return { success: true, data, displayMarkdown: data.content || 'No analysis returned.' };
};

// Structured JSON output
const geminiStructured: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/google-generate', { action: 'generate-structured', prompt: input.prompt, responseSchema: input.schema, model: input.model }, ctx);
  try {
    const parsed = JSON.parse(data.content || '{}');
    return { success: true, data: parsed, displayMarkdown: `## Structured Output\n\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\`` };
  } catch {
    return { success: true, data: data.content, displayMarkdown: data.content || 'No output.' };
  }
};

// Embeddings
const geminiEmbeddings: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/google', { action: 'gemini-embed', text: input.text, model: input.model || 'text-embedding-004' }, ctx);
  const dim = data.embedding?.values?.length ?? 0;
  return { success: true, data, displayMarkdown: `Gemini embedding generated: **${dim} dimensions**` };
};

// Epic 8: Search grounding handler
const geminiSearch: KitToolHandler = async (input, ctx) => {
  const query = (input.query || input.prompt) as string;
  const data = await postJson('/api/google-generate', { action: 'generate-with-search', prompt: query }, ctx);
  let md = data.content || '';
  if (data.groundingMetadata) md += '\n\n*Grounded with Google Search*';
  return { success: true, data, displayMarkdown: md };
};

// Video generation via Veo
const geminiVideoGen: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/google', {
    action: 'veo-generate', prompt: input.prompt,
    aspectRatio: input.aspectRatio || '16:9', duration: input.duration,
  }, ctx);
  return { success: true, data, displayMarkdown: `## Video Generation\n\n*Prompt: "${(input.prompt as string).slice(0, 80)}"*\n\nVideo generation ${data.status || 'submitted'}. ${data.videoUrl ? `[Download](${data.videoUrl})` : 'Check progress in Video Studio.'}` };
};

// Image editing via Imagen
const geminiImageEdit: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/google', {
    action: 'imagen-generate', prompt: input.prompt,
    referenceImage: input.imageBase64, editMode: input.editMode || 'inpaint',
  }, ctx);
  return { success: true, data, displayMarkdown: `## Image Edit\n\n*${input.editMode || 'inpaint'}*: "${(input.prompt as string).slice(0, 80)}"\n\n${data.images?.length ? `${data.images.length} image(s) generated.` : 'Edit completed.'}` };
};

// Product mockup via Imagen
const geminiMockup: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/google', {
    action: 'imagen-generate',
    prompt: `Professional product mockup: ${input.prompt}. Lifestyle photography, clean background, commercial quality.`,
    aspectRatio: input.aspectRatio || '4:3',
  }, ctx);
  return { success: true, data, displayMarkdown: `## Product Mockup\n\n${data.images?.length ? `${data.images.length} mockup(s) generated.` : 'Mockup generation completed.'}` };
};

// Document analysis pipeline: upload → cache → analyze
const geminiAnalyzeDocument: KitToolHandler = async (input, ctx) => {
  const md: string[] = ['## Document Analysis\n'];

  // Step 1: Cache the document content
  const content = input.content as string;
  const question = (input.question || 'Provide a comprehensive analysis of this document.') as string;

  if (!content) return { success: false, data: null, displayMarkdown: 'No document content provided.' };

  md.push(`*Analyzing ${(content.length / 1000).toFixed(1)}k characters...*\n`);

  // Step 2: Analyze with Gemini using the full content as context
  const data = await postJson('/api/google', {
    action: 'gemini-generate',
    prompt: `You are analyzing a document. Answer the following question about it.\n\nQuestion: ${question}\n\n--- DOCUMENT START ---\n${content.slice(0, 500000)}\n--- DOCUMENT END ---\n\nProvide a thorough, structured answer with key findings, important quotes, and actionable insights.`,
  }, ctx);

  md.push(data.content || 'No analysis generated.');

  return { success: true, data, displayMarkdown: md.join('\n') };
};

// Dual-model comparison: Ask same question to Claude and Gemini
const dualModelCompare: KitToolHandler = async (input, ctx) => {
  const prompt = input.prompt as string;
  const md: string[] = ['## Dual-Model Comparison\n', `*Prompt: "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"*\n`];

  // Run both in parallel
  const [geminiRes, claudeRes] = await Promise.allSettled([
    postJson('/api/google', { action: 'gemini-generate', prompt }, ctx),
    postJson('/api/chat', { messages: [{ role: 'user', content: prompt }], model: 'claude-sonnet-4-20250514' }, ctx),
  ]);

  md.push('### Gemini Response\n');
  if (geminiRes.status === 'fulfilled') {
    md.push(geminiRes.value.content || 'No response.');
  } else {
    md.push('*Gemini unavailable*');
  }

  md.push('\n### Claude Response\n');
  if (claudeRes.status === 'fulfilled') {
    const claudeContent = claudeRes.value.content?.[0]?.text || claudeRes.value.reply || 'No response.';
    md.push(claudeContent);
  } else {
    md.push('*Claude unavailable*');
  }

  md.push('\n### Key Differences\n');
  md.push('*Compare the responses above for different perspectives, coverage gaps, and unique insights.*');

  return { success: true, data: { gemini: geminiRes, claude: claudeRes }, displayMarkdown: md.join('\n') };
};

// Research + write pipeline: search → synthesize → generate
const geminiResearchAndWrite: KitToolHandler = async (input, ctx) => {
  const topic = input.topic as string;
  const format = (input.format || 'article') as string;
  const md: string[] = [`## Research & Write: ${topic}\n`];

  // Step 1: Research with search grounding
  md.push('*Researching with Google Search...*\n');
  const research = await postJson('/api/google-generate', {
    action: 'generate-with-search',
    prompt: `Research the topic "${topic}" thoroughly. Gather key facts, recent developments, expert opinions, and statistics. Return a structured research brief with sources.`,
  }, ctx);

  // Step 2: Generate content based on research
  md.push('*Writing content...*\n');
  const content = await postJson('/api/google', {
    action: 'gemini-generate',
    prompt: `Using the following research, write a ${format} about "${topic}".\n\nResearch:\n${research.content}\n\nWrite a compelling, well-structured ${format} that incorporates the research findings. Use a professional but engaging tone.`,
  }, ctx);

  md.push(content.content || 'No content generated.');

  if (research.groundingMetadata) {
    md.push('\n\n*Sources grounded via Google Search*');
  }

  return { success: true, data: { research: research.content, content: content.content }, displayMarkdown: md.join('\n') };
};

// Context cache for long documents
const geminiContextCache: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/google-cache', {
    action: input.action || 'create',
    content: input.content, cacheId: input.cacheId, ttl: input.ttl,
  }, ctx);
  return { success: true, data, displayMarkdown: `## Context Cache\n\nAction: ${input.action || 'create'}\n${data.cacheId ? `Cache ID: \`${data.cacheId}\`` : ''}\n${data.tokenCount ? `Tokens: ${data.tokenCount.toLocaleString()}` : ''}` };
};

export const manifest: KitManifest = {
  id: 'gemini-intelligence',
  name: 'Gemini Intelligence',
  version: '4.0.0',
  description: 'Google Gemini — text generation, vision, image/video generation, image editing, mockups, structured output, embeddings, code execution, search grounding, summarization, context caching, and Google Places/Geocoding.',
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
    {
      name: 'gemini_image_gen',
      description: 'Generate images using Google Imagen. Provide a text prompt to create an image.',
      input_schema: {
        type: 'object',
        properties: { prompt: { type: 'string' }, aspectRatio: { type: 'string', description: '1:1, 16:9, 9:16, 4:3, 3:4' } },
        required: ['prompt'],
      },
    },
    {
      name: 'gemini_vision',
      description: 'Analyze an image using Gemini vision capabilities.',
      input_schema: {
        type: 'object',
        properties: { imageUrl: { type: 'string' }, imageBase64: { type: 'string' }, prompt: { type: 'string', description: 'What to analyze (default: describe)' } },
      },
    },
    {
      name: 'gemini_structured',
      description: 'Get structured JSON output from Gemini using a response schema.',
      input_schema: {
        type: 'object',
        properties: { prompt: { type: 'string' }, schema: { type: 'object', description: 'JSON Schema for response format' }, model: { type: 'string' } },
        required: ['prompt', 'schema'],
      },
    },
    {
      name: 'gemini_embeddings',
      description: 'Generate text embeddings with Gemini (text-embedding-004).',
      input_schema: {
        type: 'object',
        properties: { text: { type: 'string' }, model: { type: 'string' } },
        required: ['text'],
      },
    },
    {
      name: 'gemini_video_gen',
      description: 'Generate video using Google Veo. Text-to-video, or extend/remix existing video.',
      input_schema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Video description prompt' },
          aspectRatio: { type: 'string', description: '16:9 or 9:16' },
          duration: { type: 'number', description: 'Duration in seconds (5-60)' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'gemini_image_edit',
      description: 'Edit an image using Imagen. Inpaint, outpaint, or style transfer.',
      input_schema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Edit instructions' },
          imageBase64: { type: 'string', description: 'Base64-encoded source image' },
          editMode: { type: 'string', description: 'inpaint | outpaint | style-transfer' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'gemini_mockup',
      description: 'Generate a product mockup using Imagen. Commercial-quality lifestyle photography.',
      input_schema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Product description for mockup' },
          aspectRatio: { type: 'string', description: '4:3, 16:9, 1:1' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'gemini_context_cache',
      description: 'Create or retrieve a Gemini context cache for long documents. Reduces cost for repeated queries on the same content.',
      input_schema: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'create | get | delete' },
          content: { type: 'string', description: 'Document content to cache (for create)' },
          cacheId: { type: 'string', description: 'Cache ID (for get/delete)' },
          ttl: { type: 'number', description: 'Cache TTL in seconds (default: 3600)' },
        },
      },
    },
    {
      name: 'gemini_analyze_document',
      description: 'Analyze a document with Gemini. Upload text content and ask questions about it. Supports up to 500k characters.',
      input_schema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'Document text content' },
          question: { type: 'string', description: 'Question to answer about the document (default: comprehensive analysis)' },
        },
        required: ['content'],
      },
    },
    {
      name: 'gemini_dual_compare',
      description: 'Compare responses from Gemini and Claude on the same prompt. Returns both answers side-by-side for different perspectives.',
      input_schema: {
        type: 'object',
        properties: { prompt: { type: 'string', description: 'Question or prompt to send to both models' } },
        required: ['prompt'],
      },
    },
    {
      name: 'gemini_research_and_write',
      description: 'Research a topic with Google Search grounding, then generate a written piece (article, report, brief, etc.).',
      input_schema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic to research and write about' },
          format: { type: 'string', description: 'Output format: article, report, brief, email, pitch (default: article)' },
        },
        required: ['topic'],
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
  gemini_image_gen: geminiImageGen,
  gemini_vision: geminiVision,
  gemini_structured: geminiStructured,
  gemini_embeddings: geminiEmbeddings,
  gemini_video_gen: geminiVideoGen,
  gemini_image_edit: geminiImageEdit,
  gemini_mockup: geminiMockup,
  gemini_context_cache: geminiContextCache,
  gemini_analyze_document: geminiAnalyzeDocument,
  gemini_dual_compare: dualModelCompare,
  gemini_research_and_write: geminiResearchAndWrite,
};
