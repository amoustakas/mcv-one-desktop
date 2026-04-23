// ---------------------------------------------------------------------------
// Gemini text embeddings — text-embedding-004 (768 dimensions)
//
// PHASE-0 SAFETY (2026-04-23): this module is SERVER-SIDE ONLY. The prior
// version supported a browser branch that read VITE_GOOGLE_AI_KEY from the
// Vite env — that key is bundled into the public JS at build time, so any
// visitor could pull it out of the bundle and call Google AI directly on our
// billing account. The browser branch is deleted.
//
// If code in a browser context needs an embedding, it must POST to the
// server-side `/api/_embeddings` proxy (see api/_handlers/_embeddings.ts),
// which holds GOOGLE_AI_KEY server-side and applies PII scrubbing before
// calling Google. See docs/CLAUDE.md under "ENVIRONMENT VARIABLES" for the
// server-only env convention.
// ---------------------------------------------------------------------------

export const EMBEDDING_MODEL = 'text-embedding-004';
export const EMBEDDING_DIM = 768;
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';

function getApiKey(): string {
  // Server-only: accept GOOGLE_AI_KEY. No VITE_* fallback — see header comment.
  const nodeKey = (typeof process !== 'undefined' && process.env?.GOOGLE_AI_KEY) || '';
  if (!nodeKey) {
    throw new Error(
      'Google AI key not configured. Set GOOGLE_AI_KEY (server-only). ' +
      'Phase-0 safety: VITE_GOOGLE_AI_KEY is no longer supported — that env shape leaks the key into the browser bundle via Vite.',
    );
  }
  return nodeKey;
}

export type EmbedTaskType =
  | 'RETRIEVAL_QUERY'
  | 'RETRIEVAL_DOCUMENT'
  | 'SEMANTIC_SIMILARITY'
  | 'CLASSIFICATION'
  | 'CLUSTERING';

interface EmbedOptions {
  taskType?: EmbedTaskType;
  title?: string;          // For RETRIEVAL_DOCUMENT only
  outputDim?: number;      // Optional truncation (must be <= 768)
}

/** Embed a single text. Returns a 768-dim vector. Server-side only. */
export async function embed(text: string, opts: EmbedOptions = {}): Promise<number[]> {
  const key = getApiKey();
  const body: Record<string, unknown> = {
    model: `models/${EMBEDDING_MODEL}`,
    content: { parts: [{ text }] },
    taskType: opts.taskType || 'RETRIEVAL_DOCUMENT',
  };
  if (opts.title) body.title = opts.title;
  if (opts.outputDim) body.outputDimensionality = opts.outputDim;

  const res = await fetch(`${ENDPOINT}/models/${EMBEDDING_MODEL}:embedContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Embedding failed: ${res.status}`);
  }
  const data = await res.json();
  const values: number[] | undefined = data.embedding?.values;
  if (!values) throw new Error('Embedding response missing values');
  return values;
}

/**
 * Embed a batch of texts. Google's batchEmbedContents caps requests at 100.
 * For larger inputs we split into multiple round-trips. Server-side only.
 */
export async function embedBatch(texts: string[], opts: EmbedOptions = {}): Promise<number[][]> {
  if (texts.length === 0) return [];
  const key = getApiKey();
  const BATCH = 100;
  const results: number[][] = [];

  for (let offset = 0; offset < texts.length; offset += BATCH) {
    const slice = texts.slice(offset, offset + BATCH);
    const body = {
      requests: slice.map(text => {
        const r: Record<string, unknown> = {
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text }] },
          taskType: opts.taskType || 'RETRIEVAL_DOCUMENT',
        };
        if (opts.outputDim) r.outputDimensionality = opts.outputDim;
        return r;
      }),
    };
    const res = await fetch(`${ENDPOINT}/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Batch embedding failed: ${res.status}`);
    }
    const data = await res.json();
    const vectors: number[][] = (data.embeddings || []).map((e: { values: number[] }) => e.values);
    results.push(...vectors);
  }
  return results;
}

/** Cosine similarity between two equal-dim vectors. Pure math — safe everywhere. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vector dim mismatch');
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

/**
 * Browser-safe embedding: POSTs to the server-side `/api/_embeddings` proxy,
 * which holds GOOGLE_AI_KEY server-side and scrubs PII before calling Google.
 * Use this from any code that runs in a browser context.
 */
export async function embedViaProxy(text: string, opts: EmbedOptions = {}): Promise<number[]> {
  const res = await fetch('/api/_embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ text, ...opts }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Proxy embedding failed: ${res.status}`);
  }
  const data = await res.json();
  const values: number[] | undefined = data.embedding;
  if (!values) throw new Error('Proxy embedding response missing values');
  return values;
}
