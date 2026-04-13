/**
 * Shared view metadata — icons, labels, and category mappings
 * Used by NavRail, PanelTabBar, WorkspaceRenderer, and context menus
 */
import {
  LayoutGrid, PieChart, Bot, Brain, Landmark, Activity,
  Wrench, Radio, Settings, CheckSquare, Users, Hammer,
  BookOpen, Monitor, Sparkles, Wand2, Swords, TrendingUp,
  FileText, Package, Database, GitBranch, Radar, MessageSquare,
  FolderOpen, Archive, Megaphone, Cpu, Grid3x3, AudioLines,
  MonitorSmartphone, ShoppingCart, BarChart3, CreditCard, Receipt,
  Tag, Banknote, FileBarChart, BookMarked, Shield, Truck, Star,
  Gift, Users2, Layers, Percent, SlidersHorizontal,
  Globe, MonitorPlay,
  Mail, Calendar, HardDrive, Table, FileEdit, ListTodo,
  type LucideIcon,
} from 'lucide-react';
import type { ViewId } from '../stores/navigation';

// ── Icon map ──
export const VIEW_ICONS: Record<string, LucideIcon> = {
  'command-center': LayoutGrid, portfolio: PieChart, chat: Bot,
  intelligence: Brain, treasury: Landmark, signals: Radio,
  engineering: Wrench, ops: Activity, forge: Hammer, sessions: Monitor, 'war-room': Swords,
  crm: Users, growth: TrendingUp, 'comms-hub': MessageSquare,
  tasks: CheckSquare, docs: BookOpen, team: Users,
  'ai-studio': Sparkles, 'prompt-composer': Wand2,
  'kit-store': Package, 'control-room': Radar,
  'device-hub': Cpu, 'stream-deck': Grid3x3,
  'audio-router': AudioLines, 'connected-sessions': MonitorSmartphone,
  memory: Database, pipeline: GitBranch, settings: Settings,
  'commerce-overview': ShoppingCart, 'commerce-products': Tag,
  'commerce-subscriptions': CreditCard, 'commerce-invoices': Receipt,
  'commerce-orders': Package, 'commerce-credits': CreditCard,
  'commerce-loans': Banknote, 'commerce-tax': Receipt,
  'commerce-customers': Users2, 'commerce-inventory': Layers,
  'commerce-fulfillment': Truck, 'commerce-discounts': Percent,
  'commerce-reviews': Star, 'commerce-gift-cards': Gift,
  'commerce-analytics': BarChart3, 'commerce-shop-settings': SlidersHorizontal,
  'venture-commerce': ShoppingCart, 'venture-products': Tag,
  'venture-subscriptions': CreditCard,
  'financials-dashboard': BarChart3, 'financials-statements': FileBarChart,
  'financials-cost-intelligence': TrendingUp, 'financials-ledger': BookMarked,
  'financials-reporting': FileBarChart, 'venture-financials': BarChart3,
  'creator-hub': Sparkles, 'creator-royalties': CreditCard, 'creator-escrow': Landmark,
  'venture-dashboard': LayoutGrid, 'venture-profile': FileText,
  'venture-engineering': Wrench, 'venture-growth': TrendingUp,
  'venture-operations': Activity, 'venture-docs': BookOpen,
  'venture-forge': Hammer, 'venture-tasks': CheckSquare,
  'venture-settings': Settings, 'venture-onboarding': LayoutGrid,
  files: FolderOpen, 'venture-workspace': Archive, 'ad-studio': Megaphone,
  'naos-command': Shield,
  browser: Globe, 'youtube-player': MonitorPlay,
  gmail: Mail, calendar: Calendar, drive: HardDrive,
  sheets: Table, 'google-docs': FileEdit, 'google-tasks': ListTodo,
};

