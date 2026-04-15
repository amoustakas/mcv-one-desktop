import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function msApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/microsoft-graph?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Teams error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/microsoft-graph', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Teams error'); }
  return r.json();
}

const listTeams: KitToolHandler = async (_i, ctx) => {
  const d = await msApi('list-teams', {}, ctx);
  const teams = d.value ?? [];
  const lines = teams.map((t: { displayName: string; id: string; description: string }) => `- **${t.displayName}** — ${t.description || 'no description'}`);
  return { success: true, data: teams, displayMarkdown: `## My Teams (${teams.length})\n\n${lines.join('\n')}` };
};

const listChannels: KitToolHandler = async (input, ctx) => {
  const d = await msApi('list-channels', { teamId: input.teamId }, ctx);
  const channels = d.value ?? [];
  const lines = channels.map((c: { displayName: string; id: string; membershipType: string }) => `- **${c.displayName}** (${c.membershipType})`);
  return { success: true, data: channels, displayMarkdown: `## Channels (${channels.length})\n\n${lines.join('\n')}` };
};

const channelMessages: KitToolHandler = async (input, ctx) => {
  const d = await msApi('channel-messages', { teamId: input.teamId, channelId: input.channelId, top: input.limit }, ctx);
  const msgs = d.value ?? [];
  const lines = msgs.map((m: { from: { user: { displayName: string } }; body: { content: string }; createdDateTime: string }) =>
    `- **${m.from?.user?.displayName || '?'}**: ${(m.body?.content || '').replace(/<[^>]*>/g, '').slice(0, 100)}`);
  return { success: true, data: msgs, displayMarkdown: `## Messages (${msgs.length})\n\n${lines.join('\n')}` };
};

const sendChannelMessage: KitToolHandler = async (input, ctx) => {
  const d = await msApi('send-channel-message', { teamId: input.teamId, channelId: input.channelId, content: input.content }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Message sent to channel: "${(input.content as string).slice(0, 80)}"` };
};

const listChats: KitToolHandler = async (_i, ctx) => {
  const d = await msApi('list-chats', {}, ctx);
  const chats = d.value ?? [];
  const lines = chats.map((c: { topic: string; chatType: string; lastUpdatedDateTime: string }) =>
    `- **${c.topic || 'Untitled'}** (${c.chatType}) — ${new Date(c.lastUpdatedDateTime).toLocaleDateString()}`);
  return { success: true, data: chats, displayMarkdown: `## Chats (${chats.length})\n\n${lines.join('\n')}` };
};

const sendChatMessage: KitToolHandler = async (input, ctx) => {
  const d = await msApi('send-chat-message', { chatId: input.chatId, content: input.content }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Chat message sent: "${(input.content as string).slice(0, 80)}"` };
};

const getPresence: KitToolHandler = async (_i, ctx) => {
  const d = await msApi('my-presence', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Presence: **${d.availability}** — ${d.activity || 'idle'}` };
};

const createMeeting: KitToolHandler = async (input, ctx) => {
  const d = await msApi('create-online-meeting', { subject: input.subject, startDateTime: input.start, endDateTime: input.end, participants: input.participants }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Meeting created: **${input.subject}**\nJoin: ${d.joinWebUrl || d.joinUrl || 'N/A'}` };
};

export const manifest: KitManifest = {
  id: 'microsoft-teams', name: 'Microsoft Teams', version: '1.0.0',
  description: 'Microsoft Teams — teams, channels, messages, chats, meetings, presence status, and collaboration.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use teams tools for Microsoft Teams: list teams/channels, send messages, manage chats, create meetings, check presence.',
  tools: [
    { name: 'teams_list', description: 'List joined Teams.', input_schema: { type: 'object', properties: {} } },
    { name: 'teams_channels', description: 'List channels in a team.', input_schema: { type: 'object', properties: { teamId: { type: 'string' } }, required: ['teamId'] } },
    { name: 'teams_messages', description: 'Get channel messages.', input_schema: { type: 'object', properties: { teamId: { type: 'string' }, channelId: { type: 'string' }, limit: { type: 'number' } }, required: ['teamId', 'channelId'] } },
    { name: 'teams_send_channel', description: 'Send a message to a Teams channel.', input_schema: { type: 'object', properties: { teamId: { type: 'string' }, channelId: { type: 'string' }, content: { type: 'string' } }, required: ['teamId', 'channelId', 'content'] } },
    { name: 'teams_chats', description: 'List 1:1 and group chats.', input_schema: { type: 'object', properties: {} } },
    { name: 'teams_send_chat', description: 'Send a chat message.', input_schema: { type: 'object', properties: { chatId: { type: 'string' }, content: { type: 'string' } }, required: ['chatId', 'content'] } },
    { name: 'teams_presence', description: 'Get your current Teams presence status.', input_schema: { type: 'object', properties: {} } },
    { name: 'teams_create_meeting', description: 'Create a Teams online meeting.', input_schema: { type: 'object', properties: { subject: { type: 'string' }, start: { type: 'string', description: 'ISO datetime' }, end: { type: 'string' }, participants: { type: 'array', description: 'Array of email addresses' } }, required: ['subject', 'start', 'end'] } },
  ],
};
export const handlers: Record<string, KitToolHandler> = {
  teams_list: listTeams, teams_channels: listChannels, teams_messages: channelMessages,
  teams_send_channel: sendChannelMessage, teams_chats: listChats, teams_send_chat: sendChatMessage,
  teams_presence: getPresence, teams_create_meeting: createMeeting,
};
