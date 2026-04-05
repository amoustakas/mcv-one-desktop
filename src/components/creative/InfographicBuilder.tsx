import { useState, useRef } from 'react';
import { BarChart3, Loader2, Download, RefreshCw, Globe, Palette, GraduationCap, Search } from 'lucide-react';

/* ───── Constants ───── */
const STYLES = [
  'minimalist', 'photorealistic', 'cartoon', 'vintage',
  'cyberpunk', 'isometric-3d', 'sketch', 'infographic',
] as const;

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Japanese',
  'Chinese', 'Korean', 'Arabic', 'Portuguese', 'Hindi',
  'Italian', 'Russian', 'Dutch',
] as const;

const COMPLEXITY = ['elementary', 'intermediate', 'advanced', 'expert'] as const;

const RESEARCH_FACTS = [
  'Analyzing search results across 50+ sources...',
  'Cross-referencing data points for accuracy...',
  'Extracting key statistics and trends...',
  'Building visual hierarchy from research...',
  'Selecting optimal chart types for data...',
  'Applying brand-consistent color palette...',
  'Optimizing layout for readability...',
  'Generating final composite image...',
];

/* ───── Component ───── */
export default function InfographicBuilder() {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState<typeof STYLES[number]>('infographic');
  const [language, setLanguage] = useState<typeof LANGUAGES[number]>('English');
  const [complexity, setComplexity] = useState<typeof COMPLEXITY[number]>('intermediate');
  const [loading, setLoading] = useState(false);
  const [factIdx, setFactIdx] = useState(0);
  const [result, setResult] = useState<{ imageUrl: string; sources: { title: string; url: string }[] } | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [error, setError] = useState('');
  const factInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setFactIdx(0);

    factInterval.current = setInterval(() => {
      setFactIdx(prev => (prev + 1) % RESEARCH_FACTS.length);
    }, 2500);

    try {
      const res = await fetch('/api/imagen-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'infographic', topic, style, language, complexity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult({ imageUrl: data.imageUrl, sources: data.sources || [] });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
      if (factInterval.current) clearInterval(factInterval.current);
    }
  }

  async function handleEdit() {
    if (!editPrompt.trim() || !result) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/imagen-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'infographic', topic, style, language, complexity, editPrompt, referenceImage: result.imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Edit failed');
      setResult({ imageUrl: data.imageUrl, sources: data.sources || result.sources });
      setEditPrompt('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="infographic-builder">
      <div className="ib-header">
        <BarChart3 size={22} className="ib-header-icon" />
        <div>
          <h2 className="ib-title">Infographic Builder</h2>
          <p className="ib-subtitle">Search-grounded visual knowledge generation</p>
        </div>
      </div>

      <div className="ib-controls">
        {/* Topic */}
        <div className="ib-field ib-field-full">
          <label className="ib-label"><Search size={13} /> Topic</label>
          <input
            className="ib-input"
            type="text"
            placeholder="e.g. Global renewable energy adoption trends 2024"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
        </div>

        {/* Style */}
        <div className="ib-field">
          <label className="ib-label"><Palette size={13} /> Style</label>
          <div className="ib-chip-grid">
            {STYLES.map(s => (
              <button
                key={s}
                className={`ib-chip ${style === s ? 'active' : ''}`}
                onClick={() => setStyle(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="ib-field">
          <label className="ib-label"><Globe size={13} /> Language</label>
          <select className="ib-select" value={language} onChange={e => setLanguage(e.target.value as typeof LANGUAGES[number])}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Complexity */}
        <div className="ib-field">
          <label className="ib-label"><GraduationCap size={13} /> Complexity</label>
          <div className="ib-chip-grid">
            {COMPLEXITY.map(c => (
              <button
                key={c}
                className={`ib-chip ${complexity === c ? 'active' : ''}`}
                onClick={() => setComplexity(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Generate */}
        <button className="ib-generate" onClick={handleGenerate} disabled={loading || !topic.trim()}>
          {loading ? <Loader2 size={16} className="ib-spin" /> : <BarChart3 size={16} />}
          {loading ? 'Generating...' : 'Generate Infographic'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="ib-loading-panel">
          <Loader2 size={28} className="ib-spin" />
          <p className="ib-research-fact">{RESEARCH_FACTS[factIdx]}</p>
          <div className="ib-progress-bar">
            <div className="ib-progress-fill" />
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="ib-error">{error}</div>}

      {/* Result */}
      {result && (
        <div className="ib-result">
          <div className="ib-image-wrap">
            <img src={result.imageUrl} alt="Generated infographic" className="ib-image" />
            <a href={result.imageUrl} download className="ib-download-btn">
              <Download size={14} /> Download
            </a>
          </div>

          {/* Edit prompt */}
          <div className="ib-edit-row">
            <input
              className="ib-input"
              type="text"
              placeholder="Refine: add more data about solar energy..."
              value={editPrompt}
              onChange={e => setEditPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEdit()}
            />
            <button className="ib-edit-btn" onClick={handleEdit} disabled={loading || !editPrompt.trim()}>
              <RefreshCw size={14} /> Edit
            </button>
          </div>

          {/* Sources */}
          {result.sources.length > 0 && (
            <div className="ib-sources">
              <h4 className="ib-sources-title">Sources</h4>
              <ul className="ib-sources-list">
                {result.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <style>{`
        .infographic-builder {
          height: 100%;
          overflow-y: auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }
        .ib-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        .ib-header-icon { color: var(--cyan); }
        .ib-title {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .ib-subtitle {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .ib-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
        }
        .ib-field { display: flex; flex-direction: column; gap: var(--space-sm); }
        .ib-field-full { grid-column: 1 / -1; }
        .ib-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ib-input {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-family: var(--font-sans);
          transition: var(--transition-fast);
          width: 100%;
        }
        .ib-input:focus {
          outline: none;
          border-color: var(--cyan);
          box-shadow: 0 0 0 3px var(--cyan-glow);
        }
        .ib-input::placeholder { color: var(--text-muted); }
        .ib-select {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-family: var(--font-sans);
        }
        .ib-select:focus {
          outline: none;
          border-color: var(--cyan);
        }
        .ib-chip-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .ib-chip {
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
        .ib-chip:hover {
          border-color: var(--cyan-dim);
          color: var(--text-primary);
        }
        .ib-chip.active {
          background: var(--cyan-glow);
          border-color: var(--cyan);
          color: var(--cyan);
        }
        .ib-generate {
          grid-column: 1 / -1;
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
        .ib-generate:hover:not(:disabled) {
          filter: brightness(1.15);
          box-shadow: 0 0 20px var(--cyan-glow);
        }
        .ib-generate:disabled { opacity: 0.5; cursor: not-allowed; }
        .ib-spin { animation: ibSpin 1s linear infinite; }
        @keyframes ibSpin { to { transform: rotate(360deg); } }
        .ib-loading-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
          color: var(--cyan);
        }
        .ib-research-fact {
          color: var(--text-secondary);
          font-size: var(--text-sm);
          text-align: center;
          min-height: 1.5em;
        }
        .ib-progress-bar {
          width: 200px;
          height: 3px;
          background: var(--bg-card);
          border-radius: 2px;
          overflow: hidden;
        }
        .ib-progress-fill {
          height: 100%;
          width: 30%;
          background: var(--cyan);
          border-radius: 2px;
          animation: ibProgress 2s ease-in-out infinite;
        }
        @keyframes ibProgress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .ib-error {
          padding: var(--space-md);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: var(--error);
          font-size: var(--text-sm);
        }
        .ib-result {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .ib-image-wrap {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .ib-image {
          width: 100%;
          display: block;
          border-radius: var(--radius-lg);
        }
        .ib-download-btn {
          position: absolute;
          top: var(--space-md);
          right: var(--space-md);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: var(--text-xs);
          text-decoration: none;
          transition: var(--transition-fast);
        }
        .ib-download-btn:hover {
          background: var(--cyan-glow);
          border-color: var(--cyan);
        }
        .ib-edit-row {
          display: flex;
          gap: var(--space-sm);
        }
        .ib-edit-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: var(--text-sm);
          cursor: pointer;
          white-space: nowrap;
          transition: var(--transition-fast);
        }
        .ib-edit-btn:hover:not(:disabled) {
          border-color: var(--purple);
          color: var(--purple);
        }
        .ib-edit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ib-sources {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-md);
        }
        .ib-sources-title {
          font-size: var(--text-xs);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 var(--space-sm) 0;
        }
        .ib-sources-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ib-sources-list a {
          color: var(--cyan-dim);
          font-size: var(--text-xs);
          text-decoration: none;
          transition: var(--transition-fast);
        }
        .ib-sources-list a:hover { color: var(--cyan); text-decoration: underline; }

        @media (max-width: 640px) {
          .ib-controls { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
