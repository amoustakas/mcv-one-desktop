// Stream Deck cockpit panel. 15-button grid (standard MK.2 / MK.3 layout),
// click an empty slot to bind a Factory flow, click a bound slot to edit or
// unbind. Bindings persist in Factory SQLite — this panel is thin state
// over the streamdeckList / streamdeckBind / streamdeckUnbind flows.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Radio, Plus, Trash2, RefreshCw } from 'lucide-react';
import { GlassCard, Badge, Modal } from '../ui';
import { factoryInvoke } from '../../lib/factory-client';
import { useFactoryFlows } from '../../hooks/use-factory';

interface Binding {
  buttonIndex: number;
  flow: string;
  input: Record<string, unknown>;
  label?: string;
}

interface StreamDeckListOutput {
  available: boolean;
  bindings: Binding[];
}

const GRID_BUTTONS = 15; // 3 rows × 5 cols — standard Stream Deck MK.2

function BindModal({
  open, onClose, onSubmit, flows, existing, buttonIndex,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (b: Binding) => Promise<void>;
  flows: string[];
  existing?: Binding;
  buttonIndex: number;
}) {
  const [flow, setFlow] = useState(existing?.flow ?? flows[0] ?? 'heartbeatPulse');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [inputText, setInputText] = useState(JSON.stringify(existing?.input ?? {}, null, 2));
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFlow(existing?.flow ?? flows[0] ?? 'heartbeatPulse');
    setLabel(existing?.label ?? '');
    setInputText(JSON.stringify(existing?.input ?? {}, null, 2));
    setErr(null);
  }, [open, existing, flows]);

  const submit = async () => {
    let input: Record<string, unknown>;
    try { input = JSON.parse(inputText || '{}'); }
    catch (e) { setErr((e as Error).message); return; }
    setBusy(true);
    try {
      await onSubmit({ buttonIndex, flow, input, label: label.trim() || undefined });
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} size="md">
      <div style={{ padding: 4, display: 'grid', gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
          {existing ? 'Edit' : 'Bind'} Stream Deck button {buttonIndex}
        </h3>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Label (optional)</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Hunter dossier"
            style={{ padding: 6, fontSize: 13, borderRadius: 4, background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Flow</span>
          <select value={flow} onChange={(e) => setFlow(e.target.value)}
            style={{ padding: 6, fontSize: 13, borderRadius: 4, background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}>
            {flows.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Flow input (JSON)</span>
          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} rows={8}
            style={{ padding: 8, fontFamily: 'var(--font-mono)', fontSize: 12, borderRadius: 4, resize: 'vertical', background: 'var(--surface-sunken)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }} />
        </label>
        {err && <div style={{ fontSize: 11, color: '#FCA5A5' }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} disabled={busy}
            style={{ padding: '6px 12px', fontSize: 13, borderRadius: 4, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-default)', cursor: 'pointer' }}>
            cancel
          </button>
          <button type="button" onClick={submit} disabled={busy}
            style={{ padding: '6px 14px', fontSize: 13, borderRadius: 4, background: 'var(--color-brand-electric)', color: '#000', border: 'none', cursor: busy ? 'wait' : 'pointer', fontWeight: 600 }}>
            {busy ? 'saving…' : 'save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function StreamDeckPanel() {
  const { flows } = useFactoryFlows();
  const [data, setData] = useState<StreamDeckListOutput>({ available: false, bindings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const aliveRef = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const r = await factoryInvoke<StreamDeckListOutput>('streamdeckList', {});
      if (!aliveRef.current) return;
      setData(r.output ?? { available: false, bindings: [] });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'streamdeckList failed');
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    refetch();
    return () => { aliveRef.current = false; };
  }, [refetch]);

  const byIndex = useMemo(() => {
    const map = new Map<number, Binding>();
    for (const b of data.bindings) map.set(b.buttonIndex, b);
    return map;
  }, [data]);

  const submitBind = async (b: Binding) => {
    await factoryInvoke('streamdeckBind', b as unknown as Record<string, unknown>);
    await refetch();
  };

  const unbind = async (buttonIndex: number) => {
    await factoryInvoke('streamdeckUnbind', { buttonIndex });
    await refetch();
  };

  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radio size={14} /> Stream Deck
          <Badge variant="outline" color={data.available ? '#10B981' : '#64748B'}>
            {data.available ? 'module ready' : 'module not installed'}
          </Badge>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
            {data.bindings.length} bound
          </span>
        </h3>
        <button type="button" onClick={refetch}
          style={{ background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 4, padding: '3px 8px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={11} /> refresh
        </button>
      </div>

      {!data.available && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
          Install with <code style={{ background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 3 }}>pnpm run install:native streamdeck</code>, then connect hardware.
          Bindings persist in Factory SQLite and replay on boot.
        </div>
      )}
      {error && <div style={{ fontSize: 11, color: '#FCA5A5', marginBottom: 8 }}>{error}</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 8,
      }}>
        {Array.from({ length: GRID_BUTTONS }).map((_, idx) => {
          const b = byIndex.get(idx);
          return (
            <div key={idx}
              onClick={() => setModalIndex(idx)}
              style={{
                aspectRatio: '1',
                border: b ? '1px solid var(--color-brand-electric)' : '1px dashed var(--border-default)',
                borderRadius: 6,
                background: b ? 'rgba(0,240,255,0.05)' : 'var(--surface-sunken)',
                cursor: 'pointer',
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
              }}
              title={b ? `${b.flow} (click to edit)` : 'empty (click to bind)'}
            >
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>#{idx}</div>
              {b ? (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.label ?? b.flow}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.flow}
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); unbind(idx); }}
                    title="Unbind"
                    style={{ position: 'absolute', top: 3, right: 3, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
                    <Trash2 size={10} />
                  </button>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Plus size={14} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalIndex !== null && (
        <BindModal
          open={modalIndex !== null}
          onClose={() => setModalIndex(null)}
          onSubmit={submitBind}
          flows={flows.length ? flows : ['heartbeatPulse']}
          existing={byIndex.get(modalIndex)}
          buttonIndex={modalIndex}
        />
      )}
      {loading && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>loading…</div>}
    </GlassCard>
  );
}
