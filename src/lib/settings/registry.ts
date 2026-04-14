import type { ReactNode } from 'react';

export type SettingSectionId =
  | 'general'
  | 'account'
  | 'integrations'
  | 'google-workspace'
  | 'ai-models'
  | 'audio'
  | 'devices'
  | 'storage'
  | 'security'
  | 'billing'
  | 'shortcuts'
  | 'about';

export type SettingScope = 'global' | 'venture';

export interface SettingDefinition {
  /** Stable ID for search index + deep-linking */
  id: string;
  /** Human label for search ranking and UI */
  label: string;
  /** Section this setting belongs to */
  section: SettingSectionId;
  /** Which scopes this setting may be configured at */
  scopes: SettingScope[];
  /** Keywords that should match search queries */
  keywords?: string[];
  /** Short one-line description rendered under the label in search results */
  description?: string;
}

/**
 * Flat registry of every user-facing setting. Used for:
 *  - Global search (fuzzy match across labels + keywords)
 *  - Scope resolution (which scopes a setting applies to)
 *  - Deep linking (?setting=<id> jumps to the section + highlights)
 *
 * Adding a new setting? Register it here so it becomes discoverable.
 */
export const SETTINGS_REGISTRY: SettingDefinition[] = [
  // General
  { id: 'theme', label: 'Theme', section: 'general', scopes: ['global'], keywords: ['dark', 'light', 'appearance'] },
  { id: 'density', label: 'UI Density', section: 'general', scopes: ['global'], keywords: ['compact', 'spacious', 'size'], description: 'Compact · Normal · Spacious' },
  { id: 'font-size', label: 'Font Size', section: 'general', scopes: ['global'], keywords: ['text', 'zoom'] },
  { id: 'high-contrast', label: 'High Contrast Mode', section: 'general', scopes: ['global'], keywords: ['accessibility', 'a11y', 'contrast'] },
  { id: 'colorblind', label: 'Colorblind-safe Palette', section: 'general', scopes: ['global'], keywords: ['accessibility', 'a11y', 'colorblind', 'palette'] },
  { id: 'reduced-motion', label: 'Reduce Motion', section: 'general', scopes: ['global'], keywords: ['accessibility', 'a11y', 'animation'] },
  { id: 'notifications', label: 'Notifications', section: 'general', scopes: ['global', 'venture'], keywords: ['alerts', 'toast'] },
  { id: 'compact-mode', label: 'Compact Mode', section: 'general', scopes: ['global'], keywords: ['dense', 'small'] },

  // Account
  { id: 'display-name', label: 'Display Name', section: 'account', scopes: ['global'], keywords: ['profile', 'name'] },
  { id: 'default-venture', label: 'Default Venture', section: 'account', scopes: ['global'], keywords: ['startup', 'home'] },
  { id: 'clock-format', label: 'Clock Format', section: 'account', scopes: ['global'], keywords: ['12h', '24h', 'time'] },

  // Integrations
  { id: 'integrations-hub', label: 'Integrations', section: 'integrations', scopes: ['global'], keywords: ['oauth', 'api key', 'connections'], description: 'OAuth providers, API keys, MCP servers' },
  { id: 'api-keys', label: 'API Keys', section: 'integrations', scopes: ['global', 'venture'], keywords: ['secret', 'token'], description: 'Per-service API keys (inline override)' },

  // Google Workspace (per-venture only)
  { id: 'gw-gmail-labels', label: 'Gmail Labels', section: 'google-workspace', scopes: ['venture'], keywords: ['gmail', 'labels', 'tags'] },
  { id: 'gw-calendar-ids', label: 'Calendar IDs', section: 'google-workspace', scopes: ['venture'], keywords: ['calendar', 'events'] },
  { id: 'gw-calendar-keywords', label: 'Calendar Keywords', section: 'google-workspace', scopes: ['venture'], keywords: ['calendar', 'auto-tag'] },
  { id: 'gw-drive-folders', label: 'Drive Folders', section: 'google-workspace', scopes: ['venture'], keywords: ['drive', 'files'] },
  { id: 'gw-ga4', label: 'GA4 Property ID', section: 'google-workspace', scopes: ['venture'], keywords: ['analytics', 'ga4'] },
  { id: 'gw-search-console', label: 'Search Console URL', section: 'google-workspace', scopes: ['venture'], keywords: ['seo', 'search console'] },

  // AI & Models
  { id: 'preferred-model', label: 'Preferred Model', section: 'ai-models', scopes: ['global', 'venture'], keywords: ['claude', 'gemini', 'gpt'] },
  { id: 'max-tokens', label: 'Max Tokens', section: 'ai-models', scopes: ['global', 'venture'] },
  { id: 'streaming', label: 'Streaming Responses', section: 'ai-models', scopes: ['global'] },

  // Audio / Voice
  { id: 'input-device', label: 'Microphone Input', section: 'audio', scopes: ['global'], keywords: ['mic', 'microphone'] },
  { id: 'output-device', label: 'Speaker Output', section: 'audio', scopes: ['global'], keywords: ['speaker', 'headphones'] },
  { id: 'input-volume', label: 'Input Volume', section: 'audio', scopes: ['global'] },
  { id: 'output-volume', label: 'Output Volume', section: 'audio', scopes: ['global'] },
  { id: 'tts-voice', label: 'TTS Voice', section: 'audio', scopes: ['global', 'venture'], keywords: ['text to speech', 'elevenlabs'] },
  { id: 'auto-tts', label: 'Auto-read Responses', section: 'audio', scopes: ['global'], keywords: ['tts', 'speech'] },
  { id: 'stt-provider', label: 'Speech-to-Text Provider', section: 'audio', scopes: ['global'], keywords: ['stt', 'deepgram', 'browser'] },

  // Devices
  { id: 'auto-discovery', label: 'Device Auto-discovery', section: 'devices', scopes: ['global'] },
  { id: 'default-profile', label: 'Default Device Profile', section: 'devices', scopes: ['global'] },

  // Storage
  { id: 'storage-buckets', label: 'Storage Buckets', section: 'storage', scopes: ['global'], keywords: ['supabase', 'r2', 'cloud'] },
  { id: 'clear-local', label: 'Clear Local Storage', section: 'storage', scopes: ['global'], keywords: ['cache', 'reset'] },

  // Security
  { id: 'auth-status', label: 'Authentication', section: 'security', scopes: ['global'], keywords: ['clerk', 'login'] },
  { id: 'audit-log', label: 'Audit Log', section: 'security', scopes: ['global', 'venture'], keywords: ['history', 'compliance'] },
  { id: '2fa', label: 'Two-Factor Authentication', section: 'security', scopes: ['global', 'venture'] },

  // Shortcuts
  { id: 'keybindings', label: 'Keyboard Shortcuts', section: 'shortcuts', scopes: ['global'], keywords: ['hotkey', 'rebind'] },

  // About
  { id: 'version', label: 'Version', section: 'about', scopes: ['global'] },
];

export interface SearchResult {
  def: SettingDefinition;
  score: number;
}

/** Fuzzy-ish ranking: label prefix > label contains > keyword match > description. */
export function searchSettings(query: string, scope?: SettingScope): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];

  for (const def of SETTINGS_REGISTRY) {
    if (scope && !def.scopes.includes(scope)) continue;

    const label = def.label.toLowerCase();
    let score = 0;

    if (label === q) score = 100;
    else if (label.startsWith(q)) score = 80;
    else if (label.includes(q)) score = 60;
    else if (def.keywords?.some((k) => k.toLowerCase().includes(q))) score = 40;
    else if (def.description?.toLowerCase().includes(q)) score = 20;
    else continue;

    results.push({ def, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 20);
}

export interface SectionMeta {
  id: SettingSectionId;
  label: string;
  icon?: ReactNode;
  description?: string;
}
