import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Settings, Monitor, Volume2, Mic, Shield, Keyboard, Info, Database,
  Cloud, Zap, Server, CheckCircle2, HardDrive, Cpu, MonitorSmartphone,
  Search as SearchIcon, Sparkles, User, CreditCard, Key, AlertTriangle,
  Eye, EyeOff, Bell, Layers, RotateCcw, ChevronRight,
} from 'lucide-react';
import {
  PageShell, Button, SectionCard, Toolbar,
  FormField, Switch, Slider, Select, Combobox, Tooltip, Badge, ToggleGroup,
  Input,
} from '../components/ui';
import IntegrationsHub from '../components/IntegrationsHub';
import { APP_VERSION, BUILD_TIME } from '../lib/version';
import { ventures } from '../lib/ventures';
import { useToast } from '../components/Toasts';
import { apiGet, apiPost } from '../lib/api/client';
import { useUserStore } from '../stores/user';
import { useDeviceStore } from '../stores/devices';
import { useNavigation } from '../stores/navigation';
import { SETTINGS_REGISTRY, searchSettings, type SettingSectionId, type SettingScope } from '../lib/settings/registry';
import { useVentureOverrides } from '../lib/settings/venture-overrides';
import { useLocalApiKeys, resolveProvenance, type KeyProvenance } from '../lib/settings/local-api-keys';

// ─────────────────────────────────────────────
// Local audio settings (not yet in user store)
// ─────────────────────────────────────────────
interface AudioSettings {
  inputDevice: string; outputDevice: string;
  inputVolume: number; outputVolume: number;
  autoTTS: boolean; autoDiscovery: boolean;
}

const AUDIO_DEFAULTS: AudioSettings = {
  inputDevice: 'default', outputDevice: 'default',
  inputVolume: 80, outputVolume: 70,
  autoTTS: false, autoDiscovery: true,
};

function loadAudio(): AudioSettings {
  try { const r = localStorage.getItem('mcv-audio-settings'); return r ? { ...AUDIO_DEFAULTS, ...JSON.parse(r) } : AUDIO_DEFAULTS; } catch { return AUDIO_DEFAULTS; }
}
function saveAudio(s: AudioSettings) { localStorage.setItem('mcv-audio-settings', JSON.stringify(s)); }

// ─────────────────────────────────────────────
// Section registry
// ─────────────────────────────────────────────
type Tab = SettingSectionId;
const TABS: { id: Tab; label: string; icon: typeof Settings; summary?: string }[] = [
  { id: 'general', label: 'General', icon: Monitor, summary: 'Theme, density, accessibility' },
  { id: 'account', label: 'Account', icon: User, summary: 'Profile, default venture, clock' },
  { id: 'integrations', label: 'Integrations', icon: Zap, summary: 'OAuth, API keys, MCP' },
  { id: 'ai-models', label: 'AI & Models', icon: Sparkles, summary: 'Claude, Gemini, tokens' },
  { id: 'audio', label: 'Audio & Voice', icon: Volume2, summary: 'Mic, speakers, TTS' },
  { id: 'devices', label: 'Devices', icon: Cpu, summary: 'Profiles, GoXLR, discovery' },
  { id: 'storage', label: 'Storage', icon: HardDrive, summary: 'Buckets, cache, exports' },
  { id: 'security', label: 'Security', icon: Shield, summary: '2FA, audit log, SOC 2' },
  { id: 'billing', label: 'Billing', icon: CreditCard, summary: 'Plan, invoices, usage' },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard, summary: 'Keybindings' },
  { id: 'about', label: 'About', icon: Info, summary: 'Version, build info' },
];

// API key services with env var name + label
const API_KEY_SERVICES: { key: string; label: string; description: string; icon: typeof Zap }[] = [
  { key: 'ANTHROPIC_API_KEY', label: 'Claude API', description: 'AI chat, reasoning, code gen', icon: Zap },
  { key: 'GOOGLE_AI_KEY', label: 'Google AI (Gemini)', description: 'Long-context, vision, images', icon: Zap },
  { key: 'DEEPGRAM_API_KEY', label: 'Deepgram', description: 'Speech-to-text transcription', icon: Mic },
  { key: 'ELEVENLABS_API_KEY', label: 'ElevenLabs', description: 'Text-to-speech synthesis', icon: Volume2 },
  { key: 'GITHUB_TOKEN', label: 'GitHub', description: 'Repository access', icon: Cloud },
  { key: 'VERCEL_TOKEN', label: 'Vercel', description: 'Deployments & logs', icon: Cloud },
  { key: 'CLOUDFLARE_API_TOKEN', label: 'Cloudflare', description: 'Workers, KV, R2, D1', icon: Cloud },
  { key: 'N8N_API_KEY', label: 'n8n', description: 'Workflow automation', icon: Server },
];

