import { useState } from 'react';
import {
  AlertCircle, Loader2, Wrench,
  MoreVertical, Trash2, Settings, Play, Square,
} from 'lucide-react';
import type { McpServerConfig, McpConnectionState, McpTool } from '../lib/mcp/types';

interface McpServerCardProps {
  config: McpServerConfig;
  status: McpConnectionState;
  tools: McpTool[];
  error?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onRemove: () => void;
  onConfigure: () => void;
}

const STATUS_CONFIG: Record<
  McpConnectionState,
  { color: string; bg: string; label: string }
> = {
  disconnected: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Disconnected' },
  connecting: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Connecting' },
  initializing: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Initializing' },
  ready: { color: '#00F5FF', bg: 'rgba(0,245,255,0.08)', label: 'Connected' },
  error: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Error' },
  reconnecting: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Reconnecting' },
};

const TRANSPORT_LABELS: Record<string, string> = {
  stdio: 'stdio',
  sse: 'SSE',
  'streamable-http': 'HTTP',
};

export default function McpServerCard({
  config,
  status,
  tools,
  error,
  onConnect,
  onDisconnect,
  onRemove,
  onConfigure,
}: McpServerCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected;
  const isConnected = status === 'ready';
  const isLoading = status === 'connecting' || status === 'initializing' || status === 'reconnecting';

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '16px',
        position: 'relative',
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(0,245,255,0.15)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: statusCfg.color,
            boxShadow: isConnected ? `0 0 8px ${statusCfg.color}` : 'none',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #e5e7eb)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {config.name}
          </div>
          {config.description && (
            <div style={{
              fontSize: '12px', color: 'var(--text-secondary, #9ca3af)', marginTop: '2px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {config.description}
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-secondary, #9ca3af)', cursor: 'pointer',
              padding: '4px', borderRadius: '6px',
            }}
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0,
              background: 'var(--bg-elevated, #1a1a2e)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '4px', zIndex: 50, minWidth: '140px',
            }}>
              <button
                onClick={() => { onConfigure(); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                  padding: '8px 12px', background: 'none', border: 'none',
                  color: 'var(--text-primary, #e5e7eb)', fontSize: '13px',
                  cursor: 'pointer', borderRadius: '6px', textAlign: 'left',
                }}
              >
                <Settings size={14} /> Configure
              </button>
              <button
                onClick={() => { onRemove(); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                  padding: '8px 12px', background: 'none', border: 'none',
                  color: '#ef4444', fontSize: '13px',
                  cursor: 'pointer', borderRadius: '6px', textAlign: 'left',
                }}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px',
          color: isConnected ? '#00F5FF' : 'var(--text-secondary, #9ca3af)',
          background: isConnected ? 'rgba(0,245,255,0.08)' : 'rgba(255,255,255,0.04)',
          padding: '3px 8px', borderRadius: '6px',
        }}>
          <Wrench size={11} />
          {isConnected ? tools.length : '\u2014'} tools
        </span>
        <span style={{
          fontSize: '11px', color: 'var(--text-secondary, #9ca3af)',
          background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '6px',
        }}>
          {TRANSPORT_LABELS[config.transport] || config.transport}
        </span>
        <span style={{
          fontSize: '11px', color: statusCfg.color, background: statusCfg.bg,
          padding: '3px 8px', borderRadius: '6px',
        }}>
          {statusCfg.label}
        </span>
        <span style={{
          fontSize: '11px', color: 'var(--text-secondary, #9ca3af)',
          background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '6px',
        }}>
          {config.ventureScope === '*' ? 'All ventures' : (config.ventureScope as string[]).join(', ')}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '12px',
          color: '#ef4444', background: 'rgba(239,68,68,0.05)',
          padding: '8px 10px', borderRadius: '8px', marginBottom: '12px',
        }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span style={{ wordBreak: 'break-word' }}>{error}</span>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={isConnected ? onDisconnect : onConnect}
        disabled={isLoading}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid',
          borderColor: isConnected ? 'rgba(239,68,68,0.3)' : 'rgba(0,245,255,0.3)',
          background: isConnected ? 'rgba(239,68,68,0.05)' : 'rgba(0,245,255,0.05)',
          color: isConnected ? '#ef4444' : '#00F5FF',
          fontSize: '13px', fontWeight: 500,
          cursor: isLoading ? 'wait' : 'pointer',
          opacity: isLoading ? 0.6 : 1, transition: 'all 0.2s',
        }}
      >
        {isLoading ? (
          <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Connecting...</>
        ) : isConnected ? (
          <><Square size={14} /> Disconnect</>
        ) : (
          <><Play size={14} /> Connect</>
        )}
      </button>
    </div>
  );
}