// ── Label map ──
export const VIEW_LABELS: Record<string, string> = {
  'command-center': 'Command Center', portfolio: 'Portfolio', chat: 'Aegis AI',
  intelligence: 'Knowledge Base', treasury: 'Treasury', signals: 'Signals',
  engineering: 'Engineering', ops: 'Operations', forge: 'The Forge',
  sessions: 'Sessions', 'war-room': 'War Room', crm: 'CRM',
  growth: 'Growth', tasks: 'Tasks', docs: 'Documents',
  'comms-hub': 'Comms Hub', 'ad-studio': 'Ad Studio',
  'ai-studio': 'AI Studio', 'prompt-composer': 'Prompt Composer',
  team: 'Team', settings: 'Settings', 'kit-store': 'Kit Store',
  memory: 'Memory Hub', pipeline: 'Pipeline', 'control-room': 'Control Room',
  'device-hub': 'Device Hub', 'stream-deck': 'Stream Deck',
  'audio-router': 'Audio Router', 'connected-sessions': 'Connected Sessions',
  files: 'Files', 'venture-workspace': 'Workspace', 'naos-command': 'NAOS Command',
  'commerce-overview': 'Commerce', 'commerce-products': 'Products',
  'commerce-orders': 'Orders', 'commerce-customers': 'Customers',
  'commerce-subscriptions': 'Subscriptions', 'commerce-inventory': 'Inventory',
  'commerce-fulfillment': 'Fulfillment', 'commerce-invoices': 'Invoices',
  'commerce-discounts': 'Discounts', 'commerce-reviews': 'Reviews',
  'commerce-gift-cards': 'Gift Cards', 'commerce-analytics': 'Analytics',
  'commerce-tax': 'Tax', 'commerce-credits': 'Credits',
  'commerce-loans': 'Loans', 'commerce-shop-settings': 'Shop Settings',
  'financials-dashboard': 'Financials', 'financials-statements': 'Statements',
  'financials-cost-intelligence': 'Cost Intelligence',
  'financials-ledger': 'Ledger', 'financials-reporting': 'Reporting',
  'venture-dashboard': 'Dashboard', 'venture-profile': 'Profile',
  'venture-engineering': 'Engineering', 'venture-growth': 'Growth',
  'venture-operations': 'Operations', 'venture-docs': 'Documents',
  'venture-forge': 'The Forge', 'venture-tasks': 'Tasks',
  'venture-settings': 'Settings', 'venture-onboarding': 'Onboarding',
  'venture-commerce': 'Commerce', 'venture-products': 'Products',
  'venture-subscriptions': 'Subscriptions', 'venture-financials': 'Financials',
  'creator-hub': 'Creator Hub', 'creator-royalties': 'Royalties',
  'creator-escrow': 'Escrow',
  browser: 'Browser', 'youtube-player': 'YouTube',
  gmail: 'Gmail', calendar: 'Calendar', drive: 'Drive',
  sheets: 'Sheets', 'google-docs': 'Docs', 'google-tasks': 'Tasks',
};

// ── View categories for color accents ──
export type ViewCategory = 'command' | 'engineering' | 'commerce' | 'growth' | 'intelligence' | 'operations' | 'devices';

const CATEGORY_MAP: Record<ViewCategory, ViewId[]> = {
  command: ['command-center', 'chat', 'ai-studio', 'prompt-composer', 'naos-command', 'kit-store', 'control-room', 'browser', 'youtube-player'],
  engineering: ['engineering', 'forge', 'sessions', 'war-room', 'ops', 'venture-engineering', 'venture-forge'],
  commerce: [
    'commerce-overview', 'commerce-products', 'commerce-orders', 'commerce-customers',
    'commerce-subscriptions', 'commerce-inventory', 'commerce-fulfillment', 'commerce-invoices',
    'commerce-discounts', 'commerce-reviews', 'commerce-gift-cards', 'commerce-analytics',
    'commerce-tax', 'commerce-credits', 'commerce-loans', 'commerce-shop-settings',
    'venture-commerce', 'venture-products', 'venture-subscriptions',
    'financials-dashboard', 'financials-statements', 'financials-cost-intelligence',
    'financials-ledger', 'financials-reporting', 'venture-financials',
    'creator-hub', 'creator-royalties', 'creator-escrow',
  ],
  growth: ['crm', 'growth', 'comms-hub', 'ad-studio', 'venture-growth'],
  intelligence: ['intelligence', 'treasury', 'signals', 'memory', 'portfolio'],
  operations: ['tasks', 'docs', 'files', 'team', 'pipeline', 'venture-tasks', 'venture-docs', 'venture-operations', 'venture-workspace', 'settings', 'venture-settings', 'venture-onboarding', 'venture-profile', 'venture-dashboard', 'gmail', 'calendar', 'drive', 'sheets', 'google-docs', 'google-tasks'],
  devices: ['device-hub', 'stream-deck', 'audio-router', 'connected-sessions'],
};

// Inverted lookup: viewId → category
const _viewToCategory = new Map<string, ViewCategory>();
for (const [cat, views] of Object.entries(CATEGORY_MAP)) {
  for (const v of views) _viewToCategory.set(v, cat as ViewCategory);
}

export function getViewCategory(viewId: ViewId): ViewCategory {
  return _viewToCategory.get(viewId) ?? 'operations';
}

export function getViewLabel(viewId: ViewId): string {
  return VIEW_LABELS[viewId] || viewId;
}

export function getViewIcon(viewId: ViewId): LucideIcon {
  return VIEW_ICONS[viewId] || Activity;
}
