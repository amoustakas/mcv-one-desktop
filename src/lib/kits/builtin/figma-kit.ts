import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function figmaApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
  const r = await ctx.fetch(`/api/figma?${q}`);
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Figma error'); }
  return r.json();
}

const getFile: KitToolHandler = async (input, ctx) => {
  const d = await figmaApi('get-file', { fileKey: input.fileKey, depth: input.depth }, ctx);
  const pages = d.document?.children ?? [];
  const lines = pages.map((p: { name: string; children: unknown[] }) => `- **${p.name}** (${p.children?.length ?? 0} layers)`);
  return { success: true, data: d, displayMarkdown: `## ${d.name}\n\nLast modified: ${d.lastModified}\n\n### Pages\n${lines.join('\n')}` };
};

const getComponents: KitToolHandler = async (input, ctx) => {
  const d = await figmaApi('get-components', { fileKey: input.fileKey }, ctx);
  const comps = d.meta?.components ?? [];
  const lines = comps.map((c: { name: string; key: string; description: string }) => `- **${c.name}** (\`${c.key}\`) — ${c.description || 'no description'}`);
  return { success: true, data: comps, displayMarkdown: `## Components (${comps.length})\n\n${lines.join('\n')}` };
};

const getStyles: KitToolHandler = async (input, ctx) => {
  const d = await figmaApi('get-styles', { fileKey: input.fileKey }, ctx);
  const styles = d.meta?.styles ?? [];
  const lines = styles.map((s: { name: string; style_type: string; key: string }) => `- **${s.name}** (${s.style_type}) — \`${s.key}\``);
  return { success: true, data: styles, displayMarkdown: `## Styles (${styles.length})\n\n${lines.join('\n')}` };
};

const exportImages: KitToolHandler = async (input, ctx) => {
  const d = await figmaApi('export-images', { fileKey: input.fileKey, ids: input.nodeIds, format: input.format ?? 'png', scale: input.scale ?? '2' }, ctx);
  const images = d.images || {};
  const lines = Object.entries(images).map(([id, url]) => `- \`${id}\` → [download](${url})`);
  return { success: true, data: images, displayMarkdown: `## Exported Images (${lines.length})\n\n${lines.join('\n')}` };
};

const getVariables: KitToolHandler = async (input, ctx) => {
  const d = await figmaApi('get-variables', { fileKey: input.fileKey }, ctx);
  return { success: true, data: d, displayMarkdown: `## Design Tokens\n\n\`\`\`json\n${JSON.stringify(d, null, 2).slice(0, 3000)}\n\`\`\`` };
};

const figmaOverview: KitToolHandler = async (_i, ctx) => {
  const d = await figmaApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Figma\n\n- **User:** ${d.user}\n- **Email:** ${d.email}` };
};

export const manifest: KitManifest = {
  id: 'figma-design', name: 'Figma Design', version: '1.0.0',
  description: 'Figma — design files, components, styles, image exports, comments, variables (design tokens), and project management.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use figma tools for design file inspection, component browsing, style extraction, image exports, and design token retrieval.',
  tools: [
    { name: 'figma_get_file', description: 'Get a Figma file structure (pages, layers).', input_schema: { type: 'object', properties: { fileKey: { type: 'string', description: 'File key from URL' }, depth: { type: 'string', description: 'Node depth limit' } }, required: ['fileKey'] } },
    { name: 'figma_components', description: 'List components in a file.', input_schema: { type: 'object', properties: { fileKey: { type: 'string' } }, required: ['fileKey'] } },
    { name: 'figma_styles', description: 'List styles (colors, text, effects) in a file.', input_schema: { type: 'object', properties: { fileKey: { type: 'string' } }, required: ['fileKey'] } },
    { name: 'figma_export', description: 'Export node images (PNG, SVG, PDF).', input_schema: { type: 'object', properties: { fileKey: { type: 'string' }, nodeIds: { type: 'string', description: 'Comma-separated node IDs' }, format: { type: 'string', description: 'png, svg, pdf, jpg' }, scale: { type: 'string' } }, required: ['fileKey', 'nodeIds'] } },
    { name: 'figma_variables', description: 'Get design variables (tokens).', input_schema: { type: 'object', properties: { fileKey: { type: 'string' } }, required: ['fileKey'] } },
    { name: 'figma_overview', description: 'Figma account overview.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  figma_get_file: getFile, figma_components: getComponents, figma_styles: getStyles,
  figma_export: exportImages, figma_variables: getVariables, figma_overview: figmaOverview,
};
