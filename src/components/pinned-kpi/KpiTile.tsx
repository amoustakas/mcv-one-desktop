import { useQuery } from '@tanstack/react-query';
import type { TileDefinition, TileQueryContext } from '../../lib/pinned-kpi/types';

interface KpiTileProps {
  def: TileDefinition;
  ctx: TileQueryContext;
}

export function KpiTile({ def, ctx }: KpiTileProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['pinned-kpi', def.id, ctx.ventureId, ...ctx.lens],
    queryFn: () => def.source(ctx),
    staleTime: 30_000,
  });

  const value = data ? def.formatter(data.value) : '—';
  const delta = data?.delta;
  const secondary = data?.secondary;

  const deltaColor = delta?.direction === 'up' ? '#6EE7B7'
                   : delta?.direction === 'down' ? '#FB7185'
                   : 'var(--text-muted)';
  const deltaGlyph = delta?.direction === 'up' ? '▲' : delta?.direction === 'down' ? '▼' : '·';

  return (
    <article style={{
      padding: 12,
      border: `1px solid ${def.accent}40`,
      borderRadius: 10,
      background: `linear-gradient(180deg, ${def.accent}10, transparent)`,
    }}>
      <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {def.label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: def.accent, marginTop: 4 }}>
        {isLoading ? '…' : value}
      </div>
      {(delta || secondary) && (
        <div style={{ fontSize: 11, marginTop: 2, color: deltaColor }}>
          {delta && `${deltaGlyph} ${delta.magnitude}${typeof delta.magnitude === 'number' && Math.abs(delta.magnitude) < 100 ? '%' : ''}${delta.period ? ` · ${delta.period}` : ''}`}
          {!delta && secondary && <span style={{ color: 'var(--text-muted)' }}>{secondary}</span>}
        </div>
      )}
    </article>
  );
}
