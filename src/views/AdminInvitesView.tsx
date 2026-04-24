// src/views/AdminInvitesView.tsx
//
// MCV Atlas — super-admin dashboard for the invite-gated onboarding pipeline.
// Session 4 of the Onboarding + Demo Gate epic. Composes the admin-invites
// store (Session 1) + the design system primitives to give Tony a single
// cockpit to:
//
//   · See every invite at a glance (KPI strip + filterable table)
//   · Issue a new invite (right-side drawer with bundle preview)
//   · Revoke an existing invite with a reason (confirm dialog + event)
//   · Copy a pre-built invite URL for out-of-band send
//
// Gating:
//   · Client-side: useSuperAdmin() hides the UI for non-admins.
//   · Server-side: every /api/admin/invites action re-checks via
//     requireSuperAdmin() in api/_handlers/admin/invites.ts. The UI guard
//     is presentation only.
//
// Realtime / live feed: NOT wired in this session. The event_log already
// receives onboarding.invite.accepted events via /api/onboarding, so a
// Supabase Realtime subscription scoped to those topics would give a
// push-driven "accept happened!" feed. EXPAND flag for Session 5.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, ShieldOff } from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  Button,
  EmptyState,
  Input,
} from '../components/ui';
import {
  useAdminInvitesStore,
  type AdminInvite,
} from '../stores/admin-invites';
import { useSuperAdmin } from '../hooks/use-super-admin';
import { useAdminInviteEvents } from '../hooks/use-admin-invite-events';
import { useNow } from '../hooks/use-now';
import {
  InviteKpiStrip,
  InviteListTable,
  CreateInviteDrawer,
  RevokeInviteDialog,
} from '../components/admin-invites';

export default function AdminInvitesView() {
  const isSuperAdmin = useSuperAdmin();

  const invites = useAdminInvitesStore((s) => s.invites);
  const bundles = useAdminInvitesStore((s) => s.bundles);
  const fetchInvites = useAdminInvitesStore((s) => s.fetchInvites);
  const fetchBundles = useAdminInvitesStore((s) => s.fetchBundles);
  const invitesLoading = useAdminInvitesStore((s) => s.loading.invites);
  const invitesError = useAdminInvitesStore((s) => s.errors.invites);

  const [filter, setFilter] = useState<AdminInvite['status'] | null>(null);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [revoking, setRevoking] = useState<AdminInvite | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Hydrate on mount. We fetch bundles eagerly because the drawer + table
  // both need them; keeping them in-store means the drawer opens without
  // a spinner on subsequent admin sessions.
  useEffect(() => {
    if (!isSuperAdmin) return;
    void fetchInvites();
    void fetchBundles();
  }, [isSuperAdmin, fetchInvites, fetchBundles]);

  // Live feed — subscribe to onboarding.* events on event_log so accepts /
  // revokes from other sessions surface in real time without polling. We
  // debounce refreshInvites by a short tick to coalesce bursts (e.g. accept
  // fires 3 events: invite.accepted + requirement.assigned × N).
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useAdminInviteEvents({
    enabled: isSuperAdmin,
    onEvent: (event) => {
      setCopyToast(event.description);
      setTimeout(() => setCopyToast((prev) => (prev === event.description ? null : prev)), 3500);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => { void fetchInvites(); }, 400);
    },
  });
  useEffect(() => () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  const refresh = () => { void fetchInvites(); };

  const nowMs = useNow();
  const visibleInvites = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    let list = invites;
    if (filter) list = list.filter((i) => {
      // Mirror the status-badge effective-status promotion so clicking "Expired"
      // also includes pending invites whose TTL has elapsed.
      const isVisuallyExpired =
        i.status === 'pending' && new Date(i.expires_at).getTime() < nowMs;
      if (filter === 'expired') return i.status === 'expired' || isVisuallyExpired;
      if (filter === 'pending') return i.status === 'pending' && !isVisuallyExpired;
      return i.status === filter;
    });
    if (trimmed) {
      list = list.filter((i) =>
        i.invited_email.toLowerCase().includes(trimmed) ||
        (i.invited_name ?? '').toLowerCase().includes(trimmed) ||
        i.invite_code.toLowerCase().includes(trimmed),
      );
    }
    return list;
  }, [invites, filter, search, nowMs]);

  const handleCopyLink = async (invite: AdminInvite) => {
    const origin = window.location.origin;
    const url = `${origin}/accept-invite?code=${encodeURIComponent(invite.invite_code)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyToast(`Copied invite link for ${invite.invited_email}`);
      setTimeout(() => setCopyToast(null), 2200);
    } catch {
      // Fallback: show the URL in the toast so the admin can copy manually.
      setCopyToast(url);
      setTimeout(() => setCopyToast(null), 6000);
    }
  };

  // ─── Access gate ─────────────────────────────────────────────────────────
  if (!isSuperAdmin) {
    return (
      <PageShell>
        <EmptyState
          icon={<ShieldOff size={28} />}
          title="Super-admin access required"
          description="Atlas is gated to super-admins only. If you think you should have access, add your user ID to the SUPER_ADMIN_USER_IDS env or set publicMetadata.role=super_admin on your Clerk user."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="MCV Atlas — Invites"
        subtitle="Issue, track, and revoke invite-gated onboarding clearances."
        onRefresh={refresh}
        loading={invitesLoading}
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> New invite
        </Button>
      </PageHeader>

      {invitesError && (
        <GlassCard style={{ padding: 16, borderColor: 'rgba(239,68,68,0.35)' }}>
          <div style={{ fontSize: 12, color: 'var(--error)' }}>
            Could not load invites: {invitesError}
          </div>
        </GlassCard>
      )}

      <InviteKpiStrip invites={invites} activeFilter={filter} onFilterChange={setFilter} />

      <GlassCard style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, name, or invite code…"
            style={{ flex: 1 }}
          />
          {filter && (
            <Button variant="ghost" size="sm" onClick={() => setFilter(null)}>
              Clear filter · {filter}
            </Button>
          )}
        </div>

        <InviteListTable
          invites={visibleInvites}
          bundles={bundles}
          loading={invitesLoading && invites.length === 0}
          onCopyLink={handleCopyLink}
          onRevoke={setRevoking}
        />
      </GlassCard>

      <CreateInviteDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(url) => {
          setCopyToast(`Invite created — URL ready to copy in the drawer.`);
          setTimeout(() => setCopyToast(null), 3000);
          void url; // the drawer itself surfaces the URL for copy
        }}
      />

      <RevokeInviteDialog
        invite={revoking}
        onClose={() => setRevoking(null)}
        onRevoked={(result) => {
          const suffix = result.cascadedGrants > 0
            ? ` · cascaded ${result.cascadedGrants} access ${result.cascadedGrants === 1 ? 'grant' : 'grants'}`
            : '';
          setCopyToast(`Invite revoked${suffix}.`);
          setTimeout(() => setCopyToast(null), 3000);
        }}
      />

      {copyToast && (
        <div className="mcv-admin-toast" role="status" aria-live="polite">
          {copyToast}
        </div>
      )}

      <style>{`
        .mcv-admin-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 16px;
          border-radius: 10px;
          background: rgba(11, 18, 28, 0.92);
          border: 1px solid var(--border);
          box-shadow: 0 16px 40px -20px rgba(0, 0, 0, 0.6);
          color: var(--text-primary);
          font-size: 12px;
          z-index: 1000;
          backdrop-filter: blur(20px);
        }
      `}</style>
    </PageShell>
  );
}
