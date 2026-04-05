/**
 * MCV One Desktop — Workflow Kit
 *
 * Agent tools for triggering and managing durable workflows.
 * Gives NAOS the ability to orchestrate deploys, Docker, and intelligence briefs.
 */

import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function postWorkflow(action: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch('/api/workflows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Workflow API error' }));
    throw new Error(err.error || `Workflow failed: ${res.status}`);
  }
  return res.json();
}

// ── Deploy a venture ──
const triggerDeploy: KitToolHandler = async (input, ctx) => {
  const { venture, environment = 'preview' } = input as { venture: string; environment?: string };
  if (!venture) return { success: false, data: null, displayMarkdown: 'Please specify a `venture` to deploy.' };

  const result = await postWorkflow('deploy', { venture, environment }, ctx);
  return {
    success: true,
    data: result,
    displayMarkdown: `## Deploy Workflow Started\n\n- **Venture:** ${venture}\n- **Environment:** ${environment}\n- **Run ID:** \`${result.runId}\`\n\n${environment === 'production' ? '⏳ Awaiting CEO approval before production deploy...' : 'Preview deployment in progress...'}`,
  };
};

// ── Start Docker infrastructure ──
const startInfra: KitToolHandler = async (input, ctx) => {
  const { project_dir, project_name } = input as { project_dir?: string; project_name?: string };
  const dir = project_dir || '.';
  const name = project_name || 'MCV Desktop';

  const result = await postWorkflow('docker-start', { projectDir: dir, projectName: name }, ctx);
  return {
    success: true,
    data: result,
    displayMarkdown: `## Infrastructure Start Workflow\n\n- **Project:** ${name}\n- **Directory:** ${dir}\n- **Run ID:** \`${result.runId}\`\n\nBringing up Docker services with health verification...`,
  };
};

// ── Stop Docker infrastructure ──
const stopInfra: KitToolHandler = async (input, ctx) => {
  const { project_dir, project_name } = input as { project_dir?: string; project_name?: string };
  const dir = project_dir || '.';
  const name = project_name || 'MCV Desktop';

  const result = await postWorkflow('docker-stop', { projectDir: dir, projectName: name }, ctx);
  return {
    success: true,
    data: result,
    displayMarkdown: `## Infrastructure Stop Workflow\n\n- **Project:** ${name}\n- **Run ID:** \`${result.runId}\`\n\nStopping all containers and verifying shutdown...`,
  };
};

// ── Docker health check ──
const infraHealth: KitToolHandler = async (_input, ctx) => {
  const result = await postWorkflow('docker-health', {}, ctx);
  return {
    success: true,
    data: result,
    displayMarkdown: `## Infrastructure Health Check\n\n- **Run ID:** \`${result.runId}\`\n\nRunning health check across all containers (CPU, memory, status)...`,
  };
};

// ── Generate morning brief ──
const morningBrief: KitToolHandler = async (_input, ctx) => {
  const result = await postWorkflow('morning-brief', {}, ctx);
  return {
    success: true,
    data: result,
    displayMarkdown: `## Morning Brief Generation\n\n- **Run ID:** \`${result.runId}\`\n\nGathering data from GitHub, Docker, memory hub, and plans to generate your daily intelligence brief...`,
  };
};

// ── Approve/reject HITL hook ──
const approveAction: KitToolHandler = async (input, _ctx) => {
  const { token, approved, comment } = input as { token: string; approved: boolean; comment?: string };
  if (!token) return { success: false, data: null, displayMarkdown: 'Please provide the HITL `token` to approve or reject.' };

  // Use direct fetch since this needs to go to the API
  const res = await fetch('/api/workflows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'resume-hook', token, data: { approved, comment } }),
  });
  const result = await res.json();

  return {
    success: true,
    data: result,
    displayMarkdown: approved
      ? `**Approved** — Hook \`${token}\` resumed. Workflow will continue execution.${comment ? `\n\nComment: ${comment}` : ''}`
      : `**Rejected** — Hook \`${token}\` resumed with rejection.${comment ? `\n\nReason: ${comment}` : ''}`,
  };
};

export const manifest: KitManifest = {
  id: 'workflow-ops',
  name: 'Workflow Operations',
  version: '1.0.0',
  description: 'Trigger and manage durable workflows — deploy pipelines, Docker orchestration, morning briefs, and HITL approvals.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: `Use these tools when the user asks to:
- Deploy a venture or project (use trigger_deploy)
- Start or stop Docker infrastructure (use start_infrastructure / stop_infrastructure)
- Check infrastructure health (use infra_health_check)
- Generate a morning brief or daily summary (use morning_brief)
- Approve or reject a pending action (use approve_action)

These tools trigger durable workflows that survive crashes and can pause for human approval.`,
  tools: [
    {
      name: 'trigger_deploy',
      description: 'Start a durable deploy pipeline for a venture. Includes pre-checks, HITL approval for production, and post-deploy verification.',
      input_schema: {
        type: 'object',
        properties: {
          venture: { type: 'string', description: 'Venture slug (e.g., mcv, futurestate, betedge)' },
          environment: { type: 'string', enum: ['preview', 'production'], description: 'Deploy target. Production requires CEO approval.' },
        },
        required: ['venture'],
      },
    },
    {
      name: 'start_infrastructure',
      description: 'Start Docker infrastructure for a project with health verification and auto-retry.',
      input_schema: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Human-readable project name' },
          project_dir: { type: 'string', description: 'Path to docker-compose.yml directory' },
        },
        required: [],
      },
    },
    {
      name: 'stop_infrastructure',
      description: 'Stop Docker infrastructure for a project and verify all containers are down.',
      input_schema: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Human-readable project name' },
          project_dir: { type: 'string', description: 'Path to docker-compose.yml directory' },
        },
        required: [],
      },
    },
    {
      name: 'infra_health_check',
      description: 'Run a health check across all Docker containers — checks status, CPU, and memory usage.',
      input_schema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'morning_brief',
      description: 'Generate the CEO morning intelligence brief — aggregates GitHub, Docker, memory, and plans data.',
      input_schema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'approve_action',
      description: 'Approve or reject a pending HITL (human-in-the-loop) action. Used when a workflow is waiting for CEO approval.',
      input_schema: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'The HITL hook token from the pending approval' },
          approved: { type: 'boolean', description: 'true to approve, false to reject' },
          comment: { type: 'string', description: 'Optional comment or reason' },
        },
        required: ['token', 'approved'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  trigger_deploy: triggerDeploy,
  start_infrastructure: startInfra,
  stop_infrastructure: stopInfra,
  infra_health_check: infraHealth,
  morning_brief: morningBrief,
  approve_action: approveAction,
};
