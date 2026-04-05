import { requireAuth } from "./_auth";
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || '';
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY || process.env.VITE_GOOGLE_MAPS_KEY || '';

const GENERATIVE_LANGUAGE_BASE = 'https://generativelanguage.googleapis.com/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;

  try {
    switch (action) {
      // ========================================================================
      // GEMINI PRO: Text generation, analysis, reasoning
      // ========================================================================
      case 'gemini-generate': {
        if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
        const { prompt, systemInstruction, model: modelName } = req.body;
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
        const model = genAI.getGenerativeModel({
          model: modelName || 'gemini-1.5-pro',
          systemInstruction: systemInstruction || undefined,
        });
        const result = await model.generateContent(prompt);
        return res.json({ content: result.response.text() });
      }

      // ========================================================================
      // GEMINI PRO: Long-context document analysis
      // ========================================================================
      case 'gemini-analyze': {
        if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
        const { documents, question } = req.body;
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

        const docContext = documents.map((d: { title: string; content: string }, i: number) =>
          `--- Document ${i + 1}: ${d.title} ---\n${d.content}`
        ).join('\n\n');

        const result = await model.generateContent(
          `You are an expert analyst for EdgeIQ Holdings. Analyze the following documents and answer the question.\n\n${docContext}\n\nQuestion: ${question}`
        );
        return res.json({ content: result.response.text() });
      }

      // ========================================================================
      // GEMINI: Summarize / extract from text
      // ========================================================================
      case 'gemini-summarize': {
        if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
        const { text, instructions } = req.body;
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(
          `${instructions || 'Summarize the following text concisely:'}\n\n${text}`
        );
        return res.json({ content: result.response.text() });
      }

      // ========================================================================
      // GEMINI VISION: Image analysis
      // ========================================================================
      case 'gemini-vision': {
        if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
        const { imageBase64, mimeType, prompt: visionPrompt } = req.body;
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const result = await model.generateContent([
          { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } },
          visionPrompt || 'Describe this image in detail.',
        ]);
        return res.json({ content: result.response.text() });
      }

      // ========================================================================
      // GEMINI: Structured data extraction
      // ========================================================================
      case 'gemini-extract': {
        if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
        const { text: extractText, schema } = req.body;
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const result = await model.generateContent(
          `Extract structured data from the following text. Return valid JSON matching this schema: ${JSON.stringify(schema)}\n\nText:\n${extractText}`
        );
        const raw = result.response.text();
        try {
          const jsonMatch = raw.match(/```json\n?([\s\S]*?)\n?```/) || raw.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : raw);
          return res.json({ data: parsed });
        } catch {
          return res.json({ data: null, raw });
        }
      }

      // ========================================================================
      // IMAGEN 3: Generate image from text prompt
      // ========================================================================
      case 'imagen-generate': {
        if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
        const { prompt: imgPrompt, aspectRatio } = req.body;
        const imagenUrl = `${GENERATIVE_LANGUAGE_BASE}/models/imagen-3.0-generate-002:predict?key=${GOOGLE_AI_KEY}`;
        const imagenRes = await fetch(imagenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: imgPrompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: aspectRatio || '1:1',
            },
          }),
        });
        if (!imagenRes.ok) {
          const errBody = await imagenRes.text();
          return res.status(imagenRes.status).json({ error: `Imagen API error: ${errBody}` });
        }
        const imagenData = await imagenRes.json();
        const predictions = imagenData.predictions || [];
        if (predictions.length === 0) {
          return res.status(500).json({ error: 'Imagen returned no predictions' });
        }
        return res.json({ image: predictions[0].bytesBase64Encoded });
      }

      // ========================================================================
      // IMAGEN 3: Edit image with prompt
      // ========================================================================
      case 'imagen-edit': {
        if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
        const { prompt: editPrompt, imageBase64: editImage, aspectRatio: editAspect } = req.body;
        if (!editImage) return res.status(400).json({ error: 'imageBase64 is required for imagen-edit' });
        const editUrl = `${GENERATIVE_LANGUAGE_BASE}/models/imagen-3.0-generate-002:predict?key=${GOOGLE_AI_KEY}`;
        const editRes = await fetch(editUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{
              prompt: editPrompt,
              image: { bytesBase64Encoded: editImage },
            }],
            parameters: {
              sampleCount: 1,
              aspectRatio: editAspect || '1:1',
            },
          }),
        });
        if (!editRes.ok) {
          const errBody = await editRes.text();
          return res.status(editRes.status).json({ error: `Imagen edit API error: ${errBody}` });
        }
        const editData = await editRes.json();
        const editPredictions = editData.predictions || [];
        if (editPredictions.length === 0) {
          return res.status(500).json({ error: 'Imagen edit returned no predictions' });
        }
        return res.json({ image: editPredictions[0].bytesBase64Encoded });
      }

      // ========================================================================
      // VEO 2: Generate video from text prompt
      // ========================================================================
      case 'veo-generate': {
        if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
        const { prompt: veoPrompt, duration } = req.body;
        const veoUrl = `${GENERATIVE_LANGUAGE_BASE}/models/veo-002:predict?key=${GOOGLE_AI_KEY}`;
        const veoRes = await fetch(veoUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: veoPrompt }],
            parameters: {
              durationSeconds: duration || 4,
            },
          }),
        });
        if (!veoRes.ok) {
          const errBody = await veoRes.text();
          return res.status(veoRes.status).json({ error: `Veo API error: ${errBody}` });
        }
        const veoData = await veoRes.json();
        const veoPredictions = veoData.predictions || [];
        if (veoPredictions.length === 0) {
          return res.status(500).json({ error: 'Veo returned no predictions' });
        }
        return res.json({
          video: veoPredictions[0].bytesBase64Encoded,
          mimeType: 'video/mp4',
        });
      }

      // ========================================================================
      // AUDIO: Generate audio/music via Gemini with audio modality
      // ========================================================================
      case 'audio-generate': {
        if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
        const { prompt: audioPrompt } = req.body;
        // Use the REST API to request audio generation via Gemini 2.0 Flash
        // with response_modalities including AUDIO
        const audioUrl = `${GENERATIVE_LANGUAGE_BASE}/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_KEY}`;
        const audioRes = await fetch(audioUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: audioPrompt }],
            }],
            generationConfig: {
              response_modalities: ['AUDIO'],
              speech_config: {
                voice_config: {
                  prebuilt_voice_config: {
                    voice_name: 'Kore',
                  },
                },
              },
            },
          }),
        });
        if (!audioRes.ok) {
          const errBody = await audioRes.text();
          return res.status(audioRes.status).json({ error: `Audio generation API error: ${errBody}` });
        }
        const audioData = await audioRes.json();
        const audioParts = audioData.candidates?.[0]?.content?.parts || [];
        const audioInline = audioParts.find((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData);
        if (!audioInline) {
          return res.status(500).json({ error: 'No audio data returned from Gemini' });
        }
        return res.json({
          audio: audioInline.inlineData.data,
          mimeType: audioInline.inlineData.mimeType,
        });
      }

      // ========================================================================
      // CODE GENERATION: Generate code with Gemini 2.5 Pro
      // ========================================================================
      case 'code-generate': {
        if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
        const { prompt: codePrompt, language: codeLang } = req.body;
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-pro',
          systemInstruction: 'You are an expert programmer. Generate clean, production-ready code. Return ONLY the code without any markdown formatting, backticks, or language identifiers. Do not include explanations unless specifically asked.',
        });
        const fullPrompt = codeLang
          ? `Generate ${codeLang} code for the following:\n\n${codePrompt}`
          : codePrompt;
        const result = await model.generateContent(fullPrompt);
        const codeOutput = result.response.text();
        // Strip markdown code fences if the model includes them despite instructions
        const cleaned = codeOutput.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
        return res.json({
          code: cleaned,
          language: codeLang || 'plaintext',
        });
      }

      // ========================================================================
      // EMBEDDING: Generate text embeddings
      // ========================================================================
      case 'embed': {
        if (!GOOGLE_AI_KEY) return res.status(500).json({ error: 'GOOGLE_AI_KEY not configured' });
        const { text: embedText } = req.body;
        if (!embedText) return res.status(400).json({ error: 'text is required for embed' });
        const embedUrl = `${GENERATIVE_LANGUAGE_BASE}/models/text-embedding-004:embedContent?key=${GOOGLE_AI_KEY}`;
        const embedRes = await fetch(embedUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: {
              parts: [{ text: embedText }],
            },
          }),
        });
        if (!embedRes.ok) {
          const errBody = await embedRes.text();
          return res.status(embedRes.status).json({ error: `Embedding API error: ${errBody}` });
        }
        const embedData = await embedRes.json();
        return res.json({ embedding: embedData.embedding?.values || [] });
      }

      // ========================================================================
      // GOOGLE MAPS: Geocoding
      // ========================================================================
      case 'maps-geocode': {
        if (!GOOGLE_MAPS_KEY) return res.status(500).json({ error: 'GOOGLE_MAPS_KEY not configured' });
        const { address } = req.body;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`;
        const geoRes = await fetch(url);
        const geoData = await geoRes.json();
        return res.json({ results: geoData.results || [], status: geoData.status });
      }

      // ========================================================================
      // GOOGLE PLACES: Nearby search
      // ========================================================================
      case 'places-nearby': {
        if (!GOOGLE_MAPS_KEY) return res.status(500).json({ error: 'GOOGLE_MAPS_KEY not configured' });
        const { lat, lng, radius, type: placeType, keyword } = req.body;
        let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius || 1000}&key=${GOOGLE_MAPS_KEY}`;
        if (placeType) url += `&type=${placeType}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
        const placesRes = await fetch(url);
        const placesData = await placesRes.json();
        return res.json({
          places: (placesData.results || []).map((p: Record<string, unknown>) => ({
            name: p.name,
            address: p.vicinity,
            rating: p.rating,
            types: p.types,
            location: (p.geometry as Record<string, unknown>)?.location,
            placeId: p.place_id,
          })),
        });
      }

      // ========================================================================
      // GOOGLE PLACES: Place details
      // ========================================================================
      case 'places-details': {
        if (!GOOGLE_MAPS_KEY) return res.status(500).json({ error: 'GOOGLE_MAPS_KEY not configured' });
        const { placeId } = req.body;
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,reviews,opening_hours,photos,geometry,types,price_level&key=${GOOGLE_MAPS_KEY}`;
        const detRes = await fetch(url);
        const detData = await detRes.json();
        return res.json({ place: detData.result || null });
      }

      // ========================================================================
      // GOOGLE PLACES: Text search
      // ========================================================================
      case 'places-search': {
        if (!GOOGLE_MAPS_KEY) return res.status(500).json({ error: 'GOOGLE_MAPS_KEY not configured' });
        const { query: searchQuery, location } = req.body;
        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_KEY}`;
        if (location) url += `&location=${location.lat},${location.lng}&radius=50000`;
        const searchRes = await fetch(url);
        const searchData = await searchRes.json();
        return res.json({
          places: (searchData.results || []).map((p: Record<string, unknown>) => ({
            name: p.name,
            address: p.formatted_address,
            rating: p.rating,
            location: (p.geometry as Record<string, unknown>)?.location,
            placeId: p.place_id,
          })),
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
