import { useState, useCallback, useRef } from 'react';
import { Upload, Sparkles, Loader2, Image, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { fileToBase64 } from '../../lib/google/veo-client';
import type {
  GenerateVideoParams,
  VeoReferenceImage,
  VeoStatus,
} from '../../lib/google/veo-client';
import { VeoGenerationMode, VeoModel, VeoAspectRatio, VeoResolution } from '../../lib/google/veo-client';

interface CameoUploaderProps {
  onGenerate: (params: GenerateVideoParams) => Promise<unknown>;
  status: VeoStatus;
  error: string | null;
  onClearError: () => void;
}

interface AvatarSlot {
  id: string;
  file: File;
  preview: string;
  base64: string;
  mimeType: string;
  referenceType: 'ASSET' | 'STYLE';
}

export default function CameoUploader({ onGenerate, status, error, onClearError }: CameoUploaderProps) {
  const [avatars, setAvatars] = useState<AvatarSlot[]>([]);
  const [prompt, setPrompt] = useState('');
  const [referenceType, setReferenceType] = useState<'ASSET' | 'STYLE'>('ASSET');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = status !== 'idle' && status !== 'complete' && status !== 'error';

  const addAvatar = useCallback(async (file: File) => {
    const base64 = await fileToBase64(file);
    const preview = URL.createObjectURL(file);
    const slot: AvatarSlot = {
      id: `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      preview,
      base64,
      mimeType: file.type,
      referenceType,
    };
    setAvatars(prev => [...prev, slot]);
  }, [referenceType]);

  const removeAvatar = useCallback((id: string) => {
    setAvatars(prev => {
      const item = prev.find(a => a.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter(a => a.id !== id);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    files.forEach(addAvatar);
  }, [addAvatar]);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim() || avatars.length === 0 || busy) return;
    onClearError();

    const referenceImages: VeoReferenceImage[] = avatars.map(a => ({
      base64: a.base64,
      mimeType: a.mimeType,
      referenceType: a.referenceType,
    }));

    const params: GenerateVideoParams = {
      prompt: prompt.trim(),
      model: VeoModel.VEO,
      mode: VeoGenerationMode.REFERENCES_TO_VIDEO,
      aspectRatio: VeoAspectRatio.LANDSCAPE,
      resolution: VeoResolution.P720,
      referenceImages,
    };
    onGenerate(params);
  }, [prompt, avatars, busy, onGenerate, onClearError]);

  return (
    <div className="cameo-root">
      <p className="cameo-description">
        Upload photos of yourself or others to cast them in AI-generated video scenes.
        Use <strong>Asset</strong> for subject likeness or <strong>Style</strong> for visual styling.
      </p>

      {/* Reference type */}
      <div className="cameo-field">
        <label className="cameo-label">Reference Type</label>
        <div className="cameo-type-group">
          {(['ASSET', 'STYLE'] as const).map(t => (
            <button
              key={t}
              type="button"
              className={cn('cameo-type-btn', referenceType === t && 'cameo-type-active')}
              onClick={() => setReferenceType(t)}
              disabled={busy}
            >
              {t === 'ASSET' ? <Image size={14} /> : <Sparkles size={14} />}
              <span>{t === 'ASSET' ? 'Asset (Subject)' : 'Style (Visual)'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload area */}
      <div className="cameo-field">
        <label className="cameo-label">Photos</label>
        <div
          className={cn('cameo-drop-zone', dragOver && 'cameo-drop-active')}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={24} />
          <span>Drop images here or click to upload</span>
          <span className="cameo-drop-hint">PNG, JPG, WebP</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => {
            const files = Array.from(e.target.files || []);
            files.forEach(addAvatar);
            e.target.value = '';
          }}
        />
      </div>

      {/* Avatar previews */}
      {avatars.length > 0 && (
        <div className="cameo-avatars">
          {avatars.map(a => (
            <div key={a.id} className="cameo-avatar-card">
              <img src={a.preview} alt="Avatar" className="cameo-avatar-img" />
              <span className="cameo-avatar-type">{a.referenceType}</span>
              <button
                className="cameo-avatar-remove"
                onClick={() => removeAvatar(a.id)}
                title="Remove"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Prompt */}
      <div className="cameo-field">
        <label className="cameo-label">Scene Description</label>
        <textarea
          className="cameo-textarea"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the scene, e.g. 'Walking through a futuristic city at sunset...'"
          rows={3}
          disabled={busy}
        />
      </div>

      {/* Status / Error */}
      {(busy || error) && (
        <div className={cn('cameo-status', error && 'cameo-status-error')}>
          {busy && <Loader2 size={16} className="cameo-spinner" />}
          <span>{error || 'Generating your cameo video...'}</span>
        </div>
      )}

      {/* Submit */}
      <button
        className="cameo-submit"
        onClick={handleSubmit}
        disabled={busy || !prompt.trim() || avatars.length === 0}
      >
        {busy ? (
          <>
            <Loader2 size={18} className="cameo-spinner" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles size={18} />
            <span>Generate Cameo</span>
          </>
        )}
      </button>

      <style>{`
        .cameo-root {
          display: flex;
          flex-direction: column;
          gap: var(--space-md, 16px);
        }
        .cameo-description {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-secondary, #8b949e);
          line-height: 1.5;
        }
        .cameo-description strong {
          color: var(--cyan, #00f5ff);
        }
        .cameo-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .cameo-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary, #8b949e);
        }
        .cameo-type-group {
          display: flex;
          gap: 6px;
        }
        .cameo-type-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-sm, 6px);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          background: var(--bg-surface, #0d1117);
          color: var(--text-secondary, #8b949e);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .cameo-type-btn:hover:not(:disabled) {
          border-color: var(--cyan, #00f5ff);
          color: var(--text-primary, #e6edf3);
        }
        .cameo-type-active {
          border-color: var(--purple, #8b5cf6);
          background: rgba(139, 92, 246, 0.08);
          color: var(--purple, #8b5cf6);
        }
        .cameo-drop-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 140px;
          border: 2px dashed var(--border, rgba(255,255,255,0.12));
          border-radius: var(--radius-md, 12px);
          cursor: pointer;
          color: var(--text-secondary, #8b949e);
          font-size: 0.875rem;
          transition: border-color 0.15s, background 0.15s;
        }
        .cameo-drop-zone:hover,
        .cameo-drop-active {
          border-color: var(--cyan, #00f5ff);
          background: rgba(0, 245, 255, 0.04);
        }
        .cameo-drop-hint {
          font-size: 0.75rem;
          opacity: 0.6;
        }
        .cameo-avatars {
          display: flex;
          gap: var(--space-sm, 8px);
          flex-wrap: wrap;
        }
        .cameo-avatar-card {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: var(--radius-md, 12px);
          overflow: hidden;
          border: 2px solid var(--glass-border, rgba(255,255,255,0.08));
          transition: border-color 0.15s;
        }
        .cameo-avatar-card:hover {
          border-color: var(--cyan, #00f5ff);
        }
        .cameo-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cameo-avatar-type {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 2px 0;
          text-align: center;
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          background: rgba(0, 0, 0, 0.7);
          color: var(--purple, #8b5cf6);
        }
        .cameo-avatar-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: none;
          background: rgba(0, 0, 0, 0.7);
          color: var(--text-secondary, #8b949e);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .cameo-avatar-card:hover .cameo-avatar-remove {
          opacity: 1;
        }
        .cameo-avatar-remove:hover {
          color: #f85149;
        }
        .cameo-textarea {
          width: 100%;
          padding: var(--space-sm, 8px) var(--space-md, 16px);
          background: var(--bg-surface, #0d1117);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: var(--radius-md, 12px);
          color: var(--text-primary, #e6edf3);
          font-family: inherit;
          font-size: 0.875rem;
          resize: vertical;
          transition: border-color 0.15s;
        }
        .cameo-textarea:focus {
          outline: none;
          border-color: var(--cyan, #00f5ff);
        }
        .cameo-textarea::placeholder {
          color: var(--text-secondary, #8b949e);
        }
        .cameo-status {
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
        .cameo-status-error {
          background: rgba(248, 81, 73, 0.08);
          border-color: rgba(248, 81, 73, 0.2);
          color: #f85149;
        }
        .cameo-spinner {
          animation: cameo-spin 1s linear infinite;
        }
        @keyframes cameo-spin {
          to { transform: rotate(360deg); }
        }
        .cameo-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: var(--radius-md, 12px);
          border: none;
          background: linear-gradient(135deg, var(--purple, #8b5cf6), var(--cyan, #00f5ff));
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }
        .cameo-submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .cameo-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
