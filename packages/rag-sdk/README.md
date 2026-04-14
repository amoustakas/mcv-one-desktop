# @mcv/rag-sdk

Retrieval-Augmented Generation primitives for MCV venture apps.

## Contents

- **chunker** — sentence-boundary text chunking (512 tokens default, 50-token overlap)
- **embeddings** — Gemini `text-embedding-004` client (768-dim vectors, browser + Node)
- **retrieve** — Supabase-agnostic pgvector query helper against `match_chunks` RPC

## Usage

```ts
import { chunkText, embedBatch, retrieve } from '@mcv/rag-sdk';

// Ingest
const chunks = chunkText(documentText);
const vectors = await embedBatch(chunks.map(c => c.text));
// persist rows to your storage_chunks table with embedding = vectors[i]

// Query (Supabase injected)
const results = await retrieve({
  supabase,                // your @supabase/supabase-js client
  query: 'what is the EDGE token valuation?',
  ventureId: 'mcv',
  topK: 4,
  threshold: 0.6,
});
```

## Envs

- `VITE_GOOGLE_AI_KEY` (browser) or `GOOGLE_AI_KEY` (Node) — required for embeddings

## Consumers

- mcv-one-desktop (via `src/lib/rag/*` shim)
- FutureState / BetEdge / mcv.gg (planned)
