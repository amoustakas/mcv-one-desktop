// src/components/factory/FactoryEventFeed.tsx
// Live SSE stream of Fabric events filtered by topic (default: factory.*).

import { useEffect, useState } from 'react';
import { factory_client, type FactoryFabricEvent } from '../../lib/factory-client';

interface Props {
  topic?: string;
  maxEvents?: number;
}

export function FactoryEventFeed({ topic = 'factory.*', maxEvents = 50 }: Props) {
  const [events, setEvents] = useState<FactoryFabricEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setConnected(true);
    const cleanup = factory_client.subscribe_events(
      topic,
      (ev) => setEvents((prev) => [ev, ...prev].slice(0, maxEvents)),
      {
        on_error: (err) => { setError(err.message); setConnected(false); },
      },
    );
    return () => { cleanup(); setConnected(false); };
  }, [topic, maxEvents]);

  return (
    <section>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          event feed · {events.length}
        </span>
        <span style={{ fontSize: 10, color: connected ? '#6EE7B7' : '#FB7185', letterSpacing: '.1em' }}>
          {connected ? '● live' : '● disconnected'}
        </span>
      </header>

      {error && <div style={{ color: '#FB7185', fontSize: 11, marginBottom: 8 }}>{error}</div>}

      {events.length === 0 && !error && (
        <div style={{ padding: 14, color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic', border: '1px dashed var(--border-subtle)', borderRadius: 8, textAlign: 'center' }}>
          Listening on <code style={{ fontFamily: 'monospace' }}>{topic}</code> — no events yet.
        </div>
      )}

      <div style={{ display: 'grid', gap: 3 }}>
        {events.map((ev) => (
          <div key={ev.id} style={{
            display: 'grid', gridTemplateColumns: '70px 1fr 70px', gap: 8, alignItems: 'center',
            padding: '6px 10px', borderRadius: 4,
            background: 'var(--surface-base)', border: '1px solid var(--border-subtle)',
            fontSize: 10,
          }}>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {new Date(ev.timestamp).toLocaleTimeString()}
            </span>
            <span>
              <span style={{ color: 'var(--color-brand-electric)', fontFamily: 'monospace', fontWeight: 600 }}>{ev.topic}</span>
              {ev.venture_id && <span style={{ color: 'var(--text-muted)' }}> · {ev.venture_id}</span>}
              {ev.correlation_id && <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}> · {ev.correlation_id.slice(0, 8)}</span>}
            </span>
            <span style={{ color: 'var(--text-muted)', textAlign: 'right', fontFamily: 'monospace' }}>
              {ev.id.slice(0, 6)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
