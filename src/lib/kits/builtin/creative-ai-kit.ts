import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// Creative AI Kit
// Gives NAOS the ability to generate visual content: infographics,
// product mockups, sprite art, comic pages, architecture diagrams,
// and typography videos. All powered by Gemini + Imagen + Veo.
// ---------------------------------------------------------------------------

async function creativeApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch('/api/creative', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Creative API error: ${res.status}`);
  }
  return res.json();
}

async function googleApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch('/api/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Google API error: ${res.status}`);
  }
  return res.json();
}

const generateInfographic: KitToolHandler = async (input, ctx) => {
  const url = input.url as string | undefined;
  const topic = input.topic as string | undefined;
  const style = (input.style as string) || 'modern';

  if (url) {
    const data = await creativeApi('url-to-infographic', { url, style }, ctx);
    return {
      success: true, data,
      displayMarkdown: `## Infographic Generated\n\n*Source: ${url}*\n*Style: ${style}*\n\n${data.imageBase64 ? `Image generated (${(data.imageBase64.length / 1024).toFixed(0)}KB base64)` : 'Generation complete.'}\n\n**Research:**\n${(data.research || '').slice(0, 500)}`,
    };
  }

  if (topic) {
    const data = await googleApi('imagen-generate', { prompt: `Professional ${style} infographic about: ${topic}. Clean layout, data visualization, key statistics highlighted, modern design.`, aspectRatio: '9:16' }, ctx);
    return {
      success: true, data,
      displayMarkdown: `## Infographic: ${topic}\n\n*Style: ${style}*\n\n${data.images?.length ? `${data.images.length} image(s) generated.` : 'Generated.'}`,
    };
  }

  return { success: false, error: 'Provide either url or topic' };
};

const generateDiagram: KitToolHandler = async (input, ctx) => {
  const repoUrl = input.repoUrl as string;
  const style = (input.style as string) || 'flow';
  if (!repoUrl) return { success: false, error: 'repoUrl required' };

  const data = await creativeApi('repo-diagram', { repoUrl, style }, ctx);
  const nodeCount = data.nodes?.length || 0;
  const edgeCount = data.edges?.length || 0;

  return {
    success: true, data,
    displayMarkdown: `## Architecture Diagram\n\n*Repo: ${repoUrl}*\n*Style: ${style}*\n\n**${nodeCount} nodes**, **${edgeCount} edges**, **${data.groups?.length || 0} groups**\n\nDiagram data ready for D3 rendering in the Creative Canvas.`,
  };
};

const generateSprite: KitToolHandler = async (input, ctx) => {
  const photoBase64 = input.photoBase64 as string;
  const style = (input.style as string) || '8-bit';
  if (!photoBase64) return { success: false, error: 'photoBase64 required' };

  const data = await creativeApi('photo-to-sprite', { photoBase64, style }, ctx);
  return {
    success: true, data,
    displayMarkdown: `## Sprite Generated\n\n*Style: ${style}*\n\n${data.spriteBase64 ? 'Pixel art sprite created successfully.' : 'Generation complete.'}`,
  };
};

const generateComicPage: KitToolHandler = async (input, ctx) => {
  const prompt = input.prompt as string;
  const genre = input.genre as string | undefined;
  const pageNumber = (input.pageNumber as number) || 1;
  if (!prompt) return { success: false, error: 'prompt required' };

  const data = await creativeApi('comic-page', { prompt, genre, pageNumber }, ctx);
  const beat = data.beat || {};

  return {
    success: true, data,
    displayMarkdown: `## Comic Page ${pageNumber}\n\n**Caption:** ${beat.caption || ''}\n**Dialogue:** ${beat.dialogue || ''}\n**Scene:** ${beat.sceneDescription || ''}\n\n${data.imageBase64 ? 'Page illustration generated.' : 'Text-only page generated.'}`,
  };
};

const generateTypographyVideo: KitToolHandler = async (input, ctx) => {
  const text = input.text as string;
  const style = (input.style as string) || 'cinematic-3d';
  if (!text) return { success: false, error: 'text required' };

  const data = await creativeApi('typography-video', { text, stylePreset: style }, ctx);

  return {
    success: true, data,
    displayMarkdown: `## Typography Video\n\n*Text: "${text}"*\n*Style: ${style}*\n\n${data.uri ? `Video generated: ${data.uri}` : 'Video generation submitted. Check Video Studio for progress.'}`,
  };
};

const generateProductMockup: KitToolHandler = async (input, ctx) => {
  const product = input.product as string;
  const scene = (input.scene as string) || 'lifestyle';
  if (!product) return { success: false, error: 'product description required' };

  const data = await googleApi('imagen-generate', {
    prompt: `Professional ${scene} product photography mockup: ${product}. Clean composition, studio lighting, commercial quality, white/neutral background with subtle shadows.`,
    aspectRatio: input.aspectRatio || '4:3',
  }, ctx);

  return {
    success: true, data,
    displayMarkdown: `## Product Mockup\n\n*Product: ${product}*\n*Scene: ${scene}*\n\n${data.images?.length ? `${data.images.length} mockup(s) generated.` : 'Mockup generated.'}`,
  };
};

