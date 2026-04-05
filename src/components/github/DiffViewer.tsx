import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Minus, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PRFile } from '../../lib/api/github';

// ---------------------------------------------------------------------------
// Diff Viewer — unified diff rendering for PR/commit file changes
// ---------------------------------------------------------------------------

interface DiffViewerProps {
  files: PRFile[];
  className?: string;
}

/** Parse a unified diff patch into lines with types */
interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'header';
  content: string;
  oldNum?: number;
  newNum?: number;
}

function parsePatch(patch: string): DiffLine[] {
  if (!patch) return [];
  const lines = patch.split('\n');
  const result: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      // Parse hunk header: @@ -oldStart,oldCount +newStart,newCount @@
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
      result.push({ type: 'header', content: line });
    } else if (line.startsWith('+')) {
      result.push({ type: 'add', content: line.slice(1), newNum: newLine++ });
    } else if (line.startsWith('-')) {
      result.push({ type: 'remove', content: line.slice(1), oldNum: oldLine++ });
    } else {
      result.push({ type: 'context', content: line.startsWith(' ') ? line.slice(1) : line, oldNum: oldLine++, newNum: newLine++ });
    }
  }
  return result;
}

/** Status badge colors */
const STATUS_COLORS: Record<string, string> = {
  added: 'rgb(34, 197, 94)',
  removed: 'rgb(239, 68, 68)',
  modified: 'var(--cyan)',
  renamed: 'var(--text-secondary)',
};

// ---------------------------------------------------------------------------
// Single File Diff
// ---------------------------------------------------------------------------

function FileDiff({ file }: { file: PRFile }) {
  const [expanded, setExpanded] = useState(true);
  const diffLines = parsePatch(file.patch || '');

  return (
    <div className="dv-file">
      <button className="dv-file-header" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <FileText size={12} />
        <span className="dv-file-name">{file.filename}</span>
        <span className="dv-file-status" style={{ color: STATUS_COLORS[file.status] || 'var(--text-muted)' }}>
          {file.status}
        </span>
        <span className="dv-file-stats">
          {file.additions > 0 && <span className="dv-stat-add">+{file.additions}</span>}
          {file.deletions > 0 && <span className="dv-stat-del">-{file.deletions}</span>}
        </span>
      </button>

      {expanded && diffLines.length > 0 && (
        <div className="dv-diff">
          {diffLines.map((line, i) => (
            <div key={i} className={cn('dv-line', line.type)}>
              <span className="dv-line-num dv-old">{line.type === 'remove' || line.type === 'context' ? line.oldNum : ''}</span>
              <span className="dv-line-num dv-new">{line.type === 'add' || line.type === 'context' ? line.newNum : ''}</span>
              <span className="dv-line-prefix">
                {line.type === 'add' && '+'}{line.type === 'remove' && '-'}{line.type === 'context' && ' '}
              </span>
              <span className="dv-line-content">{line.content}</span>
            </div>
          ))}
        </div>
      )}

      {expanded && !file.patch && (
        <div className="dv-no-diff">Binary file or too large to display</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DiffViewer Component
// ---------------------------------------------------------------------------

export default function DiffViewer({ files, className }: DiffViewerProps) {
  const totalAdd = files.reduce((s, f) => s + f.additions, 0);
  const totalDel = files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className={cn('dv-container', className)}>
      <div className="dv-summary">
        <span>{files.length} files changed</span>
        <span className="dv-stat-add"><Plus size={10} /> {totalAdd}</span>
        <span className="dv-stat-del"><Minus size={10} /> {totalDel}</span>
      </div>

      {files.map((file) => (
        <FileDiff key={file.filename} file={file} />
      ))}

      <style>{`
        .dv-container { display:flex; flex-direction:column; gap:var(--space-sm); overflow-y:auto; }

        .dv-summary {
          display:flex; align-items:center; gap:var(--space-md); font-size:var(--text-xs);
          color:var(--text-secondary); padding:4px 0;
        }
        .dv-stat-add { color:rgb(34,197,94); display:flex; align-items:center; gap:2px; }
        .dv-stat-del { color:rgb(239,68,68); display:flex; align-items:center; gap:2px; }

        .dv-file {
          background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md);
          overflow:hidden;
        }

        .dv-file-header {
          display:flex; align-items:center; gap:6px; width:100%;
          padding:6px 10px; text-align:left; font-size:12px;
          color:var(--text-secondary); border-bottom:1px solid var(--border);
          background:var(--bg-surface); cursor:pointer;
        }
        .dv-file-header:hover { background:var(--bg-elevated); }

        .dv-file-name { flex:1; font-family:var(--font-mono); font-weight:500; color:var(--text-primary); }
        .dv-file-status { font-size:10px; font-weight:600; text-transform:uppercase; }
        .dv-file-stats { display:flex; gap:6px; font-size:10px; font-family:var(--font-mono); }

        .dv-diff { font-family:var(--font-mono); font-size:11px; line-height:1.5; overflow-x:auto; }

        .dv-line { display:flex; min-width:fit-content; }
        .dv-line.add { background:rgba(34,197,94,0.08); }
        .dv-line.remove { background:rgba(239,68,68,0.08); }
        .dv-line.header { background:rgba(0,240,255,0.04); color:var(--text-muted); font-style:italic; padding:2px 8px; }
        .dv-line.context { background:transparent; }

        .dv-line-num {
          width:40px; text-align:right; padding:0 6px; color:var(--text-muted);
          user-select:none; flex-shrink:0; font-size:10px;
        }
        .dv-line-num.dv-old { border-right:1px solid var(--border); }

        .dv-line-prefix {
          width:16px; text-align:center; flex-shrink:0; user-select:none;
        }
        .dv-line.add .dv-line-prefix { color:rgb(34,197,94); }
        .dv-line.remove .dv-line-prefix { color:rgb(239,68,68); }

        .dv-line-content { white-space:pre; padding-right:12px; }

        .dv-no-diff { padding:12px; font-size:var(--text-xs); color:var(--text-muted); text-align:center; }
      `}</style>
    </div>
  );
}
