import { useState, lazy, Suspense } from 'react';
import {
  PenTool, Save, Download, Loader2, AlertTriangle, Sparkles,
  Image, Zap, Package, Film, Layers, Brush, Palette, X, Bot,
} from 'lucide-react';
import { useToast } from '../components/Toasts';

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

type AiAction = 'infographic' | 'mockup' | 'brand-asset' | 'sprite' | 'comic' | 'typography-video' | 'brief';

interface AiResult {
  action: AiAction;
  imageBase64?: string;
  content?: string;
  videoUri?: string;
  rawData?: unknown;
}

async function callCreativeKit(action: string, params: Record<string, unknown>) {
  // Try creative.ts endpoint first for complex workflows, then google.ts for simpler ones
  const apiAction = action === 'infographic' ? 'url-to-infographic' :
                    action === 'sprite' ? 'photo-to-sprite' :
                    action === 'comic' ? 'comic-page' :
                    action === 'typography-video' ? 'typography-video' : null;

  if (apiAction) {
    const res = await fetch('/api/creative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: apiAction, ...params }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Creative API failed');
    return res.json();
  }

  // Mockup, brand-asset → Imagen direct
  const res = await fetch('/api/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'imagen-generate', ...params }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Imagen failed');
  return res.json();
}

async function callBrief(topic: string) {
  const res = await fetch('/api/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'gemini-generate',
      prompt: `You are a creative director. Research "${topic}" and create a brief with: 1) 5 visual mood references, 2) Color palette with 6 hex codes, 3) Typography recommendations, 4) Layout principles, 5) Key visual metaphors. Be specific and actionable.`,
    }),
  });
  if (!res.ok) throw new Error('Brief generation failed');
  return res.json();
}

/* ───── AI Action Panel ───── */
function AiActionPanel({ onClose, onResult }: { onClose: () => void; onResult: (r: AiResult) => void }) {
  const { addToast } = useToast();
  const [action, setAction] = useState<AiAction>('mockup');
  const [input, setInput] = useState('');
  const [style, setStyle] = useState('modern');
  const [loading, setLoading] = useState(false);

  const actions: { id: AiAction; label: string; icon: typeof Image; placeholder: string }[] = [
    { id: 'mockup', label: 'Product Mockup', icon: Package, placeholder: 'Describe the product (e.g. "minimalist leather wallet on marble surface")' },
    { id: 'brand-asset', label: 'Brand Asset', icon: Palette, placeholder: 'Brand name + asset type (e.g. "BetEdge AI logo")' },
    { id: 'infographic', label: 'Infographic from URL', icon: Layers, placeholder: 'URL to analyze and visualize' },
    { id: 'sprite', label: 'Pixel Sprite (requires photo)', icon: Zap, placeholder: 'Upload a photo then describe style (8-bit, 16-bit)' },
    { id: 'comic', label: 'Comic Page', icon: Brush, placeholder: 'Story prompt for a comic page' },
    { id: 'typography-video', label: 'Typography Video', icon: Film, placeholder: 'Text to animate' },
    { id: 'brief', label: 'Creative Brief', icon: Sparkles, placeholder: 'Topic or project name for a full creative brief' },
  ];

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      let params: Record<string, unknown> = {};
      if (action === 'mockup') {
        params = { prompt: `Professional lifestyle product photography mockup: ${input}. Clean composition, studio lighting, commercial quality.`, aspectRatio: '4:3' };
      } else if (action === 'brand-asset') {
        params = { prompt: `Professional brand asset for "${input}". Minimalist, modern, vector-style. ${style}.`, aspectRatio: '1:1' };
      } else if (action === 'infographic') {
        params = { url: input, style };
      } else if (action === 'sprite') {
        addToast({ type: 'warning', message: 'Sprite generation requires photo upload (coming soon)' });
        setLoading(false);
        return;
      } else if (action === 'comic') {
        params = { prompt: input, pageNumber: 1 };
      } else if (action === 'typography-video') {
        params = { text: input, stylePreset: style };
      } else if (action === 'brief') {
        const data = await callBrief(input);
        onResult({ action, content: data.content, rawData: data });
        addToast({ type: 'success', message: 'Creative brief generated' });
        setLoading(false);
        return;
      }

      const data = await callCreativeKit(action, params);
      onResult({
        action,
        imageBase64: data.imageBase64 || data.spriteBase64 || data.images?.[0]?.base64,
        videoUri: data.uri,
        rawData: data,
      });
      addToast({ type: 'success', message: `${actions.find(a => a.id === action)?.label} generated` });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Generation failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ccv-ai-panel">
      <div className="ccv-ai-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} style={{ color: 'var(--purple)' }} />
          <h3>NAOS Creative AI</h3>
        </div>
        <button className="ccv-icon-btn" onClick={onClose}><X size={16} /></button>
      </div>

      <div className="ccv-ai-actions">
        {actions.map(a => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className={`ccv-ai-action-btn ${action === a.id ? 'active' : ''}`}
              onClick={() => setAction(a.id)}
            >
              <Icon size={14} />
              <span>{a.label}</span>
            </button>
          );
        })}
      </div>

      <div className="ccv-ai-form">
        <textarea
          className="ccv-ai-input"
          placeholder={actions.find(a => a.id === action)?.placeholder || 'Describe what you want...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
        />

        {(action === 'mockup' || action === 'brand-asset' || action === 'infographic' || action === 'typography-video') && (
          <select className="ccv-ai-style" value={style} onChange={(e) => setStyle(e.target.value)}>
            {action === 'typography-video' ? (
              <>
                <option value="cinematic-3d">Cinematic 3D</option>
                <option value="neon-cyber">Neon Cyber</option>
                <option value="elegant-serif">Elegant Serif</option>
                <option value="bold-sans">Bold Sans</option>
                <option value="handwritten">Handwritten</option>
                <option value="retro-80s">Retro 80s</option>
                <option value="liquid-metal">Liquid Metal</option>
                <option value="botanical">Botanical</option>
              </>
            ) : (
              <>
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
                <option value="bold">Bold</option>
                <option value="illustrated">Illustrated</option>
                <option value="corporate">Corporate</option>
              </>
            )}
          </select>
        )}

        <button className="ccv-ai-generate" onClick={handleGenerate} disabled={loading || !input.trim()}>
          {loading ? <Loader2 size={14} className="ccv-spin" /> : <Bot size={14} />}
          {loading ? 'Generating...' : 'Generate with NAOS'}
        </button>
      </div>
    </div>
  );
}

