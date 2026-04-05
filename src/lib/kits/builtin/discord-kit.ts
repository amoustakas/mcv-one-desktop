import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function discordApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'POST') {
  if (method === 'GET') {
    const query = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])) }).toString();
    const res = await ctx.fetch(`/api/discord?${query}`);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Discord ${res.status}`); }
    return res.json();
  }
  const res = await ctx.fetch('/api/discord', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Discord ${res.status}`); }
  return res.json();
}

const myGuilds: KitToolHandler = async (_input, ctx) => {
  const guilds = await discordApi('my-guilds', {}, ctx, 'GET');
  const lines = (Array.isArray(guilds) ? guilds : []).slice(0, 20).map((g: { name: string; id: string; owner: boolean }) =>
    `- **${g.name}** (\`${g.id}\`)${g.owner ? ' 👑 Owner' : ''}`);
  return { success: true, data: guilds, displayMarkdown: `## My Servers (${lines.length})\n\n${lines.join('\n')}` };
};

const listChannels: KitToolHandler = async (input, ctx) => {
  const channels = await discordApi('list-guild-channels', { guildId: input.guildId }, ctx, 'GET');
  const textChannels = (Array.isArray(channels) ? channels : []).filter((c: { type: number }) => c.type === 0 || c.type === 2);
  const lines = textChannels.map((c: { name: string; id: string; type: number }) =>
    `- ${c.type === 2 ? '🔊' : '#'}**${c.name}** (\`${c.id}\`)`);
  return { success: true, data: textChannels, displayMarkdown: `## Channels (${textChannels.length})\n\n${lines.join('\n')}` };
};

const listMembers: KitToolHandler = async (input, ctx) => {
  const members = await discordApi('list-guild-members', { guildId: input.guildId, limit: input.limit ?? '25' }, ctx, 'GET');
  const list = Array.isArray(members) ? members : [];
  const lines = list.map((m: { user: { username: string; id: string }; nick: string | null; roles: string[] }) =>
    `- **${m.nick || m.user?.username}** (\`${m.user?.id}\`) — ${m.roles?.length || 0} roles`);
  return { success: true, data: list, displayMarkdown: `## Members (${list.length})\n\n${lines.join('\n')}` };
};

const listMessages: KitToolHandler = async (input, ctx) => {
  const messages = await discordApi('list-messages', { channelId: input.channelId, limit: input.limit ?? '20' }, ctx, 'GET');
  const list = Array.isArray(messages) ? messages : [];
  const lines = list.map((m: { author: { username: string }; content: string; timestamp: string }) =>
    `- **${m.author?.username}**: ${(m.content || '').slice(0, 100)} — ${new Date(m.timestamp).toLocaleString()}`);
  return { success: true, data: list, displayMarkdown: `## Messages (${list.length})\n\n${lines.join('\n')}` };
};

const sendMessage: KitToolHandler = async (input, ctx) => {
  const data = await discordApi('send-message', { channelId: input.channelId, content: input.content }, ctx);
  return { success: true, data, displayMarkdown: `Message sent to channel \`${input.channelId}\`: "${input.content}"` };
};

const listRoles: KitToolHandler = async (input, ctx) => {
  const roles = await discordApi('list-guild-roles', { guildId: input.guildId }, ctx, 'GET');
  const list = Array.isArray(roles) ? roles : [];
  const lines = list.filter((r: { name: string }) => r.name !== '@everyone').map((r: { name: string; id: string; color: number; position: number }) =>
    `- **${r.name}** (\`${r.id}\`) — position ${r.position}`);
  return { success: true, data: list, displayMarkdown: `## Roles (${lines.length})\n\n${lines.join('\n')}` };
};

const discordOverview: KitToolHandler = async (_input, ctx) => {
  const data = await discordApi('overview', {}, ctx, 'GET');
  const guilds = data.guilds ?? [];
  const lines = guilds.map((g: { name: string; member_count: number }) =>
    `- **${g.name}** (${g.member_count ?? '?'} members)`);
  return { success: true, data, displayMarkdown: `## Discord Overview\n\n**Servers:** ${data.total_guilds}\n\n${lines.join('\n')}` };
};

export const manifest: KitManifest = {
  id: 'discord-community',
  name: 'Discord Community',
  version: '1.0.0',
  description: 'Discord community management — servers, channels, messages, members, roles, and moderation.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use discord tools for community server management, sending messages, member lists, role management, and server overview.',
  tools: [
    { name: 'discord_my_guilds', description: 'List Discord servers you belong to.', input_schema: { type: 'object', properties: {} } },
    { name: 'discord_list_channels', description: 'List channels in a Discord server.', input_schema: { type: 'object', properties: { guildId: { type: 'string', description: 'Server ID' } }, required: ['guildId'] } },
    { name: 'discord_list_members', description: 'List members in a Discord server.', input_schema: { type: 'object', properties: { guildId: { type: 'string' }, limit: { type: 'string' } }, required: ['guildId'] } },
    { name: 'discord_list_messages', description: 'Get recent messages from a channel.', input_schema: { type: 'object', properties: { channelId: { type: 'string' }, limit: { type: 'string' } }, required: ['channelId'] } },
    { name: 'discord_send_message', description: 'Send a message to a Discord channel.', input_schema: { type: 'object', properties: { channelId: { type: 'string' }, content: { type: 'string' } }, required: ['channelId', 'content'] } },
    { name: 'discord_list_roles', description: 'List roles in a Discord server.', input_schema: { type: 'object', properties: { guildId: { type: 'string' } }, required: ['guildId'] } },
    { name: 'discord_overview', description: 'Get Discord account overview: servers, member counts.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  discord_my_guilds: myGuilds,
  discord_list_channels: listChannels,
  discord_list_members: listMembers,
  discord_list_messages: listMessages,
  discord_send_message: sendMessage,
  discord_list_roles: listRoles,
  discord_overview: discordOverview,
};
