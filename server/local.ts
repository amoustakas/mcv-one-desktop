/**
 * MCV One Desktop — Local Server
 *
 * Runs alongside the Vite dev server to provide local machine capabilities:
 * - Filesystem browsing, read/write
 * - File watching (chokidar)
 * - Safe local command execution
 * - Machine info
 *
 * Start: npm run dev:local (runs both Vite + this server)
 * Port: 3100 (avoids conflicts with venture dev servers on 3000-3009)
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import chokidar from 'chokidar';

const app = express();
const PORT = 3100;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));

// ── Health ──
app.get('/local/health', (_req, res) => {
  res.json({
    status: 'online',
    platform: process.platform,
    hostname: os.hostname(),
    uptime: os.uptime(),
    memory: {
      total: Math.round(os.totalmem() / 1e9 * 10) / 10,
      free: Math.round(os.freemem() / 1e9 * 10) / 10,
      used: Math.round((os.totalmem() - os.freemem()) / 1e9 * 10) / 10,
    },
    cpus: os.cpus().length,
    user: os.userInfo().username,
    home: os.homedir(),
    version: process.version,
  });
});

// ── Drives / Root directories ──
app.get('/local/drives', (_req, res) => {
  if (process.platform === 'win32') {
    execFile('wmic', ['logicaldisk', 'get', 'caption,freespace,size,volumename', '/format:csv'], (err, stdout) => {
      if (err) return res.json({ drives: [] });
      const lines = stdout.trim().split('\n').filter(l => l.includes(','));
      const drives = lines.slice(1).map(line => {
        const parts = line.split(',');
        return {
          letter: (parts[1] || '').trim(),
          free: Math.round(parseInt(parts[2] || '0') / 1e9 * 10) / 10,
          total: Math.round(parseInt(parts[3] || '0') / 1e9 * 10) / 10,
          name: (parts[4] || '').trim(),
        };
      }).filter(d => d.letter);
      res.json({ drives });
    });
  } else {
    res.json({ drives: [{ letter: '/', free: 0, total: 0, name: 'Root' }] });
  }
});

// ── List directory ──
app.post('/local/ls', (req, res) => {
  const dirPath = req.body.path;
  if (!dirPath) return res.status(400).json({ error: 'path required' });

  try {
    const resolved = path.resolve(dirPath);
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'Path not found' });

    const stat = fs.statSync(resolved);
    if (!stat.isDirectory()) return res.status(400).json({ error: 'Not a directory' });

    const entries = fs.readdirSync(resolved, { withFileTypes: true });
    const items = entries
      .filter(e => !e.name.startsWith('.') || req.body.showHidden)
      .map(e => {
        try {
          const fullPath = path.join(resolved, e.name);
          const s = fs.statSync(fullPath);
          return {
            name: e.name,
            path: fullPath,
            isDirectory: e.isDirectory(),
            size: e.isFile() ? s.size : 0,
            modified: s.mtime.toISOString(),
            extension: e.isFile() ? path.extname(e.name).toLowerCase() : '',
          };
        } catch {
          return { name: e.name, path: path.join(resolved, e.name), isDirectory: e.isDirectory(), size: 0, modified: '', extension: '' };
        }
      })
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    res.json({ path: resolved, items, parent: path.dirname(resolved) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── Read file ──
app.post('/local/read', (req, res) => {
  const filePath = req.body.path;
  if (!filePath) return res.status(400).json({ error: 'path required' });

  try {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'File not found' });

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) return res.status(400).json({ error: 'Path is a directory' });

    if (stat.size > 10 * 1024 * 1024) {
      return res.json({ path: resolved, size: stat.size, tooLarge: true });
    }

    const ext = path.extname(resolved).toLowerCase();
    const textExts = ['.txt', '.md', '.json', '.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.yaml', '.yml', '.toml', '.env', '.sql', '.py', '.rs', '.go', '.sh', '.bat', '.csv', '.xml', '.svg', '.log', '.conf', '.cfg', '.ini'];

    if (textExts.includes(ext) || !ext) {
      const content = fs.readFileSync(resolved, 'utf-8');
      return res.json({ path: resolved, content, size: stat.size, encoding: 'utf-8', modified: stat.mtime.toISOString() });
    }

    const content = fs.readFileSync(resolved).toString('base64');
    return res.json({ path: resolved, content, size: stat.size, encoding: 'base64', modified: stat.mtime.toISOString() });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── Write file ──
app.post('/local/write', (req, res) => {
  const { path: filePath, content, encoding } = req.body;
  if (!filePath || content === undefined) return res.status(400).json({ error: 'path and content required' });

  try {
    const resolved = path.resolve(filePath);
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (encoding === 'base64') {
      fs.writeFileSync(resolved, Buffer.from(content, 'base64'));
    } else {
      fs.writeFileSync(resolved, content, 'utf-8');
    }

    const stat = fs.statSync(resolved);
    res.json({ success: true, path: resolved, size: stat.size });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── Delete file/directory ──
app.post('/local/delete', (req, res) => {
  const filePath = req.body.path;
  if (!filePath) return res.status(400).json({ error: 'path required' });

  try {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'Not found' });

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      fs.rmSync(resolved, { recursive: true });
    } else {
      fs.unlinkSync(resolved);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── Create directory ──
app.post('/local/mkdir', (req, res) => {
  const dirPath = req.body.path;
  if (!dirPath) return res.status(400).json({ error: 'path required' });

  try {
    fs.mkdirSync(path.resolve(dirPath), { recursive: true });
    res.json({ success: true, path: path.resolve(dirPath) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// ── Search files ──
app.post('/local/search', (req, res) => {
  const { path: searchPath, query, extensions, maxResults = 50 } = req.body;
  if (!searchPath || !query) return res.status(400).json({ error: 'path and query required' });

  const results: { name: string; path: string; size: number; modified: string }[] = [];
  const queryLower = query.toLowerCase();
  const extFilter = extensions ? extensions.map((e: string) => e.toLowerCase()) : null;

  function walk(dir: string, depth: number) {
    if (depth > 5 || results.length >= maxResults) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (results.length >= maxResults) break;
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.git') continue;

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath, depth + 1);
        } else if (entry.name.toLowerCase().includes(queryLower)) {
          if (extFilter && !extFilter.includes(path.extname(entry.name).toLowerCase())) continue;
          try {
            const s = fs.statSync(fullPath);
            results.push({ name: entry.name, path: fullPath, size: s.size, modified: s.mtime.toISOString() });
          } catch { /* skip */ }
        }
      }
    } catch { /* skip inaccessible dirs */ }
  }

  walk(path.resolve(searchPath), 0);
  res.json({ results, total: results.length });
});

