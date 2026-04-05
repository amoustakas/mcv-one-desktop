import type { KitManifest, KitToolHandler } from '../types';
import { filterFormats, getFormatById, getAllFormats } from '../../ad-specs/registry';
import { validateCreative, suggestFormatsForAsset, getGenerationParams } from '../../ad-specs/validation';
import type { AdPlatform, AdMediaType, CreativeAsset } from '../../ad-specs/types';

const listFormats: KitToolHandler = async (input, _ctx) => {
  const formats = await filterFormats({
    platform: input.platform as AdPlatform | undefined,
    mediaType: input.mediaType as AdMediaType | undefined,
    placement: input.placement as string | undefined,
    query: input.query as string | undefined,
  });
  if (formats.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No ad formats match your filters.' };
  }
  const lines = formats.map(f => {
    const dims = f.imageSpec?.dimensions?.[0] || f.videoSpec?.dimensions?.[0];
    const dimStr = dims ? ` (${dims.width}x${dims.height})` : '';
    return `- **${f.name}**${dimStr} — ${f.description}`;
  });
  return {
    success: true,
    data: formats,
    displayMarkdown: `## Ad Formats (${formats.length})\n\n${lines.join('\n')}`,
  };
};

const getSpec: KitToolHandler = async (input, _ctx) => {
  const formatId = input.formatId as string;
  const format = await getFormatById(formatId);
  if (!format) {
    return { success: false, error: `Format "${formatId}" not found.` };
  }
  let md = `## ${format.name}\n\n**Platform:** ${format.platform} | **Placement:** ${format.placement} | **Type:** ${format.mediaType}\n\n${format.description}\n`;

  if (format.imageSpec) {
    const dims = format.imageSpec.dimensions?.map(d => `${d.width}x${d.height}${d.label ? ` (${d.label})` : ''}`).join(', ') || 'Flexible';
    const ratios = format.imageSpec.aspectRatios?.map(a => a.ratio).join(', ') || 'Any';
    md += `\n### Image Specs\n- **Dimensions:** ${dims}\n- **Aspect Ratios:** ${ratios}\n- **Formats:** ${format.imageSpec.formats.join(', ')}\n- **Max Size:** ${format.imageSpec.maxFileSizeMb} MB\n`;
  }

  if (format.videoSpec) {
    const ratios = format.videoSpec.aspectRatios?.map(a => a.ratio).join(', ') || 'Any';
    md += `\n### Video Specs\n- **Aspect Ratios:** ${ratios}\n- **Duration:** ${format.videoSpec.minDurationSec || 0}s – ${format.videoSpec.maxDurationSec || '∞'}s${format.videoSpec.recommendedDurationSec ? ` (recommended: ${format.videoSpec.recommendedDurationSec}s)` : ''}\n- **Formats:** ${format.videoSpec.formats.join(', ')}\n- **Max Size:** ${format.videoSpec.maxFileSizeMb} MB\n`;
  }

  if (format.textSpecs.length > 0) {
    md += '\n### Text Limits\n';
    for (const ts of format.textSpecs) {
      md += `- **${ts.field}:** max ${ts.maxChars} chars${ts.recommended ? ` (recommended: ${ts.recommended})` : ''}${ts.notes ? ` — ${ts.notes}` : ''}\n`;
    }
  }

  if (format.callToAction && format.callToAction.length > 0) {
    md += `\n### CTAs\n${format.callToAction.join(', ')}\n`;
  }

  if (format.tips && format.tips.length > 0) {
    md += `\n### Tips\n${format.tips.map(t => `- ${t}`).join('\n')}\n`;
  }

  return { success: true, data: format, displayMarkdown: md };
};

const validateAsset: KitToolHandler = async (input, _ctx) => {
  const asset: CreativeAsset = {
    name: 'validation-check',
    mediaType: (input.mediaType as AdMediaType) || 'image',
    width: input.width as number | undefined,
    height: input.height as number | undefined,
    fileSizeMb: input.fileSizeMb as number | undefined,
    durationSec: input.duration as number | undefined,
    fileFormat: input.fileFormat as string | undefined,
    texts: (input.texts as Record<string, string>) || {},
  };

  const formatIds = input.formatIds as string[] | undefined;
  let formats;
  if (formatIds && formatIds.length > 0) {
    const all = await getAllFormats();
    formats = all.filter(f => formatIds.includes(f.id));
  } else {
    formats = await suggestFormatsForAsset(asset);
  }

  if (formats.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No compatible formats found for this asset.' };
  }

  const reports = formats.map(f => validateCreative(asset, f));
  const passing = reports.filter(r => r.passed).length;
  const failing = reports.filter(r => !r.passed).length;

  const lines = reports.map(r => {
    const icon = r.passed ? '✅' : r.errors > 0 ? '❌' : '⚠️';
    const issues = r.results.filter(res => !res.passed).map(res => `  - ${res.severity}: ${res.rule}: ${res.actual} (expected ${res.expected})`);
    return `${icon} **${r.format.name}** — ${r.errors} errors, ${r.warnings} warnings${issues.length ? '\n' + issues.join('\n') : ''}`;
  });

  return {
    success: true,
    data: reports,
    displayMarkdown: `## Compliance Check\n\n**${passing} passing**, **${failing} failing** (${formats.length} formats checked)\n\n${lines.join('\n\n')}`,
  };
};

