import { create } from 'zustand';

export interface VideoGalleryItem {
  id: string;
  prompt: string;
  objectUrl: string;
  uri: string;
  mode: string;
  model: string;
  createdAt: Date;
}

interface VideoGenerationState {
  status: 'idle' | 'submitting' | 'polling' | 'downloading' | 'complete' | 'error';
  error: string | null;
  gallery: VideoGalleryItem[];
  activeTab: 'generate' | 'gallery' | 'cameos' | 'typography';

  setStatus: (s: VideoGenerationState['status']) => void;
  setError: (e: string | null) => void;
  addToGallery: (item: VideoGalleryItem) => void;
  removeFromGallery: (id: string) => void;
  setActiveTab: (tab: VideoGenerationState['activeTab']) => void;
  reset: () => void;
}

export const useVideoGeneration = create<VideoGenerationState>((set) => ({
  status: 'idle',
  error: null,
  gallery: [],
  activeTab: 'generate',

  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  addToGallery: (item) => set((s) => ({ gallery: [item, ...s.gallery] })),
  removeFromGallery: (id) => set((s) => ({ gallery: s.gallery.filter((v) => v.id !== id) })),
  setActiveTab: (activeTab) => set({ activeTab }),
  reset: () => set({ status: 'idle', error: null }),
}));
