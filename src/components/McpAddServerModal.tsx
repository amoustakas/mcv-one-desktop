import { useState } from 'react';
import {
  X,
  Code,
  Database,
  MessageSquare,
  Globe,
  Zap,
  ChevronLeft,
  Plus,
  Terminal,
  Link,
} from 'lucide-react';
import { MCP_PRESETS, McpServerPreset } from '../lib/mcp/presets';
import { McpServerConfig } from '../lib/mcp/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface McpAddServerModalProps {
  open: boolean;
  onClose: () => void;
  onAddPreset: (presetId: string, credentials: Record<string, string>) => void;
  onAddCustom: (config: McpServerConfig) => void;
}

type View = 'presets' | 'preset-config' | 'custom-stdio' | 'custom-http';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_ICONS = {
  code: Code,
  data: Database,
  comms: MessageSquare,
  infra: Globe,
  specialized: Zap,
} as const;

const CATEGORY_COLORS: Record<string, string> = {
  code: '#00F5FF',
  data: '#8B5CF6',
  comms: '#10b981',
  infra: '#f59e0b',
  specialized: '#ef4444',
};

const TIER_LABELS: Record<number, string> = {
  1: 'Essential',
  2: 'Recommended',
  3: 'Advanced',
};

// ---------------------------------------------------------------------------
// Shared style constants (hoisted to avoid recreation on every render)
// ---------------------------------------------------------------------------

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 7,
  padding: '8px 12px',
  color: 'var(--text-primary, #e5e7eb)',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const MONO_INPUT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  fontFamily: 'monospace',
};

const MONO_TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  fontFamily: 'monospace',
  resize: 'vertical',
};

const LABEL_STYLE: React.CSSProperties = {
  color: 'var(--text-secondary, #9ca3af)',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 4,
  display: 'block',
};

const PRIMARY_BTN_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, #00F5FF22, #8B5CF622)',
  border: '1px solid #00F5FF55',
  color: '#00F5FF',
  borderRadius: 7,
  padding: '9px 20px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const GHOST_BTN_STYLE: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'var(--text-secondary, #9ca3af)',
  borderRadius: 7,
  padding: '9px 16px',
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const PURPLE_BTN_STYLE: React.CSSProperties = {
  background: 'rgba(139,92,246,0.12)',
  border: '1px solid rgba(139,92,246,0.4)',
  color: '#8B5CF6',
  borderRadius: 7,
  padding: '9px 20px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  marginLeft: 'auto',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

function parseEnvText(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key) result[key] = val;
  }
  return result;
}

