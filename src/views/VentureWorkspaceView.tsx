import { FileText, Image, Database, Film, Download, PenTool, Upload, BarChart3 } from 'lucide-react';
import { PageShell, PageHeader, GlassCard } from '../components/ui';
import { useNavigation } from '../stores/navigation';
import { getVenture } from '../lib/ventures';
import '../styles/files.css';

const CATEGORIES = [
  { key: 'docs', label: 'Docs', icon: FileText, count: 0 },
  { key: 'assets', label: 'Assets', icon: Image, count: 0 },
  { key: 'data', label: 'Data', icon: Database, count: 0 },
  { key: 'media', label: 'Media', icon: Film, count: 0 },
  { key: 'exports', label: 'Exports', icon: Download, count: 0 },
];

export default function VentureWorkspaceView() {
  const { activeVenture } = useNavigation();
  const venture = getVenture(activeVenture || 'mcv');

  return (
    <PageShell>
      <PageHeader
        title={`${venture?.name || 'Venture'} Workspace`}
        icon="Archive"
      />

      <div style={{ padding: 'var(--space-md)' }}>
        {/* Category cards */}
        <div className="workspace-categories">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="workspace-category-card">
                <div className="workspace-category-icon">
                  <Icon size={24} style={{ color: 'var(--cyan)' }} />
                </div>
                <div className="workspace-category-label">{cat.label}</div>
                <div className="workspace-category-count">{cat.count}</div>
              </div>
            );
          })}
        </div>

        {/* Recent files */}
        <GlassCard>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
            Recent Files
          </h3>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: 24 }}>
            No files in this workspace yet. Upload files or use Aegis to generate content.
          </div>
        </GlassCard>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--cyan-glow)', color: 'var(--cyan)', border: '1px solid rgba(0,240,255,0.2)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
            <Upload size={14} /> Upload
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
            <PenTool size={14} /> Generate
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
            <BarChart3 size={14} /> Import Data
          </button>
        </div>
      </div>
    </PageShell>
  );
}
