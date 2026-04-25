/**
 * MCV One Desktop — Browser Widget Routes
 *
 * Manages headless Chromium instances via Playwright.
 * Provides REST endpoints for:
 * - Session lifecycle (create / close / list)
 * - Navigation (navigate / back / forward / reload)
 * - Input injection (mouse / keyboard / scroll via CDP)
 * - Content extraction (HTML, Readability, screenshot, accessibility tree)
 * - Element interaction (click / type by CSS selector — for Claude agent)
 *
 * Frame streaming is handled separately in browser-ws.ts via WebSocket.
 */

import { chromium, type BrowserContext, type Page, type CDPSession } from 'playwright';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExpressApp = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Req = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = any;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BrowserSession {
  id: string;
  /** Shared persistent context — same instance across all live sessions
   *  so cookies/logins survive page closes and process restarts. */
  context: BrowserContext;
  page: Page;
  cdp: CDPSession;
  createdAt: number;
  lastActivity: number;
  viewportWidth: number;
  viewportHeight: number;
}

// ---------------------------------------------------------------------------
// Session Manager
// ---------------------------------------------------------------------------

const MAX_SESSIONS = 5;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/** Single persistent context shared across all sessions. Each session
 *  gets its own Page; cookies, localStorage, and login state live in the
 *  user-data-dir on disk and survive process restarts. */
let persistentContext: BrowserContext | null = null;
const sessions = new Map<string, BrowserSession>();

function resolveUserDataDir(): string {
  return (
    process.env.MCV_VISION_USER_DATA_DIR ??
    path.join(homedir(), '.mcv', 'vision-browser-profile')
  );
}

async function ensurePersistentContext(): Promise<BrowserContext> {
  if (persistentContext) {
    const browser = persistentContext.browser();
    if (browser && browser.isConnected()) return persistentContext;
    // Crashed Chrome — drop the stale ref and relaunch.
    persistentContext = null;
  }

  const userDataDir = resolveUserDataDir();
  // Profile dir must exist before launchPersistentContext touches it.
  mkdirSync(userDataDir, { recursive: true });

  persistentContext = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    viewport: { width: 1280, height: 800 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    ignoreHTTPSErrors: true,
  });
  return persistentContext;
}

function generateId(): string {
  return 'bs_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getSession(sessionId: string): BrowserSession | undefined {
  const s = sessions.get(sessionId);
  if (s) s.lastActivity = Date.now();
  return s;
}

async function createSession(viewportWidth = 1280, viewportHeight = 800): Promise<BrowserSession> {
  if (sessions.size >= MAX_SESSIONS) {
    // Close oldest session
    let oldest: BrowserSession | null = null;
    for (const s of sessions.values()) {
      if (!oldest || s.lastActivity < oldest.lastActivity) oldest = s;
    }
    if (oldest) await closeSession(oldest.id);
  }

  const context = await ensurePersistentContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: viewportWidth, height: viewportHeight });
  const cdp = await context.newCDPSession(page);

  // Navigate to a blank start page
  await page.goto('about:blank');

  const session: BrowserSession = {
    id: generateId(),
    context,
    page,
    cdp,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    viewportWidth,
    viewportHeight,
  };

  sessions.set(session.id, session);
  return session;
}

async function closeSession(sessionId: string): Promise<void> {
  const s = sessions.get(sessionId);
  if (!s) return;
  sessions.delete(sessionId);
  try {
    await s.cdp.detach().catch(() => {});
    // Close the page only — `s.context` is the shared persistent context
    // and must outlive the session so cookies/logins survive across
    // session boundaries.
    await s.page.close().catch(() => {});
  } catch { /* already closed */ }
}

// Cleanup idle sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.lastActivity > IDLE_TIMEOUT_MS) {
      closeSession(id);
    }
  }
}, 60_000);

// ---------------------------------------------------------------------------
// Readability extraction helper
// ---------------------------------------------------------------------------

async function extractReadability(page: Page) {
  const html = await page.content();
  const url = page.url();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  return {
    title: article?.title || await page.title(),
    content: article?.content || '',
    textContent: article?.textContent || '',
    excerpt: article?.excerpt || '',
    byline: article?.byline || '',
    url,
  };
}

// ---------------------------------------------------------------------------
// Route Registration
// ---------------------------------------------------------------------------

