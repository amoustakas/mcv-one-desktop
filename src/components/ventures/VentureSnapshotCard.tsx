import { useEffect, useState } from 'react';
import { Activity, Package, Globe, FileText, Target, Shield, MessageSquare, Check } from 'lucide-react';
import { GlassCard, Button } from '../ui';
import { apiPost } from '../../lib/api/client';
import { summarizeSnapshot, healthColor, type SnapshotSummary } from '../../lib/ventures/snapshot';
import type { Venture } from '../../lib/ventures';
import { useNavigation } from '../../stores/navigation';
import { useChatStore } from '../../stores/chat';

interface UnconfirmedAsset {
  id: string;
  kind: string;
  name: string;
  url?: string | null;
  tier: number;
}

// Human-visible rendering of the same composite state the venture_snapshot
// NAOS tool returns — reuses summarizeSnapshot() so the health-score math
// stays in one place. If this card and the tool ever diverge on what "health"
// means, users and agents will disagree on launch-readiness.

type VentureRow = { id: string; name: string; tier?: number; clerk_org_id?: string | null; status?: string };
type AssetRow = { id: string; tier: number; confirmed: boolean };
type DomainRow = { host: string; status?: string };
type DocRow = { department: string; status: string };
type QuestRow = { effective_status?: string };

interface Props {
  venture: Venture;
}

