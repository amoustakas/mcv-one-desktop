import { useState, useMemo } from 'react';
import {
  Brain, Search, Trash2, Clock, Database, Zap, MessageSquare,
  GitCommit, AlertTriangle, Rocket, FolderOpen, ChevronDown, ChevronRight,
  Copy, Filter, Activity, Layers,
} from 'lucide-react';
import { useProjectMemory, useSessionEvents, useAllEvents, useMemoryDelete } from '../hooks/use-memory';
import { useLocalPipeline, useLocalFile } from '../hooks/use-pipeline';
import { PageHeader, PageShell, Button, GlassCard, Badge, EmptyState, Skeleton, Tabs, Input } from '../components/ui';
import { cn, timeAgo, formatDate } from '../lib/utils';
import Markdown from '../components/Markdown';
import type { MemoryEntry, SessionEvent, MemoryType, SessionEventType } from '../lib/types/memory';

/* ── Constants ── */
const MEMORY_TYPE_COLORS: Record<MemoryType, string> = {
  session: '#00F0FF',
  project: '#8B5CF6',
  user: '#3B82F6',
  feedback: '#F59E0B',
  reference: '#10B981',
};

const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  session: 'Session',
  project: 'Project',
  user: 'User',
  feedback: 'Feedback',
  reference: 'Reference',
};

const EVENT_TYPE_COLORS: Record<SessionEventType, string> = {
  task_start: '#3B82F6',
  task_complete: '#10B981',
  error: '#EF4444',
  decision: '#F59E0B',
  file_change: '#8B5CF6',
  deploy: '#00F0FF',
  commit: '#A78BFA',
  kit_tool_call: '#06B6D4',
  venture_switch: '#EC4899',
  session_start: '#10B981',
  session_end: '#6B7280',
  memory_write: '#F97316',
};

const EVENT_TYPE_ICONS: Record<SessionEventType, React.ReactNode> = {
  task_start: <Zap size={12} />,
  task_complete: <Zap size={12} />,
  error: <AlertTriangle size={12} />,
  decision: <MessageSquare size={12} />,
  file_change: <FolderOpen size={12} />,
  deploy: <Rocket size={12} />,
  commit: <GitCommit size={12} />,
  kit_tool_call: <Layers size={12} />,
  venture_switch: <Activity size={12} />,
  session_start: <Zap size={12} />,
  session_end: <Clock size={12} />,
  memory_write: <Database size={12} />,
};

const ALL_MEMORY_TYPES: MemoryType[] = ['session', 'project', 'user', 'feedback', 'reference'];
const ALL_EVENT_TYPES: SessionEventType[] = [
  'task_start', 'task_complete', 'error', 'decision', 'file_change',
  'deploy', 'commit', 'kit_tool_call', 'venture_switch', 'session_start',
  'session_end', 'memory_write',
];

/* ── Tab Config ── */
const VIEW_TABS = [
  { id: 'memory', label: 'Project Memory' },
  { id: 'local-files', label: 'Local Files' },
  { id: 'events', label: 'Session Events' },
  { id: 'timeline', label: 'Timeline' },
];

