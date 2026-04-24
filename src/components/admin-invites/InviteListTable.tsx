// src/components/admin-invites/InviteListTable.tsx
//
// DataTable wrapper for onboarding_invites rows. Renders the Email / Bundle /
// Tier / Venture / Status / Expires / Copy / Revoke columns with inline row
// actions. The parent AdminInvitesView owns filter + revoke state; this
// component is intentionally dumb so it can drop into a future tenant-scoped
// admin surface without schema changes.

import { useMemo } from 'react';
import { Copy, Slash } from 'lucide-react';
import DataTable, { type ColumnDef } from '../ui/DataTable';
import Button from '../ui/Button';
import type { AdminInvite, AdminBundle } from '../../stores/admin-invites';
import InviteStatusBadge from './InviteStatusBadge';

interface InviteListTableProps {
  invites: AdminInvite[];
  bundles: AdminBundle[];
  loading?: boolean;
  onCopyLink?: (invite: AdminInvite) => void;
  onRevoke?: (invite: AdminInvite) => void;
}

export default function InviteListTable({
  invites,
  bundles,
  loading = false,
  onCopyLink,
  onRevoke,
}: InviteListTableProps) {
  const bundleById = useMemo(() => {
    const map = new Map<string, AdminBundle>();
    for (const b of bundles) map.set(b.id, b);
    return map;
  }, [bundles]);

  const columns: ColumnDef<AdminInvite>[] = [
    {
      key: 'invited_email',
      header: 'Invitee',
      minWidth: 200,
      render: (_v, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>
            {row.invited_email}
          </span>
          {row.invited_name && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {row.invited_name}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'bundle_id',
      header: 'Bundle',
      minWidth: 180,
      render: (_v, row) => {
        const bundle = bundleById.get(row.bundle_id);
        return (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {bundle?.name ?? row.bundle_id.slice(0, 8) + '…'}
          </span>
        );
      },
    },
    {
      key: 'access_tier',
      header: 'Tier',
      width: 110,
      render: (_v, row) => (
        <span
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: 'var(--cyan)',
            fontWeight: 600,
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          }}
        >
          {row.access_tier}
        </span>
      ),
    },
    {
      key: 'target_venture_id',
      header: 'Venture',
      width: 120,
      render: (_v, row) => (
        <span style={{ fontSize: 12, color: row.target_venture_id ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
          {row.target_venture_id ?? '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 110,
      render: (_v, row) => <InviteStatusBadge status={row.status} expiresAt={row.expires_at} />,
    },
    {
      key: 'expires_at',
      header: 'Expires',
      width: 130,
      render: (_v, row) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {formatDate(row.expires_at)}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      width: 130,
      render: (_v, row) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: '__actions',
      header: '',
      width: 130,
      align: 'right',
      render: (_v, row) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {onCopyLink && row.status === 'pending' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation?.(); onCopyLink(row); }}
              title="Copy invite link"
            >
              <Copy size={12} />
            </Button>
          )}
          {onRevoke && (row.status === 'pending' || row.status === 'accepted') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation?.(); onRevoke(row); }}
              title="Revoke invite"
            >
              <Slash size={12} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={invites as unknown as Array<AdminInvite & Record<string, unknown>>}
      columns={columns}
      rowKey="id"
      isLoading={loading}
      emptyMessage="No invites yet — use Create invite to issue the first one."
      maxHeight={640}
      rowHeight={56}
    />
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}
