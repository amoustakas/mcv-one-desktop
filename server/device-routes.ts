/**
 * MCV One Desktop — Device Hub Routes
 *
 * Hardware bridge between the browser (Vite app) and physical devices:
 * - USB HID enumeration and I/O
 * - Stream Deck detection and control
 * - GoXLR utility daemon proxy
 * - MIDI port scanning
 * - Serial port access
 * - Claude Code session discovery
 *
 * All device communication flows through these routes via SSE (input) and
 * HTTP POST (output). The browser cannot access USB/HID/serial directly.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExpressApp = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Req = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = any;

// ---------------------------------------------------------------------------
// Session Discovery — scan ~/.claude/projects/ for active Claude Code sessions
// ---------------------------------------------------------------------------

function discoverSessions(): Array<{
  id: string;
  class: 'agent-session';
  transport: 'websocket';
  name: string;
  capabilities: ['agent-io'];
  status: 'connected' | 'disconnected';
  lastSeen: number;
  metadata: Record<string, unknown>;
}> {
  const claudeDir = path.join(os.homedir(), '.claude');
  const projectsDir = path.join(claudeDir, 'projects');
  const sessions: ReturnType<typeof discoverSessions> = [];

  if (!fs.existsSync(projectsDir)) return sessions;

  for (const entry of fs.readdirSync(projectsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.includes('worktrees')) continue;

    const dirPath = path.join(projectsDir, entry.name);

    // Decode project name from directory slug (c--Users-moust-mcv-one-desktop → C:\Users\moust\mcv-one-desktop)
    const projectPath = entry.name
      .replace(/^c--/, 'C:\\')
      .replace(/-/g, '\\');

    // Check for memory directory as an indicator of activity
    const memDir = path.join(dirPath, 'memory');
    const hasMemory = fs.existsSync(memDir);

    // Check for MEMORY.md to determine last activity
    const memFile = path.join(memDir, 'MEMORY.md');
    let lastSeen = 0;
    if (hasMemory && fs.existsSync(memFile)) {
      try {
        lastSeen = fs.statSync(memFile).mtimeMs;
      } catch { /* ignore */ }
    }

    // Consider "connected" if activity within last 30 minutes
    const thirtyMinutes = 30 * 60 * 1000;
    const isActive = lastSeen > 0 && (Date.now() - lastSeen) < thirtyMinutes;

    const projectName = projectPath.split(/[\\/]/).pop() ?? entry.name;

    sessions.push({
      id: `session-${entry.name}`,
      class: 'agent-session',
      transport: 'websocket',
      name: `${projectName}`,
      capabilities: ['agent-io'],
      status: isActive ? 'connected' : 'disconnected',
      lastSeen,
      metadata: {
        projectDir: projectPath,
        dirSlug: entry.name,
        hasMemory,
      },
    });
  }

  return sessions;
}

// ---------------------------------------------------------------------------
// Device Scanning — placeholder for hardware enumeration
// ---------------------------------------------------------------------------

function scanHardwareDevices(): Array<{
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
}> {
  const devices: ReturnType<typeof scanHardwareDevices> = [];

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
      const model = identifyStreamDeckModel(sd.productId);
      devices.push({
        id: `streamdeck-${sd.serialNumber ?? sd.productId}`,
        class: 'stream-deck',
        transport: 'usb-hid',
        name: `Stream Deck ${model}`,
        manufacturer: 'Elgato',
        model,
        capabilities: ['button-input', 'display-output', 'led-output'],
        status: 'connected',
        lastSeen: Date.now(),
        metadata: {
          vendorId: sd.vendorId,
          productId: sd.productId,
          serialNumber: sd.serialNumber,
          path: sd.path,
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
    const portCount = input.getPortCount();
    for (let i = 0; i < portCount; i++) {
      const name = input.getPortName(i);
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

function identifyStreamDeckModel(productId: number): string {
  const models: Record<number, string> = {
    0x0060: 'Original',
    0x006d: 'Mini',
    0x0080: 'XL',
    0x0090: 'MK.2',
    0x00aa: 'Pedal',
    0x00b5: 'Plus',
    0x00d8: 'Neo',
  };
  return models[productId] ?? 'Unknown';
}

// ---------------------------------------------------------------------------
// GoXLR Utility Proxy — connect to GoXLR utility daemon WebSocket
// ---------------------------------------------------------------------------

let goxlrStatus: Record<string, unknown> | null = null;

async function probeGoXLRUtility(): Promise<Record<string, unknown> | null> {
  try {
    // GoXLR Utility typically listens on localhost:14564
    const res = await fetch('http://localhost:14564/api/goxlr');
    if (res.ok) {
      goxlrStatus = await res.json();
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

  // ── Full device scan (hardware + sessions) ──
  app.get('/devices/scan', async (_req: Req, res: Res) => {
    try {
      const hardware = scanHardwareDevices();
      const sessions = discoverSessions();
      const goxlr = await probeGoXLRUtility();

      // Merge all devices
      const devices = [...hardware, ...sessions];

      res.json({
        devices,
        goxlrUtilityAvailable: goxlr !== null,
        scannedAt: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Device scan failed' });
    }
  });

  // ── Session discovery only ──
  app.get('/devices/sessions/discover', (_req: Req, res: Res) => {
    try {
      const sessions = discoverSessions();
      res.json({ sessions, scannedAt: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Session discovery failed' });
    }
  });

  // ── GoXLR status ──
  app.get('/devices/goxlr/status', async (_req: Req, res: Res) => {
    const status = await probeGoXLRUtility();
    if (status) {
      res.json({ available: true, status });
    } else {
      res.json({ available: false, message: 'GoXLR utility daemon not detected on localhost:14564' });
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
    // Route to appropriate driver based on device
    // For now, log and acknowledge — actual HID/MIDI writes will be added
    // when native dependencies are installed
    console.log(`[DeviceHub] Command → ${deviceId}: ${type}`, payload);
    res.json({ success: true, deviceId, type });
  });

  // ── Stream Deck list ──
  app.get('/devices/streamdeck/list', (_req: Req, res: Res) => {
    const hardware = scanHardwareDevices();
    const decks = hardware.filter((d) => d.class === 'stream-deck');
    res.json({ streamDecks: decks });
  });

  // ── SSE event stream for all devices (multiplexed) ──
  app.get('/devices/events', (req: Req, res: Res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // Heartbeat every 30s to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
    }, 30000);

    // Send initial device list
    const hardware = scanHardwareDevices();
    const sessions = discoverSessions();
    res.write(`event: device-list\ndata: ${JSON.stringify({ devices: [...hardware, ...sessions] })}\n\n`);

    req.on('close', () => {
      clearInterval(heartbeat);
    });
  });
}
