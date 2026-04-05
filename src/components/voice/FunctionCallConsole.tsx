/**
 * FunctionCallConsole — Live tool execution viewer with terminal aesthetic.
 * Shows active tool calls in real-time with collapsible arguments and results.
 */
import { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronRight, Loader2, CheckCircle, XCircle } from 'lucide-react';

export interface ToolCallEntry {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: 'pending' | 'executing' | 'done' | 'error';
  result?: unknown;
  timestamp: Date;
}

interface FunctionCallConsoleProps {
  calls: ToolCallEntry[];
}

function StatusIcon({ status }: { status: ToolCallEntry['status'] }) {
  switch (status) {
    case 'pending':
      return <Loader2 size={12} className="fcc-spin" />;
    case 'executing':
      return <Loader2 size={12} className="fcc-spin fcc-icon-executing" />;
    case 'done':
      return <CheckCircle size={12} className="fcc-icon-done" />;
    case 'error':
      return <XCircle size={12} className="fcc-icon-error" />;
  }
}

function CallEntry({ call }: { call: ToolCallEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`fcc-entry fcc-entry--${call.status}`}>
      <button className="fcc-entry-header" onClick={() => setExpanded(!expanded)}>
        <ChevronRight size={12} className={`fcc-chevron ${expanded ? 'fcc-chevron--open' : ''}`} />
        <StatusIcon status={call.status} />
        <span className="fcc-fn-name">{call.name}</span>
        <span className="fcc-timestamp">
          {call.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <span className={`fcc-status-badge fcc-status-badge--${call.status}`}>{call.status}</span>
      </button>

      {expanded && (
        <div className="fcc-entry-body">
          <div className="fcc-section">
            <span className="fcc-section-label">args</span>
            <pre className="fcc-json">{JSON.stringify(call.args, null, 2)}</pre>
          </div>
          {call.result !== undefined && (
            <div className="fcc-section">
              <span className="fcc-section-label">result</span>
              <pre className="fcc-json">{JSON.stringify(call.result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FunctionCallConsole({ calls }: FunctionCallConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [calls.length]);

  return (
    <div className="fcc-root">
      <div className="fcc-titlebar">
        <Terminal size={13} />
        <span>Function Calls</span>
        <span className="fcc-count">{calls.length}</span>
      </div>

      <div className="fcc-scroll" ref={scrollRef}>
        {calls.length === 0 && (
          <div className="fcc-empty">
            <span className="fcc-empty-cursor">_</span>
            <span>Waiting for tool calls...</span>
          </div>
        )}
        {calls.map(call => (
          <CallEntry key={call.id} call={call} />
        ))}
      </div>

      <style>{`
        .fcc-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-deep);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          font-family: var(--font-mono);
          font-size: 12px;
        }

        .fcc-titlebar {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
          color: var(--cyan);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .fcc-count {
          margin-left: auto;
          background: rgba(0, 240, 255, 0.1);
          color: var(--cyan);
          padding: 1px 6px;
          border-radius: var(--radius-full);
          font-size: 10px;
        }

        .fcc-scroll {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-xs);
        }

        .fcc-empty {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-lg);
          color: var(--text-muted);
          font-size: 11px;
          justify-content: center;
        }

        .fcc-empty-cursor {
          animation: fccBlink 1s step-end infinite;
          color: var(--cyan);
        }

        @keyframes fccBlink {
          50% { opacity: 0; }
        }

        .fcc-entry {
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          margin-bottom: var(--space-xs);
          overflow: hidden;
          transition: border-color var(--transition-fast);
        }

        .fcc-entry--executing {
          border-color: rgba(0, 240, 255, 0.2);
        }

        .fcc-entry--done {
          border-color: rgba(16, 185, 129, 0.2);
        }

        .fcc-entry--error {
          border-color: rgba(239, 68, 68, 0.2);
        }

        .fcc-entry-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          width: 100%;
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-surface);
          color: var(--text-primary);
          font-family: var(--font-mono);
          font-size: 11px;
          text-align: left;
          transition: background var(--transition-fast);
        }

        .fcc-entry-header:hover {
          background: var(--bg-card);
        }

        .fcc-chevron {
          color: var(--text-muted);
          transition: transform var(--transition-fast);
          flex-shrink: 0;
        }

        .fcc-chevron--open {
          transform: rotate(90deg);
        }

        .fcc-fn-name {
          color: var(--cyan);
          font-weight: 600;
        }

        .fcc-timestamp {
          margin-left: auto;
          color: var(--text-muted);
          font-size: 10px;
        }

        .fcc-status-badge {
          padding: 1px 6px;
          border-radius: var(--radius-full);
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .fcc-status-badge--pending {
          background: rgba(139, 92, 246, 0.15);
          color: var(--purple);
        }

        .fcc-status-badge--executing {
          background: rgba(0, 240, 255, 0.1);
          color: var(--cyan);
        }

        .fcc-status-badge--done {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
        }

        .fcc-status-badge--error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
        }

        .fcc-entry-body {
          padding: var(--space-sm) var(--space-md);
          border-top: 1px solid var(--border);
          background: var(--bg-deep);
        }

        .fcc-section {
          margin-bottom: var(--space-sm);
        }

        .fcc-section:last-child {
          margin-bottom: 0;
        }

        .fcc-section-label {
          display: block;
          color: var(--text-muted);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .fcc-json {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: var(--space-sm);
          color: var(--text-secondary);
          font-size: 11px;
          line-height: 1.5;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-all;
          margin: 0;
        }

        @keyframes fccSpin {
          to { transform: rotate(360deg); }
        }

        .fcc-spin {
          animation: fccSpin 1s linear infinite;
        }

        .fcc-icon-executing {
          color: var(--cyan);
        }

        .fcc-icon-done {
          color: var(--success);
        }

        .fcc-icon-error {
          color: var(--error);
        }
      `}</style>
    </div>
  );
}
