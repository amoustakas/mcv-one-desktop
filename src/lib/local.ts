/**
 * Local Server Client
 *
 * Detects if the MCV local server is running (port 3100)
 * and provides filesystem + system APIs.
 *
 * Port 3100 chosen to avoid conflicts with venture dev servers:
 * - 3000/3001: FutureState
 * - 3002-3009: Reserved for other ventures
 * - 3100: MCV Desktop local server
 */

import { useEffect } from 'react';
import { create } from 'zustand';

interface LocalHealth {
  status: string;
  platform: string;
  hostname: string;
  uptime: number;
  memory: { total: number; free: number; used: number };
  cpus: number;
  user: string;
  home: string;
}

interface DriveInfo {
  letter: string;
  free: number;
  total: number;
  name: string;
}

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  extension: string;
}

interface LocalStore {
  connected: boolean;
  health: LocalHealth | null;
  drives: DriveInfo[];
  setConnected: (c: boolean) => void;
  setHealth: (h: LocalHealth | null) => void;
  setDrives: (d: DriveInfo[]) => void;
}

export const useLocalStore = create<LocalStore>()((set) => ({
  connected: false,
  health: null,
  drives: [],
  setConnected: (connected) => set({ connected }),
  setHealth: (health) => set({ health }),
  setDrives: (drives) => set({ drives }),
}));

// In dev mode, Vite proxy handles /local/ -> localhost:3100
// In production, local server won't be available
const BASE = '/local';

async function localFetch(path: string, options?: RequestInit) {
  const r = await fetch(`${BASE}${path}`, options);
  return r.json();
}

// Filesystem API
export const localFS = {
  async ls(dirPath: string, showHidden = false): Promise<{ path: string; items: FileEntry[]; parent: string }> {
    return localFetch('/ls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: dirPath, showHidden }) });
  },
  async read(filePath: string): Promise<{ path: string; content: string; size: number; encoding: string; modified: string }> {
    return localFetch('/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: filePath }) });
  },
  async write(filePath: string, content: string, encoding = 'utf-8'): Promise<{ success: boolean; path: string; size: number }> {
    return localFetch('/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: filePath, content, encoding }) });
  },
  async mkdir(dirPath: string): Promise<{ success: boolean; path: string }> {
    return localFetch('/mkdir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: dirPath }) });
  },
  async remove(filePath: string): Promise<{ success: boolean }> {
    return localFetch('/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: filePath }) });
  },
  async search(searchPath: string, query: string, extensions?: string[]): Promise<{ results: FileEntry[]; total: number }> {
    return localFetch('/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: searchPath, query, extensions }) });
  },
  async drives(): Promise<{ drives: DriveInfo[] }> {
    return localFetch('/drives');
  },
};

// System API (uses execFile on server — no shell injection risk)
export const localSystem = {
  async health(): Promise<LocalHealth> {
    return localFetch('/health');
  },
  async info(): Promise<Record<string, unknown>> {
    return localFetch('/system');
  },
  async safeExec(command: string, args: string[], cwd?: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return localFetch('/exec', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command, args, cwd }) });
  },
};

// Hook: detect and maintain connection
export function useLocalServer() {
  const { connected, health, drives, setConnected, setHealth, setDrives } = useLocalStore();

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const h = await localSystem.health();
        if (mounted && h.status === 'online') {
          setConnected(true);
          setHealth(h);
          const d = await localFS.drives();
          if (mounted) setDrives(d.drives || []);
        }
      } catch {
        if (mounted) { setConnected(false); setHealth(null); }
      }
    }
    check();
    const id = setInterval(check, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, [setConnected, setHealth, setDrives]);

  return { connected, health, drives, fs: localFS, system: localSystem };
}

// ═══════════════════════════════════════════
// Pipeline API — Claude Code sessions, git, memory
// ═══════════════════════════════════════════

export interface PipelineMemoryFile {
  name: string;
  path: string;
  size: number;
  modified: string;
}

export interface PipelineProject {
  project: string;
  files: PipelineMemoryFile[];
}

export interface PipelinePlan {
  name: string;
  path: string;
  size: number;
  modified: string;
}

export interface PipelineRepo {
  name: string;
  path: string;
  branch: string;
  lastCommit: string;
  commitCount7d: number;
  uncommittedChanges: number;
}

export interface PipelineData {
  stats: {
    projects: number;
    memoryFiles: number;
    plans: number;
    repos: number;
    commits7d: number;
    uncommittedChanges: number;
    worktreeSessions: number;
  };
  memories: PipelineProject[];
  plans: PipelinePlan[];
  repos: PipelineRepo[];
  worktrees: Record<string, number>;
  scannedAt: string;
}

export interface PipelineCommit {
  sha: string;
  date: string;
  author: string;
  message: string;
}

export const localPipeline = {
  /** Full pipeline scan — all sessions, repos, memories, plans */
  async scan(): Promise<PipelineData> {
    return localFetch('/pipeline');
  },

  /** Read a specific memory or plan file */
  async readFile(filePath: string): Promise<{ path: string; content: string; size: number; modified: string }> {
    return localFetch(`/pipeline/read?path=${encodeURIComponent(filePath)}`);
  },

  /** Get git log for a specific repo */
  async gitLog(repo: string, limit = 20): Promise<{ repo: string; commits: PipelineCommit[] }> {
    return localFetch(`/pipeline/git-log?repo=${encodeURIComponent(repo)}&limit=${limit}`);
  },
};

