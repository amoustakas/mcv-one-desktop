import { StackBlock, Empty, lineStyle } from './_shell';

export function CorpsBlock({ corps }: { corps: Array<{ name: string; jurisdiction: string }> }) {
  return (
    <StackBlock label="🏢 Corps">
      {corps.length === 0 ? <Empty /> : corps.map((c, i) => (
        <div key={i} style={lineStyle}>{c.name} <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({c.jurisdiction})</span></div>
      ))}
    </StackBlock>
  );
}
