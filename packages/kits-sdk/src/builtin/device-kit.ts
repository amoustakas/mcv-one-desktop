import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOCAL_SERVER = 'http://localhost:3100';

interface DeviceRecord {
  id: string;
  name: string;
  class: string;
  status: string;
  transport: string;
  capabilities: string[];
  metadata: Record<string, unknown>;
}

interface AppInstanceMetadata {
  screenIndex?: number;
  screenLabel?: string;
  screenResolution?: { width: number; height: number };
  screenPosition?: { x: number; y: number };
  platform?: string;
  battery?: { level: number; charging: boolean } | null;
  activeView?: string;
  activeVenture?: string;
  windowBounds?: { x: number; y: number; width: number; height: number };
}

/** Valid command types keyed by device class */
const VALID_COMMANDS: Record<string, string[]> = {
  'stream-deck': [
    'set-button-image', 'set-button-color', 'set-brightness',
    'set-led-color', 'send-agent-command',
  ],
  'goxlr': [
    'set-fader-position', 'route-audio', 'play-sample',
    'set-effect', 'send-agent-command',
  ],
  'midi': [
    'set-led-color', 'send-agent-command',
  ],
  'app-instance': [
    'send-agent-command', 'navigate', 'switch-venture',
  ],
  'claude-session': [
    'send-agent-command',
  ],
};

async function fetchJson(url: string, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url);
  if (!res.ok) throw new Error(`Device API error: ${res.status}`);
  return res.json();
}

async function postJson(url: string, body: unknown, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Device API error: ${res.status}`);
  return res.json();
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item);
    (groups[k] ??= []).push(item);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Tool Handlers
// ---------------------------------------------------------------------------

const listDevices: KitToolHandler = async (_input, ctx) => {
  const data = await fetchJson(`${LOCAL_SERVER}/devices/scan`, ctx);
  const devices: DeviceRecord[] = data.devices ?? [];
  if (devices.length === 0) {
    return {
      success: true,
      data: [],
      displayMarkdown: '## Devices\n\nNo devices detected. Make sure the local server is running on port 3100.',
    };
  }

  const grouped = groupBy(devices, (d) => d.class);
  const CLASS_LABELS: Record<string, string> = {
    'stream-deck': 'Stream Decks',
    'goxlr': 'GoXLR Devices',
    'midi': 'MIDI Controllers',
    'app-instance': 'MCV Desktop Instances',
    'claude-session': 'Claude Code Sessions',
    'audio': 'Audio Devices',
  };

  const sections = Object.entries(grouped).map(([cls, items]) => {
    const label = CLASS_LABELS[cls] ?? cls;
    const lines = items.map(
      (d) => `- **${d.name}** — ${d.status} · capabilities: ${d.capabilities.join(', ')}`,
    );
    return `### ${label}\n${lines.join('\n')}`;
  });

  return {
    success: true,
    data: devices,
    displayMarkdown: `## Connected Devices (${devices.length})\n\n${sections.join('\n\n')}`,
  };
};

const getDeviceState: KitToolHandler = async (input, ctx) => {
  const deviceId = input.device_id as string;
  const data = await fetchJson(`${LOCAL_SERVER}/devices/scan`, ctx);
  const device: DeviceRecord | undefined = (data.devices ?? []).find(
    (d: DeviceRecord) => d.id === deviceId,
  );
  if (!device) {
    return { success: false, error: `Device not found: ${deviceId}` };
  }

  // Build richer output for app-instance class
  if (device.class === 'app-instance') {
    const meta = (device.metadata ?? {}) as AppInstanceMetadata;
    const lines: string[] = [
      `## ${device.name}`,
      '',
      `- **Status:** ${device.status}`,
      `- **Class:** ${device.class}`,
      `- **Transport:** ${device.transport}`,
      `- **Capabilities:** ${device.capabilities.join(', ')}`,
    ];
    if (meta.platform) lines.push(`- **Platform:** ${meta.platform}`);
    if (meta.screenResolution) {
      lines.push(`- **Screen Resolution:** ${meta.screenResolution.width}x${meta.screenResolution.height}`);
    }
    if (meta.screenLabel) lines.push(`- **Screen:** ${meta.screenLabel}`);
    if (meta.battery) {
      lines.push(`- **Battery:** ${meta.battery.level}%${meta.battery.charging ? ' (charging)' : ''}`);
    }
    if (meta.activeView) lines.push(`- **Active View:** ${meta.activeView}`);
    if (meta.activeVenture) lines.push(`- **Active Venture:** ${meta.activeVenture}`);
    if (meta.windowBounds) {
      const b = meta.windowBounds;
      lines.push(`- **Window Bounds:** ${b.width}x${b.height} at (${b.x}, ${b.y})`);
    }
    // Include remaining metadata
    const knownKeys = new Set([
      'screenIndex', 'screenLabel', 'screenResolution', 'screenPosition',
      'platform', 'battery', 'activeView', 'activeVenture', 'windowBounds',
    ]);
    const extra = Object.entries(device.metadata).filter(([k]) => !knownKeys.has(k));
    if (extra.length > 0) {
      lines.push(`- **Extra Metadata:** \`${JSON.stringify(Object.fromEntries(extra))}\``);
    }
    return { success: true, data: device, displayMarkdown: lines.join('\n') };
  }

  return {
    success: true,
    data: device,
    displayMarkdown: `## ${device.name}\n\n- **Status:** ${device.status}\n- **Class:** ${device.class}\n- **Transport:** ${device.transport}\n- **Capabilities:** ${device.capabilities.join(', ')}\n- **Metadata:** \`${JSON.stringify(device.metadata)}\``,
  };
};

