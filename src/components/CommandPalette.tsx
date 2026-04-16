import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, ArrowRight, Globe, MessageSquare, FileText, CheckSquare, Users, Hash, Slash, Wrench, Package, Mail, Phone, Clock } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useTheme } from '../stores/theme';
import { ventures } from '../lib/ventures';
import { apiPost } from '../lib/api/client';
import { useKitStore } from '../stores/kits';
import { useCommsActions } from '../stores/comms-actions';
import { cn } from '../lib/utils';
import { scoreItem, getRecentIds, pushRecentId } from '../lib/palette-scoring';
import { SETTINGS_REGISTRY } from '../lib/settings/registry';
import { Settings as SettingsIcon } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────── */

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  action: () => void;
  icon?: React.ReactNode;
  color?: string;
  category: Category;
}

type Category = 'Views' | 'Ventures' | 'Comms' | 'Documents' | 'Tasks' | 'Contacts' | 'Commands' | 'Kits' | 'Settings' | 'Recent';

interface CachedData {
  docs: PaletteItem[];
  tasks: PaletteItem[];
  contacts: PaletteItem[];
  fetched: boolean;
}

/* ─── Slash commands registry ────────────────────────────────────── */

const SLASH_COMMANDS: { name: string; description: string }[] = [
  { name: '/status', description: 'Full system overview (GitHub + Vercel)' },
  { name: '/repos', description: 'List all GitHub repos' },
  { name: '/prs', description: 'Recent pull requests' },
  { name: '/commits', description: 'Recent commits' },
  { name: '/deployments', description: 'Vercel deployment history' },
  { name: '/projects', description: 'Vercel projects list' },
  { name: '/docs', description: 'List documents in library' },
  { name: '/ask', description: 'Query docs with RAG' },
  { name: '/note', description: 'Save a document/note' },
  { name: '/gemini', description: 'Direct Gemini Pro query' },
  { name: '/summarize', description: 'Summarize with Gemini Flash' },
  { name: '/places', description: 'Search Google Places' },
  { name: '/geocode', description: 'Geocode an address' },
  { name: '/help', description: 'Show all commands' },
];

/* ─── Global keyboard shortcut cheat sheet ──────────────────────── */

/**
 * Mirror of the shortcut handlers in App.tsx's useEffect. Kept here so the
 * palette footer can surface them to the user — App.tsx is the source of
 * truth for the bindings; this list is the user-facing documentation.
 * Update both when adding a new shortcut.
 */
interface ShortcutHint {
  keys: string[];      // rendered as <kbd> chips joined by +
  label: string;
  group: 'nav' | 'app';
}

const SHORTCUTS: ShortcutHint[] = [
  { keys: ['⌘', 'K'],           label: 'Command Palette',      group: 'app' },
  { keys: ['⌘', '/'],           label: 'Toggle Chat',          group: 'app' },
  { keys: ['⌘', 'N'],           label: 'Quick Capture',        group: 'app' },
  { keys: ['⌘', 'E'],           label: 'Toggle Global/Venture',group: 'app' },
  { keys: ['⌘', '\\'],          label: 'Toggle Split View',    group: 'app' },
  { keys: ['⌘', ','],           label: 'Open Settings',        group: 'app' },
  { keys: ['⌘', '1-8'],         label: 'Jump to Global View',  group: 'nav' },
  { keys: ['⌘⇧', '1-9'],        label: 'Switch Venture',       group: 'nav' },
  { keys: ['⌥', '1-3'],         label: 'Workspace Preset',     group: 'nav' },
  { keys: ['⌥', '←/→'],         label: 'History Back / Fwd',   group: 'nav' },
];

/* ─── Category order & icons ─────────────────────────────────────── */

const CATEGORY_ORDER: Category[] = ['Recent', 'Views', 'Ventures', 'Comms', 'Kits', 'Documents', 'Tasks', 'Contacts', 'Settings', 'Commands'];

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  Recent: <Clock size={11} />,
  Views: <Globe size={11} />,
  Ventures: <ArrowRight size={11} />,
  Comms: <MessageSquare size={11} />,
  Documents: <FileText size={11} />,
  Tasks: <CheckSquare size={11} />,
  Contacts: <Users size={11} />,
  Commands: <Slash size={11} />,
  Kits: <Wrench size={11} />,
  Settings: <SettingsIcon size={11} />,
};

