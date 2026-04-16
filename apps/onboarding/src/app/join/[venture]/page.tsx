import WizardShell from '@/components/WizardShell';
import { getVentureBrand } from '@/lib/brand';
import type { TrackName } from '@mcv/onboarding-sdk';

// Venture-scoped entry. Defaults to investor_retail for most ventures;
// BetEdge/WarForge bias toward creator in v0. Admins can deep-link with
// ?track=… to force a specific track (e.g., investor_accredited).

interface Props {
  params: Promise<{ venture: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function defaultTrack(venture: string, override: string | undefined): TrackName {
  if (override === 'investor_accredited' || override === 'investor_retail'
   || override === 'partner' || override === 'creator' || override === 'ally'
   || override === 'team_member' || override === 'waitlist') {
    return override;
  }
  // Venture-scoped defaults
  if (venture === 'betedge' || venture === 'warforge') return 'investor_retail';
  return 'investor_retail';
}

export default async function JoinPage({ params, searchParams }: Props) {
  const { venture } = await params;
  const sp = (await searchParams) ?? {};
  const override = typeof sp.track === 'string' ? sp.track : undefined;

  const brand = getVentureBrand(venture);
  const track = defaultTrack(venture, override);

  return <WizardShell track={track} ventureId={brand.id} />;
}
