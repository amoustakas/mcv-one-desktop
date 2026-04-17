import { StackBlock, Empty, lineStyle } from './_shell';

export function TeamBlock({ team }: { team: Array<{ name: string; role?: string }> }) {
  return (
    <StackBlock label="👥 Team">
      {team.length === 0 ? <Empty /> : team.map((m, i) => (
        <div key={i} style={lineStyle}>{m.name} {m.role && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>· {m.role}</span>}</div>
      ))}
    </StackBlock>
  );
}