const PROVENANCE_META: Record<KeyProvenance, { label: string; color: string; tip: string }> = {
  env:    { label: 'ENV', color: 'var(--success)', tip: 'Set via Vercel environment variable' },
  local:  { label: 'LOCAL', color: 'var(--warning)', tip: 'Stored in localStorage (dev convenience only)' },
  oauth:  { label: 'OAUTH', color: 'var(--cyan)', tip: 'Managed via OAuth flow' },
  unset:  { label: 'UNSET', color: 'var(--text-muted)', tip: 'Not configured' },
};

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
export default function SettingsView() {
  const [tab, setTab] = useState<Tab>('general');
  const [scope, setScope] = useState<SettingScope>('global');
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState<string | null>(null);
  const [audio, setAudio] = useState<AudioSettings>(loadAudio);
  const [inputDevices, setInputDevices] = useState<{ deviceId: string; label: string }[]>([]);
  const [outputDevices, setOutputDevices] = useState<{ deviceId: string; label: string }[]>([]);
  const [health, setHealth] = useState<Record<string, boolean>>({});
  const [storageInfo, setStorageInfo] = useState<{ buckets: { id: string; name: string; public: boolean }[] } | null>(null);
  const { toast } = useToast();

  const userPrefs = useUserStore((s) => s.preferences);
  const updatePreferences = useUserStore((s) => s.updatePreferences);
  const resetPreferences = useUserStore((s) => s.resetPreferences);

  const deviceProfiles = useDeviceStore((s) => s.profiles);
  const devices = useDeviceStore((s) => s.devices);
  const activeProfileId = useDeviceStore((s) => s.activeProfileId);
  const setActiveProfile = useDeviceStore((s) => s.setActiveProfile);
  const clearEventLog = useDeviceStore((s) => s.clearEventLog);
  const setView = useNavigation((s) => s.setView);
  const activeVenture = useNavigation((s) => s.activeVenture);

  const localKeys = useLocalApiKeys((s) => s.keys);
  const setLocalKey = useLocalApiKeys((s) => s.setKey);
  const removeLocalKey = useLocalApiKeys((s) => s.removeKey);

  const ventureId = activeVenture || 'mcv';
  const ventureMeta = ventures.find((v) => v.id === ventureId) || ventures[0];

  // Apply density / contrast / palette / reduced-motion to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.density = userPrefs.compactMode ? 'compact' : 'normal';
  }, [userPrefs.compactMode]);

  // Load async data
  useEffect(() => {
    apiGet<Record<string, boolean>>('/api/health').then((d) => setHealth(d || {})).catch(() => {});
    navigator.mediaDevices?.enumerateDevices().then((list) => {
      setInputDevices(list.filter((d) => d.kind === 'audioinput').map((d) => ({ deviceId: d.deviceId, label: d.label || `Mic ${d.deviceId.slice(0, 8)}` })));
      setOutputDevices(list.filter((d) => d.kind === 'audiooutput').map((d) => ({ deviceId: d.deviceId, label: d.label || `Speaker ${d.deviceId.slice(0, 8)}` })));
    }).catch(() => {});
    apiPost<{ buckets: { id: string; name: string; public: boolean }[] }>('/api/storage', { action: 'buckets' })
      .then((d) => { if (d) setStorageInfo(d); }).catch(() => {});
  }, []);

  // OAuth callback: ?tab=...&connected=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get('tab') as Tab | null;
    const connectedProvider = params.get('connected');
    const requestedScope = params.get('scope') as SettingScope | null;
    const settingId = params.get('setting');
    if (requestedTab && TABS.some((t) => t.id === requestedTab)) setTab(requestedTab);
    if (requestedScope === 'global' || requestedScope === 'venture') setScope(requestedScope);
    if (settingId) {
      const def = SETTINGS_REGISTRY.find((d) => d.id === settingId);
      if (def) { setTab(def.section); setHighlight(def.id); }
    }
    if (connectedProvider) {
      setTab('integrations');
      toast('success', `${connectedProvider.charAt(0).toUpperCase() + connectedProvider.slice(1)} connected`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear highlight after 2s
  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(() => setHighlight(null), 2000);
    return () => clearTimeout(t);
  }, [highlight]);

  const searchResults = useMemo(() => searchSettings(query, scope), [query, scope]);

  const updateAudio = (partial: Partial<AudioSettings>) => {
    const next = { ...audio, ...partial };
    setAudio(next);
    saveAudio(next);
  };

  const sectionsForScope = useMemo(() => {
    if (scope === 'global') return TABS;
    // Per-venture: only show sections that have venture-scoped settings
    const ventureSectionIds = new Set(
      SETTINGS_REGISTRY.filter((d) => d.scopes.includes('venture')).map((d) => d.section),
    );
    return TABS.filter((t) => ventureSectionIds.has(t.id));
  }, [scope]);

  return (
    <PageShell scroll={false}>
      <div className="settings-root">
        {/* ── Sidebar ── */}
        <aside className="settings-sidebar">
          <div className="settings-sidebar-head">
            <div className="settings-brand">
              <Settings size={16} />
              <span>Settings</span>
            </div>
            <Tooltip content="Reset all preferences to defaults">
              <button
                type="button"
                className="settings-reset"
                aria-label="Reset preferences"
                onClick={() => {
                  if (confirm('Reset all preferences to defaults? This cannot be undone.')) {
                    resetPreferences();
                    toast('info', 'Preferences reset');
                  }
                }}
              >
                <RotateCcw size={12} />
              </button>
            </Tooltip>
          </div>

          <nav className="settings-nav" aria-label="Settings sections">
            {sectionsForScope.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`settings-nav-item ${tab === t.id ? 'active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  <Icon size={14} />
                  <span className="settings-nav-label">{t.label}</span>
                  {t.summary && <span className="settings-nav-summary">{t.summary}</span>}
                  <ChevronRight size={12} className="settings-nav-chevron" />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Content ── */}
        <div className="settings-main">
          {/* Top toolbar: search + scope toggle */}
          <Toolbar
            sticky
            className="settings-toolbar"
            left={
              <div className="settings-search">
                <SearchIcon size={14} />
                <input
                  type="text"
                  placeholder="Search settings…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="settings-search-input"
                  aria-label="Search settings"
                />
                {query && (
                  <button type="button" className="settings-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                    ×
                  </button>
                )}
              </div>
            }
            right={
              <div className="settings-scope">
                <ToggleGroup
                  value={scope}
                  onChange={(v) => setScope(v)}
                  options={[
                    { value: 'global', label: 'Global', icon: <Layers size={12} /> },
                    { value: 'venture', label: ventureMeta.name, icon: <span className="settings-scope-dot" style={{ background: ventureMeta.color }} /> },
                  ]}
                  size="sm"
                />
              </div>
            }
          />

          {/* Search results panel — overlays content when query active */}
          {query.trim() && (
            <div className="settings-search-results">
              <SectionCard title={`Search results (${searchResults.length})`} padding="sm">
                {searchResults.length === 0 ? (
                  <p className="settings-empty">No settings match "{query}"</p>
                ) : (
                  <ul className="settings-result-list">
                    {searchResults.map(({ def }) => (
                      <li key={def.id}>
                        <button
                          type="button"
                          className="settings-result"
                          onClick={() => {
                            setTab(def.section);
                            setHighlight(def.id);
                            setQuery('');
                          }}
                        >
                          <div>
                            <span className="settings-result-label">{def.label}</span>
                            {def.description && <span className="settings-result-desc">{def.description}</span>}
                          </div>
                          <Badge color="#8899AA">{def.section}</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          )}

          <div className={`settings-content ${scope === 'venture' ? 'settings-content-venture' : ''}`}>
            {/* Per-venture banner */}
            {scope === 'venture' && (
              <div className="settings-venture-banner" style={{ borderColor: ventureMeta.color + '55' }}>
                <span className="settings-venture-dot" style={{ background: ventureMeta.color }} />
                <strong>{ventureMeta.name}</strong>
                <span className="settings-venture-hint">— per-venture overrides. Unset values inherit from Global.</span>
              </div>
            )}

            {tab === 'general' && (
              <GeneralSection
                userPrefs={userPrefs}
                updatePreferences={updatePreferences}
                highlight={highlight}
                scope={scope}
              />
            )}
            {tab === 'account' && (
              <AccountSection
                userPrefs={userPrefs}
                updatePreferences={updatePreferences}
                highlight={highlight}
              />
            )}
            {tab === 'integrations' && (
              <IntegrationsSection
                localKeys={localKeys}
                setLocalKey={setLocalKey}
                removeLocalKey={removeLocalKey}
                health={health}
                highlight={highlight}
              />
            )}
            {tab === 'ai-models' && (
              <AiModelsSection
                userPrefs={userPrefs}
                updatePreferences={updatePreferences}
                scope={scope}
                ventureId={ventureId}
                highlight={highlight}
              />
            )}
            {tab === 'audio' && (
              <AudioSection
                audio={audio}
                updateAudio={updateAudio}
                inputDevices={inputDevices}
                outputDevices={outputDevices}
                userPrefs={userPrefs}
                updatePreferences={updatePreferences}
                highlight={highlight}
              />
            )}
            {tab === 'devices' && (
              <DevicesSection
                audio={audio}
                updateAudio={updateAudio}
                deviceProfiles={deviceProfiles}
                devices={devices}
                activeProfileId={activeProfileId}
                setActiveProfile={setActiveProfile}
                onClearLog={() => { clearEventLog(); toast('info', 'Device event log cleared'); }}
                onOpenHub={() => setView('device-hub' as never)}
                onOpenRouter={() => setView('audio-router' as never)}
              />
            )}
            {tab === 'storage' && (
              <StorageSection storageInfo={storageInfo} onClear={() => { if (confirm('Clear all local storage data?')) { localStorage.clear(); toast('info', 'Local storage cleared'); } }} />
            )}
            {tab === 'security' && <SecuritySection scope={scope} ventureId={ventureId} />}
            {tab === 'billing' && <BillingSection />}
            {tab === 'shortcuts' && <ShortcutsSection />}
            {tab === 'about' && <AboutSection />}
          </div>
        </div>
      </div>

      <style>{settingsStyles}</style>
    </PageShell>
  );
}

// ═══════════════════════════════════════════════
// Sections
// ═══════════════════════════════════════════════

function GeneralSection({
  userPrefs,
  updatePreferences,
  highlight,
  scope,
}: {
  userPrefs: ReturnType<typeof useUserStore.getState>['preferences'];
  updatePreferences: (u: Partial<ReturnType<typeof useUserStore.getState>['preferences']>) => void;
  highlight: string | null;
  scope: SettingScope;
}) {
  const [density, setDensity] = useState<'compact' | 'normal' | 'spacious'>(() => (document.documentElement.dataset.density as 'compact' | 'normal' | 'spacious') || 'normal');
  const [contrast, setContrast] = useState<'normal' | 'high'>(() => (document.documentElement.dataset.contrast as 'normal' | 'high') || 'normal');
  const [palette, setPalette] = useState<'default' | 'cb'>(() => (document.documentElement.dataset.palette as 'default' | 'cb') || 'default');
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => localStorage.getItem('mcv-reduced-motion') === '1');

  useEffect(() => {
    document.documentElement.dataset.density = density;
    localStorage.setItem('mcv-density', density);
  }, [density]);
  useEffect(() => {
    if (contrast === 'normal') delete document.documentElement.dataset.contrast;
    else document.documentElement.dataset.contrast = contrast;
    localStorage.setItem('mcv-contrast', contrast);
  }, [contrast]);
  useEffect(() => {
    if (palette === 'default') delete document.documentElement.dataset.palette;
    else document.documentElement.dataset.palette = palette;
    localStorage.setItem('mcv-palette', palette);
  }, [palette]);
  useEffect(() => {
    localStorage.setItem('mcv-reduced-motion', reducedMotion ? '1' : '0');
  }, [reducedMotion]);

  return (
    <div className="settings-section-stack">
      <SectionCard title="Appearance" icon={<Monitor size={14} />} description="Theme and visual density">
        <div className="settings-form-grid">
          <FormField label="Theme" hint="Dark mode tuned for the MCV visual language">
            <ToggleGroup
              value="dark"
              onChange={() => { /* light mode not implemented yet */ }}
              options={[{ value: 'dark', label: 'Dark' }, { value: 'auto', label: 'Auto (coming)' }]}
              size="md"
            />
          </FormField>
          <FormField label="UI Density" hint="Compact mode shrinks row heights and paddings globally">
            <div className={highlight === 'density' ? 'settings-highlight' : ''}>
              <ToggleGroup
                value={density}
                onChange={(v) => { setDensity(v); updatePreferences({ compactMode: v === 'compact' }); }}
                options={[{ value: 'compact', label: 'Compact' }, { value: 'normal', label: 'Normal' }, { value: 'spacious', label: 'Spacious' }]}
                size="md"
              />
            </div>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Accessibility" icon={<Eye size={14} />} description="Contrast, palette, and motion">
        <div className="settings-switch-stack">
          <Switch
            checked={contrast === 'high'}
            onChange={(v) => setContrast(v ? 'high' : 'normal')}
            label="High Contrast Mode"
            description="Stronger borders and text colors for low-vision users"
          />
          <Switch
            checked={palette === 'cb'}
            onChange={(v) => setPalette(v ? 'cb' : 'default')}
            label="Colorblind-safe Palette"
            description="Shifts status colors (success/warning/error) for deuteranopia"
          />
          <Switch
            checked={reducedMotion}
            onChange={setReducedMotion}
            label="Reduce Motion"
            description="Respects prefers-reduced-motion in addition to this override"
          />
        </div>
      </SectionCard>

      <SectionCard title="Notifications" icon={<Bell size={14} />}>
        {scope === 'global' ? (
          <Switch
            checked={userPrefs.showAnimatedBg}
            onChange={(v) => updatePreferences({ showAnimatedBg: v })}
            label="Enable Notifications"
            description="System alerts, toasts, and attention items"
          />
        ) : (
          <VentureScopedToggle
            settingKey="notifications"
            label="Enable Notifications"
            description="Override global notifications for this venture"
            globalValue={userPrefs.showAnimatedBg}
          />
        )}
      </SectionCard>

      <SectionCard title="Ventures" icon={<Sparkles size={14} />} description={`${ventures.length} configured ventures`} padding="sm">
        <ul className="settings-venture-list">
          {ventures.map((v) => (
            <li key={v.id} className="settings-venture-row">
              <span className="settings-venture-dot" style={{ background: v.color }} />
              <span className="settings-venture-name">{v.name}</span>
              <Badge color={v.status === 'active' ? '#10B981' : v.status === 'development' ? '#00F0FF' : '#6B7280'}>
                {v.status}
              </Badge>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

function AccountSection({
  userPrefs,
  updatePreferences,
  highlight,
}: {
  userPrefs: ReturnType<typeof useUserStore.getState>['preferences'];
  updatePreferences: (u: Partial<ReturnType<typeof useUserStore.getState>['preferences']>) => void;
  highlight: string | null;
}) {
  return (
    <div className="settings-section-stack">
      <SectionCard title="Profile" icon={<User size={14} />}>
        <div className="settings-form-grid">
          <FormField label="Display Name" htmlFor="displayName">
            <Input
              id="displayName"
              value={userPrefs.displayName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePreferences({ displayName: e.target.value })}
              placeholder="Your name"
            />
          </FormField>
          <FormField label="Default Venture">
            <div className={highlight === 'default-venture' ? 'settings-highlight' : ''}>
              <Select
                value={userPrefs.defaultVenture}
                onChange={(v) => updatePreferences({ defaultVenture: v })}
                options={ventures.map((v) => ({
                  value: v.id,
                  label: v.name,
                  icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, display: 'inline-block' }} />,
                }))}
              />
            </div>
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Preferences" icon={<Monitor size={14} />}>
        <div className="settings-form-grid">
          <FormField label="Clock Format">
            <ToggleGroup
              value={userPrefs.clockFormat}
              onChange={(v) => updatePreferences({ clockFormat: v })}
              options={[{ value: '12h', label: '12-hour' }, { value: '24h', label: '24-hour' }]}
            />
          </FormField>
        </div>
      </SectionCard>
    </div>
  );
}

function IntegrationsSection({
  localKeys,
  setLocalKey,
  removeLocalKey,
  health,
  highlight,
}: {
  localKeys: Record<string, string>;
  setLocalKey: (name: string, value: string) => void;
  removeLocalKey: (name: string) => void;
  health: Record<string, boolean>;
  highlight: string | null;
}) {
  return (
    <div className="settings-section-stack">
      <SectionCard
        title="OAuth Providers & MCP Servers"
        icon={<Zap size={14} />}
        description="Connect third-party services via OAuth"
        padding="none"
      >
        <div className="settings-integrations-hub">
          <IntegrationsHub />
        </div>
      </SectionCard>

      <SectionCard
        title="API Keys (Local Override)"
        icon={<Key size={14} />}
        description="Dev-convenience inline key entry. Production secrets should use Vercel env vars."
        className={highlight === 'api-keys' ? 'settings-highlight' : ''}
      >
        <div className="settings-notice settings-notice-warn">
          <AlertTriangle size={14} />
          <div>
            <strong>Security notice:</strong> Keys entered here are stored in your browser's localStorage
            and readable by any script on this origin. Use this only for development — production keys
            must be set as Vercel environment variables.
          </div>
        </div>

        <div className="settings-api-keys">
          {API_KEY_SERVICES.map((svc) => {
            const Icon = svc.icon;
            const envPresent = !!health[svc.key];
            const localPresent = !!localKeys[svc.key];
            const provenance = resolveProvenance(envPresent, localPresent);
            const meta = PROVENANCE_META[provenance];
            return (
              <ApiKeyRow
                key={svc.key}
                name={svc.key}
                label={svc.label}
                description={svc.description}
                icon={<Icon size={14} />}
                provenance={provenance}
                provenanceMeta={meta}
                localValue={localKeys[svc.key] || ''}
                onSave={(v) => setLocalKey(svc.key, v)}
                onRemove={() => removeLocalKey(svc.key)}
              />
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

function ApiKeyRow({
  name,
  label,
  description,
  icon,
  provenance,
  provenanceMeta,
  localValue,
  onSave,
  onRemove,
}: {
  name: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  provenance: KeyProvenance;
  provenanceMeta: { label: string; color: string; tip: string };
  localValue: string;
  onSave: (v: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(localValue);
  const [reveal, setReveal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    if (value.trim()) onSave(value.trim());
    setEditing(false);
  };

  return (
    <div className="settings-key-row">
      <div className="settings-key-head">
        <div className="settings-key-icon">{icon}</div>
        <div className="settings-key-info">
          <span className="settings-key-name">{label}</span>
          <span className="settings-key-desc">{description}</span>
        </div>
        <Tooltip content={provenanceMeta.tip}>
          <span className="settings-prov-badge" style={{ color: provenanceMeta.color, borderColor: provenanceMeta.color + '55' }}>
            {provenanceMeta.label}
          </span>
        </Tooltip>
      </div>
      <div className="settings-key-control">
        {editing ? (
          <>
            <input
              ref={inputRef}
              type={reveal ? 'text' : 'password'}
              className="settings-key-input"
              placeholder={`sk-… (${name})`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            />
            <Tooltip content={reveal ? 'Hide' : 'Reveal'}>
              <button type="button" className="settings-key-eye" onClick={() => setReveal((r) => !r)} aria-label={reveal ? 'Hide key' : 'Reveal key'}>
                {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </Tooltip>
            <Button size="sm" variant="primary" onClick={commit}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setValue(localValue); setEditing(false); }}>Cancel</Button>
          </>
        ) : (
          <>
            <code className="settings-key-masked">
              {provenance === 'local' ? `••••••${localValue.slice(-4)}` : provenance === 'env' ? 'Set via env var' : 'Not configured'}
            </code>
            <Button size="sm" variant="secondary" onClick={() => { setValue(localValue); setEditing(true); }}>
              {provenance === 'local' ? 'Edit' : 'Add Key'}
            </Button>
            {provenance === 'local' && (
              <Button size="sm" variant="danger" onClick={onRemove}>Remove</Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AiModelsSection({
  userPrefs,
  updatePreferences,
  scope,
  ventureId,
  highlight,
}: {
  userPrefs: ReturnType<typeof useUserStore.getState>['preferences'];
  updatePreferences: (u: Partial<ReturnType<typeof useUserStore.getState>['preferences']>) => void;
  scope: SettingScope;
  ventureId: string;
  highlight: string | null;
}) {
  const overrides = useVentureOverrides((s) => s.getOverride(ventureId));
  const setOverride = useVentureOverrides((s) => s.setOverride);
  const clearOverride = useVentureOverrides((s) => s.clearOverride);

  const modelOptions = [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', description: 'Default — chat, reasoning, code' },
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4', description: 'Complex reasoning, long-form' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Long context, vision' },
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash', description: 'Fast, cheap, experimental' },
  ];

  const effectiveModel = scope === 'venture' && overrides.preferredModel ? overrides.preferredModel : userPrefs.preferredModel;
  const isOverridden = scope === 'venture' && !!overrides.preferredModel;

  return (
    <div className="settings-section-stack">
      <SectionCard title="Model Preferences" icon={<Sparkles size={14} />} description={scope === 'venture' ? 'Override defaults for this venture' : 'Default model routing for new conversations'}>
        <div className="settings-form-grid">
          <FormField
            label={
              <span className="settings-label-with-tag">
                Preferred Model
                {isOverridden && <Badge color="#8B5CF6">Overridden</Badge>}
              </span>
            }
          >
            <div className={`settings-override-row ${highlight === 'preferred-model' ? 'settings-highlight' : ''}`}>
              <Select
                value={effectiveModel}
                onChange={(v) => {
                  if (scope === 'venture') setOverride(ventureId, 'preferredModel', v);
                  else updatePreferences({ preferredModel: v });
                }}
                options={modelOptions}
              />
              {scope === 'venture' && isOverridden && (
                <Button size="sm" variant="ghost" onClick={() => clearOverride(ventureId, 'preferredModel')}>
                  Clear override
                </Button>
              )}
            </div>
          </FormField>

          <FormField label={`Max Tokens${scope === 'venture' && overrides.maxTokens ? ' (overridden)' : ''}`} hint="Response token ceiling per turn">
            <Slider
              value={scope === 'venture' && overrides.maxTokens ? overrides.maxTokens : userPrefs.maxTokens}
              onChange={(v) => {
                if (scope === 'venture') setOverride(ventureId, 'maxTokens', v);
                else updatePreferences({ maxTokens: v });
              }}
              min={512} max={8192} step={256}
              formatValue={(v) => `${v.toLocaleString()} tokens`}
            />
          </FormField>
        </div>

        {scope === 'global' && (
          <div className="settings-switch-stack" style={{ marginTop: 12 }}>
            <Switch
              checked={userPrefs.streamingEnabled}
              onChange={(v) => updatePreferences({ streamingEnabled: v })}
              label="Streaming Responses"
              description="Show tokens as they arrive (recommended)"
            />
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function AudioSection({
  audio,
  updateAudio,
  inputDevices,
  outputDevices,
  userPrefs,
  updatePreferences,
  highlight,
}: {
  audio: AudioSettings;
  updateAudio: (p: Partial<AudioSettings>) => void;
  inputDevices: { deviceId: string; label: string }[];
  outputDevices: { deviceId: string; label: string }[];
  userPrefs: ReturnType<typeof useUserStore.getState>['preferences'];
  updatePreferences: (u: Partial<ReturnType<typeof useUserStore.getState>['preferences']>) => void;
  highlight: string | null;
}) {
  return (
    <div className="settings-section-stack">
      <SectionCard title="Input" icon={<Mic size={14} />}>
        <div className={`settings-form-grid ${highlight === 'input-device' ? 'settings-highlight' : ''}`}>
          <FormField label="Microphone">
            <Combobox
              value={audio.inputDevice}
              onChange={(v) => v && updateAudio({ inputDevice: v })}
              options={[
                { value: 'default', label: 'System Default' },
                ...inputDevices.map((d) => ({ value: d.deviceId, label: d.label })),
              ]}
              placeholder="Select microphone…"
            />
          </FormField>
          <FormField label="Input Volume">
            <Slider
              value={audio.inputVolume}
              onChange={(v) => updateAudio({ inputVolume: v })}
              formatValue={(v) => `${v}%`}
            />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Output" icon={<Volume2 size={14} />}>
        <div className="settings-form-grid">
          <FormField label="Speakers">
            <Combobox
              value={audio.outputDevice}
              onChange={(v) => v && updateAudio({ outputDevice: v })}
              options={[
                { value: 'default', label: 'System Default' },
                ...outputDevices.map((d) => ({ value: d.deviceId, label: d.label })),
              ]}
              placeholder="Select speakers…"
            />
          </FormField>
          <FormField label="Output Volume">
            <Slider
              value={audio.outputVolume}
              onChange={(v) => updateAudio({ outputVolume: v })}
              formatValue={(v) => `${v}%`}
            />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="Voice" icon={<Sparkles size={14} />}>
        <div className="settings-switch-stack">
          <Switch
            checked={audio.autoTTS}
            onChange={(v) => { updateAudio({ autoTTS: v }); updatePreferences({ voiceEnabled: v }); }}
            label="Auto-read responses"
            description="Read assistant replies aloud via TTS"
          />
        </div>
        <div className="settings-form-grid" style={{ marginTop: 12 }}>
          <FormField label="TTS Voice">
            <Select
              value={userPrefs.ttsVoice}
              onChange={(v) => updatePreferences({ ttsVoice: v })}
              options={[
                { value: 'default', label: 'Default' },
                { value: 'alloy', label: 'Alloy' },
                { value: 'echo', label: 'Echo' },
                { value: 'sage', label: 'Sage' },
                { value: 'nova', label: 'Nova' },
              ]}
            />
          </FormField>
          <FormField label="STT Provider" hint="Browser uses Web Speech API; Deepgram requires a key">
            <ToggleGroup
              value={userPrefs.sttProvider}
              onChange={(v) => updatePreferences({ sttProvider: v })}
              options={[{ value: 'browser', label: 'Browser' }, { value: 'deepgram', label: 'Deepgram' }]}
            />
          </FormField>
        </div>
      </SectionCard>
    </div>
  );
}

function DevicesSection({
  audio,
  updateAudio,
  deviceProfiles,
  devices,
  activeProfileId,
  setActiveProfile,
  onClearLog,
  onOpenHub,
  onOpenRouter,
}: {
  audio: AudioSettings;
  updateAudio: (p: Partial<AudioSettings>) => void;
  deviceProfiles: Record<string, { id: string; name: string }>;
  devices: Record<string, { id: string; name: string; class: string; transport: string; status: string }>;
  activeProfileId: string | null;
  setActiveProfile: (id: string | null) => void;
  onClearLog: () => void;
  onOpenHub: () => void;
  onOpenRouter: () => void;
}) {
  const deviceList = Object.values(devices);
  return (
    <div className="settings-section-stack">
      <SectionCard title="Discovery" icon={<Cpu size={14} />}>
        <Switch
          checked={audio.autoDiscovery}
          onChange={(v) => updateAudio({ autoDiscovery: v })}
          label="Auto-scan local network"
          description="Scan every 30s for new devices"
        />
      </SectionCard>

      <SectionCard title="Active Profile" icon={<Layers size={14} />}>
        <FormField label="Default Device Profile">
          <Select
            value={activeProfileId || ''}
            onChange={(v) => setActiveProfile(v || null)}
            options={[
              { value: '', label: 'None' },
              ...Object.values(deviceProfiles).map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </FormField>
      </SectionCard>

      <SectionCard
        title={`Connected Devices (${deviceList.length})`}
        icon={<MonitorSmartphone size={14} />}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="ghost" onClick={onOpenHub}>Device Hub</Button>
            <Button size="sm" variant="ghost" onClick={onOpenRouter}>Audio Router</Button>
          </div>
        }
      >
        {deviceList.length === 0 ? (
          <p className="settings-empty">No devices detected. Start a scan from Device Hub.</p>
        ) : (
          <ul className="settings-device-list">
            {deviceList.map((d) => (
              <li key={d.id} className="settings-device-row">
                <span className="settings-device-dot" style={{ background: d.status === 'connected' ? 'var(--success)' : 'var(--text-muted)' }} />
                <span className="settings-device-name">{d.name}</span>
                <Badge color="#8899AA">{d.class}</Badge>
                <span className="settings-device-transport">{d.transport}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Maintenance" icon={<Shield size={14} />} padding="sm">
        <Button variant="danger" size="sm" onClick={onClearLog}>Clear Event Log</Button>
      </SectionCard>
    </div>
  );
}

function StorageSection({ storageInfo, onClear }: { storageInfo: { buckets: { id: string; name: string; public: boolean }[] } | null; onClear: () => void }) {
  return (
    <div className="settings-section-stack">
      <SectionCard title="Cloud Storage" icon={<HardDrive size={14} />} description="Supabase buckets backing Files, Docs, and Avatars">
        {!storageInfo ? (
          <p className="settings-empty">Loading storage info…</p>
        ) : (
          <ul className="settings-bucket-list">
            {storageInfo.buckets.map((b) => (
              <li key={b.id} className="settings-bucket-row">
                <Database size={14} />
                <span className="settings-bucket-name">{b.name}</span>
                <Badge color={b.public ? '#F59E0B' : '#10B981'}>{b.public ? 'Public' : 'Private'}</Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Local Storage" icon={<HardDrive size={14} />}>
        <div className="settings-local-storage">
          <span>{(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB used</span>
          <Button variant="danger" size="sm" onClick={onClear}>Clear Local Storage</Button>
        </div>
      </SectionCard>
    </div>
  );
}

function SecuritySection({ scope, ventureId }: { scope: SettingScope; ventureId: string }) {
  return (
    <div className="settings-section-stack">
      <SectionCard title="Platform Security" icon={<Shield size={14} />}>
        {[
          { label: 'Authentication', desc: 'Clerk authentication is active. Registration disabled.' },
          { label: 'API Protection', desc: 'All API routes require JWT verification.' },
          { label: 'Row Level Security', desc: 'Supabase RLS policies enabled on all tables.' },
          { label: 'HTTPS Only', desc: 'All traffic encrypted via Vercel TLS.' },
        ].map((item) => (
          <div key={item.label} className="settings-sec-row">
            <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <div>
              <div className="settings-sec-title">{item.label}</div>
              <div className="settings-sec-desc">{item.desc}</div>
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard title={scope === 'venture' ? 'Venture Security Policies' : 'Security Policies'} icon={<Key size={14} />}>
        <div className="settings-switch-stack">
          <VentureScopedToggle settingKey="twoFactor" label="Require 2FA for venture changes" globalValue={true} forceScope={scope} ventureId={ventureId} />
          <VentureScopedToggle settingKey="ipAllowlist" label="IP Allowlist for API calls" globalValue={false} forceScope={scope} ventureId={ventureId} />
          <VentureScopedToggle settingKey="soc2Mode" label="SOC 2 compliance mode" globalValue={true} forceScope={scope} ventureId={ventureId} />
        </div>
      </SectionCard>
    </div>
  );
}

function BillingSection() {
  return (
    <div className="settings-section-stack">
      <SectionCard title="Plan" icon={<CreditCard size={14} />} description="Usage, invoices, and subscription">
        <p className="settings-empty">Billing dashboard coming in Phase 5. View invoices under Commerce → Invoices today.</p>
      </SectionCard>
    </div>
  );
}

function ShortcutsSection() {
  const shortcuts = [
    { key: 'Ctrl+K', desc: 'Command Palette' },
    { key: 'Ctrl+/', desc: 'Toggle Chat Dock' },
    { key: 'Ctrl+\\', desc: 'Toggle Split Panel' },
    { key: 'Ctrl+N', desc: 'Quick Capture' },
    { key: 'Ctrl+E', desc: 'Toggle Global/Venture scope' },
    { key: 'Ctrl+1-8', desc: 'Switch Global View' },
    { key: 'Ctrl+Shift+1-9', desc: 'Switch Venture' },
    { key: 'Escape', desc: 'Close overlays' },
  ];
  return (
    <div className="settings-section-stack">
      <SectionCard title="Keyboard Shortcuts" icon={<Keyboard size={14} />} description="Custom rebinding is coming in a later phase">
        <ul className="settings-shortcut-list">
          {shortcuts.map((s) => (
            <li key={s.key} className="settings-shortcut-row">
              <kbd className="settings-kbd">{s.key}</kbd>
              <span>{s.desc}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="settings-section-stack">
      <SectionCard title="About MCV One" icon={<Info size={14} />}>
        <div className="settings-about">
          <div className="settings-about-brand">
            <span className="settings-about-logo">MCV</span>
            <span className="settings-about-sub">ONE</span>
          </div>
          <p className="settings-about-tagline">Agentic Operating System</p>
          <div className="settings-about-grid">
            <div><span>Version</span><strong>v{APP_VERSION}</strong></div>
            <div><span>Built</span><strong>{BUILD_TIME.slice(0, 16).replace('T', ' ')}</strong></div>
            <div><span>Organization</span><strong>EdgeIQ Holdings</strong></div>
            <div><span>Ventures</span><strong>{ventures.length}</strong></div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Shared: VentureScopedToggle
// ═══════════════════════════════════════════════
function VentureScopedToggle({
  settingKey,
  label,
  description,
  globalValue,
  forceScope,
  ventureId: ventureIdProp,
}: {
  settingKey: keyof import('../lib/settings/venture-overrides').VentureSettingOverrides;
  label: string;
  description?: string;
  globalValue: boolean;
  forceScope?: SettingScope;
  ventureId?: string;
}) {
  const activeVenture = useNavigation((s) => s.activeVenture);
  const ventureId = ventureIdProp || activeVenture || 'mcv';

  const override = useVentureOverrides((s) => s.getOverride(ventureId)[settingKey]) as boolean | undefined;
  const setOverride = useVentureOverrides((s) => s.setOverride);
  const clearOverride = useVentureOverrides((s) => s.clearOverride);

  const isVentureScope = forceScope === 'venture';
  const effective = override !== undefined ? override : globalValue;

  return (
    <div className="settings-switch-row">
      <Switch
        checked={!!effective}
        onChange={(v) => {
          if (isVentureScope) setOverride(ventureId, settingKey, v);
        }}
        label={label}
        description={description || (override !== undefined ? 'Overridden for this venture' : 'Inherited from Global')}
      />
      {isVentureScope && override !== undefined && (
        <Tooltip content="Clear venture override (revert to Global)">
          <button type="button" className="settings-override-clear" onClick={() => clearOverride(ventureId, settingKey)} aria-label="Clear override">
            <RotateCcw size={12} />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════
const settingsStyles = `
.settings-root { display: flex; height: 100%; min-height: 0; }
.settings-sidebar { width: 260px; flex-shrink: 0; background: var(--bg-surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
.settings-sidebar-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.settings-brand { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-display); font-size: 14px; font-weight: 600; color: var(--text-primary); letter-spacing: 0.4px; }
.settings-reset { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: var(--radius-sm); color: var(--text-muted); transition: all var(--transition-fast); }
.settings-reset:hover { background: var(--bg-card); color: var(--text-primary); }
.settings-nav { flex: 1; overflow-y: auto; padding: 8px 0; }
.settings-nav-item { display: grid; grid-template-columns: 14px 1fr auto; grid-template-rows: auto auto; column-gap: 10px; row-gap: 2px; width: 100%; padding: 10px 16px; text-align: left; transition: all var(--transition-fast); border-left: 2px solid transparent; color: var(--text-secondary); }
.settings-nav-item:hover { background: var(--bg-card); color: var(--text-primary); }
.settings-nav-item.active { color: var(--cyan); background: rgba(0,240,255,0.05); border-left-color: var(--cyan); }
.settings-nav-item > svg { grid-row: 1; grid-column: 1; margin-top: 2px; }
.settings-nav-label { grid-row: 1; grid-column: 2; font-size: 13px; font-weight: 500; }
.settings-nav-summary { grid-row: 2; grid-column: 2; font-size: 10px; color: var(--text-muted); }
.settings-nav-chevron { grid-row: 1; grid-column: 3; align-self: center; opacity: 0; transition: opacity var(--transition-fast); color: var(--cyan); }
.settings-nav-item.active .settings-nav-chevron { opacity: 1; }

.settings-main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.settings-toolbar { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
.settings-search { display: inline-flex; align-items: center; gap: 8px; background: var(--field-bg); border: 1px solid var(--field-border); border-radius: var(--radius-md); padding: 6px 10px; min-width: 280px; color: var(--text-muted); }
.settings-search:focus-within { border-color: var(--field-border-focus); box-shadow: var(--field-ring-focus); color: var(--text-primary); }
.settings-search-input { flex: 1; background: transparent; border: none; outline: none; font-size: 13px; color: var(--text-primary); }
.settings-search-input:focus { box-shadow: none; border: none; }
.settings-search-clear { color: var(--text-muted); padding: 0 4px; font-size: 16px; line-height: 1; }
.settings-search-clear:hover { color: var(--text-primary); }
.settings-scope-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }

.settings-search-results { padding: 16px 24px 0; }
.settings-result-list { list-style: none; display: flex; flex-direction: column; gap: 2px; }
.settings-result { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px 10px; border-radius: var(--radius-sm); text-align: left; color: var(--text-secondary); transition: all var(--transition-fast); }
.settings-result:hover { background: var(--bg-card); color: var(--text-primary); }
.settings-result-label { display: block; font-size: 13px; font-weight: 500; color: var(--text-primary); }
.settings-result-desc { display: block; font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.settings-content { flex: 1; overflow-y: auto; padding: 20px 24px 40px; }
.settings-content-venture { background: rgba(139, 92, 246, 0.015); }

.settings-venture-banner { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(139, 92, 246, 0.06); border: 1px solid; border-radius: var(--radius-md); margin-bottom: 16px; font-size: 13px; color: var(--text-secondary); }
.settings-venture-banner strong { color: var(--text-primary); font-family: var(--font-display); letter-spacing: 0.3px; }
.settings-venture-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
.settings-venture-hint { color: var(--text-muted); font-size: 12px; }

.settings-section-stack { display: flex; flex-direction: column; gap: 16px; max-width: 880px; }
.settings-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
.settings-switch-stack { display: flex; flex-direction: column; gap: 12px; }
.settings-switch-row { display: flex; align-items: center; gap: 8px; }
.settings-override-clear { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: var(--radius-sm); color: var(--text-muted); transition: all var(--transition-fast); }
.settings-override-clear:hover { color: var(--cyan); background: var(--bg-card); }

.settings-override-row { display: flex; align-items: center; gap: 8px; }
.settings-override-row > :first-child { flex: 1; }

.settings-label-with-tag { display: inline-flex; align-items: center; gap: 8px; }

.settings-highlight { animation: settingsHighlight 2s ease; border-radius: var(--radius-md); }
@keyframes settingsHighlight {
  0%, 30% { box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.4); }
  100% { box-shadow: 0 0 0 0 transparent; }
}

.settings-empty { font-size: 13px; color: var(--text-muted); padding: 8px 4px; }

.settings-venture-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }
.settings-venture-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; }
.settings-venture-name { flex: 1; font-weight: 500; }

.settings-integrations-hub { padding: 12px; max-height: 640px; overflow-y: auto; }

.settings-notice { display: flex; gap: 10px; padding: 10px 12px; border-radius: var(--radius-md); font-size: 12px; line-height: 1.5; margin-bottom: 12px; }
.settings-notice-warn { background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); color: var(--text-secondary); }
.settings-notice-warn strong { color: var(--warning); }
.settings-notice svg { flex-shrink: 0; margin-top: 2px; color: var(--warning); }

