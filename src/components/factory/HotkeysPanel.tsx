// Global hotkey cockpit panel. Register / list / unregister system-wide
// key chords (e.g. Ctrl+Shift+D) that fire a Factory flow when pressed.
// Backed by lib/devices/uiohook.ts on the Factory side — requires
// uiohook-napi (opt-in via `pnpm run install:native uiohook`).

import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Plus, Trash2, RefreshCw } from 'lucide-react';
import { GlassCard, Badge, EmptyState } from '../ui';
import { factoryInvoke } from '../../lib/factory-client';
import { useFactoryFlows } from '../../hooks/use-factory';

interface Hotkey { id: string; pattern: string }
interface HotkeyListResult { available: boolean; hotkeys: Hotkey[] }

export default function HotkeysPanel() {
  const { flows } = useFactoryFlows();
  const [state, setState] = useState<HotkeyListResult>({ available: false, hotkeys: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pattern, setPattern] = useState('Ctrl+Shift+D');
  const [flow, setFlow] = useState('heartbeatPulse');
  const [inputText, setInputText] = useState('{"emit":false}');
  const [formErr, setFormErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const aliveRef = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const r = await factoryInvoke<HotkeyListResult>('hotkeyList', {});
      if (!aliveRef.current) return;
      setState(r.output ?? { available: false, hotkeys: [] });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'hotkeyList failed');
    } finally { if (aliveRef.current) setLoading(false); }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    refetch();
    return () => { aliveRef.current = false; };
  }, [refetch]);

  const register = async () => {
    setFormErr(null);
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(inputText || '{}'); }
    catch (e) { setFormErr('Input JSON invalid: ' + (e as Error).message); return; }
    setBusy(true);
    try {
      const r = await factoryInvoke<{ ok: boolean; id?: string; error?: string }>('hotkeyRegister', {
        pattern: pattern.trim(), flow, input: parsed,
      });
      const out = r.output;
      if (!out?.ok) {
        setFormErr(out?.error ?? 'register failed — is uiohook-napi installed?');
      }
      await refetch();
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'register failed');
    } finally { setBusy(false); }
  };

  const unregister = async (id: string) => {
    await factoryInvoke('hotkeyUnregister', { id });
    await refetch();
  };

  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Keyboard size={14} /> Global Hotkeys
          <Badge variant="outline" color={state.available ? '#10B981' : '#64748B'}>
            {state.available ? 'uiohook ready' : 'not installed'}
          </Badge>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
            {state.hotkeys.length} registered
          </span>
        </h3>
        <button type="button" onClick={refetch}
          style={{ background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 4, padding: '3px 8px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <RefreshCw size={11} /> refresh
        </button>
      </div>

      {!state.available && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
          Install with <code style={{ background: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 3 }}>pnpm run install:native uiohook</code>.
          Needs VS Build Tools on Windows.
        </div>
      )}
      {error && <div style={{ fontSize: 11, color: '#FCA5A5', marginBottom: 8 }}>{error}</div>}

      {/* Register form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pattern</span>
          <input value={pattern} onChange={(e) => setPattern(e.target.value)}
            placeholder="Ctrl+Shift+D"
            style={{ padding: 6, fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: 4 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Flow</span>
          <select value={flow} onChange={(e) => setFlow(e.target.value)}
            style={{ padding: 6, fontSize: 12, background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: 4 }}>
            {(flows.length ? flows : ['heartbeatPulse']).map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <button type="button" onClick={register} disabled={busy || !state.available}
          style={{ padding: '6px 12px', fontSize: 12, borderRadius: 4, background: state.available ? 'var(--color-brand-electric)' : 'var(--surface-raised)', color: state.available ? '#000' : 'var(--text-muted)', border: 'none', cursor: (busy || !state.available) ? 'wait' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={12} /> register
        </button>
      </div>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Input (JSON passed to flow)</span>
        <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} rows={3}
          style={{ padding: 6, fontFamily: 'var(--font-mono)', fontSize: 11, background: 'var(--surface-sunken)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: 4, resize: 'vertical' }} />
      </label>
      {formErr && <div style={{ fontSize: 11, color: '#FCA5A5', marginTop: 4 }}>{formErr}</div>}

      {/* Registered list */}
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 4px' }}>
        Active
      </div>
      {state.hotkeys.length === 0 ? (
        <EmptyState title={loading ? 'Loading…' : 'No hotkeys registered'} description={state.available ? '' : undefined} />
      ) : (
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {state.hotkeys.map((h) => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{h.pattern}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: 8 }}>{h.id.slice(0, 16)}…</span>
              <button type="button" onClick={() => unregister(h.id)}
                title="Unregister"
                style={{ background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 3, padding: '2px 6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
