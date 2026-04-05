import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MonitorSmartphone, RefreshCw, Terminal, GitBranch, Package,
  MessageSquare, Send, Wifi, WifiOff, Users, Monitor, Smartphone,
  Tablet, Loader2, Radio, Battery, BatteryCharging,
} from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Badge, EmptyState, Button, StatCard, GridLayout } from '../components/ui';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { useDeviceStore } from '../stores/devices';
import { usePresenceStore, STATUS_COLORS, STATUS_LABELS } from '../stores/presence';
import { getTimezoneAbbr } from '../lib/device';
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

interface InstanceMeta {
  screenClass?: string;
  screenResolution?: string;
  platform?: string;
  deviceType?: string;
  activeView?: string;
  activeVenture?: string;
  batteryLevel?: number;
  batteryCharging?: boolean;
  status?: string;
  city?: string;
}

function getPlatformIcon(platform?: string): React.ReactNode {
  if (!platform) return <Monitor size={10} />;
  const p = platform.toLowerCase();
  if (p.includes('win')) return <Monitor size={10} />;
  if (p.includes('mac') || p.includes('darwin')) return <Monitor size={10} />;
  if (p.includes('ios')) return <Smartphone size={10} />;
  if (p.includes('android')) return <Smartphone size={10} />;
  if (p.includes('linux')) return <Monitor size={10} />;
  return <Monitor size={10} />;
}

function getDeviceTypeIcon(deviceType?: string): React.ReactNode {
  if (deviceType === 'phone') return <Smartphone size={20} />;
  if (deviceType === 'tablet') return <Tablet size={20} />;
  return <Monitor size={20} />;
}

function SessionCard({ session }: { session: DeviceDescriptor }) {
  const { sendCommand } = useDeviceStore();
  const [showCommand, setShowCommand] = useState(false);
  const [command, setCommand] = useState('');
  const [sending, setSending] = useState(false);
  const meta = session.metadata as SessionMeta;
  const isConnected = session.status === 'connected';

  const projectName = meta.projectDir
    ? meta.projectDir.split(/[\\/]/).pop() ?? 'Unknown'
    : session.name;

  const handleSend = useCallback(async () => {
    if (!command.trim() || sending) return;
    setSending(true);
    try {
      await sendCommand({
        id: `cmd-${Date.now()}`,
        deviceId: session.id,
        type: 'send-agent-command',
        payload: { prompt: command },
      });
      setCommand('');
      setShowCommand(false);
    } finally {
      setSending(false);
    }
  }, [command, sending, sendCommand, session.id]);

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
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
          />
          <Button variant="primary" size="sm" disabled={!command.trim() || sending} onClick={handleSend}>
            {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </Button>
        </div>
      )}
    </GlassCard>
  );
}

function AppInstanceCard({ device }: { device: DeviceDescriptor }) {
  const meta = device.metadata as InstanceMeta;
  const isConnected = device.status === 'connected';

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isConnected ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/30',
            )}
          >
            {getDeviceTypeIcon(meta.deviceType)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{device.name}</h3>
            <p className="text-xs text-white/40 flex items-center gap-1">
              {getPlatformIcon(meta.platform)}
              <span>{meta.platform ?? 'unknown'}</span>
              {meta.screenResolution && <span className="text-white/25">· {meta.screenResolution}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Battery indicator */}
          {meta.batteryLevel != null && (
            <div className="flex items-center gap-1 text-xs text-white/40">
              {meta.batteryCharging ? <BatteryCharging size={14} /> : <Battery size={14} />}
              <span>{meta.batteryLevel}%</span>
            </div>
          )}
          <div className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-blue-400' : 'bg-white/20')} />
          <span className="text-xs text-white/50 capitalize">{device.status}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/30">
        {meta.screenClass && (
          <span>Screen: <span className="text-white/50 capitalize">{meta.screenClass}</span></span>
        )}
        {meta.activeView && (
          <span>View: <span className="text-white/50">{meta.activeView}</span></span>
        )}
        {meta.activeVenture && (
          <span>Venture: <span className="text-cyan-400/70">{meta.activeVenture}</span></span>
        )}
        {meta.status && (
          <span>Status: <span className="text-white/50">{meta.status}</span></span>
        )}
        {meta.city && <span>{meta.city}</span>}
      </div>

      <div className="flex flex-wrap gap-1">
        {device.capabilities.map((cap) => (
          <Badge key={cap} variant="outline" size="sm">{cap}</Badge>
        ))}
      </div>
    </GlassCard>
  );
}

