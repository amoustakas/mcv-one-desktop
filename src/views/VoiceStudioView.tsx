/**
 * VoiceStudioView — Split panel voice experience.
 * Left: Voice Library carousel. Center: Conversation + orb. Right drawer: Bot Builder.
 */
import { useState, useCallback, useMemo } from 'react';
import { Settings, Mic, Terminal, ChevronRight } from 'lucide-react';
import VoiceCarousel from '../components/voice/VoiceCarousel';
import ConversationPanel from '../components/voice/ConversationPanel';
import AudioOrb3D from '../components/voice/AudioOrb3D';
import BotBuilder from '../components/voice/BotBuilder';
import FunctionCallConsole from '../components/voice/FunctionCallConsole';
import { useLiveAudio } from '../hooks/use-live-audio';
import { VOICE_DATA } from '../lib/google/voice-constants';
import type { BotConfig } from '../components/voice/BotBuilder';
import type { ToolCallEntry } from '../components/voice/FunctionCallConsole';
import type { LiveServerToolCall } from '@google/genai';

const DEFAULT_BOT: BotConfig = {
  name: 'NAOS Voice',
  systemPrompt: 'You are NAOS, an AI operations agent for MCV Global Consortium. You speak with authority, precision, and warmth. Help the user with anything they need.',
  voiceName: 'Puck',
  enableFunctionCalling: false,
  toolDefinitions: '[]',
};

