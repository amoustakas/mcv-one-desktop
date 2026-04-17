// src/views/PersonaRegistryView.tsx
// Marathon #2 T5.4 — Hit Squad roster view. Groups personas by department,
// surfaces rollup totals (chiefs, seniors, dimension counts), and renders a
// 4-column responsive grid of PersonaCards per department.
import { usePersonaRegistry, type Persona } from '../hooks/use-persona-registry';
import { PersonaCard } from '../components/persona/PersonaCard';
import { PageShell, PageHeader } from '../components/ui';

const DEPT_ORDER = [
  'chief_of_staff',
  'finance_capital',
  'ir_comms',
  'legal',
  'legal_risk',
  'engineering_product',
  'growth_marketing',
  'brand_content',
  'ops_infra',
  'strategy_research',
];

interface StatProps {
  label: string;
  value: number;
  accent?: string;
}

function Stat({ label, value, accent }: StatProps) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 10,
        border: `1px solid ${accent ? `${accent}40` : 'var(--border-subtle)'}`,
        background: accent ? `${accent}10` : 'var(--surface-elevated)',
        minWidth: 80,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: accent ?? 'var(--text-primary)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function PersonaRegistryView() {
  const reg = usePersonaRegistry();

  if (reg.isLoading) {
    return (
      <PageShell>
        <PageHeader
          title="Hit Squad"
          subtitle="Roster of every persona in the stack."
        />
        <div style={{ padding: 24, color: 'var(--text-muted)' }}>
          Loading roster…
        </div>
      </PageShell>
    );
  }

  const rank = (dept: string) => {
    const i = DEPT_ORDER.indexOf(dept);
    return i === -1 ? 99 : i;
  };
  const departments = Object.keys(reg.byDepartment).sort(
    (a, b) => rank(a) - rank(b),
  );

  return (
    <PageShell>
      <PageHeader
        title="Hit Squad"
        subtitle="Every persona, every dimension. The hive-mind roster."
      />

      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <Stat label="Total" value={reg.totals.all} />
        <Stat label="Chiefs" value={reg.totals.chiefs} />
        <Stat label="Seniors" value={reg.totals.seniors} />
        <Stat
          label="6D"
          value={reg.totals.byDimension['6D'] ?? 0}
          accent="#FBBF24"
        />
        <Stat
          label="5D"
          value={reg.totals.byDimension['5D'] ?? 0}
          accent="var(--color-brand-electric)"
        />
        <Stat
          label="4D"
          value={reg.totals.byDimension['4D'] ?? 0}
          accent="var(--color-brand-purple)"
        />
      </div>

      {departments.map((dept) => {
        const personas: Persona[] = reg.byDepartment[dept] ?? [];
        return (
          <section key={dept} style={{ marginBottom: 28 }}>
            <h3
              style={{
                fontSize: 11,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                margin: '0 0 10px',
              }}
            >
              {dept.replace(/_/g, ' ')} · {personas.length}
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 10,
              }}
            >
              {personas.map((p) => (
                <PersonaCard key={p.id} persona={p} />
              ))}
            </div>
          </section>
        );
      })}
    </PageShell>
  );
}

export default PersonaRegistryView;
