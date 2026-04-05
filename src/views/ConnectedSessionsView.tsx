import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MonitorSmartphone, RefreshCw, Terminal, GitBranch, Package,
  MessageSquare, Send, Wifi, WifiOff, Users,
} from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Badge, EmptyState, Button, StatCard, GridLayout } from '../components/ui';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { useDeviceStore } from '../stores/devices';
import { cn } from '../lib/utils';
import type { DeviceDescriptor } from '../lib/devices/types';

interface SessionMeta {
  projectDir?: string;
  branch?: string;
  model?: string;
  loadedKits?: string[];
  activeView?: string;
  lastMessage?: string;
  pid?: number;
}

function SessionCard({ session }: { session: DeviceDescriptor }) {
  const [showCommand, setShowCommand] = useState(false);
  const [command, setCommand] = useState('');
  const meta = session.metadata as SessionMeta;
  const isConnected = session.status === 'connected';

  const projectName = meta.projectDir
    ? meta.projectDir.split(/[\\/]/).pop() ?? 'Unknown'
    : session.name;

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/30',
            )}
          >
            <Terminal size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{projectName}</h3>
            <p className="text-xs text-white/40">
              {meta.branch && (
                <span className="inline-flex items-center gap-1 mr-2">
                  <GitBranch size={10} /> {meta.branch}
                </span>
              )}
              {meta.model && <span className="text-white/25">{meta.model}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-emerald-400' : 'bg-white/20')} />
          <span className="text-xs text-white/50 capitalize">{session.status}</span>
        </div>
      </div>

      {meta.loadedKits && meta.loadedKits.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {meta.loadedKits.map((kit) => (
            <Badge key={kit} variant="outline" size="sm">
              <Package size={10} /> {kit}
            </Badge>
          ))}
        </div>
      )}

      {meta.lastMessage && (
        <div className="text-xs text-white/30 truncate flex items-center gap-1">
          <MessageSquare size={10} />
          {meta.lastMessage}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCommand(!showCommand)}
          disabled={!isConnected}
        >
          <Send size={12} /> Send Command
        </Button>
      </div>

      {showCommand && (
        <div className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type a prompt to send..."
            className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white placeholder:text-white/20 focus:border-cyan-400/50 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && command.trim()) {
                // TODO: Wire to device command when session-connector is live
                setCommand('');
                setShowCommand(false);
              }
            }}
          />
          <Button variant="primary" size="sm" disabled={!command.trim()}>
            <Send size={12} />
          </Button>
        </div>
      )}
    </GlassCard>
  );
}

export default function ConnectedSessionsView() {
  const { devices, scanDevices } = useDeviceStore();
  const [scanning, setScanning] = useState(false);

  const sessions = useMemo(
    () => Object.values(devices).filter((d) => d.class === 'agent-session'),
    [devices],
  );

  const connected = sessions.filter((s) => s.status === 'connected').length;

  useEffect(() => {
    scanDevices();
    const interval = setInterval(scanDevices, 10000);
    return () => clearInterval(interval);
  }, [scanDevices]);

  async function handleScan() {
    setScanning(true);
    await scanDevices();
    setTimeout(() => setScanning(false), 600);
  }

  return (
    <PageShell>
      <PageHeader
        title="Connected Sessions"
        icon={<MonitorSmartphone size={24} />}
      >
        <Button variant="secondary" size="sm" onClick={handleScan} disabled={scanning}>
          <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
          Discover
        </Button>
      </PageHeader>

      <GridLayout cols={3}>
        <StatCard label="Connected" value={connected} icon={<Wifi size={18} />} color="#10B981" />
        <StatCard label="Total Sessions" value={sessions.length} icon={<Terminal size={18} />} color="#00F0FF" />
        <StatCard label="Projects" value={new Set(sessions.map((s) => (s.metadata as SessionMeta).projectDir)).size} icon={<Users size={18} />} color="#8B5CF6" />
      </GridLayout>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-6">
        {sessions.length === 0 ? (
          <EmptyState
            icon={<WifiOff size={40} />}
            title="No sessions discovered"
            description="Sessions are discovered from ~/.claude/projects/ on this machine. Start a Claude Code session in another project to see it here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <motion.div key={session.id} variants={fadeInUp}>
                <SessionCard session={session} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </PageShell>
  );
}
