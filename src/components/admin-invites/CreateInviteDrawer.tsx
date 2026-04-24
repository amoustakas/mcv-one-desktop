// src/components/admin-invites/CreateInviteDrawer.tsx
//
// Right-side Sheet form for issuing a new onboarding invite. Wires every
// field on onboarding_invites that a super-admin controls:
//
//   · email (required, lowercased) + optional invited_name
//   · bundle (required, picker renders templates inline)
//   · access_tier (free-form taxonomy: investor / preview / admin / …)
//   · access_levels (ChipInput — one pill per level)
//   · target_venture_id (optional — null means ecosystem-wide)
//   · expires_in_days (slider — 1 to 90, default 14)
//   · instructions_md (optional personal note shown on welcome step)
//
// On submit, calls the store's createInvite; on success, surfaces the
// pre-built inviteUrl (from the handler) for one-click copy. The drawer
// stays open with the URL visible until the admin explicitly closes it —
// losing that URL is a bad experience (we don't store it, only the latest
// one lives in store.lastCreatedInviteUrl).

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import Sheet from '../ui/Sheet';
import Input from '../ui/Input';
import FormField from '../ui/FormField';
import Button from '../ui/Button';
import ChipInput from '../ui/ChipInput';
import Select from '../ui/Select';
import { useAdminInvitesStore, type CreateInviteInput } from '../../stores/admin-invites';
import BundlePickerPanel from './BundlePickerPanel';

interface CreateInviteDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful create; parent may want to refresh or flash a toast. */
  onCreated?: (inviteUrl: string) => void;
}

const TIER_OPTIONS = [
  { value: 'investor', label: 'Investor' },
  { value: 'preview', label: 'Preview' },
  { value: 'admin', label: 'Admin' },
  { value: 'partner', label: 'Partner' },
  { value: 'operator', label: 'Operator' },
];

const VENTURE_OPTIONS = [
  { value: '', label: 'Ecosystem-wide (no target venture)' },
  { value: 'futurestate', label: 'Futurestate' },
  { value: 'betedge', label: 'BetEdge AI' },
  { value: 'warforge', label: 'WarForge' },
  { value: 'mcvgg', label: 'MCV Studios' },
  { value: 'edgeiq', label: 'EdgeIQ Markets' },
  { value: 'arqlabs', label: 'ARQ Labs' },
  { value: 'mcv', label: 'MCV One' },
];

const DEFAULT_FORM: CreateInviteInput = {
  email: '',
  name: '',
  bundle_id: '',
  target_venture_id: '',
  access_tier: 'preview',
  access_levels: [],
  expires_in_days: 14,
  instructions_md: '',
};

