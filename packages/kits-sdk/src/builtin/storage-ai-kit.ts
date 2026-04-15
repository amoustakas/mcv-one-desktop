import type { KitManifest, KitToolHandler } from '../types';
import { analyzeFile, generateBrief, semanticSearch } from '@mcv/storage-sdk/ai-pipeline';
import type { StorageItem } from '@mcv/storage-sdk/types';

const analyzeFileTool: KitToolHandler = async (input, _ctx) => {
  const file: StorageItem = {
    id: (input.file_id as string) || 'unknown',
    name: (input.file_name as string) || 'unknown',
    path: (input.file_path as string) || '',
    provider: 'supabase',
    isFolder: false,
    mimeType: (input.mime_type as string) || undefined,
    sizeBytes: (input.size_bytes as number) || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    aiTags: [],
    status: 'active',
    stage: 'published',
    visibility: 'private',
    certification: 'none',
    versionCount: 1,
    metadata: {},
  };
  const analysis = await analyzeFile(file);
  const tagList = analysis.tags.map(t => `\`${t}\``).join(', ');
  return {
    success: true,
    data: analysis,
    displayMarkdown: `## AI Analysis: ${file.name}\n\n**Summary:** ${analysis.summary}\n\n**Tags:** ${tagList}\n\n**Ventures:** ${analysis.ventureRelevance.join(', ') || 'none detected'}`,
  };
};

const generateBriefTool: KitToolHandler = async (input, _ctx) => {
  const file: StorageItem = {
    id: (input.file_id as string) || 'unknown',
    name: (input.file_name as string) || 'unknown',
    path: (input.file_path as string) || '',
    provider: 'supabase',
    isFolder: false,
    mimeType: (input.mime_type as string) || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    aiTags: [],
    status: 'active',
    stage: 'published',
    visibility: 'private',
    certification: 'none',
    versionCount: 1,
    metadata: {},
  };
  const focus = input.focus as string | undefined;
  const brief = await generateBrief(file, focus);
  const numbers = brief.keyNumbers.map(n => `- ${n}`).join('\n');
  const actions = brief.actionItems.map(a => `- [ ] ${a}`).join('\n');
  const risks = brief.riskFlags.map(r => `- ⚠️ ${r}`).join('\n');
  return {
    success: true,
    data: brief,
    displayMarkdown: `## Executive Brief: ${file.name}\n\n**TL;DR:** ${brief.tldr}\n\n### Key Numbers\n${numbers || '- None identified'}\n\n### Action Items\n${actions || '- None identified'}\n\n### Risk Flags\n${risks || '- None identified'}`,
  };
};

const searchSemanticTool: KitToolHandler = async (input, _ctx) => {
  const query = input.query as string;
  const ventureId = input.venture_id as string | undefined;
  const result = await semanticSearch(query, ventureId);
  const filterLines = Object.entries(result.filters)
    .filter(([_, v]) => v)
    .map(([k, v]) => `- **${k}**: ${v}`)
    .join('\n');
  return {
    success: true,
    data: result,
    displayMarkdown: `## Search: "${query}"\n\n**Interpretation:** ${result.interpretation}\n\n**Filters Applied:**\n${filterLines || '- No structured filters extracted'}`,
  };
};

const autoTagTool: KitToolHandler = async (input, _ctx) => {
  const fileName = input.file_name as string;
  const mimeType = input.mime_type as string | undefined;
  const file: StorageItem = {
    id: 'auto-tag',
    name: fileName,
    path: '',
    provider: 'supabase',
    isFolder: false,
    mimeType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    aiTags: [],
    status: 'active',
    stage: 'published',
    visibility: 'private',
    certification: 'none',
    versionCount: 1,
    metadata: {},
  };
  const analysis = await analyzeFile(file);
  return {
    success: true,
    data: { tags: analysis.tags },
    displayMarkdown: `**Auto-tags for ${fileName}:** ${analysis.tags.map(t => `\`${t}\``).join(', ') || 'none generated'}`,
  };
};

const suggestActionsTool: KitToolHandler = async (input, _ctx) => {
  const fileName = input.file_name as string;
  const status = (input.status as string) || 'active';
  const stage = (input.stage as string) || 'published';

  const suggestions: string[] = [];
  if (status === 'draft') suggestions.push('Review and publish this file', 'Share with team for feedback');
  if (status === 'review') suggestions.push('Approve or request changes', 'Add reviewer comments');
  if (status === 'approved') suggestions.push('Publish to production', 'Certify on-chain for legal binding');
  if (stage === 'concept') suggestions.push('Move to in-progress when work begins', 'Assign to a venture workspace');
  suggestions.push('Generate AI analysis', 'Add to RAG corpus for searchability');

  return {
    success: true,
    data: { suggestions },
    displayMarkdown: `## Suggested Actions for "${fileName}"\n\n${suggestions.map(s => `- ${s}`).join('\n')}`,
  };
};

export const manifest: KitManifest = {
  id: 'storage-ai',
  name: 'Storage AI',
  version: '1.0.0',
  description: 'AI-powered file analysis, auto-tagging, semantic search, executive briefs, and smart suggestions.',
  author: 'MCV',
  capabilities: ['llm', 'storage', 'network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools for AI-powered file operations: analyzing files, generating executive briefs, semantic search, auto-tagging, and getting smart suggestions.',
  tools: [
    {
      name: 'analyze_file',
      description: 'Run AI analysis on a file to extract tags, summary, and venture relevance.',
      input_schema: {
        type: 'object',
        properties: {
          file_id: { type: 'string', description: 'File ID' },
          file_name: { type: 'string', description: 'File name' },
          file_path: { type: 'string', description: 'File path' },
          mime_type: { type: 'string', description: 'MIME type' },
          size_bytes: { type: 'number', description: 'File size in bytes' },
        },
        required: ['file_name'],
      },
    },
    {
      name: 'generate_brief',
      description: 'Generate an executive brief for a file with TL;DR, key numbers, action items, and risk flags.',
      input_schema: {
        type: 'object',
        properties: {
          file_id: { type: 'string', description: 'File ID' },
          file_name: { type: 'string', description: 'File name' },
          file_path: { type: 'string', description: 'File path' },
          mime_type: { type: 'string', description: 'MIME type' },
          focus: { type: 'string', description: 'Optional focus area: financial, legal, technical' },
        },
        required: ['file_name'],
      },
    },
    {
      name: 'search_semantic',
      description: 'Interpret a natural language search query and extract structured file filters.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Natural language search query' },
          venture_id: { type: 'string', description: 'Optional venture context' },
        },
        required: ['query'],
      },
    },
    {
      name: 'auto_tag',
      description: 'Generate AI tags for a file based on its name and type.',
      input_schema: {
        type: 'object',
        properties: {
          file_name: { type: 'string', description: 'File name' },
          mime_type: { type: 'string', description: 'MIME type' },
        },
        required: ['file_name'],
      },
    },
    {
      name: 'suggest_actions',
      description: 'Get smart action suggestions for a file based on its current status and stage.',
      input_schema: {
        type: 'object',
        properties: {
          file_name: { type: 'string', description: 'File name' },
          status: { type: 'string', description: 'Current file status' },
          stage: { type: 'string', description: 'Current file stage' },
        },
        required: ['file_name'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  analyze_file: analyzeFileTool,
  generate_brief: generateBriefTool,
  search_semantic: searchSemanticTool,
  auto_tag: autoTagTool,
  suggest_actions: suggestActionsTool,
};
