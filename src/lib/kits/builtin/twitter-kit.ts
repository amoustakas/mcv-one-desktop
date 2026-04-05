import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function xApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const query = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
  const res = await ctx.fetch(`/api/twitter?${query}`);
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `X ${res.status}`); }
  return res.json();
}

const getUser: KitToolHandler = async (input, ctx) => {
  const data = await xApi('get-user', { username: input.username }, ctx);
  const u = data.data;
  if (!u) return { success: false, error: 'User not found' };
  const m = u.public_metrics;
  return { success: true, data: u, displayMarkdown: `## @${u.username} (${u.name})\n\n${u.description || ''}\n\n- **Followers:** ${m?.followers_count?.toLocaleString()}\n- **Following:** ${m?.following_count?.toLocaleString()}\n- **Tweets:** ${m?.tweet_count?.toLocaleString()}\n- **Verified:** ${u.verified ? 'Yes' : 'No'}` };
};

const searchTweets: KitToolHandler = async (input, ctx) => {
  const data = await xApi('search-recent', { query: input.query, max_results: input.limit ?? 10 }, ctx);
  const tweets = data.data ?? [];
  const lines = tweets.map((t: { text: string; public_metrics: { like_count: number; retweet_count: number } }) =>
    `- ${t.text.slice(0, 120)}... (${t.public_metrics?.like_count} likes, ${t.public_metrics?.retweet_count} RTs)`);
  return { success: true, data: tweets, displayMarkdown: `## X Search: "${input.query}" (${tweets.length})\n\n${lines.join('\n')}` };
};

const userTweets: KitToolHandler = async (input, ctx) => {
  const data = await xApi('user-tweets', { userId: input.userId, max_results: input.limit ?? 10 }, ctx);
  const tweets = data.data ?? [];
  const lines = tweets.map((t: { text: string; created_at: string; public_metrics: { like_count: number } }) =>
    `- ${t.text.slice(0, 120)}... (${t.public_metrics?.like_count} likes) — ${new Date(t.created_at).toLocaleDateString()}`);
  return { success: true, data: tweets, displayMarkdown: `## Tweets (${tweets.length})\n\n${lines.join('\n')}` };
};

const getFollowers: KitToolHandler = async (input, ctx) => {
  const data = await xApi('followers', { userId: input.userId, max_results: input.limit ?? 20 }, ctx);
  const users = data.data ?? [];
  const lines = users.map((u: { name: string; username: string; public_metrics: { followers_count: number } }) =>
    `- **@${u.username}** (${u.name}) — ${u.public_metrics?.followers_count?.toLocaleString()} followers`);
  return { success: true, data: users, displayMarkdown: `## Followers (${users.length})\n\n${lines.join('\n')}` };
};

const trending: KitToolHandler = async (input, ctx) => {
  const data = await xApi('trending', { query: input.topic ?? 'crypto OR AI', max_results: input.limit ?? 10 }, ctx);
  const tweets = data.data ?? [];
  const lines = tweets.map((t: { text: string; public_metrics: { like_count: number } }) =>
    `- ${t.text.slice(0, 140)}... (${t.public_metrics?.like_count} likes)`);
  return { success: true, data: tweets, displayMarkdown: `## Trending: "${input.topic || 'crypto/AI'}"\n\n${lines.join('\n')}` };
};

const xOverview: KitToolHandler = async (input, ctx) => {
  if (!input.username) return { success: false, error: 'username required for overview' };
  const data = await xApi('overview', { username: input.username }, ctx);
  return { success: true, data, displayMarkdown: `## @${data.username} Overview\n\n- **Name:** ${data.name}\n- **Followers:** ${Number(data.followers).toLocaleString()}\n- **Following:** ${Number(data.following).toLocaleString()}\n- **Tweets:** ${Number(data.tweets).toLocaleString()}\n- **Verified:** ${data.verified ? 'Yes' : 'No'}` };
};

export const manifest: KitManifest = {
  id: 'twitter-social',
  name: 'X (Twitter)',
  version: '1.0.0',
  description: 'X/Twitter — user profiles, tweets, search, followers, trending topics, and social intelligence.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use twitter/X tools for social media intelligence, profile lookups, tweet search, trend analysis, and audience research.',
  tools: [
    { name: 'x_get_user', description: 'Get an X/Twitter user profile by username.', input_schema: { type: 'object', properties: { username: { type: 'string' } }, required: ['username'] } },
    { name: 'x_search_tweets', description: 'Search recent tweets.', input_schema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } }, required: ['query'] } },
    { name: 'x_user_tweets', description: "Get a user's recent tweets.", input_schema: { type: 'object', properties: { userId: { type: 'string', description: 'X user ID (numeric)' }, limit: { type: 'number' } }, required: ['userId'] } },
    { name: 'x_get_followers', description: "Get a user's followers.", input_schema: { type: 'object', properties: { userId: { type: 'string' }, limit: { type: 'number' } }, required: ['userId'] } },
    { name: 'x_trending', description: 'Get trending tweets on a topic.', input_schema: { type: 'object', properties: { topic: { type: 'string', description: 'Topic (default: crypto/AI)' }, limit: { type: 'number' } } } },
    { name: 'x_overview', description: 'Get X profile overview by username.', input_schema: { type: 'object', properties: { username: { type: 'string' } }, required: ['username'] } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  x_get_user: getUser,
  x_search_tweets: searchTweets,
  x_user_tweets: userTweets,
  x_get_followers: getFollowers,
  x_trending: trending,
  x_overview: xOverview,
};
