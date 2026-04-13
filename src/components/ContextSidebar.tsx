import { useState, useEffect, useCallback } from 'react';
import {
  Brain, Mail, Calendar, FileText, CheckSquare, Users,
  BarChart3, ChevronRight, ExternalLink, RefreshCw,
  X, Sparkles, Loader2, Clock,
} from 'lucide-react';
import { useGoogleWorkspaceStore, type ContextItem } from '../stores/google-workspace';
import { GlassCard, Badge } from './ui';

// ---------------------------------------------------------------------------
// Context Intelligence Sidebar
// Watches what the user is viewing and surfaces related data from all
// connected Google services. This is the "connected dots" layer.
// ---------------------------------------------------------------------------

const SERVICE_ICONS: Record<string, typeof Mail> = {
  gmail: Mail, calendar: Calendar, drive: FileText,
  tasks: CheckSquare, contacts: Users, analytics: BarChart3,
  crm: Users,
};

const SERVICE_COLORS: Record<string, string> = {
  gmail: '#EA4335', calendar: '#4285F4', drive: '#0F9D58',
  tasks: '#FBBC04', contacts: '#34A853', analytics: '#F57C00',
  crm: '#8B5CF6',
};

interface ContextSidebarProps {
  entity?: { type: string; id: string; name: string } | null;
  visible?: boolean;
  onClose?: () => void;
}

