/**
 * Device Profile Sync Hook
 *
 * Watches the active venture and automatically activates matching device
 * profiles when the user switches ventures. When switching to global mode
 * (activeVenture = null), activates a global profile (ventureId undefined)
 * if one exists, or clears the active profile.
 *
 * Skips the initial mount so that an already-persisted venture does not
 * trigger a redundant profile switch and toast on app startup.
 */

import { useEffect, useRef } from 'react';
import { useNavigation } from '../stores/navigation';
import { useDeviceStore } from '../stores/devices';
import { useToast } from '../components/Toasts';

export function useDeviceProfileSync() {
  const { toast } = useToast();
  const activeVenture = useNavigation((s) => s.activeVenture);
  const profiles = useDeviceStore((s) => s.profiles);
  const setActiveProfile = useDeviceStore((s) => s.setActiveProfile);

  // Track previous venture; start as a sentinel so the first real
  // comparison (initial mount) can be detected and skipped.
  const prevVentureRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // First mount: seed the ref with the current value but don't fire.
    // This prevents a profile-switch toast when the app restores a
    // persisted venture from localStorage on boot.
    if (prevVentureRef.current === undefined) {
      prevVentureRef.current = activeVenture;
      return;
    }

    // Same venture as last render — nothing to do
    if (prevVentureRef.current === activeVenture) return;
    prevVentureRef.current = activeVenture;

    if (activeVenture) {
      // Venture mode — find a profile matching this venture with auto-activation
      const matchingProfile = Object.values(profiles).find(
        (p) => p.ventureId === activeVenture && p.activateOn === 'venture-switch',
      );

      if (matchingProfile) {
        setActiveProfile(matchingProfile.id);
        toast('info', `Device profile: ${matchingProfile.name}`, `Auto-activated for ${activeVenture}`);
      }
    } else {
      // Global mode — look for a global profile (no ventureId) with auto-activation
      const globalProfile = Object.values(profiles).find(
        (p) => !p.ventureId && p.activateOn === 'venture-switch',
      );

      if (globalProfile) {
        setActiveProfile(globalProfile.id);
        toast('info', `Device profile: ${globalProfile.name}`, 'Auto-activated for global mode');
      } else {
        // No global profile — clear active profile so venture-specific
        // mappings don't remain active in global context.
        setActiveProfile(null);
      }
    }
  }, [activeVenture, profiles, setActiveProfile, toast]);
}