// ── Watch directory ──
const watchers: Map<string, { watcher: chokidar.FSWatcher; events: { type: string; path: string; time: string }[] }> = new Map();

app.post('/local/watch', (req, res) => {
  const watchPath = req.body.path;
  if (!watchPath) return res.status(400).json({ error: 'path required' });

  const resolved = path.resolve(watchPath);
  if (watchers.has(resolved)) {
    return res.json({ watching: true, events: watchers.get(resolved)!.events.slice(-20) });
  }

  const events: { type: string; path: string; time: string }[] = [];
  const watcher = chokidar.watch(resolved, { ignoreInitial: true, depth: 2, ignored: /(node_modules|\.git)/ });

  watcher.on('add', p => events.push({ type: 'add', path: p, time: new Date().toISOString() }));
  watcher.on('change', p => events.push({ type: 'change', path: p, time: new Date().toISOString() }));
  watcher.on('unlink', p => events.push({ type: 'delete', path: p, time: new Date().toISOString() }));

  watchers.set(resolved, { watcher, events });
  setTimeout(() => { watcher.close(); watchers.delete(resolved); }, 600000);

  res.json({ watching: true, path: resolved });
});

app.post('/local/watch-events', (req, res) => {
  const resolved = path.resolve(req.body.path || '');
  const w = watchers.get(resolved);
  if (!w) return res.json({ events: [] });
  res.json({ events: w.events.slice(-50) });
});

// ── System info ──
app.get('/local/system', (_req, res) => {
  res.json({
    platform: process.platform,
    arch: os.arch(),
    hostname: os.hostname(),
    cpus: os.cpus().map(c => ({ model: c.model, speed: c.speed })),
    memory: { total: os.totalmem(), free: os.freemem() },
    uptime: os.uptime(),
    user: os.userInfo().username,
    home: os.homedir(),
    tmpdir: os.tmpdir(),
    nodeVersion: process.version,
    pid: process.pid,
  });
});

