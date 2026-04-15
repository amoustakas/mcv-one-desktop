// MCV One — Ad Placement Intelligence System
// Twitter / X ad format specifications

import type { AdFormat } from '../types';

export const TWITTER_AD_FORMATS: AdFormat[] = [
  {
    id: 'twitter-ads:promoted-tweet:text',
    platform: 'twitter-ads',
    placement: 'timeline',
    name: 'Promoted Tweet: Text',
    mediaType: 'text',
    description: 'Text-only promoted tweet appearing in the timeline. No media attachment.',
    textSpecs: [
      { field: 'tweet_text', maxChars: 280, notes: 'Standard tweet character limit applies' },
    ],
    callToAction: ['Learn More', 'Shop Now', 'Sign Up', 'Subscribe', 'Visit Site'],
    tips: [
      'Keep tweets concise — shorter tweets (50-100 chars) tend to get higher engagement',
      'Include a clear call-to-action in the copy',
      'Use hashtags sparingly — 1-2 relevant hashtags max',
    ],
    docsUrl: 'https://business.x.com/en/help/campaign-setup/advertiser-card-specifications',
    verifiedAt: '2026-03-15',
  },
  {
    id: 'twitter-ads:promoted-tweet:image',
    platform: 'twitter-ads',
    placement: 'timeline',
    name: 'Promoted Tweet: Image',
    mediaType: 'image',
    description: 'Promoted tweet with a single image attachment. Supports landscape (1.91:1) or square (1:1) aspect ratios.',
    imageSpec: {
      formats: ['jpg', 'png', 'gif'],
      maxFileSizeMb: 5,
      dimensions: [
        { width: 800, height: 418, label: 'Landscape 1.91:1' },
        { width: 800, height: 800, label: 'Square 1:1' },
      ],
      aspectRatios: [
        { ratio: '1.91:1', minWidth: 800, minHeight: 418 },
        { ratio: '1:1', minWidth: 800, minHeight: 800 },
      ],
    },
    textSpecs: [
      { field: 'tweet_text', maxChars: 280, notes: 'Character limit shared with any links' },
    ],
    callToAction: ['Learn More', 'Shop Now', 'Sign Up', 'Subscribe', 'Visit Site', 'Book Now'],
    policyNotes: [
      'GIF images have a max file size of 15MB',
    ],
    tips: [
      'Use high-contrast images that stand out in the timeline',
      'Square images take up more vertical space on mobile, increasing visibility',
      'Avoid excessive text overlay on images',
    ],
    docsUrl: 'https://business.x.com/en/help/campaign-setup/advertiser-card-specifications',
    verifiedAt: '2026-03-15',
  },
  {
    id: 'twitter-ads:promoted-tweet:video',
    platform: 'twitter-ads',
    placement: 'timeline',
    name: 'Promoted Tweet: Video',
    mediaType: 'video',
    description: 'Promoted tweet with a video attachment. Videos auto-play on mute in the timeline.',
    videoSpec: {
      formats: ['mp4', 'mov'],
      maxFileSizeMb: 512,
      minWidth: 1280,
      minHeight: 720,
      aspectRatios: [
        { ratio: '16:9', minWidth: 1280, minHeight: 720 },
        { ratio: '1:1', minWidth: 720, minHeight: 720 },
      ],
      minDurationSec: 1,
      maxDurationSec: 140,
      recommendedDurationSec: 15,
      captionsRecommended: true,
    },
    textSpecs: [
      { field: 'tweet_text', maxChars: 280, notes: 'Character limit shared with any links' },
    ],
    callToAction: ['Learn More', 'Shop Now', 'Watch More', 'Sign Up', 'Visit Site'],
    tips: [
      'Front-load your message — capture attention in the first 3 seconds',
      'Design for sound-off viewing with captions or text overlays',
      '15 seconds is the recommended sweet spot for completion rates',
      'Include branding early since most viewers drop off after 10 seconds',
    ],
    docsUrl: 'https://business.x.com/en/help/campaign-setup/advertiser-card-specifications',
    verifiedAt: '2026-03-15',
  },
  {
    id: 'twitter-ads:promoted-tweet:carousel',
    platform: 'twitter-ads',
    placement: 'timeline',
    name: 'Promoted Tweet: Carousel',
    mediaType: 'carousel',
    description: 'Promoted tweet with 2-6 swipeable image cards. Each card can link to a different destination.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 5,
      dimensions: [
        { width: 800, height: 800, label: 'Card image (square)' },
      ],
      aspectRatios: [
        { ratio: '1:1', minWidth: 800, minHeight: 800 },
      ],
    },
    textSpecs: [
      { field: 'tweet_text', maxChars: 280, notes: 'Shared tweet text above the carousel' },
    ],
    callToAction: ['Learn More', 'Shop Now', 'Sign Up', 'Visit Site'],
    policyNotes: [
      'Minimum 2 cards, maximum 6 cards per carousel',
      'All cards must use the same aspect ratio',
    ],
    tips: [
      'Tell a sequential story across cards to encourage swiping',
      'Use the first card as a hook — it must stand alone in the feed',
      'Each card can have a unique URL for different product pages',
    ],
    docsUrl: 'https://business.x.com/en/help/campaign-setup/advertiser-card-specifications',
    verifiedAt: '2026-03-15',
  },
  {
    id: 'twitter-ads:image-ad',
    platform: 'twitter-ads',
    placement: 'timeline',
    name: 'Image Ad',
    mediaType: 'image',
    description: 'Standalone image ad with headline and website title. Drives traffic to a landing page.',
    imageSpec: {
      formats: ['jpg', 'png'],
      maxFileSizeMb: 5,
      dimensions: [
        { width: 800, height: 418, label: 'Landscape 1.91:1' },
        { width: 800, height: 800, label: 'Square 1:1' },
      ],
      aspectRatios: [
        { ratio: '1.91:1', minWidth: 800, minHeight: 418 },
        { ratio: '1:1', minWidth: 800, minHeight: 800 },
      ],
    },
    textSpecs: [
      { field: 'headline', maxChars: 70, notes: 'Displayed below the image' },
      { field: 'website_title', maxChars: 70, notes: 'Website card title' },
    ],
    callToAction: ['Learn More', 'Shop Now', 'Sign Up', 'Book Now', 'Download', 'Visit Site'],
    tips: [
      'Headlines are truncated on mobile — front-load key messaging',
      'Pair compelling imagery with a clear, action-oriented headline',
      'Test both landscape and square to find what works best for your audience',
    ],
    docsUrl: 'https://business.x.com/en/help/campaign-setup/advertiser-card-specifications',
    verifiedAt: '2026-03-15',
  },
  {
    id: 'twitter-ads:video-ad',
    platform: 'twitter-ads',
    placement: 'timeline',
    name: 'Video Ad',
    mediaType: 'video',
    description: 'Standalone video ad with headline. Supports landscape and portrait orientations.',
    videoSpec: {
      formats: ['mp4'],
      maxFileSizeMb: 1024,
      minWidth: 720,
      minHeight: 720,
      dimensions: [
        { width: 1280, height: 720, label: 'Landscape 16:9' },
        { width: 720, height: 1280, label: 'Portrait 9:16' },
      ],
      aspectRatios: [
        { ratio: '16:9', minWidth: 1280, minHeight: 720 },
        { ratio: '9:16', minWidth: 720, minHeight: 1280 },
      ],
      minDurationSec: 6,
      maxDurationSec: 60,
      recommendedDurationSec: 15,
      captionsRecommended: true,
    },
    textSpecs: [
      { field: 'headline', maxChars: 70, notes: 'Displayed below the video' },
    ],
    callToAction: ['Learn More', 'Watch More', 'Shop Now', 'Sign Up', 'Visit Site'],
    tips: [
      'Keep videos between 6-60 seconds for optimal delivery',
      'Use portrait (9:16) for mobile-first campaigns',
      'Add captions — most users scroll with sound off',
      'Include a strong opening frame since video auto-plays',
    ],
    docsUrl: 'https://business.x.com/en/help/campaign-setup/advertiser-card-specifications',
    verifiedAt: '2026-03-15',
  },
  {
    id: 'twitter-ads:amplify-preroll',
    platform: 'twitter-ads',
    placement: 'amplify',
    name: 'Twitter Amplify Pre-roll',
    mediaType: 'video',
    description: 'Pre-roll video ad shown before premium publisher video content via Twitter Amplify.',
    videoSpec: {
      formats: ['mp4'],
      maxFileSizeMb: 1024,
      minWidth: 1280,
      minHeight: 720,
      dimensions: [
        { width: 1280, height: 720, label: 'Landscape 16:9' },
      ],
      aspectRatios: [
        { ratio: '16:9', minWidth: 1280, minHeight: 720 },
      ],
      minDurationSec: 6,
      maxDurationSec: 15,
      recommendedDurationSec: 6,
      captionsRecommended: true,
    },
    textSpecs: [],
    callToAction: ['Learn More', 'Visit Site', 'Watch More'],
    policyNotes: [
      'No text overlay requirements for pre-roll creative',
      'Ads are skippable after 6 seconds',
    ],
    tips: [
      'Deliver your brand message within the first 6 seconds before skip',
      'Keep it short — 6-15 seconds performs best for pre-roll',
      'Align your creative with the publisher content category you target',
      'Design for sound-off with strong visual storytelling',
    ],
    docsUrl: 'https://business.x.com/en/help/campaign-setup/advertiser-card-specifications',
    verifiedAt: '2026-03-15',
  },
];
