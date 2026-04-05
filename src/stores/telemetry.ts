import { create } from 'zustand';
import type { TelemetryEvent, ReasoningStep } from '../lib/kits/types';

// ---------------------------------------------------------------------------
// Telemetry Store — ring-buffer event log + reasoning trace for Control Room
// ---------------------------------------------------------------------------

const MAX_EVENTS = 500;

interface SessionTokens {
  input: number;
  output: number;
  cached: number;
}

interface TelemetryState {
  events: TelemetryEvent[];
  reasoningSteps: ReasoningStep[];
  sessionTokens: SessionTokens;
  sessionCost: number;
  isRecording: boolean;

  recordEvent: (event: TelemetryEvent) => void;
  addReasoningStep: (step: ReasoningStep) => void;
  clearSession: () => void;
  toggleRecording: () => void;
  getEventsByType: (type: TelemetryEvent['type']) => TelemetryEvent[];
  getCostBreakdown: () => { model: string; cost: number }[];
}

export const useTelemetry = create<TelemetryState>()((set, get) => ({
  events: [],
  reasoningSteps: [],
  sessionTokens: { input: 0, output: 0, cached: 0 },
  sessionCost: 0,
  isRecording: true,

  recordEvent: (event) =>
    set((s) => {
      if (!s.isRecording) return s;

      // Ring buffer: drop oldest when full
      const events = [...s.events, event].slice(-MAX_EVENTS);

      // Update session token counters
      const tokens = { ...s.sessionTokens };
      let cost = s.sessionCost;

      if (event.usage) {
        tokens.input += event.usage.promptTokenCount;
        tokens.output += event.usage.candidatesTokenCount;
        tokens.cached += event.usage.cachedContentTokenCount ?? 0;
      }
      if (event.costEstimate) {
        cost += event.costEstimate;
      }

      return { events, sessionTokens: tokens, sessionCost: cost };
    }),

  addReasoningStep: (step) =>
    set((s) => {
      if (!s.isRecording) return s;
      return { reasoningSteps: [...s.reasoningSteps, step] };
    }),

  clearSession: () =>
    set({
      events: [],
      reasoningSteps: [],
      sessionTokens: { input: 0, output: 0, cached: 0 },
      sessionCost: 0,
    }),

  toggleRecording: () =>
    set((s) => ({ isRecording: !s.isRecording })),

  getEventsByType: (type) =>
    get().events.filter((e) => e.type === type),

  getCostBreakdown: () => {
    const map = new Map<string, number>();
    for (const e of get().events) {
      if (e.model && e.costEstimate) {
        map.set(e.model, (map.get(e.model) ?? 0) + e.costEstimate);
      }
    }
    return Array.from(map, ([model, cost]) => ({ model, cost }));
  },
}));
