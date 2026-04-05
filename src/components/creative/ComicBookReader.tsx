import { useState } from 'react';
import { BookOpen, Loader2, ChevronLeft, ChevronRight, FileDown, Sparkles } from 'lucide-react';

/* ───── Types ───── */
interface ComicPage {
  imageUrl: string;
  caption: string;
  dialogue: { speaker: string; text: string; position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }[];
  choices?: { label: string; nextPrompt: string }[];
}

/* ───── Constants ───── */
const GENRES = [
  { id: 'superhero', label: 'Superhero', color: '#EF4444' },
  { id: 'horror', label: 'Horror', color: '#7C3AED' },
  { id: 'comedy', label: 'Comedy', color: '#F59E0B' },
  { id: 'teen-drama', label: 'Teen Drama', color: '#EC4899' },
  { id: 'sci-fi', label: 'Sci-Fi', color: '#00F0FF' },
  { id: 'fantasy', label: 'Fantasy', color: '#10B981' },
  { id: 'slice-of-life', label: 'Slice of Life', color: '#8899AA' },
] as const;

/* ───── Component ───── */
export default function ComicBookReader() {
  const [storyPrompt, setStoryPrompt] = useState('');
  const [genre, setGenre] = useState('sci-fi');
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState('');

  async function generatePage(prompt?: string) {
    const effectivePrompt = prompt || storyPrompt;
    if (!effectivePrompt.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comic-page',
          prompt: effectivePrompt,
          genre,
          pageNumber: pages.length + 1,
          previousPages: pages.map(p => p.caption),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Page generation failed');
      const newPage: ComicPage = {
        imageUrl: data.imageUrl,
        caption: data.caption || '',
        dialogue: data.dialogue || [],
        choices: data.choices,
      };
      setPages(prev => [...prev, newPage]);
      setCurrentPage(pages.length);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function handleChoice(choice: { label: string; nextPrompt: string }) {
    generatePage(choice.nextPrompt);
  }

  const page = pages[currentPage];
  const genreConfig = GENRES.find(g => g.id === genre);

  return (
    <div className="comic-reader">
      <div className="cr-header">
        <BookOpen size={22} className="cr-header-icon" />
        <div>
          <h2 className="cr-title">Comic Book Studio</h2>
          <p className="cr-subtitle">AI-generated interactive comic pages</p>
        </div>
      </div>

      {/* Controls — show when no pages yet */}
      {pages.length === 0 && (
        <div className="cr-controls">
          <div className="cr-field">
            <label className="cr-label">Story Premise</label>
            <textarea
              className="cr-textarea"
              rows={3}
              placeholder="e.g. A rogue AI detective in Neo-Tokyo discovers that the city's dreams are being stolen..."
              value={storyPrompt}
              onChange={e => setStoryPrompt(e.target.value)}
            />
          </div>

          <div className="cr-field">
            <label className="cr-label">Genre</label>
            <div className="cr-genre-grid">
              {GENRES.map(g => (
                <button
                  key={g.id}
                  className={`cr-genre-btn ${genre === g.id ? 'active' : ''}`}
                  onClick={() => setGenre(g.id)}
                  style={{ '--genre-color': g.color } as React.CSSProperties}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <button className="cr-generate" onClick={() => generatePage()} disabled={loading || !storyPrompt.trim()}>
            {loading ? <Loader2 size={16} className="cr-spin" /> : <Sparkles size={16} />}
            {loading ? 'Creating Page 1...' : 'Begin Story'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && <div className="cr-error">{error}</div>}

      {/* Book Reader */}
      {pages.length > 0 && (
        <div className="cr-book">
          {/* Page display */}
          <div className="cr-page-wrapper">
            {page && (
              <div className="cr-page">
                <div className="cr-page-image-wrap">
                  <img src={page.imageUrl} alt={`Page ${currentPage + 1}`} className="cr-page-image" />

                  {/* Dialogue overlays */}
                  {page.dialogue.map((d, i) => (
                    <div key={i} className={`cr-bubble cr-bubble-${d.position}`}>
                      <span className="cr-bubble-speaker">{d.speaker}</span>
                      <p className="cr-bubble-text">{d.text}</p>
                    </div>
                  ))}
                </div>

                {/* Caption */}
                {page.caption && (
                  <div className="cr-caption">{page.caption}</div>
                )}

                {/* Decision choices */}
                {page.choices && page.choices.length > 0 && (
                  <div className="cr-choices">
                    <p className="cr-choices-label">What happens next?</p>
                    {page.choices.map((choice, i) => (
                      <button
                        key={i}
                        className="cr-choice-btn"
                        onClick={() => handleChoice(choice)}
                        disabled={loading}
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Loading overlay */}
            {loading && (
              <div className="cr-loading-overlay">
                <Loader2 size={32} className="cr-spin" />
                <p>Drawing page {pages.length + 1}...</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="cr-nav">
            <button
              className="cr-nav-btn"
              disabled={currentPage <= 0}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="cr-page-counter">
              Page {currentPage + 1} of {pages.length}
            </span>
            <button
              className="cr-nav-btn"
              disabled={currentPage >= pages.length - 1}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight size={18} />
            </button>

            {/* Continue / Generate next */}
            {!page?.choices && (
              <button
                className="cr-continue-btn"
                onClick={() => generatePage()}
                disabled={loading}
              >
                {loading ? <Loader2 size={14} className="cr-spin" /> : <Sparkles size={14} />}
                Next Page
              </button>
            )}

            {/* Export placeholder */}
            <button className="cr-export-btn" title="Export as PDF (coming soon)" disabled>
              <FileDown size={14} /> Export PDF
            </button>
          </div>
        </div>
      )}

      <style>{`
        .comic-reader {
          height: 100%;
          overflow-y: auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }
        .cr-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        .cr-header-icon { color: ${genreConfig?.color || 'var(--cyan)'}; }
        .cr-title {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .cr-subtitle {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .cr-controls {
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          max-width: 640px;
        }
        .cr-field { display: flex; flex-direction: column; gap: var(--space-sm); }
        .cr-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .cr-textarea {
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
        .cr-textarea:focus {
          outline: none;
          border-color: var(--cyan);
          box-shadow: 0 0 0 3px var(--cyan-glow);
        }
        .cr-textarea::placeholder { color: var(--text-muted); }
        .cr-genre-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .cr-genre-btn {
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .cr-genre-btn:hover {
          border-color: var(--genre-color);
          color: var(--genre-color);
        }
        .cr-genre-btn.active {
          background: color-mix(in srgb, var(--genre-color) 12%, transparent);
          border-color: var(--genre-color);
          color: var(--genre-color);
        }
        .cr-generate {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          padding: 12px;
          background: linear-gradient(135deg, var(--purple), var(--cyan-dim));
          border: none;
          border-radius: var(--radius-md);
          color: #fff;
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .cr-generate:hover:not(:disabled) { filter: brightness(1.15); }
        .cr-generate:disabled { opacity: 0.5; cursor: not-allowed; }
        .cr-spin { animation: crSpin 1s linear infinite; }
        @keyframes crSpin { to { transform: rotate(360deg); } }
        .cr-error {
          padding: var(--space-md);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: var(--error);
          font-size: var(--text-sm);
        }
        .cr-book {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .cr-page-wrapper {
          flex: 1;
          position: relative;
          min-height: 400px;
        }
        .cr-page {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
        .cr-page-image-wrap {
          position: relative;
          flex: 1;
          background: var(--bg-deep);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .cr-page-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        /* Speech bubbles */
        .cr-bubble {
          position: absolute;
          max-width: 200px;
          background: #fff;
          border-radius: 16px;
          padding: 8px 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .cr-bubble-top-left { top: 12px; left: 12px; }
        .cr-bubble-top-right { top: 12px; right: 12px; }
        .cr-bubble-bottom-left { bottom: 12px; left: 12px; }
        .cr-bubble-bottom-right { bottom: 12px; right: 12px; }
        .cr-bubble-speaker {
          font-size: 9px;
          font-weight: 700;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .cr-bubble-text {
          font-size: 11px;
          color: #111;
          margin: 2px 0 0 0;
          line-height: 1.3;
        }
        .cr-caption {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-sm) var(--space-md);
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-style: italic;
          text-align: center;
        }
        .cr-choices {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          padding: var(--space-md);
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
        }
        .cr-choices-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
        }
        .cr-choice-btn {
          padding: 10px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: var(--text-sm);
          text-align: left;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .cr-choice-btn:hover {
          border-color: var(--cyan);
          background: var(--cyan-glow);
        }
        .cr-choice-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cr-loading-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          background: rgba(2, 4, 8, 0.8);
          backdrop-filter: blur(8px);
          border-radius: var(--radius-lg);
          color: var(--cyan);
          font-size: var(--text-sm);
          z-index: 5;
        }
        .cr-nav {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }
        .cr-nav-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .cr-nav-btn:hover:not(:disabled) {
          border-color: var(--cyan);
          color: var(--cyan);
        }
        .cr-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .cr-page-counter {
          font-size: var(--text-xs);
          font-family: var(--font-mono);
          color: var(--text-muted);
          min-width: 100px;
          text-align: center;
        }
        .cr-continue-btn {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          background: var(--purple-glow);
          border: 1px solid var(--purple);
          border-radius: var(--radius-md);
          color: var(--purple);
          font-size: var(--text-xs);
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .cr-continue-btn:hover:not(:disabled) {
          background: var(--purple);
          color: #fff;
        }
        .cr-continue-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cr-export-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-size: var(--text-xs);
          cursor: not-allowed;
          opacity: 0.5;
        }

        @media (max-width: 640px) {
          .cr-genre-grid { gap: 4px; }
          .cr-bubble { max-width: 140px; padding: 6px 8px; }
        }
      `}</style>
    </div>
  );
}
