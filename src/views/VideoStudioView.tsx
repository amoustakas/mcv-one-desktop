import { useState, useCallback } from 'react';
import { Video } from 'lucide-react';
import { PageHeader, Tabs, GlassCard } from '../components/ui';
import { useVeo } from '../hooks/use-veo';
import type { VeoGalleryItem } from '../hooks/use-veo';
// VeoGenerationMode used internally by components
import VideoGenerator from '../components/video/VideoGenerator';
import VideoGallery from '../components/video/VideoGallery';
import CameoUploader from '../components/video/CameoUploader';
import TypographyAnimator from '../components/video/TypographyAnimator';

type StudioTab = 'generate' | 'gallery' | 'cameos' | 'typography';

const TABS: Array<{ id: StudioTab; label: string }> = [
  { id: 'generate', label: 'Generate' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'cameos', label: 'Cameos' },
  { id: 'typography', label: 'Typography' },
];

export default function VideoStudioView() {
  const [activeTab, setActiveTab] = useState<StudioTab>('generate');
  const [remixPrompt, setRemixPrompt] = useState('');

  const apiKey = import.meta.env.VITE_GOOGLE_AI_KEY || '';
  const veo = useVeo(apiKey);

  const handleRemix = useCallback((item: VeoGalleryItem) => {
    setRemixPrompt(item.prompt);
    setActiveTab('generate');
  }, []);

  const handleExtend = useCallback((item: VeoGalleryItem) => {
    // Pre-fill generator with extend mode prompt
    setRemixPrompt(`Extend: ${item.prompt}`);
    setActiveTab('generate');
  }, []);

  const handleTabChange = useCallback((id: string) => {
    setActiveTab(id as StudioTab);
    if (id !== 'generate') setRemixPrompt('');
  }, []);

  return (
    <div className="vs-root">
      <PageHeader
        title="Video Studio"
        icon={<Video size={22} />}
      />

      <div className="vs-tabs-row">
        <Tabs
          tabs={TABS.map(t => ({
            ...t,
            count: t.id === 'gallery' ? veo.gallery.length : undefined,
          }))}
          active={activeTab}
          onChange={handleTabChange}
        />
      </div>

      <div className="vs-content">
        <GlassCard className="vs-panel">
          {activeTab === 'generate' && (
            <VideoGenerator
              onGenerate={veo.generate}
              status={veo.status}
              error={veo.error}
              onClearError={veo.clearError}
              initialPrompt={remixPrompt}
            />
          )}
          {activeTab === 'gallery' && (
            <VideoGallery
              items={veo.gallery}
              onRemix={handleRemix}
              onRemove={veo.removeFromGallery}
              onExtend={handleExtend}
            />
          )}
          {activeTab === 'cameos' && (
            <CameoUploader
              onGenerate={veo.generate}
              status={veo.status}
              error={veo.error}
              onClearError={veo.clearError}
            />
          )}
          {activeTab === 'typography' && (
            <TypographyAnimator
              onGenerate={veo.generate}
              status={veo.status}
              error={veo.error}
              onClearError={veo.clearError}
            />
          )}
        </GlassCard>

        {/* Current video preview (shown across all tabs when a video just finished) */}
        {veo.currentVideo && veo.status === 'complete' && (
          <GlassCard className="vs-latest">
            <div className="vs-latest-header">
              <Video size={16} />
              <span>Latest Generation</span>
            </div>
            <video
              src={veo.currentVideo.objectUrl}
              className="vs-latest-video"
              controls
              playsInline
            />
          </GlassCard>
        )}
      </div>

      <style>{`
        .vs-root {
          display: flex;
          flex-direction: column;
          gap: var(--space-md, 16px);
          padding: var(--space-md, 16px);
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .vs-tabs-row {
          display: flex;
          align-items: center;
        }
        .vs-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-md, 16px);
        }
        .vs-panel {
          padding: var(--space-lg, 24px);
        }
        .vs-latest {
          padding: var(--space-md, 16px);
        }
        .vs-latest-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: var(--space-sm, 8px);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--cyan, #00f5ff);
        }
        .vs-latest-video {
          width: 100%;
          max-height: 400px;
          border-radius: var(--radius-md, 12px);
          background: #000;
          object-fit: contain;
        }
        @media (max-width: 640px) {
          .vs-root {
            padding: var(--space-sm, 8px);
          }
          .vs-panel {
            padding: var(--space-md, 16px);
          }
        }
      `}</style>
    </div>
  );
}
