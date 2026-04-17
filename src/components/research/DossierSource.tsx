import type { DossierSource as Source } from '../../hooks/use-research-dossier';

export function DossierSource({ source }: { source: Source }) {
  const isHttp = source.url.startsWith('http');
  const display = source.url.replace(/^https?:\/\//, '').replace(/^internal:\/\//, '🔒 ');
  const truncated = display.length > 50 ? `${display.slice(0, 50)}…` : display;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      {source.type && (
        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--surface-base)', color: 'var(--text-muted)' }}>
          {source.type}
        </span>
      )}
      {isHttp ? (
        <a href={source.url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand-electric)', textDecoration: 'none' }}>
          {truncated}
        </a>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>{truncated}</span>
      )}
      {source.author && <span style={{ color: 'var(--text-muted)' }}>· {source.author}</span>}
      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
        · {new Date(source.accessed_at).toLocaleDateString()}
      </span>
    </div>
  );
}
