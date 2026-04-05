import { useState, useRef, useCallback } from 'react';
import { Package, Upload, Loader2, Download, Move, ZoomIn, Trash2 } from 'lucide-react';

/* ───── Types ───── */
interface UploadedItem {
  id: string;
  type: 'product' | 'logo';
  file: File;
  previewUrl: string;
  x: number;
  y: number;
  scale: number;
}

/* ───── Component ───── */
export default function ProductMockupCanvas() {
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [bgPrompt, setBgPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | null, type: 'product' | 'logo') => {
    if (!files) return;
    const newItems: UploadedItem[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      type,
      file,
      previewUrl: URL.createObjectURL(file),
      x: 50,
      y: 50,
      scale: type === 'logo' ? 0.3 : 1,
    }));
    setItems(prev => [...prev, ...newItems]);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    addFiles(e.dataTransfer.files, 'product');
  }

  function handleCanvasMouseDown(itemId: string, e: React.MouseEvent) {
    e.preventDefault();
    setDragTarget(itemId);
    setSelectedItem(itemId);
  }

  function handleCanvasMouseMove(e: React.MouseEvent) {
    if (!dragTarget || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setItems(prev => prev.map(item =>
      item.id === dragTarget ? { ...item, x, y } : item
    ));
  }

  function handleCanvasMouseUp() {
    setDragTarget(null);
  }

  function updateScale(id: string, scale: number) {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, scale } : item
    ));
  }

  function removeItem(id: string) {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.id !== id);
    });
    if (selectedItem === id) setSelectedItem(null);
  }

  async function handleGenerate() {
    if (items.length === 0) return;
    setLoading(true);
    setError('');
    setResultUrl('');

    const formData = new FormData();
    formData.append('action', 'mockup');
    formData.append('backgroundPrompt', bgPrompt);
    formData.append('positions', JSON.stringify(
      items.map(({ id, type, x, y, scale }) => ({ id, type, x, y, scale }))
    ));
    items.forEach((item, i) => {
      formData.append(`file_${i}`, item.file);
      formData.append(`file_${i}_type`, item.type);
    });

    try {
      const res = await fetch('/api/imagen-edit', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mockup generation failed');
      setResultUrl(data.imageUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const productCount = items.filter(i => i.type === 'product').length;
  const logoCount = items.filter(i => i.type === 'logo').length;
  const selected = items.find(i => i.id === selectedItem);

  return (
    <div className="mockup-canvas">
      <div className="mc-header">
        <Package size={22} className="mc-header-icon" />
        <div>
          <h2 className="mc-title">Product Mockup Canvas</h2>
          <p className="mc-subtitle">Composite product shots with AI backgrounds</p>
        </div>
      </div>

      <div className="mc-layout">
        {/* Left: Upload + Controls */}
        <div className="mc-sidebar">
          {/* Product upload */}
          <div
            className="mc-dropzone"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={20} />
            <span>Drop product image or click</span>
            <span className="mc-dropzone-count">{productCount} uploaded</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={e => addFiles(e.target.files, 'product')}
            />
          </div>

          {/* Logo upload */}
          <div
            className="mc-dropzone mc-dropzone-logo"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files, 'logo'); }}
            onClick={() => logoInputRef.current?.click()}
          >
            <Upload size={18} />
            <span>Drop logos or click</span>
            <span className="mc-dropzone-count">{logoCount} logos</span>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={e => addFiles(e.target.files, 'logo')}
            />
          </div>

          {/* Background prompt */}
          <div className="mc-field">
            <label className="mc-label">Background Scene</label>
            <textarea
              className="mc-textarea"
              rows={3}
              placeholder="e.g. Modern marble countertop with soft studio lighting, bokeh background"
              value={bgPrompt}
              onChange={e => setBgPrompt(e.target.value)}
            />
          </div>

          {/* Selected item controls */}
          {selected && (
            <div className="mc-item-controls">
              <div className="mc-item-header">
                <span className="mc-item-type">{selected.type}</span>
                <button className="mc-remove-btn" onClick={() => removeItem(selected.id)}>
                  <Trash2 size={12} /> Remove
                </button>
              </div>
              <label className="mc-label">
                <ZoomIn size={12} /> Scale: {Math.round(selected.scale * 100)}%
              </label>
              <input
                type="range"
                className="mc-slider"
                min={10}
                max={200}
                value={selected.scale * 100}
                onChange={e => updateScale(selected.id, Number(e.target.value) / 100)}
              />
              <p className="mc-pos-label">
                <Move size={12} /> Position: {Math.round(selected.x)}%, {Math.round(selected.y)}%
              </p>
            </div>
          )}

          {/* Generate */}
          <button className="mc-generate" onClick={handleGenerate} disabled={loading || items.length === 0}>
            {loading ? <Loader2 size={16} className="mc-spin" /> : <Package size={16} />}
            {loading ? 'Compositing...' : 'Generate Mockup'}
          </button>
        </div>

        {/* Right: Canvas */}
        <div className="mc-canvas-area">
          <div
            ref={canvasRef}
            className="mc-canvas"
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            {items.length === 0 && (
              <div className="mc-canvas-empty">
                <Package size={32} />
                <p>Upload images to position them on canvas</p>
              </div>
            )}
            {items.map(item => (
              <div
                key={item.id}
                className={`mc-canvas-item ${selectedItem === item.id ? 'selected' : ''} ${item.type === 'logo' ? 'logo' : ''}`}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: `translate(-50%, -50%) scale(${item.scale})`,
                }}
                onMouseDown={e => handleCanvasMouseDown(item.id, e)}
              >
                <img src={item.previewUrl} alt={item.type} draggable={false} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <div className="mc-error">{error}</div>}

      {/* Result */}
      {resultUrl && (
        <div className="mc-result">
          <img src={resultUrl} alt="Generated mockup" className="mc-result-img" />
          <a href={resultUrl} download className="mc-download">
            <Download size={14} /> Download Mockup
          </a>
        </div>
      )}

      <style>{`
        .mockup-canvas {
          height: 100%;
          overflow-y: auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }
        .mc-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        .mc-header-icon { color: var(--purple); }
        .mc-title {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .mc-subtitle {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .mc-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: var(--space-lg);
          flex: 1;
          min-height: 0;
        }
        .mc-sidebar {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .mc-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: var(--space-lg);
          background: var(--bg-card);
          border: 2px dashed var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition-fast);
          color: var(--text-secondary);
          font-size: var(--text-xs);
        }
        .mc-dropzone:hover {
          border-color: var(--cyan);
          background: var(--cyan-glow);
        }
        .mc-dropzone-logo:hover { border-color: var(--purple); background: var(--purple-glow); }
        .mc-dropzone-count {
          font-size: 10px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .mc-field { display: flex; flex-direction: column; gap: var(--space-xs); }
        .mc-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .mc-textarea {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-family: var(--font-sans);
          resize: vertical;
        }
        .mc-textarea:focus {
          outline: none;
          border-color: var(--cyan);
          box-shadow: 0 0 0 3px var(--cyan-glow);
        }
        .mc-textarea::placeholder { color: var(--text-muted); }
        .mc-item-controls {
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
        .mc-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mc-item-type {
          font-size: var(--text-xs);
          color: var(--cyan);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.08em;
        }
        .mc-remove-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: var(--error);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
        }
        .mc-remove-btn:hover { background: rgba(239, 68, 68, 0.1); }
        .mc-slider {
          width: 100%;
          accent-color: var(--cyan);
        }
        .mc-pos-label {
          font-size: 10px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0;
        }
        .mc-generate {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          padding: 12px;
          background: linear-gradient(135deg, var(--purple-dim), var(--cyan-dim));
          border: none;
          border-radius: var(--radius-md);
          color: #fff;
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .mc-generate:hover:not(:disabled) {
          filter: brightness(1.15);
          box-shadow: 0 0 20px var(--purple-glow);
        }
        .mc-generate:disabled { opacity: 0.5; cursor: not-allowed; }
        .mc-spin { animation: mcSpin 1s linear infinite; }
        @keyframes mcSpin { to { transform: rotate(360deg); } }
        .mc-canvas-area {
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }
        .mc-canvas {
          flex: 1;
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          background-image:
            linear-gradient(45deg, var(--bg-surface) 25%, transparent 25%),
            linear-gradient(-45deg, var(--bg-surface) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, var(--bg-surface) 75%),
            linear-gradient(-45deg, transparent 75%, var(--bg-surface) 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0;
          cursor: default;
          user-select: none;
        }
        .mc-canvas-empty {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          color: var(--text-muted);
          font-size: var(--text-sm);
        }
        .mc-canvas-item {
          position: absolute;
          cursor: grab;
          transition: box-shadow 0.15s;
        }
        .mc-canvas-item:active { cursor: grabbing; }
        .mc-canvas-item img {
          max-width: 160px;
          max-height: 160px;
          pointer-events: none;
          border-radius: var(--radius-sm);
        }
        .mc-canvas-item.logo img {
          max-width: 80px;
          max-height: 80px;
        }
        .mc-canvas-item.selected {
          outline: 2px solid var(--cyan);
          outline-offset: 4px;
          border-radius: var(--radius-sm);
        }
        .mc-error {
          padding: var(--space-md);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: var(--error);
          font-size: var(--text-sm);
        }
        .mc-result {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .mc-result-img {
          width: 100%;
          display: block;
        }
        .mc-download {
          position: absolute;
          top: var(--space-md);
          right: var(--space-md);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: var(--text-xs);
          text-decoration: none;
          transition: var(--transition-fast);
        }
        .mc-download:hover {
          background: var(--cyan-glow);
          border-color: var(--cyan);
        }

        @media (max-width: 768px) {
          .mc-layout { grid-template-columns: 1fr; }
          .mc-canvas-area { min-height: 300px; }
        }
      `}</style>
    </div>
  );
}
