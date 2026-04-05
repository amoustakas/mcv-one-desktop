import { create } from 'zustand';
import type { ChatMessage } from '../lib/claude';
import type { DbConversation } from '../lib/supabase';

interface ChatState {
  // Conversation
  activeConversationId: string | null;
  conversations: DbConversation[];
  messages: ChatMessage[];

  // UI state
  isStreaming: boolean;
  streamingText: string;
  inputText: string;

  // Actions
  setActiveConversation: (id: string | null) => void;
  setConversations: (conversations: DbConversation[]) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setStreaming: (isStreaming: boolean) => void;
  setStreamingText: (text: string) => void;
  setInputText: (text: string) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  activeConversationId: null,
  conversations: [],
  messages: [],
  isStreaming: false,
  streamingText: '',
  inputText: '',

  setActiveConversation: (id) => set({ activeConversationId: id }),
  setConversations: (conversations) => set({ conversations }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setStreamingText: (text) => set({ streamingText: text }),
  setInputText: (text) => set({ inputText: text }),
  clearChat: () => set({ messages: [], streamingText: '', activeConversationId: null }),
}));
