// server/mcp-routes.ts
/**
 * MCP Stdio Process Manager
 *
 * Manages MCP server processes that communicate over stdin/stdout.
 * The browser can't spawn processes, so this acts as an HTTP↔stdio bridge.
 *
 * Routes:
 *   POST /mcp/spawn        — Start an MCP server process
 *   POST /mcp/message/:id  — Send JSON-RPC message and get response
 *   POST /mcp/kill/:id     — Terminate a server process
 *   GET  /mcp/status        — List all running processes
 *   GET  /mcp/health/:id   — Check if a specific process is alive
 */

import { spawn, type ChildProcess } from 'child_process';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExpressApp = any;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

interface McpProcess {
  id: string;
  process: ChildProcess;
  pending: Map<string | number, PendingRequest>;
  buffer: string;
  startedAt: number;
  lastActivity: number;
  idleTimeout: ReturnType<typeof setTimeout> | null;
  idleTimeoutMs: number;
}

// All active MCP server processes
const processes = new Map<string, McpProcess>();

// Known safe MCP server packages (validated at spawn time)
const ALLOWED_COMMANDS = new Set(['npx', 'node', 'bun', 'deno']);

function parseStdoutLines(proc: McpProcess): void {
  const lines = proc.buffer.split('\n');
  // Keep the last partial line in the buffer
  proc.buffer = lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const msg = JSON.parse(trimmed);

      // Match response to pending request by id
      if ('id' in msg && proc.pending.has(msg.id)) {
        const pending = proc.pending.get(msg.id)!;
        proc.pending.delete(msg.id);
        clearTimeout(pending.timeout);
        pending.resolve(msg);
      }
      // Notifications (no id) — currently logged, forwarded in future
    } catch {
      // Non-JSON output from the process (startup logs, etc.) — ignore
    }
  }
}

function resetIdleTimer(proc: McpProcess): void {
  if (proc.idleTimeout) clearTimeout(proc.idleTimeout);
  proc.idleTimeout = setTimeout(() => {
    console.log(`[MCP] Idle timeout for "${proc.id}" — killing process`);
    killProcess(proc.id);
  }, proc.idleTimeoutMs);
}

function killProcess(id: string): void {
  const proc = processes.get(id);
  if (!proc) return;

  if (proc.idleTimeout) clearTimeout(proc.idleTimeout);

  // Reject all pending requests
  for (const [, pending] of proc.pending) {
    clearTimeout(pending.timeout);
    pending.reject(new Error('Process terminated'));
  }
  proc.pending.clear();

  try {
    proc.process.kill('SIGTERM');
    // Force kill after 5s if still alive
    setTimeout(() => {
      try {
        proc.process.kill('SIGKILL');
      } catch {
        // Already dead
      }
    }, 5000);
  } catch {
    // Already dead
  }

  processes.delete(id);
}