// ── Safe command execution (execFile — no shell injection) ──
app.post('/local/exec', (req, res) => {
  const { command, args, cwd } = req.body;
  if (!command) return res.status(400).json({ error: 'command required' });

  // Safety: only allow specific executables
  const allowed = ['git', 'npm', 'node', 'npx', 'ls', 'dir', 'cat', 'echo', 'pwd', 'whoami', 'hostname', 'where', 'which'];
  const cmd = path.basename(command);
  if (!allowed.includes(cmd)) {
    return res.status(403).json({ error: `Command "${cmd}" not allowed. Permitted: ${allowed.join(', ')}` });
  }

  execFile(command, args || [], { cwd: cwd || process.cwd(), timeout: 30000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
    res.json({
      exitCode: err ? (err as NodeJS.ErrnoException).code || 1 : 0,
      stdout: stdout.slice(0, 50000),
      stderr: stderr.slice(0, 10000),
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// Pipeline — Claude Code Sessions, Git Repos, Memory, Plans
// ═══════════════════════════════════════════════════════════════════

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');
const PLANS_DIR = path.join(CLAUDE_DIR, 'plans');

/** Scan all Claude Code project memory directories */
function scanProjectMemories(): Array<{ project: string; files: Array<{ name: string; path: string; size: number; modified: string }> }> {
  const results: Array<{ project: string; files: Array<{ name: string; path: string; size: number; modified: string }> }> = [];
  if (!fs.existsSync(PROJECTS_DIR)) return results;

  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    // Skip worktree-specific dirs, focus on main project dirs
    if (entry.name.includes('worktrees')) continue;

    const memDir = path.join(PROJECTS_DIR, entry.name, 'memory');
    if (!fs.existsSync(memDir)) continue;

    const files: Array<{ name: string; path: string; size: number; modified: string }> = [];
    const memFiles = fs.readdirSync(memDir).filter(f => f.endsWith('.md'));
    for (const f of memFiles) {
      const stat = fs.statSync(path.join(memDir, f));
      files.push({ name: f, path: path.join(memDir, f), size: stat.size, modified: stat.mtime.toISOString() });
    }
    results.push({ project: entry.name, files });
  }
  return results;
}

/** Scan all Claude Code plans */
function scanPlans(): Array<{ name: string; path: string; size: number; modified: string }> {
  if (!fs.existsSync(PLANS_DIR)) return [];
  return fs.readdirSync(PLANS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const stat = fs.statSync(path.join(PLANS_DIR, f));
      return { name: f, path: path.join(PLANS_DIR, f), size: stat.size, modified: stat.mtime.toISOString() };
    })
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
}

/** Scan git repos for recent activity */
function scanGitRepos(): Promise<Array<{
  name: string; path: string; branch: string; lastCommit: string;
  commitCount7d: number; uncommittedChanges: number;
}>> {
  const repos = [
    path.join(os.homedir(), 'mcv-one-desktop'),
    path.join(os.homedir(), 'Documents', 'GitHub', 'Futurestate'),
    path.join(os.homedir(), 'Documents', 'GitHub', 'mcv-one-admin-prototype'),
    path.join(os.homedir(), 'Documents', 'GitHub', 'mcv'),
    path.join(os.homedir(), 'Documents', 'GitHub', 'Bet-Edge'),
  ];

  return Promise.all(repos.filter(r => fs.existsSync(path.join(r, '.git'))).map(repoPath => {
    return new Promise<{
      name: string; path: string; branch: string; lastCommit: string;
      commitCount7d: number; uncommittedChanges: number;
    }>((resolve) => {
      const name = path.basename(repoPath);
      // Get branch
      execFile('git', ['-C', repoPath, 'branch', '--show-current'], { timeout: 5000 }, (_, branch) => {
        // Get last commit time
        execFile('git', ['-C', repoPath, 'log', '-1', '--format=%aI'], { timeout: 5000 }, (_, lastCommit) => {
          // Get 7-day commit count
          execFile('git', ['-C', repoPath, 'rev-list', '--count', '--since=7 days ago', 'HEAD'], { timeout: 5000 }, (_, count7d) => {
            // Get uncommitted change count
            execFile('git', ['-C', repoPath, 'status', '--porcelain'], { timeout: 5000 }, (_, status) => {
              resolve({
                name,
                path: repoPath,
                branch: (branch || '').trim(),
                lastCommit: (lastCommit || '').trim(),
                commitCount7d: parseInt((count7d || '0').trim()) || 0,
                uncommittedChanges: (status || '').split('\n').filter(Boolean).length,
              });
            });
          });
        });
      });
    });
  }));
}

/** Count worktree sessions per project */
function countWorktreeSessions(): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!fs.existsSync(PROJECTS_DIR)) return counts;

  const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.includes('worktrees')) continue;
    // Extract base project name
    const baseName = entry.name.split('--claude-worktrees')[0];
    counts[baseName] = (counts[baseName] || 0) + 1;
  }
  return counts;
}

