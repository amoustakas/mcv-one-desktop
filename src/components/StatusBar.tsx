import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, GitBranch, Cloud, FileText, CheckSquare, Columns2, Cpu, HardDrive } from 'lucide-react';
import { APP_VERSION } from '../lib/version';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../stores/navigation';
import { getVenture } from '../lib/ventures';
import { useLocalStore } from '../lib/local';
import { apiGet } from '../lib/api/client';

export default function StatusBar() {
  const [health, setHealth] = useState<Record<string, boolean>>({});
  const [docCount, setDocCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const { mode, activeVenture, splitView } = useNavigation();
  const localConnected = useLocalStore(s => s.connected);

  useEffect(() => {
    function refresh() {
      apiGet<Record<string, boolean>>('/api/health').then(d => setHealth(d || {})).catch(() => {});
      if (supabase) {
        supabase.from('documents').select('*', { count: 'exact', head: true }).then(({ count }) => setDocCount(count || 0));
        supabase.from('tasks').select('*', { count: 'exact', head: true }).then(({ count }) => setTaskCount(count || 0));
      }
    }
    refresh();
    const id = setInterval(refresh, 120000); // refresh every 2m
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { clearInterval(id); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const venture = activeVenture ? getVenture(activeVenture) : null;
  const onlineServices = Object.values(health).filter(Boolean).length;

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-edge">EDGE $0.025</span>
        <span className="status-sep" />
        {mode === 'venture' && venture && (
          <>
            <span className="status-venture" style={{ color: venture.color }}>
              <span className="status-v-dot" style={{ background: venture.color }} />
              {venture.name}
            </span>
            <span className="status-sep" />
          </>
        )}
        <span className="status-item"><FileText size={10} /> {docCount} docs</span>
        <span className="status-sep" />
        <span className="status-item"><CheckSquare size={10} /> {taskCount} tasks</span>
        {splitView && (
          <>
            <span className="status-sep" />
            <span className="status-item split"><Columns2 size={10} /> Split</span>
          </>
        )}
      </div>

      <div className="status-right">
        <span className={`status-dot ${localConnected ? 'ok' : 'off'}`} title={localConnected ? 'Local Server Connected' : 'Local Server Offline'}><HardDrive size={10} /></span>
        <span className="status-services"><Cpu size={9} /> {onlineServices} services</span>
        <span className="status-sep" />
        <span className={`status-dot ${online ? 'ok' : 'err'}`} title={online ? 'Online' : 'Offline'}>
          {online ? <Wifi size={10} /> : <WifiOff size={10} />}
        </span>
        <span className={`status-dot ${health.SUPABASE_URL ? 'ok' : 'off'}`} title="Supabase"><Database size={10} /></span>
        <span className={`status-dot ${health.GITHUB_TOKEN ? 'ok' : 'off'}`} title="GitHub"><GitBranch size={10} /></span>
        <span className={`status-dot ${health.ANTHROPIC_API_KEY ? 'ok' : 'off'}`} title="Claude"><Cloud size={10} /></span>
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
          background: linear-gradient(180deg, var(--bg-surface), rgba(8, 14, 28, 0.98));
          border-top: 1px solid var(--border);
          font-size: 10px;
          color: var(--text-muted);
          flex-shrink: 0;
          user-select: none;
          position: relative;
        }
        .status-bar::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.08), transparent);
        }

        .status-left, .status-right { display: flex; align-items: center; gap: 8px; }

        .status-edge { font-family: var(--font-mono); font-weight: 600; color: var(--purple); }
        .status-sep { width: 1px; height: 12px; background: var(--border); }
        .status-item { display: flex; align-items: center; gap: 3px; }
        .status-item.split { color: var(--cyan); }

        .status-venture { display: flex; align-items: center; gap: 4px; font-weight: 500; font-size: 10px; }
        .status-v-dot { width: 5px; height: 5px; border-radius: 50%; }

        .status-services { font-family: var(--font-mono); font-size: 9px; display: flex; align-items: center; gap: 3px; }

        .status-dot { display: flex; align-items: center; gap: 2px; }
        .status-dot.ok { color: var(--success); }
        .status-dot.off { color: var(--text-muted); opacity: 0.4; }
        .status-dot.err { color: var(--error); }

        .status-version { font-family: var(--font-mono); }
      `}</style>
    </div>
  );
}