function MyPresenceCard() {
  const { ownPresence, getDeviceCount } = usePresenceStore();

  if (!ownPresence) return null;

  const statusColor = STATUS_COLORS[ownPresence.status];
  const statusLabel = STATUS_LABELS[ownPresence.status];
  const deviceCount = getDeviceCount();
  const tzAbbr = getTimezoneAbbr();

  return (
    <GlassCard className="p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <MonitorSmartphone size={16} className="text-white/40" />
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          My Presence
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}60` }}
          />
          <div>
            <p className="text-sm font-medium text-white">{statusLabel}</p>
            {ownPresence.statusText && (
              <p className="text-xs text-white/40 truncate max-w-[140px]">{ownPresence.statusText}</p>
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <p className="text-xs text-white/40 mb-0.5">Location</p>
          <p className="text-sm text-white">
            {ownPresence.city || 'Unknown'}
            {tzAbbr && <span className="text-white/30 ml-1">({tzAbbr})</span>}
          </p>
        </div>

        {/* Devices */}
        <div>
          <p className="text-xs text-white/40 mb-0.5">Devices</p>
          <p className="text-sm text-white">{deviceCount}</p>
        </div>

        {/* Screen Class */}
        <div>
          <p className="text-xs text-white/40 mb-0.5">Screen</p>
          <p className="text-sm text-white capitalize">{ownPresence.screenClass}</p>
        </div>
      </div>
    </GlassCard>
  );
}

export default function ConnectedSessionsView() {
  const { devices, scanDevices, sendCommand } = useDeviceStore();
  const [scanning, setScanning] = useState(false);
  const [broadcastPrompt, setBroadcastPrompt] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  // Include both agent sessions and app instances
  const sessions = useMemo(
    () => Object.values(devices).filter((d) => d.class === 'agent-session'),
    [devices],
  );

  const appInstances = useMemo(
    () => Object.values(devices).filter((d) => d.class === 'app-instance'),
    [devices],
  );

  const allItems = useMemo(() => [...appInstances, ...sessions], [appInstances, sessions]);
  const connected = allItems.filter((s) => s.status === 'connected').length;

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

  const handleBroadcast = useCallback(async () => {
    if (!broadcastPrompt.trim() || broadcasting) return;
    setBroadcasting(true);
    try {
      const connectedItems = allItems.filter((d) => d.status === 'connected');
      await Promise.all(
        connectedItems.map((device) =>
          sendCommand({
            id: `broadcast-${Date.now()}-${device.id}`,
            deviceId: device.id,
            type: 'send-agent-command',
            payload: { prompt: broadcastPrompt },
          }),
        ),
      );
      setBroadcastPrompt('');
      setShowBroadcast(false);
    } finally {
      setBroadcasting(false);
    }
  }, [broadcastPrompt, broadcasting, allItems, sendCommand]);

  return (
    <PageShell>
      <PageHeader
        title="Connected Sessions"
        icon={<MonitorSmartphone size={24} />}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBroadcast(!showBroadcast)}
          >
            <Radio size={14} /> Broadcast
          </Button>
          <Button variant="secondary" size="sm" onClick={handleScan} disabled={scanning}>
            <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
            Discover
          </Button>
        </div>
      </PageHeader>

      {/* Broadcast command bar */}
      {showBroadcast && (
        <GlassCard className="p-4 mb-6 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Radio size={14} className="text-purple-400" />
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Broadcast to All ({connected} connected)
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={broadcastPrompt}
              onChange={(e) => setBroadcastPrompt(e.target.value)}
              placeholder="Type a prompt to send to all connected sessions..."
              className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-sm text-white placeholder:text-white/20 focus:border-purple-400/50 focus:outline-none"
              disabled={broadcasting}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBroadcast();
              }}
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!broadcastPrompt.trim() || broadcasting}
              onClick={handleBroadcast}
            >
              {broadcasting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Send
            </Button>
          </div>
        </GlassCard>
      )}

      <MyPresenceCard />

      <GridLayout cols={4}>
        <StatCard label="Connected" value={connected} icon={<Wifi size={18} />} color="#10B981" />
        <StatCard label="Agent Sessions" value={sessions.length} icon={<Terminal size={18} />} color="#00F0FF" />
        <StatCard label="App Instances" value={appInstances.length} icon={<Monitor size={18} />} color="#3B82F6" />
        <StatCard label="Projects" value={new Set(sessions.map((s) => (s.metadata as SessionMeta).projectDir)).size} icon={<Users size={18} />} color="#8B5CF6" />
      </GridLayout>

      {/* App Instances section */}
      {appInstances.length > 0 && (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              App Instances
            </h2>
            <div className="flex-1 h-px bg-white/5" />
            <Badge variant="outline" size="sm">
              {appInstances.filter((d) => d.status === 'connected').length}/{appInstances.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {appInstances.map((instance) => (
              <motion.div key={instance.id} variants={fadeInUp}>
                <AppInstanceCard device={instance} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Agent Sessions section */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-6">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Agent Sessions
          </h2>
          <div className="flex-1 h-px bg-white/5" />
          <Badge variant="outline" size="sm">
            {sessions.filter((s) => s.status === 'connected').length}/{sessions.length}
          </Badge>
        </div>
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