/* ─── Component ──────────────────────────────────────────────────── */

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<CachedData>({ docs: [], tasks: [], contacts: [], fetched: false });
  const { setView, switchToGlobal, switchToVenture } = useNavigation();
  const { applyGlobalTheme, applyVentureTheme } = useTheme();
  const { getLoadedKits } = useKitStore();

  /* ── Fetch remote data on open ─────────────────────────────────── */

  useEffect(() => {
    if (!open) return;

    // Reset state
    setQuery('');
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 50);

    // If already cached, skip fetch
    if (cacheRef.current.fetched) return;

    let cancelled = false;

    async function fetchAll() {
      const [docsRes, tasksRes, contactsRes] = await Promise.allSettled([
        apiPost<{ documents?: { id: string; title: string; doc_type: string; venture_id: string }[] }>('/api/docs', { action: 'list' }),
        apiPost<{ tasks?: { id: string; title: string; status: string; venture_id: string }[] }>('/api/tasks', { action: 'list' }),
        apiPost<{ contacts?: { id: string; name: string; email: string; company: string; role: string }[] }>('/api/crm', { action: 'list-contacts' }),
      ]);

      const docs: PaletteItem[] = [];
      const tasks: PaletteItem[] = [];
      const contacts: PaletteItem[] = [];

      if (docsRes.status === 'fulfilled' && docsRes.value?.documents) {
        for (const d of docsRes.value.documents) {
          docs.push({
            id: `doc-${d.id}`,
            label: d.title || 'Untitled',
            sublabel: `${d.doc_type || 'doc'} · ${d.venture_id || ''}`,
            icon: <FileText size={14} />,
            category: 'Documents',
            action: () => { setView('docs'); },
          });
        }
      }

      if (tasksRes.status === 'fulfilled' && tasksRes.value?.tasks) {
        for (const t of tasksRes.value.tasks) {
          tasks.push({
            id: `task-${t.id}`,
            label: t.title || 'Untitled task',
            sublabel: `${t.status || 'open'} · ${t.venture_id || ''}`,
            icon: <CheckSquare size={14} />,
            category: 'Tasks',
            action: () => { setView('tasks'); },
          });
        }
      }

      if (contactsRes.status === 'fulfilled' && contactsRes.value?.contacts) {
        for (const c of contactsRes.value.contacts) {
          contacts.push({
            id: `contact-${c.id}`,
            label: c.name || c.email || 'Unknown',
            sublabel: c.company || c.role || c.email || '',
            icon: <Users size={14} />,
            category: 'Contacts',
            action: () => { setView('crm'); },
          });
        }
      }

      if (!cancelled) {
        cacheRef.current = { docs, tasks, contacts, fetched: true };
      }
    }

    fetchAll().catch(() => {
      // Silently fail — static items still work
    });

    return () => { cancelled = true; };
  }, [open, setView]);

  /* ── Build item list ───────────────────────────────────────────── */

  const staticItems: PaletteItem[] = [
    // Views
    { id: 'v-command', label: 'Command Center', sublabel: 'Global overview', category: 'Views', action: () => { switchToGlobal(); applyGlobalTheme(); setView('command-center'); }, icon: <Globe size={14} /> },
    { id: 'v-portfolio', label: 'Portfolio', sublabel: 'Venture health', category: 'Views', action: () => { setView('portfolio'); } },
    { id: 'v-chat', label: 'Open Aegis Chat', sublabel: 'AI assistant', category: 'Views', action: () => { setView('chat'); }, icon: <MessageSquare size={14} /> },
    { id: 'v-intel', label: 'Intelligence', sublabel: 'Documents & RAG', category: 'Views', action: () => { setView('intelligence'); } },
    { id: 'v-treasury', label: 'Treasury', sublabel: 'EDGE & P&L', category: 'Views', action: () => { setView('treasury'); } },
    { id: 'v-ops', label: 'Ops Center', sublabel: 'GitHub & Vercel', category: 'Views', action: () => { setView('ops'); } },
    { id: 'v-eng', label: 'Engineering', sublabel: 'CTO workbench', category: 'Views', action: () => { setView('engineering'); } },
    { id: 'v-docs', label: 'Documentation Hub', sublabel: 'Document management', category: 'Views', action: () => { setView('docs'); } },
    { id: 'v-tasks', label: 'Tasks', sublabel: 'Task management', category: 'Views', action: () => { setView('tasks'); } },
    { id: 'v-prospects', label: 'Prospects', sublabel: 'Onboarding funnel & journeys', category: 'Views', action: () => { setView('prospects'); } },
    { id: 'v-crm', label: 'CRM', sublabel: 'Contacts & deals', category: 'Views', action: () => { setView('crm'); } },
    { id: 'v-comms', label: 'Communications Hub', sublabel: 'Unified messaging & social', category: 'Views', action: () => { setView('comms-hub'); } },
    { id: 'v-sessions', label: 'Sessions', sublabel: 'API & agent sessions', category: 'Views', action: () => { setView('sessions'); } },
    { id: 'v-signals', label: 'Signals', sublabel: 'Market intelligence', category: 'Views', action: () => { setView('signals'); } },
    // Ventures
    ...ventures.map((v) => ({
      id: `venture-${v.id}`,
      label: v.name,
      sublabel: v.tagline,
      color: v.color,
      icon: <ArrowRight size={14} />,
      category: 'Ventures' as Category,
      action: () => { switchToVenture(v.id); applyVentureTheme(v.id); },
    })),
  ];

  const commandItems: PaletteItem[] = SLASH_COMMANDS.map((c) => ({
    id: `cmd-${c.name}`,
    label: c.name,
    sublabel: c.description,
    icon: <Hash size={14} />,
    category: 'Commands' as Category,
    action: () => {
      // Put the command in the chat input by switching to chat and dispatching
      setView('chat');
      // Use a custom event so AegisChat can pick it up
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('aegis-command', { detail: c.name }));
      }, 100);
    },
  }));

  // Kit tools — dynamically built from loaded kits
  const kitItems: PaletteItem[] = [
    {
      id: 'v-kit-store',
      label: 'Kit Store',
      sublabel: 'Browse and manage agent kits',
      icon: <Package size={14} />,
      category: 'Views' as Category,
      action: () => { setView('kit-store'); },
    },
    ...getLoadedKits()
      .filter((k) => k.status === 'loaded')
      .flatMap((kit) =>
        kit.manifest.tools.map((tool) => ({
          id: `kit-${kit.manifest.id}-${tool.name}`,
          label: tool.name.replace(/_/g, ' '),
          sublabel: `${kit.manifest.name} · ${tool.description}`,
          icon: <Wrench size={14} />,
          category: 'Kits' as Category,
          action: () => {
            // Navigate to chat and inject the tool as a prompt
            setView('chat');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('aegis-command', {
                detail: `Use the ${tool.name} tool`,
              }));
            }, 100);
          },
        })),
      ),
  ];

  const { openFab } = useCommsActions();
  const commsItems: PaletteItem[] = [
    { id: 'comms-slack', label: 'Send Slack Message', sublabel: 'Message a channel or DM', category: 'Comms', icon: <Hash size={14} />, action: () => { openFab('slack'); } },
    { id: 'comms-email', label: 'Send Email', sublabel: 'Compose and send via Gmail', category: 'Comms', icon: <Mail size={14} />, action: () => { openFab('email'); } },
    { id: 'comms-sms', label: 'Send SMS', sublabel: 'Text via Twilio', category: 'Comms', icon: <MessageSquare size={14} />, action: () => { openFab('sms'); } },
    { id: 'comms-call', label: 'Make Call', sublabel: 'Voice call via Twilio', category: 'Comms', icon: <Phone size={14} />, action: () => { openFab('call'); } },
  ];

  // Settings deep-links — each registered setting becomes a palette result
  // that opens Settings on its section + highlights the row briefly.
  const settingsItems: PaletteItem[] = SETTINGS_REGISTRY.map((s) => ({
    id: `setting-${s.id}`,
    label: s.label,
    sublabel: s.description || `Settings · ${s.section}`,
    icon: <SettingsIcon size={14} />,
    category: 'Settings' as Category,
    action: () => {
      // Build a URL with the deep-link params SettingsView already handles
      const params = new URLSearchParams({ tab: s.section, setting: s.id });
      window.history.pushState({}, '', `${window.location.pathname}?${params}`);
      setView('settings');
    },
  }));

  const allItems = [
    ...staticItems,
    ...commsItems,
    ...kitItems,
    ...cacheRef.current.docs,
    ...cacheRef.current.tasks,
    ...cacheRef.current.contacts,
    ...settingsItems,
    ...commandItems,
  ];

  /* ── Recent items LRU (localStorage) ───────────────────────────── */

  const [recentIds, setRecentIds] = useState<string[]>(() => getRecentIds());

  /* ── Filter + score ────────────────────────────────────────────── */

  const isSlashQuery = query.startsWith('/');

  const { grouped, flatItems } = useMemo(() => {
    const grouped = new Map<Category, PaletteItem[]>();

    if (!query) {
      // Empty query — show recents at top, then everything in original order
      const byId = new Map(allItems.map((i) => [i.id, i]));
      const recentItems: PaletteItem[] = recentIds
        .map((id) => byId.get(id))
        .filter((x): x is PaletteItem => !!x)
        .map((x) => ({ ...x, category: 'Recent' as Category }));
      if (recentItems.length > 0) grouped.set('Recent', recentItems);
      for (const item of allItems) {
        const list = grouped.get(item.category);
        if (list) list.push(item);
        else grouped.set(item.category, [item]);
      }
    } else {
      // Score every item and keep matches. Slash queries pin Commands to top.
      const scored = allItems
        .map((item) => {
          let s = scoreItem(item.label, item.sublabel, query);
          if (s === 0) return null;
          if (isSlashQuery && item.category === 'Commands') s += 250;
          if (recentIds.includes(item.id)) s += 150;
          return { item, score: s };
        })
        .filter((x): x is { item: PaletteItem; score: number } => x !== null)
        .sort((a, b) => b.score - a.score);

      for (const { item } of scored) {
        const list = grouped.get(item.category);
        if (list) list.push(item);
        else grouped.set(item.category, [item]);
      }
    }

    // Flatten for keyboard navigation, preserving category order
    const flatItems: PaletteItem[] = [];
    for (const cat of CATEGORY_ORDER) {
      const items = grouped.get(cat);
      if (items) flatItems.push(...items);
    }
    return { grouped, flatItems };
  }, [allItems, query, recentIds, isSlashQuery]);

  /* ── Reset index on query change ───────────────────────────────── */

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  /* ── Scroll selected into view ─────────────────────────────────── */

  useEffect(() => {
    if (!resultsRef.current) return;
    const selected = resultsRef.current.querySelector('.palette-item.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  /* ── Handlers ──────────────────────────────────────────────────── */

  const handleSelect = useCallback((item: PaletteItem) => {
    // Track the item in recents for the next palette open. Keyed off the
    // ORIGINAL category-tagged id so re-clicking a recent re-promotes it.
    const next = pushRecentId(item.id);
    setRecentIds(next);
    item.action();
    onClose();
  }, [onClose]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatItems[selectedIndex]) {
      handleSelect(flatItems[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  /* ── Render ────────────────────────────────────────────────────── */

  if (!open) return null;

  // Build a flat index tracker for mapping items -> selectedIndex
  let runningIdx = 0;

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-row">
          <Search size={16} className="palette-search-icon" />
          <input
            ref={inputRef}
            className="palette-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search views, ventures, docs, tasks, contacts..."
          />
          <kbd className="palette-kbd">esc</kbd>
        </div>

        <div className="palette-results" ref={resultsRef}>
          {/* Hint when empty query */}
          {!query && (
            <div className="palette-hint">
              <Slash size={12} />
              <span>Type <strong>/</strong> for commands</span>
            </div>
          )}

          {flatItems.length === 0 && query && (
            <div className="palette-empty">No results for &ldquo;{query}&rdquo;</div>
          )}

          {CATEGORY_ORDER.map((cat) => {
            const items = grouped.get(cat);
            if (!items || items.length === 0) return null;

            const startIdx = runningIdx;
            runningIdx += items.length;

            return (
              <div key={cat} className="palette-group">
                <div className="palette-group-header">
                  <span className="palette-group-icon">{CATEGORY_ICONS[cat]}</span>
                  <span>{cat}</span>
                  <span className="palette-group-count">{items.length}</span>
                </div>
                {items.map((item, i) => {
                  const flatIdx = startIdx + i;
                  return (
                    <button
                      key={item.id}
                      className={cn('palette-item', flatIdx === selectedIndex && 'selected')}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(flatIdx)}
                    >
                      <span className="palette-item-icon" style={item.color ? { color: item.color } : undefined}>
                        {item.icon || <ArrowRight size={14} />}
                      </span>
                      <span className="palette-item-label">{item.label}</span>
                      {item.sublabel && <span className="palette-item-sub">{item.sublabel}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer: pinned keyboard navigation hints always visible; a full
            shortcut cheat sheet shows while the query is empty so users
            can discover the Cmd+1-8 jumps and workspace presets. */}
        <div className="palette-footer">
          <div className="palette-footer-row palette-footer-nav">
            <span className="palette-hint-chip"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span className="palette-hint-chip"><kbd>↵</kbd> Select</span>
            <span className="palette-hint-chip"><kbd>esc</kbd> Close</span>
          </div>
          {!query && (
            <div className="palette-footer-row palette-footer-shortcuts">
              {SHORTCUTS.map((s) => (
                <span key={s.label} className="palette-shortcut">
                  {s.keys.map((k, i) => (
                    <kbd key={i}>{k}</kbd>
                  ))}
                  <span className="palette-shortcut-label">{s.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .palette-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          padding-top: 20vh;
        }

        .palette {
          width: 560px;
          max-height: 480px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: paletteIn 0.15s ease;
        }

        @keyframes paletteIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .palette-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
        }

        .palette-search-icon { color: var(--text-muted); flex-shrink: 0; }

        .palette-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: var(--text-base);
          outline: none;
        }

        .palette-input::placeholder { color: var(--text-muted); }

        .palette-kbd {
          font-size: 9px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 1px 5px;
          border-radius: 3px;
        }

        .palette-results {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
        }

        /* ── Hint ─────────────────────────────────── */

        .palette-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .palette-hint strong {
          color: var(--cyan);
          font-family: var(--font-mono);
          background: var(--bg-card);
          padding: 0 4px;
          border-radius: 3px;
          font-size: 11px;
        }

        /* ── Group headers ────────────────────────── */

        .palette-group {
          margin-bottom: 2px;
        }

        .palette-group-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          user-select: none;
        }

        .palette-group-icon {
          opacity: 0.6;
        }

        .palette-group-count {
          margin-left: auto;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
          background: var(--bg-card);
          padding: 0 5px;
          border-radius: 3px;
          opacity: 0.7;
        }

        /* ── Items ────────────────────────────────── */

        .palette-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          width: 100%;
          text-align: left;
          transition: background 0.05s;
        }

        .palette-item.selected { background: var(--bg-elevated); }

        .palette-item-icon { color: var(--text-muted); flex-shrink: 0; }
        .palette-item-label { font-size: var(--text-sm); font-weight: 500; color: var(--text-primary); }
        .palette-item-sub { font-size: var(--text-xs); color: var(--text-muted); margin-left: auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

        .palette-empty {
          padding: 20px;
          text-align: center;
          font-size: var(--text-sm);
          color: var(--text-muted);
        }

        /* ── Footer: nav hints + (on empty query) shortcut cheat sheet ── */

        .palette-footer {
          flex-shrink: 0;
          border-top: 1px solid var(--border);
          background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.15));
          padding: 6px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .palette-footer-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          color: var(--text-muted);
        }

        .palette-footer-shortcuts {
          padding-top: 6px;
          border-top: 1px dashed rgba(255, 255, 255, 0.05);
          gap: 12px 14px;
        }

        .palette-hint-chip,
        .palette-shortcut {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        .palette-shortcut-label {
          margin-left: 2px;
          color: var(--text-secondary);
        }

        .palette-footer kbd {
          font-family: var(--font-mono);
          font-size: 9px;
          line-height: 1;
          color: var(--text-secondary);
          background: var(--bg-card);
          border: 1px solid var(--border);
          padding: 2px 5px;
          border-radius: 3px;
          box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.3);
          min-width: 14px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
