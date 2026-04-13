import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin,
  Users, RefreshCw, X, Video, AlertTriangle,
} from 'lucide-react';
import {
  PageHeader, Button, GlassCard, Badge, Input, Skeleton, EmptyState,
} from '../components/ui';
import { useToast } from '../components/Toasts';

// ── Types ──

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  attendees?: { email: string; responseStatus: string }[];
  hangoutLink?: string;
  colorId?: string;
  status: string;
}

interface CalendarInfo {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

type ViewMode = 'month' | 'week' | 'agenda';

// ── API helpers ──

async function calApi(action: string, params: Record<string, unknown> = {}, method = 'GET') {
  const base = '/api/google-calendar';
  if (method === 'GET') {
    const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const res = await fetch(`${base}?${qs}`);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Calendar ${res.status}`); }
    return res.json();
  }
  const res = await fetch(base, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Calendar ${res.status}`); }
  return res.json();
}

// ── Date helpers ──

function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function startOfWeek(d: Date): Date { const day = d.getDay(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day); }
function addDays(d: Date, n: number): Date { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function isSameDay(a: Date, b: Date): boolean { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Create Event Modal ──

function CreateEventModal({ onClose, onSubmit, defaultDate }: {
  onClose: () => void;
  onSubmit: (data: { summary: string; description?: string; start: string; end: string; location?: string; attendees?: string[] }) => void;
  defaultDate: Date;
}) {
  const dateStr = defaultDate.toISOString().slice(0, 16);
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState(dateStr);
  const [end, setEnd] = useState(new Date(defaultDate.getTime() + 3600000).toISOString().slice(0, 16));
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async () => {
    if (!summary || !start || !end) return;
    setCreating(true);
    try {
      await onSubmit({
        summary, description: description || undefined,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        location: location || undefined,
        attendees: attendees ? attendees.split(',').map(e => e.trim()).filter(Boolean) : undefined,
      });
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="cal-modal-overlay" onClick={onClose}>
      <GlassCard className="cal-modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="cal-modal-header">
          <h3>New Event</h3>
          <button className="cal-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="cal-modal-fields">
          <Input placeholder="Event title" value={summary} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSummary(e.target.value)} />
          <div className="cal-modal-row">
            <label>Start</label>
            <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className="cal-datetime-input" />
          </div>
          <div className="cal-modal-row">
            <label>End</label>
            <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className="cal-datetime-input" />
          </div>
          <Input placeholder="Location (optional)" value={location} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)} />
          <Input placeholder="Attendees (comma-separated emails)" value={attendees} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAttendees(e.target.value)} />
          <textarea
            className="cal-textarea"
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="cal-modal-actions">
          <Button onClick={handleSubmit} disabled={creating || !summary}>
            {creating ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

// ── Quick Add Bar ──

function QuickAddBar({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  };
  return (
    <form className="cal-quick-add" onSubmit={handleSubmit}>
      <Plus size={14} />
      <input
        type="text"
        placeholder="Quick add: &quot;Meeting with Devon at 3pm tomorrow&quot;"
        value={text}
        onChange={e => setText(e.target.value)}
      />
    </form>
  );
}

// ── Month Grid ──

function MonthGrid({ currentDate, events, onDayClick, onEventClick }: {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart);
  const today = new Date();
  const weeks: Date[][] = [];
  let day = gridStart;
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(day));
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const getEventsForDay = (d: Date) => events.filter(ev => {
    const evDate = new Date(ev.start.dateTime || ev.start.date || '');
    return isSameDay(evDate, d);
  });

  return (
    <div className="cal-month-grid">
      <div className="cal-month-header">
        {DAY_NAMES.map(d => <div key={d} className="cal-day-name">{d}</div>)}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="cal-week-row">
          {week.map((d, di) => {
            const isCurrentMonth = d.getMonth() === currentDate.getMonth();
            const isToday = isSameDay(d, today);
            const dayEvents = getEventsForDay(d);
            return (
              <div
                key={di}
                className={`cal-day-cell ${isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`}
                onClick={() => onDayClick(d)}
              >
                <span className={`cal-day-number ${isToday ? 'today-number' : ''}`}>{d.getDate()}</span>
                <div className="cal-day-events">
                  {dayEvents.slice(0, 3).map(ev => (
                    <button
                      key={ev.id}
                      className="cal-day-event"
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                    >
                      {ev.start.dateTime && <span className="cal-event-time">{formatTime(ev.start.dateTime)}</span>}
                      <span className="cal-event-title">{ev.summary}</span>
                    </button>
                  ))}
                  {dayEvents.length > 3 && <span className="cal-day-more">+{dayEvents.length - 3} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Agenda View ──

function AgendaView({ events, onEventClick }: { events: CalendarEvent[]; onEventClick: (e: CalendarEvent) => void }) {
  if (events.length === 0) return <EmptyState icon={<Calendar size={32} />} title="No upcoming events" description="Your calendar is clear." />;

  // Group events by date
  const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    const dateKey = (ev.start.dateTime || ev.start.date || '').split('T')[0];
    (acc[dateKey] ??= []).push(ev);
    return acc;
  }, {});

  return (
    <div className="cal-agenda">
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([dateKey, dayEvents]) => (
        <div key={dateKey} className="cal-agenda-day">
          <div className="cal-agenda-date">
            {new Date(dateKey + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          {dayEvents.map(ev => (
            <button key={ev.id} className="cal-agenda-event" onClick={() => onEventClick(ev)}>
              <div className="cal-agenda-event-time">
                {ev.start.dateTime ? formatTime(ev.start.dateTime) : 'All day'}
                {ev.end.dateTime && ev.start.dateTime ? ` — ${formatTime(ev.end.dateTime)}` : ''}
              </div>
              <div className="cal-agenda-event-info">
                <div className="cal-agenda-event-title">{ev.summary}</div>
                {ev.location && <div className="cal-agenda-event-location"><MapPin size={11} /> {ev.location}</div>}
                {ev.attendees && ev.attendees.length > 0 && (
                  <div className="cal-agenda-event-attendees"><Users size={11} /> {ev.attendees.length} attendees</div>
                )}
              </div>
              {ev.hangoutLink && <Video size={14} className="cal-meet-icon" />}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Event Detail Panel ──

function EventDetail({ event, onClose, onDelete }: { event: CalendarEvent | null; onClose: () => void; onDelete: (id: string) => void }) {
  if (!event) return null;

  return (
    <div className="cal-event-detail-overlay" onClick={onClose}>
      <GlassCard className="cal-event-detail" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="cal-event-detail-header">
          <h3>{event.summary}</h3>
          <button className="cal-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="cal-event-detail-body">
          <div className="cal-event-detail-row">
            <Clock size={14} />
            <span>
              {event.start.dateTime
                ? `${new Date(event.start.dateTime).toLocaleString()} — ${event.end.dateTime ? new Date(event.end.dateTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''}`
                : event.start.date || 'All day'
              }
            </span>
          </div>
          {event.location && (
            <div className="cal-event-detail-row"><MapPin size={14} /><span>{event.location}</span></div>
          )}
          {event.hangoutLink && (
            <div className="cal-event-detail-row">
              <Video size={14} />
              <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer">Join Google Meet</a>
            </div>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <div className="cal-event-detail-section">
              <h4><Users size={14} /> Attendees ({event.attendees.length})</h4>
              {event.attendees.map((a, i) => (
                <div key={i} className="cal-attendee">
                  <span>{a.email}</span>
                  <Badge>{a.responseStatus}</Badge>
                </div>
              ))}
            </div>
          )}
          {event.description && (
            <div className="cal-event-detail-section">
              <h4>Description</h4>
              <p>{event.description}</p>
            </div>
          )}
        </div>
        <div className="cal-event-detail-actions">
          <Button onClick={() => onDelete(event.id)} className="danger-btn">Delete Event</Button>
        </div>
      </GlassCard>
    </div>
  );
}

// ── Main View ──

export default function CalendarView() {
  const { addToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDate, setCreateDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Compute time range based on view
  const { timeMin, timeMax } = useMemo(() => {
    if (viewMode === 'agenda') {
      return { timeMin: new Date().toISOString(), timeMax: new Date(Date.now() + 30 * 86400000).toISOString() };
    }
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    return {
      timeMin: startOfWeek(ms).toISOString(),
      timeMax: addDays(me, 7 - me.getDay()).toISOString(),
    };
  }, [currentDate, viewMode]);

  // Fetch events
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calApi('list-events', { timeMin, timeMax, maxResults: 100 });
      setEvents(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [timeMin, timeMax]);

  // Fetch calendars
  useEffect(() => {
    calApi('list-calendars').then(data => setCalendars(data.items ?? [])).catch(() => {});
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Navigation
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Actions
  const handleCreateEvent = async (data: { summary: string; description?: string; start: string; end: string; location?: string; attendees?: string[] }) => {
    await calApi('create-event', data, 'POST');
    addToast({ type: 'success', message: `Event created: ${data.summary}` });
    loadEvents();
  };

  const handleQuickAdd = async (text: string) => {
    try {
      const result = await calApi('quick-add', { text }, 'POST');
      addToast({ type: 'success', message: `Quick event added: ${result.summary || text}` });
      loadEvents();
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to add event' });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Note: delete-event action would need to be added to the API route
    addToast({ type: 'info', message: 'Event deletion coming soon' });
    setSelectedEvent(null);
  };

  const handleDayClick = (date: Date) => {
    setCreateDate(date);
    setShowCreateModal(true);
  };

  return (
    <div className="cal-view">
      <PageHeader title="Calendar" subtitle={`${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}>
        <div className="cal-view-switcher">
          {(['month', 'week', 'agenda'] as ViewMode[]).map(m => (
            <button key={m} className={`cal-view-btn ${viewMode === m ? 'active' : ''}`} onClick={() => setViewMode(m)}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <Button onClick={() => { setCreateDate(new Date()); setShowCreateModal(true); }}><Plus size={14} /> Event</Button>
        <button className="cal-icon-btn" onClick={loadEvents} title="Refresh"><RefreshCw size={16} /></button>
      </PageHeader>

      <QuickAddBar onAdd={handleQuickAdd} />

      <div className="cal-layout">
        {/* Sidebar: calendars */}
        <div className="cal-sidebar">
          <div className="cal-nav-controls">
            <button className="cal-icon-btn" onClick={prevMonth}><ChevronLeft size={16} /></button>
            <button className="cal-today-btn" onClick={goToday}>Today</button>
            <button className="cal-icon-btn" onClick={nextMonth}><ChevronRight size={16} /></button>
          </div>

          <div className="cal-calendars">
            <h4>My Calendars</h4>
            {calendars.map(c => (
              <label key={c.id} className="cal-calendar-item">
                <span className="cal-calendar-dot" style={{ background: c.backgroundColor || 'var(--cyan)' }} />
                <span>{c.summary}</span>
                {c.primary && <Badge>Primary</Badge>}
              </label>
            ))}
          </div>

          {/* Overview stats */}
          <div className="cal-sidebar-stats">
            <div className="cal-stat"><span className="cal-stat-value">{events.length}</span><span className="cal-stat-label">Events</span></div>
          </div>
        </div>

        {/* Main content */}
        <div className="cal-main">
          {error && (
            <div className="cal-error"><AlertTriangle size={14} /><span>{error}</span></div>
          )}

          {loading ? (
            <div className="cal-loading">
              <Skeleton style={{ height: 400, borderRadius: 12 }} />
            </div>
          ) : viewMode === 'month' ? (
            <MonthGrid
              currentDate={currentDate}
              events={events}
              onDayClick={handleDayClick}
              onEventClick={setSelectedEvent}
            />
          ) : viewMode === 'agenda' ? (
            <AgendaView events={events} onEventClick={setSelectedEvent} />
          ) : (
            // Week view — simplified as agenda for now
            <AgendaView events={events.filter(ev => {
              const evDate = new Date(ev.start.dateTime || ev.start.date || '');
              const weekStart = startOfWeek(currentDate);
              const weekEnd = addDays(weekStart, 7);
              return evDate >= weekStart && evDate < weekEnd;
            })} onEventClick={setSelectedEvent} />
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEvent}
          defaultDate={createDate}
        />
      )}

      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleDeleteEvent}
        />
      )}

      <style>{`
        .cal-view { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .cal-layout { flex: 1; display: grid; grid-template-columns: 220px 1fr; gap: 1px; background: var(--border); overflow: hidden; }

        /* Sidebar */
        .cal-sidebar { background: var(--bg-surface); padding: var(--space-md); overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-md); }
        .cal-nav-controls { display: flex; align-items: center; gap: var(--space-xs); justify-content: center; }
        .cal-today-btn {
          padding: 4px 12px; border: 1px solid var(--border); background: transparent;
          color: var(--text-secondary); border-radius: var(--radius-sm); cursor: pointer; font-size: 12px;
          transition: var(--transition-fast);
        }
        .cal-today-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .cal-calendars h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin: 0 0 var(--space-sm); }
        .cal-calendar-item {
          display: flex; align-items: center; gap: var(--space-sm); padding: 4px 0; font-size: 13px; color: var(--text-secondary); cursor: default;
        }
        .cal-calendar-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cal-sidebar-stats { margin-top: auto; padding-top: var(--space-md); border-top: 1px solid var(--border); }
        .cal-stat { display: flex; flex-direction: column; align-items: center; }
        .cal-stat-value { font-size: 24px; font-weight: 700; color: var(--cyan); }
        .cal-stat-label { font-size: 11px; color: var(--text-muted); }

        /* View switcher */
        .cal-view-switcher { display: flex; gap: 2px; background: var(--bg-input); border-radius: var(--radius-sm); padding: 2px; }
        .cal-view-btn {
          padding: 4px 12px; border: none; background: transparent; color: var(--text-muted);
          font-size: 12px; cursor: pointer; border-radius: var(--radius-sm); transition: var(--transition-fast);
        }
        .cal-view-btn.active { background: var(--bg-card); color: var(--text-primary); }
        .cal-view-btn:hover { color: var(--text-primary); }

        /* Quick add */
        .cal-quick-add {
          display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-xs) var(--space-md);
          border-bottom: 1px solid var(--border); color: var(--text-muted); background: var(--bg-surface);
        }
        .cal-quick-add input {
          flex: 1; background: transparent; border: none; color: var(--text-primary); font-size: 13px; outline: none;
        }
        .cal-quick-add input::placeholder { color: var(--text-muted); }

        /* Main */
        .cal-main { background: var(--bg-card); overflow-y: auto; padding: var(--space-sm); }
        .cal-error { display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-md); color: var(--danger, #ef4444); font-size: 13px; }
        .cal-loading { padding: var(--space-md); }

        /* Month grid */
        .cal-month-grid { width: 100%; }
        .cal-month-header { display: grid; grid-template-columns: repeat(7, 1fr); }
        .cal-day-name { text-align: center; font-size: 11px; font-weight: 600; color: var(--text-muted); padding: 8px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .cal-week-row { display: grid; grid-template-columns: repeat(7, 1fr); border-top: 1px solid var(--border); }
        .cal-day-cell {
          min-height: 90px; padding: 4px; border-right: 1px solid var(--border); cursor: pointer;
          transition: var(--transition-fast);
        }
        .cal-day-cell:last-child { border-right: none; }
        .cal-day-cell:hover { background: var(--bg-hover); }
        .cal-day-cell.other-month { opacity: 0.35; }
        .cal-day-cell.today { background: rgba(0, 240, 255, 0.04); }
        .cal-day-number { font-size: 12px; color: var(--text-secondary); display: inline-block; padding: 2px 6px; }
        .cal-day-number.today-number { background: var(--cyan); color: var(--bg-deep); border-radius: 50%; font-weight: 700; }
        .cal-day-events { display: flex; flex-direction: column; gap: 1px; margin-top: 2px; }
        .cal-day-event {
          display: flex; gap: 4px; padding: 2px 4px; border-radius: 3px; font-size: 11px;
          background: rgba(0, 240, 255, 0.1); color: var(--cyan); border: none; cursor: pointer;
          text-align: left; width: 100%; overflow: hidden; transition: var(--transition-fast);
        }
        .cal-day-event:hover { background: rgba(0, 240, 255, 0.2); }
        .cal-event-time { font-weight: 600; white-space: nowrap; }
        .cal-event-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cal-day-more { font-size: 10px; color: var(--text-muted); padding: 2px 4px; }

        /* Agenda */
        .cal-agenda { display: flex; flex-direction: column; gap: var(--space-md); padding: var(--space-sm); }
        .cal-agenda-day { }
        .cal-agenda-date { font-size: 13px; font-weight: 600; color: var(--text-primary); padding: var(--space-xs) 0; border-bottom: 1px solid var(--border); margin-bottom: var(--space-xs); }
        .cal-agenda-event {
          display: flex; align-items: flex-start; gap: var(--space-md); padding: var(--space-sm) var(--space-md);
          border: none; background: transparent; cursor: pointer; width: 100%; text-align: left;
          border-radius: var(--radius-sm); transition: var(--transition-fast);
        }
        .cal-agenda-event:hover { background: var(--bg-hover); }
        .cal-agenda-event-time { min-width: 100px; font-size: 12px; color: var(--cyan); font-weight: 500; }
        .cal-agenda-event-info { flex: 1; }
        .cal-agenda-event-title { font-size: 14px; color: var(--text-primary); font-weight: 500; }
        .cal-agenda-event-location { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px; }
        .cal-agenda-event-attendees { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px; }
        .cal-meet-icon { color: var(--cyan); flex-shrink: 0; }

        /* Icon buttons */
        .cal-icon-btn {
          display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;
          border: none; background: transparent; color: var(--text-secondary); cursor: pointer;
          border-radius: var(--radius-sm); transition: var(--transition-fast);
        }
        .cal-icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

        /* Modals */
        .cal-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
        }
        .cal-modal { width: 480px; max-height: 80vh; padding: var(--space-lg) !important; overflow-y: auto; }
        .cal-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); }
        .cal-modal-header h3 { margin: 0; font-size: 16px; color: var(--text-primary); }
        .cal-modal-fields { display: flex; flex-direction: column; gap: var(--space-sm); }
        .cal-modal-row { display: flex; align-items: center; gap: var(--space-sm); }
        .cal-modal-row label { font-size: 13px; color: var(--text-secondary); min-width: 40px; }
        .cal-datetime-input {
          flex: 1; background: var(--bg-input); border: 1px solid var(--border); color: var(--text-primary);
          border-radius: var(--radius-sm); padding: 6px 10px; font-size: 13px; color-scheme: dark;
        }
        .cal-textarea {
          width: 100%; background: var(--bg-input); border: 1px solid var(--border); color: var(--text-primary);
          border-radius: var(--radius-sm); padding: var(--space-sm); font-size: 13px; font-family: var(--font-sans);
          resize: vertical; outline: none;
        }
        .cal-textarea:focus { border-color: var(--border-active); }
        .cal-modal-actions { margin-top: var(--space-md); display: flex; gap: var(--space-sm); }

        /* Event detail */
        .cal-event-detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .cal-event-detail { width: 500px; max-height: 70vh; padding: var(--space-lg) !important; overflow-y: auto; }
        .cal-event-detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-md); }
        .cal-event-detail-header h3 { margin: 0; font-size: 18px; color: var(--text-primary); }
        .cal-event-detail-body { display: flex; flex-direction: column; gap: var(--space-sm); }
        .cal-event-detail-row { display: flex; align-items: center; gap: var(--space-sm); font-size: 13px; color: var(--text-secondary); }
        .cal-event-detail-row a { color: var(--cyan); text-decoration: none; }
        .cal-event-detail-row a:hover { text-decoration: underline; }
        .cal-event-detail-section { margin-top: var(--space-sm); }
        .cal-event-detail-section h4 { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin: 0 0 var(--space-xs); }
        .cal-event-detail-section p { font-size: 13px; color: var(--text-secondary); margin: 0; white-space: pre-wrap; }
        .cal-attendee { display: flex; align-items: center; gap: var(--space-sm); font-size: 12px; color: var(--text-secondary); padding: 2px 0; }
        .cal-event-detail-actions { margin-top: var(--space-md); display: flex; gap: var(--space-sm); }
        .danger-btn { background: rgba(239, 68, 68, 0.1) !important; color: var(--danger, #ef4444) !important; border-color: rgba(239, 68, 68, 0.2) !important; }
      `}</style>
    </div>
  );
}