export default function VoiceStudioView() {
  const [botConfig, setBotConfig] = useState<BotConfig>(DEFAULT_BOT);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCallEntry[]>([]);

  // Parse tools from config
  const parsedTools = useMemo(() => {
    if (!botConfig.enableFunctionCalling) return undefined;
    try {
      const defs = JSON.parse(botConfig.toolDefinitions);
      return Array.isArray(defs) && defs.length > 0
        ? [{ functionDeclarations: defs }]
        : undefined;
    } catch {
      return undefined;
    }
  }, [botConfig.enableFunctionCalling, botConfig.toolDefinitions]);

  const apiKey = import.meta.env.VITE_GOOGLE_AI_KEY || '';

  const handleToolCall = useCallback((call: LiveServerToolCall) => {
    const fns = call.functionCalls ?? [];
    for (const fn of fns) {
      setToolCalls(prev => [...prev, {
        id: fn.id ?? crypto.randomUUID(),
        name: fn.name ?? 'unknown',
        args: (fn.args ?? {}) as Record<string, unknown>,
        status: 'pending',
        timestamp: new Date(),
      }]);
    }
    setConsoleOpen(true);
  }, []);

  const liveAudio = useLiveAudio({
    apiKey,
    voiceName: botConfig.voiceName,
    systemPrompt: botConfig.systemPrompt,
    tools: parsedTools,
    onToolCall: handleToolCall,
  });

  const handleToggleRecording = useCallback(() => {
    if (liveAudio.isRecording) {
      liveAudio.stopRecording();
    } else {
      liveAudio.startRecording();
    }
  }, [liveAudio]);

  const handleConnect = useCallback(() => {
    liveAudio.connect();
  }, [liveAudio]);

  const handleDisconnect = useCallback(() => {
    liveAudio.disconnect();
  }, [liveAudio]);

  const handleSaveBot = useCallback(() => {
    // Persist to localStorage
    try {
      localStorage.setItem('mcv-voice-bot-config', JSON.stringify(botConfig));
    } catch { /* ignore quota errors */ }
  }, [botConfig]);

  const handleResetBot = useCallback(() => {
    setBotConfig(DEFAULT_BOT);
    localStorage.removeItem('mcv-voice-bot-config');
  }, []);

  // Resolve selected voice name for display
  const selectedVoice = VOICE_DATA.find(v => v.name === botConfig.voiceName);

  return (
    <div className="vs-root">
      {/* Left Panel: Voice Library */}
      <div className="vs-left-panel">
        <div className="vs-panel-header">
          <Mic size={14} className="vs-panel-icon" />
          <span className="vs-panel-title">Voice Library</span>
          <span className="vs-panel-count">{VOICE_DATA.length}</span>
        </div>
        <VoiceCarousel
          selectedVoice={botConfig.voiceName}
          onSelectVoice={name => setBotConfig(prev => ({ ...prev, voiceName: name }))}
        />
      </div>

      {/* Center Panel: Conversation */}
      <div className="vs-center-panel">
        <ConversationPanel
          transcript={liveAudio.transcript}
          status={liveAudio.status}
          isRecording={liveAudio.isRecording}
          inputVolume={liveAudio.inputVolume}
          outputVolume={liveAudio.outputVolume}
          onToggleRecording={handleToggleRecording}
          onSendText={liveAudio.sendText}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          orbSlot={
            <AudioOrb3D
              inputVolume={liveAudio.inputVolume}
              outputVolume={liveAudio.outputVolume}
            />
          }
        />

        {/* Function Call Console (collapsible bottom) */}
        {consoleOpen && botConfig.enableFunctionCalling && (
          <div className="vs-console-pane">
            <FunctionCallConsole calls={toolCalls} />
          </div>
        )}
      </div>

      {/* Right Drawer Toggle */}
      <button
        className="vs-drawer-toggle"
        onClick={() => setDrawerOpen(!drawerOpen)}
        title={drawerOpen ? 'Close settings' : 'Open settings'}
        type="button"
      >
        {drawerOpen ? <ChevronRight size={14} /> : <Settings size={14} />}
      </button>

      {/* Function Console Toggle */}
      {botConfig.enableFunctionCalling && (
        <button
          className={`vs-console-toggle ${consoleOpen ? 'vs-console-toggle--active' : ''}`}
          onClick={() => setConsoleOpen(!consoleOpen)}
          title="Toggle function call console"
          type="button"
        >
          <Terminal size={14} />
        </button>
      )}

      {/* Right Panel: Bot Builder Drawer */}
      {drawerOpen && (
        <div className="vs-right-panel">
          <BotBuilder
            config={botConfig}
            onChange={setBotConfig}
            onSave={handleSaveBot}
            onReset={handleResetBot}
          />
        </div>
      )}

      {/* Selected Voice Indicator */}
      {selectedVoice && (
        <div className="vs-voice-indicator">
          <img
            className="vs-voice-indicator-img"
            src={selectedVoice.imageUrl}
            alt={selectedVoice.name}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="vs-voice-indicator-name">{selectedVoice.name}</span>
        </div>
      )}

      <style>{`
        .vs-root {
          display: flex;
          height: 100%;
          overflow: hidden;
          position: relative;
          background: var(--bg-deep);
        }

        /* ── Left Panel ── */
        .vs-left-panel {
          width: 320px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          border-right: 1px solid var(--glass-border);
          overflow: hidden;
        }

        .vs-panel-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .vs-panel-icon {
          color: var(--cyan);
        }

        .vs-panel-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .vs-panel-count {
          margin-left: auto;
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          background: var(--bg-surface);
          padding: 1px 6px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border);
        }

        /* ── Center Panel ── */
        .vs-center-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }

        .vs-console-pane {
          height: 220px;
          flex-shrink: 0;
          border-top: 1px solid var(--border);
        }

        /* ── Right Drawer ── */
        .vs-right-panel {
          width: 320px;
          flex-shrink: 0;
          overflow: hidden;
          animation: vsSlideIn 0.2s ease;
        }

        @keyframes vsSlideIn {
          from { width: 0; opacity: 0; }
          to { width: 320px; opacity: 1; }
        }

        /* ── Drawer Toggle ── */
        .vs-drawer-toggle {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all var(--transition-fast);
        }

        .vs-drawer-toggle:hover {
          color: var(--cyan);
          border-color: var(--border-active);
        }

        /* ── Console Toggle ── */
        .vs-console-toggle {
          position: absolute;
          bottom: 80px;
          right: 12px;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all var(--transition-fast);
        }

        .vs-console-toggle:hover {
          color: var(--cyan);
          border-color: var(--border-active);
        }

        .vs-console-toggle--active {
          color: var(--cyan);
          border-color: rgba(0, 240, 255, 0.25);
          background: rgba(0, 240, 255, 0.05);
        }

        /* ── Voice Indicator ── */
        .vs-voice-indicator {
          position: absolute;
          bottom: 80px;
          left: 332px;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: 4px 10px 4px 4px;
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          z-index: 5;
        }

        .vs-voice-indicator-img {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--border);
        }

        .vs-voice-indicator-name {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .vs-left-panel {
            width: 260px;
          }

          .vs-right-panel {
            width: 280px;
          }

          @keyframes vsSlideIn {
            from { width: 0; opacity: 0; }
            to { width: 280px; opacity: 1; }
          }
        }

        @media (max-width: 768px) {
          .vs-root {
            flex-direction: column;
          }

          .vs-left-panel {
            width: 100%;
            height: 200px;
            border-right: none;
            border-bottom: 1px solid var(--glass-border);
          }

          .vs-right-panel {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            width: 300px;
            z-index: 20;
            box-shadow: -8px 0 32px rgba(0, 0, 0, 0.5);
          }

          @keyframes vsSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }

          .vs-voice-indicator {
            left: 12px;
            bottom: 80px;
          }

          .vs-console-pane {
            height: 180px;
          }
        }
      `}</style>
    </div>
  );
}
