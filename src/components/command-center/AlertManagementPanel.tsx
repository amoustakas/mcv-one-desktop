import { useMemo, useState } from 'react';
import { AlertTriangle, Clock, Check, X, Filter } from 'lucide-react';
import { SectionCard, Button, Badge, Tooltip, Popover, Toggle } from '../ui';
import { useCommandCenter } from '../../stores/command-center';
import { useNavigation } from '../../stores/navigation';

export interface AttentionItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actionLabel?: string;
  actionView?: string;
  createdAt?: string;
}

const severityColors: Record<string, string> = {
  critical: '#EF4444',
  warning: '#F59E0B',
  info: '#00F0FF',
};

const severityLabels: Record<string, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
};

const SNOOZE_OPTIONS = [
  { hours: 1, label: '1 hour' },
  { hours: 4, label: '4 hours' },
  { hours: 24, label: '1 day' },
  { hours: 24 * 7, label: '1 week' },
];

export default function AlertManagementPanel({ items }: { items: AttentionItem[] }) {
  const [severityFilter, setSeverityFilter] = useState<Set<string>>(new Set(['critical', 'warning', 'info']));
  const [snoozeFor, setSnoozeFor] = useState<string | null>(null);
  const snoozeAnchor = useState<HTMLButtonElement | null>(null);
  const snoozeRef = { current: snoozeAnchor[0] };

  const snoozeAlert = useCommandCenter((s) => s.snoozeAlert);
  const resolveAlert = useCommandCenter((s) => s.resolveAlert);
  const isAlertActive = useCommandCenter((s) => s.isAlertActive);
  const resolvedCount = useCommandCenter((s) => s.resolvedAlerts.length);
  const clearResolved = useCommandCenter((s) => s.clearResolvedAlerts);
  const setView = useNavigation((s) => s.setView);

  const activeItems = useMemo(
    () => items.filter((i) => isAlertActive(i.id) && severityFilter.has(i.severity)),
    [items, isAlertActive, severityFilter],
  );

  const countBySeverity = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, warning: 0, info: 0 };
    activeItems.forEach((i) => { counts[i.severity] = (counts[i.severity] || 0) + 1; });
    return counts;
  }, [activeItems]);

  const toggleSeverity = (sev: string) => {
    setSeverityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  };

  if (items.length === 0) return null;

  return (
    <SectionCard
      title="Attention Required"
      icon={<AlertTriangle size={14} />}
      description={`${activeItems.length} active · ${items.length - activeItems.length} snoozed/resolved`}
      action={
        <div style={{ display: 'flex', gap: 6 }}>
          <Toggle pressed={severityFilter.has('critical')} onPressedChange={() => toggleSeverity('critical')} size="sm" ariaLabel="Filter critical">
            <span className="alert-sev-dot" style={{ background: severityColors.critical }} />
            {countBySeverity.critical}
          </Toggle>
          <Toggle pressed={severityFilter.has('warning')} onPressedChange={() => toggleSeverity('warning')} size="sm" ariaLabel="Filter warning">
            <span className="alert-sev-dot" style={{ background: severityColors.warning }} />
            {countBySeverity.warning}
          </Toggle>
          <Toggle pressed={severityFilter.has('info')} onPressedChange={() => toggleSeverity('info')} size="sm" ariaLabel="Filter info">
            <span className="alert-sev-dot" style={{ background: severityColors.info }} />
            {countBySeverity.info}
          </Toggle>
          {resolvedCount > 0 && (
            <Tooltip content="Clear resolved history">
              <Button variant="ghost" size="sm" onClick={clearResolved}>
                <Filter size={10} /> {resolvedCount}
              </Button>
            </Tooltip>
          )}
        </div>
      }
    >
      {activeItems.length === 0 ? (
        <p className="alert-empty">All alerts in the selected severities are clear.</p>
      ) : (
        <ul className="alert-list">
          {activeItems.map((item) => (
            <li key={item.id} className="alert-row">
              <span className="alert-dot" style={{ background: severityColors[item.severity] }} />
              <div className="alert-body">
                <div className="alert-title-row">
                  <span className="alert-title">{item.title}</span>
                  <Badge color={severityColors[item.severity]} size="sm" variant="outline">
                    {severityLabels[item.severity]}
                  </Badge>
                </div>
                <span className="alert-desc">{item.description}</span>
              </div>
              <div className="alert-actions">
                {item.actionLabel && item.actionView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView(item.actionView as Parameters<typeof setView>[0])}
                  >
                    {item.actionLabel}
                  </Button>
                )}
                <Tooltip content="Snooze">
                  <button
                    type="button"
                    className="alert-icon-btn"
                    onClick={(e) => { snoozeAnchor[1](e.currentTarget); setSnoozeFor(item.id); }}
                    aria-label="Snooze alert"
                  >
                    <Clock size={12} />
                  </button>
                </Tooltip>
                <Tooltip content="Resolve">
                  <button
                    type="button"
                    className="alert-icon-btn alert-icon-btn-ok"
                    onClick={() => resolveAlert(item.id)}
                    aria-label="Resolve alert"
                  >
                    <Check size={12} />
                  </button>
                </Tooltip>
                <Tooltip content="Dismiss">
                  <button
                    type="button"
                    className="alert-icon-btn alert-icon-btn-danger"
                    onClick={() => resolveAlert(item.id)}
                    aria-label="Dismiss alert"
                  >
                    <X size={12} />
                  </button>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Popover open={!!snoozeFor} onClose={() => setSnoozeFor(null)} anchorRef={snoozeRef} align="end">
        <div className="alert-snooze-menu">
          <span className="alert-snooze-label">Snooze for…</span>
          {SNOOZE_OPTIONS.map((opt) => (
            <button
              key={opt.hours}
              type="button"
              className="alert-snooze-item"
              onClick={() => {
                if (snoozeFor) snoozeAlert(snoozeFor, opt.hours);
                setSnoozeFor(null);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Popover>

      <style>{`
        .alert-sev-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; }
        .alert-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
        .alert-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); transition: border-color var(--transition-fast); }
        .alert-row:hover { border-color: var(--border-active); }
        .alert-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
        .alert-body { flex: 1; min-width: 0; }
        .alert-title-row { display: flex; align-items: center; gap: 8px; }
        .alert-title { font-size: 13px; font-weight: 500; color: var(--text-primary); }
        .alert-desc { display: block; font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        .alert-actions { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .alert-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: var(--radius-sm); color: var(--text-muted); transition: all var(--transition-fast); }
        .alert-icon-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .alert-icon-btn-ok:hover { color: var(--success); }
        .alert-icon-btn-danger:hover { color: var(--error); }
        .alert-empty { font-size: 12px; color: var(--text-muted); padding: 8px 4px; }
        .alert-snooze-menu { display: flex; flex-direction: column; padding: 4px; min-width: 140px; }
        .alert-snooze-label { font-size: 10px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; padding: 6px 10px 2px; font-weight: 600; }
        .alert-snooze-item { text-align: left; padding: 7px 10px; border-radius: var(--radius-sm); font-size: 12px; color: var(--text-primary); transition: background var(--transition-fast); }
        .alert-snooze-item:hover { background: var(--bg-hover); color: var(--cyan); }
      `}</style>
    </SectionCard>
  );
}
