import WizardShell from '@/components/WizardShell';
import type { TrackName } from '@mcv/onboarding-sdk';

// Generic entry — shows intro that asks the prospect what brought them,
// and we infer track from their answer. For v0 we default to investor_retail
// and let the agent_assignment step re-route if the role_hint disagrees.

interface Props {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const VALID_TRACKS: ReadonlySet<string> = new Set([
  'investor_retail', 'investor_accredited', 'partner', 'creator',
  'team_member', 'ally', 'waitlist',
]);

export default async function StartPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const trackParam = typeof sp.track === 'string' && VALID_TRACKS.has(sp.track) ? (sp.track as TrackName) : 'investor_retail';
  const prefill = typeof sp.prefill === 'string' ? sp.prefill : null;
  return <WizardShell track={trackParam} ventureId={null} prefillEmail={prefill} />;
}
