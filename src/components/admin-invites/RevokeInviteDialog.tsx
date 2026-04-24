// src/components/admin-invites/RevokeInviteDialog.tsx
//
// Revocation confirmation dialog. Collects a free-form reason (not required
// by the server, but we nudge admins to leave one for audit trail) and
// gates the destructive action behind an explicit confirm.
//
// Server emits onboarding.invite.revoked on success with previousStatus
// included, so downstream subscribers (e.g. a future "revoke cascade" that
// also yanks user_access_grants) can branch on whether the invite was
// accepted or still pending when revoked.

import { useState } from 'react';
import Dialog, { DialogActions } from '../ui/Dialog';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import type { AdminInvite } from '../../stores/admin-invites';
import { useAdminInvitesStore } from '../../stores/admin-invites';
import InviteStatusBadge from './InviteStatusBadge';

interface RevokeInviteDialogProps {
  invite: AdminInvite | null;
  onClose: () => void;
  onRevoked?: (result: { cascadedGrants: number }) => void;
}

export default function RevokeInviteDialog({ invite, onClose, onRevoked }: RevokeInviteDialogProps) {
  const revokeInvite = useAdminInvitesStore((s) => s.revokeInvite);
  const revoking = useAdminInvitesStore((s) => s.loading.revoking);
  const revokeError = useAdminInvitesStore((s) => s.errors.revoking);

  const [reason, setReason] = useState('');
  // Cascade defaults to TRUE when the invite was accepted (matches the user's
  // likely intent: "revoke this invite" usually means "and their access").
  // Defaults to FALSE for pending/expired where there are no grants yet.
  const [cascadeGrants, setCascadeGrants] = useState(false);

  // Reset the form whenever the selected invite changes — React 19's
  // "store previous prop in state, update during render" pattern. This
  // avoids the useEffect roundtrip and the set-state-in-effect lint rule.
  // See https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevInviteId, setPrevInviteId] = useState<string | null | undefined>(invite?.id);
  if (invite?.id !== prevInviteId) {
    setPrevInviteId(invite?.id);
    setReason('');
    setCascadeGrants(invite?.status === 'accepted');
  }

  const handleConfirm = async () => {
    if (!invite) return;
    try {
      const result = await revokeInvite(
        invite.id,
        reason.trim() || undefined,
        invite.status === 'accepted' ? cascadeGrants : false,
      );
      onRevoked?.(result);
      onClose();
    } catch {
      // Error surfaces via store.errors.revoking; dialog stays open.
    }
  };

  return (
    <Dialog open={!!invite} onClose={onClose} title="Revoke invite" size="sm">
      {invite && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Revoke the invitation for <strong>{invite.invited_email}</strong>? The user will no longer be able
            to accept this invite; an event fires on <code style={codeStyle}>onboarding.invite.revoked</code> so
            any dependent automations can react.
          </p>

          <div className="mcv-revoke-meta">
            <div><span>Status</span><InviteStatusBadge status={invite.status} expiresAt={invite.expires_at} /></div>
            <div><span>Tier</span><code style={codeStyle}>{invite.access_tier}</code></div>
            {invite.target_venture_id && (
              <div><span>Venture</span><code style={codeStyle}>{invite.target_venture_id}</code></div>
            )}
          </div>

          {invite.status === 'accepted' && (
            <div className="mcv-revoke-accepted-warning">
              This invite has already been <strong>accepted</strong>. The user's document requirements will stay on file
              for audit. Decide below whether to cascade this revocation to their venture access grants.
            </div>
          )}

          {invite.status === 'accepted' && (
            <label className="mcv-revoke-cascade">
              <input
                type="checkbox"
                checked={cascadeGrants}
                onChange={(e) => setCascadeGrants(e.target.checked)}
                disabled={revoking}
              />
              <span>
                <strong>Also revoke venture access granted via this invite.</strong>
                <span className="mcv-revoke-cascade-hint">
                  All active <code style={codeStyle}>user_access_grants</code> rows tied to <code style={codeStyle}>invite_id={invite.id.slice(0, 8)}…</code>
                  {' '}will be marked revoked, and <code style={codeStyle}>onboarding.access.revoked</code> fires for each.
                </span>
              </span>
            </label>
          )}

          <FormField label="Reason (optional)" hint="Captured on the event + revoked_reason column for audit.">
            <textarea
              className="mcv-revoke-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Replaced with a new invite, wrong bundle assigned, etc."
              disabled={revoking}
            />
          </FormField>

          {revokeError && (
            <div style={errorBoxStyle}>{revokeError}</div>
          )}

          <DialogActions>
            <Button variant="ghost" onClick={onClose} disabled={revoking}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirm} loading={revoking}>
              Revoke invite
            </Button>
          </DialogActions>
        </div>
      )}

      <style>{`
        .mcv-revoke-meta {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.02);
        }
        .mcv-revoke-meta > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
        }
        .mcv-revoke-meta > div > span:first-child {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: var(--text-muted);
        }
        .mcv-revoke-accepted-warning {
          padding: 10px 12px;
          border-radius: 8px;
          border-left: 2px solid var(--warning, #eab308);
          background: rgba(234, 179, 8, 0.06);
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.55;
        }
        .mcv-revoke-cascade {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: rgba(239, 68, 68, 0.04);
          cursor: pointer;
          font-size: 12px;
          line-height: 1.55;
        }
        .mcv-revoke-cascade input {
          margin-top: 3px;
          accent-color: var(--error);
        }
        .mcv-revoke-cascade > span {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .mcv-revoke-cascade-hint {
          font-size: 11px;
          color: var(--text-muted);
        }
        .mcv-revoke-textarea {
          width: 100%;
          box-sizing: border-box;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-primary);
          padding: 10px 12px;
          font-size: 13px;
          font-family: inherit;
          line-height: 1.5;
          resize: vertical;
          min-height: 66px;
        }
        .mcv-revoke-textarea:focus {
          outline: none;
          border-color: var(--error);
        }
      `}</style>
    </Dialog>
  );
}

const codeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
  fontSize: 11,
  color: 'var(--text-primary)',
  padding: '1px 6px',
  borderRadius: 4,
  background: 'rgba(255, 255, 255, 0.04)',
};

const errorBoxStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  borderLeft: '2px solid var(--error)',
  background: 'rgba(239, 68, 68, 0.06)',
  color: 'var(--error)',
  fontSize: 12,
};
