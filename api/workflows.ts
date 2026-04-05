/**
 * MCV One Desktop — Workflow API
 *
 * Triggers and manages durable workflows:
 * - Start workflows (deploy, docker, morning brief, NAOS agent)
 * - Resume HITL hooks (approve/reject pending actions)
 * - Query workflow run status
 */

import { requireAuth } from './_auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { start, getRun, resumeHook } from 'workflow/api';
import { deployPipelineWorkflow } from '../workflows/deploy-pipeline';
import { startInfraWorkflow, stopInfraWorkflow, infraHealthCheckWorkflow } from '../workflows/docker-orchestration';
import { morningBriefWorkflow } from '../workflows/morning-brief';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const action = req.query.action as string || req.body?.action;

  try {
    switch (req.method) {
      case 'POST': {
        switch (action) {
          // ── Start Deploy Pipeline ──
          case 'deploy': {
            const { venture, environment = 'preview' } = req.body;
            if (!venture) return res.status(400).json({ error: 'venture required' });
            const run = await start(deployPipelineWorkflow, [venture, environment]);
            return res.json({ runId: run.runId, workflow: 'deploy-pipeline', venture, environment });
          }

          // ── Start Docker Infrastructure ──
          case 'docker-start': {
            const { projectDir, projectName } = req.body;
            if (!projectDir || !projectName) return res.status(400).json({ error: 'projectDir and projectName required' });
            const run = await start(startInfraWorkflow, [projectDir, projectName]);
            return res.json({ runId: run.runId, workflow: 'start-infra', projectName });
          }

          // ── Stop Docker Infrastructure ──
          case 'docker-stop': {
            const { projectDir: stopDir, projectName: stopName } = req.body;
            if (!stopDir || !stopName) return res.status(400).json({ error: 'projectDir and projectName required' });
            const run = await start(stopInfraWorkflow, [stopDir, stopName]);
            return res.json({ runId: run.runId, workflow: 'stop-infra', projectName: stopName });
          }

          // ── Docker Health Check ──
          case 'docker-health': {
            const run = await start(infraHealthCheckWorkflow);
            return res.json({ runId: run.runId, workflow: 'infra-health-check' });
          }

          // ── Morning Brief ──
          case 'morning-brief': {
            const run = await start(morningBriefWorkflow);
            return res.json({ runId: run.runId, workflow: 'morning-brief' });
          }

          // ── Resume HITL Hook (approve/reject) ──
          case 'resume-hook': {
            const { token, data } = req.body;
            if (!token) return res.status(400).json({ error: 'token required' });
            await resumeHook(token, data || {});
            return res.json({ success: true, token, resumed: true });
          }

          default:
            return res.status(400).json({ error: `Unknown action: ${action}. Available: deploy, docker-start, docker-stop, docker-health, morning-brief, resume-hook` });
        }
      }

      case 'GET': {
        // ── Query run status ──
        const runId = req.query.runId as string;
        if (!runId) return res.status(400).json({ error: 'runId required for GET' });

        const run = getRun(runId);
        const result = await run.returnValue;
        return res.json({ runId, result });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Workflow error';
    return res.status(500).json({ error: message });
  }
}
