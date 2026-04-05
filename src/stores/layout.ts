import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewId } from './navigation';

export interface WorkspacePreset {
  id: string;
  name: string;
  description: string;
  activeView: ViewId;
  splitView: ViewId | null;
  splitRatio: number;
  chatDocked: boolean;
  sidebarCollapsed: boolean;
}

interface LayoutState {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  statusBarVisible: boolean;
  presentMode: boolean;
  activePreset: string | null;

  // Presets — Ctrl+Shift+1/2/3
  presets: WorkspacePreset[];

  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleStatusBar: () => void;
  togglePresentMode: () => void;
  setActivePreset: (id: string | null) => void;
  addPreset: (preset: WorkspacePreset) => void;
  removePreset: (id: string) => void;
}

const DEFAULT_PRESETS: WorkspacePreset[] = [
  {
    id: 'ceo-dashboard',
    name: 'CEO Dashboard',
    description: 'Command Center + Chat',
    activeView: 'command-center',
    splitView: 'chat',
    splitRatio: 0.6,
    chatDocked: false,
    sidebarCollapsed: false,
  },
  {
    id: 'dev-mode',
    name: 'Dev Mode',
    description: 'Engineering + War Room',
    activeView: 'engineering',
    splitView: 'war-room',
    splitRatio: 0.5,
    chatDocked: true,
    sidebarCollapsed: true,
  },
  {
    id: 'crm-focus',
    name: 'CRM Focus',
    description: 'CRM full-screen + docked chat',
    activeView: 'crm',
    splitView: null,
    splitRatio: 0.5,
    chatDocked: true,
    sidebarCollapsed: false,
  },
  {
    id: 'operator-desk',
    name: 'Operator Desk',
    description: 'Device Hub + Command Center',
    activeView: 'device-hub',
    splitView: 'command-center',
    splitRatio: 0.5,
    chatDocked: false,
    sidebarCollapsed: false,
  },
  {
    id: 'stream-setup',
    name: 'Stream Setup',
    description: 'Audio Router + Aegis Chat',
    activeView: 'audio-router',
    splitView: 'chat',
    splitRatio: 0.4,
    chatDocked: false,
    sidebarCollapsed: false,
  },
  {
    id: 'dev-station',
    name: 'Dev Station',
    description: 'Engineering + Connected Sessions',
    activeView: 'engineering',
    splitView: 'connected-sessions',
    splitRatio: 0.6,
    chatDocked: false,
    sidebarCollapsed: false,
  },
];

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarWidth: 220,
      statusBarVisible: true,
      presentMode: false,
      activePreset: null,
      presets: DEFAULT_PRESETS,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarWidth: (width) => set({ sidebarWidth: Math.max(180, Math.min(360, width)) }),
      toggleStatusBar: () => set((s) => ({ statusBarVisible: !s.statusBarVisible })),
      togglePresentMode: () => set((s) => ({ presentMode: !s.presentMode })),
      setActivePreset: (id) => set({ activePreset: id }),
      addPreset: (preset) => set((s) => ({ presets: [...s.presets, preset] })),
      removePreset: (id) => set((s) => ({ presets: s.presets.filter(p => p.id !== id) })),
    }),
    {
      name: 'mcv-layout',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        sidebarWidth: s.sidebarWidth,
        statusBarVisible: s.statusBarVisible,
        presets: s.presets,
      }),
    },
  ),
);
