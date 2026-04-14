import { useMemo, useState } from 'react';
import { Brain, ChevronDown, ChevronRight, Search, Pin, User, Sparkles, FolderOpen, BookMarked, MessageCircleHeart } from 'lucide-react';
import { useProjectMemory } from '../hooks/use-memory';
import { GlassCard, Badge } from './ui';
import type { MemoryEntry } from '../lib/types/memory';

interface MemoryShelfProps {
  ventureId?: string;
  sessionId?: string;
  tagFilter?: string[];
  title?: string;
  collapsed?: boolean;
  maxEntries?: number;
  onOpenMemoryView?: () => void;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  user: <User size={11} />,
  feedback: <MessageCircleHeart size={11} />,
  project: <FolderOpen size={11} />,
  reference: <BookMarked size={11} />,
  session: <Sparkles size={11} />,
};
const TYPE_COLOR: Record<string, string> = {
  user: 'var(--cyan)',
  feedback: 'var(--warning)',
  project: 'var(--purple, #8B5CF6)',
  reference: '#06B6D4',
  session: 'var(--success)',
};

export default function MemoryShelf({
  ventureId,
  sessionId,
  tagFilter,
  title = 'Memory Shelf',
  collapsed: defaultCollapsed = false,
  maxEntries = 12,
  onOpenMemoryView,
}: MemoryShelfProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [search, setSearch] = useState('');
  const { data: memories = [], isLoading } = useProjectMemory({ ventureId, sessionId, search: search || undefined });

  const filtered = useMemo(() => {
    let list: MemoryEntry[] = memories;
    if (tagFilter && tagFilter.length > 0) {
      list = list.filter(m => {
        const raw = typeof m.value === 'string' ? m.value : JSON.stringify(m.value || '');
        const hay = (m.key + ' ' + raw).toLowerCase();
        return tagFilter.some(t => hay.includes(t.toLowerCase()));
      });
    }
    return list.slice(0, maxEntries);
  }, [memories, tagFilter, maxEntries]);

  const grouped = useMemo(() => {
    const g: Record<string, MemoryEntry[]> = {};
    for (const m of filtered) (g[m.type] ||= []).push(m);
    return g;
  }, [filtered]);

  return (
    <GlassCard className="mem-shelf">
      <div className="mem-shelf-header" onClick={() => setCollapsed(v => !v)}>
        <div className="mem-shelf-title">
          {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          <Brain size={13} />
          <span>{title}</span>
          <Badge size="sm">{memories.length}</Badge>
        </div>
        {onOpenMemoryView && (
          <button className="mem-shelf-open" onClick={(e) => { e.stopPropagation(); onOpenMemoryView(); }}>
            <Pin size={10} /> Open
          </button>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="mem-shelf-search">
            <Search size={11} />
            <input
              placeholder="Filter memory..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mcv-input"
            />
          </div>

          <div className="mem-shelf-list">
            {isLoading && <div className="mem-shelf-empty">Loading…</div>}
            {!isLoading && filtered.length === 0 && (
              <div className="mem-shelf-empty">No memories {ventureId ? `for ${ventureId}` : 'yet'}.</div>
            )}
            {Object.entries(grouped).map(([type, entries]) => (
              <div key={type} className="mem-shelf-group">
                <div className="mem-shelf-group-header" style={{ color: TYPE_COLOR[type] || 'var(--text-muted)' }}>
                  {TYPE_ICON[type] || <Brain size={11} />}
                  <span>{type}</span>
                  <span className="mem-shelf-count">{entries.length}</span>
                </div>
                {entries.map(m => {
                  const preview = typeof m.value === 'string'
                    ? m.value
                    : JSON.stringify(m.value).slice(0, 140);
                  return (
                    <div key={m.id} className="mem-shelf-entry">
                      <div className="mem-shelf-entry-key" style={{ color: TYPE_COLOR[m.type] }}>{m.key}</div>
                      <div className="mem-shelf-entry-val">{preview}</div>
                      {m.ventureId && <div className="mem-shelf-entry-meta"><Badge size="sm">{m.ventureId}</Badge></div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        .mem-shelf { display:flex; flex-direction:column; overflow:hidden; padding:0; }
        .mem-shelf-header { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; cursor:pointer; user-select:none; border-bottom:1px solid var(--border); }
        .mem-shelf-header:hover { background:var(--bg-elevated); }
        .mem-shelf-title { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; }
        .mem-shelf-open { display:inline-flex; align-items:center; gap:3px; font-size:9px; color:var(--text-muted); padding:3px 8px; border-radius:var(--radius-sm); background:none; border:1px solid var(--border); cursor:pointer; transition:all 0.15s; }
        .mem-shelf-open:hover { color:var(--cyan); border-color:rgba(0,240,255,0.3); }

        .mem-shelf-search { display:flex; align-items:center; gap:6px; padding:8px 12px; border-bottom:1px solid var(--border); color:var(--text-muted); }
        .mem-shelf-search input { flex:1; font-size:11px; padding:4px 6px; }

        .mem-shelf-list { padding:6px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; max-height:360px; }
        .mem-shelf-empty { padding:16px 12px; font-size:11px; color:var(--text-muted); text-align:center; font-style:italic; }

        .mem-shelf-group { display:flex; flex-direction:column; gap:4px; }
        .mem-shelf-group-header { display:flex; align-items:center; gap:4px; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; padding:4px 6px; }
        .mem-shelf-count { margin-left:auto; font-family:var(--font-mono); color:var(--text-muted); font-size:9px; }

        .mem-shelf-entry { padding:8px 10px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); transition:all 0.15s; }
        .mem-shelf-entry:hover { border-color:var(--border-active); transform:translateY(-1px); }
        .mem-shelf-entry-key { font-size:11px; font-weight:600; margin-bottom:3px; }
        .mem-shelf-entry-val { font-size:10px; color:var(--text-secondary); line-height:1.4; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
        .mem-shelf-entry-meta { margin-top:4px; display:flex; gap:4px; }
      `}</style>
    </GlassCard>
  );
}
