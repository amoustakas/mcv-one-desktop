import { useMemo } from 'react';
import { Radio, RefreshCw, Zap, GitCommit, Cloud, FileText, MessageSquare, Bot } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGithubCommits } from '../hooks/use-github';
import { useDeployments } from '../hooks/use-deployments';
import { useDocuments } from '../hooks/use-docs';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface Signal {
  id: string;
  type: 'deploy' | 'commit' | 'doc' | 'chat' | 'system';
  source: string;
  message: string;
  time: string;
  color: string;
}

const ICONS: Record<string, React.ReactNode> = {
  deploy: <Cloud size={12} />,
  commit: <GitCommit size={12} />,
  doc: <FileText size={12} />,
  chat: <MessageSquare size={12} />,
  system: <Bot size={12} />,
};

function timeAgo(d: string | number) { const mins = Math.floor((Date.now() - (typeof d === 'number' ? d : new Date(d).getTime())) / 60000); if (mins < 1) return 'now'; if (mins < 60) return `${mins}m`; const h = Math.floor(mins / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; }

export default function SignalsView() {
  const queryClient = useQueryClient();

  const { data: rawCommits = [], isLoading: commitsLoading } = useGithubCommits();
  const { data: rawDeploys = [], isLoading: deploysLoading } = useDeployments();
  const { data: rawDocs = [], isLoading: docsLoading } = useDocuments();

  // Recent conversations from Supabase (no dedicated hook)
  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ['signals', 'conversations'],
    queryFn: async () => {
      if (!supabase) return [];
      const { data } = await supabase
        .from('conversations')
        .select('id, title, venture_id, updated_at')
        .order('updated_at', { ascending: false })
        .limit(6);
      return data || [];
    },
    refetchInterval: 30000,
  });

  const loading = commitsLoading || deploysLoading || docsLoading || convsLoading;

  // Build unified signal feed
  const signals = useMemo<Signal[]>(() => {
    const results: Signal[] = [];

    // Commits
    for (const c of rawCommits.slice(0, 8)) {
      const sha = c.sha.slice(0, 7);
      results.push({ id: `c-${c.sha}`, type: 'commit', source: 'GitHub', message: `[${sha}] ${c.commit.message.split('\n')[0]}`, time: c.commit.author.date, color: '#00F0FF' });
    }

    // Deployments
    for (const d of rawDeploys.slice(0, 6)) {
      const state = d.state === 'READY' ? 'deployed' : d.state;
      results.push({ id: `d-${d.uid || d.created}`, type: 'deploy', source: 'Vercel', message: `${d.name} ${state} → ${d.target || 'preview'}`, time: new Date(d.created).toISOString(), color: '#10B981' });
    }

    // Documents
    for (const d of rawDocs.slice(0, 6)) {
      results.push({ id: `doc-${d.id}`, type: 'doc', source: 'Intel', message: `"${d.title}" (${d.doc_type})`, time: d.updated_at, color: '#8B5CF6' });
    }

    // Conversations
    for (const c of conversations) {
      results.push({ id: `conv-${c.id}`, type: 'chat', source: c.venture_id, message: c.title, time: c.updated_at, color: '#F59E0B' });
    }

    // Sort by time descending
    results.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return results;
  }, [rawCommits, rawDeploys, rawDocs, conversations]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['github'] });
    queryClient.invalidateQueries({ queryKey: ['vercel'] });
    queryClient.invalidateQueries({ queryKey: ['docs'] });
    queryClient.invalidateQueries({ queryKey: ['signals', 'conversations'] });
  };

  return (
    <div className="sig">
      <div className="sig-header">
        <Radio size={20} />
        <h1 className="sig-title">Signals</h1>
        <span className="sig-live"><Zap size={10} /> LIVE</span>
        <button className="sig-refresh" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="sig-feed">
        {signals.map(s => (
          <div key={s.id} className="sig-item">
            <span className="sig-icon" style={{ color: s.color }}>{ICONS[s.type]}</span>
            <span className="sig-source">{s.source}</span>
            <span className="sig-msg">{s.message}</span>
            <span className="sig-time">{timeAgo(s.time)}</span>
          </div>
        ))}
        {signals.length === 0 && !loading && <p className="sig-empty">No signals yet</p>}
      </div>

      <style>{`
        .sig { height: 100%; display: flex; flex-direction: column; }
        .sig-header { display: flex; align-items: center; gap: 8px; padding: 16px 20px 12px; flex-shrink: 0; }
        .sig-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; flex: 1; }
        .sig-live { font-size: 9px; font-weight: 700; color: var(--success); background: rgba(16,185,129,0.1); padding: 2px 8px; border-radius: var(--radius-full); display: flex; align-items: center; gap: 3px; animation: pulse 2s ease-in-out infinite; }
        .sig-refresh { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); color: var(--text-muted); }

        .sig-feed { flex: 1; overflow-y: auto; }
        .sig-item { display: flex; align-items: center; gap: 10px; padding: 8px 20px; border-bottom: 1px solid var(--border); transition: background 0.1s; }
        .sig-item:hover { background: var(--bg-card); }
        .sig-icon { flex-shrink: 0; }
        .sig-source { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px; width: 70px; flex-shrink: 0; }
        .sig-msg { flex: 1; font-size: 12px; color: var(--text-secondary); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .sig-time { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); flex-shrink: 0; }
        .sig-empty { padding: 32px; text-align: center; color: var(--text-muted); font-size: 12px; }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
