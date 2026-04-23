// Naming Ratification Board — 6 locked mappings + scanner instructions.
// The scan / apply / rollback operations are Node-only (fs + git) and run via
// scripts/foundation/naming-scanner.ts. This view surfaces the mappings and
// provides copy-paste commands for each operation.

import { useEffect, useState } from 'react';
import { FileSignature, Terminal } from 'lucide-react';
import { PageShell, PageHeader, GlassCard } from '../../components/ui';
import { Chip } from './_chip';
import { useFoundationStore } from '../../stores/foundation';

export default function NamingRatificationBoardView() {
  const { namingRatifications, loading, errors, fetchNamingRatifications } = useFoundationStore();
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchNamingRatifications();
  }, [fetchNamingRatifications]);

  const copy = (cmd: string, label: string) => {
    navigator.clipboard.writeText(cmd).catch(() => void 0);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <PageShell>
      <PageHeader
        title="Naming Ratification Board"
        subtitle="6 locked deprecated → ratified mappings · scanner + batch apply + rollback"
        icon={<FileSignature size={20} />}
      />

      {errors.namingRatifications && (
        <GlassCard style={{ padding: 12, marginBottom: 16, borderColor: 'var(--error)' }}>
          <span style={{ color: 'var(--error)' }}>{errors.namingRatifications}</span>
        </GlassCard>
      )}

      {/* 6 ratification cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginBottom: 20 }}>
        {namingRatifications.map((r) => (
          <GlassCard key={r.id} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <code style={{ color: 'var(--error)', textDecoration: 'line-through' }}>{r.deprecatedName}</code>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <code style={{ color: 'var(--cyan)', fontWeight: 600 }}>{r.ratifiedName}</code>
            </div>
            <Chip tone={r.context === 'prose' ? 'info' : 'muted'}>
              context: {r.context}
            </Chip>
            {r.rationale && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.45 }}>
                {r.rationale}
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Node-only ops panel */}
      <GlassCard style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Terminal size={16} style={{ color: 'var(--cyan)' }} />
          <span style={{ fontWeight: 600 }}>Scanner / Apply / Rollback</span>
          <Chip tone="info">Node-only</Chip>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
          Filesystem scanning and git operations run locally via{' '}
          <code>scripts/foundation/naming-scanner.ts</code>. Classification defaults: markdown /
          comments / UI copy = <em>safe</em>; string literals = <em>ambiguous</em>; identifiers /
          imports / type names / test names = <em>unsafe</em>. Unsafe rows require explicit operator
          override in a batch review before <code>apply</code>.
        </div>

        <CommandRow
          label="Scan"
          command={'pnpm tsx --env-file=.env.local scripts/foundation/naming-scanner.ts scan'}
          description="Walk src/, packages/, docs/ → populate naming_occurrences."
          onCopy={copy}
          copied={copied}
        />
        <CommandRow
          label="Apply"
          command={'pnpm tsx --env-file=.env.local scripts/foundation/naming-scanner.ts apply <batch-id>'}
          description="Rewrite files, stage, commit; record pre/post commit SHAs on the batch."
          onCopy={copy}
          copied={copied}
        />
        <CommandRow
          label="Rollback"
          command={'pnpm tsx --env-file=.env.local scripts/foundation/naming-scanner.ts rollback <batch-id>'}
          description="Reset HEAD to the batch's pre_commit_sha; record rollback audit pair."
          onCopy={copy}
          copied={copied}
        />
      </GlassCard>

      {loading.namingRatifications && namingRatifications.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading ratifications…</div>
      )}
    </PageShell>
  );
}

function CommandRow({
  label, command, description, onCopy, copied,
}: {
  label: string;
  command: string;
  description: string;
  onCopy: (cmd: string, label: string) => void;
  copied: string | null;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— {description}</span>
      </div>
      <div style={{
        display: 'flex',
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        overflow: 'hidden',
      }}>
        <code style={{ padding: '8px 12px', fontSize: 12, flex: 1, overflow: 'auto', whiteSpace: 'nowrap' }}>
          {command}
        </code>
        <button
          onClick={() => onCopy(command, label)}
          style={{
            padding: '8px 14px',
            background: copied === label ? 'var(--success)' : 'rgba(255,255,255,0.04)',
            color: copied === label ? 'var(--bg, #060D14)' : 'var(--text)',
            border: 'none',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {copied === label ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
