/**
 * Extended Imagen Client — Image generation, editing, infographics, and mockups.
 * Extends existing gemini_image_gen kit capabilities with patterns from
 * infogenius, augmented-image, and product-mockup-visualization apps.
 */
import { GoogleGenAI, Modality } from '@google/genai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImagenStyle =
  | 'minimalist' | 'photorealistic' | 'cartoon' | 'vintage'
  | 'cyberpunk' | 'isometric-3d' | 'sketch' | 'infographic';

export type ComplexityLevel = 'elementary' | 'intermediate' | 'advanced' | 'expert';

export interface InfographicParams {
  topic: string;
  style?: ImagenStyle;
  language?: string;
  complexity?: ComplexityLevel;
}

export interface InfographicResult {
  imageBase64: string;
  research: string;
  facts: string[];
  sources: string[];
}

export interface ImageEditParams {
  imageBase64: string;
  editPrompt: string;
  mimeType?: string;
}

export interface MockupParams {
  productImageBase64?: string;
  productMimeType?: string;
  logoImages?: Array<{ base64: string; mimeType: string; x: number; y: number; scale: number }>;
  backgroundPrompt: string;
}

export interface AugmentedRegion {
  id: string;
  label: string;
  description: string;
  bounds: { x: number; y: number; width: number; height: number };
  sourceUrl?: string;
}

export interface AugmentedImageResult {
  imageBase64: string;
  regions: AugmentedRegion[];
}

// ---------------------------------------------------------------------------
// Infographic Generation (two-stage: research → image)
// ---------------------------------------------------------------------------

export async function generateInfographic(
  apiKey: string,
  params: InfographicParams,
): Promise<InfographicResult> {
  const ai = new GoogleGenAI({ apiKey });
  const lang = params.language || 'English';
  const complexity = params.complexity || 'intermediate';
  const style = params.style || 'infographic';

  // Stage 1: Research with search grounding
  const researchPrompt = `Research the topic "${params.topic}" for creating an infographic.
Audience complexity level: ${complexity}.
Language: ${lang}.

Return your response in this exact format:
FACTS:
- fact 1
- fact 2
- fact 3
(at least 5 key facts)

IMAGE_PROMPT:
(A detailed prompt for generating a ${style}-style infographic about this topic. Include specific visual elements, layout suggestions, color palette, and data visualizations. The infographic should be in ${lang}.)`;

  const researchResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: researchPrompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const researchText = researchResponse.text || '';

  // Parse facts and image prompt
  const factsMatch = researchText.match(/FACTS:\s*([\s\S]*?)(?=IMAGE_PROMPT:|$)/);
  const promptMatch = researchText.match(/IMAGE_PROMPT:\s*([\s\S]*?)$/);

  const facts = factsMatch
    ? factsMatch[1].split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim().slice(2))
    : [];
  const imagePrompt = promptMatch?.[1]?.trim() || `Create a ${style} infographic about ${params.topic} in ${lang}`;

  // Extract sources from grounding metadata
  const sources: string[] = [];
  const meta = (researchResponse as any).candidates?.[0]?.groundingMetadata;
  if (meta?.groundingChunks) {
    for (const chunk of meta.groundingChunks) {
      if (chunk.web?.uri) sources.push(chunk.web.uri);
    }
  }

  // Stage 2: Image generation
  const imageResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: imagePrompt,
    config: { responseModalities: [Modality.IMAGE] },
  });

  let imageBase64 = '';
  const parts = imageResponse.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      imageBase64 = part.inlineData.data;
      break;
    }
  }

  return { imageBase64, research: researchText, facts, sources };
}

// ---------------------------------------------------------------------------
// Image Editing
// ---------------------------------------------------------------------------

export async function editImage(
  apiKey: string,
  params: ImageEditParams,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const mime = params.mimeType || 'image/png';

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [
      { text: params.editPrompt },
      { inlineData: { mimeType: mime, data: params.imageBase64 } },
    ],
    config: { responseModalities: [Modality.IMAGE] },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) return part.inlineData.data;
  }
  throw new Error('Image editing produced no output.');
}

// ---------------------------------------------------------------------------
// Product Mockup Compositing
// ---------------------------------------------------------------------------

export async function generateMockup(
  apiKey: string,
  params: MockupParams,
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // Build layout hints from logo positions
  let layoutHint = '';
  if (params.logoImages?.length) {
    layoutHint = params.logoImages.map((l, i) =>
      `Logo ${i + 1}: positioned at (${l.x}%, ${l.y}%) with scale ${l.scale}`,
    ).join('. ');
  }

  const prompt = `Generate a photorealistic product mockup. ${params.backgroundPrompt}. ${layoutHint}.
Ensure proper lighting, perspective, and shadows for a professional result.`;

  const contents: any[] = [{ text: prompt }];
  if (params.productImageBase64) {
    contents.push({ inlineData: { mimeType: params.productMimeType || 'image/png', data: params.productImageBase64 } });
  }
  if (params.logoImages) {
    for (const logo of params.logoImages) {
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
    if (part.inlineData?.data) return part.inlineData.data;
  }
  throw new Error('Mockup generation produced no output.');
}

// ---------------------------------------------------------------------------
// Augmented Image (generate + annotate regions)
// ---------------------------------------------------------------------------

export async function generateAugmentedImage(
  apiKey: string,
  prompt: string,
  style?: ImagenStyle,
): Promise<AugmentedImageResult> {
  const ai = new GoogleGenAI({ apiKey });

  // Stage 1: Generate the image
  const imagePrompt = `Create a detailed ${style || 'photorealistic'} image: ${prompt}.
Use sparse text and rich visuals. Aspect ratio 16:9.`;

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
  if (!imageBase64) throw new Error('Image generation failed.');

  // Stage 2: Analyze regions with search grounding
  const analyzePrompt = `Analyze this image and identify 3-6 key regions of interest.
For each region, provide:
- A short label
- A 1-2 sentence description with factual information
- Approximate bounds as percentages (x, y, width, height from 0-100)

Return as JSON array: [{ "label": "...", "description": "...", "bounds": { "x": 10, "y": 20, "width": 30, "height": 25 } }]`;

  const analysisResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { text: analyzePrompt },
      { inlineData: { mimeType: 'image/png', data: imageBase64 } },
    ],
    config: { tools: [{ googleSearch: {} }] },
  });

  let regions: AugmentedRegion[] = [];
  try {
    const text = analysisResponse.text || '';
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    regions = parsed.map((r: any, i: number) => ({
      id: `region-${i}`,
      label: r.label,
      description: r.description,
      bounds: r.bounds,
      sourceUrl: r.sourceUrl,
    }));
  } catch {
    // If parsing fails, return empty regions
  }

  return { imageBase64, regions };
}

// ---------------------------------------------------------------------------
// Utility: strip data URI prefix
// ---------------------------------------------------------------------------

export function stripBase64Prefix(dataUri: string): string {
  const idx = dataUri.indexOf(',');
  return idx >= 0 ? dataUri.slice(idx + 1) : dataUri;
}
