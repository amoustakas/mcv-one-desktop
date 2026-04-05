import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function ytApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const query = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
  const res = await ctx.fetch(`/api/youtube?${query}`);
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `YouTube ${res.status}`); }
  return res.json();
}

const myChannel: KitToolHandler = async (_input, ctx) => {
  const data = await ytApi('my-channel', {}, ctx);
  const ch = data.items?.[0];
  if (!ch) return { success: true, data: null, displayMarkdown: 'No YouTube channel found for this account.' };
  const s = ch.statistics;
  return { success: true, data: ch, displayMarkdown: `## ${ch.snippet?.title}\n\n- **Subscribers:** ${Number(s?.subscriberCount).toLocaleString()}\n- **Views:** ${Number(s?.viewCount).toLocaleString()}\n- **Videos:** ${s?.videoCount}` };
};

const searchVideos: KitToolHandler = async (input, ctx) => {
  const data = await ytApi('search', { q: input.query, maxResults: input.limit ?? 10, type: 'video' }, ctx);
  const items = data.items ?? [];
  const lines = items.map((v: { snippet: { title: string; channelTitle: string }; id: { videoId: string } }) =>
    `- **${v.snippet?.title}** — ${v.snippet?.channelTitle} — [watch](https://youtu.be/${v.id?.videoId})`);
  return { success: true, data: items, displayMarkdown: `## YouTube Search: "${input.query}" (${items.length})\n\n${lines.join('\n')}` };
};

const getVideo: KitToolHandler = async (input, ctx) => {
  const data = await ytApi('get-video', { videoId: input.videoId }, ctx);
  const v = data.items?.[0];
  if (!v) return { success: false, error: 'Video not found' };
  const s = v.statistics;
  return { success: true, data: v, displayMarkdown: `## ${v.snippet?.title}\n\n- **Views:** ${Number(s?.viewCount).toLocaleString()}\n- **Likes:** ${Number(s?.likeCount).toLocaleString()}\n- **Comments:** ${Number(s?.commentCount).toLocaleString()}\n- **Published:** ${v.snippet?.publishedAt}\n- **Duration:** ${v.contentDetails?.duration}` };
};

const myPlaylists: KitToolHandler = async (_input, ctx) => {
  const data = await ytApi('my-playlists', {}, ctx);
  const items = data.items ?? [];
  const lines = items.map((p: { snippet: { title: string }; contentDetails: { itemCount: number } }) =>
    `- **${p.snippet?.title}** (${p.contentDetails?.itemCount} videos)`);
  return { success: true, data: items, displayMarkdown: `## My Playlists (${items.length})\n\n${lines.join('\n')}` };
};

const channelAnalytics: KitToolHandler = async (input, ctx) => {
  const data = await ytApi('channel-analytics', { startDate: input.startDate, endDate: input.endDate }, ctx);
  return { success: true, data, displayMarkdown: `## Channel Analytics\n\n\`\`\`json\n${JSON.stringify(data, null, 2).slice(0, 2000)}\n\`\`\`` };
};

const ytOverview: KitToolHandler = async (_input, ctx) => {
  const data = await ytApi('overview', {}, ctx);
  return { success: true, data, displayMarkdown: `## YouTube Overview\n\n- **Channel:** ${data.name}\n- **Subscribers:** ${Number(data.subscribers).toLocaleString()}\n- **Total Views:** ${Number(data.totalViews).toLocaleString()}\n- **Videos:** ${data.videoCount}` };
};

export const manifest: KitManifest = {
  id: 'youtube-media',
  name: 'YouTube',
  version: '1.0.0',
  description: 'YouTube channels, videos, playlists, search, comments, and analytics.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use youtube tools for video search, channel analytics, playlist management, and content intelligence.',
  tools: [
    { name: 'youtube_my_channel', description: 'Get your YouTube channel info + stats.', input_schema: { type: 'object', properties: {} } },
    { name: 'youtube_search', description: 'Search YouTube videos.', input_schema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
    { name: 'youtube_get_video', description: 'Get video details + stats.', input_schema: { type: 'object', properties: { videoId: { type: 'string' } }, required: ['videoId'] } },
    { name: 'youtube_my_playlists', description: 'List your playlists.', input_schema: { type: 'object', properties: {} } },
    { name: 'youtube_analytics', description: 'Get channel analytics (views, watch time, subscribers).', input_schema: { type: 'object', properties: { startDate: { type: 'string', description: 'YYYY-MM-DD' }, endDate: { type: 'string' } } } },
    { name: 'youtube_overview', description: 'YouTube channel summary.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  youtube_my_channel: myChannel,
  youtube_search: searchVideos,
  youtube_get_video: getVideo,
  youtube_my_playlists: myPlaylists,
  youtube_analytics: channelAnalytics,
  youtube_overview: ytOverview,
};