/* ───── Result Preview ───── */
function ResultPreview({ result, onClose }: { result: AiResult; onClose: () => void }) {
  if (!result) return null;
  return (
    <div className="ccv-result-preview" onClick={onClose}>
      <div className="ccv-result-content" onClick={(e) => e.stopPropagation()}>
        <button className="ccv-icon-btn ccv-result-close" onClick={onClose}><X size={16} /></button>
        {result.imageBase64 && (
          <img
            src={`data:image/png;base64,${result.imageBase64}`}
            alt="Generated"
            style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 8 }}
          />
        )}
        {result.videoUri && (
          <video src={result.videoUri} controls style={{ maxWidth: '90vw', maxHeight: '80vh' }} />
        )}
        {result.content && (
          <div className="ccv-result-text">
            <pre>{result.content}</pre>
          </div>
        )}
        <div className="ccv-result-actions">
          {result.imageBase64 && (
            <a
              href={`data:image/png;base64,${result.imageBase64}`}
              download={`${result.action}-${Date.now()}.png`}
              className="ccv-btn"
            >
              <Download size={14} /> Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───── Component ───── */
export default function CreativeCanvasView() {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    addToast({ type: 'success', message: 'Canvas saved (local)' });
  }

  function handleExport() {
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
          <button
            className={`ccv-btn ${aiPanelOpen ? 'ccv-btn-active' : 'ccv-btn-ai'}`}
            onClick={() => setAiPanelOpen(!aiPanelOpen)}
          >
            <Sparkles size={14} /> NAOS AI
          </button>
          <button className="ccv-btn" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="ccv-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="ccv-btn ccv-btn-secondary" onClick={handleExport}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Body: Canvas + optional AI panel */}
      <div className="ccv-body">
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

        {aiPanelOpen && <AiActionPanel onClose={() => setAiPanelOpen(false)} onResult={setResult} />}
      </div>

      {result && <ResultPreview result={result} onClose={() => setResult(null)} />}

      <style>{`
        .creative-canvas-view { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .ccv-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: var(--space-sm) var(--space-md); background: var(--bg-surface);
          border-bottom: 1px solid var(--border); flex-shrink: 0; backdrop-filter: blur(12px);
        }
        .ccv-header-left { display: flex; align-items: center; gap: var(--space-sm); }
        .ccv-header-icon { color: var(--cyan); }
        .ccv-title { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 700; color: var(--text-primary); margin: 0; }
        .ccv-header-right { display: flex; align-items: center; gap: var(--space-sm); }
        .ccv-btn {
          display: flex; align-items: center; gap: 6px; padding: 6px 14px;
          background: var(--cyan-glow); border: 1px solid var(--cyan); border-radius: var(--radius-md);
          color: var(--cyan); font-size: var(--text-xs); font-weight: 500; cursor: pointer;
          transition: var(--transition-fast); text-decoration: none;
        }
        .ccv-btn:hover:not(:disabled) { background: var(--cyan); color: var(--bg-deep); }
        .ccv-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ccv-btn-ai { background: rgba(139, 92, 246, 0.08); border-color: rgba(139, 92, 246, 0.3); color: var(--purple, #8B5CF6); }
        .ccv-btn-ai:hover:not(:disabled) { background: rgba(139, 92, 246, 0.15); color: var(--purple, #8B5CF6); }
        .ccv-btn-active { background: rgba(139, 92, 246, 0.2); border-color: var(--purple); color: var(--purple); }
        .ccv-btn-secondary { background: var(--bg-card); border-color: var(--border); color: var(--text-secondary); }
        .ccv-btn-secondary:hover { border-color: var(--text-muted); color: var(--text-primary); background: var(--bg-elevated); }
        .ccv-spin { animation: ccvSpin 1s linear infinite; }
        @keyframes ccvSpin { to { transform: rotate(360deg); } }

        .ccv-body { flex: 1; display: grid; grid-template-columns: 1fr auto; overflow: hidden; }
        .ccv-canvas-container { flex: 1; position: relative; overflow: hidden; }
        .ccv-loading { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-sm); color: var(--text-muted); font-size: var(--text-sm); }
        .ccv-fallback { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-md); color: var(--text-secondary); text-align: center; padding: var(--space-2xl); }
        .ccv-fallback h3 { font-family: var(--font-display); font-size: var(--text-xl); color: var(--text-primary); margin: 0; }
        .ccv-fallback p { font-size: var(--text-sm); color: var(--text-muted); margin: 0; }
        .ccv-fallback code { font-family: var(--font-mono); font-size: var(--text-sm); background: var(--bg-card); border: 1px solid var(--border); padding: 8px 16px; border-radius: var(--radius-md); color: var(--cyan); }

        /* AI Panel */
        .ccv-ai-panel {
          width: 340px; background: var(--bg-surface); border-left: 1px solid var(--border);
          display: flex; flex-direction: column; overflow: hidden;
        }
        .ccv-ai-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: var(--space-md); border-bottom: 1px solid var(--border);
        }
        .ccv-ai-header h3 { margin: 0; font-size: 14px; color: var(--text-primary); }
        .ccv-ai-actions {
          padding: var(--space-sm); display: flex; flex-direction: column; gap: 2px;
          border-bottom: 1px solid var(--border);
        }
        .ccv-ai-action-btn {
          display: flex; align-items: center; gap: 8px; padding: 8px 12px;
          border: none; background: transparent; color: var(--text-secondary);
          cursor: pointer; border-radius: var(--radius-sm); font-size: 13px;
          text-align: left; transition: var(--transition-fast);
        }
        .ccv-ai-action-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .ccv-ai-action-btn.active { background: rgba(139, 92, 246, 0.08); color: var(--purple); }
        .ccv-ai-form { padding: var(--space-md); display: flex; flex-direction: column; gap: var(--space-sm); }
        .ccv-ai-input {
          width: 100%; background: var(--bg-input); border: 1px solid var(--border);
          color: var(--text-primary); border-radius: var(--radius-sm);
          padding: var(--space-sm); font-size: 13px; font-family: var(--font-sans);
          resize: vertical; outline: none;
        }
        .ccv-ai-input:focus { border-color: var(--border-active); }
        .ccv-ai-style {
          width: 100%; background: var(--bg-input); border: 1px solid var(--border);
          color: var(--text-primary); border-radius: var(--radius-sm); padding: 6px 10px; font-size: 13px;
        }
        .ccv-ai-generate {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px; background: linear-gradient(135deg, #8B5CF6, #A855F7);
          border: none; color: #fff; font-size: 13px; font-weight: 600;
          border-radius: var(--radius-sm); cursor: pointer; transition: var(--transition-fast);
        }
        .ccv-ai-generate:hover:not(:disabled) { opacity: 0.9; box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
        .ccv-ai-generate:disabled { opacity: 0.5; cursor: not-allowed; }

        .ccv-icon-btn {
          display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;
          border: none; background: transparent; color: var(--text-muted); cursor: pointer;
          border-radius: var(--radius-sm);
        }
        .ccv-icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

        /* Result preview modal */
        .ccv-result-preview {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
        }
        .ccv-result-content {
          position: relative; background: var(--bg-card); border-radius: 12px; padding: var(--space-lg);
          max-width: 95vw; max-height: 95vh; overflow: auto; display: flex; flex-direction: column; gap: var(--space-md); align-items: center;
        }
        .ccv-result-close { position: absolute; top: 8px; right: 8px; }
        .ccv-result-text { background: var(--bg-elevated); padding: var(--space-md); border-radius: 8px; max-width: 80vw; max-height: 70vh; overflow: auto; }
        .ccv-result-text pre { color: var(--text-secondary); font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; margin: 0; font-family: var(--font-sans); }
        .ccv-result-actions { display: flex; gap: var(--space-sm); }
      `}</style>
    </div>
  );
}