export function registerMcpRoutes(app: ExpressApp): void {
  // ── Spawn a new MCP server process ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.post('/mcp/spawn', (req: any, res: any) => {
    const { id, command, args = [], env = {}, idleTimeoutMs = 1800_000 } = req.body;

    if (!id || !command) {
      return res.status(400).json({ error: 'Missing id or command' });
    }

    // Validate command
    const baseName = command.split('/').pop()?.split('\\').pop() || command;
    if (!ALLOWED_COMMANDS.has(baseName)) {
      return res.status(403).json({
        error: `Command "${baseName}" not allowed. Permitted: ${Array.from(ALLOWED_COMMANDS).join(', ')}`,
      });
    }

    // Kill existing process with same ID
    if (processes.has(id)) {
      killProcess(id);
    }

    try {
      const mergedEnv = { ...process.env, ...env };
      const child = spawn(command, args, {
        env: mergedEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      const mcpProc: McpProcess = {
        id,
        process: child,
        pending: new Map(),
        buffer: '',
        startedAt: Date.now(),
        lastActivity: Date.now(),
        idleTimeout: null,
        idleTimeoutMs,
      };

      // Parse stdout for JSON-RPC responses
      child.stdout?.on('data', (data: Buffer) => {
        mcpProc.buffer += data.toString();
        mcpProc.lastActivity = Date.now();
        parseStdoutLines(mcpProc);
      });

      // Log stderr (MCP servers may print diagnostics here)
      child.stderr?.on('data', (data: Buffer) => {
        const text = data.toString().trim();
        if (text) console.log(`[MCP:${id}:stderr] ${text}`);
      });

      child.on('exit', (code) => {
        console.log(`[MCP] Process "${id}" exited with code ${code}`);
        // Reject all pending requests
        for (const [, pending] of mcpProc.pending) {
          clearTimeout(pending.timeout);
          pending.reject(new Error(`Process exited with code ${code}`));
        }
        mcpProc.pending.clear();
        processes.delete(id);
      });

      child.on('error', (err) => {
        console.error(`[MCP] Process "${id}" error:`, err.message);
        processes.delete(id);
      });

      processes.set(id, mcpProc);
      resetIdleTimer(mcpProc);

      res.json({ ok: true, pid: child.pid });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: `Failed to spawn: ${msg}` });
    }
  });

  // ── Send JSON-RPC message to a process ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.post('/mcp/message/:id', async (req: any, res: any) => {
    const { id } = req.params;
    const { message } = req.body;

    const proc = processes.get(id);
    if (!proc) {
      return res.status(404).json({ error: `No process found with id "${id}"` });
    }

    if (!proc.process.stdin?.writable) {
      return res.status(500).json({ error: 'Process stdin not writable' });
    }

    const jsonMsg = JSON.stringify(message);

    // Write to stdin
    proc.process.stdin.write(jsonMsg + '\n');
    proc.lastActivity = Date.now();
    resetIdleTimer(proc);

    // If it's a notification (no id), respond immediately
    const msg = message as Record<string, unknown>;
    if (!('id' in msg)) {
      return res.json({ ok: true });
    }

    // Wait for response with timeout
    const requestId = msg.id as string | number;
    const REQUEST_TIMEOUT = 30_000;

    try {
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          proc.pending.delete(requestId);
          reject(new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`));
        }, REQUEST_TIMEOUT);

        proc.pending.set(requestId, { resolve, reject, timeout });
      });

      res.json({ response });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      res.status(504).json({ error: errMsg });
    }
  });

  // ── Kill a process ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.post('/mcp/kill/:id', (req: any, res: any) => {
    const { id } = req.params;
    const existed = processes.has(id);
    killProcess(id);
    res.json({ ok: true, existed });
  });

  // ── List all processes ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.get('/mcp/status', (_req: any, res: any) => {
    const status = Array.from(processes.entries()).map(([id, proc]) => ({
      id,
      pid: proc.process.pid,
      startedAt: proc.startedAt,
      lastActivity: proc.lastActivity,
      alive: !proc.process.killed,
      pendingRequests: proc.pending.size,
    }));
    res.json({ processes: status });
  });

  // ── Health check for a specific process ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.get('/mcp/health/:id', (req: any, res: any) => {
    const { id } = req.params;
    const proc = processes.get(id);

    if (!proc) {
      return res.status(404).json({ alive: false, error: 'Not found' });
    }

    res.json({
      id,
      pid: proc.process.pid,
      alive: !proc.process.killed,
      startedAt: proc.startedAt,
      lastActivity: proc.lastActivity,
      uptimeMs: Date.now() - proc.startedAt,
    });
  });
}

// Cleanup on process exit
process.on('SIGTERM', () => {
  console.log('[MCP] Shutting down — killing all MCP processes');
  for (const id of processes.keys()) {
    killProcess(id);
  }
});

process.on('SIGINT', () => {
  for (const id of processes.keys()) {
    killProcess(id);
  }
});
