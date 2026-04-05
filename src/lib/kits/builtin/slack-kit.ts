import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function slackApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'POST') {
  const res = await ctx.fetch('/api/slack', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Slack ${res.status}`); }
  return res.json();
}

const listChannels: KitToolHandler = async (input, ctx) => {
  const data = await slackApi('list-channels', { limit: input.limit ?? 50 }, ctx);
  const channels = data.channels ?? [];
  const lines = channels.map((c: { name: string; id: string; num_members: number; topic: { value: string } }) =>
    `- **#${c.name}** (${c.num_members} members) — ${c.topic?.value || 'no topic'}`);
  return { success: true, data: channels, displayMarkdown: `## Slack Channels (${channels.length})\n\n${lines.join('\n')}` };
};

const sendMessage: KitToolHandler = async (input, ctx) => {
  const data = await slackApi('send-message', { channel: input.channel, text: input.text, thread_ts: input.thread_ts }, ctx);
  return { success: true, data, displayMarkdown: `Message sent to <#${input.channel}>: "${input.text}"` };
};

const channelHistory: KitToolHandler = async (input, ctx) => {
  const data = await slackApi('channel-history', { channel: input.channel, limit: input.limit ?? 10 }, ctx);
  const msgs = data.messages ?? [];
  const lines = msgs.map((m: { text: string; user: string; ts: string }) =>
    `- <@${m.user}>: ${(m.text || '').slice(0, 100)}`);
  return { success: true, data: msgs, displayMarkdown: `## Recent Messages (${msgs.length})\n\n${lines.join('\n')}` };
};

const listUsers: KitToolHandler = async (input, ctx) => {
  const data = await slackApi('list-users', { limit: input.limit ?? 50 }, ctx);
  const members = (data.members ?? []).filter((m: { deleted: boolean; is_bot: boolean }) => !m.deleted && !m.is_bot);
  const lines = members.map((m: { real_name: string; name: string; profile: { title: string } }) =>
    `- **${m.real_name || m.name}** — ${m.profile?.title || 'no title'}`);
  return { success: true, data: members, displayMarkdown: `## Team Members (${members.length})\n\n${lines.join('\n')}` };
};

const searchMessages: KitToolHandler = async (input, ctx) => {
  const data = await slackApi('search-messages', { query: input.query, count: input.limit ?? 10 }, ctx);
  const matches = data.messages?.matches ?? [];
  const lines = matches.map((m: { text: string; channel: { name: string }; username: string }) =>
    `- **#${m.channel?.name}** @${m.username}: ${(m.text || '').slice(0, 100)}`);
  return { success: true, data: matches, displayMarkdown: `## Search: "${input.query}" (${matches.length} results)\n\n${lines.join('\n')}` };
};

const slackOverview: KitToolHandler = async (_input, ctx) => {
  const data = await slackApi('overview', {}, ctx);
  return { success: true, data, displayMarkdown: `## Slack Overview\n\n- **Team:** ${data.team}\n- **User:** ${data.user}\n- **Channels:** ${data.channels}\n- **Members:** ${data.members}` };
};

const editMessage: KitToolHandler = async (input, ctx) => {
  const d = await slackApi('update-message', { channel: input.channel, ts: input.ts, text: input.text }, ctx);
  return { success: true, data: d, displayMarkdown: `Message updated in <#${input.channel}> at ${input.ts}` };
};

const deleteMessage: KitToolHandler = async (input, ctx) => {
  const d = await slackApi('delete-message', { channel: input.channel, ts: input.ts }, ctx);
  return { success: true, data: d, displayMarkdown: `Message deleted in <#${input.channel}> at ${input.ts}` };
};

const createChannel: KitToolHandler = async (input, ctx) => {
  const d = await slackApi('create-channel', { name: input.name, is_private: input.isPrivate ?? false }, ctx);
  return { success: true, data: d, displayMarkdown: `Channel created: **#${input.name}**${input.isPrivate ? ' (private)' : ''}` };
};

const archiveChannel: KitToolHandler = async (input, ctx) => {
  const d = await slackApi('archive-channel', { channel: input.channel }, ctx);
  return { success: true, data: d, displayMarkdown: `Channel <#${input.channel}> archived.` };
};

const setTopic: KitToolHandler = async (input, ctx) => {
  const d = await slackApi('set-channel-topic', { channel: input.channel, topic: input.topic }, ctx);
  return { success: true, data: d, displayMarkdown: `Topic set for <#${input.channel}>: "${input.topic}"` };
};

const addReaction: KitToolHandler = async (input, ctx) => {
  const d = await slackApi('add-reaction', { channel: input.channel, timestamp: input.timestamp, name: input.name }, ctx);
  return { success: true, data: d, displayMarkdown: `Reaction :${input.name}: added in <#${input.channel}>` };
};

const threadReplies: KitToolHandler = async (input, ctx) => {
  const d = await slackApi('get-thread-replies', { channel: input.channel, ts: input.ts }, ctx);
  const msgs = d.messages ?? [];
  const lines = msgs.map((m: { text: string; user: string; ts: string }) =>
    `- <@${m.user}>: ${(m.text || '').slice(0, 100)}`);
  return { success: true, data: msgs, displayMarkdown: `## Thread Replies (${msgs.length})\n\n${lines.join('\n')}` };
};

const setStatus: KitToolHandler = async (input, ctx) => {
  const d = await slackApi('set-user-status', { statusText: input.statusText, statusEmoji: input.statusEmoji }, ctx);
  return { success: true, data: d, displayMarkdown: `Status set: ${input.statusEmoji || ''} ${input.statusText}` };
};

export const manifest: KitManifest = {
  id: 'slack-comms',
  name: 'Slack Communications',
  version: '2.0.0',
  description: 'Slack team messaging — channels, messages, users, search, and notifications.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use slack tools to send messages, search channels, check team activity, and manage notifications.',
  tools: [
    { name: 'slack_list_channels', description: 'List all Slack channels with member counts.', input_schema: { type: 'object', properties: { limit: { type: 'number' } } } },
    { name: 'slack_send_message', description: 'Send a message to a Slack channel.', input_schema: { type: 'object', properties: { channel: { type: 'string', description: 'Channel ID' }, text: { type: 'string', description: 'Message text' }, thread_ts: { type: 'string', description: 'Thread timestamp for replies' } }, required: ['channel', 'text'] } },
    { name: 'slack_channel_history', description: 'Get recent messages from a Slack channel.', input_schema: { type: 'object', properties: { channel: { type: 'string', description: 'Channel ID' }, limit: { type: 'number' } }, required: ['channel'] } },
    { name: 'slack_list_users', description: 'List team members (non-bots).', input_schema: { type: 'object', properties: { limit: { type: 'number' } } } },
    { name: 'slack_search', description: 'Search Slack messages across all channels.', input_schema: { type: 'object', properties: { query: { type: 'string', description: 'Search query' }, limit: { type: 'number' } }, required: ['query'] } },
    { name: 'slack_overview', description: 'Get Slack workspace summary: team, channels, members.', input_schema: { type: 'object', properties: {} } },
    { name: 'slack_edit_message', description: 'Edit an existing Slack message.', input_schema: { type: 'object', properties: { channel: { type: 'string', description: 'Channel ID' }, ts: { type: 'string', description: 'Message timestamp' }, text: { type: 'string', description: 'New message text' } }, required: ['channel', 'ts', 'text'] } },
    { name: 'slack_delete_message', description: 'Delete a Slack message.', input_schema: { type: 'object', properties: { channel: { type: 'string', description: 'Channel ID' }, ts: { type: 'string', description: 'Message timestamp' } }, required: ['channel', 'ts'] } },
    { name: 'slack_create_channel', description: 'Create a new Slack channel.', input_schema: { type: 'object', properties: { name: { type: 'string', description: 'Channel name' }, isPrivate: { type: 'boolean', description: 'Create as private channel' } }, required: ['name'] } },
    { name: 'slack_archive_channel', description: 'Archive a Slack channel.', input_schema: { type: 'object', properties: { channel: { type: 'string', description: 'Channel ID' } }, required: ['channel'] } },
    { name: 'slack_set_topic', description: 'Set a channel topic.', input_schema: { type: 'object', properties: { channel: { type: 'string', description: 'Channel ID' }, topic: { type: 'string', description: 'Topic text' } }, required: ['channel', 'topic'] } },
    { name: 'slack_add_reaction', description: 'Add a reaction emoji to a message.', input_schema: { type: 'object', properties: { channel: { type: 'string', description: 'Channel ID' }, timestamp: { type: 'string', description: 'Message timestamp' }, name: { type: 'string', description: 'Emoji name (without colons)' } }, required: ['channel', 'timestamp', 'name'] } },
    { name: 'slack_thread_replies', description: 'Get replies in a message thread.', input_schema: { type: 'object', properties: { channel: { type: 'string', description: 'Channel ID' }, ts: { type: 'string', description: 'Thread parent timestamp' } }, required: ['channel', 'ts'] } },
    { name: 'slack_set_status', description: 'Set your Slack status text and emoji.', input_schema: { type: 'object', properties: { statusText: { type: 'string', description: 'Status text' }, statusEmoji: { type: 'string', description: 'Status emoji (e.g. :house:)' } }, required: ['statusText'] } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  slack_list_channels: listChannels,
  slack_send_message: sendMessage,
  slack_channel_history: channelHistory,
  slack_list_users: listUsers,
  slack_search: searchMessages,
  slack_overview: slackOverview,
  slack_edit_message: editMessage,
  slack_delete_message: deleteMessage,
  slack_create_channel: createChannel,
  slack_archive_channel: archiveChannel,
  slack_set_topic: setTopic,
  slack_add_reaction: addReaction,
  slack_thread_replies: threadReplies,
  slack_set_status: setStatus,
};
