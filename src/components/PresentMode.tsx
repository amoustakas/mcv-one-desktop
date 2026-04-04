import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Markdown from './Markdown';

/* ─── Types ──────────────────────────────────────────────────────── */

interface PresentModeProps {
  content: string;
  title: string;
  open: boolean;
  onClose: () => void;
  ventureColor?: string;
}

/* ─── Component ──────────────────────────────────────────────────── */

export default function PresentMode({ content, title, open, onClose, ventureColor }: PresentModeProps) {
  const accent = ventureColor || 'var(--cyan)';

  // Split content into slides on `---` dividers (horizontal rules)
  const slides = content
    .split(/\n---\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const totalSlides = slides.length;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  // Reset slide index when content or open state changes
  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
      setFadeKey((k) => k + 1);
    }
  }, [open, content]);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(totalSlides - 1, index));
      if (clamped !== currentSlide) {
        setCurrentSlide(clamped);
        setFadeKey((k) => k + 1);
      }
    },
    [currentSlide, totalSlides],
  );

  const goNext = useCallback(() => goTo(currentSlide + 1), [goTo, currentSlide]);
  const goPrev = useCallback(() => goTo(currentSlide - 1), [goTo, currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goPrev();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, goNext, goPrev]);

  if (!open) return null;

  return (
    <div style={styles.overlay}>
      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <span style={{ ...styles.topBarTitle, color: accent }}>{title}</span>
        </div>
        <div style={styles.topBarCenter}>
          {totalSlides > 1 && (
            <span style={styles.pageIndicator}>
              {currentSlide + 1} / {totalSlides}
            </span>
          )}
        </div>
        <div style={styles.topBarRight}>
          <button
            onClick={onClose}
            style={styles.closeBtn}
            aria-label="Close presentation"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ── Slide Content ────────────────────────────────────────── */}
      <div style={styles.contentArea}>
        {/* Nav arrows (only when multiple slides) */}
        {totalSlides > 1 && currentSlide > 0 && (
          <button onClick={goPrev} style={{ ...styles.navArrow, left: 24 }} aria-label="Previous slide">
            <ChevronLeft size={32} />
          </button>
        )}
        {totalSlides > 1 && currentSlide < totalSlides - 1 && (
          <button onClick={goNext} style={{ ...styles.navArrow, right: 24 }} aria-label="Next slide">
            <ChevronRight size={32} />
          </button>
        )}

        <div key={fadeKey} style={styles.slideWrapper} className="present-slide-fade">
          <div className="present-markdown-large">
            <Markdown content={slides[currentSlide] || ''} />
          </div>
        </div>
      </div>

      {/* ── Page Dots ────────────────────────────────────────────── */}
      {totalSlides > 1 && (
        <div style={styles.dotsRow}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                ...styles.dot,
                background: i === currentSlide ? accent : 'var(--text-muted)',
                width: i === currentSlide ? 24 : 8,
                opacity: i === currentSlide ? 1 : 0.5,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Scoped styles ────────────────────────────────────────── */}
      <style>{`
        @keyframes presentFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .present-slide-fade {
          animation: presentFadeIn 0.4s ease both;
        }

        /* Large presentation typography overrides */
        .present-markdown-large .markdown-body {
          font-size: 1.5rem;
          line-height: 1.8;
          color: var(--text-primary);
        }
        .present-markdown-large .markdown-body p {
          margin-bottom: 1em;
        }
        .present-markdown-large .markdown-body h1 {
          font-size: 3rem;
          line-height: 1.2;
          margin-bottom: 0.6em;
          color: ${accent};
          font-family: var(--font-display);
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .present-markdown-large .markdown-body h2 {
          font-size: 2.2rem;
          line-height: 1.3;
          margin-bottom: 0.5em;
          color: ${accent};
          font-family: var(--font-display);
          font-weight: 600;
        }
        .present-markdown-large .markdown-body h3 {
          font-size: 1.6rem;
          line-height: 1.4;
          margin-bottom: 0.4em;
          color: ${accent};
          font-family: var(--font-display);
          font-weight: 600;
        }
        .present-markdown-large .markdown-body ul,
        .present-markdown-large .markdown-body ol {
          padding-left: 1.8em;
          margin-bottom: 1em;
        }
        .present-markdown-large .markdown-body li {
          margin-bottom: 0.4em;
        }
        .present-markdown-large .markdown-body blockquote {
          font-size: 1.4rem;
          border-left: 4px solid ${accent};
          padding-left: 20px;
        }
        .present-markdown-large .markdown-body strong {
          color: #fff;
        }
        .present-markdown-large .md-inline-code {
          font-size: 1.2rem;
          padding: 4px 10px;
        }
        .present-markdown-large .md-code-block {
          font-size: 1.1rem;
        }
        .present-markdown-large .md-code-block code {
          font-size: 1rem;
        }
        .present-markdown-large .markdown-body table {
          font-size: 1.1rem;
        }
        .present-markdown-large .markdown-body a {
          color: ${accent};
        }
      `}</style>
    </div>
  );
}

/* ─── Inline Styles ──────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 500,
    background: '#020408',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-sans)',
  },

  /* Top bar */
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    padding: '0 24px',
    flexShrink: 0,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(2,4,8,0.9)',
  },
  topBarLeft: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  topBarTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.1rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const,
  },
  topBarCenter: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  pageIndicator: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
  },
  topBarRight: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },

  /* Content */
  contentArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '48px 120px',
  },
  slideWrapper: {
    maxWidth: 960,
    width: '100%',
    maxHeight: '100%',
    overflowY: 'auto',
  },

  /* Nav arrows */
  navArrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 48,
    height: 48,
    borderRadius: 'var(--radius-full)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    zIndex: 2,
  },

  /* Dots */
  dotsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '16px 0 24px',
    flexShrink: 0,
  },
  dot: {
    height: 8,
    borderRadius: 'var(--radius-full)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: 0,
  },
};
