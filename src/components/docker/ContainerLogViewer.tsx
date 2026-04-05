/**
 * ContainerLogViewer — Monospace log viewer for a single Docker container
 *
 * Scrollable dark panel with auto-scroll, line numbers, refresh, and copy.
 * Wrapped in WidgetContainer with neural glass styling.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal, RefreshCw, Copy, Check, Hash } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDockerLogs } from '../../hooks/use-docker';
import WidgetContainer from '../ui/WidgetContainer';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

interface ContainerLogViewerProps {
  containerId: string;
  containerName: string;
  tail?: number;
  className?: string;
}

export default function ContainerLogViewer({
  containerId,
  containerName,
  tail = 100,
  className,
}: ContainerLogViewerProps) {
  const { data, isLoading, error, refetch } = useDockerLogs(containerId, tail);
  const scrollRef = useRef<HTMLPreElement>(null);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const logs = data?.logs ?? '';
  const lines = logs ? logs.split('\n') : [];

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Detect if user scrolled away from bottom → disable auto-scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!logs) return;
    try {
      await navigator.clipboard.writeText(logs);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }, [logs]);

  return (
    <WidgetContainer
      title={`Logs: ${containerName}`}
      icon={<Terminal size={14} />}
      variant="neural"
      onRefresh={() => refetch()}
      isLoading={isLoading}
      error={error ? String(error) : undefined}
      className={className}
    >
      {/* Toolbar */}
      <div className="docker-log-toolbar">
        <button
          className={cn('docker-log-toolbar-btn', showLineNumbers && 'docker-log-toolbar-btn-active')}
          onClick={() => setShowLineNumbers((v) => !v)}
          title="Toggle line numbers"
          type="button"
        >
          <Hash size={12} />
        </button>
        <button
          className="docker-log-toolbar-btn"
          onClick={() => refetch()}
          title="Refresh logs"
          type="button"
        >
          <RefreshCw size={12} />
        </button>
        <button
          className={cn('docker-log-toolbar-btn', copied && 'docker-log-toolbar-btn-active')}
          onClick={handleCopy}
          title="Copy all logs"
          type="button"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
        <span className="docker-log-toolbar-info">
          {data?.lines ?? 0} lines
        </span>
      </div>

      {/* Log content */}
      <div className="docker-log-container">
        {isLoading ? (
          <div className="docker-log-skeleton">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} width={`${60 + Math.random() * 35}%`} height={12} />
            ))}
          </div>
        ) : lines.length === 0 ? (
          <EmptyState
            icon={<Terminal size={28} />}
            title="No logs available"
            description="This container has not produced any log output yet."
          />
        ) : (
          <pre
            ref={scrollRef}
            className="docker-log-pre"
            onScroll={handleScroll}
          >
            {lines.map((line, i) => (
              <div className="docker-log-line" key={i}>
                {showLineNumbers && (
                  <span className="docker-log-ln">{i + 1}</span>
                )}
                <span className="docker-log-text">{line}</span>
              </div>
            ))}
          </pre>
        )}
      </div>

      <style>{`
        .docker-log-toolbar {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 0;
          margin-bottom: 6px;
          border-bottom: 1px solid var(--border);
        }
        .docker-log-toolbar-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }
        .docker-log-toolbar-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .docker-log-toolbar-btn-active { color: var(--cyan); }
        .docker-log-toolbar-info {
          margin-left: auto;
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
        }

        .docker-log-container {
          background: var(--bg-deep);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          overflow: hidden;
          min-height: 120px;
          max-height: 400px;
          display: flex;
          flex-direction: column;
        }

        .docker-log-skeleton {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px;
        }

        .docker-log-pre {
          margin: 0;
          padding: 10px 12px;
          overflow-y: auto;
          overflow-x: auto;
          flex: 1;
          background: transparent;
          border: none;
          border-radius: 0;
          font-family: var(--font-mono);
          font-size: 11px;
          line-height: 1.6;
          color: var(--text-secondary);
          white-space: pre;
        }

        .docker-log-line {
          display: flex;
          gap: 12px;
          transition: background var(--transition-fast);
        }
        .docker-log-line:hover { background: rgba(0, 240, 255, 0.03); }

        .docker-log-ln {
          color: var(--text-muted);
          opacity: 0.5;
          min-width: 32px;
          text-align: right;
          user-select: none;
          flex-shrink: 0;
        }

        .docker-log-text {
          white-space: pre-wrap;
          word-break: break-all;
        }
      `}</style>
    </WidgetContainer>
  );
}
