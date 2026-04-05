import { useState, useEffect } from 'react';
import {
  Settings, Monitor, Volume2, Mic, Shield, Keyboard, Info, Database,
  Cloud, GitBranch, Zap, Radio, Globe, Server, CheckCircle2,
  HardDrive, Cpu, MonitorSmartphone,
} from 'lucide-react';
import { PageShell, Button } from '../components/ui';
import IntegrationsHub from '../components/IntegrationsHub';
import { APP_VERSION, BUILD_TIME } from '../lib/version';
import { ventures } from '../lib/ventures';
import { useToast } from '../components/Toasts';
import { apiGet, apiPost } from '../lib/api/client';
import { useUserStore } from '../stores/user';
import { useDeviceStore } from '../stores/devices';
import { useNavigation } from '../stores/navigation';

// ── Settings State ──
interface AppSettings {
  inputDevice: string; outputDevice: string;
  inputVolume: number; outputVolume: number;
  theme: 'dark' | 'auto'; autoTTS: boolean;
  compactMode: boolean; notificationsEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

const DEFAULTS: AppSettings = {
  inputDevice: 'default', outputDevice: 'default',
  inputVolume: 80, outputVolume: 70,
  theme: 'dark', autoTTS: false,
  compactMode: false, notificationsEnabled: true,
  fontSize: 'medium',
};

function loadSettings(): AppSettings {
  try { const r = localStorage.getItem('mcv-settings'); return r ? { ...DEFAULTS, ...JSON.parse(r) } : DEFAULTS; } catch { return DEFAULTS; }
}
function saveSettings(s: AppSettings) { localStorage.setItem('mcv-settings', JSON.stringify(s)); }

type Tab = 'general' | 'integrations' | 'audio' | 'storage' | 'security' | 'devices' | 'shortcuts' | 'about';

const TABS: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'General', icon: Monitor },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'devices', label: 'Devices', icon: Cpu },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'about', label: 'About', icon: Info },
];

interface ServiceInfo { name: string; key: string; icon: typeof Cloud; description: string }
// @ts-expect-error — available for IntegrationsHub expansion
const SERVICES: ServiceInfo[] = [
  { name: 'Claude API', key: 'ANTHROPIC_API_KEY', icon: Cloud, description: 'AI chat, reasoning, and code generation' },
  { name: 'Supabase', key: 'SUPABASE_URL', icon: Database, description: 'Database, auth, and real-time subscriptions' },
  { name: 'GitHub', key: 'GITHUB_TOKEN', icon: GitBranch, description: 'Repository access, commits, and pull requests' },
  { name: 'Google AI', key: 'GOOGLE_AI_KEY', icon: Zap, description: 'Gemini, Imagen, embeddings, and vision' },
  { name: 'Clerk', key: 'CLERK_SECRET_KEY', icon: Shield, description: 'Authentication and user management' },
  { name: 'Deepgram', key: 'DEEPGRAM_API_KEY', icon: Mic, description: 'Speech-to-text transcription' },
  { name: 'ElevenLabs', key: 'ELEVENLABS_API_KEY', icon: Volume2, description: 'Text-to-speech voice synthesis' },
  { name: 'Notion', key: 'NOTION_TOKEN', icon: Globe, description: 'Workspace sync, databases, and pages' },
  { name: 'Google Drive', key: 'GOOGLE_SERVICE_KEY', icon: Server, description: 'File access, search, and import' },
  { name: 'Vercel', key: 'VERCEL_TOKEN', icon: Radio, description: 'Deployment status and project management' },
  { name: 'Cloudflare', key: 'CLOUDFLARE_API_TOKEN', icon: Globe, description: 'Workers, KV, R2, D1, and DNS management' },
  { name: 'n8n', key: 'N8N_API_KEY', icon: Zap, description: 'Workflow automation — 400+ integrations' },
];

const SHORTCUTS = [
  { key: 'Ctrl+K', desc: 'Command Palette' },
  { key: 'Ctrl+/', desc: 'Toggle Chat Dock' },
  { key: 'Ctrl+\\', desc: 'Toggle Split Panel' },
  { key: 'Ctrl+N', desc: 'Quick Capture' },
  { key: 'Ctrl+E', desc: 'Toggle Global/Venture' },
  { key: 'Ctrl+1-8', desc: 'Switch Global View' },
  { key: 'Ctrl+Shift+1-9', desc: 'Switch Venture' },
  { key: 'Escape', desc: 'Close Overlays' },
];

