import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu, Wifi, WifiOff, RefreshCw, Activity,
  MonitorSmartphone, Grid3x3, AudioLines, Zap, Search,
  Monitor, Smartphone, Tablet,
} from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Badge, EmptyState, Button, StatCard, GridLayout } from '../components/ui';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { useDeviceStore } from '../stores/devices';
import DeviceMesh from '../components/DeviceMesh';
import { usePresenceStore } from '../stores/presence';
import type { DeviceDescriptor, DeviceInputEvent } from '../lib/devices/types';

const STATUS_COLORS: Record<DeviceDescriptor['status'], string> = {
  connected: '#10B981',
  disconnected: '#6B7280',
  error: '#EF4444',
  initializing: '#F59E0B',
};

const CLASS_ICONS: Record<string, React.ReactNode> = {
  'stream-deck': <Grid3x3 size={20} />,
  goxlr: <AudioLines size={20} />,
  'midi-controller': <Activity size={20} />,
  'audio-interface': <AudioLines size={20} />,
  'barcode-scanner': <Search size={20} />,
  'hid-generic': <Cpu size={20} />,
  'serial-generic': <Zap size={20} />,
  'agent-session': <MonitorSmartphone size={20} />,
  'app-instance': <Monitor size={20} />,
};

function getInstanceIcon(metadata: Record<string, unknown>): React.ReactNode {
  const deviceType = metadata.deviceType as string;
  if (deviceType === 'phone') return <Smartphone size={20} />;
  if (deviceType === 'tablet') return <Tablet size={20} />;
  return <Monitor size={20} />;
}

function DeviceCard({ device }: { device: DeviceDescriptor }) {
  const color = STATUS_COLORS[device.status];
  const isInstance = device.class === 'app-instance';
  const meta = device.metadata as Record<string, unknown>;

  const icon = isInstance
    ? getInstanceIcon(meta)
    : (CLASS_ICONS[device.class] ?? <Cpu size={20} />);

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{device.name}</h3>
            <p className="text-xs text-white/40">
              {isInstance
                ? `${meta.screenClass} · ${meta.screenResolution} · ${meta.platform}`
                : `${device.manufacturer ? `${device.manufacturer} · ` : ''}${device.class} · ${device.transport}`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-white/50 capitalize">{device.status}</span>
        </div>
      </div>

      {/* Instance-specific details */}
      {isInstance && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/30">
          {meta.activeView ? <span>View: <span className="text-white/50">{String(meta.activeView)}</span></span> : null}
          {meta.activeVenture ? <span>Venture: <span className="text-cyan-400/70">{String(meta.activeVenture)}</span></span> : null}
          {meta.status ? <span>Status: <span className="text-white/50">{String(meta.status)}</span></span> : null}
          {meta.batteryLevel != null ? (
            <span>Battery: <span className="text-white/50">{Number(meta.batteryLevel)}%{meta.batteryCharging ? ' ⚡' : ''}</span></span>
          ) : null}
          {meta.screenLabel ? <span>Screen: <span className="text-white/50">{String(meta.screenLabel)}</span></span> : null}
          {meta.city ? <span>{String(meta.city)}</span> : null}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {device.capabilities.map((cap) => (
          <Badge key={cap} variant="outline" size="sm">{cap}</Badge>
        ))}
      </div>
    </GlassCard>
  );
}

function EventLogEntry({ event }: { event: DeviceInputEvent }) {
  const age = Date.now() - event.timestamp;
  const label = age < 1000 ? 'now' : age < 60000 ? `${Math.floor(age / 1000)}s` : `${Math.floor(age / 60000)}m`;
  return (
    <div className="flex items-center gap-3 px-3 py-2 text-xs border-b border-white/5 last:border-0">
      <span className="text-white/30 w-8 text-right font-mono">{label}</span>
      <span className="text-cyan-400 font-mono w-28 truncate">{event.type}</span>
      <span className="text-white/50 truncate flex-1">{JSON.stringify(event.payload)}</span>
    </div>
  );
}

export default function DeviceHubView() {
  const { devices, eventLog, scanDevices } = useDeviceStore();
  const presenceDeviceCount = usePresenceStore((s) => s.getDeviceCount());
  const [scanning, setScanning] = useState(false);
  const deviceList = Object.values(devices);
  const connected = deviceList.filter((d) => d.status === 'connected').length;
  const total = deviceList.length;
  const instanceCount = deviceList.filter((d) => d.class === 'app-instance' && d.status === 'connected').length;
  const hardwareCount = deviceList.filter((d) => d.class !== 'app-instance' && d.class !== 'agent-session' && d.status === 'connected').length;

  useEffect(() => {
    scanDevices();
    const interval = setInterval(scanDevices, 5000);
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
        title="Device Hub"
        icon={<Cpu size={24} />}
      >
        <Button variant="secondary" size="sm" onClick={handleScan} disabled={scanning}>
          <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
          Scan
        </Button>
      </PageHeader>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            Connected MCV Sessions
          </h2>
          <Badge variant="outline" size="sm">
            {presenceDeviceCount} device{presenceDeviceCount !== 1 ? 's' : ''}
          </Badge>
        </div>
        <GlassCard className="p-4">
          <DeviceMesh />
        </GlassCard>
      </motion.div>

      <GridLayout cols={6}>
        <StatCard label="Connected" value={connected} icon={<Wifi size={18} />} color="#10B981" />
        <StatCard label="Screens" value={instanceCount} icon={<Monitor size={18} />} color="#3B82F6" />
        <StatCard label="Hardware" value={hardwareCount} icon={<Cpu size={18} />} color="#00F0FF" />
        <StatCard label="Total" value={total} icon={<Cpu size={18} />} color="#6B7280" />
        <StatCard label="Events/min" value={eventLog.filter((e) => Date.now() - e.timestamp < 60000).length} icon={<Activity size={18} />} color="#8B5CF6" />
        <StatCard label="Mappings" value={useDeviceStore.getState().mappings.length} icon={<Zap size={18} />} color="#F59E0B" />
      </GridLayout>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-6">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Devices
        </h2>
        {deviceList.length === 0 ? (
          <EmptyState
            icon={<WifiOff size={40} />}
            title="No devices detected"
            description="Connect a Stream Deck, GoXLR, MIDI controller, or other USB device. Make sure the local server is running on port 3100."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {deviceList.map((device) => (
              <motion.div key={device.id} variants={fadeInUp}>
                <DeviceCard device={device} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-6">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Event Log
        </h2>
        <GlassCard className="max-h-64 overflow-y-auto">
          {eventLog.length === 0 ? (
            <div className="p-6 text-center text-white/30 text-sm">
              No events yet. Interact with a connected device to see events here.
            </div>
          ) : (
            eventLog.slice(0, 50).map((event) => (
              <EventLogEntry key={event.id} event={event} />
            ))
          )}
        </GlassCard>
      </motion.div>
    </PageShell>
  );
}
