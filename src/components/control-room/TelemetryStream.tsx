import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useTelemetry } from '../../stores/telemetry';
import Badge from '../ui/Badge';
import type { TelemetryEventType } from '../../lib/kits/types';

// ---------------------------------------------------------------------------
// TelemetryStream — scrolling event log with filter bar
// ---------------------------------------------------------------------------

const EVENT_TYPE_COLORS: Record<TelemetryEventType, string> = {
  api_call: 'var(--cyan)',
  tool_dispatch: 'var(--purple)',
  tool_result: 'var(--success)',
  cache_hit: 'var(--gold)',
  cache_miss: 'var(--text-muted)',
  file_upload: 'var(--core-blue)',
  hitl_request: 'var(--warning)',
  hitl_response: 'var(--success)',
};

const FILTER_OPTIONS: { label: string; value: TelemetryEventType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'API', value: 'api_call' },
  { label: 'Tools', value: 'tool_dispatch' },
  { label: 'Results', value: 'tool_result' },
  { label: 'Cache', value: 'cache_hit' },
  { label: 'Files', value: 'file_upload' },
  { label: 'HITL', value: 'hitl_request' },
];

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function TelemetryStream() {
  const events = useTelemetry((s) => s.events);
  const [filter, setFilter] = useState<TelemetryEventType | 'all'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = filter === 'all' ? events : events.filter((e) => e.type === filter);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [filtered.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div className="mcv-filter-bar">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={cn('mcv-filter-chip', filter === opt.value && 'mcv-filter-chip-active')}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="mcv-telemetry-stream">
        {filtered.length === 0 && (
          <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            No events recorded yet. Start a conversation to see telemetry.
          </div>
        )}
        {filtered.map((evt) => (
          <div key={evt.id} className="mcv-telemetry-row">
            <span className="mcv-telemetry-time">{formatTime(evt.timestamp)}</span>
            <span className="mcv-telemetry-type">
              <Badge color={EVENT_TYPE_COLORS[evt.type]} size="sm">{evt.type.replace('_', ' ')}</Badge>
            </span>
            <span className="mcv-telemetry-detail">
              {evt.toolName && <>{evt.kitId ? `${evt.kitId}/` : ''}{evt.toolName}</>}
              {evt.model && !evt.toolName && evt.model}
              {evt.metadata?.fileName ? String(evt.metadata.fileName) : null}
            </span>
            <span className="mcv-telemetry-tokens">
              {evt.usage ? `${evt.usage.totalTokenCount.toLocaleString()} tok` : ''}
            </span>
            <span className="mcv-telemetry-cost">
              {evt.costEstimate ? `$${evt.costEstimate.toFixed(4)}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