.settings-api-keys { display: flex; flex-direction: column; gap: 8px; }
.settings-key-row { padding: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 10px; }
.settings-key-head { display: flex; align-items: center; gap: 12px; }
.settings-key-icon { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); background: rgba(0, 240, 255, 0.08); color: var(--cyan); flex-shrink: 0; }
.settings-key-info { flex: 1; min-width: 0; }
.settings-key-name { display: block; font-size: 13px; font-weight: 500; color: var(--text-primary); }
.settings-key-desc { display: block; font-size: 11px; color: var(--text-muted); }
.settings-prov-badge { display: inline-flex; padding: 2px 8px; border-radius: var(--radius-full); font-size: 9px; font-weight: 700; letter-spacing: 0.5px; border: 1px solid; background: transparent; }
.settings-key-control { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.settings-key-input { flex: 1; min-width: 200px; background: var(--field-bg); border: 1px solid var(--field-border); border-radius: var(--radius-sm); padding: 6px 10px; font-size: 12px; font-family: var(--font-mono); color: var(--text-primary); }
.settings-key-input:focus { outline: none; border-color: var(--field-border-focus); box-shadow: var(--field-ring-focus); }
.settings-key-eye { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: var(--radius-sm); color: var(--text-muted); }
.settings-key-eye:hover { color: var(--cyan); background: var(--bg-elevated); }
.settings-key-masked { flex: 1; font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); letter-spacing: 1px; padding: 6px 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); }

