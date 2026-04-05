/* ═══════════════════════════════════════════ */
/* MCV ONE — Live Pipeline System Types       */
/* ═══════════════════════════════════════════ */

export type PipelineSource =
  | 'claude-session'
  | 'terminal'
  | 'docker'
  | 'github'
  | 'vercel'
  | 'n8n'
  | 'supabase';

export type PipelineStatus = 'active' | 'idle' | 'error' | 'completed';

export interface PipelineEntry {
  id: string;
  source: PipelineSource;
  name: string;
  description: string;
  status: PipelineStatus;
  metadata: Record<string, unknown>;
  startedAt: string;
  lastActivity: string;
  ventureId: string | null;
}

/** Claude Code session metadata (parsed from .claude session files) */
export interface ClaudeSessionMeta {
  sessionId: string;
  pid: number;
  cwd: string;
  startedAt: string;
  entrypoint: string;
  model?: string;
}

/** Docker container info */
export interface DockerContainerMeta {
  containerId: string;
  image: string;
  status: string;
  ports: string;
  names: string;
  created: string;
}

/** GitHub Actions run info */
export interface GitHubActionMeta {
  runId: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  repo: string;
  url: string;
  startedAt: string;
}

/** Vercel deployment info */
export interface VercelDeploymentMeta {
  deploymentId: string;
  name: string;
  state: string;
  url: string;
  branch: string;
  createdAt: string;
}

/** n8n workflow execution info */
export interface N8nExecutionMeta {
  executionId: string;
  workflowName: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  mode: string;
}

export interface PipelineSummary {
  totalActive: number;
  bySources: Record<PipelineSource, number>;
  errors: number;
  lastUpdated: string;
}

export interface PipelineFilter {
  source?: PipelineSource;
  status?: PipelineStatus;
  ventureId?: string;
}
