import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function fetchLocal(path: string, ctx: KitExecutionContext, options?: RequestInit) {
  const res = await ctx.fetch(path, options);
  if (!res.ok) throw new Error(`Docker API error: ${res.status}`);
  return res.json();
}

// ── List containers ──
const listContainers: KitToolHandler = async (_input, ctx) => {
  const data = await fetchLocal('/local/docker/containers', ctx);
  if (!data.available) {
    return { success: false, data: null, displayMarkdown: '**Docker Desktop is not running.** Start Docker Desktop and try again.' };
  }
  const { containers, summary } = data;
  if (containers.length === 0) {
    return { success: true, data: { summary }, displayMarkdown: 'No Docker containers found. Run `docker compose up -d` to start services.' };
  }
  const lines = containers.map((c: { name: string; state: string; image: string; status: string; ports: string; venture: string | null }) => {
    const stateIcon = c.state === 'running' ? '`running`' : c.state === 'exited' ? '`stopped`' : `\`${c.state}\``;
    const venture = c.venture ? ` [${c.venture}]` : '';
    return `- ${stateIcon} **${c.name}**${venture} — ${c.image} · ${c.status}${c.ports ? ` · ${c.ports}` : ''}`;
  });
  const header = `## Docker Containers\n\n**${summary.running}** running · **${summary.stopped}** stopped · **${summary.total}** total\n`;
  return { success: true, data: { containers, summary }, displayMarkdown: `${header}\n${lines.join('\n')}` };
};

// ── Container stats (CPU/memory) ──
const containerStats: KitToolHandler = async (_input, ctx) => {
  const data = await fetchLocal('/local/docker/stats', ctx);
  const { stats } = data;
  if (!stats || stats.length === 0) {
    return { success: true, data: { stats: [] }, displayMarkdown: 'No running containers to show stats for.' };
  }
  const lines = stats.map((s: { name: string; cpuPercent: string; memUsage: string; memPercent: string; netIO: string; pids: string }) =>
    `| ${s.name} | ${s.cpuPercent} | ${s.memUsage} (${s.memPercent}) | ${s.netIO} | ${s.pids} |`
  );
  const table = `## Container Stats\n\n| Container | CPU | Memory | Network I/O | PIDs |\n|-----------|-----|--------|-------------|------|\n${lines.join('\n')}`;
  return { success: true, data: { stats }, displayMarkdown: table };
};

// ── Container logs ──
const containerLogs: KitToolHandler = async (input, ctx) => {
  const containerId = (input as { container_id?: string }).container_id;
  if (!containerId) return { success: false, data: null, displayMarkdown: 'Please provide a `container_id` parameter.' };
  const data = await fetchLocal(`/local/docker/logs/${containerId}?tail=50`, ctx);
  const preview = (data.logs as string).split('\n').slice(-30).join('\n');
  return { success: true, data: { containerId, lines: data.lines }, displayMarkdown: `## Logs: ${containerId}\n\n\`\`\`\n${preview}\n\`\`\`\n\n*Showing last 30 of ${data.lines} lines*` };
};

// ── Container action ──
const manageContainer: KitToolHandler = async (input, ctx) => {
  const { container_id, action } = input as { container_id?: string; action?: string };
  if (!container_id || !action) return { success: false, data: null, displayMarkdown: 'Provide `container_id` and `action` (start/stop/restart/pause/unpause).' };
  await fetchLocal('/local/docker/action', ctx, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ containerId: container_id, action }),
  });
  return { success: true, data: { container_id, action }, displayMarkdown: `Container **${container_id}** → \`${action}\` executed successfully.` };
};

// ── List images ──
const listImages: KitToolHandler = async (_input, ctx) => {
  const data = await fetchLocal('/local/docker/images', ctx);
  const { images } = data;
  if (images.length === 0) return { success: true, data: { images: [] }, displayMarkdown: 'No Docker images found locally.' };
  const lines = images.map((img: { repository: string; tag: string; size: string; id: string }) =>
    `- **${img.repository}**:${img.tag} — ${img.size} (${img.id})`
  );
  return { success: true, data: { images }, displayMarkdown: `## Docker Images\n\n${lines.join('\n')}` };
};

// ── Docker compose control ──
const composeControl: KitToolHandler = async (input, ctx) => {
  const { action, project_dir } = input as { action?: string; project_dir?: string };
  if (!action) return { success: false, data: null, displayMarkdown: 'Provide `action` (up/down/ps/logs/restart) and optional `project_dir`.' };
  const data = await fetchLocal('/local/docker/compose', ctx, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, cwd: project_dir }),
  });
  return { success: true, data, displayMarkdown: `## Compose: \`${action}\`\n\n\`\`\`\n${(data.output as string).slice(0, 2000)}\n\`\`\`` };
};

export const manifest: KitManifest = {
  id: 'docker-ops',
  name: 'Docker Operations',
  version: '1.0.0',
  description: 'Monitor and manage Docker containers, images, and compose stacks across the MCV ecosystem.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks about Docker containers, infrastructure, running services, container health, or compose operations. The docker_containers tool is the best starting point to see what\'s running.',
  tools: [
    {
      name: 'docker_containers',
      description: 'List all Docker containers (running and stopped) across all ventures with status, ports, and venture mapping.',
      input_schema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'docker_stats',
      description: 'Get live CPU, memory, network, and PID stats for all running containers.',
      input_schema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'docker_logs',
      description: 'Get recent logs from a specific container.',
      input_schema: {
        type: 'object',
        properties: { container_id: { type: 'string', description: 'Container ID or name' } },
        required: ['container_id'],
      },
    },
    {
      name: 'docker_manage',
      description: 'Start, stop, restart, pause, or unpause a container.',
      input_schema: {
        type: 'object',
        properties: {
          container_id: { type: 'string', description: 'Container ID or name' },
          action: { type: 'string', enum: ['start', 'stop', 'restart', 'pause', 'unpause'], description: 'Action to perform' },
        },
        required: ['container_id', 'action'],
      },
    },
    {
      name: 'docker_images',
      description: 'List all Docker images stored locally.',
      input_schema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'docker_compose',
      description: 'Run a docker compose action (up/down/ps/logs/restart) in a project directory.',
      input_schema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['up', 'down', 'ps', 'logs', 'restart'], description: 'Compose action' },
          project_dir: { type: 'string', description: 'Path to the project containing docker-compose.yml. Defaults to current directory.' },
        },
        required: ['action'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  docker_containers: listContainers,
  docker_stats: containerStats,
  docker_logs: containerLogs,
  docker_manage: manageContainer,
  docker_images: listImages,
  docker_compose: composeControl,
};
