import { requireAuth } from './_auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_USER = 'amoustakas';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const N8N_BASE_URL = process.env.N8N_BASE_URL || '';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

const REPOS = ['mcv-one-desktop', 'mcv-one', 'Futurestate', 'Bet-Edge', 'mcv-one-admin-prototype'];

interface PipelineEntry {
  id: string;
  source: string;
  name: string;
  description: string;
  status: string;
  metadata: Record<string, unknown>;
  startedAt: string;
  lastActivity: string;
  ventureId: string | null;
}

// ── GitHub: Actions runs + open PRs ──
async function fetchGitHub(): Promise<PipelineEntry[]> {
  if (!GITHUB_TOKEN) return [];
  const entries: PipelineEntry[] = [];
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Fetch recent workflow runs (in_progress + queued)
  const runsPromises = REPOS.map(async (repo) => {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_USER}/${repo}/actions/runs?status=in_progress&per_page=5`,
        { headers }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.workflow_runs || []).map((run: Record<string, unknown>) => ({
        id: `gh-run-${run.id}`,
        source: 'github' as const,
        name: `${repo}: ${run.name}`,
        description: `Branch: ${run.head_branch} — ${run.event}`,
        status: run.status === 'in_progress' ? 'active' : run.status === 'queued' ? 'idle' : 'completed',
        metadata: { runId: run.id, repo, branch: run.head_branch, url: run.html_url, event: run.event, conclusion: run.conclusion },
        startedAt: run.run_started_at as string || run.created_at as string,
        lastActivity: run.updated_at as string,
        ventureId: mapRepoToVenture(repo),
      }));
    } catch { return []; }
  });

  // Fetch open PRs across repos
  const prPromises = REPOS.map(async (repo) => {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_USER}/${repo}/pulls?state=open&per_page=5`,
        { headers }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data || []).map((pr: Record<string, unknown>) => ({
        id: `gh-pr-${pr.id}`,
        source: 'github' as const,
        name: `PR #${pr.number}: ${pr.title}`,
        description: `${repo} — ${(pr.head as Record<string, string>)?.ref || 'unknown'}`,
        status: pr.draft ? 'idle' : 'active',
        metadata: { prNumber: pr.number, repo, branch: (pr.head as Record<string, string>)?.ref, url: pr.html_url, author: (pr.user as Record<string, string>)?.login },
        startedAt: pr.created_at as string,
        lastActivity: pr.updated_at as string,
        ventureId: mapRepoToVenture(repo),
      }));
    } catch { return []; }
  });

  const [runsResults, prResults] = await Promise.all([
    Promise.all(runsPromises),
    Promise.all(prPromises),
  ]);
  entries.push(...runsResults.flat(), ...prResults.flat());
  return entries;
}

// ── Vercel: Active deployments ──
async function fetchVercel(): Promise<PipelineEntry[]> {
  if (!VERCEL_TOKEN) return [];
  try {
    const res = await fetch('https://api.vercel.com/v6/deployments?limit=10&state=BUILDING,READY,QUEUED', {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.deployments || []).map((d: Record<string, unknown>) => ({
      id: `vercel-${d.uid}`,
      source: 'vercel' as const,
      name: d.name as string || 'deployment',
      description: `${d.state} — ${(d.meta as Record<string, string>)?.githubCommitRef || 'main'}`,
      status: d.state === 'BUILDING' ? 'active' : d.state === 'READY' ? 'completed' : d.state === 'ERROR' ? 'error' : 'idle',
      metadata: { deploymentId: d.uid, url: d.url ? `https://${d.url}` : '', state: d.state, branch: (d.meta as Record<string, string>)?.githubCommitRef },
      startedAt: new Date(d.createdAt as number).toISOString(),
      lastActivity: new Date(d.createdAt as number).toISOString(),
      ventureId: mapProjectToVenture(d.name as string),
    }));
  } catch { return []; }
}

// ── n8n: Running executions ──
async function fetchN8n(): Promise<PipelineEntry[]> {
  if (!N8N_BASE_URL || !N8N_API_KEY) return [];
  try {
    const res = await fetch(`${N8N_BASE_URL}/api/v1/executions?status=running&limit=10`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((exec: Record<string, unknown>) => ({
      id: `n8n-${exec.id}`,
      source: 'n8n' as const,
      name: (exec.workflowData as Record<string, string>)?.name || `Workflow ${exec.workflowId}`,
      description: `Mode: ${exec.mode} — started ${exec.startedAt}`,
      status: exec.status === 'running' ? 'active' : exec.status === 'success' ? 'completed' : exec.status === 'error' ? 'error' : 'idle',
      metadata: { executionId: exec.id, workflowId: exec.workflowId, mode: exec.mode },
      startedAt: exec.startedAt as string,
      lastActivity: exec.stoppedAt as string || exec.startedAt as string,
      ventureId: null,
    }));
  } catch { return []; }
}

function mapRepoToVenture(repo: string): string | null {
  const map: Record<string, string> = {
    'mcv-one-desktop': 'mcv',
    'mcv-one': 'mcv',
    'Futurestate': 'futurestate',
    'Bet-Edge': 'betedge',
    'mcv-one-admin-prototype': 'mcv',
  };
  return map[repo] || null;
}

function mapProjectToVenture(name: string): string | null {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes('futurestate')) return 'futurestate';
  if (n.includes('betedge') || n.includes('bet-edge')) return 'betedge';
  if (n.includes('warforge')) return 'warforge';
  if (n.includes('mcv')) return 'mcv';
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Fetch all sources in parallel
    const [github, vercel, n8n] = await Promise.all([
      fetchGitHub(),
      fetchVercel(),
      fetchN8n(),
    ]);

    const entries = [...github, ...vercel, ...n8n];

    // Build summary
    const bySources: Record<string, number> = {};
    let errors = 0;
    for (const e of entries) {
      bySources[e.source] = (bySources[e.source] || 0) + 1;
      if (e.status === 'error') errors++;
    }

    const summary = {
      totalActive: entries.filter((e) => e.status === 'active').length,
      bySources,
      errors,
      lastUpdated: new Date().toISOString(),
    };

    return res.json({ entries, summary });
  } catch (err) {
    return res.status(500).json({ error: 'Pipeline aggregation failed', details: String(err) });
  }
}
