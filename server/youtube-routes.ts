/**
 * MCV One Desktop — YouTube Transcript & Metadata Routes
 *
 * Server-side YouTube transcript extraction and search.
 * Uses the youtube-transcript package for caption fetching.
 * No API key required — scrapes the public timedtext endpoint.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExpressApp = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Req = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = any;

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

// Simple in-memory cache (videoId → segments) with 10-min TTL
const transcriptCache = new Map<string, { segments: TranscriptSegment[]; fetchedAt: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function getCached(videoId: string): TranscriptSegment[] | null {
  const entry = transcriptCache.get(videoId);
  if (entry && Date.now() - entry.fetchedAt < CACHE_TTL) return entry.segments;
  if (entry) transcriptCache.delete(videoId);
  return null;
}

async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const cached = getCached(videoId);
  if (cached) return cached;

  // Dynamic import for ESM package
  const { YoutubeTranscript } = await import('youtube-transcript');
  const raw = await YoutubeTranscript.fetchTranscript(videoId);

  const segments: TranscriptSegment[] = raw.map((item: { text: string; offset: number; duration: number }) => ({
    text: item.text,
    start: item.offset / 1000, // Convert ms to seconds
    duration: item.duration / 1000,
  }));

  transcriptCache.set(videoId, { segments, fetchedAt: Date.now() });
  return segments;
}

function extractVideoId(input: string): string | null {
  // Already a bare video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  // URL patterns
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

export function registerYouTubeRoutes(app: ExpressApp): void {

  // ── Get transcript ──
  app.post('/local/youtube/transcript', async (req: Req, res: Res) => {
    try {
      const videoId = extractVideoId(req.body.videoId || '');
      if (!videoId) return res.status(400).json({ error: 'Invalid videoId' });

      const segments = await fetchTranscript(videoId);
      res.json({ videoId, segments });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // ── Search transcript ──
  app.post('/local/youtube/search-transcript', async (req: Req, res: Res) => {
    try {
      const videoId = extractVideoId(req.body.videoId || '');
      const query = (req.body.query || '').toLowerCase().trim();
      if (!videoId) return res.status(400).json({ error: 'Invalid videoId' });
      if (!query) return res.status(400).json({ error: 'Query required' });

      const segments = await fetchTranscript(videoId);
      const matches = segments.filter(s => s.text.toLowerCase().includes(query));
      res.json({ videoId, query, matches });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // ── Video info (oEmbed — no API key needed) ──
  app.post('/local/youtube/info', async (req: Req, res: Res) => {
    try {
      const videoId = extractVideoId(req.body.videoId || '');
      if (!videoId) return res.status(400).json({ error: 'Invalid videoId' });

      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const resp = await fetch(oembedUrl);
      if (!resp.ok) return res.status(resp.status).json({ error: 'Video not found' });

      const data = await resp.json();
      res.json({
        videoId,
        title: data.title,
        author: data.author_name,
        authorUrl: data.author_url,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
}
