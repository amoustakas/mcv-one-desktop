import { useState, useRef, useCallback, useEffect } from 'react';
import { GitBranch, Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

/* ───── Types ───── */
interface DiagramNode {
  id: string;
  label: string;
  group: string;
  x: number;
  y: number;
}

interface DiagramEdge {
  source: string;
  target: string;
  label?: string;
}

interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups: { name: string; color: string }[];
}

/* ───── Constants ───── */
const DIAGRAM_STYLES = [
  { id: 'flow', label: 'Flow' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'sequence', label: 'Sequence' },
  { id: 'erd', label: 'ERD' },
  { id: 'mindmap', label: 'Mind Map' },
] as const;

const DEFAULT_GROUP_COLORS = [
  '#00F0FF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
  '#3B82F6', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
];

/* ───── Component ───── */
export default function RepoDiagramViewer() {
  const [repoUrl, setRepoUrl] = useState('');
  const [diagramStyle, setDiagramStyle] = useState('architecture');
  const [loading, setLoading] = useState(false);
  const [diagram, setDiagram] = useState<DiagramData | null>(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  async function handleGenerate() {
    if (!repoUrl.trim()) return;
    setLoading(true);
    setError('');
    setDiagram(null);

    try {
      const res = await fetch('/api/creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'repo-diagram', repoUrl, style: diagramStyle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Diagram generation failed');
      setDiagram(data.diagram);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.2, Math.min(3, prev + delta)));
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function getGroupColor(groupName: string): string {
    if (!diagram) return DEFAULT_GROUP_COLORS[0];
    const groupDef = diagram.groups.find(g => g.name === groupName);
    if (groupDef) return groupDef.color;
    const idx = diagram.groups.findIndex(g => g.name === groupName);
    return DEFAULT_GROUP_COLORS[Math.max(0, idx) % DEFAULT_GROUP_COLORS.length];
  }

  function getNodeById(id: string): DiagramNode | undefined {
    return diagram?.nodes.find(n => n.id === id);
  }

  return (
    <div className="repo-diagram">
      <div className="rd-header">
        <GitBranch size={22} className="rd-header-icon" />
        <div>
          <h2 className="rd-title">Repo Diagram Viewer</h2>
          <p className="rd-subtitle">GitHub repository architecture visualization</p>
        </div>
      </div>

      {/* Controls */}
      <div className="rd-controls">
        <div className="rd-field rd-field-url">
          <label className="rd-label">Repository URL</label>
          <input
            className="rd-input"
            type="text"
            placeholder="https://github.com/owner/repo"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
        </div>

        <div className="rd-field">
          <label className="rd-label">Diagram Style</label>
          <div className="rd-style-grid">
            {DIAGRAM_STYLES.map(s => (
              <button
                key={s.id}
                className={`rd-style-btn ${diagramStyle === s.id ? 'active' : ''}`}
                onClick={() => setDiagramStyle(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button className="rd-generate" onClick={handleGenerate} disabled={loading || !repoUrl.trim()}>
          {loading ? <Loader2 size={16} className="rd-spin" /> : <GitBranch size={16} />}
          {loading ? 'Analyzing...' : 'Generate Diagram'}
        </button>
      </div>

      {/* Error */}
      {error && <div className="rd-error">{error}</div>}

      {/* Diagram Viewport */}
      {diagram && (
        <div className="rd-viewport">
          <div className="rd-toolbar">
            <button className="rd-tool-btn" onClick={() => setZoom(z => Math.min(3, z + 0.2))}>
              <ZoomIn size={14} />
            </button>
            <span className="rd-zoom-label">{Math.round(zoom * 100)}%</span>
            <button className="rd-tool-btn" onClick={() => setZoom(z => Math.max(0.2, z - 0.2))}>
              <ZoomOut size={14} />
            </button>
            <button className="rd-tool-btn" onClick={resetView}>
              <Maximize2 size={14} />
            </button>

            {/* Legend */}
            <div className="rd-legend">
              {diagram.groups.map((g, i) => (
                <span key={g.name} className="rd-legend-item">
                  <span
                    className="rd-legend-dot"
                    style={{ background: g.color || DEFAULT_GROUP_COLORS[i % DEFAULT_GROUP_COLORS.length] }}
                  />
                  {g.name}
                </span>
              ))}
            </div>
          </div>

          <div
            className="rd-svg-wrapper"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
          >
            <svg
              ref={svgRef}
              className="rd-svg"
              viewBox="0 0 1000 600"
              preserveAspectRatio="xMidYMid meet"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              <defs>
                <marker id="rd-arrow" viewBox="0 0 10 7" refX="10" refY="3.5"
                  markerWidth="8" markerHeight="6" orient="auto-start-reverse">
                  <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-muted)" />
                </marker>
              </defs>

              {/* Edges */}
              {diagram.edges.map((edge, i) => {
                const src = getNodeById(edge.source);
                const tgt = getNodeById(edge.target);
                if (!src || !tgt) return null;
                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2;
                return (
                  <g key={`edge-${i}`}>
                    <line
                      x1={src.x} y1={src.y}
                      x2={tgt.x} y2={tgt.y}
                      stroke="var(--border-active)"
                      strokeWidth={1.5}
                      markerEnd="url(#rd-arrow)"
                      opacity={0.6}
                    />
                    {edge.label && (
                      <text
                        x={midX} y={midY - 6}
                        textAnchor="middle"
                        fill="var(--text-muted)"
                        fontSize={9}
                        fontFamily="var(--font-mono)"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {diagram.nodes.map(node => {
                const color = getGroupColor(node.group);
                return (
                  <g key={node.id}>
                    <rect
                      x={node.x - 55} y={node.y - 18}
                      width={110} height={36}
                      rx={8} ry={8}
                      fill="var(--bg-card)"
                      stroke={color}
                      strokeWidth={1.5}
                    />
                    <text
                      x={node.x} y={node.y + 4}
                      textAnchor="middle"
                      fill="var(--text-primary)"
                      fontSize={11}
                      fontFamily="var(--font-sans)"
                      fontWeight={500}
                    >
                      {node.label.length > 14 ? node.label.slice(0, 13) + '...' : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      <style>{`
        .repo-diagram {
          height: 100%;
          overflow-y: auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }
        .rd-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        .rd-header-icon { color: var(--purple); }
        .rd-title {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .rd-subtitle {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .rd-controls {
          background: var(--glass-bg);
          backdrop-filter: blur(var(--glass-blur));
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .rd-field { display: flex; flex-direction: column; gap: var(--space-sm); }
        .rd-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .rd-input {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-family: var(--font-mono);
          width: 100%;
        }
        .rd-input:focus {
          outline: none;
          border-color: var(--cyan);
          box-shadow: 0 0 0 3px var(--cyan-glow);
        }
        .rd-input::placeholder { color: var(--text-muted); }
        .rd-style-grid {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .rd-style-btn {
          padding: 5px 14px;
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .rd-style-btn:hover {
          border-color: var(--purple-dim);
          color: var(--text-primary);
        }
        .rd-style-btn.active {
          background: var(--purple-glow);
          border-color: var(--purple);
          color: var(--purple);
        }
        .rd-generate {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          padding: 12px;
          background: linear-gradient(135deg, var(--purple-dim), var(--cyan-dim));
          border: none;
          border-radius: var(--radius-md);
          color: #fff;
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .rd-generate:hover:not(:disabled) {
          filter: brightness(1.15);
          box-shadow: 0 0 20px var(--purple-glow);
        }
        .rd-generate:disabled { opacity: 0.5; cursor: not-allowed; }
        .rd-spin { animation: rdSpin 1s linear infinite; }
        @keyframes rdSpin { to { transform: rotate(360deg); } }
        .rd-error {
          padding: var(--space-md);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: var(--error);
          font-size: var(--text-sm);
        }
        .rd-viewport {
          flex: 1;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .rd-toolbar {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          border-bottom: 1px solid var(--border);
          background: var(--bg-surface);
        }
        .rd-tool-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .rd-tool-btn:hover {
          border-color: var(--cyan);
          color: var(--cyan);
        }
        .rd-zoom-label {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          min-width: 36px;
          text-align: center;
        }
        .rd-legend {
          display: flex;
          gap: var(--space-md);
          margin-left: auto;
        }
        .rd-legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: var(--text-secondary);
        }
        .rd-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .rd-svg-wrapper {
          flex: 1;
          overflow: hidden;
          cursor: grab;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rd-svg-wrapper:active { cursor: grabbing; }
        .rd-svg {
          width: 100%;
          height: 100%;
          transition: transform 0.05s linear;
        }

        @media (max-width: 640px) {
          .rd-legend { display: none; }
        }
      `}</style>
    </div>
  );
}
