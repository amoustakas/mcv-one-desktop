/**
 * MCV One Desktop — Device Hub Routes
 *
 * Hardware bridge between the browser (Vite app) and physical devices:
 * - USB HID enumeration and I/O (with hot-plug polling)
 * - Stream Deck detection, model metadata, and button control
 * - GoXLR utility daemon proxy + persistent WebSocket
 * - MIDI port scanning
 * - Serial port access
 * - Claude Code session discovery (lock files, git branch, project name)
 *
 * All device communication flows through these routes via SSE (input) and
 * HTTP POST (output). The browser cannot access USB/HID/serial directly.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { WebSocket } from 'ws';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExpressApp = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Req = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = any;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HardwareDevice {
  id: string;
  class: string;
  transport: string;
  name: string;
  manufacturer?: string;
  model?: string;
  capabilities: string[];
  status: 'connected' | 'disconnected' | 'initializing';
  lastSeen: number;
  metadata: Record<string, unknown>;
}

interface SessionDevice {
  id: string;
  class: 'agent-session';
  transport: 'websocket';
  name: string;
  capabilities: ['agent-io'];
  status: 'connected' | 'disconnected';
  lastSeen: number;
  metadata: Record<string, unknown>;
}

type SSEEventType =
  | 'device-list'
  | 'device-connected'
  | 'device-disconnected'
  | 'device-event'
  | 'goxlr-state'
  | 'session-update'
  | 'heartbeat';

// ---------------------------------------------------------------------------
// SSE Client Registry — multiplexed typed events
// ---------------------------------------------------------------------------

const sseClients: Set<Res> = new Set();

function broadcastSSE(eventType: SSEEventType, data: unknown): void {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      // Client disconnected — will be cleaned up on 'close'
    }
  }
}

// ---------------------------------------------------------------------------
// Session Discovery — scan ~/.claude/projects/ for active Claude Code sessions
// ---------------------------------------------------------------------------

/** Try to get the git branch for a directory, returns empty string on failure. */
function getGitBranch(dir: string): Promise<string> {
  return new Promise((resolve) => {
    execFile('git', ['-C', dir, 'branch', '--show-current'], { timeout: 3000 }, (_err, stdout) => {
      resolve((stdout ?? '').trim());
    });
  });
}

/** Check multiple activity signals beyond just MEMORY.md */
function getSessionLastActivity(dirPath: string): number {
  let latest = 0;

  const candidates = [
    path.join(dirPath, 'memory', 'MEMORY.md'),
    path.join(dirPath, 'conversation.jsonl'),
  ];

  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const mtime = fs.statSync(filePath).mtimeMs;
        if (mtime > latest) latest = mtime;
      }
    } catch { /* ignore */ }
  }

  // Check for .lock files (indicate active session)
  try {
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
      if (entry.endsWith('.lock')) {
        try {
          const mtime = fs.statSync(path.join(dirPath, entry)).mtimeMs;
          if (mtime > latest) latest = mtime;
        } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }

  // Check for recent file modifications in the directory itself
  try {
    const dirStat = fs.statSync(dirPath);
    if (dirStat.mtimeMs > latest) latest = dirStat.mtimeMs;
  } catch { /* ignore */ }

  return latest;
}

/** Detect project name from package.json if the decoded project path exists. */
function getProjectName(projectPath: string, fallback: string): string {
  try {
    const pkgPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (typeof pkg.name === 'string' && pkg.name.length > 0) {
        return pkg.name;
      }
    }
  } catch { /* ignore */ }

  // Fall back to last path segment
  return projectPath.split(/[\\/]/).pop() ?? fallback;
}

