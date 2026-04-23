import { useState, useCallback } from 'react';
import { Video, Sparkles, Megaphone, Bot, Loader2 } from 'lucide-react';
import { PageHeader, Tabs, GlassCard, Button, Input } from '../components/ui';
import { useVeo } from '../hooks/use-veo';
import type { VeoGalleryItem } from '../hooks/use-veo';
// VeoGenerationMode used internally by components
import VideoGenerator from '../components/video/VideoGenerator';
import VideoGallery from '../components/video/VideoGallery';
import CameoUploader from '../components/video/CameoUploader';
import TypographyAnimator from '../components/video/TypographyAnimator';
import { useToast } from '../components/Toasts';

type StudioTab = 'generate' | 'gallery' | 'cameos' | 'typography' | 'ai-script' | 'ads';

const TABS: Array<{ id: StudioTab; label: string }> = [
  { id: 'generate', label: 'Generate' },
  { id: 'ai-script', label: 'AI Script' },
  { id: 'ads', label: 'Ad Videos' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'cameos', label: 'Cameos' },
  { id: 'typography', label: 'Typography' },
];

/* ── AI Script-to-Video Panel ── */
function AiScriptPanel() {
  const { addToast } = useToast();
  const [concept, setConcept] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!concept.trim()) return;
    setLoading(true);
    setScript(null);
    setVideoUrl(null);
    try {
      // Step 1: Gemini writes the script
      const scriptRes = await fetch('/api/google', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gemini-generate',
          prompt: `You are a video director. Create a detailed Veo video generation prompt for this concept: "${concept}". Style: ${style}. Describe the exact visual scene, camera angle, lighting, color grading, and action. 5-15 seconds. Return ONLY the video prompt.`,
        }),
      });
      if (!scriptRes.ok) throw new Error('Script generation failed');
      const scriptData = await scriptRes.json();
      const videoPrompt = scriptData.content || concept;
      setScript(videoPrompt);

      // Step 2: Veo generates video
      addToast({ type: 'info', message: 'Script ready, generating video...' });
      const videoRes = await fetch('/api/google', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'veo-generate', prompt: videoPrompt, aspectRatio: '16:9' }),
      });
      if (!videoRes.ok) throw new Error('Video generation failed');
      const videoData = await videoRes.json();
      if (videoData.videoUrl || videoData.uri) {
        setVideoUrl(videoData.videoUrl || videoData.uri);
        addToast({ type: 'success', message: 'AI video generated!' });
      } else {
        addToast({ type: 'info', message: 'Video generation submitted. Check back soon.' });
      }
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div>
        <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} style={{ color: 'var(--purple)' }} /> AI Script-to-Video
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Describe your concept. Gemini writes the video prompt. Veo generates the video.
        </p>
      </div>

      <textarea
        placeholder="Describe your video concept... (e.g. 'A futuristic city at sunset, camera flies through skyscrapers')"
        value={concept}
        onChange={(e) => setConcept(e.target.value)}
        rows={3}
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-sans)', fontSize: 13, resize: 'vertical', outline: 'none' }}
      />

      <select value={style} onChange={(e) => setStyle(e.target.value)} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
        <option value="cinematic">Cinematic</option>
        <option value="documentary">Documentary</option>
        <option value="commercial">Commercial</option>
        <option value="abstract">Abstract</option>
        <option value="anime">Anime</option>
      </select>

      <Button onClick={handleGenerate} disabled={loading || !concept.trim()}>
        {loading ? <><Loader2 size={14} className="ccv-spin" /> Generating...</> : <><Bot size={14} /> Generate with NAOS</>}
      </Button>

      {script && (
        <GlassCard>
          <h4 style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Generated Script</h4>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{script}</p>
        </GlassCard>
      )}

      {videoUrl && (
        <GlassCard>
          <h4 style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Generated Video</h4>
          <video src={videoUrl} controls style={{ width: '100%', maxHeight: 400, borderRadius: 8 }} />
        </GlassCard>
      )}
    </div>
  );
}

/* ── Platform Ad Panel ── */
function AdVideoPanel() {
  const { addToast } = useToast();
  const [product, setProduct] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [duration, setDuration] = useState(15);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ script?: string; videoUrl?: string } | null>(null);

  const handleGenerate = async () => {
    if (!product.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const scriptRes = await fetch('/api/google', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gemini-generate',
          prompt: `Create a ${duration}-second ${platform} ad video prompt for: "${product}". Platform-optimized: vertical for Instagram/TikTok, horizontal for YouTube/LinkedIn. Include opening hook (first 2s), product showcase, CTA visual. Return ONLY the video prompt.`,
        }),
      });
      if (!scriptRes.ok) throw new Error('Script generation failed');
      const scriptData = await scriptRes.json();
      const videoPrompt = scriptData.content;

      addToast({ type: 'info', message: 'Script ready, generating ad...' });
      const aspectMap: Record<string, string> = { instagram: '9:16', youtube: '16:9', tiktok: '9:16', linkedin: '16:9' };
      const videoRes = await fetch('/api/google', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'veo-generate', prompt: videoPrompt, aspectRatio: aspectMap[platform] || '9:16', duration }),
      });
      const videoData = await videoRes.json();
      setResult({ script: videoPrompt, videoUrl: videoData.videoUrl || videoData.uri });
      addToast({ type: 'success', message: `${platform} ad generated!` });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div>
        <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Megaphone size={16} style={{ color: 'var(--cyan)' }} /> Platform-Optimized Ads
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Generate ads optimized for each platform's format, duration, and style.
        </p>
      </div>

      <Input placeholder="Product or service to advertise..." value={product} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProduct(e.target.value)} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-sm)' }}>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
          <option value="instagram">Instagram (9:16)</option>
          <option value="tiktok">TikTok (9:16)</option>
          <option value="youtube">YouTube (16:9)</option>
          <option value="linkedin">LinkedIn (16:9)</option>
        </select>
        <Input type="number" value={duration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(parseInt(e.target.value) || 15)} placeholder="Seconds" />
      </div>

      <Button onClick={handleGenerate} disabled={loading || !product.trim()}>
        {loading ? <><Loader2 size={14} className="ccv-spin" /> Generating...</> : <><Megaphone size={14} /> Create {platform} Ad</>}
      </Button>

      {result && (
        <>
          {result.script && (
            <GlassCard>
              <h4 style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--purple)' }}>Ad Script</h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>{result.script}</p>
            </GlassCard>
          )}
          {result.videoUrl && (
            <GlassCard>
              <video src={result.videoUrl} controls style={{ width: '100%', maxHeight: 500, borderRadius: 8 }} />
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}

export default function VideoStudioView() {
  const [activeTab, setActiveTab] = useState<StudioTab>('generate');
  const [remixPrompt, setRemixPrompt] = useState('');

  // Phase-0 safety (2026-04-23): no browser read of VITE_GOOGLE_AI_KEY — Vite
  // would bundle it into the public JS. Veo generation is async and doesn't
  // need a long-lived session, so the Phase-1 fix is a server-proxy for Veo
  // calls (`/api/veo`) which useVeo() will call directly. For now useVeo()
  // gets an empty key and must fail gracefully in the UI.
  const apiKey = '';
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
          {activeTab === 'ai-script' && <AiScriptPanel />}
          {activeTab === 'ads' && <AdVideoPanel />}
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
