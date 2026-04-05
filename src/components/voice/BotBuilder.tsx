/**
 * BotBuilder — Personality editor drawer for voice bots.
 * Name, system prompt, voice selector, function calling toggle, tool definitions.
 */
import { useState, useCallback } from 'react';
import { Bot, Sparkles, Save, RotateCcw, ToggleLeft, ToggleRight } from 'lucide-react';
import { VOICE_DATA } from '../../lib/google/voice-constants';
import type { VoiceDefinition } from '../../lib/google/voice-constants';

export interface BotConfig {
  name: string;
  systemPrompt: string;
  voiceName: string;
  enableFunctionCalling: boolean;
  toolDefinitions: string;
}

interface BotBuilderProps {
  config: BotConfig;
  onChange: (config: BotConfig) => void;
  onSave?: () => void;
  onReset?: () => void;
}

const DEFAULT_CONFIG: BotConfig = {
  name: '',
  systemPrompt: '',
  voiceName: 'Puck',
  enableFunctionCalling: false,
  toolDefinitions: '[]',
};

const PROMPT_PLACEHOLDER = `You are a helpful assistant that...

Examples:
- "You are NAOS, an AI operations agent for MCV Global. You speak with authority and precision."
- "You are a friendly customer service rep for EdgeIQ. Always be warm and helpful."
- "You are a senior developer reviewing code. Be constructive but thorough."`;

export default function BotBuilder({ config, onChange, onSave, onReset }: BotBuilderProps) {
  const [toolsError, setToolsError] = useState('');

  const update = useCallback(<K extends keyof BotConfig>(key: K, value: BotConfig[K]) => {
    onChange({ ...config, [key]: value });
  }, [config, onChange]);

  const handleToolsChange = useCallback((value: string) => {
    update('toolDefinitions', value);
    try {
      JSON.parse(value);
      setToolsError('');
    } catch {
      setToolsError('Invalid JSON');
    }
  }, [update]);

  const handleReset = useCallback(() => {
    onChange(DEFAULT_CONFIG);
    setToolsError('');
    onReset?.();
  }, [onChange, onReset]);

  return (
    <div className="bb-root">
      <div className="bb-header">
        <Bot size={16} className="bb-header-icon" />
        <span className="bb-header-title">Bot Builder</span>
        <Sparkles size={12} className="bb-header-sparkle" />
      </div>

      <div className="bb-body">
        {/* Name */}
        <div className="bb-field">
          <label className="bb-label">Name</label>
          <input
            className="bb-input"
            type="text"
            placeholder="My Voice Agent"
            value={config.name}
            onChange={e => update('name', e.target.value)}
          />
        </div>

        {/* System Prompt */}
        <div className="bb-field">
          <label className="bb-label">System Prompt</label>
          <textarea
            className="bb-textarea"
            placeholder={PROMPT_PLACEHOLDER}
            value={config.systemPrompt}
            onChange={e => update('systemPrompt', e.target.value)}
            rows={6}
          />
        </div>

        {/* Voice Selector */}
        <div className="bb-field">
          <label className="bb-label">Voice</label>
          <select
            className="bb-select"
            value={config.voiceName}
            onChange={e => update('voiceName', e.target.value)}
          >
            {VOICE_DATA.map((v: VoiceDefinition) => (
              <option key={v.name} value={v.name}>
                {v.name} — {v.analysis.gender} / {v.pitch}
              </option>
            ))}
          </select>
        </div>

        {/* Function Calling Toggle */}
        <div className="bb-field">
          <label className="bb-label">Function Calling</label>
          <button
            className={`bb-toggle ${config.enableFunctionCalling ? 'bb-toggle--on' : ''}`}
            onClick={() => update('enableFunctionCalling', !config.enableFunctionCalling)}
            type="button"
          >
            {config.enableFunctionCalling
              ? <ToggleRight size={20} className="bb-toggle-icon--on" />
              : <ToggleLeft size={20} className="bb-toggle-icon--off" />
            }
            <span>{config.enableFunctionCalling ? 'Enabled' : 'Disabled'}</span>
          </button>
        </div>

        {/* Tool Definitions */}
        {config.enableFunctionCalling && (
          <div className="bb-field">
            <label className="bb-label">
              Tool Definitions
              {toolsError && <span className="bb-error">{toolsError}</span>}
            </label>
            <textarea
              className="bb-textarea bb-textarea--mono"
              placeholder={'[\n  {\n    "name": "get_weather",\n    "description": "Get current weather",\n    "parameters": { ... }\n  }\n]'}
              value={config.toolDefinitions}
              onChange={e => handleToolsChange(e.target.value)}
              rows={8}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bb-actions">
        <button className="bb-btn bb-btn--secondary" onClick={handleReset} type="button">
          <RotateCcw size={13} />
          Reset
        </button>
        <button className="bb-btn bb-btn--primary" onClick={onSave} type="button">
          <Save size={13} />
          Save Bot
        </button>
      </div>

      <style>{`
        .bb-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          border-left: 1px solid var(--glass-border);
        }

        .bb-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .bb-header-icon {
          color: var(--purple);
        }

        .bb-header-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .bb-header-sparkle {
          color: var(--cyan);
          margin-left: auto;
        }

        .bb-body {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-md);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .bb-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .bb-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .bb-error {
          color: var(--error);
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
          font-size: 10px;
        }

        .bb-input {
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 13px;
          transition: border-color var(--transition-fast);
        }

        .bb-input:focus {
          border-color: var(--border-active);
          box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.06);
          outline: none;
        }

        .bb-textarea {
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 12px;
          line-height: 1.6;
          resize: vertical;
          min-height: 80px;
          transition: border-color var(--transition-fast);
        }

        .bb-textarea:focus {
          border-color: var(--border-active);
          box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.06);
          outline: none;
        }

        .bb-textarea--mono {
          font-family: var(--font-mono);
          font-size: 11px;
          line-height: 1.5;
        }

        .bb-select {
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 12px;
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }

        .bb-select:focus {
          border-color: var(--border-active);
          box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.06);
          outline: none;
        }

        .bb-select option {
          background: var(--bg-surface);
          color: var(--text-primary);
        }

        .bb-toggle {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-size: 12px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .bb-toggle:hover {
          border-color: var(--border-active);
        }

        .bb-toggle--on {
          border-color: rgba(0, 240, 255, 0.25);
          color: var(--cyan);
          background: rgba(0, 240, 255, 0.04);
        }

        .bb-toggle-icon--on {
          color: var(--cyan);
        }

        .bb-toggle-icon--off {
          color: var(--text-muted);
        }

        .bb-actions {
          display: flex;
          gap: var(--space-sm);
          padding: var(--space-md);
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }

        .bb-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .bb-btn--secondary {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }

        .bb-btn--secondary:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }

        .bb-btn--primary {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(139, 92, 246, 0.15));
          border: 1px solid rgba(0, 240, 255, 0.25);
          color: var(--cyan);
        }

        .bb-btn--primary:hover {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(139, 92, 246, 0.25));
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
