import { useState, useCallback, useRef } from 'react';
import { Sparkles, Upload, Image, Loader2, Film } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  VeoModel,
  VeoAspectRatio,
  VeoResolution,
  VeoGenerationMode,
  fileToBase64,
} from '../../lib/google/veo-client';
import type {
  GenerateVideoParams,
  VeoImageInput,
  VeoStatus,
} from '../../lib/google/veo-client';

interface VideoGeneratorProps {
  onGenerate: (params: GenerateVideoParams) => Promise<unknown>;
  status: VeoStatus;
  error: string | null;
  onClearError: () => void;
  /** Pre-filled prompt, e.g. from remix */
  initialPrompt?: string;
}

const MODE_OPTIONS = [
  { id: VeoGenerationMode.TEXT_TO_VIDEO, label: 'Text to Video', icon: Sparkles },
  { id: VeoGenerationMode.FRAMES_TO_VIDEO, label: 'Frames to Video', icon: Image },
  { id: VeoGenerationMode.REFERENCES_TO_VIDEO, label: 'References', icon: Film },
  { id: VeoGenerationMode.EXTEND_VIDEO, label: 'Extend Video', icon: Film },
] as const;

const MODEL_OPTIONS = [
  { id: VeoModel.VEO_FAST, label: 'Veo Fast' },
  { id: VeoModel.VEO, label: 'Veo' },
] as const;

const ASPECT_OPTIONS = [
  { id: VeoAspectRatio.LANDSCAPE, label: '16:9' },
  { id: VeoAspectRatio.PORTRAIT, label: '9:16' },
] as const;

const RESOLUTION_OPTIONS = [
  { id: VeoResolution.P720, label: '720p' },
  { id: VeoResolution.P1080, label: '1080p' },
  { id: VeoResolution.P4K, label: '4K' },
] as const;

const STATUS_MESSAGES: Record<VeoStatus, string> = {
  idle: '',
  submitting: 'Submitting request...',
  polling: 'Generating video (this may take a minute)...',
  downloading: 'Downloading video...',
  complete: 'Video ready!',
  error: 'Generation failed.',
};

