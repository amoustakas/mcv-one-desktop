import { useState } from 'react';
import { Wrench, GitBranch, GitPullRequest, ExternalLink, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useGithubRepos, useGithubCommits, useGithubPRs } from '../hooks/use-github';

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const LANG_COLORS: Record<string, string> = { TypeScript: '#3178C6', Python: '#3572A5', JavaScript: '#F7DF1E', Rust: '#DEA584' };

export default function EngineeringView() {
  const [activeRepo, setActiveRepo] = useState('mcv-one-desktop');

  const { data: repos = [], isLoading: reposLoading, refetch: refetchRepos } = useGithubRepos();
  const { data: commits = [], isLoading: commitsLoading, refetch: refetchCommits } = useGithubCommits(activeRepo);
  const { data: prs = [], isLoading: prsLoading, refetch: refetchPRs } = useGithubPRs(activeRepo);

  const loading = reposLoading || commitsLoading || prsLoading;

  function refresh() {
    refetchRepos();
    refetchCommits();
    refetchPRs();
  }

  return (
    <div className="eng">
      <div className="eng-header">
        <Wrench size={20} />
        <h1 className="eng-title">Engineering</h1>
        <button className="eng-refresh" onClick={refresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="eng-grid">
        {/* Repos */}
        <div className="eng-panel">
          <h2 className="eng-panel-title"><GitBranch size={14} /> Repositories</h2>
          <div className="eng-repos">
            {repos.map(r => (
              <button key={r.name} className={`eng-repo ${activeRepo === r.name ? 'active' : ''}`} onClick={() => setActiveRepo(r.name)}>
                <div className="eng-repo-top">
                  <span className="eng-repo-name">{r.name}</span>
                  {r.language && <span className="eng-repo-lang" style={{ color: LANG_COLORS[r.language] || '#888' }}>{r.language}</span>}
                </div>
                <div className="eng-repo-meta">
                  {r.updated_at && <span>{timeAgo(r.updated_at)} ago</span>}
                  {r.open_issues_count > 0 && <span>{r.open_issues_count} issues</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Commits */}
        <div className="eng-panel">
          <h2 className="eng-panel-title">
            <Clock size={14} /> Commits
            <span className="eng-panel-badge">{activeRepo}</span>
          </h2>
          <div className="eng-commits">
            {commits.map(c => (
              <a key={c.sha} href={c.html_url} target="_blank" rel="noreferrer" className="eng-commit">
                <code className="eng-sha">{c.sha.slice(0, 7)}</code>
                <span className="eng-commit-msg">{c.commit.message}</span>
                <span className="eng-commit-meta">{c.commit.author.name} &middot; {timeAgo(c.commit.author.date)}</span>
              </a>
            ))}
            {commits.length === 0 && !loading && <p className="eng-empty">No commits</p>}
          </div>
        </div>

        {/* PRs */}
        <div className="eng-panel">
          <h2 className="eng-panel-title">
            <GitPullRequest size={14} /> Pull Requests
            <span className="eng-panel-badge">{activeRepo}</span>
          </h2>
          <div className="eng-prs">
            {prs.map(p => (
              <a key={p.number} href={p.html_url} target="_blank" rel="noreferrer" className="eng-pr">
                <span className="eng-pr-icon">
                  {p.state === 'closed' ? <CheckCircle2 size={13} className="merged" /> : p.state === 'open' ? <GitPullRequest size={13} className="open" /> : <XCircle size={13} className="closed" />}
                </span>
                <div className="eng-pr-info">
                  <span className="eng-pr-title">#{p.number} {p.title}</span>
                  <span className="eng-pr-meta">{p.user.login} &middot; {timeAgo(p.updated_at)}</span>
                </div>
                <ExternalLink size={10} className="eng-pr-link" />
              </a>
            ))}
            {prs.length === 0 && !loading && <p className="eng-empty">No PRs</p>}
          </div>
        </div>
      </div>

      <style>{`
        .eng { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .eng-header { display: flex; align-items: center; gap: 8px; padding: 16px 20px 12px; flex-shrink: 0; }
        .eng-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; flex: 1; }
        .eng-refresh { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); color: var(--text-muted); transition: all 0.15s; }
        .eng-refresh:hover { background: var(--bg-card); color: var(--cyan); }

        .eng-grid { flex: 1; display: grid; grid-template-columns: 260px 1fr 1fr; gap: 1px; background: var(--border); overflow: hidden; }
        .eng-panel { background: var(--bg-deep); display: flex; flex-direction: column; overflow: hidden; }
        .eng-panel-title { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .eng-panel-badge { font-family: var(--font-mono); font-size: 9px; color: var(--cyan); background: var(--bg-card); padding: 1px 6px; border-radius: 3px; margin-left: auto; }

        .eng-repos { flex: 1; overflow-y: auto; padding: 4px; display: flex; flex-direction: column; gap: 2px; }
        .eng-repo { padding: 8px 10px; border-radius: var(--radius-sm); text-align: left; transition: all 0.1s; }
        .eng-repo:hover { background: var(--bg-card); }
        .eng-repo.active { background: var(--bg-elevated); border-left: 2px solid var(--cyan); }
        .eng-repo-top { display: flex; justify-content: space-between; align-items: center; }
        .eng-repo-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
        .eng-repo-lang { font-size: 9px; font-weight: 600; }
        .eng-repo-meta { font-size: 10px; color: var(--text-muted); display: flex; gap: 8px; margin-top: 2px; }

        .eng-commits, .eng-prs { flex: 1; overflow-y: auto; }
        .eng-commit { display: flex; align-items: baseline; gap: 8px; padding: 7px 14px; border-bottom: 1px solid var(--border); text-decoration: none; transition: background 0.1s; }
        .eng-commit:hover { background: var(--bg-card); }
        .eng-sha { font-family: var(--font-mono); font-size: 10px; color: var(--cyan); background: var(--bg-surface); padding: 1px 5px; border-radius: 3px; flex-shrink: 0; }
        .eng-commit-msg { font-size: 11px; color: var(--text-secondary); flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .eng-commit-meta { font-size: 9px; color: var(--text-muted); flex-shrink: 0; }

        .eng-pr { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-bottom: 1px solid var(--border); text-decoration: none; transition: background 0.1s; }
        .eng-pr:hover { background: var(--bg-card); }
        .eng-pr-icon .merged { color: var(--purple); }
        .eng-pr-icon .open { color: var(--success); }
        .eng-pr-icon .closed { color: var(--error); }
        .eng-pr-info { flex: 1; min-width: 0; }
        .eng-pr-title { display: block; font-size: 12px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .eng-pr-meta { display: block; font-size: 10px; color: var(--text-muted); }
        .eng-pr-link { color: var(--text-muted); flex-shrink: 0; }

        .eng-empty { padding: 20px; text-align: center; font-size: 11px; color: var(--text-muted); }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        @media (max-width: 1200px) { .eng-grid { grid-template-columns: 1fr 1fr; } .eng-grid > :first-child { grid-column: 1 / -1; } }
      `}</style>
    </div>
  );
}
