import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, GitBranch, Cloud, FileText, CheckSquare, Columns2, Cpu, HardDrive, Monitor, Grid3x3, AudioLines, MonitorSmartphone } from 'lucide-react';
import { APP_VERSION } from '../lib/version';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../stores/navigation';
import { getVenture } from '../lib/ventures';
import { useLocalStore } from '../lib/local';
import { apiGet } from '../lib/api/client';
import { cn } from '../lib/utils';
import { usePresenceStore, STATUS_COLORS, STATUS_LABELS } from '../stores/presence';
import { getTimezoneAbbr } from '../lib/device';
import { useDeviceStore } from '../stores/devices';

export default function StatusBar() {
  const [health, setHealth] = useState<Record<string, boolean>>({});
  const [docCount, setDocCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [online, setOnline] = useState(navigator.onLine);
  const { mode, activeVenture, splitView, setView } = useNavigation();
  const localConnected = useLocalStore(s => s.connected);
  const devices = useDeviceStore(s => s.devices);

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
  const presence = usePresenceStore((s) => s.ownPresence);
  const deviceCount = usePresenceStore((s) => s.getDeviceCount());

  // Device Hub indicators
  const deviceList = Object.values(devices);
  const connectedCount = deviceList.filter(d => d.status === 'connected').length;
  const hasStreamDeck = deviceList.some(d => d.class === 'stream-deck' && d.status === 'connected');
  const hasGoXLR = deviceList.some(d => d.class === 'goxlr' && d.status === 'connected');
  const sessionCount = deviceList.filter(d => d.class === 'agent-session' && d.status === 'connected').length;

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-edge">EDGE $0.025</span>
        <span className="status-sep" />
        {presence && (
          <>
            <span className="status-presence">
              <span className="status-presence-dot" style={{ background: STATUS_COLORS[presence.status] }} />
              {STATUS_LABELS[presence.status]}
              {presence.city && <> · {presence.city} {getTimezoneAbbr()}</>}
              {deviceCount > 1 && <> · <Monitor size={9} /> {deviceCount}</>}
            </span>
            <span className="status-sep" />
          </>
        )}
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
        <span className={cn('status-dot', connectedCount > 0 ? 'ok' : 'off', 'status-clickable')} title={`${connectedCount} device${connectedCount !== 1 ? 's' : ''} connected`} onClick={() => setView('device-hub')}>
          <Cpu size={10} /> <span className="status-device-count">{connectedCount}</span>
        </span>
        {hasStreamDeck && (
          <span className="status-dot ok status-clickable" title="Stream Deck" onClick={() => setView('stream-deck')}><Grid3x3 size={10} /></span>
        )}
        {hasGoXLR && (
          <span className="status-dot ok status-clickable" title="GoXLR" onClick={() => setView('audio-router')}><AudioLines size={10} /></span>
        )}
        {sessionCount > 0 && (
          <span className="status-dot ok status-clickable" title={`${sessionCount} agent session${sessionCount !== 1 ? 's' : ''}`} onClick={() => setView('connected-sessions')}>
            <MonitorSmartphone size={10} /> <span className="status-device-count">{sessionCount}</span>
          </span>
        )}
        <span className="status-sep" />
        <span className={cn('status-dot', localConnected ? 'ok' : 'off')} title={localConnected ? 'Local Server Connected' : 'Local Server Offline'}><HardDrive size={10} /></span>
        <span className="status-services"><Cpu size={9} /> {onlineServices} services</span>
        <span className="status-sep" />
        <span className={cn('status-dot', online ? 'ok' : 'err')} title={online ? 'Online' : 'Offline'}>
          {online ? <Wifi size={10} /> : <WifiOff size={10} />}
        </span>
        <span className={cn('status-dot', health.SUPABASE_URL ? 'ok' : 'off')} title="Supabase"><Database size={10} /></span>
        <span className={cn('status-dot', health.GITHUB_TOKEN ? 'ok' : 'off')} title="GitHub"><GitBranch size={10} /></span>
        <span className={cn('status-dot', health.ANTHROPIC_API_KEY ? 'ok' : 'off')} title="Claude"><Cloud size={10} /></span>
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
        .status-presence { display: flex; align-items: center; gap: 4px; font-weight: 500; }
        .status-presence-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .status-item.split { color: var(--cyan); }

        .status-venture { display: flex; align-items: center; gap: 4px; font-weight: 500; font-size: 10px; }
        .status-v-dot { width: 5px; height: 5px; border-radius: 50%; }

        .status-services { font-family: var(--font-mono); font-size: 9px; display: flex; align-items: center; gap: 3px; }

        .status-dot { display: flex; align-items: center; gap: 2px; }
        .status-dot.ok { color: var(--success); }
        .status-dot.off { color: var(--text-muted); opacity: 0.4; }
        .status-dot.err { color: var(--error); }

        .status-version { font-family: var(--font-mono); }

        .status-clickable { cursor: pointer; transition: opacity 0.15s; }
        .status-clickable:hover { opacity: 0.8; }
        .status-device-count { font-family: var(--font-mono); font-size: 9px; }
      `}</style>
    </div>
  );
}
