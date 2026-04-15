import type { KitManifest, KitToolHandler } from '../types';
import { runAutonomousAgent, AGENT_PROFILES, type AgentProfile } from '@mcv/kits-sdk/autonomous-agent';
import { getSharedBuiltinKits } from '@mcv/kits-sdk/loader';

// ---------------------------------------------------------------------------
// NAOS Agent Kit
// Exposes the autonomous agent framework as kit tools.
// When called, Gemini autonomously executes multi-step workflows
// using ALL loaded kit tools via function calling.
// ---------------------------------------------------------------------------

const executeAgent: KitToolHandler = async (input, ctx) => {
  const task = input.task as string;
  const profile = (input.profile as AgentProfile) || 'chief-of-staff';
  const maxRounds = (input.max_rounds as number) || 10;

  if (!task) return { success: false, error: 'task is required', displayMarkdown: 'Please provide a task description.' };

  const profileConfig = AGENT_PROFILES[profile] || AGENT_PROFILES['chief-of-staff'];
  const kits = getSharedBuiltinKits();

  const md: string[] = [`## NAOS Agent: ${profile}\n`, `*Task: "${task}"*\n`, '---\n'];

  try {
    const result = await runAutonomousAgent(task, kits, ctx, {
      systemPrompt: profileConfig.systemPrompt,
      model: profileConfig.model,
      temperature: profileConfig.temperature,
      maxRounds,
      onStep: (step) => {
        // Steps are collected in the result
      },
    });

    // Build response
    if (result.toolsUsed.length > 0) {
      md.push(`### Tools Used (${result.toolsUsed.length} calls across ${result.rounds} rounds)\n`);
      for (const tool of result.toolsUsed) {
        const status = tool.result.success ? '+' : '-';
        md.push(`${status} **${tool.name}**${tool.result.error ? ` — ${tool.result.error}` : ''}`);
      }
      md.push('');
    }

    md.push('### Agent Response\n');
    md.push(result.response);
    md.push(`\n\n---\n*Completed in ${(result.totalDurationMs / 1000).toFixed(1)}s · ${result.rounds} round${result.rounds !== 1 ? 's' : ''} · ${result.toolsUsed.length} tool calls*`);

    return {
      success: true,
      data: {
        response: result.response,
        toolsUsed: result.toolsUsed.map(t => ({ name: t.name, success: t.result.success })),
        rounds: result.rounds,
        durationMs: result.totalDurationMs,
      },
      displayMarkdown: md.join('\n'),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Agent execution failed',
      displayMarkdown: `Agent failed: ${err instanceof Error ? err.message : 'unknown error'}`,
    };
  }
};

const listAgentProfiles: KitToolHandler = async () => {
  const profiles = Object.entries(AGENT_PROFILES).map(([id, config]) => ({
    id,
    ...config,
  }));

  const md = [
    '## NAOS Agent Profiles\n',
    ...profiles.map(p =>
      `### ${p.id}\n- **Model:** ${p.model}\n- **Temperature:** ${p.temperature}\n- **Role:** ${p.systemPrompt.split('.')[0]}.\n`,
    ),
    '---\n',
    'Use `naos_execute_agent` with a `profile` parameter to run a specific agent.',
  ];

  return { success: true, data: profiles, displayMarkdown: md.join('\n') };
};

const quickAgent: KitToolHandler = async (input, ctx) => {
  const task = input.task as string;
  if (!task) return { success: false, error: 'task required' };

  // Auto-detect the best profile based on task keywords
  const taskLower = task.toLowerCase();
  let profile: AgentProfile = 'chief-of-staff';

  if (taskLower.includes('research') || taskLower.includes('analyze') || taskLower.includes('investigate')) {
    profile = 'research-analyst';
  } else if (taskLower.includes('email') || taskLower.includes('draft') || taskLower.includes('respond') || taskLower.includes('send')) {
    profile = 'communications-manager';
  } else if (taskLower.includes('growth') || taskLower.includes('analytics') || taskLower.includes('ads') || taskLower.includes('traffic') || taskLower.includes('campaign')) {
    profile = 'growth-strategist';
  } else if (taskLower.includes('venture') || taskLower.includes('betedge') || taskLower.includes('futurestate') || taskLower.includes('warforge')) {
    profile = 'venture-operator';
  }

  // Delegate to the main executor
  return executeAgent({ task, profile }, ctx);
};

export const manifest: KitManifest = {
  id: 'naos-autonomous-agent',
  name: 'NAOS Autonomous Agent',
  version: '1.0.0',
  description: 'Autonomous AI agent that can execute multi-step workflows using ALL loaded kit tools via Gemini function calling.',
  author: 'MCV',
  capabilities: ['network', 'llm', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: `NAOS autonomous agent can execute complex, multi-step tasks by chaining tools together. Use naos_agent for specific profiles, or naos_quick_agent to auto-detect the best approach. The agent will autonomously decide which tools to call and in what order.

Available profiles: chief-of-staff, research-analyst, communications-manager, growth-strategist, venture-operator.

Examples:
- "Prepare for my next meeting" → chief-of-staff checks calendar, searches email + drive
- "Analyze our Google Ads performance and suggest optimizations" → growth-strategist pulls ads data + analytics
- "Draft replies to all investor emails from this week" → communications-manager searches + drafts`,
  tools: [
    {
      name: 'naos_agent',
      description: 'Execute an autonomous multi-step workflow with a specific agent profile. The agent will use ALL available tools (Gmail, Calendar, Drive, Tasks, Analytics, Ads, etc.) to complete the task.',
      input_schema: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'What you want the agent to accomplish' },
          profile: { type: 'string', description: 'Agent profile: chief-of-staff | research-analyst | communications-manager | growth-strategist | venture-operator' },
          max_rounds: { type: 'number', description: 'Maximum tool-calling rounds (default: 10)' },
        },
        required: ['task'],
      },
    },
    {
      name: 'naos_quick_agent',
      description: 'Auto-detect the best agent profile and execute. Just describe what you need.',
      input_schema: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'What you want done — the agent auto-selects the best profile' },
        },
        required: ['task'],
      },
    },
    {
      name: 'naos_list_profiles',
      description: 'List all available NAOS agent profiles with their capabilities.',
      input_schema: { type: 'object', properties: {} },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  naos_agent: executeAgent,
  naos_quick_agent: quickAgent,
  naos_list_profiles: listAgentProfiles,
};
