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
      // Repo → architecture diagram (text description for D3 rendering)
      case 'repo-diagram': {
        const { repoUrl, style } = req.body;
        if (!repoUrl) return res.status(400).json({ error: 'repoUrl required' });

        // Fetch repo tree from GitHub API
        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) return res.status(400).json({ error: 'Invalid GitHub URL' });
        const [, owner, repo] = match;

        const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, {
          headers: { 'Accept': 'application/vnd.github.v3+json' },
        });
        if (!treeRes.ok) return res.status(400).json({ error: `GitHub API error: ${treeRes.status}` });
        const tree = await treeRes.json();
        const files = (tree.tree || []).filter((f: any) => f.type === 'blob').map((f: any) => f.path).slice(0, 500);

        const diagramStyle = style || 'flow';
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: `Analyze this repository file structure and create a ${diagramStyle} diagram description.

Repository: ${owner}/${repo}
Files (${files.length}):
${files.join('\n')}

Return JSON with this structure:
{
  "title": "Repo Architecture",
  "nodes": [{ "id": "...", "label": "...", "type": "module|service|config|data", "group": "..." }],
  "edges": [{ "source": "...", "target": "...", "label": "..." }],
  "groups": [{ "id": "...", "label": "...", "color": "..." }]
}`,
          config: { responseMimeType: 'application/json' },
        });

        const text = (response.text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        try { return res.json(JSON.parse(text)); }
        catch { return res.json({ raw: text }); }
      }

      // URL → infographic
      case 'url-to-infographic': {
        const { url, style: infStyle, language } = req.body;
        if (!url) return res.status(400).json({ error: 'url required' });

        const lang = language || 'English';
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: `Fetch and analyze the content at ${url}. Create a detailed image generation prompt for a ${infStyle || 'modern'} infographic summarizing the key points. Language: ${lang}.
Return: IMAGE_PROMPT:\n(the prompt)`,
          config: { tools: [{ googleSearch: {} }] },
        });

        const text = response.text || '';
        const match2 = text.match(/IMAGE_PROMPT:\s*([\s\S]*?)$/);
        const imagePrompt = match2?.[1]?.trim() || `Infographic about content from ${url} in ${lang}`;

        const imgResponse = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: imagePrompt,
          config: { responseModalities: [Modality.IMAGE] },
        });

        let imageBase64 = '';
        for (const part of (imgResponse.candidates?.[0]?.content?.parts || [])) {
          if (part.inlineData?.data) { imageBase64 = part.inlineData.data; break; }
        }
        return res.json({ imageBase64, research: text });
      }

      // Photo → 8-bit sprite
      case 'photo-to-sprite': {
        const { photoBase64, style: spriteStyle } = req.body;
        if (!photoBase64) return res.status(400).json({ error: 'photoBase64 required' });

        const pixelStyle = spriteStyle || '8-bit';
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: [
            { text: `Convert this photo into a ${pixelStyle} pixel art arcade sprite. Use a pure white background. The sprite should be a 64x64 pixel character suitable for a retro game. Bright colors, clean pixel edges, front-facing pose.` },
            { inlineData: { mimeType: 'image/png', data: photoBase64 } },
          ],
          config: { responseModalities: [Modality.IMAGE] },
        });

        for (const part of (response.candidates?.[0]?.content?.parts || [])) {
          if (part.inlineData?.data) return res.json({ spriteBase64: part.inlineData.data });
        }
        return res.status(500).json({ error: 'Sprite generation failed' });
      }

      // Comic page generation
      case 'comic-page': {
        const { prompt, genre, pageNumber, previousBeats, characterPersonas } = req.body;
        if (!prompt) return res.status(400).json({ error: 'prompt required' });

        const genreContext = genre ? `Genre: ${genre}.` : '';
        const prevContext = previousBeats?.length ? `Previous story beats: ${JSON.stringify(previousBeats)}` : '';
        const charContext = characterPersonas?.length ? `Characters: ${JSON.stringify(characterPersonas)}` : '';

        // Generate narrative beat
        const beatResponse = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: `Create comic page ${pageNumber || 1} for: "${prompt}". ${genreContext} ${prevContext} ${charContext}
Return JSON: { "caption": "...", "dialogue": "...", "sceneDescription": "...", "isDecisionPage": false, "choices": [] }`,
          config: { responseMimeType: 'application/json' },
        });

        let beat: any = {};
        try { beat = JSON.parse((beatResponse.text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()); }
        catch { beat = { caption: prompt, dialogue: '', sceneDescription: prompt }; }

        // Generate page image
        const imgResponse = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: `Create a comic book panel illustration. Scene: ${beat.sceneDescription || prompt}. Style: Bold lines, vivid colors, dynamic composition. Aspect ratio 2:3.`,
          config: { responseModalities: [Modality.IMAGE] },
        });

        let imageBase64 = '';
        for (const part of (imgResponse.candidates?.[0]?.content?.parts || [])) {
          if (part.inlineData?.data) { imageBase64 = part.inlineData.data; break; }
        }

        return res.json({ beat, imageBase64 });
      }

      // Typography video (via Veo)
      case 'typography-video': {
        const { text, stylePreset } = req.body;
        if (!text) return res.status(400).json({ error: 'text required' });

        const styleMap: Record<string, string> = {
          'cinematic-3d': 'Cinematic 3D metallic text emerging from clouds with dramatic lighting',
          'neon-cyber': 'Neon glowing text in a cyberpunk cityscape with rain reflections',
          'elegant-serif': 'Elegant gold serif text appearing with particle effects on dark background',
          'bold-sans': 'Bold sans-serif text with kinetic typography animation, white on black',
          'handwritten': 'Handwritten text being drawn by an invisible pen on parchment paper',
          'retro-80s': 'Retro 80s chrome text with grid lines and sunset gradient background',
          'liquid-metal': 'Liquid mercury text forming and solidifying with metallic reflections',
          'botanical': 'Text made of growing flowers and vines on a garden background',
        };

        const styleDesc = styleMap[stylePreset || 'cinematic-3d'] || styleMap['cinematic-3d'];
        const veoPrompt = `${styleDesc}. The text reads: "${text}". 5 seconds, smooth camera movement, high quality.`;

        let operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: veoPrompt,
          config: { numberOfVideos: 1, aspectRatio: '16:9', resolution: '720p' },
        });

        while (!operation.done) {
          await new Promise(r => setTimeout(r, 10000));
          operation = await ai.operations.getVideosOperation({ operation });
        }

        if (!operation?.response?.generatedVideos?.length) return res.status(500).json({ error: 'Video generation failed' });
        const video = operation.response.generatedVideos[0];
        return res.json({ uri: video?.video?.uri, video: video?.video });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (e: any) {
    console.error('Creative API error:', e);
    return res.status(500).json({ error: e.message || 'Creative operation failed' });
  }
}
