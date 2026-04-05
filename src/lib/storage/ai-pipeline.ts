// MCV One — AI Processing Pipeline
// Dual-brain architecture: Claude for text/reasoning, Gemini for vision/generation

import type { AIAnalysis, StorageItem } from './types';

const GEMINI_API = '/api/google-generate';
const CLAUDE_API = '/api/chat';

/**
 * Route file to the right AI brain based on type.
 * Images/video → Gemini Vision, everything else → Claude.
 */
function routeToBrain(mimeType?: string): 'gemini' | 'claude' {
  if (!mimeType) return 'claude';
  if (mimeType.startsWith('image') || mimeType.startsWith('video')) return 'gemini';
  return 'claude';
}

/**
 * Analyze a file and return AI-generated tags, summary, and venture relevance.
 */
export async function analyzeFile(file: StorageItem): Promise<AIAnalysis> {
  const brain = routeToBrain(file.mimeType);

  if (brain === 'gemini') {
    return analyzeWithGemini(file);
  }
  return analyzeWithClaude(file);
}

async function analyzeWithClaude(file: StorageItem): Promise<AIAnalysis> {
  try {
    const res = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Analyze this file and respond with JSON only. File: "${file.name}" (${file.mimeType || 'unknown type'}, ${file.sizeBytes || 0} bytes, path: ${file.path}). Return: {"tags": ["tag1", "tag2"], "summary": "one sentence", "ventureRelevance": ["venture-id"], "contentType": "document|code|data|other"}`,
        }],
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: 'You are a file analysis assistant. Respond with valid JSON only, no markdown.',
      }),
    });
    if (!res.ok) throw new Error('Claude API error');
    const data = await res.json();
    const text = data.content?.[0]?.text || '{}';
    const parsed = JSON.parse(text);
    return {
      tags: parsed.tags || [],
      summary: parsed.summary || '',
      ventureRelevance: parsed.ventureRelevance || [],
      contentType: parsed.contentType || 'other',
    };
  } catch {
    return { tags: [], summary: '', ventureRelevance: [], contentType: 'other' };
  }
}

async function analyzeWithGemini(file: StorageItem): Promise<AIAnalysis> {
  try {
    const res = await fetch(GEMINI_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Analyze this file: "${file.name}" (${file.mimeType}). Provide tags, a one-sentence summary, and which MCV ventures it might be relevant to (mcv, futurestate, warforge, mcvgg, betedge, edgeiq, arqlabs). Respond as JSON: {"tags":[], "summary":"", "ventureRelevance":[], "contentType":"image|video|other"}`,
        model: 'gemini-1.5-pro',
      }),
    });
    if (!res.ok) throw new Error('Gemini API error');
    const data = await res.json();
    const text = data.text || data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    return {
      tags: parsed.tags || [],
      summary: parsed.summary || '',
      ventureRelevance: parsed.ventureRelevance || [],
      contentType: parsed.contentType || 'other',
    };
  } catch {
    return { tags: [], summary: '', ventureRelevance: [], contentType: 'other' };
  }
}

/**
 * Generate an executive brief for a file.
 */
export async function generateBrief(file: StorageItem, focus?: string): Promise<{
  tldr: string;
  keyNumbers: string[];
  actionItems: string[];
  riskFlags: string[];
}> {
  try {
    const focusPrompt = focus ? ` Focus on: ${focus}.` : '';
    const res = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Generate an executive brief for this file: "${file.name}" (${file.mimeType}, ${file.path}).${focusPrompt} Return JSON: {"tldr": "2-3 sentences", "keyNumbers": ["bullet1", "bullet2"], "actionItems": ["item1", "item2"], "riskFlags": ["flag1"]}`,
        }],
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: 'You are an executive briefing assistant for MCV Global Consortium. Be concise and actionable. Return valid JSON only.',
      }),
    });
    if (!res.ok) throw new Error('Brief generation failed');
    const data = await res.json();
    const text = data.content?.[0]?.text || '{}';
    return JSON.parse(text);
  } catch {
    return { tldr: 'Brief generation failed', keyNumbers: [], actionItems: [], riskFlags: [] };
  }
}

/**
 * Semantic search across file metadata + AI analysis.
 * Uses Claude to interpret natural language queries into structured filters.
 */
export async function semanticSearch(query: string, ventureId?: string): Promise<{
  interpretation: string;
  filters: Record<string, string>;
}> {
  try {
    const res = await fetch(CLAUDE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: `Interpret this file search query and extract structured filters. Query: "${query}"${ventureId ? ` (venture context: ${ventureId})` : ''}. Return JSON: {"interpretation": "what the user is looking for", "filters": {"name_contains": "", "mime_type": "", "venture_id": "", "created_by": "", "date_from": "", "date_to": "", "tags": ""}}. Only include filters that are relevant.`,
        }],
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: 'You are a search query interpreter. Return valid JSON only.',
      }),
    });
    if (!res.ok) throw new Error('Search interpretation failed');
    const data = await res.json();
    const text = data.content?.[0]?.text || '{}';
    return JSON.parse(text);
  } catch {
    return { interpretation: query, filters: { name_contains: query } };
  }
}
