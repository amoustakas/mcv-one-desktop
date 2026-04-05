/**
 * Instance Registry — bridges the Presence system into the Device Hub.
 *
 * Every running MCV Desktop instance (desktop browser, PWA, Capacitor app)
 * registers itself as a device with class 'app-instance'. The presence system
 * already tracks screen resolution, device type, platform, battery, GPS, etc.
 * This module converts presence data into DeviceDescriptors.
 *
 * Multi-screen detection uses the Window Management API (getScreenDetails)
 * when available, falling back to window.screen for single-monitor.
 */

import type { DeviceDescriptor, DeviceCapability, AppInstanceMetadata } from './types';
import { usePresenceStore, type PresenceState } from '../../stores/presence';
import {
  generateDeviceId,
  getDeviceName,
  classifyScreen,
  getScreenResolution,
  detectDeviceType,
  detectPlatform,
  isPWA,
  detectNetwork,
} from '../device';
import { supabase } from '../supabase';

// ---------------------------------------------------------------------------
// Multi-Screen Detection (Window Management API)
// ---------------------------------------------------------------------------

interface ScreenDetails {
  screens: Array<{
    label: string;
    left: number;
    top: number;
    width: number;
    height: number;
    devicePixelRatio: number;
    isPrimary: boolean;
    isInternal: boolean;
  }>;
  currentScreen: {
    label: string;
    left: number;
    top: number;
    width: number;
    height: number;
    devicePixelRatio: number;
    isPrimary: boolean;
  };
}

// Cached screen details to avoid repeated permission prompts
let _cachedScreenDetails: ScreenDetails | null = null;
let _screenCacheTime = 0;
const SCREEN_CACHE_TTL = 30_000; // 30 seconds

/**
 * Detect all connected screens using the Window Management API.
 * Results are cached for 30s and invalidated on screen change events.
 * Returns null if the API is not available or permission is denied.
 */
export async function detectScreens(): Promise<ScreenDetails | null> {
  // Return cache if still fresh
  if (_cachedScreenDetails && Date.now() - _screenCacheTime < SCREEN_CACHE_TTL) {
    return _cachedScreenDetails;
  }

  try {
    const windowMgmt = window as unknown as {
      getScreenDetails?: () => Promise<ScreenDetails>;
    };
    if (!windowMgmt.getScreenDetails) return null;
    const details = await windowMgmt.getScreenDetails();
    _cachedScreenDetails = details;
    _screenCacheTime = Date.now();

    // Listen for screen change events to invalidate cache
    const screensObj = details as unknown as { addEventListener?: (type: string, fn: () => void) => void };
    if (screensObj.addEventListener) {
      screensObj.addEventListener('screenschange', () => {
        _cachedScreenDetails = null;
        _screenCacheTime = 0;
      });
    }

    return details;
  } catch {
    // Permission denied or API not available
    return null;
  }
}

/** Invalidate the cached screen details (call on manual refresh). */
export function invalidateScreenCache(): void {
  _cachedScreenDetails = null;
  _screenCacheTime = 0;
}

/**
 * Get the current window's screen position and size.
 */
export function getWindowPlacement(): {
  screenX: number;
  screenY: number;
  width: number;
  height: number;
  outerWidth: number;
  outerHeight: number;
} {
  return {
    screenX: window.screenX,
    screenY: window.screenY,
    width: window.innerWidth,
    height: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
  };
}

/**
 * Determine which screen index this window is on based on position.
 */
export function identifyCurrentScreen(
  screens: ScreenDetails['screens'],
  windowX: number,
  windowY: number,
): number {
  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    if (
      windowX >= s.left &&
      windowX < s.left + s.width &&
      windowY >= s.top &&
      windowY < s.top + s.height
    ) {
      return i;
    }
  }
  // Fallback: primary screen
  return screens.findIndex((s) => s.isPrimary) ?? 0;
}

// ---------------------------------------------------------------------------
// Multi-Screen Layout Description (for NAOS agent context)
// ---------------------------------------------------------------------------

/**
 * Returns a formatted description of all detected screens with positions.
 * Designed for injection into agent system prompts so NAOS understands
 * the user's physical screen layout.
 */
