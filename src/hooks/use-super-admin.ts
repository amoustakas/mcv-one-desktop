// src/hooks/use-super-admin.ts
//
// Client-side super-admin gate. Reads Clerk session's publicMetadata.role
// and returns true only if it's 'super_admin'. The authoritative check
// always lives on the server (api/_handlers/admin/invites.ts uses env
// fallbacks + metadata); this hook is for UI presentation only — showing
// or hiding admin surfaces to reduce noise for non-admin users.
//
// Usage:
//   const isSuperAdmin = useSuperAdmin();
//   if (!isSuperAdmin) return <AccessDenied />;
//
// EXPAND: when Clerk roles system matures to support granular permissions
// (beyond a single 'super_admin' boolean), widen this to return a role
// object with scoped permissions. For now, one bit is enough.
// EXPAND: loading state — today the hook is synchronous via Clerk's
// useUser(). If we move to JWT custom-claim checking (which can be async),
// expose { isSuperAdmin, loading }.

import { useUser } from '@clerk/clerk-react';

export function useSuperAdmin(): boolean {
  const { user, isLoaded, isSignedIn } = useUser();
  if (!isLoaded || !isSignedIn || !user) return false;
  const role = user.publicMetadata?.role;
  return role === 'super_admin';
}
