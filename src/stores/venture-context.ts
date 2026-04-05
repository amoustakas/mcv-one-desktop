import { create } from 'zustand';

export interface VentureHealth {
  ventureId: string;
  overall: number; // 0-100
  github: number;
  deploys: number;
  tasks: number;
  crm: number;
  lastUpdated: string;
}

export interface VentureContext {
  id: string;
  name: string;
  color: string;
  status: 'active' | 'building' | 'paused' | 'archived';
  health: VentureHealth | null;
  featureFlags: Record<string, boolean>;
  teamCount: number;
  lastActivity: string | null;
}

interface VentureContextState {
  ventures: Record<string, VentureContext>;
  activeVentureContext: VentureContext | null;

  setVentureContext: (ventureId: string, context: Partial<VentureContext>) => void;
  setActiveVenture: (context: VentureContext | null) => void;
  updateHealth: (ventureId: string, health: VentureHealth) => void;
  setFeatureFlag: (ventureId: string, flag: string, value: boolean) => void;
}

export const useVentureContextStore = create<VentureContextState>()((set) => ({
  ventures: {},
  activeVentureContext: null,

  setVentureContext: (ventureId, context) =>
    set((s) => ({
      ventures: {
        ...s.ventures,
        [ventureId]: { ...s.ventures[ventureId], ...context } as VentureContext,
      },
    })),

  setActiveVenture: (context) =>
    set({ activeVentureContext: context }),

  updateHealth: (ventureId, health) =>
    set((s) => {
      const existing = s.ventures[ventureId];
      if (!existing) return s;
      return {
        ventures: {
          ...s.ventures,
          [ventureId]: { ...existing, health },
        },
      };
    }),

  setFeatureFlag: (ventureId, flag, value) =>
    set((s) => {
      const existing = s.ventures[ventureId];
      if (!existing) return s;
      return {
        ventures: {
          ...s.ventures,
          [ventureId]: {
            ...existing,
            featureFlags: { ...existing.featureFlags, [flag]: value },
          },
        },
      };
    }),
}));
