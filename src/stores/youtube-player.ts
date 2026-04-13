import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface WatchHistoryEntry {
  videoId: string;
  title: string;
  watchedAt: number;
}

interface YouTubePlayerState {
  currentVideoId: string | null;
  currentVideoTitle: string;
  transcript: TranscriptSegment[] | null;
  transcriptLoading: boolean;
  transcriptSearch: string;
  playerTime: number;
  watchHistory: WatchHistoryEntry[];

  // Actions
  setVideo: (videoId: string, title?: string) => void;
  setTranscript: (segments: TranscriptSegment[]) => void;
  setTranscriptLoading: (loading: boolean) => void;
  setTranscriptSearch: (query: string) => void;
  setPlayerTime: (seconds: number) => void;
  clearTranscript: () => void;
  getFilteredTranscript: () => TranscriptSegment[];
}

export const useYouTubePlayerStore = create<YouTubePlayerState>()(
  persist(
    (set, get) => ({
      currentVideoId: null,
      currentVideoTitle: '',
      transcript: null,
      transcriptLoading: false,
      transcriptSearch: '',
      playerTime: 0,
      watchHistory: [],

      setVideo: (videoId: string, title?: string) => {
        set(s => ({
          currentVideoId: videoId,
          currentVideoTitle: title || '',
          transcript: null,
          transcriptSearch: '',
          playerTime: 0,
          watchHistory: [
            { videoId, title: title || '', watchedAt: Date.now() },
            ...s.watchHistory.filter(h => h.videoId !== videoId),
          ].slice(0, 50),
        }));
      },

      setTranscript: (segments) => set({ transcript: segments, transcriptLoading: false }),
      setTranscriptLoading: (loading) => set({ transcriptLoading: loading }),
      setTranscriptSearch: (query) => set({ transcriptSearch: query }),
      setPlayerTime: (seconds) => set({ playerTime: seconds }),
      clearTranscript: () => set({ transcript: null, transcriptSearch: '' }),

      getFilteredTranscript: () => {
        const { transcript, transcriptSearch } = get();
        if (!transcript) return [];
        if (!transcriptSearch.trim()) return transcript;
        const q = transcriptSearch.toLowerCase();
        return transcript.filter(s => s.text.toLowerCase().includes(q));
      },
    }),
    {
      name: 'mcv-youtube-player',
      partialize: (s) => ({
        watchHistory: s.watchHistory.slice(0, 20),
      }),
    }
  )
);
