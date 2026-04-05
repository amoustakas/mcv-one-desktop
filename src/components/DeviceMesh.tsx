import { Monitor, Smartphone, Tablet, Battery, Wifi } from 'lucide-react';
import { usePresenceStore, STATUS_COLORS } from '../stores/presence';
import type { PresenceState } from '../stores/presence';
import { GlassCard } from './ui';

// ---------------------------------------------------------------------------
// DeviceMesh — Visual grid of all connected devices
// Shows each device as a card with type icon, name, status, battery, network.
// Active device (this one) highlighted with cyan border.
// ---------------------------------------------------------------------------

const DEVICE_ICONS = { desktop: Monitor, phone: Smartphone, tablet: Tablet };

function DeviceCard({ device, isCurrentDevice }: { device: PresenceState; isCurrentDevice: boolean }) {
  const Icon = DEVICE_ICONS[device.deviceType] || Monitor;
  const statusColor = STATUS_COLORS[device.status];

  return (
    <GlassCard className={`dm-card ${isCurrentDevice ? 'dm-card-current' : ''}`}>
      <div className="dm-card-header">
        <Icon size={20} style={{ color: isCurrentDevice ? 'var(--cyan)' : 'var(--text-secondary)' }} />
        <span className="dm-card-dot" style={{ backgroundColor: statusColor }} />
      </div>
      <div className="dm-card-name">{device.deviceName}</div>
      <div className="dm-card-meta">{device.screenClass} · {device.platform}</div>
      <div className="dm-card-status" style={{ color: statusColor }}>{device.statusText}</div>
      <div className="dm-card-footer">
        {device.batteryLevel !== undefined && (
          <span className="dm-card-info"><Battery size={10} /> {device.batteryLevel}%</span>
        )}
        <span className="dm-card-info"><Wifi size={10} /> {device.networkType}</span>
      </div>

      <style>{`
        .dm-card{padding:12px;display:flex;flex-direction:column;gap:4px;min-width:140px}
        .dm-card-current{border-color:rgba(0,240,255,0.3);background:rgba(0,240,255,0.03)}
        .dm-card-header{display:flex;align-items:center;justify-content:space-between}
        .dm-card-dot{width:8px;height:8px;border-radius:50%}
        .dm-card-name{font-size:12px;font-weight:600;margin-top:4px}
        .dm-card-meta{font-size:9px;color:var(--text-muted)}
        .dm-card-status{font-size:10px;font-weight:500;margin-top:2px}
        .dm-card-footer{display:flex;gap:8px;margin-top:4px}
        .dm-card-info{display:flex;align-items:center;gap:3px;font-size:9px;color:var(--text-muted)}
      `}</style>
    </GlassCard>
  );
}

export default function DeviceMesh() {
  const ownPresence = usePresenceStore((s) => s.ownPresence);
  const myDevices = usePresenceStore((s) => s.getMyDevices());

  if (!ownPresence || myDevices.length === 0) return null;

  return (
    <div className="dm-grid">
      {myDevices.map((device) => (
        <DeviceCard
          key={device.deviceId}
          device={device}
          isCurrentDevice={device.deviceId === ownPresence.deviceId}
        />
      ))}

      <style>{`
        .dm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
      `}</style>
    </div>
  );
}
