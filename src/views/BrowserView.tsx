/**
 * BrowserView — Full interactive browser powered by Playwright screencast.
 *
 * Manages headless Chrome sessions on the local server (port 3100).
 * Streams JPEG frames via WebSocket to a canvas element.
 * Includes Claude AI sidebar for page intelligence.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useBrowserStore } from '../stores/browser';
import BrowserTabStrip from '../components/browser/BrowserTabStrip';
import BrowserUrlBar from '../components/browser/BrowserUrlBar';
import BrowserCanvas from '../components/browser/BrowserCanvas';
import BrowserSidebar from '../components/browser/BrowserSidebar';
import { Globe } from 'lucide-react';
import '../styles/browser.css';

export default function BrowserView() {
  const {
    tabs, sidebarOpen,
    createTab, updateTab, toggleSidebar, addHistoryEntry, getActiveTab,
  } = useBrowserStore();

  const initRef = useRef(false);

  // Create first tab on mount
  useEffect(() => {
    if (!initRef.current && tabs.length === 0) {
      initRef.current = true;
      createTab();
    }
  }, [tabs.length, createTab]);

  const activeTab = getActiveTab();

  // Create Playwright session for a tab that doesn't have one
  useEffect(() => {
    if (!activeTab || activeTab.sessionId) return;

    let cancelled = false;
    (async () => {
      try {
        updateTab(activeTab.id, { loading: true });
        const res = await fetch('/local/browser/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (cancelled) return;
        if (!res.ok) throw new Error('Failed to create browser session');
        const data = await res.json();
        updateTab(activeTab.id, { sessionId: data.sessionId, loading: false });
      } catch {
        if (!cancelled) updateTab(activeTab.id, { loading: false });
      }
    })();

    return () => { cancelled = true; };
  }, [activeTab?.id, activeTab?.sessionId, updateTab]);

  // ── Navigation handlers ──

  const navigate = useCallback(async (url: string) => {
    if (!activeTab?.sessionId) return;
    updateTab(activeTab.id, { loading: true });
    try {
      const res = await fetch('/local/browser/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeTab.sessionId, url }),
      });
      const data = await res.json();
      if (data.url) {
        updateTab(activeTab.id, { url: data.url, title: data.title, loading: false });
        addHistoryEntry(data.url, data.title);
      }
    } catch {
      updateTab(activeTab.id, { loading: false });
    }
  }, [activeTab, updateTab, addHistoryEntry]);

  const goBack = useCallback(async () => {
    if (!activeTab?.sessionId) return;
    try {
      const res = await fetch('/local/browser/back', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeTab.sessionId }),
      });
      const data = await res.json();
      if (data.url) updateTab(activeTab.id, { url: data.url, title: data.title });
    } catch { /* ignore */ }
  }, [activeTab, updateTab]);

  const goForward = useCallback(async () => {
    if (!activeTab?.sessionId) return;
    try {
      const res = await fetch('/local/browser/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeTab.sessionId }),
      });
      const data = await res.json();
      if (data.url) updateTab(activeTab.id, { url: data.url, title: data.title });
    } catch { /* ignore */ }
  }, [activeTab, updateTab]);

  const reload = useCallback(async () => {
    if (!activeTab?.sessionId) return;
    updateTab(activeTab.id, { loading: true });
    try {
      await fetch('/local/browser/reload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeTab.sessionId }),
      });
      updateTab(activeTab.id, { loading: false });
    } catch {
      updateTab(activeTab.id, { loading: false });
    }
  }, [activeTab, updateTab]);

  const handleNavigateEvent = useCallback((url: string, title: string) => {
    if (!activeTab) return;
    updateTab(activeTab.id, { url, title });
    addHistoryEntry(url, title);
  }, [activeTab, updateTab, addHistoryEntry]);

  const handleLoadingChange = useCallback((loading: boolean) => {
    if (!activeTab) return;
    updateTab(activeTab.id, { loading });
  }, [activeTab, updateTab]);

  // ── Close session on tab close ──
  useEffect(() => {
    return () => {
      // Cleanup all sessions on unmount
      tabs.forEach(async (tab) => {
        if (tab.sessionId) {
          try {
            await fetch(`/local/browser/session/${tab.sessionId}`, { method: 'DELETE' });
          } catch { /* ignore */ }
        }
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="browser-view">
      <BrowserTabStrip />
      <BrowserUrlBar
        url={activeTab?.url || ''}
        canGoBack={activeTab?.canGoBack || false}
        canGoForward={activeTab?.canGoForward || false}
        loading={activeTab?.loading || false}
        sidebarOpen={sidebarOpen}
        onNavigate={navigate}
        onBack={goBack}
        onForward={goForward}
        onReload={reload}
        onHome={() => navigate('https://www.google.com')}
        onToggleSidebar={toggleSidebar}
      />

      <div className="browser-content">
        {activeTab?.sessionId ? (
          <BrowserCanvas
            sessionId={activeTab.sessionId}
            onNavigate={handleNavigateEvent}
            onLoadingChange={handleLoadingChange}
          />
        ) : (
          <div className="browser-empty-state">
            <Globe size={48} style={{ color: 'var(--cyan)', opacity: 0.4 }} />
            <h3>MCV Browser</h3>
            <p>Powered by Playwright — a real headless Chrome streamed to your workspace. Claude can read, see, and act on any web page.</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {activeTab?.loading ? 'Starting browser session...' : 'Enter a URL above to get started.'}
            </p>
          </div>
        )}

        {sidebarOpen && activeTab?.sessionId && (
          <BrowserSidebar
            sessionId={activeTab.sessionId}
            pageUrl={activeTab.url}
            onClose={toggleSidebar}
          />
        )}
      </div>
    </div>
  );
}
