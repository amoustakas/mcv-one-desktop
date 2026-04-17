import { useLatestDossier, type Dossier, type Confidence } from '../../hooks/use-research-dossier';
import { DossierFinding } from './DossierFinding';
import { DossierSource } from './DossierSource';

interface Props {
  entityType: 'prospect' | 'venture' | 'round' | 'contact' | 'deal' | 'organization';
  entityId: string | null;
}

const CONFIDENCE_COLOR: Record<Confidence, string> = {
  high: '#6EE7B7',
  medium: 'var(--color-brand-electric)',
  low: '#FBBF24',
  speculative: '#FB7185',
};

export function ResearchDossierView({ entityType, entityId }: Props) {
  const { data, isLoading } = useLatestDossier({ entityType, entityId });

  if (!entityId) return null;
  if (isLoading) return <Empty label="Loading dossier…" />;
  if (!data?.dossier) return <Empty label="No research dossier yet" />;

  const dossier: Dossier = data.dossier;
  const stale = dossier.stale_at && new Date(dossier.stale_at).getTime() < Date.now();

  return (
    <section style={{
      padding: 16,
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      background: 'var(--surface-elevated)',
      display: 'grid', gap: 12,
    }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            🔍 Research dossier · v{dossier.version}
          </div>
          <h3 style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{dossier.title}</h3>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 4,
            background: `${CONFIDENCE_COLOR[dossier.confidence]}20`,
            color: CONFIDENCE_COLOR[dossier.confidence],
          }}>{dossier.confidence}</span>
          {stale && (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
              padding: '3px 8px', borderRadius: 4, background: '#FB718520', color: '#FB7185',
            }}>⚠ stale</span>
          )}
        </div>
      </header>

      {dossier.summary && (
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: 'var(--text-primary)' }}>{dossier.summary}</p>
      )}

      {dossier.findings.length > 0 && (
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            Findings · {dossier.findings.length}
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {dossier.findings.map((f, i) => <DossierFinding key={i} finding={f} />)}
          </div>
        </div>
      )}

      {dossier.sources.length > 0 && (
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            Sources · {dossier.sources.length}
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            {dossier.sources.map((s, i) => <DossierSource key={i} source={s} />)}
          </div>
        </div>
      )}

      <footer style={{ fontSize: 10, color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
        authored by {dossier.authored_by_agent_id ? `agent ${dossier.authored_by_agent_id.slice(0, 8)}…` : dossier.authored_by_user_id ?? 'system'}
        {' · '}{new Date(dossier.updated_at).toLocaleDateString()}
        {dossier.stale_at && <> · stale_at {new Date(dossier.stale_at).toLocaleDateString()}</>}
      </footer>
    </section>
  );
}

const Empty = ({ label }: { label: string }) => (
  <div style={{
    padding: 12,
    border: '1px dashed var(--border-subtle)',
    borderRadius: 8,
    color: 'var(--text-muted)',
    fontSize: 12, fontStyle: 'italic',
    textAlign: 'center',
  }}>
    {label}
  </div>
);
