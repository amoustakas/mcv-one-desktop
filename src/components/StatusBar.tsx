import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, GitBranch, Cloud, FileText } from 'lucide-react';
import { APP_VERSION } from '../lib/version';
import { supabase } from '../lib/supabase';

interface HealthStatus {
  configured: Record<string, boolean>;
}

export default function StatusBar() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [docCount, setDocCount] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then(setHealth).catch(() => {});

    if (supabase) {
      supabase.from('documents').select('*', { count: 'exact', head: true })
        .then(({ count }) => setDocCount(count || 0));
    }

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const cfg = health?.configured || {};

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-edge">EDGE $0.025</span>
        <span className="status-sep" />
        <span className="status-item">
          <FileText size={10} />
          {docCount} docs
        </span>
      </div>

      <div className="status-right">
        <span className={`status-dot ${online ? 'ok' : 'err'}`} title={online ? 'Online' : 'Offline'}>
          {online ? <Wifi size={10} /> : <WifiOff size={10} />}
        </span>
        <span className={`status-dot ${cfg.SUPABASE_URL ? 'ok' : 'off'}`} title="Supabase">
          <Database size={10} />
        </span>
        <span className={`status-dot ${cfg.GITHUB_TOKEN ? 'ok' : 'off'}`} title="GitHub">
          <GitBranch size={10} />
        </span>
        <span className={`status-dot ${cfg.ANTHROPIC_API_KEY ? 'ok' : 'off'}`} title="Claude">
          <Cloud size={10} />
        </span>
        <span className="status-sep" />
        <span className="status-version">v{APP_VERSION}</span>
      </div>

      <style>{`
        .status-bar {
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          background: var(--bg-surface);
          border-top: 1px solid var(--border);
          font-size: 10px;
          color: var(--text-muted);
          flex-shrink: 0;
          user-select: none;
        }

        .status-left, .status-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-edge {
          font-family: var(--font-mono);
          font-weight: 600;
          color: var(--purple);
        }

        .status-sep {
          width: 1px;
          height: 12px;
          background: var(--border);
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .status-dot {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .status-dot.ok { color: var(--success); }
        .status-dot.off { color: var(--text-muted); opacity: 0.4; }
        .status-dot.err { color: var(--error); }

        .status-version {
          font-family: var(--font-mono);
        }
      `}</style>
    </div>
  );
}
