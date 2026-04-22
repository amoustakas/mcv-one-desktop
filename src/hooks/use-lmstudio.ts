// LMStudio cockpit hook — wraps the Factory's lmstudio flows so the cockpit
// can show loaded models, drive load/unload, and kick off streaming
// completions from the FactoryConsole. SSE token stream (`factory.lmstudio.token`)
// flows through the shared useFactoryStream; UI listens there for live output.

import { useCallback, useEffect, useRef, useState } from 'react';
import { factoryInvoke } from '../lib/factory-client';

export interface LmStudioModel {
  identifier: string;
  modelKey: string;
  domain: 'llm' | 'embedding';
  contextLength?: number;
  architecture?: string;
}

export interface LmStudioSnapshot {
  sdkReachable: boolean;
  loadedLlms: LmStudioModel[];
  loadedEmbeddings: LmStudioModel[];
  installed?: Array<{ identifier?: string; modelKey?: string; path?: string }>;
  error?: string;
}

export interface UseLmStudioResult {
  snapshot: LmStudioSnapshot | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadModel: (model: string, contextLength?: number) => Promise<{ ok: boolean; identifier?: string; error?: string }>;
  unloadModel: (identifier: string) => Promise<{ ok: boolean; error?: string }>;
  complete: (model: string, prompt: string, opts?: { temperature?: number; maxTokens?: number }) => Promise<{ text: string; tokenCount: number; durationMs: number }>;
  busy: boolean;
}

export function useLmStudio(options: { intervalMs?: number } = {}): UseLmStudioResult {
  const { intervalMs = 15_000 } = options;
  const [snapshot, setSnapshot] = useState<LmStudioSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const aliveRef = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const r = await factoryInvoke<LmStudioSnapshot>('lmstudioStatus', {});
      if (!aliveRef.current) return;
      if (r.status === 'completed' && r.output) {
        setSnapshot(r.output);
        setError(null);
      } else {
        setError(r.error ?? 'lmstudioStatus failed');
      }
    } catch (err) {
      if (!aliveRef.current) return;
      setError(err instanceof Error ? err.message : 'lmstudioStatus failed');
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  const loadModel = useCallback(async (model: string, contextLength?: number) => {
    setBusy(true);
    try {
      const r = await factoryInvoke<{ ok: boolean; identifier?: string; error?: string }>('lmstudioLoad', { model, contextLength });
      await refetch();
      return r.output ?? { ok: false, error: r.error ?? 'load failed' };
    } finally { setBusy(false); }
  }, [refetch]);

  const unloadModel = useCallback(async (identifier: string) => {
    setBusy(true);
    try {
      const r = await factoryInvoke<{ ok: boolean; error?: string }>('lmstudioUnload', { identifier });
      await refetch();
      return r.output ?? { ok: false, error: r.error ?? 'unload failed' };
    } finally { setBusy(false); }
  }, [refetch]);

  const complete = useCallback(async (model: string, prompt: string, opts: { temperature?: number; maxTokens?: number } = {}) => {
    setBusy(true);
    try {
      const r = await factoryInvoke<{ text: string; tokenCount: number; durationMs: number }>('lmstudioComplete', { model, prompt, ...opts });
      return r.output ?? { text: '', tokenCount: 0, durationMs: 0 };
    } finally { setBusy(false); }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    refetch();
    if (intervalMs > 0) {
      const id = setInterval(refetch, intervalMs);
      return () => { aliveRef.current = false; clearInterval(id); };
    }
    return () => { aliveRef.current = false; };
  }, [intervalMs, refetch]);

  return { snapshot, loading, error, refetch, loadModel, unloadModel, complete, busy };
}