// ── Pipeline: Full scan ──
app.get('/local/pipeline', async (_req, res) => {
  try {
    const [memories, plans, repos] = await Promise.all([
      Promise.resolve(scanProjectMemories()),
      Promise.resolve(scanPlans()),
      scanGitRepos(),
    ]);
    const worktrees = countWorktreeSessions();

    // Aggregate stats
    const totalMemoryFiles = memories.reduce((sum, p) => sum + p.files.length, 0);
    const totalCommits7d = repos.reduce((sum, r) => sum + r.commitCount7d, 0);
    const totalUncommitted = repos.reduce((sum, r) => sum + r.uncommittedChanges, 0);
    const totalWorktrees = Object.values(worktrees).reduce((sum, n) => sum + n, 0);

    res.json({
      stats: {
        projects: memories.length,
        memoryFiles: totalMemoryFiles,
        plans: plans.length,
        repos: repos.length,
        commits7d: totalCommits7d,
        uncommittedChanges: totalUncommitted,
        worktreeSessions: totalWorktrees,
      },
      memories,
      plans,
      repos,
      worktrees,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Scan failed' });
  }
});

// ── Pipeline: Read a memory/plan file ──
app.get('/local/pipeline/read', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: 'path required' });

  // Security: only allow reading from .claude directory
  const resolved = path.resolve(filePath);
  if (!resolved.includes('.claude')) {
    return res.status(403).json({ error: 'Can only read .claude files' });
  }

  try {
    const content = fs.readFileSync(resolved, 'utf-8');
    const stat = fs.statSync(resolved);
    res.json({
      path: resolved,
      content,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

// ── Pipeline: Git log for a specific repo ──
app.get('/local/pipeline/git-log', (req, res) => {
  const repoName = req.query.repo as string;
  const limit = parseInt(req.query.limit as string) || 20;

  const repoPaths: Record<string, string> = {
    'mcv-one-desktop': path.join(os.homedir(), 'mcv-one-desktop'),
    'Futurestate': path.join(os.homedir(), 'Documents', 'GitHub', 'Futurestate'),
    'mcv-one-admin-prototype': path.join(os.homedir(), 'Documents', 'GitHub', 'mcv-one-admin-prototype'),
    'mcv': path.join(os.homedir(), 'Documents', 'GitHub', 'mcv'),
    'Bet-Edge': path.join(os.homedir(), 'Documents', 'GitHub', 'Bet-Edge'),
  };

  const repoPath = repoPaths[repoName];
  if (!repoPath || !fs.existsSync(repoPath)) {
    return res.status(404).json({ error: `Repo "${repoName}" not found` });
  }

  execFile('git', ['-C', repoPath, 'log', `--max-count=${limit}`, '--format=%H|%aI|%an|%s'], { timeout: 10000 }, (err, stdout) => {
    if (err) return res.status(500).json({ error: 'git log failed' });
    const commits = stdout.trim().split('\n').filter(Boolean).map(line => {
      const [sha, date, author, message] = line.split('|');
      return { sha, date, author, message };
    });
    res.json({ repo: repoName, commits });
  });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n  🖥️  MCV Local Server running on http://localhost:${PORT}`);
  console.log(`  📂 Filesystem access enabled`);
  console.log(`  👤 User: ${os.userInfo().username}`);
  console.log(`  💻 ${os.cpus().length} CPUs | ${Math.round(os.totalmem() / 1e9)}GB RAM`);
  console.log(`  📡 Endpoints: /local/health, /local/drives, /local/ls, /local/read, /local/write, /local/search, /local/exec`);
  console.log(`  🔗 Pipeline:  /local/pipeline, /local/pipeline/read, /local/pipeline/git-log\n`);
});
