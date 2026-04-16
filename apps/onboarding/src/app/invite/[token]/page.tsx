import WizardShell from '@/components/WizardShell';

// Invite-scoped entry. In v0 the token is metadata-only — a hook for
// future routing (ally-auto-provisioning, team-member-onboarding, specific
// deal links). For now every invite lands on the ally track (fastest path
// to credentials) with the token recorded for later consumption.

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  // TODO: resolve token → track + venture + pre-filled identity.
  // For v0, ally track, no venture scope, token stashed for downstream use.
  return <WizardShell track="ally" ventureId={null} inviteToken={token} />;
}
