import type { PresenceStatus } from './device';
import type { CalendarEvent, TwilioCall } from './api/comms';

// ---------------------------------------------------------------------------
// Presence Engine — AI Status Inference
// Pure function: takes signals, returns inferred status.
// 6-priority signal chain: calls > calendar > focus > sleep > away > active
// ---------------------------------------------------------------------------

interface InferenceSignals {
  activeCalls: TwilioCall[];
  upcomingEvents: CalendarEvent[];
  activeView: string;
  lastActivity: number;      // timestamp (ms)
  timezone: string;
}

interface InferredStatus {
  status: PresenceStatus;
  statusText: string;
  context?: {
    meetingTitle?: string;
    meetingEndTime?: string;
    meetingLink?: string;
    callContact?: string;
    callDuration?: string;
    focusView?: string;
    focusDuration?: number;
    awayDuration?: number;
  };
}

const FOCUS_VIEWS = new Set(['forge', 'ai-studio', 'prompt-composer', 'venture-forge']);

export function inferStatus(signals: InferenceSignals): InferredStatus {
  const now = Date.now();
  const idleMs = now - signals.lastActivity;
  const idleMin = Math.floor(idleMs / 60_000);

  // Priority 1: Active Calls
  const liveCall = signals.activeCalls.find(
    (c) => c.status === 'in-progress' || c.status === 'ringing' || c.status === 'queued',
  );
  if (liveCall) {
    const contact = liveCall.direction === 'inbound' ? liveCall.from : liveCall.to;
    return {
      status: 'on-call',
      statusText: `On call with ${contact}`,
      context: { callContact: contact, callDuration: liveCall.duration },
    };
  }

  // Priority 2: Calendar Events (currently in a meeting)
  const nowDate = new Date();
  const currentMeeting = signals.upcomingEvents.find((ev) => {
    const start = new Date(ev.start);
    const end = new Date(ev.end);
    return nowDate >= start && nowDate <= end;
  });
  if (currentMeeting) {
    const endDate = new Date(currentMeeting.end);
    const remainingMin = Math.max(0, Math.round((endDate.getTime() - now) / 60_000));
    return {
      status: 'in-meeting',
      statusText: `In meeting: ${currentMeeting.summary} — ${remainingMin}m left`,
      context: {
        meetingTitle: currentMeeting.summary,
        meetingEndTime: currentMeeting.end,
        meetingLink: currentMeeting.hangoutLink,
      },
    };
  }

  // Priority 3: Focus Mode (deep work views + recent activity)
  if (FOCUS_VIEWS.has(signals.activeView) && idleMs < 30_000) {
    const viewLabel = signals.activeView.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      status: 'focus',
      statusText: `Deep work: ${viewLabel}`,
      context: { focusView: signals.activeView },
    };
  }

  // Priority 4: Sleeping (late night + idle)
  const localHour = getLocalHour(signals.timezone);
  if ((localHour >= 23 || localHour < 7) && idleMin >= 15) {
    const localTime = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: signals.timezone,
    });
    return {
      status: 'sleeping',
      statusText: `Offline — ${localTime}`,
    };
  }

  // Priority 5: Away (idle > 5 min)
  if (idleMin >= 5) {
    return {
      status: 'away',
      statusText: idleMin >= 60
        ? `Away for ${Math.floor(idleMin / 60)}h ${idleMin % 60}m`
        : `Away for ${idleMin}m`,
      context: { awayDuration: idleMin },
    };
  }

  // Priority 6: Active
  const viewLabel = signals.activeView.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    status: 'active',
    statusText: `Active — ${viewLabel}`,
  };
}

function getLocalHour(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: timezone });
    return parseInt(formatter.format(new Date()), 10);
  } catch {
    return new Date().getHours();
  }
}
