import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, User, Trash2, Plus, Mic, MicOff, Volume2, Square } from 'lucide-react';
import { streamMessage, type ChatMessage } from '../lib/claude';
import { handleCommand } from '../lib/commands';
import { isRecordingSupported, startRecording, stopRecording, speakText, stopSpeaking } from '../lib/voice';
import { type Venture } from '../lib/ventures';
import {
  supabase,
  getConversations,
  createConversation,
  getMessages,
  saveMessage,
  deleteConversation,
  type DbConversation,
} from '../lib/supabase';
import { useUser } from '../lib/auth';
import { useKitStore } from '../stores/kits';
import { useChatStore } from '../stores/chat';
import { AgentOrchestrator } from '../lib/kits/orchestrator';
import ToolCallIndicator from './ToolCallIndicator';
import Markdown from './Markdown';
import FileDropzone from './FileDropzone';
import FileAttachmentBar from './FileAttachmentBar';
// @ts-expect-error parallel session feature
import ThinkingIndicator from './chat/ThinkingIndicator';
// @ts-expect-error parallel session feature
import MessageActions from './chat/MessageActions';
// @ts-expect-error parallel session feature
import ArtifactsPanel from './chat/ArtifactsPanel';
// @ts-expect-error parallel session feature
import ReasoningTrace from './chat/ReasoningTrace';
import { useFileBridge } from '../stores/file-bridge';
import { useArtifactStore } from '../stores/artifacts';
import { mediaIngestion } from '../lib/google/file-bridge';
import { parseArtifacts } from '../lib/artifact-parser';

/** Tracks a tool call in progress or completed */
interface ToolCallStatus {
  id: string;
  name: string;
  status: 'running' | 'done' | 'error';
  result?: string;
}

interface AegisChatProps {
  venture: Venture;
  docked?: boolean;
}

