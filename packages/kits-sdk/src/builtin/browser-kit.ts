/**
 * Browser Intelligence Kit
 *
 * Gives Claude the ability to browse the web, read pages, take screenshots,
 * click elements, type text, and extract data — full autonomous browser agent.
 * Also includes YouTube transcript tools.
 *
 * All tools route through the local Express server's browser endpoints.
 */

import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function browserApi(path: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(`/local/browser/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Browser API error: ${res.status}`);
  }
  return res.json();
}

async function youtubeApi(path: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(`/local/youtube/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `YouTube API error: ${res.status}`);
  }
  return res.json();
}

// Store active session ID for stateful operations
let activeSessionId: string | null = null;

async function ensureSession(ctx: KitExecutionContext): Promise<string> {
  if (activeSessionId) {
    // Verify session still exists
    try {
      const res = await ctx.fetch('/local/browser/sessions');
      const data = await res.json();
      if (data.sessions?.some((s: { id: string }) => s.id === activeSessionId)) {
        return activeSessionId;
      }
    } catch { /* session lost */ }
  }
  // Create new session
  const data = await browserApi('session', {}, ctx);
  activeSessionId = data.sessionId;
  return data.sessionId;
}

// ---------------------------------------------------------------------------
// Tool Handlers
// ---------------------------------------------------------------------------

const browserNavigate: KitToolHandler = async (input, ctx) => {
  const sessionId = await ensureSession(ctx);
  const data = await browserApi('navigate', { sessionId, url: input.url }, ctx);
  return {
    success: true,
    data,
    displayMarkdown: `## Navigated to ${data.title || data.url}\n\nURL: ${data.url}`,
  };
};

const browserReadPage: KitToolHandler = async (input, ctx) => {
  const sessionId = await ensureSession(ctx);
  if (input.url) {
    await browserApi('navigate', { sessionId, url: input.url }, ctx);
  }
  const data = await browserApi('readability', { sessionId }, ctx);
  const content = (data.textContent || '').slice(0, 50000);
  return {
    success: true,
    data: { title: data.title, url: data.url, content },
    displayMarkdown: `## ${data.title}\n\n${content.slice(0, 2000)}${content.length > 2000 ? '\n\n...(truncated)' : ''}`,
  };
};

const browserScreenshot: KitToolHandler = async (input, ctx) => {
  const sessionId = await ensureSession(ctx);
  if (input.url) {
    await browserApi('navigate', { sessionId, url: input.url }, ctx);
  }
  const data = await browserApi('screenshot', { sessionId, fullPage: input.fullPage }, ctx);
  return {
    success: true,
    data: { type: 'image', source: { type: 'base64', media_type: data.mimeType, data: data.imageBase64 } },
    displayMarkdown: `Screenshot captured (${data.mimeType})`,
  };
};

const browserClick: KitToolHandler = async (input, ctx) => {
  const sessionId = await ensureSession(ctx);
  await browserApi('click', {
    sessionId,
    selector: input.selector,
    x: input.x,
    y: input.y,
  }, ctx);
  return {
    success: true,
    displayMarkdown: `Clicked ${input.selector || `at (${input.x}, ${input.y})`}`,
  };
};

const browserType: KitToolHandler = async (input, ctx) => {
  const sessionId = await ensureSession(ctx);
  await browserApi('type', {
    sessionId,
    selector: input.selector,
    text: input.text,
  }, ctx);
  return {
    success: true,
    displayMarkdown: `Typed "${input.text}" ${input.selector ? `into ${input.selector}` : ''}`,
  };
};

const browserScroll: KitToolHandler = async (input, ctx) => {
  const sessionId = await ensureSession(ctx);
  const direction = input.direction as string;
  const amount = (input.amount as number) || 300;
  const deltaY = direction === 'up' ? -amount : amount;
  await browserApi('input/scroll', { sessionId, deltaY }, ctx);
  return {
    success: true,
    displayMarkdown: `Scrolled ${direction} by ${amount}px`,
  };
};

const browserExtract: KitToolHandler = async (input, ctx) => {
  const sessionId = await ensureSession(ctx);
  if (input.url) {
    await browserApi('navigate', { sessionId, url: input.url }, ctx);
  }
  const data = await browserApi('readability', { sessionId }, ctx);
  return {
    success: true,
    data: {
      title: data.title,
      url: data.url,
      content: (data.textContent || '').slice(0, 50000),
      schema: input.schema,
    },
    displayMarkdown: `Extracted content from ${data.title} for schema: ${input.schema}`,
  };
};

const browserSearchPage: KitToolHandler = async (input, ctx) => {
  const sessionId = await ensureSession(ctx);
  const data = await browserApi('readability', { sessionId }, ctx);
  const text = (data.textContent || '').toLowerCase();
  const query = (input.query as string).toLowerCase();
  const lines = text.split('\n').filter((l: string) => l.includes(query));
  return {
    success: true,
    data: { matches: lines.length, results: lines.slice(0, 20) },
    displayMarkdown: `## Search: "${input.query}" — ${lines.length} matches\n\n${lines.slice(0, 10).map((l: string) => `- ${l.trim().slice(0, 200)}`).join('\n')}`,
  };
};

