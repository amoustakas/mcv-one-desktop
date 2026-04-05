import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewId } from './navigation';

// ── Layout Types ──

export interface PanelNode {
  id: string;
  type: 'view';
  viewId: ViewId;
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
  cols: number; // visual hint for the picker grid
  tree: LayoutNode;
}

// ── Preset Templates ──

let _id = 0;
function pid(): string { return `p${++_id}`; }

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'single', name: 'Single', icon: '▣', description: '1 panel', cols: 1,
    tree: { id: pid(), type: 'view', viewId: 'command-center' },
  },
  {
    id: '2-h', name: 'Side by Side', icon: '◫', description: '2 panels horizontal', cols: 2,
    tree: { id: pid(), type: 'split', direction: 'horizontal', ratio: 0.5, children: [
      { id: pid(), type: 'view', viewId: 'command-center' },
      { id: pid(), type: 'view', viewId: 'chat' },
    ]},
  },
  {
    id: '2-v', name: 'Top & Bottom', icon: '⬓', description: '2 panels vertical', cols: 2,
    tree: { id: pid(), type: 'split', direction: 'vertical', ratio: 0.5, children: [
      { id: pid(), type: 'view', viewId: 'command-center' },
      { id: pid(), type: 'view', viewId: 'tasks' },
    ]},
  },
  {
    id: '3-right', name: '1 + 2 Right', icon: '⊞', description: '1 main + 2 stacked right', cols: 3,
    tree: { id: pid(), type: 'split', direction: 'horizontal', ratio: 0.6, children: [
      { id: pid(), type: 'view', viewId: 'command-center' },
      { id: pid(), type: 'split', direction: 'vertical', ratio: 0.5, children: [
        { id: pid(), type: 'view', viewId: 'chat' },
        { id: pid(), type: 'view', viewId: 'tasks' },
      ]},
    ]},
  },
  {
    id: '3-bottom', name: '2 + 1 Bottom', icon: '⏛', description: '2 top + 1 bottom', cols: 3,
    tree: { id: pid(), type: 'split', direction: 'vertical', ratio: 0.6, children: [
      { id: pid(), type: 'split', direction: 'horizontal', ratio: 0.5, children: [
        { id: pid(), type: 'view', viewId: 'command-center' },
        { id: pid(), type: 'view', viewId: 'engineering' },
      ]},
      { id: pid(), type: 'view', viewId: 'chat' },
    ]},
  },
  {
    id: '4-grid', name: '2×2 Grid', icon: '⊞', description: '4 panels in a grid', cols: 4,
    tree: { id: pid(), type: 'split', direction: 'vertical', ratio: 0.5, children: [
      { id: pid(), type: 'split', direction: 'horizontal', ratio: 0.5, children: [
        { id: pid(), type: 'view', viewId: 'command-center' },
        { id: pid(), type: 'view', viewId: 'engineering' },
      ]},
      { id: pid(), type: 'split', direction: 'horizontal', ratio: 0.5, children: [
        { id: pid(), type: 'view', viewId: 'tasks' },
        { id: pid(), type: 'view', viewId: 'chat' },
      ]},
    ]},
  },
  {
    id: '4-focus', name: 'Focus + 3', icon: '◧', description: '1 large + 3 small', cols: 4,
    tree: { id: pid(), type: 'split', direction: 'horizontal', ratio: 0.55, children: [
      { id: pid(), type: 'view', viewId: 'command-center' },
      { id: pid(), type: 'split', direction: 'vertical', ratio: 0.33, children: [
        { id: pid(), type: 'view', viewId: 'chat' },
        { id: pid(), type: 'split', direction: 'vertical', ratio: 0.5, children: [
          { id: pid(), type: 'view', viewId: 'tasks' },
          { id: pid(), type: 'view', viewId: 'docs' },
        ]},
      ]},
    ]},
  },
];

// ── Helper Functions ──

/** Generate a unique panel ID */
function genId(): string { return `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

/** Count total panels in a layout tree */
export function countPanels(node: LayoutNode): number {
  if (node.type === 'view') return 1;
  return countPanels(node.children[0]) + countPanels(node.children[1]);
}

/** Get all view IDs in a layout tree */
export function getViewIds(node: LayoutNode): ViewId[] {
  if (node.type === 'view') return [node.viewId];
  return [...getViewIds(node.children[0]), ...getViewIds(node.children[1])];
}

/** Find a panel by ID and replace its view */
function replaceView(node: LayoutNode, panelId: string, newViewId: ViewId): LayoutNode {
  if (node.type === 'view') {
    return node.id === panelId ? { ...node, viewId: newViewId } : node;
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
          { id: genId(), type: 'view', viewId: newViewId },
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
function closePanel(node: LayoutNode, panelId: string): LayoutNode | null {
  if (node.type === 'view') return node.id === panelId ? null : node;
  const left = closePanel(node.children[0], panelId);
  const right = closePanel(node.children[1], panelId);
  if (left === null) return right || node.children[1];
  if (right === null) return left || node.children[0];
  return { ...node, children: [left, right] as [LayoutNode, LayoutNode] };
}

// ── Store ──

interface WorkspaceState {
  layout: LayoutNode;
  activeTemplateId: string;
  activePanelId: string | null; // which panel is "focused"

  // Actions
  applyTemplate: (templateId: string, views?: ViewId[]) => void;
  setLayout: (layout: LayoutNode) => void;
  setPanelView: (panelId: string, viewId: ViewId) => void;
  setSplitRatio: (splitId: string, ratio: number) => void;
  splitPanelWith: (panelId: string, direction: 'horizontal' | 'vertical', viewId: ViewId) => void;
  closePanel: (panelId: string) => void;
  setActivePanel: (panelId: string | null) => void;
  swapPanels: (panelA: string, panelB: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      layout: LAYOUT_TEMPLATES[0].tree,
      activeTemplateId: 'single',
      activePanelId: null,

      applyTemplate: (templateId, views) => {
        const template = LAYOUT_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        // Deep clone the template tree with fresh IDs
        function cloneWithIds(node: LayoutNode): LayoutNode {
          if (node.type === 'view') return { ...node, id: genId() };
          return {
            ...node, id: genId(),
            children: [cloneWithIds(node.children[0]), cloneWithIds(node.children[1])] as [LayoutNode, LayoutNode],
          };
        }
        let tree = cloneWithIds(template.tree);

        // If custom views provided, apply them to the panels in order
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
          const result = closePanel(s.layout, panelId);
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
    }),
    {
      name: 'mcv-workspace',
      partialize: (s) => ({ layout: s.layout, activeTemplateId: s.activeTemplateId }),
    },
  ),
);

function getViewInPanel(node: LayoutNode, panelId: string): ViewId | null {
  if (node.type === 'view') return node.id === panelId ? node.viewId : null;
  return getViewInPanel(node.children[0], panelId) || getViewInPanel(node.children[1], panelId);
}
