import type { ViewId } from '../stores/navigation';

export interface NavItem {
  id: ViewId;
  label: string;
  icon: string;  // Lucide icon name
  badge?: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

// Layer 0: Global navigation
export const globalNav: NavItem[] = [
  { id: 'command-center', label: 'Command', icon: 'LayoutGrid' },
  { id: 'portfolio', label: 'Portfolio', icon: 'PieChart' },
  { id: 'chat', label: 'Aegis', icon: 'Bot' },
  { id: 'intelligence', label: 'Intel', icon: 'Brain' },
  { id: 'treasury', label: 'Treasury', icon: 'Landmark' },
  { id: 'ops', label: 'Ops', icon: 'Activity' },
  { id: 'engineering', label: 'Eng', icon: 'Wrench' },
  { id: 'signals', label: 'Signals', icon: 'Radio' },
];

// Layer 1: Venture navigation (base template)
export const ventureNav: NavItem[] = [
  { id: 'venture-dashboard', label: 'Dashboard', icon: 'LayoutGrid' },
  { id: 'chat', label: 'Aegis', icon: 'Bot' },
  { id: 'venture-engineering', label: 'Engineering', icon: 'Wrench' },
  { id: 'venture-growth', label: 'Growth', icon: 'TrendingUp' },
  { id: 'venture-operations', label: 'Operations', icon: 'ClipboardList' },
  { id: 'venture-docs', label: 'Docs', icon: 'FileText' },
];

// Venture product suites (injected into venture nav)
export const ventureProductSuites: Record<string, NavSection> = {
  betedge: {
    id: 'betedge-products',
    label: 'Products',
    items: [
      { id: 'venture-dashboard', label: 'AI Predictions', icon: 'Sparkles' },
      { id: 'venture-dashboard', label: 'Picks Market', icon: 'ShoppingBag' },
      { id: 'venture-dashboard', label: 'Leaderboards', icon: 'Trophy' },
    ],
  },
  futurestate: {
    id: 'futurestate-products',
    label: 'Products',
    items: [
      { id: 'venture-dashboard', label: 'Properties', icon: 'Building' },
      { id: 'venture-dashboard', label: 'Marketplace', icon: 'ArrowLeftRight' },
      { id: 'venture-dashboard', label: 'Yield', icon: 'Coins' },
    ],
  },
  warforge: {
    id: 'warforge-products',
    label: 'Products',
    items: [
      { id: 'venture-dashboard', label: 'Game World', icon: 'Swords' },
      { id: 'venture-dashboard', label: 'Guilds', icon: 'Users' },
      { id: 'venture-dashboard', label: 'Economy', icon: 'Coins' },
    ],
  },
  edgeiq: {
    id: 'edgeiq-products',
    label: 'Products',
    items: [
      { id: 'venture-dashboard', label: 'Markets', icon: 'BarChart3' },
      { id: 'venture-dashboard', label: 'Liquidity', icon: 'Waves' },
      { id: 'venture-dashboard', label: 'Governance', icon: 'Vote' },
    ],
  },
};
