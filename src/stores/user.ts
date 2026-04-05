import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserPreferences {
  displayName: string;
  avatarUrl: string;
  defaultVenture: string;
  // Audio
  voiceEnabled: boolean;
  ttsVoice: string;
  sttProvider: 'browser' | 'deepgram';
  // Display
  compactMode: boolean;
  showAnimatedBg: boolean;
  clockFormat: '12h' | '24h';
  // AI
  preferredModel: string;
  maxTokens: number;
  streamingEnabled: boolean;
}

interface UserState {
  preferences: UserPreferences;
  lastSyncedAt: string | null;

  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: '',
  avatarUrl: '',
  defaultVenture: 'mcv',
  voiceEnabled: true,
  ttsVoice: 'default',
  sttProvider: 'browser',
  compactMode: false,
  showAnimatedBg: true,
  clockFormat: '12h',
  preferredModel: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  streamingEnabled: true,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      preferences: { ...DEFAULT_PREFERENCES },
      lastSyncedAt: null,

      updatePreferences: (updates) =>
        set((s) => ({
          preferences: { ...s.preferences, ...updates },
          lastSyncedAt: new Date().toISOString(),
        })),

      resetPreferences: () =>
        set({ preferences: { ...DEFAULT_PREFERENCES }, lastSyncedAt: null }),
    }),
    { name: 'mcv-user' },
  ),
);
