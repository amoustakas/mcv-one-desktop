// Venture brand tokens for CSS custom property injection.
// Wired into the server component so the wizard renders the venture's
// brand identity from the first paint — no flash of default.

export interface VentureBrand {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  brand: string;        // --brand  (primary accent)
  brandAccent: string;  // --brand-accent (gradient second stop)
}

// Source of truth: src/lib/ventures.ts in the main Desktop app.
// Copied here so apps/onboarding stays deployable without pulling the
// Desktop venture registry into its bundle.
const BRANDS: Record<string, VentureBrand> = {
  mcv: {
    id: 'mcv', name: 'MCV One', tagline: 'Agentic Operating System',
    icon: 'M', brand: '#00F5FF', brandAccent: '#8B5CF6',
  },
  futurestate: {
    id: 'futurestate', name: 'FutureState', tagline: 'Real-World Asset Platform',
    icon: 'F', brand: '#6EE7B7', brandAccent: '#10B981',
  },
  betedge: {
    id: 'betedge', name: 'BetEdge AI', tagline: 'AI Sports Analytics',
    icon: 'B', brand: '#F59E0B', brandAccent: '#FBBF24',
  },
  warforge: {
    id: 'warforge', name: 'WarForge', tagline: 'Military-Strategy MMO',
    icon: 'W', brand: '#8B5CF6', brandAccent: '#C084FC',
  },
  mcvgg: {
    id: 'mcvgg', name: 'mcv.gg', tagline: 'Web3 Gaming Hub',
    icon: 'G', brand: '#F472B6', brandAccent: '#EC4899',
  },
  edgeiq: {
    id: 'edgeiq', name: 'EdgeIQ Markets', tagline: 'Trading Analytics',
    icon: 'E', brand: '#00F5FF', brandAccent: '#0284C7',
  },
  arqlabs: {
    id: 'arqlabs', name: 'ARQ Labs', tagline: 'Research & Development',
    icon: 'A', brand: '#A78BFA', brandAccent: '#7C3AED',
  },
};

export function getVentureBrand(id: string | null | undefined): VentureBrand {
  if (!id) return BRANDS.mcv;
  return BRANDS[id] ?? BRANDS.mcv;
}

export function listVentureBrands(): VentureBrand[] {
  return Object.values(BRANDS);
}

// Produces a style string for inline injection — keeps the venture
// brand active from first paint (no client flash).
export function ventureBrandStyleString(id: string | null | undefined): string {
  const brand = getVentureBrand(id);
  return `--brand: ${brand.brand}; --brand-accent: ${brand.brandAccent};`;
}
