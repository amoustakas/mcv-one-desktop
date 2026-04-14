import { useState } from 'react';
import {
  History, Layers, Lock, Shield, X, Loader2, Plus, Trash2, RotateCcw, AlertTriangle,
} from 'lucide-react';
import { GlassCard, Badge, Button, Input } from '../ui';
import { useFileVersions, useFileCompartments, useAddCompartment, useRemoveCompartment, useLegalHold, useAuditLog } from '../../hooks/use-storage-meta';
import { ventures } from '../../lib/ventures';
import { useToast } from '../Toasts';

// ---------------------------------------------------------------------------
// FileGovernancePanel — Slide-in panel for file versioning, compartments,
// legal holds, and audit trail. Used in FilesView and Knowledge Hub.
// ---------------------------------------------------------------------------

interface Props {
  fileId: string | null;
  fileName?: string;
  currentCertification?: string;
  onClose: () => void;
}

export default function FileGovernancePanel({ fileId, fileName, currentCertification, onClose }: Props) {
  const { addToast } = useToast();
  const [tab, setTab] = useState<'versions' | 'compartments' | 'legal' | 'audit'>('versions');

  const versions = useFileVersions(fileId || undefined);
  const compartments = useFileCompartments(fileId || undefined);
  const audit = useAuditLog({ fileId: fileId || undefined, limit: 50 });

  const addCompartment = useAddCompartment();
  const removeCompartment = useRemoveCompartment();
  const legalHold = useLegalHold();

  const [newVentureId, setNewVentureId] = useState('');
  const [newAccessLevel, setNewAccessLevel] = useState<'venture' | 'internal' | 'shared' | 'private'>('venture');

  const [holdReason, setHoldReason] = useState('');
  const isOnHold = currentCertification === 'legal-hold';

  if (!fileId) return null;

  const handleAddCompartment = async () => {
    if (!newVentureId) return;
    try {
      await addCompartment.mutateAsync({ file_id: fileId, venture_id: newVentureId, access_level: newAccessLevel });
      addToast({ type: 'success', message: `Added to ${newVentureId}` });
      setNewVentureId('');
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    }
  };

  const handleRemoveCompartment = async (compartmentId: string) => {
    try {
      await removeCompartment.mutateAsync({ file_id: fileId, compartment_id: compartmentId });
      addToast({ type: 'success', message: 'Compartment removed' });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    }
  };

  const handleLegalHold = async () => {
    try {
      await legalHold.mutateAsync({ file_id: fileId, hold: !isOnHold, reason: holdReason });
      addToast({
        type: 'success',
        message: isOnHold ? 'Legal hold released' : 'File placed on legal hold',
      });
      setHoldReason('');
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    }
  };

  const TABS = [
    { id: 'versions', label: 'Versions', icon: History, count: versions.data?.versions?.length ?? 0 },
    { id: 'compartments', label: 'Compartments', icon: Layers, count: compartments.data?.compartments?.length ?? 0 },
    { id: 'legal', label: 'Legal Hold', icon: Shield },
    { id: 'audit', label: 'Audit', icon: AlertTriangle, count: audit.data?.entries?.length ?? 0 },
  ] as const;

  return (
    <div className="fgp-overlay" onClick={onClose}>
      <div className="fgp-panel" onClick={(e) => e.stopPropagation()}>
        <div className="fgp-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>File Governance</h3>
            {fileName && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{fileName}</p>}
          </div>
          <button className="fgp-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="fgp-tabs">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className={`fgp-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <Icon size={12} />
                <span>{t.label}</span>
                {'count' in t && typeof t.count === 'number' && <Badge>{t.count}</Badge>}
              </button>
            );
          })}
        </div>

        <div className="fgp-body">
          {/* Versions */}
          {tab === 'versions' && (
            <>
              {versions.isLoading ? (
                <div className="fgp-loading"><Loader2 size={14} className="mcv-spin" /> Loading versions...</div>
              ) : !versions.data?.versions?.length ? (
                <p className="fgp-empty">No versions yet. New versions are created automatically on file updates.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {versions.data.versions.map((v) => {
                    const version = v as Record<string, unknown>;
                    return (
                      <div key={String(version.id)} className="fgp-row">
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>v{String(version.version_number)}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {version.created_at ? new Date(String(version.created_at)).toLocaleString() : '—'}
                            {version.change_summary && ` — ${version.change_summary}`}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {version.size_bytes ? `${Math.round(Number(version.size_bytes) / 1024)}KB` : '—'}
                        </span>
                        <button className="fgp-icon-btn" title="Restore"><RotateCcw size={12} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Compartments */}
          {tab === 'compartments' && (
            <>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px' }}>
                Share this file with multiple ventures with different access levels.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 32px', gap: 6, marginBottom: 10 }}>
                <select value={newVentureId} onChange={(e) => setNewVentureId(e.target.value)} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                  <option value="">Select venture...</option>
                  {ventures.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <select value={newAccessLevel} onChange={(e) => setNewAccessLevel(e.target.value as typeof newAccessLevel)} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                  <option value="venture">Venture</option>
                  <option value="internal">Internal</option>
                  <option value="shared">Shared</option>
                  <option value="private">Private</option>
                </select>
                <button className="fgp-icon-btn" onClick={handleAddCompartment} disabled={!newVentureId || addCompartment.isPending}>
                  <Plus size={14} />
                </button>
              </div>

              {compartments.isLoading ? (
                <div className="fgp-loading"><Loader2 size={14} className="mcv-spin" /> Loading...</div>
              ) : !compartments.data?.compartments?.length ? (
                <p className="fgp-empty">Not in any compartment yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {compartments.data.compartments.map((c) => {
                    const comp = c as Record<string, unknown>;
                    const venture = ventures.find(v => v.id === comp.venture_id);
                    return (
                      <div key={String(comp.id)} className="fgp-row">
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: venture?.color || 'var(--cyan)' }} />
                        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{venture?.name || String(comp.venture_id)}</span>
                        <Badge>{String(comp.access_level || 'venture')}</Badge>
                        <button className="fgp-icon-btn" onClick={() => handleRemoveCompartment(String(comp.id))} title="Remove">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Legal Hold */}
          {tab === 'legal' && (
            <div>
              <div style={{ padding: 12, background: isOnHold ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0, 240, 255, 0.04)', borderRadius: 8, borderLeft: `3px solid ${isOnHold ? '#ef4444' : 'var(--cyan)'}`, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Lock size={14} style={{ color: isOnHold ? '#ef4444' : 'var(--cyan)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: isOnHold ? '#ef4444' : 'var(--text-primary)' }}>
                    {isOnHold ? 'File is on Legal Hold' : 'File is not on Legal Hold'}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {isOnHold
                    ? 'This file cannot be deleted or modified until the hold is released. All access is logged.'
                    : 'Placing a legal hold prevents deletion, requires audit-logged access, and preserves the file for compliance.'}
                </p>
              </div>

              {!isOnHold && (
                <textarea
                  placeholder="Reason for legal hold (e.g. 'Litigation hold per legal counsel, Case #12345')"
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  rows={3}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: 8, borderRadius: 'var(--radius-sm)', fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-sans)', marginBottom: 10 }}
                />
              )}

              <Button
                onClick={handleLegalHold}
                disabled={legalHold.isPending || (!isOnHold && !holdReason.trim())}
                style={{ background: isOnHold ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isOnHold ? '#10B981' : '#ef4444', borderColor: isOnHold ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}
              >
                {legalHold.isPending ? <Loader2 size={14} className="mcv-spin" /> : <Shield size={14} />}
                {isOnHold ? 'Release Legal Hold' : 'Place on Legal Hold'}
              </Button>
            </div>
          )}

          {/* Audit */}
          {tab === 'audit' && (
            <>
              {audit.isLoading ? (
                <div className="fgp-loading"><Loader2 size={14} className="mcv-spin" /> Loading audit trail...</div>
              ) : !audit.data?.entries?.length ? (
                <p className="fgp-empty">No audit entries for this file yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {audit.data.entries.map((e, i) => {
                    const entry = e as Record<string, unknown>;
                    return (
                      <div key={String(entry.id) || i} style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-primary)' }}>{String(entry.action || 'unknown')}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                            {entry.timestamp ? new Date(String(entry.timestamp)).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        {entry.details && Object.keys(entry.details as Record<string, unknown>).length > 0 && (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                            {JSON.stringify(entry.details).slice(0, 80)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <style>{`
          .fgp-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; justify-content: flex-end; }
          .fgp-panel { width: 420px; max-width: 90vw; background: var(--bg-surface); border-left: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; animation: fgpSlide 0.2s ease; }
          @keyframes fgpSlide { from { transform: translateX(100%); } to { transform: translateX(0); } }
          .fgp-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-md); border-bottom: 1px solid var(--border); }
          .fgp-close { border: none; background: transparent; color: var(--text-muted); cursor: pointer; padding: 4px; border-radius: var(--radius-sm); }
          .fgp-close:hover { background: var(--bg-hover); color: var(--text-primary); }
          .fgp-tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--bg-card); }
          .fgp-tab { display: flex; align-items: center; gap: 4px; padding: 10px 12px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; font-size: 12px; border-bottom: 2px solid transparent; flex: 1; justify-content: center; }
          .fgp-tab:hover { color: var(--text-primary); }
          .fgp-tab.active { color: var(--cyan); border-bottom-color: var(--cyan); }
          .fgp-body { flex: 1; overflow-y: auto; padding: var(--space-md); }
          .fgp-loading { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 13px; }
          .fgp-empty { color: var(--text-muted); font-size: 12px; margin: 0; }
          .fgp-row { display: flex; align-items: center; gap: 8px; padding: 8px; background: var(--bg-elevated); border-radius: 6px; }
          .fgp-icon-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; border-radius: var(--radius-sm); }
          .fgp-icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
          .fgp-icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        `}</style>
      </div>
    </div>
  );
}