async function discoverSessions(): Promise<SessionDevice[]> {
  const claudeDir = path.join(os.homedir(), '.claude');
  const projectsDir = path.join(claudeDir, 'projects');
  const sessions: SessionDevice[] = [];

  if (!fs.existsSync(projectsDir)) return sessions;

  const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
  const branchPromises: Array<Promise<void>> = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.includes('worktrees')) continue;

    const dirPath = path.join(projectsDir, entry.name);

    // Decode project path from directory slug (c--Users-moust-mcv-one-desktop → C:\Users\moust\mcv-one-desktop)
    const projectPath = entry.name
      .replace(/^c--/, 'C:\\')
      .replace(/-/g, '\\');

    // Check for memory directory
    const memDir = path.join(dirPath, 'memory');
    const hasMemory = fs.existsSync(memDir);

    // Check multiple activity signals
    const lastSeen = getSessionLastActivity(dirPath);

    // Check for lock files as strong "connected" indicator
    let hasLock = false;
    try {
      const dirEntries = fs.readdirSync(dirPath);
      hasLock = dirEntries.some((e) => e.endsWith('.lock'));
    } catch { /* ignore */ }

    // Consider "connected" if lock file present OR activity within last 30 minutes
    const thirtyMinutes = 30 * 60 * 1000;
    const isActive = hasLock || (lastSeen > 0 && (Date.now() - lastSeen) < thirtyMinutes);

    const projectName = getProjectName(projectPath, entry.name);

    const session: SessionDevice = {
      id: `session-${entry.name}`,
      class: 'agent-session',
      transport: 'websocket',
      name: projectName,
      capabilities: ['agent-io'],
      status: isActive ? 'connected' : 'disconnected',
      lastSeen,
      metadata: {
        projectDir: projectPath,
        dirSlug: entry.name,
        hasMemory,
        hasLock,
        gitBranch: '', // filled async below
      },
    };

    sessions.push(session);

    // Async: get git branch for the project directory if it exists
    if (fs.existsSync(projectPath)) {
      branchPromises.push(
        getGitBranch(projectPath).then((branch) => {
          (session.metadata as Record<string, unknown>).gitBranch = branch;
        })
      );
    }
  }

  await Promise.all(branchPromises);
  return sessions;
}

// ---------------------------------------------------------------------------
// Device Scanning — hardware enumeration with model metadata
// ---------------------------------------------------------------------------

/** Last known hardware device list for hot-plug diffing */
let lastKnownDeviceIds: Set<string> = new Set();

function scanHardwareDevices(): HardwareDevice[] {
  const devices: HardwareDevice[] = [];

  // ── USB HID devices (requires node-hid — graceful fallback) ──
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const HID = require('node-hid');
    const hidDevices: Array<{
      vendorId: number;
      productId: number;
      product?: string;
      manufacturer?: string;
      serialNumber?: string;
      path?: string;
    }> = HID.devices();

    // Stream Deck detection (Elgato vendorId = 0x0fd9)
    const streamDecks = hidDevices.filter((d) => d.vendorId === 0x0fd9);
    for (const sd of streamDecks) {
      const modelInfo = identifyStreamDeckModel(sd.productId);
      devices.push({
        id: `streamdeck-${sd.serialNumber ?? sd.productId}`,
        class: 'stream-deck',
        transport: 'usb-hid',
        name: `Stream Deck ${modelInfo.name}`,
        manufacturer: 'Elgato',
        model: modelInfo.name,
        capabilities: ['button-input', 'display-output', 'led-output'],
        status: 'connected',
        lastSeen: Date.now(),
        metadata: {
          vendorId: sd.vendorId,
          productId: sd.productId,
          serialNumber: sd.serialNumber,
          path: sd.path,
          buttonCount: modelInfo.buttonCount,
          buttonColumns: modelInfo.columns,
          buttonRows: modelInfo.rows,
          hasLCD: modelInfo.hasLCD,
        },
      });
    }

    // GoXLR detection (TC-Helicon vendorId = 0x1220)
    const goxlrDevices = hidDevices.filter((d) => d.vendorId === 0x1220);
    for (const gx of goxlrDevices) {
      const isGoXLR = gx.productId === 0x8fe4 || gx.productId === 0x8fe0;
      const isMini = gx.productId === 0x8fe0;
      if (isGoXLR) {
        devices.push({
          id: `goxlr-${gx.serialNumber ?? gx.productId}`,
          class: 'goxlr',
          transport: 'usb-hid',
          name: isMini ? 'GoXLR Mini' : 'GoXLR',
          manufacturer: 'TC-Helicon',
          model: isMini ? 'Mini' : 'Full',
          capabilities: ['fader-input', 'audio-routing', 'sampler', 'effects', 'audio-input', 'audio-output'],
          status: 'connected',
          lastSeen: Date.now(),
          metadata: {
            vendorId: gx.vendorId,
            productId: gx.productId,
            serialNumber: gx.serialNumber,
          },
        });
      }
    }
  } catch {
    // node-hid not installed — this is expected until `npm install node-hid`
  }

  // ── Audio devices via Web Audio are handled browser-side ──
  // ── MIDI devices (requires @julusian/midi — graceful fallback) ──
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const midi = require('@julusian/midi');
    const input = new midi.Input();
    const portCount: number = input.getPortCount();
    for (let i = 0; i < portCount; i++) {
      const name: string = input.getPortName(i);
      devices.push({
        id: `midi-in-${i}`,
        class: 'midi-controller',
        transport: 'midi',
        name: name || `MIDI Input ${i}`,
        capabilities: ['button-input', 'fader-input', 'encoder-input'],
        status: 'connected',
        lastSeen: Date.now(),
        metadata: { portIndex: i, direction: 'input' },
      });
    }
    input.closePort();
  } catch {
    // @julusian/midi not installed — graceful fallback
  }

  return devices;
}