export default function CreateInviteDrawer({ open, onClose, onCreated }: CreateInviteDrawerProps) {
  const bundles = useAdminInvitesStore((s) => s.bundles);
  const createInvite = useAdminInvitesStore((s) => s.createInvite);
  const creating = useAdminInvitesStore((s) => s.loading.creating);
  const createError = useAdminInvitesStore((s) => s.errors.creating);
  const lastCreatedInviteUrl = useAdminInvitesStore((s) => s.lastCreatedInviteUrl);
  const clearLastCreatedInviteUrl = useAdminInvitesStore((s) => s.clearLastCreatedInviteUrl);

  const [form, setForm] = useState<CreateInviteInput>(DEFAULT_FORM);
  const [copied, setCopied] = useState(false);

  const patch = <K extends keyof CreateInviteInput>(k: K, v: CreateInviteInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleClose = () => {
    setForm(DEFAULT_FORM);
    setCopied(false);
    clearLastCreatedInviteUrl();
    onClose();
  };

  const submit = async () => {
    if (!form.email || !form.bundle_id) return;
    try {
      const { inviteUrl } = await createInvite({
        ...form,
        email: form.email.trim().toLowerCase(),
        name: form.name?.trim() || undefined,
        target_venture_id: form.target_venture_id || null,
        instructions_md: form.instructions_md?.trim() || undefined,
      });
      // Keep the drawer open + surface the URL for copy. Form is reset to
      // default so a follow-up issuance starts clean.
      setForm(DEFAULT_FORM);
      onCreated?.(inviteUrl);
    } catch {
      // Error is surfaced through the store; drawer stays open with form values.
    }
  };

  const copyUrl = async () => {
    if (!lastCreatedInviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastCreatedInviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard perms denied — do nothing; URL is still visible on-screen.
    }
  };

  const canSubmit = form.email.trim().length > 0 && form.bundle_id.length > 0 && !creating;

  return (
    <Sheet open={open} onClose={handleClose} title="Issue new onboarding invite" side="right" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {lastCreatedInviteUrl && (
          <div className="mcv-invite-created-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Check size={13} style={{ color: '#10b981' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 }}>
                Invite created
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <code className="mcv-invite-url-code">{lastCreatedInviteUrl}</code>
              <Button size="sm" variant="ghost" onClick={copyUrl}>
                <Copy size={12} /> {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
              Paste this link into the invitation email. It is the ONLY place this URL will be surfaced — we
              do not persist it beyond this session.
            </div>
          </div>
        )}

        <FormField label="Invitee email" required hint="Lowercased on send.">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => patch('email', e.target.value)}
            placeholder="name@example.com"
            disabled={creating}
          />
        </FormField>

        <FormField label="Invitee name" hint="Optional. Shown on the welcome step.">
          <Input
            value={form.name ?? ''}
            onChange={(e) => patch('name', e.target.value)}
            placeholder="Hunter Milborne"
            disabled={creating}
          />
        </FormField>

        <FormField label="Document bundle" required>
          <BundlePickerPanel
            bundles={bundles}
            value={form.bundle_id || null}
            onChange={(v) => patch('bundle_id', v ?? '')}
            disabled={creating}
          />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Access tier">
            <Select
              options={TIER_OPTIONS}
              value={form.access_tier}
              onChange={(v) => patch('access_tier', v ?? 'preview')}
              disabled={creating}
            />
          </FormField>
          <FormField label="Target venture" hint="Optional. Ecosystem-wide if blank.">
            <Select
              options={VENTURE_OPTIONS}
              value={form.target_venture_id ?? ''}
              onChange={(v) => patch('target_venture_id', v || null)}
              disabled={creating}
            />
          </FormField>
        </div>

        <FormField label="Access levels" hint="e.g. futurestate:view, futurestate:invest. Press Enter to add.">
          <ChipInput
            value={form.access_levels}
            onChange={(v) => patch('access_levels', v)}
            placeholder="Add an access level…"
            disabled={creating}
          />
        </FormField>

        <FormField label="Expires in (days)" hint="Between 1 and 90.">
          <Input
            type="number"
            min={1}
            max={90}
            value={String(form.expires_in_days ?? 14)}
            onChange={(e) => patch('expires_in_days', Math.max(1, Math.min(90, Number(e.target.value) || 14)))}
            disabled={creating}
          />
        </FormField>

        <FormField label="Personal note to invitee" hint="Optional markdown shown on their welcome screen.">
          <textarea
            className="mcv-invite-textarea"
            value={form.instructions_md ?? ''}
            onChange={(e) => patch('instructions_md', e.target.value)}
            rows={4}
            disabled={creating}
            placeholder="I wanted to personally invite you to review the Futurestate round — here's your access…"
          />
        </FormField>

        {createError && (
          <div style={errorBoxStyle}>
            {createError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          <Button variant="ghost" onClick={handleClose}>
            {lastCreatedInviteUrl ? 'Close' : 'Cancel'}
          </Button>
          <Button onClick={submit} disabled={!canSubmit} loading={creating}>
            {creating ? 'Creating…' : lastCreatedInviteUrl ? 'Create another' : 'Create invite'}
          </Button>
        </div>
      </div>

      <style>{`
        .mcv-invite-created-banner {
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid rgba(16, 185, 129, 0.4);
          background: rgba(16, 185, 129, 0.06);
        }
        .mcv-invite-url-code {
          flex: 1;
          padding: 6px 8px;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.25);
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11px;
          color: var(--cyan);
          overflow-wrap: anywhere;
          word-break: break-all;
        }
        .mcv-invite-textarea {
          width: 100%;
          box-sizing: border-box;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-primary);
          padding: 10px 12px;
          font-size: 13px;
          font-family: inherit;
          line-height: 1.5;
          resize: vertical;
          min-height: 80px;
        }
        .mcv-invite-textarea:focus {
          outline: none;
          border-color: var(--cyan);
        }
      `}</style>
    </Sheet>
  );
}

const errorBoxStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  borderLeft: '2px solid var(--error)',
  background: 'rgba(239, 68, 68, 0.06)',
  color: 'var(--error)',
  fontSize: 12,
};
