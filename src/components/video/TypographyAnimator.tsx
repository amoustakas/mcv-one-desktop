import { useState, useCallback } from 'react';
import { Type, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { GenerateVideoParams, VeoStatus } from '../../lib/google/veo-client';
import { VeoModel, VeoAspectRatio, VeoResolution, VeoGenerationMode } from '../../lib/google/veo-client';

interface TypographyAnimatorProps {
  onGenerate: (params: GenerateVideoParams) => Promise<unknown>;
  status: VeoStatus;
  error: string | null;
  onClearError: () => void;
}

interface StylePreset {
  id: string;
  label: string;
  description: string;
  promptSuffix: string;
  gradient: string;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'cinematic-3d',
    label: 'Cinematic 3D',
    description: 'Bold extruded 3D text with dramatic lighting',
    promptSuffix: 'cinematic 3D extruded text floating in space, dramatic volumetric lighting, photorealistic render, depth of field',
    gradient: 'linear-gradient(135deg, #ff6b35, #f7c948)',
  },
  {
    id: 'neon-cyber',
    label: 'Neon Cyber',
    description: 'Glowing neon text on dark cyberpunk backdrop',
    promptSuffix: 'glowing neon text on a dark cyberpunk city backdrop, electric blue and hot pink neon tubes, reflections on wet pavement',
    gradient: 'linear-gradient(135deg, #00f5ff, #ff00ff)',
  },
  {
    id: 'elegant-serif',
    label: 'Elegant Serif',
    description: 'Gold serif lettering with luxury particles',
    promptSuffix: 'elegant golden serif typography, luxury particles and sparkles, dark velvet background, sophisticated animation',
    gradient: 'linear-gradient(135deg, #d4a574, #f5e6d0)',
  },
  {
    id: 'bold-sans',
    label: 'Bold Sans',
    description: 'Clean modern sans-serif with kinetic motion',
    promptSuffix: 'bold modern sans-serif typography, clean minimalist kinetic text animation, smooth motion graphics, white on dark',
    gradient: 'linear-gradient(135deg, #ffffff, #888888)',
  },
  {
    id: 'handwritten',
    label: 'Handwritten',
    description: 'Animated handwriting with ink flow',
    promptSuffix: 'handwritten calligraphy text being written by an invisible pen, ink flowing onto textured paper, warm aesthetic',
    gradient: 'linear-gradient(135deg, #4a3728, #8b6914)',
  },
  {
    id: 'retro-80s',
    label: 'Retro 80s',
    description: 'Chrome text with synthwave grid',
    promptSuffix: 'retro 80s chrome text, synthwave sunset gradient, grid floor perspective, VHS scan lines, vaporwave aesthetic',
    gradient: 'linear-gradient(135deg, #ff71ce, #01cdfe)',
  },
  {
    id: 'liquid-metal',
    label: 'Liquid Metal',
    description: 'Morphing mercury text with reflections',
    promptSuffix: 'liquid mercury metal text morphing and forming letters, highly reflective chrome surface, dark studio environment',
    gradient: 'linear-gradient(135deg, #c0c0c0, #303030)',
  },
  {
    id: 'botanical',
    label: 'Botanical',
    description: 'Text formed by growing vines and flowers',
    promptSuffix: 'text formed by growing vines, leaves, and blooming flowers, botanical time-lapse style, soft natural lighting',
    gradient: 'linear-gradient(135deg, #2d5a27, #a8e6a3)',
  },
];