export function registerBrowserRoutes(app: ExpressApp): void {

  // ── Session CRUD ──

  app.post('/local/browser/session', async (req: Req, res: Res) => {
    try {
      const { viewport } = req.body || {};
      const s = await createSession(viewport?.w || 1280, viewport?.h || 800);
      res.json({ sessionId: s.id, viewportWidth: s.viewportWidth, viewportHeight: s.viewportHeight });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete('/local/browser/session/:id', async (req: Req, res: Res) => {
    await closeSession(req.params.id);
    res.json({ ok: true });
  });

  app.get('/local/browser/sessions', (_req: Req, res: Res) => {
    const list = Array.from(sessions.values()).map(s => ({
      id: s.id,
      url: s.page.url(),
      title: '',
      createdAt: s.createdAt,
      lastActivity: s.lastActivity,
    }));
    res.json({ sessions: list });
  });

  // ── Navigation ──

  app.post('/local/browser/navigate', async (req: Req, res: Res) => {
    try {
      const { sessionId, url } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });

      let targetUrl = url;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      await s.page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const title = await s.page.title();
      res.json({ url: s.page.url(), title });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/local/browser/back', async (req: Req, res: Res) => {
    try {
      const { sessionId } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });
      await s.page.goBack({ waitUntil: 'domcontentloaded', timeout: 10000 });
      res.json({ url: s.page.url(), title: await s.page.title() });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/local/browser/forward', async (req: Req, res: Res) => {
    try {
      const { sessionId } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });
      await s.page.goForward({ waitUntil: 'domcontentloaded', timeout: 10000 });
      res.json({ url: s.page.url(), title: await s.page.title() });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/local/browser/reload', async (req: Req, res: Res) => {
    try {
      const { sessionId } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });
      await s.page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // ── Input (CDP dispatch) ──

  app.post('/local/browser/input/mouse', async (req: Req, res: Res) => {
    try {
      const { sessionId, type, x, y, button, clickCount } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });

      await s.cdp.send('Input.dispatchMouseEvent', {
        type,
        x: Math.round(x),
        y: Math.round(y),
        button: button || 'left',
        clickCount: clickCount || 1,
        buttons: type === 'mousePressed' ? 1 : 0,
      });
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/local/browser/input/keyboard', async (req: Req, res: Res) => {
    try {
      const { sessionId, type, key, code, text } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });

      if (type === 'char' && text) {
        await s.cdp.send('Input.dispatchKeyEvent', {
          type: 'char',
          text,
        });
      } else {
        await s.cdp.send('Input.dispatchKeyEvent', {
          type,
          key: key || '',
          code: code || '',
          text: text || '',
          windowsVirtualKeyCode: getVirtualKeyCode(key),
          nativeVirtualKeyCode: getVirtualKeyCode(key),
        });
      }
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/local/browser/input/scroll', async (req: Req, res: Res) => {
    try {
      const { sessionId, x, y, deltaX, deltaY } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });

      await s.cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: Math.round(x || s.viewportWidth / 2),
        y: Math.round(y || s.viewportHeight / 2),
        deltaX: deltaX || 0,
        deltaY: deltaY || 0,
      });
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // ── Content Extraction ──

  app.post('/local/browser/content', async (req: Req, res: Res) => {
    try {
      const { sessionId } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });

      const html = await s.page.content();
      const title = await s.page.title();
      res.json({ html: html.slice(0, 500_000), title, url: s.page.url() });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/local/browser/readability', async (req: Req, res: Res) => {
    try {
      const { sessionId } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });

      const article = await extractReadability(s.page);
      res.json(article);
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/local/browser/screenshot', async (req: Req, res: Res) => {
    try {
      const { sessionId, fullPage } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });

      const buffer = await s.page.screenshot({
        type: 'jpeg',
        quality: 70,
        fullPage: !!fullPage,
      });
      res.json({ imageBase64: buffer.toString('base64'), mimeType: 'image/jpeg' });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/local/browser/accessibility', async (req: Req, res: Res) => {
    try {
      const { sessionId } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });

      const snapshot = await s.page.accessibility.snapshot();
      res.json({ tree: snapshot });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/local/browser/evaluate', async (req: Req, res: Res) => {
    try {
      const { sessionId, expression } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });

      // Use CDP Runtime.evaluate — sandboxed to the page's JS context
      const result = await s.cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        timeout: 5000,
      });
      res.json({ result: result.result?.value ?? null });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // ── Element Interaction (for Claude agent actions) ──

  app.post('/local/browser/click', async (req: Req, res: Res) => {
    try {
      const { sessionId, selector, x, y } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });

      if (selector) {
        await s.page.click(selector, { timeout: 5000 });
      } else if (x !== undefined && y !== undefined) {
        await s.page.mouse.click(x, y);
      } else {
        return res.status(400).json({ error: 'Provide selector or x,y coordinates' });
      }
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/local/browser/type', async (req: Req, res: Res) => {
    try {
      const { sessionId, selector, text } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });

      if (selector) {
        await s.page.fill(selector, text, { timeout: 5000 });
      } else {
        await s.page.keyboard.type(text);
      }
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/local/browser/select', async (req: Req, res: Res) => {
    try {
      const { sessionId, selector, value } = req.body;
      const s = getSession(sessionId);
      if (!s) return res.status(404).json({ error: 'Session not found' });

      await s.page.selectOption(selector, value, { timeout: 5000 });
      res.json({ ok: true });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });
}

// ---------------------------------------------------------------------------
// Key code helper
// ---------------------------------------------------------------------------

function getVirtualKeyCode(key: string | undefined): number {
  if (!key) return 0;
  const map: Record<string, number> = {
    Enter: 13, Tab: 9, Backspace: 8, Escape: 27, Delete: 46,
    ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39,
    Home: 36, End: 35, PageUp: 33, PageDown: 34,
    Space: 32, ' ': 32,
  };
  if (map[key]) return map[key];
  if (key.length === 1) return key.toUpperCase().charCodeAt(0);
  return 0;
}
