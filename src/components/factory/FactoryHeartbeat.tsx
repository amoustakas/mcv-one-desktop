// Command-Center StatCard for the Local AI Factory.
// Polls /api/factory?action=heartbeat every 15s and renders a green/amber/red
// status dot. Click → navigate to the Factory Console view.

import { Cpu, CircleDashed, AlertTriangle } from 'lucide-react';
import { StatCard } from '../ui';
import { useFactoryHeartbeat, type FactoryStatus } from '../../hooks/use-factory';
import { useNavigation } from '../../stores/navigation';

const STATUS_COLOR: Record<FactoryStatus, string> = {
  online: '#10B981',
  degraded: '#F59E0B',
  offline: '#EF4444',
  loading: '#64748B',
};

const STATUS_LABEL: Record<FactoryStatus, string> = {
  online: 'Online',
  degraded: 'Degraded',
  offline: 'Offline',
  loading: '…',
};

function formatUptime(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  return `${Math.floor(sec / 86400)}d`;
}

export default function FactoryHeartbeat() {
  const { heartbeat, status, lastFetched } = useFactoryHeartbeat({ intervalMs: 15_000, skipEmit: true });
  const setView = useNavigation(s => s.setView);

  const value =
    status === 'offline' ? 'Offline'
    : status === 'loading' ? '…'
    : heartbeat ? formatUptime(heartbeat.uptimeSec)
    : STATUS_LABEL[status];

  const color = STATUS_COLOR[status];
  const icon =
    status === 'offline' ? <AlertTriangle size={14} />
    : status === 'loading' ? <CircleDashed size={14} />
    : <Cpu size={14} />;

  const trend = heartbeat
    ? {
        value: heartbeat.localModels.reachable ? 1 : 0,
        label: heartbeat.localModels.reachable
          ? `${heartbeat.localModels.models.length} model${heartbeat.localModels.models.length === 1 ? '' : 's'}`
          : 'no local models',
      }
    : undefined;

  // Use the trend row as a secondary status line; StatCard's trend is
  // numeric-centric but we're borrowing it for the "N models" hint.
  void lastFetched; // keep hook dep explicit; re-renders drive freshness

  return (
    <StatCard
      icon={icon}
      label="AI Factory"
      value={value}
      color={color}
      trend={trend}
      onClick={() => setView('factory-console')}
    />
  );
}
