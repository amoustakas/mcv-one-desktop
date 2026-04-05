import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function twitchApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const query = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
  const res = await ctx.fetch(`/api/twitch?${query}`);
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Twitch ${res.status}`); }
  return res.json();
}

const getUser: KitToolHandler = async (input, ctx) => {
  const data = await twitchApi('get-user', { login: input.login, id: input.id }, ctx);
  const u = data.data?.[0];
  if (!u) return { success: false, error: 'User not found' };
  return { success: true, data: u, displayMarkdown: `## ${u.display_name}\n\n- **Type:** ${u.broadcaster_type || 'user'}\n- **Views:** ${u.view_count?.toLocaleString()}\n- **Created:** ${u.created_at}\n\n${u.description || ''}` };
};

const getStreams: KitToolHandler = async (input, ctx) => {
  const data = await twitchApi('get-streams', { game_id: input.gameId, user_login: input.login, first: input.limit ?? 10 }, ctx);
  const streams = data.data ?? [];
  const lines = streams.map((s: { user_name: string; game_name: string; viewer_count: number; title: string }) =>
    `- **${s.user_name}** playing ${s.game_name} — ${s.viewer_count.toLocaleString()} viewers — "${s.title.slice(0, 60)}"`);
  return { success: true, data: streams, displayMarkdown: `## Live Streams (${streams.length})\n\n${lines.join('\n')}` };
};

const searchChannels: KitToolHandler = async (input, ctx) => {
  const data = await twitchApi('search-channels', { query: input.query, first: input.limit ?? 10 }, ctx);
  const channels = data.data ?? [];
  const lines = channels.map((c: { display_name: string; game_name: string; is_live: boolean }) =>
    `- **${c.display_name}** — ${c.game_name || 'No game'} ${c.is_live ? '🔴 LIVE' : ''}`);
  return { success: true, data: channels, displayMarkdown: `## Channels: "${input.query}" (${channels.length})\n\n${lines.join('\n')}` };
};

const topGames: KitToolHandler = async (input, ctx) => {
  const data = await twitchApi('top-games', { first: input.limit ?? 10 }, ctx);
  const games = data.data ?? [];
  const lines = games.map((g: { name: string; id: string }, i: number) => `${i + 1}. **${g.name}**`);
  return { success: true, data: games, displayMarkdown: `## Top Games\n\n${lines.join('\n')}` };
};

const getClips: KitToolHandler = async (input, ctx) => {
  const data = await twitchApi('get-clips', { broadcaster_id: input.broadcasterId, first: input.limit ?? 5 }, ctx);
  const clips = data.data ?? [];
  const lines = clips.map((c: { title: string; creator_name: string; view_count: number; url: string }) =>
    `- **${c.title}** by ${c.creator_name} — ${c.view_count.toLocaleString()} views — [watch](${c.url})`);
  return { success: true, data: clips, displayMarkdown: `## Clips (${clips.length})\n\n${lines.join('\n')}` };
};

const twitchOverview: KitToolHandler = async (_input, ctx) => {
  const data = await twitchApi('overview', {}, ctx);
  let md = '## Twitch Overview\n\n### Top Streams\n';
  (data.top_streams ?? []).forEach((s: { streamer: string; game: string; viewers: number }) => {
    md += `- **${s.streamer}** — ${s.game} (${s.viewers.toLocaleString()} viewers)\n`;
  });
  md += '\n### Top Games\n' + (data.top_games ?? []).map((g: string, i: number) => `${i + 1}. ${g}`).join('\n');
  return { success: true, data, displayMarkdown: md };
};

export const manifest: KitManifest = {
  id: 'twitch-streaming',
  name: 'Twitch',
  version: '1.0.0',
  description: 'Twitch — streams, users, channels, clips, games, schedule, and chat.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use twitch tools for stream discovery, user lookups, clip management, game rankings, and streaming analytics.',
  tools: [
    { name: 'twitch_get_user', description: 'Get Twitch user profile.', input_schema: { type: 'object', properties: { login: { type: 'string', description: 'Username' }, id: { type: 'string' } } } },
    { name: 'twitch_live_streams', description: 'Get live streams (optionally by game or user).', input_schema: { type: 'object', properties: { gameId: { type: 'string' }, login: { type: 'string' }, limit: { type: 'number' } } } },
    { name: 'twitch_search_channels', description: 'Search Twitch channels.', input_schema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
    { name: 'twitch_top_games', description: 'Get top games on Twitch right now.', input_schema: { type: 'object', properties: { limit: { type: 'number' } } } },
    { name: 'twitch_get_clips', description: 'Get top clips for a broadcaster.', input_schema: { type: 'object', properties: { broadcasterId: { type: 'string' }, limit: { type: 'number' } }, required: ['broadcasterId'] } },
    { name: 'twitch_overview', description: 'Twitch platform overview: top streams and games.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  twitch_get_user: getUser,
  twitch_live_streams: getStreams,
  twitch_search_channels: searchChannels,
  twitch_top_games: topGames,
  twitch_get_clips: getClips,
  twitch_overview: twitchOverview,
};
