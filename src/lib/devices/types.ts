// ---------------------------------------------------------------------------
// Device Hub — Core Type Definitions
// ---------------------------------------------------------------------------

/** Transport protocol used to communicate with the device */
export type DeviceTransport =
  | 'usb-hid'
  | 'midi'
  | 'web-audio'
  | 'serial'
  | 'bluetooth'
  | 'websocket'
  | 'http';

/** High-level device classification */
export type DeviceClass =
  | 'stream-deck'
  | 'goxlr'
  | 'midi-controller'
  | 'audio-interface'
  | 'barcode-scanner'
  | 'hid-generic'
  | 'serial-generic'
  | 'agent-session'
  | 'app-instance';       // MCV Desktop running on a screen/device

/** What a device can do */
export type DeviceCapability =
  | 'button-input'
  | 'fader-input'
  | 'encoder-input'
  | 'audio-input'
  | 'audio-output'
  | 'audio-routing'
  | 'display-output'
  | 'led-output'
  | 'sampler'
  | 'effects'
  | 'text-input'
  | 'agent-io'
  | 'screen-output'      // Can display views (app instances)
  | 'touch-input'        // Touch-capable (mobile/tablet instances)
  | 'camera-input'       // Camera access (mobile instances)
  | 'gps-input';         // GPS/location (mobile instances)

/** Connection status of a device */
export type DeviceStatus = 'connected' | 'disconnected' | 'error' | 'initializing';

// ---------------------------------------------------------------------------
// Device Descriptor — unified representation of any connected device
// ---------------------------------------------------------------------------

export interface DeviceDescriptor {
  id: string;
  class: DeviceClass;
  transport: DeviceTransport;
  name: string;
  manufacturer?: string;
  model?: string;
  firmware?: string;
  capabilities: DeviceCapability[];
  status: DeviceStatus;
  lastSeen: number;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// App Instance Metadata — rich context for running MCV Desktop instances
// ---------------------------------------------------------------------------

export interface AppInstanceMetadata {
  // Screen
  screenClass: string;           // 'ultrawide' | 'cinema' | 'desktop' | 'phone' etc.
  screenResolution: string;      // '3840x2160'
  screenIndex?: number;          // Multi-monitor: which screen (0, 1, 2...)
  screenLabel?: string;          // Multi-monitor: screen label from getScreenDetails()
  screenPosition?: { x: number; y: number; width: number; height: number };
  pixelRatio: number;            // window.devicePixelRatio

  // Device
  deviceType: string;            // 'desktop' | 'tablet' | 'phone'
  platform: string;              // 'win32' | 'macos' | 'ios' | 'android' | 'linux'
  isPWA: boolean;
  isCapacitor: boolean;
  userAgent: string;

  // App State
  activeView: string;
  activeVenture: string;
  lastActivity: string;

  // Presence
  userId: string;
  userName: string;
  status: string;                // 'active' | 'away' | 'focus' | etc.
  statusText: string;

  // Location & Network
  timezone: string;
  city?: string;
  networkType: string;
  online: boolean;

  // Battery (mobile)
  batteryLevel?: number;
  batteryCharging?: boolean;

  // System Health (desktop with local server)
  cpuCount?: number;
  memoryTotal?: number;
  memoryUsed?: number;
  hostname?: string;
}

// ---------------------------------------------------------------------------
// Input Events — normalized events from any device
// ---------------------------------------------------------------------------

export type DeviceInputEventType =
  | 'button-press'
  | 'button-release'
  | 'fader-change'
  | 'encoder-rotate'
  | 'audio-level'
  | 'text-scan'
  | 'agent-message'
  | 'midi-note'
  | 'midi-cc';

export interface DeviceInputEvent {
  id: string;
  deviceId: string;
  timestamp: number;
  type: DeviceInputEventType;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Output Commands — commands sent to devices
// ---------------------------------------------------------------------------

export type DeviceOutputCommandType =
  | 'set-button-image'
  | 'set-button-color'
  | 'set-fader-position'
  | 'set-led-color'
  | 'play-sample'
  | 'set-effect'
  | 'route-audio'
  | 'set-brightness'
  | 'send-agent-command';

export interface DeviceOutputCommand {
  id: string;
  deviceId: string;
  type: DeviceOutputCommandType;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Mapping Engine — input pattern → action dispatch
// ---------------------------------------------------------------------------

export type DeviceMappingAction =
  | { type: 'navigate'; viewId: string }
  | { type: 'kit-tool'; kitId: string; toolName: string; input: Record<string, unknown> }
  | { type: 'agent-command'; prompt: string; ventureId?: string }
  | { type: 'webhook'; url: string; method: string; body: Record<string, unknown> }
  | { type: 'command-palette'; command: string }
  | { type: 'audio-route'; routing: Record<string, unknown> }
  | { type: 'composite'; actions: DeviceMappingAction[] };

export interface DeviceMapping {
  id: string;
  deviceId: string;
  inputPattern: {
    type: DeviceInputEventType;
    filter?: Record<string, unknown>;
  };
  action: DeviceMappingAction;
  contextId?: string;
}

// ---------------------------------------------------------------------------
// Stream Deck — page layouts and button configuration
// ---------------------------------------------------------------------------

export interface StreamDeckButton {
  index: number;
  icon?: string;
  label?: string;
  color?: string;
  mappingId?: string;
}

export interface StreamDeckPage {
  id: string;
  name: string;
  buttons: StreamDeckButton[];
}

// ---------------------------------------------------------------------------
// Audio Routing — GoXLR and general audio presets
// ---------------------------------------------------------------------------

export interface AudioRoute {
  input: string;
  output: string;
  enabled: boolean;
  volume?: number;
}

export interface AudioRoutingPreset {
  routes: AudioRoute[];
  effects?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Device Profiles — bundled configs per context
// ---------------------------------------------------------------------------

export interface DeviceProfile {
  id: string;
  name: string;
  description?: string;
  ventureId?: string;
  mappings: DeviceMapping[];
  streamDeckPages?: StreamDeckPage[];
  goxlrPreset?: string;
  audioRouting?: AudioRoutingPreset;
  activateOn: 'venture-switch' | 'manual' | 'schedule' | 'trigger';
}
