import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// Video AI Kit
// Agent-driven video production using Google Veo.
// NAOS can generate videos, create scripts, produce typography animations,
// and manage a video gallery — all via natural language.
// ---------------------------------------------------------------------------

async function googleApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch('/api/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `API error: ${res.status}`);
  }
  return res.json();
}

const generateVideo: KitToolHandler = async (input, ctx) => {
  const prompt = input.prompt as string;
  const aspectRatio = (input.aspectRatio as string) || '16:9';
  const duration = input.duration as number | undefined;
  if (!prompt) return { success: false, error: 'prompt required' };

  const data = await googleApi('veo-generate', { prompt, aspectRatio, duration }, ctx);

  return {
    success: true, data,
    displayMarkdown: `## Video Generation\n\n*Prompt: "${prompt.slice(0, 100)}"*\n*Aspect: ${aspectRatio}*\n\n${data.videoUrl ? `Video ready: ${data.videoUrl}` : `Status: ${data.status || 'submitted'}. Check Video Studio for progress.`}`,
  };
};

const scriptToVideo: KitToolHandler = async (input, ctx) => {
  const concept = input.concept as string;
  const style = (input.style as string) || 'cinematic';
  if (!concept) return { success: false, error: 'concept required' };

  // Step 1: Generate detailed video script with Gemini
  const scriptRes = await googleApi('gemini-generate', {
    prompt: `You are a video director. Create a detailed Veo video generation prompt for this concept: "${concept}".

Style: ${style}

Your prompt should describe:
1. The exact visual scene (camera angle, lighting, movement)
2. Color grading and mood
3. Action/movement that happens
4. Duration suggestion (5-15 seconds)

Return ONLY the video prompt, no other text. Be vivid and specific — Veo works best with detailed visual descriptions.`,
  }, ctx);

  const videoPrompt = scriptRes.content || concept;

  // Step 2: Generate video with the crafted prompt
  const data = await googleApi('veo-generate', {
    prompt: videoPrompt,
    aspectRatio: input.aspectRatio || '16:9',
  }, ctx);

  return {
    success: true,
    data: { script: videoPrompt, video: data },
    displayMarkdown: `## Script → Video\n\n**Concept:** ${concept}\n**Style:** ${style}\n\n**Generated Prompt:**\n${videoPrompt.slice(0, 300)}\n\n${data.videoUrl ? `Video ready: ${data.videoUrl}` : `Status: ${data.status || 'submitted'}`}`,
  };
};

const generateAdVideo: KitToolHandler = async (input, ctx) => {
  const product = input.product as string;
  const platform = (input.platform as string) || 'instagram';
  const duration = (input.duration as number) || 15;
  if (!product) return { success: false, error: 'product required' };

  const platformSpecs: Record<string, { aspect: string; style: string }> = {
    instagram: { aspect: '9:16', style: 'vertical, eye-catching, bold text overlays, fast-paced' },
    youtube: { aspect: '16:9', style: 'cinematic, professional, story-driven' },
    tiktok: { aspect: '9:16', style: 'trendy, quick cuts, dynamic, engaging from first frame' },
    linkedin: { aspect: '16:9', style: 'professional, clean, business-focused, subtle animations' },
  };

  const spec = platformSpecs[platform] || platformSpecs.instagram;

  // Generate ad script
  const scriptRes = await googleApi('gemini-generate', {
    prompt: `Create a ${duration}-second ${platform} ad video prompt for: "${product}".
Platform requirements: ${spec.style}
Aspect ratio: ${spec.aspect}

Write a detailed Veo prompt that creates a compelling ad. Include:
- Opening hook (first 2 seconds)
- Product showcase
- Call to action visual
Return ONLY the video prompt.`,
  }, ctx);

  const videoPrompt = scriptRes.content || `${product} advertisement, ${spec.style}`;

  const data = await googleApi('veo-generate', {
    prompt: videoPrompt,
    aspectRatio: spec.aspect,
    duration,
  }, ctx);

  return {
    success: true,
    data: { script: videoPrompt, video: data, platform },
    displayMarkdown: `## Ad Video: ${product}\n\n**Platform:** ${platform} (${spec.aspect})\n**Duration:** ${duration}s\n\n**Ad Script:**\n${videoPrompt.slice(0, 300)}\n\n${data.videoUrl ? `Video ready: ${data.videoUrl}` : `Status: ${data.status || 'submitted'}`}`,
  };
};

const generateThumbnail: KitToolHandler = async (input, ctx) => {
  const title = input.title as string;
  const style = (input.style as string) || 'youtube';
  if (!title) return { success: false, error: 'title required' };

  const styles: Record<string, string> = {
    youtube: 'Bold, high-contrast YouTube thumbnail. Large text, expressive face/reaction, bright colors, clean composition.',
    podcast: 'Clean podcast episode thumbnail. Minimalist, brand colors, episode title, microphone icon.',
    course: 'Educational course thumbnail. Professional, trustworthy, topic icon, gradient background.',
    social: 'Engaging social media thumbnail. Trending aesthetic, bold text, eye-catching colors.',
  };

  const data = await googleApi('imagen-generate', {
    prompt: `${styles[style] || styles.youtube} Title text: "${title}". High resolution, professional quality.`,
    aspectRatio: '16:9',
  }, ctx);

  return {
    success: true, data,
    displayMarkdown: `## Thumbnail: ${title}\n\n*Style: ${style}*\n\n${data.images?.length ? 'Thumbnail generated.' : 'Generation complete.'}`,
  };
};

export const manifest: KitManifest = {
  id: 'video-ai',
  name: 'Video AI Production',
  version: '1.0.0',
  description: 'AI video production: text-to-video, script-to-video, platform-specific ads, typography animations, and thumbnail generation.',
  author: 'MCV',
  capabilities: ['network', 'llm'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use video tools for generating video content. script_to_video first writes a detailed prompt via Gemini then generates via Veo. generate_ad_video creates platform-optimized ads. generate_thumbnail creates video/podcast thumbnails via Imagen.',
  tools: [
    { name: 'video_generate', description: 'Generate a video from a text prompt using Veo.', input_schema: { type: 'object', properties: { prompt: { type: 'string', description: 'Video description' }, aspectRatio: { type: 'string', description: '16:9 or 9:16' }, duration: { type: 'number', description: 'Seconds (5-60)' } }, required: ['prompt'] } },
    { name: 'video_script_to_video', description: 'Describe a concept → Gemini writes a detailed video script → Veo generates the video.', input_schema: { type: 'object', properties: { concept: { type: 'string', description: 'Video concept description' }, style: { type: 'string', description: 'cinematic | documentary | commercial | abstract | anime' }, aspectRatio: { type: 'string' } }, required: ['concept'] } },
    { name: 'video_generate_ad', description: 'Generate a platform-optimized ad video. Auto-configures aspect ratio and style for the platform.', input_schema: { type: 'object', properties: { product: { type: 'string', description: 'Product or service to advertise' }, platform: { type: 'string', description: 'instagram | youtube | tiktok | linkedin' }, duration: { type: 'number', description: 'Duration in seconds (default: 15)' } }, required: ['product'] } },
    { name: 'video_thumbnail', description: 'Generate a thumbnail image for video/podcast/course content.', input_schema: { type: 'object', properties: { title: { type: 'string', description: 'Title text for the thumbnail' }, style: { type: 'string', description: 'youtube | podcast | course | social' } }, required: ['title'] } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  video_generate: generateVideo,
  video_script_to_video: scriptToVideo,
  video_generate_ad: generateAdVideo,
  video_thumbnail: generateThumbnail,
};
