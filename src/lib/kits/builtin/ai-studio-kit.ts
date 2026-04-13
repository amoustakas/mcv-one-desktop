import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// AI Studio Kit
// Exposes AI Studio capabilities as agent tools: multi-model generation,
// code analysis, document understanding, and intelligent routing.
// ---------------------------------------------------------------------------

async function postApi(url: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `API error: ${res.status}`);
  }
  return res.json();
}

// Smart model router — picks the best model for the task
const smartGenerate: KitToolHandler = async (input, ctx) => {
  const prompt = input.prompt as string;
  const intent = (input.intent as string) || 'auto';
  if (!prompt) return { success: false, error: 'prompt required' };

  // Auto-detect best model and config
  let model = 'gemini-2.5-flash';
  let action = 'gemini-generate';
  let extraConfig: Record<string, unknown> = {};

  const promptLower = prompt.toLowerCase();

  if (intent === 'code' || promptLower.includes('write code') || promptLower.includes('function') || promptLower.includes('implement')) {
    model = 'gemini-2.5-pro';
    action = 'gemini-generate';
    extraConfig = { systemInstruction: 'You are an expert software engineer. Write clean, production-quality code with proper error handling and types.' };
  } else if (intent === 'research' || promptLower.includes('research') || promptLower.includes('latest') || promptLower.includes('current')) {
    action = 'generate-with-search';
    extraConfig = {};
  } else if (intent === 'math' || promptLower.includes('calculate') || promptLower.includes('solve') || promptLower.includes('compute')) {
    action = 'generate-with-code-execution';
    extraConfig = {};
  } else if (intent === 'analysis' || prompt.length > 10000) {
    model = 'gemini-2.5-pro';
  }

  const apiUrl = action.startsWith('generate-with') ? '/api/google-generate' : '/api/google';
  const data = await postApi(apiUrl, { action, prompt, model, ...extraConfig }, ctx);

  let md = data.content || '';
  if (data.codeResults?.length) {
    md += '\n\n**Code Execution:**\n';
    for (const cr of data.codeResults) {
      if (cr.code) md += `\`\`\`${cr.language || 'python'}\n${cr.code}\n\`\`\`\n`;
      if (cr.output) md += `Output: ${cr.output}\n`;
    }
  }
  if (data.groundingMetadata) md += '\n\n*Grounded with Google Search*';

  return {
    success: true,
    data: { content: md, model, action },
    displayMarkdown: `## AI Response (${model})\n\n${md}`,
  };
};

// Multi-model consensus — ask multiple models, synthesize
const multiModelConsensus: KitToolHandler = async (input, ctx) => {
  const prompt = input.prompt as string;
  if (!prompt) return { success: false, error: 'prompt required' };

  const md: string[] = [`## Multi-Model Consensus\n`, `*"${prompt.slice(0, 80)}"*\n`];

  // Query 3 models in parallel
  const [flashRes, proRes, claudeRes] = await Promise.allSettled([
    postApi('/api/google', { action: 'gemini-generate', prompt, model: 'gemini-2.5-flash' }, ctx),
    postApi('/api/google', { action: 'gemini-generate', prompt, model: 'gemini-2.5-pro' }, ctx),
    postApi('/api/chat', { messages: [{ role: 'user', content: prompt }] }, ctx),
  ]);

  const responses: { model: string; content: string }[] = [];

  if (flashRes.status === 'fulfilled') responses.push({ model: 'Gemini Flash', content: flashRes.value.content || '' });
  if (proRes.status === 'fulfilled') responses.push({ model: 'Gemini Pro', content: proRes.value.content || '' });
  if (claudeRes.status === 'fulfilled') {
    const cContent = claudeRes.value.content?.[0]?.text || claudeRes.value.reply || '';
    if (cContent) responses.push({ model: 'Claude', content: cContent });
  }

  for (const r of responses) {
    md.push(`### ${r.model}\n${r.content.slice(0, 500)}\n`);
  }

  // Synthesize consensus with Gemini
  if (responses.length >= 2) {
    const synthesisPrompt = `Three AI models answered: "${prompt.slice(0, 200)}"\n\n${responses.map(r => `${r.model}: ${r.content.slice(0, 300)}`).join('\n\n')}\n\nSynthesize the consensus: where do they agree? Where do they differ? What's the best answer combining all perspectives? Be concise.`;
    try {
      const synthesis = await postApi('/api/google', { action: 'gemini-generate', prompt: synthesisPrompt }, ctx);
      md.push('### Consensus Synthesis\n' + (synthesis.content || ''));
    } catch { /* ignore */ }
  }

  return { success: true, data: { responses }, displayMarkdown: md.join('\n') };
};

