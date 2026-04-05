/**
 * Device Profile Sync Hook
 *
 * Watches the active venture and automatically activates matching device
 * profiles when the user switches ventures.
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
  const prevVentureRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip initial render and same-venture navigation
    if (prevVentureRef.current === activeVenture) return;
    prevVentureRef.current = activeVenture;

    if (!activeVenture) return;

    // Find a profile matching this venture with auto-activation
    const matchingProfile = Object.values(profiles).find(
      (p) => p.ventureId === activeVenture && p.activateOn === 'venture-switch',
    );

    if (matchingProfile) {
      setActiveProfile(matchingProfile.id);
      toast('info', `Device profile: ${matchingProfile.name}`, `Auto-activated for ${activeVenture}`);
    }
  }, [activeVenture, profiles, setActiveProfile, toast]);
}