export default function VideoGenerator({
  onGenerate, status, error, onClearError, initialPrompt = '',
}: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [mode, setMode] = useState<VeoGenerationMode>(VeoGenerationMode.TEXT_TO_VIDEO);
  const [model, setModel] = useState<VeoModel>(VeoModel.VEO_FAST);
  const [aspectRatio, setAspectRatio] = useState<VeoAspectRatio>(VeoAspectRatio.LANDSCAPE);
  const [resolution, setResolution] = useState<VeoResolution>(VeoResolution.P720);
  const [isLooping, setIsLooping] = useState(false);
  const [startFrame, setStartFrame] = useState<VeoImageInput | null>(null);
  const [endFrame, setEndFrame] = useState<VeoImageInput | null>(null);
  const [startPreview, setStartPreview] = useState<string | null>(null);
  const [endPreview, setEndPreview] = useState<string | null>(null);

  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  const busy = status !== 'idle' && status !== 'complete' && status !== 'error';

  // Update prompt when initialPrompt changes (remix)
  if (initialPrompt && initialPrompt !== prompt && status === 'idle') {
    setPrompt(initialPrompt);
  }

  const handleFileUpload = useCallback(async (
    file: File,
    setter: (v: VeoImageInput | null) => void,
    previewSetter: (v: string | null) => void,
  ) => {
    const base64 = await fileToBase64(file);
    setter({ base64, mimeType: file.type });
    previewSetter(URL.createObjectURL(file));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim() || busy) return;
    onClearError();
    const params: GenerateVideoParams = {
      prompt: prompt.trim(),
      model,
      mode,
      aspectRatio,
      resolution,
      isLooping,
      startFrame: mode === VeoGenerationMode.FRAMES_TO_VIDEO ? startFrame : null,
      endFrame: mode === VeoGenerationMode.FRAMES_TO_VIDEO ? endFrame : null,
    };
    onGenerate(params);
  }, [prompt, model, mode, aspectRatio, resolution, isLooping, startFrame, endFrame, busy, onGenerate, onClearError]);

  return (
    <div className="vgen-root">
      {/* Prompt */}
      <div className="vgen-field">
        <label className="vgen-label">Prompt</label>
        <textarea
          className="vgen-textarea"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe the video you want to create..."
          rows={4}
          disabled={busy}
        />
      </div>

      {/* Mode selector */}
      <div className="vgen-field">
        <label className="vgen-label">Mode</label>
        <div className="vgen-radio-group">
          {MODE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                className={cn('vgen-radio-btn', mode === opt.id && 'vgen-radio-active')}
                onClick={() => setMode(opt.id)}
                disabled={busy}
                type="button"
              >
                <Icon size={14} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model / Aspect / Resolution row */}
      <div className="vgen-row">
        <div className="vgen-field vgen-field-grow">
          <label className="vgen-label">Model</label>
          <div className="vgen-radio-group">
            {MODEL_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={cn('vgen-radio-btn', model === opt.id && 'vgen-radio-active')}
                onClick={() => setModel(opt.id)}
                disabled={busy}
                type="button"
              >{opt.label}</button>
            ))}
          </div>
        </div>
        <div className="vgen-field vgen-field-grow">
          <label className="vgen-label">Aspect</label>
          <div className="vgen-radio-group">
            {ASPECT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={cn('vgen-radio-btn', aspectRatio === opt.id && 'vgen-radio-active')}
                onClick={() => setAspectRatio(opt.id)}
                disabled={busy}
                type="button"
              >{opt.label}</button>
            ))}
          </div>
        </div>
        <div className="vgen-field vgen-field-grow">
          <label className="vgen-label">Resolution</label>
          <div className="vgen-radio-group">
            {RESOLUTION_OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={cn('vgen-radio-btn', resolution === opt.id && 'vgen-radio-active')}
                onClick={() => setResolution(opt.id)}
                disabled={busy}
                type="button"
              >{opt.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Frames upload (frames-to-video) */}
      {mode === VeoGenerationMode.FRAMES_TO_VIDEO && (
        <div className="vgen-row">
          <div className="vgen-field vgen-field-grow">
            <label className="vgen-label">Start Frame</label>
            <div
              className={cn('vgen-upload-zone', startPreview && 'vgen-upload-has-file')}
              onClick={() => startRef.current?.click()}
            >
              {startPreview ? (
                <img src={startPreview} className="vgen-upload-preview" alt="Start frame" />
              ) : (
                <>
                  <Upload size={20} />
                  <span>Upload image</span>
                </>
              )}
            </div>
            <input
              ref={startRef}
              type="file"
              accept="image/*"
              hidden
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f, setStartFrame, setStartPreview);
              }}
            />
          </div>
          <div className="vgen-field vgen-field-grow">
            <label className="vgen-label">End Frame</label>
            <div
              className={cn('vgen-upload-zone', endPreview && 'vgen-upload-has-file')}
              onClick={() => endRef.current?.click()}
            >
              {endPreview ? (
                <img src={endPreview} className="vgen-upload-preview" alt="End frame" />
              ) : (
                <>
                  <Upload size={20} />
                  <span>Upload image</span>
                </>
              )}
            </div>
            <input
              ref={endRef}
              type="file"
              accept="image/*"
              hidden
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f, setEndFrame, setEndPreview);
              }}
            />
          </div>
        </div>
      )}

      {/* Loop toggle */}
      <div className="vgen-field">
        <label className="vgen-toggle-label">
          <input
            type="checkbox"
            checked={isLooping}
            onChange={e => setIsLooping(e.target.checked)}
            disabled={busy}
            className="vgen-checkbox"
          />
          <span>Loop video</span>
        </label>
      </div>

      {/* Status / Error */}
      {(busy || error) && (
        <div className={cn('vgen-status', error && 'vgen-status-error')}>
          {busy && <Loader2 size={16} className="vgen-spinner" />}
          <span>{error || STATUS_MESSAGES[status]}</span>
        </div>
      )}

      {/* Generate button */}
      <button
        className="vgen-submit"
        onClick={handleSubmit}
        disabled={busy || !prompt.trim()}
      >
        {busy ? (
          <>
            <Loader2 size={18} className="vgen-spinner" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles size={18} />
            <span>Generate Video</span>
          </>
        )}
      </button>

      <style>{`
        .vgen-root {
          display: flex;
          flex-direction: column;
          gap: var(--space-md, 16px);
        }
        .vgen-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .vgen-field-grow { flex: 1; min-width: 0; }
        .vgen-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary, #8b949e);
        }
        .vgen-textarea {
          width: 100%;
          min-height: 100px;
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
        .vgen-textarea:focus {
          outline: none;
          border-color: var(--cyan, #00f5ff);
        }
        .vgen-textarea::placeholder {
          color: var(--text-secondary, #8b949e);
        }
        .vgen-row {
          display: flex;
          gap: var(--space-md, 16px);
          flex-wrap: wrap;
        }
        .vgen-radio-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .vgen-radio-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-sm, 6px);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          background: var(--bg-surface, #0d1117);
          color: var(--text-secondary, #8b949e);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .vgen-radio-btn:hover:not(:disabled) {
          border-color: var(--cyan, #00f5ff);
          color: var(--text-primary, #e6edf3);
        }
        .vgen-radio-active {
          border-color: var(--cyan, #00f5ff);
          background: rgba(0, 245, 255, 0.08);
          color: var(--cyan, #00f5ff);
        }
        .vgen-radio-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .vgen-upload-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 120px;
          border: 2px dashed var(--border, rgba(255,255,255,0.12));
          border-radius: var(--radius-md, 12px);
          cursor: pointer;
          color: var(--text-secondary, #8b949e);
          font-size: 0.8125rem;
          transition: border-color 0.15s, background 0.15s;
          overflow: hidden;
        }
        .vgen-upload-zone:hover {
          border-color: var(--cyan, #00f5ff);
          background: rgba(0, 245, 255, 0.04);
        }
        .vgen-upload-has-file {
          border-style: solid;
          padding: 0;
        }
        .vgen-upload-preview {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }
        .vgen-toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: var(--text-primary, #e6edf3);
          cursor: pointer;
        }
        .vgen-checkbox {
          accent-color: var(--cyan, #00f5ff);
          width: 16px;
          height: 16px;
        }
        .vgen-status {
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
        .vgen-status-error {
          background: rgba(248, 81, 73, 0.08);
          border-color: rgba(248, 81, 73, 0.2);
          color: #f85149;
        }
        .vgen-spinner {
          animation: vgen-spin 1s linear infinite;
        }
        @keyframes vgen-spin {
          to { transform: rotate(360deg); }
        }
        .vgen-submit {
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
        .vgen-submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .vgen-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        .vgen-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 640px) {
          .vgen-row { flex-direction: column; }
          .vgen-radio-group { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}
