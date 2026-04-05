import { requireAuth } from "./auth-middleware";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// n8n Workflow Proxy
// ---------------------------------------------------------------------------
// Proxies requests to n8n's REST API and webhook endpoints.
// n8n credentials never reach the client — injected server-side.

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.mcv.one';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

async function n8nFetch(path: string, options: RequestInit = {}) {
  const url = `${N8N_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(N8N_API_KEY ? { 'X-N8N-API-KEY': N8N_API_KEY } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`n8n API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!N8N_API_KEY) {
    return res.status(500).json({ error: 'N8N_API_KEY not configured' });
  }

  const action = req.body?.action;

  try {
    switch (action) {
      // List all active workflows
      case 'list-workflows': {
        const data = await n8nFetch('/api/v1/workflows?active=true');
        const workflows = (data.data ?? data ?? []).map(
          (w: { id: string; name: string; active: boolean; tags?: Array<{ name: string }>; createdAt?: string; updatedAt?: string }) => ({
            id: w.id,
            name: w.name,
            active: w.active,
            tags: w.tags?.map((t) => t.name) ?? [],
            updatedAt: w.updatedAt,
          }),
        );
        return res.json({ workflows });
      }

      // Get workflow details (nodes, connections)
      case 'get-workflow': {
        const workflowId = req.body.workflowId as string;
        if (!workflowId) return res.status(400).json({ error: 'workflowId required' });

        const data = await n8nFetch(`/api/v1/workflows/${workflowId}`);
        const nodes = (data.nodes ?? []).map(
          (n: { type: string; name: string; parameters?: Record<string, unknown> }) => ({
            type: n.type,
            name: n.name,
            // Omit sensitive parameters
          }),
        );
        return res.json({
          id: data.id,
          name: data.name,
          active: data.active,
          nodes,
          nodeCount: nodes.length,
          tags: data.tags?.map((t: { name: string }) => t.name) ?? [],
        });
      }

      // Trigger a workflow via its webhook
      case 'trigger-webhook': {
        const { workflowId, webhookPath, inputData } = req.body;
        if (!workflowId && !webhookPath) {
          return res.status(400).json({ error: 'workflowId or webhookPath required' });
        }

        // Webhook path: either explicit or convention-based
        const path = webhookPath || `/webhook/${workflowId}`;
        const data = await n8nFetch(path, {
          method: 'POST',
          body: JSON.stringify(inputData || {}),
        });

        return res.json({ success: true, data });
      }

      // Trigger a workflow via the execution API (production mode)
      case 'execute-workflow': {
        const { workflowId, inputData } = req.body;
        if (!workflowId) return res.status(400).json({ error: 'workflowId required' });

        const data = await n8nFetch(`/api/v1/workflows/${workflowId}/execute`, {
          method: 'POST',
          body: JSON.stringify({ data: inputData || {} }),
        });

        return res.json({
          success: true,
          executionId: data.data?.id || data.id,
          status: data.data?.status || data.status,
          data: data.data?.data || data,
        });
      }

      // Get execution status/result
      case 'get-execution': {
        const executionId = req.body.executionId as string;
        if (!executionId) return res.status(400).json({ error: 'executionId required' });

        const data = await n8nFetch(`/api/v1/executions/${executionId}`);
        return res.json({
          id: data.id,
          status: data.status || (data.finished ? 'success' : 'running'),
          finished: data.finished,
          startedAt: data.startedAt,
          stoppedAt: data.stoppedAt,
          data: data.data?.resultData?.lastNodeExecutionResult ?? null,
        });
      }

      // List recent executions
      case 'list-executions': {
        const workflowId = req.body.workflowId as string;
        const limit = Math.min(Number(req.body.limit) || 10, 50);

        let path = `/api/v1/executions?limit=${limit}&status=success,error,waiting`;
        if (workflowId) path += `&workflowId=${workflowId}`;

        const data = await n8nFetch(path);
        const executions = (data.data ?? data ?? []).map(
          (e: { id: string; status: string; finished: boolean; workflowId: string; startedAt: string; stoppedAt?: string }) => ({
            id: e.id,
            status: e.status || (e.finished ? 'success' : 'running'),
            workflowId: e.workflowId,
            startedAt: e.startedAt,
            stoppedAt: e.stoppedAt,
          }),
        );
        return res.json({ executions });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
