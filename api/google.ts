import { GoogleGenerativeAI } from '@google/generative-ai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GOOGLE_AI_KEY = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY || '';
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY || process.env.VITE_GOOGLE_MAPS_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;

  try {
    switch (action) {
      // --- GEMINI PRO: Text generation, analysis, reasoning ---
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

      // --- GEMINI PRO: Long-context document analysis ---
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

      // --- GEMINI: Summarize / extract from text ---
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

      // --- GEMINI VISION: Image analysis ---
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

      // --- GEMINI: Structured data extraction ---
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

      // --- GOOGLE MAPS: Geocoding ---
      case 'maps-geocode': {
        if (!GOOGLE_MAPS_KEY) return res.status(500).json({ error: 'GOOGLE_MAPS_KEY not configured' });
        const { address } = req.body;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`;
        const geoRes = await fetch(url);
        const geoData = await geoRes.json();
        return res.json({ results: geoData.results || [], status: geoData.status });
      }

      // --- GOOGLE PLACES: Nearby search ---
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

      // --- GOOGLE PLACES: Place details ---
      case 'places-details': {
        if (!GOOGLE_MAPS_KEY) return res.status(500).json({ error: 'GOOGLE_MAPS_KEY not configured' });
        const { placeId } = req.body;
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,reviews,opening_hours,photos,geometry,types,price_level&key=${GOOGLE_MAPS_KEY}`;
        const detRes = await fetch(url);
        const detData = await detRes.json();
        return res.json({ place: detData.result || null });
      }

      // --- GOOGLE PLACES: Text search ---
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