const youtubeGetTranscript: KitToolHandler = async (input, ctx) => {
  const data = await youtubeApi('transcript', { videoId: input.videoId }, ctx);
  const segments = data.segments || [];
  const formatted = segments
    .slice(0, 50)
    .map((s: { text: string; start: number }) => `[${Math.floor(s.start / 60)}:${String(Math.floor(s.start % 60)).padStart(2, '0')}] ${s.text}`)
    .join('\n');
  return {
    success: true,
    data: segments,
    displayMarkdown: `## Transcript (${segments.length} segments)\n\n${formatted}${segments.length > 50 ? '\n\n...(truncated)' : ''}`,
  };
};

const youtubeSearchTranscript: KitToolHandler = async (input, ctx) => {
  const data = await youtubeApi('search-transcript', { videoId: input.videoId, query: input.query }, ctx);
  const matches = data.matches || [];
  const formatted = matches
    .slice(0, 20)
    .map((s: { text: string; start: number }) => `- **[${Math.floor(s.start / 60)}:${String(Math.floor(s.start % 60)).padStart(2, '0')}]** ${s.text}`)
    .join('\n');
  return {
    success: true,
    data: matches,
    displayMarkdown: `## Transcript Search: "${input.query}" — ${matches.length} matches\n\n${formatted}`,
  };
};

// ---------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------

export const manifest: KitManifest = {
  id: 'browser-agent',
  name: 'Browser Agent',
  version: '1.0.0',
  description: 'Browse the web, read pages, take screenshots, and interact with websites autonomously. Includes YouTube transcript intelligence.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: `Use browser tools to navigate websites, read content, take screenshots for visual analysis, click elements, type text, scroll, and extract structured data. For YouTube videos, use youtube_get_transcript and youtube_search_transcript.

Tool usage flow:
1. browser_navigate — go to a URL
2. browser_read_page — read the page content
3. browser_screenshot — capture visual state
4. browser_click / browser_type — interact with the page
5. browser_scroll — scroll up/down
6. browser_extract — extract structured data
7. browser_search_page — search within page text

For YouTube:
1. youtube_get_transcript — get full transcript with timestamps
2. youtube_search_transcript — find specific topics in transcript`,
  tools: [
    {
      name: 'browser_navigate',
      description: 'Navigate the browser to a URL.',
      input_schema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to navigate to' },
        },
        required: ['url'],
      },
    },
    {
      name: 'browser_read_page',
      description: 'Read the current page content using Readability extraction. Returns clean text.',
      input_schema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Optional: navigate to this URL first before reading' },
        },
      },
    },
    {
      name: 'browser_screenshot',
      description: 'Take a screenshot of the current page for visual analysis.',
      input_schema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Optional: navigate to this URL first' },
          fullPage: { type: 'boolean', description: 'Capture the full scrollable page (default: false)' },
        },
      },
    },
    {
      name: 'browser_click',
      description: 'Click an element on the page by CSS selector or coordinates.',
      input_schema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector to click (e.g. "button.submit", "#login")' },
          x: { type: 'number', description: 'X coordinate to click (alternative to selector)' },
          y: { type: 'number', description: 'Y coordinate to click (alternative to selector)' },
        },
      },
    },
    {
      name: 'browser_type',
      description: 'Type text into an element on the page.',
      input_schema: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector of the input to type into (optional if element is focused)' },
          text: { type: 'string', description: 'The text to type' },
        },
        required: ['text'],
      },
    },
    {
      name: 'browser_scroll',
      description: 'Scroll the page up or down.',
      input_schema: {
        type: 'object',
        properties: {
          direction: { type: 'string', description: '"up" or "down"' },
          amount: { type: 'number', description: 'Pixels to scroll (default: 300)' },
        },
        required: ['direction'],
      },
    },
    {
      name: 'browser_extract',
      description: 'Extract structured data from the current page according to a schema.',
      input_schema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Optional: navigate to this URL first' },
          schema: { type: 'string', description: 'Description or JSON schema of the data to extract' },
        },
        required: ['schema'],
      },
    },
    {
      name: 'browser_search_page',
      description: 'Search for text within the current page content.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Text to search for' },
        },
        required: ['query'],
      },
    },
    {
      name: 'youtube_get_transcript',
      description: 'Get the full transcript of a YouTube video with timestamps.',
      input_schema: {
        type: 'object',
        properties: {
          videoId: { type: 'string', description: 'YouTube video ID or URL' },
        },
        required: ['videoId'],
      },
    },
    {
      name: 'youtube_search_transcript',
      description: 'Search a YouTube video transcript for specific topics. Returns matching segments with timestamps.',
      input_schema: {
        type: 'object',
        properties: {
          videoId: { type: 'string', description: 'YouTube video ID or URL' },
          query: { type: 'string', description: 'Topic or keyword to search for' },
        },
        required: ['videoId', 'query'],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const handlers: Record<string, KitToolHandler> = {
  browser_navigate: browserNavigate,
  browser_read_page: browserReadPage,
  browser_screenshot: browserScreenshot,
  browser_click: browserClick,
  browser_type: browserType,
  browser_scroll: browserScroll,
  browser_extract: browserExtract,
  browser_search_page: browserSearchPage,
  youtube_get_transcript: youtubeGetTranscript,
  youtube_search_transcript: youtubeSearchTranscript,
};
