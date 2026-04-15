import type { AdFormat } from '../types';

export const META_AD_FORMATS: AdFormat[] = [
  // ── Facebook Feed: Image ─────────────────────────────────────────
  {
    id: 'meta-ads:feed:image',
    platform: 'meta-ads',
    placement: 'feed',
    name: 'Facebook Feed: Image',
    mediaType: 'image',
    description:
      'Single image ad in the Facebook News Feed. The most common Meta ad format with broad reach.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 30,
      dimensions: [
        { width: 1080, height: 1080, label: 'Square (1:1) — Recommended' },
        { width: 1200, height: 628, label: 'Landscape (1.91:1)' },
      ],
    },
    textSpecs: [
      { field: 'primary_text', maxChars: 125, recommended: 125, notes: 'Text above the image; truncated after ~125 chars on mobile' },
      { field: 'headline', maxChars: 40, recommended: 40, notes: 'Bold text below the image' },
      { field: 'description', maxChars: 30, recommended: 30, notes: 'Additional text below headline; may not always display' },
    ],
    callToAction: ['Learn More', 'Shop Now', 'Sign Up', 'Download', 'Book Now', 'Contact Us', 'Get Offer', 'Subscribe'],
    tips: [
      'Use 1080x1080 square images for the best mobile feed experience.',
      'Keep text overlay under 20% of the image area for better delivery.',
      'Test multiple primary text lengths — short punchy copy often wins.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/image',
    verifiedAt: '2026-04-05',
  },

  // ── Facebook Feed: Video ─────────────────────────────────────────
  {
    id: 'meta-ads:feed:video',
    platform: 'meta-ads',
    placement: 'feed',
    name: 'Facebook Feed: Video',
    mediaType: 'video',
    description:
      'Video ad in the Facebook News Feed. Auto-plays on scroll with sound off by default.',
    videoSpec: {
      formats: ['mp4', 'mov'],
      maxFileSizeMb: 4096,
      minDurationSec: 1,
      maxDurationSec: 240,
      recommendedDurationSec: 15,
      dimensions: [
        { width: 1080, height: 1080, label: 'Square (1:1)' },
        { width: 1080, height: 1350, label: 'Portrait (4:5)' },
      ],
      captionsRecommended: true,
      audioRequired: false,
    },
    textSpecs: [
      { field: 'primary_text', maxChars: 125, recommended: 125 },
      { field: 'headline', maxChars: 40, recommended: 40 },
    ],
    callToAction: ['Learn More', 'Shop Now', 'Sign Up', 'Watch More', 'Get Offer'],
    tips: [
      'Capture attention in the first 3 seconds — most users scroll quickly.',
      'Design for sound-off viewing with captions and visual storytelling.',
      'Use 4:5 portrait aspect ratio to maximize mobile screen real estate.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/video',
    verifiedAt: '2026-04-05',
  },

  // ── Facebook Feed: Carousel ──────────────────────────────────────
  {
    id: 'meta-ads:feed:carousel',
    platform: 'meta-ads',
    placement: 'feed',
    name: 'Facebook Feed: Carousel',
    mediaType: 'carousel',
    description:
      'Swipeable carousel ad with 2-10 cards, each with its own image, headline, link, and CTA.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 30,
      dimensions: [
        { width: 1080, height: 1080, label: 'Square (1:1) per card' },
      ],
    },
    textSpecs: [
      { field: 'primary_text', maxChars: 125, recommended: 125, notes: 'Shared across all cards' },
      { field: 'headline', maxChars: 40, recommended: 40, notes: 'Per-card headline' },
      { field: 'description', maxChars: 20, recommended: 20, notes: 'Per-card link description' },
    ],
    callToAction: ['Learn More', 'Shop Now', 'See Menu', 'Book Now'],
    policyNotes: ['Minimum 2 cards, maximum 10 cards per carousel'],
    tips: [
      'Put your strongest card first — many users only see the first 1-2 cards.',
      'Use a consistent visual style across cards for a cohesive story.',
      'Enable automatic card ordering to let Meta optimize the sequence.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/carousel',
    verifiedAt: '2026-04-05',
  },

  // ── Facebook Stories: Image ──────────────────────────────────────
  {
    id: 'meta-ads:stories:image',
    platform: 'meta-ads',
    placement: 'stories',
    name: 'Facebook Stories: Image',
    mediaType: 'image',
    description:
      'Full-screen vertical image ad shown between Facebook Stories.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 30,
      dimensions: [
        { width: 1080, height: 1920, label: 'Full screen (9:16)' },
      ],
      aspectRatios: [{ ratio: '9:16' }],
    },
    textSpecs: [
      { field: 'text_overlay', maxChars: 125, recommended: 80, notes: 'Keep text brief — Stories are consumed quickly' },
    ],
    callToAction: ['Learn More', 'Shop Now', 'Swipe Up', 'Sign Up'],
    tips: [
      'Keep the top and bottom 14% of the creative clear of text for UI overlays.',
      'Use bold, readable fonts — Stories are viewed fast on small screens.',
      'Include your brand logo in the first frame for instant recognition.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/stories',
    verifiedAt: '2026-04-05',
  },

  // ── Facebook Stories: Video ──────────────────────────────────────
  {
    id: 'meta-ads:stories:video',
    platform: 'meta-ads',
    placement: 'stories',
    name: 'Facebook Stories: Video',
    mediaType: 'video',
    description:
      'Full-screen vertical video ad shown between Facebook Stories. Auto-plays with sound.',
    videoSpec: {
      formats: ['mp4', 'mov'],
      maxFileSizeMb: 4096,
      minDurationSec: 1,
      maxDurationSec: 120,
      recommendedDurationSec: 15,
      dimensions: [
        { width: 1080, height: 1920, label: 'Full screen (9:16)' },
      ],
      aspectRatios: [{ ratio: '9:16' }],
      captionsRecommended: true,
    },
    textSpecs: [],
    callToAction: ['Learn More', 'Shop Now', 'Swipe Up', 'Sign Up'],
    tips: [
      'Front-load your message — many users tap through Stories quickly.',
      'Use native-feeling content that blends with organic Stories.',
      'Keep videos under 15 seconds for highest completion rates.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/stories',
    verifiedAt: '2026-04-05',
  },

  // ── Facebook Reels: Video ────────────────────────────────────────
  {
    id: 'meta-ads:reels:video',
    platform: 'meta-ads',
    placement: 'reels',
    name: 'Facebook Reels: Video',
    mediaType: 'video',
    description:
      'Full-screen vertical video ad placed between Facebook Reels.',
    videoSpec: {
      formats: ['mp4', 'mov'],
      maxFileSizeMb: 4096,
      minDurationSec: 3,
      maxDurationSec: 90,
      recommendedDurationSec: 30,
      dimensions: [
        { width: 1080, height: 1920, label: 'Full screen (9:16)' },
      ],
      aspectRatios: [{ ratio: '9:16' }],
      captionsRecommended: true,
    },
    textSpecs: [],
    callToAction: ['Learn More', 'Shop Now', 'Sign Up', 'Download'],
    tips: [
      'Create content that feels native to the Reels format — fast-paced and entertaining.',
      'Use trending audio or music to boost engagement.',
      'Aim for 3-30 seconds; shorter Reels typically see higher completion.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/reels',
    verifiedAt: '2026-04-05',
  },

  // ── Instagram Feed: Image ────────────────────────────────────────
  {
    id: 'meta-ads:ig-feed:image',
    platform: 'meta-ads',
    placement: 'ig-feed',
    name: 'Instagram Feed: Image',
    mediaType: 'image',
    description:
      'Single image ad in the Instagram feed. Appears between organic posts.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 30,
      dimensions: [
        { width: 1080, height: 1080, label: 'Square (1:1)' },
      ],
    },
    textSpecs: [
      { field: 'caption', maxChars: 2200, recommended: 150, notes: 'Truncated after ~125 chars; full text shown on tap' },
      { field: 'hashtags', maxChars: 300, recommended: 150, notes: 'Max 30 hashtags; use a mix of broad and niche' },
    ],
    callToAction: ['Learn More', 'Shop Now', 'Sign Up', 'Book Now', 'Contact Us'],
    tips: [
      'Use high-quality, visually striking images that stop the scroll.',
      'Put the most important message in the first line of the caption.',
      'Test square (1:1) vs portrait (4:5) to see which drives more engagement.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/image/instagram-feed',
    verifiedAt: '2026-04-05',
  },

  // ── Instagram Feed: Video ────────────────────────────────────────
  {
    id: 'meta-ads:ig-feed:video',
    platform: 'meta-ads',
    placement: 'ig-feed',
    name: 'Instagram Feed: Video',
    mediaType: 'video',
    description:
      'Video ad in the Instagram feed. Auto-plays on scroll without sound.',
    videoSpec: {
      formats: ['mp4', 'mov'],
      maxFileSizeMb: 4096,
      minDurationSec: 3,
      maxDurationSec: 60,
      recommendedDurationSec: 15,
      dimensions: [
        { width: 1080, height: 1080, label: 'Square (1:1)' },
        { width: 1080, height: 1350, label: 'Portrait (4:5)' },
      ],
      captionsRecommended: true,
      audioRequired: false,
    },
    textSpecs: [
      { field: 'caption', maxChars: 2200, recommended: 150 },
    ],
    callToAction: ['Learn More', 'Shop Now', 'Sign Up', 'Watch More'],
    tips: [
      'Design for sound-off by default — add captions and text overlays.',
      'Use 4:5 portrait to take up more screen space in the feed.',
      'Keep the core message within the first 3-5 seconds.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/video/instagram-feed',
    verifiedAt: '2026-04-05',
  },

  // ── Instagram Stories: Image ─────────────────────────────────────
  {
    id: 'meta-ads:ig-stories:image',
    platform: 'meta-ads',
    placement: 'ig-stories',
    name: 'Instagram Stories: Image',
    mediaType: 'image',
    description:
      'Full-screen vertical image ad shown between Instagram Stories.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 30,
      dimensions: [
        { width: 1080, height: 1920, label: 'Full screen (9:16)' },
      ],
      aspectRatios: [{ ratio: '9:16' }],
    },
    textSpecs: [],
    callToAction: ['Learn More', 'Shop Now', 'Swipe Up', 'Sign Up', 'Book Now'],
    tips: [
      'Leave the top and bottom 14% free of critical content for platform UI.',
      'Use bold colors and minimal text for quick comprehension.',
      'Include a clear CTA sticker or arrow pointing to the swipe-up area.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/image/instagram-stories',
    verifiedAt: '2026-04-05',
  },

  // ── Instagram Stories: Video ─────────────────────────────────────
  {
    id: 'meta-ads:ig-stories:video',
    platform: 'meta-ads',
    placement: 'ig-stories',
    name: 'Instagram Stories: Video',
    mediaType: 'video',
    description:
      'Full-screen vertical video ad between Instagram Stories. Auto-plays with sound.',
    videoSpec: {
      formats: ['mp4', 'mov'],
      maxFileSizeMb: 4096,
      minDurationSec: 1,
      maxDurationSec: 120,
      recommendedDurationSec: 15,
      dimensions: [
        { width: 1080, height: 1920, label: 'Full screen (9:16)' },
      ],
      aspectRatios: [{ ratio: '9:16' }],
      captionsRecommended: true,
    },
    textSpecs: [],
    callToAction: ['Learn More', 'Shop Now', 'Swipe Up', 'Sign Up'],
    tips: [
      'Hook viewers in the first second — Stories move fast.',
      'Use native-style content with text overlays and stickers.',
      'Keep videos under 15 seconds; each segment auto-advances at 15s.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/video/instagram-stories',
    verifiedAt: '2026-04-05',
  },

  // ── Instagram Reels: Video ───────────────────────────────────────
  {
    id: 'meta-ads:ig-reels:video',
    platform: 'meta-ads',
    placement: 'ig-reels',
    name: 'Instagram Reels: Video',
    mediaType: 'video',
    description:
      'Full-screen vertical video ad placed between Instagram Reels.',
    videoSpec: {
      formats: ['mp4', 'mov'],
      maxFileSizeMb: 4096,
      minDurationSec: 3,
      maxDurationSec: 90,
      recommendedDurationSec: 30,
      dimensions: [
        { width: 1080, height: 1920, label: 'Full screen (9:16)' },
      ],
      aspectRatios: [{ ratio: '9:16' }],
      captionsRecommended: true,
    },
    textSpecs: [],
    callToAction: ['Learn More', 'Shop Now', 'Sign Up', 'Download'],
    tips: [
      'Match the energy and pacing of organic Reels content.',
      'Use trending audio tracks for higher engagement.',
      'Keep it between 5-15 seconds for the best view-through rates.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/reels/instagram-reels',
    verifiedAt: '2026-04-05',
  },

  // ── Instagram Explore: Image ─────────────────────────────────────
  {
    id: 'meta-ads:ig-explore:image',
    platform: 'meta-ads',
    placement: 'ig-explore',
    name: 'Instagram Explore: Image',
    mediaType: 'image',
    description:
      'Image ad shown in the Instagram Explore tab. Same specs as Instagram Feed image ads.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 30,
      dimensions: [
        { width: 1080, height: 1080, label: 'Square (1:1)' },
      ],
    },
    textSpecs: [
      { field: 'caption', maxChars: 2200, recommended: 150 },
      { field: 'hashtags', maxChars: 300, recommended: 150, notes: 'Max 30 hashtags' },
    ],
    callToAction: ['Learn More', 'Shop Now', 'Sign Up', 'Book Now'],
    tips: [
      'Explore users are in discovery mode — use aspirational, eye-catching visuals.',
      'Align creative with interest-based targeting for better relevance.',
      'Repurpose top-performing Feed creatives for Explore placement.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/image/instagram-explore',
    verifiedAt: '2026-04-05',
  },

  // ── Messenger: Image ─────────────────────────────────────────────
  {
    id: 'meta-ads:messenger:image',
    platform: 'meta-ads',
    placement: 'messenger',
    name: 'Messenger: Image',
    mediaType: 'image',
    description:
      'Image ad displayed in the Messenger inbox between conversations.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 30,
      dimensions: [
        { width: 1200, height: 628, label: 'Landscape (1.91:1)' },
      ],
    },
    textSpecs: [
      { field: 'headline', maxChars: 40, recommended: 40 },
      { field: 'primary_text', maxChars: 125, recommended: 125 },
    ],
    callToAction: ['Send Message', 'Learn More', 'Shop Now', 'Get Quote'],
    tips: [
      'Use a "Send Message" CTA to drive direct conversations with your business.',
      'Keep imagery personal and conversational to match the Messenger context.',
      'Set up automated responses or a chatbot to handle incoming messages.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/image/messenger-inbox',
    verifiedAt: '2026-04-05',
  },

  // ── Facebook Marketplace: Image ──────────────────────────────────
  {
    id: 'meta-ads:marketplace:image',
    platform: 'meta-ads',
    placement: 'marketplace',
    name: 'Facebook Marketplace: Image',
    mediaType: 'image',
    description:
      'Image ad shown in the Facebook Marketplace browse experience alongside organic listings.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 30,
      dimensions: [
        { width: 1200, height: 628, label: 'Landscape (1.91:1)' },
      ],
    },
    textSpecs: [
      { field: 'headline', maxChars: 40, recommended: 40 },
      { field: 'primary_text', maxChars: 125, recommended: 125 },
    ],
    callToAction: ['Shop Now', 'Learn More', 'Get Offer', 'See Menu'],
    tips: [
      'Use product-focused imagery that blends naturally with Marketplace listings.',
      'Include pricing in the ad copy to pre-qualify interested shoppers.',
      'Target local audiences for location-specific products and services.',
    ],
    docsUrl: 'https://www.facebook.com/business/ads-guide/image/facebook-marketplace',
    verifiedAt: '2026-04-05',
  },
];
