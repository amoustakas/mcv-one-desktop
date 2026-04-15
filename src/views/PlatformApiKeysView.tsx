// Platform API Keys — mint + revoke + list keys for a venture.
// Epic 6 Story 3. Tony-facing admin surface that fronts
// /api/_handlers/api-keys.ts (which wraps src/lib/platform/api-keys.ts).
//
// The minted plaintext is returned ONCE and shown inline on creation —
// user must copy it immediately; subsequent reads only show the prefix.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Trash2, Copy, Check, ShieldAlert } from 'lucide-react';
import { apiPost } from '../lib/api/client';
import { useNavigation } from '../stores/navigation';
import {
  PageHeader, PageShell, GlassCard, Badge, Button, EmptyState, FormField, Input, Select,
} from '../components/ui';

type Tier = 'free' | 'growth' | 'scale' | 'enterprise';

interface ApiKeyRow {
  id: string;
  ventureId: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  rateLimitTier: Tier;
  permissions: string[];
  createdAt: string;
}

const TIER_OPTIONS: Array<{ value: Tier; label: string }> = [
  { value: 'free', label: 'Free (60/hr)' },
  { value: 'growth', label: 'Growth (600/hr)' },
  { value: 'scale', label: 'Scale (6,000/hr)' },
  { value: 'enterprise', label: 'Enterprise (60k/hr)' },
];

const PERMISSION_PRESETS: Array<{ label: string; permissions: string[] }> = [
  { label: 'Full access (*)', permissions: ['*'] },
  { label: 'Capital — read only', permissions: ['capital:read'] },
  { label: 'Capital — read + write', permissions: ['capital:read', 'capital:write'] },
  { label: 'Commerce — read only', permissions: ['commerce:read'] },
  { label: 'Commerce — read + write', permissions: ['commerce:read', 'commerce:write'] },
];

export default function PlatformApiKeysView() {
  const activeVenture = useNavigation((s) => s.activeVenture) ?? 'mcv';
  const qc = useQueryClient();

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['platform', 'api-keys', activeVenture],
    queryFn: async () => {
      const res = await apiPost<{ keys: ApiKeyRow[] }>('/api/api-keys', { action: 'list', ventureId: activeVenture });
      return res.keys;
    },
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; tier: Tier; permissions: string[]; test: boolean }) => {
      const res = await apiPost<{ key: ApiKeyRow; plaintext: string }>('/api/api-keys', {
        action: 'create',
        ventureId: activeVenture,
        name: input.name,
        tier: input.tier,
        permissions: input.permissions,
        test: input.test,
      });
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform', 'api-keys'] }),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      await apiPost('/api/api-keys', { action: 'revoke', id, ventureId: activeVenture });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform', 'api-keys'] }),
  });

  const [composing, setComposing] = useState(false);
  const [name, setName] = useState('');
  const [tier, setTier] = useState<Tier>('free');
  const [presetIdx, setPresetIdx] = useState<number>(0);
  const [test, setTest] = useState(false);
  const [mintedPlaintext, setMintedPlaintext] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    const result = await create.mutateAsync({
      name: name.trim(),
      tier,
      permissions: PERMISSION_PRESETS[presetIdx].permissions,
      test,
    });
    setMintedPlaintext(result.plaintext);
    setName('');
    setComposing(false);
  }

  async function copyPlaintext() {
    if (!mintedPlaintext) return;
    await navigator.clipboard.writeText(mintedPlaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <PageShell scroll>
      <PageHeader icon={<Key size={20} />} title="API Keys" subtitle={`Venture: ${activeVenture}`}>
        {!composing && (
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setComposing(true)}>
            New API key
          </Button>
        )}
      </PageHeader>

      {mintedPlaintext && (
        <GlassCard style={{ padding: 16, marginBottom: 16, borderLeft: '3px solid var(--green, #10B981)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <ShieldAlert size={16} style={{ color: '#10B981' }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>Key created — copy it now. It will not be shown again.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{ flex: 1, padding: 10, background: 'var(--bg-elevated)', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, overflow: 'auto' }}>
              {mintedPlaintext}
            </code>
            <Button variant="ghost" icon={copied ? <Check size={13} /> : <Copy size={13} />} onClick={copyPlaintext}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="ghost" onClick={() => setMintedPlaintext(null)}>Dismiss</Button>
          </div>
        </GlassCard>
      )}

      {composing && (
        <GlassCard style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FormField label="Name" required hint="For your own reference — partner name, integration label, etc.">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Partners read-only" autoFocus />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Rate limit tier">
                <Select<Tier> value={tier} onChange={setTier} options={TIER_OPTIONS} />
              </FormField>
              <FormField label="Permissions">
                <Select<number>
                  value={presetIdx}
                  onChange={(v) => setPresetIdx(Number(v))}
                  options={PERMISSION_PRESETS.map((p, i) => ({ value: i, label: p.label }))}
                />
              </FormField>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={test} onChange={(e) => setTest(e.target.checked)} style={{ accentColor: 'var(--cyan)' }} />
              Mark as <code>mcv_test_*</code> (non-production)
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={() => { setComposing(false); setName(''); }}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} disabled={!name.trim() || create.isPending} loading={create.isPending}>
                Generate key
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {isLoading ? (
        <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>Loading…</div>
      ) : !keys.length && !composing && !mintedPlaintext ? (
        <EmptyState
          icon={<Key size={24} />}
          title="No API keys yet"
          description="Mint a key to let partners, integrations, or white-label platforms talk to Capital."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {keys.map((k) => (
            <GlassCard key={k.id} style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{k.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    <code>{k.keyPrefix}…</code> · tier: <Badge color="#00F0FF">{k.rateLimitTier}</Badge>
                    <span style={{ marginLeft: 8 }}>
                      {k.permissions.map((p) => <Badge key={p} color="#8B5CF6">{p}</Badge>)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Created {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt ? ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : ' · Never used'}
                    {k.expiresAt ? ` · Expires ${new Date(k.expiresAt).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <Button variant="ghost" icon={<Trash2 size={12} />} onClick={() => revoke.mutate(k.id)} disabled={revoke.isPending}>
                  Revoke
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </PageShell>
  );
}
