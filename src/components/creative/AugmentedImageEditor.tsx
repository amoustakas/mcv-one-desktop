import { useState } from 'react';
import { Layers, Loader2, Palette, Sparkles, Info } from 'lucide-react';

/* ───── Types ───── */
interface AnnotationRegion {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AugmentedResult {
  imageUrl: string;
  regions: AnnotationRegion[];
}

/* ───── Constants ───── */
const STYLES = [
  'photorealistic', 'digital-art', 'oil-painting', 'watercolor',
  'anime', 'concept-art', 'low-poly', 'neon-noir',
] as const;

/* ───── Component ───── */
export default function AugmentedImageEditor() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<typeof STYLES[number]>('photorealistic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AugmentedResult | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/imagen-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'augmented', prompt, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult({
        imageUrl: data.imageUrl,
        regions: data.regions || [],
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const activeRegion = result?.regions.find(r => r.id === hoveredRegion);

  return (
    <div className="augmented-editor">
      <div className="ae-header">
        <Layers size={22} className="ae-header-icon" />
        <div>
          <h2 className="ae-title">Augmented Image Editor</h2>
          <p className="ae-subtitle">AI generation with interactive annotation overlays</p>
        </div>
      </div>

      {/* Controls */}
      <div className="ae-controls">
        <div className="ae-field ae-field-full">
          <label className="ae-label"><Sparkles size={13} /> Prompt</label>
          <textarea
            className="ae-textarea"
            rows={3}
            placeholder="Describe your scene... e.g. A futuristic city at sunset with flying vehicles"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
        </div>

        <div className="ae-field">
          <label className="ae-label"><Palette size={13} /> Style</label>
          <div className="ae-chip-grid">
            {STYLES.map(s => (
              <button
                key={s}
                className={`ae-chip ${style === s ? 'active' : ''}`}
                onClick={() => setStyle(s)}
              >
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <button className="ae-generate" onClick={handleGenerate} disabled={loading || !prompt.trim()}>
          {loading ? <Loader2 size={16} className="ae-spin" /> : <Layers size={16} />}
          {loading ? 'Generating...' : 'Generate & Annotate'}
        </button>
      </div>

      {/* Error */}
      {error && <div className="ae-error">{error}</div>}

      {/* Result */}
      {result && (
        <div className="ae-result">
          <div className="ae-image-container">
            <img src={result.imageUrl} alt="Generated image" className="ae-image" />

            {/* Region overlays */}
            {result.regions.map(region => (
              <div
                key={region.id}
                className={`ae-region ${hoveredRegion === region.id ? 'active' : ''}`}
                style={{
                  left: `${region.x}%`,
                  top: `${region.y}%`,
                  width: `${region.width}%`,
                  height: `${region.height}%`,
                }}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                <span className="ae-region-label">{region.label}</span>
              </div>
            ))}

            {/* Tooltip popover */}
            {activeRegion && (
              <div
                className="ae-tooltip"
                style={{
                  left: `${Math.min(activeRegion.x + activeRegion.width, 75)}%`,
                  top: `${activeRegion.y}%`,
                }}
              >
                <div className="ae-tooltip-title">
                  <Info size={12} /> {activeRegion.label}
                </div>
                <p className="ae-tooltip-desc">{activeRegion.description}</p>
              </div>
            )}
          </div>

          {/* Region list */}
          {result.regions.length > 0 && (
            <div className="ae-region-list">
              <h4 className="ae-region-list-title">Detected Regions</h4>
              {result.regions.map(region => (
                <div
                  key={region.id}
                  className={`ae-region-item ${hoveredRegion === region.id ? 'active' : ''}`}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                >
                  <span className="ae-region-item-label">{region.label}</span>
                  <span className="ae-region-item-desc">{region.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .augmented-editor {
          height: 100%;
          overflow-y: auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }
        .ae-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        .ae-header-icon { color: var(--cyan); }
        .ae-title {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .ae-subtitle {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .ae-controls {
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .ae-field { display: flex; flex-direction: column; gap: var(--space-sm); }
        .ae-field-full { width: 100%; }
        .ae-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ae-textarea {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-family: var(--font-sans);
          resize: vertical;
          width: 100%;
        }
        .ae-textarea:focus {
          outline: none;
          border-color: var(--cyan);
          box-shadow: 0 0 0 3px var(--cyan-glow);
        }
        .ae-textarea::placeholder { color: var(--text-muted); }
        .ae-chip-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .ae-chip {
          padding: 5px 12px;
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition-fast);
          text-transform: capitalize;
        }
        .ae-chip:hover {
          border-color: var(--cyan-dim);
          color: var(--text-primary);
        }
        .ae-chip.active {
          background: var(--cyan-glow);
          border-color: var(--cyan);
          color: var(--cyan);
        }
        .ae-generate {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          padding: 12px;
          background: linear-gradient(135deg, var(--cyan-dim), var(--purple));
          border: none;
          border-radius: var(--radius-md);
          color: #fff;
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .ae-generate:hover:not(:disabled) {
          filter: brightness(1.15);
          box-shadow: 0 0 20px var(--cyan-glow);
        }
        .ae-generate:disabled { opacity: 0.5; cursor: not-allowed; }
        .ae-spin { animation: aeSpin 1s linear infinite; }
        @keyframes aeSpin { to { transform: rotate(360deg); } }
        .ae-error {
          padding: var(--space-md);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: var(--error);
          font-size: var(--text-sm);
        }
        .ae-result {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .ae-image-container {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .ae-image {
          width: 100%;
          display: block;
        }
        .ae-region {
          position: absolute;
          border: 1px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ae-region:hover,
        .ae-region.active {
          border-color: var(--cyan);
          background: rgba(0, 240, 255, 0.08);
          box-shadow: inset 0 0 0 1px var(--cyan-glow);
        }
        .ae-region-label {
          position: absolute;
          top: -22px;
          left: 0;
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--cyan);
          background: var(--bg-deep);
          padding: 2px 8px;
          border-radius: 3px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.15s;
          pointer-events: none;
        }
        .ae-region:hover .ae-region-label,
        .ae-region.active .ae-region-label {
          opacity: 1;
        }
        .ae-tooltip {
          position: absolute;
          z-index: 10;
          background: var(--bg-elevated);
          border: 1px solid var(--cyan);
          border-radius: var(--radius-md);
          padding: var(--space-sm) var(--space-md);
          max-width: 240px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          pointer-events: none;
          animation: aeTooltipIn 0.15s ease;
        }
        @keyframes aeTooltipIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ae-tooltip-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--cyan);
          margin-bottom: 4px;
        }
        .ae-tooltip-desc {
          font-size: 11px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.4;
        }
        .ae-region-list {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-md);
        }
        .ae-region-list-title {
          font-size: var(--text-xs);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 var(--space-sm) 0;
        }
        .ae-region-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
          cursor: pointer;
        }
        .ae-region-item:hover,
        .ae-region-item.active {
          background: var(--cyan-glow);
        }
        .ae-region-item-label {
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--text-primary);
        }
        .ae-region-item-desc {
          font-size: 10px;
          color: var(--text-muted);
          max-width: 60%;
          text-align: right;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
