// Stub — real implementation lands with the public-routes session PR.
// Renders neutral fallback for any /public/* path so dev doesn't crash.

interface Props {
  pathname: string;
}

export default function PublicRoute({ pathname }: Props) {
  return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 18, marginBottom: 8 }}>Public route</div>
      <div style={{ fontSize: 12 }}>{pathname}</div>
      <div style={{ fontSize: 12, marginTop: 16 }}>Real renderer ships with the public-routes PR.</div>
    </div>
  );
}
