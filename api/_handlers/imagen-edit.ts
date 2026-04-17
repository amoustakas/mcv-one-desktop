import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';

import { requestLogger } from '../../src/lib/server/logger';
async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });

  const ai = new GoogleGenAI({ apiKey: GOOGLE_AI_KEY });
  const { action } = req.body;

  try {
    switch (action) {
      // Edit an existing image with a text instruction
      case 'edit': {
        const { imageBase64, editPrompt, mimeType } = req.body;
        if (!imageBase64 || !editPrompt) return res.status(400).json({ error: 'imageBase64 and editPrompt required' });

        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: [
            { text: editPrompt },
            { inlineData: { mimeType: mimeType || 'image/png', data: imageBase64 } },
          ],
          config: { responseModalities: [Modality.IMAGE] },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            return res.json({ imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType });
          }
        }
        return res.status(500).json({ error: 'No image output from edit' });
      }

      // Generate infographic (research + image)
      case 'infographic': {
        const { topic, style, language, complexity } = req.body;
        if (!topic) return res.status(400).json({ error: 'topic required' });

        const lang = language || 'English';
        const level = complexity || 'intermediate';
        const visualStyle = style || 'infographic';

        // Stage 1: Research with search grounding
        const researchResponse = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: `Research "${topic}" for a ${visualStyle} infographic. Audience: ${level}. Language: ${lang}.
Return: FACTS:\n- fact1\n- fact2\n...\nIMAGE_PROMPT:\n(detailed image generation prompt)`,
          config: { tools: [{ googleSearch: {} }] },
        });

        const researchText = researchResponse.text || '';
        const promptMatch = researchText.match(/IMAGE_PROMPT:\s*([\s\S]*?)$/);
        const imagePrompt = promptMatch?.[1]?.trim() || `${visualStyle} infographic about ${topic} in ${lang}`;

        // Extract sources
        const sources: string[] = [];
        const meta = (researchResponse as any).candidates?.[0]?.groundingMetadata;
        if (meta?.groundingChunks) {
          for (const chunk of meta.groundingChunks) {
            if (chunk.web?.uri) sources.push(chunk.web.uri);
          }
        }

        // Stage 2: Generate image
        const imgResponse = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: imagePrompt,
          config: { responseModalities: [Modality.IMAGE] },
        });

        let imageBase64 = '';
        const imgParts = imgResponse.candidates?.[0]?.content?.parts || [];
        for (const part of imgParts) {
          if (part.inlineData?.data) { imageBase64 = part.inlineData.data; break; }
        }

        return res.json({ imageBase64, research: researchText, sources });
      }

      // Product mockup compositing
      case 'mockup': {
        const { productImageBase64, productMimeType, logoImages, backgroundPrompt } = req.body;
        if (!backgroundPrompt) return res.status(400).json({ error: 'backgroundPrompt required' });

        let layoutHint = '';
        if (logoImages?.length) {
          layoutHint = logoImages.map((l: any, i: number) =>
            `Logo ${i + 1}: at (${l.x}%, ${l.y}%) scale ${l.scale}`,
          ).join('. ');
        }

        const prompt = `Generate a photorealistic product mockup. ${backgroundPrompt}. ${layoutHint}. Professional lighting and shadows.`;
        const contents: any[] = [{ text: prompt }];
        if (productImageBase64) contents.push({ inlineData: { mimeType: productMimeType || 'image/png', data: productImageBase64 } });
        if (logoImages) {
          for (const logo of logoImages) {
            contents.push({ inlineData: { mimeType: logo.mimeType, data: logo.base64 } });
          }
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents,
          config: { responseModalities: [Modality.IMAGE] },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) return res.json({ imageBase64: part.inlineData.data });
        }
        return res.status(500).json({ error: 'No mockup output' });
      }

      // Augmented image (generate + annotate regions)
      case 'augmented': {
        const { prompt, style: imgStyle } = req.body;
        if (!prompt) return res.status(400).json({ error: 'prompt required' });

        // Stage 1: Generate image
        const imgResponse = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: `Create a detailed ${imgStyle || 'photorealistic'} image: ${prompt}. Rich visuals, 16:9.`,
          config: { responseModalities: [Modality.IMAGE] },
        });

        let imageBase64 = '';
        for (const part of (imgResponse.candidates?.[0]?.content?.parts || [])) {
          if (part.inlineData?.data) { imageBase64 = part.inlineData.data; break; }
        }
        if (!imageBase64) return res.status(500).json({ error: 'Image generation failed' });

        // Stage 2: Analyze regions
        const analysisResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { text: `Analyze this image. Identify 3-6 key regions. For each: label, description, bounds (x,y,width,height as 0-100%). Return JSON array: [{"label":"...","description":"...","bounds":{"x":0,"y":0,"width":0,"height":0}}]` },
            { inlineData: { mimeType: 'image/png', data: imageBase64 } },
          ],
          config: { tools: [{ googleSearch: {} }] },
        });

        let regions: any[] = [];
        try {
          const text = (analysisResponse.text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          regions = JSON.parse(text);
        } catch { /* empty regions */ }

        return res.json({ imageBase64, regions });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (e: any) {
    console.error('Imagen API error:', e);
    return res.status(500).json({ error: e.message || 'Image operation failed' });
  }
}
