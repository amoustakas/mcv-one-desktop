import { useState, useEffect } from 'react';
import { Volume2, Mic, Monitor, Moon, Sun, RotateCcw } from 'lucide-react';
import { APP_VERSION, BUILD_TIME } from '../lib/version';

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface Settings {
  inputDevice: string;
  outputDevice: string;
  inputVolume: number;
  outputVolume: number;
  theme: 'dark' | 'auto';
  autoTTS: boolean;
  compactMode: boolean;
  notificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  inputDevice: 'default',
  outputDevice: 'default',
  inputVolume: 80,
  outputVolume: 70,
  theme: 'dark',
  autoTTS: false,
  compactMode: false,
  notificationsEnabled: true,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('mcv-settings');
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

function saveSettings(s: Settings) {
  localStorage.setItem('mcv-settings', JSON.stringify(s));
}

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [health, setHealth] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;

    // Load audio devices
    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      setInputDevices(
        devices.filter((d) => d.kind === 'audioinput').map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
        }))
      );
      setOutputDevices(
        devices.filter((d) => d.kind === 'audiooutput').map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Speaker ${d.deviceId.slice(0, 8)}`,
        }))
      );
    }).catch(() => {});

    // Load health
    fetch('/api/health').then((r) => r.json()).then((d) => setHealth(d.configured || {})).catch(() => {});
  }, [open]);

  function update(partial: Partial<Settings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
  }

  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>&times;</button>
        </div>

        <div className="settings-scroll">
          {/* Audio Input */}
          <div className="settings-section">
            <h3><Mic size={14} /> Audio Input</h3>
            <label className="settings-label">Microphone</label>
            <select
              className="settings-select"
              value={settings.inputDevice}
              onChange={(e) => update({ inputDevice: e.target.value })}
            >
              <option value="default">System Default</option>
              {inputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
              ))}
            </select>
            <label className="settings-label">Input Level</label>
            <div className="settings-slider-row">
              <input
                type="range"
                min={0}
                max={100}
                value={settings.inputVolume}
                onChange={(e) => update({ inputVolume: Number(e.target.value) })}
                className="settings-slider"
              />
              <span className="settings-slider-val">{settings.inputVolume}%</span>
            </div>
          </div>

          {/* Audio Output */}
          <div className="settings-section">
            <h3><Volume2 size={14} /> Audio Output</h3>
            <label className="settings-label">Speaker</label>
            <select
              className="settings-select"
              value={settings.outputDevice}
              onChange={(e) => update({ outputDevice: e.target.value })}
            >
              <option value="default">System Default</option>
              {outputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
              ))}
            </select>
            <label className="settings-label">Output Volume</label>
            <div className="settings-slider-row">
              <input
                type="range"
                min={0}
                max={100}
                value={settings.outputVolume}
                onChange={(e) => update({ outputVolume: Number(e.target.value) })}
                className="settings-slider"
              />
              <span className="settings-slider-val">{settings.outputVolume}%</span>
            </div>
            <label className="settings-toggle-row">
              <input type="checkbox" checked={settings.autoTTS} onChange={(e) => update({ autoTTS: e.target.checked })} />
              <span>Auto-read Aegis responses aloud</span>
            </label>
          </div>

          {/* Display */}
          <div className="settings-section">
            <h3><Monitor size={14} /> Display</h3>
            <label className="settings-label">Theme</label>
            <div className="settings-btn-group">
              <button className={settings.theme === 'dark' ? 'active' : ''} onClick={() => update({ theme: 'dark' })}>
                <Moon size={12} /> Dark
              </button>
              <button className={settings.theme === 'auto' ? 'active' : ''} onClick={() => update({ theme: 'auto' })}>
                <Sun size={12} /> Auto
              </button>
            </div>
            <label className="settings-toggle-row">
              <input type="checkbox" checked={settings.compactMode} onChange={(e) => update({ compactMode: e.target.checked })} />
              <span>Compact mode</span>
            </label>
            <label className="settings-toggle-row">
              <input type="checkbox" checked={settings.notificationsEnabled} onChange={(e) => update({ notificationsEnabled: e.target.checked })} />
              <span>Enable notifications</span>
            </label>
          </div>

          {/* API Status */}
          <div className="settings-section">
            <h3>API Connections</h3>
            <div className="settings-api-grid">
              {Object.entries(health).map(([key, ok]) => (
                <div key={key} className="settings-api-row">
                  <div className={`settings-api-dot ${ok ? 'ok' : 'off'}`} />
                  <span>{key.replace(/_/g, ' ').replace(/API KEY|KEY|TOKEN/gi, '').trim()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="settings-section">
            <h3>About</h3>
            <div className="settings-about">
              <span>MCV One Desktop v{APP_VERSION}</span>
              <span className="settings-muted">Built {BUILD_TIME.slice(0, 16).replace('T', ' ')}</span>
              <span className="settings-muted">EdgeIQ Holdings</span>
            </div>
            <button className="settings-reset" onClick={() => { update(DEFAULT_SETTINGS); }}>
              <RotateCcw size={12} /> Reset to defaults
            </button>
          </div>
        </div>

        <style>{`
          .settings-overlay {
            position: fixed; inset: 0; z-index: 100;
            background: rgba(0,0,0,0.6);
            display: flex; justify-content: flex-end;
          }
          .settings-panel {
            width: 380px; max-width: 90vw; height: 100vh;
            background: var(--bg-surface);
            border-left: 1px solid var(--border);
            display: flex; flex-direction: column;
            animation: slideIn 0.2s ease;
          }
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
          .settings-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: var(--space-md) var(--space-lg);
            border-bottom: 1px solid var(--border);
          }
          .settings-header h2 { font-size: var(--text-lg); font-weight: 600; }
          .settings-close { font-size: 24px; color: var(--text-muted); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); }
          .settings-close:hover { background: var(--bg-card); color: var(--text-primary); }
          .settings-scroll { flex: 1; overflow-y: auto; padding: var(--space-md) var(--space-lg); display: flex; flex-direction: column; gap: var(--space-lg); }
          .settings-section h3 { font-size: var(--text-sm); font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; margin-bottom: var(--space-sm); }
          .settings-label { font-size: var(--text-xs); color: var(--text-muted); margin-bottom: 4px; display: block; }
          .settings-select {
            width: 100%; padding: 8px 12px; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm);
            color: var(--text-primary); font-size: var(--text-sm); margin-bottom: var(--space-sm); appearance: auto;
          }
          .settings-slider-row { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-sm); }
          .settings-slider { flex: 1; accent-color: var(--cyan); height: 4px; }
          .settings-slider-val { font-size: var(--text-xs); color: var(--text-muted); font-family: var(--font-mono); width: 36px; text-align: right; }
          .settings-toggle-row {
            display: flex; align-items: center; gap: var(--space-sm);
            font-size: var(--text-sm); color: var(--text-secondary); padding: 4px 0; cursor: pointer;
          }
          .settings-toggle-row input[type="checkbox"] { accent-color: var(--cyan); }
          .settings-btn-group { display: flex; gap: 4px; margin-bottom: var(--space-sm); }
          .settings-btn-group button {
            flex: 1; padding: 6px 12px; border-radius: var(--radius-sm); font-size: var(--text-xs);
            background: var(--bg-card); border: 1px solid var(--border); color: var(--text-secondary);
            display: flex; align-items: center; justify-content: center; gap: 4px; transition: all var(--transition-fast);
          }
          .settings-btn-group button.active { background: var(--bg-elevated); border-color: var(--cyan); color: var(--cyan); }
          .settings-api-grid { display: flex; flex-direction: column; gap: 4px; }
          .settings-api-row { display: flex; align-items: center; gap: 8px; font-size: var(--text-xs); color: var(--text-secondary); text-transform: capitalize; }
          .settings-api-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
          .settings-api-dot.ok { background: var(--success); box-shadow: 0 0 4px rgba(16,185,129,0.4); }
          .settings-api-dot.off { background: var(--text-muted); }
          .settings-about { display: flex; flex-direction: column; gap: 2px; font-size: var(--text-sm); }
          .settings-muted { font-size: var(--text-xs); color: var(--text-muted); }
          .settings-reset {
            margin-top: var(--space-sm); padding: 6px 12px; font-size: var(--text-xs);
            background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm);
            color: var(--text-muted); display: flex; align-items: center; gap: 4px; transition: all var(--transition-fast);
          }
          .settings-reset:hover { color: var(--error); border-color: var(--error); }
        `}</style>
      </div>
    </div>
  );
}
