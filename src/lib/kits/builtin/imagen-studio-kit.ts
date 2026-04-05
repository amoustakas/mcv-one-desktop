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

const imagenInfographic: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/imagen-edit', {
    action: 'infographic',
    topic: input.topic,
    style: input.style,
    language: input.language,
    complexity: input.complexity,
  }, ctx);

  const hasImage = !!data.imageBase64;
  const sourceList = (data.sources || []).slice(0, 5).map((s: string) => `- ${s}`).join('\n');

  return {
    success: true,
    data,
    displayMarkdown: `## Infographic: ${input.topic}\n\n${hasImage ? '*Image generated successfully.*' : '*No image generated.*'}\n\n${sourceList ? `**Sources:**\n${sourceList}` : ''}`,
  };
};

const imagenEdit: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/imagen-edit', {
    action: 'edit',
    imageBase64: input.imageBase64,
    editPrompt: input.editPrompt,
    mimeType: input.mimeType,
  }, ctx);

  return {
    success: true,
    data,
    displayMarkdown: `## Image Edited\n\n*Edit: "${(input.editPrompt as string).slice(0, 80)}"*\n\nImage updated successfully.`,
  };
};

const imagenMockup: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/imagen-edit', {
    action: 'mockup',
    productImageBase64: input.productImageBase64,
    productMimeType: input.productMimeType,
    logoImages: input.logoImages,
    backgroundPrompt: input.backgroundPrompt,
  }, ctx);

  return {
    success: true,
    data,
    displayMarkdown: `## Product Mockup Generated\n\n*${(input.backgroundPrompt as string).slice(0, 100)}*\n\nComposite image ready.`,
  };
};

const imagenAugmented: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/imagen-edit', {
    action: 'augmented',
    prompt: input.prompt,
    style: input.style,
  }, ctx);

  const regionCount = (data.regions || []).length;
  return {
    success: true,
    data,
    displayMarkdown: `## Augmented Image\n\n*"${(input.prompt as string).slice(0, 80)}"*\n\nGenerated with **${regionCount} interactive regions**.`,
  };
};

export const manifest: KitManifest = {
  id: 'imagen-studio',
  name: 'Imagen Studio',
  version: '1.0.0',
  description: 'Advanced image generation — search-grounded infographics, image editing, product mockup compositing, and augmented images with interactive annotation regions.',
  author: 'MCV',
  capabilities: ['network', 'llm'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use imagen_generate_infographic for research-backed visual infographics. Use imagen_edit to modify existing images with text instructions. Use imagen_product_mockup for photorealistic product composites. Use imagen_augmented_generate for images with interactive annotated regions.',
  tools: [
    {
      name: 'imagen_generate_infographic',
      description: 'Generate a search-grounded infographic. Researches the topic with Google Search, then generates a visual infographic image.',
      input_schema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic to research and visualize' },
          style: { type: 'string', enum: ['minimalist', 'photorealistic', 'cartoon', 'vintage', 'cyberpunk', 'isometric-3d', 'sketch', 'infographic'], description: 'Visual style' },
          language: { type: 'string', description: 'Language for the infographic (default: English)' },
          complexity: { type: 'string', enum: ['elementary', 'intermediate', 'advanced', 'expert'], description: 'Target audience level' },
        },
        required: ['topic'],
      },
    },
    {
      name: 'imagen_edit',
      description: 'Edit an existing image using a text instruction. Pass the image as base64.',
      input_schema: {
        type: 'object',
        properties: {
          imageBase64: { type: 'string', description: 'Base64-encoded image to edit' },
          editPrompt: { type: 'string', description: 'Edit instruction (e.g. "make the sky purple")' },
          mimeType: { type: 'string', description: 'Image MIME type (default: image/png)' },
        },
        required: ['imageBase64', 'editPrompt'],
      },
    },
    {
      name: 'imagen_product_mockup',
      description: 'Generate a photorealistic product mockup composite with logos positioned on a product.',
      input_schema: {
        type: 'object',
        properties: {
          backgroundPrompt: { type: 'string', description: 'Description of the product scene' },
          productImageBase64: { type: 'string', description: 'Base64 product image (optional)' },
          logoImages: { type: 'array', description: 'Array of logo objects with base64, mimeType, x, y, scale' },
        },
        required: ['backgroundPrompt'],
      },
    },
    {
      name: 'imagen_augmented_generate',
      description: 'Generate an image with interactive annotation regions. Each region has a label, description, and bounds.',
      input_schema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Image generation prompt' },
          style: { type: 'string', description: 'Visual style (e.g. photorealistic, cartoon, cyberpunk)' },
        },
        required: ['prompt'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  imagen_generate_infographic: imagenInfographic,
  imagen_edit: imagenEdit,
  imagen_product_mockup: imagenMockup,
  imagen_augmented_generate: imagenAugmented,
};