const generateBrandAsset: KitToolHandler = async (input, ctx) => {
  const brand = input.brand as string;
  const assetType = (input.type as string) || 'logo';
  if (!brand) return { success: false, error: 'brand name required' };

  const prompts: Record<string, string> = {
    logo: `Minimalist, modern logo design for "${brand}". Clean vector style, scalable, professional. Single icon + wordmark. Background: transparent/white.`,
    banner: `Professional social media banner for "${brand}". Modern design, brand colors, clean typography. 1200x400 aspect ratio.`,
    icon: `App icon for "${brand}". Rounded square, bold simple symbol, gradient background, flat design. 512x512.`,
    'social-post': `Engaging social media post template for "${brand}". Modern layout, eye-catching, with space for text overlay.`,
  };

  const data = await googleApi('imagen-generate', {
    prompt: prompts[assetType] || prompts.logo,
    aspectRatio: assetType === 'banner' ? '16:9' : '1:1',
  }, ctx);

  return {
    success: true, data,
    displayMarkdown: `## Brand Asset: ${assetType}\n\n*Brand: ${brand}*\n\n${data.images?.length ? `${data.images.length} ${assetType}(s) generated.` : 'Asset generated.'}`,
  };
};

const creativeResearch: KitToolHandler = async (input, ctx) => {
  const topic = input.topic as string;
  const outputType = (input.output as string) || 'moodboard-description';
  if (!topic) return { success: false, error: 'topic required' };

  const data = await googleApi('gemini-generate', {
    prompt: `You are a creative director. Research "${topic}" and create a ${outputType}. Include:
1. Visual mood references (describe 5 reference images)
2. Color palette (6 colors with hex codes)
3. Typography recommendations (2 heading fonts, 1 body font)
4. Layout principles
5. Key visual metaphors

Be specific and actionable. A designer should be able to execute from this brief.`,
  }, ctx);

  return {
    success: true, data: { brief: data.content },
    displayMarkdown: `## Creative Brief: ${topic}\n\n${data.content || 'Brief generation failed.'}`,
  };
};

export const manifest: KitManifest = {
  id: 'creative-ai',
  name: 'Creative AI Studio',
  version: '1.0.0',
  description: 'AI-powered creative content generation: infographics, diagrams, sprites, comics, typography videos, product mockups, brand assets, and creative research briefs.',
  author: 'MCV',
  capabilities: ['network', 'llm'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: `Use creative tools for visual content generation. For infographics, provide a URL to analyze or a topic. For diagrams, provide a GitHub repo URL. For product mockups, describe the product. For brand assets, provide the brand name and asset type. For typography videos, provide the text and style preset.

Available typography styles: cinematic-3d, neon-cyber, elegant-serif, bold-sans, handwritten, retro-80s, liquid-metal, botanical.
Available brand asset types: logo, banner, icon, social-post.`,
  tools: [
    { name: 'creative_infographic', description: 'Generate an infographic from a URL or topic.', input_schema: { type: 'object', properties: { url: { type: 'string', description: 'URL to analyze and visualize' }, topic: { type: 'string', description: 'Topic for infographic (if no URL)' }, style: { type: 'string', description: 'Visual style (modern, minimal, data-heavy, illustrated)' } } } },
    { name: 'creative_diagram', description: 'Generate architecture diagram from a GitHub repo.', input_schema: { type: 'object', properties: { repoUrl: { type: 'string', description: 'GitHub repository URL' }, style: { type: 'string', description: 'Diagram style: flow, dependency, layers' } }, required: ['repoUrl'] } },
    { name: 'creative_sprite', description: 'Convert a photo into pixel art sprite.', input_schema: { type: 'object', properties: { photoBase64: { type: 'string', description: 'Base64 photo' }, style: { type: 'string', description: '8-bit, 16-bit, isometric' } }, required: ['photoBase64'] } },
    { name: 'creative_comic', description: 'Generate a comic book page with narrative and illustration.', input_schema: { type: 'object', properties: { prompt: { type: 'string', description: 'Story prompt' }, genre: { type: 'string' }, pageNumber: { type: 'number' } }, required: ['prompt'] } },
    { name: 'creative_typography_video', description: 'Generate a typography animation video via Veo.', input_schema: { type: 'object', properties: { text: { type: 'string', description: 'Text to animate' }, style: { type: 'string', description: 'cinematic-3d | neon-cyber | elegant-serif | bold-sans | handwritten | retro-80s | liquid-metal | botanical' } }, required: ['text'] } },
    { name: 'creative_product_mockup', description: 'Generate professional product mockup photography.', input_schema: { type: 'object', properties: { product: { type: 'string', description: 'Product description' }, scene: { type: 'string', description: 'lifestyle | studio | outdoor | minimal' }, aspectRatio: { type: 'string' } }, required: ['product'] } },
    { name: 'creative_brand_asset', description: 'Generate brand assets (logo, banner, icon, social post).', input_schema: { type: 'object', properties: { brand: { type: 'string', description: 'Brand name' }, type: { type: 'string', description: 'logo | banner | icon | social-post' } }, required: ['brand'] } },
    { name: 'creative_research', description: 'Generate a creative brief with mood references, color palette, typography, and layout principles.', input_schema: { type: 'object', properties: { topic: { type: 'string', description: 'Creative topic or project' }, output: { type: 'string', description: 'moodboard-description | brand-guide | campaign-brief' } }, required: ['topic'] } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  creative_infographic: generateInfographic,
  creative_diagram: generateDiagram,
  creative_sprite: generateSprite,
  creative_comic: generateComicPage,
  creative_typography_video: generateTypographyVideo,
  creative_product_mockup: generateProductMockup,
  creative_brand_asset: generateBrandAsset,
  creative_research: creativeResearch,
};
