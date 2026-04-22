// Schedule / list / run / delete jobs against the Factory's persistent
// queue. Mirror of /jobs REST; every action round-trips through the
// cockpit proxy and lands back in the SSE feed via factory.job.* events.

import { useMemo, useState } from 'react';
import {
  Play, Trash2, Plus, Clock, CheckCircle2, CircleDashed, PauseCircle, ChevronDown, ChevronRight,
} from 'lucide-react';
import { GlassCard, Badge, EmptyState, Modal } from '../ui';
import { useFactoryJobs } from '../../hooks/use-factory-jobs';
import { useFactoryFlows } from '../../hooks/use-factory';
import type { FactoryJob } from '../../lib/factory-client';

const CRON_PRESETS: Array<{ label: string; cron: string }> = [
  { label: 'every 15 min', cron: '*/15 * * * *' },
  { label: 'every 30 min', cron: '*/30 * * * *' },
  { label: 'hourly',       cron: '0 * * * *' },
  { label: 'every 4 hrs',  cron: '0 */4 * * *' },
  { label: 'daily 02:15',  cron: '15 2 * * *' },
  { label: 'weekly Mon 09:00', cron: '0 9 * * 1' },
];

function JobRow({ job, onRun, onRemove }: {
  job: FactoryJob;
  onRun: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const tagStr = job.tags.length ? job.tags.join(' · ') : '';
  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)', padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {job.enabled
          ? <CheckCircle2 size={12} color="#10B981" />
          : <PauseCircle size={12} color="#64748B" />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {job.flow} {job.cron ? `· ${job.cron}` : '· one-shot'}
            {tagStr ? ` · ${tagStr}` : ''}
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={async () => { setBusy(true); try { await onRun(job.id); } finally { setBusy(false); } }}
          title="Run now"
          style={{
            background: 'transparent', border: '1px solid var(--border-default)',
            borderRadius: 4, padding: '4px 8px', cursor: busy ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-primary)',
          }}
        >
          {busy ? <CircleDashed size={11} /> : <Play size={11} />} run
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => { setBusy(true); try { await onRemove(job.id); } finally { setBusy(false); } }}
          title="Delete"
          style={{
            background: 'transparent', border: '1px solid var(--border-default)',
            borderRadius: 4, padding: '4px 8px', cursor: busy ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', color: 'var(--text-muted)',
          }}
        >
          <Trash2 size={11} />
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 8, paddingLeft: 24, fontSize: 11 }}>
          <details open>
            <summary style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>input</summary>
            <pre style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              background: 'var(--surface-sunken)', padding: 8, borderRadius: 4,
              marginTop: 4, overflowX: 'auto',
            }}>{JSON.stringify(job.input, null, 2)}</pre>
          </details>
          <div style={{ marginTop: 6, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            id: {job.id} · retries: {job.maxRetries}
            {job.nextRunAt && ` · nextRunAt: ${job.nextRunAt}`}
            {job.timezone && ` · tz: ${job.timezone}`}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleModal({ open, onClose, onSubmit, flows }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: Parameters<ReturnType<typeof useFactoryJobs>['schedule']>[0]) => Promise<void>;
  flows: string[];
}) {
  const [name, setName] = useState('');
  const [flow, setFlow] = useState('heartbeatPulse');
  const [cronInput, setCronInput] = useState('*/15 * * * *');
  const [mode, setMode] = useState<'cron' | 'oneshot'>('cron');
  const [nextRunAt, setNextRunAt] = useState(() => new Date(Date.now() + 60_000).toISOString());
  const [inputJson, setInputJson] = useState('{"emit": false}');
  const [tagsCsv, setTagsCsv] = useState('manual');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    let input: Record<string, unknown>;
    try { input = JSON.parse(inputJson || '{}'); }
    catch (e) { setErr('Input JSON invalid: ' + (e as Error).message); return; }
    if (!name.trim()) { setErr('Name is required'); return; }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        flow,
        input,
        cron: mode === 'cron' ? cronInput : null,
        nextRunAt: mode === 'oneshot' ? nextRunAt : null,
        enabled: true,
        maxRetries: 2,
        tags: tagsCsv.split(',').map(s => s.trim()).filter(Boolean),
      });
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} size="md" ariaLabel="Schedule Factory job">
      <div style={{ display: 'grid', gap: 12, padding: 4 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. nightly prospect refresh"
            style={{ padding: 6, fontSize: 13, borderRadius: 4, background: 'var(--surface-raised)',
                     color: 'var(--text-primary)', border: '1px solid var(--border-default)' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Flow</span>
          <select value={flow} onChange={e => setFlow(e.target.value)}
            style={{ padding: 6, fontSize: 13, borderRadius: 4, background: 'var(--surface-raised)',
                     color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}>
            {flows.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setMode('cron')}
            style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4,
                     background: mode === 'cron' ? 'var(--color-brand-electric)' : 'transparent',
                     color: mode === 'cron' ? '#000' : 'var(--text-primary)',
                     border: '1px solid var(--border-default)', cursor: 'pointer' }}>
            cron
          </button>
          <button type="button" onClick={() => setMode('oneshot')}
            style={{ padding: '4px 10px', fontSize: 12, borderRadius: 4,
                     background: mode === 'oneshot' ? 'var(--color-brand-electric)' : 'transparent',
                     color: mode === 'oneshot' ? '#000' : 'var(--text-primary)',
                     border: '1px solid var(--border-default)', cursor: 'pointer' }}>
            one-shot
          </button>
        </div>
        {mode === 'cron' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cron expression</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              {CRON_PRESETS.map(p => (
                <button key={p.cron} type="button" onClick={() => setCronInput(p.cron)}
                  style={{ padding: '3px 8px', fontSize: 11, borderRadius: 3,
                           background: cronInput === p.cron ? 'rgba(0,240,255,0.1)' : 'transparent',
                           color: cronInput === p.cron ? 'var(--color-brand-electric)' : 'var(--text-muted)',
                           border: '1px solid var(--border-default)', cursor: 'pointer' }}>
                  {p.label}
                </button>
              ))}
            </div>
            <input value={cronInput} onChange={e => setCronInput(e.target.value)}
              style={{ padding: 6, fontFamily: 'var(--font-mono)', fontSize: 13, borderRadius: 4,
                       background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }} />
          </div>
        ) : (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Next run (ISO)</span>
            <input value={nextRunAt} onChange={e => setNextRunAt(e.target.value)}
              style={{ padding: 6, fontFamily: 'var(--font-mono)', fontSize: 12, borderRadius: 4,
                       background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }} />
          </label>
        )}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Input (JSON)</span>
          <textarea value={inputJson} onChange={e => setInputJson(e.target.value)} rows={6}
            style={{ padding: 8, fontFamily: 'var(--font-mono)', fontSize: 12, borderRadius: 4,
                     background: 'var(--surface-sunken)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', resize: 'vertical' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tags (comma-separated)</span>
          <input value={tagsCsv} onChange={e => setTagsCsv(e.target.value)}
            style={{ padding: 6, fontSize: 12, borderRadius: 4,
                     background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }} />
        </label>
        {err && <div style={{ fontSize: 11, color: '#FCA5A5' }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} disabled={submitting}
            style={{ padding: '6px 12px', fontSize: 13, borderRadius: 4,
                     background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-default)', cursor: 'pointer' }}>
            cancel
          </button>
          <button type="button" onClick={submit} disabled={submitting}
            style={{ padding: '6px 14px', fontSize: 13, borderRadius: 4,
                     background: 'var(--color-brand-electric)', color: '#000', border: 'none', cursor: submitting ? 'wait' : 'pointer', fontWeight: 600 }}>
            {submitting ? 'saving…' : 'schedule'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function FactoryJobsPanel() {
  const { jobs, loading, error, refetch, schedule, remove, runNow } = useFactoryJobs({ intervalMs: 15_000 });
  const { flows } = useFactoryFlows();
  const [modalOpen, setModalOpen] = useState(false);

  const counts = useMemo(() => {
    const total = jobs.length;
    const enabled = jobs.filter(j => j.enabled).length;
    const cron = jobs.filter(j => !!j.cron).length;
    const oneShot = total - cron;
    return { total, enabled, cron, oneShot };
  }, [jobs]);

  return (
    <>
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14} /> Scheduled jobs
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
              {counts.enabled}/{counts.total} enabled · {counts.cron} cron · {counts.oneShot} one-shot
            </span>
          </h3>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={refetch}
              style={{ padding: '4px 10px', fontSize: 11, borderRadius: 4,
                       background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-default)', cursor: 'pointer' }}>
              refresh
            </button>
            <button type="button" onClick={() => setModalOpen(true)}
              style={{ padding: '4px 10px', fontSize: 12, fontWeight: 600, borderRadius: 4,
                       background: 'var(--color-brand-electric)', color: '#000', border: 'none', cursor: 'pointer',
                       display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={12} /> schedule
            </button>
          </div>
        </div>
        {error && <Badge variant="outline" color="#EF4444">{error}</Badge>}
        {jobs.length === 0 ? (
          <EmptyState
            title={loading ? 'Loading jobs…' : 'No jobs scheduled'}
            description={loading ? '' : 'Click Schedule to add your first cron or one-shot job.'}
          />
        ) : (
          <div style={{ borderTop: '1px solid var(--border-subtle)', maxHeight: 480, overflowY: 'auto' }}>
            {jobs.map(j => (
              <JobRow
                key={j.id}
                job={j}
                onRun={async (id) => { await runNow(id); }}
                onRemove={async (id) => { await remove(id); }}
              />
            ))}
          </div>
        )}
      </GlassCard>
      <ScheduleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (input) => { await schedule(input); }}
        flows={flows}
      />
    </>
  );
}
