import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CommsPlatform,
  CommsTab,
  InboxFilter,
  ComposeTarget,
  UnifiedMessage,
} from '../lib/types/comms';

// ---------------------------------------------------------------------------
// Communications Hub Store — UI state for the unified comms view
// ---------------------------------------------------------------------------

interface CommsState {
  // Tab / view
  activeTab: CommsTab;

  // Filters
  activePlatforms: CommsPlatform[];
  ventureFilter: string | null;
  searchQuery: string;
  inboxFilter: InboxFilter;

  // Compose
  composeOpen: boolean;
  composeTarget: ComposeTarget | null;
  composeDraft: { content: string; subject?: string };

  // Channel detail
  selectedChannel: { platform: CommsPlatform; channelId: string } | null;

  // Message thread detail
  selectedMessage: UnifiedMessage | null;
  threadOpen: boolean;

  // Social sub-tab
  socialPlatform: 'twitter' | 'linkedin' | 'youtube';

  // Actions — tabs & filters
  setActiveTab: (tab: CommsTab) => void;
  togglePlatform: (platform: CommsPlatform) => void;
  setActivePlatforms: (platforms: CommsPlatform[]) => void;
  setVentureFilter: (ventureId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setInboxFilter: (filter: InboxFilter) => void;

  // Actions — compose
  openCompose: (target?: ComposeTarget) => void;
  closeCompose: () => void;
  setComposeDraft: (draft: { content: string; subject?: string }) => void;

  // Actions — detail panels
  selectChannel: (platform: CommsPlatform, channelId: string) => void;
  clearChannel: () => void;
  selectMessage: (msg: UnifiedMessage) => void;
  closeThread: () => void;

  // Actions — social
  setSocialPlatform: (platform: 'twitter' | 'linkedin' | 'youtube') => void;
}

const ALL_PLATFORMS: CommsPlatform[] = [
  'slack', 'discord', 'gmail', 'twilio-sms', 'twilio-whatsapp',
  'twitter', 'linkedin', 'youtube',
];

export const useCommsStore = create<CommsState>()(
  persist(
    (set, _get) => ({
      // Defaults
      activeTab: 'inbox',
      activePlatforms: [...ALL_PLATFORMS],
      ventureFilter: null,
      searchQuery: '',
      inboxFilter: 'all',
      composeOpen: false,
      composeTarget: null,
      composeDraft: { content: '' },
      selectedChannel: null,
      selectedMessage: null,
      threadOpen: false,
      socialPlatform: 'twitter',

      // Tab & filters
      setActiveTab: (tab) => set({ activeTab: tab }),

      togglePlatform: (platform) =>
        set((s) => {
          const active = s.activePlatforms.includes(platform)
            ? s.activePlatforms.filter((p) => p !== platform)
            : [...s.activePlatforms, platform];
          return { activePlatforms: active };
        }),

      setActivePlatforms: (platforms) => set({ activePlatforms: platforms }),
      setVentureFilter: (ventureId) => set({ ventureFilter: ventureId }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setInboxFilter: (filter) => set({ inboxFilter: filter }),

      // Compose
      openCompose: (target) =>
        set({
          composeOpen: true,
          composeTarget: target || null,
          activeTab: 'compose',
        }),

      closeCompose: () =>
        set({
          composeOpen: false,
          composeTarget: null,
          composeDraft: { content: '' },
        }),

      setComposeDraft: (draft) => set({ composeDraft: draft }),

      // Detail panels
      selectChannel: (platform, channelId) =>
        set({ selectedChannel: { platform, channelId } }),

      clearChannel: () => set({ selectedChannel: null }),

      selectMessage: (msg) =>
        set({ selectedMessage: msg, threadOpen: true }),

      closeThread: () =>
        set({ selectedMessage: null, threadOpen: false }),

      // Social
      setSocialPlatform: (platform) => set({ socialPlatform: platform }),
    }),
    {
      name: 'mcv-comms',
      partialize: (s) => ({
        activeTab: s.activeTab,
        activePlatforms: s.activePlatforms,
        ventureFilter: s.ventureFilter,
        inboxFilter: s.inboxFilter,
        socialPlatform: s.socialPlatform,
      }),
    },
  ),
);