interface StreamDeckModelInfo {
  name: string;
  buttonCount: number;
  columns: number;
  rows: number;
  hasLCD: boolean;
}

function identifyStreamDeckModel(productId: number): StreamDeckModelInfo {
  const models: Record<number, StreamDeckModelInfo> = {
    0x0060: { name: 'Original',  buttonCount: 15, columns: 5, rows: 3, hasLCD: false },
    0x006d: { name: 'Mini',      buttonCount: 6,  columns: 3, rows: 2, hasLCD: false },
    0x0080: { name: 'XL',        buttonCount: 32, columns: 8, rows: 4, hasLCD: false },
    0x0090: { name: 'MK.2',      buttonCount: 15, columns: 5, rows: 3, hasLCD: false },
    0x00aa: { name: 'Pedal',     buttonCount: 3,  columns: 3, rows: 1, hasLCD: false },
    0x00b5: { name: 'Plus',      buttonCount: 8,  columns: 4, rows: 2, hasLCD: true  },
    0x00d8: { name: 'Neo',       buttonCount: 8,  columns: 4, rows: 2, hasLCD: false },
  };
  return models[productId] ?? { name: 'Unknown', buttonCount: 0, columns: 0, rows: 0, hasLCD: false };
}

// ---------------------------------------------------------------------------
// USB HID Hot-Plug Polling — runs while SSE clients are connected
// ---------------------------------------------------------------------------

let pollInterval: ReturnType<typeof setInterval> | null = null;

function startDevicePolling(): void {
  if (pollInterval) return; // already running

  console.log('[DeviceHub] Starting USB hot-plug polling (3s interval)');

  pollInterval = setInterval(() => {
    if (sseClients.size === 0) {
      stopDevicePolling();
      return;
    }

    const currentDevices = scanHardwareDevices();
    const currentIds = new Set(currentDevices.map((d) => d.id));

    // Detect newly connected devices
    for (const device of currentDevices) {
      if (!lastKnownDeviceIds.has(device.id)) {
        console.log(`[DeviceHub] Device connected: ${device.name} (${device.id})`);
        broadcastSSE('device-connected', { device });
      }
    }

    // Detect disconnected devices
    for (const oldId of lastKnownDeviceIds) {
      if (!currentIds.has(oldId)) {
        console.log(`[DeviceHub] Device disconnected: ${oldId}`);
        broadcastSSE('device-disconnected', { deviceId: oldId });
      }
    }

    lastKnownDeviceIds = currentIds;
  }, 3000);
}

