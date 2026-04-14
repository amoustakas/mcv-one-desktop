import { useState } from 'react';
import { Save, Trash2, AlertTriangle, Palette } from 'lucide-react';
import { GlassCard, Button, Input, FormField, Badge } from '../ui';
import { apiPost } from '../../lib/api/client';
import type { Venture, VentureTier } from '../../lib/ventures';

const TIER_LABEL: Record<VentureTier, string> = {
  1: 'Tier 1 — Portfolio Lead',
  2: 'Tier 2 — Branded Sub-platform',
  3: 'Tier 3 — Supporting Asset',
};

const STATUSES: Venture['status'][] = ['concept', 'planned', 'development', 'active'];

export default function VentureSettingsPanel({ venture, onUpdated, onDeleted }: {
  venture: Venture;
  onUpdated?: (v: Venture) => void;
  onDeleted?: () => void;
}) {
  const [form, setForm] = useState<Partial<Venture>>({
    name: venture.name,
    tagline: venture.tagline,
    description: venture.description,
    domain: venture.domain,
    icon: venture.icon,
    color: venture.color,
    accent: venture.accent,
    status: venture.status,
    type: venture.type,
    category: venture.category,
    tier: venture.tier ?? 1,
    fundingStage: venture.fundingStage,
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Venture>(key: K, value: Venture[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const result = await apiPost<{ venture: Venture }>('/api/ventures', {
        action: 'update',
        venture: { id: venture.id, ...form },
      });
      onUpdated?.(result.venture);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function performDelete() {
    if (deleteConfirm !== venture.id) return;
    try {
      await apiPost('/api/ventures', { action: 'delete', id: venture.id });
      onDeleted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  return (
    <div className="vsettings-root">
      <GlassCard className="vsettings-card">
        <div className="vsettings-head">
          <h4 className="vsettings-h4">Core identity</h4>
          <Button onClick={save} disabled={!dirty || saving} size="sm" icon={<Save size={12} />}>
            {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
          </Button>
        </div>
        <div className="vsettings-grid">
          <FormField label="Name">
            <Input value={form.name || ''} onChange={(e) => update('name', e.target.value)} />
          </FormField>
          <FormField label="Tagline">
            <Input value={form.tagline || ''} onChange={(e) => update('tagline', e.target.value)} />
          </FormField>
          <FormField label="Primary Domain">
            <Input value={form.domain || ''} onChange={(e) => update('domain', e.target.value)} />
          </FormField>
          <FormField label="Icon">
            <Input value={form.icon || ''} onChange={(e) => update('icon', e.target.value)} maxLength={2} />
          </FormField>
          <FormField label="Type">
            <Input value={form.type || ''} onChange={(e) => update('type', e.target.value)} />
          </FormField>
          <FormField label="Category">
            <Input value={form.category || ''} onChange={(e) => update('category', e.target.value)} />
          </FormField>
          <FormField label="Funding Stage">
            <Input value={form.fundingStage || ''} onChange={(e) => update('fundingStage', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Description">
          <textarea
            className="vsettings-textarea"
            value={form.description || ''}
            onChange={(e) => update('description', e.target.value)}
            rows={4}
          />
        </FormField>
      </GlassCard>

      <GlassCard className="vsettings-card">
        <h4 className="vsettings-h4"><Palette size={13} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Branding & lifecycle</h4>
        <div className="vsettings-grid">
          <FormField label="Primary Color">
            <div className="vsettings-color-row">
              <input type="color" value={form.color || '#00F0FF'} onChange={(e) => update('color', e.target.value)} className="vsettings-color-pick" />
              <Input value={form.color || ''} onChange={(e) => update('color', e.target.value)} />
            </div>
          </FormField>
          <FormField label="Accent Color">
            <div className="vsettings-color-row">
              <input type="color" value={form.accent || '#8B5CF6'} onChange={(e) => update('accent', e.target.value)} className="vsettings-color-pick" />
              <Input value={form.accent || ''} onChange={(e) => update('accent', e.target.value)} />
            </div>
          </FormField>
          <FormField label="Status">
            <div className="vsettings-pills">
              {STATUSES.map(s => (
                <button
                  key={s}
                  className={`vsettings-pill ${form.status === s ? 'vsettings-pill-active' : ''}`}
                  onClick={() => update('status', s)}
                >{s}</button>
              ))}
            </div>
          </FormField>
          <FormField label="Tier">
            <div className="vsettings-pills">
              {([1, 2, 3] as VentureTier[]).map(t => (
                <button
                  key={t}
                  className={`vsettings-pill ${form.tier === t ? 'vsettings-pill-active' : ''}`}
                  onClick={() => update('tier', t)}
                  title={TIER_LABEL[t]}
                >Tier {t}</button>
              ))}
            </div>
          </FormField>
        </div>
      </GlassCard>

      {error && <div className="vsettings-error">{error}</div>}

      <GlassCard className="vsettings-card vsettings-danger">
        <div className="vsettings-danger-head">
          <AlertTriangle size={14} style={{ color: 'var(--error)' }} />
          <h4 className="vsettings-h4">Danger zone</h4>
        </div>
        <p className="vsettings-danger-desc">
          Deleting <strong>{venture.name}</strong> removes the venture row plus all linked assets, docs, and quest projections via cascade.
          Clerk organization (if provisioned) must be deleted separately from the Clerk dashboard.
        </p>
        <div className="vsettings-delete-row">
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={`Type "${venture.id}" to confirm`}
            className="vsettings-delete-input"
          />
          <Button
            onClick={performDelete}
            disabled={deleteConfirm !== venture.id}
            size="sm"
            icon={<Trash2 size={12} />}
          >
            Delete venture
          </Button>
        </div>
      </GlassCard>

      <style>{`
        .vsettings-root { display: flex; flex-direction: column; gap: 12px; }
        .vsettings-card { padding: 16px; }
        .vsettings-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .vsettings-h4 { margin: 0; font-size: 13px; font-weight: 600; color: var(--text-primary); font-family: var(--font-display); }
        .vsettings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 12px; }
        .vsettings-textarea { width: 100%; font-family: var(--font-sans); font-size: 13px; padding: 10px; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); resize: vertical; }
        .vsettings-color-row { display: flex; gap: 8px; align-items: center; }
        .vsettings-color-pick { width: 40px; height: 32px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: transparent; cursor: pointer; padding: 2px; }
        .vsettings-pills { display: flex; gap: 4px; flex-wrap: wrap; }
        .vsettings-pill { padding: 6px 12px; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-full); color: var(--text-muted); font-size: 11px; cursor: pointer; transition: all 0.12s; text-transform: uppercase; letter-spacing: 0.04em; }
        .vsettings-pill:hover { color: var(--text-primary); border-color: var(--border-active); }
        .vsettings-pill-active { background: var(--cyan-glow); color: var(--cyan); border-color: var(--border-active); }
        .vsettings-error { font-size: 12px; color: var(--error); padding: 8px 10px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-sm); }
        .vsettings-danger { border: 1px solid rgba(239,68,68,0.3); }
        .vsettings-danger-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .vsettings-danger-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 12px; }
        .vsettings-delete-row { display: flex; gap: 8px; align-items: center; }
        .vsettings-delete-input { flex: 1; }
      `}</style>
    </div>
  );
}
