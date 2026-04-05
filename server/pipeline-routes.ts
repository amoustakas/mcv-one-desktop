// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExpressApp = any;
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');
const PLANS_DIR = path.join(CLAUDE_DIR, 'plans');

function scanProjectMemories() {
  const results: Array<{ project: string; files: Array<{ name: string; path: string; size: number; modified: string }> }> = [];
  if (!fs.existsSync(PROJECTS_DIR)) return results;
  for (const entry of fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.includes('worktrees')) continue;
    const memDir = path.join(PROJECTS_DIR, entry.name, 'memory');
    if (!fs.existsSync(memDir)) continue;
    const files = fs.readdirSync(memDir).filter(f => f.endsWith('.md')).map(f => {
      const stat = fs.statSync(path.join(memDir, f));
      return { name: f, path: path.join(memDir, f), size: stat.size, modified: stat.mtime.toISOString() };
    });
    results.push({ project: entry.name, files });
  }
  return results;
}

function scanPlans() {
  if (!fs.existsSync(PLANS_DIR)) return [];
  return fs.readdirSync(PLANS_DIR).filter(f => f.endsWith('.md')).map(f => {
    const stat = fs.statSync(path.join(PLANS_DIR, f));
    return { name: f, path: path.join(PLANS_DIR, f), size: stat.size, modified: stat.mtime.toISOString() };
  }).sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
}

function scanGitRepos(): Promise<Array<{ name: string; path: string; branch: string; lastCommit: string; commitCount7d: number; uncommittedChanges: number }>> {
  const repos = [
    path.join(os.homedir(), 'mcv-one-desktop'),
    path.join(os.homedir(), 'Documents', 'GitHub', 'Futurestate'),
    path.join(os.homedir(), 'Documents', 'GitHub', 'mcv-one-admin-prototype'),
    path.join(os.homedir(), 'Documents', 'GitHub', 'mcv'),
    path.join(os.homedir(), 'Documents', 'GitHub', 'Bet-Edge'),
  ];
  return Promise.all(repos.filter(r => fs.existsSync(path.join(r, '.git'))).map(repoPath =>
    new Promise<{ name: string; path: string; branch: string; lastCommit: string; commitCount7d: number; uncommittedChanges: number }>(resolve => {
      const name = path.basename(repoPath);
      execFile('git', ['-C', repoPath, 'branch', '--show-current'], { timeout: 5000 }, (_, branch) => {
        execFile('git', ['-C', repoPath, 'log', '-1', '--format=%aI'], { timeout: 5000 }, (_, lastCommit) => {
          execFile('git', ['-C', repoPath, 'rev-list', '--count', '--since=7 days ago', 'HEAD'], { timeout: 5000 }, (_, count7d) => {
            execFile('git', ['-C', repoPath, 'status', '--porcelain'], { timeout: 5000 }, (_, status) => {
              resolve({ name, path: repoPath, branch: (branch || '').trim(), lastCommit: (lastCommit || '').trim(), commitCount7d: parseInt((count7d || '0').trim()) || 0, uncommittedChanges: (status || '').split('\n').filter(Boolean).length });
            });
          });
        });
      });
    })
  ));
}

function countWorktrees(): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!fs.existsSync(PROJECTS_DIR)) return counts;
  for (const e of fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })) {
    if (!e.isDirectory() || !e.name.includes('worktrees')) continue;
    const base = e.name.split('--claude-worktrees')[0];
    counts[base] = (counts[base] || 0) + 1;
  }
  return counts;
}

export function registerPipelineRoutes(app: ExpressApp) {
  // Debug: simple sync test
  app.get('/local/pipe-test', (_req, res) => {
    res.json({ test: true, time: new Date().toISOString() });
  });

  app.get('/local/pipeline', async (_req, res) => {
    try {
      const [memories, plans, repos] = await Promise.all([
        Promise.resolve(scanProjectMemories()),
        Promise.resolve(scanPlans()),
        scanGitRepos(),
      ]);
      const worktrees = countWorktrees();
      const totalMemoryFiles = memories.reduce((sum, p) => sum + p.files.length, 0);
      const totalCommits7d = repos.reduce((sum, r) => sum + r.commitCount7d, 0);
      const totalUncommitted = repos.reduce((sum, r) => sum + r.uncommittedChanges, 0);
      const totalWorktrees = Object.values(worktrees).reduce((sum, n) => sum + n, 0);

      res.json({
        stats: { projects: memories.length, memoryFiles: totalMemoryFiles, plans: plans.length, repos: repos.length, commits7d: totalCommits7d, uncommittedChanges: totalUncommitted, worktreeSessions: totalWorktrees },
        memories, plans, repos, worktrees, scannedAt: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Scan failed' });
    }
  });

  app.get('/local/pipeline/read', (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: 'path required' });
    const resolved = path.resolve(filePath);
    if (!resolved.includes('.claude')) return res.status(403).json({ error: 'Can only read .claude files' });
    try {
      const content = fs.readFileSync(resolved, 'utf-8');
      const stat = fs.statSync(resolved);
      res.json({ path: resolved, content, size: stat.size, modified: stat.mtime.toISOString() });
    } catch { res.status(404).json({ error: 'File not found' }); }
  });

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
    if (!repoPath || !fs.existsSync(repoPath)) return res.status(404).json({ error: `Repo not found` });
    execFile('git', ['-C', repoPath, 'log', `--max-count=${limit}`, '--format=%H|%aI|%an|%s'], { timeout: 10000 }, (err, stdout) => {
      if (err) return res.status(500).json({ error: 'git log failed' });
      const commits = stdout.trim().split('\n').filter(Boolean).map(line => {
        const [sha, date, author, message] = line.split('|');
        return { sha, date, author, message };
      });
      res.json({ repo: repoName, commits });
    });
  });

  console.log('  [PIPELINE] Routes registered: /local/pipeline, /local/pipeline/read, /local/pipeline/git-log');
}