function parseHeadersText(text: string): Record<string, string> {
  return parseEnvText(text); // same KEY=VALUE format
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PresetCard({
  preset,
  onSelect,
}: {
  preset: McpServerPreset;
  onSelect: () => void;
}) {
  const Icon = CATEGORY_ICONS[preset.category] ?? Zap;
  const iconColor = CATEGORY_COLORS[preset.category] ?? '#00F5FF';

  return (
    <button
      onClick={onSelect}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, background 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = iconColor;
        (e.currentTarget as HTMLButtonElement).style.background =
          'rgba(255,255,255,0.07)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          'rgba(255,255,255,0.08)';
        (e.currentTarget as HTMLButtonElement).style.background =
          'rgba(255,255,255,0.04)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={16} color={iconColor} />
        <span
          style={{
            color: 'var(--text-primary, #e5e7eb)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {preset.name}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            fontWeight: 600,
            color: iconColor,
            background: `${iconColor}22`,
            border: `1px solid ${iconColor}44`,
            borderRadius: 4,
            padding: '1px 6px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {TIER_LABELS[preset.tier] ?? `T${preset.tier}`}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          color: 'var(--text-secondary, #9ca3af)',
          fontSize: 11,
          lineHeight: 1.5,
        }}
      >
        {preset.description}
      </p>
      {preset.requiredCredentials.length === 0 && (
        <span
          style={{
            fontSize: 10,
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Plus size={10} />
          No credentials required
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function McpAddServerModal({
  open,
  onClose,
  onAddPreset,
  onAddCustom,
}: McpAddServerModalProps) {
  const [view, setView] = useState<View>('presets');
  const [selectedPreset, setSelectedPreset] = useState<McpServerPreset | null>(
    null
  );
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  // Custom stdio state
  const [stdioName, setStdioName] = useState('');
  const [stdioCommand, setStdioCommand] = useState('');
  const [stdioArgs, setStdioArgs] = useState('');
  const [stdioEnv, setStdioEnv] = useState('');

  // Custom HTTP state
  const [httpName, setHttpName] = useState('');
  const [httpUrl, setHttpUrl] = useState('');
  const [httpHeaders, setHttpHeaders] = useState('');

  // ── Reset all state ──
  function reset() {
    setView('presets');
    setSelectedPreset(null);
    setCredentials({});
    setStdioName('');
    setStdioCommand('');
    setStdioArgs('');
    setStdioEnv('');
    setHttpName('');
    setHttpUrl('');
    setHttpHeaders('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  // ── Preset selection ──
  function handlePresetSelect(preset: McpServerPreset) {
    if (preset.requiredCredentials.length === 0) {
      onAddPreset(preset.id, {});
      handleClose();
      return;
    }
    const init: Record<string, string> = {};
    for (const cred of preset.requiredCredentials) init[cred.key] = '';
    setCredentials(init);
    setSelectedPreset(preset);
    setView('preset-config');
  }

  function handlePresetSubmit() {
    if (!selectedPreset) return;
    onAddPreset(selectedPreset.id, credentials);
    handleClose();
  }

  // ── Custom stdio submit ──
  function handleStdioSubmit() {
    const args = stdioArgs
      .split(/\s+/)
      .map((a) => a.trim())
      .filter(Boolean);
    const config: McpServerConfig = {
      id: generateId('custom-stdio'),
      name: stdioName.trim() || stdioCommand.trim() || 'Custom stdio',
      transport: 'stdio',
      command: stdioCommand.trim(),
      args,
      env: parseEnvText(stdioEnv),
      ventureScope: '*',
      enabledTools: '*',
      disabledTools: [],
      approvalMode: 'destructive',
      autoConnect: true,
      idleTimeoutMs: 300000,
    };
    onAddCustom(config);
    handleClose();
  }

  // ── Custom HTTP submit ──
  function handleHttpSubmit() {
    const config: McpServerConfig = {
      id: generateId('custom-http'),
      name: httpName.trim() || httpUrl.trim() || 'Custom HTTP',
      transport: 'streamable-http',
      url: httpUrl.trim(),
      headers: parseHeadersText(httpHeaders),
      ventureScope: '*',
      enabledTools: '*',
      disabledTools: [],
      approvalMode: 'destructive',
      autoConnect: true,
      idleTimeoutMs: 300000,
    };
    onAddCustom(config);
    handleClose();
  }

  if (!open) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6,13,20,0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface, #0f0f23)',
          border: '1px solid rgba(0,245,255,0.15)',
          borderRadius: 14,
          width: '100%',
          maxWidth: view === 'presets' ? 680 : 520,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            gap: 10,
            flexShrink: 0,
          }}
        >
          {view !== 'presets' && (
            <button
              onClick={() => setView('presets')}
              style={{ ...GHOST_BTN_STYLE, padding: '5px 8px', border: 'none' }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <span
            style={{
              color: 'var(--text-primary, #e5e7eb)',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            {view === 'presets' && 'Add MCP Server'}
            {view === 'preset-config' &&
              `Configure — ${selectedPreset?.name ?? ''}`}
            {view === 'custom-stdio' && 'Custom stdio Server'}
            {view === 'custom-http' && 'Custom HTTP Server'}
          </span>
          <button
            onClick={handleClose}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #9ca3af)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
          {/* ── Presets View ── */}
          {view === 'presets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-secondary, #9ca3af)',
                  fontSize: 13,
                }}
              >
                Choose a preset server or connect a custom stdio/HTTP endpoint.
              </p>

              {/* Preset grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 10,
                }}
              >
                {MCP_PRESETS.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    onSelect={() => handlePresetSelect(preset)}
                  />
                ))}
              </div>

              {/* Divider */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  margin: '4px 0',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: 'rgba(255,255,255,0.07)',
                  }}
                />
                <span
                  style={{
                    color: 'var(--text-secondary, #9ca3af)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Custom
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: 'rgba(255,255,255,0.07)',
                  }}
                />
              </div>

              {/* Custom buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setView('custom-stdio')}
                  style={{
                    flex: 1,
                    ...PRIMARY_BTN_STYLE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 16px',
                  }}
                >
                  <Terminal size={15} />
                  stdio Process
                </button>
                <button
                  onClick={() => setView('custom-http')}
                  style={{
                    flex: 1,
                    background: 'rgba(139,92,246,0.12)',
                    border: '1px solid rgba(139,92,246,0.4)',
                    color: '#8B5CF6',
                    borderRadius: 7,
                    padding: '12px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Link size={15} />
                  HTTP Endpoint
                </button>
              </div>
            </div>
          )}

          {/* ── Preset Config View ── */}
          {view === 'preset-config' && selectedPreset && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-secondary, #9ca3af)',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {selectedPreset.description}
              </p>

              {selectedPreset.requiredCredentials.map((cred) => (
                <div key={cred.key}>
                  <label style={LABEL_STYLE}>
                    {cred.label}
                    {cred.helpUrl && (
                      <a
                        href={cred.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          marginLeft: 8,
                          color: '#00F5FF',
                          fontSize: 10,
                          textDecoration: 'none',
                        }}
                      >
                        Get key ↗
                      </a>
                    )}
                  </label>
                  <input
                    type={cred.type === 'apikey' ? 'password' : 'text'}
                    value={credentials[cred.key] ?? ''}
                    onChange={(e) =>
                      setCredentials((prev) => ({
                        ...prev,
                        [cred.key]: e.target.value,
                      }))
                    }
                    placeholder={cred.key}
                    style={INPUT_STYLE}
                    spellCheck={false}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setView('presets')} style={GHOST_BTN_STYLE}>
                  <ChevronLeft size={14} />
                  Back
                </button>
                <button
                  onClick={handlePresetSubmit}
                  style={{ ...PRIMARY_BTN_STYLE, marginLeft: 'auto' }}
                >
                  Add Server
                </button>
              </div>
            </div>
          )}

          {/* ── Custom stdio View ── */}
          {view === 'custom-stdio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={LABEL_STYLE}>Server Name</label>
                <input
                  type="text"
                  value={stdioName}
                  onChange={(e) => setStdioName(e.target.value)}
                  placeholder="My Custom Server"
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <label style={LABEL_STYLE}>Command</label>
                <input
                  type="text"
                  value={stdioCommand}
                  onChange={(e) => setStdioCommand(e.target.value)}
                  placeholder="npx"
                  style={MONO_INPUT_STYLE}
                />
              </div>

              <div>
                <label style={LABEL_STYLE}>Arguments (space-separated)</label>
                <input
                  type="text"
                  value={stdioArgs}
                  onChange={(e) => setStdioArgs(e.target.value)}
                  placeholder="-y @my-org/server-name"
                  style={MONO_INPUT_STYLE}
                />
              </div>

              <div>
                <label style={LABEL_STYLE}>
                  Environment Variables (KEY=value, one per line)
                </label>
                <textarea
                  value={stdioEnv}
                  onChange={(e) => setStdioEnv(e.target.value)}
                  placeholder={'API_KEY=your-key\nOTHER_VAR=value'}
                  rows={4}
                  style={MONO_TEXTAREA_STYLE}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setView('presets')} style={GHOST_BTN_STYLE}>
                  <ChevronLeft size={14} />
                  Back
                </button>
                <button
                  onClick={handleStdioSubmit}
                  disabled={!stdioCommand.trim()}
                  style={{
                    ...PRIMARY_BTN_STYLE,
                    marginLeft: 'auto',
                    opacity: stdioCommand.trim() ? 1 : 0.4,
                    cursor: stdioCommand.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Add stdio Server
                </button>
              </div>
            </div>
          )}

          {/* ── Custom HTTP View ── */}
          {view === 'custom-http' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={LABEL_STYLE}>Server Name</label>
                <input
                  type="text"
                  value={httpName}
                  onChange={(e) => setHttpName(e.target.value)}
                  placeholder="My HTTP Server"
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <label style={LABEL_STYLE}>URL</label>
                <input
                  type="url"
                  value={httpUrl}
                  onChange={(e) => setHttpUrl(e.target.value)}
                  placeholder="https://mcp.example.com/mcp"
                  style={MONO_INPUT_STYLE}
                />
              </div>

              <div>
                <label style={LABEL_STYLE}>
                  Request Headers (KEY=value, one per line)
                </label>
                <textarea
                  value={httpHeaders}
                  onChange={(e) => setHttpHeaders(e.target.value)}
                  placeholder={'Authorization=Bearer your-token\nX-Custom=value'}
                  rows={4}
                  style={MONO_TEXTAREA_STYLE}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setView('presets')} style={GHOST_BTN_STYLE}>
                  <ChevronLeft size={14} />
                  Back
                </button>
                <button
                  onClick={handleHttpSubmit}
                  disabled={!httpUrl.trim()}
                  style={{
                    ...PURPLE_BTN_STYLE,
                    cursor: httpUrl.trim() ? 'pointer' : 'not-allowed',
                    opacity: httpUrl.trim() ? 1 : 0.4,
                  }}
                >
                  Add HTTP Server
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default McpAddServerModal;