function stopDevicePolling(): void {
  if (pollInterval) {
    console.log('[DeviceHub] Stopping USB hot-plug polling (no SSE clients)');
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// ---------------------------------------------------------------------------
// GoXLR Utility — persistent WebSocket + HTTP probe
// ---------------------------------------------------------------------------

const GOXLR_WS_URL = 'ws://localhost:14564';
const GOXLR_HTTP_URL = 'http://localhost:14564/api/goxlr';
const GOXLR_RECONNECT_DELAY = 5000;

let goxlrStatus: Record<string, unknown> | null = null;
let goxlrWs: WebSocket | null = null;
let goxlrReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let goxlrConnected = false;

function connectGoXLRWebSocket(): void {
  // Don't reconnect if already connected or reconnect pending
  if (goxlrWs && goxlrWs.readyState === WebSocket.OPEN) return;

  try {
    goxlrWs = new WebSocket(GOXLR_WS_URL);

    goxlrWs.on('open', () => {
      goxlrConnected = true;
      console.log('[DeviceHub] GoXLR utility WebSocket connected');
      // Request initial state
      try {
        goxlrWs?.send(JSON.stringify({ action: 'getState' }));
      } catch { /* ignore */ }
    });

    goxlrWs.on('message', (raw: Buffer | string) => {
      try {
        const data = JSON.parse(raw.toString());
        goxlrStatus = data;
        broadcastSSE('goxlr-state', { state: data });
      } catch {
        // Non-JSON message — ignore
      }
    });

    goxlrWs.on('close', () => {
      goxlrConnected = false;
      goxlrWs = null;
      console.log('[DeviceHub] GoXLR utility WebSocket disconnected');
      scheduleGoXLRReconnect();
    });

    goxlrWs.on('error', () => {
      // Error handler required to prevent unhandled exception
      // 'close' event will fire after this and handle reconnection
    });
  } catch {
    // WebSocket constructor can throw if URL is invalid etc.
    scheduleGoXLRReconnect();
  }
}

function scheduleGoXLRReconnect(): void {
  if (goxlrReconnectTimer) return;
  goxlrReconnectTimer = setTimeout(() => {
    goxlrReconnectTimer = null;
    connectGoXLRWebSocket();
  }, GOXLR_RECONNECT_DELAY);
}

function disconnectGoXLRWebSocket(): void {
  if (goxlrReconnectTimer) {
    clearTimeout(goxlrReconnectTimer);
    goxlrReconnectTimer = null;
  }
  if (goxlrWs) {
    try { goxlrWs.close(); } catch { /* ignore */ }
    goxlrWs = null;
  }
  goxlrConnected = false;
}

async function probeGoXLRUtility(): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(GOXLR_HTTP_URL);
    if (res.ok) {
      goxlrStatus = await res.json() as Record<string, unknown>;
      return goxlrStatus;
    }
  } catch {
    // GoXLR utility not running
  }
  return null;
}

// ---------------------------------------------------------------------------
// Route Registration
// ---------------------------------------------------------------------------

