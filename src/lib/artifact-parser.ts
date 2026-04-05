import type { Artifact } from './types/artifacts';

// ---------------------------------------------------------------------------
// Artifact Parser — detects artifacts in assistant messages
// ---------------------------------------------------------------------------
// This is a pure string parser — no code execution, no eval.
// It scans markdown fenced code blocks for patterns that indicate
// the content should be promoted to an artifact in the side panel.

let artifactCounter = 0;

/**
 * Detect and extract artifacts from an assistant message.
 * Artifacts are: large code blocks (>20 lines), explicitly marked blocks,
 * mermaid diagrams, HTML previews, or SVG images.
 */
export function parseArtifacts(content: string, messageIndex: number): Artifact[] {
  if (typeof content !== 'string') return [];

  const artifacts: Artifact[] = [];
  const seenContent = new Set<string>();

  // Pattern: fenced code blocks with optional language tag
  const blockPattern = /```(\w*)\n([\s\S]*?)```/g;
  let m;

  while ((m = blockPattern.exec(content)) !== null) {
    const lang = m[1] || 'text';
    const code = m[2].trim();
    if (seenContent.has(code)) continue;
    seenContent.add(code);

    const lines = code.split('\n').length;
    const firstLine = code.split('\n')[0] || '';

    // Check for explicit artifact marker: // artifact: Title
    const markerMatch = firstLine.match(/^\/\/\s*artifact:\s*(.+)/);

    if (markerMatch) {
      artifacts.push({
        id: `art_${++artifactCounter}`,
        type: lang === 'mermaid' ? 'mermaid' : lang === 'html' ? 'html' : lang === 'svg' ? 'svg' : 'code',
        language: lang,
        title: markerMatch[1].trim(),
        content: code.split('\n').slice(1).join('\n').trim(), // Remove marker line
        messageIndex,
        createdAt: Date.now(),
      });
    } else if (lang === 'mermaid') {
      artifacts.push({
        id: `art_${++artifactCounter}`,
        type: 'mermaid',
        title: 'Diagram',
        content: code,
        messageIndex,
        createdAt: Date.now(),
      });
    } else if (lang === 'svg' && code.includes('<svg')) {
      artifacts.push({
        id: `art_${++artifactCounter}`,
        type: 'svg',
        title: 'SVG Image',
        content: code,
        messageIndex,
        createdAt: Date.now(),
      });
    } else if (lang === 'html' && code.includes('<') && code.length > 100) {
      artifacts.push({
        id: `art_${++artifactCounter}`,
        type: 'html',
        title: 'HTML Preview',
        content: code,
        messageIndex,
        createdAt: Date.now(),
      });
    } else if (lines > 20) {
      // Auto-detect large code blocks as potential artifacts
      artifacts.push({
        id: `art_${++artifactCounter}`,
        type: 'code',
        language: lang,
        title: `Code (${lang}, ${lines} lines)`,
        content: code,
        messageIndex,
        createdAt: Date.now(),
      });
    }
  }

  return artifacts;
}

/** Quick check if a message likely contains artifacts */
export function hasArtifacts(content: string): boolean {
  if (typeof content !== 'string') return false;
  if (content.includes('// artifact:')) return true;
  if (content.includes('```mermaid')) return true;
  // Check for large code blocks (>20 lines within fences)
  const blocks = content.match(/```\w*\n[\s\S]*?```/g) || [];
  return blocks.some((block) => block.split('\n').length > 22);
}
