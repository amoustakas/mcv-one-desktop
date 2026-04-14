import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Storage Meta hooks — Versions, Compartments, Legal Hold, Audit, Chunks
// ---------------------------------------------------------------------------

async function metaApi(action: string, params: Record<string, unknown> = {}, method: 'GET' | 'POST' = 'POST') {
  if (method === 'GET') {
    const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const res = await fetch(`/api/storage-meta?${qs}`);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `storage-meta ${res.status}`); }
    return res.json();
  }
  const res = await fetch('/api/storage-meta', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `storage-meta ${res.status}`); }
  return res.json();
}

async function auditApi(action: string, params: Record<string, unknown> = {}) {
  const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
  const res = await fetch(`/api/storage-audit?${qs}`);
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `storage-audit ${res.status}`); }
  return res.json();
}

// ── Versions ──
export function useFileVersions(fileId?: string) {
  return useQuery<{ versions: Array<Record<string, unknown>> }>({
    queryKey: ['file-versions', fileId],
    queryFn: () => metaApi('list-versions', { file_id: fileId }),
    enabled: !!fileId,
    staleTime: 30_000,
  });
}

export function useCreateVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { file_id: string; version_number: number; provider: string; path: string; size_bytes: number; content_hash?: string; change_summary?: string }) =>
      metaApi('create-version', p),
    onSuccess: (_d, p) => qc.invalidateQueries({ queryKey: ['file-versions', p.file_id] }),
  });
}

// ── Compartments ──
export function useFileCompartments(fileId?: string) {
  return useQuery<{ compartments: Array<Record<string, unknown>> }>({
    queryKey: ['file-compartments', fileId],
    queryFn: () => metaApi('list-compartments', { file_id: fileId }),
    enabled: !!fileId,
    staleTime: 30_000,
  });
}

export function useAddCompartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { file_id: string; venture_id: string; compartment?: string; access_level?: string; tags?: string[] }) =>
      metaApi('add-compartment', p),
    onSuccess: (_d, p) => qc.invalidateQueries({ queryKey: ['file-compartments', p.file_id] }),
  });
}

export function useRemoveCompartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { file_id: string; compartment_id: string }) => metaApi('remove-compartment', p),
    onSuccess: (_d, p) => qc.invalidateQueries({ queryKey: ['file-compartments', p.file_id] }),
  });
}

// ── Legal Hold ──
export function useLegalHold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { file_id: string; hold: boolean; reason?: string }) => metaApi('legal-hold', p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['files'] });
      qc.invalidateQueries({ queryKey: ['legal-holds'] });
    },
  });
}

export function useLegalHoldList(ventureId?: string) {
  return useQuery<{ files: Array<Record<string, unknown>> }>({
    queryKey: ['legal-holds', ventureId],
    queryFn: () => metaApi('legal-hold-list', { venture_id: ventureId }),
    staleTime: 60_000,
  });
}

// ── Audit Log ──
export function useAuditLog(params: { fileId?: string; userId?: string; ventureId?: string; action?: string; limit?: number } = {}) {
  return useQuery<{ entries: Array<Record<string, unknown>> }>({
    queryKey: ['audit-log', params],
    queryFn: () => {
      if (params.fileId) return auditApi('list', { file_id: params.fileId, limit: params.limit || 50 });
      return auditApi('search', {
        userId: params.userId, ventureId: params.ventureId, action: params.action, limit: params.limit || 50,
      });
    },
    staleTime: 15_000,
  });
}

// ── RAG Chunks ──
export function useChunkFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { file_id: string; corpus_id?: string; chunks: Array<{ text: string; index?: number }> }) =>
      metaApi('chunk-file', p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rag-chunks'] }),
  });
}

export function useSearchChunks() {
  return useMutation<{ matches: Array<{ file_id: string; chunk_text: string; chunk_index: number; score: number }>; total: number }, Error, { query: string; corpus_id?: string; venture_id?: string; limit?: number }>({
    mutationFn: (p) => metaApi('search-chunks', p),
  });
}
