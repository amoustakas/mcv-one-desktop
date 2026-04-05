import { useState } from 'react';
import {
  Monitor, Smartphone, Tablet, MapPin, Clock, Wifi, Battery,
  Cpu, HardDrive, Globe, Edit3, Check,
} from 'lucide-react';
import { usePresenceStore, STATUS_COLORS, STATUS_LABELS } from '../stores/presence';
import { setDeviceName, getTimezoneAbbr } from '../lib/device';
import type { PresenceState } from '../stores/presence';
import { GlassCard } from './ui';

// ---------------------------------------------------------------------------
// PresenceCard — Flyout card with full presence details
// Shown when clicking the header avatar.
// ---------------------------------------------------------------------------

const DEVICE_ICONS = { desktop: Monitor, phone: Smartphone, tablet: Tablet };

function DeviceRow({ device, isOwn }: { device: PresenceState; isOwn: boolean }) {
  const Icon = DEVICE_ICONS[device.deviceType] || Monitor;
  return (
    <div className={`pc-device ${isOwn ? 'pc-device-own' : ''}`}>
      <Icon size={14} style={{ color: isOwn ? 'var(--cyan)' : 'var(--text-muted)' }} />
      <div className="pc-device-info">
        <span className="pc-device-name">{device.deviceName}</span>
        <span className="pc-device-meta">{device.screenClass} · {device.platform}</span>
      </div>
      {device.batteryLevel !== undefined && (
        <span className="pc-device-battery">
          <Battery size={10} /> {device.batteryLevel}%
        </span>
      )}
      <span className="pc-device-dot" style={{ backgroundColor: STATUS_COLORS[device.status] }} />
    </div>
  );
}

