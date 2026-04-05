import { create } from 'zustand';

export interface VoiceTranscriptEntry {
  text: string;
  isInput: boolean;
  timestamp: Date;
}

export interface ToolCallEntry {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: 'pending' | 'executing' | 'done' | 'error';
  result?: unknown;
  timestamp: Date;
}

interface VoiceSessionState {
  isConnected: boolean;
  isRecording: boolean;
  selectedVoice: string;
  systemPrompt: string;
  functionCallingEnabled: boolean;
  transcript: VoiceTranscriptEntry[];
  toolCalls: ToolCallEntry[];
  inputVolume: number;
  outputVolume: number;

  setConnected: (v: boolean) => void;
  setRecording: (v: boolean) => void;
  setSelectedVoice: (v: string) => void;
  setSystemPrompt: (v: string) => void;
  setFunctionCallingEnabled: (v: boolean) => void;
  addTranscript: (entry: VoiceTranscriptEntry) => void;
  clearTranscript: () => void;
  addToolCall: (entry: ToolCallEntry) => void;
  updateToolCall: (id: string, update: Partial<ToolCallEntry>) => void;
  setInputVolume: (v: number) => void;
  setOutputVolume: (v: number) => void;
  reset: () => void;
}

export const useVoiceSession = create<VoiceSessionState>((set) => ({
  isConnected: false,
  isRecording: false,
  selectedVoice: 'Zephyr',
  systemPrompt: '',
  functionCallingEnabled: false,
  transcript: [],
  toolCalls: [],
  inputVolume: 0,
  outputVolume: 0,

  setConnected: (v) => set({ isConnected: v }),
  setRecording: (v) => set({ isRecording: v }),
  setSelectedVoice: (v) => set({ selectedVoice: v }),
  setSystemPrompt: (v) => set({ systemPrompt: v }),
  setFunctionCallingEnabled: (v) => set({ functionCallingEnabled: v }),
  addTranscript: (entry) => set((s) => ({ transcript: [...s.transcript, entry] })),
  clearTranscript: () => set({ transcript: [] }),
  addToolCall: (entry) => set((s) => ({ toolCalls: [...s.toolCalls, entry] })),
  updateToolCall: (id, update) => set((s) => ({
    toolCalls: s.toolCalls.map((tc) => tc.id === id ? { ...tc, ...update } : tc),
  })),
  setInputVolume: (v) => set({ inputVolume: v }),
  setOutputVolume: (v) => set({ outputVolume: v }),
  reset: () => set({
    isConnected: false, isRecording: false, transcript: [], toolCalls: [],
    inputVolume: 0, outputVolume: 0,
  }),
}));
