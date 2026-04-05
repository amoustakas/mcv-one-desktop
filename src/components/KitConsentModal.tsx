import { Shield, X, Check, Ban } from 'lucide-react';
import type { KitCapability, KitManifest } from '../lib/kits/types';
import { grantAllPermissions } from '../lib/kits/permissions';
import { Button } from './ui';

interface KitConsentModalProps {
  manifest: KitManifest;
  missingCapabilities: KitCapability[];
  onAllow: () => void;
  onDeny: () => void;
  onAllowOnce?: () => void;
}

const capabilityLabels: Record<KitCapability, { label: string; description: string }> = {
  network: {
    label: 'Network Access',
    description: 'Make HTTP requests to external APIs',
  },
  supabase: {
    label: 'Database Access',
    description: 'Read and write data in the application database',
  },
  storage: {
    label: 'File Storage',
    description: 'Upload and download files',
  },
  credentials: {
    label: 'API Credentials',
    description: 'Access external service credentials (tokens are never exposed to kit code)',
  },
  llm: {
    label: 'AI Model Access',
    description: 'Call LLM APIs (Claude, Gemini)',
  },
};

export default function KitConsentModal({
  manifest,
  missingCapabilities,
  onAllow,
  onDeny,
  onAllowOnce,
}: KitConsentModalProps) {
  function handleAllow() {
    grantAllPermissions(manifest.id, missingCapabilities);
    onAllow();
  }

  return (
    <div className="kcm-overlay">
      <div className="kcm-modal">
        <div className="kcm-header">
          <Shield size={18} />
          <h3>Kit Permission Request</h3>
          <Button variant="ghost" size="sm" className="kcm-close" onClick={onDeny}><X size={16} /></Button>
        </div>

        <div className="kcm-body">
          <p className="kcm-kit-name">
            <strong>{manifest.name}</strong> <span className="kcm-version">v{manifest.version}</span>
          </p>
          <p className="kcm-author">by {manifest.author}</p>

          <div className="kcm-caps">
            <p className="kcm-caps-label">This kit requests the following capabilities:</p>
            {missingCapabilities.map((cap) => {
              const info = capabilityLabels[cap];
              return (
                <div key={cap} className="kcm-cap-row">
                  <div className="kcm-cap-dot" />
                  <div>
                    <div className="kcm-cap-name">{info?.label || cap}</div>
                    <div className="kcm-cap-desc">{info?.description || ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="kcm-footer">
          <Button variant="ghost" size="sm" onClick={onDeny} icon={<Ban size={13} />}>
            Deny
          </Button>
          {onAllowOnce && (
            <Button variant="secondary" size="sm" onClick={onAllowOnce}>
              Allow Once
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleAllow} icon={<Check size={13} />}>
            Allow
          </Button>
        </div>
      </div>

      <style>{`
        .kcm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .kcm-modal {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          width: 400px;
          max-width: 90vw;
          overflow: hidden;
        }

        .kcm-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-md) var(--space-lg);
          border-bottom: 1px solid var(--border);
          color: var(--cyan);
        }

        .kcm-header h3 { flex: 1; font-size: var(--text-sm); font-weight: 600; margin: 0; color: var(--text-primary); }

        .kcm-close {
          color: var(--text-muted);
          padding: 4px;
          border-radius: 4px;
        }

        .kcm-close:hover { color: var(--text-primary); background: var(--bg-card); }

        .kcm-body { padding: var(--space-lg); }

        .kcm-kit-name { font-size: var(--text-base); margin: 0 0 2px; }
        .kcm-version { font-size: var(--text-xs); color: var(--text-muted); }
        .kcm-author { font-size: var(--text-xs); color: var(--text-secondary); margin: 0 0 var(--space-md); }

        .kcm-caps { margin-top: var(--space-sm); }

        .kcm-caps-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          margin: 0 0 var(--space-sm);
        }

        .kcm-cap-row {
          display: flex;
          align-items: flex-start;
          gap: var(--space-sm);
          padding: 6px 0;
        }

        .kcm-cap-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--cyan);
          margin-top: 5px;
          flex-shrink: 0;
        }

        .kcm-cap-name { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); }
        .kcm-cap-desc { font-size: var(--text-xs); color: var(--text-muted); }

        .kcm-footer {
          display: flex;
          gap: var(--space-sm);
          padding: var(--space-md) var(--space-lg);
          border-top: 1px solid var(--border);
          justify-content: flex-end;
        }

      `}</style>
    </div>
  );
}