export async function getMultiScreenLayout(): Promise<string> {
  const screenDetails = await detectScreens();
  if (!screenDetails || screenDetails.screens.length <= 1) {
    const w = window.screen.width;
    const h = window.screen.height;
    return `Single screen: ${w}x${h} (${classifyScreen()})`;
  }

  const placement = getWindowPlacement();
  const currentIdx = identifyCurrentScreen(
    screenDetails.screens,
    placement.screenX,
    placement.screenY,
  );

  const lines: string[] = [`${screenDetails.screens.length} screens detected:`];
  for (let i = 0; i < screenDetails.screens.length; i++) {
    const s = screenDetails.screens[i];
    const label = s.label || `Screen ${i + 1}`;
    const primary = s.isPrimary ? ' [PRIMARY]' : '';
    const current = i === currentIdx ? ' [THIS INSTANCE]' : '';
    const internal = s.isInternal ? ' (built-in)' : '';
    lines.push(
      `  ${i + 1}. ${label}${primary}${current}${internal} — ${s.width}x${s.height} @ (${s.left},${s.top}), ${s.devicePixelRatio}x DPR`,
    );
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Supabase Screen Registration
// ---------------------------------------------------------------------------

/**
 * Upsert the current screen into the `screen_registry` table.
 * Uses the schema from migration-device-instances.sql.
 */
export async function registerScreenToSupabase(): Promise<void> {
  if (!supabase) return;

  const presence = usePresenceStore.getState().ownPresence;
  const userId = presence?.userId ?? 'local';
  const screenRes = getScreenResolution();
  const screenClass = classifyScreen();

  const screenDetails = await detectScreens();
  let screenLabel = 'Primary';
  let isPrimary = true;
  let isInternal = false;
  let positionX: number | null = null;
  let positionY: number | null = null;

  if (screenDetails) {
    const placement = getWindowPlacement();
    const idx = identifyCurrentScreen(screenDetails.screens, placement.screenX, placement.screenY);
    const current = screenDetails.screens[idx];
    if (current) {
      screenLabel = current.label || `Screen ${idx + 1}`;
      isPrimary = current.isPrimary;
      isInternal = current.isInternal;
      positionX = current.left;
      positionY = current.top;
    }
  }

  const id = `${userId}-${screenLabel}-${screenRes}`;

  await supabase.from('screen_registry').upsert(
    {
      id,
      user_id: userId,
      screen_label: screenLabel,
      resolution: screenRes,
      screen_class: screenClass,
      pixel_ratio: window.devicePixelRatio,
      is_primary: isPrimary,
      is_internal: isInternal,
      position_x: positionX,
      position_y: positionY,
      preferred_view: presence?.activeView ?? null,
      preferred_venture: presence?.activeVenture ?? null,
      last_seen: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
}

// ---------------------------------------------------------------------------
// Capacitor Detection
// ---------------------------------------------------------------------------

function isCapacitor(): boolean {
  return typeof (window as unknown as { Capacitor?: unknown }).Capacitor !== 'undefined';
}

// ---------------------------------------------------------------------------
// Build Instance Capabilities
// ---------------------------------------------------------------------------

function buildCapabilities(): DeviceCapability[] {
  const caps: DeviceCapability[] = ['screen-output', 'agent-io'];

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) caps.push('touch-input');

  // Camera (mediaDevices API)
  if (typeof navigator.mediaDevices?.getUserMedia === 'function') {
    caps.push('camera-input');
  }

  // Audio
  if (typeof navigator.mediaDevices?.getUserMedia === 'function') {
    caps.push('audio-input', 'audio-output');
  }

  // GPS (geolocation API)
  if (navigator.geolocation) {
    caps.push('gps-input');
  }

  return caps;
}

// ---------------------------------------------------------------------------
// Build Self-Registration Descriptor
// ---------------------------------------------------------------------------

/**
 * Create a DeviceDescriptor for the current MCV Desktop instance.
 * Call this on app startup to register this window as a device.
 */
export async function buildSelfDescriptor(): Promise<DeviceDescriptor> {
  const deviceId = generateDeviceId();
  const deviceName = getDeviceName();
  const deviceType = detectDeviceType();
  const platform = detectPlatform();
  const screenClass = classifyScreen();
  const screenRes = getScreenResolution();
  const pwa = isPWA();
  const cap = isCapacitor();
  const network = detectNetwork();
  const placement = getWindowPlacement();

  // Try multi-screen detection
  const screenDetails = await detectScreens();
  let screenIndex: number | undefined;
  let screenLabel: string | undefined;
  let screenPosition: AppInstanceMetadata['screenPosition'];

  if (screenDetails) {
    screenIndex = identifyCurrentScreen(
      screenDetails.screens,
      placement.screenX,
      placement.screenY,
    );
    const current = screenDetails.screens[screenIndex];
    if (current) {
      screenLabel = current.label || `Screen ${screenIndex + 1}`;
      screenPosition = {
        x: current.left,
        y: current.top,
        width: current.width,
        height: current.height,
      };
    }
  }

  // Read presence for user context
  const presence = usePresenceStore.getState().ownPresence;

  // Detect orientation for mobile/tablet
  let orientation: string | undefined;
  try {
    if (window.screen?.orientation?.type) {
      orientation = window.screen.orientation.type; // e.g. 'portrait-primary'
    }
  } catch { /* orientation API not available */ }

  const metadata: AppInstanceMetadata = {
    screenClass,
    screenResolution: screenRes,
    screenIndex,
    screenLabel,
    screenPosition,
    pixelRatio: window.devicePixelRatio,
    ...(orientation ? { orientation } : {}),
    deviceType,
    platform,
    isPWA: pwa,
    isCapacitor: cap,
    userAgent: navigator.userAgent,
    activeView: presence?.activeView ?? 'command-center',
    activeVenture: presence?.activeVenture ?? 'mcv',
    lastActivity: new Date().toISOString(),
    userId: presence?.userId ?? 'local',
    userName: presence?.userName ?? 'Tony',
    status: presence?.status ?? 'active',
    statusText: presence?.statusText ?? '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    city: presence?.city,
    networkType: network,
    online: navigator.onLine,
    batteryLevel: presence?.batteryLevel,
    batteryCharging: presence?.batteryCharging,
    cpuCount: presence?.systemHealth?.cpuCount,
    memoryTotal: presence?.systemHealth?.memoryTotal,
    memoryUsed: presence?.systemHealth?.memoryUsed,
    hostname: presence?.systemHealth?.hostname,
  };

  // Build display name
  const screenSuffix = screenLabel ? ` (${screenLabel})` : '';
  const typeSuffix = cap ? ' [Capacitor]' : pwa ? ' [PWA]' : '';
  const name = `MCV Desktop · ${deviceName}${screenSuffix}${typeSuffix}`;

  return {
    id: `instance-${deviceId}`,
    class: 'app-instance',
    transport: 'websocket',
    name,
    manufacturer: 'MCV',
    model: `${screenClass} · ${screenRes}`,
    capabilities: buildCapabilities(),
    status: 'connected',
    lastSeen: Date.now(),
    metadata: metadata as unknown as Record<string, unknown>,
  };
}

// ---------------------------------------------------------------------------
// Convert Presence Entries → Device Descriptors
// ---------------------------------------------------------------------------

/**
 * Convert all known presence entries (other users/devices) into DeviceDescriptors.
 * This bridges the Supabase Realtime presence channel into the Device Hub.
 *
 * Detects whether a remote instance is on the same machine (same hostname)
 * vs truly remote, and tags the metadata accordingly.
 */
export function presenceToDevices(
  presences: Record<string, PresenceState>,
  ownDeviceId: string,
): DeviceDescriptor[] {
  const devices: DeviceDescriptor[] = [];

  // Determine our own hostname for same-machine detection
  const ownPresence = usePresenceStore.getState().ownPresence;
  const ownHostname = ownPresence?.systemHealth?.hostname;

  for (const [key, p] of Object.entries(presences)) {
    // Skip our own device (already registered separately)
    if (key.endsWith(ownDeviceId)) continue;

    const caps: DeviceCapability[] = ['screen-output', 'agent-io'];
    if (p.deviceType === 'phone' || p.deviceType === 'tablet') {
      caps.push('touch-input', 'camera-input', 'gps-input');
      caps.push('audio-input', 'audio-output');
    }

    // Same-machine detection: compare hostnames
    const remoteHostname = p.systemHealth?.hostname;
    const isSameMachine = !!(ownHostname && remoteHostname && ownHostname === remoteHostname);

    const meta: AppInstanceMetadata = {
      screenClass: p.screenClass,
      screenResolution: p.screenResolution,
      pixelRatio: 1,
      deviceType: p.deviceType,
      platform: p.platform,
      isPWA: p.isPWA,
      isCapacitor: false,
      userAgent: '',
      activeView: p.activeView,
      activeVenture: p.activeVenture,
      lastActivity: p.lastActivity,
      userId: p.userId,
      userName: p.userName,
      status: p.status,
      statusText: p.statusText,
      timezone: p.timezone,
      city: p.city,
      networkType: p.networkType,
      online: p.online,
      batteryLevel: p.batteryLevel,
      batteryCharging: p.batteryCharging,
      hostname: remoteHostname,
    };

    const locationTag = isSameMachine ? ' [Same Machine]' : '';
    const typeSuffix = p.isPWA ? ' [PWA]' : '';
    devices.push({
      id: `instance-${p.deviceId}`,
      class: 'app-instance',
      transport: isSameMachine ? 'http' : 'websocket',
      name: `${p.userName} · ${p.deviceName}${typeSuffix}${locationTag}`,
      manufacturer: 'MCV',
      model: `${p.screenClass} · ${p.screenResolution}`,
      capabilities: caps,
      status: p.online ? 'connected' : 'disconnected',
      lastSeen: new Date(p.lastActivity).getTime(),
      metadata: {
        ...(meta as unknown as Record<string, unknown>),
        isSameMachine,
      },
    });
  }

  return devices;
}