// localStorage fallback when Supabase isn't connected
function loadLocal(ventureId: string, convId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`naos-${ventureId}-${convId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocal(ventureId: string, convId: string, msgs: ChatMessage[]) {
  localStorage.setItem(`naos-${ventureId}-${convId}`, JSON.stringify(msgs.slice(-200)));
}

function loadConvList(ventureId: string): { id: string; title: string }[] {
  try {
    const raw = localStorage.getItem(`naos-convs-${ventureId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveConvList(ventureId: string, convs: { id: string; title: string }[]) {
  localStorage.setItem(`naos-convs-${ventureId}`, JSON.stringify(convs));
}

export default function AegisChat({ venture, docked = false }: AegisChatProps) {
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addArtifacts } = useArtifactStore();

  const useDb = !!supabase;
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCallStatus[]>([]);
  const hasVoice = isRecordingSupported();
  const { user } = useUser();

  // Sync local state to global chat store for cross-component access
  const chatStore = useChatStore();
  useEffect(() => {
    chatStore.setMessages(messages);
    chatStore.setActiveConversation(activeConvId);
    chatStore.setStreaming(loading);
    chatStore.setStreamingText(streamingText);
  }, [messages, activeConvId, loading, streamingText]); // eslint-disable-line react-hooks/exhaustive-deps

  // Kit system — initialize on mount and get tools for current venture
  const { initBuiltins, getLoadedKits } = useKitStore();
  useEffect(() => { initBuiltins(); }, [initBuiltins]);

  async function handleMicToggle() {
    if (recording) {
      try {
        const transcript = await stopRecording();
        setRecording(false);
        if (transcript) setInput((prev) => prev + (prev ? ' ' : '') + transcript);
      } catch {
        setRecording(false);
      }
    } else {
      try {
        await startRecording();
        setRecording(true);
      } catch {
        // mic permission denied or not supported
      }
    }
  }

  async function handleSpeak(text: string) {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    try {
      await speakText(text);
    } catch {
      // TTS not configured
    } finally {
      setSpeaking(false);
    }
  }

  // Load conversations for this venture
  const loadConversations = useCallback(async () => {
    if (useDb) {
      const dbConvs = await getConversations(venture.id);
      const mapped = dbConvs.map((c: DbConversation) => ({ id: c.id, title: c.title }));
      setConversations(mapped);
      return mapped;
    }
    const local = loadConvList(venture.id);
    setConversations(local);
    return local;
  }, [venture.id, useDb]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (convId: string) => {
    if (useDb) {
      const dbMsgs = await getMessages(convId);
      const mapped = dbMsgs.map((m) => ({ role: m.role, content: m.content }));
      setMessages(mapped);
      return;
    }
    setMessages(loadLocal(venture.id, convId));
  }, [venture.id, useDb]);

  // On venture change, reload conversations
  useEffect(() => {
    setStreamingText('');
    setMessages([]);
    setActiveConvId(null);
    loadConversations().then((convs) => {
      if (convs.length > 0) {
        setActiveConvId(convs[0].id);
      }
    });
  }, [venture.id, loadConversations]);

  // On active conversation change, load messages
  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  async function handleNewChat() {
    const title = 'New Chat';
    if (useDb) {
      const conv = await createConversation(venture.id, title);
      if (conv) {
        setConversations((prev) => [{ id: conv.id, title: conv.title }, ...prev]);
        setActiveConvId(conv.id);
        setMessages([]);
      }
    } else {
      const id = crypto.randomUUID();
      const convs = [{ id, title }, ...conversations];
      saveConvList(venture.id, convs);
      setConversations(convs);
      setActiveConvId(id);
      setMessages([]);
    }
  }

  async function handleDeleteConv(convId: string) {
    if (useDb) {
      await deleteConversation(convId);
    } else {
      localStorage.removeItem(`naos-${venture.id}-${convId}`);
      const convs = conversations.filter((c) => c.id !== convId);
      saveConvList(venture.id, convs);
    }
    const remaining = conversations.filter((c) => c.id !== convId);
    setConversations(remaining);
    if (activeConvId === convId) {
      setActiveConvId(remaining[0]?.id ?? null);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    // Check for slash commands first
    if (text.startsWith('/')) {
      setInput('');
      setLoading(true);
      const userMsg: ChatMessage = { role: 'user', content: text };
      setMessages((prev) => [...prev, userMsg]);
      try {
        const result = await handleCommand(text);
        if (result.handled) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: result.response || 'Command executed.' },
          ]);
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to Claude if command fails
      }
      // Remove the user message we added — it'll be re-added below
      setMessages((prev) => prev.slice(0, -1));
      setLoading(false);
    }

    // Auto-create conversation if none exists
    let convId = activeConvId;
    if (!convId) {
      const title = text.slice(0, 60) + (text.length > 60 ? '...' : '');
      if (useDb) {
        const conv = await createConversation(venture.id, title);
        if (conv) {
          convId = conv.id;
          setConversations((prev) => [{ id: conv.id, title: conv.title }, ...prev]);
          setActiveConvId(conv.id);
        }
      } else {
        convId = crypto.randomUUID();
        const convs = [{ id: convId, title }, ...conversations];
        saveConvList(venture.id, convs);
        setConversations(convs);
        setActiveConvId(convId);
      }
    }
    if (!convId) return;

    // Auto-rename "New Chat" to first message
    const conv = conversations.find((c) => c.id === convId);
    if (conv?.title === 'New Chat') {
      const newTitle = text.slice(0, 60) + (text.length > 60 ? '...' : '');
      setConversations((prev) =>
        prev.map((c) => c.id === convId ? { ...c, title: newTitle } : c)
      );
      if (!useDb) {
        const convs = conversations.map((c) => c.id === convId ? { ...c, title: newTitle } : c);
        saveConvList(venture.id, convs);
      }
    }

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setStreamingText('');
    setIsThinking(true);

    // Persist user message
    if (useDb) {
      await saveMessage(convId, 'user', text);
    } else {
      saveLocal(venture.id, convId, newMessages);
    }

    try {
      const loadedKits = getLoadedKits();

      let full: string;
      let toolCallLog: Array<{ id: string; name: string; input: unknown }> = [];
      // Use orchestrator when any kits are loaded (meta-tools are always available)
      if (loadedKits.length > 0) {
        // Use Agent Orchestrator for tool-calling path
        setActiveToolCalls([]);

        const orchestrator = new AgentOrchestrator({
          kits: loadedKits,
          ventureId: venture.id,
          systemPrompt: venture.systemPrompt,
          context: {
            userId: user?.id ?? '',
            ventureId: venture.id,
            conversationId: convId!,
            fetch: globalThis.fetch,
          },
        });

        try {
          const activeFiles = useFileBridge.getState().getActiveFiles();
          const result = await orchestrator.processMessage(
            newMessages,
            {
              onText: (partial) => { setIsThinking(false); setStreamingText(partial); },
              onToolCall: (tc) => { setIsThinking(false);
                setActiveToolCalls((prev) => [
                  ...prev,
                  { id: tc.id, name: tc.name, status: 'running' },
                ]);
              },
              onToolResult: (toolCallId, result) => {
                setActiveToolCalls((prev) =>
                  prev.map((tc) =>
                    tc.id === toolCallId
                      ? { ...tc, status: result.success ? 'done' : 'error', result: result.displayMarkdown || result.error }
                      : tc,
                  ),
                );
              },
            },
            5, // maxToolRounds
            activeFiles.length > 0 ? activeFiles : undefined,
          );
          full = result.text;
          toolCallLog = result.toolCalls.map((tc) => ({ id: tc.id, name: tc.name, input: tc.input }));
        } catch (orchErr) {
          // Orchestrator had no tools for this venture — fall back to plain streaming
          full = await streamMessage(
            newMessages,
            venture.systemPrompt,
            (partial) => { setIsThinking(false); setStreamingText(partial); },
          );
        }
      } else {
        // Fallback to plain streaming (no kits loaded)
        full = await streamMessage(
          newMessages,
          venture.systemPrompt,
          (partial) => { setIsThinking(false); setStreamingText(partial); },
        );
      }

      // Parse artifacts from the response
      const newArtifacts = parseArtifacts(full, messages.length);
      if (newArtifacts.length > 0) addArtifacts(newArtifacts);

      const finalMessages: ChatMessage[] = [...newMessages, { role: 'assistant' as const, content: full }];
      setMessages(finalMessages);
      setStreamingText('');
      setActiveToolCalls([]);

      // Persist assistant message (with tool call metadata if any)
      if (useDb) {
        const metadata = toolCallLog.length > 0 ? { tool_calls: toolCallLog } : undefined;
        await saveMessage(convId, 'assistant', full, metadata);
      } else {
        saveLocal(venture.id, convId, finalMessages);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      const errMessages: ChatMessage[] = [...newMessages, { role: 'assistant' as const, content: `**Error:** ${errorMsg}` }];
      setMessages(errMessages);
      setStreamingText('');
      setActiveToolCalls([]);
      if (!useDb) saveLocal(venture.id, convId!, errMessages);
    } finally {
      setLoading(false);
      setIsThinking(false);
    }
  }

  function handleRegenerate() {
    if (messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg || typeof lastUserMsg.content !== 'string') return;
    setMessages((prev) => prev.slice(0, -1));
    setInput(typeof lastUserMsg.content === 'string' ? lastUserMsg.content : '');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-layout">
      {/* Conversation sidebar — hidden when docked */}
      {!docked && <div className="conv-sidebar">
        <button className="conv-new-btn" onClick={handleNewChat}>
          <Plus size={14} />
          <span>New Chat</span>
        </button>
        <div className="conv-scroll">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`conv-row ${activeConvId === c.id ? 'active' : ''}`}
              onClick={() => setActiveConvId(c.id)}
            >
              <span className="conv-row-title">{c.title}</span>
              <button
                className="conv-row-del"
                onClick={(e) => { e.stopPropagation(); handleDeleteConv(c.id); }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>}

      {/* Chat area */}
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && !streamingText && (
            <div className="chat-empty">
              <div className="chat-empty-icon" style={{ color: venture.color }}>
                {venture.icon}
              </div>
              <h2 className="chat-empty-title">
                Aegis <span style={{ color: venture.color }}>&middot;</span> {venture.name}
              </h2>
              <p className="chat-empty-sub">{venture.tagline}</p>
              <p className="chat-empty-hint">Ask me anything about {venture.name}.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`} style={{ position: 'relative' }}>
              <div className="chat-msg-avatar">
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="chat-msg-content">
                <div className="chat-msg-header">
                  <span className="chat-msg-name">
                    {msg.role === 'user' ? 'You' : 'Aegis'}
                  </span>
                  {msg.role === 'assistant' && (
                    <button
                      className="chat-tts-btn"
                      onClick={() => handleSpeak(typeof msg.content === 'string' ? msg.content : '')}
                      aria-label={speaking ? 'Stop speaking' : 'Read aloud'}
                    >
                      {speaking ? <Square size={10} /> : <Volume2 size={12} />}
                    </button>
                  )}
                </div>
                <div className="chat-msg-text">
                  {msg.role === 'assistant' ? <Markdown content={typeof msg.content === 'string' ? msg.content : ''} /> : (typeof msg.content === 'string' ? msg.content : '')}
                </div>
                {/* Reasoning trace for assistant messages */}
                {msg.role === 'assistant' && i === messages.length - 1 && <ReasoningTrace />}
              </div>
              {/* Message actions (hover toolbar) */}
              <MessageActions
                role={msg.role}
                content={typeof msg.content === 'string' ? msg.content : ''}
                isLast={i === messages.length - 1}
                onRegenerate={msg.role === 'assistant' && i === messages.length - 1 ? handleRegenerate : undefined}
                onEdit={msg.role === 'user' ? () => setInput(typeof msg.content === 'string' ? msg.content : '') : undefined}
              />
            </div>
          ))}

          {/* Tool call indicators */}
          {activeToolCalls.length > 0 && (
            <div className="tool-calls-area">
              {activeToolCalls.map((tc) => (
                <ToolCallIndicator
                  key={tc.id}
                  name={tc.name}
                  status={tc.status}
                  result={tc.result}
                />
              ))}
            </div>
          )}

          {/* Thinking indicator — before first token */}
          {isThinking && !streamingText && activeToolCalls.length === 0 && (
            <ThinkingIndicator />
          )}

          {streamingText && (
            <div className="chat-msg assistant">
              <div className="chat-msg-avatar"><Bot size={16} /></div>
              <div className="chat-msg-content">
                <div className="chat-msg-name">Aegis</div>
                <div className="chat-msg-text">
                  <Markdown content={streamingText} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <FileAttachmentBar
            files={useFileBridge.getState().uploadedFiles}
            onRemove={(fileId) => mediaIngestion.deleteFile(fileId)}
          />
          <div className="chat-input-wrap">
            <FileDropzone
              onFiles={async (files) => {
                for (const f of files) {
                  try { await mediaIngestion.upload(f); } catch { /* store tracks failure */ }
                }
              }}
              disabled={loading}
            />
            {hasVoice && (
              <button
                className={`chat-voice-btn ${recording ? 'recording' : ''}`}
                onClick={handleMicToggle}
                aria-label={recording ? 'Stop recording' : 'Start recording'}
              >
                {recording ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
            <textarea
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={recording ? 'Listening...' : `Message Aegis (${venture.name})...`}
              rows={1}
              disabled={loading}
            />
            <button
              className="chat-send"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            </button>
          </div>
          <div className="chat-footer-row">
            <p className="chat-disclaimer">
              Powered by Claude &middot; {useDb ? 'Synced' : 'Local only'}
            </p>
          </div>
        </div>
      </div>

      {/* Artifacts side panel */}
      <ArtifactsPanel />

      <style>{`
        .chat-layout {
          display: flex;
          height: 100%;
          overflow: hidden;
        }

        /* Conversation sidebar */
        .conv-sidebar {
          width: 220px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
        }

        .conv-new-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          margin: var(--space-sm);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--cyan);
          border: 1px dashed var(--border-active);
          transition: all var(--transition-fast);
        }

        .conv-new-btn:hover {
          background: var(--bg-card);
          border-style: solid;
        }

        .conv-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 0 var(--space-sm) var(--space-sm);
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .conv-row {
          display: flex;
          align-items: center;
          padding: 7px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .conv-row:hover { background: var(--bg-card); }

        .conv-row.active {
          background: var(--bg-elevated);
          border: 1px solid var(--border-active);
        }

        .conv-row-title {
          flex: 1;
          font-size: var(--text-xs);
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .conv-row.active .conv-row-title { color: var(--text-primary); }

        .conv-row-del {
          opacity: 0;
          padding: 3px;
          border-radius: 3px;
          color: var(--text-muted);
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }

        .conv-row:hover .conv-row-del { opacity: 1; }
        .conv-row-del:hover { color: var(--error); background: rgba(239,68,68,0.1); }

        /* Chat area */
        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          text-align: center;
          padding: var(--space-2xl);
        }

        .chat-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-3xl);
          font-weight: 800;
          background: var(--bg-card);
          border: 1px solid var(--border);
          margin-bottom: var(--space-md);
        }

        .chat-empty-title { font-size: var(--text-2xl); font-weight: 700; }
        .chat-empty-sub { font-size: var(--text-sm); color: var(--text-secondary); }
        .chat-empty-hint { font-size: var(--text-sm); color: var(--text-muted); margin-top: var(--space-lg); }

        .chat-msg {
          display: flex;
          gap: var(--space-sm);
          max-width: 800px;
        }

        .chat-msg.user { align-self: flex-end; flex-direction: row-reverse; }

        .chat-msg-avatar {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }

        .chat-msg.assistant .chat-msg-avatar { color: var(--cyan); border-color: rgba(0,245,255,0.15); }

        .chat-msg-content { display: flex; flex-direction: column; gap: 3px; min-width: 0; }

        .chat-msg-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .chat-msg-name {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .chat-tts-btn {
          opacity: 0;
          padding: 2px;
          border-radius: 3px;
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }
        .chat-msg:hover .chat-tts-btn { opacity: 1; }
        .chat-tts-btn:hover { color: var(--cyan); background: rgba(0,245,255,0.1); }

        .chat-msg.user .chat-msg-header { justify-content: flex-end; }

        .chat-voice-btn {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        .chat-voice-btn:hover { color: var(--text-primary); background: var(--bg-card); }
        .chat-voice-btn.recording {
          color: var(--error);
          background: rgba(239,68,68,0.1);
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .chat-msg-text {
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          line-height: 1.6;
          word-break: break-word;
        }

        .chat-msg.user .chat-msg-text {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          font-size: var(--text-sm);
          white-space: pre-wrap;
        }

        .chat-msg.assistant .chat-msg-text {
          background: var(--bg-card);
          border: 1px solid var(--border);
        }

        .chat-input-area {
          padding: var(--space-sm) var(--space-lg);
          border-top: 1px solid var(--border);
          background: var(--bg-surface);
        }

        .chat-input-wrap {
          display: flex;
          align-items: flex-end;
          gap: var(--space-sm);
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-sm);
          transition: border-color var(--transition-fast);
        }

        .chat-input-wrap:focus-within { border-color: var(--border-active); }

        .chat-input {
          flex: 1;
          resize: none;
          border: none;
          background: transparent;
          padding: var(--space-xs) var(--space-sm);
          font-size: var(--text-sm);
          color: var(--text-primary);
          max-height: 120px;
          line-height: 1.5;
        }

        .chat-input:focus { outline: none; border: none; }

        .chat-send {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cyan);
          color: var(--bg-deep);
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .chat-send:hover:not(:disabled) { background: var(--cyan-dim); }
        .chat-send:disabled { opacity: 0.3; cursor: not-allowed; }

        .chat-footer-row {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 6px;
        }

        .chat-disclaimer { font-size: 10px; color: var(--text-muted); }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        /* Tool call indicators */
        .tool-calls-area {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 800px;
          padding-left: 38px;
        }

        @media (max-width: 768px) {
          .conv-sidebar { display: none; }
          .chat-messages { padding: var(--space-md); }
          .chat-input-area { padding: var(--space-sm) var(--space-md); }
        }
      `}</style>
    </div>
  );
}
