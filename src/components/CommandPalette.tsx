import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowRight, Globe, MessageSquare } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useTheme } from '../stores/theme';
import { ventures } from '../lib/ventures';

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  action: () => void;
  icon?: React.ReactNode;
  color?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setView, switchToGlobal, switchToVenture } = useNavigation();
  const { applyGlobalTheme, applyVentureTheme } = useTheme();

  const allItems: PaletteItem[] = [
    // Views
    { id: 'v-command', label: 'Command Center', sublabel: 'Global overview', action: () => { switchToGlobal(); applyGlobalTheme(); setView('command-center'); }, icon: <Globe size={14} /> },
    { id: 'v-portfolio', label: 'Portfolio', sublabel: 'Venture health', action: () => { setView('portfolio'); } },
    { id: 'v-chat', label: 'Open NAOS Chat', sublabel: 'AI assistant', action: () => { setView('chat'); }, icon: <MessageSquare size={14} /> },
    { id: 'v-intel', label: 'Intelligence', sublabel: 'Documents & RAG', action: () => { setView('intelligence'); } },
    { id: 'v-treasury', label: 'Treasury', sublabel: 'EDGE & P&L', action: () => { setView('treasury'); } },
    { id: 'v-ops', label: 'Ops Center', sublabel: 'GitHub & Vercel', action: () => { setView('ops'); } },
    { id: 'v-eng', label: 'Engineering', sublabel: 'CTO workbench', action: () => { setView('engineering'); } },
    // Ventures
    ...ventures.map((v) => ({
      id: `venture-${v.id}`,
      label: v.name,
      sublabel: v.tagline,
      color: v.color,
      icon: <ArrowRight size={14} />,
      action: () => { switchToVenture(v.id); applyVentureTheme(v.id); },
    })),
  ];

  const filtered = query
    ? allItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.sublabel?.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback((item: PaletteItem) => {
    item.action();
    onClose();
  }, [onClose]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-row">
          <Search size={16} className="palette-search-icon" />
          <input
            ref={inputRef}
            className="palette-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search views, ventures, commands..."
          />
          <kbd className="palette-kbd">esc</kbd>
        </div>

        <div className="palette-results">
          {filtered.map((item, i) => (
            <button
              key={item.id}
              className={`palette-item ${i === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="palette-item-icon" style={item.color ? { color: item.color } : undefined}>
                {item.icon || <ArrowRight size={14} />}
              </span>
              <span className="palette-item-label">{item.label}</span>
              {item.sublabel && <span className="palette-item-sub">{item.sublabel}</span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="palette-empty">No results for "{query}"</div>
          )}
        </div>
      </div>

      <style>{`
        .palette-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          padding-top: 20vh;
        }

        .palette {
          width: 520px;
          max-height: 400px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: paletteIn 0.15s ease;
        }

        @keyframes paletteIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .palette-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
        }

        .palette-search-icon { color: var(--text-muted); flex-shrink: 0; }

        .palette-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: var(--text-base);
          outline: none;
        }

        .palette-input::placeholder { color: var(--text-muted); }

        .palette-kbd {
          font-size: 9px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 1px 5px;
          border-radius: 3px;
        }

        .palette-results {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
        }

        .palette-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          width: 100%;
          text-align: left;
          transition: background 0.05s;
        }

        .palette-item.selected { background: var(--bg-elevated); }

        .palette-item-icon { color: var(--text-muted); flex-shrink: 0; }
        .palette-item-label { font-size: var(--text-sm); font-weight: 500; color: var(--text-primary); }
        .palette-item-sub { font-size: var(--text-xs); color: var(--text-muted); margin-left: auto; }

        .palette-empty {
          padding: 20px;
          text-align: center;
          font-size: var(--text-sm);
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
