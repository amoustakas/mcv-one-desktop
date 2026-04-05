import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui';

// ---------------------------------------------------------------------------
// Chat Settings — per-conversation model, temperature, max tokens
// ---------------------------------------------------------------------------

export interface ConversationSettings {
  model: string;
  temperature: number;
  maxTokens: number;
}

const DEFAULT_SETTINGS: ConversationSettings = {
  model: 'claude-sonnet-4-20250514',
  temperature: 0.7,
  maxTokens: 4096,
};

const MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
];

interface ChatSettingsProps {
  settings: ConversationSettings;
  onChange: (settings: ConversationSettings) => void;
  className?: string;
}

export default function ChatSettings({ settings, onChange, className }: ChatSettingsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('cs-container', className)}>
      <button className="cs-trigger" onClick={() => setOpen(!open)} title="Chat Settings">
        <Settings size={14} />
      </button>

      {open && (
        <div className="cs-popover">
          <div className="cs-header">
            <span>Chat Settings</span>
            <button className="cs-close" onClick={() => setOpen(false)}><X size={12} /></button>
          </div>

          <div className="cs-body">
            <label className="cs-label">Model</label>
            <select
              className="cs-select"
              value={settings.model}
              onChange={(e) => onChange({ ...settings, model: e.target.value })}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>

            <label className="cs-label">Temperature ({settings.temperature.toFixed(1)})</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => onChange({ ...settings, temperature: parseFloat(e.target.value) })}
              className="cs-slider"
            />

            <label className="cs-label">Max Tokens ({settings.maxTokens})</label>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={settings.maxTokens}
              onChange={(e) => onChange({ ...settings, maxTokens: parseInt(e.target.value, 10) })}
              className="cs-slider"
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(DEFAULT_SETTINGS)}
              className="cs-reset"
            >
              Reset to defaults
            </Button>
          </div>

          <style>{`
            .cs-popover {
              position: absolute;
              bottom: 100%;
              right: 0;
              margin-bottom: 8px;
              width: 260px;
              background: var(--bg-surface);
              border: 1px solid var(--border);
              border-radius: var(--radius-md);
              z-index: 20;
              box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            }

            .cs-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 8px 12px;
              border-bottom: 1px solid var(--border);
              font-size: var(--text-sm);
              font-weight: 600;
              color: var(--text-primary);
            }

            .cs-close { padding: 2px; color: var(--text-muted); border-radius: 3px; }
            .cs-close:hover { color: var(--text-primary); }

            .cs-body { padding: 12px; display: flex; flex-direction: column; gap: 8px; }

            .cs-label {
              font-size: 11px;
              font-weight: 600;
              color: var(--text-secondary);
              margin-top: 4px;
            }

            .cs-select {
              width: 100%;
              padding: 5px 8px;
              font-size: 12px;
              background: var(--bg-input);
              border: 1px solid var(--border);
              border-radius: var(--radius-sm);
              color: var(--text-primary);
            }

            .cs-slider {
              width: 100%;
              accent-color: var(--cyan);
            }

            .cs-reset { margin-top: 8px; width: 100%; }
          `}</style>
        </div>
      )}

      <style>{`
        .cs-container { position: relative; }
        .cs-trigger {
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-sm); color: var(--text-secondary);
          transition: all var(--transition-fast); flex-shrink: 0;
        }
        .cs-trigger:hover { color: var(--text-primary); background: var(--bg-card); }
      `}</style>
    </div>
  );
}

export { DEFAULT_SETTINGS };
