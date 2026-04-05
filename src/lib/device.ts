// ---------------------------------------------------------------------------
// Device Detection & Fingerprinting
// Pure functions for detecting device type, screen class, location,
// battery, network, and system health. No stores, no side effects.
// ---------------------------------------------------------------------------

export type ScreenClass =
  | 'ultrawide'       // 5120+ width
  | 'cinema'          // 3840+ width, 2160+ height (4K+)
  | 'portrait'        // Height > Width, non-touch, 1080+ width
  | 'desktop'         // 1920-3839
  | 'tablet-landscape'
  | 'tablet-portrait'
  | 'phone';          // < 768

export type DeviceType = 'desktop' | 'tablet' | 'phone';

export type PresenceStatus = 'active' | 'in-meeting' | 'on-call' | 'focus' | 'away' | 'sleeping' | 'offline';

export interface SystemHealth {
  cpuCount: number;
  memoryTotal: number;
  memoryFree: number;
  memoryUsed: number;
  diskFreePercent?: number;
  hostname: string;
  osVersion: string;
  uptime: number;
}

export interface GeoLocation {
  timezone: string;
  timezoneOffset: number;
  city?: string;
  coordinates?: { lat: number; lng: number };
}

export interface BatteryInfo {
  level: number;      // 0-100
  charging: boolean;
}

// ── Device Fingerprint ──

export function generateDeviceId(): string {
  const stored = localStorage.getItem('mcv-device-id');
  if (stored) return stored;
  const id = `${detectPlatform()}-${crypto.randomUUID().slice(0, 8)}`;
  localStorage.setItem('mcv-device-id', id);
  return id;
}

export function getDeviceName(): string {
  const stored = localStorage.getItem('mcv-device-name');
  if (stored) return stored;
  return inferDeviceName();
}

export function setDeviceName(name: string): void {
  localStorage.setItem('mcv-device-name', name);
}

// ── Screen Classification ──

export function classifyScreen(): ScreenClass {
  const w = window.screen.width;
  const h = window.screen.height;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isPortrait = h > w;

  if (w >= 5120) return 'ultrawide';
  if (w >= 3840 && h >= 2160) return 'cinema';
  if (isPortrait && !isTouch && w >= 1080) return 'portrait';
  if (w >= 1920) return 'desktop';
  if (isTouch && w >= 768) return isPortrait ? 'tablet-portrait' : 'tablet-landscape';
  return 'phone';
}

export function detectDeviceType(): DeviceType {
  const sc = classifyScreen();
  if (sc === 'phone') return 'phone';
  if (sc === 'tablet-landscape' || sc === 'tablet-portrait') return 'tablet';
  return 'desktop';
}

export function getScreenResolution(): string {
  return `${window.screen.width}x${window.screen.height}`;
}

// ── Platform Detection ──

export function detectPlatform(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Mac/.test(ua)) return 'macos';
  if (/Win/.test(ua)) return 'win32';
  if (/Linux/.test(ua)) return 'linux';
  return navigator.platform || 'unknown';
}

export function inferDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android.*Mobile/.test(ua)) return 'Android Phone';
  if (/Android/.test(ua)) return 'Android Tablet';
  return navigator.platform || 'Desktop';
}

export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

// ── Location Detection ──

export function detectTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function detectTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

export function getTimezoneAbbr(): string {
  const parts = Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(new Date());
  return parts.find((p) => p.type === 'timeZoneName')?.value || '';
}

export async function detectCity(): Promise<{ city: string; lat?: number; lon?: number } | null> {
  try {
    // ip-api.com is free, no key needed, supports HTTPS via http (they redirect)
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    return { city: data.city || '', lat: data.latitude, lon: data.longitude };
  } catch {
    return null;
  }
}

export function detectGPS(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 10000, enableHighAccuracy: false },
    );
  });
}

// ── Battery & Network ──

export async function detectBattery(): Promise<BatteryInfo | null> {
  try {
    const nav = navigator as unknown as { getBattery?: () => Promise<{ level: number; charging: boolean }> };
    if (!nav.getBattery) return null;
    const battery = await nav.getBattery();
    return { level: Math.round(battery.level * 100), charging: battery.charging };
  } catch {
    return null;
  }
}

export function detectNetwork(): string {
  const conn = (navigator as unknown as { connection?: { effectiveType?: string; type?: string } }).connection;
  if (!conn) return 'unknown';
  return conn.type || conn.effectiveType || 'unknown';
}

// ── System Health (via local server) ──

export async function getSystemHealth(): Promise<SystemHealth | null> {
  try {
    const res = await fetch('/local/health', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      cpuCount: data.cpus || 0,
      memoryTotal: data.memory?.total || 0,
      memoryFree: data.memory?.free || 0,
      memoryUsed: data.memory?.used || 0,
      hostname: data.hostname || '',
      osVersion: data.platform || '',
      uptime: data.uptime || 0,
    };
  } catch {
    return null;
  }
}

// ── Full Device Snapshot ──

export async function captureDeviceSnapshot(): Promise<{
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  platform: string;
  screenClass: ScreenClass;
  screenResolution: string;
  isPWA: boolean;
  location: GeoLocation;
  battery: BatteryInfo | null;
  networkType: string;
  systemHealth: SystemHealth | null;
}> {
  const [cityData, gps, battery, systemHealth] = await Promise.all([
    detectCity(),
    detectGPS(),
    detectBattery(),
    getSystemHealth(),
  ]);

  return {
    deviceId: generateDeviceId(),
    deviceName: getDeviceName(),
    deviceType: detectDeviceType(),
    platform: detectPlatform(),
    screenClass: classifyScreen(),
    screenResolution: getScreenResolution(),
    isPWA: isPWA(),
    location: {
      timezone: detectTimezone(),
      timezoneOffset: detectTimezoneOffset(),
      city: cityData?.city,
      coordinates: gps || (cityData?.lat ? { lat: cityData.lat, lng: cityData.lon! } : undefined),
    },
    battery,
    networkType: detectNetwork(),
    systemHealth,
  };
}
