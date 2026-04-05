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

const creativeRepoDiagram: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/creative', {
    action: 'repo-diagram',
    repoUrl: input.repoUrl,
    style: input.style,
  }, ctx);

  const nodeCount = data.nodes?.length || 0;
  const edgeCount = data.edges?.length || 0;

  return {
    success: true,
    data,
    displayMarkdown: `## Repository Diagram\n\n**${data.title || 'Architecture'}** — ${nodeCount} nodes, ${edgeCount} connections.\n\n*Open Engineering view to see the interactive D3 visualization.*`,
  };
};

const creativeUrlInfographic: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/creative', {
    action: 'url-to-infographic',
    url: input.url,
    style: input.style,
    language: input.language,
  }, ctx);

  return {
    success: true,
    data,
    displayMarkdown: `## URL → Infographic\n\nConverted **${input.url}** into a visual infographic.\n\n${data.imageBase64 ? '*Image generated.*' : '*Generation failed.*'}`,
  };
};

const creativePhotoToSprite: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/creative', {
    action: 'photo-to-sprite',
    photoBase64: input.photoBase64,
    style: input.style,
  }, ctx);

  return {
    success: true,
    data,
    displayMarkdown: `## Sprite Generated\n\n*${input.style || '8-bit'} pixel art sprite created from photo.*\n\n${data.spriteBase64 ? 'Sprite ready for game use.' : 'Generation failed.'}`,
  };
};

const creativeComicPage: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/creative', {
    action: 'comic-page',
    prompt: input.prompt,
    genre: input.genre,
    pageNumber: input.pageNumber,
    previousBeats: input.previousBeats,
    characterPersonas: input.characterPersonas,
  }, ctx);

  const beat = data.beat || {};
  return {
    success: true,
    data,
    displayMarkdown: `## Comic Page ${input.pageNumber || 1}\n\n**Caption:** ${beat.caption || ''}\n\n**Dialogue:** ${beat.dialogue || ''}\n\n${data.imageBase64 ? '*Panel image generated.*' : '*Image generation failed.*'}${beat.isDecisionPage ? `\n\n**Choices:**\n${(beat.choices || []).map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}` : ''}`,
  };
};

const creativeTypographyVideo: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/creative', {
    action: 'typography-video',
    text: input.text,
    stylePreset: input.stylePreset,
  }, ctx);

  return {
    success: true,
    data,
    displayMarkdown: `## Typography Video\n\n*"${input.text}"* — ${input.stylePreset || 'cinematic-3d'} style.\n\n${data.uri ? 'Video generated successfully.' : 'Generation failed.'}`,
  };
};

export const manifest: KitManifest = {
  id: 'creative-tools',
  name: 'Creative Tools',
  version: '1.0.0',
  description: 'Creative AI tools — repo architecture diagrams, URL-to-infographic, photo-to-sprite, AI comic generation, and typography video animation.',
  author: 'MCV',
  capabilities: ['network', 'llm'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use creative_repo_to_diagram to visualize any GitHub repository as an architecture diagram. Use creative_url_to_infographic to convert a web page into a visual infographic. Use creative_photo_to_sprite to convert a photo into an 8-bit game sprite. Use creative_generate_comic to create AI comic book pages with narrative and branching choices. Use creative_typography_video to create animated text videos.',
  tools: [
    {
      name: 'creative_repo_to_diagram',
      description: 'Analyze a GitHub repository and generate an interactive architecture diagram.',
      input_schema: {
        type: 'object',
        properties: {
          repoUrl: { type: 'string', description: 'GitHub repository URL (e.g. https://github.com/owner/repo)' },
          style: { type: 'string', enum: ['flow', 'architecture', 'sequence', 'erd', 'mindmap'], description: 'Diagram style' },
        },
        required: ['repoUrl'],
      },
    },
    {
      name: 'creative_url_to_infographic',
      description: 'Convert a web URL into a visual infographic summarizing its content.',
      input_schema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to convert' },
          style: { type: 'string', description: 'Visual style (e.g. modern, vintage, cyberpunk)' },
          language: { type: 'string', description: 'Language (default: English)' },
        },
        required: ['url'],
      },
    },
    {
      name: 'creative_photo_to_sprite',
      description: 'Convert a photo into a pixel art game sprite.',
      input_schema: {
        type: 'object',
        properties: {
          photoBase64: { type: 'string', description: 'Base64-encoded photo' },
          style: { type: 'string', enum: ['8-bit', 'pixel-art', '16-bit'], description: 'Pixel art style' },
        },
        required: ['photoBase64'],
      },
    },
    {
      name: 'creative_generate_comic',
      description: 'Generate an AI comic book page with narrative, dialogue, and illustration.',
      input_schema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Story prompt or continuation' },
          genre: { type: 'string', enum: ['superhero', 'horror', 'comedy', 'teen-drama', 'sci-fi', 'fantasy', 'slice-of-life'], description: 'Comic genre' },
          pageNumber: { type: 'number', description: 'Page number in sequence' },
          previousBeats: { type: 'array', description: 'Previous story beats for continuity' },
          characterPersonas: { type: 'array', description: 'Character definitions' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'creative_typography_video',
      description: 'Create an animated typography video using Veo. Text appears through cinematic visual effects.',
      input_schema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Text to animate' },
          stylePreset: { type: 'string', enum: ['cinematic-3d', 'neon-cyber', 'elegant-serif', 'bold-sans', 'handwritten', 'retro-80s', 'liquid-metal', 'botanical'], description: 'Animation style preset' },
        },
        required: ['text'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  creative_repo_to_diagram: creativeRepoDiagram,
  creative_url_to_infographic: creativeUrlInfographic,
  creative_photo_to_sprite: creativePhotoToSprite,
  creative_generate_comic: creativeComicPage,
  creative_typography_video: creativeTypographyVideo,
};
