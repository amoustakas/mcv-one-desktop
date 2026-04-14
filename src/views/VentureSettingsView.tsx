import { useEffect } from 'react';
import SettingsView from './SettingsView';

/**
 * Deprecated: VentureSettingsView is now a thin wrapper that opens the unified
 * SettingsView with the scope toggle pre-set to "venture". Kept for backwards
 * compatibility with existing navigation routes and bookmarks.
 *
 * To land on a specific section in venture scope, use:
 *   /?tab=ai-models&scope=venture
 */
export default function VentureSettingsView() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('scope') !== 'venture') {
      params.set('scope', 'venture');
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, []);

  return <SettingsView />;
}
