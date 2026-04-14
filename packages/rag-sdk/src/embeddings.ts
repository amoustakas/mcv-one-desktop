// ---------------------------------------------------------------------------
// Gemini text embeddings — text-embedding-004 (768 dimensions)
// Works in both browser (VITE_GOOGLE_AI_KEY) and server (GOOGLE_AI_KEY) envs.
// ---------------------------------------------------------------------------

export const EMBEDDING_MODEL = 'text-embedding-004';
export const EMBEDDING_DIM = 768;
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';

function getApiKey(): string {
  // Browser (Vite) — fall back to Node env for API route usage.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viteKey = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GOOGLE_AI_KEY : '';
  const nodeKey =
    (typeof process !== 'undefined' && (process.env?.GOOGLE_AI_KEY || process.env?.VITE_GOOGLE_AI_KEY)) || '';
  const key = viteKey || nodeKey || '';
  if (!key) throw new Error('Google AI key not configured (set GOOGLE_AI_KEY or VITE_GOOGLE_AI_KEY)');
  return key;
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

/** Embed a single text. Returns a 768-dim vector. */
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
 * For larger inputs we split into multiple round-trips.
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

/** Cosine similarity between two equal-dim vectors. */
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