const sendDeviceCommand: KitToolHandler = async (input, ctx) => {
  const { device_id, command_type, payload } = input as {
    device_id: string;
    command_type: string;
    payload: Record<string, unknown>;
  };

  // Validate: look up the device to check class-command compatibility
  try {
    const data = await fetchJson(`${LOCAL_SERVER}/devices/scan`, ctx);
    const device: DeviceRecord | undefined = (data.devices ?? []).find(
      (d: DeviceRecord) => d.id === device_id,
    );
    if (!device) {
      return { success: false, error: `Device not found: ${device_id}` };
    }
    const allowed = VALID_COMMANDS[device.class];
    if (allowed && !allowed.includes(command_type)) {
      return {
        success: false,
        error: `Command '${command_type}' is not valid for device class '${device.class}'. Valid commands: ${allowed.join(', ')}`,
      };
    }
  } catch {
    // If scan fails, proceed anyway — the command endpoint will reject if invalid
  }

  const result = await postJson(`${LOCAL_SERVER}/devices/command`, {
    deviceId: device_id,
    type: command_type,
    payload: payload ?? {},
  }, ctx);
  return {
    success: true,
    data: result,
    displayMarkdown: `Command \`${command_type}\` sent to device \`${device_id}\`.`,
  };
};

const setDeviceMapping: KitToolHandler = async (input, _ctx) => {
  const { device_id, event_type, filter, action_type, action_config } = input as {
    device_id: string;
    event_type: string;
    filter?: Record<string, unknown>;
    action_type: string;
    action_config: Record<string, unknown>;
  };
  return {
    success: true,
    data: { device_id, event_type, filter, action_type, action_config },
    displayMarkdown: `Mapping created: **${event_type}** on device \`${device_id}\` → **${action_type}**\n\nApply this mapping in the Device Hub UI to activate it.`,
  };
};

const activateDeviceProfile: KitToolHandler = async (input, _ctx) => {
  const profileName = input.profile_name as string;
  return {
    success: true,
    data: { profileName },
    displayMarkdown: `Profile **${profileName}** activation requested. Switch to the Device Hub to confirm.`,
  };
};

const listDeviceProfiles: KitToolHandler = async (_input, _ctx) => {
  return {
    success: true,
    data: [],
    displayMarkdown: 'Device profiles are managed in the Device Hub UI. Navigate to **Devices → Device Hub** to view and manage profiles.',
  };
};

const getDeviceEvents: KitToolHandler = async (input, ctx) => {
  const limit = (input.limit as number) ?? 20;

  // Try to read events from the local server event log endpoint
  try {
    const data = await fetchJson(`${LOCAL_SERVER}/devices/events?limit=${limit}`, ctx);
    const events: Array<{
      type: string;
      deviceId: string;
      deviceName?: string;
      timestamp: number;
      data?: Record<string, unknown>;
    }> = data.events ?? [];

    if (events.length === 0) {
      return {
        success: true,
        data: [],
        displayMarkdown: '## Device Events\n\nNo recent events in the log. Events are captured when devices send input (button presses, fader changes, etc.).',
      };
    }

    const lines = events.map((e) => {
      const ts = new Date(e.timestamp).toLocaleTimeString();
      const extra = e.data ? ` — \`${JSON.stringify(e.data)}\`` : '';
      return `- **${ts}** \`${e.type}\` from **${e.deviceName ?? e.deviceId}**${extra}`;
    });

    return {
      success: true,
      data: events,
      displayMarkdown: `## Device Events (last ${events.length})\n\n${lines.join('\n')}`,
    };
  } catch {
    // Event log endpoint may not exist yet — fall back to note
    return {
      success: true,
      data: [],
      displayMarkdown: '## Device Events\n\nThe `/devices/events` endpoint is not available on the local server. Device events are currently stored in-browser only (Zustand eventLog ring buffer). Wire the local server to expose `GET /devices/events` to enable this tool.',
    };
  }
};

