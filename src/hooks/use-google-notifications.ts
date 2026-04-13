import { useEffect, useRef } from 'react';
import { useToast } from '../components/Toasts';

/**
 * Google Notification Poller
 *
 * Periodically checks Gmail unread count and upcoming Calendar events,
 * then surfaces notifications via the toast system.
 *
 * Interval: 5 minutes (non-aggressive, respects rate limits)
 */

interface GmailOverview {
  unreadMessages: number;
  email: string;
}

interface CalendarEvent {
  summary: string;
  start: { dateTime?: string; date?: string };
}

export function useGoogleNotifications(enabled = true) {
  const { addToast } = useToast();
  const lastUnreadRef = useRef<number | null>(null);
  const notifiedEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    async function checkGmail() {
      try {
        const res = await fetch('/api/gmail?action=overview');
        if (!res.ok) return;
        const data: GmailOverview = await res.json();

        // Notify if unread count increased
        if (lastUnreadRef.current !== null && data.unreadMessages > lastUnreadRef.current) {
          const newCount = data.unreadMessages - lastUnreadRef.current;
          addToast({
            type: 'info',
            message: `${newCount} new email${newCount > 1 ? 's' : ''} in Gmail`,
          });
        }
        lastUnreadRef.current = data.unreadMessages;
      } catch { /* Gmail not connected — skip silently */ }
    }

    async function checkCalendar() {
      try {
        const now = new Date();
        const in15min = new Date(now.getTime() + 15 * 60 * 1000);
        const res = await fetch(`/api/google-calendar?action=list-events&timeMin=${now.toISOString()}&timeMax=${in15min.toISOString()}&maxResults=3`);
        if (!res.ok) return;
        const data = await res.json();
        const events: CalendarEvent[] = data.items ?? [];

        for (const ev of events) {
          const key = `${ev.summary}-${ev.start.dateTime}`;
          if (!notifiedEventsRef.current.has(key)) {
            notifiedEventsRef.current.add(key);
            const startTime = ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : 'soon';
            addToast({
              type: 'info',
              message: `Upcoming: ${ev.summary} at ${startTime}`,
            });
          }
        }
      } catch { /* Calendar not connected — skip silently */ }
    }

    // Initial check after short delay (let app settle)
    const initialTimer = setTimeout(() => {
      checkGmail();
      checkCalendar();
    }, 10000);

    // Periodic check every 5 minutes
    const interval = setInterval(() => {
      checkGmail();
      checkCalendar();
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [enabled, addToast]);
}
