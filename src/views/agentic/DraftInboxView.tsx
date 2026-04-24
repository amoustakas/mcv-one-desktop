// src/views/agentic/DraftInboxView.tsx
//
// Agentic OS · Layer 4 · Draft Inbox
//
// Two-pane review cockpit:
//   Left: selectable list of pending drafts (j/k navigation, / to filter)
//   Right: title + summary + body markdown + metadata chips + context refs
//   Footer: keyboard hint strip (a approve, r reject, e edit, ? help)
//
// Keyboard flow scoped via use-inbox-hotkeys (document-level, mount-driven).
// Approve/reject emit agentic.draft.{approved,rejected} events visible live
// in EventStreamView — the cross-system loop the Waterloo demo closes with.

import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Inbox, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Button } from '../../components/ui';
import { useAgenticInboxStore, type AgentDraft, type DraftType } from '../../stores/agentic-inbox';
import { useInboxHotkeys } from './use-inbox-hotkeys';

const DRAFT_TYPE_LABELS: Record<DraftType, string> = {
  nda: 'NDA',
  ip_filing: 'IP filing',
  domain_acquisition: 'Domain acq.',
  contract_redline: 'Redline',
  investor_update: 'Investor update',
  counsel_engagement_letter: 'Engagement letter',
  entity_formation: 'Entity formation',
};

const DRAFT_TYPE_COLORS: Record<DraftType, string> = {
  nda: '#00F5FF',
  ip_filing: '#8B5CF6',
  domain_acquisition: '#F59E0B',
  contract_redline: '#EF4444',
  investor_update: '#10B981',
  counsel_engagement_letter: '#6366F1',
  entity_formation: '#EC4899',
};

