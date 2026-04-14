import { useEffect, useMemo, useState } from 'react';
import { FileText, Scale, ShieldCheck, Beaker, DollarSign, Wrench, Rocket, Check, Clock, Plus, Download, ChevronRight } from 'lucide-react';
import { GlassCard, Button, Badge, EmptyState } from '../ui';
import { apiPost } from '../../lib/api/client';
import type { Venture } from '../../lib/ventures';

type Department = 'legal' | 'compliance' | 'research' | 'finance' | 'ops' | 'product';

interface VentureDoc {
  id: string;
  venture_id: string;
  template_id?: string;
  department: Department;
  title: string;
  body_markdown?: string;
  status: 'draft' | 'in-review' | 'approved' | 'executed' | 'archived';
  created_at: string;
  updated_at: string;
}

interface DocTemplate {
  id: string;
  department: Department;
  title: string;
  description?: string;
}

const DEPT_CONFIG: Record<Department, { label: string; icon: typeof FileText; color: string }> = {
  legal:      { label: 'Legal',      icon: Scale,       color: '#8B5CF6' },
  compliance: { label: 'Compliance', icon: ShieldCheck, color: '#10B981' },
  research:   { label: 'Research',   icon: Beaker,      color: '#00F0FF' },
  finance:    { label: 'Finance',    icon: DollarSign,  color: '#F59E0B' },
  ops:        { label: 'Ops',        icon: Wrench,      color: '#EF4444' },
  product:    { label: 'Product',    icon: Rocket,      color: '#E8F0FE' },
};

const STATUS_COLOR: Record<string, string> = {
  draft: '#6B7280',
  'in-review': '#F59E0B',
  approved: '#00F0FF',
  executed: '#10B981',
  archived: '#4B5563',
};

