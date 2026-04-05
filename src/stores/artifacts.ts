import { create } from 'zustand';
import type { Artifact } from '../lib/types/artifacts';

// ---------------------------------------------------------------------------
// Artifact Store — tracks generated artifacts from AI responses
// ---------------------------------------------------------------------------

interface ArtifactState {
  artifacts: Artifact[];
  activeArtifactId: string | null;
  panelOpen: boolean;

  addArtifact: (artifact: Artifact) => void;
  addArtifacts: (artifacts: Artifact[]) => void;
  setActive: (id: string | null) => void;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  clearArtifacts: () => void;
  removeArtifact: (id: string) => void;
}

export const useArtifactStore = create<ArtifactState>()((set, _get) => ({
  artifacts: [],
  activeArtifactId: null,
  panelOpen: false,

  addArtifact: (artifact) =>
    set((s) => {
      const updated = [...s.artifacts, artifact];
      return { artifacts: updated, activeArtifactId: artifact.id, panelOpen: true };
    }),

  addArtifacts: (newArtifacts) => {
    if (newArtifacts.length === 0) return;
    set((s) => ({
      artifacts: [...s.artifacts, ...newArtifacts],
      activeArtifactId: newArtifacts[0].id,
      panelOpen: true,
    }));
  },

  setActive: (id) => set({ activeArtifactId: id }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  clearArtifacts: () => set({ artifacts: [], activeArtifactId: null, panelOpen: false }),
  removeArtifact: (id) =>
    set((s) => {
      const filtered = s.artifacts.filter((a) => a.id !== id);
      return {
        artifacts: filtered,
        activeArtifactId: s.activeArtifactId === id ? (filtered[0]?.id ?? null) : s.activeArtifactId,
      };
    }),
}));
