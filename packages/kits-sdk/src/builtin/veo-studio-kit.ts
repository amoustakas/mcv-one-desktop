import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function postJson(url: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

const veoGenerateVideo: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/veo', {
    action: 'generate',
    prompt: input.prompt,
    model: input.model || 'veo-3.1-fast-generate-preview',
    mode: input.mode || 'text-to-video',
    aspectRatio: input.aspectRatio || '16:9',
    resolution: input.resolution || '720p',
    startFrame: input.startFrame,
    endFrame: input.endFrame,
    referenceImages: input.referenceImages,
    styleImage: input.styleImage,
    inputVideoObject: input.inputVideoObject,
    isLooping: input.isLooping,
  }, ctx);
  return {
    success: true,
    data,
    displayMarkdown: `## Video Generated\n\nPrompt: *"${(input.prompt as string || '').slice(0, 100)}"*\n\nVideo URI: \`${data.uri}\``,
  };
};

const veoCheckStatus: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/veo', { action: 'poll', operationName: input.operationName }, ctx);
  return {
    success: true,
    data,
    displayMarkdown: data.done ? '**Video generation complete.**' : '**Video still generating...**',
  };
};

export const manifest: KitManifest = {
  id: 'veo-studio',
  name: 'Veo Video Studio',
  version: '1.0.0',
  description: 'Google Veo video generation — text-to-video, frames-to-video, references-to-video, extend-video. Supports 720p/1080p/4K, 16:9 and 9:16.',
  author: 'MCV',
  capabilities: ['network', 'llm'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use veo_generate_video to create AI-generated videos. Supports modes: text-to-video (default), frames-to-video (with start/end frame images), references-to-video (with asset/style reference images), extend-video (extend an existing video). Use veo-3.1-fast-generate-preview for quick results or veo-3.1-generate-preview for higher quality.',
  tools: [
    {
      name: 'veo_generate_video',
      description: 'Generate a video using Google Veo. Provide a text prompt and optional configuration.',
      input_schema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Text prompt describing the video to generate' },
          mode: { type: 'string', enum: ['text-to-video', 'frames-to-video', 'references-to-video', 'extend-video'], description: 'Generation mode (default: text-to-video)' },
          model: { type: 'string', enum: ['veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview'], description: 'Veo model (default: fast)' },
          aspectRatio: { type: 'string', enum: ['16:9', '9:16'], description: 'Aspect ratio (default: 16:9)' },
          resolution: { type: 'string', enum: ['720p', '1080p', '4k'], description: 'Resolution (default: 720p)' },
          isLooping: { type: 'boolean', description: 'Create a looping video (frames-to-video mode)' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'veo_check_status',
      description: 'Check the status of a Veo video generation operation.',
      input_schema: {
        type: 'object',
        properties: { operationName: { type: 'string', description: 'The operation name to check' } },
        required: ['operationName'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  veo_generate_video: veoGenerateVideo,
  veo_check_status: veoCheckStatus,
};
