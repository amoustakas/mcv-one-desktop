import { requireAuth } from './_middleware';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Google AI Generate — structured output, code execution, search retrieval
// ---------------------------------------------------------------------------

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  if (!GOOGLE_AI_KEY) {
    return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
  }

  const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
  const { action } = req.body;

  try {
    switch (action) {
      // Structured output — force JSON response matching a schema
      case 'generate-structured': {
        const { prompt, model: modelName, systemInstruction, responseSchema } = req.body;
        if (!prompt) return res.status(400).json({ error: 'prompt required' });

        const model = genAI.getGenerativeModel({
          model: modelName || 'gemini-1.5-pro',
          systemInstruction: systemInstruction || undefined,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema || undefined,
          },
        });

        const result = await model.generateContent(prompt);
        const response = result.response;

        return res.json({
          content: response.text(),
          usageMetadata: response.usageMetadata,
        });
      }

      // Code execution — Gemini runs Python in its cloud sandbox
      case 'generate-with-code-execution': {
        const { prompt, model: modelName, systemInstruction } = req.body;
        if (!prompt) return res.status(400).json({ error: 'prompt required' });

        const model = genAI.getGenerativeModel({
          model: modelName || 'gemini-1.5-pro',
          systemInstruction: systemInstruction || undefined,
          tools: [{ codeExecution: {} }],
        });

        const result = await model.generateContent(prompt);
        const response = result.response;

        // Extract code execution results from the response parts
        const parts = response.candidates?.[0]?.content?.parts || [];
        const codeResults = parts
          .filter((p: Record<string, unknown>) => p.executableCode || p.codeExecutionResult)
          .map((p: Record<string, unknown>) => ({
            code: (p.executableCode as Record<string, unknown>)?.code,
            language: (p.executableCode as Record<string, unknown>)?.language,
            outcome: (p.codeExecutionResult as Record<string, unknown>)?.outcome,
            output: (p.codeExecutionResult as Record<string, unknown>)?.output,
          }));

        return res.json({
          content: response.text(),
          codeResults,
          usageMetadata: response.usageMetadata,
        });
      }

      // Search grounding — Gemini queries live web data
      case 'generate-with-search': {
        const { prompt, model: modelName, systemInstruction } = req.body;
        if (!prompt) return res.status(400).json({ error: 'prompt required' });

        const model = genAI.getGenerativeModel({
          model: modelName || 'gemini-1.5-pro',
          systemInstruction: systemInstruction || undefined,
          tools: [{ googleSearchRetrieval: {} }],
        });

        const result = await model.generateContent(prompt);
        const response = result.response;

        // Extract grounding metadata if available
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

        return res.json({
          content: response.text(),
          groundingMetadata,
          usageMetadata: response.usageMetadata,
        });
      }

      // Cached content generation — use existing cached context
      case 'generate-cached': {
        const { prompt, cacheName, model: modelName } = req.body;
        if (!prompt || !cacheName) return res.status(400).json({ error: 'prompt and cacheName required' });

        const model = genAI.getGenerativeModelFromCachedContent({
          model: modelName || 'gemini-1.5-pro',
          cachedContent: cacheName,
        } as never); // SDK types may not match exactly

        const result = await model.generateContent(prompt);
        const response = result.response;

        return res.json({
          content: response.text(),
          usageMetadata: response.usageMetadata,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[google-generate]', message);
    return res.status(500).json({ error: message });
  }
}