// Analyze code — deep code review with Gemini Pro
const analyzeCode: KitToolHandler = async (input, ctx) => {
  const code = input.code as string;
  const language = (input.language as string) || 'auto-detect';
  const focus = (input.focus as string) || 'comprehensive';
  if (!code) return { success: false, error: 'code required' };

  const focusInstructions: Record<string, string> = {
    comprehensive: 'Provide a comprehensive code review covering: correctness, performance, security, readability, and best practices.',
    security: 'Focus on security vulnerabilities: injection, XSS, auth issues, data exposure, insecure dependencies.',
    performance: 'Focus on performance: time complexity, memory usage, unnecessary allocations, optimization opportunities.',
    architecture: 'Focus on architecture: design patterns, separation of concerns, scalability, maintainability.',
  };

  const data = await postApi('/api/google', {
    action: 'gemini-generate',
    model: 'gemini-2.5-pro',
    prompt: `You are a senior code reviewer. ${focusInstructions[focus] || focusInstructions.comprehensive}

Language: ${language}

\`\`\`${language}
${code.slice(0, 50000)}
\`\`\`

Provide:
1. Overall assessment (1-2 sentences)
2. Issues found (severity: critical/high/medium/low)
3. Specific suggestions with code fixes
4. What's done well`,
  }, ctx);

  return {
    success: true,
    data: { review: data.content },
    displayMarkdown: `## Code Review (${focus})\n\n${data.content || 'Review failed.'}`,
  };
};

// Explain code — educational breakdown
const explainCode: KitToolHandler = async (input, ctx) => {
  const code = input.code as string;
  const level = (input.level as string) || 'intermediate';
  if (!code) return { success: false, error: 'code required' };

  const data = await postApi('/api/google', {
    action: 'gemini-generate',
    prompt: `Explain this code at a ${level} level. Break down what it does, why it's written this way, and what each key section accomplishes.

\`\`\`
${code.slice(0, 30000)}
\`\`\`

Be educational. Use analogies where helpful. Highlight any patterns or techniques worth learning.`,
  }, ctx);

  return {
    success: true,
    data: { explanation: data.content },
    displayMarkdown: `## Code Explanation (${level})\n\n${data.content || 'Explanation failed.'}`,
  };
};

export const manifest: KitManifest = {
  id: 'ai-studio',
  name: 'AI Studio',
  version: '1.0.0',
  description: 'Intelligent AI generation: smart routing, multi-model consensus, code review, code explanation. Automatically picks the best model and approach for each task.',
  author: 'MCV',
  capabilities: ['network', 'llm'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: `Use ai_smart_generate for any AI generation — it auto-detects the best model and approach. Use multi_model_consensus for important decisions where you want multiple AI perspectives. Use code_review for thorough code analysis, and code_explain for educational breakdowns.`,
  tools: [
    { name: 'ai_smart_generate', description: 'Smart AI generation — auto-routes to the best model and approach (code execution, search grounding, or generation).', input_schema: { type: 'object', properties: { prompt: { type: 'string' }, intent: { type: 'string', description: 'auto | code | research | math | analysis' } }, required: ['prompt'] } },
    { name: 'ai_multi_consensus', description: 'Ask Gemini Flash, Gemini Pro, and Claude the same question. Returns individual answers + synthesized consensus.', input_schema: { type: 'object', properties: { prompt: { type: 'string' } }, required: ['prompt'] } },
    { name: 'ai_code_review', description: 'Deep code review with Gemini Pro. Covers security, performance, architecture.', input_schema: { type: 'object', properties: { code: { type: 'string' }, language: { type: 'string' }, focus: { type: 'string', description: 'comprehensive | security | performance | architecture' } }, required: ['code'] } },
    { name: 'ai_code_explain', description: 'Educational code explanation at any level (beginner, intermediate, expert).', input_schema: { type: 'object', properties: { code: { type: 'string' }, level: { type: 'string', description: 'beginner | intermediate | expert' } }, required: ['code'] } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  ai_smart_generate: smartGenerate,
  ai_multi_consensus: multiModelConsensus,
  ai_code_review: analyzeCode,
  ai_code_explain: explainCode,
};
