// ---------------------------------------------------------------------------
// Shared embedding helper for all API routes.
// Uses gemini-embedding-001 by default, falling back to text-embedding-004,
// then embedding-001 if the newer models aren't enabled for the API key.
// Always reduces output to 768 dimensions to match storage_chunks.embedding
// (vector(768)) regardless of which model wins.
// ---------------------------------------------------------------------------

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
export const EMBEDDING_DIM = 768;

// Ordered list of candidate models. First is tried first; on "model not found"
// or 404 we fall through to the next. Cached after first success so a single
// cold-start pays the probe cost.
const CANDIDATE_MODELS = [
  process.env.GOOGLE_EMBEDDING_MODEL,
  'gemini-embedding-001',
  'text-embedding-004',
  'embedding-001',
].filter((m): m is string => Boolean(m));

let _resolvedModel: string | null = null;

function getKey(): string {
  const key = process.env.GOOGLE_AI_KEY || process.env.VITE_GOOGLE_AI_KEY || '';
  if (!key) throw new Error('GOOGLE_AI_KEY not configured');
  return key;
}

function isNotFoundError(status: number, body: { error?: { message?: string; status?: string } }): boolean {
  if (status === 404) return true;
  const msg = body?.error?.message || '';
  return /not found|not supported|unsupported|invalid.*model/i.test(msg);
}

/**
 * Single embedding. Tries each candidate model until one succeeds.
 * On success, locks in that model for subsequent calls in this cold-start.
 */
export async function embedOne(text: string, taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' = 'RETRIEVAL_DOCUMENT'): Promise<number[]> {
  const key = getKey();
  const modelsToTry = _resolvedModel ? [_resolvedModel] : CANDIDATE_MODELS;

  let lastError: Error | null = null;
  for (const model of modelsToTry) {
    const body: Record<string, unknown> = {
      model: `models/${model}`,
      content: { parts: [{ text }] },
      taskType,
    };
    // gemini-embedding-001 supports outputDimensionality; older models ignore it.
    if (model.startsWith('gemini-embedding')) body.outputDimensionality = EMBEDDING_DIM;

    const res = await fetch(`${ENDPOINT}/models/${model}:embedContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      const values: number[] | undefined = data.embedding?.values;
      if (!values || values.length === 0) {
        lastError = new Error(`Empty embedding from ${model}`);
        continue;
      }
      _resolvedModel = model;
      return values;
    }

    const errBody = await res.json().catch(() => ({}));
    if (isNotFoundError(res.status, errBody)) {
      lastError = new Error(`${model}: ${errBody.error?.message || res.status}`);
      continue; // try next model
    }
    // Non-recoverable error — surface it
    throw new Error(errBody.error?.message || `Embedding failed: ${res.status}`);
  }
  throw new Error(`All embedding models failed. Last: ${lastError?.message || 'unknown'}`);
}

/**
 * Batch embedding. Tries each candidate model until one succeeds for the full
 * batch. For gemini-embedding-001, batches size must be <= 100.
 */
export async function embedMany(texts: string[], taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' = 'RETRIEVAL_DOCUMENT'): Promise<number[][]> {
  if (texts.length === 0) return [];
  const key = getKey();
  const modelsToTry = _resolvedModel ? [_resolvedModel] : CANDIDATE_MODELS;

  const BATCH = 100;
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    const results: number[][] = [];
    let ok = true;

    for (let offset = 0; offset < texts.length; offset += BATCH) {
      const slice = texts.slice(offset, offset + BATCH);
      const body = {
        requests: slice.map(text => {
          const r: Record<string, unknown> = {
            model: `models/${model}`,
            content: { parts: [{ text }] },
            taskType,
          };
          if (model.startsWith('gemini-embedding')) r.outputDimensionality = EMBEDDING_DIM;
          return r;
        }),
      };
      const res = await fetch(`${ENDPOINT}/models/${model}:batchEmbedContents?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        if (isNotFoundError(res.status, errBody)) {
          lastError = new Error(`${model}: ${errBody.error?.message || res.status}`);
          ok = false;
          break;
        }
        throw new Error(errBody.error?.message || `Batch embed failed: ${res.status}`);
      }
      const data = await res.json();
      for (const e of (data.embeddings || [])) results.push(e.values);
    }

    if (ok) {
      _resolvedModel = model;
      return results;
    }
  }
  throw new Error(`All embedding models failed. Last: ${lastError?.message || 'unknown'}`);
}