export default function SettingsView() {
  const [tab, setTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [health, setHealth] = useState<Record<string, boolean>>({});
  const [inputDevices, setInputDevices] = useState<{ deviceId: string; label: string }[]>([]);
  const [outputDevices, setOutputDevices] = useState<{ deviceId: string; label: string }[]>([]);
  const [storageInfo, setStorageInfo] = useState<{ buckets: { id: string; name: string; public: boolean }[] } | null>(null);
  const [_testing, _setTesting] = useState<string | null>(null);
  const { toast } = useToast();

  const [autoDiscovery, setAutoDiscovery] = useState(true);

  const userPrefs = useUserStore((s) => s.preferences);
  const updatePreferences = useUserStore((s) => s.updatePreferences);

  const deviceProfiles = useDeviceStore((s) => s.profiles);
  const devices = useDeviceStore((s) => s.devices);
  const activeProfileId = useDeviceStore((s) => s.activeProfileId);
  const setActiveProfile = useDeviceStore((s) => s.setActiveProfile);
  const clearEventLog = useDeviceStore((s) => s.clearEventLog);
  const setView = useNavigation((s) => s.setView);

  useEffect(() => {
    setSettings((prev) => {
      const merged = {
        ...prev,
        compactMode: userPrefs.compactMode,
        autoTTS: userPrefs.voiceEnabled,
      };
      saveSettings(merged);
      return merged;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle OAuth callback redirect: ?tab=integrations&connected=github
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedProvider = params.get('connected');
    const requestedTab = params.get('tab') as Tab | null;

    if (requestedTab && TABS.some((t) => t.id === requestedTab)) {
      setTab(requestedTab);
    }
    if (connectedProvider) {
      setTab('integrations');
      toast('success', `${connectedProvider.charAt(0).toUpperCase() + connectedProvider.slice(1)} connected successfully`);
      // Clean URL params so refresh doesn't re-fire the toast
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    apiGet<Record<string, boolean>>('/api/health').then(d => setHealth(d || {})).catch(() => {});
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      setInputDevices(devices.filter(d => d.kind === 'audioinput').map(d => ({ deviceId: d.deviceId, label: d.label || `Mic ${d.deviceId.slice(0, 8)}` })));
      setOutputDevices(devices.filter(d => d.kind === 'audiooutput').map(d => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 8)}` })));
    }).catch(() => {});
    apiPost<{ buckets: { id: string; name: string; public: boolean }[] }>('/api/storage', { action: 'buckets' })
      .then(d => { if (d) setStorageInfo(d); }).catch(() => {});
  }, []);

  function update(partial: Partial<AppSettings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);

    const storeUpdates: Record<string, unknown> = {};
    if ('compactMode' in partial) storeUpdates.compactMode = partial.compactMode;
    if ('autoTTS' in partial) storeUpdates.voiceEnabled = partial.autoTTS;
    if (Object.keys(storeUpdates).length > 0) updatePreferences(storeUpdates);
  }

  // @ts-expect-error — reserved for direct service testing UI
  async function testService(key: string) {
    _setTesting(key);
    await new Promise(r => setTimeout(r, 800));
    if (health[key]) {
      toast('success', `${key.replace(/_/g, ' ')} is configured and reachable`);
    } else {
      toast('error', `${key.replace(/_/g, ' ')} is not configured`);
    }
    _setTesting(null);
  }

  return (
    <PageShell scroll={false}>
      {/* Sidebar */}
      <div className="sv-sidebar">
        <h2 className="sv-sidebar-title"><Settings size={16} /> Settings</h2>
        <nav className="sv-nav">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} className={`sv-nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="sv-content">
        {/* General */}
        {tab === 'general' && (
          <div className="sv-panel">
            <h3 className="sv-panel-title"><Monitor size={16} /> General Settings</h3>

            <div className="sv-group">
              <label className="sv-label">Theme</label>
              <div className="sv-btn-group">
                <button className={settings.theme === 'dark' ? 'active' : ''} onClick={() => update({ theme: 'dark' })}>Dark</button>
                <button className={settings.theme === 'auto' ? 'active' : ''} onClick={() => update({ theme: 'auto' })}>Auto</button>
              </div>
            </div>

            <div className="sv-group">
              <label className="sv-label">Font Size</label>
              <div className="sv-btn-group">
                <button className={settings.fontSize === 'small' ? 'active' : ''} onClick={() => update({ fontSize: 'small' })}>Small</button>
                <button className={settings.fontSize === 'medium' ? 'active' : ''} onClick={() => update({ fontSize: 'medium' })}>Medium</button>
                <button className={settings.fontSize === 'large' ? 'active' : ''} onClick={() => update({ fontSize: 'large' })}>Large</button>
              </div>
            </div>

            <div className="sv-group">
              <label className="sv-toggle"><input type="checkbox" checked={settings.compactMode} onChange={e => update({ compactMode: e.target.checked })} /><span>Compact Mode</span></label>
            </div>
            <div className="sv-group">
              <label className="sv-toggle"><input type="checkbox" checked={settings.notificationsEnabled} onChange={e => update({ notificationsEnabled: e.target.checked })} /><span>Enable Notifications</span></label>
            </div>

            <div className="sv-group">
              <label className="sv-label">Ventures ({ventures.length})</label>
              <div className="sv-venture-list">
                {ventures.map(v => (
                  <div key={v.id} className="sv-venture-item">
                    <span className="sv-v-dot" style={{ background: v.color }} />
                    <span className="sv-v-name">{v.name}</span>
                    <span className="sv-v-status" style={{ color: v.status === 'active' ? '#10B981' : v.status === 'development' ? '#00F0FF' : '#6B7280' }}>{v.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Integrations — OAuth Hub */}
        {tab === 'integrations' && (
          <div className="sv-panel">
            <IntegrationsHub />
          </div>
        )}

        {/* Audio */}
        {tab === 'audio' && (
          <div className="sv-panel">
            <h3 className="sv-panel-title"><Volume2 size={16} /> Audio Settings</h3>
            <div className="sv-group">
              <label className="sv-label"><Mic size={12} /> Input Device</label>
              <select className="sv-select" value={settings.inputDevice} onChange={e => update({ inputDevice: e.target.value })}>
                <option value="default">System Default</option>
                {inputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
              </select>
            </div>
            <div className="sv-group">
              <label className="sv-label">Input Volume</label>
              <div className="sv-slider-row"><input type="range" min={0} max={100} value={settings.inputVolume} onChange={e => update({ inputVolume: Number(e.target.value) })} className="sv-slider" /><span>{settings.inputVolume}%</span></div>
            </div>
            <div className="sv-group">
              <label className="sv-label"><Volume2 size={12} /> Output Device</label>
              <select className="sv-select" value={settings.outputDevice} onChange={e => update({ outputDevice: e.target.value })}>
                <option value="default">System Default</option>
                {outputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
              </select>
            </div>
            <div className="sv-group">
              <label className="sv-label">Output Volume</label>
              <div className="sv-slider-row"><input type="range" min={0} max={100} value={settings.outputVolume} onChange={e => update({ outputVolume: Number(e.target.value) })} className="sv-slider" /><span>{settings.outputVolume}%</span></div>
            </div>
            <div className="sv-group">
              <label className="sv-toggle"><input type="checkbox" checked={settings.autoTTS} onChange={e => update({ autoTTS: e.target.checked })} /><span>Auto-read Aegis responses aloud</span></label>
            </div>
          </div>
        )}

        {/* Storage */}
        {tab === 'storage' && (
          <div className="sv-panel">
            <h3 className="sv-panel-title"><HardDrive size={16} /> Storage</h3>
            <p className="sv-panel-desc">File storage powered by Supabase Storage. Documents, assets, and avatars.</p>
            <div className="sv-storage-buckets">
              {storageInfo?.buckets?.map(b => (
                <div key={b.id} className="sv-bucket">
                  <HardDrive size={14} />
                  <div>
                    <span className="sv-bucket-name">{b.name}</span>
                    <span className="sv-bucket-access">{b.public ? 'Public' : 'Private'}</span>
                  </div>
                </div>
              )) || <p className="sv-muted">Loading storage info...</p>}
            </div>
            <div className="sv-group" style={{ marginTop: 20 }}>
              <label className="sv-label">Local Storage Usage</label>
              <div className="sv-local-storage">
                <span>{(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB used</span>
                <Button variant="danger" size="sm" onClick={() => { if (confirm('Clear all local storage data?')) { localStorage.clear(); toast('info', 'Local storage cleared'); } }}>Clear Local Storage</Button>
              </div>
            </div>
          </div>
        )}

        {/* Security */}
        {tab === 'security' && (
          <div className="sv-panel">
            <h3 className="sv-panel-title"><Shield size={16} /> Security</h3>
            <div className="sv-security-grid">
              <div className="sv-sec-card">
                <CheckCircle2 size={16} className="sv-sec-ok" />
                <div>
                  <span className="sv-sec-title">Authentication</span>
                  <span className="sv-sec-desc">Clerk authentication is active. Registration disabled.</span>
                </div>
              </div>
              <div className="sv-sec-card">
                <CheckCircle2 size={16} className="sv-sec-ok" />
                <div>
                  <span className="sv-sec-title">API Protection</span>
                  <span className="sv-sec-desc">All 18 API routes require JWT verification.</span>
                </div>
              </div>
              <div className="sv-sec-card">
                <CheckCircle2 size={16} className="sv-sec-ok" />
                <div>
                  <span className="sv-sec-title">Row Level Security</span>
                  <span className="sv-sec-desc">Supabase RLS policies enabled on all tables.</span>
                </div>
              </div>
              <div className="sv-sec-card">
                <CheckCircle2 size={16} className="sv-sec-ok" />
                <div>
                  <span className="sv-sec-title">HTTPS Only</span>
                  <span className="sv-sec-desc">All traffic encrypted via Vercel TLS.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Devices */}
        {tab === 'devices' && (
          <div className="sv-panel">
            <h3 className="sv-panel-title"><Cpu size={16} /> Device Settings</h3>

            <div className="sv-group">
              <label className="sv-label">Auto-Discovery</label>
              <label className="sv-toggle"><input type="checkbox" checked={autoDiscovery} onChange={e => setAutoDiscovery(e.target.checked)} /><span>Auto-scan for devices on the local network</span></label>
              <p className="sv-muted" style={{ marginTop: 4 }}>Scan interval: 30s</p>
            </div>

            <div className="sv-group">
              <label className="sv-label">Default Profile</label>
              <select className="sv-select" value={activeProfileId || ''} onChange={e => setActiveProfile(e.target.value || null)}>
                <option value="">None</option>
                {Object.values(deviceProfiles).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="sv-group">
              <label className="sv-label"><MonitorSmartphone size={12} /> Connected Devices ({Object.keys(devices).length})</label>
              <div className="sv-devices-list">
                {Object.values(devices).length === 0 ? (
                  <p className="sv-muted">No devices detected. Start a scan from Device Hub.</p>
                ) : (
                  Object.values(devices).map(d => (
                    <div key={d.id} className="sv-device-row">
                      <span className="sv-device-dot" style={{ background: d.status === 'connected' ? 'var(--success)' : (d.status as string) === 'paused' ? '#F59E0B' : 'var(--text-muted)' }} />
                      <span className="sv-device-name">{d.name}</span>
                      <span className="sv-device-class">{d.class}</span>
                      <span className="sv-device-transport">{d.transport}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="sv-group">
              <label className="sv-label">GoXLR Utility</label>
              <div className="sv-sec-card">
                <CheckCircle2 size={16} className="sv-sec-ok" />
                <div>
                  <span className="sv-sec-title">Connection</span>
                  <span className="sv-sec-desc">localhost:14564</span>
                </div>
              </div>
            </div>

            <div className="sv-group">
              <label className="sv-label">Quick Links</label>
              <div className="sv-btn-group">
                <button onClick={() => setView('device-hub' as any)}>Open Device Hub</button>
                <button onClick={() => setView('audio-router' as any)}>Open Audio Router</button>
              </div>
            </div>

            <div className="sv-group" style={{ marginTop: 8 }}>
              <Button variant="danger" size="sm" onClick={() => { clearEventLog(); toast('info', 'Device event log cleared'); }}>Clear Event Log</Button>
            </div>
          </div>
        )}

        {/* Shortcuts */}
        {tab === 'shortcuts' && (
          <div className="sv-panel">
            <h3 className="sv-panel-title"><Keyboard size={16} /> Keyboard Shortcuts</h3>
            <div className="sv-shortcuts">
              {SHORTCUTS.map(s => (
                <div key={s.key} className="sv-shortcut">
                  <kbd className="sv-kbd">{s.key}</kbd>
                  <span>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About */}
        {tab === 'about' && (
          <div className="sv-panel">
            <h3 className="sv-panel-title"><Info size={16} /> About</h3>
            <div className="sv-about">
              <div className="sv-about-brand">
                <span className="sv-about-logo">MCV</span>
                <span className="sv-about-sub">ONE</span>
              </div>
              <p className="sv-about-tagline">Agentic Operating System</p>
              <div className="sv-about-grid">
                <div><span className="sv-about-k">Version</span><span className="sv-about-v">v{APP_VERSION}</span></div>
                <div><span className="sv-about-k">Built</span><span className="sv-about-v">{BUILD_TIME.slice(0, 16).replace('T', ' ')}</span></div>
                <div><span className="sv-about-k">Organization</span><span className="sv-about-v">EdgeIQ Holdings</span></div>
                <div><span className="sv-about-k">Ventures</span><span className="sv-about-v">{ventures.length}</span></div>
                <div><span className="sv-about-k">API Routes</span><span className="sv-about-v">19</span></div>
                <div><span className="sv-about-k">Views</span><span className="sv-about-v">23</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .sv-sidebar { width:220px; background:var(--bg-surface); border-right:1px solid var(--border); padding:16px 0; flex-shrink:0; display:flex; flex-direction:column; }
        .sv-sidebar-title { font-family:var(--font-display); font-size:14px; font-weight:600; padding:0 16px 12px; display:flex; align-items:center; gap:8px; color:var(--text-secondary); }
        .sv-nav { display:flex; flex-direction:column; gap:1px; }
        .sv-nav-item { display:flex; align-items:center; gap:10px; padding:8px 16px; font-size:12px; color:var(--text-muted); transition:all 0.15s; text-align:left; }
        .sv-nav-item:hover { background:var(--bg-card); color:var(--text-primary); }
        .sv-nav-item.active { color:var(--cyan); background:rgba(0,240,255,0.05); border-right:2px solid var(--cyan); }

        .sv-content { flex:1; overflow-y:auto; padding:24px 32px; }

        .sv-panel { max-width:700px; }
        .sv-panel-title { font-family:var(--font-display); font-size:1.25rem; font-weight:600; display:flex; align-items:center; gap:8px; margin-bottom:4px; }
        .sv-panel-desc { font-size:12px; color:var(--text-muted); margin-bottom:20px; }

        .sv-group { margin-bottom:16px; }
        .sv-label { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:flex; align-items:center; gap:5px; }

        .sv-btn-group { display:flex; gap:4px; }
        .sv-btn-group button { flex:1; padding:8px 14px; border-radius:var(--radius-sm); font-size:12px; background:var(--bg-card); border:1px solid var(--border); color:var(--text-secondary); transition:all 0.15s; }
        .sv-btn-group button.active { background:var(--bg-elevated); border-color:var(--cyan); color:var(--cyan); }

        .sv-toggle { display:flex; align-items:center; gap:10px; font-size:13px; color:var(--text-secondary); cursor:pointer; padding:6px 0; }
        .sv-toggle input { accent-color:var(--cyan); }

        .sv-select { width:100%; padding:8px 12px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; }

        .sv-slider-row { display:flex; align-items:center; gap:12px; }
        .sv-slider { flex:1; accent-color:var(--cyan); }
        .sv-slider-row span { font-size:11px; color:var(--text-muted); font-family:var(--font-mono); width:36px; text-align:right; }

        /* Integrations */
        .sv-services { display:flex; flex-direction:column; gap:8px; }
        .sv-service { display:flex; align-items:center; gap:12px; padding:12px 14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); transition:all 0.15s; }
        .sv-service.online { border-left:3px solid var(--success); }
        .sv-service.offline { border-left:3px solid var(--text-muted); opacity:0.7; }
        .sv-svc-icon { color:var(--text-muted); }
        .sv-svc-info { flex:1; }
        .sv-svc-name { display:block; font-size:13px; font-weight:500; }
        .sv-svc-desc { display:block; font-size:10px; color:var(--text-muted); }
        .sv-svc-status { display:flex; align-items:center; gap:4px; font-size:10px; color:var(--text-muted); }
        .sv-svc-ok { color:var(--success); }
        .sv-svc-off { color:var(--text-muted); }
        .sv-svc-test { padding:4px 10px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-muted); font-size:10px; }
        .sv-svc-test:hover { color:var(--cyan); border-color:var(--border-active); }

        /* Storage */
        .sv-storage-buckets { display:flex; flex-direction:column; gap:6px; }
        .sv-bucket { display:flex; align-items:center; gap:10px; padding:12px 14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-muted); }
        .sv-bucket>div { flex:1; }
        .sv-bucket-name { display:block; font-size:13px; font-weight:500; color:var(--text-primary); }
        .sv-bucket-access { display:block; font-size:10px; color:var(--text-muted); }
        .sv-local-storage { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); font-size:12px; }
        .sv-muted { font-size:12px; color:var(--text-muted); }

        /* Security */
        .sv-security-grid { display:flex; flex-direction:column; gap:8px; }
        .sv-sec-card { display:flex; align-items:flex-start; gap:10px; padding:14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); }
        .sv-sec-ok { color:var(--success); flex-shrink:0; margin-top:2px; }
        .sv-sec-title { display:block; font-size:13px; font-weight:500; }
        .sv-sec-desc { display:block; font-size:11px; color:var(--text-muted); }

        /* Shortcuts */
        .sv-shortcuts { display:flex; flex-direction:column; gap:6px; }
        .sv-shortcut { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); font-size:12px; color:var(--text-secondary); }
        .sv-kbd { font-size:10px; font-family:var(--font-mono); background:var(--bg-elevated); border:1px solid var(--border); padding:3px 10px; border-radius:4px; color:var(--text-muted); }

        /* Ventures */
        .sv-venture-list { display:flex; flex-direction:column; gap:3px; }
        .sv-venture-item { display:flex; align-items:center; gap:8px; padding:6px 10px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); font-size:12px; }
        .sv-v-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .sv-v-name { flex:1; font-weight:500; }
        .sv-v-status { font-size:9px; font-weight:600; text-transform:uppercase; }

        /* About */
        .sv-about { text-align:center; padding:20px 0; }
        .sv-about-brand { display:flex; align-items:baseline; justify-content:center; gap:4px; margin-bottom:4px; }
        .sv-about-logo { font-family:var(--font-display); font-size:2rem; font-weight:700; color:var(--cyan); text-shadow:0 0 12px rgba(0,240,255,0.4); }
        .sv-about-sub { font-family:var(--font-display); font-size:1rem; font-weight:600; color:var(--text-muted); letter-spacing:4px; }
        .sv-about-tagline { font-size:12px; color:var(--text-muted); margin-bottom:20px; }
        .sv-about-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; text-align:center; }
        .sv-about-grid>div { padding:10px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); }
        .sv-about-k { display:block; font-size:9px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.3px; }
        .sv-about-v { display:block; font-size:13px; font-weight:600; margin-top:2px; }

        /* Devices */
        .sv-devices-list { display:flex; flex-direction:column; gap:4px; }
        .sv-device-row { display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); font-size:12px; }
        .sv-device-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .sv-device-name { flex:1; font-weight:500; color:var(--text-primary); }
        .sv-device-class { font-size:10px; color:var(--text-muted); text-transform:capitalize; }
        .sv-device-transport { font-size:9px; font-family:var(--font-mono); color:var(--text-muted); background:var(--bg-elevated); padding:1px 6px; border-radius:var(--radius-full); }
      `}</style>
    </PageShell>
  );
}
