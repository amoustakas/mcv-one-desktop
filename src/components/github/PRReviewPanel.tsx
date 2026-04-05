import { useState } from 'react';
import { useGithubPRs, useGithubPRFiles } from '../../hooks/use-github';
import { EmptyState, Skeleton } from '../ui';
import { GitPullRequest, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import DiffViewer from './DiffViewer';

// ---------------------------------------------------------------------------
// PR Review Panel — select a PR, view file diffs
// ---------------------------------------------------------------------------

interface PRReviewPanelProps {
  repo: string;
}

export default function PRReviewPanel({ repo }: PRReviewPanelProps) {
  const [selectedPR, setSelectedPR] = useState<number | null>(null);

  const { data: prs = [], isLoading: prsLoading } = useGithubPRs(repo);
  const { data: prFiles = [], isLoading: filesLoading } = useGithubPRFiles(
    repo,
    selectedPR ? String(selectedPR) : '',
  );

  return (
    <div className="prr-layout">
      {/* PR list */}
      <div className="prr-sidebar">
        <div className="prr-sidebar-title">Pull Requests</div>
        {prsLoading ? (
          <div className="prr-loading">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} width="100%" height={40} />)}
          </div>
        ) : prs.length === 0 ? (
          <EmptyState icon={<GitPullRequest size={20} />} title="No PRs" />
        ) : (
          prs.map((pr) => {
            const statusColor = pr.state === 'open' ? 'var(--success)' : pr.state === 'closed' ? 'var(--error)' : 'var(--text-muted)';
            return (
              <button
                key={pr.number}
                className={cn('prr-item', selectedPR === pr.number && 'active')}
                onClick={() => setSelectedPR(pr.number)}
              >
                <GitPullRequest size={13} style={{ color: statusColor }} />
                <div className="prr-item-info">
                  <span className="prr-item-title">#{pr.number} {pr.title}</span>
                  <span className="prr-item-meta">{pr.user?.login} · {pr.state}</span>
                </div>
                <ChevronRight size={12} />
              </button>
            );
          })
        )}
      </div>

      {/* Diff viewer */}
      <div className="prr-content">
        {!selectedPR ? (
          <EmptyState
            icon={<GitPullRequest size={32} />}
            title="Select a PR"
            description="Choose a pull request to review its file changes"
          />
        ) : filesLoading ? (
          <div className="prr-diff-loading">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} width="100%" height={80} />)}
          </div>
        ) : prFiles.length === 0 ? (
          <EmptyState icon={<GitPullRequest size={24} />} title="No file changes" />
        ) : (
          <DiffViewer files={prFiles} />
        )}
      </div>

      <style>{`
        .prr-layout { display:flex; height:100%; overflow:hidden; gap:1px; background:var(--border); }

        .prr-sidebar {
          width:320px; flex-shrink:0; display:flex; flex-direction:column;
          background:var(--bg-surface); overflow-y:auto;
        }

        .prr-sidebar-title {
          padding:10px 12px; font-size:var(--text-sm); font-weight:700;
          border-bottom:1px solid var(--border); color:var(--text-primary); flex-shrink:0;
        }

        .prr-loading { padding:8px; display:flex; flex-direction:column; gap:6px; }

        .prr-item {
          display:flex; align-items:center; gap:8px; width:100%;
          padding:8px 12px; text-align:left; font-size:12px;
          border-bottom:1px solid var(--border); cursor:pointer;
          color:var(--text-secondary); transition:background var(--transition-fast);
        }
        .prr-item:hover { background:var(--bg-elevated); }
        .prr-item.active { background:rgba(0,240,255,0.06); }

        .prr-item-info { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; }
        .prr-item-title {
          font-weight:600; color:var(--text-primary);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .prr-item-meta { font-size:10px; color:var(--text-muted); }

        .prr-content { flex:1; min-width:0; overflow-y:auto; padding:var(--space-md); background:var(--bg-deep); }
        .prr-diff-loading { display:flex; flex-direction:column; gap:8px; }

        @media (max-width: 768px) {
          .prr-layout { flex-direction:column; }
          .prr-sidebar { width:100%; max-height:40vh; }
        }
      `}</style>
    </div>
  );
}