export default function VentureDocsPanel({ venture }: { venture: Venture }) {
  const [docs, setDocs] = useState<VentureDoc[]>([]);
  const [templates, setTemplates] = useState<DocTemplate[]>([]);
  const [activeDept, setActiveDept] = useState<Department>('legal');
  const [applying, setApplying] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [docsData, tplData] = await Promise.all([
        apiPost<{ docs: VentureDoc[] }>('/api/ventures', { action: 'list-docs', venture_id: venture.id }),
        apiPost<{ templates: DocTemplate[] }>('/api/doc-templates', { action: 'list' }).catch(() => ({ templates: [] })),
      ]);
      setDocs(docsData.docs || []);
      setTemplates(tplData.templates || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load docs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [venture.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function applyDept(dept: Department) {
    setApplying(dept);
    setError(null);
    try {
      await apiPost<{ docs: VentureDoc[]; count: number }>('/api/ventures', {
        action: 'apply-doc-template',
        venture_id: venture.id,
        department: dept,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply templates');
    } finally {
      setApplying(null);
    }
  }

  const docsByDept = useMemo(() => {
    const out: Record<Department, VentureDoc[]> = { legal: [], compliance: [], research: [], finance: [], ops: [], product: [] };
    for (const d of docs) out[d.department]?.push(d);
    return out;
  }, [docs]);

  const activeDocs = docsByDept[activeDept];
  const selectedDoc = docs.find(d => d.id === selectedDocId);

  const totalDocs = docs.length;
  const approvedDocs = docs.filter(d => d.status === 'approved' || d.status === 'executed').length;

  return (
    <div className="vdocs-root">
      <GlassCard className="vdocs-card vdocs-summary">
        <div className="vdocs-summary-left">
          <FileText size={16} style={{ color: 'var(--cyan)' }} />
          <div>
            <div className="vdocs-title">Business Documentation — {venture.name}</div>
            <div className="vdocs-subtitle">{totalDocs} docs · {approvedDocs} approved/executed</div>
          </div>
        </div>
      </GlassCard>

      {error && <div className="vdocs-error">{error}</div>}

      <div className="vdocs-layout">
        {/* Left: department nav */}
        <GlassCard className="vdocs-card vdocs-sidebar">
          {(Object.entries(DEPT_CONFIG) as Array<[Department, typeof DEPT_CONFIG['legal']]>).map(([dept, config]) => {
            const Icon = config.icon;
            const count = docsByDept[dept]?.length ?? 0;
            const isActive = activeDept === dept;
            return (
              <button
                key={dept}
                className={`vdocs-dept ${isActive ? 'vdocs-dept-active' : ''}`}
                onClick={() => { setActiveDept(dept); setSelectedDocId(null); }}
              >
                <Icon size={13} style={{ color: config.color }} />
                <span className="vdocs-dept-label">{config.label}</span>
                <span className="vdocs-dept-count">{count}</span>
              </button>
            );
          })}
        </GlassCard>

        {/* Middle: doc list in active dept */}
        <GlassCard className="vdocs-card vdocs-list">
          <div className="vdocs-list-head">
            <h4 className="vdocs-h4">{DEPT_CONFIG[activeDept].label}</h4>
            {activeDocs.length === 0 && (
              <Button
                size="sm"
                icon={<Download size={12} />}
                onClick={() => applyDept(activeDept)}
                disabled={applying === activeDept || loading}
              >
                {applying === activeDept ? 'Applying…' : 'Apply templates'}
              </Button>
            )}
          </div>

          {loading ? (
            <div className="vdocs-loading">Loading…</div>
          ) : activeDocs.length === 0 ? (
            <EmptyState
              icon={<FileText size={18} />}
              title={`No ${DEPT_CONFIG[activeDept].label.toLowerCase()} docs yet`}
              description={`Click "Apply templates" to seed this venture's ${DEPT_CONFIG[activeDept].label.toLowerCase()} folder from the global template registry. All 20 baseline templates are live.`}
            />
          ) : (
            <ul className="vdocs-doclist">
              {activeDocs.map(d => (
                <li
                  key={d.id}
                  className={`vdocs-doc ${selectedDocId === d.id ? 'vdocs-doc-active' : ''}`}
                  onClick={() => setSelectedDocId(d.id)}
                >
                  <span className="vdocs-doc-title">{d.title}</span>
                  <div className="vdocs-doc-meta">
                    <Badge color={STATUS_COLOR[d.status]} variant="outline">{d.status}</Badge>
                    <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </li>
              ))}
              <li className="vdocs-doc-add">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Plus size={12} />}
                  onClick={() => applyDept(activeDept)}
                  disabled={applying === activeDept}
                >
                  Apply more templates
                </Button>
              </li>
            </ul>
          )}
        </GlassCard>

        {/* Right: selected doc preview */}
        <GlassCard className="vdocs-card vdocs-preview">
          {selectedDoc ? (
            <>
              <div className="vdocs-preview-head">
                <h4 className="vdocs-h4">{selectedDoc.title}</h4>
                <Badge color={STATUS_COLOR[selectedDoc.status]} variant="outline">{selectedDoc.status}</Badge>
              </div>
              <pre className="vdocs-preview-body">{selectedDoc.body_markdown || '(empty)'}</pre>
              <div className="vdocs-preview-footer">
                <span>Template: <code>{selectedDoc.template_id || '—'}</code></span>
                <span>Updated {new Date(selectedDoc.updated_at).toLocaleDateString()}</span>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<FileText size={18} />}
              title="Select a document"
              description="Click any doc on the left to preview. Rich editor lands in a later Epic 6 story."
            />
          )}
        </GlassCard>
      </div>

      <style>{`
        .vdocs-root { display: flex; flex-direction: column; gap: 12px; height: 100%; min-height: 500px; }
        .vdocs-card { padding: 14px; }
        .vdocs-summary { display: flex; align-items: center; }
        .vdocs-summary-left { display: flex; align-items: center; gap: 12px; }
        .vdocs-title { font-size: 13px; font-weight: 600; color: var(--text-primary); font-family: var(--font-display); }
        .vdocs-subtitle { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        .vdocs-error { font-size: 12px; color: var(--error); padding: 8px 10px; background: rgba(239,68,68,0.08); border-radius: var(--radius-sm); }
        .vdocs-layout { display: grid; grid-template-columns: 180px minmax(240px, 1fr) minmax(280px, 1.5fr); gap: 12px; flex: 1; min-height: 0; }
        .vdocs-sidebar { display: flex; flex-direction: column; gap: 2px; padding: 8px; }
        .vdocs-dept { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: transparent; border: none; border-radius: var(--radius-sm); cursor: pointer; text-align: left; color: var(--text-secondary); font-size: 12px; transition: all 0.12s; }
        .vdocs-dept:hover { background: var(--bg-hover); color: var(--text-primary); }
        .vdocs-dept-active { background: var(--cyan-glow); color: var(--text-primary); }
        .vdocs-dept-label { flex: 1; }
        .vdocs-dept-count { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }
        .vdocs-list, .vdocs-preview { overflow-y: auto; }
        .vdocs-list-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .vdocs-h4 { margin: 0; font-size: 13px; font-weight: 600; color: var(--text-primary); font-family: var(--font-display); }
        .vdocs-loading { color: var(--text-muted); font-size: 12px; padding: 12px; }
        .vdocs-doclist { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; }
        .vdocs-doc { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border-radius: var(--radius-sm); cursor: pointer; transition: background 0.12s; }
        .vdocs-doc:hover { background: var(--bg-hover); }
        .vdocs-doc-active { background: var(--cyan-glow); }
        .vdocs-doc-title { font-size: 12px; color: var(--text-primary); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vdocs-doc-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .vdocs-doc-add { padding-top: 8px; margin-top: 8px; border-top: 1px solid var(--border); }
        .vdocs-preview-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
        .vdocs-preview-body { font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); background: var(--bg-input); padding: 12px; border-radius: var(--radius-sm); white-space: pre-wrap; max-height: 400px; overflow-y: auto; line-height: 1.6; }
        .vdocs-preview-footer { display: flex; justify-content: space-between; margin-top: 10px; font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
        .vdocs-preview-footer code { color: var(--cyan); }
      `}</style>
    </div>
  );
}
