// src/components/admin-invites/InviteStatusBadge.tsx
//
// Single-purpose status chip for onboarding_invites rows. Keeps the color
// and copy mapping in one place so the table, detail drawer, and any future
// filter pills all stay lockstep with the server's status enum.
//
// The ui/Badge primitive takes a `color` + `variant` instead of semantic
// variants, so the color map here is the single source of truth for how
// each invite state renders.

import Badge from '../ui/Badge';
import { useNow } from '../../hooks/use-now';

type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

interface InviteStatusBadgeProps {
  status: InviteStatus | string;
  expiresAt?: string | null;
}

const STATUS_COLORS: Record<InviteStatus, string> = {
  pending: '#00f5ff',  // cyan — awaiting action
  accepted: '#10b981', // emerald — done
  expired: '#eab308',  // amber — unusable, admin may re-issue
  revoked: '#ef4444',  // red — intentionally killed
};

const STATUS_LABELS: Record<InviteStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  expired: 'Expired',
  revoked: 'Revoked',
};

export default function InviteStatusBadge({ status, expiresAt }: InviteStatusBadgeProps) {
  const now = useNow();
  // Auto-promote a pending invite past its TTL to 'expired' for the visual —
  // the DB's status column flips lazily via the read-time check in the
  // lookup handler, so this cosmetic promotion keeps the table honest.
  const effective: InviteStatus =
    status === 'pending' && expiresAt && new Date(expiresAt).getTime() < now
      ? 'expired'
      : (status as InviteStatus);

  const color = STATUS_COLORS[effective] ?? '#6b7a8c';
  const label = STATUS_LABELS[effective] ?? status;

  return (
    <Badge variant="outline" color={color} size="sm">
      {label}
    </Badge>
  );
}
