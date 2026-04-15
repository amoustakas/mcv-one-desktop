import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// Local Server Kit — exposes filesystem + system capabilities
// ---------------------------------------------------------------------------
// Only functional when the local dev server is running (port 3100).
// Uses the /local proxy path configured in vite.config.ts.

async function localPost(path: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(`/local${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Local server error: ${res.status}`);
  return res.json();
}

async function localGet(path: string, ctx: KitExecutionContext) {
  const res = await ctx.fetch(`/local${path}`);
  if (!res.ok) throw new Error(`Local server error: ${res.status}`);
  return res.json();
}

const listFiles: KitToolHandler = async (input, ctx) => {
  const dirPath = (input.path as string) || '.';
  const showHidden = (input.show_hidden as boolean) || false;
  try {
    const data = await localPost('/ls', { path: dirPath, showHidden }, ctx);
    const items = data.items ?? [];
    if (items.length === 0) return { success: true, data, displayMarkdown: `Empty directory: \`${dirPath}\`` };
    const lines = items.map(
      (f: { name: string; isDirectory: boolean; size: number; extension: string }) =>
        `- ${f.isDirectory ? '📁' : '📄'} **${f.name}**${f.isDirectory ? '/' : ` (${f.extension || 'file'}, ${formatSize(f.size)})`}`,
    );
    return {
      success: true,
      data,
      displayMarkdown: `## ${dirPath}\n\n${lines.join('\n')}\n\n*${items.length} items*`,
    };
  } catch {
    return { success: false, error: 'Local server not running. Start with `npm run dev:local`.' };
  }
};

const readFile: KitToolHandler = async (input, ctx) => {
  const filePath = input.path as string;
  try {
    const data = await localPost('/read', { path: filePath }, ctx);
    const content = data.content ?? '';
    const preview = content.length > 2000 ? content.slice(0, 2000) + '\n\n*... truncated*' : content;
    return {
      success: true,
      data: { path: data.path, size: data.size, encoding: data.encoding },
      displayMarkdown: `## ${filePath}\n\n\`\`\`\n${preview}\n\`\`\`\n\n*${formatSize(data.size)}*`,
    };
  } catch {
    return { success: false, error: 'Local server not running or file not found.' };
  }
};

const writeFile: KitToolHandler = async (input, ctx) => {
  const filePath = input.path as string;
  const content = input.content as string;
  try {
    const data = await localPost('/write', { path: filePath, content }, ctx);
    return {
      success: true,
      data,
      displayMarkdown: `**File written:** \`${data.path}\` (${formatSize(data.size)})`,
    };
  } catch {
    return { success: false, error: 'Local server not running or write failed.' };
  }
};

const searchFiles: KitToolHandler = async (input, ctx) => {
  const searchPath = (input.path as string) || '.';
  const query = input.query as string;
  const extensions = input.extensions as string[] | undefined;
  try {
    const data = await localPost('/search', { path: searchPath, query, extensions }, ctx);
    const results = data.results ?? [];
    if (results.length === 0) return { success: true, data: [], displayMarkdown: `No files matching "${query}" in \`${searchPath}\`` };
    const lines = results.slice(0, 20).map(
      (f: { name: string; path: string; size: number }) =>
        `- **${f.name}** — \`${f.path}\` (${formatSize(f.size)})`,
    );
    return {
      success: true,
      data: results,
      displayMarkdown: `## Search: "${query}"\n\n${lines.join('\n')}\n\n*${data.total} results*`,
    };
  } catch {
    return { success: false, error: 'Local server not running.' };
  }
};

const systemInfo: KitToolHandler = async (_input, ctx) => {
  try {
    const health = await localGet('/health', ctx);
    const md = [
      `## Local System`,
      `- **Platform:** ${health.platform}`,
      `- **Hostname:** ${health.hostname}`,
      `- **User:** ${health.user}`,
      `- **CPUs:** ${health.cpus}`,
      `- **Memory:** ${formatSize(health.memory?.used)} / ${formatSize(health.memory?.total)}`,
      `- **Uptime:** ${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`,
    ].join('\n');
    return { success: true, data: health, displayMarkdown: md };
  } catch {
    return { success: false, error: 'Local server not running.' };
  }
};

const runCommand: KitToolHandler = async (input, ctx) => {
  const command = input.command as string;
  const args = (input.args as string[]) || [];
  const cwd = (input.cwd as string) || undefined;
  try {
    const data = await localPost('/exec', { command, args, cwd }, ctx);
    let md = `**\`${command} ${args.join(' ')}\`**\n\n`;
    if (data.stdout) md += `\`\`\`\n${data.stdout.slice(0, 3000)}\n\`\`\`\n`;
    if (data.stderr) md += `\n**stderr:**\n\`\`\`\n${data.stderr.slice(0, 1000)}\n\`\`\`\n`;
    md += `\nExit code: ${data.exitCode}`;
    return { success: data.exitCode === 0, data, displayMarkdown: md };
  } catch {
    return { success: false, error: 'Local server not running or command not allowed.' };
  }
};

function formatSize(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

export const manifest: KitManifest = {
  id: 'local-server',
  name: 'Local Server',
  version: '1.0.0',
  description: 'Access the local filesystem, search files, read/write content, get system info, and run safe commands. Requires the local dev server to be running.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks about local files, wants to browse the filesystem, read or write code files, search for files, or run shell commands. These only work when the local server is running (npm run dev:local).',
  tools: [
    {
      name: 'list_local_files',
      description: 'List files and directories at a given path on the local machine.',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path to list (default: current directory)' },
          show_hidden: { type: 'boolean', description: 'Include hidden files (default: false)' },
        },
      },
    },
    {
      name: 'read_local_file',
      description: 'Read the contents of a file on the local machine.',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute or relative file path' },
        },
        required: ['path'],
      },
    },
    {
      name: 'write_local_file',
      description: 'Write content to a file on the local machine. Creates the file if it does not exist.',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to write to' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'search_local_files',
      description: 'Search for files by name in a directory tree.',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Root directory to search from' },
          query: { type: 'string', description: 'Filename search query' },
          extensions: { type: 'array', items: { type: 'string' }, description: 'Filter by file extensions (e.g. ["ts", "tsx"])' },
        },
        required: ['query'],
      },
    },
    {
      name: 'local_system_info',
      description: 'Get local machine information: platform, hostname, CPU count, memory usage, uptime.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'run_local_command',
      description: 'Run a safe shell command on the local machine. Only allowed commands: git, npm, node, npx, tsc, etc.',
      input_schema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to run (e.g. "git", "npm", "node")' },
          args: { type: 'array', items: { type: 'string' }, description: 'Command arguments' },
          cwd: { type: 'string', description: 'Working directory (optional)' },
        },
        required: ['command'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  list_local_files: listFiles,
  read_local_file: readFile,
  write_local_file: writeFile,
  search_local_files: searchFiles,
  local_system_info: systemInfo,
  run_local_command: runCommand,
};
