// src/components/admin-invites/BundlePickerPanel.tsx
//
// Bundle picker + live preview panel used inside CreateInviteDrawer. Renders
// as a two-part control: a Select that lists active bundles, and a preview
// panel that shows the bundle's templates (fetched on demand via get-bundle)
// so the admin can confirm the signing checklist before creating the invite.
//
// Kept separate so it could later plug into a "clone bundle" flow or a
// bundle-authoring UI without lifting the fetch/cache logic into the parent.

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import Select, { type SelectOption } from '../ui/Select';
import { apiPost } from '../../lib/api/client';
import type { AdminBundle, AdminTemplate } from '../../stores/admin-invites';

interface BundlePreview {
  bundle: AdminBundle;
  templates: Array<AdminTemplate & { display_order: number; required: boolean }>;
}

interface BundlePickerPanelProps {
  bundles: AdminBundle[];
  value: string | null;
  onChange: (bundleId: string | null) => void;
  disabled?: boolean;
}

export default function BundlePickerPanel({ bundles, value, onChange, disabled }: BundlePickerPanelProps) {
  const [preview, setPreview] = useState<BundlePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // All setStates are scoped inside the async IIFE so they fire from
    // network/microtask callbacks rather than the synchronous effect
    // body (React 19's react-hooks/set-state-in-effect rule).
    let cancelled = false;
    (async () => {
      if (!value) {
        if (!cancelled) setPreview(null);
        return;
      }
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await apiPost<BundlePreview>('/api/admin/invites', {
          action: 'get-bundle',
          id: value,
        });
        if (cancelled) return;
        setPreview(data);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [value]);

  const options: SelectOption[] = bundles
    .filter((b) => !b.retired_at)
    .map((b) => ({
      value: b.id,
      label: b.name,
      description: b.tier ? `tier · ${b.tier}` : undefined,
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Select
        options={options}
        value={value}
        onChange={onChange}
        placeholder="Select a document bundle…"
        disabled={disabled}
      />

      {preview && (
        <div className="mcv-bundle-preview">
          <div className="mcv-bundle-preview-header">
            <FileText size={13} aria-hidden />
            <span>{preview.bundle.description || 'Bundle includes:'}</span>
          </div>
          <ol className="mcv-bundle-preview-list">
            {preview.templates
              .slice()
              .sort((a, b) => a.display_order - b.display_order)
              .map((t) => (
                <li key={t.id} className="mcv-bundle-preview-item">
                  <span className="mcv-bundle-preview-idx">{t.display_order}</span>
                  <span className="mcv-bundle-preview-title">{t.title}</span>
                  <span className="mcv-bundle-preview-version">v{t.version}</span>
                  {!t.required && <span className="mcv-bundle-preview-optional">optional</span>}
                </li>
              ))}
          </ol>
        </div>
      )}

      {loading && <div style={loadingStyle}>Loading bundle preview…</div>}
      {error && <div style={errorStyle}>Could not load bundle: {error}</div>}

      <style>{`
        .mcv-bundle-preview {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.02);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mcv-bundle-preview-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: var(--text-muted);
        }
        .mcv-bundle-preview-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .mcv-bundle-preview-item {
          display: grid;
          grid-template-columns: 20px 1fr auto auto;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        .mcv-bundle-preview-idx {
          color: var(--text-muted);
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10px;
        }
        .mcv-bundle-preview-title { color: var(--text-primary); }
        .mcv-bundle-preview-version {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 10px;
          color: var(--text-muted);
          padding: 1px 6px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.04);
        }
        .mcv-bundle-preview-optional {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

const loadingStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-muted)',
  fontStyle: 'italic',
};
const errorStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--error)',
  paddingLeft: 8,
  borderLeft: '2px solid var(--error)',
};
