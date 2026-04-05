/**
 * MCV One Desktop — Docker Client Library
 *
 * Communicates with the local server's Docker routes (port 3100)
 * to provide container monitoring, stats, and management.
 */

const LOCAL_BASE = '/local/docker';

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: 'running' | 'exited' | 'paused' | 'created' | 'restarting' | 'dead';
  ports: string;
  created: string;
  networks: string;
  venture: string | null;
  labels: Record<string, string>;
}

export interface DockerContainerSummary {
  total: number;
  running: number;
  stopped: number;
  paused: number;
}

export interface DockerContainersResponse {
  available: boolean;
  containers: DockerContainer[];
  summary: DockerContainerSummary;
  error?: string;
}

export interface DockerStats {
  containerId: string;
  name: string;
  cpuPercent: string;
  memUsage: string;
  memLimit: string;
  memPercent: string;
  netIO: string;
  blockIO: string;
  pids: string;
}

export interface DockerImage {
  id: string;
  repository: string;
  tag: string;
  size: string;
  created: string;
}

export interface DockerVolume {
  name: string;
  driver: string;
  mountpoint: string;
  size: string;
}

export interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  scope: string;
  containers: number;
}

export type ContainerAction = 'start' | 'stop' | 'restart' | 'pause' | 'unpause';
export type ComposeAction = 'up' | 'down' | 'ps' | 'logs' | 'restart';

// ═══════════════════════════════════════════
// API Client
// ═══════════════════════════════════════════

async function localFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `Docker API error: ${res.status}`);
  }
  return res.json();
}

/** List all Docker containers (running + stopped) */
export async function listContainers(): Promise<DockerContainersResponse> {
  return localFetch<DockerContainersResponse>(`${LOCAL_BASE}/containers`);
}

/** Get live CPU/memory stats for running containers */
export async function getStats(): Promise<{ stats: DockerStats[] }> {
  return localFetch<{ stats: DockerStats[] }>(`${LOCAL_BASE}/stats`);
}

/** Get logs for a specific container */
export async function getContainerLogs(containerId: string, tail = 100): Promise<{ containerId: string; logs: string; lines: number }> {
  return localFetch(`${LOCAL_BASE}/logs/${containerId}?tail=${tail}`);
}

/** Perform an action on a container (start/stop/restart/pause/unpause) */
export async function containerAction(containerId: string, action: ContainerAction): Promise<{ success: boolean }> {
  return localFetch(`${LOCAL_BASE}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ containerId, action }),
  });
}

/** List Docker images */
export async function listImages(): Promise<{ images: DockerImage[] }> {
  return localFetch<{ images: DockerImage[] }>(`${LOCAL_BASE}/images`);
}

/** List Docker volumes */
export async function listVolumes(): Promise<{ volumes: DockerVolume[] }> {
  return localFetch<{ volumes: DockerVolume[] }>(`${LOCAL_BASE}/volumes`);
}

/** List Docker networks */
export async function listNetworks(): Promise<{ networks: DockerNetwork[] }> {
  return localFetch<{ networks: DockerNetwork[] }>(`${LOCAL_BASE}/networks`);
}

/** Run a docker compose action */
export async function composeAction(action: ComposeAction, cwd?: string): Promise<{ success: boolean; output: string }> {
  return localFetch(`${LOCAL_BASE}/compose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, cwd }),
  });
}