/* ── Main View ── */
export default function MemoryView() {
  const [activeTab, setActiveTab] = useState('memory');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventSessionId, setEventSessionId] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  // Queries
  const memoryFilter = useMemo(() => ({
    type: (typeFilter || undefined) as MemoryType | undefined,
    search: searchQuery || undefined,
  }), [typeFilter, searchQuery]);

  const { data: memories = [], isLoading: memoriesLoading, refetch: refetchMemories } = useProjectMemory(memoryFilter);
  const { data: sessionEvents = [], isLoading: eventsLoading, refetch: refetchEvents } = useSessionEvents(
    eventSessionId || undefined,
    eventTypeFilter || undefined,
  );
  const { data: allEvents = [], isLoading: timelineLoading, refetch: refetchTimeline } = useAllEvents();

  // Derived
  const totalCount = memories.length + allEvents.length;

  // Get unique session IDs from all events for the session selector
  const knownSessionIds = useMemo(() => {
    const ids = new Set<string>();
    allEvents.forEach((e: SessionEvent) => ids.add(e.sessionId));
    return Array.from(ids).sort();
  }, [allEvents]);

  const tabsWithCounts = useMemo(() => [
    { ...VIEW_TABS[0], count: memories.length },
    { ...VIEW_TABS[1], count: sessionEvents.length },
    { ...VIEW_TABS[2], count: allEvents.length },
  ], [memories.length, sessionEvents.length, allEvents.length]);

  function handleRefresh() {
    if (activeTab === 'memory') refetchMemories();
    else if (activeTab === 'events') refetchEvents();
    else refetchTimeline();
  }

  return (
    <PageShell scroll>
      <PageHeader
        icon={<Brain size={20} />}
        title="Memory Hub"
        count={totalCount}
        loading={memoriesLoading || eventsLoading || timelineLoading}
        onRefresh={handleRefresh}
      />

      <div className="mv-content">
        <div className="mv-tabs-bar">
          <Tabs tabs={tabsWithCounts} active={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === 'memory' && (
          <ProjectMemoryTab
            memories={memories}
            isLoading={memoriesLoading}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {activeTab === 'local-files' && (
          <LocalFilesTab />
        )}

        {activeTab === 'events' && (
          <SessionEventsTab
            events={sessionEvents}
            isLoading={eventsLoading}
            sessionId={eventSessionId}
            onSessionChange={setEventSessionId}
            eventTypeFilter={eventTypeFilter}
            onEventTypeChange={setEventTypeFilter}
            knownSessionIds={knownSessionIds}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineTab
            events={allEvents}
            isLoading={timelineLoading}
          />
        )}
      </div>

      <style>{mvStyles}</style>
    </PageShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Project Memory Tab                                                     */
/* ═══════════════════════════════════════════════════════════════════════ */

interface ProjectMemoryTabProps {
  memories: MemoryEntry[];
  isLoading: boolean;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
}

function ProjectMemoryTab({ memories, isLoading, typeFilter, onTypeChange, searchQuery, onSearchChange }: ProjectMemoryTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const deleteMutation = useMemoryDelete();

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => setConfirmDeleteId(null),
    });
  }

  function copyValue(entry: MemoryEntry) {
    navigator.clipboard.writeText(JSON.stringify(entry.value, null, 2));
  }

  if (isLoading) {
    return (
      <div className="mv-loading">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height={52} />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Filter Bar */}
      <div className="mv-filter-bar">
        <select
          className="mcv-input mv-filter-select"
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          <option value="">All Types</option>
          {ALL_MEMORY_TYPES.map((t) => (
            <option key={t} value={t}>{MEMORY_TYPE_LABELS[t]}</option>
          ))}
        </select>

        <Input
          icon={<Search size={13} />}
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mv-search"
        />

        <span className="mv-filter-count">
          {memories.length} {memories.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {/* Memory List */}
      {memories.length === 0 ? (
        <EmptyState
          icon={<Database size={32} />}
          title="No memory entries"
          description="Memory entries will appear here as the system records project state, decisions, and context."
        />
      ) : (
        <div className="mv-memory-list">
          {memories.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const isConfirming = confirmDeleteId === entry.id;
            const color = MEMORY_TYPE_COLORS[entry.type];

            return (
              <div
                key={entry.id}
                className={cn('mv-memory-item mcv-glass-card', isExpanded && 'mv-memory-item-expanded')}
              >
                <div
                  className="mv-memory-row"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <span className="mv-memory-expand">
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </span>

                  <Badge color={color} size="sm">{MEMORY_TYPE_LABELS[entry.type]}</Badge>

                  <span className="mv-memory-key">{entry.key}</span>

                  <span className="mv-memory-value-preview">
                    {truncateValue(entry.value)}
                  </span>

                  {entry.ventureId && (
                    <Badge color="var(--text-muted)" variant="outline" size="sm">
                      {entry.ventureId}
                    </Badge>
                  )}

                  {entry.sessionId && (
                    <span className="mv-memory-session">{entry.sessionId.slice(0, 8)}</span>
                  )}

                  <span className="mv-memory-time">{timeAgo(entry.updatedAt)}</span>
                </div>

                {isExpanded && (
                  <div className="mv-memory-expanded">
                    <GlassCard variant="neural" className="mv-memory-json-wrap">
                      <pre className="mv-memory-json">
                        {JSON.stringify(entry.value, null, 2)}
                      </pre>
                    </GlassCard>

                    <div className="mv-memory-meta">
                      <span>ID: <code>{entry.id.slice(0, 12)}...</code></span>
                      <span>Created: {formatDate(entry.createdAt)}</span>
                      <span>Updated: {formatDate(entry.updatedAt)}</span>
                      {entry.ttlSeconds && <span>TTL: {entry.ttlSeconds}s</span>}
                    </div>

                    <div className="mv-memory-actions">
                      <Button variant="ghost" size="sm" icon={<Copy size={11} />} onClick={() => copyValue(entry)}>
                        Copy JSON
                      </Button>

                      {isConfirming ? (
                        <>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Trash2 size={11} />}
                            loading={deleteMutation.isPending}
                            onClick={() => handleDelete(entry.id)}
                          >
                            Confirm Delete
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="sm" icon={<Trash2 size={11} />} onClick={() => setConfirmDeleteId(entry.id)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Session Events Tab                                                     */
/* ═══════════════════════════════════════════════════════════════════════ */

interface SessionEventsTabProps {
  events: SessionEvent[];
  isLoading: boolean;
  sessionId: string;
  onSessionChange: (v: string) => void;
  eventTypeFilter: string;
  onEventTypeChange: (v: string) => void;
  knownSessionIds: string[];
}

function SessionEventsTab({
  events, isLoading, sessionId, onSessionChange, eventTypeFilter, onEventTypeChange, knownSessionIds,
}: SessionEventsTabProps) {
  const filteredEvents = useMemo(() => {
    if (!eventTypeFilter) return events;
    return events.filter((e) => e.eventType === eventTypeFilter);
  }, [events, eventTypeFilter]);

  if (isLoading && sessionId) {
    return (
      <div className="mv-loading">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height={44} />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Filter Bar */}
      <div className="mv-filter-bar">
        <select
          className="mcv-input mv-filter-select"
          value={sessionId}
          onChange={(e) => onSessionChange(e.target.value)}
        >
          <option value="">Select Session...</option>
          {knownSessionIds.map((id) => (
            <option key={id} value={id}>{id.slice(0, 16)}...</option>
          ))}
        </select>

        <select
          className="mcv-input mv-filter-select"
          value={eventTypeFilter}
          onChange={(e) => onEventTypeChange(e.target.value)}
        >
          <option value="">All Event Types</option>
          {ALL_EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <span className="mv-filter-count">
          <Filter size={11} />
          {filteredEvents.length} events
        </span>
      </div>

      {/* Event Timeline */}
      {!sessionId ? (
        <EmptyState
          icon={<Activity size={32} />}
          title="Select a session"
          description="Choose a session ID above to view its event timeline."
        />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Clock size={32} />}
          title="No events"
          description="No events found for this session and filter combination."
        />
      ) : (
        <div className="mv-event-timeline">
          {filteredEvents.map((event) => (
            <EventItem key={event.id} event={event} showSession={false} />
          ))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Timeline Tab                                                           */
/* ═══════════════════════════════════════════════════════════════════════ */

interface TimelineTabProps {
  events: SessionEvent[];
  isLoading: boolean;
}

function TimelineTab({ events, isLoading }: TimelineTabProps) {
  // Group events by date
  const grouped = useMemo(() => {
    const groups: Record<string, SessionEvent[]> = {};
    for (const event of events) {
      const dateKey = new Date(event.createdAt).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    }
    return groups;
  }, [events]);

  if (isLoading) {
    return (
      <div className="mv-loading">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height={40} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Clock size={32} />}
        title="No timeline events"
        description="Events from all sessions will appear here in chronological order."
      />
    );
  }

  return (
    <div className="mv-timeline">
      {Object.entries(grouped).map(([date, dateEvents]) => (
        <div key={date} className="mv-timeline-group">
          <div className="mv-timeline-date">{date}</div>
          <div className="mv-event-timeline">
            {dateEvents.map((event) => (
              <EventItem key={event.id} event={event} showSession />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Shared Event Item Component                                            */
/* ═══════════════════════════════════════════════════════════════════════ */

function EventItem({ event, showSession }: { event: SessionEvent; showSession: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const color = EVENT_TYPE_COLORS[event.eventType] || 'var(--text-muted)';
  const icon = EVENT_TYPE_ICONS[event.eventType] || <Zap size={12} />;
  const payloadSummary = summarizePayload(event.payload);

  return (
    <div
      className={cn('mv-event-item', expanded && 'mv-event-item-expanded')}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="mv-event-icon" style={{ color, background: `${color}15` }}>
        {icon}
      </div>

      <div className="mv-event-body">
        <div className="mv-event-header">
          <Badge color={color} size="sm">{event.eventType.replace(/_/g, ' ')}</Badge>
          {showSession && (
            <span className="mv-event-session-badge">{event.sessionId.slice(0, 8)}</span>
          )}
          {event.ventureId && (
            <Badge color="var(--text-muted)" variant="outline" size="sm">{event.ventureId}</Badge>
          )}
        </div>
        <div className="mv-event-payload-summary">{payloadSummary}</div>

        {expanded && Object.keys(event.payload).length > 0 && (
          <GlassCard variant="neural" className="mv-event-payload-full">
            <pre className="mv-memory-json">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </GlassCard>
        )}
      </div>

      <span className="mv-event-time">{timeAgo(event.createdAt)}</span>
    </div>
  );
}

/* ── Helpers ── */

function truncateValue(value: Record<string, unknown>): string {
  const str = JSON.stringify(value);
  if (str.length <= 80) return str;
  return str.slice(0, 77) + '...';
}

function summarizePayload(payload: Record<string, unknown>): string {
  if (!payload || Object.keys(payload).length === 0) return '--';
  // Try common fields first
  if (payload.message) return String(payload.message).slice(0, 120);
  if (payload.title) return String(payload.title).slice(0, 120);
  if (payload.description) return String(payload.description).slice(0, 120);
  if (payload.path) return String(payload.path);
  if (payload.url) return String(payload.url);
  // Fallback: show keys
  const keys = Object.keys(payload);
  return keys.slice(0, 4).join(', ') + (keys.length > 4 ? ` +${keys.length - 4} more` : '');
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Local Files Tab — reads from local pipeline scanner                    */
/* ═══════════════════════════════════════════════════════════════════════ */

function LocalFilesTab() {
  const { data: localData, isLoading } = useLocalPipeline();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const { data: fileData } = useLocalFile(selectedFile || '');

  if (isLoading) {
    return <div className="mv-loading">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rect" height={52} />)}</div>;
  }

  if (!localData) {
    return <EmptyState icon={<FolderOpen size={32} />} title="Local Server Not Connected" description="Start the MCV local server (npm run dev:local) to scan memory files from your machine." />;
  }

  return (
    <div className="mv-local-files">
      <div className="mv-local-sidebar">
        {localData.memories.map(project => (
          <div key={project.project} className="mv-local-project">
            <button className="mv-local-project-header" onClick={() => setExpandedProject(expandedProject === project.project ? null : project.project)}>
              {expandedProject === project.project ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <FolderOpen size={12} />
              <span className="mv-local-project-name">{project.project.replace(/^[Cc]--Users-moust-?/, '').replace(/-/g, '/').substring(0, 35)}</span>
              <Badge size="sm">{project.files.length}</Badge>
            </button>
            {expandedProject === project.project && (
              <div className="mv-local-file-list">
                {project.files.map(f => (
                  <button key={f.path} className={cn('mv-local-file', selectedFile === f.path && 'active')} onClick={() => setSelectedFile(f.path)}>
                    <Database size={10} />
                    <span>{f.name}</span>
                    <span className="mv-local-file-time">{timeAgo(f.modified)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {localData.plans.length > 0 && (
          <div className="mv-local-project">
            <button className="mv-local-project-header" onClick={() => setExpandedProject(expandedProject === '__plans__' ? null : '__plans__')}>
              {expandedProject === '__plans__' ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <Layers size={12} />
              <span className="mv-local-project-name">Plans</span>
              <Badge size="sm">{localData.plans.length}</Badge>
            </button>
            {expandedProject === '__plans__' && (
              <div className="mv-local-file-list">
                {localData.plans.map(p => (
                  <button key={p.path} className={cn('mv-local-file', selectedFile === p.path && 'active')} onClick={() => setSelectedFile(p.path)}>
                    <Rocket size={10} />
                    <span>{p.name}</span>
                    <span className="mv-local-file-time">{timeAgo(p.modified)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mv-local-content">
        {fileData ? (
          <div className="mv-local-viewer">
            <div className="mv-local-viewer-header">
              <span className="mv-local-viewer-path">{fileData.path.replace(/\\/g, '/').split('.claude/').pop()}</span>
              <span className="mv-local-viewer-meta">{(fileData.size / 1024).toFixed(1)}KB &middot; {formatDate(fileData.modified)}</span>
            </div>
            <div className="mv-local-viewer-body">
              <Markdown content={fileData.content} />
            </div>
          </div>
        ) : (
          <EmptyState icon={<Database size={32} />} title="Select a Memory File" description="Choose a file from the sidebar to view its contents." />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/* Scoped Styles                                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

const mvStyles = `
  /* Layout */
  .mv-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .mv-tabs-bar {
    padding: 0 20px 10px;
    flex-shrink: 0;
  }
  .mv-loading {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 20px;
    overflow-y: auto;
  }

  /* Filter Bar */
  .mv-filter-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    flex-shrink: 0;
  }
  .mv-filter-select {
    width: auto;
    min-width: 140px;
    font-size: 11px;
    padding: 5px 10px;
  }
  .mv-search {
    flex: 1;
    max-width: 280px;
  }
  .mv-filter-count {
    margin-left: auto;
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* ── Project Memory List ── */
  .mv-memory-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .mv-memory-item {
    border-radius: var(--radius-sm);
    overflow: hidden;
    transition: border-color 0.15s;
  }
  .mv-memory-item-expanded {
    border-color: rgba(0, 240, 255, 0.12);
  }
  .mv-memory-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.1s;
  }
  .mv-memory-row:hover {
    background: var(--bg-card);
  }
  .mv-memory-expand {
    color: var(--text-muted);
    flex-shrink: 0;
    display: flex;
  }
  .mv-memory-key {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    flex-shrink: 0;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mv-memory-value-preview {
    flex: 1;
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .mv-memory-session {
    font-size: 9px;
    font-family: var(--font-mono);
    color: var(--text-muted);
    background: var(--bg-elevated);
    padding: 1px 6px;
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }
  .mv-memory-time {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* Expanded Memory */
  .mv-memory-expanded {
    padding: 0 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    animation: mv-expand 0.15s ease-out;
  }
  .mv-memory-json-wrap {
    padding: 10px 14px;
    max-height: 240px;
    overflow-y: auto;
  }
  .mv-memory-json {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--cyan);
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
    line-height: 1.5;
  }
  .mv-memory-meta {
    display: flex;
    gap: 16px;
    font-size: 10px;
    color: var(--text-muted);
    flex-wrap: wrap;
  }
  .mv-memory-meta code {
    font-family: var(--font-mono);
    color: var(--text-secondary);
  }
  .mv-memory-actions {
    display: flex;
    gap: 6px;
  }

  /* ── Event Timeline ── */
  .mv-event-timeline {
    flex: 1;
    overflow-y: auto;
    padding: 4px 20px 20px;
    display: flex;
    flex-direction: column;
  }
  .mv-event-item {
    display: flex;
    gap: 10px;
    padding: 8px 12px;
    cursor: pointer;
    border-left: 2px solid rgba(255, 255, 255, 0.04);
    transition: background 0.1s, border-color 0.1s;
    animation: mv-expand 0.15s ease-out;
  }
  .mv-event-item:hover {
    background: var(--bg-card);
    border-left-color: rgba(255, 255, 255, 0.08);
  }
  .mv-event-item-expanded {
    border-left-color: var(--cyan);
    background: rgba(0, 240, 255, 0.02);
  }
  .mv-event-icon {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
  }
  .mv-event-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .mv-event-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .mv-event-session-badge {
    font-size: 9px;
    font-family: var(--font-mono);
    color: var(--purple);
    background: rgba(139, 92, 246, 0.1);
    padding: 1px 6px;
    border-radius: var(--radius-full);
  }
  .mv-event-payload-summary {
    font-size: 11px;
    color: var(--text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mv-event-payload-full {
    margin-top: 6px;
    padding: 8px 12px;
    max-height: 200px;
    overflow-y: auto;
  }
  .mv-event-time {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ── Timeline Tab ── */
  .mv-timeline {
    flex: 1;
    overflow-y: auto;
    padding: 4px 20px 20px;
  }
  .mv-timeline-group {
    margin-bottom: 4px;
  }
  .mv-timeline-date {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    font-weight: 600;
    padding: 12px 0 4px;
    position: sticky;
    top: 0;
    background: var(--bg-surface);
    z-index: 1;
  }

  /* Animation */
  @keyframes mv-expand {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Local Files Tab */
  .mv-local-files { display: flex; gap: 0; flex: 1; min-height: 0; }
  .mv-local-sidebar { width: 300px; flex-shrink: 0; border-right: 1px solid var(--border); overflow-y: auto; padding: 8px 0; }
  .mv-local-project { }
  .mv-local-project-header { display: flex; align-items: center; gap: 6px; width: 100%; padding: 6px 12px; font-size: 11px; font-weight: 600; color: var(--text-secondary); transition: background 0.1s; text-align: left; }
  .mv-local-project-header:hover { background: var(--bg-card); }
  .mv-local-project-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mv-local-file-list { padding-left: 20px; }
  .mv-local-file { display: flex; align-items: center; gap: 6px; width: 100%; padding: 4px 12px; font-size: 10px; color: var(--text-muted); transition: all 0.1s; text-align: left; }
  .mv-local-file:hover { background: var(--bg-card); color: var(--text-secondary); }
  .mv-local-file.active { background: rgba(0,240,255,0.05); color: var(--cyan); border-left: 2px solid var(--cyan); }
  .mv-local-file-time { margin-left: auto; font-family: var(--font-mono); font-size: 9px; }
  .mv-local-content { flex: 1; overflow-y: auto; min-width: 0; }
  .mv-local-viewer { height: 100%; display: flex; flex-direction: column; }
  .mv-local-viewer-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .mv-local-viewer-path { font-family: var(--font-mono); font-size: 11px; color: var(--cyan); }
  .mv-local-viewer-meta { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
  .mv-local-viewer-body { flex: 1; overflow-y: auto; padding: 16px; font-size: 13px; line-height: 1.6; }
`;
