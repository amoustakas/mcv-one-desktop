/**
 * Session Connector — discovers and connects to Claude Code / NAOS agent sessions.
 *
 * Sessions are modeled as devices with class 'agent-session' and capability 'agent-io'.
 * Discovery happens via the local server which scans ~/.claude/projects/.
 *
 * Future: Supabase `active_sessions` table for remote/LAN session discovery.
 */

import type { DeviceDescriptor } from './types';

const LOCAL_SERVER = 'http://localhost:3100';

export interface SessionInfo {
  id: string;
  name: string;
  projectDir: string;
  dirSlug: string;
  status: 'connected' | 'disconnected';
  lastSeen: number;
  hasMemory: boolean;
}

/**
 * Discover Claude Code sessions by querying the local server.
 * Returns normalized DeviceDescriptors ready for the device store.
 */
export async function discoverSessions(): Promise<DeviceDescriptor[]> {
  try {
    const res = await fetch(`${LOCAL_SERVER}/devices/sessions/discover`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.sessions ?? []) as DeviceDescriptor[];
  } catch {
    console.warn('[SessionConnector] Local server not available for session discovery');
    return [];
  }
}

/**
 * Send a command/prompt to a connected Claude Code session.
 * Currently a placeholder — actual cross-session messaging will be implemented
 * when MCP bridge supports session-to-session routing.
 */
export async function sendSessionCommand(
  sessionId: string,
  prompt: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${LOCAL_SERVER}/devices/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: sessionId,
        type: 'send-agent-command',
        payload: { prompt },
      }),
    });
    if (!res.ok) {
      return { success: false, error: `Server returned ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Parse session info from a DeviceDescriptor.
 */
export function parseSessionInfo(device: DeviceDescriptor): SessionInfo | null {
  if (device.class !== 'agent-session') return null;
  return {
    id: device.id,
    name: device.name,
    projectDir: (device.metadata.projectDir as string) ?? '',
    dirSlug: (device.metadata.dirSlug as string) ?? '',
    status: device.status as 'connected' | 'disconnected',
    lastSeen: device.lastSeen,
    hasMemory: (device.metadata.hasMemory as boolean) ?? false,
  };
}
