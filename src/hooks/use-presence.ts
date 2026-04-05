import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { usePresenceStore, type PresenceState } from '../stores/presence';
import { useNavigation } from '../stores/navigation';
import { useUser } from '../lib/auth';
import { captureDeviceSnapshot, detectBattery, detectNetwork, classifyScreen } from '../lib/device';
import { inferStatus } from '../lib/presence-engine';
import type { CalendarEvent, TwilioCall } from '../lib/api/comms';

// ---------------------------------------------------------------------------
// usePresence — Main presence orchestration hook
//
// Called once in App.tsx. Handles:
// 1. Device detection + initial presence broadcast
// 2. Supabase Realtime presence channel subscription
// 3. 60-second inference loop (calendar + calls + activity → status)
// 4. Activity tracking (mousemove/keydown → lastActivity)
// 5. Screen class data attribute for CSS adaptation
// ---------------------------------------------------------------------------

const INFERENCE_INTERVAL = 60_000; // 60 seconds
const ACTIVITY_THROTTLE = 1_000;   // 1 second

export function usePresence() {
  const { user } = useUser();
  const { activeView, activeVenture } = useNavigation();
  const { setOwnPresence, updateOwn, setAllPresences } = usePresenceStore();
  const queryClient = useQueryClient();

  const lastActivityRef = useRef(Date.now());
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);
  const inferenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastThrottleRef = useRef(0);

  // Track user activity
  const handleActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottleRef.current < ACTIVITY_THROTTLE) return;
    lastThrottleRef.current = now;
    lastActivityRef.current = now;
  }, []);

  // Run inference cycle
  const runInference = useCallback(() => {
    const own = usePresenceStore.getState().ownPresence;
    if (!own) return;

    // Read cached query data (no API calls — these are already being fetched by CommsHub hooks)
    const calls = (queryClient.getQueryData<TwilioCall[]>(['comms', 'calls', 20]) ?? []);
    const events = (queryClient.getQueryData<CalendarEvent[]>(['comms', 'calendar', 'events', 15]) ?? []);

    const inferred = inferStatus({
      activeCalls: calls,
      upcomingEvents: events,
      activeView,
      lastActivity: lastActivityRef.current,
      timezone: own.timezone,
    });

    const statusChanged = inferred.status !== own.status;
    const updates: Partial<PresenceState> = {
      status: inferred.status,
      statusText: inferred.statusText,
      activeView,
      activeVenture: activeVenture || 'mcv',
      lastActivity: new Date(lastActivityRef.current).toISOString(),
      online: navigator.onLine,
    };

    if (statusChanged) {
      updates.statusSince = new Date().toISOString();
    }

    updateOwn(updates);

    // Broadcast to presence channel
    const updated = usePresenceStore.getState().ownPresence;
    if (updated && channelRef.current) {
      channelRef.current.track(updated);
    }
  }, [activeView, activeVenture, queryClient, updateOwn]);

  // Initialize presence on mount
  useEffect(() => {
    if (!user) return;

    let mounted = true;

    async function init() {
      // Capture full device snapshot
      const snapshot = await captureDeviceSnapshot();

      if (!mounted) return;

      // Set screen class data attribute for CSS
      document.documentElement.dataset.screenClass = snapshot.screenClass;
      document.documentElement.dataset.deviceType = snapshot.deviceType;

      // Build initial presence state
      const initial: PresenceState = {
        userId: user!.id,
        userName: user!.fullName || user!.firstName || 'User',
        avatarUrl: user!.imageUrl || '',
        role: 'ceo', // TODO: read from user metadata when team system is built
        accessTier: 'super-admin',

        status: 'active',
        statusText: 'Active',
        statusSince: new Date().toISOString(),

        deviceId: snapshot.deviceId,
        deviceType: snapshot.deviceType,
        deviceName: snapshot.deviceName,
        platform: snapshot.platform,
        screenClass: snapshot.screenClass,
        screenResolution: snapshot.screenResolution,
        isPWA: snapshot.isPWA,

        timezone: snapshot.location.timezone,
        timezoneOffset: snapshot.location.timezoneOffset,
        city: snapshot.location.city || '',
        coordinates: snapshot.location.coordinates,

        batteryLevel: snapshot.battery?.level,
        batteryCharging: snapshot.battery?.charging,
        networkType: snapshot.networkType,
        online: navigator.onLine,
        systemHealth: snapshot.systemHealth || undefined,

        activeView,
        activeVenture: activeVenture || 'mcv',
        lastActivity: new Date().toISOString(),
      };

      setOwnPresence(initial);

      // Join Supabase presence channel
      if (supabase) {
        const channel = supabase.channel('mcv-presence');

        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState<PresenceState>();
            const flat: Record<string, PresenceState> = {};
            for (const [, presences] of Object.entries(state)) {
              for (const p of presences) {
                flat[`${p.userId}-${p.deviceId}`] = p;
              }
            }
            setAllPresences(flat);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel.track(initial);
            }
          });

        channelRef.current = channel;
      }

      // Start inference loop
      inferenceTimerRef.current = setInterval(() => {
        runInference();

        // Also refresh battery + network (cheap)
        detectBattery().then((bat) => {
          if (bat) updateOwn({ batteryLevel: bat.level, batteryCharging: bat.charging });
        });
        const net = detectNetwork();
        updateOwn({ networkType: net });

        // Re-classify screen (in case window was moved to different monitor)
        const sc = classifyScreen();
        document.documentElement.dataset.screenClass = sc;
        updateOwn({ screenClass: sc });
      }, INFERENCE_INTERVAL);
    }

    init();

    // Activity listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Online/offline
    const handleOnline = () => updateOwn({ online: true });
    const handleOffline = () => updateOwn({ online: false });
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      mounted = false;
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (inferenceTimerRef.current) clearInterval(inferenceTimerRef.current);
      if (channelRef.current && supabase) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Update view/venture in presence when navigation changes
  useEffect(() => {
    const own = usePresenceStore.getState().ownPresence;
    if (!own) return;
    updateOwn({ activeView, activeVenture: activeVenture || 'mcv' });
    if (channelRef.current) {
      const updated = usePresenceStore.getState().ownPresence;
      if (updated) channelRef.current.track(updated);
    }
  }, [activeView, activeVenture, updateOwn]);
}
