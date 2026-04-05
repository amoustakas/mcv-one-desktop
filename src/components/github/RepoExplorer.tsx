import { useState } from 'react';
import { useGithubBranches, useGithubTree, useGithubFile } from '../../hooks/use-github';
import { EmptyState, Skeleton } from '../ui';
import { Folder } from 'lucide-react';
import BranchSelector from './BranchSelector';
import FileTree from './FileTree';
import CodeViewer from './CodeViewer';

// ---------------------------------------------------------------------------
// Repo Explorer — BranchSelector + FileTree + CodeViewer
// ---------------------------------------------------------------------------

interface RepoExplorerProps {
  repo: string;
}

export default function RepoExplorer({ repo }: RepoExplorerProps) {
  const [branch, setBranch] = useState('master');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const { data: branches = [], isLoading: branchesLoading } = useGithubBranches(repo);
  const { data: treeData, isLoading: treeLoading } = useGithubTree(repo, branch);
  const { data: fileData, isLoading: fileLoading } = useGithubFile(repo, selectedFile || '', branch);

  const entries = treeData?.tree ?? [];

  return (
    <div className="re-layout">
      {/* Left panel — tree */}
      <div className="re-sidebar">
        <div className="re-sidebar-header">
          {branchesLoading ? (
            <Skeleton width={120} height={28} />
          ) : (
            <BranchSelector
              branches={branches}
              current={branch}
              onChange={(b) => { setBranch(b); setSelectedFile(null); }}
            />
          )}
        </div>

        <div className="re-tree">
          {treeLoading ? (
            <div className="re-tree-loading">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} width={`${60 + Math.random() * 30}%`} height={18} />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <EmptyState icon={<Folder size={24} />} title="No files" description="Empty repository or branch" />
          ) : (
            <FileTree
              entries={entries}
              selectedPath={selectedFile}
              onSelect={setSelectedFile}
            />
          )}
        </div>
      </div>

      {/* Right panel — code viewer */}
      <div className="re-content">
        {!selectedFile ? (
          <EmptyState
            icon={<Folder size={32} />}
            title="Select a file"
            description="Choose a file from the tree to view its contents"
          />
        ) : fileLoading ? (
          <div className="re-file-loading">
            <Skeleton width="100%" height={32} />
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} width={`${40 + Math.random() * 50}%`} height={16} />
            ))}
          </div>
        ) : fileData ? (
          <CodeViewer
            content={fileData.content}
            filename={fileData.name}
            path={fileData.path}
            size={fileData.size}
          />
        ) : (
          <EmptyState icon={<Folder size={24} />} title="File not found" />
        )}
      </div>

      <style>{`
        .re-layout { display:flex; height:100%; overflow:hidden; gap:1px; background:var(--border); }

        .re-sidebar {
          width:280px; flex-shrink:0; display:flex; flex-direction:column;
          background:var(--bg-surface); overflow:hidden;
        }

        .re-sidebar-header { padding:8px; border-bottom:1px solid var(--border); flex-shrink:0; }

        .re-tree { flex:1; overflow-y:auto; padding:4px 0; }
        .re-tree-loading { padding:8px; display:flex; flex-direction:column; gap:6px; }

        .re-content { flex:1; min-width:0; background:var(--bg-deep); display:flex; flex-direction:column; }
        .re-file-loading { padding:16px; display:flex; flex-direction:column; gap:8px; }

        @media (max-width: 768px) {
          .re-layout { flex-direction:column; }
          .re-sidebar { width:100%; max-height:40vh; }
        }
      `}</style>
    </div>
  );
}
