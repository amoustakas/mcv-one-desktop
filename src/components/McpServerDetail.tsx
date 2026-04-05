import { useState } from 'react';
import { X, Wrench, FileText, Settings, Check } from 'lucide-react';
import type { McpServerConfig, McpTool, McpResource } from '../lib/mcp/types';

interface McpServerDetailProps {
  config: McpServerConfig;
  tools: McpTool[];
  resources: McpResource[];
  onToggleTool: (toolName: string, enabled: boolean) => void;
  onUpdateConfig: (updates: Partial<McpServerConfig>) => void;
  onClose: () => void;
}

type Tab = 'tools' | 'resources' | 'config';

const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'tools', label: 'Tools', icon: <Wrench size={14} /> },
  { id: 'resources', label: 'Resources', icon: <FileText size={14} /> },
  { id: 'config', label: 'Config', icon: <Settings size={14} /> },
];

// ── Tools Tab ──────────────────────────────────────────────────────────────

function ToolsTab({
  tools,
  disabledTools,
  onToggleTool,
}: {
  tools: McpTool[];
  disabledTools: string[];
  onToggleTool: (toolName: string, enabled: boolean) => void;
}) {
  if (tools.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '8px', padding: '48px 24px',
        color: 'var(--text-secondary, #9ca3af)', fontSize: '13px',
      }}>
        <Wrench size={28} style={{ opacity: 0.4 }} />
        <span>No tools exposed by this server</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {tools.map((tool) => {
        const isDisabled = disabledTools.includes(tool.name);
        return (
          <button
            key={tool.name}
            onClick={() => onToggleTool(tool.name, isDisabled)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              padding: '12px', borderRadius: '10px', border: '1px solid',
              borderColor: isDisabled ? 'rgba(255,255,255,0.04)' : 'rgba(0,245,255,0.12)',
              background: isDisabled ? 'rgba(255,255,255,0.02)' : 'rgba(0,245,255,0.04)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              opacity: isDisabled ? 0.5 : 1,
              width: '100%',
            }}
          >
            {/* Checkbox */}
            <div style={{
              width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
              border: `1.5px solid ${isDisabled ? 'rgba(255,255,255,0.2)' : '#00F5FF'}`,
              background: isDisabled ? 'transparent' : 'rgba(0,245,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: '1px',
            }}>
              {!isDisabled && <Check size={11} color="#00F5FF" strokeWidth={3} />}
            </div>

            {/* Tool info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'monospace', fontSize: '13px', fontWeight: 600,
                color: isDisabled ? 'var(--text-secondary, #9ca3af)' : 'var(--text-primary, #e5e7eb)',
                marginBottom: tool.description ? '4px' : 0,
              }}>
                {tool.name}
              </div>
              {tool.description && (
                <div style={{
                  fontSize: '12px', color: 'var(--text-secondary, #9ca3af)',
                  lineHeight: '1.45', wordBreak: 'break-word',
                }}>
                  {tool.description}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Resources Tab ──────────────────────────────────────────────────────────

function ResourcesTab({ resources }: { resources: McpResource[] }) {
  if (resources.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '8px', padding: '48px 24px',
        color: 'var(--text-secondary, #9ca3af)', fontSize: '13px',
      }}>
        <FileText size={28} style={{ opacity: 0.4 }} />
        <span>No resources exposed by this server</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {resources.map((resource) => (
        <div
          key={resource.uri}
          style={{
            padding: '12px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <div style={{
            fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #e5e7eb)',
            marginBottom: '4px',
          }}>
            {resource.name}
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: '11px', color: '#00F5FF',
            marginBottom: resource.description ? '6px' : 0,
            wordBreak: 'break-all',
          }}>
            {resource.uri}
          </div>
          {resource.description && (
            <div style={{
              fontSize: '12px', color: 'var(--text-secondary, #9ca3af)',
              lineHeight: '1.45',
            }}>
              {resource.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Config Tab ─────────────────────────────────────────────────────────────

function ConfigTab({
  config,
  onUpdateConfig,
}: {
  config: McpServerConfig;
  onUpdateConfig: (updates: Partial<McpServerConfig>) => void;
}) {
  const idleMinutes = Math.round(config.idleTimeoutMs / 60000);

  function handleIdleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      onUpdateConfig({ idleTimeoutMs: Math.round(val * 60000) });
    }
  }

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em',
    color: 'var(--text-secondary, #9ca3af)', textTransform: 'uppercase',
    marginBottom: '6px', display: 'block',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary, #e5e7eb)', fontSize: '13px', cursor: 'pointer',
    appearance: 'none',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary, #e5e7eb)', fontSize: '13px',
    boxSizing: 'border-box',
  };

  const rowStyle: React.CSSProperties = {
    marginBottom: '20px',
  };

  return (
    <div>
      {/* Venture Scope */}
      <div style={rowStyle}>
        <label style={fieldLabelStyle}>Venture Scope</label>
        <select
          value={config.ventureScope === '*' ? '*' : 'custom'}
          onChange={(e) => {
            if (e.target.value === '*') {
              onUpdateConfig({ ventureScope: '*' });
            } else {
              onUpdateConfig({ ventureScope: [] });
            }
          }}
          style={selectStyle}
        >
          <option value="*">All Ventures</option>
          <option value="custom">Custom</option>
        </select>
        {config.ventureScope !== '*' && (
          <div style={{
            marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary, #9ca3af)',
          }}>
            Scoped to: {(config.ventureScope as string[]).length > 0
              ? (config.ventureScope as string[]).join(', ')
              : 'none (configure via API)'}
          </div>
        )}
      </div>

      {/* Approval Mode */}
      <div style={rowStyle}>
        <label style={fieldLabelStyle}>Approval Mode</label>
        <select
          value={config.approvalMode}
          onChange={(e) =>
            onUpdateConfig({ approvalMode: e.target.value as McpServerConfig['approvalMode'] })
          }
          style={selectStyle}
        >
          <option value="none">None — auto-approve all calls</option>
          <option value="destructive">Destructive Only — prompt on write ops</option>
          <option value="all">All — prompt on every call</option>
        </select>
      </div>

      {/* Auto-connect */}
      <div style={{ ...rowStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #e5e7eb)' }}>
            Auto-connect
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #9ca3af)', marginTop: '2px' }}>
            Connect automatically on startup
          </div>
        </div>
        <button
          onClick={() => onUpdateConfig({ autoConnect: !config.autoConnect })}
          style={{
            width: '44px', height: '24px', borderRadius: '12px', border: 'none',
            background: config.autoConnect ? '#00F5FF' : 'rgba(255,255,255,0.12)',
            position: 'relative', cursor: 'pointer', flexShrink: 0,
            transition: 'background 0.2s',
          }}
          aria-label={config.autoConnect ? 'Disable auto-connect' : 'Enable auto-connect'}
        >
          <span style={{
            position: 'absolute', top: '3px',
            left: config.autoConnect ? '23px' : '3px',
            width: '18px', height: '18px', borderRadius: '50%',
            background: config.autoConnect ? '#060D14' : '#6b7280',
            transition: 'left 0.2s',
            display: 'block',
          }} />
        </button>
      </div>

      {/* Idle Timeout */}
      <div style={rowStyle}>
        <label style={fieldLabelStyle}>Idle Timeout (minutes)</label>
        <input
          type="number"
          min={1}
          defaultValue={idleMinutes}
          onBlur={handleIdleBlur}
          style={inputStyle}
        />
        <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary, #9ca3af)' }}>
          Disconnect after this many minutes of inactivity
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────

export default function McpServerDetail({
  config,
  tools,
  resources,
  onToggleTool,
  onUpdateConfig,
  onClose,
}: McpServerDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('tools');

  const enabledCount = tools.length - config.disabledTools.filter((n) =>
    tools.some((t) => t.name === n)
  ).length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 199,
          background: 'rgba(6,13,20,0.5)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 200,
          width: '420px', maxWidth: '100vw',
          background: 'var(--bg-surface, #0f0f23)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '15px', fontWeight: 700,
              color: 'var(--text-primary, #e5e7eb)',
              marginBottom: '4px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {config.name}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '5px',
                background: 'rgba(0,245,255,0.08)', color: '#00F5FF',
              }}>
                {config.transport}
              </span>
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '5px',
                background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary, #9ca3af)',
              }}>
                {enabledCount}/{tools.length} tools active
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none',
              color: 'var(--text-secondary, #9ca3af)', cursor: 'pointer',
              padding: '6px', borderRadius: '8px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '2px',
          padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '8px', border: 'none',
                  background: isActive ? 'rgba(0,245,255,0.1)' : 'transparent',
                  color: isActive ? '#00F5FF' : 'var(--text-secondary, #9ca3af)',
                  fontSize: '13px', fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {activeTab === 'tools' && (
            <ToolsTab
              tools={tools}
              disabledTools={config.disabledTools}
              onToggleTool={onToggleTool}
            />
          )}
          {activeTab === 'resources' && (
            <ResourcesTab resources={resources} />
          )}
          {activeTab === 'config' && (
            <ConfigTab config={config} onUpdateConfig={onUpdateConfig} />
          )}
        </div>
      </div>
    </>
  );
}
