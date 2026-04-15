// @mcv/ventures-sdk/types — venture type definitions.
//
// The actual venture registry (the array of MCV's ventures) is app data,
// not SDK material. App-side src/lib/ventures.ts owns the data and the
// three convenience helpers (getVenture, getVenturesByStatus,
// getVenturesByCategory) — those are 11 LOC of array operations not worth
// abstracting.

export interface VentureSocials {
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  github?: string;
  linkedin?: string;
  youtube?: string;
}

export interface VentureTeamMember {
  name: string;
  role: string;
  avatar?: string;
}

export interface VentureCustomDomain {
  host: string;
  status?: 'pending' | 'verifying' | 'verified' | 'failed';
  verified_at?: string;
  vercel_id?: string;
}

export interface VentureWhiteLabel {
  clerkAppearance?: Record<string, unknown>;
  brandName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

export type VentureAssetKind = 'repo' | 'app' | 'domain' | 'doc' | 'integration' | 'social' | 'workspace';
export type VentureTier = 1 | 2 | 3;

export interface VentureAsset {
  id: string;
  venture_id: string;
  kind: VentureAssetKind;
  name: string;
  url?: string;
  meta: Record<string, unknown>;
  tier: VentureTier;
  discovered: boolean;
  confirmed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Venture {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  accent: string;
  domain: string;
  type: string;
  status: 'active' | 'development' | 'planned' | 'concept';
  systemPrompt: string;
  // Extended profile
  socials: VentureSocials;
  team: VentureTeamMember[];
  techStack: string[];
  founded: string;
  fundingStage: string;
  category: string;
  competitors: string[];
  keyMetrics: Record<string, string>;
  // Venture OS extensions (DB-backed; optional on legacy in-memory records)
  tier?: VentureTier;
  parentVentureId?: string;
  clerkOrgId?: string;
  customDomains?: VentureCustomDomain[];
  whiteLabel?: VentureWhiteLabel;
  docNamespace?: string;
  questState?: Record<string, unknown>;
}
