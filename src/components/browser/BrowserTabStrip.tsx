/**
 * BrowserTabStrip — Tab bar for multi-tab browsing.
 */

import { X, Plus } from 'lucide-react';
import { useBrowserStore, type BrowserTab } from '../../stores/browser';

export default function BrowserTabStrip() {
  const { tabs, activeTabId, setActiveTab, closeTab, createTab } = useBrowserStore();

  return (
    <div className="browser-tab-strip">
      {tabs.map((tab: BrowserTab) => (
        <button
          key={tab.id}
          className={`browser-tab ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
          title={tab.url}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tab.title || tab.url || 'New Tab'}
          </span>
          {tabs.length > 1 && (
            <span
              className="browser-tab-close"
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              role="button"
            >
              <X size={10} />
            </span>
          )}
        </button>
      ))}
      <button className="browser-tab-new" onClick={() => createTab()} title="New Tab">
        <Plus size={14} />
      </button>
    </div>
  );
}
