/**
 * MCV One Desktop — Browser WebSocket Frame Streaming
 *
 * Attaches a WebSocket upgrade handler to the HTTP server.
 * Path: /local/browser/stream/:sessionId
 *
 * Uses CDP Page.startScreencast to capture JPEG frames from the headless
 * browser and stream them as binary WebSocket messages to the React client.
 * Also sends JSON text messages for navigation events and cursor changes.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { getSession } from './browser-routes';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';

export function attachBrowserWebSocket(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request: IncomingMessage, socket, head) => {
    const url = request.url || '';
    const match = url.match(/^\/local\/browser\/stream\/([^/?]+)/);
    if (!match) return; // Not our path — let other handlers (or nothing) handle it

    const sessionId = match[1];
    const session = getSession(sessionId);
    if (!session) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, sessionId);
    });
  });

  wss.on('connection', async (ws: WebSocket, _req: IncomingMessage, sessionId: string) => {
    const session = getSession(sessionId);
    if (!session) {
      ws.close(1008, 'Session not found');
      return;
    }

    const { cdp, page } = session;
    let streaming = false;

    // ── Start screencast ──
    try {
      const onFrame = (params: { data: string; metadata: { offsetTop: number; pageScaleFactor: number; deviceWidth: number; deviceHeight: number; scrollOffsetX: number; scrollOffsetY: number; timestamp: number }; sessionId: number }) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        // Send raw JPEG bytes as binary
        const buffer = Buffer.from(params.data, 'base64');
        ws.send(buffer, { binary: true });
        // Ack the frame so CDP sends the next one
        cdp.send('Page.screencastFrameAck', { sessionId: params.sessionId }).catch(() => {});
      };

      cdp.on('Page.screencastFrame', onFrame);

      await cdp.send('Page.startScreencast', {
        format: 'jpeg',
        quality: 60,
        maxWidth: session.viewportWidth,
        maxHeight: session.viewportHeight,
        everyNthFrame: 2,
      });
      streaming = true;

      // ── Listen for navigation events ──
      const onNavigated = async () => {
        if (ws.readyState !== WebSocket.OPEN) return;
        try {
          const title = await page.title();
          ws.send(JSON.stringify({ type: 'navigate', url: page.url(), title }));
        } catch { /* page may be navigating */ }
      };

      const onLoad = async () => {
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: 'loading', loading: false }));
        try {
          const title = await page.title();
          ws.send(JSON.stringify({ type: 'navigate', url: page.url(), title }));
        } catch { /* ignore */ }
      };

      page.on('framenavigated', onNavigated);
      page.on('load', onLoad);

      // ── Handle client messages ──
      ws.on('message', async (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'quality' && typeof msg.quality === 'number') {
            // Restart screencast with new quality
            if (streaming) {
              await cdp.send('Page.stopScreencast').catch(() => {});
            }
            await cdp.send('Page.startScreencast', {
              format: 'jpeg',
              quality: Math.max(10, Math.min(100, msg.quality)),
              maxWidth: session.viewportWidth,
              maxHeight: session.viewportHeight,
              everyNthFrame: 2,
            });
          } else if (msg.type === 'resize' && msg.width && msg.height) {
            session.viewportWidth = msg.width;
            session.viewportHeight = msg.height;
            await page.setViewportSize({ width: msg.width, height: msg.height });
            // Restart screencast with new dimensions
            if (streaming) {
              await cdp.send('Page.stopScreencast').catch(() => {});
            }
            await cdp.send('Page.startScreencast', {
              format: 'jpeg',
              quality: 60,
              maxWidth: msg.width,
              maxHeight: msg.height,
              everyNthFrame: 2,
            });
          }
        } catch { /* ignore parse errors */ }
      });

      // ── Cleanup on close ──
      ws.on('close', async () => {
        page.off('framenavigated', onNavigated);
        page.off('load', onLoad);
        cdp.off('Page.screencastFrame', onFrame);
        if (streaming) {
          await cdp.send('Page.stopScreencast').catch(() => {});
          streaming = false;
        }
      });

    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: (err as Error).message }));
      ws.close(1011, 'Screencast initialization failed');
    }
  });
}