export default function TypographyAnimator({ onGenerate, status, error, onClearError }: TypographyAnimatorProps) {
  const [text, setText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const busy = status !== 'idle' && status !== 'complete' && status !== 'error';
  const preset = STYLE_PRESETS.find(p => p.id === selectedPreset);

  const handleSubmit = useCallback(() => {
    if (!text.trim() || !preset || busy) return;
    onClearError();

    const fullPrompt = `Animated text that reads "${text.trim()}". ${preset.promptSuffix}`;
    const params: GenerateVideoParams = {
      prompt: fullPrompt,
      model: VeoModel.VEO,
      mode: VeoGenerationMode.TEXT_TO_VIDEO,
      aspectRatio: VeoAspectRatio.LANDSCAPE,
      resolution: VeoResolution.P1080,
    };
    onGenerate(params);
  }, [text, preset, busy, onGenerate, onClearError]);

  return (
    <div className="typo-root">
      <p className="typo-description">
        Create animated typography videos. Enter your text, pick a style, and generate.
      </p>

      {/* Text input */}
      <div className="typo-field">
        <label className="typo-label">Text to Animate</label>
        <div className="typo-text-input-wrap">
          <Type size={18} className="typo-text-icon" />
          <input
            type="text"
            className="typo-text-input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Enter your text..."
            disabled={busy}
            maxLength={100}
          />
          <span className="typo-char-count">{text.length}/100</span>
        </div>
      </div>

      {/* Preview */}
      {text.trim() && preset && (
        <div className="typo-preview" style={{ background: preset.gradient }}>
          <span className="typo-preview-text">{text}</span>
          <span className="typo-preview-style">{preset.label}</span>
        </div>
      )}

      {/* Style presets grid */}
      <div className="typo-field">
        <label className="typo-label">Style Preset</label>
        <div className="typo-presets-grid">
          {STYLE_PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              className={cn('typo-preset-card', selectedPreset === p.id && 'typo-preset-active')}
              onClick={() => setSelectedPreset(p.id)}
              disabled={busy}
            >
              <div className="typo-preset-swatch" style={{ background: p.gradient }} />
              <div className="typo-preset-info">
                <span className="typo-preset-name">{p.label}</span>
                <span className="typo-preset-desc">{p.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Status / Error */}
      {(busy || error) && (
        <div className={cn('typo-status', error && 'typo-status-error')}>
          {busy && <Loader2 size={16} className="typo-spinner" />}
          <span>{error || 'Generating animated text...'}</span>
        </div>
      )}

      {/* Submit */}
      <button
        className="typo-submit"
        onClick={handleSubmit}
        disabled={busy || !text.trim() || !preset}
      >
        {busy ? (
          <>
            <Loader2 size={18} className="typo-spinner" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles size={18} />
            <span>Generate Typography</span>
          </>
        )}
      </button>

      <style>{`
        .typo-root {
          display: flex;
          flex-direction: column;
          gap: var(--space-md, 16px);
        }
        .typo-description {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-secondary, #8b949e);
          line-height: 1.5;
        }
        .typo-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .typo-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary, #8b949e);
        }
        .typo-text-input-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 var(--space-md, 16px);
          background: var(--bg-surface, #0d1117);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: var(--radius-md, 12px);
          transition: border-color 0.15s;
        }
        .typo-text-input-wrap:focus-within {
          border-color: var(--cyan, #00f5ff);
        }
        .typo-text-icon {
          color: var(--text-secondary, #8b949e);
          flex-shrink: 0;
        }
        .typo-text-input {
          flex: 1;
          padding: 10px 0;
          background: transparent;
          border: none;
          color: var(--text-primary, #e6edf3);
          font-size: 1rem;
          font-family: inherit;
          outline: none;
        }
        .typo-text-input::placeholder {
          color: var(--text-secondary, #8b949e);
        }
        .typo-char-count {
          font-size: 0.75rem;
          color: var(--text-secondary, #8b949e);
          flex-shrink: 0;
        }
        .typo-preview {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 120px;
          border-radius: var(--radius-md, 12px);
          overflow: hidden;
        }
        .typo-preview-text {
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          text-shadow: 0 2px 12px rgba(0,0,0,0.5);
          text-align: center;
          padding: 0 var(--space-md, 16px);
          word-break: break-word;
        }
        .typo-preview-style {
          position: absolute;
          bottom: 8px;
          right: 12px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .typo-presets-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--space-sm, 8px);
        }
        .typo-preset-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: var(--radius-md, 12px);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          background: var(--bg-surface, #0d1117);
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s, background 0.15s;
        }
        .typo-preset-card:hover:not(:disabled) {
          border-color: var(--cyan, #00f5ff);
        }
        .typo-preset-active {
          border-color: var(--cyan, #00f5ff);
          background: rgba(0, 245, 255, 0.06);
        }
        .typo-preset-card:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .typo-preset-swatch {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm, 6px);
          flex-shrink: 0;
        }
        .typo-preset-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .typo-preset-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary, #e6edf3);
        }
        .typo-preset-desc {
          font-size: 0.6875rem;
          color: var(--text-secondary, #8b949e);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .typo-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: var(--space-sm, 8px) var(--space-md, 16px);
          border-radius: var(--radius-sm, 6px);
          background: rgba(0, 245, 255, 0.06);
          border: 1px solid rgba(0, 245, 255, 0.15);
          color: var(--cyan, #00f5ff);
          font-size: 0.8125rem;
        }
        .typo-status-error {
          background: rgba(248, 81, 73, 0.08);
          border-color: rgba(248, 81, 73, 0.2);
          color: #f85149;
        }
        .typo-spinner {
          animation: typo-spin 1s linear infinite;
        }
        @keyframes typo-spin {
          to { transform: rotate(360deg); }
        }
        .typo-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: var(--radius-md, 12px);
          border: none;
          background: linear-gradient(135deg, var(--cyan, #00f5ff), var(--purple, #8b5cf6));
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }
        .typo-submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .typo-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 640px) {
          .typo-presets-grid {
            grid-template-columns: 1fr;
          }
          .typo-preview-text {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
