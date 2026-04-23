// src/stores/agentic-inbox.ts
//
// Zustand store for the Agentic OS Draft Inbox (M4 surface).
// Shape mirrors src/stores/foundation.ts — one entity type, no sections.

import { create } from 'zustand';
import { apiPost } from '../lib/api/client';

export type DraftType =
  | 'nda'
  | 'ip_filing'
  | 'domain_acquisition'
  | 'contract_redline'
  | 'investor_update'
  | 'counsel_engagement_letter'
  | 'entity_formation';

export type DraftStatus = 'pending' | 'approved' | 'rejected' | 'edited';

export interface ContextRef {
  kind: string;
  id: string;
  label: string;
}

export interface AgentDraft {
  id: string;
  draft_type: DraftType;
  title: string;
  summary: string;
  body_md: string;
  emitter_agent: string;
  target_venture: string | null;
  status: DraftStatus;
  context_refs: ContextRef[];
  created_at: string;
  decided_at: string | null;
  decided_by: string | null;
}

interface AgenticInboxState {
  drafts: AgentDraft[];
  selectedDraftId: string | null;
  loading: boolean;
  error: string | null;

  fetchDrafts: () => Promise<void>;
  selectDraft: (id: string | null) => void;
  moveSelection: (dir: 1 | -1) => void;
  approveDraft: (id: string, notes?: string) => Promise<void>;
  rejectDraft: (id: string, reason?: string) => Promise<void>;
  editDraft: (id: string, body_md: string) => Promise<void>;
}

export const useAgenticInboxStore = create<AgenticInboxState>((set, get) => ({
  drafts: [],
  selectedDraftId: null,
  loading: false,
  error: null,

  fetchDrafts: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiPost<{ drafts: AgentDraft[] }>('/api/agentic', {
        action: 'list-drafts',
      });
      const drafts = data.drafts ?? [];
      const currentSelected = get().selectedDraftId;
      const stillValid = drafts.some((d) => d.id === currentSelected);
      const defaultSelection = drafts.find((d) => d.status === 'pending')?.id ?? null;
      set({
        drafts,
        loading: false,
        selectedDraftId: stillValid ? currentSelected : defaultSelection,
      });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  selectDraft: (id) => set({ selectedDraftId: id }),

  // j/k navigation — cycles through the pending-only visible list.
  moveSelection: (dir) => {
    const { drafts, selectedDraftId } = get();
    const visible = drafts.filter((d) => d.status === 'pending');
    if (visible.length === 0) return;
    const idx = Math.max(0, visible.findIndex((d) => d.id === selectedDraftId));
    const nextIdx = Math.min(visible.length - 1, Math.max(0, idx + dir));
    set({ selectedDraftId: visible[nextIdx].id });
  },

  approveDraft: async (id, notes) => {
    await apiPost('/api/agentic', { action: 'approve-draft', id, notes: notes ?? null });
    await get().fetchDrafts();
  },

  rejectDraft: async (id, reason) => {
    await apiPost('/api/agentic', { action: 'reject-draft', id, reason: reason ?? null });
    await get().fetchDrafts();
  },

  editDraft: async (id, body_md) => {
    await apiPost('/api/agentic', { action: 'edit-draft', id, body_md });
    await get().fetchDrafts();
  },
}));
