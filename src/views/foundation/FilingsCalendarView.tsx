// Filings Calendar — 3-band view (Critical 30d / Launch 90d / Year-one depth) +
// the BlueMarlinPin readiness gate. Flips green when all P0 marks are filed
// or registered per the IP Inventory §7 filing roadmap.

import { useEffect } from 'react';
import { CalendarCheck, Circle } from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Badge } from '../../components/ui';
import { useFoundationStore, type IPMark } from '../../stores/foundation';

type Band = 'critical' | 'launch' | 'year_one';
const BAND_LABEL: Record<Band, string> = {
  critical: '30-Day Critical Path',
  launch: '90-Day Launch Window',
  year_one: 'Year-One Depth',
};
const BAND_DESCRIPTION: Record<Band, string> = {
  critical: 'P0 + PP0 — files before Blue Marlin / Gary / Joel pitch opens.',
  launch: 'P1 + PP1 — 90-day window; covers launch period.',
  year_one: 'P2 + PP2 + Madrid extensions + utility conversions — year-one depth.',
};

function classifyBand(m: IPMark): Band {
  if (['P0', 'PP0'].includes(m.priorityTier)) return 'critical';
  if (['P1', 'PP1'].includes(m.priorityTier)) return 'launch';
  return 'year_one';
}

const FILED_STATUSES = new Set(['filed', 'published', 'registered']);

export default function FilingsCalendarView() {
  const {
    ipMarks, blueMarlinGate, loading, errors,
    fetchIpMarks, fetchBlueMarlinGate,
  } = useFoundationStore();

  useEffect(() => {
    fetchIpMarks();
    fetchBlueMarlinGate();
  }, [fetchIpMarks, fetchBlueMarlinGate]);

  const bands: Record<Band, IPMark[]> = { critical: [], launch: [], year_one: [] };
  for (const m of ipMarks) bands[classifyBand(m)].push(m);

  return (
    <PageShell>
      <PageHeader
        title="Filings Calendar"
        subtitle="Roadmap across 30d / 90d / year-one bands + Blue Marlin readiness gate"
        icon={<CalendarCheck size={20} />}
      />

      {(errors.ipMarks || errors.blueMarlinGate) && (
        <GlassCard style={{ padding: 12, marginBottom: 16, borderColor: 'var(--error)' }}>
          <span style={{ color: 'var(--error)' }}>{errors.ipMarks || errors.blueMarlinGate}</span>
        </GlassCard>
      )}

      {/* Blue Marlin gate */}
      {blueMarlinGate && <BlueMarlinPin gate={blueMarlinGate} />}

      {/* 3 bands */}
      {(['critical', 'launch', 'year_one'] as Band[]).map((band) => {
        const marks = bands[band];
        const filed = marks.filter((m) => FILED_STATUSES.has(m.status)).length;
        const pct = marks.length > 0 ? (filed / marks.length) * 100 : 0;
        return (
          <GlassCard key={band} style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{BAND_LABEL[band]}</div>
              <Badge variant="default">{filed} / {marks.length} filed</Badge>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              {BAND_DESCRIPTION[band]}
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`,
                height: '100%',
                background: band === 'critical' ? '#00F5FF' : band === 'launch' ? '#8B5CF6' : '#06B6D4',
                transition: 'width 0.3s',
              }} />
            </div>
            {marks.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {marks.slice(0, 12).map((m) => (
                  <span key={m.id} style={{
                    fontSize: 11,
                    padding: '4px 8px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 4,
                    color: FILED_STATUSES.has(m.status) ? 'var(--success)' : 'var(--text-muted)',
                  }}>
                    {FILED_STATUSES.has(m.status) ? '✓' : '○'} {m.markText}
                  </span>
                ))}
                {marks.length > 12 && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px' }}>
                    +{marks.length - 12} more
                  </span>
                )}
              </div>
            )}
          </GlassCard>
        );
      })}

      {loading.ipMarks && ipMarks.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading filing roadmap…</div>
      )}
    </PageShell>
  );
}

function BlueMarlinPin({ gate }: { gate: NonNullable<ReturnType<typeof useFoundationStore.getState>['blueMarlinGate']> }) {
  const color = gate.ready ? 'var(--success, #10B981)' : gate.p0Green > 0 ? '#F59E0B' : '#EF4444';
  return (
    <GlassCard style={{
      padding: 16,
      marginBottom: 16,
      borderColor: color,
      background: `linear-gradient(90deg, ${color}15, transparent)`,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Circle size={20} fill={color} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color, marginBottom: 2 }}>
            Blue Marlin Gate
          </div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {gate.ready
              ? '✅ Ready — all P0 marks are filed or better. Pitch window open.'
              : `⛔ ${gate.p0Green} / ${gate.p0Total} P0 marks green · ${gate.blockers.length} blockers`}
          </div>
          {!gate.ready && gate.blockers.length > 0 && (
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, fontSize: 12, color: 'var(--text-muted)' }}>
              {gate.blockers.slice(0, 6).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
              {gate.blockers.length > 6 && <li>+ {gate.blockers.length - 6} more…</li>}
            </ul>
          )}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Checked {new Date(gate.checkedAt).toLocaleString()}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
