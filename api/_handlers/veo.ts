import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, VideoGenerationReferenceType } from '@google/genai';

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
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });

  const ai = new GoogleGenAI({ apiKey: GOOGLE_AI_KEY });
  const { action } = req.body;

  try {
    switch (action) {
      case 'generate': {
        const { prompt, model, mode, aspectRatio, resolution, startFrame, endFrame,
                referenceImages, styleImage, inputVideoObject, isLooping } = req.body;

        const config: any = { numberOfVideos: 1, resolution: resolution || '720p' };
        if (mode !== 'extend-video') config.aspectRatio = aspectRatio || '16:9';

        const payload: any = { model: model || 'veo-3.1-fast-generate-preview', config };
        if (prompt) payload.prompt = prompt;

        if (mode === 'frames-to-video') {
          if (startFrame) payload.image = { imageBytes: startFrame.base64, mimeType: startFrame.mimeType };
          const finalEnd = isLooping ? startFrame : endFrame;
          if (finalEnd) payload.config.lastFrame = { imageBytes: finalEnd.base64, mimeType: finalEnd.mimeType };
        } else if (mode === 'references-to-video') {
          const refs: any[] = [];
          if (referenceImages) {
            for (const img of referenceImages) {
              refs.push({
                image: { imageBytes: img.base64, mimeType: img.mimeType },
                referenceType: img.referenceType === 'STYLE' ? VideoGenerationReferenceType.STYLE : VideoGenerationReferenceType.ASSET,
              });
            }
          }
          if (styleImage) {
            refs.push({ image: { imageBytes: styleImage.base64, mimeType: styleImage.mimeType }, referenceType: VideoGenerationReferenceType.STYLE });
          }
          if (refs.length) payload.config.referenceImages = refs;
        } else if (mode === 'extend-video') {
          if (!inputVideoObject) return res.status(400).json({ error: 'inputVideoObject required for extend mode' });
          payload.video = inputVideoObject;
        }

        let operation = await ai.models.generateVideos(payload);
        while (!operation.done) {
          await new Promise(r => setTimeout(r, 10000));
          operation = await ai.operations.getVideosOperation({ operation });
        }

        if (!operation?.response) return res.status(500).json({ error: 'Video generation failed.' });
        const videos = operation.response.generatedVideos;
        if (!videos?.length) return res.status(500).json({ error: 'No videos generated.' });

        const first = videos[0];
        if (!first?.video?.uri) return res.status(500).json({ error: 'Missing video URI.' });

        return res.json({ uri: first.video.uri, video: first.video });
      }

      case 'poll': {
        const { operationName } = req.body;
        const op = await ai.operations.getVideosOperation({ operation: { name: operationName } as any });
        return res.json({ done: op.done, response: op.response });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (e: any) {
    console.error('Veo API error:', e);
    return res.status(500).json({ error: e.message || 'Veo generation failed' });
  }
}
