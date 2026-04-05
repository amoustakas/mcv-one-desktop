import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Sparkles, CheckSquare, BookOpen } from 'lucide-react';
import { PageShell, PageHeader, Tabs, KpiCard, GlassCard } from '../components/ui';
import AdFormatBrowser from '../components/ad-studio/AdFormatBrowser';
import AdComplianceChecker from '../components/ad-studio/AdComplianceChecker';
import AdPlacementGrid from '../components/ad-studio/AdPlacementGrid';
import PlatformIcon from '../components/ad-studio/PlatformIcon';
import { useFormatCounts, useAdFormats, useComplianceReport } from '../hooks/use-ad-specs';
import { staggerContainer, fadeInUp } from '../lib/animations';
import type { AdFormat, CreativeAsset, AdPlatform } from '../lib/ad-specs/types';
import { PLATFORM_META } from '../lib/ad-specs/types';
import '../styles/ad-studio.css';

const VIEW_TABS = [
  { id: 'browse', label: 'Browse Specs' },
  { id: 'builder', label: 'Creative Builder' },
  { id: 'compliance', label: 'Compliance Audit' },
];

export default function AdStudioView() {
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedFormat, setSelectedFormat] = useState<AdFormat | null>(null);
  const [selectedFormatIds, setSelectedFormatIds] = useState<string[]>([]);
  const counts = useFormatCounts();

  // Compliance audit state
  const [auditAsset, setAuditAsset] = useState<CreativeAsset>({
    name: 'test', mediaType: 'image', width: 1200, height: 628,
    fileSizeMb: 2.5, fileFormat: 'jpg', texts: { headline: '', description: '' },
  });
  const { reports } = useComplianceReport(auditAsset, selectedFormatIds);

  // Builder state
  const { formats: allFormats } = useAdFormats();

  function handleFormatSelect(format: AdFormat) {
    setSelectedFormat(format);
    setSelectedFormatIds(prev =>
      prev.includes(format.id) ? prev.filter(id => id !== format.id) : [...prev, format.id]
    );
  }

  const platformList = Object.values(PLATFORM_META);

  return (
    <PageShell>
      <PageHeader title="Ad Studio" icon={<LayoutGrid size={20} />} />

      {/* KPI Strip */}
      <motion.div className="adstudio-kpi-strip" variants={staggerContainer} initial="hidden" animate="show">
        <motion.div variants={fadeInUp}>
          <KpiCard title="Total Formats" value={counts.total || 0} icon={<BookOpen size={14} />} size="sm" />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <KpiCard title="Platforms" value={platformList.length} icon={<LayoutGrid size={14} />} size="sm" />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <KpiCard title="Selected" value={selectedFormatIds.length} icon={<CheckSquare size={14} />} size="sm" />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <KpiCard
            title="Compliance"
            value={reports.length > 0 ? `${reports.filter(r => r.passed).length}/${reports.length}` : '—'}
            icon={<Sparkles size={14} />}
            size="sm"
          />
        </motion.div>
      </motion.div>

      {/* Platform quick-nav */}
      <div className="adstudio-platform-strip">
        {platformList.map(p => (
          <button key={p.id} className="adstudio-platform-chip" style={{ '--chip-color': p.color } as React.CSSProperties}>
            <PlatformIcon platform={p.id as AdPlatform} size={12} />
            <span>{p.shortName}</span>
            <span className="adstudio-platform-count">{counts[p.id] || 0}</span>
          </button>
        ))}
      </div>

      {/* Tab strip */}
      <Tabs tabs={VIEW_TABS} active={activeTab} onChange={setActiveTab} className="adstudio-tabs" />

      {/* Tab content */}
      <div className="adstudio-body">
        {activeTab === 'browse' && (
          <AdFormatBrowser
            onSelect={handleFormatSelect}
            selectedFormats={selectedFormatIds}
            multiSelect
          />
        )}

        {activeTab === 'builder' && (
          <div className="adstudio-builder">
            <div className="adstudio-builder-left">
              <GlassCard>
                <h3 className="adstudio-section-title">Selected Formats ({selectedFormatIds.length})</h3>
                {selectedFormatIds.length === 0 ? (
                  <p className="adstudio-empty">Select formats from the Browse tab to preview them here.</p>
                ) : (
                  <AdPlacementGrid
                    formats={allFormats.filter(f => selectedFormatIds.includes(f.id))}
                    complianceReports={reports}
                    columns={2}
                    onFormatSelect={f => setSelectedFormat(f)}
                  />
                )}
              </GlassCard>
            </div>
            <div className="adstudio-builder-right">
              <GlassCard>
                <h3 className="adstudio-section-title">
                  {selectedFormat ? selectedFormat.name : 'Format Details'}
                </h3>
                {selectedFormat ? (
                  <div className="adstudio-detail">
                    <div className="adstudio-detail-row">
                      <span className="adstudio-detail-label">Platform</span>
                      <PlatformIcon platform={selectedFormat.platform} size={12} showLabel />
                    </div>
                    <div className="adstudio-detail-row">
                      <span className="adstudio-detail-label">Placement</span>
                      <span className="adstudio-detail-value">{selectedFormat.placement}</span>
                    </div>
                    <div className="adstudio-detail-row">
                      <span className="adstudio-detail-label">Type</span>
                      <span className="adstudio-detail-value">{selectedFormat.mediaType}</span>
                    </div>
                    {selectedFormat.imageSpec?.dimensions?.[0] && (
                      <div className="adstudio-detail-row">
                        <span className="adstudio-detail-label">Dimensions</span>
                        <span className="adstudio-detail-value mono">
                          {selectedFormat.imageSpec.dimensions[0].width}x{selectedFormat.imageSpec.dimensions[0].height}
                        </span>
                      </div>
                    )}
                    {selectedFormat.textSpecs.length > 0 && (
                      <div className="adstudio-detail-section">
                        <span className="adstudio-detail-label">Text Limits</span>
                        {selectedFormat.textSpecs.map(ts => (
                          <div key={ts.field} className="adstudio-text-limit">
                            <span>{ts.field}</span>
                            <span className="mono">{ts.maxChars} chars</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedFormat.tips && selectedFormat.tips.length > 0 && (
                      <div className="adstudio-detail-section">
                        <span className="adstudio-detail-label">Tips</span>
                        {selectedFormat.tips.map((tip, i) => (
                          <p key={i} className="adstudio-tip">{tip}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="adstudio-empty">Click a format to see its full specifications.</p>
                )}
              </GlassCard>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="adstudio-compliance">
            <GlassCard>
              <h3 className="adstudio-section-title">Test Creative</h3>
              <div className="adstudio-compliance-form">
                <div className="adstudio-form-row">
                  <label>Width (px)</label>
                  <input type="number" value={auditAsset.width || ''} onChange={e => setAuditAsset(a => ({ ...a, width: parseInt(e.target.value) || undefined }))} />
                </div>
                <div className="adstudio-form-row">
                  <label>Height (px)</label>
                  <input type="number" value={auditAsset.height || ''} onChange={e => setAuditAsset(a => ({ ...a, height: parseInt(e.target.value) || undefined }))} />
                </div>
                <div className="adstudio-form-row">
                  <label>File Size (MB)</label>
                  <input type="number" step="0.1" value={auditAsset.fileSizeMb || ''} onChange={e => setAuditAsset(a => ({ ...a, fileSizeMb: parseFloat(e.target.value) || undefined }))} />
                </div>
                <div className="adstudio-form-row">
                  <label>Format</label>
                  <select value={auditAsset.fileFormat || 'jpg'} onChange={e => setAuditAsset(a => ({ ...a, fileFormat: e.target.value }))}>
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                    <option value="gif">GIF</option>
                    <option value="mp4">MP4</option>
                    <option value="mov">MOV</option>
                  </select>
                </div>
                <div className="adstudio-form-row">
                  <label>Type</label>
                  <select value={auditAsset.mediaType} onChange={e => setAuditAsset(a => ({ ...a, mediaType: e.target.value as any }))}>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>
            </GlassCard>

            {selectedFormatIds.length > 0 && reports.length > 0 ? (
              <AdComplianceChecker reports={reports} onFormatClick={id => setSelectedFormat(allFormats.find(f => f.id === id) || null)} />
            ) : (
              <GlassCard>
                <p className="adstudio-empty">
                  Select formats from the Browse tab, then check compliance here.
                  {selectedFormatIds.length > 0 ? ` (${selectedFormatIds.length} formats selected)` : ''}
                </p>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
