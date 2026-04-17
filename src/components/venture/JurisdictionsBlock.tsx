import { StackBlock, Empty, lineStyle } from './_shell';

export function JurisdictionsBlock({ jurisdictions }: { jurisdictions: Array<{ jurisdiction_code: string; regulatory_frameworks: string[]; tax_structure: string | null }> }) {
  return (
    <StackBlock label="🌐 Jurisdictions">
      {jurisdictions.length === 0 ? <Empty /> : jurisdictions.map((j, i) => (
        <div key={i} style={lineStyle}>
          {j.jurisdiction_code}
          {j.regulatory_frameworks.length > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}> · {j.regulatory_frameworks.join(' · ')}</span>}
        </div>
      ))}
    </StackBlock>
  );
}
