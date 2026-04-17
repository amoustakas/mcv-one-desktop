// src/views/LadderView.tsx
// Marathon #3 T9.5 — Hit Squad leaderboard ranked by xp.
// Marathon #3 T9.6 — row click opens PersonaCharacterSheet.
// Consumes useLadder (T9.4). Diablo 2 HC Ladder vibe — every rank earned.

import { useState } from 'react';
import { useLadder } from '../hooks/use-ladder';
import { LadderRow } from '../components/gamification/LadderRow';
import { PersonaCharacterSheet } from '../components/gamification/PersonaCharacterSheet';
import { PageShell, PageHeader } from '../components/ui';

export function LadderView() {
  const { data, isLoading } = useLadder({ limit: 50 });
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell>
        <PageHeader title="Ladder" subtitle="Hit Squad standings by XP. Diablo 2 hardcore — every rank earned." />
        <div style={{ color: 'var(--text-muted)', padding: 24 }}>Loading ladder…</div>
      </PageShell>
    );
  }

  const ladder = data?.ladder ?? [];
  const topXp = ladder[0]?.xp ?? 0;
  const totalXp = ladder.reduce((s, e) => s + e.xp, 0);
  const maxLevel = ladder.reduce((max, e) => Math.max(max, e.level), 0);

  return (
    <PageShell>
      <PageHeader
        title="Ladder"
        subtitle="Hit Squad standings. XP accrues on every ship. Every rank earned. Every fall permanent."
      />

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <Stat label="Personas" value={ladder.length} />
        <Stat label="Top XP" value={topXp.toLocaleString()} accent="#FBBF24" />
        <Stat label="Total XP" value={totalXp.toLocaleString()} />
        <Stat label="Max level" value={maxLevel} accent="var(--color-brand-electric)" />
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {ladder.map((entry) => (
          <LadderRow
            key={entry.id}
            entry={entry}
            onClick={(e) => setActiveAgentId(e.id)}
          />
        ))}
      </div>

      {ladder.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 12 }}>
          No personas on the ladder yet.
        </div>
      )}

      <PersonaCharacterSheet
        agentId={activeAgentId}
        open={!!activeAgentId}
        onClose={() => setActiveAgentId(null)}
      />
    </PageShell>
  );
}

const Stat = ({ label, value, accent }: { label: string; value: number | string; accent?: string }) => (
  <div style={{
    padding: 10, borderRadius: 10,
    border: `1px solid ${accent ? `${accent}40` : 'var(--border-subtle)'}`,
    background: accent ? `${accent}10` : 'var(--surface-elevated)',
    minWidth: 100,
  }}>
    <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: accent ?? 'var(--text-primary)' }}>{value}</div>
  </div>
);

export default LadderView;