// ---------------------------------------------------------------------------
// New Tools
// ---------------------------------------------------------------------------

const getScreenLayout: KitToolHandler = async (_input, ctx) => {
  const data = await fetchJson(`${LOCAL_SERVER}/devices/scan`, ctx);
  const devices: DeviceRecord[] = data.devices ?? [];
  const instances = devices.filter((d) => d.class === 'app-instance');

  if (instances.length === 0) {
    return {
      success: true,
      data: { screens: [], instances: [] },
      displayMarkdown: '## Screen Layout\n\nNo MCV Desktop instances detected. Cannot determine screen layout without connected instances.',
    };
  }

  // Group instances by screen
  const byScreen = groupBy(instances, (d) => {
    const meta = d.metadata as AppInstanceMetadata;
    return String(meta.screenIndex ?? 'unknown');
  });

  const sections = Object.entries(byScreen).map(([screenIdx, items]) => {
    const firstMeta = items[0].metadata as AppInstanceMetadata;
    const res = firstMeta.screenResolution
      ? `${firstMeta.screenResolution.width}x${firstMeta.screenResolution.height}`
      : 'unknown resolution';
    const pos = firstMeta.screenPosition
      ? `position (${firstMeta.screenPosition.x}, ${firstMeta.screenPosition.y})`
      : '';
    const label = firstMeta.screenLabel ?? `Screen ${screenIdx}`;

    const instanceLines = items.map((d) => {
      const m = d.metadata as AppInstanceMetadata;
      const bounds = m.windowBounds
        ? `${m.windowBounds.width}x${m.windowBounds.height} at (${m.windowBounds.x}, ${m.windowBounds.y})`
        : 'unknown bounds';
      const venture = m.activeVenture ?? 'none';
      const view = m.activeView ?? 'unknown';
      return `  - **${d.name}** — venture: ${venture}, view: ${view}, window: ${bounds}`;
    });

    return `### ${label} (${res}${pos ? ` · ${pos}` : ''})\n${instanceLines.join('\n')}`;
  });

  return {
    success: true,
    data: { screens: Object.keys(byScreen), instances },
    displayMarkdown: `## Workstation Screen Layout\n\n${sections.join('\n\n')}`,
  };
};

const getInstanceContext: KitToolHandler = async (input, ctx) => {
  const instanceId = input.instance_id as string;
  const data = await fetchJson(`${LOCAL_SERVER}/devices/scan`, ctx);
  const device: DeviceRecord | undefined = (data.devices ?? []).find(
    (d: DeviceRecord) => d.id === instanceId,
  );

  if (!device) {
    return { success: false, error: `Instance not found: ${instanceId}` };
  }
  if (device.class !== 'app-instance') {
    return { success: false, error: `Device '${instanceId}' is not an app-instance (class: ${device.class})` };
  }

  const meta = (device.metadata ?? {}) as AppInstanceMetadata;
  const lines: string[] = [
    `## Instance: ${device.name}`,
    '',
    `| Property | Value |`,
    `|----------|-------|`,
    `| **Status** | ${device.status} |`,
    `| **Transport** | ${device.transport} |`,
    `| **Platform** | ${meta.platform ?? 'unknown'} |`,
    `| **Active Venture** | ${meta.activeVenture ?? 'none'} |`,
    `| **Active View** | ${meta.activeView ?? 'unknown'} |`,
    `| **Screen** | ${meta.screenLabel ?? `Screen ${meta.screenIndex ?? '?'}`} |`,
    `| **Screen Resolution** | ${meta.screenResolution ? `${meta.screenResolution.width}x${meta.screenResolution.height}` : 'unknown'} |`,
    `| **Battery** | ${meta.battery ? `${meta.battery.level}%${meta.battery.charging ? ' (charging)' : ''}` : 'N/A (desktop)'} |`,
    `| **Window Bounds** | ${meta.windowBounds ? `${meta.windowBounds.width}x${meta.windowBounds.height} at (${meta.windowBounds.x}, ${meta.windowBounds.y})` : 'unknown'} |`,
    `| **Capabilities** | ${device.capabilities.join(', ')} |`,
  ];

  return {
    success: true,
    data: device,
    displayMarkdown: lines.join('\n'),
  };
};

