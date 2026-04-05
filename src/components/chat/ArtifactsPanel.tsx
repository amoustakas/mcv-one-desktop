import { X, Code, FileText, Globe, Copy, Check, Download } from 'lucide-react';
import { useState } from 'react';
import { useArtifactStore } from '../../stores/artifacts';
import { cn } from '../../lib/utils';
import type { Artifact } from '../../lib/types/artifacts';
import Markdown from '../Markdown';

// ---------------------------------------------------------------------------
// Artifacts Panel — side panel for generated code, documents, data
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<string, typeof Code> = {
  code: Code,
  document: FileText,
  data: Code,
  html: Globe,
  svg: Globe,
  mermaid: Code,
};

function ArtifactRenderer({ artifact }: { artifact: Artifact }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const ext = artifact.language || (artifact.type === 'html' ? 'html' : artifact.type === 'svg' ? 'svg' : 'txt');
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/[^a-zA-Z0-9.-]/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="ap-renderer">
      <div className="ap-render-toolbar">
        <button className="ap-render-btn" onClick={handleCopy} title="Copy">
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
        <button className="ap-render-btn" onClick={handleDownload} title="Download">
          <Download size={12} />
        </button>
      </div>

      {/* Code / data / mermaid — render as preformatted text */}
      {(artifact.type === 'code' || artifact.type === 'data' || artifact.type === 'mermaid') && (
        <pre className="ap-code"><code>{artifact.content}</code></pre>
      )}

      {/* Document — render as Markdown */}
      {artifact.type === 'document' && (
        <div className="ap-document"><Markdown content={artifact.content} /></div>
      )}

      {/* HTML — sandboxed iframe (safe: no script access to parent) */}
      {artifact.type === 'html' && (
        <iframe
          className="ap-iframe"
          srcDoc={artifact.content}
          sandbox="allow-scripts"
          title={artifact.title}
        />
      )}

      {/* SVG — render as Markdown code block for safety (no dangerouslySetInnerHTML) */}
      {artifact.type === 'svg' && (
        <div className="ap-document">
          <Markdown content={`\`\`\`svg\n${artifact.content}\n\`\`\``} />
        </div>
      )}
    </div>
  );
}

export default function ArtifactsPanel() {
  const { artifacts, activeArtifactId, panelOpen, setActive, closePanel, removeArtifact } = useArtifactStore();

  if (!panelOpen || artifacts.length === 0) return null;

  const active = artifacts.find((a) => a.id === activeArtifactId) || artifacts[0];

  return (
    <div className="ap-panel">
      <div className="ap-header">
        <span className="ap-header-title">Artifacts ({artifacts.length})</span>
        <button className="ap-close" onClick={closePanel}><X size={14} /></button>
      </div>

      {/* Tab strip for multiple artifacts */}
      {artifacts.length > 1 && (
        <div className="ap-tabs">
          {artifacts.map((art) => {
            const Icon = TYPE_ICONS[art.type] || Code;
            return (
              <button
                key={art.id}
                className={cn('ap-tab', art.id === active?.id && 'active')}
                onClick={() => setActive(art.id)}
                title={art.title}
              >
                <Icon size={11} />
                <span className="ap-tab-label">{art.title}</span>
                <button
                  className="ap-tab-close"
                  onClick={(e) => { e.stopPropagation(); removeArtifact(art.id); }}
                >
                  <X size={9} />
                </button>
              </button>
            );
          })}
        </div>
      )}

      {active && (
        <div className="ap-content">
          <ArtifactRenderer artifact={active} />
        </div>
      )}

      <style>{`
        .ap-panel {
          width: 380px; flex-shrink: 0; display: flex; flex-direction: column;
          background: var(--bg-surface); border-left: 1px solid var(--border); overflow: hidden;
        }
        .ap-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .ap-header-title { font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); }
        .ap-close { padding: 4px; color: var(--text-muted); border-radius: 4px; }
        .ap-close:hover { color: var(--text-primary); background: var(--bg-card); }

        .ap-tabs {
          display: flex; overflow-x: auto; border-bottom: 1px solid var(--border);
          flex-shrink: 0; gap: 1px; background: var(--bg-deep);
        }
        .ap-tab {
          display: flex; align-items: center; gap: 4px; padding: 6px 10px; font-size: 11px;
          color: var(--text-secondary); background: var(--bg-surface); white-space: nowrap;
          cursor: pointer; border-bottom: 2px solid transparent; transition: all var(--transition-fast);
        }
        .ap-tab:hover { color: var(--text-primary); }
        .ap-tab.active { color: var(--cyan); border-bottom-color: var(--cyan); }
        .ap-tab-label { max-width: 100px; overflow: hidden; text-overflow: ellipsis; }
        .ap-tab-close { padding: 1px; color: var(--text-muted); opacity: 0; }
        .ap-tab:hover .ap-tab-close { opacity: 1; }

        .ap-content { flex: 1; overflow: auto; }
        .ap-renderer { position: relative; height: 100%; }
        .ap-render-toolbar {
          position: absolute; top: 8px; right: 8px; display: flex; gap: 2px; z-index: 5;
          background: var(--bg-surface); border: 1px solid var(--border); border-radius: 4px; padding: 2px;
        }
        .ap-render-btn { padding: 3px 5px; border-radius: 3px; color: var(--text-muted); }
        .ap-render-btn:hover { color: var(--cyan); background: var(--bg-elevated); }

        .ap-code {
          margin: 0; padding: 12px; font-family: var(--font-mono); font-size: 12px;
          line-height: 1.6; color: var(--text-primary); white-space: pre; overflow: auto;
          height: 100%; tab-size: 2;
        }
        .ap-document { padding: 16px; line-height: 1.6; }
        .ap-iframe { width: 100%; height: 100%; border: none; background: white; }

        @media (max-width: 768px) {
          .ap-panel { width: 100%; position: absolute; inset: 0; z-index: 50; }
        }
      `}</style>
    </div>
  );
}
