import { useState, useRef } from 'react';
import { Gamepad2, Upload, Loader2, Download, Sparkles } from 'lucide-react';

/* ───── Constants ───── */
const SPRITE_STYLES = [
  { id: '8-bit', label: '8-Bit', desc: 'Classic NES era' },
  { id: 'pixel-art', label: 'Pixel Art', desc: 'Modern retro' },
  { id: '16-bit', label: '16-Bit', desc: 'SNES / Genesis' },
] as const;

/* ───── Component ───── */
export default function ArcadeGameCanvas() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [spriteStyle, setSpriteStyle] = useState<string>('8-bit');
  const [loading, setLoading] = useState(false);
  const [spriteUrl, setSpriteUrl] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setPhotoFile(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
    setSpriteUrl('');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }

  async function handleGenerate() {
    if (!photoFile) return;
    setLoading(true);
    setError('');
    setSpriteUrl('');

    const formData = new FormData();
    formData.append('action', 'photo-to-sprite');
    formData.append('style', spriteStyle);
    formData.append('photo', photoFile);

    try {
      const res = await fetch('/api/creative', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sprite generation failed');
      setSpriteUrl(data.spriteUrl);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="arcade-canvas">
      <div className="ac-header">
        <Gamepad2 size={22} className="ac-header-icon" />
        <div>
          <h2 className="ac-title">Arcade Sprite Studio</h2>
          <p className="ac-subtitle">Photo to retro sprite conversion</p>
        </div>
      </div>

      <div className="ac-content">
        {/* Upload area */}
        <div
          className="ac-upload"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Uploaded photo" className="ac-preview-img" />
          ) : (
            <div className="ac-upload-empty">
              <Upload size={32} />
              <p>Drop a photo or click to upload</p>
              <span className="ac-upload-hint">Portraits and character poses work best</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={e => handleFileSelect(e.target.files)}
          />
        </div>

        {/* Style selector */}
        <div className="ac-styles">
          <label className="ac-label">Sprite Style</label>
          <div className="ac-style-grid">
            {SPRITE_STYLES.map(s => (
              <button
                key={s.id}
                className={`ac-style-card ${spriteStyle === s.id ? 'active' : ''}`}
                onClick={() => setSpriteStyle(s.id)}
              >
                <span className="ac-style-label">{s.label}</span>
                <span className="ac-style-desc">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button className="ac-generate" onClick={handleGenerate} disabled={loading || !photoFile}>
          {loading ? <Loader2 size={16} className="ac-spin" /> : <Sparkles size={16} />}
          {loading ? 'Pixelating...' : 'Generate Sprite'}
        </button>

        {/* Error */}
        {error && <div className="ac-error">{error}</div>}

        {/* Result with CRT aesthetic */}
        {spriteUrl && (
          <div className="ac-result">
            <div className="ac-crt">
              <div className="ac-crt-screen">
                <img src={spriteUrl} alt="Generated sprite" className="ac-sprite-img" />
                <div className="ac-scanlines" />
              </div>
              <div className="ac-crt-bezel">
                <span className="ac-crt-brand">MCV ARCADE</span>
                <div className="ac-crt-led" />
              </div>
            </div>
            <a href={spriteUrl} download className="ac-download">
              <Download size={14} /> Download Sprite
            </a>
          </div>
        )}
      </div>

      <style>{`
        .arcade-canvas {
          height: 100%;
          overflow-y: auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }
        .ac-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        .ac-header-icon { color: #F59E0B; }
        .ac-title {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .ac-subtitle {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .ac-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          max-width: 600px;
        }
        .ac-upload {
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          transition: var(--transition-fast);
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-card);
        }
        .ac-upload:hover {
          border-color: var(--cyan);
          background: var(--cyan-glow);
        }
        .ac-upload-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
          color: var(--text-secondary);
          padding: var(--space-xl);
        }
        .ac-upload-empty p {
          margin: 0;
          font-size: var(--text-sm);
        }
        .ac-upload-hint {
          font-size: 10px;
          color: var(--text-muted);
        }
        .ac-preview-img {
          width: 100%;
          max-height: 300px;
          object-fit: contain;
          display: block;
        }
        .ac-styles { display: flex; flex-direction: column; gap: var(--space-sm); }
        .ac-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ac-style-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-sm);
        }
        .ac-style-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: var(--space-md);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .ac-style-card:hover {
          border-color: var(--gold);
          background: rgba(245, 158, 11, 0.05);
        }
        .ac-style-card.active {
          border-color: var(--gold);
          background: rgba(245, 158, 11, 0.1);
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.15);
        }
        .ac-style-label {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
        }
        .ac-style-desc {
          font-size: 10px;
          color: var(--text-muted);
        }
        .ac-generate {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          padding: 12px;
          background: linear-gradient(135deg, #F59E0B, #EF4444);
          border: none;
          border-radius: var(--radius-md);
          color: #fff;
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .ac-generate:hover:not(:disabled) {
          filter: brightness(1.15);
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
        }
        .ac-generate:disabled { opacity: 0.5; cursor: not-allowed; }
        .ac-spin { animation: acSpin 1s linear infinite; }
        @keyframes acSpin { to { transform: rotate(360deg); } }
        .ac-error {
          padding: var(--space-md);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: var(--error);
          font-size: var(--text-sm);
        }
        .ac-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }
        .ac-crt {
          background: #1a1a1a;
          border-radius: 20px;
          padding: 20px;
          box-shadow:
            0 0 30px rgba(0, 0, 0, 0.5),
            inset 0 0 60px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 400px;
        }
        .ac-crt-screen {
          position: relative;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          border: 3px solid #333;
          box-shadow: inset 0 0 40px rgba(0, 240, 255, 0.05);
        }
        .ac-sprite-img {
          width: 100%;
          display: block;
          image-rendering: pixelated;
        }
        .ac-scanlines {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.15) 2px,
            rgba(0, 0, 0, 0.15) 4px
          );
          pointer-events: none;
        }
        .ac-crt-bezel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px 0;
        }
        .ac-crt-brand {
          font-family: var(--font-display);
          font-size: 11px;
          color: #555;
          letter-spacing: 3px;
          font-weight: 700;
        }
        .ac-crt-led {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 6px #10B981;
        }
        .ac-download {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 20px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: var(--text-xs);
          text-decoration: none;
          transition: var(--transition-fast);
        }
        .ac-download:hover {
          border-color: var(--gold);
          color: var(--gold);
        }

        @media (max-width: 640px) {
          .ac-style-grid { grid-template-columns: 1fr; }
          .ac-crt { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
