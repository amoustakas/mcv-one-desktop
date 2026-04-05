import { useState, lazy, Suspense } from 'react';
import { PenTool, Save, Download, Loader2, AlertTriangle } from 'lucide-react';

const TldrawLazy = lazy(async () => {
  try {
    const mod = await import('@tldraw/tldraw');
    return { default: mod.Tldraw };
  } catch {
    return {
      default: function TldrawFallback() {
        return (
          <div className="ccv-fallback">
            <AlertTriangle size={32} />
            <h3>TLDraw not installed</h3>
            <p>Install the package to enable the creative canvas:</p>
            <code>npm install @tldraw/tldraw</code>
          </div>
        );
      },
    };
  }
});

/* ───── Component ───── */
export default function CreativeCanvasView() {
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    // Placeholder save logic — integrate with Supabase / file export
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
  }

  function handleExport() {
    // Placeholder export — would export canvas as PNG/SVG
    const canvas = document.querySelector('.tl-container canvas') as HTMLCanvasElement | null;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'creative-canvas.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  }

  return (
    <div className="creative-canvas-view">
      {/* Header bar */}
      <div className="ccv-header">
        <div className="ccv-header-left">
          <PenTool size={18} className="ccv-header-icon" />
          <h2 className="ccv-title">Creative Canvas</h2>
        </div>
        <div className="ccv-header-right">
          <button className="ccv-btn" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="ccv-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="ccv-btn ccv-btn-secondary" onClick={handleExport}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="ccv-canvas-container">
        <Suspense fallback={
          <div className="ccv-loading">
            <Loader2 size={24} className="ccv-spin" />
            <span>Loading canvas...</span>
          </div>
        }>
          <TldrawLazy />
        </Suspense>
      </div>

      <style>{`
        .creative-canvas-view {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .ccv-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          backdrop-filter: blur(12px);
        }
        .ccv-header-left {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }
        .ccv-header-icon { color: var(--cyan); }
        .ccv-title {
          font-family: var(--font-display);
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .ccv-header-right {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }
        .ccv-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: var(--cyan-glow);
          border: 1px solid var(--cyan);
          border-radius: var(--radius-md);
          color: var(--cyan);
          font-size: var(--text-xs);
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .ccv-btn:hover:not(:disabled) {
          background: var(--cyan);
          color: var(--bg-deep);
        }
        .ccv-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ccv-btn-secondary {
          background: var(--bg-card);
          border-color: var(--border);
          color: var(--text-secondary);
        }
        .ccv-btn-secondary:hover {
          border-color: var(--text-muted);
          color: var(--text-primary);
          background: var(--bg-elevated);
        }
        .ccv-spin { animation: ccvSpin 1s linear infinite; }
        @keyframes ccvSpin { to { transform: rotate(360deg); } }
        .ccv-canvas-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        .ccv-loading {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          color: var(--text-muted);
          font-size: var(--text-sm);
        }
        .ccv-fallback {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-md);
          color: var(--text-secondary);
          text-align: center;
          padding: var(--space-2xl);
        }
        .ccv-fallback h3 {
          font-family: var(--font-display);
          font-size: var(--text-xl);
          color: var(--text-primary);
          margin: 0;
        }
        .ccv-fallback p {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin: 0;
        }
        .ccv-fallback code {
          font-family: var(--font-mono);
          font-size: var(--text-sm);
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: var(--radius-md);
          color: var(--cyan);
        }
      `}</style>
    </div>
  );
}
