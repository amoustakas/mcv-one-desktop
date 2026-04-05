import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CommsPlatform } from '../lib/types/comms';

// ---------------------------------------------------------------------------
// Global Comms Actions Store
// Favorites, recent recipients, and templates for the CommsActionFAB.
// Available from any view via the floating action button.
// ---------------------------------------------------------------------------

export interface FavoriteChannel {
  platform: CommsPlatform;
  channelId: string;
  name: string;
}

export interface RecentRecipient {
  name: string;
  platform: CommsPlatform;
  target: string; // phone, email, or channelId
  lastUsed: string;
}

export interface CommsTemplate {
  id: string;
  name: string;
  platform: CommsPlatform;
  content: string;
}

type FabMode = null | 'slack' | 'email' | 'sms' | 'whatsapp' | 'call' | 'note';

interface CommsActionsState {
  favoriteChannels: FavoriteChannel[];
  recentRecipients: RecentRecipient[];
  templates: CommsTemplate[];
  fabOpen: boolean;
  fabMode: FabMode;

  // FAB controls
  openFab: (mode?: FabMode) => void;
  closeFab: () => void;
  setFabMode: (mode: FabMode) => void;
  toggleFab: () => void;

  // Data management
  addFavoriteChannel: (channel: FavoriteChannel) => void;
  removeFavoriteChannel: (channelId: string) => void;
  addRecentRecipient: (recipient: Omit<RecentRecipient, 'lastUsed'>) => void;
  addTemplate: (template: Omit<CommsTemplate, 'id'>) => void;
  removeTemplate: (id: string) => void;
}

const MAX_FAVORITES = 20;
const MAX_RECENT = 50;

export const useCommsActions = create<CommsActionsState>()(
  persist(
    (set) => ({
      favoriteChannels: [],
      recentRecipients: [],
      templates: [
        { id: 'tpl-1', name: 'Quick Check-in', platform: 'slack', content: 'Hey team, quick check-in — how are things going?' },
        { id: 'tpl-2', name: 'Meeting Follow-up', platform: 'gmail', content: 'Hi {{name}},\n\nThank you for your time today. Here are the key takeaways:\n\n- \n\nLooking forward to next steps.\n\nBest,\nTony' },
        { id: 'tpl-3', name: 'Invoice Reminder', platform: 'twilio-sms', content: 'Hi {{name}}, friendly reminder that invoice #{{number}} is due. Please let us know if you have any questions.' },
      ],
      fabOpen: false,
      fabMode: null,

      openFab: (mode = null) => set({ fabOpen: true, fabMode: mode }),
      closeFab: () => set({ fabOpen: false, fabMode: null }),
      setFabMode: (mode) => set({ fabMode: mode }),
      toggleFab: () => set((s) => ({ fabOpen: !s.fabOpen, fabMode: s.fabOpen ? null : s.fabMode })),

      addFavoriteChannel: (channel) =>
        set((s) => {
          if (s.favoriteChannels.some((f) => f.channelId === channel.channelId)) return s;
          return { favoriteChannels: [channel, ...s.favoriteChannels].slice(0, MAX_FAVORITES) };
        }),

      removeFavoriteChannel: (channelId) =>
        set((s) => ({ favoriteChannels: s.favoriteChannels.filter((f) => f.channelId !== channelId) })),

      addRecentRecipient: (recipient) =>
        set((s) => {
          const filtered = s.recentRecipients.filter((r) => !(r.platform === recipient.platform && r.target === recipient.target));
          return {
            recentRecipients: [{ ...recipient, lastUsed: new Date().toISOString() }, ...filtered].slice(0, MAX_RECENT),
          };
        }),

      addTemplate: (template) =>
        set((s) => ({
          templates: [...s.templates, { ...template, id: `tpl-${Date.now()}` }],
        })),

      removeTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),
    }),
    {
      name: 'mcv-comms-actions',
    },
  ),
);
