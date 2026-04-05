import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, GitBranch, Cloud, FileText, CheckSquare, Columns2, Cpu, HardDrive, Clock, Zap, Activity } from 'lucide-react';
import { APP_VERSION, BUILD_TIME } from '../lib/version';
import { supabase } from '../lib/supabase';
import { useNavigation, type ViewId } from '../stores/navigation';
import { getVenture } from '../lib/ventures';
import { useLocalStore } from '../lib/local';
import { apiGet } from '../lib/api/client';
import { cn } from '../lib/utils';
import { useNotificationStore } from '../stores/notifications';

interface HealthData {
  status: string;
  version: string;
  configured: Record<string, boolean>;
}

export default function StatusBar() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [dbStats, setDbStats] = useState({ docs: 0, tasks: 0, conversations: 0 });
  const [online, setOnline] = useState(navigator.onLine);
  const [latency, setLatency] = useState<number | null>(null);
  const { mode, activeVenture, splitView, setView } = useNavigation();
  const localConnected = useLocalStore(s => s.connected);
  const localHealth = useLocalStore(s => s.health);
  const unreadCount = useNotificationStore(s => s.unreadCount);

  // Health + DB stats polling
  useEffect(() => {
    async function refresh() {
      const start = Date.now();
      try {
        const h = await apiGet<HealthData>('/api/health');
        setLatency(Date.now() - start);
        setHealth(h);
      } catch {
        setHealth(null);
        setLatency(null);
      }

      if (supabase) {
        const [docs, tasks, convos] = await Promise.all([
          supabase.from('documents').select('*', { count: 'exact', head: true }),
          supabase.from('tasks').select('*', { count: 'exact', head: true }),
          supabase.from('conversations').select('*', { count: 'exact', head: true }),
        ]);
        setDbStats({
          docs: docs.count || 0,
          tasks: tasks.count || 0,
          conversations: convos.count || 0,
        });
      }
    }
    refresh();
    const id = setInterval(refresh, 60_000);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { clearInterval(id); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const venture = activeVenture ? getVenture(activeVenture) : null;
  const supaOk = health?.configured?.SUPABASE_URL ?? false;
  const githubOk = health?.configured?.GITHUB_TOKEN ?? false;
  const claudeOk = health?.configured?.ANTHROPIC_API_KEY ?? false;
  const clerkOk = health?.configured?.CLERK_SECRET_KEY ?? false;
  const serverVersion = health?.version || '?';
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  function nav(view: ViewId) { setView(view); }

  return (
    <div className="status-bar">
      {/* Left: Context + Data */}
      <div className="status-left">
        <span className="status-edge">EDGE $0.025</span>
        <span className="sb-sep" />

        {mode === 'venture' && venture ? (
          <span className="sb-venture" style={{ color: venture.color }} onClick={() => nav('venture-dashboard')}>
            <span className="sb-dot" style={{ background: venture.color }} />
            {venture.name}
          </span>
        ) : (
          <span className="sb-context">Global</span>
        )}
        <span className="sb-sep" />

        <span className="sb-stat sb-click" onClick={() => nav('docs')} title="Documents"><FileText size={10} /> {dbStats.docs}</span>
        <span className="sb-stat sb-click" onClick={() => nav('tasks')} title="Tasks"><CheckSquare size={10} /> {dbStats.tasks}</span>
        <span className="sb-stat sb-click" onClick={() => nav('chat')} title="Conversations"><Activity size={10} /> {dbStats.conversations}</span>

        {splitView && (
          <>
            <span className="sb-sep" />
            <span className="sb-stat sb-split"><Columns2 size={10} /> Split</span>
          </>
        )}

        {unreadCount > 0 && (
          <>
            <span className="sb-sep" />
            <span className="sb-unread"><Zap size={9} /> {unreadCount} unread</span>
          </>
        )}
      </div>

      {/* Right: Systems + Version */}
      <div className="status-right">
        <span className="sb-time"><Clock size={9} /> {timeStr}</span>
        <span className="sb-sep" />

        {/* Local server */}
        <span className={cn('sb-svc', localConnected ? 'ok' : 'off')} title={localConnected ? `Local Server: ${localHealth?.hostname || 'Connected'} · ${localHealth?.cpus || '?'} CPUs` : 'Local Server Offline'}>
          <HardDrive size={10} />
          <span className="sb-svc-label">{localConnected ? 'Local' : 'Local'}</span>
        </span>

        {/* Supabase */}
        <span className={cn('sb-svc', supaOk ? 'ok' : 'off')} title={supaOk ? 'Supabase Connected' : 'Supabase Not Connected'}>
          <Database size={10} />
          <span className="sb-svc-label">DB</span>
        </span>

        {/* GitHub */}
        <span className={cn('sb-svc', githubOk ? 'ok' : 'off')} title={githubOk ? 'GitHub Connected' : 'GitHub Not Connected'}>
          <GitBranch size={10} />
        </span>

        {/* Claude */}
        <span className={cn('sb-svc', claudeOk ? 'ok' : 'off')} title={claudeOk ? 'Claude API Connected' : 'Claude Not Connected'}>
          <Cloud size={10} />
        </span>

        {/* Clerk */}
        <span className={cn('sb-svc', clerkOk ? 'ok' : 'off')} title={clerkOk ? 'Auth Active' : 'Auth Not Configured'}>
          <Cpu size={10} />
        </span>

        {/* Network */}
        <span className="sb-sep" />
        <span className={cn('sb-svc', online ? 'ok' : 'err')} title={online ? `Online${latency ? ` · ${latency}ms` : ''}` : 'Offline'}>
          {online ? <Wifi size={10} /> : <WifiOff size={10} />}
          {latency && <span className="sb-latency">{latency}ms</span>}
        </span>

        <span className="sb-sep" />
        <span className="sb-version" title={`Client: v${APP_VERSION}\nServer: v${serverVersion}\nBuild: ${BUILD_TIME}`}>
          v{APP_VERSION}
        </span>
      </div>

      <style>{`
        .status-bar { height:28px; display:flex; align-items:center; justify-content:space-between; padding:0 12px; background:linear-gradient(180deg, var(--bg-surface), rgba(8,14,28,0.98)); border-top:1px solid var(--border); font-size:10px; color:var(--text-muted); flex-shrink:0; user-select:none; position:relative; }
        .status-bar::before { content:""; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg, transparent, rgba(0,240,255,0.08), transparent); }
        .status-left, .status-right { display:flex; align-items:center; gap:8px; }
        .status-edge { font-family:var(--font-mono); font-weight:600; color:var(--purple); font-size:9px; }
        .sb-sep { width:1px; height:12px; background:var(--border); }
        .sb-stat { display:flex; align-items:center; gap:3px; }
        .sb-click { cursor:pointer; transition:color 0.15s; }
        .sb-click:hover { color:var(--cyan); }
        .sb-split { color:var(--cyan); }
        .sb-venture { display:flex; align-items:center; gap:4px; font-weight:500; cursor:pointer; }
        .sb-venture:hover { opacity:0.8; }
        .sb-dot { width:5px; height:5px; border-radius:50%; }
        .sb-context { color:var(--text-muted); }
        .sb-unread { color:var(--warning); display:flex; align-items:center; gap:3px; font-weight:600; }
        .sb-time { font-family:var(--font-mono); display:flex; align-items:center; gap:3px; }
        .sb-svc { display:flex; align-items:center; gap:3px; transition:color 0.15s; }
        .sb-svc.ok { color:var(--success); }
        .sb-svc.off { color:var(--text-muted); opacity:0.4; }
        .sb-svc.err { color:var(--error); }
        .sb-svc-label { font-size:9px; }
        .sb-latency { font-family:var(--font-mono); font-size:8px; }
        .sb-version { font-family:var(--font-mono); font-size:9px; }
      `}</style>
    </div>
  );
}