.settings-device-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }
.settings-device-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12px; }
.settings-device-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.settings-device-name { flex: 1; font-weight: 500; color: var(--text-primary); }
.settings-device-transport { font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); background: var(--bg-elevated); padding: 2px 6px; border-radius: var(--radius-full); }

.settings-bucket-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
.settings-bucket-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-muted); }
.settings-bucket-name { flex: 1; font-size: 13px; color: var(--text-primary); font-family: var(--font-mono); }

.settings-local-storage { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 12px; color: var(--text-secondary); }

.settings-sec-row { display: flex; gap: 12px; padding: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 8px; align-items: flex-start; }
.settings-sec-title { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.settings-sec-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.settings-shortcut-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }
.settings-shortcut-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12px; color: var(--text-secondary); }
.settings-kbd { font-size: 10px; font-family: var(--font-mono); background: var(--bg-elevated); border: 1px solid var(--border); padding: 3px 10px; border-radius: 4px; color: var(--text-muted); }

.settings-about { text-align: center; padding: 24px 0; }
.settings-about-brand { display: flex; align-items: baseline; justify-content: center; gap: 4px; margin-bottom: 4px; }
.settings-about-logo { font-family: var(--font-display); font-size: 2.25rem; font-weight: 700; color: var(--cyan); text-shadow: 0 0 16px rgba(0, 240, 255, 0.5); letter-spacing: 2px; }
.settings-about-sub { font-family: var(--font-display); font-size: 1.125rem; font-weight: 600; color: var(--text-muted); letter-spacing: 6px; }
.settings-about-tagline { font-size: 12px; color: var(--text-muted); margin-bottom: 24px; }
.settings-about-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; max-width: 420px; margin: 0 auto; }
.settings-about-grid > div { padding: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 4px; }
.settings-about-grid span { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.settings-about-grid strong { font-size: 13px; font-weight: 600; color: var(--text-primary); }

@media (max-width: 768px) {
  .settings-sidebar { width: 200px; }
  .settings-search { min-width: 180px; }
}

[data-screen-class="phone"] .settings-root { flex-direction: column; }
[data-screen-class="phone"] .settings-sidebar { width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
[data-screen-class="phone"] .settings-nav { flex-direction: row; overflow-x: auto; padding: 8px; gap: 4px; }
[data-screen-class="phone"] .settings-nav-item { flex-shrink: 0; width: auto; padding: 8px 12px; }
[data-screen-class="phone"] .settings-nav-summary, [data-screen-class="phone"] .settings-nav-chevron { display: none; }
`;
