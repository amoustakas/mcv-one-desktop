import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewId } from './navigation';

// ── Tab & Panel Types ──

export interface PanelTab {
  id: string;
  viewId: ViewId;
  pinned?: boolean;
  label?: string;       // custom label override
}

export interface PanelNode {
  id: string;
  type: 'view';
  tabs: PanelTab[];
  activeTabId: string;
  locked?: boolean;
  pinned?: boolean;
}

export interface SplitNode {
  id: string;
  type: 'split';
  direction: 'horizontal' | 'vertical';
  ratio: number; // 0.0 to 1.0
  children: [LayoutNode, LayoutNode];
}

export type LayoutNode = PanelNode | SplitNode;

export interface LayoutTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  cols: number;
  tree: LayoutNode;
}

// ── Floating Panels ──

export interface FloatingPanel {
  id: string;
  tabs: PanelTab[];
  activeTabId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized?: boolean;
  locked?: boolean;
}

// ── Helpers ──

let _id = 0;
function pid(): string { return `p${++_id}`; }
function tid(): string { return `t${++_id}`; }

/** Generate a unique ID */
export function genId(): string { return `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

function genTabId(): string { return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

/** Create a single-tab PanelNode */
function makePanel(viewId: ViewId, panelId?: string): PanelNode {
  const id = panelId || genId();
  const tabId = genTabId();
  return { id, type: 'view', tabs: [{ id: tabId, viewId }], activeTabId: tabId };
}

/** Get the active viewId for a panel (what's displayed) */
export function getPanelViewId(panel: PanelNode): ViewId {
  const activeTab = panel.tabs.find(t => t.id === panel.activeTabId);
  return activeTab?.viewId ?? panel.tabs[0]?.viewId ?? 'command-center';
}

// ── Preset Templates ──

function tpl(viewId: ViewId): PanelNode {
  const panelId = pid();
  const tabId = tid();
  return { id: panelId, type: 'view', tabs: [{ id: tabId, viewId }], activeTabId: tabId };
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'single', name: 'Single', icon: '▣', description: '1 panel', cols: 1,
    tree: tpl('command-center'),
  },
  {
    id: '2-h', name: 'Side by Side', icon: '◫', description: '2 panels horizontal', cols: 2,
    tree: { id: pid(), type: 'split', direction: 'horizontal', ratio: 0.5, children: [
      tpl('command-center'),
      tpl('chat'),
    ]},
  },
  {
    id: '2-v', name: 'Top & Bottom', icon: '⬓', description: '2 panels vertical', cols: 2,
    tree: { id: pid(), type: 'split', direction: 'vertical', ratio: 0.5, children: [
      tpl('command-center'),
      tpl('tasks'),
    ]},
  },
  {
    id: '3-right', name: '1 + 2 Right', icon: '⊞', description: '1 main + 2 stacked right', cols: 3,
    tree: { id: pid(), type: 'split', direction: 'horizontal', ratio: 0.6, children: [
      tpl('command-center'),
      { id: pid(), type: 'split', direction: 'vertical', ratio: 0.5, children: [
        tpl('chat'),
        tpl('tasks'),
      ]},
    ]},
  },
  {
    id: '3-bottom', name: '2 + 1 Bottom', icon: '⏛', description: '2 top + 1 bottom', cols: 3,
    tree: { id: pid(), type: 'split', direction: 'vertical', ratio: 0.6, children: [
      { id: pid(), type: 'split', direction: 'horizontal', ratio: 0.5, children: [
        tpl('command-center'),
        tpl('engineering'),
      ]},
      tpl('chat'),
    ]},
  },
  {
    id: '4-grid', name: '2×2 Grid', icon: '⊞', description: '4 panels in a grid', cols: 4,
    tree: { id: pid(), type: 'split', direction: 'vertical', ratio: 0.5, children: [
      { id: pid(), type: 'split', direction: 'horizontal', ratio: 0.5, children: [
        tpl('command-center'),
        tpl('engineering'),
      ]},
      { id: pid(), type: 'split', direction: 'horizontal', ratio: 0.5, children: [
        tpl('tasks'),
        tpl('chat'),
      ]},
    ]},
  },
  {
    id: '4-focus', name: 'Focus + 3', icon: '◧', description: '1 large + 3 small', cols: 4,
    tree: { id: pid(), type: 'split', direction: 'horizontal', ratio: 0.55, children: [
      tpl('command-center'),
      { id: pid(), type: 'split', direction: 'vertical', ratio: 0.33, children: [
        tpl('chat'),
        { id: pid(), type: 'split', direction: 'vertical', ratio: 0.5, children: [
          tpl('tasks'),
          tpl('docs'),
        ]},
      ]},
    ]},
  },
];

// ── Tree Helper Functions ──

/** Count total panels in a layout tree */
export function countPanels(node: LayoutNode): number {
  if (node.type === 'view') return 1;
  return countPanels(node.children[0]) + countPanels(node.children[1]);
}

/** Get all view IDs in a layout tree */
export function getViewIds(node: LayoutNode): ViewId[] {
  if (node.type === 'view') return [getPanelViewId(node)];
  return [...getViewIds(node.children[0]), ...getViewIds(node.children[1])];
}

/** Find a panel node by ID */
function findPanel(node: LayoutNode, panelId: string): PanelNode | null {
  if (node.type === 'view') return node.id === panelId ? node : null;
  return findPanel(node.children[0], panelId) || findPanel(node.children[1], panelId);
}

/** Replace a panel's active view (sets the active tab's viewId) */
function replaceView(node: LayoutNode, panelId: string, newViewId: ViewId): LayoutNode {
  if (node.type === 'view') {
    if (node.id !== panelId) return node;
    const tabs = node.tabs.map(t => t.id === node.activeTabId ? { ...t, viewId: newViewId } : t);
    return { ...node, tabs };
  }
  return {
    ...node,
    children: [
      replaceView(node.children[0], panelId, newViewId),
      replaceView(node.children[1], panelId, newViewId),
    ] as [LayoutNode, LayoutNode],
  };
}

/** Update a split ratio by split node ID */
function updateRatio(node: LayoutNode, splitId: string, ratio: number): LayoutNode {
  if (node.type === 'view') return node;
  if (node.id === splitId) return { ...node, ratio: Math.max(0.1, Math.min(0.9, ratio)) };
  return {
    ...node,
    children: [
      updateRatio(node.children[0], splitId, ratio),
      updateRatio(node.children[1], splitId, ratio),
    ] as [LayoutNode, LayoutNode],
  };
}

/** Split an existing panel into two */
function splitPanel(node: LayoutNode, panelId: string, direction: 'horizontal' | 'vertical', newViewId: ViewId): LayoutNode {
  if (node.type === 'view') {
    if (node.id === panelId) {
      return {
        id: genId(),
        type: 'split',
        direction,
        ratio: 0.5,
        children: [
          node, // keep original
          makePanel(newViewId),
        ],
      };
    }
    return node;
  }
  return {
    ...node,
    children: [
      splitPanel(node.children[0], panelId, direction, newViewId),
      splitPanel(node.children[1], panelId, direction, newViewId),
    ] as [LayoutNode, LayoutNode],
  };
}

/** Close a panel — replace the parent split with the sibling */
function closePanelNode(node: LayoutNode, panelId: string): LayoutNode | null {
  if (node.type === 'view') return node.id === panelId ? null : node;
  const left = closePanelNode(node.children[0], panelId);
  const right = closePanelNode(node.children[1], panelId);
  if (left === null) return right || node.children[1];
  if (right === null) return left || node.children[0];
  return { ...node, children: [left, right] as [LayoutNode, LayoutNode] };
}

/** Update a panel node in the tree */
function updatePanel(node: LayoutNode, panelId: string, updater: (p: PanelNode) => PanelNode): LayoutNode {
  if (node.type === 'view') {
    return node.id === panelId ? updater(node) : node;
  }
  return {
    ...node,
    children: [
      updatePanel(node.children[0], panelId, updater),
      updatePanel(node.children[1], panelId, updater),
    ] as [LayoutNode, LayoutNode],
  };
}

function getViewInPanel(node: LayoutNode, panelId: string): ViewId | null {
  if (node.type === 'view') return node.id === panelId ? getPanelViewId(node) : null;
  return getViewInPanel(node.children[0], panelId) || getViewInPanel(node.children[1], panelId);
}

// ── Migration: v0 (viewId) → v1 (tabs) ──

function migrateLayout(node: any): LayoutNode {
  if (node.type === 'view') {
    // Old format had viewId directly, no tabs
    if (!node.tabs) {
      const tabId = genTabId();
      return {
        id: node.id,
        type: 'view',
        tabs: [{ id: tabId, viewId: node.viewId || 'command-center' }],
        activeTabId: tabId,
        locked: node.locked,
        pinned: node.pinned,
      };
    }
    return node as PanelNode;
  }
  if (node.type === 'split') {
    return {
      ...node,
      children: [
        migrateLayout(node.children[0]),
        migrateLayout(node.children[1]),
      ] as [LayoutNode, LayoutNode],
    };
  }
  // Fallback
  const tabId = genTabId();
  return { id: genId(), type: 'view', tabs: [{ id: tabId, viewId: 'command-center' }], activeTabId: tabId };
}

// ── Store ──

interface WorkspaceState {
  layout: LayoutNode;
  activeTemplateId: string;
  activePanelId: string | null;

  // Floating panels
  floatingPanels: FloatingPanel[];

  // Layout actions
  applyTemplate: (templateId: string, views?: ViewId[]) => void;
  setLayout: (layout: LayoutNode) => void;
  setPanelView: (panelId: string, viewId: ViewId) => void;
  setSplitRatio: (splitId: string, ratio: number) => void;
  splitPanelWith: (panelId: string, direction: 'horizontal' | 'vertical', viewId: ViewId) => void;
  closePanel: (panelId: string) => void;
  setActivePanel: (panelId: string | null) => void;
  swapPanels: (panelA: string, panelB: string) => void;

  // Tab actions
  addTab: (panelId: string, viewId: ViewId, opts?: { pinned?: boolean; insertAfter?: string }) => void;
  closeTab: (panelId: string, tabId: string) => void;
  setActiveTab: (panelId: string, tabId: string) => void;
  moveTab: (fromPanel: string, tabId: string, toPanel: string, insertIndex: number) => void;
  reorderTab: (panelId: string, tabId: string, newIndex: number) => void;
  pinTab: (panelId: string, tabId: string) => void;
  unpinTab: (panelId: string, tabId: string) => void;

  // Panel metadata
  lockPanel: (panelId: string) => void;
  unlockPanel: (panelId: string) => void;
  pinPanel: (panelId: string) => void;
  unpinPanel: (panelId: string) => void;

  // Floating panel actions
  detachPanel: (panelId: string) => void;
  dockPanel: (floatId: string, targetPanelId: string, position: 'top' | 'bottom' | 'left' | 'right') => void;
  updateFloatingPanel: (id: string, updates: Partial<FloatingPanel>) => void;
  closeFloatingPanel: (id: string) => void;
  bringToFront: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, _get) => ({
      layout: LAYOUT_TEMPLATES[0].tree,
      activeTemplateId: 'single',
      activePanelId: null,
      floatingPanels: [],

      // ── Layout Actions ──

      applyTemplate: (templateId, views) => {
        const template = LAYOUT_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        function cloneWithIds(node: LayoutNode): LayoutNode {
          if (node.type === 'view') {
            const newTabId = genTabId();
            return {
              ...node,
              id: genId(),
              tabs: node.tabs.map(t => ({ ...t, id: newTabId })),
              activeTabId: newTabId,
            };
          }
          return {
            ...node, id: genId(),
            children: [cloneWithIds(node.children[0]), cloneWithIds(node.children[1])] as [LayoutNode, LayoutNode],
          };
        }
        let tree = cloneWithIds(template.tree);

        if (views?.length) {
          const panelIds: string[] = [];
          function collectIds(n: LayoutNode) {
            if (n.type === 'view') panelIds.push(n.id);
            else { collectIds(n.children[0]); collectIds(n.children[1]); }
          }
          collectIds(tree);
          views.forEach((v, i) => {
            if (panelIds[i]) tree = replaceView(tree, panelIds[i], v);
          });
        }

        set({ layout: tree, activeTemplateId: templateId });
      },

      setLayout: (layout) => set({ layout }),

      setPanelView: (panelId, viewId) =>
        set((s) => ({ layout: replaceView(s.layout, panelId, viewId) })),

      setSplitRatio: (splitId, ratio) =>
        set((s) => ({ layout: updateRatio(s.layout, splitId, ratio) })),

      splitPanelWith: (panelId, direction, viewId) =>
        set((s) => ({ layout: splitPanel(s.layout, panelId, direction, viewId) })),

      closePanel: (panelId) =>
        set((s) => {
          const result = closePanelNode(s.layout, panelId);
          return result ? { layout: result } : {};
        }),

      setActivePanel: (panelId) => set({ activePanelId: panelId }),

      swapPanels: (panelA, panelB) =>
        set((s) => {
          const viewA = getViewInPanel(s.layout, panelA);
          const viewB = getViewInPanel(s.layout, panelB);
          if (!viewA || !viewB) return {};
          let tree = replaceView(s.layout, panelA, viewB);
          tree = replaceView(tree, panelB, viewA);
          return { layout: tree };
        }),

      // ── Tab Actions ──

      addTab: (panelId, viewId, opts) =>
        set((s) => ({
          layout: updatePanel(s.layout, panelId, (p) => {
            if (p.locked) return p;
            const newTab: PanelTab = { id: genTabId(), viewId, pinned: opts?.pinned };
            let tabs = [...p.tabs];
            if (opts?.insertAfter) {
              const idx = tabs.findIndex(t => t.id === opts.insertAfter);
              tabs.splice(idx + 1, 0, newTab);
            } else {
              // Insert after last non-pinned tab
              const lastPinned = tabs.reduce((acc, t, i) => t.pinned ? i : acc, -1);
              tabs.splice(lastPinned + 1, 0, newTab);
            }
            return { ...p, tabs, activeTabId: newTab.id };
          }),
        })),

      closeTab: (panelId, tabId) =>
        set((s) => {
          const panel = findPanel(s.layout, panelId);
          if (!panel || panel.locked) return {};
          const tab = panel.tabs.find(t => t.id === tabId);
          if (tab?.pinned) return {}; // can't close pinned tabs

          // If this is the last tab, close the panel
          if (panel.tabs.length <= 1) {
            const result = closePanelNode(s.layout, panelId);
            return result ? { layout: result } : {};
          }

          return {
            layout: updatePanel(s.layout, panelId, (p) => {
              const tabs = p.tabs.filter(t => t.id !== tabId);
              let activeTabId = p.activeTabId;
              if (activeTabId === tabId) {
                // Activate the neighbor
                const oldIdx = p.tabs.findIndex(t => t.id === tabId);
                activeTabId = tabs[Math.min(oldIdx, tabs.length - 1)]?.id ?? tabs[0]?.id;
              }
              return { ...p, tabs, activeTabId };
            }),
          };
        }),

      setActiveTab: (panelId, tabId) =>
        set((s) => ({
          layout: updatePanel(s.layout, panelId, (p) => ({ ...p, activeTabId: tabId })),
        })),

      moveTab: (fromPanel, tabId, toPanel, insertIndex) =>
        set((s) => {
          const srcPanel = findPanel(s.layout, fromPanel);
          if (!srcPanel) return {};
          const tab = srcPanel.tabs.find(t => t.id === tabId);
          if (!tab) return {};

          let layout = s.layout;

          // Remove from source
          if (srcPanel.tabs.length <= 1) {
            // Last tab — close source panel
            const result = closePanelNode(layout, fromPanel);
            if (!result) return {};
            layout = result;
          } else {
            layout = updatePanel(layout, fromPanel, (p) => {
              const tabs = p.tabs.filter(t => t.id !== tabId);
              let activeTabId = p.activeTabId;
              if (activeTabId === tabId) {
                const oldIdx = p.tabs.findIndex(t => t.id === tabId);
                activeTabId = tabs[Math.min(oldIdx, tabs.length - 1)]?.id ?? tabs[0]?.id;
              }
              return { ...p, tabs, activeTabId };
            });
          }

          // Add to target
          layout = updatePanel(layout, toPanel, (p) => {
            const tabs = [...p.tabs];
            const idx = Math.max(0, Math.min(insertIndex, tabs.length));
            tabs.splice(idx, 0, tab);
            return { ...p, tabs, activeTabId: tab.id };
          });

          return { layout };
        }),

      reorderTab: (panelId, tabId, newIndex) =>
        set((s) => ({
          layout: updatePanel(s.layout, panelId, (p) => {
            const tabs = [...p.tabs];
            const oldIdx = tabs.findIndex(t => t.id === tabId);
            if (oldIdx === -1) return p;
            const [tab] = tabs.splice(oldIdx, 1);
            const idx = Math.max(0, Math.min(newIndex, tabs.length));
            tabs.splice(idx, 0, tab);
            return { ...p, tabs };
          }),
        })),

      pinTab: (panelId, tabId) =>
        set((s) => ({
          layout: updatePanel(s.layout, panelId, (p) => {
            const tabs = p.tabs.map(t => t.id === tabId ? { ...t, pinned: true } : t);
            // Move pinned tabs to the front
            const pinned = tabs.filter(t => t.pinned);
            const unpinned = tabs.filter(t => !t.pinned);
            return { ...p, tabs: [...pinned, ...unpinned] };
          }),
        })),

      unpinTab: (panelId, tabId) =>
        set((s) => ({
          layout: updatePanel(s.layout, panelId, (p) => ({
            ...p,
            tabs: p.tabs.map(t => t.id === tabId ? { ...t, pinned: false } : t),
          })),
        })),

      // ── Panel Metadata ──

      lockPanel: (panelId) =>
        set((s) => ({ layout: updatePanel(s.layout, panelId, (p) => ({ ...p, locked: true })) })),

      unlockPanel: (panelId) =>
        set((s) => ({ layout: updatePanel(s.layout, panelId, (p) => ({ ...p, locked: false })) })),

      pinPanel: (panelId) =>
        set((s) => ({ layout: updatePanel(s.layout, panelId, (p) => ({ ...p, pinned: true })) })),

      unpinPanel: (panelId) =>
        set((s) => ({ layout: updatePanel(s.layout, panelId, (p) => ({ ...p, pinned: false })) })),

      // ── Floating Panel Actions ──

      detachPanel: (panelId) =>
        set((s) => {
          const panel = findPanel(s.layout, panelId);
          if (!panel) return {};

          const floating: FloatingPanel = {
            id: genId(),
            tabs: [...panel.tabs],
            activeTabId: panel.activeTabId,
            x: Math.round(window.innerWidth / 2 - 300),
            y: Math.round(window.innerHeight / 2 - 200),
            width: 600,
            height: 400,
            zIndex: 200 + s.floatingPanels.length,
            locked: panel.locked,
          };

          const result = closePanelNode(s.layout, panelId);
          return {
            layout: result || s.layout,
            floatingPanels: [...s.floatingPanels, floating],
          };
        }),

      dockPanel: (floatId, targetPanelId, position) =>
        set((s) => {
          const floating = s.floatingPanels.find(f => f.id === floatId);
          if (!floating) return {};

          const newPanel = makePanel(getPanelViewId({ ...floating, type: 'view', id: floatId } as any));
          // Copy tabs from floating
          const tabPanel: PanelNode = {
            ...newPanel,
            tabs: floating.tabs,
            activeTabId: floating.activeTabId,
            locked: floating.locked,
          };

          const dir = position === 'left' || position === 'right' ? 'horizontal' : 'vertical';
          const layout = splitPanel(s.layout, targetPanelId, dir, 'command-center');

          // Replace the new panel with our tabbed panel
          function replaceNewPanel(node: LayoutNode): LayoutNode {
            if (node.type === 'view' && getPanelViewId(node) === 'command-center' && node.id !== targetPanelId) {
              return tabPanel;
            }
            if (node.type === 'split') {
              return {
                ...node,
                children: [replaceNewPanel(node.children[0]), replaceNewPanel(node.children[1])] as [LayoutNode, LayoutNode],
              };
            }
            return node;
          }

          return {
            layout: replaceNewPanel(layout),
            floatingPanels: s.floatingPanels.filter(f => f.id !== floatId),
          };
        }),

      updateFloatingPanel: (id, updates) =>
        set((s) => ({
          floatingPanels: s.floatingPanels.map(f => f.id === id ? { ...f, ...updates } : f),
        })),

      closeFloatingPanel: (id) =>
        set((s) => ({
          floatingPanels: s.floatingPanels.filter(f => f.id !== id),
        })),

      bringToFront: (id) =>
        set((s) => {
          const maxZ = Math.max(200, ...s.floatingPanels.map(f => f.zIndex));
          return {
            floatingPanels: s.floatingPanels.map(f => f.id === id ? { ...f, zIndex: maxZ + 1 } : f),
          };
        }),
    }),
    {
      name: 'mcv-workspace',
      version: 1,
      partialize: (s) => ({ layout: s.layout, activeTemplateId: s.activeTemplateId, floatingPanels: s.floatingPanels }),
      migrate: (persisted: any, version: number) => {
        if (version === 0 && persisted?.layout) {
          // Migrate from v0 (viewId-only panels) to v1 (tabbed panels)
          return { ...persisted, layout: migrateLayout(persisted.layout), floatingPanels: persisted.floatingPanels || [] };
        }
        return persisted;
      },
    },
  ),
);
