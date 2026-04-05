import type { AdFormat } from '../types';

export const MICROSOFT_AD_FORMATS: AdFormat[] = [
  // ── Bing Search: Responsive Search Ad ────────────────────────────
  {
    id: 'microsoft-ads:search:text',
    platform: 'microsoft-ads',
    placement: 'search',
    name: 'Bing Search: Responsive Search Ad',
    mediaType: 'text',
    description:
      'Responsive text ad on Bing search results. Microsoft dynamically tests combinations of headlines and descriptions for optimal performance.',
    textSpecs: [
      { field: 'headline', maxChars: 30, recommended: 30, notes: 'Provide 3–15 headlines; at least 3 required' },
      { field: 'description', maxChars: 90, recommended: 90, notes: 'Provide 2–4 descriptions; at least 2 required' },
    ],
    callToAction: ['Learn More', 'Sign Up', 'Get Quote', 'Shop Now', 'Contact Us', 'Apply Now', 'Download'],
    tips: [
      'Use all 15 headline slots for maximum combination testing.',
      'Pin your brand name to headline position 1 for consistent branding.',
      'Include location or price qualifiers to improve click-through quality.',
    ],
    docsUrl: 'https://help.ads.microsoft.com/apex/index/3/en/60037',
    verifiedAt: '2026-04-05',
  },

  // ── Bing Search: Expanded Text Ad ────────────────────────────────
  {
    id: 'microsoft-ads:search-expanded:text',
    platform: 'microsoft-ads',
    placement: 'search-expanded',
    name: 'Bing Search: Expanded Text Ad',
    mediaType: 'text',
    description:
      'Legacy expanded text ad on Bing with fixed headline and description positions. New creation is restricted — migrate to Responsive Search Ads.',
    textSpecs: [
      { field: 'headline1', maxChars: 30, recommended: 30 },
      { field: 'headline2', maxChars: 30, recommended: 30 },
      { field: 'headline3', maxChars: 30, recommended: 30, notes: 'Optional third headline' },
      { field: 'description1', maxChars: 90, recommended: 90 },
      { field: 'description2', maxChars: 90, recommended: 90, notes: 'Optional second description' },
    ],
    policyNotes: ['New expanded text ads can no longer be created as of February 2023; existing ads still serve'],
    tips: [
      'Migrate to Responsive Search Ads for better performance and reach.',
      'If still running, monitor impression share — expanded text ads may lose auction priority.',
      'Use ad customizers in headlines to dynamically insert keywords or countdowns.',
    ],
    docsUrl: 'https://help.ads.microsoft.com/apex/index/3/en/56797',
    verifiedAt: '2026-04-05',
  },

  // ── Audience Network: Image ──────────────────────────────────────
  {
    id: 'microsoft-ads:audience:image',
    platform: 'microsoft-ads',
    placement: 'audience',
    name: 'Audience Network: Image',
    mediaType: 'image',
    description:
      'Image ad served across the Microsoft Audience Network, including MSN, Outlook, and partner sites.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 5,
      dimensions: [
        { width: 1200, height: 628, label: 'Landscape (1.91:1)' },
        { width: 1200, height: 1200, label: 'Square (1:1)' },
      ],
    },
    textSpecs: [
      { field: 'headline', maxChars: 40, recommended: 30, notes: 'Short headlines perform best in native placements' },
      { field: 'description', maxChars: 90, recommended: 90 },
    ],
    callToAction: ['Learn More', 'Shop Now', 'Sign Up', 'Download', 'Get Started', 'Subscribe'],
    tips: [
      'Provide both landscape and square images for maximum placement coverage.',
      'Use high-quality lifestyle imagery — Audience Network placements are visually prominent.',
      'Test multiple headline/description combos; Microsoft auto-optimizes the best performers.',
    ],
    docsUrl: 'https://help.ads.microsoft.com/apex/index/3/en/56889',
    verifiedAt: '2026-04-05',
  },

  // ── Audience Network: Native ─────────────────────────────────────
  {
    id: 'microsoft-ads:audience-native:image',
    platform: 'microsoft-ads',
    placement: 'audience-native',
    name: 'Audience Network: Native',
    mediaType: 'image',
    description:
      'Native ad that blends into editorial content across MSN, Outlook.com, and Microsoft Edge new tab page.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 5,
      dimensions: [
        { width: 1200, height: 628, label: 'Landscape (1.91:1)' },
      ],
    },
    textSpecs: [
      { field: 'headline', maxChars: 25, recommended: 25, notes: 'Shorter headlines required for native rendering' },
      { field: 'description', maxChars: 90, recommended: 90 },
    ],
    callToAction: ['Learn More', 'Read More', 'Shop Now', 'Explore'],
    tips: [
      'Write headlines that read like editorial content, not ad copy.',
      'Use natural, authentic imagery rather than polished product shots.',
      'Align your landing page content with the native ad promise to reduce bounce.',
    ],
    docsUrl: 'https://help.ads.microsoft.com/apex/index/3/en/56889',
    verifiedAt: '2026-04-05',
  },

  // ── Shopping: Product Ad ─────────────────────────────────────────
  {
    id: 'microsoft-ads:shopping:image',
    platform: 'microsoft-ads',
    placement: 'shopping',
    name: 'Shopping: Product Ad',
    mediaType: 'image',
    description:
      'Product ad shown in Bing Shopping results featuring an image, title, price, and merchant name from your product feed.',
    imageSpec: {
      formats: ['jpg', 'png', 'gif', 'bmp'],
      maxFileSizeMb: 10,
      minWidth: 220,
      minHeight: 220,
    },
    textSpecs: [
      { field: 'title', maxChars: 150, recommended: 70, notes: 'First 70 chars most visible; front-load brand and key attributes' },
      { field: 'description', maxChars: 5000, recommended: 500, notes: 'Detailed product description from Merchant Center feed' },
    ],
    tips: [
      'Use clean white backgrounds for product images — minimum 220x220 pixels.',
      'Include brand name, color, and size in the product title for search relevance.',
      'Keep your feed pricing and availability synced to avoid disapprovals.',
    ],
    docsUrl: 'https://help.ads.microsoft.com/apex/index/3/en/51083',
    verifiedAt: '2026-04-05',
  },
];