async function fetchContextForEntity(entity: { type: string; id: string; name: string }): Promise<ContextItem[]> {
  const items: ContextItem[] = [];
  const name = entity.name;
  const now = Date.now();

  // Parallel fetch from all services
  const [emailRes, calRes, driveRes, tasksRes] = await Promise.allSettled([
    // Gmail: search for related emails
    fetch(`/api/gmail?action=search&q=${encodeURIComponent(name)}&maxResults=5`)
      .then(r => r.ok ? r.json() : null),
    // Calendar: search for related events
    fetch(`/api/google-calendar?action=list-events&q=${encodeURIComponent(name)}&maxResults=5`)
      .then(r => r.ok ? r.json() : null),
    // Drive: search for related docs
    fetch(`/api/google-drive?action=search&q=${encodeURIComponent(name)}&maxResults=5`)
      .then(r => r.ok ? r.json() : null),
    // Tasks: search (via list, filter client-side)
    fetch('/api/google-tasks?action=list-tasks&showCompleted=false')
      .then(r => r.ok ? r.json() : null),
  ]);

  // Process Gmail results
  if (emailRes.status === 'fulfilled' && emailRes.value?.messages) {
    for (const msg of emailRes.value.messages.slice(0, 4)) {
      items.push({
        id: `gmail-${msg.id}`,
        service: 'gmail',
        type: 'email',
        title: msg.subject || '(no subject)',
        subtitle: msg.from?.split('<')[0]?.trim() || 'Unknown',
        timestamp: msg.date || '',
        relevanceScore: 0.8,
        data: msg,
      });
    }
  }

  // Process Calendar results
  if (calRes.status === 'fulfilled' && calRes.value?.items) {
    for (const ev of calRes.value.items.slice(0, 3)) {
      items.push({
        id: `cal-${ev.id}`,
        service: 'calendar',
        type: 'event',
        title: ev.summary || 'Untitled event',
        subtitle: ev.start?.dateTime
          ? new Date(ev.start.dateTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
          : ev.start?.date || '',
        timestamp: ev.start?.dateTime || ev.start?.date || '',
        relevanceScore: 0.7,
        data: ev,
      });
    }
  }

  // Process Drive results
  if (driveRes.status === 'fulfilled' && driveRes.value?.files) {
    for (const file of driveRes.value.files.slice(0, 3)) {
      items.push({
        id: `drive-${file.id}`,
        service: 'drive',
        type: 'file',
        title: file.name || 'Untitled',
        subtitle: file.mimeType?.split('.').pop() || 'file',
        timestamp: file.modifiedTime || '',
        relevanceScore: 0.6,
        data: file,
        url: file.webViewLink,
      });
    }
  }

  // Process Tasks (client-side filter by name)
  if (tasksRes.status === 'fulfilled' && tasksRes.value?.items) {
    const nameLower = name.toLowerCase();
    const matching = tasksRes.value.items.filter((t: { title: string; notes?: string }) =>
      t.title?.toLowerCase().includes(nameLower) || t.notes?.toLowerCase().includes(nameLower),
    );
    for (const task of matching.slice(0, 3)) {
      items.push({
        id: `task-${task.id}`,
        service: 'tasks',
        type: 'task',
        title: task.title,
        subtitle: task.due ? `Due: ${new Date(task.due).toLocaleDateString()}` : 'No due date',
        timestamp: task.due || task.updated || '',
        relevanceScore: 0.5,
        data: task,
      });
    }
  }

  // Sort by relevance
  items.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return items;
}

function ContextItemCard({ item }: { item: ContextItem }) {
  const Icon = SERVICE_ICONS[item.service] || FileText;
  const color = SERVICE_COLORS[item.service] || 'var(--text-muted)';

  return (
    <div className="ctx-item">
      <div className="ctx-item-icon" style={{ color }}>
        <Icon size={14} />
      </div>
      <div className="ctx-item-content">
        <div className="ctx-item-title">{item.title}</div>
        <div className="ctx-item-subtitle">{item.subtitle}</div>
      </div>
      {item.url && (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="ctx-item-link">
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}

export default function ContextSidebar({ entity, visible = true, onClose }: ContextSidebarProps) {
  const { contextItems, contextLoading, setContextItems, setContextLoading, setContextEntity } = useGoogleWorkspaceStore();
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadContext = useCallback(async () => {
    if (!entity) return;
    setContextLoading(true);
    setContextEntity(entity);
    try {
      const items = await fetchContextForEntity(entity);
      setContextItems(items);
    } catch {
      setContextItems([]);
    } finally {
      setContextLoading(false);
    }
  }, [entity?.id, entity?.name]);

  useEffect(() => {
    if (entity) loadContext();
  }, [entity?.id, loadContext]);

  const generateAiSummary = async () => {
    if (contextItems.length === 0) return;
    setAiLoading(true);
    try {
      const context = contextItems.map(i => `[${i.service}] ${i.title}: ${i.subtitle}`).join('\n');
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gemini-generate',
          prompt: `You are a chief of staff. Briefly summarize the relationship between "${entity?.name}" and the user based on this data. What's the current status? What needs attention? Be concise (3-4 sentences max).\n\nRelated items:\n${context}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.content);
      }
    } catch { /* ignore */ }
    finally { setAiLoading(false); }
  };

  if (!visible || !entity) return null;

  // Group items by service
  const grouped = contextItems.reduce<Record<string, ContextItem[]>>((acc, item) => {
    (acc[item.service] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="ctx-sidebar">
      <div className="ctx-header">
        <div className="ctx-header-info">
          <Brain size={16} style={{ color: 'var(--cyan)' }} />
          <div>
            <div className="ctx-entity-name">{entity.name}</div>
            <div className="ctx-entity-type">{entity.type}</div>
          </div>
        </div>
        <div className="ctx-header-actions">
          <button className="ctx-icon-btn" onClick={loadContext} title="Refresh"><RefreshCw size={14} /></button>
          {onClose && <button className="ctx-icon-btn" onClick={onClose}><X size={14} /></button>}
        </div>
      </div>

      {/* AI Summary */}
      <div className="ctx-ai-section">
        {aiSummary ? (
          <div className="ctx-ai-summary">
            <Sparkles size={12} style={{ color: 'var(--purple)' }} />
            <span>{aiSummary}</span>
          </div>
        ) : (
          <button className="ctx-ai-btn" onClick={generateAiSummary} disabled={aiLoading || contextItems.length === 0}>
            <Sparkles size={12} /> {aiLoading ? 'Analyzing...' : 'AI Context Summary'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="ctx-body">
        {contextLoading ? (
          <div className="ctx-loading">
            <Loader2 size={16} className="ctx-spinner" />
            <span>Gathering context...</span>
          </div>
        ) : contextItems.length === 0 ? (
          <div className="ctx-empty">
            <p>No related items found across Google Workspace.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([service, items]) => {
            const Icon = SERVICE_ICONS[service] || FileText;
            const color = SERVICE_COLORS[service] || 'var(--text-muted)';
            return (
              <div key={service} className="ctx-group">
                <div className="ctx-group-header">
                  <Icon size={12} style={{ color }} />
                  <span>{service.charAt(0).toUpperCase() + service.slice(1)}</span>
                  <Badge>{items.length}</Badge>
                </div>
                {items.map(item => <ContextItemCard key={item.id} item={item} />)}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .ctx-sidebar {
          width: 300px; height: 100%; background: var(--bg-surface);
          border-left: 1px solid var(--border); display: flex; flex-direction: column;
          overflow: hidden;
        }
        .ctx-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: var(--space-md); border-bottom: 1px solid var(--border);
        }
        .ctx-header-info { display: flex; gap: var(--space-sm); align-items: flex-start; }
        .ctx-entity-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .ctx-entity-type { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .ctx-header-actions { display: flex; gap: 2px; }
        .ctx-icon-btn {
          display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;
          border: none; background: transparent; color: var(--text-muted); cursor: pointer;
          border-radius: var(--radius-sm);
        }
        .ctx-icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

        .ctx-ai-section { padding: var(--space-sm) var(--space-md); border-bottom: 1px solid var(--border); }
        .ctx-ai-btn {
          display: flex; align-items: center; gap: 4px; width: 100%; padding: 6px 10px;
          border: 1px solid rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.04);
          color: var(--purple, #8B5CF6); cursor: pointer; border-radius: var(--radius-sm);
          font-size: 12px; justify-content: center;
        }
        .ctx-ai-btn:hover { background: rgba(139, 92, 246, 0.1); }
        .ctx-ai-btn:disabled { opacity: 0.5; }
        .ctx-ai-summary {
          display: flex; gap: 8px; font-size: 12px; color: var(--text-secondary); line-height: 1.5;
          align-items: flex-start;
        }
        .ctx-ai-summary svg { flex-shrink: 0; margin-top: 2px; }

        .ctx-body { flex: 1; overflow-y: auto; padding: var(--space-sm); }
        .ctx-loading {
          display: flex; align-items: center; justify-content: center; gap: var(--space-sm);
          padding: var(--space-2xl); color: var(--text-muted); font-size: 13px;
        }
        .ctx-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ctx-empty { text-align: center; padding: var(--space-2xl); color: var(--text-muted); font-size: 13px; }

        .ctx-group { margin-bottom: var(--space-md); }
        .ctx-group-header {
          display: flex; align-items: center; gap: 6px; padding: 4px var(--space-sm);
          font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ctx-item {
          display: flex; align-items: flex-start; gap: var(--space-sm); padding: 6px var(--space-sm);
          border-radius: var(--radius-sm); cursor: default; transition: var(--transition-fast);
        }
        .ctx-item:hover { background: var(--bg-hover); }
        .ctx-item-icon { flex-shrink: 0; margin-top: 2px; }
        .ctx-item-content { flex: 1; min-width: 0; }
        .ctx-item-title {
          font-size: 13px; color: var(--text-primary); white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .ctx-item-subtitle { font-size: 11px; color: var(--text-muted); }
        .ctx-item-link {
          display: flex; align-items: center; color: var(--text-muted); padding: 2px;
          flex-shrink: 0;
        }
        .ctx-item-link:hover { color: var(--cyan); }
      `}</style>
    </div>
  );
}