export default function VentureSnapshotCard({ venture }: Props) {
  const [summary, setSummary] = useState<SnapshotSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chatDocked = useNavigation(s => s.chatDocked);
  const toggleChatDock = useNavigation(s => s.toggleChatDock);
  const setChatVenture = useNavigation(s => s.setChatVenture);
  const setInputText = useChatStore(s => s.setInputText);

  // Inline asset confirmation picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState<UnconfirmedAsset[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set());

  async function openConfirmPicker() {
    if (pickerOpen) { setPickerOpen(false); return; }
    setPickerOpen(true);
    setPickerLoading(true);
    try {
      const data = await apiPost<{ assets: (UnconfirmedAsset & { confirmed: boolean })[] }>(
        '/api/ventures',
        { action: 'list-assets', venture_id: venture.id },
      );
      setPending((data.assets || []).filter(a => !a.confirmed));
    } catch {
      setPending([]);
    } finally {
      setPickerLoading(false);
    }
  }

  async function confirmOne(id: string) {
    if (confirmingIds.has(id)) return;
    setConfirmingIds(prev => new Set(prev).add(id));
    try {
      await apiPost('/api/ventures', { action: 'confirm-asset', id, confirmed: true });
      // Optimistic: remove from pending list + bump summary counts so the
      // card's tile updates immediately. Backend quest/stats refresh happens
      // via list-snapshots next time the view reloads.
      setPending(prev => prev.filter(a => a.id !== id));
      setSummary(prev => prev ? {
        ...prev,
        assets: {
          ...prev.assets,
          confirmed: prev.assets.confirmed + 1,
          discovered: Math.max(0, prev.assets.discovered - 1),
        },
      } : prev);
    } catch {
      // leave in list so user can retry
    } finally {
      setConfirmingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function confirmAll() {
    const ids = pending.map(a => a.id);
    for (const id of ids) {
      // sequential to avoid slamming /api/ventures; ids.length usually small
      // eslint-disable-next-line no-await-in-loop
      await confirmOne(id);
    }
    setPickerOpen(false);
  }

  // "Ask Aegis" — pre-scopes the chat to this venture, pre-fills the prompt
  // with a question grounded in the live snapshot, and opens the chat dock
  // if it isn't already. User hits Enter to send. Uses existing chat store +
  // nav primitives rather than a new chat surface.
  function askAegisAboutVenture() {
    if (!summary) return;
    setChatVenture(venture.id);
    const prompt = buildSnapshotPrompt(venture, summary);
    setInputText(prompt);
    if (!chatDocked) toggleChatDock();
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [vRes, assets, domains, docs, quests] = await Promise.all([
          apiPost<{ venture: VentureRow }>('/api/ventures', { action: 'get', id: venture.id }),
          apiPost<{ assets: AssetRow[] }>('/api/ventures', { action: 'list-assets', venture_id: venture.id }),
          apiPost<{ domains: DomainRow[] }>('/api/ventures', { action: 'list-domains', venture_id: venture.id }),
          apiPost<{ docs: DocRow[] }>('/api/ventures', { action: 'list-docs', venture_id: venture.id }),
          apiPost<{ quests: QuestRow[] }>('/api/ventures', { action: 'list-quests', venture_id: venture.id }),
        ]);
        if (cancelled) return;
        setSummary(summarizeSnapshot({
          venture: vRes.venture,
          assets: assets.assets || [],
          domains: domains.domains || [],
          docs: docs.docs || [],
          quests: quests.quests || [],
        }));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load snapshot');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [venture.id]);

  if (loading) {
    return (
      <GlassCard className="vsc-card">
        <div className="vsc-loading">Loading venture snapshot…</div>
        <style>{styles}</style>
      </GlassCard>
    );
  }

  if (error || !summary) {
    return (
      <GlassCard className="vsc-card">
        <div className="vsc-error">Snapshot unavailable: {error || 'no data'}</div>
        <style>{styles}</style>
      </GlassCard>
    );
  }

  const ringColor = healthColor(summary.health_score);
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference * (1 - summary.health_score / 100);

  return (
    <GlassCard className="vsc-card">
      <div className="vsc-head">
        <div className="vsc-title">
          <Activity size={14} style={{ color: 'var(--cyan)' }} />
          <span>Venture Snapshot</span>
        </div>
        <div className="vsc-meta">
          {summary.tier && <span className="vsc-chip">Tier {summary.tier}</span>}
          <span className={`vsc-chip vsc-status-${summary.status}`}>{summary.status}</span>
          {summary.clerk_provisioned && <span className="vsc-chip vsc-chip-success">Dedicated Org</span>}
        </div>
      </div>

      <div className="vsc-body">
        <div className="vsc-health">
          <svg className="vsc-ring" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-input)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={ringColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="vsc-health-center">
            <div className="vsc-health-val" style={{ color: ringColor }}>{summary.health_score}</div>
            <div className="vsc-health-label">Health</div>
          </div>
        </div>

        <div className="vsc-tiles">
          <Tile
            icon={<Target size={13} />} label="Quests"
            primary={`${summary.quests.done}/${summary.quests.total}`}
            secondary={`${summary.quests.pct}% · ${summary.quests.in_progress} active`}
            accent="var(--cyan)"
          />
          <Tile
            icon={<Package size={13} />} label="Assets"
            primary={`${summary.assets.confirmed}`}
            secondary={summary.assets.discovered > 0 ? `+${summary.assets.discovered} to confirm` : 'all confirmed'}
            accent="#8B5CF6"
          />
          <Tile
            icon={<Globe size={13} />} label="Domains"
            primary={`${summary.domains.verified}/${summary.domains.total}`}
            secondary={summary.domains.pending > 0 ? `${summary.domains.pending} pending DNS` : 'all verified'}
            accent="#10B981"
          />
          <Tile
            icon={<FileText size={13} />} label="Docs"
            primary={`${summary.docs.total}`}
            secondary={Object.keys(summary.docs.byDept).length
              ? `${Object.keys(summary.docs.byDept).length} depts covered`
              : 'run apply_templates'}
            accent="#F59E0B"
          />
        </div>
      </div>

      {summary.assets.discovered > 0 && (
        <div className="vsc-confirm-row">
          <button className="vsc-confirm-toggle" onClick={openConfirmPicker} type="button">
            <Package size={11} />
            <span>
              <strong>{summary.assets.discovered}</strong> discovered asset{summary.assets.discovered === 1 ? '' : 's'} awaiting confirmation
            </span>
            <span className="vsc-confirm-cta">{pickerOpen ? 'Collapse' : 'Review'}</span>
          </button>
        </div>
      )}

      {pickerOpen && (
        <div className="vsc-picker" role="region" aria-label="Confirm discovered assets">
          {pickerLoading && <div className="vsc-picker-loading">Loading discoveries…</div>}
          {!pickerLoading && pending.length === 0 && (
            <div className="vsc-picker-empty">No unconfirmed assets remain — refresh the page to recount.</div>
          )}
          {!pickerLoading && pending.length > 0 && (
            <>
              <div className="vsc-picker-head">
                <span>{pending.length} to review · click to confirm</span>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Check size={11} />}
                  onClick={confirmAll}
                  disabled={confirmingIds.size > 0}
                >
                  Confirm all
                </Button>
              </div>
              <div className="vsc-picker-chips">
                {pending.map(a => (
                  <button
                    key={a.id}
                    className="vsc-picker-chip"
                    onClick={() => confirmOne(a.id)}
                    disabled={confirmingIds.has(a.id)}
                    title={a.url || `${a.kind} · tier ${a.tier}`}
                  >
                    <span className="vsc-chip-kind">{a.kind}</span>
                    <span className="vsc-chip-name">{a.name}</span>
                    <span className="vsc-chip-action">
                      {confirmingIds.has(a.id) ? '…' : <Check size={11} />}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="vsc-footer">
        <div className="vsc-weights">
          <Shield size={11} style={{ color: 'var(--text-muted)' }} />
          <span>Health is 40% quests · 25% assets · 20% docs · 15% domains</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          icon={<MessageSquare size={12} />}
          onClick={askAegisAboutVenture}
          title="Ask Aegis about this venture with live snapshot context"
        >
          Ask Aegis
        </Button>
      </div>

      <style>{styles}</style>
    </GlassCard>
  );
}

function buildSnapshotPrompt(venture: Venture, s: SnapshotSummary): string {
  const tier = s.tier ? `Tier ${s.tier}` : 'Tier unset';
  const clerk = s.clerk_provisioned ? 'dedicated Clerk tenant' : 'shared root org';
  const depts = Object.entries(s.docs.byDept).map(([d, n]) => `${d}=${n}`).join(', ') || 'no docs yet';

  return `About **${venture.name}** (${venture.id}) — current snapshot:
- Health: ${s.health_score}/100 · ${tier} · ${s.status} · ${clerk}
- Quests: ${s.quests.done}/${s.quests.total} done (${s.quests.pct}%), ${s.quests.in_progress} in-progress
- Assets: ${s.assets.confirmed} confirmed, ${s.assets.discovered} pending review
- Domains: ${s.domains.verified} verified, ${s.domains.pending} pending DNS
- Docs: ${s.docs.total} total across ${Object.keys(s.docs.byDept).length} depts (${depts})

Based on this state, what are the 3 highest-leverage things I should tackle next for ${venture.name}? Consult the relevant departments if helpful.`;
}

function Tile({ icon, label, primary, secondary, accent }: { icon: React.ReactNode; label: string; primary: string; secondary: string; accent: string }) {
  return (
    <div className="vsc-tile">
      <div className="vsc-tile-head" style={{ color: accent }}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="vsc-tile-primary">{primary}</div>
      <div className="vsc-tile-secondary">{secondary}</div>
    </div>
  );
}

const styles = `
  .vsc-card { padding: 14px 16px; display: flex; flex-direction: column; gap: 14px; }
  .vsc-loading, .vsc-error { font-size: 12px; color: var(--text-muted); text-align: center; padding: 24px; }
  .vsc-error { color: var(--danger); }
  .vsc-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .vsc-title { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--text-primary); font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.08em; }
  .vsc-meta { display: flex; gap: 6px; flex-wrap: wrap; }
  .vsc-chip { font-size: 10px; padding: 2px 8px; border-radius: var(--radius-full); background: var(--bg-input); color: var(--text-secondary); font-family: var(--font-mono); text-transform: lowercase; }
  .vsc-chip-success { background: rgba(16, 185, 129, 0.16); color: #10B981; }
  .vsc-body { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
  .vsc-health { position: relative; width: 88px; height: 88px; flex-shrink: 0; }
  .vsc-ring { width: 100%; height: 100%; }
  .vsc-health-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .vsc-health-val { font-size: 22px; font-weight: 800; font-family: var(--font-display); line-height: 1; }
  .vsc-health-label { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
  .vsc-tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; flex: 1; min-width: 240px; }
  .vsc-tile { padding: 8px 10px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 2px; }
  .vsc-tile-head { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  .vsc-tile-primary { font-size: 16px; font-weight: 700; color: var(--text-primary); font-family: var(--font-display); line-height: 1.2; }
  .vsc-tile-secondary { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
  .vsc-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 8px; border-top: 1px solid var(--border); flex-wrap: wrap; }
  .vsc-weights { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); flex: 1; min-width: 200px; }
  .vsc-confirm-row { padding: 2px 0; }
  .vsc-confirm-toggle { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 10px; background: rgba(139, 92, 246, 0.08); border: 1px dashed rgba(139, 92, 246, 0.35); color: var(--text-secondary); font-size: 12px; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.12s; text-align: left; }
  .vsc-confirm-toggle:hover { background: rgba(139, 92, 246, 0.16); border-color: rgba(139, 92, 246, 0.6); color: var(--text-primary); }
  .vsc-confirm-toggle strong { color: var(--text-primary); font-weight: 700; font-family: var(--font-mono); }
  .vsc-confirm-toggle svg { color: #8B5CF6; flex-shrink: 0; }
  .vsc-confirm-toggle > span:first-of-type { flex: 1; }
  .vsc-confirm-cta { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #8B5CF6; font-family: var(--font-display); }
  .vsc-picker { padding: 10px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 8px; animation: vsc-picker-in 0.15s ease-out; }
  @keyframes vsc-picker-in { from { transform: translateY(-4px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .vsc-picker-loading, .vsc-picker-empty { padding: 8px; font-size: 11px; color: var(--text-muted); text-align: center; }
  .vsc-picker-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); font-family: var(--font-display); }
  .vsc-picker-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .vsc-picker-chip { display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-full); color: var(--text-secondary); font-size: 11px; cursor: pointer; transition: all 0.12s; max-width: 100%; }
  .vsc-picker-chip:hover:not(:disabled) { border-color: #10B981; color: var(--text-primary); background: rgba(16, 185, 129, 0.10); }
  .vsc-picker-chip:disabled { opacity: 0.55; cursor: wait; }
  .vsc-chip-kind { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); font-family: var(--font-mono); }
  .vsc-chip-name { font-weight: 600; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vsc-chip-action { display: flex; align-items: center; color: #10B981; }
`;
