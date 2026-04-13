/**
 * BrowserUrlBar — Navigation controls + URL input for the browser widget.
 */

import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Bot } from 'lucide-react';

interface BrowserUrlBarProps {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
  sidebarOpen: boolean;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onToggleSidebar: () => void;
}

export default function BrowserUrlBar({
  url, canGoBack, canGoForward, loading,
  sidebarOpen, onNavigate, onBack, onForward, onReload, onHome, onToggleSidebar,
}: BrowserUrlBarProps) {
  const [inputValue, setInputValue] = useState(url);

  // Sync input with external URL changes (navigation events from WS)
  useEffect(() => {
    setInputValue(url);
  }, [url]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onNavigate(inputValue.trim());
    }
  }, [inputValue, onNavigate]);

  return (
    <div className="browser-url-bar">
      <button className="browser-nav-btn" onClick={onBack} disabled={!canGoBack} title="Back">
        <ArrowLeft size={16} />
      </button>
      <button className="browser-nav-btn" onClick={onForward} disabled={!canGoForward} title="Forward">
        <ArrowRight size={16} />
      </button>
      <button className="browser-nav-btn" onClick={onReload} title="Reload">
        <RotateCw size={14} className={loading ? 'spin' : ''} />
      </button>
      <button className="browser-nav-btn" onClick={onHome} title="Home">
        <Home size={14} />
      </button>
      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex' }}>
        <input
          className="browser-url-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter URL or search..."
          spellCheck={false}
        />
      </form>
      <button
        className={`browser-sidebar-toggle ${sidebarOpen ? 'active' : ''}`}
        onClick={onToggleSidebar}
        title="Claude AI Sidebar"
      >
        <Bot size={16} />
      </button>
    </div>
  );
}