const recommendFormats: KitToolHandler = async (input, _ctx) => {
  const asset: CreativeAsset = {
    name: 'recommendation',
    mediaType: (input.mediaType as AdMediaType) || 'image',
    width: input.width as number | undefined,
    height: input.height as number | undefined,
    texts: {},
  };

  const compatible = await suggestFormatsForAsset(asset);
  if (compatible.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No compatible ad formats found for these dimensions.' };
  }

  const lines = compatible.map(f => `- **${f.name}** (${f.platform}) — ${f.placement}`);
  return {
    success: true,
    data: compatible,
    displayMarkdown: `## Compatible Formats for ${asset.width}x${asset.height} ${asset.mediaType}\n\n${lines.join('\n')}`,
  };
};

const generateSpec: KitToolHandler = async (input, _ctx) => {
  const formatId = input.formatId as string;
  const format = await getFormatById(formatId);
  if (!format) {
    return { success: false, error: `Format "${formatId}" not found.` };
  }

  const params = getGenerationParams(format);
  let md = `## Generation Parameters: ${format.name}\n\n`;
  if (params.width && params.height) md += `- **Dimensions:** ${params.width}x${params.height}\n`;
  if (params.aspectRatio) md += `- **Aspect Ratio:** ${params.aspectRatio}\n`;
  if (params.maxDurationSec) md += `- **Max Duration:** ${params.maxDurationSec}s\n`;
  if (params.textConstraints.length > 0) {
    md += '\n**Text Constraints:**\n';
    for (const tc of params.textConstraints) {
      md += `- ${tc.field}: max ${tc.maxChars} chars\n`;
    }
  }

  return { success: true, data: params, displayMarkdown: md };
};

export const manifest: KitManifest = {
  id: 'ad-studio',
  name: 'Ad Studio',
  version: '1.0.0',
  description: 'Ad placement intelligence — specs, compliance checking, format recommendations for all ad platforms (Google, Meta, Microsoft, X, LinkedIn, TikTok, YouTube, GDN).',
  author: 'MCV',
  capabilities: [],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use ad studio tools to look up ad format specs, validate creative assets against platform requirements, get format recommendations, and get optimal generation parameters for AI creative tools.',
  tools: [
    {
      name: 'adstudio_formats',
      description: 'List ad formats. Filter by platform, placement, or media type.',
      input_schema: {
        type: 'object',
        properties: {
          platform: { type: 'string', description: 'google-ads, meta-ads, microsoft-ads, twitter-ads, linkedin-ads, tiktok-ads, youtube-ads, google-display-network' },
          placement: { type: 'string', description: 'feed, stories, search, display, in-feed, etc.' },
          mediaType: { type: 'string', description: 'image, video, text, carousel' },
          query: { type: 'string', description: 'Free text search across names and descriptions' },
        },
      },
    },
    {
      name: 'adstudio_spec',
      description: 'Get detailed spec for a specific ad format by ID (e.g. meta-ads:feed:image).',
      input_schema: {
        type: 'object',
        properties: { formatId: { type: 'string', description: 'Format ID like meta-ads:feed:image' } },
        required: ['formatId'],
      },
    },
    {
      name: 'adstudio_validate',
      description: 'Validate a creative asset against ad format requirements. Returns compliance report.',
      input_schema: {
        type: 'object',
        properties: {
          width: { type: 'number', description: 'Image/video width in pixels' },
          height: { type: 'number', description: 'Image/video height in pixels' },
          fileSizeMb: { type: 'number', description: 'File size in MB' },
          fileFormat: { type: 'string', description: 'File format (jpg, png, mp4, etc.)' },
          duration: { type: 'number', description: 'Video duration in seconds' },
          mediaType: { type: 'string', description: 'image or video' },
          texts: { type: 'object', description: 'Map of text field name to value' },
          formatIds: { type: 'array', description: 'Specific format IDs to validate against. Omit to auto-detect.' },
        },
      },
    },
    {
      name: 'adstudio_recommend',
      description: 'Recommend compatible ad formats for given asset dimensions.',
      input_schema: {
        type: 'object',
        properties: {
          width: { type: 'number', description: 'Width in pixels' },
          height: { type: 'number', description: 'Height in pixels' },
          mediaType: { type: 'string', description: 'image or video' },
        },
        required: ['width', 'height'],
      },
    },
    {
      name: 'adstudio_generate_spec',
      description: 'Get optimal AI generation parameters (dimensions, duration, text limits) for a specific ad format. Use before calling Imagen/Veo/Gemini.',
      input_schema: {
        type: 'object',
        properties: { formatId: { type: 'string', description: 'Format ID' } },
        required: ['formatId'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  adstudio_formats: listFormats,
  adstudio_spec: getSpec,
  adstudio_validate: validateAsset,
  adstudio_recommend: recommendFormats,
  adstudio_generate_spec: generateSpec,
};
