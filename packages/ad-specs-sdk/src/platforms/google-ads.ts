import type { AdFormat } from '../types';

export const GOOGLE_AD_FORMATS: AdFormat[] = [
  // ── Google Search: Responsive Search Ad ──────────────────────────
  {
    id: 'google-ads:search:text',
    platform: 'google-ads',
    placement: 'search',
    name: 'Google Search: Responsive Search Ad',
    mediaType: 'text',
    description:
      'Text-based responsive search ad shown on Google Search results. Google dynamically assembles the best combination of headlines and descriptions.',
    textSpecs: [
      { field: 'headline', maxChars: 30, recommended: 30, notes: 'Provide up to 15 headlines; at least 3 required' },
      { field: 'description', maxChars: 90, recommended: 90, notes: 'Provide up to 4 descriptions; at least 2 required' },
    ],
    callToAction: ['Learn More', 'Sign Up', 'Get Quote', 'Shop Now', 'Contact Us', 'Apply Now'],
    tips: [
      'Pin important headlines to position 1 or 2 so they always show.',
      'Include keywords in at least 3 headlines for better ad strength.',
      'Use all 15 headline slots and 4 description slots for maximum rotation.',
    ],
    docsUrl: 'https://support.google.com/google-ads/answer/7684791',
    verifiedAt: '2026-04-05',
  },

  // ── Google Search: Call Ad ───────────────────────────────────────
  {
    id: 'google-ads:search-call:text',
    platform: 'google-ads',
    placement: 'search-call',
    name: 'Google Search: Call Ad',
    mediaType: 'text',
    description:
      'Call-only ad that encourages users to call your business directly from search results.',
    textSpecs: [
      { field: 'headline', maxChars: 25, recommended: 25, notes: 'Single headline shown above the phone number' },
      { field: 'business_name', maxChars: 25, recommended: 25 },
      { field: 'description', maxChars: 35, recommended: 35, notes: 'Up to 2 description lines' },
    ],
    callToAction: ['Call Now'],
    tips: [
      'Include your area code so users know the call is local.',
      'Schedule ads only during business hours when staff can answer.',
      'Use call reporting to track which keywords drive phone leads.',
    ],
    docsUrl: 'https://support.google.com/google-ads/answer/6341403',
    verifiedAt: '2026-04-05',
  },

  // ── Google Shopping: Product Listing Ad ──────────────────────────
  {
    id: 'google-ads:shopping:image',
    platform: 'google-ads',
    placement: 'shopping',
    name: 'Google Shopping: Product Listing Ad',
    mediaType: 'image',
    description:
      'Product listing ad shown in Google Shopping results and the Shopping tab, featuring a product image, title, price, and store name.',
    imageSpec: {
      formats: ['jpg', 'png', 'gif', 'bmp', 'tif'],
      maxFileSizeMb: 16,
      dimensions: [{ width: 800, height: 800, label: 'Square product image' }],
      minWidth: 100,
      minHeight: 100,
    },
    textSpecs: [
      { field: 'title', maxChars: 150, recommended: 70, notes: 'First 70 chars are most visible; include brand, product, and key attributes' },
      { field: 'description', maxChars: 5000, recommended: 500, notes: 'Detailed product description for Merchant Center feed' },
    ],
    tips: [
      'Use a clean white background for the main product image.',
      'Front-load the product title with brand and key attributes.',
      'Keep pricing and availability accurate to avoid disapprovals.',
    ],
    docsUrl: 'https://support.google.com/merchants/answer/7052112',
    verifiedAt: '2026-04-05',
  },

  // ── Performance Max: Image ───────────────────────────────────────
  {
    id: 'google-ads:pmax:image',
    platform: 'google-ads',
    placement: 'pmax',
    name: 'Performance Max: Image',
    mediaType: 'image',
    description:
      'Image assets for Performance Max campaigns, served across Search, Display, YouTube, Gmail, Discover, and Maps.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 5,
      dimensions: [
        { width: 1200, height: 628, label: 'Landscape (1.91:1)' },
        { width: 1200, height: 1200, label: 'Square (1:1)' },
        { width: 960, height: 1200, label: 'Portrait (4:5)' },
      ],
    },
    textSpecs: [
      { field: 'headline', maxChars: 30, recommended: 30, notes: 'Up to 5 headlines' },
      { field: 'long_headline', maxChars: 90, recommended: 90, notes: 'Up to 5 long headlines' },
      { field: 'description', maxChars: 90, recommended: 90, notes: 'Up to 5 descriptions' },
    ],
    callToAction: ['Automated', 'Learn More', 'Shop Now', 'Sign Up', 'Get Offer', 'Contact Us'],
    tips: [
      'Provide all three aspect ratios (landscape, square, portrait) for maximum reach.',
      'Avoid text overlays that cover more than 20% of the image.',
      'Upload at least 5 unique images per asset group for optimal rotation.',
    ],
    docsUrl: 'https://support.google.com/google-ads/answer/13543500',
    verifiedAt: '2026-04-05',
  },

  // ── Performance Max: Video ───────────────────────────────────────
  {
    id: 'google-ads:pmax:video',
    platform: 'google-ads',
    placement: 'pmax',
    name: 'Performance Max: Video',
    mediaType: 'video',
    description:
      'Video assets for Performance Max campaigns, shown on YouTube and across Google inventory.',
    videoSpec: {
      formats: ['mp4'],
      maxFileSizeMb: 256,
      minDurationSec: 10,
      recommendedDurationSec: 30,
      aspectRatios: [
        { ratio: '16:9', minWidth: 1920, minHeight: 1080 },
        { ratio: '9:16', minWidth: 1080, minHeight: 1920 },
        { ratio: '1:1', minWidth: 1080, minHeight: 1080 },
      ],
      captionsRecommended: true,
    },
    textSpecs: [
      { field: 'headline', maxChars: 30, recommended: 30 },
      { field: 'long_headline', maxChars: 90, recommended: 90 },
      { field: 'description', maxChars: 90, recommended: 90 },
    ],
    callToAction: ['Automated', 'Learn More', 'Shop Now', 'Sign Up', 'Get Offer'],
    tips: [
      'Provide horizontal, vertical, and square videos for full-coverage delivery.',
      'Hook the viewer in the first 5 seconds with a clear value proposition.',
      'Always add captions — most mobile viewers watch without sound.',
    ],
    docsUrl: 'https://support.google.com/google-ads/answer/13543500',
    verifiedAt: '2026-04-05',
  },

  // ── Discovery: Image ─────────────────────────────────────────────
  {
    id: 'google-ads:discovery:image',
    platform: 'google-ads',
    placement: 'discovery',
    name: 'Discovery: Image',
    mediaType: 'image',
    description:
      'Image ad shown across Google Discover feed, YouTube Home, and Gmail Promotions tab.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 5,
      dimensions: [
        { width: 1200, height: 628, label: 'Landscape (1.91:1)' },
        { width: 1200, height: 1200, label: 'Square (1:1)' },
      ],
    },
    textSpecs: [
      { field: 'headline', maxChars: 40, recommended: 40, notes: 'Up to 5 headlines' },
      { field: 'description', maxChars: 90, recommended: 90, notes: 'Up to 5 descriptions' },
    ],
    callToAction: ['Automated', 'Learn More', 'Shop Now', 'Sign Up', 'Get Offer', 'Apply Now'],
    tips: [
      'Use high-quality lifestyle imagery — Discovery placements are visually rich.',
      'Provide both landscape and square images for broader placement eligibility.',
      'Avoid generic stock photos; authentic product-in-use images perform better.',
    ],
    docsUrl: 'https://support.google.com/google-ads/answer/9904013',
    verifiedAt: '2026-04-05',
  },

  // ── App Campaign: Image ──────────────────────────────────────────
  {
    id: 'google-ads:app:image',
    platform: 'google-ads',
    placement: 'app',
    name: 'App Campaign: Image',
    mediaType: 'image',
    description:
      'Image assets for App campaigns promoting mobile app installs or engagement across Google Search, Play, YouTube, and Display.',
    imageSpec: {
      formats: ['jpg', 'png', 'gif'],
      maxFileSizeMb: 5,
      dimensions: [
        { width: 1200, height: 628, label: 'Landscape (1.91:1)' },
        { width: 1200, height: 1200, label: 'Square (1:1)' },
        { width: 320, height: 50, label: 'Banner' },
      ],
    },
    textSpecs: [
      { field: 'headline', maxChars: 30, recommended: 30, notes: 'Up to 5 headlines' },
      { field: 'description', maxChars: 90, recommended: 90, notes: 'Up to 5 descriptions' },
    ],
    callToAction: ['Install', 'Open', 'Play', 'Download'],
    tips: [
      'Show actual in-app screenshots highlighting core features.',
      'Include the 320x50 banner size — it unlocks mobile Display inventory.',
      'Test images with and without app-store badges to see what converts.',
    ],
    docsUrl: 'https://support.google.com/google-ads/answer/9234624',
    verifiedAt: '2026-04-05',
  },

  // ── App Campaign: Video ──────────────────────────────────────────
  {
    id: 'google-ads:app:video',
    platform: 'google-ads',
    placement: 'app',
    name: 'App Campaign: Video',
    mediaType: 'video',
    description:
      'Video assets for App campaigns shown primarily on YouTube and Display network to drive app installs.',
    videoSpec: {
      formats: ['mp4'],
      maxFileSizeMb: 100,
      minDurationSec: 10,
      maxDurationSec: 60,
      recommendedDurationSec: 30,
      aspectRatios: [
        { ratio: '16:9', minWidth: 1920, minHeight: 1080 },
        { ratio: '9:16', minWidth: 1080, minHeight: 1920 },
      ],
      captionsRecommended: true,
    },
    textSpecs: [
      { field: 'headline', maxChars: 30, recommended: 30 },
      { field: 'description', maxChars: 90, recommended: 90 },
    ],
    callToAction: ['Install', 'Download', 'Play', 'Open'],
    tips: [
      'Keep videos between 10-30 seconds for optimal completion rates.',
      'Show the app UI in action within the first 3 seconds.',
      'Provide both horizontal and vertical videos to cover YouTube and Shorts.',
    ],
    docsUrl: 'https://support.google.com/google-ads/answer/9234624',
    verifiedAt: '2026-04-05',
  },
];
