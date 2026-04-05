import { useState, useRef, useEffect } from 'react';
import { GitBranch, ChevronDown, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { GitBranch as GitBranchType } from '../../lib/api/github';

// ---------------------------------------------------------------------------
// Branch Selector — dropdown for switching branches
// ---------------------------------------------------------------------------

interface BranchSelectorProps {
  branches: GitBranchType[];
  current: string;
  onChange: (branch: string) => void;
  className?: string;
}

export default function BranchSelector({ branches, current, onChange, className }: BranchSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className={cn('bs-container', className)}>
      <button className="bs-trigger" onClick={() => setOpen(!open)}>
        <GitBranch size={13} />
        <span className="bs-current">{current}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="bs-dropdown">
          {branches.map((b) => (
            <button
              key={b.name}
              className={cn('bs-option', b.name === current && 'active')}
              onClick={() => { onChange(b.name); setOpen(false); }}
            >
              <GitBranch size={11} />
              <span className="bs-branch-name">{b.name}</span>
              {b.protected && <Shield size={10} className="bs-protected" />}
              <span className="bs-sha">{b.sha}</span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        .bs-container { position:relative; }

        .bs-trigger {
          display:flex; align-items:center; gap:6px;
          padding:5px 10px; font-size:12px;
          background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm);
          color:var(--text-primary); cursor:pointer;
          transition:border-color var(--transition-fast);
        }
        .bs-trigger:hover { border-color:var(--border-active); }
        .bs-current { font-weight:600; font-family:var(--font-mono); }

        .bs-dropdown {
          position:absolute; top:100%; left:0; z-index:20;
          margin-top:4px; min-width:200px; max-height:300px; overflow-y:auto;
          background:var(--bg-surface); border:1px solid var(--border);
          border-radius:var(--radius-md); padding:4px;
          box-shadow:0 8px 24px rgba(0,0,0,0.4);
        }

        .bs-option {
          display:flex; align-items:center; gap:6px; width:100%;
          padding:5px 8px; font-size:11px; text-align:left;
          border-radius:4px; color:var(--text-secondary); cursor:pointer;
        }
        .bs-option:hover { background:var(--bg-elevated); color:var(--text-primary); }
        .bs-option.active { background:rgba(0,240,255,0.08); color:var(--cyan); }

        .bs-branch-name { flex:1; font-family:var(--font-mono); }
        .bs-protected { color:var(--text-muted); }
        .bs-sha { font-family:var(--font-mono); font-size:10px; color:var(--text-muted); }
      `}</style>
    </div>
  );
}
