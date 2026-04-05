import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// n8n Workflow Adapter Kit
// ---------------------------------------------------------------------------
// Turns every n8n workflow into an agent-callable tool.
// Supports: listing workflows, inspecting nodes, triggering execution,
// and checking execution results.

async function postJson(url: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

function timeAgo(dateStr: string | number): string {
  const ts = typeof dateStr === 'number' ? dateStr : new Date(dateStr).getTime();
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Tool Handlers
// ---------------------------------------------------------------------------

const listWorkflows: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/n8n-proxy', { action: 'list-workflows' }, ctx);
  const workflows = data.workflows ?? [];
  if (workflows.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No active n8n workflows found. Is N8N_API_KEY configured?' };
  }
  const lines = workflows.map(
    (w: { id: string; name: string; active: boolean; tags: string[]; updatedAt?: string }) => {
      const tags = w.tags.length > 0 ? ` [${w.tags.join(', ')}]` : '';
      const updated = w.updatedAt ? ` · ${timeAgo(w.updatedAt)}` : '';
      return `- **${w.name}** (\`${w.id}\`)${tags}${updated}`;
    },
  );
  return {
    success: true,
    data: workflows,
    displayMarkdown: `## n8n Workflows\n\n${lines.join('\n')}\n\n*${workflows.length} active workflows*`,
  };
};

const describeWorkflow: KitToolHandler = async (input, ctx) => {
  const workflowId = input.workflow_id as string;
  const data = await postJson('/api/n8n-proxy', { action: 'get-workflow', workflowId }, ctx);
  const nodes = data.nodes ?? [];

  let md = `## ${data.name || 'Workflow'}\n\n`;
  md += `**ID:** \`${data.id}\` · **Active:** ${data.active ? 'Yes' : 'No'} · **Nodes:** ${data.nodeCount}\n`;
  if (data.tags?.length) md += `**Tags:** ${data.tags.join(', ')}\n`;
  md += '\n### Node Pipeline\n\n';
  for (const node of nodes) {
    const type = (node.type as string).replace('n8n-nodes-base.', '');
    md += `- **${node.name}** (\`${type}\`)\n`;
  }

  return { success: true, data, displayMarkdown: md };
};

const runWorkflow: KitToolHandler = async (input, ctx) => {
  const workflowId = input.workflow_id as string;
  const inputData = (input.input_data as Record<string, unknown>) || {};
  const useWebhook = (input.use_webhook as boolean) || false;

  const action = useWebhook ? 'trigger-webhook' : 'execute-workflow';
  const data = await postJson('/api/n8n-proxy', {
    action,
    workflowId,
    inputData,
    webhookPath: input.webhook_path as string | undefined,
  }, ctx);

  if (data.executionId) {
    return {
      success: true,
      data,
      displayMarkdown: `**Workflow triggered.** Execution ID: \`${data.executionId}\`\nStatus: ${data.status || 'started'}`,
    };
  }

  return {
    success: true,
    data: data.data ?? data,
    displayMarkdown: `**Workflow completed.**\n\n\`\`\`json\n${JSON.stringify(data.data ?? data, null, 2).slice(0, 2000)}\n\`\`\``,
  };
};

const getExecution: KitToolHandler = async (input, ctx) => {
  const executionId = input.execution_id as string;
  const data = await postJson('/api/n8n-proxy', { action: 'get-execution', executionId }, ctx);

  const status = data.status === 'success' ? '`success`' : data.status === 'error' ? '`error`' : `\`${data.status}\``;
  let md = `## Execution \`${data.id}\`\n\n`;
  md += `**Status:** ${status}\n`;
  if (data.startedAt) md += `**Started:** ${timeAgo(data.startedAt)}\n`;
  if (data.stoppedAt) md += `**Finished:** ${timeAgo(data.stoppedAt)}\n`;
  if (data.data) {
    md += `\n**Result:**\n\`\`\`json\n${JSON.stringify(data.data, null, 2).slice(0, 2000)}\n\`\`\``;
  }

  return { success: true, data, displayMarkdown: md };
};

const listExecutions: KitToolHandler = async (input, ctx) => {
  const workflowId = (input.workflow_id as string) || undefined;
  const limit = (input.limit as number) || 10;
  const data = await postJson('/api/n8n-proxy', { action: 'list-executions', workflowId, limit }, ctx);
  const executions = data.executions ?? [];
  if (executions.length === 0) return { success: true, data: [], displayMarkdown: 'No recent executions found.' };

  const lines = executions.map(
    (e: { id: string; status: string; workflowId: string; startedAt: string }) => {
      const status = e.status === 'success' ? '`success`' : e.status === 'error' ? '`error`' : `\`${e.status}\``;
      return `- ${status} \`${e.id}\` — workflow \`${e.workflowId}\` · ${timeAgo(e.startedAt)}`;
    },
  );
  return {
    success: true,
    data: executions,
    displayMarkdown: `## Recent Executions\n\n${lines.join('\n')}`,
  };
};

// ---------------------------------------------------------------------------
// Manifest & Export
// ---------------------------------------------------------------------------

export const manifest: KitManifest = {
  id: 'n8n-workflows',
  name: 'n8n Workflow Automation',
  version: '1.0.0',
  description: 'List, inspect, trigger, and monitor n8n workflows. Turns every n8n automation into an agent-callable tool — access 400+ integrations through workflow orchestration.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: [
    'Use these tools when the user asks about automations, workflows, n8n, or wants to trigger an automated process.',
    'Use list_n8n_workflows to discover available automations.',
    'Use describe_n8n_workflow to understand what a workflow does before running it.',
    'Use run_n8n_workflow to trigger a workflow — prefer execute mode over webhook unless the user specifies webhook.',
    'Use get_n8n_execution to check the status and result of a triggered workflow.',
    'Use list_n8n_executions to see recent workflow run history.',
  ].join(' '),
  tools: [
    {
      name: 'list_n8n_workflows',
      description: 'List all active n8n workflows available for automation.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'describe_n8n_workflow',
      description: 'Get details of an n8n workflow including its node pipeline, to understand what it does before running it.',
      input_schema: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string', description: 'The n8n workflow ID' },
        },
        required: ['workflow_id'],
      },
    },
    {
      name: 'run_n8n_workflow',
      description: 'Trigger an n8n workflow execution. Can pass input data and optionally use a webhook trigger.',
      input_schema: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string', description: 'The n8n workflow ID to run' },
          input_data: { type: 'object', description: 'Input data to pass to the workflow trigger. Use describe_n8n_workflow first to understand the expected input shape.' },
          use_webhook: { type: 'boolean', description: 'Use webhook trigger instead of execution API (default: false)' },
          webhook_path: { type: 'string', description: 'Custom webhook path (if different from /webhook/{id})' },
        },
        required: ['workflow_id'],
      },
    },
    {
      name: 'get_n8n_execution',
      description: 'Check the status and result of an n8n workflow execution.',
      input_schema: {
        type: 'object',
        properties: {
          execution_id: { type: 'string', description: 'The execution ID to check' },
        },
        required: ['execution_id'],
      },
    },
    {
      name: 'list_n8n_executions',
      description: 'List recent n8n workflow executions with their status.',
      input_schema: {
        type: 'object',
        properties: {
          workflow_id: { type: 'string', description: 'Filter by workflow ID (optional)' },
          limit: { type: 'number', description: 'Number of executions to return (default: 10, max: 50)' },
        },
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  list_n8n_workflows: listWorkflows,
  describe_n8n_workflow: describeWorkflow,
  run_n8n_workflow: runWorkflow,
  get_n8n_execution: getExecution,
  list_n8n_executions: listExecutions,
};