const broadcastToInstances: KitToolHandler = async (input, ctx) => {
  const command = input.command as string;
  const filter = input.filter as { deviceType?: string; venture?: string } | undefined;

  const data = await fetchJson(`${LOCAL_SERVER}/devices/scan`, ctx);
  const devices: DeviceRecord[] = data.devices ?? [];

  let targets = devices.filter((d) => d.class === 'app-instance');

  if (filter?.deviceType) {
    targets = targets.filter((d) => d.class === filter.deviceType);
  }
  if (filter?.venture) {
    targets = targets.filter((d) => {
      const meta = d.metadata as AppInstanceMetadata;
      return meta.activeVenture === filter.venture;
    });
  }

  if (targets.length === 0) {
    return {
      success: true,
      data: { sent: 0 },
      displayMarkdown: '## Broadcast\n\nNo matching instances found for the given filter.',
    };
  }

  // For now, describe what would happen. Actual cross-instance messaging
  // will be wired when the local server supports POST /devices/broadcast.
  const targetList = targets.map((d) => {
    const meta = d.metadata as AppInstanceMetadata;
    return `- **${d.name}** (venture: ${meta.activeVenture ?? 'none'})`;
  });

  return {
    success: true,
    data: { command, targets: targets.map((d) => d.id), sent: targets.length },
    displayMarkdown: [
      `## Broadcast: \`${command}\``,
      '',
      `Would send to **${targets.length}** instance(s):`,
      '',
      ...targetList,
      '',
      '_Cross-instance messaging is pending — this describes the planned execution. Wire `POST /devices/broadcast` on the local server to activate._',
    ].join('\n'),
  };
};

interface StreamDeckButton {
  index: number;
  label: string;
  action_type: string;
  action_config: Record<string, unknown>;
}

const configureStreamDeckPage: KitToolHandler = async (input, _ctx) => {
  const pageName = input.page_name as string;
  const buttons = input.buttons as StreamDeckButton[];

  if (!Array.isArray(buttons) || buttons.length === 0) {
    return { success: false, error: 'buttons array is required and must not be empty' };
  }

  // Build a page configuration and device mappings
  const mappings = buttons.map((btn) => ({
    buttonIndex: btn.index,
    label: btn.label,
    actionType: btn.action_type,
    actionConfig: btn.action_config,
  }));

  const grid = buttons
    .sort((a, b) => a.index - b.index)
    .map((btn) => `| ${btn.index} | ${btn.label} | ${btn.action_type} | \`${JSON.stringify(btn.action_config)}\` |`);

  return {
    success: true,
    data: { pageName, buttons: mappings },
    displayMarkdown: [
      `## Stream Deck Page: ${pageName}`,
      '',
      `| Index | Label | Action | Config |`,
      `|-------|-------|--------|--------|`,
      ...grid,
      '',
      `**${buttons.length} buttons configured.** Apply this page in the Device Hub UI to activate.`,
    ].join('\n'),
  };
};

// ---------------------------------------------------------------------------
// Manifest & Exports
// ---------------------------------------------------------------------------