export function registerDeviceRoutes(app: ExpressApp) {

  // Start GoXLR WebSocket connection attempt on server boot
  connectGoXLRWebSocket();

  // ── Full device scan (hardware + sessions) ──
  app.get('/devices/scan', async (_req: Req, res: Res) => {
    try {
      const hardware = scanHardwareDevices();
      const sessions = await discoverSessions();
      const goxlr = await probeGoXLRUtility();

      const devices = [...hardware, ...sessions];

      res.json({
        devices,
        goxlrUtilityAvailable: goxlr !== null,
        goxlrWebSocketConnected: goxlrConnected,
        scannedAt: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Device scan failed' });
    }
  });

  // ── Session discovery only ──
  app.get('/devices/sessions/discover', async (_req: Req, res: Res) => {
    try {
      const sessions = await discoverSessions();
      res.json({ sessions, scannedAt: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Session discovery failed' });
    }
  });

  // ── GoXLR status ──
  app.get('/devices/goxlr/status', async (_req: Req, res: Res) => {
    const status = await probeGoXLRUtility();
    if (status) {
      res.json({ available: true, websocketConnected: goxlrConnected, status });
    } else {
      res.json({
        available: false,
        websocketConnected: goxlrConnected,
        message: 'GoXLR utility daemon not detected on localhost:14564',
      });
    }
  });

  // ── GoXLR command proxy ──
  app.post('/devices/goxlr/command', async (req: Req, res: Res) => {
    try {
      const proxyRes = await fetch('http://localhost:14564/api/goxlr/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        res.json(data);
      } else {
        res.status(proxyRes.status).json({ error: 'GoXLR command failed' });
      }
    } catch {
      res.status(503).json({ error: 'GoXLR utility not available' });
    }
  });

  // ── Generic device output command ──
  app.post('/devices/command', (req: Req, res: Res) => {
    const { deviceId, type, payload } = req.body;
    console.log(`[DeviceHub] Command -> ${deviceId}: ${type}`, payload);
    broadcastSSE('device-event', { deviceId, type, payload, direction: 'output' });
    res.json({ success: true, deviceId, type });
  });

  // ── Stream Deck list ──
  app.get('/devices/streamdeck/list', (_req: Req, res: Res) => {
    const hardware = scanHardwareDevices();
    const decks = hardware.filter((d) => d.class === 'stream-deck');
    res.json({ streamDecks: decks });
  });

  // ── Stream Deck set button ──
  app.post('/devices/streamdeck/set-button', (req: Req, res: Res) => {
    const { deviceId, buttonIndex, imageBase64, color, label } = req.body;

    if (!deviceId || buttonIndex === undefined || buttonIndex === null) {
      res.status(400).json({ error: 'deviceId and buttonIndex are required' });
      return;
    }

    if (typeof buttonIndex !== 'number' || buttonIndex < 0) {
      res.status(400).json({ error: 'buttonIndex must be a non-negative number' });
      return;
    }

    // Log the request — actual HID write will be added when @elgato-stream-deck/node is installed
    console.log(`[DeviceHub] Stream Deck set-button -> ${deviceId} [${buttonIndex}]`, {
      hasImage: !!imageBase64,
      color: color ?? null,
      label: label ?? null,
    });

    // Broadcast the button update as a device event
    broadcastSSE('device-event', {
      deviceId,
      type: 'set-button',
      payload: { buttonIndex, hasImage: !!imageBase64, color, label },
      direction: 'output',
    });

    res.json({
      success: true,
      deviceId,
      buttonIndex,
      note: 'Button state logged. Physical HID write requires @elgato-stream-deck/node.',
    });
  });

  // ── SSE event stream for all devices (multiplexed typed events) ──
  app.get('/devices/events', async (req: Req, res: Res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // Register this client
    sseClients.add(res);

    // Start polling if this is the first client
    if (sseClients.size === 1) {
      // Snapshot current device list for diffing
      const initial = scanHardwareDevices();
      lastKnownDeviceIds = new Set(initial.map((d) => d.id));
      startDevicePolling();
    }

    // Heartbeat every 30s to keep connection alive
    const heartbeat = setInterval(() => {
      try {
        res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
      } catch { /* client gone */ }
    }, 30000);

    // Send initial device list (hardware + sessions)
    try {
      const hardware = scanHardwareDevices();
      const sessions = await discoverSessions();
      res.write(`event: device-list\ndata: ${JSON.stringify({ devices: [...hardware, ...sessions] })}\n\n`);
    } catch {
      res.write(`event: device-list\ndata: ${JSON.stringify({ devices: [], error: 'Initial scan failed' })}\n\n`);
    }

    // Send current GoXLR state if available
    if (goxlrStatus) {
      res.write(`event: goxlr-state\ndata: ${JSON.stringify({ state: goxlrStatus })}\n\n`);
    }

    // Periodic session re-scan (every 30s) — push session-update events
    const sessionPoll = setInterval(async () => {
      try {
        const sessions = await discoverSessions();
        broadcastSSE('session-update', { sessions });
      } catch { /* ignore */ }
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
      clearInterval(sessionPoll);
      sseClients.delete(res);

      // Stop polling if no more clients
      if (sseClients.size === 0) {
        stopDevicePolling();
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Cleanup on process exit
// ---------------------------------------------------------------------------

function cleanup(): void {
  stopDevicePolling();
  disconnectGoXLRWebSocket();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