export default function DraftInboxView() {
  const { drafts, selectedDraftId, loading, error, fetchDrafts, selectDraft, editDraft } =
    useAgenticInboxStore();
  const approveDraft = useAgenticInboxStore((s) => s.approveDraft);
  const rejectDraft = useAgenticInboxStore((s) => s.rejectDraft);

  const [filter, setFilter] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editBody, setEditBody] = useState('');
  const filterRef = useRef<HTMLInputElement>(null);

  useEffect(() => { void fetchDrafts(); }, [fetchDrafts]);

  const pending = useMemo(
    () => drafts.filter((d) => d.status === 'pending'),
    [drafts],
  );
  const visible = useMemo(() => {
    const base = showAll ? drafts : pending;
    const q = filter.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.emitter_agent.toLowerCase().includes(q),
    );
  }, [drafts, pending, showAll, filter]);

  const selected = drafts.find((d) => d.id === selectedDraftId) ?? null;

  useInboxHotkeys({
    selected,
    approveDraft,
    rejectDraft,
    setEditMode: (v) => {
      setEditMode(v);
      if (v && selected) setEditBody(selected.body_md);
    },
    setHelpOpen,
    focusFilter: () => filterRef.current?.focus(),
  });

  const handleSaveEdit = async () => {
    if (!selected) return;
    await editDraft(selected.id, editBody);
    setEditMode(false);
  };

  return (
    <PageShell>
      <PageHeader
        title="Draft Inbox"
        subtitle={`${pending.length} pending · ${drafts.length - pending.length} decided`}
        icon={<Inbox size={20} />}
      >
        <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show pending only' : 'Show all'}
        </Button>
      </PageHeader>

      {error && (
        <GlassCard style={{ padding: 12, marginBottom: 16, borderColor: 'var(--error)' }}>
          <span style={{ color: 'var(--error)' }}>{error}</span>
        </GlassCard>
      )}

      <div style={{ marginBottom: 10 }}>
        <input
          ref={filterRef}
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter drafts (title / summary / agent) — press / to focus"
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16, minHeight: '60vh' }}>
        {/* ─── Left pane: list ───────────────────────────────────────── */}
        <GlassCard style={{ padding: 0, overflow: 'auto', maxHeight: '70vh' }}>
          {visible.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {loading
                ? 'Loading drafts…'
                : pending.length === 0
                  ? 'No drafts pending. All caught up.'
                  : 'No drafts match that filter.'}
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {visible.map((d) => {
                const isSelected = d.id === selectedDraftId;
                return (
                  <li
                    key={d.id}
                    onClick={() => selectDraft(d.id)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderLeft: `3px solid ${isSelected ? DRAFT_TYPE_COLORS[d.draft_type] : 'transparent'}`,
                      background: isSelected ? 'rgba(0,245,255,0.06)' : 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 120ms',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                      <span style={{
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        color: DRAFT_TYPE_COLORS[d.draft_type],
                        fontWeight: 600,
                      }}>
                        {DRAFT_TYPE_LABELS[d.draft_type]}
                      </span>
                      <StatusTag status={d.status} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: 'var(--text-primary)' }}>
                      {d.title}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginTop: 4,
                      display: 'flex',
                      gap: 8,
                    }}>
                      <span>@{d.emitter_agent}</span>
                      {d.target_venture && <span>· {d.target_venture}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        {/* ─── Right pane: detail ────────────────────────────────────── */}
        <GlassCard style={{ padding: 20, overflow: 'auto', maxHeight: '70vh' }}>
          {!selected ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40, fontSize: 13 }}>
              Select a draft on the left to review.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <Chip color={DRAFT_TYPE_COLORS[selected.draft_type]}>
                  {DRAFT_TYPE_LABELS[selected.draft_type]}
                </Chip>
                <Chip color="#8B5CF6">@{selected.emitter_agent}</Chip>
                {selected.target_venture && <Chip color="#00F5FF">{selected.target_venture}</Chip>}
                <StatusTag status={selected.status} />
              </div>
              <h2 style={{ margin: '8px 0 6px 0', fontSize: 20, color: 'var(--text-primary)' }}>
                {selected.title}
              </h2>
              <p style={{ margin: '0 0 16px 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selected.summary}
              </p>

              {editMode ? (
                <div>
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        void handleSaveEdit();
                      } else if (e.key === 'Escape') {
                        setEditMode(false);
                      }
                    }}
                    autoFocus
                    style={{
                      width: '100%',
                      minHeight: 260,
                      padding: 12,
                      background: 'var(--surface-base)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 6,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      lineHeight: 1.5,
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Button variant="primary" onClick={() => void handleSaveEdit()}>
                      Save &amp; mark edited (⌘↵)
                    </Button>
                    <Button variant="ghost" onClick={() => setEditMode(false)}>
                      Cancel (Esc)
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: 16,
                  background: 'var(--surface-base)',
                  borderRadius: 6,
                  border: '1px solid var(--border-subtle)',
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                }}>
                  <ReactMarkdown>{selected.body_md}</ReactMarkdown>
                </div>
              )}

              {Array.isArray(selected.context_refs) && selected.context_refs.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h4 style={{
                    margin: '0 0 6px 0',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    color: 'var(--text-muted)',
                  }}>
                    Context references
                  </h4>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selected.context_refs.map((ref, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '3px 8px',
                          fontSize: 11,
                          background: 'var(--surface-raised)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 4,
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {ref.kind}: {ref.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selected.status === 'pending' && !editMode && (
                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                  <Button variant="primary" onClick={() => void approveDraft(selected.id)}>
                    <CheckCircle2 size={14} style={{ marginRight: 4 }} /> Approve (a)
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      const reason = window.prompt('Reject reason (optional):') ?? undefined;
                      void rejectDraft(selected.id, reason);
                    }}
                  >
                    <XCircle size={14} style={{ marginRight: 4 }} /> Reject (r)
                  </Button>
                  <Button variant="ghost" onClick={() => { setEditMode(true); setEditBody(selected.body_md); }}>
                    <Pencil size={14} style={{ marginRight: 4 }} /> Edit (e)
                  </Button>
                </div>
              )}
            </>
          )}
        </GlassCard>
      </div>

      {/* Keyboard hint strip */}
      <div style={{
        marginTop: 12,
        fontSize: 11,
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        display: 'flex',
        gap: 18,
        justifyContent: 'center',
      }}>
        <span><kbd>j</kbd>/<kbd>k</kbd> nav</span>
        <span><kbd>a</kbd> approve</span>
        <span><kbd>r</kbd> reject</span>
        <span><kbd>e</kbd> edit</span>
        <span><kbd>/</kbd> filter</span>
        <span><kbd>?</kbd> help</span>
      </div>

      {helpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setHelpOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000,
          }}
        >
          <GlassCard
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            style={{ padding: 24, minWidth: 360, maxWidth: 460 }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Keyboard shortcuts</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 13, lineHeight: 1.9 }}>
              <li><kbd>j</kbd> / <kbd>k</kbd> — next / previous draft</li>
              <li><kbd>a</kbd> — approve selected</li>
              <li><kbd>r</kbd> — reject selected (prompt for reason)</li>
              <li><kbd>e</kbd> — edit body (⌘↵ to save, Esc to cancel)</li>
              <li><kbd>/</kbd> — focus filter input</li>
              <li><kbd>?</kbd> — toggle this help</li>
              <li><kbd>Esc</kbd> — close edit / help</li>
            </ul>
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <Button variant="ghost" onClick={() => setHelpOpen(false)}>Close</Button>
            </div>
          </GlassCard>
        </div>
      )}
    </PageShell>
  );
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 10,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: 600,
      background: `${color}22`,
      color,
      border: `1px solid ${color}55`,
    }}>
      {children}
    </span>
  );
}

function StatusTag({ status }: { status: AgentDraft['status'] }) {
  const map: Record<AgentDraft['status'], { color: string; label: string }> = {
    pending:  { color: '#F59E0B', label: 'pending' },
    approved: { color: '#10B981', label: 'approved' },
    rejected: { color: '#EF4444', label: 'rejected' },
    edited:   { color: '#8B5CF6', label: 'edited' },
  };
  const { color, label } = map[status];
  return <Chip color={color}>{label}</Chip>;
}
