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
  gitBranch?: string;
}

export interface SessionCommandResult {
  success: boolean;
  error?: string;
  response?: unknown;
}

export interface SessionWorkingTree {
  sessionId: string;
  projectDir: string;
  branch: string;
  modified: string[];
  staged: string[];
  untracked: string[];
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
 * Returns the full response payload from the session, not just success/failure.
 */
export async function sendSessionCommand(
  sessionId: string,
  prompt: string,
): Promise<SessionCommandResult> {
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
    const data = await res.json();
    return { success: true, response: data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Enhanced discovery that also reads the git branch from each discovered
 * session's project directory via the local server.
 */
export async function discoverSessionsWithGit(): Promise<DeviceDescriptor[]> {
  try {
    const res = await fetch(`${LOCAL_SERVER}/devices/sessions/discover?include=git`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.sessions ?? []) as DeviceDescriptor[];
  } catch {
    console.warn('[SessionConnector] Local server not available for git-enhanced discovery');
    return [];
  }
}

/**
 * Returns what files are modified in a session's working tree.
 * Queries the local server which runs `git status --porcelain` in the project dir.
 */
export async function getSessionWorkingTree(
  sessionId: string,
): Promise<SessionWorkingTree | null> {
  try {
    const res = await fetch(
      `${LOCAL_SERVER}/devices/sessions/${encodeURIComponent(sessionId)}/working-tree`,
    );
    if (!res.ok) return null;
    return (await res.json()) as SessionWorkingTree;
  } catch {
    console.warn(`[SessionConnector] Could not get working tree for ${sessionId}`);
    return null;
  }
}

/**
 * Broadcast a command to multiple sessions matching a filter.
 * Returns results keyed by session ID.
 */
export async function broadcastToSessions(
  prompt: string,
  filter?: {
    status?: 'connected' | 'disconnected';
    projectDir?: string;
    nameContains?: string;
  },
): Promise<Record<string, SessionCommandResult>> {
  // First discover all sessions
  const sessions = await discoverSessions();
  const results: Record<string, SessionCommandResult> = {};

  const targets = sessions.filter((s) => {
    if (filter?.status && s.status !== filter.status) return false;
    if (filter?.projectDir) {
      const dir = (s.metadata.projectDir as string) ?? '';
      if (!dir.includes(filter.projectDir)) return false;
    }
    if (filter?.nameContains && !s.name.toLowerCase().includes(filter.nameContains.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Send commands in parallel
  const promises = targets.map(async (session) => {
    const result = await sendSessionCommand(session.id, prompt);
    results[session.id] = result;
  });

  await Promise.allSettled(promises);
  return results;
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
