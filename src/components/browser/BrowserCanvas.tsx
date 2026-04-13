/**
 * BrowserCanvas — Core renderer for Playwright screencast frames.
 *
 * Connects to the local server's WebSocket frame stream, receives binary
 * JPEG frames, and draws them to a <canvas>. Captures mouse and keyboard
 * events and forwards them to the headless browser via REST endpoints.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface BrowserCanvasProps {
  sessionId: string;
  onNavigate?: (url: string, title: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  className?: string;
}

export default function BrowserCanvas({ sessionId, onNavigate, onLoadingChange, className }: BrowserCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [cursor, setCursor] = useState('default');

  // ── WebSocket connection & frame rendering ──
  useEffect(() => {
    if (!sessionId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/local/browser/stream/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = async (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Binary JPEG frame
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        try {
          const blob = new Blob([event.data], { type: 'image/jpeg' });
          const bitmap = await createImageBitmap(blob);

          // Resize canvas to match frame dimensions (only if changed)
          if (canvas.width !== bitmap.width || canvas.height !== bitmap.height) {
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
          }
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
        } catch { /* skip corrupt frame */ }
      } else {
        // Text JSON message
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'navigate' && onNavigate) {
            onNavigate(msg.url, msg.title);
          } else if (msg.type === 'cursor') {
            setCursor(msg.cursor || 'default');
          } else if (msg.type === 'loading' && onLoadingChange) {
            onLoadingChange(msg.loading);
          }
        } catch { /* ignore */ }
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [sessionId, onNavigate, onLoadingChange]);

  // ── Coordinate scaling (canvas display size vs actual pixel size) ──
  const getScaledCoords = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // ── Mouse event handlers ──
  const sendMouse = useCallback(async (type: string, e: React.MouseEvent, clickCount = 0) => {
    if (!sessionId) return;
    const { x, y } = getScaledCoords(e);
    const button = e.button === 2 ? 'right' : e.button === 1 ? 'middle' : 'left';
    try {
      await fetch('/local/browser/input/mouse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, type, x, y, button, clickCount }),
      });
    } catch { /* ignore */ }
  }, [sessionId, getScaledCoords]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    overlayRef.current?.focus();
    sendMouse('mousePressed', e, 1);
  }, [sendMouse]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    sendMouse('mouseReleased', e);
  }, [sendMouse]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Throttle: only send every ~32ms (30fps)
    sendMouse('mouseMoved', e);
  }, [sendMouse]);

  const handleWheel = useCallback(async (e: React.WheelEvent) => {
    if (!sessionId) return;
    const { x, y } = getScaledCoords(e);
    try {
      await fetch('/local/browser/input/scroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, x, y, deltaX: e.deltaX, deltaY: e.deltaY }),
      });
    } catch { /* ignore */ }
  }, [sessionId, getScaledCoords]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent browser context menu
    sendMouse('mousePressed', e, 1);
    sendMouse('mouseReleased', e);
  }, [sendMouse]);

  // ── Keyboard event handlers ──
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionId) return;

    try {
      // Send keyDown
      await fetch('/local/browser/input/keyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, type: 'keyDown', key: e.key, code: e.code }),
      });
      // For printable characters, also send char event
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        await fetch('/local/browser/input/keyboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, type: 'char', text: e.key }),
        });
      }
    } catch { /* ignore */ }
  }, [sessionId]);

  const handleKeyUp = useCallback(async (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sessionId) return;
    try {
      await fetch('/local/browser/input/keyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, type: 'keyUp', key: e.key, code: e.code }),
      });
    } catch { /* ignore */ }
  }, [sessionId]);

  return (
    <div className={`browser-canvas-container ${className || ''}`}>
      <canvas ref={canvasRef} className="browser-canvas" />
      {/* Transparent overlay to capture events without interfering with canvas */}
      <div
        ref={overlayRef}
        className="browser-canvas-overlay"
        tabIndex={0}
        style={{ cursor }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
      />
      {!connected && sessionId && (
        <div className="browser-loading-overlay">
          <div className="view-loader" />
        </div>
      )}
    </div>
  );
}
