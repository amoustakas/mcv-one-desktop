import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { GitTreeEntry } from '../../lib/api/github';

// ---------------------------------------------------------------------------
// File Tree — recursive folder tree with expand/collapse
// ---------------------------------------------------------------------------

interface TreeNode {
  name: string;
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  children: TreeNode[];
}

/** Build a nested tree from a flat list of paths */
function buildTree(entries: GitTreeEntry[]): TreeNode[] {
  const root: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  // Sort: folders first, then alphabetical
  const sorted = [...entries].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const entry of sorted) {
    const parts = entry.path.split('/');
    const name = parts[parts.length - 1];
    const node: TreeNode = { name, path: entry.path, type: entry.type, size: entry.size, children: [] };
    nodeMap.set(entry.path, node);

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = nodeMap.get(parentPath);
      if (parent) parent.children.push(node);
    }
  }

  return root;
}

/** File type → icon color */
function getFileColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  const colors: Record<string, string> = {
    ts: '#3178C6', tsx: '#3178C6',
    js: '#F7DF1E', jsx: '#F7DF1E',
    css: '#264de4', scss: '#CC6699',
    json: '#6B7280', md: '#6B7280',
    html: '#E34F26', svg: '#FFB13B',
    py: '#3776AB', rs: '#DEA584',
    go: '#00ADD8', sql: '#F29111',
  };
  return colors[ext || ''] || 'var(--text-muted)';
}

// ---------------------------------------------------------------------------
// Tree Node Component
// ---------------------------------------------------------------------------

function TreeNodeRow({
  node,
  depth,
  selectedPath,
  onSelect,
  defaultExpanded,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  defaultExpanded: Set<string>;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded.has(node.path));
  const isFolder = node.type === 'tree';
  const isSelected = node.path === selectedPath;

  return (
    <>
      <button
        className={cn('ft-row', isSelected && 'selected')}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => {
          if (isFolder) setExpanded(!expanded);
          else onSelect(node.path);
        }}
      >
        {isFolder ? (
          <>
            <span className="ft-chevron">{expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>
            {expanded ? <FolderOpen size={14} className="ft-icon-folder" /> : <Folder size={14} className="ft-icon-folder" />}
          </>
        ) : (
          <>
            <span className="ft-chevron" />
            <File size={13} style={{ color: getFileColor(node.name) }} />
          </>
        )}
        <span className="ft-name">{node.name}</span>
        {!isFolder && node.size != null && (
          <span className="ft-size">{node.size < 1024 ? `${node.size}B` : `${(node.size / 1024).toFixed(0)}K`}</span>
        )}
      </button>
      {isFolder && expanded && node.children.map((child) => (
        <TreeNodeRow
          key={child.path}
          node={child}
          depth={depth + 1}
          selectedPath={selectedPath}
          onSelect={onSelect}
          defaultExpanded={defaultExpanded}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// FileTree Component
// ---------------------------------------------------------------------------

interface FileTreeProps {
  entries: GitTreeEntry[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  className?: string;
}

export default function FileTree({ entries, selectedPath, onSelect, className }: FileTreeProps) {
  // Auto-expand folders in the selected file's path
  const defaultExpanded = useMemo(() => {
    const set = new Set<string>();
    if (selectedPath) {
      const parts = selectedPath.split('/');
      for (let i = 1; i < parts.length; i++) {
        set.add(parts.slice(0, i).join('/'));
      }
    }
    // Also auto-expand src/ if it exists
    set.add('src');
    return set;
  }, [selectedPath]);

  const tree = useMemo(() => buildTree(entries), [entries]);

  return (
    <div className={cn('ft-container', className)}>
      {tree.map((node) => (
        <TreeNodeRow
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
          defaultExpanded={defaultExpanded}
        />
      ))}

      <style>{`
        .ft-container { overflow-y:auto; font-size:12px; }

        .ft-row {
          display:flex; align-items:center; gap:4px; width:100%;
          padding:3px 8px; text-align:left; cursor:pointer;
          color:var(--text-secondary); border-radius:3px;
          transition:background var(--transition-fast);
        }
        .ft-row:hover { background:var(--bg-elevated); color:var(--text-primary); }
        .ft-row.selected { background:rgba(0,240,255,0.08); color:var(--cyan); }

        .ft-chevron { width:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:var(--text-muted); }
        .ft-icon-folder { color:var(--cyan); opacity:0.7; flex-shrink:0; }
        .ft-name { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ft-size { font-size:10px; color:var(--text-muted); flex-shrink:0; font-family:var(--font-mono); }
      `}</style>
    </div>
  );
}
