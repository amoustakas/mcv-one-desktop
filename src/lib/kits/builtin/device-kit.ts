import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOCAL_SERVER = 'http://localhost:3100';

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

// ---------------------------------------------------------------------------
// Tool Handlers
// ---------------------------------------------------------------------------

const listDevices: KitToolHandler = async (_input, ctx) => {
  const data = await fetchJson(`${LOCAL_SERVER}/devices/scan`, ctx);
  const devices = data.devices ?? [];
  if (devices.length === 0) {
    return {
      success: true,
      data: [],
      displayMarkdown: '## Devices\n\nNo devices detected. Make sure the local server is running on port 3100.',
    };
  }
  const lines = devices.map(
    (d: { name: string; class: string; status: string; capabilities: string[] }) =>
      `- **${d.name}** — ${d.class} · ${d.status} · capabilities: ${d.capabilities.join(', ')}`,
  );
  return {
    success: true,
    data: devices,
    displayMarkdown: `## Connected Devices (${devices.length})\n\n${lines.join('\n')}`,
  };
};

const getDeviceState: KitToolHandler = async (input, ctx) => {
  const deviceId = input.device_id as string;
  const data = await fetchJson(`${LOCAL_SERVER}/devices/scan`, ctx);
  const device = (data.devices ?? []).find((d: { id: string }) => d.id === deviceId);
  if (!device) {
    return { success: false, error: `Device not found: ${deviceId}` };
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
  // Mapping management happens in the browser store — this tool provides
  // the interface for NAOS to describe mappings; the UI applies them
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
  // Profiles are stored in the browser Zustand store — return instruction
  return {
    success: true,
    data: [],
    displayMarkdown: 'Device profiles are managed in the Device Hub UI. Navigate to **Devices → Device Hub** to view and manage profiles.',
  };
};

const getDeviceEvents: KitToolHandler = async (_input, ctx) => {
  // Events are stored in browser memory — for now, return recent from server scan
  const data = await fetchJson(`${LOCAL_SERVER}/devices/sessions/discover`, ctx);
  const sessions = data.sessions ?? [];
  return {
    success: true,
    data: sessions,
    displayMarkdown: `## Recent Session Activity\n\n${sessions.length} sessions discovered.\n\n${sessions.map((s: { name: string; status: string }) => `- **${s.name}** — ${s.status}`).join('\n')}`,
  };
};

// ---------------------------------------------------------------------------
// Manifest & Exports
// ---------------------------------------------------------------------------

export const manifest: KitManifest = {
  id: 'device-hub',
  name: 'Device Hub',
  version: '1.0.0',
  description: 'Control connected hardware devices (Stream Deck, GoXLR, MIDI), manage device profiles, and orchestrate cross-session communication.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks about connected devices, hardware peripherals, Stream Deck buttons, GoXLR audio routing, MIDI controllers, or connected Claude Code sessions. Also use when the user wants to configure device mappings or switch device profiles.',
  tools: [
    {
      name: 'list_devices',
      description: 'List all connected devices (Stream Deck, GoXLR, MIDI, audio, Claude Code sessions) with their status and capabilities.',
      input_schema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'get_device_state',
      description: 'Get detailed state of a specific connected device by its ID.',
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
      description: 'Send a command to a connected device (set Stream Deck button image, move GoXLR fader, play sample, etc.).',
      input_schema: {
        type: 'object',
        properties: {
          device_id: { type: 'string', description: 'Target device ID' },
          command_type: {
            type: 'string',
            description: 'Command type: set-button-image, set-button-color, set-fader-position, set-led-color, play-sample, set-effect, route-audio, set-brightness, send-agent-command',
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
      description: 'Get recent device input events from the event log ring buffer.',
      input_schema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max events to return (default 20)' },
        },
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
};
