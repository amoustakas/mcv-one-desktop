// src/stores/admin-invites.ts
//
// Zustand store for super-admin invite management. Consumed by the admin
// dashboard UI (session 4). Scaffolded ahead so the API shape is contract-
// stable across sessions — if session 4 wants to change semantics, it's a
// schema discussion, not a re-architecture.
//
// All actions hit /api/admin/invites which gates via super-admin whitelist
// server-side. Client-side the admin dashboard should ALSO gate via
// useSuperAdmin() to hide the UI from non-admins.

import { create } from 'zustand';
import { apiPost } from '../lib/api/client';

// ─── Types mirroring the handler's InviteRow + joins ─────────────────────
export interface AdminInvite {
  id: string;
  invite_code: string;
  invited_email: string;
  invited_name: string | null;
  invited_by: string;
  bundle_id: string;
  target_venture_id: string | null;
  access_tier: string;
  access_levels: string[];
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  instructions_md: string | null;
  expires_at: string;
  accepted_at: string | null;
  accepted_user_id: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  revoked_reason: string | null;
  created_at: string;
}

export interface AdminBundle {
  id: string;
  bundle_key: string;
  name: string;
  description: string;
  tier: string;
  retired_at: string | null;
  created_at: string;
}

export interface AdminTemplate {
  id: string;
  template_key: string;
  title: string;
  version: string;
  summary: string;
  doc_type: string;
  retired_at: string | null;
  created_at: string;
}

export interface CreateInviteInput {
  email: string;
  name?: string;
  bundle_id: string;
  target_venture_id?: string | null;
  access_tier: string;
  access_levels: string[];
  expires_in_days?: number;
  instructions_md?: string;
}

interface AdminInvitesState {
  invites: AdminInvite[];
  bundles: AdminBundle[];
  templates: AdminTemplate[];
  loading: {
    invites: boolean;
    bundles: boolean;
    templates: boolean;
    creating: boolean;
    revoking: boolean;
  };
  errors: {
    invites: string | null;
    bundles: string | null;
    templates: string | null;
    creating: string | null;
    revoking: string | null;
  };
  /** URL for the most recently created invite — surfaced to the admin UI
   *  for one-click copy-to-clipboard. Cleared when a new invite is created. */
  lastCreatedInviteUrl: string | null;

  fetchInvites: (filter?: { status?: AdminInvite['status']; email?: string }) => Promise<void>;
  fetchBundles: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  createInvite: (input: CreateInviteInput) => Promise<{ invite: AdminInvite; inviteUrl: string }>;
  revokeInvite: (id: string, reason?: string, cascadeGrants?: boolean) => Promise<{ cascadedGrants: number }>;
  clearLastCreatedInviteUrl: () => void;
}

export const useAdminInvitesStore = create<AdminInvitesState>((set) => ({
  invites: [],
  bundles: [],
  templates: [],
  loading: {
    invites: false, bundles: false, templates: false, creating: false, revoking: false,
  },
  errors: {
    invites: null, bundles: null, templates: null, creating: null, revoking: null,
  },
  lastCreatedInviteUrl: null,

  fetchInvites: async (filter) => {
    set((s) => ({ loading: { ...s.loading, invites: true }, errors: { ...s.errors, invites: null } }));
    try {
      const data = await apiPost<{ invites: AdminInvite[] }>('/api/admin/invites', {
        action: 'list-invites',
        status: filter?.status,
        email: filter?.email,
      });
      set((s) => ({
        invites: data.invites ?? [],
        loading: { ...s.loading, invites: false },
      }));
    } catch (e) {
      set((s) => ({
        errors: { ...s.errors, invites: (e as Error).message },
        loading: { ...s.loading, invites: false },
      }));
    }
  },

  fetchBundles: async () => {
    set((s) => ({ loading: { ...s.loading, bundles: true }, errors: { ...s.errors, bundles: null } }));
    try {
      const data = await apiPost<{ bundles: AdminBundle[] }>('/api/admin/invites', {
        action: 'list-bundles',
      });
      set((s) => ({
        bundles: data.bundles ?? [],
        loading: { ...s.loading, bundles: false },
      }));
    } catch (e) {
      set((s) => ({
        errors: { ...s.errors, bundles: (e as Error).message },
        loading: { ...s.loading, bundles: false },
      }));
    }
  },

  fetchTemplates: async () => {
    set((s) => ({ loading: { ...s.loading, templates: true }, errors: { ...s.errors, templates: null } }));
    try {
      const data = await apiPost<{ templates: AdminTemplate[] }>('/api/admin/invites', {
        action: 'list-templates',
      });
      set((s) => ({
        templates: data.templates ?? [],
        loading: { ...s.loading, templates: false },
      }));
    } catch (e) {
      set((s) => ({
        errors: { ...s.errors, templates: (e as Error).message },
        loading: { ...s.loading, templates: false },
      }));
    }
  },

  createInvite: async (input) => {
    set((s) => ({ loading: { ...s.loading, creating: true }, errors: { ...s.errors, creating: null } }));
    try {
      const data = await apiPost<{ invite: AdminInvite; inviteUrl: string }>('/api/admin/invites', {
        action: 'create-invite',
        ...input,
      });
      // Prepend the new invite to the in-memory list so the dashboard updates
      // without a full refetch.
      set((s) => ({
        invites: [data.invite, ...s.invites],
        lastCreatedInviteUrl: data.inviteUrl,
        loading: { ...s.loading, creating: false },
      }));
      return data;
    } catch (e) {
      set((s) => ({
        errors: { ...s.errors, creating: (e as Error).message },
        loading: { ...s.loading, creating: false },
      }));
      throw e;
    }
  },

  revokeInvite: async (id, reason, cascadeGrants = false) => {
    set((s) => ({ loading: { ...s.loading, revoking: true }, errors: { ...s.errors, revoking: null } }));
    try {
      const data = await apiPost<{ invite: AdminInvite; cascadedGrants?: number }>('/api/admin/invites', {
        action: 'revoke-invite',
        id,
        reason: reason ?? null,
        cascade_grants: cascadeGrants,
      });
      // Patch the revoked invite in place.
      set((s) => ({
        invites: s.invites.map((inv) => (inv.id === id ? data.invite : inv)),
        loading: { ...s.loading, revoking: false },
      }));
      return { cascadedGrants: data.cascadedGrants ?? 0 };
    } catch (e) {
      set((s) => ({
        errors: { ...s.errors, revoking: (e as Error).message },
        loading: { ...s.loading, revoking: false },
      }));
      throw e;
    }
  },

  clearLastCreatedInviteUrl: () => set({ lastCreatedInviteUrl: null }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────
// Expand: add selectors here as the admin UI grows (e.g. activeInvites,
// pendingInvitesByTier, expiringInvites). Keep store actions focused on
// mutations; computed views live in selectors.

export function selectActiveInvites(state: AdminInvitesState): AdminInvite[] {
  return state.invites.filter((i) => i.status === 'pending');
}

export function selectAcceptedInvites(state: AdminInvitesState): AdminInvite[] {
  return state.invites.filter((i) => i.status === 'accepted');
}

export function selectInviteByCode(state: AdminInvitesState, code: string): AdminInvite | undefined {
  return state.invites.find((i) => i.invite_code === code);
}
