// src/components/identity/SelfieCapture.tsx
//
// Single-frame selfie capture — Session 2 of the Onboarding + Demo Gate
// epic. Produces the `face-landmark` step-up signal the identity-sdk's
// trust engine consumes.
//
// Flow:
//   1. Request camera via getUserMedia({ video: { facingMode: 'user' }})
//   2. Show live preview in a <video>
//   3. On "Capture" click, snapshot to an offscreen canvas
//   4. POST /api/identity { action: 'upload-selfie', imageBase64 }
//   5. Server uploads to the private `identity-captures` bucket +
//      persists an identity_captures row + refreshes trust
//
// Provisional liveness defaults live server-side (see api/_handlers/
// identity.ts). The MediaPipe liveness integration is flagged EXPAND —
// the capture path is identical either way; the MediaPipe pass just
// computes real liveness + micro-expression variance before persisting.
//
// Media cleanup discipline: every branch that sets `streamRef.current`
// also has a corresponding stop call in the effect cleanup + on capture
// completion. Leaking camera tracks is a UX + privacy bug.

import { useCallback, useEffect, useRef, useState } from 'react';

type Phase =
  | { kind: 'idle' }
  | { kind: 'requesting' }
  | { kind: 'previewing' }
  | { kind: 'uploading' }
  | { kind: 'captured'; storagePath: string }
  | { kind: 'error'; message: string };

interface UploadResponse {
  captureId: string;
  storagePath: string;
  replacedPriorCapture: boolean;
  trust: {
    trustScore: number;
    trustBand: string;
  };
}

interface SelfieCaptureProps {
  /** Fires with the storage path after a successful upload. */
  onCaptured?: (storagePath: string) => void;
  alreadyCaptured?: boolean;
}

export default function SelfieCapture({ onCaptured, alreadyCaptured }: SelfieCaptureProps) {
  const [phase, setPhase] = useState<Phase>(
    alreadyCaptured ? { kind: 'captured', storagePath: '' } : { kind: 'idle' },
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Guarantee cleanup on unmount — never leak camera access.
  useEffect(() => stopStream, [stopStream]);

  async function startPreview() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPhase({ kind: 'error', message: 'This browser does not expose a camera API.' });
      return;
    }
    setPhase({ kind: 'requesting' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => { /* autoplay may be blocked; user can click play */ });
      }
      setPhase({ kind: 'previewing' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPhase({ kind: 'error', message });
    }
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      setPhase({ kind: 'error', message: 'Camera not ready yet — try again in a moment.' });
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setPhase({ kind: 'error', message: 'Could not acquire 2D canvas context.' });
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    stopStream();
    setPhase({ kind: 'uploading' });

    try {
      const res = await fetch('/api/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload-selfie', imageBase64: dataUrl }),
      });
      if (!res.ok) {
        const err = await safeErrorBody(res);
        throw new Error(err ?? `upload-selfie failed (${res.status})`);
      }
      const body = (await res.json()) as UploadResponse;
      setPhase({ kind: 'captured', storagePath: body.storagePath });
      onCaptured?.(body.storagePath);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPhase({ kind: 'error', message });
    }
  }

  function retake() {
    setPhase({ kind: 'idle' });
  }

  return (
    <div className="mcv-glass-card mcv-glass-neural" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Selfie capture
            </h3>
            <StatusBadge phase={phase} />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Face-landmark frame used for liveness verification. A single
            still — no continuous recording. Kept private and encrypted at
            rest.
          </p>
        </div>
        <PrimaryButton phase={phase} onStart={startPreview} onCapture={capture} onRetake={retake} />
      </div>

      {phase.kind === 'previewing' && (
        <div style={{ marginTop: 12, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#000' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {phase.kind === 'error' && (
        <div
          style={{
            marginTop: 12,
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.24)',
            color: 'var(--error)',
            fontSize: 11,
          }}
        >
          {phase.message}
        </div>
      )}
    </div>
  );
}

function PrimaryButton({
  phase, onStart, onCapture, onRetake,
}: {
  phase: Phase;
  onStart: () => void;
  onCapture: () => void;
  onRetake: () => void;
}) {
  if (phase.kind === 'idle' || phase.kind === 'error') {
    return (
      <button type="button" className="mcv-btn mcv-btn-md mcv-btn-primary" onClick={onStart}>
        {phase.kind === 'error' ? 'Try again' : 'Open camera'}
      </button>
    );
  }
  if (phase.kind === 'requesting') {
    return (
      <button type="button" className="mcv-btn mcv-btn-md mcv-btn-secondary mcv-btn-loading" disabled>
        <span className="mcv-btn-spinner" aria-hidden />
        Requesting…
      </button>
    );
  }
  if (phase.kind === 'previewing') {
    return (
      <button type="button" className="mcv-btn mcv-btn-md mcv-btn-primary" onClick={onCapture}>
        Capture
      </button>
    );
  }
  if (phase.kind === 'uploading') {
    return (
      <button type="button" className="mcv-btn mcv-btn-md mcv-btn-secondary mcv-btn-loading" disabled>
        <span className="mcv-btn-spinner" aria-hidden />
        Uploading…
      </button>
    );
  }
  // captured
  return (
    <button type="button" className="mcv-btn mcv-btn-md mcv-btn-secondary" onClick={onRetake}>
      Retake
    </button>
  );
}

function StatusBadge({ phase }: { phase: Phase }) {
  const { label, color } = (() => {
    switch (phase.kind) {
      case 'idle':
      case 'requesting': return { label: 'Not captured', color: 'var(--text-muted)' };
      case 'previewing': return { label: 'Preview', color: 'var(--cyan)' };
      case 'uploading':  return { label: 'Uploading', color: 'var(--cyan)' };
      case 'captured':   return { label: 'Captured', color: 'var(--success, #10b981)' };
      case 'error':      return { label: 'Error', color: 'var(--error)' };
    }
  })();
  return (
    <span
      className="mcv-badge mcv-badge-sm mcv-badge-outline"
      style={{ color, borderColor: color }}
    >
      {label}
    </span>
  );
}

async function safeErrorBody(res: Response): Promise<string | null> {
  try {
    const body = await res.json();
    return typeof body?.error === 'string' ? body.error : null;
  } catch {
    return null;
  }
}
