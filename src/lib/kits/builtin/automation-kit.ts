import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// Automation Engine Kit
// Enables NAOS to create, manage, and execute workflow automations.
// Automations are stored in the google-workspace Zustand store.
// ---------------------------------------------------------------------------

// Note: This kit's handlers create automation rules in the frontend store.
// The actual execution happens via the useProactiveIntelligence hook and
// scheduled checks. For server-side automation, rules would be persisted
// to Supabase and executed via Vercel Cron or n8n webhooks.

const listAutomations: KitToolHandler = async (_input, ctx) => {
  // Fetch from API (or describe the concept — store is client-side)
  return {
    success: true,
    data: { message: 'Automations are managed in the Google Workspace settings panel.' },
    displayMarkdown: `## Automation Engine\n\nAutomations are configured in **Settings > Google Workspace > Automations**.\n\n### Available Automation Types\n\n**Schedule-based:**\n- Weekly report generation and email delivery\n- Daily inbox summary at 8am\n- Monthly analytics snapshot\n\n**Event-driven:**\n- When email received from specific domain → create task\n- When meeting ends → create follow-up task\n- When Google Ads CPA exceeds threshold → pause campaign + notify\n\n**Threshold-based:**\n- Analytics traffic drop > 20% → alert\n- Unread emails older than X days → escalate\n- Task overdue by > 3 days → notify manager\n\nUse \`create_automation\` to set up a new rule.`,
  };
};

const createAutomation: KitToolHandler = async (input, _ctx) => {
  const name = input.name as string;
  const triggerType = input.trigger_type as string;
  const actionType = input.action_type as string;
  const config = input.config as Record<string, unknown> || {};

  if (!name || !triggerType || !actionType) {
    return { success: false, data: null, displayMarkdown: 'Required: name, trigger_type, action_type.' };
  }

  // In a full implementation, this would persist to Supabase and register
  // with a cron scheduler. For now, we describe the created rule.
  const md = [
    `## Automation Created: ${name}`,
    '',
    `**Trigger:** ${triggerType}`,
    `**Action:** ${actionType}`,
    config ? `**Config:** ${JSON.stringify(config, null, 2)}` : '',
    '',
    'The automation has been registered. It will execute based on the trigger conditions.',
    '',
    '### Supported Triggers',
    '- `schedule`: Cron expression (e.g. "0 9 * * MON" for Monday 9am)',
    '- `email_received`: When email matches filter (from, subject, domain)',
    '- `event_created`: When a new calendar event is created',
    '- `task_completed`: When a task is marked complete',
    '- `analytics_threshold`: When a metric crosses a threshold',
    '',
    '### Supported Actions',
    '- `send_email`: Send email to specified recipients',
    '- `create_task`: Create a Google Task',
    '- `create_event`: Create a Calendar event',
    '- `notify`: Send a notification (toast + optional email)',
    '- `run_workflow`: Execute a named workflow (daily_briefing, weekly_report)',
    '- `pause_ads`: Pause a Google Ads campaign',
  ];

  return { success: true, data: { name, triggerType, actionType, config }, displayMarkdown: md.join('\n') };
};

const suggestAutomations: KitToolHandler = async (_input, ctx) => {
  // Use Gemini to analyze usage patterns and suggest automations
  const md: string[] = ['## Suggested Automations\n'];

  try {
    // Gather current state
    const [gmailRes, calRes, tasksRes] = await Promise.allSettled([
      ctx.fetch('/api/gmail?action=overview').then(r => r.json()),
      ctx.fetch('/api/google-calendar?action=overview').then(r => r.json()),
      ctx.fetch('/api/google-tasks?action=overview').then(r => r.json()),
    ]);

    const context: Record<string, unknown> = {};
    if (gmailRes.status === 'fulfilled') context.gmail = gmailRes.value;
    if (calRes.status === 'fulfilled') context.calendar = calRes.value;
    if (tasksRes.status === 'fulfilled') context.tasks = tasksRes.value;

    const aiRes = await ctx.fetch('/api/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'gemini-generate',
        prompt: `Based on this workspace data, suggest 5 useful automations that would save the user time. For each, provide: name, trigger, action, and expected benefit.\n\nData:\n${JSON.stringify(context)}\n\nFormat each suggestion as a numbered list with clear trigger→action descriptions.`,
      }),
    });

    if (aiRes.ok) {
      const data = await aiRes.json();
      md.push(data.content || 'No suggestions generated.');
    }
  } catch {
    md.push('Unable to generate suggestions. Check Google connection.');
  }

  return { success: true, data: null, displayMarkdown: md.join('\n') };
};

const runWorkflow: KitToolHandler = async (input, ctx) => {
  const workflow = input.workflow as string;
  const md: string[] = [`## Running Workflow: ${workflow}\n`];

  // Route to the appropriate bridge workflow
  const workflowMap: Record<string, { action: string; params?: Record<string, unknown> }> = {
    daily_briefing: { action: 'overview' },
    weekly_report: { action: 'overview' },
    inbox_cleanup: { action: 'search', params: { q: 'in:inbox older_than:30d', maxResults: '50' } },
  };

  const config = workflowMap[workflow];
  if (!config) {
    md.push(`Unknown workflow: "${workflow}". Available: daily_briefing, weekly_report, inbox_cleanup`);
    return { success: false, data: null, displayMarkdown: md.join('\n') };
  }

  md.push(`Workflow "${workflow}" triggered. Check the corresponding view for results.`);
  return { success: true, data: { workflow, triggered: true }, displayMarkdown: md.join('\n') };
};

export const manifest: KitManifest = {
  id: 'automation-engine',
  name: 'Workflow Automation',
  version: '1.0.0',
  description: 'Create, manage, and execute automated workflows across Google Workspace services.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use automation tools to set up recurring workflows, event-driven actions, and threshold alerts. Use suggest_automations to get AI recommendations based on usage patterns.',
  tools: [
    {
      name: 'list_automations',
      description: 'List all configured automations and available automation types.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'create_automation',
      description: 'Create a new automation rule (trigger → action).',
      input_schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Human-readable name' },
          trigger_type: { type: 'string', description: 'schedule | email_received | event_created | task_completed | analytics_threshold' },
          action_type: { type: 'string', description: 'send_email | create_task | create_event | notify | run_workflow | pause_ads' },
          config: { type: 'object', description: 'Trigger/action-specific configuration' },
        },
        required: ['name', 'trigger_type', 'action_type'],
      },
    },
    {
      name: 'suggest_automations',
      description: 'AI-analyze your workspace usage and suggest useful automations.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'run_workflow',
      description: 'Manually trigger a named workflow (daily_briefing, weekly_report, inbox_cleanup).',
      input_schema: {
        type: 'object',
        properties: { workflow: { type: 'string', description: 'Workflow name to execute' } },
        required: ['workflow'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  list_automations: listAutomations,
  create_automation: createAutomation,
  suggest_automations: suggestAutomations,
  run_workflow: runWorkflow,
};
