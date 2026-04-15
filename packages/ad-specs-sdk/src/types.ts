// MCV One — Ad Placement Intelligence System
// Core type definitions for the ad spec registry

/** Supported advertising platforms */
export type AdPlatform =
  | 'google-ads'
  | 'meta-ads'
  | 'microsoft-ads'
  | 'twitter-ads'
  | 'linkedin-ads'
  | 'tiktok-ads'
  | 'youtube-ads'
  | 'google-display-network';

/** Media type of the creative asset */
export type AdMediaType = 'image' | 'video' | 'text' | 'carousel' | 'html5' | 'responsive';

/** A single fixed dimension spec */
export interface AdDimension {
  width: number;
  height: number;
  label?: string;    // e.g. "Leaderboard", "Medium Rectangle"
}

/** Aspect ratio constraint */
export interface AdAspectRatio {
  ratio: string;       // e.g. "16:9", "1:1", "9:16"
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/** Text field constraints */
export interface AdTextSpec {
  field: string;          // e.g. "headline", "description", "primary_text"
  maxChars: number;
  minChars?: number;
  maxLines?: number;
  recommended?: number;
  notes?: string;
}

/** File/media constraints */
export interface AdFileSpec {
  formats: string[];         // e.g. ['jpg', 'png', 'gif']
  maxFileSizeMb: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatios?: AdAspectRatio[];
  dimensions?: AdDimension[];
}

/** Video-specific constraints */
export interface AdVideoSpec extends AdFileSpec {
  minDurationSec?: number;
  maxDurationSec?: number;
  recommendedDurationSec?: number;
  minBitrate?: number;
  maxBitrate?: number;
  frameRates?: number[];
  audioRequired?: boolean;
  captionsRecommended?: boolean;
}

/** A complete ad format definition */
export interface AdFormat {
  id: string;                   // unique: 'meta-ads:feed:image'
  platform: AdPlatform;
  placement: string;            // 'feed', 'stories', 'search', etc.
  name: string;                 // "Facebook Feed Image Ad"
  mediaType: AdMediaType;
  description: string;
  imageSpec?: AdFileSpec;
  videoSpec?: AdVideoSpec;
  textSpecs: AdTextSpec[];
  callToAction?: string[];
  policyNotes?: string[];
  tips?: string[];
  docsUrl?: string;
  verifiedAt?: string;          // ISO date
}

/** Compliance result for a single rule */
export interface ComplianceResult {
  rule: string;
  field: string;
  passed: boolean;
  actual: string | number;
  expected: string;
  severity: 'error' | 'warning' | 'info';
}

/** Full compliance report for a creative against a format */
export interface ComplianceReport {
  format: AdFormat;
  results: ComplianceResult[];
  passed: boolean;
  warnings: number;
  errors: number;
}

/** A creative asset being validated */
export interface CreativeAsset {
  name: string;
  mediaType: AdMediaType;
  imageUrl?: string;
  videoUrl?: string;
  width?: number;
  height?: number;
  fileSizeMb?: number;
  durationSec?: number;
  fileFormat?: string;
  texts: Record<string, string>;
}

/** Platform metadata for UI */
export interface PlatformMeta {
  id: AdPlatform;
  name: string;
  shortName: string;
  color: string;
  icon: string;   // lucide icon name
}

export const PLATFORM_META: Record<AdPlatform, PlatformMeta> = {
  'google-ads': { id: 'google-ads', name: 'Google Ads', shortName: 'Google', color: '#4285F4', icon: 'Search' },
  'meta-ads': { id: 'meta-ads', name: 'Meta Ads', shortName: 'Meta', color: '#1877F2', icon: 'Facebook' },
  'microsoft-ads': { id: 'microsoft-ads', name: 'Microsoft Ads', shortName: 'Bing', color: '#00A4EF', icon: 'Globe' },
  'twitter-ads': { id: 'twitter-ads', name: 'X / Twitter Ads', shortName: 'X', color: '#000000', icon: 'Twitter' },
  'linkedin-ads': { id: 'linkedin-ads', name: 'LinkedIn Ads', shortName: 'LinkedIn', color: '#0A66C2', icon: 'Linkedin' },
  'tiktok-ads': { id: 'tiktok-ads', name: 'TikTok Ads', shortName: 'TikTok', color: '#FE2C55', icon: 'Music' },
  'youtube-ads': { id: 'youtube-ads', name: 'YouTube Ads', shortName: 'YouTube', color: '#FF0000', icon: 'Youtube' },
  'google-display-network': { id: 'google-display-network', name: 'Google Display Network', shortName: 'GDN', color: '#34A853', icon: 'LayoutGrid' },
};