export default function PresenceCard({ onClose }: { onClose: () => void }) {
  const ownPresence = usePresenceStore((s) => s.ownPresence);
  const myDevices = usePresenceStore((s) => s.getMyDevices());
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(ownPresence?.deviceName || '');
  const updateOwn = usePresenceStore((s) => s.updateOwn);

  if (!ownPresence) return null;

  const statusColor = STATUS_COLORS[ownPresence.status];
  const statusLabel = STATUS_LABELS[ownPresence.status];
  const timeSince = ownPresence.statusSince
    ? Math.floor((Date.now() - new Date(ownPresence.statusSince).getTime()) / 60_000)
    : 0;
  const localTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: ownPresence.timezone,
  });
  const tzAbbr = getTimezoneAbbr();

  function handleSaveName() {
    if (nameInput.trim()) {
      setDeviceName(nameInput.trim());
      updateOwn({ deviceName: nameInput.trim() });
    }
    setEditingName(false);
  }

  return (
    <div className="pc-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
      <GlassCard className="pc-card">
        {/* Status */}
        <div className="pc-section">
          <div className="pc-status-row">
            <span className="pc-status-dot" style={{ backgroundColor: statusColor }} />
            <span className="pc-status-label" style={{ color: statusColor }}>{statusLabel}</span>
            {timeSince > 0 && <span className="pc-status-since">for {timeSince}m</span>}
          </div>
          <div className="pc-status-text">{ownPresence.statusText}</div>
        </div>

        {/* Location */}
        <div className="pc-section">
          <div className="pc-section-label">Location</div>
          <div className="pc-info-row"><MapPin size={12} /> {ownPresence.city || 'Unknown'}</div>
          <div className="pc-info-row"><Clock size={12} /> {localTime} {tzAbbr}</div>
          <div className="pc-info-row"><Globe size={12} /> {ownPresence.timezone}</div>
          <div className="pc-info-row"><Wifi size={12} /> {ownPresence.networkType}</div>
        </div>

        {/* Devices */}
        <div className="pc-section">
          <div className="pc-section-label">Connected Devices ({myDevices.length})</div>
          {myDevices.map((d) => (
            <DeviceRow key={d.deviceId} device={d} isOwn={d.deviceId === ownPresence.deviceId} />
          ))}
        </div>

        {/* Device Name */}
        <div className="pc-section">
          <div className="pc-section-label">This Device</div>
          {editingName ? (
            <div className="pc-name-edit">
              <input
                className="pc-name-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
              <button className="pc-name-save" onClick={handleSaveName}><Check size={12} /></button>
            </div>
          ) : (
            <div className="pc-name-display" onClick={() => setEditingName(true)}>
              <span>{ownPresence.deviceName}</span>
              <Edit3 size={10} />
            </div>
          )}
          <div className="pc-info-row" style={{ marginTop: 4 }}>
            <Monitor size={12} /> {ownPresence.screenResolution} · {ownPresence.screenClass}
          </div>
        </div>

        {/* System Health (desktop only) */}
        {ownPresence.systemHealth && (
          <div className="pc-section">
            <div className="pc-section-label">System Health</div>
            <div className="pc-health-row">
              <Cpu size={12} />
              <span>CPU</span>
              <span className="pc-health-value">{ownPresence.systemHealth.cpuCount} cores</span>
            </div>
            <div className="pc-health-row">
              <HardDrive size={12} />
              <span>Memory</span>
              <div className="pc-health-bar">
                <div className="pc-health-fill" style={{
                  width: `${Math.round((ownPresence.systemHealth.memoryUsed / ownPresence.systemHealth.memoryTotal) * 100)}%`,
                }} />
              </div>
              <span className="pc-health-value">
                {ownPresence.systemHealth.memoryUsed.toFixed(1)}/{ownPresence.systemHealth.memoryTotal.toFixed(1)} GB
              </span>
            </div>
          </div>
        )}

        <style>{`
          .pc-overlay{position:fixed;inset:0;z-index:999;display:flex;justify-content:flex-end;padding-top:56px;padding-right:12px}
          .pc-card{width:320px;max-height:calc(100vh - 80px);overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px;animation:pc-slide 0.2s ease}
          @keyframes pc-slide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
          .pc-section{display:flex;flex-direction:column;gap:6px}
          .pc-section-label{font-size:9px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px}
          .pc-status-row{display:flex;align-items:center;gap:8px}
          .pc-status-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
          .pc-status-label{font-size:14px;font-weight:600}
          .pc-status-since{font-size:10px;color:var(--text-muted)}
          .pc-status-text{font-size:12px;color:var(--text-secondary)}
          .pc-info-row{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-secondary)}
          .pc-device{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:var(--radius-sm);border:1px solid var(--border)}
          .pc-device-own{border-color:rgba(0,240,255,0.2);background:rgba(0,240,255,0.03)}
          .pc-device-info{flex:1;min-width:0}
          .pc-device-name{display:block;font-size:11px;font-weight:500}
          .pc-device-meta{display:block;font-size:9px;color:var(--text-muted)}
          .pc-device-battery{font-size:9px;color:var(--text-muted);display:flex;align-items:center;gap:2px}
          .pc-device-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
          .pc-name-display{display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;color:var(--text-secondary)}
          .pc-name-display:hover{color:var(--cyan)}
          .pc-name-edit{display:flex;gap:4px}
          .pc-name-input{flex:1;padding:4px 8px;background:var(--bg-input);border:1px solid var(--border-active);border-radius:var(--radius-sm);color:var(--text-primary);font-size:12px;outline:none}
          .pc-name-save{padding:4px 8px;background:var(--cyan);color:var(--bg-deep);border:none;border-radius:var(--radius-sm);cursor:pointer}
          .pc-health-row{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-secondary)}
          .pc-health-bar{flex:1;height:4px;background:var(--bg-input);border-radius:2px;overflow:hidden}
          .pc-health-fill{height:100%;background:var(--cyan);border-radius:2px}
          .pc-health-value{font-size:10px;font-family:var(--font-mono);color:var(--text-muted);white-space:nowrap}
        `}</style>
      </GlassCard>
      </div>
    </div>
  );
}
