// ---------------------------------------------------------------------------
// Token-aware text chunker for RAG ingestion.
//   - Sentence-boundary splitting (keeps semantic units intact)
//   - Configurable max chunk size + overlap (in rough token counts)
//   - Fallback to char-window splitting if sentences exceed maxTokens
// Token heuristic: 1 token ≈ 4 chars (good enough for English). For precise
// counting swap in tiktoken server-side.
// ---------------------------------------------------------------------------

export interface Chunk {
  index: number;
  text: string;
  tokenCount: number;   // estimated
  startChar: number;
  endChar: number;
}

export interface ChunkOptions {
  maxTokens?: number;    // default 512
  overlap?: number;      // default 50 (tokens of overlap with previous chunk)
  strategy?: 'sentence' | 'paragraph';
}

const CHARS_PER_TOKEN = 4;

function tokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation while preserving the punctuation.
  const matches = text.match(/[^.!?\n]+[.!?\n]+\s*/g);
  if (matches && matches.length) return matches;
  return [text];
}

function splitParagraphs(text: string): string[] {
  return text.split(/\n\s*\n+/).filter(Boolean);
}

/**
 * Chunk text into token-bounded segments. Sentences/paragraphs are kept whole
 * where possible; overly long ones are split on word boundaries.
 */
export function chunkText(text: string, opts: ChunkOptions = {}): Chunk[] {
  const maxTokens = opts.maxTokens ?? 512;
  const overlap   = opts.overlap   ?? 50;
  const strategy  = opts.strategy  ?? 'sentence';
  const maxChars  = maxTokens * CHARS_PER_TOKEN;

  const clean = text.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const units = strategy === 'paragraph' ? splitParagraphs(clean) : splitSentences(clean);
  const chunks: Chunk[] = [];

  let buf = '';
  let bufStart = 0;
  let cursor = 0; // running char index in the original text

  const flush = (endChar: number) => {
    const trimmed = buf.trim();
    if (!trimmed) return;
    chunks.push({
      index: chunks.length,
      text: trimmed,
      tokenCount: tokens(trimmed),
      startChar: bufStart,
      endChar,
    });
    // Seed next buffer with trailing overlap
    if (overlap > 0) {
      const tail = trimmed.slice(-overlap * CHARS_PER_TOKEN);
      buf = tail + ' ';
      bufStart = endChar - tail.length;
    } else {
      buf = '';
      bufStart = endChar;
    }
  };

  for (const unit of units) {
    const unitStart = cursor;
    cursor += unit.length;

    // Unit on its own already exceeds budget — hard split on word boundary.
    if (unit.length > maxChars) {
      if (buf.trim()) flush(unitStart);
      let i = 0;
      while (i < unit.length) {
        const slice = unit.slice(i, i + maxChars);
        chunks.push({
          index: chunks.length,
          text: slice.trim(),
          tokenCount: tokens(slice),
          startChar: unitStart + i,
          endChar: unitStart + i + slice.length,
        });
        i += maxChars - overlap * CHARS_PER_TOKEN;
      }
      buf = '';
      bufStart = cursor;
      continue;
    }

    if ((buf.length + unit.length) > maxChars && buf.trim()) {
      flush(unitStart);
    }
    if (!buf) bufStart = unitStart;
    buf += unit;
  }

  if (buf.trim()) flush(cursor);
  return chunks;
}

/** Convenience: count tokens without chunking. */
export function estimateTokens(text: string): number {
  return tokens(text);
}
