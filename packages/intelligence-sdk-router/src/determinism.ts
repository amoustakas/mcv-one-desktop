/**
 * Public DTO contract for the intelligence-gateway deterministic
 * replay sidechannel.
 *
 * PHASE-1 LOCAL COPY. Source of truth:
 *   mcv-core-triangle @ origin/foundation-substrate-2026-04-22
 *   packages/intelligence-sdk/src/determinism/index.ts
 *   commit c532c7d (2026-04-22)
 *
 * This file is LOCAL to mcv-one-desktop because the foundation branch
 * above is unmerged to core-triangle/main. When that merge lands,
 * delete this file and replace all imports with
 * `from '@mcv/intelligence-sdk/determinism'` — the SDK's types
 * (`Tool`, `Message`, `CompletionResponse`) replace the local stubs
 * below for free.
 */

/* ------------------------------------------------------------------
 * Local stub types — stand-ins for @mcv/intelligence-sdk's public
 * LLM types. These are intentionally minimal because the Router
 * doesn't call LLM completion directly — it only hashes requests
 * for replay-comparability. When the SDK swap lands, these stubs
 * are deleted and the real types come in through the subpath import.
 * ---------------------------------------------------------------- */

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<{ type: string; [key: string]: unknown }>;
  name?: string;
  toolCalls?: Array<{ id: string; name: string; args: unknown }>;
  toolCallId?: string;
}

export interface Tool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
}

export interface CompletionResponse {
  id: string;
  model: string;
  content: string;
  finishReason: 'stop' | 'length' | 'tool_use' | 'content_filter' | 'error';
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  toolCalls?: Array<{ id: string; name: string; args: unknown }>;
}

/* ------------------------------------------------------------------
 * Determinism DTOs (identical shape to core-triangle c532c7d).
 * ---------------------------------------------------------------- */

/**
 * Fingerprint inputs — the hash-identity of a completion request.
 * Consumers building custom fingerprinters MUST hash the same fields
 * in the same canonical order, or fingerprints won't match the
 * gateway's own.
 */
export interface FingerprintInputs {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
  /** Optional — when included, two ventures with identical prompts
   *  don't share replay entries. */
  ventureId?: string;
}

/**
 * Storage contract for deterministic replay entries. Async by design
 * for network-backed implementations; in-memory implementations
 * resolve synchronously-via-promise.
 */
export interface DeterministicReplayStore {
  get(fingerprint: string): Promise<CompletionResponse | null>;
  set(fingerprint: string, response: CompletionResponse): Promise<void>;
  size(): number;
  clear(): void;
}

/**
 * Env var name + value that activates replay mode in @mcv/intelligence.
 */
export const INTELLIGENCE_MODE_ENV = 'INTELLIGENCE_MODE' as const;
export const INTELLIGENCE_REPLAY_VALUE = 'replay' as const;

/**
 * Recommended shape for a replay-mode CI harness assertion.
 */
export interface ReplayBitwiseAssertion {
  id: string;
  content: string;
  model: string;
  finishReason: CompletionResponse['finishReason'];
}
