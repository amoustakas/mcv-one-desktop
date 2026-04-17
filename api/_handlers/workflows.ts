/**
 * MCV One Desktop — Workflow API
 *
 * Triggers and manages durable workflows:
 * - Start workflows (deploy, docker, morning brief, NAOS agent)
 * - Resume HITL hooks (approve/reject pending actions)
 * - Query workflow run status
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { start, getRun, resumeHook } from 'workflow/api';
import { deployPipelineWorkflow } from '../../workflows/deploy-pipeline';
import { startInfraWorkflow, stopInfraWorkflow, infraHealthCheckWorkflow } from '../../workflows/docker-orchestration';
import { morningBriefWorkflow } from '../../workflows/morning-brief';

import { requestLogger } from '../../src/lib/server/logger';
async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
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