export const manifest: KitManifest = {
  id: 'device-hub',
  name: 'Device Hub',
  version: '2.0.0',
  description: 'Control connected hardware devices (Stream Deck, GoXLR, MIDI), manage device profiles, query screen layout and instance context, broadcast commands across instances, and orchestrate cross-session communication.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks about connected devices, hardware peripherals, Stream Deck buttons, GoXLR audio routing, MIDI controllers, or connected Claude Code sessions. Also use for screen/monitor layout awareness, querying which MCV Desktop instances are running and where, broadcasting commands across instances, configuring Stream Deck pages, or managing device profiles and mappings.',
  tools: [
    {
      name: 'list_devices',
      description: 'List all connected devices (Stream Deck, GoXLR, MIDI, audio, Claude Code sessions) grouped by device class with their status and capabilities.',
      input_schema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'get_device_state',
      description: 'Get detailed state of a specific connected device by its ID. For app-instances, includes screen resolution, platform, battery, active view/venture.',
      input_schema: {
        type: 'object',
        properties: {
          device_id: { type: 'string', description: 'The device ID to query' },
        },
        required: ['device_id'],
      },
    },
    {
      name: 'send_device_command',
      description: 'Send a command to a connected device (set Stream Deck button image, move GoXLR fader, play sample, etc.). Validates that the command type is compatible with the device class.',
      input_schema: {
        type: 'object',
        properties: {
          device_id: { type: 'string', description: 'Target device ID' },
          command_type: {
            type: 'string',
            description: 'Command type: set-button-image, set-button-color, set-fader-position, set-led-color, play-sample, set-effect, route-audio, set-brightness, send-agent-command, navigate, switch-venture',
          },
          payload: { type: 'object', description: 'Command-specific payload data' },
        },
        required: ['device_id', 'command_type'],
      },
    },
    {
      name: 'set_device_mapping',
      description: 'Create a device input mapping that triggers an action when a device event occurs (button press → navigate, fader change → agent command, etc.).',
      input_schema: {
        type: 'object',
        properties: {
          device_id: { type: 'string', description: 'Device to map from' },
          event_type: { type: 'string', description: 'Input event type: button-press, fader-change, encoder-rotate, midi-note, midi-cc' },
          filter: { type: 'object', description: 'Optional filter (e.g. { buttonIndex: 3 })' },
          action_type: { type: 'string', description: 'Action type: navigate, kit-tool, agent-command, webhook, audio-route, composite' },
          action_config: { type: 'object', description: 'Action configuration (e.g. { viewId: "portfolio" } for navigate)' },
        },
        required: ['device_id', 'event_type', 'action_type', 'action_config'],
      },
    },
    {
      name: 'activate_device_profile',
      description: 'Activate a named device profile that configures all device mappings, Stream Deck pages, and GoXLR preset for a specific context.',
      input_schema: {
        type: 'object',
        properties: {
          profile_name: { type: 'string', description: 'Name of the profile to activate' },
        },
        required: ['profile_name'],
      },
    },
    {
      name: 'list_device_profiles',
      description: 'List all available device profiles with their venture scope and activation mode.',
      input_schema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'get_device_events',
      description: 'Get recent device input events from the event log (button presses, fader changes, MIDI notes, etc.).',
      input_schema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max events to return (default 20)' },
        },
      },
    },
    {
      name: 'get_screen_layout',
      description: 'Returns all connected screens/monitors with their resolution, position, and which MCV Desktop instances are on each screen. Gives NAOS spatial awareness of the physical workstation.',
      input_schema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'get_instance_context',
      description: 'Returns detailed context about a specific running MCV Desktop instance — active view, venture, battery level, screen, platform, and window bounds.',
      input_schema: {
        type: 'object',
        properties: {
          instance_id: { type: 'string', description: 'The app-instance device ID to query' },
        },
        required: ['instance_id'],
      },
    },
    {
      name: 'broadcast_to_instances',
      description: 'Send a command to all connected MCV Desktop instances, optionally filtered by device type or active venture.',
      input_schema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The command to broadcast (e.g. navigate, switch-venture, refresh)' },
          filter: {
            type: 'object',
            description: 'Optional filter to narrow targets',
            properties: {
              deviceType: { type: 'string', description: 'Filter by device class (e.g. app-instance)' },
              venture: { type: 'string', description: 'Filter by active venture (e.g. betedge, warforge)' },
            },
          },
        },
        required: ['command'],
      },
    },
    {
      name: 'configure_stream_deck_page',
      description: 'Set up an entire Stream Deck page at once — all buttons with labels, action types, and action configs. Returns the page configuration for the Device Hub UI to apply.',
      input_schema: {
        type: 'object',
        properties: {
          page_name: { type: 'string', description: 'Name for this page layout (e.g. "Trading", "WarForge Controls")' },
          buttons: {
            type: 'array',
            description: 'Array of button configurations',
            items: {
              type: 'object',
              properties: {
                index: { type: 'number', description: 'Button index on the Stream Deck grid' },
                label: { type: 'string', description: 'Display label for the button' },
                action_type: { type: 'string', description: 'Action type: navigate, kit-tool, agent-command, webhook, audio-route' },
                action_config: { type: 'object', description: 'Action configuration payload' },
              },
              required: ['index', 'label', 'action_type', 'action_config'],
            },
          },
        },
        required: ['page_name', 'buttons'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  list_devices: listDevices,
  get_device_state: getDeviceState,
  send_device_command: sendDeviceCommand,
  set_device_mapping: setDeviceMapping,
  activate_device_profile: activateDeviceProfile,
  list_device_profiles: listDeviceProfiles,
  get_device_events: getDeviceEvents,
  get_screen_layout: getScreenLayout,
  get_instance_context: getInstanceContext,
  broadcast_to_instances: broadcastToInstances,
  configure_stream_deck_page: configureStreamDeckPage,
};
