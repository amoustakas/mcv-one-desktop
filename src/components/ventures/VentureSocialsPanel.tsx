import { useState } from 'react';
import { Globe, Github, Twitter, MessageCircle, Send, Linkedin, Youtube, ExternalLink, Save } from 'lucide-react';
import { GlassCard, Button, Input } from '../ui';
import { apiPost } from '../../lib/api/client';
import type { Venture, VentureSocials } from '../../lib/ventures';

const FIELDS: Array<{
  key: keyof VentureSocials;
  label: string;
  icon: typeof Globe;
  placeholder: string;
  color: string;
}> = [
  { key: 'website',  label: 'Website',   icon: Globe,         placeholder: 'https://mcv.one',              color: '#00F0FF' },
  { key: 'github',   label: 'GitHub',    icon: Github,        placeholder: 'https://github.com/org',       color: '#E8F0FE' },
  { key: 'twitter',  label: 'X (Twitter)', icon: Twitter,     placeholder: 'https://x.com/handle',          color: '#E8F0FE' },
  { key: 'discord',  label: 'Discord',   icon: MessageCircle, placeholder: 'https://discord.gg/invite',    color: '#5865F2' },
  { key: 'telegram', label: 'Telegram',  icon: Send,          placeholder: 'https://t.me/channel',          color: '#26A5E4' },
  { key: 'linkedin', label: 'LinkedIn',  icon: Linkedin,      placeholder: 'https://linkedin.com/company',  color: '#0A66C2' },
  { key: 'youtube',  label: 'YouTube',   icon: Youtube,       placeholder: 'https://youtube.com/@channel',  color: '#FF0000' },
];

export default function VentureSocialsPanel({ venture, onUpdated }: { venture: Venture; onUpdated?: (v: Venture) => void }) {
  const [socials, setSocials] = useState<VentureSocials>(venture.socials || {});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof VentureSocials, value: string) {
    setSocials(prev => ({ ...prev, [key]: value || undefined }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const result = await apiPost<{ venture: Venture }>('/api/ventures', {
        action: 'update',
        venture: { id: venture.id, socials },
      });
      onUpdated?.(result.venture);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save socials');
    } finally {
      setSaving(false);
    }
  }

  const filledCount = Object.values(socials).filter(v => v && v.length > 0).length;

  return (
    <div className="vsp-root">
      <GlassCard className="vsp-card vsp-head">
        <div>
          <h3 className="vsp-title">Social profiles for {venture.name}</h3>
          <p className="vsp-subtitle">{filledCount} of {FIELDS.length} channels configured</p>
        </div>
        <Button onClick={save} disabled={!dirty || saving} size="sm" icon={<Save size={12} />}>
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </Button>
      </GlassCard>

      {error && <div className="vsp-error">{error}</div>}

      <div className="vsp-grid">
        {FIELDS.map(field => {
          const Icon = field.icon;
          const value = socials[field.key] || '';
          const filled = value.length > 0;
          return (
            <GlassCard key={field.key} className={`vsp-field ${filled ? 'vsp-field-filled' : ''}`}>
              <div className="vsp-field-head">
                <div className="vsp-field-label">
                  <Icon size={14} style={{ color: field.color }} />
                  <span>{field.label}</span>
                </div>
                {filled && (
                  <a href={value} target="_blank" rel="noreferrer" className="vsp-field-preview">
                    Open <ExternalLink size={9} />
                  </a>
                )}
              </div>
              <Input
                value={value}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="vsp-input"
              />
            </GlassCard>
          );
        })}
      </div>

      <style>{`
        .vsp-root { display: flex; flex-direction: column; gap: 12px; }
        .vsp-card { padding: 16px; }
        .vsp-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .vsp-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-primary); font-family: var(--font-display); }
        .vsp-subtitle { margin: 4px 0 0; font-size: 11px; color: var(--text-muted); }
        .vsp-error { font-size: 12px; color: var(--error); padding: 8px 10px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-sm); }
        .vsp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
        .vsp-field { padding: 12px; transition: border-color 0.15s; }
        .vsp-field-filled { border-color: var(--border-active); }
        .vsp-field-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .vsp-field-label { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-primary); font-weight: 500; }
        .vsp-field-preview { font-size: 10px; color: var(--cyan); text-decoration: none; display: inline-flex; align-items: center; gap: 3px; }
        .vsp-field-preview:hover { color: var(--text-primary); }
        .vsp-input { width: 100%; }
      `}</style>
    </div>
  );
}
