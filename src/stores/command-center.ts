import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SuiteId, KpiId } from '../lib/pinned-kpi/types';

/**
 * Command Center persisted state — alert snoozing, quick action customization,
 * and widget visibility preferences.
 */

export interface AlertSnooze {
  id: string;
  until: number; // epoch ms
}

export type QuickActionId =
  | 'chat' | 'docs' | 'tasks' | 'crm' | 'engineering' | 'war-room'
  | 'ai-studio' | 'treasury' | 'voice-studio' | 'creative-canvas'
  | 'video-studio' | 'naos-command' | 'signals' | 'memory'
  | 'files' | 'settings' | 'commerce' | 'knowledge-hub';

export const QUICK_ACTION_META: Record<QuickActionId, { label: string; view: string }> = {
  chat: { label: 'New Chat', view: 'chat' },
  docs: { label: 'Docs Hub', view: 'docs' },
  tasks: { label: 'Task Board', view: 'tasks' },
  crm: { label: 'CRM Pipeline', view: 'crm' },
  engineering: { label: 'Engineering', view: 'engineering' },
  'war-room': { label: 'War Room', view: 'war-room' },
  'ai-studio': { label: 'AI Studio', view: 'ai-studio' },
  treasury: { label: 'Treasury', view: 'treasury' },
  'voice-studio': { label: 'Voice Studio', view: 'voice-studio' },
  'creative-canvas': { label: 'Creative Canvas', view: 'creative-canvas' },
  'video-studio': { label: 'Video Studio', view: 'video-studio' },
  'naos-command': { label: 'NAOS', view: 'naos-command' },
  signals: { label: 'Signals', view: 'signals' },
  memory: { label: 'Memory', view: 'memory' },
  files: { label: 'Files', view: 'files' },
  settings: { label: 'Settings', view: 'settings' },
  commerce: { label: 'Commerce', view: 'commerce' },
  'knowledge-hub': { label: 'Knowledge', view: 'knowledge-hub' },
};

const DEFAULT_QUICK_ACTIONS: QuickActionId[] = [
  'chat', 'docs', 'tasks', 'crm', 'engineering', 'war-room', 'ai-studio', 'treasury',
];

interface CommandCenterState {
  snoozedAlerts: Record<string, number>; // id -> until epoch
  resolvedAlerts: string[];
  quickActions: QuickActionId[];
  widgetVisibility: Record<string, boolean>;

  snoozeAlert: (id: string, hours: number) => void;
  resolveAlert: (id: string) => void;
  unsnoozeAlert: (id: string) => void;
  isAlertActive: (id: string, now?: number) => boolean;
  clearResolvedAlerts: () => void;

  setQuickActions: (ids: QuickActionId[]) => void;
  reorderQuickActions: (from: number, to: number) => void;
  addQuickAction: (id: QuickActionId) => void;
  removeQuickAction: (id: QuickActionId) => void;

  setWidgetVisible: (id: string, visible: boolean) => void;
  isWidgetVisible: (id: string) => boolean;

  pinnedKpis: Record<string, KpiId[]>; // keyed by SuiteId
  setSuiteTiles: (suite: SuiteId, ids: KpiId[]) => void;
  addSuiteTile: (suite: SuiteId, id: KpiId) => void;
  removeSuiteTile: (suite: SuiteId, id: KpiId) => void;
  reorderSuiteTile: (suite: SuiteId, from: number, to: number) => void;
}

export const useCommandCenter = create<CommandCenterState>()(
  persist(
    (set, get) => ({
      snoozedAlerts: {},
      resolvedAlerts: [],
      quickActions: DEFAULT_QUICK_ACTIONS,
      widgetVisibility: {},

      snoozeAlert: (id, hours) =>
        set((s) => ({
          snoozedAlerts: { ...s.snoozedAlerts, [id]: Date.now() + hours * 3600_000 },
        })),

      resolveAlert: (id) =>
        set((s) => ({
          resolvedAlerts: s.resolvedAlerts.includes(id) ? s.resolvedAlerts : [...s.resolvedAlerts, id],
        })),

      unsnoozeAlert: (id) =>
        set((s) => {
          const next = { ...s.snoozedAlerts };
          delete next[id];
          return { snoozedAlerts: next };
        }),

      isAlertActive: (id, now = Date.now()) => {
        const s = get();
        if (s.resolvedAlerts.includes(id)) return false;
        const snoozedUntil = s.snoozedAlerts[id];
        if (snoozedUntil && snoozedUntil > now) return false;
        return true;
      },

      clearResolvedAlerts: () => set({ resolvedAlerts: [] }),

      setQuickActions: (ids) => set({ quickActions: ids }),

      reorderQuickActions: (from, to) =>
        set((s) => {
          const next = [...s.quickActions];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return { quickActions: next };
        }),

      addQuickAction: (id) =>
        set((s) => (s.quickActions.includes(id) ? s : { quickActions: [...s.quickActions, id] })),

      removeQuickAction: (id) =>
        set((s) => ({ quickActions: s.quickActions.filter((a) => a !== id) })),

      setWidgetVisible: (id, visible) =>
        set((s) => ({ widgetVisibility: { ...s.widgetVisibility, [id]: visible } })),

      isWidgetVisible: (id) => {
        const v = get().widgetVisibility[id];
        return v === undefined ? true : v; // default visible
      },

      pinnedKpis: {},

      setSuiteTiles: (suite, ids) =>
        set((s) => ({ pinnedKpis: { ...s.pinnedKpis, [suite]: ids } })),

      addSuiteTile: (suite, id) =>
        set((s) => {
          const current = s.pinnedKpis[suite] ?? [];
          if (current.includes(id)) return s;
          return { pinnedKpis: { ...s.pinnedKpis, [suite]: [...current, id] } };
        }),

      removeSuiteTile: (suite, id) =>
        set((s) => ({
          pinnedKpis: { ...s.pinnedKpis, [suite]: (s.pinnedKpis[suite] ?? []).filter((x) => x !== id) },
        })),

      reorderSuiteTile: (suite, from, to) =>
        set((s) => {
          const current = [...(s.pinnedKpis[suite] ?? [])];
          const [moved] = current.splice(from, 1);
          current.splice(to, 0, moved);
          return { pinnedKpis: { ...s.pinnedKpis, [suite]: current } };
        }),
    }),
    { name: 'mcv-command-center' },
  ),
);
