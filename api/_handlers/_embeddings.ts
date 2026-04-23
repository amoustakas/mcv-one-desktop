// ---------------------------------------------------------------------------
// Shared embedding helper for all API routes.
// Uses gemini-embedding-001 by default, falling back to text-embedding-004,
// then embedding-001 if the newer models aren't enabled for the API key.
// Always reduces output to 768 dimensions to match storage_chunks.embedding
// (vector(768)) regardless of which model wins.
//
// PHASE-0 SAFETY: inputs are PII-scrubbed before embedding by default. This
// prevents storage_chunks from becoming a PII reservoir. The trade-off is
// that redacted text embeds to a slightly different vector — callers that
// need raw-text embeddings (e.g., intentional PII vector search for
// compliance-approved paths) can pass { scrubPii: false } to opt out.
// ---------------------------------------------------------------------------

import { redactPii } from '@mcv/guardrails-sdk';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
export const EMBEDDING_DIM = 768;

function scrub(text: string, scrubPii: boolean): string {
  return scrubPii ? redactPii(text).safe : text;
}

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
  // Phase-0 safety: no VITE_* fallback — those names leak into the browser
  // bundle via Vite's define() pass. Server-side handlers use GOOGLE_AI_KEY only.
  const key = process.env.GOOGLE_AI_KEY || '';
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
export async function embedOne(
  text: string,
  taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' = 'RETRIEVAL_DOCUMENT',
  opts: { scrubPii?: boolean } = {},
): Promise<number[]> {
  const key = getKey();
  const modelsToTry = _resolvedModel ? [_resolvedModel] : CANDIDATE_MODELS;
  const safeText = scrub(text, opts.scrubPii ?? true);

  let lastError: Error | null = null;
  for (const model of modelsToTry) {
    const body: Record<string, unknown> = {
      model: `models/${model}`,
      content: { parts: [{ text: safeText }] },
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
export async function embedMany(
  texts: string[],
  taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' = 'RETRIEVAL_DOCUMENT',
  opts: { scrubPii?: boolean } = {},
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const key = getKey();
  const modelsToTry = _resolvedModel ? [_resolvedModel] : CANDIDATE_MODELS;
  const doScrub = opts.scrubPii ?? true;
  const safeTexts = texts.map((t) => scrub(t, doScrub));

  const BATCH = 100;
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    const results: number[][] = [];
    let ok = true;

    for (let offset = 0; offset < safeTexts.length; offset += BATCH) {
      const slice = safeTexts.slice(offset, offset + BATCH);
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
