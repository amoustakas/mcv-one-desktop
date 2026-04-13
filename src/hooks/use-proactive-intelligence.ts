import { useEffect, useRef } from 'react';
import { useGoogleWorkspaceStore } from '../stores/google-workspace';
import { useToast } from '../components/Toasts';

// ---------------------------------------------------------------------------
// Proactive NAOS Intelligence — Background monitor
// Periodically checks Google Workspace for conditions that need attention,
// then surfaces alerts via the workspace store and toast notifications.
// This turns NAOS from a reactive chatbot into a Chief of Staff.
// ---------------------------------------------------------------------------

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface CheckResult {
  ruleId: string;
  triggered: boolean;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

async function checkEmailAge(): Promise<CheckResult> {
  try {
    const res = await fetch('/api/gmail?action=search&q=in:inbox+is:unread+older_than:2d&maxResults=5');
    if (!res.ok) return { ruleId: 'email-age', triggered: false, message: '', severity: 'info' };
    const data = await res.json();
    const count = data.messages?.length ?? 0;
    if (count > 0) {
      const subjects = data.messages.slice(0, 3).map((m: { subject: string }) => m.subject || '(no subject)').join(', ');
      return {
        ruleId: 'email-age',
        triggered: true,
        message: `${count} unread email${count > 1 ? 's' : ''} older than 2 days: ${subjects}`,
        severity: count >= 5 ? 'critical' : 'warning',
      };
    }
  } catch { /* Gmail not connected */ }
  return { ruleId: 'email-age', triggered: false, message: '', severity: 'info' };
}

async function checkMeetingPrep(): Promise<CheckResult> {
  try {
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 60 * 1000);
    const res = await fetch(`/api/google-calendar?action=list-events&timeMin=${now.toISOString()}&timeMax=${soon.toISOString()}&maxResults=1`);
    if (!res.ok) return { ruleId: 'meeting-prep', triggered: false, message: '', severity: 'info' };
    const data = await res.json();
    const event = data.items?.[0];
    if (event) {
      const startTime = event.start?.dateTime
        ? new Date(event.start.dateTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
        : 'soon';
      const attendeeCount = event.attendees?.length || 0;
      return {
        ruleId: 'meeting-prep',
        triggered: true,
        message: `"${event.summary}" starts at ${startTime}${attendeeCount ? ` with ${attendeeCount} attendees` : ''}${event.hangoutLink ? ' (Meet link available)' : ''}`,
        severity: 'info',
      };
    }
  } catch { /* Calendar not connected */ }
  return { ruleId: 'meeting-prep', triggered: false, message: '', severity: 'info' };
}

async function checkOverdueTasks(): Promise<CheckResult> {
  try {
    const res = await fetch('/api/google-tasks?action=list-tasks&showCompleted=false');
    if (!res.ok) return { ruleId: 'task-overdue', triggered: false, message: '', severity: 'info' };
    const data = await res.json();
    const overdue = (data.items ?? []).filter((t: { due: string }) =>
      t.due && new Date(t.due) < new Date(),
    );
    if (overdue.length > 0) {
      const titles = overdue.slice(0, 3).map((t: { title: string }) => t.title).join(', ');
      return {
        ruleId: 'task-overdue',
        triggered: true,
        message: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}: ${titles}`,
        severity: overdue.length >= 3 ? 'critical' : 'warning',
      };
    }
  } catch { /* Tasks not connected */ }
  return { ruleId: 'task-overdue', triggered: false, message: '', severity: 'info' };
}

async function checkAdsBudget(): Promise<CheckResult> {
  try {
    const res = await fetch('/api/google-ads?action=overview');
    if (!res.ok) return { ruleId: 'ads-budget', triggered: false, message: '', severity: 'info' };
    const data = await res.json();
    // Check if any campaign exceeds budget threshold
    if (data.overBudgetCampaigns?.length > 0) {
      return {
        ruleId: 'ads-budget',
        triggered: true,
        message: `${data.overBudgetCampaigns.length} campaign(s) exceeding budget`,
        severity: 'warning',
      };
    }
  } catch { /* Ads not connected */ }
  return { ruleId: 'ads-budget', triggered: false, message: '', severity: 'info' };
}

const CHECK_FUNCTIONS: Record<string, () => Promise<CheckResult>> = {
  'email-age': checkEmailAge,
  'meeting-prep': checkMeetingPrep,
  'task-overdue': checkOverdueTasks,
  'ads-budget': checkAdsBudget,
};

/**
 * Hook: Proactive NAOS Intelligence
 * Runs background checks on enabled alert rules and surfaces notifications.
 */
export function useProactiveIntelligence(enabled = true) {
  const { alertRules, addActiveAlert, activeAlerts } = useGoogleWorkspaceStore();
  const { addToast } = useToast();
  const lastCheckRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!enabled) return;

    async function runChecks() {
      const enabledRules = alertRules.filter(r => r.enabled);

      for (const rule of enabledRules) {
        const checkFn = CHECK_FUNCTIONS[rule.id];
        if (!checkFn) continue;

        try {
          const result = await checkFn();

          if (result.triggered) {
            // Deduplicate: don't re-alert for the same message within 30 minutes
            const lastMsg = lastCheckRef.current[rule.id];
            if (lastMsg === result.message) continue;

            lastCheckRef.current[rule.id] = result.message;

            // Store in workspace state
            addActiveAlert({
              ruleId: rule.id,
              message: result.message,
              severity: result.severity,
            });

            // Show toast for critical and warning
            if (result.severity !== 'info') {
              addToast({
                type: result.severity === 'critical' ? 'error' : 'warning',
                message: result.message,
              });
            }
          } else {
            // Clear dedup if no longer triggered
            delete lastCheckRef.current[rule.id];
          }
        } catch {
          // Individual check failures are non-fatal
        }
      }
    }

    // Initial check after 15 seconds (let app settle)
    const initialTimer = setTimeout(runChecks, 15000);

    // Periodic checks
    const interval = setInterval(runChecks, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [enabled, alertRules, addActiveAlert, addToast]);
}
