import { Download, Trash2, FileJson } from 'lucide-react';
import { useHITL } from '../../stores/hitl';
import Button from '../ui/Button';

// ---------------------------------------------------------------------------
// TuningExport — export approved HITL traces as .jsonl for fine-tuning
// ---------------------------------------------------------------------------

export default function TuningExport() {
  const { tuningTraces, exportTraces, clearTraces } = useHITL();

  const handleExport = () => {
    const jsonl = exportTraces();
    if (!jsonl) return;

    const blob = new Blob([jsonl], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcv-tuning-traces-${new Date().toISOString().slice(0, 10)}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 'var(--space-sm)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-xs)',
        marginBottom: 'var(--space-sm)',
        fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        <FileJson size={12} />
        Tuning Export ({tuningTraces.length} traces)
      </div>

      {tuningTraces.length === 0 ? (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 'var(--space-sm)' }}>
          No approved traces yet. Approve tool executions via HITL to collect training data.
        </div>
      ) : (
        <>
          <div style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 'var(--space-sm)' }}>
            {tuningTraces.slice(-10).map((t) => (
              <div key={t.id} style={{
                fontSize: 'var(--text-xs)', color: 'var(--text-secondary)',
                padding: '4px var(--space-sm)', borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}>
                <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                  {t.toolCall.name}
                </span>
                {' — '}
                <span style={{ color: 'var(--text-muted)' }}>
                  {new Date(t.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <Button size="sm" variant="primary" onClick={handleExport}>
              <Download size={12} /> Export .jsonl
            </Button>
            <Button size="sm" variant="ghost" onClick={clearTraces}>
              <Trash2 size={12} /> Clear
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
