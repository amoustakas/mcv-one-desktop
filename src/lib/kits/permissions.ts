import type { KitCapability } from './types';

// ---------------------------------------------------------------------------
// Kit Permissions System
// ---------------------------------------------------------------------------
// Capability-based permission checking for kits.
// Permissions are stored in localStorage and can be upgraded to Supabase later.

interface KitPermission {
  kitId: string;
  capability: KitCapability;
  granted: boolean;
  grantedAt: number;
  expiresAt?: number;  // optional TTL (0 = permanent)
}

const STORAGE_KEY = 'mcv-kit-permissions';

function loadPermissions(): KitPermission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePermissions(perms: KitPermission[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(perms));
}

/** Check if a kit has been granted a specific capability */
export function checkPermission(kitId: string, capability: KitCapability): boolean {
  const perms = loadPermissions();
  const perm = perms.find((p) => p.kitId === kitId && p.capability === capability);
  if (!perm || !perm.granted) return false;

  // Check expiration
  if (perm.expiresAt && Date.now() > perm.expiresAt) {
    revokePermission(kitId, capability);
    return false;
  }

  return true;
}

/** Check if a kit has all required capabilities granted */
export function checkAllPermissions(kitId: string, capabilities: KitCapability[]): boolean {
  return capabilities.every((cap) => checkPermission(kitId, cap));
}

/** Grant a capability to a kit */
export function grantPermission(
  kitId: string,
  capability: KitCapability,
  ttlMs?: number,
): void {
  const perms = loadPermissions();
  const existing = perms.findIndex((p) => p.kitId === kitId && p.capability === capability);

  const perm: KitPermission = {
    kitId,
    capability,
    granted: true,
    grantedAt: Date.now(),
    expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
  };

  if (existing >= 0) {
    perms[existing] = perm;
  } else {
    perms.push(perm);
  }

  savePermissions(perms);
}

/** Grant all capabilities for a kit at once */
export function grantAllPermissions(kitId: string, capabilities: KitCapability[]): void {
  for (const cap of capabilities) {
    grantPermission(kitId, cap);
  }
}

/** Revoke a capability from a kit */
export function revokePermission(kitId: string, capability: KitCapability): void {
  const perms = loadPermissions().filter(
    (p) => !(p.kitId === kitId && p.capability === capability),
  );
  savePermissions(perms);
}

/** Revoke all permissions for a kit */
export function revokeAllPermissions(kitId: string): void {
  const perms = loadPermissions().filter((p) => p.kitId !== kitId);
  savePermissions(perms);
}

/** Get all permissions for a kit */
export function getPermissions(kitId: string): KitPermission[] {
  return loadPermissions().filter((p) => p.kitId === kitId);
}

/** Get all granted permissions across all kits */
export function getAllPermissions(): KitPermission[] {
  return loadPermissions().filter((p) => p.granted);
}

/** Get capabilities that a kit needs but hasn't been granted */
export function getMissingPermissions(kitId: string, required: KitCapability[]): KitCapability[] {
  return required.filter((cap) => !checkPermission(kitId, cap));
}
