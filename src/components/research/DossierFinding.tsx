import { useState } from 'react';
import type { DossierFinding as Finding } from '../../hooks/use-research-dossier';

const CONFIDENCE_COLOR: Record<string, string> = {
  high: '#6EE7B7', medium: 'var(--color-brand-electric)', low: '#FBBF24', speculative: '#FB7185',
};

export function DossierFinding({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      onClick={() => setExpanded((e) => !e)}
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: 10, borderRadius: 6,
        border: `1px solid ${CONFIDENCE_COLOR[finding.confidence]}30`,
        background: `${CONFIDENCE_COLOR[finding.confidence]}08`,
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          background: CONFIDENCE_COLOR[finding.confidence], color: 'var(--surface-base)',
          flexShrink: 0,
        }}>{finding.confidence[0].toUpperCase()}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{finding.claim}</div>
          {expanded && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
              {finding.evidence}
            </div>
          )}
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{expanded ? '▾' : '▸'}</span>
      </div>
    </button>
  );
}
