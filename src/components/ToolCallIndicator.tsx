import { Loader2, Wrench, CheckCircle2, XCircle } from 'lucide-react';
import Markdown from './Markdown';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface ToolCallIndicatorProps {
  name: string;
  status: 'running' | 'done' | 'error';
  result?: string;
}

export default function ToolCallIndicator({ name, status, result }: ToolCallIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  const displayName = name.replace(/_/g, ' ');

  return (
    <div className={cn('tci', status)}>
      <button
        className="tci-header"
        onClick={() => result && setExpanded(!expanded)}
        disabled={!result}
      >
        <span className="tci-icon">
          {status === 'running' && <Loader2 size={13} className="spin" />}
          {status === 'done' && <CheckCircle2 size={13} />}
          {status === 'error' && <XCircle size={13} />}
        </span>
        <span className="tci-label">
          <Wrench size={10} />
          <span className="tci-name">{displayName}</span>
        </span>
        <span className="tci-status">
          {status === 'running' ? 'running...' : status === 'done' ? 'completed' : 'failed'}
        </span>
        {result && (
          <span className="tci-expand">{expanded ? '\u25B2' : '\u25BC'}</span>
        )}
      </button>
      {expanded && result && (
        <div className="tci-result">
          <Markdown content={result} />
        </div>
      )}

      <style>{`
        .tci {
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--bg-card);
          overflow: hidden;
          font-size: 12px;
        }

        .tci.running {
          border-color: rgba(0, 240, 255, 0.25);
          background: rgba(0, 240, 255, 0.03);
        }

        .tci.done { border-color: rgba(34, 197, 94, 0.2); }
        .tci.error { border-color: rgba(239, 68, 68, 0.2); }

        .tci-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          width: 100%;
          text-align: left;
          color: var(--text-secondary);
          transition: background var(--transition-fast);
        }

        .tci-header:not(:disabled):hover { background: var(--bg-elevated); }
        .tci-header:disabled { cursor: default; }

        .tci-icon { display: flex; align-items: center; flex-shrink: 0; }
        .tci.running .tci-icon { color: var(--cyan); }
        .tci.done .tci-icon { color: rgb(34, 197, 94); }
        .tci.error .tci-icon { color: rgb(239, 68, 68); }

        .tci-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          text-transform: capitalize;
          color: var(--text-primary);
        }

        .tci-name { letter-spacing: -0.01em; }
        .tci-status { opacity: 0.6; flex: 1; }
        .tci-expand { font-size: 9px; opacity: 0.5; }

        .tci-result {
          padding: 6px 10px;
          border-top: 1px solid var(--border);
          background: var(--bg-surface);
          max-height: 300px;
          overflow-y: auto;
          font-size: 11px;
          line-height: 1.5;
        }

        .tci-result p { margin: 0 0 4px; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
