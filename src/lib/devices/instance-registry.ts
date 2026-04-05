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

/**
 * Detect all connected screens using the Window Management API.
 * Returns null if the API is not available or permission is denied.
 */
export async function detectScreens(): Promise<ScreenDetails | null> {
  try {
    const windowMgmt = window as unknown as {
      getScreenDetails?: () => Promise<ScreenDetails>;
    };
    if (!windowMgmt.getScreenDetails) return null;
    return await windowMgmt.getScreenDetails();
  } catch {
    // Permission denied or API not available
    return null;
  }
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

  const metadata: AppInstanceMetadata = {
    screenClass,
    screenResolution: screenRes,
    screenIndex,
    screenLabel,
    screenPosition,
    pixelRatio: window.devicePixelRatio,
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
 */
export function presenceToDevices(
  presences: Record<string, PresenceState>,
  ownDeviceId: string,
): DeviceDescriptor[] {
  const devices: DeviceDescriptor[] = [];

  for (const [key, p] of Object.entries(presences)) {
    // Skip our own device (already registered separately)
    if (key.endsWith(ownDeviceId)) continue;

    const caps: DeviceCapability[] = ['screen-output', 'agent-io'];
    if (p.deviceType === 'phone' || p.deviceType === 'tablet') {
      caps.push('touch-input', 'camera-input', 'gps-input');
    }
    if (p.deviceType === 'phone' || p.deviceType === 'tablet') {
      caps.push('audio-input', 'audio-output');
    }

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
    };

    const typeSuffix = p.isPWA ? ' [PWA]' : '';
    devices.push({
      id: `instance-${p.deviceId}`,
      class: 'app-instance',
      transport: 'websocket',
      name: `${p.userName} · ${p.deviceName}${typeSuffix}`,
      manufacturer: 'MCV',
      model: `${p.screenClass} · ${p.screenResolution}`,
      capabilities: caps,
      status: p.online ? 'connected' : 'disconnected',
      lastSeen: new Date(p.lastActivity).getTime(),
      metadata: meta as unknown as Record<string, unknown>,
    });
  }

  return devices;
}
