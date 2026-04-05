import { create } from 'zustand';
import type { PipelineEntry, PipelineSource, PipelineStatus, PipelineSummary } from '../lib/types/pipeline';

interface PipelineState {
  entries: PipelineEntry[];
  summary: PipelineSummary | null;
  isPolling: boolean;
  lastError: string | null;

  setEntries: (entries: PipelineEntry[]) => void;
  setSummary: (summary: PipelineSummary) => void;
  setPolling: (polling: boolean) => void;
  setError: (error: string | null) => void;

  getBySource: (source: PipelineSource) => PipelineEntry[];
  getByStatus: (status: PipelineStatus) => PipelineEntry[];
  getByVenture: (ventureId: string) => PipelineEntry[];
  getActiveCount: () => number;
  getErrorCount: () => number;
}

export const usePipelineStore = create<PipelineState>()((set, get) => ({
  entries: [],
  summary: null,
  isPolling: false,
  lastError: null,

  setEntries: (entries) => set({ entries, lastError: null }),
  setSummary: (summary) => set({ summary }),
  setPolling: (polling) => set({ isPolling: polling }),
  setError: (error) => set({ lastError: error }),

  getBySource: (source) => get().entries.filter((e) => e.source === source),
  getByStatus: (status) => get().entries.filter((e) => e.status === status),
  getByVenture: (ventureId) => get().entries.filter((e) => e.ventureId === ventureId),
  getActiveCount: () => get().entries.filter((e) => e.status === 'active').length,
  getErrorCount: () => get().entries.filter((e) => e.status === 'error').length,
}));
