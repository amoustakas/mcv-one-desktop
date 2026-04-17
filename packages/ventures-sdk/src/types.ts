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

/**
 * Per-venture voice configuration — consumed by @mcv/voice-sdk's
 * VoiceRouter. Every venture picks a primary provider plus an ordered
 * fallback list so in-app voice degrades gracefully when the primary
 * provider times out or errors. Provider names are canonical strings
 * matching ProviderName in @mcv/voice-sdk.
 */
export type VentureVoiceProvider =
  | 'elevenlabs'
  | 'gemini-live'
  | 'vapi'
  | 'openai-realtime'
  | 'deepgram'
  | 'azure-speech'
  | 'xai-grok';

export interface VentureVoiceFeatures {
  /** Enable streaming TTS paths. Default true. */
  streaming?: boolean;
  /** Allow phone (PSTN/SIP) routing via Vapi for this venture. */
  phone?: boolean;
  /** Allow voice cloning (ElevenLabs / Azure custom voice). */
  cloning?: boolean;
  /** Force composite stack (STT + TTS) for highest-fidelity agents. */
  composite?: boolean;
}

export interface VentureVoiceConfig {
  primary: VentureVoiceProvider;
  fallback: VentureVoiceProvider[];
  features?: VentureVoiceFeatures;
  /** Monthly USD spend cap. Router alerts at 80%, rejects at 100%. */
  monthlySpendCapUsd?: number;
  /** Per-provider param overrides (voiceId, model, etc.). */
  overrides?: Partial<Record<VentureVoiceProvider, Record<string, unknown>>>;
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
  /** Voice stack config consumed by @mcv/voice-sdk's VoiceRouter. */
  voice?: VentureVoiceConfig;
}
