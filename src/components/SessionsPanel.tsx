import { useState, useEffect } from 'react';
import { Terminal, MessageSquare, RefreshCw, Trash2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ventures } from '../lib/ventures';

interface ConvSummary {
  id: string;
  venture_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getVentureColor(ventureId: string): string {
  return ventures.find((v) => v.id === ventureId)?.color || '#8899AA';
}

function getVentureName(ventureId: string): string {
  return ventures.find((v) => v.id === ventureId)?.name || ventureId;
}

export default function SessionsPanel() {
  const [conversations, setConversations] = useState<ConvSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadSessions() {
    setLoading(true);
    try {
      if (supabase) {
        // Get conversations with message counts
        const { data: convs } = await supabase
          .from('conversations')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(50);

        if (convs) {
          const withCounts = await Promise.all(
            convs.map(async (c) => {
              const { count } = await supabase!
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', c.id);
              return { ...c, message_count: count || 0 };
            })
          );
          setConversations(withCounts);
        }
      } else {
        // Fallback: scan localStorage
        const allConvs: ConvSummary[] = [];
        for (const v of ventures) {
          const raw = localStorage.getItem(`naos-convs-${v.id}`);
          if (!raw) continue;
          const convs = JSON.parse(raw) as { id: string; title: string }[];
          for (const c of convs) {
            const msgsRaw = localStorage.getItem(`naos-${v.id}-${c.id}`);
            const msgs = msgsRaw ? JSON.parse(msgsRaw) : [];
            allConvs.push({
              id: c.id,
              venture_id: v.id,
              title: c.title,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              message_count: msgs.length,
            });
          }
        }
        setConversations(allConvs);
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteSession(id: string) {
    if (supabase) {
      await supabase.from('messages').delete().eq('conversation_id', id);
      await supabase.from('conversations').delete().eq('id', id);
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }

  useEffect(() => { loadSessions(); }, []);

  return (
    <div className="sessions-panel">
      <div className="sessions-header">
        <div className="sessions-header-left">
          <Terminal size={18} />
          <h2>All Sessions</h2>
          <span className="sessions-count">{conversations.length}</span>
        </div>
        <button className="sessions-refresh" onClick={loadSessions} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="sessions-list">
        {conversations.map((c) => (
          <div key={c.id} className="session-card">
            <div className="session-card-top">
              <span className="session-venture-dot" style={{ background: getVentureColor(c.venture_id) }} />
              <span className="session-venture">{getVentureName(c.venture_id)}</span>
              <Clock size={11} className="session-clock" />
              <span className="session-time">{timeAgo(c.updated_at)}</span>
              <button className="session-delete" onClick={() => deleteSession(c.id)}>
                <Trash2 size={12} />
              </button>
            </div>
            <div className="session-title">{c.title}</div>
            <div className="session-meta">
              <MessageSquare size={11} />
              <span>{c.message_count} messages</span>
            </div>
          </div>
        ))}

        {conversations.length === 0 && !loading && (
          <div className="sessions-empty">
            <Terminal size={24} />
            <p>No sessions yet. Start a chat in any venture.</p>
          </div>
        )}
      </div>

      <style>{`
        .sessions-panel {
          height: 100%;
          overflow-y: auto;
          padding: var(--space-lg);
        }

        .sessions-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-lg);
        }

        .sessions-header-left {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .sessions-header h2 { font-size: var(--text-lg); font-weight: 600; }

        .sessions-count {
          font-size: var(--text-xs);
          font-weight: 600;
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 1px 8px;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
        }

        .sessions-refresh {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }
        .sessions-refresh:hover { background: var(--bg-card); color: var(--cyan); }

        .sessions-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .session-card {
          padding: var(--space-md);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          transition: border-color var(--transition-fast);
        }

        .session-card:hover { border-color: var(--border-active); }

        .session-card-top {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }

        .session-venture-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .session-venture {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .session-clock { color: var(--text-muted); margin-left: auto; }

        .session-time {
          font-size: 10px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .session-delete {
          opacity: 0;
          padding: 3px;
          border-radius: 3px;
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }
        .session-card:hover .session-delete { opacity: 1; }
        .session-delete:hover { color: var(--error); background: rgba(239,68,68,0.1); }

        .session-title {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .session-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: var(--text-muted);
        }

        .sessions-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-2xl);
          color: var(--text-muted);
          text-align: center;
        }

        .sessions-empty p { font-size: var(--text-sm); }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
