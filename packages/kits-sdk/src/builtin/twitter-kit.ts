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

const createTweet: KitToolHandler = async (input, ctx) => {
  const d = await xApi('create-tweet', { text: input.text, reply_to: input.reply_to, quote_tweet_id: input.quote_tweet_id }, ctx);
  return { success: true, data: d, displayMarkdown: `Tweet created: ${JSON.stringify(d).slice(0, 500)}` };
};

const deleteTweet: KitToolHandler = async (input, ctx) => {
  const d = await xApi('delete-tweet', { id: input.id }, ctx);
  return { success: true, data: d, displayMarkdown: `Tweet deleted: ${JSON.stringify(d).slice(0, 500)}` };
};

const retweet: KitToolHandler = async (input, ctx) => {
  const d = await xApi('retweet', { userId: input.userId, tweetId: input.tweetId }, ctx);
  return { success: true, data: d, displayMarkdown: `Retweeted: ${JSON.stringify(d).slice(0, 500)}` };
};

const likeTweet: KitToolHandler = async (input, ctx) => {
  const d = await xApi('like-tweet', { userId: input.userId, tweetId: input.tweetId }, ctx);
  return { success: true, data: d, displayMarkdown: `Liked tweet: ${JSON.stringify(d).slice(0, 500)}` };
};

const sendDm: KitToolHandler = async (input, ctx) => {
  const d = await xApi('send-dm', { participant_id: input.participant_id, text: input.text }, ctx);
  return { success: true, data: d, displayMarkdown: `DM sent: ${JSON.stringify(d).slice(0, 500)}` };
};

const listDms: KitToolHandler = async (_input, ctx) => {
  const d = await xApi('list-dm-events', {}, ctx);
  return { success: true, data: d, displayMarkdown: `DM events: ${JSON.stringify(d).slice(0, 500)}` };
};

const follow: KitToolHandler = async (input, ctx) => {
  const d = await xApi('follow', { sourceUserId: input.sourceUserId, targetUserId: input.targetUserId }, ctx);
  return { success: true, data: d, displayMarkdown: `Followed user: ${JSON.stringify(d).slice(0, 500)}` };
};

const unfollow: KitToolHandler = async (input, ctx) => {
  const d = await xApi('unfollow', { sourceUserId: input.sourceUserId, targetUserId: input.targetUserId }, ctx);
  return { success: true, data: d, displayMarkdown: `Unfollowed user: ${JSON.stringify(d).slice(0, 500)}` };
};

const block: KitToolHandler = async (input, ctx) => {
  const d = await xApi('block', { sourceUserId: input.sourceUserId, targetUserId: input.targetUserId }, ctx);
  return { success: true, data: d, displayMarkdown: `Blocked user: ${JSON.stringify(d).slice(0, 500)}` };
};

const getList: KitToolHandler = async (input, ctx) => {
  const d = await xApi('get-list', { listId: input.listId }, ctx);
  return { success: true, data: d, displayMarkdown: `List details: ${JSON.stringify(d).slice(0, 500)}` };
};

const createList: KitToolHandler = async (input, ctx) => {
  const d = await xApi('create-list', { name: input.name, description: input.description }, ctx);
  return { success: true, data: d, displayMarkdown: `List created: ${JSON.stringify(d).slice(0, 500)}` };
};

const listBookmarks: KitToolHandler = async (input, ctx) => {
  const d = await xApi('list-bookmarks', { userId: input.userId }, ctx);
  return { success: true, data: d, displayMarkdown: `Bookmarks: ${JSON.stringify(d).slice(0, 500)}` };
};

const searchSpaces: KitToolHandler = async (input, ctx) => {
  const d = await xApi('search-spaces', { query: input.query }, ctx);
  return { success: true, data: d, displayMarkdown: `Spaces: ${JSON.stringify(d).slice(0, 500)}` };
};

export const manifest: KitManifest = {
  id: 'twitter-social',
  name: 'X (Twitter)',
  version: '2.0.0',
  description: 'X/Twitter — full CRUD: user profiles, tweets, search, followers, trending, DMs, lists, bookmarks, spaces, and social intelligence.',
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
    { name: 'x_create_tweet', description: 'Create a tweet.', input_schema: { type: 'object', properties: { text: { type: 'string' }, reply_to: { type: 'string', description: 'Tweet ID to reply to' }, quote_tweet_id: { type: 'string', description: 'Tweet ID to quote' } }, required: ['text'] } },
    { name: 'x_delete_tweet', description: 'Delete a tweet by ID.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'x_retweet', description: 'Retweet a tweet.', input_schema: { type: 'object', properties: { userId: { type: 'string' }, tweetId: { type: 'string' } }, required: ['userId', 'tweetId'] } },
    { name: 'x_like', description: 'Like a tweet.', input_schema: { type: 'object', properties: { userId: { type: 'string' }, tweetId: { type: 'string' } }, required: ['userId', 'tweetId'] } },
    { name: 'x_send_dm', description: 'Send a direct message.', input_schema: { type: 'object', properties: { participant_id: { type: 'string' }, text: { type: 'string' } }, required: ['participant_id', 'text'] } },
    { name: 'x_list_dms', description: 'List DM events.', input_schema: { type: 'object', properties: {} } },
    { name: 'x_follow', description: 'Follow a user.', input_schema: { type: 'object', properties: { sourceUserId: { type: 'string' }, targetUserId: { type: 'string' } }, required: ['sourceUserId', 'targetUserId'] } },
    { name: 'x_unfollow', description: 'Unfollow a user.', input_schema: { type: 'object', properties: { sourceUserId: { type: 'string' }, targetUserId: { type: 'string' } }, required: ['sourceUserId', 'targetUserId'] } },
    { name: 'x_block', description: 'Block a user.', input_schema: { type: 'object', properties: { sourceUserId: { type: 'string' }, targetUserId: { type: 'string' } }, required: ['sourceUserId', 'targetUserId'] } },
    { name: 'x_list', description: 'Get list details.', input_schema: { type: 'object', properties: { listId: { type: 'string' } }, required: ['listId'] } },
    { name: 'x_create_list', description: 'Create a new list.', input_schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } }, required: ['name'] } },
    { name: 'x_bookmarks', description: 'List bookmarks for a user.', input_schema: { type: 'object', properties: { userId: { type: 'string' } }, required: ['userId'] } },
    { name: 'x_spaces', description: 'Search Twitter Spaces.', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  x_get_user: getUser,
  x_search_tweets: searchTweets,
  x_user_tweets: userTweets,
  x_get_followers: getFollowers,
  x_trending: trending,
  x_overview: xOverview,
  x_create_tweet: createTweet,
  x_delete_tweet: deleteTweet,
  x_retweet: retweet,
  x_like: likeTweet,
  x_send_dm: sendDm,
  x_list_dms: listDms,
  x_follow: follow,
  x_unfollow: unfollow,
  x_block: block,
  x_list: getList,
  x_create_list: createList,
  x_bookmarks: listBookmarks,
  x_spaces: searchSpaces,
};
