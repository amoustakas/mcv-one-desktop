/**
 * ConversationPanel — Transcript display + mic controls + volume meters.
 * Center panel of the Voice Studio view.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Volume2, Wifi, WifiOff, Loader2 } from 'lucide-react';

export interface TranscriptEntry {
  text: string;
  isInput: boolean;
  timestamp: Date;
}

interface ConversationPanelProps {
  transcript: TranscriptEntry[];
  status: 'disconnected' | 'connecting' | 'connected';
  isRecording: boolean;
  inputVolume: number;
  outputVolume: number;
  onToggleRecording: () => void;
  onSendText: (text: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  orbSlot?: React.ReactNode;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function VolumeMeter({ volume, label, icon: Icon }: { volume: number; label: string; icon: typeof Volume2 }) {
  return (
    <div className="cp-meter" title={label}>
      <Icon size={12} className="cp-meter-icon" />
      <div className="cp-meter-track">
        <div
          className="cp-meter-fill"
          style={{ width: `${Math.min(volume * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function ConversationPanel({
  transcript,
  status,
  isRecording,
  inputVolume,
  outputVolume,
  onToggleRecording,
  onSendText,
  onConnect,
  onDisconnect,
  orbSlot,
}: ConversationPanelProps) {
  const [textInput, setTextInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript.length]);

  const handleSend = useCallback(() => {
    const trimmed = textInput.trim();
    if (!trimmed) return;
    onSendText(trimmed);
    setTextInput('');
  }, [textInput, onSendText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const isConnected = status === 'connected';

  return (
    <div className="cp-root">
      {/* Status Bar */}
      <div className="cp-status-bar">
        <div className={`cp-status-dot cp-status-dot--${status}`} />
        <span className="cp-status-text">
          {status === 'disconnected' && 'Disconnected'}
          {status === 'connecting' && 'Connecting...'}
          {status === 'connected' && 'Connected'}
        </span>

        <div className="cp-meters">
          <VolumeMeter volume={inputVolume} label="Input volume" icon={Mic} />
          <VolumeMeter volume={outputVolume} label="Output volume" icon={Volume2} />
        </div>

        <button
          className={`cp-connect-btn ${isConnected ? 'cp-connect-btn--connected' : ''}`}
          onClick={isConnected ? onDisconnect : onConnect}
          type="button"
        >
          {status === 'connecting'
            ? <Loader2 size={13} className="cp-spin" />
            : isConnected ? <WifiOff size={13} /> : <Wifi size={13} />
          }
          <span>{isConnected ? 'Disconnect' : 'Connect'}</span>
        </button>
      </div>

      {/* Orb + Transcript */}
      <div className="cp-conversation-area">
        {/* Orb visualization */}
        {orbSlot && (
          <div className="cp-orb-container">
            {orbSlot}
          </div>
        )}

        {/* Transcript */}
        <div className="cp-transcript" ref={scrollRef}>
          {transcript.length === 0 && (
            <div className="cp-empty">
              <Mic size={24} className="cp-empty-icon" />
              <span>Start a conversation</span>
              <span className="cp-empty-hint">Connect and speak, or type a message below</span>
            </div>
          )}

          {transcript.map((entry, i) => (
            <div
              key={i}
              className={`cp-message ${entry.isInput ? 'cp-message--input' : 'cp-message--output'}`}
            >
              <div className="cp-message-bubble">
                <span className="cp-message-text">{entry.text}</span>
                <span className="cp-message-time">{formatTime(entry.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="cp-controls">
        {/* Mic button */}
        <button
          className={`cp-mic-btn ${isRecording ? 'cp-mic-btn--recording' : ''}`}
          onClick={onToggleRecording}
          disabled={!isConnected}
          type="button"
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          {isRecording && <span className="cp-mic-pulse" />}
        </button>

        {/* Text input */}
        <div className="cp-input-row">
          <input
            className="cp-text-input"
            type="text"
            placeholder={isConnected ? 'Type a message...' : 'Connect to start chatting'}
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isConnected}
          />
          <button
            className="cp-send-btn"
            onClick={handleSend}
            disabled={!isConnected || !textInput.trim()}
            type="button"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      <style>{`
        .cp-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-deep);
          position: relative;
        }

        /* ── Status Bar ── */
        .cp-status-bar {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .cp-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .cp-status-dot--disconnected {
          background: var(--text-muted);
        }

        .cp-status-dot--connecting {
          background: var(--warning);
          animation: cpPulse 1.5s ease infinite;
        }

        .cp-status-dot--connected {
          background: var(--success);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }

        @keyframes cpPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .cp-status-text {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .cp-meters {
          display: flex;
          gap: var(--space-sm);
          margin-left: auto;
        }

        .cp-meter {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .cp-meter-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .cp-meter-track {
          width: 48px;
          height: 4px;
          background: var(--bg-surface);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .cp-meter-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--cyan), var(--purple));
          border-radius: var(--radius-full);
          transition: width 80ms ease-out;
        }

        .cp-connect-btn {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          padding: 4px 12px;
          border-radius: var(--radius-md);
          font-size: 11px;
          font-weight: 600;
          background: rgba(0, 240, 255, 0.08);
          border: 1px solid rgba(0, 240, 255, 0.2);
          color: var(--cyan);
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .cp-connect-btn:hover {
          background: rgba(0, 240, 255, 0.15);
        }

        .cp-connect-btn--connected {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.2);
          color: var(--error);
        }

        .cp-connect-btn--connected:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        @keyframes cpSpin {
          to { transform: rotate(360deg); }
        }

        .cp-spin {
          animation: cpSpin 1s linear infinite;
        }

        /* ── Conversation Area ── */
        .cp-conversation-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .cp-orb-container {
          flex-shrink: 0;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .cp-transcript {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-md);
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .cp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          height: 100%;
          color: var(--text-muted);
          font-size: 13px;
        }

        .cp-empty-icon {
          color: var(--text-muted);
          opacity: 0.4;
        }

        .cp-empty-hint {
          font-size: 11px;
          opacity: 0.6;
        }

        /* ── Messages ── */
        .cp-message {
          display: flex;
          max-width: 80%;
        }

        .cp-message--input {
          align-self: flex-end;
        }

        .cp-message--output {
          align-self: flex-start;
        }

        .cp-message-bubble {
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cp-message--input .cp-message-bubble {
          background: rgba(0, 240, 255, 0.08);
          border: 1px solid rgba(0, 240, 255, 0.12);
          border-bottom-right-radius: 4px;
        }

        .cp-message--output .cp-message-bubble {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-bottom-left-radius: 4px;
        }

        .cp-message-text {
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-primary);
        }

        .cp-message-time {
          font-size: 9px;
          color: var(--text-muted);
          align-self: flex-end;
        }

        /* ── Controls ── */
        .cp-controls {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-md);
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }

        .cp-mic-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 2px solid var(--border);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
          flex-shrink: 0;
        }

        .cp-mic-btn:hover:not(:disabled) {
          border-color: var(--cyan);
          color: var(--cyan);
          box-shadow: 0 0 16px rgba(0, 240, 255, 0.15);
        }

        .cp-mic-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .cp-mic-btn--recording {
          border-color: var(--error);
          color: var(--error);
          background: rgba(239, 68, 68, 0.08);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
        }

        .cp-mic-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid var(--error);
          opacity: 0;
          animation: cpMicPulse 1.5s ease infinite;
          pointer-events: none;
        }

        @keyframes cpMicPulse {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .cp-input-row {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 4px 4px 4px 14px;
          transition: border-color var(--transition-fast);
        }

        .cp-input-row:focus-within {
          border-color: var(--border-active);
          box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.06);
        }

        .cp-text-input {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 13px;
          padding: 6px 0;
          outline: none;
        }

        .cp-text-input:disabled {
          opacity: 0.5;
        }

        .cp-text-input::placeholder {
          color: var(--text-muted);
        }

        .cp-send-btn {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-sm);
          background: rgba(0, 240, 255, 0.1);
          color: var(--cyan);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .cp-send-btn:hover:not(:disabled) {
          background: rgba(0, 240, 255, 0.2);
        }

        .cp-send-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .cp-orb-container {
            height: 140px;
          }

          .cp-message {
            max-width: 90%;
          }
        }
      `}</style>
    </div>
  );
}
